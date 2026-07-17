import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

/** Capture tracked, dirty, and untracked files without moving HEAD or refs. */
export function captureGitWorktreeSnapshot(root, { injectCrash } = {}) {
  const head = String(execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  })).trim();
  const index = resolve(tmpdir(), `workflowhub-snapshot-${randomUUID()}.index`);
  const env = { ...process.env, GIT_INDEX_FILE: index };
  const run = (args, extra = {}) => String(execFileSync("git", args, {
    cwd: root, env, encoding: "utf8",
    stdio: [extra.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    ...extra,
  })).trim();
  try {
    run(["read-tree", head]);
    run(["add", "-A", "--", "."]);
    const tree = run(["write-tree"]);
    if (injectCrash === "after-write-tree") throw new Error("injected crash after write-tree");
    return Object.freeze({ head, tree });
  } finally {
    rmSync(index, { force: true });
  }
}
