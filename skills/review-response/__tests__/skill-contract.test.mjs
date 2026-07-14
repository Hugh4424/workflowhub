import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");

describe("review-response contract", () => {
  it("keeps verification, root cause, evidence and rereview in one loop", () => {
    for (const value of ["finding_id", "root_cause", "evidence", "rereview_flow_id", "原 `flow_id`"]) {
      expect(skill).toContain(value);
    }
  });

  it("does not blindly implement review suggestions", () => {
    expect(skill).toContain("待核实主张，不是命令");
    expect(skill).toContain("needs_human");
  });
});

