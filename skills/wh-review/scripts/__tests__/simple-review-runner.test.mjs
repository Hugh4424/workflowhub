import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { runSimpleReview } from "../simple-review-runner.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("simple material-only review", () => {
  it("reviews submitted bytes without Workspace or TaskHandle", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-")));
    roots.push(attachmentRoot);
    const calls = [];
    const result = await runSimpleReview({
      stage: "make-decision",
      review_track: "detail",
      host_provider: "codex",
      task_path: "/does/not/exist",
      project_name: "ignored",
      task_id: "ignored",
      materials: { decision: "current decision bytes" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other/model"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["other/model"] }),
      client: {
        async runGroup(request) {
          calls.push({
            prompt: request.prompt,
            instructions: readFileSync(join(request.materials.bundleRoot, "review-instructions.md"), "utf8"),
            decision: readFileSync(join(request.materials.bundleRoot, "materials/01-decision.md"), "utf8"),
          });
          return {
            runtimeId: "runtime-1", outcome: "completed",
            providers: [{
              provider: "other/model", status: "completed", identity: { provider: "other/model" }, error: null,
              output: JSON.stringify({ findings: [{ severity: "minor", path: "materials/01-decision.md", line: 1, issue: "gap", recommendation: "fix" }] }),
              timing: null, usage: null,
            }],
          };
        },
      },
    });
    expect(result).toMatchObject({ status: "available", stage: "make-decision", review_track: "detail" });
    expect(result.findings).toHaveLength(1);
    expect(result.provider_results[0].evidence_anchor_valid).toEqual([true]);
    expect(calls).toHaveLength(1);
    expect(calls[0].decision).toBe("current decision bytes");
    expect(calls[0].instructions).toContain("complete user flow");
    expect(calls[0].prompt).toContain("Return exactly one JSON object");
    expect(calls[0].prompt).toContain("sample below.\n\nExample of a complete finding:");
    expect(calls[0].prompt).not.toContain("sample below.\\n\\n");
  });

  it("requires only stage, host provider, and materials", async () => {
    await expect(runSimpleReview({ stage: "make-decision", host_provider: "codex", materials: {} }))
      .rejects.toThrow("materials are required");
  });

  it("marks a single provider as failed when its output is malformed and keeps other provider findings", async () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "simple-wh-review-bad-output-")));
    roots.push(attachmentRoot);
    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      materials: { raw_requirement: "requirement", spec: "spec body" },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
      resolveRoute: () => ({ initial: ["model-a", "model-b"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["model-a", "model-b"] }),
      client: {
        async runGroup() {
          return {
            runtimeId: "runtime-bad", outcome: "partial",
            providers: [
              {
                provider: "model-a", status: "completed", identity: { provider: "model-a" }, error: null,
                output: "not-json", timing: null, usage: null,
              },
              {
                provider: "model-b", status: "completed", identity: { provider: "model-b" }, error: null,
                output: JSON.stringify({ findings: [{ severity: "major", path: "materials/02-spec.md", line: 3, issue: "gap", recommendation: "fix", root_cause: "missing test", evidence_kind: "direct", evidence: "none" }] }),
                timing: null, usage: null,
              },
            ],
          };
        },
      },
    });
    expect(result).toMatchObject({ status: "available", stage: "build-code" });
    expect(result.provider_results).toHaveLength(2);
    expect(result.provider_results[0]).toMatchObject({ provider: "model-a", status: "failed", error: { code: "OUTPUT_INVALID" } });
    expect(result.provider_results[1]).toMatchObject({ provider: "model-b", status: "completed" });
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ severity: "major", path: "materials/02-spec.md", provider: "model-b" });
    expect(result.provider_results[1].evidence_anchor_valid).toEqual([false]);
    expect(result).not.toHaveProperty("error_code");
    expect(result).not.toHaveProperty("attempt_ref");
  });

  it("RESULT_PROMPT contains a parseable sample finding", async () => {
    const source = readFileSync(new URL("../simple-review-runner.mjs", import.meta.url), "utf8");
    const match = source.match(/Example of a complete finding:\\n(\{[\s\S]*\})\\nExample of an empty result/);
    expect(match).toBeTruthy();
    const sample = match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    const parsed = JSON.parse(sample);
    expect(parsed.findings).toHaveLength(1);
    expect(parsed.findings[0]).toHaveProperty("severity");
    expect(parsed.findings[0]).toHaveProperty("evidence_kind");
  });

  it("returns a recordable unavailable result when route loading fails", async () => {
    const result = await runSimpleReview({
      stage: "verify-code",
      host_provider: "codex/luna",
      materials: { implementation: "implementation bytes" },
    }, {
      loadConfig: () => { throw new Error("route config is unavailable"); },
    });
    expect(result).toMatchObject({
      status: "unavailable",
      error: { code: "ROUTE_UNAVAILABLE" },
      runtime_id: null,
      provider_results: [],
      findings: [],
    });
    expect(result.material_id).toMatch(/^[a-f0-9]{64}$/);
  });
});
