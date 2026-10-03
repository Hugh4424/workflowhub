import { lstatSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute } from "node:path";
import { appendRecord } from "../interface/safe-write.mjs";

const REPORT_REF = /^quality\/evidence\/research\/([A-Za-z0-9-]+)\.json$/;
const STAGES = new Set(["make-decision", "build-spec", "build-plan"]);
const ATTEMPT_STATUSES = new Set(["ok", "usage_error", "auth_error", "http_error", "timeout", "tls_unreachable", "quota"]);

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

function assertIdentity(report, expected = {}) {
  if (expected.taskId !== undefined && report.task_id !== expected.taskId) throw new Error("research report task identity mismatch");
  if (expected.stage !== undefined && report.stage !== expected.stage) throw new Error("research report stage identity mismatch");
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

function validateOrdinaryShape(report) {
  const fail = label => { throw new TypeError(`research report ${label} is invalid`); };
  const text = value => typeof value === "string" && value.length > 0;
  const nullableText = value => value === null || typeof value === "string";
  const requiredText = (item, fields, label) => {
    if (!isObject(item) || fields.some(key => !text(item[key]))) fail(label);
  };
  const strings = (value, label, nonempty = false) => {
    if (!Array.isArray(value) || value.some(item => typeof item !== "string" || nonempty && !item.length)) fail(label);
  };
  if (!isObject(report) || report.schema_version !== "research-report.v1" || !STAGES.has(report.stage)
      || !["completed", "skipped", "unavailable"].includes(report.status)) fail("shape");
  requiredText(report, ["task_id", "question", "decision_axis"], "identity/question");
  if (!Array.isArray(report.tool_usage) || !Array.isArray(report.open_items)) fail("tool_usage/open_items");
  for (const question of report.questions ?? []) requiredText(question, ["question_id", "text"], "question");
  for (const item of report.open_items) requiredText(item, ["question_id", "code", "reason", "next_action"], "open item");
  if (!isObject(report.review) || !["pending", "completed", "unavailable"].includes(report.review.status)
      || !nullableText(report.review.evidence_ref) || report.review.findings !== undefined && !Array.isArray(report.review.findings)) fail("review");
  if (!isObject(report.fallback) || !["not_requested", "awaiting_user_approval", "approved", "declined"].includes(report.fallback.approval_status)
      || !nullableText(report.fallback.requested_route) || report.fallback.approval_ref !== undefined && !nullableText(report.fallback.approval_ref)) fail("fallback");
  strings(report.fallback.used_routes, "fallback used_routes");
  for (const usage of report.tool_usage) {
    requiredText(usage, ["tool"], "tool usage");
    for (const key of ["question_id", "route"]) if (usage[key] !== undefined && !text(usage[key])) fail(`tool usage ${key}`);
    if (usage.queries !== undefined) strings(usage.queries, "queries");
    if (usage.attempts !== undefined && !Array.isArray(usage.attempts)) fail("attempts");
    const checkAttempt = (attempt, full) => {
      if (!isObject(attempt)) fail("attempt");
      if (full && ["route", "attempt", "status", "elapsed_ms", "http_status", "error_code", "message"].some(key => !Object.hasOwn(attempt, key) || attempt[key] === undefined)) fail("attempt required fields");
      if (attempt.route !== undefined && !text(attempt.route)) fail("attempt route");
      if (attempt.attempt !== undefined && (!Number.isInteger(attempt.attempt) || attempt.attempt < 1 || full && attempt.attempt > 2)) fail("attempt number");
      if (attempt.status !== undefined && !ATTEMPT_STATUSES.has(attempt.status)) fail("attempt status");
      if (attempt.elapsed_ms !== undefined && (!Number.isInteger(attempt.elapsed_ms) || attempt.elapsed_ms < 0 || full && attempt.elapsed_ms > 30000)) fail("attempt elapsed_ms");
      if (attempt.http_status !== undefined && attempt.http_status !== null && (!Number.isInteger(attempt.http_status) || attempt.http_status < 100 || attempt.http_status > 599)) fail("attempt http_status");
      for (const key of ["error_code", "message"]) if (attempt[key] !== undefined && !nullableText(attempt[key])) fail(`attempt ${key}`);
    };
    checkAttempt(usage, false);
    for (const attempt of usage.attempts ?? []) checkAttempt(attempt, true);
  }
  for (const key of ["questions", "sources", "evidence", "candidates"]) if (report[key] !== undefined && !Array.isArray(report[key])) fail(key);
  for (const source of report.sources ?? []) {
    requiredText(source, ["url_or_ref"], "source");
    if (!["primary", "secondary", "inferred"].includes(source.source_tier) || source.read_original !== true
        || source.locator !== undefined && !nullableText(source.locator)) fail("source provenance");
  }
  for (const evidence of report.evidence ?? []) {
    requiredText(evidence, ["claim", "source_ref", "locator"], "evidence");
    if (!["high", "medium", "low"].includes(evidence.confidence) || evidence.read_original !== undefined && evidence.read_original !== true) fail("evidence confidence/original");
    if (evidence.evidence_id !== undefined && !text(evidence.evidence_id)) fail("evidence_id");
    if (evidence.candidate_ids !== undefined) strings(evidence.candidate_ids, "candidate_ids", true);
  }
  for (const candidate of report.candidates ?? []) {
    requiredText(candidate, ["candidate_id"], "candidate");
    for (const key of ["plain_language_summary", "recommendation_reason"]) if (candidate[key] !== undefined && !text(candidate[key])) fail(`candidate ${key}`);
    for (const key of ["source_refs", "evidence_refs"]) if (candidate[key] !== undefined) strings(candidate[key], `candidate ${key}`, true);
    if (candidate.recommendation !== undefined && !["recommended", "not_recommended"].includes(candidate.recommendation)) fail("candidate recommendation");
  }
  for (const key of ["reason", "non_impact_basis", "error_class"]) if (report[key] !== undefined && !text(report[key])) fail(key);
  for (const key of ["evidence_refs", "pending_questions"]) if (report[key] !== undefined) strings(report[key], key, true);
  if (report.rounds !== undefined && (!Number.isInteger(report.rounds) || report.rounds < 0)) fail("rounds");
  if (report.status === "completed") {
    if (!Number.isInteger(report.rounds) || report.rounds < 0 || !Array.isArray(report.sources) || !Array.isArray(report.evidence)
        || !isObject(report.triangulation) || !["confirmed", "supported", "disputed", "unresolved"].includes(report.triangulation.status)
        || !Array.isArray(report.triangulation.conflicts) || !isObject(report.coverage)
        || !Object.hasOwn(report.coverage, "first_party_ratio") || !["number", "string"].includes(typeof report.coverage.first_party_ratio) && report.coverage.first_party_ratio !== null
        || !isObject(report.saturation) || !["saturated", "timeboxed", "not_saturated"].includes(report.saturation.status) || !text(report.saturation.reason)) fail("completed report facts");
    strings(report.coverage.dimensions, "coverage dimensions");
    for (const key of ["required_questions", "covered_questions"]) if (report.coverage[key] !== undefined) strings(report.coverage[key], `coverage ${key}`);
  } else if (report.status === "skipped") {
    requiredText(report, ["reason", "non_impact_basis"], "skipped reason"); strings(report.evidence_refs, "skipped evidence_refs", true);
  } else {
    requiredText(report, ["error_class", "reason"], "unavailable reason"); strings(report.pending_questions, "pending_questions", true);
  }
}

export function validateResearchReport(report, expected = {}) {
  validateOrdinaryShape(report);
  if (report.recorded_at !== undefined && (typeof report.recorded_at !== "string" || !report.recorded_at.length || !Number.isFinite(Date.parse(report.recorded_at)))) {
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

export function parseResearchReport(raw, expected = {}) {
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw), "utf8");
  let value;
  try { value = JSON.parse(bytes.toString("utf8")); }
  catch (error) { throw new Error(`research report JSON is invalid: ${error.message}`); }
  return validateResearchReport(value, expected);
}

export function readResearchReport({ read, task, ref, taskId, stage } = {}) {
  if (typeof read !== "function" && task && typeof task.readRecord === "function") read = candidateRef => task.readRecord(candidateRef);
  if (typeof read !== "function") throw new TypeError("research report reader requires read");
  if (!REPORT_REF.test(ref ?? "")) throw new Error("research report ref must name an ordinary research JSON file");
  const raw = read(ref);
  const value = parseResearchReport(raw, { taskId, stage });
  return Object.freeze({ ref, raw, value });
}

function candidateDelivery({ record = null, status, reason = null, candidates = [], missingCandidateIds = [], missingFieldsByCandidate = {} } = {}) {
  return Object.freeze({
    status,
    full_report: record ? Object.freeze({ ref: record.ref }) : null,
    candidates: Object.freeze(candidates.map((candidate) => Object.freeze({
      ...candidate,
      source_refs: Object.freeze([...(candidate.source_refs ?? [])]),
      evidence_refs: Object.freeze([...(candidate.evidence_refs ?? [])]),
      missing_fields: Object.freeze([...(candidate.missing_fields ?? [])]),
    }))),
    missing_candidate_ids: Object.freeze([...missingCandidateIds]),
    missing_fields_by_candidate: Object.freeze(Object.fromEntries(Object.entries(missingFieldsByCandidate)
      .map(([candidateId, fields]) => [candidateId, Object.freeze([...fields])]))),
    reason,
  });
}

function deriveCandidateDelivery(record) {
  const report = record.value;
  if (report.status === "unavailable") {
    return candidateDelivery({ record, status: "unavailable", reason: "research_unavailable" });
  }
  if (report.status !== "completed") {
    return candidateDelivery({ record, status: "not_applicable", reason: "research_not_completed" });
  }
  if (!Array.isArray(report.candidates)) {
    return candidateDelivery({ record, status: "incomplete", reason: "candidate_set_not_declared" });
  }
  const candidates = report.candidates;
  if (candidates.length === 0) {
    return candidateDelivery({ record, status: "not_applicable", reason: "no_candidates_declared" });
  }

  const sourceRefs = new Set((report.sources ?? []).map((source) => source.url_or_ref));
  const evidenceById = new Map((report.evidence ?? [])
    .filter((evidence) => typeof evidence.evidence_id === "string" && evidence.evidence_id.trim() !== "")
    .map((evidence) => [evidence.evidence_id, evidence]));
  const seenIds = new Set();
  const missingCandidateIds = [];
  const missingFieldsByCandidate = {};
  const deliveredCandidates = candidates.map((candidate) => {
    const missing = [];
    const candidateId = candidate.candidate_id;
    if (seenIds.has(candidateId)) missing.push("candidate_id_unique");
    seenIds.add(candidateId);
    if (typeof candidate.plain_language_summary !== "string" || candidate.plain_language_summary.trim() === "") {
      missing.push("plain_language_summary");
    }
    const refs = Array.isArray(candidate.source_refs) ? candidate.source_refs : [];
    if (refs.length === 0) {
      missing.push("source_refs");
    } else if (refs.some((ref) => !sourceRefs.has(ref))) {
      missing.push("source_refs_declared_in_report");
    }
    const evidenceRefs = Array.isArray(candidate.evidence_refs) ? candidate.evidence_refs : [];
    const selectedEvidence = evidenceRefs.map((evidenceId) => evidenceById.get(evidenceId) ?? null);
    if (evidenceRefs.length === 0) {
      missing.push("evidence_refs");
    } else if (selectedEvidence.some((evidence) => evidence === null
        || !Array.isArray(evidence.candidate_ids)
        || !evidence.candidate_ids.includes(candidateId))) {
      missing.push("evidence_refs_bound_to_candidate");
    }
    if (refs.length && (selectedEvidence.some((evidence) => evidence === null)
        || refs.some((ref) => !selectedEvidence.some((evidence) => evidence?.source_ref === ref)))) {
      missing.push("source_refs_bound_to_candidate_evidence");
    }
    if (!new Set(["recommended", "not_recommended"]).has(candidate.recommendation)) {
      missing.push("recommendation");
    }
    if (typeof candidate.recommendation_reason !== "string" || candidate.recommendation_reason.trim() === "") {
      missing.push("recommendation_reason");
    }
    if (missing.length) {
      if (!missingCandidateIds.includes(candidateId)) missingCandidateIds.push(candidateId);
      missingFieldsByCandidate[candidateId] = [...new Set([...(missingFieldsByCandidate[candidateId] ?? []), ...missing])];
    }
    return {
      candidate_id: candidateId,
      status: missing.length ? "incomplete" : "delivered",
      plain_language_summary: candidate.plain_language_summary ?? null,
      source_refs: refs,
      evidence_refs: evidenceRefs,
      recommendation: candidate.recommendation ?? null,
      recommendation_reason: candidate.recommendation_reason ?? null,
      missing_fields: missing,
    };
  });
  return candidateDelivery({
    record,
    status: missingCandidateIds.length ? "incomplete" : "delivered",
    candidates: deliveredCandidates,
    missingCandidateIds,
    missingFieldsByCandidate,
  });
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

    required_questions: [...questions],
    covered_questions: [...covered],
    tool_attempts: toolAttempts,
    tool_attempt_count: toolAttempts.length,
    gaps,
    candidate_delivery: deriveCandidateDelivery(record),
    fallback: Object.freeze({
      approval_status: report.fallback.approval_status,
      requested_route: report.fallback.requested_route,
      used_routes: [...report.fallback.used_routes],
    }),
  });
}

