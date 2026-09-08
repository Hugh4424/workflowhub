import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { loadStageSkillManifest, loadStageSkillStepManifest, validateSkillConsumerBinding } from "../../runtime/stage/stage-skill-runtime.mjs";
import { officialStageHandler, e2eAcceptanceFacts } from "../../runtime/stage/stage-handlers.mjs";
import { runOfficialStage, runStage, validateSkillConsumerExecution } from "../../runtime/stage/stage-runner.mjs";
import { validateStageSpecAnalyzeProfile } from "../../runtime/stage/stage-content-contracts.mjs";
import { canonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const repoRoot = realpathSync(new URL("../..", import.meta.url).pathname);
const roots = [];
const digest = (raw) => createHash("sha256").update(raw).digest("hex");
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
const manifests = (stage) => ({
  skills: loadStageSkillManifest(repoRoot, stage).manifest.skills,
  steps: loadStageSkillStepManifest(repoRoot, stage).manifest.steps,
});
function fixture(stage) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-workflow-consumer-")));
  roots.push(root);
  const repo = join(root, "repo"); mkdirSync(repo);
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git("init", "-q"); git("config", "user.name", "WorkflowHub Tests"); git("config", "user.email", "tests@workflowhub.local");
  writeFileSync(join(repo, "README.md"), "consumer fixture\n"); git("add", "."); git("commit", "-qm", "base");
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "WorkflowConsumer", task_id: `consumer-${stage}`,
    created_at: "2026-09-08T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {}, record_model: "vnext-single-write",
  } });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  for (const [name, value] of Object.entries(canonicalStageMaterials())) artifacts.writeAtomic(name, value);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts });
  const context = { stage, task, kernel, identity: task.identity, manifest: task.manifest, candidateWorkspace, artifacts,
    workflowRunId: kernel.deriveStageWorkflowRunId(stage) };
  return { root, task, artifacts, kernel, candidateWorkspace, context };
}
function sourceOutcome(state, stage) {
  return writeStageOutcomeFixture({ ...state, workspace: state.candidateWorkspace, stage, attemptId: `consumer-${stage}-attempt`, status: "incomplete" });
}
function reflectionInput(state, stage, outcome) {
  return {
    schema_version: "stage-reflection.v2", record_kind: "judgment", task_id: state.task.identity.taskId, stage,
    stage_status: "failed", generated_at: "2026-09-08T00:00:00Z", status: "ok", error: null,
    identity: { task_id: state.task.identity.taskId, worktree: state.candidateWorkspace.worktreeRoot,
      branch: execFileSync("git", ["symbolic-ref", "--short", "HEAD"], { cwd: state.candidateWorkspace.worktreeRoot, encoding: "utf8" }).trim(),
      attempt: outcome.value.attempt_id, snapshot_tree: outcome.value.snapshot_tree, material_revision: outcome.value.material_revision },
    judgments: [{ subject_id: "current-outcome", subject_kind: "step", classification: "keep", severity: "low",
      reason: "The authenticated incomplete execution remains visible.", evidence_refs: [outcome.ref], confidence: "medium", next_review_trigger: "next execution" }],
    interventions: [], lessons_added: [],
    ...Object.fromEntries(["what_helped", "what_to_improve", "blockers", "intervention_reasons", "what_to_simplify", "simplifiable_now"].map((key) => [key, { state: "none_observed", items: [] }])),
    status_matrix: Object.fromEntries(["code", "verify", "physical_close", "acceptance", "release"].map((key) => [key, { state: "not_applicable", evidence_refs: [] }])),
    source_completeness: { compaction: false, truncation: false, visible_scope: "fixture execution", unknown_reasons: [] },
  };
}
// Resolve a declared URI template against an actual returned identity. This
// checks an addressable publication, not the presence of words in a document.
function resolveDeclaredReflection(declaration, actualRef) {
  const semanticKey = actualRef.split("/").at(-1).replace(/\.json$/, "");
  return declaration.replace(/<(?:sha256|reflection_key|semantic-key)>/g, semanticKey);
}

