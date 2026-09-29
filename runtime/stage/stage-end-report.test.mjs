import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

// CARD-04 / P5 / T007 — 阶段末报告事实层（D-003/D-004/D-005）。
// 本文件由 build-plan 预置；P5/T007 判决来源断言按 2026-09-28 材料窄修。
// RED 证据：行为空壳下「没做到逐条枚举 / 路线适用 / 空数组非法 / 渲染顺序 / 缺文件不抛错」
// 五组断言失败（exit 1），属目标断言失败而非 collection error。
// GREEN 信号：三个导出实现后六组断言全绿。

const MACHINE_STATUS = ["missing", "inconsistent", "incomplete", "failed", "unavailable"];

const CHAIN_ROWS = [
  {
    acceptance_criterion_id: "AC-20",
    source_ids: ["R-006"],
    decision_ids: ["D-007"],
    fr_ids: ["FR-20"],
    evidence_refs: [{ ref: "ac-trace", hash: "c".repeat(64) }],
    coverage_limits: ["只修正正式测试行一个条目"],
    task_ids: [],
    review_ref: null,
  },
  {
    acceptance_criterion_id: "AC-21",
    source_ids: [],
    decision_ids: [],
    fr_ids: [],
    evidence_refs: [],
    coverage_limits: [],
    task_ids: [],
    review_ref: null,
  },
];

const STAGE_RESULT = {
  work_status: "completed",
  quality_status: "complete",
  quality_missing: ["human_confirmation"],
  execution_outcome: "blocked_missing_receipts",
  commands: [
    {
      command: "npx vitest run runtime/stage/stage-end-report.test.mjs",
      exit_code: 0,
      output_ref: "quality/evidence/stage-quality/build-code/P5/T007-green.txt",
    },
    {
      command: "node tools/cli/stage-runtime.mjs run --action=execute --stage build-code",
      exit_code: 1,
      output_ref: "quality/evidence/stage-quality/build-code/run-failed.txt",
    },
  ],
};

const EVIDENCE_INDEX = [
  { path: "quality/evidence/stage-quality/build-code/P5/T007-green.txt", kind: "stdout" },
];

const DECLARED = {
  routes: [
    { ac: "AC-20", applicable: true },
    { ac: "AC-19", applicable: false, reason: "无样例 task，按用户最终确认第 2 条记覆盖限制" },
  ],
  limits: ["覆盖率路线未安装覆盖工具，按 N/A + reason 记录（D-007 零新依赖）"],
  exceptions: [{
    declared_by: "测试声明者",
    reason: "本测试夹具的人工例外声明；不代表 CARD04 用户批准",
    scope: "测试报告字段 <范围>",
    expires_at_phase: "P6",
    owner: "测试负责人",
    source_path: "runtime/stage/stage-end-report.test.mjs#DECLARED",
    verbatim: "原话 <仅作测试> `待核`",
  }],
};
const EXCEPTION_FIELDS = ["declared_by", "reason", "scope", "expires_at_phase", "owner", "source_path"];

const BASE_INPUT = {
  chainRows: CHAIN_ROWS,
  stageResult: STAGE_RESULT,
  evidenceIndex: EVIDENCE_INDEX,
  declared: DECLARED,
};

async function loadReport() {
  const mod = await import("./stage-end-report.mjs");
  return {
    build: mod.buildStageEndReportFacts,
    render: mod.renderStageEndReport,
    collect: mod.collectStageEndReportFacts,
  };
}

