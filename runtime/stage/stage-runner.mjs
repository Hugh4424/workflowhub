import { assertTaskHandle } from "../task/task-handle.mjs";
import { assertTaskKernel } from "../task/task-kernel.mjs";
import { officialStageHandler } from "./stage-handlers.mjs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { captureWorkspaceSnapshot } from "../evidence/canonical-receipt-writer.mjs";
import { fileURLToPath } from "node:url";
import { dispatchOrderedStageSkills, loadStageSkillManifest } from "../stage/stage-skill-runtime.mjs";
import { deriveStageProgress, STAGE_PREDICATES } from "../stage/completion-predicates.mjs";
import { readLatestStageContentEvidence } from "../evidence/stage-content-evidence.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";

const RUNNER_ROOT = fileURLToPath(new URL("../../", import.meta.url));
function declaredBundleHash(root, dependency) {
  const bundle = JSON.parse(readFileSync(resolve(root, dependency.bundle), "utf8"));
  if (bundle?.schema_version !== 1 || bundle.skill !== dependency.name || !Array.isArray(bundle.files) || bundle.files.length === 0) {
    throw new Error(`${dependency.name} declared skill bundle is invalid`);
  }
  const entries = bundle.files.map((entry) => ({
    path: typeof entry === "string" ? entry : entry.path,
    sha256: typeof entry === "string" ? null : entry.sha256 ?? null,
  })).sort((left, right) => left.path.localeCompare(right.path));
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex");
}

const UPSTREAM_STAGE = Object.freeze({
  "make-decision": null,
  "build-spec": "make-decision",
  "build-plan": "build-spec",
  "build-code": "build-plan",
  "verify-code": "build-code",
});
const UPSTREAM_INPUT = Object.freeze({
  "make-decision": "decision",
  "build-spec": null,
  "build-plan": "spec",
  "build-code": "build_plan",
  "verify-code": null,
});

function upstreamForStage(ctx, stage) {
  const slot = UPSTREAM_INPUT[stage];
  return slot && Object.prototype.hasOwnProperty.call(ctx.manifest.inputs ?? {}, slot)
    ? ctx.kernel.readInput(slot)
    : null;
}

function workerContext(ctx, publication = {}) {
  return Object.freeze({
    stage: ctx.stage,
    identity: ctx.identity,
    workflowRunId: ctx.workflowRunId,
    manifest: ctx.manifest,
    deriveStageWorkflowRunId: (stage) => ctx.kernel.deriveStageWorkflowRunId(stage),
    ...(ctx.candidateWorkspace ? { candidateWorkspace: ctx.candidateWorkspace } : {}),
    ...(ctx.workspace ? { workspace: ctx.workspace } : {}),
    ...(ctx.artifacts ? { artifacts: ctx.artifacts } : {}),
  });
}

function assertContext(context, stage) {
  if (!context || typeof context !== "object" || context.stage !== stage) {
    throw new TypeError(`StageContext for ${stage} is required`);
  }
  const task = assertTaskHandle(context.task);
  const kernel = assertTaskKernel(context.kernel);
  if (kernel.task !== task) throw new Error("StageContext TaskHandle/TaskKernel mismatch");
  return context;
}

function plainResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("stage handler must return a plain result object");
  }
  if (!value.facts || typeof value.facts !== "object" || Array.isArray(value.facts)) {
    throw new TypeError("stage handler result.facts is required");
  }
  if (Object.prototype.hasOwnProperty.call(value, "schema_version") && value.schema_version !== "stage-runtime-result.v2") {
    throw new TypeError("stage handler result schema_version must be stage-runtime-result.v2");
  }
  return value;
}

function publishVNextEvidence(ctx, ref, raw) {
  try {
    return ctx.kernel.publishCanonicalRecord(ref, raw);
  } catch (error) {
    if (error?.code !== "EEXIST" || ctx.task.readRecord(ref) !== raw) throw error;
    return { ref, idempotent: true };
  }
}

function actionableMissing(result) {
  return (result.missing_items ?? []).filter((item) => !/^support:audit$|^audit unavailable\/unverified\/mismatch:|^review audit unreadable:/.test(String(item)));
}

