import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function requiredIds(value) {
  const match = String(value ?? "").match(/^(AC-\d+)(?:\.\.(AC-\d+))?$/);
  if (!match) throw new Error(`invalid --require-ac value: ${value}`);
  const first = Number(match[1].slice(3));
  const last = match[2] ? Number(match[2].slice(3)) : first;
  if (last < first) throw new Error("--require-ac range must be ascending");
  return Array.from({ length: last - first + 1 }, (_, index) => `AC-${String(first + index).padStart(2, "0")}`);
}

export function extractAcceptanceCriteria(specText) {
  return [...String(specText).matchAll(/^\s*-\s*\[[ xX]\]\s*\*\*(AC-\d+)\*\*/gm)]
    .map((match) => match[1]).filter((id, index, all) => all.indexOf(id) === index);
}

export function validateCoverage({ specText, coverage, required = [], currentTree = null } = {}) {
  const errors = [];
  const specIds = extractAcceptanceCriteria(specText);
  const wanted = required.length ? required : specIds;
  if (!coverage || coverage.schema_version !== "workflowhub-final-coverage.v1") errors.push("invalid final coverage schema");
  if (JSON.stringify(specIds) !== JSON.stringify([...wanted].filter((id) => specIds.includes(id)))) {
    errors.push("spec acceptance criteria do not match required set");
  }
  if (currentTree && coverage?.snapshot_tree !== currentTree) errors.push("coverage snapshot tree does not match current tree");
  const items = new Map((coverage?.items ?? []).map((item) => [item.acceptance_criterion_id, item]));
  for (const id of wanted) {
    const item = items.get(id);
    if (!item) { errors.push(`${id} is missing from direct coverage`); continue; }
    if (!new Set(["covered", "focused_pass", "deferred"]).has(item.status)) errors.push(`${id} has invalid coverage status`);
    if (!Array.isArray(item.evidence_refs) || item.evidence_refs.length === 0) { errors.push(`${id} has no evidence refs`); continue; }
    for (const evidence of item.evidence_refs) {
      if (!evidence || typeof evidence.ref !== "string" || !/^[a-f0-9]{64}$/.test(evidence.sha256 ?? "")) {
        errors.push(`${id} has malformed evidence ref`); continue;
      }
      const target = path.resolve(ROOT, evidence.ref);
      const relative = path.relative(ROOT, target);
      if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(target)) { errors.push(`${id} evidence is missing: ${evidence.ref}`); continue; }
      if (sha256(fs.readFileSync(target)) !== evidence.sha256) errors.push(`${id} evidence hash mismatch: ${evidence.ref}`);
    }
  }
  const unexpected = [...items.keys()].filter((id) => !wanted.includes(id));
  for (const id of unexpected) errors.push(`unexpected acceptance criterion: ${id}`);
  return errors;
}

function currentTree(root) {
  return execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: root, encoding: "utf8" }).trim();
}

function main() {
  const specArg = process.argv.find((arg) => arg.startsWith("--spec="));
  const requiredArg = process.argv.find((arg) => arg.startsWith("--require-ac="));
  if (!specArg || !requiredArg) {
    console.error("usage: node tools/architecture/verify-final-coverage.mjs --spec=<spec.md> --require-ac=AC-01..AC-15 [--bind-current-tree]");
    process.exitCode = 2;
    return;
  }
  try {
    const required = requiredIds(requiredArg.slice("--require-ac=".length));
    const specText = fs.readFileSync(path.resolve(ROOT, specArg.slice("--spec=".length)), "utf8");
    const coveragePath = path.resolve(ROOT, "evidence/phase-9/final-coverage.json");
    const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
    const tree = process.argv.includes("--bind-current-tree") ? currentTree(ROOT) : null;
    const errors = validateCoverage({ specText, coverage, required, currentTree: tree });
    if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; return; }
    const deferred = coverage.items.filter((item) => item.status === "deferred").length;
    console.log(`final coverage ok: ${required.length} AC, deferred=${deferred}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
