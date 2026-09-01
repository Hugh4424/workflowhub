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
  it("projects task/overall views, all states, safe refs, and read-only consumption data", () => {
    const fixture = makeFixture();
    try {
      expect(() => runCli(fixture)).not.toThrow();

      const dataPath = join(fixture.out, "data.js");
      const htmlPath = join(fixture.out, "workflowhub-monitor.html");
      const data = readProjectedData(dataPath);
      const html = readFileSync(htmlPath, "utf8");
      const legacyBefore = readFileSync(fixture.legacy, "utf8");
      if (process.env.WORKFLOWHUB_KEEP_PAGE_FIXTURE === "1") console.log(JSON.stringify({ page: fixture.out, root: fixture.root }));

      expect(readFileSync(dataPath, "utf8")).toContain("Object.freeze(");
      expect(data.schema_version).toBe("workflowhub-reflection-page.v1");
      expect(data.evolution).toMatchObject({ schema_version: "workflow-evolution.v1" });
      expect(data.evolution.status).toBe("ok");
      expect(data.evolution.publication_generation).toBe(1);
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

      const taskA = data.tasks.find((task) => task.task_id === "task-a");
      const taskB = data.tasks.find((task) => task.task_id === "task-b");
      const empty = data.tasks.find((task) => task.task_id === "task-empty");
      expect(taskA.stages.find((stage) => stage.stage === "build-code").state).toBe("failed");
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
});
