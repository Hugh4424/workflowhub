import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("verify-code original requirement replay contract", () => {
  it("requires reverse replay of requirements, design, and the full user journey", () => {
    const skill = readFileSync("workflows/verify-code/SKILL.md", "utf8");
    for (const term of [
      "原始需求回放",
      "R*/F*/D*",
      "INC-001",
      "Design",
      "完整用户流程",
      "pass",
      "fail",
      "unknown",
      "deferred",
      "unavailable",
      "snapshot",
      "provenance",
      "quality/tests/research.json",
      "422f4044bfc68952c8ca917057e6930e51f7825943b49a0727e1b2936457ffe0",
      "requirement_replay",
      "source_id",
      "linked_ids",
      "evidence_refs",
      "material-only",
      "证据缺失不能算 pass",
    ]) {
      expect(skill).toContain(term);
    }
  });
});
