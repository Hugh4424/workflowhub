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
    expect(buildCode).toContain("Build-code does not\nauthor or rewrite the four current materials");
    expect(buildCode).toContain("`spec.md` belongs\nto `build-spec`");
    expect(buildCode).not.toMatch(/may update `spec\.md`, `plan\.md`, and `tasks\.md`/);
    expect(verifyCode).toContain("不在 verify-code\n中改写材料");
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
});
