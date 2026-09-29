// Frozen P10 test-only target. Previous bytes and RED archived as P10-frozen-before-metamorphic-*.
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { connect } from "node:net";
import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runTargetedCases } from "../../workflows/build-code/targeted-runner.mjs";

const roots = [];
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture(label) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-runner-")));
  roots.push(root);
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "Runner fixture");
  git(root, "config", "user.email", "runner@example.test");
  mkdirSync(join(root, "tests"));
  const token = `${label}-${randomUUID()}`;
  const v = { root, caseId: `CASE-${token}`, target: `tests/effect-${token}.test.mjs`,
    fullId: `business effect changes ${token}`, marker: `child-ran-${token}.marker`,
    nonce: randomUUID() };
  writeFileSync(join(root, v.target), [
    'import { test } from "node:test";',
    'import { readFileSync, writeFileSync } from "node:fs";',
    'import { strict as assert } from "node:assert";',
    `test(${JSON.stringify(v.fullId)}, () => {`,
    `  assert.equal(readFileSync("effect.txt", "utf8"), "new\\n");`,
    `  const token = ${JSON.stringify(v.nonce)} + ":" + process.pid;`,
    `  writeFileSync(${JSON.stringify(v.marker)}, token + "\\n", { flag: "wx" });`,
    `  console.log("P10_CHILD_EFFECT=" + token);`,
    `});`,
    "",
  ].join("\n"));
  writeFileSync(join(root, "effect.txt"), "new\n");
  git(root, "add", "."); git(root, "commit", "-qm", "runner target and observable effect");
  return v;
}
const selection = (v, overrides = {}) => ({ status: "selected", cases: [{ id: overrides.id ?? v.caseId,
  execution: { target: overrides.target ?? v.target, expected_test_identity: overrides.fullId ?? v.fullId, runner: "node:test" },
}] });
const run = (v, selected = selection(v), signal) => runTargetedCases({ selection: selected, workspaceRoot: v.root,
  runner: { executable: process.execPath, fixedArgs: ["--test", "--test-reporter=tap"], signal },
});
function grandchildFixture(mode) {
  const v = fixture(`grandchild-${mode}`);
  writeFileSync(join(v.root, "grandchild-server.mjs"),
    `import { createServer } from 'node:net'; import { writeFileSync } from 'node:fs'; process.on('SIGTERM', () => {}); const server = createServer(socket => socket.end()); server.listen(0, '127.0.0.1', () => writeFileSync(${JSON.stringify(join(v.root, "grandchild.json"))}, JSON.stringify({ pid: process.pid, port: server.address().port })));\n`);
  writeFileSync(join(v.root, v.target), [
    'import { test } from "node:test";',
    'import { spawn } from "node:child_process";',
    'import { existsSync } from "node:fs";',
    `test(${JSON.stringify(v.fullId)}, async () => {`,
    `  spawn(process.execPath, [${JSON.stringify(join(v.root, "grandchild-server.mjs"))}], { stdio: "ignore" });`,
    `  while (!existsSync(${JSON.stringify(join(v.root, "grandchild.json"))})) await new Promise(r => setTimeout(r, 20));`,
    mode === "output" ? `  while (!existsSync(${JSON.stringify(join(v.root, "flood.trigger"))})) await new Promise(r => setTimeout(r, 20)); process.stdout.write("x".repeat(9 * 1024 * 1024));` : "",
    "  await new Promise(() => {});",
    "});", "",
  ].join("\n"));
  return v;
}
async function waitForGrandchild(v) {
  const path = join(v.root, "grandchild.json");
  for (let tries = 0; tries < 250; tries++) {
    if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error("test grandchild did not start");
}
async function portOpen(port) {
  return new Promise((resolve) => {
    const socket = connect(port, "127.0.0.1");
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => resolve(false));
  });
}
function rejectsFor(result, reason) {
  expect(result.status).not.toBe("completed");
  expect(result.reason, "blanket unavailable/not_implemented cannot satisfy a specific rejection").toBe(reason);
  expect((result.observations ?? []).some(({ status }) => status === "passed")).toBe(false);
}

