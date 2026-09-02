import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { runSimpleReview } from "../simple-review-runner.mjs";
import { writeAuditEvidenceRecord } from "../../../../tools/cli/run-wh-review-audit-e2e.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function input() {
  const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-simple-e2e-")));
  roots.push(attachmentRoot);
  return { stage: "build-code", host_provider: "codex", materials: { implementation: "current bytes" } };
}

describe("simple review transport and recovery facts", () => {
  it("awaits audit evidence publication and propagates write failures", async () => {
    let completed = false;
    const task = { createRecordAtomic: async () => { await Promise.resolve(); completed = true; } };
    await writeAuditEvidenceRecord(task, "fixtures/audit.json", "{}\n");
    expect(completed).toBe(true);
    await expect(writeAuditEvidenceRecord({ createRecordAtomic: () => { throw new Error("write failed"); } }, "fixtures/audit.json", "{}\n"))
      .rejects.toThrow("write failed");
  });

  it("records malformed provider output as a provider failure while retaining valid sibling findings", async () => {
    const result = await runSimpleReview(input(), {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: roots.at(-1), command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a", "model-b"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a", "model-b"] }),
      client: { async runGroup() {
        return { runtimeId: "runtime", outcome: "partial", providers: [
          { provider: "model-a", status: "completed", identity: { provider: "model-a" }, error: null, output: "not-json", timing: null, usage: null },
          { provider: "model-b", status: "completed", identity: { provider: "model-b" }, error: null, output: JSON.stringify({ findings: [{ severity: "minor", path: "materials/01-implementation.md", line: 1, issue: "gap", recommendation: "fix" }] }), timing: null, usage: null },
        ] };
      } },
    });
    expect(result).toMatchObject({ status: "available", provider_results: [{ status: "failed", error: { code: "OUTPUT_INVALID" } }, { status: "completed" }] });
    expect(result.findings).toHaveLength(1);
  });

  it("returns an honest unavailable result when the review route cannot load", async () => {
    const result = await runSimpleReview(input(), { loadConfig: () => { throw new Error("route unavailable"); } });
    expect(result).toMatchObject({ status: "unavailable", error: { code: "ROUTE_UNAVAILABLE" }, provider_results: [], findings: [] });
  });
});
