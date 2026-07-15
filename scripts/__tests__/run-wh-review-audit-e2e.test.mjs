import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runAuditE2E } from "../run-wh-review-audit-e2e.mjs";
describe("simple audit E2E", () => {
  it("writes evidence for five stages and both decision tracks", async () => {
    const output = mkdtempSync(join(tmpdir(), "audit-e2e-test-")); const result = await runAuditE2E({ outputRoot: output });
    expect(result.ok).toBe(true); expect(result.records).toHaveLength(6);
    expect(JSON.parse(readFileSync(result.evidence_path, "utf8")).kind).toBe("fake-broker");
  });
});
