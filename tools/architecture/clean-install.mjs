import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { buildRunnerRelease, installRunnerRelease, validateRunnerRelease } from "../../runtime/distribution/runner-release.mjs";
import { buildSkillBundleRelease, validateSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sourceContentHash(root = ROOT) {
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root })
    .toString("utf8").split("\0").filter(Boolean).sort();
  const payload = files.map((file) => `${file}\0${sha256(fs.readFileSync(path.join(root, file)))}\n`).join("");
  return sha256(payload);
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
    if (verifyCurrentTree && before !== after) throw new Error(`source tree changed during clean install: ${before} -> ${after}`);
    return Object.freeze({
      schema_version: "workflowhub-clean-install.v1",
      status: "passed",
      source_tree_hash_before: before,
      source_tree_hash_after: after,
      runner_files: runner.files.length,
      skill_bundle_files: bundle.files.length,
      install: install ? { status: install.status } : null,
      layout,
      source_tree_unchanged: before === after,
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
