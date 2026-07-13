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
import { chmodSync, existsSync, lstatSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  discoverThirdReviewRepoRoot,
  discoverRunner,
  effectiveRunnerTimeoutMs,
  buildRunnerEnv,
  invokeReviewEngine,
  assembleReviewPayload,
  assembleAndInvokeReviewEngine,
} from "../invoke-review-engine.mjs";
import { recordPathFor as roundStatePathFor } from "../round-state.mjs";
import { writeRoutePreparePhase } from "../route-decision-writer.mjs";

const TASK_ID = "wh-review-rebuild-test";
const STAGE = "build-code";
const REVIEW_FLOW_ID = "flow-abc123";

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
  const makeRemovable = (path) => { let stat; try { stat = lstatSync(path); } catch { return; } if (!stat.isDirectory() || stat.isSymbolicLink()) { try { chmodSync(path, 0o644); } catch {} return; } chmodSync(path, 0o755); for (const name of readdirSync(path)) makeRemovable(join(path, name)); };
  makeRemovable(root);
  rmSync(root, { recursive: true, force: true });
  rmSync(stubDir, { recursive: true, force: true });
});

function writeStubRunner(body) {
  const stubPath = join(stubDir, "stub-runner.mjs");
  writeFileSync(stubPath, body);
  return stubPath;
}

function writeIsolatedCanonicalRunner({ capturePath, diagnosticPath } = {}) {
  const runnerPath = join(stubDir, "isolated-canonical-runner.mjs");
  writeFileSync(runnerPath, `
    import { readFileSync, writeFileSync } from "node:fs";
    const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, "").split("=")));
    const payload = JSON.parse(readFileSync(args.diff, "utf8"));
    const manifest = payload.artifact_manifest;
    if (!manifest || !Array.isArray(manifest.entries) || typeof payload.materials !== "string") process.exit(7);
    ${capturePath ? `writeFileSync(${JSON.stringify(capturePath)}, payload.materials);` : ""}
    ${diagnosticPath ? `writeFileSync(${JSON.stringify(diagnosticPath)}, JSON.stringify({ code: "local-provider-failure" }));
    writeFileSync(args.output, JSON.stringify({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed", synthetic: true, failure_reason: "local-provider-failure", diagnostic_path: ${JSON.stringify(diagnosticPath)} }));` : `writeFileSync(args.output, JSON.stringify({
      verdict: "pass", findings: [], actual_mode: payload.mode,
      provider: "claude-code", backend_provider: "claude-code", reviewer_source: "wh-review/test-fixture",
      trueCrossEngine: true, synthetic: false, execution_status: "completed",
      artifactCoverage: manifest.entries.map(({ id, sha256 }) => ({ id, sha256, status: "read" })),
      coverage: manifest.entries.map(({ id, sha256, chunks }) => ({ id, sha256, status: "read", chunks: chunks.map((chunk) => ({ ...chunk, included: true })) })),
      reviewSnapshot: manifest.entries.map(({ id }) => ({ id, truncated: false })),
    }));`}
  `);
  return runnerPath;
}

