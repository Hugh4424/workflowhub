#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { closeSync, constants, fsyncSync, linkSync, openSync, readFileSync, realpathSync, unlinkSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, basename, resolve } from "node:path";

import { createSimpleReviewPacket } from "../../../skills/wh-review/scripts/simple-review-runner.mjs";

const input = process.argv[2] ? resolve(process.argv[2]) : null;
const out = process.argv[3] ? resolve(process.argv[3]) : null;
const CURRENT_MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
const REVIEW_SUBJECTS = new Set(["current-code", "current-materials"]);
const VERIFY_CODE_STRUCTURED_MATERIALS = ["changed_files", "implementation_assessment", "test_context", "open_risks"];
const VERIFY_CODE_BYTE_MATERIALS = ["implementation_diff", "browser_evidence"];
const SHA256 = /^[a-f0-9]{64}$/;
const RELATIVE_PATH = /^(?!\/|[A-Za-z]:[\\/])(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/;
// Keep host-path redaction whole for spaces and shell punctuation inside a
// path; stop only at string/markup boundaries so no suffix can leak.
const REVIEW_REPO_ROOT = realpathSync(resolve(process.env.WORKFLOWHUB_REVIEW_REPO_ROOT ?? process.cwd()));
const TRUSTED_TASK_ROOT = resolve(REVIEW_REPO_ROOT, "specs/archive/workflowhub-m16-evolution-20260831");
const TRUSTED_SPEC_PATH = resolve(TRUSTED_TASK_ROOT, "spec.md");
const reviewAttemptId = process.env.WORKFLOWHUB_REVIEW_ATTEMPT_ID ?? randomUUID();
const reviewOwner = `run-final-review-chain:${reviewAttemptId}`;
const DEFAULT_REVIEW_TIMEOUT_MS = 600_000;

function reviewTimeoutMs() {
  const value = Number(process.env.WORKFLOWHUB_REVIEW_TIMEOUT_MS);
  return Number.isSafeInteger(value) && value > 0 ? value : DEFAULT_REVIEW_TIMEOUT_MS;
}

function redactHostPaths(value) {
  if (typeof value === "string") {
    let redacted = "";
    for (let index = 0; index < value.length;) {
      const current = value[index];
      const previous = value[index - 1] ?? "";
      const unixStart = current === "/" && value[index + 1] !== "/"
        && previous !== "/" && (index === 0 || !/[A-Za-z0-9_.-]/.test(previous));
      const windowsStart = /[A-Za-z]/.test(current) && value[index + 1] === ":"
        && (value[index + 2] === "\\" || value[index + 2] === "/");
      const uncStart = current === "\\" && value[index + 1] === "\\";
      if (!unixStart && !windowsStart && !uncStart) {
        redacted += current;
        index += 1;
        continue;
      }
      const start = index;
      if (windowsStart) index += 3;
      else if (uncStart) index += 2;
      else index += 1;
      while (index < value.length && !/[\n"<>()[\]{};,]/.test(value[index])) index += 1;
      redacted += "<host-path-redacted>";
      if (start === index) index += 1;
    }
    return redacted;
  }
  if (Array.isArray(value)) return value.map(redactHostPaths);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactHostPaths(item)]));
  return value;
}

function structuredError(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const parsed = JSON.parse(value);
    const candidate = parsed?.error ?? parsed;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)
        || typeof candidate.code !== "string" || typeof candidate.message !== "string"
        || !/^[A-Z][A-Z0-9_]{1,63}$/.test(candidate.code) || candidate.message.trim() === "") return null;
    return { code: candidate.code, message: redactHostPaths(candidate.message) };
  } catch {
    return null;
  }
}

