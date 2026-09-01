import { describe, expect, it } from "vitest";
import { appendFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { refreshEvolutionSnapshot, readCurrentEvolutionProjection } from "../../runtime/evidence/workflow-evolution.mjs";
describe("M16 current snapshot seam", () => {
  it("returns the latest complete committed snapshot and preserves generation", () => {
    const root = mkdtempSync(join(tmpdir(), "m16-current-"));
    try {
      const first = refreshEvolutionSnapshot({ storageRoot: root, project: "Demo", attemptId: "a1", inventory: { project: "Demo", observations: [] }, now: "2026-08-31T00:00:00.000Z" });
      const current = readCurrentEvolutionProjection({ storageRoot: root, project: "Demo", expectedIdentity: { snapshot_id: first.snapshot_id } });
      expect(current.status).toBe("ok"); expect(current.snapshot_id).toBe(first.snapshot_id); expect(current.publication_generation).toBe(1);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it("fails closed instead of serving the last snapshot through a malformed terminal tail", () => {
    const storageRoot = mkdtempSync(join(tmpdir(), "m16-current-"));
    try {
      refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a1", inventory: { project: "Demo", observations: [] }, now: "2026-08-31T00:00:00.000Z" });
      appendFileSync(join(storageRoot, "Projects/Demo/evolution-candidates.jsonl"), "{malformed");
      expect(readCurrentEvolutionProjection({ storageRoot, project: "Demo" })).toMatchObject({ status: "failed", error: { code: "failed" } });
    } finally { rmSync(storageRoot, { recursive: true, force: true }); }
  });
  it("rejects a projection after producer or schema identity rollback", () => {
    const storageRoot = mkdtempSync(join(tmpdir(), "m16-current-"));
    try {
      const producer_identity = { ref: "producer", sha256: "a".repeat(64) }; const schema_identity = { ref: "schema", sha256: "b".repeat(64) };
      const first = refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a1", inventory: { inventory: { observations: [] }, producer_identity, schema_identity }, now: "2026-08-31T00:00:00.000Z" });
      expect(readCurrentEvolutionProjection({ storageRoot, project: "Demo", expectedIdentity: { snapshot_id: first.snapshot_id, producer_identity: { ...producer_identity, sha256: "c".repeat(64) }, schema_identity } })).toMatchObject({ status: "stale_source" });
    } finally { rmSync(storageRoot, { recursive: true, force: true }); }
  });
});
