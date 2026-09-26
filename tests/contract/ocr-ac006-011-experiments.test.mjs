import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { runConfiguredOcrHostReview } from "../../runtime/review/ocr-delegation-adapter.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { stageRuntimeCliMain, stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";

const roots = [];
const capturedFacts = [];
const artifactRoot = fileURLToPath(new URL("../../.cache/card05-experiments/ac006-011/", import.meta.url));
mkdirSync(artifactRoot, { recursive: true });
const materialId = createHash("sha256").update("ac006-011-isolated-experiment").digest("hex");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const request = (stage) => stage === "build-code"
  ? { stage, review_scope: "phase", subject_kind: "phase", phase_id: "P1", host_provider: "codex/host" }
  : { stage, subject_kind: "worktree", host_provider: "codex/host" };

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  const body = `${JSON.stringify({
    scope: "AC-REVIEW-006/011 isolated controlled experiment",
    command: ["./node_modules/.bin/vitest", "run", "tests/contract/ocr-ac006-011-experiments.test.mjs", "--reporter=verbose"],
    controlled_provider_only: true,
    facts: capturedFacts,
  }, null, 2)}\n`;
  const target = join(artifactRoot, `${randomUUID()}-experiment-bundle.json`);
  writeFileSync(target, body);
  process.stdout.write(`AC006-011_BUNDLE=${target} SHA256=${createHash("sha256").update(body).digest("hex")}\n`);
});

function root() {
  const path = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-ac006-011-")));
  roots.push(path);
  process.stdout.write(`AC006-011_EVIDENCE_ROOT=${path}\n`);
  return path;
}

function evidence(path, name, value) {
  const target = join(artifactRoot, `${randomUUID()}-${name}`);
  const body = `${JSON.stringify({ ...value, isolated_fixture_root: path }, null, 2)}\n`;
  writeFileSync(target, body);
  capturedFacts.push({ file: target, sha256: createHash("sha256").update(body).digest("hex"), facts: value });
  process.stdout.write(`AC006-011_EVIDENCE=${target} SHA256=${createHash("sha256").update(body).digest("hex")}\n`);
  return target;
}

function script(path, body) {
  writeFileSync(path, `#!/usr/bin/env node\n${body}\n`, { mode: 0o700 });
  return path;
}

function packet(path) {
  const packetRoot = join(path, "packet");
  mkdirSync(join(packetRoot, "src"), { recursive: true });
  const content = Buffer.from("export const reviewed = true;\n");
  writeFileSync(join(packetRoot, "src", "reviewed.mjs"), content);
  return {
    root: packetRoot, material_id: materialId,
    preview: { reviewable_files: [{ path: "src/reviewed.mjs" }] },
    rules: { rules: [{ path: "src/reviewed.mjs", rule: "Inspect correctness." }] },
    manifest: [{ path: "src/reviewed.mjs", bytes: content.length,
      sha256: createHash("sha256").update(content).digest("hex") }],
  };
}

function context(commands) {
  const providers = Object.keys(commands);
  return {
    trusted: {}, route: { mode: "single_round", minimum_heterologous: 1, initial: providers },
    selection: { providers, eligibleProfiles: providers,
      provider_identities: Object.fromEntries(providers.map((provider) => [provider, {
        source_id: `${provider}-independent-source`, config_id: `${provider}-test-config`,
      }])) },
    providerConfig: { providers: Object.fromEntries(providers.map((provider) => [provider, {
      enabled: true, command: commands[provider], model: `${provider}-test-model`,
    }])) },
  };
}

const completedOutput = "process.stdout.write(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:JSON.stringify({findings:[]})}})+'\\n');\nprocess.stdout.write(JSON.stringify({type:'turn.completed'})+'\\n');";

async function until(predicate, limitMs = 3000) {
  const deadline = Date.now() + limitMs;
  while (!predicate() && Date.now() < deadline) await sleep(20);
  expect(predicate()).toBe(true);
}

async function controlledProcess(executable, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn(executable, args, { stdio: ["ignore", "pipe", "pipe"], ...options });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (bytes) => { stdout += bytes; });
    child.stderr.on("data", (bytes) => { stderr += bytes; });
    child.once("error", reject);
    child.once("close", (exit_code, signal) => {
      const completedAt = Date.now();
      resolve({ command: [executable, ...args], cwd: options.cwd ?? null,
        pid: child.pid, exit_code, signal, stdout, stderr,
        timing: { started_at_ms: startedAt, completed_at_ms: completedAt, duration_ms: completedAt - startedAt } });
    });
  });
}

