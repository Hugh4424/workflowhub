import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import { deriveStageProgress } from "../../runtime/stage/completion-predicates.mjs";
import { loadStageSkillManifest } from "../../runtime/stage/stage-skill-runtime.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { verifyStageContentEvidence } from "../../runtime/evidence/stage-content-evidence.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function richQuestion(id = "scope") {
  return {
    question_id: id,
    axis: "范围",
    independent: true,
    options: [
      { number: 1, label: "保守", meaning: "先少做一点", consequence: "范围更小", risk: "收益延后" },
      { number: 2, label: "推荐", meaning: "直接解决当前问题", consequence: "一次解决", risk: "改动面更大" },
    ],
    recommended_option: 2,
    recommendation_reason: "当前事实更支持这个选项",
    question_number: 1,
    card_hash: "a".repeat(64),
    ask: { ref: "host-message://ask/contract", hash: "b".repeat(64) },
    reply: { ref: "host-message://reply/contract", hash: "c".repeat(64) },
    rerank: { ref: "host-message://rerank/contract", hash: "d".repeat(64) },
  };
}

function writeInteractionRecord(task, payload, stage = "make-decision") {
  const contentHash = sha256(JSON.stringify(payload));
  const envelope = {
    schema_version: "stage-content-evidence.v1",
    task_id: task.identity.taskId,
    stage,
    workflow_run_id: `${stage}:rich-batch-contract`,
    snapshot_tree: "e".repeat(40),
    snapshot_head: "f".repeat(40),
    producer: { stage, component: "stage-content-evidence", version: "1.0.0" },
    created_at: "2026-08-10T00:00:00.000Z",
    kind: "interaction-completion.v1",
    content_hash: contentHash,
    payload,
  };
  const raw = `${JSON.stringify(envelope)}\n`;
  const ref = `evidence/stage-content/${contentHash}/interaction.json`;
  const recordPath = task.recordPath(ref);
  mkdirSync(dirname(recordPath), { recursive: true });
  writeFileSync(recordPath, raw);
  return { ref, hash: sha256(raw), tree: envelope.snapshot_tree };
}

const materials = Object.freeze({
  "decision-log.md": "decision",
  "spec.md": "spec",
  "plan.md": "plan",
  "tasks.md": [
    "## WorkflowHub Stage Progress",
    "| Stage | Status | Execution / evidence | Handoff / next |",
    "| --- | --- | --- | --- |",
    "| build-code | incomplete | quality_status=unavailable | verify-code |",
    "| verify-code | pending | quality_status=unknown | stop |",
  ].join("\n"),
});

