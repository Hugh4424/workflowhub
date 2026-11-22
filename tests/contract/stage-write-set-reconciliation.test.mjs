import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prepareTaskBoundBuildCodeReviewBundle, stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const PHASE = "phases/P1-行为结果.md";
const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function git(cwd, ...args) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  env.GIT_OPTIONAL_LOCKS = "0";
  return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function authorMaterials(taskId, taskRoot, worktree) {
  const text = readFileSync(join(ROOT, "skills/spec-plan/templates/phase-template.md"), "utf8"), blocks = {};
  for (const name of ["spec", "index", "phase-behavior", "phase-document"]) {
    const marker = `<!-- card05-author-example:${name} -->`;
    const tail = text.slice(text.indexOf(marker) + marker.length);
    const match = tail.match(/^\s*(`{3,}|~{3,})markdown\s*\n([\s\S]*?)\n\1[ \t]*(?:\n|$)/);
    if (!match) throw new Error(`missing author example ${name}`);
    blocks[name] = match[2].replace(/\{\{(TASK_ID|TASK_ROOT|WORKTREE_ROOT)\}\}/g, (_all, key) => ({ TASK_ID: taskId, TASK_ROOT: taskRoot, WORKTREE_ROOT: worktree })[key]);
  }
  return { spec: blocks.spec, index: blocks.index, phases: { [PHASE]: blocks["phase-behavior"], "phases/P2-文档核对.md": blocks["phase-document"] } };
}

async function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "write-set-reconciliation-")));
  roots.push(root);
  const mainRepo = join(root, "repo"), repo = join(root, "worktree"), taskPath = join(root, "Projects/workflowhub/tasks/scope-fixture"), taskId = "scope-fixture";
  mkdirSync(mainRepo);
  mkdirSync(taskPath, { recursive: true });
  git(mainRepo, "init", "-q", "-b", "main");
  git(mainRepo, "config", "user.name", "Write set oracle");
  git(mainRepo, "config", "user.email", "oracle@example.invalid");
  mkdirSync(join(mainRepo, "src"), { recursive: true });
  writeFileSync(join(mainRepo, "src/owned.mjs"), "export const owned = true;\n");
  git(mainRepo, "add", ".");
  git(mainRepo, "commit", "-qm", "baseline");
  git(mainRepo, "worktree", "add", "-q", "-b", `task/workflowhub/${taskId}`, repo, "main");
  mkdirSync(join(root, "attachments"), { recursive: true });

  const materials = authorMaterials(taskId, taskPath, repo), materialRoot = join(repo, "specs", taskId);
  const readinessTable = [
    "", "### 开工就绪表", "| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |", "| --- | --- | --- | --- | --- |",
    "| `git rev-parse --show-toplevel` | 0 | quality/tests/readiness.output | 机器 | 计划负责人 |", "",
  ].join("\n");
  materials.phases[PHASE] += readinessTable;
  materials.phases["phases/P2-文档核对.md"] += readinessTable;
  for (const [path, body] of Object.entries({ "spec.md": materials.spec, "phases/index.md": materials.index, ...materials.phases })) {
    const file = join(materialRoot, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
  }
  writeFileSync(join(materialRoot, "decision-log.md"), "## 任务身份\n\n- **任务类型**：普通任务\n");
  git(repo, "add", "specs");
  git(repo, "commit", "-qm", "materials");
  const head = git(repo, "rev-parse", "HEAD");
  writeFileSync(join(repo, "src/owned.mjs"), "export const owned = false;\n");
  writeFileSync(join(repo, "outside.mjs"), "export const outside = true;\n");
  writeFileSync(join(taskPath, "task.json"), JSON.stringify({
    schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId,
    target_repo_root: mainRepo, record_model: "vnext-single-write", activation_cohort: "post",
    workspace_mode: "existing", workspace_root: repo,
  }));
  writeFileSync(join(taskPath, "facts.jsonl"), JSON.stringify({
    record_kind: "stage", task_id: taskId, stage: "build-code", source: "controlled scope fixture",
    phase_progress: { phase_id: "P1", task_id: "T001", base_head: head, phases_head: head },
  }) + "\n");
  return { root, repo, mainRepo, taskPath, taskId, materials, materialRoot, head };
}

function context(f) {
  const artifacts = new Map(Object.entries({
    "spec.md": f.materials.spec,
    "phases/index.md": f.materials.index,
    ...f.materials.phases,
  }));
  return {
    task: { taskPath: f.taskPath, identity: { taskId: f.taskId }, readRecordBytes: () => { throw new Error("not used"); } },
    manifest: { activation_cohort: "post" },
    workspace: { worktreeRoot: f.repo, targetRepoRoot: f.mainRepo, baselineCommit: f.head },
    artifacts: { read: file => {
      if (!artifacts.has(file)) throw Object.assign(new Error(`ENOENT ${file}`), { code: "ENOENT" });
      return artifacts.get(file);
    } },
  };
}

function captureContractFacts(input) {
  return input.source.contract_facts.write_set_reconciliation;
}

describe("ORACLE-WRITE-SET real review projection and readiness", () => {
  it("reports the actual unlisted file through the public phase review projection", async () => {
    const f = await fixture();
    const request = {
      stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1",
      surface: "document",
      materials: {
        approved_spec: f.materials.spec,
        acceptance_criteria: "AC-EXAMPLE-001: the real scope is compared",
        test_evidence: "controlled fixture only",
      },
    };
    const bundle = prepareTaskBoundBuildCodeReviewBundle(context(f), request, {
      loadConfig: () => ({ attachmentRoot: join(f.root, "attachments") }),
      buildMaterials: input => {
        expect(captureContractFacts(input)).toMatchObject({
          status: "recorded", out_of_scope: ["outside.mjs"], matched: ["src/owned.mjs"], listed_not_changed: [],
        });
        return { bundleRoot: join(f.root, "bundle"), deliveryManifest: [], dispose() {} };
      },
    });
    bundle.dispose();
  });

  it("keeps a declared-only path list unavailable instead of calling it a complete match", async () => {
    const f = await fixture();
    const head = f.head;
    const scope = {
      taskId: f.taskId, primaryRoot: f.repo,
      repositories: [{ id: "wh", sourceRoot: f.repo, targetRepoRoot: f.mainRepo,
        baseCommit: head, expectedHead: head, expectedBranch: "task/workflowhub/scope-fixture", paths: ["src/owned.mjs"] }],
      evidenceFiles: [], authorizationSource: { confirmationRef: "controlled-scope", materialRefs: [] },
    };
    const request = {
      stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1",
      materials: { approved_spec: f.materials.spec, acceptance_criteria: "AC-EXAMPLE-001", test_evidence: "controlled" },
    };
    const bundle = prepareTaskBoundBuildCodeReviewBundle(context(f), request, {
      loadConfig: () => ({ attachmentRoot: join(f.root, "attachments") }), reviewReadScope: scope,
      buildMaterials: input => {
        expect(captureContractFacts(input)).toMatchObject({ status: "unavailable" });
        return { bundleRoot: join(f.root, "bundle"), deliveryManifest: [], dispose() {} };
      },
    });
    bundle.dispose();
  });

  it("returns the same pre-crop comparison from the real build-code readiness entry", async () => {
    const f = await fixture();
    const input = join(f.root, "readiness-input.json");
    writeFileSync(input, JSON.stringify({ phase_progress: { phase_id: "P1", task_id: "T001" } }));
    const saved = Object.fromEntries(["HOME", "WORKFLOWHUB_TASK_DIR", "XDG_CONFIG_HOME"].map(key => [key, process.env[key]]));
    process.env.HOME = join(f.root, "home");
    process.env.WORKFLOWHUB_TASK_DIR = f.root;
    process.env.XDG_CONFIG_HOME = join(f.root, "home/.config");
    let result;
    try {
      result = await stageRuntimeCliMain([
        "run", "--action=execute", "--stage=build-code", "--project=workflowhub",
        `--task=${f.taskId}`, `--task-path=${f.taskPath}`, `--input=${input}`,
      ], { cwd: f.repo });
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
    }
    expect(result.write_set_reconciliation).toMatchObject({
      status: "recorded", out_of_scope: ["outside.mjs"], matched: ["src/owned.mjs"], listed_not_changed: [],
    });
  });

  it("keeps insufficient read scope unavailable with its real reason and no match", async () => {
    const f = await fixture(), scope = {
      taskId: f.taskId, primaryRoot: f.repo,
      repositories: [{ id: "wh", sourceRoot: f.repo, targetRepoRoot: f.mainRepo,
        baseCommit: f.head, expectedHead: f.head, expectedBranch: "task/workflowhub/scope-fixture", paths: [] }],
      evidenceFiles: [], authorizationSource: { confirmationRef: "controlled-scope", materialRefs: [] },
    };
    const request = {
      stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1",
      materials: { approved_spec: f.materials.spec, acceptance_criteria: "AC-EXAMPLE-001", test_evidence: "controlled" },
    };
    const bundle = prepareTaskBoundBuildCodeReviewBundle(context(f), request, {
      loadConfig: () => ({ attachmentRoot: join(f.root, "attachments") }), reviewReadScope: scope,
      buildMaterials: input => {
        const fact = captureContractFacts(input);
        expect(fact).toMatchObject({ status: "unavailable", matched: [], out_of_scope: [], listed_not_changed: [] });
        expect(JSON.stringify(fact)).toMatch(/读域|scope|approved|read/i);
        return { bundleRoot: join(f.root, "bundle"), deliveryManifest: [], dispose() {} };
      },
    });
    expect(bundle, "insufficient read scope must not add a new nonzero exit").toBeDefined();
    bundle.dispose();
  });

  it("keeps Git collection failure unavailable with its real reason and no match", async () => {
    const f = await fixture(), broken = context(f), notGit = join(f.root, "not-a-git-worktree");
    mkdirSync(notGit);
    broken.workspace.worktreeRoot = notGit;
    const request = {
      stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P1",
      materials: { approved_spec: f.materials.spec, acceptance_criteria: "AC-EXAMPLE-001", test_evidence: "controlled" },
    };
    const bundle = prepareTaskBoundBuildCodeReviewBundle(broken, request, {
      loadConfig: () => ({ attachmentRoot: join(f.root, "attachments") }),
      buildMaterials: input => {
        const fact = captureContractFacts(input);
        expect(fact).toMatchObject({ status: "unavailable", matched: [], out_of_scope: [], listed_not_changed: [] });
        expect(JSON.stringify(fact)).toMatch(/Git|采集|SOURCE_UNAVAILABLE|worktree/i);
        return { bundleRoot: join(f.root, "bundle"), deliveryManifest: [], dispose() {} };
      },
    });
    expect(bundle, "Git collection failure must not add a new nonzero exit").toBeDefined();
    bundle.dispose();
  });
});
