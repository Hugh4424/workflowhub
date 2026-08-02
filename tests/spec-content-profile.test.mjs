import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { validateSpecContentProfile } from "../runtime/stage/stage-content-contracts.mjs";

describe("current specification contract", () => {
  it("requires a readable current spec, a revision note, and real independent review", () => {
    const workflow = readFileSync(new URL("../workflows/build-spec/SKILL.md", import.meta.url), "utf8");
    for (const term of [
      "current four materials",
      "stable ID",
      "current-material revision note",
      "independent `wh-review`",
      "never a pass",
    ]) expect(workflow).toContain(term);
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

## 6. 模块划分
N/A — 没有跨模块职责变化。

## 7. 关键实体
N/A — 没有实体变化。

## 8. 数据和生命周期
N/A — 没有数据生命周期变化。

## 9. 兼容性预留
N/A — 既有行为保持不变。

## 10. 明确不做与默认必须成立

### 明确不做
- 不改变既有用户数据。

## 11. 验收标准
- [ ] **AC-01**：用户看到结果

## 12. 风险、未决与交接
N/A — 已检查范围和验收边界，未发现未决项。

## 13. 业务影响与回归范围
回归既有主路径。
`;

describe("generated spec Markdown profile", () => {
  it("accepts clean product-only Markdown", () => {
    expect(validateSpecContentProfile(cleanSpec)).toMatchObject({ ok: true, errors: [] });
  });

  it("keeps previously published spec-content.v3 headings readable", () => {
    const legacy = cleanSpec
      .replace("## 6. 模块划分", "## 6. 条件式业务合同\n### 6.1 模块职责")
      .replace("## 7. 关键实体", "### 6.2 关键实体")
      .replace("## 8. 数据和生命周期", "### 6.3 数据与生命周期")
      .replace("## 9. 兼容性预留", "### 6.4 兼容性")
      .replace("## 10. 明确不做与默认必须成立", "## 7. 明确不做与默认必须成立")
      .replace("## 11. 验收标准", "## 9. 验收标准")
      .replace("## 12. 风险、未决与交接", "## 10. 风险、未决与交接")
      .replace("## 13. 业务影响与回归范围", "## 8. 业务影响与回归范围");
    expect(validateSpecContentProfile(legacy)).toMatchObject({ ok: true, errors: [] });
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