describe("stage-end-report（阶段末报告事实层）", () => {
  it("exports buildStageEndReportFacts / renderStageEndReport / collectStageEndReportFacts", async () => {
    const { build, render, collect } = await loadReport();
    expect(typeof build).toBe("function");
    expect(typeof render).toBe("function");
    expect(typeof collect).toBe("function");
  });

  it("enumerates not_done item by item with machine status, reason and source", async () => {
    const { build } = await loadReport();
    expect(typeof build).toBe("function");
    const facts = build(BASE_INPUT);
    const statuses = facts.not_done.map((entry) => entry.status);
    expect(statuses.length).toBeGreaterThan(0);
    for (const status of statuses) expect(MACHINE_STATUS).toContain(status);
    const missingItems = facts.not_done.filter((entry) => entry.item === "human_confirmation");
    expect(missingItems.map((entry) => entry.status)).toEqual(["missing"]);
    const ac21 = facts.not_done.filter((entry) => entry.item === "AC-21").map((entry) => entry.status);
    expect(ac21).toContain("incomplete");
    expect(ac21).toContain("inconsistent");
    const failed = facts.not_done.filter((entry) => entry.status === "failed");
    expect(failed.length).toBeGreaterThan(0);
    expect(failed[0].source).toContain("run-failed.txt");
    for (const entry of facts.not_done) {
      expect(typeof entry.reason).toBe("string");
      expect(entry.reason.length).toBeGreaterThan(0);
      expect(typeof entry.source).toBe("string");
      expect(entry.source.length).toBeGreaterThan(0);
    }
  });

  it("emits per-AC route applicability with reason and recorded hard requirements", async () => {
    const { build } = await loadReport();
    expect(typeof build).toBe("function");
    const facts = build(BASE_INPUT);
    const ac20 = facts.route_applicability.find((entry) => entry.ac === "AC-20");
    expect(ac20.applicable).toBe(true);
    expect(ac20.hard_requirements).toEqual({ command: true, exit: true, output: true });
    const ac19 = facts.route_applicability.find((entry) => entry.ac === "AC-19");
    expect(ac19.applicable).toBe(false);
    expect(ac19.reason.length).toBeGreaterThan(0);
  });

  it("records empty exceptions as missing and never mixes machine status into real declarations", async () => {
    const { build } = await loadReport();
    expect(typeof build).toBe("function");
    const facts = build({ ...BASE_INPUT, declared: { ...DECLARED, limits: [], exceptions: [] } });
    expect(facts.coverage_limits.length).toBeGreaterThan(0);
    expect(facts.exceptions).toEqual([]);
    expect(facts.not_done).toContainEqual(expect.objectContaining({ item: "exceptions", status: "missing" }));
    const declaredFacts = build(BASE_INPUT);
    expect(declaredFacts.exceptions).toEqual([{
      declared_by: DECLARED.exceptions[0].declared_by,
      reason: DECLARED.exceptions[0].reason,
      scope: DECLARED.exceptions[0].scope,
      expires_at_phase: DECLARED.exceptions[0].expires_at_phase,
      owner: DECLARED.exceptions[0].owner,
      source: DECLARED.exceptions[0].source_path,
      verbatim: DECLARED.exceptions[0].verbatim,
    }]);
    for (const entry of declaredFacts.exceptions) {
      expect(MACHINE_STATUS).not.toContain(entry.status);
      expect(String(entry.reason ?? "").length).toBeGreaterThan(0);
    }
  });

  it("does not invent a human exception when its declaration is absent or empty", async () => {
    const { build, render } = await loadReport();
    for (const declared of [{ routes: DECLARED.routes, limits: DECLARED.limits },
      { ...DECLARED, exceptions: [] }]) {
      const facts = build({ ...BASE_INPUT, declared });
      expect(facts.exceptions).toEqual([]);
      expect(facts.not_done).toEqual(expect.arrayContaining([
        expect.objectContaining({ item: "exceptions", status: "missing",
          source: "input.declared.exceptions" }),
      ]));
      expect(() => render(facts)).toThrow(/invalid stage-end-report-facts/);
    }
  });

  it.each([
    ["string", ["No exception was checked"]],
    ["no fields", [{}]],
    ["reason without source", [{ reason: "Fixture declaration" }]],
    ["source without reason", [{ source_path: "runtime/stage/stage-end-report.test.mjs" }]],
  ])("rejects an unbound human exception %s", async (_name, exceptions) => {
    const { build } = await loadReport();
    expect(() => build({ ...BASE_INPUT, declared: { ...DECLARED, exceptions } }))
      .toThrow(/human exception declaration/);
  });

  it.each(EXCEPTION_FIELDS.flatMap((field) => [
    [`missing ${field}`, { [field]: undefined }, field],
    [`blank ${field}`, { [field]: "  " }, field],
  ]))("rejects human exception with %s", async (_name, change, field) => {
    const { build } = await loadReport();
    const invalid = { ...DECLARED.exceptions[0], ...change };
    expect(() => build({ ...BASE_INPUT, declared: { ...DECLARED, exceptions: [invalid] } }))
      .toThrow(new RegExp(`human exception declaration.*${field}`));
  });

  it.each(["never", "P4", "P0", `P${Number.MAX_SAFE_INTEGER + 1}`])(
    "rejects invalid human exception expiry %s", async (expiry) => {
      const { build } = await loadReport();
      expect(() => build({ ...BASE_INPUT, declared: { ...DECLARED,
        exceptions: [{ ...DECLARED.exceptions[0], expires_at_phase: expiry }] } }))
        .toThrow(/human exception declaration.*expires_at_phase/);
    },
  );

  it("rejects blank verbatim and machine status, but keeps an index-unverified later phase", async () => {
    const { build } = await loadReport();
    for (const change of [{ verbatim: " " }, { status: "missing" }]) {
      expect(() => build({ ...BASE_INPUT, declared: { ...DECLARED,
        exceptions: [{ ...DECLARED.exceptions[0], ...change }] } }))
        .toThrow(/human exception declaration/);
    }
    const facts = build({ ...BASE_INPUT, declared: { ...DECLARED,
      exceptions: [{ ...DECLARED.exceptions[0], expires_at_phase: "P999" }] } });
    expect(facts.exceptions[0].expires_at_phase).toBe("P999");
  });

  it("renders a complete human exception with every field and literalized original words", async () => {
    const { build, render } = await loadReport();
    const facts = build(BASE_INPUT);
    const markdown = render(facts);
    const humanSection = markdown.split("## 人工声明\n")[1].split("\n## 来源")[0];
    for (const value of [DECLARED.exceptions[0].declared_by, DECLARED.exceptions[0].reason,
      DECLARED.exceptions[0].expires_at_phase, DECLARED.exceptions[0].owner,
      DECLARED.exceptions[0].source_path]) expect(humanSection).toContain(value);
    expect(humanSection).toContain("&lt;范围&gt;");
    expect(humanSection).toContain("&lt;仅作测试&gt;");
    expect(humanSection).not.toContain("<仅作测试>");
  });

  it.each(EXCEPTION_FIELDS.flatMap((field) => [
    [`missing ${field}`, { [field === "source_path" ? "source" : field]: undefined }, field],
    [`blank ${field}`, { [field === "source_path" ? "source" : field]: "  " }, field],
  ]))("rejects direct-rendered human exception with %s", async (_name, change, field) => {
    const { build, render } = await loadReport();
    const facts = build(BASE_INPUT);
    const invalid = { ...facts, exceptions: [{ ...facts.exceptions[0], ...change }] };
    expect(() => render(invalid)).toThrow(new RegExp(`exceptions\\[0\\].*${field}`));
  });

  it.each(["never", "P4", "P0", `P${Number.MAX_SAFE_INTEGER + 1}`])(
    "rejects direct-rendered human exception expiry %s", async (expiry) => {
      const { build, render } = await loadReport();
      const facts = build(BASE_INPUT);
      expect(() => render({ ...facts, exceptions: [{ ...facts.exceptions[0], expires_at_phase: expiry }] }))
        .toThrow(/exceptions\[0\].*expires_at_phase/);
    },
  );

  it("rejects direct-rendered blank verbatim or machine status", async () => {
    const { build, render } = await loadReport();
    const facts = build(BASE_INPUT);
    for (const change of [{ verbatim: " " }, { status: "missing" }]) {
      expect(() => render({ ...facts, exceptions: [{ ...facts.exceptions[0], ...change }] }))
        .toThrow(/exceptions\[0\]/);
    }
  });

  it("renders not_done first, then route applicability and executions, each with a source path", async () => {
    const { build, render } = await loadReport();
    expect(typeof render).toBe("function");
    const facts = build(BASE_INPUT);
    const markdown = render(facts);
    expect(typeof markdown).toBe("string");
    const notDoneAt = markdown.indexOf("没做到");
    const routeAt = markdown.indexOf("路线适用");
    const executionAt = markdown.indexOf("执行事实");
    expect(notDoneAt).toBeGreaterThanOrEqual(0);
    expect(routeAt).toBeGreaterThan(notDoneAt);
    expect(executionAt).toBeGreaterThan(routeAt);
    expect(markdown).toContain("human_confirmation");
    expect(markdown).toContain("T007-green.txt");
    expect(markdown).toMatch(/exit/i);
    expect(() => render({})).toThrow();
    expect(() => render({ schema_version: "stage-end-report-facts.v1", not_done: "oops" })).toThrow();
  });

  it("collects from a real stage result file and records a missing file instead of throwing", async () => {
    const { collect } = await loadReport();
    expect(typeof collect).toBe("function");
    const dir = mkdtempSync(path.join(tmpdir(), "card04-report-"));
    mkdirSync(path.join(dir, "evidence"), { recursive: true });
    writeFileSync(path.join(dir, "evidence", "green.txt"), "ok\n", "utf8");
    writeFileSync(path.join(dir, "stage-result.json"), JSON.stringify({
      work_status: "completed",
      quality_status: "complete",
      quality_missing: [],
      execution_outcome: "ok",
      commands: [
        { command: "npx vitest run runtime/stage/stage-end-report.test.mjs", exit_code: 0, output_ref: "evidence/green.txt" },
      ],
    }, null, 2), "utf8");
    const facts = await collect({
      stageResultPath: path.join(dir, "stage-result.json"),
      evidenceDir: path.join(dir, "evidence"),
    });
    expect(facts.schema_version).toBe("stage-end-report-facts.v1");
    expect(facts.executions.some((entry) => String(entry.command).includes("vitest"))).toBe(true);
    expect(facts.coverage_limits.length).toBeGreaterThan(0);
    const absent = await collect({
      stageResultPath: path.join(dir, "absent.json"),
      evidenceDir: path.join(dir, "evidence"),
    });
    expect(absent.not_done.some((entry) => entry.status === "missing")).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 重新采集：新增 spec-analyze 逐条入账两个 it
  //
  // 依据：AC-26 / FR-26 —— `stage_end_spec_analyze` 保持 advisory、不新增任何门
  // （`runtime/stage/completion-predicates.mjs:108-117` 的语义不变），但它的**机器判决**
  // 必须强制入账到阶段末报告事实层，逐条枚举、不得被抹平成通用 `missing`。
  //
  // 逐阶段 spec-analyze 机器判决在**阶段结果（run 结果）**里的真实字段路径：
  //   runtime/stage/stage-runner.mjs:2722   const analyzerResult = result.spec_analyze?.result;
  //   runtime/stage/stage-runner.mjs:2727   qualityAdvisoryFactRefs.push(stageAnalyzeFact.fact.ref);
  //   runtime/stage/stage-runner.mjs:2730-2732
  //     if (stageAnalyzeFact && analyzerResult?.status !== "consistent") {
  //       qualityAdvisories.push(`stage-end-spec-analyze:${analyzerResult?.status ?? "unavailable"}`);
  //     }
  //   runtime/stage/stage-runner.mjs:3027   quality_advisory_fact_refs: Object.freeze(qualityAdvisoryFactRefs)
  //   runtime/stage/stage-runner.mjs:3029   ...(qualityAdvisories.length ? { quality_advisories: [...] } : {})
  //   即：`stageResult.quality_advisories[]` 的一条 `stage-end-spec-analyze:<机器判决>` 就是一条判决；
  //   阶段名在 `stageResult.stage`（`stage-runtime-result.vnext`，同文件 `:3012`）。
  // 判决值域：runtime/stage/stage-content-contracts.mjs:6685
  //   （consistent / inconsistent / material_incomplete / skipped）。
  // 底层事实候选，待 T008 认证（T007 source 只指向阶段结果中的判决位置）：
  //   quality/evidence/acceptance/<stage>/stage_end_spec_analyze-<sha256>.json 的 summary.actual_outcome
  //   quality/evidence/stage-quality/<stage>/stage_end_spec_analyze-<sha256>.json 的 subject_fact.analysis_result.status
  // 注意：`status` 投影（tools/cli/stage-runtime.mjs:1258-1287）里没有这三个键，只能从 run 结果读
  //（specs/workflowhub-thin-core-card-04-20260919/decision-log.md:1861-1862）。
  // ─────────────────────────────────────────────────────────────────────────────
  const SPEC_ANALYZE_STAGE = "build-plan";
  const SPEC_ANALYZE_VERDICTS = ["material_incomplete", "inconsistent", "unavailable"];
  // 五值映射（P5.md:23 判定规则 + 机器判定类五值）：material_incomplete→incomplete、
  // inconsistent→inconsistent、unavailable→unavailable；consistent（通过）不产生任何条目。
  const SPEC_ANALYZE_STATUSES = ["incomplete", "inconsistent", "unavailable"];
  const SPEC_ANALYZE_FACT_REFS = [
    `quality/facts/${"a1b2c3d4".repeat(8)}.json`,
    `quality/facts/${"0f1e2d3c".repeat(8)}.json`,
    `quality/facts/${"5a6b7c8d".repeat(8)}.json`,
  ];
  const SPEC_ANALYZE_ACCEPTANCE_REF =
    `quality/evidence/acceptance/${SPEC_ANALYZE_STAGE}/stage_end_spec_analyze-${"9e8d7c6b".repeat(8)}.json`;
  const specAnalyzeText = (entry) =>
    [entry?.item, entry?.subject, entry?.reason, entry?.detail, entry?.source]
      .filter((value) => typeof value === "string")
      .join(" | ");
  const specAnalyzeEntries = (facts) =>
    (Array.isArray(facts?.not_done) ? facts.not_done : [])
      .filter((entry) => /spec[-_]?analyze/i.test(specAnalyzeText(entry)));
  const specAnalyzeInput = (advisories) => ({
    ...BASE_INPUT,
    stageResult: {
      ...STAGE_RESULT,
      schema_version: "stage-runtime-result.vnext",
      stage: SPEC_ANALYZE_STAGE,
      // 通过与否都照发质量事实（列表里同时还有其它 advisory 主体的事实），
      // 所以 ref 列表本身说明不了判决——判决只在 quality_advisories 里。
      quality_advisory_fact_refs: SPEC_ANALYZE_FACT_REFS,
      ...(advisories.length > 0 ? { quality_advisories: advisories } : {}),
    },
    evidenceIndex: [
      ...EVIDENCE_INDEX,
      { path: SPEC_ANALYZE_ACCEPTANCE_REF, kind: "acceptance_evidence" },
    ],
  });
  const specAnalyzeAdvisories = () =>
    SPEC_ANALYZE_VERDICTS.map((verdict) => `stage-end-spec-analyze:${verdict}`);

  it("spec-analyze 判决逐条入账", async () => {
    const { build } = await loadReport();
    expect(typeof build).toBe("function");
    const facts = build(specAnalyzeInput(specAnalyzeAdvisories()));
    // ① 逐条枚举：三条非通过机器判决 → 三条 not_done，不得被总结（合并）成一条
    const entries = specAnalyzeEntries(facts);
    expect(entries).toHaveLength(SPEC_ANALYZE_VERDICTS.length);
    // ② 状态值只能取机器判定类五值，且每条判决各自的机器词面必须可见（不得抹平成同一个通用词）
    expect(entries.map((entry) => entry.status).sort()).toEqual(SPEC_ANALYZE_STATUSES);
    for (const entry of entries) expect(MACHINE_STATUS).toContain(entry.status);
    // ③ 每条必须点明「阶段 + spec-analyze 主题」，且都带一句话原因
    for (const entry of entries) {
      const text = specAnalyzeText(entry);
      expect(text).toContain(SPEC_ANALYZE_STAGE);
      expect(text).toMatch(/spec[-_]?analyze/i);
      expect(typeof entry.reason).toBe("string");
      expect(entry.reason.length).toBeGreaterThan(0);
    }
    // ④ 每条只指向自己的判决位置，并逐条披露原始质量事实来源未核。
    for (const [index, entry] of entries.entries()) {
      expect(typeof entry.source).toBe("string");
      expect(entry.source.trim().length).toBeGreaterThan(0);
      expect(entry.source).toBe(`input.stageResult#quality_advisories[${index}]`);
      expect(facts.coverage_limits).toContainEqual(expect.objectContaining({
        source: entry.source,
        reason: expect.stringMatching(/spec-analyze.*原始质量事实来源未核/),
      }));
    }
    const stageResultPath = "quality/evidence/stage-result.json";
    const pathFacts = build({ ...specAnalyzeInput(specAnalyzeAdvisories()), stageResultPath });
    for (const [index, entry] of specAnalyzeEntries(pathFacts).entries()) {
      expect(entry.source).toBe(`${stageResultPath}#quality_advisories[${index}]`);
      expect(pathFacts.coverage_limits).toContainEqual(expect.objectContaining({
        source: entry.source,
        reason: expect.stringMatching(/spec-analyze.*原始质量事实来源未核/),
      }));
    }
  });

  it("负控：spec-analyze 判决通过时不得出现该条 not_done", async () => {
    const { build } = await loadReport();
    expect(typeof build).toBe("function");
    // 同一夹具、只改判决：通过时 run 不推入 quality_advisories（stage-runner.mjs:2730-2732/3029）
    const passing = build(specAnalyzeInput([]));
    const nonPassing = build(specAnalyzeInput(specAnalyzeAdvisories()));
    // 通过夹具本身仍有其它没做到项（human_confirmation / AC-21 / 非零退出命令），
    // 证明这条断言不是靠「not_done 本来就非空」蒙过去的
    expect(passing.not_done.length).toBeGreaterThan(0);
    // 通过判决不得产生任何 spec-analyze 条目（否则第 1 条靠「总是加一条」也能蒙过）
    expect(specAnalyzeEntries(passing)).toEqual([]);
    // 两个夹具其余部分完全一致，差额恰好是三条 spec-analyze 判决
    expect(nonPassing.not_done.length).toBe(passing.not_done.length + SPEC_ANALYZE_VERDICTS.length);
  });

  it("负控：不同 advisory 的位置不得把 spec-analyze 指向另一份质量事实", async () => {
    const { build } = await loadReport();
    const specFact = `quality/facts/${"a1b2c3d4".repeat(8)}.json`;
    const otherFact = `quality/facts/${"0f1e2d3c".repeat(8)}.json`;
    const input = specAnalyzeInput([]);
    input.stageResult.quality_advisories = ["other-check:reported", "stage-end-spec-analyze:inconsistent"];
    input.stageResult.quality_advisory_fact_refs = [specFact, otherFact];

    const entries = specAnalyzeEntries(build(input));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ status: "inconsistent", source: "input.stageResult#quality_advisories[1]" });
    expect(entries[0].source).not.toBe(specFact);
    expect(entries[0].source).not.toBe(otherFact);
  });

  it("负控：首项属于别的主题时不得猜它是 spec-analyze 来源", async () => {
    const { build } = await loadReport();
    const input = specAnalyzeInput(["stage-end-spec-analyze:inconsistent"]);
    input.stageResult.quality_advisory_fact_refs = [
      `quality/facts/${"0f1e2d3c".repeat(8)}.json`,
      `quality/facts/${"a1b2c3d4".repeat(8)}.json`,
    ];
    const facts = build(input);
    expect(specAnalyzeEntries(facts)[0].source).toBe("input.stageResult#quality_advisories[0]");
    expect(facts.coverage_limits.some((entry) => /spec-analyze.*来源.*未核/.test(entry.reason))).toBe(true);
  });

  it("负控：首项缺失时不得借用相似文件名作为判决来源", async () => {
    const { build } = await loadReport();
    const input = specAnalyzeInput(["stage-end-spec-analyze:material_incomplete"]);
    input.stageResult.quality_advisory_fact_refs = [];
    const facts = build(input);
    expect(specAnalyzeEntries(facts)[0].source).toBe("input.stageResult#quality_advisories[0]");
    expect(facts.coverage_limits.some((entry) => /spec-analyze.*来源.*未核/.test(entry.reason))).toBe(true);
  });

  it("负控：多条非通过判决不得共用一份未核来源", async () => {
    const { build } = await loadReport();
    const facts = build(specAnalyzeInput(specAnalyzeAdvisories()));
    const entries = specAnalyzeEntries(facts);
    expect(entries).toHaveLength(3);
    expect(entries.map((entry) => entry.source)).toEqual([
      "input.stageResult#quality_advisories[0]",
      "input.stageResult#quality_advisories[1]",
      "input.stageResult#quality_advisories[2]",
    ]);
    expect(facts.coverage_limits.filter((entry) => /spec-analyze.*来源.*未核/.test(entry.reason))).toHaveLength(3);
  });

  it("当前生产者单条非通过判决仍须逐条披露真实机器状态", async () => {
    const { build } = await loadReport();
    const facts = build(specAnalyzeInput(["stage-end-spec-analyze:inconsistent"]));
    expect(specAnalyzeEntries(facts)).toEqual([expect.objectContaining({
      item: "build-plan/stage-end-spec-analyze/0", status: "inconsistent",
      reason: expect.stringContaining("spec-analyze 机器判决为 inconsistent"),
      source: "input.stageResult#quality_advisories[0]",
    })]);
  });
});

