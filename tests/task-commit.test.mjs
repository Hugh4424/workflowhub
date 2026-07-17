import { describe, expect, it } from "vitest";

import {
  confirmTaskCommitOperation,
  executeTaskCommitOperation,
  prepareTaskCommitOperation,
  taskCommitOperationStatus,
} from "../core/task-commit.mjs";

describe("AC-005/008/011 TaskHandle-backed commit operation", () => {
  it("exposes only the governed prepare/confirm/execute/status operation", async () => {
    const module = await import("../core/task-commit.mjs");
    expect(Object.keys(module)).toEqual(expect.arrayContaining([
      "prepareTaskCommitOperation", "confirmTaskCommitOperation",
      "executeTaskCommitOperation", "taskCommitOperationStatus",
    ]));
    expect(module).not.toHaveProperty("prepareTaskCommit");
    expect(module).not.toHaveProperty("confirmTaskCommit");
    expect(module).not.toHaveProperty("executeTaskCommit");
    expect(module).not.toHaveProperty("taskCommitStatus");
  });

  it("rejects forged capabilities before plan, confirmation, Git, or records", async () => {
    expect(() => prepareTaskCommitOperation({ task: {}, kernel: {}, workspace: {} })).toThrow(/TaskHandle capability/i);
    expect(() => confirmTaskCommitOperation({ task: {}, kernel: {}, confirmation: {} })).toThrow(/TaskHandle capability/i);
    await expect(executeTaskCommitOperation({ task: {}, kernel: {}, workspace: {} })).rejects.toThrow(/TaskHandle capability/i);
    expect(() => taskCommitOperationStatus({})).toThrow(/TaskHandle capability/i);
  });
});
