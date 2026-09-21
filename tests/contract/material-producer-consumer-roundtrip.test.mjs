import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");

describe("material producer and consumer round-trip", () => {
  it("RED: makes the phase the sole engineering body and tasks a pure execution index", () => {
    const phaseTemplate = read("skills/spec-plan/templates/plan-template.md");
    const indexTemplate = read("skills/spec-tasks/templates/tasks-template.md");
    const phaseSkill = read("skills/spec-plan/SKILL.md");
    const indexSkill = read("skills/spec-tasks/SKILL.md");

    expect(`${phaseSkill}\n${phaseTemplate}`).toMatch(/single phase engineering authority|单一 phase 工程权威/i);
    expect(phaseTemplate).toMatch(/^## Phase P1/m);
    expect(phaseTemplate).toMatch(/L0[\s\S]{0,120}(?:Goal|目标)/i);
    expect(phaseTemplate).toMatch(/L1[\s\S]{0,120}(?:contract|契约)/i);
    expect(phaseTemplate).toMatch(/L2[\s\S]{0,120}(?:reference|参考)/i);

    expect(`${indexSkill}\n${indexTemplate}`).toMatch(/pure pointer|纯指针/i);
    expect(indexTemplate).toMatch(/^## (?:Execution )?Index|^## 执行索引/m);
    expect(indexTemplate).toMatch(/(?:authority|权威).*(?:semantic anchor|语义锚点).*(?:write set|写集).*(?:consumer|消费者)/i);
    expect(indexTemplate).not.toMatch(/^## Phase P1/m);
    expect(indexTemplate).not.toMatch(/^#### T\d+ /m);
    expect(indexTemplate).not.toMatch(/^### (?:Goal|Files|Tasks|Verify|Knowledge|STOP|Done|Risks and rollback)$/m);

    const phaseBody = phaseTemplate.slice(phaseTemplate.indexOf("## Phase P1"));
    expect(phaseBody.length).toBeGreaterThan(0);
    expect(indexTemplate).not.toContain(phaseBody);
  });
});
