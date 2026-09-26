import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { createTask, createTaskKernel, openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";

const roots = [];
const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const TASK_BOOTSTRAP_CLI = join(REPO_ROOT, "tools", "cli", "task-bootstrap.mjs");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-task-bootstrap-integrity-")));
  roots.push(root);
  const storage = join(root, "storage");
  const repo = join(root, "workflowhub");
  const home = join(root, "home");
  mkdirSync(storage);
  mkdirSync(repo);
  mkdirSync(home);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  git(repo, ["commit", "--allow-empty", "-qm", "baseline"]);
  return { root, storage, repo, home, env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage } };
}

function taskWithManifestOnly(state, taskId) {
  return createTask({
    storageRoot: state.storage,
    manifest: {
      schema_version: "1.0.0",
      execution_mode: "per_invocation",
      record_model: "vnext-single-write",
      project_name: "workflowhub",
      task_id: taskId,
      created_at: new Date().toISOString(),
      target_repo_root: state.repo,
      issue_ids: [],
      inputs: {},
    },
  });
}

function runBootstrapTask(state, taskId, inputs) {
  const inputPath = join(state.root, `${taskId}-inputs.json`);
  writeFileSync(inputPath, JSON.stringify(inputs));
  return spawnSync(process.execPath, [
    TASK_BOOTSTRAP_CLI,
    "--project=workflowhub",
    `--task=${taskId}`,
    `--target-repo=${state.repo}`,
    `--inputs=${inputPath}`,
  ], { cwd: state.repo, env: { ...process.env, ...state.env }, encoding: "utf8" });
}

function bootstrapTaskWithInputs(state, taskId, inputs) {
  const result = runBootstrapTask(state, taskId, inputs);
  if (result.status !== 0) throw new Error(result.stderr || `task-bootstrap exited ${result.status}`);
  const bootstrapped = JSON.parse(result.stdout);
  return openTask(bootstrapped.task_path, "workflowhub", taskId);
}

