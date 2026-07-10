import { afterEach, describe, expect, it } from "vitest";
import { chmodSync, existsSync, lstatSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { createArtifactReviewPackage } from "../artifact-review-package.mjs";

const runner = resolve("skills/wh-review/scripts/runners/claude-code-reviewer.mjs");
const roots = [];
const verdict = { verdict: "pass", findings: [], resolutionSummary: "ok", skillResults: [] };
const requiredSkills = ["plan-ceo-review", "review", "plan-design-review"];
const designContract = `<!-- wh-review-skills: {"required":["plan-ceo-review","review","plan-design-review"]} -->`;
const completeSkillResults = requiredSkills.map((skill) => ({
  skill,
  status: skill === "plan-design-review" ? "not_applicable" : "executed",
  evidence: `${skill} evidence`,
}));

function fixture(script, { state, contract = "C", artifact = false, materials = "MATERIAL SECRET" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "claude-runner-resilience-")); roots.push(root);
  const reviewsRoot = join(root, "reviews"), diff = join(root, "input.json"), output = join(root, "output.json"), stateDir = join(reviewsRoot, ".claude-review-state", "fixture");
  mkdirSync(stateDir, { recursive: true });
  let artifactPackage;
  if (artifact) {
    artifactPackage = createArtifactReviewPackage({ reviewsRoot, stage: "build-spec", reviewFlowId: "fixture", totalRound: 1, contract, materials });
    const artifact_manifest = { package_root: artifactPackage.packageRoot, manifest_path: artifactPackage.manifestPath, content_hash: artifactPackage.manifest.content_hash, entries: artifactPackage.manifest.entries };
    const entries = artifactPackage.manifest.entries.map(({ id, role, kind, bytes, lines, sha256, chunks }) => ({ id, role, kind, bytes, lines, sha256, chunks: chunks.map(({ sequence, bytes: b, lines: l, sha256: h }) => ({ sequence, bytes: b, lines: l, sha256: h })) }));
    const input_hash = createHash("sha256").update(JSON.stringify({ mode: "full", content_hash: artifactPackage.manifest.content_hash, entries })).digest("hex");
    writeFileSync(diff, JSON.stringify({ input_hash, mode: "full", artifact_manifest }));
  } else writeFileSync(diff, JSON.stringify({ input_hash: "fixed-hash", mode: "full", contract, materials: "M" }));
  if (state) writeFileSync(join(stateDir, "state.json"), JSON.stringify(state));
  const fake = join(root, "fake-claude.mjs"); writeFileSync(fake, `#!/usr/bin/env node\n${script}`); chmodSync(fake, 0o755);
  return { root, diff, output, stateDir, fake, artifactPackage };
}

function execute(f, env = {}, signalAfter) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [runner, `--diff=${f.diff}`, `--output=${f.output}`, `--state-dir=${f.stateDir}`], { env: { ...process.env, CLAUDE_CODE_BIN: f.fake, CLAUDE_CODE_REVIEW_IDLE_MS: "2000", CLAUDE_CODE_REVIEW_STOP_GRACE_MS: "20", ...env } });
    let stderr = ""; child.stderr.on("data", (x) => { stderr += x; });
    if (signalAfter) setTimeout(() => child.kill(signalAfter), 40);
    child.on("close", (code, signal) => resolvePromise({ code, signal, stderr, output: existsSync(f.output) ? JSON.parse(readFileSync(f.output, "utf8")) : null }));
  });
}

function executeWithExitingParent(f) {
  return new Promise((resolvePromise, rejectPromise) => {
    const launcher = join(f.root, "exiting-parent.mjs");
    writeFileSync(launcher, `import { spawn } from "node:child_process";const child=spawn(process.execPath,${JSON.stringify([runner])}.concat(process.argv.slice(2)),{env:process.env,stdio:"ignore"});setTimeout(()=>process.exit(child.pid?0:2),500);`);
    const child = spawn(process.execPath, [launcher, `--diff=${f.diff}`, `--output=${f.output}`, `--state-dir=${f.stateDir}`], { env: { ...process.env, CLAUDE_CODE_BIN: f.fake, CLAUDE_CODE_REVIEW_IDLE_MS: "10000", CLAUDE_CODE_REVIEW_STOP_GRACE_MS: "20", CLAUDE_CODE_REVIEW_PARENT_WATCH_MS: "20" } });
    child.on("error", rejectPromise);
    child.on("close", () => {
      const deadline = Date.now() + 4000;
      const poll = () => {
        if (existsSync(f.output)) return resolvePromise(JSON.parse(readFileSync(f.output, "utf8")));
        if (Date.now() >= deadline) return rejectPromise(new Error("runner did not classify parent exit"));
        setTimeout(poll, 20);
      };
      poll();
    });
  });
}

function makeRemovable(path) { let stat; try { stat = lstatSync(path); } catch { return; } if (!stat.isDirectory() || stat.isSymbolicLink()) { try { chmodSync(path, 0o644); } catch {} return; } chmodSync(path, 0o755); for (const name of readdirSync(path)) makeRemovable(join(path, name)); }
afterEach(() => { for (const root of roots.splice(0)) { makeRemovable(root); rmSync(root, { recursive: true, force: true }); } });

const fullReadEvents = `
const addDir=process.argv.indexOf("--add-dir");
const manifest=JSON.parse(readFileSync(join(process.cwd(),"manifest.json"),"utf8"));
for(const [i,e] of manifest.entries.entries())for(const c of e.chunks){const id="read-"+i+"-"+c.sequence,path=join(process.cwd(),c.path),source=readFileSync(path,"utf8"),lines=source===""?[]:source.replace(/\\n$/u,"").split("\\n").map(x=>x.replace(/\\r$/u,"")),content=lines.map((line,j)=>String(j+1)+"\\t"+line).join("\\n");console.log(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id,name:"Read",input:{file_path:path,offset:1,limit:Math.max(1,c.lines)}}]}}));console.log(JSON.stringify({type:"user",message:{role:"user",content:[{type:"tool_result",tool_use_id:id,content}]}}));}`;

