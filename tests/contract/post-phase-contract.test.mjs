import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import * as contracts from "../../runtime/stage/stage-content-contracts.mjs";
import { readCurrentE2eAcceptanceEvidence } from "../../runtime/stage/stage-runner.mjs";

const validatePostPhaseContract = (...args) => {
  expect(typeof contracts.validatePostPhaseContract, "post Phase validator must exist at the production contract seam").toBe("function");
  return contracts.validatePostPhaseContract(...args);
};

const thinSpec = `# Specification

- **FR-001**：用户能够看见当前结果。
- **FR-002**：错误保持可见。
- **AC-001**：给定有效输入，执行后显示结果；结果可读；空结果判失败。
- **AC-002**：给定失败输入，执行后报告错误；错误可定位；隐藏错误判失败。
`;

const spec = `${thinSpec}
## 实现设计（全局权威）

### Code Anchors

\`src/first.mjs#renderResult\` owns visible results; \`src/second.mjs#reportError\` owns error display.

### Interfaces and Failure Semantics

renderResult(input) returns visible output and rejects empty output; reportError(error) preserves actionable error text.

### Requirement-to-Task Trace

| source | FR | AC | Phase/Task | oracle | evidence |
| --- | --- | --- | --- | --- | --- |
| R-001 | FR-001 | AC-001 | P1/T001 | ORACLE-P1 | \`quality/tests/p1.json\` |
| R-002 | FR-002 | AC-002 | P2/T002 | ORACLE-P2 | \`quality/tests/p2.json\` |

### Global Verification Strategy

Run \`node --test tests/p1.test.mjs\` and \`node --test tests/p2.test.mjs\`; RED must show the target assertion failure; GREEN must exit 0 and preserve evidence.
`;

const thinPhase = (id, dependency, file, fr, ac) => `# Phase ${id} — ${file}

- **Global spec**：\`spec.md\`
- **Write set**：\`${file}\`
- **Dependency**：\`${dependency}\`
- **Consumer**：build-code

## L0 — Outcome

实现 ${fr}，以 ${ac} 判断结果。

## L1 — Contract

- **FR / AC**：${fr} / ${ac}
- **Tasks**：\`T${id.slice(1)}01 RED\` → \`T${id.slice(1)}02 GREEN\`
- **gate_cmd**：\`node --test tests/${id.toLowerCase()}.test.mjs\`
- **expected_exit**：RED nonzero assertion failure；GREEN 0。
- **oracle**：ORACLE-${id}
- **evidence_path**：\`quality/tests/${id.toLowerCase()}.json\`
- **STOP**：输入合同变化则返回 spec owner。
- **Done**：正例和负例可回放。

## L2 — Removable reference

实现参考可删除；删除后 L0/L1 不变。过期条件：验收合同改变。
`;

const phase = (id, dependency, file, fr, ac) => thinPhase(id, dependency, file, fr, ac).replace(
  "## L2 — Removable reference",
  `### T00${id.slice(1)} — deliver ${file}

- **Source / FR / AC**：R-00${id.slice(1)} / ${fr} / ${ac}。
- **Files / symbols**：\`${file}\` symbol: ${id === "P1" ? "renderResult" : "reportError"}.
- **Action**：Implement the observable result and preserve the negative path.
- **Inputs**：A valid input and one failing input with deterministic fixture.
- **Outputs / failure**：Visible result on success; explicit failure when empty or invalid.
- **Dependency**：${dependency}
- **Boundary / DO NOT TOUCH**：Only \`${file}\`; do not edit the adjacent module.
- **Test tier / skill**：feature / backend-testing.
- **Scenario / fixture or service**：Valid result and hidden-output negative case; use local fixture and remove it after test.
- **RED/GREEN gate_cmd**：\`node --test tests/${id.toLowerCase()}.test.mjs\`.
- **expected_exit**：RED target assertion nonzero; GREEN 0.
- **RED target failure**：ORACLE-${id}; the ${ac} assertion fails when the output is hidden.
- **GREEN oracle**：ORACLE-${id}; the ${ac} assertion passes and failure remains visible.
- **Evidence**：\`quality/tests/${id.toLowerCase()}.json\` with command, exit, and assertion.
- **STOP / recovery**：Stop if source contract changes; revise spec and this task card.
- **Coverage limit**：This targeted fixture does not prove historical task migration.
- **Done**：${ac} normal and negative result, test evidence, and readback are present.

## L2 — Removable reference`,
);

