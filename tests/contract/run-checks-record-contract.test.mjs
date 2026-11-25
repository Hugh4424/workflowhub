// P3/P4/P6 结构性修复的机器判据：
// - 就绪表「证据」列是任务证据根相对的计划路径，形状不合法要具名失败；
// - AC-P8-001 的数据来源/上限依据/单命令/版本校验/清理只能从真实可读原件判；
// - P6 失败处置记录的 five elements、两轮锚与三类伪新事实检测。
// 这些用例只证明判据本身能失败（RED 可抵达），不证明真实任务通过。
import { afterEach, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  acceptanceP8Problems,
  failureDispositionProblems,
  readinessEvidenceStatus,
} from "../../tools/cli/run-checks.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const tempRoot = () => { const root = mkdtempSync(join(tmpdir(), "wh-record-contract-")); roots.push(root); return root; };

const PREPARE = {
  action: "prepare",
  data_source: { kind: "synthetic-seed", seed: "workflowhub-p4-synthetic-seed-v1", sample_version: "1.0.0" },
  per_task_limit_basis: { records: 2, files: 3, bytes: 1032, basis: "最小合成样本只覆盖读回所需的两条记录。" },
  reproduce_command: "node tests/fixtures/execution-quality/prepare-test-data.mjs --data-root <同一隔离根> --sample-version 1.0.0",
  version_check: { requested: "1.0.0", required: "1.0.0", status: "current" },
  cleanup: { owner: "测试数据负责人", command: "node tests/fixtures/execution-quality/prepare-test-data.mjs --clean", completion_signal: "clean 回执 complete:true 且隔离根为空" },
};
const CLEAN = { action: "clean", complete: true, residual: [] };
const corpus = (objects) => objects.map((entry) => `$ node fixture\n${JSON.stringify(entry, null, 2)}\nexit=0`).join("\n\n");

it("readiness evidence：计划路径记 planned，已生成记 resolved，形状不合法具名失败", () => {
  const root = tempRoot();
  mkdirSync(join(root, "quality", "tests"), { recursive: true });
  writeFileSync(join(root, "quality", "tests", "p4-readiness-node.output"), "ok\n");
  expect(readinessEvidenceStatus("quality/tests/p4-readiness-node.output", { recordRoot: root }))
    .toMatchObject({ status: "resolved" });
  expect(readinessEvidenceStatus("quality/tests/not-yet.output", { recordRoot: root }))
    .toMatchObject({ status: "planned" });
  const invalid = [
    "/tmp/absolute.output",
    "quality/../escape.output",
    "quality\\windows.output",
    "README.md",
  ];
  for (const value of invalid) {
    expect(readinessEvidenceStatus(value, { recordRoot: root }).status, `${JSON.stringify(value)} 不得通过`).toBe("invalid");
  }
  expect(readinessEvidenceStatus("", { recordRoot: root }).status).toBe("missing");
});

it("AC-P8-001：可读原件齐全时四项齐全才通过，缺一项即具名失败", () => {
  const root = tempRoot();
  mkdirSync(join(root, "quality", "tests"), { recursive: true });
  const path = join(root, "quality", "tests", "p4-manual.output");
  writeFileSync(path, corpus([PREPARE, CLEAN]));
  const body = "证据：`quality/tests/p4-manual.output`。";
  expect(acceptanceP8Problems(body, { recordRoot: root })).toEqual([]);

  // 数据来源被换成产品库副本：同一可读原件也不能当合成种子。
  writeFileSync(path, corpus([{ ...PREPARE, data_source: { kind: "product-library-copy" } }, CLEAN]));
  expect(acceptanceP8Problems(body, { recordRoot: root }).join("\n")).toMatch(/数据来源不是可回读的 synthetic-seed/);

  // 多命令串联不是「单条可复跑命令」。
  writeFileSync(path, corpus([{ ...PREPARE, reproduce_command: "node a.mjs && node b.mjs" }, CLEAN]));
  expect(acceptanceP8Problems(body, { recordRoot: root }).join("\n")).toMatch(/缺单条可复跑命令/);

  // 没有清理回执时不能算清理可读。
  writeFileSync(path, corpus([PREPARE]));
  expect(acceptanceP8Problems(body, { recordRoot: root }).join("\n")).toMatch(/缺清理回执/);

  // 声明的路径全都读不到：不得凭声明通过。
  expect(acceptanceP8Problems("证据：`quality/tests/missing.output`。", { recordRoot: root }).join("\n"))
    .toMatch(/没有可读原件/);
});

