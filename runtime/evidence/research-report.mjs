import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";

import schema from "../schemas/research-report.v1.json" with { type: "json" };

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateSchema = ajv.compile(schema);
const HASH = /^[a-f0-9]{64}$/;
const TREE = /^[a-f0-9]{40}$/i;
const REVISION = /^revision-[a-f0-9]{64}$/;
const REPORT_REF = /^quality\/evidence\/research\/([a-f0-9]{64})\.json$/;
const STAGES = new Set(["make-decision", "build-spec", "build-plan"]);
const ATTEMPT_STATUSES = new Set(["ok", "usage_error", "auth_error", "http_error", "timeout", "tls_unreachable", "quota"]);

const hashBytes = (bytes) => createHash("sha256").update(bytes).digest("hex");
const errorText = (validator) => (validator.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

function assertIdentity(report, expected = {}) {
  if (expected.taskId !== undefined && report.task_id !== expected.taskId) throw new Error("research report task identity mismatch");
  if (expected.stage !== undefined && report.stage !== expected.stage) throw new Error("research report stage identity mismatch");
  if (expected.snapshotTree !== undefined && report.snapshot_tree !== expected.snapshotTree) throw new Error("research report snapshot identity mismatch");
  if (expected.materialScopeRevision !== undefined && report.material_scope_revision !== expected.materialScopeRevision) throw new Error("research report material identity mismatch");
}

function validateAttempts(report) {
  let count = 0;
  let activeElapsedMs = 0;
  const attemptsByQuestion = new Map();
  const declaredQuestionIds = new Set((report.questions ?? []).map((question) => question.question_id));
  const hasMultipleQuestions = declaredQuestionIds.size > 1;
  for (const usage of report.tool_usage) {
    if (!isObject(usage)) throw new TypeError("research tool_usage entries must be objects");
    const questionId = usage.question_id ?? (hasMultipleQuestions ? null : [...declaredQuestionIds][0] ?? "__single_question__");
    if (!questionId) throw new Error("research tool_usage must bind attempts to question_id when multiple questions are present");
    if (declaredQuestionIds.size > 0 && !declaredQuestionIds.has(questionId)) throw new Error("research tool_usage question_id is not declared");
    const attempts = usage.attempts ?? (Object.hasOwn(usage, "status") ? [usage] : []);
    const questionAttempts = attemptsByQuestion.get(questionId) ?? new Set();
    for (const attempt of attempts) {
      count += 1;
      if (!isObject(attempt) || !ATTEMPT_STATUSES.has(attempt.status)) throw new TypeError("research attempt status is invalid");
      if (attempt.attempt !== undefined && (!Number.isInteger(attempt.attempt) || attempt.attempt < 1 || attempt.attempt > 2)) throw new Error("research attempts allow at most one retry");
      if (attempt.elapsed_ms !== undefined && attempt.elapsed_ms > 30000) throw new Error("research attempt exceeded the 30 second limit");
      if (attempt.attempt === undefined) throw new Error("research attempts require an attempt sequence number");
      if (questionAttempts.has(attempt.attempt)) throw new Error("research attempts must have unique sequence numbers per question");
      questionAttempts.add(attempt.attempt);
      activeElapsedMs += attempt.elapsed_ms ?? 0;
      if (attempt.http_status === 402 && attempt.status === "quota" && !/quota|billing|payment/i.test(`${attempt.error_code ?? ""} ${attempt.message ?? ""}`)) {
        throw new Error("HTTP 402 requires explicit quota or billing evidence before using quota status");
      }
    }
    attemptsByQuestion.set(questionId, questionAttempts);
  }
  if ([...attemptsByQuestion.values()].some((attempts) => attempts.size > 2)) throw new Error("research allows at most two attempts per question");
  if (activeElapsedMs > 120000) throw new Error("research active tool budget exceeded 120 seconds");
  return count;
}

function validateCompleted(report) {
  if (!Array.isArray(report.sources) || report.sources.length < 3) throw new Error("completed research requires at least three sources");
  if (!report.sources.some((source) => source.source_tier === "primary")) throw new Error("completed research requires a primary source");
  if (!report.sources.every((source) => source.read_original === true)) throw new Error("completed research sources must record read_original=true");
  if (!Array.isArray(report.evidence) || report.evidence.length === 0) throw new Error("completed research requires evidence");
  if (!report.evidence.every((evidence) => evidence.read_original === undefined || evidence.read_original === true)) throw new Error("completed research evidence must bind original reading");
  if (!report.triangulation?.status || !report.saturation?.status || !report.saturation?.reason?.trim()) throw new Error("completed research requires triangulation and saturation facts");
}

export function validateResearchReport(report, expected = {}) {
  if (!validateSchema(report)) throw new TypeError(`research report does not match research-report.v1: ${errorText(validateSchema)}`);
  if (!STAGES.has(report.stage)) throw new TypeError("research report stage is invalid");
  if (!TREE.test(report.snapshot_tree)) throw new TypeError("research report snapshot_tree is invalid");
  if (!REVISION.test(report.material_scope_revision)) throw new TypeError("research report material_scope_revision is invalid");
  if (report.recorded_at !== undefined && !Number.isFinite(Date.parse(report.recorded_at))) {
    throw new TypeError("research report recorded_at is invalid");
  }
  assertIdentity(report, expected);
  validateAttempts(report);
  if (report.status === "completed") validateCompleted(report);
  if (report.fallback.approval_status === "approved") {
    const usedRoutes = new Set(report.fallback.used_routes);
    const provenanceRoutes = new Set(report.tool_usage.flatMap((usage) => [usage.route, ...(usage.attempts ?? []).map((attempt) => attempt.route)]).filter(Boolean));
    if (typeof report.fallback.approval_ref !== "string" || report.fallback.approval_ref.trim() === "") {
      throw new Error("approved research fallback must bind approval_ref");
    }
    if (!["web_search", "web_fetch"].every((route) => usedRoutes.has(route) && provenanceRoutes.has(route))) {
      throw new Error("approved research fallback must record web_search and web_fetch provenance");
    }
  }
  if (report.fallback.approval_status !== "approved" && report.fallback.used_routes.some((route) => ["web_search", "web_fetch"].includes(route))) {
    throw new Error("web_search/web_fetch may only be used after approved fallback");
  }
  return Object.freeze(structuredClone(report));
}

export function researchReportHash(raw) {
  if (!(typeof raw === "string" || Buffer.isBuffer(raw))) throw new TypeError("research report raw bytes are required");
  return hashBytes(raw);
}

export function researchReportRef(rawOrHash) {
  const digest = HASH.test(rawOrHash ?? "") ? rawOrHash : researchReportHash(rawOrHash);
  return `quality/evidence/research/${digest}.json`;
}

export function parseResearchReport(raw, expected = {}) {
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw), "utf8");
  let value;
  try { value = JSON.parse(bytes.toString("utf8")); }
  catch (error) { throw new Error(`research report JSON is invalid: ${error.message}`); }
  return validateResearchReport(value, expected);
}