describe("Claude streamed reviewer resilience", () => {
  it("does not resume again across restart after the lifetime budget was consumed", async () => {
    const f = fixture(`process.exit(91);`, { state: { input_hash: "fixed-hash", session_id: "s1", resume_count: 1, attempt: 2, attempt_id: "a2", phase: "attempt_settled", status: "failed" } });
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "1000" });
    expect(result.code).toBe(0); expect(result.output).toMatchObject({ failure_reason: "claude-code-resume-budget-exhausted", resume_count: 1 });
  });

  it("escalates INT/TERM to KILL and settles when the child ignores graceful signals", async () => {
    const f = fixture(`process.on("SIGINT",()=>{}); process.on("SIGTERM",()=>{}); console.log(JSON.stringify({type:"system",session_id:"s"})); setInterval(()=>{},1000);`, { state: { input_hash: "fixed-hash", session_id: "s", resume_count: 0, attempt: 0, status: "running" } });
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "1500" });
    expect(result.code).toBe(0); expect(result.output.failure_reason).toBe("claude-code-idle-after-resume");
    const journal = readFileSync(join(f.stateDir, "journal.ndjson"), "utf8"); expect(journal).toContain('"signal":"SIGKILL"');
  });

  it("forwards external SIGINT, reaps the child, and exits 130", async () => {
    const f = fixture(`process.on("SIGINT",()=>process.exit(0)); setInterval(()=>{},1000);`);
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "10000" }, "SIGINT");
    expect(result.code).toBe(130); expect(readFileSync(join(f.stateDir, "journal.ndjson"), "utf8")).toContain('"type":"runner_signal"');
  });

  it("classifies SIGHUP as host interruption without reserving resume", async () => {
    const f = fixture(`console.log(JSON.stringify({type:"system",session_id:"host-session"})); process.on("SIGINT",()=>process.exit(0)); setInterval(()=>{},1000);`);
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "10000" }, "SIGHUP");
    expect(result.code).toBe(129);
    expect(result.output).toMatchObject({ failure_reason: "host-interrupted", resume_count: 0, external_interruption: true });
    const state = JSON.parse(readFileSync(join(f.stateDir, "state.json"), "utf8"));
    expect(state).toMatchObject({ status: "interrupted", failure_reason: "host-interrupted", resume_count: 0, session_id: null });
  });

  it("restarts fresh after host interruption instead of consuming resume budget", async () => {
    const f = fixture(`if(process.argv.includes("--resume")) process.exit(72); console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}}));`, { state: { input_hash: "fixed-hash", session_id: null, resume_count: 0, attempt: 1, status: "interrupted", failure_reason: "host-interrupted" } });
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "pass", resume_count: 0, synthetic: false });
  });

  it("migrates a legacy in-flight SIGHUP state to a fresh host-interrupted attempt", async () => {
    const legacyState = { input_hash: "fixed-hash", session_id: "bba-legacy-session", resume_count: 0, attempt: 1, attempt_id: "fixed-hash-1", phase: "attempt_settled", status: "interrupted", signal: "SIGHUP", progress: { completed: 0, total: 0, last_semantic_at: null } };
    const f = fixture(`if(process.argv.includes("--resume")) process.exit(72); console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}}));`, { state: legacyState });
    writeFileSync(join(f.stateDir, "terminal-receipt.json"), JSON.stringify({ input_hash: "fixed-hash", execution_status: "running", verdict_hash: null, failure_reason: null, completed: 0, total: 0 }));
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "pass", resume_count: 0, synthetic: false, execution_status: "completed" });
    expect(JSON.parse(readFileSync(join(f.stateDir, "state.json"), "utf8"))).toMatchObject({ status: "completed", session_id: null, resume_count: 0, resume_reservation: null });
    expect(JSON.parse(readFileSync(join(f.stateDir, "terminal-receipt.json"), "utf8"))).toMatchObject({ execution_status: "completed" });
  });

  it("rolls back only a legacy SIGHUP attempt reservation and preserves historical resume usage", async () => {
    const f = fixture(`if(process.argv.includes("--resume")) process.exit(72); console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}}));`, { state: { input_hash: "fixed-hash", session_id: "legacy-resume-session", resume_count: 2, resume_reservation: { attempt: 4, previous_resume_count: 1 }, attempt: 4, attempt_id: "fixed-hash-4", phase: "resume_running", status: "interrupted", signal: "SIGHUP" } });
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "pass", resume_count: 1, synthetic: false });
    expect(JSON.parse(readFileSync(join(f.stateDir, "state.json"), "utf8"))).toMatchObject({ session_id: null, resume_count: 1, resume_reservation: null });
  });

  it("does not decrement historical usage or generalize legacy migration beyond SIGHUP", async () => {
    const historical = fixture(`if(process.argv.includes("--resume")) process.exit(72); console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}}));`, { state: { input_hash: "fixed-hash", session_id: "legacy-session", resume_count: 1, resume_reservation: null, attempt: 3, phase: "initial_running", status: "interrupted", signal: "SIGHUP" } });
    const recovered = await execute(historical);
    expect(recovered.output).toMatchObject({ verdict: "pass", resume_count: 1, synthetic: false });

    const sigterm = fixture(`process.exit(process.argv.includes("--resume") ? 73 : 74);`, { state: { input_hash: "fixed-hash", session_id: "sigterm-session", resume_count: 0, attempt: 1, phase: "initial_running", status: "interrupted", signal: "SIGTERM" } });
    const notMigrated = await execute(sigterm);
    expect(notMigrated.output).toMatchObject({ failure_reason: "claude-code-non-zero-exit", resume_count: 1, exit_status: 73 });
  });

  it("settles after a terminal event even when the child never closes voluntarily", async () => {
    const f = fixture(`process.on("SIGINT",()=>{}); process.on("SIGTERM",()=>{}); console.log(JSON.stringify({type:"result",session_id:"s",structured_output:${JSON.stringify(verdict)}})); setInterval(()=>{},1000);`);
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "10000" });
    expect(result.code).toBe(0); expect(result.output).toMatchObject({ verdict: "pass", execution_status: "completed" });
  });

  it("captures bounded redacted stderr diagnostics without renewing the idle lease", async () => {
    const f = fixture(`let n=0; const t=setInterval(()=>{process.stderr.write("secret-body"); if(++n===6){clearInterval(t); console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}}));}},300);`);
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "1000" });
    expect(result.output).toMatchObject({ synthetic: true, failure_reason: "claude-code-idle-without-session" });
    expect(result.output.stderr_summary).toMatchObject({ truncated: false });
    expect(result.output.stderr_summary.bytes).toBeGreaterThan(0);
    expect(result.output.stderr_summary.captured_bytes).toBe(result.output.stderr_summary.bytes);
    expect(result.output.stderr_summary).not.toHaveProperty("sha256");
    const serialized = `${readFileSync(join(f.stateDir, "journal.ndjson"), "utf8")}\n${readFileSync(join(f.stateDir, "state.json"), "utf8")}\n${JSON.stringify(result.output)}`;
    expect(serialized).not.toContain("secret-body");
  });

  it("bounds stderr diagnostics and exposes only allowlisted categories", async () => {
    const secret = "sk-ant-api03-THIS-MUST-NOT-LEAK";
    const f = fixture(`process.stderr.write("authentication_failed ${secret} "+"x".repeat(10000)); process.exit(23);`);
    const result = await execute(f, { CLAUDE_CODE_REVIEW_STDERR_MAX_BYTES: "256" });
    expect(result.output.stderr_summary).toMatchObject({ captured_bytes: 256, truncated: true, error_categories: ["authentication"] });
    expect(JSON.stringify(result.output)).not.toContain(secret);
    expect(Buffer.byteLength(JSON.stringify(result.output.stderr_summary))).toBeLessThan(512);
  });

  it("does not persist a dictionary-verifiable digest of low-entropy stderr secrets", async () => {
    const secret = "PIN=1234";
    const f = fixture(`process.stderr.write(${JSON.stringify(secret)}); process.exit(24);`);
    const result = await execute(f);
    const serialized = `${readFileSync(join(f.stateDir, "journal.ndjson"), "utf8")}\n${readFileSync(join(f.stateDir, "state.json"), "utf8")}\n${JSON.stringify(result.output)}`;
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain(createHash("sha256").update(secret).digest("hex"));
    expect(result.output.stderr_summary).toEqual({ bytes: Buffer.byteLength(secret), captured_bytes: Buffer.byteLength(secret), truncated: false });
  });

  it("records child start and first generic stream event timing", async () => {
    const f = fixture(`console.log(JSON.stringify({type:"assistant",message:{role:"assistant",content:[]}})); console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}}));`);
    const result = await execute(f);
    expect(result.output.verdict).toBe("pass");
    const state = JSON.parse(readFileSync(join(f.stateDir, "state.json"), "utf8"));
    expect(state.attempt_timing).toMatchObject({ first_event_type: "assistant" });
    expect(Date.parse(state.attempt_timing.first_event_at)).toBeGreaterThanOrEqual(Date.parse(state.attempt_timing.child_started_at));
    const journal = readFileSync(join(f.stateDir, "journal.ndjson"), "utf8");
    expect(journal).toContain('"type":"first_stream_event"');
  });

  it("classifies parent loss as host interruption", async () => {
    const f = fixture(`setInterval(()=>{},1000);`);
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "10000", CLAUDE_CODE_REVIEW_EXPECTED_PARENT_PID: "2147483647", CLAUDE_CODE_REVIEW_PARENT_WATCH_MS: "10" });
    expect(result.code).toBe(129);
    expect(result.output).toMatchObject({ failure_reason: "host-interrupted", interruption: "parent-lost", resume_count: 0 });
  });

  it("classifies parent identity change as host interruption", async () => {
    const f = fixture(`setInterval(()=>{},1000);`);
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "10000", CLAUDE_CODE_REVIEW_EXPECTED_PARENT_PID: String(process.ppid), CLAUDE_CODE_REVIEW_PARENT_WATCH_MS: "10" });
    expect(result.code).toBe(129);
    expect(result.output).toMatchObject({ failure_reason: "host-interrupted", interruption: "parent-changed", resume_count: 0 });
  });

  it("observes the real parent before classifying a runtime parent change", async () => {
    const f = fixture(`setInterval(()=>{},1000);`);
    const output = await executeWithExitingParent(f);
    expect(output).toMatchObject({ failure_reason: "host-interrupted", interruption: "parent-lost", resume_count: 0 });
    const journal = readFileSync(join(f.stateDir, "journal.ndjson"), "utf8");
    expect(journal).toContain('"type":"parent_watch_confirmed"');
    expect(journal).toContain('"interruption":"parent-lost"');
  });

  it("rolls back only the interrupted resume reservation and preserves a later recovery", async () => {
    const f = fixture(`setInterval(()=>{},1000);`, { state: { input_hash: "fixed-hash", session_id: "prior-session", resume_count: 0, attempt: 1, status: "running" } });
    const interrupted = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "10000" }, "SIGHUP");
    expect(interrupted.output).toMatchObject({ failure_reason: "host-interrupted", resume_count: 0 });
    expect(JSON.parse(readFileSync(join(f.stateDir, "state.json"), "utf8"))).toMatchObject({ resume_count: 0, resume_reservation: null, session_id: null });
    writeFileSync(f.fake, `#!/usr/bin/env node\nif(process.argv.includes("--resume")){console.log(JSON.stringify({type:"result",session_id:"fresh-session",structured_output:${JSON.stringify(verdict)}}));}else{console.log(JSON.stringify({type:"system",session_id:"fresh-session"}));setInterval(()=>{},1000);}`);
    chmodSync(f.fake, 0o755);
    const recovered = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "1000" });
    expect(recovered.output).toMatchObject({ verdict: "pass", resume_count: 1, synthetic: false });
  });

  it("does not decrement historical resume usage when a fresh attempt is host-interrupted", async () => {
    const f = fixture(`setInterval(()=>{},1000);`, { state: { input_hash: "fixed-hash", session_id: null, resume_count: 1, resume_reservation: null, attempt: 3, status: "interrupted", failure_reason: "host-interrupted" } });
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "10000" }, "SIGHUP");
    expect(result.output).toMatchObject({ failure_reason: "host-interrupted", resume_count: 1 });
    expect(JSON.parse(readFileSync(join(f.stateDir, "state.json"), "utf8"))).toMatchObject({ resume_count: 1, resume_reservation: null });
  });

  it("fails closed after an overflowed frame", async () => {
    const f = fixture(`process.stdout.write("x".repeat(1500)); setTimeout(()=>{process.stdout.write("\\n"+JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}})+"\\n")},10);`);
    const result = await execute(f, { CLAUDE_CODE_REVIEW_BUFFER_MAX_BYTES: "1024" });
    expect(result.output).toMatchObject({ synthetic: true, failure_reason: "claude-code-stream-frame-invalid" });
  });

  it("rejects mismatched persisted state and starts a fresh session", async () => {
    const f = fixture(`if(process.argv.includes("--resume")) process.exit(44); console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}}));`, { state: { input_hash: "other", session_id: "old", resume_count: 1, status: "failed" } });
    const result = await execute(f); expect(result.output.verdict).toBe("pass");
    expect(JSON.parse(readFileSync(join(f.stateDir, "state.json"), "utf8")).input_hash).toBe("fixed-hash");
  });

  it("replaces an old output only after a complete new failure artifact exists", async () => {
    const f = fixture(`process.exit(9);`); writeFileSync(f.output, JSON.stringify({ old: true }));
    const result = await execute(f); expect(result.output).toMatchObject({ execution_status: "failed", failure_reason: "claude-code-non-zero-exit" });
  });

  it.each([
    ["missing skillResults", undefined],
    ["missing one required skill", completeSkillResults.slice(0, 2)],
    ["duplicate required skill", [...completeSkillResults, completeSkillResults[0]]],
    ["unknown skill", [...completeSkillResults.slice(0, 2), { skill: "unknown-review", status: "executed", evidence: "x" }]],
    ["empty evidence", completeSkillResults.map((item, index) => index === 0 ? { ...item, evidence: "   " } : item)],
  ])("rejects pass verdict with %s", async (_label, skillResults) => {
    const candidate = { verdict: "pass", findings: [], resolutionSummary: "invalid" };
    if (skillResults !== undefined) candidate.skillResults = skillResults;
    const f = fixture(`console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(candidate)}}));`, { contract: designContract });
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "escalate_to_human", failure_reason: "claude-code-output-unparseable", synthetic: true });
  });

  it.each(["pass", "revise_required"])("accepts plan-design-review not_applicable with evidence for %s", async (candidateVerdict) => {
    const candidate = { verdict: candidateVerdict, findings: [], resolutionSummary: "complete", skillResults: completeSkillResults };
    const f = fixture(`console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(candidate)}}));`, { contract: designContract });
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: candidateVerdict, skillResults: completeSkillResults, synthetic: false });
  });

  it.each([
    ["pass", "failed"],
    ["pass", "unavailable"],
    ["revise_required", "failed"],
    ["revise_required", "unavailable"],
  ])("rejects %s when a required skill is %s", async (candidateVerdict, status) => {
    const skillResults = completeSkillResults.map((item) => item.skill === "review" ? { ...item, status } : item);
    const candidate = { verdict: candidateVerdict, findings: [], resolutionSummary: "invalid dependency status", skillResults };
    const f = fixture(`console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(candidate)}}));`, { contract: designContract });
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "escalate_to_human", failure_reason: "claude-code-output-unparseable", synthetic: true });
  });

  it.each(["plan-ceo-review", "review"])("rejects pass when %s is not_applicable", async (skill) => {
    const skillResults = completeSkillResults.map((item) => item.skill === skill ? { ...item, status: "not_applicable" } : item);
    const candidate = { verdict: "pass", findings: [], resolutionSummary: "invalid not_applicable", skillResults };
    const f = fixture(`console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(candidate)}}));`, { contract: designContract });
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "escalate_to_human", failure_reason: "claude-code-output-unparseable", synthetic: true });
  });

  it("rejects revise_required when manifest coverage is incomplete", async () => {
    const candidate = { verdict: "revise_required", findings: [], resolutionSummary: "incomplete", skillResults: completeSkillResults.slice(0, 2) };
    const f = fixture(`console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(candidate)}}));`, { contract: designContract });
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "escalate_to_human", failure_reason: "claude-code-output-unparseable", synthetic: true });
  });

  it("allows an incomplete but well-formed skill subset only for semantic escalation", async () => {
    const candidate = { verdict: "escalate_to_human", findings: [], resolutionSummary: "dependency prevented remaining lenses", skillResults: [completeSkillResults[0]] };
    const f = fixture(`console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(candidate)}}));`, { contract: designContract });
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "escalate_to_human", skillResults: [completeSkillResults[0]], execution_status: "completed", synthetic: false });
  });

  it.each(["failed", "unavailable"])("allows required skill status %s only for semantic escalation", async (status) => {
    const skillResults = completeSkillResults.map((item) => item.skill === "review" ? { ...item, status } : item);
    const candidate = { verdict: "escalate_to_human", findings: [], resolutionSummary: "dependency failure", skillResults };
    const f = fixture(`console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(candidate)}}));`, { contract: designContract });
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "escalate_to_human", skillResults, execution_status: "completed", synthetic: false });
  });

  it("uses a small manifest prompt and a scoped Read permission", async () => {
    const script = `
import {readFileSync} from "node:fs"; import {join} from "node:path";
const input=readFileSync(0,"utf8");
const allowed=process.argv[process.argv.indexOf("--allowedTools")+1]||"";
if(process.argv.includes("--add-dir") || process.argv[process.argv.indexOf("--tools")+1]!=="Read" || !/^Read\\(\\/\\/[^)]+\\/\\*\\*\\)$/.test(allowed) || !allowed.includes(process.cwd().replace(/^\\//,"")) || process.argv.includes("--include-partial-messages") || input.includes("MATERIAL SECRET")) process.exit(31);
${fullReadEvents}
const artifactCoverage=manifest.entries.map(({id,sha256})=>({id,sha256,status:"read",evidence:"read full artifact"}));
console.log(JSON.stringify({type:"result",structured_output:{verdict:"pass",findings:[],resolutionSummary:"ok",skillResults:[],artifactCoverage}}));`;
    const f = fixture(script, { artifact: true });
    const result = await execute(f);
    expect(result.output, readFileSync(join(f.stateDir, "journal.ndjson"), "utf8")).toMatchObject({ verdict: "pass", execution_status: "completed", synthetic: false });
    expect(result.output.artifactCoverage.every(({ evidence }) => evidence.startsWith("host-attested Read read"))).toBe(true);
    expect(JSON.parse(readFileSync(join(f.stateDir, "state.json"), "utf8")).artifact_coverage).toBeUndefined();
    const journal = readFileSync(join(f.stateDir, "journal.ndjson"), "utf8");
    expect(journal).not.toContain("MATERIAL SECRET");
    expect(result.output.artifact_attestation.every(({ status }) => status === "read")).toBe(true);
  });

  it.each(["missing", "wrong hash", "failed status"])("rejects pass with %s artifact coverage", async (kind) => {
    const f = fixture("", { artifact: true });
    const coverage = f.artifactPackage.manifest.entries.map(({ id, sha256 }) => ({ id, sha256, status: "read", evidence: "read" }));
    if (kind === "missing") coverage.pop();
    if (kind === "wrong hash") coverage[0].sha256 = "0".repeat(64);
    if (kind === "failed status") coverage[0].status = "failed";
    writeFileSync(f.fake, `#!/usr/bin/env node\nimport {readFileSync} from "node:fs"; import {join} from "node:path"; ${fullReadEvents}\nconsole.log(JSON.stringify({type:"result",structured_output:${JSON.stringify({ verdict: "pass", findings: [], resolutionSummary: "invalid", skillResults: [], artifactCoverage: coverage })}}));`);
    const result = await execute(f);
    expect(result.output).toMatchObject({ failure_reason: "artifact-coverage-unattested", synthetic: true });
  });

  it("allows a well-formed failed subset only for semantic escalation", async () => {
    const f = fixture("", { artifact: true });
    const first = f.artifactPackage.manifest.entries[0];
    const candidate = { verdict: "escalate_to_human", findings: [], resolutionSummary: "read blocked", skillResults: [], artifactCoverage: [{ id: first.id, sha256: first.sha256, status: "failed", evidence: "Read tool failed" }] };
    writeFileSync(f.fake, `#!/usr/bin/env node\nimport {readFileSync} from "node:fs"; import {join} from "node:path"; const addDir=process.argv.indexOf("--add-dir"),manifest=JSON.parse(readFileSync(join(process.cwd(),"manifest.json"),"utf8")),e=manifest.entries[0],c=e.chunks[0],id="failed-read"; console.log(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id,name:"Read",input:{file_path:join(process.cwd(),c.path),offset:1,limit:Math.max(1,c.lines)}}]}})); console.log(JSON.stringify({type:"user",message:{role:"user",content:[{type:"tool_result",tool_use_id:id,is_error:true,content:"SECRET FAILURE"}]}})); console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(candidate)}}));`);
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "escalate_to_human", execution_status: "completed", synthetic: false });
  });

  it("fails closed if an artifact changes after package creation", async () => {
    const f = fixture("process.exit(99);", { artifact: true });
    chmodSync(join(f.artifactPackage.packageRoot, "materials.md"), 0o644); writeFileSync(join(f.artifactPackage.packageRoot, "materials.md"), "tampered"); chmodSync(join(f.artifactPackage.packageRoot, "materials.md"), 0o444);
    const result = await execute(f);
    expect(result.output).toMatchObject({ failure_reason: "artifact-package-tampered", synthetic: true, execution_status: "failed" });
  });

  it("post-verifies package bytes after attested reads and before accepting verdict", async () => {
    const f = fixture("", { artifact: true });
    const coverage = f.artifactPackage.manifest.entries.map(({ id, sha256 }) => ({ id, sha256, status: "read", evidence: "read" }));
    writeFileSync(f.fake, `#!/usr/bin/env node\nimport {chmodSync,readFileSync,writeFileSync} from "node:fs"; import {join} from "node:path"; ${fullReadEvents} const target=join(process.cwd(),"materials.md");chmodSync(target,0o644);writeFileSync(target,"changed after read");chmodSync(target,0o444);console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify({ verdict: "pass", findings: [], resolutionSummary: "forged", skillResults: [], artifactCoverage: coverage })}}));`);
    const result = await execute(f);
    expect(result.output).toMatchObject({ failure_reason: "artifact-package-tampered", synthetic: true });
  });

  it("rejects forged model coverage when no full Read events exist", async () => {
    const f = fixture("", { artifact: true, materials: "one\ntwo\nthree\n" });
    const coverage = f.artifactPackage.manifest.entries.map(({ id, sha256 }) => ({ id, sha256, status: "read", evidence: "claimed" }));
    writeFileSync(f.fake, `#!/usr/bin/env node\nconsole.log(JSON.stringify({type:"result",structured_output:${JSON.stringify({ verdict: "pass", findings: [], resolutionSummary: "forged", skillResults: [], artifactCoverage: coverage })}}));`);
    const result = await execute(f);
    expect(result.output).toMatchObject({ failure_reason: "artifact-coverage-unattested", synthetic: true });
  });

  it("does not trust persisted coverage across a resumed runner process", async () => {
    const f = fixture("", { artifact: true });
    const payload = JSON.parse(readFileSync(f.diff, "utf8"));
    writeFileSync(join(f.stateDir, "state.json"), JSON.stringify({ input_hash: payload.input_hash, session_id: "resume-safe", resume_count: 0, attempt: 1, status: "running", artifact_coverage: { forged: { ranges: [[1, 999999]] } }, artifact_manifest_hash: f.artifactPackage.manifest.content_hash }));
    const artifactCoverage = f.artifactPackage.manifest.entries.map(({ id, sha256 }) => ({ id, sha256, status: "read", evidence: "resume" }));
    writeFileSync(f.fake, `#!/usr/bin/env node\nif(!process.argv.includes("--resume"))process.exit(2);console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify({ verdict: "pass", findings: [], resolutionSummary: "resumed", skillResults: [], artifactCoverage })}}));`);
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "escalate_to_human", failure_reason: "artifact-coverage-unattested", synthetic: true, resume_count: 1 });
  });

  it("rejects a caller-supplied artifact input hash mismatch before spawn", async () => {
    const f = fixture("process.exit(99);", { artifact: true });
    const payload = JSON.parse(readFileSync(f.diff, "utf8")); payload.input_hash = "0".repeat(64); writeFileSync(f.diff, JSON.stringify(payload));
    const result = await execute(f);
    expect(result.output).toMatchObject({ failure_reason: "artifact-input-hash-mismatch", synthetic: true, execution_status: "failed" });
  });

  it("accepts only a leading-whitespace system reminder after exact chunk content", async () => {
    const f = fixture("", { artifact: true });
    const artifactCoverage = f.artifactPackage.manifest.entries.map(({ id, sha256 }) => ({ id, sha256, status: "read", evidence: "read" }));
    writeFileSync(f.fake, `#!/usr/bin/env node\nimport {readFileSync} from "node:fs";import {join} from "node:path";${fullReadEvents.replace('content}]}}));}', 'content:content+"\\n   <system-reminder>safe metadata</system-reminder>"}]}}));}')}console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify({ verdict: "pass", findings: [], resolutionSummary: "reminder", skillResults: [], artifactCoverage })}}));`);
    const result = await execute(f); expect(result.output).toMatchObject({ verdict: "pass", synthetic: false });
  });

  it.each([["complete", false, "pass"], ["truncated", true, "escalate_to_human"]])("uses actual returned characters for a long single line: %s", async (_label, truncate, expectedVerdict) => {
    const f = fixture("", { artifact: true, materials: "x".repeat(5000) });
    const artifactCoverage = f.artifactPackage.manifest.entries.map(({ id, sha256 }) => ({ id, sha256, status: "read", evidence: "actual chars" }));
    writeFileSync(f.fake, `#!/usr/bin/env node\nimport {readFileSync} from "node:fs";import {join} from "node:path";const a=process.argv.indexOf("--add-dir"),m=JSON.parse(readFileSync(join(process.cwd(),"manifest.json"),"utf8"));for(const [i,e] of m.entries.entries())for(const c of e.chunks){const id="default-"+i+"-"+c.sequence,path=join(process.cwd(),c.path),source=readFileSync(path,"utf8"),line=source.replace(/\\n$/u,""),bad=e.id==="materials"&&c.sequence===1&&${truncate};console.log(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id,name:"Read",input:{file_path:path}}]}}));console.log(JSON.stringify({type:"user",message:{role:"user",content:[{type:"tool_result",tool_use_id:id,content:"1\\t"+(bad?line.slice(0,Math.max(1,line.length-1)):line)}]}}));}console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify({ verdict: "pass", findings: [], resolutionSummary: "long", skillResults: [], artifactCoverage })}}));`);
    const result = await execute(f);
    expect(result.output.verdict).toBe(expectedVerdict);
    if (truncate) expect(result.output).toMatchObject({ failure_reason: "artifact-coverage-unattested", synthetic: true });
    else expect(result.output).toMatchObject({ execution_status: "completed", synthetic: false });
  });

  it("rejects partial Read ranges and unknown stream event variants", async () => {
    const f = fixture("", { artifact: true, materials: "one\ntwo\nthree\n" });
    const coverage = f.artifactPackage.manifest.entries.map(({ id, sha256 }) => ({ id, sha256, status: "read", evidence: "claimed" }));
    writeFileSync(f.fake, `#!/usr/bin/env node\nimport {readFileSync} from "node:fs";import {join} from "node:path";const a=process.argv.indexOf("--add-dir"),m=JSON.parse(readFileSync(join(process.cwd(),"manifest.json"),"utf8"));for(const [i,e] of m.entries.entries())for(const c of e.chunks){const id="r"+i+"-"+c.sequence,limit=e.id==="materials"?2:Math.max(1,c.lines),path=join(process.cwd(),c.path),source=readFileSync(path,"utf8"),lines=source.replace(/\\n$/u,"").split("\\n").slice(0,limit),content=lines.map((line,j)=>String(j+1)+"\\t"+line).join("\\n");console.log(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id,name:"Read",input:{file_path:path,offset:1,limit}}]}}));console.log(JSON.stringify({type:"user",message:{role:"user",content:[{type:"tool_result",tool_use_id:id,content}]}}));}console.log(JSON.stringify({type:"tool_use",id:"unknown",name:"Read",input:{file_path:join(process.cwd(),"materials.md"),offset:3,limit:1}}));console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify({ verdict: "pass", findings: [], resolutionSummary: "partial", skillResults: [], artifactCoverage: coverage })}}));`);
    const result = await execute(f);
    expect(result.output).toMatchObject({ failure_reason: "artifact-coverage-unattested", synthetic: true });
  });

  it("retains bounded terminal diagnostics without journaling the error body", async () => {
    const f = fixture(`console.log(JSON.stringify({type:"result",subtype:"error_during_execution",is_error:true,error_code:"prompt_too_long",stop_reason:"error",result:"Prompt is too long token=secret-value"})); process.exit(1);`);
    const result = await execute(f);
    expect(result.output).toMatchObject({ error_category: "prompt_too_long", terminal_subtype: "error_during_execution", stop_reason: "error" });
    expect(JSON.stringify(result.output)).not.toContain("secret-value");
    expect(readFileSync(join(f.stateDir, "journal.ndjson"), "utf8")).not.toContain("secret-value");
  });

  it("fails immediately on a Read outside the manifest boundary", async () => {
    const f = fixture(`console.log(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id:"escape",name:"Read",input:{file_path:"/etc/hosts"}}]}}));setInterval(()=>{},1000);`, { artifact: true });
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "10000" });
    expect(result.output).toMatchObject({ synthetic: true, failure_reason: "artifact-read-boundary-violation" });
    expect(readFileSync(join(f.stateDir, "journal.ndjson"), "utf8")).not.toContain("/etc/hosts");
  });

  it("fails before spawn when contract required skills do not match packaged skill entries", async () => {
    const marker = join(mkdtempSync(join(tmpdir(), "skill-mismatch-marker-")), "spawned");
    const f = fixture(`import {writeFileSync} from "node:fs";writeFileSync(${JSON.stringify(marker)},"spawned");`, { artifact: true, contract: designContract });
    const result = await execute(f);
    expect(result.output).toMatchObject({ synthetic: true, failure_reason: "required-skill-manifest-mismatch" });
    expect(existsSync(marker)).toBe(false);
  });

  it("stores exact session id only in 0600 state, not journal/output/receipt", async () => {
    const session = "session-secret-123";
    const f = fixture(`console.log(JSON.stringify({type:"system",session_id:${JSON.stringify(session)}}));console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}}));`);
    const result = await execute(f);
    expect(result.output.session_id).toBeUndefined();
    const statePath = join(f.stateDir, "state.json"), journalPath = join(f.stateDir, "journal.ndjson"), receiptPath = join(f.stateDir, "terminal-receipt.json");
    expect(readFileSync(statePath, "utf8")).toContain(session);
    expect(readFileSync(journalPath, "utf8")).not.toContain(session);
    expect(readFileSync(receiptPath, "utf8")).not.toContain(session);
    expect(statSync(statePath).mode & 0o777).toBe(0o600);
    expect(statSync(journalPath).mode & 0o777).toBe(0o600);
    expect(statSync(receiptPath).mode & 0o777).toBe(0o600);
  });

  it("accepts repeated events from the same Claude session", async () => {
    const session = "same-session-123";
    const f = fixture(`console.log(JSON.stringify({type:"system",session_id:${JSON.stringify(session)}}));console.log(JSON.stringify({type:"result",session_id:${JSON.stringify(session)},structured_output:${JSON.stringify(verdict)}}));`);
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "pass", execution_status: "completed", synthetic: false });
  });

  it("fails closed when one attempt emits a different Claude session", async () => {
    const accepted = "accepted-session-secret", rejected = "rejected-session-secret";
    const f = fixture(`console.log(JSON.stringify({type:"system",session_id:${JSON.stringify(accepted)}}));console.log(JSON.stringify({type:"result",session_id:${JSON.stringify(rejected)},structured_output:${JSON.stringify(verdict)}}));`);
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "escalate_to_human", failure_reason: "claude-code-session-mismatch", synthetic: true });
    const state = readFileSync(join(f.stateDir, "state.json"), "utf8"), journal = readFileSync(join(f.stateDir, "journal.ndjson"), "utf8"), receipt = readFileSync(join(f.stateDir, "terminal-receipt.json"), "utf8");
    expect(state).toContain(accepted);
    expect(state).not.toContain(rejected);
    expect(journal).not.toContain(accepted);
    expect(journal).not.toContain(rejected);
    expect(receipt).not.toContain(accepted);
    expect(receipt).not.toContain(rejected);
  });

  it("fails fast on Windows without spawning Claude", async () => {
    const marker = join(mkdtempSync(join(tmpdir(), "claude-win-marker-")), "spawned");
    const f = fixture(`import {writeFileSync} from "node:fs";writeFileSync(${JSON.stringify(marker)},"spawned");`);
    const result = await execute(f, { WH_REVIEW_TEST_PLATFORM: "win32" });
    expect(result.output).toMatchObject({ synthetic: true, failure_reason: "claude-artifact-review-unsupported-platform" });
    expect(existsSync(marker)).toBe(false);
  });

  it("rejects a live owner lock and reclaims a dead owner lock", async () => {
    const live = fixture(`setInterval(()=>{},1000);`);
    const first = spawn(process.execPath, [runner, `--diff=${live.diff}`, `--output=${live.output}`, `--state-dir=${live.stateDir}`], { env: { ...process.env, CLAUDE_CODE_BIN: live.fake, CLAUDE_CODE_REVIEW_IDLE_MS: "10000", CLAUDE_CODE_REVIEW_STOP_GRACE_MS: "20" } });
    for (let i = 0; i < 50 && !existsSync(join(live.stateDir, "owner.lock")); i += 1) await new Promise((r) => setTimeout(r, 10));
    const contender = { ...live, output: join(live.root, "contender.json") };
    const denied = await execute(contender, { CLAUDE_CODE_REVIEW_IDLE_MS: "10000" });
    expect(denied.output).toMatchObject({ failure_reason: "review-already-running" });
    first.kill("SIGTERM"); await new Promise((resolveClose) => first.once("close", resolveClose));

    const dead = fixture(`console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}}));`);
    writeFileSync(join(dead.stateDir, "owner.lock"), JSON.stringify({ pid: 999999, start: "dead", token: "dead" }), { mode: 0o600 });
    const recovered = await execute(dead);
    expect(recovered.output).toMatchObject({ verdict: "pass", synthetic: false });
    expect(existsSync(join(dead.stateDir, "owner.lock"))).toBe(false);
  });

  it("allows only one contender to reclaim a stale owner lock", async () => {
    const marker = join(mkdtempSync(join(tmpdir(), "claude-lock-race-marker-")), "spawned");
    const f = fixture(`import {writeFileSync} from "node:fs";writeFileSync(${JSON.stringify(marker)},String(process.pid),{flag:"wx"});setTimeout(()=>console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}})),150);`);
    writeFileSync(join(f.stateDir, "owner.lock"), JSON.stringify({ pid: 999999, start: "dead", token: "dead" }), { mode: 0o600 });
    const contenders = Array.from({ length: 6 }, (_, index) => ({ ...f, output: join(f.root, `contender-${index}.json`) }));
    const results = await Promise.all(contenders.map((contender) => execute(contender, { WH_REVIEW_TEST_STALE_RECLAIM_DELAY_MS: "100" })));
    expect(results.filter(({ output }) => output?.verdict === "pass")).toHaveLength(1);
    expect(results.filter(({ output }) => output?.failure_reason === "review-already-running")).toHaveLength(5);
    expect(readFileSync(marker, "utf8")).toMatch(/^\d+$/u);
    expect(JSON.parse(readFileSync(join(f.stateDir, "state.json"), "utf8"))).toMatchObject({ status: "completed" });
    expect(JSON.parse(readFileSync(join(f.stateDir, "terminal-receipt.json"), "utf8"))).toMatchObject({ execution_status: "completed" });
    expect(existsSync(join(f.stateDir, "owner.lock"))).toBe(false);
    expect(existsSync(join(f.stateDir, "owner.lock.reclaim"))).toBe(false);
  });

  it("preserves complete host coverage across same-process resume and requests only missing chunks", async () => {
    const marker = join(mkdtempSync(join(tmpdir(), "claude-resume-marker-")), "first");
    const script = `import {existsSync,readFileSync,writeFileSync} from "node:fs";import {join} from "node:path";
const addDir=process.argv.indexOf("--add-dir"),root=process.cwd(),manifest=JSON.parse(readFileSync(join(root,"manifest.json"),"utf8")),all=manifest.entries.flatMap((e)=>e.chunks.map((c)=>({e,c}))),emit=({e,c},n)=>{const id="r"+n,path=join(root,c.path),source=readFileSync(path,"utf8"),lines=source===""?[]:source.replace(/\\n$/u,"").split("\\n"),content=lines.map((line,j)=>String(j+1)+"\\t"+line).join("\\n");console.log(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id,name:"Read",input:{file_path:path,offset:1,limit:Math.max(1,c.lines)}}]}}));console.log(JSON.stringify({type:"user",message:{role:"user",content:[{type:"tool_result",tool_use_id:id,content}]}}));};
if(!existsSync(${JSON.stringify(marker)})){writeFileSync(${JSON.stringify(marker)},"1");console.log(JSON.stringify({type:"system",session_id:"same-process"}));emit(all[0],0);process.on("SIGINT",()=>process.exit(0));setInterval(()=>{},1000);}else{const input=readFileSync(0,"utf8");if(input.includes(all[0].c.path)||!all.slice(1).every(({c})=>input.includes(c.path)))process.exit(41);all.slice(1).forEach((x,i)=>emit(x,i+1));const artifactCoverage=manifest.entries.map(({id,sha256})=>({id,sha256,status:"read",evidence:"complete"}));console.log(JSON.stringify({type:"result",structured_output:{verdict:"pass",findings:[],resolutionSummary:"resumed missing only",skillResults:[],artifactCoverage}}));}`;
    const f = fixture(script, { artifact: true, materials: "line\n".repeat(20000) });
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "500" });
    expect(result.output).toMatchObject({ verdict: "pass", resume_count: 1, synthetic: false });
    expect(result.output.artifact_attestation.every(({ status }) => status === "read")).toBe(true);
  });

  it("accepts content-block tool results and split UTF-8 NDJSON", async () => {
    const script = `import {readFileSync} from "node:fs";import {join} from "node:path";const addDir=process.argv.indexOf("--add-dir"),manifest=JSON.parse(readFileSync(join(process.cwd(),"manifest.json"),"utf8"));for(const [i,e] of manifest.entries.entries())for(const c of e.chunks){const id="b"+i+"-"+c.sequence,path=join(process.cwd(),c.path),source=readFileSync(path,"utf8"),lines=source===""?[]:source.replace(/\\n$/u,"").split("\\n"),content=lines.map((line,j)=>String(j+1)+"\\t"+line).join("\\n");console.log(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id,name:"Read",input:{file_path:path,offset:1,limit:Math.max(1,c.lines)}}]}}));console.log(JSON.stringify({type:"user",message:{role:"user",content:[{type:"tool_result",tool_use_id:id,content:[{type:"text",text:content}]}]}}));}const artifactCoverage=manifest.entries.map(({id,sha256})=>({id,sha256,status:"read",evidence:"中文证据"})),line=JSON.stringify({type:"result",structured_output:{verdict:"pass",findings:[],resolutionSummary:"中文",skillResults:[],artifactCoverage}})+"\\n",bytes=Buffer.from(line),cut=bytes.indexOf(Buffer.from("中"))+1;process.stdout.write(bytes.subarray(0,cut));setTimeout(()=>process.stdout.write(bytes.subarray(cut)),10);`;
    const f = fixture(script, { artifact: true, materials: "中文材料\n" });
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "pass", synthetic: false });
  });

  it("replays sanitized golden NDJSON content-block and structured-output variants", async () => {
    const golden = resolve("skills/wh-review/scripts/__tests__/fixtures/claude-stream/read-content-blocks.ndjson");
    const script = `import {readFileSync} from "node:fs";import {join} from "node:path";const templates=readFileSync(process.env.GOLDEN_FIXTURE,"utf8").trim().split("\\n").map(JSON.parse),addDir=process.argv.indexOf("--add-dir"),root=process.cwd(),manifest=JSON.parse(readFileSync(join(root,"manifest.json"),"utf8"));for(const [i,e] of manifest.entries.entries())for(const c of e.chunks){const id="golden-"+i+"-"+c.sequence,path=join(root,c.path),source=readFileSync(path,"utf8"),lines=source===""?[]:source.replace(/\\n$/u,"").split("\\n"),content=lines.map((line,j)=>String(j+1)+"\\t"+line).join("\\n"),a=structuredClone(templates[0]),u=structuredClone(templates[1]);a.message.content[0].id=id;a.message.content[0].input.file_path=path;a.message.content[0].input.limit=Math.max(1,c.lines);u.message.content[0].tool_use_id=id;u.message.content[0].content[0].text=content;console.log(JSON.stringify(a));console.log(JSON.stringify(u));}const artifactCoverage=manifest.entries.map(({id,sha256})=>({id,sha256,status:"read",evidence:"golden"})),r=structuredClone(templates[2]);r.structured_output=JSON.stringify({verdict:"pass",findings:[],resolutionSummary:"golden",skillResults:[],artifactCoverage});console.log(JSON.stringify(r));`;
    const f = fixture(script, { artifact: true, materials: "golden material\n" });
    const result = await execute(f, { GOLDEN_FIXTURE: golden });
    expect(result.output).toMatchObject({ verdict: "pass", synthetic: false });
  });

  it("fails closed on a sanitized golden unknown content variant", async () => {
    const golden = resolve("skills/wh-review/scripts/__tests__/fixtures/claude-stream/unknown-content-block.ndjson");
    const f = fixture(`import {readFileSync} from "node:fs";process.stdout.write(readFileSync(process.env.GOLDEN_FIXTURE,"utf8"));console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}}));`, { artifact: true });
    const result = await execute(f, { GOLDEN_FIXTURE: golden });
    expect(result.output).toMatchObject({ synthetic: true, failure_reason: "artifact-coverage-unattested" });
  });
});
