import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const AUTO_MANAGED_RUNTIME_BLOCK = /<!-- BEGIN ([A-Z][A-Z0-9_-]*-RUNTIME) \(auto-managed; do not edit\) -->\r?\n[\s\S]*?<!-- END \1 -->\r?\n?/g;

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

function git(root, args) {
  return String(execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })).trim();
}

function treeFile(root, tree, path) {
  const entry = git(root, ["ls-tree", tree, "--", path]);
  if (!entry) return null;
  const [mode, type] = entry.split(/\s+/, 3);
  if (type !== "blob") return null;
  return { mode, text: git(root, ["show", `${tree}:${path}`]) };
}

function withoutRuntimeBlock(text) {
  const names = [];
  const content = text.replace(AUTO_MANAGED_RUNTIME_BLOCK, (_, name) => {
    names.push(name);
    return "";
  });
  return { names, content: `${content.trimEnd()}\n` };
}

/**
 * Compare two workspace trees while ignoring only a complete, explicitly
 * marked host-managed runtime block in the root AGENTS.md file. All other
 * paths, modes, and content remain strict.
 */
export function equivalentWorkspaceTrees(root, expectedTree, actualTree) {
  if (expectedTree === actualTree) return true;
  const changed = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", expectedTree, actualTree])
    .split("\n").filter(Boolean);
  if (changed.length !== 1 || !/^M\s+AGENTS\.md$/.test(changed[0])) return false;
  const before = treeFile(root, expectedTree, "AGENTS.md");
  const after = treeFile(root, actualTree, "AGENTS.md");
  if (!before || !after || before.mode !== after.mode || before.text === after.text) return false;
  const normalizedBefore = withoutRuntimeBlock(before.text);
  const normalizedAfter = withoutRuntimeBlock(after.text);
  return (normalizedBefore.names.length > 0 || normalizedAfter.names.length > 0)
    && JSON.stringify(normalizedBefore.names) === JSON.stringify(normalizedAfter.names)
    && normalizedBefore.content === normalizedAfter.content;
}
