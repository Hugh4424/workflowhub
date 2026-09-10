import { createHash } from "node:crypto";
import { resolve } from "node:path";

import { assertTaskHandle } from "../task/task-handle.mjs";
import { assertTaskKernel } from "../task/task-kernel.mjs";

export const STAGE_HANDOFF_STAGES = Object.freeze([
  "make-decision",
  "build-spec",
  "build-plan",
  "build-code",
]);

const STAGES = new Set(STAGE_HANDOFF_STAGES);
const SHA256 = /^[a-f0-9]{64}$/;
const STAGE_OUTCOME_REF = /^quality\/evidence\/stage-outcomes\/(make-decision|build-spec|build-plan|build-code|verify-code)\/([a-f0-9]{64})\.json$/;
const STAGE_REFLECTION_REF = /^quality\/stage-reflection\/(make-decision|build-spec|build-plan|build-code)\/([a-f0-9]{64})\.json$/;
const SCHEMA = "workflowhub-stage-handoff.v1";
const BANNER = "非权威 current handoff，只以四材料和正式质量原件为准";
const SECTION_TITLES = Object.freeze([
  "任务身份",
  "背景与目标",
  "当前阶段与进度",
  "重要决策",
  "核心方案",
  "踩过的坑",
  "重要参考调研",
  "关键事实与数据状态",
  "成功与失败边界",
  "未决项与风险",
  "下一步动作",
  "待读文件清单",
  "可自行判断与必须问用户的边界",
]);

const sha256 = (raw) => createHash("sha256").update(raw).digest("hex");

