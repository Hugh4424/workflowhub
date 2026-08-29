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
    expect(calls).toHaveLength(1);
    expect(calls[0].decision).toBe("current decision bytes");
    expect(calls[0].instructions).toContain("complete user flow");
    expect(calls[0].prompt).toContain("Return exactly one JSON object");
  });

  it("requires only stage, host provider, and materials", async () => {
    await expect(runSimpleReview({ stage: "make-decision", host_provider: "codex", materials: {} }))
      .rejects.toThrow("materials are required");
  });
});
