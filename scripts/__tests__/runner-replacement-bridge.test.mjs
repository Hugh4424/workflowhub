import { execFile, execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { writeHumanConfirmation } from "../../tests/helpers/human-confirmation.mjs";
import { hashAuditSummary } from "../../runtime/evidence/audit-summary-carrier.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { inspectRunnerIdentity } from "../../runtime/evidence/runner-identity.mjs";
import { createTask, migrateTaskRunnerRoot, openTask } from "../../core/task-handle.mjs";
import { createTaskKernel } from "../../runtime/task/task-kernel.mjs";
import {
  canonical,
  sha256,
  validateRecoveryCredential,
  writeRecoveryCredentialForTest,
} from "../../core/task-recovery.mjs";
import { prepareTaskWorkspace } from "../../core/workspace.mjs";

const SCRIPT = fileURLToPath(new URL("../task-recovery.mjs", import.meta.url));
const ROUTE_SOURCE_HASH = "dc3f450c80677c59b0f2107a833b4efa7a11715b5671c86b9285c230eaf080fd";
const ROUTE_PROFILES = Object.freeze({
  "pi/coding": Object.freeze({
    model: "kimi-coding/kimi-for-coding",
    effort: null,
    thinking: true,
    priority: 47,
  }),
  "cursor/grok": Object.freeze({
    model: "cursor-grok-4.5-high",
    effort: null,
    thinking: null,
    priority: 57,
  }),
});
const roots = [];

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function commit(cwd, message) {
  git(cwd, ["add", "."]);
  git(cwd, ["-c", "user.name=WorkflowHub Tests", "-c", "user.email=tests@workflowhub.local", "commit", "-qm", message]);
}

function runCli(args) {
  return execFileSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function runCliProcess(args) {
  return new Promise((resolve) => {
    execFile(process.execPath, [SCRIPT, ...args], { encoding: "utf8" }, (error, stdout, stderr) => {
      resolve({ status: error?.code ?? 0, stdout, stderr });
    });
  });
}

function publishExact(kernel, task, ref, raw) {
  try {
    kernel.publishCanonicalRecord(ref, raw);
  } catch (error) {
    if (error?.code !== "EEXIST" || task.readRecord(ref) !== raw) throw error;
  }
}

function publishAuditedAttempt({ kernel, task, stage, worktreeRoot, workflowRunId, data }) {
  const snapshot = captureGitWorktreeSnapshot(worktreeRoot);
  const kind = `${stage}-runner-bridge-fixture`;
  const content = {
    schema_version: "stage-content-evidence.v1",
    kind,
    task_id: task.identity.taskId,
    stage,
    workflow_run_id: workflowRunId,
    snapshot_tree: snapshot.tree,
  };
  const contentRaw = `${JSON.stringify(content, null, 2)}\n`;
  const contentHash = sha256(contentRaw);
  const contentRef = `evidence/stage-content/${contentHash}/${stage}-runner-bridge-fixture.json`;
  kernel.publishCanonicalRecord(contentRef, contentRaw);
  const contentEvidenceRefs = [{ kind, ref: contentRef, hash: contentHash }];
  const unsignedSummary = {
    schema_version: "stage-audit-summary.v1",
    task_id: task.identity.taskId,
    stage_slug: stage,
    workflow_run_id: workflowRunId,
    snapshot_tree: snapshot.tree,
    verdict: "pass",
    content_evidence_refs: contentEvidenceRefs,
  };
  const summaryHash = hashAuditSummary(unsignedSummary);
  const summaryRef = `evidence/audits/${stage}/${summaryHash}.json`;
  kernel.publishCanonicalRecord(summaryRef, `${JSON.stringify({ ...unsignedSummary, summary_hash: summaryHash }, null, 2)}\n`);
  let decisionFacts = {};
  if (stage === "make-decision" && !data.facts?.decision_ref) {
    const decisionRaw = "# Runner replacement fixture decision\n";
    const decisionHash = sha256(decisionRaw);
    const decisionRef = `receipts/decision-log/${decisionHash}.md`;
    kernel.publishCanonicalRecord(decisionRef, decisionRaw);
    decisionFacts = { decision_ref: decisionRef, decision_hash: decisionHash };
  }
  return kernel.publishAttempt(stage, {
    ...data,
    facts: {
      ...data.facts,
      ...decisionFacts,
      audit_contract_version: "v1",
      audit_summary_ref: summaryRef,
      audit_summary_hash: summaryHash,
      audit_verdict: "pass",
      content_evidence_refs: contentEvidenceRefs,
    },
  });
}

function businessSnapshot(task) {
  const accepted = createTaskKernel(task).readAccepted("make-decision");
  return {
    accepted_ref: accepted.accepted_ref,
    accepted_hash: accepted.accepted_hash,
    baseline_commit: accepted.facts.baseline_commit,
    snapshot_tree: accepted.facts.snapshot_tree,
    target_repo_root: task.manifest.target_repo_root,
  };
}

function makeRunner(root, name, taskId) {
  const runner = join(root, name);
  mkdirSync(runner);
  git(runner, ["init", "-q", "-b", `task/workflowhub/${taskId}`]);
  writeFileSync(join(runner, "AGENTS.md"), "# Runner\n");
  writeFileSync(join(runner, "CONSTITUTION.md"), "# Constitution\n");
  mkdirSync(join(runner, "workflows", "build-code"), { recursive: true });
  writeFileSync(join(runner, "workflows", "build-code", "SKILL.md"), "# build-code\n");
  commit(runner, name);
  return realpathSync(runner);
}

function cloneDescendant(root, source, name, pathCount = 1) {
  const runner = join(root, name);
  git(root, ["clone", "-q", source, runner]);
  for (let index = 1; index <= pathCount; index += 1) {
    const suffix = String(index).padStart(2, "0");
    writeFileSync(join(runner, `${name}-${suffix}.txt`), `${name}-${suffix}\n`);
  }
  commit(runner, name);
  return realpathSync(runner);
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-runner-bridge-")));
  roots.push(root);
  const taskId = "recovery-bridge";
  const storage = join(root, "storage");
  const target = join(root, "target");
  mkdirSync(storage);
  mkdirSync(target);
  git(target, ["init", "-q", "-b", "main"]);
  writeFileSync(join(target, "README.md"), "business\n");
  commit(target, "business");

  const oldRunner = makeRunner(root, "runner-0", taskId);
  let task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0",
      project_name: "workflowhub",
      task_id: taskId,
      created_at: "2026-07-26T00:00:00.000Z",
      target_repo_root: realpathSync(target),
      issue_ids: [],
      inputs: {},
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const decision = publishAuditedAttempt({
    kernel,
    task,
    stage: "make-decision",
    worktreeRoot: candidate.worktreeRoot,
    workflowRunId: `task-created:${task.manifest.created_at}`,
    data: {
      facts: {
        worktree_root: candidate.worktreeRoot,
        baseline_commit: candidate.baselineCommit,
        snapshot_tree: git(candidate.worktreeRoot, ["rev-parse", "HEAD^{tree}"]),
      },
    },
  });
  kernel.acceptAttempt("make-decision", decision.attempt_ref, writeHumanConfirmation(kernel, "make-decision", decision));
  task = migrateTaskRunnerRoot({
    taskPath: task.taskPath,
    projectName: "workflowhub",
    taskId,
    runnerRoot: oldRunner,
    stage: "build-code",
  }).task;

  const runner1 = cloneDescendant(root, oldRunner, "runner-1");
  const previous = JSON.parse(task.readRecord(task.manifest.runner_root_migration.ref)).runner_identity;
  const next1 = inspectRunnerIdentity({
    runnerRoot: runner1,
    projectName: "workflowhub",
    taskId,
    stage: "build-code",
    requireClean: true,
  });
  const generation1Credential = {
    schema_version: "workflowhub-recovery-credential.v1",
    project_name: "workflowhub",
    task_id: taskId,
    recovery_kind: "runner-replacement",
    nonce: "generation-1",
    issued_at: "2026-07-26T00:00:00.000Z",
    decision: "accepted",
    accepted_business_snapshot: businessSnapshot(task),
    runner_subject: {
      previous_runner: previous,
      new_runner: next1,
      previous_manifest_hash: sha256(task.readRecord("task.json")),
      stage: "build-code",
    },
  };
  const generation1Written = writeRecoveryCredentialForTest(task, generation1Credential);
  const generation1Result = JSON.parse(runCli([
    "runner-replacement",
    `--task-path=${task.taskPath}`,
    "--project=workflowhub",
    `--task=${taskId}`,
    `--runner-root=${runner1}`,
    "--stage=build-code",
    `--credential-ref=${generation1Written.ref}`,
    `--credential-hash=${generation1Written.hash}`,
  ]));
  task = openTask(task.taskPath, "workflowhub", taskId);

  const runner2 = cloneDescendant(root, runner1, "runner-2", 71);
  const next2 = inspectRunnerIdentity({
    runnerRoot: runner2,
    projectName: "workflowhub",
    taskId,
    stage: "build-code",
    requireClean: true,
  });
  return {
    root,
    task,
    taskId,
    runner1,
    runner2,
    next2,
    generation1Credential: generation1Written,
    generation1: {
      ref: generation1Result.recovery_ref,
      hash: generation1Result.recovery_hash,
    },
  };
}

function publishBridgeInputs(f, options = {}) {
  const kernel = createTaskKernel(f.task);
  const currentRunner = inspectRunnerIdentity({
    runnerRoot: f.runner1,
    projectName: "workflowhub",
    taskId: f.taskId,
    stage: "build-code",
    requireClean: true,
  });
  const excerpt = "User selected A and authorized one audited next-generation runner credential.";
  const authorization = {
    schema_version: "workflowhub-runner-replacement-authorization.v1",
    project_name: "workflowhub",
    task_id: f.taskId,
    stage: "build-code",
    decision: "accepted",
    excerpt,
    excerpt_hash: options.authorizationExcerptHash ?? sha256(excerpt),
    // Deliberately no source_ref. The bridge must preserve this as unknown,
    // rather than inventing a conversation or tracker reference.
  };
  const authorizationRaw = canonical(authorization);
  const authorizationRef = `evidence/runner-replacement/authorization-${sha256(authorizationRaw)}.json`;
  publishExact(kernel, f.task, authorizationRef, authorizationRaw);

  const packetNextRunner = options.nextRunner ?? f.next2;
  const diffRunner = options.diffRunner ?? f.next2;
  const diffRaw = execFileSync("git", ["diff", "--binary", currentRunner.runner_oid, diffRunner.runner_oid], {
    cwd: diffRunner.runner_root,
    encoding: "utf8",
  });
  const changedFiles = execFileSync("git", ["diff", "--name-only", currentRunner.runner_oid, diffRunner.runner_oid], {
    cwd: diffRunner.runner_root,
    encoding: "utf8",
  }).trim().split("\n").filter(Boolean);
  const packet = {
    schema_version: "workflowhub-runner-replacement-bootstrap-packet.v1",
    project_name: "workflowhub",
    task_id: f.taskId,
    stage: "build-code",
    current_generation: options.currentGeneration ?? { ref: f.generation1.ref, hash: f.generation1.hash },
    current_manifest: options.currentManifest ?? { ref: "task.json", hash: sha256(f.task.readRecord("task.json")) },
    current_runner: options.currentRunner ?? currentRunner,
    next_runner: packetNextRunner,
    accepted_business_snapshot: options.acceptedBusinessSnapshot ?? businessSnapshot(f.task),
    authorization: { ref: authorizationRef, hash: sha256(authorizationRaw) },
  };
  const packetRaw = canonical(packet);
  const packetHash = sha256(packetRaw);
  const packetRef = `evidence/runner-replacement/bootstrap-packet-${sha256(packetRaw)}.json`;
  publishExact(kernel, f.task, packetRef, packetRaw);

  const testStdoutRaw = "22 bootstrap contract tests passed\n";
  const testStderrRaw = "";
  const testStdoutRef = `evidence/runner-replacement/bootstrap-tests/${sha256(testStdoutRaw)}.stdout`;
  const testStderrRef = `evidence/runner-replacement/bootstrap-tests/${sha256(testStderrRaw)}.stderr`;
  publishExact(kernel, f.task, testStdoutRef, testStdoutRaw);
  publishExact(kernel, f.task, testStderrRef, testStderrRaw);
  const testReceipt = {
    schema_version: "runner-replacement-bootstrap-test-receipt.v1",
    project_name: "workflowhub",
    task_id: f.taskId,
    commit_oid: options.testCommitOid ?? diffRunner.runner_oid,
    snapshot_tree: options.testSnapshotTree ?? git(diffRunner.runner_root, ["rev-parse", "HEAD^{tree}"]),
    command: options.testCommand ?? "npx vitest run scripts/__tests__/runner-replacement-bridge.test.mjs",
    exit_code: options.testExitCode ?? 0,
    counts: options.testCounts ?? { files: 3, tests: 22, passed: 22, failed: 0 },
    stdout: { ref: testStdoutRef, hash: options.testStdoutHash ?? sha256(testStdoutRaw) },
    stderr: { ref: testStderrRef, hash: options.testStderrHash ?? sha256(testStderrRaw) },
  };
  const testReceiptRaw = canonical(testReceipt);
  const testReceiptHash = sha256(testReceiptRaw);
  const testReceiptRef = `receipts/runner-replacement/bootstrap-test-${testReceiptHash}.json`;
  publishExact(kernel, f.task, testReceiptRef, testReceiptRaw);

  const coverageMap = {
    schema_version: "runner-replacement-path-coverage-map.v1",
    project_name: "workflowhub",
    task_id: f.taskId,
    old_runner_oid: currentRunner.runner_oid,
    new_runner_oid: diffRunner.runner_oid,
    diff_hash: options.coverageDiffHash ?? sha256(diffRaw),
    entries: (options.coveragePaths ?? changedFiles).map((path) => ({
      path,
      status: "covered",
      test_ids: ["bootstrap-contract"],
    })),
  };
  const coverageMapRaw = canonical(coverageMap);
  const coverageMapHash = sha256(coverageMapRaw);
  const coverageMapRef = `evidence/runner-replacement/bootstrap-coverage/${coverageMapHash}.json`;
  publishExact(kernel, f.task, coverageMapRef, coverageMapRaw);

  const providerConfig = {
    schema_version: "runner-replacement-bootstrap-provider-config.v1",
    source_hash: options.routeSourceHash ?? ROUTE_SOURCE_HASH,
    ordered_providers: options.routeProviders ?? ["pi/coding", "cursor/grok"],
    mode: options.routeMode ?? "full_only",
    minimum_heterologous: options.routeMinimum ?? 1,
    profiles: options.routeProfiles ?? ROUTE_PROFILES,
    secret_free: true,
    ...(options.providerConfigExtra ?? {}),
  };
  const providerConfigRaw = canonical(providerConfig);
  const providerConfigHash = sha256(providerConfigRaw);
  const providerConfigRef = `evidence/runner-replacement/bootstrap-provider-config/${providerConfigHash}.json`;
  publishExact(kernel, f.task, providerConfigRef, providerConfigRaw);

  const bundle = {
    schema_version: "runner-replacement-bootstrap-sealed-bundle.v1",
    project_name: "workflowhub",
    task_id: f.taskId,
    purpose: "runner-replacement-bootstrap",
    packet: {
      ref: packetRef,
      hash: options.bundlePacketHash ?? packetHash,
      bytes: options.bundlePacketBytes ?? packetRaw,
    },
    authorization: {
      ref: authorizationRef,
      hash: options.bundleAuthorizationHash ?? sha256(authorizationRaw),
      bytes: options.bundleAuthorizationBytes ?? authorizationRaw,
    },
    source_diff: {
      old_runner_oid: currentRunner.runner_oid,
      new_runner_oid: diffRunner.runner_oid,
      hash: options.bundleDiffHash ?? sha256(diffRaw),
      paths: options.bundlePaths ?? changedFiles,
    },
    bootstrap_test_receipt: {
      ref: testReceiptRef,
      hash: options.bundleTestReceiptHash ?? testReceiptHash,
      bytes: options.bundleTestReceiptBytes ?? testReceiptRaw,
    },
    path_coverage_map: {
      ref: coverageMapRef,
      hash: options.bundleCoverageMapHash ?? coverageMapHash,
      bytes: options.bundleCoverageMapBytes ?? coverageMapRaw,
    },
    provider_config: {
      ref: providerConfigRef,
      hash: options.bundleProviderConfigHash ?? providerConfigHash,
      bytes: options.bundleProviderConfigBytes ?? providerConfigRaw,
    },
  };
  const bundleRaw = canonical(bundle);
  const bundleHash = sha256(bundleRaw);
  const bundleRef = `evidence/runner-replacement/bootstrap-bundles/${bundleHash}.json`;
  publishExact(kernel, f.task, bundleRef, bundleRaw);

  const providerVerdict = options.verdict ?? "pass";
  const providerFindings = providerVerdict === "pass" ? [] : [{
    severity: "major",
    path: "scripts/task-recovery.mjs",
    issue: "sealed bootstrap bundle requires revision",
    root_cause: "the exact sealed bundle violates the recovery contract",
    evidence: "the independent provider rejected the exact sealed bundle",
    evidence_kind: "direct",
    recommendation: "repair and seal a new bundle",
  }];
  const unavailableResult = (provider, code = "PROVIDER_UNAVAILABLE") => ({
    provider,
    runtime_id: `${provider.replace("/", "-")}-runtime`,
    session_id: null,
    status: "unavailable",
    verdict: null,
    findings: [],
    error: { code, message: `${provider} unavailable` },
  });
  let providerResults;
  if (Array.isArray(options.providerResults)) {
    providerResults = structuredClone(options.providerResults);
  } else if (options.unavailable) {
    providerResults = [
      unavailableResult("pi/coding"),
      unavailableResult("cursor/grok"),
    ];
  } else if (options.cursorPass) {
    providerResults = [
      unavailableResult("pi/coding"),
      {
        provider: "cursor/grok",
        runtime_id: "cursor-runtime",
        session_id: "cursor-session",
        status: "completed",
        verdict: "pass",
        findings: [],
        error: null,
      },
    ];
  } else {
    providerResults = [
      options.providerError ? {
        ...unavailableResult("pi/coding", "PROVIDER_ERROR"),
        status: "error",
      } : {
        provider: options.emptyProvider ? "" : "pi/coding",
        runtime_id: options.emptyRuntime ? "" : "pi-runtime",
        session_id: options.emptySession ? "" : "pi-session",
        status: "completed",
        verdict: providerVerdict,
        findings: providerFindings,
        error: null,
      },
      unavailableResult("cursor/grok"),
    ];
  }
  if (options.omitProvider) providerResults = providerResults.filter(({ provider }) => provider !== options.omitProvider);
  const validProviderResults = providerResults.filter(({ status, verdict }) =>
    status === "completed" && ["pass", "revise_required"].includes(verdict));
  const semanticStatus = validProviderResults.length >= providerConfig.minimum_heterologous ? "semantic" : "unavailable";
  const aggregateVerdict = semanticStatus === "semantic"
    ? (validProviderResults.some(({ verdict }) => verdict === "revise_required") ? "revise_required" : "pass")
    : null;
  const aggregateFindings = validProviderResults.flatMap(({ provider, findings }) =>
    findings.map((finding) => ({ provider, ...finding })));
  const reviewValue = {
    schema_version: "bootstrap-review.v1",
    project_name: "workflowhub",
    task_id: f.taskId,
    purpose: "runner-replacement-bootstrap",
    packet_ref: packetRef,
    packet_hash: packetHash,
    bundle_ref: bundleRef,
    bundle_hash: bundleHash,
    material_id: options.reviewMaterialId ?? bundleHash,
    old_runner_oid: options.reviewOldOid ?? currentRunner.runner_oid,
    new_runner_oid: options.reviewNewOid ?? packetNextRunner.runner_oid,
    snapshot_tree: options.reviewSnapshot ?? git(packetNextRunner.runner_root, ["rev-parse", "HEAD^{tree}"]),
    route_descriptor_ref: providerConfigRef,
    route_descriptor_hash: providerConfigHash,
    provider_results: providerResults,
    status: semanticStatus,
    verdict: aggregateVerdict,
    findings: aggregateFindings,
    error: semanticStatus === "semantic" ? null : {
      code: "REVIEW_QUORUM_UNAVAILABLE",
      message: `only ${validProviderResults.length} valid reviewer result(s); ${providerConfig.minimum_heterologous} required`,
    },
  };
  const reviewRaw = canonical(reviewValue);
  const reviewHash = sha256(reviewRaw);
  const reviewRef = `evidence/runner-replacement/bootstrap-reviews/${reviewHash}.json`;
  publishExact(kernel, f.task, reviewRef, reviewRaw);
  return {
    authorizationRef,
    authorizationHash: sha256(authorizationRaw),
    packetRef,
    packetHash,
    packetRaw,
    packet,
    bundleRef,
    bundleHash,
    bundleRaw,
    bundle,
    testReceipt: { ref: testReceiptRef, hash: testReceiptHash, raw: testReceiptRaw, value: testReceipt },
    coverageMap: { ref: coverageMapRef, hash: coverageMapHash, raw: coverageMapRaw, value: coverageMap },
    providerConfig: { ref: providerConfigRef, hash: providerConfigHash, raw: providerConfigRaw, value: providerConfig },
    review: { resultRef: reviewRef, resultHash: reviewHash, value: reviewValue },
  };
}

function bridgeArgs(f, input, nonce = "generation-2") {
  return [
    "runner-replacement-bridge",
    `--task-path=${f.task.taskPath}`,
    "--project=workflowhub",
    `--task=${f.taskId}`,
    `--runner-root=${f.runner2}`,
    "--stage=build-code",
    `--authorization-ref=${input.authorizationRef}`,
    `--authorization-hash=${input.authorizationHash}`,
    `--bootstrap-packet-ref=${input.packetRef}`,
    `--bootstrap-packet-hash=${input.packetHash}`,
    `--bootstrap-bundle-ref=${input.bundleRef}`,
    `--bootstrap-bundle-hash=${input.bundleHash}`,
    `--bootstrap-review-result-ref=${input.review.resultRef}`,
    `--bootstrap-review-result-hash=${input.review.resultHash}`,
    `--nonce=${nonce}`,
  ];
}

function publishUserBootstrapAuthorization(f, input, overrides = {}) {
  const kernel = createTaskKernel(f.task);
  const publish = (directory, value) => {
    const valueRaw = canonical(value);
    const valueHash = sha256(valueRaw);
    const valueRef = `${directory}/${valueHash}.json`;
    publishExact(kernel, f.task, valueRef, valueRaw);
    return { ref: valueRef, hash: valueHash };
  };
  const invalidatedDispatches = ["first", "retry"].map((label) => publish(
    "evidence/runner-replacement/dispatch-invalidations",
    {
      schema_version: "runner-replacement-dispatch-invalidation.v1",
      project_name: "workflowhub",
      task_id: f.taskId,
      runtime_id: `runtime-${label}`,
      decision: "invalid_unavailable",
      effect: "cannot_authorize_credential",
    },
  ));
  const routeCorrection = publish("evidence/runner-replacement/route-corrections", {
    schema_version: "runner-replacement-bootstrap-route-correction.v1",
    project_name: "workflowhub",
    task_id: f.taskId,
    authoritative_route: {
      stage: "build-code",
      initial: input.providerConfig.value.ordered_providers,
      mode: input.providerConfig.value.mode,
      minimum_heterologous: input.providerConfig.value.minimum_heterologous,
      profiles: input.providerConfig.value.profiles,
    },
  });
  const priorValue = {
    schema_version: "runner-replacement-bootstrap-test-receipt.v1",
    project_name: "workflowhub",
    task_id: f.taskId,
    commit_oid: input.packet.next_runner.runner_oid,
    snapshot_tree: input.review.value.snapshot_tree,
    command: "prior targeted tests",
    exit_code: 0,
    counts: { files: 11, tests: 142, passed: 142, failed: 0 },
    stdout: { ref: input.testReceipt.value.stdout.ref, hash: input.testReceipt.value.stdout.hash },
    stderr: { ref: input.testReceipt.value.stderr.ref, hash: input.testReceipt.value.stderr.hash },
  };
  const priorRaw = canonical(priorValue);
  const priorHash = sha256(priorRaw);
  const priorReceipt = {
    ref: `receipts/runner-replacement/bootstrap-test-${priorHash}.json`,
    hash: priorHash,
  };
  publishExact(kernel, f.task, priorReceipt.ref, priorRaw);
  const bridgeSevenRaw = canonical({
    ...priorValue,
    command: "prior exact-route bridge tests",
    counts: { files: 1, tests: 7, passed: 7, failed: 0 },
  });
  const bridgeSevenHash = sha256(bridgeSevenRaw);
  const bridgeSevenReceipt = {
    ref: `receipts/runner-replacement/bootstrap-test-${bridgeSevenHash}.json`,
    hash: bridgeSevenHash,
  };
  publishExact(kernel, f.task, bridgeSevenReceipt.ref, bridgeSevenRaw);
  const value = {
    schema_version: "workflowhub-user-authorized-runner-bootstrap.v1",
    project_name: "workflowhub",
    task_id: f.taskId,
    purpose: "runner-replacement-bootstrap",
    decision: "accepted",
    reason: "explicit_user_runner_upgrade_authorization",
    generation: 2,
    single_use: true,
    base_authorization: { ref: input.authorizationRef, hash: input.authorizationHash },
    current_generation: input.packet.current_generation,
    current_manifest: input.packet.current_manifest,
    runner_subject: { oid: input.packet.next_runner.runner_oid, tree: input.review.value.snapshot_tree },
    source_diff: { hash: input.bundle.source_diff.hash, path_count: input.bundle.source_diff.paths.length },
    test_receipts: [
      { ref: input.testReceipt.ref, hash: input.testReceipt.hash },
      bridgeSevenReceipt,
      priorReceipt,
    ],
    coverage: { ref: input.coverageMap.ref, hash: input.coverageMap.hash },
    route_correction: routeCorrection,
    sealed_bundle: { ref: input.bundleRef, hash: input.bundleHash },
    invalidated_dispatches: invalidatedDispatches,
    future_policy: "formal_review_required",
    ...overrides,
  };
  return publish("evidence/runner-replacement/user-bootstrap-authorizations", value);
}

function userBootstrapArgs(f, input, userAuthorization) {
  return bridgeArgs(f, input)
    .filter((arg) => !arg.startsWith("--bootstrap-review-result-"))
    .concat([
      "--bootstrap-trust-mode=user-authorized-bootstrap",
      `--user-bootstrap-authorization-ref=${userAuthorization.ref}`,
      `--user-bootstrap-authorization-hash=${userAuthorization.hash}`,
    ]);
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("multi-generation runner replacement external bridge", () => {
  it("allows a historical previous-runner stage while binding the credential to the new runner stage", () => {
    const f = fixture();
    const input = publishBridgeInputs(f);
    const credential = {
      schema_version: "workflowhub-recovery-credential.v1",
      project_name: "workflowhub",
      task_id: f.taskId,
      recovery_kind: "runner-replacement",
      nonce: "stage-transition",
      issued_at: "2026-07-26T00:00:00.000Z",
      decision: "accepted",
      accepted_business_snapshot: businessSnapshot(f.task),
      runner_subject: {
        previous_runner: { ...input.packet.current_runner, stage: "build-spec", stage_skill_ref: "workflows/build-spec/SKILL.md" },
        new_runner: input.packet.next_runner,
        previous_manifest_hash: input.packet.current_manifest.hash,
        stage: "build-code",
      },
    };
    expect(() => validateRecoveryCredential(credential)).not.toThrow();
  });

  it("rejects a credential whose declared stage differs from the new runner stage", () => {
    const f = fixture();
    const input = publishBridgeInputs(f);
    const credential = {
      schema_version: "workflowhub-recovery-credential.v1",
      project_name: "workflowhub",
      task_id: f.taskId,
      recovery_kind: "runner-replacement",
      nonce: "wrong-new-stage",
      issued_at: "2026-07-26T00:00:00.000Z",
      decision: "accepted",
      accepted_business_snapshot: businessSnapshot(f.task),
      runner_subject: {
        previous_runner: input.packet.current_runner,
        new_runner: input.packet.next_runner,
        previous_manifest_hash: input.packet.current_manifest.hash,
        stage: "build-spec",
      },
    };
    expect(() => validateRecoveryCredential(credential)).toThrow(/runner_subject.stage is invalid/);
  });

  it("accepts one exact generation-2 user-authorized bootstrap without treating unavailable reviews as PASS", () => {
    const f = fixture();
    const input = publishBridgeInputs(f, {
      testCounts: { files: 1, tests: 7, passed: 7, failed: 0 },
    });
    const userAuthorization = publishUserBootstrapAuthorization(f, input);
    const output = JSON.parse(runCli(userBootstrapArgs(f, input, userAuthorization)));
    expect(JSON.parse(f.task.readRecord(output.credential_ref)).bridge_subject).toMatchObject({
      bootstrap_user_authorization: userAuthorization,
      sealed_bundle: { ref: input.bundleRef, hash: input.bundleHash },
    });
    expect(JSON.parse(f.task.readRecord(output.credential_ref)).bridge_subject)
      .not.toHaveProperty("bootstrap_review_result");
  });

  it("rejects stale or widened user-authorized bootstrap facts", () => {
    const f = fixture();
    const input = publishBridgeInputs(f, {
      testCounts: { files: 1, tests: 7, passed: 7, failed: 0 },
    });
    const userAuthorization = publishUserBootstrapAuthorization(f, input, { generation: 3 });
    expect(() => runCli(userBootstrapArgs(f, input, userAuthorization)))
      .toThrow(/RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID/);
  });

  it("issues only one task-local generation-2 credential with transparent authorization provenance", () => {
    const f = fixture();
    const input = publishBridgeInputs(f);
    const manifestBefore = f.task.readRecord("task.json");
    const businessBefore = f.task.readRecord("results/make-decision/accepted.json");
    const reviewBefore = f.task.readRecord(input.review.resultRef);
    const generation1Before = f.task.readRecord(f.generation1.ref);
    const stageReviewsBefore = f.task.listCanonicalReviewResultRefs();
    expect(() => f.task.readRecord("phase-result.json")).toThrow();
    expect(() => f.task.readRecord("identity/recoveries/runner-replacement-0002.json")).toThrow();
    expect(input.review.resultRef).toMatch(/^evidence\/runner-replacement\/bootstrap-reviews\//);
    expect(input.review.value).toMatchObject({
      schema_version: "bootstrap-review.v1",
      packet_ref: input.packetRef,
      packet_hash: input.packetHash,
      bundle_ref: input.bundleRef,
      bundle_hash: input.bundleHash,
      material_id: input.bundleHash,
      old_runner_oid: input.packet.current_runner.runner_oid,
      new_runner_oid: input.packet.next_runner.runner_oid,
      snapshot_tree: git(f.runner2, ["rev-parse", "HEAD^{tree}"]),
      route_descriptor_ref: input.providerConfig.ref,
      route_descriptor_hash: input.providerConfig.hash,
      provider_results: [
        {
          provider: "pi/coding", runtime_id: "pi-runtime", session_id: "pi-session",
          status: "completed", verdict: "pass", findings: [], error: null,
        },
        {
          provider: "cursor/grok", runtime_id: "cursor-grok-runtime", session_id: null,
          status: "unavailable", verdict: null, findings: [],
          error: { code: "PROVIDER_UNAVAILABLE", message: "cursor/grok unavailable" },
        },
      ],
      status: "semantic",
      verdict: "pass",
      findings: [],
      error: null,
    });
    expect(input.review.value).not.toHaveProperty("stage");
    expect(input.bundle).toMatchObject({
      schema_version: "runner-replacement-bootstrap-sealed-bundle.v1",
      packet: { ref: input.packetRef, hash: input.packetHash, bytes: input.packetRaw },
      authorization: { ref: input.authorizationRef, hash: input.authorizationHash },
      source_diff: {
        old_runner_oid: input.packet.current_runner.runner_oid,
        new_runner_oid: input.packet.next_runner.runner_oid,
        paths: expect.any(Array),
      },
      bootstrap_test_receipt: {
        ref: input.testReceipt.ref,
        hash: input.testReceipt.hash,
        bytes: input.testReceipt.raw,
      },
      path_coverage_map: {
        ref: input.coverageMap.ref,
        hash: input.coverageMap.hash,
        bytes: input.coverageMap.raw,
      },
      provider_config: {
        ref: input.providerConfig.ref,
        hash: input.providerConfig.hash,
        bytes: input.providerConfig.raw,
      },
    });
    expect(input.bundle.authorization.bytes).toBe(f.task.readRecord(input.authorizationRef));
    expect(input.bundle.source_diff.paths).toHaveLength(71);
    expect(new Set(input.bundle.source_diff.paths).size).toBe(71);
    expect(input.testReceipt.value).toMatchObject({
      commit_oid: f.next2.runner_oid,
      snapshot_tree: git(f.runner2, ["rev-parse", "HEAD^{tree}"]),
      exit_code: 0,
      counts: { tests: 22, passed: 22, failed: 0 },
      stdout: { ref: expect.any(String), hash: expect.stringMatching(/^[a-f0-9]{64}$/) },
      stderr: { ref: expect.any(String), hash: expect.stringMatching(/^[a-f0-9]{64}$/) },
    });
    expect(input.coverageMap.value.entries).toHaveLength(71);
    expect(input.coverageMap.value.entries.map((entry) => entry.path))
      .toEqual(input.bundle.source_diff.paths);
    expect(input.providerConfig.value).toEqual({
      schema_version: "runner-replacement-bootstrap-provider-config.v1",
      source_hash: ROUTE_SOURCE_HASH,
      ordered_providers: ["pi/coding", "cursor/grok"],
      mode: "full_only",
      minimum_heterologous: 1,
      profiles: ROUTE_PROFILES,
      secret_free: true,
    });

    const output = JSON.parse(runCli(bridgeArgs(f, input)));
    expect(output).toEqual({
      credential_ref: "identity/recovery-credentials/runner-replacement/generation-2.json",
      credential_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    const reopened = openTask(f.task.taskPath, "workflowhub", f.taskId);
    expect(reopened.readRecord("task.json")).toBe(manifestBefore);
    expect(reopened.readRecord("results/make-decision/accepted.json")).toBe(businessBefore);
    expect(reopened.readRecord(input.review.resultRef)).toBe(reviewBefore);
    expect(reopened.readRecord(f.generation1.ref)).toBe(generation1Before);
    expect(reopened.listCanonicalReviewResultRefs()).toEqual(stageReviewsBefore);
    expect(() => reopened.readRecord("phase-result.json")).toThrow();
    expect(() => reopened.readRecord("identity/recoveries/runner-replacement-0002.json")).toThrow();

    const credentialRaw = reopened.readRecord(output.credential_ref);
    expect(sha256(credentialRaw)).toBe(output.credential_hash);
    expect(JSON.parse(credentialRaw)).toMatchObject({
      schema_version: "workflowhub-recovery-credential.v1",
      project_name: "workflowhub",
      task_id: f.taskId,
      recovery_kind: "runner-replacement",
      nonce: "generation-2",
      decision: "accepted",
      accepted_business_snapshot: businessSnapshot(reopened),
      runner_subject: {
        previous_runner: input.packet.current_runner,
        new_runner: input.packet.next_runner,
        previous_manifest_hash: input.packet.current_manifest.hash,
        stage: "build-code",
      },
      bridge_subject: {
        current_generation: input.packet.current_generation,
        current_manifest: input.packet.current_manifest,
        authorization: {
          ref: input.authorizationRef,
          hash: input.authorizationHash,
          excerpt: expect.any(String),
          excerpt_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
          source_ref: null,
        },
        bootstrap_packet: { ref: input.packetRef, hash: input.packetHash },
        sealed_bundle: { ref: input.bundleRef, hash: input.bundleHash },
        bootstrap_review_result: { ref: input.review.resultRef, hash: input.review.resultHash },
      },
    });
  });

  it("lets only the fresh bridge credential create generation 2 and makes both old credentials stale", () => {
    const f = fixture();
    const input = publishBridgeInputs(f);
    const bridge = JSON.parse(runCli(bridgeArgs(f, input)));
    const common = [
      "runner-replacement",
      `--task-path=${f.task.taskPath}`,
      "--project=workflowhub",
      `--task=${f.taskId}`,
      `--runner-root=${f.runner2}`,
      "--stage=build-code",
    ];
    expect(() => runCli([
      ...common,
      `--credential-ref=${f.generation1Credential.ref}`,
      `--credential-hash=${f.generation1Credential.hash}`,
    ])).toThrow(/RECOVERY_(?:CREDENTIAL_INVALID|RUNNER_PROVENANCE_MISMATCH|ALREADY_USED)/);

    const result = JSON.parse(runCli([
      ...common,
      `--credential-ref=${bridge.credential_ref}`,
      `--credential-hash=${bridge.credential_hash}`,
    ]));
    expect(result).toMatchObject({
      recovery_ref: "identity/recoveries/runner-replacement-0002.json",
      recovery_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    const reopened = openTask(f.task.taskPath, "workflowhub", f.taskId);
    expect(reopened.manifest.runner_root).toBe(f.runner2);
    expect(reopened.manifest.runner_oid).toBe(f.next2.runner_oid);
    expect(() => runCli([
      ...common,
      `--credential-ref=${bridge.credential_ref}`,
      `--credential-hash=${bridge.credential_hash}`,
    ])).toThrow(/RECOVERY_(?:ALREADY_USED|CREDENTIAL_INVALID|MANIFEST_HASH_MISMATCH)/);
  });

  it("requires one canonical PASS review bound to the exact packet and clean descendant runner", () => {
    for (const variant of [
      { label: "revise", options: { verdict: "revise_required" }, error: /RECOVERY_BOOTSTRAP_REVIEW_INVALID/ },
      { label: "unavailable", options: { unavailable: true }, error: /RECOVERY_BOOTSTRAP_REVIEW_INVALID/ },
      { label: "provider error", options: { providerError: true }, error: /RECOVERY_BOOTSTRAP_REVIEW_INVALID/ },
      { label: "empty provider", options: { emptyProvider: true }, error: /RECOVERY_BOOTSTRAP_REVIEW_INVALID/ },
      { label: "empty runtime", options: { emptyRuntime: true }, error: /RECOVERY_BOOTSTRAP_REVIEW_INVALID/ },
      { label: "empty session", options: { emptySession: true }, error: /RECOVERY_BOOTSTRAP_REVIEW_INVALID/ },
      { label: "wrong material", options: { reviewMaterialId: "f".repeat(64) }, error: /RECOVERY_BOOTSTRAP_REVIEW_MISMATCH/ },
      { label: "wrong snapshot", options: { reviewSnapshot: "e".repeat(40) }, error: /RECOVERY_BOOTSTRAP_REVIEW_MISMATCH/ },
      { label: "wrong old oid", options: { reviewOldOid: "c".repeat(40) }, error: /RECOVERY_BOOTSTRAP_REVIEW_MISMATCH/ },
      { label: "wrong new oid", options: { reviewNewOid: "d".repeat(40) }, error: /RECOVERY_BOOTSTRAP_REVIEW_MISMATCH/ },
    ]) {
      const f = fixture();
      const manifestBefore = f.task.readRecord("task.json");
      const input = publishBridgeInputs(f, { ...variant.options, id: `negative-${variant.label.replaceAll(" ", "-")}` });
      expect(() => runCli(bridgeArgs(f, input, `negative-${variant.label.replaceAll(" ", "-")}`)), variant.label).toThrow(variant.error);
      expect(f.task.readRecord("task.json")).toBe(manifestBefore);
    }
  });

  it("rejects stale authorization, generation, manifest, and business snapshot bindings", () => {
    for (const variant of [
      {
        label: "authorization excerpt hash",
        options: { authorizationExcerptHash: "0".repeat(64) },
        error: /RECOVERY_AUTHORIZATION_INVALID/,
      },
      {
        label: "generation 1 hash",
        options: { currentGeneration: { ref: "identity/recoveries/runner-replacement-0001.json", hash: "0".repeat(64) } },
        error: /RECOVERY_GENERATION_MISMATCH/,
      },
      {
        label: "task manifest hash",
        options: { currentManifest: { ref: "task.json", hash: "0".repeat(64) } },
        error: /RECOVERY_MANIFEST_HASH_MISMATCH/,
      },
      {
        label: "business snapshot",
        options: null,
        error: /RECOVERY_BUSINESS_SNAPSHOT_MISMATCH/,
      },
    ]) {
      const f = fixture();
      const options = variant.label === "business snapshot"
        ? { acceptedBusinessSnapshot: { ...businessSnapshot(f.task), accepted_hash: "0".repeat(64) } }
        : variant.options;
      const input = publishBridgeInputs(f, { ...options, id: `stale-${variant.label.replaceAll(" ", "-")}` });
      expect(() => runCli(bridgeArgs(f, input, `stale-${variant.label.replaceAll(" ", "-")}`)), variant.label)
        .toThrow(variant.error);
    }
  });

  it("closes over packet, auth, diff, tests, 71-path coverage, and secret-free provider config bytes", () => {
    const f = fixture();
    const baseline = publishBridgeInputs(f);
    const zero = "0".repeat(64);
    for (const variant of [
      { label: "packet hash", options: { bundlePacketHash: zero } },
      { label: "packet bytes", options: { bundlePacketBytes: `${baseline.packetRaw}tampered` } },
      { label: "authorization hash", options: { bundleAuthorizationHash: zero } },
      { label: "authorization bytes", options: { bundleAuthorizationBytes: `${f.task.readRecord(baseline.authorizationRef)}tampered` } },
      { label: "diff hash", options: { bundleDiffHash: zero } },
      { label: "diff paths", options: { bundlePaths: baseline.bundle.source_diff.paths.slice(0, 70) } },
      { label: "test receipt hash", options: { bundleTestReceiptHash: zero } },
      { label: "test stdout hash", options: { testStdoutHash: zero } },
      { label: "test commit", options: { testCommitOid: "c".repeat(40) } },
      { label: "test tree", options: { testSnapshotTree: "d".repeat(40) } },
      { label: "test command", options: { testCommand: "" } },
      { label: "test counts", options: { testCounts: { files: 3, tests: 22, passed: 21, failed: 0 } } },
      { label: "coverage binding", options: { bundleCoverageMapHash: zero } },
      { label: "coverage diff", options: { coverageDiffHash: zero } },
      { label: "coverage paths", options: { coveragePaths: baseline.bundle.source_diff.paths.slice(0, 70) } },
      { label: "provider config binding", options: { bundleProviderConfigHash: zero } },
      { label: "provider config secret field", options: { providerConfigExtra: { api_key: "fixture-redacted" } } },
    ]) {
      const input = publishBridgeInputs(f, variant.options);
      expect(() => runCli(bridgeArgs(f, input, `closure-${variant.label.replaceAll(" ", "-")}`)), variant.label)
        .toThrow(/RECOVERY_BOOTSTRAP_(?:BUNDLE|TEST|COVERAGE|PROVIDER_CONFIG)_(?:INVALID|MISMATCH)/);
    }
  });

  it("rejects wrong refs, hashes, runner paths, dirty runners, and mutation switches", () => {
    const bundleFixture = fixture();
    const bundleInput = publishBridgeInputs(bundleFixture);
    const wrongBundleHashArgs = bridgeArgs(bundleFixture, bundleInput, "wrong-bundle-hash")
      .map((arg) => arg.startsWith("--bootstrap-bundle-hash=") ? `--bootstrap-bundle-hash=${"0".repeat(64)}` : arg);
    expect(() => runCli(wrongBundleHashArgs)).toThrow(/RECOVERY_BOOTSTRAP_BUNDLE_MISMATCH/);
    const wrongBundleRefArgs = bridgeArgs(bundleFixture, bundleInput, "wrong-bundle-ref")
      .map((arg) => arg.startsWith("--bootstrap-bundle-ref=") ? `--bootstrap-bundle-ref=${bundleInput.authorizationRef}` : arg);
    expect(() => runCli(wrongBundleRefArgs)).toThrow(/RECOVERY_BOOTSTRAP_BUNDLE_MISMATCH/);

    const hashFixture = fixture();
    const hashInput = publishBridgeInputs(hashFixture);
    const wrongHashArgs = bridgeArgs(hashFixture, hashInput, "wrong-hash")
      .map((arg) => arg.startsWith("--bootstrap-packet-hash=") ? `--bootstrap-packet-hash=${"0".repeat(64)}` : arg);
    expect(() => runCli(wrongHashArgs)).toThrow(/RECOVERY_BOOTSTRAP_PACKET_MISMATCH/);

    const refFixture = fixture();
    const refInput = publishBridgeInputs(refFixture);
    const wrongRefArgs = bridgeArgs(refFixture, refInput, "wrong-ref")
      .map((arg) => arg.startsWith("--bootstrap-packet-ref=") ? `--bootstrap-packet-ref=${refInput.authorizationRef}` : arg);
    expect(() => runCli(wrongRefArgs)).toThrow(/RECOVERY_BOOTSTRAP_PACKET_MISMATCH/);

    const pathFixture = fixture();
    const wrongPath = join(pathFixture.root, "not-the-runner");
    mkdirSync(wrongPath);
    const pathArgs = bridgeArgs(pathFixture, publishBridgeInputs(pathFixture), "wrong-path")
      .map((arg) => arg.startsWith("--runner-root=") ? `--runner-root=${wrongPath}` : arg);
    expect(() => runCli(pathArgs)).toThrow(/RECOVERY_RUNNER_IDENTITY_INVALID|runnerRoot Git validation failed/);

    const ancestryFixture = fixture();
    const independentRunner = makeRunner(ancestryFixture.root, "independent-runner", ancestryFixture.taskId);
    const independentIdentity = inspectRunnerIdentity({
      runnerRoot: independentRunner,
      projectName: "workflowhub",
      taskId: ancestryFixture.taskId,
      stage: "build-code",
      requireClean: true,
    });
    const ancestryInput = publishBridgeInputs(ancestryFixture, {
      nextRunner: independentIdentity,
      id: "not-a-descendant",
    });
    const ancestryArgs = bridgeArgs(ancestryFixture, ancestryInput, "not-a-descendant")
      .map((arg) => arg.startsWith("--runner-root=") ? `--runner-root=${independentRunner}` : arg);
    expect(() => runCli(ancestryArgs)).toThrow(/RECOVERY_RUNNER_PROVENANCE_MISMATCH/);

    const dirtyFixture = fixture();
    const dirtyInput = publishBridgeInputs(dirtyFixture);
    writeFileSync(join(dirtyFixture.runner2, "untracked.txt"), "dirty\n");
    expect(() => runCli(bridgeArgs(dirtyFixture, dirtyInput, "dirty-runner"))).toThrow(/RECOVERY_RUNNER_IDENTITY_INVALID|runnerRoot must be a clean Git worktree/);

    const switchFixture = fixture();
    const switchInput = publishBridgeInputs(switchFixture);
    expect(() => runCli([...bridgeArgs(switchFixture, switchInput, "mutation-switch"), "--replace-manifest=true"]))
      .toThrow(/RECOVERY_INPUT_REQUIRED/);
  });

  it("uses create-only nonce publication so concurrent bridge calls cannot both succeed", async () => {
    const f = fixture();
    const input = publishBridgeInputs(f);
    const args = bridgeArgs(f, input, "concurrent-generation-2");
    const results = await Promise.all([runCliProcess(args), runCliProcess(args)]);
    expect(results.map((result) => result.status).sort()).toEqual([0, 1]);
    expect(results.find((result) => result.status !== 0)?.stderr)
      .toMatch(/RECOVERY_(?:ALREADY_USED|RECORD_CONFLICT|CONCURRENT_CHANGE)/);
    const reopened = openTask(f.task.taskPath, "workflowhub", f.taskId);
    const ref = "identity/recovery-credentials/runner-replacement/concurrent-generation-2.json";
    expect(() => reopened.readRecord(ref)).not.toThrow();
    expect(reopened.readRecord("task.json")).toBe(f.task.readRecord("task.json"));
    expect(() => reopened.readRecord("identity/recoveries/runner-replacement-0002.json")).toThrow();
  });
});
