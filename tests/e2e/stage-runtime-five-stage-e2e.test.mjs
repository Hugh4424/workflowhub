import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore, writeStageRow } from "../../runtime/task/task-store.mjs";

const runtime = fileURLToPath(new URL("../../tools/cli/stage-runtime.mjs", import.meta.url));

describe("public vNext runtime cutover", () => {
  it("exposes only the compact public behavior surface", () => {
    const help = spawnSync(process.execPath, [runtime, "help"], { encoding: "utf8" });
    expect(help.status, help.stderr).toBe(0);
    expect(JSON.parse(help.stdout).behaviors).toEqual(expect.arrayContaining([
      "doctor", "status", "run", "review", "verify", "confirm", "authorize",
    ]));
  });

  it.each(["prepare", "recover-run", "verify-recovery", "invoke-stage-skill"])(
    "proves deleted internal command %s is unreachable",
    (command) => {
      const result = spawnSync(process.execPath, [
        runtime, command, "--stage=make-decision", "--project=Demo", "--task=missing",
      ], { encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toMatch(/unknown public runtime behavior|usage/i);
    },
  );

  it.each([
    ["doctor", "workspace"],
    ["status", "begin"],
    ["run", "execute"],
    ["review", "record"],
    ["verify", "execute"],
    ["confirm", "decision"],
    ["authorize", "commit"],
  ])("routes %s:%s before task lookup", (behavior, action) => {
    const reviewRecord = behavior === "review" && action === "record";
    const root = reviewRecord
      ? realpathSync(mkdtempSync(join(tmpdir(), "card10-review-route-"))) : null;
    try {
      let taskArguments = ["--project=Demo", "--task=missing"];
      let missingTaskPath;
      if (reviewRecord) {
        missingTaskPath = join(root, "Projects", "workflowhub", "tasks", "missing-review-owned");
        const inputPath = join(root, "review-request.json");
        const envelope = { request: {
          stage: "make-decision", review_track: "direction",
          subject_kind: "document", surface: "document",
          materials: {
            raw_requirement: "# Owned routing requirement\n",
            objective_facts: "# Owned routing facts\n",
            convergence_outline: "# Owned convergence outline\n",
          },
        } };
        mkdirSync(missingTaskPath, { recursive: true });
        writeFileSync(inputPath, `${JSON.stringify(envelope)}\n`);
        taskArguments = ["--project=workflowhub", "--task=missing-review-owned",
          `--task-path=${missingTaskPath}`, `--input=${inputPath}`];
      }
      const result = spawnSync(process.execPath, [
        runtime, behavior, `--action=${action}`, "--stage=make-decision",
        ...taskArguments,
      ], { encoding: "utf8", ...(reviewRecord ? { cwd: root } : {}) });
    expect(`${result.stdout}${result.stderr}`).not.toMatch(/unknown public runtime behavior|unknown public runtime action/i);
      if (reviewRecord) {
        expect(result.status).not.toBe(0);
        const error = JSON.parse(result.stderr.trim());
        expect(error.code).toBe("ENOENT");
        expect(error.error).toContain(join(missingTaskPath, "task.json"));
        expect(error.stack).toContain("openTask");
        expect(error.stack).toContain("bootstrapStage");
        expect(`${result.stdout}${result.stderr}`).not.toMatch(/requires --input|requires a request|MATERIAL_INCOMPLETE|REVIEW_IDENTITY_INVALID/);
        expect(existsSync(join(missingTaskPath, "task.json"))).toBe(false);
      }
    } finally {
      if (root !== null) rmSync(root, { recursive: true, force: true });
    }
  });


  it("rejects retired review:risk without changing actual owned task facts", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "card10-retired-risk-")));
    try {
      const createdAt = new Date().toISOString();
      const task = await createTask({
        storageRoot: root,
        manifest: {
          schema_version: "1.0.0", project_name: "workflowhub",
          task_id: "card10-retired-risk-owned", created_at: createdAt,
          target_repo_root: root, activation_cohort: "post",
          record_model: "vnext-single-write", execution_mode: "per_invocation",
          issue_ids: [], inputs: {},
        },
      });
      await initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
      await writeStageRow(task.taskPath, {
        task_id: task.identity.taskId, stage: "make-decision",
        source: "owned retired-risk rejection fixture; no completion claim",
        created_at: createdAt,
      });
      const factsPath = join(task.taskPath, "facts.jsonl");
      const before = readFileSync(factsPath);
      expect(before.length).toBeGreaterThan(0);
      const result = spawnSync(process.execPath, [
        runtime, "review", "--action=risk", "--stage=make-decision",
        "--project=workflowhub", "--task=card10-retired-risk-owned",
        `--task-path=${task.taskPath}`,
      ], { encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toMatch(/unknown public runtime action/i);
      expect(readFileSync(factsPath).equals(before)).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

});
