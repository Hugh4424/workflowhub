import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

let validateDecisionEntry;
let validateDecisionLogContract;
let validateDecisionCorrectionAppendix;
let buildDecisionCorrectionAppendix;
let buildDecisionCoverageAudit;
let validateDecisionLogStepUpdateContract;
let moduleLoadError;

beforeAll(async () => {
  try {
    ({
      validateDecisionEntry,
      validateDecisionLogContract,
      validateDecisionCorrectionAppendix,
      buildDecisionCorrectionAppendix,
      buildDecisionCoverageAudit,
      validateDecisionLogStepUpdateContract,
    } = await import("../runtime/stage/stage-content-contracts.mjs"));
  } catch (error) {
    moduleLoadError = error;
  }
});

function requireApi() {
  expect(
    moduleLoadError,
    "runtime/stage/stage-content-contracts.mjs must provide the accepted decision validators",
  ).toBeUndefined();
  expect(validateDecisionEntry).toBeTypeOf("function");
  expect(validateDecisionLogContract).toBeTypeOf("function");
  expect(validateDecisionCorrectionAppendix).toBeTypeOf("function");
  expect(buildDecisionCorrectionAppendix).toBeTypeOf("function");
  expect(buildDecisionCoverageAudit).toBeTypeOf("function");
  expect(validateDecisionLogStepUpdateContract).toBeTypeOf("function");
}

function decisionEntry(overrides = {}) {
  return {
    question: "以后遇到遗漏时怎么处理？",
    selected_option: "先展示遗漏，再等用户选择",
    recommendation_status: "recommended_and_selected",
    recommendation_reason: "用户能在最终确认前看见实际影响。",
    plain_language_meaning: "系统不能悄悄忽略问题。",
    source_type: "user_reply",
    source_exact_excerpt: "A",
    approval_status: "approved",
    approval_ref: "host-message://reply/1",
    approval_hash: HASH_A,
    facts_and_constraints: ["最终确认前必须做覆盖检查。"],
    logic: "先发现并展示，才能形成真实选择。",
    choice_reason: "避免代理替用户决定。",
    impact: ["make-decision"],
    consequences: ["遗漏会阻止最终确认，直到用户处理。"],
    risks: ["问题较多时会增加一次交互。"],
    rejected_alternatives: [{
      option: "静默忽略",
      reason: "用户无法知道哪些需求没被覆盖。",
    }],
    unresolved: [],
    supersedes: [],
    ...overrides,
  };
}

function sourceItem(overrides = {}) {
  return {
    source_item_ref: "source://requirement/1",
    source_item_hash: HASH_B,
    ...overrides,
  };
}

function completeMain(entry = decisionEntry()) {
  const markdown = [
    "# Decision Log",
    "## 原始需求",
    "不得静默遗漏用户要求。",
    "## 目标",
    "最终确认前完成覆盖检查。",
    "## 范围",
    "make-decision。",
    "## 非目标",
    "不改变 review verdict。",
    "## 决定",
    JSON.stringify(entry),
    "## 动态 Talk 批次",
    "每个动态批次均有当前 OI 队列和结束结论。",
    "## 调研",
    "本决定无需新增调研。",
    "## grill",
    "四项 exit checks 已完成。",
    "## 审查处置",
    "finding 均有明确处置。",
    "## 最终确认",
    "等待真实用户回复。",
    "## 拒绝方案",
    "拒绝静默忽略。",
    "## 风险",
    "可能增加一次交互。",
    "## 未决项",
    "无。",
    "## Supersedes",
    "无。",
    "## 文档结果",
    "decision-log.md。",
    "## Exit checks",
    "完整。",
  ].join("\n");
  return {
    ref: "artifacts/decision-log.md",
    hash: sha256(markdown),
    markdown,
    entries: [entry],
  };
}

function completeContract(overrides = {}) {
  const entry = decisionEntry();
  const main = completeMain(entry);
  const item = sourceItem();
  return {
    main,
    appendices: [],
    coverage: {
      decision_log_ref: main.ref,
      decision_log_hash: main.hash,
      items: [{
        ...item,
        coverage_status: "covered",
        decision_location: {
          kind: "main",
          ref: main.ref,
          entry_index: 0,
        },
      }],
      summary: { covered: 1, accepted_omission: 0, missing: 0 },
    },
    interaction: {
      selections: [{
        ...item,
        card_hash: "c".repeat(64),
        selected_option: entry.selected_option,
        reply_ref: entry.approval_ref,
        reply_hash: entry.approval_hash,
      }],
    },
    detail_review_packet: {
      candidate_tree: "d".repeat(40),
      decision_log: {
        ref: main.ref,
        hash: main.hash,
        complete_bytes: markdownBytes(main.markdown),
      },
    },
    ...overrides,
  };
}

function markdownBytes(value) {
  return Buffer.from(value, "utf8").toString("base64");
}

function expectRejected(result, pattern) {
  expect(result).toMatchObject({ ok: false });
  expect(result.errors.join("\n")).toMatch(pattern);
}

