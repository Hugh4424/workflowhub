import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import * as processModule from "../lib/process.mjs";
import { execute } from "../lib/process.mjs";
import pi from "../lib/adapters/pi.mjs";
import antigravity from "../lib/adapters/antigravity.mjs";
import { nodeFixtureCommand } from "./node-fixture-command.mjs";

// T027 / FR-QUAL-014② — liveness is not progress.  A payload-free heartbeat
// repeated thousands of times must keep a working turn alive, and a stream that
// only ever repeats that heartbeat must still stop inside a bounded number of
// health intervals.  The threshold is read from the production module so this
// test cannot drift from the shipped口径; the namespace import keeps the file
// loadable before that export exists.
const SEMANTIC_STALL_INTERVALS = processModule.SEMANTIC_STALL_INTERVALS ?? 12;

const fake = nodeFixtureCommand(fileURLToPath(new URL("../test/fake-pi-cli.mjs", import.meta.url)));
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-pi-liveness-"));
const provider = (overrides = {}) => ({ id: "pi", command: fake, model: "deepseek/deepseek-v4-flash", effort: "low", thinking: null, auth: { type: "native", env: [] }, env: [], ...overrides });
const streamingProbe = async () => ({ status: "busy", session_id: "pi-liveness-session", cursor: "same-leaf", raw: null, error: null, evidence: "Pi session is streaming" });
const movingProbe = () => { let leaf = 0; return async () => ({ status: "busy", session_id: "pi-liveness-session", cursor: `leaf-${++leaf}`, raw: null, error: null, evidence: "Pi session leaf advanced" }); };
const heartbeatSource = (durationMs) => `const line=JSON.stringify({type:"pi.progress",event:"thinking_delta"});const timer=setInterval(()=>process.stdout.write(line+"\\n"),2);setTimeout(()=>{clearInterval(timer);process.exit(0);},${durationMs});`;
const heartbeatThenSilenceSource = (heartbeatMs, totalMs) => `const line=JSON.stringify({type:"pi.progress",event:"thinking_delta"});const timer=setInterval(()=>process.stdout.write(line+"\\n"),2);setTimeout(()=>clearInterval(timer),${heartbeatMs});setTimeout(()=>process.exit(0),${totalMs});`;
const alternatingProgressSource = (durationMs) => `let index=0;const timer=setInterval(()=>{const event=index++%2===0?"thinking_delta_a":"thinking_delta_b";process.stdout.write(JSON.stringify({type:"pi.progress",event,delta:"harmless-"+index})+"\\n");},2);setTimeout(()=>{clearInterval(timer);process.exit(0);},${durationMs});`;
const plan = (source, overrides = {}) => ({ command: process.execPath, argv: ["-e", source], cwd: os.tmpdir(), env: process.env, input: null, redact: [], observeLine: pi.observeLine, streamLiveness: true, probeSession: streamingProbe, ...overrides });
const options = (intervalMs) => ({ maxOutputBytes: 65536, healthCheckIntervalMs: intervalMs, terminationGraceMs: 20 });
const validHarvest = `${JSON.stringify({ type: "session.completed", session_id: "harvest-session", text: "done" })}\n`;

test("unsupported liveness plans reject before spawning", () => {
  for (const invalid of [{ streamLiveness: true, streamProgress: true, probeSession: streamingProbe }, { streamLiveness: true, streamProgress: false, probeSession: null }]) {
    let beforeSpawn = 0;
    assert.throws(() => execute(plan("process.exit(0)", invalid), { ...options(20), onStart: () => { beforeSpawn += 1; } }), TypeError);
    assert.equal(beforeSpawn, 0);
  }
});

