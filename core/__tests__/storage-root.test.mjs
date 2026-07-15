import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

import { resolveStorageRoot } from "../storage-root.mjs";

const previousTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
const temporaryDirs = [];

function temporaryDirectory(prefix) {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirs.push(directory);
  return directory;
}

afterEach(() => {
  if (previousTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR;
  else process.env.WORKFLOWHUB_TASK_DIR = previousTaskDir;
  while (temporaryDirs.length > 0) {
    rmSync(temporaryDirs.pop(), { recursive: true, force: true });
  }
});

describe("resolveStorageRoot", () => {
  it("uses an absolute WORKFLOWHUB_TASK_DIR as the global storage root", () => {
    const storageRoot = temporaryDirectory("workflowhub-storage-root-");
    process.env.WORKFLOWHUB_TASK_DIR = storageRoot;

    expect(resolveStorageRoot()).toBe(storageRoot);
  });

  it.each([undefined, "", "   "])(
    "uses os.homedir() when WORKFLOWHUB_TASK_DIR is unset or blank (%s)",
    (value) => {
      if (value === undefined) delete process.env.WORKFLOWHUB_TASK_DIR;
      else process.env.WORKFLOWHUB_TASK_DIR = value;

      expect(resolveStorageRoot()).toBe(homedir());
    },
  );

  it("rejects a relative storage root", () => {
    process.env.WORKFLOWHUB_TASK_DIR = "relative/storage";

    expect(() => resolveStorageRoot()).toThrow(/absolute/i);
  });

  it("rejects the legacy project tasks-root meaning before creating anything", () => {
    const storageRoot = temporaryDirectory("workflowhub-legacy-root-");
    const legacyRoot = join(storageRoot, "Projects", "PaperBuilder", "tasks");
    mkdirSync(legacyRoot, { recursive: true });
    process.env.WORKFLOWHUB_TASK_DIR = legacyRoot;

    expect(() => resolveStorageRoot()).toThrow(
      /legacy WORKFLOWHUB_TASK_DIR semantics/i,
    );
  });
});