describe("decision-entry.v1 is the only load-bearing decision shape", () => {
  it("accepts one complete plain-language entry", () => {
    requireApi();
    expect(validateDecisionEntry(decisionEntry())).toMatchObject({ ok: true, errors: [] });
  });

  it.each([
    "source_type",
    "source_exact_excerpt",
    "approval_status",
    "approval_ref",
    "approval_hash",
    "recommendation_status",
    "recommendation_reason",
    "plain_language_meaning",
    "consequences",
    "risks",
  ])("rejects an entry missing %s", (field) => {
    requireApi();
    const value = decisionEntry();
    delete value[field];
    expectRejected(validateDecisionEntry(value), new RegExp(field));
  });
});

describe("accepted decision coverage is exact and hash-bound", () => {
  it("accepts a complete main document with one source covered exactly once", () => {
    requireApi();
    expect(validateDecisionLogContract(completeContract())).toMatchObject({
      ok: true,
      errors: [],
    });
  });

  it("rejects the same source mapped twice", () => {
    requireApi();
    const input = completeContract();
    input.coverage.items.push(structuredClone(input.coverage.items[0]));
    expectRejected(validateDecisionLogContract(input), /duplicate|twice|exactly once|重复|恰好一次/i);
  });

  it("rejects a source, main document, or interaction binding with the wrong hash", () => {
    requireApi();
    for (const mutate of [
      (input) => { input.coverage.items[0].source_item_hash = "f".repeat(64); },
      (input) => { input.coverage.decision_log_hash = "f".repeat(64); },
      (input) => { input.interaction.selections[0].reply_hash = "f".repeat(64); },
    ]) {
      const input = completeContract();
      mutate(input);
      expectRejected(validateDecisionLogContract(input), /hash|binding|绑定/i);
    }
  });

  it("rejects a compressed detail-review summary in place of complete bytes", () => {
    requireApi();
    const input = completeContract();
    input.detail_review_packet.decision_log = {
      ref: input.main.ref,
      hash: input.main.hash,
      summary: "用户已确认。",
    };
    expectRejected(validateDecisionLogContract(input), /detail|complete|bytes|完整|摘要/i);
  });

  it("rejects review risk acceptance used as a decision omission appendix", () => {
    requireApi();
    const input = completeContract();
    input.appendices.push({
      kind: "risk-acceptance.v1",
      ref: `quality/evidence/risk-acceptances/${"f".repeat(64)}.json`,
      hash: "f".repeat(64),
      decision_entry: decisionEntry(),
    });
    input.coverage.items[0].coverage_status = "accepted_omission";
    input.coverage.items[0].decision_location = {
      kind: "appendix",
      ref: `quality/evidence/risk-acceptances/${"f".repeat(64)}.json`,
      entry_index: 0,
    };
    input.coverage.summary = { covered: 0, accepted_omission: 1, missing: 0 };
    expectRejected(validateDecisionLogContract(input), /risk-acceptance|omission|schema|专用/i);
  });
});

function auditedCoverageInput() {
  const item = {
    source_item_ref: "source://requirement/coverage-1",
    source_item_hash: HASH_B,
    source_anchor: "decision-log.md#L24",
    exact_excerpt: "The system must preserve every source requirement.",
    requirement_strength: "must",
  };
  return {
    decisionLogRef: "artifacts/decision-log.md",
    decisionLogHash: HASH_A,
    sourceItems: [item],
    mappings: [{
      source_item_ref: item.source_item_ref,
      source_item_hash: item.source_item_hash,
      coverage_status: "covered",
      disposition: "covered",
      decision_location: { kind: "main", ref: "artifacts/decision-log.md", entry_index: 0 },
    }],
    declared_counts: { source_items: 1, covered: 1, accepted_omission: 0, missing: 0 },
  };
}

describe("T005 decision coverage and authority RED contract", () => {
  it.each([
    ["source anchor", (input) => { delete input.sourceItems[0].source_anchor; }, "missing_source_anchor"],
    ["explicit disposition", (input) => { delete input.mappings[0].disposition; }, "missing_disposition"],
    ["requirement strength", (input) => { input.sourceItems[0].requirement_strength = "should"; }, "requirement_strength_weakened"],
    ["accepted omission owner/reason", (input) => {
      input.mappings[0].coverage_status = "accepted_omission";
      input.mappings[0].disposition = "accepted_omission";
      input.declared_counts = { source_items: 1, covered: 0, accepted_omission: 1, missing: 0 };
    }, "accepted_omission_missing_owner_or_reason"],
    ["declared count closure", (input) => { input.declared_counts.covered = 2; }, "declared_counts_do_not_close"],
  ])("rejects %s with an item id and source position", (_label, mutate, expectedCode) => {
    requireApi();
    const input = auditedCoverageInput();
    mutate(input);
    const audit = buildDecisionCoverageAudit(input);
    expect(audit).toMatchObject({ status: "incomplete" });
    expect(audit.failures).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: expectedCode, source_item_ref: "source://requirement/coverage-1" }),
    ]));
  });

  it("reports duplicate stable IDs and limited four-class authority samples without claiming a global result", () => {
    requireApi();
    const input = auditedCoverageInput();
    input.known_inventory = {
      stable_ids: [
        { id: "FR-COVER-001", authority_file: "spec.md", position: "spec.md#L1" },
        { id: "FR-COVER-001", authority_file: "plan.md", position: "plan.md#L2" },
      ],
      fact_samples: [
        { fact_type: "product_goal", sample: "preserve every source requirement", authority_file: "spec.md", conclusion: "one owner", evidence: "spec.md#L1" },
        { fact_type: "user_flow", sample: "confirmation remains available", authority_file: "plan.md", conclusion: "one owner", evidence: "plan.md#L2" },
        { fact_type: "cross_task_requirement", sample: "CARD-01 topology remains read-only", authority_file: "tasks.md", conclusion: "one owner", evidence: "tasks.md#L3" },
        { fact_type: "acceptance", sample: "coverage fact remains incomplete", authority_file: "spec.md", conclusion: "one owner", evidence: "spec.md#L4" },
      ],
    };
    const audit = buildDecisionCoverageAudit(input);
    expect(audit.authority).toMatchObject({ scope: "known_inventory", duplicate_authorities: 1 });
    expect(audit.authority.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "duplicate_stable_id", id: "FR-COVER-001", positions: ["spec.md#L1", "plan.md#L2"] }),
    ]));
    expect(audit.authority.samples).toHaveLength(4);
  });
});

