import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { buildRunnerRelease } from "../core/runner-release.mjs";
import { stageRuntimeCliMain } from "../scripts/stage-runtime.mjs";

const roots = [];
const packageRoot = new URL("..", import.meta.url).pathname;

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("build-code composition contract", () => {
  it("routes the public Phase action to the canonical producer", async () => {
    const delegated = [];
    await expect(stageRuntimeCliMain([
      "verify",
      "--action=phase",
      "--stage=build-code",
      "--project=Demo",
      "--task=task-one",
      "--input=/tmp/phase.json",
    ], {
      delegate: async (argv) => {
        delegated.push(argv);
        return { ok: true };
      },
    })).resolves.toEqual({ ok: true });
    expect(delegated).toEqual([[
      "publish-phase-evidence",
      "--stage=build-code",
      "--project=Demo",
      "--task=task-one",
      "--input=/tmp/phase.json",
    ]]);
  });

  it("fails loudly for the deleted internal Phase command", async () => {
    await expect(stageRuntimeCliMain([
      "publish-phase-evidence",
      "--stage=build-code",
      "--project=Demo",
      "--task=task-one",
      "--input=/tmp/phase.json",
    ])).rejects.toThrow(/unknown public runtime behavior/i);
  });

  it("ships the canonical Phase producer and excludes task-only migration scaffolding", async () => {
    const outputDir = mkdtempSync(join(tmpdir(), "workflowhub-runner-composition."));
    roots.push(outputDir);
    const release = await buildRunnerRelease({ packageRoot, outputDir });
    const files = release.files.map((entry) => entry.path);

    expect(files).toContain("workflows/build-code/phase-evidence.mjs");
    expect(files).toContain("scripts/stage-runtime.mjs");
    expect(files).not.toContain("core/legacy-reader.mjs");
    expect(files).not.toContain("schemas/legacy-import.v1.json");
    expect(files.some((path) => path.includes("__tests__") || path.startsWith("tests/"))).toBe(false);

    const runtime = readFileSync(join(outputDir, "scripts/stage-runtime.mjs"), "utf8");
    expect(runtime).toContain('import { publishBuildCodePhaseEvidence } from "../workflows/build-code/phase-evidence.mjs"');
  });
});
