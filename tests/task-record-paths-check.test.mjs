import { afterEach, describe, expect, it } from "vitest";
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checker = resolve(repoRoot, "tools/cli/check-task-record-paths.mjs");
const temporary = [];
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

function run(root = repoRoot) {
  return spawnSync(process.execPath, [checker, "--root", root], {
    cwd: root,
    encoding: "utf8",
  });
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-task-context-check-"));
  temporary.push(root);
  mkdirSync(join(root, "tools", "cli"), { recursive: true });
  cpSync(checker, join(root, "tools", "cli", "check-task-record-paths.mjs"));
  mkdirSync(join(root, "runtime", "task"), { recursive: true });
  writeFileSync(join(root, "runtime", "task", "task-identity.mjs"), "export const taskPath = join(root, 'Projects', project, 'tasks', task);\n");
  for (const stage of stages) {
    const directory = join(root, "workflows", stage);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, "SKILL.md"),
      "Use StageContext from core/stage-context.mjs via bootstrapStage.\n",
    );
  }
  return root;
}

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true });
});

describe("TaskContext static guard", () => {
  it("passes the migrated repository contract", () => {
    const result = run();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("TaskContext is the only stage path contract");
  });

  it("accepts a minimal repository without a generic stage bootstrap protocol", () => {
    const result = run(fixture());
    expect(result.status, result.stderr).toBe(0);
  });

  it.each([
    ["core/task-dir-parser.mjs", "legacy task-dir parser"],
    ["resolveTaskRecordPaths(taskId)", "legacy task-record resolver"],
    ["WORKFLOWHUB_TASK_DIR", "must not read"],
    ["WORKFLOWHUB_TASK_TRACKING_ROOT", "unsupported"],
    ["process.cwd()", "cwd identity"],
    ["const storageRoot = caller.storageRoot", "caller-supplied"],
    ["const taskPath = caller.taskPath", "caller-supplied"],
    ["git remote get-url origin", "Git remote identity"],
  ])("rejects forbidden stage contract: %s", (bad, reason) => {
    const root = fixture();
    writeFileSync(
      join(root, "workflows", "verify-code", "SKILL.md"),
      `Use StageContext from core/stage-context.mjs via bootstrapStage.\n${bad}\n`,
    );
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(reason);
  });

  it("rejects literal tasks path assembly outside task-identity", () => {
    const root = fixture();
    writeFileSync(
      join(root, "workflows", "build-code", "sidecar.mjs"),
      "import { join } from 'node:path'; export const bad = join(root, 'tasks', taskId);\n",
    );
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("only legal in runtime/task/task-identity.mjs");
  });

  it("scans transitive runtime imports outside the fixed component roots", () => {
    const root = fixture();
    mkdirSync(join(root, "metrics"), { recursive: true });
    writeFileSync(join(root, "metrics", "sidecar.mjs"), "export const bad = process.cwd();\n");
    writeFileSync(join(root, "workflows", "verify-code", "runtime.mjs"), "import '../../metrics/sidecar.mjs';\n");
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("metrics/sidecar.mjs");
    expect(result.stderr).toContain("cwd identity discovery");
  });

  it.each(["core/source-manifest.mjs", "runtime/evidence/requirement-ledger.mjs", "core/task-index.mjs"])("guards identity sidecar bypass in %s even before it is imported", (relativeFile) => {
    const root = fixture();
    const full = join(root, relativeFile); mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, "export const guessed = process.cwd();\n");
    const result = run(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(relativeFile);
    expect(result.stderr).toContain("cwd identity discovery");
  });

  it("does not require every Stage Skill to advertise a generic bootstrap helper", () => {
    const root = fixture();
    writeFileSync(join(root, "workflows", "build-plan", "SKILL.md"), "legacy stage\n");
    const result = run(root);
    expect(result.status, result.stderr).toBe(0);
  });
});
