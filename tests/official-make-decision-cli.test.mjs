import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../core/task-handle.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { captureGitWorktreeSnapshot } from "../core/git-worktree-snapshot.mjs";
import { writeFormalReviewFixture } from "./helpers/formal-review.mjs";
import { createTrustedSignatureProof } from "../core/human-confirmation.mjs";

const roots = [];
const runtime = new URL("../bin/workflowhub", import.meta.url).pathname;
let confirmationSequence = 0;
const CONFIRMATION_KEY = "official-make-decision-confirmation-key-v1";
function confirmationPayload(task, stage, attemptRef) {
  confirmationSequence += 1; const boundRef=`results/${stage}/${attemptRef}`; const proofRef=`evidence/authentication/official-${confirmationSequence}.json`; const proofRaw=`${JSON.stringify({schema_version:"test-signature-proof.v1",sequence:confirmationSequence})}\n`; createTaskKernel(task).publishCanonicalRecord(proofRef,proofRaw); const now=new Date().toISOString();
  const envelope={schema_id:"https://workflowhub.dev/schemas/human-confirmation-envelope.v1.schema.json",schema_version:"1.0.0",purpose:"stage",task_id:task.identity.taskId,bound_ref:boundRef,bound_hash:createHash("sha256").update(task.readRecord(boundRef)).digest("hex"),actor:{id:"official-human",type:"human"},source_event:{ref:`source-events/official-${confirmationSequence}.json`,sha256:createHash("sha256").update(`event-${confirmationSequence}`).digest("hex"),occurred_at:now},authentication:{method:"signature",verified_at:now,proof_ref:proofRef,proof_hash:"0".repeat(64)},decision:"accepted",confirmed_at:now};
  envelope.authentication.signature=createTrustedSignatureProof(CONFIRMATION_KEY,envelope);return envelope;
}
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function linkedWorktrees(repo) {
  return String(execFileSync("git", ["worktree", "list", "--porcelain"], { cwd: repo, encoding: "utf8" }))
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => realpathSync(line.slice("worktree ".length)))
    .filter((path) => path !== realpathSync(repo));
}

function stdinArgs(args) {
  const index = args.findIndex((item) => item.startsWith("--input=") && item !== "--input=@-");
  if (index < 0) return { args };
  const payload = JSON.parse(readFileSync(args[index].slice("--input=".length), "utf8"));
  const input = JSON.stringify({ schema_id: "https://workflowhub.dev/schemas/cli-input.v1.schema.json", schema_version: "1.0.0", command: "stage", input_source: "@-", payload: { stage_payload: payload } });
  const next = [...args]; next[index] = "--input=@-";
  return { args: next, input };
}

