import { createHash } from "node:crypto";
import { closeSync, existsSync, lstatSync, mkdtempSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { StringDecoder } from "node:string_decoder";
import { fileURLToPath } from "node:url";
import { assertTaskHandle } from "../../../runtime/task/task-handle.mjs";
import { isExecutionRecordOnlyMaterialDelta } from "../../../runtime/task/git-worktree-snapshot.mjs";
import { validateCanonicalTestReceipt } from "../../../runtime/evidence/canonical-evidence-validators.mjs";
import { buildAcEvidenceSummary } from "./ac-evidence-summary.mjs";
import { reviewRuleFor } from "../../../runtime/review/review-policy.mjs";
import stageMaterials from "../../../runtime/review/stage-materials.json" with { type: "json" };

const here = dirname(fileURLToPath(import.meta.url));
const skillPlan = JSON.parse(readFileSync(resolve(here, "..", "stage-skill-plan.json"), "utf8"));
const workflowhubSkills = resolve(here, "..", "..");
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const HASH = /^[0-9a-f]{64}$/i;
// Match one canonical AC token. Do not treat range prose such as AC-01..32
// as an acceptance-criterion id: the range endpoints are not independently
// supplied criteria and must not satisfy the current-AC-set check.
const ACCEPTANCE_ID = /(?<![A-Za-z0-9_.-])AC-[A-Za-z0-9][A-Za-z0-9_-]*(?![A-Za-z0-9_.-])/;
const ACCEPTANCE_IDS = /(?<![A-Za-z0-9_.-])AC-[A-Za-z0-9][A-Za-z0-9_-]*(?![A-Za-z0-9_.-])/g;
const ANCHOR_PATH = /^(?:[A-Za-z0-9][A-Za-z0-9._-]*)(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;

// The full provider protocol remains the source contract for WorkflowHub's
// broker and ordinary stage reviews. A mini-task provider only needs the
// provider-facing material boundary and findings schema; the public-result,
// retry, aggregation, and host attestation sections are enforced by the host
// and add no review information. Keep this projection fixed and small so a
// large but valid frozen four-material packet is not rejected before dispatch.
const MINI_TASK_PROVIDER_PROTOCOL = `# Provider Protocol (mini-task)\n\n本文件是 mini-task provider 可见的最小协议。WorkflowHub host 负责传输、manifest、快照、公共结果、重试和审查事实；provider 只负责阅读材料并返回 findings。\n\n## 材料边界\n\n- 只读取本次 bundle 内的文件，先读 bundle/review-instructions.md，再读 contracts/、requirements/ 和声明的 skills/。\n- 不访问真实仓库、bundle 外路径、Git、shell、网络或宿主绝对路径，不自行补取材料。\n- 材料缺失、不可读、传输失败或 hash 不符不是 finding；只报告 bundle 中能直接复核的问题。\n- mini-task.design 的审查对象是冻结的 raw_requirement、decision_log、spec、plan、tasks；mini-task.implementation 还应阅读当前实现、测试、AC trace 和 user result。\n\n## Reviewer 输出\n\n只返回一个 JSON 对象，不要输出 verdict、summary、pass/fail、checklist、流程说明或第二个 JSON：\n\n\`\`\`json\n{\n  "findings": []\n}\n\`\`\`\n\n每条 finding 使用：\n\n{\n  "severity": "blocking|major|minor",\n  "path": "bundle 内材料相对路径",\n  "line": 1,\n  "issue": "具体问题",\n  "root_cause": "可验证根因",\n  "recommendation": "具体修复建议",\n  "evidence_kind": "direct|machine|inferred",\n  "evidence": "一到两句可复核证据"\n}\n\npath 必须是 provider 可见的相对路径；没有可靠行号时省略 line 或写 null，不得猜测。blocking/major 必须有 root_cause、evidence_kind 和 evidence；按根因合并重复问题。findings 为空只表示本次 provider 没提出具体问题，不表示任务完成或可以发布。\n`;

const STREAM_CHUNK_BYTES = 64 * 1024;
export const REVIEW_PACKET_MAX_DELIVERY_BYTES = 330 * 1024;
// Kept as a named compatibility export for phase-packet callers. The bound
// is a build-code packet bound, not a license to let integration packets grow
// without limit.
export const PHASE_DIFF_MAX_DELIVERY_BYTES = REVIEW_PACKET_MAX_DELIVERY_BYTES;
// Leave room for the fixed contract, prompt, manifest, and selected-context
// overhead before choosing the inline path. The final cap remains enforced
// after the complete packet is measured.
export const PHASE_DIFF_INLINE_LIMIT_BYTES = 288 * 1024;
const PHASE_DIFF_SHARD_TARGET_BYTES = 96 * 1024;
const FULL_PHASE_DIFF_PREFIXES = [
  "runtime/",
  "workflows/",
  "skills/grill-with-docs/",
  "skills/spec-clarify/",
  "skills/talk-with-zhipeng/",
  "skills/wh-review/",
  "skills/mini-task/",
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
const FULL_PHASE_DIFF_FILES = new Set(["skills/catalog.yaml"]);

// Provider-visible Phase diffs must include implementation and test source
// code regardless of which project owns the path. Keep documentation,
// configuration, fixtures, and generated reports as bounded summaries unless
// they are selected through the normal context/authority maps. If the complete
// semantic packet still exceeds the hard cap, the caller fails closed instead
// of replacing these sources with summaries.
const FULL_PHASE_DIFF_CODE_EXTENSIONS = new Set([
  ".c", ".cc", ".cpp", ".cxx", ".css", ".fish", ".go", ".h", ".hpp",
  ".java", ".js", ".jsx", ".kt", ".m", ".mjs", ".mm", ".php", ".py",
  ".pyi", ".rb", ".rs", ".sass", ".scss", ".sh", ".sql", ".svelte",
  ".swift", ".ts", ".tsx", ".vue", ".zsh",
]);

// verify-code reviews the current implementation, not every test, fixture,
// report, and workflow note changed while the task was being executed. Keep
// the production seams complete and deliver the directly relevant contract
// tests; all other changed paths remain represented by bounded summaries and
// the canonical diff archive. This is packet slicing only, not evidence
// deletion or a second review scope.
const VERIFY_CODE_FULL_DIFF_PREFIXES = [
  "core/",
  "runtime/",
  "skills/wh-review/scripts/",
  "skills/dsh-code-review/",
  "tools/cli/",
  "tools/host/",
];
const VERIFY_CODE_FULL_DIFF_FILES = new Set([
  "skills/catalog.yaml",
  "skills/wh-review/SKILL.md",
  "skills/wh-review/contracts/provider-protocol.md",
  "skills/wh-review/contracts/verify-code.md",
  "skills/wh-review/skill-bundle.json",
  "runtime/review/stage-materials.json",
  "workflows/verify-code/SKILL.md",
  "workflows/verify-code/skill-deps.yaml",
  "workflows/verify-code/steps.json",
]);
const VERIFY_CODE_RELEVANT_TEST_FILES = new Set([
  "tests/contract/review-materials-contract.test.mjs",
  "tests/contract/stage-completion.test.mjs",
  "tests/contract/verify-architect-acceptance.test.mjs",
  "tests/e2e/vnext-five-stage-current.test.mjs",
  "tests/integration/vnext-official-stage-run.test.mjs",
  "tests/stage-review-cost-policy.test.mjs",
  "tests/verify-code-facts.test.mjs",
]);
// The broker packet has a hard transport ceiling. For a large final diff,
// retain the complete canonical archive but send a deterministic, production-
// first selected context. This budget leaves room for the review contract,
// source/index, and the actual implementation assessment.
const VERIFY_CODE_INCLUDED_DIFF_BUDGET_BYTES = 200 * 1024;
const VERIFY_CODE_PACKET_METADATA_RESERVE_BYTES = 128 * 1024;
const VERIFY_CODE_FULL_INLINE_LIMIT_BYTES = 160 * 1024;
const VERIFY_CODE_DIFF_PRIORITY = [
  "skills/wh-review/scripts/wh-review-cli.mjs",
  "skills/wh-review/scripts/review-runner.mjs",
  "skills/wh-review/scripts/review-materials.mjs",
  "skills/wh-review/scripts/review-provider-client.mjs",
  "skills/wh-review/scripts/third-review-host-config.mjs",
  "runtime/stage/stage-handlers.mjs",
  "runtime/stage/stage-runner.mjs",
  "runtime/stage/stage-agent-outcome-adapter.mjs",
  "runtime/stage/stage-content-contracts.mjs",
  "runtime/stage/completion-predicates.mjs",
  "core/task-close.mjs",
  "runtime/evidence/quality-store.mjs",
  "runtime/evidence/freshness.mjs",
  "runtime/evidence/canonical-evidence-validators.mjs",
  "runtime/review/integration-review-subject.mjs",
  "tools/host/workflowhub-stage-agent-protocol.mjs",
  "tools/cli/stage-runtime.mjs",
  ...[...VERIFY_CODE_RELEVANT_TEST_FILES].sort(),
];
const VERIFY_CODE_DIFF_PRIORITY_INDEX = new Map(VERIFY_CODE_DIFF_PRIORITY.map((path, index) => [path, index]));

/**
 * Large Phase packets keep the implementation and workflow boundaries that
 * directly own the current contract complete. Configuration, generic skill
 * catalog/registry metadata, architecture reports, fixtures, generated
 * reports, and task materials stay provider-visible only as bounded summaries;
 * their canonical bytes remain available for audit. This keeps the provider
 * packet below the hard transport limit without hiding changed-file coverage.
 */
export function phaseDiffDeliveryForPath(path) {
  return FULL_PHASE_DIFF_FILES.has(path)
    || FULL_PHASE_DIFF_PREFIXES.some((prefix) => path.startsWith(prefix))
    || FULL_PHASE_DIFF_CODE_EXTENSIONS.has(extname(path).toLowerCase())
    ? "included"
    : "summary";
}

export function verifyCodeDiffDeliveryForPath(path) {
  return VERIFY_CODE_RELEVANT_TEST_FILES.has(path)
    || VERIFY_CODE_FULL_DIFF_FILES.has(path)
    || VERIFY_CODE_FULL_DIFF_PREFIXES.some((prefix) => path.startsWith(prefix))
    // verify-code is used by projects outside WorkflowHub too.  A project
    // path must not fall back to a summary merely because it is not in this
    // runtime's own prefix list; otherwise the provider receives no code
    // anchor for the actual subject under review.
    || FULL_PHASE_DIFF_CODE_EXTENSIONS.has(extname(path).toLowerCase())
    ? "included"
    : "summary";
}

function boundedVerifyCodeDiffPaths(sections, selectedChangeIds, stage, sourceDiffBytes, budgetBytes = VERIFY_CODE_INCLUDED_DIFF_BUDGET_BYTES) {
  if (stage !== "verify-code" || selectedChangeIds.size > 0 || sourceDiffBytes <= VERIFY_CODE_FULL_INLINE_LIMIT_BYTES) return null;
  let remaining = budgetBytes;
  const included = new Set();
  const candidates = sections
    .filter((section) => verifyCodeDiffDeliveryForPath(section.path) === "included")
    .sort((left, right) =>
      (VERIFY_CODE_DIFF_PRIORITY_INDEX.get(left.path) ?? Number.MAX_SAFE_INTEGER) - (VERIFY_CODE_DIFF_PRIORITY_INDEX.get(right.path) ?? Number.MAX_SAFE_INTEGER)
      || left.path.localeCompare(right.path),
    );
  for (const section of candidates) {
    if (section.bytes.length <= remaining) {
      included.add(section.path);
      remaining -= section.bytes.length;
    }
  }
  return included;
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

/**
 * Validate the public make-decision detail input before runner-owned fields
 * are generated.  The caller supplies the current decision log bytes; the
 * runner supplies the authenticated material revision.  Keeping this check
 * at the public boundary prevents callers from guessing packet metadata or
 * silently replacing the current decision with a summary.
 */
export function validateDetailReviewInput({ materials, currentDecisionLog = null, currentMaterialRevision = null } = {}) {
  const errors = [];
  if (!materials || typeof materials !== "object" || Array.isArray(materials)) {
    throw new TypeError("MATERIAL_INCOMPLETE: detail materials must be an object");
  }
  const required = ["raw_requirement", "approved_direction", "draft_spec_or_acceptance"];
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(materials, key)) {
      errors.push(`missing ${key}`);
      continue;
    }
    if (typeof materials[key] !== "string") {
      errors.push(`type ${key} must be text`);
      continue;
    }
    if (materials[key].trim() === "") errors.push(`empty ${key}`);
  }
  const allowed = new Set([...required, "context_map", "evidence_map"]);
  const forbidden = Object.keys(materials).filter((key) => !allowed.has(key));
  if (forbidden.length) errors.push(`forbidden ${forbidden.join(", ")}`);
  if (typeof currentDecisionLog !== "string" || currentDecisionLog.length === 0) {
    errors.push("freshness current decision-log.md bytes are unavailable");
  } else if (typeof materials.approved_direction === "string" && materials.approved_direction !== currentDecisionLog) {
    errors.push("identity approved_direction must match current decision-log.md bytes");
  }
  if (!/^revision-[a-f0-9]{64}$/.test(currentMaterialRevision ?? "")) {
    errors.push("freshness current material revision is unavailable or invalid");
  }
  if (errors.length) {
    const error = new Error(`MATERIAL_INCOMPLETE: detail input ${errors.join("; ")}`);
    error.code = "MATERIAL_INCOMPLETE";
    throw error;
  }
  return true;
}

const LOCAL_HOST_PATH = /\/(?:Users|home|private|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)\/[^\s"'`<>()[\]{}]+|[A-Za-z]:[\\/][^\s"'`<>()[\]{}]+/g;

function redactHostPathText(value) {
  return value.replace(LOCAL_HOST_PATH, "<host-path-redacted>");
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

/**
 * A verify review cannot find delivery defects when its acceptance subject is
 * an empty placeholder. This is a material preflight, not an AC pass gate:
 * incomplete or failed criteria remain valid review input, but zero criteria
 * or a generic non-AC note must fail before spending provider budget.
 */
export function validateVerifyAcceptanceSummary(value, { expectedCriterionIds = null } = {}) {
  const raw = Buffer.isBuffer(value) ? value.toString("utf8") : typeof value === "string" ? value : JSON.stringify(value);
  if (typeof raw !== "string" || raw.trim() === "") throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_criteria is empty");
  const text = raw.trim();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* Markdown summaries are also supported. */ }
  if (/"criteria"\s*:\s*\[\s*\]/i.test(text) || /"acceptance_criteria"\s*:\s*\[\s*\]/i.test(text)) {
    throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_criteria contains an empty criteria list");
  }
  const candidateArrays = [];
  if (Array.isArray(parsed)) candidateArrays.push(parsed);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    for (const key of ["criteria", "acceptance_criteria", "items"]) {
      if (Object.hasOwn(parsed, key)) candidateArrays.push(parsed[key]);
    }
  }
  for (const entries of candidateArrays) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_criteria must contain current AC entries");
    }
    if (entries.some((entry) => {
      if (typeof entry === "string") return !ACCEPTANCE_ID.test(entry);
      return !entry || typeof entry !== "object" || !ACCEPTANCE_ID.test(String(entry.acceptance_criterion_id ?? entry.id ?? ""));
    })) {
      throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_criteria entries must identify ACs");
    }
  }
  if (!ACCEPTANCE_ID.test(text)) throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_criteria must name current ACs");
  if (Array.isArray(expectedCriterionIds) && expectedCriterionIds.length > 0) {
    const actual = [...new Set([...text.matchAll(ACCEPTANCE_IDS)].map(([id]) => id.toUpperCase()))].sort();
    const expected = [...new Set(expectedCriterionIds.map((id) => String(id).toUpperCase()))].sort();
    if (actual.length !== expected.length || actual.some((id, index) => id !== expected[index])) {
      throw new Error(`MATERIAL_INCOMPLETE: verify-code acceptance_criteria does not match current spec AC set (expected ${expected.join(", ")}, received ${actual.join(", ")})`);
    }
  }
  return true;
}