describe("four-material non-gate contract", () => {
  it.each([
    "review/provider", "gate", "Runner", "TaskHandle", "receipt",
    "snapshot", "bridge", "doctor/comment",
  ])("keeps same-task work ready when %s is unavailable", (subject) => {
    const observations = [{
      authenticated: true,
      freshness: { status: "current" },
      fact: { stage: "build-code", subject, kind: "review", status: "unavailable" },
    }];
    expect(deriveStageProgress("build-code", observations, materials)).toMatchObject({
      work_status: "ready",
      required_materials: ["decision-log.md", "spec.md", "plan.md", "tasks.md"],
      missing_materials: [],
    });
  });

  it("reports only missing current materials", () => {
    expect(deriveStageProgress("build-code", [], { ...materials, "tasks.md": null })).toMatchObject({
      work_status: "blocked_by_missing_material",
      missing_materials: ["tasks.md"],
    });
  });

  it("loads the current stage package without a host invocation callback", () => {
    const loaded = loadStageSkillManifest(process.cwd(), "build-code");
    expect(loaded.manifest.stage).toBe("build-code");
    expect(loaded.manifest.skills.length).toBeGreaterThan(0);
  });

  it("keeps model execution outside WorkflowHub runtime", () => {
    const runtime = readFileSync("runtime/stage/stage-skill-runtime.mjs", "utf8");
    const runner = readFileSync("runtime/stage/stage-runner.mjs", "utf8");
    const cli = readFileSync("tools/cli/stage-runtime.mjs", "utf8");
    const evidence = readFileSync("runtime/evidence/stage-content-evidence.mjs", "utf8");
    expect(runtime).not.toMatch(/hostInvoke|dispatchStageSkill/);
    expect(runner).not.toMatch(/dispatchOrderedStageSkills/);
    expect(cli).not.toMatch(/invokeCodexHost|WORKFLOWHUB_HOST_BRIDGE|stage_skill_dispatch|invoke-stage-skill|host-invocations/);
  });

  it("keeps four-material ownership with authoring stages", () => {
    const buildCode = readFileSync("workflows/build-code/SKILL.md", "utf8");
    const verifyCode = readFileSync("workflows/verify-code/SKILL.md", "utf8");
    const specSpecify = readFileSync("skills/spec-specify/SKILL.md", "utf8");
    expect(buildCode).toContain("four current materials: a correction to `spec.md`");
    expect(buildCode).toContain("existing task card's\n`执行状态填写区` is the one same-task exception");
    expect(buildCode).toContain("`spec.md` belongs");
    expect(buildCode).not.toMatch(/may update `spec\.md`, `plan\.md`, and `tasks\.md`/);
    expect(verifyCode).toContain("不在 verify-code\n中改写材料");
    expect(verifyCode).toContain("tasks.md` 任务卡既有 `执行状态填写区` 除外");
    expect(verifyCode).toContain("`spec.md` → build-spec；`plan.md`\/`tasks.md` → build-plan");
    expect(specSpecify).toContain("Build-code and verify-code report a\nmaterial gap to this owner");
    expect(specSpecify).not.toMatch(/When a build-code or verify-code scope revision/);
  });

  it("keeps legacy stage-content access explicit and immutable", () => {
    const evidence = readFileSync("runtime/evidence/stage-content-evidence.mjs", "utf8");
    const taskHandle = readFileSync("runtime/task/task-handle.mjs", "utf8");
    const taskKernel = readFileSync("runtime/task/task-kernel-implementation.mjs", "utf8");
    expect(evidence).not.toMatch(/export function createStageContentEvidenceWriter/);
    expect(evidence).not.toMatch(/export function readLatestStageContentEvidence/);
    expect(evidence).not.toMatch(/publishCanonicalRecord/);
    expect(evidence).toMatch(/export function verifyStageContentEvidence/);
    expect(evidence).toMatch(/validateInteractionQuestionBatch/);
    expect(evidence).toMatch(/spec-clarify interaction requires rounds/);
    expect(evidence).toMatch(/explicit[\s\S]{0,80}immutable ref\/hash pair/i);
    expect(taskHandle).not.toMatch(/STAGE_CONTENT_POINTER_REPLACERS|replaceStageContentPointerFor/);
    expect(taskKernel).not.toMatch(/replaceStageContentLatestPointer|replaceStageContentPointerFor/);
  });

  it("reads a legacy stage-content record only through its explicit ref and hash", () => {
    const root = realpathSync(mkdtempSync(`${tmpdir()}/workflowhub-legacy-stage-content-`));
    try {
      const task = createTask({
        storageRoot: root,
        manifest: {
          schema_version: "1.0.0", project_name: "WorkflowHub", task_id: "legacy-stage-content",
          created_at: "2026-08-10T00:00:00.000Z", target_repo_root: process.cwd(), issue_ids: [], inputs: {},
        },
      });
      const payload = {
        interaction_type: "aggregate",
        rounds: [
          { ref: "quality/evidence/talk-1.json", hash: "a".repeat(64) },
          { ref: "quality/evidence/talk-2.json", hash: "b".repeat(64) },
          { ref: "quality/evidence/talk-3.json", hash: "c".repeat(64) },
        ],
        grill: { ref: "quality/evidence/grill.json", hash: "d".repeat(64) },
        workspace_tree: "e".repeat(40),
        decision_ref: "quality/evidence/decision.md",
        decision_hash: "f".repeat(64),
      };
      const envelope = {
        schema_version: "stage-content-evidence.v1", task_id: task.identity.taskId, stage: "make-decision",
        workflow_run_id: "make-decision:legacy-read", snapshot_tree: payload.workspace_tree,
        snapshot_head: "e".repeat(40),
        producer: { stage: "make-decision", component: "stage-content-evidence", version: "1.0.0" },
        created_at: "2026-08-10T00:00:00.000Z",
        kind: "interaction-completion.v1", content_hash: sha256(JSON.stringify(payload)), payload,
      };
      const raw = `${JSON.stringify(envelope)}\n`;
      const ref = `evidence/stage-content/${envelope.content_hash}/interaction.json`;
      const recordPath = task.recordPath(ref);
      mkdirSync(dirname(recordPath), { recursive: true });
      writeFileSync(recordPath, raw);
      expect(verifyStageContentEvidence({
        task, ref, hash: sha256(raw), expectedStage: "make-decision",
        expectedRunId: "make-decision:legacy-read", expectedTree: payload.workspace_tree,
        expectedKind: "interaction-completion.v1",
      })).toMatchObject({ task_id: task.identity.taskId, kind: "interaction-completion.v1" });
      expect(() => verifyStageContentEvidence({ task, ref, hash: "0".repeat(64) })).toThrow(/integrity hash mismatch/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("validates rich persisted Talk and Clarify batches with the shared contract", () => {
    const root = realpathSync(mkdtempSync(`${tmpdir()}/workflowhub-rich-interaction-`));
    try {
      const task = createTask({
        storageRoot: root,
        manifest: {
          schema_version: "1.0.0", project_name: "WorkflowHub", task_id: "rich-interaction-contract",
          created_at: "2026-08-10T00:00:00.000Z", target_repo_root: process.cwd(), issue_ids: [], inputs: {},
        },
      });
      const question = richQuestion();
      const talk = {
        interaction_type: "talk",
        question_batch_version: "rich-v1",
        rounds: [{
          round_number: 1,
          candidate_queue: [{ item_id: "scope", impact: "high", status: "asked", reason: "范围会改变方向" }],
          questions_already_asked: 1,
          open_direction_changing_questions: 0,
          current_total: 1,
          end_reason: "本轮问题已回答",
          zero_question_reason: null,
          questions: [question],
        }],
        grill: null,
        workspace_tree: "e".repeat(40),
      };
      const talkRecord = writeInteractionRecord(task, talk);
      expect(verifyStageContentEvidence({
        task, ...talkRecord, expectedStage: "make-decision", expectedKind: "interaction-completion.v1",
      })).toMatchObject({ payload: { interaction_type: "talk" } });

      const terminalTalk = structuredClone(talk);
      terminalTalk.rounds[0].questions = [];
      terminalTalk.rounds[0].questions_already_asked = 0;
      terminalTalk.rounds[0].open_direction_changing_questions = 0;
      terminalTalk.rounds[0].current_total = 0;
      terminalTalk.rounds[0].zero_question_reason = "本轮没有剩余方向问题";
      const terminalTalkRecord = writeInteractionRecord(task, terminalTalk);
      expect(verifyStageContentEvidence({
        task, ...terminalTalkRecord, expectedStage: "make-decision", expectedKind: "interaction-completion.v1",
      })).toMatchObject({ payload: { interaction_type: "talk" } });

      const clarify = {
        interaction_type: "spec-clarify",
        question_batch_version: "rich-v1",
        rounds: [{ questions: [richQuestion("acceptance")] }],
        grill: null,
        workspace_tree: "e".repeat(40),
      };
      const clarifyRecord = writeInteractionRecord(task, clarify, "build-spec");
      expect(verifyStageContentEvidence({
        task, ...clarifyRecord, expectedStage: "build-spec", expectedKind: "interaction-completion.v1",
      })).toMatchObject({ payload: { interaction_type: "spec-clarify" } });

      const invalid = structuredClone(talk);
      delete invalid.rounds[0].questions[0].options[1].risk;
      const invalidRecord = writeInteractionRecord(task, invalid);
      expect(() => verifyStageContentEvidence({ task, ...invalidRecord })).toThrow(/question batch is invalid|needs risk/);

      const missingOptions = structuredClone(talk);
      delete missingOptions.rounds[0].questions[0].options;
      const missingOptionsRecord = writeInteractionRecord(task, missingOptions);
      expect(() => verifyStageContentEvidence({ task, ...missingOptionsRecord })).toThrow(/question batch is invalid|must provide 2 or 3 options/);

      const unsupportedVersion = structuredClone(talk);
      unsupportedVersion.question_batch_version = "rich-v2";
      const unsupportedVersionRecord = writeInteractionRecord(task, unsupportedVersion);
      expect(() => verifyStageContentEvidence({ task, ...unsupportedVersionRecord })).toThrow(/question_batch_version is unsupported|payload does not match its schema/);

      const emptyBatch = structuredClone(clarify);
      emptyBatch.rounds[0].questions = [];
      const emptyBatchRecord = writeInteractionRecord(task, emptyBatch, "build-spec");
      expect(() => verifyStageContentEvidence({ task, ...emptyBatchRecord })).toThrow(/question batch is invalid|at least one independent question|zero-question terminal requires an explicit reason/);

      const terminalClarify = structuredClone(clarify);
      terminalClarify.rounds[0].questions = [];
      terminalClarify.rounds[0].zero_question_reason = "当前没有剩余规格歧义";
      const terminalClarifyRecord = writeInteractionRecord(task, terminalClarify, "build-spec");
      expect(verifyStageContentEvidence({
        task, ...terminalClarifyRecord, expectedStage: "build-spec", expectedKind: "interaction-completion.v1",
      })).toMatchObject({ payload: { interaction_type: "spec-clarify" } });

      const missingTerminalReason = structuredClone(terminalClarify);
      delete missingTerminalReason.rounds[0].zero_question_reason;
      const missingTerminalReasonRecord = writeInteractionRecord(task, missingTerminalReason, "build-spec");
      expect(() => verifyStageContentEvidence({ task, ...missingTerminalReasonRecord })).toThrow(/zero-question terminal requires an explicit reason/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("validates rich persisted Grill batches and rejects incomplete ones", () => {
    const root = realpathSync(mkdtempSync(`${tmpdir()}/workflowhub-rich-grill-`));
    try {
      const task = createTask({
        storageRoot: root,
        manifest: {
          schema_version: "1.0.0", project_name: "WorkflowHub", task_id: "rich-grill-contract",
          created_at: "2026-08-10T00:00:00.000Z", target_repo_root: process.cwd(), issue_ids: [], inputs: {},
        },
      });
      const grill = {
        interaction_type: "grill",
        question_batch_version: "rich-v1",
        rounds: [],
        grill: {
          context: { status: "no-change", reason: "当前上下文已经足够" },
          adr: { status: "not-needed", reason: "没有新的架构决定" },
          conflicts: { status: "none", reason: "没有发现冲突" },
          file_references: [],
          no_file_reason: "本轮没有新增文件引用",
          exit_checks: {
            context_checked: true,
            adr_checked: true,
            conflicts_checked: true,
            file_references_checked: true,
          },
          questions: [richQuestion("frontier")],
        },
        workspace_tree: "e".repeat(40),
      };
      const record = writeInteractionRecord(task, grill);
      expect(verifyStageContentEvidence({
        task, ...record, expectedStage: "make-decision", expectedKind: "interaction-completion.v1",
      })).toMatchObject({ payload: { interaction_type: "grill", question_batch_version: "rich-v1" } });

      const incomplete = structuredClone(grill);
      delete incomplete.grill.questions;
      const incompleteRecord = writeInteractionRecord(task, incomplete);
      expect(() => verifyStageContentEvidence({ task, ...incompleteRecord })).toThrow(/rich grill interaction requires a persisted question batch/);

      const invalid = structuredClone(grill);
      delete invalid.grill.questions[0].options[0].risk;
      const invalidRecord = writeInteractionRecord(task, invalid);
      expect(() => verifyStageContentEvidence({ task, ...invalidRecord })).toThrow(/question batch is invalid|needs risk/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
