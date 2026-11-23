import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { initializeTaskStore, writeStageRow } from "../../runtime/task/task-store.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { validateAcceptanceEvidence } from "../../runtime/evidence/acceptance-evidence-validator.mjs";
import { buildRiskAcceptance, deriveSeriousReviewPause } from "../../runtime/review/stage-review-disposition.mjs";

const roots = [], taskId = "terminal-risk-oracle";
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

async function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "terminal-risk-oracle-"))); roots.push(root);
  const repo = join(root, "repo"), worktree = join(root, "worktree"), storage = join(root, "storage"), home = join(root, "home");
  for (const path of [repo, storage, home]) mkdirSync(path);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "Terminal risk oracle"]);
  git(repo, ["config", "user.email", "oracle@example.invalid"]);
  git(repo, ["commit", "--allow-empty", "-qm", "baseline"]);
  git(repo, ["worktree", "add", "-q", "-b", `task/workflowhub/${taskId}`, worktree, "main"]);
  const task = await createTask({ storageRoot: storage, manifest: {
    schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId,
    created_at: "2026-11-22T00:00:00Z", activation_cohort: "post", record_model: "vnext-single-write",
    execution_mode: "per_invocation", target_repo_root: repo, workspace_mode: "existing", workspace_root: worktree,
    issue_ids: [], inputs: {},
  } });
  await initializeTaskStore(task.taskPath, { taskId });
  const materials = join(worktree, "specs", taskId);
  mkdirSync(join(materials, "phases"), { recursive: true });
  for (const [file, body] of Object.entries({
    "decision-log.md": "# Decision\r\n", "spec.md": "# Spec\n",
    "phases/index.md": "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n",
    "phases/P1.md": "# Phase P1\n",
  })) writeFileSync(join(materials, file), body);
  return { root, repo, worktree, storage, home, task, materials };
}

function status(f, override) {
  const module = new URL("../../tools/cli/stage-runtime.mjs", import.meta.url).href;
  const script = `import {stageRuntimeCliMain} from ${JSON.stringify(module)};try{const value=await stageRuntimeCliMain(JSON.parse(process.argv[1]),{cwd:process.argv[2]});console.log(JSON.stringify({ok:true,value}));}catch(error){console.log(JSON.stringify({ok:false,error:{name:error.name,code:error.code??null,message:error.message}}));}`;
  const argv = override ?? ["status", "--action=begin", "--stage=build-code", "--project=workflowhub", `--task=${taskId}`, `--task-path=${f.task.taskPath}`];
  return JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", script, JSON.stringify(argv), f.worktree], {
    env: { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", HOME: f.home, XDG_CONFIG_HOME: join(f.home, ".config"), WORKFLOWHUB_TASK_DIR: f.storage },
    encoding: "utf8", timeout: 30_000, stdio: ["ignore", "pipe", "pipe"],
  }));
}

