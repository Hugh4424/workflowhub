// Draft only. Independent review is required before this script is executed.
// It creates one isolated Task fixture, runs exactly three actual test targets,
// and copies every Task receipt and raw output into CARD-04 P9 evidence.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync,
  realpathSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const EXPECTED_SOURCE = "/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919";
const EXPECTED_BRANCH = "task/workflowhub/workflowhub-thin-core-card-04-20260919";
const EXPECTED_HEAD = "ef920f1fbd415fe87d50930359059b661e141acd";
const SOURCE = process.cwd();
const EVIDENCE = resolve(SOURCE, "quality/evidence/stage-quality/build-code/P9");
const TEMP_PREFIX = "/private/tmp/workflowhub-p9-real-three-";
const DEPENDENCIES = "/Users/Hugh/Hugh/Project/workflowhub/node_modules";
const TARGETS = Object.freeze([
  "tests/contract/decision-log-census.test.mjs",
  "tests/contract/acceptance-result-machine-classes.test.mjs",
  "tests/deferred-acceptance-semantics.test.mjs",
]);
const ANCHORS = Object.freeze([
  ...TARGETS,
  "docs/quality/test-asset-registry.json",
  "specs/workflowhub-thin-core-card-04-20260919/decision-log.md",
  "specs/workflowhub-thin-core-card-04-20260919/phases/P7.md",
  "runtime/stage/stage-content-contracts.mjs",
  "runtime/evidence/acceptance-evidence-validator.mjs",
  "runtime/evidence/freshness.mjs",
  "runtime/evidence/quality-store.mjs",
]);
// The source worktree has a .git FILE. Both file and directory, at any depth,
// must be excluded. Root quality evidence is excluded; docs/quality remains.
const COPY_EXCLUDES = Object.freeze([
  "--exclude=.git", "--exclude=/.git", "--exclude=node_modules",
  "--exclude=/quality", "--exclude=.DS_Store",
]);
const REDIRECTING_GIT_ENV = new Set([
  "GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR",
  "GIT_OBJECT_DIRECTORY", "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_TEMPLATE_DIR", "GIT_NAMESPACE", "GIT_CEILING_DIRECTORIES",
  "GIT_DISCOVERY_ACROSS_FILESYSTEM", "GIT_REPLACE_REF_BASE",
]);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const hashes = (root) => Object.fromEntries(ANCHORS.map((path) =>
  [path, sha256(readFileSync(resolve(root, path)))]));
// A child never inherits caller Git redirection/configuration, even when the
// parent process had one. Once the isolated fixture exists, HOME and the Task
// storage root are fixed to its private directories for every child command.
let childEnvironment = Object.fromEntries(Object.entries(process.env)
  .filter(([name]) => !name.startsWith("GIT_")));
childEnvironment = { ...childEnvironment,
  npm_config_update_notifier: "false", NPM_CONFIG_UPDATE_NOTIFIER: "false" };