test("the pi adapter declares stream liveness without changing its observation contract", () => {
  const runtime = temp(); const cwd = path.join(runtime, "work"); fs.mkdirSync(cwd, { recursive: true });
  try {
    const execution = pi.start(provider(), cwd, "review", runtime);
    assert.equal(execution.streamLiveness, true, "the pi plan must declare that its stdout frames are liveness evidence");
    assert.deepEqual(pi.observeLine("stdout", JSON.stringify({ type: "pi.progress", event: "thinking_delta" })), { liveness: true, progress: true, event: "thinking_delta" });
    assert.deepEqual(pi.observeLine("stdout", JSON.stringify({ type: "pi.session", id: "s" })), { liveness: true, progress: false, event: "pi.session", session_id: "s" });
    assert.equal(typeof processModule.SEMANTIC_STALL_INTERVALS, "number", "the bounded semantic window must be exported as the single threshold口径");
  } finally { fs.rmSync(runtime, { recursive: true, force: true }); }
});

test("a repeated payload-free heartbeat adds one progress event and survives past six health intervals", async () => {
  const intervalMs = 40; const intervals = 6;
  const liveness = [];
  const result = await execute(plan(heartbeatSource(intervalMs * (intervals + 3))), { ...options(intervalMs), onLiveness: (value) => liveness.push(value) });
  assert.equal(result.ok, true, `identical heartbeats must not be read as a stall: ${result.error?.code}`);
  assert.ok(result.duration_ms > intervalMs * intervals, `the turn must outlive six health intervals, ran ${result.duration_ms}ms`);
  assert.equal(result.progress_events, 1, "a thousand identical heartbeats stay one semantic progress event");
  assert.ok(liveness.length >= 100, `every frame is still liveness evidence, saw ${liveness.length}`);
});

test("a heartbeat-only stream stops on the bounded semantic window", async () => {
  const intervalMs = 20;
  const result = await execute(plan(heartbeatSource(intervalMs * (SEMANTIC_STALL_INTERVALS + 10))), options(intervalMs));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PROCESS_STALLED");
  assert.match(result.error.message, new RegExp(`no semantic progress for ${SEMANTIC_STALL_INTERVALS} health intervals`));
});

test("alternating unique pi progress payloads cannot evade the semantic stall window", async () => {
  const intervalMs = 20;
  const result = await execute(plan(alternatingProgressSource(intervalMs * (SEMANTIC_STALL_INTERVALS + 10))), options(intervalMs));
  assert.equal(result.ok, false, "syntactically unique liveness payloads must not count as semantic progress");
  assert.equal(result.error.code, "PROCESS_STALLED");
  assert.match(result.error.message, new RegExp(`no semantic progress for ${SEMANTIC_STALL_INTERVALS} health intervals`));
  assert.ok(result.progress_events >= SEMANTIC_STALL_INTERVALS, `the fixture must emit unique payloads before stalling, saw ${result.progress_events}`);
});

test.each(["progressing", "retry"])("unchanged %s probe status cannot reset the semantic stall window", async status => {
  const intervalMs = 20;
  const result = await execute(plan(heartbeatSource(intervalMs * (SEMANTIC_STALL_INTERVALS + 10)), {
    probeSession: async () => ({ status, session_id: "pi-liveness-session", cursor: "same-leaf", raw: null, error: null, evidence: `unchanged ${status}` }),
  }), options(intervalMs));
  assert.equal(result.ok, false, `unchanged ${status} must not count as semantic progress`);
  assert.equal(result.error.code, "PROCESS_STALLED");
  assert.match(result.error.message, new RegExp(`no semantic progress for ${SEMANTIC_STALL_INTERVALS} health intervals`));
});

test("an invalid completed probe result cannot reset the semantic stall window", async () => {
  const intervalMs = 20;
  const result = await execute(plan(heartbeatSource(intervalMs * (SEMANTIC_STALL_INTERVALS + 10)), {
    probeSession: async () => ({ status: "completed", session_id: "pi-liveness-session", cursor: "same-leaf", raw: { stdout: "PARTIAL", stderr: "" }, error: null, evidence: "invalid completed fixture" }),
  }), { ...options(intervalMs), validateCompleted: () => false });
  assert.equal(result.ok, false, "an invalid completed result must remain advisory and stall without semantic progress");
  assert.equal(result.error.code, "PROCESS_STALLED");
  assert.match(result.error.message, new RegExp(`no semantic progress for ${SEMANTIC_STALL_INTERVALS} health intervals`));
});

