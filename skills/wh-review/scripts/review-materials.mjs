import { createHash } from "node:crypto";
import { closeSync, existsSync, lstatSync, mkdtempSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { StringDecoder } from "node:string_decoder";
import { fileURLToPath } from "node:url";
import { assertTaskHandle } from "../../../runtime/task/task-handle.mjs";
import { buildAcEvidenceSummary } from "./ac-evidence-summary.mjs";
import { reviewRuleFor } from "../../../runtime/review/review-policy.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const skillPlan = JSON.parse(readFileSync(resolve(here, "..", "stage-skill-plan.json"), "utf8"));
const workflowhubSkills = resolve(here, "..", "..");
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const HASH = /^[0-9a-f]{64}$/i;

const STREAM_CHUNK_BYTES = 64 * 1024;
export const PHASE_DIFF_INLINE_LIMIT_BYTES = 320 * 1024;
const PHASE_DIFF_SHARD_TARGET_BYTES = 96 * 1024;
const FULL_PHASE_DIFF_PREFIXES = [
  "runtime/",
  "workflows/",
  "skills/wh-review/",
  "skills/backend-testing/",
  "skills/frontend-testing/",
  "skills/fullstack-slice-testing/",
  "skills/plan-ceo-review/",
  "skills/plan-design-review/",
  "skills/plan-eng-review/",
  "skills/simplicity-guard/",
  "skills/spec-analyze/",
  "skills/spec-tasks/",
  "skills/test-routing-advisor/",
  "tools/cli/",
];

// Provider-visible Phase diffs must include implementation code regardless of
// which project owns the path. Keep documentation, configuration, fixtures,
// and generated reports as bounded summaries unless they are selected through
// the normal context/authority maps.
const FULL_PHASE_DIFF_CODE_EXTENSIONS = new Set([
  ".c", ".cc", ".cpp", ".cxx", ".css", ".fish", ".go", ".h", ".hpp",
  ".java", ".js", ".jsx", ".kt", ".m", ".mjs", ".mm", ".php", ".py",
  ".pyi", ".rb", ".rs", ".sass", ".scss", ".sh", ".sql", ".svelte",
  ".swift", ".ts", ".tsx", ".vue", ".zsh",
]);

/**
 * Large Phase packets keep the implementation and workflow boundaries that
 * directly own the current contract complete. Configuration, generic skill
 * catalog/registry metadata, architecture reports, fixtures, generated
 * reports, and task materials stay provider-visible only as bounded summaries;
 * their canonical bytes remain available for audit. This keeps the provider
 * packet below the hard transport limit without hiding changed-file coverage.
 */
export function phaseDiffDeliveryForPath(path) {
  return FULL_PHASE_DIFF_PREFIXES.some((prefix) => path.startsWith(prefix))
    || FULL_PHASE_DIFF_CODE_EXTENSIONS.has(extname(path).toLowerCase())
    ? "included"
    : "summary";
}

function sha256File(path) {
  const hash = createHash("sha256");
  const fd = openSync(path, "r");
  const chunk = Buffer.allocUnsafe(STREAM_CHUNK_BYTES);
  try {
    for (;;) {
      const count = readSync(fd, chunk, 0, chunk.length, null);
      if (count === 0) break;
      hash.update(chunk.subarray(0, count));
    }
  } finally {
    closeSync(fd);
  }
  return hash.digest("hex");
}

function forEachTextLine(path, onLine) {
  const fd = openSync(path, "r");
  const chunk = Buffer.allocUnsafe(STREAM_CHUNK_BYTES);
  const decoder = new StringDecoder("utf8");
  let pending = "";
  try {
    for (;;) {
      const count = readSync(fd, chunk, 0, chunk.length, null);
      if (count === 0) break;
      pending += decoder.write(chunk.subarray(0, count));
      for (;;) {
        const newline = pending.indexOf("\n");
        if (newline < 0) break;
        onLine(pending.slice(0, newline));
        pending = pending.slice(newline + 1);
      }
    }
    pending += decoder.end();
    if (pending !== "") onLine(pending);
  } finally {
    closeSync(fd);
  }
}

function firstTextLine(path) {
  let first = null;
  forEachTextLine(path, (line) => { if (first === null) first = line; });
  return first ?? "";
}

function safeRelative(path) {
  return typeof path === "string" && path !== "" && !path.startsWith("/") && !path.includes("\\")
    && !path.split("/").some((part) => part === "" || part === "." || part === "..");
}

function write(root, path, bytes) {
  if (!safeRelative(path)) throw new Error(`MATERIAL_INCOMPLETE: unsafe material path ${JSON.stringify(path)}`);
  const target = resolve(root, ...path.split("/"));
  if (!relative(root, target) || relative(root, target).startsWith("..")) throw new Error("MATERIAL_INCOMPLETE: material path escapes bundle");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes, { flag: "wx" });
}

function materialBytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") return Buffer.from(value, "utf8");
  return Buffer.from(`${JSON.stringify(value)}\n`, "utf8");
}

