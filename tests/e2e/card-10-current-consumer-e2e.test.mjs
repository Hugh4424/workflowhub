import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { writeStageRow } from "../../runtime/task/task-store.mjs";

const runtime = fileURLToPath(new URL("../../tools/cli/stage-runtime.mjs", import.meta.url));
const declaration = readFileSync(new URL("../../workflows/build-prd/steps.json", import.meta.url));
const steps = JSON.parse(declaration).steps;
const roots = [];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const portableRoot = f => join(f.taskPath, "quality/evidence/portable-workflow-outcomes");
const facts = f => readFileSync(join(f.taskPath, "facts.jsonl"));
function git(cwd, ...argv) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  return execFileSync("git", argv, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

async function fixture(type = "规划任务") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "card10-current-consumer-")));
  roots.push(root);
  const repo = join(root, "repo"), storage = join(root, "storage"), home = join(root, "home");
  for (const path of [repo, storage, home]) mkdirSync(path);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.name", "Owned CLI scenario");
  git(repo, "config", "user.email", "owned@test.invalid");
  writeFileSync(join(repo, "README.md"), "owned baseline\n");
  mkdirSync(join(repo, "workflows/build-prd"), { recursive: true });
  writeFileSync(join(repo, "workflows/build-prd/steps.json"), declaration);
  git(repo, "add", "."); git(repo, "commit", "-qm", "owned baseline and actual declaration");
  const env = { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, ".config"), WORKFLOWHUB_TASK_DIR: storage };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  const boot = await bootstrapTask({ project: "OwnedCurrent", task: "current-consumer", "target-repo": repo }, { env, home });
  const wt = boot.workspace.worktree_root, taskPath = boot.task_path, material = join(wt, "specs/current-consumer");
  mkdirSync(join(material, "phases"), { recursive: true });
  const decision = join(material, "decision-log.md");
  writeFileSync(decision, "# Owned decision\n\n## 任务身份\n- **任务类型**：" + type + "\n");
  writeFileSync(join(material, "spec.md"), "# Owned current spec\n");
  writeFileSync(join(material, "phases/index.md"), "## Execution Index\n\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| `P1` | `phases/P1.md` | owned | README.md | none | build-code |\n");
  writeFileSync(join(material, "phases/P1.md"), "# Phase P1\n\n### T001 — Owned work\n");
  git(wt, "add", "specs"); git(wt, "commit", "-qm", "owned current materials");
  const sentinels = [join(storage, "mother-sentinel.json"), join(storage, "sibling-sentinel.json")];
  for (const path of sentinels) writeFileSync(path, '{"owned":"unrelated task sentinel"}\n');
  return { root, repo, storage, home, env, wt, taskPath, material, decision, sentinels, serial: 0 };
}
function call(f, behavior, action, { stage = "build-prd", input, rawInput, extra = [] } = {}) {
  const argv = [runtime, behavior, "--action=" + action, "--stage=" + stage, "--project=OwnedCurrent", "--task=current-consumer", "--task-path=" + f.taskPath];
  if (input !== undefined || rawInput !== undefined) {
    const path = join(f.wt, "owned-input-" + (++f.serial) + ".json");
    writeFileSync(path, rawInput === undefined ? JSON.stringify(input) + "\n" : rawInput);
    argv.push("--input=" + path);
  }
  argv.push(...extra);
  const child = spawnSync(process.execPath, argv, { cwd: f.wt, env: f.env, encoding: "utf8", timeout: 20000 });
  expect(child.error, "real CLI child must spawn and terminate").toBeUndefined();
  expect(child.signal, "real CLI child must not time out or be killed").toBeNull();
  const value = child.stdout.trim() ? JSON.parse(child.stdout) : null;
  return { ...child, value, combined: child.stdout + child.stderr };
}
function inputFor(f, status = "completed", selected = 2) {
  const batch = ++f.serial;
  const rows = steps.map((step, index) => ({ task_id: "current-consumer", workflow: "build-prd", step_id: step.step_id, step_slug: step.step_slug,
    status: index === selected ? status : "completed",
    ...(index === selected && status === "blocked" ? { owner: "owned source author", dependency: "owned author supplies source", unblock_condition: "owned author source is delivered" } : {}) }));
  const directory = join(f.taskPath, "quality/evidence/portable-workflow-outcomes/build-prd");
  mkdirSync(directory, { recursive: true });
  return { task_id: "current-consumer", workflow: "build-prd", step_results: rows.map(row => {
    const ref = "quality/evidence/portable-workflow-outcomes/build-prd/owned-" + batch + "-" + row.step_id + ".json";
    writeFileSync(join(f.taskPath, ref), JSON.stringify({ task_id: "current-consumer", workflow: "build-prd", step_results: [row] }) + "\n");
    return { ...row, result_ref: ref };
  }) };
}
function expectProjection(f, run, state) {
  const terminal = JSON.parse(readFileSync(join(f.taskPath, run.value.ref), "utf8"));
  expect(run.value.state).toBe(state);
  expect(run.value.terminal).toEqual(terminal);
  expect(terminal).toMatchObject({ record_kind: "portable_workflow_terminal", task_id: "current-consumer", workflow: "build-prd", state });
  for (const [behavior, action] of [["status", "begin"], ["doctor", "workspace"]]) {
    const diagnostic = call(f, behavior, action);
    expect(diagnostic.status, diagnostic.combined).toBe(0);
    expect(diagnostic.value.portable_workflow).toMatchObject({ workflow: "build-prd", state, terminal_ref: run.value.ref, reason: terminal.reason });
    expect(diagnostic.value.portable_workflow.failed_step).toBe(terminal.failed_step);
  }
}

