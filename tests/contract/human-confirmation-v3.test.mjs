import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildTaskKernel } from "../../runtime/task/task-kernel-implementation.mjs";
import { validateDecisionFreeze } from "../../runtime/stage/stage-content-contracts.mjs";
import { materialRevisionFromValues } from "../../runtime/task/git-worktree-snapshot.mjs";
import { assertTaskHandle } from "../../runtime/task/task-handle.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runStage } from "../../runtime/stage/stage-runner.mjs";
import { validateHumanConfirmation } from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { writeCanonicalStageMaterials } from "../helpers/stage-outcome.mjs";

const roots = [];
const hash = (value) => createHash("sha256").update(value).digest("hex");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture(now = () => "2026-08-30T00:00:01.000Z", inputs = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-confirmation-v3-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(storage);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub contract"]);
  git(repo, ["config", "user.email", "contract@workflowhub.invalid"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  const task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "task-confirm-v3",
      created_at: "2026-08-30T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs,
      record_model: "vnext-single-write",
    },
  });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  writeCanonicalStageMaterials(artifacts);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate, now });
  return { task, kernel, candidate, artifacts };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("human confirmation v3", () => {
  it("T005 keeps a real confirmation while publishing the authenticated incomplete coverage fact", () => {
    const { task, kernel } = fixture();
    const confirmation = kernel.publishHumanConfirmation("make-decision", directionInput);

    expect(confirmation.ref).toMatch(/^quality\/confirmations\//);
    expect(confirmation.coverage_quality_fact_ref).toMatch(/^quality\/facts\/[a-f0-9]{64}\.json$/);
    const coverage = JSON.parse(task.readRecord(confirmation.coverage_quality_fact_ref));
    expect(coverage).toMatchObject({
      kind: "coverage",
      status: "incomplete",
      subject: "decision_coverage",
    });
    expect(coverage.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ evidence_type: "coverage_audit" }),
    ]));
    expect(confirmation.quality_fact_ref).toMatch(/^quality\/facts\/[a-f0-9]{64}\.json$/);
  });

  it("T006 keeps confirmation when the authenticated raw inventory is malformed", () => {
    const { task, kernel } = fixture(undefined, {
      raw_requirement: { ref: "quality/evidence/raw-requirements/missing.json", sha256: "f".repeat(64) },
    });
    const confirmation = kernel.publishHumanConfirmation("make-decision", directionInput);
    expect(confirmation.ref).toMatch(/^quality\/confirmations\//);
    const coverage = JSON.parse(task.readRecord(confirmation.coverage_quality_fact_ref));
    expect(coverage).toMatchObject({ kind: "coverage", status: "incomplete" });
    const audit = JSON.parse(task.readRecord(coverage.evidence[0].ref));
    expect(audit.audit.failures).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "source_inventory_invalid" }),
    ]));
  });

  it("T006 publishes passed coverage only from the authenticated task raw-requirement inventory", () => {
    const sourceBytes = "The system must preserve the original requirement.";
    const sourceRef = `quality/evidence/raw-requirements/${hash(sourceBytes)}.txt`;
    const sourceItem = {
      source_item_ref: sourceRef,
      source_item_hash: hash(sourceBytes),
      source_anchor: "raw-requirement.md#L1",
      exact_excerpt: sourceBytes,
      requirement_strength: "must",
    };
    const inventory = {
      schema_version: "raw-requirement-index.v1",
      source_items: [sourceItem],
      mappings: [{
        source_item_ref: sourceItem.source_item_ref,
        source_item_hash: sourceItem.source_item_hash,
        coverage_status: "covered",
        disposition: "covered",
        decision_location: { kind: "main", ref: "specs/task-confirm-v3/decision-log.md", entry_index: 0 },
      }],
      declared_counts: { source_items: 1, covered: 1, accepted_omission: 0, missing: 0 },
      known_inventory: {
        stable_ids: [{ id: "R-COVER-001", authority_file: "raw-requirement.md", position: "raw-requirement.md#L1" }],
        fact_samples: [
          { fact_type: "product_goal", sample: "preserve requirements", authority_file: "spec.md", conclusion: "one owner", evidence: "spec.md#L1" },
          { fact_type: "user_flow", sample: "confirmation stays available", authority_file: "plan.md", conclusion: "one owner", evidence: "plan.md#L1" },
          { fact_type: "cross_task_requirement", sample: "topology is read-only", authority_file: "tasks.md", conclusion: "one owner", evidence: "tasks.md#L1" },
          { fact_type: "acceptance", sample: "coverage is traceable", authority_file: "spec.md", conclusion: "one owner", evidence: "spec.md#L2" },
        ],
      },
    };
    const inventoryRaw = `${JSON.stringify(inventory, null, 2)}\n`;
    const inventoryRef = `quality/evidence/raw-requirements/${hash(inventoryRaw)}.json`;
    const { task, kernel, artifacts } = fixture(undefined, {
      raw_requirement: { ref: inventoryRef, sha256: hash(inventoryRaw) },
    });
    task.writeRecordAtomic(sourceRef, sourceBytes);
    task.writeRecordAtomic(inventoryRef, inventoryRaw);
    artifacts.writeAtomic("decision-log.md", `${artifacts.read("decision-log.md")}\n${sourceBytes}\n`);
    const confirmation = kernel.publishHumanConfirmation("make-decision", directionInput);
    const coverage = JSON.parse(task.readRecord(confirmation.coverage_quality_fact_ref));
    expect(coverage).toMatchObject({ kind: "coverage", status: "passed", subject: "decision_coverage" });
    const audit = JSON.parse(task.readRecord(coverage.evidence[0].ref));
    expect(audit.audit).toMatchObject({ status: "passed", authority: { scope: "known_inventory", duplicate_authorities: 0 } });
    expect(audit.audit.authority.samples).toHaveLength(4);
  });

  it("writer writes reply_text and step_slug in the single confirmation record and keeps authorize compatible", () => {
    const { task, kernel } = fixture();
    const confirmation = kernel.publishHumanConfirmation("build-code", {
      decision: "accepted",
      subject_ref: "quality/stage-reflection/build-code.json",
      reply_text: "我确认继续执行这个阶段。",
      step_slug: "confirm-stage-reflection",
    });

    expect(confirmation.value).toMatchObject({
      schema_version: "human-confirmation.v3",
      task_id: task.identity.taskId,
      stage: "build-code",
      decision: "accepted",
      subject_ref: "quality/stage-reflection/build-code.json",
      reply_text: "我确认继续执行这个阶段。",
      step_slug: "confirm-stage-reflection",
    });
    expect(confirmation).not.toHaveProperty("coverage_quality_fact_ref");
    expect(() => validateHumanConfirmation(confirmation.value, {
      taskId: task.identity.taskId,
      stage: "build-code",
      requireAccepted: true,
      requireSubjectRef: true,
    })).not.toThrow();

    const authorization = kernel.publishIrreversibleAuthorization({ operation: "commit", subject_ref: confirmation.ref });
    expect(authorization.value).toMatchObject({
      schema_version: "irreversible-authorization.v1",
      subject_ref: confirmation.ref,
      subject_hash: hash(`${JSON.stringify(confirmation.value, null, 2)}\n`),
    });
  });

  it("continues to validate v1, v2, and v3 fixtures without rewriting old records", () => {
    const taskId = "task-confirm-v3";
    const v1 = {
      schema_version: "human-confirmation.v1",
      task_id: taskId,
      stage: "build-plan",
      decision: "accepted",
      confirmed_at: "2026-08-30T00:00:00.000Z",
      attempt_ref: "quality/reviews/attempts/fixture/attempt.json",
    };
    const v2 = {
      schema_version: "human-confirmation.v2",
      task_id: taskId,
      stage: "build-plan",
      decision: "accepted",
      subject_ref: "quality/reviews/attempts/fixture/attempt.json",
      material_revision: `revision-${"a".repeat(64)}`,
      snapshot_tree: "b".repeat(40),
      confirmed_at: "2026-08-30T00:00:00.000Z",
    };
    const v3 = {
      ...v2,
      schema_version: "human-confirmation.v3",
      reply_text: "确认继续当前阶段。",
      step_slug: "publish-plan-result",
    };
    const before = new Map([
      ["v1", JSON.stringify(v1)],
      ["v2", JSON.stringify(v2)],
      ["v3", JSON.stringify(v3)],
    ]);
    const beforeHashes = new Map([...before].map(([name, value]) => [name, hash(value)]));

    expect(() => validateHumanConfirmation(v1, {
      taskId,
      stage: "build-plan",
      subject: v1.attempt_ref,
      requireAccepted: true,
    })).not.toThrow();
    expect(() => validateHumanConfirmation(v2, {
      taskId,
      stage: "build-plan",
      subject: v2.subject_ref,
      requireAccepted: true,
      requireSubjectRef: true,
    })).not.toThrow();
    expect(() => validateHumanConfirmation(v3, {
      taskId,
      stage: "build-plan",
      subject: v3.subject_ref,
      requireAccepted: true,
      requireSubjectRef: true,
    })).not.toThrow();
    expect(v1).not.toHaveProperty("reply_text");
    expect(v2).not.toHaveProperty("step_slug");
    expect(v3.reply_text).toBeTruthy();
    expect(v3.step_slug).toBeTruthy();
    expect(new Map([
      ["v1", JSON.stringify(v1)],
      ["v2", JSON.stringify(v2)],
      ["v3", JSON.stringify(v3)],
    ])).toEqual(before);
    expect(new Map([...before].map(([name, value]) => [name, hash(value)]))).toEqual(beforeHashes);
  });
});


