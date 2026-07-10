import { afterEach, describe, expect, it } from "vitest";
import { chmodSync, existsSync, lstatSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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
    const input_hash = createHash("sha256").update(JSON.stringify({ mode: "full", artifact_manifest })).digest("hex");
    writeFileSync(diff, JSON.stringify({ input_hash, mode: "full", artifact_manifest }));
  } else writeFileSync(diff, JSON.stringify({ input_hash: "fixed-hash", mode: "full", contract, materials: "M" }));
  if (state) writeFileSync(join(stateDir, "state.json"), JSON.stringify(state));
  const fake = join(root, "fake-claude.mjs"); writeFileSync(fake, `#!/usr/bin/env node\n${script}`); chmodSync(fake, 0o755);
  return { root, diff, output, stateDir, fake, artifactPackage };
}

function execute(f, env = {}, signalAfter) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [runner, `--diff=${f.diff}`, `--output=${f.output}`, `--state-dir=${f.stateDir}`], { env: { ...process.env, CLAUDE_CODE_BIN: f.fake, CLAUDE_CODE_REVIEW_IDLE_MS: "1000", CLAUDE_CODE_REVIEW_STOP_GRACE_MS: "20", ...env } });
    let stderr = ""; child.stderr.on("data", (x) => { stderr += x; });
    if (signalAfter) setTimeout(() => child.kill(signalAfter), 40);
    child.on("close", (code, signal) => resolvePromise({ code, signal, stderr, output: existsSync(f.output) ? JSON.parse(readFileSync(f.output, "utf8")) : null }));
  });
}

function makeRemovable(path) { let stat; try { stat = lstatSync(path); } catch { return; } if (!stat.isDirectory() || stat.isSymbolicLink()) { try { chmodSync(path, 0o644); } catch {} return; } chmodSync(path, 0o755); for (const name of readdirSync(path)) makeRemovable(join(path, name)); }
afterEach(() => { for (const root of roots.splice(0)) { makeRemovable(root); rmSync(root, { recursive: true, force: true }); } });

const fullReadEvents = `
const addDir=process.argv.indexOf("--add-dir");
const manifest=JSON.parse(readFileSync(join(process.argv[addDir+1],"manifest.json"),"utf8"));
for(const [i,e] of manifest.entries.entries())for(const c of e.chunks){const id="read-"+i+"-"+c.sequence,path=join(process.argv[addDir+1],c.path),source=readFileSync(path,"utf8"),lines=source===""?[]:source.replace(/\\n$/u,"").split("\\n").map(x=>x.replace(/\\r$/u,"")),content=lines.map((line,j)=>String(j+1)+"\\t"+line).join("\\n");console.log(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id,name:"Read",input:{file_path:path,offset:1,limit:Math.max(1,c.lines)}}]}}));console.log(JSON.stringify({type:"user",message:{role:"user",content:[{type:"tool_result",tool_use_id:id,content}]}}));}`;

