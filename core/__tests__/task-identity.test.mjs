import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  deriveTaskPath,
  validateProjectName,
  validateTaskId,
} from "../../runtime/task/task-identity.mjs";

describe("task identity", () => {
  it("derives exactly storageRoot/Projects/project/tasks/task", () => {
    const storageRoot = mkdtempSync(join(tmpdir(), "workflowhub-identity-"));
    try {
      expect(
        deriveTaskPath(
          storageRoot,
          "PaperBuilder",
          "paperbuilder-phase-foundation",
        ),
      ).toBe(
        join(
          storageRoot,
          "Projects",
          "PaperBuilder",
          "tasks",
          "paperbuilder-phase-foundation",
        ),
      );
    } finally {
      rmSync(storageRoot, { recursive: true, force: true });
    }
  });

  it.each(["", ".", "..", "a/b", "a\\b", "../escape"])(
    "rejects unsafe project_name %j",
    (value) => {
      expect(() => validateProjectName(value)).toThrow(/project/i);
    },
  );

  it.each(["", ".", "..", "a/b", "a\\b", "../escape"])(
    "rejects unsafe task_id %j",
    (value) => {
      expect(() => validateTaskId(value)).toThrow(/task/i);
    },
  );

  it("rejects a relative storage root", () => {
    expect(() => deriveTaskPath("relative", "PaperBuilder", "task-one")).toThrow(
      /absolute/i,
    );
  });
});
