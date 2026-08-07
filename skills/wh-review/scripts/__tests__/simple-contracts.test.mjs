import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..", "..", "..");
const projectRoot = join(root, "..");
const runtimeReviewRoot = join(projectRoot, "runtime", "review");
const schemaRoot = join(runtimeReviewRoot, "schemas");
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
      "format-correct": "scripts/wh-review-cli.mjs format-correct",
      "verify-final": "scripts/wh-review-cli.mjs verify-final",
      doctor: "scripts/wh-review-cli.mjs doctor"
    });
    expect(manifest).toMatchObject({
      runtime_review: {
        stage_materials: "runtime/review/stage-materials.json",
        schemas: {
          attempt: "runtime/review/schemas/attempt.schema.json",
          result: "runtime/review/schemas/result.schema.json",
          stage_materials: "runtime/review/schemas/stage-materials.schema.json",
          ac_evidence_summary: "runtime/review/schemas/ac-evidence-summary.schema.json"
        }
      },
      stage_skill_plan: "stage-skill-plan.json",
      provider_result_contract: "contracts/workflowhub-result.v2.json"
    });
    const providerProtocol = readFileSync(join(root, "wh-review", "contracts", "provider-protocol.md"), "utf8");
    expect(providerProtocol).toMatch(/`pass`[^\n]*`minor`/);
    expect(providerProtocol).toMatch(/`major`[^\n]*`blocking`[^\n]*`revise_required`/);
    expect(providerProtocol).toMatch(/`revise_required`[^\n]*至少包含一条具体 finding/);
    const e2e = readFileSync(join(root, "..", "docs", "wh-review-e2e.md"), "utf8");
    expect(e2e).toMatch(/source_repo/);
    expect(e2e).toMatch(/active_runners/);
    expect(e2e).toMatch(/fresh_stage_runtime/);
    const bundle = readJson(join(root, "wh-review", "skill-bundle.json"));
    const bundlePaths = bundle.files.map((file) => typeof file === "string" ? file : file.path);
    for (const file of [
      "contracts/workflowhub-result.v1.json",
      "contracts/workflowhub-result.v2.json",
      "scripts/review-materials.mjs",
      "scripts/ac-evidence-summary.mjs",
      "scripts/review-controller.mjs",
      "scripts/review-output.mjs",
      "scripts/review-provider-client.mjs",
      "scripts/review-result.mjs",
      "scripts/review-runner.mjs",
      "scripts/review-source.mjs",
      "scripts/wh-review-cli.mjs",
      "stage-skill-plan.json"
    ]) expect(bundlePaths).toContain(file);
  });

  it("documents the complete public review input instead of forcing callers to guess", () => {
    const skill = readFileSync(join(root, "wh-review", "SKILL.md"), "utf8");
    for (const field of ["task_path", "project_name", "task_id", "stage", "host_provider", "materials"]) {
      expect(skill, field).toContain(`\"${field}\"`);
    }
    for (const material of ["raw_requirement", "approved_decision", "draft_spec", "approved_spec", "acceptance_criteria", "architect_assessment", "final_test_summary", "open_risks", "test_evidence", "context_map", "evidence_map", "phase_map", "impact_map", "reuse_map", "acceptance_map"]) {
      expect(skill, material).toContain(material);
    }
    expect(skill).toMatch(/3rd-review config/i);
    expect(skill).toMatch(/Runner-owned Skill entrypoint/);
    expect(skill).toMatch(/codex-home\/skills/);
    expect(skill).toMatch(/multica repo checkout\s+https:\/\/github\.com\/Hugh4424\/workflowhub --ref main/);
    expect(skill).toMatch(/npm ci --ignore-scripts/);
    expect(skill).toMatch(/Do not use\s+`npm install`/);
    expect(skill).toMatch(/already injected Runner root exclusively/);
    expect(skill).toMatch(/never[\s\S]*fall back to cwd, the local canonical WorkflowHub repo/i);
    expect(skill).toMatch(/must not select providers/i);
    expect(skill).toMatch(/`review_instructions`; callers must not add it/);
    expect(skill).toMatch(/Local input validation fails before an attempt exists/);
    expect(skill).toMatch(/later retry uses the same public contract[\s\S]*must not guess fields, providers, or models/i);
    expect(skill).toMatch(/Send the input JSON over stdin/);
    expect(skill).toMatch(/Never place a transient review-input file in/);
    for (const root of ["runner", "target repository", "CandidateWorkspace", "TaskHandle"]) expect(skill).toContain(root);
  });

  it("requires the host protocol to provision the canonical Runner when Multica did not inject one", () => {
    const protocol = readFileSync(join(root, "workflowhub-host-protocol", "SKILL.md"), "utf8");
    expect(protocol).toMatch(/multica repo checkout https:\/\/github\.com\/Hugh4424\/workflowhub --ref main/);
    expect(protocol).toMatch(/npm ci --ignore-scripts/);
    expect(protocol).toMatch(/不得用会改写锁文件的 `npm install` 代替/);
    expect(protocol).toMatch(/若 Multica run 已注入 Runner root，必须只使用该注入的绝对路径/);
    expect(protocol).toMatch(/checkout 非零就立即 fail-closed，绝不 fallback/);
    expect(protocol).toMatch(/不能扫描本机目录、猜路径/);
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

    const reviewerSkills = entries.flatMap((entry) => [
      ...entry.required_skills,
      ...(entry.optional_skills ?? []).map(({ name }) => name)
    ]);
    for (const skill of reviewerSkills) {
      const contract = readFileSync(join(root, skill, "SKILL.md"), "utf8");
      expect(contract, skill).toMatch(/\blens\b/i);
    }
    for (const executionSkill of ["diagnosing-bugs", "isolated-browser-qa", "test-routing-advisor", "test-strategy", "review-response"])
      expect(reviewerSkills, executionSkill).not.toContain(executionSkill);

    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      const deps = yaml.load(readFileSync(join(projectRoot, "workflows", stage, "skill-deps.yaml"), "utf8"));
      const reviewOwned = new Set(
        stage === "make-decision"
          ? Object.values(plan.stages[stage].tracks).flatMap((entry) => entry.required_skills)
          : [
              ...plan.stages[stage].required_skills,
              ...(plan.stages[stage].optional_skills ?? []).map(({ name }) => name)
            ]
      );
      for (const dependency of deps.skills.filter(({ name }) => reviewOwned.has(name))) {
        expect(dependency.invocation, `${stage}: ${dependency.name}`).toBe("conditional");
      }
    }

    const stageDependencies = (stage) => yaml.load(
      readFileSync(join(projectRoot, "workflows", stage, "skill-deps.yaml"), "utf8")
    ).skills;
    expect(stageDependencies("build-spec").find(({ name }) => name === "spec-clarify"))
      .toMatchObject({ execution: "inline", invocation: "always", trigger: "ambiguity_scan" });
    expect(stageDependencies("build-plan").find(({ name }) => name === "spec-analyze"))
      .toMatchObject({ execution: "inline", invocation: "always", trigger: "cross_material_analysis" });
    expect(stageDependencies("build-code").find(({ name }) => name === "review")).toBeUndefined();
    expect(stageDependencies("build-code").map(({ name }) => name)).not.toContain("test-strategy");
    expect(stageDependencies("verify-code").filter(({ name }) => ["test-strategy", "isolated-browser-qa"].includes(name)))
      .toEqual([]);
  });

  it("runs verify-code reviewer lenses after fresh evidence as non-gate quality facts", () => {
    const plan = readJson(join(root, "wh-review", "stage-skill-plan.json"));
    expect(plan.stages["build-code"].required_skills).not.toHaveLength(0);
    expect(plan.stages["verify-code"].invocation).toBe("post-first-repair-non-gate");
    for (const stage of ["build-code", "verify-code"])
      for (const skill of plan.stages[stage].required_skills) expect(existsSync(join(root, skill, "SKILL.md")), `${stage}: ${skill}`).toBe(true);
    const deps = yaml.load(readFileSync(join(projectRoot, "workflows", "verify-code", "skill-deps.yaml"), "utf8"));
    expect(deps.skills.find(({ name }) => name === "wh-review"))
      .toMatchObject({ execution: "inline", invocation: "always", trigger: "post_first_repair" });
    const steps = readJson(join(projectRoot, "workflows", "verify-code", "steps.json")).steps;
    const qualityReview = steps.find(({ step_slug }) => step_slug === "run-one-independent-architecture-review");
    const publish = steps.find(({ step_slug }) => step_slug === "publish-verification-attempt");
    expect(qualityReview).toMatchObject({ order: 5, depends_on: [4], completion_evidence: expect.arrayContaining([
      { kind: "review", uri_or_path: "review://verify-code-independent" },
      { kind: "skill_invocation", uri_or_path: "skill://wh-review" },
    ]) });
    expect(publish).toMatchObject({ order: 8, depends_on: [7] });
    const contract = readFileSync(join(root, "wh-review", "contracts", "verify-code.md"), "utf8");
    expect(contract).toMatch(/post-repair[\s\S]*异源架构验收[\s\S]*wh-review/);
    expect(contract).toMatch(/不是第二套证据审计[\s\S]*不重复调用 provider/);
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
      lineage: {
        request_id: "request-1",
        prompt_hash: hash,
        round: "initial",
        prior_attempt_refs: [],
        prior_runtime_ids: {},
        correction_ref: null,
        dispatch_sequence: 0
      },
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
    const matrix = readJson(join(runtimeReviewRoot, "stage-materials.json"));
    const validate = validator("stage-materials.schema.json");
    expect(validate(matrix), validate.errors).toBe(true);
    expect(matrix.stages["build-plan"].required).toEqual(expect.arrayContaining(["draft_tasks"]));
    const missingDraftTasks = structuredClone(matrix);
    missingDraftTasks.stages["build-plan"].required = missingDraftTasks.stages["build-plan"].required.filter((key) => key !== "draft_tasks");
    expect(validate(missingDraftTasks)).toBe(false);
    const optionalDraftTasks = structuredClone(matrix);
    optionalDraftTasks.stages["build-plan"].required = optionalDraftTasks.stages["build-plan"].required.filter((key) => key !== "draft_tasks");
    optionalDraftTasks.stages["build-plan"].optional.push("draft_tasks");
    expect(validate(optionalDraftTasks)).toBe(false);
    const forbiddenDraftTasks = structuredClone(matrix);
    forbiddenDraftTasks.stages["build-plan"].forbidden.push("draft_tasks");
    expect(validate(forbiddenDraftTasks)).toBe(false);
    expect(matrix.stages["build-code"].profiles.phase.source_bundle).toBe("diff");
    expect(matrix.stages["build-code"].profiles.integration.source_bundle).toBe("none");
    expect(matrix.stages["build-code"].profiles.integration.required).toEqual(expect.arrayContaining(["phase_coverage", "seam_index", "ac_trace"]));
    for (const stage of ["build-spec", "build-plan"]) {
      const rule = matrix.stages[stage];
      expect(rule.v2_required_maps).toEqual(["context_map", "evidence_map"]);
      expect(rule.required).toEqual(expect.arrayContaining(rule.v2_required_maps));
      expect(rule.optional).not.toEqual(expect.arrayContaining(rule.v2_required_maps));
    }
    expect(matrix.stages["verify-code"].v2_required_maps).toEqual([]);
    expect(matrix.stages["verify-code"].required).toEqual(expect.arrayContaining(["architect_assessment", "final_test_summary"]));
    expect(matrix.stages["verify-code"].optional).toEqual(expect.arrayContaining(["acceptance_evidence", "context_map", "evidence_map"]));
    expect(matrix.stages["make-decision"].tracks.direction.v2_required_maps).toEqual([]);
    const detail = matrix.stages["make-decision"].tracks.detail;
    expect(detail.v2_required_maps).toEqual(["context_map", "evidence_map"]);
    expect(detail.required).toEqual(expect.arrayContaining(detail.v2_required_maps));
    expect(detail.optional).not.toEqual(expect.arrayContaining(detail.v2_required_maps));
    const phase = matrix.stages["build-code"].profiles.phase;
    expect(phase.required).toEqual(expect.arrayContaining(phase.v2_required_maps));
    expect(phase.optional).not.toEqual(expect.arrayContaining(phase.v2_required_maps));
    const missingIntegrationTrace = structuredClone(matrix);
    missingIntegrationTrace.stages["build-code"].profiles.integration.required = missingIntegrationTrace.stages["build-code"].profiles.integration.required.filter((key) => key !== "ac_trace");
    expect(validate(missingIntegrationTrace)).toBe(false);
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
    expect(plan.stages["build-spec"]).not.toHaveProperty("optional_skills");
    expect(plan.stages["verify-code"]).not.toHaveProperty("optional_skills");
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
