import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, parse, resolve, sep } from "node:path";
import { writeFileAtomic } from "../interface/safe-write.mjs";

export const CURRENT_MATERIAL_FILES = Object.freeze(["decision-log.md", "spec.md", "phases/index.md"]);
const PHASE_FILE = /^phases\/P([1-9][0-9]*)\.md$/;

export function phaseFilesFromIndex(index) {
  if (typeof index !== "string" || index.trim() === "") throw new TypeError("post Phase index is missing");
  const lines = index.split(/\r?\n/);
  const section = lines.findIndex((line) => /^##\s+(?:Execution Index|执行索引)\s*$/.test(line.trim()));
  if (section < 0) throw new TypeError("post Phase index lacks Execution Index section");
  const body = [];
  for (const line of lines.slice(section + 1)) {
    if (/^##\s+/.test(line)) break;
    if (line.trim().startsWith("|")) body.push(line);
  }
  const cells = (line) => line.split("|").slice(1, -1).map((cell) => cell.trim());
  const header = body.length ? cells(body[0]) : [];
  const phaseColumn = header.findIndex((cell) => /^(?:phase|阶段)$/i.test(cell));
  const authorityColumn = header.findIndex((cell) => /^(?:authority ref|权威引用|权威来源)$/i.test(cell));
  if (phaseColumn < 0 || authorityColumn < 0) throw new TypeError("post Phase index lacks phase/authority ref columns");
  const refs = body.slice(1).filter((line) => !/^\|\s*:?-{2,}/.test(line)).map((line) => {
    const row = cells(line);
    const phase = row[phaseColumn]?.match(/^`(P[1-9][0-9]*)`$/)?.[1];
    const ref = row[authorityColumn]?.match(/^`([^`]+)`$/)?.[1];
    if (!phase || ref !== `phases/${phase}.md`) throw new TypeError("post Phase index row has mismatched Phase authority");
    return ref;
  });
  if (refs.length === 0) throw new TypeError("post Phase index has no Phase refs");
  if (refs.some((ref) => !PHASE_FILE.test(ref))) throw new TypeError("post Phase index has an unsafe Phase ref");
  if (new Set(refs).size !== refs.length) throw new TypeError("post Phase index has duplicate Phase refs");
  for (let index = 0; index < refs.length; index += 1) {
    if (refs[index] !== `phases/P${index + 1}.md`) throw new TypeError("post Phase index must list consecutive ordered Phases");
  }
  return Object.freeze(refs);
}

export function materialFilesForCohort(activationCohort = "post", materials = {}, { stage } = {}) {
  if (activationCohort !== "post") throw new TypeError("current material workspace requires post cohort; historical materials are read-only");
  if (stage === "make-decision") return Object.freeze(["decision-log.md"]);
  if (materials?.["phases/index.md"] == null) {
    if (Object.keys(materials).some(file => file.startsWith("phases/") && file !== "phases/index.md")) throw new TypeError("post material map has Phase files without an index");
    return CURRENT_MATERIAL_FILES;
  }
  const names = [...CURRENT_MATERIAL_FILES, ...phaseFilesFromIndex(materials["phases/index.md"])];
  if (Object.keys(materials).some(file => file.startsWith("phases/") && !names.includes(file))) throw new TypeError("post material map has an unindexed Phase");
  return Object.freeze(names);
}

function materialPath(root, file) {
  if (typeof root !== "string" || !isAbsolute(root)) throw new TypeError("material workspace root must be absolute");
  if (!CURRENT_MATERIAL_FILES.includes(file) && !PHASE_FILE.test(file)) throw new TypeError(`invalid current material file: ${file}`);
  return resolve(root, file);
}
function directories(path) {
  let cursor = parse(path).root;
  const paths = [cursor];
  for (const part of path.slice(cursor.length).split(sep).filter(Boolean)) { cursor = join(cursor, part); paths.push(cursor); }
  return paths.map(path => {
    const stat = lstatSync(path);
    const systemAlias = process.platform === "darwin" && ((path === "/tmp" && realpathSync(path) === "/private/tmp") || (path === "/var" && realpathSync(path) === "/private/var"));
    if ((!systemAlias && stat.isSymbolicLink()) || (!systemAlias && !stat.isDirectory())) throw new TypeError("material ancestor must be a real directory");
    return { path, dev: stat.dev, ino: stat.ino, real: realpathSync(path) };
  });
}
function checkDirectories(snapshot) {
  for (const before of snapshot) {
    const stat = lstatSync(before.path);
    if (stat.dev !== before.dev || stat.ino !== before.ino || realpathSync(before.path) !== before.real) throw new Error("material ancestor changed during read");
  }
}
function readMaterial(root, file) {
  const path = materialPath(root, file);
  const ancestry = directories(dirname(path));
  const named = lstatSync(path);
  if (named.isSymbolicLink() || !named.isFile() || named.nlink !== 1) throw new TypeError("material must be a single-link regular file");
  if (!Number.isInteger(constants.O_NOFOLLOW)) throw new Error("O_NOFOLLOW is required for material reads");
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = fstatSync(fd);
    if (!opened.isFile() || opened.dev !== named.dev || opened.ino !== named.ino || opened.nlink !== 1) throw new Error("material identity changed while opening");
    checkDirectories(ancestry);
    const value = readFileSync(fd, "utf8");
    const after = lstatSync(path);
    if (after.isSymbolicLink() || after.dev !== opened.dev || after.ino !== opened.ino || after.nlink !== 1) throw new Error("material identity changed during read");
    checkDirectories(ancestry);
    return value;
  } finally { closeSync(fd); }
}
export function inspectMaterialWorkspace(root, { activationCohort = "post" } = {}) {
  materialFilesForCohort(activationCohort);
  if (typeof root !== "string" || !isAbsolute(root)) throw new TypeError("material workspace root must be absolute");
  const files = {}, missing = [], errors = [];
  const read = file => {
    try { const value = readMaterial(root, file); if (!value.trim()) missing.push(file); else files[file] = value; }
    catch (error) { missing.push(file); if (error.code !== "ENOENT") errors.push(`${file}:${error.message}`); }
  };
  for (const file of CURRENT_MATERIAL_FILES) read(file);
  if (files["phases/index.md"]) {
    try {
      const names = materialFilesForCohort("post", files);
      for (const file of names.slice(CURRENT_MATERIAL_FILES.length)) read(file);
      const ancestry = directories(resolve(root, "phases"));
      const disk = readdirSync(resolve(root, "phases")).filter(name => name.endsWith(".md") && name !== "index.md").map(name => `phases/${name}`);
      checkDirectories(ancestry);
      for (const file of disk) if (!names.includes(file)) errors.push(`${file}:unindexed_phase`);
    } catch (error) { errors.push(`phases/index.md:${error.message}`); }
  }
  return Object.freeze({ status: missing.length || errors.length ? "not_ready" : "working", root: resolve(root), files: Object.freeze(files), missing: Object.freeze(missing), errors: Object.freeze(errors) });
}
export async function replaceMaterialAtomic(root, file, content, options = {}) {
  materialPath(root, file);
  if (typeof content !== "string" || content.length === 0) throw new TypeError("material content must be non-empty text");
  if (Object.keys(options).length) throw new TypeError("material write options are retired; shared safe-write owns atomic publication");
  await writeFileAtomic(root, file, content);
  return Object.freeze({ file, bytes: Buffer.byteLength(content) });
}
