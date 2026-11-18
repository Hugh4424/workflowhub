// P1 ORACLE-MD-001: answer source class and four-grade tone stay bound to the
// original reply. The checker is advisory for old shapes; a new-shape log that
// declares source_id/modality/来源身份 must report the named code and exit
// non-zero only for those three semantic failures.
import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { runStageStepsCheck } from "../../tools/cli/check-stage-steps.mjs";
import { checkDecisionLogChain, stripLeadingMarker, fenceStep } from "../../tools/cli/check-decision-log-chain.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CLI = join(ROOT, "tools/cli/check-decision-log-chain.mjs");
const FLAGS = ["ANSWER_MODALITY_MISMATCH", "ANSWER_SOURCE_UNVERIFIABLE", "ANSWER_INFERENCE_AS_USER"];
const temporary = [];
afterEach(() => { for (const root of temporary.splice(0)) rmSync(root, { recursive: true, force: true }); });
const temp = (prefix) => { const root = mkdtempSync(join(tmpdir(), prefix)); temporary.push(root); return root; };

function taskBase() {
  const parent = temp("p1-decision-evidence-");
  const base = join(parent, "p1-fixture");
  mkdirSync(base);
  writeFileSync(join(base, "task.json"), `${JSON.stringify({
    schema_version: "1.0.0", project_name: "fixture", task_id: "p1-fixture",
    created_at: "2026-11-17T00:00:00.000Z", activation_cohort: "post",
    record_model: "vnext-single-write", execution_mode: "per_invocation",
  })}\n`);
  return base;
}

const INDEX_HEADER = "| 编号 | 来源分级 | 答复原文 | 语气 | 原件ref与行位 | 时点 | 所属包 |";
const INDEX_RULE = "| --- | --- | --- | --- | --- | --- | --- |";

function fixture({
  grade = "保存转录", quote = "允许升一次数据库结构", tone = "permit", identity = "用户答复",
  logTone = tone, logIdentity = identity, ref = "#L7-L7", line = 7,
  indexName = "requirement-index.md", pointer = `- 需求索引：quality/evidence/decision-log-refs/${indexName}`,
  indexTable, sourceName = "batch.md", logDir, omitSourceId = false, duplicate = false, bold = false, bare = false,
  relativeRef = false, headingLevel = 3, sourcePrefix = "3. ", sourcePath, sourceText, logLines, extraLines = [],
} = {}) {
  const base = taskBase();
  const source = sourcePath ?? join(base, "quality/evidence/decision-log-refs/talk", sourceName);
  if (!sourcePath) {
    mkdirSync(dirname(source), { recursive: true });
    const lines = Array.from({ length: 10 }, (_, index) => `${index + 1}. filler line`);
    lines[line - 1] = sourceText ?? `${sourcePrefix}${quote.replaceAll("\\|", "|")}`;
    writeFileSync(source, `${lines.join("\n")}\n`);
  }
  const index = join(base, "quality/evidence/decision-log-refs", indexName);
  mkdirSync(dirname(index), { recursive: true });
  writeFileSync(index, indexTable ?? [
    "# Controlled index; U-901 is a replay label, not a historical user id",
    INDEX_HEADER,
    INDEX_RULE,
    `| U-901 | ${grade} | ${quote} | ${tone} | ${relativeRef ? `talk/${sourceName}${ref}` : `${source}${ref}`} | 2026-11-12（原件） | 1 |`,
    "",
  ].join("\n"));
  const log = join(logDir ?? join(base, "specs/p1-fixture"), "decision-log.md");
  mkdirSync(dirname(log), { recursive: true });
  const marker = bare ? "" : "- ";
  const label = (name) => `${marker}${bold ? `**${name}**` : name}：`;
  writeFileSync(log, logLines ?? [
    "# Controlled replay, not a new user decision",
    `- 基准目录：${base}`,
    pointer,
    "",
    `${"#".repeat(headingLevel)} D-901 — 许可不改成义务`,
    "- 做什么：保持真实答复语气。",
    "- 不做什么：伪造用户来源。",
    "- 风险：错误引用误导下游。",
    "- 改动：答复引用机检。",
    ...(omitSourceId ? [] : [`${label("source_id")}U-901`]),
    `${label("modality")}${logTone}`,
    `${label("来源身份")}${logIdentity}`,
    ...(duplicate ? ["- source_id: U-901"] : []),
    ...extraLines,
    "",
  ].join("\n"));
  return { base, log, source, index };
}

