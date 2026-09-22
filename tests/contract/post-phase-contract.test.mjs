import { describe, expect, it } from "vitest";

import * as contracts from "../../runtime/stage/stage-content-contracts.mjs";

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
- **Dependency**：\`${dependency}\`.
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
    const drifted = { ...phases, "phases/P2.md": phases["phases/P2.md"].replace("**Dependency**：`P1`.", "**Dependency**：`T999`.") };
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
});
