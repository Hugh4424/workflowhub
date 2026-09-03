import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "../..");
const cli = join(repoRoot, "tools/cli/build-reflection-page.mjs");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const now = "2026-08-31T00:00:00.000Z";
const htmlVoidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

function assertBalancedHtmlTags(html) {
  const source = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "");
  const tags = /<\/?([A-Za-z][\w:-]*)(?:\s[^<>]*?)?\/?\s*>/g;
  const stack = [];
  for (const match of source.matchAll(tags)) {
    const token = match[0];
    const name = match[1].toLowerCase();
    if (htmlVoidTags.has(name) || /\/\s*>$/.test(token)) continue;
    if (/^<\//.test(token)) {
      const open = stack.pop();
      expect(open, `unexpected closing tag </${name}>`).toBe(name);
    } else {
      stack.push(name);
    }
  }
  expect(stack, "unclosed HTML tags").toEqual([]);
}

function contrastRatio(foreground, background) {
  const channel = (value) => {
    const normalized = Number.parseInt(value, 16) / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex) => 0.2126 * channel(hex.slice(1, 3)) + 0.7152 * channel(hex.slice(3, 5)) + 0.0722 * channel(hex.slice(5, 7));
  const [bright, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (bright + 0.05) / (dark + 0.05);
}

function writeJson(path, value) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function reflection(taskId, stage, overrides = {}) {
  return {
    schema_version: "stage-reflection.v1",
    record_kind: "judgment",
    task_id: taskId,
    stage,
    stage_status: "completed",
    generated_at: "2026-08-30T12:00:00.000Z",
    status: "ok",
    error: null,
    judgments: [],
    interventions: [],
    lessons_added: [],
    ...overrides,
  };
}

function outcome(stage, taskId, overrides = {}) {
  return {
    schema_version: "workflowhub-stage-outcomes.v1",
    task_id: taskId,
    stage,
    generated_at: "2026-08-30T12:00:00.000Z",
    step_outcomes: [{
      step_slug: `${stage}-step`,
      input_refs: [],
      evidence_refs: [],
      output_refs: [`quality/evidence/${stage}.md`],
    }],
    skill_outcomes: [],
    ...overrides,
  };
}

function writeOutcome(taskRoot, stage, value) {
  const raw = `${JSON.stringify(value)}\n`;
  const digest = createHash("sha256").update(raw).digest("hex");
  const path = join(taskRoot, "quality/evidence/stage-outcomes", stage, `${digest}.json`);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, raw);
}

function loadPageFixture(name) {
  return JSON.parse(readFileSync(join(repoRoot, "tests/fixtures/reflection-page", name), "utf8"));
}

function writeAvailabilityFact(taskRoot, value) {
  const raw = `${JSON.stringify(value)}\n`;
  const digest = createHash("sha256").update(raw).digest("hex");
  const path = join(taskRoot, "quality/evidence/stage-reflection-availability", `${digest}.json`);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, raw);
}

function makeAvailabilityFixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-reflection-page-availability-"));
  const project = "FixtureProject";
  const tasksRoot = join(root, "Projects", project, "tasks");
  const out = join(root, "page");
  mkdirSync(tasksRoot, { recursive: true });
  const facts = loadPageFixture("availability-facts.json");
  const states = loadPageFixture("five-states.json");
  const taskIds = [
    ...facts.facts.map((fact) => fact.task_identity.task_id),
    facts.priority.task_id,
    facts.never_started.task_id,
    facts.unknown.task_id,
    ...states.fixed_states.map((fixed) => fixed.task_id),
  ];
  for (const taskId of taskIds) mkdirSync(join(tasksRoot, taskId), { recursive: true });
  for (const fact of facts.facts) writeAvailabilityFact(join(tasksRoot, fact.task_identity.task_id), fact);
  for (const fixed of states.fixed_states) {
    writeJson(join(tasksRoot, fixed.task_id, "quality/stage-reflection", `${fixed.stage}.json`), reflection(fixed.task_id, fixed.stage, {
      status: fixed.status,
      ...(fixed.status === "failed" ? { error: { summary: "fixture failure" } } : {}),
    }));
  }
  const priorityTaskRoot = join(tasksRoot, facts.priority.task_id);
  writeJson(join(priorityTaskRoot, "quality/stage-reflection/build-code.json"), reflection(facts.priority.task_id, "build-code", { status: "failed", error: { summary: "fixed reflection wins" } }));
  writeAvailabilityFact(priorityTaskRoot, {
    schema_version: "stage-reflection-availability.v1",
    record_kind: "availability",
    task_id: facts.priority.task_id,
    stage: facts.priority.stage,
    state: facts.priority.availability_state,
    reason_code: "executor_absent",
    observed_at: "2026-08-30T12:00:00.000Z",
    task_identity: { task_id: facts.priority.task_id, worktree: "/tmp/workflowhub", branch: "task/availability" },
  });
  writeOutcome(join(tasksRoot, facts.never_started.task_id), facts.never_started.later_stage, outcome(facts.never_started.later_stage, facts.never_started.task_id));
  return { root, tasksRoot, out, project };
}

