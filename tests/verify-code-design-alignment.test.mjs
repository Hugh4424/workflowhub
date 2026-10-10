import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Baseline 16cf138874290f62: retire eight dead-module semantics cases.
// The three replacement cases verify removal and dangling-reference cleanup;
// they do not claim equivalent coverage for the former functions.
const root = fileURLToPath(new URL("..", import.meta.url));
const retired = ["design", "alignment"].join("-");
const symbols = [
  ["align", "Ui", "Design", "Evidence"], ["create", "Task", "Projection"],
  ["align", "Current", "Evidence"], ["build", "Consumer", "Census"],
  ["validate", "Project", "Standard", "Sources"],
].map((parts) => parts.join(""));
const modulePath = join(root, "workflows", "verify-code", retired + ".mjs");
const mapPath = join(root, "docs", "architecture", "move-map.json");
const excluded = [".git", "node_modules", "specs", "docs/archive", "docs/research"];

function danglingReferences(dir) {
  const hits = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name);
    const rel = relative(root, absolute).split("\\").join("/");
    if (excluded.some((path) => rel === path || rel.startsWith(path + "/"))) continue;
    if (entry.isDirectory()) hits.push(...danglingReferences(absolute));
    else if (entry.isFile()) {
      const bytes = readFileSync(absolute);
      if (bytes.includes(retired) || symbols.some((symbol) => bytes.includes(symbol))) hits.push(rel);
    }
  }
  return hits;
}

describe("verify-code retired module cleanup", () => {
  it("keeps the retired module absent", () => {
    expect(existsSync(modulePath)).toBe(false);
  });

  it("keeps current repository files free of dangling name and symbol references", () => {
    expect(danglingReferences(root)).toEqual([]);
  });

  it("keeps the architecture map parseable and free of retired registration", () => {
    const text = readFileSync(mapPath, "utf8");
    expect(() => JSON.parse(text)).not.toThrow();
    expect(text).not.toContain(retired);
  });
});