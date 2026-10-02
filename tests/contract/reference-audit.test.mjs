import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { auditReferences, classifyReferenceAudit } from "../../tools/architecture/reference-audit.mjs";

describe("reference audit", () => {
  it("audits every control-plane slice instead of treating empty targets as zero consumers", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-reference-audit-"));
    mkdirSync(join(root, "runtime/task"), { recursive: true });
    mkdirSync(join(root, "tests"), { recursive: true });
    writeFileSync(join(root, "runtime/task/consumer.mjs"), "import \"../../core/git-checkpoint.mjs\";\n");
    writeFileSync(join(root, "tests/consumer.test.mjs"), "const old = 'results/build-code/accepted.json';\n");

    const result = auditReferences({ root });
    expect(result.schema_version).toBe("workflowhub-reference-audit.v2");
    expect(result.targets).toEqual(expect.arrayContaining([
      "core/git-checkpoint.mjs",
      "results/build-code/accepted.json",
      "evidence/phases/",
    ]));
    expect(result.violations).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "runtime/task/consumer.mjs", target: "core/git-checkpoint.mjs", match: "relative-import", scope: "live" }),
    ]));
    expect(result.test_references).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "tests/consumer.test.mjs", target: "results/build-code/accepted.json", scope: "test" }),
    ]));
  });

  it("classifies registered KEEP targets without hiding unexpected consumers", () => {
    const result = {
      violations: [
        { path: "runtime/a.mjs", target: "core/git-checkpoint.mjs" },
        { path: "runtime/b.mjs", target: "unknown-retired-path" },
      ],
      metadata_references: [],
    };
    const classified = classifyReferenceAudit(result, new Set(["core/git-checkpoint.mjs"]));
    expect(classified.allowed_violations).toHaveLength(1);
    expect(classified.unexpected_violations).toEqual([
      { path: "runtime/b.mjs", target: "unknown-retired-path" },
    ]);
  });
});
