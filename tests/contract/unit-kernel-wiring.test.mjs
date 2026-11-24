/**
 * P1 冻结契约测试：四阶段按同一版共用规则接手（ORACLE-UNIT-RULES）。
 *
 * 只查锚、版本和调用边，不判语义好坏、不数行数、不比对散文措辞。
 * 交付前必须 RED；实现按下面的机器契约补齐后 GREEN。冻结后实现者只读。
 *
 * 机器契约（实现者逐字满足；本文件的失败信息会点名缺哪个锚）：
 *
 * 1. 内核 `skills/unit-kernel/SKILL.md` 声明版本，二选一：
 *    - frontmatter 里的 `version: X.Y.Z`（可带 v），或
 *    - 正文独立一行 `内核版本：vX.Y.Z`。
 * 2. 内核有条款表，表头逐字为 `| 条款号 | 主题 | 规则 |`，其后每行一条：
 *    - 条款号形如 `R1`…`R99`，全表唯一；
 *    - 主题必须逐字覆盖这五个（顺序不限）：审查周期、唯一写主、能定不问、升版核读者、发现四态；
 *    - 规则正文是这一条的一句话规则（≥ 8 字，不许占位）。
 * 3. 内核正文出现 `决策流水线` 与 `执行流水线` 两个词（两条流水线各一节）。
 * 4. 四个入口 `workflows/<stage>/SKILL.md` 各恰有一个 `内核接线` 小节，小节内按序五行，
 *    每行形如 `- 入口版本：vX.Y.Z`（表格行 `| 入口版本 | … |` 也接受）：
 *    - `入口版本`：版本 token 归一化后等于内核版本；
 *    - `消费条款`：≥1 个内核条款号，且每个都能在内核条款表找到；还要有一个步骤引用
 *      （`第N步` 或本阶段 steps.json 里的 step_slug）；
 *    - `阶段输出`：本阶段专属输出，非空；
 *    - `冲突回报`：出现「内核」（以内核为准，缺条记缺口回报）；
 *    - `升版顺序`：出现「内核」和「版本」（先升内核版本再改接线）。
 * 5. 登记与调用边：
 *    - `skills/catalog.yaml`：skills 条目 `name: unit-kernel`、`path: skills/unit-kernel/SKILL.md`，
 *      `used_by_stages` 含 build-code/build-plan/build-prd/make-decision；
 *    - `skills/reuse-registry.md`：一行同时含 `unit-kernel` 与 `unit-kernel/SKILL.md` 链接；
 *    - `repo-skills.manifest.json`：skills 投影含同名同路径条目；
 *    - 四个 `workflows/<stage>/skill-deps.yaml`：`- name: unit-kernel` 且 path 指向内核；
 *    - `workflows/make-decision/steps.json` 第 9 步（step_slug `module-convergence`）出现
 *      `skills/unit-kernel/SKILL.md`，且不再自称定义权威（不得残留「以本步为准」）；
 *    - `skills/decision-maker/SKILL.md` 引用 `unit-kernel/SKILL.md`（可带 `../`）。
 *
 * 只读文件，不联网、不写临时件、不依赖进程 CWD。
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const KERNEL_PATH = "skills/unit-kernel/SKILL.md";
const KERNEL_VERSION_LINE = "内核版本：vX.Y.Z";

const STAGES = [
  { slug: "make-decision", file: "workflows/make-decision/SKILL.md", deps: "workflows/make-decision/skill-deps.yaml", steps: "workflows/make-decision/steps.json" },
  { slug: "build-plan", file: "workflows/build-plan/SKILL.md", deps: "workflows/build-plan/skill-deps.yaml", steps: "workflows/build-plan/steps.json" },
  { slug: "build-prd", file: "workflows/build-prd/SKILL.md", deps: "workflows/build-prd/skill-deps.yaml", steps: "workflows/build-prd/steps.json" },
  { slug: "build-code", file: "workflows/build-code/SKILL.md", deps: "workflows/build-code/skill-deps.yaml", steps: "workflows/build-code/steps.json" },
];

const WIRING_LABELS = ["入口版本", "消费条款", "阶段输出", "冲突回报", "升版顺序"];

// 主题 token 逐字取自 P1 卡与决策日志第 5 节「最终决定」的五条规则。
const REQUIRED_TOPICS = [
  ["审查周期", "一个被审对象只进一个周期，周期后不重开"],
  ["唯一写主", "一个对象同时只有一个开发写手"],
  ["能定不问", "事实能定的不问用户"],
  ["升版核读者", "改内核先升版本，再逐条核四个真实读者"],
  ["发现四态", "发现按已修/驳回/接受风险/交人决定记录"],
];

function readText(path) {
  const abs = join(root, path);
  assert.ok(existsSync(abs), `缺少文件：${path}。P1 要求它存在并承载本测试所列锚。`);
  return readFileSync(abs, "utf8");
}

function readJson(path) {
  const text = readText(path);
  try {
    return JSON.parse(text);
  } catch (error) {
    assert.fail(`${path} 不是合法 JSON：${error.message}`);
  }
}

function normalizeVersion(token) {
  return String(token).replace(/^v/i, "");
}

/** 内核版本：frontmatter `version:` 或正文行 `内核版本：vX.Y.Z`。 */
function kernelVersion(text, path) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (frontmatter) {
    const declared = /^\s*version\s*:\s*['"]?(v?\d+\.\d+\.\d+)['"]?\s*$/m.exec(frontmatter[1]);
    if (declared) return declared[1];
  }
  const line = /^\s*内核版本\s*[：:]\s*(v?\d+\.\d+\.\d+)\s*$/m.exec(text);
  if (line) return line[1];
  assert.fail(
    `${path} 未声明内核版本：需要 frontmatter 的 \`version: X.Y.Z\`，或正文独立一行 \`${KERNEL_VERSION_LINE}\`。`,
  );
}

