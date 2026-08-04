import { mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runAuditE2E } from "../../tools/cli/run-wh-review-audit-e2e.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { deriveTaskPath } from "../../runtime/task/task-identity.mjs";
describe("simple audit E2E", () => {
  it("writes evidence for five stages and both decision tracks", async () => {
    const output = realpathSync(mkdtempSync(join(tmpdir(), "audit-e2e-test-"))); const result = await runAuditE2E({ outputRoot: output });
    expect(result.ok).toBe(true); expect(result.records).toHaveLength(6);
    const task = openTask(deriveTaskPath(output, "AuditE2E", "audit-e2e"), "AuditE2E", "audit-e2e");
    expect(JSON.parse(task.readRecord(result.evidence_ref)).kind).toBe("fake-broker");
  });
});