export function readResearchReport({ read, task, ref, taskId, stage, snapshotTree, materialScopeRevision } = {}) {
  if (typeof read !== "function" && task && typeof task.readRecord === "function") read = (candidateRef) => task.readRecord(candidateRef);
  if (typeof read !== "function") throw new TypeError("research report reader requires read");
  const match = REPORT_REF.exec(ref ?? "");
  if (!match) throw new Error("research report ref must use quality/evidence/research/<sha256>.json");
  const raw = read(ref);
  const actualHash = researchReportHash(raw);
  if (actualHash !== match[1]) throw new Error("research report ref hash does not match its raw UTF-8 bytes");
  const value = parseResearchReport(raw, { taskId, stage, snapshotTree, materialScopeRevision });
  return Object.freeze({ ref, sha256: actualHash, raw, value });
}

export function researchFacts(record) {
  if (!record?.value) throw new TypeError("research record is required");
  const report = record.value;
  const questions = Array.isArray(report.questions) && report.questions.length
    ? report.questions.map((question) => question.question_id)
    : [report.question];
  const covered = report.coverage?.covered_questions ?? (report.status === "completed" ? questions : []);
  const toolAttempts = report.tool_usage.flatMap((usage) => usage.attempts
    ?? (usage.status ? [{ ...usage }] : []));
  const gaps = report.open_items.map((item) => ({
    question_id: item.question_id,
    code: item.code,
    reason: item.reason,
    next_action: item.next_action,
  }));
  return Object.freeze({
    status: report.status,
    report_ref: record.ref,
    report_sha256: record.sha256,
    required_questions: [...questions],
    covered_questions: [...covered],
    tool_attempts: toolAttempts,
    tool_attempt_count: toolAttempts.length,
    gaps,
    fallback: Object.freeze({
      approval_status: report.fallback.approval_status,
      requested_route: report.fallback.requested_route,
      used_routes: [...report.fallback.used_routes],
    }),
  });
}

