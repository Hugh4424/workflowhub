import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createTask } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { runOcrDelegationRound } from "../../runtime/review/ocr-delegation-adapter.mjs";
import { deliveredMaterialId } from "../../runtime/review/review-packet-identity.mjs";
import { runConfiguredOcrHostReview, stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";

const roots = [];
const materialId = createHash("sha256").update("ocr-route-fixture").digest("hex");

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-ocr-route-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "OCR route test"]);
  git(["config", "user.email", "ocr-route@test.local"]);
  writeFileSync(join(repo, "README.md"), "fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const taskId = randomUUID();
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId,
      created_at: "2026-09-22T00:00:00.000Z", target_repo_root: repo,
      issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) artifacts.writeAtomic(name, `# ${name}\n`);
  const home = join(root, "home");
  mkdirSync(home);
  return { root, repo, home, task, workspace };
}

function commitSnapshotFile(repo, path, bytes) {
  const target = join(repo, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
  execFileSync("git", ["-C", repo, "add", "--", path], { stdio: "ignore" });
  execFileSync("git", ["-C", repo, "-c", "user.email=ocr-route@test.local", "-c", "user.name=OCR route test", "commit", "-qm", `snapshot ${path}`], { stdio: "ignore" });
  return execFileSync("git", ["-C", repo, "rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim();
}

function createOcrSourceBundle(root, snapshotTree, files = {}) {
  const bundleRoot = join(root, `ocr-source-bundle-${randomUUID()}`);
  mkdirSync(bundleRoot, { recursive: true });
  const entries = {
    "source.json": Buffer.from(`${JSON.stringify({ snapshot_tree: snapshotTree })}\n`),
    ...Object.fromEntries(Object.entries(files).map(([path, value]) => [path, Buffer.isBuffer(value) ? value : Buffer.from(value)])),
  };
  for (const [path, bytes] of Object.entries(entries)) {
    const target = join(bundleRoot, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  }
  return {
    bundleRoot,
    manifest: Object.entries(entries).map(([path, bytes]) => ({
      path,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    })),
  };
}

function resultFor(request) {
  return {
    status: "available", stage: request.stage,
    review_track: request.review_track ?? null, review_scope: request.review_scope ?? null,
    review_kind: request.review_kind ?? null, material_id: materialId,
    runtime_id: "ocr-route-spy", outcome: "completed", findings: [],
    provider_results: [{
      provider: "codex/luna", status: "completed",
      identity: { provider: "codex/luna", adapter: "codex", source_id: "fixture/source", config_id: "fixture/config", model: "fixture-model" },
      error: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
      evidence_anchor_valid: [],
    }],
  };
}

function requestForOcrReview() {
  return {
    stage: "build-code",
    review_scope: "phase",
    subject_kind: "phase",
    phase_id: "P3",
    candidate_experiment: true,
  };
}

const compliantOcrReviewInstructions = [
  "Review the supplied implementation and report evidence-backed findings.",
  "Do not invoke Agent, subagent, child-agent, or other agent tools.",
  "Do not wait for or poll agents, sessions, or processes; do not invoke wait/poll tools.",
].join("\n");

function trustedOcrContext(root, providers = ["kimi/coding"]) {
  const attachmentRoot = join(root, "ocr-attachments");
  mkdirSync(attachmentRoot, { recursive: true });
  const provider_identities = Object.fromEntries(providers.map((provider) => [provider, {
    source_id: `${provider}-source`, config_id: `${provider}-config`,
  }]));
  const provider_models = Object.fromEntries(providers.map((provider) => [provider, `${provider}-model`]));
  return {
    trusted: {
      whReview: {}, command: ["/unused/3rd-review"], config: "trusted-config",
      attachmentRoot, attachmentSource: ".wh-review-packets",
    },
    route: { initial: providers, mode: "single_round", minimum_heterologous: 1 },
    selection: { providers, provider_identities, provider_models, eligibleProfiles: providers },
    providerConfig: { providers: Object.fromEntries(providers.map((provider) => [provider, {
      enabled: true, model: provider_models[provider],
    }])) },
  };
}

function directProviderOutput(provider, findings) {
  const review = JSON.stringify({ findings });
  return provider.startsWith("codex/")
    ? [
      JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: review } }),
      JSON.stringify({ type: "turn.completed" }),
    ].join("\n")
    : JSON.stringify({ role: "assistant", content: [{ type: "text", text: review }] });
}

const surfaces = [
  ["build-code/phase", { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1" }, true],
  ["build-code/integration", { stage: "build-code", review_scope: "integration", subject_kind: "worktree", phase_id: null }, true],
  ["verify-code", { stage: "verify-code" }, true],
  ["make-decision/direction", { stage: "make-decision", review_track: "direction" }, false],
  ["make-decision/detail", { stage: "make-decision", review_track: "detail" }, false],
  ["build-spec", { stage: "build-spec" }, false],
  ["build-plan", { stage: "build-plan" }, false],
  ["mini-task/design", { stage: "build-code", review_kind: "mini_task.design", review_scope: "phase", subject_kind: "phase", phase_id: "P1" }, false],
  ["mini-task/implementation", { stage: "build-code", review_kind: "mini_task.implementation", review_scope: "phase", subject_kind: "phase", phase_id: "P1" }, false],
];

describe("OCR delegation public review route", () => {
  // build_prd uses a separate report-only entrypoint. `review --action=record`
  // rejects stage=build-prd before either injected runner, so this CLI seam
  // cannot prove that seventh retained surface's dispatch choice.
  it.skip("ORACLE-P3-ROUTE: non_stage/build_prd remains on its report-only entrypoint");

  it("redacts host paths from provider materials without shifting lines or losing packet identity", async () => {
    const { root, repo } = fixture();
    const packetRoot = join(root, "ocr-path-projection-packet");
    mkdirSync(join(packetRoot, "src"), { recursive: true });
    const hostPath = "/Users/Hugh/private/ocr-private-source.mjs";
    const sourceText = `// source: ${hostPath}\nexport const answer = 42;\n`;
    const sourceBytes = Buffer.from(sourceText);
    writeFileSync(join(packetRoot, "src", "reviewed.mjs"), sourceBytes);
    const snapshotTree = commitSnapshotFile(repo, "src/reviewed.mjs", sourceBytes);
    const sourceBundle = createOcrSourceBundle(root, snapshotTree, { "src/reviewed.mjs": sourceBytes });
    const request = { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1", host_provider: "codex/luna" };
    const trustedContext = trustedOcrContext(root);
    const provider = "kimi/coding";
    const finding = {
      severity: "major", path: "src/reviewed.mjs", line: 2,
      issue: "The return value is fixed.", root_cause: "The implementation hard-codes its result.",
      recommendation: "Derive the result from its inputs.", evidence_kind: "direct",
      evidence: "The source says `export const answer = 42;`.",
    };
    let directInvocation = null;
    let receivedBytes = null;
    let promptText = null;
    const providerExecutor = async (value) => {
      directInvocation = value;
      receivedBytes = readFileSync(join(value.cwd, "src", "reviewed.mjs"));
      promptText = readFileSync(value.promptPath, "utf8");
      return { status: "completed", output: directProviderOutput(provider, [finding]) };
    };

    const result = await runConfiguredOcrHostReview({
      request,
      packet: {
        root: packetRoot, material_id: materialId,
        preview: { reviewable_files: [{ path: "src/reviewed.mjs" }] },
        rules: { rules: [{ path: "src/reviewed.mjs", rule: "Inspect code behavior." }] },
        manifest: [{
          path: "src/reviewed.mjs", bytes: sourceBytes.length,
          sha256: createHash("sha256").update(sourceBytes).digest("hex"),
        }],
      },
    }, { trustedContext, providerExecutor, sourceBundle, snapshotRoot: repo });

    const projectedBytes = receivedBytes;
    const projectedText = projectedBytes.toString("utf8");
    const deliveryManifest = [{
      path: "src/reviewed.mjs", bytes: projectedBytes.length,
      sha256: createHash("sha256").update(projectedBytes).digest("hex"),
    }];
    expect(promptText).not.toContain(hostPath);
    expect(projectedText).toBe("// source: <host-path-redacted>\nexport const answer = 42;\n");
    expect(projectedText.split(/\r?\n/)).toHaveLength(sourceText.split(/\r?\n/).length);
    expect(deliveredMaterialId(deliveryManifest)).not.toBe(materialId);
    expect(result.material_id).toBe(materialId);
    expect(result.provider_results[0].evidence_anchor_valid).toEqual([true]);
    expect(result.provider_results[0].coverage.selected_files).toEqual(["src/reviewed.mjs"]);
    expect(existsSync(directInvocation.cwd)).toBe(false);
  });

  it("fails closed when an OCR attachment cannot be projected as valid line-preserving text", async () => {
    const { root } = fixture();
    const packetRoot = join(root, "ocr-invalid-text-packet");
    mkdirSync(join(packetRoot, "src"), { recursive: true });
    const sourceBytes = Buffer.from([0xc3, 0x28]);
    writeFileSync(join(packetRoot, "src", "reviewed.mjs"), sourceBytes);
    let dispatchCalls = 0;
    await expect(runConfiguredOcrHostReview({
      request: { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1", host_provider: "codex/luna" },
      packet: {
        root: packetRoot, material_id: materialId,
        preview: { reviewable_files: [{ path: "src/reviewed.mjs" }] },
        rules: { rules: [{ path: "src/reviewed.mjs", rule: "Inspect code behavior." }] },
        manifest: [{
          path: "src/reviewed.mjs", bytes: sourceBytes.length,
          sha256: createHash("sha256").update(sourceBytes).digest("hex"),
        }],
      },
    }, {
      trustedContext: trustedOcrContext(root),
      providerExecutor: async () => { dispatchCalls += 1; },
    })).rejects.toMatchObject({ code: "OCR_ATTACHMENT_PROJECTION_FAILED" });
    expect(dispatchCalls).toBe(0);
  });

  // The former managed start/status/request-id assertions belong to the
  // retained seven broker surfaces. These three code surfaces use a direct
  // host executor; this test keeps the sibling, identity and cleanup contract.
  it("dispatches every selected direct host provider and preserves a successful sibling", async () => {
    const { root, repo } = fixture();
    const packetRoot = join(root, "ocr-direct-group-packet");
    mkdirSync(join(packetRoot, "src"), { recursive: true });
    const sourceBytes = Buffer.from("export const answer = 42;\n");
    writeFileSync(join(packetRoot, "src", "reviewed.mjs"), sourceBytes);
    const snapshotTree = commitSnapshotFile(repo, "src/reviewed.mjs", sourceBytes);
    const sourceBundle = createOcrSourceBundle(root, snapshotTree, { "src/reviewed.mjs": sourceBytes });
    const providers = ["kimi/coding", "codex/luna"];
    const trustedContext = trustedOcrContext(root, providers);
    const seen = [];
    const roots = [];
    const finding = {
      severity: "major", path: "src/reviewed.mjs", line: 1,
      issue: "The answer is hard-coded.", root_cause: "The function returns a fixed value.",
      recommendation: "Derive the answer from its input.", evidence_kind: "direct",
      evidence: "Source line: `export const answer = 42;`.",
    };
    const result = await runConfiguredOcrHostReview({
      request: { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1", host_provider: "claude-code/host" },
      packet: {
        root: packetRoot, material_id: materialId,
        preview: { reviewable_files: [{ path: "src/reviewed.mjs" }] },
        rules: { rules: [{ path: "src/reviewed.mjs", rule: "Inspect code behavior." }] },
        manifest: [{ path: "src/reviewed.mjs", bytes: sourceBytes.length, sha256: createHash("sha256").update(sourceBytes).digest("hex") }],
      },
    }, {
      trustedContext, sourceBundle, snapshotRoot: repo,
      providerExecutor: async ({ provider, cwd, promptPath }) => {
        seen.push(provider);
        roots.push(cwd);
        expect(readFileSync(join(cwd, "src", "reviewed.mjs"))).toEqual(sourceBytes);
        expect(readFileSync(promptPath, "utf8")).toContain("src/reviewed.mjs");
        return provider === "kimi/coding"
          ? { status: "failed", error: { code: "OCR_PROVIDER_EXIT_NONZERO", message: "provider failed" } }
          : { status: "completed", output: directProviderOutput(provider, [finding]), usage: { input_tokens: 4 } };
      },
    });
    expect(seen).toEqual(providers);
    expect(result).toMatchObject({ status: "available-with-failures", outcome: "completed", material_id: materialId, minimum_heterologous: 1 });
    expect(result.provider_results.map(({ status }) => status)).toEqual(["failed", "completed"]);
    expect(result.provider_results[0].error.code).toBe("OCR_PROVIDER_EXIT_NONZERO");
    expect(result.provider_results[1].identity).toMatchObject(trustedContext.selection.provider_identities["codex/luna"]);
    expect(result.provider_results[1].evidence_anchor_valid).toEqual([true]);
    expect(result.findings).toHaveLength(1);
    expect(roots.every((path) => !existsSync(path))).toBe(true);
  });

  // Broker request-id drift has no direct-host counterpart; the direct identity
  // boundary is the pinned provider config and the packet material identity.
  it("rejects direct provider configuration drift before any dispatch", async () => {
    const { root } = fixture();
    const packetRoot = join(root, "ocr-direct-drift-packet");
    mkdirSync(join(packetRoot, "src"), { recursive: true });
    const sourceBytes = Buffer.from("export const answer = 42;\n");
    writeFileSync(join(packetRoot, "src", "reviewed.mjs"), sourceBytes);
    const configPath = join(root, "provider-config.json");
    writeFileSync(configPath, '{"providers":{}}');
    const trustedContext = trustedOcrContext(root);
    trustedContext.trusted.config = configPath;
    trustedContext.provider_config_sha256 = "0".repeat(64);
    let calls = 0;
    await expect(runConfiguredOcrHostReview({
      request: { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1" },
      packet: {
        root: packetRoot, material_id: materialId,
        preview: { reviewable_files: [{ path: "src/reviewed.mjs" }] },
        rules: { rules: [{ path: "src/reviewed.mjs", rule: "Inspect code behavior." }] },
        manifest: [{ path: "src/reviewed.mjs", bytes: sourceBytes.length, sha256: createHash("sha256").update(sourceBytes).digest("hex") }],
      },
    }, { trustedContext, providerExecutor: async () => { calls += 1; } }))
      .rejects.toMatchObject({ code: "OCR_PROVIDER_CONFIG_DRIFT", dispatch_state: "blocked_before_dispatch" });
    expect(calls).toBe(0);
  });

  // The direct host waits for its child result across the old broker timeout.
  // Real process liveness/progress and owner-loss cleanup are covered by
  // ocr-delegation-adapter.test.mjs at the process supervisor boundary.
  it("keeps a direct host review pending past ten minutes until the provider exits", async () => {
    vi.useFakeTimers();
    try {
      const { root } = fixture();
      const packetRoot = join(root, "ocr-direct-long-packet");
      mkdirSync(join(packetRoot, "src"), { recursive: true });
      const sourceBytes = Buffer.from("export const answer = 42;\n");
      writeFileSync(join(packetRoot, "src", "reviewed.mjs"), sourceBytes);
      let finish;
      let started;
      const dispatched = new Promise((resolve) => { started = resolve; });
      let directRoot;
      let settled = false;
      const pending = runConfiguredOcrHostReview({
        request: { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1" },
        packet: {
          root: packetRoot, material_id: materialId,
          preview: { reviewable_files: [{ path: "src/reviewed.mjs" }] },
          rules: { rules: [{ path: "src/reviewed.mjs", rule: "Inspect code behavior." }] },
          manifest: [{ path: "src/reviewed.mjs", bytes: sourceBytes.length, sha256: createHash("sha256").update(sourceBytes).digest("hex") }],
        },
      }, {
        trustedContext: trustedOcrContext(root),
        providerExecutor: ({ cwd }) => {
          directRoot = cwd;
          started();
          return new Promise((resolve) => { finish = resolve; });
        },
      }).then((result) => { settled = true; return result; });
      await dispatched;
      await vi.advanceTimersByTimeAsync(600_001);
      expect(settled).toBe(false);
      expect(existsSync(directRoot)).toBe(true);
      finish({ status: "completed", output: directProviderOutput("kimi/coding", []) });
      const result = await pending;
      expect(result).toMatchObject({ status: "available", outcome: "completed", material_id: materialId });
      expect(existsSync(directRoot)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it.each(["cancelled", "failed"])("keeps direct terminal facts after explicit cancellation (%s)", async (terminal) => {
    const { root } = fixture();
    const packetRoot = join(root, "ocr-direct-cancel-packet");
    mkdirSync(join(packetRoot, "src"), { recursive: true });
    const sourceBytes = Buffer.from("export const answer = 42;\n");
    writeFileSync(join(packetRoot, "src", "reviewed.mjs"), sourceBytes);
    const controller = new AbortController();
    let directRoot;
    let started;
    const dispatched = new Promise((resolve) => { started = resolve; });
    const pending = runConfiguredOcrHostReview({
      request: { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1" },
      packet: {
        root: packetRoot, material_id: materialId,
        preview: { reviewable_files: [{ path: "src/reviewed.mjs" }] },
        rules: { rules: [{ path: "src/reviewed.mjs", rule: "Inspect code behavior." }] },
        manifest: [{ path: "src/reviewed.mjs", bytes: sourceBytes.length, sha256: createHash("sha256").update(sourceBytes).digest("hex") }],
      },
      signal: controller.signal,
    }, {
      trustedContext: trustedOcrContext(root),
      providerExecutor: ({ cwd, signal }) => {
        directRoot = cwd;
        started();
        return new Promise((resolve) => signal.addEventListener("abort", () => resolve({
          status: terminal, error: { code: terminal === "cancelled" ? "OCR_PROVIDER_CANCELLED" : "OCR_PROVIDER_EXIT_NONZERO" },
        }), { once: true }));
      },
    });
    await dispatched;
    controller.abort(new Error("operator cancelled"));
    const result = await pending;
    expect(result.provider_results[0]).toMatchObject({
      status: terminal, error: { code: terminal === "cancelled" ? "OCR_PROVIDER_CANCELLED" : "OCR_PROVIDER_EXIT_NONZERO" },
    });
    expect(result).toMatchObject({ status: "unavailable", outcome: terminal === "cancelled" ? "cancelled" : "failed" });
    expect(existsSync(directRoot)).toBe(false);
  });

  // Managed start retries and uncertain acknowledgements were broker-only.
  // Direct execution owns its packet until the pending provider settles.
  it("retains direct attachments while a cancelled provider is still exiting", async () => {
    const { root } = fixture();
    const packetRoot = join(root, "ocr-direct-pending-packet");
    mkdirSync(join(packetRoot, "src"), { recursive: true });
    const sourceBytes = Buffer.from("export const answer = 42;\n");
    writeFileSync(join(packetRoot, "src", "reviewed.mjs"), sourceBytes);
    const controller = new AbortController();
    let directRoot;
    let finish;
    let started;
    const dispatched = new Promise((resolve) => { started = resolve; });
    const pending = runConfiguredOcrHostReview({
      request: { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1" },
      packet: {
        root: packetRoot, material_id: materialId,
        preview: { reviewable_files: [{ path: "src/reviewed.mjs" }] },
        rules: { rules: [{ path: "src/reviewed.mjs", rule: "Inspect code behavior." }] },
        manifest: [{ path: "src/reviewed.mjs", bytes: sourceBytes.length, sha256: createHash("sha256").update(sourceBytes).digest("hex") }],
      },
      signal: controller.signal,
    }, {
      trustedContext: trustedOcrContext(root),
      providerExecutor: ({ cwd }) => {
        directRoot = cwd;
        started();
        return new Promise((resolve) => { finish = resolve; });
      },
    });
    await dispatched;
    controller.abort(new Error("operator cancelled"));
    expect(existsSync(join(directRoot, "src", "reviewed.mjs"))).toBe(true);
    finish({ status: "cancelled", error: { code: "OCR_PROVIDER_CANCELLED" } });
    const result = await pending;
    expect(result).toMatchObject({ status: "unavailable", outcome: "cancelled" });
    expect(existsSync(directRoot)).toBe(false);
  });

  it("makes selected diff shards reviewable in the isolated OCR packet", async () => {
    const bundleRoot = mkdtempSync(join(tmpdir(), "workflowhub-ocr-diff-shard-bundle-"));
    roots.push(bundleRoot);
    mkdirSync(join(bundleRoot, "diff-shards"), { recursive: true });
    const shard = "diff --git a/src/reviewed.mjs b/src/reviewed.mjs\n@@ -1 +1 @@\n+OCR_DIFF_SHARD_MARKER\n";
    writeFileSync(join(bundleRoot, "diff-shards", "S-0005.diff"), shard);
    writeFileSync(join(bundleRoot, "review-instructions.md"), `${compliantOcrReviewInstructions}\n`);
    let packetRoot;

    const result = await runOcrDelegationRound(requestForOcrReview(), {
      buildBundle: () => ({ bundleRoot, materialId, manifest: [
        { path: "diff-shards/S-0005.diff" },
        { path: "review-instructions.md" },
      ] }),
      executor: async ({ packet }) => {
        packetRoot = packet.root;
        const reviewable = packet.preview.reviewable_files.map(({ path }) => path);
        expect(reviewable).toContain("diff-shards/S-0005.md");
        expect(readFileSync(join(packet.root, "diff-shards", "S-0005.md"), "utf8"))
          .toContain("OCR_DIFF_SHARD_MARKER");
        expect(packet.manifest.map(({ path }) => path)).toContain("diff-shards/S-0005.md");
        return resultFor(requestForOcrReview());
      },
    });

    expect(result.status).toBe("available");
    expect(result.ocr.preview.reviewable_files.map(({ path }) => path)).toContain("diff-shards/S-0005.md");
    expect(existsSync(packetRoot)).toBe(false);
  });

  it("maps OCR diff-shard anchors to snapshot source lines and leaves synthetic packet anchors invalid", async () => {
    const { root, repo } = fixture();
    const sourceText = "export const before = true;\nexport const answer = 42;\n";
    const sourceBytes = Buffer.from(sourceText);
    const snapshotTree = commitSnapshotFile(repo, "src/reviewed.mjs", sourceBytes);
    const diffText = [
      "diff --git a/src/reviewed.mjs b/src/reviewed.mjs",
      "index 1111111..2222222 100644",
      "--- a/src/reviewed.mjs",
      "+++ b/src/reviewed.mjs",
      "@@ -1 +1,2 @@",
      " export const before = true;",
      "+export const answer = 42;",
      "",
    ].join("\n");
    const diffBytes = Buffer.from(diffText);
    const materialText = "This is a numbered packet material without source provenance.\n";
    const index = {
      schema_version: "wh-review-diff-index.v1",
      changes: [{
        path: "src/reviewed.mjs",
        shards: [{
          shard_id: "S-0005", offset: 0, bytes: diffBytes.length,
          sha256: createHash("sha256").update(diffBytes).digest("hex"), delivery: "included",
        }],
      }],
    };
    const sourceBundle = createOcrSourceBundle(root, snapshotTree, {
      "diff-index.json": `${JSON.stringify(index)}\n`,
      "diff-shards/S-0005.diff": diffBytes,
      "materials/07-note.md": materialText,
    });
    const packetRoot = join(root, "ocr-source-mapped-packet");
    mkdirSync(join(packetRoot, "diff-shards"), { recursive: true });
    mkdirSync(join(packetRoot, "materials"), { recursive: true });
    const diffPacketPath = "diff-shards/S-0005.md";
    const diffPacketText = `# WorkflowHub candidate diff: diff-shards/S-0005.diff\n\n\`\`\`diff\n${diffText}\n\`\`\`\n`;
    writeFileSync(join(packetRoot, diffPacketPath), diffPacketText);
    writeFileSync(join(packetRoot, "materials/07-note.md"), materialText);
    const packetFiles = [
      { path: diffPacketPath, content: diffPacketText },
      { path: "materials/07-note.md", content: materialText },
    ];
    const packetManifest = packetFiles.map(({ path, content }) => {
      const bytes = Buffer.from(content);
      return { path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
    });
    const findings = [
      {
        severity: "major", path: diffPacketPath,
        line: diffPacketText.split("\n").findIndex((line) => line === "+export const answer = 42;") + 1,
        issue: "The changed answer is fixed.", root_cause: "The new source line hard-codes the answer.",
        recommendation: "Derive the answer from its inputs.", evidence_kind: "direct",
        evidence: "The added line is `+export const answer = 42;`.",
      },
      {
        severity: "major", path: "materials/07-note.md", line: 1,
        issue: "The numbered material makes an unsupported claim.", root_cause: "The packet does not bind this material line to a source file.",
        recommendation: "Do not treat this packet-only anchor as actionable.", evidence_kind: "inferred",
        evidence: "The packet says `This is a numbered packet material`.",
      },
    ];
    const request = { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3", host_provider: "codex/luna" };
    const trustedContext = trustedOcrContext(root);
    const provider = "kimi/coding";
    let directRoot = null;
    const providerExecutor = async ({ cwd }) => {
      directRoot = cwd;
      return { status: "completed", output: directProviderOutput(provider, findings) };
    };

    const result = await runConfiguredOcrHostReview({
      request,
      packet: {
        root: packetRoot, material_id: materialId,
        preview: { reviewable_files: packetFiles.map(({ path }) => ({ path })) },
        rules: { rules: packetFiles.map(({ path }) => ({ path, rule: "Inspect the supplied source evidence." })) },
        manifest: packetManifest,
      },
    }, { trustedContext, providerExecutor, sourceBundle, snapshotRoot: repo });

    expect(result.findings.map(({ path, line }) => ({ path, line }))).toEqual([
      { path: "src/reviewed.mjs", line: 2 },
      { path: "materials/07-note.md", line: 1 },
    ]);
    expect(result.provider_results[0].evidence_anchor_valid).toEqual([true, false]);
    expect(existsSync(directRoot)).toBe(false);
  });

  it("keeps an active delegated executor running beyond ten minutes until terminal output", async () => {
    vi.useFakeTimers();
    const bundleRoot = mkdtempSync(join(tmpdir(), "workflowhub-ocr-long-review-bundle-"));
    roots.push(bundleRoot);
    mkdirSync(join(bundleRoot, "src"), { recursive: true });
    writeFileSync(join(bundleRoot, "src", "reviewed.mjs"), "export const answer = 42;\n");
    writeFileSync(join(bundleRoot, "review-instructions.md"), `${compliantOcrReviewInstructions}\n`);
    let packetRoot = null;
    let finishExecution;
    let cancellationRequests = 0;
    let executorSignal = null;
    const execution = new Promise((resolve) => { finishExecution = resolve; });

    const pending = runOcrDelegationRound(requestForOcrReview(), {
      buildBundle: () => ({ bundleRoot, materialId, manifest: [
        { path: "src/reviewed.mjs" },
        { path: "review-instructions.md" },
      ] }),
      executor: ({ packet, signal, registerCancellation }) => {
        packetRoot = packet.root;
        executorSignal = signal;
        registerCancellation(async () => {
          cancellationRequests += 1;
          finishExecution(null);
          return { confirmed: true };
        });
        return execution;
      },
    });

    try {
      await vi.advanceTimersByTimeAsync(600_001);
      const cancellationRequestsAfterTenMinutes = cancellationRequests;
      const packetPresentAfterTenMinutes = existsSync(packetRoot);
      finishExecution(resultFor(requestForOcrReview()));
      const result = await pending;

      expect(cancellationRequestsAfterTenMinutes).toBe(0);
      expect(packetPresentAfterTenMinutes).toBe(true);
      expect(executorSignal?.aborted).toBe(false);
      expect(result).toMatchObject({ status: "available", outcome: "completed" });
      expect(cancellationRequests).toBe(0);
      expect(existsSync(packetRoot)).toBe(false);
    } finally {
      finishExecution(null);
      vi.useRealTimers();
    }
  });

  it("persists a failed OCR candidate through the public review recorder", async () => {
    const { root, home, task, workspace } = fixture();
    mkdirSync(join(workspace.worktreeRoot, "src"), { recursive: true });
      writeFileSync(join(workspace.worktreeRoot, "src", "failed-review.mjs"), "export const candidate = true;\n");
    const inputPath = join(root, "failed-review-request.json");
    writeFileSync(inputPath, JSON.stringify({ request: {
      stage: "verify-code",
      subject_kind: "worktree",
      candidate_experiment: true,
      host_provider: "codex/luna",
      materials: {
        changed_files: "src/failed-review.mjs",
        implementation_assessment: "Candidate packet failed-executor persistence test.",
        test_context: "The focused executor failure path is exercised below.",
        open_risks: "No provider pass is claimed by this transport test.",
        acceptance_criteria: "AC-REVIEW-004: verify-code candidate packets preserve full AC beside the real diff.",
      },
    } }));

    let executorStarted = false;
    const previousHome = process.env.HOME;
    const previousTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
    process.env.HOME = home;
    process.env.WORKFLOWHUB_TASK_DIR = root;
    try {
      const recorded = await stageRuntimeCliMain([
        "review", "--action=record", "--stage=verify-code", "--project=workflowhub",
        `--task=${task.identity.taskId}`, `--input=${inputPath}`,
      ], {
        cwd: workspace.worktreeRoot,
        services: {
          resolveRouteIdentity: () => ({ route_identity: "a".repeat(64) }),
          reviewBundleDependencies: { loadConfig: () => ({ attachmentRoot: root }) },
          ocrExecutor: () => {
            executorStarted = true;
            throw Object.assign(new Error("fixture executor failed after dispatch"), { code: "FIXTURE_EXECUTOR_FAILED" });
          },
        },
      });

      expect(executorStarted).toBe(true);
      expect(recorded).toMatchObject({ status: "recorded", reused: false, dispatch_state: "sent_unparsed" });
      const attempt = JSON.parse(task.readRecord(recorded.attempt_ref));
      expect(attempt).toMatchObject({
        stage: "verify-code",
        terminal_status: "unavailable",
        dispatch_state: "sent_unparsed",
        error: { code: "OCR_EXECUTOR_FAILED" },
        provider_attempts: [],
      });
      expect(existsSync(task.recordPath("quality/reviews/request-locks/current-request.lock"))).toBe(false);
    } finally {
      if (previousHome === undefined) delete process.env.HOME; else process.env.HOME = previousHome;
      if (previousTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = previousTaskDir;
    }
  });

  const candidates = surfaces.flatMap(([surface, identity, codeSurface]) => [
    ...(identity.stage === "build-code" && identity.review_kind === undefined
      ? []
      : [[`${surface} production`, identity, false, codeSurface]]),
    [`${surface} isolated candidate`, identity, true, codeSurface],
  ]);

  it.each(candidates)("ORACLE-P3-CANDIDATE: %s chooses its permitted runner", async (_surface, identity, candidateExperiment, useOcr) => {
    const { root, home, task, workspace } = fixture();
    const inputPath = join(root, "review-input.json");
    writeFileSync(inputPath, JSON.stringify({ request: {
      ...identity, ...(candidateExperiment ? { candidate_experiment: true } : {}),
      host_provider: "codex/luna", materials: { implementation: "ocr-route-fixture" },
    } }));
    const calls = { ocr: 0, existing: 0 };
    let observedCandidateFlag = null;
    const previousHome = process.env.HOME;
    const previousTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
    process.env.HOME = home;
    process.env.WORKFLOWHUB_TASK_DIR = root;
    try {
      await stageRuntimeCliMain([
        "review", "--action=record", `--stage=${identity.stage}`, "--project=workflowhub",
        `--task=${task.identity.taskId}`, `--input=${inputPath}`,
      ], {
        cwd: workspace.worktreeRoot,
        services: {
          resolveRouteIdentity: () => ({ route_identity: "a".repeat(64) }),
          materialIdForRequest: () => materialId,
          runOcrDelegationRound: async (request) => { calls.ocr += 1; observedCandidateFlag = request.candidate_experiment === true; return resultFor(request); },
          runReviewRound: async (request) => { calls.existing += 1; observedCandidateFlag = request.candidate_experiment === true; return resultFor(request); },
        },
      });
      expect(observedCandidateFlag).toBe(candidateExperiment);
      expect(calls).toEqual(useOcr ? { ocr: 1, existing: 0 } : { ocr: 0, existing: 1 });
    } finally {
      if (previousHome === undefined) delete process.env.HOME; else process.env.HOME = previousHome;
      if (previousTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = previousTaskDir;
    }
  });

  it("rejects a malformed ordinary verify-code tuple before either runner", async () => {
    const { root, home, task, workspace } = fixture();
    const inputPath = join(root, "malformed-verify-review.json");
    writeFileSync(inputPath, JSON.stringify({ request: {
      stage: "verify-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1",
      host_provider: "codex/luna", materials: { implementation: "current diff" },
    } }));
    const previousHome = process.env.HOME;
    const previousTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
    process.env.HOME = home;
    process.env.WORKFLOWHUB_TASK_DIR = root;
    const calls = { ocr: 0, existing: 0 };
    try {
      await expect(stageRuntimeCliMain([
        "review", "--action=record", "--stage=verify-code", "--project=workflowhub",
        `--task=${task.identity.taskId}`, `--input=${inputPath}`,
      ], { cwd: workspace.worktreeRoot, services: {
        runOcrDelegationRound: async () => { calls.ocr += 1; },
        runReviewRound: async () => { calls.existing += 1; },
      } })).rejects.toThrow(/malformed OCR code-surface request/);
      expect(calls).toEqual({ ocr: 0, existing: 0 });
    } finally {
      if (previousHome === undefined) delete process.env.HOME; else process.env.HOME = previousHome;
      if (previousTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = previousTaskDir;
    }
  });
});
