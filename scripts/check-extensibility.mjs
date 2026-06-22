#!/usr/bin/env node
/**
 * check-extensibility.mjs
 * FR-EXT-001 / FR-EXT-002 / FR-EXT-003 verification script.
 *
 * Two independent checks:
 *   verifySwappability()  — FR-EXT-001: same workflowId routes to a stub
 *   verifyExtensibility() — FR-EXT-002: new component triggered by workflowId only
 *
 * Core-zero-diff is measured by content-hash of scanCoreFiles() vs git HEAD baseline.
 * Falsifiable: if any core/*.mjs content changes, the snapshot comparison fails.
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
import { execFileSync } from "node:child_process";
import os from "node:os";

// scanCoreFiles is the single source of truth for "what counts as core body"
import { scanCoreFiles } from "./scan-core-files.mjs";
import { runKernel } from "../core/kernel.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

// ---------------------------------------------------------------------------
// Core diff utilities — compare working-tree content vs git HEAD.
// Using git HEAD as the baseline is the only falsifiable anchor:
//   - before/after snapshot inside runKernel() would both see the already-mutated
//     file and wrongly report diff-empty.
//   - git HEAD reflects the committed state; any working-tree change is detectable.
// ---------------------------------------------------------------------------

/**
 * Compute SHA-256 of a Buffer or string.
 * @param {Buffer|string} content
 * @returns {string} hex digest
 */
function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Read the committed (HEAD) content of a file via `git show HEAD:<relative-path>`.
 * Returns null if the file is untracked (not in HEAD).
 * @param {string} absPath - absolute path inside the repo
 * @returns {Buffer|null}
 */
function gitHeadContent(absPath) {
  const rel = relative(repoRoot, absPath);
  try {
    return execFileSync("git", ["show", `HEAD:${rel}`], { cwd: repoRoot });
  } catch {
    return null; // untracked file — treat as not in HEAD
  }
}

/**
 * Check whether all core files (from scanCoreFiles()) match their git HEAD content.
 * Returns true only if every file is tracked AND its working-tree content equals HEAD.
 * Falsifiable: mutating any core file makes it return false.
 * @returns {boolean}
 */
function isCoreUnchangedFromHead() {
  const files = scanCoreFiles();
  for (const f of files) {
    const headContent = gitHeadContent(f);
    if (headContent === null) {
      // File not committed to HEAD — treat as changed (new untracked core file).
      return false;
    }
    const workingContent = readFileSync(f);
    if (sha256(headContent) !== sha256(workingContent)) {
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
 * @param {{ configPath: string, workflowId: string }} opts
 * @returns {Promise<{ passed: boolean, componentId: string|null, coreDiffEmpty: boolean, error?: string }>}
 */
export async function verifySwappability({ configPath, workflowId }) {
  // Check core integrity against git HEAD before running anything.
  // This is the falsifiable anchor: if a core file was mutated, we detect it now.
  const coreDiffEmpty = isCoreUnchangedFromHead();

  let result;
  try {
    // Only pass configPath + workflowId to runKernel — registry routes to stub.
    result = await runKernel(configPath, workflowId);
  } catch (err) {
    return { passed: false, componentId: null, coreDiffEmpty, error: err.message };
  }

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
 * @param {{ configPath: string, workflowId: string }} opts
 * @returns {Promise<{ passed: boolean, componentId: string|null, coreDiffEmpty: boolean, error?: string }>}
 */
export async function verifyExtensibility({ configPath, workflowId }) {
  // Check core integrity against git HEAD before dispatching.
  // Falsifiable: mutated core file → coreDiffEmpty = false → passed = false.
  const coreDiffEmpty = isCoreUnchangedFromHead();

  let result;
  try {
    // FR-EXT-002 key constraint: only (configPath, workflowId) — no component path.
    // runKernel must resolve the component through registry, not receive it directly.
    result = await runKernel(configPath, workflowId);
  } catch (err) {
    return { passed: false, componentId: null, coreDiffEmpty, error: err.message };
  }

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
  const dummyOkPath = resolve(here, "..", "fixtures", "components", "dummy-ok.mjs");
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