function materialPresent(value) {
  if (Buffer.isBuffer(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && typeof value === "object" && Object.keys(value).length > 0;
}

const LOCAL_HOST_PATH = /(^|[\s("'`=,:;])\/(?:Users|home|private|tmp)\/[^\s"'`<>()[\]{}]+/g;

function redactHostPathText(value) {
  return value.replace(LOCAL_HOST_PATH, (_match, prefix) => `${prefix}<host-path-redacted>`);
}

/**
 * Canonical source materials keep their original bytes for audit. The
 * provider packet is a derived view and must not expose local host paths.
 */
export function redactProviderHostPaths(value) {
  if (typeof value === "string") return redactHostPathText(value);
  if (Array.isArray(value)) return value.map((item) => redactProviderHostPaths(item));
  if (!value || typeof value !== "object" || Buffer.isBuffer(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, redactProviderHostPaths(child)]));
}

function validateVerifyEvidenceRoots(stage, materials) {
  if (stage !== "verify-code") return;
  const evidence = materials.acceptance_evidence;
  if (evidence === undefined) return;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_evidence must be an object when supplied");
  for (const [refKey, hashKey] of [["test_receipt_ref", "test_receipt_hash"], ["evidence_ref", "evidence_hash"]]) {
    if (typeof evidence[refKey] !== "string" || evidence[refKey].trim() === "") throw new Error(`MATERIAL_INCOMPLETE: verify-code acceptance_evidence requires ${refKey}`);
    if (typeof evidence[hashKey] !== "string" || !/^(?:sha256:)?[a-f0-9]{64}$/.test(evidence[hashKey])) throw new Error(`MATERIAL_INCOMPLETE: verify-code acceptance_evidence requires ${hashKey}`);
  }
}

function validateBuildCodeTestEvidence(materials, strictV2Maps) {
  const evidence = materials.test_evidence;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    if (strictV2Maps) throw new Error("MATERIAL_INCOMPLETE: wh_review.v2 build-code requires structured test_evidence receipt");
    return;
  }
  if (Object.prototype.hasOwnProperty.call(evidence, "output_ref") || Object.prototype.hasOwnProperty.call(evidence, "output_hash")) {
    throw new Error("MATERIAL_FORBIDDEN: build-code test_evidence must not expose raw output");
  }
  if (typeof evidence.receipt_ref !== "string" || !/^(?:sha256:)?[a-f0-9]{64}$/.test(evidence.receipt_hash ?? "")) {
    throw new Error("MATERIAL_INCOMPLETE: build-code test_evidence requires receipt_ref and receipt_hash");
  }
}

function validateIntegrationFreshTests({ task, source, materials }) {
  const evidence = materials.test_evidence;
  const raw = assertTaskHandle(task).readRecord(evidence.receipt_ref);
  if (sha256(raw) !== evidence.receipt_hash.replace(/^sha256:/, "")) throw new Error("MATERIAL_INCOMPLETE: integration test receipt hash mismatch");
  let receipt;
  try { receipt = JSON.parse(raw); } catch { throw new Error("MATERIAL_INCOMPLETE: integration test receipt must be JSON"); }
  if (receipt.snapshot_tree !== source.snapshotTree || receipt.exit_code !== 0) {
    throw new Error("MATERIAL_INCOMPLETE: integration requires a fresh passing test receipt for the frozen final snapshot");
  }
}

function rejectDirectRawEvidence(value, path = "materials") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) { value.forEach((item, index) => rejectDirectRawEvidence(item, `${path}[${index}]`)); return; }
  for (const [key, child] of Object.entries(value)) {
    if (["output_ref", "output_hash", "raw_output", "raw_log"].includes(key)) throw new Error(`MATERIAL_FORBIDDEN: ${path}.${key} is retained for audit and cannot enter a review packet`);
    rejectDirectRawEvidence(child, `${path}.${key}`);
  }
}

export function validateAuthorityMap(key, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`MATERIAL_INCOMPLETE: ${key} requires a structured map`);
  if (!["complete", "unknown"].includes(value.state)) throw new Error(`MATERIAL_INCOMPLETE: ${key}.state must be complete or unknown`);
  if (typeof value.summary !== "string" || value.summary.trim() === "") throw new Error(`MATERIAL_INCOMPLETE: ${key}.summary is required`);
  if (!Array.isArray(value.entries)) throw new Error(`MATERIAL_INCOMPLETE: ${key}.entries must be an array`);
  for (const entry of value.entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
        typeof entry.id !== "string" || entry.id.trim() === "" ||
        typeof entry.subject !== "string" || entry.subject.trim() === "" ||
        typeof entry.rationale !== "string" || entry.rationale.trim() === "") {
      throw new Error(`MATERIAL_INCOMPLETE: ${key}.entries require id, subject, and rationale`);
    }
    if (Object.hasOwn(entry, "not_needed_reason")) throw new Error(`MATERIAL_FORBIDDEN: ${key}.${entry.id}.not_needed_reason is retired; declare a disposition instead`);
    if (!['complete', 'not_applicable', 'unknown'].includes(entry.disposition)) throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entry.id}.disposition is required`);
    if (entry.disposition === 'complete') {
      validateAnchors(key, entry.id, entry.anchors);
    } else {
      if (entry.anchors !== undefined) throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entry.id} may not mix ${entry.disposition} with anchors`);
      if (typeof entry.reason_code !== 'string' || entry.reason_code.trim() === '' || typeof entry.reason !== 'string' || entry.reason.trim() === '') {
        throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entry.id} requires reason_code and reason for ${entry.disposition}`);
      }
    }
  }
  if (key === "evidence_map") validateDistinctAcceptanceEvidenceAnchors(value);
  if (value.state === "unknown" && (typeof value.unknown_reason !== "string" || value.unknown_reason.trim() === "")) {
    throw new Error(`MATERIAL_INCOMPLETE: ${key}.unknown_reason is required when state is unknown`);
  }
}

function validateDistinctAcceptanceEvidenceAnchors(value) {
  const owners = new Map();
  for (const entry of value.entries.filter(({ id, disposition }) => disposition === "complete" && /^AC-/.test(id))) {
    for (const anchor of entry.anchors ?? []) {
      const signature = JSON.stringify([anchor.path, anchor.start_line, anchor.end_line, anchor.role]);
      const previous = owners.get(signature);
      if (previous !== undefined && previous !== entry.id) {
        throw new Error(`MATERIAL_INCOMPLETE: evidence_map ${previous} and ${entry.id} share one proving anchor; each AC needs a distinct implementation/test block`);
      }
      owners.set(signature, entry.id);
    }
  }
}

function validateAnchors(key, entryId, anchors) {
  if (!Array.isArray(anchors) || anchors.length === 0) throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entryId}.anchors must be a non-empty array`);
  const ids = new Set();
  for (const anchor of anchors) {
    if (!anchor || typeof anchor !== "object" || Array.isArray(anchor) ||
        typeof anchor.id !== "string" || anchor.id.trim() === "" || ids.has(anchor.id) ||
        !safeRelative(anchor.path) || !Number.isSafeInteger(anchor.start_line) || anchor.start_line < 1 ||
        !Number.isSafeInteger(anchor.end_line) || anchor.end_line < anchor.start_line ||
        typeof anchor.role !== "string" || anchor.role.trim() === "" ||
        typeof anchor.reason !== "string" || anchor.reason.trim() === "") {
      throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entryId}.anchors require unique id, snapshot path, line range, role, and reason`);
    }
    ids.add(anchor.id);
  }
}

export function validateBuildCodeAcceptanceMap(value) {
  if (!Array.isArray(value.acceptance_ids) || value.acceptance_ids.length === 0 || value.acceptance_ids.some((id) => typeof id !== "string" || id.trim() === "") || new Set(value.acceptance_ids).size !== value.acceptance_ids.length) {
    throw new Error("MATERIAL_INCOMPLETE: acceptance_map.acceptance_ids must be a non-empty unique AC list");
  }
  const entryIds = new Set();
  for (const entry of value.entries) {
    if (!value.acceptance_ids.includes(entry.id) || entryIds.has(entry.id)) throw new Error("MATERIAL_INCOMPLETE: acceptance_map entries must map each declared AC exactly once");
    entryIds.add(entry.id);
    if (typeof entry.implementation !== "string" || entry.implementation.trim() === "" || typeof entry.verification !== "string" || entry.verification.trim() === "") {
      throw new Error("MATERIAL_INCOMPLETE: acceptance_map entries require implementation and verification");
    }
  }
  if (entryIds.size !== value.acceptance_ids.length) throw new Error("MATERIAL_INCOMPLETE: acceptance_map must map every declared AC");
  if (value.acceptance_ids.length > 1) {
    const signatures = value.entries.map((entry) => JSON.stringify({
      change_ids: entry.change_ids ?? [],
      implementation: entry.implementation,
      verification: entry.verification,
      anchors: entry.anchors ?? [],
    }));
    if (new Set(signatures).size === 1) throw new Error("MATERIAL_INCOMPLETE: acceptance_map requires distinct evidence for each AC; generic mapping is not allowed");
  }
}

export function validatePhaseTestManifest({ required, listed } = {}) {
  if (!Array.isArray(required) || required.length === 0 || !Array.isArray(listed)) {
    throw new TypeError("phase test manifest requires required and listed path arrays");
  }
  const declared = new Set(listed);
  const missing = [...new Set(required)].filter((path) => !declared.has(path));
  if (missing.length > 0) throw new Error(`MATERIAL_INCOMPLETE: Phase test manifest is missing ${missing.join(", ")}`);
  return Object.freeze({ required: [...new Set(required)], listed: [...declared].sort() });
}

function hashValue(value, label) {
  if (typeof value !== "string" || !/^(?:sha256:)?[a-f0-9]{64}$/.test(value)) throw new Error(`MATERIAL_INCOMPLETE: ${label} must be a SHA-256`);
  return value.replace(/^sha256:/, "");
}

function integrationEntries(value, key) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`MATERIAL_INCOMPLETE: ${key} requires a structured record`);
  if (!Array.isArray(value.entries)) throw new Error(`MATERIAL_INCOMPLETE: ${key}.entries must be an array`);
  return value.entries;
}

function validateIntegrationMaterials({ task, source, materials }) {
  const trace = materials.ac_trace;
  if (!trace || typeof trace !== "object" || Array.isArray(trace) || trace.schema_version !== "ac-change-test-trace.v1"
      || trace.snapshot_tree !== source.snapshotTree || !Array.isArray(trace.acceptance_ids)
      || trace.acceptance_ids.length === 0 || new Set(trace.acceptance_ids).size !== trace.acceptance_ids.length) {
    throw new Error("MATERIAL_INCOMPLETE: current AC evidence is invalid");
  }
  const traced = new Set();
  for (const entry of integrationEntries(trace, "ac_trace")) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.acceptance_criterion_id !== "string" ||
        !trace.acceptance_ids.includes(entry.acceptance_criterion_id) || traced.has(entry.acceptance_criterion_id) ||
        !Array.isArray(entry.change) || !Array.isArray(entry.test) || !Array.isArray(entry.evidence) ||
        entry.change.length === 0 || entry.test.length === 0 || entry.evidence.length === 0) {
      throw new Error("MATERIAL_INCOMPLETE: current AC evidence requires change, test, and evidence mappings");
    }
    traced.add(entry.acceptance_criterion_id);
    validateAnchors("ac_trace", entry.acceptance_criterion_id, entry.anchors);
    for (const change of entry.change) {
      if ((change?.task_id !== null && typeof change?.task_id !== "string") || typeof change.summary !== "string" || change.summary.trim() === "") {
        throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} change mapping is invalid`);
      }
    }
    for (const test of entry.test) {
      if (typeof test?.receipt_ref !== "string" || !HASH.test(test.receipt_hash ?? "")) throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} test binding is invalid`);
      const raw = assertTaskHandle(task).readRecord(test.receipt_ref);
      if (sha256(raw) !== test.receipt_hash) throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} test hash mismatch`);
      const receipt = JSON.parse(raw);
      if (receipt.snapshot_tree !== source.snapshotTree || receipt.exit_code !== 0) throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} test is not a passing current-snapshot fact`);
    }
    for (const evidence of entry.evidence) {
      if (typeof evidence?.ref !== "string" || !HASH.test(evidence.sha256 ?? "")) throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} evidence binding is invalid`);
      const raw = assertTaskHandle(task).readRecord(evidence.ref);
      if (sha256(raw) !== evidence.sha256) throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} evidence hash mismatch`);
      const receipt = JSON.parse(raw);
      if (receipt.snapshot_tree !== source.snapshotTree) throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} evidence is not current-snapshot fact`);
    }
    if (entry.evidence_status === "historical_non_replayable") {
      const disposition = entry.disposition;
      if (!disposition || disposition.status !== "verified_user_disposition"
          || typeof disposition.ref !== "string" || !HASH.test(disposition.sha256 ?? "")
          || typeof disposition.note !== "string" || disposition.note.trim() === "") {
        throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} historical disclosure requires a verified disposition`);
      }
    }
  }
  if (traced.size !== trace.acceptance_ids.length) throw new Error("MATERIAL_INCOMPLETE: current AC evidence omits an accepted AC");
}

function validateChangeIds(key, map, changeMap) {
  if (!changeMap) return;
  const known = new Set(changeMap.changes.map(({ change_id }) => change_id));
  for (const entry of map.entries) {
    if (!Array.isArray(entry.change_ids) || entry.change_ids.length === 0 || entry.change_ids.some((id) => typeof id !== "string" || !known.has(id))) {
      throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entry.id} must reference known change_ids`);
    }
  }
}

