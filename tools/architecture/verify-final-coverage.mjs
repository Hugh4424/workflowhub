import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { governanceTreeHash } from "./inventory.mjs";
import { auditReferences, classifyReferenceAudit } from "./reference-audit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function validateHashCheckedRef(evidence, label, errors, { phase9Only = false, testSource = false } = {}) {
  if (!evidence || typeof evidence.ref !== "string" || !/^[a-f0-9]{64}$/.test(evidence.sha256 ?? "")) {
    errors.push(`${label} has malformed evidence ref`);
    return;
  }
  if (phase9Only && !evidence.ref.startsWith("evidence/phase-9/")) {
    errors.push(`${label} must reference archived phase-9 evidence: ${evidence.ref}`);
    return;
  }
  if (testSource && (!evidence.ref.startsWith("tests/") || !/\.test\.[cm]?[jt]sx?$/.test(evidence.ref))) {
    errors.push(`${label} must reference a focused tracked test source: ${evidence.ref}`);
    return;
  }
  const target = path.resolve(ROOT, evidence.ref);
  const relative = path.relative(ROOT, target);
  if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(target)) {
    errors.push(`${label} evidence is missing: ${evidence.ref}`);
    return;
  }
  if (sha256(fs.readFileSync(target)) !== evidence.sha256) errors.push(`${label} evidence hash mismatch: ${evidence.ref}`);
}

function executionRanOracles(execution, oracles, label, errors) {
  if (!Array.isArray(oracles) || oracles.length === 0) return;
  if (!execution?.ref?.endsWith(".json")) {
    errors.push(`${label} execution must be a canonical Vitest JSON report`);
    return;
  }
  try {
    const result = JSON.parse(fs.readFileSync(path.resolve(ROOT, execution.ref), "utf8"));
    // A phase-9 execution must be an actual successful Vitest JSON report,
    // not an arbitrary JSON object containing a passing-looking assertion.
    // This is intentionally a small structural check; the hash-bound archive
    // remains the source of the bytes, while the report shape proves that the
    // referenced file is an observed test execution rather than a hand-written
    // coverage claim.
    if (result?.success !== true
        || !Number.isInteger(result.numTotalTests) || result.numTotalTests <= 0
        || result.numFailedTests !== 0
        || result.numPassedTests !== result.numTotalTests
        || !Array.isArray(result.testResults) || result.testResults.length === 0
        || result.testResults.some((suite) => suite?.status !== "passed" || !Array.isArray(suite.assertionResults))) {
      errors.push(`${label} execution record is not a successful canonical Vitest JSON report`);
      return;
    }
    for (const oracle of oracles) {
      const expected = path.resolve(ROOT, oracle.ref);
      const found = (result.testResults ?? []).some((entry) => path.resolve(String(entry?.name ?? "")) === expected
        && (entry.assertionResults ?? []).every((assertion) => assertion.status === "passed"));
      if (!found) errors.push(`${label} execution did not run its oracle source: ${oracle.ref}`);
    }
  } catch {
    errors.push(`${label} execution record is not readable test output`);
  }
}

function itemOracles(item, label, errors) {
  const hasSingle = Object.hasOwn(item ?? {}, "oracle");
  const hasMany = Object.hasOwn(item ?? {}, "oracles");
  if (hasSingle === hasMany) {
    errors.push(`${label} must declare exactly one of oracle or oracles`);
    return [];
  }
  if (hasSingle) {
    validateHashCheckedRef(item.oracle, `${label} oracle`, errors, { testSource: true });
    return [item.oracle];
  }
  if (!Array.isArray(item.oracles) || item.oracles.length === 0) {
    errors.push(`${label} oracles must be a non-empty array`);
    return [];
  }
  const seen = new Set();
  for (const [index, oracle] of item.oracles.entries()) {
    if (typeof oracle?.ref === "string" && seen.has(oracle.ref)) {
      errors.push(`${label} oracles contains duplicate source: ${oracle.ref}`);
    }
    if (typeof oracle?.ref === "string") seen.add(oracle.ref);
    validateHashCheckedRef(oracle, `${label} oracles[${index}]`, errors, { testSource: true });
  }
  return item.oracles;
}

