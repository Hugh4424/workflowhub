import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("cohort-specific current material governance", () => {
  it("makes post Phase files and index current while preserving pre/history four materials", () => {
    for (const path of ["AGENTS.md", "CONTEXT.md", "CONSTITUTION.md", "constitution-checklist.md", "docs/standard-workflow.md"]) {
      const doc = read(path);
      expect(doc, path).toContain("phases/P<n>.md");
      expect(doc, path).toContain("phases/index.md");
      expect(doc, path).toMatch(/pre[\s\S]*plan\.md[\s\S]*tasks\.md/i);
      expect(doc, path).toMatch(/post[\s\S]*spec\.md[\s\S]*phases\/P<n>\.md[\s\S]*phases\/index\.md/i);
    }
  });
});