describe("stage-end-report current vNext result disclosure", () => {
  it("itemizes incomplete status and every completion gap even when materials are ready and quality passed", async () => {
    const { build } = await loadReport();
    const facts = build({
      ...BASE_INPUT,
      stageResult: {
        ...STAGE_RESULT,
        schema_version: "stage-runtime-result.vnext",
        status: "in_progress",
        work_status: "ready",
        readiness: { work_status: "ready", missing_materials: [] },
        completion: { status: "in_progress", missing: ["phase_review", "risk_tests_fresh"] },
        quality_status: "passed",
        quality_missing: [],
        execution_outcome: "ok",
        commands: [],
      },
    });
    expect(facts.not_done).toEqual(expect.arrayContaining([
      expect.objectContaining({ item: "stage_status", status: "incomplete", source: "input.stageResult#status" }),
      expect.objectContaining({ item: "phase_review", status: "missing", source: "input.stageResult#completion.missing[0]" }),
      expect.objectContaining({ item: "risk_tests_fresh", status: "missing", source: "input.stageResult#completion.missing[1]" }),
    ]));
    expect(facts.not_done.some((entry) => entry.item === "work_status")).toBe(false);
  });

  it("itemizes blocked work and each named missing material with its source", async () => {
    const { build } = await loadReport();
    const facts = build({
      ...BASE_INPUT,
      stageResult: {
        ...STAGE_RESULT,
        schema_version: "stage-runtime-result.vnext",
        status: "in_progress",
        work_status: "blocked_by_missing_material",
        readiness: { work_status: "blocked_by_missing_material", missing_materials: ["spec.md", "phases/P5.md"] },
        completion: { status: "in_progress", missing: [] },
        quality_status: "passed",
        quality_missing: [],
      },
    });
    expect(facts.not_done).toEqual(expect.arrayContaining([
      expect.objectContaining({ item: "work_status", status: "missing", source: "input.stageResult#work_status" }),
      expect.objectContaining({ item: "spec.md", status: "missing", source: "input.stageResult#readiness.missing_materials[0]" }),
      expect.objectContaining({ item: "phases/P5.md", status: "missing", source: "input.stageResult#readiness.missing_materials[1]" }),
    ]));
  });

  it.each([
    ["empty object", [{}]],
    ["blank ref", [{ ref: "  ", hash: "c".repeat(64) }]],
    ["invalid hash", [{ ref: "quality/evidence/ac.json", hash: "not-a-sha256" }]],
  ])("reports per-AC missing evidence for %s", async (_name, evidenceRefs) => {
    const { build } = await loadReport();
    const facts = build({
      ...BASE_INPUT,
      chainRows: [{ ...CHAIN_ROWS[0], source_path: "quality/evidence/ac-20-row.json", evidence_refs: evidenceRefs }],
    });
    expect(facts.not_done).toEqual(expect.arrayContaining([
      expect.objectContaining({ item: "AC-20", status: "incomplete", source: "quality/evidence/ac-20-row.json",
        reason: expect.stringMatching(/证据/) }),
    ]));
  });

  it("keeps a structurally valid ref and hash as an unverified candidate", async () => {
    const { build } = await loadReport();
    const facts = build({
      ...BASE_INPUT,
      chainRows: [{ ...CHAIN_ROWS[0], source_path: "quality/evidence/ac-20-row.json" }],
    });
    expect(facts.not_done.some((entry) => entry.item === "AC-20" && /证据/.test(entry.reason))).toBe(false);
    expect(facts.sources).toContainEqual({ path: "ac-trace", kind: "acceptance_evidence_candidate" });
    expect(facts.not_done).toContainEqual(expect.objectContaining({ item: "source_binding", status: "unavailable" }));
  });

  it("keeps a conflicted completion predicate distinct from an ordinary missing one", async () => {
    const { build } = await loadReport();
    const facts = build({
      ...BASE_INPUT,
      stageResult: {
        ...STAGE_RESULT,
        schema_version: "stage-runtime-result.vnext",
        status: "in_progress",
        completion: {
          status: "in_progress",
          missing: ["phase_review", "risk_tests_fresh"],
          predicates: {
            phase_review: { status: "conflict" },
            risk_tests_fresh: { status: "missing" },
          },
        },
      },
    });
    expect(facts.not_done).toEqual(expect.arrayContaining([
      expect.objectContaining({ item: "phase_review", status: "inconsistent", source: "input.stageResult#completion.predicates.phase_review.status" }),
      expect.objectContaining({ item: "risk_tests_fresh", status: "missing", source: "input.stageResult#completion.missing[1]" }),
    ]));
  });
});