function currentSpecCriterionIds(task) {
  if (!task || typeof task.readArtifact !== "function") return null;
  try {
    const spec = task.readArtifact("spec.md");
    const ids = [...String(spec).matchAll(ACCEPTANCE_IDS)].map(([id]) => id.toUpperCase());
    return [...new Set(ids)];
  } catch {
    return null;
  }
}

function validateBuildCodeTestEvidence({ task, source, materials, strictV2Maps }) {
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
  const raw = assertTaskHandle(task).readRecord(evidence.receipt_ref);
  if (sha256(raw) !== evidence.receipt_hash.replace(/^sha256:/, "")) {
    throw new Error("MATERIAL_INCOMPLETE: build-code test receipt hash mismatch");
  }
  let receipt;
  try { receipt = JSON.parse(raw); } catch { throw new Error("MATERIAL_INCOMPLETE: build-code test receipt must be JSON"); }
  validateCanonicalTestReceipt(receipt, {
    taskId: task.identity.taskId,
    stage: "build-code",
    // Phase tests may use the phase's declared focused command; unlike the
    // final integration receipt, they are not required to be npm test.
    snapshotTree: receipt.snapshot_tree,
    expectedProducerComponent: "build-code-test-capture",
    requirePassed: true,
  });
  const output = task.readRecord(receipt.output_ref);
  if (sha256(output) !== receipt.output_hash) {
    throw new Error("MATERIAL_INCOMPLETE: build-code test output hash mismatch");
  }
  const snapshotCurrent = receipt.snapshot_tree === source.snapshotTree
    || (typeof source.sourceRoot === "string"
      && isExecutionRecordOnlyMaterialDelta(source.sourceRoot, receipt.snapshot_tree, source.snapshotTree, task.identity.taskId));
  if (!snapshotCurrent || receipt.exit_code !== 0) {
    throw new Error("MATERIAL_INCOMPLETE: build-code test evidence is not a passing current-snapshot fact");
  }
}

