import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Ajv2020 from "ajv/dist/2020.js";

import { assertReviewIdentity, reviewRuleFor } from "../../runtime/review/review-policy.mjs";
import { buildReviewMaterials, reviewInstructionsFor } from "../../skills/wh-review/scripts/review-materials.mjs";
import { resolveTrustedReviewRoute } from "../../skills/wh-review/scripts/third-review-host-config.mjs";
import { buildSemanticProjection, compareSemanticProjection } from "../../skills/wh-review/scripts/review-semantic-projection.mjs";
import { createSimpleReviewPacket, runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import { recordSimpleReviewResult, recordTaskBoundE2eReviewResult, recordTaskBoundE2eReviewUnavailable } from "../../runtime/review/review-record-route.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";

const root = join(import.meta.dirname, "..", "..");
const tempRoots = [];
const fullPrdMaterials = () => ({
  decision_log: "# Decision\n\nThe parent decision is frozen.\n",
  prd: "# Product requirements\n\nA complete PRD with task cards and acceptance criteria.\n",
  task_map: "## Task map\n\n- T001 owns the user result.\n",
  design_facts: { ui_applicability: "non_ui", status: "not_applicable", reason: "planning capability is non-UI" },
  quality_facts: { status: "unavailable", provider: "not_configured", coverage: "unknown" },
});

function json(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

function makeSource() {
  return { changedFiles: [], diffBytes: 0 };
}

function makePacketFixture() {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "workflowhub-build-prd-review-"));
  tempRoots.push(fixtureRoot);
  const reviewDataRoot = join(fixtureRoot, "review-data");
  const attachmentRoot = join(fixtureRoot, "attachments");
  mkdirSync(reviewDataRoot);
  mkdirSync(attachmentRoot);
  return { fixtureRoot, reviewDataRoot, attachmentRoot };
}

function route() {
  return { initial: ["kimi"], mode: "single_round", minimum_heterologous: 1 };
}

function selection() {
  return {
    providers: ["kimi"],
    provider_identities: { kimi: { source_id: "source-kimi", config_id: "config-kimi" } },
  };
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function makeReflectionTask() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-build-prd-reflection-")));
  tempRoots.push(storageRoot);
  const task = createTask({
    storageRoot,
    manifest: {
      schema_version: "1.0.0",
      project_name: "BuildPrd",
      task_id: "reflection-contract",
      created_at: "2026-09-11T00:00:00.000Z",
      target_repo_root: storageRoot,
      issue_ids: [],
      inputs: {},
    },
  });
  return { task, kernel: createTaskKernel(task) };
}

// This fixture executes the existing TaskKernel publish/read seam named by the
// build-prd report-and-handoff contract. It is deliberately not a new writer.
function executeDeclaredHandoff({ task, kernel, payload, publish = kernel.publishCanonicalRecord.bind(kernel), read = task.readRecord.bind(task) }) {
  const required = ["task_id", "workflow", "material_refs", "reply_text", "step_results", "reflection_facts"];
  if (!payload || typeof payload !== "object" || required.some((key) => payload[key] === undefined)) {
    return { status: "unavailable", reason: "handoff payload is incomplete" };
  }
  if (payload.task_id !== task.identity.taskId) return { status: "unavailable", reason: "handoff task identity mismatch" };
  if (typeof payload.reply_text !== "string" || payload.reply_text.trim() === "") {
    return { status: "unavailable", reason: "handoff reply_text is empty" };
  }
  if (!Array.isArray(payload.material_refs) || !Array.isArray(payload.step_results) || !Array.isArray(payload.reflection_facts)) {
    return { status: "unavailable", reason: "handoff arrays are missing" };
  }
  const raw = `${JSON.stringify(payload, null, 2)}\n`;
  const digest = sha256(raw);
  const ref = `quality/evidence/portable-workflow-outcomes/build-prd/${digest}.json`;
  try {
    publish(ref, raw);
  } catch (error) {
    return { status: "unavailable", reason: `write failed: ${error.message}` };
  }
  let readback;
  try {
    readback = read(ref);
  } catch (error) {
    return { status: "unavailable", reason: `read failed: ${error.message}` };
  }
  if (readback !== raw || sha256(readback) !== digest) {
    return { status: "unavailable", reason: "handoff readback hash mismatch" };
  }
  return { status: "recorded", ref, sha256: digest, payload: JSON.parse(readback) };
}

