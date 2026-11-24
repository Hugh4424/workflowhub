// ORACLE-PLAN-FIRST: P4「计划首卡能从公开入口实跑并说清缺件」的冻结契约。
//
// 只从真实公开入口、真实文件字节与真实 JSON 报告观察，不 import 任何内部函数：
//  - 首卡方法、模板与 build-plan 接线是文档字节；
//  - 计划步骤六的公开入口是 tools/cli/check-stage-steps.mjs 的真实子进程；
//  - 缺入口 / 缺供件证据的负控在 /private/tmp 隔离副本里做，真工作树只读。
//
// 覆盖（P4 卡「怎么验证？」146–228 行、decision-log 包 4、AC-QUAL-004/005/007/012/025）：
//  1. skills/phase-maker/SKILL.md 有首卡纵切、真供件、开工五列、未知半径与实现决策五项，
//     且锚 #八步 仍可跳转；
//  2. skills/spec-plan/templates/phase-template.md 保留「十八/十」与五列原字面，并新增
//     公开入口与读回内容（不删原有）；
//  3. workflows/build-plan/SKILL.md 把条件试跑接在读源后、大纲前，第六步顺序不变；
//     steps.json 第 6 步有试跑与首卡实际证据指针，且不再指向未来卡；
//  4. tools/cli/check-stage-steps.mjs 在计划步骤投影里对缺入口 / 缺供件证据各给具名失败，
//     并保持 P3 的六字段顺序；
//  5. 公开首卡入口真实可跑：输出出现 skills/phase-maker/SKILL.md#八步 与真实步骤名称；
//  6. 移去供件（当次读取回执）时具名指到第 6 步，步骤六不记完成；
//  7. docs/architecture/move-map.json 登记已有公开读口与首个真实消费者，没有第二探针；
//  8. P3 冻结测试的锚与声明仍在（只读断言，不重跑）。
//
// 本轮 RED 的目标是「首卡纵切、供件字段、模板入口/读回、计划试跑接线、checker 定位、
// move-map 登记」尚未实现，不是导入、语法或夹具错误。真实读取回执由验收阶段用现有
// captureCommand 产生；本文件不伪造回执，只断言「缺回执」的具名失败路径。
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = realpathSync(join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const NODE = process.execPath;
const CLI = join(ROOT, "tools/cli/check-stage-steps.mjs");
const MATERIAL_ROOT = process.env.WORKFLOWHUB_P4_MATERIAL_ROOT
  ? realpathSync(process.env.WORKFLOWHUB_P4_MATERIAL_ROOT)
  : join(ROOT, "specs/delivery-quality-plan-20261123");
const TASK_ROOT = process.env.WORKFLOWHUB_P4_TASK_ROOT
  ? realpathSync(process.env.WORKFLOWHUB_P4_TASK_ROOT)
  : "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-plan-20261123";
const TEMP_BASE = existsSync("/private/tmp") ? "/private/tmp" : undefined;
const SKILL_REF = "skills/phase-maker/SKILL.md#八步";
// 完成态词表取报告实际状态：judgment「已完成」与 state「completed」。
const COMPLETED_JUDGMENT = "已完成";
const COMPLETED_STATE = "completed";

const clip = value => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > 900 ? `${text.slice(0, 900)}…` : text;
};
const readText = ref => readFileSync(join(ROOT, ref), "utf8");
const parseJson = text => { try { return JSON.parse(text); } catch { return null; } };

