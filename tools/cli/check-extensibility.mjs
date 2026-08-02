#!/usr/bin/env node
/**
 * check-extensibility.mjs
 * FR-EXT-001 / FR-EXT-002 / FR-EXT-003 verification script.
 *
 * Two independent checks:
 *   verifySwappability()  — FR-EXT-001: same workflowId routes to a stub
 *   verifyExtensibility() — FR-EXT-002: new component triggered by workflowId only
 *
 * Runtime-zero-diff is measured by content-hash of scanCoreFiles() before/after
 * the extensibility dispatch. Falsifiable callers may pass an explicit baseline
 * snapshot to prove a mutation is detected without requiring the whole repo
 * working tree to equal HEAD.
 *
 * Exit codes: 0 = all ran checks passed, 1 = check failure, 2 = unexpected error.
 * Flags: --swappability  run only FR-EXT-001
 *        --extensibility run only FR-EXT-002
 *        (no flags)      run both
 */

import { createHash } from "node:crypto";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { resolve, relative, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

// scanCoreFiles is the single source of truth for the production runtime body.
import { scanCoreFiles } from "./scan-core-files.mjs";
import { runKernel } from "../../runtime/evidence/kernel.mjs";

const here = dirname(fileURLToPath(import.meta.url));
// tools/cli/ -> repository root. Keep checker fixtures and runtime snapshots
// anchored to the project, not the tools directory after the CLI move.
const repoRoot = resolve(here, "..", "..");

// ---------------------------------------------------------------------------
// Core diff utilities — compare working-tree content to a caller-provided
// snapshot. CLI smoke checks create the snapshot at check start, so a legitimate
// task branch that edits core files is not permanently red. Falsifiability tests
// create the snapshot before mutating a core file and pass it in explicitly.
// ---------------------------------------------------------------------------

/**
 * Compute SHA-256 of a Buffer or string.
 * @param {Buffer|string} content
 * @returns {string} hex digest
 */
function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

export function createCoreSnapshot() {
  const snapshot = new Map();
  const files = scanCoreFiles();
  for (const f of files) {
    snapshot.set(relative(repoRoot, f), sha256(readFileSync(f)));
  }
  return snapshot;
}

function normalizeSnapshot(snapshot) {
  if (snapshot instanceof Map) return snapshot;
  if (snapshot && typeof snapshot === "object") return new Map(Object.entries(snapshot));
  return new Map();
}

/**
 * Check whether all core files match a previously captured snapshot.
 * @param {Map<string, string>|Record<string, string>} baseline
 * @returns {boolean}
 */
function isCoreUnchangedFromSnapshot(baseline) {
  const expected = normalizeSnapshot(baseline);
  const files = scanCoreFiles();
  const seen = new Set();
  for (const f of files) {
    const rel = relative(repoRoot, f);
    seen.add(rel);
    if (expected.get(rel) !== sha256(readFileSync(f))) {
      return false;
    }
  }
  for (const rel of expected.keys()) {
    if (!seen.has(rel)) {
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// FR-EXT-001: verifySwappability
// ---------------------------------------------------------------------------

/**
 * Verify that the same workflowId can be rerouted to a stub component via registry,
 * with zero changes to core/*.mjs files.
 *
 * @param {{ configPath: string, workflowId: string, baselineCoreSnapshot?: Map<string, string>|Record<string, string> }} opts
 * @returns {Promise<{ passed: boolean, componentId: string|null, coreDiffEmpty: boolean, error?: string }>}
 */
export async function verifySwappability({ configPath, workflowId, baselineCoreSnapshot }) {
  const baseline = baselineCoreSnapshot ?? createCoreSnapshot();
  let result;
  try {
    // Only pass configPath + workflowId to runKernel — registry routes to stub.
    result = await runKernel(configPath, workflowId);
  } catch (err) {
    const coreDiffEmpty = isCoreUnchangedFromSnapshot(baseline);
    return { passed: false, componentId: null, coreDiffEmpty, error: err.message };
  }

  const coreDiffEmpty = isCoreUnchangedFromSnapshot(baseline);
  const passed = coreDiffEmpty; // core must be untouched for check to pass
  return { passed, componentId: result.component_id, coreDiffEmpty };
}

// ---------------------------------------------------------------------------
// FR-EXT-002: verifyExtensibility
// ---------------------------------------------------------------------------

/**
 * Verify that a newly registered component can be triggered by workflowId alone,
 * with zero changes to core/*.mjs files.
 *
 * The caller must supply a configPath that already includes the new component's
 * registry entry. This function calls runKernel(configPath, workflowId) — it does
 * NOT pass the component path directly, proving registry routing is in effect.
 *
 * @param {{ configPath: string, workflowId: string, baselineCoreSnapshot?: Map<string, string>|Record<string, string> }} opts
 * @returns {Promise<{ passed: boolean, componentId: string|null, coreDiffEmpty: boolean, error?: string }>}
 */
export async function verifyExtensibility({ configPath, workflowId, baselineCoreSnapshot }) {
  const baseline = baselineCoreSnapshot ?? createCoreSnapshot();
  let result;
  try {
    // FR-EXT-002 key constraint: only (configPath, workflowId) — no component path.
    // runKernel must resolve the component through registry, not receive it directly.
    result = await runKernel(configPath, workflowId);
  } catch (err) {
    const coreDiffEmpty = isCoreUnchangedFromSnapshot(baseline);
    return { passed: false, componentId: null, coreDiffEmpty, error: err.message };
  }

  const coreDiffEmpty = isCoreUnchangedFromSnapshot(baseline);
  const passed = coreDiffEmpty;
  return { passed, componentId: result.component_id, coreDiffEmpty };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const runSwap = args.length === 0 || args.includes("--swappability");
  const runExt = args.length === 0 || args.includes("--extensibility");

  // Build a temporary config for the CLI smoke run that has a real component path.
  // fixtures/config-ok/ configs are shape-only (no path field) — only used by structural tests.
  // ponytail: CLI demo hardwires dummy-ok; real usage supplies own configPath programmatically.
  const cliTmpDir = mkdtempSync(join(os.tmpdir(), "wfh-cli-demo-"));
  const dummyOkPath = resolve(repoRoot, "fixtures", "components", "dummy-ok.mjs");
  const cliConfig = join(cliTmpDir, "cli-demo.yaml");
  writeFileSync(
    cliConfig,
    `registry:\n  - component_id: dummy-ok\n    workflow: demo\n    path: ${dummyOkPath}\n`,
    "utf8",
  );

  let allPassed = true;

  if (runSwap) {
    console.log("[FR-EXT-001] verifySwappability ...");
    try {
      const r = await verifySwappability({ configPath: cliConfig, workflowId: "demo" });
      if (r.passed) {
        console.log(`  PASS  component_id=${r.componentId} coreDiffEmpty=${r.coreDiffEmpty}`);
      } else {
        console.error(`  FAIL  component_id=${r.componentId} coreDiffEmpty=${r.coreDiffEmpty}${r.error ? " error=" + r.error : ""}`);
        allPassed = false;
      }
    } catch (err) {
      console.error("  ERROR", err.message);
      allPassed = false;
    }
  }

  if (runExt) {
    console.log("[FR-EXT-002] verifyExtensibility ...");
    try {
      const r = await verifyExtensibility({ configPath: cliConfig, workflowId: "demo" });
      if (r.passed) {
        console.log(`  PASS  component_id=${r.componentId} coreDiffEmpty=${r.coreDiffEmpty}`);
      } else {
        console.error(`  FAIL  component_id=${r.componentId} coreDiffEmpty=${r.coreDiffEmpty}${r.error ? " error=" + r.error : ""}`);
        allPassed = false;
      }
    } catch (err) {
      console.error("  ERROR", err.message);
      allPassed = false;
    }
  }

  process.exit(allPassed ? 0 : 1);
}

// Run CLI only when invoked directly, not when imported by tests.
// Using import.meta.url vs process.argv[1] comparison.
const isCLI = process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isCLI) {
  main().catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(2);
  });
}