const directionInput = Object.freeze({ decision: "accepted", subject_ref: null, reply_text: "确认当前方向。", step_slug: "approve-decision" });

describe("T003 confirmation semantic identity and atomic publication", () => {
  it("reuses the first confirmation and quality fact when only the clock changes", () => {
    let timestamp = "2026-09-08T01:00:00.000Z";
    const { task, kernel } = fixture(() => timestamp);
    const first = kernel.publishHumanConfirmation("make-decision", directionInput);
    const original = task.readRecord(first.ref);
    timestamp = "2026-09-08T01:01:00.000Z";
    const retry = kernel.publishHumanConfirmation("make-decision", directionInput);
    expect(retry.ref, "T003: the clock is not a confirmation identity field").toBe(first.ref);
    expect(retry.quality_fact_ref).toBe(first.quality_fact_ref);
    expect(retry.value.confirmed_at).toBe(first.value.confirmed_at);
    expect(task.readRecord(first.ref)).toBe(original);
  });

  it.each([
    { decision: "rejected" },
    { reply_text: "只同意部分方向。" },
    { step_slug: "approve-plan" },
    { subject_ref: "quality/stage-reflection/make-decision.json" },
    { attempt_ref: "quality/reviews/attempts/other/attempt.json" },
  ])("creates a new immutable fact for a changed semantic input %j", (changed) => {
    const { task, kernel } = fixture();
    const first = kernel.publishHumanConfirmation("make-decision", directionInput);
    const original = task.readRecord(first.ref);
    const next = kernel.publishHumanConfirmation("make-decision", { ...directionInput, ...changed });
    expect(next.ref).not.toBe(first.ref);
    expect(task.readRecord(first.ref)).toBe(original);
  });

  it("preserves approved direction across downstream spec and plan refinement, but not direction edits", () => {
    const { task, kernel, artifacts } = fixture();
    const first = kernel.publishHumanConfirmation("make-decision", directionInput);
    const original = task.readRecord(first.ref);
    artifacts.writeAtomic("spec.md", artifacts.read("spec.md") + "\n规格细化。\n");
    artifacts.writeAtomic("plan.md", artifacts.read("plan.md") + "\n工程计划细化。\n");
    const retry = kernel.publishHumanConfirmation("make-decision", directionInput);
    expect(retry.ref, "T003: downstream detail does not revoke the approved direction").toBe(first.ref);
    expect(retry.quality_fact_ref).toBe(first.quality_fact_ref);
    artifacts.writeAtomic("decision-log.md", artifacts.read("decision-log.md") + "\n用户批准另一方向。\n");
    expect(kernel.publishHumanConfirmation("make-decision", directionInput).ref).not.toBe(first.ref);
    expect(task.readRecord(first.ref)).toBe(original);
  });

  it("reuses a persisted orphan confirmation after quality publication failed", () => {
    let timestamp = "2026-09-08T02:00:00.000Z";
    const { task, kernel, candidate } = fixture(() => timestamp);
    let obstructQuality = true;
    const factsObstacle = join(task.taskPath, "quality/facts");
    const injected = buildTaskKernel(task, { candidateWorkspace: candidate, now: () => timestamp }, {
      assertTaskHandle,
      createKernelRecordFor: () => (ref, raw) => {
        const published = kernel.publishCanonicalRecord(ref, raw);
        if (obstructQuality && ref.startsWith("quality/confirmations/")) {
          writeFileSync(factsObstacle, "T003 real filesystem obstacle");
        }
        return published;
      },
    });
    expect(() => injected.publishHumanConfirmation("make-decision", directionInput)).toThrow(/ENOTDIR|not a directory|non-directory|must be a real directory/);
    const names = readdirSync(join(task.taskPath, "quality/confirmations"));
    expect(names).toHaveLength(1);
    const firstRef = `quality/confirmations/${names[0]}`;
    const original = task.readRecord(firstRef);
    rmSync(factsObstacle);
    expect(task.listCanonicalQualityFactRefs()).toHaveLength(0);
    obstructQuality = false;
    timestamp = "2026-09-08T02:01:00.000Z";
    const retry = injected.publishHumanConfirmation("make-decision", directionInput);
    expect(retry.ref, "T003: retry must finish the original confirmation publication").toBe(firstRef);
    expect(task.readRecord(firstRef)).toBe(original);
    expect(readdirSync(join(task.taskPath, "quality/confirmations"))).toHaveLength(1);
    const quality = JSON.parse(task.readRecord(retry.quality_fact_ref));
    expect(quality.evidence[0].ref).toBe(firstRef);
    expect(quality.recorded_at).toBe(JSON.parse(original).confirmed_at);
  });

  it("fails loudly while another process holds the store lock, then reuses the winning confirmation on retry", async () => {
    const { kernel, task } = fixture();
    const storeUrl = new URL("../../runtime/task/task-store.mjs", import.meta.url).href;
    const code = `import { withStoreLock } from ${JSON.stringify(storeUrl)}; import { readSync } from "node:fs"; withStoreLock(${JSON.stringify(task.taskPath)}, () => { process.stdout.write("locked\\n"); readSync(0, Buffer.alloc(1), 0, 1, null); });`;
    const child = spawn(process.execPath, ["--input-type=module", "-e", code], { stdio: ["pipe", "pipe", "pipe"] });
    const ended = new Promise((resolve, reject) => { child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`lock holder exit ${code}`))); child.once("error", reject); });
    try {
      await new Promise((resolve, reject) => { child.stdout.once("data", resolve); child.once("error", reject); child.once("exit", () => reject(new Error("lock holder exited before readiness"))); });
      expect(() => kernel.publishHumanConfirmation("make-decision", directionInput), "T003: confirmation compare/create must share the store lock").toThrow(/task store write conflict/);
    } finally {
      child.stdin.end("\n");
      await ended;
    }
    const first = kernel.publishHumanConfirmation("make-decision", directionInput);
    expect(kernel.publishHumanConfirmation("make-decision", directionInput).ref).toBe(first.ref);
  });
});