function rowCells(line) {
  if (!/^\s*\|/.test(line)) return null;
  const trimmed = line.trim();
  if (!trimmed.endsWith("|") || trimmed.length < 2) return null;
  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
}

/** 解析条款表；缺表头、条号不合形、重复、正文过短都具名失败。 */
function clauseTable(text, path) {
  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => {
    const cells = rowCells(line);
    return cells !== null && cells.length >= 3
      && cells[0] === "条款号" && cells[1] === "主题" && cells[2] === "规则";
  });
  assert.notEqual(
    headerIndex,
    -1,
    `${path} 缺少条款表表头：需要一行 \`| 条款号 | 主题 | 规则 |\`，其后每行一条规则。`,
  );
  const clauses = [];
  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const cells = rowCells(lines[index]);
    if (cells === null || cells.length < 3) break;
    if (cells.every((cell) => cell === "" || /^:?-{2,}:?$/.test(cell))) continue;
    clauses.push({ id: cells[0], topic: cells[1], rule: cells[2], line: index + 1 });
  }
  assert.ok(clauses.length >= 5, `${path} 的条款表只解析到 ${clauses.length} 条，至少要有五条规则。`);
  const seen = new Set();
  for (const clause of clauses) {
    assert.match(
      clause.id,
      /^R\d{1,2}$/,
      `${path}:${clause.line} 的条款号「${clause.id}」不合形：要写成 R1…R99。`,
    );
    assert.ok(!seen.has(clause.id), `${path}:${clause.line} 条款号 ${clause.id} 重复。`);
    seen.add(clause.id);
    assert.ok(
      clause.rule.length >= 8,
      `${path}:${clause.line} 条款 ${clause.id} 的规则正文过短或缺失（「${clause.rule}」）：每条要有一句规则正文。`,
    );
  }
  return clauses;
}