function providerExecutionError(error) {
  const stderrError = structuredError(error?.stderr);
  const stdoutError = structuredError(error?.stdout);
  const embedded = stderrError ?? stdoutError;
  const causeCode = embedded?.code ?? (typeof error?.code === "string" ? error.code : null);
  const status = Number.isInteger(error?.status) ? error.status : null;
  const signal = typeof error?.signal === "string" ? error.signal : null;
  let code = causeCode;
  let message = embedded?.message;

  // `timeout(1)` and Node's exec timeout use different shapes. Handle both,
  // but keep cancellation separate from an actual provider start failure.
  if (causeCode === "REVIEW_PROVIDER_UNAVAILABLE") {
    code = "REVIEW_NO_SEMANTIC_RESULT";
    message = "wh-review did not produce a semantic terminal result";
  } else if (causeCode === "ETIMEDOUT" || status === 124) {
    code = "REVIEW_EXECUTION_TIMEOUT";
    message = "wh-review execution exceeded its deadline";
  } else if (signal !== null || status === 137 || status === 143) {
    code = status === 137 && signal === null ? "REVIEW_EXECUTION_INTERRUPTED" : "REVIEW_CANCELLED";
    message = status === 137 && signal === null
      ? "wh-review execution was interrupted before a terminal result"
      : "wh-review execution was cancelled before a terminal result";
  } else if (causeCode === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
    code = "REVIEW_PROVIDER_OUTPUT_INVALID";
    message = "wh-review output exceeded the bounded result buffer";
  } else if (status === null && !embedded) {
    code = "REVIEW_BROKER_START_FAILED";
    message = "wh-review broker process could not be started";
  } else if (!code || code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
    code = "REVIEW_BROKER_EXIT_NONZERO";
    message = "wh-review broker exited without a terminal result";
  }

  const details = {
    // Never collapse broker, transport, timeout, cancellation, protocol, or
    // material failures into REVIEW_PROVIDER_UNAVAILABLE. That label is only
    // valid when the provider route itself was proven unavailable.
    code,
    message: message ?? "wh-review broker exited without a terminal result",
    cause_code: causeCode,
    exit_status: status,
    signal,
  };
  for (const field of ["stderr", "stdout"]) {
    if (typeof error?.[field] === "string" && error[field].trim() !== "") {
      details[`${field}_preview`] = redactHostPaths(error[field].slice(-2000));
    }
  }
  return details;
}

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function receiptIdentity(materialId, request, publicResult = null, error = null) {
  const providerRuntimeIdentity = publicResult?.provider_results ?? request?.provider_runtime_identity ?? request?.host_provider ?? null;
  const idempotencyKey = hash(Buffer.from(JSON.stringify({
    material_sha256: materialId,
    request,
    public_result: publicResult,
    provider_runtime_identity: providerRuntimeIdentity,
    error,
  }), "utf8"));
  return { attempt_id: reviewAttemptId, owner: reviewOwner, idempotency_key: idempotencyKey };
}

function materialPresent(value) {
  if (Buffer.isBuffer(value)) return value.length > 0;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && typeof value === "object" && Object.keys(value).length > 0;
}

function contentBytes(value) {
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") return Buffer.from(value, "utf8");
  return null;
}

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validRelativePath(value) {
  return typeof value === "string" && RELATIVE_PATH.test(value);
}

function actualBytes(path) {
  if (!validRelativePath(path)) return null;
  const absolute = resolve(REVIEW_REPO_ROOT, path);
  const rootPrefix = `${REVIEW_REPO_ROOT}${process.platform === "win32" ? "\\" : "/"}`;
  if (absolute !== REVIEW_REPO_ROOT && !absolute.startsWith(rootPrefix)) return null;
  try {
    const real = realpathSync(absolute);
    if (real !== REVIEW_REPO_ROOT && !real.startsWith(rootPrefix)) return null;
    return readFileSync(real);
  } catch { return null; }
}

