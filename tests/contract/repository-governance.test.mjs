import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const moveMap = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "docs/architecture/move-map.json"), "utf8"));
const structure = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "runtime/schemas/repository-structure.v1.json"), "utf8"));

describe("repository governance", () => {
  it("uses the declared structure schema", () => {
    expect(structure.properties.schema_version.const).toBe("repository-structure.v1");
    expect(structure.properties.directories.type).toBe("object");
    expect(structure.properties.rules.type).toBe("array");
  });

  it("keeps the Phase 8 move map as readable migration audit history", () => {
    expect(moveMap.schema_version).toBeTruthy();
    expect(Array.isArray(moveMap.entries)).toBe(true);
    const moved = moveMap.entries.filter((entry) => entry.status === "move");
    const removed = moveMap.entries.filter((entry) => entry.status === "deleted-final-cleanup");
    expect(moved.length).toBeGreaterThan(0);
    expect(removed.length).toBeGreaterThan(0);
    expect(new Set(moved.map((entry) => entry.destination)).size).toBe(moved.length);
    for (const entry of [...moved, ...removed]) expect(entry.source).toMatch(/\S/);
  });

  it("does not treat the historical move map as a current-tree hash permit", () => {
    const inventory = fs.readFileSync(path.join(repositoryRoot, "tools/architecture/inventory.mjs"), "utf8");
    expect(inventory).not.toMatch(/move-map\.json/);
    expect(inventory).not.toMatch(/sha256_after/);
  });
});
