import { spawn, spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { existsSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  RUNTIME_BEHAVIORS,
} from "../../runtime/interface/runtime-facade.mjs";
import {
  officialStageHandler,
  validateAcceptanceCoverageShape,
  validateStageInvocation,
} from "../../runtime/stage/stage-handlers.mjs";
import { reviewRecordTimeoutForRunner, runReviewRecordWithSignalHandling, stageRuntimeCliMain, stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";

const ROOT = realpathSync(join(fileURLToPath(new URL("../..", import.meta.url))));
const RUNTIME = join(ROOT, "tools", "cli", "stage-runtime.mjs");
const roots = [];

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-preflight-")));
  roots.push(root);
  const input = join(root, "payload.json");
  return { root, input };
}

function preflightPayload(overrides = {}) {
  return {
    receipts: {},
    ...overrides,
  };
}

function preflightServices(overrides = {}) {
  return {
    command: [process.execPath, "-e", "process.exit(0)"],
    paths: [join(ROOT, "tools", "cli", "stage-runtime.mjs")],
    host_provider: "codex/host",
    route: { providers: ["opencode/reviewer"] },
    packet: { bytes: 128, limit_bytes: 2 * 1024 * 1024 },
    capabilities: { network: "localhost_only", filesystem: "worktree_temp_only", subprocess: "explicit_only" },
    ...overrides,
  };
}


function writePayload(path, value) {
  writeFileSync(path, `${JSON.stringify(value)}\n`);
}

function invokeCli({ stage, input, extra = [], env = {} }) {
  return spawnSync(process.execPath, [
    RUNTIME,
    "run",
    "--action=preflight",
    `--stage=${stage}`,
    `--input=${input}`,
    ...extra,
  ], { cwd: join(ROOT, "tests"), encoding: "utf8", env: { ...process.env, ...env } });
}

const validBuildPayload = () => ({
  receipts: {},
  acceptance_coverage: {
    snapshot_tree: "fixture-tree",
    accepted_criterion_ids: ["AC-001"],
    items: [{ acceptance_criterion_id: "AC-001", status: "unknown", evidence_refs: [] }],
  },
});

const validVerifyPayload = () => ({ receipts: {} });

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("stage-runtime private run:preflight", () => {
  it("leaves the managed review wait to the managed runner while injected rounds keep the recorder default", () => {
    expect(reviewRecordTimeoutForRunner({ managed: true })).toBeNull();
    expect(reviewRecordTimeoutForRunner({ managed: false })).toBeUndefined();
  });

  it("keeps a review-record invocation alive through SIGTERM until its canonical record flushes", async () => {
    const signals = new EventEmitter();
    let receivedSignal = null;
    const result = await runReviewRecordWithSignalHandling(async (signal) => {
      receivedSignal = signal;
      signals.emit("SIGTERM");
      signals.emit("SIGINT");
      signals.emit("SIGTERM");
      await new Promise((resolve) => queueMicrotask(resolve));
      expect(signal.aborted).toBe(true);
      return { status: "recorded" };
    }, { signalProcess: signals });

    expect(result).toEqual({ status: "recorded" });
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(receivedSignal.reason).toMatchObject({ code: "REVIEW_CANCELLED" });
    expect(signals.exitCode).toBe(143);
    expect(signals.listenerCount("SIGTERM")).toBe(0);
    expect(signals.listenerCount("SIGINT")).toBe(0);
  });

  it("passes the CLI SIGINT cancellation signal into the private review-record delegate", async () => {
    const signals = new EventEmitter();
    let receivedSignal = null;
    const result = await stageRuntimeCliMain([
      "review", "--action=record", "--stage=build-code", "--project=workflowhub", "--task=fixture", "--input=request.json",
    ], {
      delegate: async (_argv, { services }) => {
        receivedSignal = services.reviewSignal;
        signals.emit("SIGINT");
        await new Promise((resolve) => queueMicrotask(resolve));
        return { status: "recorded" };
      },
      services: { signalProcess: signals },
    });

    expect(result).toEqual({ status: "recorded" });
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(receivedSignal.aborted).toBe(true);
    expect(signals.exitCode).toBe(130);
  });

  it("handles a real SIGTERM without exiting before the review-record delegate settles", async () => {
    const state = fixture();
    const marker = join(state.root, "review-record-ready");
    const harness = join(state.root, "review-record-signal-harness.mjs");
    writeFileSync(harness, [
      `import { writeFileSync } from "node:fs";`,
      `import { stageRuntimeCliMain } from ${JSON.stringify(new URL("../../tools/cli/stage-runtime.mjs", import.meta.url).href)};`,
      `const marker = ${JSON.stringify(marker)};`,
      `await stageRuntimeCliMain(["review", "--action=record", "--stage=build-code", "--project=workflowhub", "--task=fixture", "--input=request.json"], {`,
      `  delegate: async (_argv, { services }) => {`,
      `    writeFileSync(marker, "ready");`,
      `    const hold = setInterval(() => {}, 1000);`,
      `    try { await new Promise((resolve) => services.reviewSignal.aborted ? resolve() : services.reviewSignal.addEventListener("abort", resolve, { once: true })); await new Promise((resolve) => setTimeout(resolve, 25)); } finally { clearInterval(hold); }`,
      `    return { status: "recorded" };`,
      `  },`,
      `});`,
    ].join("\n"));
    const child = spawn(process.execPath, [harness], { stdio: "ignore" });
    try {
      const deadline = Date.now() + 2_000;
      while (!existsSync(marker) && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(existsSync(marker)).toBe(true);
      const closed = new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("close", (code, signal) => resolve({ code, signal }));
      });
      expect(child.kill("SIGTERM")).toBe(true);
      expect(child.kill("SIGINT")).toBe(true);
      const exit = await closed;
      expect(exit).toEqual({ code: 143, signal: null });
    } finally {
      try { child.kill("SIGKILL"); } catch { /* child has already exited */ }
    }
  });

  it("keeps the seven public behaviors while routing run:preflight to a private delegate", async () => {
    const delegate = vi.fn(async (argv) => argv);

    expect(RUNTIME_BEHAVIORS).toEqual([
      "doctor", "status", "run", "review", "verify", "confirm", "authorize",
    ]);
    await expect(stageRuntimeCliMain(["--help"], { delegate })).resolves.toMatchObject({
      actions: { run: ["execute", "preflight", "draft", "reflect"] },
    });
    await expect(stageRuntimeCliMain([
      "run", "--action=preflight", "--stage=verify-code", "--input=payload.json",
    ], { delegate })).resolves.toEqual([
      "preflight", "--stage=verify-code", "--input=payload.json",
    ]);
    expect(delegate).toHaveBeenCalledOnce();
  });

  it("uses the same pure envelope validator at the exported seam and official handler boundary", async () => {
    const invalid = { receipts: { unexpected: "quality/evidence/not-allowed.json" } };
    let directError;
    try { validateStageInvocation("verify-code", invalid); }
    catch (error) { directError = error; }
    expect(directError).toBeInstanceOf(Error);

    const worker = { recordConsumerInvocation: vi.fn() };
    await expect(officialStageHandler("verify-code")(worker, invalid))
      .rejects.toMatchObject({ message: directError.message });
    expect(worker.recordConsumerInvocation).toHaveBeenCalledOnce();
  });

  it("rejects pure build-code and verify-code payload-shape errors with path/expected/actual diagnostics", () => {
    const cases = [
      {
        stage: "verify-code",
        input: { receipts: {}, forbidden: true },
        path: "forbidden",
      },
      {
        stage: "build-code",
        input: {
          receipts: {},
          acceptance_coverage: {
            snapshot_tree: "fixture-tree",
            accepted_criterion_ids: ["AC-001"],
            items: [{ acceptance_criterion_id: "AC-001", status: "pass", evidence_refs: [] }],
          },
        },
        path: "acceptance_coverage.items[0].status",
      },
      {
        stage: "build-code",
        input: {
          receipts: {},
          acceptance_coverage: {
            snapshot_tree: "fixture-tree",
            accepted_criterion_ids: ["AC-001"],
            items: [{
              acceptance_criterion_id: "AC-001", status: "missing",
              evidence_refs: [{ ref: "quality/evidence/not-a-hash.json", sha256: "bad" }],
            }],
          },
        },
        path: "acceptance_coverage.items[0].evidence_refs",
      },
    ];

    for (const { stage, input, path } of cases) {
      let error;
      try { validateStageInvocation(stage, input); }
      catch (caught) { error = caught; }
      expect(error).toBeInstanceOf(Error);
      expect(error.diagnostic).toMatchObject({
        path,
        expected: expect.anything(),
        actual: expect.anything(),
      });
      expect(Object.keys(error.diagnostic)).toEqual(["path", "expected", "actual"]);
    }
  });

  it("enforces the current-only evidence namespace when the handler selects vNext mode", () => {
    const value = {
      snapshot_tree: "fixture-tree",
      accepted_criterion_ids: ["AC-001"],
      items: [{
        acceptance_criterion_id: "AC-001",
        status: "covered",
        evidence_refs: [{ ref: "evidence/legacy.json", sha256: "a".repeat(64) }],
      }],
    };
    expect(() => validateAcceptanceCoverageShape(value, { currentOnly: true }))
      .toThrow(/evidence reference is invalid/);
    expect(validateAcceptanceCoverageShape(value, { currentOnly: false }).items[0].evidence_refs)
      .toEqual(value.items[0].evidence_refs);
  });

  it("accepts valid pure payloads without looking up current records", async () => {
    const state = fixture();
    writePayload(state.input, validBuildPayload());
    const before = readdirSync(state.root).sort();
    const result = await stageRuntimeMain([
      "preflight", "--stage=build-code", `--input=${state.input}`,
    ], {
      cwd: join(state.root, "not-a-worktree"),
    });

    expect(result).toMatchObject({ status: "valid", diagnostics: [] });
    expect(readdirSync(state.root).sort()).toEqual(before);
  });

  it("accepts the freeze, reply, fallback, and review-budget fields at the official entry", () => {
    expect(() => validateStageInvocation("build-plan", {
      receipts: {},
      decision_freeze: { material_revision: "revision-a", snapshot_tree: "a".repeat(40) },
      fallback_protocol: {},
      review_budget: { attempts: [], request: { kind: "initial" } },
      user_reply: { finding_id: "F-a", reply_ref: "quality/confirmations/reply.json", reply_hash: "b".repeat(64) },
    })).not.toThrow();
  });

  it("accepts a runtime-owned attempt binding and rejects an empty one", () => {
    expect(() => validateStageInvocation("build-code", {
      receipts: {},
      attempt_id: "current-session-build-code-attempt",
    })).not.toThrow();
    expect(() => validateStageInvocation("build-code", {
      receipts: {},
      attempt_id: "",
    })).toThrow(/attempt_id.*non-empty string/i);
  });

  it("rejects command/path and missing capability facts before dispatch and retries after repair", async () => {
    const cases = [
      ["command", preflightPayload(), preflightServices({ command: [join(ROOT, "missing-command")] }), "command"],
      ["path", preflightPayload(), preflightServices({ paths: [join(ROOT, "missing-path")] }), "paths"],
      ["capability", preflightPayload(), preflightServices({ capabilities: {} }), "capabilities"],
    ];
    for (const [label, payload, services, expectedPath] of cases) {
      const state = fixture();
      writePayload(state.input, payload);
      const started = Date.now();
      const result = await stageRuntimeMain(["preflight", `--stage=build-code`, `--input=${state.input}`], {
        cwd: join(state.root, "not-a-worktree"),
        services: { preflight: services },
      });
      expect(Date.now() - started).toBeLessThanOrEqual(5000);
      expect(result.status).toBe("protocol_invalid");
      expect(result.diagnostics).toEqual([expect.objectContaining({ path: expectedPath, expected: expect.any(String), actual: expect.any(String) })]);
      expect(result.diagnostics[0].expected).not.toBe("");
      expect(result.diagnostics[0].actual).not.toBe("");
      expect(existsSync(join(state.root, "child-started"))).toBe(false);
      expect(label).toBeTypeOf("string");
    }

    const retry = fixture();
    writePayload(retry.input, preflightPayload());
    await expect(stageRuntimeMain(["preflight", "--stage=build-code", `--input=${retry.input}`], {
      services: { preflight: preflightServices() },
    })).resolves.toMatchObject({ status: "valid", diagnostics: [] });
  });

  it("keeps preflight valid when a declared packet limit is lower than its complete byte count", async () => {
    const state = fixture();
    writePayload(state.input, preflightPayload());
    await expect(stageRuntimeMain(["preflight", "--stage=build-code", `--input=${state.input}`], {
      services: { preflight: preflightServices({ packet: { bytes: 486778, limit_bytes: 1 } }) },
    })).resolves.toMatchObject({ status: "valid", diagnostics: [] });
  });

  it("returns valid=0 with no stdout diagnostics and protocol-invalid=2 with a stdout array", () => {
    const state = fixture();
    const validPath = join(state.root, "valid.json");
    const invalidPath = join(state.root, "invalid.json");
    writePayload(validPath, validVerifyPayload());
    writePayload(invalidPath, { receipts: {}, forbidden: true });

    const valid = invokeCli({ stage: "verify-code", input: validPath, env: { WORKFLOWHUB_TASK_DIR: state.root, CODEX_SESSION_ID: "preflight-test-session" } });
    expect(valid.status).toBe(0);
    expect(valid.stdout).toBe("");
    expect(valid.stderr).toMatch(/^$|unknown format/i);

    const invalid = invokeCli({ stage: "verify-code", input: invalidPath, env: { WORKFLOWHUB_TASK_DIR: state.root, CODEX_SESSION_ID: "preflight-test-session" } });
    expect(invalid.status).toBe(2);
    expect(invalid.stderr).toMatch(/^$|unknown format/i);
    expect(JSON.parse(invalid.stdout)).toEqual([
      { path: "forbidden", expected: expect.anything(), actual: true },
    ]);
  });

  it("uses exit=1 and stderr for command, input, and runtime errors", () => {
    const state = fixture();
    const missing = invokeCli({ stage: "verify-code", input: join(state.root, "missing.json"), env: { CODEX_SESSION_ID: "preflight-test-session" } });
    expect(missing.status).toBe(1);
    expect(missing.stdout).toBe("");
    expect(missing.stderr).toMatch(/current WorkflowHub session|task binding|ENOENT|no such file/i);

    const malformed = join(state.root, "malformed.json");
    writeFileSync(malformed, "not-json\n");
    const inputError = invokeCli({ stage: "verify-code", input: malformed, env: { CODEX_SESSION_ID: "preflight-test-session" } });
    expect(inputError.status).toBe(1);
    expect(inputError.stdout).toBe("");
    expect(inputError.stderr).toMatch(/JSON|Unexpected token|current WorkflowHub session|task binding/i);

    const commandError = spawnSync(process.execPath, [
      RUNTIME, "run", "--action=preflight", "--stage=make-decision", `--input=${malformed}`,
    ], { cwd: join(ROOT, "tests"), encoding: "utf8", env: { ...process.env, WORKFLOWHUB_TASK_DIR: state.root, CODEX_SESSION_ID: "preflight-test-session" } });
    expect(commandError.status).toBe(1);
    expect(commandError.stdout).toBe("");
    expect(commandError.stderr).toMatch(/preflight requires --stage=build-code\|verify-code/i);
  });
});