function fail(message, code = "STAGE_HANDOFF_INPUT_INVALID") {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function nonEmpty(value, label) {
  if (typeof value !== "string" || value.trim() === "") fail(`${label} must be a non-empty string`);
  return value.trim();
}

function stageHandoffRef(stage) {
  if (!STAGES.has(stage)) fail(`stage handoff is not supported for ${stage}`);
  return `quality/evidence/handoff/${stage}.md`;
}

function sourceRef(value, label = "source ref") {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const ref = nonEmpty(value.ref, `${label}.ref`);
  const hash = nonEmpty(value.sha256 ?? value.hash, `${label}.sha256`);
  if (!SHA256.test(hash)) fail(`${label}.sha256 must be a sha256`);
  if (ref.includes("..") || ref.startsWith("/")) fail(`${label}.ref must be a safe relative ref`);
  return Object.freeze({ ref, sha256: hash });
}

function normalizeSources(sources = []) {
  if (!Array.isArray(sources)) fail("handoff source_refs must be an array");
  const seen = new Set();
  return Object.freeze(sources.filter(Boolean).map((value, index) => sourceRef(value, `source_refs[${index}]`))
    .filter((value) => {
      const key = `${value.ref}\0${value.sha256}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }));
}

function materialSourceRefs(materials, artifacts) {
  if (!materials || typeof materials !== "object" || Array.isArray(materials)) return [];
  if (!artifacts || typeof artifacts.read !== "function") fail("handoff materials require an authenticated ArtifactDir reader");
  return Object.entries(materials).filter(([, value]) => typeof value === "string")
    .map(([name, value]) => {
      const persisted = artifacts.read(name);
      if (persisted !== value) fail(`handoff material ${name} does not match persisted bytes`);
      return { ref: name, sha256: sha256(persisted) };
    });
}

function stageOutcomeSource(stageOutcome) {
  if (!stageOutcome || typeof stageOutcome !== "object") return null;
  if (typeof stageOutcome.ref !== "string" || typeof stageOutcome.sha256 !== "string") return null;
  return { ref: stageOutcome.ref, sha256: stageOutcome.sha256 };
}

function reflectionSource(stageReflection) {
  if (!stageReflection || typeof stageReflection !== "object") return null;
  if (typeof stageReflection.ref !== "string" || typeof stageReflection.sha256 !== "string") return null;
  return { ref: stageReflection.ref, sha256: stageReflection.sha256 };
}

function yamlScalar(value) {
  return JSON.stringify(value);
}

function renderFrontMatter({ taskId, stage, snapshotTree, materialScopeRevision, reflectionStatus, sources }) {
  return [
    "---",
    `schema: ${yamlScalar(SCHEMA)}`,
    `task: ${yamlScalar(taskId)}`,
    `stage: ${yamlScalar(stage)}`,
    `snapshot_tree: ${yamlScalar(snapshotTree)}`,
    `material_scope_revision: ${yamlScalar(materialScopeRevision)}`,
    `reflection_status: ${yamlScalar(reflectionStatus)}`,
    "authority: non_authoritative",
    "retention: current_only",
    `source_refs: ${yamlScalar(sources)}`,
    "---",
  ].join("\n");
}

function sectionBody(index, {
  taskId,
  stage,
  stageStatus,
  reflectionStatus,
  observation,
  diagnostic,
  sources,
  nextAction,
  readableMaterials,
  decisionSummary,
  risks,
} = {}) {
  const refs = sources.length ? sources.map((value) => `\`${value.ref}#${value.sha256}\``).join(", ") : "（当前没有可引用的正式原件）";
  const failure = diagnostic?.error_summary ?? diagnostic?.reason ?? "没有观察到额外失败";
  const common = {
    0: [`- task: \`${taskId}\``, `- stage: \`${stage}\``, `- reflection: \`${reflectionStatus}\``],
    1: ["- 本 handoff 只保留当前续接所需的结论和指针。", "- 详细背景与需求仍以四份当前材料为准。"],
    2: [`- stage status: \`${stageStatus}\``, `- reflection status: \`${reflectionStatus}\``, `- observation: ${observation || "（无）"}`],
    3: [decisionSummary || "- 重要决策请回读 decision-log.md、spec.md、plan.md 和 tasks.md。"],
    4: ["- 当前实现沿用既有 WorkflowHub TaskHandle、stage runner 和 canonical evidence 边界。"],
    5: [`- 本次阶段末事实：${failure}`],
    6: [`- 当前正式来源指针：${refs}`],
    7: [`- current snapshot/material binding：\`${refs}\``],
    8: ["- 成功：只表示本阶段或本 hook 的实际记录已写入。", "- 失败、unavailable、unknown 和 stale 不得改写为完成。"],
    9: [risks || "- 未决项和风险必须以当前四材料与正式质量原件回读为准。"],
    10: [`- ${nextAction}`],
    11: [readableMaterials?.length ? readableMaterials.map((name) => `- \`${name}\``).join("\n") : "- decision-log.md\n- spec.md\n- plan.md\n- tasks.md"],
    12: ["- 可以自行判断：读取当前文件、正式原件和本 handoff 的指针。", "- 必须问用户：产品方向、不可逆交付授权和超出当前材料的范围变化。"],
  };
  return common[index].join("\n");
}

export function renderStageHandoff({
  taskId,
  stage,
  snapshotTree,
  materialScopeRevision,
  reflectionStatus,
  stageStatus = "completed",
  observation = null,
  diagnostic = null,
  sourceRefs = [],
  materials = null,
  artifacts = null,
  nextAction = null,
  decisionSummary = null,
  risks = null,
} = {}) {
  stageHandoffRef(stage);
  nonEmpty(taskId, "taskId");
  nonEmpty(snapshotTree, "snapshotTree");
  nonEmpty(materialScopeRevision, "materialScopeRevision");
  nonEmpty(reflectionStatus, "reflectionStatus");
  const sources = normalizeSources([...sourceRefs, ...materialSourceRefs(materials, artifacts)]);
  const action = nonEmpty(nextAction ?? `继续读取当前 ${stage} 材料并处理仍未完成项`, "nextAction");
  const frontMatter = renderFrontMatter({ taskId, stage, snapshotTree, materialScopeRevision, reflectionStatus, sources });
  const sections = SECTION_TITLES.map((title, index) => [
    `## ${index + 1}. ${title}`,
    sectionBody(index, {
      taskId, stage, stageStatus, reflectionStatus, observation, diagnostic, sources,
      nextAction: action, readableMaterials: ["decision-log.md", "spec.md", "plan.md", "tasks.md"],
      decisionSummary, risks,
    }),
  ].join("\n"));
  return `${frontMatter}\n\n> ${BANNER}\n\n${sections.join("\n\n")}\n`;
}

function assertReadback(raw, { taskId, stage, snapshotTree, materialScopeRevision, reflectionStatus }) {
  if (typeof raw !== "string" || !raw.startsWith("---\n") || !raw.includes(`schema: ${JSON.stringify(SCHEMA)}`)) {
    fail("stage handoff readback is not a current handoff", "STAGE_HANDOFF_READBACK_FAILED");
  }
  for (const [key, value] of Object.entries({ task: taskId, stage, snapshot_tree: snapshotTree, material_scope_revision: materialScopeRevision, reflection_status: reflectionStatus })) {
    if (!raw.includes(`${key}: ${JSON.stringify(value)}`)) fail(`stage handoff readback is not bound to current ${key}`, "STAGE_HANDOFF_READBACK_FAILED");
  }
  if (!raw.includes(`> ${BANNER}`)) fail("stage handoff banner is missing", "STAGE_HANDOFF_READBACK_FAILED");
  const headings = [...raw.matchAll(/^## (\d+)\. (.+)$/gm)].map((match) => [Number(match[1]), match[2]]);
  if (headings.length !== SECTION_TITLES.length || headings.some(([number, title], index) => number !== index + 1 || title !== SECTION_TITLES[index])) {
    fail("stage handoff section order is invalid", "STAGE_HANDOFF_READBACK_FAILED");
  }
  return raw;
}

function attemptOrder(value) {
  const text = String(value ?? "");
  const numeric = /(?:^|[-_])(?:attempt|try|retry)[-_]?([0-9]+)$/i.exec(text);
  // Opaque attempt ids deliberately have no chronology.  Do not turn their
  // lexical spelling into a fake "latest" selector: the vNext outcome
  // contract permits equivalent retries and forbids a persisted selector.
  return numeric ? [0, Number(numeric[1]), text] : null;
}

function compareAttempts(left, right) {
  const a = attemptOrder(left);
  const b = attemptOrder(right);
  if (!a || !b) return null;
  return a[0] - b[0] || a[1] - b[1] || a[2].localeCompare(b[2]);
}

function currentHandoffOutcome(task, raw, stage) {
  if (typeof raw !== "string") return null;
  const match = new RegExp(`quality/evidence/stage-outcomes/${stage}/([a-f0-9]{64})\\.json#\\1`).exec(raw);
  if (!match) return null;
  const ref = `quality/evidence/stage-outcomes/${stage}/${match[1]}.json`;
  try {
    const value = JSON.parse(task.readRecord(ref));
    return value?.attempt_id ? { ref, value } : null;
  } catch {
    return null;
  }
}

export function publishStageHandoff({
  task,
  kernel,
  artifacts,
  taskId = task?.identity?.taskId,
  stage,
  snapshotTree,
  materialScopeRevision,
  reflectionStatus,
  stageStatus = "completed",
  observation = null,
  diagnostic = null,
  stageOutcome = null,
  stageReflection = null,
  sourceRefs = [],
  materials = null,
  nextAction = null,
  decisionSummary = null,
  risks = null,
} = {}) {
  assertTaskHandle(task);
  assertTaskKernel(kernel);
  if (taskId !== task.identity.taskId) fail("stage handoff task identity mismatch");
  const currentSnapshot = kernel.currentVNextSnapshot();
  if (snapshotTree !== currentSnapshot.tree) fail("stage handoff snapshot is not current");
  if (!stageOutcome || typeof stageOutcome.ref !== "string" || typeof stageOutcome.sha256 !== "string") {
    fail("stage handoff requires an authenticated stage outcome source");
  }
  const outcomeMatch = STAGE_OUTCOME_REF.exec(stageOutcome.ref);
  if (!outcomeMatch || outcomeMatch[1] !== stage || outcomeMatch[2] !== stageOutcome.sha256) {
    fail("stage handoff outcome source ref is not canonical for the current stage");
  }
  const outcomeRaw = task.readRecord(stageOutcome.ref);
  if (sha256(outcomeRaw) !== stageOutcome.sha256) fail("stage handoff outcome source hash mismatch");
  let outcomeValue;
  try { outcomeValue = JSON.parse(outcomeRaw); }
  catch (error) { fail(`stage handoff outcome source is not valid JSON: ${error.message}`); }
  if (outcomeValue?.schema_version !== "workflowhub-stage-outcomes.v1"
      || typeof outcomeValue.attempt_id !== "string" || outcomeValue.attempt_id.trim() === ""
      || !outcomeValue.producer || typeof outcomeValue.producer !== "object"
      || typeof outcomeValue.producer.source_id !== "string" || outcomeValue.producer.source_id.trim() === ""
      || typeof outcomeValue.producer.agent_run_id !== "string" || outcomeValue.producer.agent_run_id.trim() === "") {
    fail("stage handoff outcome source producer or schema is not authenticated");
  }
  if (typeof kernel.deriveStageWorkflowRunId === "function"
      && outcomeValue.run_id !== kernel.deriveStageWorkflowRunId(stage)) {
    fail("stage handoff outcome source workflow run identity mismatch");
  }
  if (outcomeValue.task_id !== taskId || outcomeValue.stage !== stage
      || outcomeValue.snapshot_tree !== snapshotTree
      || outcomeValue.material_scope_revision !== materialScopeRevision) {
    fail("stage handoff outcome source does not bind the current identity");
  }
  const ref = stageHandoffRef(stage);
  const absolutePath = resolve(task.taskPath, ...ref.split("/"));
  const sources = [
    ...sourceRefs,
    stageOutcomeSource(stageOutcome),
    reflectionSource(stageReflection),
  ].filter(Boolean);
  for (const source of normalizeSources(sources)) {
    if (source.ref.startsWith("quality/stage-reflection/")) {
      const reflectionMatch = STAGE_REFLECTION_REF.exec(source.ref);
      // Reflection refs are content-addressed by the semantic reflection key,
      // while source.sha256 authenticates the exact published bytes below.
      // The two hashes intentionally are not interchangeable.
      if (!reflectionMatch || reflectionMatch[1] !== stage) {
        fail("stage handoff reflection source ref is not canonical for the current stage");
      }
    }
    const raw = task.readRecord(source.ref);
    if (sha256(raw) !== source.sha256) fail(`stage handoff source ${source.ref} hash mismatch`);
    if (source.ref.startsWith("quality/stage-reflection/")) {
      let reflection;
      try { reflection = JSON.parse(raw); }
      catch (error) { fail(`stage handoff reflection source is not valid JSON: ${error.message}`); }
      if (reflection?.schema_version === "stage-reflection.v1") {
        if (reflection.record_kind !== "judgment" || reflection.status !== "failed"
            || reflection.task_id !== taskId || reflection.stage !== stage
            || !reflection.error || typeof reflection.error.summary !== "string"
            || reflection.source?.ref !== stageOutcome.ref
            || reflection.source?.sha256 !== stageOutcome.sha256
            || reflection.identity?.task_id !== taskId
            || reflection.identity?.attempt !== outcomeValue.attempt_id
            || reflection.identity?.snapshot_tree !== snapshotTree
            || ![materialScopeRevision, outcomeValue.material_revision].includes(reflection.identity?.material_revision)) {
          fail("stage handoff reflection failure source is not authenticated");
        }
      } else if (reflection?.schema_version === "stage-reflection.v2") {
        const executor = reflection.executor;
        const executorSource = executor?.source_id ?? executor?.executor_id ?? executor?.id;
        const executorAttempt = executor?.attempt_id ?? reflection.identity?.attempt;
        const executorStarted = executor?.started_at ?? executor?.startedAt;
        const executorCompleted = executor?.completed_at ?? executor?.completedAt;
        const executorOutputHash = reflection.output_hash;
        const outcomeRefs = [...new Set((reflection.judgments ?? []).flatMap((item) => item?.evidence_refs ?? [])
          .filter((candidate) => typeof candidate === "string" && STAGE_OUTCOME_REF.test(candidate)))];
        if (reflection.record_kind !== "judgment"
            || reflection.task_id !== taskId || reflection.stage !== stage
            || reflection.identity?.task_id !== taskId
            || reflection.identity?.attempt !== outcomeValue.attempt_id
            || reflection.identity?.snapshot_tree !== snapshotTree
            || ![materialScopeRevision, outcomeValue.material_revision].includes(reflection.identity?.material_revision)
            || typeof executorSource !== "string" || executorSource.trim() === ""
            || typeof executorAttempt !== "string" || executorAttempt.trim() === ""
            || !Number.isFinite(Date.parse(executorStarted)) || !Number.isFinite(Date.parse(executorCompleted))
            || Date.parse(executorCompleted) < Date.parse(executorStarted)
            || !SHA256.test(executorOutputHash ?? "")
            || !SHA256.test(executor?.output_hash ?? "")
            || executor.output_hash !== executorOutputHash
            || reflection.executor?.attempt_id !== outcomeValue.attempt_id
            || outcomeRefs.length !== 1 || outcomeRefs[0] !== stageOutcome.ref) {
          fail("stage handoff reflection source does not bind the current identity");
        }
      } else {
        fail("stage handoff reflection source schema is not authenticated");
      }
    }
  }
  const raw = renderStageHandoff({
    taskId, stage, snapshotTree, materialScopeRevision, reflectionStatus, stageStatus,
    observation, diagnostic, sourceRefs: sources, materials, artifacts, nextAction, decisionSummary, risks,
  });
  const writeHandoff = () => {
    // The fixed current-view ref is a replaceable projection. Serialize the
    // identity check and write so an older stage run cannot pass a pre-lock
    // check and overwrite a newer current handoff after it has advanced.
    const lockedSnapshot = kernel.currentVNextSnapshot();
    if (lockedSnapshot.tree !== snapshotTree) fail("stage handoff snapshot changed before current write");
    if (materials && artifacts) materialSourceRefs(materials, artifacts);
    const lockedOutcomeRaw = task.readRecord(stageOutcome.ref);
    if (sha256(lockedOutcomeRaw) !== stageOutcome.sha256) fail("stage handoff outcome source changed before current write");
    let lockedOutcome;
    try { lockedOutcome = JSON.parse(lockedOutcomeRaw); }
    catch (error) { fail(`stage handoff outcome source is not valid JSON: ${error.message}`); }
    if (lockedOutcome?.task_id !== taskId || lockedOutcome.stage !== stage
        || lockedOutcome.snapshot_tree !== snapshotTree
        || lockedOutcome.material_scope_revision !== materialScopeRevision
        || lockedOutcome.attempt_id !== outcomeValue.attempt_id) {
      fail("stage handoff outcome source is no longer current");
    }
    let existingRaw = null;
    try { existingRaw = task.readRecord(ref); } catch (error) { if (error?.code !== "ENOENT") throw error; }
    const existingOutcome = currentHandoffOutcome(task, existingRaw, stage);
    if (existingOutcome && existingOutcome.value.attempt_id !== outcomeValue.attempt_id) {
      const ordering = compareAttempts(outcomeValue.attempt_id, existingOutcome.value.attempt_id);
      // A retry id is not an ordering authority.  If chronology cannot be
      // authenticated, preserve the already-current projection instead of
      // allowing a late opaque-id writer to overwrite it.  Numeric retry ids
      // retain the legacy deterministic ordering used by the contract tests.
      if (ordering === null || ordering < 0) {
        fail("stage handoff candidate is older than the current handoff outcome or has no authenticated ordering", "STAGE_HANDOFF_STALE_WRITER");
      }
    }
    task.writeRecordAtomic(ref, raw);
    const readback = task.readRecord(ref);
    assertReadback(readback, { taskId, stage, snapshotTree, materialScopeRevision, reflectionStatus });
    return Object.freeze({
      status: "published",
      reflection_status: reflectionStatus,
      path: absolutePath,
      ref,
      sha256: sha256(readback),
      current: true,
      section_count: SECTION_TITLES.length,
      readback_sha256: sha256(readback),
    });
  };
  return task.withRecordLock(`locks/stage-handoff/${stage}.lock`, writeHandoff);
}

export function stageHandoffFailure({ task, stage, error, reflectionStatus = "unknown" } = {}) {
  assertTaskHandle(task);
  const ref = stageHandoffRef(stage);
  const path = resolve(task.taskPath, ...ref.split("/"));
  return Object.freeze({
    status: "unavailable",
    current: false,
    path,
    ref,
    reflection_status: reflectionStatus,
    error: error instanceof Error ? error.message : String(error ?? "stage handoff failed"),
    warning: "旧文件如果存在也可能 stale，不能当作 current handoff。",
  });
}

export { BANNER, SECTION_TITLES, stageHandoffRef };
