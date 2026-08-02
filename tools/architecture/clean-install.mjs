import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { listDeliveryFiles, listUntrackedFiles } from "./inventory.mjs";

import { buildRunnerRelease, installRunnerRelease, validateRunnerRelease } from "../../runtime/distribution/runner-release.mjs";
import { buildSkillBundleRelease, validateSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);

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
 * Resolve every real workflow manifest through the installed Runner without
 * invoking a host/provider. This proves the released stage inputs and their
 * declared skill closures are runnable from release bytes, rather than only
 * from the Hub checkout or a fake stage handler.
 */
export async function smokeReleasedStageDependencies({ sourceRoot, runnerRoot, bundleRoot } = {}) {
  const source = fs.realpathSync(sourceRoot);
  const runner = fs.realpathSync(runnerRoot);
  const bundle = fs.realpathSync(bundleRoot);
  const releaseFilesBefore = {
    runner_manifest: fileHash(runner, "runner-release.json"),
    skill_manifest: fileHash(bundle, "skill-bundle.json"),
  };
  const { preflightStageSkills } = await import(pathToFileURL(path.join(runner, "runtime/stage/stage-skill-runtime.mjs")).href);
  const stages = [];
  for (const stage of STAGES) {
    const manifestLocator = `workflows/${stage}/skill-deps.yaml`;
    const skillLocator = `workflows/${stage}/SKILL.md`;
    const manifestHash = assertReleasedSourceInput({ sourceRoot: source, releaseRoot: runner, locator: manifestLocator });
    const skillHash = assertReleasedSourceInput({ sourceRoot: source, releaseRoot: runner, locator: skillLocator });
    const prepared = preflightStageSkills({
      packageRoot: runner,
      stage,
      activeConditions: [],
      commands: { "target-test-command": [process.execPath, "--version"] },
      probes: {},
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
    mode: "no_provider_preflight",
    stages,
    release_inputs_unchanged: true,
  });
}

function parseArgs(argv) {
  return Object.freeze({
    verifyRunner: argv.includes("--verify-runner"),
    verifySkillBundle: argv.includes("--verify-skill-bundle"),
    verifyMulticaLayout: argv.includes("--verify-multica-layout"),
    verifyCurrentTree: argv.includes("--verify-current-tree"),
  });
}

export async function cleanInstall({ packageRoot = ROOT, verifyRunner = true, verifySkillBundle = true, verifyMulticaLayout = true, verifyCurrentTree = true } = {}) {
  const root = fs.realpathSync(packageRoot);
  const before = sourceContentHash(root);
  const untrackedBefore = untrackedAudit(root);
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-final-clean-install-"));
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
    if (verifyMulticaLayout) {
      const env = { ...process.env, HOME: home, WORKFLOWHUB_TASK_DIR: storage, NODE_PATH: "" };
      const bootstrap = run(process.execPath, [path.join(runnerRoot, "tools/cli/task-bootstrap.mjs"),
        "--project=CleanInstall", "--task=release-smoke", `--target-repo=${targetRoot}`], { cwd: runnerRoot, env });
      const runtime = path.join(runnerRoot, "scripts/stage-runtime.mjs");
      const doctor = run(process.execPath, [runtime, "doctor", "--action=workspace", "--stage=make-decision",
        "--project=CleanInstall", "--task=release-smoke"], { cwd: targetRoot, env });
      layout = { bootstrap_exit: bootstrap.status, doctor_exit: doctor.status, target_git: true };
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
