import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runConfiguredOcrHostReview } from "../../runtime/review/ocr-delegation-adapter.mjs";

// Controlled CLI processes exercise the real direct executor and real timers.
// Their findings are transport fixtures, never independent LLM quality judgments.
const wallClockMs = 21 * 60_000 + 5_000;
const evidenceBase = fileURLToPath(new URL("../../.cache/card05-experiments/ac006-wallclock/", import.meta.url));
const digest = (value) => createHash("sha256").update(value).digest("hex");
const writeJson = (path, value) => {
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(path, bytes);
  return digest(bytes);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function executable(path, logPath, mode) {
  const finding = {
    severity: "major", path: "src/reviewed.mjs", line: 1,
    issue: "Controlled fast-path finding", root_cause: "Fixture keeps a fixed value",
    recommendation: "Derive the value from an input", evidence_kind: "direct",
    evidence: "export const reviewed = true;",
  };
  const output = [
    JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify({ findings: mode === "fast" ? [finding] : [] }) } }),
    JSON.stringify({ type: "turn.completed" }),
  ].join("\n") + "\n";
  const body = `#!/usr/bin/env node
const fs = require("node:fs");
const log = ${JSON.stringify(logPath)};
const startedAt = Date.now();
const record = (event) => fs.appendFileSync(log, JSON.stringify({at_ms:Date.now(),pid:process.pid,...event})+"\\n");
record({kind:"start",argv:process.argv.slice(2)});
process.on("exit", (code) => record({kind:"exit",code}));
process.on("SIGTERM", () => { record({kind:"signal",signal:"SIGTERM"}); process.exit(143); });
const finish = () => { record({kind:"finish",elapsed_ms:Date.now()-startedAt}); process.stdout.write(${JSON.stringify(output)}, () => { process.exitCode=0; }); };
${mode === "fast"
    ? "setTimeout(finish, 1500);"
    : `const heartbeat = setInterval(() => { record({kind:"heartbeat"}); process.stderr.write("controlled progress\\n"); }, 10000);
setTimeout(() => { clearInterval(heartbeat); finish(); }, ${wallClockMs});`}
`;
  writeFileSync(path, body, { mode: 0o700 });
  return path;
}

function fixture(runRoot, stage) {
  const root = join(runRoot, stage);
  mkdirSync(root, { recursive: true });
  const repo = join(root, "repo");
  mkdirSync(join(repo, "src"), { recursive: true });
  const sourceText = "export const reviewed = true;\n";
  writeFileSync(join(repo, "src", "reviewed.mjs"), sourceText);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "AC006 wallclock"]);
  git(["config", "user.email", "ac006@workflowhub.local"]);
  git(["add", "."]);
  git(["commit", "-qm", "isolated source"]);
  const snapshotTree = git(["rev-parse", "HEAD^{tree}"]);
  const packetRoot = join(root, "packet");
  mkdirSync(join(packetRoot, "src"), { recursive: true });
  writeFileSync(join(packetRoot, "src", "reviewed.mjs"), sourceText);
  const sourceRoot = join(root, "source-bundle");
  mkdirSync(join(sourceRoot, "src"), { recursive: true });
  const sourceFiles = {
    "source.json": Buffer.from(`${JSON.stringify({ snapshot_tree: snapshotTree })}\n`),
    "src/reviewed.mjs": Buffer.from(sourceText),
  };
  for (const [name, bytes] of Object.entries(sourceFiles)) writeFileSync(join(sourceRoot, name), bytes);
  const sourceBundle = { bundleRoot: sourceRoot, manifest: Object.entries(sourceFiles).map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: digest(bytes) })) };
  const fastLog = join(root, "fast-process.jsonl");
  const slowLog = join(root, "slow-process.jsonl");
  const fast = executable(join(root, "controlled-fast-cli"), fastLog, "fast");
  const slow = executable(join(root, "controlled-slow-cli"), slowLog, "slow");
  const providers = ["codex/fast", "codex/slow"];
  const trustedContext = {
    trusted: {}, route: { initial: providers, mode: "single_round", minimum_heterologous: 1 },
    selection: {
      providers, eligibleProfiles: providers,
      provider_identities: Object.fromEntries(providers.map((provider) => [provider, { source_id: `${provider}-controlled`, config_id: `${provider}-config` }])),
      provider_models: { "codex/fast": "controlled-fast", "codex/slow": "controlled-slow" },
    },
    providerConfig: { providers: {
      "codex/fast": { enabled: true, command: fast, model: "controlled-fast" },
      "codex/slow": { enabled: true, command: slow, model: "controlled-slow" },
    } },
  };
  const request = stage === "build-code"
    ? { stage, review_scope: "phase", subject_kind: "phase", phase_id: "P1", host_provider: "codex/host" }
    : { stage, subject_kind: "worktree", host_provider: "codex/host" };
  const packet = {
    root: packetRoot, material_id: digest(`ac006-wallclock:${stage}:${snapshotTree}`),
    preview: { reviewable_files: [{ path: "src/reviewed.mjs" }] },
    rules: { rules: [{ path: "src/reviewed.mjs", rule: "Inspect the controlled source." }] },
    manifest: [{ path: "src/reviewed.mjs", bytes: Buffer.byteLength(sourceText), sha256: digest(sourceText) }],
  };
  return { root, repo, sourceBundle, fastLog, slowLog, fast, slow, trustedContext, request, packet };
}

