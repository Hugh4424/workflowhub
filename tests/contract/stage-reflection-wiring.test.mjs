import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";
import { stageReflectionPublication } from "../../tools/cli/stage-runtime.mjs";

const root = resolve(import.meta.dirname, "../..");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

const DISCLOSURE_FIXTURE = Object.freeze([
  { step_slug: "not-started", status: "未启动", output: "未声明", criterion: "未检查" },
  { step_slug: "skipped", status: "跳过", output: "未声明", criterion: "不适用原因" },
  { step_slug: "missing-output", status: "已执行但产物缺失", output: "缺失", criterion: "已声明" },
  { step_slug: "missing-criterion", status: "产物存在而完成判据缺失", output: "存在", criterion: "缺失" },
]);

function read(relative) {
  return readFileSync(resolve(root, relative), "utf8");
}

describe("stage-reflection workflow wiring", () => {
  it("binds the standard stage-runtime entry to the host-owned reflection executor", () => {
    const executor = async () => ({ status: "completed" });
    expect(stageReflectionPublication({ stageReflectionExecutor: executor })).toEqual({ runStageReflection: executor });
    expect(stageReflectionPublication({})).toEqual({});
    expect(() => stageReflectionPublication({ stageReflectionExecutor: true })).toThrow(/must be a function/i);
  });

  it("mounts the non-blocking stage-end step and skill in every stage", () => {
    const catalog = yaml.load(read("skills/catalog.yaml"));
    const catalogEntry = catalog.skills.find((entry) => entry.name === "stage-reflection");
    expect(catalogEntry).toBeTruthy();

    const bundleRaw = read("skills/stage-reflection/skill-bundle.json");
    const bundle = JSON.parse(bundleRaw);
    expect(bundle).toMatchObject({ schema_version: 1, skill: "stage-reflection" });
    expect(bundle.files.map((entry) => typeof entry === "string" ? entry : entry.path)).toEqual(expect.arrayContaining(["SKILL.md"]));
    const fileEntries = bundle.files.map((entry) => ({
      path: typeof entry === "string" ? entry : entry.path,
      sha256: createHash("sha256").update(read(`skills/stage-reflection/${typeof entry === "string" ? entry : entry.path}`)).digest("hex"),
    })).sort((a, b) => a.path.localeCompare(b.path));
    const bundleHash = createHash("sha256").update(JSON.stringify(fileEntries)).digest("hex");
    expect(catalogEntry.local_bundle_hash).toBe(bundleHash);
    expect(catalogEntry.used_by_stages).toEqual(stages);

    for (const stage of stages) {
      const steps = JSON.parse(read(`workflows/${stage}/steps.json`)).steps;
      const reflection = steps.find((step) => step.step_slug === "stage-reflection");
      expect(reflection, `${stage} stage-reflection step`).toMatchObject({
        on_stage_end: true,
        blocking: false,
        entry_conditions: expect.any(Array),
        completion_evidence: expect.any(Array),
        observable_result: expect.any(String),
        depends_on: expect.any(Array),
      });
      expect(reflection.step_id).toBe(steps.length);
      expect(reflection.order).toBe(steps.length);
      expect(reflection.depends_on).toEqual([steps.at(-2).step_id]);

      const manifest = yaml.load(read(`workflows/${stage}/skill-deps.yaml`));
      const dependency = manifest.skills.find((skill) => skill.name === "stage-reflection");
      expect(dependency, `${stage} stage-reflection dependency`).toMatchObject({
        name: "stage-reflection",
        path: "skills/stage-reflection/SKILL.md",
        execution: "inline",
        trigger: "on_stage_end",
        bundle: "skills/stage-reflection/skill-bundle.json",
        owner: "stage",
        consumer: {
          target: "stage-runner#runStageEndReflection",
          inputs: expect.arrayContaining(["artifacts.decision-log.md"]),
          identity: ["task_id", "stage", "workspace_path"],
          result: "stage_reflection",
        },
      });
    }
  });

  it("mounts stage-handoff only on the four author stages and keeps verify-code out", () => {
    const authorStages = ["make-decision", "build-spec", "build-plan", "build-code"];
    const handoffInputs = {
      "make-decision": ["artifacts.decision-log.md"],
      "build-spec": ["artifacts.decision-log.md", "artifacts.spec.md"],
      "build-plan": ["artifacts.decision-log.md", "artifacts.spec.md", "artifacts.plan.md", "artifacts.tasks.md"],
      "build-code": ["artifacts.decision-log.md", "artifacts.spec.md", "artifacts.plan.md", "artifacts.tasks.md"],
    };
    const catalog = yaml.load(read("skills/catalog.yaml"));
    const catalogEntry = catalog.skills.find((entry) => entry.name === "stage-handoff");
    expect(catalogEntry).toBeTruthy();
    const bundle = JSON.parse(read("skills/stage-handoff/skill-bundle.json"));
    expect(bundle).toMatchObject({ schema_version: 1, skill: "stage-handoff" });
    const fileEntries = bundle.files.map((entry) => ({
      path: typeof entry === "string" ? entry : entry.path,
      sha256: createHash("sha256").update(read(`skills/stage-handoff/${typeof entry === "string" ? entry : entry.path}`)).digest("hex"),
    })).sort((a, b) => a.path.localeCompare(b.path));
    expect(catalogEntry.local_bundle_hash).toBe(createHash("sha256").update(JSON.stringify(fileEntries)).digest("hex"));
    expect(catalogEntry.used_by_stages).toEqual(authorStages);

    for (const stage of [...authorStages, "verify-code"]) {
      const manifest = yaml.load(read(`workflows/${stage}/skill-deps.yaml`));
      const dependency = manifest.skills.find((skill) => skill.name === "stage-handoff");
      if (authorStages.includes(stage)) {
        expect(dependency, `${stage} stage-handoff dependency`).toMatchObject({
          name: "stage-handoff",
          path: "skills/stage-handoff/SKILL.md",
          execution: "inline",
          trigger: "on_stage_end",
          bundle: "skills/stage-handoff/skill-bundle.json",
          owner: "stage",
          consumer: {
            target: "stage-runner#runStageEndReflection",
            result: "stage_handoff",
          },
        });
        expect(dependency.consumer.inputs).toEqual(expect.arrayContaining(handoffInputs[stage]));
      } else {
        expect(dependency).toBeUndefined();
      }
    }
  });

  it("planning-hardening AC-CHECK-001 requires per-manifest status disclosure with separate output and completion facts", () => {
    const statuses = DISCLOSURE_FIXTURE.map((entry) => entry.status);
    expect(new Set(statuses)).toEqual(new Set([
      "未启动",
      "跳过",
      "已执行但产物缺失",
      "产物存在而完成判据缺失",
    ]));

    for (const stage of stages) {
      const workflow = read(`workflows/${stage}/SKILL.md`);
      expect(workflow, `${stage} must name the manifest`).toMatch(/steps\.json|steps manifest/i);
      expect(workflow, `${stage} must disclose every declared step`).toMatch(/逐项/);
      expect(workflow, `${stage} must separate output existence from completion`).toMatch(/产物(?:是否)?存在性|产物存在/);
      expect(workflow, `${stage} must name the completion criterion`).toMatch(/完成判据/);
      expect(workflow, `${stage} must preserve not-started facts`).toMatch(/未启动|not_started/);
      expect(workflow, `${stage} must preserve skipped facts`).toMatch(/跳过|skipped/);
      expect(workflow, `${stage} must preserve missing-output facts`).toMatch(/产物缺失/);
      expect(workflow, `${stage} must preserve missing-criterion facts`).toMatch(/完成判据缺失/);
      expect(workflow, `${stage} must keep executor absence unavailable`).toMatch(/executor_absent[\s\S]{0,120}(?:不可用|unavailable)|(?:不可用|unavailable)[\s\S]{0,120}executor_absent/i);
      expect(workflow, `${stage} must disclose a missing outcome`).toMatch(/无 outcome|没有 outcome|outcome 缺失/i);
      expect(workflow, `${stage} must keep unavailable distinct from skipped`).toMatch(/不可用[\s\S]{0,120}跳过|跳过[\s\S]{0,120}不可用/i);
    }
  });
});