function requiredIds(value) {
  if (/^\d+$/.test(String(value ?? ""))) {
    const count = Number(value);
    if (!Number.isSafeInteger(count) || count < 1) throw new Error(`invalid --require-ac value: ${value}`);
    return Array.from({ length: count }, (_, index) => `AC-${String(index + 1).padStart(3, "0")}`);
  }
  const match = String(value ?? "").match(/^(AC-\d+)(?:\.\.(AC-\d+))?$/);
  if (!match) throw new Error(`invalid --require-ac value: ${value}`);
  const first = Number(match[1].slice(3));
  const last = match[2] ? Number(match[2].slice(3)) : first;
  if (last < first) throw new Error("--require-ac range must be ascending");
  return Array.from({ length: last - first + 1 }, (_, index) => `AC-${String(first + index).padStart(2, "0")}`);
}

const FINAL_VERIFICATION_FLAGS = Object.freeze(new Set([
  "--governance",
  "--handoff",
  "--require-same-review-tree",
  "--require-review-raw-hash",
  "--require-reference-clean",
  "--progress",
  "--bind-current-tree",
  "--allow-incomplete",
]));

export function parseFinalVerificationArgs(argv = []) {
  const errors = [];
  const flags = new Set();
  let required_ac = null;
  for (const argument of argv) {
    const name = argument.split("=", 1)[0];
    if (name === "--require-ac") {
      try { required_ac = requiredIds(argument.slice("--require-ac=".length)); }
      catch { errors.push("unknown_argument"); }
      continue;
    }
    if (name === "--spec") continue;
    if (FINAL_VERIFICATION_FLAGS.has(argument)) {
      flags.add(argument);
      continue;
    }
    errors.push("unknown_argument");
  }
  return { flags, required_ac, errors: [...new Set(errors)] };
}

export function validateFinalCoverageRequirements({ coverage, required_ids = [] } = {}) {
  const errors = [];
  const qualityVerify = coverage?.quality_verify;
  let qualityRecords = new Map();
  if (!qualityVerify || typeof qualityVerify !== "object" || Array.isArray(qualityVerify)) {
    errors.push("quality_verify_missing");
  } else {
    const qualityPath = path.resolve(ROOT, qualityVerify.ref ?? "");
    const relative = path.relative(ROOT, qualityPath);
    if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(qualityPath)
        || !/^[a-f0-9]{64}$/.test(qualityVerify.sha256 ?? "")) {
      errors.push("quality_verify_unresolvable");
    } else if (sha256(fs.readFileSync(qualityPath)) !== qualityVerify.sha256) {
      errors.push("quality_verify_unresolvable");
    } else {
      try {
        const value = JSON.parse(fs.readFileSync(qualityPath, "utf8"));
        const requiredFields = ["schema_version", "task_id", "stage", "ac_id", "status", "method", "evidence_ref", "evidence_hash", "material_digest", "created_at"];
        if (value.schema_version !== "quality-verify.v1"
            || requiredFields.some((field) => value[field] === undefined)
            || !/^[a-f0-9]{64}$/.test(value.evidence_hash ?? "")
            || !/^[a-f0-9]{64}$/.test(value.material_digest ?? "")
            || !/^[a-f0-9]{64}$/.test(qualityVerify.sha256)) {
          errors.push("quality_verify_schema_invalid");
        } else if (!Array.isArray(value.acceptance_criteria)) {
          errors.push("quality_verify_ac_records_missing");
        } else {
          qualityRecords = new Map(value.acceptance_criteria.map((record) => [record?.ac_id, record]));
        }
      } catch {
        errors.push("quality_verify_schema_invalid");
      }
    }
  }
  const items = new Map((coverage?.items ?? []).map((item) => [item?.acceptance_criterion_id, item]));
  for (const id of required_ids) {
    const item = items.get(id);
    if (!item) {
      errors.push("missing_ac");
      continue;
    }
    const qualityRecord = qualityRecords.get(id);
    if (!qualityRecord || !["passed", "failed", "unknown", "unavailable", "incomplete", "missing"].includes(qualityRecord.status)) {
      errors.push("ac_quality_fact_missing");
    }
    const detail = String(item.detail ?? item.result ?? "").trim();
    if (/^(?:see tests?|evidence(?: only)?|tbd|n\/a|covered)$/i.test(detail)) {
      errors.push("ac_evidence_generic_fill");
      continue;
    }
    const evidence = item.evidence ?? item.oracle;
    if (!evidence?.ref || !/^[a-f0-9]{64}$/.test(evidence.sha256 ?? "")) {
      errors.push("ac_evidence_unresolvable");
      continue;
    }
    const target = path.resolve(ROOT, evidence.ref);
    if (!fs.existsSync(target) || sha256(fs.readFileSync(target)) !== evidence.sha256) {
      errors.push("ac_evidence_unresolvable");
    }
  }
  return errors;
}

