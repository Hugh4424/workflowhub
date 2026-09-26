import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";

const evidenceDir = fileURLToPath(new URL("../../.cache/card05-experiments/ac001-013/", import.meta.url));
const targetedCommand = process.env.OCR_EXPERIMENT_COMMAND ?? null;
const experimentRunId = randomUUID();
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function writeEvidence(label, evidence) {
  mkdirSync(evidenceDir, { recursive: true });
  const bytes = JSON.stringify({ ...evidence, run_id: experimentRunId }, null, 2) + "\n";
  const digest = sha256(bytes);
  const path = join(evidenceDir, `${label}-${experimentRunId}-${digest.slice(0, 16)}.json`);
  writeFileSync(path, bytes, { flag: "wx" });
  console.log(`OCR_EXPERIMENT_EVIDENCE ${path} sha256=${digest}`);
  return path;
}

// These are transport experiments with deterministic providers, not LLM quality reviews.
// The isolated stores and invocation logs are intentionally retained for source readback.
function fixture(label, { missingProfile = false, disableConfigured = false, mode = "full_only" } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), `ocr-ac001-013-${label}-`)));
  const repo = join(root, "repo");
  mkdirSync(join(repo, "src"), { recursive: true });
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init", "-q", "-b", "main");
  git("config", "user.name", "OCR experiment");
  git("config", "user.email", "ocr-experiment@workflowhub.local");
  writeFileSync(join(repo, "src", "reviewed.mjs"), "export const value = 1;\n");
  git("add", ".");
  git("commit", "-qm", "experiment baseline");

  const taskId = randomUUID();
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId,
      created_at: "2026-09-25T00:00:00.000Z", target_repo_root: repo,
      issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  for (const name of ["decision-log.md", "plan.md", "tasks.md"]) artifacts.writeAtomic(name, `# ${name}\n`);
  artifacts.writeAtomic("spec.md", "# Spec\n\n- AC-REVIEW-001: independent dispatch\n- AC-REVIEW-013: plain path dispatch\n");
  writeFileSync(join(workspace.worktreeRoot, "src", "reviewed.mjs"), "export const value = 2;\n");
  writeFileSync(join(workspace.worktreeRoot, "experiment-test-evidence.txt"),
    "Controlled transport experiment only; no LLM quality verdict or test pass is claimed.\n");
  writeFileSync(join(workspace.worktreeRoot, "experiment-ac.md"),
    "AC-REVIEW-001: independent dispatch.\nAC-REVIEW-013: plain path dispatch.\n");

  const home = join(root, "home");
  const hostDir = join(home, ".config", "workflowhub");
  const attachments = join(root, "attachments");
  mkdirSync(hostDir, { recursive: true });
  mkdirSync(attachments);
  const providerConfigPath = join(root, "providers.json");
  const profiles = {
    "codex/luna": { enabled: !disableConfigured, model: "controlled-codex", source_id: "controlled/codex" },
    ...(missingProfile ? {} : { "kimi/coding": { enabled: true, model: "controlled-kimi", source_id: "controlled/kimi" } }),
  };
  writeFileSync(providerConfigPath, JSON.stringify({
    tiers: [["codex/luna", "kimi/coding"]], providers: profiles,
    attachment_roots: [{ root: attachments, sources: [".wh-review-packets"] }],
  }));
  writeFileSync(join(hostDir, "config.json"), JSON.stringify({
    task_dir: root,
    third_review: { command: ["/unused/controlled-provider"], config: providerConfigPath, attachment_root: attachments },
    wh_review: { version: 2, stages: {
      "build-code": { initial: ["codex/luna", "kimi/coding"], mode, minimum_heterologous: 1 },
      "verify-code": { initial: ["codex/luna", "kimi/coding"], mode: "single_round", minimum_heterologous: 1 },
    } },
  }));
  return { root, home, task, workspace, callsPath: join(root, "controlled-provider-calls.jsonl") };
}

const plainMaterials = (state) => ({
  approved_spec: `specs/${state.task.identity.taskId}/spec.md`,
  acceptance_criteria: "experiment-ac.md",
  test_evidence: "experiment-test-evidence.txt",
});