test("a delayed changing probe result accepts verified semantic progress after liveness activity", async () => {
  const intervalMs = 20; let probes = 0;
  const result = await execute(plan(heartbeatSource(intervalMs * 9), {
    probeSession: async () => {
      const cursor = `late-leaf-${++probes}`;
      await new Promise(resolve => setTimeout(resolve, intervalMs * 2));
      return { status: "busy", session_id: "pi-liveness-session", cursor, raw: null, error: null, evidence: "late changing probe fixture" };
    },
  }), { ...options(intervalMs), probeDeadlineMs: intervalMs * 4 });
  assert.equal(result.ok, true, `verified delayed progress must not be discarded: ${result.error?.code}`);
  assert.ok(probes >= 1, "the delayed probe fixture must be exercised");
});

test("continuous frames between probe ticks project busy as diagnostic progressing", async () => {
  const intervalMs = 20; const diagnostics = [];
  const result = await execute(plan(heartbeatSource(intervalMs * 8), {
    probeSession: async () => ({ status: "busy", session_id: "diagnostic-session", cursor: "same-leaf", raw: null, error: null, evidence: "original busy evidence" }),
    onHealthDiagnostic: value => diagnostics.push(value),
  }), options(intervalMs));
  assert.equal(result.ok, true, `continuous liveness should not be stopped by unchanged busy: ${result.error?.code}`);
  assert.ok(diagnostics.some(value => value.code === "HEALTH_PROGRESSING"), "generation-advanced busy must project HEALTH_PROGRESSING");
  assert.equal(diagnostics.find(value => value.code === "HEALTH_PROGRESSING")?.evidence, "original busy evidence");
});

test("liveness-only pure, first, and duplicate frames do not advance health progress generation", async () => {
  const generations = [];
  const source = `const rows=[{kind:"pure"},{kind:"first"},{kind:"duplicate"}];let i=0;const timer=setInterval(()=>{const row=rows[i++%rows.length];process.stdout.write(JSON.stringify(row)+"\\n");},2);setTimeout(()=>{clearInterval(timer);process.exit(0);},180);`;
  const result = await execute(plan(source, {
    observeLine: (_stream, line) => {
      const { kind } = JSON.parse(line);
      if (kind === "pure") return { liveness: true, progress: false, event: kind };
      return { liveness: true, progress: true, progress_key: kind === "duplicate" ? "first" : kind, event: kind };
    },
    probeSession: async ({ activity_generation }) => {
      generations.push(activity_generation);
      return { status: "busy", session_id: null, cursor: null, raw: null, error: null, evidence: "generation probe" };
    },
  }), options(20));
  assert.equal(result.ok, true, `liveness-only frame branches should remain healthy: ${result.error?.code}`);
  assert.ok(generations.length > 0);
  assert.ok(generations.every(value => value === 0), "liveness-only frames must not call healthRunner.noteProgress");
});

test("stopped liveness frames keep health busy and eventually stall", async () => {
  const diagnostics = [];
  const result = await execute(plan(heartbeatThenSilenceSource(35, 3000), {
    onHealthDiagnostic: value => diagnostics.push(value),
  }), options(20));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PROCESS_STALLED");
  assert.ok(diagnostics.some(value => value.code === "HEALTH_PROGRESSING"), "frames between ticks may project progressing");
  assert.ok(diagnostics.some(value => value.code === "HEALTH_BUSY"), "after frames stop unchanged busy must remain HEALTH_BUSY");
});