function validateIntegrationFreshTests({ task, source, materials }) {
  const evidence = materials.test_evidence;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    throw new Error("MATERIAL_INCOMPLETE: integration test evidence is missing or invalid");
  }
  if (evidence.status === "unavailable" || evidence.status === "missing") {
    if (typeof evidence.reason !== "string" || evidence.reason.trim() === "") {
      throw new Error("MATERIAL_INCOMPLETE: missing integration test evidence requires a reason");
    }
    return;
  }
  if (evidence.status !== undefined && evidence.status !== "passed") {
    throw new Error("MATERIAL_INCOMPLETE: integration test evidence status is unsupported");
  }
  if (typeof evidence.receipt_ref !== "string" || !HASH.test(evidence.receipt_hash ?? "")) {
    throw new Error("MATERIAL_INCOMPLETE: integration test evidence requires receipt_ref and receipt_hash");
  }
  const handle = assertTaskHandle(task);
  const raw = handle.readRecord(evidence.receipt_ref);
  if (sha256(raw) !== evidence.receipt_hash.replace(/^sha256:/, "")) throw new Error("MATERIAL_INCOMPLETE: integration test receipt hash mismatch");
  let receipt;
  try { receipt = JSON.parse(raw); } catch { throw new Error("MATERIAL_INCOMPLETE: integration test receipt must be JSON"); }
  validateCanonicalTestReceipt(receipt, {
    taskId: handle.identity.taskId,
    stage: "build-code",
    // An execution-status-only tasks.md writeback is not a source change.
    // Validate the receipt's own immutable snapshot first, then apply the
    // narrow semantic-delta check below.
    snapshotTree: receipt.snapshot_tree,
    expectedProducerComponent: "build-code-test-capture",
    allowedProducerComponents: ["build-code-test-capture"],
    expectedCommand: "npm test",
    requirePassed: true,
  });
  const output = handle.readRecord(receipt.output_ref);
  if (sha256(output) !== receipt.output_hash) throw new Error("MATERIAL_INCOMPLETE: integration test output hash mismatch");
  const snapshotCurrent = receipt.snapshot_tree === source.snapshotTree
    || (typeof source.sourceRoot === "string"
      && isExecutionRecordOnlyMaterialDelta(source.sourceRoot, receipt.snapshot_tree, source.snapshotTree, task.identity.taskId));
  if (!snapshotCurrent || receipt.exit_code !== 0) {
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
  const owners = [];
  for (const entry of value.entries.filter(({ id, disposition }) => disposition === "complete" && /^AC-/.test(id))) {
    for (const anchor of entry.anchors ?? []) {
      const previous = owners.find(({ anchor: previousAnchor, entryId }) => entryId !== entry.id
        && previousAnchor.path === anchor.path
        && previousAnchor.start_line <= anchor.end_line
        && anchor.start_line <= previousAnchor.end_line);
      if (previous !== undefined) {
        throw new Error(`MATERIAL_INCOMPLETE: evidence_map ${previous.entryId} and ${entry.id} overlap one proving anchor; each AC needs a distinct implementation/test block`);
      }
      owners.push({ anchor, entryId: entry.id });
    }
  }
}

function validateAnchors(key, entryId, anchors) {
  if (!Array.isArray(anchors) || anchors.length === 0) throw new Error(`MATERIAL_INCOMPLETE: ${key}.${entryId}.anchors must be a non-empty array`);
  const ids = new Set();
  for (const anchor of anchors) {
    if (!anchor || typeof anchor !== "object" || Array.isArray(anchor) ||
        typeof anchor.id !== "string" || anchor.id.trim() === "" || ids.has(anchor.id) ||
        !ANCHOR_PATH.test(anchor.path ?? "") || !Number.isSafeInteger(anchor.start_line) || anchor.start_line < 1 ||
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
    for (const key of ["implementation_anchor_ids", "verification_anchor_ids"]) {
      if (!Array.isArray(entry[key]) || entry[key].length === 0
          || new Set(entry[key]).size !== entry[key].length
          || entry[key].some((id) => typeof id !== "string" || id.trim() === "")) {
        throw new Error(`MATERIAL_INCOMPLETE: acceptance_map ${entry.id} requires non-empty ${key}`);
      }
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
    const evidenceUnavailable = entry?.evidence_status === "unavailable";
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.acceptance_criterion_id !== "string" ||
        !trace.acceptance_ids.includes(entry.acceptance_criterion_id) || traced.has(entry.acceptance_criterion_id) ||
        !Array.isArray(entry.change) || !Array.isArray(entry.test) || !Array.isArray(entry.evidence) ||
        entry.change.length === 0 || (!evidenceUnavailable && entry.evidence.length === 0)
        || (entry.test.length === 0 && entry.coverage_status !== "unknown")
        || (entry.coverage_status === "unknown" && (typeof entry.coverage_reason !== "string" || entry.coverage_reason.trim() === ""))
        || (evidenceUnavailable && (typeof entry.evidence_reason !== "string" || entry.evidence_reason.trim() === ""))) {
      throw new Error("MATERIAL_INCOMPLETE: current AC evidence requires change, test, and evidence mappings");
    }
    if (entry.coverage_status !== undefined && !["covered", "unknown"].includes(entry.coverage_status)) {
      throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} coverage_status is invalid`);
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
      const snapshotCurrent = receipt.snapshot_tree === source.snapshotTree
        || (typeof source.sourceRoot === "string"
          && isExecutionRecordOnlyMaterialDelta(source.sourceRoot, receipt.snapshot_tree, source.snapshotTree, task.identity.taskId));
      if (!snapshotCurrent || receipt.exit_code !== 0) throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} test is not a passing current-snapshot fact`);
    }
    for (const evidence of entry.evidence) {
      if (typeof evidence?.ref !== "string" || !HASH.test(evidence.sha256 ?? "")) throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} evidence binding is invalid`);
      const raw = assertTaskHandle(task).readRecord(evidence.ref);
      if (sha256(raw) !== evidence.sha256) throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} evidence hash mismatch`);
      const receipt = JSON.parse(raw);
      const snapshotCurrent = receipt.snapshot_tree === source.snapshotTree
        || (typeof source.sourceRoot === "string"
          && isExecutionRecordOnlyMaterialDelta(source.sourceRoot, receipt.snapshot_tree, source.snapshotTree, task.identity.taskId));
      if (!snapshotCurrent) throw new Error(`MATERIAL_INCOMPLETE: AC ${entry.acceptance_criterion_id} evidence is not current-snapshot fact`);
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
  // AC traces are reviewer-facing structured evidence. Keep them pretty
  // printed so line-oriented providers can inspect bounded anchors; the
  // canonical object itself remains the source of truth.
  if (key === "ac_trace" && value && typeof value === "object" && !Buffer.isBuffer(value)) {
    return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  }
  return materialBytes(value);
}

function originalRequirementSection(decisionLog) {
  if (typeof decisionLog !== "string") return null;
  const lines = decisionLog.replaceAll("\r\n", "\n").split("\n");
  const isOriginalRequirementHeading = (line) => /^##[ \t]+原始需求.*$/.test(line);
  const start = lines.findIndex(isOriginalRequirementHeading);
  if (start < 0) return null;
  // A make-decision log may split the original request across consecutive
  // level-2 sections (for example, a source table followed by the original
  // request body). Keep that complete contiguous requirement block, but stop
  // before decisions, research, or execution records.
  const nextHeading = lines.findIndex((line, index) => index > start
    && /^##[ \t]+\S/.test(line)
    && !isOriginalRequirementHeading(line));
  const end = nextHeading < 0 ? lines.length : nextHeading;
  const section = lines.slice(start, end).join("\n").trim();
  return section.length > 0 ? `${section}\n` : null;
}

function deduplicateDecisionMaterials(materials) {
  if (!("raw_requirement" in materials) || !("approved_decision" in materials)) return materials;
  const comparableMarkdown = (value, key) => typeof value === "string"
    ? value.replaceAll("\r\n", "\n").replace(/[ \t]+$/gm, "").trimEnd()
    : reviewMaterialBytes(key, value);
  const rawComparable = comparableMarkdown(materials.raw_requirement, "raw_requirement");
  const decisionComparable = comparableMarkdown(materials.approved_decision, "approved_decision");
  const duplicates = Buffer.isBuffer(rawComparable)
    ? Buffer.isBuffer(decisionComparable) && rawComparable.equals(decisionComparable)
    : rawComparable === decisionComparable;
  if (!duplicates) return materials;

  const derivedRawRequirement = originalRequirementSection(materials.approved_decision);
  if (derivedRawRequirement === null) {
    throw new Error("MATERIAL_INCOMPLETE: raw_requirement duplicates approved_decision and no original requirement section can be derived");
  }
  return { ...materials, raw_requirement: derivedRawRequirement };
}

function providerMaterialPath(key, value) {
  return key === "review_instructions"
    ? "review-instructions.md"
    : `requirements/${key}.${typeof value === "string" ? "md" : "json"}`;
}

/**
 * Keep one provider-visible copy of every byte-identical material. The
 * canonical task material is never changed; this only removes repeated
 * derived files from the sealed packet. Required materials win over
 * optional/generated materials so deduplication cannot hide the authority
 * file named by the stage contract.
 */
