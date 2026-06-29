// TDD Phase 7 (US5): reuse-registry.md registration for spec-plan, spec-tasks, spec-analyze.
// Uses vitest + node:assert (compatible with vitest).
import { test, describe } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

const VALID_CATEGORIES = ["外部改造适配", "自研", "外部依赖", "改造适配", "其他平台原生"];

// Parse reuse-registry.md markdown table into [{skill, category, source}].
function parseRegistry() {
  const content = readFileSync(join(REPO_ROOT, "reuse-registry.md"), "utf8");
  const rows = [];
  for (const line of content.split("\n")) {
    const m = line.match(/^\|(.+?)\|(.+?)\|(.+?)\|$/);
    if (!m) continue;
    const cells = [m[1], m[2], m[3]].map((c) => c.trim().replace(/^`|`$/g, ""));
    // Skip header / separator rows
    if (cells[0] === "skill 名" || /^---+$/.test(cells[0])) continue;
    rows.push({ skill: cells[0], category: cells[1], source: cells[2] });
  }
  return rows;
}

function findRow(rows, skillName) {
  return rows.find((r) => r.skill === skillName);
}

// --- Three new rows: existence + category + non-empty source ---
describe("Phase 7 US5: reuse-registry.md contains spec-plan row with correct format", () => {
  const rows = parseRegistry();
  const row = findRow(rows, "spec-plan");

  test("spec-plan row exists in reuse-registry.md", () => {
    assert.ok(row, "reuse-registry.md must contain a row for spec-plan");
  });

  test("spec-plan category is 外部改造适配", () => {
    assert.equal(row?.category, "外部改造适配",
      `spec-plan category must be "外部改造适配", got "${row?.category}"`);
  });

  test("spec-plan source path is non-empty", () => {
    assert.ok(row?.source && row.source.length > 0,
      `spec-plan source must be non-empty, got "${row?.source}"`);
  });

  test('spec-plan source path points at speckit-plan SKILL.md', () => {
    assert.ok(
      row?.source?.includes("speckit-plan") && row?.source?.includes("SKILL.md"),
      `spec-plan source must reference speckit-plan/SKILL.md, got "${row?.source}"`
    );
  });
});

describe("Phase 7 US5: reuse-registry.md contains spec-tasks row with correct format", () => {
  const rows = parseRegistry();
  const row = findRow(rows, "spec-tasks");

  test("spec-tasks row exists in reuse-registry.md", () => {
    assert.ok(row, "reuse-registry.md must contain a row for spec-tasks");
  });

  test("spec-tasks category is 外部改造适配", () => {
    assert.equal(row?.category, "外部改造适配",
      `spec-tasks category must be "外部改造适配", got "${row?.category}"`);
  });

  test("spec-tasks source path is non-empty", () => {
    assert.ok(row?.source && row.source.length > 0,
      `spec-tasks source must be non-empty, got "${row?.source}"`);
  });

  test('spec-tasks source path points at speckit-tasks SKILL.md', () => {
    assert.ok(
      row?.source?.includes("speckit-tasks") && row?.source?.includes("SKILL.md"),
      `spec-tasks source must reference speckit-tasks/SKILL.md, got "${row?.source}"`
    );
  });
});

describe("Phase 7 US5: reuse-registry.md contains spec-analyze row with correct format", () => {
  const rows = parseRegistry();
  const row = findRow(rows, "spec-analyze");

  test("spec-analyze row exists in reuse-registry.md", () => {
    assert.ok(row, "reuse-registry.md must contain a row for spec-analyze");
  });

  test("spec-analyze category is 外部改造适配", () => {
    assert.equal(row?.category, "外部改造适配",
      `spec-analyze category must be "外部改造适配", got "${row?.category}"`);
  });

  test("spec-analyze source path is non-empty", () => {
    assert.ok(row?.source && row.source.length > 0,
      `spec-analyze source must be non-empty, got "${row?.source}"`);
  });

  test('spec-analyze source path points at speckit-analyze SKILL.md', () => {
    assert.ok(
      row?.source?.includes("speckit-analyze") && row?.source?.includes("SKILL.md"),
      `spec-analyze source must reference speckit-analyze/SKILL.md, got "${row?.source}"`
    );
  });
});

// --- Existing rows regression: spec-specify still present ---
describe("Phase 7 US5: existing rows are preserved (no regression)", () => {
  const rows = parseRegistry();

  test("spec-specify row still present", () => {
    const row = findRow(rows, "spec-specify");
    assert.ok(row, "spec-specify row must still be present in reuse-registry.md");
    assert.equal(row.category, "外部改造适配",
      `spec-specify category should remain "外部改造适配", got "${row.category}"`);
  });

  test("spec-clarify row still present", () => {
    const row = findRow(rows, "spec-clarify");
    assert.ok(row, "spec-clarify row must still be present in reuse-registry.md");
    assert.equal(row.category, "外部改造适配",
      `spec-clarify category should remain "外部改造适配", got "${row.category}"`);
  });

  test("make-decision row still present", () => {
    const row = findRow(rows, "make-decision");
    assert.ok(row, "make-decision row must still be present in reuse-registry.md");
    assert.equal(row.category, "自研",
      `make-decision category should remain "自研", got "${row.category}"`);
  });
});
