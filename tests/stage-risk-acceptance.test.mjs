import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../runtime/task/workspace.mjs";
import { stageRuntimeMain } from "../tools/cli/stage-runtime.mjs";

import {
  buildRiskAcceptance,
  canonicalReviewFindings,
  deriveSeriousReviewPause,
  validateReportableFindingDispositions,
  validateRiskAcceptance,
  validateRiskAcceptanceSet,
} from "../runtime/review/stage-review-disposition.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (path) => readFileSync(resolve(root, path), "utf8");
const constitution = read("CONSTITUTION.md");
const checklist = read("constitution-checklist.md");

const REVIEW_HASH = "a".repeat(64);
const SNAPSHOT_TREE = "b".repeat(40);
const temporaryRoots = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function publicRiskFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-public-risk-")));
  temporaryRoots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  const home = join(root, "home");
  mkdirSync(repo);
  mkdirSync(storage);
  mkdirSync(home);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub risk acceptance test"]);
  git(repo, ["config", "user.email", "risk-acceptance@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "risk acceptance fixture\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "fixture"]);
  const taskId = "public-risk-acceptance";
  const task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0",
      project_name: "workflowhub",
      task_id: taskId,
      created_at: "2026-09-05T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  for (const file of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    artifacts.writeAtomic(file, `# ${file}\n`);
  }
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate, artifacts });
  const snapshot = kernel.currentVNextSnapshot();
  const reviewRef = "quality/reviews/results/public-risk-review.json";
  const review = {
    task_id: taskId,
    stage: "build-code",
    snapshot_tree: snapshot.tree,
    findings: [{
      id: "F-123456789abc",
      severity: "major",
      path: "runtime/demo.mjs",
      line: 1,
      issue: "fixture serious issue",
      root_cause: "fixture root cause",
      recommendation: "repair it",
      disposition: "actionable",
      evidence_status: "direct",
      providers: ["fixture"],
    }],
  };
  kernel.publishCanonicalRecord(reviewRef, `${JSON.stringify(review)}\n`);
  return { root, repo, storage, home, task, kernel, reviewRef };
}