function publishCoverageAudit(task, decisionText) {
  const workspace = openCurrentTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", `# Decision log\n\n${decisionText}\n`);
  const confirmation = createTaskKernel(task, { workspace }).publishHumanConfirmation("make-decision", {
    decision: "accepted", reply_text: "确认当前决定", step_slug: "approve-decision",
  });
  const coverage = JSON.parse(task.readRecord(confirmation.coverage_quality_fact_ref));
  const audit = JSON.parse(task.readRecord(coverage.evidence[0].ref));
  return { coverage, audit };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("official existing task bootstrap integrity", () => {
  it("ORACLE-P5-INPUT: bootstraps a ref+sha raw requirement that the coverage audit can read", () => {
    const state = fixture();
    const taskId = "raw-requirement-bootstrap";
    const sourceBytes = "The system must preserve the user's original requirement.";
    const sourceRef = `quality/evidence/raw-requirements/${sha256(sourceBytes)}.txt`;
    const sourceItem = {
      source_item_ref: sourceRef, source_item_hash: sha256(sourceBytes),
      source_anchor: "raw-requirement.md#L1", exact_excerpt: sourceBytes,
      requirement_strength: "must",
    };
    const inventory = {
      schema_version: "raw-requirement-index.v1",
      source_items: [sourceItem],
      mappings: [{
        source_item_ref: sourceRef, source_item_hash: sourceItem.source_item_hash,
        coverage_status: "covered", disposition: "covered",
        decision_location: { kind: "main", ref: `specs/${taskId}/decision-log.md`, entry_index: 0 },
      }],
      declared_counts: { source_items: 1, covered: 1, accepted_omission: 0, missing: 0 },
      known_inventory: {
        stable_ids: [{ id: "R-P20-001", authority_file: "raw-requirement.md", position: "raw-requirement.md#L1" }],
        fact_samples: [
          { fact_type: "product_goal", sample: "preserve requirements", authority_file: "spec.md", conclusion: "one owner", evidence: "spec.md#L1" },
          { fact_type: "user_flow", sample: "confirm the decision", authority_file: "plan.md", conclusion: "one owner", evidence: "plan.md#L1" },
          { fact_type: "cross_task_requirement", sample: "source remains readable", authority_file: "tasks.md", conclusion: "one owner", evidence: "tasks.md#L1" },
          { fact_type: "acceptance", sample: "coverage is traceable", authority_file: "spec.md", conclusion: "one owner", evidence: "spec.md#L2" },
        ],
      },
    };
    const inventoryRaw = `${JSON.stringify(inventory, null, 2)}\n`;
    const inventoryRef = `quality/evidence/raw-requirements/${sha256(inventoryRaw)}.json`;
    const result = runBootstrapTask(state, taskId, {
      raw_requirement: {
        ref: inventoryRef,
        sha256: sha256(inventoryRaw),
        records: [
          { ref: inventoryRef, sha256: sha256(inventoryRaw), content: inventoryRaw },
          { ref: sourceRef, sha256: sha256(sourceBytes), content: sourceBytes },
        ],
      },
    });
    expect(result.status, result.stderr).toBe(0);
    const bootstrapped = JSON.parse(result.stdout);
    const task = openTask(bootstrapped.task_path, "workflowhub", taskId);
    expect(task.manifest.inputs.raw_requirement).toEqual({ ref: inventoryRef, sha256: sha256(inventoryRaw) });
    expect(task.readRecord(sourceRef)).toBe(sourceBytes);
    expect(task.readRecord(inventoryRef)).toBe(inventoryRaw);
    const workspace = openCurrentTaskWorkspace(task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    artifacts.writeAtomic("decision-log.md", `# Decision log\n\n${sourceBytes}\n`);
    const confirmation = createTaskKernel(task, { workspace }).publishHumanConfirmation("make-decision", {
      decision: "accepted", reply_text: "确认当前决定", step_slug: "approve-decision",
    });
    const coverage = JSON.parse(task.readRecord(confirmation.coverage_quality_fact_ref));
    const audit = JSON.parse(task.readRecord(coverage.evidence[0].ref));
    expect(coverage).toMatchObject({ kind: "coverage", status: "passed", subject: "decision_coverage" });
    expect(audit.audit).toMatchObject({ status: "passed", summary: { covered: 1, missing: 0 } });
    expect(audit.audit.failures).not.toEqual(expect.arrayContaining([expect.objectContaining({ code: "source_inventory_unavailable" })]));
  });

  it("rejects bundled raw requirement bytes that do not match their declared hash before creating a task", () => {
    const state = fixture();
    const taskId = "raw-requirement-bootstrap-bad-bytes";
    const sourceBytes = "The original requirement.";
    const sourceRef = `quality/evidence/raw-requirements/${sha256(sourceBytes)}.txt`;
    const inventoryRaw = JSON.stringify({ source_items: [{
      source_item_ref: sourceRef, source_item_hash: sha256(sourceBytes), exact_excerpt: sourceBytes,
    }] });
    const inventoryRef = `quality/evidence/raw-requirements/${sha256(inventoryRaw)}.json`;
    const result = runBootstrapTask(state, taskId, {
      raw_requirement: {
        ref: inventoryRef,
        sha256: sha256(inventoryRaw),
        records: [
          { ref: inventoryRef, sha256: sha256(inventoryRaw), content: "tampered inventory" },
          { ref: sourceRef, sha256: sha256(sourceBytes), content: sourceBytes },
        ],
      },
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/raw requirement record.*hash/i);
    expect(existsSync(join(state.storage, "Projects", "workflowhub", "tasks", taskId))).toBe(false);
  });

  it("rejects filesystem-invalid raw requirement refs before creating a task", () => {
    const state = fixture();
    const taskId = "raw-requirement-bootstrap-invalid-ref";
    const sourceBytes = "The original requirement.";
    const sourceRef = `quality/evidence/raw-requirements/${sha256(sourceBytes)}.txt\u0000invalid`;
    const inventoryRaw = JSON.stringify({ source_items: [{
      source_item_ref: sourceRef, source_item_hash: sha256(sourceBytes), exact_excerpt: sourceBytes,
    }] });
    const inventoryRef = `quality/evidence/raw-requirements/${sha256(inventoryRaw)}.json`;
    const result = runBootstrapTask(state, taskId, {
      raw_requirement: {
        ref: inventoryRef,
        sha256: sha256(inventoryRaw),
        records: [
          { ref: inventoryRef, sha256: sha256(inventoryRaw), content: inventoryRaw },
          { ref: sourceRef, sha256: sha256(sourceBytes), content: sourceBytes },
        ],
      },
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/raw requirement records need safe evidence refs/i);
    expect(existsSync(join(state.storage, "Projects", "workflowhub", "tasks", taskId))).toBe(false);
  });

  it("ORACLE-P5-INPUT: reports an incomplete audit when the manifest has no raw requirement descriptor", () => {
    const state = fixture();
    const task = bootstrapTaskWithInputs(state, "missing-raw-requirement-descriptor", {});

    const { coverage, audit } = publishCoverageAudit(task, "Decision without a raw requirement inventory.");

    expect(coverage).toMatchObject({ kind: "coverage", status: "incomplete", subject: "decision_coverage" });
    expect(audit.audit.failures).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "source_inventory_unavailable" }),
    ]));
  });

  it("ORACLE-P5-INPUT: reports an incomplete audit when source bytes do not match the inventory hash", () => {
    const state = fixture();
    const expectedSourceBytes = "The original requirement bytes.";
    const sourceRef = `quality/evidence/raw-requirements/${sha256(expectedSourceBytes)}.txt`;
    const inventory = {
      source_items: [{
        source_item_ref: sourceRef,
        source_item_hash: sha256(expectedSourceBytes),
        exact_excerpt: expectedSourceBytes,
      }],
    };
    const inventoryRaw = `${JSON.stringify(inventory, null, 2)}\n`;
    const inventoryRef = `quality/evidence/raw-requirements/${sha256(inventoryRaw)}.json`;
    const task = bootstrapTaskWithInputs(state, "raw-requirement-source-binding-mismatch", {
      raw_requirement: { ref: inventoryRef, sha256: sha256(inventoryRaw) },
    });
    task.writeRecordAtomic(inventoryRef, inventoryRaw);
    task.writeRecordAtomic(sourceRef, "Different source bytes.");

    const { coverage, audit } = publishCoverageAudit(task, expectedSourceBytes);

    expect(coverage).toMatchObject({ kind: "coverage", status: "incomplete", subject: "decision_coverage" });
    expect(audit.audit.failures).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "source_binding_invalid" }),
    ]));
  });

  it("completes the official task store before returning a manifest-only task", () => {
    const state = fixture();
    const task = taskWithManifestOnly(state, "half-created-task");
    expect(existsSync(join(task.taskPath, "index.json"))).toBe(false);

    const values = { "task-path": task.taskPath, project: "workflowhub", task: "half-created-task" };
    const first = bootstrapTask(values, { env: state.env, home: state.home, cwd: state.repo });
    expect(first).toMatchObject({ task_path: task.taskPath, project: "workflowhub", task: "half-created-task" });
    // A current task owns exactly one execution record file; the retired index
    // object is no longer created.
    for (const file of ["facts.jsonl"]) {
      expect(existsSync(join(task.taskPath, file)), file).toBe(true);
    }
    expect(existsSync(join(task.taskPath, "index.json"))).toBe(false);
    for (const directory of ["quality", "quality/reviews", "quality/tests"]) {
      expect(statSync(join(task.taskPath, directory)).isDirectory(), directory).toBe(true);
    }

    const before = Object.fromEntries(["facts.jsonl"]
      .map((file) => [file, readFileSync(join(task.taskPath, file), "utf8")]));
    const second = bootstrapTask(values, { env: state.env, home: state.home, cwd: state.repo });
    expect(second.task_path).toBe(first.task_path);
    for (const [file, raw] of Object.entries(before)) {
      expect(readFileSync(join(task.taskPath, file), "utf8"), file).toBe(raw);
    }
  });

  it("ignores a leftover invalid index object when bootstrapping an existing store", () => {
    const state = fixture();
    const task = taskWithManifestOnly(state, "invalid-existing-store");
    // A legacy index object is read-only history for current tasks: it must not
    // be created, rewritten, or treated as a current integrity failure.
    writeFileSync(join(task.taskPath, "index.json"), "{}\n");

    const result = bootstrapTask(
      { "task-path": task.taskPath, project: "workflowhub", task: "invalid-existing-store" },
      { env: state.env, home: state.home, cwd: state.repo },
    );
    expect(result).toMatchObject({ task_path: task.taskPath });
    expect(readFileSync(join(task.taskPath, "index.json"), "utf8")).toBe("{}\n");
    expect(existsSync(join(task.taskPath, "facts.jsonl"))).toBe(true);
  });
});
