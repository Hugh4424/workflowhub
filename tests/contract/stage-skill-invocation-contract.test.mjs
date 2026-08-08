import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { dispatchOrderedStageSkills } from "../../runtime/stage/stage-skill-runtime.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import {
  assertHostBridgeResponse,
  assertHostOutcome,
  createStageSkillDispatchPublication,
  HOST_BRIDGE_OUTCOME_SCHEMA,
} from "../../tools/cli/stage-runtime.mjs";

const roots = [];
afterEach(() => {
  while (roots.length) fs.rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-stage-skill-contract-")));
  roots.push(root);
  for (const name of [
    "spec-research",
    "spec-plan",
    "spec-tasks",
    "test-routing-advisor",
    "wh-review",
    "simplicity-guard",
    "spec-analyze",
    "plan-eng-review",
    "review",
    "backend-testing",
    "frontend-testing",
    "fullstack-slice-testing",
  ]) {
    fs.mkdirSync(path.join(root, `skills/${name}`), { recursive: true });
    fs.writeFileSync(path.join(root, `skills/${name}/SKILL.md`), `# ${name}\n`);
    fs.writeFileSync(path.join(root, `skills/${name}/skill-bundle.json`), JSON.stringify({
      schema_version: 1,
      skill: name,
      files: ["SKILL.md"],
    }));
  }
  fs.mkdirSync(path.join(root, "workflows/build-plan"), { recursive: true });
  fs.writeFileSync(path.join(root, "workflows/build-plan/skill-deps.yaml"), `stage: build-plan
skills:
  - { name: spec-research, path: skills/spec-research/SKILL.md, execution: independent, invocation: conditional, trigger: real_research_question, bundle: skills/spec-research/skill-bundle.json, owner: stage, dispatch: stage }
  - { name: spec-plan, path: skills/spec-plan/SKILL.md, execution: inline, invocation: always, trigger: plan_design, bundle: skills/spec-plan/skill-bundle.json, owner: stage, dispatch: stage }
  - { name: simplicity-guard, path: skills/simplicity-guard/SKILL.md, execution: inline, invocation: always, trigger: simplicity_check, bundle: skills/simplicity-guard/skill-bundle.json, owner: stage, dispatch: stage }
  - { name: plan-eng-review, path: skills/plan-eng-review/SKILL.md, execution: inline, invocation: always, trigger: engineering_plan_check, bundle: skills/plan-eng-review/skill-bundle.json, owner: stage, dispatch: stage }
  - { name: test-routing-advisor, path: skills/test-routing-advisor/SKILL.md, execution: independent, invocation: always, trigger: task_test_routing, bundle: skills/test-routing-advisor/skill-bundle.json, owner: stage, dispatch: stage }
  - { name: spec-tasks, path: skills/spec-tasks/SKILL.md, execution: inline, invocation: always, trigger: task_design, bundle: skills/spec-tasks/skill-bundle.json, owner: stage, dispatch: stage }
  - { name: spec-analyze, path: skills/spec-analyze/SKILL.md, execution: inline, invocation: always, trigger: cross_material_analysis, bundle: skills/spec-analyze/skill-bundle.json, owner: stage, dispatch: stage }
  - { name: wh-review, path: skills/wh-review/SKILL.md, execution: inline, invocation: always, trigger: review, bundle: skills/wh-review/skill-bundle.json, owner: stage, dispatch: stage }
runtime_capabilities: []
external_capabilities: []
`);
  fs.writeFileSync(path.join(root, "workflows/build-plan/steps.json"), JSON.stringify({
    schema_version: "2.0.0",
    stage_slug: "build-plan",
    steps: [
      { step_id: 1, step_slug: "conditional-research", order: 1, entry_conditions: [{ kind: "input", uri_or_path: "plan://materials" }], completion_evidence: [{ kind: "skill_invocation", uri_or_path: "skill://spec-research" }], observable_result: "Research runs only for a real research question.", depends_on: [] },
      { step_id: 2, step_slug: "spec-plan", order: 2, entry_conditions: [{ kind: "input", uri_or_path: "step://1" }], completion_evidence: [{ kind: "skill_invocation", uri_or_path: "skill://spec-plan" }], observable_result: "Plan draft exists.", depends_on: [1] },
      { step_id: 3, step_slug: "simplicity", order: 3, entry_conditions: [{ kind: "input", uri_or_path: "step://2" }], completion_evidence: [{ kind: "skill_invocation", uri_or_path: "skill://simplicity-guard" }], observable_result: "Plan simplicity was checked.", depends_on: [2] },
      { step_id: 4, step_slug: "engineering", order: 4, entry_conditions: [{ kind: "input", uri_or_path: "step://3" }], completion_evidence: [{ kind: "skill_invocation", uri_or_path: "skill://plan-eng-review" }], observable_result: "Engineering boundaries were checked.", depends_on: [3] },
      { step_id: 5, step_slug: "routing", order: 5, entry_conditions: [{ kind: "input", uri_or_path: "step://4" }], completion_evidence: [{ kind: "skill_invocation", uri_or_path: "skill://test-routing-advisor" }], observable_result: "Test route was selected.", depends_on: [4] },
      { step_id: 6, step_slug: "tasks", order: 6, entry_conditions: [{ kind: "input", uri_or_path: "step://5" }], completion_evidence: [{ kind: "skill_invocation", uri_or_path: "skill://spec-tasks" }], observable_result: "Executable tasks exist.", depends_on: [5] },
      { step_id: 7, step_slug: "analyze", order: 7, entry_conditions: [{ kind: "input", uri_or_path: "step://6" }], completion_evidence: [{ kind: "skill_invocation", uri_or_path: "skill://spec-analyze" }], observable_result: "Four materials were checked.", depends_on: [6] },
      { step_id: 8, step_slug: "review", order: 8, entry_conditions: [{ kind: "input", uri_or_path: "step://7" }], completion_evidence: [{ kind: "skill_invocation", uri_or_path: "skill://wh-review" }], observable_result: "One advisory review exists.", depends_on: [7] },
    ],
  }, null, 2));
  fs.writeFileSync(path.join(root, "skills/wh-review/stage-skill-plan.json"), JSON.stringify({
    version: 1,
    stages: {
      "build-plan": {
        logical_skill_id: "wh-review/build-plan",
        required_skills: ["review"],
        review_mode: "lens-only",
        delivery_mode: "file_only",
      },
    },
  }));

  fs.mkdirSync(path.join(root, "workflows/build-code"), { recursive: true });
  fs.writeFileSync(path.join(root, "workflows/build-code/skill-deps.yaml"), `stage: build-code
skills:
  - { name: test-routing-advisor, path: skills/test-routing-advisor/SKILL.md, execution: independent, invocation: always, trigger: actual_scope, bundle: skills/test-routing-advisor/skill-bundle.json, owner: stage, dispatch: stage }
  - { name: backend-testing, path: skills/backend-testing/SKILL.md, execution: independent, invocation: conditional, trigger: actual_scope, bundle: skills/backend-testing/skill-bundle.json, owner: stage, dispatch: stage }
  - { name: frontend-testing, path: skills/frontend-testing/SKILL.md, execution: independent, invocation: conditional, trigger: actual_scope, bundle: skills/frontend-testing/skill-bundle.json, owner: stage, dispatch: stage }
  - { name: fullstack-slice-testing, path: skills/fullstack-slice-testing/SKILL.md, execution: independent, invocation: conditional, trigger: actual_scope, bundle: skills/fullstack-slice-testing/skill-bundle.json, owner: stage, dispatch: stage }
  - { name: wh-review, path: skills/wh-review/SKILL.md, execution: inline, invocation: always, trigger: review, bundle: skills/wh-review/skill-bundle.json, owner: stage, dispatch: stage }
runtime_capabilities: []
external_capabilities: []
`);
  fs.writeFileSync(path.join(root, "workflows/build-code/steps.json"), JSON.stringify({
    schema_version: "2.0.0",
    stage_slug: "build-code",
    steps: [
      { step_id: 1, step_slug: "route", order: 1, entry_conditions: [{ kind: "input", uri_or_path: "code://changed-files" }], completion_evidence: [{ kind: "skill_invocation", uri_or_path: "skill://test-routing-advisor" }], observable_result: "Actual test tier is selected.", depends_on: [] },
      { step_id: 2, step_slug: "test", order: 2, entry_conditions: [{ kind: "input", uri_or_path: "step://1" }], completion_evidence: [{ kind: "skill_invocation", uri_or_path: "skill://concrete-testing" }], observable_result: "The selected concrete testing skill is invoked.", depends_on: [1] },
      { step_id: 3, step_slug: "review", order: 3, entry_conditions: [{ kind: "input", uri_or_path: "step://2" }], completion_evidence: [{ kind: "skill_invocation", uri_or_path: "skill://wh-review" }], observable_result: "Review is recorded.", depends_on: [2] },
    ],
  }, null, 2));

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "WorkflowHub",
      task_id: "p2-stage-skill-invocation",
      created_at: "2026-08-05T00:00:00Z",
      target_repo_root: root,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const kernel = createTaskKernel(task);
  return { root, task, kernel };
}

function publishOutcome(kernel, stage, name) {
  const value = {
    schema_version: "stage-skill-outcome.v1",
    stage,
    name,
    snapshot_tree: "b".repeat(40),
    summary: `${name} dispatched by the stage-owned runtime bridge`,
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = `evidence/stage-skills/${stage}/${name}.json`;
  kernel.publishCanonicalRecord(ref, raw);
  return {
    outcome_ref: ref,
    outcome_hash: createHash("sha256").update(raw).digest("hex"),
    snapshot_tree: value.snapshot_tree,
  };
}

describe("stage skill invocation contract", () => {
  it("dispatches stage-owned build-plan skills in declared step order and records skipped research", async () => {
    const state = fixture();
    const calls = [];
    const facts = await dispatchOrderedStageSkills({
      packageRoot: state.root,
      stage: "build-plan",
      kernel: state.kernel,
      controls: {
        "spec-research": { triggered: false, notInvokedReason: "no real research question" },
      },
      hostInvoke: ({ stage, name }) => {
        calls.push(name);
        return publishOutcome(state.kernel, stage, name);
      },
    });

    expect(calls).toEqual([
      "spec-plan",
      "simplicity-guard",
      "plan-eng-review",
      "test-routing-advisor",
      "spec-tasks",
      "spec-analyze",
      "wh-review",
    ]);
    expect(facts.map(({ name, status }) => ({ name, status }))).toEqual([
      { name: "spec-research", status: "not_invoked" },
      { name: "spec-plan", status: "executed" },
      { name: "simplicity-guard", status: "executed" },
      { name: "plan-eng-review", status: "executed" },
      { name: "test-routing-advisor", status: "executed" },
      { name: "spec-tasks", status: "executed" },
      { name: "spec-analyze", status: "executed" },
      { name: "wh-review", status: "executed" },
    ]);
    for (const [index, name] of calls.entries()) {
      expect(state.kernel.readStageSkillInvocation("build-plan", name, `step-${index + 2}`)?.fact).toMatchObject({
        stage: "build-plan",
        name,
        status: "executed",
      });
    }
    expect(state.kernel.readStageSkillInvocation("build-plan", "spec-research", "step-1")).toMatchObject({ fact: { status: "not_invoked", reason: "no real research question" } });
    expect(state.kernel.readStageSkillInvocation("build-plan", "spec-analyze", "step-7")).toMatchObject({ fact: { status: "executed" } });
  });

  it("dispatches the selected build-code concrete testing skill and records its invocation fact", async () => {
    const state = fixture();
    const calls = [];
    const facts = await dispatchOrderedStageSkills({
      packageRoot: state.root,
      stage: "build-code",
      controls: {
        selectedTestingSkill: "backend-testing",
      },
      hostInvoke: ({ stage, name }) => {
        calls.push(`${stage}/${name}`);
        return publishOutcome(state.kernel, stage, name);
      },
      kernel: state.kernel,
    });

    expect(calls).toEqual(["build-code/test-routing-advisor", "build-code/backend-testing", "build-code/wh-review"]);
    expect(facts.find(({ name }) => name === "backend-testing")).toMatchObject({
      stage: "build-code",
      name: "backend-testing",
      status: "executed",
      invocation_key: "step-2",
    });
    expect(state.kernel.readStageSkillInvocation("build-code", "backend-testing", "step-2")).toMatchObject({
      fact: { stage: "build-code", name: "backend-testing", status: "executed" },
    });
  });

  it("records concrete testing as not invoked for an explicitly non-code task", async () => {
    const state = fixture();
    const calls = [];
    const facts = await dispatchOrderedStageSkills({
      packageRoot: state.root,
      stage: "build-code",
      controls: {
        testingNotApplicable: true,
        testingNotApplicableReason: "当前卡片只更新材料，不产生代码改动",
      },
      hostInvoke: ({ stage, name }) => {
        calls.push(stage + "/" + name);
        return publishOutcome(state.kernel, stage, name);
      },
      kernel: state.kernel,
    });

    expect(calls).toEqual(["build-code/test-routing-advisor", "build-code/wh-review"]);
    expect(facts.filter(({ name }) => ["backend-testing", "frontend-testing", "fullstack-slice-testing"].includes(name)))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ name: "backend-testing", status: "not_invoked", reason: "当前卡片只更新材料，不产生代码改动" }),
        expect.objectContaining({ name: "frontend-testing", status: "not_invoked", reason: "当前卡片只更新材料，不产生代码改动" }),
        expect.objectContaining({ name: "fullstack-slice-testing", status: "not_invoked", reason: "当前卡片只更新材料，不产生代码改动" }),
      ]));
  });

  it("binds serialized outcomes to each ordered invocation key", async () => {
    const state = fixture();
    const outcomes = {};
    for (const [name, invocationKey] of [
      ["test-routing-advisor", "step-1"],
      ["backend-testing", "step-2"],
      ["wh-review", "step-3"],
    ]) {
      outcomes[`${name}/${invocationKey}`] = publishOutcome(state.kernel, "build-code", name);
    }
    const publication = createStageSkillDispatchPublication({
      controls: {
        selectedTestingSkill: "backend-testing",
        "frontend-testing": { triggered: false, notInvokedReason: "not selected by route" },
        "fullstack-slice-testing": { triggered: false, notInvokedReason: "not selected by route" },
      },
      outcomes,
    }, "build-code");

    const facts = await dispatchOrderedStageSkills({
      packageRoot: state.root,
      stage: "build-code",
      controls: publication.stageSkillDispatch.controls,
      hostInvoke: publication.stageSkillDispatch.hostInvoke,
      kernel: state.kernel,
    });

    expect(facts.filter(({ status }) => status === "executed").map(({ name, invocation_key }) => ({ name, invocation_key }))).toEqual([
      { name: "test-routing-advisor", invocation_key: "step-1" },
      { name: "backend-testing", invocation_key: "step-2" },
      { name: "wh-review", invocation_key: "step-3" },
    ]);
  });

  it("requires a complete structured Codex host outcome before canonical publication", () => {
    const valid = {
      status: "completed",
      summary: "real advisory result",
      evidence_refs: ["plan.md:1-2"],
      changed_files: [],
      findings: [],
      next_step: "continue",
    };
    expect(assertHostOutcome(valid)).toEqual(valid);
    expect(() => assertHostOutcome({ ...valid, next_step: "" })).toThrow(/next_step/);
    expect(() => assertHostOutcome({ ...valid, findings: undefined })).toThrow(/findings/);
    expect(() => assertHostOutcome({ ...valid, fabricated: true })).toThrow(/unknown fields/);
  });

  it("keeps the Codex response schema strict and self-consistent", () => {
    expect(HOST_BRIDGE_OUTCOME_SCHEMA.required).toEqual(Object.keys(HOST_BRIDGE_OUTCOME_SCHEMA.properties));
    expect(HOST_BRIDGE_OUTCOME_SCHEMA.properties.status).toEqual({ type: "string", enum: ["completed"] });
    expect(HOST_BRIDGE_OUTCOME_SCHEMA.properties.next_step.minLength).toBe(1);
    expect(HOST_BRIDGE_OUTCOME_SCHEMA.properties.evidence_refs.items.minLength).toBe(1);
    expect(HOST_BRIDGE_OUTCOME_SCHEMA.additionalProperties).toBe(false);
  });

  it("rejects non-canonical or weak host bridge response references", () => {
    const valid = {
      outcome_ref: "quality/evidence/host-invocations/result.json",
      outcome_hash: "a".repeat(64),
      snapshot_tree: "b".repeat(40),
    };
    expect(assertHostBridgeResponse(valid)).toEqual(valid);
    expect(() => assertHostBridgeResponse({ ...valid, outcome_ref: "tmp/result.json" })).toThrow(/canonical/);
    expect(() => assertHostBridgeResponse({ ...valid, outcome_hash: "bad" })).toThrow(/canonical/);
    expect(() => assertHostBridgeResponse({ ...valid, fabricated: true })).toThrow(/canonical/);
  });
});
