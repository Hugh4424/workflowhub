import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildMetricsEnabledReport } from "../../runtime/evidence/check-skill-closure.mjs";

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/metrics-scan/catalog.json",
);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const checkerPath = path.join(repositoryRoot, "runtime/evidence/check-skill-closure.mjs");

describe("metrics-enabled report", () => {
  it("reports every disabled core skill and ignores disabled non-core skills", () => {
    const catalog = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
    const report = buildMetricsEnabledReport({
      catalog,
      coreSkillNames: ["core-runtime", "core-dependent"],
    });

    expect(report).toEqual({
      core_skills: ["core-dependent", "core-runtime"],
      disabled_core_skills: ["core-runtime"],
      missing_core_skills: [],
      ok: false,
    });
  });

  it("does not silently omit a core skill whose metric declaration is missing", () => {
    const report = buildMetricsEnabledReport({
      catalog: { skills: [{ name: "core-runtime" }] },
      coreSkillNames: ["core-runtime"],
    });

    expect(report.disabled_core_skills).toEqual([]);
    expect(report.missing_core_skills).toEqual(["core-runtime"]);
    expect(report.ok).toBe(false);
  });

  it("emits the metrics report from the existing real catalog checker entrypoint", () => {
    const result = spawnSync(process.execPath, [checkerPath, repositoryRoot], { encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);

    const output = JSON.parse(result.stdout);
    expect(output.ok).toBe(true);
    expect(output.metrics_enabled_report).toMatchObject({
      disabled_core_skills: [],
      missing_core_skills: [],
      ok: true,
    });
    expect(output.metrics_enabled_report.core_skills).toContain("stage-reflection");
  });
});
