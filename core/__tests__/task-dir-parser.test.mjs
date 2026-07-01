import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { homedir } from "node:os";
import { parseTaskDir } from "../task-dir-parser.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const DEFAULT_FALLBACK = join(homedir(), "Knowledge", "workflowhub");

// FR-TASKDIR-001: task_dir parser — no third-party deps, reads config/workflowhub.yaml.
// Covers two acceptance scenarios from tasks.md T003:
//   (a) explicit config has task_dir → return configured value
//   (b) config missing / no task_dir field → fall back to ~/Knowledge/workflowhub/

describe("FR-TASKDIR-001 task_dir parser", () => {
  it("(a) returns task_dir value from explicit config (config/workflowhub.yaml)", () => {
    const configPath = resolve(repoRoot, "config", "workflowhub.yaml");
    const result = parseTaskDir(configPath);
    // workflowhub.yaml declares: task_dir: /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/
    expect(result).toBe("/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/");
  });

  it("(b) falls back to ~/Knowledge/workflowhub/ when config file does not exist", () => {
    const result = parseTaskDir("/nonexistent/path/to/workflowhub.yaml");
    expect(result).toBe(DEFAULT_FALLBACK);
  });
});
