import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { inspectIntegrationReviewSubject } from "../../skills/wh-review/scripts/integration-review-subject.mjs";

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

describe("post integration review material census", () => {
  it("reads spec and indexed physical Phases without plan/tasks", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-post-review-")));
    try {
      const repo = join(root, "repo");
      mkdirSync(repo);
      git(repo, "init", "-q");
      git(repo, "config", "user.name", "fixture");
      git(repo, "config", "user.email", "fixture@example.test");
      writeFileSync(join(repo, "base.mjs"), "export const value = 1;\n");
      git(repo, "add", ".");
      git(repo, "commit", "-qm", "base");
      const task = createTask({ storageRoot: root, manifest: {
        schema_version: "1.0.0", project_name: "workflowhub", task_id: "post-review",
        created_at: "2026-09-22T00:00:00.000Z", target_repo_root: repo,
        issue_ids: [], inputs: {}, record_model: "vnext-single-write", activation_cohort: "post",
      } });
      const artifacts = ArtifactDir.open(repo, task);
      artifacts.writeAtomic("decision-log.md", "# Decision\n");
      artifacts.writeAtomic("spec.md", "# Spec\n\n- [ ] **AC-01 — Result**：结果可读。\n");
      artifacts.writeAtomic("phases/index.md", "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n");
      artifacts.writeAtomic("phases/P1.md", "# Phase P1\n\n- **FR / AC**：FR-01 / AC-01\n");
      git(repo, "add", ".");
      git(repo, "commit", "-qm", "post materials");
      const finalTree = git(repo, "rev-parse", "HEAD^{tree}");
      const subject = inspectIntegrationReviewSubject({ task, sourceRoot: repo, artifacts, finalTree });
      expect(subject.ac_trace.acceptance_ids).toEqual(["AC-01"]);
      expect(subject.formal_record_status.reason).not.toMatch(/plan\.md|tasks\.md/);
      artifacts.writeAtomic("phases/P2.md", "unindexed\n");
      const extra = inspectIntegrationReviewSubject({ task, sourceRoot: repo, artifacts, finalTree });
      expect(extra.formal_record_status).toMatchObject({ status: "unavailable", reason: expect.stringContaining("unindexed_phase") });
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