async function record(state, label, request) {
  const inputPath = join(state.root, `${label}-input.json`);
  writeFileSync(inputPath, JSON.stringify({ request }, null, 2) + "\n");
  const args = [
    "review", "--action=record", `--stage=${request.stage}`, "--project=workflowhub",
    `--task=${state.task.identity.taskId}`, `--input=${inputPath}`,
  ];
  const oldHome = process.env.HOME;
  const oldTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
  process.env.HOME = state.home;
  process.env.WORKFLOWHUB_TASK_DIR = state.root;
  let calls = 0;
  try {
    const recorded = await stageRuntimeCliMain(args, {
      cwd: state.workspace.worktreeRoot,
      services: {
        onOcrProviderHealth: () => {},
        ocrProviderExecutor: async ({ provider, cwd, promptPath }) => {
          calls++;
          const event = { provider, cwd, promptPath, prompt_exists: readFileSync(promptPath, "utf8").includes("Selected packet files") };
          writeFileSync(state.callsPath, JSON.stringify(event) + "\n", { flag: "a" });
          return provider === "codex/luna"
            ? { status: "completed", output: JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify({ findings: [] }) } }) + "\n"
                + JSON.stringify({ type: "turn.completed", usage: { input_tokens: 1 } }) + "\n" }
            : { status: "failed", error: { code: "CONTROLLED_PROVIDER_UNAVAILABLE", message: "controlled unavailable route" } };
        },
      },
    });
    const attemptRaw = state.task.readRecord(recorded.attempt_ref);
    const resultRaw = recorded.result_ref ? state.task.readRecord(recorded.result_ref) : null;
    const attempt = JSON.parse(attemptRaw);
    const result = resultRaw === null ? null : JSON.parse(resultRaw);
    const refs = { input: inputPath, task_store: state.task.taskPath,
      attempt: state.task.recordPath(recorded.attempt_ref),
      result: recorded.result_ref ? state.task.recordPath(recorded.result_ref) : null,
      calls: existsSync(state.callsPath) ? state.callsPath : null };
    writeFileSync(join(state.root, `${label}-readback.json`), JSON.stringify({ refs, recorded, attempt, result }, null, 2) + "\n");
    writeEvidence(label, { kind: "controlled_review_transport_experiment", quality_verdict: null,
      command: targetedCommand,
      public_call: args, public_call_exit: 0, refs,
      hashes: { input_sha256: sha256(readFileSync(inputPath)), attempt_sha256: sha256(attemptRaw),
        result_sha256: resultRaw === null ? null : sha256(resultRaw),
        calls_sha256: refs.calls === null ? null : sha256(readFileSync(state.callsPath)) },
      provider_calls: calls, attempt, result });
    console.log(`OCR_EXPERIMENT ${label} exit=0 ${JSON.stringify(refs)}`);
    return { calls, attempt, result, refs };
  } catch (error) {
    writeFileSync(join(state.root, `${label}-error.json`), JSON.stringify({ input: inputPath, args, calls, error: { code: error.code, message: error.message } }, null, 2) + "\n");
    writeEvidence(label, { kind: "controlled_review_transport_experiment", quality_verdict: null,
      command: targetedCommand,
      public_call: args, public_call_exit: 1,
      refs: { input: inputPath, task_store: state.task.taskPath, error: join(state.root, `${label}-error.json`), calls: state.callsPath },
      input_sha256: sha256(readFileSync(inputPath)), provider_calls: calls,
      error: { code: error.code ?? null, message: error.message } });
    console.log(`OCR_EXPERIMENT ${label} exit=1 root=${state.root} calls=${calls} error=${error.message}`);
    throw error;
  } finally {
    if (oldHome === undefined) delete process.env.HOME; else process.env.HOME = oldHome;
    if (oldTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = oldTaskDir;
  }
}

const phaseRequest = (state, materials = plainMaterials(state)) => ({
  stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1",
  host_provider: "claude-code/host", materials,
});

// These are separate public requests because snapshot/material revision are host-owned
// and cannot form a valid caller-supplied "all fields present" baseline.
const absentCallerPreconditions = [
  ["material-identity", ["material_id", "material_revision"], "P2"],
  ["hash", ["material_hash", "content_hash", "content_sha256"], "P3"],
  ["sha", ["sha", "sha256", "source_sha"], "P4"],
  ["snapshot", ["snapshot_tree", "snapshot_ref"], "P5"],
  ["receipt", ["receipt_ref", "receipt", "reviewed_execution"], "P6"],
];

