// P1 ORACLE-MD-001: answer source class and four-grade tone stay bound to the
// original reply. The checker is advisory for old shapes; a new-shape log that
// declares source_id/modality/来源身份 must report the named code and exit
// non-zero only for its named semantic failures (the P1 three plus the P2
// self-reference code).
import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { runStageStepsCheck } from "../../tools/cli/check-stage-steps.mjs";
import { checkDecisionLogChain, stripLeadingMarker, fenceStep } from "../../tools/cli/check-decision-log-chain.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CLI = join(ROOT, "tools/cli/check-decision-log-chain.mjs");
const FLAGS = ["ANSWER_MODALITY_MISMATCH", "ANSWER_SOURCE_UNVERIFIABLE", "ANSWER_INFERENCE_AS_USER", "ANSWER_SOURCE_SELF_REFERENCE"];
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
    const batch = batchFor(id);
    const identity = `任务=task；包=${id}；批次=${batch}；卡节sha256=${p5Sha(card)}`;
    const cold = `# 受控冷读 ${id}\n\n- 读者：subagent:reader-${id}，未参与本包写作，只读本包卡。\n- 读的卡：\`${cards}#工作包-${id}\`，节摘要 sha256 \`${p5Sha(card)}\`。\n- 五问原答：\n① 改什么：受控改动。\n② 为什么：受控理由。\n③ 边界：受控边界。\n④ 怎么验：受控验证。\n⑤ 还有什么没定：无。\n- 结论：五问全答出；本包收敛。\n${identity}\n`;
    put(task, cards, `${card}${cardsExtra}`);
    put(task, coldRef, cold);
    const packageEvidence = `quality/evidence/convergence/package-evidence-${id}.md`;
    put(task, packageEvidence, `包 ${id} 的真实原件字节。\n`);
    const discussion = `工作包 ${id} 讨论原件\n\n讨论前展示：已给十格卡。\n复述：受控复述。\n用户原话：可以。\n批次：${batch}\n${identity}\n`;
    const discussionRef = `quality/evidence/talk/discussion-p${id}.md`;
    put(task, discussionRef, discussion);
    const adversarialRef = `quality/evidence/talk/adversarial-p${id}.md`;
    put(task, adversarialRef, `# 对抗 ${id}\n\n九问与处置：受控。\n${identity}\n`);
    const answerRef = `quality/evidence/talk/answer-p${id}.md`;
    put(task, answerRef, `# 真实答复 ${id}\n\n用户原话：可以。\n${identity}\n`);
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
      : `| ${id} | 已收敛 | 本文件“工作包 ${id}” | \`${packageEvidence}\` | ${pendingFor(id)} |`);
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
      `### 包 ${id} 五件同包原件`, "",
      `- 当前方案卡：\`${cards}#工作包-${id}\`；包=${id}；批次=${batch}；卡节sha256=${p5Sha(card)}`,
      `- 当前质询：\`${discussionRef}\`；任务=task；包=${id}；批次=${batch}；卡节sha256=${p5Sha(card)}`,
      `- 当前冷读：\`${coldRef}\`；任务=task；包=${id}；批次=${batch}；卡节sha256=${p5Sha(card)}`,
      `- 当前对抗：\`${adversarialRef}\`；任务=task；包=${id}；批次=${batch}；卡节sha256=${p5Sha(card)}`,
      `- 当前真实答复：\`${answerRef}\`；任务=task；包=${id}；批次=${batch}；卡节sha256=${p5Sha(card)}`, "",
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
    put(task, "quality/evidence/convergence/package-evidence-1.md", "包 1 的真实原件字节。\n");
    const cold = `# 受控冷读 1\n\n- 读者：subagent:reader-1，未参与本包写作，只读本包卡。\n- 读的卡：\`quality/evidence/convergence/cards.md#工作包-1\`，节摘要 sha256 \`${p5Sha(card)}\`。\n- 五问原答：\n① 改什么：改。\n② 为什么：因。\n③ 边界：界。\n④ 怎么验：验。\n⑤ 还有什么没定：无。\n- 结论：五问全答出；本包收敛。\n`;
    const identity = `任务=task；包=1；批次=batch-1；卡节sha256=${p5Sha(card)}`;
    const coldBytes = `${cold}\n${identity}\n`;
    if (withCold) put(task, "quality/evidence/cold-read-p1.md", coldBytes);
    const coldRef = withCold ? "quality/evidence/cold-read-p1.md" : "quality/evidence/missing-cold-read-p1.md";
    put(task, "quality/evidence/talk/discussion-p1.md", `工作包 1 讨论原件\n\n讨论前展示：已给卡。\n复述：受控。\n用户原话：可以。\n批次：batch-1\n${identity}\n`);
    put(task, "quality/evidence/talk/adversarial-p1.md", `# 对抗 1\n\n九问与处置：受控。\n${identity}\n`);
    put(task, "quality/evidence/talk/answer-p1.md", `# 真实答复 1\n\n用户原话：可以。\n${identity}\n`);
    const coldLine = withCold
      ? `| 当前冷读 | \`${coldRef}\`；sha256 \`${p5Sha(coldBytes)}\`；读者 subagent:reader-1；context=none |`
      : null;
    put(task, "quality/evidence/decision-log-refs/convergence-checklist.md", [
      "# 收敛清单", "",
      "| 包 | 状态 | 五段表位置 | 证据 | 未决 |", "| --- | --- | --- | --- | --- |",
      "| 1 | 已收敛 | 本文件“工作包 1” | `quality/evidence/convergence/package-evidence-1.md` | 无 |", "",
      "## 工作包 1：受控包 1", "", "### 收敛格（本轮）", "", "| 项 | 值 |", "| --- | --- |",
      `| 当前卡节 | \`quality/evidence/convergence/cards.md#工作包-1\`；sha256 \`${p5Sha(card)}\` |`,
      ...(coldLine ? [coldLine] : []),
      "### 冷读记录（P1）", "",
      "- 读者：subagent:reader-1，未参与本包写作，只读本包卡。",
      "- 五问原答：", "① 改什么：改。", "② 为什么：因。", "③ 边界：界。", "④ 怎么验：验。", "⑤ 还有什么没定：无。",
      "- 结论：五问全答出；本包收敛。", "",
      "### 包 1 五件同包原件", "",
      `- 当前方案卡：\`quality/evidence/convergence/cards.md#工作包-1\`；包=1；批次=batch-1；卡节sha256=${p5Sha(card)}`,
      `- 当前质询：\`quality/evidence/talk/discussion-p1.md\`；${identity}`,
      `- 当前冷读：\`${coldRef}\`；${identity}`,
      `- 当前对抗：\`quality/evidence/talk/adversarial-p1.md\`；${identity}`,
      `- 当前真实答复：\`quality/evidence/talk/answer-p1.md\`；${identity}`, "",
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

// P11 remaining controlled cases (page trigger, UI section, chain fences and
// literal quote comparison) live here because these are the consumers' own
// contract tests for the files changed in the same batch.
describe("P11 page trigger and UI section contracts", () => {
  it("names missing/partial page_trigger and accepts the complete declaration", async () => {
    const { pageTriggerGapFor } = await import("../../tools/cli/check-stage-steps.mjs");
    const step = (text) => ({ step_slug: "approve-decision", observable_result: text });
    expect(pageTriggerGapFor(step("收口"), "make-decision")).toContain("page_trigger");
    expect(pageTriggerGapFor(step("page_trigger：① 分支 ② 一句事实"), "make-decision")).toContain("三问不全");
    expect(pageTriggerGapFor(step("page_trigger：① 三个以上 ② 小聊 ③ 理由"), "make-decision")).toBe(null);
    expect(pageTriggerGapFor(step("page_trigger：① 三个以上 ② 小聊 ③ 理由"), "build-code")).toBe(null);
    expect(pageTriggerGapFor(step("page_trigger：① 三个以上 ② 小聊 ③ 理由；本次命中"), "make-decision")).toContain("命中却未出页");
    expect(pageTriggerGapFor(step("page_trigger：① 三个以上 ② 小聊 ③ 理由；本次命中；出页回执：`quality/evidence/page.md`"), "make-decision")).toBe(null);
    expect(pageTriggerGapFor(step("page_trigger：① 三个以上 ② 小聊 ③ 理由；本次均否"), "make-decision")).toContain("均否无理由");
    expect(pageTriggerGapFor(step("page_trigger：① 三个以上 ② 小聊 ③ 理由；本次均否；理由：纯文字"), "make-decision")).toBe(null);
  });
  it("reports a missing UI section only when the material carries UI evidence", async () => {
    const { uiCardContext } = await import("../../tools/cli/check-stage-steps.mjs");
    const root = temp("p11-ui-");
    const put = (name, value) => { mkdirSync(root, { recursive: true }); writeFileSync(join(root, name), value); };
    put("decision-log.md", "# T\nraw_requirement 提到页面。\n");
    expect(uiCardContext(root)?.gap).toContain("是不是 UI");
    put("decision-log.md", "# T\n## UI 范围与设计基准\n| 是不是 UI | 否；纯 CLI |\n");
    expect(uiCardContext(root)?.isUi).toBe(false);
    expect(uiCardContext(root)?.gap).toBeUndefined();
    put("decision-log.md", "# T\n纯 CLI，无前端迹象。\n");
    expect(uiCardContext(root)?.gap).toBeUndefined();
  });
});

describe("P11 chain fence and literal quote contracts", () => {
  it("ignores a requirement-index mention inside a fence", async () => {
    const { requirementIndexPointers } = await import("../../tools/cli/check-decision-log-chain.mjs");
    const markdown = ["- 需求索引：`quality/evidence/decision-log-refs/one.md`", "~~~", "- 需求索引：`other/requirement-index.md`", "~~~"].join("\n");
    expect(requirementIndexPointers(markdown)).toEqual(["quality/evidence/decision-log-refs/one.md"]);
  });
  it("keeps wildcard and command syntax rather than deleting it", async () => {
    const { normalizeQuote, checkDecisionLogChain } = await import("../../tools/cli/check-decision-log-chain.mjs");
    expect(normalizeQuote("run `npm test` -- --filter=*")).toContain("*");
    expect(normalizeQuote("run `npm test`")).toContain("`");
    const source = join(temp("p11-wild-"), "source.md");
    writeFileSync(source, "run npm test -- --filter=app\n");
    const index = [INDEX_HEADER, INDEX_RULE, `| U-1 | 自由手写 | run npm test -- --filter=* | permit | \`${source}#L1-L1\` | 2026-11-18 | 1 |`].join("\n");
    const doc = ["# C", "### D-001 — c", "- 做什么：跑。", "- 不做什么：不改。", "- 风险：误。", "- 改动：m。", "- source_id: U-1", "- modality: permit", "- 来源身份：用户答复"].join("\n");
    const result = checkDecisionLogChain({ markdown: doc, source_ref: "controlled.md", requirement_index_markdown: index, read_source: ref => readFileSync(String(ref).split("#")[0], "utf8") });
    expect(result.warnings.map(w => w.code)).toContain("ANSWER_SOURCE_UNVERIFIABLE");
  });
});

describe("P11 run-checks material convergence gaps", () => {
  const runMaterial = (dir) => spawnSync(process.execPath, [join(ROOT, "tools/cli/run-checks.mjs"), `--material-root=${dir}`, "--stage=make-decision"], { cwd: ROOT, encoding: "utf8" });
  function material(ledger) {
    const dir = temp("p11-rc-");
    mkdirSync(join(dir, "quality/evidence/decision-log-refs"), { recursive: true });
    writeFileSync(join(dir, "decision-log.md"), ["# T", "## 级别与路线", "- 推荐级别：复杂", "清单：`quality/evidence/decision-log-refs/convergence-checklist.md`", ""].join("\n"));
    if (ledger !== undefined) writeFileSync(join(dir, "quality/evidence/decision-log-refs/convergence-checklist.md"), ledger);
    return dir;
  }
  it("returns non-zero for a converged package without evidence originals", () => {
    const dir = material(["# 清单", "| 包 | 状态 | 位置 | 证据 | 未决 |", "| --- | --- | --- | --- | --- |", "| 1 | 已收敛 | x | y | 无 |", "", "## 工作包 1：测试"].join("\n"));
    expect(runMaterial(dir).status).toBe(1);
  });
  it("returns zero when no convergence pointer is declared", () => {
    const dir = temp("p11-rc0-");
    writeFileSync(join(dir, "decision-log.md"), "# T\n## 级别与路线\n- 推荐级别：复杂\n");
    expect(runMaterial(dir).status).toBe(0);
  });
  it("reads the direction checker pointer form and names a missing same-package class", () => {
    const digest = "a".repeat(64);
    const dir = material([
      "# 清单",
      "| 包 | 目标 | 边界 | 方案与取舍 | 验收 | 风险 | 依赖 | 消费者 | 未决/无 | 状态 |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
      "| 1 controlled | a | b | c | d | e | 无 | f | 无 | 已收敛 |",
      "",
      "### 包 1 五件同包原件",
      `- 当前方案卡：\`quality/evidence/convergence/cards.md#工作包-1\`；包=1；批次=batch-1；卡节sha256=${digest}`,
      `- 当前冷读：\`quality/evidence/decision-maker/p01/cold-read.md\`；任务=same-package；包=1；批次=batch-1；卡节sha256=${digest}`,
      `- 当前对抗：\`quality/evidence/decision-maker/p01/adversarial.md\`；任务=same-package；包=1；批次=batch-1；卡节sha256=${digest}`,
      `- 当前真实答复：\`quality/evidence/decision-maker/p01/answer.md\`；任务=same-package；包=1；批次=batch-1；卡节sha256=${digest}`,
    ].join("\n"));
    // The same pointer parse as the direction checker: a backticked current
    // checklist path, not only a "清单：" line.
    writeFileSync(join(dir, "decision-log.md"), ["# T", "## 级别与路线", "- 推荐级别：复杂", "\`quality/evidence/decision-log-refs/convergence-checklist.md\`", ""].join("\n"));
    const result = runMaterial(dir);
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain("质询");
  });
  it("names a missing checklist when packages are already declared", () => {
    const dir = temp("p11-rc-missing-");
    writeFileSync(join(dir, "decision-log.md"), "# T\n## 级别与路线\n- 推荐级别：复杂\n#### WP1 — controlled\n- **结果与消费者**：受控。\n");
    const result = runMaterial(dir);
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain("收敛清单指针未取得");
  });
  it("fails a declared package set with no authoritative module rows", () => {
    const dir = material(["# 清单", "| 包 | 状态 | 五段表位置 | 证据 | 未决 |", "| --- | --- | --- | --- | --- |", ""].join("\n"));
    writeFileSync(join(dir, "decision-log.md"), ["# T", "## 级别与路线", "- 推荐级别：复杂", "#### WP1 — controlled", "清单：`quality/evidence/decision-log-refs/convergence-checklist.md`", ""].join("\n"));
    const result = runMaterial(dir);
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain("权威模块集合未取得或重复");
  });
  it("fails duplicated module rows", () => {
    const dir = material(["# 清单", "| 包 | 状态 | 五段表位置 | 证据 | 未决 |", "| --- | --- | --- | --- | --- |", "| 1 | 已收敛 | x | y | 无 |", "| 1 | 已收敛 | x | y | 无 |", ""].join("\n"));
    writeFileSync(join(dir, "decision-log.md"), ["# T", "## 级别与路线", "- 推荐级别：复杂", "#### WP1 — controlled", "清单：`quality/evidence/decision-log-refs/convergence-checklist.md`", ""].join("\n"));
    const result = runMaterial(dir);
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain("权威模块集合未取得或重复");
  });
  it("keeps the five old evidence-gap classes in the shared run-checks predicate", async () => {
    const { isDirectionMaterialFailure } = (await import("../../tools/cli/check-stage-steps.mjs")).directionMaterialApi();
    for (const gap of ["缺冷读原件", "聊天呈现未取得", "冷读五问未绑定", "UI设计源首问", "冷读原件摘要不符"]) {
      expect(isDirectionMaterialFailure(gap), `${gap} must stay a failure at the run-checks seam`).toBe(true);
    }
  });
  it("rejects a non-card evidence file used as the current card", () => {
    const digest = "a".repeat(64);
    const dir = material(["# 清单", "| 包 | 状态 | 五段表位置 | 证据 | 未决 |", "| --- | --- | --- | --- | --- |", "| 1 | 已收敛 | x | y | 无 |", "", "### 包 1 五件同包原件", `- 当前方案卡：\`quality/evidence/decision-maker/p01/notes.md#工作包-1\`；包=1；批次=batch-1；卡节sha256=${digest}`, ""].join("\n"));
    const result = runMaterial(dir);
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain("不是方案卡原件");
  });
  it("fails duplicate five-original blocks through the same predicate as the direction checker", async () => {
    const { isDirectionMaterialFailure } = (await import("../../tools/cli/check-stage-steps.mjs")).directionMaterialApi();
    expect(isDirectionMaterialFailure("1 controlled：包 1 同包五件：重复声明块")).toBe(true);
    const dir = material(["# 清单", "| 包 | 状态 | 五段表位置 | 证据 | 未决 |", "| --- | --- | --- | --- | --- |", "| 1 | 已收敛 | x | y | 无 |", "", "### 包 1 五件同包原件", "- 当前方案卡：`quality/evidence/convergence/cards.md#工作包-1`；包=1；批次=batch-1；卡节sha256=" + "a".repeat(64), "", "### 包 1 五件同包原件", "- 当前方案卡：`quality/evidence/convergence/cards.md#工作包-1`；包=1；批次=batch-1；卡节sha256=" + "a".repeat(64), ""].join("\n"));
    const result = runMaterial(dir);
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain("同包五件：重复声明块");
  });
});

// P2/T002 ORACLE-P2-BOUND-HANDOFF
// Oracle provenance (corrected): there is NO pre-frozen independent script for
// this oracle. The 020/021 originals under the task library belong to the
// checklist oracle (ORACLE-P2-CURRENT-V2-CHECKLIST), not to this one; they must
// not be cited as this case's author. What this block encodes is the Phase card's
// RED/GREEN semantics for AC-P2-001, written by the implementer against the
// existing checker surface. That absence of an independent frozen author is
// recorded as a gap, not papered over. No pre-existing assertion in this file
// changed.
// Content: the source pointer and the confirmation must
// land on one original. A pointer that resolves back into the decision log is a
// self-reference rather than an original; a one-line offset is drift and must
// name the cited position; a declared file with no reader is a static receipt,
// not evidence. The frozen Git object is replayed by an independent reader and
// the decision-log bytes stay identical across the check.
describe("ORACLE-P2-BOUND-HANDOFF bound original and named failures", () => {
  const QUOTE = "允许升一次数据库结构";

  it("names a source pointer that resolves to the decision log itself", () => {
    const { log, index } = fixture({});
    const before = `${readFileSync(log, "utf8")}${QUOTE}\n`;
    writeFileSync(log, before);
    const position = before.split("\n").length - 1;
    writeFileSync(index, [
      "# Controlled index; U-901 is a replay label",
      INDEX_HEADER, INDEX_RULE,
      `| U-901 | 保存转录 | ${QUOTE} | permit | specs/p1-fixture/decision-log.md#L${position}-L${position} | 2026-11-12（原件） | 1 |`,
      "",
    ].join("\n"));
    const result = run(log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_SOURCE_SELF_REFERENCE");
    expect(result.output).toContain("D-901");
    expect(readFileSync(log, "utf8")).toBe(before);
  });

  it("names the cited position when the original drifts by one line", () => {
    const { log } = fixture({ line: 7, ref: "#L8-L8" });
    const before = readFileSync(log, "utf8");
    const result = run(log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_SOURCE_UNVERIFIABLE");
    expect(result.output).toContain("#L8-L8");
    expect(readFileSync(log, "utf8")).toBe(before);
  });

  it("keeps a static receipt distinguishable from a real read", () => {
    const { log, index } = fixture({});
    const markdown = readFileSync(log, "utf8");
    const requirementIndex = readFileSync(index, "utf8");
    const receiptOnly = checkDecisionLogChain({ markdown, source_ref: "decision-log.md", requirement_index_markdown: requirementIndex });
    expect(receiptOnly.warnings.map(item => item.code)).toContain("ANSWER_SOURCE_UNVERIFIABLE");
    const read = checkDecisionLogChain({
      markdown, source_ref: "decision-log.md", requirement_index_markdown: requirementIndex,
      read_source: ref => readFileSync(String(ref).split("#")[0], "utf8"),
    });
    expect(read.warnings.map(item => item.code)).not.toContain("ANSWER_SOURCE_UNVERIFIABLE");
  });

  it("replays a frozen Git object and keeps the log bytes unchanged", () => {
    const dir = temp("p2-bound-object-");
    const git = args => spawnSync("git", args, { cwd: dir, encoding: "utf8" });
    expect(git(["init", "-q"]).status).toBe(0);
    const path = join(dir, "reply.md");
    const lines = Array.from({ length: 9 }, (_, number) => `${number + 1}. filler line`);
    lines[6] = `3. ${QUOTE}`;
    writeFileSync(path, `${lines.join("\n")}\n`);
    expect(git(["add", "reply.md"]).status).toBe(0);
    expect(git(["-c", "user.name=p2", "-c", "user.email=p2@example.invalid", "commit", "-qm", "controlled original"]).status).toBe(0);
    const blob = git(["rev-parse", "HEAD:reply.md"]).stdout.trim();
    expect(blob).toMatch(/^[0-9a-f]{40}$/);
    expect(git(["cat-file", "-e", blob]).status).toBe(0);
    const shown = spawnSync("git", ["show", blob], { cwd: dir });
    expect(shown.status).toBe(0);
    const frozen = shown.stdout;
    expect(createHash("sha256").update(frozen).digest("hex")).toBe(createHash("sha256").update(readFileSync(path)).digest("hex"));
    const frozenLines = frozen.toString("utf8").split("\n");
    expect(frozenLines[6]).toContain(QUOTE);
    expect(frozenLines[7]).not.toContain(QUOTE);
    writeFileSync(path, `inserted line\n${lines.join("\n")}\n`);
    expect(spawnSync("git", ["show", blob], { cwd: dir }).stdout.equals(frozen)).toBe(true);
    expect(readFileSync(path).equals(frozen)).toBe(false);
  });
});
// P2/T002 ORACLE-P2-BLOB-BINDING: a confirmation may bind its original to a
// frozen Git object (`commit:path#blob`). The checker has to prove the blob
// exists, that the declared commit really carries it, and that the quoted line
// lives in the blob bytes. Reading the current working tree is not the same
// fact: it can move after the commit, so the frozen object is authoritative.
describe("ORACLE-P2-BLOB-BINDING frozen Git object binding", () => {
  const QUOTE = "允许升一次数据库结构";
  function blobFixture(options = {}) {
    const f = fixture(options);
    const git = args => spawnSync("git", args, { cwd: f.base, encoding: "utf8" });
    expect(git(["init", "-q"]).status).toBe(0);
    expect(git(["add", "."]).status).toBe(0);
    expect(git(["-c", "user.name=p2", "-c", "user.email=p2@example.invalid", "commit", "-qm", "controlled original"]).status).toBe(0);
    const commit = git(["rev-parse", "HEAD"]).stdout.trim();
    const relative = f.source.slice(f.base.length + 1);
    const blob = git(["rev-parse", `HEAD:${relative}`]).stdout.trim();
    const indexRow = ref => ["# Controlled index", INDEX_HEADER, INDEX_RULE,
      `| U-901 | 保存转录 | ${QUOTE} | permit | ${ref} | 2026-11-12（原件） | 1 |`, ""].join("\n");
    writeFileSync(f.index, indexRow(`${commit}:${relative}#${blob}#L7-L7`));
    return { ...f, git, commit, relative, blob, indexRow };
  }
  it("verifies the declared commit:path#blob and reports the binding", () => {
    const f = blobFixture();
    const result = run(f.log);
    expect(result.status, result.output).toBe(0);
    expect(result.output).toContain("blob binding U-901");
    expect(result.output).toContain(`${f.commit}:${f.relative}#${f.blob}`);
    expect(result.output).not.toMatch(new RegExp(FLAGS.join("|")));
  });
  it("reads the quoted line from the frozen blob, not from changed working-tree bytes", () => {
    const f = blobFixture();
    // The working tree no longer holds the quote; only the frozen blob does.
    writeFileSync(f.source, `${Array.from({ length: 9 }, (_, number) => `${number + 1}. filler line`).join("\n")}\n`);
    const result = run(f.log);
    expect(result.status, result.output).toBe(0);
    expect(result.output).toContain("blob binding U-901");
    expect(result.output).not.toMatch(new RegExp(FLAGS.join("|")));
  });
  it("rejects a blob that the declared commit path does not carry", () => {
    const f = blobFixture();
    const otherBlob = f.git(["rev-parse", `HEAD:quality/evidence/decision-log-refs/requirement-index.md`]).stdout.trim();
    expect(otherBlob).toMatch(/^[0-9a-f]{40}$/);
    writeFileSync(f.index, f.indexRow(`${f.commit}:${f.relative}#${otherBlob}#L7-L7`));
    const result = run(f.log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_SOURCE_UNVERIFIABLE");
    expect(result.output).toContain("BLOB_MISMATCH");
  });
  it("rejects a frozen blob of the decision log itself", () => {
    const f = blobFixture({ extraLines: ["- 受控标记：`允许升一次数据库结构`（本日志行）"] });
    const logText = readFileSync(f.log, "utf8");
    const line = logText.split("\n").findIndex(value => value.includes("受控标记")) + 1;
    expect(line).toBeGreaterThan(0);
    const relative = f.log.slice(f.base.length + 1);
    const logBlob = f.git(["rev-parse", `HEAD:${relative}`]).stdout.trim();
    expect(logBlob).toMatch(/^[0-9a-f]{40}$/);
    writeFileSync(f.index, f.indexRow(`${f.commit}:${relative}#${logBlob}#L${line}-L${line}`));
    const result = run(f.log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_SOURCE_SELF_REFERENCE");
  });
  it("rejects a blob that does not exist in the repository", () => {
    const f = blobFixture();
    writeFileSync(f.index, f.indexRow(`${f.commit}:${f.relative}#${"0".repeat(40)}#L7-L7`));
    const result = run(f.log);
    expect(result.status, result.output).toBe(1);
    expect(result.output).toContain("ANSWER_SOURCE_UNVERIFIABLE");
    expect(result.output).toContain("BLOB_MISSING");
  });
});

// P3 ORACLE-P3-ROLE-SOURCES: a package card must be bound to the role originals
// that really produced it and to a real package-level user reply. The machine
// only judges shape and binding; whether the review was good enough is a human
// read. This controlled fixture proves the checks can fail; it does not stand in
// for the real three roles, the real reply or the real card version.
const P3_VALIDATOR = join(ROOT, "skills/decision-maker/scripts/validate-card.mjs");
const P3_STATUS = join(ROOT, "skills/decision-maker/scripts/status.mjs");
const P3_QUOTE = "行为看实际页面，排版验收要求截图（推荐）";
const P3_CALL = "call_controlled_p3_0001";

function p3CardBody({ header = "| 格 | 内容 |\n| --- | --- |\n" } = {}) {
  const template = readFileSync(join(ROOT, "skills/decision-maker/templates/card.md"), "utf8");
  const table = template.slice(template.indexOf("| 格 |"), template.indexOf("## 卡末"));
  const rows = table
    .split("\n")
    .slice(2)
    .join("\n")
    .replace(/\x60<[^>]+>\x60/g, "受控卡片输入：读取已存在的回执。")
    .replace(/^\| 验收 \|.*$/m, "| 验收 | 通过条件：本地回执可读且退出 0；失败条件：回执缺失或退出非零；反例：删掉回执应失败；证据：验证器原始输出。 |");
  return `# 受控卡\n\n${header}${rows}`;
}

function p3sha(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function p3Package({ header } = {}) {
  const dir = temp("p3-roles-");
  const roles = join(dir, "roles");
  mkdirSync(roles);
  const body = p3CardBody({ header });
  const card = join(dir, "card.md");
  writeFileSync(card, body);
  const version = spawnSync(process.execPath, [P3_VALIDATOR, card, "--version"], { encoding: "utf8" }).stdout.trim();
  expect(version).toMatch(/^[0-9a-f]{64}$/);
  const files = {
    research: join(roles, "research.md"),
    design: join(roles, "design.md"),
    cold: join(roles, "cold-read.md"),
    adversarial: join(roles, "adversarial.md"),
    answer: join(roles, "answer.md"),
  };
  const calls = {
    research: "p3-researcher@2026-11-20T04:18:00+08:00",
    design: "p3-designer@2026-11-20T04:31:00+08:00",
    cold: "p3-reviewer@2026-11-20T05:02:00+08:00",
    adversarial: "p3-reviewer@2026-11-20T05:02:00+08:00",
  };
  const spec = {
    research: { agent: "p3-researcher", at: "2026-11-20T04:18:00+08:00" },
    design: { agent: "p3-designer", at: "2026-11-20T04:31:00+08:00" },
    cold: { agent: "p3-reviewer", at: "2026-11-20T05:02:00+08:00" },
    adversarial: { agent: "p3-reviewer", at: "2026-11-20T05:02:00+08:00" },
  };
  const questions = (count) => Array.from({ length: count }, (_, index) => `${index + 1}. 受控答复 ${index + 1}`).join("\n");
  writeFileSync(files.research, `agent: ${spec.research.agent}\ndispatched_at: ${spec.research.at}\n\n# 调研原件\n\n1. 受控事实；来源 cont/rors:1\n`);
  writeFileSync(files.design, `agent: ${spec.design.agent}\ndispatched_at: ${spec.design.at}\ndesigner: p3-designer\n\n# 设计原件\n\n1. 受控方案。\n`);
  writeFileSync(files.cold, `agent: ${spec.cold.agent}\ndispatched_at: ${spec.cold.at}\nreviewer: p3-reviewer\ndesigner: p3-designer\nreviewed_card_sha256: ${version}\n\n# 冷读原件\n\n## 六问原文\n\n${questions(6)}\n\n- 结论：过\n`);
  writeFileSync(files.adversarial, `agent: ${spec.adversarial.agent}\ndispatched_at: ${spec.adversarial.at}\nreviewer: p3-reviewer\ndesigner: p3-designer\nreviewed_card_sha256: ${version}\n- 结论：通过\n\n## 九问原文\n\n${questions(9)}\n\n## 阻塞项\n\n- 无\n`);
  writeFileSync(files.answer, `# 受控包级答复\n\n- 答复来源：受控问答 ${P3_CALL}。\n- 所属包：包 6\n\n1. 用户原文：${P3_QUOTE}\n`);
  const machine = [
    "## 卡末（校验器用，人可跳过）",
    "",
    "- 包号：包 6",
    "- 设计者：p3-designer",
    "- 审查者：p3-reviewer",
    "- source_id：未分配",
    "- modality：允许",
    "- 来源身份：用户答复",
    `- 答复原件：roles/answer.md；sha256=${p3sha(files.answer)}；调用=${P3_CALL}；包=包 6`,
    `- 答复原文：「${P3_QUOTE}」`,
    "- 选项与风险：推荐按示例范围写入计划；代价是范围被示例限定。",
    `- 调研原件：roles/research.md；sha256=${p3sha(files.research)}；调用=${calls.research}`,
    `- 设计原件：roles/design.md；sha256=${p3sha(files.design)}；调用=${calls.design}`,
    `- 冷读原件：roles/cold-read.md；sha256=${p3sha(files.cold)}；调用=${calls.cold}`,
    `- 对抗原件：roles/adversarial.md；sha256=${p3sha(files.adversarial)}；调用=${calls.adversarial}`,
    "",
  ].join("\n");
  writeFileSync(card, `${body}${machine}`);
  return { dir, card, files, version, body, calls };
}

function p3Run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: "utf8", timeout: 30_000 });
  return { ...result, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

describe("ORACLE-P3-ROLE-SOURCES bound card, wrong source and wrong bytes", () => {
  it("accepts a card whose role originals and package reply are bound to its own version", () => {
    const pkg = p3Package();
    const run = p3Run(P3_VALIDATOR, [pkg.card, "--bind", "--json"]);
    const finding = JSON.parse(run.stdout);
    expect(finding.ok).toBe(true);
    expect(run.status).toBe(0);
    expect(finding.cardVersion).toBe(pkg.version);
    const status = p3Run(P3_STATUS, [pkg.dir, "--json", "--require-complete"]);
    const payload = JSON.parse(status.stdout);
    expect(payload.evaluated).toBe(1);
    expect(payload.rows.find((row) => row.file === "card.md")).toMatchObject({ complete: true });
    expect(status.status).toBe(0);
  });

  it("accepts a card-shaped file that has no `| 格 |` header row", () => {
    const pkg = p3Package({ header: "" });
    expect(readFileSync(pkg.card, "utf8")).not.toMatch(/^\|\s*格\s*\|/m);
    const status = p3Run(P3_STATUS, [pkg.dir, "--json", "--require-complete"]);
    const payload = JSON.parse(status.stdout);
    expect(payload.evaluated).toBe(1);
    expect(payload.rows.find((row) => row.file === "card.md")).toMatchObject({ complete: true });
    expect(status.status).toBe(0);
  });

  it("rejects an acceptance cell that writes 无 for every part", () => {
    const pkg = p3Package();
    const card = readFileSync(pkg.card, "utf8").replace(/^\| 验收 \|.*$/m, "| 验收 | 通过：无；失败：无；反例：无；证据：无 |");
    writeFileSync(pkg.card, card);
    const run = p3Run(P3_VALIDATOR, [pkg.card, "--json"]);
    const finding = JSON.parse(run.stdout);
    expect(run.status).toBe(1);
    expect(finding.acceptEmpty).toEqual(["通过", "失败", "反例", "证据"]);
    expect(finding.reasons.join("\n")).toContain("验收写空：反例");
  });

  it("ORACLE-P3-ROLE-SOURCES rejects a card whose eight rows are present but empty", () => {
    // 只判「有没有这一行」会让 11 格留空 8 格仍 exit 0。空行必须在基础检查里具名失败，
    // 不依赖 --bind；这里是 AC-P3-001 登记命令选中本用例句的同一机器判据。
    const rows = ["一句话结果", "对应需求", "现状缺口", "方案与取舍", "边界", "数据与状态", "风险与回退", "未决"];
    let card = p3CardBody();
    for (const name of rows) card = card.replace(new RegExp(`^\\| ${name} \\|.*$`, "m"), `| ${name} |  |`);
    const dir = temp("p3-empty-cells-");
    const path = join(dir, "card.md");
    writeFileSync(path, card);
    const run = p3Run(P3_VALIDATOR, [path, "--json"]);
    const finding = JSON.parse(run.stdout);
    expect(run.status).toBe(1);
    expect(finding.missing).toEqual([]);
    expect(finding.empty).toEqual(rows);
    expect(finding.reasons.join("\n")).toContain("格写空：一句话结果");
  });

  it("rejects one file standing in for several role originals", () => {
    const pkg = p3Package();
    const card = readFileSync(pkg.card, "utf8").replace(/(对抗原件：roles\/adversarial\.md)/, "$1；调用="+pkg.calls.adversarial).replace("roles/adversarial.md", "roles/cold-read.md");
    writeFileSync(pkg.card, card);
    const run = p3Run(P3_VALIDATOR, [pkg.card, "--bind", "--json"]);
    const finding = JSON.parse(run.stdout);
    expect(run.status).toBe(1);
    expect(finding.gaps.join("\n")).toContain("角色原件重复");
  });

  it("rejects a role original with no dispatch identity", () => {
    const pkg = p3Package();
    writeFileSync(pkg.files.research, "# 调研原件（手写，无派发来源）\n\n1. 受控事实\n");
    const card = readFileSync(pkg.card, "utf8").replace(/(调研原件：roles\/research\.md；sha256=)[0-9a-f]{64}/, `$1${p3sha(pkg.files.research)}`);
    writeFileSync(pkg.card, card);
    const run = p3Run(P3_VALIDATOR, [pkg.card, "--bind", "--json"]);
    expect(run.status).toBe(1);
    expect(JSON.parse(run.stdout).gaps.join("\n")).toContain("原件没写派发来源：调研原件");
  });

  it("rejects a reviewer who is the card author", () => {
    const pkg = p3Package();
    writeFileSync(pkg.files.cold, readFileSync(pkg.files.cold, "utf8").replace("reviewer: p3-reviewer", "reviewer: p3-designer"));
    writeFileSync(pkg.card, readFileSync(pkg.card, "utf8")
      .replace(/^- 审查者：.*$/m, "- 审查者：p3-designer")
      .replace(/(冷读原件：roles\/cold-read\.md；sha256=)[0-9a-f]{64}/, `$1${p3sha(pkg.files.cold)}`));
    const run = p3Run(P3_VALIDATOR, [pkg.card, "--bind", "--json"]);
    const finding = JSON.parse(run.stdout);
    expect(run.status).toBe(1);
    expect(finding.reasons.join("\n")).toContain("审查者与卡作者同一身份");
    expect(p3Run(P3_STATUS, [pkg.dir, "--require-complete"]).status).toBe(1);
  });

  it("rejects role originals that reviewed different card bytes", () => {
    const pkg = p3Package();
    writeFileSync(pkg.card, readFileSync(pkg.card, "utf8").replace("| 边界 | 受控卡片输入", "| 边界 | 受控卡片输入（审查后改过的字节）"));
    const run = p3Run(P3_VALIDATOR, [pkg.card, "--bind", "--json"]);
    const finding = JSON.parse(run.stdout);
    expect(run.status).toBe(1);
    expect(finding.gaps.join("\n")).toContain("卡版本不匹配");
    expect(finding.cardVersion).not.toBe(pkg.version);
  });

  it("rejects a reply quote or call that is not in the answer original", () => {
    const pkg = p3Package();
    writeFileSync(pkg.card, readFileSync(pkg.card, "utf8").replace(`「${P3_QUOTE}」`, "「这是旧九包的整体确认原话」"));
    const quoteRun = p3Run(P3_VALIDATOR, [pkg.card, "--bind", "--json"]);
    expect(quoteRun.status).toBe(1);
    expect(JSON.parse(quoteRun.stdout).gaps.join("\n")).toContain("答复原文不在原件中");
    writeFileSync(pkg.card, readFileSync(pkg.card, "utf8").replace(`调用=${P3_CALL}`, "调用=call_not_here_0000"));
    const callRun = p3Run(P3_VALIDATOR, [pkg.card, "--bind", "--json"]);
    expect(callRun.status).toBe(1);
    expect(JSON.parse(callRun.stdout).gaps.join("\n")).toContain("调用来源不在答复原件中");
  });

  it("rejects a reply modality outside the legal enum", () => {
    const pkg = p3Package();
    writeFileSync(pkg.card, readFileSync(pkg.card, "utf8").replace("- modality：允许", "- modality：同意"));
    const run = p3Run(P3_VALIDATOR, [pkg.card, "--bind", "--json"]);
    expect(run.status).toBe(1);
    expect(JSON.parse(run.stdout).gaps.join("\n")).toContain("答复语气不合法");
  });

  it("rejects a labeled acceptance cell that never states its own failure condition", () => {
    const pkg = p3Package();
    writeFileSync(pkg.card, readFileSync(pkg.card, "utf8").replace(/^\| 验收 \|.*$/m, "| 验收 | 通过条件：本地回执可读。反例：删掉回执应失败。证据：验证器原始输出。 |"));
    const run = p3Run(P3_VALIDATOR, [pkg.card, "--json"]);
    const finding = JSON.parse(run.stdout);
    expect(run.status).toBe(1);
    expect(finding.acceptMissing).toContain("失败");
    expect(finding.reasons.join("\n")).toContain("验收缺项：失败");
  });

  it("rejects a dispatch time in the future", () => {
    const pkg = p3Package();
    const future = "2099-01-01T00:00:00+08:00";
    writeFileSync(pkg.files.cold, readFileSync(pkg.files.cold, "utf8").replace(/^dispatched_at: .*$/m, `dispatched_at: ${future}`));
    writeFileSync(pkg.card, readFileSync(pkg.card, "utf8")
      .replace(/^- 冷读原件：.*$/m, (line) => line.replace(/调用=.*$/, `调用=p3-reviewer@${future}`))
      .replace(/(冷读原件：roles\/cold-read\.md；sha256=)[0-9a-f]{64}/, `$1${p3sha(pkg.files.cold)}`));
    const run = p3Run(P3_VALIDATOR, [pkg.card, "--bind", "--json"]);
    const finding = JSON.parse(run.stdout);
    expect(run.status).toBe(1);
    expect(finding.reasons.join("\n")).toContain("派发时间在未来");
  });

  it("rejects a placeholder failure condition such as 待补", () => {
    const pkg = p3Package();
    writeFileSync(pkg.card, readFileSync(pkg.card, "utf8").replace(/^\| 验收 \|.*$/m, "| 验收 | 通过条件：本地回执可读；失败条件：待补；反例：删掉回执应失败；证据：验证器原始输出。 |"));
    const run = p3Run(P3_VALIDATOR, [pkg.card, "--json"]);
    const finding = JSON.parse(run.stdout);
    expect(run.status).toBe(1);
    expect(finding.acceptEmpty).toContain("失败");
  });

  it("reports a dispatch time after the original mtime as advisory, not a failure", () => {
    const pkg = p3Package();
    const saved = new Date(Date.now() - 3600_000);
    const dispatched = new Date(Date.now() - 1800_000).toISOString();
    writeFileSync(pkg.files.cold, readFileSync(pkg.files.cold, "utf8").replace(/^dispatched_at: .*$/m, `dispatched_at: ${dispatched}`));
    utimesSync(pkg.files.cold, saved, saved);
    writeFileSync(pkg.card, readFileSync(pkg.card, "utf8")
      .replace(/^- 冷读原件：.*$/m, (line) => line.replace(/调用=.*$/, `调用=p3-reviewer@${dispatched}`))
      .replace(/(冷读原件：roles\/cold-read\.md；sha256=)[0-9a-f]{64}/, `$1${p3sha(pkg.files.cold)}`));
    const run = p3Run(P3_VALIDATOR, [pkg.card, "--bind", "--json"]);
    const finding = JSON.parse(run.stdout);
    // mtime 不是证据：恢复备份/拷贝/git checkout 都会刷新它，因此只作 warning。
    expect(run.status).toBe(0);
    expect(finding.ok).toBe(true);
    expect(finding.warnings.join("\n")).toContain("派发时间晚于原件 mtime");
    expect(finding.warnings.join("\n")).toContain("mtime 不是证据");
    expect(finding.reasons.join("\n")).not.toContain("派发时间晚于");
  });

  it("keeps a named gap in status when a role original is missing", () => {
    const pkg = p3Package();
    rmSync(pkg.files.adversarial);
    const status = p3Run(P3_STATUS, [pkg.dir, "--json"]);
    const payload = JSON.parse(status.stdout);
    const row = payload.rows.find((entry) => entry.file === "card.md");
    expect(row.complete).toBe(false);
    expect(row.gaps.join("\n")).toContain("缺原件：对抗原件");
    expect(p3Run(P3_STATUS, [pkg.dir, "--require-complete"]).status).toBe(1);
  });

  it("fails status on a directory with no evaluable card", () => {
    const dir = temp("p3-empty-");
    expect(p3Run(P3_STATUS, [dir, "--json"]).status).toBe(1);
    expect(JSON.parse(p3Run(P3_STATUS, [dir, "--json"]).stdout).evaluated).toBe(0);
    writeFileSync(join(dir, "notes.md"), "# 说明\n\n这里没有卡。\n");
    const onlyNotes = p3Run(P3_STATUS, [dir, "--require-complete"]);
    expect(onlyNotes.status).toBe(1);
    expect(onlyNotes.stdout).toContain("没有可评估的卡");
  });
});

// P3 ORACLE-P3-PORTABLE-TEMPLATE: the release closure must carry both the v1 and
// the v2 decision-log template, byte for byte, and refuse a release that lost the
// v2 file. The controlled isolation root is the only thing touched.
describe("ORACLE-P3-PORTABLE-TEMPLATE v2 template travels with the old one", () => {
  it("ships both decision-log templates and rejects a release that dropped v2", async () => {
    const { buildSkillBundleRelease, validateSkillBundleRelease } = await import("../../runtime/distribution/skill-bundle-release.mjs");
    const dir = temp("p3-portable-");
    const bundle = join(dir, "skill-bundle");
    await buildSkillBundleRelease({ packageRoot: ROOT, outputDir: bundle });
    const v2 = "skills/decision-log/templates/decision-log-template-v2.md";
    const v1 = "skills/decision-log/templates/decision-log-template.md";
    const manifest = JSON.parse(readFileSync(join(bundle, "skill-bundle.json"), "utf8"));
    expect(manifest.files.map((row) => row.path)).toEqual(expect.arrayContaining([v1, v2]));
    expect(readFileSync(join(bundle, v2))).toEqual(readFileSync(join(ROOT, v2)));
    expect(readFileSync(join(bundle, v1))).toEqual(readFileSync(join(ROOT, v1)));
    expect(validateSkillBundleRelease({ releaseRoot: bundle }).skill).toBe("workflowhub");
    const stripped = join(dir, "stripped");
    cpSync(bundle, stripped, { recursive: true });
    rmSync(join(stripped, v2));
    expect(() => validateSkillBundleRelease({ releaseRoot: stripped })).toThrow();
    expect(readFileSync(join(ROOT, v2))).toEqual(readFileSync(join(bundle, v2)));
  });
});

// P10: the current v2 log's ten-item design record is read by the real chain
// checker. Missing items are named and stay advisory; the old-shape exit
// behavior is not widened into a new blocking gate.
describe("ORACLE-LOG-V2-TERMINAL ten-item design report", () => {
  const logPath = "specs/archive/execution-quality-build-code-hardening-20261119/decision-log.md";
  it("reports all ten real design packages with every template item", () => {
    const result = checkDecisionLogChain({ markdown: readFileSync(logPath, "utf8") });
    expect(result.design_packages).toHaveLength(10);
    for (const pkg of result.design_packages) expect(pkg.missing_items, `package ${pkg.id}`).toEqual([]);
    expect(result.warnings.filter(item => item.code === "package_design_incomplete")).toEqual([]);
    expect(result.exit_code).toBe(0);
  });
  it("names a missing item and keeps the advisory exit", () => {
    const broken = readFileSync(logPath, "utf8").replace("**风险/回退**：", "**回退**：");
    const result = checkDecisionLogChain({ markdown: broken });
    const gap = result.warnings.find(item => item.code === "package_design_incomplete");
    expect(gap?.message).toContain("风险/回退");
    expect(gap?.message).toContain("owner=包");
    expect(result.exit_code).toBe(0);
  });
});

// P10 ORACLE-AC-NUMBER-NORMALIZATION: one AC identity has two legal spellings in
// the materials (AC-P3-001 and AC-P3-1). The reader normalizes to three digits
// and de-duplicates before printing, then reconciles the whole log against the
// spec's AC list so a missing or invented AC is named instead of hiding behind
// a per-package count. Report-only facts; the old-shape advisory exit is kept.
describe("ORACLE-AC-NUMBER-NORMALIZATION normalized ids and spec reconciliation", () => {
  const markdown = ["# Controlled", "", "## 4. 每包设计", "",
    "### 4.3 decision-maker", "", "- **验收**：AC-P3-001、AC-P3-1、AC-P3-2。", "",
    "### 4.5 修复循环", "", "- **验收**：AC-P5-002、AC-P5-1、AC-P5-2。", "", ""].join("\n");
  const spec = ["# Controlled specification", "",
    "- **AC-P3-001** 甲。", "- **AC-P3-002** 乙。", "- **AC-P3-003** 丙。",
    "- **AC-P5-001** 丁。", "- **AC-P5-002** 戊。", ""].join("\n");
  it("normalizes AC-P3-1 and AC-P3-001 to one padded identity", () => {
    const result = checkDecisionLogChain({ markdown, spec_markdown: spec });
    expect(result.design_packages.map(pkg => pkg.acs)).toEqual([
      ["AC-P3-001", "AC-P3-002"],
      ["AC-P5-002", "AC-P5-001"],
    ]);
    expect(result.exit_code).toBe(0);
  });
  it("reconciles the log against the spec and names uncovered and unresolved ACs", () => {
    const result = checkDecisionLogChain({ markdown, spec_markdown: spec });
    expect(result.ac_reconciliation).toMatchObject({ spec_count: 5, uncovered: ["AC-P3-003"], unresolved: [] });
    expect(result.ac_reconciliation.log_acs).toEqual(["AC-P3-001", "AC-P3-002", "AC-P5-002", "AC-P5-001"]);
    expect(result.warnings.find(item => item.code === "spec_ac_uncovered")?.message).toContain("AC-P3-003");
    const invented = checkDecisionLogChain({ markdown: markdown.replace("AC-P3-2", "AC-P3-9"), spec_markdown: spec });
    expect(invented.ac_reconciliation.unresolved).toEqual(["AC-P3-009"]);
    expect(invented.warnings.find(item => item.code === "design_ac_unresolved")?.message).toContain("AC-P3-009");
  });
  it("prints the reconciliation through the real CLI next to spec.md", () => {
    const dir = temp("ac-reconcile-");
    const log = join(dir, "specs/p2-fixture/decision-log.md");
    mkdirSync(dirname(log), { recursive: true });
    writeFileSync(join(dirname(log), "spec.md"), spec);
    writeFileSync(log, markdown);
    const result = run(log);
    expect(result.status, result.output).toBe(0);
    expect(result.output).toContain("AC reconciliation: spec 5 distinct, log 4 distinct");
    expect(result.output).toContain("uncovered AC-P3-003");
  });
});

// P10 independent cases: the v2 template's numbered-heading shape is read by the
// real chain checker, the real 28 findings stay open until evidence exists, and
// the ten-ring report after the P10 evidence registration names ring 2 as
// incomplete (missing title groups), ring 8 as completed and ring 9 as
// unavailable. The task materials live outside the repo; WORKFLOWHUB_TASK_ROOT
// overrides the default task-library location.
import { existsSync, realpathSync } from "node:fs";
const P10_TASK = "execution-quality-build-code-hardening-20261119";
const P10_SPEC = `archive/${P10_TASK}`;
const P10_ITEMS = ["原始需求", "最初方案", "发散与被否", "调研", "最终决定", "完整方案", "验收", "风险/回退", "未决/消费者/证据", "配套与影响"];
const p10TaskRoot = () => process.env.WORKFLOWHUB_TASK_ROOT ?? "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/" + P10_TASK;
function p10TemplateShape(items = P10_ITEMS) {
  return ["# 决策日志（模板 v2 受控样例）", "", "## 4. 每包设计", "", "### 包 1：受控包", "",
    ...items.map((name, index) => `#### ${index + 1}. ${name}\n- 受控内容：${name}。\n`),
    "## 5. 跨包共享", "", "- 受控。", ""].join("\n");
}

describe("P10 ORACLE-LOG-V2-TERMINAL template shape, real dispositions and ten rings", () => {
  it("reads the v2 template numbered-heading shape and the current log as ten of ten", () => {
    const shaped = checkDecisionLogChain({ markdown: p10TemplateShape() });
    expect(shaped.design_packages, "the v2 numbered-heading shape yields one package").toHaveLength(1);
    expect(shaped.design_packages[0].missing_items).toEqual([]);
    expect(shaped.warnings.filter((item) => item.code === "package_design_incomplete")).toEqual([]);
    expect(shaped.exit_code).toBe(0);
    const current = checkDecisionLogChain({ markdown: readFileSync(join(ROOT, "specs", P10_SPEC, "decision-log.md"), "utf8") });
    expect(current.design_packages).toHaveLength(10);
    for (const pkg of current.design_packages) expect(pkg.missing_items, `package ${pkg.id}`).toEqual([]);
    expect(current.exit_code).toBe(0);
  });
  it("names a deleted numbered item and keeps the advisory exit", () => {
    const result = checkDecisionLogChain({ markdown: p10TemplateShape().replace("#### 8. 风险/回退\n", "") });
    const gap = result.warnings.find((item) => item.code === "package_design_incomplete");
    expect(gap, "the deleted item is named by package_design_incomplete").toBeDefined();
    expect(gap.message).toContain("风险/回退");
    expect(gap.decision_id).toBe("包 1");
    expect(result.exit_code).toBe(0);
  });
  it("keeps the real 28 dispositions open until evidence exists", () => {
    const review = join(p10TaskRoot(), "quality/reviews/2026-11-19-018-build-plan-document.json");
    const dispositions = join(p10TaskRoot(), "quality/evidence/build-plan/2026-11-19-015-merged-review-dispositions-c.md");
    expect(existsSync(review), `real review file at ${review}`).toBe(true);
    expect(existsSync(dispositions), `real dispositions file at ${dispositions}`).toBe(true);
    const result = spawnSync(process.execPath, ["skills/spec-plan/scripts/build-decision-baseline.mjs", "--task", P10_SPEC, "--review", review, "--dispositions", dispositions], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("findings 28 条；处置 28 条；fixed 0/22 有可读修复证据；缺口 28 条");
    for (const id of ["/10", "/11", "/12", "/13", "/17", "/25"]) expect(result.stdout).toContain(`finding ${id} 待人工处置`);
    expect((result.stdout.match(/待人工处置/g) ?? [])).toHaveLength(6);
    expect(result.stdout).not.toContain("fixed 22/22");
  });
  it("reports ring 2 incomplete with the missing title groups, ring 8 completed and ring 9 unavailable", async () => {
    const api = await import("../../runtime/task/final-chain-runner.mjs");
    const materialRoot = join(ROOT, "specs", P10_SPEC);
    const state = api.runFinalChainCheck({ taskPath: p10TaskRoot(), materialRoot });
    const ring = (number) => state.rings.find((row) => row.ring === number);
    expect(ring(2).state, "registered chain/index scans make ring 2 incomplete, not unavailable").toBe("incomplete");
    expect(ring(8).state, "the P10 gate command completes ring 8").toBe("completed");
    expect(ring(9).state, "no canonical review result keeps ring 9 unavailable").toBe("unavailable");
    const log = readFileSync(join(materialRoot, "decision-log.md"), "utf8");
    for (const titles of [["任务身份"], ["工作包与决定", "每个包定了哪些决定？"], ["未决项", "还有什么没定，谁来定？"]])
      expect(titles.some((title) => log.includes(title)), `title group ${titles.join("/")}`).toBe(false);
    expect((ring(2).basis ?? []).flatMap((item) => item.notes ?? []).join("\n")).toContain("必要段缺失");
    // Controlled counterexample: with the two registrations removed, the same
    // reader reports ring 2 unavailable instead of incomplete.
    // /var is a symlink to /private/var on macOS; the reader rejects alias paths.
    const copy = realpathSync(temp("p10-rings-"));
    cpSync(join(p10TaskRoot(), "task.json"), join(copy, "task.json"));
    const rows = readFileSync(join(p10TaskRoot(), "facts.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line));
    const stage = rows.at(-1);
    stage.evidence.value = stage.evidence.value.filter((entry) => !String(entry.command).includes("check-decision-log-chain"));
    writeFileSync(join(copy, "facts.jsonl"), `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
    const without = api.runFinalChainCheck({ taskPath: copy, materialRoot });
    expect(without.rings.find((row) => row.ring === 2).state).toBe("unavailable");
  });
});

// P2/T002 ORACLE-COMMITMENT-SOURCE: the two target groups below were frozen by
// the pre-writing test author before the commitment branch existed. They fix the
// contract the chain checker (decisionSections / checkDecisionLogChain) and the
// v2 template's decision block have to implement:
//
//   - 承诺：<必须|允许|本次不做>｜<完整原话>｜<索引编号>
//   - 承诺：待定｜<未答问题>｜未答：…；负责人：…；恢复条件：…
//
// A commitment line lives in a mapped 决定 N block. 必须 / 允许 / 本次不做 cite
// exactly one requirement-index row whose 答复原文 is the whole original line;
// the row's 原件ref与行位 is then read and its bytes compared. 待定 has no reply
// yet, so the three unresolved parts replace the pointer. An 作者推断 row never
// backs a commitment, and a rejected alternative stays in the block on its own
// 被否方案 line, which is not read as a commitment.
//
// Lines are judged in this order: state word, pointer presence / pending parts,
// pointer resolution and quote comparison, source class, then tone strength.
// Named failures, all of which must exit non-zero like the four P1 answer codes:
//   ANSWER_COMMITMENT_STATE_UNDECLARED   the state word is not one of the four
//   ANSWER_COMMITMENT_UNSOURCED          the line has no unique index pointer
//   ANSWER_COMMITMENT_PENDING_INCOMPLETE 待定 misses 未答/负责人/恢复条件
//   ANSWER_COMMITMENT_ANCHOR_MISMATCH    the pointer has no row, or its row is
//                                        not this line's quote
//   ANSWER_COMMITMENT_PARTIAL_QUOTE      a strict fragment of the row quote is
//                                        presented as the full original line
//   ANSWER_COMMITMENT_INFERENCE_AS_USER  an 作者推断 row backs a commitment
//   ANSWER_COMMITMENT_TONE_RAISED        the state is stronger than the row tone
// Expectations are written by hand from the Phase card and AC-P2-001 and are
// never computed from the checker's current output.
const COMMITMENT_CODES = [
  "ANSWER_COMMITMENT_STATE_UNDECLARED",
  "ANSWER_COMMITMENT_UNSOURCED",
  "ANSWER_COMMITMENT_PENDING_INCOMPLETE",
  "ANSWER_COMMITMENT_ANCHOR_MISMATCH",
  "ANSWER_COMMITMENT_PARTIAL_QUOTE",
  "ANSWER_COMMITMENT_INFERENCE_AS_USER",
  "ANSWER_COMMITMENT_TONE_RAISED",
];

const COMMITMENT_SOURCE = {
  3: "必须在隔离库先验一次",
  4: "允许在总结里各留一句",
  5: "本次不做历史回填",
  6: "建议先升数据库结构",
  7: "允许在预发环境测一次，再决定要不要上",
  8: "允许升一次数据库结构，旧数据兼容。",
};

// One index row per commitment state: 必须=require, 允许=permit, 本次不做=reject.
// U-904 is an author inference (tone recommend) and must never back a commitment.
const COMMITMENT_ROWS = [
  { id: "U-901", grade: "保存转录", quote: COMMITMENT_SOURCE[3], tone: "require", line: 3 },
  { id: "U-902", grade: "保存转录", quote: COMMITMENT_SOURCE[4], tone: "permit", line: 4 },
  { id: "U-903", grade: "保存转录", quote: COMMITMENT_SOURCE[5], tone: "reject", line: 5 },
  { id: "U-904", grade: "作者推断", quote: COMMITMENT_SOURCE[6], tone: "recommend", line: 6 },
  { id: "U-905", grade: "保存转录", quote: COMMITMENT_SOURCE[7], tone: "permit", line: 7 },
  { id: "U-906", grade: "保存转录", quote: COMMITMENT_SOURCE[8], tone: "permit", line: 8 },
];

function commitmentFixture({ commitments = [], rows = COMMITMENT_ROWS, extraLines = [] } = {}) {
  const f = fixture({});
  const lines = Array.from({ length: 12 }, (_, index) => `${index + 1}. filler line`);
  for (const [line, text] of Object.entries(COMMITMENT_SOURCE)) lines[Number(line) - 1] = text;
  writeFileSync(f.source, `${lines.join("\n")}\n`);
  writeFileSync(f.index, [
    "# Controlled index; U-90x are replay labels, not historical user ids",
    INDEX_HEADER,
    INDEX_RULE,
    ...rows.map((row) => `| ${row.id} | ${row.grade} | ${row.quote} | ${row.tone} | ${f.source}#L${row.line}-L${row.line} | 2026-11-12（原件） | 1 |`),
    "",
  ].join("\n"));
  writeFileSync(f.log, [
    "# Controlled replay, not a new user decision",
    `- 基准目录：${f.base}`,
    "- 需求索引：quality/evidence/decision-log-refs/requirement-index.md",
    "",
    "## 旧编号对照",
    "| 正文编号 | 旧编号 | 说明 |",
    "| --- | --- | --- |",
    "| 决定 1 | D-901 | 受控映射 |",
    "",
    "### 决定 1 — 原话与承诺",
    "- 做什么：保留四态与完整原话。",
    "- 不做什么：不把派生建议写成承诺。",
    "- 风险：错锚让下游引用假原话。",
    "- 改动：只读承诺行。",
    ...commitments,
    ...extraLines,
    "",
  ].join("\n"));
  return f;
}

describe("ORACLE-COMMITMENT-SOURCE 承重承诺：四态、派生与被否分列", () => {
  it("keeps 必须/允许/本次不做/待定 with the full quote and the rejected option in place", () => {
    const result = run(commitmentFixture({ commitments: [
      "- 承诺：必须｜必须在隔离库先验一次｜U-901",
      "- 承诺：允许｜允许在总结里各留一句｜U-902",
      "- 承诺：本次不做｜本次不做历史回填｜U-903",
      "- 承诺：待定｜上线日期｜未答：用户未答上线时间；负责人：材料主会话；恢复条件：用户给出上线日期",
      "- 派生建议：先升数据库结构（作者推断，不作为承诺）",
      "- 被否方案：新建第二套承诺段（保持原位，不进入承诺）",
    ] }).log);
    expect(result.status, result.output).toBe(0);
    expect(result.output).not.toMatch(/ANSWER_COMMITMENT_/);
  });

  it("names a derived suggestion promoted into a user commitment", () => {
    const result = run(commitmentFixture({ commitments: [
      "- 承诺：允许｜建议先升数据库结构｜U-904",
    ] }).log);
    expect(result.output, result.output).toContain("ANSWER_COMMITMENT_INFERENCE_AS_USER");
    expect(result.status, result.output).toBe(1);
  });

  it("names a measured reply rewritten as already approved", () => {
    const result = run(commitmentFixture({ commitments: [
      "- 承诺：已批准｜允许在预发环境测一次，再决定要不要上｜U-905",
    ] }).log);
    expect(result.output, result.output).toContain("ANSWER_COMMITMENT_STATE_UNDECLARED");
    expect(result.status, result.output).toBe(1);
  });

  it("names a permitted reply raised to 必须", () => {
    const result = run(commitmentFixture({ commitments: [
      "- 承诺：必须｜允许在总结里各留一句｜U-902",
    ] }).log);
    expect(result.output, result.output).toContain("ANSWER_COMMITMENT_TONE_RAISED");
    expect(result.status, result.output).toBe(1);
  });
});

describe("ORACLE-COMMITMENT-SOURCE 需索引指针：缺源、错锚与截半", () => {
  it("names a commitment line with no unique index pointer", () => {
    const result = run(commitmentFixture({ commitments: [
      "- 承诺：必须｜必须在隔离库先验一次",
    ] }).log);
    expect(result.output, result.output).toContain("ANSWER_COMMITMENT_UNSOURCED");
    expect(result.status, result.output).toBe(1);
  });

  it("names a pointer that resolves to no row or to a different reply", () => {
    for (const line of [
      "- 承诺：必须｜必须在隔离库先验一次｜U-999",
      "- 承诺：必须｜必须在隔离库先验一次｜U-902",
    ]) {
      const result = run(commitmentFixture({ commitments: [line] }).log);
      expect(result.output, `${line}: ${result.output}`).toContain("ANSWER_COMMITMENT_ANCHOR_MISMATCH");
      expect(result.status, result.output).toBe(1);
    }
  });

  it("names half a reply declared as the complete original line", () => {
    const result = run(commitmentFixture({ commitments: [
      "- 承诺：允许｜允许升一次数据库结构｜U-906",
    ] }).log);
    expect(result.output, result.output).toContain("ANSWER_COMMITMENT_PARTIAL_QUOTE");
    expect(result.status, result.output).toBe(1);
  });

  it("keeps a 待定 line that names the unanswered question, owner and recovery", () => {
    const result = run(commitmentFixture({ commitments: [
      "- 承诺：待定｜上线日期｜未答：用户未答上线时间；负责人：材料主会话；恢复条件：用户给出上线日期",
      "- 派生建议：先升数据库结构（作者推断，不作为承诺）",
    ] }).log);
    expect(result.status, result.output).toBe(0);
    expect(result.output).not.toMatch(/ANSWER_COMMITMENT_/);
  });

  it("names a 待定 line that drops its recovery condition", () => {
    const result = run(commitmentFixture({ commitments: [
      "- 承诺：待定｜上线日期｜未答：用户未答上线时间；负责人：材料主会话",
    ] }).log);
    expect(result.output, result.output).toContain("ANSWER_COMMITMENT_PENDING_INCOMPLETE");
    expect(result.status, result.output).toBe(1);
  });
});

// P2 test-change request (delta, 2026-11-23): the independent review found four
// gaps in the frozen contract above. They are appended below as new cases only;
// no existing assertion, group name or test name is changed. The full request
// lives at the task root's `quality/evidence/p02-test-change-request.md`.
//   F1 template readability: a log in the v2 template's current 「最终决定」
//      shape (#### 5. 最终决定, zero-indented 承诺 lines) must be read as a
//      commitment block; today only 「决定 N」 headings are recognized, so the
//      section is silently accepted as "no decision entries".
//   F2 non-flat markers: `1. 承诺：…` and `> 承诺：…` must not pass silently;
//      they are either read (and their pointer checked) or named as failures.
//   F5 empty pending segment: `待定｜｜未答…` has no unanswered question and
//      must fail even when owner and recovery condition are present.
//   F3 Chinese tone: an index row `语气=要求` is understood, a weaker 允许
//      commitment is a named failure, and 要求↔必须 passes.
// The delta uses the same frozen code set; it introduces no new code. The
// weakening case below only demands that the strength change is *named* (the
// current implementation already reports it as TONE_RAISED, which keeps the
// behaviour safe even though the code name speaks of raising).
const COMMITMENT_DELTA_CODES = [...COMMITMENT_CODES];

function templateDecisionFixture({ commitments = [], rows = COMMITMENT_ROWS } = {}) {
  const f = fixture({});
  const lines = Array.from({ length: 12 }, (_, index) => `${index + 1}. filler line`);
  for (const [line, text] of Object.entries(COMMITMENT_SOURCE)) lines[Number(line) - 1] = text;
  writeFileSync(f.source, `${lines.join("\n")}\n`);
  writeFileSync(f.index, [
    "# Controlled index; U-90x are replay labels, not historical user ids",
    INDEX_HEADER,
    INDEX_RULE,
    ...rows.map((row) => `| ${row.id} | ${row.grade} | ${row.quote} | ${row.tone} | ${f.source}#L${row.line}-L${row.line} | 2026-11-12（原件） | 1 |`),
    "",
  ].join("\n"));
  writeFileSync(f.log, [
    "# 决策日志（受控模板样例）",
    `- 基准目录：${f.base}`,
    "- 需求索引：quality/evidence/decision-log-refs/requirement-index.md",
    "",
    "## 4. 每包设计",
    "",
    "### 包 1：受控包",
    "",
    "#### 5. 最终决定",
    "- 选了什么：保留四态与完整原话。",
    ...commitments,
    "",
  ].join("\n"));
  return f;
}

describe("ORACLE-COMMITMENT-SOURCE 承重承诺：模板节、非平铺标记与中文语气", () => {
  it("reads the template 最终决定 shape instead of accepting it unread", () => {
    const result = run(templateDecisionFixture({ commitments: [
      "- 承诺：必须｜必须在隔离库先验一次｜U-901",
      "- 承诺：允许｜允许在总结里各留一句｜U-902",
    ] }).log);
    expect(result.status, result.output).toBe(0);
    expect(result.output).not.toContain("ANSWER_COMMITMENT_UNSOURCED");
    expect(result.output, "the 最终决定 section must be read, not reported as no decision entries").not.toContain("no_decision_entries");
  });

  it("names an unreadable pointer inside the template 最终决定 section", () => {
    const result = run(templateDecisionFixture({ commitments: [
      "- 承诺：必须｜必须在隔离库先验一次｜U-999",
    ] }).log);
    expect(result.output, result.output).toContain("ANSWER_COMMITMENT_ANCHOR_MISMATCH");
    expect(result.status, result.output).toBe(1);
  });

  it("does not let a numbered 承诺 marker pass silently", () => {
    const line = "1. 承诺：必须｜必须在隔离库先验一次｜U-999";
    const result = run(commitmentFixture({ commitments: [line] }).log);
    expect(result.output, `${line}: ${result.output}`).toMatch(new RegExp(COMMITMENT_DELTA_CODES.join("|")));
    expect(result.status, result.output).toBe(1);
  });

  it("does not let a blockquote 承诺 marker pass silently", () => {
    const line = "> 承诺：必须｜必须在隔离库先验一次｜U-999";
    const result = run(commitmentFixture({ commitments: [line] }).log);
    expect(result.output, `${line}: ${result.output}`).toMatch(new RegExp(COMMITMENT_DELTA_CODES.join("|")));
    expect(result.status, result.output).toBe(1);
  });

  it("reads 要求 and names a 允许 commitment that weakens it", () => {
    const chineseRows = COMMITMENT_ROWS.map((row) => (row.id === "U-901" ? { ...row, tone: "要求" } : row));
    const weaker = run(commitmentFixture({
      commitments: ["- 承诺：允许｜必须在隔离库先验一次｜U-901"],
      rows: chineseRows,
    }).log);
    expect(weaker.output, weaker.output).toMatch(/ANSWER_COMMITMENT_TONE_(RAISED|WEAKENED)/);
    expect(weaker.status, weaker.output).toBe(1);
    const consistent = run(commitmentFixture({
      commitments: ["- 承诺：必须｜必须在隔离库先验一次｜U-901"],
      rows: chineseRows,
    }).log);
    expect(consistent.status, consistent.output).toBe(0);
    expect(consistent.output).not.toMatch(/ANSWER_COMMITMENT_/);
  });
});

describe("ORACLE-COMMITMENT-SOURCE 需索引指针：待定空段", () => {
  it("names a 待定 line whose unanswered question is empty", () => {
    const result = run(commitmentFixture({ commitments: [
      "- 承诺：待定｜｜未答：上线时间未定；负责人：材料主会话；恢复条件：用户给出上线日期",
    ] }).log);
    expect(result.output, result.output).toContain("ANSWER_COMMITMENT_PENDING_INCOMPLETE");
    expect(result.status, result.output).toBe(1);
  });
});

// P03 ORACLE-BIDIRECTIONAL-COVERAGE: the decision log declares the unique
// coverage matrix with `覆盖核对：<ref>` next to its requirement-index pointer.
// The checker reads both originals from the authenticated task root and reports
// requirement <-> acceptance coverage, unanswered binding and addition basis.
// Contract used by the three named cases below (the implementation reads these
// labels from each 「7. 验收」 entry):
//   - 判据编号 starts one acceptance entry; 判定来源, 未答绑定, 未答负责人,
//     恢复条件 are read per entry; a new acceptance needs either 替换对象 or
//     all of 真实新增承诺 / 批准者 / 影响 / 不可替代理由.
//   - stdout summary line:
//     `coverage reconciliation: requirements <covered>/<total> covered;
//      acceptances <n>; complete <ids>; incomplete <ids> (owner=<who>;
//      recovery=<condition>)`
//   - named advisory codes (exit stays 0, as the existing advisory contract):
//     coverage_requirement_missing, coverage_acceptance_without_source,
//     coverage_addition_basis_missing.
//   - no sibling spec.md: `AC reconciliation unavailable: no spec.md next to the
//     decision log; no set difference is claimed` instead of an empty diff.
const P03_INDEX = [
  "# 需求索引",
  "",
  "## 1. 当前任务原始请求",
  "",
  "| 编号 | 分类 | 逐字原文 | 来源与位置 | 工作包落点 | 验收去向 |",
  "| --- | --- | --- | --- | --- | --- |",
  "| R-004 | 需求原话 | 未答只限制对应验收。 | batch#L1 | 包3 | AC-P9-001、AC-P9-002 |",
  "",
  "## 2. 归档需求来源",
  "",
  "| 编号 | 分类 | 文档逐字原文 | 来源与位置 | 候选工作包 | 验收去向 |",
  "| --- | --- | --- | --- | --- | --- |",
  "| R-009 | 文档转述 | 替代可核后才退重复检查。 | A/prd.md:1 | 包3 | AC-P9-003 |",
  "",
].join("\n");

const P03_COVERAGE = [
  "# 需求与答复覆盖矩阵",
  "",
  "| 来源 | 分类 | 当前落点 | 决定与边界 | 初步验收与反例 | 缺口与owner |",
  "| --- | --- | --- | --- | --- | --- |",
  "| R-004 | 当前用户原话 | AC-P9-001、AC-P9-002 | 未答只挂对应验收 | 删确认件应失败 | 无；主会话 |",
  "| R-009 | 归档文档 | AC-P9-003 | 替代可核才退 | 旧回执冒当前应失败 | 无；主会话 |",
  "",
].join("\n");

const P03_SPEC = [
  "# 受控规格",
  "",
  "- **AC-P9-000** 旧验收。",
  "- **AC-P9-001** 替换旧验收。",
  "- **AC-P9-002** 合法新增。",
  "- **AC-P9-003** 绑定未答。",
  "",
].join("\n");

const p03Entry = (id, fields) => [`- 判据编号：${id}`, ...fields].join("\n");

function p03CoverageLog(base, { ac1, ac2, ac3 } = {}) {
  return [
    "# 受控覆盖日志",
    `- 基准目录：${base}`,
    "- 需求索引：quality/evidence/decision-log-refs/requirement-index.md",
    "- 覆盖核对：quality/evidence/decision-log-refs/coverage-matrix-5d.md",
    "",
    "### D-901 — 受控决定",
    "- 做什么：只读核对。",
    "- 不做什么：不猜来源。",
    "- 风险：误挡。",
    "- 改动：只改读取。",
    "",
    "### 包 1：受控包",
    "",
    "#### 7. 验收",
    "",
    ac1 ?? p03Entry("AC-P9-001", ["- 判定来源：R-004", "- 替换对象：AC-P9-000"]),
    "",
    ac2 ?? p03Entry("AC-P9-002", [
      "- 判定来源：R-004",
      "- 真实新增承诺：U-014 确认七包方向",
      "- 批准者：用户",
      "- 影响：只增一条覆盖读取",
      "- 不可替代理由：现有编号对账读不到需求落点",
    ]),
    "",
    ac3 ?? p03Entry("AC-P9-003", [
      "- 判定来源：R-009",
      "- 未答绑定：包3 没有真实逐包答复",
      "- 未答负责人：材料作者",
      "- 恢复条件：用户给出包3逐包答复",
    ]),
    "",
    "## 未决项",
    "无真实未知。",
    "",
  ].join("\n");
}

function p03Write(base, ref, text) {
  const path = join(base, ref);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  return path;
}

function p03CoverageFixture({ spec = true, coverage = P03_COVERAGE, entries = {} } = {}) {
  const base = taskBase();
  p03Write(base, "quality/evidence/decision-log-refs/requirement-index.md", P03_INDEX);
  p03Write(base, "quality/evidence/decision-log-refs/coverage-matrix-5d.md", coverage);
  const log = p03Write(base, "specs/p9-fixture/decision-log.md", p03CoverageLog(base, entries));
  if (spec) p03Write(base, "specs/p9-fixture/spec.md", P03_SPEC);
  return { base, log };
}

it("P03 coverage accepts sourced additions and limits only bound acceptance", () => {
  const { log } = p03CoverageFixture();
  const result = run(log);
  expect(result.status, result.output).toBe(0);
  const coverage = result.output.split("\n").find((line) => line.includes("coverage reconciliation"));
  expect(coverage, result.output).toBeTruthy();
  expect(coverage).toContain("requirements 2/2 covered");
  expect(coverage).toContain("complete AC-P9-001、AC-P9-002");
  expect(coverage).toContain("incomplete AC-P9-003");
  expect(coverage).toContain("owner=材料作者");
  expect(coverage).toContain("recovery=用户给出包3逐包答复");
  expect(result.output).not.toMatch(/coverage_requirement_missing|coverage_acceptance_without_source|coverage_addition_basis_missing/);
});

it("P03 coverage rejects missing source and incomplete addition basis", () => {
  const missingSource = p03Entry("AC-P9-001", ["- 替换对象：AC-P9-000"]);
  const incompleteBasis = p03Entry("AC-P9-002", [
    "- 判定来源：R-004",
    "- 真实新增承诺：U-014 确认七包方向",
  ]);
  const coverage = P03_COVERAGE.split("\n").filter((line) => !line.startsWith("| R-009 |")).join("\n");
  const { log } = p03CoverageFixture({
    coverage,
    entries: { ac1: missingSource, ac2: incompleteBasis },
  });
  const result = run(log);
  expect(result.status, result.output).toBe(0);
  const lineWith = (code, id) => result.output.split("\n").find((line) => line.includes(code) && line.includes(id));
  const noSource = lineWith("coverage_acceptance_without_source", "AC-P9-001");
  expect(noSource, result.output).toBeTruthy();
  const basis = lineWith("coverage_addition_basis_missing", "AC-P9-002");
  expect(basis, result.output).toBeTruthy();
  expect(basis).toContain("批准者");
  expect(basis).toContain("不可替代理由");
  const requirement = lineWith("coverage_requirement_missing", "R-009");
  expect(requirement, result.output).toBeTruthy();
});

it("P03 coverage keeps AC reconciliation unavailable without spec", () => {
  const { log } = p03CoverageFixture({ spec: false });
  const result = run(log);
  expect(result.status, result.output).toBe(0);
  expect(result.output).toContain("AC reconciliation unavailable");
  expect(result.output).toContain("no spec.md");
  expect(result.output).toContain("no set difference");
  expect(result.output).not.toMatch(/AC reconciliation: spec \d+ distinct/);
  expect(result.output).toContain("coverage reconciliation");
});

// P03 coverage incremental cases (independent acceptance findings):
//  - `无` means the field is absent: `未答绑定：无` is not an unanswered binding,
//    `替换对象：无` is not a replacement, and `未取得` is never a valid value.
//  - requirement rows are read by header, not by a fixed first column;
//  - `判定来源` must resolve in the requirement index and a coverage landing must
//    be an acceptance the log declares;
//  - requirement-like rows inside a fenced example are not declarations.
// New named advisory codes: coverage_source_unknown, coverage_landing_unknown.
function p03DeltaFixture({ index = P03_INDEX, coverage = P03_COVERAGE, spec = P03_SPEC, entries = {} } = {}) {
  const base = taskBase();
  p03Write(base, "quality/evidence/decision-log-refs/requirement-index.md", index);
  p03Write(base, "quality/evidence/decision-log-refs/coverage-matrix-5d.md", coverage);
  const log = p03Write(base, "specs/p9-fixture/decision-log.md", p03CoverageLog(base, entries));
  if (spec) p03Write(base, "specs/p9-fixture/spec.md", spec);
  return { base, log };
}

const p03Line = (output, ...parts) => output.split("\n").find((line) => parts.every((part) => line.includes(part)));

it("P03 coverage treats 无 placeholders as absent and keeps a clean acceptance complete", () => {
  const clean = p03Entry("AC-P9-001", ["- 判定来源：R-004", "- 替换对象：AC-P9-000", "- 未答绑定：无", "- 未答负责人：无", "- 恢复条件：无"]);
  const bound = p03Entry("AC-P9-003", ["- 判定来源：R-009", "- 未答绑定：包3 没有真实逐包答复", "- 未答负责人：材料作者", "- 恢复条件：用户给出包3逐包答复"]);
  const { log } = p03DeltaFixture({ entries: { ac1: clean, ac3: bound } });
  const result = run(log);
  expect(result.status, result.output).toBe(0);
  const summary = p03Line(result.output, "coverage reconciliation");
  expect(summary, result.output).toBeTruthy();
  expect(summary).toContain("complete AC-P9-001");
  expect(summary).not.toMatch(/incomplete[^\n]*AC-P9-001/);
  expect(p03Line(result.output, "incomplete", "AC-P9-003"), result.output).toBeTruthy();
});

it("P03 coverage rejects 替换对象：无 when the addition basis is incomplete", () => {
  const noReplacement = p03Entry("AC-P9-002", ["- 判定来源：R-004", "- 替换对象：无", "- 真实新增承诺：U-014 确认七包方向"]);
  const { log } = p03DeltaFixture({ entries: { ac2: noReplacement } });
  const result = run(log);
  expect(result.status, result.output).toBe(0);
  const basis = p03Line(result.output, "coverage_addition_basis_missing", "AC-P9-002");
  expect(basis, result.output).toBeTruthy();
  expect(basis).toContain("批准者");
  expect(basis).toContain("不可替代理由");
});

it("P03 coverage does not accept 未取得 as a valid source or addition basis", () => {
  const placeholder = p03Entry("AC-P9-004", [
    "- 判定来源：未取得",
    "- 替换对象：无",
    "- 真实新增承诺：未取得",
    "- 批准者：未取得",
    "- 影响：未取得",
    "- 不可替代理由：未取得",
  ]);
  const spec = P03_SPEC.replace("- **AC-P9-003** 绑定未答。", "- **AC-P9-003** 绑定未答。\n- **AC-P9-004** 未取得样例。");
  const coverage = P03_COVERAGE.replace("| R-009 | 归档文档 | AC-P9-003 |", "| R-009 | 归档文档 | AC-P9-003、AC-P9-004 |");
  const bound = p03Entry("AC-P9-003", ["- 判定来源：R-009", "- 未答绑定：包3 没有真实逐包答复", "- 未答负责人：材料作者", "- 恢复条件：用户给出包3逐包答复"]);
  const { log } = p03DeltaFixture({ spec, coverage, entries: { ac3: `${bound}\n\n${placeholder}` } });
  const result = run(log);
  expect(result.status, result.output).toBe(0);
  const summary = p03Line(result.output, "coverage reconciliation");
  expect(summary, result.output).toBeTruthy();
  expect(summary.slice(summary.indexOf("incomplete"))).toContain("AC-P9-004");
  expect(p03Line(result.output, "coverage_acceptance_without_source", "AC-P9-004"), result.output).toBeTruthy();
  const basis = p03Line(result.output, "coverage_addition_basis_missing", "AC-P9-004");
  expect(basis, result.output).toBeTruthy();
  expect(basis).toContain("批准者");
});

it("P03 coverage reads requirement rows by header rather than the first column", () => {
  const index = [
    "# 需求索引",
    "",
    "| 分类 | 编号 | 逐字原文 | 来源与位置 | 工作包落点 | 验收去向 |",
    "| --- | --- | --- | --- | --- | --- |",
    "| 需求原话 | R-004 | 未答只限制对应验收。 | batch#L1 | 包3 | AC-P9-001 |",
    "| 文档转述 | R-009 | 替代可核后才退重复检查。 | A/prd.md:1 | 包3 | 未取得 |",
    "",
  ].join("\n");
  const coverage = [
    "# 需求与答复覆盖矩阵",
    "",
    "| 来源 | 分类 | 当前落点 | 决定与边界 | 初步验收与反例 | 缺口与owner |",
    "| --- | --- | --- | --- | --- | --- |",
    "| R-004 | 当前用户原话 | AC-P9-001 | 未答只挂对应验收 | 删确认件应失败 | 无；主会话 |",
    "",
  ].join("\n");
  const spec = "# 受控规格\n\n- **AC-P9-000** 旧验收。\n- **AC-P9-001** 替换旧验收。\n";
  const { log } = p03DeltaFixture({ index, coverage, spec, entries: { ac2: "", ac3: "" } });
  const result = run(log);
  expect(result.status, result.output).toBe(0);
  const missing = p03Line(result.output, "coverage_requirement_missing", "R-009");
  expect(missing, result.output).toBeTruthy();
  const summary = p03Line(result.output, "coverage reconciliation");
  expect(summary, result.output).toBeTruthy();
  expect(summary).toContain("requirements 1/2 covered");
});

it("P03 coverage names a 判定来源 that the requirement index does not declare", () => {
  const unknownSource = p03Entry("AC-P9-001", ["- 判定来源：R-999", "- 替换对象：AC-P9-000"]);
  const { log } = p03DeltaFixture({ entries: { ac1: unknownSource } });
  const result = run(log);
  expect(result.status, result.output).toBe(0);
  const unknown = p03Line(result.output, "coverage_source_unknown", "AC-P9-001", "R-999");
  expect(unknown, result.output).toBeTruthy();
});

it("P03 coverage names a landing acceptance that the log does not declare", () => {
  const coverage = P03_COVERAGE.replace("| R-004 | 当前用户原话 | AC-P9-001、AC-P9-002 |", "| R-004 | 当前用户原话 | AC-P9-999 |");
  const { log } = p03DeltaFixture({ coverage });
  const result = run(log);
  expect(result.status, result.output).toBe(0);
  const unknown = p03Line(result.output, "coverage_landing_unknown", "AC-P9-999");
  expect(unknown, result.output).toBeTruthy();
});

it("P03 coverage ignores requirement-like rows inside a fenced example", () => {
  const { log } = p03DeltaFixture();
  const original = readFileSync(log, "utf8");
  const fenced = ["```md", "| 来源 | 当前落点 |", "| --- | --- |", "| R-777 | 验收 1 |", "```", "", "#### 7. 验收"].join("\n");
  writeFileSync(log, original.replace("#### 7. 验收", fenced));
  const result = run(log);
  expect(result.status, result.output).toBe(0);
  const summary = p03Line(result.output, "coverage reconciliation");
  expect(summary, result.output).toBeTruthy();
  expect(summary).toContain("requirements 2/2 covered");
  expect(result.output).not.toContain("R-777");
});