function requireChangeCoverage(key, map, changeMap) {
  const declared = new Set(map.entries.flatMap((entry) => entry.change_ids));
  const missing = changeMap.changes.map(({ change_id }) => change_id).filter((id) => !declared.has(id));
  if (missing.length) throw new Error(`MATERIAL_INCOMPLETE: ${key} omits change_ids ${missing.join(",")}`);
}

function validateV2AuthorityMaps(_rule, materials, _strictV2Maps, changeMap = null) {
  for (const key of ["context_map", "evidence_map"]) {
    if (!(key in materials)) continue;
    validateAuthorityMap(key, materials[key]);
  }
  const suppliedBuildCodeMaps = ["phase_map", "impact_map", "reuse_map", "acceptance_map"]
    .filter((key) => key in materials);
  for (const key of suppliedBuildCodeMaps) {
    validateAuthorityMap(key, materials[key]);
    if (key === "acceptance_map") validateBuildCodeAcceptanceMap(materials[key]);
  }
  if (changeMap === null || suppliedBuildCodeMaps.length === 0) return;
  for (const key of suppliedBuildCodeMaps) validateChangeIds(key, materials[key], changeMap);
  if (materials.phase_map) {
    requireChangeCoverage("phase_map", materials.phase_map, changeMap);
  }
  if (materials.impact_map) {
    requireChangeCoverage("impact_map", materials.impact_map, changeMap);
  }
  if (materials.acceptance_map) {
    const anchorIds = new Set(selectedAnchors(materials).map(({ id }) => id));
    for (const entry of materials.acceptance_map.entries) {
      for (const id of [...(entry.implementation_anchor_ids ?? []), ...(entry.verification_anchor_ids ?? [])]) {
        if (typeof id !== "string" || !anchorIds.has(id)) throw new Error("MATERIAL_INCOMPLETE: acceptance_map anchor id is not selected");
      }
    }
  }
}

function validateMaterialAllowlist(rule, materials) {
  const allowed = new Set([...rule.required, ...rule.optional]);
  for (const key of Object.keys(materials)) {
    if (!allowed.has(key)) throw new Error(`MATERIAL_FORBIDDEN: ${key} is not allowed for this review`);
  }
}

function filesUnder(root, current = root) {
  const found = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(root, path));
    else if (entry.isFile()) found.push(relative(root, path).replaceAll("\\", "/"));
  }
  return found.sort((left, right) => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8")));
}

export function canonicalMaterialManifest(entries) {
  const sorted = [...entries].sort((left, right) => Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8")));
  return JSON.stringify(sorted.map(({ path, bytes, sha256: digest }) => ({ path, bytes, sha256: digest })));
}

export function reviewMaterialBytes(key, value) {
  return materialBytes(value);
}

/**
 * Build-plan's spec-analyze input is a packet projection, not another current
 * material. The raw requirement index is carried from decision-log so the
 * analyzer can prove source coverage without locating or writing a ledger.
 */
export function buildPlanningArtifacts({
  rawRequirementIndex = null,
  approvedSpec = null,
  acceptanceCriteria = null,
  draftPlan = null,
  draftTasks = null,
} = {}) {
  return Object.freeze({
    schema_version: "spec-analyze-planning-artifacts.v1",
    source_artifact: "decision-log",
    raw_requirement_index: rawRequirementIndex,
    approved_spec: approvedSpec,
    acceptance_criteria: acceptanceCriteria,
    draft_plan: draftPlan,
    draft_tasks: draftTasks,
    finding_disposition: "pending_main_agent_review",
  });
}

const ruleFor = reviewRuleFor;

function stagePlanFor(stage, track) {
  const stagePlan = skillPlan.stages[stage];
  return stage === "make-decision" ? stagePlan?.tracks?.[track] : stagePlan;
}

export function reviewInstructionsFor(stage, track = null, uiScope = false, reviewScope = null) {
  const rule = ruleFor(stage, track, reviewScope);
  const plan = stagePlanFor(stage, track);
  if (!plan) throw new Error(`MATERIAL_INCOMPLETE: no review skill plan for ${stage}/${track ?? "default"}`);
  const selectedSkills = [...new Set([...(plan.required_skills ?? []), ...(uiScope === true ? (plan.optional_skills ?? []).filter(({ when }) => when === "ui").map(({ name }) => name) : [])])];
  if (["build-code", "verify-code"].includes(stage) && selectedSkills.length === 0) throw new Error(`MATERIAL_INCOMPLETE: ${stage} requires explicit reviewer skills`);
  const scope = stage === "make-decision" ? `${stage}/${track}` : stage === "build-code" ? `${stage}/${reviewScope ?? "phase"}` : stage;
  const blind = stage === "make-decision" && track === "direction"
    ? "The bundle intentionally contains no proposed solution. Judge only the requirement, facts, constraints, and decision direction."
    : "Judge the supplied stage artifact against its requirements, contract, and evidence.";
  const skillInstruction = selectedSkills.length ? `Read these manifest-declared reviewer skills before reviewing: ${selectedSkills.map((name) => `skills/${name}/SKILL.md`).join(", ")}.` : "No reviewer skills are declared for this stage.";
  const reviewInstruction = "This is a full review of the supplied current stage subject.";
  const verifyBound = stage === "verify-code"
    ? "This is one bounded post-repair architect review. Inspect the compact acceptance summary, the architect assessment, the final test summary, and open risks. Do not demand a full evidence tree, historical replay, provider pass, or another review; report only findings that can affect delivery."
    : `${blind} ${reviewInstruction}`;
  return `Review stage ${scope}. All provider-visible files are under bundle/; begin with bundle/review-instructions.md and read only files in that bundle. Read contracts/ and ${skillInstruction} The sealed manifest and canonical receipts are broker-verified; do not recompute hashes or fetch excluded raw logs. Use changes.diff when present; otherwise use diff-index.json plus the complete included diff-shards as the self-contained indexed Phase authority. Use context/ only for map-selected dependencies. ${verifyBound} Return only one JSON object with findings using the requested findings-only reviewer schema; findings may be empty. Do not output verdict, summary, checklist, skill execution receipts, or a second JSON object. Do not access the repository, parent directories, Git, shell, network, or host paths.\n`;
}

export function minimumReviewersFor(stage, track = null, reviewScope = null) { return ruleFor(stage, track, reviewScope).minimum_reviewers; }

function readRegisteredFile(path, label) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || realpathSync(path) !== path) throw new Error(`MATERIAL_INCOMPLETE: ${label} must be a registered regular file`);
  return readFileSync(path);
}