describe("AC-REVIEW-001/013 isolated public review experiments", () => {
  const ac013AttemptPaths = new Set();
  it("ORACLE-AC001-configured: dispatches each initial route once and reads back the canonical pair", async () => {
    const state = fixture("configured");
    const { calls, attempt, result, refs } = await record(state, "configured", phaseRequest(state));
    expect(calls).toBe(2);
    expect(attempt.provider_attempts.map((item) => item.provider)).toEqual(["codex/luna", "kimi/coding"]);
    expect(attempt.provider_attempts.map((item) => item.status)).toEqual(["completed", "failed"]);
    expect(result.provider_results.map((item) => item.provider)).toEqual(["codex/luna"]);
    expect(state.task.recordPath(result.attempt_ref)).toBe(refs.attempt);
    expect(result.findings).toEqual([]); // Controlled output is no quality verdict.
  });

  it("ORACLE-AC001-unconfigured: does not let an unconfigured sibling suppress a configured route", async () => {
    const state = fixture("missing-profile", { missingProfile: true });
    const { calls, attempt } = await record(state, "missing-profile", phaseRequest(state));
    expect(calls).toBe(1);
    expect(attempt.provider_attempts.map((item) => item.provider)).toEqual(["codex/luna", "kimi/coding"]);
  });

  it("ORACLE-AC001-all-unavailable: keeps failed route facts without a clean result", async () => {
    const state = fixture("all-unavailable", { missingProfile: true, disableConfigured: true });
    const { calls, attempt, result } = await record(state, "all-unavailable", phaseRequest(state));
    expect(calls).toBe(0);
    expect(attempt).toMatchObject({ terminal_status: "unavailable" });
    expect(attempt.provider_attempts.map((item) => item.error?.code))
      .toEqual(["OCR_PROVIDER_CONFIG_INVALID", "OCR_PROVIDER_CONFIG_INVALID"]);
    expect(attempt.provider_attempts.every((item) => item.output_ref === null
      && item.execution.timing.started_at_ms === null)).toBe(true);
    expect(result).toBeNull();
  });

  it("ORACLE-AC001-single-round: dispatches only the two configured initial routes", async () => {
    const state = fixture("single-round");
    const request = {
      stage: "verify-code", subject_kind: "worktree", host_provider: "claude-code/host",
      materials: {
        changed_files: "src/reviewed.mjs",
        implementation_assessment: "Controlled transport experiment; no quality judgment.",
        test_context: "Only this isolated Vitest case is in scope.",
        open_risks: "The controlled provider does not inspect implementation quality.",
        acceptance_criteria: "AC-REVIEW-001: independent dispatch. AC-REVIEW-013: plain path dispatch.",
      },
    };
    const { calls, attempt, result } = await record(state, "single-round", request);
    expect(calls).toBe(2);
    expect(attempt.provider_attempts.map((item) => item.status)).toEqual(["completed", "failed"]);
    expect(result.provider_results.map((item) => item.provider)).toEqual(["codex/luna"]);
  });

  it("ORACLE-AC001-mode: rejects a wrong mode before dispatch without extra routes", async () => {
    const state = fixture("wrong-mode", { mode: "single_round" });
    const { calls, attempt, result } = await record(state, "wrong-mode", phaseRequest(state));
    expect(calls).toBe(0);
    expect(result).toBeNull();
    expect(attempt.error.message).toMatch(/mode must be full_only/);
  });

  it("ORACLE-AC013-plain-path: dispatches without caller identity/hash/sha/snapshot/receipt facts", async () => {
    const state = fixture("plain-path");
    const input = phaseRequest(state);
    expect(Object.keys(input).sort()).toEqual(["host_provider", "materials", "phase_id", "review_scope", "stage", "subject_kind"]);
    const { calls, attempt, result, refs } = await record(state, "plain-path", input);
    expect(calls).toBe(2);
    expect(JSON.parse(readFileSync(refs.input, "utf8")).request.materials).toEqual(plainMaterials(state));
    for (const path of Object.values(input.materials)) expect(existsSync(join(state.workspace.worktreeRoot, path))).toBe(true);
    expect(attempt).toMatchObject({ task_id: state.task.identity.taskId, stage: "build-code", dispatch_state: "dispatched" });
    expect(state.task.recordPath(result.attempt_ref)).toBe(refs.attempt);
  });

  it.each(absentCallerPreconditions)(
    "ORACLE-AC013-no-%s: a separate path-only request dispatches and persists its attempt",
    async (label, fields, phaseId) => {
      const state = fixture(`no-${label}`);
      const request = phaseRequest(state);
      request.phase_id = phaseId;
      const inputFields = JSON.parse(JSON.stringify(request));
      for (const field of fields) expect(inputFields).not.toHaveProperty(field);
      for (const path of Object.values(request.materials)) {
        expect(existsSync(join(state.workspace.worktreeRoot, path))).toBe(true);
      }
      const { calls, attempt, result, refs } = await record(state, `no-${label}`, request);
      expect(calls).toBe(2);
      expect(JSON.parse(readFileSync(refs.input, "utf8")).request).toEqual(inputFields);
      expect(attempt).toMatchObject({
        task_id: state.task.identity.taskId, phase_id: request.phase_id,
        dispatch_state: "dispatched", provider_attempts: [
          { provider: "codex/luna", status: "completed" },
          { provider: "kimi/coding", status: "failed" },
        ],
      });
      expect(state.task.recordPath(result.attempt_ref)).toBe(refs.attempt);
      expect(refs.result).not.toBeNull();
      expect(ac013AttemptPaths.has(refs.attempt)).toBe(false);
      ac013AttemptPaths.add(refs.attempt);
    },
  );

  it("ORACLE-AC013-hash-negative: does not require a caller content hash for a readable path", async () => {
    const state = fixture("wrong-content-hash");
    const request = { ...phaseRequest(state), content_sha256: "0".repeat(64) };
    expect(request.content_sha256).not.toBe(sha256(readFileSync(join(state.workspace.worktreeRoot, request.materials.acceptance_criteria))));
    const { calls, attempt, result, refs } = await record(state, "wrong-content-hash", request);
    expect(calls).toBe(2);
    expect(attempt.dispatch_state).toBe("dispatched");
    expect(state.task.recordPath(result.attempt_ref)).toBe(refs.attempt);
  });
});
