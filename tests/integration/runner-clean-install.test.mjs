import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, test } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";

import { buildRunnerRelease, installRunnerRelease, validateRunnerRelease } from "../../runtime/distribution/runner-release.mjs";
import { buildSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";
import { validateSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";
import { createCanonicalSource, createSourceManifest } from "../../runtime/evidence/canonical-source.mjs";
import { cleanInstall, sourceContentHash } from "../../tools/architecture/clean-install.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const temps = [];
afterEach(() => temps.splice(0).forEach((entry) => fs.rmSync(entry, { recursive: true, force: true })));
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

function runCli(executable, arguments_, options) {
  const result = spawnSync(process.execPath, [executable, ...arguments_], {
    ...options,
    encoding: "utf8",
  });
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}

describe("runner release", () => {
  test("resolves all five released workflow skill closures without a provider or source mutation", async () => {
    const result = await cleanInstall({ packageRoot: ROOT });
    expect(result.status).toBe("passed");
    expect(result.source_tree_unchanged).toBe(true);
    expect(result.stage_skill_smoke).toMatchObject({
      status: "passed",
      mode: "no_provider_preflight",
      release_inputs_unchanged: true,
    });
    expect(result.stage_skill_smoke.stages.map(({ stage }) => stage)).toEqual([
      "make-decision", "build-spec", "build-plan", "build-code", "verify-code",
    ]);
    for (const stage of result.stage_skill_smoke.stages) {
      expect(stage.manifest_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(stage.skill_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(stage.dependencies.length).toBeGreaterThan(0);
      for (const dependency of stage.dependencies) {
        expect(dependency.source_skill_hash).toMatch(/^[a-f0-9]{64}$/);
        expect(dependency.bundle_hash).toMatch(/^[a-f0-9]{64}$/);
      }
    }
  }, 60_000);

  test("hashes tracked source separately from untracked audit files while preserving non-deletion read failures", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-live-source-hash-"));
    temps.push(root);
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
    fs.writeFileSync(path.join(root, "kept.txt"), "kept\n");
    fs.writeFileSync(path.join(root, "deleted.txt"), "deleted\n");
    execFileSync("git", ["add", "kept.txt", "deleted.txt"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "baseline"], { cwd: root });

    fs.unlinkSync(path.join(root, "deleted.txt"));
    expect(sourceContentHash(root)).toMatch(/^[a-f0-9]{64}$/);

    const trackedHash = sourceContentHash(root);
    fs.writeFileSync(path.join(root, "scratch.txt"), "not deliverable\n");
    // Scratch files are reported by clean-install but cannot perturb the
    // reproducible release identity.
    expect(sourceContentHash(root)).toBe(trackedHash);
  });

  test("runs doctor, status, and a minimal canonical write from a clean installed release", async () => {
    const isolated = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-clean-release-")));
    temps.push(isolated);
    fs.mkdirSync(path.join(isolated, "runner-release"), { recursive: true });
    fs.mkdirSync(path.join(isolated, "skill-bundle"), { recursive: true });
    const outputDir = fs.realpathSync(path.join(isolated, "runner-release"));
    const bundleDir = fs.realpathSync(path.join(isolated, "skill-bundle"));
    const home = path.join(isolated, "home");
    const storage = path.join(isolated, "storage");
    const target = path.join(isolated, "target");
    for (const directory of [home, storage, target]) fs.mkdirSync(directory, { recursive: true });
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: target });
    execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com",
      "commit", "--allow-empty", "-qm", "baseline"], { cwd: target });
    const release = await buildRunnerRelease({ packageRoot: ROOT, outputDir });
    const bundle = await buildSkillBundleRelease({ packageRoot: ROOT, outputDir: bundleDir });

    const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "runtime/schemas/runner-release.schema.json"), "utf8"));
    expect(new Ajv2020({ strict: false }).compile(schema)(release)).toBe(true);
    expect(release.files.some(({ path: locator }) => locator.startsWith("node_modules/"))).toBe(false);
    expect(release.files.some(({ path: locator }) => locator === "package-lock.json")).toBe(true);
    // Runtime review schemas are loaded via import.meta.url, which makes them
    // invisible to JavaScript static-import discovery.  A clean Runner must
    // still carry them rather than reaching back to the Hub checkout.
    expect(release.files.some(({ path: locator }) => locator === "runtime/review/schemas/attempt.schema.json")).toBe(true);
    fs.rmSync(path.join(outputDir, "node_modules"), { recursive: true, force: true });
    const installed = installRunnerRelease({ releaseRoot: outputDir, skillBundleRoot: bundleDir });
    expect(installed.status).toBe(0);
    expect(fs.existsSync(path.join(outputDir, "node_modules/ajv"))).toBe(true);
    const env = {
      ...process.env,
      HOME: home,
      WORKFLOWHUB_TASK_DIR: storage,
      NODE_PATH: "",
    };
    const bootstrap = runCli(path.join(outputDir, "tools/cli/task-bootstrap.mjs"), [
      "--project=Demo", "--task=clean-release", `--target-repo=${target}`,
    ], { cwd: outputDir, env });
    const runtime = path.join(outputDir, "scripts/stage-runtime.mjs");
    const prepared = runCli(runtime, [
      "doctor", "--action=workspace", "--stage=make-decision",
      "--project=Demo", "--task=clean-release",
    ], { cwd: target, env });
    const started = runCli(runtime, [
      "status", "--action=begin", "--stage=make-decision",
      "--project=Demo", "--task=clean-release", "--reason=clean-release-smoke",
    ], { cwd: target, env });
    expect(execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
      cwd: prepared.worktree_root,
      encoding: "utf8",
    }).trim()).toMatch(/^[a-f0-9]{40}$/);
    const input = path.join(isolated, "minimal-run.json");
    const canonicalSource = createCanonicalSource({
      source_type: "offline_fixture",
      source_id: "clean-release",
      revision: "r1",
      requirements: ["R1"],
    });
    const sourceManifest = createSourceManifest({
      canonical_source: canonicalSource,
      atoms: [{
        requirement_id: "R1",
        text: "The installed runner must execute without source dependencies.",
        owner: "release",
        authority: "test",
        derived_from: [],
        supersedes: [],
        status: "accepted",
        stale: false,
      }],
    }).manifest;
    fs.writeFileSync(input, `${JSON.stringify({
      source_manifest: sourceManifest,
      mappings: {
        R1: {
          decision_ref: { kind: "decision", uri_or_path: "decision://R1", content_hash: "b".repeat(64) },
          artifact_refs: [{ kind: "artifact", uri_or_path: "artifact://R1", content_hash: "c".repeat(64) }],
          acceptance_criteria_refs: [{ kind: "ac", uri_or_path: "ac://R1", content_hash: "d".repeat(64) }],
        },
      },
    })}\n`);
    const written = runCli(runtime, [
      "run", "--action=scope", "--stage=make-decision",
      "--project=Demo", "--task=clean-release",
      `--input=${input}`,
    ], { cwd: target, env });

    const taskRoot = bootstrap.task_path;
    expect(fs.existsSync(path.join(taskRoot, "task.json"))).toBe(true);
    expect(JSON.parse(fs.readFileSync(path.join(taskRoot, "runs/make-decision/run-0001.json"), "utf8"))
      .workflow_run_id).toBe(started.run.workflow_run_id);
    const evidence = fs.readFileSync(path.join(taskRoot, written.ledger_ref));
    expect(hash(evidence)).toBe(written.ledger_hash);
    const executions = fs.readdirSync(path.join(taskRoot, "identity/executions"))
      .filter((name) => name.endsWith(".json"));
    expect(executions).toHaveLength(3);
    const runnerCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: outputDir, encoding: "utf8" }).trim();
    for (const name of executions) {
      const identity = JSON.parse(fs.readFileSync(path.join(taskRoot, "identity/executions", name), "utf8"));
      expect(identity.source_kind).toBe("git_invocation");
      expect(identity.source.git_oid).toBe(runnerCommit);
    }
    expect(execFileSync("git", ["status", "--porcelain"], { cwd: outputDir, encoding: "utf8" })).toBe("");
    expect(JSON.stringify(release)).not.toContain("node_modules/");
    for (const locator of ["runner-release.json", "skill-bundle.json"]) {
      const source = locator === "runner-release.json" ? outputDir : bundleDir;
      expect(fs.readFileSync(path.join(source, locator), "utf8")).not.toContain(ROOT);
    }
  }, 60_000);

  test("rejects tampered files and incompatible contracts before npm install", async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-runner-tamper-"));
    temps.push(outputDir);
    await buildRunnerRelease({ packageRoot: ROOT, outputDir });
    expect(() => validateRunnerRelease({
      releaseRoot: outputDir,
      skillBundleManifest: { runner_contract_major: 2, runner_contract_min_minor: 0 },
    })).toThrow(/major mismatch/);
    fs.appendFileSync(path.join(outputDir, "runtime/interface/runtime-facade.mjs"), "\n// tampered\n");
    expect(() => validateRunnerRelease({
      releaseRoot: outputDir,
      skillBundleManifest: { runner_contract_major: 1, runner_contract_min_minor: 0 },
    })).toThrow(/hash mismatch/);
  });

  test("rejects a tampered Skill Bundle manifest closure", async () => {
    const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-bundle-tamper-"));
    temps.push(bundleDir);
    const bundle = await buildSkillBundleRelease({ packageRoot: ROOT, outputDir: bundleDir });
    fs.appendFileSync(path.join(bundleDir, bundle.files[0].path), "\n# tampered\n");
    expect(() => validateSkillBundleRelease({ releaseRoot: bundleDir })).toThrow(/hash mismatch/);
  });
});