function run(executable, args, cwd) {
  const result = spawnSync(executable, args, {
    cwd, encoding: "utf8", maxBuffer: 32 * 1024 * 1024,
    env: childEnvironment,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${executable} ${args.join(" ")} failed: ${result.stderr?.trim() || result.error?.message || `exit ${result.status}`}`);
  }
  return result.stdout.trim();
}

function assertSourceIdentity({ checkInheritedGitEnv = false } = {}) {
  if (SOURCE !== EXPECTED_SOURCE || realpathSync(SOURCE) !== EXPECTED_SOURCE
      || lstatSync(SOURCE).isSymbolicLink()) {
    throw new Error("source path is a symlink or not its realpath");
  }
  // Bootstrap may install a temporary Git alternate in this process after the
  // fixture exists. Reject inherited redirection only at initial preflight;
  // run() always strips every GIT_* variable from child processes, and the
  // per-target fixture environment is reapplied before runCapture.
  if (checkInheritedGitEnv) {
    for (const name of Object.keys(process.env)) {
      if (REDIRECTING_GIT_ENV.has(name) || name.startsWith("GIT_CONFIG_")) {
        throw new Error(`Git redirection/config environment is set: ${name}`);
      }
    }
  }
  if (run("git", ["rev-parse", "--show-toplevel"], SOURCE) !== SOURCE) {
    throw new Error("source is not the expected Git worktree root");
  }
  const branch = run("git", ["symbolic-ref", "--quiet", "--short", "HEAD"], SOURCE);
  if (branch !== EXPECTED_BRANCH) throw new Error(`real CARD-04 branch changed: ${branch}`);
  const actualHead = run("git", ["rev-parse", "HEAD"], SOURCE);
  if (actualHead !== EXPECTED_HEAD) throw new Error(`real CARD-04 HEAD changed: ${EXPECTED_HEAD} -> ${actualHead}`);
}

function assertEvidenceRoot() {
  const expected = `${EXPECTED_SOURCE}/quality/evidence/stage-quality/build-code/P9`;
  if (EVIDENCE !== expected || realpathSync(EVIDENCE) !== expected
      || !lstatSync(EVIDENCE).isDirectory() || lstatSync(EVIDENCE).isSymbolicLink()) {
    throw new Error("P9 evidence directory is not a real directory under the expected CARD-04 worktree");
  }
}

function assertTemp(temporary) {
  if (!temporary.startsWith(TEMP_PREFIX) || realpathSync(temporary) !== temporary
      || lstatSync(temporary).isSymbolicLink()) {
    throw new Error("temporary fixture is not a unique real directory under /private/tmp");
  }
}

function assertIsolatedGit(repo, temporary) {
  assertTemp(temporary);
  if (!repo.startsWith(`${temporary}/`) || realpathSync(repo) !== repo) {
    throw new Error("fixture repo escapes the verified temporary directory");
  }
  const expectedGitDir = resolve(repo, ".git");
  if (!lstatSync(expectedGitDir).isDirectory()
      || realpathSync(expectedGitDir) !== expectedGitDir
      || run("git", ["rev-parse", "--absolute-git-dir"], repo) !== expectedGitDir
      || run("git", ["rev-parse", "--show-toplevel"], repo) !== repo) {
    throw new Error("fixture Git directory does not belong exclusively to the temporary repo");
  }
}

function writeNew(path, bytes) {
  writeFileSync(path, bytes, { flag: "wx" });
}

function applyFixtureProcessEnvironment() {
  for (const name of Object.keys(process.env)) if (name.startsWith("GIT_")) delete process.env[name];
  Object.assign(process.env, childEnvironment);
}

function pathEntryExists(path) {
  try { lstatSync(path); return true; }
  catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

function gitPathSet(root, { includeUntracked = false } = {}) {
  const args = includeUntracked
    ? ["ls-files", "--cached", "--others", "--exclude-standard", "-z"]
    : ["ls-files", "-z"];
  const result = spawnSync("git", args, {
    cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, env: childEnvironment,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Git path inventory failed: ${result.stderr?.trim() || result.error?.message || `exit ${result.status}`}`);
  }
  return new Set(result.stdout.split("\0").filter(Boolean));
}

function currentSourcePath(path) {
  return path !== "quality" && !path.startsWith("quality/")
    && path !== "node_modules" && !path.startsWith("node_modules/")
    && !path.split("/").includes(".git");
}

