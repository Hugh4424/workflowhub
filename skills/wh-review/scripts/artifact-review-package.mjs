import { createHash } from "node:crypto";
import {
  existsSync,
  chmodSync,
  closeSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
  constants,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep, win32 } from "node:path";

const SAFE_SKILL = /^[a-z0-9][a-z0-9-]*$/;
const SAFE_SOURCE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const MAX_CHUNK_BYTES = 64 * 1024;
const MAX_CHUNK_LINE_CODEPOINTS = 1000;

export class ArtifactReviewPackageError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = "ArtifactReviewPackageError";
    this.code = code;
  }
}

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function inside(root, target) {
  const rel = relative(root, target);
  return rel === "" || (!isAbsolute(rel) && !win32.isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`));
}
function canonical(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function assertNoSymlinkComponents(path, label) {
  const absolute = resolve(path), parts = absolute.split(sep).filter(Boolean);
  let current = absolute.startsWith(sep) ? sep : parts.shift();
  for (const part of parts) {
    current = join(current, part);
    if (!existsSync(current)) break;
    const stat = lstatSync(current);
    if (stat.isSymbolicLink()) throw new ArtifactReviewPackageError("artifact-package-escape", `${label} contains symlink component`);
  }
}
function safeRelativePath(value) {
  if (typeof value !== "string" || !value || value.includes("\\")) return false;
  const normalized = value.split("/");
  return normalized.every((part) => part && part !== "." && part !== "..");
}
export function isContainedRelativePath(relativePath) {
  return relativePath === "" || (!isAbsolute(relativePath) && !win32.isAbsolute(relativePath) && relativePath !== ".." && !relativePath.startsWith(`..${sep}`));
}
function lineCount(bytes) {
  if (bytes.length === 0) return 0;
  let lines = 0;
  for (const byte of bytes) if (byte === 10) lines += 1;
  return lines + (bytes[bytes.length - 1] === 10 ? 0 : 1);
}
function entry(id, role, kind, path, bytes) {
  return { id, role, kind, path, bytes: bytes.length, lines: lineCount(bytes), sha256: sha256(bytes) };
}
function reversibleUtf8Chunks(bytes) {
  let text;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new ArtifactReviewPackageError("artifact-package-invalid", "review artifact is not valid UTF-8"); }
  if (text === "") return [Buffer.alloc(0)];
  const segments = [];
  for (let start = 0; start < text.length;) {
    const newline = text.indexOf("\n", start), end = newline < 0 ? text.length : newline + 1;
    const physical = text.slice(start, end), body = physical.endsWith("\n") ? physical.slice(0, -1) : physical;
    if ([...body].length <= MAX_CHUNK_LINE_CODEPOINTS && Buffer.byteLength(physical) <= MAX_CHUNK_BYTES) segments.push({ text: physical, isolated: false });
    else {
      let part = "", count = 0;
      for (const character of body) {
        if (count === MAX_CHUNK_LINE_CODEPOINTS || Buffer.byteLength(part) + Buffer.byteLength(character) > MAX_CHUNK_BYTES) { segments.push({ text: part, isolated: true }); part = ""; count = 0; }
        part += character; count += 1;
      }
      if (physical.endsWith("\n")) part += "\n";
      segments.push({ text: part, isolated: true });
    }
    start = end;
  }
  const chunks = [];
  let aggregate = "";
  const flush = () => { if (aggregate !== "") { chunks.push(Buffer.from(aggregate, "utf8")); aggregate = ""; } };
  for (const segment of segments) {
    if (segment.isolated) { flush(); chunks.push(Buffer.from(segment.text, "utf8")); }
    else if (Buffer.byteLength(aggregate) + Buffer.byteLength(segment.text) <= MAX_CHUNK_BYTES) aggregate += segment.text;
    else { flush(); aggregate = segment.text; }
  }
  flush();
  return chunks;
}
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, bytes, { flag: "wx" });
  try { renameSync(tmp, path); } catch (error) { rmSync(tmp, { force: true }); throw error; }
}

function exactMode(stat, mode) { return (stat.mode & 0o777) === mode; }
function allDirs(files) {
  const dirs = new Set();
  for (const file of files) for (let dir = dirname(file.path); dir !== "."; dir = dirname(dir)) dirs.add(dir);
  return [...dirs].sort((a, b) => b.length - a.length);
}
function sealPackage(packageRoot, files) {
  for (const file of files) chmodSync(join(packageRoot, file.path), 0o444);
  chmodSync(join(packageRoot, "manifest.json"), 0o444);
  for (const dir of allDirs(files)) chmodSync(join(packageRoot, dir), 0o555);
  chmodSync(packageRoot, 0o555);
}
function unsealForRemoval(packageRoot, files) {
  try { chmodSync(packageRoot, 0o755); } catch {}
  for (const dir of allDirs(files).reverse()) {
    try { chmodSync(join(packageRoot, dir), 0o755); } catch {}
  }
}

export function verifyArtifactReviewPackage({ packageRoot, manifestPath, expectedContentHash, trustedRoot, requireSealed = true } = {}) {
  const root = resolve(String(packageRoot || ""));
  const manifest = resolve(String(manifestPath || ""));
  let realRoot;
  try {
    const rootStat = lstatSync(root);
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error("package root is not a real directory");
    if (requireSealed && !exactMode(rootStat, 0o555)) throw new Error("package root mode must be 0555");
    realRoot = realpathSync(root);
  } catch (error) {
    throw new ArtifactReviewPackageError("artifact-package-invalid", `unreadable package root: ${error.message}`);
  }
  if (trustedRoot) {
    let realTrusted;
    try {
      const trustedStat = lstatSync(resolve(trustedRoot));
      if (!trustedStat.isDirectory() || trustedStat.isSymbolicLink()) throw new Error("trusted root must be a real directory");
      realTrusted = realpathSync(resolve(trustedRoot));
    }
    catch (error) { throw new ArtifactReviewPackageError("artifact-package-invalid", `unreadable trusted root: ${error.message}`); }
    if (!inside(realTrusted, realRoot)) throw new ArtifactReviewPackageError("artifact-package-escape", "package escapes trusted root");
  }
  let parsed;
  try {
    const stat = lstatSync(manifest);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("manifest is not a regular file");
    if (requireSealed && !exactMode(stat, 0o444)) throw new Error("manifest mode must be 0444");
    const realManifest = realpathSync(manifest);
    if (!inside(realRoot, realManifest)) throw new Error("manifest realpath escapes package root");
    parsed = JSON.parse(readFileSync(realManifest, "utf8"));
  } catch (error) {
    throw new ArtifactReviewPackageError("artifact-package-invalid", `invalid manifest: ${error.message}`);
  }
  if (parsed?.version !== 6 || parsed.chunk_max_bytes !== MAX_CHUNK_BYTES || parsed.chunk_max_line_codepoints !== MAX_CHUNK_LINE_CODEPOINTS || !Array.isArray(parsed.entries) || typeof parsed.content_hash !== "string") {
    throw new ArtifactReviewPackageError("artifact-package-invalid", "manifest shape is invalid");
  }
  const ids = new Set();
  const paths = new Set();
  const verifiedDirs = new Set();
  for (const item of parsed.entries) {
    if (typeof item?.path === "string" && (isAbsolute(item.path) || item.path.split(/[\\/]/).some((part) => part === "." || part === ".."))) {
      throw new ArtifactReviewPackageError("artifact-package-escape", `${item.id || "entry"} path escapes package root`);
    }
    if (!item || typeof item.id !== "string" || !item.id || typeof item.role !== "string" || !item.role || typeof item.kind !== "string" || !item.kind || ids.has(item.id) || !safeRelativePath(item.path) || !Number.isInteger(item.lines) || item.lines < 0) {
      throw new ArtifactReviewPackageError("artifact-package-invalid", "manifest entry identity/path is invalid");
    }
    ids.add(item.id);
    if (paths.has(item.path)) throw new ArtifactReviewPackageError("artifact-package-invalid", `${item.id} path is duplicated`);
    paths.add(item.path);
    let parent = dirname(item.path);
    while (parent !== ".") {
      if (!verifiedDirs.has(parent)) {
        try {
          const parentPath = resolve(realRoot, parent), parentStat = lstatSync(parentPath);
          if (!parentStat.isDirectory() || parentStat.isSymbolicLink() || !inside(realRoot, realpathSync(parentPath)) || (requireSealed && !exactMode(parentStat, 0o555))) throw new Error("not a sealed directory");
        } catch (error) { throw new ArtifactReviewPackageError("artifact-package-invalid", `${item.id} parent directory is not sealed: ${error.message}`); }
        verifiedDirs.add(parent);
      }
      parent = dirname(parent);
    }
    const target = resolve(realRoot, item.path);
    if (!inside(realRoot, target)) throw new ArtifactReviewPackageError("artifact-package-escape", `${item.id} escapes package root`);
    let bytes;
    try {
      const stat = lstatSync(target);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("not a regular file");
      if (requireSealed && !exactMode(stat, 0o444)) throw new Error("file mode must be 0444");
      const realTarget = realpathSync(target);
      if (!inside(realRoot, realTarget)) throw new Error("realpath escapes package root");
      bytes = readFileSync(realTarget);
    } catch (error) {
      throw new ArtifactReviewPackageError("artifact-package-invalid", `${item.id} unreadable: ${error.message}`);
    }
    if (!Number.isInteger(item.bytes) || item.bytes !== bytes.length || item.lines !== lineCount(bytes) || !/^[a-f0-9]{64}$/.test(item.sha256) || item.sha256 !== sha256(bytes)) {
      throw new ArtifactReviewPackageError("artifact-package-tampered", `${item.id} bytes/hash mismatch`);
    }
    if (!Array.isArray(item.chunks) || item.chunks.length === 0) throw new ArtifactReviewPackageError("artifact-package-invalid", `${item.id} has no chunks`);
    const chunkBytes = [];
    for (const [chunkIndex, chunk] of item.chunks.entries()) {
      if (!chunk || chunk.sequence !== chunkIndex + 1 || !safeRelativePath(chunk.path) || isAbsolute(chunk.path) || chunk.path.split(/[\\/]/).some((part) => part === "." || part === "..") || paths.has(chunk.path)) throw new ArtifactReviewPackageError("artifact-package-invalid", `${item.id} chunk descriptor is invalid`);
      paths.add(chunk.path);
      let parent = dirname(chunk.path);
      while (parent !== ".") {
        if (!verifiedDirs.has(parent)) {
          try {
            const parentPath = resolve(realRoot, parent), parentStat = lstatSync(parentPath);
            if (!parentStat.isDirectory() || parentStat.isSymbolicLink() || !inside(realRoot, realpathSync(parentPath)) || (requireSealed && !exactMode(parentStat, 0o555))) throw new Error("not a sealed directory");
          } catch (error) { throw new ArtifactReviewPackageError("artifact-package-invalid", `${item.id} chunk parent is not sealed: ${error.message}`); }
          verifiedDirs.add(parent);
        }
        parent = dirname(parent);
      }
      const chunkPath = resolve(realRoot, chunk.path);
      let observed;
      try {
        const stat = lstatSync(chunkPath);
        if (!stat.isFile() || stat.isSymbolicLink() || !inside(realRoot, realpathSync(chunkPath)) || (requireSealed && !exactMode(stat, 0o444))) throw new Error("not a sealed regular chunk");
        observed = readFileSync(chunkPath);
      } catch (error) { throw new ArtifactReviewPackageError("artifact-package-invalid", `${item.id} chunk unreadable: ${error.message}`); }
      if (!Number.isInteger(chunk.bytes) || chunk.bytes !== observed.length || chunk.bytes > MAX_CHUNK_BYTES || !Number.isInteger(chunk.lines) || chunk.lines !== lineCount(observed) || !/^[a-f0-9]{64}$/.test(chunk.sha256) || chunk.sha256 !== sha256(observed)) throw new ArtifactReviewPackageError("artifact-package-tampered", `${item.id} chunk bytes/hash mismatch`);
      let chunkText;
      try { chunkText = new TextDecoder("utf-8", { fatal: true }).decode(observed); }
      catch { throw new ArtifactReviewPackageError("artifact-package-invalid", `${item.id} chunk is not valid UTF-8`); }
      if (chunkText.split("\n").some((line) => [...line].length > MAX_CHUNK_LINE_CODEPOINTS)) throw new ArtifactReviewPackageError("artifact-package-invalid", `${item.id} chunk contains an overlong physical line`);
      chunkBytes.push(observed);
    }
    const reconstructed = Buffer.concat(chunkBytes);
    if (reconstructed.length !== bytes.length || sha256(reconstructed) !== item.sha256 || !reconstructed.equals(bytes)) throw new ArtifactReviewPackageError("artifact-package-tampered", `${item.id} chunks do not reconstruct original bytes`);
  }
  if (!ids.has("contract") || !parsed.entries.some((item) => item.role === "materials")) {
    throw new ArtifactReviewPackageError("artifact-package-invalid", "manifest must contain contract and material entries");
  }
  const contentHash = sha256(Buffer.from(canonical(parsed.entries)));
  if (contentHash !== parsed.content_hash || (expectedContentHash && expectedContentHash !== contentHash)) {
    throw new ArtifactReviewPackageError("artifact-package-tampered", "manifest content hash mismatch");
  }
  return { packageRoot: realRoot, manifestPath: realpathSync(manifest), manifest: parsed };
}

function stableSource(path) {
  let descriptor;
  try {
    if (!Number.isInteger(constants.O_NOFOLLOW) || !Number.isInteger(constants.O_NONBLOCK)) throw new Error("platform lacks O_NOFOLLOW/O_NONBLOCK");
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      const before = fstatSync(fd), sourceStat = lstatSync(path);
      if (!before.isFile() || !sourceStat.isFile() || sourceStat.isSymbolicLink() || sourceStat.dev !== before.dev || sourceStat.ino !== before.ino) throw new Error("source is not the opened regular file");
      const bytes = readFileSync(fd), after = fstatSync(fd);
      if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs || bytes.length !== after.size) throw new Error("source changed while snapshotting");
      descriptor = { bytes, realpath: realpathSync(path), identity: `${before.dev}:${before.ino}:${sha256(bytes)}` };
    } finally { closeSync(fd); }
  } catch (error) { throw new ArtifactReviewPackageError("artifact-package-invalid", `material source unreadable: ${error.message}`); }
  return descriptor;
}

export function createArtifactReviewPackage({ reviewsRoot, stage, reviewFlowId, totalRound, contract, materials, materialSources = [], supplementaryContext, skillDefinitions = [] }) {
  let realReviewsRoot;
  try { realReviewsRoot = realpathSync(resolve(reviewsRoot)); }
  catch (error) { throw new ArtifactReviewPackageError("artifact-package-invalid", `reviews root unreadable: ${error.message}`); }
  const files = [{ id: "contract", role: "contract", kind: "contract", path: "contract.md", bytes: Buffer.from(contract, "utf8") }];
  if (materialSources.length) {
    const seenIds = new Set(), seenCanonical = new Set();
    for (const [index, source] of [...materialSources].sort((a, b) => String(a.id).localeCompare(String(b.id))).entries()) {
      if (!source || !SAFE_SOURCE_ID.test(source.id) || source.id === "contract" || source.id === "materials" || source.id === "context:supplementary" || source.id.startsWith("skill:") || seenIds.has(source.id) || typeof source.path !== "string") throw new ArtifactReviewPackageError("artifact-package-invalid", "material source descriptors require unique non-reserved safe id/path");
      seenIds.add(source.id);
      const captured = stableSource(source.path);
      if (seenCanonical.has(captured.identity)) continue;
      seenCanonical.add(captured.identity);
      const suffix = `${source.id.replace(/[^A-Za-z0-9._-]/g, "_")}.txt`;
      files.push({ id: source.id, role: "materials", kind: "material_source", path: `materials/${String(index + 1).padStart(3, "0")}-${suffix}`, bytes: captured.bytes });
    }
    if (supplementaryContext !== undefined && supplementaryContext !== "") {
      if (typeof supplementaryContext !== "string") throw new ArtifactReviewPackageError("artifact-package-invalid", "supplementaryContext must be a string");
      files.push({ id: "context:supplementary", role: "materials", kind: "supplementary_context", path: "materials/supplementary-context.md", bytes: Buffer.from(supplementaryContext, "utf8") });
    }
  } else {
    files.push({ id: "materials", role: "materials", kind: "material_snapshot", path: "materials.md", bytes: Buffer.from(materials, "utf8") });
  }
  for (const skill of skillDefinitions) {
    if (!SAFE_SKILL.test(skill.name)) throw new ArtifactReviewPackageError("artifact-package-invalid", `unsafe skill name ${skill.name}`);
    files.push({ id: `skill:${skill.name}`, role: "required_skill", kind: "required_skill", path: `skills/${skill.name}.md`, bytes: Buffer.from(skill.content, "utf8") });
  }
  const chunkFiles = [];
  const entries = files.map((file, entryIndex) => {
    const logical = entry(file.id, file.role, file.kind, file.path, file.bytes);
    logical.chunks = reversibleUtf8Chunks(file.bytes).map((bytes, chunkIndex) => {
      const path = `chunks/${String(entryIndex + 1).padStart(3, "0")}/${String(chunkIndex + 1).padStart(5, "0")}.txt`;
      chunkFiles.push({ path, bytes });
      return { sequence: chunkIndex + 1, path, bytes: bytes.length, lines: lineCount(bytes), sha256: sha256(bytes) };
    });
    return logical;
  });
  const packageFiles = [...files, ...chunkFiles];
  const contentHash = sha256(Buffer.from(canonical(entries)));
  const packageContainer = join(realReviewsRoot, ".claude-review-packages");
  if (!existsSync(packageContainer)) mkdirSync(packageContainer, { recursive: false });
  assertNoSymlinkComponents(packageContainer, "package container");
  const realContainer = realpathSync(packageContainer);
  if (!inside(realReviewsRoot, realContainer)) throw new ArtifactReviewPackageError("artifact-package-escape", "package container escapes reviews root");
  const packageRoot = join(realContainer, `${stage}-${reviewFlowId}-round-${totalRound}-${contentHash}`);
  const manifestPath = join(packageRoot, "manifest.json");
  const manifest = { version: 6, chunk_max_bytes: MAX_CHUNK_BYTES, chunk_max_line_codepoints: MAX_CHUNK_LINE_CODEPOINTS, content_hash: contentHash, entries };
  if (existsSync(packageRoot)) {
    verifyArtifactReviewPackage({ packageRoot, manifestPath, expectedContentHash: contentHash, requireSealed: false });
    sealPackage(packageRoot, packageFiles);
  } else {
    const staging = `${packageRoot}.${process.pid}.${Date.now()}.tmp`;
    mkdirSync(dirname(packageRoot), { recursive: true });
    mkdirSync(staging, { recursive: false });
    try {
      for (const file of packageFiles) atomicWrite(join(staging, file.path), file.bytes);
      atomicWrite(join(staging, "manifest.json"), Buffer.from(canonical(manifest)));
      sealPackage(staging, packageFiles);
      try {
        renameSync(staging, packageRoot);
      } catch (error) {
        const publishRace = new Set(["EEXIST", "ENOTEMPTY"]).has(error.code) || (new Set(["EACCES", "EPERM"]).has(error.code) && existsSync(packageRoot));
        if (!publishRace) throw error;
        unsealForRemoval(staging, packageFiles);
        rmSync(staging, { recursive: true, force: true });
        verifyArtifactReviewPackage({ packageRoot, manifestPath, expectedContentHash: contentHash });
      }
    } catch (error) {
      unsealForRemoval(staging, packageFiles);
      rmSync(staging, { recursive: true, force: true });
      throw error;
    }
  }
  return verifyArtifactReviewPackage({ packageRoot, manifestPath, expectedContentHash: contentHash });
}