describe("stage-end-report finite no-exception candidate", () => {
  const candidate = (reportScope = "p5_intermediate") => ({
    kind: "none",
    permission_refs: {
      question: { ref: "quality/evidence/permission-question.jsonl", sha256: "a".repeat(64) },
      answer: { ref: "quality/evidence/permission-answer.jsonl", sha256: "b".repeat(64) },
    },
    audit_ref: "quality/evidence/no-exception-audit.json",
    audit_sha256: "c".repeat(64),
    scope: {
      task_id: "card04-fixture-task",
      phase_id: reportScope === "task_final" ? "P13" : "P5",
      material_revision: `revision-${"d".repeat(64)}`,
      snapshot_tree: "e".repeat(40),
      report_scope: reportScope,
    },
  });
  const input = (none) => ({ ...BASE_INPUT,
    declared: { ...DECLARED, exceptions: [], no_exceptions: none } });
  const changed = (value, field, replacement) => {
    const result = structuredClone(value);
    const keys = field.split(".");
    let owner = result;
    for (const key of keys.slice(0, -1)) owner = owner[key];
    owner[keys.at(-1)] = replacement;
    return result;
  };

  it("keeps a complete finite none candidate and its unverified sources without inventing a human declaration", async () => {
    const { build, render } = await loadReport();
    const none = candidate();
    const facts = build(input(none));
    expect(facts.exceptions).toEqual([]);
    expect(facts.no_exceptions).toEqual(none);
    expect(facts.not_done.some((entry) => entry.item === "exceptions")).toBe(false);
    expect(facts.no_exceptions).not.toHaveProperty("declared_by");
    for (const ref of [none.permission_refs.question.ref, none.permission_refs.answer.ref, none.audit_ref]) {
      expect(facts.sources).toContainEqual(expect.objectContaining({ path: ref,
        kind: expect.stringMatching(/candidate/) }));
    }
    expect(facts.coverage_limits).toContainEqual(expect.objectContaining({
      source: none.audit_ref, reason: expect.stringMatching(/零例外.*未认证/) }));
    const markdown = render(facts);
    expect(markdown).toContain("本次核查范围内没有例外；最终仍待 P13 核查");
    expect(markdown).not.toContain("声明者：");
    expect(markdown).toContain(none.audit_ref);
  });

  const requiredFields = ["kind", "permission_refs", "permission_refs.question.ref",
    "permission_refs.question.sha256", "permission_refs.answer.ref", "permission_refs.answer.sha256",
    "audit_ref", "audit_sha256", "scope", "scope.task_id", "scope.phase_id",
    "scope.material_revision", "scope.snapshot_tree", "scope.report_scope"];
  it.each(requiredFields)("rejects a none candidate missing %s", async (field) => {
    const { build } = await loadReport();
    expect(() => build(input(changed(candidate(), field, undefined))))
      .toThrow(/no_exceptions/);
  });

  it.each([
    ["kind", "human_approved"], ["permission_refs.question.ref", " "],
    ["permission_refs.question.sha256", "bad-hash"],
    ["permission_refs.question.sha256", ["a".repeat(64)]],
    ["permission_refs.answer.sha256", "0".repeat(63)], ["audit_sha256", "bad-hash"],
    ["audit_sha256", ["c".repeat(64)]],
    ["scope.task_id", " "], ["scope.report_scope", "unknown"],
    ["scope.phase_id", "P13"],
  ])("rejects malformed none field %s", async (field, replacement) => {
    const { build } = await loadReport();
    expect(() => build(input(changed(candidate(), field, replacement))))
      .toThrow(/no_exceptions/);
  });

  it("rejects contradictory nonempty exceptions and rejects direct-rendered incomplete none", async () => {
    const { build, render } = await loadReport();
    expect(() => build({ ...BASE_INPUT, declared: { ...DECLARED, no_exceptions: candidate() } }))
      .toThrow(/no_exceptions.*exceptions/);
    const facts = build(input(candidate()));
    expect(() => render({ ...facts, no_exceptions: changed(candidate(), "audit_ref", " ") }))
      .toThrow(/no_exceptions/);
    expect(() => render({ ...facts, no_exceptions: undefined })).toThrow(/invalid stage-end-report-facts/);
  });

  it("keeps P5 intermediate and P13 final scopes distinct", async () => {
    const { build, render } = await loadReport();
    const intermediate = render(build(input(candidate())));
    const final = render(build(input(candidate("task_final"))));
    expect(intermediate).toContain("最终仍待 P13 核查");
    expect(final).toContain("没有例外");
    expect(final).not.toContain("最终仍待 P13 核查");
    expect(() => build(input(changed(candidate("task_final"), "scope.phase_id", "P5"))))
      .toThrow(/no_exceptions/);
  });

  it("does not reduce any machine gap or coverage limit when the none candidate is supplied", async () => {
    const { build } = await loadReport();
    const baseline = build({ ...BASE_INPUT, declared: { ...DECLARED, exceptions: [] } });
    const facts = build(input(candidate()));
    expect(facts.not_done).toEqual(baseline.not_done.filter((entry) => entry.item !== "exceptions"));
    expect(facts.coverage_limits).toEqual(expect.arrayContaining(baseline.coverage_limits));
    expect(facts.not_done).toContainEqual(expect.objectContaining({ item: "source_binding", status: "unavailable" }));
    expect(facts.not_done.some((entry) => entry.status === "failed")).toBe(true);
    expect(facts.not_done).toContainEqual(expect.objectContaining({ item: "human_confirmation", status: "missing" }));
  });
});

