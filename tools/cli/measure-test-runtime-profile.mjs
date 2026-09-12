#!/usr/bin/env node

import { SHA256_HEX_CASE_INSENSITIVE } from "../../runtime/evidence/canonical-utils.mjs";
/**
 * Capture the S3 runtime profile without reusing an older result.
 *
 * The profile JSON is the invocation's pinned declaration.  Its finite
 * ceilings are checked against the runtime contract; the runner never owns a
 * second set of duration values.  Manifests contain explicit argv entries so
 * that a collection is a collection of file processes, not a shell string or
 * an in-process loop.
 */

import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { arch, cpus, hostname, platform, release } from "node:os";
import { basename, dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  TEST_RUNTIME_PROFILE_LIMITS_MS,
  TEST_RUNTIME_PROFILE_NAMES,
  validateTestRuntimeProfile,
} from "../../runtime/stage/stage-content-contracts.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const CAPABILITIES = Object.freeze(["network", "db", "filesystem", "subprocess", "environment"]);
const MAX_OUTPUT_BYTES = 50 * 1024 * 1024;
const PROFILE_SOURCE_EXPORT = "TEST_RUNTIME_PROFILE_LIMITS_MS";

function object(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isoNow() {
  return new Date().toISOString();
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive safe integer`);
  return value;
}

function inputPath(value, label, base = process.cwd()) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required`);
  return isAbsolute(value) ? resolve(value) : resolve(base, value);
}