async function withPublicRuntime(state, operation) {
  const keys = ["HOME", "XDG_CONFIG_HOME", "WORKFLOWHUB_TASK_DIR", "CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH", "CODEX_CLI_VERSION"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  process.env.HOME = state.home;
  process.env.WORKFLOWHUB_TASK_DIR = state.storage;
  delete process.env.XDG_CONFIG_HOME;
  for (const key of keys.slice(3)) delete process.env[key];
  try {
    return await operation();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

afterEach(() => {
  while (temporaryRoots.length) rmSync(temporaryRoots.pop(), { recursive: true, force: true });
});

function pausedReview() {
  return deriveSeriousReviewPause({
    taskId: "demo",
    stage: "build-code",
    reviewRef: "reviews/results/quality.json",
    reviewHash: REVIEW_HASH,
    workflowRunId: "run-0001",
    result: {
      task_id: "demo",
      stage: "build-code",
      snapshot_tree: SNAPSHOT_TREE,
      verdict: "revise_required",
      adjudication: {
        clusters: [
          {
            id: "F-123456789abc",
            severity: "major",
            path: "core/demo.mjs",
            line: 1,
            issue: "first serious issue",
            root_cause: "fixture root cause",
            recommendation: "repair it",
            providers: ["fixture"],
            disposition: "actionable",
            evidence_status: "direct",
          },
          {
            id: "F-def012345678",
            severity: "blocking",
            path: "core/demo.mjs",
            line: 2,
            issue: "second serious issue",
            root_cause: "fixture root cause",
            recommendation: "repair it",
            providers: ["fixture"],
            disposition: "actionable",
            evidence_status: "direct",
          },
        ],
      },
    },
  });
}

function acceptance(pause, findingId = pause.findings[0].finding_id) {
  const finding = pause.findings.find(({ finding_id: id }) => id === findingId);
  return buildRiskAcceptance({
    pause,
    findingId,
    cardRef: `quality/evidence/risk-cards/${finding.card_hash}.json`,
    cardHash: finding.card_hash,
    selectedOption: "accept-risk",
    replyRef: `quality/evidence/risk-replies/${"c".repeat(64)}.json`,
    replyHash: "c".repeat(64),
    acceptedAt: "2026-08-02T00:00:00.000Z",
  });
}

function reportableFinding(id = "F-123456789abc") {
  return {
    findings: [{
      id,
      severity: "major",
      path: "runtime/demo.mjs",
      issue: "fixture finding",
      root_cause: "fixture root cause",
      recommendation: "repair it",
      disposition: "actionable",
      evidence_status: "direct",
    }],
  };
}

function findingDisposition(overrides = {}) {
  return {
    finding_id: "F-123456789abc",
    original_fact: "fixture finding",
    source: "user_reply",
    consequence: "fixture consequence",
    status: "user_decided",
    next_action: "retain the user decision in the current task",
    evidence_ref: "host-message://risk-reply-1",
    owner: "main-agent",
    consumer: "stage completion",
    retain_or_delete: "retain in current task quality facts",
    ...overrides,
  };
}

function section(document, id, nextId) {
  const start = document.indexOf(`### ${id} `);
  const end = nextId ? document.indexOf(`### ${nextId} `, start + 1) : document.indexOf("\n## ", start + 1);
  expect(start, `${id} heading`).toBeGreaterThanOrEqual(0);
  expect(end, `${id} end`).toBeGreaterThan(start);
  return document.slice(start, end);
}

describe("current quality boundary", () => {
  it("uses canonical reportable findings instead of non-adopted adjudication clusters", () => {
    const result = {
      task_id: "demo",
      stage: "build-code",
      snapshot_tree: SNAPSHOT_TREE,
      verdict: "pass",
      findings: [{
        id: "F-123456789abc",
        severity: "minor",
        path: "core/demo.mjs",
        issue: "reportable minor",
        root_cause: "canonical result",
        recommendation: "retain",
        disposition: "nonblocking_minor",
        evidence_status: "minor",
      }],
      adjudication: { clusters: [{
        id: "F-def012345678",
        severity: "blocking",
        path: "core/old.mjs",
        issue: "non-adopted provider disagreement",
        root_cause: "provider disagreement",
        recommendation: "do not adopt",
        disposition: "actionable",
        evidence_status: "direct",
      }] },
    };
    expect(canonicalReviewFindings(result).map(({ id }) => id)).toEqual(["F-123456789abc"]);
    expect(deriveSeriousReviewPause({
      taskId: "demo",
      stage: "build-code",
      reviewRef: "quality/reviews/results/demo.json",
      reviewHash: REVIEW_HASH,
      result,
      workflowRunId: "run-0001",
    }).status).toBe("continue");
  });

  it("does not turn non-reportable clusters into findings when findings is explicitly empty", () => {
    const result = {
      task_id: "demo",
      stage: "build-code",
      snapshot_tree: SNAPSHOT_TREE,
      findings: [],
      adjudication: {
        clusters: [{
          id: "F-needs-corroboration",
          severity: "major",
          path: "core/demo.mjs",
          issue: "unconfirmed provider inference",
          root_cause: "insufficient corroboration",
          recommendation: "keep as provenance",
          disposition: "needs_corroboration",
          evidence_status: "inferred",
        }],
      },
    };
    expect(canonicalReviewFindings(result)).toEqual([]);
    expect(deriveSeriousReviewPause({
      taskId: "demo",
      stage: "build-code",
      reviewRef: "quality/reviews/results/demo.json",
      reviewHash: REVIEW_HASH,
      result,
      workflowRunId: "run-0001",
    })).toMatchObject({ status: "continue", findings: [] });
  });

  it("fails closed when the explicit findings field is malformed", () => {
    expect(() => canonicalReviewFindings({ findings: null })).toThrow(/findings must be an array/i);
    expect(() => deriveSeriousReviewPause({
      taskId: "demo",
      stage: "build-code",
      reviewRef: "quality/reviews/results/demo.json",
      reviewHash: REVIEW_HASH,
      result: {
        task_id: "demo",
        stage: "build-code",
        snapshot_tree: SNAPSHOT_TREE,
        findings: null,
      },
    })).toThrow(/findings must be an array/i);
  });

  it("keeps the 22-clause constitution and its checklist synchronized", () => {
    expect(constitution).toMatch(/Version:\s*1\.7\.0\b/);
    expect([...constitution.matchAll(/^### (F\d+|Q\d+|S\d+) /gm)]).toHaveLength(22);
    expect([...checklist.matchAll(/^- \[[ x]\] \*\*(F\d+|Q\d+|S\d+) /gm)]).toHaveLength(22);
    expect(checklist).toMatch(/\*\*条目数\*\*：22/);
  });

  it("separates ordinary progress, structurally authentic publication, and fail-closed completion", () => {
    const f3 = section(constitution, "F3", "F4");
    const q1 = section(constitution, "Q1", "Q2");
    const q2 = section(constitution, "Q2", "Q3");
    expect(f3).toMatch(/四材料/);
    expect(f3).toMatch(/不是推进许可证/);
    expect(f3).toMatch(/fail-loud/);
    expect(q1).toMatch(/不作为开始或继续修复的许可证/);
    expect(q1).toMatch(/不得宣称完成/);
    expect(q2).toMatch(/独立审查事实和人类交接共同证明/);
  });

  it("keeps verify-code completion bound to current AC, test, and independent-review facts", () => {
    const verifyCode = read("workflows/verify-code/SKILL.md");
    const verifySteps = JSON.parse(read("workflows/verify-code/steps.json")).steps;
    const reviewSteps = verifySteps.filter(({ step_slug }) => step_slug === "run-one-independent-code-review");

    expect(reviewSteps).toHaveLength(1);
    expect(reviewSteps[0].observable_result).toMatch(/异源|独审|independent/i);
    expect(verifyCode).toMatch(/不重新检查其完整性/);
    expect(verifyCode).toMatch(/不列 AC 逐条结论/);
    expect(verifyCode).not.toMatch(/语义反向检查/);
    expect(verifyCode).toMatch(/unavailable[\s\S]{0,120}(?:绝不是|不能算)[\s\S]{0,30}pass/i);
    expect(verifyCode).toMatch(/不为了 verify-code 重跑全量测试/i);
  });
});

describe("risk acceptance behavior", () => {
  it("routes accepted risk through the existing confirm public behavior", async () => {
    const state = publicRiskFixture();
    await withPublicRuntime(state, async () => {
      const pause = await stageRuntimeMain([
        "review-risk-pause",
        "--stage=build-code",
        "--project=workflowhub",
        `--task=${state.task.identity.taskId}`,
        `--input=${join(state.root, "pause-input.json")}`,
      ].map((arg) => {
        if (arg.endsWith("pause-input.json")) {
          writeFileSync(arg.slice("--input=".length), JSON.stringify({ review_result_ref: state.reviewRef }));
        }
        return arg;
      }), { cwd: state.repo });
      const finding = pause.findings[0];
      const replyRaw = `${JSON.stringify({
        source: "user",
        finding_id: finding.finding_id,
        selected_option: "accept-risk",
        reply: "我确认承担该风险并继续当前快照。",
      })}\n`;
      const replyHash = sha256(replyRaw);
      const replyRef = `quality/evidence/risk-replies/${replyHash}.json`;
      state.kernel.publishCanonicalRecord(replyRef, replyRaw);
      const inputPath = join(state.root, "risk-confirm-input.json");
      writeFileSync(inputPath, JSON.stringify({
        review_result_ref: state.reviewRef,
        finding_id: finding.finding_id,
        card_ref: finding.card_ref,
        card_hash: finding.card_hash,
        selected_option: "accept-risk",
        reply_ref: replyRef,
        reply_hash: replyHash,
      }));

      const result = await stageRuntimeMain([
        "confirm",
        "--action=decision",
        "--stage=build-code",
        "--project=workflowhub",
        `--task=${state.task.identity.taskId}`,
        `--input=${inputPath}`,
      ], { cwd: state.repo });

      expect(result.risk_acceptance_ref).toMatch(/^quality\/evidence\/risk-acceptances\/[a-f0-9]{64}\.json$/);
      expect(JSON.parse(state.task.readRecord(result.risk_acceptance_ref))).toMatchObject({
        task_id: state.task.identity.taskId,
        finding_id: finding.finding_id,
        selected_option: "accept-risk",
        reply_ref: replyRef,
        reply_hash: replyHash,
      });
    });
  });

  it("writes a needs_human reply back as user_decided with user reply evidence", () => {
    const result = validateReportableFindingDispositions({
      result: reportableFinding(),
      dispositions: [findingDisposition({ status: "needs_human", source: "review", evidence_ref: "quality/reviews/results/review.json", card_hash: "a".repeat(64) })],
      userReply: {
        finding_id: "F-123456789abc",
        reply_ref: "host-message://risk-reply-1",
        reply_hash: "d".repeat(64),
      },
    });
    expect(result).toMatchObject({
      facts: {
        status: "recorded",
        items: [{
          finding_id: "F-123456789abc",
          status: "user_decided",
          source: "user_reply",
          evidence_ref: "host-message://risk-reply-1",
        }],
      },
      reply_bindings: [{
        finding_id: "F-123456789abc",
        reply_ref: "host-message://risk-reply-1",
        reply_hash: "d".repeat(64),
      }],
      missing_items: [],
    });
  });

  it("rejects a user reply that does not start from needs_human", () => {
    expect(() => validateReportableFindingDispositions({
      result: reportableFinding(),
      dispositions: [findingDisposition()],
      userReply: {
        finding_id: "F-123456789abc",
        reply_ref: "host-message://risk-reply-1",
        reply_hash: "d".repeat(64),
      },
    })).toThrow(/requires needs_human disposition/i);
  });

  it("rejects a direct user_decided disposition without a bound user reply", () => {
    expect(() => validateReportableFindingDispositions({
      result: reportableFinding(),
      dispositions: [findingDisposition()],
    })).toThrow(/requires a bound user reply/i);
  });

  it("keeps accepted_risk without an authenticated receipt incomplete", () => {
    const result = validateReportableFindingDispositions({
      result: reportableFinding(),
      dispositions: [findingDisposition({
        source: "review",
        status: "accepted_risk",
        evidence_ref: "quality/reviews/results/public-risk-review.json",
      })],
    });
    expect(result.facts.status).toBe("incomplete");
    expect(result.missing_items).toEqual(expect.arrayContaining([
      "accepted_risk requires an authenticated user risk receipt for: F-123456789abc",
      expect.stringMatching(/accepted_risk_requires_authorized_finding.*accepted_risk_requires_authorization_receipt.*accepted_risk_requires_risk_record/),
    ]));
  });

  it("rejects a non-risk option", () => {
    const pause = pausedReview();
    const finding = pause.findings[0];
    expect(() => buildRiskAcceptance({
      pause,
      findingId: finding.finding_id,
      cardRef: `quality/evidence/risk-cards/${finding.card_hash}.json`,
      cardHash: finding.card_hash,
      selectedOption: "repair",
      replyRef: `quality/evidence/risk-replies/${"c".repeat(64)}.json`,
      replyHash: "c".repeat(64),
      acceptedAt: "2026-08-02T00:00:00.000Z",
    })).toThrow(/exact accept-risk option/i);
  });

  it("rejects acceptance bound to another snapshot", () => {
    const pause = pausedReview();
    const value = { ...acceptance(pause), snapshot_tree: "d".repeat(40) };
    expect(() => validateRiskAcceptance({ acceptance: value, pause })).toThrow(/exact finding.*snapshot/i);
  });

  it("rejects duplicate finding acceptance", () => {
    const pause = pausedReview();
    const value = acceptance(pause);
    expect(() => validateRiskAcceptanceSet({ acceptances: [value, value], pause })).toThrow(/duplicate finding/i);
  });

  it("rejects a partial set of serious finding acceptances", () => {
    const pause = pausedReview();
    expect(() => validateRiskAcceptanceSet({ acceptances: [acceptance(pause)], pause })).toThrow(/does not cover every serious finding/i);
  });
});