describe("Claude streamed reviewer resilience", () => {
  it("does not resume again across restart after the lifetime budget was consumed", async () => {
    const f = fixture(`process.exit(91);`, { state: { input_hash: "fixed-hash", session_id: "s1", resume_count: 1, attempt: 2, attempt_id: "a2", phase: "attempt_settled", status: "failed" } });
    const result = await execute(f);
    expect(result.code).toBe(0); expect(result.output).toMatchObject({ failure_reason: "claude-code-resume-budget-exhausted", resume_count: 1 });
  });

  it("escalates INT/TERM to KILL and settles when the child ignores graceful signals", async () => {
    const f = fixture(`process.on("SIGINT",()=>{}); process.on("SIGTERM",()=>{}); console.log(JSON.stringify({type:"system",session_id:"s"})); setInterval(()=>{},1000);`);
    const result = await execute(f);
    expect(result.code).toBe(0); expect(result.output.failure_reason).toBe("claude-code-idle-after-resume");
    const journal = readFileSync(join(f.stateDir, "journal.ndjson"), "utf8"); expect(journal).toContain('"signal":"SIGKILL"');
  });

  it("forwards external SIGINT, reaps the child, and exits 130", async () => {
    const f = fixture(`process.on("SIGINT",()=>process.exit(0)); setInterval(()=>{},1000);`);
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "10000" }, "SIGINT");
    expect(result.code).toBe(130); expect(readFileSync(join(f.stateDir, "journal.ndjson"), "utf8")).toContain('"type":"runner_signal"');
  });

  it("settles after a terminal event even when the child never closes voluntarily", async () => {
    const f = fixture(`process.on("SIGINT",()=>{}); process.on("SIGTERM",()=>{}); console.log(JSON.stringify({type:"result",session_id:"s",structured_output:${JSON.stringify(verdict)}})); setInterval(()=>{},1000);`);
    const result = await execute(f, { CLAUDE_CODE_REVIEW_IDLE_MS: "10000" });
    expect(result.code).toBe(0); expect(result.output).toMatchObject({ verdict: "pass", execution_status: "completed" });
  });

  it("renews the idle lease on stderr-only activity without journaling its body", async () => {
    const f = fixture(`let n=0; const t=setInterval(()=>{process.stderr.write("secret-body"); if(++n===6){clearInterval(t); console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}}));}},300);`);
    const result = await execute(f);
    expect(result.output.verdict).toBe("pass"); const journal = readFileSync(join(f.stateDir, "journal.ndjson"), "utf8");
    expect(journal).toContain('"type":"stderr_activity"'); expect(journal).not.toContain("secret-body");
  });

  it("parses split NDJSON and recovers after an overflowed frame", async () => {
    const f = fixture(`process.stdout.write("x".repeat(1500)); setTimeout(()=>{process.stdout.write("\\n"+JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}})+"\\n")},10);`);
    const result = await execute(f, { CLAUDE_CODE_REVIEW_BUFFER_MAX_BYTES: "1024" });
    expect(result.output.verdict).toBe("pass"); expect(readFileSync(join(f.stateDir, "journal.ndjson"), "utf8")).toContain('"type":"buffer_overflow"');
  });

  it("rejects mismatched persisted state and starts a fresh session", async () => {
    const f = fixture(`if(process.argv.includes("--resume")) process.exit(44); console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(verdict)}}));`, { state: { input_hash: "other", session_id: "old", resume_count: 1, status: "failed" } });
    const result = await execute(f); expect(result.output.verdict).toBe("pass");
    expect(readFileSync(join(f.stateDir, "journal.ndjson"), "utf8")).toContain('"type":"state_hash_mismatch"');
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

  it("uses a small manifest prompt, puts --add-dir last, and accepts complete read coverage", async () => {
    const script = `
import {readFileSync} from "node:fs"; import {join} from "node:path";
const input=readFileSync(0,"utf8");
if(process.argv.indexOf("--add-dir")!==process.argv.length-2 || process.argv[process.argv.indexOf("--tools")+1]!=="Read" || process.argv.includes("--allowedTools") || input.includes("MATERIAL SECRET")) process.exit(31);
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
    writeFileSync(f.fake, `#!/usr/bin/env node\nimport {readFileSync} from "node:fs"; import {join} from "node:path"; const addDir=process.argv.indexOf("--add-dir"),manifest=JSON.parse(readFileSync(join(process.argv[addDir+1],"manifest.json"),"utf8")),e=manifest.entries[0],c=e.chunks[0],id="failed-read"; console.log(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id,name:"Read",input:{file_path:join(process.argv[addDir+1],c.path),offset:1,limit:Math.max(1,c.lines)}}]}})); console.log(JSON.stringify({type:"user",message:{role:"user",content:[{type:"tool_result",tool_use_id:id,is_error:true,content:"SECRET FAILURE"}]}})); console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(candidate)}}));`);
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
    writeFileSync(f.fake, `#!/usr/bin/env node\nimport {chmodSync,readFileSync,writeFileSync} from "node:fs"; import {join} from "node:path"; ${fullReadEvents} const target=join(process.argv[addDir+1],"materials.md");chmodSync(target,0o644);writeFileSync(target,"changed after read");chmodSync(target,0o444);console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify({ verdict: "pass", findings: [], resolutionSummary: "forged", skillResults: [], artifactCoverage: coverage })}}));`);
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
    writeFileSync(f.fake, `#!/usr/bin/env node\nimport {readFileSync} from "node:fs";import {join} from "node:path";const a=process.argv.indexOf("--add-dir"),m=JSON.parse(readFileSync(join(process.argv[a+1],"manifest.json"),"utf8"));for(const [i,e] of m.entries.entries())for(const c of e.chunks){const id="default-"+i+"-"+c.sequence,path=join(process.argv[a+1],c.path),source=readFileSync(path,"utf8"),line=source.replace(/\\n$/u,""),bad=e.id==="materials"&&c.sequence===1&&${truncate};console.log(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id,name:"Read",input:{file_path:path}}]}}));console.log(JSON.stringify({type:"user",message:{role:"user",content:[{type:"tool_result",tool_use_id:id,content:"1\\t"+(bad?line.slice(0,Math.max(1,line.length-1)):line)}]}}));}console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify({ verdict: "pass", findings: [], resolutionSummary: "long", skillResults: [], artifactCoverage })}}));`);
    const result = await execute(f);
    expect(result.output.verdict).toBe(expectedVerdict);
    if (truncate) expect(result.output).toMatchObject({ failure_reason: "artifact-coverage-unattested", synthetic: true });
    else expect(result.output).toMatchObject({ execution_status: "completed", synthetic: false });
  });

  it("rejects partial Read ranges and unknown stream event variants", async () => {
    const f = fixture("", { artifact: true, materials: "one\ntwo\nthree\n" });
    const coverage = f.artifactPackage.manifest.entries.map(({ id, sha256 }) => ({ id, sha256, status: "read", evidence: "claimed" }));
    writeFileSync(f.fake, `#!/usr/bin/env node\nimport {readFileSync} from "node:fs";import {join} from "node:path";const a=process.argv.indexOf("--add-dir"),m=JSON.parse(readFileSync(join(process.argv[a+1],"manifest.json"),"utf8"));for(const [i,e] of m.entries.entries())for(const c of e.chunks){const id="r"+i+"-"+c.sequence,limit=e.id==="materials"?2:Math.max(1,c.lines),path=join(process.argv[a+1],c.path),source=readFileSync(path,"utf8"),lines=source.replace(/\\n$/u,"").split("\\n").slice(0,limit),content=lines.map((line,j)=>String(j+1)+"\\t"+line).join("\\n");console.log(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id,name:"Read",input:{file_path:path,offset:1,limit}}]}}));console.log(JSON.stringify({type:"user",message:{role:"user",content:[{type:"tool_result",tool_use_id:id,content}]}}));}console.log(JSON.stringify({type:"tool_use",id:"unknown",name:"Read",input:{file_path:join(process.argv[a+1],"materials.md"),offset:3,limit:1}}));console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify({ verdict: "pass", findings: [], resolutionSummary: "partial", skillResults: [], artifactCoverage: coverage })}}));`);
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
});
