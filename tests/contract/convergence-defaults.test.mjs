import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createTask, openTask } from "../../runtime/task/task-handle.mjs";

const ROOT = resolve(".");
const TASK_ROOT = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-foundation-20261122";
const SCRATCH = join(TASK_ROOT, "quality/scratch/convergence-defaults");
const STORAGE = join(SCRATCH, "storage");
const TASK = join(STORAGE, "Projects/fixture/tasks/convergence-defaults"), MATERIAL = join(SCRATCH, "material");
const CHECK = "tools/cli/check-stage-steps.mjs", AGGREGATE = "tools/cli/run-checks.mjs";
const sha = text => createHash("sha256").update(text).digest("hex");

afterEach(() => {
  if (existsSync(SCRATCH) && realpathSync(SCRATCH) === SCRATCH) rmSync(SCRATCH, { recursive: true, force: true });
});

function put(base, path, bytes) {
  const file = join(base, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, bytes);
}

function cardSection(id, revision = 1, omitLast = false) {
  const rows = [
    ["一句话结果", `受控包 ${id} 的结果，修订 ${revision}`], ["对应需求", "同包默认版本"],
    ["现状缺口", "旧版可能冒绿"], ["方案与取舍", "使用当前最小方案"], ["边界", "不新增步骤"],
    ["数据与状态", "同一包号、批次和卡摘要"], ["验收", "通过、失败、反例和证据均可读"],
    ["风险与回退", "缺件回原 owner"], ["未决", "无"], ["白话复述", "读者能执行并判假"],
    ["配套与影响", "调整、迁移、移除和影响范围均明确"],
  ];
  const visible = omitLast ? rows.slice(0, -1) : rows;
  return `## 工作包 ${id}\n\n| 格 | 内容 |\n| --- | --- |\n${visible.map(([key, value]) => `| ${key} | ${value} |`).join("\n")}\n`;
}

function roleBytes({ id, kind, digest, round, reviewer = "same-reviewer" }) {
  const count = kind === "cold" ? 6 : 9;
  const answers = Array.from({ length: count }, (_unused, index) => `${["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"][index]} 受控回答 ${index + 1}`).join("\n");
  return [
    "agent: same-reviewer", "dispatched_at: 2026-11-22T20:00:00+08:00",
    "reviewer: same-reviewer", "designer: controlled-designer",
    `reviewed_card_sha256: ${digest}`, `round: ${round}`, `package: ${id}`,
    `batch: batch-${id}`, `reviewer: ${reviewer}`, "",
    kind === "cold" ? "# 冷读六问" : "# 对抗九问", answers,
    kind === "cold" ? "- 结论：六问全答出" : "## 阻塞项\n\n- 无",
  ].join("\n");
}

function decisionBlock(id) {
  return `#### WP${id} — controlled${id}\n- **结果与消费者**：受控结果 ${id}；消费者是 controlled consumer。\n#### D-00${id} — controlled decision\n- **做什么**：读取受控原件并报告缺口。\n- **不做什么**：不写运行时。\n- **风险**：缺证据误报。\n| AC-0${id} | 受控结果可回读 | 目标内容明确 |\n| OI-00${id} | 待独立核对 | owner：受控维护者 |\n细化：\`quality/evidence/decision-log-refs/controlled-module-details.md\`\n`;
}