const phases = {
  "phases/P1.md": phase("P1", "none", "src/first.mjs", "FR-001", "AC-001"),
  "phases/P2.md": phase("P2", "P1", "src/second.mjs", "FR-002", "AC-002"),
};

const index = `# Phase index

## Execution Index

| phase | authority ref | semantic anchor | write set | dependency | consumer |
| --- | --- | --- | --- | --- | --- |
| \`P1\` | \`phases/P1.md\` | \`phase-p1\` | \`src/first.mjs\` | \`none\` | build-code |
| \`P2\` | \`phases/P2.md\` | \`phase-p2\` | \`src/second.mjs\` | \`P1\` | build-code |
`;

// A legacy natural-language card shape, not a new verification-role schema.
// Runtime/source read anchors deliberately stay outside backticks in Files: only
// the backticked document is owned; reading existing code is not a code write.
const pureDocFixture = () => {
  const docPath = "docs/calendar-refresh.md";
  let body = phases["phases/P1.md"].replaceAll("src/first.mjs", docPath);
  const replaceField = (field, value) => {
    const line = body.split("\n").filter((entry) => entry.startsWith(`- **${field}**：`)).at(-1);
    if (!line) throw new Error(`fixture field missing: ${field}`);
    body = body.replace(line, `- **${field}**：${value}`);
  };
  replaceField("Files / symbols", `owner=documentation; \`${docPath}\`; N/A — 非代码文档；只读锚点 runtime/publish.mjs:20。`);
  replaceField("Action", "仅编写既有 publish 操作说明，不新增生产抓取器或调度器。");
  replaceField("Inputs", "G-2文档无新行为；既有 publish fixture 和逐步命令审查。");
  replaceField("Scenario / fixture or service", "G-2文档无新行为；既有 publish 正例及未确认差异不发布负例；临时目录 finally 清理。");
  replaceField("expected_exit", "G-2文档/既有publish客观检查预期0；不执行RED、不宣称目标RED；原lint false并披露，结构接纳不等于替代已执行或阶段完成。");
  replaceField("RED target failure", "ORACLE-P1；文档的既有publish步骤可在tmp_path复放，未确认差异不会发布的断言。");
  body = body.replace("- **GREEN oracle**", "- **RED 证据**：N/A — G-2纯文档流程无新增运行行为，风险为操作者误把凭据provider当免凭据；客观替代为既有publish用例重放与独立逐步文档审查，不能宣称新增RED。\n- **GREEN oracle**");
  replaceField("GREEN oracle", "ORACLE-P1；同命令退出0，未确认差异不发布；历史不重写。");
  return {
    spec: spec.replaceAll("src/first.mjs", docPath),
    index: index.replaceAll("src/first.mjs", docPath),
    phases: { ...phases, "phases/P1.md": body },
  };
};
const withDocChange = (fixture, from, to) => ({
  ...fixture,
  phases: { ...fixture.phases, "phases/P1.md": fixture.phases["phases/P1.md"].replace(from, to) },
});

