import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, realpathSync, readdirSync, lstatSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeOfficialComponentReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { captureExecutionSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const FIXTURE_ROOT = resolve(ROOT, "tests/fixtures/public-behavior-baseline/v1");
const MANIFEST = join(FIXTURE_ROOT, "manifest.json");
const BASELINE_PATH = "tests/fixtures/public-behavior-baseline/v1";
const BEHAVIORS = Object.freeze(["doctor", "status", "run", "review", "verify", "confirm", "authorize"]);
const PROBES = Object.freeze(["help", ...BEHAVIORS]);
export const COMPARISON_CLASSES = Object.freeze(["preserved", "approved_internal_change", "approved_bug_fix", "behavior_regression"]);
const SHA256 = /^[a-f0-9]{64}$/;

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function assertBehavior(value) {
  if (!BEHAVIORS.includes(value)) throw new TypeError(`unknown public behavior: ${value}`);
  return value;
}

function normalize(value) {
  return String(value)
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\/Users\/[^\s'"`]+/g, "<PATH>")
    .replace(/\/private\/var\/folders\/[^\s'"`]+/g, "<PATH>")
    .replace(/\/(?:private\/)?tmp\/[^\s'"`]+/g, "<PATH>")
    .replace(/[A-Fa-f0-9]{64}/g, "<SHA256>")
    .replace(/[A-Fa-f0-9]{40}/g, "<GIT_OID>")
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "<UUID>")
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g, "<TIME>")
    .replace(/\b\d+(?:\.\d+)?ms\b/g, "<DURATION>");
}

function runCli(root, args, { env = {}, cwd = root } = {}) {
  const entrypoint = existsSync(join(root, "tools/cli/stage-runtime.mjs"))
    ? "tools/cli/stage-runtime.mjs"
    : existsSync(join(root, "scripts/stage-runtime.mjs"))
      ? "scripts/stage-runtime.mjs"
      : null;
  if (entrypoint === null) throw new Error(`baseline runner entrypoint is missing under ${root}`);
  const result = spawnSync(process.execPath, [entrypoint, ...args], {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      ...env,
      TERM: "dumb",
    },
  });
  const rawStdout = result.stdout ?? "";
  const rawStderr = result.stderr ?? "";
  const stdout = normalize(rawStdout);
  const stderr = normalize(rawStderr);
  return {
    status: result.status,
    signal: result.signal,
    stdout,
    stderr,
    json: (() => { try { return JSON.parse(rawStdout); } catch { return null; } })(),
    hashes: {
      raw_stdout_sha256: sha256(rawStdout),
      raw_stderr_sha256: sha256(rawStderr),
      normalized_stdout_sha256: sha256(stdout),
      normalized_stderr_sha256: sha256(stderr),
    },
  };
}

function listFiles(root, prefix = "") {
  if (!existsSync(root)) return [];
  const files = [];
  for (const name of readdirSync(root).sort()) {
    const absolute = join(root, name);
    const relativeName = prefix ? `${prefix}/${name}` : name;
    if (lstatSync(absolute).isDirectory()) files.push(...listFiles(absolute, relativeName));
    else files.push(relativeName);
  }
  return files;
}

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function prepareIsolatedCase(root, behavior, variant = "default") {
  const caseRoot = mkdtempSync(join(realpathSync("/tmp"), "workflowhub-public-behavior-case-"));
  const home = join(caseRoot, "home");
  const storage = join(caseRoot, "storage");
  const repo = join(caseRoot, "repo");
  mkdirSync(home, { recursive: true });
  mkdirSync(storage, { recursive: true });
  mkdirSync(repo, { recursive: true });
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.name", "WorkflowHub Baseline"]);
  git(repo, ["config", "user.email", "baseline@workflowhub.local"]);
  const task = `public-behavior-${behavior}-${variant}`;
  const artifactRoot = join(repo, "specs", task);
  mkdirSync(artifactRoot, { recursive: true });
  const materials = {
    "decision-log.md": "# fixed baseline decision log\n\nR-001 原始需求；D-001 当前决定。\n",
    "spec.md": "# fixed baseline spec\n\nFR-FIX-001 当前功能要求。\n\n- [ ] **AC-001**：当前功能结果可验证。\n",
    "plan.md": "# fixed baseline plan\n\n当前计划复用现有入口。\n",
    "tasks.md": "# fixed baseline tasks\n\nT001 当前任务。\n",
  };
  for (const [name, content] of Object.entries(materials)) writeFileSync(join(artifactRoot, name), content, "utf8");
  writeFileSync(join(repo, "README.md"), "fixed baseline repository\n", "utf8");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "fixed public behavior baseline"]);
  const env = {
    HOME: home,
    WORKFLOWHUB_TASK_DIR: storage,
    WORKFLOWHUB_PROJECT_KEY: "Baseline",
    // Each baseline case owns and deletes its temporary task root.  Do not
    // inherit the parent Codex session identity or the first case would bind
    // the live session to a path that the case cleanup removes.
    CODEX_SESSION_ID: "",
    CODEX_THREAD_ID: "",
  };
  const bootstrap = execFileSync(process.execPath, [
    "tools/cli/task-bootstrap.mjs",
    "--project=Baseline",
    `--task=${task}`,
    `--target-repo=${repo}`,
  ], { cwd: root, env: { ...process.env, ...env }, encoding: "utf8" });
  const taskPath = JSON.parse(bootstrap).task_path;
  return { caseRoot, repo, env, project: "Baseline", task, taskPath };
}

function setupAction(root, state, args) {
  return runCli(root, args, { env: state.env });
}

function requireSuccessfulSetup(result, label) {
  if (result.status !== 0) throw new Error(`${label} failed: ${result.stderr || result.stdout}`);
  return result;
}

function collectCase(root, behavior, variant = "default", { stageOutcomeWriter = null } = {}) {
  const state = prepareIsolatedCase(root, behavior, variant);
  try {
    const common = [`--project=${state.project}`, `--task=${state.task}`];
    let action;
    let stage = "make-decision";
    let inputPath;
    let setup = [];
    if (behavior === "doctor") {
      action = "workspace";
    } else if (behavior === "status") {
      action = "begin";
    } else if (behavior === "run") {
      action = "execute";
      stage = "build-code";
      setup.push(requireSuccessfulSetup(
        setupAction(root, state, ["doctor", "--action=workspace", "--stage=make-decision", ...common]),
        `run ${variant} workspace setup`,
      ));
      const task = openTask(state.taskPath, state.project, state.task);
      const workspace = openCurrentTaskWorkspace(task);
      const implementation = writeOfficialComponentReceipt({
        task,
        workspace,
        stage,
        component: "implementation",
        payload: {},
      });
      const testInputPath = join(state.caseRoot, `run-tests-${variant}.json`);
      writeFileSync(testInputPath, `${JSON.stringify({
        command: "true",
        receipt_ref: `quality/tests/baseline-run-${variant}.json`,
        output_ref: `quality/tests/output/baseline-run-${variant}.output`,
      }, null, 2)}\n`, "utf8");
      const tests = requireSuccessfulSetup(
        setupAction(root, state, ["verify", "--action=execute", `--stage=${stage}`, ...common, `--input=${testInputPath}`]),
        `run ${variant} test setup`,
      );
      setup.push(tests);
      const stageOutcome = typeof stageOutcomeWriter === "function"
        ? stageOutcomeWriter({ root, state, stage, task, workspace, implementation, tests })
        : null;
      inputPath = join(state.caseRoot, `run-${variant}.json`);
      writeFileSync(inputPath, `${JSON.stringify({
        receipts: {
          implementation: implementation.ref,
          tests: tests.json.receipt_ref,
          ...(stageOutcome?.ref ? { stage_outcomes: stageOutcome.ref } : {}),
        },
      }, null, 2)}\n`, "utf8");
    } else if (behavior === "review") {
      action = "risk";
      stage = "build-spec";
      setup.push(requireSuccessfulSetup(
        setupAction(root, state, ["doctor", "--action=workspace", "--stage=make-decision", ...common]),
        `review ${variant} workspace setup`,
      ));
      const task = openTask(state.taskPath, state.project, state.task);
      const workspace = openCurrentTaskWorkspace(task);
      const reviewRef = `quality/reviews/results/baseline-review-${variant}.json`;
      const reviewPath = join(state.taskPath, reviewRef);
      mkdirSync(dirname(reviewPath), { recursive: true });
      writeFileSync(reviewPath, `${JSON.stringify({
        task_id: state.task,
        stage,
        snapshot_tree: captureExecutionSnapshot(workspace.worktreeRoot).tree,
        verdict: "pass",
        adjudication: { clusters: [] },
      }, null, 2)}\n`, "utf8");
      inputPath = join(state.caseRoot, "review-risk.json");
      writeFileSync(inputPath, `${JSON.stringify({ review_result_ref: reviewRef }, null, 2)}\n`, "utf8");
    } else if (behavior === "verify") {
      action = "execute";
      stage = "verify-code";
      setup.push(requireSuccessfulSetup(
        setupAction(root, state, ["doctor", "--action=workspace", "--stage=make-decision", ...common]),
        `verify ${variant} workspace setup`,
      ));
      inputPath = join(state.caseRoot, "verify.json");
      const command = variant === "default" ? "true" : "node -e \"process.stdout.write('fixed-baseline-alternate')\"";
      writeFileSync(inputPath, `${JSON.stringify({ command, receipt_ref: `quality/tests/baseline-verify-${variant}.json`, output_ref: `quality/tests/output/baseline-verify-${variant}.output` }, null, 2)}\n`, "utf8");
    } else if (behavior === "confirm") {
      action = "decision";
    } else if (behavior === "authorize") {
      action = "commit";
      const confirmation = setupAction(root, state, ["confirm", "--action=decision", ...common, "--stage=make-decision", "--attempt=HEAD", "--decision=accepted", "--reply-text=fixture authorize confirmation", "--step-slug=approve-decision"]);
      setup.push(confirmation);
      if (confirmation.status !== 0 || !confirmation.json?.ref) throw new Error("baseline authorize setup could not publish confirmation");
      state.confirmationRef = confirmation.json.ref;
    } else {
      throw new TypeError(`unknown public behavior: ${behavior}`);
    }
    const args = [behavior, `--action=${action}`, ...common, `--stage=${stage}`];
    if (behavior === "status") args.push("--reason=fixed baseline begin");
    if (behavior === "run") args.push(`--input=${inputPath}`);
    if (behavior === "review") args.push(`--input=${inputPath}`);
    if (behavior === "verify") args.push(`--input=${inputPath}`);
    if (behavior === "confirm") args.push("--decision=accepted", `--reply-text=fixture confirmation ${variant}`, "--step-slug=approve-decision");
    if (behavior === "authorize") args.push(`--subject-ref=${state.confirmationRef}`);
    const result = runCli(root, args, { env: state.env });
    const writeSet = listFiles(state.taskPath);
    const input = inputPath
      ? { ref: relative(state.caseRoot, inputPath), sha256: sha256(readFileSync(inputPath)) }
      : behavior === "confirm" || behavior === "authorize"
        ? { confirmation_ref: state.confirmationRef ?? null }
        : null;
    const writeSetContent = writeSet.map((ref) => ({ ref, sha256: sha256(readFileSync(join(state.taskPath, ref))) }));
    return {
      case_id: variant,
      action,
      argv: args.map((value) => normalize(value)),
      input,
      setup,
      write_set: writeSet,
      write_set_content: writeSetContent,
      write_set_content_hash: sha256(JSON.stringify(writeSetContent)),
      public_write_set: writeSet
        .filter((ref) => !["facts.jsonl", "index.json", "quality/verify.json"].includes(ref))
        .map((ref) => normalize(ref)),
      result,
    };
  } finally {
    rmSync(state.caseRoot, { recursive: true, force: true });
  }
}

export function collectBehaviorEvidence(root = ROOT, options = {}) {
  const entries = {};
  entries.help = runCli(root, ["help"]);
  for (const behavior of BEHAVIORS) {
    assertBehavior(behavior);
    entries[behavior] = {
      cases: [
        collectCase(root, behavior, "default", options),
        collectCase(root, behavior, "alternate", options),
      ],
    };
  }
  return entries;
}

function resolveCommit(commit) {
  return execFileSync("git", ["rev-parse", "--verify", `${commit}^{commit}`], { cwd: ROOT, encoding: "utf8" }).trim();
}

function frozenBaseline() {
  const path = join(ROOT, BASELINE_PATH, "baseline.json");
  if (!existsSync(path)) throw new Error("frozen public behavior baseline is missing");
  return readJson(path);
}

function writeEvidence(kind, value) {
  const path = join(FIXTURE_ROOT, `${kind}.json`);
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(path, raw, "utf8");
  return { path: relative(ROOT, path), sha256: sha256(raw) };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function semanticProjection(value) {
  const clone = structuredClone(value);
  const strip = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(strip);
      return;
    }
    delete node.hashes;
    delete node.write_set;
    delete node.write_set_content;
    delete node.write_set_content_hash;
    Object.values(node).forEach(strip);
  };
  strip(clone);
  return clone;
}