async function fixture(kind) {
  if (existsSync(SCRATCH)) {
    if (realpathSync(SCRATCH) !== SCRATCH) throw new Error("unsafe scratch alias");
    rmSync(SCRATCH, { recursive: true, force: true });
  }
  mkdirSync(MATERIAL, { recursive: true });
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  mkdirSync(STORAGE, { recursive: true });
  const created = await createTask({ storageRoot: STORAGE, manifest: {
    schema_version: "1.0.0", project_name: "fixture", task_id: "convergence-defaults",
    created_at: new Date().toISOString(), baseline_commit: head,
    target_repo_root: ROOT, activation_cohort: "post", record_model: "vnext-single-write",
    execution_mode: "per_invocation", workspace_mode: "existing", workspace_root: ROOT,
    issue_ids: [], inputs: {},
  } });
  if (created.taskPath !== TASK) throw new Error(`unexpected createTask root: ${created.taskPath}`);
  put(MATERIAL, "decision-log.md", `# Controlled\n## 级别与路线\n- 推荐级别：复杂\n${[1, 2, 3].map(decisionBlock).join("\n")}清单：\`quality/evidence/decision-log-refs/convergence-checklist.md\`\n`);
  put(MATERIAL, "spec.md", readFileSync(join(ROOT, "specs/delivery-quality-foundation-20261122/spec.md"), "utf8"));
  put(MATERIAL, "step-consumer-design.md", readFileSync(join(ROOT, "specs/delivery-quality-foundation-20261122/step-consumer-design.md"), "utf8"));
  put(MATERIAL, "phases/index.md", readFileSync(join(ROOT, "specs/delivery-quality-foundation-20261122/phases/index.md"), "utf8"));
  for (let id = 1; id <= 7; id += 1) {
    const source = join(ROOT, `specs/delivery-quality-foundation-20261122/phases/P${id}.md`);
    if (existsSync(source)) put(MATERIAL, `phases/P${id}.md`, readFileSync(source, "utf8"));
  }
  put(TASK, "quality/evidence/decision-log-refs/controlled-module-details.md", [1, 2, 3].map(id => `## ${id} 模块\n实现只读报告并保留原件。\n`).join("\n"));

  const cards = [], sections = [];
  for (let id = 1; id <= 3; id += 1) {
    const revision = kind === "delete-eleventh" ? 1 : kind === "unchanged" ? 1 : 2;
    const currentCard = cardSection(id, revision, kind === "delete-eleventh" && id === 1);
    const currentDigest = sha(currentCard), previousCard = cardSection(id, 1), previousDigest = sha(previousCard);
    cards.push(currentCard);
    const secondRound = kind === "revised-reread" || kind === "third-round";
    const currentRound = kind === "third-round" ? 3 : secondRound ? 2 : 1;
    const currentDigestForRoles = kind === "revised-no-reread" ? previousDigest : currentDigest;
    const base = `quality/evidence/decision-maker/p0${id}`;
    const cold = `${base}/cold-read.md`, adversarial = `${base}/adversarial.md`;
    put(TASK, cold, roleBytes({ id, kind: "cold", digest: currentDigestForRoles, round: currentRound }));
    put(TASK, adversarial, roleBytes({ id, kind: "adversarial", digest: currentDigestForRoles, round: currentRound }));
    put(TASK, `${base}/discussion.md`, `# 质询\n\n工作包 ${id}\n讨论前展示：当前卡\n复述＋用户原话：确认本包\n批次：batch-${id}\n`);
    put(TASK, `${base}/answer.md`, `# 真实答复\n\n包=${id}；批次=batch-${id}\n用户原文：确认本包\n`);
    if (secondRound) {
      put(TASK, `${base}/cold-read-first.md`, roleBytes({ id, kind: "cold", digest: previousDigest, round: 1 }));
      put(TASK, `${base}/adversarial-first.md`, roleBytes({ id, kind: "adversarial", digest: previousDigest, round: 1 }));
    }
    const refs = [
      `- 当前方案卡：\`quality/evidence/convergence/cards.md#工作包-${id}\`；包=${id}；批次=batch-${id}；卡节sha256=${currentDigest}`,
      `- 当前质询：\`${base}/discussion.md\`；包=${id}；批次=batch-${id}；卡节sha256=${currentDigest}`,
      `- 当前冷读：\`${cold}\`；包=${id}；批次=batch-${id}；卡节sha256=${currentDigestForRoles}；轮次=${currentRound}`,
      `- 当前对抗：\`${adversarial}\`；包=${id}；批次=batch-${id}；卡节sha256=${currentDigestForRoles}；轮次=${currentRound}`,
      `- 真实答复：\`${base}/answer.md\`；包=${id}；批次=batch-${id}；卡节sha256=${currentDigest}`,
    ];
    if (secondRound) refs.push(`- 首轮冷读：\`${base}/cold-read-first.md\`；卡节sha256=${previousDigest}；轮次=1`, `- 首轮对抗：\`${base}/adversarial-first.md\`；卡节sha256=${previousDigest}；轮次=1`);
    sections.push(`### 包 ${id}\n${refs.join("\n")}`);
  }
  put(TASK, "quality/evidence/convergence/cards.md", cards.join("\n"));
  const rows = [1, 2, 3].map(id => `| ${id} controlled${id} | D-00${id} 做什么 | D-00${id} 不做什么 | details§${id} | AC-0${id} | D-00${id} 风险 | 无 | controlled consumer AC-0${id} | OI-00${id} | 已收敛 |\n`).join("");
  put(TASK, "quality/evidence/decision-log-refs/convergence-checklist.md", rows + "\n" + sections.join("\n\n"));
  return openTask(created.taskPath, { projectName: "fixture", taskId: "convergence-defaults" });
}

async function runPair(task, slug) {
  const common = { cwd: ROOT, timeoutMs: 30000 };
  const stage = await task.captureCommand({ ...common, slug: `convergence-check-stage-steps-${slug}`, argv: [process.execPath, CHECK,
    "--stage=make-decision", "--step=9", "--phase=P3", `--task-path=${TASK}`, `--material-root=${MATERIAL}`] });
  const aggregate = await task.captureCommand({ ...common, slug: `convergence-run-checks-${slug}`, argv: [process.execPath, AGGREGATE,
    "--task-path", TASK] });
  return [stage, aggregate];
}

function output(result) {
  return readFileSync(result.output_ref, "utf8");
}

describe("ORACLE-CONVERGENCE-VERSION public CLI defaults", () => {
  it("accepts an unchanged package after one round through both public checks", async () => {
    const task = await fixture("unchanged");
    for (const result of await runPair(task, "unchanged")) {
      expect(output(result)).not.toMatch(/不支持参数|不能混用|当前卡身份 unavailable/);
      expect(result.exit_code, output(result)).toBe(0);
    }
  });

  it("accepts a revised card after the same reviewer performs round two", async () => {
    const task = await fixture("revised-reread");
    for (const result of await runPair(task, "revised-reread")) {
      expect(result.exit_code, output(result)).toBe(0);
    }
  });

  it("rejects a changed card digest without the same-reviewer's second read", async () => {
    const task = await fixture("revised-no-reread");
    for (const result of await runPair(task, "revised-no-reread")) {
      expect(result.exit_code, output(result)).not.toBe(0);
      expect(output(result)).toMatch(/复读|第二轮|修订/);
    }
  });

  it("rejects a third review round", async () => {
    const task = await fixture("third-round");
    for (const result of await runPair(task, "third-round")) {
      expect(result.exit_code, output(result)).not.toBe(0);
      expect(output(result)).toMatch(/第三轮|两轮|轮次/);
    }
  });

  it("rejects deleting the eleventh card row through both public checks", async () => {
    const task = await fixture("delete-eleventh");
    for (const result of await runPair(task, "delete-eleventh")) {
      expect(result.exit_code, output(result)).not.toBe(0);
      expect(output(result)).toMatch(/十一格|配套与影响|第十一格/);
    }
  });
});
