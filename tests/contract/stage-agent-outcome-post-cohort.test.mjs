import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { loadStageManifest } from "../../runtime/stage/step-manifest.mjs";
import { loadStageSkillManifest } from "../../runtime/stage/stage-skill-runtime.mjs";
import {
  createWorkflowHubSessionRecorder,
  publishUnavailableStageAgentOutcome,
} from "../../runtime/stage/stage-agent-outcome-adapter.mjs";

const roots = [];
const repoRoot = realpathSync(new URL("../..", import.meta.url).pathname);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const decisionLog = "# Decision\n\n- R-001：输出应可见。\n";
const spec = `# Specification

- **FR-001**：用户能够看见当前结果。
- **AC-001**：给定有效输入，输出可见且非空。

## 实现设计（全局权威）

### Code Anchors

\`src/output.mjs#renderOutput\` owns the visible result.

### Interfaces and Failure Semantics

renderOutput(input) returns non-empty visible output; empty output is an explicit failure.

### Requirement-to-Task Trace

| source | FR | AC | Phase/Task | oracle | evidence |
| --- | --- | --- | --- | --- | --- |
| R-001 | FR-001 | AC-001 | P1/T001 | ORACLE-P1 | \`quality/tests/p1.json\` |

### Global Verification Strategy

Run \`node --test tests/output.test.mjs\`; RED must fail the visibility assertion and GREEN must exit 0.
`;
const phaseIndex = `# Phase index

## Execution Index

| phase | authority ref | semantic anchor | write set | dependency | consumer |
| --- | --- | --- | --- | --- | --- |
| \`P1\` | \`phases/P1.md\` | \`phase-p1\` | \`src/output.mjs\` | \`none\` | build-code |
`;
const phase = `# Phase P1 — Visible output

- **Global spec**：\`spec.md\`
- **Write set**：\`src/output.mjs\`
- **Dependency**：\`none\`
- **Consumer**：build-code

## L0 — Outcome

Implement FR-001 so valid output is visible and non-empty.

## L1 — Contract

- **FR / AC**：FR-001 / AC-001
- **Tasks**：\`T001 RED\` → \`T002 GREEN\`
- **gate_cmd**：\`node --test tests/output.test.mjs\`
- **expected_exit**：RED nonzero assertion failure; GREEN 0.
- **oracle**：ORACLE-P1
- **evidence_path**：\`quality/tests/p1.json\`
- **STOP**：Stop if the accepted output contract changes.
- **Done**：Visible non-empty output and explicit empty-output failure are tested.

### T001 — Render visible output

- **Source / FR / AC**：R-001 / FR-001 / AC-001。
- **Files / symbols**：\`src/output.mjs\` symbol: renderOutput.
- **Action**：Return the visible result for valid input.
- **Inputs**：One valid input and one empty-result input.
- **Outputs / failure**：Visible result on success; explicit failure for empty output.
- **Boundary / DO NOT TOUCH**：Only \`src/output.mjs\`; do not change the caller contract.
- **Dependency**：\`none\`.
- **Test tier / skill**：feature / backend-testing.
- **Scenario / fixture or service**：Exercise valid and empty output with a local fixture.
- **RED/GREEN gate_cmd**：\`node --test tests/output.test.mjs\`.
- **expected_exit**：RED nonzero assertion failure; GREEN 0.
- **RED target failure**：ORACLE-P1 fails the expected visibility assertion.
- **GREEN oracle**：ORACLE-P1 confirms visible non-empty output.
- **Evidence**：\`quality/tests/p1.json\` records command, exit, and assertion.
- **STOP / recovery**：Stop if the output contract changes; return to the spec owner.
- **Coverage limit**：The fixture does not prove behavior in external consumers.
- **Done**：Normal and empty-output results are covered by the focused test.

## L2 — Removable reference

Implementation reference only; remove when the contract changes.
`;

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-post-stage-outcome-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  git("config", "user.name", "WorkflowHub tests");
  git("config", "user.email", "tests@workflowhub.local");
  writeFileSync(join(repo, "README.md"), "post-cohort outcome fixture\n");
  git("add", ".");
  git("commit", "-qm", "fixture");

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "StageAgentOutcome", task_id: "post-build-plan-outcome",
      created_at: "2026-09-24T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
      record_model: "vnext-single-write", activation_cohort: "post",
    },
  });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", decisionLog);
  artifacts.writeAtomic("spec.md", spec);
  artifacts.writeAtomic("phases/index.md", phaseIndex);
  artifacts.writeAtomic("phases/P1.md", phase);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts });
  return { root, task, candidateWorkspace, artifacts, kernel };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("post-cohort Stage Agent outcome projection", () => {
  it("publishes a completed build-plan analysis bound to current Phase materials and evidence", () => {
    const state = fixture();
    const stage = "build-plan";
    const steps = loadStageManifest(stage, repoRoot).steps;
    const skills = loadStageSkillManifest(repoRoot, stage).manifest.skills;
    const recorder = createWorkflowHubSessionRecorder({
      ...state,
      workspace: state.candidateWorkspace,
      stage,
      attemptId: "post-build-plan-session-attempt",
      host: "fixture-host",
      sourceId: "fixture/session",
      sourceFamily: "fixture",
      agentRunId: "post-build-plan-session",
      sessionId: "post-build-plan-session",
      sourceRef: "fixture:post-build-plan-session",
    });

    for (const step of steps) {
      if (step.on_stage_end === true && step.blocking === false) continue;
      recorder.startStep(step.step_slug)({
        status: "completed",
        result_summary: `completed ${step.step_slug}`,
        evidence: [{ kind: "fixture", result: "completed" }],
      });
    }
    for (const skill of skills) {
      if (["stage-reflection", "stage-handoff"].includes(skill.name)) continue;
      recorder.startSkill(skill.name)({
        status: "completed",
        trigger: true,
        executed: true,
        version: "fixture-1.0.0",
        result_summary: `completed ${skill.name}`,
        evidence: [{ kind: "fixture", result: "completed" }],
      });
    }

    const analyzerStep = steps.find((step) => ["stage-end-spec-analyze", "final-spec-analyze"].includes(step.step_slug));
    expect(analyzerStep).toBeDefined();
    const evidenceSubjects = Object.fromEntries([
      "decision-log", "spec", "phase-index", "phases/P1.md",
    ].map((ref) => [ref, { subject_kind: "step", subject_id: analyzerStep.step_slug }]));
    const outcome = recorder.finish({
      status: "completed",
      spec_analyze: {
        packet: { activation_cohort: "post", original_requirements: [], coverage: [] },
        evidence_subjects: evidenceSubjects,
      },
    });

    const analyzer = outcome.value.spec_analyze;
    expect(outcome.value.status).toBe("completed");
    expect(analyzer.result.status).toBe("reported");
    expect(analyzer.packet.materials).toEqual({
      decision_log: decisionLog,
      spec,
      phase_index: phaseIndex,
      phases: { "phases/P1.md": phase },
    });
    expect(analyzer.packet.materials).not.toHaveProperty("plan");
    expect(analyzer.packet.materials).not.toHaveProperty("tasks");
    expect(outcome.value.material_scope).toEqual([
      "decision-log.md", "spec.md", "phases/index.md", "phases/P1.md",
    ]);
    expect(analyzer.material_bindings).toMatchObject({
      decision_log: { source_ref: "decision-log.md", sha256: sha256(decisionLog), snapshot_tree: outcome.value.snapshot_tree },
      spec: { source_ref: "spec.md", sha256: sha256(spec), snapshot_tree: outcome.value.snapshot_tree },
      phase_index: { source_ref: "phases/index.md", sha256: sha256(phaseIndex), snapshot_tree: outcome.value.snapshot_tree },
      phases: {
        "phases/P1.md": { source_ref: "phases/P1.md", sha256: sha256(phase), snapshot_tree: outcome.value.snapshot_tree },
      },
    });
    expect(Object.keys(analyzer.evidence_bindings).sort()).toEqual([
      "decision-log", "phase-index", "phases/P1.md", "spec",
    ]);
    for (const [ref, binding] of Object.entries(analyzer.evidence_bindings)) {
      const raw = state.task.readRecord(binding.ref);
      expect(sha256(raw)).toBe(binding.sha256);
      expect(JSON.parse(raw)).toMatchObject({
        task_id: state.task.identity.taskId,
        stage,
        snapshot_tree: outcome.value.snapshot_tree,
        material_revision: outcome.value.material_revision,
        subject_kind: "step",
        subject_id: analyzerStep.step_slug,
      });
      expect(analyzer.packet.evidence.find((entry) => entry.ref === ref)).toMatchObject({
        canonical_ref: binding.ref,
        hash: binding.sha256,
        snapshot_tree: outcome.value.snapshot_tree,
      });
    }
  });

  it("keeps post Phase materials and authenticated evidence in an unavailable outcome", () => {
    const state = fixture();
    const outcome = publishUnavailableStageAgentOutcome({
      ...state,
      workspace: state.candidateWorkspace,
      stage: "build-plan",
      attemptId: "post-build-plan-unavailable-attempt",
      host: "fixture-host",
      sourceId: "fixture/bridge",
      sourceFamily: "fixture",
      agentRunId: "post-build-plan-unavailable-run",
      reason: "fixture Stage Agent response unavailable",
    });

    expect(outcome.value.status).toBe("unavailable");
    expect(outcome.value.spec_analyze.packet.materials).toEqual({
      decision_log: decisionLog,
      spec,
      phase_index: phaseIndex,
      phases: { "phases/P1.md": phase },
    });
    expect(Object.keys(outcome.value.spec_analyze.evidence_bindings).sort()).toEqual([
      "decision-log", "phase-index", "phases/P1.md", "spec",
    ]);
  });
});
