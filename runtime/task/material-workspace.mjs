import { closeSync, constants, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { dirname, isAbsolute, resolve } from "node:path";
import { canonicalJson } from "../evidence/canonical-source.mjs";

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

const STAGE_INPUT_PACKET_VERSION = "stage-input-packet.v1";
const SNAPSHOT = /^[a-f0-9]{40}$/i;
const HASH = /^[a-f0-9]{64}$/;

function normalizePacketText(value) {
  if (typeof value !== "string") throw new TypeError("stage input packet file content must be text");
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function validPacketPath(path) {
  return typeof path === "string" && path.length > 0 && !path.startsWith("/") && !path.endsWith("/")
    && !path.includes("\\") && !path.includes("\0") && !path.split("/").some((part) => part === "" || part === "." || part === "..");
}

export function validateMaterialNavigation(content) {
  if (typeof content !== "string") return Object.freeze({ ok: false, status: "incomplete", errors: ["material_navigation_content_missing"] });
  const lines = content.split("\n");
  const headerIndex = lines.findIndex((line, index) => index < 80 && /^##\s+材料导航(?:（[^\n]*）)?\s*$/.test(line.trim()));
  if (headerIndex < 0) return Object.freeze({ ok: false, status: "incomplete", errors: ["material_navigation_section_missing"] });
  const body = lines.slice(headerIndex + 1, headerIndex + 80).join("\n");
  if (!/章节/.test(body) || !/摘要/.test(body) || !/读取时机/.test(body)) {
    return Object.freeze({ ok: false, status: "incomplete", errors: ["material_navigation_columns_missing"] });
  }
  const rows = lines.slice(headerIndex + 1).filter((line) => /^\s*\|/.test(line) && !/^\s*\|\s*-/.test(line));
  if (rows.length < 2 || rows.some((row) => row.split("|").slice(1, -1).some((cell) => cell.trim() === ""))) {
    return Object.freeze({ ok: false, status: "incomplete", errors: ["material_navigation_row_incomplete"] });
  }
  return Object.freeze({ ok: true, status: "ready", errors: Object.freeze([]), header_line: headerIndex + 1, row_count: rows.length - 1 });
}

function packetHash(manifest, files) {
  const file_entries = Object.keys(files).sort((left, right) => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")))
    .map((path) => ({ path, sha256: sha256(Buffer.from(files[path], "utf8")) }));
  const { packet_freeze_hash: _hash, ...manifest_minus_hash } = manifest;
  return sha256(canonicalJson({ manifest_minus_hash, file_entries }));
}

function packetSourceEntries(source_materials, files) {
  const entries = Object.entries(source_materials ?? {}).map(([materialName, content]) => {
    const path = `${materialName}.md`;
    if (!validPacketPath(path)) throw new TypeError(`source material path is invalid: ${path}`);
    const normalized = normalizePacketText(content);
    if (materialName !== "decision-log" && !validateMaterialNavigation(normalized).ok) {
      throw new TypeError(`${materialName} material navigation is incomplete`);
    }
    files[path] = normalized;
    return { material_name: materialName, path, sha256: sha256(Buffer.from(normalized, "utf8")) };
  });
  const paths = new Set();
  for (const entry of entries) {
    if (paths.has(entry.path)) throw new TypeError(`duplicate packet path: ${entry.path}`);
    paths.add(entry.path);
  }
  return entries.sort((left, right) => Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8")));
}

/** Build the ephemeral stage-input packet; it is not a fifth material. */
export function buildStageInputPacket({ task_id, stage, material_revision, snapshot_tree, source_materials = {}, derived_files = [] } = {}) {
  if (typeof task_id !== "string" || task_id.trim() === "") throw new TypeError("stage input packet task_id is required");
  if (typeof stage !== "string" || stage.trim() === "") throw new TypeError("stage input packet stage is required");
  if (typeof material_revision !== "string" || material_revision.trim() === "") throw new TypeError("stage input packet material_revision is required");
  if (!SNAPSHOT.test(snapshot_tree ?? "")) throw new TypeError("stage input packet snapshot_tree is invalid");
  if (!source_materials || typeof source_materials !== "object" || Array.isArray(source_materials)) throw new TypeError("source_materials must be an object");
  const files = {};
  const sourceEntries = packetSourceEntries(source_materials, files);
  if (!Array.isArray(derived_files)) throw new TypeError("derived_files must be an array");
  const derivedEntries = derived_files.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || !validPacketPath(entry.path)) throw new TypeError(`derived file ${index + 1} path is invalid`);
    if (files[entry.path] !== undefined || ["decision-log.md", "spec.md", "plan.md", "tasks.md"].includes(entry.path)) throw new TypeError(`derived file path cannot be a material path: ${entry.path}`);
    if (typeof entry.producer !== "string" || entry.producer.trim() === "" || typeof entry.consumer !== "string" || entry.consumer.trim() === "") throw new TypeError(`derived file ${entry.path} producer/consumer is incomplete`);
    const normalized = normalizePacketText(entry.content);
    files[entry.path] = normalized;
    const sourceDigest = entry.source_digest ?? sha256(Buffer.from(normalized, "utf8"));
    if (!HASH.test(sourceDigest)) throw new TypeError(`derived file ${entry.path} source_digest is invalid`);
    return { path: entry.path, source_digest: sourceDigest, sha256: sha256(Buffer.from(normalized, "utf8")), producer: entry.producer, consumer: entry.consumer, authority: "non-material" };
  }).sort((left, right) => Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8")));
  const manifest = {
    algorithm_version: STAGE_INPUT_PACKET_VERSION,
    task_id,
    stage,
    material_revision,
    snapshot_tree,
    source_materials: sourceEntries,
    derived_files: derivedEntries,
    packet_freeze_hash: null,
  };
  manifest.packet_freeze_hash = packetHash(manifest, files);
  return Object.freeze({ schema_version: "workflowhub-stage-input-packet.v1", packet_freeze_hash: manifest.packet_freeze_hash, manifest: Object.freeze(manifest), files: Object.freeze({ ...files }) });
}

/** Verify a stage-input packet without reading a task directory or rewriting it. */
export function verifyStageInputPacket(packet) {
  if (!packet || packet.schema_version !== "workflowhub-stage-input-packet.v1" || !packet.manifest || typeof packet.files !== "object" || Array.isArray(packet.files)) {
    return Object.freeze({ ok: false, reason: "packet_shape_invalid" });
  }
  const manifest = packet.manifest;
  if (manifest.algorithm_version !== STAGE_INPUT_PACKET_VERSION || !HASH.test(manifest.packet_freeze_hash ?? "") || packet.packet_freeze_hash !== manifest.packet_freeze_hash) {
    return Object.freeze({ ok: false, reason: "packet_manifest_invalid" });
  }
  const expected = new Set([
    ...(Array.isArray(manifest.source_materials) ? manifest.source_materials : []).map((entry) => entry?.path),
    ...(Array.isArray(manifest.derived_files) ? manifest.derived_files : []).map((entry) => entry?.path),
  ]);
  const actual = new Set(Object.keys(packet.files));
  if (expected.size !== actual.size || [...expected].some((path) => !actual.has(path))) return Object.freeze({ ok: false, reason: "packet_file_set_mismatch" });
  for (const path of expected) {
    if (!validPacketPath(path) || typeof packet.files[path] !== "string") return Object.freeze({ ok: false, reason: "packet_path_or_content_invalid" });
    const digest = sha256(Buffer.from(normalizePacketText(packet.files[path]), "utf8"));
    const entry = [...(manifest.source_materials ?? []), ...(manifest.derived_files ?? [])].find((candidate) => candidate.path === path);
    if (digest !== entry.sha256) return Object.freeze({ ok: false, reason: "packet_file_hash_mismatch", path });
  }
  const rebuiltHash = packetHash(manifest, Object.fromEntries(Object.entries(packet.files).map(([path, value]) => [path, normalizePacketText(value)])));
  if (rebuiltHash !== manifest.packet_freeze_hash) return Object.freeze({ ok: false, reason: "packet_freeze_hash_mismatch" });
  return Object.freeze({ ok: true, packet_freeze_hash: rebuiltHash, manifest: Object.freeze({ ...manifest }) });
}