function compareTrackedFixtureContent(sourceRoot, worktree) {
  const expected = gitPathSet(worktree);
  const current = new Set([...gitPathSet(sourceRoot, { includeUntracked: true })].filter(currentSourcePath));
  const missing = [...expected].filter((path) => !current.has(path));
  const extra = [...current].filter((path) => !expected.has(path));
  if (missing.length || extra.length) {
    throw new Error(`source/fixture path set changed: missing=${missing.slice(0, 5).join(",")}; extra=${extra.slice(0, 5).join(",")}`);
  }
  for (const path of expected) {
    if (path.startsWith("/") || path.split("/").includes("..")) {
      throw new Error(`unsafe Git path in fixture: ${path}`);
    }
    const original = resolve(sourceRoot, path), copied = resolve(worktree, path);
    if (!pathEntryExists(original) || !pathEntryExists(copied)) throw new Error(`tracked source file missing: ${path}`);
    const left = lstatSync(original), right = lstatSync(copied);
    if (left.isFile() && right.isFile()) {
      if (sha256(readFileSync(original)) !== sha256(readFileSync(copied))) {
        throw new Error(`tracked source content changed: ${path}`);
      }
    } else if (left.isSymbolicLink() && right.isSymbolicLink()) {
      if (readlinkSync(original) !== readlinkSync(copied)) {
        throw new Error(`tracked source symlink target changed: ${path}`);
      }
    } else {
      throw new Error(`tracked source type changed or unsupported: ${path}`);
    }
  }
  const ordered = [...expected].sort();
  return Object.freeze({ path_count: ordered.length, path_set_sha256: sha256(ordered.join("\0")) });
}

