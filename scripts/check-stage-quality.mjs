#!/usr/bin/env node
/**
 * check-stage-quality.mjs — M5 Phase 3 (FR-GATE-001/002/003/004)
 *
 * CI scanner: detects "quality-class blocking" anti-patterns (V6 traps) in the
 * metrics/ and scripts/ source tree. This is a CI-layer scan only — it does NOT
 * add a runtime block of its own; it exits non-zero when it finds code that
 * does add such blocks incorrectly.
 *
 * Scan scope: metrics/ + scripts/, EXCLUDING this file itself.
 *
 * Three anti-pattern classes detected:
 *   V6① (FR-GATE-002): fact-collection failure wired as BLOCKING (throw/exit/block)
 *                        instead of warn-and-continue.
 *   V6② (FR-RESULT-003): stage_result contract imported AND used to throw/block
 *                          at runtime (spec-layer format used as runtime gate).
 *   V6③ (FR-GATE-001): unmeasurable/subjective metric auto-blocking (gate that
 *                        blocks on a metric that cannot be objectively measured).
 *
 * Exit codes:
 *   0 — no violations found (clean repo)
 *   1 — one or more violations found
 *   2 — unexpected internal error
 *
 * CLI:
 *   node scripts/check-stage-quality.mjs             # scan (default)
 *   node scripts/check-stage-quality.mjs --self-test # inject real violation + assert detection
 */

import { readFileSync, readdirSync, statSync, writeFileSync, unlinkSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

// The scanner's own basename — excluded from scan to prevent false-flagging its
// own pattern strings.
const SELF_BASENAME = "check-stage-quality.mjs";

// ---------------------------------------------------------------------------
// Anti-pattern class definitions
// ---------------------------------------------------------------------------

/**
 * V6① (FR-GATE-002): fact-collection failure wired as BLOCKING.
 *
 * The compliant pattern (Phase 1/2): collectFacts wraps everything in try/catch
 * and emits process.stderr.write on failure — it NEVER throws out to the caller.
 * The violation pattern: a try/catch around fact collection (or a catch clause for
 * fact collection errors) that re-throws or calls process.exit(1).
 *
 * Detection: look for a catch block that directly follows a collectFacts call AND
 * contains a throw or process.exit(1). We use a two-part heuristic:
 *   - Presence of `collectFacts` in the file, AND
 *   - A catch block (after collectFacts context) containing `throw` or `process.exit(1)`.
 *
 * More precisely: scan for lines where collectFacts is called inside a try block
 * whose matching catch contains throw or process.exit(1).
 *
 * Because full AST parsing is overkill for a heuristic CI scanner, we use a
 * focused multi-line regex over the file text:
 *   Matches: collectFacts(...) ... catch ... { ... throw / process.exit(1) ... }
 * where the catch body closes within ~10 lines. We anchor on the token sequence
 * to avoid flagging the warn-only path.
 *
 * Simpler heuristic that is FALSIFIABLE:
 * A file is flagged if it contains BOTH:
 *   (a) a call to collectFacts (or a function named collectFacts / collectfacts / collect_facts)
 *   (b) a catch clause containing `throw ` or `process.exit(1)` within 15 lines of (a).
 *
 * This is precise enough to be falsifiable: the real collector.mjs has collectFacts
 * calling process.stderr.write in its catch — not throw or process.exit(1) — so it
 * passes. A violation file that throws from a catch after collectFacts is flagged.
 */
const V6_1_FACT_COLLECT_BLOCK = {
  id: "V6①",
  fr: "FR-GATE-002",
  description: "fact-collection failure wired as blocking (throw/exit in catch after collectFacts)",
  // Applied per-file: match collectFacts...catch...throw|process.exit(1) within proximity
  detect(content) {
    // Find indices of collectFacts calls
    const callPattern = /\bcollectFacts\s*\(/g;
    const catchBlockPattern = /\bcatch\s*\([^)]*\)\s*\{([^}]{0,600})\}/gs;

    let m;
    callPattern.lastIndex = 0;
    while ((m = callPattern.exec(content)) !== null) {
      const afterCall = content.slice(m.index, m.index + 800);
      // Check if a catch block within ~800 chars of the call contains throw or process.exit(1)
      catchBlockPattern.lastIndex = 0;
      let cm;
      while ((cm = catchBlockPattern.exec(afterCall)) !== null) {
        const catchBody = cm[1];
        // Compliant pattern: warn via stderr.write — does NOT throw or exit
        // Violation: throw keyword (re-throw) OR process.exit(1)
        // Strip single-line comments before testing — prevents false-positives from
        // comments like "// never throw" inside an otherwise-compliant warn-only catch.
        const catchBodyNoComments = catchBody.replace(/\/\/[^\n]*/g, "");
        if (/\bthrow\b/.test(catchBodyNoComments) || /process\.exit\s*\(\s*1\s*\)/.test(catchBodyNoComments)) {
          return { found: true, match: cm[0].slice(0, 120) };
        }
      }
    }
    return { found: false };
  },
};

