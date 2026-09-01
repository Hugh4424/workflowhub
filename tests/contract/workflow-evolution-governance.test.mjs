import { describe, expect, it } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "../..");
describe("M16 governance registration", () => {
  it("registers each production module and private adapter with a real consumer", () => {
    const moveMap = JSON.parse(readFileSync(resolve(root, "docs/architecture/move-map.json"), "utf8"));
    const production = ["runtime/evidence/workflow-evolution.mjs", "runtime/schemas/workflow-evolution.v1.json", "tools/cli/generate-iteration-brief.mjs", "tools/cli/record-evolution-result.mjs", "tools/cli/check-skill-updates.mjs", "tools/cli/derive-consumption-edges.mjs", "tools/cli/build-reflection-page.mjs", "tools/cli/build-reflection-page-template.html"];
    for (const file of production) {
      const entry = [...moveMap.entries].reverse().find((value) => value.destination === file);
      expect(entry, `missing move-map entry for ${file}`).toBeTruthy();
      const bytes = readFileSync(resolve(root, file));
      expect(entry.bytes, `${file} bytes`).toBe(statSync(resolve(root, file)).size);
      expect(entry.sha256_after, `${file} sha256`).toBe(createHash("sha256").update(bytes).digest("hex"));
      for (const field of ["owner", "consumer", "delete_condition"]) expect(entry[field], `${file} ${field}`).toBeTruthy();
    }
    for (const object of ["evolution-candidates.jsonl", "attempted-edits.jsonl", "negative-results.jsonl", "iteration-brief.md"]) {
      const entries = moveMap.entries.filter((value) => typeof value.destination === "string" && value.destination.endsWith(object));
      expect(entries).toHaveLength(1);
      expect(entries[0].status).toBe("logical-object");
    }
    expect(moveMap.entries.some((entry) => /tests\/(?:contract|e2e|fixtures)\/.+workflow-evolution/.test(entry.destination ?? ""))).toBe(false);
  });

  it("keeps browser and final gates fail-closed and atomic", () => {
    const browser = readFileSync(resolve(root, "tests/fixtures/workflow-evolution/run-browser-qa.sh"), "utf8");
    const aggregate = readFileSync(resolve(root, "tests/fixtures/workflow-evolution/run-final-aggregate.sh"), "utf8");
    const review = readFileSync(resolve(root, "tests/fixtures/workflow-evolution/run-final-review-chain.mjs"), "utf8");
    expect(browser).toContain("validate-browser-manifest.mjs");
    expect(browser).not.toMatch(/exit 0\s*$/);
    expect(aggregate).toContain("set -euo pipefail");
    expect(aggregate).toContain("atomic-write-final-aggregate.mjs");
    expect(review).not.toContain('status: "unavailable"');
  });
  it("keeps the public runtime surface at seven behaviours", () => {
    const facade = readFileSync(resolve(root, "runtime/interface/runtime-facade.mjs"), "utf8");
    expect(facade).not.toMatch(/RUNTIME_BEHAVIORS[^\n]*evolution|generate-iteration-brief/);
  });
});
