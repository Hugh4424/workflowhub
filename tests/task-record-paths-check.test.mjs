import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const checker = resolve(repoRoot, "scripts/check-task-record-paths.mjs");

function runChecker(cwd = repoRoot) {
  return spawnSync(process.execPath, [checker, "--root", cwd], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

describe("check-task-record-paths", () => {
  it("passes the repository stage path contract", () => {
    const result = runChecker();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("[check-task-record-paths] PASS");
  });

  it("fails when a stage prompt omits task-record-paths bootstrap", () => {
    const tmp = mkdtempSync(join(tmpdir(), "task-record-paths-check-"));
    try {
      for (const dir of ["scripts", "core", "workflows", "skills"]) {
        cpSync(resolve(repoRoot, dir), join(tmp, dir), { recursive: true });
      }
      writeFileSync(
        join(tmp, "workflows", "verify-code", "SKILL.md"),
        "stage prompt without canonical task record path bootstrap\n"
      );

      const result = runChecker(tmp);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("workflows/verify-code/SKILL.md");
      expect(result.stderr).toContain("core/task-record-paths.mjs");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("fails on runtime code that directly joins repo-local tasks", () => {
    const tmp = mkdtempSync(join(tmpdir(), "task-record-paths-check-"));
    try {
      for (const dir of ["scripts", "core", "workflows", "skills"]) {
        cpSync(resolve(repoRoot, dir), join(tmp, dir), { recursive: true });
      }
      mkdirSync(join(tmp, "scripts"), { recursive: true });
      writeFileSync(
        join(tmp, "scripts", "bad-task-path.mjs"),
        "import { join } from 'node:path';\nexport const p = join(process.cwd(), \"tasks\", taskId, \"worktree.json\");\n"
      );

      const result = runChecker(tmp);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("scripts/bad-task-path.mjs");
      expect(result.stderr).toContain("literal \"tasks\"");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
