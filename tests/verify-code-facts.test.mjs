import { describe, expect, it } from "vitest";

import { readCommand, assembleVerifyAttempt } from "../workflows/verify-code/facts-assembly.mjs";
import { createTaskProjection } from "../workflows/verify-code/design-alignment.mjs";

describe("verify-code accepted-input and append-only attempt facts", () => {
  it("reads the fresh command only from the accepted build-code attempt facts", () => {
    expect(readCommand({ facts: { tests: { command: "npm test" } } })).toBe("npm test");
    expect(() => readCommand({ facts: { tests: {} } })).toThrow(/command/i);
  });

  it("assembles an identity-bound verify-code attempt, not a mutable stage-result", () => {
    const attempt = assembleVerifyAttempt({
      taskId: "demo-task",
      createdAt: "2026-07-16T00:00:00.000Z",
      facts: { tests: { command: "npm test", exit_code: 0 } },
      evidenceRefs: ["evidence/verify/test.json"],
      missingItems: [],
      reason: "fresh verification recorded",
    });
    expect(attempt).toMatchObject({
      task_id: "demo-task",
      stage: "verify-code",
      facts: { tests: { command: "npm test", exit_code: 0 } },
      missing_items: [],
    });
    expect(attempt).not.toHaveProperty("user_decision");
    expect(attempt).not.toHaveProperty("status", "pass");
  });

  it("rejects absolute, traversal, and specs evidence references", () => {
    const base = { taskId: "demo-task", createdAt: "2026-07-16T00:00:00.000Z", facts: {}, missingItems: [] };
    for (const evidenceRef of ["/tmp/x", "../x", "specs/demo/x"]) {
      expect(() => assembleVerifyAttempt({ ...base, evidenceRefs: [evidenceRef] }))
        .toThrow(/evidence|relative|traversal|specs/i);
    }
  });

  it("requires the task projection to use accepted versioned reference bindings", () => {
    const ref = {
      artifact_kind: "spec",
      ref: "specs/demo/spec.md",
      hash: "a".repeat(64),
      id: "AC-15",
    };
    const result = createTaskProjection({
      task: { id: "T008", versioned_refs: [ref] },
      selectedRefs: [ref],
      acceptedRefs: [ref],
    });

    expect(result).toMatchObject({ status: "ready", selected_refs: [ref] });
  });
});
