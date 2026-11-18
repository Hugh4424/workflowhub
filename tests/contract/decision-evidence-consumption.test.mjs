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