test("a delayed terminal probe failure remains authoritative despite liveness activity", async () => {
  const intervalMs = 20;
  const result = await execute(plan(heartbeatSource(intervalMs * (SEMANTIC_STALL_INTERVALS + 10)), {
    probeSession: async () => {
      await new Promise(resolve => setTimeout(resolve, intervalMs * 2));
      return { status: "failed", terminal: true, session_id: "pi-liveness-session", cursor: "failed-leaf", raw: null, error: { code: "PROVIDER_PERMISSION_DENIED", message: "provider permission was denied" }, evidence: "delayed terminal failure fixture" };
    },
  }), { ...options(intervalMs), probeDeadlineMs: intervalMs * 4 });
  assert.equal(result.ok, false);
  assert.deepEqual(result.error, { code: "PROVIDER_PERMISSION_DENIED", message: "provider permission was denied" });
});

test.each(["unverifiable", "dead"])("actual repeated heartbeats remain bounded when the probe is advisory %s", async status => {
  const intervalMs = 20;
  const result = await execute(plan(heartbeatSource(intervalMs * (SEMANTIC_STALL_INTERVALS + 10)), {
    probeSession: async () => ({ status, error: null, evidence: "Probe cannot verify progress" }),
  }), options(intervalMs));
  assert.equal(result.ok, false, "received heartbeat frames must not bypass the semantic window when the probe cannot verify progress");
  assert.equal(result.error.code, "PROCESS_STALLED");
  assert.match(result.error.message, new RegExp(`no semantic progress for ${SEMANTIC_STALL_INTERVALS} health intervals`));
  assert.equal(result.progress_events, 1);
});

test("a delayed valid completed probe is harvested before a semantic stall claim", async () => {
  const intervalMs = 20;
  const result = await execute(plan(heartbeatSource(intervalMs * 8), {
    probeSession: async () => {
      await new Promise(resolve => setTimeout(resolve, intervalMs * 2));
      return { status: "completed", session_id: "harvest-session", cursor: "done", raw: { stdout: validHarvest, stderr: "" }, error: null, evidence: "delayed completion" };
    },
  }), { ...options(intervalMs), validateCompleted: raw => raw.stdout === validHarvest, probeDeadlineMs: intervalMs * 4 });
  assert.equal(result.ok, true);
  assert.equal(result.health_harvested, true);
  assert.equal(result.stdout, validHarvest);
  assert.equal(result.session_id, "harvest-session");
  assert.equal(result.cursor, "done");
});

test("a completed probe after PROCESS_STALLED cannot resurrect the terminal claim", async () => {
  const intervalMs = 20;
  const result = await execute(plan(heartbeatSource(intervalMs * (SEMANTIC_STALL_INTERVALS + 10)), {
    probeSession: async () => {
      await new Promise(resolve => setTimeout(resolve, intervalMs * 20));
      return { status: "completed", session_id: "late-session", cursor: "late", raw: { stdout: validHarvest, stderr: "" }, error: null, evidence: "too late" };
    },
  }), { ...options(intervalMs), validateCompleted: raw => raw.stdout === validHarvest, probeDeadlineMs: intervalMs * 40 });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PROCESS_STALLED");
});

test.each(["unverifiable", "dead"])("an advisory %s probe alone cannot stop a child with no observable output", async status => {
  const intervalMs = 20;
  const result = await execute(plan(`setTimeout(() => process.exit(0), ${intervalMs * (SEMANTIC_STALL_INTERVALS + 6)});`, {
    probeSession: async () => ({ status, error: null, evidence: "Probe cannot verify the child" }),
  }), options(intervalMs));
  assert.equal(result.ok, true, "an advisory probe value alone is not a stop reason");
  assert.equal(result.progress_events, 0);
  assert.ok(result.duration_ms > intervalMs * SEMANTIC_STALL_INTERVALS);
});

test("actual repeated heartbeats remain bounded when the probe does not return", async () => {
  const intervalMs = 20;
  const result = await execute(plan(heartbeatSource(intervalMs * (SEMANTIC_STALL_INTERVALS + 10)), {
    probeSession: () => new Promise(() => {}),
  }), { ...options(intervalMs), probeDeadlineMs: 2000 });
  assert.equal(result.ok, false, "the liveness stream's semantic window must not await a probe response");
  assert.equal(result.error.code, "PROCESS_STALLED");
  assert.match(result.error.message, new RegExp(`no semantic progress for ${SEMANTIC_STALL_INTERVALS} health intervals`));
});