describe("P4 workflow declarations reach their current consumers", () => {
  it.each(STAGES)("%s on-stage-end completion resolves the actual immutable reflection", async (stage) => {
    const { skills, steps } = manifests(stage);
    const dependency = skills.find((skill) => skill.name === "stage-reflection");
    expect(dependency.consumer.target).toBe("stage-runner#runStageEndReflection");
    expect(dependency.trigger).toBe("on_stage_end");
    const step = steps.find((entry) => entry.step_slug === "stage-reflection");
    expect(step).toMatchObject({ on_stage_end: true, blocking: false });
    const refs = step.completion_evidence.filter((entry) => entry.kind === "stage_reflection");
    expect(refs).toHaveLength(1); // Deleting evidence cannot satisfy the contract.
    const state = fixture(stage), outcome = sourceOutcome(state, stage);
    let calls = 0;
    const result = await runStage(stage, state.context, async () => ({ facts: {} }), {}, {
      stageReflection: { stageStatus: "failed", execute: async () => { calls++; return reflectionInput(state, stage, outcome); } },
    });
    expect(calls).toBe(1);
    expect(result.stage_reflection).toMatchObject({ status: "completed", persisted: true });
    const actualRef = result.stage_reflection.ref;
    const raw = state.task.readRecord(actualRef);
    expect(digest(raw)).toBe(result.stage_reflection.sha256);
    expect(JSON.parse(raw)).toMatchObject({ schema_version: "stage-reflection.v2", stage, stage_status: "failed" });
    const declaredRef = resolveDeclaredReflection(refs[0].uri_or_path, actualRef);
    expect(declaredRef, `${stage}: workflow completion must address the runner's actual immutable record ${actualRef}`).toBe(actualRef);
    expect(state.task.readRecord(declaredRef)).toBe(raw);
  }, 30000);

  it.each(STAGES)("%s review binding cannot consume missing receipts or a deleted result", async (stage) => {
    const { skills } = manifests(stage);
    const dependencies = skills.filter((skill) => ["wh-review", "dsh-code-review"].includes(skill.name));
    expect(dependencies.length).toBeGreaterThan(0);
    const observed = new Set();
    const material = canonicalStageMaterials();
    const identity = { task_id: `consumer-${stage}`, stage, material_revision: `revision-${"a".repeat(64)}`, snapshot_tree: "b".repeat(40) };
    const worker = { stage, identity: { taskId: identity.task_id }, manifest: { record_model: "vnext-single-write" },
      currentMaterialRevision: identity.material_revision, snapshotWorkspace: () => ({ tree: identity.snapshot_tree }),
      artifactRef: (name) => `specs/${identity.task_id}/${name}`, readArtifact: (name) => material[name],
      recordConsumerInvocation: (target) => observed.add(target), hasConsumerInvocation: (target) => observed.has(target) };
    let handlerResult;
    try { handlerResult = await officialStageHandler(stage)(worker, { receipts: {} }); }
    catch (error) { expect(error).toBeInstanceOf(Error); handlerResult = { facts: {}, missing_items: [error.message] }; }
    for (const dependency of dependencies) {
      expect(dependency.consumer.target).toBe({
        "wh-review": "stage-handlers#safeReviewFacts",
        "dsh-code-review": "stage-handlers#codeReviewFacts",
      }[dependency.name]);
      const binding = validateSkillConsumerBinding({ dependency, identity, outcome: { status: "completed", trigger: true, executed: true } });
      const args = { worker, skillId: dependency.name, binding, handlerInput: { receipts: {} }, stageOutcome: { value: {} }, handlerResult };
      expect(validateSkillConsumerExecution(args).status).toBe("incomplete");
      expect(validateSkillConsumerExecution({ ...args, handlerResult: { facts: {} } }).status).toBe("incomplete");
      const unavailable = validateSkillConsumerBinding({ dependency, identity, outcome: { status: "unavailable", trigger: true, executed: true, reason: "provider unavailable" } });
      expect(validateSkillConsumerExecution({ ...args, binding: unavailable }).status).toBe("unavailable");
    }
  });

  it("missing reflection judgments remain unavailable after the real on-stage-end callback", async () => {
    const state = fixture("build-spec");
    const result = await runStage("build-spec", state.context, async () => ({ facts: {} }), {}, {
      stageReflection: { stageStatus: "failed", execute: async () => undefined },
    });
    expect(result.stage_reflection).toMatchObject({ status: "unavailable", persisted: false, ref: null });
  });

  it("build-code runs command/service scenarios while verify requires its own independent evidence", async () => {
    const state = fixture("build-code");
    const execution = { entries: [{ acceptance_criterion_id: "AC-CONSUMER-001", assertions: [{ id: "local-result", expected: 7, actual: 7 }] }] };
    writeFileSync(join(state.candidateWorkspace.worktreeRoot, "accept-command.mjs"), `process.stdout.write(${JSON.stringify(JSON.stringify(execution))});\n`);
    writeFileSync(join(state.candidateWorkspace.worktreeRoot, "accept-service.mjs"), `export async function accept(input) { return {entries:[{acceptance_criterion_id:'AC-CONSUMER-001',assertions:[{id:'service-result',expected:7,actual:input.value}]}]}; }\n`);
    state.artifacts.writeAtomic("decision-log.md", `${state.artifacts.read("decision-log.md")}\n## UI applicability\n\n\`\`\`json\n${JSON.stringify({ result: "non_ui", sources: Object.fromEntries(["raw_requirement", "project_inventory", "planned_or_changed_frontend_fact"].map((key) => [key, { conclusion: "non_ui", reason: "Only command and service fixture consumers are present." }])) })}\n\`\`\`\n`);
    state.artifacts.writeAtomic("spec.md", "# Spec\n\n## Acceptance Criteria\n- **AC-CONSUMER-001**：command and service report the observed value.\n");
    const scenarios = [
      { source: "command/local", sample: "actual process", scenario: "command result", tier: "command", execution: { command: process.execPath, args: ["accept-command.mjs"], timeout_ms: 5000 } },
      { source: "service/local", sample: "actual module", scenario: "service result", tier: "service", execution: { module_ref: "accept-service.mjs", export_name: "accept", input: { value: 7 }, timeout_ms: 5000 } },
    ];
    state.artifacts.writeAtomic("tasks.md", `# Tasks\n- **Template version**：\`plan-task.v4\`\n\n#### T019 — acceptance\n- **ID**：T019\n- **ui_scope**：non_ui\n- **acceptance_role**：acceptance\n- **e2e_scope**：not_required\n- **AC**：AC-CONSUMER-001\n- **acceptance_data**：\`${JSON.stringify(scenarios)}\`\n`);
    state.context.workspace = openCurrentTaskWorkspace(state.task);
    const baseOutcome = sourceOutcome(state, "build-code");
    // The shared helper uses AC-001. Publish a separate fixture record with
    // this scenario's actual AC; do not overwrite or bypass the original.
    const value = structuredClone(baseOutcome.value);
    value.spec_analyze.packet.expected_ac_ids = ["AC-CONSUMER-001"];
    value.spec_analyze.packet.acceptance_coverage = value.spec_analyze.packet.acceptance_coverage.map((row) => ({ ...row, acceptance_criterion_id: "AC-CONSUMER-001" }));
    value.spec_analyze.result = validateStageSpecAnalyzeProfile({ stage: "build-code", packet: value.spec_analyze.packet, strict_material_contracts: true,
      identity: { task_id: value.task_id, stage: value.stage, material_revision: value.material_revision, snapshot_tree: value.snapshot_tree } });
    const rawOutcome = `${JSON.stringify(value, null, 2)}\n`;
    const outcome = { value, sha256: digest(rawOutcome), ref: `quality/evidence/stage-outcomes/build-code/${digest(rawOutcome)}.json` };
    state.kernel.publishCanonicalRecord(outcome.ref, rawOutcome);
    const result = await runOfficialStage("build-code", state.context, { attempt_id: outcome.value.attempt_id, receipts: { stage_outcomes: outcome.ref } }, {}, { requireStageOutcome: true });
    const fact = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref))).find((item) => item.kind === "acceptance_criterion" && item.subject === "acceptance_execution");
    expect(fact).toBeDefined();
    const wrapper = JSON.parse(state.task.readRecord(fact.evidence[0].ref));
    const aggregate = JSON.parse(state.task.readRecord(wrapper.refs[0].ref)).subject_fact;
    expect(aggregate.execution_items.map(({ tier, status }) => ({ tier, status }))).toEqual([{ tier: "command", status: "executed" }, { tier: "service", status: "executed" }]);
    for (const item of aggregate.execution_items) for (const ref of item.evidence_refs) {
      const raw = state.task.readRecord(ref.ref); expect(digest(raw)).toBe(ref.sha256);
      expect(JSON.parse(raw).subject_fact.execution.cleanup.status).toBe("completed");
    }
    const verifyWorker = { stage: "verify-code", readE2eAcceptanceEvidence: () => ({ required: true, execution: { status: "passed", ref: wrapper.refs[0].ref, sha256: wrapper.refs[0].sha256, executor_actor: aggregate.executor_actor }, independent_review: {}, user_confirmation: {} }) };
    expect(e2eAcceptanceFacts(verifyWorker)).toMatchObject({ required: true, status: "missing" });
    const missing = e2eAcceptanceFacts(verifyWorker).missing_items.join("\n");
    expect(missing).toMatch(/independent review/); expect(missing).toMatch(/user confirmation/);
    expect(() => e2eAcceptanceFacts({ stage: "build-code" })).toThrow(/private to verify-code/);
  }, 60000);
});