/**
 * V6② (FR-RESULT-003): stage_result contract imported AND used to block at runtime.
 *
 * The compliant use of stage_result / stage-result: it is a CI/spec-layer format
 * validator (used in check scripts that exit 0/1 as a CI gate). The violation is
 * importing stage_result contract in a RUNTIME module (metrics/ or runtime path)
 * and using it to throw/block.
 *
 * Detection (two conditions must both be true in the same file):
 *   (a) import or require of a "stage-result" or "stage_result" contract/schema
 *   (b) the file then uses that import to throw new Error or process.exit(1)
 *       (indicating runtime blocking rather than CI-only reporting).
 */
const V6_2_STAGE_RESULT_RUNTIME_BLOCK = {
  id: "V6②",
  fr: "FR-RESULT-003",
  description: "stage_result/stage-result contract used to throw/block at runtime",
  detect(content) {
    // Check (a): import of stage-result or stage_result
    const importsPat = /(?:import|require)\s*[^;'"]*['"].*stage[_-]result.*['"]/i;
    if (!importsPat.test(content)) return { found: false };

    // Check (b): a throw or process.exit(1) in same file (runtime blocking)
    if (/\bthrow\s+new\s+Error\b/.test(content) || /process\.exit\s*\(\s*1\s*\)/.test(content)) {
      return { found: true, match: "stage_result imported + throw/exit(1) detected" };
    }
    return { found: false };
  },
};

/**
 * V6③ (FR-GATE-001): unmeasurable/subjective metric auto-blocking.
 *
 * Detection: look for a gate/block/exit on a "metric" that is described in
 * subjective/unmeasurable terms. Specific markers:
 *   - A gate/if/check that blocks on "is_small", "small_enough", "complexity",
 *     "subjective", or "is_good_enough" — these cannot be objectively measured.
 *   - Combined with a throw or process.exit(1) — i.e., it's a hard block.
 *
 * The compliant Phase 1/2 code uses numeric thresholds (rework_rounds > N,
 * duration_ms > N) which ARE measurable. The violation is blocking on a metric
 * that can't be objectively evaluated without human judgment.
 */
const V6_3_UNMEASURABLE_AUTOBLOCK = {
  id: "V6③",
  fr: "FR-GATE-001",
  description: "unmeasurable/subjective metric used as automatic gate (auto-block)",
  detect(content) {
    // Markers: identifiers that are subjective/unmeasurable by nature
    const subjectiveMarkers = /\b(?:is_small(?:_enough)?|small_enough|is_good_enough|subjective_quality|complexity_ok|qualitative_pass)\b/i;
    if (!subjectiveMarkers.test(content)) return { found: false };

    // Must also block (throw or exit(1)) — distinguishes logging from gating
    if (/\bthrow\b/.test(content) || /process\.exit\s*\(\s*1\s*\)/.test(content)) {
      const m = subjectiveMarkers.exec(content);
      return { found: true, match: m ? m[0] : "subjective marker + block" };
    }
    return { found: false };
  },
};

const CLASSES = [V6_1_FACT_COLLECT_BLOCK, V6_2_STAGE_RESULT_RUNTIME_BLOCK, V6_3_UNMEASURABLE_AUTOBLOCK];

// ---------------------------------------------------------------------------
// File collection: metrics/ + scripts/, exclude self
// ---------------------------------------------------------------------------