describe("post-cohort narrow pure-document G-2", () => {
  it.each([
    ["one-character placeholder", "expected x preserves evidence", false],
    ["named English procedure and outcome", "expected publish procedure preserves credential requirements", true],
  ])("checks the English criterion: %s", (_name, criterion, accepted) => {
    let fixture = withDocChange(pureDocFixture(),
      "ORACLE-P1；文档的既有publish步骤可在tmp_path复放，未确认差异不会发布的断言。",
      `ORACLE-P1；${criterion}。`);
    fixture = withDocChange(fixture,
      "ORACLE-P1；同命令退出0，未确认差异不发布；历史不重写。",
      `ORACLE-P1；${criterion}。`);
    const result = validatePostPhaseContract(fixture);
    expect(result.ok, result.errors.join("; ")).toBe(accepted);
    if (!accepted) expect(result.errors.join("; ")).toMatch(/G-2.*objective alternative/i);
    else expect(result.facts.command_oracle_checks.valid).toBe(true);
  });

  it("accepts a complete legacy pure-doc card without ceremonial RED or new fields", () => {
    const fixture = pureDocFixture();
    const before = JSON.stringify(fixture);
    const result = validatePostPhaseContract(fixture);
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.facts.command_oracle_checks.valid).toBe(true);
    expect(JSON.stringify(fixture)).toBe(before);
    expect(fixture.phases["phases/P1.md"]).toContain("原lint false并披露");
    expect(fixture.phases["phases/P1.md"]).not.toContain("verification_role");
    expect(fixture.phases["phases/P1.md"]).not.toContain("paired_task");
  });

  it.each([
    ["reason", "G-2纯文档流程无新增运行行为", "G-2"],
    ["risk", "风险为操作者误把凭据provider当免凭据；", ""],
    ["objective alternative", "客观替代为既有publish用例重放与独立逐步文档审查，", ""],
    ["acceptance disclosure", "原lint false并披露，结构接纳不等于替代已执行或阶段完成。", ""],
    ["empty", "N/A — G-2纯文档流程无新增运行行为，风险为操作者误把凭据provider当免凭据；客观替代为既有publish用例重放与独立逐步文档审查，不能宣称新增RED。", ""],
    ["bare N/A", "N/A — G-2纯文档流程无新增运行行为，风险为操作者误把凭据provider当免凭据；客观替代为既有publish用例重放与独立逐步文档审查，不能宣称新增RED。", "N/A"],
  ])("rejects a doc card missing concrete %s", (missing, from, to) => {
    const result = validatePostPhaseContract(withDocChange(pureDocFixture(), from, to));
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(new RegExp(`G-2.*${missing}|${missing}.*G-2`, "i"));
  });

  it("rejects an arbitrary G-2 label on a markdown task", () => {
    let fixture = pureDocFixture();
    fixture = withDocChange(fixture, "G-2文档无新行为", "G-2");
    fixture = withDocChange(fixture, "G-2文档无新行为", "G-2");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*(?:pure|无新|documentation|声明)/i);
  });

  it.each([
    ["vague risk", "风险为操作者误把凭据provider当免凭据", "风险为风险", /G-2.*risk/i],
    ["no risk", "风险为操作者误把凭据provider当免凭据", "无风险", /G-2.*risk/i],
    ["vague alternative", "客观替代为既有publish用例重放与独立逐步文档审查", "客观替代为替代", /G-2.*objective alternative/i],
    ["deferred alternative", "客观替代为既有publish用例重放与独立逐步文档审查", "客观替代为按需验证", /G-2.*objective alternative/i],
    ["vague disclosure", "原lint false并披露，结构接纳不等于替代已执行或阶段完成。", "已披露。", /G-2.*acceptance disclosure/i],
    ["runtime contradiction", "仅编写既有 publish 操作说明，不新增生产抓取器或调度器。", "新增 runtime 运行行为。", /G-2.*contradiction/i],
    ["logic contradiction", "Visible result on success; explicit failure when empty or invalid.", "修改执行逻辑。", /G-2.*contradiction/i],
    ["missing objective exit", "客观检查预期0", "客观检查按需处理", /G-2.*expected_exit/i],
  ])("rejects nonempty but inadequate %s", (_name, from, to, error) => {
    const result = validatePostPhaseContract(withDocChange(pureDocFixture(), from, to));
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(error);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.every((entry) => typeof entry === "string")).toBe(true);
  });

  it("keeps the positive behavior control accepted with real RED nonzero and GREEN 0", () => {
    const result = validatePostPhaseContract({ spec, index, phases });
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.facts.command_oracle_checks.valid).toBe(true);
  });

  it("does not force legal behavior or mixed RED/GREEN to opt into G-2 when it is inapplicable", () => {
    const behavior = { spec, index, phases: { ...phases, "phases/P1.md": phases["phases/P1.md"].replace("A valid input and one failing input with deterministic fixture.", "G-2不适用，本任务新增运行行为；有效及非法输入fixture。") } };
    const behaviorResult = validatePostPhaseContract(behavior);
    expect(behaviorResult.ok, behaviorResult.errors.join("; ")).toBe(true);
    const mixed = {
      ...behavior,
      index: behavior.index.replace("`src/first.mjs`", "`src/first.mjs` `docs/mixed.md`"),
      phases: { ...behavior.phases, "phases/P1.md": behavior.phases["phases/P1.md"]
        .replace("**Write set**：`src/first.mjs`", "**Write set**：`src/first.mjs` `docs/mixed.md`")
        .replace("`src/first.mjs` symbol:", "`src/first.mjs` `docs/mixed.md` symbol:") },
    };
    const mixedResult = validatePostPhaseContract(mixed);
    expect(mixedResult.ok, mixedResult.errors.join("; ")).toBe(true);
  });

  it("rejects a risk phrase that only repeats failure risk without object or consequence", () => {
    const fixture = withDocChange(pureDocFixture(), "风险为操作者误把凭据provider当免凭据", "风险为失败风险");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*risk/i);
  });

  it("allows independent document review when its same oracle supplies a concrete criterion", () => {
    const fixture = withDocChange(pureDocFixture(), "客观替代为既有publish用例重放与独立逐步文档审查", "客观替代为独立文档审查");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok, result.errors.join("; ")).toBe(true);
  });

  it("rejects an independent document review whose only criterion is a bare assertion", () => {
    let fixture = withDocChange(pureDocFixture(), "客观替代为既有publish用例重放与独立逐步文档审查", "客观替代为独立文档审查");
    fixture = withDocChange(fixture, "ORACLE-P1；文档的既有publish步骤可在tmp_path复放，未确认差异不会发布的断言。", "ORACLE-P1；断言。");
    // GREEN still supplies the concrete criterion in this otherwise legal
    // control; remove only that criterion to isolate the missing object.
    const criterionControl = validatePostPhaseContract(fixture);
    expect(criterionControl.ok, criterionControl.errors.join("; ")).toBe(true);
    fixture = withDocChange(fixture, "ORACLE-P1；同命令退出0，未确认差异不发布；历史不重写。", "ORACLE-P1；断言。");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*objective alternative/i);
  });

  it("does not let unrelated Action text supply the missing risk", () => {
    let fixture = withDocChange(pureDocFixture(), "风险为操作者误把凭据provider当免凭据；", "");
    fixture = withDocChange(fixture, "仅编写既有 publish 操作说明", "风险为操作者误把凭据provider当免凭据；仅编写既有 publish 操作说明");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*risk/i);
  });

  it("does not exempt mixed document/code ownership or ordinary behavior from RED", () => {
    const fixture = pureDocFixture();
    const mixed = {
      ...fixture,
      index: fixture.index.replace("`docs/calendar-refresh.md`", "`docs/calendar-refresh.md` `src/mixed.mjs`"),
      phases: { ...fixture.phases, "phases/P1.md": fixture.phases["phases/P1.md"]
        .replace("**Write set**：`docs/calendar-refresh.md`", "**Write set**：`docs/calendar-refresh.md` `src/mixed.mjs`")
        .replace("owner=documentation;", "owner=documentation; `src/mixed.mjs` symbol: run;") },
    };
    const mixedResult = validatePostPhaseContract(mixed);
    expect(mixedResult.ok).toBe(false);
    expect(mixedResult.errors.join("; ")).toMatch(/expected_exit.*RED target failure/);
    const behavior = { spec, index, phases: { ...phases, "phases/P1.md": phases["phases/P1.md"].replace("RED target assertion nonzero; GREEN 0.", "GREEN 0.") } };
    const behaviorResult = validatePostPhaseContract(behavior);
    expect(behaviorResult.ok).toBe(false);
    expect(behaviorResult.errors.join("; ")).toMatch(/expected_exit.*RED target failure/);
    expect(validatePostPhaseContract({ spec, index, phases }).ok).toBe(true);
  });

  it.each([
    ["source", "R-001 / FR-001 / AC-001", "FR-001 / AC-001", /original source/],
    ["owner", "`docs/calendar-refresh.md`; N/A", "`docs/unowned.md`; N/A", /owned write-set/],
    ["dependency", "**Dependency**：none", "**Dependency**：T999", /dependency.*T999/],
    ["oracle", "RED target failure**：ORACLE-P1", "RED target failure**：ORACLE-UNRELATED", /RED.*oracle/],
  ])("retains the %s check for an otherwise legal G-2", (_name, from, to, error) => {
    const result = validatePostPhaseContract(withDocChange(pureDocFixture(), from, to));
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(error);
  });

  it("does not ignore an unclassified backticked write path", () => {
    const fixture = withDocChange(pureDocFixture(), "owner=documentation;", "owner=documentation; `unclassified`;");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*owned write set/);
  });

  it.each([
    ["FR", "R-001 / FR-001 / AC-001", "R-001 / FR-999 / AC-001", /unknown FR/],
    ["AC", "R-001 / FR-001 / AC-001", "R-001 / FR-001 / AC-999", /unknown AC/],
  ])("retains the %s identity check for G-2", (_name, from, to, error) => {
    const result = validatePostPhaseContract(withDocChange(pureDocFixture(), from, to));
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(error);
  });

  it("accepts only supported alternate placement and normalized declaration syntax", () => {
    let fixture = withDocChange(pureDocFixture(), "G-2文档无新行为", "G-2 文档，无新增 runtime");
    fixture = withDocChange(fixture, "客观替代为既有publish用例重放与独立逐步文档审查，", "");
    fixture = withDocChange(fixture, "with command, exit, and assertion.", "客观替代为既有 publish 用例重放与独立逐步文档审查，判定未确认差异不发布；替代未执行，不能当 GREEN。");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok, result.errors.join("; ")).toBe(true);
  });

  it("executes the author template example through the real validator", () => {
    const template = readFileSync(new URL("../../skills/spec-plan/templates/phase-template.md", import.meta.url), "utf8");
    const example = template.split("### G-2 纯文档示例（既有字段，无新增运行行为）")[1]?.split("#### 示例：")[0];
    expect(example).toBeTruthy();
    const fixture = pureDocFixture();
    const labels = {
      "输入": "Inputs", "文件 / 符号": "Files / symbols", "动作": "Action", "场景 / 夹具或服务": "Scenario / fixture or service",
      "RED/GREEN 门禁命令": "RED/GREEN gate_cmd", "预期退出码": "expected_exit", "RED 目标失败": "RED target failure",
      "RED 证据": "RED 证据", "GREEN 判定器": "GREEN oracle", "证据": "Evidence", "覆盖上限": "Coverage limit", "完成": "Done",
    };
    let body = fixture.phases["phases/P1.md"];
    for (const [cn, en] of Object.entries(labels)) {
      const line = example.split("\n").find((entry) => entry.startsWith(`- **${cn}**:`));
      expect(line, cn).toBeTruthy();
      const old = body.split("\n").filter((entry) => entry.startsWith(`- **${en}**：`)).at(-1);
      expect(old, en).toBeTruthy();
      body = body.replace(old, `- **${en}**：${line.split(`**${cn}**:`)[1].trim().replaceAll("ORACLE-PUBLISH-DOC", "ORACLE-P1")}`);
    }
    const result = validatePostPhaseContract({ ...fixture, phases: { ...fixture.phases, "phases/P1.md": body } });
    expect(result.ok, result.errors.join("; ")).toBe(true);
  });

  it("retains index and trace bindings for G-2", () => {
    const fixture = pureDocFixture();
    const driftedIndex = validatePostPhaseContract({ ...fixture, index: fixture.index.replace("`docs/calendar-refresh.md`", "`docs/other.md`") });
    expect(driftedIndex.ok).toBe(false);
    expect(driftedIndex.errors.join("; ")).toMatch(/write set/);
    const driftedTrace = validatePostPhaseContract({ ...fixture, spec: fixture.spec.replace("P1/T001 | ORACLE-P1", "P1/T001 | ORACLE-UNRELATED") });
    expect(driftedTrace.ok).toBe(false);
    expect(driftedTrace.errors.join("; ")).toMatch(/P1\/T001.*oracle/);
  });
});

