import { afterEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { initializeTaskStore, readTaskFacts } from "../../runtime/task/task-store.mjs";
import { acceptanceExecutionFacts } from "../../runtime/stage/stage-handlers.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";

const roots = [];
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function analyzerReadback(task, result) {
  const facts = (result.quality_advisory_fact_refs ?? []).map((ref) => JSON.parse(task.readRecord(ref)));
  const fact = facts.find((item) => item.subject === "stage_end_spec_analyze");
  const acceptance = JSON.parse(task.readRecord(fact.evidence[0].ref));
  const stageQuality = JSON.parse(task.readRecord(acceptance.refs[0].ref));
  return { fact, acceptance, stageQuality, analysis: stageQuality.subject_fact.analysis_result };
}

function fixture({ thin = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-post-phase-handler-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "base.mjs"), "export const value = 1;\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "base"]);
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "workflowhub", task_id: "post-phase-handler",
    created_at: "2026-09-22T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
    record_model: "vnext-single-write", activation_cohort: "post",
  } });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const workspace = openCurrentTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", `# Decision

## 核心需求

- **任务类型**：普通任务

## 需求变更记录

### U-001 — 逐字

> 展示结果；空结果明确失败。

## 原始需求索引

| requirement_id | 真实来源锚点 | 主要决定 |
|---|---|---|
| R-001 | U-001 | D-001 |

## 逐字声明层（verbatim）

| V-ID | 说出者 | 场景 | 逐字原文 |
|---|---|---|---|
| V-001 | 用户 | 原话 | 展示结果；空结果明确失败。 |
`);
  const thinSpec = "# Spec\n\n- **FR-001**：展示结果。\n- [ ] **AC-001 — 展示结果**：有结果时可读，空结果失败。\n";
  artifacts.writeAtomic("spec.md", thin ? thinSpec : `${thinSpec}
## 实现设计（全局权威）

### Code Anchors