function isolatedTask({ reviewFixture = false } = {}) {
  const path = root();
  const repo = join(path, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "AC experiment"]);
  git(["config", "user.email", "ac-experiment@test.local"]);
  writeFileSync(join(repo, "README.md"), reviewFixture
    ? "Review contract: isReady must return true only for the ready state. A running state is not ready.\n"
    : "fixture\n");
  if (reviewFixture) {
    mkdirSync(join(repo, "src"));
    writeFileSync(join(repo, "src", "ready.mjs"), "export function isReady(state) { return state === 'ready'; }\n");
  }
  git(["add", "-A"]);
  git(["commit", "-qm", "fixture"]);
  const taskId = randomUUID();
  const task = createTask({ storageRoot: path,
    taskPath: join(path, "Projects", "workflowhub", "tasks", taskId),
    manifest: { schema_version: "1.0.0", execution_mode: "per_invocation",
      record_model: "vnext-single-write", project_name: "workflowhub", task_id: taskId,
      created_at: "2026-09-25T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {} } });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"])
    artifacts.writeAtomic(name, `# ${name}\n`);
  if (reviewFixture) {
    writeFileSync(join(workspace.worktreeRoot, "src", "ready.mjs"),
      "export function isReady(state) { return state !== 'failed'; }\n");
    execFileSync("git", ["add", "src/ready.mjs"], { cwd: workspace.worktreeRoot, stdio: "ignore" });
    execFileSync("git", ["-c", "user.email=ac-experiment@test.local", "-c", "user.name=AC experiment",
      "commit", "-qm", "introduce isolated review bug"], { cwd: workspace.worktreeRoot, stdio: "ignore" });
  }
  mkdirSync(join(path, "home"));
  return { path, task, workspace };
}

