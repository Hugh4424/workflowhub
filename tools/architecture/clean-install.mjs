import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { listDeliveryFiles, listUntrackedFiles } from "./inventory.mjs";

import { buildRunnerRelease, installRunnerRelease, validateRunnerRelease } from "../../runtime/distribution/runner-release.mjs";
import { buildSkillBundleRelease, validateSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";
import { resolveStageSkillPackages } from "../../runtime/stage/stage-skill-runtime.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const CLEAN_INSTALL_MATERIALS = Object.freeze({
  "decision-log.md": "# Decision log\n\n## 核心目标\n在干净安装的 Runner 上执行一个五阶段任务样例。\n\n## 范围\n只验证仓内 workflow、显式 task 身份和 public runtime。\n\n## 非目标\n不调用 provider，不读取宿主 transcript。\n\n## 风险与延期交接\nStage Agent 结果缺失时保留 unavailable。\n\n## 验收标准\n- AC-CLEAN-001：五个 public stage 都返回结构化结果。\n",
  "spec.md": "# Clean-install task specification\n\n## 2. 背景、目标与范围\n验证已安装 Runner 能执行当前五阶段入口。\n\n## 5. 功能需求\n- **FR-CLEAN-001**：五阶段 public runtime 必须按顺序可调用。\n\n## 9. 验收标准\n- [ ] **AC-CLEAN-001**：五个 public stage 都返回结构化结果。\n  场景：在隔离 task 中按顺序调用五个 stage。\n  验证：每次调用退出码为 0 且返回当前 stage。\n  失败：任一调用失败或返回错误 stage。\n\n## 10. 风险、未决与交接\n缺少 Stage Agent 结果时只记录质量不完整，不伪造 provider 通过。\n",
  "plan.md": "# Clean-install task plan\n\n## Technical Context\n使用已安装 Runner 和仓内 workflow。\n\n## Global Constraints\n调用方显式提供 project/task；不读取宿主 transcript。\n\n## Modules, Interfaces, and Data Contracts\n使用现有 task-bootstrap、artifact 和 public stage-runtime。\n\n## Implementation Order\n先写四份材料，再按五阶段顺序执行。\n\n## Test Strategy\n逐阶段检查退出码、返回 stage 和质量记录。\n\n## Rollback and Recovery\n隔离临时目录在命令结束后删除。\n\n## FR to AC to Step Traceability\nFR-CLEAN-001 -> AC-CLEAN-001 -> T001。\n\n## Constitution Check\nF1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11。\n",
  "tasks.md": "# Clean-install task list\n\n## Phase 1: five-stage task sample\n### Goal\n验证已安装 Runner 的五阶段 public runtime。\n### Files\n- **MODIFY**: `README.md`\n### Tasks\n- T001：按顺序执行五个 public stage。\n### Verify\n检查五次调用的退出码、返回 stage 和质量事实。\n### Knowledge\n保留 clean-install 输出摘要。\n### STOP\n任一阶段失败时停止并保留真实错误。\n\n### T001 - execute five public stages\n- **ID**：T001\n- **动作**：写入四份材料并按五阶段顺序调用 public runtime。\n- **精确文件**：`README.md`\n- **输入**：已安装 Runner、隔离 task 和四份当前材料。\n- **输出**：五次结构化 stage 结果。\n- **依赖**：none\n- **并行**：否\n- **FR**：FR-CLEAN-001\n- **AC**：AC-CLEAN-001\n- **gate_cmd**：`node tools/cli/stage-runtime.mjs run --action=execute`\n- **expected_exit**：0\n- **oracle**：五个 stage 返回当前 stage 且质量事实已写入。\n- **evidence_path**：quality/tests/clean-install-five-stage.json\n",
});

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function sourceContentHash(root = ROOT) {
  const files = listDeliveryFiles({ root });
  const payload = files.map((file) => `${file}\0${sha256(fs.readFileSync(path.join(root, file)))}\n`).join("");
  return sha256(payload);
}