afterEach(() => {
  while (tempRoots.length) rmSync(tempRoots.pop(), { recursive: true, force: true });
});

describe("build-prd non-stage wh-review contract", () => {
  it("uses only the hyphenated build-prd sentinel and validates public snake-case identity aliases", () => {
    expect(reviewRuleFor("build-prd")).toMatchObject({ minimum_reviewers: 1, source_bundle: "none" });
    expect(() => reviewRuleFor("build_prd")).toThrow(/unknown stage|hyphenated|sentinel/i);
    expect(assertReviewIdentity({ stage: "build-prd", review_kind: "build_prd" })).toMatchObject({
      stage: "build-prd",
      reviewKind: "build_prd",
    });
    expect(() => assertReviewIdentity({ stage: "build-code", review_kind: "not-a-review-kind" }))
      .toThrow(/unknown review_kind/);
    expect(() => assertReviewIdentity({ stage: "build-code", review_kind: "build_prd", reviewKind: "mini_task.design" }))
      .toThrow(/review identity aliases review_kind\/reviewKind disagree/);
  });

  it("registers build_prd as a real top-level sibling without changing five formal stages", () => {
    const matrix = json("runtime/review/stage-materials.json");
    const plan = json("skills/wh-review/stage-skill-plan.json");
    const manifest = json("skills/wh-review/manifest.json");
    const contract = readFileSync(join(root, "skills/wh-review/contracts/build-prd.md"), "utf8");
    const schema = json("runtime/review/schemas/stage-materials.schema.json");
    const validate = new Ajv2020({ strict: false }).compile(schema);

    expect(validate(matrix), validate.errors).toBe(true);
    expect(Object.keys(matrix.stages)).toEqual(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
    expect(matrix.stages).not.toHaveProperty("build-prd");
    expect(matrix.non_stage.build_prd).toMatchObject({ minimum_reviewers: 1, source_bundle: "none" });
    expect(plan.stages).not.toHaveProperty("build_prd");
    expect(plan.non_stage.build_prd).toMatchObject({ review_kind: "build_prd", delivery_mode: "report_only" });
    expect(manifest.non_stage.build_prd.path).toBe("contracts/build-prd.md");
    expect(manifest.contracts["build-prd"].required_skills).toEqual(expect.arrayContaining(["review", "simplicity-guard"]));
    expect(contract).toMatch(/一次[^\n]*PRD[^\n]*(审查|review)/i);
    expect(contract).toMatch(/debate[^\n]*(2|两)/i);
    expect(contract).toMatch(/analy[sz]e|reflection/i);
    expect(contract).toMatch(/report[- ]only|report-only|只产生事实/i);
    expect(contract).toMatch(/unavailable|partial/i);
  });

  it("uses a dedicated allowlist and packet contract instead of build-plan materials", () => {
    expect(reviewRuleFor("build-prd")).toMatchObject({
      source_bundle: "none",
      required: expect.arrayContaining(["decision_log", "prd", "task_map", "design_facts", "quality_facts", "review_instructions"]),
      forbidden: expect.arrayContaining(["approved_spec", "draft_plan", "draft_tasks", "tasks", "changes_diff"]),
      minimum_reviewers: 1,
    });
    expect(() => reviewRuleFor("build-prd", "detail")).toThrow(/does not use|review track/i);

    const fixture = makePacketFixture();
    const materials = fullPrdMaterials();
    materials.review_instructions = reviewInstructionsFor("build-prd", null, false, null, "build_prd");
    const packet = buildReviewMaterials({
      reviewDataRoot: fixture.reviewDataRoot,
      attachmentRoot: fixture.attachmentRoot,
      source: makeSource(),
      taskId: "build-prd-contract",
      stage: "build-prd",
      reviewKind: "build_prd",
      materials,
    });
    expect(packet.contractId).toBe("wh-review.contract.build-prd.v1");
    expect(readFileSync(join(packet.bundleRoot, "contracts/provider-protocol.md"), "utf8")).toMatch(/build-prd.*report-only|report-only.*build-prd/i);
    expect(readFileSync(join(packet.bundleRoot, "contracts/provider-protocol.md"), "utf8")).toMatch(/decision_log.*prd.*task_map.*design_facts.*quality_facts/s);
    expect(readFileSync(join(packet.bundleRoot, "contracts/provider-protocol.md"), "utf8")).toMatch(/not a formal stage|not.*formal stage/i);
    expect(packet.files).toContain("contracts/build-prd.md");
    expect(packet.packetPlan).toMatchObject({ stage: "build-prd", review_kind: "build_prd", delivery_mode: "inline_complete" });
    expect(packet.files).toEqual(expect.arrayContaining([
      "requirements/decision_log.md",
      "requirements/prd.md",
      "requirements/task_map.md",
      "requirements/design_facts.json",
      "requirements/quality_facts.json",
    ]));
    expect(packet.packetPlan.excluded).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "material:approved_spec" }),
      expect.objectContaining({ category: "material:draft_plan" }),
      expect.objectContaining({ category: "material:draft_tasks" }),
    ]));
    expect(() => buildReviewMaterials({
      reviewDataRoot: fixture.reviewDataRoot,
      attachmentRoot: fixture.attachmentRoot,
      source: makeSource(),
      taskId: "build-prd-contract",
      stage: "build-prd",
      reviewKind: "build_prd",
      materials: { ...materials, draft_plan: "must not masquerade as PRD" },
    })).toThrow(/MATERIAL_FORBIDDEN/);
  });

  it("rejects malformed non-stage identity at every direct helper boundary", () => {
    const malformed = { stage: "build-code", review_kind: "build_prd", review_scope: "phase", materials: { prd: "draft" } };
    expect(() => createSimpleReviewPacket(malformed)).toThrow(/NON_STAGE_IDENTITY_INVALID|build_prd.*stage/i);
    expect(() => buildSemanticProjection({ ...malformed, contract_id: "build-prd", contract_hash: "a".repeat(64) })).toThrow(/NON_STAGE_IDENTITY_INVALID|build_prd.*stage/i);
    expect(() => reviewInstructionsFor("build-code", null, false, "phase", "build_prd")).toThrow(/NON_STAGE_IDENTITY_INVALID|build_prd.*stage/i);
    const fixture = makePacketFixture();
    expect(() => buildReviewMaterials({ ...fixture, source: makeSource(), taskId: "identity", stage: "build-code", reviewScope: "phase", reviewKind: "build_prd", materials: {} })).toThrow(/NON_STAGE_IDENTITY_INVALID|build_prd.*stage/i);
    expect(() => resolveTrustedReviewRoute({ version: 2, stages: {}, non_stage: { build_prd: route() } }, "build-prd", null, "build_prd", "phase")).toThrow(/NON_STAGE_IDENTITY_INVALID|review_scope/i);
  });

  it("resolves a non-stage route and keeps semantic identity separate from record-only facts", () => {
    const whReview = { version: 2, stages: {}, non_stage: { build_prd: route() } };
    expect(resolveTrustedReviewRoute(whReview, "build-prd", null, "build_prd", null)).toEqual(route());
    expect(resolveTrustedReviewRoute(whReview, "build-code")).toBeNull();

    const base = buildSemanticProjection({
      stage: "build-prd",
      review_kind: "build_prd",
      contract_id: "wh-review.contract.build-prd.v1",
      contract_hash: "a".repeat(64),
      materials: { ...fullPrdMaterials(), review_instructions: "fixed" },
    });
    const recordOnly = buildSemanticProjection({
      stage: "build-prd",
      review_kind: "build_prd",
      contract_id: "wh-review.contract.build-prd.v1",
      contract_hash: "a".repeat(64),
      materials: { ...fullPrdMaterials(), review_instructions: "fixed", status: "partial", provider: "kimi" },
    });
    const changed = buildSemanticProjection({
      stage: "build-prd",
      review_kind: "build_prd",
      contract_id: "wh-review.contract.build-prd.v1",
      contract_hash: "a".repeat(64),
      materials: { ...fullPrdMaterials(), review_instructions: "fixed", prd: "# Changed PRD\n" },
    });
    expect(base.surface).toBe("build-prd");
    expect(compareSemanticProjection(base, recordOnly)).toMatchObject({ changed: false, kind: "record_only_changed" });
    expect(compareSemanticProjection(base, changed)).toMatchObject({ changed: true, kind: "semantic_changed" });
  });

  it("rejects camel-case build_prd identity on canonical persistence paths", () => {
    expect(() => recordSimpleReviewResult({ result: { status: "unavailable", stage: "build-code", reviewKind: "build_prd" } })).toThrow(/BUILD_PRD_REPORT_ONLY_NOT_PERSISTED/);
    expect(() => recordTaskBoundE2eReviewUnavailable({ result: { status: "unavailable", stage: "verify-code", reviewKind: "build_prd" } })).toThrow(/BUILD_PRD_REPORT_ONLY_NOT_PERSISTED/);
    expect(() => recordTaskBoundE2eReviewResult({ result: { status: "available", stage: "verify-code", reviewKind: "build_prd" } })).toThrow(/BUILD_PRD_REPORT_ONLY_NOT_PERSISTED/);
  });

  it("rejects build_prd identity on formal stages and rejects canonical persistence", async () => {
    const blocked = await runSimpleReview({
      stage: "build-code",
      review_kind: "build_prd",
      review_track: "detail",
      review_scope: "phase",
      host_provider: "codex",
      materials: { ...fullPrdMaterials(), review_instructions: "invalid identity" },
    }, {
      loadConfig: () => ({ whReview: { version: 2, stages: {}, non_stage: { build_prd: route() } }, attachmentRoot: "/tmp" }),
      resolveRoute: () => route(),
      selectProviders: () => { throw new Error("provider selection must not run"); },
    });
    expect(blocked).toMatchObject({ status: "unavailable", dispatch_state: "blocked_before_dispatch", error: { code: "NON_STAGE_IDENTITY_INVALID" } });
    expect(() => recordSimpleReviewResult({ result: { status: "unavailable", stage: "build-prd", review_kind: "build_prd" } })).toThrow(/BUILD_PRD_REPORT_ONLY_NOT_PERSISTED/);
    expect(() => recordTaskBoundE2eReviewUnavailable({ result: { status: "unavailable", stage: "verify-code", review_kind: "build_prd" } })).toThrow(/BUILD_PRD_REPORT_ONLY_NOT_PERSISTED/);
    expect(() => recordTaskBoundE2eReviewResult({ result: { status: "available", stage: "verify-code", review_kind: "build_prd" } })).toThrow(/BUILD_PRD_REPORT_ONLY_NOT_PERSISTED/);
  });

  it("makes one provider-fact request, preserves unavailable/partial facts, and does not persist canonical stage records", async () => {
    const fixture = makePacketFixture();
    let calls = 0;
    const input = {
      stage: "build-prd",
      review_kind: "build_prd",
      host_provider: "codex",
      materials: { ...fullPrdMaterials(), review_instructions: reviewInstructionsFor("build-prd", null, false, null, "build_prd") },
    };
    const unavailable = await runSimpleReview(input, {
      loadConfig: () => ({ whReview: { version: 2, stages: {}, non_stage: { build_prd: route() } }, attachmentRoot: fixture.attachmentRoot }),
      resolveRoute: () => route(),
      selectProviders: () => selection(),
      client: { runGroup: async () => {
        calls += 1;
        return { runtimeId: "runtime-1", outcome: "partial", providers: [{
          provider: "kimi", status: "failed", identity: { provider: "kimi", adapter: "kimi", source_id: "source-kimi", config_id: "config-kimi" },
          error: { code: "AUTH_REQUIRED", message: "provider unavailable" },
        }] };
      } },
    });
    expect(calls).toBe(1);
    expect(unavailable).toMatchObject({ status: "unavailable", stage: "build-prd", review_kind: "build_prd" });
    expect(unavailable.provider_results[0]).toMatchObject({ status: "failed", error: { code: "AUTH_REQUIRED" } });
    expect(unavailable).not.toHaveProperty("attempt_ref");
    expect(unavailable).not.toHaveProperty("result_ref");
    expect(unavailable).not.toHaveProperty("verdict");

    const partial = await runSimpleReview(input, {
      loadConfig: () => ({ whReview: { version: 2, stages: {}, non_stage: { build_prd: { initial: ["kimi", "opencode"], mode: "single_round", minimum_heterologous: 1 } } }, attachmentRoot: fixture.attachmentRoot }),
      resolveRoute: () => ({ initial: ["kimi", "opencode"], mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["kimi", "opencode"], provider_identities: {
        kimi: { source_id: "source-kimi", config_id: "config-kimi" },
        opencode: { source_id: "source-opencode", config_id: "config-opencode" },
      } }),
      client: { runGroup: async () => ({ runtimeId: "runtime-2", outcome: "partial", providers: [
        { provider: "kimi", status: "completed", identity: { provider: "kimi", adapter: "kimi", source_id: "source-kimi", config_id: "config-kimi" }, output: '{"findings":[]}', error: null },
        { provider: "opencode", status: "failed", identity: { provider: "opencode", adapter: "opencode", source_id: "source-opencode", config_id: "config-opencode" }, error: { code: "TIMEOUT", message: "provider timeout" } },
      ] }) },
    });
    expect(partial.status).toBe("available");
    expect(partial.provider_results).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "kimi", status: "completed" }),
      expect.objectContaining({ provider: "opencode", status: "failed", error: expect.objectContaining({ code: "TIMEOUT" }) }),
    ]));
    expect(partial).not.toHaveProperty("attempt_ref");
    expect(partial).not.toHaveProperty("result_ref");
  });
});