function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-reflection-page-"));
  const project = "FixtureProject";
  const tasksRoot = join(root, "Projects", project, "tasks");
  const out = join(root, "page");
  const legacy = join(root, "m15-retirement", "history.json");
  mkdirSync(tasksRoot, { recursive: true });
  writeJson(legacy, { immutable: true, sample: "legacy" });

  const taskA = join(tasksRoot, "task-a");
  const taskB = join(tasksRoot, "task-b");
  const taskEmpty = join(tasksRoot, "task-empty");
  const taskOld = join(tasksRoot, "task-old");
  for (const taskRoot of [taskA, taskB, taskEmpty, taskOld]) mkdirSync(taskRoot, { recursive: true });
  for (const taskRoot of [taskA, taskB]) {
    mkdirSync(join(taskRoot, "quality/evidence"), { recursive: true });
    writeFileSync(join(taskRoot, "quality/evidence/build-spec.md"), "fixture evidence\n");
  }
  const confirmationRefs = new Map();
  const confirmationRef = (taskId, stepSlug) => confirmationRefs.get(`${taskId}/${stepSlug}`);
  for (const [taskRoot, taskId] of [[taskA, "task-a"], [taskB, "task-b"], [taskOld, "task-old"]]) {
    for (const stepSlug of ["spec-clarify", "stage-reflection"]) {
      const stage = stepSlug === "spec-clarify" ? "build-spec" : "build-plan";
      const value = taskId === "task-b" && stepSlug === "spec-clarify" ? {
        schema_version: "human-confirmation.v1",
        task_id: taskId,
        stage,
        attempt_ref: "legacy-attempt.json",
        decision: "accepted",
        confirmed_at: "2026-08-30T12:00:00.000Z",
      } : taskId === "task-a" && stepSlug === "stage-reflection" ? {
        schema_version: "human-confirmation.v2",
        task_id: taskId,
        stage,
        decision: "accepted",
        subject_ref: "quality/reviews/attempts/old-review.json",
        material_revision: `revision-${"c".repeat(64)}`,
        snapshot_tree: "d".repeat(40),
        confirmed_at: "2026-08-30T12:00:00.000Z",
      } : {
        schema_version: "human-confirmation.v3",
        task_id: taskId,
        stage,
        decision: "accepted",
        subject_ref: stepSlug,
        material_revision: `revision-${"c".repeat(64)}`,
        snapshot_tree: "d".repeat(40),
        confirmed_at: "2026-08-30T12:00:00.000Z",
        reply_text: "保留当前步骤，下一轮再看。",
        step_slug: stepSlug,
      };
      const raw = `${JSON.stringify(value, null, 2)}\n`;
      const ref = `quality/confirmations/${createHash("sha256").update(raw).digest("hex")}.json`;
      confirmationRefs.set(`${taskId}/${stepSlug}`, ref);
      mkdirSync(join(taskRoot, "quality/confirmations"), { recursive: true });
      writeFileSync(join(taskRoot, ref), raw);
    }
  }
  const intervention = (taskId, stepSlug) => ({
    confirmation_ref: confirmationRef(taskId, stepSlug),
    step_slug: stepSlug,
    reply_text: "保留当前步骤，下一轮再看。",
    attribution: "human",
    confidence: "high",
  });

  writeJson(join(taskA, "quality/stage-reflection/build-spec.json"), reflection("task-a", "build-spec", {
    judgments: [
      {
        subject_id: "spec-clarify",
        subject_kind: "step",
        classification: "simplify",
        severity: "high",
        reason: "两个输入步骤重复读取同一事实。",
        evidence_refs: ["quality/evidence/build-spec.md"],
        confidence: "high",
        next_review_trigger: "下一次 build-spec 再出现重复输入时",
      },
      {
        subject_id: "spec-clarify",
        subject_kind: "step",
        classification: "simplify",
        severity: "high",
        reason: "两个输入步骤重复读取同一事实。",
        evidence_refs: ["quality/evidence/build-spec.md"],
        confidence: "high",
        next_review_trigger: "下一次 build-spec 再出现重复输入时",
      },
      {
        subject_id: "spec-specify",
        subject_kind: "step",
        classification: "optimize",
        severity: "medium",
        reason: "该步骤等待不必要的重复扫描。",
        evidence_refs: [],
        confidence: "medium",
        next_review_trigger: "下一次阶段耗时超过基线时",
      },
      {
        subject_id: "read-decision-log",
        subject_kind: "step",
        classification: "keep",
        severity: "low",
        reason: "该步骤当前没有可见问题。",
        evidence_refs: [],
        confidence: "low",
        next_review_trigger: "下一次同类任务完成时",
      },
    ],
    interventions: [intervention("task-a", "spec-clarify")],
    lessons_added: ["quality/stage-reflection/build-spec.json"],
  }));
  writeJson(join(taskA, "quality/stage-reflection/build-code.json"), reflection("task-a", "build-code", {
    stage_status: "failed",
    status: "failed",
    error: { summary: "前置测试失败，复盘仍已写入。" },
  }));
  for (const stage of stages) {
    const value = stage === "build-plan"
      ? outcome(stage, "task-a", { step_outcomes: [{ step_slug: `${stage}-step`, input_refs: ["quality/evidence/build-spec.md"], evidence_refs: [], output_refs: [`quality/evidence/${stage}.md`] }] })
      : outcome(stage, "task-a");
    writeOutcome(taskA, stage, value);
  }

  writeJson(join(taskB, "quality/stage-reflection/build-spec.json"), reflection("task-b", "build-spec", {
    judgments: [{
      subject_id: "spec-clarify",
      subject_kind: "step",
      classification: "simplify",
      severity: "high",
      reason: "同一职责在两个步骤中重复。",
      evidence_refs: ["quality/evidence/build-spec.md"],
      confidence: "high",
      next_review_trigger: "下一次 build-spec 出现同职责步骤时",
    }],
    interventions: [intervention("task-b", "spec-clarify")],
  }));
  writeJson(join(taskB, "quality/stage-reflection/build-plan.json"), reflection("task-b", "build-plan", {
    status: "degraded",
    judgments: [{
      subject_id: "stage-reflection",
      subject_kind: "skill",
      classification: "add",
      severity: "low",
      reason: "需要补充一条可观察的输入说明。",
      evidence_refs: ["quality/evidence/missing.md"],
      confidence: "low",
      next_review_trigger: "下一次 build-plan 复盘时",
    }],
    interventions: [intervention("task-b", "stage-reflection")],
  }));
  writeFileSync(join(taskB, "quality/stage-reflection/verify-code.json"), "{\"not\":\"a reflection\"}\n");
  for (const stage of stages) {
    const value = stage === "build-plan"
      ? outcome(stage, "task-b", { step_outcomes: [{ step_slug: `${stage}-step`, input_refs: ["quality/evidence/build-spec.md"], evidence_refs: [], output_refs: [`quality/evidence/${stage}.md`] }] })
      : outcome(stage, "task-b");
    writeOutcome(taskB, stage, value);
  }
  writeJson(join(taskOld, "quality/stage-reflection/build-spec.json"), reflection("task-old", "build-spec", {
    generated_at: "2026-07-01T12:00:00.000Z",
    judgments: [{
      subject_id: "spec-clarify",
      subject_kind: "step",
      classification: "simplify",
      severity: "high",
      reason: "过期样本不应进入最近窗口。",
      evidence_refs: [],
      confidence: "low",
      next_review_trigger: "下一次真实任务出现时",
    }],
    interventions: [intervention("task-old", "spec-clarify")],
  }));

  const lessonsRoot = join(root, "Projects", project, "lessons");
  mkdirSync(lessonsRoot, { recursive: true });
  writeFileSync(join(lessonsRoot, "build-spec.jsonl"), [
    JSON.stringify({ entry_kind: "raw_observation", entry_id: "raw-1", observed_at: "2026-08-30T12:01:00.000Z", task_id: "task-a", stage: "build-spec", text: "发现重复输入。", reflection_ref: "quality/stage-reflection/build-spec.json", merged: false }),
    JSON.stringify({ entry_kind: "merged_lesson", entry_id: "lesson-1", merged_at: "2026-08-30T12:02:00.000Z", stage: "build-spec", lesson: "重复输入应在阶段内合并。", severity: "high", occurrence_count: 2, source_refs: [{ task_id: "task-a", raw_entry_id: "raw-1" }], supersedes: [] }),
  ].join("\n") + "\n");
  writeFileSync(join(lessonsRoot, "build-plan.jsonl"), "not-json\n");

  return { root, tasksRoot, out, legacy, project };
}

