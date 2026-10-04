// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
//
// T021 / ADR-021 目标契约（现行实现下必 RED）：
// - doctor 输出含 OCR 可用性项（ocr 项：installed / not_installed），
//   检测以调用时 PATH 为准（ocr 缺失或 ocr --version < 1.12.9 → not_installed）。
// - 代码面审查路由：OCR 未安装 → 由 wh-review 执行同一审查面，审查记录
//   （唯一普通 result 原件）带 fallback 字段 {from:"ocr", reason, detected_by}
//   写明 OCR 未安装事实，且记录的执行者（provider）为 wh-review。
// - OCR 已安装但 provider 调用失败 → 记录 evaluation 为 unavailable，
//   无 fallback 字段、不走 wh-review。

import { execFileSync } from "node:child_process";
import { accessSync, constants as fsConstants, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { stageRuntimeCliMain, stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";
import { validateSchema } from "../../runtime/review/schema-validator.mjs";

const roots = [];

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function git(cwd, args) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "code-review-ocr-fallback-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub OCR fallback test"]);
  git(repo, ["config", "user.email", "ocr-fallback@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "ocr fallback fixture\n", "utf8");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "fixture"]);
  const taskId = `code-review-ocr-fallback-${Math.random().toString(16).slice(2)}`;
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
  const gate = "npx --no-install vitest run tests/contract/code-review-ocr-fallback.test.mjs --reporter=dot";
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
  return { root, home, taskId, taskDir, worktreeRoot };
}

const ENV_KEYS = [
  "HOME", "WORKFLOWHUB_TASK_DIR", "PATH",
  "CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH",
];

async function withRuntimeEnvironment(updates, action) {
  const previous = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) {
    if (updates[key] === undefined) delete process.env[key];
    else process.env[key] = updates[key];
  }
  try {
    return await action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

// PATH 中无可用 ocr（本机可能装有真实 ocr，须逐目录剔除）。
function pathWithoutOcr() {
  return (process.env.PATH ?? "").split(":").filter(Boolean).filter((dir) => {
    try {
      accessSync(join(dir, "ocr"), fsConstants.X_OK);
      return false;
    } catch {
      return true;
    }
  }).join(":");
}

function writeOcrStub(dir, version) {
  mkdirSync(dir);
  const stub = join(dir, "ocr");
  writeFileSync(stub, `#!/bin/sh
if [ "$1" = "--version" ]; then
  printf 'open-code-review v${version} (test-stub) darwin/arm64\\n'
  exit 0
fi
exit 1
`, { mode: 0o700 });
  return dir;
}

function reviewRequest() {
  return {
    stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3", surface: "code",
    host_provider: "codex/luna",
    materials: { acceptance_criteria: "AC-1: the fallback review records the OCR availability fact." },
  };
}

function whReviewCompletedResult(request) {
  return {
    status: "available", stage: request.stage, review_track: null, review_kind: null,
    subject_kind: request.subject_kind, phase_id: request.phase_id ?? null,
    review_scope: request.review_scope ?? null,
    runtime_id: "wh-review-fallback-fixture", outcome: "completed",
    provider_results: [{
      provider: "wh-review", status: "completed", process_outcome: "ok", parse_outcome: "ok",
      identity: { provider: "wh-review", adapter: "wh-review", source_id: "wh-review", config_id: "fixture-config", model: "wh-review-runner" },
      error: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
      evidence_anchor_valid: [],
    }],
    findings: [],
  };
}

function unavailableOcrResult(request) {
  return {
    status: "unavailable", stage: request.stage, review_track: null, review_kind: null,
    subject_kind: request.subject_kind, phase_id: request.phase_id ?? null,
    review_scope: request.review_scope ?? null,
    runtime_id: "ocr-unavailable-fixture", outcome: "unavailable",
    findings: [], dispatch_state: "dispatched",
    error: { code: "OCR_ALL_PROVIDERS_FAILED", message: "controlled OCR provider failure" },
    provider_results: [{
      provider: "codex/luna", status: "failed", process_outcome: "exit_nonzero", parse_outcome: null,
      identity: { provider: "codex/luna", adapter: "codex", source_id: "fixture/source", config_id: "fixture/config", model: "fixture-model" },
      error: { code: "PROCESS_FAILED", message: "controlled OCR provider failure" },
      timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
      evidence_anchor_valid: [],
    }],
  };
}

const NOT_INSTALLED_FACT = /not[ _-]?installed|not found|未安装|enoent|missing|version/i;

describe("doctor reports OCR availability (T021)", () => {
  it.each([
    ["no ocr on PATH", null, "not_installed"],
    ["ocr stub at the minimum version 1.12.9 on PATH", "1.12.9", "installed"],
    ["ocr stub below the minimum version on PATH", "1.12.8", "not_installed"],
  ])("reports %s as %s", async (_label, stubVersion, expected) => {
    const state = fixture();
    const stubDir = stubVersion === null ? null : writeOcrStub(join(state.root, "bin"), stubVersion);
    const path = stubDir === null ? pathWithoutOcr() : `${stubDir}:${pathWithoutOcr()}`;
    await withRuntimeEnvironment(
      { HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root, PATH: path },
      async () => {
        const doctor = await stageRuntimeMain([
          "doctor", "--stage=build-code", "--project=workflowhub", `--task=${state.taskId}`,
        ], { cwd: state.worktreeRoot });
        expect(doctor.ocr).toBeDefined();
        expect(doctor.ocr.status).toBe(expected);
      });
  });
});

describe("code review falls back to wh-review only when OCR is not installed (T021)", () => {
  it.each([["missing", null], ["below the minimum version", "1.12.8"]])("executes the same review surface through wh-review and records fallback when OCR is %s", async (_label, stubVersion) => {
    const state = fixture();
    const request = reviewRequest();
    const inputPath = join(state.root, "fallback-review.json");
    writeFileSync(inputPath, JSON.stringify({ request }));
    const calls = { ocr: 0, whReview: 0 };
    let whReviewRequest = null;
    const stubDir = stubVersion === null ? null : writeOcrStub(join(state.root, "bin"), stubVersion);
    const path = stubDir === null ? pathWithoutOcr() : `${stubDir}:${pathWithoutOcr()}`;
    await withRuntimeEnvironment(
      { HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root, PATH: path },
      async () => {
        const recorded = await stageRuntimeCliMain([
          "review", "--action=record", "--stage=build-code", "--project=workflowhub",
          `--task=${state.taskId}`, `--input=${inputPath}`,
        ], {
          cwd: state.worktreeRoot,
          services: {
            runOcrDelegationRound: async () => {
              calls.ocr += 1;
              return unavailableOcrResult(request);
            },
            runReviewRound: async (roundRequest) => {
              calls.whReview += 1;
              whReviewRequest = roundRequest;
              return whReviewCompletedResult(roundRequest);
            },
          },
        });

        // 回退：同一审查面由 wh-review 执行，OCR 路由未走。
        expect(calls).toEqual({ ocr: 0, whReview: 1 });
        expect(whReviewRequest).toMatchObject({
          stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3", surface: "code",
        });
        expect(whReviewRequest.materials).toEqual(request.materials);
        expect(recorded.status).toBe("available");
        expect(recorded.result_ref).toMatch(/^quality\/reviews\/\d{4}-\d{2}-\d{2}-\d{3}-build-code-phase-p3\.json$/);
        const review = JSON.parse(readFileSync(join(state.taskDir, recorded.result_ref), "utf8"));
        expect(review).toMatchObject({ task_id: state.taskId, stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3", surface: "code", status: "available", authoritative: false });
        expect(review.provider_results).toHaveLength(1);
        expect(review.provider_results[0]).toMatchObject({ provider: "wh-review", status: "completed", process_outcome: "ok", parse_outcome: "ok", error: null });
        expect(review.fallback).toBeDefined();
        expect(review.fallback.from).toBe("ocr");
        expect(String(review.fallback.reason)).toMatch(NOT_INSTALLED_FACT);
        expect(typeof review.fallback.detected_by).toBe("string");
        expect(review.fallback.detected_by.length).toBeGreaterThan(0);
      });
  });

  it("records unavailable without fallback and without wh-review when OCR is installed but the provider fails", async () => {
    const state = fixture();
    const stubDir = writeOcrStub(join(state.root, "bin"), "1.12.9");
    const request = reviewRequest();
    const inputPath = join(state.root, "installed-failing-review.json");
    writeFileSync(inputPath, JSON.stringify({ request }));
    const calls = { ocr: 0, whReview: 0 };
    await withRuntimeEnvironment(
      { HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root, PATH: `${stubDir}:${pathWithoutOcr()}` },
      async () => {
        const recorded = await stageRuntimeCliMain([
          "review", "--action=record", "--stage=build-code", "--project=workflowhub",
          `--task=${state.taskId}`, `--input=${inputPath}`,
        ], {
          cwd: state.worktreeRoot,
          services: {
            runOcrDelegationRound: async () => {
              calls.ocr += 1;
              return unavailableOcrResult(request);
            },
            runReviewRound: async (roundRequest) => {
              calls.whReview += 1;
              return whReviewCompletedResult(roundRequest);
            },
          },
        });

        expect(calls).toEqual({ ocr: 1, whReview: 0 });
        expect(recorded.status).toBe("unavailable");
        expect(recorded.result_ref).toMatch(/^quality\/reviews\/\d{4}-\d{2}-\d{2}-\d{3}-build-code-phase-p3\.json$/);
        const review = JSON.parse(readFileSync(join(state.taskDir, recorded.result_ref), "utf8"));
        expect(review).toMatchObject({ task_id: state.taskId, stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3", surface: "code", status: "unavailable", error: { code: "OCR_ALL_PROVIDERS_FAILED", message: "controlled OCR provider failure" } });
        expect(review.provider_results).toHaveLength(1);
        expect(review.provider_results[0]).toMatchObject({ provider: "codex/luna", status: "failed", process_outcome: "exit_nonzero", parse_outcome: null, error: { code: "PROCESS_FAILED", message: "controlled OCR provider failure" } });
        expect(review).not.toHaveProperty("fallback");
      });
  });
});


describe("canonical review request subject provenance", () => {
  it.each(["string", "object", "absent", "in-flight mutation"])("retains the original %s subject through the actual public writer", async (kind) => {
    const state=fixture(),request=reviewRequest();
    if(kind==="string") request.subject="P3 source and explicitly declared review boundary";
    if(kind==="object" || kind==="in-flight mutation") request.subject={summary:"owned original scope",allowed_files:["README.md"],allowed_symbols:["fixture"],covered_fr:["FR-1"],covered_ac:["AC-1"]};
    const hadSubject=Object.hasOwn(request,"subject"),original=hadSubject?JSON.parse(JSON.stringify(request.subject)):undefined;
    const inputPath=join(state.root,"subject-review.json");writeFileSync(inputPath,JSON.stringify({request}));
    const stubDir=writeOcrStub(join(state.root,"bin"),"1.12.9");let calls=0;
    await withRuntimeEnvironment({HOME:state.home,WORKFLOWHUB_TASK_DIR:state.root,PATH:`${stubDir}:${pathWithoutOcr()}`},async()=>{
      const recorded=await stageRuntimeCliMain(["review","--action=record","--stage=build-code","--project=workflowhub",`--task=${state.taskId}`,`--input=${inputPath}`],{
        cwd:state.worktreeRoot,services:{runOcrDelegationRound:async(roundRequest)=>{
          calls++;expect(roundRequest.subject).toEqual(original);
          if(kind==="in-flight mutation") {roundRequest.subject.allowed_files.push("mutated-by-controlled-executor.md");roundRequest.subject.summary="controlled executor changed delivered scope";}
          return unavailableOcrResult(request);
        },runReviewRound:async()=>{throw new Error("no fallback may run for installed OCR");}}
      });
      expect(calls).toBe(1);expect(recorded.status).toBe("unavailable");
      const actual=JSON.parse(readFileSync(join(state.taskDir,recorded.result_ref),"utf8"));
      expect(actual).toMatchObject({stage:"build-code",phase_id:"P3",subject_kind:"phase",review_scope:"phase",surface:"code",status:"unavailable",error:{code:"OCR_ALL_PROVIDERS_FAILED"}});
      expect(actual.provider_results[0]).toMatchObject({status:"failed",error:{code:"PROCESS_FAILED"}});
      expect(actual).not.toHaveProperty("fallback");
      if(hadSubject) expect(actual.request.subject).toEqual(original);
      else expect(Object.hasOwn(actual.request,"subject")).toBe(false);
      expect(actual.request.material_keys).toContain("acceptance_criteria");
      expect(actual.request).not.toHaveProperty("material_digest");expect(actual.request).not.toHaveProperty("snapshot_tree");
      expect(()=>validateSchema("result",actual)).not.toThrow();
    });
  });
});