describe("CARD-10 current public CLI consumers", () => {
  it("scene 1: planning run consumes every actual declared step and projects the exact terminal through status/doctor", async () => {
    const f = await fixture(), before = facts(f), sentinelBytes = f.sentinels.map(p => readFileSync(p));
    expect(readFileSync(join(f.wt, "workflows/build-prd/steps.json"))).toEqual(declaration);
    const input = inputFor(f); input.step_results.reverse();
    const run = call(f, "run", "execute", { input });
    expect(run.status, "planning public CLI must consume the real producer: " + run.combined).toBe(0);
    expectProjection(f, run, "succeeded");
    expect(run.value.terminal.step_result_refs).toEqual(steps.map(step => input.step_results.find(row => row.step_id === step.step_id).result_ref));
    expect(facts(f)).toEqual(before);
    f.sentinels.forEach((p, i) => expect(readFileSync(p)).toEqual(sentinelBytes[i]));
  });
  it("scene 2: missing step fails visibly; repaired re-entry appends a new result and preserves the original failure", async () => {
    const f = await fixture(), input = inputFor(f);
    const missing = { ...input, step_results: input.step_results.slice(1) };
    const failed = call(f, "run", "execute", { input: missing });
    expect(failed.status).toBe(1); expectProjection(f, failed, "failed");
    expect(failed.value.terminal.failed_step).toBe(steps[0].step_slug);
    const path = join(f.taskPath, failed.value.ref), original = readFileSync(path), digest = sha(original);
    const repaired = call(f, "run", "execute", { input });
    expect(repaired.status, repaired.combined).toBe(0); expectProjection(f, repaired, "succeeded");
    expect(repaired.value.ref).not.toBe(failed.value.ref);
    expect(readFileSync(path)).toEqual(original); expect(sha(readFileSync(path))).toBe(digest);
  });
  it.each([["in-progress", "in-progress", 0], ["abandoned", "abandoned", 0], ["failed", "failed", 1], ["unverified", "unverified", 0], ["blocked", "blocked", 0], ["unavailable", "failed", 1], ["incomplete", "failed", 1]])(
    "scene 3: actual %s input preserves exact %s state and run exit %i in both projections", async (status, state, exit) => {
      const f = await fixture(), before = facts(f), input = inputFor(f, status);
      const run = call(f, "run", "execute", { input });
      expect(run.status, run.combined).toBe(exit); expectProjection(f, run, state);
      expect(run.value.terminal.failed_step).toBe(steps[2].step_slug);
      if (status === "blocked") expect(run.value.terminal.reason).toContain("owned author supplies source");
      expect(facts(f)).toEqual(before);
    });
  it.each(["foreign task", "missing evidence", "bad input JSON", "aliased decision"])(
    "scene 4: %s cannot create a successful planning outcome or overwrite source bytes", async kind => {
      const f = await fixture(), input = inputFor(f), originalRef = input.step_results[0].result_ref;
      const original = readFileSync(join(f.taskPath, originalRef)), before = facts(f);
      if (kind === "foreign task") input.task_id = "foreign-task";
      if (kind === "missing evidence") input.step_results[0].result_ref = "quality/evidence/portable-workflow-outcomes/build-prd/missing.json";
      if (kind === "aliased decision") {
        const owned = join(f.root, "owned-decision.md"); writeFileSync(owned, readFileSync(f.decision));
        rmSync(f.decision); symlinkSync(owned, f.decision);
      }
      const run = call(f, "run", "execute", kind === "bad input JSON" ? { rawInput: "{bad-json" } : { input });
      expect(run.status).not.toBe(0);
      if (run.value?.ref) expectProjection(f, run, "failed");
      expect(readFileSync(join(f.taskPath, originalRef))).toEqual(original);
      expect(facts(f)).toEqual(before);
    });
  it.each(["普通任务", "missing", "invalid", "duplicate", "conflicting"])(
    "scene 5: %s type rejects planning writes without turning unrelated diagnostics into a permission gate", async type => {
      const f = await fixture(), base = "# Owned decision\n\n## 任务身份\n";
      const text = type === "missing" ? base : type === "duplicate" ? base + "- **任务类型**：规划任务\n- **任务类型**：规划任务\n"
        : type === "conflicting" ? base + "- **任务类型**：规划任务\n- **任务类型**：普通任务\n"
        : base + "- **任务类型**：" + (type === "invalid" ? "uncontrolled" : type) + "\n";
      writeFileSync(f.decision, text);
      for (const [behavior, action] of [["status", "begin"], ["doctor", "workspace"]]) expect(call(f, behavior, action).status).toBe(0);
      const before = facts(f), invalid = { task_id: "current-consumer", workflow: "build-prd", step_results: [] };
      expect(existsSync(portableRoot(f))).toBe(false);
      const denied = call(f, "run", "execute", { input: invalid });
      expect(denied.status).not.toBe(0); expect(existsSync(portableRoot(f))).toBe(false); expect(facts(f)).toEqual(before);
      writeFileSync(f.decision, base + "- **任务类型**：规划任务\n");
      const accepted = call(f, "run", "execute", { input: inputFor(f) });
      expect(accepted.status, accepted.combined).toBe(0); expectProjection(f, accepted, "succeeded");
    });
  it.each(["pre", "history", "unknown"])(
    "scene 6: %s cohort remains readable and rejects planning writes before new directories or record mutation", async cohort => {
      const f = await fixture(), path = join(f.taskPath, "task.json"), manifest = JSON.parse(readFileSync(path));
      manifest.activation_cohort = cohort; writeFileSync(path, JSON.stringify(manifest) + "\n");
      const originalManifest = readFileSync(path), before = facts(f), originalDecision = readFileSync(f.decision);
      for (const [behavior, action] of [["status", "begin"], ["doctor", "workspace"]]) expect(call(f, behavior, action).status).toBe(0);
      const denied = call(f, "run", "execute", { input: { task_id: "current-consumer", workflow: "build-prd", step_results: [] } });
      expect(denied.status).not.toBe(0); expect(existsSync(portableRoot(f))).toBe(false);
      expect(readFileSync(path)).toEqual(originalManifest); expect(facts(f)).toEqual(before); expect(readFileSync(f.decision)).toEqual(originalDecision);
    });
  it("scene 7: ordinary run preserves existing source fields and only writes the navigation cursor; broken facts stay visible", async () => {
    const f = await fixture("普通任务");
    await writeStageRow(f.taskPath, { stage: "build-code", source: "owned current facts before cursor", finding_dispositions: [{ finding: "owned marker", disposition: "not_run" }] });
    const before = JSON.parse(facts(f).toString().trim());
    const run = call(f, "run", "execute", { stage: "build-code", input: { phase_progress: { phase_id: "P1", task_id: "T001" } } });
    expect(run.status, run.combined).toBe(0);
    const after = JSON.parse(facts(f).toString().trim()), { phase_progress, ...retained } = after;
    expect(retained).toEqual(before); expect(phase_progress).toMatchObject({ phase_id: "P1", task_id: "T001" });
    expect(after).not.toHaveProperty("completed"); expect(existsSync(portableRoot(f))).toBe(false);
    const status = call(f, "status", "begin", { stage: "build-code" });
    expect(status.status).toBe(0); expect(status.value.quality_status).toBe("unknown"); expect(status.value.phase_progress.cursor).toMatchObject({ phase_id: "P1", task_id: "T001" });
    const malformed = Buffer.from("{broken-owned-facts\n"); writeFileSync(join(f.taskPath, "facts.jsonl"), malformed);
    expect(call(f, "status", "begin", { stage: "build-code" }).status).not.toBe(0);
    expect(call(f, "run", "execute", { stage: "build-code", input: { phase_progress: { phase_id: "P1", task_id: "T001" } } }).status).not.toBe(0);
    expect(facts(f)).toEqual(malformed);
  });
  it("scene 8: public behaviors stay seven, dead --now is rejected, and no-input does not read a manifest or write a terminal", async () => {
    const f = await fixture(), before = facts(f);
    const help = spawnSync(process.execPath, [runtime, "help"], { cwd: f.wt, env: f.env, encoding: "utf8", timeout: 20000 });
    expect(help.status).toBe(0); expect(JSON.parse(help.stdout).behaviors).toEqual(["doctor", "status", "run", "review", "verify", "confirm", "authorize"]);
    const now = call(f, "run", "execute", { extra: ["--now=2026-10-03T00:00:00Z"] });
    expect(now.status).not.toBe(0); expect(now.combined).toMatch(/unknown run option|unknown options/i);
    rmSync(join(f.wt, "workflows/build-prd/steps.json"));
    const noInput = call(f, "run", "execute");
    expect(noInput.status, noInput.combined).toBe(0);
    expect(noInput.value).toMatchObject({ state: "not-started", ref: null, terminal: null });
    expect(facts(f)).toEqual(before); expect(existsSync(portableRoot(f))).toBe(false);
  });
});