async function terminalFixture() {
  const f = await fixture();
  writeFileSync(join(f.materials, "spec.md"), "# Spec\n## Appendix A\n- **AC-ONE**: program returns 42\n");
  writeFileSync(join(f.worktree, "answer.mjs"), "console.log(0)\n");
  writeFileSync(join(f.worktree, "answer.test.mjs"), "import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';assert.equal(execFileSync(process.execPath,['answer.mjs'],{encoding:'utf8'}),'42\\n');\n");
  mkdirSync(join(f.task.taskPath, "quality/evidence"), { recursive: true });
  function save(name, value) {
    const raw = typeof value === "string" ? value : JSON.stringify(value), ref = `quality/evidence/${name}`;
    writeFileSync(join(f.task.taskPath, ref), raw);
    return { ref, sha256: sha(raw) };
  }
  const finding = { id: "F1", provider: "owned-fixture", severity: "major", path: "answer.mjs", line: 1,
    affected_paths: ["answer.mjs"], issue: "Owned before repair returns 0 instead of 42", recommendation: "Return 42",
    evidence_kind: "direct", evidence: "Observed owned program stdout is 0", root_cause: "Owned literal is zero" };
  const recorded = await recordSimpleReviewRequest({
    taskDir: f.task.taskPath,
    request: { stage: "build-code", review_scope: "terminal", subject_kind: "worktree", phase_id: null, materials: {} },
    runRound: async () => ({ status: "available", executor: "ocr",
      provider_results: [{ provider: "owned-fixture", status: "completed", parse_outcome: "ok", raw_output: JSON.stringify({ findings: [finding] }) }],
      findings: [finding] }),
  });
  const review = { ref: recorded.result_ref, sha256: sha(readFileSync(recorded.path)) };
  const reviewOriginal = JSON.parse(readFileSync(recorded.path, "utf8"));
  const provider_raw_refs = reviewOriginal.provider_results.flatMap(p => [p.raw_output_ref, ...(p.evidence_refs ?? [])]).filter(Boolean)
    .map(ref => ({ ref, sha256: sha(readFileSync(join(f.task.taskPath, ref))) }));
  await writeStageRow(f.task.taskPath, { stage: "build-code", source: "terminal-risk-oracle", review_origin: "conducted", review_result_ref: review.ref });
  writeFileSync(join(f.worktree, "answer.mjs"), "console.log(42)\n");
  const businessRun = await f.task.captureCommand({ cwd: f.worktree, slug: "terminal-risk-business", argv: [process.execPath, "answer.mjs"] });
  const semanticRun = await f.task.captureCommand({ cwd: f.worktree, slug: "terminal-risk-semantic", argv: [process.execPath, "--test", "answer.test.mjs"] });
  const local = path => ({ ref: path.slice(f.task.taskPath.length + 1), sha256: sha(readFileSync(path)) });
  const observed = readFileSync(businessRun.output_ref, "utf8"), actual = save("actual-output.txt", observed);
  const verdict = save("ac-first-verdict.json", { task_id: taskId, stage: "build-code", id: "AC-ONE", result: "pass", refs: [actual], observed, expected: "42\n" });
  const identity = { task_id: taskId, stage: "build-code" };
  let dispatch;
  function bindDispatch(input_refs) {
    dispatch = save(`dispatch-${Math.random().toString(16).slice(2)}.json`, { ...identity, role: "terminal-assessor",
      agent_thread_id: "fresh-reader", context_mode: "none", implementation_authors: ["implementation-author"], input_refs });
    return dispatch;
  }
  const sourceHashes = paths => paths.map(path => ({ path, sha256: sha(readFileSync(join(f.worktree, path))) }));
  const verifier = save("fix-verifier-dispatch.json", { ...identity, role: "finding-verifier", agent_thread_id: "fix-reader", context_mode: "none", implementation_authors: ["implementation-author"] });
  const fixed = save("independent-fix-verification.json", { ...identity, finding_id: "F1", original_review_ref: review, result: "pass",
    reader: { identity: "fix-reader", source_ref: verifier }, implementation: sourceHashes(["answer.mjs"]), refs: [actual], observed, expected: "42\n" });
  const publicText = JSON.stringify({ ...identity, agent_thread_id: "fix-reader", artifact_ref: fixed });
  const completionFinal = save("fix-public-final.json", { agent_thread_id: "fix-reader", public_text: publicText });
  const completionDelivery = save("fix-public-delivery.json", { agent_thread_id: "fix-reader", public_text: publicText });
  const completion = save("fix-public-bindings.json", { dispatch: verifier, final: completionFinal, delivery: completionDelivery });
  git(f.worktree, ["add", "."]); git(f.worktree, ["commit", "-qm", "repaired source and materials"]);
  const materialPaths = ["decision-log.md", "spec.md", "phases/index.md", "phases/P1.md"].map(path => `specs/${taskId}/${path}`);
  let report = save("unique-final-report.json", { ...identity, head: git(f.worktree, ["rev-parse", "HEAD"]), materials: sourceHashes(materialPaths),
    acceptance: [{ id: "AC-ONE", result: "incomplete", reason: "Generation-time fact before independent closure" }],
    six_conclusions: ["implemented", "criterion", "business", "semantic", "review", "independent closure"],
    continuation_request: { requested: false, reason: "No separate user continuation is requested" } });
  bindDispatch([report]);
  const raw = { ...identity, result: "pass", finding_verification_completions: [{ proof_ref: fixed, reader_identity: "fix-reader", source_ref: completion }],
    provider_raw_refs, final_report: report, materials: sourceHashes(materialPaths), implementation: sourceHashes(["answer.mjs", "answer.test.mjs"]),
    acceptance: [{ id: "AC-ONE", result: "pass", refs: [verdict], current_applicability: { basis: "Current controlled command proves the same behavior", refs: [actual] } }],
    business_effect: { result: "pass", refs: [actual], covered_ac_ids: ["AC-ONE"], proofs: [{ receipt: local(businessRun.receipt_ref), output: local(businessRun.output_ref), inputs: sourceHashes(["answer.mjs"]) }], coverage_limits: ["one controlled command"] },
    semantic_test_adequacy: { result: "pass", refs: [verdict], covered_ac_ids: ["AC-ONE"], proofs: [{ receipt: local(semanticRun.receipt_ref), output: local(semanticRun.output_ref), inputs: sourceHashes(["answer.mjs"]), test_sources: sourceHashes(["answer.test.mjs"]) }], coverage_limits: ["one assertion"] },
    review, finding_dispositions: [{ finding_id: "F1", original_review_ref: review, status: "fixed", fix_refs: [actual], verification_refs: [fixed], affected_paths: ["answer.mjs"], coverage_limits: [] }], boundary_checks: {} };
  function publish(value = raw) {
    const text = JSON.stringify(value), raw_ref = save("independent-raw.json", text);
    const final = save("public-final.json", { agent_thread_id: "fresh-reader", public_text: text });
    const delivery = save("public-delivery.json", { agent_thread_id: "fresh-reader", public_text: text });
    const source_ref = save("public-bindings.json", { dispatch, final, delivery });
    return save("assessment-provenance.json", { ...identity, raw_ref, reader: { identity: "fresh-reader", source_ref } });
  }
  function run(ref) {
    const input = save("record-input.json", { terminal_assessment_ref: ref });
    return status(f, ["run", "--action=execute", "--stage=build-code", "--project=workflowhub", `--task=${taskId}`, `--task-path=${f.task.taskPath}`, `--input=${join(f.task.taskPath, input.ref)}`]);
  }
  return { f, raw, publish, run, save, review };
}

