import { describe, expect, it } from "vitest";

import {
  confirmTaskCloseOperation,
  executeTaskCloseOperation,
  prepareTaskCloseOperation,
  taskCloseOperationStatus,
} from "../core/task-close.mjs";

describe("AC-005/009/010/011 TaskHandle-backed close operation", () => {
  it("exposes only the governed prepare/confirm/execute/status operation", async () => {
    const module = await import("../core/task-close.mjs");
    expect(Object.keys(module).sort()).toEqual([
      "confirmTaskCloseOperation", "executeTaskCloseOperation",
      "prepareTaskCloseOperation", "taskCloseOperationStatus",
    ]);
    expect(module).not.toHaveProperty("prepareClosePlan");
    expect(module).not.toHaveProperty("executeCloseStep");
    expect(module).not.toHaveProperty("confirmClosePlan");
    expect(module).not.toHaveProperty("executeClosePlan");
  });

  it("rejects forged capabilities before plan, confirmation, close, or records", async () => {
    expect(() => prepareTaskCloseOperation({ task: {}, kernel: {} })).toThrow(/TaskHandle capability/i);
    expect(() => confirmTaskCloseOperation({ task: {}, kernel: {}, confirmation: {} })).toThrow(/TaskHandle capability/i);
    await expect(executeTaskCloseOperation({ task: {}, kernel: {} })).rejects.toThrow(/TaskHandle capability/i);
    expect(() => taskCloseOperationStatus({})).toThrow(/TaskHandle capability/i);
  });
});
