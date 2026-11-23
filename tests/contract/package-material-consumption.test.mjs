import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const ROOT = resolve(".");
const CHECK = join(ROOT, "tools/cli/check-stage-steps.mjs");
const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "same-package-materials-")));
  roots.push(root);
  const task = join(root, "task"), materials = join(root, "materials"), repo = ROOT;
  for (const dir of [task, materials]) mkdirSync(dir, { recursive: true });
  writeFileSync(join(task, "task.json"), JSON.stringify({
    schema_version: "1.0.0", project_name: "controlled", task_id: "same-package",
    baseline_commit: "HEAD", target_repo_root: repo, activation_cohort: "post",
  }));
  writeFileSync(join(task, "facts.jsonl"), "");
  put(materials, "phases/index.md", "# Pure pointer index\n");
  return { task, materials, repo };
}

function put(base, path, bytes) {
  const file = join(base, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, bytes);
}

function invoke({ task, materials, repo }) {
  return spawnSync(process.execPath, [CHECK,
    `--task-path=${task}`, `--material-root=${materials}`, `--repo-root=${repo}`, "--json",
  ], { cwd: repo, encoding: "utf8" });
}

const sha = text => createHash("sha256").update(text).digest("hex");
const firstDecision = `#### WP1 — controlled
- **结果与消费者**：受控结果；消费者是 controlled consumer。
#### D-001 — controlled decision
- **做什么**：读取受控原件并报告缺口。
- **不做什么**：不写运行时。
- **风险**：缺证据误报。
| AC-01 | 受控结果可回读 | 目标内容明确 |
| OI-001 | 待独立核对 | owner：受控维护者 |
细化：\`quality/evidence/decision-log-refs/controlled-module-details.md\`
`;
const secondDecision = `#### WP2 — second
- **结果与消费者**：受控第二结果；消费者是 WP1。
#### D-002 — second decision
- **做什么**：准备第二输入。
- **不做什么**：不变更第一输入。
- **风险**：输入缺失。
`;
const validOne = '| 1 controlled | D-001 做什么 | D-001 不做什么 | D-001＋details§1 | AC-01 | D-001 风险 | 无 | controlled consumer | OI-001 | 已收敛 |\n';
const validTwo = '| 2 second | D-002 做什么 | D-002 不做什么 | details§2 | AC-01 | D-002 风险 | WP1 | WP1 | 无 | 已收敛 |\n';
const detailsBody = '# 受控细化\n## 1 第一模块\n实现只读报告；原件与退出码分开记录。\n## 2 第二模块\n消费第一模块结果；不新增运行时。\n';
const cardsRef = "quality/evidence/convergence/controlled-cards.md";
const cardSection = id => `## 工作包 ${id}：受控包 ${id}\n\n一句话结果：受控结果。`;

function fiveMaterialFixture(variant) {
  const f = fixture(), ref = "quality/evidence/decision-log-refs/convergence-checklist.md";
  put(f.materials, "decision-log.md", "# Controlled\n## 级别与路线\n- 推荐级别：复杂\n" + firstDecision + secondDecision + `清单：\`${ref}\`\n`);
  put(f.task, "quality/evidence/decision-log-refs/controlled-module-details.md", detailsBody);
  put(f.task, cardsRef, [cardSection(1), cardSection(2)].join("\n"));
  const sections = [];
  for (const id of [1, 2]) {
    const digest = sha(cardSection(id)), base = `quality/evidence/decision-maker/p0${id}`;
    const files = {
      质询: `${base}/discussion.md`, 冷读: `${base}/cold-read.md`,
      对抗: `${base}/adversarial.md`, 真实答复: `${base}/answer.md`,
    };
    for (const [name, path] of Object.entries(files)) put(f.task, path, `# ${name}\n\n任务=same-package；包=${id}；批次=batch-${id}；卡节sha256=${digest}\n`);
    put(f.task, "quality/evidence/talk/overall-confirm.md", "# 整体确认\n\n不能代替本包方案卡。\n");
    const refs = [
      variant === "总确认代卡" && id === 1
        ? `- 当前方案卡：\`quality/evidence/talk/overall-confirm.md\`；包=${id}；批次=batch-${id}；卡节sha256=${digest}`
        : `- 当前方案卡：\`${cardsRef}#工作包-${id}\`；包=${id}；批次=batch-${id}；卡节sha256=${digest}`,
      ...Object.entries(files).filter(([name]) => !(variant === `缺${name}` && id === 1)).map(([name, path]) =>
        `- 当前${name}：\`${path}\`；任务=same-package；包=${id}；批次=batch-${id}；卡节sha256=${digest}`),
    ];
    sections.push(`### 包 ${id} 五件同包原件\n${refs.join("\n")}`);
  }
  put(f.task, ref, validOne + validTwo + "\n" + sections.join("\n\n"));
  return f;
}

function expectDirectionAndPlanRejected(f, category) {
  const result = invoke(f), output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  expect(result.status, `${category} must make the direction checker fail`).not.toBe(0);
  const report = JSON.parse(result.stdout);
  expect(report.convergence.complete, `${category} leaves no complete package for a first plan card`).toBe(false);
  expect(output).toMatch(category === "总确认代卡" ? /总确认|方案卡/ : new RegExp(category.replace("缺", "")));
}

describe("ORACLE-SAME-PACKAGE public material consumption", () => {
  it("declares and consumes the same five named material classes at the real workflow steps", () => {
    const decision = JSON.parse(readFileSync(join(ROOT, "workflows/make-decision/steps.json"), "utf8"));
    const plan = JSON.parse(readFileSync(join(ROOT, "workflows/build-plan/steps.json"), "utf8"));
    const convergence = decision.steps.find(step => step.step_id === 9);
    const draft = decision.steps.find(step => step.step_id === 12);
    const firstPlan = plan.steps.find(step => step.step_id === 1);
    for (const name of ["方案卡", "质询", "冷读", "对抗", "真实答复"]) {
      expect(JSON.stringify(convergence), `make-decision step 9 must name ${name}`).toContain(name);
      expect(JSON.stringify(draft), `make-decision step 12 must re-read ${name}`).toContain(name);
      expect(JSON.stringify(firstPlan), `build-plan step 1 must consume ${name}`).toContain(name);
    }
  });

  it("rejects a removed current-card pointer through the real direction checker", () => {
    const f = fixture();
    const ref = "quality/evidence/decision-log-refs/convergence-checklist.md";
    put(f.task, "facts.jsonl", "");
    put(f.materials, "decision-log.md", [
      "# Controlled",
      "## 级别与路线",
      "- 推荐级别：复杂",
      "#### WP1 — controlled",
      "- **结果与消费者**：controlled result; consumer is the plan author.",
      "清单：`" + ref + "`",
      "",
    ].join("\n"));
    // The decision names a checklist, but its current card pointer and bytes do not exist.
    const result = invoke(f);
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    expect(output).toContain("收敛清单");
    expect(result.status, `missing current card pointer must fail, output=${output}`).toBe(1);
  });

  for (const variant of ["缺质询", "缺对抗", "总确认代卡"]) {
    it(`rejects ${variant} and leaves no complete package for a first plan card`, () => {
      expectDirectionAndPlanRejected(fiveMaterialFixture(variant), variant);
    });
  }
});