function validateCurrentCodeMaterials(materials) {
  if (!Array.isArray(materials.changed_files)
      || materials.changed_files.length === 0
      || new Set(materials.changed_files).size !== materials.changed_files.length
      || materials.changed_files.some((path) => !validRelativePath(path))) {
    return "changed_files must be a unique list of relative repository paths";
  }
  const assessment = materials.implementation_assessment;
  if (!object(assessment) || !Array.isArray(assessment.reviewed_files) || assessment.reviewed_files.length === 0) {
    return "implementation_assessment.reviewed_files must bind current implementation files";
  }
  const reviewed = new Map();
  for (const entry of assessment.reviewed_files) {
    if (!object(entry) || !validRelativePath(entry.path) || reviewed.has(entry.path)
        || !Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || !SHA256.test(entry.sha256 ?? "")
        || !new Set(["changed", "unchanged"]).has(entry.state)) {
      return "implementation_assessment.reviewed_files contains an invalid file binding";
    }
    reviewed.set(entry.path, entry);
  }
  const missingChanged = materials.changed_files.filter((path) => !reviewed.has(path));
  if (missingChanged.length > 0) return `implementation assessment is missing changed file bindings: ${missingChanged.join(", ")}`;
  const sources = Array.isArray(assessment.implementation_sources) ? assessment.implementation_sources : [];
  if (sources.length === 0) return "implementation_assessment.implementation_sources must carry current implementation bytes";
  const changedPaths = new Set(materials.changed_files);
  if (sources.length !== changedPaths.size || sources.some((entry) => !object(entry) || !changedPaths.has(entry.path))) {
    return "implementation_assessment.implementation_sources must exactly cover changed_files";
  }
  const sourcePaths = new Set();
  for (const entry of sources) {
    if (!object(entry) || !validRelativePath(entry.path) || sourcePaths.has(entry.path)
        || !Number.isSafeInteger(entry.bytes) || entry.bytes <= 0 || !SHA256.test(entry.sha256 ?? "")
        || !materialPresent(entry.content) || !reviewed.has(entry.path)) return "implementation_assessment.implementation_sources contains an invalid or unbound source";
    const sourceBytes = contentBytes(entry.content);
    if (!sourceBytes || hash(sourceBytes) !== entry.sha256) return `implementation source bytes are missing or hash-mismatched for ${entry.path}`;
    const current = actualBytes(entry.path);
    if (!current || current.length !== entry.bytes || hash(current) !== entry.sha256
        || !sourceBytes.equals(current)) {
      return `implementation source is not bound to current repository bytes for ${entry.path}`;
    }
    sourcePaths.add(entry.path);
  }
  const testContext = materials.test_context;
  if (!object(testContext) || !Array.isArray(testContext.test_files) || testContext.test_files.length === 0
      || !Array.isArray(testContext.commands) || testContext.commands.length === 0
      || testContext.commands.some((command) => typeof command !== "string" || command.trim() === "")
      || !Array.isArray(testContext.results) || testContext.results.length === 0) {
    return "test_context must include test_files, commands, and results";
  }
  const testPaths = new Set();
  for (const entry of testContext.test_files) {
    const testPath = typeof entry === "string" ? entry : entry?.path;
    if (!validRelativePath(testPath) || testPaths.has(testPath)) return "test_context.test_files contains an invalid or duplicate path";
    const current = actualBytes(testPath);
    if (!current) return `test evidence file is unavailable: ${testPath}`;
    if (typeof entry !== "object" || !Number.isSafeInteger(entry.bytes) || entry.bytes !== current.length
        || !SHA256.test(entry.sha256 ?? "") || entry.sha256 !== hash(current)) {
      return `test evidence file is not bound to current repository bytes: ${testPath}`;
    }
    testPaths.add(testPath);
  }
  for (const result of testContext.results) {
    const countFields = ["total_tests", "passed_tests", "failed_tests", "skipped_tests"];
    if (!object(result) || countFields.some((field) => result[field] !== undefined
      && (!Number.isSafeInteger(result[field]) || result[field] < 0))) {
      return "test_context.results contains invalid non-negative test counts";
    }
    const hasCounts = countFields.some((field) => result[field] !== undefined);
    if (hasCounts && countFields.some((field) => result[field] === undefined)) {
      return "test_context.results must provide all test counts together";
    }
    if (hasCounts && result.total_tests !== result.passed_tests + result.failed_tests + result.skipped_tests) {
      return "test_context.results test counts do not add up to total_tests";
    }
    if (!object(result) || typeof result.scope !== "string" || result.scope.trim() === ""
        || !["passed", "failed", "incomplete", "unavailable"].includes(result.status)
        || (result.status === "passed" && result.failed_tests !== undefined && result.failed_tests !== 0)
        || (result.exit_code !== undefined && (!Number.isSafeInteger(result.exit_code) || result.exit_code < 0))) {
      return "test_context.results contains an invalid test receipt";
    }
    if (result.test_files !== undefined && (!Array.isArray(result.test_files)
        || result.test_files.some((testPath) => !testPaths.has(testPath)))) {
      return "test_context.results references an unbound test file";
    }
  }
  const risks = materials.open_risks;
  if (!object(risks) || !new Set(["complete", "incomplete", "unknown", "unavailable"]).has(risks.status)
      || !Array.isArray(risks.risks)) return "open_risks must include a truthful status and risks list";
  const diff = materials.implementation_diff;
  if (!object(diff) || diff.format !== "git-diff.v1" || !materialPresent(diff.content) || !SHA256.test(diff.sha256 ?? "")
      || hash(Buffer.from(String(diff.content), "utf8")) !== diff.sha256
      || !Array.isArray(diff.files) || new Set(diff.files).size !== diff.files.length
      || diff.files.some((path) => !validRelativePath(path))
      || diff.files.length !== materials.changed_files.length
      || diff.files.some((path) => !materials.changed_files.includes(path))
      || materials.changed_files.some((path) => !String(diff.content).includes(`diff --git a/${path} b/${path}`))) {
    return "implementation_diff must bind current changed_files and carry content with its SHA-256";
  }
  const browser = materials.browser_evidence;
  const browserStatus = browser?.manifest?.status;
  const browserTerminal = new Set(["passed", "qa_failed", "unavailable", "incomplete"]);
  const browserScreenshots = Array.isArray(browser?.screenshots) ? browser.screenshots : [];
  const browserHasFailureReason = typeof browser?.manifest?.reason === "string"
    || typeof browser?.manifest?.failure_reason === "string"
    || object(browser?.manifest?.error);
  const browserManifest = browser?.manifest;
  const requiredBrowserChecks = [
    "open", "evolution_tab", "content", "no_page_errors", "no_runtime_requests",
    "no_horizontal_overflow", "keyboard_accessible_and_expand_sync", "viewport_390x844", "viewport_1280x800",
  ];
  const browserViewports = Array.isArray(browserManifest?.viewports) ? browserManifest.viewports : [];
  const browserEvidence = Array.isArray(browserManifest?.evidence) ? browserManifest.evidence : [];
  const screenshotBindings = browserScreenshots.map((entry) => ({ ref: entry?.path, sha256: entry?.sha256 }));
  const browserPassedContract = browserStatus === "passed"
    && browserManifest?.schema_version === "browser-qa-evidence.v1"
    && typeof browserManifest.engine === "string" && browserManifest.engine.trim() !== ""
    && typeof browserManifest.login_reused === "boolean"
    && browserManifest.cleanup === "complete"
    && object(browserManifest.material_identity)
    && ["page_sha256", "data_sha256", "move_map_sha256", "fixture_sha256"].every((key) => SHA256.test(browserManifest.material_identity[key] ?? ""))
    && object(browserManifest.checks)
    && requiredBrowserChecks.every((key) => browserManifest.checks[key] === true)
    && browserViewports.length === 2
    && browserViewports.every((entry) => object(entry) && Number.isSafeInteger(entry.width) && Number.isSafeInteger(entry.height)
      && validRelativePath(entry.evidence_ref) && SHA256.test(entry.snapshot_sha256 ?? ""))
    && browserViewports.some((entry) => entry.width === 390 && entry.height === 844)
    && browserViewports.some((entry) => entry.width === 1280 && entry.height === 800)
    && browserEvidence.length === browserScreenshots.length
    && browserEvidence.every((entry) => object(entry) && screenshotBindings.some((screenshot) => screenshot.ref === entry.ref && screenshot.sha256 === entry.sha256));
  if (!object(browser) || !object(browser.manifest) || !browserTerminal.has(browserStatus)
      || !Array.isArray(browser.screenshots)
      || (browserStatus === "passed" && (!browserPassedContract || browserScreenshots.length === 0))
      || (browserStatus !== "passed" && !browserHasFailureReason)
      || browser.screenshots.some((entry) => {
        if (!object(entry) || !validRelativePath(entry.path) || !Number.isSafeInteger(entry.bytes) || entry.bytes <= 0 || !SHA256.test(entry.sha256 ?? "")) return true;
        const current = actualBytes(entry.path);
        return !current || current.length !== entry.bytes || hash(current) !== entry.sha256;
      })) {
    return "browser_evidence must bind a manifest and screenshot byte hashes";
  }
  return null;
}