const VALID_RECORD = [
  "# checklist",
  "## failures",
  "",
  "| 轮次 | 新事实 | 严重度 | 结果 | 选择 |",
  "| --- | --- | --- | --- | --- |",
  "| 1 | 新回执显示权限被拒，改变了继续条件 | 阻塞 | exit 2 | 查根因 |",
  "| 2 | 换独立上下文复现同一锚 | 普通 | exit 2 | 交原 owner |",
  "",
  "每两轮修复加验收后回看本段。",
  "",
  "## diffs",
].join("\n");

it("P6 failures：五要素、两轮锚齐才通过；未取得、伪新事实与违规继续修都具名失败", () => {
  expect(failureDispositionProblems(VALID_RECORD)).toEqual([]);

  const missing = VALID_RECORD.replace("| 1 | 新回执显示权限被拒，改变了继续条件 |", "| 1 |  |");
  expect(failureDispositionProblems(missing).join("\n")).toMatch(/第 1 行缺新事实或写空/);

  const notObtained = VALID_RECORD.replace(/^## failures\n[\s\S]*?\n## diffs/m,
    "## failures\n\n- 五要素：未取得。补录无法还原当轮判词。\n\n## diffs");
  expect(failureDispositionProblems(notObtained).join("\n")).toMatch(/未取得五要素记录/);

  const noAnchor = VALID_RECORD.replace("每两轮修复加验收后回看本段。", "").split("\n").slice(0, 7).join("\n");
  expect(failureDispositionProblems(noAnchor).join("\n")).toMatch(/缺两轮锚/);

  const pseudo = VALID_RECORD.replace("新回执显示权限被拒，改变了继续条件", "只改报错行号");
  expect(failureDispositionProblems(pseudo).join("\n")).toMatch(/只改行号\/只换夹具\/改断言都不算新事实/);

  const keepsGoing = VALID_RECORD
    .replace("| 1 | 新回执显示权限被拒，改变了继续条件 |", "| 1 | 无 |")
    .replace("| 2 | 换独立上下文复现同一锚 |", "| 2 | 无 |")
    .replace("| 2 | 无 | 普通 | exit 2 | 交原 owner |", "| 2 | 无 | 普通 | exit 2 | 继续修 |");
  expect(failureDispositionProblems(keepsGoing).join("\n")).toMatch(/连续两轮同因且新事实都写「无」仍选「继续修」/);

  expect(failureDispositionProblems("# checklist\n\n## diffs\n").join("\n")).toMatch(/缺 failures 段/);
});

it("P6 failures：编号式标题（## 6. failures…）被识别，五要素缺失仍具名失败", () => {
  // The real P1/P2/P5 checklists use a numbered heading with a parenthetical.
  // Widening the heading shape must not widen the five-element rule itself.
  const numbered = VALID_RECORD.replace("## failures", "## 6. failures（五要素：轮次、新事实、严重度、结果、选择）");
  expect(failureDispositionProblems(numbered)).toEqual([]);
  const missing = numbered.replace("| 1 | 新回执显示权限被拒，改变了继续条件 |", "| 1 |  |");
  expect(failureDispositionProblems(missing).join("\n")).toMatch(/第 1 行缺新事实或写空/);
});