function runCli(fixture) {
  return execFileSync(process.execPath, [
    cli,
    `--root=${fixture.root}`,
    `--tasks-root=${fixture.tasksRoot}`,
    `--out=${fixture.out}`,
    `--now=${now}`,
  ], { encoding: "utf8" });
}

function readProjectedData(path) {
  const context = {};
  vm.runInNewContext(readFileSync(path, "utf8"), context);
  return context.__WH_MONITOR_DATA__;
}

describe("build-reflection-page projection", () => {
  it("keeps the static HTML structure balanced", () => {
    const template = readFileSync(join(repoRoot, "tools/cli/build-reflection-page-template.html"), "utf8");
    assertBalancedHtmlTags(template);
    expect(template).toContain("本页是静态快照，浏览器脚本只做本地渲染、筛选和展开，不读取网络。");
    expect(template).toContain("overflow-wrap: anywhere");
    expect(template).toContain("请重新生成 monitor 数据并重新打开页面。");
    expect(template).toContain("<!-- __WH_MONITOR_DATA_SCRIPT__ -->");
    expect(template).toContain("judgmentLayerLabel");
    expect(template).toContain("stage.availability_fact?.reason_code");
    expect(template).not.toContain('<script src="data.js"></script>');
  });

  it("proves contrast tokens and DOM focus order independently", () => {
    const template = readFileSync(join(repoRoot, "tools/cli/build-reflection-page-template.html"), "utf8");
    const token = (name) => template.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
    const colors = Object.fromEntries(["surface", "surface-subtle", "ink", "muted", "blue", "blue-soft", "warning", "warning-soft", "danger", "danger-soft", "quiet"].map((name) => [name, token(name)]));
    expect(Object.values(colors)).not.toContain(undefined);
    for (const [foreground, background] of [
      ["ink", "surface"], ["muted", "surface"], ["quiet", "surface"], ["blue", "surface"],
      ["warning", "surface"], ["danger", "surface"], ["ink", "surface-subtle"],
      ["blue", "blue-soft"], ["warning", "warning-soft"], ["danger", "danger-soft"],
    ]) expect(contrastRatio(colors[foreground], colors[background]), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.blue, colors.surface)).toBeGreaterThanOrEqual(3);

    const staticInteractiveIds = [...template.matchAll(/<(?:button|select)\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
    expect(staticInteractiveIds).toEqual([
      "task-tab", "overall-tab", "evolution-tab", "task-filter", "stage-filter", "classification-filter", "evidence-toggle", "evolution-action-more", "evolution-reference-more",
    ]);
    expect([...template.matchAll(/\btabindex="([1-9]\d*)"/g)]).toHaveLength(0);
    expect(template).toMatch(/button:focus-visible, select:focus-visible \{[^}]*outline:\s*2px solid var\(--blue\)/);
  });

  it("projects task/overall views, all states, safe refs, and read-only consumption data", () => {
    const fixture = makeFixture();
    try {
      expect(() => runCli(fixture)).not.toThrow();

      const dataPath = join(fixture.out, "data.js");
      const htmlPath = join(fixture.out, "workflowhub-monitor.html");
      const data = readProjectedData(dataPath);
      const html = readFileSync(htmlPath, "utf8");
      assertBalancedHtmlTags(html);
      expect(html).toContain("globalThis.__WH_MONITOR_DATA__ = Object.freeze(");
      expect(html).not.toContain('<script src="data.js"></script>');
      const legacyBefore = readFileSync(fixture.legacy, "utf8");
      if (process.env.WORKFLOWHUB_KEEP_PAGE_FIXTURE === "1") console.log(JSON.stringify({ page: fixture.out, root: fixture.root }));

      expect(readFileSync(dataPath, "utf8")).toContain("Object.freeze(");
      expect(data.schema_version).toBe("workflowhub-reflection-page.v1");
      expect(data.evolution).toMatchObject({ schema_version: "workflow-evolution.v1" });
      expect(data.evolution.status).toBe("ok");
      expect(data.evolution.publication_generation).toBe(1);
      expect(data.evolution.regions).toMatchObject({
        summary_status: "partial",
        action_suggested: { status: "empty" },
        reference_only: { status: "unverified", validation_status: "unverified" },
        quality_tax: { status: "insufficient_samples" },
      });
      expect(data.evolution.unverified_judgments).toEqual(expect.arrayContaining([
        expect.objectContaining({ task_id: "task-a", stage: "build-spec", subject_id: "spec-specify" }),
        expect.objectContaining({ task_id: "task-a", stage: "build-spec", subject_id: "read-decision-log" }),
      ]));
      expect(Array.isArray(data.evolution.candidates)).toBe(true);
      expect(data.evolution.candidates.length).toBeGreaterThan(0);
      expect(data.evolution.candidates[0]).toEqual(expect.objectContaining({ confidence: expect.stringMatching(/^(high|medium|low)$/), priority_score: expect.any(Number), freshness: "current" }));
      expect(data.evolution.candidates[0].source_observations[0].stage).toBe("build-spec");
      expect(Array.isArray(data.evolution.candidates[0].source_observations[0].evidence_refs)).toBe(true);
      expect(data.evolution.source_inventory_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(data.evolution.quality_tax).toMatchObject({ label: "未验证，待真实任务数据" });
      expect(data.evolution.quality_tax.sample_count).toBe(3);
      expect(data.judgment_layer).toMatchObject({ record_kind: "judgment", is_fact: false });
      expect(data.filters.tasks).toEqual(["task-a", "task-b", "task-empty", "task-old"]);
      expect(data.filters.stages).toEqual(stages);
      expect(data.filters.classifications).toEqual(expect.arrayContaining(["keep", "optimize", "simplify", "merge", "remove_candidate", "add", "needs_evidence"]));

      const pending = data.overall_pending;
      expect(pending[0]).toMatchObject({ subject_id: "spec-clarify", classification: "simplify", frequency: 2, score: 6 });
      expect(pending[0].source_task_stages).toHaveLength(2);
      expect(pending.some((entry) => entry.subject_id === "spec-clarify" && entry.frequency > 2)).toBe(false);
      expect(pending.some((entry) => entry.subject_id === "read-decision-log")).toBe(false);
      expect(data.evolution.candidates.flatMap((entry) => entry.source_observations ?? []).some((entry) => entry.task_id === "task-old")).toBe(false);

      const taskA = data.tasks.find((task) => task.task_id === "task-a");
      const taskB = data.tasks.find((task) => task.task_id === "task-b");
      const empty = data.tasks.find((task) => task.task_id === "task-empty");
      expect(taskA.stages.find((stage) => stage.stage === "build-code").state).toBe("failed");
      expect(taskA.state).toBe("failed");
      expect(taskA.stages.find((stage) => stage.stage === "make-decision").state).toBe("unknown");
      expect(taskB.stages.find((stage) => stage.stage === "build-plan").state).toBe("degraded");
      expect(taskB.stages.find((stage) => stage.stage === "verify-code").state).toBe("unavailable");
      expect(empty.state).toBe("empty");
      expect(data.tasks.find((task) => task.task_id === "task-old").stages.find((stage) => stage.stage === "build-spec").state).toBe("stale");
      expect(taskA.stages.find((stage) => stage.stage === "build-spec").judgments[0].evidence_refs[0]).toMatchObject({
        ref: "quality/evidence/build-spec.md",
        safe_ref: "quality/evidence/build-spec.md",
      });
      expect(taskA.stages.find((stage) => stage.stage === "build-spec").interventions[0]).toMatchObject({
        reply_text: "保留当前步骤，下一轮再看。",
        step_slug: "spec-clarify",
      });
      const missingRef = taskB.stages.find((stage) => stage.stage === "build-plan").judgments[0].evidence_refs[0];
      expect(missingRef).toMatchObject({ ref: "quality/evidence/missing.md", safe_ref: null, state: "unavailable" });
      expect(data.lessons.by_stage["build-spec"]).toHaveLength(2);
      expect(taskA.lessons).toHaveLength(2);
      expect(taskA.lessons.every((entry) => entry.task_ids.includes("task-a"))).toBe(true);
      expect(data.consumption_edges.some((edge) => edge.ref === "quality/evidence/build-spec.md" && edge.target.stage === "build-plan" && edge.task_id === "task-a")).toBe(true);
      expect(data.consumption_edges.some((edge) => edge.ref === "quality/evidence/build-spec.md" && edge.target.stage === "build-plan" && edge.task_id === "task-b")).toBe(true);
      expect(data.states).toEqual(expect.arrayContaining(["unknown", "unavailable", "degraded", "failed", "empty", "fatal", "stale"]));
      expect(html).toContain("id=\"task-view\"");
      expect(html).toContain("id=\"overall-pending\"");
      expect(html).toContain("id=\"evolution-view\"");
      expect(html.indexOf("建议行动")).toBeLessThan(html.indexOf("仅供参考"));
      expect(html.indexOf("仅供参考")).toBeLessThan(html.indexOf("前期质量税"));
      expect(html).toContain("id=\"evolution-action-suggested\"");
      expect(html).toContain("id=\"evolution-reference-only\"");
      expect(html).toContain("const sortEvolutionCandidates =");
      expect(html).toContain("显示更多");
      expect(html).toContain("展开全部证据");
      expect(html).toContain("收起证据");
      expect(html).toContain("aria-expanded");
      expect(html).toContain('make("span", "evidence-entry")');
      expect(html).toContain('evidenceWrap.querySelectorAll(".evidence-entry").forEach((node, index) => { node.hidden = !expanded && index >= 1; })');
      expect(html).toContain('const showReference = (ref) =>');
      expect(html).toContain('link.addEventListener("click", () => showReference(safe));');
      expect(html).toContain('const referencePanel = el("reference-panel"); referencePanel.hidden = true;');
      expect(html).toContain("当前分区状态：");
      expect(html).toContain('taxStatus === "ok" ? (tax.ratio === null || tax.ratio === undefined ? "unknown" : tax.ratio) : taxStatus');
      expect(html).toContain("subject=${subject}; task=${observation.task_id || \"unknown\"}; evidence=${kind}");
      expect(html).toContain("aria-selected=\"false\"");
      expect(html).toContain("const activateView =");
      expect(html).toContain("id=\"task-filter\"");
      expect(html).toContain("judgment");
      expect(html).toContain("ready: \"ready\"");
      for (const state of ["empty", "error", "insufficient_samples", "unavailable", "stale", "unverified", "not_checked", "not_applicable"]) {
        expect(html).toContain(`${state}: \"${state}\"`);
      }
      expect(html).toContain("grid-template-columns: minmax(0, 1fr)");
      expect(html).not.toMatch(/\b(fetch|XMLHttpRequest|setTimeout|setInterval)\s*\(/);
      expect(html).not.toContain("href=\"quality/evidence/../../etc/passwd\"");
      expect(readFileSync(fixture.legacy, "utf8")).toBe(legacyBefore);

      expect(() => runCli(fixture)).not.toThrow();
      const second = readProjectedData(dataPath);
      expect(second.evolution.status).toBe("ok");
      expect(second.evolution.publication_generation).toBe(2);
      expect(second.evolution.snapshot_id).not.toBe(data.evolution.snapshot_id);
      expect(second.evolution.snapshot_content_id).toBe(data.evolution.snapshot_content_id);
    } finally {
      if (process.env.WORKFLOWHUB_KEEP_PAGE_FIXTURE !== "1") rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("derives not_scheduled and unavailable from availability facts without overriding fixed records", () => {
    const fixture = makeAvailabilityFixture();
    try {
      expect(() => runCli(fixture)).not.toThrow();
      const data = readProjectedData(join(fixture.out, "data.js"));
      const statesFixture = loadPageFixture("five-states.json");
      const unavailable = data.tasks.find((task) => task.task_id === "task-availability-unavailable");
      expect(unavailable.stages.find((stage) => stage.stage === "build-code")).toMatchObject({
        state: "unavailable",
        reflection_status: "unavailable",
        is_fact: true,
        availability_fact: { state: "unavailable", reason_code: "executor_absent" },
      });

      const notScheduled = data.tasks.find((task) => task.task_id === "task-availability-not-scheduled");
      expect(notScheduled.stages.find((stage) => stage.stage === "build-plan")).toMatchObject({
        state: "not_scheduled",
        reflection_status: "not_scheduled",
        judgment_layer: "fact",
        is_fact: true,
      });

      const priority = data.tasks.find((task) => task.task_id === "task-availability-priority");
      expect(priority.stages.find((stage) => stage.stage === "build-code")).toMatchObject({ state: "failed", reflection_status: "failed", is_fact: false });

      for (const fixed of statesFixture.fixed_states) {
        const task = data.tasks.find((entry) => entry.task_id === fixed.task_id);
        expect(task.stages.find((stage) => stage.stage === fixed.stage)).toMatchObject({ state: fixed.status, reflection_status: fixed.status, is_fact: false });
      }

      const neverStarted = data.tasks.find((task) => task.task_id === "task-never-started");
      expect(neverStarted.stages.find((stage) => stage.stage === "build-plan")).toMatchObject({ state: "not_scheduled", reflection_status: "not_scheduled", judgment_layer: "judgment", is_fact: false });

      const unknown = data.tasks.find((task) => task.task_id === "task-unknown");
      expect(unknown.stages.find((stage) => stage.stage === "build-plan")).toMatchObject({ state: "unknown", reflection_status: "unknown" });
      expect(data.states).toEqual(expect.arrayContaining(["unknown", "unavailable", "degraded", "failed", ...statesFixture.availability_states]));
      const v1Schema = JSON.parse(readFileSync(join(repoRoot, "runtime/schemas/stage-reflection.v1.json"), "utf8"));
      expect(v1Schema.properties.status.enum).toContain("not_scheduled");
      const generatedHtml = readFileSync(join(fixture.out, "workflowhub-monitor.html"), "utf8");
      expect(generatedHtml).toContain('not_scheduled: "not_scheduled"');
      expect(generatedHtml).toContain(`.state-${statesFixture.style_reuse.not_scheduled}`);

      const futureTaskRoot = join(fixture.tasksRoot, "task-future-availability");
      mkdirSync(futureTaskRoot, { recursive: true });
      writeAvailabilityFact(futureTaskRoot, {
        schema_version: "stage-reflection-availability.v1",
        record_kind: "availability",
        task_id: "task-future-availability",
        stage: "build-plan",
        state: "not_scheduled",
        reason_code: "preflight_failed",
        observed_at: "2026-09-02T12:00:00.000Z",
        task_identity: { task_id: "task-future-availability", worktree: "/tmp/workflowhub", branch: "task/availability" },
      });
      expect(() => runCli(fixture)).not.toThrow();
      const futureData = readProjectedData(join(fixture.out, "data.js"));
      expect(futureData.tasks.find((task) => task.task_id === "task-future-availability").stages.find((stage) => stage.stage === "build-plan")).toMatchObject({ state: "unknown", availability_fact: null });

      const futureOutcomeTaskRoot = join(fixture.tasksRoot, "task-future-outcome");
      mkdirSync(futureOutcomeTaskRoot, { recursive: true });
      writeOutcome(futureOutcomeTaskRoot, "build-code", outcome("build-code", "task-future-outcome", { generated_at: "2026-09-02T12:00:00.000Z" }));
      expect(() => runCli(fixture)).not.toThrow();
      const futureOutcomeData = readProjectedData(join(fixture.out, "data.js"));
      expect(futureOutcomeData.tasks.find((task) => task.task_id === "task-future-outcome").stages.find((stage) => stage.stage === "build-plan")).toMatchObject({ state: "unknown", availability_fact: null });

      const malformedOutcomeTaskRoot = join(fixture.tasksRoot, "task-malformed-outcome");
      mkdirSync(malformedOutcomeTaskRoot, { recursive: true });
      writeOutcome(malformedOutcomeTaskRoot, "build-code", outcome("build-code", "task-malformed-outcome", { generated_at: "not-a-timestamp" }));
      expect(() => runCli(fixture)).not.toThrow();
      const malformedOutcomeData = readProjectedData(join(fixture.out, "data.js"));
      expect(malformedOutcomeData.tasks.find((task) => task.task_id === "task-malformed-outcome").stages.find((stage) => stage.stage === "build-plan")).toMatchObject({ state: "unknown", availability_fact: null });

      const malformedReflectionTaskRoot = join(fixture.tasksRoot, "task-malformed-reflection");
      mkdirSync(join(malformedReflectionTaskRoot, "quality/stage-reflection"), { recursive: true });
      writeJson(join(malformedReflectionTaskRoot, "quality/stage-reflection/build-code.json"), reflection("task-malformed-reflection", "build-code", { generated_at: "not-a-timestamp" }));
      expect(() => runCli(fixture)).not.toThrow();
      const malformedReflectionData = readProjectedData(join(fixture.out, "data.js"));
      expect(malformedReflectionData.tasks.find((task) => task.task_id === "task-malformed-reflection").stages.find((stage) => stage.stage === "build-code")).toMatchObject({
        state: "unavailable",
        reflection_status: null,
      });
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("excludes future reflections from the live candidate and tax windows", () => {
    const fixture = makeFixture();
    try {
      const path = join(fixture.tasksRoot, "task-old/quality/stage-reflection/build-spec.json");
      const value = JSON.parse(readFileSync(path, "utf8"));
      value.generated_at = "2026-09-01T00:00:00.000Z";
      writeJson(path, value);

      const taskAReflectionPath = join(fixture.tasksRoot, "task-a/quality/stage-reflection/build-spec.json");
      const taskAReflection = JSON.parse(readFileSync(taskAReflectionPath, "utf8"));
      const currentConfirmationRef = taskAReflection.interventions[0].confirmation_ref;
      const futureConfirmation = JSON.parse(readFileSync(join(fixture.tasksRoot, "task-a", currentConfirmationRef), "utf8"));
      futureConfirmation.confirmed_at = "2026-09-01T00:00:00.000Z";
      const futureConfirmationRaw = `${JSON.stringify(futureConfirmation, null, 2)}\n`;
      const futureConfirmationRef = `quality/confirmations/${createHash("sha256").update(futureConfirmationRaw).digest("hex")}.json`;
      writeFileSync(join(fixture.tasksRoot, "task-a", futureConfirmationRef), futureConfirmationRaw);
      taskAReflection.interventions[0].confirmation_ref = futureConfirmationRef;
      writeJson(taskAReflectionPath, taskAReflection);

      expect(() => runCli(fixture)).not.toThrow();
      const data = readProjectedData(join(fixture.out, "data.js"));
      expect(data.tasks.find((task) => task.task_id === "task-old").stages.find((stage) => stage.stage === "build-spec").state).toBe("stale");
      expect(data.evolution.candidates.flatMap((entry) => entry.source_observations ?? []).some((entry) => entry.task_id === "task-old")).toBe(false);
      expect(data.evolution.candidates.flatMap((entry) => entry.source_observations ?? []).some((entry) => entry.task_id === "task-a")).toBe(false);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("fails closed when tasks root traverses a symlinked project ancestor", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-reflection-page-"));
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-reflection-page-outside-"));
    try {
      mkdirSync(join(root, "Projects"), { recursive: true });
      mkdirSync(join(outside, "tasks", "task-a"), { recursive: true });
      symlinkSync(outside, join(root, "Projects", "Demo"), "dir");
      const out = join(root, "page");
      const result = spawnSync(process.execPath, [
        cli,
        `--root=${root}`,
        `--tasks-root=${join(root, "Projects", "Demo", "tasks")}`,
        `--out=${out}`,
        `--now=${now}`,
      ], { encoding: "utf8", stdio: "pipe" });

      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain("contains a symlink");
      expect(readFileSync(join(out, "data.js"), "utf8")).toContain('"status": "fatal"');
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("keeps the page visible but refuses to publish evolution for a foreign target", () => {
    const fixture = makeFixture();
    try {
      const path = join(fixture.tasksRoot, "task-a/quality/stage-reflection/build-spec.json");
      const value = JSON.parse(readFileSync(path, "utf8"));
      value.judgments[0].subject_id = "foreign-step";
      writeJson(path, value);
      expect(() => runCli(fixture)).not.toThrow();
      const data = readProjectedData(join(fixture.out, "data.js"));
      expect(data.evolution.status).toBe("unavailable");
      expect(data.evolution.diagnostics[0].summary).toContain("target authority resolution failed");
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("escapes script-closing input before embedding frozen data.js", () => {
    const fixture = makeFixture();
    try {
      const path = join(fixture.tasksRoot, "task-a/quality/stage-reflection/build-spec.json");
      const value = JSON.parse(readFileSync(path, "utf8"));
      value.judgments[0].reason = "</script><script>globalThis.__INJECTED__ = true;</script>";
      writeJson(path, value);
      expect(() => runCli(fixture)).not.toThrow();

      const dataSource = readFileSync(join(fixture.out, "data.js"), "utf8");
      expect(dataSource).not.toContain("</script>");
      expect(dataSource).toContain("\\u003c/script>");
      const context = {};
      vm.runInNewContext(dataSource, context);
      expect(context.__INJECTED__).toBeUndefined();
      expect(context.__WH_MONITOR_DATA__.tasks.find((task) => task.task_id === "task-a").stages.find((stage) => stage.stage === "build-spec").judgments[0].reason).toContain("</script>");
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("covers the mixed v1/v2/availability/historical/malformed input contract", () => {
    const fixture = makeFixture();
    try {
      const v2TaskRoot = join(fixture.tasksRoot, "task-v2");
      const v2Confirmation = {
        schema_version: "human-confirmation.v3",
        task_id: "task-v2",
        stage: "build-plan",
        decision: "accepted",
        subject_ref: "stage-reflection",
        material_revision: `revision-${"c".repeat(64)}`,
        snapshot_tree: "d".repeat(40),
        confirmed_at: "2026-08-30T12:00:00.000Z",
        reply_text: "继续记录这次人工介入。",
        step_slug: "stage-reflection",
      };
      const v2ConfirmationRaw = `${JSON.stringify(v2Confirmation, null, 2)}\n`;
      const v2ConfirmationRef = `quality/confirmations/${createHash("sha256").update(v2ConfirmationRaw).digest("hex")}.json`;
      mkdirSync(join(v2TaskRoot, "quality/confirmations"), { recursive: true });
      writeFileSync(join(v2TaskRoot, v2ConfirmationRef), v2ConfirmationRaw);
      writeJson(join(v2TaskRoot, "quality/stage-reflection/build-plan.json"), {
        schema_version: "stage-reflection.v2",
        record_kind: "judgment",
        task_id: "task-v2",
        stage: "build-plan",
        stage_status: "completed",
        generated_at: "2026-08-30T12:00:00.000Z",
        status: "ok",
        error: null,
        judgments: [{
          subject_id: "stage-reflection",
          subject_kind: "step",
          classification: "simplify",
          severity: "medium",
          reason: "v2 判断应进入既有候选消费链。",
          evidence_refs: [],
          confidence: "medium",
          next_review_trigger: "下一次 build-plan 复核时",
        }],
        interventions: [{
          confirmation_ref: v2ConfirmationRef,
          step_slug: "stage-reflection",
          reply_text: "继续记录这次人工介入。",
          attribution: "human",
          confidence: "medium",
        }],
        lessons_added: [],
        status_matrix: {
          code: { state: "completed", evidence_refs: [] },
          verify: { state: "unknown", evidence_refs: [] },
          physical_close: { state: "unknown", evidence_refs: [] },
          acceptance: { state: "unknown", evidence_refs: [] },
          release: { state: "unknown", evidence_refs: [] },
        },
        identity: { task_id: "task-v2", worktree: "/tmp/workflowhub", branch: "task/v2" },
        source_completeness: { compaction: false, truncation: false, visible_scope: "fixture", unknown_reasons: [] },
        what_helped: { state: "none_observed", items: [] },
        what_to_improve: { state: "none_observed", items: [] },
        blockers: { state: "none_observed", items: [] },
        intervention_reasons: { state: "none_observed", items: [] },
        what_to_simplify: { state: "observed", items: [{ summary: "v2 fixture", evidence_refs: [], confidence: "medium" }] },
        simplifiable_now: { state: "none_observed", items: [] },
      });

      const availabilityTaskRoot = join(fixture.tasksRoot, "task-availability-only");
      writeAvailabilityFact(availabilityTaskRoot, {
        schema_version: "stage-reflection-availability.v1",
        record_kind: "availability",
        task_id: "task-availability-only",
        stage: "build-plan",
        state: "not_scheduled",
        reason_code: "preflight_failed",
        observed_at: "2026-08-30T12:00:00.000Z",
        task_identity: { task_id: "task-availability-only", worktree: "/tmp/workflowhub", branch: "task/availability" },
      });

      const lessonsRoot = join(fixture.root, "Projects", fixture.project, "lessons");
      writeFileSync(join(lessonsRoot, "verify-code.jsonl"), `${JSON.stringify({
        entry_kind: "merged_lesson",
        entry_id: "historical-1",
        task_id: "unknown-historical-thread",
        stage: "verify-code",
        historical_replay: true,
        lesson: "历史回放只能进入参考区。",
        severity: "medium",
        occurrence_count: 1,
        source_refs: [{ task_id: "unknown-historical-thread", raw_entry_id: "historical-1" }],
        evidence_refs: ["quality/evidence/historical-replay-20260901/transcript-index.jsonl"],
        supersedes: [],
      })}\n`);

      expect(() => runCli(fixture)).not.toThrow();
      const data = readProjectedData(join(fixture.out, "data.js"));
      const v2Stage = data.tasks.find((task) => task.task_id === "task-v2").stages.find((stage) => stage.stage === "build-plan");
      expect(v2Stage.state).not.toBe("unavailable");
      expect(data.evolution.candidates.some((entry) => entry.source_observations?.some((observation) => observation.task_id === "task-v2"))).toBe(true);
      expect(data.evolution.candidates.some((entry) => entry.historical_replay === true)).toBe(true);
      expect(data.evolution.candidates.filter((entry) => entry.historical_replay === true).every((entry) => entry.tier === "reference_only")).toBe(true);
      expect(data.evolution.candidates.find((entry) => entry.historical_replay === true)).toMatchObject({ judgment_layer: "fact", is_fact: true });
      expect(data.evolution.quality_tax.sample_count).toBe(4);
      expect(data.evolution.candidates.some((entry) => entry.source_observations?.some((observation) => observation.task_id === "task-availability-only"))).toBe(false);
      expect(data.diagnostics.some((entry) => entry.summary.includes("lesson build-plan.jsonl:1 unavailable"))).toBe(true);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });
});
