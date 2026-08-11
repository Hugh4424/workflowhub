import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { assertArtifactDir } from "../../core/artifact-dir.mjs";

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

function ids(text) { return [...new Set((text.match(/\bAC-\d+\b/g) ?? []))]; }

function lineFor(text, token) {
  const line = text.split("\n").findIndex((value) => value.includes(token));
  return line < 0 ? 1 : line + 1;
}

function acceptanceLineFor(text, acceptanceId) {
  const escaped = acceptanceId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    if (acceptanceIds.length === 0 || refs.length === 0) incomplete(`completed ${taskId} lacks Trace AC ids or evidence_path`);
    const evidenceBindings = refs.map((ref) => {
      if (!/^quality\/(?:evidence|tests)\//.test(ref)) incomplete(`${taskId} evidence path is outside quality namespaces: ${ref}`);
      let raw;
      try { raw = task.readRecord(ref); }
      catch (error) {
        if (error?.code === "ENOENT") incomplete(`${taskId} evidence is missing: ${ref}`);
        throw error;
      }
      return binding(task, { ref, sha256: sha256(raw) }, `${taskId} evidence`);
    });
    const actualChanges = /^-\s+\*\*(?:执行事实|execution facts?)\*\*\s*[:：][ \t]*([^\n]*)$/mi.exec(body)?.[1]?.trim();
    if (!actualChanges || /^(?:N\/A|none|not started|未开始)\b/i.test(actualChanges)) incomplete(`completed ${taskId} lacks execution facts`);
    const bodyOffset = found.index + whole.indexOf(body);
    const line = taskText.slice(0, bodyOffset).split("\n").length;
    output.push(Object.freeze({ task_id: taskId, acceptance_ids: acceptanceIds, evidence: evidenceBindings, summary: actualChanges, line }));
  }
  return output;
}

function finalSnapshotImplementationAnchors({ sourceRoot, baseTree, finalTree }) {
  const changed = git(sourceRoot, ["diff", "--name-only", baseTree, finalTree, "--", ".", ":(exclude)node_modules"], "final snapshot changed files")
    .split("\n").map((path) => path.trim()).filter((path) => /^(?:core|runtime|skills|tools|workflows|tests)\//.test(path));
  const anchors = [];
  for (const path of changed) {
    const patch = git(sourceRoot, ["diff", "--unified=16", baseTree, finalTree, "--", path], `final snapshot diff for ${path}`);
    const current = git(sourceRoot, ["show", `${finalTree}:${path}`], `final snapshot file for ${path}`);
    const lineCount = current === "" ? 1 : current.split("\n").length;
    const ranges = [];
    for (const match of patch.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
      const start = Math.max(1, Number(match[1]) - 16);
      const count = Number(match[2] ?? 1);
      ranges.push({ start, end: Math.min(lineCount, Math.max(start, Number(match[1]) + count - 1 + 16)) });
    }
    if (ranges.length === 0 && lineCount > 0) ranges.push({ start: 1, end: Math.min(lineCount, 160) });
    for (const [index, range] of ranges.entries()) anchors.push(Object.freeze({
      id: `implementation-${path.replaceAll("/", "__")}-${index + 1}`,
      path, start_line: range.start, end_line: range.end, role: "implementation",
      reason: "current final-snapshot implementation excerpt selected from the changed source hunk",
    }));
  }
  return Object.freeze(anchors);
}

function currentBinding(tasks, finalTree, kind, taskHandle, currentRef) {
  const selected = [];
  for (const task of tasks) for (const item of task.evidence) {
    const value = item.value;
    const implementation = kind === "implementation" && (item.ref.startsWith("quality/evidence/implementation/") || item.ref === "quality/evidence/implementation.json");
    const green = kind === "green" && item.ref.startsWith("quality/tests/") && value?.exit_code === 0;
    if ((implementation || green) && value?.snapshot_tree === finalTree) selected.push(item);
  }
  if (typeof currentRef === "string" && currentRef !== "") {
    let raw;
    try { raw = taskHandle.readRecord(currentRef); }
    catch (error) { if (error?.code === "ENOENT") raw = null; else throw error; }
    if (raw !== null) {
      const value = JSON.parse(raw);
      const validImplementation = kind === "implementation" && value?.stage === "build-code" && value?.producer?.component === "implementation";
      const validGreen = kind === "green" && value?.stage === "build-code" && value?.producer?.component === "build-code-test-capture" && value?.exit_code === 0;
      if ((validImplementation || validGreen) && value.snapshot_tree === finalTree) selected.push({ ref: currentRef, sha256: sha256(raw), value });
    }
  }
  if (selected.length === 0) incomplete(`current ${kind} receipt for final snapshot is missing`);
  selected.sort((left, right) => (right.value?.completed_at ?? right.value?.started_at ?? "").localeCompare(left.value?.completed_at ?? left.value?.started_at ?? "") || right.ref.localeCompare(left.ref));
  const first = selected[0];
  return Object.freeze({ ref: first.ref, sha256: first.sha256, value: first.value });
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
export function buildIntegrationReviewSubject({ task, sourceRoot, artifacts, finalTree, current_receipts = {} } = {}) {
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
  for (const item of tasks) for (const id of item.acceptance_ids) covered.set(id, [...(covered.get(id) ?? []), item]);
  const implementation = currentBinding(tasks, finalTree, "implementation", safeTask, current_receipts.implementation_ref);
  const green = currentBinding(tasks, finalTree, "green", safeTask, current_receipts.green_ref);
  const implementationAnchors = finalSnapshotImplementationAnchors({ sourceRoot, baseTree: base_tree, finalTree });
  const auditGaps = [];
  if (tasks.length === 0) auditGaps.push(Object.freeze({ kind: "task_completion_history", status: "incomplete", reason: "current tasks.md has no completed Task rows; current implementation and GREEN receipts remain authoritative" }));
  else {
    const uncovered = acceptanceIds.filter((id) => !covered.has(id));
    if (uncovered.length) auditGaps.push(Object.freeze({ kind: "task_completion_history", status: "incomplete", reason: `current tasks.md has no completed Task row for ${uncovered.join(", ")}; current implementation and GREEN receipts remain authoritative` }));
  }
  const entries = acceptanceIds.map((id) => {
    const items = covered.get(id) ?? [];
    return Object.freeze({
      acceptance_criterion_id: id,
      change: Object.freeze(items.length ? items.map((item) => ({ task_id: item.task_id, summary: item.summary, evidence_refs: Object.freeze(item.evidence.map(({ ref, sha256 }) => ({ ref, sha256 }))) })) : [{ task_id: null, summary: "current implementation receipt and GREEN receipt" }]),
      test: Object.freeze([{ receipt_ref: green.ref, receipt_hash: green.sha256 }]),
      evidence: Object.freeze([{ ref: implementation.ref, sha256: implementation.sha256 }]),
      anchors: Object.freeze(items.length ? items.map((item) => ({ id: `${item.task_id}:${id}`, path: materials.tasks_ref, start_line: item.line, end_line: item.line, role: "completion", reason: "current task completion evidence" })) : [{ id: `current-spec:${id}`, path: materials.spec_ref, start_line: acceptanceLineFor(materials.texts["spec.md"], id), end_line: acceptanceLineFor(materials.texts["spec.md"], id), role: "acceptance", reason: "current specification acceptance criterion" }]),
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
