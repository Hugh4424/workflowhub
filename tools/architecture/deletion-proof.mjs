import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PLAN_PATH = resolve(ROOT, "docs/architecture/deletion-plan.json");

const REQUIRED_FIELDS = [
  "id",
  "title",
  "candidatePaths",
  "consumers",
  "consumerAudit",
  "retainedQualitySemantics",
  "replacementPath",
  "replacementAudit",
  "negativeOracle",
  "faultInjection",
  "multicaCompatibility",
  "legacyTaskImpact",
  "rollbackEvidence",
  "userConfirmation",
];

function defaultTree(root) {
  return execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: root }).toString("utf8").trim();
}

function safePath(root, path) {
  if (typeof path !== "string" || path.trim() === "" || isAbsolute(path)) return null;
  const candidate = resolve(root, path);
  const rel = relative(root, candidate);
  if (rel.startsWith("..") || isAbsolute(rel) || !existsSync(candidate)) return null;
  const realRoot = realpathSync(root);
  const realCandidate = realpathSync(candidate);
  const realRel = relative(realRoot, realCandidate);
  return realRel.startsWith("..") || isAbsolute(realRel) ? null : realCandidate;
}

function nonPendingString(value) {
  return typeof value === "string"
    && value.trim() !== ""
    && !value.trim().toLowerCase().startsWith("pending");
}

function boundEvidence(binding, { evidenceRoot, currentTree }, expectedKind, subjectPaths) {
  if (!binding || typeof binding !== "object" || Array.isArray(binding)
      || !nonPendingString(binding.ref)
      || !/^[a-f0-9]{64}$/.test(binding.sha256 ?? "")
      || binding.snapshot_tree !== currentTree) return false;
  const path = safePath(evidenceRoot, binding.ref);
  if (!path) return false;
  const raw = readFileSync(path, "utf8");
  if (createHash("sha256").update(raw).digest("hex") !== binding.sha256) return false;
  try {
    const evidence = JSON.parse(raw);
    return evidence.schema_version === "proof-evidence.v1"
      && evidence.snapshot_tree === currentTree
      && evidence.kind === expectedKind
      && JSON.stringify([...(evidence.subject_paths ?? [])].sort())
        === JSON.stringify([...subjectPaths].sort());
  } catch {
    return false;
  }
}

function fieldProven(field, card, context) {
  const value = card?.[field];
  if (field === "id" || field === "title" || field === "multicaCompatibility"
      || field === "legacyTaskImpact") return nonPendingString(value);
  if (field === "candidatePaths") {
    return Array.isArray(value) && value.length > 0 && value.every((path) => safePath(context.root, path));
  }
  if (field === "consumers") {
    return Array.isArray(value) && value.every((path) => safePath(context.root, path));
  }
  if (field === "consumerAudit" || field === "replacementAudit" || field === "rollbackEvidence") {
    const expectedKind = {
      consumerAudit: "consumer-audit",
      replacementAudit: "replacement-audit",
      rollbackEvidence: "rollback",
    }[field];
    const subjectPaths = field === "replacementAudit" ? [card.replacementPath] : card.candidatePaths;
    return boundEvidence(value, context, expectedKind, subjectPaths);
  }
  if (field === "retainedQualitySemantics" || field === "faultInjection") {
    return Array.isArray(value) && value.length > 0 && value.every(nonPendingString);
  }
  if (field === "replacementPath") return Boolean(safePath(context.root, value));
  if (field === "negativeOracle") {
    return value && typeof value === "object"
      && Boolean(safePath(context.root, value.path))
      && boundEvidence(value.evidence, context, "negative-oracle", [value.path]);
  }
  if (field === "userConfirmation") {
    return value?.status === "confirmed"
      && boundEvidence(value.evidence, context, "confirmation", card.candidatePaths);
  }
  return false;
}

export function evaluateDeletionProof(
  card,
  {
    root = ROOT,
    evidenceRoot = process.env.WORKFLOWHUB_PROOF_EVIDENCE_ROOT ?? ROOT,
    currentTree = process.env.WORKFLOWHUB_PROOF_SNAPSHOT_TREE ?? defaultTree(root),
  } = {},
) {
  const context = {
    root: realpathSync(root),
    evidenceRoot: realpathSync(evidenceRoot),
    currentTree,
  };
  const missing = REQUIRED_FIELDS.filter((field) => !fieldProven(field, card, context));
  return {
    decision: missing.length === 0 ? "DELETE" : "KEEP",
    missing,
  };
}

