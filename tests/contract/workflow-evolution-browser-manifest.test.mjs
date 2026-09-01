import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
const validator = resolve(import.meta.dirname, "../fixtures/workflow-evolution/validate-browser-manifest.mjs");
const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
describe("M16 browser evidence manifest", () => {
  it("maps authenticated manifest states to the canonical exit matrix", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    for (const [status, expectedExit] of [["passed", 0], ["qa_failed", 20], ["unavailable", 21], ["incomplete", 21]]) {
      const path = join(root, `${status}.json`);
      writeFileSync(path, `${JSON.stringify({ schema_version: "browser-qa-evidence.v1", status, engine: "agent-browser", login_reused: false, cleanup: "complete", ...(status === "passed" ? { checks: { open: true, evolution_tab: true, content: true, no_page_errors: true, no_runtime_requests: true }, material_identity: { page_sha256: "a".repeat(64), data_sha256: "b".repeat(64), move_map_sha256: "c".repeat(64), fixture_sha256: "d".repeat(64) } } : {}) })}\n`);
      expect(spawnSync(process.execPath, [validator, path]).status, status).toBe(expectedExit);
    }
  });

  it("rejects a passed claim that is not bound to page, data, move-map and fixture bytes", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    const path = join(root, "forged-pass.json");
    writeFileSync(path, `${JSON.stringify({ schema_version: "browser-qa-evidence.v1", status: "passed", engine: "agent-browser", login_reused: false, cleanup: "complete", checks: { open: true } })}\n`);
    expect(spawnSync(process.execPath, [validator, path]).status).toBe(22);
  });

  it("fails closed for a missing or malformed manifest", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    const malformed = join(root, "malformed.json"); writeFileSync(malformed, "{}\n");
    expect(spawnSync(process.execPath, [validator, malformed]).status).toBe(22);
    expect(spawnSync(process.execPath, [validator, join(root, "missing.json")]).status).toBe(22);
  });
});
