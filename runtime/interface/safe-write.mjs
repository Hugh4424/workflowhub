import {
  closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync,
  openSync, readFileSync, readdirSync, realpathSync, renameSync,
  unlinkSync, writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { basename, dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

function failure(code, message) {
  return Object.assign(new Error(message), { code });
}

function sameFile(a, b) {
  return a.dev === b.dev && a.ino === b.ino;
}

function inside(root, path) {
  const rel = relative(root, path);
  return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function optionalStat(path) {
  try { return lstatSync(path); }
  catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

// Only fixed macOS system aliases may be normalized; caller-owned symlinks
// anywhere in the storage ancestry are rejected before realpath is used.
function rootPath(root) {
  if (typeof root !== "string" || root.length === 0) {
    throw failure("INVALID_ROOT", "root must be a nonempty directory path");
  }
  const absolute = resolve(root);
  let cursor = parse(absolute).root;
  const ancestry = [];
  for (const part of absolute.slice(cursor.length).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    const stat = lstatSync(cursor);
    if (stat.isSymbolicLink()) {
      const platformAlias = process.platform === "darwin"
        && ((cursor === "/tmp" && realpathSync(cursor) === "/private/tmp")
          || (cursor === "/var" && realpathSync(cursor) === "/private/var"));
      if (!platformAlias) throw failure("SYMLINK_TARGET", `symlink in root ancestry: ${cursor}`);
    } else if (!stat.isDirectory()) {
      throw failure("NOT_A_DIRECTORY", `storage ancestor is not a directory: ${cursor}`);
    }
    ancestry.push({ path: cursor, dev: stat.dev, ino: stat.ino, real: realpathSync(cursor) });
  }
  const canonical = realpathSync(absolute);
  for (const before of ancestry) {
    if (!sameFile(lstatSync(before.path), before) || realpathSync(before.path) !== before.real) {
      throw failure("ANCESTOR_REPLACED", `root ancestor changed during resolution: ${before.path}`);
    }
  }
  return canonical;
}

function directorySnapshot(parent) {
  const paths = [];
  let cursor = parse(parent).root;
  paths.push(cursor);
  for (const part of parent.slice(cursor.length).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    paths.push(cursor);
  }
  return paths.map((path) => {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw failure("SYMLINK_TARGET", `symlinked directory: ${path}`);
    if (!stat.isDirectory()) throw failure("NOT_A_DIRECTORY", `not a directory: ${path}`);
    return { path, dev: stat.dev, ino: stat.ino, real: realpathSync(path) };
  });
}

function verifyDirectories(snapshot) {
  for (const before of snapshot) {
    let stat;
    try { stat = lstatSync(before.path); }
    catch (cause) { throw Object.assign(failure("ANCESTOR_REPLACED", `directory disappeared: ${before.path}`), { cause }); }
    if (!stat.isDirectory() || stat.isSymbolicLink() || !sameFile(stat, before)
      || realpathSync(before.path) !== before.real) {
      throw failure("ANCESTOR_REPLACED", `directory replaced during write: ${before.path}`);
    }
  }
}

function destination(root, relPath) {
  if (typeof relPath !== "string" || !relPath || isAbsolute(relPath)
    || relPath.split(/[\\/]/).includes("..")) {
    throw failure("PATH_ESCAPE", `expected a relative path within root: ${relPath}`);
  }
  const canonicalRoot = rootPath(root);
  const path = resolve(canonicalRoot, relPath);
  if (path === canonicalRoot || !inside(canonicalRoot, path)) {
    throw failure("PATH_ESCAPE", `path escapes root: ${relPath}`);
  }
  // Parents must exist. Creating missing storage silently masks bad callers.
  const parent = dirname(path);
  const snapshot = directorySnapshot(parent);
  if (!inside(canonicalRoot, realpathSync(parent))) {
    throw failure("PATH_ESCAPE", `parent escapes root: ${parent}`);
  }
  return { path, parent, snapshot, root: canonicalRoot };
}

function targetStat(path) {
  const stat = optionalStat(path);
  if (stat?.isSymbolicLink()) throw failure("SYMLINK_TARGET", `symlink destination: ${path}`);
  if (stat && !stat.isFile()) throw failure("NOT_A_FILE", `destination is not a regular file: ${path}`);
  return stat;
}

function verifyOpen(fd, path, root) {
  const stat = fstatSync(fd);
  const named = lstatSync(path);
  if (!stat.isFile() || named.isSymbolicLink() || !sameFile(stat, named)
    || !inside(root, realpathSync(path))) {
    throw failure("ANCESTOR_REPLACED", `opened file changed identity: ${path}`);
  }
  return stat;
}

function readTarget(target) {
  targetStat(target.path);
  const fd = openSync(target.path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    verifyDirectories(target.snapshot);
    verifyOpen(fd, target.path, target.root);
    const bytes = readFileSync(fd);
    verifyOpen(fd, target.path, target.root);
    verifyDirectories(target.snapshot);
    return bytes;
  } finally { closeSync(fd); }
}

function syncDirectory(target) {
  const fd = openSync(target.parent, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = target.snapshot[target.snapshot.length - 1];
    if (!sameFile(fstatSync(fd), before)) throw failure("ANCESTOR_REPLACED", `directory changed: ${target.parent}`);
    fsyncSync(fd);
  } finally { closeSync(fd); }
}

function publish(target, bytes, createOnly, acceptIdentical) {
  if (!Number.isInteger(constants.O_NOFOLLOW)) {
    throw failure("UNSUPPORTED_PLATFORM", "O_NOFOLLOW is required for safe writes");
  }
  const data = typeof bytes === "string" ? Buffer.from(bytes) : Buffer.from(bytes);
  verifyDirectories(target.snapshot);
  const prior = targetStat(target.path);
  if (createOnly && prior) {
    if (acceptIdentical && readTarget(target).equals(data)) return { path: target.path, idempotent: true };
    throw failure(acceptIdentical ? "RECORD_CONFLICT" : "EEXIST", `record already exists: ${target.path}`);
  }
  const temporary = join(target.parent, `.${basename(target.path)}.${randomUUID()}.tmp`);
  let fd;
  let identity;
  try {
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    identity = verifyOpen(fd, temporary, target.root);
    verifyDirectories(target.snapshot);
    writeFileSync(fd, data);
    fsyncSync(fd);
    verifyOpen(fd, temporary, target.root);
    verifyDirectories(target.snapshot);
    closeSync(fd);
    fd = undefined;
    const beforePublish = lstatSync(temporary);
    if (beforePublish.isSymbolicLink() || !sameFile(beforePublish, identity)) {
      throw failure("ANCESTOR_REPLACED", `temporary file replaced before publication: ${temporary}`);
    }
    targetStat(target.path);
    if (createOnly) {
      try { linkSync(temporary, target.path); }
      catch (error) {
        if (error.code !== "EEXIST") throw error;
        targetStat(target.path);
        if (acceptIdentical && readTarget(target).equals(data)) return { path: target.path, idempotent: true };
        throw failure(acceptIdentical ? "RECORD_CONFLICT" : "EEXIST", `record already exists: ${target.path}`);
      }
    } else {
      // Atomic overwrite replaces a pathname, never follows its final symlink.
      renameSync(temporary, target.path);
    }
    const published = targetStat(target.path);
    if (!published || !sameFile(published, identity)) {
      throw failure("ANCESTOR_REPLACED", `published file changed identity: ${target.path}`);
    }
    verifyDirectories(target.snapshot);
    syncDirectory(target);
    verifyDirectories(target.snapshot);
    return { path: target.path, idempotent: false };
  } finally {
    if (fd !== undefined) closeSync(fd);
    // Never remove a different file if somebody replaced the temp pathname.
    if (identity) {
      verifyDirectories(target.snapshot);
      const named = optionalStat(temporary);
      if (named && sameFile(named, identity) && !named.isSymbolicLink()) unlinkSync(temporary);
    }
  }
}

export async function writeFileAtomic(root, relPath, bytes) {
  return publish(destination(root, relPath), bytes, false, false);
}

export async function createFileOnce(root, relPath, bytes) {
  return publish(destination(root, relPath), bytes, true, true);
}

export async function appendRecord(dir, slug, ext, bytes) {
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,48}$/.test(slug)) {
    throw failure("INVALID_SLUG", "slug must match [a-z0-9-]{1,48}");
  }
  if (typeof ext !== "string" || !/^[a-z0-9]{1,16}$/.test(ext)) {
    throw failure("INVALID_EXTENSION", "extension must contain 1 to 16 lowercase letters or digits");
  }
  const root = rootPath(dir);
  const day = new Date().toISOString().slice(0, 10);
  let sequence = 1;
  for (const name of readdirSync(root)) {
    const match = name.match(/^(\d{4}-\d{2}-\d{2})-(\d{3})-[a-z0-9-]+\.[a-z0-9]+$/);
    if (match?.[1] === day) sequence = Math.max(sequence, Number(match[2]) + 1);
  }
  for (; sequence <= 999; sequence += 1) {
    const name = `${day}-${String(sequence).padStart(3, "0")}-${slug}.${ext}`;
    try { return publish(destination(root, name), bytes, true, false).path; }
    catch (error) { if (error.code !== "EEXIST") throw error; }
  }
  throw failure("RECORD_SEQUENCE_EXHAUSTED", `record sequence exhausted for ${day}: ${root}`);
}

async function main(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === "--append" || key === "--create-only") {
      if (options[key]) throw failure("INVALID_ARGUMENT", `duplicate option: ${key}`);
      options[key] = true;
    } else if (["--root", "--path", "--slug", "--ext"].includes(key)) {
      const value = argv[++index];
      if (!value || value.startsWith("--") || options[key] !== undefined) throw failure("INVALID_ARGUMENT", `missing or duplicate option: ${key}`);
      options[key] = value;
    } else throw failure("INVALID_ARGUMENT", `unknown option: ${key}`);
  }
  if (!options["--root"] || (options["--append"] && options["--create-only"])) {
    throw failure("INVALID_ARGUMENT", "--root is required; --append and --create-only are mutually exclusive");
  }
  const bytes = readFileSync(0);
  let result;
  if (options["--append"]) {
    const dir = options["--path"] ? destination(options["--root"], join(options["--path"], ".probe")).parent : options["--root"];
    result = { path: await appendRecord(dir, options["--slug"], options["--ext"], bytes), idempotent: false };
  } else {
    if (!options["--path"] || options["--slug"] || options["--ext"]) throw failure("INVALID_ARGUMENT", "--path is required; --slug and --ext require --append");
    result = await (options["--create-only"] ? createFileOnce : writeFileAtomic)(options["--root"], options["--path"], bytes);
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${JSON.stringify({ code: error.code ?? "SAFE_WRITE_FAILED", message: error.message })}\n`);
    process.exitCode = 1;
  });
}
