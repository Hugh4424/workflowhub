import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";

import { prepareConfiguredOcrHostContext, runConfiguredOcrHostReview, runOcrDelegationRound } from "../../runtime/review/ocr-delegation-adapter.mjs";
import { authenticatedEvidenceDigest } from "../../runtime/review/review-packet-identity.mjs";

const roots = [];

const compliantReviewPrompt = [
  "Review the supplied implementation and report evidence-backed findings.",
  "Do not invoke Agent, subagent, child-agent, or other agent tools.",
  "Do not wait for or poll agents, sessions, or processes; do not invoke wait/poll tools.",
].join("\n");

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("configured OCR direct host execution", () => {
  it("excludes a reviewer sharing the trusted host source despite different provider and model", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-shared-source-"));
    roots.push(root);
    const hostDir = join(root, ".config", "workflowhub");
    const attachmentRoot = join(root, "attachments");
    const configPath = join(root, "providers.json");
    mkdirSync(hostDir, { recursive: true });
    mkdirSync(attachmentRoot);
    writeFileSync(configPath, JSON.stringify({
      tiers: [["codex/luna", "kimi/coding"]],
      providers: {
        "codex/host": { enabled: true, model: "host-model", source_id: "shared-source" },
        "codex/luna": { enabled: true, model: "reviewer-model", source_id: "shared-source" },
        "kimi/coding": { enabled: true, model: "independent-model", source_id: "independent-source" },
      },
      attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
    }));
    writeFileSync(join(hostDir, "config.json"), JSON.stringify({
      third_review: { command: ["/unused/3rd-review"], config: configPath, attachment_root: attachmentRoot },
      wh_review: { version: 2, stages: { "build-code": {
        initial: ["codex/luna", "kimi/coding"], mode: "full_only", minimum_heterologous: 2,
      } } },
    }));
    const previousHome = process.env.HOME;
    process.env.HOME = root;
    try {
      const input = { ...request, host_provider: "codex/host" };
      const context = prepareConfiguredOcrHostContext(input);
      expect(context.selection.eligibleProfiles).toEqual(["kimi/coding"]);
      const dispatched = [];
      const result = await runConfiguredOcrHostReview({ request: input, packet: configuredPacket() }, {
        trustedContext: context,
        providerExecutor: async ({ provider }) => {
          dispatched.push(provider);
          return { status: "completed", output: JSON.stringify({ role: "assistant", content: [{ type: "text", text: JSON.stringify({ findings: [] }) }] }) };
        },
      });
      expect(dispatched).toEqual(["kimi/coding"]);
      expect(result).toMatchObject({ status: "unavailable", error: { code: "OCR_INDEPENDENCE_INCOMPLETE" },
        provider_results: [{ status: "failed", error: { code: "OCR_PROVIDER_NOT_INDEPENDENT" } }, { status: "completed" }] });
    } finally {
      if (previousHome === undefined) delete process.env.HOME;
      else process.env.HOME = previousHome;
    }
  });

  it("selects every route while preserving the independent-model coverage boundary", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-trusted-route-"));
    roots.push(root);
    const hostDir = join(root, ".config", "workflowhub");
    const attachmentRoot = join(root, "attachments");
    const configPath = join(root, "providers.json");
    mkdirSync(hostDir, { recursive: true });
    mkdirSync(attachmentRoot);
    const profiles = {
      "codex/luna": { enabled: true, model: "luna" },
      "kimi/coding": { enabled: true, model: "kimi" },
    };
    writeFileSync(configPath, JSON.stringify({
      tiers: [["codex/luna", "kimi/coding"]], providers: profiles,
      attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
    }));
    writeFileSync(join(hostDir, "config.json"), JSON.stringify({
      third_review: { command: ["/unused/3rd-review"], config: configPath, attachment_root: attachmentRoot },
      wh_review: { version: 2, stages: { "build-code": {
        initial: ["codex/luna", "kimi/coding"], mode: "full_only", minimum_heterologous: 2,
      } } },
    }));
    const previousHome = process.env.HOME;
    process.env.HOME = root;
    try {
      const input = { ...request, host_provider: "codex/host" };
      const context = prepareConfiguredOcrHostContext(input);
      expect(context.selection.providers).toEqual(["codex/luna", "kimi/coding"]);
      expect(context.selection.eligibleProfiles).toEqual(["codex/luna", "kimi/coding"]);
      expect(context.selection.provider_identities["codex/luna"].config_id).toMatch(/^[a-f0-9]{64}$/);
      expect(context.route_identity).toMatch(/^[a-f0-9]{64}$/);
      profiles["kimi/coding"].model = "luna";
      writeFileSync(configPath, JSON.stringify({
        tiers: [["codex/luna", "kimi/coding"]], providers: profiles,
        attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
      }));
      const sameModel = prepareConfiguredOcrHostContext(input);
      expect(sameModel.selection.providers).toEqual(["codex/luna", "kimi/coding"]);
      expect(sameModel.selection.eligibleProfiles).toEqual(["codex/luna"]);
      expect(sameModel.selection.provider_identities["codex/luna"].source_id).toBe("codex/luna");
      expect(sameModel.selection.provider_identities["kimi/coding"].source_id).toBe("kimi/coding");
      let calls = 0;
      const completedProvider = async ({ provider }) => {
        calls++;
        return { status: "completed", output: provider === "codex/luna"
          ? JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify({ findings: [] }) } }) + "\n"
            + JSON.stringify({ type: "turn.completed", usage: { input_tokens: 1 } }) + "\n"
          : JSON.stringify({ role: "assistant", content: [{ type: "text", text: JSON.stringify({ findings: [] }) }] }) };
      };
      const sameModelResult = await runConfiguredOcrHostReview({ request: input, packet: configuredPacket() }, {
        trustedContext: sameModel, providerExecutor: completedProvider,
      });
      expect(calls).toBe(1);
      expect(sameModelResult).toMatchObject({
        status: "unavailable", outcome: "failed", error: { code: "OCR_INDEPENDENCE_INCOMPLETE" },
        provider_results: [
          { status: "completed" },
          { status: "failed", error: { code: "OCR_PROVIDER_NOT_INDEPENDENT" } },
        ],
      });
      calls = 0;
      const sameModelMinimumOne = await runConfiguredOcrHostReview({ request: input, packet: configuredPacket() }, {
        trustedContext: { ...sameModel, route: { ...sameModel.route, minimum_heterologous: 1 } },
        providerExecutor: completedProvider,
      });
      expect(calls).toBe(1);
      expect(sameModelMinimumOne).toMatchObject({
        status: "available-with-failures", outcome: "completed",
        provider_results: [
          { status: "completed" },
          { status: "failed", error: { code: "OCR_PROVIDER_NOT_INDEPENDENT" } },
        ],
      });

      profiles["codex/host"] = { enabled: true, model: "host" };
      delete profiles["kimi/coding"];
      writeFileSync(configPath, JSON.stringify({ tiers: [["codex/luna", "kimi/coding"]], providers: profiles,
        attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }] }));
      const missing = prepareConfiguredOcrHostContext(input);
      expect(missing.selection.provider_models["kimi/coding"]).toBeNull();
      expect(missing.selection.provider_identities["kimi/coding"].config_id).toMatch(/^[a-f0-9]{64}$/);
      calls = 0;
      const missingResult = await runConfiguredOcrHostReview({ request: input, packet: configuredPacket() }, {
        trustedContext: missing,
        providerExecutor: async () => { calls++; return { status: "failed", error: { code: "CONTROLLED_FAILURE" } }; },
      });
      expect(calls).toBe(1);
      expect(missingResult.provider_results[1]).toMatchObject({
        status: "failed", identity: { model: null },
        error: { code: "OCR_PROVIDER_CONFIG_INVALID", message: "selected provider is not configured" },
      });

      profiles["kimi/coding"] = { enabled: false, model: "kimi" };
      writeFileSync(configPath, JSON.stringify({ tiers: [["codex/luna", "kimi/coding"]], providers: profiles,
        attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }] }));
      const disabled = prepareConfiguredOcrHostContext(input);
      calls = 0;
      const disabledResult = await runConfiguredOcrHostReview({ request: input, packet: configuredPacket() }, {
        trustedContext: disabled,
        providerExecutor: async () => { calls++; return { status: "failed", error: { code: "CONTROLLED_FAILURE" } }; },
      });
      expect(calls).toBe(1);
      expect(disabledResult.provider_results[1]).toMatchObject({
        status: "failed", identity: { model: "kimi" },
        error: { code: "OCR_PROVIDER_CONFIG_INVALID", message: "selected provider is disabled" },
      });

      profiles["codex/luna"].enabled = false;
      writeFileSync(configPath, JSON.stringify({ tiers: [["codex/luna", "kimi/coding"]], providers: profiles,
        attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }] }));
      const none = prepareConfiguredOcrHostContext(input);
      calls = 0;
      const noneResult = await runConfiguredOcrHostReview({ request: input, packet: configuredPacket() }, {
        trustedContext: none,
        providerExecutor: async () => { calls++; throw new Error("should not run"); },
      });
      expect(calls).toBe(0);
      expect(noneResult).toMatchObject({
        status: "unavailable", outcome: "failed", error: { code: "OCR_ALL_PROVIDERS_FAILED" },
        provider_results: [{ status: "failed" }, { status: "failed" }],
      });
    } finally {
      if (previousHome === undefined) delete process.env.HOME;
      else process.env.HOME = previousHome;
    }
  });

  it("starts a provider CLI directly with a path prompt for a packet larger than 1 MB, then cleans up", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-cli-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    writeFileSync(executable, `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
const prompt = fs.readFileSync("review-prompt.md", "utf8");
const entry = args.at(-1);
if (args[0] !== "exec" || !args.includes("--json")
    || args[args.indexOf("--sandbox") + 1] !== "read-only"
    || !args.includes("--skip-git-repo-check") || !args.includes("--ephemeral")
    || !entry.includes("If no Read tool is available")
    || !entry.includes("read-only file-view commands")
    || !entry.includes("review-prompt.md and those relative paths inside this isolated packet cwd")
    || !entry.includes("Never write, use Git or network commands, or access parent paths")
    || !prompt.includes("Codex CLI only:")
    || !prompt.includes("cat or sed -n")
    || !prompt.includes("All other providers must use a read tool only.")) process.exit(8);
if (args.join(" ").includes("export const") || prompt.includes("export const")
    || fs.statSync("src/reviewed.mjs").size <= 1024 * 1024) process.exit(9);
process.stdout.write(JSON.stringify({type:"item.completed",item:{type:"agent_message",text:JSON.stringify({findings:[]})}})+"\\n");
process.stdout.write(JSON.stringify({type:"turn.completed",usage:{input_tokens:3}})+"\\n");
`, { mode: 0o700 });
    const packet = configuredPacket("x".repeat(1024 * 1024 + 1));
    const priorHostDirs = new Set(readdirSync(tmpdir()).filter((name) =>
      name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")));
    const result = await runConfiguredOcrHostReview({ request, packet }, {
      trustedContext: configuredContext(["codex/luna"], executable),
    });
    expect(result).toMatchObject({
      status: "available", outcome: "completed", dispatch_state: "dispatched",
      provider_results: [{ status: "completed", findings: [], coverage: { read_confirmed: false } }],
    });
    expect(result.provider_results[0].coverage.selected_files).toEqual(["src/reviewed.mjs"]);
    expect(result.provider_results[0].usage).toEqual({ input_tokens: 3 });
    expect(readdirSync(tmpdir()).filter((name) => name.startsWith("workflowhub-ocr-host-")
      && !name.startsWith("workflowhub-ocr-host-test-")
      && !priorHostDirs.has(name))).toEqual([]);
  });

  it("retains the successful provider and the failed provider separately", async () => {
    const packet = configuredPacket();
    const result = await runConfiguredOcrHostReview({ request, packet }, {
      trustedContext: configuredContext(["kimi/coding", "codex/luna"], "/unused/provider"),
      providerExecutor: async ({ provider }) => provider === "kimi/coding"
        ? { status: "completed", output: JSON.stringify({
          role: "assistant", content: [{ type: "text", text: JSON.stringify({ findings: [] }) }],
        }), usage: { input_tokens: 7 } }
        : { status: "failed", error: { code: "AUTHENTICATION_FAILED", message: "account unavailable" } },
    });
    expect(result.status).toBe("available-with-failures");
    expect(result.provider_results.map(({ status }) => status)).toEqual(["completed", "failed"]);
    expect(result.provider_results[0].usage).toEqual({ input_tokens: 7 });
    expect(result.provider_results[1].error.code).toBe("AUTHENTICATION_FAILED");
    expect(result.findings).toEqual([]);
  });

  it("returns unavailable when all configured providers fail", async () => {
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["codex/luna"], "/unused/provider"),
      providerExecutor: async () => ({ status: "failed", error: { code: "OCR_PROVIDER_SPAWN_FAILED", message: "ENOENT" } }),
    });
    expect(result).toMatchObject({
      status: "unavailable", outcome: "failed", error: { code: "OCR_ALL_PROVIDERS_FAILED" },
      provider_results: [{ status: "failed", error: { code: "OCR_PROVIDER_SPAWN_FAILED" } }],
    });
  });

  it("preserves a direct provider spawn failure from the supervisor", async () => {
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["codex/luna"], "/unused/provider"),
    });
    expect(result).toMatchObject({
      status: "unavailable", provider_results: [{ status: "failed", error: { code: "OCR_PROVIDER_SPAWN_FAILED" } }],
    });
  });

  it("does not dispatch a configured provider that shares the host source", async () => {
    let calls = 0;
    const trustedContext = configuredContext(["kimi/coding", "codex/luna"], "/unused/provider");
    trustedContext.selection.eligibleProfiles = ["kimi/coding"];
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext,
      providerExecutor: async () => {
        calls += 1;
        return { status: "completed", output: JSON.stringify({
          role: "assistant", content: [{ type: "text", text: JSON.stringify({ findings: [] }) }],
        }) };
      },
    });
    expect(calls).toBe(1);
    expect(result.status).toBe("available-with-failures");
    expect(result.provider_results[1]).toMatchObject({
      status: "failed", error: { code: "OCR_PROVIDER_NOT_INDEPENDENT" },
    });
  });

  it("fails before dispatch when the trusted provider configuration changes", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-config-"));
    roots.push(root);
    const configPath = join(root, "providers.json");
    writeFileSync(configPath, "{}");
    const trustedContext = configuredContext(["codex/luna"], "/unused/provider");
    trustedContext.trusted.config = configPath;
    trustedContext.provider_config_sha256 = "0".repeat(64);
    let calls = 0;
    await expect(runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext,
      providerExecutor: async () => { calls += 1; return { status: "completed", output: "" }; },
    })).rejects.toMatchObject({ code: "OCR_PROVIDER_CONFIG_DRIFT", dispatch_state: "blocked_before_dispatch" });
    expect(calls).toBe(0);
  });

  it("uses an unbounded direct Antigravity print session for the verify-code provider", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-agy-"));
    roots.push(root);
    const executable = join(root, "fake-agy");
    writeFileSync(executable, `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
const prompt = fs.readFileSync("review-prompt.md", "utf8");
if (!args.includes("--print-timeout=0") || !prompt.includes("verify-code")
    || args.at(-1) !== "Read review-prompt.md in this directory, then read every listed packet file. Return only the requested JSON object."
    || !prompt.includes("All other providers must use a read tool only.")) process.exit(8);
process.stdout.write(JSON.stringify({findings:[]}));
`, { mode: 0o700 });
    const trustedContext = configuredContext(["antigravity/flash"], executable);
    trustedContext.providerConfig.providers["antigravity/flash"].allow_host_state = true;
    const result = await runConfiguredOcrHostReview({
      request: { ...request, stage: "verify-code", review_scope: null, phase_id: null },
      packet: configuredPacket(),
    }, { trustedContext });
    expect(result).toMatchObject({ status: "available", provider_results: [{ status: "completed" }] });
  });

  it("reports live child liveness during silence and the last real output after progress", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-health-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    writeFileSync(executable, `#!/usr/bin/env node
setTimeout(() => {
  process.stdout.write(JSON.stringify({type:"item.completed",item:{type:"agent_message",text:JSON.stringify({findings:[]})}})+"\\n");
  process.stdout.write(JSON.stringify({type:"turn.completed"})+"\\n");
}, 250);
`, { mode: 0o700 });
    const observed = [];
    let finished = false;
    const pending = runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["codex/luna"], executable),
      healthPollMs: 15,
      onProviderHealth: (health) => observed.push(health),
    }).then((result) => { finished = true; return result; });
    for (let attempt = 0; attempt < 100 && observed.filter((item) =>
      item.status === "running" && item.liveness === true && item.last_output_at_ms === null).length < 2; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(finished).toBe(false);
    expect(observed.filter((item) => item.status === "running"
      && item.liveness === true && item.last_output_at_ms === null).length).toBeGreaterThanOrEqual(2);
    const result = await pending;
    const member = result.provider_results[0];
    expect(result.status).toBe("available");
    expect(member.execution.retry.progress_events).toBeGreaterThan(0);
    expect(member.execution.health).toMatchObject({
      status: "completed", liveness: false, progress_events: member.execution.retry.progress_events,
    });
    expect(Number.isSafeInteger(member.execution.health.last_liveness_at_ms)).toBe(true);
    expect(Number.isSafeInteger(member.execution.health.last_output_at_ms)).toBe(true);
    expect(observed.some((item) => item.status === "running"
      && item.last_output_at_ms !== null && item.progress_events > 0)).toBe(true);
  });

  it("treats 16 MiB as a provider-output capture limit, after file input dispatch", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-output-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    writeFileSync(executable, `#!/usr/bin/env node
require("node:fs").statSync("src/reviewed.mjs");
process.stdout.write("x".repeat(17 * 1024 * 1024));
`, { mode: 0o700 });
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket("x".repeat(1024 * 1024 + 1)) }, {
      trustedContext: configuredContext(["codex/luna"], executable),
    });
    expect(result).toMatchObject({
      status: "unavailable", provider_results: [{ status: "failed", error: { code: "OCR_PROVIDER_OUTPUT_LIMIT" } }],
    });
    expect(result.provider_results[0].execution.retry.progress_events).toBeGreaterThan(0);
    expect(result.provider_results[0].execution.health.stdout_bytes).toBeGreaterThan(16 * 1024 * 1024);
  });

  it("terminates a live direct provider only after explicit cancellation", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-cancel-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    const startedMarker = join(root, "started");
    writeFileSync(executable, `#!/usr/bin/env node
require("node:fs").writeFileSync(${JSON.stringify(startedMarker)}, "started");
setInterval(() => {}, 1000);
`, { mode: 0o700 });
    const controller = new AbortController();
    const priorHostDirs = new Set(readdirSync(tmpdir()).filter((name) =>
      name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")));
    const pending = runConfiguredOcrHostReview({
      request, packet: configuredPacket(), signal: controller.signal,
    }, { trustedContext: configuredContext(["codex/luna"], executable) });
    for (let attempt = 0; attempt < 100 && !existsSync(startedMarker); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(existsSync(startedMarker)).toBe(true);
    controller.abort();
    const result = await pending;
    expect(result).toMatchObject({
      status: "unavailable", outcome: "cancelled",
      provider_results: [{ status: "cancelled", error: { code: "OCR_PROVIDER_CANCELLED" } }],
    });
    expect(readdirSync(tmpdir()).filter((name) => name.startsWith("workflowhub-ocr-host-")
      && !name.startsWith("workflowhub-ocr-host-test-")
      && !priorHostDirs.has(name))).toEqual([]);
  });

  it.skipIf(process.platform === "win32")("terminates the provider process group after an uncatchable owner loss", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-owner-loss-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    const providerPidFile = join(root, "provider.pid");
    const descendantPidFile = join(root, "descendant.pid");
    writeFileSync(executable, `#!/usr/bin/env node
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const descendant = spawn(process.execPath, ["-e", "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"], { stdio: "ignore" });
fs.writeFileSync(${JSON.stringify(providerPidFile)}, String(process.pid));
fs.writeFileSync(${JSON.stringify(descendantPidFile)}, String(descendant.pid));
process.on("SIGTERM", () => {});
setInterval(() => {}, 1000);
`, { mode: 0o700 });
    const packet = configuredPacket();
    const priorHostDirs = new Set(readdirSync(tmpdir()).filter((name) =>
      name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")));
    const driver = `
import { runConfiguredOcrHostReview } from ${JSON.stringify(new URL("../../runtime/review/ocr-delegation-adapter.mjs", import.meta.url).href)};
await runConfiguredOcrHostReview({ request: ${JSON.stringify(request)}, packet: ${JSON.stringify(packet)} }, {
  trustedContext: ${JSON.stringify(configuredContext(["codex/luna"], executable))},
});
`;
    const owner = spawn(process.execPath, ["--input-type=module", "-e", driver], { stdio: "ignore" });
    let providerPid;
    let descendantPid;
    let bundleRoot;
    try {
      for (let attempt = 0; attempt < 200 && !existsSync(descendantPidFile); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(existsSync(providerPidFile)).toBe(true);
      expect(existsSync(descendantPidFile)).toBe(true);
      providerPid = Number(readFileSync(providerPidFile, "utf8"));
      descendantPid = Number(readFileSync(descendantPidFile, "utf8"));
      expect(Number.isSafeInteger(providerPid) && providerPid > 0).toBe(true);
      expect(Number.isSafeInteger(descendantPid) && descendantPid > 0).toBe(true);
      process.kill(providerPid, 0);
      process.kill(descendantPid, 0);
      const created = readdirSync(tmpdir()).filter((name) =>
        name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")
        && !priorHostDirs.has(name));
      expect(created).toHaveLength(1);
      bundleRoot = join(tmpdir(), created[0]);
      expect(existsSync(bundleRoot)).toBe(true);
      owner.kill("SIGKILL");
      for (let attempt = 0; attempt < 200; attempt += 1) {
        const alive = [providerPid, descendantPid].filter((pid) => {
          try { process.kill(pid, 0); return true; }
          catch (error) {
            if (error.code === "ESRCH") return false;
            throw error;
          }
        });
        if (alive.length === 0) { providerPid = null; descendantPid = null; break; }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(providerPid).toBeNull();
      expect(descendantPid).toBeNull();
      for (let attempt = 0; attempt < 200 && existsSync(bundleRoot); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(existsSync(bundleRoot)).toBe(false);
    } finally {
      if (owner.exitCode === null) owner.kill("SIGKILL");
      for (const pid of [providerPid, descendantPid]) {
        if (pid) {
          try { process.kill(pid, "SIGKILL"); } catch { /* already gone */ }
        }
      }
      if (bundleRoot) rmSync(bundleRoot, { recursive: true, force: true });
    }
  });

  it.skipIf(process.platform === "win32")("keeps the shared packet while one provider is still live, then cleans it after owner loss", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-owner-loss-pair-"));
    roots.push(root);
    const executable = join(root, "fake-codex");
    const fastPidFile = join(root, "fast.pid");
    const slowPidFile = join(root, "slow.pid");
    const slowTermFile = join(root, "slow.term");
    writeFileSync(executable, `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
const model = args[args.indexOf("--model") + 1];
if (model === "fast") {
  fs.writeFileSync(${JSON.stringify(fastPidFile)}, String(process.pid));
  process.stdout.write(JSON.stringify({type:"item.completed",item:{type:"agent_message",text:JSON.stringify({findings:[]})}})+"\\n");
  process.stdout.write(JSON.stringify({type:"turn.completed"})+"\\n");
} else {
  process.on("SIGTERM", () => fs.writeFileSync(${JSON.stringify(slowTermFile)}, "term"));
  fs.writeFileSync(${JSON.stringify(slowPidFile)}, String(process.pid));
  setInterval(() => {}, 1000);
}
`, { mode: 0o700 });
    const trustedContext = configuredContext(["codex/fast", "codex/slow"], executable);
    trustedContext.providerConfig.providers["codex/fast"].model = "fast";
    trustedContext.providerConfig.providers["codex/slow"].model = "slow";
    const packet = configuredPacket();
    const priorHostDirs = new Set(readdirSync(tmpdir()).filter((name) =>
      name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")));
    const driver = `
import { runConfiguredOcrHostReview } from ${JSON.stringify(new URL("../../runtime/review/ocr-delegation-adapter.mjs", import.meta.url).href)};
await runConfiguredOcrHostReview({ request: ${JSON.stringify(request)}, packet: ${JSON.stringify(packet)} }, {
  trustedContext: ${JSON.stringify(trustedContext)},
});
`;
    const owner = spawn(process.execPath, ["--input-type=module", "-e", driver], { stdio: "ignore" });
    let bundleRoot;
    let slowPid;
    try {
      for (let attempt = 0; attempt < 200 && (!existsSync(fastPidFile) || !existsSync(slowPidFile)); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(existsSync(fastPidFile)).toBe(true);
      expect(existsSync(slowPidFile)).toBe(true);
      const fastPid = Number(readFileSync(fastPidFile, "utf8"));
      slowPid = Number(readFileSync(slowPidFile, "utf8"));
      for (let attempt = 0; attempt < 200; attempt += 1) {
        try { process.kill(fastPid, 0); }
        catch (error) { if (error.code === "ESRCH") break; throw error; }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(() => process.kill(fastPid, 0)).toThrow();
      process.kill(slowPid, 0);
      const created = readdirSync(tmpdir()).filter((name) =>
        name.startsWith("workflowhub-ocr-host-") && !name.startsWith("workflowhub-ocr-host-test-")
        && !priorHostDirs.has(name));
      expect(created).toHaveLength(1);
      bundleRoot = join(tmpdir(), created[0]);
      expect(existsSync(bundleRoot)).toBe(true);
      owner.kill("SIGKILL");
      for (let attempt = 0; attempt < 200 && !existsSync(slowTermFile); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(existsSync(slowTermFile)).toBe(true);
      process.kill(slowPid, 0);
      expect(existsSync(bundleRoot)).toBe(true);
      for (let attempt = 0; attempt < 200 && existsSync(bundleRoot); attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(existsSync(bundleRoot)).toBe(false);
      expect(() => process.kill(slowPid, 0)).toThrow();
      slowPid = null;
    } finally {
      if (owner.exitCode === null) owner.kill("SIGKILL");
      if (slowPid) {
        try { process.kill(slowPid, "SIGKILL"); } catch { /* already gone */ }
      }
      if (bundleRoot) rmSync(bundleRoot, { recursive: true, force: true });
    }
  });
});

function bundle(reviewPrompt = compliantReviewPrompt) {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-adapter-bundle-"));
  roots.push(root);
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, "src", "reviewed.mjs"), "export const reviewed = true;\n");
  writeFileSync(join(root, "changes.diff"), "diff --git a/src/reviewed.mjs b/src/reviewed.mjs\n");
  writeFileSync(join(root, "review-instructions.md"), `${reviewPrompt}\n`);
  return {
    bundleRoot: root,
    materialId: "a".repeat(64),
    manifest: [
      { path: "src/reviewed.mjs" },
      { path: "changes.diff" },
      { path: "review-instructions.md" },
    ],
  };
}

const request = Object.freeze({
  stage: "build-code",
  review_scope: "phase",
  subject_kind: "phase",
  phase_id: "P3",
  candidate_experiment: true,
});

function configuredPacket(content = "export const reviewed = true;\n") {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-host-test-"));
  roots.push(root);
  mkdirSync(join(root, "src"));
  const path = "src/reviewed.mjs";
  writeFileSync(join(root, path), content);
  const bytes = Buffer.from(content);
  return {
    root, material_id: "a".repeat(64),
    preview: { reviewable_files: [{ path }] },
    rules: { rules: [{ path, rule: "Inspect correctness." }] },
    manifest: [{ path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }],
  };
}

function configuredContext(providers, command) {
  return {
    trusted: {}, route: { mode: "single_round", minimum_heterologous: 1 },
    selection: { providers, provider_identities: Object.fromEntries(providers.map((provider) =>
      [provider, { source_id: provider + "-source", config_id: provider + "-config" }])) },
    providerConfig: { providers: Object.fromEntries(providers.map((provider) =>
      [provider, { enabled: true, command, model: "test-model" }])) },
  };
}

describe("OCR delegation adapter", () => {
  it("fails closed before spawning an OpenCode provider without enforceable read-only tools", async () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-ocr-opencode-"));
    roots.push(root);
    const marker = join(root, "spawned");
    const executable = join(root, "fake-opencode");
    writeFileSync(executable, `#!/usr/bin/env node\nrequire("node:fs").writeFileSync(${JSON.stringify(marker)}, "ran");\n`, { mode: 0o700 });
    const result = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["opencode/reviewer"], executable),
    });
    expect(existsSync(marker)).toBe(false);
    expect(result).toMatchObject({ status: "unavailable", provider_results: [
      { status: "failed", error: { code: "OCR_PROVIDER_UNSUPPORTED" } },
    ] });
    let controlledCalls = 0;
    const controlled = await runConfiguredOcrHostReview({ request, packet: configuredPacket() }, {
      trustedContext: configuredContext(["opencode/reviewer"], executable),
      providerExecutor: async () => { controlledCalls += 1; return { status: "completed", output: "{}" }; },
    });
    expect(controlledCalls).toBe(0);
    expect(controlled.provider_results[0].error.code).toBe("OCR_PROVIDER_UNSUPPORTED");
  });

  it.each([
    ["Agent/subagent", "Do not wait for or poll agents, sessions, or processes; do not invoke wait/poll tools."],
    ["wait/poll", "Do not invoke Agent, subagent, child-agent, or other agent tools."],
  ])("does not dispatch when the prompt omits the %s prohibition", async (_constraint, retainedConstraint) => {
    let calls = 0;
    const result = await runOcrDelegationRound(request, {
      buildBundle: () => bundle(retainedConstraint),
      executor: async () => { calls += 1; return { status: "available", outcome: "completed", findings: [] }; },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "OCR_PROMPT_CONSTRAINTS_MISSING" },
    });
    expect(calls).toBe(0);
  });

  it("also validates an explicitly supplied prompt before dispatch", async () => {
    let calls = 0;
    const result = await runOcrDelegationRound({ ...request, prompt: "Review the packet and return findings." }, {
      buildBundle: bundle,
      executor: async () => { calls += 1; return { status: "available", outcome: "completed", findings: [] }; },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "OCR_PROMPT_CONSTRAINTS_MISSING" },
    });
    expect(calls).toBe(0);
  });

  it("returns MATERIAL_INCOMPLETE as unavailable without dispatching", async () => {
    let calls = 0;
    const result = await runOcrDelegationRound(request, {
      buildBundle: () => { throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_criteria is empty"); },
      executor: async () => { calls += 1; return { status: "available", outcome: "completed", findings: [] }; },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "MATERIAL_INCOMPLETE" },
    });
    expect(calls).toBe(0);
  });

  it("runs deterministic packet preparation and stays unavailable without a host executor", async () => {
    const result = await runOcrDelegationRound(request, { buildBundle: bundle });

    expect(result).toMatchObject({
      status: "unavailable",
      outcome: "unavailable",
      material_id: "a".repeat(64),
      dispatch_state: "blocked_before_dispatch",
      error: { code: "OCR_DELEGATION_UNAVAILABLE" },
      provider_results: [],
      findings: [],
    });
    expect(result.ocr.preview.reviewable_files.length).toBeGreaterThan(0);
    expect(result.ocr.version).toMatch(/^open-code-review v\d+\.\d+\.\d+/);
    expect(result.ocr.preview.reviewable_files.map(({ path }) => path)).not.toContain("rule.json");
    expect(result.ocr.rules).toBeTruthy();
  });

  it("gives an independent executor only the materialized packet and removes it after use", async () => {
    let packetRoot;
    const result = await runOcrDelegationRound(request, {
      buildBundle: bundle,
      executor: async ({ packet }) => {
        packetRoot = packet.root;
        expect(existsSync(join(packet.root, "src", "reviewed.mjs"))).toBe(true);
        expect(existsSync(join(packet.root, "rule.json"))).toBe(false);
        expect(readFileSync(join(packet.root, "diff", "changes.md"), "utf8")).toContain("```diff");
        return { status: "available", outcome: "completed", findings: [], provider_results: [] };
      },
    });

    expect(result).toMatchObject({ status: "available", outcome: "completed", material_id: "a".repeat(64) });
    expect(result.ocr.version).toMatch(/^open-code-review v\d+\.\d+\.\d+/);
    expect(result.ocr.preview.repository).toBe("<host-path-redacted>");
    expect(JSON.stringify(result.ocr)).not.toContain("/private/var");
    expect(existsSync(packetRoot)).toBe(false);
  });

  it("binds verify-code semantic OCR output to redacted request evidence instead of forged executor fields", async () => {
    const authenticatedEvidence = { reviewed_execution: { ref: "quality/evidence/current.json" }, source_path: "/Users/Hugh/private/reviewed.mjs" };
    const result = await runOcrDelegationRound({ stage: "verify-code", authenticated_evidence: authenticatedEvidence }, {
      buildBundle: bundle,
      executor: async () => ({
        status: "available", outcome: "completed", findings: [], provider_results: [],
        authenticated_evidence: { source_path: "forged" }, authenticated_evidence_sha256: "0".repeat(64),
      }),
    });

    expect(result).toMatchObject({ status: "available", outcome: "completed" });
    expect(result.authenticated_evidence).toEqual({
      reviewed_execution: { ref: "quality/evidence/current.json" }, source_path: "<host-path-redacted>",
    });
    expect(result.authenticated_evidence_sha256).toBe(authenticatedEvidenceDigest(authenticatedEvidence));
    expect(JSON.stringify(result)).not.toContain("/Users/Hugh/private/reviewed.mjs");
  });

  it("keeps the original unavailable OCR error with the same redacted evidence digest", async () => {
    const authenticatedEvidence = { reviewed_execution: { ref: "quality/evidence/current.json" }, source_path: "/Users/Hugh/private/reviewed.mjs" };
    const result = await runOcrDelegationRound({ stage: "verify-code", authenticated_evidence: authenticatedEvidence }, {
      buildBundle: bundle,
    });

    expect(result).toMatchObject({
      status: "unavailable", dispatch_state: "blocked_before_dispatch",
      error: { code: "OCR_DELEGATION_UNAVAILABLE", message: "host OCR delegation executor is unavailable; no legacy review fallback was used" },
      provider_results: [], findings: [],
    });
    expect(result.authenticated_evidence).toEqual({
      reviewed_execution: { ref: "quality/evidence/current.json" }, source_path: "<host-path-redacted>",
    });
    expect(result.authenticated_evidence_sha256).toBe(authenticatedEvidenceDigest(authenticatedEvidence));
    expect(JSON.stringify(result)).not.toContain("/Users/Hugh/private/reviewed.mjs");
  });

  it("rejects manifest paths outside the bundle before reading or writing outside the packet", async () => {
    const sourceBundle = bundle();
    const outsideRoot = mkdtempSync(join(tmpdir(), "workflowhub-ocr-adapter-outside-"));
    roots.push(outsideRoot);
    const outsideDiff = join(outsideRoot, "payload.diff");
    const outsideMarkdown = join(outsideRoot, "payload.md");
    writeFileSync(outsideDiff, "external diff bytes\n");
    writeFileSync(outsideMarkdown, "preserve outside file\n");
    let executorCalled = false;

    const result = await runOcrDelegationRound(request, {
      buildBundle: () => ({
        ...sourceBundle,
        manifest: [{ path: relative(sourceBundle.bundleRoot, outsideDiff).split("\\").join("/") }],
      }),
      executor: async () => { executorCalled = true; return { status: "available", outcome: "completed", findings: [], provider_results: [] }; },
    });

    expect(result).toMatchObject({ status: "unavailable", error: { code: "OCR_PACKET_PREPARATION_FAILED" } });
    expect(executorCalled).toBe(false);
    expect(readFileSync(outsideMarkdown, "utf8")).toBe("preserve outside file\n");
  });

  it("redacts host paths from executor errors and OCR diagnostics", async () => {
    const result = await runOcrDelegationRound(request, {
      buildBundle: bundle,
      executor: async () => { throw new Error("failed reading /Users/Hugh/private/source.mjs and /tmp/ocr-secret"); },
    });

    const serialized = JSON.stringify(result);
    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "sent_unparsed",
      error: { code: "OCR_EXECUTOR_FAILED" },
      executor_error: "failed reading <host-path-redacted> and <host-path-redacted>",
    });
    expect(serialized).not.toContain("/Users/Hugh");
    expect(serialized).not.toContain("/tmp/ocr-secret");
    expect(serialized).not.toContain("/private/var/folders");
  });

  it("requests executor termination and bounds cleanup when the request is cancelled", async () => {
    const controller = new AbortController();
    let packetRoot;
    let terminationRequests = 0;
    let finishExecution;
    const execution = new Promise((resolve) => { finishExecution = resolve; });
    const pending = runOcrDelegationRound(request, {
      buildBundle: bundle,
      signal: controller.signal,
      cancellationGraceMs: 25,
      executor: ({ packet, registerCancellation }) => {
        packetRoot = packet.root;
        registerCancellation(() => {
          terminationRequests += 1;
          finishExecution(null);
        });
        return execution;
      },
    });

    controller.abort(new Error("review interrupted"));
    const result = await pending;

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "sent_unparsed",
      error: { code: "OCR_EXECUTOR_CANCELLED" },
      cancellation: { termination_requested: true, termination_confirmed: true },
    });
    expect(terminationRequests).toBe(1);
    expect(existsSync(packetRoot)).toBe(false);
  });

  it("records when executor termination cannot be confirmed within the grace period", async () => {
    const controller = new AbortController();
    let packetRoot;
    const pending = runOcrDelegationRound(request, {
      buildBundle: bundle,
      signal: controller.signal,
      cancellationGraceMs: 10,
      executor: ({ packet, registerCancellation }) => {
        packetRoot = packet.root;
        registerCancellation(() => undefined);
        return new Promise(() => {});
      },
    });

    controller.abort();
    const result = await pending;

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "sent_unparsed",
      error: { code: "OCR_EXECUTOR_CANCEL_UNCONFIRMED" },
      cancellation: { termination_requested: true, termination_confirmed: false, packet_cleanup: "deferred_until_executor_exit" },
    });
    expect(existsSync(packetRoot)).toBe(true);
    roots.push(packetRoot);
  });

  it("cleans the packet if an unconfirmed executor later exits", async () => {
    const controller = new AbortController();
    let packetRoot;
    let finishExecution;
    const execution = new Promise((resolve) => { finishExecution = resolve; });
    const pending = runOcrDelegationRound(request, {
      buildBundle: bundle,
      signal: controller.signal,
      cancellationGraceMs: 10,
      executor: ({ packet, registerCancellation }) => {
        packetRoot = packet.root;
        registerCancellation(async () => ({ confirmed: false }));
        return execution;
      },
    });

    controller.abort(new Error("operator cancellation was not confirmed"));
    const result = await pending;
    expect(result).toMatchObject({ error: { code: "OCR_EXECUTOR_CANCEL_UNCONFIRMED" } });
    expect(existsSync(packetRoot)).toBe(true);

    finishExecution(null);
    await new Promise((resolve) => setImmediate(resolve));
    expect(existsSync(packetRoot)).toBe(false);
  });

  it("does not start an executor when already cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    const result = await runOcrDelegationRound(request, {
      buildBundle: bundle,
      signal: controller.signal,
      executor: async () => { calls += 1; return null; },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      error: { code: "OCR_EXECUTOR_CANCELLED" },
    });
    expect(calls).toBe(0);
  });
});