describe("post-cohort G-2 implementation review regressions", () => {
  it.each([
    ["failure-risk suffix", "风险为失败风险扩大"],
    ["generic failure possibility", "风险是失败的可能"],
  ])("rejects %s without a risk object and consequence", (_name, risk) => {
    const fixture = withDocChange(pureDocFixture(), "风险为操作者误把凭据provider当免凭据", risk);
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*risk/i);
  });

  it("does not let a reason mentioning credential risk hide the actual risk placeholder", () => {
    let fixture = withDocChange(pureDocFixture(), "G-2纯文档流程无新增运行行为，风险为操作者误把凭据provider当免凭据", "G-2纯文档流程无新增运行行为，说明凭据风险为操作者误认provider；风险为风险");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*risk/i);
  });

  it("accepts a labeled alternative after an incidental earlier mention in the reason", () => {
    const fixture = withDocChange(pureDocFixture(), "G-2纯文档流程无新增运行行为", "G-2纯文档流程无新增运行行为且描述客观替代背景");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok, result.errors.join("; ")).toBe(true);
  });

  it("rejects expected pass as the sole objective criterion", () => {
    let fixture = withDocChange(pureDocFixture(), "客观替代为既有publish用例重放与独立逐步文档审查", "客观替代为独立文档审查");
    fixture = withDocChange(fixture, "ORACLE-P1；文档的既有publish步骤可在tmp_path复放，未确认差异不会发布的断言。", "ORACLE-P1；expected pass。");
    fixture = withDocChange(fixture, "ORACLE-P1；同命令退出0，未确认差异不发布；历史不重写。", "ORACLE-P1；expected pass。");
    const result = validatePostPhaseContract(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/G-2.*objective alternative/i);
  });
});

