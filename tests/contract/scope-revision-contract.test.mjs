import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { validateScopeRevisionMaterial } from "../../runtime/review/scope-revision-contract.mjs";
import { buildReviewMaterials, reviewInstructionsFor } from "../../skills/wh-review/scripts/review-materials.mjs";

const roots = [];

function valid() {
  const currentMaterial = (path, excerpt) => ({ path, source_sha256: "a".repeat(64), source_bytes: 128, excerpt });
  return {
    schema_version: "workflowhub-scope-revision.v1",
    revision_id: "SR-build-code-001",
    trigger_stage: "build-code",
    return_stage: "build-code",
    request: {
      original_request: "补充中途发现的失败边界",
      why_now: "verify-code 发现原 AC 没写清",
      core_goal_relation: "仍服务当前任务的证据完整性目标",
      decision: "同 task 更新四份材料后回受影响阶段",
      rationale: "避免完整五阶段回退，同时保留影响分析",
      risks: ["旧证据变 stale"],
    },
    communication: {
      performed_by: "main-agent",
      talk: "主代理向用户说明保留同 task 的选项和后果",
      clarify: "主代理确认新增需求是否改变核心目标",
      grill: "主代理检查四份材料、风险和宪法边界",
      user_response: "用户要求按轻量 scope_revision 继续",
    },
    affected_ids: {
      requirement_ids: ["R19"],
      decision_ids: ["D44"],
      fr_ids: ["FR-021"],
      acceptance_ids: ["AC-024"],
      task_ids: ["T018"],
    },
    impacts: {
      user_flow: "用户看到新的失败边界说明",
      data_state: "材料 revision 变化，旧事实 stale",
      success_failure: "失败仍返回 unknown，不冒充 pass",
      implementation: "复用现有 review route",
      tests: "只跑 scope contract focused test",
      review: "一次专用 scope_revision review",
      delivery: "回到受影响的 build-code/verify-code",
    },
    material_changes: {
      decision_log: { file: "decision-log.md", change: "新增 D44", reason: "记录临时需求" },
      spec: { file: "spec.md", change: "新增 FR-021/AC-024", reason: "锁定合同" },
      plan: { file: "plan.md", change: "新增 T018 依赖", reason: "可执行化" },
      tasks: { file: "tasks.md", change: "新增 scope revision task", reason: "绑定验证" },
    },
    consumer_coverage: {
      decision_log: { status: "updated", reason: "新增临时需求和决策来源" },
      spec: { status: "updated", reason: "新增 FR/AC 和边界" },
      plan: { status: "updated", reason: "新增实现和验证传播" },
      tasks: { status: "updated", reason: "新增任务和回退阶段" },
      acceptance: { status: "updated", reason: "新增验收判据" },
      implementation: { status: "updated", reason: "受影响的 build-code 流程" },
      tests: { status: "updated", reason: "增加 scope_revision 负测" },
      review: { status: "updated", reason: "使用专用一次性审查合同" },
      delivery: { status: "unchanged", reason: "仍由现有 verify/close 边界负责" },
    },
    current_materials: {
      decision_log: currentMaterial("decision-log.md", "# decision-log\nD44"),
      spec: currentMaterial("spec.md", "# spec\nFR-021"),
      plan: currentMaterial("plan.md", "# plan\nT018"),
      tasks: currentMaterial("tasks.md", "# tasks\nT018"),
    },
    non_goals_deferred: ["不实现外部业务页面"],
    constitutional_checks: ["同 task", "不新增 provider/config", "review 不是 gate"],
  };
}

describe("scope revision review contract", () => {
  afterEach(() => {
    while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
  });

  it("requires all four materials and whole-task impact analysis", () => {
    expect(validateScopeRevisionMaterial(valid(), { stage: "build-code" })).toMatchObject({
      revision_id: "SR-build-code-001",
      trigger_stage: "build-code",
    });
  });

  it("rejects missing material impact and forbidden gate selection", () => {
    const missing = valid();
    delete missing.material_changes.tasks;
    expect(() => validateScopeRevisionMaterial(missing, { stage: "build-code" })).toThrow(/material_changes\.tasks/);

    const forbidden = valid();
    forbidden.gate = "must-pass";
    expect(() => validateScopeRevisionMaterial(forbidden, { stage: "build-code" })).toThrow(/cannot select gate/);

    const missingConsumer = valid();
    delete missingConsumer.consumer_coverage.tests;
    expect(() => validateScopeRevisionMaterial(missingConsumer, { stage: "build-code" })).toThrow(/consumer_coverage\.tests/);

    const delegatedCommunication = valid();
    delegatedCommunication.communication.performed_by = "subagent";
    expect(() => validateScopeRevisionMaterial(delegatedCommunication, { stage: "build-code" })).toThrow(/main-agent/);

    const unchangedMaterial = valid();
    unchangedMaterial.consumer_coverage.plan.status = "unchanged";
    expect(() => validateScopeRevisionMaterial(unchangedMaterial, { stage: "build-code" })).toThrow(/consumer_coverage\.plan/);

    const oversized = valid();
    oversized.current_materials.tasks.excerpt = "x".repeat(24 * 1024 + 1);
    expect(() => validateScopeRevisionMaterial(oversized, { stage: "build-code" })).toThrow(/excerpt exceeds/);
  });

  it("uses a dedicated prompt and only permits one initial review", () => {
    const prompt = reviewInstructionsFor("verify-code", null, false, "initial", null, "scope_revision");
    expect(prompt).toMatch(/temporary mid-task requirement change/);
    expect(prompt).toMatch(/Do not judge whether code already passes/);
    expect(() => reviewInstructionsFor("verify-code", null, false, "incremental", null, "scope_revision")).toThrow(/cannot use incremental/);
  });

  it("builds a provider packet from only the four current materials", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-scope-revision-packet-"));
    roots.push(root);
    const material = valid();
    const source = { snapshotTree: "a".repeat(40), diffBytes: 0, changedFiles: [] };
    const bundle = buildReviewMaterials({
      reviewDataRoot: root,
      attachmentRoot: root,
      source,
      task: {},
      taskId: "scope-revision-contract",
      stage: "build-code",
      reviewScope: "integration",
      materials: {
        scope_revision: material,
        review_instructions: reviewInstructionsFor("build-code", null, false, "initial", null, "scope_revision"),
      },
    });
    expect(bundle.files).toContain("requirements/scope-revision.json");
    expect(readFileSync(join(bundle.bundleRoot, "requirements/scope-revision/decision_log.md"), "utf8")).toContain("D44");
    expect(JSON.parse(readFileSync(join(bundle.bundleRoot, "requirements/scope-revision.json"), "utf8")).current_materials.tasks.source_sha256).toBe("a".repeat(64));
    expect(bundle.packetPlan.delivery_bytes).toBeLessThan(330 * 1024);
    expect(readFileSync(join(bundle.bundleRoot, "contracts/scope-revision.md"), "utf8")).toContain("temporary mid-task");
  });
});
