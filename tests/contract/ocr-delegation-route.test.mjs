import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../runtime/evidence/artifact-dir.mjs";
import { runOcrDelegationRound } from "../../runtime/review/ocr-delegation-adapter.mjs";
import { deliveredMaterialId } from "../../runtime/review/review-packet-identity.mjs";
import { prepareTaskBoundBuildCodeReviewBundle, runConfiguredOcrHostReview, stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";

import { buildReviewMaterials } from "../../skills/wh-review/scripts/review-materials.mjs";
const roots = [];
// Only genuine deterministic OCR-dependent materialization cases may skip for
// an absent executable; low/invalid versions or other errors must still run.
const realOcrMissing=(()=>{try{execFileSync("ocr",["--version"],{stdio:"pipe"});return false;}catch(error){return error.code==="ENOENT";}})();
async function withOwnedOcr(state,action){const before=process.env.PATH,storage=process.env.WORKFLOWHUB_TASK_DIR;process.env.PATH=`${state.bin}:${before ?? "/usr/bin:/bin"}`;process.env.WORKFLOWHUB_TASK_DIR=state.root;try{return await action();}finally{if(before===undefined)delete process.env.PATH;else process.env.PATH=before;if(storage===undefined)delete process.env.WORKFLOWHUB_TASK_DIR;else process.env.WORKFLOWHUB_TASK_DIR=storage;}}

const materialId = createHash("sha256").update("ocr-route-fixture").digest("hex");

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function git(cwd, args) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

async function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "ocr-route-current-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub OCR fallback test"]);
  git(repo, ["config", "user.email", "ocr-fallback@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "ocr fallback fixture\n", "utf8");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "fixture"]);
  const taskId = `ocr-route-current-${Math.random().toString(16).slice(2)}`;
  const worktreeRoot = join(root, "worktree");
  git(repo, ["worktree", "add", "-q", "-b", `task/workflowhub/${taskId}`, worktreeRoot, "main"]);
  const taskDir = join(root, "Projects", "workflowhub", "tasks", taskId);
  mkdirSync(taskDir, { recursive: true });
  writeFileSync(join(taskDir, "task.json"), JSON.stringify({
    schema_version: "1.0.0", record_model: "vnext-single-write", activation_cohort: "post",
    project_name: "workflowhub", task_id: taskId, created_at: "2026-10-03T00:00:00.000Z",
    target_repo_root: worktreeRoot, workspace_mode: "existing", workspace_root: worktreeRoot,
    issue_ids: [], inputs: {},
  }));
  writeFileSync(join(taskDir, "facts.jsonl"), "");
  const materialRoot = join(worktreeRoot, "specs", taskId);
  mkdirSync(join(materialRoot, "phases"), { recursive: true });
  writeFileSync(join(materialRoot, "decision-log.md"), "# Decision log\n\n## 任务身份\n\n- **任务类型**：普通任务\n");
  const gate = "npx --no-install vitest run tests/contract/ocr-route-current.test.mjs --reporter=dot";
  const paths = ["prior-one.md", "prior-two.md", "README.md"];
  const trace = paths.map((_file, i) => `| R-001 | FR-1 | AC-1 | P${i + 1}/T00${i + 1} | ORACLE-OCR-FALLBACK |`);
  writeFileSync(join(materialRoot, "spec.md"), [
    "# Owned OCR routing fixture", "- **FR-1**：OCR availability and same-surface fallback.",
    "- [ ] **AC-1 — OCR routing**", "  - **需求**：FR-1",
    "  - **验证方法**：actual assertions in this frozen fallback test.",
    "  - **通过条件**：actual routing and failure assertions pass.", "  - **失败条件**：wrong route or false fallback.",
    "## 实现设计（全局权威）", "### Code Anchors", "The owned source is `README.md`.",
    "### Interfaces and Failure Semantics", "Preserve current code surface and unavailable provider errors.",
    "### Requirement-to-Task Trace", "| source | FR | AC | task | oracle |", "| --- | --- | --- | --- | --- |", ...trace,
    "### Global Verification Strategy", `\`${gate}\``, "",
  ].join("\n"));
  writeFileSync(join(materialRoot, "phases", "index.md"), [
    "# Phase index", "## Execution Index",
    "| phase | authority ref | semantic anchor | write set | dependency | consumer |", "| --- | --- | --- | --- | --- | --- |",
    ...paths.map((file, i) => `| \`P${i + 1}\` | \`phases/P${i + 1}.md\` | \`phase-p${i + 1}\` | \`${file}\` | ${i === 0 ? "none" : `P${i}`} | OCR routing fixture |`), "",
  ].join("\n"));
  for (const [i, file] of paths.entries()) {
    const n = i + 1;
    writeFileSync(join(materialRoot, "phases", `P${n}.md`), [
      `# Phase P${n} — owned fixture`, "- **Global spec**：`spec.md`", `- **Write set**：\`${file}\``,
      `- **Dependency**：${i === 0 ? "none" : `P${i}`}`, "- **Consumer**：OCR routing fixture", "## L0",
      `- **gate_cmd**：\`${gate}\``, "- **expected_exit**：0 only after actual assertions pass",
      "- **oracle**：ORACLE-OCR-FALLBACK", "- **evidence_path**：quality/tests/output/owned-fixture.output",
      "- **STOP**：preserve an actual routing failure", "- **Done**：actual assertions only, not production quality", "## L1",
      `### T00${n} — owned routing fixture`, "- **Source / FR / AC**：R-001 / FR-1 / AC-1",
      `- **Files / symbols**：\`${file}\` (symbol: N/A — fixture source text)`, "- **Action**：read the actual routing fixture",
      "- **Inputs**：owned Git and plain task metadata", "- **Outputs / failure**：same code surface or observable unavailable",
      "- **Boundary / DO NOT TOUCH**：no production or user repositories", `- **Dependency**：${i === 0 ? "none" : `T00${i}`}`,
      "- **Test tier / skill**：feature / backend-testing", "- **Scenario / fixture or service**：owned CLI and injected reviewer result",
      `- **RED/GREEN gate_cmd**：\`${gate}\``, "- **expected_exit**：RED nonzero; GREEN 0",
      "- **RED target failure**：ORACLE-OCR-FALLBACK wrong routing assertion fails", "- **GREEN oracle**：ORACLE-OCR-FALLBACK actual assertions",
      "- **Evidence**：quality/tests/output/owned-fixture.output", "- **STOP / recovery**：no claimed provider call without one",
      "- **Coverage limit**：no external provider quality", "- **Done**：actual targeted assertions only", "## L2",
      "Owned fixture data, not a WorkflowHub execution permit.", "",
    ].join("\n"));
  }
  writeFileSync(join(worktreeRoot, "README.md"), "fallback implementation under review\n");

  // host config：third_review/wh_review 可解析，但 provider 命令指向不存在路径
  // （「config 无可用 provider」）。
  const home = join(root, "home");
  const hostDir = join(home, ".config", "workflowhub");
  mkdirSync(hostDir, { recursive: true });
  const attachmentRoot = join(root, "attachments");
  mkdirSync(attachmentRoot);
  const configPath = join(root, "providers.json");
  writeFileSync(configPath, JSON.stringify({
    tiers: [["codex/luna"]],
    providers: { "codex/luna": { enabled: true, model: "reviewer-model", command: join(root, "missing-ocr-provider") } },
    attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
  }));
  writeFileSync(join(hostDir, "config.json"), JSON.stringify({
    task_dir: root,
    third_review: { command: [join(root, "missing-wh-review-broker")], config: configPath, attachment_root: attachmentRoot },
    wh_review: { version: 2, stages: { "build-code": { initial: ["codex/luna"], mode: "full_only", minimum_heterologous: 1 } } },
  }));
  const task = openTask(taskDir, { projectName: "workflowhub", taskId });
  const workspace = await openCurrentTaskWorkspace(task);
  const bin=join(root,"bin");mkdirSync(bin);
  writeFileSync(join(bin,"ocr"),`#!${process.execPath}
if(process.argv[2]==="--version")console.log("1.12.9");else process.exitCode=9;
`,{mode:0o700});
  return { root, repo, home, taskId, taskDir, worktreeRoot, task, workspace, bin };
}


async function contextFor(state) {
  return { task: state.task, manifest: state.task.manifest, workspace: await openCurrentTaskWorkspace(state.task), artifacts: ArtifactDir.open(state.worktreeRoot, state.task) };
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
  ["build-code/phase", { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1" }, true, "approved_spec"],
  ["build-code/integration", { stage: "build-code", review_scope: "integration", subject_kind: "worktree", phase_id: null }, true, "implementation_summary"],
  ["verify-code", { stage: "verify-code" }, true, "implementation_assessment"],
  ["make-decision/direction", { stage: "make-decision", review_track: "direction" }, false, "raw_requirement"],
  ["make-decision/detail", { stage: "make-decision", review_track: "detail" }, false, "raw_requirement"],
  ["build-spec", { stage: "build-spec" }, false, "draft_spec"],
  ["build-plan", { stage: "build-plan" }, false, "approved_spec"],
  ["mini-task/design", { stage: "build-code", review_kind: "mini_task.design", review_scope: "phase", subject_kind: "phase", phase_id: "P1" }, false, "raw_requirement"],
  ["mini-task/implementation", { stage: "build-code", review_kind: "mini_task.implementation", review_scope: "phase", subject_kind: "phase", phase_id: "P1" }, false, "raw_requirement"],
];

describe("OCR delegation public review route", () => {
  // build_prd uses a separate report-only entrypoint. `review --action=record`
  // rejects stage=build-prd before either injected runner, so this CLI seam
  // cannot prove that seventh retained surface's dispatch choice.
  it.skip("ORACLE-P3-ROUTE: non_stage/build_prd remains on its report-only entrypoint");

  it("redacts host paths from provider materials without shifting lines or losing packet identity", async () => {
    const { root, repo } = await fixture();
    const packetRoot = join(root, "ocr-path-projection-packet");
    mkdirSync(join(packetRoot, "src"), { recursive: true });
    const hostPath = "/Users/Hugh/private/ocr-private-source.mjs";
    const sourceText = `// source: ${hostPath}\nexport const answer = 42;\n`;
    const sourceBytes = Buffer.from(sourceText);
    writeFileSync(join(packetRoot, "src", "reviewed.mjs"), sourceBytes);
    const snapshotTree = commitSnapshotFile(repo, "src/reviewed.mjs", sourceBytes);
    const sourceBundle = createOcrSourceBundle(root, snapshotTree, { "src/reviewed.mjs": sourceBytes });
    const request = { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1" };
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
    expect(promptText).toContain("cat, sed or rg");
    expect(promptText).toContain("verified native packet filesystem, tool and environment boundaries");
    expect(promptText).not.toContain("wait/poll, shell, Git");
    expect(promptText).toContain("Do not access parent directories or other host paths.");
    expect(projectedText).toBe("// source: <host-path-redacted>\nexport const answer = 42;\n");
    expect(projectedText.split(/\r?\n/)).toHaveLength(sourceText.split(/\r?\n/).length);
    expect(deliveredMaterialId(deliveryManifest)).not.toBe(materialId);
    expect(result.material_id).toBe(materialId);
    expect(result.provider_results[0].evidence_anchor_valid).toEqual([true]);
    expect(result.provider_results[0].coverage.selected_files).toEqual(["src/reviewed.mjs"]);
    expect(existsSync(directInvocation.cwd)).toBe(false);
  });

  it("fails closed when an OCR attachment cannot be projected as valid line-preserving text", async () => {
    const { root } = await fixture();
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
    const { root, repo } = await fixture();
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
    expect(result).toMatchObject({ status: "available-with-failures", outcome: "completed", material_id: materialId });
    expect(result.provider_results.map(({ status }) => status)).toEqual(["failed", "completed"]);
    expect(result.provider_results[0].error.code).toBe("OCR_PROVIDER_EXIT_NONZERO");
    expect(result.provider_results[1].identity).toMatchObject(trustedContext.selection.provider_identities["codex/luna"]);
    expect(result.provider_results[1].evidence_anchor_valid).toEqual([true]);
    expect(result.findings).toHaveLength(1);
    expect(roots.every((path) => !existsSync(path))).toBe(true);
  });

  it("processes the first provider immediately and later findings incrementally without cancelling siblings", async () => {
    const { root } = await fixture();
    const packetRoot = join(root, "ocr-direct-first-success-packet");
    mkdirSync(join(packetRoot, "src"), { recursive: true });
    const sourceBytes = Buffer.from("export const answer = 42;\n");
    writeFileSync(join(packetRoot, "src", "reviewed.mjs"), sourceBytes);
    const providers = ["kimi/coding", "codex/luna"];
    const trustedContext = trustedOcrContext(root, providers);
    const cancellationSignals = [];
    const processed = [];
    let codexDone = false;
    const result = await runConfiguredOcrHostReview({
      request: { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1" },
      packet: {
        root: packetRoot, material_id: materialId,
        preview: { reviewable_files: [{ path: "src/reviewed.mjs" }] },
        rules: { rules: [{ path: "src/reviewed.mjs", rule: "Inspect code behavior." }] },
        manifest: [{ path: "src/reviewed.mjs", bytes: sourceBytes.length, sha256: createHash("sha256").update(sourceBytes).digest("hex") }],
      },
    }, {
      trustedContext,
      providerExecutor: async ({ provider, signal }) => {
        cancellationSignals.push(signal);
        if (provider === "kimi/coding") {
          return { status: "completed", output: directProviderOutput(provider, []) };
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
        codexDone = true;
        return { status: "completed", output: directProviderOutput(provider, [{
          severity: "major", path: "src/reviewed.mjs", line: 1,
          issue: "The changed export is hard-coded.", root_cause: "The implementation returns a fixed value.",
          recommendation: "Derive the value from the actual input.", evidence_kind: "direct",
          evidence: "The source line is `export const answer = 42;`.",
        }]) };
      },
      onProviderResult: ({ provider, result: providerResult, pending_providers }) => {
        processed.push({ provider, findings: providerResult.findings, pending_providers });
        if (provider === "kimi/coding") expect(codexDone).toBe(false);
      },
    });
    expect(result).toMatchObject({ status: "available", outcome: "completed", material_id: materialId });
    expect(result.provider_results.map(({ status }) => status)).toEqual(["completed", "completed"]);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ provider: "codex/luna", path: "src/reviewed.mjs", line: 1 });
    expect(processed.map(({ provider }) => provider)).toEqual(["kimi/coding", "codex/luna"]);
    expect(processed[0]).toMatchObject({ provider: "kimi/coding", findings: [], pending_providers: ["codex/luna"] });
    expect(processed[1].findings).toHaveLength(1);
    expect(cancellationSignals.every((signal) => !signal.aborted)).toBe(true);
  });

  // Broker request-id drift has no direct-host counterpart; the direct identity
  // boundary is the pinned provider config and the packet material identity.
  it("rejects direct provider configuration drift before any dispatch", async () => {
    const { root } = await fixture();
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
  it("does not manufacture a transport deadline for an opaque trusted private executor", async () => {
    vi.useFakeTimers();
    try {
      const { root } = await fixture();
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
    const { root } = await fixture();
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
    const { root } = await fixture();
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

  it.skipIf(realOcrMissing)("makes selected diff shards reviewable in the isolated OCR packet", async () => {
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
        expect(reviewable).toContain("diff-shards/S-0005.diff");
        const copied = readFileSync(join(packet.root, "diff-shards", "S-0005.diff"));
        expect(copied.equals(Buffer.from(shard))).toBe(true);
        const copiedEntry = packet.manifest.find(({ path }) => path === "diff-shards/S-0005.diff");
        expect(copiedEntry.bytes).toBe(copied.length);
        expect(copiedEntry.sha256).toBe(createHash("sha256").update(copied).digest("hex"));
        expect(packet.manifest.map(({ path }) => path)).toContain("diff-shards/S-0005.diff");
        return resultFor(requestForOcrReview());
      },
    });

    expect(result.status).toBe("available");
    expect(result.ocr.preview.reviewable_files.map(({ path }) => path)).toContain("diff-shards/S-0005.diff");
    expect(existsSync(packetRoot)).toBe(false);
  });

  it("maps OCR diff-shard anchors to supplied physical source bytes and leaves packet-only context anchors invalid", async () => {
    const { root, repo } = await fixture();
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
      "src/reviewed.mjs": sourceBytes,
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
    // A selected valid shard must not authenticate a corrupt unselected chunk
    // merely because each raw chunk has its complete declared byte/hash entry.
    const invalidBytes=Buffer.from([0xff]);
    const invalidIndex={...index,changes:[{...index.changes[0],shards:[...index.changes[0].shards,{shard_id:"S-0006",offset:diffBytes.length,bytes:invalidBytes.length,sha256:createHash("sha256").update(invalidBytes).digest("hex"),delivery:"included"}]}]};
    const invalidBundle=createOcrSourceBundle(root,snapshotTree,{"diff-index.json":`${JSON.stringify(invalidIndex)}\n`,"diff-shards/S-0005.diff":diffBytes,"diff-shards/S-0006.diff":invalidBytes,"src/reviewed.mjs":sourceBytes});
    const invalid=await runConfiguredOcrHostReview({request,packet:{root:packetRoot,material_id:materialId,preview:{reviewable_files:packetFiles.map(({path})=>({path}))},rules:{rules:[]},manifest:packetManifest}},{trustedContext,providerExecutor,sourceBundle:invalidBundle});
    expect(invalid.provider_results[0].status).toBe("completed");
    expect(invalid.provider_results[0].evidence_anchor_valid).toEqual([false,false]);
    expect(invalid.findings[0]).toMatchObject({path:diffPacketPath,line:findings[0].line});
    expect(existsSync(directRoot)).toBe(false);
  });

  it.skipIf(realOcrMissing)("does not use diagnostic time as cancellation authority for an opaque private delegated executor", async () => {
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

  it("persists an actual private OCR runner failure through the current public single result writer without inventing dispatch", async()=>{
    const state=await fixture(),path=join(state.root,"failed-review-request.json");
    writeFileSync(path,JSON.stringify({request:{stage:"verify-code",subject_kind:"worktree",host_provider:"codex/luna",materials:{acceptance_criteria:"AC-1: preserve unavailable executor facts."}}}));
    let called=0,legacy=0;
    const recorded=await withOwnedOcr(state,()=>stageRuntimeCliMain(["review","--action=record","--stage=verify-code","--project=workflowhub",`--task=${state.taskId}`,`--task-path=${state.taskDir}`,`--input=${path}`],{
      cwd:state.worktreeRoot,services:{runOcrDelegationRound:async()=>{called++;throw Object.assign(new Error("owned private executor failed"),{code:"FIXTURE_EXECUTOR_FAILED"});},runReviewRound:async()=>{legacy++;throw new Error("unexpected fallback");}}
    }));
    expect(called).toBe(1);expect(legacy).toBe(0);expect(recorded.status).toBe("unavailable");
    const canonical=JSON.parse(state.task.readRecord(recorded.result_ref));
    expect(canonical).toMatchObject({stage:"verify-code",status:"unavailable",dispatch_state:"unknown",provider_results:[],findings:[],error:{code:"FIXTURE_EXECUTOR_FAILED"},authoritative:false});
    expect(canonical).not.toHaveProperty("attempt_ref");expect(state.task.readRecord("facts.jsonl")).toBe("");
  });

  const candidates=surfaces.flatMap(([surface,identity,codeSurface,materialKey])=>[
    ...(identity.stage==="build-code"&&identity.review_kind===undefined?[]:[[`${surface} production`,identity,false,codeSurface,materialKey]]),
    [`${surface} isolated candidate`,identity,true,codeSurface,materialKey],
  ]);
  it.each(candidates)("ORACLE-P3-CANDIDATE: %s chooses its current permitted runner or rejects a retired scope",async(_surface,identity,candidateExperiment,useOcr,materialKey)=>{
    const state=await fixture(),path=join(state.root,"route-input.json"),calls={ocr:0,existing:0};let flag;
    writeFileSync(path,JSON.stringify({request:{...identity,...(candidateExperiment?{candidate_experiment:true}:{}),host_provider:"codex/luna",materials:{[materialKey]:"owned current review material"}}}));
    const invoke=()=>stageRuntimeCliMain(["review","--action=record",`--stage=${identity.stage}`,"--project=workflowhub",`--task=${state.taskId}`,`--task-path=${state.taskDir}`,`--input=${path}`],{
      cwd:state.worktreeRoot,services:{runOcrDelegationRound:async request=>{calls.ocr++;flag=request.candidate_experiment===true;return resultFor(request);},runReviewRound:async request=>{calls.existing++;flag=request.candidate_experiment===true;return resultFor(request);}}
    });
    if(identity.stage==="build-spec"||identity.review_scope==="integration"){
      await expect(withOwnedOcr(state,invoke)).rejects.toThrow(identity.stage==="build-spec"?/current five-stage/:/integration review is retired/);
      expect(calls).toEqual({ocr:0,existing:0});expect(existsSync(join(state.taskDir,"quality","reviews"))).toBe(false);
    }else{
      const recorded=await withOwnedOcr(state,invoke);expect(flag).toBe(candidateExperiment);
      expect(calls).toEqual(useOcr?{ocr:1,existing:0}:{ocr:0,existing:1});expect(recorded.status).toBe("available");
      const canonical=JSON.parse(state.task.readRecord(recorded.result_ref));expect(canonical.stage).toBe(identity.stage);expect(canonical.request.material_keys).toEqual([materialKey]);expect(canonical.executor).toBe(useOcr?"ocr":undefined);
      expect(canonical.provider_results[0].identity.source_id).toBe("fixture/source");expect(canonical).not.toHaveProperty("attempt_ref");
    }
    expect(state.task.readRecord("facts.jsonl")).toBe("");
  });

  it.each(surfaces)("ORACLE-P3-MATERIAL: %s projects actual material allowlist facts or rejects a retired identity",async(_surface,identity)=>{
    const state=await fixture();const input={attachmentRoot:state.root,stage:identity.stage,reviewTrack:identity.review_track??null,reviewScope:identity.review_scope??null,reviewKind:identity.review_kind??null,activationCohort:"post",materials:{implementation:"owned undeclared material"}};
    if(identity.stage==="build-plan"){
      const root=join(state.worktreeRoot,"specs",state.taskId);
      input.materials={...input.materials,draft_spec:readFileSync(join(root,"spec.md"),"utf8"),phase_index:readFileSync(join(root,"phases","index.md"),"utf8"),phase_authorities:Object.fromEntries([1,2,3].map(n=>[`phases/P${n}.md`,readFileSync(join(root,"phases",`P${n}.md`),"utf8")]))};
    }
    if(identity.stage==="build-spec"||identity.review_scope==="integration"){
      expect(()=>buildReviewMaterials(input)).toThrow(identity.stage==="build-spec"?/unknown review stage/:/integration review is retired/);
    }else{
      const bundle=buildReviewMaterials(input);
      try{expect(bundle.discarded_facts).toContainEqual(expect.objectContaining({fact_kind:"material_unknown_key_dropped",dropped_key:"implementation",reason:"not_in_stage_material_allowlist"}));
        expect(bundle.deliveryManifest.map(x=>x.path).some(path=>path.startsWith("materials/")&&/implementation\.(md|json)$/.test(path))).toBe(false);
        expect(readFileSync(join(bundle.bundleRoot,"review-instructions.md"),"utf8")).toContain("Supplied material is incomplete:");
      }finally{bundle.dispose();}
    }
    expect(state.task.readRecord("facts.jsonl")).toBe("");expect(existsSync(join(state.taskDir,"quality","reviews"))).toBe(false);
  });

  it("rejects a malformed ordinary verify-code tuple before either runner",async()=>{
    const state=await fixture(),path=join(state.root,"malformed-verify.json"),calls={ocr:0,existing:0};
    writeFileSync(path,JSON.stringify({request:{stage:"verify-code",review_scope:"phase",subject_kind:"phase",phase_id:"P1",materials:{implementation:"owned"}}}));
    await expect(withOwnedOcr(state,()=>stageRuntimeCliMain(["review","--action=record","--stage=verify-code","--project=workflowhub",`--task=${state.taskId}`,`--task-path=${state.taskDir}`,`--input=${path}`],{cwd:state.worktreeRoot,services:{runOcrDelegationRound:async()=>{calls.ocr++;},runReviewRound:async()=>{calls.existing++;}}}))).rejects.toThrow(/verify-code does not use review_scope/);
    expect(calls).toEqual({ocr:0,existing:0});expect(state.task.readRecord("facts.jsonl")).toBe("");expect(existsSync(join(state.taskDir,"quality","reviews"))).toBe(false);
  });

  it("injects the current canonical byte sink and keeps original failed-member parse diagnostics alongside its successful sibling",async()=>{
    const state=await fixture(),path=join(state.root,"raw-review.json"),providers=["codex/good","antigravity/bad"];
    writeFileSync(path,JSON.stringify({request:{stage:"verify-code",subject_kind:"worktree",materials:{acceptance_criteria:"AC-1: retain real original bytes and parse failure."}}}));
    const stdout={"codex/good":Buffer.from(directProviderOutput("codex/good",[])),"antigravity/bad":Buffer.from('{"findings":')};const stderr=Buffer.from([0xff,0x00,0x61]);let called=0;
    const recorded=await withOwnedOcr(state,()=>stageRuntimeCliMain(["review","--action=record","--stage=verify-code","--project=workflowhub",`--task=${state.taskId}`,`--task-path=${state.taskDir}`,`--input=${path}`],{cwd:state.worktreeRoot,services:{
      runReviewRound:async()=>{throw new Error("unexpected fallback");},runOcrDelegationRound:async(request,options)=>{
        called++;const packetRoot=join(state.root,"raw-packet");mkdirSync(packetRoot);const bytes=Buffer.from("export const current = true;\n");writeFileSync(join(packetRoot,"source.mjs"),bytes);
        return runConfiguredOcrHostReview({request,packet:{root:packetRoot,material_id:materialId,preview:{reviewable_files:[{path:"source.mjs"}]},rules:{rules:[]},manifest:[{path:"source.mjs",bytes:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")}] }},{
          trustedContext:trustedOcrContext(state.root,providers),providerExecutor:async({provider})=>({status:"completed",output:stdout[provider].toString("utf8"),raw_output:{stdout:stdout[provider],stderr,exit_code:0,cancelled:false,captured_output_limited:false}}),
          rawOutputSink:async(_hint,bytes,metadata)=>options.onProviderOutput({provider:metadata.provider,output:bytes}),
        });
      }
    }}));
    expect(called).toBe(1);expect(recorded.status).toBe("available-with-failures");const canonical=JSON.parse(state.task.readRecord(recorded.result_ref));expect(canonical.provider_results).toHaveLength(2);expect(canonical).not.toHaveProperty("attempt_ref");
    for(const member of canonical.provider_results){expect(member.evidence_refs).toHaveLength(2);for(const[index,stream]of["stdout","stderr"].entries()){
      const bytes=stream==="stdout"?stdout[member.provider]:stderr;const saved=state.task.readRecordBytes(member.evidence_refs[index]);expect(saved).toEqual(bytes);expect(createHash("sha256").update(saved).digest("hex")).toBe(createHash("sha256").update(bytes).digest("hex"));expect(member.raw_output_ref).toBe(member.evidence_refs[0]);
    }}
    expect(canonical.provider_results[0]).toMatchObject({provider:"codex/good",status:"completed",process_outcome:"ok",parse_outcome:"ok"});
    expect(canonical.provider_results[1]).toMatchObject({provider:"antigravity/bad",status:"failed",process_outcome:"ok",parse_outcome:"invalid"});
    expect(canonical.provider_results[1].unavailable_diagnostics.message).toContain("parse_error=");
    const outputs=readdirSync(join(state.taskDir,"quality","reviews")).filter(x=>x.endsWith(".output"));expect(outputs).toHaveLength(4); // each provider owns both original streams, no cross-provider hash-dedupe authority
    expect(state.task.readRecord("facts.jsonl")).toBe("");
  });
});
