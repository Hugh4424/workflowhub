import { describe, expect, it } from "vitest";
import { acceptanceCoverageFacts } from "./stage-handlers.mjs";

// CARD-04 / P4 / T006 — acceptanceChain 真实事实接回（D-001/D-003/D-004）。
// 首个 runtime/ 就近共置单测（CLARIFY-BP-001 甲裁定）。
// 本文件由 build-plan 预置并冻结，实现者只读。
// RED 证据：buildPostAcceptanceChainRows 未导出时，首条 typeof 断言失败
// （动态 import 保证这是断言失败而非 collection error）。

const SPEC_FIXTURE = [
  "# 功能规格：夹具",
  "",
  "## 来源与决策映射",
  "",
  "| 来源 | 决策 | 结果需求 | 验收标准 |",
  "|------|------|----------|----------|",
  "| R-001（用户原话） | D-001 只接回真实事实 | FR-16、FR-17 | AC-16、AC-17 |",
  "| R-002（呈现失真） | D-003 三样落点复用已有载体 | FR-18 | AC-18 |",
  "",
  "## 5. 功能需求",
  "",
  "- **FR-16**：验收标准可执行形式。",
  "- **FR-17**：oracle 与实现分离。",
  "- **FR-18**：有效 RED 必要条件。",
  "",
].join("\n");

const DECISION_LOG_FIXTURE = [
  "# 决策日志",
  "",
  "### D-001 — 只接回真实事实",
  "",
  "决策内容一。",
  "",
  "### D-003 — 三样落点复用已有载体",
  "",
  "决策内容三。",
  "",
].join("\n");

const BOUND_EVIDENCE_REFS = [
  { ref: "decision-log", kind: "decision-log", status: "fresh", hash: "a".repeat(64), snapshot_tree: "t".repeat(40) },
  { ref: "spec", kind: "spec", status: "fresh", hash: "b".repeat(64), snapshot_tree: "t".repeat(40) },
  { ref: "ac-trace", kind: "ac-trace", status: "fresh", hash: "c".repeat(64), snapshot_tree: "t".repeat(40) },
];

const ROWS = [
  { acceptance_criterion_id: "AC-16", scenario: "场景一", actual_outcome: "结果一", coverage_limits: "" },
  { acceptance_criterion_id: "AC-18", scenario: "场景二", actual_outcome: "结果二", coverage_limits: "" },
  { acceptance_criterion_id: "AC-99", scenario: "未映射场景", actual_outcome: "", coverage_limits: "" },
];

const BASE_INPUT = {
  spec: SPEC_FIXTURE,
  decisionLog: DECISION_LOG_FIXTURE,
  boundEvidenceRefs: BOUND_EVIDENCE_REFS,
  materialRevision: "rev-1",
  snapshotTree: "t".repeat(40),
  taskId: "card-04-fixture",
  tests: null,
};

async function loadBuilder() {
  const mod = await import("./stage-runner.mjs");
  return mod.buildPostAcceptanceChainRows;
}

const disclosureText = (value) => (Array.isArray(value) ? value.join("\n") : String(value ?? ""));