function headingIndex(lines) {
  const heads = [];
  lines.forEach((line, index) => {
    const match = /^(#{1,6})\s+(.*\S)\s*$/.exec(line);
    if (match) heads.push({ level: match[1].length, title: match[2].trim(), index });
  });
  return heads;
}

/** 取 `内核接线` 小节正文；标题必须恰好一个。 */
function wiringSection(text, path) {
  const lines = text.split(/\r?\n/);
  const heads = headingIndex(lines);
  const hits = heads.filter((head) => head.title.startsWith("内核接线"));
  assert.equal(
    hits.length,
    1,
    `${path} 需要恰好一个「内核接线」小节标题（如 \`## 内核接线\`），实际 ${hits.length} 个。`,
  );
  const head = hits[0];
  const next = heads.find((item) => item.index > head.index && item.level <= head.level);
  const end = next ? next.index : lines.length;
  return { lines: lines.slice(head.index + 1, end), offset: head.index + 1 };
}

/** 一行标签：`- 入口版本：…` 或表格行 `| 入口版本 | … |`。 */
function labelMatches(lines, label, offset) {
  const bullet = new RegExp(`^\\s*(?:[-*]\\s*)?${label}\\s*[：:]\\s*(.*\\S)\\s*$`);
  const table = new RegExp(`^\\s*\\|\\s*${label}\\s*\\|\\s*(.*?)\\s*\\|?\\s*$`);
  const hits = [];
  lines.forEach((line, index) => {
    const match = bullet.exec(line) ?? table.exec(line);
    if (match) hits.push({ value: match[1].trim(), line: index + offset + 1 });
  });
  return hits;
}

function stepSlugs(path) {
  try {
    const doc = JSON.parse(readFileSync(join(root, path), "utf8"));
    const steps = Array.isArray(doc?.steps) ? doc.steps : [];
    return steps.flatMap((step) => [step?.step_slug, step?.slug]).filter((value) => typeof value === "string");
  } catch {
    return [];
  }
}

test("内核存在且自洽：版本、条款表、两条流水线", () => {
  const text = readText(KERNEL_PATH);
  const version = kernelVersion(text, KERNEL_PATH);
  assert.match(
    normalizeVersion(version),
    /^\d+\.\d+\.\d+$/,
    `${KERNEL_PATH} 的版本 token「${version}」不合形：要写成 vX.Y.Z 或 X.Y.Z。`,
  );

  const clauses = clauseTable(text, KERNEL_PATH);
  const topics = clauses.map((clause) => clause.topic);
  for (const [topic, meaning] of REQUIRED_TOPICS) {
    assert.ok(
      topics.includes(topic),
      `${KERNEL_PATH} 条款表缺少主题「${topic}」（${meaning}）；现有主题：${topics.join("、")}。`,
    );
  }
  for (const pipeline of ["决策流水线", "执行流水线"]) {
    assert.ok(
      text.includes(pipeline),
      `${KERNEL_PATH} 缺少「${pipeline}」：内核要同时交出设计与执行两条流水线。`,
    );
  }
});

for (const stage of STAGES) {
  test(`入口同版接线：${stage.file}`, () => {
    const kernelText = readText(KERNEL_PATH);
    const kernelVersionToken = normalizeVersion(kernelVersion(kernelText, KERNEL_PATH));
    const clauses = clauseTable(kernelText, KERNEL_PATH);
    const knownIds = new Set(clauses.map((clause) => clause.id));

    const text = readText(stage.file);
    const section = wiringSection(text, stage.file);

    const found = new Map();
    const positions = [];
    for (const label of WIRING_LABELS) {
      const hits = labelMatches(section.lines, label, section.offset);
      assert.equal(
        hits.length,
        1,
        `${stage.file} 的「内核接线」小节里需要恰好一行「${label}：…」，实际 ${hits.length} 行。`,
      );
      found.set(label, hits[0]);
      positions.push(hits[0].line);
    }
    const ordered = [...positions].sort((left, right) => left - right);
    assert.deepEqual(
      positions,
      ordered,
      `${stage.file} 的接线顺序错：需要依次 ${WIRING_LABELS.join(" → ")}（实际行号 ${positions.join("、")}）。`,
    );

    const entryVersion = found.get("入口版本");
    const versionToken = /v?\d+\.\d+\.\d+/.exec(entryVersion.value);
    assert.ok(
      versionToken,
      `${stage.file}:${entryVersion.line} 的「入口版本」行没有版本 token（形如 v1.0.0）：${entryVersion.value}。`,
    );
    assert.equal(
      normalizeVersion(versionToken[0]),
      kernelVersionToken,
      `${stage.file} 的入口版本 ${versionToken[0]} 与内核版本 ${kernelVersionToken} 不一致：四阶段必须同版。`,
    );

    const consumed = found.get("消费条款");
    const referenced = [...consumed.value.matchAll(/\bR\d{1,2}\b/g)].map((match) => match[0]);
    assert.ok(
      referenced.length > 0,
      `${stage.file}:${consumed.line} 的「消费条款」行没有条款号（形如 R1、R3）：${consumed.value}。`,
    );
    const unknown = referenced.filter((id) => !knownIds.has(id));
    assert.deepEqual(
      unknown,
      [],
      `${stage.file} 的「消费条款」引用了内核条款表里找不到的条款号：${unknown.join("、")}；内核现有：${[...knownIds].join("、")}。`,
    );
    const slugs = stepSlugs(stage.steps);
    const hasStepRef = /第\s*\d+\s*步/.test(consumed.value) || slugs.some((slug) => consumed.value.includes(slug));
    assert.ok(
      hasStepRef,
      `${stage.file}:${consumed.line} 的「消费条款」行没有步骤引用：需要 \`第N步\` 或本阶段 steps.json 里的 step_slug（如 ${slugs.slice(0, 3).join("、") || "无"}）。`,
    );

    const output = found.get("阶段输出");
    assert.ok(
      output.value.length >= 2,
      `${stage.file}:${output.line} 的「阶段输出」行为空：本阶段专属输出要写在这行。`,
    );

    const conflict = found.get("冲突回报");
    assert.ok(
      conflict.value.includes("内核"),
      `${stage.file}:${conflict.line} 的「冲突回报」行没写以内核为准（缺条记缺口回报）：${conflict.value}。`,
    );

    const upgrade = found.get("升版顺序");
    assert.ok(
      upgrade.value.includes("内核") && upgrade.value.includes("版本"),
      `${stage.file}:${upgrade.line} 的「升版顺序」行没写先升内核版本再改接线：${upgrade.value}。`,
    );
  });
}

test("登记：skills/catalog.yaml 有 unit-kernel 条目并点名四阶段", () => {
  const path = "skills/catalog.yaml";
  const text = readText(path);
  let doc;
  try {
    doc = yaml.load(text);
  } catch (error) {
    assert.fail(`${path} 不是合法 YAML：${error.message}`);
  }
  const skills = Array.isArray(doc?.skills) ? doc.skills : [];
  const entry = skills.find((item) => item && item.name === "unit-kernel");
  assert.ok(
    entry,
    `${path} 的 skills 列表里没有 \`name: unit-kernel\` 条目（现有：${skills.map((item) => item?.name).filter(Boolean).join("、")}）。`,
  );
  assert.equal(
    entry.path,
    KERNEL_PATH,
    `${path} 的 unit-kernel 条目 path 应为 ${KERNEL_PATH}，实际 ${entry.path ?? "（缺）"}。`,
  );
  const stages = Array.isArray(entry.used_by_stages) ? entry.used_by_stages : [];
  const missing = STAGES.map((stage) => stage.slug).filter((slug) => !stages.includes(slug));
  assert.deepEqual(
    missing,
    [],
    `${path} 的 unit-kernel 条目 used_by_stages 少了真实消费者：${missing.join("、")}；实际 ${stages.join("、") || "（空）"}。`,
  );
});

test("登记：skills/reuse-registry.md 有可回读引用", () => {
  const path = "skills/reuse-registry.md";
  const text = readText(path);
  const lines = text.split(/\r?\n/).filter((line) => line.includes("unit-kernel") && /unit-kernel\/SKILL\.md/.test(line));
  assert.ok(
    lines.length >= 1,
    `${path} 没有 unit-kernel 的可回读引用：需要一行同时含 \`unit-kernel\` 与指向 \`unit-kernel/SKILL.md\` 的链接。`,
  );
});

test("登记：repo-skills.manifest.json 投影含 unit-kernel", () => {
  const path = "repo-skills.manifest.json";
  const doc = readJson(path);
  const skills = Array.isArray(doc?.skills) ? doc.skills : [];
  const entry = skills.find((item) => item && item.name === "unit-kernel");
  assert.ok(
    entry,
    `${path} 的 skills 投影里没有 name: unit-kernel 条目（现有：${skills.map((item) => item?.name).filter(Boolean).slice(0, 60).join("、")}）。`,
  );
  assert.equal(
    entry.path,
    KERNEL_PATH,
    `${path} 的 unit-kernel 投影 path 应为 ${KERNEL_PATH}，实际 ${entry.path ?? "（缺）"}。`,
  );
});

for (const stage of STAGES) {
  test(`消费者登记：${stage.deps}`, () => {
    const text = readText(stage.deps);
    assert.ok(
      /^\s*-\s*name:\s*unit-kernel\s*$/m.test(text),
      `${stage.deps} 的 skills 列表没有 \`- name: unit-kernel\` 条目。`,
    );
    assert.ok(
      /^\s*path:\s*skills\/unit-kernel\/SKILL\.md\s*$/m.test(text),
      `${stage.deps} 没有把 unit-kernel 指到 ${KERNEL_PATH}。`,
    );
  });
}

test("调用边：make-decision 第 9 步改指共用位置", () => {
  const path = "workflows/make-decision/steps.json";
  const doc = readJson(path);
  const steps = Array.isArray(doc?.steps) ? doc.steps : [];
  const step = steps.find((item) => item && item.step_slug === "module-convergence");
  assert.ok(
    step,
    `${path} 找不到 step_slug: module-convergence（第 9 步，十一格与五段的原定义处）。`,
  );
  const serialized = JSON.stringify(step);
  assert.ok(
    serialized.includes(KERNEL_PATH),
    `${path} 第 9 步（module-convergence）没有指向共用位置：需要出现 ${KERNEL_PATH}。`,
  );
  assert.ok(
    !serialized.includes("以本步为准"),
    `${path} 第 9 步仍自称定义权威（出现「以本步为准」）：十一格与五段定义只在内核，步骤表只留指针。`,
  );
});

test("调用边：skills/decision-maker/SKILL.md 引用内核", () => {
  const path = "skills/decision-maker/SKILL.md";
  const text = readText(path);
  assert.ok(
    /(?:\.\.\/)?unit-kernel\/SKILL\.md/.test(text),
    `${path} 没有引用共用内核：需要出现 \`unit-kernel/SKILL.md\`（可带 ../）。`,
  );
});
