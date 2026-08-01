import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const moveMap = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "docs/architecture/move-map.json"), "utf8"));
const structure = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "runtime/schemas/repository-structure.v1.json"), "utf8"));

function sha256(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(repositoryRoot, relativePath))).digest("hex");
}

describe("Phase 8 repository governance", () => {
  it("uses the declared structure schema", () => {
    expect(structure.properties.schema_version.const).toBe("repository-structure.v1");
    expect(structure.properties.directories.type).toBe("object");
    expect(structure.properties.rules.type).toBe("array");
  });

  it("proves every moved file has one destination and the recorded post-move hash", () => {
    const moved = moveMap.entries.filter((entry) => entry.status === "move");
    expect(moved.length).toBe(101);
    expect(new Set(moved.map((entry) => entry.destination)).size).toBe(moved.length);
    for (const entry of moved) {
      expect(fs.existsSync(path.join(repositoryRoot, entry.source))).toBe(false);
      expect(fs.existsSync(path.join(repositoryRoot, entry.destination))).toBe(true);
      expect(sha256(entry.destination)).toBe(entry.sha256_after);
    }
  });

  it("keeps Phase 7 tests and explicit extras instead of silently moving them", () => {
    const retained = moveMap.entries.filter((entry) => entry.status !== "move");
    expect(retained.length).toBeGreaterThan(0);
    for (const entry of retained) expect(fs.existsSync(path.join(repositoryRoot, entry.source))).toBe(true);
    expect(moveMap.entries.filter((entry) => entry.status === "keep-phase7").length).toBe(37);
    expect(moveMap.entries.filter((entry) => entry.status === "excluded-not-in-T052").length).toBe(46);
  });
});