/** Compatibility adapter for authenticated TaskHandle readers. */
export function readResearchReportFromTask({ task, ...input } = {}) {
  if (!task || typeof task.readRecord !== "function") throw new TypeError("research report task reader requires TaskHandle");
  return readResearchReport({ ...input, read: (ref) => task.readRecord(ref) });
}

/** Derive the only status disclosure from current authenticated report records. */
export function deriveResearchStatus(records = []) {
  if (!Array.isArray(records) || records.length === 0) {
    return Object.freeze({
      status: "unavailable",
      reason: "research_record_missing",
      report_ref: null,
      report_sha256: null,
      required_questions: [],
      covered_questions: [],
      tool_attempts: [],
      gaps: [],
      fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] },
    });
  }
  const integrityFailure = records.find((record) => record?.error);
  if (integrityFailure) {
    return Object.freeze({
      status: "unavailable",
      reason: "research_record_integrity_failure",
      report_ref: integrityFailure.ref ?? null,
      report_sha256: integrityFailure.sha256 ?? null,
      required_questions: [],
      covered_questions: [],
      tool_attempts: [],
      gaps: [],
      fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] },
    });
  }
  if (records.length > 1) {
    if (records.some((record) => !record.value?.recorded_at)) {
      return Object.freeze({ status: "unavailable", reason: "research_record_ambiguous", report_ref: null, report_sha256: null, required_questions: [], covered_questions: [], tool_attempts: [], gaps: [], fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] } });
    }
    const newest = Math.max(...records.map((record) => Date.parse(record.value.recorded_at)));
    const latest = records.filter((record) => Date.parse(record.value.recorded_at) === newest);
    if (!Number.isFinite(newest) || latest.length !== 1) {
      return Object.freeze({ status: "unavailable", reason: "research_record_ambiguous", report_ref: null, report_sha256: null, required_questions: [], covered_questions: [], tool_attempts: [], gaps: [], fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] } });
    }
    records = latest;
  }
  return researchFacts(records[0]);
}

/** Read only current, authenticated reports; stale/foreign/corrupt records are not projected. */
export function listCurrentResearchReports({ task, taskId, stage, snapshotTree, materialScopeRevision } = {}) {
  if (!task || typeof task.listCanonicalResearchReportRefs !== "function") return [];
  return task.listCanonicalResearchReportRefs().flatMap((ref) => {
    try {
      return [readResearchReportFromTask({ task, ref, taskId, stage, snapshotTree, materialScopeRevision })];
    } catch (error) {
      if (/research report (?:task|stage|snapshot|material) identity mismatch/.test(error instanceof Error ? error.message : String(error))) return [];
      return [{ ref, sha256: REPORT_REF.exec(ref)?.[1] ?? null, error: error instanceof Error ? error.message : String(error) }];
    }
  });
}

export function publishResearchReport({ publish, report, raw = null, taskId, stage, snapshotTree, materialScopeRevision, recordedAt } = {}) {
  if (typeof publish !== "function") throw new TypeError("research report publisher requires publish");
  const reportWithTimestamp = raw === null && recordedAt !== undefined
    ? { ...report, recorded_at: recordedAt }
    : report;
  const bytes = raw === null ? `${JSON.stringify(reportWithTimestamp, null, 2)}\n` : (Buffer.isBuffer(raw) ? raw : String(raw));
  const value = parseResearchReport(bytes, { taskId, stage, snapshotTree, materialScopeRevision });
  const ref = researchReportRef(bytes);
  const result = publish(ref, bytes);
  return Object.freeze({ ref, sha256: researchReportHash(bytes), value, ...(result && typeof result === "object" ? result : {}) });
}

export { REPORT_REF as RESEARCH_REPORT_REF };