// 从 .git 元数据读 HEAD，不跑 git；--commit 必须等于真实 HEAD 才能取卡。
function headFromGitFiles(start) {
  const dotgit = join(start, ".git");
  assert.ok(existsSync(dotgit), `提交身份不可读：${dotgit} 不存在（P4 公开入口需要真实 HEAD）`);
  let gitDir = dotgit;
  if (!statSync(dotgit).isDirectory()) {
    const match = /^gitdir:\s*(.+)$/m.exec(readFileSync(dotgit, "utf8"));
    assert.ok(match, `提交身份不可读：${dotgit} 不是目录也没有 gitdir 指针`);
    gitDir = isAbsolute(match[1]) ? match[1] : resolve(start, match[1].trim());
  }
  let common = gitDir;
  const commondir = join(gitDir, "commondir");
  if (existsSync(commondir)) common = resolve(gitDir, readFileSync(commondir, "utf8").trim());
  const head = readFileSync(join(gitDir, "HEAD"), "utf8").trim();
  if (!head.startsWith("ref:")) return head;
  const ref = head.slice(4).trim();
  for (const base of [gitDir, common]) {
    const loose = join(base, ref);
    if (existsSync(loose)) return readFileSync(loose, "utf8").trim();
  }
  const packed = join(common, "packed-refs");
  if (existsSync(packed)) {
    for (const line of readFileSync(packed, "utf8").split(/\r?\n/)) {
      const [sha, name] = line.trim().split(/\s+/);
      if (name === ref && /^[a-f0-9]{40,64}$/.test(sha)) return sha;
    }
  }
  return null;
}

function headingSlugs(heading) {
  const cleaned = heading
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s*\{#[^}]*\}\s*$/, "")
    .replace(/[*_~]/g, "")
    .trim()
    .toLowerCase();
  const slug = cleaned.replace(/\s+/g, "-").replace(/[^\p{L}\p{N}_-]/gu, "");
  return [...new Set([slug, slug.replace(/-+/g, "-").replace(/^-|-$/g, "")])];
}

function anchorProblem(text, anchor) {
  const escaped = String(anchor).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`<a\\s[^>]*\\b(?:id|name)\\s*=\\s*["']${escaped}["']`, "i").test(text)) return null;
  if (new RegExp(`\\{#${escaped}\\}`, "i").test(text)) return null;
  for (const line of text.split(/\r?\n/)) {
    const heading = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading && headingSlugs(heading[1]).includes(String(anchor).toLowerCase())) return null;
  }
  return `锚 #${anchor} 在该文件里没有可跳转目标（既无 <a id="${anchor}">，也无匹配标题或 {#id}）`;
}

