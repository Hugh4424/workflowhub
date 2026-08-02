import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("per-invocation documentation contract", () => {
  it("keeps constitution and checklist aligned on execution identity", () => {
    const constitution = read("CONSTITUTION.md");
    const checklist = read("constitution-checklist.md");
    expect(constitution).toMatch(/Version\*\*: 1\.5\.0/);
    for (const term of ["当次执行身份", "clean", "不是质量裁决"]) expect(constitution).toContain(term);
    for (const term of ["F6", "F8", "F9", "Q3", "dirty 内容"]) expect(checklist).toContain(term);
    expect((checklist.match(/^- \[ \] \*\*/gm) ?? [])).toHaveLength(21);
  });

  it("uses per-invocation identity while keeping old replacement records audit-only", () => {
    const adr = read("docs/adr/0008-same-task-recovery-is-append-only.md");
    const contract = read("docs/contracts/task-context.md");
    expect(adr).toMatch(/已废止.*历史背景/s);
    expect(adr).toMatch(/只保留审计价值/i);
    expect(contract).toContain("execution_mode=per_invocation");
    expect(contract).toContain("identity/executions/<run>.json");
    expect(contract).toMatch(/旧任务只读保留为审计资料/i);
    expect(contract.replace(/\s+/g, " ")).toMatch(/不验证、也不跟随其 historical runner、migration 或 replacement 链/i);
    expect(contract).not.toContain("legacy_pinned");
    expect(contract).not.toContain("phase-pointer");
  });
});
