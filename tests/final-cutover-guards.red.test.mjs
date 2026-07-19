import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { officialStageHandler } from "../core/stage-handlers.mjs";
import { validateStageFacts } from "../core/task-kernel.mjs";

describe("final cutover guard contracts", () => {
  const sha = "a".repeat(64), tree = "b".repeat(40);
  const canonical = (stage, overrides = {}) => ({ schema_version: "workflowhub-receipt.v1", producer: { stage, component: "tests", version: "1" }, task_id: "task", stage, ...overrides });
  const testsReceipt = (stage, snapshotTree = tree) => canonical(stage, { command: "true", exit_code: 0, command_hash: sha, snapshot_head: tree, snapshot_tree: snapshotTree, snapshot_commit: tree, started_at: "2026-07-19T00:00:00.000Z", completed_at: "2026-07-19T00:00:01.000Z", output_ref: "evidence/test.txt", output_hash: sha });
  const reviewReceipt = (stage, verdict = "pass", snapshotTree = tree) => {
    const providerFinding = { severity: "major", path: "fixture", issue: "fixture", recommendation: "revise" };
    const providerOutput = { verdict, summary: "fixture review", findings: verdict === "pass" ? [] : [providerFinding] };
    return { version: "wh-review-result.v1", task_id: "task", stage, review_track: null,
      source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: snapshotTree,
      material_id: sha, attempt_ref: `reviews/attempts/${stage}-attempt/attempt.json`,
      provider_results: [{ provider: "fixture-provider", output: providerOutput }], verdict,
      findings: verdict === "pass" ? [] : [{ provider: "fixture-provider", ...providerFinding }] };
  };
  const workerFor = (stage, values, currentTree = tree) => {
    for (const result of Object.values(values).filter((value) => value?.version === "wh-review-result.v1")) {
      const attemptId = result.attempt_ref.split("/")[2], outputRef = `reviews/attempts/${attemptId}/providers/fixture-provider.output.json`;
      const content = JSON.stringify(result.provider_results[0].output);
      values[result.attempt_ref] = { version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: "task", stage, review_track: null,
        source: result.source, snapshot_tree: result.snapshot_tree, material_id: result.material_id,
        provider_attempts: [{ provider: "fixture-provider", status: "completed", session_id: "fixture", runtime_id: "fixture", output_ref: outputRef, error: null }], terminal_status: "semantic", error: null };
      values[outputRef] = { schema_version: "wh-review-provider-output.v1", task_id: "task", stage, attempt_id: attemptId,
        provider: "fixture-provider", content, content_hash: createHash("sha256").update(content).digest("hex") };
    }
    return { stage, identity: { taskId: "task" }, readReceipt: (ref) => ({ value: values[ref], sha256: sha }), readEvidence: (ref) => ({ value: values[ref], sha256: values[`${ref}:sha256`] ?? sha }), snapshotWorkspace: () => ({ tree: currentTree }) };
  };

  it.each([
    ["tests", "notes/tests.json"],
    ["review", "evidence/review.json"],
    ["evidence", "reviews/results/evidence.json"],
  ])("rejects a %s receipt outside its canonical namespace", async (kind, badRef) => {
    const values = {
      "notes/tests.json": { command: "true", exit_code: 0, command_hash: "a".repeat(64), snapshot_tree: "b".repeat(40), output_ref: "evidence/out", output_hash: "c".repeat(64) },
      "evidence/review.json": { version: "wh-review-result.v1", verdict: "pass", snapshot_tree: "b".repeat(40) },
      "reviews/results/evidence.json": { refs: [] },
    };
    const worker = { stage: "verify-code", identity: { taskId: "task" }, readReceipt: (ref) => ({ value: values[ref], sha256: "d".repeat(64) }) };
    const receipts = { tests: "notes/tests.json", review: "evidence/review.json", evidence: "reviews/results/evidence.json" };
    const valid = { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" };
    for (const [name, ref] of Object.entries(valid)) if (name !== kind) { receipts[name] = ref; values[ref] = name === "tests" ? values["notes/tests.json"] : name === "review" ? values["evidence/review.json"] : values["reviews/results/evidence.json"]; }
    await expect(officialStageHandler("verify-code")(worker, { receipts })).rejects.toThrow(/namespace|canonical|receipt.*ref/i);
  });

  it("requires receipt schema and producer provenance instead of accepting shape-only JSON", async () => {
    const worker = { stage: "build-spec", identity: { taskId: "task" }, writeArtifact() {}, createCheckpoint() { return {}; }, readReceipt: () => ({ value: { content: "fake" }, sha256: "a".repeat(64) }) };
    await expect(officialStageHandler("build-spec")(worker, { receipts: { spec: "receipts/spec.json" } }))
      .rejects.toThrow(/schema|producer|provenance/i);
  });

  it.each([
    ["make-decision", { decision: "receipts/decision.json" }],
    ["build-spec", { spec: "receipts/spec.json" }],
    ["build-plan", { plan: "receipts/plan.json", tasks: "receipts/tasks.json" }],
  ])("refuses to publish %s without its formal review receipts", async (stage, receipts) => {
    const values = Object.fromEntries(Object.values(receipts).map((ref) => [ref, canonical(stage, {
      producer: { stage, component: ref.includes("decision") ? "decision" : ref.includes("tasks") ? "tasks" : ref.includes("plan") ? "plan" : "spec", version: "1" },
      content: "content\n", content_hash: "unused",
    })]));
    const worker = { stage, identity: { taskId: "task" }, readReceipt: (ref) => ({ value: values[ref], sha256: sha }) };
    await expect(officialStageHandler(stage)(worker, { receipts })).rejects.toThrow(/review.*receipt ref/i);
  });

  it.each([
    ["missing spec", "build-spec", { spec: "receipts/spec.json", review: "reviews/results/review.json" }, { spec: "# Spec\n" }, {}],
    ["different spec", "build-spec", { spec: "receipts/spec.json", review: "reviews/results/review.json" }, { spec: "# Spec\n" }, { "spec.md": "wrong\n" }],
    ["missing tasks", "build-plan", { plan: "receipts/plan.json", tasks: "receipts/tasks.json", review: "reviews/results/review.json" }, { plan: "# Plan\n", tasks: "# Tasks\n" }, { "plan.md": "# Plan\n" }],
    ["different tasks", "build-plan", { plan: "receipts/plan.json", tasks: "receipts/tasks.json", review: "reviews/results/review.json" }, { plan: "# Plan\n", tasks: "# Tasks\n" }, { "plan.md": "# Plan\n", "tasks.md": "wrong\n" }],
  ])("rejects %s when the reviewed design artifact differs from its final receipt without mutating the Workspace", async (_case, stage, receipts, contents, artifacts) => {
    const values = { "reviews/results/review.json": reviewReceipt(stage) };
    for (const [component, content] of Object.entries(contents)) values[`receipts/${component}.json`] = canonical(stage, {
      producer: { stage, component, version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex"),
    });
    let checkpointCalls = 0, writeCalls = 0;
    const worker = {
      ...workerFor(stage, values),
      readArtifact: (name) => artifacts[name],
      writeArtifact: () => { writeCalls += 1; },
      createCheckpoint: () => { checkpointCalls += 1; return {}; },
      artifactRef: (name) => `specs/task/${name}`,
    };
    await expect(officialStageHandler(stage)(worker, { receipts })).rejects.toThrow(/artifact.*receipt|differ/i);
    expect(writeCalls).toBe(0);
    expect(checkpointCalls).toBe(0);
  });

  it("rejects a stale build-spec review tree before creating a checkpoint", async () => {
    const stage = "build-spec", content = "# Spec\n", values = {
      "receipts/spec.json": canonical(stage, { producer: { stage, component: "spec", version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex") }),
      "reviews/results/review.json": reviewReceipt(stage),
    };
    let checkpointCalls = 0;
    const worker = { ...workerFor(stage, values, "c".repeat(40)), readArtifact: () => content, createCheckpoint: () => { checkpointCalls += 1; return {}; }, artifactRef: () => "specs/task/spec.md" };
    await expect(officialStageHandler(stage)(worker, { receipts: { spec: "receipts/spec.json", review: "reviews/results/review.json" } })).rejects.toThrow(/same snapshot tree/i);
    expect(checkpointCalls).toBe(0);
  });

  it("records a real failing test command as a quality fact", async () => {
    const stage = "verify-code";
    const values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    values["receipts/tests.json"].exit_code = 1;
    await expect(officialStageHandler(stage)(workerFor(stage, values), { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } }))
      .resolves.toMatchObject({ facts: { tests: { exit_code: 1 } } });
  });

  it("records revise_required instead of turning review into a gate", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage, "revise_required"),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values), { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } })).resolves.toMatchObject({ facts: { review: { verdict: "revise_required" } } });
  });

  it("serializes an unavailable review attempt as a real fact without inventing pass", async () => {
    const stage = "verify-code", attemptRef = "reviews/attempts/verify-unavailable/attempt.json";
    const earlierOutputRef = "reviews/attempts/verify-unavailable/providers/fixture-provider.output.json";
    const earlierContent = JSON.stringify({ verdict: "pass", summary: "superseded output", findings: [] });
    const unavailable = {
      version: "wh-review-attempt.v1", attempt_id: "verify-unavailable", task_id: "task", stage, review_track: null,
      source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: tree,
      material_id: sha, provider_attempts: [{
        provider: "fixture-provider", status: "completed", session_id: "old", runtime_id: "old", output_ref: earlierOutputRef, error: null,
      }, {
        provider: "fixture-provider", status: "failed", session_id: null, runtime_id: null, output_ref: null,
        error: { code: "PROVIDER_UNAVAILABLE", message: "provider timed out" },
      }], terminal_status: "unavailable",
      error: { code: "PROVIDER_UNAVAILABLE", message: "provider timed out" },
    };
    const values = {
      "receipts/tests.json": testsReceipt(stage),
      [attemptRef]: unavailable,
      [earlierOutputRef]: {
        schema_version: "wh-review-provider-output.v1", task_id: "task", stage, attempt_id: "verify-unavailable",
        provider: "fixture-provider", content: earlierContent, content_hash: createHash("sha256").update(earlierContent).digest("hex"),
      },
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const result = await officialStageHandler(stage)(workerFor(stage, values), {
      receipts: { tests: "receipts/tests.json", review: attemptRef, evidence: "evidence/manifest.json" },
    });
    expect(result).toMatchObject({
      facts: { review: { status: "unavailable", attempt_ref: attemptRef, attempt_hash: sha, snapshot_tree: tree, error: unavailable.error } },
      missing_items: [expect.stringMatching(/review.*unavailable.*PROVIDER_UNAVAILABLE/i)],
    });
    expect(result.facts.review).not.toHaveProperty("verdict", "pass");
    expect(() => validateStageFacts(stage, result.facts)).not.toThrow();
  });

  it("rejects an unavailable attempt when the latest provider output is a sufficient pass", async () => {
    const stage = "verify-code", attemptId = "false-unavailable", attemptRef = `reviews/attempts/${attemptId}/attempt.json`;
    const outputRef = `reviews/attempts/${attemptId}/providers/fixture-provider.output.json`;
    const content = JSON.stringify({ verdict: "pass", summary: "review passed", findings: [] });
    const values = {
      "receipts/tests.json": testsReceipt(stage),
      [attemptRef]: {
        version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: "task", stage, review_track: null,
        source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: tree,
        material_id: sha, provider_attempts: [{
          provider: "fixture-provider", status: "completed", session_id: "session", runtime_id: "runtime", output_ref: outputRef, error: null,
        }], terminal_status: "unavailable", error: { code: "PROVIDER_UNAVAILABLE", message: "claimed unavailable" },
      },
      [outputRef]: {
        schema_version: "wh-review-provider-output.v1", task_id: "task", stage, attempt_id: attemptId,
        provider: "fixture-provider", content, content_hash: createHash("sha256").update(content).digest("hex"),
      },
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values), {
      receipts: { tests: "receipts/tests.json", review: attemptRef, evidence: "evidence/manifest.json" },
    })).rejects.toThrow(/claims unavailable.*semantic result/i);
  });

  it("still rejects an unknown formal review verdict as an integrity error", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage, "invented"),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values), { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } })).rejects.toThrow(/SCHEMA_VALIDATION_FAILED.*verdict/i);
  });

  it("rejects a review result detached from its attempt/provider evidence chain", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage), "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    values[values["reviews/results/review.json"].attempt_ref].material_id = "0".repeat(64);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } })).rejects.toThrow(/attempt\/result material_id mismatch/i);
  });

  it("rejects a pass result when the provider's final raw output requires revision", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage), "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values), attempt = values[values["reviews/results/review.json"].attempt_ref];
    const output = values[attempt.provider_attempts[0].output_ref];
    output.content = JSON.stringify({ verdict: "revise_required", summary: "must revise", findings: [{ severity: "major", path: "src/a.js", issue: "bug", recommendation: "fix it" }] });
    output.content_hash = createHash("sha256").update(output.content).digest("hex");
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } })).rejects.toThrow(/semantic output mismatch|verdict does not match/i);
  });

  it("rejects build-code receipts bound to different snapshot trees", async () => {
    const stage = "build-code", values = {
      "receipts/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "receipts/tests.json": testsReceipt(stage, "c".repeat(40)),
      "reviews/results/review.json": reviewReceipt(stage),
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values), { receipts: { implementation: "receipts/implementation.json", tests: "receipts/tests.json", review: "reviews/results/review.json" } })).rejects.toThrow(/same.*snapshot|snapshot.*tree/i);
  });

  it("rejects verify-code when tests/review no longer match the current tree", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values, "c".repeat(40)), { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } })).rejects.toThrow(/current.*snapshot|must match/i);
  });

  it("rejects acceptance evidence without stable criterion identity and schema", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [{ ref: "evidence/ac.txt", sha256: sha }] }),
      "evidence/ac.txt": { result: "pass", refs: [] },
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values), { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } })).rejects.toThrow(/acceptance_criterion_id|acceptance.*schema|criterion identity/i);
  });

  it.each([
    ["duplicate criterion id", [{ ref: "evidence/ac-1.json", sha256: sha }, { ref: "evidence/ac-2.json", sha256: sha }], { "evidence/ac-1.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/ac-2.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/proof.txt": "proof" }, /duplicate acceptance_criterion_id/i],
    ["nested evidence hash mismatch", [{ ref: "evidence/ac-1.json", sha256: sha }], { "evidence/ac-1.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/proof.txt": "proof", "evidence/proof.txt:sha256": "0".repeat(64) }, /hash mismatch/i],
  ])("rejects invalid acceptance-evidence.v1: %s", async (_label, refs, entities, error) => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage), "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs }), ...entities,
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values), { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } })).rejects.toThrow(error);
  });

  it("records a failed acceptance criterion without blocking verification publication", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage), "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [{ ref: "evidence/ac-1.json", sha256: sha }] }),
      "evidence/ac-1.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "fail", refs: [{ ref: "evidence/proof.txt", sha256: sha }] },
      "evidence/proof.txt": "proof",
    };
    await expect(officialStageHandler(stage)(workerFor(stage, values), { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" } })).resolves.toMatchObject({ facts: { evidence_refs: [{ ref: "evidence/ac-1.json" }] } });
  });

  it("verifies every referenced file exists and matches its declared hash", () => {
    const runner = readFileSync(resolve("core/stage-runner.mjs"), "utf8");
    expect(runner).toMatch(/(?:verify|assert).*Evidence|evidence.*(?:exists|hash)/i);
    expect(runner).toMatch(/output_ref[\s\S]*(?:readRecord|sha256)/i);
  });

  it("uses an epoch-bound quiescing protocol before switching storage roots", () => {
    const source = readFileSync(resolve("scripts/migrate-task-v2.mjs"), "utf8");
    expect(source).toMatch(/assertMigrationAuthority[\s\S]*expectedEpoch:\s*options\.epoch/);
    const authority = readFileSync(resolve("core/runtime-mode.mjs"), "utf8");
    expect(authority).toMatch(/assertMigrationAuthority[\s\S]*quiescing[\s\S]*epoch/i);
  });

  it("keeps checkpoint refs unpublished until a plan-hash-bound confirmation is accepted", () => {
    const checkpoint = readFileSync(resolve("core/git-checkpoint.mjs"), "utf8");
    const kernel = readFileSync(resolve("core/task-kernel-implementation.mjs"), "utf8");
    expect(checkpoint).not.toMatch(/update-ref/);
    expect(kernel).toMatch(/confirmation[^\n]*plan_hash|plan_hash[^\n]*confirmation/i);
    expect(kernel).toMatch(/acceptAttempt[\s\S]*update-ref/);
    expect(kernel).toMatch(/reject[\s\S]*(?:delete-ref|no ref|unpublished)/i);
  });

  it("verifies checkpoint ancestry at acceptance", () => {
    const kernel = readFileSync(resolve("core/task-kernel-implementation.mjs"), "utf8");
    expect(kernel).toMatch(/acceptAttempt[\s\S]*(?:merge-base|isAncestor|ancestry)/i);
  });

  it("does not exempt test directories wholesale and keeps fixture exceptions file-scoped", () => {
    const source = readFileSync(resolve("scripts/check-task-record-paths.mjs"), "utf8");
    expect(source).not.toMatch(/rel\.includes\("\/__tests__\/"\)|\(\?:\^\|\\\/\)tests\?\\\//);
    expect(source).toMatch(/FIXTURE_ALLOWLIST/);
  });

  it("allows specs task-path construction only inside ArtifactDir", () => {
    const source = readFileSync(resolve("scripts/check-task-record-paths.mjs"), "utf8");
    expect(source).toMatch(/specs[\s\S]+ArtifactDir product authority/);
    expect(source).toMatch(/literal specs path derivation is only legal in core\/artifact-dir\.mjs/);
  });
});
