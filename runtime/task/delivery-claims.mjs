// Single read-only reader for the three delivery claims (implemented /
// verified / accepted). It binds each claim to one ordinary original: the
// gate-results receipt written by the real `verify --execute` capture, the
// capture receipt named by that gate result, and the independent verdict plus
// the close readback. Nothing here writes a second ledger, guesses a newest
// same-named file, or re-runs a gate.
//
// File-level provenance cannot prove which caller wrote a JSON file. The gate
// original is therefore cross-checked against an independent producer (the
// capture receipt and its output bytes) and against recomputable Git/material
// state; `capture_route` is a type marker, not a signature. The verifiable
// alternative for real provenance is driving the public `verify --action=execute`
// entry and reading the receipt it leaves.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";
import { phaseFilesFromIndex } from "./material-workspace.mjs";
import { materialFingerprint } from "../stage/stage-content-contracts.mjs";
import { readTaskFacts } from "./task-store.mjs";
import { appendRecord } from "../interface/safe-write.mjs";

export const GATE_RESULTS_DIR = "quality/evidence/gate-results";
export const VERDICT_REF = "quality/evidence/verdict.json";
export const REPLAY_CASES_DIR = "quality/evidence/replay-cases";
export const CLOSE_CLAIMS_READBACK = /^\d{4}-\d{2}-\d{2}-\d{3}-close-claims-readback\.json$/;
const GATE_MARKER = /; gate: ([^\n;]+)/g;
const CLAIM_NAMES = Object.freeze(["implemented", "verified", "accepted"]);
const HEX = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const plain = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.trim() !== "";
const failure = (code, message) => Object.assign(new Error(message), { code });