function changeIdFor(item) {
  return `C-${sha256(JSON.stringify([item.path, item.old_path, item.status, item.mode, item.old_mode, item.blob, item.old_blob])).slice(0, 16)}`;
}

function diffPathFromHeader(line) {
  const match = line.match(/^diff --git a\S+ b\/(.+)$/);
  return match?.[1] ?? null;
}

function diffIndexFor(source) {
  if (!(typeof source.diffPath === "string" && typeof source.diffSha256 === "string" && Number.isSafeInteger(source.diffBytes))) {
    throw new Error("MATERIAL_INCOMPLETE: source must expose a complete file-backed diff");
  }
  if (statSync(source.diffPath).size !== source.diffBytes || sha256File(source.diffPath) !== source.diffSha256) {
    throw new Error("MATERIAL_INCOMPLETE: frozen diff bytes or hash changed before material build");
  }
  const byPath = new Map(source.changedFiles.map((item) => [item.path, { headers: [], ranges: [] }]));
  let current = null;
  forEachTextLine(source.diffPath, (line) => {
    const headerPath = diffPathFromHeader(line);
    if (headerPath !== null) {
      current = byPath.has(headerPath) ? headerPath : null;
      return;
    }
    if (!current) return;
    if (!line.startsWith("@@")) return;
    const match = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@.*$/);
    if (!match) return;
    const [, startText, countText] = match;
    const start = Number(startText);
    const count = countText === undefined ? 1 : Number(countText);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(count) || count < 0) {
      throw new Error(`MATERIAL_INCOMPLETE: invalid candidate hunk range for ${current}`);
    }
    const record = byPath.get(current);
    record.headers.push(line);
    if (count > 0) record.ranges.push({ start, end: start + count - 1 });
  });
  return byPath;
}

function changeMapFor({ source, phaseId, diffIndex }) {
  const changes = source.changedFiles.map((item) => {
    const change_id = changeIdFor(item);
    const headers = diffIndex.get(item.path)?.headers ?? [];
    const hunks = headers.length === 0
      ? [{ hunk_id: `H-${sha256(`${change_id}:binary-or-metadata`).slice(0, 16)}`, header: null, kind: "binary_or_metadata" }]
      : headers.map((header, index) => ({ hunk_id: `H-${sha256(`${change_id}:${index}:${header}`).slice(0, 16)}`, header, kind: "unified" }));
    return { change_id, path: item.path, old_path: item.old_path, status: item.status, mode: item.mode, old_mode: item.old_mode, blob: item.blob, old_blob: item.old_blob, hunks };
  });
  return { schema_version: "wh-review-change-map.v1", phase_id: phaseId, base_tree: source.baseTree, candidate_tree: source.snapshotTree, changes };
}

function canonicalDiffArchive({ reviewDataRoot, source }) {
  const root = resolve(reviewDataRoot, "canonical-phase-diffs");
  mkdirSync(root, { recursive: true });
  const name = `${source.diffSha256}.diff`;
  const target = join(root, name);
  if (!existsSync(target)) {
    const temporary = join(root, `.${name}.${process.pid}.${Math.random().toString(16).slice(2)}.tmp`);
    source.copyDiffTo(temporary);
    try { renameSync(temporary, target); } catch (error) {
      rmSync(temporary, { force: true });
      if (!existsSync(target)) throw error;
    }
  }
  if (statSync(target).size !== source.diffBytes || sha256File(target) !== source.diffSha256) {
    throw new Error("MATERIAL_INCOMPLETE: canonical Phase diff archive is missing or tampered");
  }
  return { ref: `canonical-phase-diffs/${name}`, sha256: source.diffSha256, bytes: source.diffBytes };
}

function canonicalMaterialArchive({ reviewDataRoot, label, bytes }) {
  const hash = sha256(bytes);
  const root = resolve(reviewDataRoot, "canonical-review-materials");
  mkdirSync(root, { recursive: true });
  const name = `${label}-${hash}.json`;
  const target = join(root, name);
  if (!existsSync(target)) writeFileSync(target, bytes, { flag: "wx" });
  if (statSync(target).size !== bytes.length || sha256File(target) !== hash) {
    throw new Error(`MATERIAL_INCOMPLETE: canonical ${label} archive is missing or tampered`);
  }
  return { ref: `canonical-review-materials/${name}`, sha256: hash, bytes: bytes.length };
}

function compactAuthorityMap(map, archive) {
  return {
    schema_version: "wh-review-compact-map.v1",
    full: archive,
    state: map.state,
    ...(map.acceptance_ids ? { acceptance_ids: map.acceptance_ids } : {}),
    entries: map.entries.map((entry) => ({
      id: entry.id,
      disposition: entry.disposition,
      ...(entry.change_ids ? { change_ids: entry.change_ids } : {}),
      ...(entry.implementation_anchor_ids ? { implementation_anchor_ids: entry.implementation_anchor_ids } : {}),
      ...(entry.verification_anchor_ids ? { verification_anchor_ids: entry.verification_anchor_ids } : {}),
      ...(entry.anchors ? { anchors: entry.anchors.map(({ id, path, start_line, end_line, role }) => ({ id, path, start_line, end_line, role })) } : {}),
      ...(entry.reason_code ? { reason_code: entry.reason_code } : {}),
    })),
  };
}

export function requirementIds(value) {
  return new Set(String(value ?? "").match(/\b(?:FR|AC)(?:-[A-Z][A-Z0-9_]*)*-\d+\b/g) ?? []);
}

function compactApprovedSpec(spec, acceptanceCriteria, acceptanceMap, archive) {
  if (acceptanceMap?.acceptance_ids?.length) {
    const lines = String(spec).split("\n");
    const entries = new Map(acceptanceMap.entries.map((entry) => [entry.id, entry]));
    const excerpts = acceptanceMap.acceptance_ids.map((acceptanceId) => {
      const entry = entries.get(acceptanceId);
      const verificationIds = new Set(entry?.verification_anchor_ids ?? []);
      const anchor = (entry?.anchors ?? []).find((candidate) =>
        verificationIds.has(candidate.id) && /(?:^|\/)spec\.md$/i.test(candidate.path ?? ""));
      if (!anchor || !Number.isSafeInteger(anchor.start_line) || !Number.isSafeInteger(anchor.end_line)
          || anchor.start_line < 1 || anchor.end_line < anchor.start_line || anchor.end_line > lines.length) {
        throw new Error(`MATERIAL_INCOMPLETE: acceptance ${acceptanceId} has no valid spec verification excerpt`);
      }
      const text = lines.slice(anchor.start_line - 1, anchor.end_line).join("\n");
      if (!text.includes(acceptanceId)) {
        throw new Error(`MATERIAL_INCOMPLETE: spec verification excerpt does not contain ${acceptanceId}`);
      }
      return { acceptance_id: acceptanceId, path: anchor.path, start_line: anchor.start_line, end_line: anchor.end_line, text };
    });
    return {
      schema_version: "wh-review-spec-excerpts.v1",
      full: archive,
      selected_ids: [...acceptanceMap.acceptance_ids],
      excerpts,
    };
  }
  const ids = requirementIds(acceptanceCriteria);
  for (const id of acceptanceMap?.acceptance_ids ?? []) ids.add(id);
  for (const entry of acceptanceMap?.entries ?? []) {
    for (const id of requirementIds(JSON.stringify(entry))) ids.add(id);
  }
  const blocks = String(spec).split(/\n{2,}/);
  const selected = blocks.filter((block) => [...ids].some((id) => block.includes(id)));
  return {
    schema_version: "wh-review-spec-excerpts.v1",
    full: archive,
    selected_ids: [...ids].sort(),
    excerpts: selected,
  };
}

