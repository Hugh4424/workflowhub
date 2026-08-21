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
  it("keeps finding disposition free of retired re-review flow identity", async () => {
    const { validateReviewDisposition } = await import("../review-result.mjs");
    expect(validateReviewDisposition({
      finding_id: "finding-1",
      decision: "accept",
      verification: "reproduced",
      root_cause: "confirmed",
      evidence: "quality/evidence/finding-1.json",
    })).toEqual({ valid: true, errors: [] });
    expect(validateReviewDisposition({
      finding_id: "finding-1",
      decision: "accept",
      verification: "reproduced",
      root_cause: "confirmed",
      evidence: "quality/evidence/finding-1.json",
      rereview_flow_id: "retired-flow",
    })).toMatchObject({ valid: false, errors: ["rereview_flow_id is retired"] });
  });

  it("accepts the four canonical finding disposition statuses", async () => {
    const { validateReviewDisposition } = await import("../review-result.mjs");
    const common = { finding_id: "F-1", evidence: "bound fact" };
    expect(validateReviewDisposition({ ...common, status: "fixed", verification: "test", root_cause: "cause" }).valid).toBe(true);
    expect(validateReviewDisposition({ ...common, status: "rejected_invalid" }).valid).toBe(true);
    expect(validateReviewDisposition({ ...common, status: "accepted_risk" }).valid).toBe(true);
    expect(validateReviewDisposition({ finding_id: "F-1", status: "needs_human" }).valid).toBe(true);
  });

  it("publishes the simple production entrypoints and bundles their runtime closure", () => {
    const manifest = readJson(join(root, "wh-review", "manifest.json"));
    expect(manifest.commands).toEqual({
      run: "scripts/wh-review-cli.mjs run",
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
      provider_result_contract: "contracts/workflowhub-result.v3.json"
    });
    const providerProtocol = readFileSync(join(root, "wh-review", "contracts", "provider-protocol.md"), "utf8");
    expect(providerProtocol).toContain('"findings": []');
    expect(providerProtocol).toMatch(/不得输出 `verdict`、`summary`/);
    expect(providerProtocol).toMatch(/`major`[^\n]*`blocking`/);
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
      "scripts/review-output.mjs",
      "scripts/review-provider-client.mjs",
      "scripts/review-result.mjs",
      "scripts/review-runner.mjs",
      "scripts/review-source.mjs",
      "scripts/wh-review-cli.mjs",
      "stage-skill-plan.json"
    ]) expect(bundlePaths).toContain(file);
  });

  it("schema-enforces mini-task implementation evidence fields", () => {
    const schema = readJson(join(schemaRoot, "stage-materials.schema.json"));
    const matrix = readJson(join(runtimeReviewRoot, "stage-materials.json"));
    const validate = new Ajv2020({ strict: false }).compile(schema);
    expect(validate(matrix)).toBe(true);
    const missingUserResult = structuredClone(matrix);
    missingUserResult.mini_task.implementation.required = missingUserResult.mini_task.implementation.required.filter((key) => key !== "user_result");
    expect(validate(missingUserResult)).toBe(false);
  });

  it("documents the complete public review input instead of forcing callers to guess", () => {
    const skill = readFileSync(join(root, "wh-review", "SKILL.md"), "utf8");
    for (const field of ["task_path", "project_name", "task_id", "stage", "host_provider", "materials"]) {
      expect(skill, field).toContain(`\"${field}\"`);
    }
    expect(skill).toContain("runtime/review/stage-materials.json");
    expect(skill).toMatch(/strict material allowlist/i);
    expect(skill).toMatch(/`context_map` and `evidence_map` are optional/);
    expect(skill).toMatch(/3rd-review config/i);
    expect(skill).toMatch(/Callers cannot select provider, model/);
    expect(skill).toMatch(/Send transient input through stdin/);
    for (const name of ["target repository", "CandidateWorkspace", "TaskHandle"]) expect(skill).toContain(name);
  });

  it("requires one explicit package root without checkout or path guessing", () => {
    const protocol = readFileSync(join(root, "workflowhub-host-protocol", "SKILL.md"), "utf8");
    expect(protocol).toMatch(/项目登记资源或宿主明确注入的绝对路径/);
    expect(protocol).toMatch(/不扫描目录、不猜路径、不从旧记录回退/);
    expect(protocol).not.toMatch(/multica repo checkout/);
    expect(protocol).not.toMatch(/WORKFLOWHUB_HOST_BRIDGE|invoke-stage-skill/);
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
        expect(dependency, `${stage}: ${dependency.name}`).not.toHaveProperty("invocation");
        expect(dependency, `${stage}: ${dependency.name}`).not.toHaveProperty("dispatch");
      }
    }

    const stageDependencies = (stage) => yaml.load(
      readFileSync(join(projectRoot, "workflows", stage, "skill-deps.yaml"), "utf8")
    ).skills;
    expect(stageDependencies("build-spec").find(({ name }) => name === "spec-clarify"))
      .toMatchObject({ execution: "inline", trigger: "spec_ambiguity", owner: "stage" });
    expect(stageDependencies("build-spec").find(({ name }) => name === "spec-research"))
      .toMatchObject({ execution: "independent", trigger: "conditional_research", owner: "stage" });
    expect(stageDependencies("build-plan").find(({ name }) => name === "spec-analyze"))
      .toMatchObject({ execution: "inline", trigger: "stage_end_consistency" });
    expect(stageDependencies("build-code").find(({ name }) => name === "review")).toBeUndefined();
    expect(stageDependencies("build-code").map(({ name }) => name)).not.toContain("test-strategy");
    expect(stageDependencies("verify-code").filter(({ name }) => ["test-strategy", "isolated-browser-qa"].includes(name)))
      .toEqual([]);
  });

  it("runs verify-code as a non-gate current-code review fact", () => {
    const plan = readJson(join(root, "wh-review", "stage-skill-plan.json"));
    expect(plan.stages["build-code"].required_skills).not.toHaveLength(0);
    expect(plan.stages["verify-code"].invocation).toBe("post-first-repair-non-gate");
    expect(plan.stages["verify-code"].required_skills).toEqual(["review"]);
    for (const stage of ["build-code", "verify-code"])
      for (const skill of plan.stages[stage].required_skills) expect(existsSync(join(root, skill, "SKILL.md")), `${stage}: ${skill}`).toBe(true);
    const deps = yaml.load(readFileSync(join(projectRoot, "workflows", "verify-code", "skill-deps.yaml"), "utf8"));
    expect(deps.skills.find(({ name }) => name === "dsh-code-review"))
      .toMatchObject({ execution: "inline", trigger: "code_review" });
    expect(deps.skills.find(({ name }) => name === "wh-review"))
      .toMatchObject({ execution: "inline", trigger: "post_first_repair" });
    const steps = readJson(join(projectRoot, "workflows", "verify-code", "steps.json")).steps;
    const qualityReview = steps.find(({ step_slug }) => step_slug === "run-one-independent-code-review");
    const publish = steps.find(({ step_slug }) => step_slug === "publish-code-review-fact");
    expect(qualityReview).toMatchObject({ order: 5, depends_on: [4], completion_evidence: expect.arrayContaining([
      { kind: "review", uri_or_path: "quality/reviews/results/" },
    ]) });
    expect(qualityReview.completion_evidence).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "skill_invocation" }),
    ]));
    expect(publish).toMatchObject({ order: 8, depends_on: [7] });
    const contract = readFileSync(join(root, "wh-review", "contracts", "verify-code.md"), "utf8");
    expect(contract).toMatch(/异源.*代码.*审查[\s\S]*wh-review/);
    expect(contract).toMatch(/不是材料审计[\s\S]*不重复调用 provider/);
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
    expect(matrix.stages["build-code"].profiles.integration.required).toEqual(expect.arrayContaining(["approved_spec", "acceptance_criteria", "test_evidence", "ac_trace", "review_instructions"]));
    expect(matrix.stages["build-code"].profiles.integration.required).not.toEqual(expect.arrayContaining(["phase_coverage", "seam_index", "phase_map_trace"]));
    expect(matrix.stages["build-code"].profiles.integration.optional).toEqual([]);
    for (const stage of ["build-spec", "build-plan"]) {
      const rule = matrix.stages[stage];
      expect(rule.v2_required_maps).toEqual([]);
      expect(rule.required).not.toEqual(expect.arrayContaining(["context_map", "evidence_map"]));
      expect(rule.optional).toEqual(expect.arrayContaining(["context_map", "evidence_map"]));
    }
    expect(matrix.stages["verify-code"].v2_required_maps).toEqual([]);
    expect(matrix.stages["verify-code"].required).toEqual(expect.arrayContaining(["changed_files", "implementation_assessment", "test_context", "open_risks", "review_instructions"]));
    expect(matrix.stages["verify-code"].optional).toEqual(expect.arrayContaining(["approved_spec", "architect_assessment", "context_map"]));
    expect(matrix.stages["verify-code"].forbidden).toEqual(expect.arrayContaining(["acceptance_criteria", "acceptance_evidence", "evidence_map", "final_test_summary", "quality_verify", "requirement_replay"]));
    expect(matrix.stages["make-decision"].tracks.direction.v2_required_maps).toEqual([]);
    const detail = matrix.stages["make-decision"].tracks.detail;
    expect(detail.v2_required_maps).toEqual([]);
    expect(detail.required).not.toEqual(expect.arrayContaining(["context_map", "evidence_map"]));
    expect(detail.optional).toEqual(expect.arrayContaining(["context_map", "evidence_map"]));
    const phase = matrix.stages["build-code"].profiles.phase;
    expect(phase.v2_required_maps).toEqual([]);
    expect(phase.required).not.toEqual(expect.arrayContaining(["phase_map", "impact_map", "reuse_map", "acceptance_map"]));
    expect(phase.optional).toEqual(expect.arrayContaining(["phase_map", "impact_map", "reuse_map", "acceptance_map"]));
    const missingIntegrationTests = structuredClone(matrix);
    missingIntegrationTests.stages["build-code"].profiles.integration.required = missingIntegrationTests.stages["build-code"].profiles.integration.required.filter((key) => key !== "test_evidence");
    expect(validate(missingIntegrationTests)).toBe(false);
    const direction = matrix.stages["make-decision"].tracks.direction;
    expect(direction.required).toEqual(expect.arrayContaining(["raw_requirement", "objective_facts"]));
    expect(direction.forbidden).toEqual(expect.arrayContaining(["proposed_solution", "decision_log", "spec", "plan", "changes_diff"]));
    const plan = readJson(join(root, "wh-review", "stage-skill-plan.json"));
    expect(plan.stages["make-decision"].tracks.direction.required_skills)
      .toEqual(expect.arrayContaining(["intake-decision-review"]));
  });

  it("keeps mini-task review kinds outside the five formal stages", () => {
    const matrix = readJson(join(runtimeReviewRoot, "stage-materials.json"));
    const validate = validator("stage-materials.schema.json");
    expect(matrix.mini_task.design.required).toEqual(expect.arrayContaining(["decision_log", "spec", "plan", "tasks", "review_instructions"]));
    expect(matrix.mini_task.implementation.required).toEqual(expect.arrayContaining(["decision_log", "spec", "plan", "tasks", "test_evidence", "ac_trace", "user_result", "review_instructions"]));
    expect(validate(matrix), validate.errors).toBe(true);
    expect(matrix.stages).not.toHaveProperty("mini-task");
    const plan = readJson(join(root, "wh-review", "stage-skill-plan.json"));
    expect(plan.mini_task.design.review_kind).toBe("mini_task.design");
    expect(plan.mini_task.implementation.review_kind).toBe("mini_task.implementation");
    expect(plan.stages).not.toHaveProperty("mini-task");
    expect(readFileSync(join(root, "wh-review", "contracts", "mini-task-design.md"), "utf8")).toMatch(/方案审查/);
    expect(readFileSync(join(root, "wh-review", "contracts", "mini-task-implementation.md"), "utf8")).toMatch(/实施审查/);
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
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code"]) {
      const contract = readFileSync(join(root, "wh-review", "contracts", `${stage}.md`), "utf8");
      expect(contract, stage).toMatch(/provider.*冻结材料/);
      expect(contract, stage).toMatch(/必需材料|共同材料/);
      expect(contract, stage).toMatch(/审查重点/);
      expect(contract, stage).toMatch(/只包含 `findings`|只包含.*findings/s);
    }
    const verifyContract = readFileSync(join(root, "wh-review", "contracts", "verify-code.md"), "utf8");
    expect(verifyContract).toMatch(/不是材料审计、AC 覆盖审计或证据 pass 门/);
    expect(verifyContract).toMatch(/不重复调用 provider/);
    expect(verifyContract).toMatch(/只包含 `findings`/);
    const plan = readJson(join(root, "wh-review", "stage-skill-plan.json"));
    expect(plan.stages["build-spec"]).not.toHaveProperty("optional_skills");
    expect(plan.stages["verify-code"]).not.toHaveProperty("optional_skills");
  });

  it("makes direction request count explicit without turning it into a retry loop", () => {
    const contract = readFileSync(join(root, "wh-review", "contracts", "make-decision.md"), "utf8");
    expect(contract).toMatch(/`single_round` 表示一个逻辑 review fact 完成后/);
    expect(contract).toMatch(/direction 也只发一个 broker group request/);
    expect(contract).toMatch(/reconstruct\/reveal\/challenge 顺序和 reveal boundary/);
    expect(contract).toMatch(/detail 也只发[\s\S]*一个短请求/);
    expect(contract).toMatch(/不再为了追求空 findings[\s\S]*自动发起后续复审/);
  });

  it("reports scope expansion as findings without rejecting necessary protections", () => {
    const lens = readFileSync(join(root, "simplicity-guard", "SKILL.md"), "utf8");
    for (const expansion of [
      "scope creep",
      "重复已有能力",
      "投机性抽象",
      "兼容层",
      "死代码",
      "隐藏失败兜底"
    ]) expect(lens).toContain(expansion);
    expect(lens).toMatch(/同一 findings 输出中\s*报告具体问题/);
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
