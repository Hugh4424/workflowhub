import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { capturePreExecutionTaskChangeScope } from "../../workflows/build-code/change-scope.mjs";
import * as capture from "../../workflows/build-code/capture.mjs";

const runCapture = capture.runCapture;
const fixedCommand = () => capture.FIXED_TARGETED_CAPTURE_COMMAND;

const roots = [];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const workflowRoot = fileURLToPath(new URL("../../", import.meta.url));
const oldTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
const oldHome = process.env.HOME;
afterEach(() => {
  if (oldTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR;
  else process.env.WORKFLOWHUB_TASK_DIR = oldTaskDir;
  if (oldHome === undefined) delete process.env.HOME;
  else process.env.HOME = oldHome;
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture({ unsafeTarget = false, mutateSource = false, targetCount = 1, sharedTarget = false,
  slowTarget = false, omitCanonicalSource = false, markRun = false, unsafeTargetIndex = 0,
  failSecond = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-targeted-capture-")));
  roots.push(root);
  const repo = join(root, "repo"), storage = join(root, "storage"), home = join(root, "home");
  mkdirSync(repo); mkdirSync(storage); mkdirSync(home);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.name", "Targeted capture fixture");
  git(repo, "config", "user.email", "targeted@example.test");
  const taskId = `targeted-${randomUUID()}`;
  const materialDir = join(repo, "specs", taskId);
  mkdirSync(join(materialDir, "phases"), { recursive: true });
  const decision = "# Decision\n\n## 需求变更记录\n\n> Check product effect.\n";
  const spec = "# Spec\n\n- **FR-001**: Check product effect.\n- [ ] **AC-001**: One product test passes.\n";
  const phase = "# Phase P1\n\nCheck one product test.\n";
  writeFileSync(join(materialDir, "decision-log.md"), decision);
  writeFileSync(join(materialDir, "spec.md"), spec);
  writeFileSync(join(materialDir, "phases", "P1.md"), phase);
  writeFileSync(join(materialDir, "phases", "index.md"), "# Phase index\n\n## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n");
  writeFileSync(join(repo, "product.mjs"), "export const effect = 'old';\n");
  writeFileSync(join(repo, ".gitignore"), "node_modules\n.vite\n");
  mkdirSync(join(repo, "tests", "contract"), { recursive: true });
  mkdirSync(join(repo, "docs", "quality"), { recursive: true });
  const targets = Array.from({ length: targetCount }, (_, index) =>
    targetCount === 1 || sharedTarget ? "tests/contract/product.test.mjs" : `tests/contract/product-${index + 1}.test.mjs`);
  const testSource = markRun
    ? `import { it, expect } from 'vitest'; import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(join(root, "ran.marker"))}, 'ran'); it('product effect', () => expect(true).toBe(true));\n`
    : mutateSource
    ? "import { it, expect } from 'vitest'; import { writeFileSync } from 'node:fs'; writeFileSync('product.mjs', `export const effect = 'mutated';\\n`); it('product effect', () => expect(true).toBe(true));\n"
    : sharedTarget
      ? "import { it, expect } from 'vitest'; import { writeFileSync } from 'node:fs'; writeFileSync('target-ran.marker', 'ran\\n'); it('product effect', () => expect(true).toBe(true));\n"
    : slowTarget
      ? `import { it, expect } from 'vitest'; import { writeFileSync } from 'node:fs'; it('product effect', async () => { writeFileSync(${JSON.stringify(join(root, "started.marker"))}, 'started'); await new Promise((resolve) => setTimeout(resolve, 5000)); writeFileSync(${JSON.stringify(join(root, "late.marker"))}, 'late'); expect(true).toBe(true); });\n`
    : "import { it, expect } from 'vitest'; it('product effect', () => expect(true).toBe(true));\n";
  const failedSource = "import { it, expect } from 'vitest'; it('product effect', () => expect(false).toBe(true));\n";
  for (const [index, target] of targets.entries()) {
    writeFileSync(join(repo, target), failSecond && index === 1 ? failedSource : testSource);
  }
  writeFileSync(join(repo, "docs", "quality", "test-asset-registry.json"), `${JSON.stringify({
    schema: "workflowhub-test-asset-registry.v1", revision: "fixture.1", owner: "independent test owner",
    outside_scope: "unknown", retirement_policy: "Retain old IDs on replacement.",
    targets: [...new Set(targets)].map((target, index) => ({ path: unsafeTarget && index === unsafeTargetIndex ? "tests/../escape.test.mjs" : target,
      sha256: hash(failSecond && index === 1 ? failedSource : testSource),
      runner: "vitest", command: `npx vitest run ${target} --reporter=json`,
      owner: "independent test owner", status: "active",
      registered_test_ids: [`${target} > product effect`] })),
  }, null, 2)}\n`);
  const sourcePath = `specs/${taskId}/decision-log.md`;
  const rulePath = `specs/${taskId}/phases/P1.md`;
  const ruleRevision = `sha256:${hash(phase)}`;
  writeFileSync(join(repo, "docs", "quality", "business-case-catalog.json"), `${JSON.stringify({
    schema: "workflowhub-business-case-catalog.v1", project: "Targeted", revision: "fixture.1",
    owner: "fixture business owner", cases: targets.map((target, index) => ({
      id: index === 0 ? "CASE-PRODUCT" : `CASE-PRODUCT-${index + 1}`, status: "active",
      source: { path: sourcePath, revision: `sha256:${hash(decision)}` },
      rule: { id: "RULE-PRODUCT", path: rulePath, revision: ruleRevision,
        statement: "The product test exercises the effect." },
      change_triggers: ["product.mjs"], related_case_ids: [], ac_ids: ["AC-001"], phase_ids: ["P1"],
      execution: { target, runner: "vitest", machine_command: `npx vitest run ${target} --reporter=json`,
        expected_test_identity: "product effect", registered_test_ids: [`${target} > product effect`] },
      effect_observation: { schema_version: "workflowhub-business-effect-observation.v1",
        observation_status: "not_yet_observed", rule_revision: ruleRevision,
        ...(omitCanonicalSource ? {} : { canonical_source: {
          type: "current_task_acceptance_quality_fact_chain", stage: "build-code",
          subject: "AC-001", material_source_path: sourcePath, rule_source_path: rulePath,
          quality_fact_schema: "quality-fact.v1", quality_fact_ref_template: "quality/facts/{fact_digest}.json",
          acceptance_schema: "acceptance-evidence.v1",
          acceptance_ref_template: "quality/evidence/acceptance/build-code/AC-001-{acceptance_sha256}.json",
          required_binding: ["task_id", "snapshot_tree", "material_revision", "ref_sha256"],
        } }),
      } })),
  }, null, 2)}\n`);
  git(repo, "add", "."); git(repo, "commit", "-qm", "baseline");
  mkdirSync(join(storage, "activation"));
  writeFileSync(join(storage, "activation", "card-01.json"), `${JSON.stringify({
    schema_version: "card-01-activation.v1",
    capability_acceptance: { ref: "quality/evidence/activation.json", sha256: "a".repeat(64) },
    release_marker: { commit: git(repo, "rev-parse", "HEAD"), channel: "main" },
    entry_consumption: { evidence_ref: "quality/evidence/entry.json", observed_at: "2026-09-27T00:00:00.000Z" },
    activated_at: "2026-09-27T00:00:00.000Z",
  }, null, 2)}\n`);
  const created = bootstrapTask({ project: "Targeted", task: taskId, "target-repo": repo }, {
    env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage }, home, cwd: repo,
  });
  const task = openTask(created.task_path, "Targeted", taskId);
  const workspace = openCurrentTaskWorkspace(task);
  symlinkSync(resolve(workflowRoot, "node_modules"), join(workspace.worktreeRoot, "node_modules"), "dir");
  writeFileSync(join(workspace.worktreeRoot, "product.mjs"), "export const effect = 'new';\n");
  process.env.WORKFLOWHUB_TASK_DIR = storage;
  process.env.HOME = home;
  return { root, repo, storage, home, task, workspace, targets, marker: join(root, "ran.marker") };
}

describe("P10 fixed targeted capture", () => {
  it("preserves first pass and second real failure raw and stderr through the failed outer receipt", async () => {
    const state = fixture({ targetCount: 2, failSecond: true });
    const result = await runCapture(fixedCommand(), "quality/tests/targeted-second-fails.json", state);
    expect(result.exit_code).not.toBe(0);
    expect(result.targeted_capture).toMatchObject({ status: "unavailable",
      reason: "targeted_test_failed", business_effect_status: "unknown" });
    const receiptRaw = state.task.readRecord(result.receipt_ref);
    expect(hash(receiptRaw)).toBe(result.receipt_hash);
    const outputRaw = state.task.readRecord(result.output_ref);
    expect(hash(outputRaw)).toBe(result.output_hash);
    const failure = JSON.parse(outputRaw.trim());
    expect(failure).toMatchObject({ status: "unavailable", reason: "test_failed",
      task_id: state.task.identity.taskId, snapshot_tree: result.snapshot_tree,
      material_revision: expect.stringMatching(/^revision-/), run_id: expect.any(String),
      selected_case_ids: ["CASE-PRODUCT", "CASE-PRODUCT-2"],
      reports: [{ case_id: "CASE-PRODUCT", status: "passed" },
        { case_id: "CASE-PRODUCT-2", status: "failed" }] });
    expect(failure.reports).toHaveLength(2);
    for (const report of failure.reports) {
      const caseRaw = state.task.readRecord(report.record_ref);
      const raw = state.task.readRecord(report.raw_ref);
      const stderr = state.task.readRecord(report.stderr_ref);
      expect(hash(caseRaw)).toBe(report.record_hash);
      expect(hash(raw)).toBe(report.raw_sha256);
      expect(hash(stderr)).toBe(report.stderr_sha256);
      expect(JSON.parse(caseRaw)).toMatchObject({ task_id: state.task.identity.taskId,
        snapshot_tree: result.snapshot_tree, material_revision: failure.material_revision,
        run_id: failure.run_id, case_id: report.case_id, exit_code: report.exit_code,
        raw_output_ref: report.raw_ref, raw_output_sha256: report.raw_sha256 });
    }
    expect(failure.reports[0].exit_code).toBe(0);
    expect(failure.reports[1].exit_code).not.toBe(0);
    expect(result.targeted_capture).not.toHaveProperty("manifest_ref");
    expect(failure).not.toHaveProperty("manifest_ref");
    expect(result).not.toHaveProperty("case_reconciliation");
    if (process.env.WORKFLOWHUB_P10_FAILURE_SAMPLE === "1") {
      const dir = resolve(workflowRoot,
        "quality/evidence/stage-quality/build-code/P10/T020-failure-raw-20260927/fixture-sample");
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "outer-receipt.json"), receiptRaw);
      writeFileSync(join(dir, "outer-output.json"), outputRaw);
      for (const [index, report] of failure.reports.entries()) {
        writeFileSync(join(dir, `case-${index + 1}.json`), state.task.readRecord(report.record_ref));
        writeFileSync(join(dir, `case-${index + 1}.raw.txt`), state.task.readRecord(report.raw_ref));
        writeFileSync(join(dir, `case-${index + 1}.stderr.txt`), state.task.readRecord(report.stderr_ref));
      }
      writeFileSync(join(dir, "sample-meta.json"), `${JSON.stringify({ fixture_only: true,
        original_temporary_task_store_removed_after_test: true,
        task_id: failure.task_id, snapshot_tree: failure.snapshot_tree,
        material_revision: failure.material_revision, run_id: failure.run_id,
        outer_receipt_ref: result.receipt_ref, outer_receipt_sha256: result.receipt_hash,
        outer_output_ref: result.output_ref, outer_output_sha256: result.output_hash,
        reports: failure.reports }, null, 2)}\n`);
    }
  });

  it("runs known cases for mixed changes but reports every unknown path and no overall pass", async () => {
    const state = fixture({ markRun: true });
    const root = state.workspace.worktreeRoot;
    writeFileSync(join(root, "unknown-a.mjs"), "export const unknownA = true;\n");
    writeFileSync(join(root, "unknown-b.mjs"), "export const unknownB = true;\n");
    const pre = capturePreExecutionTaskChangeScope({ task: state.task, workspace: state.workspace });
    expect(pre.changed_paths).toEqual(["product.mjs", "unknown-a.mjs", "unknown-b.mjs"]);
    const result = await runCapture(fixedCommand(), "quality/tests/targeted-mixed.json", state);
    expect(existsSync(state.marker)).toBe(true);
    expect(result.dispatch_state).toBe("executed");
    expect(result.targeted_capture).toMatchObject({ status: "unavailable",
      reason: "unmapped_changed_path", business_effect_status: "unknown",
      selected_case_ids: ["CASE-PRODUCT"],
      unmapped_changed_paths: ["unknown-a.mjs", "unknown-b.mjs"] });
    expect(result.change_scope.changed_paths).toEqual(pre.changed_paths);
    const manifest = JSON.parse(state.task.readRecord(result.targeted_capture.manifest_ref));
    expect(manifest).toMatchObject({ selection_status: "unavailable",
      business_effect_status: "unknown", selected_case_ids: ["CASE-PRODUCT"] });
    expect(manifest.reports).toHaveLength(1);
    expect(result.case_reconciliation).toMatchObject({ status: "unavailable",
      reason: "unmapped_changed_path", business_effect_status: "unknown",
      unmapped_changed_paths: ["unknown-a.mjs", "unknown-b.mjs"] });
    const { reconcileCurrentTaskCases } = await import("../../workflows/build-code/case-reconciliation.mjs");
    expect(reconcileCurrentTaskCases({ task: state.task, workspace: state.workspace, capture: result }))
      .toMatchObject({ status: "unavailable", reason: "unmapped_changed_path",
        execution_freshness: "unknown", selected_case_ids: ["CASE-PRODUCT"],
        unmapped_changed_paths: ["unknown-a.mjs", "unknown-b.mjs"] });
    const forged = { ...result, targeted_capture: { ...result.targeted_capture,
      unmapped_changed_paths: ["unknown-a.mjs"] } };
    expect(reconcileCurrentTaskCases({ task: state.task, workspace: state.workspace, capture: forged }))
      .toMatchObject({ status: "unavailable", reason: "catalog_case_mismatch" });
    writeFileSync(join(root, "unknown-b.mjs"), "export const unknownB = false;\n");
    expect(reconcileCurrentTaskCases({ task: state.task, workspace: state.workspace, capture: result }))
      .toMatchObject({ status: "unavailable", reason: "snapshot_mismatch" });
  });

  it("does not create a receipt or start a child when every changed path is unknown", async () => {
    const state = fixture({ markRun: true });
    const root = state.workspace.worktreeRoot;
    writeFileSync(join(root, "product.mjs"), "export const effect = 'old';\n");
    writeFileSync(join(root, "unknown-only.mjs"), "export const unknown = true;\n");
    const result = await runCapture(fixedCommand(), "quality/tests/targeted-unknown-only.json", state);
    expect(existsSync(state.marker)).toBe(false);
    expect(result.targeted_capture).toMatchObject({ status: "unavailable",
      reason: "unmapped_changed_path" });
    expect(result.targeted_capture).not.toHaveProperty("manifest_ref");
    expect(result).not.toHaveProperty("receipt_ref");
  });

  it("does not run an earlier safe case when a later mixed-case target is unsafe", async () => {
    const state = fixture({ targetCount: 2, markRun: true, unsafeTarget: true, unsafeTargetIndex: 1 });
    writeFileSync(join(state.workspace.worktreeRoot, "unknown.mjs"), "export const unknown = true;\n");
    const result = await runCapture(fixedCommand(), "quality/tests/targeted-mixed-unsafe.json", state);
    expect(existsSync(state.marker)).toBe(false);
    expect(result.targeted_capture).toMatchObject({ status: "unavailable" });
    expect(result).not.toHaveProperty("receipt_ref");
  });

  it("does not run a mixed case when the catalog source binding is stale", async () => {
    const state = fixture({ markRun: true });
    const root = state.workspace.worktreeRoot;
    writeFileSync(join(root, "unknown.mjs"), "export const unknown = true;\n");
    writeFileSync(join(root, "specs", state.task.identity.taskId, "decision-log.md"),
      "# Decision\n\nChanged after catalog binding.\n");
    const result = await runCapture(fixedCommand(), "quality/tests/targeted-mixed-stale.json", state);
    expect(existsSync(state.marker)).toBe(false);
    expect(result.targeted_capture).toMatchObject({ status: "unavailable",
      reason: "fixed_targeted_child_failed" });
    expect(result.exit_code).not.toBe(0);
  });

  it("does not start a mixed case with a foreign task workspace", async () => {
    const state = fixture({ markRun: true });
    const foreign = fixture();
    writeFileSync(join(state.workspace.worktreeRoot, "unknown.mjs"), "export const unknown = true;\n");
    const result = await runCapture(fixedCommand(), "quality/tests/targeted-mixed-foreign.json",
      { task: state.task, workspace: foreign.workspace });
    expect(existsSync(state.marker)).toBe(false);
    expect(result).not.toHaveProperty("receipt_ref");
    expect(result.change_scope.status).not.toBe("recorded");
  });

  it("executes a fresh fixed command twice and binds inner argv, raw reporter and canonical outer receipts", async () => {
    const state = fixture({ targetCount: 3 });
    expect(fixedCommand()).toMatch(/targeted-capture\.mjs/);
    const catalog = JSON.parse(readFileSync(join(state.workspace.worktreeRoot,
      "docs/quality/business-case-catalog.json"), "utf8"));
    for (const item of catalog.cases) {
      expect(item.source.revision).toBe(`sha256:${hash(readFileSync(join(state.workspace.worktreeRoot,
        item.source.path)))}`);
      expect(item.rule.revision).toBe(`sha256:${hash(readFileSync(join(state.workspace.worktreeRoot,
        item.rule.path)))}`);
      expect(item.effect_observation).toMatchObject({ observation_status: "not_yet_observed",
        rule_revision: item.rule.revision,
        canonical_source: { type: "current_task_acceptance_quality_fact_chain", stage: "build-code",
          subject: "AC-001", material_source_path: item.source.path, rule_source_path: item.rule.path,
          acceptance_ref_template: "quality/evidence/acceptance/build-code/AC-001-{acceptance_sha256}.json" } });
    }
    const pre = capturePreExecutionTaskChangeScope({ task: state.task, workspace: state.workspace });
    expect(pre).toMatchObject({ status: "recorded", changed_paths: ["product.mjs"] });
    const first = await runCapture(fixedCommand(), "quality/tests/targeted-round-1.json", state);
    const second = await runCapture(fixedCommand(), "quality/tests/targeted-round-2.json", state);
    if (process.env.WORKFLOWHUB_P10_CAPTURE_SAMPLE === "1") {
      const evidenceDir = resolve(workflowRoot, "quality/evidence/stage-quality/build-code/P10/targeted-fixture-sample-v2");
      mkdirSync(evidenceDir, { recursive: true });
      const outerRaw = state.task.readRecord(first.receipt_ref);
      const outerOutputRaw = state.task.readRecord(first.output_ref);
      const pointer = JSON.parse(outerOutputRaw.trim());
      const manifestRaw = state.task.readRecord(pointer.manifest_ref);
      const manifest = JSON.parse(manifestRaw);
      writeFileSync(join(evidenceDir, "outer-receipt.json"), outerRaw);
      writeFileSync(join(evidenceDir, "outer-output.txt"), outerOutputRaw);
      writeFileSync(join(evidenceDir, "inner-manifest.json"), manifestRaw);
      for (const [index, report] of manifest.reports.entries()) {
        writeFileSync(join(evidenceDir, `case-${index + 1}.json`), state.task.readRecord(report.record_ref));
        writeFileSync(join(evidenceDir, `case-${index + 1}.raw.json`), state.task.readRecord(report.raw_ref));
      }
      writeFileSync(join(evidenceDir, "sample-meta.json"), `${JSON.stringify({
        fixture_only: true, copied_at: new Date().toISOString(),
        original_temporary_task_store_removed_after_test: true,
        task_id: state.task.identity.taskId, snapshot_tree: first.snapshot_tree,
        material_revision: first.targeted_capture.material_revision,
        outer_receipt_ref: first.receipt_ref, outer_receipt_sha256: hash(outerRaw),
        outer_output_ref: first.output_ref, outer_output_sha256: hash(outerOutputRaw),
        inner_manifest_ref: pointer.manifest_ref, inner_manifest_sha256: hash(manifestRaw),
        reports: manifest.reports.map((report) => ({ case_id: report.case_id,
          target: report.target, record_ref: report.record_ref, record_sha256: report.record_hash,
          raw_ref: report.raw_ref, raw_sha256: report.raw_sha256,
          argv: report.argv, exit_code: report.exit_code, full_ids: report.full_ids })),
      }, null, 2)}\n`);
    }
    for (const result of [first, second]) {
      expect(result.dispatch_state).toBe("executed");
      expect(result.exit_code).toBe(0);
      expect(result.targeted_capture).toMatchObject({ status: "executed", task_id: state.task.identity.taskId,
        snapshot_tree: pre.snapshot_tree, material_revision: expect.stringMatching(/^revision-/),
        selected_case_ids: ["CASE-PRODUCT", "CASE-PRODUCT-2", "CASE-PRODUCT-3"] });
      const innerRaw = state.task.readRecord(result.targeted_capture.manifest_ref);
      expect(hash(innerRaw)).toBe(result.targeted_capture.manifest_hash);
      const inner = JSON.parse(innerRaw);
      expect(inner.execution.argv).toHaveLength(3);
      expect(inner.reports).toHaveLength(3);
      for (const [index, report] of inner.reports.entries()) {
        const target = state.targets[index];
        const caseId = index === 0 ? "CASE-PRODUCT" : `CASE-PRODUCT-${index + 1}`;
        expect(report).toMatchObject({ case_id: caseId, target, exit_code: 0,
          argv: expect.arrayContaining(["run", target, "--reporter=json"]),
          full_ids: [`${target} > product effect`], canonical_receipt: false });
        expect(hash(state.task.readRecord(report.raw_ref))).toBe(report.raw_sha256);
        expect(hash(state.task.readRecord(report.record_ref))).toBe(report.record_hash);
        expect(inner.observations).toContainEqual(expect.objectContaining({ case_id: caseId,
          full_id: `${target} > product effect`, status: "passed" }));
      }
      expect(hash(state.task.readRecord(inner.execution.raw_output_ref))).toBe(inner.execution.raw_output_sha256);
      const outer = JSON.parse(state.task.readRecord(result.receipt_ref));
      expect(outer.command).toBe(fixedCommand());
      expect(outer.behavior_fingerprint).toMatchObject({ task_id: state.task.identity.taskId,
        snapshot_tree: pre.snapshot_tree, registry_revision: "fixture.1" });
      expect(hash(state.task.readRecord(outer.output_ref))).toBe(outer.output_hash);
      const pointer = JSON.parse(state.task.readRecord(outer.output_ref).trim());
      expect(pointer.run_id).toBe(inner.run_id);
      expect(pointer.reports).toHaveLength(3);
      expect(pointer.reports.map((entry) => entry.record_hash)).toEqual(inner.reports.map((entry) => entry.record_hash));
      expect(result.case_reconciliation).toMatchObject({ status: "unavailable",
        reason: "business_effect_unavailable", execution_freshness: "observed_now",
        business_effect_reason: "missing_current_business_effect",
        task_id: state.task.identity.taskId, receipt_ref: result.receipt_ref,
        manifest_ref: pointer.manifest_ref, entries: [
          { case_id: "CASE-PRODUCT", status: "observed_this_call" },
          { case_id: "CASE-PRODUCT-2", status: "observed_this_call" },
          { case_id: "CASE-PRODUCT-3", status: "observed_this_call" },
        ] });
      expect(result.case_reconciliation.parent_run_id).toBe(outer.behavior_fingerprint.run_id);
      expect(result.case_reconciliation.child_run_id).toBe(pointer.run_id);
      const { reconcileCurrentTaskCases } = await import("../../workflows/build-code/case-reconciliation.mjs");
      expect(reconcileCurrentTaskCases({ task: state.task, workspace: state.workspace, capture: result }))
        .toMatchObject({ status: "unavailable", reason: "current_execution_unverified",
          execution_freshness: "unknown" });
    }
    expect(first.receipt_ref).not.toBe(second.receipt_ref);
    expect(first.targeted_capture.run_id).not.toBe(second.targeted_capture.run_id);
    expect(first.targeted_capture.manifest_ref).not.toBe(second.targeted_capture.manifest_ref);
  });

  it("keeps a missing canonical effect subject unavailable after a real fixture test run", async () => {
    const state = fixture({ omitCanonicalSource: true });
    const result = await runCapture(fixedCommand(), "quality/tests/targeted-unbound-effect.json", state);
    expect(result.dispatch_state).toBe("executed");
    expect(result.case_reconciliation).toMatchObject({ status: "unavailable",
      reason: "business_effect_unavailable", business_effect_status: "unknown",
      business_effect_reason: "invalid_business_effect_binding",
      entries: [{ status: "observed_this_call" }] });
    const { reconcileCurrentTaskCases } = await import("../../workflows/build-code/case-reconciliation.mjs");
    expect(reconcileCurrentTaskCases({ task: state.task, workspace: state.workspace, capture: result }))
      .toMatchObject({ status: "unavailable", execution_freshness: "unknown",
        business_effect_status: "unknown", business_effect_reason: "invalid_business_effect_binding" });
  });

  it("rejects unsafe registry targets before any selected child test runs", async () => {
    const state = fixture({ unsafeTarget: true });
    expect(fixedCommand()).toMatch(/targeted-capture\.mjs/);
    const result = await runCapture(fixedCommand(), "quality/tests/targeted-unsafe.json", state);
    expect(result.dispatch_state).not.toBe("executed");
    expect(result.targeted_capture?.status).not.toBe("executed");
    expect(result.exit_code).not.toBe(0);
  });

  it("rejects a source snapshot changed by the selected test", async () => {
    const state = fixture({ mutateSource: true });
    expect(fixedCommand()).toMatch(/targeted-capture\.mjs/);
    await expect(runCapture(fixedCommand(), "quality/tests/targeted-stale.json", state))
      .rejects.toThrow(/snapshot|source|changed/i);
  });

  it("rejects two selected cases sharing one test file before the child test can run", async () => {
    const state = fixture({ targetCount: 2, sharedTarget: true });
    const result = await runCapture(fixedCommand(), "quality/tests/targeted-shared.json", state);
    expect(result.dispatch_state).not.toBe("executed");
    expect(result.targeted_capture).toMatchObject({ status: "unavailable", reason: "fixed_targeted_child_failed" });
    expect(result.exit_code).not.toBe(0);
    expect(existsSync(join(state.workspace.worktreeRoot, "target-ran.marker"))).toBe(false);
  });

  it("kills an inner test with the outer timeout before its delayed side effect", async () => {
    const state = fixture({ slowTarget: true });
    const result = await runCapture(fixedCommand(), "quality/tests/targeted-timeout.json",
      { ...state, timeoutMs: 4500 });
    expect(result.exit_code).toBe(124);
    expect(result.dispatch_state).not.toBe("executed");
    expect(existsSync(join(state.root, "started.marker"))).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 4000));
    expect(existsSync(join(state.root, "late.marker"))).toBe(false);
  }, 15_000);
});

