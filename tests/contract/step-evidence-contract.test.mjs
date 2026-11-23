import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runStageStepsCheck } from "../../tools/cli/check-stage-steps.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function put(base, path, value) {
  const file = join(base, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value));
}

function inspect({ evidence, facts = "", files = [], material = "# Controlled\n## 级别与路线\n- 推荐级别：复杂\n", methodAnchor }) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "declared-evidence-")));
  roots.push(root);
  const repo = join(root, "repo"), task = join(root, "task"), materialRoot = join(root, "materials");
  const source = "workflows/make-decision/steps.json";
  const step = {
    step_id: 1, step_slug: "case-step",
    observable_result: "Controlled. 判定消费：workflows/make-decision/SKILL.md#方法；原件：controlled original",
    completion_evidence: evidence,
    ...(methodAnchor ? { method_anchor: methodAnchor } : {}),
  };
  put(repo, "workflows/make-decision/SKILL.md", "# Controlled\n## 方法\nOwned observation.\n");
  put(repo, source, { schema_version: "2.0.0", stage_slug: "make-decision", steps: [step] });
  put(task, "task.json", { schema_version: "1.0.0", project_name: "controlled", task_id: "declared-evidence",
    baseline_commit: "HEAD", target_repo_root: repo, activation_cohort: "post" });
  put(task, "facts.jsonl", facts);
  put(materialRoot, "decision-log.md", material);
  put(materialRoot, "step-consumer-design.md", "| [controlled](../../workflows/make-decision/steps.json#L1) `case-step` | observation | human | owner |\n");
  for (const [path, value] of files) put(task, path, value);
  return runStageStepsCheck({ taskPath: task, materialRoot, repoRoot: repo, stage: "make-decision" });
}

describe("ORACLE-DECLARED-EVIDENCE real kind, identity and navigation", () => {
  it("dispatches a review declaration changed to test through command-receipt comparison", () => {
    const report = inspect({
      evidence: [{ kind: "test", uri_or_path: "quality/reviews/current.json" }, { kind: "phase_task_facts", uri_or_path: "facts.jsonl" }],
      files: [["quality/reviews/current.json", { stage: "make-decision", status: "available", findings: [] }]],
    });
    const row = report.stages[0].steps[0];
    expect(row.evidence[0].present, "review JSON is not an argv/cwd/exit command receipt").toBe(false);
    expect(`${row.evidence[0].reason ?? ""}${row.gap ?? ""}`).toMatch(/命令|捕获|argv|cwd|exit/i);
  });

  it("keeps a non-empty shared directory as navigation rather than completion evidence", () => {
    const report = inspect({
      evidence: [{ kind: "review", uri_or_path: "quality/reviews/" }, { kind: "phase_task_facts", uri_or_path: "facts.jsonl" }],
      files: [["quality/reviews/unrelated.json", { stage: "make-decision", status: "available" }]],
    });
    expect(report.stages[0].steps[0].evidence[0].present).toBe(false);
  });

  it("rejects a missing method_anchor instead of silently falling back to the root method", () => {
    const report = inspect({
      evidence: [{ kind: "decision_log_section", uri_or_path: "decision-log.md#级别与路线" }, { kind: "phase_task_facts", uri_or_path: "facts.jsonl" }],
    });
    expect(report.stages[0].definition).toBe("unavailable");
    expect(report.errors.join("\n")).toMatch(/method_anchor|方法入口/);
  });

  it("rejects multiple otherwise eligible dynamic originals instead of taking the latest", () => {
    const source = "workflows/make-decision/steps.json";
    const facts = JSON.stringify({
      record_kind: "stage", task_id: "declared-evidence", stage: "make-decision", source: "controlled",
      evidence: { value: [
        { ref: "quality/evidence/old.json", source, step_slug: "case-step" },
        { ref: "quality/evidence/new.json", source, step_slug: "case-step" },
      ] },
    }) + "\n";
    const report = inspect({
      evidence: [{ kind: "task_original_ref", uri_or_path: "facts.jsonl#diff-commit" }, { kind: "phase_task_facts", uri_or_path: "facts.jsonl" }],
      facts,
      files: [
        ["quality/evidence/old.json", { task_id: "declared-evidence", result: "old" }],
        ["quality/evidence/new.json", { task_id: "declared-evidence", result: "new" }],
      ],
    });
    const row = report.stages[0].steps[0];
    expect(row.state).not.toBe("completed");
    expect(`${report.errors.join("\n")}${row.gap ?? ""}${JSON.stringify(row.evidence)}`).toMatch(/歧义|多份|多个|唯一/);
  });
});