async function main() {
  // All assertions in this block run before any git init/add/commit.
  assertSourceIdentity({ checkInheritedGitEnv: true });
  assertEvidenceRoot(); // Required before any write or source copy.
  if (realpathSync(DEPENDENCIES) !== DEPENDENCIES || !lstatSync(DEPENDENCIES).isDirectory()) {
    throw new Error("dependency install is not a real directory");
  }
  const sourceBefore = hashes(SOURCE);
  const temporary = realpathSync(mkdtempSync(TEMP_PREFIX));
  assertTemp(temporary);
  const repo = join(temporary, "repo"), storage = join(temporary, "storage"), home = join(temporary, "home");
  mkdirSync(repo); mkdirSync(storage); mkdirSync(home);
  childEnvironment = { ...childEnvironment, HOME: home,
    WORKFLOWHUB_TASK_DIR: storage, TMPDIR: temporary };
  applyFixtureProcessEnvironment();
  const proof = {
    schema: "card04-p9-real-three-target-capture.v1", started_at: new Date().toISOString(),
    source_root: SOURCE, source_head: EXPECTED_HEAD, source_branch: EXPECTED_BRANCH,
    temporary_fixture: temporary,
    source_anchor_before: sourceBefore, targets: [],
  };
  let task = null;
  let failure = null;
  try {
    run("rsync", ["-a", ...COPY_EXCLUDES, `${SOURCE}/`, `${repo}/`], SOURCE);
    let delta = run("rsync", ["-acn", "--out-format=%n", ...COPY_EXCLUDES, `${SOURCE}/`, `${repo}/`], SOURCE);
    if (delta) {
      run("rsync", ["-a", ...COPY_EXCLUDES, `${SOURCE}/`, `${repo}/`], SOURCE);
      delta = run("rsync", ["-acn", "--out-format=%n", ...COPY_EXCLUDES, `${SOURCE}/`, `${repo}/`], SOURCE);
    }
    if (delta) throw new Error(`source changed during coherent copy: ${delta.slice(0, 1000)}`);
    assertSourceIdentity();
    proof.source_anchor_after_copy = hashes(SOURCE);
    if (ANCHORS.some((path) => sourceBefore[path] !== proof.source_anchor_after_copy[path]
        || sourceBefore[path] !== sha256(readFileSync(resolve(repo, path))))) {
      throw new Error("source anchor bytes changed during copy");
    }
    // Crucial: the copied root must have NO .git file, directory, or symlink.
    if (pathEntryExists(resolve(repo, ".git"))) throw new Error("copied fixture unexpectedly contains .git");
    assertTemp(temporary);
    assertSourceIdentity();
    run("git", ["-c", "init.templateDir=/dev/null", "init", "-q", "-b", "main"], repo);
    assertIsolatedGit(repo, temporary); // Required before git add or commit.
    assertSourceIdentity();
    run("git", ["-c", "core.fsmonitor=false", "add", "-A"], repo);
    assertIsolatedGit(repo, temporary);
    assertSourceIdentity();
    // -c is command-local. No git config writes, external hooks or signing.
    run("git", ["-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false",
      "-c", "commit.gpgsign=false", "-c", "user.name=P9 isolated fixture", "-c", "user.email=p9-fixture@invalid",
      "commit", "-qm", "coherent current source for three targeted tests"], repo);
    assertIsolatedGit(repo, temporary);
    assertSourceIdentity();
    for (const path of ANCHORS) run("git", ["ls-files", "--error-unmatch", "--", path], repo);
    proof.fixture_baseline_commit = run("git", ["rev-parse", "HEAD"], repo);
    proof.fixture_baseline_tree = run("git", ["rev-parse", "HEAD^{tree}"], repo);

    const { bootstrapTask } = await import(pathToFileURL(resolve(SOURCE, "tools/cli/task-bootstrap.mjs")));
    const { openTask } = await import(pathToFileURL(resolve(SOURCE, "runtime/task/task-handle.mjs")));
    const { openCurrentTaskWorkspace } = await import(pathToFileURL(resolve(SOURCE, "runtime/task/workspace.mjs")));
    const { runCapture } = await import(pathToFileURL(resolve(SOURCE, "workflows/build-code/capture.mjs")));
    const { collectRegisteredTestInventory } = await import(pathToFileURL(resolve(SOURCE, "workflows/build-code/test-asset-inventory.mjs")));
    const bootstrapped = bootstrapTask({ project: "P9Real", task: "p9-real-three-targets", "target-repo": repo },
      { env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage }, home, cwd: repo });
    task = openTask(bootstrapped.task_path, "P9Real", "p9-real-three-targets");
    const workspace = openCurrentTaskWorkspace(task);
    const worktree = workspace.worktreeRoot;
    if (!task.taskPath.startsWith(`${temporary}/`) || !worktree.startsWith(`${temporary}/`)) {
      throw new Error("Task handle or workspace escaped the isolated fixture");
    }
    assertSourceIdentity();
    symlinkSync(DEPENDENCIES, resolve(worktree, "node_modules"));
    proof.task_id = task.identity.taskId;
    proof.bootstrap_ref = bootstrapped.bootstrap_identity_ref;
    const taskManifestRaw = readFileSync(resolve(task.taskPath, "task.json"));
    writeNew(resolve(EVIDENCE, "T019-safe-three-task-manifest-20260927.json"), taskManifestRaw);
    proof.task_manifest_sha256 = sha256(taskManifestRaw);
    const bootstrapRaw = task.readRecord(proof.bootstrap_ref);
    writeNew(resolve(EVIDENCE, "T019-safe-three-bootstrap-20260927.json"), bootstrapRaw);
    proof.bootstrap_sha256 = sha256(bootstrapRaw);
    const registryRaw = readFileSync(resolve(worktree, "docs/quality/test-asset-registry.json"));
    writeNew(resolve(EVIDENCE, "T019-safe-three-registry-20260927.json"), registryRaw);
    proof.registry_sha256 = sha256(registryRaw);
    proof.fixture_target_sha256 = Object.fromEntries(TARGETS.map((path) =>
      [path, sha256(readFileSync(resolve(worktree, path)))]));
    for (const [index, target] of TARGETS.entries()) {
      // runCapture starts each runner through the current process. Reapply the
      // fixed fixture environment before every invocation.
      applyFixtureProcessEnvironment();
      const command = `npx vitest run ${target} --reporter=json`;
      const receiptRef = `quality/tests/p9-real-three-target-${index + 1}.json`;
      const receipt = await runCapture(command, receiptRef, { task, workspace });
      const receiptRaw = task.readRecord(receipt.receipt_ref);
      const outputRaw = task.readRecord(receipt.output_ref);
      if (sha256(receiptRaw) !== receipt.receipt_hash || sha256(outputRaw) !== receipt.output_hash) {
        throw new Error(`canonical receipt/output readback mismatch for target ${index + 1}`);
      }
      const prefix = resolve(EVIDENCE, `T019-safe-three-target-${index + 1}-20260927`);
      writeNew(`${prefix}.receipt.json`, receiptRaw);
      writeNew(`${prefix}.output.txt`, outputRaw);
      const inventory = collectRegisteredTestInventory({ task, workspace, receipt });
      const row = {
        target, command, receipt_ref: receipt.receipt_ref, receipt_sha256: receipt.receipt_hash,
        output_ref: receipt.output_ref, output_sha256: receipt.output_hash,
        dispatch_state: receipt.dispatch_state ?? "executed", exit_code: receipt.exit_code,
        snapshot_head: receipt.snapshot_head, snapshot_tree: receipt.snapshot_tree,
        snapshot_commit: receipt.snapshot_commit, source_digest: receipt.source_digest,
        registry_revision: inventory.registry_revision, registry_sha256: inventory.registry_sha256,
        inventory_status: inventory.status, leaf_count: inventory.tests.length,
        passed_count: inventory.tests.filter((entry) => entry.status === "passed").length,
        missing: inventory.missing, unmatched: inventory.unmatched, skipped: inventory.skipped,
        target_sha256: sha256(readFileSync(resolve(worktree, target))),
      };
      writeNew(`${prefix}.meta.json`, `${JSON.stringify(row, null, 2)}\n`);
      proof.targets.push(row);
      if (row.dispatch_state === "reused" || row.exit_code !== 0 || row.inventory_status !== "recorded"
          || row.missing.length || row.unmatched.length || row.skipped.length) {
        throw new Error(`target ${index + 1} did not produce a newly executed, exact inventory`);
      }
      assertSourceIdentity();
    }
    proof.fixture_target_sha256_after = Object.fromEntries(TARGETS.map((path) =>
      [path, sha256(readFileSync(resolve(worktree, path)))]));
    if (TARGETS.some((path) => proof.fixture_target_sha256[path] !== proof.fixture_target_sha256_after[path])) {
      throw new Error("fixture target bytes changed during the three runs");
    }
    proof.source_anchor_after_runs = hashes(SOURCE);
    if (ANCHORS.some((path) => sourceBefore[path] !== proof.source_anchor_after_runs[path])) {
      throw new Error("real CARD-04 source anchors changed during the isolated runs");
    }
    // Compare content, not rsync metadata: Git-tracked fixture paths must
    // equal the live tracked+untracked delivery paths, then every regular
    // file byte hash and symlink target must still match.
    proof.tracked_content_comparison = compareTrackedFixtureContent(SOURCE, worktree);
  } catch (error) {
    failure = error.message;
    proof.error = failure;
  } finally {
    proof.completed_at = new Date().toISOString();
    try { assertSourceIdentity(); assertEvidenceRoot(); }
    catch (error) { failure = error.message; proof.error = failure; }
    const raw = `${JSON.stringify(proof, null, 2)}\n`;
    writeNew(resolve(EVIDENCE, "T019-safe-three-targets-20260927.json"), raw);
    // Keep a failed fixture for diagnosis. Remove only a verified /private/tmp
    // directory after every requested receipt/output has been copied.
    if (!failure && proof.targets.length === TARGETS.length) {
      assertTemp(temporary);
      assertIsolatedGit(repo, temporary);
      rmSync(temporary, { recursive: true, force: false });
    }
    process.stdout.write(`${JSON.stringify({ status: failure ? "unavailable" : "recorded",
      error: failure, manifest_sha256: sha256(raw), target_count: proof.targets.length,
      temporary_retained: Boolean(failure) }, null, 2)}\n`);
    if (failure) process.exitCode = 1;
  }
}

await main();