function git(cwd, argv, { encoding = "buffer", optional = false } = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  const result = spawnSync("git", argv, { cwd, env, encoding, maxBuffer: 256 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0 && !optional) throw failure("GIT_COMMAND_FAILED", `git ${argv.join(" ")} failed: ${String(result.stderr ?? "").trim()}`);
  return result;
}

let graphifyProbe = null;
// A comparable toolchain environment. The probe is memoized per process and
// keeps only the first version line; an absent tool is a stable fact, not a
// failure of the reader.
export function graphifyIdentity() {
  if (graphifyProbe !== null) return graphifyProbe;
  let value;
  try {
    const result = spawnSync("graphify", ["--version"], { encoding: "utf8", timeout: 3000, maxBuffer: 64 * 1024 });
    if (result.error) value = { available: false, code: result.error.code ?? "PROBE_FAILED" };
    else if (result.status !== 0) value = { available: false, code: `exit ${result.status}` };
    else {
      const version = String(result.stdout ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0] ?? "";
      value = version ? { available: true, version: version.slice(0, 120) } : { available: false, code: "empty_version" };
    }
  } catch (error) { value = { available: false, code: error.code ?? "PROBE_FAILED" }; }
  graphifyProbe = Object.freeze({ ...value });
  return graphifyProbe;
}

// Runtime/toolchain comparability only: the same code executed from a different
// worktree must still be comparable, so cwd is deliberately excluded here.
export function environmentFingerprint(environment = {}) {
  const value = {
    arch: environment.arch ?? process.arch,
    graphify: environment.graphify ?? graphifyIdentity(),
    node: environment.node ?? process.version,
    node_major: environment.node_major ?? process.versions.node.split(".")[0],
    platform: environment.platform ?? process.platform,
  };
  return sha256(JSON.stringify(value));
}

// Repository identity is recorded separately because the task worktree may be
// removed by a lawful close after the gate ran.
export function workspaceIdentity({ cwd, worktreeRoot } = {}) {
  const path = worktreeRoot ?? cwd;
  const absent = { worktree_root: null, branch: null, head: null };
  if (!text(path) || !existsSync(path)) return Object.freeze({ ...absent, sha256: sha256(JSON.stringify(absent)) });
  try {
    const top = git(path, ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).stdout.trim();
    const head = git(path, ["rev-parse", "--verify", "HEAD^{commit}"], { encoding: "utf8" }).stdout.trim();
    const branchResult = git(path, ["branch", "--show-current"], { encoding: "utf8", optional: true });
    const branch = branchResult.status === 0 && text(branchResult.stdout) ? branchResult.stdout.trim() : null;
    if (!text(top) || !OID.test(head)) return Object.freeze({ ...absent, sha256: sha256(JSON.stringify(absent)) });
    const value = { worktree_root: top, branch, head };
    return Object.freeze({ ...value, sha256: sha256(JSON.stringify(value)) });
  } catch {
    return Object.freeze({ ...absent, sha256: sha256(JSON.stringify(absent)) });
  }
}

// Pending implementation bytes: tracked and untracked changes against HEAD,
// excluding `specs/` because material bytes are bound by the separate material
// fingerprint. The digest is recomputable at claim time while the worktree
// exists, so an uncommitted edit cannot hide behind a committed-only diff.
export function pendingSummary({ worktreeRoot } = {}) {
  if (!text(worktreeRoot) || !existsSync(worktreeRoot)) return null;
  const relative = (value) => value.replace(/^\.\//, "");
  const tracked = git(worktreeRoot, ["diff", "--name-only", "-z", "HEAD"], { encoding: "utf8" }).stdout
    .split("\0").filter(Boolean).map(relative).filter((path) => !path.startsWith("specs/")).sort();
  const trackedDiff = tracked.length
    ? git(worktreeRoot, ["diff", "--no-ext-diff", "--no-textconv", "--binary", "HEAD", "--", ...tracked]).stdout
    : Buffer.alloc(0);
  const untracked = git(worktreeRoot, ["ls-files", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).stdout
    .split("\0").filter(Boolean).map(relative).filter((path) => !path.startsWith("specs/")).sort();
  const untrackedHash = createHash("sha256");
  for (const name of untracked) {
    untrackedHash.update(name); untrackedHash.update("\0");
    try {
      const bytes = readFileSync(join(worktreeRoot, name));
      untrackedHash.update(`${bytes.length}\0${sha256(bytes)}`);
    } catch (error) { if (error.code !== "ENOENT") throw error; untrackedHash.update("absent"); }
    untrackedHash.update("\0");
  }
  const trackedDiffSha = sha256(trackedDiff), untrackedSha = untrackedHash.digest("hex");
  return Object.freeze({
    tracked_diff_sha256: trackedDiffSha,
    untracked_sha256: untrackedSha,
    changed_paths: Object.freeze([...new Set([...tracked, ...untracked])].sort()),
    untracked_files: Object.freeze([...untracked]),
    digest: sha256(JSON.stringify({ tracked_diff_sha256: trackedDiffSha, untracked_sha256: untrackedSha })),
  });
}

// Task-relative originals only. Symlinked ancestors, multi-link files and
// escaping references are real errors, not silently skipped evidence.
function readTaskRelative(taskPath, ref) {
  if (!text(ref) || isAbsolute(ref) || ref.includes("\\") || ref.includes("\0")
      || ref.split("/").some((part) => !part || part === "." || part === "..")
      || !/^quality\/(?:evidence|reviews|tests)\//.test(ref)) {
    throw failure("CLAIM_REFERENCE", `claim evidence reference is not a task-relative quality original: ${String(ref)}`);
  }
  let cursor = resolve(taskPath);
  for (const part of ref.split("/")) {
    cursor = join(cursor, part);
    const stat = lstatSync(cursor);
    if (stat.isSymbolicLink()) throw failure("PATH_ALIAS", `claim evidence ancestor is a symlink: ${cursor}`);
  }
  const named = lstatSync(cursor);
  if (!named.isFile() || named.nlink !== 1) throw failure("UNSAFE_FILE", `claim evidence must be a single-link regular file: ${cursor}`);
  return readFileSync(cursor);
}

function reference(value) {
  return plain(value) && Object.keys(value).sort().join("\0") === "ref\0sha256"
    && text(value.ref) && HEX.test(value.sha256 ?? "");
}

function readReference(taskPath, value, label) {
  if (!reference(value)) return { status: "fail", reasons: [`${label}: a {ref, sha256} task-relative original is required`], evidence: null };
  let bytes;
  try { bytes = readTaskRelative(taskPath, value.ref); }
  catch (error) {
    if (error.code === "ENOENT") return { status: "fail", reasons: [`${label}: named original is missing: ${value.ref}`], evidence: value };
    return { status: "fail", reasons: [`${label}: original is not readable: ${value.ref} (${error.code ?? error.message})`], evidence: value };
  }
  if (sha256(bytes) !== value.sha256) return { status: "fail", reasons: [`${label}: original bytes differ from the recorded sha256: ${value.ref}`], evidence: value };
  return { status: "pass", reasons: [], evidence: value, bytes };
}

function jsonReference(taskPath, value, label) {
  const read = readReference(taskPath, value, label);
  if (read.status !== "pass") return read;
  try { return { ...read, value: JSON.parse(read.bytes.toString("utf8")) }; }
  catch { return { status: "fail", reasons: [`${label}: named original is not JSON: ${value.ref}`], evidence: value }; }
}

// Current material bytes come from the declared task worktree while it exists
// and from the target repository's archived tree after delivery. Every
// candidate is a declared/derived task root, never a directory scan.
function materialSnapshot(taskPath) {
  const manifest = JSON.parse(readFileSync(join(resolve(taskPath), "task.json"), "utf8"));
  if (!text(manifest.task_id) || !isAbsolute(manifest.target_repo_root ?? "")) throw failure("CLAIM_TASK", "task.json identity or repository is invalid");
  const repo = realpathSync(manifest.target_repo_root);
  const bases = [];
  if (text(manifest.workspace_root) && isAbsolute(manifest.workspace_root) && existsSync(manifest.workspace_root)) bases.push(manifest.workspace_root);
  bases.push(resolve(dirname(repo), `${basename(repo)}-${manifest.task_id}`));
  bases.push(repo);
  let root = null, archived = false;
  for (const base of bases) {
    const current = join(base, "specs", manifest.task_id), archive = join(base, "specs", "archive", manifest.task_id);
    if (existsSync(join(current, "spec.md")) || existsSync(join(current, "phases/index.md"))) { root = current; archived = false; break; }
    if (existsSync(join(archive, "spec.md")) || existsSync(join(archive, "phases/index.md"))) { root = archive; archived = true; break; }
  }
  if (root === null) return { sha256: null, root: null, archived: false, missing: ["spec.md", "phases/index.md"], files: [] };
  const read = (file) => {
    try { return readFileSync(join(root, file), "utf8"); }
    catch (error) { if (error.code === "ENOENT") return null; throw error; }
  };
  const spec = read("spec.md"), index = read("phases/index.md");
  let names = [];
  if (index !== null) { try { names = phaseFilesFromIndex(index); } catch { names = []; } }
  const phases = {};
  for (const name of names) { const body = read(name); if (body !== null) phases[name] = body; }
  const missing = [["spec.md", spec], ["phases/index.md", index]].filter(([, body]) => body === null).map(([name]) => name);
  const files = [...(spec === null ? [] : ["spec.md"]), ...(index === null ? [] : ["phases/index.md"]), ...Object.keys(phases)];
  return {
    sha256: materialFingerprint({ spec: spec ?? "", index: index ?? "", phases }),
    root, archived, missing, files, phases,
  };
}

// The task worktree is declared (explicit or deterministic sibling), never the
// target checkout. Returns null after a lawful close removed it.
function taskWorktreeRoot(manifest, repo) {
  const candidates = [];
  if (text(manifest.workspace_root) && isAbsolute(manifest.workspace_root)) candidates.push(manifest.workspace_root);
  candidates.push(resolve(dirname(repo), `${basename(repo)}-${manifest.task_id}`));
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      const top = git(path, ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).stdout.trim();
      if (realpathSync(top) === realpathSync(path)) return path;
    } catch { /* not a registered worktree; keep looking */ }
  }
  return null;
}

// --- Declared Phase gate identity -----------------------------------------
// A capture only proves the delivery gate when its actual command is the gate
// the Phase material declares. Without that identity, any later green capture
// (a stray verify, a shortcut command) silently replaced a red gate because the
// reader only looked at the last pointer. The identity is recomputed here from
// the captured argv and the current Phase text; the artifact's recorded
// `gate_identity` must agree with it.
const DECLARED_GATE = /^[ \t]*[-*][ \t]+\*\*gate_cmd\*\*[ \t]*[:：][ \t]*`([^`]+)`/gm;
const PHASE_REF = /^phases\/(P[1-9][0-9]*)(?:-|\.)/;

// Minimal POSIX word split for a declared shell command. Only quoting and
// backslash escapes matter here: operators stay literal tokens so a compound
// command is compared as written, never interpreted.
export function shellWords(command) {
  const words = [];
  let word = "", quote = null, started = false;
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];
    if (quote === "'") { if (char === "'") quote = null; else word += char; started = true; continue; }
    if (quote === '"') {
      if (char === '"') quote = null;
      else if (char === "\\" && /["\\$`]/.test(command[index + 1] ?? "")) word += command[++index];
      else word += char;
      started = true; continue;
    }
    if (char === "'" || char === '"') { quote = char; started = true; continue; }
    if (char === "\\" && index + 1 < command.length) { word += command[++index]; started = true; continue; }
    if (/\s/.test(char)) { if (started) { words.push(word); word = ""; started = false; } continue; }
    word += char; started = true;
  }
  if (quote !== null) return null;
  if (started) words.push(word);
  return words;
}