function readJson(path, label) {
  let raw;
  try {
    raw = readFileSync(path);
  } catch (error) {
    throw new Error(`${label} cannot be read: ${error.message}`);
  }
  let value;
  try {
    value = JSON.parse(raw.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  return { path, raw, value };
}

function writeImmutable(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp-${process.pid}-${randomUUID()}`;
  let fd;
  try {
    fd = openSync(temporaryPath, "wx");
    let offset = 0;
    while (offset < bytes.length) offset += writeSync(fd, bytes, offset, bytes.length - offset);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    // Hard-link publication is atomic and refuses to replace an existing
    // immutable destination, unlike renameSync on POSIX.
    linkSync(temporaryPath, path);
  } finally {
    if (fd !== undefined) closeSync(fd);
    try { unlinkSync(temporaryPath); } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
}

function writeImmutableJson(path, value) {
  writeImmutable(path, Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"));
}

function parseKeyValueArg(arg) {
  const separator = arg.indexOf("=");
  if (separator < 0) return null;
  return [arg.slice(0, separator), arg.slice(separator + 1)];
}

export function parseMeasurementArgs(args, cwd = process.cwd()) {
  if (!Array.isArray(args)) throw new TypeError("measurement argv must be an array");
  const values = {};
  for (const arg of args) {
    const pair = parseKeyValueArg(arg);
    if (!pair || !["--profile-json", "--inner-manifest", "--medium-manifest", "--runs", "--output"].includes(pair[0])) {
      throw new Error(`unknown measurement option: ${arg}`);
    }
    if (values[pair[0]] !== undefined) throw new Error(`duplicate measurement option: ${pair[0]}`);
    values[pair[0]] = pair[1];
  }
  for (const name of ["--profile-json", "--inner-manifest", "--medium-manifest", "--runs", "--output"]) {
    if (values[name] === undefined || values[name] === "") throw new Error(`${name} is required`);
  }
  const runs = Number(values["--runs"]);
  positiveInteger(runs, "--runs");
  if (runs !== 5) throw new Error("--runs must be exactly 5 for the S3 protocol");
  return Object.freeze({
    profilePath: inputPath(values["--profile-json"], "--profile-json", cwd),
    innerManifestPath: inputPath(values["--inner-manifest"], "--inner-manifest", cwd),
    mediumManifestPath: inputPath(values["--medium-manifest"], "--medium-manifest", cwd),
    runs,
    outputPath: inputPath(values["--output"], "--output", cwd),
  });
}

function profileNode(document, name) {
  if (object(document.value?.profiles) && object(document.value.profiles[name])) return document.value.profiles[name];
  if (object(document.value?.[name])) return document.value[name];
  if (document.value?.runtime_profile === name) return document.value;
  throw new Error(`profile JSON does not declare ${name}`);
}

function resolveWorkerCeiling(document, node, name) {
  const value = node.worker_ceiling ?? document.value.worker_ceiling;
  positiveInteger(value, `${name} worker_ceiling`);
  const source = node.worker_ceiling_source ?? document.value.worker_ceiling_source ?? "profile-json";
  if (typeof source !== "string" || source.trim() === "") throw new Error(`${name} worker_ceiling_source is required`);
  return { value, source };
}

function resolveCapabilityObservation(document, node, name, contractValue) {
  const value = node.capability_observation ?? document.value.capability_observation;
  if (!object(value) || value.status !== "observed") {
    return {
      status: "unavailable",
      counts: null,
      reason: "profile JSON did not provide an observed capability count",
    };
  }
  if (!object(value.counts)) {
    return {
      status: "incomplete",
      counts: null,
      reason: `${name} capability observation has no complete count set`,
    };
  }
  const counts = {};
  for (const capability of CAPABILITIES) {
    if (!Number.isSafeInteger(value.counts[capability]) || value.counts[capability] < 0) {
      return {
        status: "incomplete",
        counts: null,
        reason: `${name} capability observation count is invalid for ${capability}`,
      };
    }
    counts[capability] = value.counts[capability];
  }
  if (typeof value.source !== "string" || value.source.trim() === ""
      || typeof value.evidence_ref !== "string" || value.evidence_ref.trim() === ""
      || !SHA256_HEX_CASE_INSENSITIVE.test(value.evidence_hash)) {
    return {
      status: "incomplete",
      counts,
      reason: `${name} capability observation is missing authenticated source/ref/hash`,
    };
  }
  const capabilityProof = node.capability_proof ?? document.value.capability_proof;
  const proofValidation = validateTestRuntimeProfile({
    ...contractValue,
    capability_proof: capabilityProof,
    behavior_fingerprint: node.behavior_fingerprint ?? document.value.behavior_fingerprint,
  }, { requireProof: true });
  if (!proofValidation.ok || proofValidation.status !== "ready") {
    return {
      status: "incomplete",
      counts,
      source: value.source,
      evidence_ref: value.evidence_ref,
      evidence_hash: value.evidence_hash,
      reason: `${name} capability observation has no authenticated runtime capability proof`,
    };
  }
  return {
    status: "observed",
    counts,
    source: value.source,
    evidence_ref: value.evidence_ref,
    evidence_hash: value.evidence_hash,
    capability_proof: capabilityProof,
  };
}

function normaliseProfile(document, name) {
  if (!TEST_RUNTIME_PROFILE_NAMES.includes(name) || name === "large") throw new Error(`measurement profile must be inner or medium, got ${name}`);
  const node = profileNode(document, name);
  const runtime_profile = node.runtime_profile ?? node.profile;
  if (runtime_profile !== name) throw new Error(`${name} runtime_profile does not match its profile key`);
  const sourceCeiling = TEST_RUNTIME_PROFILE_LIMITS_MS[name];
  const ceiling_ms = node.ceiling_ms ?? sourceCeiling;
  if (sourceCeiling !== null && ceiling_ms !== sourceCeiling) {
    throw new Error(`${name} ceiling_ms must read from ${PROFILE_SOURCE_EXPORT}`);
  }
  const contractValue = { ...node, runtime_profile, ceiling_ms };
  const validation = validateTestRuntimeProfile(contractValue, { declarationOnly: true });
  if (validation.errors.length > 0) throw new Error(`${name} runtime profile is invalid: ${validation.errors.join("; ")}`);
  const run_location = node.run_location ?? node.location ?? null;
  if (run_location !== null && (typeof run_location !== "string" || run_location.trim() === "")) {
    throw new Error(`${name} run_location must be a non-empty string when supplied`);
  }
  const worker = resolveWorkerCeiling(document, node, name);
  return Object.freeze({
    ...contractValue,
    runtime_profile,
    ceiling_ms,
    run_location,
    worker_ceiling: worker.value,
    worker_ceiling_source: worker.source,
    capability_observation: resolveCapabilityObservation(document, node, name, contractValue),
  });
}

function normaliseManifest(document, expectedProfile, profile) {
  const rawMembers = Array.isArray(document.value) ? document.value : document.value?.members;
  if (!Array.isArray(rawMembers) || rawMembers.length === 0) throw new Error(`${expectedProfile} manifest members must be a non-empty array`);
  const declaredProfile = Array.isArray(document.value) ? expectedProfile : (document.value.runtime_profile ?? document.value.profile);
  if (declaredProfile !== expectedProfile) throw new Error(`${expectedProfile} manifest runtime_profile is missing or mismatched`);
  if (document.value.worker_ceiling !== undefined && document.value.worker_ceiling !== profile.worker_ceiling) {
    throw new Error(`${expectedProfile} manifest worker_ceiling does not match profile JSON`);
  }
  const seen = new Set();
  const seenFiles = new Set();
  const members = rawMembers.map((entry, index) => {
    if (typeof entry === "string") throw new Error(`${expectedProfile} manifest member ${index + 1} requires explicit argv`);
    if (!object(entry)) throw new Error(`${expectedProfile} manifest member ${index + 1} must be an object`);
    const id = entry.id ?? entry.file ?? entry.path ?? `member-${index + 1}`;
    const file = entry.file ?? entry.path ?? id;
    if (typeof id !== "string" || id.trim() === "" || seen.has(id)) throw new Error(`${expectedProfile} manifest member id is missing or duplicated`);
    if (typeof file !== "string" || file.trim() === "") throw new Error(`${expectedProfile} manifest member file is required`);
    const fileIdentity = isAbsolute(file) ? resolve(file) : resolve(dirname(document.path), file);
    if (seenFiles.has(fileIdentity)) throw new Error(`${expectedProfile} manifest member file is duplicated: ${file}`);
    seenFiles.add(fileIdentity);
    if (entry.command !== undefined && typeof entry.command === "string"
        && entry.args !== undefined && !Array.isArray(entry.args)) {
      throw new Error(`${expectedProfile} manifest member ${id} args must be an array`);
    }
    seen.add(id);
    let argv = entry.argv;
    if (!Array.isArray(argv) && Array.isArray(entry.command)) argv = entry.command;
    if (typeof entry.command === "string") argv = [entry.command, ...(entry.args ?? [])];
    if (!Array.isArray(argv) || argv.length === 0 || argv.some((value) => typeof value !== "string")) {
      throw new Error(`${expectedProfile} manifest member ${id} requires an explicit argv array`);
    }
    const cwd = inputPath(entry.cwd ?? repoRoot, `${expectedProfile} member ${id} cwd`, dirname(document.path));
    let stat;
    try { stat = lstatSync(cwd); } catch (error) { throw new Error(`${expectedProfile} member ${id} cwd cannot be read: ${error.message}`); }
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`${expectedProfile} member ${id} cwd must be a real directory`);
    const timeout_ms = entry.timeout_ms ?? profile.ceiling_ms;
    positiveInteger(timeout_ms, `${expectedProfile} member ${id} timeout_ms`);
    if (timeout_ms > profile.ceiling_ms) throw new Error(`${expectedProfile} member ${id} timeout exceeds profile ceiling`);
    const env = entry.env ?? {};
    if (!object(env) || Object.entries(env).some(([key, value]) => key.trim() === "" || typeof value !== "string")) {
      throw new Error(`${expectedProfile} manifest member ${id} env must be string-valued`);
    }
    return Object.freeze({ id, file, argv: Object.freeze([...argv]), cwd, timeout_ms, env: Object.freeze({ ...env }) });
  });
  return Object.freeze({
    runtime_profile: expectedProfile,
    worker_ceiling: profile.worker_ceiling,
    worker_ceiling_source: profile.worker_ceiling_source,
    manifest_ref: document.path,
    manifest_sha256: sha256(document.raw),
    members: Object.freeze(members),
    // Manifest metadata cannot override the authenticated observation carried
    // by the pinned profile.  Otherwise a manifest could self-report zero
    // external calls while bypassing the profile proof.
    capability_observation: profile.capability_observation,
  });
}

export function loadMeasurementInputs({ profilePath, innerManifestPath, mediumManifestPath } = {}) {
  const profile = readJson(inputPath(profilePath, "profile JSON"), "profile JSON");
  const innerManifest = readJson(inputPath(innerManifestPath, "inner manifest"), "inner manifest");
  const mediumManifest = readJson(inputPath(mediumManifestPath, "medium manifest"), "medium manifest");
  const innerProfile = normaliseProfile(profile, "inner");
  const mediumProfile = normaliseProfile(profile, "medium");
  const inner = normaliseManifest(innerManifest, "inner", innerProfile);
  const medium = normaliseManifest(mediumManifest, "medium", mediumProfile);
  if (inner.members.length < 2) throw new Error("inner manifest must contain at least two members to prove file-level overlap");
  return Object.freeze({
    profile_document: Object.freeze({ path: profile.path, sha256: sha256(profile.raw), value: profile.value }),
    profiles: Object.freeze({ inner: innerProfile, medium: mediumProfile }),
    manifests: Object.freeze({ inner, medium }),
    profile_change: profile.value.profile_change ?? { status: "none" },
  });
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function groupAlive(pid) {
  if (!Number.isSafeInteger(pid)) return false;
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    return true;
  }
}

function signalGroup(pid, signal) {
  if (!Number.isSafeInteger(pid)) return;
  try { process.kill(-pid, signal); }
  catch (error) { if (error.code !== "ESRCH") throw error; }
}

function runChild(member) {
  const startedEpoch = Date.now();
  const startedAt = new Date(startedEpoch).toISOString();
  const stdout = [];
  const stderr = [];
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let child;
  let closed = false;
  let settled = false;
  let status = null;
  let closeSignal = null;
  let error = null;
  let interruption = null;
  let cleanupStarted = false;
  let cleanupFailed = false;
  let timer;

  return new Promise((resolvePromise) => {
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const completedEpoch = Date.now();
      resolvePromise({
        member,
        pid: Number.isSafeInteger(child?.pid) ? child.pid : null,
        started_at: startedAt,
        completed_at: new Date(completedEpoch).toISOString(),
        started_epoch_ms: startedEpoch,
        completed_epoch_ms: completedEpoch,
        duration_ms: Math.max(0, completedEpoch - startedEpoch),
        exit_code: Number.isInteger(status) ? status : null,
        signal: closeSignal ?? null,
        timed_out: interruption === "timeout",
        cancelled: false,
        cleanup: { status: cleanupFailed ? "failed" : "completed" },
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
        ...(error ? { error: { code: error.code ?? "CHILD_PROCESS", message: error.message } } : {}),
      });
    };
    const cleanUp = async () => {
      if (cleanupStarted || settled) return;
      cleanupStarted = true;
      clearTimeout(timer);
      const deadline = Date.now() + 3000;
      let sentKill = false;
      if (groupAlive(child?.pid)) {
        try { signalGroup(child.pid, "SIGTERM"); } catch (caught) { cleanupFailed = true; error ??= caught; }
      }
      while (!closed || groupAlive(child?.pid)) {
        if (Date.now() >= deadline) {
          if (!sentKill) {
            sentKill = true;
            try { signalGroup(child?.pid, "SIGKILL"); } catch (caught) { cleanupFailed = true; error ??= caught; }
          } else {
            cleanupFailed = true;
            break;
          }
        }
        await delay(10);
      }
      finish();
    };
    const interrupt = () => {
      if (settled || interruption !== null) return;
      interruption = "timeout";
      error ??= Object.assign(new Error("measurement command timed out"), { code: "ETIMEDOUT" });
      void cleanUp();
    };
    try {
      child = spawn(member.argv[0], member.argv.slice(1), {
        cwd: member.cwd,
        env: { ...process.env, ...member.env },
        detached: true,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (caught) {
      error = caught;
      closed = true;
      finish();
      return;
    }
    const collect = (target, chunk) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      const current = target === stdout ? stdoutBytes : stderrBytes;
      const remaining = Math.max(0, MAX_OUTPUT_BYTES - current);
      if (remaining > 0) {
        const kept = bytes.subarray(0, remaining);
        target.push(kept);
        if (target === stdout) stdoutBytes += kept.length;
        else stderrBytes += kept.length;
      }
      if (bytes.length > remaining) {
        error ??= Object.assign(new Error(`${target === stdout ? "stdout" : "stderr"} exceeded measurement output limit`), { code: "ENOBUFS" });
        void cleanUp();
      }
    };
    child.stdout.on("data", (chunk) => collect(stdout, chunk));
    child.stderr.on("data", (chunk) => collect(stderr, chunk));
    child.once("error", (caught) => { error ??= caught; if (closed) void cleanUp(); });
    child.once("exit", (code, signal) => { status = Number.isInteger(code) ? code : null; closeSignal = signal ?? null; });
    child.once("close", (code, signal) => {
      closed = true;
      status = Number.isInteger(code) ? code : status;
      closeSignal = signal ?? closeSignal;
      void cleanUp();
    });
    timer = setTimeout(interrupt, member.timeout_ms);
  });
}

function rawRef(outputDir, token, suffix, bytes) {
  const path = resolve(outputDir, "raw", `${token}.${suffix}`);
  writeImmutable(path, bytes);
  return { ref: path, sha256: sha256(bytes), bytes: bytes.length };
}

async function executeMember(member, outputDir, token) {
  const result = await runChild(member);
  const stdout = rawRef(outputDir, `${token}-stdout`, "stdout", result.stdout);
  const stderr = rawRef(outputDir, `${token}-stderr`, "stderr", result.stderr);
  return {
    member_id: member.id,
    file: member.file,
    argv: member.argv,
    cwd: member.cwd,
    pid: result.pid,
    started_at: result.started_at,
    completed_at: result.completed_at,
    started_epoch_ms: result.started_epoch_ms,
    completed_epoch_ms: result.completed_epoch_ms,
    duration_ms: result.duration_ms,
    exit_code: result.exit_code,
    signal: result.signal,
    timed_out: result.timed_out,
    cancelled: result.cancelled,
    cleanup: result.cleanup,
    stdout_ref: stdout.ref,
    stdout_hash: stdout.sha256,
    stdout_bytes: stdout.bytes,
    stderr_ref: stderr.ref,
    stderr_hash: stderr.sha256,
    stderr_bytes: stderr.bytes,
    ...(result.error ? { error: result.error } : {}),
  };
}

async function runCollection(manifest, profile, outputDir, label, runIndex, onStart = () => {}, onEnd = () => {}) {
  const startedEpoch = Date.now();
  const results = [];
  let next = 0;
  let active = 0;
  let actualWorkers = 0;
  const worker = async () => {
    while (next < manifest.members.length) {
      const index = next;
      next += 1;
      const member = manifest.members[index];
      active += 1;
      actualWorkers = Math.max(actualWorkers, active);
      onStart(member, active);
      try {
        results[index] = await executeMember(member, outputDir, `${label}-run${runIndex}-${member.id}-${randomUUID()}`);
      } finally {
        active -= 1;
        onEnd(member, active);
      }
    }
  };
  const workers = Array.from({ length: Math.min(profile.worker_ceiling, manifest.members.length) }, () => worker());
  await Promise.all(workers);
  const completedEpoch = Date.now();
  const overlap_observed = results.some((left, leftIndex) => results.some((right, rightIndex) => (
    leftIndex < rightIndex
      && left.started_epoch_ms < right.completed_epoch_ms
      && right.started_epoch_ms < left.completed_epoch_ms
  )));
  return {
    run_index: runIndex,
    cold_observation: runIndex === 1,
    started_at: new Date(startedEpoch).toISOString(),
    completed_at: new Date(completedEpoch).toISOString(),
    duration_ms: Math.max(0, completedEpoch - startedEpoch),
    worker_ceiling: profile.worker_ceiling,
    actual_workers: actualWorkers,
    overlap_observed,
    parallelism_scope: "file_processes",
    members: results,
  };
}

async function clearTransformCache(profile, round) {
  const configured = profile.transform_cache_paths ?? [];
  if (!Array.isArray(configured)) throw new Error(`${profile.runtime_profile} transform_cache_paths must be an array`);
  const cleared = [];
  for (const value of configured) {
    const path = inputPath(value, `${profile.runtime_profile} transform cache path`, repoRoot);
    const rel = relative(repoRoot, path).replaceAll("\\", "/");
    const knownCacheRoots = [
      ".vitest",
      ".vite",
      "node_modules/.vitest",
      "node_modules/.vite",
      "node_modules/.cache/vitest",
      "node_modules/.cache/vite",
    ];
    const isKnownCache = knownCacheRoots.some((root) => rel === root || rel.startsWith(`${root}/`));
    if (!rel || rel.startsWith("..") || isAbsolute(rel) || !isKnownCache) {
      throw new Error(`refusing to clear a path outside an explicit Vitest transform cache: ${path}`);
    }
    if (existsSync(path)) rmSync(path, { recursive: true, force: true });
    cleared.push({ path, round, status: "cleared_or_absent" });
  }
  return { status: configured.length === 0 ? "not_configured" : "cleared", paths: cleared };
}

function nearestRankP95(samples) {
  if (!Array.isArray(samples) || samples.length === 0) throw new Error("p95 requires at least one sample");
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = Math.ceil(sorted.length * 0.95);
  return sorted[Math.max(0, rank - 1)];
}

export { nearestRankP95 };

function runFacts(runs) {
  const samples_ms = runs.map((run) => run.duration_ms);
  const pids = runs.flatMap((run) => run.members?.map((member) => member.pid) ?? [run.pid]).filter(Number.isSafeInteger);
  return {
    sample_count: samples_ms.length,
    samples_ms,
    max_ms: Math.max(...samples_ms),
    p95_ms: nearestRankP95(samples_ms),
    independent_processes: new Set(pids).size === pids.length,
    all_exit_zero: runs.every((run) => (run.members ?? [run]).every((member) => member.exit_code === 0 && member.signal === null)),
    cleanup_complete: runs.every((run) => (run.members ?? [run]).every((member) => member.cleanup?.status === "completed")),
  };
}

function fileSeriesSummary(member, runs, profile) {
  const facts = runFacts(runs);
  return {
    member_id: member.id,
    file: member.file,
    threshold_ms: profile.ceiling_ms,
    ...facts,
    runs,
    result: facts.sample_count === 5 && facts.independent_processes && facts.all_exit_zero && facts.cleanup_complete && facts.max_ms <= profile.ceiling_ms ? "pass" : "fail",
  };
}

function collectionSummary(runs, profile, manifest, { requireOverlap = false } = {}) {
  const facts = runFacts(runs);
  const actual_workers = Math.max(...runs.map((run) => run.actual_workers));
  const worker_bound_ok = runs.every((run) => run.actual_workers <= profile.worker_ceiling);
  const overlap_observed = runs.some((run) => run.overlap_observed);
  const overlap_ok = !requireOverlap || (overlap_observed && actual_workers >= 2);
  return {
    threshold_ms: profile.ceiling_ms,
    worker_ceiling: profile.worker_ceiling,
    actual_workers,
    worker_bound_ok,
    overlap_observed,
    ...facts,
    runs,
    result: facts.sample_count === 5 && facts.independent_processes && facts.all_exit_zero && facts.cleanup_complete && facts.max_ms <= profile.ceiling_ms && facts.p95_ms <= profile.ceiling_ms && worker_bound_ok && overlap_ok && manifest.members.length > 0 ? "pass" : "fail",
  };
}

function validateProfileChange(value) {
  if (!object(value) || value.status === "none" || value === undefined) return { status: "none" };
  const oldProfile = value.old_profile ?? value.previous_profile;
  const newProfile = value.new_profile ?? value.current_profile;
  if (typeof oldProfile !== "string" || oldProfile.trim() === "" || typeof newProfile !== "string" || newProfile.trim() === "") {
    throw new Error("profile_change requires old_profile and new_profile");
  }
  if (oldProfile === newProfile) throw new Error("profile_change old_profile and new_profile must differ");
  if (typeof value.reason !== "string" || value.reason.trim() === "") throw new Error("profile_change reason is required");
  return { status: "changed", old_profile: oldProfile, new_profile: newProfile, reason: value.reason };
}

function toolingVersion() {
  const packagePath = resolve(repoRoot, "node_modules", "vitest", "package.json");
  try { return JSON.parse(readFileSync(packagePath, "utf8")).version ?? null; }
  catch { return null; }
}

function capabilityResult(profile, manifest) {
  const value = manifest.capability_observation ?? profile.capability_observation;
  if (!object(value)) return { status: "unavailable", counts: null, reason: "no authenticated capability observation was supplied" };
  if (value.status !== "observed") {
    return {
      status: value.status === "incomplete" ? "incomplete" : "unavailable",
      counts: value.counts ?? null,
      reason: value.reason ?? "no authenticated capability observation was supplied",
    };
  }
  const counts = value.counts;
  const valid = object(counts) && CAPABILITIES.every((capability) => Number.isSafeInteger(counts[capability]) && counts[capability] >= 0);
  if (!valid) return { status: "incomplete", counts: counts ?? null, reason: "capability observation did not cover every capability" };
  if (typeof value.source !== "string" || value.source.trim() === ""
      || typeof value.evidence_ref !== "string" || value.evidence_ref.trim() === ""
      || !SHA256_HEX_CASE_INSENSITIVE.test(value.evidence_hash)) {
    return { status: "incomplete", counts, reason: "capability observation is missing authenticated source/ref/hash" };
  }
  if (!object(value.capability_proof) || value.capability_proof.status !== "passed") {
    return { status: "incomplete", counts, reason: "capability observation has no authenticated runtime capability proof" };
  }
  const innerSafe = profile.runtime_profile !== "inner" || CAPABILITIES.every((capability) => counts[capability] === 0);
  return { ...value, status: innerSafe ? "observed" : "failed", counts, ...(innerSafe ? {} : { reason: "inner capability observation recorded a non-zero external call" }) };
}

export async function measureRuntimeProfile(options) {
  const input = {
    ...options,
    profilePath: inputPath(options?.profilePath, "profile JSON"),
    innerManifestPath: inputPath(options?.innerManifestPath, "inner manifest"),
    mediumManifestPath: inputPath(options?.mediumManifestPath, "medium manifest"),
    outputPath: inputPath(options?.outputPath, "output"),
    runs: options?.runs,
  };
  positiveInteger(input.runs, "runs");
  if (input.runs !== 5) throw new Error("runs must be exactly 5 for the S3 protocol");
  if (existsSync(input.outputPath)) throw new Error(`performance receipt already exists and cannot be reused: ${input.outputPath}`);
  const loaded = loadMeasurementInputs(input);
  const profileChange = validateProfileChange(loaded.profile_change);
  const rawDir = resolve(dirname(input.outputPath), `${basename(input.outputPath, extname(input.outputPath))}-raw`);
  const cache = { inner: [], medium: [] };
  const innerFile = {};
  const innerCollection = [];
  const mediumCollection = [];
  for (const member of loaded.manifests.inner.members) {
    const samples = [];
    for (let runIndex = 1; runIndex <= input.runs; runIndex += 1) {
      cache.inner.push(await clearTransformCache(loaded.profiles.inner, `inner-file-${member.id}-run-${runIndex}`));
      samples.push({
        ...(await executeMember(member, rawDir, `inner-file-${member.id}-run${runIndex}-${randomUUID()}`)),
        cold_observation: runIndex === 1,
      });
    }
    innerFile[member.id] = fileSeriesSummary(member, samples, loaded.profiles.inner);
  }
  for (let runIndex = 1; runIndex <= input.runs; runIndex += 1) {
    cache.inner.push(await clearTransformCache(loaded.profiles.inner, `inner-collection-run-${runIndex}`));
    innerCollection.push(await runCollection(loaded.manifests.inner, loaded.profiles.inner, rawDir, "inner-collection", runIndex));
  }
  for (let runIndex = 1; runIndex <= input.runs; runIndex += 1) {
    cache.medium.push(await clearTransformCache(loaded.profiles.medium, `medium-collection-run-${runIndex}`));
    mediumCollection.push(await runCollection(loaded.manifests.medium, loaded.profiles.medium, rawDir, "medium-collection", runIndex));
  }
  const innerFileSummaries = Object.values(innerFile);
  const innerCollectionSummary = collectionSummary(innerCollection, loaded.profiles.inner, loaded.manifests.inner, { requireOverlap: true });
  const mediumCollectionSummary = collectionSummary(mediumCollection, loaded.profiles.medium, loaded.manifests.medium);
  const capability = {
    inner: capabilityResult(loaded.profiles.inner, loaded.manifests.inner),
    medium: capabilityResult(loaded.profiles.medium, loaded.manifests.medium),
  };
  const hardFailure = innerFileSummaries.some((value) => value.result === "fail")
    || innerCollectionSummary.result === "fail"
    || mediumCollectionSummary.result === "fail"
    || capability.inner.status === "failed"
    || capability.medium.status === "failed";
  const cacheConfigured = [...cache.inner, ...cache.medium].every((value) => value.status === "cleared");
  const incomplete = capability.inner.status !== "observed"
    || capability.medium.status !== "observed"
    || toolingVersion() === null
    || loaded.profiles.inner.run_location === null
    || loaded.profiles.medium.run_location === null
    || !cacheConfigured;
  const status = hardFailure ? "failed" : incomplete ? "incomplete" : "passed";
  return {
    schema_version: "workflowhub-performance-profile.v1",
    status,
    result: status === "passed" ? "pass" : status,
    captured_at: isoNow(),
    profile_source: {
      ref: loaded.profile_document.path,
      sha256: loaded.profile_document.sha256,
      contract_module: "runtime/stage/stage-content-contracts.mjs",
      contract_export: PROFILE_SOURCE_EXPORT,
    },
    profile_change: profileChange,
    machine: { hostname: hostname(), platform: platform(), release: release(), arch: arch(), cpu_count: cpus().length },
    runtime: { node: process.version, vitest: toolingVersion() },
    cache_policy: { transform_cache: "only configured Vitest transform paths are cleared before every run", os_page_cache: "not_cleared", observations: cache },
    profiles: {
      inner: { runtime_profile: loaded.profiles.inner.runtime_profile, ceiling_ms: loaded.profiles.inner.ceiling_ms, permissions: loaded.profiles.inner.permissions, run_location: loaded.profiles.inner.run_location, worker_ceiling: loaded.profiles.inner.worker_ceiling, worker_ceiling_source: loaded.profiles.inner.worker_ceiling_source },
      medium: { runtime_profile: loaded.profiles.medium.runtime_profile, ceiling_ms: loaded.profiles.medium.ceiling_ms, permissions: loaded.profiles.medium.permissions, run_location: loaded.profiles.medium.run_location, worker_ceiling: loaded.profiles.medium.worker_ceiling, worker_ceiling_source: loaded.profiles.medium.worker_ceiling_source },
    },
    manifests: {
      inner: { ref: loaded.manifests.inner.manifest_ref, sha256: loaded.manifests.inner.manifest_sha256, members: loaded.manifests.inner.members.map(({ id, file, argv, cwd }) => ({ id, file, argv, cwd })) },
      medium: { ref: loaded.manifests.medium.manifest_ref, sha256: loaded.manifests.medium.manifest_sha256, members: loaded.manifests.medium.members.map(({ id, file, argv, cwd }) => ({ id, file, argv, cwd })) },
    },
    capability_observations: capability,
    groups: {
      inner_files: innerFileSummaries,
      inner_collection: innerCollectionSummary,
      medium_collection: mediumCollectionSummary,
    },
    limitations: [
      "Five child-process samples describe this machine and these manifest members only.",
      "The first sample of every series is the cold observation and remains in max/p95.",
      "The runner does not clear the operating-system page cache.",
      ...(incomplete ? ["Missing authenticated capability, run-location, cache, or tool-version evidence keeps the receipt incomplete."] : []),
    ],
  };
}

export function writePerformanceReceipt(outputPath, receipt) {
  const path = inputPath(outputPath, "output");
  writeImmutableJson(path, receipt);
  return path;
}

async function main() {
  let parsed;
  try {
    parsed = parseMeasurementArgs(process.argv.slice(2));
    const receipt = await measureRuntimeProfile(parsed);
    writePerformanceReceipt(parsed.outputPath, receipt);
    process.stdout.write(`${JSON.stringify({ output: parsed.outputPath, status: receipt.status, result: receipt.result })}\n`);
    process.exitCode = receipt.status === "passed" ? 0 : 1;
  } catch (error) {
    if (parsed?.outputPath && !existsSync(parsed.outputPath)) {
      try {
        writePerformanceReceipt(parsed.outputPath, {
          schema_version: "workflowhub-performance-profile.v1",
          status: "incomplete",
          result: "incomplete",
          captured_at: isoNow(),
          error: { code: error.code ?? "MEASUREMENT_FAILED", message: error.message },
          limitations: ["Measurement did not complete; any raw files already written remain for diagnosis."],
        });
      } catch (writeError) {
        console.error(`[measure-test-runtime-profile] could not preserve failure receipt: ${writeError.message}`);
      }
    }
    console.error(`[measure-test-runtime-profile] ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) await main();
