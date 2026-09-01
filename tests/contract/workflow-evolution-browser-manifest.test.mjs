import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const validator = resolve(import.meta.dirname, "../fixtures/workflow-evolution/validate-browser-manifest.mjs");
const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
describe("M16 browser evidence manifest", () => {
  it("maps authenticated manifest states to the canonical exit matrix", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    const materialArgs = [];
    const identities = {};
    for (const [name, key] of [["page", "page_sha256"], ["data", "data_sha256"], ["move-map", "move_map_sha256"], ["fixture", "fixture_sha256"]]) { const path = join(root, name); writeFileSync(path, name); identities[key] = createHash("sha256").update(name).digest("hex"); materialArgs.push(`--${name}=${path}`); }
    for (const [status, expectedExit] of [["passed", 0], ["qa_failed", 20], ["unavailable", 21], ["incomplete", 21]]) {
      const path = join(root, `${status}.json`);
      writeFileSync(path, `${JSON.stringify({ schema_version: "browser-qa-evidence.v1", status, engine: "agent-browser", login_reused: false, cleanup: "complete", ...(status === "passed" ? { checks: { open: true, evolution_tab: true, content: true, no_page_errors: true, no_runtime_requests: true }, material_identity: identities } : {}) })}\n`);
      expect(spawnSync(process.execPath, [validator, path, ...materialArgs]).status, status).toBe(expectedExit);
    }
  });

  it("rejects a passed claim that is not bound to page, data, move-map and fixture bytes", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    const path = join(root, "forged-pass.json");
    writeFileSync(path, `${JSON.stringify({ schema_version: "browser-qa-evidence.v1", status: "passed", engine: "agent-browser", login_reused: false, cleanup: "complete", checks: { open: true } })}\n`);
    expect(spawnSync(process.execPath, [validator, path]).status).toBe(22);
  });

  it("rejects a pass after any bound material changes", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    const paths = Object.fromEntries(["page", "data", "move-map", "fixture"].map((name) => { const path = join(root, name); writeFileSync(path, name); return [name, path]; }));
    const material_identity = { page_sha256: createHash("sha256").update("page").digest("hex"), data_sha256: createHash("sha256").update("data").digest("hex"), move_map_sha256: createHash("sha256").update("move-map").digest("hex"), fixture_sha256: createHash("sha256").update("fixture").digest("hex") };
    const manifest = join(root, "pass.json"); writeFileSync(manifest, `${JSON.stringify({ schema_version: "browser-qa-evidence.v1", status: "passed", engine: "agent-browser", login_reused: false, checks: { a: true, b: true, c: true, d: true, e: true }, material_identity })}\n`);
    writeFileSync(paths.data, "tampered");
    expect(spawnSync(process.execPath, [validator, manifest, ...Object.entries(paths).map(([name, path]) => `--${name}=${path}`)]).status).toBe(22);
  });

  it("fails closed for a missing or malformed manifest", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    const malformed = join(root, "malformed.json"); writeFileSync(malformed, "{}\n");
    expect(spawnSync(process.execPath, [validator, malformed]).status).toBe(22);
    expect(spawnSync(process.execPath, [validator, join(root, "missing.json")]).status).toBe(22);
  });
});