describe("T003 direction-only freeze binding", () => {
  const revision = materialRevisionFromValues([["decision-log.md", "approved direction bytes"]]);
  function freeze() {
    const source = { status: "accepted", material_revision: "old-all-materials", snapshot_tree: "old-tree", material_scope: ["decision-log.md"], material_scope_revision: revision };
    return { approval_binding: { ...source, decision_id: "D-501" }, final_confirmation: { ...source }, step_11: { ...source }, unresolved_direction_questions: [], freeze_packet: { coverage: ["user_flow", "data_states", "success_failure_boundaries", "non_goals"] } };
  }
  const current = { currentMaterialRevision: "new-downstream-materials", currentSnapshotTree: "new-tree", currentDecisionScopeRevision: revision };
  it("accepts unchanged decision bytes despite downstream material and snapshot changes", () => {
    expect(validateDecisionFreeze({ decisionLog: freeze(), ...current }).ok, "T003: approved direction scope survives downstream refinement").toBe(true);
  });
  it.each(["partial", "wrong_scope", "wrong_hash", "decision_changed"])("rejects %s decision-scope evidence", (mutation) => {
    const decisionLog = freeze();
    const input = { decisionLog, ...current };
    if (mutation === "partial") delete decisionLog.final_confirmation.material_scope_revision;
    if (mutation === "wrong_scope") decisionLog.step_11.material_scope = ["spec.md"];
    if (mutation === "wrong_hash") decisionLog.step_11.material_scope_revision = "revision-invalid";
    if (mutation === "decision_changed") input.currentDecisionScopeRevision = materialRevisionFromValues([["decision-log.md", "changed direction"]]);
    expect(validateDecisionFreeze(input).ok).toBe(false);
  });
});


