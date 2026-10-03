import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import yaml from "js-yaml";
import { afterEach, describe, expect, it } from "vitest";
import { ReviewProviderClient } from "../review-provider-client.mjs";
import { createSimpleReviewPacket, rehydrateProviderInput, runSimpleReview, serializeProviderInput, validateProviderResultsAgainstSelection } from "../simple-review-runner.mjs";

const root = join(import.meta.dirname, "..", "..", "..");
const projectRoot = join(root, "..");
const runtimeReviewRoot = join(projectRoot, "runtime", "review");
const schemaRoot = join(runtimeReviewRoot, "schemas");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const hash = "a".repeat(64);
const oid = "b".repeat(40);
const temporaryRoots = [];

function sha256(value) { return createHash("sha256").update(value, "utf8").digest("hex"); }

afterEach(() => { while (temporaryRoots.length) rmSync(temporaryRoots.pop(), { recursive: true, force: true }); });

function selectionFor(providers, models = {}) {
  return {
    providers: [...providers],
    eligible_profiles: [...providers],
    provider_identities: Object.fromEntries(providers.map((provider, index) => [
      provider, { source_id: `source-${index + 1}`, config_id: `config-${index + 1}` },
    ])),
    provider_models: Object.fromEntries(providers.map((provider) => [provider, models[provider] ?? `${provider}-model`])),
  };
}

function providerMember(selection, provider, output, overrides = {}) {
  return {
    provider,
    status: "completed",
    identity: {
      provider,
      adapter: provider.split("/", 1)[0],
      ...selection.provider_identities[provider],
      model: selection.provider_models[provider],
    },
    output,
    error: null,
    timing: null,
    usage: null,
    ...overrides,
  };
}

function reviewGroup(selection, output, { provider = selection.providers[0], ...overrides } = {}) {
  return {
    runtimeId: "runtime-p4",
    outcome: "completed",
    round: 1,
    selectedTier: null,
    providers: [providerMember(selection, provider, output)],
    ...overrides,
  };
}

function runnerDependencies({ selection, minimum = 1, bundleRoot = root, deliveryManifest = [], group, calls = [] } = {}) {
  return {
    loadConfig: () => ({ whReview: {}, attachmentRoot: bundleRoot, config: "/unused/config.json", command: ["unused"] }),
    resolveRoute: () => ({ initial: [...selection.providers], mode: "single_round", minimum_heterologous: minimum }),
    selectProviders: () => selection,
    buildBundle: () => ({ bundleRoot, materialId: hash, deliveryManifest, dispose() {} }),
    client: { async runGroup() { calls.push("run"); return group ?? reviewGroup(selection, JSON.stringify({ findings: [] })); } },
  };
}

