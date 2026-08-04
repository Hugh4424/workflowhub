import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const productionRoots = ["core", "runtime", "workflows"];

function modulesUnder(directory) {
  const absolute = resolve(root, directory);
  const paths = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const path = join(absolute, entry.name);
    if (entry.isDirectory()) paths.push(...modulesUnder(relative(root, path)));
    else if (entry.isFile() && entry.name.endsWith(".mjs")) paths.push(relative(root, path));
  }
  return paths;
}

function hasWhReviewImport(source) {
  return /(?:\bimport\s*(?:[\s\S]*?\sfrom\s*)?|\bexport\s*\*\s+from\s*|\bimport\s*\()["'][^"']*skills\/wh-review\//.test(source);
}

describe("review layering", () => {
  it("keeps production core/runtime/workflows independent from the wh-review skill implementation", () => {
    const offenders = productionRoots.flatMap((directory) => modulesUnder(directory))
      .filter((path) => hasWhReviewImport(readFileSync(resolve(root, path), "utf8")));
    expect(offenders).toEqual([]);
  });

  it("places production review schema, parser, policy and review subjects under runtime/review", () => {
    for (const path of [
      "runtime/review/schema-validator.mjs",
      "runtime/review/review-output.mjs",
      "runtime/review/review-policy.mjs",
      "runtime/review/review-controller.mjs",
      "runtime/review/integration-review-subject.mjs",
    ]) expect(readFileSync(resolve(root, path), "utf8")).not.toMatch(/skills\/wh-review/);
  });
});
