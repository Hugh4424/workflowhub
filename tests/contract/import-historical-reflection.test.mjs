import { afterEach, describe, expect, it } from "vitest";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import {
  buildImportPlan,
  executeImport,
  readPackage,
} from "../../tools/cli/import-historical-reflection.mjs";

const repoRoot = resolve(join(import.meta.dirname, "../.."));
const packageRoot = join(repoRoot, "tests/fixtures/historical-import/sample-package");
const fixtureTranscripts = Array.from({ length: 20 }, (_value, index) => `/tmp/workflowhub-historical-import-fixture-${String(index + 1).padStart(2, "0")}.jsonl`);
const roots = [];

function prepareTranscripts() {
  for (const path of fixtureTranscripts) writeFileSync(path, "fixture transcript\n", "utf8");
}

function readRows(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  for (const path of fixtureTranscripts) rmSync(path, { force: true });
});

describe("historical reflection import contract", () => {
  it("validates the recovered package shape and builds a 20-entry project split", () => {
    prepareTranscripts();
    const packageData = readPackage(packageRoot);
    expect(packageData.transcriptIndex).toHaveLength(20);
    expect(packageData.historicalRecords).toHaveLength(20);

    const storageRoot = mkdtempSync(join(tmpdir(), "workflowhub-historical-import-plan-"));
    roots.push(storageRoot);
    const plan = buildImportPlan({ inputRoot: packageRoot, storageRoot, now: "2026-09-03T00:00:00.000Z" });
    expect(plan.sourceCount).toBe(20);
    expect(plan.validCount).toBe(20);
    expect(plan.rowCount).toBe(40);
    expect(plan.errors).toEqual([]);
    expect(plan.targets).toHaveLength(10);
    const imported = plan.targets.flatMap((target) => target.rows.filter((row) => row.historical_replay));
    expect(imported).toHaveLength(40);
    expect(imported.filter((row) => row.entry_kind === "raw_observation")).toHaveLength(20);
    expect(imported.filter((row) => row.entry_kind === "merged_lesson")).toHaveLength(20);
    expect(imported.every((row) => row.source_refs.every((source) => typeof source === "object" && typeof source.task_id === "string" && typeof source.raw_entry_id === "string"))).toBe(true);
    expect(imported.every((row) => row.evidence_refs.length === 1 && !row.evidence_refs[0].includes("#"))).toBe(true);
    expect(imported.every((row) => row.historical_replay === true && typeof row.content_sha256 === "string")).toBe(true);
    expect(new Set(plan.targets.map((target) => target.project))).toEqual(new Set(["workflowhub", "paperbuilder"]));
  });

  it("keeps dry-run read-only and writes lessons plus evidence atomically", () => {
    prepareTranscripts();
    const storageRoot = mkdtempSync(join(tmpdir(), "workflowhub-historical-import-execute-"));
    roots.push(storageRoot);
    const plan = buildImportPlan({ inputRoot: packageRoot, storageRoot, now: "2026-09-03T00:00:00.000Z" });
    const dryRun = JSON.parse(JSON.stringify({ source_count: plan.sourceCount, valid_entries: plan.validCount, errors: plan.errors }));
    expect(dryRun).toEqual({ source_count: 20, valid_entries: 20, errors: [] });
    expect(existsSync(join(storageRoot, "Projects"))).toBe(false);

    const first = executeImport(plan);
    expect(first.status).toBe("imported");
    expect(first.valid_entries).toBe(20);
    expect(first.written_rows).toBe(40);
    expect(readRows(join(storageRoot, "Projects/workflowhub/lessons/make-decision.jsonl"))).toHaveLength(4);
    expect(readRows(join(storageRoot, "Projects/paperbuilder/lessons/verify-code.jsonl"))).toHaveLength(4);
    for (const project of ["workflowhub", "paperbuilder"]) {
      expect(existsSync(join(storageRoot, `Projects/${project}/quality/evidence/historical-replay-20260901/transcript-index.jsonl`))).toBe(true);
    }

    const rerun = buildImportPlan({ inputRoot: packageRoot, storageRoot, now: "2026-09-03T00:00:00.000Z" });
    expect(rerun.targets.every((target) => target.added === 0)).toBe(true);
    expect(executeImport(rerun).idempotent).toBe(true);
  });

  it("rejects an existing same-identity different-content conflict before writing", () => {
    prepareTranscripts();
    const storageRoot = mkdtempSync(join(tmpdir(), "workflowhub-historical-import-conflict-"));
    roots.push(storageRoot);
    const plan = buildImportPlan({ inputRoot: packageRoot, storageRoot, now: "2026-09-03T00:00:00.000Z" });
    executeImport(plan);
    const path = join(storageRoot, "Projects/workflowhub/lessons/make-decision.jsonl");
    const rows = readRows(path);
    rows[0].content_sha256 = "0".repeat(64);
    writeFileSync(path, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
    expect(() => buildImportPlan({ inputRoot: packageRoot, storageRoot, now: "2026-09-03T00:00:00.000Z" })).toThrow(/conflicts with existing lesson/);
    expect(readRows(path)[0].content_sha256).toBe("0".repeat(64));
  });

  it("does not create output when the package has a malformed source row", () => {
    prepareTranscripts();
    const brokenPackage = mkdtempSync(join(tmpdir(), "workflowhub-historical-import-broken-package-"));
    const storageRoot = mkdtempSync(join(tmpdir(), "workflowhub-historical-import-broken-output-"));
    roots.push(brokenPackage, storageRoot);
    cpSync(packageRoot, brokenPackage, { recursive: true });
    const path = join(brokenPackage, "lessons/build-code.jsonl");
    const rows = readFileSync(path, "utf8").trim().split("\n");
    rows[0] = "{not-json}";
    writeFileSync(path, `${rows.join("\n")}\n`, "utf8");
    expect(() => buildImportPlan({ inputRoot: brokenPackage, storageRoot })).toThrow(/invalid JSON/);
    expect(existsSync(join(storageRoot, "Projects"))).toBe(false);
  });
});