describe("T004 confirmation binding protections", () => {
  it("normalizes surrounding reply whitespace while preserving the first raw reply", () => {
    let timestamp = "2026-09-08T03:00:00.000Z";
    const { task, kernel } = fixture(() => timestamp);
    const first = kernel.publishHumanConfirmation("make-decision", directionInput);
    const original = task.readRecord(first.ref);
    timestamp = "2026-09-08T03:01:00.000Z";
    const retry = kernel.publishHumanConfirmation("make-decision", { ...directionInput, reply_text: `  ${directionInput.reply_text}\n` });
    expect(retry.ref).toBe(first.ref);
    expect(retry.value.reply_text).toBe(directionInput.reply_text);
    expect(task.readRecord(first.ref)).toBe(original);
  });

  it.each([
    ["make-decision", "quality/stage-reflection/make-decision.json"],
    ["build-plan", null],
    ["verify-code", null],
  ])("retains full snapshot sensitivity for %s subject %s", (stage, subject_ref) => {
    const { task, kernel, artifacts } = fixture();
    const input = { ...directionInput, subject_ref };
    const first = kernel.publishHumanConfirmation(stage, input);
    const original = task.readRecord(first.ref);
    artifacts.writeAtomic("spec.md", artifacts.read("spec.md") + "\n下游内容改变。\n");
    expect(kernel.publishHumanConfirmation(stage, input).ref).not.toBe(first.ref);
    expect(task.readRecord(first.ref)).toBe(original);
  });

  it("rejects tampered canonical confirmation bytes instead of silently creating another fact", () => {
    const { task, kernel } = fixture();
    const first = kernel.publishHumanConfirmation("make-decision", directionInput);
    const altered = { ...first.value, reply_text: "tampered reply" };
    writeFileSync(task.recordPath(first.ref), JSON.stringify(altered));
    expect(() => kernel.publishHumanConfirmation("make-decision", directionInput)).toThrow(/hash|canonical|identity|corrupt/i);
    expect(readdirSync(join(task.taskPath, "quality/confirmations"))).toHaveLength(1);
  });
});