async function withTaskEnv(state, action) {
  const names = ["HOME", "WORKFLOWHUB_TASK_DIR", "CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH"];
  const before = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  process.env.HOME = join(state.path, "home");
  process.env.WORKFLOWHUB_TASK_DIR = state.path;
  for (const name of names.slice(2)) delete process.env[name];
  try { return await action(); }
  finally {
    for (const [name, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

describe("AC-REVIEW-006 direct executor experiments", () => {
  it.each(["build-code", "verify-code"])("ORACLE-AC006-HEALTH-%s: real child stays healthy past the old 20-minute boundary", async (stage) => {
    const path = root();
    const controlledFinding = {
      severity: "major", path: "src/reviewed.mjs", line: 1,
      issue: "The reviewed value is fixed.", root_cause: "The fixture exports a literal value.",
      recommendation: "Derive the value from the input.", evidence_kind: "direct",
      evidence: "The fixture contains `export const reviewed = true;`.",
    };
    const fastOutput = [
      JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify({ findings: [controlledFinding] }) } }),
      JSON.stringify({ type: "turn.completed" }),
    ].join("\n") + "\n";
    const fast = script(join(path, "fast"), `process.stdout.write(${JSON.stringify(fastOutput)});`);
    const slowPid = join(path, "slow.pid");
    const slow = script(join(path, "slow"), `
const fs = require('node:fs');
fs.writeFileSync(${JSON.stringify(slowPid)}, String(process.pid));
process.stdout.write(JSON.stringify({type:'thread.started'})+'\\n');
setTimeout(() => { ${completedOutput} }, 450);
`);
    const health = [];
    let settled = false;
    const pending = runConfiguredOcrHostReview({ request: request(stage), packet: packet(path) }, {
      trustedContext: context({ "codex/fast": fast, "codex/slow": slow }),
      healthPollMs: 20, onProviderHealth: (event) => health.push(event),
    }).then((value) => { settled = true; return value; });
    await until(() => existsSync(slowPid) && health.some((event) => event.provider === "codex/slow" && event.progress_events > 0));
    const pid = Number(readFileSync(slowPid, "utf8"));
    const realNow = Date.now;
    const advanced = realNow() + 21 * 60_000;
    vi.spyOn(Date, "now").mockImplementation(() => advanced);
    try {
      expect(settled).toBe(false);
      process.kill(pid, 0);
      await sleep(80);
      expect(settled).toBe(false);
      process.kill(pid, 0);
      expect(health.filter((event) => event.provider === "codex/slow" && event.status === "running" && event.liveness === true).length).toBeGreaterThan(1);
    } finally { vi.restoreAllMocks(); }
    const result = await pending;
    evidence(path, "health-result.json", {
      input: request(stage), commands: { "codex/fast": fast, "codex/slow": slow },
      simulated_clock_advance_ms: 21 * 60_000, slow_pid: pid,
      health_events: health, direct_result: result,
      controlled_provider_only: true,
    });
    expect(result).toMatchObject({ status: "available", outcome: "completed", dispatch_state: "dispatched" });
    expect(result.provider_results.map((item) => item.status)).toEqual(["completed", "completed"]);
    expect(result.provider_results[0].findings).toMatchObject([controlledFinding]);
    expect(result.findings).toMatchObject([controlledFinding]);
    expect(result.provider_results[1].execution.health).toMatchObject({ status: "completed", liveness: false });
    expect(result.provider_results[1].execution.retry.progress_events).toBeGreaterThan(0);
  });

  it.each(["build-code", "verify-code"])("ORACLE-AC006-CANCEL-%s: real provider cleanup after explicit cancellation", async (stage) => {
    const path = root();
    const pidFile = join(path, "provider.pid");
    const executable = script(join(path, "waiting"), `require('node:fs').writeFileSync(${JSON.stringify(pidFile)}, String(process.pid)); setInterval(() => {}, 1000);`);
    const controller = new AbortController();
    const pending = runConfiguredOcrHostReview({ request: request(stage), packet: packet(path), signal: controller.signal }, {
      trustedContext: context({ "codex/waiting": executable }), healthPollMs: 20,
    });
    await until(() => existsSync(pidFile));
    const pid = Number(readFileSync(pidFile, "utf8"));
    process.kill(pid, 0);
    controller.abort("explicit cancellation");
    const result = await pending;
    evidence(path, "cancel-result.json", {
      input: request(stage), command: executable, provider_pid: pid,
      explicit_abort: true, direct_result: result, controlled_provider_only: true,
    });
    expect(result).toMatchObject({ status: "unavailable", outcome: "cancelled",
      provider_results: [{ status: "cancelled", error: { code: "OCR_PROVIDER_CANCELLED" } }] });
    await until(() => { try { process.kill(pid, 0); return false; } catch (error) { return error.code === "ESRCH"; } });
  });

  it.skipIf(process.platform === "win32")("ORACLE-AC006-OWNER-LOSS: reaps a real provider after uncatchable owner loss", async () => {
    const path = root();
    const pidFile = join(path, "provider.pid");
    const executable = script(join(path, "orphan"), `require('node:fs').writeFileSync(${JSON.stringify(pidFile)}, String(process.pid)); process.on('SIGTERM', () => {}); setInterval(() => {}, 1000);`);
    const driver = `import { runConfiguredOcrHostReview } from ${JSON.stringify(new URL("../../runtime/review/ocr-delegation-adapter.mjs", import.meta.url).href)}; await runConfiguredOcrHostReview({request:${JSON.stringify(request("verify-code"))},packet:${JSON.stringify(packet(path))}},{trustedContext:${JSON.stringify(context({ "codex/orphan": executable }))}});`;
    const owner = spawn(process.execPath, ["--input-type=module", "-e", driver], { stdio: "ignore" });
    let pid = null;
    try {
      await until(() => existsSync(pidFile), 5000);
      pid = Number(readFileSync(pidFile, "utf8"));
      process.kill(pid, 0);
      owner.kill("SIGKILL");
      await until(() => { try { process.kill(pid, 0); return false; } catch (error) { return error.code === "ESRCH"; } }, 6000);
      evidence(path, "owner-loss-result.json", {
        input: request("verify-code"), command: executable, owner_pid: owner.pid,
        provider_pid: pid, owner_signal: "SIGKILL", provider_terminal: "ESRCH",
        controlled_provider_only: true,
      });
    } finally {
      if (owner.exitCode === null) owner.kill("SIGKILL");
      if (pid) { try { process.kill(pid, "SIGKILL"); } catch { /* already reaped */ } }
    }
  });
});

describe("AC-REVIEW-011 current-session fallback experiments", () => {
  it("ORACLE-AC011-BOTH-UNAVAILABLE: session calls one controlled fallback failure and discloses unverified", async () => {
    const state = isolatedTask();
    const unavailableOcr = script(join(state.path, "ocr-unavailable"), "process.stderr.write('controlled OCR unavailable\\n'); process.exit(17);");
    const fallback = script(join(state.path, "independent-fallback"),
      "process.stderr.write('controlled independent fallback unavailable\\n'); process.exit(23);");
    const inputPath = join(state.path, "review-input.json");
    writeFileSync(inputPath, JSON.stringify({ request: {
      ...request("build-code"), materials: { implementation: "current isolated fixture" },
    } }));
    const calls = [];
    await withTaskEnv(state, async () => {
      const recorded = await stageRuntimeCliMain([
        "review", "--action=record", "--stage=build-code", "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--input=${inputPath}`,
      ], { cwd: state.workspace.worktreeRoot, services: {
        resolveRouteIdentity: () => ({ route_identity: "a".repeat(64) }),
        materialIdForRequest: () => materialId,
        runOcrDelegationRound: async (ocrRequest) => {
          const execution = await controlledProcess(unavailableOcr);
          calls.push({ route: "ocr", source: ocrRequest.host_provider, execution });
          return { status: "unavailable", stage: ocrRequest.stage,
            review_scope: ocrRequest.review_scope, review_kind: null, material_id: materialId,
            runtime_id: "ocr-unavailable-experiment", outcome: "failed", dispatch_state: "dispatched",
            findings: [], provider_results: [{ provider: "codex/ocr", status: "failed",
              identity: { provider: "codex/ocr", adapter: "codex", source_id: "ocr-source", config_id: "ocr-config", model: "ocr-model" },
              error: { code: "OCR_PROVIDER_EXIT_NONZERO", message: `controlled provider exited ${execution.exit_code}` },
              timing: execution.timing, usage: null,
              evidence_anchor_valid: [] }],
            error: { code: "OCR_ALL_PROVIDERS_FAILED", message: "controlled provider unavailable" } };
        },
      } });
      const attemptRef = recorded.attempt_ref ?? recorded.review_attempt_ref;
      const attempt = attemptRef ? JSON.parse(state.task.readRecord(attemptRef)) : null;
      const result = recorded.result_ref ? JSON.parse(state.task.readRecord(recorded.result_ref)) : null;
      expect(calls).toHaveLength(1);
      expect(calls[0].execution.exit_code).toBe(17);
      expect(attempt).toMatchObject({ terminal_status: "unavailable",
        error: { code: "OCR_ALL_PROVIDERS_FAILED" } });
      expect(result).toBeNull();

      // This call models the current WorkflowHub session's conditional skill
      // invocation. Its controlled output proves transport only, never an LLM verdict.
      const alternative = await controlledProcess(fallback);
      calls.push({ route: "session-architect-code-review", source: "controlled-failure-process",
        independence_unverified: true, execution: alternative });
      const disclosure = "unverified: OCR and standalone alternative unavailable";
      const rawRecord = {
        stage: "build-code", review_scope: "phase", phase_id: "P1",
        task_id: state.task.identity.taskId, material_id: materialId,
        ocr_attempt_ref: attemptRef, ocr_terminal_status: attempt.terminal_status,
        ocr_error: attempt.error, implementer_source_id: "codex/host",
        reviewer_source_id: "controlled-failure-process",
        reviewer_independence: "not established by controlled fixture; mechanism only",
        alternative, disclosure, controlled_provider_only: true, mechanism_only: true,
      };
      const relativeSource = "qa-artifacts/ac011-both-unavailable.json";
      mkdirSync(join(state.workspace.worktreeRoot, "qa-artifacts"), { recursive: true });
      writeFileSync(join(state.workspace.worktreeRoot, relativeSource), `${JSON.stringify(rawRecord)}\n`);
      const captureInput = join(state.path, "capture-input.json");
      writeFileSync(captureInput, JSON.stringify({ source_path: relativeSource, evidence_type: "review" }));
      const captured = await stageRuntimeMain([
        "capture-evidence", "--stage=build-code", "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--input=${captureInput}`,
      ], { cwd: state.workspace.worktreeRoot });
      const capturedWrapper = JSON.parse(state.task.readRecord(captured.store_ref));
      expect(JSON.parse(Buffer.from(capturedWrapper.content_base64, "base64").toString("utf8"))).toEqual(rawRecord);
      expect(captured.store_ref).toMatch(/^quality\/evidence\//);
      expect(captured.publisher).toBe("build-code");
      expect(calls.filter((call) => call.route === "session-architect-code-review")).toHaveLength(1);
      expect(alternative.exit_code).toBe(23);
      evidence(state.path, "fallback-both-unavailable.json", {
        input: JSON.parse(readFileSync(inputPath, "utf8")),
        command: ["stageRuntimeCliMain", "review", "--action=record", "--stage=build-code",
          "--project=workflowhub", `--task=${state.task.identity.taskId}`, `--input=${inputPath}`],
        exit: 0, calls, route_response: recorded, captured, captured_wrapper: capturedWrapper,
        raw_disclosure: disclosure,
        canonical_result_ref: recorded.result_ref ?? null,
        canonical_attempt_ref: attemptRef ?? null,
        canonical_result_path: recorded.result_ref ? join(state.path, "Projects", "workflowhub", "tasks", state.task.identity.taskId, recorded.result_ref) : null,
        canonical_attempt_path: attemptRef ? join(state.path, "Projects", "workflowhub", "tasks", state.task.identity.taskId, attemptRef) : null,
        canonical_result: result, canonical_attempt: attempt,
        controlled_provider_only: true,
      });
      expect(disclosure).toMatch(/^unverified:/);
      expect(recorded.result_ref).toBeNull();
      expect(captured.store_ref).not.toMatch(/^quality\/reviews\/results\//);
    });
  });

  it.skipIf(process.env.RUN_AC011_REAL_REVIEW !== "1")(
    "ORACLE-AC011-FALLBACK-COMPLETES-REAL: fresh Architect reviewer runs once after OCR unavailable",
    async () => {
      const state = isolatedTask({ reviewFixture: true });
      const unavailableOcr = script(join(state.path, "ocr-unavailable"),
        "process.stderr.write('controlled OCR unavailable\\n'); process.exit(17);");
      const inputPath = join(state.path, "review-input.json");
      writeFileSync(inputPath, JSON.stringify({ request: {
        ...request("build-code"), materials: { implementation: "isolated committed diff HEAD^..HEAD" },
      } }));
      const calls = [];
      const recorded = await withTaskEnv(state, () => stageRuntimeCliMain([
        "review", "--action=record", "--stage=build-code", "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--input=${inputPath}`,
      ], { cwd: state.workspace.worktreeRoot, services: {
        resolveRouteIdentity: () => ({ route_identity: "c".repeat(64) }),
        materialIdForRequest: () => materialId,
        runOcrDelegationRound: async (ocrRequest) => {
          const execution = await controlledProcess(unavailableOcr);
          calls.push({ route: "ocr", execution });
          return { status: "unavailable", stage: ocrRequest.stage,
            review_scope: ocrRequest.review_scope, review_kind: null, material_id: materialId,
            runtime_id: "ocr-unavailable-real-review-experiment", outcome: "failed", dispatch_state: "dispatched",
            findings: [], provider_results: [{ provider: "codex/ocr", status: "failed",
              identity: { provider: "codex/ocr", adapter: "codex", source_id: "ocr-source", config_id: "ocr-config", model: "ocr-model" },
              error: { code: "OCR_PROVIDER_EXIT_NONZERO", message: `controlled OCR exited ${execution.exit_code}` },
              timing: execution.timing, usage: null, evidence_anchor_valid: [] }],
            error: { code: "OCR_ALL_PROVIDERS_FAILED", message: "controlled OCR unavailable" } };
        },
      } }));
      const attempt = JSON.parse(state.task.readRecord(recorded.attempt_ref));
      expect(calls).toHaveLength(1);
      expect(calls[0].execution.exit_code).toBe(17);
      expect(attempt.terminal_status).toBe("unavailable");
      expect(recorded.result_ref).toBeNull();

      const diff = execFileSync("git", ["diff", "HEAD^", "HEAD", "--", "src/ready.mjs"],
        { cwd: state.workspace.worktreeRoot, encoding: "utf8" });
      const skillText = readFileSync(new URL("../../skills/architect-code-review/SKILL.md", import.meta.url), "utf8");
      const prompt = [
        "You are a fresh independent reviewer. You did not implement this isolated fixture.",
        "Use read-only tools. Review only the committed HEAD^..HEAD change to src/ready.mjs",
        "against README.md. Return only the JSON object required by the following skill.",
        "The OCR route was unavailable; preserve that as a separate fact.",
        "Architect-Code-Review skill:", skillText,
      ].join("\n\n");
      const finalPath = join(state.path, "architect-final.json");
      const args = ["exec", "--json", "--ephemeral", "--sandbox", "read-only",
        "-C", state.workspace.worktreeRoot, "-o", finalPath, prompt];
      const reviewerEnv = { ...process.env };
      for (const key of ["CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH"])
        delete reviewerEnv[key];
      const alternative = await controlledProcess("codex", args, {
        cwd: state.workspace.worktreeRoot, env: reviewerEnv,
      });
      const reviewerThreadIds = alternative.stdout.split(/\r?\n/).flatMap((line) => {
        try {
          const event = JSON.parse(line);
          return event.type === "thread.started" && typeof event.thread_id === "string"
            ? [event.thread_id] : [];
        } catch { return []; }
      });
      const postReviewDiff = execFileSync("git", ["diff", "HEAD^", "HEAD", "--", "src/ready.mjs"],
        { cwd: state.workspace.worktreeRoot, encoding: "utf8" });
      calls.push({ route: "session-architect-code-review", source: "fresh-codex-exec",
        participated_in_implementation: false, execution: alternative });
      const finalText = existsSync(finalPath) ? readFileSync(finalPath, "utf8") : null;
      let parsed = null;
      let parseError = null;
      try { if (finalText !== null) parsed = JSON.parse(finalText); }
      catch (error) { parseError = String(error); }
      const disclosure = alternative.exit_code === 0 && Array.isArray(parsed?.findings)
        ? "OCR unavailable; independent Architect review completed; formal code_review remains unavailable"
        : "unverified: OCR unavailable and independent Architect review did not complete";
      const rawRecord = {
        task_id: state.task.identity.taskId, stage: "build-code", review_scope: "phase", phase_id: "P1",
        snapshot_tree: attempt.snapshot_tree, material_revision: attempt.material_revision,
        ocr_attempt_ref: recorded.attempt_ref, ocr_error: attempt.error,
        implementer_source_id: "fixture-author", reviewer_source_id: "fresh-codex-exec",
        reviewer_thread_id: reviewerThreadIds[0] ?? null,
        reviewer_independence: "new ephemeral read-only thread after fixture commit; diff unchanged",
        diff_sha256: createHash("sha256").update(diff).digest("hex"),
        skill_sha256: createHash("sha256").update(skillText).digest("hex"),
        invocation: alternative.command, reviewer_pid: alternative.pid,
        exit_code: alternative.exit_code, signal: alternative.signal,
        started_at_ms: alternative.timing.started_at_ms,
        completed_at_ms: alternative.timing.completed_at_ms,
        final_text_sha256: finalText === null ? null : createHash("sha256").update(finalText).digest("hex"),
        output: parsed, parse_error: parseError, disclosure,
        controlled_ocr_only: true, real_independent_reviewer: true,
      };
      const relativeSource = "qa-artifacts/ac011-real-independent.json";
      mkdirSync(join(state.workspace.worktreeRoot, "qa-artifacts"), { recursive: true });
      writeFileSync(join(state.workspace.worktreeRoot, relativeSource), `${JSON.stringify(rawRecord)}\n`);
      const captureInput = join(state.path, "capture-real-input.json");
      writeFileSync(captureInput, JSON.stringify({ source_path: relativeSource, evidence_type: "review" }));
      const captured = await withTaskEnv(state, () => stageRuntimeMain([
        "capture-evidence", "--stage=build-code", "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--input=${captureInput}`,
      ], { cwd: state.workspace.worktreeRoot }));
      evidence(state.path, "real-independent-review.json", {
        input: JSON.parse(readFileSync(inputPath, "utf8")), diff, raw_record: rawRecord,
        reviewer_stdout: alternative.stdout, reviewer_stderr: alternative.stderr,
        reviewer_final_text: finalText, calls, canonical_ocr_attempt: attempt,
        canonical_ocr_attempt_ref: recorded.attempt_ref,
        canonical_ocr_attempt_path: join(state.path, "Projects", "workflowhub", "tasks", state.task.identity.taskId, recorded.attempt_ref),
        canonical_ocr_result_ref: recorded.result_ref, captured,
        controlled_ocr_only: true, real_independent_reviewer: true,
      });
      expect(calls.filter((call) => call.route === "session-architect-code-review")).toHaveLength(1);
      expect(reviewerThreadIds).toHaveLength(1);
      expect(postReviewDiff).toBe(diff);
      expect(alternative.exit_code).toBe(0);
      expect(parseError).toBeNull();
      expect(parsed).toMatchObject({ findings: expect.any(Array) });
      expect(captured.store_ref).toMatch(/^quality\/evidence\/review\//);
      expect(recorded.result_ref).toBeNull();
    }, 240_000,
  );

  it.skipIf(process.env.RUN_AC011_VERIFY_REAL_REVIEW !== "1")(
    "ORACLE-AC011-FALLBACK-COMPLETES-VERIFY-REAL: one fresh Architect reviewer after verify-code OCR unavailable",
    async () => {
      const state = isolatedTask({ reviewFixture: true });
      const unavailableOcr = script(join(state.path, "verify-ocr-unavailable"),
        "process.stderr.write('controlled verify-code OCR unavailable\\n'); process.exit(17);");
      const inputPath = join(state.path, "verify-review-input.json");
      writeFileSync(inputPath, JSON.stringify({ request: {
        ...request("verify-code"), materials: { implementation: "isolated committed diff HEAD^..HEAD" },
      } }));
      const calls = [];
      const routeCommand = ["review", "--action=record", "--stage=verify-code", "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--input=${inputPath}`];
      let recorded;
      try {
        recorded = await withTaskEnv(state, () => stageRuntimeCliMain(routeCommand, {
          cwd: state.workspace.worktreeRoot, services: {
            resolveRouteIdentity: () => ({ route_identity: "d".repeat(64) }),
            materialIdForRequest: () => materialId,
            runOcrDelegationRound: async (ocrRequest) => {
              const execution = await controlledProcess(unavailableOcr);
              calls.push({ route: "ocr", stage: ocrRequest.stage, execution });
              return { status: "unavailable", stage: ocrRequest.stage,
                review_scope: null, review_kind: null, material_id: materialId,
                runtime_id: "verify-ocr-unavailable-isolated", outcome: "failed", dispatch_state: "dispatched",
                findings: [], provider_results: [{ provider: "codex/ocr", status: "failed",
                  identity: { provider: "codex/ocr", adapter: "codex", source_id: "ocr-source", config_id: "ocr-config", model: "ocr-model" },
                  error: { code: "OCR_PROVIDER_EXIT_NONZERO", message: `controlled OCR exited ${execution.exit_code}` },
                  timing: execution.timing, usage: null, evidence_anchor_valid: [] }],
                error: { code: "OCR_ALL_PROVIDERS_FAILED", message: "controlled verify-code OCR unavailable" } };
            },
          },
        }));
      } catch (error) {
        evidence(state.path, "verify-real-route-error.json", {
          input: JSON.parse(readFileSync(inputPath, "utf8")), route_command: routeCommand,
          calls, error: { code: error?.code ?? null, message: String(error?.message ?? error) },
          reviewer_calls: 0,
        });
        throw error;
      }
      const attemptRef = recorded.attempt_ref;
      const attempt = JSON.parse(state.task.readRecord(attemptRef));
      expect(calls).toHaveLength(1);
      expect(calls[0].execution.exit_code).toBe(17);
      expect(attempt).toMatchObject({ stage: "verify-code", review_scope: null,
        terminal_status: "unavailable", error: { code: "OCR_ALL_PROVIDERS_FAILED" } });
      expect(recorded.result_ref).toBeNull();

      const diffBefore = execFileSync("git", ["diff", "HEAD^", "HEAD", "--", "src/ready.mjs"],
        { cwd: state.workspace.worktreeRoot, encoding: "utf8" });
      const implementerCommit = execFileSync("git", ["log", "-1", "--format=%H|%an|%ae|%ct"],
        { cwd: state.workspace.worktreeRoot, encoding: "utf8" }).trim();
      const skillText = readFileSync(new URL("../../skills/architect-code-review/SKILL.md", import.meta.url), "utf8");
      const prompt = [
        "You are a fresh independent reviewer. You did not implement this isolated fixture.",
        "Use read-only tools. This is the verify-code fallback after an OCR unavailable attempt.",
        "Review only committed HEAD^..HEAD in src/ready.mjs against README.md.",
        "Return only the JSON object required by the Architect-Code-Review skill below.",
        "The OCR failure is a separate fact; do not replace or rewrite it.",
        "Architect-Code-Review skill:", skillText,
      ].join("\n\n");
      const finalPath = join(state.path, "verify-architect-final.json");
      const args = ["exec", "--json", "--ephemeral", "--sandbox", "read-only",
        "-C", state.workspace.worktreeRoot, "-o", finalPath, prompt];
      const reviewerEnv = { ...process.env };
      for (const key of ["CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH"])
        delete reviewerEnv[key];
      const alternative = await controlledProcess("codex", args, {
        cwd: state.workspace.worktreeRoot, env: reviewerEnv,
      });
      calls.push({ route: "session-architect-code-review", stage: "verify-code", execution: alternative });
      const reviewerThreadIds = alternative.stdout.split(/\r?\n/).flatMap((line) => {
        try {
          const event = JSON.parse(line);
          return event.type === "thread.started" && typeof event.thread_id === "string"
            ? [event.thread_id] : [];
        } catch { return []; }
      });
      const finalText = existsSync(finalPath) ? readFileSync(finalPath, "utf8") : null;
      let parsed = null;
      let parseError = null;
      try { if (finalText !== null) parsed = JSON.parse(finalText); }
      catch (error) { parseError = String(error); }
      const diffAfter = execFileSync("git", ["diff", "HEAD^", "HEAD", "--", "src/ready.mjs"],
        { cwd: state.workspace.worktreeRoot, encoding: "utf8" });
      const sourceLines = readFileSync(join(state.workspace.worktreeRoot, "src", "ready.mjs"), "utf8").split(/\r?\n/);
      const anchorChecks = Array.isArray(parsed?.findings) ? parsed.findings.map((finding) => ({
        path: finding.path, line: finding.line,
        expected_line: finding.path === "src/ready.mjs" ? sourceLines[finding.line - 1]?.trim() ?? null : null,
        evidence: finding.evidence ?? null,
        matches: finding.path === "src/ready.mjs" && Number.isSafeInteger(finding.line)
          && finding.line > 0 && finding.evidence === sourceLines[finding.line - 1]?.trim(),
      })) : [];
      const disclosure = alternative.exit_code === 0 && Array.isArray(parsed?.findings)
        ? "verify-code OCR unavailable; one independent Architect reviewer completed; formal code_review remains unavailable"
        : "unverified: verify-code OCR and independent Architect review unavailable";
      const raw = {
        task_id: state.task.identity.taskId, stage: "verify-code", review_scope: null,
        material_id: materialId, snapshot_tree: attempt.snapshot_tree,
        material_revision: attempt.material_revision,
        ocr_attempt_ref: attemptRef,
        ocr_attempt_path: join(state.path, "Projects", "workflowhub", "tasks", state.task.identity.taskId, attemptRef),
        ocr_attempt: attempt, ocr_result_ref: recorded.result_ref,
        implementer_commit: implementerCommit,
        reviewer_actor: { kind: "codex-exec", thread_id: reviewerThreadIds[0] ?? null,
          pid: alternative.pid, ephemeral: true, read_only: true, started_after_implementation: true },
        diff_before_sha256: createHash("sha256").update(diffBefore).digest("hex"),
        diff_after_sha256: createHash("sha256").update(diffAfter).digest("hex"),
        skill_sha256: createHash("sha256").update(skillText).digest("hex"),
        calls: calls.map(({ route, stage, execution }) => ({ route, stage,
          command: execution.command, cwd: execution.cwd, pid: execution.pid,
          exit_code: execution.exit_code, signal: execution.signal, timing: execution.timing })),
        reviewer_stdout: alternative.stdout, reviewer_stderr: alternative.stderr,
        final_text: finalText, parsed_output: parsed, parse_error: parseError,
        finding_anchor_checks: anchorChecks, disclosure,
        controlled_ocr_only: true, real_independent_reviewer: true,
      };
      evidence(state.path, "verify-real-independent-review.json", raw);
      expect(calls.filter((call) => call.route === "session-architect-code-review")).toHaveLength(1);
      expect(reviewerThreadIds).toHaveLength(1);
      expect(alternative.exit_code).toBe(0);
      expect(diffAfter).toBe(diffBefore);
      expect(parseError).toBeNull();
      expect(parsed).toMatchObject({ findings: expect.any(Array) });
      expect(anchorChecks.length).toBeGreaterThan(0);
      expect(anchorChecks.every((item) => item.matches)).toBe(true);
      expect(recorded.result_ref).toBeNull();
    }, 240_000,
  );

  it("ORACLE-AC011-VERIFY-CAPTURE-BOUNDARY: existing capture does not accept verify-code", async () => {
    const state = isolatedTask();
    const source = join(state.workspace.worktreeRoot, "alternative.json");
    writeFileSync(source, JSON.stringify({ controlled_provider_only: true }));
    const input = join(state.path, "verify-capture-input.json");
    writeFileSync(input, JSON.stringify({ source_path: "alternative.json", evidence_type: "review" }));
    await withTaskEnv(state, async () => {
      await expect(stageRuntimeMain([
        "capture-evidence", "--stage=verify-code", "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--input=${input}`,
      ], { cwd: state.workspace.worktreeRoot })).rejects.toThrow(/capture-evidence requires --stage=build-code/);
      evidence(state.path, "verify-capture-boundary.json", {
        command: ["capture-evidence", "--stage=verify-code", "--project=workflowhub",
          `--task=${state.task.identity.taskId}`, `--input=${input}`],
        outcome: "rejected", reason: "capture-evidence requires --stage=build-code",
        controlled_provider_only: true,
      });
    });
  });
});
