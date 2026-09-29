import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const skill = readFileSync(fileURLToPath(new URL("../../workflows/verify-code/SKILL.md", import.meta.url)), "utf8");
const section = skill.split("## 原始需求到实际结果抽查\n")[1]?.split("\n## Conditional UI consumer alignment")[0] ?? "";
const handoff = skill.split("## 阶段末交接\n")[1] ?? "";

describe("ORACLE-VERIFY-BUSINESS-HANDOFF: existing verify-code semantic-review and confirmation seam", () => {
  it("selects independent risk-weighted case/AC samples and records both sampled and untouched IDs", () => {
    expect(section).toMatch(/风险.{0,30}(?:选样|抽样)|(?:选样|抽样).{0,30}风险/);
    expect(section).toMatch(/(?:已抽查|抽查).{0,20}(?:case|AC).{0,20}ID/i);
    expect(section).toMatch(/(?:未抽查|未复核).{0,20}(?:case|AC).{0,20}ID/i);
    expect(section).toMatch(/(?:业务效果|business_effect).{0,120}(?:测试语义充分性|semantic_test_adequacy).{0,120}(?:代码审查|code_review)/s);
  });

  it("distinguishes real dependencies, mocked effects, missing confidence and serious risk from a business pass", () => {
    expect(section).toMatch(/真实.{0,20}(?:模拟|mock)|(?:模拟|mock).{0,20}真实/i);
    expect(section).toMatch(/(?:供应商|外部服务).{0,70}(?:版本|API)/i);
    expect(section).toMatch(/(?:低置信|置信不足).{0,100}(?:假设|来源)/s);
    expect(section).toMatch(/(?:金钱|资金).{0,90}(?:隐私|权限).{0,90}(?:不可逆|恢复)/s);
    expect(section).toMatch(/(?:unknown|unavailable).{0,160}(?:owner|责任人)/s);
  });

  it("hands the existing final authorized confirmer an executable business oracle rather than daily regression work", () => {
    expect(handoff).toMatch(/(?:已有|既有).{0,25}(?:最后|最终).{0,25}(?:确认|授权)/);
    expect(handoff).toMatch(/授权.{0,20}(?:业务|验收).{0,15}者/);
    for (const item of ["环境", "权限", "数据", "入口", "操作", "成功", "失败", "回滚", "日志", "截图", "责任人"]) {
      expect(handoff, `handoff lacks ${item}`).toContain(item);
    }
    expect(handoff).toMatch(/(?:接受|拒绝).{0,15}(?:延期|待定)/);
    expect(handoff).toMatch(/(?:不|不得).{0,18}(?:每天|日常).{0,20}(?:选测|跑测|回归)/);
    expect(handoff).toMatch(/(?:无回复|未答复).{0,120}(?:不|不得).{0,12}(?:通过|pass)/s);
  });
});