describe("buildPostAcceptanceChainRows（acceptanceChain 真实事实接回）", () => {
  it("exports a callable builder from stage-runner.mjs", async () => {
    const build = await loadBuilder();
    expect(typeof build).toBe("function");
  });

  it("fills source_ids / decision_ids / fr_ids from the spec source-decision mapping table", async () => {
    const build = await loadBuilder();
    const out = build({ ...BASE_INPUT, rows: ROWS.slice(0, 2) });
    const ac16 = out.find((row) => row.acceptance_criterion_id === "AC-16");
    const ac18 = out.find((row) => row.acceptance_criterion_id === "AC-18");
    expect(ac16.source_ids).toEqual([]);
    expect(disclosureText(ac16.coverage_limits)).toMatch(/R-001.*(?:未认证|未写入 source_ids)/);
    expect(ac16.decision_ids).toEqual(["D-001"]);
    expect(ac16.fr_ids).toEqual(["FR-16", "FR-17"]);
    expect(ac18.source_ids).toEqual([]);
    expect(disclosureText(ac18.coverage_limits)).toMatch(/R-002.*(?:未认证|未写入 source_ids)/);
    expect(ac18.decision_ids).toEqual(["D-003"]);
    expect(ac18.fr_ids).toEqual(["FR-18"]);
    // 既有行字段与身份字段保持透传。
    expect(ac16.scenario).toBe("场景一");
    expect(ac16.task_id).toBe("card-04-fixture");
    expect(ac16.producer_stage).toBe("build-code");
  });

  it("wires evidence_refs to the real bound evidence (ref + sha256 hash)", async () => {
    const build = await loadBuilder();
    const out = build({ ...BASE_INPUT, rows: ROWS.slice(0, 1) });
    const refs = out[0].evidence_refs;
    expect(Array.isArray(refs)).toBe(true);
    expect(refs.length).toBeGreaterThan(0);
    for (const entry of refs) {
      expect(typeof entry.ref).toBe("string");
      expect(entry.hash).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(refs.map((entry) => entry.ref)).toEqual(expect.arrayContaining(["decision-log", "spec", "ac-trace"]));
  });

  it("never leaves coverage_limits empty and discloses the CARD-05 placeholders", async () => {
    const build = await loadBuilder();
    const out = build({ ...BASE_INPUT, rows: ROWS.slice(0, 2) });
    for (const row of out) {
      const text = disclosureText(row.coverage_limits);
      expect(text.length).toBeGreaterThan(0);
      expect(text).toMatch(/CARD-05/);
    }
  });

  it("negative control: unmapped AC keeps empty ids and gains a disclosure instead of fabricating", async () => {
    const build = await loadBuilder();
    const out = build({ ...BASE_INPUT, rows: ROWS.slice(2) });
    const ac99 = out[0];
    expect(ac99.acceptance_criterion_id).toBe("AC-99");
    expect(ac99.source_ids).toEqual([]);
    expect(ac99.decision_ids).toEqual([]);
    expect(ac99.fr_ids).toEqual([]);
    expect(disclosureText(ac99.coverage_limits)).toMatch(/AC-99/);
  });
});

describe("build-code coverage limits through handler and acceptance chain", () => {
  const snapshotTree = "t".repeat(40);
  const evidenceRef = "quality/evidence/p4-coverage.json";
  const evidenceHash = "a".repeat(64);
  const worker = {
    manifest: { record_model: "vnext-single-write" },
    readArtifact: () => "### AC-99 — explicit limits",
    readReceipt: () => ({ sha256: evidenceHash }),
  };
  const covered = (coverage_limits) => ({
    acceptance_coverage: {
      snapshot_tree: snapshotTree,
      accepted_criterion_ids: ["AC-99"],
      items: [{
        acceptance_criterion_id: "AC-99", status: "covered",
        evidence_refs: [{ ref: evidenceRef, sha256: evidenceHash }],
        scenario: "old documentation refers to retired files",
        oracle: "current index and reader agree",
        actual_outcome: "current Phase files are named",
        coverage_limits,
        implementation_anchor: { id: "impl", path: "runtime/task/material-workspace.mjs", start_line: 1, end_line: 2, role: "implementation" },
        verification_anchor: { id: "verify", path: "tests/contract/materials.test.mjs", start_line: 1, end_line: 2, role: "verification" },
      }],
    },
  });

  it("keeps each existing array limit through the real handler projection", async () => {
    const coverage = acceptanceCoverageFacts(worker, covered(["first missing boundary", "second unverified behavior"]), snapshotTree);
    expect(coverage.items[0].status).toBe("covered");
    const build = await loadBuilder();
    const [row] = build({ ...BASE_INPUT, rows: coverage.items });
    expect(row.coverage_limits).toContain("first missing boundary");
    expect(row.coverage_limits).toContain("second unverified behavior");
  });

  it("rejects malformed array limits rather than treating them as covered", () => {
    const coverage = acceptanceCoverageFacts(worker, covered(["first missing boundary", 7]), snapshotTree);
    expect(coverage.items[0].status).toBe("unknown");
    expect(coverage.items[0].semantic_gap).toContain("coverage_limits");
  });
});
