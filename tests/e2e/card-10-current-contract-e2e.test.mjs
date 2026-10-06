import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";

const runtime = fileURLToPath(new URL("../../tools/cli/stage-runtime.mjs", import.meta.url));
const declaration = readFileSync(new URL("../../workflows/build-prd/steps.json", import.meta.url));
const steps = JSON.parse(declaration).steps;
const roots = [];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");

function cleanEnv() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  return env;
}

function git(cwd, ...argv) {
  return execFileSync("git", argv, { cwd, env: cleanEnv(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

async function fixture(type = "普通任务") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "card10-current-contract-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  const home = join(root, "home");
  for (const path of [repo, storage, home]) mkdirSync(path);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.name", "CARD-10 owned fixture");
  git(repo, "config", "user.email", "card10@test.invalid");
  writeFileSync(join(repo, "README.md"), "owned baseline\n");
  mkdirSync(join(repo, "workflows/build-prd"), { recursive: true });
  writeFileSync(join(repo, "workflows/build-prd/steps.json"), declaration);
  git(repo, "add", ".");
  git(repo, "commit", "-qm", "owned baseline");
  const env = { ...cleanEnv(), HOME: home, XDG_CONFIG_HOME: join(home, ".config"), WORKFLOWHUB_TASK_DIR: storage };
  const boot = await bootstrapTask({ project: "CARD10Owned", task: "current-contract", "target-repo": repo }, { env, home, cwd: repo });
  const worktree = boot.workspace.worktree_root;
  const taskPath = boot.task_path;
  const material = join(worktree, "specs/current-contract");
  mkdirSync(join(material, "phases"), { recursive: true });
  writeFileSync(join(material, "decision-log.md"), `# Owned decision\n\n## 任务身份\n- **任务类型**：${type}\n\n## Decision\nacceptance: keep\n`);
  writeFileSync(join(material, "spec.md"), "# Initial specification\nacceptance: keep\n");
  writeFileSync(join(material, "phases/index.md"), "## Execution Index\n\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| `P1` | `phases/P1.md` | owned | README.md | none | build-code |\n");
  writeFileSync(join(material, "phases/P1.md"), "# Phase P1\n\n### T001 — Owned current work\n");
  git(worktree, "add", "specs");
  git(worktree, "commit", "-qm", "owned current materials");
  return { root, repo, storage, home, env, worktree, taskPath, material };
}

function cli(f, behavior, action, { stage = "build-code", extra = [], input } = {}) {
  const argv = [runtime, behavior, `--action=${action}`, `--stage=${stage}`, "--project=CARD10Owned", "--task=current-contract", `--task-path=${f.taskPath}`];
  if (input !== undefined) {
    const path = join(f.worktree, `owned-input-${Math.random().toString(16).slice(2)}.json`);
    writeFileSync(path, typeof input === "string" ? input : JSON.stringify(input) + "\n");
    argv.push(`--input=${path}`);
  }
  argv.push(...extra);
  const result = spawnSync(process.execPath, argv, { cwd: f.worktree, env: f.env, encoding: "utf8", timeout: 20_000 });
  expect(result.error, result.stderr).toBeUndefined();
  expect(result.signal, result.stderr).toBeNull();
  let value = null;
  if (result.stdout.trim()) value = JSON.parse(result.stdout);
  return { ...result, value, combined: result.stdout + result.stderr };
}

function materialBytes(f) {
  return Object.fromEntries(["decision-log.md", "spec.md", "phases/index.md", "phases/P1.md"].map(name => [name, readFileSync(join(f.material, name))]));
}

function readOnlyConsumer(f) {
  const bytes = materialBytes(f);
  return Object.fromEntries(Object.entries(bytes).map(([name, value]) => [name, { bytes: value.length, sha256: sha(value) }]));
}

function reviewCli(f, inputPath) {
  const moduleUrl = new URL("../../tools/cli/stage-runtime.mjs", import.meta.url).href;
  const code = `import { stageRuntimeCliMain } from ${JSON.stringify(moduleUrl)};
    try {
      const value = await stageRuntimeCliMain(JSON.parse(process.argv[1]), { services: {
        runReviewRound: async (_request, options) => {
          await options.onProviderOutput({ provider: "owned/unavailable", output: "controlled unavailable raw\\n" });
          return { status: "unavailable", dispatch_state: "blocked_before_dispatch", provider_results: [], findings: [], error: { code: "OWNED_UNAVAILABLE", message: "controlled unavailable" } };
        },
      } });
      console.log(JSON.stringify({ ok: true, value }));
    } catch (error) {
      console.log(JSON.stringify({ ok: false, error: { code: error.code ?? null, message: error.message } }));
    }`;
  const argv = ["review", "--action=record", "--stage=build-plan", "--project=CARD10Owned", "--task=current-contract", `--task-path=${f.taskPath}`, `--input=${inputPath}`];
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", code, JSON.stringify(argv)], { cwd: f.worktree, env: f.env, encoding: "utf8", timeout: 20_000 });
  expect(result.error, result.stderr).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}

afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe("current blueprint", () => {
  it("consumes current material through CLI, portable producer, cursor facts, and review raw evidence", async () => {
    const f = await fixture("规划任务");
    const beforeFacts = readFileSync(join(f.taskPath, "facts.jsonl"));
    expect(cli(f, "doctor", "workspace").status).toBe(0);
    expect(cli(f, "status", "begin").value.quality_status).toBe("unknown");

    const draft = join(f.worktree, "owned-draft.md");
    writeFileSync(draft, "# Authored current specification\nacceptance: keep\n");
    const authored = cli(f, "run", "draft", { stage: "build-plan", extra: ["--name=spec.md", `--input=${draft}`] });
    expect(authored.status, authored.combined).toBe(0);
    expect(readFileSync(join(f.material, "spec.md"))).toEqual(readFileSync(draft));

    const cursor = cli(f, "run", "execute", {
      stage: "build-code",
      input: { phase_progress: { phase_id: "P1", task_id: "T001" } },
    });
    expect(cursor.status, cursor.combined).toBe(0);
    const facts = JSON.parse(readFileSync(join(f.taskPath, "facts.jsonl"), "utf8").trim());
    expect(facts).toMatchObject({ stage: "build-code", phase_progress: { phase_id: "P1", task_id: "T001" } });
    expect(facts).not.toHaveProperty("completed");

    const stepResults = steps.map(step => ({
      task_id: "current-contract", workflow: "build-prd", step_id: step.step_id, step_slug: step.step_slug, status: "completed",
      result_ref: `quality/evidence/portable-workflow-outcomes/build-prd/owned-${step.step_id}.json`,
    }));
    mkdirSync(join(f.taskPath, "quality/evidence/portable-workflow-outcomes/build-prd"), { recursive: true });
    for (const row of stepResults) writeFileSync(join(f.taskPath, row.result_ref), JSON.stringify({ task_id: "current-contract", workflow: "build-prd", step_results: [row] }) + "\n");
    const portable = cli(f, "run", "execute", {
      stage: "build-prd",
      input: { task_id: "current-contract", workflow: "build-prd", step_results: stepResults },
    });
    expect(portable.status, portable.combined).toBe(0);
    expect(portable.value).toMatchObject({ state: "succeeded", terminal: { workflow: "build-prd", task_id: "current-contract" } });
    expect(cli(f, "status", "begin", { stage: "build-prd" }).value.portable_workflow).toMatchObject({ state: "succeeded", terminal_ref: portable.value.ref });
    expect(readFileSync(join(f.taskPath, "facts.jsonl"))).not.toEqual(beforeFacts);

    const reviewInput = join(f.worktree, "review-input.json");
    writeFileSync(reviewInput, JSON.stringify({ request: {
      stage: "build-plan", subject_kind: "document", surface: "document",
      materials: { approved_spec: readFileSync(join(f.material, "spec.md"), "utf8"), acceptance_criteria: "owned AC", test_evidence: "owned raw" },
    } }) + "\n");
    const review = reviewCli(f, reviewInput);
    expect(review.ok).toBe(true);
    expect(review.value.status).toBe("unavailable");
    expect(existsSync(join(f.taskPath, review.value.result_ref))).toBe(true);
    expect(readFileSync(join(f.taskPath, review.value.result_ref), "utf8")).toContain("OWNED_UNAVAILABLE");
    expect(readOnlyConsumer(f)).toHaveProperty("decision-log.md");
  });

  it("rejects missing current phase material without manufacturing a completion record", async () => {
    const f = await fixture();
    rmSync(join(f.material, "phases/P1.md"));
    const before = readFileSync(join(f.taskPath, "facts.jsonl"));
    const status = cli(f, "status", "begin");
    expect(status.status, status.combined).toBe(0);
    expect(status.value.missing_materials).toContain("phases/P1.md");
    expect(readFileSync(join(f.taskPath, "facts.jsonl"))).toEqual(before);
  });
});

describe("current coexist", () => {
  it("keeps normal, opposite, and overwrite samples observable to a read-only consumer", async () => {
    const f = await fixture();
    const original = materialBytes(f);
    const factsBefore = readFileSync(join(f.taskPath, "facts.jsonl"));
    const cases = [
      ["normal", "# Candidate\nacceptance: keep\n"],
      ["opposite", "# Candidate\nacceptance: reject\n"],
      ["overwrite", "# Candidate\nacceptance: first\n"],
    ];
    const observed = [];
    for (const [name, authoredBytes] of cases) {
      const draft = join(f.worktree, `draft-${name}.md`);
      writeFileSync(draft, authoredBytes);
      const result = cli(f, "run", "draft", { stage: "build-plan", extra: ["--name=spec.md", `--input=${draft}`] });
      expect(result.status, result.combined).toBe(0);
      const current = materialBytes(f);
      expect(current["decision-log.md"]).toEqual(original["decision-log.md"]);
      expect(current["phases/index.md"]).toEqual(original["phases/index.md"]);
      expect(current["phases/P1.md"]).toEqual(original["phases/P1.md"]);
      expect(current["spec.md"]).toEqual(Buffer.from(authoredBytes));
      observed.push({ name, readOnly: readOnlyConsumer(f), decision: current["decision-log.md"].toString("utf8"), authored: authoredBytes });
    }
    const replacement = "# Candidate\nacceptance: second\n";
    const draft = join(f.worktree, "draft-replacement.md");
    writeFileSync(draft, replacement);
    expect(cli(f, "run", "draft", { stage: "build-plan", extra: ["--name=spec.md", `--input=${draft}`] }).status).toBe(0);
    expect(observed.find(item => item.name === "overwrite").authored).toContain("first");
    expect(readFileSync(join(f.material, "spec.md"), "utf8")).toBe(replacement);
    expect(readFileSync(join(f.taskPath, "facts.jsonl"))).toEqual(factsBefore);
    expect(observed).toHaveLength(3);
    expect(observed.find(item => item.name === "opposite").decision).toContain("acceptance: keep");
  });
});