describe("ORACLE-P10-TARGETED-RUNNER-IDENTITY: safe actual execution", () => {
  it.each(["abort", "output"])("kills a TERM-resistant grandchild and releases its port on %s", async (mode) => {
    const v = grandchildFixture(mode);
    const controller = new AbortController();
    let grandchild;
    try {
      const resultPromise = run(v, selection(v), controller.signal);
      grandchild = await waitForGrandchild(v);
      expect(await portOpen(grandchild.port)).toBe(true);
      if (mode === "abort") controller.abort();
      else writeFileSync(join(v.root, "flood.trigger"), "go");
      const interruptedAt = Date.now();
      const result = await resultPromise;
      rejectsFor(result, "test_failed");
      expect(result.execution?.exit_code).toBeNull();
      if (mode === "output") expect(Date.now() - interruptedAt).toBeLessThan(5_000);
      expect(await portOpen(grandchild.port)).toBe(false);
    } finally {
      controller.abort();
      if (!grandchild && existsSync(join(v.root, "grandchild.json"))) {
        grandchild = JSON.parse(readFileSync(join(v.root, "grandchild.json"), "utf8"));
      }
      if (grandchild?.pid) {
        try { process.kill(grandchild.pid, "SIGKILL"); } catch { /* exited */ }
      }
    }
  }, 12_000);
  it.each(["alpha", "beta"])("executes dynamic %s child with real TAP, identity and side effect", async (label) => {
    const v = fixture(label);
    expect(existsSync(join(v.root, v.marker))).toBe(false);
    const result = await run(v);
    // Only the seam may have executed this child: do not run an independent
    // second child or plant a marker before checking its returned report.
    expect(existsSync(join(v.root, v.marker)), "the seam must cause the child's exclusive disk write").toBe(true);
    const marker = readFileSync(join(v.root, v.marker), "utf8").trim();
    expect(marker).toMatch(new RegExp(`^${v.nonce}:[1-9][0-9]*$`));
    const [nonce, pid] = marker.split(":");
    expect(nonce).toBe(v.nonce);
    expect(pid).not.toBe(String(process.pid));
    expect(result.execution?.raw_output).toContain(`P10_CHILD_EFFECT=${marker}`);
    expect(result.status, "an unavailable stub is not execution").toBe("completed");
    expect(result.observations).toEqual(expect.arrayContaining([
      expect.objectContaining({ case_id: v.caseId, full_id: v.fullId, status: "passed" }),
    ]));
    expect(result.execution?.raw_output).toContain("TAP version 13");
    expect(result.execution?.raw_output).toContain(`# Subtest: ${v.fullId}`);
    expect(result.execution?.raw_output).toContain(`# pass 1`);
    expect(result.execution?.raw_output).toContain(`# fail 0`);
    expect(result.execution?.exit_code).toBe(0);
    expect(result.execution?.raw_output).toContain(`ok 1 - ${v.fullId}`);
    expect(readFileSync(join(v.root, v.marker), "utf8")).toBe(`${marker}\n`);
  });
  it("identifies duplicate selected case IDs", async () => {
    const v = fixture("duplicate"), selected = selection(v);
    rejectsFor(await run(v, { ...selected, cases: [selected.cases[0], selected.cases[0]] }), "duplicate_case_id");
  });
  it("identifies a missing target", async () => {
    const v = fixture("missing");
    rejectsFor(await run(v, selection(v, { target: "tests/missing.test.mjs" })), "missing_target");
  });
  it.each(["../outside.test.mjs", "tests/effect.test.mjs; touch pwned", "tests/$(touch pwned).test.mjs"])(
    "identifies an unsafe target and does not interpolate: %s", async (target) => {
      const v = fixture("unsafe");
      const result = await run(v, selection(v, { target }));
      expect(existsSync(join(v.root, "pwned"))).toBe(false);
      expect(existsSync(join(v.root, v.marker))).toBe(false);
      rejectsFor(result, "unsafe_target");
    },
  );
  it("identifies wrong reporter identity even when the child runs", async () => {
    const v = fixture("wrong");
    rejectsFor(await run(v, selection(v, { fullId: `other-${randomUUID()}` })), "reporter_identity_mismatch");
  });
  it("identifies an actually failed observable-effect test", async () => {
    const v = fixture("failed");
    writeFileSync(join(v.root, "effect.txt"), "charged\n");
    rejectsFor(await run(v), "test_failed");
  });
});

