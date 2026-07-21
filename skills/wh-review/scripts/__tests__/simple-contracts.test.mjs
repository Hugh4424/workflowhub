import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..", "..", "..");
const schemaRoot = join(root, "wh-review", "schemas");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const hash = "a".repeat(64);
const oid = "b".repeat(40);

function validator(name) {
  const ajv = new Ajv2020({ strict: false });
  const attempt = readJson(join(schemaRoot, "attempt.schema.json"));
  ajv.addSchema(attempt, "attempt.schema.json");
  return ajv.compile(readJson(join(schemaRoot, name)));
}

describe("simple wh-review contracts", () => {
  it("publishes the simple production entrypoints and bundles their runtime closure", () => {
    const manifest = readJson(join(root, "wh-review", "manifest.json"));
    expect(manifest.commands).toEqual({
      run: "scripts/wh-review-cli.mjs run",
      "verify-final": "scripts/wh-review-cli.mjs verify-final"
    });
    expect(manifest).toMatchObject({
      stage_materials: "stage-materials.json",
      stage_skill_plan: "stage-skill-plan.json",
      provider_result_contract: "contracts/workflowhub-result.v1.json"
    });
    const providerProtocol = readFileSync(join(root, "wh-review", "contracts", "provider-protocol.md"), "utf8");
    expect(providerProtocol).toMatch(/`pass`[^\n]*`minor`/);
    expect(providerProtocol).toMatch(/`major`[^\n]*`blocking`[^\n]*`revise_required`/);
    expect(providerProtocol).toMatch(/`revise_required`[^\n]*至少包含一条具体 finding/);
    const bundle = readJson(join(root, "wh-review", "skill-bundle.json"));
    for (const file of [
      "contracts/workflowhub-result.v1.json",
      "schemas/attempt.schema.json",
      "schemas/result.schema.json",
      "schemas/stage-materials.schema.json",
      "scripts/review-materials.mjs",
      "scripts/review-output.mjs",
      "scripts/review-provider-client.mjs",
      "scripts/review-result.mjs",
      "scripts/review-runner.mjs",
      "scripts/review-source.mjs",
      "scripts/wh-review-cli.mjs",
      "stage-materials.json",
      "stage-skill-plan.json"
    ]) expect(bundle.files).toContain(file);
  });

  it("documents the complete public review input instead of forcing callers to guess", () => {
    const skill = readFileSync(join(root, "wh-review", "SKILL.md"), "utf8");
    for (const field of ["task_path", "project_name", "task_id", "stage", "host_provider", "materials"]) {
      expect(skill, field).toContain(`\"${field}\"`);
    }
    for (const material of ["raw_requirement", "approved_decision", "draft_spec", "approved_spec", "acceptance_criteria", "test_evidence", "acceptance_evidence", "open_exceptions"]) {
      expect(skill, material).toContain(material);
    }
    expect(skill).toMatch(/3rd-review config/i);
    expect(skill).toMatch(/must not select providers/i);
    expect(skill).toMatch(/`review_instructions`; callers must not add it/);
    expect(skill).toMatch(/Local input validation fails before an attempt exists/);
    expect(skill).toMatch(/do not retry the same material with guessed fields or provider names/);
    expect(skill).toMatch(/Send the input JSON over stdin/);
    expect(skill).toMatch(/Never place a transient review-input file in/);
    for (const root of ["runner", "target repository", "CandidateWorkspace", "TaskHandle"]) expect(skill).toContain(root);
  });

  it("keeps the stage skill plan limited to provider-visible lenses", () => {
    const plan = readJson(join(root, "wh-review", "stage-skill-plan.json"));
    expect(plan.version).toBe(1);
    const entries = [
      ...Object.values(plan.stages["make-decision"].tracks),
      ...Object.entries(plan.stages).filter(([stage]) => stage !== "make-decision").map(([, value]) => value)
    ];
    for (const entry of entries) {
      expect(Object.keys(entry).sort()).toEqual(expect.arrayContaining(["delivery_mode", "logical_skill_id", "required_skills", "review_mode"]));
      expect(entry.delivery_mode).toBe("file_only");
      expect(entry.review_mode).toBe("lens-only");
      expect(entry).not.toHaveProperty("output_schema");
      expect(entry).not.toHaveProperty("continuation_policy");
      expect(entry).not.toHaveProperty("bundle_hash");
    }
  });

  it("keeps verify-code reviewer lenses available only for standalone diagnostics", () => {
    const plan = readJson(join(root, "wh-review", "stage-skill-plan.json"));
    expect(plan.stages["build-code"].required_skills).not.toHaveLength(0);
    expect(plan.stages["verify-code"].invocation).toBe("standalone-diagnostic-only");
    for (const stage of ["build-code", "verify-code"])
      for (const skill of plan.stages[stage].required_skills) expect(existsSync(join(root, skill, "SKILL.md")), `${stage}: ${skill}`).toBe(true);
  });

  it("accepts a terminal attempt and keeps unavailable outside semantic results", () => {
    const validateAttempt = validator("attempt.schema.json");
    const attempt = {
      version: "wh-review-attempt.v1",
      attempt_id: "attempt-1",
      task_id: "task-1",
      stage: "build-code",
      review_track: null,
      subject_kind: "worktree", phase_id: null, base_tree: oid, candidate_tree: oid,
      source: { target_commit: oid, base_commit: oid, base_tree: oid, captured_head: oid },
      snapshot_tree: oid,
      material_id: hash,
      provider_attempts: [{ provider: "opencode", status: "failed", session_id: null, runtime_id: null, output_ref: null, error: { code: "AUTH", message: "login required" } }],
      terminal_status: "unavailable",
      error: { code: "PROVIDER_UNAVAILABLE", message: "no valid provider" }
    };
    expect(validateAttempt(attempt), validateAttempt.errors).toBe(true);

    const validateResult = validator("result.schema.json");
    const result = {
      version: "wh-review-result.v1",
      task_id: "task-1",
      stage: "build-code",
      review_track: null,
      subject_kind: "worktree", phase_id: null, base_tree: oid, candidate_tree: oid,
      source: attempt.source,
      snapshot_tree: oid,
      material_id: hash,
      attempt_ref: "reviews/attempts/attempt-1/attempt.json",
      provider_results: [{ provider: "opencode" }],
      verdict: "unavailable",
      findings: []
    };
    expect(validateResult(result)).toBe(false);

    expect(validateAttempt({ ...attempt, terminal_status: "semantic", error: attempt.error })).toBe(false);
    expect(validateAttempt({ ...attempt, terminal_status: "unavailable", error: null })).toBe(false);
  });

  it("accepts the stage matrix and enforces blind direction inputs", () => {
    const matrix = readJson(join(root, "wh-review", "stage-materials.json"));
    const validate = validator("stage-materials.schema.json");
    expect(validate(matrix), validate.errors).toBe(true);
    const direction = matrix.stages["make-decision"].tracks.direction;
    expect(direction.required).toEqual(expect.arrayContaining(["raw_requirement", "objective_facts"]));
    expect(direction.forbidden).toEqual(expect.arrayContaining(["proposed_solution", "decision_log", "spec", "plan", "changes_diff"]));
    const plan = readJson(join(root, "wh-review", "stage-skill-plan.json"));
    expect(plan.stages["make-decision"].tracks.direction.required_skills)
      .toEqual(expect.arrayContaining(["intake-decision-review"]));
  });

  it("accepts additive fields in workflowhub-result.v1", () => {
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(readJson(join(root, "wh-review", "contracts", "workflowhub-result.v1.json")));
    expect(validate({
      result_protocol: "workflowhub-result.v1",
      provider: "kimi",
      status: "completed",
      material_id: hash,
      session_id: "session-1",
      output: "{}",
      error: null,
      future_optional_field: true
    }), validate.errors).toBe(true);
  });

  it("keeps portable quality lenses and provider isolation in every stage contract", () => {
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      const contract = readFileSync(join(root, "wh-review", "contracts", `${stage}.md`), "utf8");
      expect(contract, stage).toMatch(/provider.*冻结材料/);
      expect(contract, stage).toMatch(/必需材料|共同材料/);
      expect(contract, stage).toMatch(/审查重点/);
      expect(contract, stage).toMatch(/verdict.*summary.*findings/s);
    }
    const plan = readJson(join(root, "wh-review", "stage-skill-plan.json"));
    expect(plan.stages["build-spec"].optional_skills).toEqual([{ name: "plan-design-review", when: "ui" }]);
    expect(plan.stages["verify-code"].optional_skills).toEqual([{ name: "isolated-browser-qa", when: "ui" }]);
  });

  it("wires simplicity-guard only into proposal-bearing reviews", () => {
    const plan = readJson(join(root, "wh-review", "stage-skill-plan.json"));
    const manifest = readJson(join(root, "wh-review", "manifest.json"));
    expect(plan.stages["make-decision"].tracks.detail.required_skills).toContain("simplicity-guard");
    expect(plan.stages["make-decision"].tracks.direction.required_skills).not.toContain("simplicity-guard");
    expect(plan.stages["build-spec"].required_skills).toContain("simplicity-guard");
    expect(plan.stages["build-plan"].required_skills).toContain("simplicity-guard");
    expect(plan.stages["build-code"].required_skills).toContain("simplicity-guard");
    expect(plan.stages["verify-code"].required_skills).not.toContain("simplicity-guard");
    expect(manifest.contracts["make-decision"].required_skills_by_track.detail).toContain("simplicity-guard");
    expect(manifest.contracts["make-decision"].required_skills_by_track.direction).not.toContain("simplicity-guard");
    expect(manifest.contracts["build-spec"].required_skills).toContain("simplicity-guard");
    expect(manifest.contracts["build-plan"].required_skills).toContain("simplicity-guard");
    expect(manifest.contracts["build-code"].required_skills).toContain("simplicity-guard");
    expect(manifest.contracts["verify-code"].required_skills).not.toContain("simplicity-guard");
    expect(manifest.contracts["build-code"].required_skills).toEqual(plan.stages["build-code"].required_skills);

    const lens = readFileSync(join(root, "simplicity-guard", "SKILL.md"), "utf8");
    expect(lens).toMatch(/P0[\s\S]*P1[\s\S]*P2[\s\S]*P3/);
    expect(lens).toMatch(/scope creep/);
    expect(lens).toMatch(/重复已有能力/);
    expect(lens).toMatch(/没有故障证据/);
    expect(lens).toMatch(/优先删除|删除优于新增/);
    const projection = readJson(join(root, "simplicity-guard", "review-bundle.json"));
    expect(projection).toMatchObject({ mode: "lens-only", delivery_mode: "file_only", entrypoint: "SKILL.md" });

    const projectRoot = join(root, "..");
    for (const stage of ["build-spec", "build-plan", "build-code"]) {
      const prompt = readFileSync(join(projectRoot, "workflows", stage, "SKILL.md"), "utf8");
      const deps = readFileSync(join(projectRoot, "workflows", stage, "skill-deps.yaml"), "utf8");
      expect(prompt).toMatch(/`simplicity-guard` is\s+provider-visible only inside `wh-review`/);
      expect(prompt).not.toMatch(/Apply simplicity review|simplicity review, and/);
      expect(deps).toMatch(/name: simplicity-guard[^\n]*invocation: conditional[^\n]*trigger: wh_review_simplicity_lens/);
    }
    const decisionDeps = readFileSync(join(projectRoot, "workflows", "make-decision", "skill-deps.yaml"), "utf8");
    expect(decisionDeps).toMatch(/name: simplicity-guard[^\n]*invocation: conditional[^\n]*trigger: wh_review_simplicity_lens/);
  });

  it("makes scope expansion revise-required without rejecting necessary protections", () => {
    const lens = readFileSync(join(root, "simplicity-guard", "SKILL.md"), "utf8");
    for (const expansion of [
      "scope creep",
      "重复已有能力",
      "投机性抽象",
      "兼容层",
      "死代码",
      "隐藏失败兜底"
    ]) expect(lens).toContain(expansion);
    expect(lens).toMatch(/任一上述问题[\s\S]*输出 `revise_required`/);
    for (const protection of ["测试", "输入校验", "错误处理", "安全", "可访问性"])
      expect(lens).toMatch(new RegExp(`不得删除[^。]*${protection}|${protection}[\\s\\S]*不得因追求少代码而删掉`));
  });

  it("RED: stage-result facts.review references the result instead of copying a verdict", () => {
    const artifact = {
      status: "success",
      error_code: "",
      retryable: false,
      facts: {
        changed: ["src/a.mjs"],
        tests: { command: "npm test" },
        review: { result_ref: "reviews/results/build-code.json", snapshot_tree: oid },
        worktree_root: "/tmp/source",
        task_tracking_root: "/tmp/task",
        phase_completion: { phase_records: [{ phase_id: "phase-1", changed: true }] }
      },
      missing_items: [],
      user_decision: false,
      reason: "complete"
    };
  });
});
