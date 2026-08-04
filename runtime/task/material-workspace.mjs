import { closeSync, constants, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { dirname, isAbsolute, resolve } from "node:path";

export const CURRENT_MATERIAL_FILES = Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);

const NOFOLLOW = constants.O_NOFOLLOW ?? 0;
const DIRECTORY = constants.O_DIRECTORY ?? 0;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fsyncDirectory(path) {
  const fd = openSync(path, constants.O_RDONLY | DIRECTORY);
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

function materialPath(root, file) {
  if (typeof root !== "string" || !isAbsolute(root)) throw new TypeError("material workspace root must be absolute");
  if (!CURRENT_MATERIAL_FILES.includes(file)) throw new TypeError(`invalid material file: ${file}`);
  const resolvedRoot = resolve(root);
  const target = resolve(resolvedRoot, file);
  if (target !== resolve(resolvedRoot, file) || file.includes("..") || file.includes("/")) throw new TypeError(`invalid material file: ${file}`);
  return { root: resolvedRoot, target };
}

function readMaterial(root, file) {
  const { target } = materialPath(root, file);
  try {
    const stat = lstatSync(target);
    if (stat.isSymbolicLink() || !stat.isFile()) return { missing: true, reason: "not_regular_file" };
    const value = readFileSync(target, "utf8");
    if (value.trim() === "") return { missing: true, reason: "empty" };
    return { value };
  } catch (error) {
    if (error?.code === "ENOENT") return { missing: true, reason: "missing" };
    return { missing: true, reason: "unreadable" };
  }
}

export function inspectMaterialWorkspace(root) {
  if (typeof root !== "string" || !isAbsolute(root)) throw new TypeError("material workspace root must be absolute");
  const files = {};
  const missing = [];
  const errors = [];
  for (const file of CURRENT_MATERIAL_FILES) {
    const result = readMaterial(root, file);
    if (result.missing) {
      missing.push(file);
      if (result.reason !== "missing" && result.reason !== "empty") errors.push(`${file}:${result.reason}`);
    } else files[file] = result.value;
  }
  const digestInput = CURRENT_MATERIAL_FILES.map((file) => [file, files[file] ?? null]);
  return Object.freeze({
    status: missing.length === 0 ? "working" : "not_ready",
    root: resolve(root),
    files: Object.freeze(files),
    missing: Object.freeze(missing),
    errors: Object.freeze(errors),
    material_digest: sha256(JSON.stringify(digestInput)),
  });
}

function atomicWrite(target, data, { testHooks } = {}) {
  const root = dirname(target);
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const temporary = resolve(root, `.${target.split("/").pop()}.${randomUUID()}.tmp`);
  let fd;
  try {
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, 0o600);
    writeSync(fd, data, null, "utf8");
    testHooks?.afterTemporaryWrite?.();
    fsyncSync(fd);
    closeQuietly(fd);
    fd = undefined;
    testHooks?.beforeRename?.();
    renameSync(temporary, target);
    fsyncDirectory(root);
  } finally {
    if (fd !== undefined) closeQuietly(fd);
    if (existsSync(temporary)) rmSync(temporary, { force: true });
  }
}

function closeQuietly(fd) {
  try { fsyncSync(fd); } catch {}
  try { closeSync(fd); } catch {}
}

export function replaceMaterialAtomic(root, file, content, options = {}) {
  const { target } = materialPath(root, file);
  if (typeof content !== "string" || content.length === 0) throw new TypeError("material content must be non-empty text");
  atomicWrite(target, content, options);
  const raw = readFileSync(target, "utf8");
  return Object.freeze({ file, sha256: sha256(raw), bytes: Buffer.byteLength(raw) });
}
