import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

import {
  deriveStageCompletion,
  deriveStageProgress,
} from "../runtime/stage/completion-predicates.mjs";
import { deriveDecisionDivergenceOutline, deriveResearchCandidatePresentation, validateInteractionLifecycleContract } from "../runtime/stage/stage-content-contracts.mjs";
import { deriveResearchStatus, readResearchReport } from "../runtime/evidence/research-report.mjs";
import { officialStageHandler } from "../runtime/stage/stage-handlers.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const stage = (name) => readFileSync(join(root, "workflows", name, "SKILL.md"), "utf8");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const materials = {
  "decision-log.md": "current decision",
  "spec.md": "current specification",
  "plan.md": "current plan",
  "tasks.md": "current tasks",
};

const unavailableReview = [{
  authenticated: true,
  freshness: { status: "stale" },
  fact: {
    ref: "quality/reviews/unavailable.json",
    stage: "build-code",
    subject: "integration_review",
    kind: "review",
    status: "unavailable",
  },
}];

describe("current-material workflow contracts", () => {
  it("AC-34: two researched candidates are not delivered by a report ref and summary alone", () => {
    const report = {
      schema_version: "research-report.v1",
      task_id: "card-07-ac-34",
      stage: "make-decision",
      snapshot_tree: "a".repeat(40),
      material_scope_revision: `revision-${"b".repeat(64)}`,
      status: "completed",
      question: "Which of the two researched candidates should be recommended?",
      questions: [
        { question_id: "CAND-A", text: "候选 A" },
        { question_id: "CAND-B", text: "候选 B" },
      ],
      decision_axis: "candidate choice",
      tool_usage: [],
      open_items: [],
      review: { status: "completed", evidence_ref: "quality/evidence/research-review.json" },
      fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] },
      rounds: 1,
      sources: [
        { url_or_ref: "https://example.test/a", source_tier: "primary", read_original: true },
        { url_or_ref: "https://example.test/b", source_tier: "secondary", read_original: true },
        { url_or_ref: "https://example.test/c", source_tier: "secondary", read_original: true },
      ],
      evidence: [
        { claim: "A has lower operating cost", source_ref: "https://example.test/a", locator: "§1", confidence: "high", read_original: true },
        { claim: "B has stronger recovery", source_ref: "https://example.test/b", locator: "§2", confidence: "medium", read_original: true },
      ],
      triangulation: { status: "supported", conflicts: [] },
      coverage: { dimensions: ["cost", "recovery"], first_party_ratio: 0.34, required_questions: ["CAND-A", "CAND-B"], covered_questions: ["CAND-A", "CAND-B"] },
      saturation: { status: "saturated", reason: "both candidates have original sources" },
      candidates: [
        { candidate_id: "CAND-A" },
        { candidate_id: "CAND-B" },
      ],
    };
    const raw = `${JSON.stringify(report, null, 2)}\n`;
    const ref = `quality/evidence/research/${createHash("sha256").update(raw).digest("hex")}.json`;
    const record = readResearchReport({
      read: (candidateRef) => candidateRef === ref ? raw : (() => { throw new Error("unexpected research ref"); })(),
      ref,
      taskId: report.task_id,
      stage: report.stage,
      snapshotTree: report.snapshot_tree,
      materialScopeRevision: report.material_scope_revision,
    });
    expect(record.raw.length).toBeGreaterThan(500);

    const disclosure = deriveResearchStatus([record]);
    expect(disclosure.status).toBe("completed");
    expect(disclosure.report_ref).toBe(ref);
    // The report has sources for both candidates, but no candidate-level
    // recommendation/rejection reason or full-report delivery record. A
    // completed research status and content-addressed ref are not delivery.
    expect(disclosure.candidate_delivery).toEqual(expect.objectContaining({
      status: "incomplete",
      missing_candidate_ids: ["CAND-A", "CAND-B"],
    }));
  });

  it("AC-34: publishes each delivered candidate in the current decision-log table", async () => {
    const report = {
      schema_version: "research-report.v1", task_id: "card-07-ac-34", stage: "make-decision",
      snapshot_tree: "a".repeat(40), material_scope_revision: `revision-${"b".repeat(64)}`,
      status: "completed", question: "Which route?", decision_axis: "candidate choice", tool_usage: [], open_items: [],
      review: { status: "completed", evidence_ref: "quality/evidence/research-review.json" }, fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] },
      rounds: 1,
      sources: [
        { url_or_ref: "https://example.test/a", source_tier: "primary", read_original: true },
        { url_or_ref: "https://example.test/b", source_tier: "secondary", read_original: true },
        { url_or_ref: "https://example.test/c", source_tier: "secondary", read_original: true },
      ],
      evidence: [
        { evidence_id: "E-A", claim: "A is bounded", source_ref: "https://example.test/a", locator: "§1", confidence: "high", read_original: true, candidate_ids: ["CAND-A"] },
        { evidence_id: "E-B", claim: "B is recoverable", source_ref: "https://example.test/b", locator: "§2", confidence: "medium", read_original: true, candidate_ids: ["CAND-B"] },
      ],
      triangulation: { status: "supported", conflicts: [] }, coverage: { dimensions: ["choice"], first_party_ratio: 0.34 }, saturation: { status: "saturated", reason: "both alternatives are evidenced" },
      candidates: [
        { candidate_id: "CAND-A", plain_language_summary: "A keeps the path bounded.", source_refs: ["https://example.test/a"], evidence_refs: ["E-A"], recommendation: "recommended", recommendation_reason: "Its primary evidence is stronger." },
        { candidate_id: "CAND-B", plain_language_summary: "B has a viable recovery path.", source_refs: ["https://example.test/b"], evidence_refs: ["E-B"], recommendation: "not_recommended", recommendation_reason: "Its recovery evidence is weaker." },
      ],
    };
    const raw = `${JSON.stringify(report)}\n`;
    const ref = `quality/evidence/research/${createHash("sha256").update(raw).digest("hex")}.json`;
    const record = readResearchReport({ read: () => raw, ref, taskId: report.task_id, stage: report.stage, snapshotTree: report.snapshot_tree, materialScopeRevision: report.material_scope_revision });
    const disclosure = deriveResearchStatus([record]);
    const binding = {
      schema_version: "workflowhub-research-candidate-delivery.v1",
      report_ref: ref,
      report_sha256: record.sha256,
      candidates: disclosure.candidate_delivery.candidates.map(({ candidate_id, plain_language_summary, source_refs, evidence_refs, recommendation, recommendation_reason }) => ({ candidate_id, plain_language_summary, source_refs, evidence_refs, recommendation, recommendation_reason })),
    };
    const decisionLog = `# Decision\n\n## 调研候选交付\n\n完整报告：\`${ref}\`\n\n| 候选 ID | 大白话摘要 | 推荐/不推荐 | 理由 | 出处与全文 |\n| --- | --- | --- | --- | --- |\n| CAND-A | A keeps the path bounded. | recommended | Its primary evidence is stronger. | https://example.test/a；${ref} |\n| CAND-B | B has a viable recovery path. | not_recommended | Its recovery evidence is weaker. | https://example.test/b；${ref} |\n\n\`\`\`json\n${JSON.stringify(binding)}\n\`\`\`\n`;
    expect(deriveResearchCandidatePresentation(decisionLog, disclosure)).toMatchObject({ status: "delivered", full_report: { ref } });
    expect(deriveResearchCandidatePresentation("# Decision\n", disclosure)).toMatchObject({ status: "incomplete", reason: "candidate_presentation_missing" });

    const result = await officialStageHandler("make-decision")({
      stage: "make-decision",
      identity: { taskId: report.task_id },
      manifest: { record_model: "vnext-single-write" },
      currentMaterialRevision: report.material_scope_revision,
      currentMaterialScopeRevision: () => report.material_scope_revision,
      snapshotWorkspace: () => ({ tree: report.snapshot_tree }),
      candidateWorkspace: { worktreeRoot: "/fixture", baselineCommit: report.snapshot_tree, captureSnapshot: () => ({ tree: report.snapshot_tree }) },
      readArtifact: () => decisionLog,
      artifactRef: () => "specs/card-07-ac-34/decision-log.md",
      readEvidence: (candidateRef) => candidateRef === ref ? { bytes: raw, sha256: record.sha256 } : (() => { throw new Error("unexpected evidence ref"); })(),
      recordConsumerInvocation: () => {},
    }, { receipts: { research: ref } });
    expect(result.facts.research.research_disclosure.candidate_presentation).toMatchObject({ status: "delivered", full_report: { ref } });
  });

  it("AC-33/39/42: requires a non-user semantic direction and redraws an over-falsified outline", async () => {
    const binding = {
      schema_version: "workflowhub-decision-divergence.v1",
      intake: {
        raw_requirement: { text: "模糊需求：改善导入流程", attribution: "user_verbatim", source_id: "U-001" },
        pain_point: { text: "用户不知道失败后如何恢复", attribution: "user_verbatim", source_id: "U-002" },
      },
      angles: [
        { angle_id: "A-UX", plain_language_angle: "减少首次理解成本", source: "internal analysis", strength: "medium" },
        { angle_id: "A-RECOVERY", plain_language_angle: "让失败可恢复", source: "research R-01", strength: "high" },
      ],
      original_candidates: [
        { candidate_id: "U-1", text: "增加导入说明", source_id: "U-002", semantic_basis: { problem_axis: "understanding", mechanism: "documentation", target: "new user", outcome: "fewer questions" } },
        { candidate_id: "U-2", text: "增加失败提示", source_id: "U-002", semantic_basis: { problem_axis: "failure", mechanism: "alert", target: "import attempt", outcome: "visible error" } },
      ],
      candidates: [
        { candidate_id: "U-1", text: "增加导入说明", origin: "user", source_ids: ["U-002"], strength: "direct", semantic_basis: { problem_axis: "understanding", mechanism: "documentation", target: "new user", outcome: "fewer questions" } },
        { candidate_id: "U-2", text: "增加失败提示", origin: "user", source_ids: ["U-002"], strength: "direct", semantic_basis: { problem_axis: "failure", mechanism: "alert", target: "import attempt", outcome: "visible error" } },
        { candidate_id: "N-1", text: "保存可恢复导入草稿", origin: "internal", angle_id: "A-RECOVERY", source_ids: ["A-RECOVERY"], novelty_against: ["U-1", "U-2"], changed_dimensions: ["problem_axis", "mechanism", "target", "outcome"], strength: "medium", semantic_basis: { problem_axis: "recovery", mechanism: "draft persistence", target: "failed import", outcome: "resume instead of restart" } },
      ],
      outlines: [
        { outline_version: "r0", status: "abandoned", superseded_by: "r1", hypotheses: [
          { hypothesis_id: "H-01", statement: "说明能消除失败", status: "falsified", falsifier: "用户仍无法恢复", evidence_refs: ["R-01"] },
          { hypothesis_id: "H-02", statement: "提示能支持恢复", status: "falsified", falsifier: "错误后必须重来", evidence_refs: ["R-02"] },
          { hypothesis_id: "H-03", statement: "一次性流程足够", status: "falsified", falsifier: "网络中断会丢失进度", evidence_refs: ["R-03"] },
          { hypothesis_id: "H-04", statement: "用户会理解错误", status: "supported", falsifier: "用户无法解释错误", evidence_refs: ["R-04"] },
          { hypothesis_id: "H-05", statement: "重试成本可接受", status: "unresolved", falsifier: "重试超过两次", evidence_refs: ["R-05"] },
        ] },
        { outline_version: "r1", status: "active", redraw_of: "r0", redraw_reason_ids: ["H-01", "H-02", "H-03"], hypotheses: [
          { hypothesis_id: "H-06", statement: "草稿可恢复", status: "supported", falsifier: "草稿不可重开", evidence_refs: ["R-06"] },
          { hypothesis_id: "H-07", statement: "恢复入口可理解", status: "unresolved", falsifier: "用户找不到恢复入口", evidence_refs: ["R-07"] },
          { hypothesis_id: "H-08", statement: "失败状态可见", status: "supported", falsifier: "错误无状态说明", evidence_refs: ["R-08"] },
        ] },
      ],
    };
    binding.oi_outline_version = "outline-v1";
    const render = (value) => `# Decision\n\n## 发散候选与可证伪大纲\n\n| 角度 ID | 角度 | 来源 | 强度 |\n| --- | --- | --- | --- |\n| A-UX | 减少首次理解成本 | internal analysis | medium |\n| A-RECOVERY | 让失败可恢复 | research R-01 | high |\n\n| 候选 ID | 候选 | origin | source |\n| --- | --- | --- | --- |\n| U-1 | 增加导入说明 | user | U-002 |\n| U-2 | 增加失败提示 | user | U-002 |\n| N-1 | 保存可恢复导入草稿 | internal | A-RECOVERY |\n\n| 假设 ID | 大纲版本 | 假设 | 状态 |\n| --- | --- | --- | --- |\n| H-01 | r0 | 说明能消除失败 | falsified |\n| H-02 | r0 | 提示能支持恢复 | falsified |\n| H-03 | r0 | 一次性流程足够 | falsified |\n| H-04 | r0 | 用户会理解错误 | supported |\n| H-05 | r0 | 重试成本可接受 | unresolved |\n| H-06 | r1 | 草稿可恢复 | supported |\n| H-07 | r1 | 恢复入口可理解 | unresolved |\n| H-08 | r1 | 失败状态可见 | supported |\n\n\`\`\`json\n${JSON.stringify(value)}\n\`\`\`\n`;
    expect(deriveDecisionDivergenceOutline(render(binding), { outlineVersion: "outline-v1" })).toMatchObject({
      status: "passed", novel_candidate_ids: ["N-1"], abandoned_outline_versions: ["r0"], current_outline_version: "r1",
    });
    const handlerResult = await officialStageHandler("make-decision")({
      stage: "make-decision",
      identity: { taskId: "card-07-t007" },
      manifest: { record_model: "vnext-single-write" },
      currentMaterialRevision: `revision-${"c".repeat(64)}`,
      currentMaterialScopeRevision: () => `revision-${"c".repeat(64)}`,
      snapshotWorkspace: () => ({ tree: "d".repeat(40) }),
      candidateWorkspace: { worktreeRoot: "/fixture", baselineCommit: "d".repeat(40), captureSnapshot: () => ({ tree: "d".repeat(40) }) },
      readArtifact: () => render(binding), artifactRef: () => "specs/card-07-t007/decision-log.md", recordConsumerInvocation: () => {},
    }, { receipts: {} });
    expect(handlerResult.facts.divergence_outline).toMatchObject({ status: "passed", novel_candidate_ids: ["N-1"] });
    const missingDivergence = `${render(binding).replace(/\n## 发散候选与可证伪大纲[\s\S]*$/, "\n")}\n模糊需求与原始痛点：需要真实发散。\n`;
    const missingDivergenceResult = await officialStageHandler("make-decision")({
      stage: "make-decision",
      identity: { taskId: "card-07-t007-missing-divergence" },
      manifest: { record_model: "vnext-single-write" },
      currentMaterialRevision: `revision-${"c".repeat(64)}`,
      currentMaterialScopeRevision: () => `revision-${"c".repeat(64)}`,
      snapshotWorkspace: () => ({ tree: "d".repeat(40) }),
      candidateWorkspace: { worktreeRoot: "/fixture", baselineCommit: "d".repeat(40), captureSnapshot: () => ({ tree: "d".repeat(40) }) },
      readArtifact: () => missingDivergence,
      artifactRef: () => "specs/card-07-t007-missing-divergence/decision-log.md",
      recordConsumerInvocation: () => {},
    }, { receipts: {} });
    expect(missingDivergenceResult.facts.divergence_outline).toMatchObject({ status: "incomplete", reason: "divergence_outline_missing" });
    const rewrite = structuredClone(binding);
    rewrite.candidates[2].semantic_basis = structuredClone(binding.original_candidates[0].semantic_basis);
    expect(deriveDecisionDivergenceOutline(render(rewrite))).toMatchObject({
      status: "incomplete",
      errors: expect.arrayContaining(["divergence candidate N-1 only rewrites a user direction"]),
    });
    const missingOriginal = structuredClone(binding);
    missingOriginal.candidates = missingOriginal.candidates.filter((candidate) => candidate.candidate_id !== "U-1");
    expect(deriveDecisionDivergenceOutline(render(missingOriginal))).toMatchObject({
      status: "incomplete",
      errors: expect.arrayContaining(["original candidate U-1 is missing or mismatched from candidate set"]),
    });
    const stale = structuredClone(binding);
    stale.outlines[0].status = "active";
    delete stale.outlines[0].superseded_by;
    stale.outlines[1].status = "abandoned";
    expect(deriveDecisionDivergenceOutline(render(stale))).toMatchObject({
      status: "incomplete",
      errors: expect.arrayContaining(["outline r0 has more than half falsified hypotheses and must be abandoned with superseded_by"]),
    });
    expect(deriveDecisionDivergenceOutline(render(binding), { outlineVersion: "stale-outline" })).toMatchObject({
      status: "incomplete",
      errors: expect.arrayContaining(["divergence oi_outline_version does not match the current OI outline"]),
    });
    expect(deriveDecisionDivergenceOutline("# Decision\n", { required: true })).toMatchObject({
      status: "incomplete", reason: "divergence_outline_missing",
    });
    expect(deriveDecisionDivergenceOutline("# Decision\n")).toMatchObject({
      status: "not_applicable", reason: "divergence_not_required",
    });
  });

  it("lists the four authoritative materials in every workflow", () => {
    for (const name of stages) {
      const skill = stage(name);
      for (const material of Object.keys(materials)) expect(skill, `${name}: ${material}`).toContain(material);
    }
  });

  it("derives work eligibility from current materials, not old quality facts", () => {
    const progress = deriveStageProgress("build-code", unavailableReview, materials);

    expect(progress).toMatchObject({
      work_status: "ready",
      work_authority: "current-four-materials-and-plan-tasks",
      readiness_source: "current-material-presence",
      missing_materials: [],
    });
  });

  it("keeps formal completion separate from work eligibility", () => {
    const readiness = deriveStageProgress("build-code", unavailableReview, materials);
    expect(readiness.work_status).toBe("ready");
    expect(readiness).not.toHaveProperty("status");
    expect(deriveStageCompletion("build-code", unavailableReview)).toMatchObject({
      status: "in_progress",
      missing: expect.arrayContaining(["integration_review"]),
    });
  });

  it("waits only for a required current material when work is not ready", () => {
    const progress = deriveStageProgress("build-code", unavailableReview, {
      ...materials,
      "tasks.md": "",
    });

    expect(progress).toMatchObject({
      work_status: "blocked_by_missing_material",
      missing_materials: ["tasks.md"],
    });
  });

  it("does not let an unavailable review become pass or stop same-task repair", () => {
    const docs = [stage("build-spec"), stage("build-plan"), stage("build-code"), stage("verify-code")];

    for (const skill of docs) {
      expect(skill).toContain("unavailable");
      expect(skill).toMatch(/same task|same-task|同一 task/i);
    }
    expect(stage("build-code")).toMatch(/`unavailable` is never `pass`/i);
    expect(stage("verify-code")).toMatch(/`unavailable` 绝不是 `pass`/i);
  });

  it("continues the same task instead of creating a replacement task", () => {
    expect(stage("build-spec")).toMatch(/does not create a new task/i);
    expect(stage("build-plan")).toMatch(/does not create a new task/i);
    expect(stage("build-code")).toMatch(/never require a new task/i);
    expect(stage("verify-code")).toMatch(/回同一 task 修复，不新建任务/);
  });

  it("keeps Talk and Clarify batches independent while Grill batches independent frontier questions", () => {
    const talk = readFileSync(join(root, "skills", "talk-with-zhipeng", "SKILL.md"), "utf8");
    const grill = readFileSync(join(root, "skills", "grill-with-docs", "SKILL.md"), "utf8");
    expect(talk).toMatch(/Talk 的 `ask\.questions` 可以是一组问题/);
    expect(grill).toMatch(/batch only when the remaining frontier questions are independent/i);
    expect(grill).toMatch(/绝不调用 wh-review、生成 review finding 或写 review fact/);
    expect(grill).toMatch(/允许是部分答案/);
    expect(grill).not.toMatch(/Ask the questions one at a time/);

    const batch = {
      interaction_type: "grill",
      events: [
        { event: "ask", card_ref: "card", card_hash: "a".repeat(64), round: 1, questions: [
          { question_id: "a", frontier_id: "a", independent: true, options: [
            { number: 1, label: "保守", meaning: "少做", consequence: "范围小", risk: "收益慢" },
            { number: 2, label: "推荐", meaning: "直接做", consequence: "解决问题", risk: "改动较多" },
          ], recommended_option: 2, recommendation_reason: "当前事实支持" },
          { question_id: "b", frontier_id: "b", independent: true, options: [
            { number: 1, label: "保守", meaning: "少做", consequence: "范围小", risk: "收益慢" },
            { number: 2, label: "推荐", meaning: "直接做", consequence: "解决问题", risk: "改动较多" },
          ], recommended_option: 2, recommendation_reason: "当前事实支持" },
        ] },
        { event: "wait", card_ref: "card", card_hash: "a".repeat(64), round: 1, status: "waiting-for-user" },
        { event: "reply", card_ref: "card", card_hash: "a".repeat(64), round: 1, source: "user", reply_ref: "reply", reply_hash: "b".repeat(64), answers: [{ frontier_id: "a", answer: "保留", number: 1 }], remaining_frontier_ids: ["b"], re_ranked: true },
        { event: "resume", card_ref: "card", card_hash: "a".repeat(64), round: 1, reply_ref: "reply", reply_hash: "b".repeat(64), status: "resumed" },
      ],
    };
    expect(validateInteractionLifecycleContract(batch)).toMatchObject({ ok: true });
    batch.events[0].questions[1].independent = false;
    expect(validateInteractionLifecycleContract(batch)).toMatchObject({ ok: false });
  });
});