describe("P7 AC-REBIND-004 confirmation read-side symmetry", () => {
  const completionSubjects = Object.fromEntries([
    "scope", "non_goals", "risks", "ui_applicability", "requirement_coverage",
    "goal_achievement", "acceptance_clarity", "solution_convergence", "plain_language_card", "outline_closed",
  ].map((subject) => [subject, { status: "passed", evidence_refs: [], detail: `fixture ${subject}` }]));

  async function runCurrentConfirmation(state) {
    const result = await runStage("make-decision", {
      stage: "make-decision",
      task: state.task,
      kernel: state.kernel,
      identity: state.task.identity,
      workflowRunId: state.kernel.deriveStageWorkflowRunId("make-decision"),
      manifest: state.task.manifest,
      candidateWorkspace: state.candidate,
      artifacts: state.artifacts,
    }, async () => ({ facts: { completion_subjects: completionSubjects } }));
    const fact = result.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .find((value) => value.kind === "confirmation" && value.subject === "human_confirmation");
    return { result, fact };
  }

  it("keeps the same confirmation for execution-only tasks writes and non-material snapshots, but not decision changes", async () => {
    const cases = [
      {
        name: "tasks.md execution status",
        reusable: true,
      },
      {
        name: "non-material snapshot",
        reusable: true,
      },
      {
        name: "decision-log substantive change",
        reusable: false,
      },
    ];

    for (const scenario of cases) {
      const state = fixture();
      let first;
      // The execution-only case needs its task-card section present before the
      // confirmation is bound; D4 is explicitly authorized by D-026 and must
      // not be mistaken for a general material-integrity relaxation.
      if (scenario.name === "tasks.md execution status") {
        const initial = `${state.artifacts.read("tasks.md")}\n### 执行状态填写区\n- status: pending\n`;
        state.artifacts.writeAtomic("tasks.md", initial);
        first = state.kernel.publishHumanConfirmation("make-decision", directionInput);
        state.artifacts.writeAtomic("tasks.md", state.artifacts.read("tasks.md").replace("status: pending", "status: completed"));
      } else {
        first = state.kernel.publishHumanConfirmation("make-decision", directionInput);
        if (scenario.name === "non-material snapshot") {
          writeFileSync(join(state.candidate.worktreeRoot, "README.md"), "non-material snapshot change\n");
        } else {
          state.artifacts.writeAtomic("decision-log.md", `${state.artifacts.read("decision-log.md")}\n实质方向改变。\n`);
        }
      }
      const { fact } = await runCurrentConfirmation(state);
      expect(fact, scenario.name).toBeDefined();
      expect(fact.status, `${scenario.name}: currentConfirmationCandidate status`).toBe(scenario.reusable ? "passed" : "missing");
      if (scenario.reusable) expect(fact.evidence[0].ref, scenario.name).toBe(first.ref);
    }
  });
});

