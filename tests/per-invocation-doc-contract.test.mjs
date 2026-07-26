import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("per-invocation documentation contract", () => {
  it("keeps constitution and checklist aligned on execution identity", () => {
    const constitution = read("CONSTITUTION.md");
    const checklist = read("constitution-checklist.md");
    expect(constitution).toMatch(/Version\*\*: 1\.4\.0/);
    for (const term of ["per-invocation", "clean", "不是质量裁决"]) expect(constitution).toContain(term);
    for (const term of ["F6", "F8", "F9", "Q3", "dirty runner"]) expect(checklist).toContain(term);
    expect((checklist.match(/^- \[ \] \*\*/gm) ?? [])).toHaveLength(21);
  });

  it("makes runner replacement legacy-only while preserving Phase recovery", () => {
    const adr = read("docs/adr/0008-same-task-recovery-is-append-only.md");
    const contract = read("docs/contracts/task-context.md");
    for (const text of [adr, contract]) {
      expect(text).toContain("legacy_pinned");
      expect(text).toContain("per_invocation");
      expect(text).toContain("phase-pointer");
    }
    expect(adr).toMatch(/runner replacement.*遗留|遗留.*runner replacement/s);
    expect(contract).toContain("identity/executions/<run>.json");
    expect(contract).toContain("identity/migrations/per-invocation/<previous-manifest-hash>.json");
  });
});