describe("post-cohort independent Phase authority", () => {
  it("rejects a pointer-only design and one-line Tasks even when all FR/AC IDs appear", () => {
    const result = validatePostPhaseContract({ spec: thinSpec, index, phases: {
      "phases/P1.md": thinPhase("P1", "none", "src/first.mjs", "FR-001", "AC-001"),
      "phases/P2.md": thinPhase("P2", "P1", "src/second.mjs", "FR-002", "AC-002"),
    } });
    expect(result.ok, "headings and ID mentions cannot certify executable planning detail").toBe(false);
    expect(result.errors.join("; ")).toMatch(/Implementation Design|Code Anchors|task card/i);
    expect(result.facts.fr_coverage.covered_count).toBe(0);
    expect(result.facts.ac_coverage.covered_count).toBe(0);
    expect(result.facts.command_oracle_checks.valid).toBe(false);
  });

  it("rejects a trace row that names an unrelated oracle for an otherwise complete task", () => {
    const drifted = spec.replace("P2/T002 | ORACLE-P2", "P2/T002 | ORACLE-UNRELATED");
    const result = validatePostPhaseContract({ spec: drifted, index, phases });
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/P2\/T002.*oracle/i);
  });

  it("rejects a task card whose prerequisite does not exist", () => {
    const drifted = { ...phases, "phases/P2.md": phases["phases/P2.md"].replace("**Dependency**：P1", "**Dependency**：T999") };
    const result = validatePostPhaseContract({ spec, index, phases: drifted });
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/T002.*dependency.*T999/i);
  });

  it("rejects a task card without a scoped negative scenario", () => {
    const stripped = { ...phases, "phases/P1.md": phases["phases/P1.md"].replace(/^- \*\*Scenario \/ fixture or service\*\*：.*\n/m, "") };
    const result = validatePostPhaseContract({ spec, index, phases: stripped });
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/T001.*Scenario \/ fixture or service/);
  });

  it("rejects RED and GREEN evidence that do not share an oracle identity", () => {
    const drifted = { ...phases, "phases/P1.md": phases["phases/P1.md"].replace("RED target failure**：ORACLE-P1", "RED target failure**：ORACLE-UNRELATED") };
    const result = validatePostPhaseContract({ spec, index, phases: drifted });
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/T001.*RED.*oracle/i);
  });

  it("rejects invented FR/AC identities even when the Phase and trace agree", () => {
    const inventedSpec = spec.replace("| R-001 | FR-001 | AC-001 | P1/T001 | ORACLE-P1 |", "| R-001 | FR-001 FR-999 | AC-001 AC-999 | P1/T001 | ORACLE-P1 |");
    const inventedPhases = { ...phases, "phases/P1.md": phases["phases/P1.md"].replace("R-001 / FR-001 / AC-001", "R-001 / FR-001 FR-999 / AC-001 AC-999") };
    const result = validatePostPhaseContract({ spec: inventedSpec, index, phases: inventedPhases });
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/unknown (?:FR|AC).*999/i);
  });

  it("accepts two separate Phase files with one pure pointer index", () => {
    const result = validatePostPhaseContract({ spec, index, phases });
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.facts).toMatchObject({
      phase_count: 2,
      fr_coverage: { accepted_count: 2, covered_count: 2 },
      ac_coverage: { accepted_count: 2, covered_count: 2 },
      dependency_validation: { valid: true },
      command_oracle_checks: { valid: true },
    });
  });

  it("keeps an explicitly deferred AC visible in history but outside current formal coverage", () => {
    const deferredSpec = spec.replace("**AC-002**：", "**AC-002 (deferred)**：");
    expect(contracts.activeAcceptanceCriterionIds(deferredSpec)).toEqual(["AC-001"]);
    expect(contracts.activeAcceptanceCriterionIds(spec.replace("**AC-002**：", "**AC-002**（deferred）："))).toEqual(["AC-001"]);

    // P2 and its trace remain as historical material; only P1 is current AC coverage.
    const result = validatePostPhaseContract({ spec: deferredSpec, index, phases });
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.facts.ac_coverage).toMatchObject({
      accepted_count: 1,
      covered_count: 1,
      accepted_ids: ["AC-001"],
      covered_ids: ["AC-001"],
      deferred_ids: ["AC-002"],
    });
    expect(result.facts.phase_rows[1].acs).toContain("AC-002");

    const notApplicableSpec = spec.replace("**AC-002**：", "**AC-002 (not_applicable)**：");
    const notApplicable = validatePostPhaseContract({ spec: notApplicableSpec, index, phases });
    expect(notApplicable.facts.ac_coverage.accepted_ids).toEqual(["AC-001"]);
    expect(notApplicable.facts.ac_coverage.deferred_ids).toEqual([]);
  });

  it("rejects a missing Phase file even if a monolithic plan is present", () => {
    const result = validatePostPhaseContract({ spec, index, phases: { "phases/P1.md": phases["phases/P1.md"] }, plan: Object.values(phases).join("\n") });
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/phases\/P2\.md/);
  });

  it("accepts independent parallel Phases with no artificial serial edge", () => {
    const parallel = { ...phases, "phases/P2.md": phases["phases/P2.md"].replace("**Dependency**：`P1`", "**Dependency**：`none`") };
    const parallelIndex = index.replace("| `P2` | `phases/P2.md` | `phase-p2` | `src/second.mjs` | `P1` |", "| `P2` | `phases/P2.md` | `phase-p2` | `src/second.mjs` | `none` |");
    const result = validatePostPhaseContract({ spec, index: parallelIndex, phases: parallel });
    expect(result.ok, result.errors.join("; ")).toBe(true);
  });

  it("rejects index/body write-set drift and duplicated Phase identity", () => {
    const drifted = { ...phases, "phases/P2.md": phases["phases/P2.md"].replace("**Write set**：`src/second.mjs`", "**Write set**：`src/other.mjs`") };
    const result = validatePostPhaseContract({ spec, index, phases: drifted });
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/write set/i);
  });

  it("rejects overlapping write ownership and index/body consumer drift", () => {
    const duplicate = { ...phases, "phases/P2.md": phases["phases/P2.md"].replace("`src/second.mjs`", "`src/first.mjs`") };
    const duplicateIndex = index.replace("`src/second.mjs`", "`src/first.mjs`");
    expect(validatePostPhaseContract({ spec, index: duplicateIndex, phases: duplicate }).errors.join("; ")).toMatch(/write set duplicates/);
    const drift = { ...phases, "phases/P2.md": phases["phases/P2.md"].replace("**Consumer**：build-code", "**Consumer**：verify-code") };
    expect(validatePostPhaseContract({ spec, index, phases: drift }).errors.join("; ")).toMatch(/consumer differs/);
  });

  it("rejects an index that copies an executable command", () => {
    const result = validatePostPhaseContract({ spec, index: `${index}\n- gate_cmd: node --test tests/p1.test.mjs\n`, phases });
    expect(result.ok).toBe(false);
    expect(result.errors.join("; ")).toMatch(/pointer|command/i);
  });

  it("uses the Phase files as the strict post build-plan analysis inputs", () => {
    const snapshot = "b".repeat(40);
    const evidence = [
      ["decision-log", "decision"], ["spec", "specification"], ["phase-index", "phase_index"],
      ["phases/P1.md", "phase"], ["phases/P2.md", "phase"],
    ].map(([ref, kind]) => ({ ref, kind, status: "fresh", hash: "a".repeat(64), snapshot_tree: snapshot }));
    const packet = {
      activation_cohort: "post",
      materials: { original_requirement: "用户希望结果可见、错误保真", decision_log: "# Decision\n\nR-001", spec, phase_index: index, phases },
      original_requirements: [{ id: "R-001", summary: "结果可见、错误保真" }],
      coverage: [{
        requirement_id: "R-001", expected_behavior: "结果可见、错误保真", actual_behavior: "结果可见、错误保真",
        semantic_status: "completed", status: "covered", scenario_refs: ["SCN-001"], oracle_refs: ["ORACLE-P1", "ORACLE-P2"],
        artifact_refs: ["spec", "phase_index"], evidence_refs: ["spec", "phase-index", "phases/P1.md", "phases/P2.md"],
      }],
      evidence,
    };
    const result = contracts.validateStageSpecAnalyzeProfile({ stage: "build-plan", packet, strict_material_contracts: true, identity: { activation_cohort: "post", snapshot_tree: snapshot } });
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.facts.required_evidence).toContain("phases/P2.md");
    const missing = contracts.validateStageSpecAnalyzeProfile({ stage: "build-plan", packet: { ...packet, materials: { ...packet.materials, phases: { "phases/P1.md": phases["phases/P1.md"] } } }, strict_material_contracts: true, identity: { activation_cohort: "post", snapshot_tree: snapshot } });
    expect(missing.ok).toBe(false);
    expect(missing.errors.join("; ")).toMatch(/phases\/P2\.md/);
  });

  it("keeps non-UI command/service acceptance executable without an E2E verdict when scope is not_required", () => {
    const scenarios = JSON.stringify([
      { source: "command", sample: "input", scenario: "run", tier: "command", execution: { command: "node", args: [], timeout_ms: 1000 } },
      { source: "service", sample: "input", scenario: "run", tier: "service", execution: { module_ref: "runtime/example.mjs", export_name: "run", input: {}, timeout_ms: 1000 } },
    ]);
    const phase = `# Phase P5\n\n## L1 — Contract\n\n### T011 — acceptance\n\n- **Source / FR / AC**: FR-001 / AC-REVIEW-001\n- **acceptance_role**: acceptance\n- **ui_scope**: non_ui\n- **e2e_scope**: not_required\n- **acceptance_data**: \`${scenarios}\`\n\n## L2 — Removable reference\n`;
    const index = `# Phase index\n\n## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n${[1, 2, 3, 4, 5].map((n) => `| \`P${n}\` | \`phases/P${n}.md\` |`).join("\n")}\n`;
    const phases = Object.fromEntries([1, 2, 3, 4, 5].map((n) => [`phases/P${n}.md`, n === 5 ? phase : `# Phase P${n}`]));
    const materials = { "decision-log.md": "# Decision log\n", "spec.md": "# Specification\n", "phases/index.md": index, ...phases };
    const projection = contracts.projectPostPhaseAcceptanceExecutionData({
      index,
      phases,
      spec: materials["spec.md"],
    });

    expect(projection, projection.errors.join("; ")).toMatchObject({
      status: "ready",
      requires_execution: true,
      requires_independent_verdict: false,
      scenarios: [{ tier: "command" }, { tier: "service" }],
    });
    const evidence = readCurrentE2eAcceptanceEvidence({
      task: { manifest: { activation_cohort: "post" } },
      artifacts: {
        read(name) {
          if (Object.hasOwn(materials, name)) return materials[name];
          const error = new Error(`missing fixture: ${name}`);
          error.code = "ENOENT";
          throw error;
        },
      },
    });
    expect(evidence).toEqual({ required: false });

    const verdictRequired = contracts.projectPostPhaseAcceptanceExecutionData({
      index,
      phases: { ...phases, "phases/P5.md": phase.replace("e2e_scope**: not_required", "e2e_scope**: high_risk_user_visible") },
      spec: materials["spec.md"],
    });
    expect(verdictRequired.requires_independent_verdict).toBe(true);
  });

  it("keeps CARD-05 D-044 acceptance incomplete when current canonical proof is absent", () => {
    const phase = readFileSync(new URL("../../specs/archive/workflowhub-thin-core-card-05-20260919/phases/P5.md", import.meta.url), "utf8");
    const line = phase.split("\n").find((value) => value.startsWith("- **acceptance_data**："));
    const data = JSON.parse(line.match(/`(.+)`/)[1]);
    expect(data).toHaveLength(1);
    const { command, args } = data[0].execution;
    expect(command).toBe("node");
    expect(args.at(-1)).toBe("${TASK_DIR}");
    expect(args[1]).not.toMatch(/spawnSync\(['"]npx/);
    expect(args[1]).toContain("P5-T011-D044-focused-'+snap+");
    expect(args[1]).toContain("receipt.snapshot_tree===snap");

    const result = spawnSync(command, [args[0], args[1], "/nonexistent/card05-task-store"], {
      cwd: process.cwd(), encoding: "utf8", timeout: 30000,
    });
    const output = JSON.parse(result.stdout);
    expect(result.status).toBe(1);
    expect(output.entries.map((entry) => entry.acceptance_criterion_id)).toEqual([
      "AC-REVIEW-001", "AC-REVIEW-002", "AC-REVIEW-003", "AC-REVIEW-004",
      "AC-REVIEW-006", "AC-REVIEW-007", "AC-REVIEW-009", "AC-REVIEW-011", "AC-REVIEW-013",
    ]);
    expect(output.entries.every((entry) => entry.outcome === "incomplete"
      && entry.assertions.some((assertion) => assertion.expected !== assertion.actual))).toBe(true);
  });
});
