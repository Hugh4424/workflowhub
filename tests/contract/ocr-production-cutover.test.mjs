import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../runtime/evidence/artifact-dir.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runOcrDelegationRound } from "../../runtime/review/ocr-delegation-adapter.mjs";
import { authenticatedEvidenceBytes, authenticatedEvidenceDigest } from "../../runtime/review/review-packet-identity.mjs";
import { prepareTaskBoundBuildCodeReviewBundle, reviewRecordTimeoutForRunner, runConfiguredOcrHostReview, stageRuntimeCliMain, stageRuntimeMain, writeOcrProviderHealthDiagnostic } from "../../tools/cli/stage-runtime.mjs";

const roots = [];
const materialId = createHash("sha256").update("ocr-production-cutover-fixture").digest("hex");

function git(cwd, args) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

async function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "ocr-production-cutover-current-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub OCR fallback test"]);
  git(repo, ["config", "user.email", "ocr-fallback@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "ocr fallback fixture\n", "utf8");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "fixture"]);
  const taskId = `ocr-production-cutover-current-${Math.random().toString(16).slice(2)}`;
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
  const gate = "npx --no-install vitest run tests/contract/ocr-production-cutover-current.test.mjs --reporter=dot";
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
  const bin = join(root, "bin"); mkdirSync(bin);
  writeFileSync(join(bin, "ocr"), `#!${process.execPath}
const args=process.argv.slice(2);
if(args[0]==="--version")console.log("1.12.9");
else if(args[1]==="preview"){
 const fs=require("node:fs"),path=require("node:path"),files=[];
 function walk(dir,depth=0){if(depth>32)throw new Error("owned packet depth exceeded");for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(item.name===".git")continue;const file=path.join(dir,item.name),st=fs.lstatSync(file);if(st.isSymbolicLink())throw new Error("owned packet alias");if(st.isDirectory())walk(file,depth+1);else if(st.isFile()){if(st.nlink!==1||files.length>=512)throw new Error("owned packet file limit or link");files.push({path:path.relative(process.cwd(),file).split(path.sep).join("/")});}}}
 walk(process.cwd());console.log(JSON.stringify({reviewable_files:files}));
}
else if(args[1]==="rule")console.log(JSON.stringify({rules:[{path:"README.md",rule:"Owned packet inspection."}]}));
else process.exitCode=9;
`, {mode:0o700});
  return { root, home, taskId, taskDir, worktreeRoot, task, workspace, bin };
}


async function contextFor(state) {
  return { task: state.task, manifest: state.task.manifest, workspace: await openCurrentTaskWorkspace(state.task), artifacts: ArtifactDir.open(state.worktreeRoot, state.task) };
}

async function withRuntimeEnvironment(state, action) {
  const previous = process.env.PATH, previousStorage = process.env.WORKFLOWHUB_TASK_DIR;
  process.env.WORKFLOWHUB_TASK_DIR = state.root;
  // Only owned deterministic OCR selection. Public calls bind the task path
  // explicitly; HOME/auth/config remain untouched and all reviewer calls use DI.
  process.env.PATH = `${state.bin}:${previous ?? "/usr/bin:/bin"}`;
  try { return await action(); }
  finally { if(previous===undefined)delete process.env.PATH;else process.env.PATH=previous;if(previousStorage===undefined)delete process.env.WORKFLOWHUB_TASK_DIR;else process.env.WORKFLOWHUB_TASK_DIR=previousStorage; }
}

function reviewResultFor(request) {
  return {
    status: "available",
    stage: request.stage,
    review_track: null,
    review_kind: request.review_kind ?? null,
    subject_kind: request.subject_kind ?? "worktree",
    phase_id: request.phase_id ?? null,
    review_scope: request.review_scope ?? null,
    material_id: materialId,
    runtime_id: "cutover-route-spy",
    outcome: "completed",
    ocr: { version: "fixture-ocr", preview: { reviewable_files: [] }, rules: { rules: [] }, manifest: [] },
    findings: [],
    provider_results: [{
      provider: "codex/luna", status: "completed",
      identity: { provider: "codex/luna", adapter: "codex", source_id: "fixture/source", config_id: "fixture/config", model: "fixture-model" },
      error: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
      evidence_anchor_valid: [],
    }],
  };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("OCR production cutover defaults", () => {
  it("delivers reviewed execution evidence in the OCR manifest and direct provider packet", async () => {
    const state = await fixture();
    writeFileSync(join(state.workspace.worktreeRoot, "README.md"), "reviewed execution source\n");
    const attachmentRoot = join(state.root, "review-data");
    mkdirSync(attachmentRoot);
    const authenticatedEvidence = {
      runtime_current_materials: { "decision-log.md": "# Current decision\n" },
      runtime_implementation_diff: "diff --git a/README.md b/README.md\n+reviewed execution source\n",
      runtime_execution_records: [{ ref: "quality/evidence/stage-quality/build-code/AC-EXE-002.json",
        raw: '{"subject_fact":{"outcome":"unavailable","outcome_reason":"review unavailable"}}' }],
    };
    const request = {
      stage: "verify-code", subject_kind: "worktree",
      materials: { changed_files: "README.md", implementation_assessment: "Inspect current execution behavior.",
        test_context: "Focused execution evidence delivery check.", open_risks: "none declared",
        acceptance_criteria: "AC-EXE-002: Preserve the unavailable execution fact for review." },
      authenticated_evidence: authenticatedEvidence,
    };
    const bundle = prepareTaskBoundBuildCodeReviewBundle(await contextFor(state), request,
      { loadConfig: () => ({ attachmentRoot }) });
    const providerEvidence = {
      runtime_current_materials: { "decision-log.md": { bytes: Buffer.byteLength("# Current decision\n", "utf8"), sha256: createHash("sha256").update("# Current decision\n").digest("hex") } },
      runtime_implementation_diff: { bytes: Buffer.byteLength("diff --git a/README.md b/README.md\n+reviewed execution source\n", "utf8"), sha256: createHash("sha256").update("diff --git a/README.md b/README.md\n+reviewed execution source\n").digest("hex") },
      runtime_execution_records: authenticatedEvidence.runtime_execution_records,
    };
    const expectedBytes = authenticatedEvidenceBytes(providerEvidence);
    let receivedBytes = null;
    let receivedCurrentMaterial = null;
    let receivedInstructions = null;
    try {
      expect(bundle.manifest).toContainEqual({ path: "authenticated-evidence.json", bytes: expectedBytes.length,
        sha256: createHash("sha256").update(expectedBytes).digest("hex") });
      const result = await withRuntimeEnvironment(state, () => runOcrDelegationRound(request, {
        buildBundle: () => bundle,
        executor: ({ request: delegated, packet }) => runConfiguredOcrHostReview({ request: delegated, packet }, {
          trustedContext: {
            trusted: { config: "unused" }, route: { minimum_heterologous: 1 },
            selection: { providers: ["kimi/reviewer"], eligibleProfiles: ["kimi/reviewer"],
              provider_identities: { "kimi/reviewer": { source_id: "kimi/independent", config_id: "fixture/config" } },
              provider_models: { "kimi/reviewer": "fixture-model" } },
            providerConfig: { providers: { "kimi/reviewer": { enabled: true, model: "fixture-model" } } },
          },
          providerExecutor: async ({ cwd }) => {
            receivedBytes = readFileSync(join(cwd, "authenticated-evidence.json"));
            receivedCurrentMaterial = readFileSync(join(cwd, "context", "current-materials", "decision-log.md"), "utf8");
            receivedInstructions = readFileSync(join(cwd, "review-instructions.md"), "utf8");
            return { status: "completed", output: JSON.stringify({ role: "assistant",
              content: [{ type: "text", text: '{"findings":[]}' }] }) };
          },
        }),
      }));
      expect(receivedBytes).toEqual(expectedBytes);
      expect(receivedCurrentMaterial).toBe("# Current decision\n");
      expect(receivedInstructions).toContain("use it only to check whether current code and test claims match the recorded execution and to identify false-green behavior");
      expect(receivedInstructions).toContain("identify false-green behavior");
      expect(result.authenticated_evidence_sha256).toBe(authenticatedEvidenceDigest(authenticatedEvidence));
    } finally {
      bundle.dispose();
    }
  });

  it("reports silent but live provider health on stderr without treating health as a deadline renewal", () => {
    const lines = [];
    writeOcrProviderHealthDiagnostic({
      provider: "codex/luna", status: "running", liveness: true,
      last_output_at_ms: null, progress_events: 0, stdout_bytes: 0, stderr_bytes: 0,
      host_path: "/private/sensitive/path", raw_output: "secret",
    }, { stderr: { write: (line) => lines.push(line) } });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^\[ocr-review\] /);
    const diagnostic = JSON.parse(lines[0].slice("[ocr-review] ".length));
    expect(diagnostic).toEqual({
      provider: "codex/luna", status: "running", liveness: true,
      last_output_at_ms: null, progress_events: 0, stdout_bytes: 0, stderr_bytes: 0,
    });
    expect(lines[0]).not.toMatch(/sensitive|secret/);
    writeOcrProviderHealthDiagnostic({ provider: "/private/sensitive/provider", status: "running", liveness: true },
      { stderr: { write: (line) => lines.push(line) } });
    expect(JSON.parse(lines[1].slice("[ocr-review] ".length)).provider).toBe("redacted");
    expect(reviewRecordTimeoutForRunner({ managed: true })).toBeNull();
  });
  it.each([
    ["phase", "build-code", { review_scope: "phase", subject_kind: "phase", phase_id: "P3" }, "phase_review", "review"],
    ["final", "verify-code", { subject_kind: "worktree" }, "code_review", "quality_review"],
  ])("routes ordinary %s through OCR without a candidate flag or legacy dispatch", async (_scope, stage, scope, factSubject, receiptKey) => {
    const state = await fixture();
    const calls = { legacy: 0, ocr: 0 };
    const healthEvents = [];
    const reviewInputPath = join(state.root, "ordinary-review.json");
    writeFileSync(reviewInputPath, JSON.stringify({ request: {
      stage, ...scope, host_provider: "codex/luna", materials: { acceptance_criteria:"AC-1: preserve the complete current criterion.", implementation_assessment:"Inspect the real current diff." },
    } }), "utf8");
    await withRuntimeEnvironment(state, async () => {
      const recorded = await stageRuntimeCliMain([
        "review", "--action=record", `--stage=${stage}`, "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--task-path=${state.taskDir}`, `--input=${reviewInputPath}`,
      ], {
        cwd: state.workspace.worktreeRoot,
        services: {
          resolveRouteIdentity: () => ({ route_identity: "a".repeat(64) }),
          materialIdForRequest: () => materialId,
          onOcrProviderHealth: (health) => healthEvents.push(health),
          runReviewRound: async (request) => { calls.legacy += 1; return reviewResultFor(request); },
          runOcrDelegationRound: async (request, options) => {
            calls.ocr += 1;
            options.onProviderHealth({ provider: "codex/luna", status: "running", liveness: true,
              last_output_at_ms: null, progress_events: 0, stdout_bytes: 0, stderr_bytes: 0 });
            return reviewResultFor(request);
          },
        },
      });
      expect(calls).toEqual({ legacy: 0, ocr: 1 });
      expect(healthEvents).toMatchObject([{ status: "running", liveness: true, progress_events: 0 }]);
      const canonical = JSON.parse(state.task.readRecord(recorded.result_ref));
      expect(recorded.status).toBe("available");
      expect(canonical).toMatchObject({stage, review_scope:scope.review_scope ?? null,
        subject_kind:scope.subject_kind,phase_id:scope.phase_id ?? null,executor:"ocr",
        provider_results:[{provider:"codex/luna",identity:{source_id:"fixture/source"}}],authoritative:false});
      expect(canonical).not.toHaveProperty("attempt_ref");
      expect(canonical).not.toHaveProperty("material_id");
      const status = await stageRuntimeCliMain(["status","--action=begin",`--stage=${stage}`,"--project=workflowhub",
        `--task=${state.taskId}`,`--task-path=${state.taskDir}`],{cwd:state.workspace.worktreeRoot});
      expect(status).not.toHaveProperty("quality_predicates");
      expect(status.quality.status).toBe("unknown"); // review-only did not write stage facts or completion
      expect(state.task.readRecord("facts.jsonl")).toBe("");

    });
  });

  it("keeps an explicit candidate flag compatible with the same OCR route", async () => {
    const state = await fixture();
    const inputPath = join(state.root, "candidate-review.json");
    writeFileSync(inputPath, JSON.stringify({ request: {
      stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3",
      candidate_experiment: true, host_provider: "codex/luna", materials: { approved_spec:"Current phase specification.",acceptance_criteria:"AC-1: preserve current code review." },
    } }), "utf8");
    const calls = { ocr: 0, legacy: 0 };

    await withRuntimeEnvironment(state, async () => {
      const recorded = await stageRuntimeCliMain([
        "review", "--action=record", "--stage=build-code", "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--task-path=${state.taskDir}`, `--input=${inputPath}`,
      ], {
        cwd: state.workspace.worktreeRoot,
        services: {
          resolveRouteIdentity: () => ({ route_identity: "b".repeat(64) }),
          materialIdForRequest: () => materialId,
          runOcrDelegationRound: async (request) => { calls.ocr += 1; return reviewResultFor(request); },
          runReviewRound: async (request) => { calls.legacy += 1; return reviewResultFor(request); },
        },
      });

      expect(recorded.status).toBe("available");
      expect(calls).toEqual({ ocr: 1, legacy: 0 });
      expect(JSON.parse(state.task.readRecord(recorded.result_ref))).toMatchObject({
        stage: "build-code", review_scope: "phase", phase_id: "P3", subject_kind: "phase",
      });
    });
  });

  it("rejects a malformed code-surface request before any review runner", async () => {
    const state = await fixture();
    const inputPath = join(state.root, "malformed-review.json");
    writeFileSync(inputPath, JSON.stringify({ request: {
      stage: "build-code", review_scope: "phase", subject_kind: "worktree", phase_id: "P3",
      host_provider: "codex/luna", materials: { acceptance_criteria:"AC-1: preserve the complete current criterion.", implementation_assessment:"Inspect the real current diff." },
    } }), "utf8");
    const calls = { ocr: 0, legacy: 0 };
    await withRuntimeEnvironment(state, async () => {
      await expect(stageRuntimeCliMain([
        "review", "--action=record", "--stage=build-code", "--project=workflowhub",
        `--task=${state.task.identity.taskId}`, `--task-path=${state.taskDir}`, `--input=${inputPath}`,
      ], { cwd: state.workspace.worktreeRoot, services: {
        runOcrDelegationRound: async () => { calls.ocr += 1; },
        runReviewRound: async () => { calls.legacy += 1; },
      } })).rejects.toThrow(/phase review requires a concrete phase_id and subject_kind=phase/);
      expect(calls).toEqual({ ocr: 0, legacy: 0 });
    });
  });

  it("rejects caller-authored verify results before dispatch rather than creating a second authentication gate", async () => {
    const state=await fixture(); const path=join(state.root,"imported-result.json");
    writeFileSync(path,JSON.stringify({request:{stage:"verify-code",subject_kind:"worktree"},result:reviewResultFor({stage:"verify-code"})}));
    const calls={ocr:0,legacy:0}; const before=state.task.readRecord("facts.jsonl");
    await expect(withRuntimeEnvironment(state,()=>stageRuntimeCliMain(["review","--action=record","--stage=verify-code","--project=workflowhub",`--task=${state.taskId}`,`--task-path=${state.taskDir}`,`--input=${path}`],{
      cwd:state.workspace.worktreeRoot,services:{runOcrDelegationRound:async()=>{calls.ocr++;},runReviewRound:async()=>{calls.legacy++;}}
    }))).rejects.toThrow(/importing caller-authored results is retired/);
    expect(calls).toEqual({ocr:0,legacy:0});expect(state.task.readRecord("facts.jsonl")).toBe(before);
    expect(existsSync(join(state.taskDir,"quality","reviews"))).toBe(false);
  });

  it("rejects retired integration scope before either runner while leaving original task facts untouched", async () => {
    const state=await fixture();const path=join(state.root,"retired-integration.json");
    writeFileSync(path,JSON.stringify({request:{stage:"build-code",review_scope:"integration",subject_kind:"worktree",phase_id:null,materials:{implementation_summary:"old integration input"}}}));
    const calls={ocr:0,legacy:0};const before=state.task.readRecord("facts.jsonl");
    await expect(withRuntimeEnvironment(state,()=>stageRuntimeCliMain(["review","--action=record","--stage=build-code","--project=workflowhub",`--task=${state.taskId}`,`--task-path=${state.taskDir}`,`--input=${path}`],{
      cwd:state.workspace.worktreeRoot,services:{runOcrDelegationRound:async()=>{calls.ocr++;},runReviewRound:async()=>{calls.legacy++;}}
    }))).rejects.toThrow(/integration review is retired/);
    expect(calls).toEqual({ocr:0,legacy:0});expect(state.task.readRecord("facts.jsonl")).toBe(before);
    expect(existsSync(join(state.taskDir,"quality","reviews"))).toBe(false);
  });
});
