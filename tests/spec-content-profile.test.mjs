import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  validateAmbiguityLedgerV2,
  validateSpecContentProfile,
} from "../core/stage-content-contracts.mjs";

const SPEC_HASH = "a".repeat(64);
const binding = (id) => ({
  artifact_kind: "spec",
  ref: "artifacts/spec.md",
  hash: SPEC_HASH,
  id,
});

function legacyLedger(frId = "FR-ACCEPT") {
  return {
    spec_content_hash: SPEC_HASH,
    subject_binding: binding("SPEC"),
    pfacts: [{
      id: "PFACT-01",
      statement: "A legacy fact.",
      status: "verified",
      evidence: [{ ...binding("D1"), artifact_kind: "decision", ref: "decision.md" }],
      affects_frs: [binding(frId)],
      affects_acs: [binding("AC-01")],
    }],
    frs: [{
      id: frId,
      behavior: "A legacy behavior.",
      scope_boundary: "No implementation choice.",
      pfact_refs: [binding("PFACT-01")],
      ac_refs: [binding("AC-01")],
    }],
    acs: [{
      id: "AC-01",
      behavior: "The behavior is observable.",
      fr_refs: [binding(frId)],
      verification_method: "Observe the product result.",
      pass_condition: "The result appears.",
      evidence_type: "manual",
    }],
    risks: [],
  };
}

function currentLedger() {
  const value = legacyLedger("FR-SPEC-001");
  return {
    content_profile: "spec-content.v3",
    ...value,
    scenarios: [{
      id: "SCN-001",
      role: "reader",
      given: "an accepted specification",
      when: "the reader follows the scenario",
      then: "the result is observable",
    }],
    frs: [{
      ...value.frs[0],
      scenario_refs: [binding("SCN-001")],
    }],
    acs: [{
      ...value.acs[0],
      failure_condition: "The result is absent.",
    }],
    open_questions: [],
  };
}

describe("spec-content.v3 typed ledger", () => {
  it("is required by the current build-spec publication workflow while legacy stays read-only", () => {
    const workflow = readFileSync(new URL("../workflows/build-spec/SKILL.md", import.meta.url), "utf8");
    for (const term of [
      'content_profile: "spec-content.v3"',
      "scenario_refs",
      "failure_condition",
      "OPEN cards",
      "read-only",
      "Spec-Purity",
    ]) expect(workflow).toContain(term);
  });

  it("keeps the complete legacy FR grammar readable without new fields", () => {
    for (const id of ["FR-ACCEPT", "FR-ENV01", "FR-01", "FR-SPEC-001"]) {
      expect(validateAmbiguityLedgerV2(legacyLedger(id))).toMatchObject({ ok: true, errors: [] });
    }
  });

  it("accepts scenario/FR/AC closure and rejects unknown profiles", () => {
    expect(validateAmbiguityLedgerV2(currentLedger())).toMatchObject({ ok: true, errors: [] });
    expect(validateAmbiguityLedgerV2({
      ...currentLedger(),
      content_profile: "spec-content.unknown",
    })).toMatchObject({ ok: false });
  });

  it("requires canonical new FR IDs, scenario refs, and AC failure conditions", () => {
    const numeric = { ...currentLedger(), frs: [{ ...currentLedger().frs[0], id: "FR-01" }] };
    expect(validateAmbiguityLedgerV2(numeric).errors.join("\n")).toMatch(/FR-\{DOMAIN\}-\{NNN\}/);

    const noScenario = { ...currentLedger(), frs: [{ ...currentLedger().frs[0], scenario_refs: undefined }] };
    expect(validateAmbiguityLedgerV2(noScenario)).toMatchObject({ ok: false });

    const noFailure = { ...currentLedger(), acs: [{ ...currentLedger().acs[0], failure_condition: undefined }] };
    expect(validateAmbiguityLedgerV2(noFailure)).toMatchObject({ ok: false });
  });

  it("makes PFACT status payloads exclusive", () => {
    const invalid = currentLedger();
    invalid.pfacts = [{
      ...invalid.pfacts[0],
      inference: { source: "guess", limitations: "not verified" },
    }];
    expect(validateAmbiguityLedgerV2(invalid)).toMatchObject({ ok: false });
  });

  it("publishes OPEN cards and binds unknown PFACTs to unresolved work", () => {
    const value = currentLedger();
    value.pfacts = [{
      ...value.pfacts[0],
      status: "unknown",
      evidence: undefined,
      unknown: { owner: "product owner", impact: "acceptance may change" },
    }];
    value.open_questions = [{
      id: "OPEN-01",
      affected_ids: ["PFACT-01", "FR-SPEC-001", "AC-01"],
      owner: "product owner",
      impact: "acceptance may change",
      handling_stage: "build-spec",
      close_condition_or_stop: "Stop until the product owner decides.",
    }];
    expect(validateAmbiguityLedgerV2(value)).toMatchObject({ ok: true, errors: [] });

    value.open_questions = [];
    expect(validateAmbiguityLedgerV2(value).errors.join("\n")).toMatch(/unknown PFACT.*RISK or OPEN/);
  });
});