// P5 D-004 prewritten contract: these schema-shaped values are unverified
// in-memory candidates. T008 separately owns reading/authenticating real bytes.
describe("D004 per-source acceptance candidates preserve raw bad news", () => {
  const tree = "a".repeat(40);
  const revision = `revision-${"b".repeat(64)}`;
  const hash = async (value) => (await import("node:crypto")).createHash("sha256")
    .update(`${JSON.stringify(value, null, 2)}\n`).digest("hex");
  const candidate = async ({ result = "missing", status = "missing", subject = "AC-41",
    detail = "the required source is absent", suffix = "first", fact = {} } = {}) => {
    const record = {
      schema_version: "stage-quality-evidence.v1", task_id: "d004-candidate-fixture",
      stage: "build-code", subject, status, snapshot_tree: tree, material_revision: revision,
      subject_fact: { status, detail, evidence_refs: [], ...fact },
    };
    const qualityPath = `quality/evidence/stage-quality/build-code/${subject}-${await hash(record)}.json`;
    const acceptance = {
      schema_version: "acceptance-evidence.v1", acceptance_criterion_id: subject, result,
      refs: [{ ref: qualityPath, sha256: await hash(record) }], snapshot_tree: tree,
      // This is an evidence-state label, deliberately not a verdict parser.
      summary: { actual_outcome: `opaque-${suffix}-evidence-state`, evidence_type: "stage quality fact" },
    };
    return { path: `quality/evidence/acceptance/build-code/${subject}-${await hash(acceptance)}.json`,
      kind: "acceptance_evidence_candidate", acceptance,
      stage_quality: { path: qualityPath, record } };
  };
  const inputFor = (entries) => ({ ...BASE_INPUT, chainRows: [], evidenceIndex: entries,
    stageResult: { status: "completed", work_status: "ready", quality_status: "passed", commands: [] } });
  const fromCandidates = (facts, entries) => facts.not_done.filter((row) => entries.some((entry) =>
    row.source?.startsWith(entry.path) || row.source?.startsWith(entry.stage_quality?.path)));
  const expectGapOrRejection = (build, entry, message) => {
    let facts;
    try { facts = build(inputFor([entry])); }
    catch (error) { expect(error).toBeInstanceOf(Error); expect(error.message).toMatch(message); return; }
    const gaps = fromCandidates(facts, [entry]);
    expect(gaps.some((row) => MACHINE_STATUS.includes(row.status) && message.test(row.reason))).toBe(true);
  };

  it.each([
    ["missing", "missing"], ["inconsistent", "inconsistent"],
    ["incomplete", "incomplete"], ["unavailable", "unavailable"], ["fail", "failed"],
  ])("itemizes explicit %s without collapsing the raw subject, reason or field source", async (result, status) => {
    const { build } = await loadReport();
    const entry = await candidate({ result, status: status === "failed" ? "failed" : "missing",
      detail: `independent reason for ${result}` });
    const facts = build(inputFor([entry]));
    expect(fromCandidates(facts, [entry])).toContainEqual(expect.objectContaining({
      item: "AC-41", status, reason: expect.stringContaining(`independent reason for ${result}`),
      source: `${entry.path}#result`,
    }));
    expect(facts.sources).toContainEqual(expect.objectContaining({ path: `${entry.path}#result` }));
    expect(facts.sources).toContainEqual(expect.objectContaining({
      path: `${entry.stage_quality.path}#subject_fact.detail`,
    }));
    expect(facts.not_done).toContainEqual(expect.objectContaining({ item: "source_binding", status: "unavailable" }));
    expect(entry).not.toHaveProperty("verified");
    expect(entry.stage_quality).not.toHaveProperty("verified");
  });

  it("keeps two distinct original wrappers for one AC as two bad-news rows", async () => {
    const { build } = await loadReport();
    const one = await candidate({ detail: "first missing observation", suffix: "one" });
    const two = await candidate({ detail: "second missing observation", suffix: "two" });
    expect(one.path).not.toBe(two.path);
    const rows = fromCandidates(build(inputFor([one, two])), [one, two]);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.source)).toEqual(expect.arrayContaining([
      `${one.path}#result`, `${two.path}#result`,
    ]));
    expect(rows.map((row) => row.reason).join("\n")).toContain("first missing observation");
    expect(rows.map((row) => row.reason).join("\n")).toContain("second missing observation");
  });

  it("does not turn a structurally consistent pass into bad news or an authenticated claim", async () => {
    const { build } = await loadReport();
    const entry = await candidate({ result: "pass", status: "passed", detail: "candidate observation passed" });
    const facts = build(inputFor([entry]));
    expect(fromCandidates(facts, [entry])).toEqual([]);
    expect(facts.not_done).toContainEqual(expect.objectContaining({ item: "source_binding", status: "unavailable" }));
  });

  it("reads a deferred wrapper's real underlying missing state instead of inventing a human exception", async () => {
    const { build } = await loadReport();
    const entry = await candidate({ result: "deferred", status: "missing", detail: "original missing receipt",
      fact: { evidence_state: "zero_review_findings" } });
    const facts = build(inputFor([entry]));
    expect(fromCandidates(facts, [entry])).toContainEqual(expect.objectContaining({
      item: "AC-41", status: "missing", reason: expect.stringContaining("original missing receipt"),
      source: `${entry.stage_quality.path}#subject_fact.status`,
    }));
    expect(facts.exceptions).toEqual(build(inputFor([])).exceptions);
  });

  it("preserves a deferred analyzer's material_incomplete judgment as incomplete with its own field source", async () => {
    const { build } = await loadReport();
    const entry = await candidate({ result: "deferred", status: "missing", subject: "stage_end_spec_analyze",
      detail: "analyzer has a missing original-source index",
      fact: { analysis_result: { status: "material_incomplete", errors: ["original-source index missing"], facts: {} } } });
    const facts = build(inputFor([entry]));
    expect(fromCandidates(facts, [entry])).toContainEqual(expect.objectContaining({
      item: "stage_end_spec_analyze", status: "incomplete",
      reason: expect.stringContaining("material_incomplete"),
      source: `${entry.stage_quality.path}#subject_fact.analysis_result.status`,
    }));
  });

  it("puts a genuinely reasoned not_applicable declaration only in coverage, retaining its source", async () => {
    const { build } = await loadReport();
    const entry = await candidate({ result: "deferred", status: "not_applicable", detail: "no browser consumer exists in this fixture",
      fact: { evidence_state: "not_applicable", not_applicable_reason: "fixture is a pure text consumer" } });
    const facts = build(inputFor([entry]));
    expect(fromCandidates(facts, [entry])).toEqual([]);
    expect(facts.coverage_limits).toContainEqual(expect.objectContaining({
      reason: expect.stringContaining("fixture is a pure text consumer"),
      source: `${entry.stage_quality.path}#subject_fact.not_applicable_reason`,
    }));
    expect(facts.exceptions).toEqual(build(inputFor([])).exceptions);
  });

  it("never lets an N/A label and reason hide raw missing statuses", async () => {
    const { build } = await loadReport();
    const entry = await candidate({ result: "deferred", status: "missing", detail: "real receipt remains missing",
      fact: { evidence_state: "not_applicable", not_applicable_reason: "caller claims this route does not apply" } });
    let facts;
    try { facts = build(inputFor([entry])); }
    catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toMatch(/missing|status|conflict|冲突/i);
      return;
    }
    const rows = fromCandidates(facts, [entry]);
    expect(rows.some((row) => row.status === "missing"
      && row.reason.includes("real receipt remains missing")
      && row.source === `${entry.stage_quality.path}#subject_fact.status`
      || row.status === "inconsistent" && /missing|status|conflict|冲突/i.test(row.reason))).toBe(true);
  });

  it("keeps inconclusive visible without silently inventing pass or an exact mapped verdict", async () => {
    const { build } = await loadReport();
    const entry = await candidate({ result: "inconclusive", status: "missing", detail: "candidate lacks an observable answer" });
    expectGapOrRejection(build, entry, /inconclusive/);
  });

  it.each([
    ["missing wrapper", (entry) => { delete entry.acceptance; }, /acceptance|wrapper/i],
    ["illegal result", (entry) => { entry.acceptance.result = "success"; }, /result|success/i],
    ["missing subject reason", (entry) => { delete entry.stage_quality.record.subject_fact.detail; }, /reason|detail|原因/i],
    ["missing raw stage-quality source", (entry) => { delete entry.stage_quality; }, /stage.quality|source|来源/i],
    ["conflicting subject", (entry) => { entry.stage_quality.record.subject = "AC-42"; }, /subject|criterion|AC-42|冲突/i],
    ["conflicting pass", (entry) => { entry.acceptance.result = "pass"; entry.stage_quality.record.status = "failed";
      entry.stage_quality.record.subject_fact.status = "failed"; }, /pass|failed|conflict|冲突/i],
    ["not_applicable without reason", (entry) => { entry.acceptance.result = "deferred";
      entry.stage_quality.record.status = "not_applicable";
      entry.stage_quality.record.subject_fact.status = "not_applicable";
      entry.stage_quality.record.subject_fact.evidence_state = "not_applicable"; }, /not_applicable|reason|理由/i],
    ["contradictory underlying statuses", (entry) => { entry.acceptance.result = "deferred";
      entry.stage_quality.record.subject_fact.status = "passed"; }, /status|conflict|冲突/i],
  ])("rejects or explicitly discloses %s instead of omitting that candidate", async (_label, mutate, message) => {
    const { build } = await loadReport();
    const entry = await candidate();
    mutate(entry);
    expectGapOrRejection(build, entry, message);
  });
});