/** Protected task record reader; no hash or material identity certification. */
export function readResearchReportFromTask({ task, ...input } = {}) {
  if (!task || typeof task.readRecord !== "function") throw new TypeError("research report task reader requires TaskHandle");
  return readResearchReport({ ...input, read: (ref) => task.readRecord(ref) });
}

/** Project the recorded research facts; this does not complete a stage. */
export function deriveResearchStatus(records = []) {
  if (!Array.isArray(records) || records.length === 0) {
    return Object.freeze({
      status: "unavailable",
      reason: "research_record_missing",
      report_ref: null,

      required_questions: [],
      covered_questions: [],
      tool_attempts: [],
      gaps: [],
      candidate_delivery: candidateDelivery({ status: "unavailable", reason: "research_record_missing" }),
      fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] },
    });
  }
  const integrityFailure = records.find((record) => record?.error);
  if (integrityFailure) {
    return Object.freeze({
      status: "unavailable",
      reason: "research_record_integrity_failure",
      report_ref: integrityFailure.ref ?? null,

      required_questions: [],
      covered_questions: [],
      tool_attempts: [],
      gaps: [],
      candidate_delivery: candidateDelivery({ record: integrityFailure, status: "unavailable", reason: "research_record_integrity_failure" }),
      fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] },
    });
  }
  if (records.length > 1) {
    if (records.some((record) => !record.value?.recorded_at)) {
      return Object.freeze({ status: "unavailable", reason: "research_record_ambiguous", report_ref: null, required_questions: [], covered_questions: [], tool_attempts: [], gaps: [], candidate_delivery: candidateDelivery({ status: "unavailable", reason: "research_record_ambiguous" }), fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] } });
    }
    const newest = Math.max(...records.map((record) => Date.parse(record.value.recorded_at)));
    const latest = records.filter((record) => Date.parse(record.value.recorded_at) === newest);
    if (!Number.isFinite(newest) || latest.length !== 1) {
      return Object.freeze({ status: "unavailable", reason: "research_record_ambiguous", report_ref: null, required_questions: [], covered_questions: [], tool_attempts: [], gaps: [], candidate_delivery: candidateDelivery({ status: "unavailable", reason: "research_record_ambiguous" }), fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] } });
    }
    records = latest;
  }
  return researchFacts(records[0]);
}