// F-d87cb2064dbb: actual Node runner stderr is a separate stream, not TAP.
describe("ORACLE-P10-TAP-STDERR-SEPARATION", () => {
  it("keeps real bootstrap stderr apart from the passed TAP reporter and retains both originals", async () => {
    const v = fixture("stderr-separation");
    const previous = process.env.NODE_DEBUG;
    process.env.NODE_DEBUG = "test_runner";
    try {
      const result = await run(v);
      expect(result.status).toBe("completed");
      expect(result.execution.exit_code).toBe(0);
      expect(result.execution.raw_output.startsWith("TAP version 13\n")).toBe(true);
      expect(result.execution.raw_stderr).toMatch(/TEST_RUNNER \d+:/);
      const bootstrapLine = result.execution.raw_stderr.split(/\r?\n/).find((line) => /^TEST_RUNNER \d+:/.test(line));
      expect(result.execution.raw_output).not.toContain(bootstrapLine);
      expect(result.observations).toMatchObject([{ case_id: v.caseId, full_id: v.fullId, status: "passed" }]);
      expect(readFileSync(join(v.root, v.marker), "utf8")).toMatch(new RegExp(`^${v.nonce}:\\d+\\n$`));
    } finally {
      if (previous === undefined) delete process.env.NODE_DEBUG; else process.env.NODE_DEBUG = previous;
    }
  });
});


// F-d12f1f3335c7: actual children must not load caller-provided Node hooks.
describe("ORACLE-P10-LOADER-ENVIRONMENT", () => {
  async function withChildEnvironment(values, action) {
    const before = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
    try {
      for (const [key, value] of Object.entries(values)) process.env[key] = value;
      return await action();
    } finally {
      for (const [key, value] of Object.entries(before)) {
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
    }
  }

  it("prevents a real NODE_OPTIONS preload from executing and forging a failed child assertion into a pass", async () => {
    const v = fixture("loader-preload");
    writeFileSync(join(v.root, "effect.txt"), "charged\n");
    const preloadMarker = join(v.root, "preload-executed.jsonl");
    const preload = join(v.root, "assert-forger.cjs");
    writeFileSync(preload, `require("node:fs").appendFileSync(${JSON.stringify(preloadMarker)}, JSON.stringify({pid:process.pid})+"\\n"); require("node:assert").strict.equal=()=>{};\n`);
    await withChildEnvironment({ NODE_OPTIONS: `--require=${preload}` }, async () => {
      const result = await run(v);
      expect(result.status, JSON.stringify({ preload_executed: existsSync(preloadMarker), result })).not.toBe("completed");
      rejectsFor(result, "test_failed");
      expect(result.execution.exit_code).not.toBe(0);
      expect(result.execution.raw_output).toContain(`# fail 1`);
      expect(existsSync(preloadMarker)).toBe(false);
      expect(existsSync(join(v.root, v.marker))).toBe(false);
    });
  });

  it("keeps required child variables while removing direct and npm case-variant loader inputs in the actual process", async () => {
    const v = fixture("loader-env-observation");
    const envOutput = join(v.root, "actual-child-environment.json");
    const loaderKeys = ["NODE_OPTIONS", "node_options", "NODE_PATH", "npm_config_node_options", "NPM_CONFIG_NODE_OPTIONS", "npm_config_NODE_OPTIONS", "npm_config_node_path"];
    writeFileSync(join(v.root, v.target), [
      'import { test } from "node:test";',
      'import { writeFileSync } from "node:fs";',
      'import { strict as assert } from "node:assert";',
      `test(${JSON.stringify(v.fullId)},()=>{`,
      ` const observed = Object.fromEntries(${JSON.stringify(loaderKeys)}.map(key=>[key,process.env[key]??null]));`,
      ` observed.required = process.env.P10_REQUIRED_ENV; observed.path = process.env.PATH;`,
      ` writeFileSync(${JSON.stringify(envOutput)},JSON.stringify(observed));`,
      ` assert.equal(observed.required,${JSON.stringify(v.nonce)});`,
      ` writeFileSync(${JSON.stringify(v.marker)},${JSON.stringify(v.nonce)}+":"+process.pid+"\\n",{flag:"wx"});`,
      '});', '',
    ].join("\n"));
    const values = Object.fromEntries(loaderKeys.map(key=>[key,key.toLowerCase().endsWith("node_path") ? join(v.root,"external-modules") : "--stack-trace-limit=29"]));
    await withChildEnvironment({ ...values, P10_REQUIRED_ENV: v.nonce }, async () => {
      const result = await run(v);
      expect(result.status).toBe("completed");
      expect(result.observations).toMatchObject([{ full_id: v.fullId, status: "passed" }]);
      const observed = JSON.parse(readFileSync(envOutput,"utf8"));
      for (const key of loaderKeys) expect(observed[key],key).toBeNull();
      expect(observed.required).toBe(v.nonce);
      expect(observed.path).toBe(process.env.PATH);
      expect(readFileSync(join(v.root,v.marker),"utf8")).toContain(v.nonce);
    });
  });
});