describe("planning-hardening portable reflection contracts", () => {
  it("planning-hardening AC-REFLECT-001/AC-META-001 declares one save-read handoff with bound payload fields", () => {
    const workflow = readFileSync(join(root, "workflows/build-prd/SKILL.md"), "utf8");
    expect(workflow).toContain("report-facts-and-handoff");
    expect(workflow).toContain("reportFactsAndHandoff");
    expect(workflow).toContain("readReflectionForReport");
    expect(workflow).toContain("publishCanonicalRecord");
    expect(workflow).toContain("raw");
    expect(workflow).toContain("SHA");
    expect(workflow).toContain("task_id");
    expect(workflow).toContain("workflow");
    expect(workflow).toContain("material_refs");
    expect(workflow).toContain("reply_text");
    expect(workflow).toContain("step_results");
    expect(workflow).toContain("reflection_facts");
    expect(workflow).toContain("仅 task_id、workflow、material_refs、reply_text、step_results、reflection_facts");

    const { task, kernel } = makeReflectionTask();
    const payload = {
      task_id: task.identity.taskId,
      workflow: "build-prd",
      material_refs: [{ ref: "decision-log.md", sha256: "d".repeat(64) }],
      reply_text: "用户确认当前方向层 PRD 草稿。",
      step_results: [{ step_slug: "report-facts-and-handoff", status: "recorded" }],
      reflection_facts: [{ fact: "复盘结论来自已读回的步骤结果。" }],
    };
    const result = executeDeclaredHandoff({ task, kernel, payload });
    expect(result.status).toBe("recorded");
    expect(result.payload).toEqual(payload);
    expect(result.ref).toBe(`quality/evidence/portable-workflow-outcomes/build-prd/${result.sha256}.json`);

    for (const invalid of [
      { ...payload, reply_text: "" },
      { ...payload, task_id: "other-task" },
      { ...payload, material_refs: undefined },
    ]) {
      expect(executeDeclaredHandoff({ task, kernel, payload: invalid }).status).toBe("unavailable");
    }
    expect(executeDeclaredHandoff({ task, kernel, payload, publish: () => { throw new Error("write unavailable"); } })).toMatchObject({ status: "unavailable" });
    expect(executeDeclaredHandoff({ task, kernel, payload, publish: () => undefined, read: () => { throw new Error("read unavailable"); } })).toMatchObject({ status: "unavailable" });
    expect(executeDeclaredHandoff({ task, kernel, payload, publish: () => undefined, read: () => "tampered\n" })).toMatchObject({ status: "unavailable" });
  });

  it("planning-hardening AC-CHECK-001/AC-CLOSE-002 keeps portable reflection separate from formal stage and close approval", () => {
    const text = `${readFileSync(join(root, "workflows/build-prd/SKILL.md"), "utf8")}\n${readFileSync(join(root, "workflows/build-prd/steps.json"), "utf8")}`;
    expect(text).toMatch(/不是正式stage|not a formal stage/);
    expect(text).toMatch(/不.*(?:stage-reflection|正式stage).*(?:复盘|reflection)|reflection.*(?:not|不).*(?:formal stage|正式stage)/i);
    expect(text).toMatch(/不.*(?:close|操作确认|approval)/i);
    expect(text).toMatch(/不增加第三次.*内容调用|not.*third content call/i);
  });
});
