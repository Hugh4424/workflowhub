import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateWorkflowHubStageProgress, deriveStageProgress } from "../../runtime/stage/completion-predicates.mjs";

const read = (path) => readFileSync(path, "utf8");

describe("WorkflowHub stage progress contract", () => {
  it("requires plan and tasks to expose their own stage progress rows", () => {
    const plan = read("specs/requirements-completeness-audit-20260804/plan.md");
    const tasks = read("specs/requirements-completeness-audit-20260804/tasks.md");
    expect(validateWorkflowHubStageProgress({ plan, tasks })).toMatchObject({ ok: true, errors: [] });
  });

  it("reads declared progress without turning quality into a progression gate", () => {
    const plan = [
      "## WorkflowHub Stage Progress",
      "| Stage | Status | Work / artifacts | Review / handoff | Next / deferred risk |",
      "| --- | --- | --- | --- | --- |",
      "| make-decision | completed | D1 | quality_status=incomplete; user_handoff=pending | build-spec |",
      "",
    ].join("\n");
    const result = deriveStageProgress("make-decision", [], { "decision-log.md": "log", "spec.md": null, "plan.md": plan, "tasks.md": null });
    expect(result).toMatchObject({
      status: "completed",
      progress_source: "declared-markdown-stage-progress",
      declared_quality_status: "incomplete",
    });
  });

  it("rejects a document that silently drops a stage row", () => {
    const result = validateWorkflowHubStageProgress({
      plan: "## WorkflowHub Stage Progress\n| Stage | Status | Review / handoff | Next / deferred risk |\n| --- | --- | --- | --- |\n| make-decision | completed | unknown | build-spec |\n",
      tasks: "## WorkflowHub Stage Progress\n| Stage | Status | Execution / evidence | Handoff / next |\n| --- | --- | --- | --- |\n| build-code | completed | unknown | verify-code |\n| verify-code | pending | unknown | stop |\n",
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("plan is missing stage progress row: build-spec");
  });
});
