import { createHash } from "node:crypto";
import {
  existsSync,
  chmodSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep, win32 } from "node:path";

const SAFE_SKILL = /^[a-z0-9][a-z0-9-]*$/;

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
function entry(id, role, path, bytes) {
  return { id, role, path, bytes: bytes.length, lines: lineCount(bytes), sha256: sha256(bytes) };
}
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, bytes, { flag: "wx" });
  try { renameSync(tmp, path); } catch (error) { rmSync(tmp, { force: true }); throw error; }
}

function exactMode(stat, mode) { return (stat.mode & 0o777) === mode; }
function sealPackage(packageRoot, files) {
  for (const file of files) chmodSync(join(packageRoot, file.path), 0o444);
  chmodSync(join(packageRoot, "manifest.json"), 0o444);
  const dirs = [...new Set(files.map((file) => dirname(file.path)).filter((path) => path !== "."))]
    .sort((a, b) => b.length - a.length);
  for (const dir of dirs) chmodSync(join(packageRoot, dir), 0o555);
  chmodSync(packageRoot, 0o555);
}
function unsealForRemoval(packageRoot, files) {
  try { chmodSync(packageRoot, 0o755); } catch {}
  for (const dir of [...new Set(files.map((file) => dirname(file.path)).filter((path) => path !== "."))]) {
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
    try { realTrusted = realpathSync(resolve(trustedRoot)); }
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
  if (parsed?.version !== 2 || !Array.isArray(parsed.entries) || typeof parsed.content_hash !== "string") {
    throw new ArtifactReviewPackageError("artifact-package-invalid", "manifest shape is invalid");
  }
  const ids = new Set();
  const verifiedDirs = new Set();
  for (const item of parsed.entries) {
    if (typeof item?.path === "string" && (isAbsolute(item.path) || item.path.split(/[\\/]/).some((part) => part === "." || part === ".."))) {
      throw new ArtifactReviewPackageError("artifact-package-escape", `${item.id || "entry"} path escapes package root`);
    }
    if (!item || typeof item.id !== "string" || !item.id || typeof item.role !== "string" || !item.role || ids.has(item.id) || !safeRelativePath(item.path) || !Number.isInteger(item.lines) || item.lines < 0) {
      throw new ArtifactReviewPackageError("artifact-package-invalid", "manifest entry identity/path is invalid");
    }
    ids.add(item.id);
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
  }
  if (!ids.has("contract") || !ids.has("materials")) {
    throw new ArtifactReviewPackageError("artifact-package-invalid", "manifest must contain contract and materials entries");
  }
  const contentHash = sha256(Buffer.from(canonical(parsed.entries)));
  if (contentHash !== parsed.content_hash || (expectedContentHash && expectedContentHash !== contentHash)) {
    throw new ArtifactReviewPackageError("artifact-package-tampered", "manifest content hash mismatch");
  }
  return { packageRoot: realRoot, manifestPath: realpathSync(manifest), manifest: parsed };
}

export function createArtifactReviewPackage({ reviewsRoot, stage, reviewFlowId, totalRound, contract, materials, skillDefinitions = [] }) {
  const files = [
    { id: "contract", role: "contract", path: "contract.md", bytes: Buffer.from(contract, "utf8") },
    { id: "materials", role: "materials", path: "materials.md", bytes: Buffer.from(materials, "utf8") },
  ];
  for (const skill of skillDefinitions) {
    if (!SAFE_SKILL.test(skill.name)) throw new ArtifactReviewPackageError("artifact-package-invalid", `unsafe skill name ${skill.name}`);
    files.push({ id: `skill:${skill.name}`, role: "required_skill", path: `skills/${skill.name}.md`, bytes: Buffer.from(skill.content, "utf8") });
  }
  const entries = files.map((file) => entry(file.id, file.role, file.path, file.bytes));
  const contentHash = sha256(Buffer.from(canonical(entries)));
  const packageRoot = join(reviewsRoot, ".claude-review-packages", `${stage}-${reviewFlowId}-round-${totalRound}-${contentHash}`);
  const manifestPath = join(packageRoot, "manifest.json");
  const manifest = { version: 2, content_hash: contentHash, entries };
  if (existsSync(packageRoot)) {
    verifyArtifactReviewPackage({ packageRoot, manifestPath, expectedContentHash: contentHash, requireSealed: false });
    sealPackage(packageRoot, files);
  } else {
    const staging = `${packageRoot}.${process.pid}.${Date.now()}.tmp`;
    mkdirSync(dirname(packageRoot), { recursive: true });
    mkdirSync(staging, { recursive: false });
    try {
      for (const file of files) atomicWrite(join(staging, file.path), file.bytes);
      atomicWrite(join(staging, "manifest.json"), Buffer.from(canonical(manifest)));
      sealPackage(staging, files);
      try {
        renameSync(staging, packageRoot);
      } catch (error) {
        const publishRace = new Set(["EEXIST", "ENOTEMPTY"]).has(error.code) || (new Set(["EACCES", "EPERM"]).has(error.code) && existsSync(packageRoot));
        if (!publishRace) throw error;
        unsealForRemoval(staging, files);
        rmSync(staging, { recursive: true, force: true });
        verifyArtifactReviewPackage({ packageRoot, manifestPath, expectedContentHash: contentHash });
      }
    } catch (error) {
      unsealForRemoval(staging, files);
      rmSync(staging, { recursive: true, force: true });
      throw error;
    }
  }
  return verifyArtifactReviewPackage({ packageRoot, manifestPath, expectedContentHash: contentHash });
}