function canonicalAnchorSource({ reviewDataRoot, source, anchor }) {
  const temporaryRoot = mkdtempSync(join(resolve(reviewDataRoot), "anchor-source-"));
  try {
    const snapshot = snapshotContext({ source, anchor, temporaryRoot });
    const bytes = Buffer.from(`${snapshot.content}\n`, "utf8");
    const archive = canonicalMaterialArchive({
      reviewDataRoot, label: `anchor-${sha256(anchor.id).slice(0, 16)}`, bytes,
    });
    return {
      anchor_id: anchor.id,
      source_ref: archive.ref,
      source_sha256: archive.sha256,
      start_line: anchor.start_line,
      end_line: anchor.end_line,
    };
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function diffSections(source) {
  const bytes = readFileSync(source.diffPath);
  const starts = [];
  let offset = 0;
  while (offset < bytes.length) {
    const next = bytes.indexOf(Buffer.from("diff --git "), offset);
    if (next < 0) break;
    if (next === 0 || bytes[next - 1] === 10) starts.push(next);
    offset = next + 10;
  }
  if (starts.length === 0 && bytes.length > 0) throw new Error("MATERIAL_INCOMPLETE: Phase diff has no unified diff sections");
  return starts.map((start, index) => {
    const end = starts[index + 1] ?? bytes.length;
    const body = bytes.subarray(start, end);
    const firstLineEnd = body.indexOf(10);
    const header = body.subarray(0, firstLineEnd < 0 ? body.length : firstLineEnd).toString("utf8");
    const path = diffPathFromHeader(header);
    if (!path) throw new Error("MATERIAL_INCOMPLETE: Phase diff section has an invalid header");
    return { path, bytes: body };
  });
}

function semanticAnchorRanges(change, anchor) {
  let delta = 0;
  for (const hunk of change.hunks) {
    const match = hunk.header?.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (!match) continue;
    const oldStart = Number(match[1]), oldCount = match[2] === undefined ? 1 : Number(match[2]);
    const newStart = Number(match[3]), newCount = match[4] === undefined ? 1 : Number(match[4]);
    const newEnd = newCount === 0 ? newStart : newStart + newCount - 1;
    if (anchor.start_line <= newEnd && newStart <= anchor.end_line) {
      return {
        old: { start_line: oldStart, end_line: oldCount === 0 ? oldStart : oldStart + oldCount - 1 },
        new: { start_line: anchor.start_line, end_line: anchor.end_line },
      };
    }
    if (newEnd < anchor.start_line) delta += newCount - oldCount;
  }
  return {
    old: { start_line: anchor.start_line - delta, end_line: anchor.end_line - delta },
    new: { start_line: anchor.start_line, end_line: anchor.end_line },
  };
}

function selectedPhaseChangeIds(materials) {
  const selected = new Set();
  for (const key of ["phase_map", "impact_map", "reuse_map", "acceptance_map"]) {
    for (const entry of materials[key]?.entries ?? []) {
      // Acceptance anchors can point at a changed file whose full diff is not
      // needed in the packet. `diff_delivery: summary` keeps that mapping
      // accurate while the bounded context excerpt remains provider-visible.
      if (
        (entry.disposition === "complete" || key === "acceptance_map")
        && entry.diff_delivery !== "summary"
      ) {
        for (const changeId of entry.change_ids ?? []) selected.add(changeId);
      }
    }
  }
  return selected;
}

function writeShardedPhaseDiff({ bundleRoot, reviewDataRoot, source, changeMap, materials }) {
  const archive = canonicalDiffArchive({ reviewDataRoot, source });
  const changesByPath = new Map(changeMap.changes.map((change) => [change.path, change]));
  const selectedChangeIds = selectedPhaseChangeIds(materials);
  const shards = [];
  let ordinal = 0;
  for (const section of diffSections(source)) {
    const change = changesByPath.get(section.path);
    if (!change) throw new Error(`MATERIAL_INCOMPLETE: diff section ${section.path} is absent from change-map`);
    const delivery = selectedChangeIds.size > 0
      ? (selectedChangeIds.has(change.change_id) ? "included" : "summary")
      : phaseDiffDeliveryForPath(section.path);
    const bodies = delivery === "included"
      ? Array.from({ length: Math.ceil(section.bytes.length / PHASE_DIFF_SHARD_TARGET_BYTES) }, (_value, index) => {
        const offset = index * PHASE_DIFF_SHARD_TARGET_BYTES;
        return { offset, body: section.bytes.subarray(offset, Math.min(section.bytes.length, offset + PHASE_DIFF_SHARD_TARGET_BYTES)) };
      })
      : [{
        offset: 0,
        body: Buffer.from(`${JSON.stringify({
          schema_version: "wh-review-diff-summary.v1",
          path: section.path,
          change_id: change.change_id,
          status: change.status,
          source_bytes: section.bytes.length,
          hunk_ids: change.hunks.map(({ hunk_id }) => hunk_id),
          delivery: "summary",
          note: "Full diff is retained in the canonical Phase archive; this bounded summary is the provider-visible view for a non-selected path.",
        })}\n`, "utf8"),
      }];
    for (const { offset, body } of bodies) {
      const shardId = `S-${String(++ordinal).padStart(4, "0")}`;
      const path = `diff-shards/${shardId}.diff`;
      write(bundleRoot, path, body);
      shards.push({
        shard_id: shardId,
        _source_path: section.path,
        offset,
        bytes: body.length,
        sha256: sha256(body),
        delivery,
        ...(delivery === "summary" ? { summary: true, source_bytes: section.bytes.length } : {}),
      });
    }
  }
  const indexedChanges = [...new Set(diffSections(source).map(({ path }) => changesByPath.get(path)?.change_id).filter(Boolean))];
  const covered = new Set(indexedChanges);
  const missing = changeMap.changes.map(({ change_id }) => change_id).filter((id) => !covered.has(id));
  if (missing.length > 0) throw new Error(`MATERIAL_INCOMPLETE: diff index misses change_ids ${missing.join(",")}`);
  const compactChanges = changeMap.changes.map((change) => ({
    change_id: change.change_id,
    path: change.path,
    shards: shards.filter((shard) => shard._source_path === change.path)
      .map(({ _source_path, ...shard }) => shard),
  }));
  const index = {
    schema_version: "wh-review-diff-index.v1",
    delivery_mode: "selected_context",
    ...(selectedChangeIds.size > 0 ? { selected_change_ids: [...selectedChangeIds].sort() } : {}),
    full_diff: { ...archive, lines: (() => { let count = 0; forEachTextLine(source.diffPath, () => { count += 1; }); return count; })() },
    coverage: { change_ids_total: changeMap.changes.length, change_ids_indexed: covered.size },
    changes: compactChanges,
    anchors: selectedAnchors(materials).map((anchor) => {
      const change = compactChanges.find(({ path }) => path === anchor.path);
      if (!change) return canonicalAnchorSource({ reviewDataRoot, source, anchor });
      if (selectedChangeIds.size > 0
        ? !selectedChangeIds.has(change.change_id)
        : phaseDiffDeliveryForPath(anchor.path) !== "included") return canonicalAnchorSource({ reviewDataRoot, source, anchor });
      const fullChange = changeMap.changes.find(({ change_id }) => change_id === change.change_id);
      const shard = change.shards.find(({ delivery }) => delivery === "included");
      if (!shard) throw new Error(`MATERIAL_INCOMPLETE: changed-path anchor ${anchor.id} has no included shard`);
      return { anchor_id: anchor.id, shard_id: shard.shard_id, source_lines: semanticAnchorRanges(fullChange, anchor) };
    }),
  };
  write(bundleRoot, "diff-index.json", Buffer.from(`${JSON.stringify(index)}\n`));
  return index;
}

export function validateDiffIndexBundle(bundleRoot) {
  const indexPath = join(bundleRoot, "diff-index.json");
  if (!existsSync(indexPath)) return;
  let index;
  try { index = JSON.parse(readFileSync(indexPath, "utf8")); } catch {
    throw new Error("MATERIAL_INCOMPLETE: diff-index.json is invalid");
  }
  if (index.schema_version !== "wh-review-diff-index.v1" || index.delivery_mode !== "selected_context") {
    throw new Error("MATERIAL_INCOMPLETE: diff index contract mismatch");
  }
  const covered = new Set();
  const selectedChangeIds = new Set(index.selected_change_ids ?? []);
  for (const change of index.changes ?? []) {
    covered.add(change.change_id);
    const shards = Array.isArray(change.shards) ? change.shards : [];
    const requiresFullDiff = selectedChangeIds.size > 0
      ? selectedChangeIds.has(change.change_id)
      : phaseDiffDeliveryForPath(change.path ?? "") === "included";
    if (!shards.some(({ delivery }) => delivery === "included") && (requiresFullDiff || !shards.some(({ delivery }) => delivery === "summary"))) {
      throw new Error(`MATERIAL_INCOMPLETE: changed path ${change.path ?? change.change_id} has no provider-visible diff shard`);
    }
    for (const shard of shards) {
      if (!["included", "summary"].includes(shard.delivery)) throw new Error(`MATERIAL_INCOMPLETE: diff shard ${shard.shard_id} has an unknown delivery state`);
      const path = join(bundleRoot, "diff-shards", `${shard.shard_id}.diff`);
      if (!existsSync(path) || statSync(path).size !== shard.bytes || sha256File(path) !== shard.sha256) {
        throw new Error(`MATERIAL_INCOMPLETE: selected diff shard ${shard.shard_id} is missing or tampered`);
      }
      if (shard.delivery === "summary" && shard.summary !== true) throw new Error(`MATERIAL_INCOMPLETE: summary diff shard ${shard.shard_id} must declare summary=true`);
    }
  }
  if (covered.size !== index.coverage?.change_ids_total || covered.size !== index.coverage?.change_ids_indexed) {
    throw new Error("MATERIAL_INCOMPLETE: diff index change_id coverage is incomplete");
  }
}

function packetAuthority(path, rule) {
  if (path === "source.json") return { authority: "required", inclusion_reason: "immutable_snapshot_identity" };
  if (path === "changes.diff") return { authority: "required", inclusion_reason: "complete_phase_diff" };
  if (path === "diff-index.json") return { authority: "required", inclusion_reason: "complete_phase_diff_index" };
  if (path.startsWith("diff-shards/")) return { authority: "required", inclusion_reason: "selected_phase_diff_shard" };
  if (path === "change-map.json") return { authority: "required", inclusion_reason: "deterministic_phase_change_map" };
  if (path.startsWith("context/")) return { authority: "context", inclusion_reason: "map_selected_direct_context" };
  if (path === "evidence/test-summary.json") return { authority: "evidence", inclusion_reason: "structured_test_receipt_summary" };
  if (path === "canonical-evidence.json") return { authority: "evidence", inclusion_reason: "canonical_evidence_index" };
  if (path.startsWith("canonical/")) return { authority: "evidence", inclusion_reason: "frozen_canonical_evidence" };
  if (path.startsWith("contracts/")) return { authority: "contract", inclusion_reason: "stage_or_provider_contract" };
  if (path.startsWith("skills/")) return { authority: "review_lens", inclusion_reason: "declared_reviewer_lens" };
  if (path === "review-instructions.md") return { authority: "required", inclusion_reason: "fixed_stage_instructions" };
  if (path.startsWith("requirements/")) {
    const key = path.slice("requirements/".length).replace(/\.(?:md|json)$/, "");
    if (key === "ac_evidence_summary") return { authority: "evidence", inclusion_reason: "generated_per_ac_evidence_summary" };
    return rule.required.includes(key)
      ? { authority: "required", inclusion_reason: `stage_required_${key}` }
      : { authority: "context", inclusion_reason: `declared_context_${key}` };
  }
  return { authority: "context", inclusion_reason: "declared_packet_context" };
}

function excludedPacketMaterial(rule, stage) {
  const excluded = rule.forbidden.map((key) => ({ category: `material:${key}`, reason: "forbidden_by_stage_contract" }));
  if (rule.source_bundle === "none") excluded.push({ category: "source_bundle", reason: "stage_contract_does_not_require_a_diff" });
  excluded.push({ category: "changed_file_snapshot", reason: "complete_files_are_not_default_review_material" });
  excluded.push({ category: "changed_file_index", reason: "change_map_is_the_complete_file_and_hunk_index" });
  if (rule.source_bundle === "diff") {
    excluded.push({ category: "changed_file_context", reason: "complete_diff_is_authoritative_except_declared_outside_hunk_context" });
  }
  excluded.push({ category: "canonical_raw_output", reason: "raw_logs_are_retained_for_audit_not_provider_delivery" });
  if (stage === "verify-code") excluded.push({ category: "canonical_acceptance_evidence_tree", reason: "reduced_to_structured_per_ac_summary" });
  return excluded;
}

function packetEntries(bundleRoot, rule) {
  return filesUnder(bundleRoot).map((path) => {
    const filePath = join(bundleRoot, ...path.split("/"));
    const bytes = statSync(filePath).size;
    const entry = { path, bytes, ...packetAuthority(path, rule) };
    if (path.startsWith("context/")) {
      const header = firstTextLine(filePath);
      try {
        const context = JSON.parse(header);
        entry.map_relation = { map: context.map, entry_id: context.entry_id, anchor_id: context.id, change_ids: context.change_ids };
      } catch { throw new Error(`MATERIAL_INCOMPLETE: context header is invalid for ${path}`); }
    }
    return entry;
  });
}

function compactPacketEntries(entries) {
  const included = { required: [], context: [], evidence: [], contract: [], review_lens: [], metadata: [] };
  for (const entry of entries) {
    if (entry.authority === "context") {
      // Context files carry their own frozen anchor header; repeating the map
      // relation here would send the same identifiers a third time (map,
      // context header, packet plan) without improving a review decision.
      included.context.push(entry.path);
      continue;
    }
    (included[entry.authority] ?? included.metadata).push(entry.path);
  }
  return Object.fromEntries(Object.entries(included).filter(([, entriesForAuthority]) => entriesForAuthority.length > 0));
}

function packetPlanBytes({ stage, reviewTrack, reviewScope, included, excluded, deliveryMode }) {
  const value = {
    schema_version: "wh-review-packet-plan.v1",
    stage,
    review_track: reviewTrack,
    review_scope: reviewScope,
    delivery_mode: deliveryMode,
    included: compactPacketEntries(included),
    excluded,
  };
  return Buffer.from(`${deliveryMode === "selected_context" ? JSON.stringify(value) : JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writePacketPlan({ bundleRoot, stage, reviewTrack, reviewScope, rule }) {
  const payload = packetEntries(bundleRoot, rule);
  const excluded = excludedPacketMaterial(rule, stage);
  const included = [...payload, { path: "packet-plan.json", authority: "metadata" }, { path: "manifest.json", authority: "metadata" }];
  const deliveryMode = reviewScope === "integration" || filesUnder(bundleRoot).includes("diff-index.json")
    ? "selected_context"
    : "inline_complete";
  const planBytes = packetPlanBytes({ stage, reviewTrack, reviewScope, included, excluded, deliveryMode });
  write(bundleRoot, "packet-plan.json", planBytes);
  return JSON.parse(planBytes.toString("utf8"));
}

function selectedAnchors(materials) {
  const anchors = [];
  for (const key of ["context_map", "impact_map", "reuse_map", "acceptance_map", "evidence_map"]) {
    const map = materials[key];
    if (!map || !Array.isArray(map.entries)) continue;
    for (const entry of map.entries) for (const anchor of entry.anchors ?? []) anchors.push({ ...anchor, map: key, entry_id: entry.id, change_ids: entry.change_ids ?? [] });
  }
  for (const [key, idKey] of [["ac_trace", "acceptance_criterion_id"]]) {
    const record = materials[key];
    if (!record || !Array.isArray(record.entries)) continue;
    for (const entry of record.entries) {
      for (const anchor of entry.anchors ?? []) anchors.push({ ...anchor, map: key, entry_id: entry[idKey], change_ids: [] });
    }
  }
  const implementationAnchors = materials.ac_trace?.implementation_anchors;
  if (Array.isArray(implementationAnchors)) {
    for (const anchor of implementationAnchors) {
      anchors.push({ ...anchor, map: "ac_trace", entry_id: "implementation", change_ids: [] });
    }
  }
  const ids = new Set();
  for (const anchor of anchors) {
    if (ids.has(anchor.id)) throw new Error(`MATERIAL_INCOMPLETE: duplicate selected context anchor ${anchor.id}`);
    ids.add(anchor.id);
  }
  return anchors;
}

function validateBuildCodeContextSelection({ source, materials, diffIndex }) {
  for (const anchor of selectedAnchors(materials)) {
    if (anchor.map === "acceptance_map" && /(?:^|\/)spec\.md$/i.test(anchor.path)) continue;
    const changed = source.changedFiles.find((item) => item.path === anchor.path);
    if (!changed) continue;
    if (anchor.role === "diff_excerpt") continue;
    if (typeof anchor.outside_diff_reason !== "string" || anchor.outside_diff_reason.trim() === "") {
      throw new Error(`MATERIAL_INCOMPLETE: build-code context anchor ${anchor.id} names changed file ${anchor.path} and requires outside_diff_reason`);
    }
    const overlapsDiff = (diffIndex.get(changed.path)?.ranges ?? []).some(({ start, end }) => anchor.start_line <= end && start <= anchor.end_line);
    if (overlapsDiff) {
      throw new Error(`MATERIAL_FORBIDDEN: build-code context anchor ${anchor.id} overlaps a candidate hunk in ${anchor.path}; changes.diff is the only authority for changed lines`);
    }
  }
}

function snapshotContext({ source, anchor, temporaryRoot }) {
  const snapshotPath = join(temporaryRoot, `${anchor.id}.snapshot`);
  const snapshot = source.copySnapshotFile(anchor.path, snapshotPath);
  let lineNumber = 0;
  const lines = [];
  forEachTextLine(snapshotPath, (line) => {
    lineNumber += 1;
    if (lineNumber >= anchor.start_line && lineNumber <= anchor.end_line) lines.push(line);
  });
  if (anchor.end_line > lineNumber) throw new Error(`MATERIAL_INCOMPLETE: context anchor ${anchor.id} exceeds frozen snapshot file ${anchor.path}`);
  return { ...snapshot, content: lines.join("\n") };
}

function writeSelectedContext({ bundleRoot, reviewDataRoot, source, materials, canonicalOnly = false }) {
  const temporaryRoot = mkdtempSync(join(resolve(reviewDataRoot), "context-capture-"));
  try {
    for (const anchor of selectedAnchors(materials)) {
      const changed = source.changedFiles.some((item) => item.path === anchor.path);
      const snapshot = snapshotContext({ source, anchor, temporaryRoot });
      const header = { schema_version: "wh-review-context.v1", id: anchor.id, path: anchor.path, provider_path: `context/${anchor.id}.txt`, start_line: anchor.start_line, end_line: anchor.end_line, role: anchor.role, reason: anchor.reason, outside_diff_reason: anchor.outside_diff_reason ?? null, map: anchor.map, entry_id: anchor.entry_id, change_ids: anchor.change_ids, changed_file: changed, snapshot_sha256: snapshot.sha256 };
      const bytes = Buffer.from(`${JSON.stringify(header)}\n${snapshot.content}\n`, "utf8");
      if (canonicalOnly) canonicalMaterialArchive({ reviewDataRoot, label: `context-${sha256(anchor.id).slice(0, 16)}`, bytes });
      else write(bundleRoot, `context/${anchor.id}.txt`, bytes);
    }
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function writeTestSummary({ bundleRoot, task, materials }) {
  const evidence = materials.test_evidence;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence) || typeof evidence.receipt_ref !== "string" || typeof evidence.receipt_hash !== "string") return;
  const raw = assertTaskHandle(task).readRecord(evidence.receipt_ref);
  if (sha256(raw) !== evidence.receipt_hash.replace(/^sha256:/, "")) throw new Error("MATERIAL_INCOMPLETE: test receipt hash mismatch");
  let receipt;
  try { receipt = JSON.parse(raw); } catch { throw new Error("MATERIAL_INCOMPLETE: test receipt must be JSON"); }
  const summary = {
    schema_version: "wh-review-test-summary.v1",
    receipt_ref: evidence.receipt_ref,
    receipt_hash: evidence.receipt_hash.replace(/^sha256:/, ""),
    command: receipt.command ?? null,
    exit_code: receipt.exit_code ?? null,
    snapshot_tree: receipt.snapshot_tree ?? null,
    started_at: receipt.started_at ?? null,
    completed_at: receipt.completed_at ?? null,
    output_hash: receipt.output_hash ?? null,
    suite_scope: evidence.suite_scope ?? "unspecified",
    coverage_classes: evidence.coverage_classes ?? [],
    raw_output_included: false,
  };
  write(bundleRoot, "evidence/test-summary.json", Buffer.from(`${JSON.stringify(summary, null, 2)}\n`, "utf8"));
}

export function buildReviewMaterials({ reviewDataRoot, attachmentRoot, source, task, taskId, stage, phaseId = null, reviewTrack = null, reviewScope = null, uiScope = false, materials = {}, strictV2Maps = false } = {}) {
  if (!(reviewDataRoot && attachmentRoot && source && taskId)) throw new TypeError("reviewDataRoot, attachmentRoot, source, and taskId are required");
  const effectiveScope = stage === "build-code" ? (reviewScope ?? "phase") : null;
  const rule = ruleFor(stage, reviewTrack, effectiveScope);
  for (const key of rule.required) if (!(key in materials) || !materialPresent(materials[key])) throw new Error(`MATERIAL_INCOMPLETE: missing or empty ${key}`);
  validateMaterialAllowlist(rule, materials);
  if (stage === "make-decision" && reviewTrack === "direction") {
    const allowed = new Set([...rule.required, ...rule.optional]);
    for (const key of Object.keys(materials)) if (!allowed.has(key)) throw new Error(`MATERIAL_FORBIDDEN: direction forbids unknown material ${key}`);
  }
  for (const key of rule.forbidden) if (key in materials) throw new Error(`MATERIAL_FORBIDDEN: ${stage}/${reviewTrack ?? "default"} forbids ${key}`);
  const diffIndex = stage === "build-code" && effectiveScope === "phase" ? diffIndexFor(source) : null;
  const changeMap = stage === "build-code" && effectiveScope === "phase" ? changeMapFor({ source, phaseId, diffIndex }) : null;
  validateV2AuthorityMaps(rule, materials, strictV2Maps, changeMap);
  const fixedInstructions = reviewInstructionsFor(stage, reviewTrack, uiScope, effectiveScope);
  if (materials.review_instructions !== fixedInstructions) throw new Error("MATERIAL_FORBIDDEN: review_instructions must use the fixed stage template");
  validateVerifyEvidenceRoots(stage, materials);
  if (stage === "build-code") validateBuildCodeTestEvidence(materials, strictV2Maps);
  rejectDirectRawEvidence(materials);
  if (stage === "build-code" && effectiveScope === "integration") {
    validateIntegrationFreshTests({ task, source, materials });
    validateIntegrationMaterials({ task, source, materials });
  }
  if (stage === "build-code" && effectiveScope === "phase") validateBuildCodeContextSelection({ source, materials, diffIndex });
  const acEvidenceSummary = stage === "verify-code" && materials.acceptance_evidence
    ? buildAcEvidenceSummary({ task, acceptanceCriteria: materials.acceptance_criteria, acceptanceEvidence: materials.acceptance_evidence })
    : null;
  let providerMaterials = Object.fromEntries(Object.entries(materials).filter(([key]) => key !== "acceptance_evidence"));
  const selectedContextDelivery = rule.source_bundle === "diff" && source.diffBytes > PHASE_DIFF_INLINE_LIMIT_BYTES;
  if (selectedContextDelivery) {
    const compacted = { ...providerMaterials };
    for (const key of ["phase_map", "impact_map", "reuse_map", "acceptance_map"]) {
      if (!compacted[key]) continue;
      const bytes = materialBytes(compacted[key]);
      compacted[key] = compactAuthorityMap(compacted[key], canonicalMaterialArchive({ reviewDataRoot, label: key, bytes }));
    }
    if (compacted.approved_spec) {
      const bytes = materialBytes(compacted.approved_spec);
      compacted.approved_spec = compactApprovedSpec(
        compacted.approved_spec,
        compacted.acceptance_criteria,
        materials.acceptance_map,
        canonicalMaterialArchive({ reviewDataRoot, label: "approved-spec", bytes }),
      );
    }
    if (compacted.acceptance_criteria && materials.acceptance_map) {
      const bytes = materialBytes(compacted.acceptance_criteria);
      compacted.acceptance_criteria = compactApprovedSpec(
        materials.approved_spec ?? compacted.acceptance_criteria,
        compacted.acceptance_criteria,
        materials.acceptance_map,
        canonicalMaterialArchive({ reviewDataRoot, label: "acceptance-criteria", bytes }),
      );
    }
    providerMaterials = compacted;
  }
  if (stage === "build-plan") {
    providerMaterials.planning_artifacts = buildPlanningArtifacts({
      rawRequirementIndex: materials.raw_requirement ?? null,
      approvedSpec: materials.approved_spec ?? null,
      acceptanceCriteria: materials.acceptance_criteria ?? null,
      draftPlan: materials.draft_plan ?? null,
      draftTasks: materials.draft_tasks ?? null,
    });
  }
  if (acEvidenceSummary !== null) providerMaterials.ac_evidence_summary = acEvidenceSummary;
  providerMaterials = redactProviderHostPaths(providerMaterials);

  const packetRoot = resolve(attachmentRoot, ".wh-review-packets");
  mkdirSync(packetRoot, { recursive: true });
  const bundleRoot = mkdtempSync(join(packetRoot, `bundle-${stage}-${reviewTrack ?? "default"}-`));
  if (rule.source_bundle === "diff") {
    write(bundleRoot, "source.json", Buffer.from(`${JSON.stringify({
      target_commit: source.targetCommit,
      base_commit: source.baseCommit,
      base_tree: source.baseTree,
      captured_head: source.capturedHead,
      snapshot_tree: source.snapshotTree,
      ...(source.phaseEvidenceBinding === undefined ? {} : { phase_evidence: source.phaseEvidenceBinding }),
    })}\n`));
    if (source.diffBytes <= PHASE_DIFF_INLINE_LIMIT_BYTES) {
      write(bundleRoot, "change-map.json", Buffer.from(`${JSON.stringify(changeMap, null, 2)}\n`));
      const copiedDiff = source.copyDiffTo(join(bundleRoot, "changes.diff"));
      if (copiedDiff.bytes !== source.diffBytes || copiedDiff.sha256 !== source.diffSha256) {
        throw new Error("MATERIAL_INCOMPLETE: copied complete diff does not match frozen source bytes");
      }
    } else {
      const fullChangeMap = materialBytes(changeMap);
      const archive = canonicalMaterialArchive({ reviewDataRoot, label: "change-map", bytes: fullChangeMap });
      const compactChangeMap = {
        schema_version: "wh-review-compact-change-map.v1",
        full: archive,
        phase_id: changeMap.phase_id,
        base_tree: changeMap.base_tree,
        candidate_tree: changeMap.candidate_tree,
        changes: changeMap.changes.map(({ change_id, path, status, hunks }) => ({
          change_id,
          path,
          status,
        })),
      };
      write(bundleRoot, "change-map.json", Buffer.from(`${JSON.stringify(compactChangeMap)}\n`));
      const index = writeShardedPhaseDiff({ bundleRoot, reviewDataRoot, source, changeMap, materials });
    }
  }
  // Context is never inferred from repository size or file membership. Every
  // provider-visible source excerpt is named by a validated stage map anchor.
  writeSelectedContext({
    bundleRoot,
    reviewDataRoot,
    source,
    materials,
    // Large diff packets still need the explicitly selected bounded excerpts
    // in the provider bundle. The complete source remains canonical; only
    // map-selected excerpts are embedded here.
    canonicalOnly: false,
  });

  const stagePlan = stagePlanFor(stage, reviewTrack);
  if (!stagePlan) throw new Error(`MATERIAL_INCOMPLETE: no review skill plan for ${stage}/${reviewTrack ?? "default"}`);
  const contractName = stage === "make-decision" ? "make-decision" : stage;
  write(bundleRoot, `contracts/${contractName}.md`, readRegisteredFile(resolve(here, "..", "contracts", `${contractName}.md`), `${contractName} contract`));
  write(bundleRoot, "contracts/provider-protocol.md", readRegisteredFile(resolve(here, "..", "contracts", "provider-protocol.md"), "provider protocol"));
  const selectedSkills = [...(stagePlan?.required_skills ?? []), ...(uiScope === true ? (stagePlan?.optional_skills ?? []).filter(({ when }) => when === "ui").map(({ name }) => name) : [])];
  if (["build-code", "verify-code"].includes(stage) && (stagePlan.required_skills ?? []).length === 0) throw new Error(`MATERIAL_INCOMPLETE: ${stage} requires explicit reviewer skills`);
  for (const skill of selectedSkills) {
    write(bundleRoot, `skills/${skill}/SKILL.md`, readRegisteredFile(resolve(workflowhubSkills, skill, "SKILL.md"), `${skill} skill`));
  }

  for (const [key, value] of Object.entries(providerMaterials)) {
    const path = key === "review_instructions" ? "review-instructions.md" : `requirements/${key}.${typeof value === "string" ? "md" : "json"}`;
    write(bundleRoot, path, reviewMaterialBytes(key, value));
  }
  freezeCanonicalEvidence({ bundleRoot, task, stage, materials });
  writeTestSummary({ bundleRoot, task, materials });
  validateDiffIndexBundle(bundleRoot);
  const packetPlan = writePacketPlan({ bundleRoot, stage, reviewTrack, reviewScope: effectiveScope, rule });
  const payloadFiles = filesUnder(bundleRoot);
  const entries = payloadFiles.map((path) => {
    const filePath = join(bundleRoot, ...path.split("/"));
    return { path, bytes: statSync(filePath).size, sha256: sha256File(filePath) };
  });
  const manifest = canonicalMaterialManifest(entries);
  const materialId = sha256(Buffer.from(manifest, "utf8"));
  write(bundleRoot, "manifest.json", Buffer.from(manifest, "utf8"));
  const manifestBytes = Buffer.from(manifest, "utf8");
  const deliveryManifest = [...entries, { path: "manifest.json", bytes: manifestBytes.length, sha256: sha256(manifestBytes) }];
  const deliveryBytes = deliveryManifest.reduce((total, entry) => total + entry.bytes, 0);
  if (stage === "build-code" && effectiveScope === "phase" && deliveryBytes > 330 * 1024) {
    throw new Error("MATERIAL_INCOMPLETE: review packet exceeds 330 KiB; provide bounded affected excerpts");
  }
  const sourcePrefix = relative(resolve(attachmentRoot), bundleRoot).replaceAll("\\", "/");
  return Object.freeze({ bundleRoot, attachmentRoot: resolve(attachmentRoot), sourcePrefix, materialId, files: Object.freeze([...payloadFiles, "manifest.json"]), manifest: Object.freeze(entries), deliveryManifest: Object.freeze(deliveryManifest), packetPlan: Object.freeze({ ...packetPlan, delivery_bytes: deliveryBytes, delivery_ref_count: deliveryManifest.length }) });
}

function freezeCanonicalEvidence({ bundleRoot, task, stage, materials }) {
  const entries = [];
  if (stage === "build-code" && materials.ac_trace) {
    const bindings = new Map();
    for (const item of materials.ac_trace.entries ?? []) {
      for (const evidence of item.evidence ?? []) bindings.set(`implementation:${evidence.ref}`, { kind: "implementation", ref: evidence.ref, sha256: evidence.sha256 });
      for (const test of item.test ?? []) bindings.set(`tests:${test.receipt_ref}`, { kind: "tests", ref: test.receipt_ref, sha256: test.receipt_hash });
    }
    for (const { kind, ref, sha256: expectedHash } of bindings.values()) {
      const binding = { ref, sha256: expectedHash };
      if (!binding?.ref || !binding?.sha256) continue;
      const raw = assertTaskHandle(task).readRecord(binding.ref);
      const digest = sha256(raw);
      if (digest !== binding.sha256.replace(/^sha256:/, "")) {
        throw new Error(`MATERIAL_INCOMPLETE: canonical ${kind} evidence hash mismatch`);
      }
      let receipt;
      try { receipt = JSON.parse(raw); } catch { throw new Error(`MATERIAL_INCOMPLETE: canonical ${kind} evidence must be JSON`); }
      entries.push({
        kind,
        ref: binding.ref,
        sha256: digest,
        snapshot_tree: receipt.snapshot_tree ?? null,
        source_digest: receipt.source_digest ?? null,
        ...(kind === "implementation" ? {
          changed: receipt.changed ?? [],
          diff_ref: receipt.diff_ref ?? null,
          diff_hash: receipt.diff_hash ?? null,
        } : {
          command: receipt.command ?? null,
          exit_code: receipt.exit_code ?? null,
          output_ref: receipt.output_ref ?? null,
          output_hash: receipt.output_hash ?? null,
        }),
      });
    }
  }
  // These are bounded, hash-bound summaries rather than raw logs or provider
  // output. The canonical task records remain the audit authority.
  write(bundleRoot, "canonical-evidence.json", Buffer.from(`${JSON.stringify(entries, null, 2)}\n`, "utf8"));
}