function deduplicateProviderMaterials(materials, rule) {
  const originalEntries = Object.entries(materials).map((entry, index) => ({ entry, index }));
  const rank = (key, index) => {
    const required = rule.required.indexOf(key);
    if (required >= 0) return [0, required, index];
    const optional = rule.optional.indexOf(key);
    if (optional >= 0) return [1, optional, index];
    return [2, 0, index];
  };
  originalEntries.sort((left, right) => {
    const leftRank = rank(left.entry[0], left.index);
    const rightRank = rank(right.entry[0], right.index);
    return leftRank[0] - rightRank[0] || leftRank[1] - rightRank[1] || leftRank[2] - rightRank[2];
  });
  const kept = {};
  const seen = new Map();
  const deduplicated = [];
  for (const { entry: [key, value] } of originalEntries) {
    // The protocol instructions are a separate control file.  Even when its
    // bytes happen to match a material, keep the fixed entrypoint so a
    // provider can always read the review contract first.
    if (key === "review_instructions") {
      kept[key] = value;
      continue;
    }
    const bytes = reviewMaterialBytes(key, value);
    const digest = sha256(bytes);
    const previous = seen.get(digest);
    if (previous !== undefined) {
      deduplicated.push({
        alias_material: key,
        alias_path: providerMaterialPath(key, value),
        canonical_material: previous.key,
        canonical_path: previous.path,
        content_sha256: digest,
        bytes: bytes.length,
        reason: "same_content_hash",
      });
      continue;
    }
    const path = providerMaterialPath(key, value);
    kept[key] = value;
    seen.set(digest, { key, path });
  }
  return { materials: kept, deduplicated };
}

