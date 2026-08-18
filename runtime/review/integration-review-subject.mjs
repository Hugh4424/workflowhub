import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { extname } from "node:path";
import { assertArtifactDir } from "../../core/artifact-dir.mjs";
import { validateCanonicalImplementationReceipt, validateCanonicalTestReceipt } from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { isExecutionRecordOnlyMaterialDelta } from "../../runtime/task/git-worktree-snapshot.mjs";

const OID = /^[a-f0-9]{40,64}$/;
const HASH = /^[a-f0-9]{64}$/;
const MATERIAL_NAMES = Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);

function incomplete(message) {
  const error = new Error(`MATERIAL_INCOMPLETE: ${message}`);
  error.code = "MATERIAL_INCOMPLETE";
  throw error;
}

const sha256 = (raw) => createHash("sha256").update(raw).digest("hex");

function requiredTask(task) {
  if (!task || typeof task !== "object" || typeof task.readRecord !== "function"
      || typeof task.identity?.taskId !== "string" || task.identity.taskId === "") {
    throw new TypeError("task with identity.taskId and readRecord is required");
  }
  return task;
}

function git(root, args, label) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    throw new Error(`${label} failed: ${error?.stderr?.toString().trim() || error?.message || "Git command failed"}`);
  }
}

function currentMaterials(_task, artifacts) {
  const safeArtifacts = assertArtifactDir(artifacts);
  const texts = {};
  for (const name of MATERIAL_NAMES) {
    let raw;
    try { raw = safeArtifacts.read(name, "utf8"); }
    catch (error) {
      if (error?.code === "ENOENT") incomplete(`current material is missing: ${name}`);
      throw error;
    }
    texts[name] = raw;
  }
  const materialDigest = sha256(JSON.stringify(MATERIAL_NAMES.map((name) => [name, texts[name]])));
  return Object.freeze({
    ref: "current-four-materials",
    sha256: materialDigest,
    material_digest: materialDigest,
    texts: Object.freeze(texts),
    spec_ref: safeArtifacts.reference("spec.md"),
    tasks_ref: safeArtifacts.reference("tasks.md"),
  });
}

function binding(task, item, label) {
  if (!item || typeof item.ref !== "string" || !HASH.test(item.sha256 ?? "")) incomplete(`${label} binding is invalid`);
  let raw;
  try { raw = task.readRecord(item.ref); }
  catch (error) {
    if (error?.code === "ENOENT") incomplete(`${label} is missing: ${item.ref}`);
    throw error;
  }
  if (sha256(raw) !== item.sha256) incomplete(`${label} hash mismatch: ${item.ref}`);
  let value;
  try { value = JSON.parse(raw); } catch { incomplete(`${label} is not JSON: ${item.ref}`); }
  return Object.freeze({ ref: item.ref, sha256: item.sha256, value });
}

function ids(text) {
  const found = new Set([
    ...(text.match(/\bAC-\d+\b/g) ?? []),
    ...(text.match(/\bAC-[A-Z][A-Z0-9-]*-\d+\b/g) ?? []),
  ]);
  for (const match of text.matchAll(/\bAC-(\d+)\s*[—–-]\s*(?:AC-)?(\d+)\b/g)) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end < start || end - start > 100) continue;
    const width = Math.max(match[1].length, match[2].length);
    for (let value = start; value <= end; value += 1) found.add(`AC-${String(value).padStart(width, "0")}`);
  }
  return [...found];
}

function lineFor(text, token) {
  const line = text.split("\n").findIndex((value) => value.includes(token));
  return line < 0 ? 1 : line + 1;
}

function acceptanceLineFor(text, acceptanceId) {
  const escaped = acceptanceId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alias = new RegExp(`\\b${escaped}\\s*=\\s*(AC-[A-Za-z]+-\\d+)\\b`).exec(text)?.[1];
  if (alias) {
    const detailed = text.split("\n").findIndex((value) => value.includes(`**${alias}**`));
    if (detailed >= 0) return detailed + 1;
  }
  const matcher = new RegExp(`^\\s*-\\s*\\[[ xX]\\]\\s*\\*\\*${escaped}\\*\\*\\b`, "m");
  const match = matcher.exec(text);
  return match ? text.slice(0, match.index).split("\n").length : lineFor(text, acceptanceId);
}