async function acceptedRiskFixture() {
  const x = await terminalFixture();
  const reviewValue = JSON.parse(readFileSync(join(x.f.task.taskPath, x.review.ref), "utf8"));
  const pause = deriveSeriousReviewPause({ taskId, stage: "build-code", reviewRef: x.review.ref, result: reviewValue });
  mkdirSync(join(x.f.task.taskPath, "quality/evidence/human-confirmations"), { recursive: true });
  const replyText = "I accept the owned risk for F1.";
  const replyOriginal = x.save("human-confirmations/2026-11-23-002-closeout-decisions.json", {
    stage: "build-code", decision: "approved", reply: `User decision: ${replyText}`,
    scope: [], material_refs: [], head: "a".repeat(40), created_at: "2026-11-23T18:55:00.000Z",
  });
  const acceptance = {
    ...buildRiskAcceptance({ pause, findingId: "F1", selectedOption: "accept-risk",
      replyRef: replyOriginal.ref, reply: replyText, acceptedAt: "2026-11-23T18:55:00.000Z" }),
    authorized_risk_finding_ids: ["F1"],
  };
  x.raw.finding_dispositions = [{ finding_id: "F1", original_review_ref: x.review, status: "accepted_risk",
    original_fact: "Owned before repair returns 0 instead of 42", source: "review",
    consequence: "Incorrect delivery", next_action: "Accept the owned risk",
    affected_paths: ["answer.mjs"], coverage_limits: [] }];
  x.raw.risk_acceptances = [acceptance];
  return { x, acceptance };
}