function untrackedAudit(root) {
  const files = listUntrackedFiles({ root });
  return Object.freeze({
    files,
    content_hash: sha256(files.map((file) => `${file}\0${sha256(fs.readFileSync(path.join(root, file)))}\n`).join("")),
  });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { ...options, encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.error?.message ?? result.stderr ?? `exit ${result.status}`}`);
  }
  return result;
}

function initTarget(target) {
  run("git", ["init", "-q", "-b", "main"], { cwd: target });
  run("git", ["config", "user.name", "WorkflowHub clean-install"], { cwd: target });
  run("git", ["config", "user.email", "clean-install@workflowhub.invalid"], { cwd: target });
  run("git", ["commit", "--allow-empty", "-qm", "clean-install baseline"], { cwd: target });
}

function fileHash(root, locator) {
  return sha256(fs.readFileSync(path.join(root, locator)));
}

function assertReleasedSourceInput({ sourceRoot, releaseRoot, locator }) {
  const sourceHash = fileHash(sourceRoot, locator);
  const releaseHash = fileHash(releaseRoot, locator);
  if (sourceHash !== releaseHash) throw new Error(`released source hash mismatch: ${locator}`);
  return sourceHash;
}

/**
 * Resolve every real workflow manifest and portable skill package from the
 * installed release without invoking a host/provider.
 */
export async function smokeReleasedStageDependencies({ sourceRoot, runnerRoot, bundleRoot } = {}) {
  const source = fs.realpathSync(sourceRoot);
  const runner = fs.realpathSync(runnerRoot);
  const bundle = fs.realpathSync(bundleRoot);
  const releaseFilesBefore = {
    runner_manifest: fileHash(runner, "runner-release.json"),
    skill_manifest: fileHash(bundle, "skill-bundle.json"),
  };
  const stages = [];
  for (const stage of STAGES) {
    const manifestLocator = `workflows/${stage}/skill-deps.yaml`;
    const skillLocator = `workflows/${stage}/SKILL.md`;
    const manifestHash = assertReleasedSourceInput({ sourceRoot: source, releaseRoot: runner, locator: manifestLocator });
    const skillHash = assertReleasedSourceInput({ sourceRoot: source, releaseRoot: runner, locator: skillLocator });
    const prepared = resolveStageSkillPackages({
      packageRoot: runner,
      stage,
    });
    const dependencies = prepared.manifest.skills.map((dependency) => {
      const payload = prepared.payloads.get(dependency.name);
      if (!payload || !/^[a-f0-9]{64}$/.test(payload.bundle_hash ?? "")) {
        throw new Error(`${stage}/${dependency.name}: released dependency did not resolve`);
      }
      const dependencyHash = assertReleasedSourceInput({
        sourceRoot: source,
        releaseRoot: runner,
        locator: dependency.path,
      });
      return {
        name: dependency.name,
        declared_trigger: dependency.trigger,
        source_skill_hash: dependencyHash,
        bundle_hash: payload.bundle_hash,
      };
    });
    if (dependencies.length === 0) throw new Error(`${stage}: released workflow has no declared skills`);
    stages.push({ stage, manifest_hash: manifestHash, skill_hash: skillHash, dependencies });
  }
  const releaseFilesAfter = {
    runner_manifest: fileHash(runner, "runner-release.json"),
    skill_manifest: fileHash(bundle, "skill-bundle.json"),
  };
  if (JSON.stringify(releaseFilesBefore) !== JSON.stringify(releaseFilesAfter)) {
    throw new Error("released manifests changed during no-provider dependency smoke");
  }
  return Object.freeze({
    status: "passed",
    mode: "no_provider_package_resolution",
    stages,
    release_inputs_unchanged: true,
  });
}

/**
 * Exercise the installed public Runner with one deterministic five-stage task.
 * The task intentionally has no provider result; each stage must still run
 * through its official public route and preserve unavailable quality facts.
 */
export function runInstalledFiveStageTask({ runtime, targetRoot, taskPath, worktreeRoot, env, project = "CleanInstall", task = "release-smoke" } = {}) {
  if (![runtime, targetRoot, taskPath, worktreeRoot].every((value) => typeof value === "string" && value.trim() !== "")) {
    throw new TypeError("five-stage clean-install task requires runtime, targetRoot, taskPath, and worktreeRoot");
  }
  const artifactRoot = path.join(worktreeRoot, "specs", task);
  fs.mkdirSync(artifactRoot, { recursive: true });
  for (const [name, content] of Object.entries(CLEAN_INSTALL_MATERIALS)) {
    fs.writeFileSync(path.join(artifactRoot, name), content, "utf8");
  }
  const stages = STAGES.map((stage) => {
    const execution = run(process.execPath, [runtime, "run", "--action=execute", `--stage=${stage}`,
      `--project=${project}`, `--task=${task}`], { cwd: targetRoot, env });
    if (execution.status !== 0) {
      const detail = String(execution.stderr ?? execution.stdout ?? "").trim().slice(0, 1000);
      throw new Error(`installed ${stage} exited with ${execution.status}${detail ? `: ${detail}` : ""}`);
    }
    let result;
    try { result = JSON.parse(execution.stdout); }
    catch (error) { throw new Error(`installed ${stage} result is not valid JSON: ${error.message}`); }
    if (result.stage !== stage) throw new Error(`installed ${stage} result returned ${result.stage ?? "no stage"}`);
    return {
      stage,
      exit_code: execution.status,
      status: result.status ?? null,
      work_status: result.work_status ?? null,
      quality_status: result.quality_status ?? null,
    };
  });
  const qualityRoot = path.join(taskPath, "quality", "facts");
  const qualityFacts = fs.existsSync(qualityRoot)
    ? fs.readdirSync(qualityRoot).filter((name) => /^[a-f0-9]{64}\.json$/.test(name)).sort()
    : [];
  if (qualityFacts.length < STAGES.length) {
    throw new Error(`five-stage task wrote ${qualityFacts.length} quality facts; expected at least ${STAGES.length}`);
  }
  return Object.freeze({
    status: "passed",
    run_from_installed_runner: true,
    stage_count: stages.length,
    stages,
    material_files: Object.keys(CLEAN_INSTALL_MATERIALS),
    quality_fact_count: qualityFacts.length,
  });
}

function parseArgs(argv) {
  const runAllChecks = argv.length === 0;
  return Object.freeze({
    verifyRunner: runAllChecks || argv.includes("--verify-runner"),
    verifySkillBundle: runAllChecks || argv.includes("--verify-skill-bundle"),
    verifyMulticaLayout: runAllChecks || argv.includes("--verify-multica-layout"),
    verifyCurrentTree: runAllChecks || argv.includes("--verify-current-tree"),
    verifyFiveStageTask: runAllChecks || argv.includes("--verify-five-stage-task"),
  });
}

export async function cleanInstall({ packageRoot = ROOT, verifyRunner = true, verifySkillBundle = true, verifyMulticaLayout = true, verifyFiveStageTask = true, verifyCurrentTree = true } = {}) {
  const root = fs.realpathSync(packageRoot);
  if (verifyFiveStageTask && (!verifyRunner || !verifySkillBundle)) {
    throw new Error("five-stage clean-install task requires runner and skill bundle checks");
  }
  const before = sourceContentHash(root);
  const untrackedBefore = untrackedAudit(root);
  // macOS exposes /var as a symlink. The runtime rejects symlinked storage
  // roots, and Node resolves import.meta.url through the real path, so the
  // isolated release must use one canonical path before invoking its CLIs.
  const temporaryRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-final-clean-install-")));
  const runnerRoot = path.join(temporaryRoot, "runner");
  const bundleRoot = path.join(temporaryRoot, "skill-bundle");
  const targetRoot = path.join(temporaryRoot, "multica-target");
  const home = path.join(temporaryRoot, "home");
  const storage = path.join(temporaryRoot, "storage");
  for (const directory of [runnerRoot, bundleRoot, targetRoot, home, storage]) fs.mkdirSync(directory, { recursive: true });

  try {
    initTarget(targetRoot);
    const bundle = await buildSkillBundleRelease({ packageRoot: root, outputDir: bundleRoot });
    const runner = await buildRunnerRelease({ packageRoot: root, outputDir: runnerRoot });
    const checks = {
      skill_bundle: verifySkillBundle ? validateSkillBundleRelease({ releaseRoot: bundleRoot }) : null,
      runner: verifyRunner ? validateRunnerRelease({ releaseRoot: runnerRoot, skillBundleManifest: bundle }) : null,
    };
    if (verifyRunner && verifySkillBundle) {
      const forbidden = [...bundle.files, ...runner.files].filter(({ path: locator }) =>
        /(^|\/)(?:node_modules|tests?|__tests__|specs?|history|receipts|reviews)(?:\/|$)|^evidence(?:\/|$)|\.test\.[^/]+$/.test(locator));
      if (forbidden.length) throw new Error(`release contains forbidden content: ${forbidden.map(({ path: locator }) => locator).join(", ")}`);
    }

    const install = verifyRunner && verifySkillBundle
      ? installRunnerRelease({
        releaseRoot: runnerRoot,
        skillBundleRoot: bundleRoot,
        run: (command, args, options) => spawnSync(command, command === "npm" ? [...args, "--offline"] : args, options),
      })
      : null;
    const stageSkillSmoke = verifyRunner && verifySkillBundle
      ? await smokeReleasedStageDependencies({ sourceRoot: root, runnerRoot, bundleRoot })
      : null;
    let layout = null;
    let fiveStageTask = null;
    if (verifyMulticaLayout || verifyFiveStageTask) {
      const env = { ...process.env, HOME: home, WORKFLOWHUB_TASK_DIR: storage, NODE_PATH: "" };
      // A clean-install child is an isolated fixture, not the current host
      // session.  Do not let its temporary task overwrite the developer's
      // WorkflowHub session binding through inherited Codex variables.
      for (const key of ["CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH"]) delete env[key];
      const bootstrap = run(process.execPath, [path.join(runnerRoot, "tools/cli/task-bootstrap.mjs"),
        "--project=CleanInstall", "--task=release-smoke", `--target-repo=${targetRoot}`], { cwd: runnerRoot, env });
      const runtime = path.join(runnerRoot, "tools/cli/stage-runtime.mjs");
      let bootstrapValue;
      try { bootstrapValue = JSON.parse(bootstrap.stdout); }
      catch (error) { throw new Error(`clean-install bootstrap result is not valid JSON: ${error.message}`); }
      if (typeof bootstrapValue.task_path !== "string" || bootstrapValue.task_path.trim() === "") {
        throw new Error("clean-install bootstrap result did not return task_path");
      }
      const worktreeRoot = bootstrapValue.workspace?.worktree_root;
      if (typeof worktreeRoot !== "string" || worktreeRoot.trim() === "") {
        throw new Error("clean-install bootstrap result did not return workspace.worktree_root");
      }
      if (verifyMulticaLayout) {
        const doctor = run(process.execPath, [runtime, "doctor", "--action=workspace", "--stage=make-decision",
          "--project=CleanInstall", "--task=release-smoke"], { cwd: targetRoot, env });
        layout = { bootstrap_exit: bootstrap.status, doctor_exit: doctor.status, target_git: true };
      }
      if (verifyFiveStageTask) {
        fiveStageTask = runInstalledFiveStageTask({
          runtime,
          targetRoot,
          taskPath: bootstrapValue.task_path,
          worktreeRoot,
          env,
        });
      }
    }
    const after = sourceContentHash(root);
    const untrackedAfter = untrackedAudit(root);
    if (verifyCurrentTree && before !== after) throw new Error(`source tree changed during clean install: ${before} -> ${after}`);
    if (verifyCurrentTree && JSON.stringify(untrackedBefore) !== JSON.stringify(untrackedAfter)) {
      throw new Error("untracked files changed during clean install");
    }
    return Object.freeze({
      schema_version: "workflowhub-clean-install.v1",
      status: "passed",
      source_tree_hash_before: before,
      source_tree_hash_after: after,
      untracked_audit_before: untrackedBefore,
      untracked_audit_after: untrackedAfter,
      runner_files: runner.files.length,
      skill_bundle_files: bundle.files.length,
      install: install ? { status: install.status } : null,
      stage_skill_smoke: stageSkillSmoke,
      layout,
      five_stage_task: fiveStageTask,
      source_tree_unchanged: before === after,
      untracked_unchanged: JSON.stringify(untrackedBefore) === JSON.stringify(untrackedAfter),
    });
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  try {
    const result = await cleanInstall({ packageRoot: ROOT, ...args });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