describe("FINAL-GOVERNANCE P8", () => {
  const bundleTargets = [
    { skill: "spec-analyze", bundle: "skills/spec-analyze/skill-bundle.json" },
    { skill: "stage-handoff", bundle: "skills/stage-handoff/skill-bundle.json" },
    { skill: "stage-reflection", bundle: "skills/stage-reflection/skill-bundle.json" },
    { skill: "wh-review", bundle: "skills/wh-review/skill-bundle.json" },
  ];
  const catalogTargets = [
    ...bundleTargets.map(({ skill }) => skill),
    "workflowhub-host-protocol",
  ];
  const workflowStages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
  const deferred = readFileSync(resolve(root, "../../../Downloads/workflowhub-deferred-items-20260915.md"), "utf8");
  const decisionLog = read("specs/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md");

  function bundleFileEntries(bundlePath) {
    const bundle = JSON.parse(read(bundlePath));
    return bundle.files.map((entry) => {
      const path = typeof entry === "string" ? entry : entry.path;
      const raw = read(`${bundlePath.slice(0, bundlePath.lastIndexOf("/"))}/${path}`);
      return { path, sha256: createHash("sha256").update(raw).digest("hex") };
    }).sort((a, b) => a.path.localeCompare(b.path));
  }

  it("AC-CLEANUP-004: aligns all bundle declarations and the five catalog closure hashes", () => {
    const catalog = yaml.load(read("skills/catalog.yaml"));
    const entries = new Map(catalog.skills.map((entry) => [entry.name, entry]));
    for (const { skill, bundle: bundlePath } of bundleTargets) {
      const bundle = JSON.parse(read(bundlePath));
      const actualFiles = bundleFileEntries(bundlePath);
      const declaredFiles = bundle.files
        .filter((entry) => typeof entry !== "string")
        .map(({ path, sha256 }) => ({ path, sha256 }))
        .sort((a, b) => a.path.localeCompare(b.path));
      expect(declaredFiles, `${skill} bundle declarations`).toEqual(actualFiles.filter(({ path }) =>
        declaredFiles.some((entry) => entry.path === path)));
      const expectedBundleHash = createHash("sha256").update(JSON.stringify(actualFiles)).digest("hex");
      expect(entries.get(skill)?.local_bundle_hash, `${skill} catalog hash`).toBe(expectedBundleHash);
    }
    expect(entries.get("workflowhub-host-protocol")?.local_bundle_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(decisionLog).toMatch(/接受 25b44430(?: 已合入)?字节为基线/);
  });

  it("AC-GOV-001: preserves the human-confirmation boundary", () => {
    expect(decisionLog).toMatch(/人工确认点.*保持原样|人工确认点.*不在本任务范围/);
    for (const stage of workflowStages) {
      expect(read(`workflows/${stage}/SKILL.md`), stage).not.toMatch(/(?:减少|增加|搬移)人工确认点/);
    }
  });

  it("AC-GOV-002: keeps the task free of new collection and unmeasured benefit claims", () => {
    expect(decisionLog).toMatch(/不新增任何统计、收集、度量、遥测/);
    expect(decisionLog).toMatch(/不产出无法实测的收益数字/);
    expect(decisionLog).toMatch(/measure-test-runtime-profile\.mjs/);
    expect(decisionLog).toMatch(/接消费者/);
  });

  it("AC-GOV-003: records the net-zero declaration change and explicit disclosure exception", () => {
    expect(decisionLog).toMatch(/C1 重新对齐声明/);
    expect(decisionLog).toMatch(/8 文件 9 行值替换，净 0/);
    expect(decisionLog).toMatch(/约 \+10 行/);
    expect(decisionLog).toMatch(/outcome 披露|披露措辞/);
    expect(decisionLog).toMatch(/显式例外/);
  });

  it("AC-GOV-004: names all four official checks and the no-masking rule", () => {
    expect(decisionLog).toMatch(/check-skill-closure\.mjs exit 0/);
    expect(decisionLog).toMatch(/smoke-local-skill-dispatch\.mjs exit 0/);
    expect(decisionLog).toMatch(/verify-structure 与 run-checks 不劣化/);
    expect(decisionLog).toMatch(/更新声明哈希.*(?:bundle 内容与声明仍不一致|掩盖)/);
  });

  it("AC-GOV-005: has one terminal, reasoned and owned entry for DEF-01..09", () => {
    for (let index = 1; index <= 9; index += 1) {
      expect(deferred, `DEF-${String(index).padStart(2, "0")}`).toMatch(new RegExp(`^### DEF-${String(index).padStart(2, "0")}\\b`, "m"));
    }
    expect(deferred).toMatch(/DEF-01～DEF-09/);
    expect(deferred).toMatch(/取消理由/);
    expect(deferred).toMatch(/触发条件/);
    expect(deferred).toMatch(/owner/);
    expect(deferred).toMatch(/唯一验收账本.*acceptance_criterion/);
  });

  it("AC-GOV-006: keeps the two material entrances, one identity writer and no third material writer", () => {
    expect(decisionLog).toMatch(/材料写入入口(?:仍为|数为) 2 个|材料写入入口数与唯一写入者数量/);
    expect(decisionLog).toMatch(/identity 仍单写者|唯一写入者/);
    expect(decisionLog).toMatch(/不启用[\s\S]{0,80}material-workspace\.mjs:91[\s\S]{0,40}第三套材料写入实现/);
  });

  it("AC-GOV-007: keeps the cross-repository authorization and provider breadth boundaries", () => {
    expect(decisionLog).toMatch(/授权改动清单[\s\S]{0,240}3rd-review/);
    expect(decisionLog).toMatch(/不改.*config\.json/);
    expect(decisionLog).toMatch(/不减少 antigravity 派发/);
  });

  it("AC-GOV-008: keeps the product non-UI boundary", () => {
    expect(decisionLog).toMatch(/零页面|纯 CLI/);
    expect(decisionLog).toMatch(/UI applicability.*non_ui|non_ui/);
  });

  it("AC-GOV-009: marks historical numbers without reproducible originals", () => {
    expect(decisionLog).toMatch(/无原件不可复核/);
    expect(decisionLog).toMatch(/不得作为收益基线/);
  });

  it("AC-GOV-010: keeps acceptance_criterion facts as the only acceptance ledger", () => {
    expect(decisionLog).toMatch(/质量账本只认.*acceptance_criterion/);
    expect(decisionLog).toMatch(/通过判据与失败判据/);
    expect(decisionLog).not.toMatch(/quality\/verify\.json.*唯一验收账本/);
  });
});