function readCurrentMaterials() {
  // This fixture is intentionally bound to the authenticated M16 task. A
  // caller cannot substitute another task, an external copy, or a symlink to
  // the real spec and thereby make its four-material identity look current.
  if (!input || basename(input) !== "spec.md" || resolve(input) !== TRUSTED_SPEC_PATH) {
    return { error: { code: "REVIEW_MATERIAL_INVALID", message: "current review material must be the task spec.md" } };
  }
  let taskRoot;
  try {
    const specReal = realpathSync(input);
    const trustedReal = realpathSync(TRUSTED_SPEC_PATH);
    if (specReal !== trustedReal || dirname(specReal) !== realpathSync(TRUSTED_TASK_ROOT)) {
      return { error: { code: "REVIEW_MATERIAL_INVALID", message: "current review material is outside the authenticated task root" } };
    }
    taskRoot = realpathSync(TRUSTED_TASK_ROOT);
  } catch {
    return { error: { code: "REVIEW_MATERIAL_INVALID", message: "current review material is unavailable" } };
  }
  const materials = {};
  const manifest = [];
  for (const name of CURRENT_MATERIALS) {
    try {
      const bytes = readFileSync(resolve(taskRoot, name));
      const content = bytes.toString("utf8");
      materials[name] = content;
      manifest.push({ path: name, bytes: bytes.length, sha256: hash(bytes) });
    } catch {
      return { error: { code: "REVIEW_MATERIAL_INVALID", message: "one or more current review materials are unavailable" } };
    }
  }
  return {
    materials,
    manifest,
    materialId: hash(Buffer.from(JSON.stringify(manifest), "utf8")),
  };
}

function outputWriteError(error) {
  const causeCode = typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,63}$/.test(error.code)
    ? error.code : null;
  return {
    code: "REVIEW_OUTPUT_WRITE_FAILED",
    message: "review output could not be published",
    ...(causeCode ? { cause_code: causeCode } : {}),
  };
}

