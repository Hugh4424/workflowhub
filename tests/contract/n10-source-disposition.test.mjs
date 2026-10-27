import { describe, expect, it } from "vitest";
import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = path => readFileSync(resolve(ROOT, path), "utf8");
const SPEC = "specs/archive/n10-finite-check-wiring-20261020/spec.md";
const POINTER = "../../workflows/build-code/SKILL.md#测试充分性与检查可信度";
const ANCHORS = ["错在范围修", "观察方法", "三值结论", "具名检查"];
const DISPOSITIONS = ["已生效读回", "本次接线验证", "未完成", "不采用"];

function parseAppendixB(markdown) {
  const b = markdown.split(/^## Appendix B[^\n]*$/m)[1]?.split(/^## Appendix C/m)[0];
  assert.ok(b, "Appendix B must be readable");
  const parts = b.split(/^### B\.2[^\n]*$/m);
  const rows = text => text.split("\n").filter(line => /^\|\s*(?:\d+|E-\d+\s)/u.test(line)).map(line => line.trim().slice(1, -1).split("|").map(cell => cell.trim()));
  return { b1: rows(parts[0]), b2: rows(parts[1] ?? ""), figure: b.split("\n").filter(line => line.startsWith("**figure-it-out")) };
}

function assertDispositionTables({ b1, b2, figure }) {
  assert.equal(b1.length, 17, "B.1 denominator is 17");
  b1.forEach((row, index) => {
    assert.equal(row.length, 5, `B.1 ${index + 1} columns`);
    assert.equal(row[0], String(index + 1));
    assert.ok(DISPOSITIONS.includes(row[2]), `B.1 ${index + 1} one disposition`);
    assert.ok(row[3], `B.1 ${index + 1} consumer or reason`);
  });
  for (const number of [9, 10]) {
    assert.equal(b1[number - 1][2], "本次接线验证");
    assert.match(b1[number - 1][3], /N9/u);
  }
  for (const number of [13, 15, 17]) assert.equal(b1[number - 1][2], "不采用");
  assert.equal(b2.length, 10, "B.2 denominator is 10, separate from B.1");
  b2.forEach((row, index) => {
    assert.equal(row.length, 4);
    assert.match(row[0], new RegExp(`^E-${index + 1}\\s`));
    assert.ok(DISPOSITIONS.includes(row[1]));
    assert.ok(row[2], `E-${index + 1} consumer or gap`);
  });
  assert.equal(b2[3][1], "本次接线验证");
  assert.equal(figure.length, 1);
  assert.ok(figure[0].includes("不在 17 行"));
  assert.ok(figure[0].includes("处置＝本次接线验证"));
}

function assertFigureItOutLanding({ verifyCode, stageReflection }) {
  const section = verifyCode.split("### 测试充分性与检查可信度\n")[1]?.split(/^## /m)[0];
  assert.ok(section, "named authoritative section");
  for (const anchor of ANCHORS) {
    assert.ok(section.includes(anchor), `build-code terminal missing ${anchor}`);
    assert.ok(!stageReflection.includes(anchor), `reflection duplicated ${anchor}`);
  }
  assert.ok(section.includes("已验证/未验证/无法判断"));
  const links = stageReflection.split("\n").filter(line => line.includes(POINTER));
  assert.equal(links.length, 1, "one complete pointer line");
  for (const clause of [
    "检查错时修检查本身或收窄其范围，不绕过检查、不在上下游加豁免",
    "通过太易时先查观察方法：核断言、替身与夹具是否真能失败，再动实现",
    "三值结论分为已验证/未验证/无法判断，不把未知写成通过",
    "同一修正复发时，把教训落为具名检查，先在有源真实历史错误上失败，再验证当前修复",
  ]) assert.ok(section.includes(clause), "approved literal rule: " + clause);
  const routing = stageReflection.split("## 用户选择后的归口\n")[1]?.split(/^## /m)[0];
  const checks = routing?.split("检查：")[1]?.split("经验与判断待办：")[0];
  assert.ok(checks?.split("\n").includes(links[0]), "pointer belongs to routing checks");
  assert.ok(links[0].startsWith("机械检查出现可疑通过或同类修正再次发生时，读取 [build-code 终末 检查可信度方法](" + POINTER + ")"), "approved conditional positive read");
}

describe("ORACLE-N10-FINITE-SET T022", () => {
  it("[AC-SET-1] reads the current 17/10/1 dispositions without treating them as behavior proof", () => {
    const source = read(SPEC);
    assertDispositionTables(parseAppendixB(source));
    for (const mutate of [
      text => text.replace(/^\| 1 \|.*\n/m, ""),
      text => text.replace(/^\| E-1 .*\n/m, ""),
      text => text.replace("| 13 | pstack::redesign-from-first-principles | 不采用 |", "| 13 | pstack::redesign-from-first-principles | 未完成/不采用 |"),
      text => text.replace("| 9 | pstack::prove-it-works | 本次接线验证 |", "| 9 | pstack::prove-it-works | 已生效读回 |"),
      text => text.replace(/^\*\*figure-it-out.*$/m, ""),
    ]) expect(() => assertDispositionTables(parseAppendixB(mutate(source)))).toThrow();
    console.log(JSON.stringify({ scenario: "P5-dispositions", b1: 17, b2: 10, figure: 1, boundary: "structure and declared disposition only; no method execution claim" }));
  });

  it("[AC-SET-2] reads four rules from one authority and a single conditional reflection pointer", () => {
    const input = { verifyCode: "### 测试充分性与检查可信度\n" + read("workflows/build-code/SKILL.md").split("### 测试充分性与检查可信度\n")[1]?.split(/^## /m)[0], stageReflection: read("skills/stage-reflection/SKILL.md") };
    assertFigureItOutLanding(input);
    for (const anchor of ANCHORS) expect(() => assertFigureItOutLanding({ ...input, verifyCode: input.verifyCode.replace(anchor, "removed") })).toThrow();
    // TCR2 protects only the approved literal rules; no claim of language understanding.
    for (const [name, from, to] of [
      ["bypass", "不绕过检查、不在上下游加豁免", "允许绕过检查、允许在上下游加豁免"],
      ["observation-order", "通过太易时先查观察方法：核断言、替身与夹具是否真能失败，再动实现", "通过太易时先动实现，再查观察方法：核断言、替身与夹具是否真能失败"],
      ["unknown-passes", "不把未知写成通过", "把未知写成通过"],
      ["recurrence", "同一修正复发时，把教训落为具名检查", "同一修正复发时，无需把教训落为具名检查"],
      ["history-order", "先在有源真实历史错误上失败，再验证当前修复", "先验证当前修复，再在有源真实历史错误上失败"],
    ]) {
      assert.ok(input.verifyCode.includes(from), name + " mutation target");
      expect.soft(() => assertFigureItOutLanding({ ...input, verifyCode: input.verifyCode.replace(from, to) }), name).toThrow();
    }
    for (const [name, from, to] of [
      ["missing-suspicious", "机械检查出现可疑通过或", ""],
      ["missing-recurrence", "或同类修正再次发生", ""],
      ["and-condition", "可疑通过或同类修正", "可疑通过且同类修正"],
      ["negative-read", "时，读取 [build-code 终末", "时，无需读取 [build-code 终末"],
    ]) {
      assert.ok(input.stageReflection.includes(from), name + " mutation target");
      expect.soft(() => assertFigureItOutLanding({ ...input, stageReflection: input.stageReflection.replace(from, to) }), name).toThrow();
    }
    for (const stageReflection of [
      input.stageReflection + ANCHORS.join(" "),
      input.stageReflection.replace(POINTER, "removed"),
      input.stageReflection.replace(POINTER, POINTER.replace("SKILL.md#", "SKILL.md\n#")),
      input.stageReflection + "\n" + input.stageReflection.split("\n").find(line => line.includes(POINTER)),
    ]) expect(() => assertFigureItOutLanding({ ...input, stageReflection })).toThrow();
  });
});

// T024 consumes the same frozen T022 file without changing its assertions.
const DRIFT = ["skills/correct/SKILL.md", "skills/show-me-your-work/SKILL.md", "skills/principle-fix-root-causes/SKILL.md", "skills/swarm/SKILL.md"];
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const actualBytes = path => readFileSync(path);

function assertOriginalsContract(index, { trackedFiles, indexPath }) {
  const outside = relative(ROOT, indexPath);
  assert.ok(outside.startsWith("../") && !isAbsolute(outside), "original index remains outside repository");
  assert.equal(index.sources.length, 13);
  assert.equal(new Set(index.sources.map(row => row.source_key)).size, 13);
  assert.equal(index.counts.requested, 13); assert.equal(index.counts.fetched, 13);
  assert.equal(index.counts.unavailable, 0); assert.equal(index.counts.partial, 0); assert.equal(index.counts.drifted, 4);
  assert.deepEqual([...index.adoption.drift_files].sort(), [...DRIFT].sort());
  assert.equal(index.repositories["backnotprop-pstack"]["snapshot_commit_2026-10-14"], "1f0f9c3bac03c4297f6fc8f7644fa412eda57085");
  assert.equal(index.repositories["addyosmani-agent-skills"].pinned_commit, "aeac41d4d005999432bb7312f7ff06383a91d59d");
  for (const row of index.sources) {
    for (const key of ["source_key", "upstream_snapshot_url", "snapshot_coordinate", "adopted_version", "license"]) assert.ok(typeof row[key] === "string" && row[key].trim(), `${row.source_key} missing ${key}`);
    assert.match(row.upstream_snapshot_url, /^https:\/\//u);
    assert.equal(row.status, "fetched", row.source_key);
    assert.match(row.sha256, /^[a-f0-9]{64}$/u); assert.equal(row.sha256, row.snapshot_sha256);
    assert.equal(row.drift, DRIFT.includes(row.real_path), row.source_key);
    if (row.drift) assert.notEqual(row.head_sha256, row.snapshot_sha256, row.source_key);
  }
  assert.ok(!trackedFiles.some(path => path.includes("source-originals")), "original source bytes must not be vendored");
}

function assertOriginalBytes(index, sourceRoot, readBytes = actualBytes) {
  const root = realpathSync(sourceRoot), result = [];
  const local = locator => {
    assert.ok(typeof locator === "string" && locator && !isAbsolute(locator) && !locator.split(/[\\/]/u).includes(".."), `invalid source path ${locator}`);
    const path = resolve(root, locator), real = realpathSync(path), rel = relative(root, real);
    assert.ok(rel && !rel.startsWith("../") && !isAbsolute(rel), `source escapes original root ${locator}`);
    return real;
  };
  for (const row of index.sources) {
    const snapshot = readBytes(local(row.snapshot_path));
    const actual = sha256(snapshot);
    assert.equal(actual, row.snapshot_sha256, `${row.source_key} snapshot bytes ${row.snapshot_path}`);
    assert.equal(actual, row.sha256, `${row.source_key} adopted bytes`);
    const fact = { source_key: row.source_key, snapshot_path: row.snapshot_path, snapshot_sha256: actual, drift: row.drift };
    if (row.drift) {
      const head = readBytes(local(row.head_path));
      fact.head_path = row.head_path; fact.head_sha256 = sha256(head);
      assert.equal(fact.head_sha256, row.head_sha256, `${row.source_key} HEAD bytes`);
      assert.ok(!head.equals(snapshot), `${row.source_key} must actually differ, not only have different declared hashes`);
    }
    result.push(fact);
  }
  return result;
}

describe("ORACLE-N10-FINITE-SET T024", () => {
  const taskRoot = realpathSync(process.env.N10_TASK_ROOT ?? "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n10-finite-check-wiring-20261020");
  const indexPath = resolve(taskRoot, "quality/evidence/source-originals/source-originals-index.json");
  const sourceRoot = dirname(indexPath);
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  const trackedFiles = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);

  it("[AC-SOURCE-6] reads 13 adopted snapshots and four changed HEADs, checking actual byte hashes", () => {
    assertOriginalsContract(index, { trackedFiles, indexPath });
    const originals = assertOriginalBytes(index, sourceRoot);
    expect(originals).toHaveLength(13);
    expect(originals.filter(row => row.head_sha256)).toHaveLength(4);
    console.log(JSON.stringify({ scenario: "P5-original-byte-readback", indexPath, originals, tracked_originals: 0, boundary: "local stored bytes only; no current network, legal grant or adopted-method execution claim" }));
  });

  it("[AC-SOURCE-6] rejects incomplete or fabricated original metadata and vendoring", () => {
    for (const mutate of [
      data => { data.sources.pop(); },
      data => { data.sources[0].status = "unavailable"; },
      data => { data.adoption.drift_files.pop(); },
      data => { data.sources[0].sha256 = ""; },
      data => { data.sources[1].source_key = data.sources[0].source_key; },
    ]) {
      const data = structuredClone(index); mutate(data);
      expect(() => assertOriginalsContract(data, { trackedFiles, indexPath })).toThrow();
    }
    expect(() => assertOriginalsContract(index, { trackedFiles: [...trackedFiles, "source-originals/copied.md"], indexPath })).toThrow();
  });

  it("[AC-SOURCE-6] rejects missing and corrupted bytes and a HEAD falsely declared identical to the snapshot", () => {
    const snapshotPath = realpathSync(resolve(sourceRoot, index.sources[0].snapshot_path));
    const changed = index.sources.find(row => row.drift);
    const headPath = realpathSync(resolve(sourceRoot, changed.head_path));
    for (const [target, missing] of [[snapshotPath, true], [snapshotPath, false], [headPath, false]]) {
      const readBytes = path => {
        if (path === target) {
          if (missing) throw Object.assign(new Error(`controlled missing original ${path}`), { code: "ENOENT" });
          return Buffer.concat([actualBytes(path), Buffer.from("x")]);
        }
        return actualBytes(path);
      };
      expect(() => assertOriginalBytes(index, sourceRoot, readBytes)).toThrow();
    }
    const data = structuredClone(index), row = data.sources.find(item => item.drift);
    row.head_sha256 = row.snapshot_sha256;
    const copiedHead = path => path === headPath ? actualBytes(resolve(sourceRoot, row.snapshot_path)) : actualBytes(path);
    expect(() => assertOriginalBytes(data, sourceRoot, copiedHead)).toThrow(/must actually differ/u);
    const escaped = structuredClone(index); escaped.sources[0].snapshot_path = "../outside.md";
    expect(() => assertOriginalBytes(escaped, sourceRoot)).toThrow(/invalid source path/u);
  });
});