async function runSurface(runRoot, stage, sharedStartMs) {
  const data = fixture(runRoot, stage);
  const healthPath = join(data.root, "health.jsonl");
  const command = ["./node_modules/.bin/vitest", "run", "tests/contract/ocr-ac006-wallclock.test.mjs", "--reporter=verbose"];
  const startedAtMs = Date.now();
  writeJson(join(data.root, "start.json"), {
    stage, command, provider_commands: [data.fast, data.slow],
    request: data.request, packet: data.packet, snapshot_root: data.repo,
    slow_target_ms: wallClockMs, started_at_ms: startedAtMs, shared_started_at_ms: sharedStartMs,
    controlled_provider_only: true,
  });
  const health = [];
  const result = await runConfiguredOcrHostReview({ request: data.request, packet: data.packet }, {
    trustedContext: data.trustedContext, sourceBundle: data.sourceBundle,
    snapshotRoot: data.repo, healthPollMs: 5_000,
    onProviderHealth: (sample) => {
      const fact = { observed_at_ms: Date.now(), ...sample };
      health.push(fact);
      appendFileSync(healthPath, `${JSON.stringify(fact)}\n`);
    },
  });
  const completedAtMs = Date.now();
  const resultPath = join(data.root, "direct-result.json");
  const resultSha256 = writeJson(resultPath, result);
  const readLines = (path) => readFileSync(path, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  const childEvents = { fast: readLines(data.fastLog), slow: readLines(data.slowLog) };
  const facts = {
    stage, command, started_at_ms: startedAtMs, completed_at_ms: completedAtMs,
    elapsed_ms: completedAtMs - startedAtMs, slow_target_ms: wallClockMs,
    child_events: childEvents, health_path: healthPath, health_samples: health.length,
    result_path: resultPath, result_sha256: resultSha256, result,
    controlled_provider_only: true,
  };
  const evidencePath = join(data.root, "evidence.json");
  const evidenceSha256 = writeJson(evidencePath, facts);
  process.stdout.write(`AC006_SURFACE=${stage} EVIDENCE=${evidencePath} SHA256=${evidenceSha256}\n`);
  return { ...facts, health, evidencePath, evidenceSha256 };
}

describe("AC-REVIEW-006 direct executor real wallclock", () => {
  it("ORACLE-AC006-WALLCLOCK: two code surfaces retain fast finding while slow child progresses beyond 21 minutes", async () => {
    const runRoot = join(evidenceBase, randomUUID());
    mkdirSync(runRoot, { recursive: true });
    const sharedStartMs = Date.now();
    process.stdout.write(`AC006_START=${runRoot} START_MS=${sharedStartMs}\n`);
    const pending = ["build-code", "verify-code"].map((stage) => runSurface(runRoot, stage, sharedStartMs));
    const progressTimer = setInterval(() => {
      process.stdout.write(`AC006_PROGRESS=${runRoot} ELAPSED_MS=${Date.now() - sharedStartMs}\n`);
    }, 60_000);
    let outcomes;
    try { outcomes = await Promise.allSettled(pending); }
    finally { clearInterval(progressTimer); }
    const indexPath = join(runRoot, "index.json");
    const indexSha256 = writeJson(indexPath, {
      command: ["./node_modules/.bin/vitest", "run", "tests/contract/ocr-ac006-wallclock.test.mjs", "--reporter=verbose"],
      started_at_ms: sharedStartMs, completed_at_ms: Date.now(),
      outcomes: outcomes.map((outcome) => outcome.status === "fulfilled"
        ? { status: "fulfilled", stage: outcome.value.stage, evidence_path: outcome.value.evidencePath, evidence_sha256: outcome.value.evidenceSha256 }
        : { status: "rejected", reason: String(outcome.reason) }),
      controlled_provider_only: true,
    });
    process.stdout.write(`AC006_INDEX=${indexPath} SHA256=${indexSha256}\n`);
    expect(outcomes.every((outcome) => outcome.status === "fulfilled")).toBe(true);
    for (const { value: facts } of outcomes) {
      expect(facts.result).toMatchObject({ status: "available", outcome: "completed" });
      expect(facts.result.provider_results.map((provider) => provider.status)).toEqual(["completed", "completed"]);
      expect(facts.result.findings).toEqual([expect.objectContaining({ provider: "codex/fast", issue: "Controlled fast-path finding" })]);
      const fast = facts.child_events.fast;
      const slow = facts.child_events.slow;
      expect(fast.find((event) => event.kind === "start")?.pid).toBeGreaterThan(0);
      expect(slow.find((event) => event.kind === "start")?.pid).toBeGreaterThan(0);
      expect(fast.find((event) => event.kind === "exit")?.code).toBe(0);
      expect(slow.find((event) => event.kind === "exit")?.code).toBe(0);
      expect(fast.find((event) => event.kind === "exit").at_ms).toBeLessThan(slow.find((event) => event.kind === "exit").at_ms);
      expect(slow.filter((event) => event.kind === "heartbeat").length).toBeGreaterThan(100);
      expect(facts.completed_at_ms - facts.started_at_ms).toBeGreaterThanOrEqual(21 * 60_000);
      expect(facts.health.some((sample) => sample.provider === "codex/slow" && sample.status === "running"
        && sample.liveness === true && sample.progress_events > 0
        && sample.observed_at_ms - facts.started_at_ms >= 21 * 60_000)).toBe(true);
      expect(existsSync(facts.result_path)).toBe(true);
      expect(digest(readFileSync(facts.result_path))).toBe(facts.result_sha256);
    }
  }, 24 * 60_000);
});