function sameTokens(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

// A real capture wraps shell text as ["/bin/sh","-c",<text>], and the declared
// gate may itself be a `bash -c '…'` command, so the writer and the reader
// unwrap the same wrapper repeatedly. The cap stops a deeply wrapped command
// from being unwrapped forever; exceeding it is "未取得", never a silent skip.
const MAX_COMMAND_UNWRAP = 4;

// argv[0] is compared by program name (the real capture records the resolved
// absolute interpreter); a `sh -c`/`bash -c` capture is unwrapped to the script
// text on both sides so the declared `sh -c '…'` gate and its capture agree.
function canonicalCommandDepth(command) {
  const unwrap = (words) => {
    if (words.length === 3 && ["sh", "bash"].includes(basename(words[0])) && words[1] === "-c" && typeof words[2] === "string") {
      const inner = shellWords(words[2]);
      return inner === null ? null : inner;
    }
    return words;
  };
  let words;
  if (Array.isArray(command.argv)) { if (!command.argv.length || command.argv.some((value) => typeof value !== "string")) return { words: null, depth: 0, exceeded: false }; words = [...command.argv]; }
  else if (typeof command.shell === "string") { words = shellWords(command.shell); if (words === null) return { words: null, depth: 0, exceeded: false }; }
  else return { words: null, depth: 0, exceeded: false };
  if (!words.length) return { words: null, depth: 0, exceeded: false };
  let depth = 0;
  for (;;) {
    const next = unwrap(words);
    if (next === words) break;
    if (next === null || !next.length) return { words: null, depth, exceeded: false };
    words = next;
    depth += 1;
    if (depth === MAX_COMMAND_UNWRAP && unwrap(words) !== words) return { words: null, depth, exceeded: true };
  }
  const normalized = [...words];
  normalized[0] = basename(normalized[0]);
  return { words: normalized, depth, exceeded: false };
}

function canonicalCommand(command) {
  return canonicalCommandDepth(command).words;
}

export function declaredPhaseGates(phases) {
  const gates = [];
  for (const [ref, body] of Object.entries(phases ?? {})) {
    if (typeof body !== "string") continue;
    const phaseId = PHASE_REF.exec(ref)?.[1] ?? null;
    for (const match of body.matchAll(DECLARED_GATE)) {
      const gate = match[1].trim();
      if (gate) gates.push(Object.freeze({ phase_id: phaseId, phase_ref: ref, gate_cmd: gate, gate_cmd_sha256: sha256(gate) }));
    }
  }
  return gates;
}

// The two named reasons a capture cannot be classified as a declared gate.
// Both are "未取得": the reader stops at that original instead of treating it as
// "not a gate" and falling back to an earlier green capture.
const GATE_UNBOUND = Object.freeze({ UNPARSABLE: "unparsable", DEPTH_EXCEEDED: "depth-exceeded" });

// Gate identity recorded by the real capture. The command itself selects the
// declared gate (the current-phase gate is preferred when a cursor names it);
// a capture that is not a declared gate records null identity, and a capture
// that could not be classified records why it is "未取得".
export function gateIdentityFromCapture({ phases, command, phaseId = null } = {}) {
  const parsed = canonicalCommandDepth(command ?? {});
  if (parsed.words === null) {
    return Object.freeze({ identity: null, unbound: parsed.exceeded ? GATE_UNBOUND.DEPTH_EXCEEDED : GATE_UNBOUND.UNPARSABLE, depth: parsed.depth });
  }
  const captured = parsed.words;
  const matching = declaredPhaseGates(phases).filter((gate) => {
    const declared = canonicalCommand({ shell: gate.gate_cmd });
    return declared !== null && sameTokens(declared, captured);
  });
  if (!matching.length) return Object.freeze({ identity: null, unbound: null, depth: parsed.depth });
  const scoped = phaseId ? matching.filter((gate) => gate.phase_id === phaseId) : matching;
  if (!scoped.length || (!phaseId && scoped.length > 1)) return Object.freeze({ identity: null, unbound: null, depth: parsed.depth });
  return Object.freeze({ identity: Object.freeze({ ...scoped[0] }), unbound: null, depth: parsed.depth });
}

function gateMarkers(facts) {
  const row = facts.find((value) => value?.record_kind === "stage" && value.stage === "build-code");
  if (!row) return [];
  const source = typeof row.source === "string" ? row.source : "";
  return [...source.matchAll(GATE_MARKER)].map((match) => {
    const raw = match[1].trim();
    const bound = /^([A-Za-z0-9._/-]+)#sha256=([a-f0-9]{64})$/.exec(raw);
    return bound ? Object.freeze({ ref: bound[1], sha256: bound[2] }) : Object.freeze({ invalid: raw });
  });
}

// The delivery gate is the latest capture whose own `gate_identity` names the
// declared Phase gate for the current phase cursor. The reader trusts that
// self-declared identity (user decision 2026-11-24, option D): it never
// recomputes the captured command, and it stops at every unknown or mismatched
// original instead of falling back to an earlier green capture. Only two
// conditions skip an original, and both are known negatives rather than
// ignorance: the writer recorded it as "not any declared gate" (identity null
// with no gate_unbound), or it belongs to another declared Phase.
function gateFailure(code, reason, marker = null) {
  return { code, reason, evidence: marker ? Object.freeze({ ref: marker.ref, sha256: marker.sha256 }) : null };
}

function selectDeclaredGate({ taskPath, markers, phases, phaseId }) {
  if (!markers.length) return gateFailure("GATE_ABSENT", "no gate-results original is recorded in the build-code facts source");
  const declared = declaredPhaseGates(phases);
  if (!declared.length) return gateFailure("GATE_DECLARED_ABSENT", "the current Phase material declares no gate_cmd; the delivery gate identity cannot be bound");
  const scoped = phaseId ? declared.filter((gate) => gate.phase_id === phaseId) : declared;
  if (!scoped.length) return gateFailure("GATE_DECLARED_ABSENT", `the current Phase material declares no gate_cmd for ${phaseId}; the delivery gate identity cannot be bound`);
  const notGate = [], otherPhase = [];
  for (let index = markers.length - 1; index >= 0; index -= 1) {
    const marker = markers[index];
    if (marker.invalid) return gateFailure("GATE_MARKER_INVALID", `the recorded gate pointer is not a task-relative original with a sha256: ${marker.invalid}`);
    let artifact;
    try { artifact = JSON.parse(readTaskRelative(taskPath, marker.ref).toString("utf8")); }
    catch (error) { return gateFailure("GATE_ORIGINAL_UNREADABLE", `gate original unreadable (原件不可读): ${marker.ref} (${error.code ?? error.message})`, marker); }
    if (!plain(artifact)) return gateFailure("GATE_ORIGINAL_UNREADABLE", `gate original is not a JSON object (原件不可读): ${marker.ref}`, marker);
    if (!Object.hasOwn(artifact, "gate_identity")) {
      return gateFailure("GATE_IDENTITY_MISSING", `the recorded gate original declares no gate identity (身份缺失/未取得): ${marker.ref}; a record without identity is never a valid check and never falls back to an earlier capture`, marker);
    }
    const identity = artifact.gate_identity;
    if (identity === null) {
      const unbound = artifact.gate_unbound ?? null;
      if (unbound === null) {
        // Known negative A: the writer classified this capture as "not any
        // declared gate"; it is skipped, not read as a fallback.
        notGate.push({ ref: marker.ref, command: artifact.command ?? null });
        continue;
      }
      // Any other non-null value is unknown (including a writer reason this
      // reader does not recognise). It stops here and never falls into the
      // skip above, so an unrecognised original cannot reach an earlier green
      // capture. Known and unknown reasons share the named "未取得" failure.
      return gateFailure("GATE_IDENTITY_UNOBTAINED", `the capture could not be classified as a declared gate (未取得: ${unbound}): ${marker.ref}`, marker);
    }
    if (!plain(identity) || !text(identity.phase_ref) || !HEX.test(identity.gate_cmd_sha256 ?? "")) {
      return gateFailure("GATE_IDENTITY_MALFORMED", `the recorded gate identity is malformed: ${marker.ref}`, marker);
    }
    const hit = scoped.find((gate) => gate.phase_ref === identity.phase_ref && gate.gate_cmd_sha256 === identity.gate_cmd_sha256);
    if (hit) return { pointer: marker, artifact, declared: hit, notGate, otherPhase };
    const elsewhere = declared.some((gate) => gate.phase_ref === identity.phase_ref && gate.gate_cmd_sha256 === identity.gate_cmd_sha256);
    if (elsewhere) {
      // Known negative B: this original is another declared Phase's gate.
      otherPhase.push({ ref: marker.ref, command: artifact.command ?? null });
      continue;
    }
    return gateFailure("GATE_IDENTITY_MISMATCH", `the recorded gate identity does not match any currently declared gate (身份不符): ${marker.ref}`, marker);
  }
  return gateFailure("GATE_NOT_CAPTURED", `no recorded capture declares the current ${phaseId ?? "Phase"} gate identity (${notGate.length} capture(s) declare no gate; ${otherPhase.length} declare another Phase's gate)`);
}

function authorsFor(repo, baseline, head) {
  if (!text(head) || !OID.test(head) || git(repo, ["cat-file", "-e", `${head}^{commit}`], { optional: true }).status !== 0) return null;
  const authors = new Set();
  const headAuthor = git(repo, ["log", "-1", "--format=%an%x00%ae", head], { encoding: "utf8", optional: true });
  if (headAuthor.status === 0) for (const value of String(headAuthor.stdout).split("\0")) if (text(value)) authors.add(value.trim().toLowerCase());
  if (text(baseline) && OID.test(baseline) && baseline !== head
      && git(repo, ["cat-file", "-e", `${baseline}^{commit}`], { optional: true }).status === 0
      && git(repo, ["merge-base", "--is-ancestor", baseline, head], { optional: true }).status === 0) {
    const result = git(repo, ["log", "--format=%an%x00%ae", `${baseline}..${head}`], { encoding: "utf8", optional: true });
    if (result.status === 0) for (const value of String(result.stdout).split("\0")) if (text(value)) authors.add(value.trim().toLowerCase());
  }
  return authors;
}

function claim(status, reasons, evidence = null, code = null) { return { status, reasons: [...new Set(reasons)], evidence, code }; }

function readReadback(taskPath, material, gate, verdict) {
  const directory = join(resolve(taskPath), "quality", "evidence", "close");
  let names;
  try { names = readdirSync(directory).filter((name) => CLOSE_CLAIMS_READBACK.test(name)).sort(); }
  catch (error) { if (error.code === "ENOENT") return { status: "fail", reasons: ["accepted: no downstream close readback exists; the accepted declaration has no actual consumer"], evidence: null }; throw error; }
  const matched = [];
  for (const name of names) {
    const ref = `quality/evidence/close/${name}`;
    let record;
    try { record = JSON.parse(readTaskRelative(taskPath, ref).toString("utf8")); }
    catch { continue; }
    if (record?.schema_version !== "close-claims-readback.v1" || record.status !== "pass") continue;
    if (record.material_sha256 !== material.sha256) continue;
    if (!plain(record.gate_ref) || record.gate_ref.ref !== gate.ref || record.gate_ref.sha256 !== gate.sha256) continue;
    if (!plain(record.verdict_ref) || record.verdict_ref.ref !== verdict.ref || record.verdict_ref.sha256 !== verdict.sha256) continue;
    matched.push({ ref, sha256: sha256(readTaskRelative(taskPath, ref)) });
  }
  if (!matched.length) return { status: "fail", reasons: ["accepted: no close readback matches this material fingerprint, gate original and verdict"], evidence: null };
  return { status: "pass", reasons: [], evidence: matched.at(-1) };
}

export function readDeliveryClaims({ taskPath, requireReadback = true } = {}) {
  if (!text(taskPath) || !isAbsolute(taskPath)) throw new TypeError("readDeliveryClaims requires an absolute task path");
  const root = resolve(taskPath);
  const manifest = JSON.parse(readFileSync(join(root, "task.json"), "utf8"));
  const taskId = manifest.task_id;
  const facts = readTaskFacts(root);
  const material = materialSnapshot(root);
  const buildCodeRow = facts.find((value) => value?.record_kind === "stage" && value.stage === "build-code") ?? null;
  const markers = gateMarkers(facts);
  const phaseId = buildCodeRow?.phase_progress?.phase_id ?? null;
  const selection = selectDeclaredGate({ taskPath: root, markers, phases: material.phases, phaseId });
  const pointer = selection.pointer ?? null;
  let verdictBytes = null;
  try { verdictBytes = readTaskRelative(root, VERDICT_REF); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  // A build-code facts row is itself a delivery declaration; without a bound
  // gate original it cannot pass, even when no verdict exists yet.
  const required = Boolean(markers.length || verdictBytes || buildCodeRow);
  const repo = realpathSync(manifest.target_repo_root);
  const worktree = taskWorktreeRoot(manifest, repo);
  const currentEnvironment = environmentFingerprint();

  const claims = {};
  let gate = null, verdict = null, verdictRef = null;
  if (!pointer) {
    // Every named failure keeps the two-value claim status; "未取得" is carried
    // by the code and the reason text, never by a third status.
    claims.implemented = claim("fail", [`implemented: ${selection.reason}`], selection.evidence ?? null, selection.code ?? "GATE_NOT_CAPTURED");
    claims.verified = claim("fail", [`verified: ${selection.reason}`], selection.evidence ?? null, selection.code ?? "GATE_NOT_CAPTURED");
  } else {
    const read = jsonReference(root, pointer, "gate-results");
    if (read.status === "pass") gate = { ...pointer, artifact: read.value, bytes: read.bytes };
    const artifact = gate?.artifact;
    const reasons = [...read.reasons];
    if (artifact) {
      if (artifact.schema_version !== "gate-results.v1" || artifact.task_id !== taskId || artifact.stage !== "build-code") reasons.push("gate-results: schema, task or stage identity differs");
      if (artifact.capture_route !== "verify:execute") reasons.push("gate-results: the original was not produced by the real `verify --action=execute` capture route");
      if (!Array.isArray(artifact.argv) || artifact.argv.length === 0 || artifact.argv.some((value) => typeof value !== "string")) reasons.push("gate-results: the actual argv is missing");
      else if (artifact.command !== JSON.stringify(artifact.argv)) reasons.push("gate-results: the recorded command and argv differ");
      if (!(Number.isInteger(artifact.exit_code) || artifact.error)) reasons.push("gate-results: neither an integer exit nor a named capture error is bound");
      if (!Number.isFinite(Date.parse(artifact.started_at ?? "")) || !Number.isFinite(Date.parse(artifact.ended_at ?? ""))) reasons.push("gate-results: the capture start/end times are missing");
      if (!HEX.test(artifact.material_sha256 ?? "") || !Array.isArray(artifact.material_missing)) reasons.push("gate-results: the material fingerprint is missing");
      if (!reference({ ref: artifact.output_ref, sha256: artifact.output_sha256 }) || !HEX.test(artifact.output_sha256 ?? "")) reasons.push("gate-results: output_ref/output_sha256 binding is missing");
      else {
        const output = readReference(root, { ref: artifact.output_ref, sha256: artifact.output_sha256 }, "gate-results output");
        reasons.push(...output.reasons);
      }
      const head = artifact.head, baseline = artifact.baseline;
      if (!text(head) || !OID.test(head) || git(repo, ["cat-file", "-e", `${head}^{commit}`], { optional: true }).status !== 0) reasons.push("gate-results: recorded head is not a real Git commit");
      else if (text(baseline) && (!OID.test(baseline) || git(repo, ["merge-base", "--is-ancestor", baseline, head], { optional: true }).status !== 0)) reasons.push("gate-results: recorded baseline is not an ancestor of the recorded head");
      else if (text(baseline)) {
        const diff = git(repo, ["diff", "--no-ext-diff", "--no-textconv", "--binary", `${baseline}..${head}`], { optional: true });
        if (diff.status !== 0) reasons.push("gate-results: the recorded implementation diff cannot be recomputed");
        else if (sha256(diff.stdout) !== artifact.diff_sha256) reasons.push("gate-results: the recorded implementation diff digest differs from the real Git bytes");
      } else reasons.push("gate-results: no implementation baseline is bound; the diff claim cannot be verified");
      if (!HEX.test(artifact.environment_sha256 ?? "")) reasons.push("gate-results: the environment fingerprint is missing");
      if (!plain(artifact.environment) || artifact.environment.platform !== process.platform
          || artifact.environment.arch !== process.arch
          || artifact.environment.node_major !== process.versions.node.split(".")[0]) reasons.push("gate-results: the platform/architecture/node-major environment differs from the captured gate; re-run the gate");
      if (!plain(artifact.workspace) || !HEX.test(artifact.workspace_sha256 ?? "")) reasons.push("gate-results: the worktree/branch identity is missing");
      else {
        if (artifact.workspace.head !== artifact.head) reasons.push("gate-results: the recorded workspace head differs from the gate head");
        if (worktree !== null) {
          const current = workspaceIdentity({ worktreeRoot: worktree });
          if (artifact.workspace.branch !== null && current.branch !== artifact.workspace.branch) reasons.push("gate-results: the current task branch differs from the captured branch");
        }
      }
      if (!plain(artifact.pending) || !HEX.test(artifact.pending.digest ?? "")) reasons.push("gate-results: the pending implementation summary is missing");
      else if (artifact.pending.digest !== sha256(JSON.stringify({ tracked_diff_sha256: artifact.pending.tracked_diff_sha256, untracked_sha256: artifact.pending.untracked_sha256 }))) reasons.push("gate-results: the pending implementation summary is not recomputable");
      else if (worktree !== null) {
        const current = pendingSummary({ worktreeRoot: worktree });
        if (current === null || current.digest !== artifact.pending.digest) reasons.push("gate-results: uncommitted implementation bytes differ from the captured gate");
      }
    }
    claims.implemented = claim(reasons.length ? "fail" : "pass", reasons, read.evidence, reasons.length ? "GATE_ORIGINAL_INVALID" : null);
    const verifiedReasons = [...reasons];
    // Failure count fixed before the report-only later-capture line is appended.
    let verifiedFailures = verifiedReasons.length;
    if (artifact) {
      if (artifact.exit_code !== 0) verifiedReasons.push(`verified: the captured gate exit is ${artifact.exit_code === null ? "unreadable" : artifact.exit_code}, not 0`);
      const receiptRef = { ref: artifact.receipt_ref, sha256: artifact.receipt_sha256 };
      if (!reference(receiptRef)) verifiedReasons.push("verified: the capture receipt is not a bound {ref, sha256} original");
      else {
        const receiptRead = jsonReference(root, receiptRef, "capture receipt");
        verifiedReasons.push(...receiptRead.reasons);
        const receipt = receiptRead.value;
        if (receipt) {
          if (receipt.exit_code !== artifact.exit_code) verifiedReasons.push("verified: the capture receipt exit differs from the gate result");
          if (JSON.stringify(receipt.argv ?? null) !== JSON.stringify(artifact.argv ?? null)) verifiedReasons.push("verified: the capture receipt argv differs from the gate result");
          if (receipt.started_at !== artifact.started_at || receipt.ended_at !== artifact.ended_at) verifiedReasons.push("verified: the capture receipt times differ from the gate result");
          if ((receipt.cancelled === true) !== (artifact.cancelled === true) || (receipt.timed_out === true) !== (artifact.timed_out === true)) verifiedReasons.push("verified: the capture receipt cancellation/timeout differs from the gate result");
          const absoluteOutput = (value) => isAbsolute(value) ? value : resolve(root, value);
          if (absoluteOutput(receipt.output_ref) !== absoluteOutput(artifact.output_ref)) verifiedReasons.push("verified: the capture receipt names a different output original");
        }
      }
      // Report-only position of every capture that came after the accepted gate:
      // a later green capture of another command never replaces it, and the
      // reason names both rounds' commands so the two are distinguishable. The
      // report never changes the verdict; the failure set below was fixed
      // before this point, so a green declared gate with later noise still passes.
      verifiedFailures = verifiedReasons.length;
      const acceptedIndex = markers.indexOf(pointer);
      const later = acceptedIndex >= 0 ? markers.slice(acceptedIndex + 1) : [];
      if (later.length) {
        const latestLater = later.at(-1);
        let laterArtifact = null;
        if (!latestLater.invalid) { try { laterArtifact = JSON.parse(readTaskRelative(root, latestLater.ref).toString("utf8")); } catch { laterArtifact = null; } }
        verifiedReasons.push(`verified: ${later.length} later capture(s) are not the declared ${phaseId ?? "Phase"} gate and do not replace it; gate command=${JSON.stringify(artifact.command ?? null)}; latest later capture=${JSON.stringify(laterArtifact?.command ?? null)}; latest later original=${latestLater.ref ?? null}`);
      }
    }
    claims.verified = claim(verifiedFailures ? "fail" : "pass", verifiedReasons, read.evidence, verifiedFailures ? "GATE_VERIFIED_RED" : null);
  }

  if (!verdictBytes) {
    claims.accepted = claim("fail", ["accepted: no independent signature original exists at quality/evidence/verdict.json"]);
  } else {
    const reasons = [];
    try { verdict = JSON.parse(verdictBytes.toString("utf8")); }
    catch { reasons.push("accepted: the signature original is not JSON"); }
    verdictRef = { ref: VERDICT_REF, sha256: sha256(verdictBytes) };
    if (verdict) {
      if (verdict.schema_version !== "delivery-verdict.v1" || verdict.task_id !== taskId || verdict.stage !== "build-code") reasons.push("accepted: signature schema, task or stage identity differs");
      if (verdict.conclusion !== "pass") reasons.push("accepted: signature conclusion is not pass");
      const signer = plain(verdict.signer) ? verdict.signer.identity : null;
      if (!text(signer)) reasons.push("accepted: signer identity is missing");
      if (!plain(verdict.reviewed) || !HEX.test(verdict.reviewed.material_sha256 ?? "")) reasons.push("accepted: signed material fingerprint is missing");
      else if (material.sha256 === null) reasons.push("accepted: current task materials are not readable; the signed fingerprint cannot be compared");
      else if (verdict.reviewed.material_sha256 !== material.sha256) reasons.push(`accepted: current material bytes differ from the signed fingerprint (signed ${verdict.reviewed.material_sha256}, current ${material.sha256}); re-sign the current bytes`);
      if (!pointer || !plain(verdict.reviewed?.gate_ref) || verdict.reviewed.gate_ref.ref !== pointer.ref || verdict.reviewed.gate_ref.sha256 !== pointer.sha256) reasons.push("accepted: signature does not name the current gate-results original");
      if (text(signer)) {
        const authors = authorsFor(repo, gate?.artifact?.baseline ?? manifest.baseline_commit, gate?.artifact?.head);
        if (authors && authors.has(signer.trim().toLowerCase())) reasons.push("accepted: the signer is one of the implementation authors");
      }
      if (material.missing.length) reasons.push(`accepted: current materials are incomplete (${material.missing.join(", ")})`);
      if (gate?.artifact) {
        if (Array.isArray(gate.artifact.material_missing) && gate.artifact.material_missing.length) reasons.push("accepted: the signed gate original ran without a complete material set");
        if (gate.artifact.material_sha256 !== material.sha256) reasons.push("accepted: the signed gate original ran on different material bytes than the current materials");
      }
      if (requireReadback && pointer) {
        const readback = readReadback(root, material, pointer, verdictRef);
        reasons.push(...readback.reasons);
        claims.accepted = claim(reasons.length ? "fail" : "pass", reasons, readback.evidence ?? verdictRef);
      } else {
        claims.accepted = claim(reasons.length ? "fail" : "pass", reasons, verdictRef);
      }
    } else claims.accepted = claim("fail", reasons, verdictRef);
  }

  const status = !required ? "not_required"
    : CLAIM_NAMES.every((name) => claims[name].status === "pass") ? "pass" : "fail";
  return Object.freeze({
    task_id: taskId, required, status,
    material: Object.freeze({ sha256: material.sha256, root: material.root, archived: material.archived, missing: Object.freeze([...material.missing]), files: Object.freeze([...material.files]) }),
    gate: gate ? Object.freeze({ ref: pointer.ref, sha256: pointer.sha256, exit_code: gate.artifact.exit_code, head: gate.artifact.head ?? null, baseline: gate.artifact.baseline ?? null, workspace: gate.artifact.workspace ?? null, workspace_sha256: gate.artifact.workspace_sha256 ?? null, pending: gate.artifact.pending ?? null }) : null,
    worktree: Object.freeze({ path: worktree, pending_recheck: worktree === null ? "worktree_absent" : "recomputed" }),
    verdict: verdictRef ? Object.freeze(verdictRef) : null,
    claims: Object.freeze(Object.fromEntries(CLAIM_NAMES.map((name) => [name, Object.freeze(claims[name])]))),
    claim_codes: Object.freeze(Object.fromEntries(CLAIM_NAMES.map((name) => [name, claims[name].code ?? null]))),
    environment: Object.freeze({ sha256: currentEnvironment, platform: process.platform, arch: process.arch, node: process.version, node_major: process.versions.node.split(".")[0], graphify: graphifyIdentity() }),
  });
}

// Close is the only writer: it re-reads the originals, rejects a failed claim
// before any Git action, and records the actual downstream readback that the
// accepted claim needs. A signature/staleness failure leaves every original in
// place; only the readback owner reverts its own failed wiring.
export async function recordCloseClaimsReadback({ taskPath, planRef, worktreeRoot } = {}) {
  if (!text(planRef)) throw new TypeError("close claims readback requires the current close plan reference");
  const before = readDeliveryClaims({ taskPath, requireReadback: false });
  if (!before.required) return { status: "not_required", claims: before, readback_ref: null };
  const failed = Object.entries(before.claims).filter(([, value]) => value.status !== "pass");
  if (failed.length) {
    throw failure("DELIVERY_CLAIMS_REJECTED", `close refuses the unproven delivery claims [${failed.map(([, value]) => value.code ?? "UNCODED").join(",")}]: ${failed.map(([name, value]) => `${name} (${value.reasons.join("; ")})`).join(" | ")}`);
  }
  const record = {
    schema_version: "close-claims-readback.v1",
    task_id: before.task_id,
    stage: "build-code",
    status: "pass",
    plan_ref: planRef,
    worktree_root: worktreeRoot ?? null,
    material_sha256: before.material.sha256,
    gate_ref: { ref: before.gate.ref, sha256: before.gate.sha256 },
    verdict_ref: { ref: before.verdict.ref, sha256: before.verdict.sha256 },
    claims: Object.fromEntries(CLAIM_NAMES.map((name) => [name, before.claims[name].evidence])),
    environment_sha256: before.environment.sha256,
    pending_digest: before.gate.pending?.digest ?? null,
    workspace_sha256: before.gate.workspace_sha256 ?? null,
    read_at: new Date().toISOString(),
  };
  const bytes = Buffer.from(`${JSON.stringify(record, null, 2)}\n`, "utf8");
  const directory = join(resolve(taskPath), "quality", "evidence", "close");
  const ref = await appendRecord(directory, "close-claims-readback", "json", bytes);
  const relativeRef = `quality/evidence/close/${ref.slice(ref.lastIndexOf(sep) + 1)}`;
  const after = readDeliveryClaims({ taskPath, requireReadback: true });
  if (after.claims.accepted.status !== "pass") {
    throw failure("DELIVERY_CLAIMS_READBACK", `the recorded close readback does not satisfy the accepted claim: ${after.claims.accepted.reasons.join("; ")}`);
  }
  return { status: "pass", claims: after, readback_ref: relativeRef };
}