function spawnCli(args) {
  const result = spawnSync(NODE, [CLI, ...args], {
    cwd: ROOT, encoding: "utf8", timeout: 180_000, maxBuffer: 32 * 1024 * 1024,
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  return { status: result.status, signal: result.signal, stdout, stderr, output: `${stdout}\n${stderr}` };
}

/** 具名失败只从报告的 errors 通道读；命令在出报告前抛出时退回完整输出。 */
function namedErrors(result) {
  const json = parseJson(result.stdout);
  const errors = Array.isArray(json?.errors) ? json.errors.filter(item => typeof item === "string" && item.trim()) : [];
  return errors.length ? errors.join("\n") : result.output;
}

function assertNamed(result, label, patterns) {
  const text = namedErrors(result);
  for (const [pattern, what] of patterns) {
    assert.match(text, pattern, `${label}：具名失败没有点名「${what}」\n真实错误：${clip(text)}`);
  }
}

function stepSixRow(result) {
  const json = parseJson(result.stdout);
  const report = json?.stages?.find(row => row.stage === "build-plan");
  return report?.steps?.find(row => row.step_id === 6) ?? null;
}
function stepSixJudgment(result) {
  return stepSixRow(result)?.judgment ?? null;
}
function stepSixState(result) {
  return stepSixRow(result)?.state ?? null;
}
/** 完成态由报告自己的状态词表判：judgment「已完成」或 state「completed」都算完成。 */
function assertStepSixNotCompleted(result, message) {
  assert.notEqual(stepSixJudgment(result), COMPLETED_JUDGMENT, `${message}（判定=${stepSixJudgment(result)}）`);
  assert.notEqual(stepSixState(result), COMPLETED_STATE, `${message}（状态=${stepSixState(result)}）`);
}

function stepArgs({ repoRoot = ROOT, taskPath = TASK_ROOT, receipt } = {}) {
  return ["--stage=build-plan", "--step=6", "--json", `--task-path=${taskPath}`,
    `--material-root=${MATERIAL_ROOT}`, `--repo-root=${repoRoot}`, `--commit=${HEAD}`,
    ...(receipt ? [`--current-read-receipt=${receipt}`] : [])];
}

const HEAD = headFromGitFiles(ROOT);
const STEPS = JSON.parse(readText("workflows/build-plan/steps.json"));
const STEP_SIX = STEPS.steps.find(step => step.step_id === 6);

test("装置输入可读：真任务根、材料根、CLI 与当前提交", () => {
  assert.ok(existsSync(join(TASK_ROOT, "task.json")),
    `真任务根不可读：${TASK_ROOT}（公开首卡协议依赖该任务库原件；可用 WORKFLOWHUB_P4_TASK_ROOT 指定）`);
  assert.ok(existsSync(join(MATERIAL_ROOT, "decision-log.md")),
    `材料根不可读：${MATERIAL_ROOT}（可用 WORKFLOWHUB_P4_MATERIAL_ROOT 指定）`);
  assert.ok(existsSync(CLI), `公开检查入口不存在：tools/cli/check-stage-steps.mjs`);
  assert.match(String(HEAD), /^[a-f0-9]{40,64}$/,
    `当前提交不可读：${HEAD}（P4 公开入口的 --commit 必须等于真实 HEAD）`);
  assert.ok(STEP_SIX, "workflows/build-plan/steps.json 不存在第 6 步：计划首卡入口失去真实步骤");
});

test("ORACLE-PLAN-FIRST 首卡方法：phase-maker 有首卡纵切、真供件、开工五列、未知半径与实现决策五项", () => {
  const ref = "skills/phase-maker/SKILL.md";
  const file = join(ROOT, ref);
  assert.ok(existsSync(file), `缺 ${ref}：P4 首卡方法文件不存在，步骤六的 ${SKILL_REF} 无处可跳`);
  const text = readFileSync(file, "utf8");
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, "");
  const jump = anchorProblem(text, "八步");
  assert.equal(jump, null, `${ref}：${jump}；步骤六声明的 ${SKILL_REF} 必须仍可跳转`);

  // 首卡纵切：没参与写卡的人是按第一张卡走真实公开入口，不是只看步骤路径。
  for (const token of ["首卡", "纵切"]) {
    assert.ok(body.includes(token),
      `${ref} 缺「${token}」：P4 要求首卡纵切成为作者可消费的契约（不是只留在阶段卡）`);
  }
  // 真供件：卡里写用途、期限、超时错误、来源，提供者实读、接收者复读。
  for (const token of ["供件", "用途", "期限", "超时", "来源", "提供者", "实读", "接收"]) {
    assert.ok(body.includes(token),
      `${ref} 缺「${token}」：P4 真供件要求写清用途、期限、超时错误、来源与提供者/接收者实读`);
  }
  // 开工五列按卡原字面与顺序。
  const columns = ["命令", "期望", "证据", "机器或人判", "负责人"];
  let cursor = -1;
  for (const column of columns) {
    const at = body.indexOf(column, cursor + 1);
    assert.ok(at > cursor,
      `${ref} 缺开工五列「${column}」或顺序不对：P4 要求命令、期望、证据、机器或人判、负责人五列可从开工口读到`);
    cursor = at;
  }
  // 未知半径：开工前必须留下未知影响、退回谁、哪张卡和哪条验收。
  assert.match(body, /未知(?:半径|影响)/,
    `${ref} 缺「未知半径」：P4 要求写清未知影响、退回人、卡和验收，不现场猜值`);
  // 实现决策五项：规则归属、合法状态、默认出处、封装边界、失败退路。
  const decisions = [
    [/规则归属/, "规则归属"],
    [/合法状态/, "合法状态"],
    [/默认(?:出处|依据|来源)/, "默认出处"],
    [/封装/, "封装边界"],
    [/退路/, "失败退路"],
  ];
  for (const [pattern, label] of decisions) {
    assert.match(body, pattern,
      `${ref} 缺实现决策五项中的「${label}」：P4 要求首卡开工前交齐规则归属、合法状态、默认出处、封装边界与失败退路`);
  }
});

test("ORACLE-PLAN-FIRST 模板保原字面：phase-template 仍保十八/十与五列，并新增公开入口与读回", () => {
  const ref = "skills/spec-plan/templates/phase-template.md";
  const text = readText(ref);
  assert.ok(text.includes("五列固定为命令、期望、证据、机器或人判、负责人"),
    `${ref} 的五列原字面被改：必须保留「五列固定为命令、期望、证据、机器或人判、负责人」`);
  assert.match(text, /18\s*个卡内字段/,
    `${ref} 的「18 个卡内字段」原字面被改：P4 要求保十八项原字面，新增内容进原位置`);
  assert.match(text, /10\s*个机器字段/,
    `${ref} 的「10 个机器字段」原字面被改：P4 要求保文件十项原字面`);
  for (const field of ["全局规格", "写入集", "依赖", "消费者", "gate_cmd", "oracle",
    "evidence_path", "STOP", "覆盖 AC", "Done"]) {
    assert.ok(text.includes(field), `${ref} 缺文件级机器字段「${field}」：保十项原字面不能删原有字段`);
  }

  assert.ok(text.includes("首卡"),
    `${ref} 缺「首卡」：P4 要求只在现位置添加入口与读回内容，让作者写到第一张卡`);
  const start = text.indexOf("### 开工就绪表");
  assert.ok(start >= 0, `${ref} 缺「### 开工就绪表」：入口与读回内容没有可添加的现位置`);
  const end = text.indexOf("\n## ", start + 1);
  const section = text.slice(start, end < 0 ? text.length : end);
  assert.ok(section.includes("公开入口"),
    `${ref} 的「开工就绪表」缺「公开入口」：P4 要求首卡能被未参与写卡的人按真实公开入口走`);
  assert.ok(section.includes("读回"),
    `${ref} 的「开工就绪表」缺「读回」：P4 要求开工五列与结论能从开工口读回`);
});

test("ORACLE-PLAN-FIRST 计划接线：条件试跑在读源后、大纲前，第 6 步有试跑与首卡证据指针", () => {
  const ref = "workflows/build-plan/SKILL.md";
  const text = readText(ref);
  const trial = /条件(?:触发)?试跑/.exec(text);
  assert.ok(trial,
    `${ref} 缺「条件试跑」：P4 要求试跑只在可改变方案时触发，记录发生在读源后、大纲前，不触发写理由`);
  const window = text.slice(trial.index, trial.index + 900);
  for (const token of ["读源", "大纲", "不触发", "理由"]) {
    assert.ok(window.includes(token),
      `${ref} 的条件试跑段缺「${token}」：必须写清读源后、大纲前触发，不触发写理由，不事后补作当时`);
  }
  const readSource = text.indexOf('<a id="step-read-current-materials"></a>');
  const outline = text.indexOf("先出阶段大纲");
  assert.ok(readSource >= 0, `${ref} 缺读源入口锚 step-read-current-materials：试跑时序失去「读源后」定位`);
  assert.ok(outline > readSource, `${ref} 找不到阶段大纲段（「先出阶段大纲」）：试跑时序失去「大纲前」定位`);
  assert.ok(trial.index > readSource,
    `${ref} 的条件试跑写在读源之前：P4 要求发生在读源后、大纲前，不事后补作当时`);
  assert.ok(trial.index < outline,
    `${ref} 的条件试跑写在大纲之后：P4 要求试跑发生在大纲前，第 6 步顺序仍按现有草稿`);

  const order = [
    '<a id="step-spec-plan"></a>',
    "保存 Phase 草稿沿现公开 `run --action=draft`",
    "先写具名 Phase，再生成索引",
    '<a id="step-testing-system-blueprint"></a>',
  ];
  let cursor = -1;
  for (const token of order) {
    const at = text.indexOf(token);
    assert.ok(at > cursor, `${ref} 第六步现有草稿顺序被改：找不到或错序「${token}」`);
    cursor = at;
  }

  const stepsRef = "workflows/build-plan/steps.json";
  assert.ok(STEP_SIX, `${stepsRef} 不存在第 6 步（spec-plan）`);
  const observable = String(STEP_SIX.observable_result ?? "");
  assert.ok(observable.includes("试跑"),
    `${stepsRef} 第 6 步 observable_result 缺「试跑」：P4 要求计划步骤声明试跑`);
  assert.ok(observable.includes("首卡"),
    `${stepsRef} 第 6 步 observable_result 缺「首卡」：P4 要求计划步骤声明首卡实际效果`);
  const pointer = (Array.isArray(STEP_SIX.completion_evidence) ? STEP_SIX.completion_evidence : [])
    .find(entry => typeof entry?.uri_or_path === "string" && /(?:first|p04|首卡|phase-maker)/i.test(entry.uri_or_path));
  assert.ok(pointer,
    `${stepsRef} 第 6 步缺首卡实际证据指针：completion_evidence 只有 facts.jsonl；` +
    "P4 要求补试跑与首卡实际证据指针（如 quality/evidence/inputs/p04-first-card-skill-read.json）");
  assert.ok(!/未来卡|等上卡/.test(JSON.stringify(STEP_SIX)),
    `${stepsRef} 第 6 步仍含早期未来引用（未来卡/等上卡）：P4 要求移除，不把未来卡当可执行依赖`);
});

test("ORACLE-PLAN-FIRST 检查器：计划步骤投影对缺入口与缺供件证据给具名失败，并保持 P3 六字段顺序", () => {
  const source = readText("tools/cli/check-stage-steps.mjs");
  assert.match(source, /指定步骤缺少 skill 声明/,
    "tools/cli/check-stage-steps.mjs 缺「缺入口」具名失败通道：P4 要求缺入口可定位到计划步骤投影");
  assert.match(source, /本次调用缺 --current-read-receipt/,
    "tools/cli/check-stage-steps.mjs 缺「缺当次回执」具名失败通道：P4 要求缺供件证据可定位");
  assert.match(source, /缺当次技能读取不能支持本步完成/,
    "tools/cli/check-stage-steps.mjs 缺「缺供件证据不能记完成」句：P4 要求步骤六不记完成");

  assert.ok(TEMP_BASE, "缺入口负控需要 /private/tmp 隔离副本");
  const dir = mkdtempSync(join(TEMP_BASE, "p4-plan-first-card-"));
  try {
    const repo = join(dir, "repo");
    mkdirSync(join(repo, "workflows/build-plan"), { recursive: true });
    const manifest = JSON.parse(readText("workflows/build-plan/steps.json"));
    const step = manifest.steps.find(item => item.step_id === 6);
    assert.ok(step, "隔离副本 workflows/build-plan/steps.json 不存在第 6 步");
    delete step.skill;
    writeFileSync(join(repo, "workflows/build-plan/steps.json"), `${JSON.stringify(manifest, null, 2)}\n`);

    const missingEntry = spawnCli(stepArgs({ repoRoot: repo }));
    assertNamed(missingEntry, "计划步骤六缺入口", [
      [/指定步骤缺少 skill 声明/, "指定步骤缺少 skill 声明"],
      [/build-plan/, "阶段 build-plan"],
      [/第\s*6\s*步/, "步骤 6"],
      [new RegExp(SKILL_REF.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `期望的真实入口 ${SKILL_REF}`],
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  const missingReceipt = spawnCli(stepArgs());
  assertNamed(missingReceipt, "计划步骤六缺供件证据", [
    [/本次调用缺 --current-read-receipt/, "缺当次读取回执"],
    [/build-plan 第 6 步/, "计划第 6 步"],
  ]);
  const json = parseJson(missingReceipt.stdout);
  assert.equal(json?.skill_binding?.ok, false,
    "缺当次回执时 skill_binding.ok 仍为 true：P4 要求缺供件证据不能记本步完成");
  assertStepSixNotCompleted(missingReceipt,
    "缺当次回执时第 6 步仍记为完成：P4 要求步骤六不记完成");

  // P3 的六字段顺序：现有读取动作仍返回 stage/step/skill_path/sha256/bytes/at。
  const read = spawnCli([`--read-step-skill=${SKILL_REF}`, "--stage=build-plan", "--step=6",
    `--task-path=${TASK_ROOT}`, `--material-root=${MATERIAL_ROOT}`, `--commit=${HEAD}`]);
  assert.equal(read.status, 0,
    `P3 读取动作回归：${SKILL_REF} 读取失败（退出 ${read.status}）\n真实输出：${clip(read.output)}`);
  const payload = parseJson(read.stdout);
  assert.ok(payload?.event, `P3 读取动作没有返回固定六字段事件：${clip(read.stdout)}`);
  assert.deepEqual(Object.keys(payload.event),
    ["stage", "step", "skill_path", "sha256", "bytes", "at"],
    `P3 读取事件的字段顺序被改：${JSON.stringify(Object.keys(payload.event))}；` +
    "P4 要求保持 P3 的字段顺序与既有行为");
  assert.equal(payload.event.skill_path, "skills/phase-maker/SKILL.md",
    `P3 读取事件技能路径是 ${payload.event.skill_path}，不是计划第 6 步声明的 skills/phase-maker/SKILL.md`);
});

test("ORACLE-PLAN-FIRST 公开首卡：真实 CLI 输出首个读取指针与真实步骤名称", () => {
  const run = spawnCli(["--stage=build-plan", "--step=6", "--card", "--json",
    `--task-path=${TASK_ROOT}`, `--material-root=${MATERIAL_ROOT}`, `--repo-root=${ROOT}`,
    `--commit=${HEAD}`]);
  assert.equal(run.status, 0,
    `公开计划首卡入口退出 ${run.status}：${clip(run.output)}\n` +
    "P4 要求未参与写卡的人能按第一张卡走真实公开入口");
  const json = parseJson(run.stdout);
  assert.ok(json?.card, `公开计划首卡入口没有返回 card JSON：${clip(run.output)}`);
  const paths = Array.isArray(json.card.paths) ? json.card.paths : [];
  assert.ok(paths.includes(SKILL_REF),
    `公开首卡输出缺首个读取指针 ${SKILL_REF}；card.paths=${JSON.stringify(paths)}。` +
    "P4 要求读者从真实入口看到该方法，而不是只看步骤路径");
  const declared = typeof STEP_SIX.skill === "string"
    ? STEP_SIX.skill
    : `${STEP_SIX.skill?.file ?? ""}#${STEP_SIX.skill?.anchor ?? ""}`;
  assert.equal(declared, SKILL_REF,
    `workflows/build-plan/steps.json 第 6 步的 skill 声明是 ${declared || "（空）"}，P4 要求 ${SKILL_REF}`);
  assert.equal(json.card.step_slug, STEP_SIX.step_slug,
    `公开首卡输出的步骤名称 ${json.card.step_slug} 与 steps.json 第 6 步 ${STEP_SIX.step_slug} 不符`);
  assert.equal(json.card.step_slug, "spec-plan",
    `公开首卡输出的真实步骤名称是 ${json.card.step_slug}，不是计划第 6 步的真实名称 spec-plan`);
  assert.ok(run.stdout.includes("spec-plan"),
    `公开首卡原始输出没有真实步骤名称 spec-plan：${clip(run.stdout)}`);
  assert.ok(run.stdout.includes(SKILL_REF),
    `公开首卡原始输出没有首个读取指针 ${SKILL_REF}：${clip(run.stdout)}`);
  const baseline = json.card.reading_baseline;
  assert.equal(baseline?.complete, true,
    `公开首卡 reading_baseline 不完整：${JSON.stringify(baseline?.paths ?? [])}；` +
    "P4 要求读者读到的指针是真实可读原件，不是仅名字");
  const observed = (baseline?.paths ?? []).find(item => item?.ref === SKILL_REF);
  assert.ok(observed?.observed === true,
    `公开首卡没有实际读到 ${SKILL_REF}：${JSON.stringify(observed ?? null)}`);
});

test("ORACLE-PLAN-FIRST 负控：移去当次读取回执 → 具名指到第 6 步，步骤六不记完成", t => {
  assert.ok(TEMP_BASE, "缺供件负控需要 /private/tmp 隔离任务根");
  const store = mkdtempSync(join(TEMP_BASE, "p4-first-card-task-"));
  // 任务根路径必须与 task.json 的 project/task 身份一致，避免把存储路径错误当目标失败。
  const taskPath = join(store, "Projects", "workflowhub", "tasks", "delivery-quality-plan-20261123");
  try {
    mkdirSync(join(taskPath, "quality", "tests"), { recursive: true });
    writeFileSync(join(taskPath, "task.json"), readFileSync(join(TASK_ROOT, "task.json")));
    writeFileSync(join(taskPath, "facts.jsonl"), "");

    const missingFile = "quality/tests/p4-missing-receipt.json";
    const missing = spawnCli(stepArgs({ taskPath, receipt: missingFile }));
    assertNamed(missing, "移去当次回执", [
      [/当前读取回执不可读/, "回执不可读"],
      [/p4-missing-receipt\.json/, `缺失的回执路径 ${missingFile}`],
      [/build-plan 第 6 步/, "计划第 6 步"],
    ]);
    assertStepSixNotCompleted(missing,
      "移去当次回执后第 6 步仍记为完成：P4 要求缺件只让关联调用失败并指到首个失效步骤");

    // 只去掉回执参数（不删技能、步骤声明或源字节）：必须点名缺当次回执，且不假定工具必须非零。
    const dropped = spawnCli(stepArgs({ taskPath }));
    assertNamed(dropped, "去掉 --current-read-receipt 供件", [
      [/本次调用缺 --current-read-receipt/, "缺 --current-read-receipt"],
      [/缺当次技能读取不能支持本步完成/, "缺当次技能读取不能支持本步完成"],
      [/build-plan 第 6 步/, "计划第 6 步"],
    ]);
    assertStepSixNotCompleted(dropped,
      "去掉回执参数后第 6 步仍记为完成：P4 要求步骤六不能记完成");

    // 回执存在但与当次声明不匹配：仍须点名第 6 步和不匹配的锚，不退成笼统失败。
    const wrongAnchor = "p4-no-such-anchor";
    const receipt = {
      cwd: ROOT,
      argv: [NODE, "tools/cli/check-stage-steps.mjs",
        `--read-step-skill=skills/phase-maker/SKILL.md#${wrongAnchor}`,
        "--stage=build-plan", "--step=6", `--task-path=${taskPath}`,
        `--material-root=${MATERIAL_ROOT}`, `--commit=${HEAD}`],
      exit_code: 0,
      started_at: "2026-11-24T00:00:00.000Z",
      ended_at: "2026-11-24T00:00:01.000Z",
      output_ref: "quality/tests/p4-wrong-receipt.output",
    };
    writeFileSync(join(taskPath, "quality/tests/p4-wrong-receipt.json"),
      `${JSON.stringify(receipt, null, 2)}\n`);
    const mismatched = spawnCli(stepArgs({ taskPath, receipt: "quality/tests/p4-wrong-receipt.json" }));
    assertNamed(mismatched, "回执与当次声明不匹配", [
      [/当前读取回执无效|回执/, "读取回执"],
      [new RegExp(wrongAnchor), `不匹配的锚 ${wrongAnchor}`],
      [/build-plan 第 6 步/, "计划第 6 步"],
    ]);
    assertStepSixNotCompleted(mismatched,
      "回执不匹配后第 6 步仍记为完成：P4 要求只退受影响步骤，不把错误回执当有效供件");

    // 真实合法回执由验收阶段用现有 captureCommand 产生；本测试不伪造回执冒充通过。
    t.diagnostic("合法回执的正向读取由 P4 验收阶段用现有 captureCommand 补；本冻结测试只证缺件路径。");
  } finally {
    rmSync(store, { recursive: true, force: true });
  }
});

test("ORACLE-PLAN-FIRST move-map：登记已有公开读口与首个真实消费者，没有第二探针", () => {
  const ref = "docs/architecture/move-map.json";
  assert.ok(existsSync(join(ROOT, ref)), `缺 ${ref}：P4 要求登记公开读口与首个真实消费者`);
  const map = JSON.parse(readText(ref));
  const entries = Array.isArray(map.entries) ? map.entries : [];
  const checkers = entries.filter(entry => entry?.source === "tools/cli/check-stage-steps.mjs");
  assert.equal(checkers.length, 1,
    `${ref} 对 tools/cli/check-stage-steps.mjs 登记了 ${checkers.length} 条：P4 要求复用唯一已有公开读口，不另建第二探针`);
  const face = JSON.stringify(checkers[0]);
  for (const [pattern, what] of [
    [/首卡|第一张卡/, "首卡公开读口"],
    [/phase-maker/, "phase-maker 方法消费者"],
    [/公开(?:读口|入口)/, "公开读口/入口"],
  ]) {
    assert.match(face, pattern,
      `${ref} 的 check-stage-steps 登记缺「${what}」：P4 要求说明已有公开读口与首个真实消费者，防建立第二探针`);
  }
  const probes = entries.filter(entry => {
    const dest = String(entry?.destination ?? entry?.source ?? "");
    if (!/\.(?:mjs|js|sh)$/.test(dest) || /\.test\./.test(dest)) return false;
    return /first[-_]?card|plan[-_]?probe|second[-_]?probe/i.test(dest);
  });
  assert.deepEqual(probes.map(entry => entry.destination ?? entry.source), [],
    `${ref} 新增了第二探针入口：${JSON.stringify(probes.map(entry => entry.destination ?? entry.source))}；` +
    "P4 要求复用现有公开读口，不建第二个检查入口");
});

test("ORACLE-PLAN-FIRST 不回归：P3 冻结测试的锚与声明仍在", () => {
  const ref = "tests/contract/skill-usage-negative.test.mjs";
  assert.ok(existsSync(join(ROOT, ref)), `缺 ${ref}：P4 要求 P3 冻结测试保留，不破坏其既有行为`);
  const text = readText(ref);
  assert.match(text, /ORACLE-SKILL-USE/,
    `${ref} 缺 ORACLE-SKILL-USE 标识：P3 的冻结判定器被改`);
  assert.match(text, /skills\/phase-maker\/SKILL\.md/,
    `${ref} 缺 phase-maker 技能文件声明：P3 的指定步骤声明被删`);
  assert.match(text, /anchor:\s*"八步"/,
    `${ref} 缺 build-plan 第 6 步 anchor: "八步"：P3 的锚声明被改`);
  assert.match(text, /current-read-receipt/,
    `${ref} 缺读取回执声明：P3 的缺供件负控被删`);
  assert.match(text, /缺当次回执/,
    `${ref} 缺「缺当次回执」负控：P3 的具名失败断言被删`);
  assert.match(text, /p3-skill-read\.json/,
    `${ref} 缺合法回执正控：P3 的正向读取回执被删`);
});
