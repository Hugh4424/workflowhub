import { createHash } from "node:crypto";
import { lstatSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertTaskHandle } from "../../../core/task-handle.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const matrix = JSON.parse(readFileSync(resolve(here, "..", "stage-materials.json"), "utf8"));
const skillPlan = JSON.parse(readFileSync(resolve(here, "..", "stage-skill-plan.json"), "utf8"));
const workflowhubSkills = resolve(here, "..", "..");
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
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
    if (entry.anchors !== undefined) validateAnchors(key, entry.id, entry.anchors);
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

function validateContextDecision(key, map) {
  if (map.state !== "complete") return;
  for (const entry of map.entries) {
    const hasAnchors = Array.isArray(entry.anchors) && entry.anchors.length > 0;
    const noContextNeeded = typeof entry.not_needed_reason === "string" && entry.not_needed_reason.trim() !== "";
    if (!hasAnchors && !noContextNeeded) throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entry.id} requires anchors or not_needed_reason`);
  }
}

function validateV2AuthorityMaps(rule, materials, strictV2Maps, changeMap = null) {
  if (!strictV2Maps) return;
  for (const key of rule.v2_required_maps ?? []) {
    if (!(key in materials)) throw new Error(`MATERIAL_INCOMPLETE: wh_review.v2 requires ${key}`);
    validateAuthorityMap(key, materials[key]);
    if (key === "acceptance_map") validateBuildCodeAcceptanceMap(materials[key]);
    if (["context_map", "impact_map", "reuse_map", "acceptance_map"].includes(key)) validateContextDecision(key, materials[key]);
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

function ruleFor(stage, track) {
  const stageRule = matrix.stages[stage];
  if (!stageRule) throw new Error(`MATERIAL_INCOMPLETE: unknown stage ${stage}`);
  if (stage === "make-decision") {
    const rule = stageRule.tracks?.[track];
    if (!rule) throw new Error(`MATERIAL_INCOMPLETE: make-decision requires direction or detail track`);
    return rule;
  }
  if (track !== null && track !== undefined) throw new Error(`MATERIAL_INCOMPLETE: ${stage} does not use a review track`);
  return stageRule;
}

function stagePlanFor(stage, track) {
  const stagePlan = skillPlan.stages[stage];
  return stage === "make-decision" ? stagePlan?.tracks?.[track] : stagePlan;
}

export function reviewInstructionsFor(stage, track = null, uiScope = false, reviewRound = "initial") {
  ruleFor(stage, track);
  if (!new Set(["initial", "closure", "full", "legacy"]).has(reviewRound)) throw new TypeError("reviewRound is invalid");
  const plan = stagePlanFor(stage, track);
  if (!plan) throw new Error(`MATERIAL_INCOMPLETE: no review skill plan for ${stage}/${track ?? "default"}`);
  const selectedSkills = [...new Set([...(plan.required_skills ?? []), ...(uiScope === true ? (plan.optional_skills ?? []).filter(({ when }) => when === "ui").map(({ name }) => name) : [])])];
  if (["build-code", "verify-code"].includes(stage) && selectedSkills.length === 0) throw new Error(`MATERIAL_INCOMPLETE: ${stage} requires explicit reviewer skills`);
  const scope = stage === "make-decision" ? `${stage}/${track}` : stage;
  const blind = stage === "make-decision" && track === "direction"
    ? "The bundle intentionally contains no proposed solution. Judge only the requirement, facts, constraints, and decision direction."
    : "Judge the supplied stage artifact against its requirements, contract, and evidence.";
  const skillInstruction = selectedSkills.length ? `Read these manifest-declared reviewer skills before reviewing: ${selectedSkills.map((name) => `skills/${name}/SKILL.md`).join(", ")}.` : "No reviewer skills are declared for this stage.";
  const roundInstruction = reviewRound === "closure"
    ? "This is a bounded closure review. Review only the prior actionable findings and response ledger, whether each claimed repair is complete, and whether a non-fix has a stated reason. Do not reopen a full design/code review unless the supplied delta proves a material change."
    : "This is a full review of the supplied stage subject.";
  return `Review stage ${scope}. Read only files in this bundle. Read contracts/ and ${skillInstruction} The sealed manifest and canonical receipts are broker-verified; do not recompute hashes or fetch excluded raw logs. Use changes.diff as the complete phase change authority when supplied, and context/ only for the direct map-selected dependencies needed to judge it. ${blind} ${roundInstruction} Return only one JSON object with verdict, summary, and findings using the requested reviewer schema. Do not access the repository, parent directories, Git, shell, network, or host paths.\n`;
}

export function minimumReviewersFor(stage, track = null) { return ruleFor(stage, track).minimum_reviewers; }

function readRegisteredFile(path, label) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || realpathSync(path) !== path) throw new Error(`MATERIAL_INCOMPLETE: ${label} must be a registered regular file`);
  return readFileSync(path);
}

function changeIdFor(item) {
  return `C-${sha256(JSON.stringify([item.path, item.old_path, item.status, item.mode, item.old_mode, item.blob, item.old_blob])).slice(0, 16)}`;
}

function diffSectionForChange(diff, item) {
  const sections = diff.split(/(?=^diff --git )/m);
  return sections.find((candidate) =>
    candidate.includes(`\n+++ b/${item.path}\n`) || candidate.includes(`\n--- a/${item.path}\n`)
  ) ?? "";
}

function hunksForChange(diff, item, changeId) {
  const section = diffSectionForChange(diff, item);
  const headers = [...section.matchAll(/^@@[^\n]*@@.*$/gm)].map(([header]) => header);
  if (headers.length === 0) return [{ hunk_id: `H-${sha256(`${changeId}:binary-or-metadata`).slice(0, 16)}`, header: null, kind: "binary_or_metadata" }];
  return headers.map((header, index) => ({ hunk_id: `H-${sha256(`${changeId}:${index}:${header}`).slice(0, 16)}`, header, kind: "unified" }));
}

function candidateHunkRanges(diff, item) {
  const ranges = [];
  for (const [, startText, countText] of diffSectionForChange(diff, item).matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@.*$/gm)) {
    const start = Number(startText);
    const count = countText === undefined ? 1 : Number(countText);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(count) || count < 0) {
      throw new Error(`MATERIAL_INCOMPLETE: invalid candidate hunk range for ${item.path}`);
    }
    if (count > 0) ranges.push({ start, end: start + count - 1 });
  }
  return ranges;
}

function changeMapFor({ source, phaseId }) {
  const changes = source.changedFiles.map((item) => {
    const change_id = changeIdFor(item);
    return { change_id, path: item.path, old_path: item.old_path, status: item.status, mode: item.mode, old_mode: item.old_mode, blob: item.blob, old_blob: item.old_blob, hunks: hunksForChange(source.diff, item, change_id) };
  });
  return { schema_version: "wh-review-change-map.v1", phase_id: phaseId, base_tree: source.baseTree, candidate_tree: source.snapshotTree, changes };
}

function packetAuthority(path, rule) {
  if (path === "source.json") return { authority: "required", inclusion_reason: "immutable_snapshot_identity" };
  if (path === "changes.diff") return { authority: "required", inclusion_reason: "complete_phase_diff" };
  if (path === "change-map.json") return { authority: "required", inclusion_reason: "deterministic_phase_change_map" };
  if (path === "changed-files.json") return { authority: "required", inclusion_reason: "complete_changed_file_index" };
  if (path.startsWith("context/")) return { authority: "context", inclusion_reason: "map_selected_direct_context" };
  if (path === "evidence/test-summary.json") return { authority: "evidence", inclusion_reason: "structured_test_receipt_summary" };
  if (path === "canonical-evidence.json") return { authority: "evidence", inclusion_reason: "canonical_evidence_index" };
  if (path.startsWith("canonical/")) return { authority: "evidence", inclusion_reason: "frozen_canonical_evidence" };
  if (path.startsWith("contracts/")) return { authority: "contract", inclusion_reason: "stage_or_provider_contract" };
  if (path.startsWith("skills/")) return { authority: "review_lens", inclusion_reason: "declared_reviewer_lens" };
  if (path === "review-instructions.md") return { authority: "required", inclusion_reason: "fixed_stage_instructions" };
  if (path.startsWith("requirements/")) {
    const key = path.slice("requirements/".length).replace(/\.(?:md|json)$/, "");
    return rule.required.includes(key)
      ? { authority: "required", inclusion_reason: `stage_required_${key}` }
      : { authority: "context", inclusion_reason: `declared_context_${key}` };
  }
  return { authority: "context", inclusion_reason: "declared_packet_context" };
}

function excludedPacketMaterial(rule) {
  const excluded = rule.forbidden.map((key) => ({ category: `material:${key}`, reason: "forbidden_by_stage_contract" }));
  if (rule.source_bundle === "none") excluded.push({ category: "source_bundle", reason: "stage_contract_does_not_require_a_diff" });
  excluded.push({ category: "changed_file_snapshot", reason: "complete_files_are_not_default_review_material" });
  if (rule.source_bundle === "diff") {
    excluded.push({ category: "changed_file_context", reason: "complete_diff_is_authoritative_except_declared_outside_hunk_context" });
  }
  excluded.push({ category: "canonical_raw_output", reason: "raw_logs_are_retained_for_audit_not_provider_delivery" });
  return excluded;
}

function packetEntries(bundleRoot, rule) {
  return filesUnder(bundleRoot).map((path) => {
    const bytes = readFileSync(join(bundleRoot, ...path.split("/"))).length;
    const entry = { path, bytes, ...packetAuthority(path, rule) };
    if (path.startsWith("context/")) {
      const [header] = readFileSync(join(bundleRoot, ...path.split("/")), "utf8").split("\n", 1);
      try {
        const context = JSON.parse(header);
        entry.map_relation = { map: context.map, entry_id: context.entry_id, anchor_id: context.id, change_ids: context.change_ids };
      } catch { throw new Error(`MATERIAL_INCOMPLETE: context header is invalid for ${path}`); }
    }
    return entry;
  });
}

function packetPlanBytes({ stage, reviewTrack, included, excluded, deliveryBytes }) {
  return Buffer.from(`${JSON.stringify({
    schema_version: "wh-review-packet-plan.v1",
    stage,
    review_track: reviewTrack,
    delivery_bytes: deliveryBytes,
    included,
    excluded,
  }, null, 2)}\n`, "utf8");
}

function writePacketPlan({ bundleRoot, stage, reviewTrack, rule }) {
  const payload = packetEntries(bundleRoot, rule);
  const excluded = excludedPacketMaterial(rule);
  let deliveryBytes = 0;
  let planBytes = null;
  let manifestBytes = null;
  let settled = false;
  for (let round = 0; round < 8; round += 1) {
    const included = [
      ...payload,
      { path: "packet-plan.json", bytes: planBytes?.length ?? 0, authority: "metadata", inclusion_reason: "packet_plan_self" },
      { path: "manifest.json", bytes: manifestBytes?.length ?? 0, authority: "metadata", inclusion_reason: "sealed_delivery_manifest" },
    ];
    planBytes = packetPlanBytes({ stage, reviewTrack, included, excluded, deliveryBytes });
    const planEntry = { path: "packet-plan.json", bytes: planBytes.length, sha256: sha256(planBytes) };
    const manifest = Buffer.from(canonicalMaterialManifest([
      ...payload.map(({ path, bytes }) => ({ path, bytes, sha256: sha256(readFileSync(join(bundleRoot, ...path.split("/")))) })),
      planEntry,
    ]), "utf8");
    const nextDeliveryBytes = payload.reduce((total, entry) => total + entry.bytes, 0) + planBytes.length + manifest.length;
    if (nextDeliveryBytes === deliveryBytes && manifestBytes?.length === manifest.length) { settled = true; break; }
    deliveryBytes = nextDeliveryBytes;
    manifestBytes = manifest;
  }
  if (!settled) throw new Error("MATERIAL_INCOMPLETE: packet plan size did not converge");
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
  const ids = new Set();
  for (const anchor of anchors) {
    if (ids.has(anchor.id)) throw new Error(`MATERIAL_INCOMPLETE: duplicate selected context anchor ${anchor.id}`);
    ids.add(anchor.id);
  }
  return anchors;
}

function validateBuildCodeContextSelection({ source, materials }) {
  for (const anchor of selectedAnchors(materials)) {
    const changed = source.changedFiles.find((item) => item.path === anchor.path);
    if (!changed) continue;
    if (typeof anchor.outside_diff_reason !== "string" || anchor.outside_diff_reason.trim() === "") {
      throw new Error(`MATERIAL_INCOMPLETE: build-code context anchor ${anchor.id} names changed file ${anchor.path} and requires outside_diff_reason`);
    }
    const overlapsDiff = candidateHunkRanges(source.diff, changed).some(({ start, end }) => anchor.start_line <= end && start <= anchor.end_line);
    if (overlapsDiff) {
      throw new Error(`MATERIAL_FORBIDDEN: build-code context anchor ${anchor.id} overlaps a candidate hunk in ${anchor.path}; changes.diff is the only authority for changed lines`);
    }
  }
}

function writeSelectedContext({ bundleRoot, source, materials }) {
  for (const anchor of selectedAnchors(materials)) {
    const changed = source.changedFiles.some((item) => item.path === anchor.path);
    const bytes = source.readSnapshotFile(anchor.path);
    const lines = bytes.toString("utf8").split(/\n/);
    if (anchor.end_line > lines.length) throw new Error(`MATERIAL_INCOMPLETE: context anchor ${anchor.id} exceeds frozen snapshot file ${anchor.path}`);
    const content = lines.slice(anchor.start_line - 1, anchor.end_line).join("\n");
    const header = { schema_version: "wh-review-context.v1", id: anchor.id, path: anchor.path, start_line: anchor.start_line, end_line: anchor.end_line, role: anchor.role, reason: anchor.reason, outside_diff_reason: anchor.outside_diff_reason ?? null, map: anchor.map, entry_id: anchor.entry_id, change_ids: anchor.change_ids, changed_file: changed, snapshot_sha256: sha256(bytes) };
    write(bundleRoot, `context/${anchor.id}.txt`, Buffer.from(`${JSON.stringify(header)}\n${content}\n`, "utf8"));
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

export function buildReviewMaterials({ reviewDataRoot, attachmentRoot, source, task, taskId, stage, phaseId = null, reviewTrack = null, uiScope = false, materials = {}, strictV2Maps = false, reviewRound = "initial" } = {}) {
  if (!(reviewDataRoot && attachmentRoot && source && taskId)) throw new TypeError("reviewDataRoot, attachmentRoot, source, and taskId are required");
  const rule = ruleFor(stage, reviewTrack);
  for (const key of rule.required) if (!(key in materials) || !materialPresent(materials[key])) throw new Error(`MATERIAL_INCOMPLETE: missing or empty ${key}`);
  validateMaterialAllowlist(rule, materials, reviewRound);
  if (stage === "make-decision" && reviewTrack === "direction") {
    const allowed = new Set(rule.required);
    for (const key of Object.keys(materials)) if (!allowed.has(key)) throw new Error(`MATERIAL_FORBIDDEN: direction forbids unknown material ${key}`);
  }
  for (const key of rule.forbidden) if (key in materials) throw new Error(`MATERIAL_FORBIDDEN: ${stage}/${reviewTrack ?? "default"} forbids ${key}`);
  const changeMap = stage === "build-code" ? changeMapFor({ source, phaseId }) : null;
  validateV2AuthorityMaps(rule, materials, strictV2Maps, changeMap);
  const fixedInstructions = reviewInstructionsFor(stage, reviewTrack, uiScope, reviewRound);
  if (materials.review_instructions !== fixedInstructions) throw new Error("MATERIAL_FORBIDDEN: review_instructions must use the fixed stage template");
  validateVerifyEvidenceRoots(stage, materials);
  if (stage === "build-code") validateBuildCodeTestEvidence(materials, strictV2Maps);
  rejectDirectRawEvidence(materials);
  if (stage === "build-code") validateBuildCodeContextSelection({ source, materials });

  const packetRoot = resolve(attachmentRoot, ".wh-review-packets");
  mkdirSync(packetRoot, { recursive: true });
  const bundleRoot = mkdtempSync(join(packetRoot, `bundle-${stage}-${reviewTrack ?? "default"}-`));
  if (rule.source_bundle === "diff") {
    write(bundleRoot, "source.json", Buffer.from(`${JSON.stringify({
      target_commit: source.targetCommit,
      base_commit: source.baseCommit,
      base_tree: source.baseTree,
      captured_head: source.capturedHead,
      snapshot_tree: source.snapshotTree
    })}\n`));
    write(bundleRoot, "changes.diff", Buffer.from(source.diff));
    write(bundleRoot, "changed-files.json", Buffer.from(`${JSON.stringify(source.changedFiles)}\n`));
    write(bundleRoot, "change-map.json", Buffer.from(`${JSON.stringify(changeMap, null, 2)}\n`));
  }
  // Context is never inferred from repository size or file membership. Every
  // provider-visible source excerpt is named by a validated stage map anchor.
  writeSelectedContext({ bundleRoot, source, materials });

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

  for (const [key, value] of Object.entries(materials)) {
    const path = key === "review_instructions" ? "review-instructions.md" : `requirements/${key}.${typeof value === "string" ? "md" : "json"}`;
    write(bundleRoot, path, materialBytes(value));
  }
  freezeCanonicalEvidence({ bundleRoot, task, stage, materials });
  writeTestSummary({ bundleRoot, task, materials });
  const packetPlan = writePacketPlan({ bundleRoot, stage, reviewTrack, rule });
  const payloadFiles = filesUnder(bundleRoot);
  const entries = payloadFiles.map((path) => {
    const bytes = readFileSync(join(bundleRoot, ...path.split("/")));
    return { path, bytes: bytes.length, sha256: sha256(bytes) };
  });
  const manifest = canonicalMaterialManifest(entries);
  const materialId = sha256(Buffer.from(manifest, "utf8"));
  write(bundleRoot, "manifest.json", Buffer.from(manifest, "utf8"));
  const manifestBytes = Buffer.from(manifest, "utf8");
  const deliveryManifest = [...entries, { path: "manifest.json", bytes: manifestBytes.length, sha256: sha256(manifestBytes) }];
  const deliveryBytes = deliveryManifest.reduce((total, entry) => total + entry.bytes, 0);
  if (deliveryBytes !== packetPlan.delivery_bytes) throw new Error("MATERIAL_INCOMPLETE: packet plan delivery size does not match bundle");
  const sourcePrefix = relative(resolve(attachmentRoot), bundleRoot).replaceAll("\\", "/");
  return Object.freeze({ bundleRoot, attachmentRoot: resolve(attachmentRoot), sourcePrefix, materialId, files: Object.freeze([...payloadFiles, "manifest.json"]), manifest: Object.freeze(entries), deliveryManifest: Object.freeze(deliveryManifest), packetPlan: Object.freeze(packetPlan) });
}

function canonicalEvidenceDescriptors(stage, materials) {
  const canonicalRef = (value) => typeof value === "string" && /^(?:receipts|reviews\/results|evidence)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value) && !value.split("/").includes("..");
  const normalizeHash = (value) => typeof value === "string" ? value.replace(/^sha256:/, "") : undefined;
  const discovered = [];
  const add = (ref, hash, relation) => {
    if (!canonicalRef(ref) || !/^[a-f0-9]{64}$/.test(normalizeHash(hash) ?? "")) throw new Error(`MATERIAL_INCOMPLETE: invalid canonical evidence reference ${relation}`);
    discovered.push({ ref, expected: normalizeHash(hash), relation, from: `stage:${stage}` });
  };
  if (stage === "build-code" && materials.test_evidence && typeof materials.test_evidence === "object" && !Array.isArray(materials.test_evidence)) {
    const evidence = materials.test_evidence;
    if (Object.prototype.hasOwnProperty.call(evidence, "output_ref") || Object.prototype.hasOwnProperty.call(evidence, "output_hash")) throw new Error("MATERIAL_FORBIDDEN: build-code test_evidence must not expose raw output");
    add(evidence.receipt_ref, evidence.receipt_hash, "test_evidence.receipt");
  }
  if (stage === "verify-code") {
    const evidence = materials.acceptance_evidence;
    add(evidence.test_receipt_ref, evidence.test_receipt_hash, "acceptance_evidence.test_receipt");
    add(evidence.evidence_ref, evidence.evidence_hash, "acceptance_evidence.aggregate");
  }
  return discovered;
}

function freezeCanonicalEvidence({ bundleRoot, task, stage, materials }) {
  const discovered = canonicalEvidenceDescriptors(stage, materials);
  const canonicalRef = (value) => typeof value === "string" && /^(?:receipts|reviews\/results|evidence)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value) && !value.split("/").includes("..");
  if (discovered.length === 0) {
    write(bundleRoot, "canonical-evidence.json", Buffer.from("[]\n"));
    return;
  }
  const handle = assertTaskHandle(task);
  const records = new Map();
  for (const item of discovered) {
    if (!canonicalRef(item.ref) || !/^[a-f0-9]{64}$/.test(item.expected ?? "")) throw new Error(`MATERIAL_INCOMPLETE: invalid canonical evidence reference ${item.ref}`);
    const first = handle.readRecord(item.ref), firstHash = sha256(Buffer.from(first));
    if (firstHash !== item.expected) throw new Error(`MATERIAL_INCOMPLETE: canonical evidence hash mismatch ${item.ref}`);
    const second = handle.readRecord(item.ref);
    if (second !== first || sha256(Buffer.from(second)) !== firstHash) throw new Error(`MATERIAL_INCOMPLETE: canonical evidence changed while freezing ${item.ref}`);
    const existing = records.get(item.ref);
    if (existing) { existing.relations.push({ from: item.from, relation: item.relation }); continue; }
    const bundlePath = `canonical/${item.ref}`;
    write(bundleRoot, bundlePath, Buffer.from(first));
    const record = { source_ref: item.ref, bundle_path: bundlePath, bytes: Buffer.byteLength(first), sha256: firstHash, relations: [{ from: item.from, relation: item.relation }] };
    records.set(item.ref, record);
  }
  const evidenceManifest = [...records.values()].sort((a, b) => a.source_ref.localeCompare(b.source_ref));
  write(bundleRoot, "canonical-evidence.json", Buffer.from(`${JSON.stringify(evidenceManifest, null, 2)}\n`));

}
