import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const legacyModules = [
  "tools/host/workflowhub-codex-session-state.mjs",
  "tools/host/workflowhub-codex-session-hook.mjs",
  "tools/host/workflowhub-codex-session-event.mjs",
];
const workflowSkills = [
  "workflows/make-decision/SKILL.md",
  "workflows/build-spec/SKILL.md",
  "workflows/build-plan/SKILL.md",
  "workflows/build-code/SKILL.md",
  "workflows/verify-code/SKILL.md",
];
const liveConsumers = [
  "tools/cli/stage-runtime.mjs",
  "tools/cli/task-bootstrap.mjs",
  "tools/host/workflowhub-stage-agent-bridge.mjs",
  ...workflowSkills,
];

const read = (relative) => readFileSync(join(root, relative), "utf8");

describe("retired host session binding", () => {
  it("removes the three legacy host modules", () => {
    for (const relative of legacyModules) expect(existsSync(join(root, relative)), relative).toBe(false);
  });

  it("keeps stage reflection and discloses omitted steps or skills in every workflow skill", () => {
    for (const relative of workflowSkills) {
      const source = read(relative);
      expect(source, relative).toContain("stage-reflection");
      expect(source, relative).toMatch(/阶段末遗漏披露/);
      expect(source, relative).not.toContain("同一会话自动记录");
      expect(source, relative).not.toContain("workflowhub-codex-session-event.mjs");
    }
  });

  it("makes live consumers independent of the deleted session-binding modules", () => {
    for (const relative of liveConsumers) {
      const source = read(relative);
      expect(source, relative).not.toMatch(/workflowhub-codex-session-(?:state|hook|event)\.mjs/);
    }
    const bridge = read("tools/host/workflowhub-stage-agent-bridge.mjs");
    expect(bridge).not.toContain("session.session_id");
    expect(bridge).toContain("agent_run_id");
  });

  it("keeps the retired binding contract source-visible in the repository", () => {
    const tracked = new Set(execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean));
    const required = [
      ...workflowSkills,
      "tools/host/workflowhub-stage-agent-bridge.mjs",
      "tools/cli/stage-runtime.mjs",
      "tests/integration/vnext-official-stage-run.test.mjs",
      "tests/contract/session-binding-removed.test.mjs",
      "docs/adr/0024-remove-host-session-binding.md",
    ];
    for (const relative of required) expect(tracked, relative).toContain(relative);
  });
});
