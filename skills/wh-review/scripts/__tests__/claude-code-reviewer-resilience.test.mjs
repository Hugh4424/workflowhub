import { afterEach, describe, expect, it } from "vitest";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

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

function fixture(script, { state, contract = "C" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "claude-runner-resilience-")); roots.push(root);
  const diff = join(root, "input.json"), output = join(root, "output.json"), stateDir = join(root, "state");
  mkdirSync(stateDir); writeFileSync(diff, JSON.stringify({ input_hash: "fixed-hash", mode: "full", contract, materials: "M" }));
  if (state) writeFileSync(join(stateDir, "state.json"), JSON.stringify(state));
  const fake = join(root, "fake-claude.mjs"); writeFileSync(fake, `#!/usr/bin/env node\n${script}`); chmodSync(fake, 0o755);
  return { root, diff, output, stateDir, fake };
}

function execute(f, env = {}, signalAfter) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [runner, `--diff=${f.diff}`, `--output=${f.output}`, `--state-dir=${f.stateDir}`], { env: { ...process.env, CLAUDE_CODE_BIN: f.fake, CLAUDE_CODE_REVIEW_IDLE_MS: "1000", CLAUDE_CODE_REVIEW_STOP_GRACE_MS: "20", ...env } });
    let stderr = ""; child.stderr.on("data", (x) => { stderr += x; });
    if (signalAfter) setTimeout(() => child.kill(signalAfter), 40);
    child.on("close", (code, signal) => resolvePromise({ code, signal, stderr, output: existsSync(f.output) ? JSON.parse(readFileSync(f.output, "utf8")) : null }));
  });
}

afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

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

  it("accepts not_applicable with evidence as complete manifest coverage", async () => {
    const candidate = { verdict: "pass", findings: [], resolutionSummary: "complete", skillResults: completeSkillResults };
    const f = fixture(`console.log(JSON.stringify({type:"result",structured_output:${JSON.stringify(candidate)}}));`, { contract: designContract });
    const result = await execute(f);
    expect(result.output).toMatchObject({ verdict: "pass", skillResults: completeSkillResults, synthetic: false });
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
});
