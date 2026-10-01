// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { consume, record } from "../../runtime/interface/git-authorize.mjs";

const roots = [];
const ORIGINAL_CWD = process.cwd();

const git = (cwd, args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function tempRoot(prefix) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  return root;
}

const rejection = (promise) => promise.then(() => null, (error) => error);

/** 递归列出目录下全部文件（排除 .git 内部），用于发现新落盘的授权记录。 */
function walkFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(path, acc);
    else acc.push(path);
  }
  return acc;
}

/** 建临时 git 仓库并 chdir 进去；返回恢复函数。工具签名不含目录参数，记录落盘位置相对 cwd。 */
function useGitRepo() {
  const root = tempRoot("wh-git-authorize-");
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  process.chdir(repo);
  return repo;
}

afterEach(() => {
  process.chdir(ORIGINAL_CWD);
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("git-authorize record/consume (ADR-020, HEAD-only)", () => {
  it("record writes branch and HEAD into a discoverable file", async () => {
    const repo = useGitRepo();
    const head = git(repo, ["rev-parse", "HEAD"]);
    const before = new Set(walkFiles(repo));
    await record({ operation: "commit", confirmationRef: "confirm-1" });
    const created = walkFiles(repo).filter((path) => !before.has(path));
    expect(created.length).toBeGreaterThan(0);
    const text = created.map((path) => readFileSync(path, "utf8")).join("\n");
    expect(text).toContain("commit");
    expect(text).toContain("confirm-1");
    expect(text).toContain("main");
    expect(text).toContain(head);
  });

  it("consume without any recorded authorization fails with IRREVERSIBLE_AUTHORIZATION_REQUIRED", async () => {
    useGitRepo();
    const error = await rejection(consume({ operation: "commit", stepId: "step-1" }));
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("IRREVERSIBLE_AUTHORIZATION_REQUIRED");
  });

  it("consume succeeds once, retries of the same step are idempotent, and another step is rejected", async () => {
    useGitRepo();
    await record({ operation: "commit", confirmationRef: "confirm-2" });
    const first = await consume({ operation: "commit", stepId: "step-1" });
    const retry = await consume({ operation: "commit", stepId: "step-1" });
    expect(retry).toEqual(first);
    const error = await rejection(consume({ operation: "commit", stepId: "step-2" }));
    expect(error).toBeInstanceOf(Error);
    expect(typeof error.code).toBe("string");
    expect(error.code.length).toBeGreaterThan(0);
  });

  it("consume fails with AUTHORIZATION_HEAD_MISMATCH after HEAD moves", async () => {
    const repo = useGitRepo();
    await record({ operation: "commit", confirmationRef: "confirm-3" });
    writeFileSync(join(repo, "change.md"), "new head\n");
    git(repo, ["add", "."]);
    git(repo, ["commit", "-qm", "move head"]);
    const error = await rejection(consume({ operation: "commit", stepId: "step-1" }));
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("AUTHORIZATION_HEAD_MISMATCH");
  });

  it("rejects operations outside commit/push/merge/archive/cleanup", async () => {
    useGitRepo();
    const error = await rejection(record({ operation: "rebase", confirmationRef: "confirm-4" }));
    expect(error).toBeInstanceOf(Error);
    expect(typeof error.code).toBe("string");
    expect(error.code.length).toBeGreaterThan(0);
    await record({ operation: "push", confirmationRef: "confirm-5" });
    const bad = await rejection(consume({ operation: "publish", stepId: "step-1" }));
    expect(bad).toBeInstanceOf(Error);
    expect(typeof bad.code).toBe("string");
    expect(bad.code.length).toBeGreaterThan(0);
  });
});