function currentMaterialTexts(ctx) {
  const reader = ctx.artifacts?.read
    ? (name) => ctx.artifacts.read(name)
    : (ctx.candidateWorkspace?.worktreeRoot ?? ctx.workspace?.worktreeRoot)
      ? (() => {
        const artifacts = ArtifactDir.open(ctx.candidateWorkspace?.worktreeRoot ?? ctx.workspace.worktreeRoot, ctx.task);
        return (name) => artifacts.read(name);
      })()
      : null;
  if (!reader) return null;
  return Object.fromEntries(["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((name) => {
    try { return [name, reader(name)]; }
    catch (error) {
      if (error?.code === "ENOENT") return [name, null];
      throw error;
    }
  }));
}

function evidenceCandidate(result, kind, subject, stage) {
  const facts = result?.facts ?? {};
  const subjectFact = kind === "review"
    ? stage === "verify-code" && subject === "independent_review"
      ? facts.quality_note
      : subject === "same_build_integration_review"
        ? facts.review
        : subject === "direction_review"
          ? facts.reviews?.direction
          : subject === "detail_review"
            ? facts.reviews?.detail
            : facts.review
    : facts[subject]
      ?? (kind === "test" ? facts.tests : null)
      ?? (kind === "confirmation" ? facts.human_confirmation : null);
  const directRef = subjectFact?.receipt_ref ?? subjectFact?.result_ref ?? subjectFact?.attempt_ref ?? subjectFact?.confirmation_ref;
  const directHash = subjectFact?.receipt_hash ?? subjectFact?.result_hash ?? subjectFact?.attempt_hash ?? subjectFact?.confirmation_hash;
  if (typeof directRef === "string" && typeof directHash === "string") {
    if (/^(?:receipts|reviews|evidence\/confirmations)\//.test(directRef)) {
      throw new Error(`vNext evidence must use quality namespace; legacy projection is retired: ${directRef}`);
    }
    return { ref: directRef, sha256: directHash };
  }
  const refs = Array.isArray(result.evidence_refs) ? result.evidence_refs : [];
  const matches = kind === "review"
    ? refs.filter((entry) => /^quality\/reviews\/(?:results|attempts)\//.test(entry?.ref ?? ""))
    : kind === "test"
      // Implementation receipts and test receipts share the receipts/
      // namespace. Select the canonical tests namespace so an implementation
      // receipt cannot be mistaken for a passing test fact.
      ? refs.filter((entry) => /^quality\/tests(?:\/|\.json$)/.test(entry?.ref ?? ""))
      : kind === "confirmation"
        ? refs.filter((entry) => /^quality\/confirmations\//.test(entry?.ref ?? ""))
        : [];
  return matches.find((entry) => typeof entry?.sha256 === "string") ?? null;
}

function currentConfirmationCandidate(ctx, snapshotTree) {
  const refs = typeof ctx.task.listCanonicalQualityFactRefs === "function"
    ? ctx.task.listCanonicalQualityFactRefs()
    : [];
  for (const factRef of [...refs].reverse()) {
    try {
      const factRaw = ctx.task.readRecord(factRef);
      const fact = JSON.parse(factRaw);
      const evidence = fact?.evidence?.[0];
      if (fact?.schema_version !== "quality-fact.v1"
          || fact.stage !== ctx.stage
          || fact.subject !== "human_confirmation"
          || fact.kind !== "confirmation"
          || fact.status !== "passed"
          || fact.snapshot_tree !== snapshotTree
          || typeof evidence?.ref !== "string"
          || !evidence.ref.startsWith("quality/confirmations/")
          || typeof evidence.sha256 !== "string") continue;
      const evidenceRaw = ctx.task.readRecord(evidence.ref);
      const evidenceHash = createHash("sha256").update(evidenceRaw).digest("hex");
      if (evidenceHash === evidence.sha256) return { ref: evidence.ref, sha256: evidence.sha256 };
    } catch {
      // Ignore unrelated or historical quality facts; the current run remains fail-closed.
    }
  }
  return null;
}

function reviewEvidenceStatus(task, candidate) {
  if (!candidate) return { status: "missing" };
  let record;
  try {
    record = JSON.parse(task.readRecord(candidate.ref));
  } catch {
    return { status: "unavailable" };
  }
  if (/^quality\/reviews\/results\//.test(candidate.ref)) {
    if (record?.verdict === "pass") return { status: "passed" };
    if (record?.verdict === "revise_required") return { status: "failed" };
    return { status: "unavailable" };
  }
  if (/^quality\/reviews\/attempts\//.test(candidate.ref) && record?.terminal_status === "unavailable") {
    return { status: "unavailable" };
  }
  return { status: "unavailable" };
}

function testEvidenceStatus(task, candidate) {
  if (!candidate) return { status: "missing" };
  let raw;
  try {
    raw = task.readRecord(candidate.ref);
    if (candidate.sha256 && createHash("sha256").update(raw).digest("hex") !== candidate.sha256) {
      return { status: "unavailable" };
    }
    const record = JSON.parse(raw);
    if (!Number.isInteger(record?.exit_code)) return { status: "unavailable" };
    return { status: record.exit_code === 0 ? "passed" : "failed" };
  } catch {
    return { status: "unavailable" };
  }
}

function confirmationEvidenceStatus(task, candidate) {
  if (!candidate) return { status: "missing" };
  try {
    const raw = task.readRecord(candidate.ref);
    if (candidate.sha256 && createHash("sha256").update(raw).digest("hex") !== candidate.sha256) return { status: "unavailable" };
    const record = JSON.parse(raw);
    if (record?.schema_version !== "human-confirmation.v2" || !new Set(["accepted", "rejected"]).has(record.decision)) return { status: "unavailable" };
    return { status: record.decision === "accepted" ? "passed" : "failed" };
  } catch {
    return { status: "unavailable" };
  }
}

function assertVNextSourceStable(ctx, expectedSnapshot) {
  const observed = ctx.kernel.currentVNextSnapshot();
  if (observed.source_digest !== expectedSnapshot.source_digest) {
    const error = new Error(`FORMAL_SNAPSHOT_MISMATCH: expected ${expectedSnapshot.source_digest}, observed ${observed.source_digest}`);
    error.code = "FORMAL_SNAPSHOT_MISMATCH";
    error.expected_source_digest = expectedSnapshot.source_digest;
    error.observed_source_digest = observed.source_digest;
    throw error;
  }
  return observed;
}

function publishVNextStage(ctx, result, preflightSnapshot) {
  return ctx.task.withRecordLock(`locks/${ctx.stage}.publication.lock`, () => {
    const snapshot = assertVNextSourceStable(ctx, preflightSnapshot);
  const qualityFactRefs = [];
  const missing = actionableMissing(result);
  let allPassed = true;
  const qualityWarnings = [];
  for (const [subject, kind] of Object.entries(STAGE_PREDICATES[ctx.stage])) {
      const candidate = evidenceCandidate(result, kind, subject, ctx.stage)
      ?? (kind === "confirmation" ? currentConfirmationCandidate(ctx, snapshot.tree) : null);
    const reviewFact = kind === "review"
      ? ctx.stage === "verify-code" && subject === "independent_review"
        ? result.facts?.quality_note
        : subject === "same_build_integration_review"
          ? result.facts?.review
          : subject === "direction_review"
            ? result.facts?.reviews?.direction
            : subject === "detail_review"
              ? result.facts?.reviews?.detail
              : result.facts?.review
      : null;
    const review = kind === "review" ? reviewEvidenceStatus(ctx.task, candidate) : null;
    const test = kind === "test" ? testEvidenceStatus(ctx.task, candidate) : null;
    const confirmation = kind === "confirmation" ? confirmationEvidenceStatus(ctx.task, candidate) : null;
    // buildStageCompletion returns the canonical completion wrapper as
    // { facts, user, system }. Read business facts from the authenticated
    // canonical facts; treating the wrapper as the facts object silently
    // downgraded acceptance/test predicates to `missing`.
    const businessAcceptance = result.completion?.facts?.business_facts?.acceptance_criteria;
    const status = kind === "acceptance_criterion"
      ? businessAcceptance === "covered"
        ? "passed"
        : businessAcceptance === "failed"
          ? "failed"
          : businessAcceptance === "missing"
            ? "missing"
            : candidate === null ? "missing" : "passed"
      : kind === "review"
        ? review.status
      : kind === "test"
        ? test.status
      : kind === "confirmation"
        ? confirmation.status
      : candidate === null
        ? "missing"
        : "passed";
    if (status !== "passed") {
      allPassed = false;
      qualityWarnings.push(`${subject}:${status}`);
    }
    const evidenceType = { test: "test_receipt", review: "review_result", acceptance_criterion: "acceptance_evidence", confirmation: "human_confirmation" }[kind];
    let factEvidenceRef = candidate?.ref;
    let factEvidenceHash = candidate?.sha256;
    const factEvidence = candidate ? [candidate] : [];
    if (kind === "acceptance_criterion") {
      const evidenceValue = {
        schema_version: "stage-quality-evidence.v1",
        task_id: ctx.identity.taskId,
        stage: ctx.stage,
        subject,
        status,
        snapshot_tree: snapshot.tree,
        facts: result.facts,
        evidence_refs: result.evidence_refs ?? [],
        missing_items: result.missing_items ?? [],
      };
      const evidenceRaw = `${JSON.stringify(evidenceValue, null, 2)}\n`;
      const evidenceHash = createHash("sha256").update(evidenceRaw).digest("hex");
      const evidenceRef = `quality/evidence/stage-quality/${ctx.stage}/${subject}-${evidenceHash}.json`;
      publishVNextEvidence(ctx, evidenceRef, evidenceRaw);
      const acceptanceValue = {
        schema_version: "acceptance-evidence.v1",
        acceptance_criterion_id: subject,
        result: status === "passed" ? "pass" : "fail",
        refs: [{ ref: evidenceRef, sha256: evidenceHash }],
        snapshot_tree: snapshot.tree,
        summary: { actual_outcome: status, evidence_type: "stage quality fact" },
      };
      const acceptanceRaw = `${JSON.stringify(acceptanceValue, null, 2)}\n`;
      factEvidenceHash = createHash("sha256").update(acceptanceRaw).digest("hex");
      factEvidenceRef = `quality/evidence/acceptance/${ctx.stage}/${subject}-${factEvidenceHash}.json`;
      publishVNextEvidence(ctx, factEvidenceRef, acceptanceRaw);
      factEvidence.push({ ref: factEvidenceRef, sha256: factEvidenceHash });
    }
    if (factEvidenceRef === undefined) {
      const missingValue = {
        schema_version: "stage-quality-missing.v1",
        task_id: ctx.identity.taskId,
        stage: ctx.stage,
        subject,
        status,
        snapshot_tree: snapshot.tree,
        reason: "canonical evidence was not supplied by the stage handler",
      };
      const missingRaw = `${JSON.stringify(missingValue, null, 2)}\n`;
      factEvidenceHash = createHash("sha256").update(missingRaw).digest("hex");
      factEvidenceRef = `quality/evidence/stage-quality-missing/${ctx.stage}/${subject}-${factEvidenceHash}.json`;
      publishVNextEvidence(ctx, factEvidenceRef, missingRaw);
      factEvidence.push({ ref: factEvidenceRef, sha256: factEvidenceHash });
    }
    const fact = ctx.kernel.publishVNextQualityFact(ctx.stage, {
      kind,
      status,
      subject,
      evidence: factEvidence.map(({ ref, sha256 }) => ({ ref, sha256, evidence_type: evidenceType })),
    });
    qualityFactRefs.push(fact.ref);
  }
  // The stage is source-bound at entry and rechecked once after publication
  // writes. Re-capturing a multi-gigabyte worktree for every AC does not add
  // protection because these writes are outside the source snapshot boundary.
  const publishedSnapshot = assertVNextSourceStable(ctx, preflightSnapshot);
  const progression = deriveStageProgress(ctx.stage, qualityFactRefs.map((ref) => {
    const raw = ctx.task.readRecord(ref);
    return { fact: { ref, value: JSON.parse(raw) }, authenticated: true };
  }), currentMaterialTexts(ctx));
  const publication = qualityFactRefs.length > 0 && progression.status === "completed"
    ? (publishedSnapshot, ctx.kernel.publishVNextPublication(ctx.stage, {
      quality_fact_refs: qualityFactRefs,
      progression,
    }))
    : null;
    return Object.freeze({
    schema_version: "stage-runtime-result.vnext",
    stage: ctx.stage,
    status: progression.status,
    progression,
    quality_status: allPassed && !result.verification_failure ? "passed" : "incomplete",
    ...(allPassed && !result.verification_failure ? {} : {
      quality_warnings: Object.freeze([
        ...qualityWarnings,
        ...(result.missing_items ?? []),
        ...(result.verification_failure ? [result.reason ?? "verification quality facts are incomplete"] : []),
      ]),
    }),
    quality_fact_refs: Object.freeze(qualityFactRefs),
    ...(publication === null ? {} : { publication_ref: publication.ref, publication_hash: publication.sha256 }),
    ...(result.missing_items?.length ? { missing_items: [...result.missing_items] } : {}),
    });
  });
}

/**
 * Execute the low-level publication helper for a workflow stage.
 * The handler receives capabilities and already verified upstream data; it does
 * not discover task identity or publish records itself. This helper is not the
 * authoritative skill-dispatch boundary; only runOfficialStage dispatches the
 * declared stage skills and publishes their invocation facts.
 */
export async function runStage(stage, context, handler, publication = {}) {
  if (!Object.prototype.hasOwnProperty.call(UPSTREAM_STAGE, stage)) {
    throw new TypeError(`unsupported stage: ${stage}`);
  }
  const ctx = assertContext(context, stage);
  if (typeof handler !== "function") throw new TypeError("stage handler is required");

  const upstream = upstreamForStage(ctx, stage);
  const vNextPreflightSnapshot = ctx.kernel.currentVNextSnapshot();
  const result = plainResult(await handler(workerContext(ctx, publication), upstream));

  if (!publication || typeof publication !== "object" || Array.isArray(publication)) throw new TypeError("stage publication options must be an object");
  return publishVNextStage(ctx, result, vNextPreflightSnapshot);
}

async function dispatchPublicationStageSkills(ctx, publication = {}) {
  const dispatchConfig = publication?.stageSkillDispatch ?? publication?.stage_skill_dispatch;
  if (!dispatchConfig) return Object.freeze([]);
  if (typeof dispatchConfig !== "object" || Array.isArray(dispatchConfig)) {
    throw new TypeError("stage skill dispatch configuration must be an object");
  }
  return dispatchOrderedStageSkills({
    packageRoot: dispatchConfig.packageRoot ?? dispatchConfig.package_root ?? RUNNER_ROOT,
    stage: ctx.stage,
    controls: dispatchConfig.controls ?? {},
    hostInvoke: dispatchConfig.hostInvoke ?? dispatchConfig.host_invoke,
    activeConditions: dispatchConfig.activeConditions ?? dispatchConfig.active_conditions ?? [],
    probes: dispatchConfig.probes ?? {},
    commands: dispatchConfig.commands ?? {},
    run: dispatchConfig.run,
    kernel: ctx.kernel,
  });
}

function officialWorkerContext(ctx, publication = {}) {
  const completionInvocationFacts = () => {
    const loaded = loadStageSkillManifest(RUNNER_ROOT, ctx.stage);
    const declaredComponents = [];
    const invocationFacts = [];
    for (const dependency of loaded.manifest.skills) {
      const bundleHash = declaredBundleHash(loaded.root, dependency);
      const keys = ctx.stage === "make-decision" && dependency.name === "talk-with-zhipeng"
        ? ["talk-1", "talk-2", "talk-3"]
        : [ctx.stage === "make-decision" && dependency.name === "grill-with-docs" ? "grill" : "default"];
      for (const invocationKey of keys) {
        declaredComponents.push({
          task_id: ctx.identity.taskId,
          stage: ctx.stage,
          workflow_run_id: ctx.workflowRunId,
          name: dependency.name,
          invocation_key: invocationKey,
          bundle_hash: bundleHash,
          declared_trigger: dependency.trigger,
          invocation: dependency.invocation,
        });
        const observed = ctx.kernel.readStageSkillInvocation(ctx.stage, dependency.name, invocationKey);
        if (observed) invocationFacts.push(observed.fact);
      }
    }
    return Object.freeze({
      declaredComponents: Object.freeze(declaredComponents),
      invocationFacts: Object.freeze(invocationFacts),
    });
  };
  return Object.freeze({
    stage: ctx.stage,
    identity: ctx.identity,
    workflowRunId: ctx.workflowRunId,
    manifest: ctx.manifest,
    readCompletionInvocationFacts: completionInvocationFacts,
    accepted: Object.freeze({ readInput: (slot) => ctx.kernel.readInput(slot) }),
    readReceipt: (ref) => {
      const raw = ctx.task.readRecord(ref);
      return Object.freeze({ value: JSON.parse(raw), sha256: createHash("sha256").update(raw).digest("hex") });
    },
    readOptionalReceipt: (ref) => {
      try {
        const raw = ctx.task.readRecord(ref);
        return Object.freeze({ value: JSON.parse(raw), sha256: createHash("sha256").update(raw).digest("hex") });
      } catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
      }
    },
    readEvidence: (ref) => {
      const raw = ctx.task.readRecord(ref);
      return Object.freeze({ bytes: raw, sha256: createHash("sha256").update(raw).digest("hex") });
    },
    readInteractionAggregate: ctx.stage === "make-decision"
      ? () => readLatestStageContentEvidence({
        task: ctx.task,
        stage: "make-decision",
        workflowRunId: ctx.workflowRunId,
        kind: "interaction-completion.v1",
      })
      : undefined,
    // External audit records are visible only for human-boundary notices.
    // They are deliberately not receipts, facts, evidence refs, or gates.
    ...(ctx.stage === "build-code" && ctx.workspace ? {
      inspectIntegrationReviewSubject: () => ({
        formal_record_status: {
          status: "unavailable",
          reason: "phase review history is retired; current quality facts remain authoritative",
        },
      }),
    } : {}),
    ...(ctx.workspace ? { workspace: Object.freeze({ worktreeRoot: ctx.workspace.worktreeRoot, baselineCommit: ctx.workspace.baselineCommit }) } : {}),
    ...(ctx.workspace ? { snapshotWorkspace: () => captureWorkspaceSnapshot(ctx.workspace) } : {}),
    ...(ctx.candidateWorkspace ? { candidateWorkspace: Object.freeze({
      worktreeRoot: ctx.candidateWorkspace.worktreeRoot,
      baselineCommit: ctx.candidateWorkspace.baselineCommit,
      captureSnapshot: () => ctx.candidateWorkspace.captureSnapshot(),
    }) } : {}),
    ...(ctx.artifacts ? {
      readArtifact: (name) => ctx.artifacts.read(name),
      writeArtifact: (name, value) => ctx.artifacts.writeAtomic(name, value),
      artifactRef: (name) => ctx.artifacts.reference(name),
    } : {}),
  });
}

function verifyEvidenceReference(ctx, entry, label = "evidence") {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new TypeError(`${label} must be an authenticated reference`);
  if (typeof entry.ref !== "string" || !entry.ref.startsWith("evidence/") && !entry.ref.startsWith("quality/")) {
    throw new Error(`${label} is outside a canonical namespace`);
  }
  if (!/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")) throw new TypeError(`${label} sha256 is required`);
  const raw = ctx.task.readRecord(entry.ref);
  const actual = createHash("sha256").update(raw).digest("hex");
  if (actual !== entry.sha256) throw new Error(`${label} hash mismatch: ${entry.ref}`);
  return entry;
}

function verifyOfficialEvidence(ctx, result) {
  for (const [index, entry] of (result.evidence_refs ?? []).entries()) verifyEvidenceReference(ctx, entry, `evidence_refs[${index}]`);
  const tests = result.facts?.tests;
  if (tests) {
    // output_ref is independently re-read; a valid receipt cannot vouch for a
    // missing or subsequently replaced command output.
    const output_ref = tests.output_ref;
    const raw = ctx.task.readRecord(output_ref);
    if (createHash("sha256").update(raw).digest("hex") !== tests.output_hash) throw new Error(`test output_ref hash mismatch: ${output_ref}`);
  }
  return result;
}

/** Fixed repository-owned handler path; callers provide receipt references, never facts or code. */
export function runOfficialStage(stage, context, invocation, publication) {
  const ctx = assertContext(context, stage);
  const handler = officialStageHandler(stage);
  const input = Object.freeze(structuredClone(invocation));
  return runStage(
    stage,
    ctx,
    async () => {
      await dispatchPublicationStageSkills(ctx, publication);
      return verifyOfficialEvidence(ctx, await handler(officialWorkerContext(ctx, publication), input));
    },
    publication,
  );
}
