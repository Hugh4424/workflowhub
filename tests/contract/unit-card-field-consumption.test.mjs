/**
 * P2 冻结契约测试：真卡可读且明显漏项会报错（ORACLE-CARD-FIELDS）。
 *
 * 只判机器可查项：字典形状、模板与三个既有入口的真实读取、坏卡的真实退出与点名、
 * move-map 登记。不判散文措辞、字数或语义好坏；不要求新增第四校验器。
 * 交付前必须 RED；实现按下面机器契约补齐后 GREEN。冻结后实现者只读。
 *
 * 机器契约（实现者逐字满足；失败信息会点名缺哪个文件、字段或入口）：
 *
 * 1. 字段字典 `skills/unit-kernel/references/unit-fields.json`：
 *    - 合法 JSON；`schema` 是含 `unit-fields` 的非空字符串；
 *    - `fields` 是数组，包含下面十一项，每项恰一条；
 *    - 每条字段：`name`；`cards` 对象恰含 方向卡/任务卡/阶段卡 三键，值为
 *      判据/复算/指向；`legacy_aliases` 数组（可为空）；`readers` 非空数组，
 *      每项 `{ path, action }`，path 是仓内真实存在的文件，action 写明在什么动作读它；
 *    - 十一项的精度映射逐字按决策日志 L261–L264（下表），不得改档：
 *
 *      字段            方向卡  任务卡  阶段卡
 *      结果            判据    判据    复算
 *      来源            判据    指向    判据
 *      为什么现在做    判据    判据    判据
 *      方案与取舍      判据    指向    复算
 *      边界            判据    判据    判据
 *      依赖与供件      判据    判据    复算
 *      验收            判据    判据    复算
 *      风险与回退      判据    判据    判据
 *      未决与返工半径  判据    判据    判据
 *      配套与写集      判据    指向    复算
 *      人话复述        判据    判据    判据
 *
 *    - 三个既有入口（validate-card.mjs / check-stage-steps.mjs /
 *      check-stage-quality.mjs）都必须至少作为一条字段的 reader 出现。
 * 2. 三张模板各出现 `unit-fields.json` 引用；模板不得给 判据/复算/指向
 *    下定义，也不得用表格列把字段映射成精度档（精度语义正文只在字典里）。
 * 3. 三个入口文件各有一处非注释的 `unit-fields.json` 引用（路径常量或读取调用）。
 * 4. 行为：真实调 `node skills/decision-maker/scripts/validate-card.mjs <card>`：
 *    - 合格方向卡退出 0；
 *    - 缺「验收」行的卡退出 1 且输出点名「验收」；
 *    - 方案与取舍只写「按计划实现」（判据档空话）的卡退出 1 且输出点名
 *      「精度」与本字段名。
 * 5. `docs/architecture/move-map.json` 有字典条目，写职责、owner、消费者、
 *    退役条件；消费者必须点名三个既有入口（consumer 或 named_data_readers 皆可）。
 *
 * 测试自己造卡到临时目录并在 finally 删除；用真实 CLI，不 import 内部函数。
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const dictionaryPath = "skills/unit-kernel/references/unit-fields.json";
const cardTypes = ["方向卡", "任务卡", "阶段卡"];
const precisionTiers = ["判据", "复算", "指向"];

// 十一字段与三卡精度逐字取自决策日志 L261–L264；本表是唯一契约来源。
const expectedPrecision = {
  结果: { 方向卡: "判据", 任务卡: "判据", 阶段卡: "复算" },
  来源: { 方向卡: "判据", 任务卡: "指向", 阶段卡: "判据" },
  为什么现在做: { 方向卡: "判据", 任务卡: "判据", 阶段卡: "判据" },
  方案与取舍: { 方向卡: "判据", 任务卡: "指向", 阶段卡: "复算" },
  边界: { 方向卡: "判据", 任务卡: "判据", 阶段卡: "判据" },
  依赖与供件: { 方向卡: "判据", 任务卡: "判据", 阶段卡: "复算" },
  验收: { 方向卡: "判据", 任务卡: "判据", 阶段卡: "复算" },
  风险与回退: { 方向卡: "判据", 任务卡: "判据", 阶段卡: "判据" },
  未决与返工半径: { 方向卡: "判据", 任务卡: "判据", 阶段卡: "判据" },
  配套与写集: { 方向卡: "判据", 任务卡: "指向", 阶段卡: "复算" },
  人话复述: { 方向卡: "判据", 任务卡: "判据", 阶段卡: "判据" },
};
const fieldNames = Object.keys(expectedPrecision);

const checkers = [
  { path: "skills/decision-maker/scripts/validate-card.mjs", label: "包卡入口 validate-card" },
  { path: "tools/cli/check-stage-steps.mjs", label: "步骤入口 check-stage-steps" },
  { path: "tools/cli/check-stage-quality.mjs", label: "汇总入口 check-stage-quality" },
];

const templates = [
  "skills/decision-maker/templates/card.md",
  "skills/spec-prd/templates/prd-template.md",
  "skills/spec-plan/templates/phase-template.md",
];

// 字典里不得复制这三档的解释；解释只在 unit-fields.json。
const tierDefinitionPhrases = ["能据此判", "能按步骤复算", "能回到来源", "分指到来源"];

const abs = (relative) => join(root, relative);
const read = (relative) => readFileSync(abs(relative), "utf8");

function failure(message) {
  assert.fail(message);
}

function loadDictionary() {
  if (!existsSync(abs(dictionaryPath))) {
    failure(`缺字段字典：${dictionaryPath} 不存在；三个既有检查入口没有同源可读，三张卡仍各写各的同义字段。`);
  }
  let document;
  try {
    document = JSON.parse(read(dictionaryPath));
  } catch (error) {
    failure(`字段字典不是合法 JSON：${dictionaryPath}：${error.message}`);
  }
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    failure(`字段字典根必须是对象：${dictionaryPath}`);
  }
  return document;
}

function fieldEntries(document) {
  if (!Array.isArray(document.fields)) {
    failure(`字段字典缺 fields 数组：${dictionaryPath} 应以 { "schema": "...", "fields": [...] } 组织。`);
  }
  return document.fields;
}

test("字典存在、合法 JSON 且带 schema 标识", () => {
  const document = loadDictionary();
  assert.ok(
    typeof document.schema === "string" && /unit-fields/i.test(document.schema),
    `字段字典缺 schema 标识：${dictionaryPath} 的 schema 应是含 unit-fields 的非空字符串（例：workflowhub-unit-fields.v1），实际 ${JSON.stringify(document.schema)}。`,
  );
});

test("字典收录十一字段并按原表声明三卡精度", () => {
  const document = loadDictionary();
  const fields = fieldEntries(document);
  const byName = new Map();
  for (const entry of fields) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      failure(`字段字典 fields 中有非对象条目：${JSON.stringify(entry)}；每条必须是 { name, cards, legacy_aliases, readers }。`);
    }
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!name) failure(`字段字典 fields 中有条目缺 name：${JSON.stringify(entry)}。`);
    if (byName.has(name)) failure(`字段字典字段名重复：「${name}」出现多次；每个字段只能有一条定义。`);
    byName.set(name, entry);
  }
  for (const name of fieldNames) {
    if (!byName.has(name)) failure(`字段字典缺字段「${name}」；十一字段必须逐条定义，字段名按决策日志 L261–L262 原词。`);
  }
  for (const name of fieldNames) {
    const entry = byName.get(name);
    const cards = entry.cards;
    if (!cards || typeof cards !== "object" || Array.isArray(cards)) {
      failure(`字段「${name}」缺 cards 对象；每条必须声明 方向卡/任务卡/阶段卡 三档精度。`);
    }
    const actualKeys = Object.keys(cards).sort();
    const expectedKeys = [...cardTypes].sort();
    assert.deepEqual(
      actualKeys,
      expectedKeys,
      `字段「${name}」的 cards 键应恰为 ${cardTypes.join("/")}，实际 ${actualKeys.join("/") || "（空）"}。`,
    );
    for (const cardType of cardTypes) {
      const expected = expectedPrecision[name][cardType];
      const actual = cards[cardType];
      assert.equal(
        actual,
        expected,
        `字段「${name}」在「${cardType}」的精度应为「${expected}」，实际「${actual ?? "（未写）"}」；精度的唯一来源是决策日志 L261–L264。`,
      );
    }
  }
});

test("字典每条都有真实读者、动作与旧别名字段", () => {
  const document = loadDictionary();
  const fields = fieldEntries(document);
  const declaredReaders = new Set();
  for (const entry of fields) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      failure(`字段字典 fields 中有非对象条目：${JSON.stringify(entry)}。`);
    }
    const name = typeof entry.name === "string" && entry.name.trim() ? entry.name.trim() : "（未命名）";
    if (!Array.isArray(entry.legacy_aliases)) {
      failure(`字段「${name}」缺 legacy_aliases 数组；没有旧别名就写空数组。`);
    }
    const aliases = entry.legacy_aliases;
    for (const alias of aliases) {
      assert.ok(
        typeof alias === "string" && alias.trim() && alias !== name,
        `字段「${name}」的旧别名必须是非空字符串且不等于字段名，实际 ${JSON.stringify(alias)}。`,
      );
    }
    assert.equal(
      new Set(aliases).size,
      aliases.length,
      `字段「${name}」的旧别名有重复：${aliases.join("、")}。`,
    );
    if (!Array.isArray(entry.readers) || entry.readers.length === 0) {
      failure(`字段「${name}」没有 reader；字典不收没有真实读者的字段，每条至少要写谁在什么动作读它。`);
    }
    for (const reader of entry.readers) {
      assert.ok(
        reader && typeof reader.path === "string" && reader.path.trim(),
        `字段「${name}」的 reader 缺 path；应写真实读取者文件（例：skills/decision-maker/scripts/validate-card.mjs）。`,
      );
      assert.ok(
        reader && typeof reader.action === "string" && reader.action.trim().length >= 4,
        `字段「${name}」的 reader「${reader.path}」缺动作；要写清在什么动作读这个字段。`,
      );
      const readerPath = reader.path.trim();
      if (readerPath === dictionaryPath) {
        failure(`字段「${name}」的 reader 指向字典自身；读者必须是真实消费方。`);
      }
      if (!existsSync(abs(readerPath)) || !statSync(abs(readerPath)).isFile()) {
        failure(`字段「${name}」的 reader 指向不存在的文件：「${readerPath}」；读者必须是仓内真实文件。`);
      }
      declaredReaders.add(readerPath);
    }
  }
  for (const checker of checkers) {
    assert.ok(
      declaredReaders.has(checker.path),
      `字段字典没有把${checker.label}（${checker.path}）登记为任何字段的 reader；三个既有入口必须读同一份字典。`,
    );
  }
});

test("三张模板引字典且不复制精度语义正文", () => {
  for (const template of templates) {
    assert.ok(existsSync(abs(template)), `缺模板：${template} 不存在。`);
    const text = read(template);
    assert.ok(
      text.includes("unit-fields.json"),
      `模板 ${template} 没有引用字段字典 unit-fields.json；模板只留形状，字段语义回字典。`,
    );
    for (const phrase of tierDefinitionPhrases) {
      assert.ok(
        !text.includes(phrase),
        `模板 ${template} 复制了精度档解释「${phrase}」；判据/复算/指向的解释只应在 unit-fields.json。`,
      );
    }
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      if (!/^\s*\|/.test(line)) return;
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      for (const cell of cells) {
        if (precisionTiers.includes(cell) || /^(判据|复算|指向)档$/.test(cell)) {
          failure(
            `模板 ${template}:${index + 1} 的表格把字段映射成精度档「${cell}」；精度映射只能在 unit-fields.json，模板只写引用。`,
          );
        }
      }
    });
  }
});

test("三个既有检查入口都读取同一份字段字典", () => {
  for (const checker of checkers) {
    assert.ok(existsSync(abs(checker.path)), `缺检查入口：${checker.path} 不存在。`);
    const lines = read(checker.path).split("\n");
    const hit = lines.some((line) => {
      const trimmed = line.trim();
      if (/^(\/\/|\/\*|\*|#)/.test(trimmed)) return false;
      return line.includes("unit-fields.json");
    });
    assert.ok(
      hit,
      `${checker.label}（${checker.path}）没有真实读取字段字典 unit-fields.json；` +
        "要有路径常量或读取调用，不能在入口里另写一份字段表。",
    );
  }
});

// 最小合法方向卡样本：现 validate-card 已判 0；实现后仍须判 0（防过度拒绝）。
const goodRows = [
  ["一句话结果", "用户能在非法配置上看到文件位置"],
  ["对应需求", "需求 1 与验收 1"],
  ["现状缺口", "当前配置错误只报默认值，用户看不到位置"],
  ["方案与取舍", "选择在解析器里报告位置；否掉只打印堆栈；代价是错误信息更长"],
  ["边界", "只改配置解析入口，不改默认值策略"],
  ["数据与状态", "读入配置文件；输出位置与退出码 2；不新增持久状态"],
  [
    "验收",
    "通过条件：非法配置运行时输出文件位置并退出 2；失败条件：隐藏位置或退出码不是 2；" +
      "反例：把位置替换成默认值；证据：命令输出与退出码记录",
  ],
  ["风险与回退", "真实非法样例可能取不到；触发时记 incomplete；恢复条件是有可用样例"],
  ["未决", "无（错误文案措辞由用户定，期限本卡内）"],
  ["白话复述", "这一包让非法配置的错误显示在哪个文件，用户不用猜默认值。改动只碰解析入口，不动默认值。"],
  ["配套与影响", "配套调整：更新解析器测试；配套迁移：旧配置无需迁移；配套移除：移除只报默认值的分支；影响范围：所有读配置的入口"],
];

function renderCard(rows) {
  return [
    "# 方向卡（契约测试样本）",
    "",
    "| 格 | 写什么 |",
    "| --- | --- |",
    ...rows.map(([field, value]) => `| ${field} | ${value} |`),
    "",
  ].join("\n");
}

function runCard(file) {
  return spawnSync(process.execPath, [abs("skills/decision-maker/scripts/validate-card.mjs"), file], {
    cwd: root,
    encoding: "utf8",
  });
}

function combined(result) {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

test("明显漏项会报错：合格卡 0，缺验收/缺精度卡退出 1 并点名", () => {
  const directory = mkdtempSync(join(tmpdir(), "p2-card-fields-"));
  try {
    const goodCard = join(directory, "good-card.md");
    const badAcceptanceCard = join(directory, "bad-acceptance-card.md");
    const badPrecisionCard = join(directory, "bad-precision-card.md");

    writeFileSync(goodCard, renderCard(goodRows));
    writeFileSync(
      badAcceptanceCard,
      renderCard(goodRows.filter(([field]) => field !== "验收")),
    );
    writeFileSync(
      badPrecisionCard,
      renderCard(goodRows.map(([field, value]) => (field === "方案与取舍" ? [field, "按计划实现"] : [field, value]))),
    );

    const good = runCard(goodCard);
    assert.equal(
      good.status,
      0,
      `合格方向卡应退出 0，实际 ${good.status}：${combined(good).trim() || "（无输出）"}；` +
        "本样本是正控，实现不得为查精度而误拒合格卡。",
    );

    const missingAcceptance = runCard(badAcceptanceCard);
    assert.equal(
      missingAcceptance.status,
      1,
      `缺「验收」行的卡应退出 1，实际 ${missingAcceptance.status}：${combined(missingAcceptance).trim() || "（无输出）"}。`,
    );
    assert.match(
      combined(missingAcceptance),
      /验收/,
      `缺「验收」行的卡失败信息没有点名「验收」：${combined(missingAcceptance).trim() || "（无输出）"}。`,
    );

    const missingPrecision = runCard(badPrecisionCard);
    assert.equal(
      missingPrecision.status,
      1,
      `方案与取舍只写「按计划实现」的卡应退出 1，实际 ${missingPrecision.status}：` +
        `${combined(missingPrecision).trim() || "（无输出）"}；判据档字段的空话不算达到精度。`,
    );
    const precisionOutput = combined(missingPrecision);
    assert.match(
      precisionOutput,
      /精度/,
      `缺精度的卡失败信息没有点名「精度」：${precisionOutput.trim() || "（无输出）"}。`,
    );
    assert.match(
      precisionOutput,
      /方案与取舍/,
      `缺精度的卡失败信息没有点名字段「方案与取舍」：${precisionOutput.trim() || "（无输出）"}。`,
    );
  } finally {
    if (resolve(directory).startsWith(resolve(tmpdir()))) {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

test("move-map 登记字典职责、真实消费者与退役条件", () => {
  const moveMapPath = "docs/architecture/move-map.json";
  assert.ok(existsSync(abs(moveMapPath)), `缺登记文件：${moveMapPath} 不存在。`);
  const document = JSON.parse(read(moveMapPath));
  const entries = Array.isArray(document) ? document : document.entries;
  assert.ok(Array.isArray(entries), `${moveMapPath} 缺 entries 数组。`);
  const entry = entries.find(
    (item) => item && (item.source === dictionaryPath || item.destination === dictionaryPath),
  );
  assert.ok(
    entry,
    `move-map 没有登记字段字典 ${dictionaryPath}；新增文件必须先登记职责和真实消费者。`,
  );
  for (const key of ["responsibility", "owner", "consumer", "delete_condition"]) {
    assert.ok(
      typeof entry[key] === "string" && entry[key].trim(),
      `move-map 字典条目缺「${key}」；要写清职责、owner、消费者与退役条件。`,
    );
  }
  const namedReaders = Array.isArray(entry.named_data_readers) ? entry.named_data_readers : [];
  const consumerText = [entry.consumer, ...namedReaders].join("\n");
  for (const checker of checkers) {
    const basename = checker.path.split("/").at(-1);
    assert.ok(
      consumerText.includes(basename),
      `move-map 字典条目的消费者没有点名${checker.label}（${basename}）；登记必须是真实消费者。`,
    );
  }
});
