import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { captureBefore, verifyUnchanged } from "../../tools/architecture/history-inventory.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-history-read-only-"));
  roots.push(root);
  mkdirSync(join(root, "specs", "archive", "m14a"), { recursive: true });
  mkdirSync(join(root, "docs", "architecture"), { recursive: true });
  writeFileSync(join(root, "specs", "archive", "m14a", "spec.md"), "historical\n");
  writeFileSync(join(root, "docs", "architecture", "legacy-task-inventory.json"), "{}\n");
  return root;
}

describe("history inventory is read-only", () => {
  it("captures paths, bytes, and hashes without depending on mtime", () => {
    const root = fixture();
    const before = captureBefore({ root, baseline: "fixture" });
    expect(before.file_count).toBe(2);
    const inventory = JSON.parse(readFileSync(join(root, "docs", "architecture", "history-inventory.json"), "utf8"));
    expect(inventory.files).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "specs/archive/m14a/spec.md" }),
      expect.objectContaining({ path: "docs/architecture/legacy-task-inventory.json" }),
    ]));
    expect(verifyUnchanged({ root })).toMatchObject({ ok: true, before_count: 2, after_count: 2 });
  });

  it("fails on historical byte changes, removals, and new files", () => {
    const root = fixture();
    captureBefore({ root, baseline: "fixture" });
    writeFileSync(join(root, "specs", "archive", "m14a", "spec.md"), "changed\n");
    writeFileSync(join(root, "specs", "archive", "new.md"), "new\n");
    expect(verifyUnchanged({ root }).errors).toEqual(expect.arrayContaining([
      "historical file changed: specs/archive/m14a/spec.md",
      "new historical file appeared: specs/archive/new.md",
    ]));
  });

  it("refuses to overwrite an existing frozen inventory", () => {
    const root = fixture();
    const first = captureBefore({ root, baseline: "fixture" });
    expect(() => captureBefore({ root, baseline: "different" })).toThrow(/refusing to overwrite/);
    expect(JSON.parse(readFileSync(join(root, "docs", "architecture", "history-inventory.json"), "utf8"))).toMatchObject({
      baseline_commit: first.baseline_commit,
      file_count: first.file_count,
    });
  });
});
