import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { recordManualDeliveryClose } from "../../core/task-close.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-manual-close-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(join(repo, "specs", "manual-close"), { recursive: true });
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    writeFileSync(join(repo, "specs", "manual-close", name), `# ${name}\n`);
  }
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "WorkflowHub Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@workflowhub.local"], { cwd: repo });
  execFileSync("git", ["add", "."], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "WorkflowHub", task_id: "manual-close",
    created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {},
    record_model: "vnext-single-write",
  } });
  const kernel = createTaskKernel(task);
  kernel.publishCanonicalRecord("quality/evidence/delivery.json", "delivery evidence\n");
  return { task, kernel };
}

describe("manual delivery close", () => {
  it("records a risk-accepted formal close without claiming physical delivery actions", () => {
    const state = fixture();
    const result = recordManualDeliveryClose({
      task: state.task,
      kernel: state.kernel,
      sourceRef: "quality/evidence/delivery.json",
      riskAccepted: true,
      riskReason: "真实 Codex E2E 延期到用户后续真实任务验证",
      deferredItems: ["真实 Codex host binding", "独立 review 终态"],
    });
    expect(result).toMatchObject({ business_status: "delivered", formal_status: "closed_with_risk", status: "completed_with_risk", risk_accepted: true, physical_actions_completed: false });
    expect(result.output_ref).toMatch(/^quality\/evidence\/manual-risk-close\/[a-f0-9]{64}\.json$/);
    expect(JSON.parse(state.task.readRecord(result.output_ref))).toMatchObject({
      schema_version: "manual-risk-close.v1", business_status: "delivered", formal_status: "closed_with_risk", status: "completed_with_risk",
    });
    expect(() => state.task.readRecord("results/verify-code/accepted.json")).toThrow(/ENOENT/);
    expect(() => state.task.readRecord("operations/close/completed.json")).toThrow(/ENOENT/);
  });

  it("is idempotent for the same source bytes", () => {
    const state = fixture();
    const input = { task: state.task, kernel: state.kernel, sourceRef: "quality/evidence/delivery.json", riskAccepted: true, riskReason: "用户明确批准带风险正式 close", deferredItems: ["真实 E2E"] };
    const first = recordManualDeliveryClose(input);
    const second = recordManualDeliveryClose(input);
    expect(second.output_ref).toBe(first.output_ref);
  });

  it("requires explicit risk acceptance", () => {
    const state = fixture();
    expect(() => recordManualDeliveryClose({ task: state.task, kernel: state.kernel, sourceRef: "quality/evidence/delivery.json", riskReason: "缺失真实 E2E" })).toThrow(/risk acceptance/i);
  });
});