function collectScanFiles(extraFiles = []) {
  const scanDirs = [
    join(repoRoot, "metrics"),
    join(repoRoot, "scripts"),
  ];

  const files = [];

  for (const dir of scanDirs) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue; // dir doesn't exist — skip
    }
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".mjs") && !entry.name.endsWith(".js")) continue;
      // Exclude self
      if (entry.name === SELF_BASENAME) continue;
      files.push(join(dir, entry.name));
    }
  }

  // Recurse one level into metrics/adapters/
  const adaptersDir = join(repoRoot, "metrics", "adapters");
  try {
    const entries = readdirSync(adaptersDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".mjs") && !entry.name.endsWith(".js")) continue;
      files.push(join(adaptersDir, entry.name));
    }
  } catch {
    // adapters dir may not exist — skip
  }

  // Add any extra files (for --self-test injection)
  for (const f of extraFiles) {
    files.push(f);
  }

  return files;
}

// ---------------------------------------------------------------------------
// Core scan logic
// ---------------------------------------------------------------------------

/**
 * scanFiles — run all three anti-pattern class detectors over the given file list.
 * Returns an array of findings: { file, cls, match }.
 */
export function scanFiles(files) {
  const findings = [];

  for (const filePath of files) {
    let content;
    try {
      content = readFileSync(filePath, "utf8");
    } catch (err) {
      // Unreadable file: report as error finding (not a violation count)
      console.error(`[check-stage-quality] WARN: cannot read ${filePath}: ${err.message}`);
      continue;
    }

    for (const cls of CLASSES) {
      const result = cls.detect(content);
      if (result.found) {
        findings.push({ file: filePath, cls: cls.id, fr: cls.fr, match: result.match });
      }
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Normal scan mode
// ---------------------------------------------------------------------------

function runScan() {
  const files = collectScanFiles();
  console.log(`[check-stage-quality] scanning ${files.length} file(s) in metrics/ + scripts/ ...`);

  const findings = scanFiles(files);

  if (findings.length === 0) {
    console.log(`[check-stage-quality] PASS — quality-class blocking gates = 0`);
    process.exit(0);
  }

  for (const f of findings) {
    const rel = relative(repoRoot, f.file);
    console.error(`[check-stage-quality] VIOLATION ${f.cls} (${f.fr}): ${rel}  →  ${f.match}`);
  }
  console.error(`[check-stage-quality] FAIL — ${findings.length} quality-class blocking violation(s) found`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// --self-test mode: inject a REAL temp file, scan it, assert detection
// ---------------------------------------------------------------------------

function runSelfTest() {
  // Create a real temporary file containing a genuine instance of V6① (the
  // clearest and most specific pattern: collectFacts called, caught, re-thrown).
  const tmpFile = join(tmpdir(), `check-stage-quality-selftest-${process.pid}.mjs`);

  // This is a real anti-pattern: collectFacts failure re-throws instead of warn.
  // It matches V6① exactly: collectFacts() in try, catch with throw.
  const violationContent = `
// SELF-TEST VIOLATION FILE — V6① anti-pattern
// fact-collection failure is incorrectly wired as blocking
export async function badFactCollect(cfg) {
  try {
    await collectFacts("exec-1", {}, cfg);
  } catch (err) {
    // V6① violation: fact-collection failure throws instead of warn-and-continue
    throw new Error("fact collection failed: " + err.message);
  }
}
`.trim();

  let testPassed = false;
  try {
    writeFileSync(tmpFile, violationContent, "utf8");

    // Run the SAME scan logic, but scoping to include the injected temp file.
    // Scan only the temp file to isolate the test (proves the scanner sees it).
    const findings = scanFiles([tmpFile]);

    if (findings.length > 0) {
      console.log(`[check-stage-quality] self-test: DETECTED ${findings.length} violation(s) in injected file`);
      console.log(`[check-stage-quality] self-test: PASS — scanner is not a no-op`);
      testPassed = true;
    } else {
      console.error(`[check-stage-quality] self-test: FAIL — injected violation was NOT detected (scanner is blind)`);
      testPassed = false;
    }
  } catch (err) {
    console.error(`[check-stage-quality] self-test: ERROR — ${err.message}`);
    testPassed = false;
  } finally {
    // Always clean up the temp file
    try { unlinkSync(tmpFile); } catch { /* ignore cleanup failure */ }
  }

  process.exit(testPassed ? 0 : 1);
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    runSelfTest();
  } else {
    runScan();
  }
}
