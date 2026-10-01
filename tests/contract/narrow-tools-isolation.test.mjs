// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
//
// AC-28 反证：runtime/interface/ 下的 5 个窄工具
// （safe-write / record-lock / workspace-check / run-command / git-authorize）
// 必须零第三方依赖——除 node: 内建外不得 import 仓库内任何模块。
// 验证方法：把这 5 个文件拷进一个不含 node_modules 的临时目录，
// 用动态 import() 逐个加载并做一次最小真实调用，必须全部成功。
// 反证对照：同法拷贝 runtime/task/workspace-runner.mjs（它 import 仓库相对模块
// ../../runtime/task/workspace.mjs），在临时目录里必须报 ERR_MODULE_NOT_FOUND。
// human-confirm.mjs 是第 6 个工具（P1），不在 AC-28 的 5 个反证名单内。
import { execFileSync } from "node:child_process";

import { afterEach, describe, expect, it } from "vitest";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const roots = [];
const ORIGINAL_CWD = process.cwd();

const REPO_INTERFACE = fileURLToPath(new URL("../../runtime/interface/", import.meta.url));
const WORKSPACE_RUNNER = fileURLToPath(new URL("../../runtime/task/workspace-runner.mjs", import.meta.url));

const ISOLATED_TOOLS = [
  "safe-write.mjs",
  "record-lock.mjs",
  "workspace-check.mjs",
  "run-command.mjs",
  "git-authorize.mjs",
];

const git = (cwd, args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function tempRoot(prefix) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  return root;
}

afterEach(() => {
  process.chdir(ORIGINAL_CWD);
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("narrow tools isolation (AC-28)", () => {
  it("loads all five tools via dynamic import in a node_modules-free temp dir and survives minimal real calls", async () => {
    const sandbox = join(tempRoot("wh-isolation-"), "tools-only");
    mkdirSync(sandbox);
    for (const name of ISOLATED_TOOLS) {
      copyFileSync(join(REPO_INTERFACE, name), join(sandbox, name));
    }
    // 沙箱内不得存在 node_modules（本断言防回归：谁都不许往里塞依赖目录）。
    expect(existsSync(join(sandbox, "node_modules"))).toBe(false);

    const load = (name) => import(pathToFileURL(join(sandbox, name)).href);

    // ① safe-write：真实写一文件。
    const safeWrite = await load("safe-write.mjs");
    await safeWrite.writeFileAtomic(sandbox, "probe-safe-write.txt", Buffer.from("ok"));
    expect(existsSync(join(sandbox, "probe-safe-write.txt"))).toBe(true);

    // ② record-lock：真实持锁跑一次回调。
    const recordLock = await load("record-lock.mjs");
    await expect(recordLock.withLock(sandbox, "probe", async () => "held")).resolves.toBe("held");

    // ③ workspace-check：真实 git 主仓 + 已注册 worktree 夹具（放沙箱内，保持沙箱自给自足）。
    const fixture = join(sandbox, "fixture");
    mkdirSync(fixture);
    git(fixture, ["init", "-q", "-b", "main"]);
    git(fixture, ["config", "user.name", "WorkflowHub tests"]);
    git(fixture, ["config", "user.email", "tests@workflowhub.local"]);
    // 需要至少一次提交才能挂 worktree。
    writeFileSync(join(fixture, "README.md"), "baseline\n");
    git(fixture, ["add", "."]);
    git(fixture, ["commit", "-qm", "baseline"]);
    const baseline = git(fixture, ["rev-parse", "HEAD"]);
    const target = join(fixture, "workspace");
    git(fixture, ["worktree", "add", target, "-b", "task-branch"]);
    const workspaceCheck = await load("workspace-check.mjs");
    const inspected = await workspaceCheck.inspectWorkspace({ root: fixture, target, baseline, expectBranch: "task-branch" });
    expect(inspected.registered).toBe(true);

    // ④ run-command：真实捕获一条命令。
    const runCommand = await load("run-command.mjs");
    const recordDir = join(sandbox, "records");
    mkdirSync(recordDir);
    const captured = await runCommand.captureCommand({
      cwd: sandbox,
      recordDir,
      slug: "probe",
      argv: [process.execPath, "-e", "process.exit(0)"],
      timeoutMs: 10000,
    });
    expect(captured.exit).toBe(0);

    // ⑤ git-authorize：真实记录并消费一次授权。
    process.chdir(target);
    const gitAuthorize = await load("git-authorize.mjs");
    await gitAuthorize.record({ operation: "commit", confirmationRef: "iso-confirm" });
    const consumed = await gitAuthorize.consume({ operation: "commit", stepId: "iso-step" });
    expect(consumed).toBeTypeOf("object");
  });

  it("control: runtime/task/workspace-runner.mjs copied the same way must fail with ERR_MODULE_NOT_FOUND", async () => {
    const sandbox = join(tempRoot("wh-isolation-"), "control");
    mkdirSync(sandbox);
    // 反证前提（当前事实）：workspace-runner.mjs import 仓库相对模块
    // ../../runtime/task/workspace.mjs。若未来它被改成零依赖，本用例由绿变红
    // 即触发 test change request，不得悄悄改断言。
    copyFileSync(WORKSPACE_RUNNER, join(sandbox, "workspace-runner.mjs"));
    // 用子进程 node 执行同一动态 import：vitest 的 vite-node 会拦截进程内
    // import() 并改写模块解析语义，AC-28 断言的是 Node 原生 ESM 行为。
    writeFileSync(join(sandbox, "probe.mjs"), 'await import("./workspace-runner.mjs");\nconsole.log("loaded");\n');
    let child = null;
    try {
      execFileSync(process.execPath, [join(sandbox, "probe.mjs")], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      child = error;
    }
    expect(child).not.toBeNull();
    expect(child.stderr).toContain("ERR_MODULE_NOT_FOUND");
  });
});
