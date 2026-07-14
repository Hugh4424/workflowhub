import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const skill = readFileSync(new URL("../SKILL.md", import.meta.url), "utf8");
const context = readFileSync(new URL("../scripts/browser-qa-context.sh", import.meta.url), "utf8");

describe("isolated-browser-qa portability", () => {
  it("resolves from workflowhub package root", () => {
    expect(skill).toContain("workflowhub_package_root");
    expect(skill).not.toMatch(/\/Users\//);
  });

  it("uses workflowhub-owned profile namespace", () => {
    expect(context).toContain(".config/workflowhub/browser-qa-profiles.conf");
    expect(context).toContain("workflowhub-qa-");
  });
});

