// ORACLE-NORM-WIRING + ORACLE-FLOW-HARDENING
// 本文件通过只证明当前三条工作流正文、现有登记、有稿/无稿临时任务与固定样本；
// 不证明任意项目、真实设计源或长期效果。有稿链只走公共 CLI 与正文写明的消费动作，
// 不补私有捷径；删除正文消费动作后必须取不到消费记录。受控任务在临时 git worktree 中创建并清理。
// RED 只落正文消费、外部模型原句、登记导航或八步/同步目标断言；导入、收集与环境失败另记。
import {mkdtempSync, mkdirSync, readFileSync, realpathSync, writeFileSync, existsSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {spawnSync, execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {createTask} from "../../runtime/task/task-handle.mjs";
import {initializeTaskStore} from "../../runtime/task/task-store.mjs";

const ROOT = process.cwd();
const STAGE_RUNTIME = fileURLToPath(new URL("../../tools/cli/stage-runtime.mjs", import.meta.url));
const FIXTURE = join(ROOT, "tests/fixtures/design-port-sample");
const JUDGMENT = join(FIXTURE, "judgment/direct/judgment.md");
const MANIFEST = join(FIXTURE, "port/manifest.json");
const DESIGN = join(FIXTURE, "prototype");
const EXTERNAL_MODEL_SENTENCE = "未派发外部模型不算审查，独立子代理不得顶替";
const NEW_FILES = {
  "references/collaboration.md": "协作与写入权",
  "references/port-method.md": "移植",
  "references/data-and-state.md": "数据与状态",
  "references/wiring.md": "既有功能接线",
  "references/verification.md": "机器校验",
  "references/visual-review.md": "目视",
  "references/anti-patterns.md": "反模式",
  "scripts/check-judgment.mjs": "判断",
  "scripts/check-port-manifest.mjs": "移植登记",
  "scripts/check-data-discipline.mjs": "数据",
  "scripts/check-wiring.mjs": "接线",
  "scripts/check-geometry.mjs": "几何",
  "scripts/check-dom-parity.mjs": "结构",
  "scripts/check-port-parity.mjs": "来源",
  "scripts/check-feature-keep.mjs": "功能保留",
  "scripts/check-visual-review.mjs": "目视审查",
  "scripts/check-write-set.mjs": "写者记录",
};

const read = rel => readFileSync(join(ROOT, rel), "utf8");
const readAt = (base, rel) => readFileSync(join(base, rel), "utf8");
function sectionOf(body, start, end) {
  const from = body.indexOf(start);
  if (from < 0) return "";
  const to = end === null ? body.length : body.indexOf(end, from + start.length);
  return body.slice(from, to < 0 ? body.length : to);
}
const backticked = text => [...text.matchAll(/`([^`\n]+)`/g)].map(match => match[1]);
const commandsIn = text => backticked(text).filter(value => /^(?:node|npx)\s/.test(value));
function firstCommand(text, needle) {
  return commandsIn(text).find(command => command.includes(needle)) ?? null;
}
function mapPlaceholders(command, mapping) {
  return Object.entries(mapping).reduce((value, [token, replacement]) => value.split(token).join(replacement), command);
}
function runShell(command, {cwd = ROOT, env} = {}) {
  return spawnSync("/bin/sh", ["-c", command], {cwd, ...(env ? {env} : {}), encoding: "utf8", timeout: 120000});
}

// The workflow body is the only protocol source: discovery reads the current text and
// returns null when the action/input mapping is gone, instead of falling back to a hardcoded call.
function discoverProtocol({workflowRoot = join(ROOT, "workflows"), skillRoot = join(ROOT, "skills")} = {}) {
  const buildCode = readAt(workflowRoot, "build-code/SKILL.md");
  const extraction = readAt(skillRoot, "design-source-extraction/SKILL.md");
  const step = sectionOf(buildCode, '1. <a id="step-read-current-task-documents">', '2. <a id="step-write-red-tests">');
  const portSection = sectionOf(extraction, "## 移植消费入口是什么？", "\n## ");
  return {
    statusCommand: firstCommand(step, "stage-runtime.mjs status --action=begin"),
    judgmentCommand: firstCommand(step, "check-judgment.mjs"),
    portCommand: firstCommand(portSection, "check-port-manifest.mjs"),
    requiresDraftForJudgment: /有稿/.test(step),
  };
}

function makeFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "p5-flow-")));
  const repo = join(root, "repo"), worktree = join(root, "worktree"), storage = join(root, "storage"), home = join(root, "home");
  for (const dir of [repo, storage, home]) mkdirSync(dir);
  const git = (cwd, args) => execFileSync("git", args, {cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]}).trim();
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub fixture"]);
  git(repo, ["config", "user.email", "fixture@test.invalid"]);
  git(repo, ["commit", "--allow-empty", "-qm", "baseline"]);
  git(repo, ["worktree", "add", "-qb", "task/workflowhub/p5-flow", worktree]);
  const taskId = "p5-flow-task";
  return {root, repo, worktree, storage, home, taskId,
    env: {...process.env, HOME: home, XDG_CONFIG_HOME: join(home, ".config"), WORKFLOWHUB_TASK_DIR: storage}};
}
async function createPostTask(f, {draft}) {
  const task = await createTask({storageRoot: f.storage, manifest: {
    schema_version: "1.0.0", project_name: "workflowhub", task_id: f.taskId, created_at: "2026-11-15T00:00:00.000Z",
    target_repo_root: f.repo, workspace_mode: "existing", workspace_root: f.worktree,
    activation_cohort: "post", execution_mode: "per_invocation", record_model: "vnext-single-write", issue_ids: [], inputs: {},
  }});
  await initializeTaskStore(task.taskPath, {taskId: f.taskId});
  const materials = join(f.worktree, "specs", f.taskId);
  mkdirSync(materials, {recursive: true});
  writeFileSync(join(materials, "decision-log.md"), "# 受控任务\n\n## 任务身份\n\n- **任务类型**：规划任务\n");
  if (draft) writeFileSync(join(materials, "judgment.md"), readFileSync(JUDGMENT));
  return {task, materials};
}
function cli(f, args, taskPath) {
  return spawnSync(process.execPath, [STAGE_RUNTIME, ...args, "--project=workflowhub", `--task=${f.taskId}`, ...(taskPath ? [`--task-path=${taskPath}`] : [])], {
    cwd: f.worktree, env: f.env, encoding: "utf8", timeout: 60000,
  });
}
function publish(f, stage, name, body, root, taskPath) {
  const source = join(root, `draft-${name.replaceAll("/", "-")}`);
  writeFileSync(source, body);
  return cli(f, ["run", `--stage=${stage}`, "--action=draft", `--name=${name}`, `--input=${source}`], taskPath);
}
const INDEX = "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n";
const PHASE = "# P1 受控阶段\n\n### 任务 1：受控有稿实施\n\n这张任务卡写进入实施前的判断与移植消费。\n\n## 机器字段（校验器用，人可跳过）\n\n- **任务编号**：T001\n";
const SPEC = "# 受控规格\n\n## 设计稿套用结论\n\n判为直接套用，负责人是本阶段主会话。\n";
const PRD = "# 受控 PRD\n\n有稿前置：判断正文见 judgment.md，本 PRD 只记录指针。\n";

async function prepareDraftTask(f) {
  const prepared = await createPostTask(f, {draft: true});
  const drafts = {};
  for (const [name, body, stage] of [["spec.md", SPEC, "build-plan"], ["phases/index.md", INDEX, "build-plan"], ["phases/P1.md", PHASE, "build-plan"], ["prd.md", PRD, "build-prd"]]) {
    const result = publish(f, stage, name, body, f.root, prepared.task.taskPath);
    if (result.status !== 0) throw new Error(`draft ${name} failed: ${result.stdout}${result.stderr}`);
    drafts[name] = result;
  }
  return {...prepared, drafts};
}
function saveRaw(name, result) {
  const dir = process.env.P5_FLOW_RAW_DIR;
  if (!dir) return;
  mkdirSync(dir, {recursive: true});
  writeFileSync(join(dir, name), `${result.stdout}${result.stderr ? `\n[stderr]\n${result.stderr}` : ""}`);
}

function consume(protocol, {f, taskPath, materials}) {
  const mapping = {"<项目>": "workflowhub", "<任务>": f.taskId, "<任务库>": taskPath, "<任务目录>": taskPath};
  const record = {status: null, judgment: null, port: null};
  if (protocol.statusCommand) {
    // The workflow names the CLI repo-relative; the temp worktree is the identity,
    // so the test maps that one path to the installed checkout.
    const status = mapPlaceholders(protocol.statusCommand, mapping).replace(/^node\s+tools\/cli\/stage-runtime\.mjs/, `node ${STAGE_RUNTIME}`);
    record.status = runShell(status, {cwd: f.worktree, env: f.env});
  }
  if (protocol.judgmentCommand) {
    const judgment = mapPlaceholders(protocol.judgmentCommand, {...mapping, "<judgment.md>": join(materials, "judgment.md")});
    record.judgment = runShell(judgment);
  }
  if (protocol.portCommand) {
    const port = mapPlaceholders(protocol.portCommand, {...mapping, "<manifest>": MANIFEST, "<设计源>": DESIGN});
    record.port = runShell(port);
  }
  return record;
}

{
  const vitest = await import("vitest");
  const {describe, it, expect, afterAll} = vitest;

  describe("ORACLE-FLOW-HARDENING names the external-model requirement", () => {
    it("make-decision states that an external model must actually be dispatched, outside the frozen step 7", () => {
      const body = read("workflows/make-decision/SKILL.md");
      // 第 7 步与 998614bd 逐字相同由 ui-stage-make-decision.test.mjs 守卫，
      // 所以该句放在第 7 步之外、由补充小节承接；判据仍是「文件里有这句」，
      // 而不是恒真：删掉这行就红。
      const step = sectionOf(body, '7. <a id="step-direction-advice">', '8. <a id="step-module-breadth-confirm">');
      expect(step.length).toBeGreaterThan(0);
      expect(body).toContain(EXTERNAL_MODEL_SENTENCE);
      const supplement = sectionOf(body, "### 第 7 步补充：方向审查与外部模型", "\n## ");
      expect(supplement.length).toBeGreaterThan(0);
      expect(supplement).toMatch(/承接第 7 步/);
      expect(supplement).toContain(EXTERNAL_MODEL_SENTENCE);
      expect(supplement).toMatch(/外部模型/);
    });
  });

  describe("ORACLE-NORM-WIRING registers and navigates every delivered method", () => {
    it("the extraction skill navigation names every method and script with a one-line purpose", () => {
      const body = read("skills/design-source-extraction/SKILL.md");
      for (const [file, purpose] of Object.entries(NEW_FILES)) {
        const index = body.indexOf(file);
        expect(index, `${file} must be reachable from SKILL.md`).toBeGreaterThanOrEqual(0);
        const line = body.slice(body.lastIndexOf("\n", index) + 1, body.indexOf("\n", index));
        expect(line, `${file} needs a one-line purpose`).toContain(purpose);
      }
    });
    it("the skill states an eight-step flow for a new page", () => {
      const body = read("skills/design-source-extraction/SKILL.md");
      const flow = sectionOf(body, "## 新页面八步流程", "\n## ");
      expect(flow.length).toBeGreaterThan(0);
      const steps = flow.split(/\r?\n/).filter(line => /^\d+\.\s/.test(line));
      expect(steps).toHaveLength(8);
      for (const step of steps) expect(step.replace(/^\d+\.\s*/, "").trim().length).toBeGreaterThan(4);
    });
    it("the skill states how a changed design source is synchronised", () => {
      const body = read("skills/design-source-extraction/SKILL.md");
      const sync = sectionOf(body, "## 设计稿更新后怎么同步", "\n## ");
      expect(sync.length).toBeGreaterThan(0);
      for (const token of ["freshness", "重新提炼", "冻结", "登记"]) expect(sync).toContain(token);
    });
    it("each anti-pattern reaches a runnable gate or names a gap owner", () => {
      const body = read("skills/design-source-extraction/references/anti-patterns.md");
      const rows = body.split(/\r?\n/).filter(line => /^\|/.test(line) && !/^\|\s*-+/.test(line) && !/^\|\s*现象/.test(line));
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        const cells = row.split("|").slice(1, -1).map(cell => cell.trim());
        expect(cells).toHaveLength(4);
        const gate = cells[2];
        if (/暂无门禁/.test(gate)) {
          expect(gate).toMatch(/owner/);
          continue;
        }
        const command = commandsIn(gate)[0];
        expect(command, `anti-pattern needs a runnable gate: ${row}`).toBeTruthy();
        const result = runShell(command);
        expect(result.status, `${command}: ${result.stdout}${result.stderr}`).toBe(0);
      }
    });
    it("the three design-port workflows reach the method, update-sync and anti-pattern entries", () => {
      for (const stage of ["build-plan", "build-prd", "build-code"]) {
        const body = read(`workflows/${stage}/SKILL.md`);
        expect(body, stage).toContain("skills/design-source-extraction/SKILL.md");
        expect(body, stage).toContain("新页面八步流程");
        expect(body, stage).toContain("anti-patterns.md");
        expect(body, stage).toContain("设计稿更新后怎么同步");
      }
      expect(read("workflows/make-decision/SKILL.md")).toContain(EXTERNAL_MODEL_SENTENCE);
    });
    it("the four machine checks are re-derivable from their named commands", () => {
      const body = read("skills/design-source-extraction/SKILL.md");
      const names = ["geometry", "dom-parity", "port-parity", "feature-keep"];
      for (const name of names) {
        expect(body).toContain(`check-${name}.mjs`);
        const result = runShell(`node skills/design-source-extraction/scripts/check-${name}.mjs --config tests/fixtures/design-port-sample/verification/${name}.json`);
        expect(result.status, `${name}: ${result.stdout}${result.stderr}`).toBe(0);
      }
    });
  });

  describe("ORACLE-NORM-WIRING consumes the workflow protocol through the public CLI", () => {
    const fixtures = [];
    afterAll(() => { while (fixtures.length) rmSync(fixtures.pop(), {recursive: true, force: true}); });

    it("a draft task consumes judgment and port products only through the actions its workflow text names", async () => {
      const f = makeFixture(); fixtures.push(f.root);
      const {task, materials, drafts} = await prepareDraftTask(f);
      // build-prd really publishes through the public draft action, not just a pointer.
      expect(drafts["prd.md"].status, drafts["prd.md"].stderr).toBe(0);
      expect(JSON.parse(drafts["prd.md"].stdout).artifact_ref).toBe(`specs/${f.taskId}/prd.md`);
      expect(existsSync(join(materials, "prd.md"))).toBe(true);
      saveRaw("build-prd-draft.stdout", drafts["prd.md"]);
      saveRaw("build-plan-draft.stdout", drafts["spec.md"]);
      const protocol = discoverProtocol();
      expect(protocol.statusCommand, "build-code step 1 must name status:begin").toBeTruthy();
      expect(protocol.judgmentCommand, "build-code step 1 must name check-judgment").toBeTruthy();
      expect(protocol.portCommand, "the port entry must name check-port-manifest").toBeTruthy();
      expect(protocol.requiresDraftForJudgment).toBe(true);
      const record = consume(protocol, {f, taskPath: task.taskPath, materials});
      saveRaw("status-begin.stdout", record.status);
      saveRaw("judgment.stdout", record.judgment);
      saveRaw("port-manifest.stdout", record.port);
      expect(record.status.status, record.status.stderr).toBe(0);
      const status = JSON.parse(record.status.stdout);
      expect(status.stage).toBe("build-code");
      expect(status.materials["spec.md"]).toBe(true);
      expect(status.materials["phases/P1.md"]).toBe(true);
      expect(record.judgment.status, record.judgment.stderr).toBe(0);
      const judgment = JSON.parse(record.judgment.stdout);
      expect(judgment.allowed_for_construction).toBe(true);
      expect(judgment.verdict).toBe("direct");
      expect(record.port.status, record.port.stderr).toBe(0);
      const port = JSON.parse(record.port.stdout);
      expect(port.ok).toBe(true);
      expect(port.files.map(file => file.target).sort()).toEqual(["app.js", "index.html", "styles.css"]);
    });

    it("a no-draft task keeps its behaviour and gains no judgment requirement", async () => {
      const f = makeFixture(); fixtures.push(f.root);
      const {task} = await createPostTask(f, {draft: false});
      // The same material publication path works without a judgment artifact.
      for (const [name, body] of [["spec.md", SPEC], ["phases/index.md", INDEX], ["phases/P1.md", PHASE]]) {
        const result = publish(f, "build-plan", name, body, f.root, task.taskPath);
        expect(result.status, `${name}: ${result.stdout}${result.stderr}`).toBe(0);
      }
      const protocol = discoverProtocol();
      const statusCommand = mapPlaceholders(protocol.statusCommand, {"<项目>": "workflowhub", "<任务>": f.taskId, "<任务库>": task.taskPath}).replace(/^node\s+tools\/cli\/stage-runtime\.mjs/, `node ${STAGE_RUNTIME}`);
      const statusResult = runShell(statusCommand, {cwd: f.worktree, env: f.env});
      expect(statusResult.status, statusResult.stderr).toBe(0);
      const status = JSON.parse(statusResult.stdout);
      expect(status.work_status).toBe("ready");
      expect(existsSync(join(f.worktree, "specs", f.taskId, "judgment.md"))).toBe(false);
    });

    it("removing a consumption action from a workflow copy yields no consumption record, and restoring replays", async () => {
      const source = read("workflows/build-code/SKILL.md");
      const extraction = read("skills/design-source-extraction/SKILL.md");
      const root = realpathSync(mkdtempSync(join(tmpdir(), "p5-flow-copy-"))); fixtures.push(root);
      const workflowRoot = join(root, "workflows"), skillRoot = join(root, "skills");
      mkdirSync(join(workflowRoot, "build-code"), {recursive: true});
      mkdirSync(join(skillRoot, "design-source-extraction"), {recursive: true});
      const buildCodePath = join(workflowRoot, "build-code/SKILL.md");
      const extractionPath = join(skillRoot, "design-source-extraction/SKILL.md");
      const broken = source.replace(/`node skills\/design-source-extraction\/scripts\/check-judgment\.mjs[^`]*`/g, "判断由实施者自行核对");
      writeFileSync(buildCodePath, broken);
      writeFileSync(extractionPath, extraction.replace(/`node skills\/design-source-extraction\/scripts\/check-port-manifest\.mjs[^`]*`/g, "移植登记由实施者自行核对"));
      const consumed = protocol => ["statusCommand", "judgmentCommand", "portCommand"].filter(key => protocol[key]).length;
      const stripped = discoverProtocol({workflowRoot, skillRoot});
      expect(stripped.judgmentCommand).toBeNull();
      expect(stripped.portCommand).toBeNull();
      expect(consumed(stripped)).toBe(1); // only the read-only status step remains
      // Execute the stripped protocol on a real task: it may read status, but it
      // must not produce a judgment or port consumption record.
      const f = makeFixture(); fixtures.push(f.root);
      const {task, materials} = await prepareDraftTask(f);
      const strippedRecord = consume(stripped, {f, taskPath: task.taskPath, materials});
      expect(strippedRecord.status.status, strippedRecord.status.stderr).toBe(0);
      expect(strippedRecord.judgment).toBeNull();
      expect(strippedRecord.port).toBeNull();
      writeFileSync(buildCodePath, source);
      writeFileSync(extractionPath, extraction);
      const restored = discoverProtocol({workflowRoot, skillRoot});
      expect(restored.judgmentCommand).toBeTruthy();
      expect(restored.portCommand).toBeTruthy();
      expect(consumed(restored)).toBe(3);
      const restoredRecord = consume(restored, {f, taskPath: task.taskPath, materials});
      expect(restoredRecord.judgment.status, restoredRecord.judgment.stderr).toBe(0);
      expect(restoredRecord.port.status, restoredRecord.port.stderr).toBe(0);
    });

    it("run --action=execute is not a business shortcut for this chain", async () => {
      const f = makeFixture(); fixtures.push(f.root);
      const {task} = await createPostTask(f, {draft: true});
      const source = join(f.root, "business-input.json");
      writeFileSync(source, JSON.stringify({judgment: {verdict: "direct"}}));
      const result = cli(f, ["run", "--stage=build-code", "--action=execute", `--input=${source}`], task.taskPath);
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toMatch(/phase_progress|unknown|invalid/i);
    });
  });
}
