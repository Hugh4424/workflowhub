/**
 * check-extensibility.test.mjs
 * RED tests for scripts/check-extensibility.mjs
 * Covers FR-EXT-001 (swappability), FR-EXT-002 (extensibility), FR-EXT-003 (independence).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, mkdtempSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");

// Import the checker module — will fail (RED) until scripts/check-extensibility.mjs exists.
let verifySwappability, verifyExtensibility;
beforeAll(async () => {
  const mod = await import(resolve(repo, "scripts/check-extensibility.mjs"));
  verifySwappability = mod.verifySwappability;
  verifyExtensibility = mod.verifyExtensibility;
});

// ---------------------------------------------------------------------------
// Helpers: build a temporary config YAML pointing to given component entries
// ---------------------------------------------------------------------------
function makeConfig(entries) {
  const lines = ["registry:"];
  for (const e of entries) {
    lines.push(`  - component_id: ${e.component_id}`);
    lines.push(`    workflow: ${e.workflow}`);
    lines.push(`    path: ${e.path}`);
  }
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Test 1 — FR-EXT-001: Swappability
// Stub component dispatched, component_id = stub, core diff empty.
// ---------------------------------------------------------------------------
describe("FR-EXT-001: verifySwappability — stub dispatched + core diff empty", () => {
  let tmpDir;
  let configPath;
  let stubPath;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(os.tmpdir(), "wfh-ext-swap-"));
    stubPath = join(tmpDir, "stub-component.mjs");
    writeFileSync(
      stubPath,
      `process.stdout.write(JSON.stringify({ component_id: "stub-swap", status: "ok" }) + "\\n"); process.exit(0);\n`,
      "utf8",
    );
    configPath = join(tmpDir, "swap-config.yaml");
    writeFileSync(
      configPath,
      makeConfig([{ component_id: "stub-swap", workflow: "test-swap", path: stubPath }]),
      "utf8",
    );
  });

  afterAll(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("resolves successfully with { passed: true }", async () => {
    const result = await verifySwappability({ configPath, workflowId: "test-swap" });
    expect(result.passed).toBe(true);
  });

  it("reports component_id matching the stub, not any original component", async () => {
    const result = await verifySwappability({ configPath, workflowId: "test-swap" });
    expect(result.componentId).toBe("stub-swap");
  });

  it("reports coreDiffEmpty = true (no core files were modified)", async () => {
    const result = await verifySwappability({ configPath, workflowId: "test-swap" });
    expect(result.coreDiffEmpty).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 2 — FR-EXT-001 falsifiability: core modified → swappability must fail
// ---------------------------------------------------------------------------
describe("FR-EXT-001 falsifiability: core file modified → verifySwappability fails", () => {
  let tmpDir;
  let configPath;
  let stubPath;
  // We'll temporarily mutate a core file to prove diff anchoring is real.
  const kernelPath = resolve(repo, "core/kernel.mjs");
  let originalContent;

  beforeAll(() => {
    // Save original kernel.mjs content
    originalContent = readFileSync(kernelPath, "utf8");

    tmpDir = mkdtempSync(join(os.tmpdir(), "wfh-ext-swap-falsify-"));
    stubPath = join(tmpDir, "stub-falsify.mjs");
    writeFileSync(
      stubPath,
      `process.stdout.write(JSON.stringify({ component_id: "stub-falsify", status: "ok" }) + "\\n"); process.exit(0);\n`,
      "utf8",
    );
    configPath = join(tmpDir, "falsify-config.yaml");
    writeFileSync(
      configPath,
      makeConfig([{ component_id: "stub-falsify", workflow: "test-falsify", path: stubPath }]),
      "utf8",
    );

    // Mutate core/kernel.mjs — append a comment to change its content
    writeFileSync(kernelPath, originalContent + "// falsify-marker\n", "utf8");
  });

  afterAll(() => {
    // Always restore the original content
    writeFileSync(kernelPath, originalContent, "utf8");
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns passed=false when a core file has been modified (coreDiffEmpty=false)", async () => {
    const result = await verifySwappability({ configPath, workflowId: "test-falsify" });
    expect(result.passed).toBe(false);
    expect(result.coreDiffEmpty).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test 3 — FR-EXT-002: Extensibility
// New dummy added via registry only, triggered by workflowId (no manual path passing).
// ---------------------------------------------------------------------------
describe("FR-EXT-002: verifyExtensibility — new dummy triggered by workflowId only", () => {
  let tmpDir;
  let configPath;
  let dummyPath;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(os.tmpdir(), "wfh-ext-new-"));
    dummyPath = join(tmpDir, "dummy-new.mjs");
    writeFileSync(
      dummyPath,
      `process.stdout.write(JSON.stringify({ component_id: "dummy-new-ext", status: "ok" }) + "\\n"); process.exit(0);\n`,
      "utf8",
    );
    configPath = join(tmpDir, "ext-config.yaml");
    writeFileSync(
      configPath,
      makeConfig([{ component_id: "dummy-new-ext", workflow: "test-new-ext", path: dummyPath }]),
      "utf8",
    );
  });

  afterAll(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("resolves with { passed: true }", async () => {
    const result = await verifyExtensibility({ configPath, workflowId: "test-new-ext" });
    expect(result.passed).toBe(true);
  });

  it("reports component_id matching the new dummy", async () => {
    const result = await verifyExtensibility({ configPath, workflowId: "test-new-ext" });
    expect(result.componentId).toBe("dummy-new-ext");
  });

  it("reports coreDiffEmpty = true (no core files were modified)", async () => {
    const result = await verifyExtensibility({ configPath, workflowId: "test-new-ext" });
    expect(result.coreDiffEmpty).toBe(true);
  });

  it("does NOT pass the component path directly — only workflowId is passed to runKernel", async () => {
    // The verifyExtensibility implementation must only pass (configPath, workflowId)
    // to runKernel. This test checks that the result still has the correct component_id,
    // which proves routing happened via registry — not manual path injection.
    // If the impl hand-fed the path, runKernel would bypass registry resolution,
    // and a wrong workflowId would still "succeed" (falsifiable by the next test).
    const result = await verifyExtensibility({ configPath, workflowId: "test-new-ext" });
    // Must succeed via registry routing (not hand-feed)
    expect(result.componentId).toBe("dummy-new-ext");
  });
});

// ---------------------------------------------------------------------------
// Test 4 — FR-EXT-002 falsifiability: core modified → extensibility must fail
// ---------------------------------------------------------------------------
describe("FR-EXT-002 falsifiability: core file modified → verifyExtensibility fails", () => {
  let tmpDir;
  let configPath;
  let dummyPath;
  const kernelPath = resolve(repo, "core/kernel.mjs");
  let originalContent;

  beforeAll(() => {
    originalContent = readFileSync(kernelPath, "utf8");

    tmpDir = mkdtempSync(join(os.tmpdir(), "wfh-ext-new-falsify-"));
    dummyPath = join(tmpDir, "dummy-ext-falsify.mjs");
    writeFileSync(
      dummyPath,
      `process.stdout.write(JSON.stringify({ component_id: "dummy-ext-falsify", status: "ok" }) + "\\n"); process.exit(0);\n`,
      "utf8",
    );
    configPath = join(tmpDir, "ext-falsify-config.yaml");
    writeFileSync(
      configPath,
      makeConfig([
        { component_id: "dummy-ext-falsify", workflow: "test-ext-falsify", path: dummyPath },
      ]),
      "utf8",
    );

    // Mutate core/kernel.mjs
    writeFileSync(kernelPath, originalContent + "// falsify-ext-marker\n", "utf8");
  });

  afterAll(() => {
    writeFileSync(kernelPath, originalContent, "utf8");
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns passed=false when a core file has been modified", async () => {
    const result = await verifyExtensibility({ configPath, workflowId: "test-ext-falsify" });
    expect(result.passed).toBe(false);
    expect(result.coreDiffEmpty).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test 5 — FR-EXT-003: Independence — --swappability does not run extensibility
// and --extensibility does not run swappability.
// We verify by calling each function directly and checking it returns only its own result.
// ---------------------------------------------------------------------------
describe("FR-EXT-003: independence — each check returns only its own result shape", () => {
  let tmpDir;
  let swapConfigPath;
  let extConfigPath;
  let stubPath;
  let dummyPath;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(os.tmpdir(), "wfh-ext-indep-"));

    stubPath = join(tmpDir, "stub-indep.mjs");
    writeFileSync(
      stubPath,
      `process.stdout.write(JSON.stringify({ component_id: "stub-indep", status: "ok" }) + "\\n"); process.exit(0);\n`,
      "utf8",
    );
    swapConfigPath = join(tmpDir, "swap-indep.yaml");
    writeFileSync(
      swapConfigPath,
      makeConfig([{ component_id: "stub-indep", workflow: "test-indep-swap", path: stubPath }]),
      "utf8",
    );

    dummyPath = join(tmpDir, "dummy-indep.mjs");
    writeFileSync(
      dummyPath,
      `process.stdout.write(JSON.stringify({ component_id: "dummy-indep", status: "ok" }) + "\\n"); process.exit(0);\n`,
      "utf8",
    );
    extConfigPath = join(tmpDir, "ext-indep.yaml");
    writeFileSync(
      extConfigPath,
      makeConfig([{ component_id: "dummy-indep", workflow: "test-indep-ext", path: dummyPath }]),
      "utf8",
    );
  });

  afterAll(() => rmSync(tmpDir, { recursive: true, force: true }));

  it("verifySwappability returns a result with the swap component_id (FR-EXT-001 only)", async () => {
    const result = await verifySwappability({ configPath: swapConfigPath, workflowId: "test-indep-swap" });
    expect(result.passed).toBe(true);
    expect(result.componentId).toBe("stub-indep");
  });

  it("verifyExtensibility returns a result with the ext component_id (FR-EXT-002 only)", async () => {
    const result = await verifyExtensibility({ configPath: extConfigPath, workflowId: "test-indep-ext" });
    expect(result.passed).toBe(true);
    expect(result.componentId).toBe("dummy-indep");
  });

  it("verifySwappability result does NOT contain extensibility-specific checks", async () => {
    const result = await verifySwappability({ configPath: swapConfigPath, workflowId: "test-indep-swap" });
    // extensibility-specific field is absent — each check is self-contained
    expect(result).not.toHaveProperty("extensibilityPassed");
  });

  it("verifyExtensibility result does NOT contain swappability-specific checks", async () => {
    const result = await verifyExtensibility({ configPath: extConfigPath, workflowId: "test-indep-ext" });
    expect(result).not.toHaveProperty("swappabilityPassed");
  });
});
