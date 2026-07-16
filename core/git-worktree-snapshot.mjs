import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

/** Capture tracked, dirty, and untracked files without moving HEAD or refs. */
export function captureGitWorktreeSnapshot(root) {
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
    const commit = run(["commit-tree", tree, "-p", head, "-m", "workflowhub ephemeral workspace snapshot"], {
      env: {
        ...env,
        GIT_AUTHOR_NAME: "WorkflowHub",
        GIT_AUTHOR_EMAIL: "workflowhub@local",
        GIT_COMMITTER_NAME: "WorkflowHub",
        GIT_COMMITTER_EMAIL: "workflowhub@local",
      },
    });
    return Object.freeze({ head, tree, commit });
  } finally {
    rmSync(index, { force: true });
  }
}