function completedTasks(task, taskText) {
  const output = [];
  const matcher = /^#{2,4}\s+(T\d+)\b[^\n]*\n([\s\S]*?)(?=^#{2,4}\s+T\d+\b|(?![\s\S]))/gm;
  for (const found of taskText.matchAll(matcher)) {
    const [whole, taskId, body] = found;
    const status = /^-\s+\*\*(?:状态|status)\*\*\s*[:：]\s*`?(completed|passed)`?\s*$/mi.exec(body)?.[1];
    if (!status) continue;
    const traceLine = /^-\s+\*\*(?:Trace|追踪)\*\*\s*[:：]\s*([^\n]+)$/mi.exec(body)?.[1] ?? "";
    const coveredAcLine = /^-\s+\*\*(?:covered_ac|覆盖 AC)\*\*\s*[:：]\s*([^\n]+)$/mi.exec(body)?.[1] ?? "";
    const acLine = coveredAcLine || traceLine || (/^-\s+\*\*AC\*\*\s*[:：]\s*([^\n]+)$/mi.exec(body)?.[1] ?? "");
    const acceptanceIds = ids(acLine);
    const evidenceRefsLine = /^-\s+\*\*(?:evidence_refs|证据引用)\*\*\s*[:：]\s*([^\n]+)$/mi.exec(body)?.[1] ?? "";
    const evidenceLine = /^-\s+\*\*(?:证据|evidence)\*\*\s*[:：]\s*([^\n]+)$/mi.exec(body)?.[1] ?? "";
    const legacyEvidencePathLine = /^-\s+\*\*evidence_path\*\*\s*[:：]\s*([^\n]+)$/mi.exec(body)?.[1] ?? "";
    const evidenceText = evidenceRefsLine || evidenceLine || legacyEvidencePathLine;
    const refs = [...evidenceText.matchAll(/`((?:quality\/)?(?:evidence|tests)\/[^`]+)`/gi)].map((match) => match[1].startsWith("quality/") ? match[1] : `quality/${match[1]}`);
    const historyGapReasons = [];
    if (acceptanceIds.length === 0) historyGapReasons.push("Trace AC ids are missing");
    if (refs.length === 0) historyGapReasons.push("evidence refs are missing");
    const missingEvidenceRefs = [];
    const evidenceBindings = refs.flatMap((ref) => {
      if (!/^quality\/(?:evidence|tests)\//.test(ref)) incomplete(`${taskId} evidence path is outside quality namespaces: ${ref}`);
      let raw;
      try { raw = task.readRecord(ref); }
      catch (error) {
        // Historical task-card evidence is advisory.  A missing RED or old
        // receipt must remain visible as an audit gap, but it must not stop
        // the current implementation/GREEN-bound integration review.
        if (error?.code === "ENOENT") {
          missingEvidenceRefs.push(ref);
          return [];
        }
        throw error;
      }
      return [binding(task, { ref, sha256: sha256(raw) }, `${taskId} evidence`)];
    });
    const parsedChanges = /^-\s+\*\*(?:执行事实|execution facts?)\*\*\s*[:：][ \t]*([^\n]*)$/mi.exec(body)?.[1]?.trim();
    if (!parsedChanges || /^(?:N\/A|none|not started|未开始)\b/i.test(parsedChanges)) {
      // The current implementation/GREEN receipts remain the review
      // authority.  An old task card without execution facts is an audit
      // disclosure, not a reason to suppress the current semantic review.
      historyGapReasons.push("execution facts are missing");
    }
    const actualChanges = parsedChanges ?? "historical task-card record is incomplete; current implementation and GREEN receipts remain authoritative";
    if (/\b(?:inconclusive|not[_ -]?computable|unavailable|未完成|不完整|不可计算|无法计算)\b/i.test(actualChanges)) {
      historyGapReasons.push("task summary explicitly records incomplete or unavailable evidence");
    }
    const bodyOffset = found.index + whole.indexOf(body);
    const firstContentOffset = body.search(/\S/);
    const line = taskText.slice(0, bodyOffset + Math.max(0, firstContentOffset)).split("\n").length;
    output.push(Object.freeze({
      task_id: taskId,
      acceptance_ids: acceptanceIds,
      evidence: evidenceBindings,
      ...(missingEvidenceRefs.length || historyGapReasons.length ? {
        history_incomplete: true,
        ...(missingEvidenceRefs.length ? { missing_evidence_refs: Object.freeze(missingEvidenceRefs) } : {}),
        history_gap_reasons: Object.freeze(historyGapReasons),
      } : {}),
      summary: actualChanges,
      line,
    }));
  }
  return output;
}

function isCanonicalPassingBuildCodeTest(taskHandle, value) {
  try {
    validateCanonicalTestReceipt(value, {
      taskId: taskHandle.identity.taskId,
      stage: "build-code",
      snapshotTree: value?.snapshot_tree,
      subject: "build-code-test-capture",
      allowedProducerComponents: ["build-code-test-capture"],
      expectedCommand: "npm test",
      requirePassed: true,
    });
    const output = taskHandle.readRecord(value.output_ref);
    return sha256(output) === value.output_hash;
  } catch {
    return false;
  }
}

function isCanonicalImplementationReceipt(taskHandle, value) {
  try {
    validateCanonicalImplementationReceipt(value, {
      taskId: taskHandle.identity.taskId,
      snapshotTree: value?.snapshot_tree,
      read: (ref) => taskHandle.readRecord(ref),
    });
    return true;
  } catch {
    return false;
  }
}

function integrationContextPath(path) {
  const skillPath = (name) => ["skills", name, ""].join("/");
  if (path.startsWith("node_modules/")
      || path.startsWith(".git/")
      || path.startsWith("dist/")
      || path.startsWith("build/")
      || path.startsWith("coverage/")
      || path.startsWith("docs/")
      || path.startsWith("specs/")) return false;
  if (path.startsWith("runtime/")
      || path.startsWith("core/")
      || path.startsWith("tools/")
      || path.startsWith("contracts/")
      || path.startsWith("workflows/")) return true;
  if (path.startsWith(skillPath("wh-review")) || path.startsWith(skillPath("mini-task"))) {
    return !path.includes("/__tests__/");
  }
  if (path.startsWith("tests/contract/") || path.startsWith("tests/integration/")) return true;
  // Integration review must work for arbitrary project repositories. Keep the
  // WorkflowHub allowlist above, but also include ordinary source files from
  // project-owned directories such as `paperbuilder/`, `frontend/`, or `src/`.
  // Tests, fixtures, and generated assets are already represented by the
  // explicit test evidence and should not become implementation anchors.
  if (/(^|\/)(?:test|tests|__tests__|fixtures|fixture)(?:\/|$)/i.test(path)) return false;
  return new Set([
    ".c", ".cc", ".cpp", ".cxx", ".css", ".go", ".h", ".hpp", ".java",
    ".js", ".jsx", ".mjs", ".php", ".py", ".rb", ".rs", ".scss", ".sql",
    ".swift", ".ts", ".tsx", ".vue",
  ]).has(extname(path).toLowerCase());
}

function finalSnapshotImplementationAnchors({ sourceRoot, baseTree, finalTree, executedEntryPoints = [] }) {
  const changed = git(sourceRoot, ["diff", "--name-only", baseTree, finalTree, "--", ".", ":(exclude)node_modules"], "final snapshot changed files")
    .split("\n").map((path) => path.trim()).filter(integrationContextPath);
  if (changed.includes("runtime/review/integration-review-subject.mjs")) {
    for (const entryPoint of executedEntryPoints) {
      if (typeof entryPoint !== "string" || entryPoint === "" || entryPoint.startsWith("/") || entryPoint.includes("..")) continue;
      try {
        git(sourceRoot, ["cat-file", "-e", `${finalTree}:${entryPoint}`], "integration review entry point");
        if (!changed.includes(entryPoint)) changed.push(entryPoint);
      } catch { /* a minimal fixture may not carry the caller's entry point */ }
    }
  }
  const anchors = [];
  for (const path of changed) {
    const patch = git(sourceRoot, ["diff", "--unified=16", baseTree, finalTree, "--", path], `final snapshot diff for ${path}`);
    let current;
    try {
      current = git(sourceRoot, ["show", `${finalTree}:${path}`], `final snapshot file for ${path}`);
    } catch (error) {
      // A deleted implementation file has no final-snapshot bytes to anchor.
      // The bounded deletion patch remains in changes.diff; omitting the
      // impossible snapshot excerpt keeps the semantic review available.
      if (String(error?.message ?? "").includes("final snapshot file for")) continue;
      throw error;
    }
    const lineCount = current === "" ? 1 : current.split("\n").length;
    const ranges = [];
    for (const match of patch.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
      const start = Math.max(1, Number(match[1]) - 16);
      const count = Number(match[2] ?? 1);
      ranges.push({ start, end: Math.min(lineCount, Math.max(start, Number(match[1]) + count - 1 + 16)) });
    }
    if (ranges.length === 0 && lineCount > 0) ranges.push({ start: 1, end: Math.min(lineCount, 160) });
    for (const [index, range] of ranges.slice(0, 3).entries()) anchors.push(Object.freeze({
      id: `implementation-${path.replaceAll("/", "__")}-${index + 1}`,
      path, start_line: range.start, end_line: range.end, role: "implementation",
      outside_diff_reason: "Integration review uses bounded final-snapshot excerpts; it intentionally omits the cumulative diff.",
      reason: "current final-snapshot implementation excerpt selected from the changed source hunk",
    }));
  }
  return Object.freeze(anchors);
}

function snapshotMatchesCurrent(value, finalTree, sourceRoot, taskId) {
  return value?.snapshot_tree === finalTree
    || (typeof sourceRoot === "string"
      && isExecutionRecordOnlyMaterialDelta(sourceRoot, value?.snapshot_tree, finalTree, taskId));
}

function currentBinding(tasks, finalTree, kind, taskHandle, currentRef, sourceRoot) {
  const snapshotCurrent = (value) => snapshotMatchesCurrent(value, finalTree, sourceRoot, taskHandle.identity.taskId);
  const selected = [];
  for (const task of tasks) for (const item of task.evidence) {
    const value = item.value;
    const implementation = kind === "implementation"
      && (item.ref.startsWith("quality/evidence/implementation/") || item.ref === "quality/evidence/implementation.json")
      && isCanonicalImplementationReceipt(taskHandle, value);
    const green = kind === "green" && item.ref.startsWith("quality/tests/") && isCanonicalPassingBuildCodeTest(taskHandle, value);
    if ((implementation || green) && snapshotCurrent(value)) selected.push(item);
  }
  if (typeof currentRef === "string" && currentRef !== "") {
    let raw;
    try { raw = taskHandle.readRecord(currentRef); }
    catch (error) { if (error?.code === "ENOENT") raw = null; else throw error; }
    if (raw !== null) {
      const value = JSON.parse(raw);
      const validImplementation = kind === "implementation" && isCanonicalImplementationReceipt(taskHandle, value);
      const validGreen = kind === "green" && isCanonicalPassingBuildCodeTest(taskHandle, value);
      if ((validImplementation || validGreen) && snapshotCurrent(value)) selected.push({ ref: currentRef, sha256: sha256(raw), value });
    }
  }
  if (selected.length === 0) incomplete(`current ${kind} receipt for final snapshot is missing`);
  selected.sort((left, right) => (right.value?.completed_at ?? right.value?.started_at ?? "").localeCompare(left.value?.completed_at ?? left.value?.started_at ?? "") || right.ref.localeCompare(left.ref));
  const first = selected[0];
  return Object.freeze({ ref: first.ref, sha256: first.sha256, value: first.value });
}

function optionalCurrentBinding(tasks, finalTree, kind, taskHandle, currentRef, sourceRoot) {
  try {
    return currentBinding(tasks, finalTree, kind, taskHandle, currentRef, sourceRoot);
  } catch (error) {
    // A missing, stale, or invalid quality receipt is a close-time fact. It
    // must remain visible as unavailable, but it must not suppress the
    // semantic review of the final implementation snapshot.
    if (error?.code === "MATERIAL_INCOMPLETE") return null;
    throw error;
  }
}

function unavailable({ sourceRoot, finalTree, reason }) {
  const base_commit = git(sourceRoot, ["rev-parse", "HEAD"], "current snapshot");
  const base_tree = git(sourceRoot, ["rev-parse", "HEAD^{tree}"], "current snapshot");
  return Object.freeze({
    schema_version: "integration-review-subject.v1", subject_kind: "worktree", review_scope: "integration",
    base_commit, base_tree, snapshot_tree: finalTree,
    formal_record_status: Object.freeze({ status: "unavailable", reason }),
    audit_gaps: Object.freeze([{ kind: "current_review_materials", status: "unavailable", reason }]),
    ac_trace: Object.freeze({ schema_version: "ac-change-test-trace.v1", snapshot_tree: finalTree, acceptance_ids: Object.freeze([]), entries: Object.freeze([]) }),
  });
}

/** Build the integration packet from the current four materials and current facts only. */
export function buildIntegrationReviewSubject({ task, sourceRoot, artifacts, finalTree, current_receipts = {}, executed_entry_points = [] } = {}) {
  const safeTask = requiredTask(task);
  if (typeof sourceRoot !== "string" || sourceRoot === "") throw new TypeError("sourceRoot is required");
  if (!OID.test(finalTree ?? "")) throw new TypeError("finalTree is invalid");
  const materials = currentMaterials(safeTask, artifacts);
  const base_commit = git(sourceRoot, ["rev-parse", "HEAD"], "current snapshot");
  const base_tree = git(sourceRoot, ["rev-parse", "HEAD^{tree}"], "current snapshot");
  const acceptanceIds = ids(materials.texts["spec.md"]);
  if (acceptanceIds.length === 0) incomplete("current spec declares no acceptance criteria");
  const tasks = completedTasks(safeTask, materials.texts["tasks.md"]);
  const covered = new Map();
  for (const item of tasks) {
    if (item.history_incomplete === true) continue;
    for (const id of item.acceptance_ids) covered.set(id, [...(covered.get(id) ?? []), item]);
  }
  const implementation = optionalCurrentBinding(tasks, finalTree, "implementation", safeTask, current_receipts.implementation_ref, sourceRoot);
  const green = optionalCurrentBinding(tasks, finalTree, "green", safeTask, current_receipts.green_ref, sourceRoot);
  const implementationAnchors = finalSnapshotImplementationAnchors({ sourceRoot, baseTree: base_tree, finalTree, executedEntryPoints: executed_entry_points });
  const auditGaps = [];
  if (implementation === null) {
    auditGaps.push(Object.freeze({ kind: "current_implementation_receipt", status: "unavailable", reason: "current implementation receipt for final snapshot is missing or invalid; semantic review uses final-snapshot implementation anchors" }));
  }
  if (green === null) {
    auditGaps.push(Object.freeze({ kind: "current_green_receipt", status: "unavailable", reason: "current GREEN test receipt for final snapshot is missing or invalid; semantic review continues but formal close remains incomplete" }));
  }
  if (tasks.length === 0) auditGaps.push(Object.freeze({ kind: "task_completion_history", status: "incomplete", reason: "current tasks.md has no completed Task rows; current implementation and GREEN receipts remain authoritative" }));
  else {
    for (const item of tasks.filter(({ history_incomplete }) => history_incomplete === true)) {
      auditGaps.push(Object.freeze({
        kind: "task_completion_history",
        status: "incomplete",
        reason: `${item.task_id} historical task-card facts are incomplete (${[
          ...(item.missing_evidence_refs ?? []),
          ...(item.history_gap_reasons ?? []),
        ].join(", ")}); current implementation and GREEN receipts remain authoritative`,
      }));
    }
    const uncovered = acceptanceIds.filter((id) => !covered.has(id));
    if (uncovered.length) auditGaps.push(Object.freeze({ kind: "task_completion_history", status: "incomplete", reason: `current tasks.md has no completed Task row for ${uncovered.join(", ")}; current implementation and GREEN receipts remain authoritative` }));
  }
  const entries = acceptanceIds.map((id) => {
    const items = covered.get(id) ?? [];
    const hasTaskCoverage = items.length > 0;
    const explicitTests = [...new Map(items.flatMap((item) => item.evidence ?? [])
      .filter((item) => item.ref.startsWith("quality/tests/")
        && snapshotMatchesCurrent(item.value, finalTree, sourceRoot, safeTask.identity.taskId)
        && isCanonicalPassingBuildCodeTest(safeTask, item.value))
      .map((item) => [item.ref, { receipt_ref: item.ref, receipt_hash: item.sha256 }])).values()];
    const hasExplicitTest = explicitTests.length > 0;
    return Object.freeze({
      acceptance_criterion_id: id,
      coverage_status: hasTaskCoverage && hasExplicitTest ? "covered" : "unknown",
      coverage_reason: hasTaskCoverage && hasExplicitTest
        ? "a current completed Task row names this acceptance criterion and binds an explicit passing test receipt"
        : hasTaskCoverage
          ? "the Task row names this acceptance criterion but has no explicit passing test binding; the shared GREEN receipt is not AC proof"
          : "no current completed Task row names this acceptance criterion; shared receipts are fallback facts only",
      // The current trace keeps the semantic change summary, but does not
      // repeat every historical receipt binding once per AC. Those immutable
      // receipt facts remain in the task store; integration review needs the
      // current implementation/test binding and the short change explanation.
      change: Object.freeze(items.length
        ? items.map((item) => ({ task_id: item.task_id, summary: item.summary }))
        : [{ task_id: null, summary: "no completed Task row; current implementation and GREEN receipts are fallback facts only" }]),
      test: Object.freeze(explicitTests),
      evidence: Object.freeze(implementation ? [{ ref: implementation.ref, sha256: implementation.sha256 }] : []),
      ...(implementation ? {} : {
        evidence_status: "unavailable",
        evidence_reason: "current implementation receipt is unavailable; final-snapshot implementation anchors remain available for semantic review",
      }),
      anchors: Object.freeze(items.length ? items.map((item) => ({ id: `${item.task_id}:${id}`, path: materials.tasks_ref, start_line: item.line, end_line: item.line, role: "completion", outside_diff_reason: "Integration review reads the current task fact; it intentionally omits the cumulative diff.", reason: "current task completion evidence" })) : [{ id: `current-spec:${id}`, path: materials.spec_ref, start_line: acceptanceLineFor(materials.texts["spec.md"], id), end_line: acceptanceLineFor(materials.texts["spec.md"], id), role: "acceptance", outside_diff_reason: "Integration review reads the current specification; it intentionally omits the cumulative diff.", reason: "current specification acceptance criterion" }]),
    });
  });
  return Object.freeze({
    schema_version: "integration-review-subject.v1", subject_kind: "worktree", review_scope: "integration",
    base_commit, base_tree, snapshot_tree: finalTree,
    material_revision: { ref: materials.ref, sha256: materials.sha256 },
    formal_record_status: Object.freeze(auditGaps.length ? { status: "unavailable", reason: auditGaps.map(({ reason }) => reason).join("; ") } : { status: "available", reason: "current materials and same-snapshot implementation/GREEN evidence are complete" }),
    audit_gaps: Object.freeze(auditGaps),
    ac_trace: Object.freeze({ schema_version: "ac-change-test-trace.v1", snapshot_tree: finalTree, acceptance_ids: Object.freeze(acceptanceIds), entries: Object.freeze(entries), implementation_anchors: implementationAnchors }),
  });
}

export function inspectIntegrationReviewSubject(options = {}) {
  try { return buildIntegrationReviewSubject(options); }
  catch (error) {
    if (error?.code !== "MATERIAL_INCOMPLETE") throw error;
    return unavailable({ sourceRoot: options.sourceRoot, finalTree: options.finalTree, reason: String(error.message).replace(/^MATERIAL_INCOMPLETE:\s*/, "") });
  }
}