function writeFakeClaude({ resultObject, resultText, structuredOutput } = {}) {
  const fakePath = join(stubDir, "fake-claude.mjs");
  const result = resultText ?? JSON.stringify(resultObject ?? {
    verdict: "pass",
    findings: [],
    resolutionSummary: "fake claude review passed",
    skillResults: [],
  });
  const envelope = structuredOutput === undefined
    ? { type: "result", result }
    : {
        type: "result",
        subtype: "success",
        is_error: false,
        duration_ms: 1250,
        duration_api_ms: 1100,
        num_turns: 1,
        result,
        session_id: "fake-session-id",
        total_cost_usd: 0.01,
        usage: { input_tokens: 10, output_tokens: 20 },
        modelUsage: {},
        permission_denials: [],
        structured_output: structuredOutput,
        uuid: "fake-uuid",
      };
  writeFileSync(fakePath, `#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
const prompt = readFileSync(0, "utf8");
if (!prompt.includes("Manifest content hash:") || prompt.includes("MATERIALS TEXT") || prompt.includes("CONTRACT TEXT")) process.exit(7);
if (!process.argv.includes("--bare")) process.exit(8);
const settingsIndex = process.argv.indexOf("--settings");
if (settingsIndex < 0 || !process.argv[settingsIndex + 1].endsWith("safe-settings.json")) process.exit(9);
const safeSettings = JSON.parse(readFileSync(process.argv[settingsIndex + 1], "utf8"));
if (safeSettings.hooks || safeSettings.enabledPlugins || safeSettings.mcpServers || !safeSettings.permissions) process.exit(12);
const toolsIndex = process.argv.indexOf("--tools");
const allowedToolsIndex = process.argv.indexOf("--allowedTools");
const allowed = allowedToolsIndex < 0 ? "" : process.argv[allowedToolsIndex + 1];
if (toolsIndex < 0 || process.argv[toolsIndex + 1] !== "Read" || process.argv.includes("--add-dir") || !/^Read\\(\\/\\/[^)]+\\/\\*\\*\\)$/.test(allowed) || !allowed.includes(process.cwd().replace(/^\\//, ""))) process.exit(11);
const manifest = JSON.parse(readFileSync(join(process.cwd(), "manifest.json"), "utf8"));
const coverage = manifest.entries.map(({id, sha256}) => ({id, sha256, status:"read", evidence:"fake read evidence"}));
for (const [entryIndex, entry] of manifest.entries.entries()) for (const chunk of entry.chunks) {
  const toolId = "read-"+entryIndex+"-"+chunk.sequence, path=join(process.cwd(),chunk.path);
  const source = readFileSync(path,"utf8"), sourceLines=source===""?[]:source.replace(/\\n$/u,"").split("\\n").map(x=>x.replace(/\\r$/u,""));
  const content = sourceLines.map((line,lineIndex)=>String(lineIndex+1)+"\\t"+line).join("\\n");
  process.stdout.write(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id:toolId,name:"Read",input:{file_path:path,offset:1,limit:Math.max(1,chunk.lines)}}]}})+"\\n");
  process.stdout.write(JSON.stringify({type:"user",message:{role:"user",content:[{type:"tool_result",tool_use_id:toolId,content}]}})+"\\n");
}
const envelope = ${JSON.stringify(envelope)};
function addCoverage(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || !["pass","revise_required","escalate_to_human"].includes(parsed.verdict)) return value;
    if (parsed.artifactCoverage === undefined) parsed.artifactCoverage = coverage;
    return typeof value === "string" ? JSON.stringify(parsed) : parsed;
  } catch { return value; }
}
envelope.result = addCoverage(envelope.result);
if (envelope.structured_output !== undefined) envelope.structured_output = addCoverage(envelope.structured_output);
process.stdout.write(JSON.stringify(envelope));
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

  it("WH_REVIEW_PROVIDER=claude-code routes to the canonical 3rd-review runner", () => {
    const result = discoverRunner({ env: { WH_REVIEW_PROVIDER: "claude-code" }, workflowhubRepoRoot: "/x/y/workflowhub" });
    expect(result).toBe("/x/y/3rd-review/scripts/run-heterologous-review.mjs");
  });

  it("THIRD_REVIEW_RUNNER=claude-code routes to the in-repo Claude Code runner", () => {
    const result = discoverRunner({ env: { THIRD_REVIEW_RUNNER: "claude-code" }, workflowhubRepoRoot: "/x/y/workflowhub" });
    expect(result).toMatch(/skills\/wh-review\/scripts\/runners\/claude-code-reviewer\.mjs$/);
  });

  it("WH_REVIEW_PROVIDER=codex keeps the existing default third-party discovery path", () => {
    const result = discoverRunner({ env: { WH_REVIEW_PROVIDER: "codex" }, workflowhubRepoRoot: "/x/y/workflowhub" });
    expect(result).toBe("/x/y/3rd-review/scripts/run-heterologous-review.mjs");
  });

  it("an explicit non-Claude THIRD_REVIEW_RUNNER wins over WH_REVIEW_PROVIDER=claude-code", () => {
    expect(discoverRunner({ env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "/explicit/custom.mjs" } })).toBe("/explicit/custom.mjs");
  });

  it("an explicit THIRD_REVIEW_RUNNER=claude-code still selects Claude", () => {
    expect(discoverRunner({ env: { WH_REVIEW_PROVIDER: "codex", THIRD_REVIEW_RUNNER: "claude-code" } })).toMatch(/claude-code-reviewer\.mjs$/);
  });

  it("no machine-specific absolute path is hardcoded in the module source", () => {
    const src = readFileSync(new URL("../invoke-review-engine.mjs", import.meta.url), "utf8");
    expect(src).not.toMatch(/\/Users\//);
    expect(src).not.toMatch(/\/home\//);
  });
});

describe("effectiveRunnerTimeoutMs", () => {
  it("keeps the outer wall timeout for the canonical 3rd-review runner", () => {
    const runnerPath = discoverRunner({
      env: { WH_REVIEW_PROVIDER: "claude-code" },
      workflowhubRepoRoot: resolve(dirname(fileURLToPath(import.meta.url)), "../../../../"),
    });

    expect(
      effectiveRunnerTimeoutMs({
        runnerPath,
        timeoutMs: 300000,
        env: { CLAUDE_CODE_REVIEW_TIMEOUT_MS: "300000" },
      })
    ).toBe(300000);
  });

  it("keeps the caller timeout for non-Claude runners", () => {
    expect(effectiveRunnerTimeoutMs({ runnerPath: "/tmp/custom-runner.mjs", timeoutMs: 1234, env: {} })).toBe(1234);
  });

  it("defaults non-Claude runners to a 600 second outer timeout", () => {
    expect(effectiveRunnerTimeoutMs({ runnerPath: "/tmp/custom-runner.mjs", env: {} })).toBe(600000);
  });
});

describe("runner boundary", () => {
  it("passes only the selected provider secret and safe CLI environment", () => {
    expect(buildRunnerEnv({ requestedProvider: "claude-code", sourceEnv: {
      PATH: "/usr/bin", HOME: "/home/test", LANG: "C", ANTHROPIC_API_KEY: "allowed",
      OPENAI_API_KEY: "drop", GOOGLE_API_KEY: "drop", UNRELATED_SECRET: "drop",
    } })).toEqual({ PATH: "/usr/bin", HOME: "/home/test", LANG: "C", ANTHROPIC_API_KEY: "allowed" });
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

  it("canonical Claude adapter receives forced provider, normalized host, and immutable package for large materials", () => {
    const capture = join(stubDir, "canonical-capture.json");
    const runnerPath = writeStubRunner(`
      import { readFileSync, writeFileSync } from "node:fs";
      const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, "").split("=")));
      const payload = JSON.parse(readFileSync(args.diff, "utf8"));
      writeFileSync(${JSON.stringify(capture)}, JSON.stringify({ args, payload }));
      writeFileSync(args.output, JSON.stringify({ verdict:"pass", findings:[], actual_mode:payload.mode,
        provider:"claude-code", backend_provider:"claude-code", reviewer_source:"3rd-review/canonical",
        trueCrossEngine:true, synthetic:false, execution_status:"completed",
        artifactCoverage:payload.artifact_manifest.entries.map(({id,sha256}) => ({id,sha256,status:"read"})) }));
    `);
    const materials = "large-material-line\n".repeat(70_000);
    const result = invokeReviewEngine({ taskId: TASK_ID, stage: STAGE, reviewFlowId: "canonical-large", totalRound: 1,
      mode: "full", contract: "C", materials, taskTrackingRoot: root, env: {
        THIRD_REVIEW_RUNNER: runnerPath, WH_REVIEW_PROVIDER: "claude-code", WH_REVIEW_HOST_PROVIDER: "openai-codex",
      } });
    expect(result.verdict).toBe("pass");
    const captured = JSON.parse(readFileSync(capture, "utf8"));
    expect(captured.args.provider).toBe("claude-code");
    expect(captured.args["host-provider"]).toBe("codex");
    expect(captured.payload.materials).toBe(materials);
    expect(captured.payload.artifact_manifest.content_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(captured.payload.artifact_manifest.entries.some((entry) => entry.role === "materials")).toBe(true);
    const raw = JSON.parse(readFileSync(join(root, TASK_ID, "reviews", `verdict-${STAGE}-canonical-large-round-1.raw.json`), "utf8"));
    expect(raw).toMatchObject({ provider: "claude-code", reviewer_source: "3rd-review/canonical", trueCrossEngine: true, synthetic: false });
    expect(raw.artifactCoverage.length).toBeGreaterThan(0);
  });

  it("isolated canonical runner receives complete supplied materials and package coverage without truncation", () => {
    const capturedPrompt = join(stubDir, "canonical-claude-prompt.txt");
    const runnerPath = writeIsolatedCanonicalRunner({ capturePath: capturedPrompt });
    const first = "FIRST-MARKER-WH-CROSS-REPO";
    const last = "LAST-MARKER-WH-CROSS-REPO";
    const materials = `${first}\n${"0123456789abcdef\n".repeat(10_000)}${last}\n`;
    expect(materials.length).toBeGreaterThan(120_000);
    const result = invokeReviewEngine({ taskId: TASK_ID, stage: STAGE, reviewFlowId: "cross-repo", totalRound: 1,
      mode: "full", contract: "C", materials, taskTrackingRoot: root, env: {
        THIRD_REVIEW_RUNNER: runnerPath, WH_REVIEW_PROVIDER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex",
      } });
    expect(result.verdict).toBe("pass");
    const prompt = readFileSync(capturedPrompt, "utf8");
    expect(prompt).toContain(first);
    expect(prompt).toContain(last);
    expect(prompt).not.toContain("[... truncated ...]");
    const raw = JSON.parse(readFileSync(join(root, TASK_ID, "reviews", `verdict-${STAGE}-cross-repo-round-1.raw.json`), "utf8"));
    expect(raw).toMatchObject({ provider: "claude-code", backend_provider: "claude-code", reviewer_source: "wh-review/test-fixture", trueCrossEngine: true });
    expect(raw.coverage.length).toBeGreaterThan(1);
    for (const entry of raw.coverage) {
      expect(entry.status).toBe("read");
      expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.chunks.length).toBeGreaterThan(0);
      for (const chunk of entry.chunks) {
        expect(chunk.included).toBe(true);
        expect(chunk.sha256).toMatch(/^[a-f0-9]{64}$/);
      }
    }
    expect(raw.reviewSnapshot.every((item) => item.truncated === false)).toBe(true);
  });

  it("persists an isolated canonical runner diagnostic without review input secrets", () => {
    const runnerDiagnostic = join(stubDir, "canonical-runner-diagnostic.json");
    const runnerPath = writeIsolatedCanonicalRunner({ diagnosticPath: runnerDiagnostic });
    const materialSecret = "MATERIAL_SECRET_SHOULD_NOT_PERSIST";
    const result = invokeReviewEngine({ taskId: TASK_ID, stage: STAGE, reviewFlowId: "cross-repo-failure", totalRound: 1,
      mode: "full", contract: "PROMPT_SECRET_SHOULD_NOT_PERSIST", materials: materialSecret, taskTrackingRoot: root, env: {
        THIRD_REVIEW_RUNNER: runnerPath, WH_REVIEW_PROVIDER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex",
      } });
    expect(result).toEqual({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed" });
    const raw = JSON.parse(readFileSync(join(root, TASK_ID, "reviews", `verdict-${STAGE}-cross-repo-failure-round-1.raw.json`), "utf8"));
    expect(raw).toMatchObject({ synthetic: true, execution_status: "failed", failure_reason: "local-provider-failure" });
    expect(existsSync(raw.diagnostic_path)).toBe(true);
    expect((lstatSync(raw.diagnostic_path).mode & 0o777)).toBe(0o600);
    const diagnosticBytes = readFileSync(raw.diagnostic_path);
    expect(createHash("sha256").update(diagnosticBytes).digest("hex")).toBe(raw.diagnostic_sha256);
    expect(diagnosticBytes.length).toBe(raw.diagnostic_bytes);
    const diagnostic = diagnosticBytes.toString("utf8");
    for (const forbidden of ["PROMPT_SECRET_SHOULD_NOT_PERSIST", materialSecret]) expect(diagnostic).not.toContain(forbidden);
  });

  it("fails closed when a Claude pass lacks complete coverage or provenance", () => {
    const runnerPath = writeStubRunner(`
      import { readFileSync, writeFileSync } from "node:fs";
      const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, "").split("=")));
      const payload = JSON.parse(readFileSync(args.diff, "utf8"));
      writeFileSync(args.output, JSON.stringify({ verdict:"pass", findings:[], actual_mode:payload.mode,
        provider:"claude-code", trueCrossEngine:true, synthetic:false, execution_status:"completed", artifactCoverage:[] }));
    `);
    const result = invokeReviewEngine({ taskId: TASK_ID, stage: STAGE, reviewFlowId: "unattested-pass", totalRound: 1,
      mode: "full", contract: "C", materials: "M", taskTrackingRoot: root, env: {
        THIRD_REVIEW_RUNNER: runnerPath, WH_REVIEW_PROVIDER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex",
      } });
    expect(result).toEqual({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed" });
    expect(JSON.parse(readFileSync(join(root, TASK_ID, "reviews", `verdict-${STAGE}-unattested-pass-round-1.raw.json`), "utf8")))
      .toMatchObject({ synthetic: true, failure_reason: "claude-attestation-invalid" });
  });

  it("runs the built-in Claude Code runner through wh-review when WH_REVIEW_PROVIDER=claude-code", async () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude();
    const materials = "MATERIALS TEXT";
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = await invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 13,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials,
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" },
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
      const packageBase = join(root, TASK_ID, "reviews", ".claude-review-packages");
      const [packageName] = readdirSync(packageBase);
      expect(readFileSync(join(packageBase, packageName, "contract.md"), "utf8")).toBe("CONTRACT TEXT");
      expect(readFileSync(join(packageBase, packageName, "materials.md"), "utf8")).toBe(materials);
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("maps lock contention without reading a stale review artifact", async () => {
    const totalRound = 61, artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-${totalRound}.raw.json`);
    mkdirSync(dirname(artifactPath), { recursive: true });
    writeFileSync(artifactPath, JSON.stringify({ verdict: "pass", findings: [], actual_mode: "full", stale: true }));
    const utility = join(stubDir, "contended-flock.mjs");
    writeFileSync(utility, "#!/usr/bin/env node\nprocess.exit(73);\n"); chmodSync(utility, 0o755);
    const result = await invokeReviewEngine({ taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound, mode: "full", contract: "C", materials: "M", taskTrackingRoot: root, env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex", WH_REVIEW_TEST_PLATFORM: "linux", WH_REVIEW_LOCK_BIN: utility } });
    expect(result).toEqual({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed" });
    expect(JSON.parse(readFileSync(artifactPath, "utf8"))).toMatchObject({ failure_reason: "review-already-running", synthetic: true });
  });

  it("keeps custom runner payload bytes on the legacy mode/contract/materials contract", () => {
    const captured = join(stubDir, "captured-diff.json");
    const runnerPath = writeStubRunner(`
import {readFileSync,writeFileSync} from "node:fs";
const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,"").split("=")));
const bytes=readFileSync(args.diff); writeFileSync(process.env.CAPTURED_DIFF,bytes);
const payload=JSON.parse(bytes); writeFileSync(args.output,JSON.stringify({verdict:"pass",findings:[],actual_mode:payload.mode}));`);
    const mode = "full", contract = "CONTRACT TEXT", materials = "MATERIALS TEXT";
    invokeReviewEngine({ taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 29, mode, contract, materials, taskTrackingRoot: root, env: { THIRD_REVIEW_RUNNER: runnerPath, WH_REVIEW_TEST_MODE: "1", CAPTURED_DIFF: captured } });
    const inputHash = createHash("sha256").update(JSON.stringify({ mode, contract, materials })).digest("hex");
    expect(readFileSync(captured, "utf8")).toBe(JSON.stringify({ mode, contract, materials, input_hash: inputHash }));
  });

  it("uses canonical per-source immutable entries for Claude without duplicating aggregate content", async () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN, fakeClaude = writeFakeClaude();
    const spec = join(stubDir, "spec.md"), decision = join(stubDir, "decision.md"); writeFileSync(spec, "SPEC\n"); writeFileSync(decision, "DECISION\n");
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = await invokeReviewEngine({ taskId: TASK_ID, stage: "build-spec", reviewFlowId: REVIEW_FLOW_ID, totalRound: 32, mode: "full", contract: "C", materials: "LEGACY AGGREGATE MUST NOT ENTER PACKAGE", materialSources: [{ id: "source:spec", path: spec }, { id: "source:decision", path: decision }], supplementaryContext: "ONLY NEW CONTEXT", taskTrackingRoot: root, env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" } });
      expect(result.verdict).toBe("pass");
      const packages = readdirSync(join(root, TASK_ID, "reviews", ".claude-review-packages"));
      const manifest = JSON.parse(readFileSync(join(root, TASK_ID, "reviews", ".claude-review-packages", packages[0], "manifest.json"), "utf8"));
      expect(manifest.entries.filter(({ role }) => role === "materials").map(({ id, kind }) => [id, kind])).toEqual([["source:decision", "material_source"], ["source:spec", "material_source"], ["context:supplementary", "supplementary_context"]]);
      expect(manifest.entries.some(({ kind }) => kind === "material_snapshot")).toBe(false);
      const context = manifest.entries.find(({ id }) => id === "context:supplementary");
      expect(readFileSync(join(root, TASK_ID, "reviews", ".claude-review-packages", packages[0], context.path), "utf8")).toBe("ONLY NEW CONTEXT");
      expect(readFileSync(join(root, TASK_ID, "reviews", ".claude-review-packages", packages[0], "manifest.json"), "utf8")).not.toContain("LEGACY AGGREGATE");
    } finally { savedClaudeBin === undefined ? delete process.env.CLAUDE_CODE_BIN : process.env.CLAUDE_CODE_BIN = savedClaudeBin; }
  });

  it("resumes one stalled Claude stream without resending the original materials", async () => {
    const saved = { bin: process.env.CLAUDE_CODE_BIN, idle: process.env.CLAUDE_CODE_REVIEW_IDLE_MS, marker: process.env.FAKE_CLAUDE_MARKER };
    const marker = join(stubDir, "resume-marker");
    const fakeClaude = join(stubDir, "fake-resumable-claude.mjs");
    writeFileSync(fakeClaude, `#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
const input = readFileSync(0, "utf8");
if (!existsSync(process.env.FAKE_CLAUDE_MARKER)) {
  writeFileSync(process.env.FAKE_CLAUDE_MARKER, input);
  console.log(JSON.stringify({type:"system",subtype:"init",session_id:"resume-session"}));
  process.on("SIGINT", () => process.exit(0));
  setInterval(() => {}, 1000);
} else {
  if (!process.argv.includes("--resume") || input.includes("MATERIALS TEXT")) process.exit(12);
  const manifest = JSON.parse(readFileSync(process.cwd()+"/manifest.json","utf8"));
  const artifactCoverage = manifest.entries.map(({id,sha256})=>({id,sha256,status:"read",evidence:"resumed read"}));
  for (const [i,e] of manifest.entries.entries()) for(const c of e.chunks){ const id="resume-read-"+i+"-"+c.sequence,path=process.cwd()+"/"+c.path,source=readFileSync(path,"utf8"),lines=source===""?[]:source.replace(/\\n$/u,"").split("\\n").map(x=>x.replace(/\\r$/u,"")),content=lines.map((line,j)=>String(j+1)+"\\t"+line).join("\\n"); process.stdout.write(JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"tool_use",id,name:"Read",input:{file_path:path,offset:1,limit:Math.max(1,c.lines)}}]}})+"\\n"); process.stdout.write(JSON.stringify({type:"user",message:{role:"user",content:[{type:"tool_result",tool_use_id:id,content}]}})+"\\n"); }
  process.stdout.write(JSON.stringify({type:"result",session_id:"resume-session",structured_output:{verdict:"pass",findings:[],resolutionSummary:"resumed",skillResults:[],artifactCoverage}}) + "\\n");
}
`);
    chmodSync(fakeClaude, 0o755);
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    process.env.CLAUDE_CODE_REVIEW_IDLE_MS = "1000";
    process.env.FAKE_CLAUDE_MARKER = marker;
    try {
      const result = await invokeReviewEngine({ taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 26, mode: "full", contract: "CONTRACT TEXT", materials: "MATERIALS TEXT", taskTrackingRoot: root, env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" } });
      const artifact = JSON.parse(readFileSync(join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-26.raw.json`), "utf8"));
      expect(result, JSON.stringify(artifact)).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });
      expect(artifact).toMatchObject({ execution_status: "completed", resume_count: 1, synthetic: false });
      expect(artifact.session_id).toBeUndefined();
    } finally {
      for (const [key, value] of Object.entries({ CLAUDE_CODE_BIN: saved.bin, CLAUDE_CODE_REVIEW_IDLE_MS: saved.idle, FAKE_CLAUDE_MARKER: saved.marker })) value === undefined ? delete process.env[key] : process.env[key] = value;
    }
  });

  it("fails a stalled Claude stream when no session id was observed", async () => {
    const savedBin = process.env.CLAUDE_CODE_BIN, savedIdle = process.env.CLAUDE_CODE_REVIEW_IDLE_MS;
    const fakeClaude = join(stubDir, "fake-stalled-claude.mjs");
    writeFileSync(fakeClaude, `#!/usr/bin/env node\nprocess.on("SIGINT",()=>process.exit(0)); setInterval(()=>{},1000);`); chmodSync(fakeClaude, 0o755);
    process.env.CLAUDE_CODE_BIN = fakeClaude; process.env.CLAUDE_CODE_REVIEW_IDLE_MS = "50";
    try {
      const result = await invokeReviewEngine({ taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 27, mode: "full", contract: "C", materials: "M", taskTrackingRoot: root, env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" } });
      expect(result).toEqual({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed" });
      expect(JSON.parse(readFileSync(join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-27.raw.json`), "utf8"))).toMatchObject({ execution_status: "failed", failure_reason: "claude-code-idle-without-session", synthetic: true });
    } finally { savedBin === undefined ? delete process.env.CLAUDE_CODE_BIN : process.env.CLAUDE_CODE_BIN = savedBin; savedIdle === undefined ? delete process.env.CLAUDE_CODE_REVIEW_IDLE_MS : process.env.CLAUDE_CODE_REVIEW_IDLE_MS = savedIdle; }
  });

  it.each([
    ["an object", {
      verdict: "pass",
      findings: [],
      resolutionSummary: "structured object parsed",
      skillResults: [],
    }],
    ["a JSON string", JSON.stringify({
      verdict: "pass",
      findings: [],
      resolutionSummary: "structured string parsed",
      skillResults: [],
    })],
  ])("parses Claude Code's real structured_output envelope when it contains %s", async (_shape, structuredOutput) => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude({
      resultText: JSON.stringify({ pass: false }),
      structuredOutput,
    });
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = await invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 25,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" },
      });

      expect(result).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });
      const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-25.raw.json`);
      const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
      expect(artifact.provider).toBe("claude-code");
      expect(artifact.trueCrossEngine).toBe(true);
      expect(artifact.resolutionSummary).toMatch(/^structured (object|string) parsed$/);
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("always adds --bare for Claude Code reviews", async () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude();
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = await invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 23,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" },
      });

      expect(result).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("sanitizes CLAUDE_CODE_SETTINGS before passing it to Claude Code", async () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const savedSettings = process.env.CLAUDE_CODE_SETTINGS;
    const savedExpectedSettings = process.env.FAKE_CLAUDE_EXPECTED_SETTINGS;
    const fakeClaude = writeFakeClaude();
    const customSettings = join(root, "claude-settings.json");
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    process.env.CLAUDE_CODE_SETTINGS = customSettings;
    writeFileSync(customSettings, JSON.stringify({ model: "test-model", env: { ANTHROPIC_BASE_URL: "http://proxy", SECRET_OTHER: "drop" }, hooks: { PreToolUse: [] }, enabledPlugins: { evil: true }, permissions: { allow: ["Read(/**)"] } }));
    try {
      const result = await invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 24,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" },
      });

      expect(result).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
      if (savedSettings === undefined) delete process.env.CLAUDE_CODE_SETTINGS;
      else process.env.CLAUDE_CODE_SETTINGS = savedSettings;
      if (savedExpectedSettings === undefined) delete process.env.FAKE_CLAUDE_EXPECTED_SETTINGS;
      else process.env.FAKE_CLAUDE_EXPECTED_SETTINGS = savedExpectedSettings;
    }
  });

  it("rejects Claude Code's non-contract {pass:true} output instead of inventing a pass", async () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude({ resultText: JSON.stringify({ pass: true, findings: [] }) });
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = await invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 14,
        mode: "full",
        contract: "CONTRACT TEXT",
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" },
      });

      expect(result).toEqual({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed" });
      const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-14.raw.json`);
      const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
      expect(artifact.actual_mode).toBe("not_executed");
      expect(artifact.failure_reason).toBe("claude-code-output-unparseable");
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("preserves executed and reviewer-decided not_applicable skillResults from the Claude verdict", async () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN;
    const fakeClaude = writeFakeClaude({ resultObject: {
      verdict: "pass",
      findings: [],
      resolutionSummary: "skills executed",
      skillResults: [
        { skill: "plan-ceo-review", status: "executed", evidence: "SKILL.md fallback: /tmp/plan-ceo-review/SKILL.md; checked premise and scope; no drift." },
        { skill: "review", status: "executed", evidence: "SKILL.md fallback: /tmp/review/SKILL.md; checked scope; no drift." },
        { skill: "plan-design-review", status: "not_applicable", evidence: "Reviewer inspected supplied design sources and found no UI scope; no UI review applied." },
      ],
    } });
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    try {
      const result = await invokeReviewEngine({
        taskId: TASK_ID,
        stage: STAGE,
        reviewFlowId: REVIEW_FLOW_ID,
        totalRound: 19,
        mode: "full",
        contract: '<!-- wh-review-skills: {"required":["plan-ceo-review","review","plan-design-review"]} -->\nCONTRACT TEXT',
        materials: "MATERIALS TEXT",
        taskTrackingRoot: root,
        env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" },
      });

      expect(result).toEqual({ verdict: "pass", findings: [], actual_mode: "full" });
      const artifactPath = join(root, TASK_ID, "reviews", `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-19.raw.json`);
      const skillResults = JSON.parse(readFileSync(artifactPath, "utf8")).skillResults;
      expect(skillResults).toHaveLength(3);
      expect(skillResults.find(({ skill }) => skill === "plan-design-review").status).toBe("not_applicable");
    } finally {
      if (savedClaudeBin === undefined) delete process.env.CLAUDE_CODE_BIN;
      else process.env.CLAUDE_CODE_BIN = savedClaudeBin;
    }
  });

  it("uses a path-independent Claude input hash and changes it when canonical source bytes change", async () => {
    const savedClaudeBin = process.env.CLAUDE_CODE_BIN, fakeClaude = writeFakeClaude();
    process.env.CLAUDE_CODE_BIN = fakeClaude;
    const otherRoot = mkdtempSync(join(tmpdir(), "invoke-review-engine-other-"));
    try {
      const sourceA = join(stubDir, "hash-a.md"), sourceBRoot = mkdtempSync(join(tmpdir(), "source-copy-")), sourceB = join(sourceBRoot, "hash-b.md");
      writeFileSync(sourceA, "same canonical bytes\n"); writeFileSync(sourceB, "same canonical bytes\n");
      for (const taskRoot of [root, otherRoot]) mkdirSync(join(taskRoot, TASK_ID, "reviews"), { recursive: true });
      await invokeReviewEngine({ taskId: TASK_ID, stage: STAGE, reviewFlowId: "pathless", totalRound: 1, mode: "full", contract: "C", materials: "ignored", materialSources: [{ id: "source:one", path: sourceA }], taskTrackingRoot: root, env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" } });
      await invokeReviewEngine({ taskId: TASK_ID, stage: STAGE, reviewFlowId: "pathless", totalRound: 1, mode: "full", contract: "C", materials: "ignored", materialSources: [{ id: "source:one", path: sourceB }], taskTrackingRoot: otherRoot, env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" } });
      const stateName = (taskRoot) => readdirSync(join(taskRoot, TASK_ID, "reviews", ".claude-review-state"))[0];
      expect(stateName(root).slice(-64)).toBe(stateName(otherRoot).slice(-64));
      writeFileSync(sourceA, "changed canonical bytes\n");
      await invokeReviewEngine({ taskId: TASK_ID, stage: STAGE, reviewFlowId: "pathless", totalRound: 2, mode: "full", contract: "C", materials: "ignored", materialSources: [{ id: "source:one", path: sourceA }], taskTrackingRoot: root, env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" } });
      const hashes = readdirSync(join(root, TASK_ID, "reviews", ".claude-review-state")).map((name) => name.slice(-64));
      expect(new Set(hashes).size).toBe(2);
      rmSync(sourceBRoot, { recursive: true, force: true });
    } finally {
      savedClaudeBin === undefined ? delete process.env.CLAUDE_CODE_BIN : process.env.CLAUDE_CODE_BIN = savedClaudeBin;
      const makeRemovable = (path) => { let stat; try { stat = lstatSync(path); } catch { return; } if (!stat.isDirectory() || stat.isSymbolicLink()) { try { chmodSync(path, 0o644); } catch {} return; } chmodSync(path, 0o755); for (const name of readdirSync(path)) makeRemovable(join(path, name)); };
      makeRemovable(otherRoot); rmSync(otherRoot, { recursive: true, force: true });
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

describe("invokeReviewEngine — Claude preflight temp cleanup", () => {
  function invokeFailingPreflight(contract, skillRoots) {
    const before = new Set(readdirSync(tmpdir()).filter((name) => name.startsWith("invoke-review-engine-")));
    let thrown;
    try { invokeReviewEngine({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: REVIEW_FLOW_ID,
      totalRound: 30,
      mode: "full",
      contract,
      materials: "MATERIALS TEXT",
      taskTrackingRoot: root,
      env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex", CLAUDE_CODE_SKILL_ROOTS: skillRoots },
    }); } catch (error) { thrown = error; }
    const leaked = readdirSync(tmpdir()).filter((name) => name.startsWith("invoke-review-engine-") && !before.has(name));
    expect(leaked).toEqual([]);
    return thrown;
  }

  it("does not allocate an invoke temp directory when a required skill is missing", () => {
    const emptySkillRoot = join(stubDir, "empty-skills");
    mkdirSync(emptySkillRoot);
    expect(invokeFailingPreflight('<!-- wh-review-skills: {"required":["missing-review"]} -->', emptySkillRoot)?.message).toMatch(/required-skill-unavailable/);
  });

  it("does not leak an invoke temp directory when skill definitions conflict", () => {
    const roots = [join(stubDir, "skills-a"), join(stubDir, "skills-b")];
    roots.forEach((skillRoot, index) => {
      mkdirSync(join(skillRoot, "review"), { recursive: true });
      writeFileSync(join(skillRoot, "review", "SKILL.md"), `definition ${index}`);
    });
    expect(invokeFailingPreflight('<!-- wh-review-skills: {"required":["review"]} -->', roots.join(delimiter))?.message).toMatch(/required-skill-conflict/);
  });

  it("does not leak an invoke temp directory when manifest preflight is invalid", () => {
    const emptySkillRoot = join(stubDir, "empty-skills-invalid");
    mkdirSync(emptySkillRoot);
    expect(invokeFailingPreflight('<!-- wh-review-skills: {"required":"review"} -->', emptySkillRoot)?.message).toMatch(/required-skill-unavailable/);
  });

  it("maps artifact package publication errors to structured not_executed", async () => {
    const reviews = join(root, TASK_ID, "reviews"); mkdirSync(reviews, { recursive: true });
    writeFileSync(join(reviews, ".claude-review-packages"), "blocks package directory");
    const result = await invokeReviewEngine({ taskId: TASK_ID, stage: STAGE, reviewFlowId: REVIEW_FLOW_ID, totalRound: 31, mode: "full", contract: "C", materials: "M", taskTrackingRoot: root, env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex" } });
    expect(result).toEqual({ verdict: "escalate_to_human", findings: [], actual_mode: "not_executed" });
    expect(JSON.parse(readFileSync(join(reviews, `verdict-${STAGE}-${REVIEW_FLOW_ID}-round-31.raw.json`), "utf8"))).toMatchObject({ synthetic: true, failure_reason: "artifact-package-publish-failed" });
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
    expect(payload.supplementaryContext).toBe("supplementary context r1");

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
    expect(payload.supplementaryContext).toBe("supplementary context r2");
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
    expect(payload.supplementaryContext).toBe("supplementary context");
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