const cleanSpec = `
# 功能规格：演示

## 速读卡（30 秒）
结果可直接观察。

## 1. 问题与紧迫性
现有流程无法完成目标。

## 2. 背景、目标与范围
只描述产品行为和交付边界。

## 3. 用户场景与状态覆盖
### SCN-001：完成目标
- **Given**：用户已进入流程
- **When**：用户执行动作
- **Then**：结果可见
### 状态覆盖
| 状态 | 结论 | 场景 | 理由 |
| --- | --- | --- | --- |
| 默认 | 适用 | SCN-001 | 主路径 |

## 4. 产品事实与假设（PFACT）
- **PFACT-01**：现有流程可进入

## 5. 功能需求
- **FR-DEMO-001**：用户完成动作后看到结果

## 6. 条件式业务合同
### 6.1 模块职责
N/A — 没有跨模块职责变化。
### 6.2 关键实体
N/A — 没有实体变化。
### 6.3 数据与生命周期
N/A — 没有数据生命周期变化。
### 6.4 兼容性
N/A — 既有行为保持不变。

## 7. 明确不做与默认必须成立

### 明确不做
- 不改变既有用户数据。

## 8. 业务影响与回归范围
回归既有主路径。

## 9. 验收标准
- [ ] **AC-01**：用户看到结果

## 10. 风险、未决与交接
N/A — 已检查范围和验收边界，未发现未决项。
`;

describe("generated spec Markdown profile", () => {
  it("accepts clean product-only Markdown", () => {
    expect(validateSpecContentProfile(cleanSpec)).toMatchObject({ ok: true, errors: [] });
  });

  it("ignores heading-like text inside fenced examples", () => {
    expect(validateSpecContentProfile(`${cleanSpec}\n\`\`\`text\n# 这不是文档标题\n\`\`\``))
      .toMatchObject({ ok: true, errors: [] });
  });

  it("allows a real product placeholder when it is marked as inline code", () => {
    expect(validateSpecContentProfile(`${cleanSpec}\n用户会看到 \`欢迎 {name}\`。`))
      .toMatchObject({ ok: true, errors: [] });
  });

  it.each([
    ["placeholder", `${cleanSpec}\n{待填写}`],
    ["comment", `${cleanSpec}\n<!-- authoring note -->`],
    ["empty heading", `${cleanSpec}\n## 空章节\n## 下一节\n内容`],
    ["code path", `${cleanSpec}\n改动 \`core/runtime.mjs\`.`],
    ["engineering gate", `${cleanSpec}\ngate_cmd: npx vitest run`],
    ["duplicate exclusions", `${cleanSpec}\n### 明确不做\n- 第二份`],
    ["separate assumptions", `${cleanSpec}\n### 假设\n- 另一个真相`],
    ["missing authoritative section", cleanSpec.replace("## 5. 功能需求", "### 功能需求")],
    ["missing SCN card", cleanSpec.replace("### SCN-001：完成目标", "### 主路径")],
    ["malformed SCN identity", cleanSpec.replace("SCN-001", "SCN-DEMO")],
    ["missing PFACT card", cleanSpec.replace("**PFACT-01**", "**事实**")],
    ["missing FR card", cleanSpec.replace("**FR-DEMO-001**", "**需求**")],
    ["malformed FR identity", cleanSpec.replace("FR-DEMO-001", "FR-DEMO-EXTRA-001")],
    ["missing AC card", cleanSpec.replace("**AC-01**", "**验收**")],
  ])("rejects %s residue", (_name, markdown) => {
    expect(validateSpecContentProfile(markdown)).toMatchObject({ ok: false });
  });
});
