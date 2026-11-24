/**
 * P3 冻结契约测试：双路原件可归并且必用方法真的被读取（ORACLE-SKILL-USE）。
 *
 * 只从真实 CLI 入口观察：不 import 任何内部函数，不读私有实现细节。
 * 交付前必须 RED；目标不是语法/装置失败，而是下面这些声明、技能文件、锚和
 * 读取回执尚未实现。
 *
 * 机器契约（实现者逐字满足；失败信息会点名阶段、步骤、缺的文件或锚）：
 *
 * A. 指定步骤的步骤表声明（`workflows/<stage>/steps.json` 的该步对象）必须有一个
 *    `skill` 字段，值为下列二选一：
 *      - 字符串 `"skills/<name>/SKILL.md#<anchor>"`；或
 *      - 对象 `{ "file": "skills/<name>/SKILL.md", "anchor": "<anchor>" }`
 *        （`path` + `anchor` 同义）。缺失、空值或仍指向阶段默认
 *        （`workflows/<stage>/SKILL.md#<method_anchor>`）都不算声明。
 *    「指定步骤」= make-decision 9、build-prd 4、build-plan 6、build-code 2–9，
 *    目标文件与锚见 P3 卡第 166–178 行表格（下方 DESIGNATED 逐行抄录）：
 *      make-decision 9 → skills/decision-maker/SKILL.md#package-convergence
 *      build-prd 4     → skills/task-maker/SKILL.md#expand-task-section
 *      build-plan 6    → skills/phase-maker/SKILL.md#八步
 *      build-code 2–9  → skills/run-phase/SKILL.md#step-<该步 slug>
 * B. 卡的投影必须给出该声明，不得回退阶段默认：`node tools/cli/check-stage-steps.mjs
 *    --stage=<S> --step=<N> --card --json ...` 的 `card` 必须暴露这条
 *    `skills/<name>/SKILL.md#<anchor>`——`card.paths` 含该串，或 `card.skill`
 *    给出同一文件与锚。声明文件必须真实存在；锚必须真的能跳转（`<a id="…">`、
 *    `{#…}` 或标题锚实际匹配）。取卡不要求 `--current-read-receipt`。
 * C. 三种单变量破坏各走一次真实 CLI，必须非零退出且具名，不能回退默认：
 *    1) 只去掉该步的 `skill` 声明；
 *    2) 声明一个不存在的技能文件（必须点名该文件）；
 *    3) 声明该文件里不存在的锚（必须点名该文件与锚）。
 *    破坏在 `/private/tmp` 的隔离副本里改，CLI 用 `--repo-root=<副本>`；
 *    真工作树不动。
 * D. 读取标记：指定步骤的步骤检查命令
 *    （`--stage --step --json ... --current-read-receipt=<R>`）缺当次回执或回执与
 *    当前声明不匹配时必须非零退出并点名；给当前声明的真实读取回执时退出 0。
 * E. 其它可查项（P3 卡第 194–198 行与验收 AC-QUAL-003/016/017）：
 *    review-protocol.md 的五个设计角色、独立输入与同根归并、四个全文范围；
 *    三个新技能的 skill-bundle.json 存在且 resources 列全、路径真实；
 *    catalog.yaml 与四个 skill-deps.yaml 的真实登记；
 *    unit-kernel 与四个入口「入口版本」逐字同版（并已从 v1.0.0 升版：内核正文
 *    自己声明该内容增量要随四入口同批升版，P2 留下的缺口由 P3 收）；
 *    `node tools/cli/build-skill-manifests.mjs --check` 退出 0。
 *
 * 只读真实工作树；破坏只发生在 /private/tmp 的隔离副本（用完保留，不删真件）。
 */
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = realpathSync(join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const NODE = process.execPath;
const CLI = join(ROOT, "tools/cli/check-stage-steps.mjs");
const MATERIAL_ROOT = process.env.WORKFLOWHUB_P3_MATERIAL_ROOT
  ? realpathSync(process.env.WORKFLOWHUB_P3_MATERIAL_ROOT)
  : join(ROOT, "specs/delivery-quality-plan-20261123");
const TASK_ROOT = process.env.WORKFLOWHUB_P3_TASK_ROOT
  ? realpathSync(process.env.WORKFLOWHUB_P3_TASK_ROOT)
  : "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-plan-20261123";
const TEMP_BASE = existsSync("/private/tmp") ? "/private/tmp" : undefined;

// P3 卡第 166–178 行：真实步骤入口 → 声明的文件及目标锚。
const DESIGNATED = [
  { stage: "make-decision", step: 9, slug: "module-convergence", file: "skills/decision-maker/SKILL.md", anchor: "package-convergence" },
  { stage: "build-prd", step: 4, slug: "expand-single-prd", file: "skills/task-maker/SKILL.md", anchor: "expand-task-section" },
  { stage: "build-plan", step: 6, slug: "spec-plan", file: "skills/phase-maker/SKILL.md", anchor: "八步" },
  { stage: "build-code", step: 2, slug: "write-red-tests", file: "skills/run-phase/SKILL.md", anchor: "step-write-red-tests" },
  { stage: "build-code", step: 3, slug: "implement-change", file: "skills/run-phase/SKILL.md", anchor: "step-implement-change" },
  { stage: "build-code", step: 4, slug: "inspect-and-route-actual-tests", file: "skills/run-phase/SKILL.md", anchor: "step-inspect-and-route-actual-tests" },
  { stage: "build-code", step: 5, slug: "run-tests", file: "skills/run-phase/SKILL.md", anchor: "step-run-tests" },
  { stage: "build-code", step: 6, slug: "inspect-acceptance-and-ui", file: "skills/run-phase/SKILL.md", anchor: "step-inspect-acceptance-and-ui" },
  { stage: "build-code", step: 7, slug: "scan-diff", file: "skills/run-phase/SKILL.md", anchor: "step-scan-diff" },
  { stage: "build-code", step: 8, slug: "review-change", file: "skills/run-phase/SKILL.md", anchor: "step-review-change" },
  { stage: "build-code", step: 9, slug: "analyze-review-findings", file: "skills/run-phase/SKILL.md", anchor: "step-analyze-review-findings" },
];
const NEW_SKILLS = ["task-maker", "phase-maker", "run-phase"];
const NEW_SKILL_CONSUMER = { "task-maker": "build-prd", "phase-maker": "build-plan", "run-phase": "build-code" };
const NEW_SKILL_BUNDLES = NEW_SKILLS.map(name => `skills/${name}/skill-bundle.json`);

const strip = value => String(value ?? "").trim();
const clip = value => {
  const text = strip(value).replace(/\s+/g, " ");
  return text.length > 600 ? `${text.slice(0, 600)}…` : text;
};
const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const readText = ref => readFileSync(join(ROOT, ref), "utf8");

function headCommit() {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function spawnNode(script, args) {
  const result = spawnSync(NODE, [script, ...args], { cwd: ROOT, encoding: "utf8", timeout: 180_000, maxBuffer: 32 * 1024 * 1024 });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  return { status: result.status, signal: result.signal, stdout, stderr, output: `${stdout}\n${stderr}` };
}

function runCli(args) {
  return spawnNode(CLI, args);
}

function parseJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function parseSkillRef(raw) {
  if (typeof raw === "string") {
    const value = raw.trim();
    const at = value.indexOf("#");
    if (at < 0) return value ? { file: value, anchor: null } : null;
    return { file: value.slice(0, at), anchor: value.slice(at + 1) || null };
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const file = strip(raw.file ?? raw.path ?? raw.skill_file ?? raw.skill);
    const anchor = strip(raw.anchor ?? raw.section);
    if (!file) return null;
    return { file, anchor: anchor || null };
  }
  return null;
}

/** 步骤表里该步的 `skill` 声明；没有声明返回 null（不拿 method_anchor 冒充）。 */
function stepSkillDeclaration(stage, stepId, repoRoot = ROOT) {
  const manifestPath = join(repoRoot, "workflows", stage, "steps.json");
  assert.ok(existsSync(manifestPath), `缺步骤表：workflows/${stage}/steps.json`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const step = (manifest.steps ?? []).find(item => item.step_id === stepId);
  assert.ok(step, `workflows/${stage}/steps.json 不存在第 ${stepId} 步`);
  return parseSkillRef(step.skill);
}

/** 卡里声明的技能位置：card.skill 或 card.paths 中带 # 的项。 */
function cardSkillRefs(card) {
  const refs = [];
  const skill = card?.skill;
  if (typeof skill === "string") refs.push(skill.trim());
  else if (skill && typeof skill === "object" && !Array.isArray(skill)) {
    const parsed = parseSkillRef(skill);
    if (parsed?.file) refs.push(parsed.anchor ? `${parsed.file}#${parsed.anchor}` : parsed.file);
  }
  for (const value of Array.isArray(card?.paths) ? card.paths : []) {
    if (typeof value === "string" && value.includes("#")) refs.push(value.trim());
  }
  return refs;
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

/** 锚是否真的能在正文里跳转：显式 <a id/name>、{#id} 或标题锚实际匹配。 */
function anchorProblem(text, anchor) {
  const escaped = escapeRegExp(anchor);
  if (new RegExp(`<a\\s[^>]*\\b(?:id|name)\\s*=\\s*["']${escaped}["']`, "i").test(text)) return null;
  if (new RegExp(`\\{#${escaped}\\}`, "i").test(text)) return null;
  for (const line of text.split(/\r?\n/)) {
    const heading = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading && headingSlugs(heading[1]).includes(anchor.toLowerCase())) return null;
  }
  return `锚 #${anchor} 在该文件里没有可跳转目标（既无 <a id="${anchor}">，也无匹配标题）`;
}

const HEAD = headCommit();
const commitArgs = () => [`--commit=${HEAD}`];

function cardArgs({ stage, step, repoRoot = ROOT, taskPath = TASK_ROOT }) {
  return [`--stage=${stage}`, `--step=${step}`, "--card", "--json", `--task-path=${taskPath}`,
    `--material-root=${MATERIAL_ROOT}`, `--repo-root=${repoRoot}`, ...commitArgs()];
}

function stepArgs({ stage, step, repoRoot = ROOT, taskPath = TASK_ROOT, receipt }) {
  return [`--stage=${stage}`, `--step=${step}`, "--json", `--task-path=${taskPath}`,
    `--material-root=${MATERIAL_ROOT}`, `--repo-root=${repoRoot}`, ...commitArgs(),
    ...(receipt ? [`--current-read-receipt=${receipt}`] : [])];
}

/** 首选 JSON 报告的 errors（具名失败通道）；命令在出报告前抛错时退回完整输出。 */
function namedText(result) {
  const json = parseJson(result.stdout);
  if (json && Array.isArray(json.errors) && json.errors.some(item => typeof item === "string" && item.trim())) {
    return json.errors.filter(item => typeof item === "string").join("\n");
  }
  return result.output;
}

function assertNamedFailure(result, label, patterns) {
  assert.notEqual(result.status, 0,
    `${label}：期望非零退出（具名失败），实际退出 ${result.status}\n真实输出：${clip(result.output)}`);
  const text = namedText(result);
  for (const [pattern, what] of patterns) {
    assert.match(text, pattern,
      `${label}：失败信息没有点名「${what}」\n具名输出：${clip(text)}`);
  }
}

function assertNoStageFallback(result, stage, methodAnchorFallback, label) {
  const json = parseJson(result.stdout);
  if (!json?.card) return;
  const refs = cardSkillRefs(json.card);
  const fallback = `${`workflows/${stage}/SKILL.md`}#${methodAnchorFallback}`;
  assert.ok(!refs.includes(fallback),
    `${label}：声明已破坏却仍回退阶段默认 ${fallback}，卡路径=${refs.join(" | ") || "（空）"}`);
}

function assertDeclarationShape(entry) {
  const declared = stepSkillDeclaration(entry.stage, entry.step);
  assert.ok(declared && declared.file,
    `${entry.stage} 第 ${entry.step} 步（${entry.slug}）缺 skill 声明：steps.json 该步没有 skill 字段；` +
    `期望 ${entry.file}#${entry.anchor}，不允许回退阶段默认 workflows/${entry.stage}/SKILL.md`);
  const actual = declared.anchor ? `${declared.file}#${declared.anchor}` : declared.file;
  const expected = `${entry.file}#${entry.anchor}`;
  assert.equal(actual, expected,
    `${entry.stage} 第 ${entry.step} 步（${entry.slug}）的 skill 声明是 ${actual}，P3 卡要求 ${expected}`);
}

function isolatedRepoCopy() {
  assert.ok(TEMP_BASE, "隔离副本需要 /private/tmp");
  const dir = mkdtempSync(join(TEMP_BASE, "p3-skill-usage-"));
  const repo = join(dir, "repo");
  mkdirSync(repo);
  for (const name of ["workflows", "skills"]) {
    cpSync(join(ROOT, name), join(repo, name), { recursive: true });
  }
  const stepsPath = join(repo, "workflows/build-plan/steps.json");
  return { dir, repo, stepsPath, pristine: readFileSync(stepsPath, "utf8") };
}

function replaceDesignatedSkill(repo, stage, stepId, mutate) {
  const path = join(repo, "workflows", stage, "steps.json");
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  const step = (manifest.steps ?? []).find(item => item.step_id === stepId);
  assert.ok(step, `隔离副本 workflows/${stage}/steps.json 不存在第 ${stepId} 步`);
  mutate(step);
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

let isolated = null;
test("装置输入可读：真任务根、材料根与当前提交", () => {
  assert.ok(existsSync(join(TASK_ROOT, "task.json")),
    `真任务根不可读：${TASK_ROOT}（P3 真实验证依赖该任务库原件；可用 WORKFLOWHUB_P3_TASK_ROOT 指定）`);
  assert.ok(existsSync(join(MATERIAL_ROOT, "decision-log.md")),
    `材料根不可读：${MATERIAL_ROOT}（可用 WORKFLOWHUB_P3_MATERIAL_ROOT 指定）`);
  assert.match(HEAD, /^[a-f0-9]{40,64}$/, `当前提交不可读：${HEAD}`);
});

test("ORACLE-SKILL-USE 正向：每个指定步骤声明的真实文件与锚可跳转，卡不退回阶段默认", async t => {
  for (const entry of DESIGNATED) {
    await t.test(`${entry.stage} 第 ${entry.step} 步 → ${entry.file}#${entry.anchor}`, () => {
      assertDeclarationShape(entry);
      assert.ok(existsSync(join(ROOT, entry.file)),
        `${entry.stage} 第 ${entry.step} 步声明的方法文件不存在：${entry.file}（期望 ${entry.file}#${entry.anchor}）`);
      const body = readText(entry.file);
      const problem = anchorProblem(body, entry.anchor);
      assert.equal(problem, null,
        `${entry.stage} 第 ${entry.step} 步（${entry.slug}）：${problem}；期望文件 ${entry.file}`);

      const cardRun = runCli(cardArgs({ stage: entry.stage, step: entry.step }));
      const json = parseJson(cardRun.stdout);
      assert.ok(json?.card,
        `${entry.stage} 第 ${entry.step} 步取卡失败（未返回 card JSON）：${clip(cardRun.output)}`);
      const refs = cardSkillRefs(json.card);
      const expected = `${entry.file}#${entry.anchor}`;
      assert.ok(refs.includes(expected),
        `${entry.stage} 第 ${entry.step} 步的卡没有给出声明的必用方法 ${expected}；` +
        `card.paths=${JSON.stringify(json.card.paths ?? [])}，card.skill=${JSON.stringify(json.card.skill ?? null)}。这仍是阶段默认，没有读声明的方法。`);
      // 「不能回退阶段默认」要求这条声明是卡的**首选**方法指针：card.skill 有值就以它为准，
      // 否则 card.paths 的第一条带锚路径必须是它。附加的阅读路径不判。
      if (json.card.skill !== undefined && json.card.skill !== null) {
        const primary = cardSkillRefs({ skill: json.card.skill })[0] ?? null;
        assert.equal(primary, expected,
          `${entry.stage} 第 ${entry.step} 步的 card.skill 是 ${primary}，不是声明的必用方法 ${expected}（回退阶段默认不算）`);
      } else {
        assert.equal(refs[0], expected,
          `${entry.stage} 第 ${entry.step} 步的 card.paths 首条方法指针是 ${refs[0] ?? "（空）"}，不是声明的必用方法 ${expected}（回退阶段默认不算）`);
      }
    });
  }
});

test("ORACLE-SKILL-USE 破坏 1：只去掉指定步骤的 skill 声明 → 具名失败，不回退默认", () => {
  isolated ??= isolatedRepoCopy();
  const entry = DESIGNATED.find(item => item.stage === "build-plan" && item.step === 6);
  try {
    replaceDesignatedSkill(isolated.repo, entry.stage, entry.step, step => { delete step.skill; });
    const run = runCli(cardArgs({ stage: entry.stage, step: entry.step, repoRoot: isolated.repo }));
    assertNamedFailure(run, "缺 skill 声明", [
      [/build-plan/, "阶段 build-plan"],
      [/(?:第\s*6\s*步|6\s*步|step_id\W{0,4}6\b)/, "步骤 6"],
      [/(?:skill|技能)/i, "skill/技能声明"],
    ]);
    assertNoStageFallback(run, "build-plan", "step-spec-plan", "缺 skill 声明");
  } finally {
    writeFileSync(isolated.stepsPath, isolated.pristine);
  }
});

test("ORACLE-SKILL-USE 破坏 2：声明不存在的技能文件 → 具名失败并点名该文件", () => {
  isolated ??= isolatedRepoCopy();
  const entry = DESIGNATED.find(item => item.stage === "build-plan" && item.step === 6);
  const missing = "skills/p3-missing-method/SKILL.md";
  try {
    replaceDesignatedSkill(isolated.repo, entry.stage, entry.step, step => { step.skill = `${missing}#${entry.anchor}`; });
    const run = runCli(cardArgs({ stage: entry.stage, step: entry.step, repoRoot: isolated.repo }));
    assertNamedFailure(run, "技能文件不存在", [
      [/build-plan/, "阶段 build-plan"],
      [/(?:第\s*6\s*步|6\s*步|step_id\W{0,4}6\b)/, "步骤 6"],
      [new RegExp(escapeRegExp(missing)), `不存在的技能文件 ${missing}`],
    ]);
    assertNoStageFallback(run, "build-plan", "step-spec-plan", "技能文件不存在");
  } finally {
    writeFileSync(isolated.stepsPath, isolated.pristine);
  }
});

test("ORACLE-SKILL-USE 破坏 3：锚写成文件里不存在的锚 → 具名失败并点名该锚", () => {
  isolated ??= isolatedRepoCopy();
  const entry = DESIGNATED.find(item => item.stage === "build-plan" && item.step === 6);
  const badAnchor = "p3-no-such-anchor";
  try {
    replaceDesignatedSkill(isolated.repo, entry.stage, entry.step, step => { step.skill = `${entry.file}#${badAnchor}`; });
    const run = runCli(cardArgs({ stage: entry.stage, step: entry.step, repoRoot: isolated.repo }));
    assertNamedFailure(run, "锚不存在", [
      [/build-plan/, "阶段 build-plan"],
      [/(?:第\s*6\s*步|6\s*步|step_id\W{0,4}6\b)/, "步骤 6"],
      [new RegExp(escapeRegExp(entry.file)), `声明的技能文件 ${entry.file}`],
      [new RegExp(escapeRegExp(badAnchor)), `不存在的锚 ${badAnchor}`],
    ]);
    assertNoStageFallback(run, "build-plan", "step-spec-plan", "锚不存在");
  } finally {
    writeFileSync(isolated.stepsPath, isolated.pristine);
  }
});

test("ORACLE-SKILL-USE 读取标记：缺当次回执/回执不匹配 → 失败；给当前声明的真实读取回执 → 通过", async t => {
  assert.ok(TEMP_BASE, "读取回执需要 /private/tmp 隔离任务根");
  const entry = DESIGNATED.find(item => item.stage === "build-plan" && item.step === 6);
  const expected = `${entry.file}#${entry.anchor}`;
  assertDeclarationShape(entry);
  assert.ok(existsSync(join(ROOT, entry.file)),
    `${entry.stage} 第 ${entry.step} 步声明的方法文件不存在：${entry.file}；无法产生读取回执`);
  const body = readText(entry.file);
  assert.equal(anchorProblem(body, entry.anchor), null,
    `build-plan 第 6 步：锚 #${entry.anchor} 在 ${entry.file} 里不可跳转，无法产生读取回执`);

  // 隔离任务根：只带 task.json 与 facts.jsonl，回执与原输出都写在这里，真任务根不动。
  const store = mkdtempSync(join(TEMP_BASE, "p3-skill-usage-task-"));
  const taskPath = join(store, "Projects", "workflowhub", "tasks", "delivery-quality-plan-20261123");
  mkdirSync(join(taskPath, "quality", "tests"), { recursive: true });
  writeFileSync(join(taskPath, "task.json"), readFileSync(join(TASK_ROOT, "task.json")));
  writeFileSync(join(taskPath, "facts.jsonl"), "");

  // 真实读取动作产生原事件与正文；捕获由本测试按既有命令捕获结构保存。
  const readArgs = [`--read-step-skill=${expected}`, `--stage=${entry.stage}`, `--step=${entry.step}`,
    `--task-path=${taskPath}`, `--material-root=${MATERIAL_ROOT}`, ...commitArgs()];
  const startedAt = new Date(Date.now() - 1000).toISOString();
  const read = runCli(readArgs);
  const endedAt = new Date().toISOString();
  assert.equal(read.status, 0,
    `build-plan 第 ${entry.step} 步的读取动作失败（声明 ${expected} 不在当前卡内或不可读）：${clip(read.output)}`);
  const payload = parseJson(read.stdout);
  assert.ok(payload?.event, `读取动作没有返回固定事件：${clip(read.stdout)}`);
  writeFileSync(join(taskPath, "quality/tests/p3-skill-read-output.json"), read.stdout);

  const receipt = {
    cwd: realpathSync(ROOT),
    argv: [NODE, "tools/cli/check-stage-steps.mjs", ...readArgs],
    exit_code: 0,
    started_at: startedAt,
    ended_at: endedAt,
    output_ref: "quality/tests/p3-skill-read-output.json",
  };
  writeFileSync(join(taskPath, "quality/tests/p3-skill-read.json"), `${JSON.stringify(receipt, null, 2)}\n`);
  const mismatched = { ...receipt, argv: receipt.argv.map(arg => arg === `--read-step-skill=${expected}` ? "--read-step-skill=skills/phase-maker/SKILL.md#p3-wrong-anchor" : arg) };
  writeFileSync(join(taskPath, "quality/tests/p3-skill-read-wrong.json"), `${JSON.stringify(mismatched, null, 2)}\n`);

  await t.test("缺当次回执 → 非零并点名回执", () => {
    const missingRef = "quality/tests/p3-missing-receipt.json";
    const run = runCli(stepArgs({ stage: entry.stage, step: entry.step, taskPath, receipt: missingRef }));
    assertNamedFailure(run, "缺读取回执", [
      [new RegExp(escapeRegExp(missingRef)), "缺失的回执路径"],
      [/(?:回执|current-read-receipt|读取)/, "读取回执"],
    ]);
  });

  await t.test("回执与当前声明不匹配 → 非零并点名不匹配的锚", () => {
    const run = runCli(stepArgs({ stage: entry.stage, step: entry.step, taskPath, receipt: "quality/tests/p3-skill-read-wrong.json" }));
    assertNamedFailure(run, "回执不匹配", [
      [/(?:回执|current-read-receipt|读取)/, "读取回执"],
      [/p3-wrong-anchor/, "回执里错写的锚 p3-wrong-anchor"],
    ]);
  });

  await t.test("当前声明的正确读取回执 → 退出 0", () => {
    const run = runCli(stepArgs({ stage: entry.stage, step: entry.step, taskPath, receipt: "quality/tests/p3-skill-read.json" }));
    assert.equal(run.status, 0,
      `build-plan 第 ${entry.step} 步给了当前声明的正确读取回执，仍退出 ${run.status}：${clip(run.output)}`);
  });
});

test("ORACLE-SKILL-USE review-protocol：五个设计角色、独立输入与同根归并、四个全文范围", () => {
  const ref = "skills/unit-kernel/references/review-protocol.md";
  const path = join(ROOT, ref);
  assert.ok(existsSync(path), `缺 ${ref}：P3 要求单元审查协议落在内核 references，包含两路原件与全文范围`);
  const text = readText(ref);
  assert.ok(text.length >= 800,
    `${ref} 只有 ${text.length} 字：五个设计角色、独立输入与同根归并、四个全文范围写不进这么短的占位文件`);
  assert.ok((text.match(/不代/g) ?? []).length >= 3,
    `${ref} 缺「不代」边界：调研不代设计、设计不代主会话发布、主会话不代独立判断；实际出现 ${(text.match(/不代/g) ?? []).length} 次`);
  for (const role of ["调研", "设计", "同源审", "异源审", "主会话"]) {
    assert.ok(text.includes(role), `${ref} 缺设计角色「${role}」（P3 卡五个设计角色）`);
  }
  assert.match(text, /独立输入/, `${ref} 缺「独立输入」：两路必须各自独立读同一对象`);
  assert.match(text, /同根/, `${ref} 缺「同根」：同一根因只处置一次`);
  assert.match(text, /归并/, `${ref} 缺「归并」：按实际位置、根因及后果归并`);
  for (const scope of ["方向", "PRD", "计划", "末段"]) {
    assert.ok(text.includes(scope), `${ref} 缺全文范围「${scope}」（P3 卡四个全文范围：方向、PRD、计划、末段外部）`);
  }
  assert.ok(text.includes("全文"), `${ref} 缺「全文」：四个范围都是全文范围，不重审同一单元`);
  assert.ok(text.includes("两路") || text.includes("单路"), `${ref} 缺双路/单路口径：计划两路、其余单路`);
});

test("ORACLE-SKILL-USE 三个新技能的 skill-bundle.json 存在，files 列全且路径真实", () => {
  for (const [index, ref] of NEW_SKILL_BUNDLES.entries()) {
    const name = NEW_SKILLS[index];
    const path = join(ROOT, ref);
    assert.ok(existsSync(path), `缺 ${ref}：${name} 技能的便携包清单不存在`);
    const bundle = JSON.parse(readFileSync(path, "utf8"));
    assert.equal(bundle.skill, name, `${ref} 的 skill 是 ${bundle.skill}，应为 ${name}`);
    assert.ok(Array.isArray(bundle.files) && bundle.files.length > 0, `${ref} 的 files 为空`);
    const listed = bundle.files.map(item => typeof item === "string" ? item : strip(item?.path));
    for (const file of listed) {
      assert.ok(file, `${ref} 的 files 含空路径`);
      const absolute = join(ROOT, "skills", name, file);
      assert.ok(existsSync(absolute), `${ref} 列出的 ${file} 不存在（真实路径 skills/${name}/${file}）`);
    }
    assert.ok(listed.includes("SKILL.md"), `${ref} 的 files 没有列 SKILL.md`);
    // 「files 列全」只覆盖随包运行的资源：SKILL.md 与 references/templates/scripts
    // 下的真实文件；测试与规格文件不是便携包资源，不要求列。
    for (const dir of ["references", "templates", "scripts"]) {
      const absolute = join(ROOT, "skills", name, dir);
      if (!existsSync(absolute) || !statSync(absolute).isDirectory()) continue;
      for (const entry of readdirSync(absolute, { recursive: true })) {
        const rel = `${dir}/${String(entry).split(sep).join("/")}`;
        if (!statSync(join(absolute, String(entry))).isFile()) continue;
        if (/(?:^|\/)[^/]*\.(?:test|spec)\.[^/]+$/.test(rel)) continue;
        assert.ok(listed.includes(rel), `${ref} 的 files 没有列 ${rel}：便携包运行时打不开未列的资源`);
      }
    }
  }
});

function catalogEntries(text) {
  const anchors = new Map();
  for (const line of text.split(/\r?\n/)) {
    const anchor = /used_by_stages:\s*&([A-Za-z0-9_]+)\s*(\[[^\]]*\])/.exec(line);
    if (anchor) anchors.set(anchor[1], parseInlineList(anchor[2]));
  }
  const entries = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const name = /^  - name:\s*(\S+)\s*$/.exec(line);
    if (name) { current = { name: name[1], body: [] }; entries.push(current); continue; }
    if (current) current.body.push(line);
  }
  for (const entry of entries) {
    entry.path = null;
    entry.stages = null;
    for (let i = 0; i < entry.body.length; i += 1) {
      const field = /^\s{4}([a-z_]+):\s*(.*)$/.exec(entry.body[i]);
      if (!field) continue;
      const [, key, value] = field;
      if (key === "path") entry.path = strip(value).replace(/^["']|["']$/g, "");
      if (key !== "used_by_stages") continue;
      if (value.startsWith("[")) entry.stages = parseInlineList(value);
      else if (value.startsWith("*")) entry.stages = anchors.get(value.slice(1).trim()) ?? null;
      else if (!value) {
        const block = [];
        for (let j = i + 1; j < entry.body.length; j += 1) {
          const item = /^\s{6}- (.+)$/.exec(entry.body[j]);
          if (!item) break;
          block.push(strip(item[1]).replace(/^["']|["']$/g, ""));
        }
        entry.stages = block;
      }
    }
  }
  return entries;
}

function parseInlineList(value) {
  const inner = value.trim().replace(/^\[|\]$/g, "");
  if (!inner) return [];
  return inner.split(",").map(item => strip(item).replace(/^["']|["']$/g, "")).filter(Boolean);
}

test("ORACLE-SKILL-USE 登记：catalog.yaml 与四个 skill-deps.yaml 指向真实消费者", () => {
  const catalog = catalogEntries(readText("skills/catalog.yaml"));
  assert.ok(catalog.length > 0, "skills/catalog.yaml 未解析出任何 skills 条目");
  const decision = catalog.find(entry => entry.name === "decision-maker");
  assert.ok(decision, "skills/catalog.yaml 缺 decision-maker 条目");
  assert.equal(decision.path, "skills/decision-maker/SKILL.md", "catalog 的 decision-maker path 不是 skills/decision-maker/SKILL.md");
  assert.ok((decision.stages ?? []).includes("make-decision"),
    `catalog 的 decision-maker used_by_stages 未指向真实消费者 make-decision：${JSON.stringify(decision.stages)}`);
  for (const name of NEW_SKILLS) {
    const entry = catalog.find(item => item.name === name);
    assert.ok(entry, `skills/catalog.yaml 缺新技能 ${name} 的登记条目`);
    assert.equal(entry.path, `skills/${name}/SKILL.md`, `catalog 的 ${name} path 不是 skills/${name}/SKILL.md`);
    const consumer = NEW_SKILL_CONSUMER[name];
    assert.ok((entry.stages ?? []).includes(consumer),
      `catalog 的 ${name} used_by_stages 未指向真实消费者 ${consumer}：${JSON.stringify(entry.stages)}`);
    const unknown = (entry.stages ?? []).filter(stage => !["make-decision", "build-prd", "build-plan", "build-code"].includes(stage));
    assert.equal(unknown.length, 0, `catalog 的 ${name} used_by_stages 含不存在的阶段：${unknown.join("、")}`);
  }

  const deps = [
    { stage: "make-decision", skill: "decision-maker" },
    { stage: "build-prd", skill: "task-maker" },
    { stage: "build-plan", skill: "phase-maker" },
    { stage: "build-code", skill: "run-phase" },
  ];
  for (const { stage, skill } of deps) {
    const ref = `workflows/${stage}/skill-deps.yaml`;
    const path = join(ROOT, ref);
    assert.ok(existsSync(path), `缺 ${ref}`);
    const text = readText(ref);
    const registered = text.split(/\r?\n/).some(line => new RegExp(`^\\s*- name:\\s*${escapeRegExp(skill)}\\s*$`).test(line));
    assert.ok(registered, `${ref} 没有登记 ${skill}（P3 要求四个阶段依赖表登记真实消费者）`);
    assert.ok(new RegExp(`path:\\s*skills/${escapeRegExp(skill)}/SKILL\\.md`).test(text),
      `${ref} 登记 ${skill} 的 path 不是 skills/${skill}/SKILL.md`);
    assert.ok(existsSync(join(ROOT, "skills", skill, "SKILL.md")), `skills/${skill}/SKILL.md 不存在，登记指向失效路径`);
  }
});

test("ORACLE-SKILL-USE 内核升版：内核版本与四个入口「入口版本」逐字一致且已升版", () => {
  const kernelRef = "skills/unit-kernel/SKILL.md";
  const kernel = readText(kernelRef);
  const front = /^---\n([\s\S]*?)\n---/.exec(kernel)?.[1] ?? "";
  const frontVersion = /^version:\s*["']?v?(\d+\.\d+\.\d+)/m.exec(front)?.[1] ?? null;
  const bodyVersion = /内核版本[：:]\s*`?v?(\d+\.\d+\.\d+)/.exec(kernel)?.[1] ?? null;
  const version = frontVersion ?? bodyVersion;
  assert.ok(version, `${kernelRef} 没有机器可读的版本（frontmatter version: 或正文「内核版本：vX.Y.Z」）`);
  if (frontVersion && bodyVersion) {
    assert.equal(frontVersion, bodyVersion, `${kernelRef} frontmatter version ${frontVersion} 与正文内核版本 ${bodyVersion} 不一致`);
  }
  assert.notEqual(version, "1.0.0",
    `${kernelRef} 仍是 v1.0.0：内核正文自己写明本阶段内容增量须与四入口同批升版（P2 留下的缺口由 P3 收），` +
    `只把四处入口对齐 v1.0.0 不算生效`);
  for (const stage of ["make-decision", "build-prd", "build-plan", "build-code"]) {
    const ref = `workflows/${stage}/SKILL.md`;
    const entryVersion = /入口版本[：:]\s*`?v?(\d+\.\d+\.\d+)/.exec(readText(ref))?.[1] ?? null;
    assert.ok(entryVersion, `${ref} 缺「入口版本：vX.Y.Z」行`);
    assert.equal(entryVersion, version,
      `${ref} 的入口版本 v${entryVersion} 与 ${kernelRef} 的内核版本 v${version} 不一致（R4：同版才生效）`);
  }
});

test("ORACLE-SKILL-USE 清单一致：build-skill-manifests --check 退出 0，manifest 含三个新技能", () => {
  const run = spawnNode(join(ROOT, "tools/cli/build-skill-manifests.mjs"), ["--check"]);
  assert.equal(run.status, 0,
    `repo-skills.manifest.json 与 catalog 不一致：node tools/cli/build-skill-manifests.mjs --check 退出 ${run.status}\n真实输出：${clip(run.output)}`);
  const manifest = JSON.parse(readText("repo-skills.manifest.json"));
  for (const name of NEW_SKILLS) {
    const entry = (manifest.skills ?? []).find(item => item.name === name);
    assert.ok(entry, `repo-skills.manifest.json 缺新技能 ${name}，与 catalog 不一致`);
    assert.equal(entry.path, `skills/${name}/SKILL.md`, `manifest 的 ${name} path 不是 skills/${name}/SKILL.md`);
    assert.ok((entry.used_by_stages ?? []).includes(NEW_SKILL_CONSUMER[name]),
      `manifest 的 ${name} used_by_stages 未指向真实消费者 ${NEW_SKILL_CONSUMER[name]}：${JSON.stringify(entry.used_by_stages)}`);
  }
  // 三个技能包的文件都应真实存在（bundle 与 manifest 指同一批原字节）。
  for (const name of NEW_SKILLS) {
    assert.ok(existsSync(join(ROOT, "skills", name, "SKILL.md")), `缺 skills/${name}/SKILL.md`);
  }
});