function validateCaseEvidence(caseValue, label, errors) {
  if (typeof caseValue?.case_id !== "string" || caseValue.case_id.trim() === "") errors.push(`${label}: case_id is missing`);
  if (!Array.isArray(caseValue?.write_set) || !Array.isArray(caseValue?.write_set_content)) errors.push(`${label}: write-set evidence is missing`);
  if (!SHA256.test(caseValue?.write_set_content_hash ?? "")) errors.push(`${label}: write-set content hash is invalid`);
  if (Array.isArray(caseValue?.write_set_content) && sha256(JSON.stringify(caseValue.write_set_content)) !== caseValue.write_set_content_hash) errors.push(`${label}: write-set content hash mismatch`);
}

export function classifyComparison({ probe, baseline, candidate } = {}) {
  const candidateResult = probe === "help" ? candidate : candidate?.result;
  if (candidateResult?.status !== 0) return "behavior_regression";
  if (JSON.stringify(semanticProjection(baseline)) === JSON.stringify(semanticProjection(candidate))) return "preserved";
  const baselineText = JSON.stringify(baseline);
  if (probe === "help"
      && JSON.stringify(candidateResult?.json?.behaviors) === JSON.stringify(BEHAVIORS)
      && Object.keys(candidateResult?.json?.actions ?? {}).every((behavior) => BEHAVIORS.includes(behavior))) {
    return "approved_internal_change";
  }
  if (probe === "run" && /legacy attempt writer is unavailable for vNext tasks/.test(baselineText)
      && !/legacy attempt writer is unavailable for vNext tasks/.test(JSON.stringify(candidate))) return "approved_bug_fix";
  if (probe === "run"
      && baseline.action === "scope"
      && candidate.action === "execute"
      && candidate.result?.json?.schema_version === "stage-runtime-result.vnext"
      && candidate.result?.json?.stage === "build-code") {
    return "approved_internal_change";
  }
  if (probe === "doctor"
      && candidate.result?.json?.stage === "make-decision"
      && typeof candidate.result?.json?.worktree_root === "string"
      && typeof candidate.result?.json?.baseline_commit === "string") {
    return "approved_internal_change";
  }
  if (probe === "status"
      && new Set(["ready", "blocked_by_missing_material"]).has(candidate.result?.json?.work_status)
      && new Set(["in_progress", "completed"]).has(candidate.result?.json?.quality_status)
      && candidate.result?.json?.quality_predicates
      && !candidate.public_write_set?.some((ref) => ref.startsWith("runs/"))) {
    return "approved_internal_change";
  }
  if (probe === "review"
      && candidate.action === "risk"
      && candidate.result?.json?.status === "continue") {
    return "approved_internal_change";
  }
  if (probe === "verify"
      && candidate.result?.json?.schema_version === "workflowhub-receipt.v1"
      && typeof candidate.result?.json?.source_digest === "string") {
    return "approved_internal_change";
  }
  if (probe === "confirm"
      && new Set(["human-confirmation.v2", "human-confirmation.v3"]).has(candidate.result?.json?.value?.schema_version)
      && /^(?:quality\/confirmations|evidence\/confirmations)\//.test(String(candidate.result?.json?.ref ?? ""))) {
    return "approved_internal_change";
  }
  // Authorization used to fail in the retired full-audit writer. The vNext
  // authorization fact is the deliberate replacement and must be visible as
  // a bug fix, not mistaken for a public behavior regression.
  if (probe === "authorize"
      && /full audit writer is only valid for a bounded human-confirmation attempt/.test(baselineText)
      && ["authorization.v2", "irreversible-authorization.v1"].includes(candidate.result?.json?.value?.schema_version)) {
    return "approved_bug_fix";
  }
  return "behavior_regression";
}