test("sparse repeated heartbeats count elapsed health intervals rather than heartbeat frames", async () => {
  const intervalMs = 20;
  const source = heartbeatSource(intervalMs * (SEMANTIC_STALL_INTERVALS + 10)).replace(",2);", `,${intervalMs * 3});`);
  const result = await execute(plan(source, {
    probeSession: async () => ({ status: "unverifiable", error: null, evidence: "Probe cannot verify progress" }),
  }), options(intervalMs));
  assert.equal(result.ok, false, "three health intervals between frames must not stretch the semantic window into thirty-six intervals");
  assert.equal(result.error.code, "PROCESS_STALLED");
  assert.match(result.error.message, new RegExp(`no semantic progress for ${SEMANTIC_STALL_INTERVALS} health intervals`));
});

test("verified probe leaf progress survives beyond the semantic window despite advisory intervals", async () => {
  const intervalMs = 20; let checks = 0;
  const result = await execute(plan(heartbeatSource(intervalMs * (SEMANTIC_STALL_INTERVALS + 8)), {
    probeSession: async () => ++checks % 3 === 0
      ? { status: "busy", cursor: `leaf-${checks}`, session_id: "advancing-session" }
      : { status: "unverifiable", error: null, evidence: "Intermittent probe uncertainty" },
  }), options(intervalMs));
  assert.equal(result.ok, true, `verified leaf changes must reset the semantic window: ${result.error?.code}`);
  assert.ok(result.duration_ms > intervalMs * SEMANTIC_STALL_INTERVALS);
});

test("true silence still stops on the existing five-interval window", async () => {
  const result = await execute(plan("setTimeout(() => process.exit(0), 3000);"), { ...options(20), streamLiveness: false, probeSession: null });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PROCESS_STALLED");
  assert.match(result.error.message, /no progress for 5 health intervals/);
});

test("heartbeat stop falls back to the five-interval silence rule", async () => {
  const result = await execute(plan(heartbeatThenSilenceSource(30, 3000), { streamLiveness: false, streamProgress: true, probeSession: null }), options(20));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PROCESS_STALLED");
  assert.match(result.error.message, /no progress for 5 health intervals/);
});

test("a moving probe leaf keeps a liveness-only stream alive without a total wall-clock limit", async () => {
  const intervalMs = 40;
  const result = await execute(plan(heartbeatSource(intervalMs * 9), { probeSession: movingProbe() }), options(intervalMs));
  assert.equal(result.ok, true, `a provider that keeps moving its session leaf must not be stopped: ${result.error?.code}`);
  assert.ok(result.duration_ms > intervalMs * 6, `ran ${result.duration_ms}ms with no total duration limit`);
});

test("adapters that do not declare stream liveness keep the existing stall rule", async () => {
  let pid = null;
  const repeated = "setInterval(() => { process.stdout.write(JSON.stringify({ event: 'init' }) + '\\n'); process.stdout.write(JSON.stringify({ event: 'step_update', step_update: { step_index: 1, state: 'DONE', step_type: 'tool', tool_info: {} } }) + '\\n'); }, 5); setTimeout(() => process.exit(0), 3000);";
  const antigravityRun = await execute({ ...plan(repeated, { observeLine: antigravity.observeLine, streamProgress: true, probeSession: null, streamLiveness: false }) }, { ...options(20), onStart: (value) => { pid = value; } });
  assert.equal(antigravityRun.ok, false);
  assert.equal(antigravityRun.error.code, "PROCESS_STALLED");
  assert.equal(antigravityRun.progress_events, 1);
  assert.ok(Number.isInteger(pid));
  const undeclared = await execute(plan(heartbeatSource(40 * 9), { streamLiveness: false }), options(40));
  assert.equal(undeclared.ok, false, "only an adapter that declares stream liveness may keep a stalled probe alive");
  assert.equal(undeclared.error.code, "PROCESS_STALLED");
});
