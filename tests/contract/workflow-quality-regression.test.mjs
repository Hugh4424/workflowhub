import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const json = (file) => JSON.parse(read(file));

const THREADS = {
  "US-04": "019ff138-2754-7691-9660-1d348b3abb0d",
  "PaperBuilder": "019ff12f-cba4-7c51-bee0-76b8d764c837",
  "M15": "019ff133-51fa-7250-b31a-2a9b2e9bf8d6",
};
const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const SOURCE_GROUPS = ["SRC-01", "SRC-02", "SRC-03", "SRC-04", "SRC-05", "SRC-06", "SRC-07", "SRC-08", "SRC-09", "SRC-10", "SRC-11", "SRC-12"];
const ALLOWED_INCOMPLETE = new Set(["partial", "unknown", "incomplete", "unavailable", "deferred"]);
const HISTORICAL_SEMANTICS = {
  "US-04": ["评分/边界仍后补", "131/131", "integration 证据有缺口", "AC-002/012 unknown"],
  PaperBuilder: ["先完整盘点已有能力", "机械多策略/批次探索", "目标停止 oracle"],
  M15: ["step/skill 与 UI 范围未前置冻结", "UI 多轮返工", "真实 E2E/正式质量未完成"],
};

describe("workflow quality regression and historical replay", () => {
  it("keeps the three live thread bindings explicit and hash-unavailable", () => {
    const decision = read("specs/workflowhub-delivery-flow-quality-v1/decision-log.md");
    expect(Object.keys(THREADS)).toHaveLength(3);
    for (const [task, id] of Object.entries(THREADS)) {
      expect(decision, task).toContain(id);
      expect(decision).toMatch(new RegExp(`${id}[\\s\\S]{0,500}unavailable`));
    }
    expect(decision).toContain("canonical content hash");
    expect(decision).toContain("精确 token 分布 unavailable");
  });

  it("keeps every historical task replayable across five stages and seven audit questions", () => {
    const decision = read("specs/workflowhub-delivery-flow-quality-v1/decision-log.md");
    for (const task of Object.keys(THREADS)) {
      expect(decision).toContain(`| ${task} |`);
      for (const stage of STAGES) expect(decision, `${task}/${stage}`).toContain(stage);
    }
    for (const dimension of ["1 标准流程", "2 步骤遗漏", "3 阻塞问题", "4 交付/review", "5 根因", "6 时间/token", "7 原始需求"]) {
      expect(decision, dimension).toContain(dimension);
    }
    expect(decision).toContain("| 审计问题 |");
    for (const group of SOURCE_GROUPS) expect(decision).toContain(`| ${group} |`);
    expect(decision).toContain("R-001～R-097");
    expect(decision).toContain("D-001～D-016");
    expect(decision).toContain("编号连续只作机械检查，不再冒充语义覆盖");
    for (const [task, semanticMarkers] of Object.entries(HISTORICAL_SEMANTICS)) {
      for (const marker of semanticMarkers) expect(decision, `${task}/${marker}`).toContain(marker);
    }
  });

  it("requires the standard document to describe each stage as an executable semantic contract", () => {
    const standard = read("docs/standard-workflow.md");
    for (const stage of STAGES) {
      expect(standard, stage).toContain(stage);
      expect(standard).toMatch(new RegExp(`${stage}[\\s\\S]{0,2500}(输入|input)[\\s\\S]{0,2500}(步骤|step)[\\s\\S]{0,2500}(产物|artifact)`));
    }
    for (const term of ["完成与失败边界", "下游交接", "实际语义", "stage-end-spec-analyze", "六项大白话摘要"]) {
      expect(standard).toContain(term);
    }
  });

  it("requires all five workflow manifests to wire the same end-of-stage analyzer", () => {
    for (const stage of STAGES) {
      const manifest = json(`workflows/${stage}/steps.json`);
      expect(manifest.stage_slug).toBe(stage);
      const analyzer = manifest.steps.find((step) => ["stage-end-spec-analyze", "final-spec-analyze"].includes(step.step_slug));
      expect(analyzer, `${stage}: analyzer step`).toBeTruthy();
      expect(analyzer.observable_result).toMatch(/checks|检查|evidence|证据/i);
      expect(analyzer.completion_evidence.some((item) => item.kind === "stage_outcome")).toBe(true);
    }
  });

  it("keeps mini-task and bundle governance connected to real consumers", () => {
    const catalog = read("skills/catalog.yaml");
    const registry = read("skills/reuse-registry.md");
    const mini = json("skills/mini-task/skill-bundle.json");
    expect(catalog).toContain("name: mini-task");
    expect(registry).toContain("`mini-task`");
    expect(mini.skill).toBe("mini-task");
    for (const file of mini.files) expect(fs.existsSync(path.join(root, typeof file === "string" ? `skills/mini-task/${file}` : `skills/mini-task/${file.path}`))).toBe(true);
    expect(read("docs/architecture/move-map.json")).toContain("schema_version");
    expect(read("tests/contract/repository-governance.test.mjs")).toContain("historical move map");
  });

  it("does not treat a green aggregate or fewer calls as semantic coverage", () => {
    const fixture = json("tests/fixtures/workflow-quality-cost-sample.json");
    expect(fixture.sample_id).toBe("WH-DELIVERY-FLOW-COST-001");
    expect(fixture.baseline.input_hash).toBe(fixture.input_hash);
    expect(fixture.candidate.input_hash).toBe(fixture.input_hash);
    expect(fixture.baseline.case_set_hash).toBe(fixture.case_set_hash);
    expect(fixture.candidate.case_set_hash).toBe(fixture.case_set_hash);
    expect(fixture.baseline.metrics.tokens.status).toBe("unavailable");
    expect(fixture.candidate.metrics.tokens.status).toBe("unavailable");
    expect(fixture.comparison.status).toBe("observation_only");
    for (const field of ["same_input_hash", "same_case_set_hash", "quality_preserved", "requirement_coverage_preserved", "step_coverage_preserved", "review_provenance_preserved"]) {
      expect(fixture.comparison[field], field).toBe(true);
    }
    expect(fixture.comparison.token_delta).toBe("unavailable");
    expect(fixture.comparison.do_not_claim).toEqual(expect.arrayContaining(["fixed token savings", "perfect historical replay"]));
  });

  it("keeps missing historical facts truthful instead of inventing a replay", () => {
    const decision = read("specs/workflowhub-delivery-flow-quality-v1/decision-log.md");
    expect(decision).toContain("integration 证据有缺口");
    expect(decision).toContain("逐原始需求最终验收链不完整");
    expect(decision).toContain("真实 E2E/正式质量未完成");
    expect([...ALLOWED_INCOMPLETE].some((status) => decision.includes(status))).toBe(true);
    expect(decision).not.toMatch(/三个 thread[^\n]*(?:完美实现|perfect|verified complete)/i);
  });
});
