import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  OUTPUT,
  PROTECTED,
  listTestFiles,
  renderDisposition,
  validateDisposition,
} from "../../tools/architecture/test-disposition.mjs";

describe("test disposition is an exact, auditable quality inventory", () => {
  it("covers every current test exactly once", () => {
    const actual = readFileSync(OUTPUT, "utf8");
    expect(validateDisposition(actual, { requireAll: true })).toEqual([]);
    expect(actual).toBe(renderDisposition());
    expect(actual).toContain("tests/integration/deletion-slices-summary.test.mjs\tkeep");
  });

  it("keeps protected behavioral oracles", () => {
    const rows = new Map(readFileSync(OUTPUT, "utf8").trimEnd().split("\n").slice(1).map((line) => {
      const [path, disposition] = line.split("\t");
      return [path, disposition];
    }));
    for (const path of PROTECTED) expect(rows.get(path)).toBe("keep");
  });

  it("rejects duplicate rows and deletion without a replacement oracle", () => {
    const bad = [
      "path\tdisposition\treason\toracle\treplacement_ref",
      "tests/contract/a.test.mjs\tdelete\tremove\tbad\t-",
      "tests/contract/a.test.mjs\tkeep\tkeep\tgood\t-",
    ].join("\n");
    const errors = validateDisposition(bad, { requireAll: false });
    expect(errors).toEqual(expect.arrayContaining([
      "duplicate test path: tests/contract/a.test.mjs",
      "non-keep row requires replacement oracle: tests/contract/a.test.mjs",
    ]));
  });

  it("requires an explicit replacement path for merge and move", () => {
    const bad = [
      "path\tdisposition\treason\toracle\treplacement_ref",
      "tests/contract/a.test.mjs\tmove\trehome\tnew-oracle\t-",
    ].join("\n");
    expect(validateDisposition(bad)).toContain("non-keep row requires replacement oracle: tests/contract/a.test.mjs");
  });

  it("uses only test files from the delivery inventory", () => {
    expect(listTestFiles().every((path) => /\.test\.[^/]+$/.test(path) || path.includes("/__tests__/"))).toBe(true);
  });
});