describe("T004 unrelated historical confirmation isolation", () => {
  it("does not let an unrelated stage's corrupt confirmation block a new direction confirmation", () => {
    const { task, kernel } = fixture();
    const old = kernel.publishHumanConfirmation("build-plan", { ...directionInput, step_slug: "approve-plan" });
    const corrupted = `${JSON.stringify({ ...old.value, reply_text: "changed historical reply" })}\n`;
    writeFileSync(task.recordPath(old.ref), corrupted);
    const current = kernel.publishHumanConfirmation("make-decision", directionInput);
    expect(current.value.stage).toBe("make-decision");
    expect(current.value.reply_text).toBe(directionInput.reply_text);
    expect(task.readRecord(old.ref)).toBe(corrupted);
    expect(current.historical_record_errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ ref: old.ref, message: expect.any(String) }),
    ]));
  });

  it("preserves an unrelated malformed orphan and reuses the authentic current winner", () => {
    const { task, kernel } = fixture();
    const winner = kernel.publishHumanConfirmation("make-decision", directionInput);
    const malformed = "{historical malformed confirmation";
    const oldRef = `quality/confirmations/${hash(malformed)}.json`;
    writeFileSync(task.recordPath(oldRef), malformed);
    const retry = kernel.publishHumanConfirmation("make-decision", directionInput);
    expect(retry.ref).toBe(winner.ref);
    expect(retry.quality_fact_ref).toBe(winner.quality_fact_ref);
    expect(task.readRecord(oldRef)).toBe(malformed);
    expect(retry.historical_record_errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ ref: oldRef, message: expect.any(String) }),
    ]));
  });
});


describe("T004 current confirmation provenance corruption", () => {
  it("fails loudly when the current quality fact points to an unparseable confirmation", () => {
    const { task, kernel } = fixture();
    const winner = kernel.publishHumanConfirmation("make-decision", directionInput);
    writeFileSync(task.recordPath(winner.ref), "{broken current confirmation");
    expect(() => kernel.publishHumanConfirmation("make-decision", directionInput)).toThrow(/canonical|confirmation|hash|JSON|corrupt/i);
    expect(readdirSync(join(task.taskPath, "quality/confirmations"))).toHaveLength(1);
  });
});


describe("P1 review quality fact corruption", () => {
  it.each(["bad_json", "changed_evidence", "forged_unrelated_stage"])("rejects %s quality fact rather than reconstructing a passed confirmation", (fault) => {
    const { task, kernel } = fixture();
    const winner = kernel.publishHumanConfirmation("make-decision", directionInput);
    const fact = JSON.parse(task.readRecord(winner.quality_fact_ref));
    if (fault === "changed_evidence") fact.evidence[0].sha256 = "f".repeat(64);
    if (fault === "forged_unrelated_stage") fact.stage = "build-plan";
    writeFileSync(task.recordPath(winner.quality_fact_ref), fault === "bad_json" ? "{broken quality" : JSON.stringify(fact));
    expect(() => kernel.publishHumanConfirmation("make-decision", directionInput)).toThrow(/quality|canonical|hash|JSON|corrupt/i);
    expect(readdirSync(join(task.taskPath, "quality/confirmations"))).toHaveLength(1);
  });
});
