// 四技能接线契约（任务无关）：decision-maker / task-maker / phase-maker / run-phase。
//
// 这四个技能各自声明在阶段步骤表的 `skill` 字段上，但没有任何能跑的东西验证它们
// 真的接上：读取入口能不能读到同一份文件、完成证据形态会不会让步骤永远判不了完成、
// 不读技能还能不能判完成。本文件就是这条接线契约的唯一测试。
//
// 只从真实文件字节与真实公开子进程观察，不 import 内部函数：
//  - 步骤表与技能文件是仓库里的真实字节，按「声明的 skill 路径等于该技能文件」定位，
//    不写死任何步骤号；
//  - 公开入口固定是 tools/cli/check-stage-steps.mjs 的真实子进程，cwd 是仓库根；
//  - 任务根与材料根用隔离临时目录，不读真实任务库；临时目录里自建 git 工作树，
//    只为满足入口「--commit 必须等于工作区 HEAD」的身份检查，用完递归删除。
//
// 五条断言（全部任务无关）：
//  1. 声明齐：四个技能文件存在，各自至少在一个阶段步骤表被 skill 声明，锚是 <a id> 形式；
//  2. 证据形态合法：声明 skill 的步骤有 facts.jsonl#逻辑槽；test/review 不用裸目录；
//     任何条目都不绑具体任务 id、不落 specs/archive；
//  3. 公开入口能读到同一份技能：--read-step-skill 退出 0，正文 >2000 字节，
//     sha256 等于当前文件字节；
//  4. 强制读取有效（负例）：不带 --current-read-receipt 时报告当前读取回执无效；
//  5. 没有第二处声明：同一技能文件只在一个阶段被声明。
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const CLI = join(ROOT, "tools", "cli", "check-stage-steps.mjs");
const NODE = process.execPath;
// 四个阶段的规范步骤表是这四个技能唯一允许的声明位置。
const STAGES = ["make-decision", "build-prd", "build-plan", "build-code"];
const SKILL_FILES = [
  "skills/decision-maker/SKILL.md",
  "skills/task-maker/SKILL.md",
  "skills/phase-maker/SKILL.md",
  "skills/run-phase/SKILL.md",
];

const clip = value => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > 1200 ? `${text.slice(0, 1200)}…` : text;
};

// 声明的 skill 可以是 `file#anchor` 字符串，也可以是带 file/path 与 anchor/section 的对象；
// 空声明不是声明。这里只做形状解析，真假仍由下面的真实字节与真实子进程判定。
function declaredSkill(value) {
  if (typeof value === "string") {
    const at = value.indexOf("#");
    return at < 0
      ? { file: value.trim(), anchor: null }
      : { file: value.slice(0, at).trim(), anchor: value.slice(at + 1).trim() || null };
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const file = [value.file, value.path, value.skill_file]
      .find(item => typeof item === "string" && item.trim())?.trim() ?? "";
    const anchor = [value.anchor, value.section]
      .find(item => typeof item === "string" && item.trim())?.trim() ?? "";
    return file ? { file, anchor: anchor || null } : null;
  }
  return null;
}

const TABLES = STAGES.map(stage => {
  const source = `workflows/${stage}/steps.json`;
  const path = join(ROOT, source);
  assert.ok(existsSync(path), `声明齐：阶段步骤表不存在 ${source}，${stage} 的 skill 声明无从读取`);
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(manifest.stage_slug, stage, `声明齐：${source} 的 stage_slug 不是 ${stage}`);
  assert.ok(Array.isArray(manifest.steps) && manifest.steps.length > 0, `声明齐：${source} 没有步骤数组`);
  return { stage, source, steps: manifest.steps };
});

// 凡声明了 skill 的步骤（断言 2 用）；再按 `file#anchor` 摊平成可实跑的位置（断言 1/3/4/5 用）。
const SKILL_STEPS = TABLES.flatMap(table => table.steps
  .filter(step => step && step.skill)
  .map(step => ({ stage: table.stage, source: table.source, step })));