/** Ordinary sorted directory listing; old filenames and bytes remain read-only. */
export function listCurrentResearchReports({ task, taskId, stage } = {}) {
  if (!task || typeof task.recordPath !== "function" || typeof task.readRecord !== "function") throw new TypeError("research listing requires a protected task reader");
  const directory = task.recordPath("quality/evidence/research");
  let before;
  try { before = lstatSync(directory); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
  if (!before.isDirectory() || before.isSymbolicLink() || realpathSync(directory) !== directory) throw new Error("research report directory contains an alias");
  const names = readdirSync(directory);
  const after = lstatSync(directory);
  if (before.dev !== after.dev || before.ino !== after.ino || !after.isDirectory() || after.isSymbolicLink() || realpathSync(directory) !== directory) throw new Error("research report directory changed while listing");
  return names.filter(name => REPORT_REF.test(`quality/evidence/research/${name}`)).sort().flatMap(name => {
    const ref = `quality/evidence/research/${name}`;
    try { return [readResearchReportFromTask({ task, ref, taskId, stage })]; }
    catch (error) {
      if (/research report (?:task|stage) identity mismatch/.test(error.message)) return [];
      return [{ ref, error: error.message }];
    }
  });
}

/** Append one ordinary report using the existing immutable record interface ③. */
export async function publishResearchReport({ recordDir, slug = "research", report, raw = null, taskId, stage, recordedAt } = {}) {
  if (typeof recordDir !== "string" || !isAbsolute(recordDir) || basename(recordDir) !== "research" || basename(dirname(recordDir)) !== "evidence" || basename(dirname(dirname(recordDir))) !== "quality") throw new TypeError("recordDir must be the ordinary quality/evidence/research directory");
  const reportWithTimestamp = raw === null && recordedAt !== undefined ? { ...report, recorded_at: recordedAt } : report;
  const bytes = raw === null ? `${JSON.stringify(reportWithTimestamp, null, 2)}\n` : (Buffer.isBuffer(raw) ? raw : String(raw));
  const value = parseResearchReport(bytes, { taskId, stage });
  if (["snapshot_tree", "material_scope_revision"].some(key => Object.hasOwn(value, key))) throw new Error("retired research bindings are read-only and cannot be published as a new report");
  const path = await appendRecord(recordDir, slug, "json", bytes);
  return Object.freeze({ ref: `quality/evidence/research/${basename(path)}`, path, value });
}

export { REPORT_REF as RESEARCH_REPORT_REF };
