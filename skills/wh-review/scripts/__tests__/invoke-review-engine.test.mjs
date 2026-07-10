/**
 * invoke-review-engine.test.mjs — T010a (FR-THIRDREVIEW-001, NFR-2)
 *
 * Covers:
 * - discoverThirdReviewRepoRoot / discoverRunner: THIRD_REVIEW_RUNNER x
 *   THIRD_REVIEW_REPO_ROOT precedence (4 combinations), no hardcoded
 *   absolute path.
 * - invokeReviewEngine(): success path (raw artifact + structured return),
 *   and all 4 failure-mapping branches (runner-missing, non-zero-exit,
 *   timeout, output-unparseable) synthesizing escalate_to_human /
 *   not_executed / synthetic:true (AC5-5).
 * - verdict-{stage}-{review_flow_id}-round-{n}.raw.json path naming.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  discoverThirdReviewRepoRoot,
  discoverRunner,
  effectiveRunnerTimeoutMs,
  invokeReviewEngine,
  assembleReviewPayload,
  assembleAndInvokeReviewEngine,
} from "../invoke-review-engine.mjs";
import { recordPathFor as roundStatePathFor } from "../round-state.mjs";
import { writeRoutePreparePhase } from "../route-decision-writer.mjs";

const TASK_ID = "wh-review-rebuild-test";
const STAGE = "build-code";
const REVIEW_FLOW_ID = "flow-abc123";

function sha256(text) {
  return createHash("sha256").update(String(text ?? "")).digest("hex");
}

function writeRoundStateFixture({ root, stage = STAGE, reviewFlowId = REVIEW_FLOW_ID, mode = "full" }) {
  const path = roundStatePathFor({ taskTrackingRoot: root, taskId: TASK_ID, stage, reviewFlowId });
  mkdirSync(join(root, TASK_ID, "reviews"), { recursive: true });
  writeFileSync(
    path,
    JSON.stringify(
      {
        stage,
        review_flow_id: reviewFlowId,
        heterologous_round: 1,
        same_source_round: 0,
        total_round: 1,
        mode,
        actual_mode: mode,
        verdict: null,
        history: [],
      },
      null,
      2
    )
  );
}

function writePromptFixture({ root, reviewFlowId = REVIEW_FLOW_ID, totalRound, content = "prompt supplementary text" }) {
  const path = join(root, TASK_ID, "reviews", `prompt-${reviewFlowId}-r${totalRound}.md`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

let root;
let stubDir;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "invoke-review-engine-root-"));
  stubDir = mkdtempSync(join(tmpdir(), "invoke-review-engine-stub-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(stubDir, { recursive: true, force: true });
});

function writeStubRunner(body) {
  const stubPath = join(stubDir, "stub-runner.mjs");
  writeFileSync(stubPath, body);
  return stubPath;
}

function writeFakeClaude({ resultObject, resultText, emptyAttempts = 0, attemptOutputs = [], expectedBare = false, expectedTimeout, expectedAddDirs = [], sleepMs = 0 } = {}) {
  const fakePath = join(stubDir, "fake-claude.mjs");
  const countPath = join(stubDir, "fake-claude-count.txt");
  const result = resultText ?? JSON.stringify(resultObject ?? {
    verdict: "pass",
    findings: [],
    resolutionSummary: "fake claude review passed",
  });
writeFileSync(fakePath, `#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
if (process.argv.includes("--version")) {
  process.stdout.write("fake-claude 1.2.3\\n");
  process.exit(0);
}
const prompt = readFileSync(0, "utf8");
if (!prompt.includes("## REVIEW CONTRACT") || !prompt.includes("## MATERIALS")) process.exit(7);
if (process.argv.includes("--bare") !== ${Boolean(expectedBare)}) process.exit(8);
const toolsIndex = process.argv.indexOf("--tools");
if (toolsIndex === -1 || process.argv[toolsIndex + 1] !== "Read") process.exit(10);
const effortIndex = process.argv.indexOf("--effort");
if (effortIndex === -1 || process.argv[effortIndex + 1] !== "low") process.exit(11);
const addDirs = process.argv.flatMap((arg, index) => arg === "--add-dir" ? [process.argv[index + 1]] : []);
if (JSON.stringify(addDirs) !== ${JSON.stringify(JSON.stringify(expectedAddDirs))}) process.exit(12);
if (${expectedTimeout === undefined ? "false" : `process.env.CLAUDE_CODE_REVIEW_TIMEOUT_MS !== ${JSON.stringify(String(expectedTimeout))}`}) process.exit(9);
const countPath = ${JSON.stringify(countPath)};
const current = existsSync(countPath) ? Number(readFileSync(countPath, "utf8")) : 0;
writeFileSync(countPath, String(current + 1));
const attemptOutputs = ${JSON.stringify(attemptOutputs)};
if (current < attemptOutputs.length) {
  process.stdout.write(attemptOutputs[current]);
  process.exit(0);
}
if (current < ${Number(emptyAttempts)}) process.exit(0);
setTimeout(() => process.stdout.write(JSON.stringify({ type: "result", result: ${JSON.stringify(result)} })), ${Number(sleepMs)});
`);
  chmodSync(fakePath, 0o755);
  return fakePath;
}

// A runner stub that reads --diff, echoes a canned verdict to --output, exit 0.
const SUCCESS_STUB = `
import { readFileSync, writeFileSync } from "node:fs";
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, "").split("=")));
const payload = JSON.parse(readFileSync(args.diff, "utf8"));
writeFileSync(args.output, JSON.stringify({
  verdict: "pass",
  findings: [],
  actual_mode: payload.mode,
}));
process.exit(0);
`;

const NONZERO_STUB = `process.exit(1);\n`;

const TIMEOUT_STUB = `setTimeout(() => {}, 10000);\n`; // outlives the short test timeoutMs

const NO_OUTPUT_STUB = `process.exit(0);\n`; // never writes --output

const BAD_JSON_STUB = `
import { writeFileSync } from "node:fs";
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, "").split("=")));
writeFileSync(args.output, "{not valid json");
process.exit(0);
`;

describe("discoverThirdReviewRepoRoot", () => {
  it("THIRD_REVIEW_REPO_ROOT set wins over sibling-dir convention", () => {
    const result = discoverThirdReviewRepoRoot({ env: { THIRD_REVIEW_REPO_ROOT: "/custom/repo/root" } });
    expect(result).toBe("/custom/repo/root");
  });

  it("unset falls back to sibling-directory convention (../3rd-review next to workflowhub repo root)", () => {
    const result = discoverThirdReviewRepoRoot({ env: {}, workflowhubRepoRoot: "/x/y/workflowhub" });
    expect(result).toBe("/x/y/3rd-review");
  });

  it("unset env var AND no workflowhubRepoRoot override: default resolution from this module's own location correctly finds the sibling of the ACTUAL workflowhub repo root (regression: previous math resolved one directory too high, so the sibling 3rd-review repo was never found)", () => {
    const result = discoverThirdReviewRepoRoot({ env: {} });
    // Independently re-derive the workflowhub repo root by walking up from this test file's own
    // location (this test file lives at <repoRoot>/skills/wh-review/scripts/__tests__), rather
    // than re-implementing the production module's math, so this genuinely checks against the
    // real on-disk repo root instead of just re-asserting whatever the implementation computes.
    const testDir = dirname(fileURLToPath(import.meta.url));
    const workflowhubRepoRoot = resolve(testDir, "../../../../");
    const expected = resolve(workflowhubRepoRoot, "..", "3rd-review");
    expect(result).toBe(expected);
  });
});

describe("discoverRunner", () => {
  it("THIRD_REVIEW_RUNNER absolute path used as-is, regardless of THIRD_REVIEW_REPO_ROOT", () => {
    const result = discoverRunner({
      env: { THIRD_REVIEW_RUNNER: "/abs/path/my-runner.mjs", THIRD_REVIEW_REPO_ROOT: "/custom/root" },
    });
    expect(result).toBe("/abs/path/my-runner.mjs");
  });

  it("THIRD_REVIEW_RUNNER bare filename joins against discovered repo root (not scripts/ subdir)", () => {
    const result = discoverRunner({
      env: { THIRD_REVIEW_RUNNER: "my-runner.mjs", THIRD_REVIEW_REPO_ROOT: "/custom/root" },
    });
    expect(result).toBe("/custom/root/my-runner.mjs");
  });

  it("THIRD_REVIEW_RUNNER unset + THIRD_REVIEW_REPO_ROOT set: default basename under repo root's scripts/", () => {
    const result = discoverRunner({ env: { THIRD_REVIEW_REPO_ROOT: "/custom/root" } });
    expect(result).toBe("/custom/root/scripts/run-heterologous-review.mjs");
  });

  it("THIRD_REVIEW_RUNNER unset + THIRD_REVIEW_REPO_ROOT unset: sibling-dir + scripts/ default", () => {
    const result = discoverRunner({ env: {}, workflowhubRepoRoot: "/x/y/workflowhub" });
    expect(result).toBe("/x/y/3rd-review/scripts/run-heterologous-review.mjs");
  });

  it("WH_REVIEW_PROVIDER=claude-code routes to the in-repo Claude Code runner", () => {
    const result = discoverRunner({ env: { WH_REVIEW_PROVIDER: "claude-code" }, workflowhubRepoRoot: "/x/y/workflowhub" });
    expect(result).toMatch(/skills\/wh-review\/scripts\/runners\/claude-code-reviewer\.mjs$/);
  });

  it("THIRD_REVIEW_RUNNER=claude-code routes to the in-repo Claude Code runner", () => {
    const result = discoverRunner({ env: { THIRD_REVIEW_RUNNER: "claude-code" }, workflowhubRepoRoot: "/x/y/workflowhub" });
    expect(result).toMatch(/skills\/wh-review\/scripts\/runners\/claude-code-reviewer\.mjs$/);
  });

  it("WH_REVIEW_PROVIDER=codex keeps the existing default third-party discovery path", () => {
    const result = discoverRunner({ env: { WH_REVIEW_PROVIDER: "codex" }, workflowhubRepoRoot: "/x/y/workflowhub" });
    expect(result).toBe("/x/y/3rd-review/scripts/run-heterologous-review.mjs");
  });

  it("no machine-specific absolute path is hardcoded in the module source", () => {
    const src = readFileSync(new URL("../invoke-review-engine.mjs", import.meta.url), "utf8");
    expect(src).not.toMatch(/\/Users\//);
    expect(src).not.toMatch(/\/home\//);
  });
});

describe("effectiveRunnerTimeoutMs", () => {
  it("extends the outer timeout for the built-in Claude Code runner to cover retry attempts", () => {
    const runnerPath = discoverRunner({
      env: { WH_REVIEW_PROVIDER: "claude-code" },
      workflowhubRepoRoot: resolve(dirname(fileURLToPath(import.meta.url)), "../../../../"),
    });

    expect(
      effectiveRunnerTimeoutMs({
        runnerPath,
        timeoutMs: 300000,
        env: { CLAUDE_CODE_REVIEW_TIMEOUT_MS: "300000", CLAUDE_CODE_REVIEW_ATTEMPTS: "3" },
      })
    ).toBe(930000);
  });

  it("keeps the caller timeout for non-Claude runners", () => {
    expect(effectiveRunnerTimeoutMs({ runnerPath: "/tmp/custom-runner.mjs", timeoutMs: 1234, env: {} })).toBe(1234);
  });
});

describe("invokeReviewEngine — success path", () => {
  it("returns {verdict, findings, actual_mode} and persists raw artifact at the canonical path", () => {
    const runnerPath = writeStubRunner(SUCCESS_STUB);
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 1,
      mode: "full",
      contract: "CONTRACT TEXT",
      materials: "MATERIALS TEXT",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });

    expect(result).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });

    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-1.raw.json`);
    expect(existsSync(artifactPath)).toBe(true);
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    expect(artifact).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });
    expect(artifact.synthetic).toBeUndefined();
  });

  it("runs the built-in Claude Code runner through wh-review when WH_REVIEW_PROVIDER=claude-code", () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude();
    const supplementaryPrompt = "SUPPLEMENTARY PROMPT TEXT";
    const materials = `MATERIALS TEXT\n\n---\n\n## Supplementary context (agent-authored prompt)\n\n${supplementaryPrompt}`;
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 13,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials,
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code" },
      });

      expect(result).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });
      const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-13.raw.json`);
      const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
      expect(artifact.provider).toBe("claude-code");
      expect(artifact.provider_cli).toBe("claude");
      expect(artifact.host).toBe("codex");
      expect(artifact.trueCrossEngine).toBe(true);
      expect(artifact.reviewMode).toBe("claude-code-cli");
      expect(artifact.resolutionSummary).toBe("fake claude review passed");
      expect(artifact.prompt_char_count).toBeGreaterThan("CONTRACT TEXT".length + "MATERIALS TEXT".length);
      expect(artifact.contract_char_count).toBe("CONTRACT TEXT".length);
      expect(artifact.materials_char_count).toBe(materials.length);
      expect(artifact.contract_hash).toBe(sha256("CONTRACT TEXT"));
      expect(artifact.materials_hash).toBe(sha256(materials));
      expect(artifact.supplementary_prompt_present).toBe(true);
      expect(artifact.supplementary_prompt_hash).toBe(sha256(supplementaryPrompt));
      expect(artifact.claudeCodeDiagnostics).toEqual([
        expect.objectContaining({
          attempt: 1,
          outcome: "valid-contract-verdict",
          exit_status: 0,
          signal: null,
          cli: { bin: fakeClaude, version: "fake-claude 1.2.3" },
          prompt_hash: artifact.prompt_hash,
          materials_hash: sha256(materials),
          session_id: null,
          stop_reason: null,
        }),
      ]);
      expect(artifact.claudeCodeDiagnostics[0].stdout).toEqual(expect.objectContaining({
        sha256: expect.any(String),
        char_count: expect.any(Number),
        preview: expect.any(String),
        truncated: false,
      }));
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("adds --bare only when CLAUDE_CODE_REVIEW_BARE=true", () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude({ expectedBare: true });
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 23,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code", CLAUDE_CODE_REVIEW_BARE: "true" },
      });

      expect(result).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("rejects Claude Code's non-contract {pass:true} output instead of inventing a pass", () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude({ resultText: JSON.stringify({ pass: true, findings: [] }) });
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 14,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code" },
      });

      expect(result).toEqual({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed" });
      const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-14.raw.json`);
      const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
      expect(artifact.actual_mode).toBe("not_executed");
      expect(artifact.failure_reason).toBe("claude-code-output-unparseable");
      expect(artifact.claudeCodeDiagnostics).toHaveLength(3);
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("preserves contract-required skillResults from the Claude verdict", () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude({ resultObject: {
      verdict: "pass",
      findings: [],
      resolutionSummary: "skills executed",
      skillResults: [{ skill: "review", status: "executed", evidence: "SKILL.md fallback: /tmp/review/SKILL.md; checked scope; no drift." }],
    } });
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 19,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code" },
      });

      expect(result).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });
      const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-19.raw.json`);
      expect(JSON.parse(readFileSync(artifactPath, "utf8")).skillResults).toHaveLength(1);
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("retries transient Claude Code empty stdout before writing a failure verdict", () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const savedAttempts = process.env.CLAUDE_CODE_REVIEW_ATTEMPTS;
    const fakeClaude = writeFakeClaude({ emptyAttempts: 2 });
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    process.env.CLAUDE_CODE_REVIEW_ATTEMPTS = "3";
    try {
      const result = invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 15,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code" },
      });

      expect(result).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });
      const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-15.raw.json`);
      const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
      expect(artifact.trueCrossEngine).toBe(true);
      expect(artifact.claudeCodeAttempts).toBe(3);
      expect(artifact.claudeCodeDiagnostics.map((diagnostic) => diagnostic.outcome)).toEqual([
        "claude-code-empty-output",
        "claude-code-empty-output",
        "valid-contract-verdict",
      ]);
      expect(artifact.failure_reason).toBeUndefined();
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
      if (savedAttempts === undefined) delete process.env.CLAUDE_CODE_REVIEW_ATTEMPTS;
      else process.env.CLAUDE_CODE_REVIEW_ATTEMPTS = savedAttempts;
    }
  });

  it("maps terminal Claude empty stdout to not_executed with per-attempt diagnostics", () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude({ emptyAttempts: 3 });
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 20,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code", CLAUDE_CODE_REVIEW_ATTEMPTS: "3" },
      });

      expect(result).toEqual({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed" });
      const artifact = JSON.parse(readFileSync(join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-20.raw.json`), "utf8"));
      expect(artifact.failure_reason).toBe("claude-code-empty-output");
      expect(artifact.claudeCodeDiagnostics).toHaveLength(3);
      expect(artifact.claudeCodeDiagnostics).toEqual(expect.arrayContaining([
        expect.objectContaining({ outcome: "claude-code-empty-output", exit_status: 0 }),
      ]));
      expect(artifact.claudeCodeDiagnostics[0].stdout).toEqual(expect.objectContaining({
        char_count: 0,
        sha256: sha256(""),
        preview: "",
      }));
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("maps junk Claude stdout to not_executed and retains bounded diagnostic evidence", () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude({ attemptOutputs: ["not-json", "still not json", "{}"] });
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 21,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code", CLAUDE_CODE_REVIEW_ATTEMPTS: "3" },
      });

      expect(result).toEqual({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed" });
      const artifact = JSON.parse(readFileSync(join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-21.raw.json`), "utf8"));
      expect(artifact.failure_reason).toBe("claude-code-output-unparseable");
      expect(artifact.claudeCodeDiagnostics.map((diagnostic) => diagnostic.outcome)).toEqual([
        "claude-code-output-unparseable",
        "claude-code-output-unparseable",
        "claude-code-output-unparseable",
      ]);
      expect(artifact.claudeCodeDiagnostics[0].stdout).toEqual(expect.objectContaining({
        sha256: sha256("not-json"),
        char_count: 8,
        preview: "not-json",
      }));
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("does not invoke Claude when the deterministic input limit is exceeded", () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude();
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 22,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT THAT EXCEEDS THE LIMIT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code", CLAUDE_CODE_REVIEW_MAX_INPUT_CHARS: "1" },
      });

      expect(result).toEqual({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed" });
      const artifact = JSON.parse(readFileSync(join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-22.raw.json`), "utf8"));
      expect(artifact.failure_reason).toBe("claude-code-input-too-large");
      expect(artifact.claudeCodeDiagnostics).toEqual([]);
      expect(artifact.claudeCodePayloadLimit).toEqual(expect.objectContaining({ max_input_chars: 1 }));
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("passes Claude Code timeout settings to the built-in runner", () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude({ expectedTimeout: 4321 });
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 16,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code", CLAUDE_CODE_REVIEW_TIMEOUT_MS: "4321", CLAUDE_CODE_REVIEW_ATTEMPTS: "1" },
      });

      expect(result).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("passes the Read allowlist to the built-in Claude runner", () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude({ expectedAddDirs: ["/tmp/skill-sources", "/tmp/task-sources"] });
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 18,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: {
          WH_REVIEW_PROVIDER: "claude-code",
          CLAUDE_CODE_REVIEW_ADD_DIRS: "/tmp/skill-sources:/tmp/task-sources",
        },
      });

      expect(result).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("records an inner Claude timeout as claude-code-timeout", () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude({ expectedTimeout: 50, sleepMs: 1000 });
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 17,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code", CLAUDE_CODE_REVIEW_TIMEOUT_MS: "50", CLAUDE_CODE_REVIEW_ATTEMPTS: "1" },
      });

      expect(result).toEqual({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed" });
      const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-17.raw.json`);
      expect(JSON.parse(readFileSync(artifactPath, "utf8")).failure_reason).toBe("claude-code-timeout");
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });
});

describe("invokeReviewEngine — task_tracking_root resolvability guard (round-1 review finding)", () => {
  // spawnSync() in invokeReviewEngine has no `env` option, so the runner subprocess
  // (which runs `npm test` as review evidence) always inherits the REAL process.env —
  // not the caller-supplied `env` param, which is only consulted for THIRD_REVIEW_RUNNER
  // / THIRD_REVIEW_REPO_ROOT discovery and is bypassed here via `taskTrackingRoot`.
  // A previous round hard-required `process.env.WORKFLOWHUB_TASK_DIR` to be literally
  // set, which broke every clean-shell / CI invocation: WORKFLOWHUB_TASK_DIR is an
  // optional override of parseTaskDir()'s priority chain, not a hard requirement —
  // ~/.workflowhub/config.json's `task_dir` fallback must keep resolving a valid
  // task_tracking_root on its own when invoked from within the repo. The guard now
  // only fails loud when NEITHER the env var NOR the yaml fallback can resolve one.
  let savedTaskDir;

  beforeEach(() => {
    savedTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
  });

  afterEach(() => {
    if (savedTaskDir === undefined) {
      delete process.env.WORKFLOWHUB_TASK_DIR;
    } else {
      process.env.WORKFLOWHUB_TASK_DIR = savedTaskDir;
    }
  });

  it("does not throw and dispatches normally when WORKFLOWHUB_TASK_DIR is unset (yaml task_dir fallback resolves)", () => {
    delete process.env.WORKFLOWHUB_TASK_DIR;
    const runnerPath = writeStubRunner(SUCCESS_STUB);

    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 1,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });

    expect(result.verdict).toBe("pass");
    // The explicit taskTrackingRoot override is still honored — the artifact lands
    // in the test's own temp dir, never the real repo tasks/ directory.
    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-1.raw.json`);
    expect(existsSync(artifactPath)).toBe(true);
  });

  it("does not throw when WORKFLOWHUB_TASK_DIR is set but blank (yaml task_dir fallback resolves)", () => {
    process.env.WORKFLOWHUB_TASK_DIR = "   ";
    const runnerPath = writeStubRunner(SUCCESS_STUB);

    expect(() =>
      invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 1,
        mode: "full",
        contract: "c",
        materials: "m",
        taskTrackingRoot: root,
        env: { THIRD_REVIEW_RUNNER: runnerPath },
      })
    ).not.toThrow();
  });
});

describe("invokeReviewEngine — failure mapping (AC5-5)", () => {
  function assertSynthesizedFailure(result, artifactPath, expectedReason) {
    expect(result).toEqual({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed" });
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    expect(artifact.synthetic).toBe(true);
    expect(artifact.failure_reason).toBe(expectedReason);
    expect(artifact.actual_mode).toBe("not_executed");
  }

  it("runner-missing: resolved runner path does not exist on disk", () => {
    const missingPath = join(stubDir, "does-not-exist.mjs");
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 1,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: missingPath },
    });
    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-1.raw.json`);
    assertSynthesizedFailure(result, artifactPath, "runner-missing");
  });

  it("non-zero-exit: runner exits non-zero", () => {
    const runnerPath = writeStubRunner(NONZERO_STUB);
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 2,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });
    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-2.raw.json`);
    assertSynthesizedFailure(result, artifactPath, "non-zero-exit");
  });

  it("timeout: runner outlives timeoutMs", () => {
    const runnerPath = writeStubRunner(TIMEOUT_STUB);
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 3,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      timeoutMs: 200,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });
    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-3.raw.json`);
    assertSynthesizedFailure(result, artifactPath, "timeout");
  }, 10000);

  it("output-unparseable: runner exits 0 but never writes --output", () => {
    const runnerPath = writeStubRunner(NO_OUTPUT_STUB);
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 4,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });
    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-4.raw.json`);
    assertSynthesizedFailure(result, artifactPath, "output-unparseable");
  });

  it("output-unparseable: --output written but is not valid JSON", () => {
    const runnerPath = writeStubRunner(BAD_JSON_STUB);
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 5,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });
    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-5.raw.json`);
    assertSynthesizedFailure(result, artifactPath, "output-unparseable");
  });

  // round-review finding: a finding with a non-integer `line`, an out-of-enum `severity`,
  // or a blank `category` (when present) must not be accepted as a "successful" result —
  // those fields feed round-state.mjs's computeFindingFingerprint() (Contract 4) and must
  // round-trip losslessly, so malformed elements collapse to the same output-unparseable
  // failure as top-level malformed JSON. `category` itself is NOT required: verified
  // against the live 3rd-review runner during this fix's confirmation round, real findings
  // never carry a `category` field at all — requiring it would reject every genuine result.
  function writeFindingStub(finding) {
    return writeStubRunner(`
import { writeFileSync } from "node:fs";
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, "").split("=")));
writeFileSync(args.output, JSON.stringify({
  verdict: "revise_required",
  findings: [${JSON.stringify(finding)}],
  actual_mode: "full",
}));
process.exit(0);
`);
  }

  it("succeeds when a finding has no `category` at all (matches real 3rd-review runner output)", () => {
    const runnerPath = writeFindingStub({ severity: "blocking", file: "a.mjs", line: 10, issue: "x", recommendation: "y" });
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 6,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });
    expect(result.verdict).toBe("revise_required");
    expect(result.findings).toEqual([{ severity: "blocking", file: "a.mjs", line: 10, issue: "x", recommendation: "y" }]);
  });

  it("normalizes a line 0 finding instead of discarding the whole real review result", () => {
    const runnerPath = writeFindingStub({
      severity: "blocking",
      file: "reports/report-index.md",
      line: 0,
      issue: "missing file",
      recommendation: "write report index",
    });
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 10,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });

    expect(result.verdict).toBe("revise_required");
    expect(result.findings).toEqual([
      {
        severity: "blocking",
        file: "reports/report-index.md",
        line: 1,
        original_line: 0,
        issue: "missing file",
        recommendation: "write report index",
      },
    ]);
    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-10.raw.json`);
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    expect(artifact.findings[0].original_line).toBe(0);
  });

  it("preserves backend escalate_to_human with findings instead of synthesizing output-unparseable", () => {
    const runnerPath = writeStubRunner(`
import { writeFileSync } from "node:fs";
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, "").split("=")));
writeFileSync(args.output, JSON.stringify({
  verdict: "escalate_to_human",
  findings: [{
    severity: "blocking",
    file: "verify-change --light",
    line: 0,
    issue: "required skill unavailable",
    recommendation: "install or provide fallback"
  }],
  actual_mode: "full",
}));
process.exit(0);
`);
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 11,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });

    expect(result.verdict).toBe("escalate_to_human");
    expect(result.actual_mode).toBe("full");
    expect(result.findings).toEqual([
      {
        severity: "blocking",
        file: "verify-change --light",
        line: 1,
        original_line: 0,
        issue: "required skill unavailable",
        recommendation: "install or provide fallback",
      },
    ]);
    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-11.raw.json`);
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    expect(artifact.synthetic).toBeUndefined();
    expect(artifact.findings[0].original_line).toBe(0);
  });

  it("normalizes non-blocking important findings and missing actual_mode instead of synthesizing output-unparseable", () => {
    const runnerPath = writeStubRunner(`
import { writeFileSync } from "node:fs";
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, "").split("=")));
writeFileSync(args.output, JSON.stringify({
  verdict: "pass",
  findings: [{
    severity: "important",
    file: "",
    line: null,
    description: "non-blocking note"
  }]
}));
process.exit(0);
`);
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 12,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });

    expect(result.verdict).toBe("pass");
    expect(result.actual_mode).toBe("not_executed");
    expect(result.findings).toEqual([
      {
        severity: "minor",
        file: "REVIEW_CONTRACT",
        line: 1,
        original_line: null,
        description: "non-blocking note",
        issue: "non-blocking note",
        recommendation: "",
      },
    ]);
    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-12.raw.json`);
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    expect(artifact.synthetic).toBeUndefined();
    expect(artifact.verdict).toBe("pass");
  });

  it("normalizes a finding with a blank `category` string", () => {
    const runnerPath = writeFindingStub({
      severity: "blocking",
      file: "a.mjs",
      line: 10,
      category: "",
      issue: "x",
      recommendation: "y",
    });
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 9,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });
    expect(result).toEqual({
      verdict: "revise_required",
      findings: [{ severity: "blocking", file: "a.mjs", line: 10, issue: "x", recommendation: "y" }],
      actual_mode: "full",
    });
    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-9.raw.json`);
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    expect(artifact.synthetic).toBeUndefined();
  });

  it("normalizes a finding with a non-integer `line`", () => {
    const runnerPath = writeFindingStub({
      severity: "blocking",
      file: "a.mjs",
      line: "10",
      category: "cat",
      issue: "x",
      recommendation: "y",
    });
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 7,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });
    expect(result).toEqual({
      verdict: "revise_required",
      findings: [{
        severity: "blocking",
        file: "a.mjs",
        line: 1,
        original_line: "10",
        category: "cat",
        issue: "x",
        recommendation: "y",
      }],
      actual_mode: "full",
    });
    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-7.raw.json`);
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    expect(artifact.synthetic).toBeUndefined();
  });

  it("normalizes a finding with an out-of-enum `severity`", () => {
    const runnerPath = writeFindingStub({
      severity: "critical",
      file: "a.mjs",
      line: 10,
      category: "cat",
      issue: "x",
      recommendation: "y",
    });
    const result = invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 8,
      mode: "full",
      contract: "c",
      materials: "m",
      taskTrackingRoot: root,
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });
    expect(result).toEqual({
      verdict: "revise_required",
      findings: [{
        severity: "minor",
        file: "a.mjs",
        line: 10,
        category: "cat",
        issue: "x",
        recommendation: "y",
      }],
      actual_mode: "full",
    });
    const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-8.raw.json`);
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
    expect(artifact.synthetic).toBeUndefined();
  });
});

describe("assembleReviewPayload (T010c, FR-WHREVIEW-007 / Contract 11)", () => {
  it("doc-type round 1: materials is currentContent in full + prompt supplement; mode from round-state; contract from route-decision's contract_path", () => {
    writeRoundStateFixture({ root, mode: "full" });
    const { record } = writeRoutePreparePhase({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 1,
      taskTrackingRoot: root,
    });
    writePromptFixture({ root, totalRound: 1, content: "supplementary context r1" });

    const payload = assembleReviewPayload({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 1,
      taskTrackingRoot: root,
      docType: "doc",
      doc: "spec",
      currentContent: "spec content round1",
    });

    expect(payload.mode).toBe("full");
    expect(payload.contract).toBe(readFileSync(record.contract_path, "utf8"));
    expect(payload.materials).toContain("spec content round1");
    expect(payload.materials).toContain("supplementary context r1");

    // this round's own snapshot must now exist for round 2 to diff against
    expect(existsSync(join(root, TASK_ID, "reviews", "snapshots", `spec-${REVIEW_FLOW_ID}-r1.md`))).toBe(true);
  });

  it("doc-type round 2: materials is the round1->round2 snapshot diff, not full text again", () => {
    writeRoundStateFixture({ root, mode: "full" });
    writeRoutePreparePhase({ taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 1, taskTrackingRoot: root });
    writePromptFixture({ root, totalRound: 1 });
    assembleReviewPayload({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 1, taskTrackingRoot: root,
      docType: "doc", doc: "spec", currentContent: "line1\nline2\n",
    });

    writePromptFixture({ root, totalRound: 2, content: "supplementary context r2" });
    const payload = assembleReviewPayload({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 2, taskTrackingRoot: root,
      docType: "doc", doc: "spec", currentContent: "line1\nline2-changed\n",
    });

    expect(payload.materials).toContain("- line2");
    expect(payload.materials).toContain("+ line2-changed");
    expect(payload.materials).not.toContain("line1\nline2-changed\n\n---"); // not full text dumped
    expect(payload.materials).toContain("supplementary context r2");
  });

  it("non-doc review object: materials is currentContent in full, plus a materials baseline is persisted (Contract 12)", () => {
    writeRoundStateFixture({ root, mode: "full" });
    writeRoutePreparePhase({ taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 1, taskTrackingRoot: root });
    writePromptFixture({ root, totalRound: 1, content: "supplementary context" });

    const payload = assembleReviewPayload({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 1,
      taskTrackingRoot: root,
      currentContent: "diff --git a/foo.js b/foo.js\n+added\n",
      gitSha: "abc123",
      coveredPaths: ["foo.js"],
    });

    expect(payload.materials).toContain("diff --git a/foo.js b/foo.js");
    expect(payload.materials).toContain("supplementary context");
    expect(
      existsSync(join(root, TASK_ID, "reviews", `materials-baseline-${STAGE}-${REVIEW_FLOW_ID}-r1.json`))
    ).toBe(true);
  });

  it("fails loud when round-state file is missing", () => {
    expect(() =>
      assembleReviewPayload({
        taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 1, taskTrackingRoot: root,
        currentContent: "x",
      })
    ).toThrow(/round-state file not found/);
  });

  it("fails loud when route-decision record is missing", () => {
    writeRoundStateFixture({ root, mode: "full" });
    expect(() =>
      assembleReviewPayload({
        taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 1, taskTrackingRoot: root,
        currentContent: "x",
      })
    ).toThrow(/route-decision record not found/);
  });

  it("fails loud when the prompt supplementary-context file is missing (never silently falls back to empty)", () => {
    writeRoundStateFixture({ root, mode: "full" });
    writeRoutePreparePhase({ taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 1, taskTrackingRoot: root });
    expect(() =>
      assembleReviewPayload({
        taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 1, taskTrackingRoot: root,
        currentContent: "x",
      })
    ).toThrow(/prompt supplementary-context file not found/);
  });
});

describe("assembleAndInvokeReviewEngine (T010c end-to-end)", () => {
  it("assembles the payload and dispatches it through invokeReviewEngine in one call", () => {
    writeRoundStateFixture({ root, mode: "incremental" });
    writeRoutePreparePhase({ taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 1, taskTrackingRoot: root });
    writePromptFixture({ root, totalRound: 1 });
    const runnerPath = writeStubRunner(SUCCESS_STUB);

    const result = assembleAndInvokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 1,
      taskTrackingRoot: root,
      currentContent: "some materials text",
      gitSha: "abc",
      coveredPaths: [],
      env: { THIRD_REVIEW_RUNNER: runnerPath },
    });

    // SUCCESS_STUB echoes payload.mode back as actual_mode
    expect(result).toEqual({ verdict: "pass", findings: [], actual_mode: "incremental" });
  });
});
