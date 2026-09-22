import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

import { buildPlanningArtifacts } from "../../skills/wh-review/scripts/review-materials.mjs";
import { validateSkillBundle } from "../../runtime/adapters/local-skill-resolver.mjs";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");
const taskCards = (markdown) => markdown.split(/^#{3,4} /m).slice(1).map((part) => {
  const [heading, ...lines] = part.split("\n");
  return { id: heading.slice(0, 4), body: lines.join("\n") };
});
const backtickValues = (body, label) => {
  const line = body.split("\n").find((item) => item.startsWith("- **" + label + "**：")) ?? "";
  return [...line.matchAll(/`([^`]+)`/g)].map(([, value]) => value);
};

describe("spec and plan content artifact closure", () => {
  it("keeps the current OI authority inside decision-log and synchronizes its bundle", () => {
    const skill = read("skills/decision-log/SKILL.md");
    const template = read("skills/decision-log/templates/decision-log-template.md");
    const workflow = read("workflows/make-decision/SKILL.md");
    expect(`${skill}\n${template}`).toMatch(/one current OI|唯一.*OI/i);
    expect(`${skill}\n${template}`).toMatch(/questions-only/);
    expect(workflow).toMatch(/`approve-decision`[\s\S]{0,180}(?:existing|既有)/i);
    const bundle = validateSkillBundle(root, "skills/decision-log/skill-bundle.json", "skills/decision-log/SKILL.md");
    const catalog = yaml.load(read("skills/catalog.yaml"));
    expect(catalog.skills.find((entry) => entry.name === "decision-log").local_bundle_hash).toBe(bundle.bundleHash);
  });

  it("puts the decision-log source index into the derived build-plan packet", () => {
    const matrix = JSON.parse(read("runtime/review/stage-materials.json"));
    expect(matrix.stages["build-plan"].generated).toContain("planning_artifacts");
    expect(matrix.stages["build-plan"].required).toContain("raw_requirement");
    const packet = buildPlanningArtifacts({
      rawRequirementIndex: {
        schema_version: "raw-requirement-index.v1",
        source_artifact: "decision-log",
        entries: [{ id: "R-001", decision_ids: ["D-001"], summary: "原始要求" }],
      },
      approvedSpec: "spec",
      acceptanceCriteria: "acceptance",
      draftPlan: "plan",
      draftTasks: "tasks",
    });
    expect(packet.schema_version).toBe("spec-analyze-planning-artifacts.v1");
    expect(packet.raw_requirement_index.source_artifact).toBe("decision-log");
    expect(packet).not.toHaveProperty("decision_log_index");
    expect(packet.draft_tasks).toBe("tasks");
  });

  it("RED: makes spec-plan the sole phase author and spec-tasks a pointer-only index", () => {
    const specSkill = read("skills/spec-specify/SKILL.md");
    const specTemplate = read("skills/spec-specify/templates/spec-template.md");
    const phaseSkill = read("skills/spec-plan/SKILL.md");
    const phaseTemplate = read("skills/spec-plan/templates/phase-template.md");
    const indexSkill = read("skills/spec-tasks/SKILL.md");
    const indexTemplate = read("skills/spec-tasks/templates/index-template.md");
    const buildSpec = yaml.load(read("workflows/build-spec/skill-deps.yaml"));
    const buildPlan = yaml.load(read("workflows/build-plan/skill-deps.yaml"));

    expect(`${specSkill}\n${specTemplate}`).toMatch(/narrative|叙事/i);
    expect(`${specSkill}\n${specTemplate}`).toMatch(/Appendix A|附件 A/i);
    expect(`${specSkill}\n${specTemplate}`).toMatch(/requirement|需求/i);
    expect(`${specSkill}\n${specTemplate}`).toMatch(/acceptance.*flow|验收流程/is);
    expect(`${specSkill}\n${specTemplate}`).toMatch(/test.*standard|测试标准/is);
    expect(`${specSkill}\n${specTemplate}`).toMatch(/architecture.*boundar|架构边界/is);

    expect(`${phaseSkill}\n${phaseTemplate}`).toMatch(/sole phase (?:engineering )?author|单一 phase 工程权威/i);
    for (const level of ["L0", "L1", "L2"]) expect(phaseTemplate, `${level} phase contract`).toContain(level);
    expect(phaseTemplate).toMatch(/write set|写集/i);
    expect(phaseTemplate).toMatch(/DO NOT TOUCH|禁改/i);
    expect(phaseTemplate).toMatch(/gate_cmd/);
    expect(phaseTemplate).toMatch(/oracle/i);
    expect(phaseTemplate).toMatch(/STOP/);

    expect(`${indexSkill}\n${indexTemplate}`).toMatch(/pure pointer|纯指针/i);
    expect(indexTemplate).toMatch(/^## (?:Execution )?Index|^## 执行索引/m);
    expect(indexTemplate).toMatch(/semantic anchor|语义锚点/i);
    expect(indexTemplate).toMatch(/write set|写集/i);
    expect(indexTemplate).toMatch(/consumer|消费者/i);
    expect(indexTemplate).not.toMatch(/^## Phase P\d+/m);
    expect(indexTemplate).not.toMatch(/^#### T\d+ /m);
    expect(indexTemplate).not.toMatch(/^### (?:Goal|Files|Tasks|Verify|Knowledge|STOP|Done|Risks and rollback)$/m);
    expect(indexTemplate).not.toMatch(/gate_cmd|expected_exit|oracle|evidence_path/);

    expect(buildPlan.skills.map((item) => item.name)).toEqual(expect.arrayContaining([
      "spec-specify", "spec-clarify", "spec-plan", "spec-tasks",
    ]));
    expect(buildSpec.skills.map((item) => item.name)).not.toEqual(expect.arrayContaining([
      "spec-specify", "spec-plan", "spec-tasks", "spec-clarify",
    ]));
  });

  it("keeps post-cohort build-plan as the coherent specification owner", () => {
    const buildPlan = read("workflows/build-plan/SKILL.md");
    const specSkill = read("skills/spec-specify/SKILL.md");
    const clarifySkill = read("skills/spec-clarify/SKILL.md");

    expect(buildPlan).toMatch(/post-cohort[\s\S]{0,180}writes[\s\S]{0,120}spec\.md[\s\S]{0,120}phases\/P<n>\.md[\s\S]{0,120}phases\/index\.md/i);
    expect(buildPlan).toMatch(/pre-cohort 回 `build-spec`，post-cohort 回本 stage 的\s*`spec-specify`/);
    expect(buildPlan).not.toMatch(/This stage owns only `plan\.md` and `tasks\.md`/);
    expect(specSkill).toMatch(/callbacks supplied by the owning author stage:[\s\S]{0,120}`build-plan` for post-cohort tasks/i);
    expect(clarifySkill).toMatch(/owning spec-authoring step/i);
  });

  it("keeps portable skill bundles closed after the authoring split", () => {
    const catalog = yaml.load(read("skills/catalog.yaml"));
    const authoringSkills = new Set([
      "decision-log", "spec-specify", "spec-plan", "spec-tasks",
      "spec-analyze", "wh-review",
    ]);
    for (const item of catalog.skills.filter((entry) => authoringSkills.has(entry.name) && entry.local_bundle_hash && entry.path)) {
      const bundle = item.path.replace(/SKILL\.md$/, "skill-bundle.json");
      if (!existsSync(join(root, bundle))) continue;
      expect(validateSkillBundle(root, bundle, item.path).bundleHash, `${item.name} bundle hash`).toBe(item.local_bundle_hash);
    }
    expect(catalog.skills.find((item) => item.name === "spec-clarify").used_by_stages).toEqual(["build-plan"]);
  });

  it("keeps the current P3 task cards source-bound and executable", () => {
    const markdown = read("specs/archive/multica-issues-monitoring-g6-g7-20260805/tasks.md");
    const cards = taskCards(markdown).filter(({ id }) => ["T005", "T006"].includes(id));
    expect(cards).toHaveLength(2);
    const requiredLabels = ["source_refs / decision_refs", "execution_file_paths", "test_strategy_owner", "test tier / test method", "fixtures_services", "evidence_path", "coverage limits"];
    for (const { id, body } of cards) {
      for (const label of requiredLabels) {
        const hasLabel = body.split("\n").some((line) => line.startsWith("- **" + label + "**：") || (label === "coverage limits" && line.startsWith("- **coverage_limits**：")));
        expect(hasLabel, id + " missing " + label).toBe(true);
      }
      const exact = backtickValues(body, "精确文件");
      const execution = backtickValues(body, "execution_file_paths").flatMap((value) => { try { return JSON.parse(value); } catch { return [value]; } });
      expect(exact.length, id + " has no exact file boundary").toBeGreaterThan(0);
      expect(execution.length, id + " has no execution file paths").toBeGreaterThan(0);
      expect(new Set(exact)).toEqual(new Set(execution));
      for (const file of [...exact, ...execution]) {
        expect(file.endsWith("/") || file.includes("*") || file.includes("..."), id + " contains a directory/glob path").toBe(false);
        expect(statSync(join(root, file)).isFile(), id + " path is not a file: " + file).toBe(true);
      }
      expect(body).toMatch(/- \*\*test_strategy_owner\*\*：`?build-plan\/high-intelligence-model/);
      expect(body).toMatch(/source_refs \/ decision_refs.*(?:R-[0-9]+|D-[0-9]+)/);
    }
    expect(markdown).toMatch(/## 4\. Final current-snapshot aggregate strategy/);
    expect(markdown).toMatch(/\*\*execution_contract\*\*：当前快照运行一次/s);
  });
});
