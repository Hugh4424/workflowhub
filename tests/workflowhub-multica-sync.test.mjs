import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditExitCode,
  buildActionPlan,
  CURRENT_PROMPT_BLOCK,
  promptIssues,
  verifyMainSnapshot,
} from "../skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs";

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

describe("workflowhub-multica-sync", () => {
  it("requires the current host-protocol markers without flagging the replacement block as legacy", () => {
    expect(promptIssues(CURRENT_PROMPT_BLOCK)).toEqual({ legacy: [], missing_current: [] });
  });

  it("keeps A and B action plans separate", () => {
    const report = {
      skills: [{
        name: "managed",
        path: "skills/managed/SKILL.md",
        status: "needs_update",
        primary_mismatch: true,
        files: { missing: [], mismatched: [], extra: ["stale.md"] },
      }, {
        name: "external",
        status: "external_unmanaged",
        primary_mismatch: true,
        files: { missing: [], mismatched: [], extra: ["keep.md"] },
      }],
      retired_bindings: [{ agent_name: "Coder", skill_name: "old-skill" }],
      retired_online_skills: ["old-skill"],
      agents: [{ name: "Coder", prompt: { legacy: [], missing_current: [] }, binding: { missing: ["build-code"] } }],
    };

    const planA = buildActionPlan(report, false);
    const planB = buildActionPlan(report, true);
    expect(planA.map((item) => item.action)).toEqual(["update_skill", "bind_skill"]);
    expect(planB.map((item) => item.action)).toEqual([
      "update_skill",
      "delete_extra_file",
      "unbind_retired_skill",
      "delete_retired_skill",
      "bind_skill",
    ]);
  });

  it("does not turn warning-only findings into a failed audit", () => {
    const summary = {
      skill_changes: 0,
      agent_changes: 0,
      unconfirmed: 0,
      sync_blockers: [],
      agent_warnings: 3,
    };
    expect(auditExitCode(summary)).toBe(0);
    expect(auditExitCode({ ...summary, skill_changes: 1 })).toBe(2);
    expect(auditExitCode({ ...summary, sync_blockers: ["main_origin_mismatch"] })).toBe(2);
  });

  it("rejects an unreadable current main snapshot instead of trusting rev-parse alone", () => {
    const mainCommit = execFileSync("git", ["rev-parse", "main"], { cwd: repo, encoding: "utf8" }).trim();
    const snapshot = verifyMainSnapshot(repo, mainCommit, 10_000);
    expect(snapshot).toMatchObject({ main_commit: mainCommit });
    expect(snapshot.main_tree).toMatch(/^[0-9a-f]{40}$/);
  });
});
