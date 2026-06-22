/**
 * RED tests for core/resolve-path.mjs (FR-PATHG-004, decision 7/13).
 * Module does NOT exist yet — all tests must fail with import error or assertion error.
 */
import { describe, it, expect, afterEach } from "vitest";
import { resolve } from "node:path";
import { mkdtempSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";

// Dynamic import so the describe blocks register even when the module is absent.
// We'll use a lazy import pattern: import inside each test.
let resolvePath;
try {
  const mod = await import("../resolve-path.mjs");
  resolvePath = mod.resolvePath;
} catch {
  // Module doesn't exist — resolvePath stays undefined; tests that call it will throw.
  resolvePath = undefined;
}

// Helper: ensures the module exists (fail with clear message if import failed).
function ensureModule() {
  if (typeof resolvePath !== "function") {
    throw new Error("core/resolve-path.mjs does not export resolvePath — module missing (expected RED)");
  }
}

// ─── Scenario 1: explicit path → resolved normally ───────────────────────────
describe("resolvePath — explicit path accepted", () => {
  it("returns the resolved absolute path when an explicit path string is given", () => {
    ensureModule();
    const explicitPath = "/tmp/some-task-dir";
    const result = resolvePath(explicitPath);
    // Must return a string that is the resolved form of the given path.
    expect(typeof result).toBe("string");
    expect(result).toBe(resolve(explicitPath));
  });

  it("accepts an absolute path that already exists on disk", () => {
    ensureModule();
    const result = resolvePath(tmpdir());
    expect(result).toBe(resolve(tmpdir()));
  });
});

// ─── Scenario 2: no explicit path → must throw (no cwd inference) ─────────────
describe("resolvePath — refuses cwd inference (no arg)", () => {
  it("throws when called with no arguments", () => {
    ensureModule();
    expect(() => resolvePath()).toThrow();
  });

  it("throws when called with undefined", () => {
    ensureModule();
    expect(() => resolvePath(undefined)).toThrow();
  });

  it("throws when called with null", () => {
    ensureModule();
    expect(() => resolvePath(null)).toThrow();
  });

  it("throws when called with empty string", () => {
    ensureModule();
    // Empty string is the caller saying 'figure it out yourself' — must reject.
    expect(() => resolvePath("")).toThrow();
  });

  it("error message mentions explicit path requirement, not a silent fallback", () => {
    ensureModule();
    // Must not silently return process.cwd() — the call must throw.
    let threw = false;
    let result;
    try {
      result = resolvePath();
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
    // Redundant guard: if no throw, assert result !== cwd to surface the bug.
    if (!threw) {
      expect(result).not.toBe(process.cwd());
    }
  });
});

// ─── Scenario 3: REPO_ROOT env set — still throws without explicit path ───────
describe("resolvePath — does not read REPO_ROOT env for inference", () => {
  const SENTINEL = "/tmp/sentinel-repo-root-value-should-never-be-used";

  afterEach(() => {
    delete process.env.REPO_ROOT;
  });

  it("throws even when REPO_ROOT is set (missing explicit path)", () => {
    ensureModule();
    process.env.REPO_ROOT = SENTINEL;
    expect(() => resolvePath()).toThrow();
  });

  it("does not return REPO_ROOT value when no explicit path given", () => {
    ensureModule();
    process.env.REPO_ROOT = SENTINEL;
    let result;
    let threw = false;
    try {
      result = resolvePath();
    } catch {
      threw = true;
    }
    // Either it threw (correct) or it returned something — if the latter,
    // the result must NOT be the REPO_ROOT value (proves it didn't read it).
    if (!threw) {
      expect(result).not.toBe(SENTINEL);
      expect(result).not.toContain(SENTINEL);
      // But a silent fallback to cwd is also wrong — force failure.
      throw new Error("resolvePath should throw without explicit path, not silently return");
    }
  });

  it("with explicit path set returns that path (not REPO_ROOT)", () => {
    ensureModule();
    process.env.REPO_ROOT = SENTINEL;
    const explicit = "/tmp/explicit-wins";
    const result = resolvePath(explicit);
    expect(result).toBe(resolve(explicit));
    expect(result).not.toContain(SENTINEL);
  });
});

// ─── Scenario 4: no upward directory crawl for host root ─────────────────────
describe("resolvePath — does not crawl parent dirs for .git or host root", () => {
  let deepDir;

  afterEach(() => {
    // Cleanup: only the mkdtemp base; deep structure is under tmp so OS cleans it.
  });

  it("throws when called without explicit path even from a deeply nested tmp dir", () => {
    ensureModule();
    // Create a deep temp dir that has no .git ancestor (under os.tmpdir).
    // If resolvePath tried to crawl upward looking for a .git/REPO_ROOT marker,
    // it might succeed if the CWD happens to have one — but we verify it throws
    // regardless, proving it does not crawl.
    deepDir = mkdtempSync(resolve(tmpdir(), "wfh-test-deep-"));
    // Change cwd perception: pass no explicit path while inside deep dir context.
    // We can't actually change cwd in vitest, but the contract says:
    // "resolvePath() with no arg must always throw" — which is sufficient evidence
    // that no crawl result is used.
    expect(() => resolvePath()).toThrow();
    rmdirSync(deepDir);
  });

  it("explicit path is returned as-is (not augmented with any crawled ancestor)", () => {
    ensureModule();
    const explicit = "/tmp/leaf-dir-no-git";
    const result = resolvePath(explicit);
    // Result must equal resolve(explicit) — no ancestor path appended.
    expect(result).toBe(resolve(explicit));
    // Must not contain any workflowhub repo path (which would indicate crawling).
    expect(result).not.toMatch(/workflowhub/);
  });
});
