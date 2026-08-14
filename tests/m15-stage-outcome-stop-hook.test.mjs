import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const hook = join(process.cwd(), "tools", "host", "workflowhub-stage-outcome-stop-hook.mjs");
const protocol = join(process.cwd(), "tools", "host", "workflowhub-stage-agent-protocol.mjs");

function runHook(outcomePath, input = { stop_hook_active: false }) {
  const result = spawnSync(process.execPath, [hook], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: {
      ...process.env,
      WORKFLOWHUB_STAGE: "build-code",
      WORKFLOWHUB_STAGE_OUTCOME_PATH: outcomePath,
    },
  });
  expect(result.status).toBe(0);
  return JSON.parse(result.stdout);
}

describe("WorkflowHub Stage Agent stop hook", () => {
  it("keeps the same real session alive until the packet exists", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-stop-hook-"));
    const outcomePath = join(root, "stage-outcome.json");
    const missing = runHook(outcomePath);
    expect(missing.decision).toBe("block");
    expect(missing.reason).toContain(outcomePath);

    writeFileSync(outcomePath, "{}\n");
    const ready = runHook(outcomePath, { stop_hook_active: true });
    expect(ready).toEqual({ decision: "approve", suppressOutput: true });
  });

  it("ships a stage-specific analyzer shape instead of empty placeholders", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-stage-template-"));
    try {
      const outputPath = join(root, "stage-outcome-template.json");
      const result = spawnSync(process.execPath, [protocol, "write-template", "--output", outputPath, "--runtime-root", process.cwd(), "--stage", "build-code"], {
        encoding: "utf8",
      });
      expect(result.status).toBe(0);
      const template = JSON.parse(readFileSync(outputPath, "utf8"));
      expect(template.spec_analyze.implementation_material).toContain("required for build-code");
      expect(template.spec_analyze.implementation_evidence_subject).toEqual({
        subject_kind: "step",
        subject_id: "implement-change",
      });
      expect(Object.keys(template.spec_analyze.evidence_subjects)).toEqual([
        "decision-log", "spec", "plan", "tasks", "implementation", "tests", "ac-trace",
      ]);
      expect(template.spec_analyze.packet.original_requirements[0]).toHaveProperty("id");
      expect(template.spec_analyze.packet.coverage[0]).toHaveProperty("requirement_id");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
