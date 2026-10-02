import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, test } from "vitest";

import { buildRunnerRelease } from "../../runtime/distribution/runner-release.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
// Freeze the retained-document comparison at the task's implementation base;
// the earlier T1 archive is intentionally not the baseline because T2 was
// archived before this task started.
const BASE = "c33acd3b36d59ea37c97e3784706a8a57fd6f0b7";
const TEMP_ROOTS = [];
const PRODUCTION_OBJECT_GRAPH = [
  "runtime/evidence/quality-store.mjs",
  "runtime/stage/completion-predicates.mjs",
  "runtime/stage/current-close-projection.mjs",
  "runtime/stage/stage-agent-outcome-adapter.mjs",
  "runtime/stage/stage-handlers.mjs",
  "runtime/stage/stage-runner.mjs",
  "runtime/task/task-handle.mjs",
  "runtime/task/task-kernel-implementation.mjs",
  "runtime/task/task-store.mjs",
  "tools/cli/produce-final-current-snapshot.mjs",
  "tools/cli/stage-runtime.mjs",
  "tools/cli/task-bootstrap.mjs",
  "tools/cli/task-close.mjs",
  "tools/architecture/verify-final-coverage.mjs",
];
const RETIRED_DISPOSITIONS = new Set(["remove", "removed", "retired", "tombstone", "superseded"]);

afterEach(() => TEMP_ROOTS.splice(0).forEach((entry) => fs.rmSync(entry, { recursive: true, force: true })));

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function retiredOrAbsent(controls, id) {
  const entry = controls.find((item) => item.id === id);
  return !entry || RETIRED_DISPOSITIONS.has(entry.disposition);
}

describe("Tier-C quality verify deletion boundary", () => {
  test("removes the named quality/verify object graph from active production code", () => {
    const residuals = PRODUCTION_OBJECT_GRAPH.flatMap((relativePath) => {
      const source = read(relativePath);
      return /quality\/verify\.json|quality-verify\.v1|publishVerifySummary|VERIFY_SUMMARY_WRITERS/.test(source)
        ? [relativePath]
        : [];
    });
    expect(residuals).toEqual([]);
    expect(fs.existsSync(path.join(ROOT, "runtime/schemas/quality-verify.v1.json"))).toBe(false);
    expect(read("runtime/task/task-store.mjs")).not.toMatch(/quality-verify\.v1/);
  });

  test("removes status/product-release derived output fields while retaining the close reader", () => {
    const stageRuntime = read("tools/cli/stage-runtime.mjs");
    for (const field of ["product_release_status", "product_release_reasons", "product_release_input_refs", "status_groups", "deriveStatusGroups"]) {
      expect(stageRuntime).not.toContain(field);
    }
    const projection = read("runtime/stage/current-close-projection.mjs");
    expect(projection).not.toContain("product_release");
    expect(projection).toContain("deriveCurrentCloseProjection");
    expect(projection).toContain("status_matrix");
    expect(projection).toContain("identity");
    expect(projection).toContain("source_completeness");
  });

  test("uses explicit Runner data dependencies and omits the deleted schema from the release", async () => {
    const runnerSource = read("runtime/distribution/runner-release.mjs");
    expect(runnerSource).not.toMatch(/filesUnder\(root,\s*["']runtime\/schemas/);
    expect(runnerSource).not.toMatch(/readdirSync\([^\n]*runtime\/schemas/);

    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-tier-c-runner-"));
    TEMP_ROOTS.push(outputDir);
    const release = await buildRunnerRelease({ packageRoot: ROOT, outputDir });
    const paths = release.files.map(({ path: locator }) => locator);
    expect(paths).not.toContain("runtime/schemas/quality-verify.v1.json");
    expect(paths).toContain("runtime/schemas/runner-release.schema.json");
  });

  test("records Tier-C retirement and the retained close reader in current governance registries", () => {
    const inventory = JSON.parse(read("docs/architecture/control-plane-inventory.json"));
    expect(retiredOrAbsent(inventory.controls, "verify-summary-writer")).toBe(true);
    expect(retiredOrAbsent(inventory.controls, "gap-root-cause")).toBe(true);
    const projection = inventory.controls.find((item) => item.id === "current-close-projection");
    expect(projection).toMatchObject({ disposition: "retain" });
    expect(`${projection.consumer} ${projection.effect}`).not.toMatch(/product_release|quality\/verify/);

    const deletion = read("docs/architecture/deletion-plan.json");
    const moveMap = read("docs/architecture/move-map.json");
    const repositoryInventory = read("docs/architecture/repository-inventory.tsv");
    for (const registry of [deletion, moveMap, repositoryInventory]) {
      expect(registry).toContain("runtime/schemas/quality-verify.v1.json");
      expect(registry).toMatch(/C6|Tier-C|remove|delete|retire|supersed/i);
    }
    expect(repositoryInventory).not.toMatch(/^runtime\/schemas\/quality-verify\.v1\.json\tkeep\t/m);
  });

  test("updates active governance and the public-behavior fixture without rewriting immutable history", () => {
    const activeDocs = [
      "AGENTS.md",
      "CONTEXT.md",
      "docs/adr/0017-stage-quality-fact-freshness-scope.md",
      "docs/adr/0020-close-five-actions-quality-transcription.md",
      "docs/adr/0029-current-ac-and-close-state.md",
      "docs/adr/0030-mechanism-simplification-deletion-boundary.md",
      "docs/standard-workflow.md",
    ].map(read).join("\n");
    expect(activeDocs).toContain("quality-verify.v1.json");
    expect(activeDocs).toMatch(/C6|Tier-C/);

    const fixture = read("tests/fixtures/public-behavior-baseline/v1/candidate.json");
    expect(fixture).not.toMatch(/product_release|quality\/verify\.json|quality-verify\.v1/);
    expect(() => execFileSync("git", ["diff", "--quiet", BASE, "--", "docs/research", "specs/archive"], { cwd: ROOT })).not.toThrow();
  });
});