function writeResultUnsafe(result) {
  mkdirSync(dirname(out), { recursive: true });
  const safeResult = redactHostPaths(result);
  const raw = `${JSON.stringify(safeResult, null, 2)}\n`;
  try {
    const existing = readFileSync(out, "utf8");
    try {
      const existingValue = JSON.parse(existing);
      if (existing === raw && existingValue?.idempotency_key === safeResult.idempotency_key) {
        console.log(JSON.stringify(existingValue));
        return;
      }
    } catch { /* fall through to immutable-byte conflict */ }
    if (existing !== raw) {
      // Immutable review facts are create-only. Keep the previous bytes and
      // report a write conflict to the caller; never truncate or replace it.
      process.exitCode = 32;
      console.log(JSON.stringify({ ...safeResult, error: { code: "REVIEW_OUTPUT_EXISTS", message: "review output already exists with different bytes" } }));
      return;
    }
    console.log(JSON.stringify(safeResult));
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const temporary = `${out}.tmp-${process.pid}-${Date.now()}`;
  let fd;
  try {
    fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    writeFileSync(fd, raw, "utf8");
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    // Hard-link publication is create-only on the same filesystem: an
    // existing receipt is never replaced by a retry or a partial write.
    try {
      linkSync(temporary, out);
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      try {
        const existing = readFileSync(out, "utf8");
        const existingValue = JSON.parse(existing);
        if (existing === raw && existingValue?.idempotency_key === safeResult.idempotency_key) {
          console.log(JSON.stringify(existingValue));
          return;
        }
      } catch { /* the competing writer may still be publishing */ }
      process.exitCode = 32;
      console.log(JSON.stringify({ ...safeResult, error: { code: "REVIEW_OUTPUT_EXISTS", message: "review output already exists with different bytes" } }));
      return;
    }
    unlinkSync(temporary);
    try {
      const parent = openSync(dirname(out), constants.O_RDONLY);
      try { fsyncSync(parent); } finally { closeSync(parent); }
    } catch (error) {
      process.exitCode = 32;
      console.log(JSON.stringify({ ...safeResult, error: { code: "REVIEW_OUTPUT_DURABILITY_UNKNOWN", message: "review output was published but directory durability could not be confirmed" } }));
      return;
    }
  } finally {
    if (fd !== undefined) closeSync(fd);
    try { unlinkSync(temporary); } catch (error) { if (error?.code !== "ENOENT") throw error; }
  }
  console.log(JSON.stringify(safeResult));
}

function writeResult(result) {
  try {
    return writeResultUnsafe(result);
  } catch (error) {
    // Publication failures must never escape as a raw filesystem error: the
    // caller still receives a structured, path-free failure classification.
    process.exitCode = 32;
    console.log(JSON.stringify({
      ...redactHostPaths(result),
      status: "unavailable",
      findings: [],
      error: outputWriteError(error),
    }));
    return null;
  }
}

function unavailable(error, materialId) {
  writeResult({
    schema_version: "workflowhub-review-chain.v1",
    status: "unavailable",
    findings: [],
    material_sha256: materialId,
    provider: "wh-review",
    ...receiptIdentity(materialId, null, null, error),
    error,
  });
  process.exitCode = 31;
}

function invalid(error, materialId, publicResult = undefined) {
  writeResult({
    schema_version: "workflowhub-review-chain.v1",
    status: "unavailable",
    findings: [],
    material_sha256: materialId,
    provider: "wh-review",
    ...receiptIdentity(materialId, null, publicResult ?? null, error),
    error,
    ...(publicResult === undefined ? {} : { public_result: publicResult }),
  });
  process.exitCode = 32;
}

function requestValidation(request, current) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    return { code: "REVIEW_REQUEST_INVALID", message: "review request must be a JSON object" };
  }
  if (typeof request.stage !== "string" || request.stage.trim() === "") {
    return { code: "REVIEW_REQUEST_INVALID", message: "review request stage is required" };
  }
  if (typeof (request.host_provider ?? request.hostProvider) !== "string" || (request.host_provider ?? request.hostProvider).trim() === "") {
    return { code: "REVIEW_REQUEST_INVALID", message: "review request host_provider is required" };
  }
  const materials = request.materials;
  const keys = materials && typeof materials === "object" && !Array.isArray(materials) ? Object.keys(materials).sort() : [];
  const subject = request.review_subject ?? request.reviewSubject ?? null;
  // T010 may carry a material-only advisory, but it must not masquerade as
  // verify-code. A current-code request has to carry the four standard
  // verify-code facts plus the actual implementation diff and current browser
  // evidence; a four-material request is explicitly routed to build-plan.
  const requiredKeys = subject === "current-code"
    ? [...CURRENT_MATERIALS, ...VERIFY_CODE_STRUCTURED_MATERIALS, ...VERIFY_CODE_BYTE_MATERIALS]
    : CURRENT_MATERIALS;
  if (JSON.stringify(keys) !== JSON.stringify([...new Set(requiredKeys)].sort())) {
    return {
      code: subject === "current-code" ? "REVIEW_MATERIAL_INCOMPLETE" : "REVIEW_MATERIAL_IDENTITY_MISMATCH",
      message: subject === "current-code"
        ? "verify-code review requires current four materials plus implementation/test/browser material bytes"
        : "review request must contain the complete current four-material set",
    };
  }
  for (const name of CURRENT_MATERIALS) {
    if (typeof materials[name] !== "string" || materials[name] !== current.materials[name]) {
      return { code: "REVIEW_MATERIAL_IDENTITY_MISMATCH", message: "review request materials do not match the current task materials" };
    }
  }
  if (!REVIEW_SUBJECTS.has(subject)) {
    return { code: "REVIEW_SCOPE_MISMATCH", message: "review_subject must be current-code or current-materials" };
  }
  if (subject === "current-code") {
    if (request.stage !== "verify-code") {
      return { code: "REVIEW_SCOPE_MISMATCH", message: "current-code review must use stage verify-code" };
    }
    const missingStructured = VERIFY_CODE_STRUCTURED_MATERIALS.filter((name) => !materialPresent(materials[name]));
    const missingBytes = VERIFY_CODE_BYTE_MATERIALS.filter((name) => !materialPresent(materials[name]));
    const semanticError = missingStructured.length === 0 && missingBytes.length === 0 ? validateCurrentCodeMaterials(materials) : null;
    if (missingStructured.length > 0 || missingBytes.length > 0 || semanticError !== null) {
      const missing = [...new Set([...missingStructured, ...missingBytes])];
      return {
        code: "REVIEW_MATERIAL_INCOMPLETE",
        message: semanticError ?? `verify-code review is missing current implementation/test/browser material bytes: ${missing.join(", ")}`,
      };
    }
  } else if (request.stage !== "build-plan") {
    return { code: "REVIEW_SCOPE_MISMATCH", message: "current-materials review must use the build-plan material-review surface" };
  }
  let packet;
  try {
    packet = createSimpleReviewPacket(request);
  } catch {
    return { code: "REVIEW_REQUEST_INVALID", message: "review request packet is invalid" };
  }
  if (request.current_material_id !== undefined && request.current_material_id !== current.materialId) {
    return { code: "REVIEW_MATERIAL_IDENTITY_MISMATCH", message: "review request current material identity is stale" };
  }
  if (request.material_id !== undefined && request.material_id !== current.materialId && request.material_id !== packet.material_id) {
    return { code: "REVIEW_MATERIAL_IDENTITY_MISMATCH", message: "review request material_id is stale" };
  }
  return null;
}

