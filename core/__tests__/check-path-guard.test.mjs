/**
 * check-path-guard.test.mjs
 * TDD tests for scripts/check-path-guard.mjs
 *
 * FR-PATHG-001: changed-files hitting the protected list → non-zero exit
 * FR-PATHG-002: idempotent — runs twice with identical result, writes NO files
 * FR-PATHG-003: --known-gaps outputs honest declaration of bypass methods
 */

import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import {
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  readdirSync,
} from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

const repoRoot = resolve(fileURLToPath(import.meta.url), "..", "..", "..");
const checkPathGuard = join(repoRoot, "scripts", "check-path-guard.mjs");

/**
 * Run the guard script and return { code, stdout, stderr }.
 */
function run(args = []) {
  try {
    const stdout = execFileSync(process.execPath, [checkPathGuard, ...args], {
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
// FR-PATHG-001: protected path → non-zero exit
// ---------------------------------------------------------------------------
describe("check-path-guard — protected path triggers violation (FR-PATHG-001)", () => {
  it("protected file in --files list → exit 1", () => {
    // The guard ships a built-in list; pick a known protected path.
    // We pass the filename string, not an actual on-disk file.
    const result = run(["--files", "CONSTITUTION.md"]);
    expect(result.code).toBe(1);
  });

  it("stdout reports the violating path", () => {
    const result = run(["--files", "CONSTITUTION.md"]);
    expect(result.stdout + result.stderr).toMatch(/CONSTITUTION\.md/);
  });

  it("multiple files: protected + clean → still exit 1", () => {
    const result = run([
      "--files",
      "CONSTITUTION.md",
      "README.md",
    ]);
    expect(result.code).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// pass-through: non-protected path → exit 0
// ---------------------------------------------------------------------------
describe("check-path-guard — non-protected path passes (FR-PATHG-001 pass-through)", () => {
  it("unprotected file → exit 0", () => {
    const result = run(["--files", "some/random/feature.mjs"]);
    expect(result.code).toBe(0);
  });

  it("empty --files list → exit 0 (nothing to violate)", () => {
    const result = run(["--files"]);
    // Either exit 0 (no files) or exit 2 (error: no files provided)
    // Either is acceptable; the key is it does NOT exit 1 (false violation)
    expect(result.code).not.toBe(1);
  });

  // FR-PATHG-001: protected list uses exact repo-relative paths, not suffix patterns.
  // A nested path sharing the same filename must NOT trigger a violation.
  it("nested docs/AGENTS.md (same name, different path) → exit 0 (not in protected list)", () => {
    const result = run(["--files", "docs/AGENTS.md"]);
    expect(result.code).toBe(0);
  });

  it("nested/config/workflowhub.yaml (suffix match, not in list) → exit 0", () => {
    const result = run(["--files", "nested/config/workflowhub.yaml"]);
    expect(result.code).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// FR-PATHG-002: idempotent — two runs produce identical exit code
// ---------------------------------------------------------------------------
describe("check-path-guard — idempotent (FR-PATHG-002)", () => {
  it("two runs on protected path → same exit code", () => {
    const r1 = run(["--files", "CONSTITUTION.md"]);
    const r2 = run(["--files", "CONSTITUTION.md"]);
    expect(r1.code).toBe(r2.code);
  });

  it("two runs on clean path → same exit code", () => {
    const r1 = run(["--files", "src/unrelated.mjs"]);
    const r2 = run(["--files", "src/unrelated.mjs"]);
    expect(r1.code).toBe(r2.code);
  });

  it("does NOT write any files (FR-PATHG-002 write-free)", () => {
    // Create an isolated temp directory, snapshot its contents before and after.
    const tmpDir = join(tmpdir(), `pathguard-idempotent-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });

    function listDir(dir) {
      return readdirSync(dir).sort();
    }

    const before = listDir(tmpDir);

    // Run the guard twice — if it writes any file into cwd or tmpDir we'd see it.
    // We also set cwd to tmpDir so any accidental relative-path writes land there.
    try {
      execFileSync(
        process.execPath,
        [checkPathGuard, "--files", "CONSTITUTION.md"],
        { encoding: "utf8", cwd: tmpDir, env: { ...process.env } }
      );
    } catch (_) {
      // exit 1 is expected; we only care about file-system side effects
    }

    try {
      execFileSync(
        process.execPath,
        [checkPathGuard, "--files", "CONSTITUTION.md"],
        { encoding: "utf8", cwd: tmpDir, env: { ...process.env } }
      );
    } catch (_) {
      // same
    }

    const after = listDir(tmpDir);
    expect(after).toEqual(before); // no new files created

    rmSync(tmpDir, { recursive: true, force: true });
  });
});

// ---------------------------------------------------------------------------
// FR-PATHG-003: --known-gaps outputs honest bypass declaration
// ---------------------------------------------------------------------------
describe("check-path-guard --known-gaps (FR-PATHG-003)", () => {
  it("exits 0 with --known-gaps", () => {
    const result = run(["--known-gaps"]);
    expect(result.code).toBe(0);
  });

  it("output mentions heredoc as a bypass method", () => {
    const { stdout } = run(["--known-gaps"]);
    expect(stdout.toLowerCase()).toMatch(/heredoc/);
  });

  it("output mentions dynamic variable path construction", () => {
    const { stdout } = run(["--known-gaps"]);
    expect(stdout.toLowerCase()).toMatch(/dynamic|variable/);
  });

  it("output mentions external script or process as bypass", () => {
    const { stdout } = run(["--known-gaps"]);
    expect(stdout.toLowerCase()).toMatch(/external|script|process/);
  });
});

// ---------------------------------------------------------------------------
// self-test: bad sample in protected list self-proves detection (FR-PATHG-001)
// ---------------------------------------------------------------------------
describe("check-path-guard --self-test", () => {
  it("exits 0 — self-test finds protected path in built-in bad sample", () => {
    const result = run(["--self-test"]);
    expect(result.code).toBe(0);
  });

  it("self-test output confirms protected path was caught", () => {
    const { stdout } = run(["--self-test"]);
    expect(stdout.toLowerCase()).toMatch(/caught|detected|violation|protected/);
  });
});
