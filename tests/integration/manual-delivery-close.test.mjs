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
  it("records delivered business status without formal acceptance", () => {
    const state = fixture();
    const result = recordManualDeliveryClose({ task: state.task, kernel: state.kernel, sourceRef: "quality/evidence/delivery.json" });
    expect(result).toMatchObject({ business_status: "delivered", formal_status: "blocked" });
    expect(result.output_ref).toMatch(/^quality\/evidence\/manual-delivery-close\/[a-f0-9]{64}\.json$/);
    expect(JSON.parse(state.task.readRecord(result.output_ref))).toMatchObject({
      schema_version: "manual-delivery-close.v1", business_status: "delivered", formal_status: "blocked",
    });
    expect(() => state.task.readRecord("results/verify-code/accepted.json")).toThrow(/ENOENT/);
  });

  it("is idempotent for the same source bytes", () => {
    const state = fixture();
    const first = recordManualDeliveryClose({ task: state.task, kernel: state.kernel, sourceRef: "quality/evidence/delivery.json" });
    const second = recordManualDeliveryClose({ task: state.task, kernel: state.kernel, sourceRef: "quality/evidence/delivery.json" });
    expect(second.output_ref).toBe(first.output_ref);
  });
});