export function validateReviewTreeBinding({ manifest, actual_tree_hash } = {}) {
  if (!manifest || manifest.review_tree_hash !== actual_tree_hash) return ["review_tree_drift"];
  return [];
}

export function validateReviewRawHash({ review } = {}) {
  if (!review || !/^evidence\/(?:final|phase-[^/]+)\//.test(review.raw_ref ?? "")
      || !/^[a-f0-9]{64}$/.test(review.raw_sha256 ?? "")) return ["review_raw_hash_missing"];
  return [];
}

export function validateReferenceClean({ violations = [], allowed_violations = [] } = {}) {
  return violations.length || allowed_violations.length ? ["reference_consumer_residual"] : [];
}

export function validateHandoffBinding({ artifacts, required = ["deletion_list", "retention_list", "m14_m17_impact", "change_summary"] } = {}) {
  if (!artifacts || Object.keys(artifacts).length === 0) return ["handoff_incomplete"];
  if (required.some((name) => !artifacts[name])) return ["final_evidence_binding_drift"];
  const errors = [];
  for (const name of required) {
    const item = artifacts[name];
    const expectedRef = finalArtifactEntries()[name];
    if (typeof item.ref !== "string" || item.ref !== expectedRef || !/^[a-f0-9]{64}$/.test(item.sha256 ?? "")) {
      errors.push("final_evidence_binding_drift");
      continue;
    }
    const target = path.resolve(ROOT, item.ref);
    if (!fs.existsSync(target) || sha256(fs.readFileSync(target)) !== item.sha256) errors.push("final_evidence_binding_drift");
  }
  return [...new Set(errors)];
}