function revalidateAfterProvider(requestPath, initialRequestBytes, expectedMaterialId) {
  const latest = readCurrentMaterials();
  if (latest.error || latest.materialId !== expectedMaterialId) {
    return { code: "REVIEW_MATERIAL_DRIFT", message: "review materials changed while the provider was running" };
  }
  let latestBytes;
  let latestRequest;
  try {
    latestBytes = readFileSync(resolve(requestPath), "utf8");
    latestRequest = JSON.parse(latestBytes);
  } catch {
    return { code: "REVIEW_REQUEST_DRIFT", message: "review request changed or became invalid while the provider was running" };
  }
  if (latestBytes !== initialRequestBytes) {
    return { code: "REVIEW_REQUEST_DRIFT", message: "review request changed while the provider was running" };
  }
  const validationError = requestValidation(latestRequest, latest);
  if (validationError) {
    return { code: "REVIEW_REQUEST_DRIFT", message: "review request is no longer valid after provider execution", cause_code: validationError.code };
  }
  return null;
}

function resultValidation(publicResult, request, requestPacket) {
  if (!publicResult || typeof publicResult !== "object" || Array.isArray(publicResult)) {
    return { code: "REVIEW_RESULT_INVALID", message: "wh-review public result is not an object" };
  }
  if (publicResult.material_id !== requestPacket.material_id
      || publicResult.stage !== request.stage
      || (publicResult.review_track ?? null) !== (request.review_track ?? request.reviewTrack ?? null)
      || (publicResult.review_kind ?? null) !== (request.review_kind ?? request.reviewKind ?? null)) {
    return { code: "REVIEW_RESULT_IDENTITY_MISMATCH", message: "wh-review result is not bound to the current review request" };
  }
  const findings = publicResult.findings ?? publicResult.result?.findings;
  if (!Array.isArray(findings)) return { code: "REVIEW_RESULT_INVALID", message: "wh-review public result has no findings array" };
  const findingAnchorError = validateFindingAnchors(findings, requestPacket);
  if (findingAnchorError) return findingAnchorError;
  const providerStatus = publicResult.status ?? publicResult.result?.status;
  const providers = publicResult.provider_results ?? publicResult.result?.provider_results;
  if (providers !== undefined) {
    if (!Array.isArray(providers) || (providers.length === 0 && ["available", "completed", "clean"].includes(providerStatus))) {
      return { code: "REVIEW_RESULT_INVALID", message: "wh-review provider results are missing" };
    }
    const selection = publicResult.provider_selection ?? publicResult.result?.provider_selection ?? null;
    const selected = selection?.providers;
    const selectedSet = selected === undefined ? null : new Set(selected);
    if (selected !== undefined && (!Array.isArray(selected) || selected.length === 0
        || selected.some((provider) => typeof provider !== "string" || provider.trim() === "")
        || selectedSet.size !== selected.length)) {
      return { code: "REVIEW_RESULT_INVALID", message: "wh-review provider selection is invalid" };
    }
    const expectedIdentities = selection?.provider_identities ?? selection?.providerIdentities ?? null;
    const seen = new Set();
    for (const item of providers) {
      const provider = item?.provider ?? item?.identity?.provider;
      const identity = item?.identity;
      if (typeof provider !== "string" || provider.trim() === "" || seen.has(provider)
          || (selectedSet && !selectedSet.has(provider))
          || !identity || typeof identity !== "object" || identity.provider !== provider) {
        return { code: "REVIEW_RESULT_INVALID", message: "wh-review provider result is not uniquely bound to a selected identity" };
      }
      const expected = expectedIdentities && typeof expectedIdentities === "object" ? expectedIdentities[provider] : null;
      if (expected && (identity.config_id !== expected.config_id || identity.source_id !== expected.source_id)) {
        return { code: "REVIEW_RESULT_INVALID", message: "wh-review provider identity does not match trusted selection" };
      }
      if (item.status === "completed" && item.error === null) {
        const anchors = item.evidence_anchor_valid;
        const providerFindings = findings.filter((finding) => finding?.provider === provider);
        if (!Array.isArray(anchors) || anchors.length !== providerFindings.length || anchors.some((valid) => valid !== true)) {
          return { code: "REVIEW_RESULT_INVALID", message: "semantic provider result lacks validated evidence anchors" };
        }
      }
      seen.add(provider);
    }
    if (selectedSet && [...selectedSet].some((provider) => !seen.has(provider))) {
      return { code: "REVIEW_RESULT_INVALID", message: "wh-review omitted a selected provider result" };
    }
  }
  if (["available", "completed", "clean"].includes(providerStatus)) {
    const minimum = publicResult.minimum_heterologous ?? publicResult.result?.minimum_heterologous;
    const runtimeId = publicResult.runtime_id ?? publicResult.result?.runtime_id;
    const semanticCount = Array.isArray(providers)
      ? providers.filter((item) => item?.status === "completed" && item?.error === null).length : 0;
    if (!Array.isArray(providers) || providers.length === 0
        || !Number.isSafeInteger(minimum) || minimum < 1 || semanticCount < minimum
        || typeof runtimeId !== "string" || runtimeId.trim() === ""
        || !["completed", "partial"].includes(publicResult.outcome ?? publicResult.result?.outcome)) {
      return { code: "REVIEW_RESULT_INVALID", message: "wh-review clean result lacks a validated semantic provider result" };
    }
  }
  return null;
}