function compactMiniTaskDecisionLog(decisionLog) {
  if (typeof decisionLog !== "string") {
    throw new Error("MATERIAL_INCOMPLETE: mini-task decision_log must be text with an original requirement section");
  }
  const lines = decisionLog.replaceAll("\r\n", "\n").split("\n");
  const start = lines.findIndex((line) => /^##[ \t]+原始需求(?:[ \t（(]|$)/.test(line));
  if (start < 0) {
    throw new Error("MATERIAL_INCOMPLETE: mini-task decision_log has no original requirement section");
  }
  const nextHeading = lines.findIndex((line, index) => index > start && /^##[ \t]+\S/.test(line));
  const end = nextHeading < 0 ? lines.length : nextHeading;
  const compacted = [...lines.slice(0, start), ...lines.slice(end)].join("\n").trim();
  return compacted.length > 0 ? `${compacted}\n` : "# Decision Log\n";
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
  deferredItems = null,
  openItems = null,
} = {}) {
  const derivedDeferredItems = deferredItems
    ?? (rawRequirementIndex && typeof rawRequirementIndex === "object" ? rawRequirementIndex.deferred_items ?? null : null);
  const derivedOpenItems = openItems
    ?? (rawRequirementIndex && typeof rawRequirementIndex === "object" ? rawRequirementIndex.open_items ?? null : null);
  return Object.freeze({
    schema_version: "spec-analyze-planning-artifacts.v1",
    source_artifact: "decision-log",
    raw_requirement_index: rawRequirementIndex,
    approved_spec: approvedSpec,
    acceptance_criteria: acceptanceCriteria,
    draft_plan: draftPlan,
    draft_tasks: draftTasks,
    ...(derivedDeferredItems === null ? {} : { deferred_items: derivedDeferredItems }),
    ...(derivedOpenItems === null ? {} : { open_items: derivedOpenItems }),
    finding_disposition: "pending_main_agent_review",
  });
}

const ruleFor = reviewRuleFor;

function stagePlanFor(stage, track, reviewKind = null) {
  if (reviewKind !== null && reviewKind !== undefined) return skillPlan.mini_task?.[reviewKind.split(".")[1]];
  const stagePlan = skillPlan.stages[stage];
  return stage === "make-decision" ? stagePlan?.tracks?.[track] : stagePlan;
}

function reviewSurfaceFor(stage, track, reviewScope, reviewKind) {
  if (reviewKind === "mini_task.design" || reviewKind === "mini_task.implementation") return `mini-task/${reviewKind.split(".")[1]}`;
  if (stage === "make-decision") return `${stage}/${track ?? ""}`;
  if (stage === "build-code") return `${stage}/${reviewScope ?? "phase"}`;
  return stage;
}

function problemOrderFor(stage, track, reviewScope, reviewKind) {
  const surface = reviewSurfaceFor(stage, track, reviewScope, reviewKind);
  return stageMaterials.surfaces?.[surface]?.problem_order ?? [];
}

function stageReviewFocus(stage, track, reviewScope, reviewKind = null, directionMode = "full") {
  const order = problemOrderFor(stage, track, reviewScope, reviewKind);
  const ordered = order.length ? ` Review in this order: ${order.join(" -> ")}.` : "";
  if (reviewKind === "mini_task.design") return `Focus on whether the mini-task four materials freeze one small, safe, complete design, its risks, dependencies, boundaries, tests, rollback, and delivery; do not invent product scope.${ordered}`;
  if (reviewKind === "mini_task.implementation") return `Focus on whether the mini-task implementation matches the frozen four materials, current diff/snapshot, tests, AC trace, real user result, coverage limits, and remaining risks.${ordered}`;
  if (stage === "make-decision" && track === "direction" && directionMode === "reconstruct") {
    return `First request: independently reconstruct the problem, user flow, hard constraints, non-goals, failure consequences, and the smallest reversible boundary from only the raw requirement and objective facts. Do not look for or infer a current choice.${ordered}`;
  }
  if (stage === "make-decision" && track === "direction" && directionMode === "combined") {
    return `One public request: execute the broker-owned direction-review.v1 flow in order reconstruct -> reveal -> challenge. The reconstruct step may see only the raw requirement and objective facts; reveal the current choice only after the internal reconstruction is recorded; challenge the revealed choice and report one final findings object. Do not create a second public request.${ordered}`;
  }
  if (stage === "make-decision" && track === "direction" && directionMode === "challenge") {
    return `Second request: use the blind reconstruction, then inspect the revealed current choice, alternatives, rationale, and assumptions. Attack the choice, failure modes, and smaller reversible alternatives; report only delivery-threatening findings.${ordered}`;
  }
  if (stage === "make-decision" && track === "direction") {
    return `Focus on whether the raw requirement, user flow, boundaries, risks, and direction are complete. Do not propose or judge an implementation solution.${ordered}`;
  }
  if (stage === "make-decision" && track === "detail") {
    return `Focus on whether the approved direction is turned into a complete flow, page scope, data states, success/failure boundaries, non-goals, and deferred handoff. Do not invent a new direction.${ordered}`;
  }
  if (stage === "build-spec") {
    return `Focus on traceability from the approved decision to user behavior, states, boundaries, interfaces, and objective acceptance. Do not re-decide product direction or plan implementation work.${ordered}`;
  }
  if (stage === "build-plan") {
    return `Focus on whether the plan and tasks execute the approved spec in dependency order, with real test or evidence oracles and no missing requirement. Do not add requirements or treat review as permission to proceed.${ordered}`;
  }
  if (stage === "build-code" && reviewScope === "phase") {
    return `Focus on the complete current Phase diff, its direct consumers, tests, acceptance trace, and actionable major or blocking risks. Ignore unrelated history and do not require a provider pass.${ordered}`;
  }
  if (stage === "build-code" && reviewScope === "integration") {
    return `Focus on the final current worktree implementation, the complete user flow, cross-Phase seams, real interfaces, state transitions, failure recovery, necessity, and actionable major or blocking risks. The host validates AC bindings separately; do not report missing or unknown task rows, receipts, snapshots, lineage, or evidence metadata unless it directly causes or conceals a user-visible behavior failure. Do not replay Phase history, cumulative diffs, or require a provider pass.${ordered}`;
  }
  if (stage === "verify-code") {
    return `Focus on the current code diff, real entry points, direct consumers, lifecycle and failure paths, security boundaries, test strength, and open implementation risks. Do not audit materials, acceptance criteria, receipts, lineage, or evidence completeness; report code findings only.${ordered}`;
  }
  return "Focus on the supplied stage subject, its contract, and its evidence; report advice only.";
}

export function reviewInstructionsFor(stage, track = null, uiScope = false, reviewScope = null, reviewKind = null, directionMode = "full") {
  const rule = ruleFor(reviewKind ?? stage, track, reviewKind ? null : reviewScope);
  const plan = stagePlanFor(stage, track, reviewKind);
  if (!plan) throw new Error(`MATERIAL_INCOMPLETE: no review skill plan for ${stage}/${track ?? "default"}`);
  const selectedSkills = [...new Set([...(plan.required_skills ?? []), ...(uiScope === true ? (plan.optional_skills ?? []).filter(({ when }) => when === "ui").map(({ name }) => name) : [])])];
  if (["build-code", "verify-code"].includes(stage) && selectedSkills.length === 0) throw new Error(`MATERIAL_INCOMPLETE: ${stage} requires explicit reviewer skills`);
  const scope = reviewKind ?? (stage === "make-decision" ? `${stage}/${track}` : stage === "build-code" ? `${stage}/${reviewScope ?? "phase"}` : stage);
  const blind = stage === "make-decision" && track === "direction" && directionMode === "reconstruct"
    ? "The bundle intentionally contains no proposed solution. Judge only the requirement, facts, constraints, and decision direction."
    : stage === "verify-code"
    ? "Judge only the supplied implementation and code-review contract; the upstream stage materials are context, not a verification target."
    : "Judge the supplied stage artifact against its requirements, contract, and evidence.";
  const skillInstruction = selectedSkills.length ? `Read these manifest-declared reviewer skills before reviewing: ${selectedSkills.map((name) => `skills/${name}/SKILL.md`).join(", ")}.` : "No reviewer skills are declared for this stage.";
  const reviewInstruction = "This is a full review of the supplied current stage subject.";
  const stageFocus = stageReviewFocus(stage, track, reviewScope, reviewKind, directionMode);
  const verifyBound = reviewKind
    ? "This is one dedicated mini-task review. Do not substitute a standard stage review, demand a provider verdict, or repeat an unchanged review."
    : stage === "verify-code"
    ? "This is one bounded post-repair code review. Inspect the current diff, implementation assessment, real entry points and consumers, relevant test context, lifecycle and failure paths, security boundaries, and open implementation risks. Do not demand a full evidence tree, acceptance replay, material completeness, historical replay, provider pass, or another review; report only findings that can affect code delivery."
    : `${blind} ${reviewInstruction}`;
  const adviceBoundary = "Every stage produces heterologous advice as a quality fact only; this is advice only, not a completion license. An unavailable or non-terminal provider result is not advice, not empty findings, and not pass. Do not keep calling the broker to obtain pass or empty findings.";
  const buildCodeBoundary = stage === "build-code" && reviewKind === null
    ? "For build-code, a review cycle is clean only when the current trusted semantic result has no actionable major or blocking finding. If one exists, allow one focused review only after an actual repair or subject change; repeated findings, no actual change, or no trusted terminal result stop automatic continuation and remain visible as needs_human, unavailable, or incomplete."
    : "";
  const miniImplementationBoundary = reviewKind === "mini_task.implementation"
    ? "For mini-task implementation, perform one implementation review. Allow one focused re-review only after an actual repair or subject change; repeated findings, an unchanged subject, or no trusted terminal result remain visible as needs_human, unavailable, or incomplete. Do not mechanically retry."
    : "";
  const subjectReading = reviewKind === "mini_task.design"
    ? "Read the frozen four materials and the design risks; no implementation diff or diff index is supplied for a design review."
    : reviewKind === "mini_task.implementation"
    ? "Read the current implementation diff/snapshot and the explicitly supplied tests, AC trace, and real user result."
    : stage === "build-code" && reviewScope === "integration"
    ? "For integration, do not look for or infer a diff; read only the final current worktree subject, compact behavior requirements, relevant test outcome, and selected implementation context. AC bindings and evidence-ledger details are host-only and are not review targets."
    : stage === "make-decision" && track === "direction" && directionMode === "reconstruct"
    ? "Read only the raw requirement and objective facts; the current choice is intentionally absent."
    : stage === "make-decision" && track === "direction" && directionMode === "challenge"
    ? "Read the raw requirement, objective facts, revealed current choice, alternatives, rationale, assumptions, and the blind reconstruction; do not treat the reconstruction as a verdict."
    : stage === "make-decision" && track === "direction" && directionMode === "combined"
    ? "Read the direction-review.v1 flow and all declared fields, but rely on the broker-enforced reveal boundary: the reconstruct step must not read current_selection before reveal."
    : "Use changes.diff when present; otherwise use diff-index.json plus the complete included diff-shards as the self-contained indexed Phase authority.";
  const findingBudget = "按根因合并同类问题；不要把同一个问题重复写成多条 finding，也不要重复描述 provider、packet、snapshot、receipt 或审查流程。每条 finding 只写最小必要的 issue、root_cause、recommendation 和一到两句可复核 evidence；不要输出推理过程、背景复述或长篇总结。不要为了凑数量少报真正独立的交付风险。";
  return `Review stage ${scope}. All provider-visible files are under bundle/; begin with bundle/review-instructions.md and read only files in that bundle. Read contracts/ and ${skillInstruction} The sealed manifest and canonical receipts are broker-verified; do not recompute hashes or fetch excluded raw logs. ${subjectReading} Use context/ only for map-selected dependencies. ${stageFocus} ${verifyBound} ${adviceBoundary} ${buildCodeBoundary} ${miniImplementationBoundary} ${findingBudget} Return only one JSON object with findings using the requested findings-only reviewer schema; findings may be empty. Do not output verdict, pass/fail status, summary, checklist, skill execution receipts, or a second JSON object. Do not access the repository, parent directories, Git, shell, network, or host paths.\n`;
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

function markdownText(value, label) {
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  if (typeof value !== "string") throw new Error(`MATERIAL_INCOMPLETE: ${label} must be markdown text`);
  return value;
}

function markdownSections(value, label = "review material") {
  const text = markdownText(value, label);
  const headings = [...text.matchAll(/^##+\s+.*$/gm)];
  if (headings.length === 0) return [{ heading: null, text }];
  return headings.map((match, index) => ({
    heading: match[0].trim(),
    text: text.slice(match.index, headings[index + 1]?.index ?? text.length).trim(),
  }));
}

function compactIntegrationAcceptanceCriteria(value, archive) {
  const sections = markdownSections(value, "build-code integration acceptance_criteria");
  const acceptanceSections = sections.filter(({ heading }) => heading && /验收|acceptance criteria/i.test(heading));
  const selectedText = (acceptanceSections.length ? acceptanceSections : sections).map(({ text }) => text).join("\n\n");
  const selectedIds = [...requirementIds(selectedText)].filter((id) => /^AC-/.test(id)).sort();
  const blocks = selectedText.split(/\n{2,}/).filter((block) => selectedIds.some((id) => block.includes(id)));
  return {
    schema_version: "wh-review-acceptance-excerpts.v1",
    full: archive,
    selected_ids: selectedIds,
    excerpts: blocks.length > 0 ? blocks : [selectedText],
  };
}

function compactIntegrationSpec(value, archive) {
  const sections = markdownSections(value, "build-code integration approved_spec");
  const nonAcceptanceSections = sections.filter(({ heading }) => !heading || !/验收|acceptance criteria/i.test(heading));
  const selected = nonAcceptanceSections.filter(({ heading }) => {
    if (!heading) return false;
    if (/来源与决策映射|产品事实与假设|build-spec 执行结论/i.test(heading)) return false;
    return /速读|背景|目标|范围|场景|功能需求|关键实体|数据|生命周期|兼容|不做|非目标|风险|未决|交接|业务影响|回归/i.test(heading);
  });
  return {
    schema_version: "wh-review-integration-spec.v1",
    full: archive,
    selected_sections: selected.map(({ heading }) => heading),
    excerpts: (selected.length > 0 ? selected : nonAcceptanceSections).map(({ text }) => text),
  };
}

// Keep the integration packet focused on delivery behavior rather than the
// host's evidence/transport plumbing. The host still retains every anchor in
// the authenticated AC trace; this limit only bounds provider-visible source
// context. One excerpt per priority path preserves the main cross-phase seams
// without turning a wide worktree change into repository replay.
const INTEGRATION_PROVIDER_ANCHOR_MAX = 9;
const INTEGRATION_PROVIDER_ANCHOR_MAX_PER_PATH = 1;
const INTEGRATION_PROVIDER_ANCHOR_PRIORITY = Object.freeze([
  "core/task-close.mjs",
  "runtime/task/git-worktree-snapshot.mjs",
  "skills/mini-task/scripts/mini-task-runner.mjs",
  "runtime/review/integration-review-subject.mjs",
  "skills/wh-review/scripts/review-runner.mjs",
  "runtime/review/canonical-review-result.mjs",
  "skills/wh-review/scripts/review-materials.mjs",
  "runtime/evidence/canonical-evidence-validators.mjs",
  "runtime/stage/stage-handlers.mjs",
]);

function integrationProviderAnchorPathAllowed(path) {
  if (typeof path !== "string" || path.length === 0) return false;
  if (path.startsWith("tests/") || path.includes("/__tests__/")) return false;
  if (path.startsWith("skills/") && (
    path.includes("/contracts/")
    || path.endsWith("/SKILL.md")
    || path.endsWith("/skill-bundle.json")
    || path.endsWith("/manifest.json")
  )) return false;
  return true;
}

function compactIntegrationImplementationAnchors(value) {
  if (!Array.isArray(value)) return value;
  const rank = new Map(INTEGRATION_PROVIDER_ANCHOR_PRIORITY.map((path, index) => [path, index]));
  const byPath = new Map();
  for (const anchor of value) {
    if (!anchor || !integrationProviderAnchorPathAllowed(anchor.path)) continue;
    const list = byPath.get(anchor.path) ?? [];
    list.push(anchor);
    byPath.set(anchor.path, list);
  }
  const paths = [...byPath.keys()].sort((left, right) =>
    (rank.get(left) ?? Number.MAX_SAFE_INTEGER) - (rank.get(right) ?? Number.MAX_SAFE_INTEGER)
    || left.localeCompare(right),
  );
  const selected = [];
  for (const path of paths) {
    const anchors = byPath.get(path).slice().sort((left, right) => {
      const leftSpan = Number(left.end_line) - Number(left.start_line);
      const rightSpan = Number(right.end_line) - Number(right.start_line);
      return rightSpan - leftSpan || Number(left.start_line) - Number(right.start_line) || String(left.id).localeCompare(String(right.id));
    });
    selected.push(...anchors.slice(0, INTEGRATION_PROVIDER_ANCHOR_MAX_PER_PATH));
    if (selected.length >= INTEGRATION_PROVIDER_ANCHOR_MAX) break;
  }
  return selected.slice(0, INTEGRATION_PROVIDER_ANCHOR_MAX).map(({ id, path, start_line, end_line, role }) => ({ id, path, start_line, end_line, role }));
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

function diffSections(source, cachedBytes = null) {
  const bytes = cachedBytes ?? readFileSync(source.diffPath);
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

function newLineRangesFor(change) {
  return (change.hunks ?? []).flatMap((hunk) => {
    const match = hunk.header?.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (!match) return [];
    const startLine = Number(match[1]);
    const lineCount = match[2] === undefined ? 1 : Number(match[2]);
    return lineCount > 0
      ? [{ start_line: startLine, end_line: startLine + lineCount - 1 }]
      : [];
  });
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

function writeShardedPhaseDiff({ bundleRoot, reviewDataRoot, source, changeMap, materials, stage = "build-code", includedDiffBudgetBytes = VERIFY_CODE_INCLUDED_DIFF_BUDGET_BYTES }) {
  const archive = canonicalDiffArchive({ reviewDataRoot, source });
  const changesByPath = new Map(changeMap.changes.map((change) => [change.path, change]));
  const selectedChangeIds = selectedPhaseChangeIds(materials);
  const sections = diffSections(source);
  const boundedIncludedPaths = boundedVerifyCodeDiffPaths(sections, selectedChangeIds, stage, source.diffBytes, includedDiffBudgetBytes);
  const shards = [];
  let ordinal = 0;
  for (const section of sections) {
    const change = changesByPath.get(section.path);
    if (!change) throw new Error(`MATERIAL_INCOMPLETE: diff section ${section.path} is absent from change-map`);
    // An explicit phase/acceptance map is the authority for a bounded Phase
    // review.  The default path classifier keeps implementation and test code
    // complete when no map was supplied, but it must not silently pull every
    // earlier dirty-phase code hunk into the current review packet.  Unselected
    // changes remain in the canonical archive and indexed summary, so this is
    // a delivery bound, not an evidence deletion.
    const defaultDelivery = stage === "verify-code"
      ? verifyCodeDiffDeliveryForPath(section.path)
      : phaseDiffDeliveryForPath(section.path);
    let delivery = selectedChangeIds.size > 0
      ? (selectedChangeIds.has(change.change_id) ? "included" : "summary")
      : defaultDelivery;
    if (boundedIncludedPaths !== null && delivery === "included" && !boundedIncludedPaths.has(section.path)) delivery = "summary";
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
  const indexedChanges = [...new Set(sections.map(({ path }) => changesByPath.get(path)?.change_id).filter(Boolean))];
  const covered = new Set(indexedChanges);
  const missing = changeMap.changes.map(({ change_id }) => change_id).filter((id) => !covered.has(id));
  if (missing.length > 0) throw new Error(`MATERIAL_INCOMPLETE: diff index misses change_ids ${missing.join(",")}`);
  const compactChanges = changeMap.changes.map((change) => ({
    change_id: change.change_id,
    path: change.path,
    new_line_ranges: newLineRangesFor(change),
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
      const anchorHasIncludedDiff = boundedIncludedPaths !== null
        ? boundedIncludedPaths.has(anchor.path)
        : (stage === "verify-code" ? verifyCodeDiffDeliveryForPath(anchor.path) : phaseDiffDeliveryForPath(anchor.path)) === "included";
      if (selectedChangeIds.size > 0 ? !selectedChangeIds.has(change.change_id) : !anchorHasIncludedDiff) return canonicalAnchorSource({ reviewDataRoot, source, anchor });
      const fullChange = changeMap.changes.find(({ change_id }) => change_id === change.change_id);
      const shard = change.shards.find(({ delivery }) => delivery === "included");
      if (!shard) throw new Error(`MATERIAL_INCOMPLETE: changed-path anchor ${anchor.id} has no included shard`);
      return { anchor_id: anchor.id, shard_id: shard.shard_id, source_lines: semanticAnchorRanges(fullChange, anchor) };
    }),
  };
  write(bundleRoot, "diff-index.json", Buffer.from(`${JSON.stringify(index)}\n`));
  return index;
}

export function validateDiffIndexBundle(bundleRoot, { stage = "build-code" } = {}) {
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
    if (!Array.isArray(change.new_line_ranges) || change.new_line_ranges.some((range) =>
      !range || !Number.isSafeInteger(range.start_line) || !Number.isSafeInteger(range.end_line)
      || range.start_line < 1 || range.end_line < range.start_line)) {
      throw new Error(`MATERIAL_INCOMPLETE: changed path ${change.path ?? change.change_id} has invalid new-line ranges`);
    }
    const defaultDelivery = stage === "verify-code"
      ? verifyCodeDiffDeliveryForPath(change.path ?? "")
      : phaseDiffDeliveryForPath(change.path ?? "");
    const requiresFullDiff = selectedChangeIds.size > 0
      ? selectedChangeIds.has(change.change_id)
      : stage !== "verify-code" && defaultDelivery === "included";
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

function packetAuthority(path, rule, { reviewScope = null } = {}) {
  if (path === "source.json") return { authority: "required", inclusion_reason: "immutable_snapshot_identity" };
  if (path === "changes.diff") return { authority: "required", inclusion_reason: "complete_phase_diff" };
  if (path === "diff-index.json") return { authority: "required", inclusion_reason: "complete_phase_diff_index" };
  if (path.startsWith("diff-shards/")) return { authority: "required", inclusion_reason: "selected_phase_diff_shard" };
  if (path === "change-map.json") return { authority: "required", inclusion_reason: "deterministic_phase_change_map" };
  if (path.startsWith("context/")) return { authority: "context", inclusion_reason: "map_selected_direct_context" };
  if (path === "evidence/test-summary.json") {
    return reviewScope === "integration"
      ? { authority: "required", inclusion_reason: "current_behavior_test_outcome" }
      : { authority: "evidence", inclusion_reason: "structured_test_receipt_summary" };
  }
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
    excluded.push({ category: "out_of_scope_diff_summaries", reason: "summary shards remain canonical audit material and are not provider-visible" });
  }
  excluded.push({ category: "canonical_raw_output", reason: "raw_logs_are_retained_for_audit_not_provider_delivery" });
  if (stage === "build-plan") {
    excluded.push({ category: "generated:planning_artifacts", reason: "stage-local spec-analyze projection duplicates declared provider materials" });
  }
  if (stage === "verify-code") excluded.push({ category: "canonical_acceptance_evidence_tree", reason: "not a code-review input" });
  if (stage === "build-code" && rule.source_bundle === "none") {
    excluded.push({ category: "material:ac_trace", reason: "host-only AC binding; provider reviews delivery behavior instead" });
    excluded.push({ category: "provider_context_overflow", reason: "provider receives a bounded set of delivery-critical implementation excerpts; host retains the complete authenticated anchor set" });
  }
  return excluded;
}

function isSummaryDiffShard(bundleRoot, path) {
  if (!path.startsWith("diff-shards/")) return false;
  try { return JSON.parse(firstTextLine(join(bundleRoot, ...path.split("/")))).delivery === "summary"; }
  catch { return false; }
}

function packetEntries(bundleRoot, rule, { reviewScope = null } = {}) {
  return filesUnder(bundleRoot)
    // planning_artifacts is a stage-local spec-analyze projection. The same
    // raw requirement/spec/plan/task bytes are already declared as the
    // provider inputs, so sending this generated projection as a second copy
    // spends transport budget without adding a review angle. Keep the file in
    // the bundle for the inline spec-analyze consumer, but exclude it from the
    // provider packet.
    .filter((path) => !isSummaryDiffShard(bundleRoot, path)
      && path !== "requirements/planning_artifacts.json"
      && path !== "canonical-evidence.json")
    .map((path) => {
    const filePath = join(bundleRoot, ...path.split("/"));
    const bytes = statSync(filePath).size;
    const entry = {
      path,
      bytes,
      ...packetAuthority(path, rule, { reviewScope }),
    };
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

function packetPlanBytes({ stage, reviewTrack, reviewScope, reviewKind = null, included, excluded, deliveryMode, deduplicatedMaterials = [] }) {
  const value = {
    schema_version: "wh-review-packet-plan.v1",
    stage,
    review_track: reviewTrack,
    review_scope: reviewScope,
    review_kind: reviewKind,
    delivery_mode: deliveryMode,
    included: compactPacketEntries(included),
    excluded,
    ...(deduplicatedMaterials.length > 0 ? { deduplicated_materials: deduplicatedMaterials } : {}),
  };
  return Buffer.from(`${deliveryMode === "selected_context" ? JSON.stringify(value) : JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writePacketPlan({ bundleRoot, stage, reviewTrack, reviewScope, reviewKind = null, rule, deduplicatedMaterials = [] }) {
  const payload = packetEntries(bundleRoot, rule, { reviewScope });
  const excluded = excludedPacketMaterial(rule, stage);
  const included = [...payload, { path: "packet-plan.json", authority: "metadata" }, { path: "manifest.json", authority: "metadata" }];
  const deliveryMode = reviewScope === "integration" || filesUnder(bundleRoot).includes("diff-index.json")
    ? "selected_context"
    : "inline_complete";
  const planBytes = packetPlanBytes({ stage, reviewTrack, reviewScope, reviewKind, included, excluded, deliveryMode, deduplicatedMaterials });
  write(bundleRoot, "packet-plan.json", planBytes);
  return JSON.parse(planBytes.toString("utf8"));
}

function selectedAnchors(materials, { integration = false } = {}) {
  const anchors = [];
  for (const key of ["context_map", "impact_map", "reuse_map", "acceptance_map", "evidence_map"]) {
    const map = materials[key];
    if (!map || !Array.isArray(map.entries)) continue;
    for (const entry of map.entries) for (const anchor of entry.anchors ?? []) anchors.push({ ...anchor, map: key, entry_id: entry.id, change_ids: entry.change_ids ?? [] });
  }
  for (const [key, idKey] of integration ? [] : [["ac_trace", "acceptance_criterion_id"]]) {
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
  if (integration) {
    for (const anchor of materials.implementation_context?.anchors ?? []) {
      anchors.push({ ...anchor, map: "implementation_context", entry_id: "implementation", change_ids: [] });
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

function writeSelectedContext({ bundleRoot, reviewDataRoot, source, materials, canonicalOnly = false, integration = false, diffIndex = null }) {
  const temporaryRoot = mkdtempSync(join(resolve(reviewDataRoot), "context-capture-"));
  try {
    const shardBackedAnchors = new Set((diffIndex?.anchors ?? []).filter(({ shard_id }) => typeof shard_id === "string").map(({ anchor_id }) => anchor_id));
    for (const anchor of selectedAnchors(materials, { integration })) {
      if (shardBackedAnchors.has(anchor.id)) continue;
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

function writeTestSummary({ bundleRoot, task, materials, sourceSnapshotTree = null, reviewKind = null, integration = false }) {
  const evidence = materials.test_evidence;
  if (integration && (evidence?.status === "unavailable" || evidence?.status === "missing")) {
    if (typeof evidence.reason !== "string" || evidence.reason.trim() === "") throw new Error("MATERIAL_INCOMPLETE: unavailable integration test evidence requires a reason");
    write(bundleRoot, "evidence/test-summary.json", Buffer.from(`${JSON.stringify({
      schema_version: "wh-review-test-summary.v1",
      status: "unavailable",
      reason: evidence.reason,
      raw_output_included: false,
    }, null, 2)}\n`, "utf8"));
    return;
  }
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence) || typeof evidence.receipt_ref !== "string" || typeof evidence.receipt_hash !== "string") return;
  const raw = assertTaskHandle(task).readRecord(evidence.receipt_ref);
  if (sha256(raw) !== evidence.receipt_hash.replace(/^sha256:/, "")) throw new Error("MATERIAL_INCOMPLETE: test receipt hash mismatch");
  let receipt;
  try { receipt = JSON.parse(raw); } catch { throw new Error("MATERIAL_INCOMPLETE: test receipt must be JSON"); }
  const summary = {
    schema_version: "wh-review-test-summary.v1",
    command: receipt.command ?? null,
    exit_code: receipt.exit_code ?? null,
    suite_scope: evidence.suite_scope ?? "unspecified",
    coverage_classes: evidence.coverage_classes ?? [],
    raw_output_included: false,
    ...(integration ? {} : {
      receipt_ref: evidence.receipt_ref,
      receipt_hash: evidence.receipt_hash.replace(/^sha256:/, ""),
      snapshot_tree: receipt.snapshot_tree ?? null,
      started_at: receipt.started_at ?? null,
      completed_at: receipt.completed_at ?? null,
      output_hash: receipt.output_hash ?? null,
    }),
  };
  if (reviewKind === "mini_task.implementation" && receipt.snapshot_tree !== sourceSnapshotTree) {
    throw new Error("MATERIAL_INCOMPLETE: mini-task implementation test receipt is not bound to the current snapshot");
  }
  write(bundleRoot, "evidence/test-summary.json", Buffer.from(`${JSON.stringify(summary, null, 2)}\n`, "utf8"));
}

export function buildReviewMaterials({ reviewDataRoot, attachmentRoot, source, task, taskId, stage, phaseId = null, reviewTrack = null, reviewScope = null, reviewKind = null, uiScope = false, materials = {}, strictV2Maps = false, directionMode = "full" } = {}) {
  if (!(reviewDataRoot && attachmentRoot && source && taskId)) throw new TypeError("reviewDataRoot, attachmentRoot, source, and taskId are required");
  const effectiveScope = reviewKind === null && stage === "build-code" ? (reviewScope ?? "phase") : null;
  const rule = ruleFor(reviewKind ?? stage, reviewTrack, effectiveScope);
  if (stage === "build-code" && effectiveScope === "integration" && !Object.hasOwn(materials, "test_evidence")) {
    // Semantic integration review can still inspect the final implementation
    // when the host has no current test receipt. Keep the missing fact explicit
    // so close remains incomplete and the provider never sees a fake GREEN.
    materials = {
      ...materials,
      test_evidence: {
        status: "unavailable",
        reason: "current integration test receipt was not provided; semantic review proceeds and formal close remains incomplete",
      },
    };
  }
  const missingRequired = rule.required.filter((key) => !(key in materials) || !materialPresent(materials[key]));
  if (missingRequired.length > 0) throw new Error(`MATERIAL_INCOMPLETE: missing or empty ${missingRequired.join(", ")}`);
  validateMaterialAllowlist(rule, materials);
  if (stage === "make-decision" && reviewTrack === "direction") {
    const allowed = new Set([...rule.required, ...rule.optional]);
    if (!["challenge", "combined"].includes(directionMode)) {
      for (const key of ["current_selection", "alternatives", "selection_rationale", "key_assumptions", "independent_reconstruction"]) {
        allowed.delete(key);
      }
    }
    for (const key of Object.keys(materials)) if (!allowed.has(key)) throw new Error(`MATERIAL_FORBIDDEN: direction forbids unknown material ${key}`);
  }
  for (const key of rule.forbidden) if (key in materials) throw new Error(`MATERIAL_FORBIDDEN: ${stage}/${reviewTrack ?? "default"} forbids ${key}`);
  const usesDiffBundle = rule.source_bundle === "diff";
  const diffIndex = usesDiffBundle ? diffIndexFor(source) : null;
  const changeMap = usesDiffBundle ? changeMapFor({ source, phaseId, diffIndex }) : null;
  validateV2AuthorityMaps(rule, materials, strictV2Maps, changeMap);
  const fixedInstructions = reviewInstructionsFor(stage, reviewTrack, uiScope, effectiveScope, reviewKind, directionMode);
  if (materials.review_instructions !== fixedInstructions) throw new Error("MATERIAL_FORBIDDEN: review_instructions must use the fixed stage template");
  if (stage === "verify-code") {
    // verify-code reviews code. AC and evidence completeness are owned by the
    // earlier stage that produced them and are not provider prerequisites.
  }
  if (stage === "build-code" && effectiveScope !== "integration" && reviewKind === null) {
    // Mini-task implementation has its own bounded AC/test/evidence contract
    // below. Do not apply the ordinary phase receipt contract to that packet.
    validateBuildCodeTestEvidence({ task, source, materials, strictV2Maps });
  }
  rejectDirectRawEvidence(materials);
  if (stage === "build-code" && effectiveScope === "integration") {
    validateIntegrationFreshTests({ task, source, materials });
    validateIntegrationMaterials({ task, source, materials });
  }
  if (reviewKind === "mini_task.implementation") {
    validateIntegrationMaterials({ task, source, materials });
  }
  if (stage === "build-code" && effectiveScope === "phase" && reviewKind === null) validateBuildCodeContextSelection({ source, materials, diffIndex });
  let providerMaterials = deduplicateDecisionMaterials(
    Object.fromEntries(Object.entries(materials)),
  );
  if (reviewKind === "mini_task.design" || reviewKind === "mini_task.implementation") {
    // raw_requirement is the bounded source view. Keep the full decision log
    // authoritative in the task store, but remove that same section from the
    // provider-facing projection so the requirement is delivered once.
    providerMaterials = {
      ...providerMaterials,
      decision_log: compactMiniTaskDecisionLog(providerMaterials.decision_log),
    };
  }
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
  if (stage === "build-code" && effectiveScope === "integration" && providerMaterials.approved_spec) {
    // The full approved spec remains immutable in the task store and is
    // archived here for provenance. Integration review only needs the AC
    // paragraphs that explain the current delivery surface; sending the full
    // decision/spec history makes the provider spend tokens on governance
    // material instead of finding cross-phase defects.
    const bytes = materialBytes(providerMaterials.approved_spec);
    const compacted = { ...providerMaterials };
    compacted.approved_spec = compactIntegrationSpec(
      providerMaterials.approved_spec,
      canonicalMaterialArchive({ reviewDataRoot, label: "integration-approved-spec", bytes }),
    );
    if (providerMaterials.acceptance_criteria) {
      const acceptanceBytes = materialBytes(providerMaterials.acceptance_criteria);
      compacted.acceptance_criteria = compactIntegrationAcceptanceCriteria(
        providerMaterials.acceptance_criteria,
        canonicalMaterialArchive({ reviewDataRoot, label: "integration-acceptance-criteria", bytes: acceptanceBytes }),
      );
    }
    // AC trace is required for host-side authentication and close facts, but
    // it is not a provider review target. Sending coverage_status, receipt
    // bindings, and task-row anchors turns an adversarial integration review
    // into evidence governance. Keep that ledger host-only, while preserving
    // a separate bounded set of final implementation excerpts for the actual
    // cross-phase behavior review.
    const implementationAnchors = compactIntegrationImplementationAnchors(materials.ac_trace?.implementation_anchors);
    const { ac_trace: _hostOnlyAcTrace, test_evidence: _hostOnlyTestEvidence, ...providerView } = compacted;
    providerMaterials = implementationAnchors?.length
      ? {
        ...providerView,
        implementation_context: {
          schema_version: "wh-review-integration-implementation-context.v1",
          anchors: implementationAnchors,
        },
      }
      : providerView;
  }
  if (stage === "build-plan") {
    const rawRequirement = materials.raw_requirement ?? null;
    providerMaterials.planning_artifacts = buildPlanningArtifacts({
      rawRequirementIndex: rawRequirement,
      approvedSpec: materials.approved_spec ?? null,
      acceptanceCriteria: materials.acceptance_criteria ?? null,
      draftPlan: materials.draft_plan ?? null,
      draftTasks: materials.draft_tasks ?? null,
      deferredItems: rawRequirement && typeof rawRequirement === "object" ? rawRequirement.deferred_items ?? null : null,
      openItems: rawRequirement && typeof rawRequirement === "object" ? rawRequirement.open_items ?? null : null,
    });
  }
  providerMaterials = redactProviderHostPaths(providerMaterials);
  const providerMaterialDeduplication = deduplicateProviderMaterials(providerMaterials, rule);
  providerMaterials = providerMaterialDeduplication.materials;

  const packetRoot = resolve(attachmentRoot, ".wh-review-packets");
  mkdirSync(packetRoot, { recursive: true });
  const bundleRoot = mkdtempSync(join(packetRoot, `bundle-${stage}-${reviewTrack ?? "default"}-`));
  let bundleDiffIndex = null;
  const boundedVerifyCodeDiff = stage === "verify-code" && source.diffBytes > VERIFY_CODE_FULL_INLINE_LIMIT_BYTES;
  if (rule.source_bundle === "diff") {
    write(bundleRoot, "source.json", Buffer.from(`${JSON.stringify({
      target_commit: source.targetCommit,
      base_commit: source.baseCommit,
      base_tree: source.baseTree,
      captured_head: source.capturedHead,
      snapshot_tree: source.snapshotTree,
      ...(source.phaseEvidenceBinding === undefined ? {} : { phase_evidence: source.phaseEvidenceBinding }),
    })}\n`));
    if (source.diffBytes <= PHASE_DIFF_INLINE_LIMIT_BYTES && !boundedVerifyCodeDiff) {
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
      if (!boundedVerifyCodeDiff) bundleDiffIndex = writeShardedPhaseDiff({ bundleRoot, reviewDataRoot, source, changeMap, materials, stage });
    }
  }
  const stagePlan = stagePlanFor(stage, reviewTrack, reviewKind);
  if (!stagePlan) throw new Error(`MATERIAL_INCOMPLETE: no review skill plan for ${reviewKind ?? `${stage}/${reviewTrack ?? "default"}`}`);
  const contractName = reviewKind === "mini_task.design" ? "mini-task-design" : reviewKind === "mini_task.implementation" ? "mini-task-implementation" : stage === "make-decision" ? "make-decision" : stage;
  const contractBytes = readRegisteredFile(resolve(here, "..", "contracts", `${contractName}.md`), `${contractName} contract`);
  write(bundleRoot, `contracts/${contractName}.md`, contractBytes);
  const providerProtocol = reviewKind === "mini_task.design" || reviewKind === "mini_task.implementation"
    ? Buffer.from(MINI_TASK_PROVIDER_PROTOCOL, "utf8")
    : readRegisteredFile(resolve(here, "..", "contracts", "provider-protocol.md"), "provider protocol");
  write(bundleRoot, "contracts/provider-protocol.md", providerProtocol);
  const selectedSkills = [...(stagePlan?.required_skills ?? []), ...(uiScope === true ? (stagePlan?.optional_skills ?? []).filter(({ when }) => when === "ui").map(({ name }) => name) : [])];
  if (["build-code", "verify-code"].includes(stage) && (stagePlan.required_skills ?? []).length === 0) throw new Error(`MATERIAL_INCOMPLETE: ${stage} requires explicit reviewer skills`);
  for (const skill of selectedSkills) {
    write(bundleRoot, `skills/${skill}/SKILL.md`, readRegisteredFile(resolve(workflowhubSkills, skill, "SKILL.md"), `${skill} skill`));
  }

  for (const [key, value] of Object.entries(providerMaterials)) {
    const path = key === "review_instructions" ? "review-instructions.md" : providerMaterialPath(key, value);
    write(bundleRoot, path, reviewMaterialBytes(key, value));
  }
  freezeCanonicalEvidence({ bundleRoot, task, stage, materials, integration: stage === "build-code" && effectiveScope === "integration" });
  writeTestSummary({ bundleRoot, task, materials, sourceSnapshotTree: source.snapshotTree, reviewKind, integration: stage === "build-code" && effectiveScope === "integration" });
  if (boundedVerifyCodeDiff) {
    const fixedDeliveryBytes = filesUnder(bundleRoot).reduce((total, path) => total + statSync(join(bundleRoot, ...path.split("/"))).size, 0);
    const includedDiffBudgetBytes = Math.max(0, REVIEW_PACKET_MAX_DELIVERY_BYTES - fixedDeliveryBytes - VERIFY_CODE_PACKET_METADATA_RESERVE_BYTES);
    bundleDiffIndex = writeShardedPhaseDiff({ bundleRoot, reviewDataRoot, source, changeMap, materials, stage, includedDiffBudgetBytes });
  }
  // Context is never inferred from repository size or file membership. Every
  // provider-visible source excerpt is named by a validated stage map anchor.
  // Deferred verify-code packets build the diff index first so a shard-backed
  // anchor is not delivered a second time as context.
  writeSelectedContext({
    bundleRoot,
    reviewDataRoot,
    source,
    materials: providerMaterials,
    integration: stage === "build-code" && effectiveScope === "integration",
    canonicalOnly: false,
    diffIndex: bundleDiffIndex,
  });
  validateDiffIndexBundle(bundleRoot, { stage });
  const packetPlan = writePacketPlan({ bundleRoot, stage, reviewTrack, reviewScope: effectiveScope, reviewKind, rule, deduplicatedMaterials: providerMaterialDeduplication.deduplicated });
  const payloadFiles = filesUnder(bundleRoot);
  const fullEntries = payloadFiles.map((path) => {
    const filePath = join(bundleRoot, ...path.split("/"));
    return { path, bytes: statSync(filePath).size, sha256: sha256File(filePath) };
  });
  const providerPaths = new Set(Object.values(packetPlan.included).flat());
  // canonical-evidence.json remains a local authenticated audit index. It is
  // not provider material, so remove it at the packet boundary and derive the
  // public identity from the same one canonical manifest used for delivery.
  const entries = fullEntries.filter(({ path }) => providerPaths.has(path) && path !== "canonical-evidence.json");
  const manifest = canonicalMaterialManifest(entries);
  const materialId = sha256(Buffer.from(manifest, "utf8"));
  write(bundleRoot, "manifest.json", Buffer.from(manifest, "utf8"));
  const manifestBytes = Buffer.from(manifest, "utf8");
  const deliveryManifest = [...entries, { path: "manifest.json", bytes: manifestBytes.length, sha256: sha256(manifestBytes) }];
  const deliveryBytes = deliveryManifest.reduce((total, entry) => total + entry.bytes, 0);
  if (deliveryBytes > REVIEW_PACKET_MAX_DELIVERY_BYTES) {
    const error = new Error("MATERIAL_TOO_LARGE: review packet exceeds 330 KiB after content deduplication and semantic slicing");
    error.code = "MATERIAL_TOO_LARGE";
    throw error;
  }
  const sourcePrefix = relative(resolve(attachmentRoot), bundleRoot).replaceAll("\\", "/");
  return Object.freeze({
    bundleRoot,
    attachmentRoot: resolve(attachmentRoot),
    sourcePrefix,
    materialId,
    contractId: `wh-review.contract.${contractName}.v1`,
    contractHash: sha256(contractBytes),
    files: Object.freeze([...entries.map(({ path }) => path), "manifest.json"]),
    manifest: Object.freeze(entries),
    deliveryManifest: Object.freeze(deliveryManifest),
    packetPlan: Object.freeze({ ...packetPlan, delivery_bytes: deliveryBytes, delivery_ref_count: deliveryManifest.length }),
  });
}

function freezeCanonicalEvidence({ bundleRoot, task, stage, materials, integration = false }) {
  // Verify-code does not build a canonical evidence packet. The code-review
  // subject is the current diff and its implementation context; writing an
  // empty placeholder would turn a code review into evidence governance.
  if (stage !== "build-code" || integration) return;
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