export function validateGovernanceContract({
  constitution = "",
  checklist = "",
  context = "",
  constitution_ids = [...String(constitution).matchAll(/^###\s+((?:F|Q|S)\d+)/gm)].map((match) => match[1]),
  checklist_ids = [...String(checklist).matchAll(/\*\*((?:F|Q|S)\d+)\*\*/g)].map((match) => match[1]),
  expected_version = "1.5.0",
  expected_revision = "2026-07-28",
  expected_count = 21,
  agents = "",
  require_agents = false,
} = {}) {
  const errors = [];
  if (!new RegExp(`(?:\\*\\*)?Version(?:\\*\\*)?:\\s*${expected_version}`).test(String(constitution))) errors.push("constitution_version_drift");
  if (!String(constitution).includes(expected_revision)) errors.push("constitution_revision_drift");
  if (!/旧.*(?:→|到).*新.*(?:映射|mapping)/i.test(`${constitution}\n${context}`)) errors.push("constitution_mapping_drift");
  const count = String(checklist).match(/条目数[^\d]*(\d+)/)?.[1];
  if (Number(count) !== expected_count || checklist_ids.length !== expected_count && constitution_ids.length === expected_count) {
    errors.push("checklist_count_drift");
  }
  const expectedIds = [...new Set(constitution_ids)].sort();
  const actualIds = [...new Set(checklist_ids)].sort();
  if (expectedIds.join(",") !== actualIds.join(",")) errors.push("checklist_entry_drift");
  if (require_agents) {
    const currentRules = String(agents);
    if (!/decision-log\.md[\s\S]*spec\.md[\s\S]*plan\.md[\s\S]*tasks\.md/.test(currentRules)) errors.push("agents_material_authority_drift");
    if (!/(?:测试|审查|历史)[\s\S]*(?:事实|证据)[\s\S]*(?:推进|许可证|授权)/.test(currentRules)) errors.push("agents_quality_progression_drift");
    if (!/(?:历史|history)[\s\S]*(?:只读|read-only)/i.test(currentRules)) errors.push("agents_history_boundary_drift");
    if (!/provenance/i.test(currentRules)) errors.push("agents_provenance_drift");
    if (!/(?:新|new)[\s\S]*(?:机制|mechanism)[\s\S]*(?:登记|consumer|owner)/i.test(currentRules)) errors.push("agents_new_mechanism_drift");
  }
  return [...new Set(errors)];
}

export function extractAcceptanceCriteria(specText) {
  return [...String(specText).matchAll(/^\s*-\s*\[[ xX]\]\s*\*\*(AC-\d+)\*\*/gm)]
    .map((match) => match[1]).filter((id, index, all) => all.indexOf(id) === index);
}

export function validateCoverage({ specText, coverage, required = [], currentTree = null, mode = "final" } = {}) {
  const errors = [];
  if (!new Set(["final", "progress"]).has(mode)) errors.push(`invalid coverage mode: ${mode}`);
  if (mode === "progress" && currentTree) errors.push("progress coverage cannot bind the current tree");
  const specIds = extractAcceptanceCriteria(specText);
  const wanted = required.length ? required : specIds;
  if (!coverage || coverage.schema_version !== "workflowhub-final-coverage.v2") errors.push("invalid final coverage schema");
  if (JSON.stringify(specIds) !== JSON.stringify([...wanted].filter((id) => specIds.includes(id)))) {
    errors.push("spec acceptance criteria do not match required set");
  }
  if (currentTree && coverage?.snapshot_tree !== currentTree) errors.push("coverage snapshot tree does not match current tree");
  const rawItems = Array.isArray(coverage?.items) ? coverage.items : [];
  const itemIds = rawItems.map((item) => item?.acceptance_criterion_id);
  const duplicateIds = [...new Set(itemIds.filter((id, index) => id && itemIds.indexOf(id) !== index))];
  for (const id of duplicateIds) errors.push(`duplicate acceptance criterion: ${id}`);
  const items = new Map(rawItems.map((item) => [item.acceptance_criterion_id, item]));
  for (const id of wanted) {
    const item = items.get(id);
    if (!item) { errors.push(`${id} is missing from direct coverage`); continue; }
    if (!new Set(["covered", "focused_pass", "deferred"]).has(item.status)) errors.push(`${id} has invalid coverage status`);
    if (item.status === "deferred" && mode !== "progress") errors.push(`${id} is deferred; final coverage requires direct verification`);
    // Simple criteria name one test.  Matrix criteria name a fixed, deduplicated
    // oracle set; every member must appear in the same observed execution.
    const oracles = itemOracles(item, id, errors);
    validateHashCheckedRef(item.execution, `${id} execution`, errors, { phase9Only: true });
    executionRanOracles(item.execution, oracles, id, errors);
  }
  const unexpected = [...items.keys()].filter((id) => !wanted.includes(id));
  for (const id of unexpected) errors.push(`unexpected acceptance criterion: ${id}`);
  return errors;
}

const FINAL_GATE_COMMANDS = Object.freeze([
  "inventory",
  "clean_install",
  "npm_test",
  "npm_run_check",
  "focused_final",
  "complexity_hard_gates",
  "diff_check",
]);

function validateGateEvidenceKind(command, evidence, errors) {
  if (evidence?.kind !== command) {
    errors.push(`final gate ${command} evidence kind must be ${command}`);
  }
}

function validateGateExecutionResult(command, evidence, errors) {
  if (!Number.isInteger(evidence?.exit_code)) {
    errors.push(`final gate ${command} evidence must record an integer exit_code`);
  } else if (evidence.exit_code !== 0) {
    errors.push(`final gate ${command} execution failed with exit_code ${evidence.exit_code}`);
  }
}

export function validateFinalGates({ gates, currentTree = null, allowIncomplete = false } = {}) {
  const errors = [];
  if (!gates || gates.schema_version !== "workflowhub-final-gates.v2") errors.push("invalid final gates schema");
  if (!new Set(["passed", "incomplete"]).has(gates?.status)) errors.push("final gates status is invalid");
  if (gates?.status === "incomplete" && !allowIncomplete) errors.push("final gates are incomplete");
  if (gates?.status === "passed" && (gates?.missing_required_commands ?? []).length !== 0) {
    errors.push("passed final gates cannot declare missing commands");
  }
  if (currentTree && gates?.snapshot_tree !== currentTree) errors.push("final gates snapshot tree does not match current tree");
  const commands = gates?.commands;
  if (!commands || typeof commands !== "object") {
    errors.push("final gates commands are missing");
    return errors;
  }
  const missing = gates?.missing_required_commands ?? [];
  if (!Array.isArray(missing) || missing.some((command) => !FINAL_GATE_COMMANDS.includes(command))
      || new Set(missing).size !== missing.length) {
    errors.push("final gates missing_required_commands is invalid");
    return errors;
  }
  if (gates?.status === "incomplete" && missing.length === 0) errors.push("incomplete final gates must declare missing commands");
  for (const command of FINAL_GATE_COMMANDS.filter((name) => !missing.includes(name))) {
    validateHashCheckedRef(commands[command], `final gate ${command}`, errors, { phase9Only: true });
    validateGateEvidenceKind(command, commands[command], errors);
    validateGateExecutionResult(command, commands[command], errors);
  }
  for (const command of Object.keys(commands)) {
    if (!FINAL_GATE_COMMANDS.includes(command) || missing.includes(command)) errors.push(`unexpected final gate command: ${command}`);
  }
  return errors;
}

function finalArtifactEntries() {
  return {
    deletion_list: "evidence/final/deletion-list.json",
    retention_list: "evidence/final/retention-list.json",
    m14_m17_impact: "evidence/final/m14-m17-impact.md",
    change_summary: "evidence/final/change-summary.md",
  };
}

function loadFinalArtifacts() {
  const manifestPath = path.resolve(ROOT, "evidence/phase-7/governance-handoff.json");
  if (!fs.existsSync(manifestPath)) return {};
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return manifest?.artifacts && typeof manifest.artifacts === "object" ? manifest.artifacts : {};
  } catch {
    return {};
  }
}

function loadGovernanceContract() {
  const constitution = fs.readFileSync(path.resolve(ROOT, "CONSTITUTION.md"), "utf8");
  const checklist = fs.readFileSync(path.resolve(ROOT, "constitution-checklist.md"), "utf8");
  const context = fs.readFileSync(path.resolve(ROOT, "CONTEXT.md"), "utf8");
  const agents = fs.readFileSync(path.resolve(ROOT, "AGENTS.md"), "utf8");
  return {
    constitution,
    checklist,
    context,
    agents,
    require_agents: true,
    constitution_ids: [...constitution.matchAll(/^###\s+((?:F|Q|S)\d+)/gm)].map((match) => match[1]),
    checklist_ids: [...checklist.matchAll(/\*\*((?:F|Q|S)\d+)(?:\s|\*)/g)].map((match) => match[1]),
  };
}

function enhancedVerification({ argv }) {
  const parsed = parseFinalVerificationArgs(argv);
  if (parsed.errors.length) return { errors: parsed.errors };
  const errors = [];
  const flags = parsed.flags;
  if (flags.has("--governance")) errors.push(...validateGovernanceContract(loadGovernanceContract()));
  if (flags.has("--handoff")) errors.push(...validateHandoffBinding({ artifacts: loadFinalArtifacts() }));
  if (parsed.required_ac) {
    const specPath = argv.find((arg) => arg.startsWith("--spec="))?.slice("--spec=".length)
      ?? "specs/workflowhub-complexity-governance-v3-20260802/spec.md";
    const specText = fs.readFileSync(path.resolve(ROOT, specPath), "utf8");
    const coveragePath = path.resolve(ROOT, "evidence/final/final-coverage.json");
    let coverage = null;
    try { coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8")); } catch { /* classify as missing AC below */ }
    errors.push(...validateFinalCoverageRequirements({ coverage, required_ids: parsed.required_ac }));
    if (flags.has("--require-same-review-tree")) {
      let manifest = null;
      try { manifest = JSON.parse(fs.readFileSync(path.resolve(ROOT, "evidence/final/review-tree-manifest.json"), "utf8")); } catch { /* drift */ }
      errors.push(...validateReviewTreeBinding({ manifest, actual_tree_hash: governanceTreeHash() }));
    }
    if (flags.has("--require-review-raw-hash")) {
      let review = null;
      try { review = JSON.parse(fs.readFileSync(path.resolve(ROOT, "evidence/final/review.json"), "utf8")); } catch { /* missing */ }
      errors.push(...validateReviewRawHash({ review }));
    }
    if (flags.has("--require-reference-clean")) {
      // The final flag deliberately has no KEEP allow-list. Run the real
      // reference audit so the final result reflects current consumers rather
      // than a synthetic sentinel.
      const referenceAudit = classifyReferenceAudit(auditReferences(), new Set());
      errors.push(...validateReferenceClean(referenceAudit));
    }
    if (!specText) errors.push("missing_ac");
  }
  return { errors: [...new Set(errors)] };
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.some((arg) => ["--governance", "--handoff", "--require-same-review-tree", "--require-review-raw-hash", "--require-reference-clean"].includes(arg))) {
    const result = enhancedVerification({ argv });
    if (result.errors.length) {
      console.error(result.errors.join("\n"));
      process.exitCode = 1;
      return;
    }
    console.log("final governance coverage ok");
    return;
  }
  const specArg = process.argv.find((arg) => arg.startsWith("--spec="));
  const requiredArg = process.argv.find((arg) => arg.startsWith("--require-ac="));
  if (!specArg || !requiredArg) {
    console.error("usage: node tools/architecture/verify-final-coverage.mjs --spec=<spec.md> --require-ac=AC-01..AC-15 [--bind-current-tree | --progress]");
    process.exitCode = 2;
    return;
  }
  try {
    const required = requiredIds(requiredArg.slice("--require-ac=".length));
    const specText = fs.readFileSync(path.resolve(ROOT, specArg.slice("--spec=".length)), "utf8");
    const coveragePath = path.resolve(ROOT, "evidence/phase-9/final-coverage.json");
    const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
    const gatesPath = path.resolve(ROOT, "evidence/phase-9/final-gates.json");
    const gates = JSON.parse(fs.readFileSync(gatesPath, "utf8"));
    const progress = process.argv.includes("--progress");
    const bindCurrentTree = process.argv.includes("--bind-current-tree");
    if (progress && bindCurrentTree) throw new Error("--progress cannot be combined with --bind-current-tree");
    const tree = bindCurrentTree ? governanceTreeHash() : null;
    const errors = [
      ...validateCoverage({ specText, coverage, required, currentTree: tree, mode: progress ? "progress" : "final" }),
      ...validateFinalGates({ gates, currentTree: tree }),
    ];
    if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; return; }
    const deferred = coverage.items.filter((item) => item.status === "deferred").length;
    console.log(`${progress ? "progress" : "final"} coverage ok: ${required.length} AC, deferred=${deferred}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