describe("CF-2 append-only D1-D7 decision corrections", () => {
  function correctionAppendix() {
    return buildDecisionCorrectionAppendix({
      sourceDecisionRef: "artifacts/decision-log-original.md",
      sourceDecisionHash: "9".repeat(64),
      reason: "补足已接受决定的精确含义，不改写历史。",
      impactScope: ["make-decision", "downstream accepted lookup"],
    });
  }

  it("builds the fixed D1-D7 appendix and passes the same canonical validator", () => {
    requireApi();
    const appendix = correctionAppendix();
    expect(appendix.corrections.map(({ id }) => id)).toEqual([
      "D1", "D2", "D3", "D4", "D5", "D6", "D7",
    ]);
    expect(appendix.does_not_rewrite_upstream).toBe(true);
    expect(validateDecisionCorrectionAppendix(appendix)).toEqual({ ok: true, errors: [] });
  });

  it.each(["D1", "D2", "D3", "D4", "D5", "D6", "D7"])(
    "rejects an appendix missing %s",
    (missingId) => {
      requireApi();
      const appendix = structuredClone(correctionAppendix());
      appendix.corrections = appendix.corrections.filter(({ id }) => id !== missingId);
      expectRejected(validateDecisionCorrectionAppendix(appendix), new RegExp(missingId));
    },
  );

  it("rejects an appendix that claims it may rewrite accepted upstream bytes", () => {
    requireApi();
    const appendix = structuredClone(correctionAppendix());
    appendix.does_not_rewrite_upstream = false;
    expectRejected(
      validateDecisionCorrectionAppendix(appendix),
      /does_not_rewrite_upstream|must be true|不得改写/i,
    );
  });
});

describe("make-decision step completion writes", () => {
  function stepUpdate(step_id, overrides = {}) {
    return {
      stage: "make-decision",
      step_id,
      decision_log_ref: "decision-log.md",
      decision_log_hash: HASH_A,
      writer: { owner: "make-decision", artifact: "decision-log.md", mode: "append-only" },
      coverage_disposition: "no_new_requirement",
      outcome: `step ${step_id} recorded`,
      write_status: "written",
      ...overrides,
    };
  }

  it("requires every step to append to the same decision-log binding", () => {
    requireApi();
    const result = validateDecisionLogStepUpdateContract({ updates: Array.from({ length: 12 }, (_, index) => stepUpdate(index + 1)) });
    expect(result).toMatchObject({ ok: true, facts: { step_ids: Array.from({ length: 12 }, (_, index) => index + 1) } });
  });

  it("accepts the four requirement dispositions in their document spelling", () => {
    requireApi();
    for (const coverage_disposition of ["current", "deferred", "non-goal", "evidence-only"]) {
      expect(validateDecisionLogStepUpdateContract(stepUpdate(1, { coverage_disposition })) ).toMatchObject({ ok: true });
    }
  });

  it("rejects a second log binding or a missing real writer", () => {
    requireApi();
    const updates = [stepUpdate(1), stepUpdate(2, {
      decision_log_hash: HASH_B,
      writer: { owner: "fake-writer", artifact: "decision-log.md", mode: "append-only" },
    })];
    expectRejected(validateDecisionLogStepUpdateContract({ updates }), /same decision-log ref\/hash|existing make-decision append-only writer/i);
  });

  it("keeps a write failure incomplete instead of claiming step completion", () => {
    requireApi();
    const result = validateDecisionLogStepUpdateContract(stepUpdate(1, {
      write_status: "incomplete",
      write_error: "writer refused wrong task binding",
    }));
    expect(result).toMatchObject({ ok: false, facts: { write_status: "incomplete" } });
    expect(result.errors.join("\n")).toMatch(/incomplete|failure|claim step completion/i);
  });
});