describe("official make-decision CLI", () => {
  it("binds canonical decision receipt ref and exact byte hash into facts", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-decision-cli-"))); roots.push(root);
    mkdirSync(join(root, ".config", "workflowhub"), { recursive: true }); writeFileSync(join(root, ".config", "workflowhub", "config.json"), `${JSON.stringify({ confirmation_signing_key: CONFIRMATION_KEY })}\n`);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
    const head = String(execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo })).trim();
    const taskPath = join(root, "Projects", "Demo", "tasks", "decision-task");
    const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "decision-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
    const decisionPayload = join(root, "decision.json"); writeFileSync(decisionPayload, `${JSON.stringify({ content: "go" })}\n`);
    const snapshotTree = String(execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: repo })).trim();
    const direction = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree, reviewTrack: "direction" });
    const detail = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree, reviewTrack: "detail" });
    const input = join(root, "input.json"); writeFileSync(input, `${JSON.stringify({ receipts: { decision: "receipts/decision.json", direction_review: direction.resultRef, detail_review: detail.resultRef } })}\n`);
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const invoke = (args) => {
      const action = args[0]; const options = Object.fromEntries(args.slice(1).map((item) => { const split=item.indexOf("="); return [item.slice(2,split),item.slice(split+1)]; }));
      let admitted = stdinArgs(args); if(action==="confirm"&&!admitted.input){const payload=confirmationPayload(task,options.stage,options.attempt);admitted={args:[...args,"--input=@-"],input:JSON.stringify({schema_id:"https://workflowhub.dev/schemas/cli-input.v1.schema.json",schema_version:"1.0.0",command:"stage",input_source:"@-",payload:{stage_payload:payload}})};} const envelope=JSON.parse(execFileSync(process.execPath, [runtime, "stage", ...admitted.args], { cwd: repo, env, encoding: "utf8", input: admitted.input }));
      if (action === "prepare") return JSON.stringify({ worktree_root: `${repo}-${options.task}`, baseline_commit: execFileSync("git", ["rev-parse","HEAD"], { cwd:repo,encoding:"utf8" }).trim() });
      if (action === "receipt") { const raw=task.readRecord(envelope.result_ref); return JSON.stringify({ receipt_ref:envelope.result_ref,receipt_hash:createHash("sha256").update(raw).digest("hex") }); }
      if (action === "run") return JSON.stringify({ attempt_ref:envelope.result_ref.split("/").at(-1),attempt:JSON.parse(task.readRecord(`results/${options.stage}/${envelope.result_ref.split("/").at(-1)}`)) });
      if (action === "confirm") return JSON.stringify({ ref:envelope.result_ref });
      return task.readRecord(`results/${options.stage}/accepted.json`);
    };
    expect(linkedWorktrees(repo)).toEqual([]);
    const decision = JSON.parse(invoke(["receipt", "--stage=make-decision", "--project=Demo", "--task=decision-task", "--component=decision", `--input=${decisionPayload}`]));
    expect(decision.receipt_ref).toBe("receipts/decision.json");
    expect(linkedWorktrees(repo)).toEqual([]);
    const badInput = spawnSync(process.execPath, [runtime, "run", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--input=${join(root, "missing.json")}`], { cwd: repo, env, encoding: "utf8" });
    expect(badInput.status).not.toBe(0);
    expect(badInput.stderr).toMatch(/input=@-|requires|not accepted/i);
    expect(linkedWorktrees(repo)).toEqual([]);
    const decisionRaw = task.readRecord(decision.receipt_ref);
    const result = JSON.parse(invoke(["run", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--input=${input}`]));
    const worktree = realpathSync(`${repo}-decision-task`);
    const publishedDecision = JSON.parse(task.readRecord(result.attempt.facts.result_ref));
    expect(publishedDecision.facts ?? publishedDecision).toMatchObject({
      decision_ref: "receipts/decision.json", decision_hash: createHash("sha256").update(decisionRaw).digest("hex"),
      worktree_root: worktree, baseline_commit: head,
    });
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    expect(() => task.readRecord("results/make-decision/accepted.json")).toThrow();
    const configPath=join(root,".config","workflowhub","config.json"),forged=confirmationPayload(task,"make-decision",result.attempt_ref);forged.authentication.signature=createHash("sha256").update(task.readRecord(forged.authentication.proof_ref)).digest("hex");writeFileSync(configPath,`${JSON.stringify({confirmation_verifier:"task-proof-sha256"})}\n`);const forgedInput=JSON.stringify({schema_id:"https://workflowhub.dev/schemas/cli-input.v1.schema.json",schema_version:"1.0.0",command:"stage",input_source:"@-",payload:{stage_payload:forged}});const denied=spawnSync(process.execPath,[runtime,"stage","confirm","--stage=make-decision","--project=Demo","--task=decision-task",`--attempt=${result.attempt_ref}`,"--input=@-"],{cwd:repo,env,encoding:"utf8",input:forgedInput});expect(denied.status).not.toBe(0);expect(`${denied.stdout}\n${denied.stderr}`).toMatch(/AUTHORIZATION_FAILED|authentication/i);writeFileSync(configPath,`${JSON.stringify({confirmation_signing_key:CONFIRMATION_KEY})}\n`);
    const specPayload = join(root, "spec.json"); writeFileSync(specPayload, `${JSON.stringify({ content: "# Spec\n" })}\n`);
    const beforeAccept = spawnSync(process.execPath, [runtime, "stage", "receipt", "--stage=build-spec", "--project=Demo", "--task=decision-task", "--component=spec", "--input=@-"], { cwd: repo, env, encoding: "utf8", input: JSON.stringify({schema_id:"https://workflowhub.dev/schemas/cli-input.v1.schema.json",schema_version:"1.0.0",command:"stage",input_source:"@-",payload:{stage_payload:JSON.parse(readFileSync(specPayload,"utf8"))}}) });
    expect(beforeAccept.status).not.toBe(0);
    expect(beforeAccept.stderr).toMatch(/INTEGRITY_INVALID/i);
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    execFileSync("git", ["commit", "--allow-empty", "-qm", "unrelated main advance"], { cwd: repo });
    const confirmation = JSON.parse(invoke(["confirm", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--attempt=${result.attempt_ref}`, "--decision=accepted"]));
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    const dirty = join(worktree, "unexpected.txt"); writeFileSync(dirty, "dirty");
    const blocked = spawnSync(process.execPath, [runtime, "stage", "accept", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`], { cwd: repo, env, encoding: "utf8" });
    expect(blocked.status).not.toBe(0); expect(blocked.stderr).toMatch(/AUTHORIZATION_STALE/i);
    unlinkSync(dirty);
    expect(JSON.parse(invoke(["accept", "--stage=make-decision", "--project=Demo", "--task=decision-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`]))).toMatchObject({ stage: "make-decision" });
    expect(linkedWorktrees(repo)).toEqual([worktree]);
    expect(JSON.parse(invoke(["receipt", "--stage=build-spec", "--project=Demo", "--task=decision-task", "--component=spec", `--input=${specPayload}`]))).toMatchObject({ receipt_ref: "receipts/spec.json" });
  });

  it("binds full grill-with-docs writes to the published candidate snapshot", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-decision-grill-"))); roots.push(root);
    mkdirSync(join(root, ".config", "workflowhub"), { recursive: true }); writeFileSync(join(root, ".config", "workflowhub", "config.json"), `${JSON.stringify({ confirmation_signing_key: CONFIRMATION_KEY })}\n`);
    const repo = join(root, "repo"); mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
    execFileSync("git", ["commit", "--allow-empty", "-qm", "base"], { cwd: repo });
    const taskPath = join(root, "Projects", "Demo", "tasks", "grill-task");
    const task = createTask({ storageRoot: root, taskPath, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "grill-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const invoke = (args) => {
      const action=args[0];const options=Object.fromEntries(args.slice(1).map((item)=>{const split=item.indexOf("=");return[item.slice(2,split),item.slice(split+1)];}));let admitted=stdinArgs(args);
      if(action==="confirm"&&!admitted.input){const payload=confirmationPayload(task,options.stage,options.attempt);admitted={args:[...args,"--input=@-"],input:JSON.stringify({schema_id:"https://workflowhub.dev/schemas/cli-input.v1.schema.json",schema_version:"1.0.0",command:"stage",input_source:"@-",payload:{stage_payload:payload}})};} const envelope=JSON.parse(execFileSync(process.execPath,[runtime,"stage",...admitted.args],{cwd:repo,env,encoding:"utf8",input:admitted.input}));
      if(action==="prepare")return JSON.stringify({worktree_root:`${repo}-${options.task}`,baseline_commit:execFileSync("git",["rev-parse","HEAD"],{cwd:repo,encoding:"utf8"}).trim()});
      if(action==="receipt")return JSON.stringify({receipt_ref:envelope.result_ref});
      if(action==="run")return JSON.stringify({attempt_ref:envelope.result_ref.split("/").at(-1),attempt:JSON.parse(task.readRecord(`results/${options.stage}/${envelope.result_ref.split("/").at(-1)}`))});
      if(action==="confirm")return JSON.stringify({ref:envelope.result_ref});
      return task.readRecord(`results/${options.stage}/accepted.json`);
    };
    const prepared = JSON.parse(invoke(["prepare", "--stage=make-decision", "--project=Demo", "--task=grill-task"]));
    const contextFile = join(prepared.worktree_root, "CONTEXT.md");
    writeFileSync(contextFile, "# Resolved domain language\n");
    const decisionPayload = join(root, "decision.json"); writeFileSync(decisionPayload, `${JSON.stringify({ content: "go" })}\n`);
    const decision = JSON.parse(invoke(["receipt", "--stage=make-decision", "--project=Demo", "--task=grill-task", "--component=decision", `--input=${decisionPayload}`]));
    const snapshotTree = captureGitWorktreeSnapshot(prepared.worktree_root).tree;
    const direction = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree, reviewTrack: "direction" });
    const detail = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree, reviewTrack: "detail" });
    const input = join(root, "input.json"); writeFileSync(input, `${JSON.stringify({ receipts: { decision: decision.receipt_ref, direction_review: direction.resultRef, detail_review: detail.resultRef } })}\n`);
    const result = JSON.parse(invoke(["run", "--stage=make-decision", "--project=Demo", "--task=grill-task", `--input=${input}`]));
    const publishedTree=(JSON.parse(task.readRecord(result.attempt.facts.result_ref)).snapshot_tree); expect(publishedTree).toMatch(/^[a-f0-9]{40}$/);
    writeFileSync(contextFile, "tampered after publication\n");
    const confirmation = JSON.parse(invoke(["confirm", "--stage=make-decision", "--project=Demo", "--task=grill-task", `--attempt=${result.attempt_ref}`, "--decision=accepted"]));
    const blocked = spawnSync(process.execPath, [runtime, "stage", "accept", "--stage=make-decision", "--project=Demo", "--task=grill-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`], { cwd: repo, env, encoding: "utf8" });
    expect(blocked.status).not.toBe(0);
    expect(blocked.stderr).toMatch(/AUTHORIZATION_STALE/i);
    writeFileSync(contextFile, "# Resolved domain language\n");
    expect(JSON.parse(invoke(["accept", "--stage=make-decision", "--project=Demo", "--task=grill-task", `--attempt=${result.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`]))).toMatchObject({ stage: "make-decision", schema_version: "1.0.0" });
    expect(task.readRecord(result.attempt.facts.result_ref)).toContain(publishedTree);
  });

  it("rejects removed caller-owned workspace arguments explicitly", () => {
    const result = spawnSync(process.execPath, [runtime, "stage", "run", "--stage=make-decision", "--project=Demo", "--task=decision-task", "--worktree-root=/tmp/legacy", "--baseline-commit=deadbeef", "--input=/tmp/input.json"], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/not accepted|forbidden/i);
  });
});