\`base.mjs#value\` currently exports the result value; the consumer reads it from this module.

### Interfaces and Failure Semantics

The result producer accepts a valid value and returns visible output; an empty value reports a failure instead of silent success.

### Requirement-to-Task Trace

| source | FR | AC | Phase/Task | oracle | evidence |
| --- | --- | --- | --- | --- | --- |
| R-001 | FR-001 | AC-001 | P1/T001 | ORACLE-RESULT-001 | \`quality/tests/result.json\` |

### Global Verification Strategy

Run \`node --test tests/result.test.mjs\`; RED names the target result assertion, GREEN exits 0; store both observed outputs at the declared evidence ref.
`);
  artifacts.writeAtomic("phases/index.md", "# Phase index\n\n## Execution Index\n\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| `P1` | `phases/P1.md` | `phase-p1` | `base.mjs` | `none` | build-code |\n");
  const thinPhase = "# Phase P1 — Result\n\n- **Global spec**：`spec.md`\n- **Write set**：`base.mjs`\n- **Dependency**：`none`\n- **Consumer**：build-code\n\n## L0 — Outcome\n\n展示 FR-001 / AC-001。\n\n## L1 — Contract\n\n- **Tasks**：`T001 RED` → `T002 GREEN`\n- **gate_cmd**：`node --test tests/result.test.mjs`\n- **oracle**：ORACLE-RESULT-001\n- **evidence_path**：`quality/tests/result.json`\n- **STOP**：需求变更回 spec。\n- **Done**：正负例可回放。\n- **Deletion proofs**：no deletion。\n\n## L2 — Removable reference\n\n过期可删除。\n";
  artifacts.writeAtomic("phases/P1.md", thin ? thinPhase : thinPhase.replace("## L2 — Removable reference", `### T001 — Show result without hiding failure

- **Source / FR / AC**：R-001 / FR-001 / AC-001; visible result and empty-result failure.
- **Files / symbols**：\`base.mjs\` symbol: value; preserve the current export consumer.
- **Action**：Extend value handling to expose a readable result and explicit empty-result rejection.
- **Inputs**：The current module export and valid/empty result fixtures.
- **Outputs / failure**：Readable result for valid value, explicit error for empty value.
- **Boundary / DO NOT TOUCH**：Only \`base.mjs\`; do not modify task history or other modules.
- **Dependency**：none; this is the first and only task.
- **Test tier / skill**：feature / backend-testing.
- **Scenario / fixture or service**：Valid value and empty-value negative case; local fixture, no service setup.
- **RED/GREEN gate_cmd**：\`node --test tests/result.test.mjs\`.
- **expected_exit**：RED target assertion nonzero; GREEN 0.
- **RED target failure**：ORACLE-RESULT-001 result assertion fails before the implementation.
- **GREEN oracle**：ORACLE-RESULT-001; result assertion passes and empty value remains an error.
- **Evidence**：\`quality/tests/result.json\` holds RED and GREEN command, exit and assertions.
- **STOP / recovery**：If the export consumer changes, stop and repair the spec and this card.
- **Coverage limit**：This fixture cannot prove production service integration.
- **Done**：AC-001 normal and negative result, scoped test evidence and readback exist.

## L2 — Removable reference`));
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts, now: () => "2026-09-22T00:00:00.000Z" });
  return { task, candidateWorkspace, workspace, artifacts, kernel };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("post build-plan official handler", () => {
  it("reads the post native acceptance card and binds executed evidence per declared AC", async () => {
    const { task, artifacts, kernel } = fixture();
    artifacts.writeAtomic("base.mjs", "export const value = 1;\n");
    const phase = artifacts.read("phases/P1.md").replace(
      "- **Done**：AC-001 normal and negative result, scoped test evidence and readback exist.",
      "- **Done**：AC-001 normal and negative result, scoped test evidence and readback exist.\n"
        + "- **acceptance_role**：acceptance\n"
        + "- **acceptance_data**：`[{\"source\":\"fixture\",\"sample\":\"current\",\"scenario\":\"native service\",\"tier\":\"service\",\"execution\":{\"module_ref\":\"tests/acceptance/card-07-current.mjs\",\"export_name\":\"produceCard07Current\",\"input\":{\"command\":[\"node\",\"--version\"]},\"timeout_ms\":1000}}]`",
    );
    artifacts.writeAtomic("phases/P1.md", phase);
    const snapshotTree = kernel.currentVNextSnapshot().tree;
    const runAcceptanceScenario = vi.fn(async (scenario) => {
      expect(scenario).toMatchObject({
        task_id: task.identity.taskId,
        stage: "build-code",
        snapshot_tree: snapshotTree,
        tier: "service",
        acceptance_criterion_ids: ["AC-001"],
      });
      return {
        status: "executed",
        tier: "service",
        executor: "workspace-command",
        evidence_refs: [{ ref: "quality/evidence/stage-quality/build-code/AC-001-evidence.json", sha256: "a".repeat(64) }],
      };
    });
    const result = await acceptanceExecutionFacts({
      stage: "build-code",
      manifest: task.manifest,
      identity: task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-code"),
      currentAttemptId: "attempt-native-acceptance",
      currentMaterialRevision: kernel.currentVNextMaterialRevision(),
      readArtifact: (name) => artifacts.read(name),
      runAcceptanceScenario,
    }, snapshotTree);
    expect(result).toMatchObject({
      status: "executed",
      requires_execution: true,
      items: [expect.objectContaining({ task_id: task.identity.taskId, acceptance_criterion_ids: ["AC-001"], status: "executed" })],
    });
    expect(runAcceptanceScenario).toHaveBeenCalledOnce();
  });

  it("runs the current post build-code stage-end analyzer against indexed Phase materials", async () => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture();
    const context = {
      stage: "build-code", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), candidateWorkspace, workspace, artifacts,
    };
    const snapshotTree = kernel.currentVNextSnapshot().tree;
    const materialRevision = kernel.currentVNextMaterialRevision();
    const sourceContentSha256 = sha256(artifacts.read("decision-log.md"));
    const skillBundleSha256 = sha256(readFileSync(new URL("../../skills/spec-analyze/skill-bundle.json", import.meta.url)));
    const runSpecAnalyze = vi.fn(async (request) => {
      expect(request).toMatchObject({
        task_id: task.identity.taskId,
        stage: "build-code",
        step_slug: "stage-end-spec-analyze",
        skill_id: "spec-analyze",
        snapshot_tree: snapshotTree,
        material_revision: materialRevision,
        source_content_sha256: sourceContentSha256,
        skill_bundle_sha256: skillBundleSha256,
      });
      expect(request.materials).toMatchObject({
        decision_log: artifacts.read("decision-log.md"),
        spec: artifacts.read("spec.md"),
        phase_index: artifacts.read("phases/index.md"),
        phases: { "phases/P1.md": artifacts.read("phases/P1.md") },
      });
      return {
        schema_version: "workflowhub-spec-analyze-lens-result.v1",
        task_id: task.identity.taskId,
        stage: "build-code",
        step_slug: "stage-end-spec-analyze",
        skill_id: "spec-analyze",
        snapshot_tree: snapshotTree,
        material_revision: materialRevision,
        source_content_sha256: sourceContentSha256,
        skill_bundle_sha256: skillBundleSha256,
        source_ids: request.source_ids,
        result: {
          status: "inconsistent",
          facts: { lens_execution_id: "build-code-lens-current-revision" },
          errors: ["AC-001 acceptance chain remains incomplete"],
        },
      };
    });

    const result = await runOfficialStage("build-code", context, { receipts: {} }, { runSpecAnalyze });
    expect(runSpecAnalyze).toHaveBeenCalledOnce();
    const advisoryFacts = (result.quality_advisory_fact_refs ?? [])
      .map((ref) => JSON.parse(task.readRecord(ref)));
    const fact = advisoryFacts.find((item) => item.subject === "stage_end_spec_analyze");
    expect(fact).toMatchObject({ subject: "stage_end_spec_analyze", status: "missing" });
    const acceptance = JSON.parse(task.readRecord(fact.evidence[0].ref));
    const stageQuality = JSON.parse(task.readRecord(acceptance.refs[0].ref));
    expect(stageQuality.subject_fact.analysis_result).toMatchObject({
      status: "material_incomplete",
      facts: { lens_execution_id: "build-code-lens-current-revision" },
      errors: expect.arrayContaining(["AC-001 acceptance chain remains incomplete"]),
    });
  });

  it("post build-plan final analyze reports structure without semantic census", async () => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture();
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, workspace, artifacts,
    };
    await expect(runOfficialStage("build-plan", context, {
      receipts: {},
      spec_analyze: { result: { status: "consistent" } },
    })).rejects.toThrow(/unknown fields: spec_analyze/);
    const result = await runOfficialStage("build-plan", context, { receipts: {} });
    expect(result.quality_advisories).not.toContain("stage-end-spec-analyze:inconsistent");
    const facts = (result.quality_advisory_fact_refs ?? []).map((ref) => JSON.parse(task.readRecord(ref)));
    const fact = facts.find((item) => item.subject === "stage_end_spec_analyze");
    expect(fact).toMatchObject({ subject: "stage_end_spec_analyze", status: "passed" });
    const acceptance = JSON.parse(task.readRecord(fact.evidence[0].ref));
    const stageQuality = JSON.parse(task.readRecord(acceptance.refs[0].ref));
    expect(stageQuality.subject_fact.analysis_result).toMatchObject({ status: "reported" });
    expect(stageQuality.subject_fact.analysis_result.facts.requirement_count).toBeNull();
    expect(stageQuality.subject_fact.analysis_result.facts.source_content_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(stageQuality.subject_fact.analysis_result.facts.skill_bundle_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(stageQuality.subject_fact.analysis_result.errors).toEqual([]);
  });

  it("publishes final analysis against one current snapshot, material revision, original source and skill bundle", async () => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture();
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, workspace, artifacts,
    };
    const snapshotTree = kernel.currentVNextSnapshot().tree;
    const materialRevision = kernel.currentVNextMaterialRevision();
    const decisionLog = artifacts.read("decision-log.md");
    const skillBundle = readFileSync(new URL("../../skills/spec-analyze/skill-bundle.json", import.meta.url));

    const result = await runOfficialStage("build-plan", context, { receipts: {} });
    const { fact, acceptance, stageQuality, analysis } = analyzerReadback(task, result);
    expect(fact).toMatchObject({ status: "passed", snapshot_tree: snapshotTree, material_revision: materialRevision });
    expect(acceptance).toMatchObject({ snapshot_tree: snapshotTree, freshness: { snapshot_tree: snapshotTree, material_revision: materialRevision } });
    expect(stageQuality).toMatchObject({ snapshot_tree: snapshotTree, material_revision: materialRevision });
    expect(analysis).toMatchObject({ status: "reported", facts: {
      source_content_sha256: sha256(decisionLog), skill_bundle_sha256: sha256(skillBundle),
    } });
  });

  it("invokes the portable lens after the last Phase revision and publishes its bound semantic result", async () => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture();
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, workspace, artifacts,
    };
    artifacts.writeAtomic("phases/P1.md", `${artifacts.read("phases/P1.md")}\n- **Final note**：空结果明确失败。\n`);
    const snapshotTree = kernel.currentVNextSnapshot().tree;
    const materialRevision = kernel.currentVNextMaterialRevision();
    const sourceContentSha256 = sha256(artifacts.read("decision-log.md"));
    const skillBundleSha256 = sha256(readFileSync(new URL("../../skills/spec-analyze/skill-bundle.json", import.meta.url)));
    const runSpecAnalyze = vi.fn(async (request) => {
      expect(request).toMatchObject({
        task_id: task.identity.taskId,
        stage: "build-plan",
        step_slug: "final-spec-analyze",
        skill_id: "spec-analyze",
        snapshot_tree: snapshotTree,
        material_revision: materialRevision,
        source_content_sha256: sourceContentSha256,
        skill_bundle_sha256: skillBundleSha256,
      });
      expect(request.materials).toMatchObject({
        decision_log: artifacts.read("decision-log.md"),
        spec: artifacts.read("spec.md"),
        phases: { "phases/P1.md": artifacts.read("phases/P1.md") },
      });
      return {
        schema_version: "workflowhub-spec-analyze-lens-result.v1",
        task_id: task.identity.taskId,
        stage: "build-plan",
        step_slug: "final-spec-analyze",
        skill_id: "spec-analyze",
        snapshot_tree: snapshotTree,
        material_revision: materialRevision,
        source_content_sha256: sourceContentSha256,
        skill_bundle_sha256: skillBundleSha256,
        result: {
          status: "inconsistent",
          facts: { lens_execution_id: "lens-current-revision" },
          errors: ["U-001 semantic coverage remains unknown"],
        },
      };
    });

    const result = await runOfficialStage("build-plan", context, { receipts: {} }, { runSpecAnalyze });
    expect(runSpecAnalyze).toHaveBeenCalledOnce();
    const { fact, analysis, stageQuality } = analyzerReadback(task, result);
    expect(fact.status).toBe("missing");
    expect(stageQuality).toMatchObject({ snapshot_tree: snapshotTree, material_revision: materialRevision });
    expect(analysis).toMatchObject({
      status: "inconsistent",
      facts: { lens_execution_id: "lens-current-revision" },
      errors: expect.arrayContaining(["U-001 semantic coverage remains unknown"]),
    });
  });

  it("reports the portable lens as unavailable when the publication callback is absent", async () => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture();
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, workspace, artifacts,
    };
    const { fact, analysis } = analyzerReadback(task, await runOfficialStage("build-plan", context, { receipts: {} }));
    expect(fact.status).toBe("passed");
    expect(analysis.status).toBe("reported");
    expect(analysis.facts.lens_execution_status).toBe("unavailable");
  });

  it("publishes a bound unavailable analyzer fact when the portable lens executor rejects", async () => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture();
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, workspace, artifacts,
    };
    const snapshotTree = kernel.currentVNextSnapshot().tree;
    const materialRevision = kernel.currentVNextMaterialRevision();
    const sourceContentSha256 = sha256(artifacts.read("decision-log.md"));
    const skillBundleSha256 = sha256(readFileSync(new URL("../../skills/spec-analyze/skill-bundle.json", import.meta.url)));
    const secret = "provider-token=never-publish-this";
    const result = await runOfficialStage("build-plan", context, { receipts: {} }, {
      runSpecAnalyze: async () => { throw new Error(secret); },
    });
    const { fact, stageQuality, analysis } = analyzerReadback(task, result);
    expect(fact.status).toBe("passed");
    expect(stageQuality).toMatchObject({ snapshot_tree: snapshotTree, material_revision: materialRevision });
    expect(analysis.status).toBe("reported");
    expect(analysis.facts).toMatchObject({
      source_content_sha256: sourceContentSha256,
      skill_bundle_sha256: skillBundleSha256,
      lens_execution_status: "unavailable",
      lens_failure_code: "executor_rejected",
    });
    expect(JSON.stringify({ result, stageQuality, analysis })).not.toContain(secret);
  });

  it("keeps the structural result non-pass when the executed lens reports semantic unknown", async () => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture();
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, workspace, artifacts,
    };
    const { fact, analysis } = analyzerReadback(task, await runOfficialStage("build-plan", context, { receipts: {} }, {
      runSpecAnalyze: async () => ({
        schema_version: "workflowhub-spec-analyze-lens-result.v1",
        task_id: task.identity.taskId,
        stage: "build-plan",
        step_slug: "final-spec-analyze",
        skill_id: "spec-analyze",
        snapshot_tree: kernel.currentVNextSnapshot().tree,
        material_revision: kernel.currentVNextMaterialRevision(),
        source_content_sha256: sha256(artifacts.read("decision-log.md")),
        skill_bundle_sha256: sha256(readFileSync(new URL("../../skills/spec-analyze/skill-bundle.json", import.meta.url))),
        result: { status: "unknown", facts: { lens_execution_id: "unknown-verdict" }, errors: ["semantic equivalence unknown"] },
      }),
    }));
    expect(fact.status).toBe("missing");
    expect(analysis.status).toBe("inconsistent");
    expect(analysis.facts).toMatchObject({
      lens_execution_id: "unknown-verdict",
      lens_execution_status: "executed",
      lens_semantic_status: "unknown",
    });
    expect(analysis.errors).toEqual(expect.arrayContaining(["semantic equivalence unknown"]));
  });

  it.each([
    ["stale material revision", (bound) => ({ ...bound, material_revision: "old-revision" }), /material_revision does not match/],
    ["self-asserted consistency", (bound) => ({ ...bound, result: { ...bound.result, status: "consistent" } }), /unauthenticated consistency/],
  ])("rejects a portable lens result with %s", async (_name, alter, errorPattern) => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture();
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, workspace, artifacts,
    };
    const bound = {
      schema_version: "workflowhub-spec-analyze-lens-result.v1",
      task_id: task.identity.taskId,
      stage: "build-plan",
      step_slug: "final-spec-analyze",
      skill_id: "spec-analyze",
      snapshot_tree: kernel.currentVNextSnapshot().tree,
      material_revision: kernel.currentVNextMaterialRevision(),
      source_content_sha256: sha256(artifacts.read("decision-log.md")),
      skill_bundle_sha256: sha256(readFileSync(new URL("../../skills/spec-analyze/skill-bundle.json", import.meta.url))),
      result: { status: "inconsistent", facts: {}, errors: ["semantic coverage unknown"] },
    };
    await expect(runOfficialStage("build-plan", context, { receipts: {} }, {
      runSpecAnalyze: async () => alter(bound),
    })).rejects.toThrow(errorPattern);
    const qualityFactDir = join(task.taskPath, "quality/facts");
    const qualityFacts = existsSync(qualityFactDir)
      ? readdirSync(qualityFactDir).map((name) => JSON.parse(readFileSync(join(qualityFactDir, name), "utf8")))
      : [];
    expect(qualityFacts.some((fact) => fact.subject === "stage_end_spec_analyze")).toBe(false);
  });

  it("recomputes final analysis after the last Phase changes and leaves the old result bound to old materials", async () => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture();
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, workspace, artifacts,
    };
    const first = analyzerReadback(task, await runOfficialStage("build-plan", context, { receipts: {} }));
    const oldRevision = first.stageQuality.material_revision;
    const oldTree = first.stageQuality.snapshot_tree;
    artifacts.writeAtomic("phases/P1.md", `${artifacts.read("phases/P1.md")}\n- **Review note**：空结果必须继续明确失败。\n`);
    const nextRevision = kernel.currentVNextMaterialRevision();
    const nextTree = kernel.currentVNextSnapshot().tree;
    expect(nextRevision).not.toBe(oldRevision);
    expect(nextTree).not.toBe(oldTree);

    const second = analyzerReadback(task, await runOfficialStage("build-plan", context, { receipts: {} }));
    expect(second.fact.status).toBe("passed");
    expect(second.stageQuality).toMatchObject({ material_revision: nextRevision, snapshot_tree: nextTree });
    expect(second.stageQuality.material_revision).not.toBe(oldRevision);
    expect(second.analysis.facts.source_content_sha256).toBe(first.analysis.facts.source_content_sha256);
    expect(second.analysis.facts.skill_bundle_sha256).toBe(first.analysis.facts.skill_bundle_sha256);
    expect(JSON.parse(task.readRecord(first.acceptance.refs[0].ref))).toMatchObject({
      material_revision: oldRevision, snapshot_tree: oldTree,
    });
  });

  it("keeps a weakened semantic statement for independent review rather than the structural report", async () => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture();
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, workspace, artifacts,
    };
    const decisionLog = artifacts.read("decision-log.md").replaceAll(
      "展示结果；空结果明确失败。", "每轮都展示结果；每轮空结果都明确失败。",
    );
    artifacts.writeAtomic("decision-log.md", decisionLog);
    artifacts.writeAtomic("phases/P1.md", artifacts.read("phases/P1.md").replaceAll(
      "展示 FR-001 / AC-001。", "只在第一轮展示 FR-001 / AC-001。",
    ));

    const { fact, analysis } = analyzerReadback(task, await runOfficialStage("build-plan", context, { receipts: {} }));
    expect(fact.status).toBe("passed");
    expect(analysis.status).toBe("reported");
    expect(analysis.facts.source_content_sha256).toBe(sha256(decisionLog));
    expect(analysis.errors).toEqual([]);
  });

  it("keeps a missing decision-log statement for independent review", async () => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture();
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, workspace, artifacts,
    };
    const noOriginal = artifacts.read("decision-log.md").replace(/### U-001[^\n]*\n\n>[^\n]*\n/, "");
    artifacts.writeAtomic("decision-log.md", noOriginal);

    const { fact, analysis } = analyzerReadback(task, await runOfficialStage("build-plan", context, { receipts: {} }));
    expect(fact.status).toBe("passed");
    expect(analysis.status).toBe("reported");
    expect(analysis.facts.source_content_sha256).toBe(sha256(noOriginal));
    expect(analysis.errors).toEqual([]);
  });

  it("consumes physical Phase files and never requires plan/tasks placeholders", async () => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture();
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, workspace, artifacts,
    };
    const result = await runOfficialStage("build-plan", context, { receipts: {} });
    const stageRow = readTaskFacts(task.taskPath).find((item) => item.record_kind === "stage" && item.stage === "build-plan");
    expect(stageRow).toBeDefined();
    expect(result.missing_items.join("; ")).not.toMatch(/plan\.md|tasks\.md/);
    expect(result.missing_items.join("; ")).toMatch(/prewritten target RED evidence is not authenticated/i);
    expect(result.stage_handoff).toMatchObject({ status: "published" });
    const handoff = task.readRecord(result.stage_handoff.ref);
    expect(handoff).toContain("phases/P1.md");
  });

  it("refuses the old one-line Phase despite the same physical file set", async () => {
    const { task, candidateWorkspace, workspace, artifacts, kernel } = fixture({ thin: true });
    const context = {
      stage: "build-plan", task, kernel, identity: task.identity, manifest: task.manifest,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-plan"), candidateWorkspace, workspace, artifacts,
    };
    await expect(runOfficialStage("build-plan", context, { receipts: {} })).rejects.toThrow(/task cards|Implementation Design/);
    const stageRow = readTaskFacts(task.taskPath).find((item) => item.record_kind === "stage" && item.stage === "build-plan");
    expect(stageRow?.layer_states?.implementation_completion).toBe("incomplete");
  });
});
