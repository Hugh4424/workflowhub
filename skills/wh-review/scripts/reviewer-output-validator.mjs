import { projectStageContract } from "./lib/safe-id.mjs";
import { resolveRequiredSkills } from "./required-skill-resolver.mjs";
import { SchemaValidationError, validateSchema } from "./schema-validator.mjs";

function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function evidenceText(value) { return String(value ?? "").normalize("NFKC").toLowerCase().replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim(); }
function hollowEvidence(value) {
  const normalized = evidenceText(value);
  if (!normalized) return true;
  return normalized.replace(/已|全部|均|检查|核对|审查|完成|通过|符合|要求|无|问题|正常|见材料|如上|同上/g, "").replace(/\bpass(?:ed)?\b|\bok\b/gi, "").replace(/\s/g, "").length === 0;
}
function concrete(value, minimum = 8) { return nonEmpty(value) && value.trim().length >= minimum && !hollowEvidence(value); }
function safeRelativePath(value) { return nonEmpty(value) && !value.includes("\\") && !value.startsWith("/") && !value.split("/").some((part) => !part || part === "." || part === ".."); }
function concreteAnchor(value, destinations) {
  if (!concrete(value, 6) || !safeRelativePath(value)) return false;
  return destinations.some((destination) => value === destination || value.startsWith(`${destination}:`) || value.startsWith(`${destination}#`));
}
function contractRuleIds(stage, reviewTrack, frozenRules) {
  const projected = frozenRules ?? projectStageContract(stage, reviewTrack);
  const allIds = projected.allIds; const hardIds = projected.hardIds;
  if (!Array.isArray(allIds) || !Array.isArray(hardIds) || allIds.length === 0 || hardIds.length === 0 || hardIds.some((id) => !allIds.includes(id))) throw new Error(`stage contract requires non-empty C/H rule ids: ${stage}/${reviewTrack ?? "default"}`);
  if (new Set(allIds).size !== allIds.length) throw new Error(`stage contract has duplicate rule ids: ${stage}/${reviewTrack ?? "default"}`);
  return { allIds, allIdSet: new Set(allIds), hardIds };
}
export function validateReviewerOutput({ stage, reviewTrack, ui = false, output, packet, intent, contractRules, providerVisibleDestinations } = {}) {
  const errors = [];
  if (!Array.isArray(providerVisibleDestinations) || providerVisibleDestinations.length === 0 || providerVisibleDestinations.some((value) => !safeRelativePath(value)) || new Set(providerVisibleDestinations).size !== providerVisibleDestinations.length) throw new TypeError("providerVisibleDestinations must be a non-empty unique safe relative path collection");
  const resolution = resolveRequiredSkills({ stage, reviewTrack, ui });
  const selectedRules = contractRuleIds(stage, reviewTrack, contractRules);
  try { validateSchema("reviewer-output", output); }
  catch (error) {
    if (error instanceof SchemaValidationError) return { valid: false, errors: [`${error.code}:${error.pointer || "/"}`], resolution };
    throw error;
  }
  if (!concrete(output.summary)) errors.push("summary must contain concrete evidence");

  output.findings.forEach((finding, index) => {
    if (!safeRelativePath(finding.file) || !concrete(finding.issue) || !concrete(finding.evidence) || !concrete(finding.suggested_fix)) errors.push(`invalid finding: ${index}`);
    if (!selectedRules.allIdSet.has(finding.rule_id) && finding.severity !== "minor") errors.push(`external finding must be minor: ${finding.rule_id}`);
  });
  if (output.verdict === "pass" && (output.findings ?? []).some((finding) => finding?.severity === "blocking")) errors.push("pass verdict cannot contain a blocking finding");
  if (output.verdict === "revise_required") {
    if (!concrete(output.rootCause)) errors.push("revise_required requires non-empty rootCause");
    if (!concrete(output.fixApproach)) errors.push("revise_required requires non-empty fixApproach");
  }

  const checklistIds = new Set(); const passedChecklistIds = new Set();
  output.checklist.forEach((item, index) => {
    if (!concrete(item.evidence)) errors.push(`invalid checklist item: ${index}`);
    if (checklistIds.has(item.id)) errors.push(`duplicate checklist id: ${item.id}`); else checklistIds.add(item.id);
    if (!selectedRules.allIdSet.has(item.id)) errors.push(`checklist id is not in selected contract: ${item.id}`);
    if (item.passed === true) passedChecklistIds.add(item.id);
  });
  for (const id of selectedRules.allIds) if (!checklistIds.has(id)) errors.push(`checklist missing contract rule id: ${id}`);

  const passRuleIds = new Set(); const passBindings = new Set();
  output.pass_items.forEach((item, index) => {
    if (!concreteAnchor(item.artifact_anchor, providerVisibleDestinations) || !concrete(item.evidence)) errors.push(`invalid pass item: ${index}`);
    const binding = `${item.rule_id}\0${item.artifact_anchor}`;
    if (passBindings.has(binding)) errors.push(`duplicate pass item: ${item.rule_id}`); else passBindings.add(binding);
    passRuleIds.add(item.rule_id);
    if (!selectedRules.allIdSet.has(item.rule_id)) errors.push(`pass item rule id is not in selected contract: ${item.rule_id}`);
    if (!passedChecklistIds.has(item.rule_id)) errors.push(`pass item does not match a passed checklist id: ${item.rule_id}`);
  });
  for (const id of passedChecklistIds) if (!passRuleIds.has(id)) errors.push(`missing pass item for passed checklist id: ${id}`);
  for (const id of selectedRules.hardIds) if (checklistIds.has(id) && !passedChecklistIds.has(id) && !(output.findings ?? []).some((finding) => finding?.rule_id === id && finding.severity === "blocking")) errors.push(`failed hard invariant requires blocking finding: ${id}`);

  const requiredNames = new Set(resolution.definitions.map(({ name }) => name)); const seenSkills = new Set();
  for (const [index, result] of output.skillResults.entries()) {
    if (seenSkills.has(result.skill)) errors.push(`duplicate skill result: ${result.skill}`); else seenSkills.add(result.skill);
    if (!requiredNames.has(result.skill)) errors.push(`unexpected skill result: ${result.skill}`);
    if (result.checked_objects.some((value) => !concreteAnchor(value, providerVisibleDestinations))) errors.push(`missing checked objects: ${result.skill}`);
    if (!concrete(result.evidence)) errors.push(`missing skill evidence: ${result.skill}`);
    if (!concrete(result.conclusion)) errors.push(`missing skill conclusion: ${result.skill}`);
  }
  for (const name of requiredNames) if (!seenSkills.has(name)) errors.push(`missing required skill result: ${name}`);

  if (packet && intent) {
    if (packet.manifest_hash !== intent.material_manifest_hash) errors.push("packet manifest_hash does not match intent");
    if (packet.contract_hash !== intent.contract_hash) errors.push("packet contract_hash does not match intent");
    if (packet.skill_bundle_hash !== intent.skill_bundle_hash) errors.push("packet skill_bundle_hash does not match intent");
  }
  return { valid: errors.length === 0, errors, resolution };
}
