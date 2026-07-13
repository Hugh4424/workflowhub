import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { contractPathAndHash } from "./lib/safe-id.mjs";
import { resolveRequiredSkills } from "./required-skill-resolver.mjs";

const VALID_SEVERITIES = new Set(["blocking", "important", "minor"]);
const VALID_VERDICTS = new Set(["pass", "revise_required", "escalate_to_human"]);
const VALID_PACKET_STATUSES = new Set(["complete", "material_incomplete", "hash_mismatch"]);
const HEX_HASH = /^[a-f0-9]{64}$/;
const HOLLOW = /^(?:已检查|检查完成|已通过|通过|pass(?:ed)?|ok|无问题|符合要求|见材料|如上|同上)[。.!！]?$/i;
const TOP_LEVEL = new Set(["packet_hash", "manifest_hash", "diff_sha256", "contract_hash", "skill_bundle_hash", "packet_status", "verdict", "summary", "findings", "checklist", "pass_items", "skillResults", "rootCause", "fixApproach"]);
const FINDING_FIELDS = new Set(["file", "line", "rule_id", "severity", "issue", "evidence", "suggested_fix", "late_finding"]);
const CHECK_FIELDS = new Set(["id", "passed", "evidence"]);
const PASS_FIELDS = new Set(["rule_id", "artifact_anchor", "evidence"]);
const SKILL_FIELDS = new Set(["skill", "bundle_hash", "mode", "checked_objects", "evidence", "conclusion"]);

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function object(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function concrete(value, minimum = 8) { return nonEmpty(value) && value.trim().length >= minimum && !HOLLOW.test(value.trim()); }
function concreteAnchor(value) { return concrete(value, 6) && /(?:[:#]|\bline\s*\d+\b|\bL\d+\b)/i.test(value); }
function safeRelativePath(value) { return nonEmpty(value) && !value.includes("\\") && !value.startsWith("/") && !value.split("/").some((part) => !part || part === "." || part === ".."); }
function unknownKeys(value, allowed) { return object(value) ? Object.keys(value).filter((key) => !allowed.has(key)) : []; }
function contractCheckIds(stage, reviewTrack) {
  let body = readFileSync(contractPathAndHash(stage).contractPath, "utf8");
  if (stage === "make-decision") {
    const start = body.indexOf(`## review_track: ${reviewTrack}`);
    const next = body.indexOf("## review_track:", start + 1);
    body = start < 0 ? "" : body.slice(start, next < 0 ? undefined : next);
  }
  return [...new Set(body.match(/\b(?:C|F|H)\d+\b/g) ?? [])];
}
function bundleHash(resolution) { return sha(canonical(resolution.definitions.map(({ name, bundle }) => ({ name, sha256: bundle.sha256 })))); }
function addUnknownErrors(errors, value, allowed, label) {
  for (const key of unknownKeys(value, allowed)) errors.push(`unknown ${label} property: ${key}`);
}

export function validateReviewerOutput({ stage, reviewTrack, ui = false, output, packet, intent } = {}) {
  const errors = [];
  const resolution = resolveRequiredSkills({ stage, reviewTrack, ui });
  if (!object(output)) return { valid: false, errors: ["output must be an object"], resolution };
  addUnknownErrors(errors, output, TOP_LEVEL, "output");
  for (const field of ["packet_hash", "manifest_hash", "diff_sha256", "contract_hash", "skill_bundle_hash"]) if (!HEX_HASH.test(output[field] ?? "")) errors.push(`invalid ${field}`);
  if (!VALID_PACKET_STATUSES.has(output.packet_status)) errors.push("invalid packet_status");
  if (!VALID_VERDICTS.has(output.verdict)) errors.push("invalid verdict");
  if (!concrete(output.summary)) errors.push("summary must contain concrete evidence");

  if (!Array.isArray(output.findings)) errors.push("findings must be an array");
  else output.findings.forEach((finding, index) => {
    if (!object(finding)) { errors.push(`invalid finding: ${index}`); return; }
    addUnknownErrors(errors, finding, FINDING_FIELDS, `finding ${index}`);
    if (!safeRelativePath(finding.file) || !Number.isInteger(finding.line) || finding.line < 1 || !nonEmpty(finding.rule_id) || !VALID_SEVERITIES.has(finding.severity)
      || !concrete(finding.issue) || !concrete(finding.evidence) || !concrete(finding.suggested_fix) || (finding.late_finding !== undefined && typeof finding.late_finding !== "boolean")) errors.push(`invalid finding: ${index}`);
  });
  if (output.verdict === "pass" && (output.findings ?? []).some((finding) => finding?.severity === "blocking")) errors.push("pass verdict cannot contain a blocking finding");
  if (output.verdict === "revise_required") {
    if (!concrete(output.rootCause)) errors.push("revise_required requires non-empty rootCause");
    if (!concrete(output.fixApproach)) errors.push("revise_required requires non-empty fixApproach");
  }

  const checklistIds = new Set(); const passedChecklistIds = new Set();
  if (!Array.isArray(output.checklist)) errors.push("checklist must be an array");
  else output.checklist.forEach((item, index) => {
    if (!object(item)) { errors.push(`invalid checklist item: ${index}`); return; }
    addUnknownErrors(errors, item, CHECK_FIELDS, `checklist item ${index}`);
    if (!nonEmpty(item.id) || typeof item.passed !== "boolean" || !concrete(item.evidence)) errors.push(`invalid checklist item: ${index}`);
    if (checklistIds.has(item.id)) errors.push(`duplicate checklist id: ${item.id}`); else checklistIds.add(item.id);
    if (item.passed === true) passedChecklistIds.add(item.id);
  });
  for (const id of contractCheckIds(stage, reviewTrack)) if (!checklistIds.has(id)) errors.push(`checklist missing contract check id: ${id}`);

  const passRuleIds = new Set(); const passBindings = new Set();
  if (!Array.isArray(output.pass_items)) errors.push("pass_items must be an array");
  else output.pass_items.forEach((item, index) => {
    if (!object(item)) { errors.push(`invalid pass item: ${index}`); return; }
    addUnknownErrors(errors, item, PASS_FIELDS, `pass item ${index}`);
    if (!nonEmpty(item.rule_id) || !concreteAnchor(item.artifact_anchor) || !concrete(item.evidence)) errors.push(`invalid pass item: ${index}`);
    const binding = `${item.rule_id}\0${item.artifact_anchor}`;
    if (passBindings.has(binding)) errors.push(`duplicate pass item: ${item.rule_id}`); else passBindings.add(binding);
    passRuleIds.add(item.rule_id);
    if (!passedChecklistIds.has(item.rule_id)) errors.push(`pass item does not match a passed checklist id: ${item.rule_id}`);
  });
  for (const id of passedChecklistIds) if (!passRuleIds.has(id)) errors.push(`missing pass item for passed checklist id: ${id}`);

  const requiredNames = new Set(resolution.definitions.map(({ name }) => name)); const seenSkills = new Set();
  if (!Array.isArray(output.skillResults)) errors.push("skillResults must be an array");
  else for (const [index, result] of output.skillResults.entries()) {
    if (!object(result)) { errors.push(`invalid skill result: ${index}`); continue; }
    addUnknownErrors(errors, result, SKILL_FIELDS, `skill result ${index}`);
    if (seenSkills.has(result.skill)) errors.push(`duplicate skill result: ${result.skill}`); else seenSkills.add(result.skill);
    if (!requiredNames.has(result.skill)) errors.push(`unexpected skill result: ${result.skill}`);
    const definition = resolution.definitions.find(({ name }) => name === result.skill);
    if (definition && result.bundle_hash !== definition.bundle.sha256) errors.push(`invalid skill bundle hash: ${result.skill}`);
    if (result.mode !== "lens-only") errors.push(`invalid skill mode: ${result.skill}`);
    if (!Array.isArray(result.checked_objects) || result.checked_objects.length === 0 || result.checked_objects.some((value) => !concreteAnchor(value)) || new Set(result.checked_objects).size !== result.checked_objects.length) errors.push(`missing checked objects: ${result.skill}`);
    if (!concrete(result.evidence)) errors.push(`missing skill evidence: ${result.skill}`);
    if (!concrete(result.conclusion)) errors.push(`missing skill conclusion: ${result.skill}`);
  }
  for (const name of requiredNames) if (!seenSkills.has(name)) errors.push(`missing required skill result: ${name}`);

  const expected = {
    packet_hash: packet?.packet_hash,
    manifest_hash: packet?.manifest_hash ?? intent?.material_manifest_hash,
    diff_sha256: packet?.diff_sha256,
    contract_hash: packet?.contract_hash ?? intent?.contract_hash,
    skill_bundle_hash: packet?.skill_bundle_hash ?? intent?.skill_bundle_hash,
  };
  for (const [field, value] of Object.entries(expected)) if (value !== undefined && output[field] !== value) errors.push(`${field} does not match packet`);
  if (packet && intent) {
    if (packet.manifest_hash !== intent.material_manifest_hash) errors.push("packet manifest_hash does not match intent");
    if (packet.contract_hash !== intent.contract_hash) errors.push("packet contract_hash does not match intent");
    if (packet.skill_bundle_hash !== intent.skill_bundle_hash) errors.push("packet skill_bundle_hash does not match intent");
  }
  if (output.skill_bundle_hash !== bundleHash(resolution)) errors.push("skill_bundle_hash does not match resolution");
  return { valid: errors.length === 0, errors, resolution };
}