export function capture({ baseline = "HEAD", root = ROOT } = {}) {
  const commit = resolveCommit(baseline);
  const baselineEvidence = frozenBaseline();
  const candidateEvidence = collectBehaviorEvidence(root);
  mkdirSync(FIXTURE_ROOT, { recursive: true });
  const baselineFile = { path: `${BASELINE_PATH}/baseline.json`, sha256: sha256(readFileSync(join(FIXTURE_ROOT, "baseline.json"))) };
  const candidateFile = writeEvidence("candidate", candidateEvidence);
  const manifest = {
    schema_version: "workflowhub-public-behavior-baseline.v1",
    baseline_commit: commit,
    collector: {
      path: "tools/architecture/public-behavior-baseline.mjs",
      sha256: sha256(readFileSync(join(root, "tools/architecture/public-behavior-baseline.mjs"))),
    },
    runtime: { node: process.version, platform: process.platform, runner_contract: "local-stage-runtime" },
    behaviors: BEHAVIORS,
    probes: PROBES,
    baseline: baselineFile,
    candidate: candidateFile,
    normalization: "ANSI, absolute paths, hashes, UUIDs, timestamps and durations are tokenized",
  };
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

export function verify({ root = ROOT } = {}) {
  const manifest = readJson(MANIFEST);
  const errors = [];
  if (manifest.schema_version !== "workflowhub-public-behavior-baseline.v1") errors.push("invalid baseline schema");
  if (!SHA256.test(manifest.baseline?.sha256 ?? "") || !SHA256.test(manifest.candidate?.sha256 ?? "")) errors.push("baseline evidence hashes are invalid");
  if (JSON.stringify(manifest.behaviors) !== JSON.stringify(BEHAVIORS)) errors.push("public behavior set is not the frozen seven-behavior set");
  if (!SHA256.test(manifest.collector?.sha256 ?? "") || manifest.collector?.path !== "tools/architecture/public-behavior-baseline.mjs") errors.push("collector identity is missing");
  if (!manifest.runtime?.node || !manifest.runtime?.platform || !manifest.runtime?.runner_contract) errors.push("runtime identity is missing");
  for (const entry of [manifest.baseline, manifest.candidate]) {
    if (!entry?.path) continue;
    const path = resolve(root, entry.path);
    if (!readFileSync(path, "utf8")) errors.push(`empty evidence: ${entry.path}`);
    if (sha256(readFileSync(path)) !== entry.sha256) errors.push(`evidence hash mismatch: ${entry.path}`);
  }
  const baseline = readJson(resolve(root, manifest.baseline.path));
  const candidate = readJson(resolve(root, manifest.candidate.path));
  for (const probe of PROBES) {
    if (!baseline[probe] || !candidate[probe]) errors.push(`missing probe: ${probe}`);
  }
  for (const probe of BEHAVIORS) {
    for (const [label, evidence] of [["baseline", baseline[probe]], ["candidate", candidate[probe]]]) {
      if (!Array.isArray(evidence?.cases) || evidence.cases.length < 2) errors.push(`${label} ${probe}: at least two real cases are required`);
      const ids = evidence?.cases?.map((item) => item?.case_id);
      if (Array.isArray(ids) && new Set(ids).size !== ids.length) errors.push(`${label} ${probe}: case ids are not unique`);
      for (const [index, caseValue] of (evidence?.cases ?? []).entries()) validateCaseEvidence(caseValue, `${label} ${probe} case ${index + 1}`, errors);
    }
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, baseline_commit: manifest.baseline_commit, behaviors: BEHAVIORS.length, probes: PROBES.length };
}

export function compare({ baseline = "HEAD", root = ROOT, candidate = "worktree" } = {}) {
  const commit = resolveCommit(baseline);
  if (candidate !== "worktree") throw new TypeError("compare candidate must be worktree");
  const fixtureCommit = readJson(MANIFEST).baseline_commit;
  if (fixtureCommit !== commit) {
    throw new Error(`baseline fixture commit mismatch: requested ${commit}, frozen fixture ${fixtureCommit}`);
  }
  const baselineTree = git(root, ["rev-parse", `${commit}^{tree}`]);
  const candidateSnapshot = captureExecutionSnapshot(root);
  if (candidateSnapshot.tree === baselineTree) {
    return {
      ok: false,
      baseline_commit: commit,
      candidate: { mode: candidate, head: candidateSnapshot.head, tree: candidateSnapshot.tree },
      differences: [{ probe: "candidate_binding", classification: "behavior_regression", reason: "candidate_equals_baseline" }],
    };
  }
  const expected = frozenBaseline();
  const actual = collectBehaviorEvidence(root);
    const conclusions = Object.fromEntries(PROBES.map((probe) => {
      if (probe === "help") {
        const classification = classifyComparison({ probe, baseline: expected.help, candidate: actual.help });
        return [probe, { classification, cases: [{ case_id: "help", classification }] }];
      }
      const baselineCases = expected[probe]?.cases ?? [];
      const candidateCases = actual[probe]?.cases ?? [];
      const cases = baselineCases.map((baselineCase, index) => ({
        case_id: baselineCase.case_id,
        classification: classifyComparison({ probe, baseline: baselineCase, candidate: candidateCases[index] }),
      }));
      const classification = cases.some((item) => item.classification === "behavior_regression")
        ? "behavior_regression"
        : cases.some((item) => item.classification === "approved_bug_fix")
          ? "approved_bug_fix"
          : cases.some((item) => item.classification === "approved_internal_change")
            ? "approved_internal_change"
            : "preserved";
      return [probe, { classification, cases }];
    }));
    const differences = Object.entries(conclusions)
      .filter(([, conclusion]) => conclusion.classification !== "preserved")
      .map(([probe, conclusion]) => ({ probe, ...conclusion }));
  return {
    ok: differences.every((item) => item.classification !== "behavior_regression"),
    baseline_commit: commit,
    candidate: { mode: candidate, head: candidateSnapshot.head, tree: candidateSnapshot.tree },
    conclusions,
    differences,
  };
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  const baselineArg = args.find((value) => value.startsWith("--baseline="));
  const baseline = baselineArg?.slice("--baseline=".length) ?? "HEAD";
  const candidateArg = args.find((value) => value.startsWith("--candidate="));
  const candidate = candidateArg?.slice("--candidate=".length) ?? "worktree";
  const result = command === "capture" ? capture({ baseline })
    : command === "verify" ? verify()
      : command === "compare" ? compare({ baseline, candidate })
        : null;
  if (!result) throw new TypeError("usage: public-behavior-baseline.mjs <capture|verify|compare> [--baseline=<commit>]");
  console.log(JSON.stringify(result, null, 2));
  if (result.ok === false) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
