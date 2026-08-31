import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(join(fileURLToPath(new URL(".", import.meta.url)), "../.."));
const whitelistSources = [
  "runtime/stage/stage-handlers.mjs",
  "runtime/stage/stage-runner.mjs",
  "runtime/task/task-kernel-implementation.mjs",
  "runtime/evidence/canonical-evidence-validators.mjs",
];

describe("stage-reflection quality path contract", () => {
  it.each(whitelistSources)("registers quality/stage-reflection in %s", (relativePath) => {
    const source = readFileSync(join(repoRoot, relativePath), "utf8");
    expect(source).toContain("quality/stage-reflection/");
  });

  it("keeps stage-reflection out of the quality-fact schema channel", () => {
    const source = readFileSync(join(repoRoot, "runtime", "schemas", "quality-fact.v1.json"), "utf8");
    expect(source).not.toContain("stage-reflection");
    expect(source).not.toContain('"record_kind"');
  });
});
