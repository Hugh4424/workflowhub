import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const validator = resolve(import.meta.dirname, "../fixtures/workflow-evolution/validate-browser-manifest.mjs");
const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
const canonicalChecks = {
  open: true,
  evolution_tab: true,
  content: true,
  no_page_errors: true,
  no_runtime_requests: true,
  viewport_390x844: true,
  viewport_1280x800: true,
};
const canonicalAssertions = [
  "Evolution",
  "建议行动",
  "仅供参考",
  "前期质量税",
  "不是质量裁决或 stage gate",
  "evolution tab is reachable",
  "390x844 and 1280x800 snapshots",
  "no page errors",
  "no external runtime network requests",
];
const sha = (value) => createHash("sha256").update(value).digest("hex");
function passedManifest(identities) {
  return {
    schema_version: "browser-qa-evidence.v1",
    status: "passed",
    engine: "agent-browser",
    login_reused: false,
    session: "m16-browser-contract",
    cleanup: "complete",
    assertions: canonicalAssertions,
    checks: canonicalChecks,
    viewports: [
      { width: 390, height: 844, evidence_ref: "narrow.png", snapshot_sha256: sha("narrow-image") },
      { width: 1280, height: 800, evidence_ref: "wide.png", snapshot_sha256: sha("wide-image") },
    ],
    evidence: [{ ref: "narrow.png", sha256: sha("narrow-image") }, { ref: "wide.png", sha256: sha("wide-image") }],
    material_identity: identities,
  };
}
describe("M16 browser evidence manifest", () => {
  it("maps authenticated manifest states to the canonical exit matrix", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    writeFileSync(join(root, "narrow.png"), "narrow-image"); writeFileSync(join(root, "wide.png"), "wide-image");
    const materialArgs = [];
    const identities = {};
    for (const [name, key] of [["page", "page_sha256"], ["data", "data_sha256"], ["move-map", "move_map_sha256"], ["fixture", "fixture_sha256"]]) { const path = join(root, name); writeFileSync(path, name); identities[key] = createHash("sha256").update(name).digest("hex"); materialArgs.push(`--${name}=${path}`); }
    for (const [status, expectedExit] of [["passed", 0], ["qa_failed", 20], ["unavailable", 21], ["incomplete", 21]]) {
      const path = join(root, `${status}.json`);
      writeFileSync(path, `${JSON.stringify(status === "passed" ? passedManifest(identities) : { schema_version: "browser-qa-evidence.v1", status, engine: "agent-browser", login_reused: false, cleanup: "complete" })}\n`);
      expect(spawnSync(process.execPath, [validator, path, ...materialArgs]).status, status).toBe(expectedExit);
    }
  });

  it("rejects a passed claim that is not bound to page, data, move-map and fixture bytes", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    writeFileSync(join(root, "narrow.png"), "narrow-image"); writeFileSync(join(root, "wide.png"), "wide-image");
    const path = join(root, "forged-pass.json");
    writeFileSync(path, `${JSON.stringify({ schema_version: "browser-qa-evidence.v1", status: "passed", engine: "agent-browser", login_reused: false, cleanup: "complete", checks: { open: true } })}\n`);
    expect(spawnSync(process.execPath, [validator, path]).status).toBe(22);
  });

  it("rejects a pass after any bound material changes", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    writeFileSync(join(root, "narrow.png"), "narrow-image"); writeFileSync(join(root, "wide.png"), "wide-image");
    const paths = Object.fromEntries(["page", "data", "move-map", "fixture"].map((name) => { const path = join(root, name); writeFileSync(path, name); return [name, path]; }));
    const material_identity = { page_sha256: createHash("sha256").update("page").digest("hex"), data_sha256: createHash("sha256").update("data").digest("hex"), move_map_sha256: createHash("sha256").update("move-map").digest("hex"), fixture_sha256: createHash("sha256").update("fixture").digest("hex") };
    const manifest = join(root, "pass.json"); writeFileSync(manifest, `${JSON.stringify(passedManifest(material_identity))}\n`);
    writeFileSync(paths.data, "tampered");
    expect(spawnSync(process.execPath, [validator, manifest, ...Object.entries(paths).map(([name, path]) => `--${name}=${path}`)]).status).toBe(22);
  });

  it("rejects passed claims missing any canonical check, assertion, viewport, session or completed cleanup", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    writeFileSync(join(root, "narrow.png"), "narrow-image"); writeFileSync(join(root, "wide.png"), "wide-image");
    const paths = Object.fromEntries(["page", "data", "move-map", "fixture"].map((name) => { const path = join(root, name); writeFileSync(path, name); return [name, path]; }));
    const identities = { page_sha256: sha("page"), data_sha256: sha("data"), move_map_sha256: sha("move-map"), fixture_sha256: sha("fixture") };
    const mutations = [
      (value) => { delete value.checks.content; },
      (value) => { value.checks.extra = true; },
      (value) => { value.assertions.pop(); },
      (value) => { value.viewports.pop(); },
      (value) => { value.viewports[0].width = 391; },
      (value) => { value.evidence[0].sha256 = "0".repeat(64); },
      (value) => { value.viewports[1].evidence_ref = value.viewports[0].evidence_ref; value.viewports[1].snapshot_sha256 = value.viewports[0].snapshot_sha256; value.evidence[1] = { ...value.evidence[0] }; },
      (value) => { delete value.session; },
      (value) => { value.cleanup = "pending"; },
    ];
    for (const [index, mutate] of mutations.entries()) {
      const value = passedManifest(identities); mutate(value);
      const manifest = join(root, `invalid-${index}.json`); writeFileSync(manifest, `${JSON.stringify(value)}\n`);
      expect(spawnSync(process.execPath, [validator, manifest, ...Object.entries(paths).map(([name, path]) => `--${name}=${path}`)]).status, `mutation ${index}`).toBe(22);
    }
  });

  it("fails closed for a missing or malformed manifest", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    const malformed = join(root, "malformed.json"); writeFileSync(malformed, "{}\n");
    expect(spawnSync(process.execPath, [validator, malformed]).status).toBe(22);
    expect(spawnSync(process.execPath, [validator, join(root, "missing.json")]).status).toBe(22);
  });

  it("rejects viewport evidence symlinked outside the manifest directory", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-browser-manifest-")); roots.push(root);
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-browser-outside-")); roots.push(outside);
    writeFileSync(join(outside, "narrow.png"), "narrow-image"); symlinkSync(join(outside, "narrow.png"), join(root, "narrow.png")); writeFileSync(join(root, "wide.png"), "wide-image");
    const paths = Object.fromEntries(["page", "data", "move-map", "fixture"].map((name) => { const path = join(root, name); writeFileSync(path, name); return [name, path]; }));
    const identities = { page_sha256: sha("page"), data_sha256: sha("data"), move_map_sha256: sha("move-map"), fixture_sha256: sha("fixture") };
    const manifest = join(root, "pass.json"); writeFileSync(manifest, `${JSON.stringify(passedManifest(identities))}\n`);
    expect(spawnSync(process.execPath, [validator, manifest, ...Object.entries(paths).map(([name, path]) => `--${name}=${path}`)]).status).toBe(22);
  });
});