function run(log, extra = []) {
  const result = spawnSync(process.execPath, [CLI, "--file", log, ...extra], { cwd: ROOT, encoding: "utf8", timeout: 30_000 });
  return { ...result, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

function mappedDecisionLog(base, level, tone, extra = []) {
  return [
    "# Canonical replay",
    `- 基准目录：${base}`,
    "- 需求索引：quality/evidence/decision-log-refs/requirement-index.md",
    "",
    "## 旧编号对照",
    "| 正文编号 | 旧编号 | 说明 |",
    "| --- | --- | --- |",
    "| 决定 1 | D-901 | 受控映射 |",
    "",
    `${level} 决定 1 — 许可不改成义务`,
    "- 做什么：保持原语气。",
    "- 不做什么：不伪造来源。",
    "- 风险：错引误导。",
    "- 改动：只改文本。",
    "- source_id: U-901",
    `- modality: ${tone}`,
    "- 来源身份: 用户答复",
    ...extra,
    "",
  ].join("\n");
}

describe("ORACLE-MD-P1 answer source and tone consumption", () => {
  it("keeps the four legal source classes as advisory pass", () => {
    const cases = [
      { grade: "自由手写", tone: "reject", identity: "用户答复" },
      { grade: "明确选项采纳", tone: "require", identity: "用户答复" },
      { grade: "保存转录", tone: "permit", identity: "用户答复" },
      { grade: "作者推断", tone: "recommend", identity: "作者推断" },
    ];
    for (const item of cases) {
      const result = run(fixture({ ...item, quote: `真实答复-${item.grade}` }).log);
      expect(result.status, result.output).toBe(0);
      expect(result.output).not.toMatch(new RegExp(FLAGS.join("|")));
    }
  });

  it("reports ORACLE-P1-MODALITY when an allowed reply is cited as a requirement", () => {
    const result = run(fixture({ grade: "保存转录", logTone: "require" }).log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_MODALITY_MISMATCH");
  });

  it("reports ORACLE-P1-REAL-REFERENCE when the cited line is not the reply", () => {
    const result = run(fixture({ line: 7, ref: "#L5-L5" }).log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_SOURCE_UNVERIFIABLE");
  });

  it("reports ORACLE-P1-INFERENCE-AS-USER when an inference claims user authority", () => {
    const result = run(fixture({
      grade: "作者推断", quote: "作者推断：应先保留原件再讨论。", tone: "recommend", identity: "作者推断", logIdentity: "用户答复",
    }).log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_INFERENCE_AS_USER");
  });

  it("reports a partial source contract instead of skipping the block", () => {
    const result = run(fixture({ omitSourceId: true }).log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_SOURCE_UNVERIFIABLE");
    expect(result.output).toContain("source_id");
  });

  it("rejects empty, truncated, and invalid-line quotes", () => {
    for (const item of [
      { quote: "" },
      { quote: "升一次数据库结构", sourceText: "3. 允许升一次数据库结构" },
      { quote: "允许升一次数据库结构", sourceText: "3. 允许升一次数据库结构，旧数据兼容。后果：迁移失败会读不回旧条目，先用隔离库验。" },
      { ref: "#L0-L0", line: 0 },
    ]) {
      const result = run(fixture(item).log);
      expect(result.status, result.output).toBe(1);
      expect(result.output).toContain("ANSWER_SOURCE_UNVERIFIABLE");
    }
  });

  it("keeps a reply containing an escaped table pipe", () => {
    const result = run(fixture({ quote: "允许 A\\|B 升级" }).log);
    expect(result.status, result.output).toBe(0);
    expect(result.output).not.toMatch(new RegExp(FLAGS.join("|")));
  });

  it("rejects multiple reply groups instead of consuming the first one", () => {
    const result = run(fixture({ duplicate: true }).log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_SOURCE_UNVERIFIABLE");
  });

  it("resolves an index named by date and topic relative to decision-log-refs", () => {
    const legal = fixture({ indexName: "2026-11-17-answer-index.md", pointer: "- 需求索引：2026-11-17-answer-index.md" });
    expect(run(legal.log).status).toBe(0);
    const changed = fixture({ indexName: "2026-11-17-answer-index.md", pointer: "- 需求索引：2026-11-17-answer-index.md", logTone: "require" });
    const result = run(changed.log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_MODALITY_MISMATCH");
  });

  it("downgrades an old-column index to a shape difference", () => {
    const indexTable = [
      "# old shape",
      "| 编号 | 类型 | 逐字原话 | 来源 | 工作包落点 |",
      "| --- | --- | --- | --- | --- |",
      "| U-901 | 保存转录 | 允许升一次数据库结构 | batch | 1 |",
      "",
    ].join("\n");
    const result = run(fixture({ indexTable }).log);
    expect(result.status, result.output).toBe(0);
    expect(result.output).toContain("legacy_requirement_index_shape");
    expect(result.output).not.toMatch(new RegExp(FLAGS.join("|")));
  });

  it("accepts path:line, bold, bare bold, and decision-log-refs relative refs", () => {
    for (const item of [{ ref: ":7" }, { ref: ":7-7" }, { bold: true }, { bold: true, bare: true }, { relativeRef: true }]) {
      const result = run(fixture(item).log);
      expect(result.status, result.output).toBe(0);
      expect(result.output).not.toMatch(new RegExp(FLAGS.join("|")));
    }
  });

  it("accepts a complete sentence at h3/h4 with all four line-position forms", () => {
    for (const headingLevel of [3, 4]) {
      for (const ref of ["#L7-L7", "#L7", ":7", ":7-7"]) {
        const result = run(fixture({ headingLevel, ref }).log);
        expect(result.status, result.output).toBe(0);
        expect(result.output).not.toMatch(new RegExp(FLAGS.join("|")));
      }
    }
  });

  it("accepts every leading numbering form once and does not strip body numbers", () => {
    for (const sourcePrefix of ["3. ", "3、", "3) ", "3）", "（3）", "(3) "]) {
      const result = run(fixture({ sourcePrefix }).log);
      expect(result.status, `${sourcePrefix}: ${result.output}`).toBe(0);
    }
    const bodyNumber = run(fixture({ sourcePrefix: "3. （3）", quote: "允许升一次数据库结构" }).log);
    expect(bodyNumber.status, bodyNumber.output).toBe(1);
    expect(bodyNumber.output).toContain("ANSWER_SOURCE_UNVERIFIABLE");
  });

  it("reads mapped 决定 N blocks at h3/h4 and checks their tone", () => {
    for (const level of ["###", "####"]) {
      const legal = fixture({});
      writeFileSync(legal.log, mappedDecisionLog(legal.base, level, "permit"));
      expect(run(legal.log).status).toBe(0);
      const changed = fixture({});
      writeFileSync(changed.log, mappedDecisionLog(changed.base, level, "require"));
      const result = run(changed.log);
      expect(result.status, result.output).toBe(1);
      expect(result.output).toContain("ANSWER_MODALITY_MISMATCH");
    }
  });

  it("reports a non-canonical h2 决定 N heading instead of silently skipping it", () => {
    const f = fixture({});
    writeFileSync(f.log, mappedDecisionLog(f.base, "###", "permit", [
      "",
      "## 决定 2 — 非规范层级",
      "- 做什么：这不该被当作决定块。",
      "- source_id: U-901",
      "- modality: require",
      "- 来源身份: 用户答复",
    ]));
    const result = run(f.log);
    expect(result.status, result.output).toBe(0);
    expect(result.output).toContain("non_canonical_decision_heading");
    expect(result.output).not.toContain("ANSWER_MODALITY_MISMATCH");
  });

  it("does not treat a fenced 旧编号对照 as the mapping section", () => {
    const f = fixture({});
    writeFileSync(f.log, [
      "# Fenced mapping",
      `- 基准目录：${f.base}`,
      "```markdown",
      "## 旧编号对照",
      "| 决定 1 | D-901 |",
      "```",
      "",
      "### 决定 1 — unmapped",
      "- 做什么：保持原语气。",
      "- 不做什么：不伪造来源。",
      "- 风险：错引误导。",
      "- 改动：只改文本。",
      "",
    ].join("\n"));
    const result = run(f.log);
    expect(result.status, result.output).toBe(0);
    expect(result.output).toContain("no decision entries");
  });

  it("ignores fenced examples when deciding the source contract and pointer", () => {
    const ignored = fixture({ logLines: [
      "# Controlled replay",
      "```markdown",
      "- source_id: U-999",
      "```",
      "",
    ].join("\n") });
    expect(run(ignored.log).status).toBe(0);

    const mixed = fixture({ extraLines: ["```markdown", "- 需求索引：bogus-index.md", "- source_id: U-999", "```"] });
    const result = run(mixed.log);
    expect(result.status, result.output).toBe(0);
    expect(result.output).not.toContain("bogus-index");
  });

  it("requires --file when --source-root is given", () => {
    const foreign = temp("p1-source-root-alone-");
    const result = spawnSync(process.execPath, [CLI, "--source-root", foreign], { cwd: ROOT, encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("requires --file");
  });

  it("rejects a log outside Git whose parent would authorize unrelated siblings", () => {
    const loose = temp("p1-loose-");
    const outside = join(loose, "reply.md");
    writeFileSync(outside, "3. 允许升一次数据库结构\n");
    const result = run(fixture({ logDir: loose, sourcePath: outside, ref: "#L1-L1", line: 1 }).log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_SOURCE_UNVERIFIABLE");
  });

  it("authorizes an external original only through --source-root", () => {
    const foreign = temp("p1-foreign-");
    const source = join(foreign, "reply.md");
    writeFileSync(source, "3. 允许升一次数据库结构\n");
    const { log } = fixture({ sourcePath: source, ref: "#L1-L1", line: 1 });
    expect(run(log).status).toBe(1);
    const allowed = run(log, ["--source-root", foreign]);
    expect(allowed.status, allowed.output).toBe(0);
    const combined = spawnSync(process.execPath, [CLI, "--root", ROOT, "--source-root", foreign], { cwd: ROOT, encoding: "utf8" });
    expect(combined.status).toBe(1);
    expect(combined.stderr).toContain("cannot be combined");
  });

  it("rejects a real symlink that escapes the authorized root", () => {
    const foreign = temp("p1-symlink-target-");
    const target = join(foreign, "reply.md");
    const lines = Array.from({ length: 10 }, (_, index) => `${index + 1}. filler line`);
    lines[6] = "3. 允许升一次数据库结构";
    writeFileSync(target, `${lines.join("\n")}\n`);
    const { source, log } = fixture({});
    rmSync(source);
    symlinkSync(target, source);
    const result = run(log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_SOURCE_UNVERIFIABLE");
    expect(result.output).not.toContain("Node.js v");
  });

  it("rejects traversal and unreadable declared sources without a stack", () => {
    const traversal = fixture({});
    writeFileSync(traversal.index, readFileSync(traversal.index, "utf8").replace(`${traversal.source}#L7-L7`, "../escape.md#L1-L1"));
    const escaped = run(traversal.log);
    expect(escaped.status, escaped.output).toBe(1);
    expect(escaped.output).toContain("ANSWER_SOURCE_UNVERIFIABLE");
    expect(escaped.output).not.toContain("Node.js v");

    const missing = fixture({});
    rmSync(missing.source);
    const absent = run(missing.log);
    expect(absent.status, absent.output).toBe(1);
    expect(absent.output).toContain("ANSWER_SOURCE_UNVERIFIABLE");
  });

  it("keeps a legal old-shape log at exit 0", () => {
    const archived = join(ROOT, "specs/archive/workflowhub-ui-frontend-c12-acceptance-20261114/decision-log.md");
    const result = run(archived);
    expect(result.status, result.output).toBe(0);
    expect(result.output).not.toMatch(new RegExp(FLAGS.join("|")));
  });

  it("reads unmapped 决定 N blocks when the material declares 旧编号对照", () => {
    const loose = temp("p1-t03-shape-");
    const log = join(loose, "decision-log.md");
    writeFileSync(log, [
      "# Controlled t03 heading shape",
      "## 旧编号对照",
      "| 正文编号 | 机器编号 | 说明 |",
      "| --- | --- | --- |",
      "| 决定 1–14 | 决定 1–14 | 早期范围 |",
      "",
      "### 决定 17：AC 把许可写成义务",
      "- **做什么**：保留真实答复语气。",
      "- **不做什么**：不把允许写成必须。",
      "- **风险**：错引误导下游。",
      "- **改动**：只改方法文本。",
      "",
    ].join("\n"));
    const result = run(log);
    expect(result.status, result.output).toBe(0);
    expect(result.output).not.toContain("no decision entries");
  });
});

// P5 ORACLE-MD-005: a converged package in a full ledger (>=3 packages) must
// bind a readable chat receipt, its discussion batch and design order; a self
// report ("已发") is not evidence; 「无（交接/未测）」 is not none; a deferred
// item under 已收敛 is unconverged.

const p5Sha = (text) => createHash("sha256").update(text).digest("hex");

function p5Fixture({ packages = 3, format = 'five', batchFor = (id) => `batch-${id}`, chatFor = () => false, realQaFor = () => true, orderFor = () => false, deferFor = () => false, deferValue, cardsExtra = '', pendingFor = () => "无" } = {}) {
  const root = temp("p5-stage-steps-");
  const task = join(root, "task");
  const materials = join(root, "materials");
  const put = (base, name, value) => {
    const path = join(base, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, value);
  };
  put(task, "task.json", JSON.stringify({ schema_version: "1.0.0", task_id: "task", target_repo_root: ROOT, baseline_commit: "HEAD", activation_cohort: "post" }));
  put(task, "facts.jsonl", "");
  put(materials, "phases/index.md", "# Index\n");
  const decision = ["# Controlled", "## 级别与路线", "- 推荐级别：复杂"];
  const rows = [];
  const sections = [];
  for (let id = 1; id <= packages; id += 1) {
    decision.push(`#### WP${id} — controlled`, `- **结果与消费者**：受控结果；消费者是 consumer。`);
    const cards = `quality/evidence/convergence/cards-${id}.md`;
    const card = `## 工作包 ${id}：受控包 ${id}\n\n一句话结果：受控结果。`;
    const coldRef = `quality/evidence/cold-read-p${id}.md`;
    const cold = `# 受控冷读 ${id}\n\n- 读者：subagent:reader-${id}，未参与本包写作，只读本包卡。\n- 读的卡：\`${cards}#工作包-${id}\`，节摘要 sha256 \`${p5Sha(card)}\`。\n- 五问原答：\n① 改什么：受控改动。\n② 为什么：受控理由。\n③ 边界：受控边界。\n④ 怎么验：受控验证。\n⑤ 还有什么没定：无。\n- 结论：五问全答出；本包收敛。\n`;
    put(task, cards, `${card}${cardsExtra}`);
    put(task, coldRef, cold);
    const batch = batchFor(id);
    const discussion = `工作包 ${id} 讨论原件\n\n讨论前展示：已给十格卡。\n复述：受控复述。\n用户原话：可以。\n批次：${batch}\n`;
    const discussionRef = `quality/evidence/talk/discussion-p${id}.md`;
    put(task, discussionRef, discussion);
    let chatLine = "聊天展示：已发十格卡。";
    if (chatFor(id)) {
      const receipt = `工作包 ${id} 聊天回执\n\n批次：${batch}\n卡：工作包 ${id}\n`;
      const receiptRef = `quality/evidence/talk/chat-p${id}.md`;
      put(task, receiptRef, receipt);
      chatLine = `聊天回执：\`${receiptRef}\`；sha256 \`${p5Sha(receipt)}\`；批次 ${batch}；卡 \`${cards}#工作包-${id}\`；sha256 \`${p5Sha(card)}\``;
    }
    const marks = [chatLine];
    if (orderFor(id)) marks.push("先设计后提问：先给设计稿，只有真歧义才问。");
    if (deferFor(id)) marks.push("可推迟：性能镜头推迟，owner=后续阶段，最迟承接=终末验收。");
    if (deferValue !== undefined) marks.push(`可推迟：${deferValue}`);
    rows.push(format === 'ten'
      ? `| ${id} | D-00${id} | D-00${id} | D-00${id} | AC-01 | D-00${id} | 无 | consumer | ${pendingFor(id)} | 已收敛 | 已答 | 已答 | 已答 | 已答 | 已答 |`
      : `| ${id} | 已收敛 | 本文件“工作包 ${id}” | evidence-${id} | ${pendingFor(id)} |`);
    sections.push([
      `## 工作包 ${id}：受控包 ${id}`, "",
      "### 五段过程", "", "| 段 | 结论 | 原件指针 | 批次 |", "| --- | --- | --- | --- |",
      `| 调研 | 已有 | \`quality/evidence/research.md\` | ${batch} |`,
      `| 发散 | 已做 | \`quality/evidence/research.md\` | ${batch} |`,
      `| 收敛 | 已收敛 | \`quality/evidence/decision-log-refs/convergence-checklist.md\` | ${batch} |`,
      `| 就地讨论 | 已确认 | \`${discussionRef}\` | ${batch} |`,
      `| 定验收 | 已定 | \`quality/evidence/coverage-matrix-5d.md\` | ${batch} |`, "",
      "### 收敛格（本轮）", "", "| 项 | 值 |", "| --- | --- |",
      `| 当前卡节 | \`${cards}#工作包-${id}\`；sha256 \`${p5Sha(card)}\` |`,
      `| 当前冷读 | \`${coldRef}\`；sha256 \`${p5Sha(cold)}\`；读者 subagent:reader-${id}；context=none |`,
      `| 首轮冷读 | \`${coldRef}\`；sha256 \`${p5Sha(cold)}\`；读者 subagent:reader-${id} |`,
      "| 修订 | 无 |", "",
      `### 冷读记录（P${id}）`, "",
      `- 读者：subagent:reader-${id}，未参与本包写作，只读本包卡。`,
      "- 五问原答：", "① 改什么：受控改动。", "② 为什么：受控理由。", "③ 边界：受控边界。", "④ 怎么验：受控验证。", "⑤ 还有什么没定：无。",
      "- 结论：五问全答出；本包收敛。", "",
      "### 8 项证据指针", "",
      "1. 原始需求：`quality/evidence/requirement-index.md`。",
      "2. 调研结论：`quality/evidence/research.md`。",
      ...(realQaFor(id) ? [`3. 真实问答：\`quality/evidence/talk/chat-p${id}.md\`。`] : []),
      `4. 当前方案卡：\`${cards}#工作包-${id}\`，节 sha256 \`${p5Sha(card)}\`。`,
      `5. 当前冷读：\`${coldRef}\`，sha256 \`${p5Sha(cold)}\`，读者 subagent:reader-${id}。`,
      `6. 复读对照：首轮 \`${coldRef}\`（sha256 \`${p5Sha(cold)}\`，读者 subagent:reader-${id}）→ 本轮。`,
      "7. 验收：`quality/evidence/coverage-matrix-5d.md` 的 AC-01。",
      "8. 审查处置：`quality/reviews/direction.json`。", "",
      ...marks, "",
    ].join("\n"));
  }
  decision.push("清单：`quality/evidence/decision-log-refs/convergence-checklist.md`", "");
  put(materials, "decision-log.md", decision.join("\n"));
  put(task, "quality/evidence/decision-log-refs/convergence-checklist.md", [
    "# 收敛清单", "",
    ...(format === 'ten'
      ? ["| 包 | 目标 | 边界 | 方案与取舍 | 验收 | 风险 | 依赖 | 消费者 | 未决/无 | 状态 | 目标与成功意图 | 范围与旅程 | 数据与状态 | 成功失败验收 | 约束非目标与风险 |",
         "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
      : ["| 包 | 状态 | 五段表位置 | 证据 | 未决 |", "| --- | --- | --- | --- | --- |"]),
    ...rows, "", ...sections,
  ].join("\n"));
  return { task, materials };
}

const p5Check = (fixture) => runStageStepsCheck({ taskPath: fixture.task, materialRoot: fixture.materials, repoRoot: ROOT, stage: "make-decision" });

describe("P5 stage-steps evidence gaps", () => {
  it("names a self-reported chat, missing design order and a missing real-qa pointer", () => {
    const report = p5Check(p5Fixture({ realQaFor: (id) => id !== 1, orderFor: () => false }));
    expect(report.convergence.gaps).toEqual(expect.arrayContaining([
      "1：聊天呈现未取得", "1：先设计后提问缺证", "1：缺真实问答指针",
    ]));
  });
  it("accepts a readable chat receipt and explicit design order", () => {
    const report = p5Check(p5Fixture({ chatFor: () => true, orderFor: () => true }));
    for (const gap of ["1：聊天呈现未取得", "1：先设计后提问缺证", "1：缺真实问答指针"]) {
      expect(report.convergence.gaps).not.toContain(gap);
    }
  });
  it("does not accept 已发/已展示 self report as chat evidence", () => {
    const report = p5Check(p5Fixture({ chatFor: () => false, orderFor: () => true }));
    expect(report.convergence.gaps).toContain("1：聊天呈现未取得");
  });
  it("treats 无（交接/未测） as unconverged but accepts 无（理由…）", () => {
    const bad = p5Check(p5Fixture({ pendingFor: (id) => (id === 1 ? "无（C05-P3 归 C12）" : "无") }));
    expect(bad.convergence.gaps).toContain("未收敛：1");
    const good = p5Check(p5Fixture({ pendingFor: () => "无（理由：本包无未决）" }));
    expect(good.convergence.gaps.some((gap) => gap === "未收敛：1")).toBe(false);
  });
  it("treats a deferred item under 已收敛 as unconverged", () => {
    const report = p5Check(p5Fixture({ deferFor: (id) => id === 1, chatFor: () => true, orderFor: () => true }));
    expect(report.convergence.gaps).toContain("未收敛：1");
  });
  it("names one batch shared by all packages", () => {
    const report = p5Check(p5Fixture({ batchFor: () => "007", chatFor: () => true, orderFor: () => true }));
    expect(report.convergence.gaps).toContain("跨包合批：批次 007 被包 1、2、3 共用");
  });
  it("hashes only the declared card section in a multi-section cards file", () => {
    const report = p5Check(p5Fixture({ chatFor: () => true, orderFor: () => true, cardsExtra: "\n## 工作包 99：其他\n\n无关字节。\n" }));
    expect(report.convergence.gaps).not.toContain("1：聊天呈现未取得");
  });
  it("strips one parenthetical suffix and trailing punctuation from batches", () => {
    const report = p5Check(p5Fixture({ batchFor: () => "batch-001（同批）。", chatFor: () => true, orderFor: () => true }));
    expect(report.convergence.gaps).toContain("跨包合批：批次 batch-001 被包 1、2、3 共用");
  });
  it("treats 可推迟：无 as none but 可推迟：X as unconverged", () => {
    const none = p5Check(p5Fixture({ chatFor: () => true, orderFor: () => true, deferValue: "无" }));
    expect(none.convergence.gaps.some((gap) => gap === "未收敛：1")).toBe(false);
    const some = p5Check(p5Fixture({ chatFor: () => true, orderFor: () => true, deferValue: "性能镜头，owner=后续" }));
    expect(some.convergence.gaps).toContain("未收敛：1");
  });
  it("applies the strict package checks to a ten-column ledger too", () => {
    const report = p5Check(p5Fixture({ format: 'ten', chatFor: () => false, orderFor: () => true }));
    expect(report.convergence.gaps).toContain("1：聊天呈现未取得");
  });
  it("keeps a clean full package set free of other gaps", () => {
    const report = p5Check(p5Fixture({ chatFor: () => true, orderFor: () => true }));
    expect(report.convergence.gaps).toEqual([]);
  });
});

// P8 ORACLE-MD-007: named missing evidence must reach the CLI exit; numbering
// and ~~~ fences must not create false source failures.
describe("ORACLE-MD-007 checker exit and shape boundaries", () => {
  function stageFixture({ withCold = true } = {}) {
    const root = temp("p8-exit-");
    const task = join(root, "task");
    const materials = join(root, "materials");
    const put = (base, name, value) => {
      const path = join(base, name);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, value);
    };
    put(task, "task.json", JSON.stringify({ schema_version: "1.0.0", task_id: "task", target_repo_root: ROOT, baseline_commit: "HEAD", activation_cohort: "post" }));
    put(task, "facts.jsonl", "");
    put(materials, "phases/index.md", "# Index\n");
    put(materials, "decision-log.md", [
      "# Controlled", "## 级别与路线", "- 推荐级别：复杂",
      "#### WP1 — controlled", "- **结果与消费者**：受控；消费者是 consumer。",
      "清单：`quality/evidence/decision-log-refs/convergence-checklist.md`", "",
    ].join("\n"));
    const card = "## 工作包 1：受控包 1\n\n一句话结果：受控结果。";
    put(task, "quality/evidence/convergence/cards.md", card);
    const cold = `# 受控冷读 1\n\n- 读者：subagent:reader-1，未参与本包写作，只读本包卡。\n- 读的卡：\`quality/evidence/convergence/cards.md#工作包-1\`，节摘要 sha256 \`${p5Sha(card)}\`。\n- 五问原答：\n① 改什么：改。\n② 为什么：因。\n③ 边界：界。\n④ 怎么验：验。\n⑤ 还有什么没定：无。\n- 结论：五问全答出；本包收敛。\n`;
    if (withCold) put(task, "quality/evidence/cold-read-p1.md", cold);
    const coldRef = withCold ? "quality/evidence/cold-read-p1.md" : "quality/evidence/missing-cold-read-p1.md";
    const coldLine = withCold
      ? `| 当前冷读 | \`${coldRef}\`；sha256 \`${p5Sha(cold)}\`；读者 subagent:reader-1；context=none |`
      : null;
    put(task, "quality/evidence/decision-log-refs/convergence-checklist.md", [
      "# 收敛清单", "",
      "| 包 | 状态 | 五段表位置 | 证据 | 未决 |", "| --- | --- | --- | --- | --- |",
      "| 1 | 已收敛 | 本文件“工作包 1” | evidence-1 | 无 |", "",
      "## 工作包 1：受控包 1", "", "### 收敛格（本轮）", "", "| 项 | 值 |", "| --- | --- |",
      `| 当前卡节 | \`quality/evidence/convergence/cards.md#工作包-1\`；sha256 \`${p5Sha(card)}\` |`,
      ...(coldLine ? [coldLine] : []),
      "### 冷读记录（P1）", "",
      "- 读者：subagent:reader-1，未参与本包写作，只读本包卡。",
      "- 五问原答：", "① 改什么：改。", "② 为什么：因。", "③ 边界：界。", "④ 怎么验：验。", "⑤ 还有什么没定：无。",
      "- 结论：五问全答出；本包收敛。", "",
    ].join("\n"));
    return { task, materials };
  }
  const run = ({ task, materials }) => spawnSync(process.execPath, [join(ROOT, "tools/cli/check-stage-steps.mjs"), `--task-path=${task}`, `--material-root=${materials}`, `--repo-root=${ROOT}`, "--stage=make-decision", "--json"], { encoding: "utf8" });
  it("exits non-zero when a converged package declares an unreadable cold-read original", () => {
    const result = run(stageFixture({ withCold: false }));
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("缺冷读原件");
  });
  it("keeps a complete controlled package at exit 0", () => {
    const result = run(stageFixture());
    expect(result.status).toBe(0);
  });
  it("keeps version-like prefixes when stripping one list marker", () => {
    expect(stripLeadingMarker("3.14 是圆周率")).toBe("3.14 是圆周率");
    expect(stripLeadingMarker("2026.11 发布")).toBe("2026.11 发布");
    expect(stripLeadingMarker("3. 是列表")).toBe("是列表");
  });
  it("closes a fence only on a fence-only line", () => {
    const open = { char: "`", length: 3 };
    expect(fenceStep("```js", open)).toBe(open);
    expect(fenceStep("```", open)).toBe(null);
  });
  it("does not strip version-like leading numbers as list markers", () => {
    const root = temp("p8-number-");
    const talk = join(root, "talk.md");
    writeFileSync(talk, "3.14 是圆周率\n");
    const index = [INDEX_HEADER, INDEX_RULE, `| U-1 | 自由手写 | 3.14 是圆周率 | permit | \`${talk}#L1-L1\` | 2026-11-18 | 1 |`].join("\n");
    const doc = ["# Controlled", "### D-001 — controlled", "- 做什么：读文本。", "- 不做什么：不改。", "- 风险：误报。", "- 改动：方法。", "- source_id: U-1", "- modality: permit", "- 来源身份：用户答复"].join("\n");
    const result = checkDecisionLogChain({ markdown: doc, source_ref: "controlled/decision-log.md", requirement_index_markdown: index, read_source: ref => readFileSync(String(ref).split("#")[0], "utf8") });
    expect(result.warnings.map(warning => warning.code)).not.toContain("ANSWER_SOURCE_UNVERIFIABLE");
  });
  it("does not close a longer fence on an info-string line", () => {
    const markdown = ["# Controlled", "## 旧编号对照", "| 正文编号 | 机器编号 | 说明 |", "| --- | --- | --- |", "| 决定 1 | 决定 1 | x |", "", "~~~", "```js", "### D-070 — 围栏内", "~~~", ""].join("\n");
    const result = checkDecisionLogChain({ markdown, source_ref: "controlled/decision-log.md", requirement_index_markdown: "", read_source: () => "" });
    expect(result.warnings.map(warning => warning.code)).toContain("no_decision_entries");
  });
  it("does not read decision headings inside ~~~ fences", () => {
    const markdown = ["# Controlled", "## 旧编号对照", "| 正文编号 | 机器编号 | 说明 |", "| --- | --- | --- |", "| 决定 1 | 决定 1 | x |", "", "~~~", "## 决定 1：围栏内", "~~~", ""].join("\n");
    const result = checkDecisionLogChain({ markdown, source_ref: "controlled/decision-log.md", requirement_index_markdown: "", read_source: () => "" });
    expect(result.warnings.map(warning => warning.code)).toContain("no_decision_entries");
  });
});

describe("P10 UI source slot on the template shape", () => {
  function uiFixture({ question = true, answer = true, taskId = "ui-task" } = {}) {
    const root = temp("p10-ui-"), task = join(root, "task"), materials = join(root, "materials");
    const put = (base, name, value) => { const file = join(base, name); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, value); };
    put(task, "task.json", JSON.stringify({ schema_version: "1.0.0", task_id: "ui-task", target_repo_root: ROOT, baseline_commit: "HEAD", activation_cohort: "post" }));
    put(task, "facts.jsonl", "");
    put(materials, "phases/index.md", "# Index\n");
    const tuple = ["request_user_input_async", "call_ui_1", 0];
    put(task, "quality/evidence/ui-question.md", ["# 问题原件", "批次类型：UI批次。", `questionItemId=${JSON.stringify(tuple)}`, "axis: design_source", "## 问题原文", "有稿还是无稿？"].join("\n"));
    put(task, "quality/evidence/ui-answer.md", ["# 答复原件", "批次类型：UI批次。", `questionItemId=${JSON.stringify(tuple)}`, `task_id：${taskId}`, "## 用户答复原文", "沿用现有页面。"].join("\n"));
    put(materials, "decision-log.md", ["# Controlled", "## 级别与路线", "- 推荐级别：复杂", "## UI 范围与设计基准", "", "| 项 | 当前事实 |", "| --- | --- |", "| 是不是 UI | 是；raw_requirement 为页面内容可达 |", "| 页面、路由与组件 | /overview |", "| 设计源、提供者 | 沿用现有页面 |", "| 验收基准 | 原页面 |", "| 缺什么与风险 | 无 |", "", `UI设计源问题原件：\`${question ? "quality/evidence/ui-question.md" : "quality/evidence/missing-question.md"}\``, `UI设计源答复原件：\`${answer ? "quality/evidence/ui-answer.md" : "quality/evidence/missing-answer.md"}\``, ""].join("\n"));
    return { task, materials };
  }
  const stepOne = (fixture, stage) => runStageStepsCheck({ taskPath: fixture.task, materialRoot: fixture.materials, repoRoot: ROOT, stage }).stages.find(row => row.stage === stage)?.steps.find(step => step.step_id === 1);
  it("reports the named question gap on the template card shape", () => {
    const step = stepOne(uiFixture({ question: false }), "make-decision");
    expect(step.gap).toContain("UI设计源首问：问题原件未取得");
    expect(step.state).toBe("incomplete");
  });
  it("keeps a bound template-shaped card free of the UI gap", () => {
    const step = stepOne(uiFixture(), "make-decision");
    expect(step.gap).not.toContain("UI设计源首问");
  });
  it("reports a mismatched reply task_id", () => {
    const step = stepOne(uiFixture({ taskId: "other-task" }), "make-decision");
    expect(step.gap).toContain("UI设计源首问：答复任务/批次/调用不匹配");
    expect(step.state).toBe("incomplete");
  });
  it("does not apply the make-decision UI slot to build-code step 1", () => {
    const step = stepOne(uiFixture({ question: false }), "build-code");
    expect(step?.gap ?? "").not.toContain("UI设计源首问");
  });
});

// P11 final consumers: these run against a real task only when its root is
// provided (the card's final replay command exports P11_TASK_PATH); without it
// they stay visibly skipped instead of inventing page facts.
const P11_TASK = process.env.P11_TASK_PATH;
const P11_REPORT = process.env.P11_REPORT_PATH;
describe("ORACLE-MD-P11-FINAL page and terminal consumption", () => {
  it.skipIf(!P11_TASK || !P11_REPORT)("ORACLE-MD-P11-FINAL consumes a real page report and names page mismatches", async () => {
    const { checkPageContent } = await import("../../skills/answer-as-page/scripts/check-page-content.mjs");
    const result = await checkPageContent({ taskPath: P11_TASK, reportPath: P11_REPORT });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.task).toBeTruthy();
  });
  it.skipIf(!P11_TASK || !P11_REPORT)("ORACLE-MD-011 keeps task, stage and ring fields derived from the same task", async () => {
    const { buildPageData } = await import("../../skills/answer-as-page/scripts/build-page-data.mjs");
    const { pageData, report } = await buildPageData({ taskPath: P11_TASK, reportPath: P11_REPORT });
    const manifest = JSON.parse(readFileSync(join(P11_TASK, "task.json"), "utf8"));
    expect(pageData.task).toBeTruthy();
    expect(pageData.taskIdentity).toContain(manifest.task_id);
    expect(pageData.stageLabel).toBeTruthy();
    expect(report.rings.length).toBeGreaterThan(0);
    expect(pageData.objects.filter(object => object.kind === "wp").length).toBeGreaterThan(0);
  });
});
