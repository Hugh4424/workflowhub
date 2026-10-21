import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, linkSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTask } from "../../../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../../../runtime/task/workspace.mjs";

const cli = new URL("../wh-review-cli.mjs", import.meta.url);
const roots = [];
function git(cwd, args) { return String(execFileSync("git", args, { cwd, encoding: "utf8" })).trim(); }
let previousSinkRoot;
beforeEach(() => {
  previousSinkRoot = process.env.WORKFLOWHUB_REVIEW_SINK_ROOT;
  const sinkRoot = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-test-sink-")));
  roots.push(sinkRoot);
  process.env.WORKFLOWHUB_REVIEW_SINK_ROOT = sinkRoot;
});
afterEach(() => {
  if (previousSinkRoot === undefined) delete process.env.WORKFLOWHUB_REVIEW_SINK_ROOT;
  else process.env.WORKFLOWHUB_REVIEW_SINK_ROOT = previousSinkRoot;
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

// Current facade owns one explicit task-bound request/result; old bare hash sink and stage-fact publisher are retired (TCR-P4-TEST-DRIFT).
async function facadeTask(){
 const root=realpathSync(mkdtempSync(join(tmpdir(),"facade-current-")));roots.push(root);const repo=join(root,"repo");mkdirSync(repo);
 const task=await createTask({storageRoot:root,manifest:{schema_version:"1.0.0",project_name:"workflowhub",task_id:randomUUID(),created_at:"2026-10-20T00:00:00Z",target_repo_root:repo,activation_cohort:"post",record_model:"vnext-single-write",execution_mode:"per_invocation",issue_ids:[],inputs:{}}});writeFileSync(join(task.taskPath,"facts.jsonl"),"");return{root,task};
}
const currentRequest=(f,extra={})=>({taskDir:f.task.taskPath,stage:"verify-code",subject_kind:"worktree",materials:{changed_files:"README.md",implementation_assessment:"Owned code",test_context:"Owned test",open_risks:"Controlled fixture"},...extra});
const currentOutcome=(extra={})=>({status:"unavailable",outcome:"unavailable",dispatch_state:"unknown",provider_results:[],findings:[],...extra});
const currentMember=(provider="owned/model",extra={})=>({provider,status:"completed",identity:{provider,adapter:"owned",source_id:provider+"-source",config_id:provider+"-config",model:"owned-model"},error:null,...extra});
async function facadeRecord(f,runRound,extra={}){const {runReviewRecovery}=await import(cli.href);const ref=await runReviewRecovery(currentRequest(f,extra),{runRound});return{ref,value:JSON.parse(f.task.readRecord(ref.result_ref)),bytes:f.task.readRecordBytes(ref.result_ref)};}
function noStageFacts(f){expect(f.task.readRecord("facts.jsonl")).toBe("");}

describe("wh-review production CLI", () => {
  it("does not expose the retired task-bound E2E route", async () => {
    const mod = await import(cli.href);
    expect(mod.runTaskBoundE2eReview).toBeUndefined();
  });

  it("can be imported from a stdin/eval entrypoint without argv[1]", () => {
    const script = `import(${JSON.stringify(cli.href)}).then((mod) => { if (typeof mod.runReviewRound !== "function") process.exit(1); })`;
    expect(() => execFileSync(process.execPath, ["--input-type=module", "--eval", script], { encoding: "utf8" })).not.toThrow();
  });

  it("rejects a non-object request with a clear boundary error", async () => {
    const { runReviewRound } = await import(cli.href);
    await expect(runReviewRound(null)).rejects.toThrow("review request must be an object");
  });

  it("validates current materials before task lookup or historical review reuse", async () => {
    const { runReviewRound } = await import(cli.href);
    await expect(runReviewRound({
      task_path: "/missing/task",
      project_name: "Demo",
      task_id: "task",
      stage: "make-decision",
      host_provider: "codex",
    })).rejects.toThrow("materials are required");
  });

  it("exports only current review operations and no resolution writer", async () => {
    const mod = await import(cli.href);
    expect(typeof mod.verifyFinalReview).toBe("function");
    expect(mod.providerVisibleMaterialsForRound).toBeUndefined();
    expect(mod.adoptLegacyReviewRoot).toBeUndefined();
    expect(mod.reviewFlowIdentity).toBeUndefined();
    expect(mod.resolveReviewFlowHead).toBeUndefined();
    expect(mod.reconcileMakeDecisionReviewProgress).toBeUndefined();
    expect(mod.buildNonGateReviewResponseRecord).toBeUndefined();
    expect(mod.ensureResolutionFlowHead).toBeUndefined();
    expect(typeof mod.runReviewRound).toBe("function");
    expect(typeof mod.runReviewRecovery).toBe("function");
  });

  it("binds one explicit verify-code result to its current task without publishing a stage fact",async()=>{const f=await facadeTask();let calls=0;const {ref,value}=await facadeRecord(f,async()=>{calls++;return currentOutcome({status:"available",outcome:"completed",dispatch_state:"dispatched",provider_results:[currentMember()]});});expect(calls).toBe(1);expect(ref.result_ref).toMatch(/^quality\/reviews\//);expect(value).toMatchObject({task_id:f.task.identity.taskId,stage:"verify-code",review_kind:null,review_scope:null,subject_kind:"worktree",phase_id:null,authoritative:false,status:"available"});noStageFacts(f);});

  it("keeps unavailable results honest and rejects retired kinds before dispatch",async()=>{const f=await facadeTask(),{runReviewRecovery}=await import(cli.href);let calls=0;const {value}=await facadeRecord(f,async()=>{calls++;return currentOutcome({error:{code:"AUTH",message:"owned provider unavailable"},provider_results:[currentMember("failed/model",{status:"failed",error:{code:"AUTH",message:"owned failure"},output:"original failure"})]});});expect(calls).toBe(1);expect(value).toMatchObject({status:"unavailable",authoritative:false,error:{code:"AUTH"},provider_results:[{status:"failed",error:{code:"AUTH"}}]});expect(readFileSync(value.provider_results[0].output_ref,"utf8")).toBe("original failure");for(const review_kind of ["mini_task.design","mini_task.implementation"])await expect(runReviewRecovery(currentRequest(f,{stage:"build-code",review_scope:"phase",phase_id:"P1",review_kind}),{runRound:async()=>{calls++;}})).rejects.toThrow(/unknown review_kind/);expect(calls).toBe(1);noStageFacts(f);});

  it("rejects wrong current tuples without treating unavailable results as stage success",async()=>{const f=await facadeTask(),{runReviewRecovery}=await import(cli.href);let calls=0;for(const extra of [{review_scope:"phase"},{review_kind:"mini_task.implementation"},{review_kind:"unknown.kind"}])await expect(runReviewRecovery(currentRequest(f,extra),{runRound:async()=>{calls++;}})).rejects.toThrow(/review_scope|unknown review_kind/);expect(calls).toBe(0);const {value}=await facadeRecord(f,async()=>currentOutcome({error:{code:"AUTH",message:"unavailable"}}));expect(value.status).toBe("unavailable");expect(value).not.toHaveProperty("passed");noStageFacts(f);});

  it("ignores retired response-ledger and round inputs", async () => {
    const { runSimpleReview } = await import(new URL("../simple-review-runner.mjs", import.meta.url));
    for (const [field, value] of [
      ["previous_result_ref", "quality/reviews/results/old.json"],
      ["review_round", "incremental"],
      ["review_delta", {}],
      ["request_id", "old-request"],
      ["prior_attempt_refs", []],
      ["dispatch_sequence", 1],
    ]) {
      const result = await runSimpleReview({
        stage: "build-code",
        host_provider: "codex",
        materials: { raw: "current" },
        [field]: value,
      }, {
        loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: (() => { const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-retired-"))); roots.push(root); return root; })(), command: ["unused"] }),
        resolveRoute: () => ({ initial: ["other"], mode: "single_round" }),
        selectProviders: () => ({ providers: ["other"], provider_models: { other: "other-model" } }),
        client: {
          async runGroup() {
            return { runtimeId: "r1", outcome: "completed", providers: [{ provider: "other", status: "completed", identity: { provider: "other", adapter: "other", model: "other-model" }, error: null, output: JSON.stringify({ findings: [] }), timing: null, usage: null }] };
          },
        },
      });
      expect(result.status).toBe("available");
      expect(result.findings).toHaveLength(0);
      expect(result).not.toHaveProperty("error_code");
    }
    const ledgerResult = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      materials: { raw: "current", response_ledger: {} },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: (() => { const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-ledger-"))); roots.push(root); return root; })(), command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["other"], provider_models: { other: "other-model" } }),
      client: {
        async runGroup() {
          return { runtimeId: "r2", outcome: "completed", providers: [{ provider: "other", status: "completed", identity: { provider: "other", adapter: "other", model: "other-model" }, error: null, output: JSON.stringify({ findings: [] }), timing: null, usage: null }] };
        },
      },
    });
    expect(ledgerResult.status).toBe("available");
  });

  it("uses simple review path and no retired review-flow control plane", () => {
    const source = readFileSync(cli, "utf8");
    expect(source).toContain("return runSimpleReview(input,options)");
    expect(source).toContain("return recordSimpleReviewRequest({taskDir:");
    expect(source).toContain("runSimpleReview");
    expect(source).toContain("runReviewRound");
    expect(source).not.toContain("recordMissingRouteUnavailable");
    for (const forbidden of [
      "qualityOnly",
      "withReviewFlowLock",
      "assertReviewFlowReady",
      "readReviewFlow",
      "advanceReviewFlow",
      "recordReviewAttempt",
      "adopt-legacy-root",
      "legacy_3rd_review",
      "buildNonGateReviewResponseRecord",
      "recordReviewResolution",
      "writeReviewResolution",
      "closureFailureCount",
      "structuralFullAlreadyRecorded",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it("ignores caller-selected providers and derives review scope from the trusted identity", async () => {
    // card-03: caller provider/scope/commit fields are never read for provider
    // selection, scope or commit binding. This case used to pass for the wrong
    // reason -- runSimpleReview threw "host_provider is required" for every
    // field, and that message happened to match the old /provider/ pattern.
    // With the host input gone the real contract is asserted directly: the
    // fields are ignored (like the retired scope revision and runtime
    // continuation inputs below), and only review_scope is still validated
    // because it is part of the review identity.
    const { runReviewRound } = await import(cli.href);
    const ignored = ["providers", "provider_allowlist", "providerAllowlist", "path_filter", "paths", "base_commit", "candidate_commit", "commit_range", "diff", "workflow_run_id", "workflowRunId"];
    for (const field of ignored) {
      const forged = field === "providers" ? ["claude-code"] : "forged";
      const result = await runReviewRound({ [field]: forged, task_path: "/tmp/task", stage: "build-code", materials: { approved_spec: "spec.md" } });
      expect(result).toBeTypeOf("object");
      expect(JSON.stringify(result)).not.toContain(JSON.stringify(forged).replaceAll('"', ""));
    }
    for (const field of ["review_scope", "reviewScope"]) {
      await expect(runReviewRound({ [field]: "forged", task_path: "/tmp/task", stage: "build-code", materials: { approved_spec: "spec.md" } }))
        .rejects.toThrow(/review_scope/);
    }
    await expect(runReviewRound({ task_path: "/tmp/task", stage: "build-code" }))
      .rejects.toThrow(/materials are required/);
  });

  it("ignores the removed scope revision public input", async () => {
    const { runSimpleReview } = await import(new URL("../simple-review-runner.mjs", import.meta.url));
    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      materials: { raw: "x", scope_revision: {} },
    }, {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: (() => { const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-scope-"))); roots.push(root); return root; })(), command: ["unused"] }),
      resolveRoute: () => ({ initial: ["other"], mode: "single_round" }),
      selectProviders: () => ({ providers: ["other"], provider_models: { other: "other-model" } }),
      client: {
        async runGroup() {
          return { runtimeId: "r1", outcome: "completed", providers: [{ provider: "other", status: "completed", identity: { provider: "other", adapter: "other", model: "other-model" }, error: null, output: JSON.stringify({ findings: [] }), timing: null, usage: null }] };
        },
      },
    });
    expect(result.status).toBe("available");
    expect(result.findings).toHaveLength(0);
    expect(result).not.toHaveProperty("error_code");
  });

  it("ignores retired runtime continuation inputs", async () => {
    const { runSimpleReview } = await import(new URL("../simple-review-runner.mjs", import.meta.url));
    for (const field of ["previous_runtime_ids", "previousRuntimeIds"]) {
      const result = await runSimpleReview({
        stage: "build-code",
        host_provider: "codex",
        materials: { raw: "current" },
        [field]: { opencode: "old-runtime" },
      }, {
        loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: (() => { const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-runtime-"))); roots.push(root); return root; })(), command: ["unused"] }),
        resolveRoute: () => ({ initial: ["other"], mode: "single_round" }),
        selectProviders: () => ({ providers: ["other"], provider_models: { other: "other-model" } }),
        client: {
          async runGroup() {
            return { runtimeId: "r1", outcome: "completed", providers: [{ provider: "other", status: "completed", identity: { provider: "other", adapter: "other", model: "other-model" }, error: null, output: JSON.stringify({ findings: [] }), timing: null, usage: null }] };
          },
        },
      });
      expect(result.status).toBe("available");
      expect(result.findings).toHaveLength(0);
      expect(result).not.toHaveProperty("error_code");
    }
  });

  it("blocks malformed build-prd recovery identity before runRound and sink writes", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const sinkRoot = process.env.WORKFLOWHUB_REVIEW_SINK_ROOT;
    const calls = [];
    const runRound = async () => { calls.push(true); return { status: "available" }; };
    for (const request of [
      { stage: "build-code", review_kind: "build_prd", host_provider: "codex", materials: { prd: "forged" } },
      { stage: "build-code", reviewKind: "build_prd", host_provider: "codex", materials: { prd: "camel forged" } },
      { stage: "build-prd", host_provider: "codex", materials: { prd: "missing sentinel" } },
      { stage: "build-prd", review_kind: "build_prd", reviewKind: "mini_task.design", host_provider: "codex", materials: { prd: "alias conflict" } },
      { stage: "not-a-formal-stage", host_provider: "codex", materials: { prd: "arbitrary stage" } },
      { stage: "build-code", review_kind: "arbitrary.kind", host_provider: "codex", materials: { prd: "arbitrary kind" } },
      { stage: "build-code", review_kind: "mini_task.design", reviewKind: "mini_task.implementation", host_provider: "codex", materials: { prd: "formal alias conflict" } },
    ]) {
      await expect(runReviewRecovery(request, { runRound })).rejects.toThrow(/build_prd|build-prd|identity aliases|unknown review_kind|unknown (?:recovery )?review stage/i);
    }
    expect(calls).toHaveLength(0);
    expect(readdirSync(sinkRoot)).toHaveLength(0);
  });

  it("makes one broker request and preserves terminal provider unavailability", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const calls = [];
    const result = await runReviewRecovery({
      task_path: "/tmp/task",
      stage: "build-code",
      materials: { frozen_packet: "packet-1" },
      snapshot_tree: "tree-1",
      material_id: "material-1",
    }, {
      runRound: async (input) => {
        calls.push(input);
        return { status: "unavailable", attempt_ref: `quality/reviews/attempts/a-${calls.length}.json`, error_code: "AUTH", snapshot_tree: "tree-1", material_id: "material-1" };
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].snapshot_tree).toBe("tree-1");
    expect(calls.some((input) => input.previous_result_ref || input.prior_attempt_refs || input.dispatch_sequence)).toBe(false);
    expect(result).toMatchObject({ status: "unavailable", error_code: "AUTH" });
  });

  it("preserves available-with-failures and both provider originals after one request",async()=>{const f=await facadeTask();let calls=0;const claim={provider:"healthy/model",severity:"major",path:"README.md",line:1,issue:"Owned defect",recommendation:"Repair",root_cause:"Owned cause",evidence_kind:"direct",evidence:"Owned line"};const members=[currentMember("healthy/model",{output:"healthy original"}),currentMember("failed/model",{status:"failed",error:{code:"AUTH",message:"owned unavailable"},output:"failed original"})];const {value}=await facadeRecord(f,async()=>{calls++;return currentOutcome({status:"available-with-failures",outcome:"partial",dispatch_state:"dispatched",provider_results:members,findings:[claim]});});expect(calls).toBe(1);expect(value).toMatchObject({status:"available-with-failures",authoritative:false,findings:[claim]});expect(value.provider_results.map(x=>x.status)).toEqual(["completed","failed"]);expect(value.provider_results[1].error.code).toBe("AUTH");expect(value.provider_results.map(x=>readFileSync(x.output_ref,"utf8"))).toEqual(["healthy original","failed original"]);noStageFacts(f);});

  it("records a task-bound throwing round as unavailable and rejects missing/retired identity before a round",async()=>{const f=await facadeTask(),{runReviewRecovery}=await import(cli.href);let calls=0;const {value}=await facadeRecord(f,async()=>{calls++;throw Object.assign(new Error("broker process died"),{code:"PROCESS_DEAD"});});expect(calls).toBe(1);expect(value).toMatchObject({status:"unavailable",authoritative:false,error:{code:"PROCESS_DEAD",message:"broker process died"}});for(const input of [{},{stage:"build-spec"},{stage:"build-code",review_scope:"integration"}])await expect(runReviewRecovery(input,{runRound:async()=>{calls++;}})).rejects.toThrow(/stage|integration/);expect(calls).toBe(1);noStageFacts(f);});

  it("serializes explicit concurrent task requests and preserves every immutable original",async()=>{const f=await facadeTask();let calls=0;const trace=[];const run=async()=>{const n=++calls;trace.push(`start${n}`);await new Promise(r=>setTimeout(r,15));trace.push(`end${n}`);return currentOutcome({error:{code:"AUTH",message:`owned ${n}`}});};const [a,b]=await Promise.all([facadeRecord(f,run),facadeRecord(f,run)]);expect(calls).toBe(2);expect(trace).toEqual(["start1","end1","start2","end2"]);expect(a.ref.result_ref).not.toBe(b.ref.result_ref);expect(f.task.readRecordBytes(a.ref.result_ref)).toEqual(a.bytes);expect(a.value.authoritative).toBe(false);expect(b.value.authoritative).toBe(false);noStageFacts(f);});

  it("dispatches changed material as a distinct explicit request without reusing an old sink",async()=>{const f=await facadeTask();let calls=0;const seen=[];const run=async input=>{calls++;seen.push(input.materials.implementation_assessment);return currentOutcome();};const a=await facadeRecord(f,run),b=await facadeRecord(f,run,{materials:{...currentRequest(f).materials,implementation_assessment:"Changed actual material"}});expect(calls).toBe(2);expect(seen).toEqual(["Owned code","Changed actual material"]);expect(a.ref.result_ref).not.toBe(b.ref.result_ref);expect(f.task.readRecordBytes(a.ref.result_ref)).toEqual(a.bytes);});

  it("rejects current path aliases, hardlinked manifests and runner tuple mismatch without overwriting originals",async()=>{const f=await facadeTask(),{runReviewRecovery}=await import(cli.href);let calls=0;const a=await facadeRecord(f,async()=>currentOutcome());const alias=join(f.root,"task-alias");symlinkSync(f.task.taskPath,alias);await expect(runReviewRecovery(currentRequest(f,{taskDir:alias}),{runRound:async()=>{calls++;}})).rejects.toThrow();const hardlink=join(f.root,"manifest-link.json");linkSync(join(f.task.taskPath,"task.json"),hardlink);await expect(runReviewRecovery(currentRequest(f),{runRound:async()=>{calls++;}})).rejects.toThrow();rmSync(hardlink);expect(calls).toBe(0);await expect(facadeRecord(f,async()=>currentOutcome({stage:"build-code"}))).rejects.toMatchObject({code:"REVIEW_SUBJECT_MISMATCH"});expect(f.task.readRecordBytes(a.ref.result_ref)).toEqual(a.bytes);noStageFacts(f);});

  it("keeps distinct task requests and original records isolated without a snapshot cache gate",async()=>{const a=await facadeTask(),b=await facadeTask();let calls=0;const run=async()=>{calls++;return currentOutcome();};const first=await facadeRecord(a,run),second=await facadeRecord(b,run);expect(calls).toBe(2);expect(first.value.task_id).toBe(a.task.identity.taskId);expect(second.value.task_id).toBe(b.task.identity.taskId);expect(first.value.task_id).not.toBe(second.value.task_id);expect(first.ref.path).not.toBe(second.ref.path);expect(a.task.readRecordBytes(first.ref.result_ref)).toEqual(first.bytes);expect(b.task.readRecordBytes(second.ref.result_ref)).toEqual(second.bytes);});

  it("rejects retired integration before dispatch and preserves a current legal route-unavailable result",async()=>{const f=await facadeTask(),{runReviewRecovery}=await import(cli.href);let calls=0;await expect(runReviewRecovery(currentRequest(f,{stage:"build-code",review_scope:"integration"}),{runRound:async()=>{calls++;}})).rejects.toThrow(/integration review is retired/);expect(calls).toBe(0);const {value}=await facadeRecord(f,async()=>{calls++;return currentOutcome({error:{code:"ROUTE_UNAVAILABLE",message:"owned missing trusted route"},dispatch_state:"blocked_before_dispatch"});});expect(calls).toBe(1);expect(value).toMatchObject({task_id:f.task.identity.taskId,stage:"verify-code",review_kind:null,review_scope:null,status:"unavailable",dispatch_state:"blocked_before_dispatch",error:{code:"ROUTE_UNAVAILABLE"},authoritative:false});});

  it("propagates current record-storage failure and preserves already published originals",async()=>{const f=await facadeTask(),{runReviewRecovery}=await import(cli.href);const a=await facadeRecord(f,async()=>currentOutcome());const quality=join(f.task.taskPath,"quality"),old=join(f.root,"saved-quality");const {renameSync}=await import("node:fs");renameSync(quality,old);writeFileSync(quality,"not a directory");let calls=0;try{await expect(runReviewRecovery(currentRequest(f),{runRound:async()=>{calls++;return currentOutcome();}})).rejects.toThrow();expect(calls).toBe(0);}finally{rmSync(quality);renameSync(old,quality);}expect(f.task.readRecordBytes(a.ref.result_ref)).toEqual(a.bytes);noStageFacts(f);});

  it("propagates a bare local exception without forging a provider outage or a saved result",async()=>{const {runReviewRecovery}=await import(cli.href);let calls=0;const error=new TypeError("local input is invalid");await expect(runReviewRecovery({stage:"verify-code",materials:currentRequest({task:{taskPath:"unused"}}).materials},{runRound:async()=>{calls++;throw error;}})).rejects.toBe(error);expect(calls).toBe(1);});

  it("rejects the retired same-source fallback callback", async () => {
    const { runReviewRecovery } = await import(cli.href);
    await expect(runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => ({ status: "unavailable", attempt_ref: "attempt", error_code: "OUTPUT_INVALID", snapshot_tree: "tree-1", material_id: "material-1" }),
      sameSourceFallback: async () => ({ source: "same_source", independent_context: true, status: "incomplete" }),
    })).rejects.toThrow(/sameSourceFallback is retired/);
  });

  it("does not retry material failures or semantic findings", async () => {
    const { runReviewRecovery } = await import(cli.href);
    for (const envelope of [
      { status: "unavailable", attempt_ref: "material", error_code: "MATERIAL_INCOMPLETE", snapshot_tree: "tree-1", material_id: "material-1" },
      { status: "available", result_ref: "semantic", findings: [{ severity: "minor" }], snapshot_tree: "tree-1", material_id: "material-1" },
    ]) {
      const calls = [];
      const result = await runReviewRecovery({ task_path: "/tmp/task", stage: "build-code", reason: envelope.error_code ?? "semantic-findings", snapshot_tree: "tree-1", material_id: "material-1", subject: { ref: envelope.error_code ?? "semantic-findings" } }, {
        runRound: async () => { calls.push(true); return envelope; },
      });
      expect(calls).toHaveLength(1);
      expect(result).toMatchObject(envelope);
    }
  });

  it("preserves missing-route and provider identity failures after one call", async () => {
    const { runReviewRecovery } = await import(cli.href);
    const routeCalls = [];
    const routeResult = await runReviewRecovery({ stage: "build-code", reason: "missing-route", snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => { routeCalls.push(true); return { status: "unavailable", error_code: "REVIEW_ROUTE_UNAVAILABLE", snapshot_tree: "tree-1", material_id: "material-1" }; },
    });
    expect(routeCalls).toHaveLength(1);
    expect(routeResult).toMatchObject({ status: "unavailable", error_code: "REVIEW_ROUTE_UNAVAILABLE" });

    const identityCalls = [];
    const identityResult = await runReviewRecovery({ stage: "build-code", reason: "provider-identity", snapshot_tree: "tree-1", material_id: "material-1", subject: { ref: "provider-identity" } }, {
      runRound: async () => { identityCalls.push(true); return { status: "unavailable", error_code: "AUTH", attempt_ref: `attempt-${identityCalls.length}`, snapshot_tree: "tree-1" }; },
    });
    expect(identityCalls).toHaveLength(1);
    expect(identityResult).toMatchObject({ status: "unavailable", error_code: "AUTH" });
  });

  it("preserves output/protocol/profile failures without a second WorkflowHub retry", async () => {
    const { runReviewRecovery } = await import(cli.href);
    for (const error_code of ["PROTOCOL_INCOMPATIBLE", "PUBLIC_RESULT_INVALID", "PROFILE_MISMATCH", "OUTPUT_INVALID", "PROVIDER_OUTPUT_INVALID"]) {
      const calls = [];
      const result = await runReviewRecovery({ stage: "build-code", reason: error_code, snapshot_tree: "tree-1", material_id: "material-1", subject: { ref: error_code } }, {
        runRound: async () => {
          calls.push(true);
          return { status: "unavailable", attempt_ref: `attempt-${error_code}`, error_code, snapshot_tree: "tree-1", material_id: "material-1" };
        },
      });
      expect(calls).toHaveLength(1);
      expect(result).toMatchObject({ status: "unavailable", error_code });
    }

    const calls = [];
    const result = await runReviewRecovery({ stage: "build-code", reason: "cancelled", snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async () => {
        calls.push(true);
        return { status: "unavailable", attempt_ref: "cancelled", error_code: "CANCELLED", snapshot_tree: "tree-1", material_id: "material-1" };
      },
    });
    expect(calls).toHaveLength(1);
    expect(result).toMatchObject({ status: "unavailable", error_code: "CANCELLED" });
  });

  it("rejects a caller-provided same-source fallback", async () => {
    const { runReviewRecovery } = await import(cli.href);
    await expect(runReviewRecovery({ snapshot_tree: "tree-1", material_id: "material-1" }, {
      runRound: async ({ snapshot_tree, material_id }) => ({ status: "unavailable", error_code: "AUTH", attempt_ref: "attempt", snapshot_tree, material_id }),
      sameSourceFallback: async () => ({ status: "available", source: "heterologous", independent_context: true, snapshot_tree: "tree-2", material_id: "material-2", attempt_refs: ["forged"] }),
    })).rejects.toThrow(/sameSourceFallback is retired/);
  });

  it("opens only an existing make-decision Workspace and never prepares one", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-decision-"))); roots.push(root);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const taskPath = join(root, "Projects", "Demo", "tasks", "task");
    const task = await createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "task", created_at: "2026-07-19T00:00:00.000Z", target_repo_root: repo, activation_cohort:"post",record_model:"vnext-single-write",execution_mode:"per_invocation", issue_ids: [], inputs: {} } });
    // Workspace ownership is runtime/task/workspace.mjs, not the retired CLI subject/kernel facade.
    const before=git(repo,["worktree","list","--porcelain"]);
    await expect(openCurrentTaskWorkspace(task)).rejects.toThrow(/registered|ENOENT|validation failed/i);
    expect(git(repo,["worktree","list","--porcelain"])).toBe(before);
    const prepared=await prepareTaskWorkspace(task);const subject=await openCurrentTaskWorkspace(task);
    expect(subject.worktreeRoot).toBe(prepared.worktreeRoot);expect(subject.worktreeRoot).toBe(`${repo}-task`);
    expect(git(subject.worktreeRoot,["rev-parse","HEAD"])).toBe(git(repo,["rev-parse","HEAD"]));
    expect(git(repo,["worktree","list","--porcelain"]).split("\n").filter(line=>line.startsWith("worktree "))).toHaveLength(2);
  });

  it("returns unavailable when the run route is missing without writing task state", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-route-missing-"))); roots.push(root);
    const home = join(root, "home");
    mkdirSync(home, { recursive: true });
    const inputPath = join(root, "input.json");
    writeFileSync(inputPath, JSON.stringify({
      stage: "build-code",
      host_provider: "codex",
      materials: { raw: "fixture" },
    }));

    const child = spawnSync(process.execPath, [fileURLToPath(cli), "run", inputPath], {
      encoding: "utf8",
      env: { ...process.env, HOME: home },
    });
    expect(child.status).toBe(1);expect(child.stderr).toBe("");const result=JSON.parse(child.stdout);
    expect(result).toMatchObject({ status: "unavailable", error: { code: "ROUTE_UNAVAILABLE" } });
    expect(result.attempt_ref).toBeUndefined();
    expect(result).not.toHaveProperty("error_code");
  });

  it("uses the production run entry for the paired broker requests and preserves provider failure", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-cli-recovery-entry-"))); roots.push(root);
    const home = join(root, "home");
    const configDir = join(home, ".config", "workflowhub"); mkdirSync(configDir, { recursive: true });
    const packetRoot = join(root, "packets"); mkdirSync(packetRoot);
    const brokerConfig = join(root, "3rd-review.json");
    writeFileSync(brokerConfig, JSON.stringify({
      version: 4,
      tiers: [["kimi"]],
      providers: { kimi: { enabled: true, source_id: "fixture-kimi-source", model: "kimi-model" } },
      attachment_roots: [{ root: packetRoot, sources: [".wh-review-packets"] }],
    }));
    const brokerConfigId = createHash("sha256").update(JSON.stringify({
      id: "kimi", source_id: "fixture-kimi-source", model: "kimi-model", effort: null, thinking: null, deadline_ms: null,
    }), "utf8").digest("hex");
    const counter = join(root, "broker-count"); writeFileSync(counter, "0");
    const broker = join(root, "fake-broker.mjs");
    writeFileSync(broker, `import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
const requestPath = process.argv.find((value) => value.startsWith("--request="))?.slice("--request=".length);
const attachmentsPath = process.argv.find((value) => value.startsWith("--attachments="))?.slice("--attachments=".length);
if (!requestPath) process.exit(2);
const countPath = process.env.FAKE_REVIEW_COUNTER;
const count = Number(readFileSync(countPath, "utf8")) + 1;
writeFileSync(countPath, String(count));
const request = JSON.parse(readFileSync(requestPath, "utf8"));
const attachments = JSON.parse(readFileSync(attachmentsPath, "utf8"));
const trustedIdentity = {
    source_id: "fixture-kimi-source",
    config_id: createHash("sha256").update(JSON.stringify({
    id: "kimi",
    source_id: "fixture-kimi-source",
    model: "kimi-model",
    effort: null,
    thinking: null,
    deadline_ms: null,
  }), "utf8").digest("hex"),
};
const runtimeId = "fixture-runtime-" + count;
const requestId = process.argv.find((value) => value.startsWith("--request-id="))?.slice("--request-id=".length);
const error = { code: "AUTH", message: "fixture auth unavailable" };
const member = {
  adapter: "kimi", continuable: false, effort: null, error,
  material_id: attachments.bundle_id, model: "kimi-model", output: null, provider: "kimi",
  raw_output_ref: null, result_protocol: "workflowhub-result.v2",
  retry: { count: 0, progress_events: 0 }, runtime_id: runtimeId,
  session_file_path: null, session_id: null, status: "failed", thinking: null,
  timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
  unavailable_diagnostics: error, usage: null,
};
process.stdout.write(JSON.stringify({
  version: "workflowhub-run.v1", state: "terminal", request_id: requestId,
  runtime_id: runtimeId, material_id: attachments.bundle_id,
  group: {
    version: 4, host_provider: request.host_provider, outcome: "unavailable",
    providers: [member], round: 1, runtime_id: runtimeId, selected_tier: 0,
  },
}));
`);
    writeFileSync(join(configDir, "config.json"), JSON.stringify({
      third_review: { command: [process.execPath, broker], config: brokerConfig, attachment_root: packetRoot },
      wh_review: {
        version: 2,
        stages: { "make-decision": { direction: { initial: ["kimi"], mode: "single_round" } } },
      },
    }));
    const inputPath = join(root, "input.json");
    writeFileSync(inputPath, JSON.stringify({
      stage: "make-decision",
      review_track: "direction",
      host_provider: "codex",
      direction_selection: { current_selection: "fixture choice" },
      materials: {
        raw_requirement: "A bounded review recovery fixture.", objective_facts: "The task workspace and trusted route exist.",
        convergence_outline: "The fixture review converges on the configured direction.",
      },
    }));

    const child = spawnSync(process.execPath, [fileURLToPath(cli), "run", inputPath], {
      encoding: "utf8", env: { ...process.env, HOME: home, FAKE_REVIEW_COUNTER: counter },
    });
    expect(child.status).toBe(1);expect(child.stderr).toBe("");const result=JSON.parse(child.stdout);
    // make-decision direction is one logical paired review: red and blue
    // each issue one broker request and retain role provenance. The fixture
    // counter is intentionally a best-effort side effect because the two
    // child processes may update it concurrently.
    expect(Number(readFileSync(counter, "utf8"))).toBeGreaterThan(0);
    expect(result).toMatchObject({ status: "unavailable" });
    expect(result).not.toHaveProperty("error_code");
    expect(result).not.toHaveProperty("attempt_ref");
    expect(result.provider_results).toHaveLength(2);
    expect(result.provider_results).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: "kimi", role: "red", status: "failed", error: expect.objectContaining({ code: "AUTH" }) }),
      expect.objectContaining({ provider: "kimi", role: "blue", status: "failed", error: expect.objectContaining({ code: "AUTH" }) }),
    ]));
  });
});

it.each(["mini_task.design","mini_task.implementation"])("rejects retired %s before dispatch through the current CLI entry", async review_kind=>{
 const {runReviewRecovery}=await import(cli.href);let calls=0;
 await expect(runReviewRecovery({stage:"build-code",review_kind,review_scope:"phase",phase_id:"P4",materials:{}},{runRound:async()=>{calls++;return {status:"available",findings:[]};}})).rejects.toThrow(/unsupported|unknown|review.kind/i);
 expect(calls).toBe(0);
});