export function validateDeletionPlan(plan, options) {
  const errors = [];
  if (plan?.schema_version !== "workflowhub-deletion-plan.v1") {
    errors.push("invalid schema_version");
  }
  if (!Array.isArray(plan?.candidates)) {
    return [...errors, "candidates must be an array"];
  }
  if (plan.candidates.length !== 12) errors.push("exactly twelve deletion candidates are required");
  const seen = new Set();
  for (const [index, card] of plan.candidates.entries()) {
    const expectedId = `DEL-${String(index + 1).padStart(2, "0")}`;
    if (card.id !== expectedId) errors.push(`candidate ${index + 1} must be ${expectedId}`);
    if (seen.has(card.id)) errors.push(`duplicate candidate id: ${card.id}`);
    seen.add(card.id);
    const evaluated = evaluateDeletionProof(card, options);
    if (card.decision !== evaluated.decision) {
      errors.push(`${card.id} decision must be derived as ${evaluated.decision}`);
    }
    if (JSON.stringify(card.missingProof) !== JSON.stringify(evaluated.missing)) {
      errors.push(`${card.id} missingProof is stale`);
    }
  }
  return errors;
}

function main() {
  const confirmKeep = process.argv.includes("--confirm-keep");
  const checkAll = process.argv.includes("--all");
  const requireConfirmation = process.argv.includes("--require-user-confirmation");
  if (!process.argv.includes("--check") && !confirmKeep && !(checkAll && requireConfirmation)) {
    console.error("usage: node tools/architecture/deletion-proof.mjs --check | --confirm-keep | --all --require-user-confirmation");
    process.exitCode = 2;
    return;
  }
  const plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"));
  if (confirmKeep) {
    const currentTree = process.env.WORKFLOWHUB_PROOF_SNAPSHOT_TREE ?? defaultTree(ROOT);
    const decisionRoot = resolve(ROOT, "evidence/phase-5/keep-decisions");
    mkdirSync(decisionRoot, { recursive: true });
    for (const card of plan.candidates) {
      if (card.agentDecision?.status === "recorded_keep") {
        card.missingProof = evaluateDeletionProof(card, { currentTree }).missing;
        continue;
      }
      const ref = `evidence/phase-5/keep-decisions/${card.id}.json`;
      const evidence = {
        schema_version: "proof-evidence.v1",
        snapshot_tree: currentTree,
        kind: "agent-keep-decision",
        subject_paths: card.candidatePaths,
        decision: "KEEP",
        actor: "workflowhub-agent",
        authorization_source: "explicit user instruction in the active task",
        basis: "The active task authorizes autonomous safety decisions. This record is an agent decision for KEEP only; it is not a human confirmation and cannot authorize deletion.",
      };
      const raw = `${JSON.stringify(evidence, null, 2)}\n`;
      const path = resolve(ROOT, ref);
      writeFileSync(path, raw, { encoding: "utf8", flag: "wx" });
      card.agentDecision = {
        status: "recorded_keep",
        evidence: { ref, sha256: createHash("sha256").update(raw).digest("hex"), snapshot_tree: currentTree },
      };
      card.missingProof = evaluateDeletionProof(card, { currentTree }).missing;
    }
    writeFileSync(PLAN_PATH, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
    console.log(`recorded ${plan.candidates.length} autonomous KEEP decisions at ${currentTree}`);
    return;
  }
  const errors = validateDeletionPlan(plan);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
    return;
  }
  const keep = plan.candidates.filter(({ decision }) => decision === "KEEP").length;
  const remove = plan.candidates.length - keep;
  if (checkAll && requireConfirmation) {
    const unconfirmed = plan.candidates.filter((card) =>
      card.decision === "DELETE" && card.userConfirmation?.status !== "confirmed");
    if (unconfirmed.length) {
      for (const card of unconfirmed) console.error(`${card.id} user confirmation is missing`);
      process.exitCode = 1;
      return;
    }
    console.log(`deletion confirmation gate ok: ${keep} KEEP, ${remove} DELETE; no deletion occurs in Phase 5 gate`);
    return;
  }
  console.log(`deletion proof ok: ${keep} KEEP, ${remove} DELETE; no deletion occurs in Phase 0`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