describe("ORACLE-TERMINAL-EVIDENCE validator and real terminal consumer", () => {
  it("accepts canonical quality/reviews and quality/tests evidence references", () => {
    for (const ref of ["quality/reviews/current.json", "quality/tests/current.output"]) {
      expect(() => validateAcceptanceEvidence({
        schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-ONE", result: "pass",
        refs: [{ ref, sha256: "a".repeat(64) }],
      }), `${ref} is an existing terminal evidence prefix`).not.toThrow();
    }
  });

  it("rejects an empty evidence list instead of allowing the terminal verdict to pass", async () => {
    const x = await terminalFixture();
    x.raw.acceptance[0].refs = [x.save("invalid-empty-acceptance-evidence.json", {
      task_id: taskId, stage: "build-code", schema_version: "acceptance-evidence.v1",
      acceptance_criterion_id: "AC-ONE", result: "pass", refs: [],
    })];
    const published = x.publish();
    expect(x.run(published).ok).toBe(true);
    const result = status(x.f);
    expect(result.ok).toBe(true);
    expect(result.value.quality_status, "empty acceptance-evidence.v1 refs must remain incomplete").toBe("incomplete");
  });

  it("rejects a quality/evidence original with result/refs but no self-declared schema_version", async () => {
    const x = await terminalFixture();
    x.raw.acceptance[0].refs = [x.save("invalid-no-schema-acceptance.json", {
      task_id: taskId, stage: "build-code", acceptance_criterion_id: "AC-ONE", result: "pass", refs: [],
    })];
    const published = x.publish();
    expect(x.run(published).ok).toBe(true);
    const result = status(x.f);
    expect(result.ok).toBe(true);
    expect(result.value.quality_status, "a result/refs original without schema_version must not bypass validation").toBe("incomplete");
  });

  it("rejects a legacy AC-shaped original with result/refs but an empty refs list", async () => {
    const x = await terminalFixture();
    x.raw.acceptance[0].refs = [x.save("ac-bad-shape-no-marker.json", {
      id: "AC-ONE", result: "pass", refs: [],
    })];
    const published = x.publish();
    expect(x.run(published).ok).toBe(true);
    const result = status(x.f);
    expect(result.ok).toBe(true);
    expect(result.value.quality_status, "an AC-shaped original without schema_version must not bypass validation").toBe("incomplete");
  });

  // Historical lineage: this skip was removed on 2026-11-23 when the user
  // decided to add the accepted_risk binding field. It is kept verbatim only as
  // history, not as an executable skip:
  //   it.skip("fail: the public terminal contract has no accepted_risk binding field, so a valid risk acceptance cannot be driven without inventing one", () => {
  //     // terminalAssessmentQuality now calls deriveSeriousReviewPause/validateRiskAcceptance
  //     // when a.risk_acceptances, a.authorized_risk_finding_ids and a.user_reply exist,
  //     // but the public terminal contract names none of them. This is a standard defect
  //     // (owner: review/contract owner), not an environment-unavailable fact.
  //     // AC-EVID-001 is recorded as fail until the contract defines the binding.
  //   });
  it("accepts a risk acceptance bound to the current review and the real user original", async () => {
    const { x } = await acceptedRiskFixture();
    const published = x.publish();
    expect(x.run(published).ok).toBe(true);
    const result = status(x.f);
    expect(result.ok, JSON.stringify(result.value?.quality?.terminal_assessment?.gaps)).toBe(true);
    expect(result.value.quality_status, "a bound accepted_risk is a real terminal acceptance").toBe("pass");
  });

  it("rejects forged, wrong-finding, empty or unbound risk acceptances", async () => {
    const variants = {
      forged: (a) => ({ ...a, reply: "Forged risk acceptance not in the user original" }),
      "wrong finding": (a) => ({ ...a, finding_id: "F2" }),
      "empty reply": (a) => ({ ...a, reply: "   " }),
      "missing reply_ref": (a) => ({ ...a, reply_ref: undefined }),
    };
    for (const [name, mutate] of Object.entries(variants)) {
      const { x, acceptance } = await acceptedRiskFixture();
      x.raw.risk_acceptances = [mutate(structuredClone(acceptance))];
      const published = x.publish();
      expect(x.run(published).ok, name).toBe(true);
      const result = status(x.f);
      expect(result.ok, name).toBe(true);
      expect(result.value.quality_status, name).toBe("incomplete");
    }
  }, 30000);
});