const RESULT_ERROR_CODES = new Map([
  ["OUTPUT_INVALID", "REVIEW_PROVIDER_OUTPUT_INVALID"],
  ["PROVIDER_OUTPUT_INVALID", "REVIEW_PROVIDER_OUTPUT_INVALID"],
  ["PROCESS_TIMEOUT", "REVIEW_EXECUTION_TIMEOUT"],
  ["TIMEOUT", "REVIEW_EXECUTION_TIMEOUT"],
  ["PROCESS_CANCELLED", "REVIEW_CANCELLED"],
  ["CANCELLED", "REVIEW_CANCELLED"],
  ["PROCESS_START_FAILED", "REVIEW_BROKER_START_FAILED"],
  ["BROKER_SPAWN_FAILED", "REVIEW_BROKER_START_FAILED"],
  ["BROKER_EXIT_NONZERO", "REVIEW_BROKER_EXIT_NONZERO"],
]);

function normalizeResultError(error) {
  const code = typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,63}$/.test(error.code)
    ? error.code : null;
  const normalized = code === "REVIEW_PROVIDER_UNAVAILABLE" ? "REVIEW_NO_SEMANTIC_RESULT" : (RESULT_ERROR_CODES.get(code) ?? code);
  const details = {
    code: normalized ?? "REVIEW_NO_SEMANTIC_RESULT",
    message: redactHostPaths(typeof error?.message === "string" && error.message.trim() !== ""
      ? error.message : "wh-review did not produce a semantic terminal result"),
  };
  if (normalized !== null && normalized !== code) details.cause_code = code;
  return details;
}

function publicResultError(publicResult) {
  if (publicResult?.error && typeof publicResult.error === "object") return normalizeResultError(publicResult.error);
  const providerErrors = (Array.isArray(publicResult?.provider_results) ? publicResult.provider_results : [])
    .map((item) => item?.error)
    .filter((error) => error && typeof error === "object");
  if (providerErrors.length > 0) return normalizeResultError(providerErrors[0]);
  return normalizeResultError(null);
}

function packetMaterialPath(entry, index) {
  const stem = String(entry?.key ?? "").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^\.+/, "") || `material_${index + 1}`;
  const extension = entry?.value_kind === "json" ? ".json" : ".md";
  return `materials/${String(index + 1).padStart(2, "0")}-${stem}${extension}`;
}

function validateFindingAnchors(findings, requestPacket) {
  const materials = new Map((requestPacket?.materials ?? []).map((entry, index) => {
    try { return [packetMaterialPath(entry, index), Buffer.from(entry.content_base64, "base64")]; }
    catch { return [packetMaterialPath(entry, index), null]; }
  }));
  for (const finding of findings) {
    if (!object(finding) || !validRelativePath(finding.path)) {
      return { code: "REVIEW_RESULT_INVALID", message: "review finding path is not a safe bundle-relative path" };
    }
    const content = materials.get(finding.path);
    if (!content) return { code: "REVIEW_RESULT_INVALID", message: "review finding path is not present in the submitted bundle" };
    if (finding.line !== undefined) {
      if (!Number.isSafeInteger(finding.line) || finding.line < 1) {
        return { code: "REVIEW_RESULT_INVALID", message: "review finding line is invalid" };
      }
      const lines = content.length === 0 ? 0 : content.toString("utf8").split(/\r?\n/).length;
      if (finding.line > lines) return { code: "REVIEW_RESULT_INVALID", message: "review finding line is outside the submitted bundle" };
    }
  }
  return null;
}

