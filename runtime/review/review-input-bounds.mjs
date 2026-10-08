import { createHash } from "node:crypto";

function gitQuotedPath(token) {
  if (typeof token !== "string") throw new TypeError("Git path must be text");
  let path = token;
  if (token.startsWith('"')) {
    if (!token.endsWith('"') || token.length < 2) throw new TypeError("Git path quote is incomplete");
    const bytes = [];
    const text = token.slice(1, -1);
    const escapes = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", '\\': '\\', '"': '"' };
    for (let index = 0; index < text.length;) {
      if (text[index] !== "\\") {
        const point = String.fromCodePoint(text.codePointAt(index));
        bytes.push(...Buffer.from(point));
        index += point.length;
        continue;
      }
      const octal = text.slice(index + 1).match(/^[0-7]{1,3}/)?.[0];
      if (octal) {
        bytes.push(parseInt(octal, 8));
        index += octal.length + 1;
      } else {
        const escape = text[index + 1];
        if (!Object.hasOwn(escapes, escape)) throw new TypeError("review diff contains an invalid Git path escape");
        bytes.push(...Buffer.from(escapes[escape]));
        index += 2;
      }
    }
    path = Buffer.from(bytes).toString("utf8");
  }
  return path;
}

export function gitDiffPath(token) {
  const path = gitQuotedPath(token);
  if (!path.startsWith("a/") && !path.startsWith("b/")) {
    throw new TypeError("review diff contains an invalid Git path header prefix");
  }
  return path.slice(2);
}

/** Keep full diffs by default; a Phase write set selects only changed sections. */
export function compactReviewDiff(diff, { writeSet } = {}) {
  if (typeof diff !== "string") throw new TypeError("review diff must be text");
  if (writeSet !== undefined && (!Array.isArray(writeSet) || writeSet.some((path) => typeof path !== "string" || !path.trim()))) {
    throw new TypeError("review writeSet must be an array of paths");
  }
  const sections = diff.match(/^diff --git [\s\S]*?(?=^diff --git |$(?![\s\S]))/gm) ?? [];
  const selected = writeSet === undefined ? diff : sections.filter((section) => {
    const header = section.split("\n", 1)[0];
    const tokens = header.slice("diff --git ".length).match(/"(?:\\.|[^"\\])*"|\S+/g);
    if (tokens?.length !== 2) throw new TypeError("review diff contains an invalid Git section header");
    const paths = tokens.map(gitDiffPath);
    return writeSet.some((owned) => paths.some((path) => owned.endsWith("/") ? path.startsWith(owned) : path === owned));
  }).join("");
  return {
    diff: selected,
    index: {
      mode: writeSet === undefined ? "full" : "write_set",
      full_diff_bytes: Buffer.byteLength(diff, "utf8"),
      full_diff_sha256: createHash("sha256").update(diff).digest("hex"),
    },
  };
}

/** Decode the committed task changed set without requiring diff-header prefixes. */
export function verifyCodeChangedPaths(nameOnlyText) {
  if (typeof nameOnlyText !== "string") throw new TypeError("name-only Git diff must be text");
  const paths = nameOnlyText.split("\n").filter(line => line !== "").map(gitQuotedPath);
  if (paths.some(path => !path || path.startsWith("/") || /^[A-Za-z]:[\\/]/.test(path) || path.split("/").some(part => part === ".." || part === "." || part === ""))) {
    throw new TypeError("name-only Git diff must contain repository-relative paths");
  }
  return [...new Set(paths)];
}

export function compactVerifyCodeMaterials(materials, { changedPaths } = {}) {
  if (changedPaths === undefined) return { materials, diff: null };
  if (!Array.isArray(changedPaths) || changedPaths.some(path => typeof path !== "string" || !path.trim())) {
    throw new TypeError("changedPaths must be an array of nonempty paths");
  }
  const selected = new Set(changedPaths), kept = {}, dropped = [];
  for (const [key, value] of Object.entries(materials ?? {})) {
    if (key.includes("/") && !selected.has(key)) dropped.push({ dropped_key: key, reason: "outside_task_changed_paths" });
    else Object.defineProperty(kept, key, { value, enumerable: true, writable: true, configurable: true });
  }
  return { materials: kept, diff: null, changed_paths: [...changedPaths], dropped_materials: dropped };
}
