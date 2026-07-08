/**
 * task-index.test.mjs
 *
 * Tests for core/task-index.mjs — append and lookup.
 * Uses os.tmpdir() via mkdtempSync for test fixtures.
 * Never touches the real ~/.workflowhub/ path.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendTaskIndex, lookupProjectKey, __setIndexPathForTest } from "../task-index.mjs";

let testDir;
let indexPath;

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), "task-index-test-"));
  indexPath = join(testDir, "task-index.json");
  __setIndexPathForTest(indexPath);
});

describe("appendTaskIndex + lookupProjectKey", () => {
  it("append then lookup returns correct data", () => {
    appendTaskIndex("task-aa", "myproject", "https://github.com/user/myproject");
    const result = lookupProjectKey("task-aa");
    expect(result).toEqual({ projectKey: "myproject", repo: "https://github.com/user/myproject" });
  });

  it("lookup non-existent taskId returns null", () => {
    const result = lookupProjectKey("no-such-id");
    expect(result).toBeNull();
  });

  it("lookup returns null when index file does not exist at all", () => {
    rmSync(indexPath, { force: true });
    const result = lookupProjectKey("task-bb");
    expect(result).toBeNull();
  });
});

describe("appendTaskIndex — duplicate detection", () => {
  it("throws when appending the same taskId twice", () => {
    appendTaskIndex("task-dup", "proj", "https://github.com/org/repo");
    expect(() =>
      appendTaskIndex("task-dup", "proj2", "https://github.com/org/repo2"),
    ).toThrow(/already exists/i);
    expect(lookupProjectKey("task-dup")).toEqual({
      projectKey: "proj",
      repo: "https://github.com/org/repo",
    });
  });
});

describe("appendTaskIndex — atomic concurrent writes", () => {
  it("preserves all records from concurrent appenders", async () => {
    const moduleUrl = new URL("../task-index.mjs", import.meta.url).href;
    const children = Array.from({ length: 5 }, (_, i) => {
      const code = [
        `import { appendTaskIndex, __setIndexPathForTest } from ${JSON.stringify(moduleUrl)};`,
        `__setIndexPathForTest(${JSON.stringify(indexPath)});`,
        `appendTaskIndex("task-${i}", "project-${i}", "https://example.com/repo-${i}");`,
      ].join("\n");
      return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ["--input-type=module", "-e", code], {
          stdio: ["ignore", "pipe", "pipe"],
        });
        let stderr = "";
        child.stderr.on("data", (chunk) => {
          stderr += chunk.toString();
        });
        child.on("error", reject);
        child.on("exit", (code) => {
          if (code === 0) resolve();
          else reject(new Error(stderr || `child exited ${code}`));
        });
      });
    });

    await Promise.all(children);

    for (let i = 0; i < 5; i += 1) {
      expect(lookupProjectKey(`task-${i}`)).toEqual({
        projectKey: `project-${i}`,
        repo: `https://example.com/repo-${i}`,
      });
    }
  });
});

describe("lookupProjectKey — corruption handling", () => {
  it("throws when index file contains invalid JSON", () => {
    writeFileSync(indexPath, "this is not json{{{");
    expect(() => lookupProjectKey("task-cc")).toThrow(/corrupt/i);
  });
});
