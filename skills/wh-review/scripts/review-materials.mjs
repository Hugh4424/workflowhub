import { createHash } from "node:crypto";
import { closeSync, lstatSync, mkdtempSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { StringDecoder } from "node:string_decoder";
import { fileURLToPath } from "node:url";
import { assertTaskHandle } from "../../../core/task-handle.mjs";
import { buildAcEvidenceSummary } from "./ac-evidence-summary.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const matrix = JSON.parse(readFileSync(resolve(here, "..", "stage-materials.json"), "utf8"));
const skillPlan = JSON.parse(readFileSync(resolve(here, "..", "stage-skill-plan.json"), "utf8"));
const workflowhubSkills = resolve(here, "..", "..");
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const STREAM_CHUNK_BYTES = 64 * 1024;

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

function validateVerifyEvidenceRoots(stage, materials) {
  if (stage !== "verify-code") return;
  const evidence = materials.acceptance_evidence;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_evidence requires structured canonical roots");
  }
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

function validateAuthorityMap(key, value) {
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
  if (value.state === "unknown" && (typeof value.unknown_reason !== "string" || value.unknown_reason.trim() === "")) {
    throw new Error(`MATERIAL_INCOMPLETE: ${key}.unknown_reason is required when state is unknown`);
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

function validateBuildCodeAcceptanceMap(value) {
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

function validateIntegrationMaterials({ source, materials }) {
  const coverage = materials.phase_coverage;
  if (!coverage || typeof coverage !== "object" || Array.isArray(coverage) || coverage.schema_version !== "phase-review-coverage.v1" ||
      coverage.snapshot_tree !== source.snapshotTree || !coverage.checkpoint || typeof coverage.checkpoint !== "object" ||
      !Array.isArray(coverage.phases) || coverage.phases.length === 0) {
    throw new Error("MATERIAL_INCOMPLETE: integration requires non-empty final-snapshot phase-review-coverage.v1");
  }
  const phaseIds = new Set();
  const phases = new Map();
  for (const phase of coverage.phases) {
    if (!phase || typeof phase !== "object" || Array.isArray(phase) || typeof phase.phase_id !== "string" || phase.phase_id === "" || phaseIds.has(phase.phase_id) ||
        typeof phase.base_tree !== "string" || typeof phase.snapshot_tree !== "string" || typeof phase.trace_ref !== "string" ||
        !/^evidence\/phases\/[A-Za-z0-9._/-]+\/phase-map-trace-[a-f0-9]{64}\.json$/.test(phase.trace_ref) ||
        typeof phase.review_result?.ref !== "string" || typeof phase.green_test_receipt?.ref !== "string") {
      throw new Error("MATERIAL_INCOMPLETE: integration coverage phase identity is invalid");
    }
    hashValue(phase.trace_sha256, `phase_coverage.${phase.phase_id}.trace_sha256`);
    hashValue(phase.review_result.sha256, `phase_coverage.${phase.phase_id}.review_result.sha256`);
    hashValue(phase.green_test_receipt.sha256, `phase_coverage.${phase.phase_id}.green_test_receipt.sha256`);
    phaseIds.add(phase.phase_id); phases.set(phase.phase_id, phase);
  }
  if (coverage.phases.at(-1).snapshot_tree !== source.snapshotTree) throw new Error("MATERIAL_INCOMPLETE: integration coverage does not end at the frozen final snapshot");

  const seams = materials.seam_index;
  if (!seams || typeof seams !== "object" || Array.isArray(seams) || seams.schema_version !== "cross-phase-seam-index.v1" || seams.snapshot_tree !== source.snapshotTree) {
    throw new Error("MATERIAL_INCOMPLETE: integration requires a final-snapshot cross-phase-seam-index.v1");
  }
  const seamIds = new Set();
  for (const seam of integrationEntries(seams, "seam_index")) {
    if (!seam || typeof seam !== "object" || Array.isArray(seam) || typeof seam.seam_id !== "string" || seam.seam_id === "" || seamIds.has(seam.seam_id) ||
        !phaseIds.has(seam.producer_phase_id) || !phaseIds.has(seam.consumer_phase_id) || !["complete", "not_applicable", "unknown"].includes(seam.disposition)) {
      throw new Error("MATERIAL_INCOMPLETE: seam_index entry identity is invalid");
    }
    seamIds.add(seam.seam_id);
    if (seam.disposition === "complete") validateAnchors("seam_index", seam.seam_id, seam.anchors);
    else if (seam.anchors !== undefined || typeof seam.reason_code !== "string" || seam.reason_code === "" || typeof seam.reason !== "string" || seam.reason === "") {
      throw new Error(`MATERIAL_INCOMPLETE: seam_index.${seam.seam_id} must have anchors or an explicit audited disposition`);
    }
  }

  const trace = materials.ac_trace;
  if (!trace || typeof trace !== "object" || Array.isArray(trace) || trace.schema_version !== "ac-change-test-trace.v1" || trace.snapshot_tree !== source.snapshotTree ||
      !Array.isArray(trace.acceptance_ids) || trace.acceptance_ids.length === 0 || new Set(trace.acceptance_ids).size !== trace.acceptance_ids.length) {
    throw new Error("MATERIAL_INCOMPLETE: integration requires one declared AC trace per accepted AC");
  }
  const traced = new Set();
  for (const entry of integrationEntries(trace, "ac_trace")) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.acceptance_criterion_id !== "string" ||
        !trace.acceptance_ids.includes(entry.acceptance_criterion_id) || traced.has(entry.acceptance_criterion_id) ||
        !Array.isArray(entry.change) || !Array.isArray(entry.test) || !Array.isArray(entry.evidence) ||
        entry.change.length === 0 || entry.test.length === 0 || entry.evidence.length === 0) {
      throw new Error("MATERIAL_INCOMPLETE: every integration AC requires change, test, and evidence mappings");
    }
    traced.add(entry.acceptance_criterion_id);
    validateAnchors("ac_trace", entry.acceptance_criterion_id, entry.anchors);
    for (const change of entry.change) {
      const phase = phases.get(change?.phase_id);
      if (!phase || typeof change.path !== "string" || !Array.isArray(phase.changed_files) || !phase.changed_files.includes(change.path)) {
        throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} change mapping is not in covered Phase evidence`);
      }
    }
    for (const test of entry.test) {
      const phase = phases.get(test?.phase_id);
      if (!phase || test.receipt_ref !== phase.green_test_receipt.ref || hashValue(test.receipt_hash, `AC ${entry.acceptance_criterion_id} test hash`) !== phase.green_test_receipt.sha256.replace(/^sha256:/, "")) {
        throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} test mapping is not the covered GREEN receipt`);
      }
    }
    for (const evidence of entry.evidence) {
      const phase = phases.get(evidence?.phase_id);
      const allowed = [phase?.canonical_phase_evidence, phase?.implementation_receipt, phase?.review_result].filter(Boolean);
      if (!phase || !allowed.some((binding) => evidence.ref === binding.ref && hashValue(evidence.sha256, `AC ${entry.acceptance_criterion_id} evidence hash`) === binding.sha256.replace(/^sha256:/, ""))) {
        throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} evidence mapping is not canonical covered evidence`);
      }
    }
  }
  if (traced.size !== trace.acceptance_ids.length) throw new Error("MATERIAL_INCOMPLETE: integration AC trace omits an accepted AC");
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

function validateV2AuthorityMaps(rule, materials, strictV2Maps, changeMap = null) {
  if (!strictV2Maps) return;
  for (const key of rule.v2_required_maps ?? []) {
    if (!(key in materials)) throw new Error(`MATERIAL_INCOMPLETE: wh_review.v2 requires ${key}`);
    validateAuthorityMap(key, materials[key]);
    if (key === "acceptance_map") validateBuildCodeAcceptanceMap(materials[key]);
  }
  if (rule.v2_required_maps?.includes("impact_map")) {
    for (const key of ["phase_map", "impact_map", "reuse_map", "acceptance_map"]) validateChangeIds(key, materials[key], changeMap);
    requireChangeCoverage("phase_map", materials.phase_map, changeMap);
    requireChangeCoverage("impact_map", materials.impact_map, changeMap);
    const anchorIds = new Set(selectedAnchors(materials).map(({ id }) => id));
    for (const entry of materials.acceptance_map.entries) {
      for (const id of [...(entry.implementation_anchor_ids ?? []), ...(entry.verification_anchor_ids ?? [])]) {
        if (typeof id !== "string" || !anchorIds.has(id)) throw new Error("MATERIAL_INCOMPLETE: acceptance_map anchor id is not selected");
      }
    }
  }
}

function validateMaterialAllowlist(rule, materials, reviewRound) {
  const allowed = new Set([...rule.required, ...rule.optional]);
  if (reviewRound === "closure") for (const key of rule.closure_optional) allowed.add(key);
  for (const key of Object.keys(materials)) {
    if (!allowed.has(key)) throw new Error(`MATERIAL_FORBIDDEN: ${key} is not allowed for ${reviewRound} review`);
  }
  if (reviewRound !== "closure") {
    for (const key of rule.closure_optional) if (key in materials) throw new Error(`MATERIAL_FORBIDDEN: ${key} is closure-only`);
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

function ruleFor(stage, track, reviewScope = null) {
  const stageRule = matrix.stages[stage];
  if (!stageRule) throw new Error(`MATERIAL_INCOMPLETE: unknown stage ${stage}`);
  if (stage === "make-decision") {
    const rule = stageRule.tracks?.[track];
    if (!rule) throw new Error(`MATERIAL_INCOMPLETE: make-decision requires direction or detail track`);
    return rule;
  }
  if (stage === "build-code") {
    const scope = reviewScope ?? "phase";
    if (!['phase', 'integration'].includes(scope)) throw new Error("MATERIAL_INCOMPLETE: build-code requires phase or integration review_scope");
    const rule = stageRule.profiles?.[scope];
    if (!rule) throw new Error(`MATERIAL_INCOMPLETE: build-code has no ${scope} material profile`);
    return rule;
  }
  if (reviewScope !== null) throw new Error(`MATERIAL_INCOMPLETE: ${stage} does not use review_scope`);
  if (track !== null && track !== undefined) throw new Error(`MATERIAL_INCOMPLETE: ${stage} does not use a review track`);
  return stageRule;
}

function stagePlanFor(stage, track) {
  const stagePlan = skillPlan.stages[stage];
  return stage === "make-decision" ? stagePlan?.tracks?.[track] : stagePlan;
}

export function reviewInstructionsFor(stage, track = null, uiScope = false, reviewRound = "initial", reviewScope = null) {
  const rule = ruleFor(stage, track, reviewScope);
  if (!new Set(["initial", "closure", "full", "legacy"]).has(reviewRound)) throw new TypeError("reviewRound is invalid");
  const plan = stagePlanFor(stage, track);
  if (!plan) throw new Error(`MATERIAL_INCOMPLETE: no review skill plan for ${stage}/${track ?? "default"}`);
  const selectedSkills = [...new Set([...(plan.required_skills ?? []), ...(uiScope === true ? (plan.optional_skills ?? []).filter(({ when }) => when === "ui").map(({ name }) => name) : [])])];
  if (["build-code", "verify-code"].includes(stage) && selectedSkills.length === 0) throw new Error(`MATERIAL_INCOMPLETE: ${stage} requires explicit reviewer skills`);
  const scope = stage === "make-decision" ? `${stage}/${track}` : stage === "build-code" ? `${stage}/${reviewScope ?? "phase"}` : stage;
  const blind = stage === "make-decision" && track === "direction"
    ? "The bundle intentionally contains no proposed solution. Judge only the requirement, facts, constraints, and decision direction."
    : "Judge the supplied stage artifact against its requirements, contract, and evidence.";
  const skillInstruction = selectedSkills.length ? `Read these manifest-declared reviewer skills before reviewing: ${selectedSkills.map((name) => `skills/${name}/SKILL.md`).join(", ")}.` : "No reviewer skills are declared for this stage.";
  const roundInstruction = reviewRound === "closure"
    ? "This is a bounded closure review. Review only the prior actionable findings and response ledger, whether each claimed repair is complete, and whether a non-fix has a stated reason. Do not reopen a full design/code review unless the supplied delta proves a material change."
    : "This is a full review of the supplied stage subject.";
  return `Review stage ${scope}. All provider-visible files are under bundle/; begin with bundle/review-instructions.md and read only files in that bundle. Read contracts/ and ${skillInstruction} The sealed manifest and canonical receipts are broker-verified; do not recompute hashes or fetch excluded raw logs. Use changes.diff as the complete phase change authority when supplied, and context/ only for the direct map-selected dependencies needed to judge it. ${blind} ${roundInstruction} Return only one JSON object with verdict, summary, and findings using the requested reviewer schema. Do not access the repository, parent directories, Git, shell, network, or host paths.\n`;
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

/**
 * Build the small AC-to-change/test declaration that becomes immutable Phase
 * evidence after the formal review is written.  It is deliberately derived
 * from the validated V2 Phase maps, rather than copied from a caller-supplied
 * final integration packet.  Final integration adds its canonical evidence
 * bindings later, after the review result and Phase evidence exist.
 */
export function derivePhaseAcceptanceTrace({ source, phaseId, materials, strictV2Maps = false } = {}) {
  if (!strictV2Maps) return null;
  if (typeof phaseId !== "string" || phaseId.length === 0) throw new TypeError("phaseId is required for a Phase acceptance trace");
  const acceptanceMap = materials?.acceptance_map;
  const testEvidence = materials?.test_evidence;
  if (!acceptanceMap || !testEvidence) throw new Error("MATERIAL_INCOMPLETE: Phase AC trace requires acceptance_map and test_evidence");
  const diffIndex = diffIndexFor(source);
  const changeMap = changeMapFor({ source, phaseId, diffIndex });
  validateBuildCodeAcceptanceMap(acceptanceMap);
  validateAuthorityMap("acceptance_map", acceptanceMap);
  validateChangeIds("acceptance_map", acceptanceMap, changeMap);
  if (typeof testEvidence.receipt_ref !== "string" || !/^(?:sha256:)?[a-f0-9]{64}$/.test(testEvidence.receipt_hash ?? "")) {
    throw new Error("MATERIAL_INCOMPLETE: Phase AC trace requires a canonical test receipt binding");
  }
  const changes = new Map(changeMap.changes.map((change) => [change.change_id, change]));
  const entries = acceptanceMap.entries.map((entry) => {
    if (entry.disposition !== "complete") {
      throw new Error(`MATERIAL_INCOMPLETE: Phase AC ${entry.id} requires complete change/test anchors`);
    }
    return {
      acceptance_criterion_id: entry.id,
      change: entry.change_ids.map((changeId) => {
        const change = changes.get(changeId);
        if (!change) throw new Error(`MATERIAL_INCOMPLETE: Phase AC ${entry.id} references an unknown change`);
        return { change_id: change.change_id, path: change.path };
      }),
      test: [{ receipt_ref: testEvidence.receipt_ref, receipt_hash: testEvidence.receipt_hash.replace(/^sha256:/, "") }],
      anchors: entry.anchors.map(({ id, path, start_line, end_line, role, reason }) => ({ id, path, start_line, end_line, role, reason })),
    };
  });
  return Object.freeze({
    schema_version: "phase-ac-change-test-trace.v1",
    phase_id: phaseId,
    base_tree: source.baseTree,
    snapshot_tree: source.snapshotTree,
    acceptance_ids: [...acceptanceMap.acceptance_ids],
    entries: Object.freeze(entries),
  });
}

function packetAuthority(path, rule) {
  if (path === "source.json") return { authority: "required", inclusion_reason: "immutable_snapshot_identity" };
  if (path === "changes.diff") return { authority: "required", inclusion_reason: "complete_phase_diff" };
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

function packetPlanBytes({ stage, reviewTrack, reviewScope, included, excluded }) {
  return Buffer.from(`${JSON.stringify({
    schema_version: "wh-review-packet-plan.v1",
    stage,
    review_track: reviewTrack,
    review_scope: reviewScope,
    included: compactPacketEntries(included),
    excluded,
  }, null, 2)}\n`, "utf8");
}

function writePacketPlan({ bundleRoot, stage, reviewTrack, reviewScope, rule }) {
  const payload = packetEntries(bundleRoot, rule);
  const excluded = excludedPacketMaterial(rule, stage);
  const included = [...payload, { path: "packet-plan.json", authority: "metadata" }, { path: "manifest.json", authority: "metadata" }];
  const planBytes = packetPlanBytes({ stage, reviewTrack, reviewScope, included, excluded });
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
  for (const [key, idKey] of [["seam_index", "seam_id"], ["ac_trace", "acceptance_criterion_id"]]) {
    const record = materials[key];
    if (!record || !Array.isArray(record.entries)) continue;
    for (const entry of record.entries) {
      for (const anchor of entry.anchors ?? []) anchors.push({ ...anchor, map: key, entry_id: entry[idKey], change_ids: [] });
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
    const changed = source.changedFiles.find((item) => item.path === anchor.path);
    if (!changed) continue;
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

function writeSelectedContext({ bundleRoot, reviewDataRoot, source, materials }) {
  const temporaryRoot = mkdtempSync(join(resolve(reviewDataRoot), "context-capture-"));
  try {
    for (const anchor of selectedAnchors(materials)) {
      const changed = source.changedFiles.some((item) => item.path === anchor.path);
      const snapshot = snapshotContext({ source, anchor, temporaryRoot });
      const header = { schema_version: "wh-review-context.v1", id: anchor.id, path: anchor.path, start_line: anchor.start_line, end_line: anchor.end_line, role: anchor.role, reason: anchor.reason, outside_diff_reason: anchor.outside_diff_reason ?? null, map: anchor.map, entry_id: anchor.entry_id, change_ids: anchor.change_ids, changed_file: changed, snapshot_sha256: snapshot.sha256 };
      write(bundleRoot, `context/${anchor.id}.txt`, Buffer.from(`${JSON.stringify(header)}\n${snapshot.content}\n`, "utf8"));
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
  const summary = { schema_version: "wh-review-test-summary.v1", receipt_ref: evidence.receipt_ref, receipt_hash: evidence.receipt_hash.replace(/^sha256:/, ""), command: receipt.command ?? null, exit_code: receipt.exit_code ?? null, snapshot_tree: receipt.snapshot_tree ?? null, started_at: receipt.started_at ?? null, completed_at: receipt.completed_at ?? null, output_hash: receipt.output_hash ?? null, raw_output_included: false };
  write(bundleRoot, "evidence/test-summary.json", Buffer.from(`${JSON.stringify(summary, null, 2)}\n`, "utf8"));
}

export function buildReviewMaterials({ reviewDataRoot, attachmentRoot, source, task, taskId, stage, phaseId = null, reviewTrack = null, reviewScope = null, uiScope = false, materials = {}, strictV2Maps = false, reviewRound = "initial" } = {}) {
  if (!(reviewDataRoot && attachmentRoot && source && taskId)) throw new TypeError("reviewDataRoot, attachmentRoot, source, and taskId are required");
  const effectiveScope = stage === "build-code" ? (reviewScope ?? "phase") : null;
  const rule = ruleFor(stage, reviewTrack, effectiveScope);
  for (const key of rule.required) if (!(key in materials) || !materialPresent(materials[key])) throw new Error(`MATERIAL_INCOMPLETE: missing or empty ${key}`);
  validateMaterialAllowlist(rule, materials, reviewRound);
  if (stage === "make-decision" && reviewTrack === "direction") {
    const allowed = new Set(rule.required);
    for (const key of Object.keys(materials)) if (!allowed.has(key)) throw new Error(`MATERIAL_FORBIDDEN: direction forbids unknown material ${key}`);
  }
  for (const key of rule.forbidden) if (key in materials) throw new Error(`MATERIAL_FORBIDDEN: ${stage}/${reviewTrack ?? "default"} forbids ${key}`);
  const diffIndex = stage === "build-code" && effectiveScope === "phase" ? diffIndexFor(source) : null;
  const changeMap = stage === "build-code" && effectiveScope === "phase" ? changeMapFor({ source, phaseId, diffIndex }) : null;
  validateV2AuthorityMaps(rule, materials, strictV2Maps, changeMap);
  const fixedInstructions = reviewInstructionsFor(stage, reviewTrack, uiScope, reviewRound, effectiveScope);
  if (materials.review_instructions !== fixedInstructions) throw new Error("MATERIAL_FORBIDDEN: review_instructions must use the fixed stage template");
  validateVerifyEvidenceRoots(stage, materials);
  if (stage === "build-code") validateBuildCodeTestEvidence(materials, strictV2Maps);
  rejectDirectRawEvidence(materials);
  if (stage === "build-code" && effectiveScope === "integration") {
    validateIntegrationFreshTests({ task, source, materials });
    validateIntegrationMaterials({ source, materials });
  }
  if (stage === "build-code" && effectiveScope === "phase") validateBuildCodeContextSelection({ source, materials, diffIndex });
  const acEvidenceSummary = stage === "verify-code"
    ? buildAcEvidenceSummary({ task, acceptanceCriteria: materials.acceptance_criteria, acceptanceEvidence: materials.acceptance_evidence })
    : null;
  const providerMaterials = Object.fromEntries(Object.entries(materials).filter(([key]) => key !== "acceptance_evidence"));
  if (acEvidenceSummary !== null) providerMaterials.ac_evidence_summary = acEvidenceSummary;

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
    const copiedDiff = source.copyDiffTo(join(bundleRoot, "changes.diff"));
    if (copiedDiff.bytes !== source.diffBytes || copiedDiff.sha256 !== source.diffSha256) {
      throw new Error("MATERIAL_INCOMPLETE: copied complete diff does not match frozen source bytes");
    }
    write(bundleRoot, "change-map.json", Buffer.from(`${JSON.stringify(changeMap, null, 2)}\n`));
  }
  // Context is never inferred from repository size or file membership. Every
  // provider-visible source excerpt is named by a validated stage map anchor.
  writeSelectedContext({ bundleRoot, reviewDataRoot, source, materials });

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
    write(bundleRoot, path, materialBytes(value));
  }
  freezeCanonicalEvidence({ bundleRoot, task, stage, materials });
  writeTestSummary({ bundleRoot, task, materials });
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
  const sourcePrefix = relative(resolve(attachmentRoot), bundleRoot).replaceAll("\\", "/");
  return Object.freeze({ bundleRoot, attachmentRoot: resolve(attachmentRoot), sourcePrefix, materialId, files: Object.freeze([...payloadFiles, "manifest.json"]), manifest: Object.freeze(entries), deliveryManifest: Object.freeze(deliveryManifest), packetPlan: Object.freeze({ ...packetPlan, delivery_bytes: deliveryBytes }) });
}

function freezeCanonicalEvidence({ bundleRoot }) {
  // The runner authenticates every evidence receipt before producing its
  // stage-specific summary. Canonical records remain task-local audit data,
  // rather than duplicated into a provider bundle.
  write(bundleRoot, "canonical-evidence.json", Buffer.from("[]\n"));
}
