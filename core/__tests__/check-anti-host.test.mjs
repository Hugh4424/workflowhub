/**
 * check-anti-host.test.mjs
 * TDD tests for scripts/check-anti-host.mjs and scripts/scan-core-files.mjs.
 *
 * FR-GUARD-001: each bad-fixture class triggers a non-zero exit
 * FR-GUARD-002: --self-test proves all four regex classes fire
 * FR-CI-001:    scanCoreFiles() is the single boundary anchor; it grows with core/
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync } from "child_process";
import { existsSync, writeFileSync, unlinkSync, mkdirSync, rmdirSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const repoRoot = resolve(fileURLToPath(import.meta.url), "..", "..", "..");
const checkAntiHost = join(repoRoot, "scripts", "check-anti-host.mjs");
const scanCoreFiles = join(repoRoot, "scripts", "scan-core-files.mjs");
const badFixtures = join(repoRoot, "fixtures", "anti-host-bad");

/**
 * Run a script via `node` and return { code, stdout, stderr }.
 */
function run(scriptPath, args = []) {
  try {
    const stdout = execFileSync(process.execPath, [scriptPath, ...args], {
      encoding: "utf8",
      env: { ...process.env },
    });
    return { code: 0, stdout, stderr: "" };
  } catch (err) {
    return {
      code: err.status ?? 1,
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? "",
    };
  }
}

// ---------------------------------------------------------------------------
// FR-CI-001: scanCoreFiles() boundary anchor
// ---------------------------------------------------------------------------
describe("scanCoreFiles — boundary anchor (FR-CI-001)", () => {
  it("lists existing core .mjs files", async () => {
    const { scanCoreFiles: scan } = await import(scanCoreFiles);
    const files = scan();
    expect(files.length).toBeGreaterThanOrEqual(6); // 6 known core files
    expect(files.every((f) => f.endsWith(".mjs"))).toBe(true);
  });

  it("excludes __tests__ directory", async () => {
    const { scanCoreFiles: scan } = await import(scanCoreFiles);
    const files = scan();
    expect(files.some((f) => f.includes("__tests__"))).toBe(false);
  });

  it("excludes scripts/ directory (only scans core/)", async () => {
    const { scanCoreFiles: scan } = await import(scanCoreFiles);
    const files = scan();
    expect(files.some((f) => f.includes("/scripts/"))).toBe(false);
  });

  it("grows when a new .mjs is added to core/ — falsifiable membership check", async () => {
    const { scanCoreFiles: scan } = await import(scanCoreFiles);
    const tmpFile = join(repoRoot, "core", "__test_tmp_probe_file__.mjs");
    try {
      // Before: file absent
      const before = scan();
      expect(before.some((f) => f.includes("__test_tmp_probe_file__"))).toBe(false);

      // After adding: must appear
      writeFileSync(tmpFile, "// probe\n");
      const after = scan();
      expect(after.some((f) => f.includes("__test_tmp_probe_file__"))).toBe(true);
    } finally {
      // Cleanup even on failure
      if (existsSync(tmpFile)) unlinkSync(tmpFile);
    }

    // After removing: must disappear
    const cleaned = scan();
    expect(cleaned.some((f) => f.includes("__test_tmp_probe_file__"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// FR-GUARD-001: each bad-fixture class triggers non-zero exit
// ---------------------------------------------------------------------------
describe("check-anti-host — bad fixture exits non-zero (FR-GUARD-001)", () => {
  it("class 1 hardcoded-path.mjs → non-zero exit", () => {
    const fixture = join(badFixtures, "hardcoded-path.mjs");
    const result = run(checkAntiHost, ["--files", fixture]);
    expect(result.code).not.toBe(0);
  });

  it("class 2 repo-root-climb.mjs → non-zero exit", () => {
    const fixture = join(badFixtures, "repo-root-climb.mjs");
    const result = run(checkAntiHost, ["--files", fixture]);
    expect(result.code).not.toBe(0);
  });

  it("class 3 source-derived.mjs → non-zero exit", () => {
    const fixture = join(badFixtures, "source-derived.mjs");
    const result = run(checkAntiHost, ["--files", fixture]);
    expect(result.code).not.toBe(0);
  });

  it("class 4 claude-hook.mjs → non-zero exit", () => {
    const fixture = join(badFixtures, "claude-hook.mjs");
    const result = run(checkAntiHost, ["--files", fixture]);
    expect(result.code).not.toBe(0);
  });
});

// ---------------------------------------------------------------------------
// FR-GUARD-001: output describes the detected class
// ---------------------------------------------------------------------------
describe("check-anti-host — output mentions detected class (FR-GUARD-001)", () => {
  it("class 1 reports hardcoded-path", () => {
    const fixture = join(badFixtures, "hardcoded-path.mjs");
    const { stdout } = run(checkAntiHost, ["--files", fixture]);
    expect(stdout).toMatch(/hardcoded.path|class.1|absolute.path/i);
  });

  it("class 2 reports repo-root-climb", () => {
    const fixture = join(badFixtures, "repo-root-climb.mjs");
    const { stdout } = run(checkAntiHost, ["--files", fixture]);
    expect(stdout).toMatch(/repo.root|class.2|climb/i);
  });

  it("class 3 reports source-derived", () => {
    const fixture = join(badFixtures, "source-derived.mjs");
    const { stdout } = run(checkAntiHost, ["--files", fixture]);
    expect(stdout).toMatch(/source.derived|class.3|\.machine|\.agenthub/i);
  });

  it("class 4 reports claude-hook", () => {
    const fixture = join(badFixtures, "claude-hook.mjs");
    const { stdout } = run(checkAntiHost, ["--files", fixture]);
    expect(stdout).toMatch(/claude.hook|class.4|PreToolUse|PostToolUse|SessionStart/i);
  });
});

// ---------------------------------------------------------------------------
// FR-GUARD-002: --self-test proves four classes fire
// ---------------------------------------------------------------------------
describe("check-anti-host --self-test (FR-GUARD-002)", () => {
  it("exits 0 (all four classes caught)", () => {
    const result = run(checkAntiHost, ["--self-test"]);
    expect(result.code).toBe(0);
  });

  it("reports all four classes detected", () => {
    const { stdout } = run(checkAntiHost, ["--self-test"]);
    expect(stdout).toMatch(/class.?1|hardcoded.path/i);
    expect(stdout).toMatch(/class.?2|repo.root/i);
    expect(stdout).toMatch(/class.?3|source.derived/i);
    expect(stdout).toMatch(/class.?4|claude.hook/i);
  });
});

// ---------------------------------------------------------------------------
// Clean core scanned by default → exit 0
// ---------------------------------------------------------------------------
describe("check-anti-host default scan (no --files)", () => {
  it("exits 0 on existing clean core files", () => {
    const result = run(checkAntiHost);
    expect(result.code).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// FR-GUARD-001 class 4 extension: .claude/ non-hooks paths must also be caught
// ---------------------------------------------------------------------------
describe("check-anti-host — class 4 catches generic .claude/ host paths", () => {
  it("claude-path.mjs (.claude/settings.json) → non-zero exit", () => {
    const fixture = join(badFixtures, "claude-path.mjs");
    const result = run(checkAntiHost, ["--files", fixture]);
    expect(result.code).not.toBe(0);
  });

  it("claude-path.mjs reports class 4 (claude-hook)", () => {
    const fixture = join(badFixtures, "claude-path.mjs");
    const { stdout } = run(checkAntiHost, ["--files", fixture]);
    expect(stdout).toMatch(/claude.hook|class.4/i);
  });
});