const current = readCurrentMaterials();
const materialId = current.materialId ?? null;
const requestPath = process.env.WORKFLOWHUB_WH_REVIEW_REQUEST;
const reviewCliOverride = process.env.WORKFLOWHUB_WH_REVIEW_CLI;
const reviewCliTestMode = process.env.WORKFLOWHUB_REVIEW_TEST_MODE === "1";
const reviewCliPath = reviewCliOverride && reviewCliTestMode
  ? resolve(reviewCliOverride)
  : resolve(REVIEW_REPO_ROOT, "skills/wh-review/scripts/wh-review-cli.mjs");
const reviewCliError = reviewCliOverride && !reviewCliTestMode
  ? { code: "REVIEW_CLI_OVERRIDE_FORBIDDEN", message: "review CLI override is restricted to explicit test mode" }
  : null;

if (!out) {
  console.log(JSON.stringify({
    schema_version: "workflowhub-review-chain.v1",
    status: "unavailable",
    findings: [],
    material_sha256: materialId,
    provider: "wh-review",
    error: { code: "REVIEW_OUTPUT_PATH_REQUIRED", message: "an explicit task-owned review output path is required" },
  }));
  process.exitCode = 32;
} else if (current.error) {
  invalid(current.error, materialId);
} else if (reviewCliError) {
  invalid(reviewCliError, materialId);
} else if (!requestPath) {
  unavailable({ code: "REVIEW_REQUEST_MISSING", message: "WORKFLOWHUB_WH_REVIEW_REQUEST is required" }, materialId);
} else {
  let request;
  let requestBytes = null;
  let requestError;
  try {
    requestBytes = readFileSync(resolve(requestPath), "utf8");
    try {
      request = JSON.parse(requestBytes);
    } catch {
      requestError = { code: "REVIEW_REQUEST_INVALID", message: "review request JSON is invalid" };
    }
  } catch {
    requestError = { code: "REVIEW_REQUEST_INVALID", message: "review request file is unavailable" };
  }

  const requestValidationError = requestError ?? requestValidation(request, current);
  if (requestValidationError) {
    invalid(requestValidationError, materialId);
  } else {
    const requestPacket = createSimpleReviewPacket(request);
    let publicResult;
    let providerError;
    let providerOutput;
    try {
      providerOutput = execFileSync(
        process.execPath,
        [reviewCliPath, "run", resolve(requestPath)],
        { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: reviewTimeoutMs() },
      );
    } catch (error) {
      providerError = providerExecutionError(error);
    }

    if (providerError) {
      unavailable(providerError, materialId);
    } else {
      const driftError = revalidateAfterProvider(requestPath, requestBytes, materialId);
      if (driftError) {
        invalid(driftError, materialId);
      } else {
        let parseError;
        try {
          publicResult = JSON.parse(providerOutput);
        } catch (error) {
          parseError = {
            code: "REVIEW_RESULT_INVALID",
            message: "wh-review provider returned invalid JSON",
            parse_error: typeof error?.message === "string" ? redactHostPaths(error.message) : null,
          };
        }
        if (parseError) {
          invalid(parseError, materialId);
        } else {
          const publicResultValidationError = resultValidation(publicResult, request, requestPacket);
          const safePublicResult = redactHostPaths(publicResult);
          if (publicResultValidationError) {
            invalid(publicResultValidationError, materialId, safePublicResult);
          } else {
            const findings = publicResult.findings ?? publicResult.result?.findings;
            const providerStatus = publicResult.status ?? publicResult.result?.status;
            const reviewMetadata = {
              review_subject: request.review_subject ?? request.reviewSubject,
              current_material_sha256: materialId,
              review_material_sha256: requestPacket.material_id,
              ...receiptIdentity(materialId, request, safePublicResult),
            };
            if (["unavailable", "partial", "failed", "timeout", "cancelled", "blocked"].includes(providerStatus)
                || publicResult.outcome === "unavailable" || publicResult.result?.outcome === "unavailable") {
              writeResult({ schema_version: "workflowhub-review-chain.v1", status: "unavailable", findings, material_sha256: materialId, provider: "wh-review", ...reviewMetadata, error: publicResultError(publicResult), public_result: safePublicResult });
              process.exitCode = 31;
            } else if (!["available", "completed", "clean"].includes(providerStatus)) {
              invalid({ code: "REVIEW_RESULT_INVALID", message: "wh-review public result has an unsupported status" }, materialId, safePublicResult);
            } else if (findings.length > 0) {
              writeResult({ schema_version: "workflowhub-review-chain.v1", status: "findings", findings, material_sha256: materialId, provider: "wh-review", ...reviewMetadata, public_result: safePublicResult });
              process.exitCode = 32;
            } else {
              writeResult({ schema_version: "workflowhub-review-chain.v1", status: "clean", findings, material_sha256: materialId, provider: "wh-review", ...reviewMetadata, public_result: safePublicResult });
            }
          }
        }
      }
    }
  }
}
