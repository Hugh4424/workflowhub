/**
 * task-index.test.mjs
 *
 * Tests for core/task-index.mjs — append and lookup.
 * Uses os.tmpdir() via mkdtempSync for test fixtures.
 * Never touches the real ~/.workflowhub/ path.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
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
  });
});

describe("lookupProjectKey — corruption handling", () => {
  it("throws when index file contains invalid JSON", () => {
    writeFileSync(indexPath, "this is not json{{{");
    expect(() => lookupProjectKey("task-cc")).toThrow(/corrupt/i);
  });
});