function validator(name) {
  const ajv = new Ajv2020({ strict: false });
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

  it("publishes registered entrypoints and genuine runtime contract assets",()=>{
 const manifest=readJson(join(root,"wh-review","manifest.json"));expect(manifest.commands).toEqual({run:"scripts/wh-review-cli.mjs run","verify-final":"scripts/wh-review-cli.mjs verify-final",doctor:"scripts/wh-review-cli.mjs doctor"});expect(manifest.runtime_review.schemas).toEqual({result:"runtime/review/schemas/result.schema.json",stage_materials:"runtime/review/schemas/stage-materials.schema.json"});
 const protocol=readFileSync(join(root,"wh-review/contracts/provider-protocol.md"),"utf8");expect(protocol).toContain('"findings": []');expect(protocol).toContain("除 findings 外不要 verdict、summary、pass/fail");expect(protocol).toContain("severity 只用 blocking、major、minor");expect(protocol).toContain("阶段合同、provider 协议、审查重点、声明的 lens 技能");expect(protocol).toContain("provider 不可用≠空 findings≠pass");
 const bundle=readJson(join(root,"wh-review/skill-bundle.json"));for(const path of ["scripts/review-materials.mjs","scripts/review-provider-client.mjs","scripts/simple-review-runner.mjs","contracts/provider-protocol.md","stage-skill-plan.json"])expect(bundle.files).toContain(path);
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


  it("sends the fixed dsh broker host and ignores a caller host on managed dispatch", async () => {
    const calls = [];
    const client = new ReviewProviderClient({
      invoke: async (value) => {
        calls.push(value);
        return {
          exitCode: 0,
          stdout: `${JSON.stringify({
            version: "workflowhub-run.v1",
            request_id: "request-p4",
            runtime_id: "runtime-p4",
            state: "running",
            material_id: hash,
          })}\n`,
          stderr: "",
        };
      },
    });

    await client.startManaged({
      requestId: "request-p4",
      // A historical caller field: never forwarded, so a private path cannot leak.
      hostProvider: "file://private/host",
      providers: ["other/model"],
      materials: { bundleRoot: "bundle", materialId: hash, deliveryManifest: [] },
      prompt: "review",
      minimumHeterologous: 1,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].request.host_provider).toBe("dsh");
    expect(JSON.stringify(calls[0])).not.toContain("private/host");
  });

  it("keeps caller material keys and runner-owned instructions fail-closed", async () => {
    expect(() => createSimpleReviewPacket({
      stage: "build-code",
      materials: { review_instructions: "caller-authored instructions" },
    })).toThrow(/MATERIAL_FORBIDDEN/);

    const selection = selectionFor(["other/model"]);
    const calls = [];
    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      preflight: true,
      materials: { unknown_material: "not in the stage allowlist" },
    }, runnerDependencies({ selection, calls }));
    expect(result).toMatchObject({
      status: "unavailable",
      dispatch_state: "blocked_before_dispatch",
      provider_attempts: 0,
      error: { code: "MATERIAL_FORBIDDEN" },
    });
    expect(calls).toEqual([]);
  });

  it("seals post build-plan Phase files separately through the public packet", () => {
    const attachmentRoot = mkdtempSync(join(tmpdir(), "workflowhub-post-phase-review-"));
    temporaryRoots.push(attachmentRoot);
    const materials = {
      raw_requirement: "R-001 original result",
      draft_spec: "# Spec\nFR-DEMO-001 and AC-DEMO-001",
      acceptance_criteria: "AC-DEMO-001",
      phase_index: "## Execution Index\n\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| P1 | phases/P1.md | phase-p1 | src/demo.mjs | none | build-code |\n",
      phase_authorities: { "phases/P1.md": "# Phase P1 — behavior\n\n## L0\nOutcome\n## L1\nContract\n## L2\nReference\n" },
    };
    const packet = createSimpleReviewPacket({ stage: "build-plan", activation_cohort: "post", materials });
    expect(packet.activation_cohort).toBe("post");
    const restored = rehydrateProviderInput(serializeProviderInput({
      packet, hostProvider: "codex", providers: ["other/model"], reviewMode: "single_round",
    }), attachmentRoot);
    try {
      expect(typeof restored.materials.materialId).toBe("string");
      expect(restored.materials.materialId).toBeTruthy();
      expect(restored.materials.deliveryManifest.map(({ path }) => path)).toContain("requirements/phases/P1.md");
      expect(restored.materials.deliveryManifest.map(({ path }) => path)).not.toContain("materials/05-phase_authorities.json");
      expect(readFileSync(join(restored.materials.bundleRoot, "requirements/phases/P1.md"), "utf8"))
        .toBe(materials.phase_authorities["phases/P1.md"]);
    } finally { restored.materials.dispose(); }
    expect(() => createSimpleReviewPacket({
      stage: "build-plan", activation_cohort: "post",
      materials: { ...materials, phase_authorities: {} },
    })).toThrow(/MATERIAL_INCOMPLETE.*Phase/i);
  });

  it("blocks post build-plan review before provider dispatch when a Phase is missing", async () => {
    const selection = selectionFor(["other/model"]);
    const calls = [];
    const result = await runSimpleReview({
      stage: "build-plan", activation_cohort: "post", host_provider: "codex", preflight: true,
      materials: {
        raw_requirement: "R-001", draft_spec: "# Spec", acceptance_criteria: "AC-001",
        phase_index: "## Execution Index\n\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| P1 | phases/P1.md | phase-p1 | src/demo.mjs | none | build-code |\n",
        phase_authorities: {},
      },
    }, runnerDependencies({ selection, calls }));
    expect(result).toMatchObject({ status: "unavailable", dispatch_state: "blocked_before_dispatch", provider_attempts: 0, error: { code: "MATERIAL_INCOMPLETE" } });
    expect(calls).toEqual([]);
  });

  it("dispatches the public post build-plan packet with real Phase paths", async () => {
    const attachmentRoot = mkdtempSync(join(tmpdir(), "workflowhub-post-phase-dispatch-"));
    temporaryRoots.push(attachmentRoot);
    const selection = selectionFor(["other/model"]);
    const dependencies = runnerDependencies({ selection, bundleRoot: attachmentRoot });
    delete dependencies.buildBundle;
    let delivered = [];
    dependencies.client = { async runGroup(request) {
      delivered = request.materials.deliveryManifest.map(({ path }) => path);
      return reviewGroup(selection, JSON.stringify({ findings: [] }));
    } };
    const result = await runSimpleReview({
      stage: "build-plan", activation_cohort: "post", host_provider: "codex",
      materials: {
        raw_requirement: "R-001", draft_spec: "# Spec", acceptance_criteria: "AC-001",
        phase_index: "## Execution Index\n\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| P1 | phases/P1.md | phase-p1 | src/demo.mjs | none | build-code |\n",
        phase_authorities: { "phases/P1.md": "# Phase P1 — behavior\n## L0\nOutcome\n## L1\nContract\n## L2\nReference\n" },
      },
    }, dependencies);
    expect(delivered).toContain("requirements/phases/P1.md");
    expect(delivered).not.toEqual(expect.arrayContaining([expect.stringMatching(/phase_authorities\.json$/)]));
    expect(result.status).toBe("available");
    expect(result.material_id).toMatch(/^[0-9a-f]{64}$/);
  });

  it("dispatches the remaining provider after preflight removes one, without a heterologous headcount gate", async () => {
    const blockedProvider = "antigravity/flash";
    const healthyProvider = "kimi/coding";
    const selection = selectionFor([blockedProvider, healthyProvider], {
      [blockedProvider]: "agy-model",
      [healthyProvider]: "kimi-model",
    });
    const calls = [];
    const dependencies = runnerDependencies({
      selection,
      minimum: 2,
      calls,
      group: reviewGroup(selection, JSON.stringify({ findings: [] }), { provider: healthyProvider }),
    });
    dependencies.providerPreflight = ({ provider }) => provider === blockedProvider
      ? {
          provider,
          status: "blocked",
          error: {
            code: "ACTIVE_PROBE_FAILED",
            message: "provider health probe failed",
            diagnostic: {
              field: "active_probe",
              expected: "provider responds to the lightweight probe",
              actual: "probe exited non-zero",
              next_action: "repair provider availability and retry",
            },
          },
        }
      : { provider, status: "ready" };
    const result = await runSimpleReview({
      stage: "build-code",
      preflight: true,
      materials: {
        approved_spec: "approved spec",
        acceptance_criteria: "acceptance criteria",
        test_evidence: "test evidence",
      },
    }, dependencies);
    expect(result).toMatchObject({
      status: "available",
      dispatch_state: "dispatched",
      minimum_heterologous: 1,
    });
    expect(result.error?.code).not.toBe("REVIEW_THRESHOLD_INVALID");
    expect(calls).toEqual(["run"]);
  });

  it("keeps provider results bound to the selected provider identity", () => {
    const selection = selectionFor(["other/model"]);
    const output = JSON.stringify({ findings: [] });
    const valid = providerMember(selection, "other/model", output);

    expect(() => validateProviderResultsAgainstSelection([{
      ...valid,
      identity: { ...valid.identity, source_id: "untrusted-source" },
    }], selection)).toThrow(/trusted selection/);
    expect(() => validateProviderResultsAgainstSelection([{
      ...valid,
      provider: "other/unselected",
      identity: { ...valid.identity, provider: "other/unselected" },
    }], selection)).toThrow(/uniquely bound/);
  });

  it("drops findings that do not anchor to submitted material and records the discard", async () => {
    const bundleRoot = mkdtempSync(join(tmpdir(), "workflowhub-p4-anchor-red-"));
    temporaryRoots.push(bundleRoot);
    const submitted = "submitted line";
    mkdirSync(join(bundleRoot, "materials"), { recursive: true });
    writeFileSync(join(bundleRoot, "materials", "submitted.md"), submitted);
    writeFileSync(join(bundleRoot, "materials", "unsubmitted.md"), "host-only line");
    const selection = selectionFor(["other/model"]);
    const manifest = [{
      path: "materials/submitted.md",
      bytes: Buffer.byteLength(submitted),
      sha256: sha256(submitted),
    }];

    for (const finding of [
      {
        severity: "major", path: "materials/unsubmitted.md", line: 1,
        issue: "provider selected an unsubmitted file", recommendation: "use submitted material",
        root_cause: "anchor lookup escaped the manifest", evidence_kind: "direct", evidence: "manifest omits the file",
      },
      {
        severity: "major", path: "materials/submitted.md", line: 2,
        issue: "provider selected a nonexistent line", recommendation: "use a real line",
        root_cause: "line boundary was not checked", evidence_kind: "direct", evidence: "the file has one line",
      },
    ]) {
      const result = await runSimpleReview({
        stage: "build-code",
        host_provider: "codex",
        materials: { unknown_material: "anchor fixture" },
      }, runnerDependencies({
        selection,
        bundleRoot,
        deliveryManifest: manifest,
        group: reviewGroup(selection, JSON.stringify({ findings: [finding] })),
      }));
      expect(result).toMatchObject({
        status: "available",
        findings: [],
        provider_results: [{ status: "completed", error: null }],
        discarded_facts: [{ fact_kind: "unanchored_finding_dropped", reason: "evidence_anchor_invalid" }],
      });
    }
  });

  it("keeps broker material identity bound to the submitted bundle", async () => {
    const selection = selectionFor(["other/model"]);
    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex",
      materials: { unknown_material: "material identity fixture" },
    }, runnerDependencies({
      selection,
      group: reviewGroup(selection, JSON.stringify({ findings: [] }), { material_id: "f".repeat(64) }),
    }));
    expect(result).toMatchObject({
      status: "unavailable",
      error: { code: "REVIEW_MATERIAL_IDENTITY_MISMATCH" },
    });
  });

  it("keeps non-terminal groups and incomplete health members fail-closed", async () => {
    const context = {
      requestId: "request-p4",
      runtimeId: "runtime-p4",
      hostProvider: "codex",
      providers: ["other/model"],
      materials: { materialId: hash },
    };
    const base = {
      version: "workflowhub-run.v1",
      request_id: "request-p4",
      runtime_id: "runtime-p4",
      state: "running",
      material_id: hash,
    };
    for (const envelope of [
      { ...base, group: {} },
      { ...base, providers: { "other/model": { status: "failed", error: { code: "PROCESS_TIMEOUT" } } } },
    ]) {
      const client = new ReviewProviderClient({
        invoke: async () => ({ exitCode: 0, stdout: `${JSON.stringify(envelope)}\n`, stderr: "" }),
      });
      await expect(client.statusManaged(context)).rejects.toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
    }
  });

  it("documents actual input, raw provenance and unavailable boundaries",()=>{const skill=readFileSync(join(root,"wh-review/SKILL.md"),"utf8");for(const phrase of ["stage/track","完整材料","MATERIAL_INCOMPLETE","原始 provider 身份","unavailable","空 findings","不是用户同意或交付完成"])expect(skill).toContain(phrase);expect(skill).toContain("provider 只读本次提交材料");});

  it("keeps the direct host methods and path tools independent of retired bridges",()=>{const protocol=readFileSync(join(root,"workflowhub-host-protocol/SKILL.md"),"utf8");expect(protocol).toContain("先核实际task worktree、当前材料和目标范围");expect(protocol).toContain("工作区/写边界①");expect(protocol).toContain("不建立快照/hash/receipt推进许可证");expect(protocol).toContain("外部Stage Agent/session/bridge前置");expect(protocol).not.toContain("multica repo checkout");});

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

    expect(plan.stages).not.toHaveProperty("build-spec");
    for(const stage of ["build-plan","build-code","verify-code"])expect(plan.stages[stage].required_skills.length).toBeGreaterThan(0);

  });

  it("uses the current OCR contract and only missing-install fallback",()=>{const plan=readJson(join(root,"wh-review/stage-skill-plan.json"));expect(plan.stages["verify-code"].required_skills).toEqual(["review"]);for(const stage of ["build-code","verify-code"])for(const skill of plan.stages[stage].required_skills)expect(existsSync(join(root,skill,"SKILL.md"))).toBe(true);const skill=readFileSync(join(root,"wh-review/SKILL.md"),"utf8");expect(skill).toContain("ENOENT");expect(skill).toContain("版本低于1.12.9");expect(skill).toContain("已安装的执行失败、超时、取消或输出无效保留 unavailable");});

  it("validates the real stage matrix and protects blind direction fields",()=>{const matrix=readJson(join(runtimeReviewRoot,"stage-materials.json"));const validate=validator("stage-materials.schema.json");expect(validate(matrix),JSON.stringify(validate.errors)).toBe(true);const direction=matrix.stages["make-decision"].tracks.direction;expect(direction.required).toEqual(expect.arrayContaining(["raw_requirement","objective_facts","convergence_outline"]));expect(direction.forbidden).toEqual(expect.arrayContaining(["proposed_solution","decision_log","spec","plan","changes_diff"]));expect(matrix.stages["build-code"].profiles).not.toHaveProperty("integration");expect(matrix.stages["build-plan"].profiles.post.required).toEqual(expect.arrayContaining(["draft_spec","phase_authorities","phase_index"]));expect(matrix.stages["verify-code"].required).toEqual(expect.arrayContaining(["changed_files","implementation_assessment","test_context","open_risks"]));});

  it("keeps mini-task review kinds outside the five formal stages", () => {
    const matrix = readJson(join(runtimeReviewRoot, "stage-materials.json"));
    const validate = validator("stage-materials.schema.json");
    expect(matrix.mini_task.design.required).toEqual(expect.arrayContaining(["raw_requirement", "decision_log", "spec", "review_instructions"]));
    expect(matrix.mini_task.implementation.required).toEqual(expect.arrayContaining(["raw_requirement", "decision_log", "spec", "test_evidence", "ac_trace", "user_result", "coverage_limits", "skip_reasons", "remaining_risks", "review_instructions"]));
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

  it("keeps actual stage contracts packet-only and findings advisory",()=>{for(const stage of ["make-decision","build-plan","build-code","verify-code"]){const contract=readFileSync(join(root,"wh-review/contracts",stage+".md"),"utf8");expect(contract).toContain("findings");expect(contract).toMatch(/bundle|packet|包内/);expect(contract).toMatch(/unavailable|不可用/);expect(contract).toMatch(/不.*(?:完成|通过)|不是.*门/);expect(contract).toContain("宿主");}const plan=readJson(join(root,"wh-review/stage-skill-plan.json"));expect(plan.stages).not.toHaveProperty("build-spec");});

  it("requires physical blind visibility and one request per role",()=>{const contract=readFileSync(join(root,"wh-review/contracts/make-decision.md"),"utf8");for(const phrase of ["每个 role 一次公共 wh-review 请求","不循环取得空 findings","reconstruct","reveal","challenge","重建包不交付已定材料","有效重建才创建揭示包"])expect(contract).toContain(phrase);});

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
    expect(lens).toMatch(/同一 provider findings 中输出具体/);
    for (const protection of ["测试", "输入校验", "错误处理", "安全", "可访问性"])
      expect(lens).toMatch(new RegExp(`不得删除[\\s\\S]*${protection}|${protection}[\\s\\S]*不得因追求少代码而删掉`));
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