describe("P10 outer readback of actual per-target reporter bytes", () => {
  function sample() {
    const dir = resolve(workflowRoot, "quality/evidence/stage-quality/build-code/P10/targeted-fixture-sample-v2");
    const manifest = JSON.parse(readFileSync(join(dir, "inner-manifest.json")));
    const rawReports = manifest.reports.map((_report, index) =>
      readFileSync(join(dir, `case-${index + 1}.raw.json`), "utf8"));
    const firstFile = JSON.parse(rawReports[0]).testResults[0].name;
    const workspaceRoot = dirname(dirname(dirname(firstFile)));
    const selection = { cases: manifest.reports.map((report) => ({ id: report.case_id,
      execution: { target: report.target, registered_test_ids: report.full_ids } })) };
    return { workspaceRoot, selection, manifest, rawReports,
      aggregateRaw: rawReports.join("\n") };
  }

  it("accepts only the three original, complete reporter documents and exact aggregate bytes", () => {
    expect(capture.verifyFixedTargetedReporter).toBeTypeOf("function");
    expect(capture.verifyFixedTargetedReporter(sample())).toBe(true);
  });

  it.each(["missing", "extra", "skipped"])("rejects %s actual leaves even when the manifest hashes are recalculated", (fault) => {
    expect(capture.verifyFixedTargetedReporter).toBeTypeOf("function");
    const input = sample();
    const report = JSON.parse(input.rawReports[0]);
    const file = report.testResults[0];
    if (fault === "missing") {
      file.assertionResults = [];
      report.numTotalTests = 0;
      report.numPassedTests = 0;
    } else if (fault === "extra") {
      file.assertionResults.push({ ...file.assertionResults[0], title: "unregistered leaf", fullName: "unregistered leaf" });
      report.numTotalTests = 2;
      report.numPassedTests = 2;
    } else {
      file.assertionResults[0].status = "skipped";
      report.numPassedTests = 0;
      report.numPendingTests = 1;
    }
    input.rawReports[0] = JSON.stringify(report);
    input.manifest.reports[0].raw_sha256 = hash(input.rawReports[0]);
    input.aggregateRaw = input.rawReports.join("\n");
    input.manifest.execution.raw_output_sha256 = hash(input.aggregateRaw);
    // The manifest's observations remain self-reported "passed"; only the
    // actual reporter bytes can disprove that forged statement.
    expect(() => capture.verifyFixedTargetedReporter(input)).toThrow(/reporter|leaf|aggregate/i);
  });

  it("rejects a self-hashed aggregate that differs from ordered per-target raw bytes", () => {
    expect(capture.verifyFixedTargetedReporter).toBeTypeOf("function");
    const input = sample();
    input.aggregateRaw = `${input.aggregateRaw}\nextra`;
    input.manifest.execution.raw_output_sha256 = hash(input.aggregateRaw);
    expect(() => capture.verifyFixedTargetedReporter(input)).toThrow(/aggregate|reporter/i);
  });
});
