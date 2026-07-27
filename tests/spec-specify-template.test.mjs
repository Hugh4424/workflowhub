import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const skill = readFileSync(join(REPO_ROOT, "skills/spec-specify/SKILL.md"), "utf8");
const template = readFileSync(
  join(REPO_ROOT, "skills/spec-specify/templates/spec-template.md"),
  "utf8",
);

describe("spec-specify readable content contract", () => {
  it("uses product identity rather than host task identity", () => {
    expect(template).toContain("- **功能名**：{功能名}");
    expect(template).not.toContain("{task-id}");
  });

  it("keeps the human reading order stable", () => {
    const headings = [
      "## 速读卡（30 秒）",
      "## 1. 问题与紧迫性",
      "## 2. 背景、目标与范围",
      "## 3. 用户场景与状态覆盖",
      "## 4. 产品事实与假设（PFACT）",
      "## 5. 功能需求",
      "## 6. 条件式业务合同",
      "## 7. 明确不做与默认必须成立",
      "## 8. 业务影响与回归范围",
      "## 9. 验收标准",
      "## 10. 风险、未决与交接",
    ];
    const positions = headings.map((heading) => template.indexOf(heading));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
  });

  it("contains scenario identity and all eight state decisions", () => {
    expect(template).toContain("SCN-001");
    for (const state of ["默认", "空", "错误", "加载", "取消", "边界", "权限", "竞态"]) {
      expect(template).toMatch(new RegExp(`\\| ${state} \\|`));
    }
    expect(skill).toContain("link each applicable state to a scenario");
  });

  it("keeps PFACT, FR, and AC trace closure explicit", () => {
    for (const status of ["verified", "inferred", "unknown", "not_applicable"]) {
      expect(template).toContain(status);
    }
    expect(template).toContain("FR-{DOMAIN}-001");
    expect(template).toContain("PFACT IDs");
    expect(template).toContain("SCN IDs");
    expect(template).toContain("AC IDs");
    expect(template).toContain("**失败条件**");
  });

  it("has one exclusion truth and complete conditional business contracts", () => {
    expect(template.match(/^### 明确不做$/gm)).toHaveLength(1);
    expect(template).not.toContain("### 非目标");
    expect(template).not.toContain("### 假设");
    for (const section of ["模块职责", "关键实体", "数据与生命周期", "兼容性"]) {
      expect(template).toContain(section);
    }
  });

  it("preserves risk fields and gives open questions a close contract", () => {
    for (const field of [
      "受影响 ID",
      "触发条件",
      "后果",
      "缓解或 STOP",
      "处理 Stage",
      "验证",
      "owner",
      "关闭条件或 STOP",
    ]) {
      expect(template).toContain(field);
    }
  });
});