const DECLARATIONS = SKILL_STEPS
  .map(row => ({ ...row, ...declaredSkill(row.step.skill) }))
  .filter(row => row.file);

// 裸目录只在 test / review 两种 kind 上判死（检查器原话：目录仅作导航，不满足
// 完成声明）；talk_original 等目录型逻辑槽由任务库按任务解析，不是裸目录。
const BARE_DIR_ONLY_FOR = new Set(["test", "review"]);
// 不绑具体任务、不绑归档：任何条目都不得出现这两类形态。
const TASK_BOUND_OR_ARCHIVED = [
  [/delivery-quality-[a-z0-9-]+-20\d{6}/, "包含具体任务 id"],
  [/^specs\/archive\//, "specs/archive 下的历史路径"],
];

// 隔离夹具：任务根必须保持 <…>/Projects/<项目>/tasks/<任务> 形状，材料根必须是
// 一个真实 git 工作树（公开读取入口要求 --commit 等于工作区 HEAD）。这里不写入真实任务库。
function makeFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "four-skill-wiring-")));
  try {
    const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    git(["init", "-q"]);
    writeFileSync(join(root, "fixture.md"), "# 隔离夹具\n");
    git(["add", "fixture.md"]);
    git(["-c", "user.name=four-skill-wiring", "-c", "user.email=wiring@example.invalid",
      "-c", "commit.gpgsign=false", "commit", "-q", "-m", "fixture"]);
    const head = git(["rev-parse", "--verify", "HEAD^{commit}"]).trim();
    assert.match(head, /^[a-f0-9]{40,64}$/, "强制读取：隔离夹具没有可读的真实 HEAD，公开入口的身份检查无从满足");
    const taskPath = join(root, "Projects", "wiring-fixture", "tasks", "contract-fixture");
    mkdirSync(taskPath, { recursive: true });
    writeFileSync(join(taskPath, "task.json"), `${JSON.stringify({
      schema_version: "1.0.0",
      task_id: "contract-fixture",
      project_name: "wiring-fixture",
      target_repo_root: root,
    }, null, 2)}\n`);
    writeFileSync(join(taskPath, "facts.jsonl"), "");
    const materialRoot = join(root, "material");
    mkdirSync(materialRoot);
    writeFileSync(join(materialRoot, "decision-log.md"), "# 决策日志\n\n## 级别与路线\n\n- 级别：complex\n");
    mkdirSync(join(materialRoot, "phases"));
    writeFileSync(join(materialRoot, "phases", "index.md"), "# Phase 索引\n");
    return { root, taskPath, materialRoot, head };
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

const FIXTURE = makeFixture();
after(() => rmSync(FIXTURE.root, { recursive: true, force: true }));

function runCli(args) {
  const result = spawnSync(NODE, [CLI, ...args], {
    cwd: ROOT, encoding: "utf8", timeout: 180_000, maxBuffer: 64 * 1024 * 1024,
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  return { status: result.status, signal: result.signal, stdout, stderr, output: `${stdout}\n${stderr}` };
}

const labelOf = row => `${row.stage} 第 ${row.step.step_id} 步（${row.step.step_slug}）`;

const readArgs = row => [
  `--stage=${row.stage}`,
  `--step=${row.step.step_id}`,
  `--read-step-skill=${row.file}#${row.anchor}`,
  `--task-path=${FIXTURE.taskPath}`,
  `--material-root=${FIXTURE.materialRoot}`,
  `--commit=${FIXTURE.head}`,
];

test("声明齐：四个技能文件存在，各自在阶段步骤表被 skill 声明，锚可跳转", () => {
  for (const file of SKILL_FILES) {
    assert.ok(existsSync(join(ROOT, file)), `声明齐：技能文件不存在 ${file}`);
  }
  const unusable = SKILL_STEPS.filter(row => {
    const ref = declaredSkill(row.step.skill);
    return !ref || !ref.file || !ref.anchor;
  });
  assert.deepEqual(unusable.map(labelOf), [],
    `声明齐：以下步骤的 skill 声明缺文件名或缺锚，等于没有可用位置：${unusable.map(labelOf).join("、")}`);

  for (const file of SKILL_FILES) {
    const rows = DECLARATIONS.filter(row => row.file === file);
    assert.ok(rows.length > 0, `声明齐：${file} 没有在任何阶段步骤表的 skill 字段里被声明`);
  }
  for (const row of DECLARATIONS) {
    if (!SKILL_FILES.includes(row.file)) continue;
    const body = readFileSync(join(ROOT, row.file), "utf8");
    const tag = `<a id="${row.anchor}"></a>`;
    assert.ok(body.includes(tag),
      `声明齐：${row.file} 找不到 ${tag}，${labelOf(row)} 声明的锚不可跳转`);
  }
});

test("证据形态合法：skill 步骤有 facts.jsonl#逻辑槽，test/review 不用裸目录，且不绑任务与归档", () => {
  const violations = [];
  for (const row of SKILL_STEPS) {
    const label = labelOf(row);
    const evidence = Array.isArray(row.step.completion_evidence) ? row.step.completion_evidence : [];
    if (!evidence.length) violations.push(`${label} 声明了 skill 但 completion_evidence 为空`);
    const slots = evidence.filter(entry => entry
      && entry.kind === "task_original_ref"
      && typeof entry.uri_or_path === "string"
      && /^facts\.jsonl#.+/.test(entry.uri_or_path));
    if (!slots.length) violations.push(`${label} 缺 kind=task_original_ref 且 uri_or_path 形如 facts.jsonl#… 的完成证据`);
    for (const entry of evidence) {
      const ref = entry?.uri_or_path;
      if (typeof ref !== "string" || !ref) continue;
      for (const [pattern, what] of TASK_BOUND_OR_ARCHIVED) {
        if (pattern.test(ref)) violations.push(`${label} 的 ${entry.kind} 出现${what}：${ref}`);
      }
      if (BARE_DIR_ONLY_FOR.has(entry.kind) && ref.endsWith("/")) {
        violations.push(`${label} 的 ${entry.kind} 以 / 结尾：${ref}（裸目录仅作导航，会让步骤永远判不了完成）`);
      }
    }
  }
  assert.deepEqual(violations, [],
    `证据形态：发现 ${violations.length} 处会让步骤永远判不了的声明：\n${violations.join("\n")}`);
});

test("公开入口能读到同一份技能：退出 0、正文 >2000 字节、sha256 等于当前文件字节", () => {
  for (const row of DECLARATIONS) {
    const label = labelOf(row);
    const result = runCli(readArgs(row));
    assert.equal(result.status, 0,
      `公开读取：${label} 读取 ${row.file}#${row.anchor} 退出码 ${result.status}${result.signal ? `（${result.signal}）` : ""}\n${clip(result.output)}`);
    let payload;
    try { payload = JSON.parse(result.stdout); }
    catch { assert.fail(`公开读取：${label} 的 stdout 不是 JSON 读取事件\n${clip(result.output)}`); }
    assert.equal(payload?.event?.stage, row.stage, `公开读取：${label} 返回事件的阶段不是 ${row.stage}`);
    assert.equal(payload?.event?.step, row.step.step_id, `公开读取：${label} 返回事件的步骤不是 ${row.step.step_id}`);
    assert.equal(payload?.event?.skill_path, row.file, `公开读取：${label} 返回事件的 skill_path 不是 ${row.file}`);
    const body = payload?.encoding === "base64"
      ? Buffer.from(payload?.body_base64 ?? "", "base64")
      : Buffer.from(payload?.body ?? "", "utf8");
    assert.ok(body.length > 2000,
      `公开读取：${label} 返回正文只有 ${body.length} 字节，未读到整份技能（要求 >2000）`);
    const digest = createHash("sha256").update(readFileSync(join(ROOT, row.file))).digest("hex");
    assert.equal(payload?.event?.sha256, digest,
      `公开读取：${label} 返回的 sha256 与 ${row.file} 当前字节不一致`);
  }
});

test("强制读取有效（负例）：不带 --current-read-receipt 时报告当前读取回执无效", () => {
  for (const row of DECLARATIONS) {
    const label = labelOf(row);
    const result = runCli([
      `--stage=${row.stage}`,
      `--step=${row.step.step_id}`,
      `--task-path=${FIXTURE.taskPath}`,
      `--material-root=${FIXTURE.materialRoot}`,
      `--commit=${FIXTURE.head}`,
    ]);
    assert.match(result.output, /当前读取回执无效|缺 --current-read-receipt/,
      `强制读取：${label} 缺当次读取回执时没有具名失败\n${clip(result.output)}`);
    assert.notEqual(result.status, 0,
      `强制读取：${label} 缺当次读取回执仍以退出码 0 放行\n${clip(result.output)}`);
  }
});

// P9/T058 新增三条：动态槽真实两态、阶段正文技能串、删索引后第 6 步不完成。
const STAGE_SKILL = {
  "make-decision": "skills/decision-maker/SKILL.md",
  "build-prd": "skills/task-maker/SKILL.md",
  "build-plan": "skills/phase-maker/SKILL.md",
  "build-code": "skills/run-phase/SKILL.md",
};

test("动态槽：写入一条质量证据后 present=true，删除该条后 present=false", () => {
  const factsPath = join(FIXTURE.taskPath, "facts.jsonl");
  const original = readFileSync(factsPath, "utf8");
  const stageRow = {
    record_kind: "stage", task_id: "contract-fixture", stage: "build-code", source: "four-skill-wiring fixture",
    created_at: new Date().toISOString(), review_origin: "not_run",
    review_result_ref: { value: null, reason: "no review result recorded" }, finding_dispositions: [],
    spec_analyze: { value: null, reason: "spec analysis not run" },
    evidence: { value: null, reason: "no executed command evidence" },
    serious_issue_disposition: { value: null, reason: "no serious issue disposition" },
    close_action: { value: null, reason: "this row carries no close action" },
    handoff: { value: null, reason: "no handoff recorded" },
    material_bytes: { value: null, reason: "no material size baseline recorded" },
  };
  const claimRef = "quality/evidence/steps/build-code-2.json";
  const claimPath = join(FIXTURE.taskPath, claimRef);
  mkdirSync(dirname(claimPath), { recursive: true });
  writeFileSync(claimPath, `${JSON.stringify({
    task_id: "contract-fixture", source: "workflows/build-code/steps.json", step_slug: "write-red-tests",
    commit: FIXTURE.head, reader: "four-skill-wiring fixture", inputs: ["RED capture"], observation: "read back",
    criteria_ref: "workflows/build-code/SKILL.md#方法", conclusion: "completed", limits: [],
  }, null, 2)}\n`);
  try {
    writeFileSync(factsPath, `${JSON.stringify(stageRow)}\n`);
    const record = spawnSync(NODE, [join(ROOT, "runtime/interface/record-step-evidence.mjs"),
      `--task-path=${FIXTURE.taskPath}`, "--stage=build-code", "--step=2",
      `--ref=${claimRef}`, "--command=sed -n '1,40p' quality/evidence/steps/build-code-2.json",
      "--exit-code=0", "--failure-signature=none", "--no-receipt",
      "--reader-action=打开并读回 build-code-2.json 的 RED 记录", "--reader-owner=four-skill-wiring fixture",
      `--commit=${FIXTURE.head}`, "--json"],
    { cwd: ROOT, encoding: "utf8", timeout: 180_000, maxBuffer: 16 * 1024 * 1024 });
    assert.equal(record.status, 0, `写入口没有写入质量证据：${clip(record.stdout)}\n${clip(record.stderr)}`);
    const args = ["--stage=build-code", "--step=2", "--json", `--task-path=${FIXTURE.taskPath}`,
      `--material-root=${FIXTURE.materialRoot}`, `--commit=${FIXTURE.head}`];
    const present = runCli(args);
    const presentJson = JSON.parse(present.stdout);
    const presentStep = presentJson?.stages?.find(item => item.stage === "build-code")?.steps?.find(item => item.step_id === 2);
    const presentSlot = (presentStep?.evidence ?? []).find(item => item.kind === "task_original" && item.ref === claimRef);
    assert.equal(presentSlot?.present, true,
      `写入后动态槽没有判 present=true：${JSON.stringify(presentStep?.evidence ?? [])}`);
    writeFileSync(factsPath, `${JSON.stringify(stageRow)}\n`);
    const removed = runCli(args);
    const removedStep = JSON.parse(removed.stdout)?.stages?.find(item => item.stage === "build-code")?.steps?.find(item => item.step_id === 2);
    const removedSlot = (removedStep?.evidence ?? []).find(item => item.kind === "task_original" && item.ref === claimRef);
    assert.notEqual(removedSlot?.present, true,
      `删除 facts 条目后动态槽仍判 present=true：${JSON.stringify(removedStep?.evidence ?? [])}`);
    assert.ok((removedStep?.evidence ?? []).every(item => !(item.ref === claimRef && item.present === true)),
      `删除 facts 条目后仍存在指向 ${claimRef} 的 present=true 条目`);
  } finally {
    writeFileSync(factsPath, original);
    rmSync(claimPath, { force: true });
  }
});

test("阶段正文含技能串：四份阶段 SKILL.md 的「方法」节点名对应技能文件", () => {
  for (const [stage, skill] of Object.entries(STAGE_SKILL)) {
    const body = readFileSync(join(ROOT, "workflows", stage, "SKILL.md"), "utf8");
    assert.ok(body.includes(skill),
      `workflows/${stage}/SKILL.md 正文没有点名 ${skill}：阶段正文与声明脱钩`);
  }
});

test("删 phases/index.md 后 build-plan 第 6 步不判完成并点名缺件", () => {
  const index = join(FIXTURE.materialRoot, "phases", "index.md");
  const moved = `${index}.wiring-broken`;
  renameSync(index, moved);
  try {
    const run = runCli(["--stage=build-plan", "--step=6", "--json", `--task-path=${FIXTURE.taskPath}`,
      `--material-root=${FIXTURE.materialRoot}`, `--commit=${FIXTURE.head}`]);
    const step = JSON.parse(run.stdout)?.stages?.find(item => item.stage === "build-plan")?.steps?.find(item => item.step_id === 6);
    assert.notEqual(step?.judgment, "已完成",
      `删索引后第 6 步仍判「已完成」：${JSON.stringify(step ?? null)}`);
    assert.match(String(step?.gap ?? ""), /phases\/index\.md|索引/,
      `第 6 步缺件没有点名 phases/index.md：${step?.gap ?? "（空）"}`);
  } finally {
    renameSync(moved, index);
  }
});

test("没有第二处声明：同一技能文件只在一个阶段被声明", () => {
  const stagesByFile = new Map();
  for (const row of DECLARATIONS) {
    const stages = stagesByFile.get(row.file) ?? new Set();
    stages.add(row.stage);
    stagesByFile.set(row.file, stages);
  }
  for (const [file, stages] of stagesByFile) {
    assert.ok(stages.size <= 1,
      `唯一声明：${file} 在 ${[...stages].join("、")} 多个阶段被声明，同一规则出现第二个家`);
  }
});
