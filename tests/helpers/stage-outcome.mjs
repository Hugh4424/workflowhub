import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";

import { captureGitWorktreeSnapshot, materialRevisionFromValues } from "../../runtime/task/git-worktree-snapshot.mjs";
import { STAGE_SPEC_ANALYZE_PROFILES, validateStageSpecAnalyzeProfile } from "../../runtime/stage/stage-content-contracts.mjs";
import { createRegisteredCodexSource, parseRegisteredRequirementTranscript } from "../../runtime/evidence/codex-transcript-adapter.mjs";
import { createTranscriptSourceReader } from "../../runtime/evidence/fact-collector.mjs";

const MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const REQUIREMENT_CLASSES = [
  "goal",
  "flow_or_surface",
  "data_or_state",
  "success_failure_acceptance",
  "constraint_non_goal_defer",
];

export function createRequirementAuthenticationFixture({ taskId, runId = "fixture-run", sessionId = "fixture-requirement-session", stage = "make-decision" } = {}) {
  const messages = REQUIREMENT_CLASSES.map((message_class, index) => {
    const id = `message-${index + 1}`;
    const content = id;
    return {
      id,
      type: "requirement_message",
      source_version: "v1",
      task_id: taskId,
      session_id: sessionId,
      stage,
      order: index + 1,
      message_class,
      content,
      content_hash: sha256(content),
    };
  });
  const source = createRegisteredCodexSource({
    source_id: "fixture-requirements",
    source_ref: "fixture-requirements-source",
    registration_id: "fixture-requirements-registration",
    required: true,
    task_id: taskId,
    run_id: runId,
    session_id: sessionId,
    source_format: "jsonl",
    source_version: "v1",
    cli_version: "fixture",
    adapter_version: "fixture",
    capabilities: ["requirement_message"],
    reader: createTranscriptSourceReader(() => messages.map((entry) => JSON.stringify(entry)).join("\n")),
  });
  return parseRegisteredRequirementTranscript(source, { stage });
}

export function canonicalStageMaterials() {
  return Object.freeze({
    "decision-log.md": `# Decision log\n\n## 原始需求\n| 需求 | 维度 | 决定 | 状态 |\n| --- | --- | --- | --- |\n| R-FIXTURE-1 原始目标 | goal | D-FIXTURE-1 | covered |\n| R-FIXTURE-2 使用流程 | flow_or_surface | D-FIXTURE-2 | covered |\n| R-FIXTURE-3 数据状态 | data_or_state | D-FIXTURE-3 | covered |\n| R-FIXTURE-4 验收边界 | success_failure_acceptance | D-FIXTURE-4 | covered |\n| R-FIXTURE-5 范围边界 | constraint_non_goal_defer | D-FIXTURE-5 | covered |\n\n## 核心需求\n完成当前五阶段运行时夹具。\n\n## 核心目标\n当前阶段目标已确认并可执行。\n\n## 验收标准\n阶段结果可验证通过或失败。\n\n## 已选方向\nD-FIXTURE-1：保持当前范围并完成当前夹具。\n\n## 范围\n只覆盖当前夹具。\n\n## 非目标\n不扩大公开运行时范围。\n\n## 风险与延期交接\n当前夹具风险已记录。\n`,
    "spec.md": `# Fixture specification\n\n## 速读卡\n- 当前夹具验证四材料与阶段末分析。\n\n## 1. 问题与紧迫性\n- 需要一个可验证的当前需求。\n\n## 2. 背景、目标与范围\n- 目标是保持当前任务可继续。\n\n## 3. 用户场景与状态覆盖\n### SCN-001：正常执行\n- 用户读取当前结果。\n\n## 4. 产品事实与假设（PFACT）\n- **PFACT-FIX**：verified\n\n## 5. 功能需求\n- **FR-FIX-001**：当前功能要求。\n\n## 6. 条件式业务合同\n- 当前材料必须可读。\n\n## 7. 明确不做与默认必须成立\n### 明确不做\n- 不创建额外状态机。\n### 默认必须成立\n- 当前任务身份保持一致。\n\n## 8. 业务影响与回归范围\n- 只覆盖当前夹具。\n\n## 9. 验收标准\n- [ ] **AC-001**：当前功能结果可验证。\n  场景：执行当前夹具并读取结果。\n  验证：结果状态为通过。\n  失败：结果缺失或状态不正确。\n\n## 10. 风险、未决与交接\n- spec-clarify trigger=false reason=夹具没有方向性歧义 open_direction_changing_questions=0。\n\n### 来源与决策映射\n- R-001 -> D-001 -> FR-FIX-001 -> AC-001\n`,
    "plan.md": `# Fixture plan\n\n## Technical Context\n当前夹具只验证现有材料。\n\n## Global Constraints\n只使用当前 task 和现有消费者。\n\n## Modules, Interfaces, and Data Contracts\n复用现有四材料与质量事实接口。\n\n## Implementation Order\n先准备材料，再执行测试。\n\n## Test Strategy\n使用确定性夹具命令验证结果。\n\n## Rollback and Recovery\n失败时保留事实并在当前任务重跑。\n\n## FR to AC to Step Traceability\nFR-FIX-001 -> AC-001 -> T001/T002。\n\n## Constitution Check\nF1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 Q1 Q2 Q3 S1 S2 S3 S4 S5 S6 S7 S8\n\n## Complexity Trade-offs\n复用现有入口，不新增控制面。\n\n## Phase 1: fixture\n### Goal\n验证当前功能。\n### Files\n- **MODIFY**: \`src/app.txt\`\n### Tasks\n- T001 RED 后由 T002 GREEN 完成。\n### Verify\n- 运行确定性命令。\n### Knowledge\n- 保留当前证据。\n### STOP\n- 结果不满足验收时停止声明完成。\n`,
    "tasks.md": `# Fixture tasks\n\n## Phase 1: fixture\n### Goal\n验证当前功能。\n### Files\n- **MODIFY**: \`src/app.txt\`\n### Tasks\n- T001 RED；T002 GREEN。\n### Verify\n- 确认命令结果。\n### Knowledge\n- 保留当前证据。\n### STOP\n- 不把未知写成通过。\n\n### T001 RED - define current fixture behavior\n- **ID**：T001\n- **动作**：先让确定性验证明确失败。\n- **精确文件**：\`src/app.txt\`\n- **输入**：当前四份材料。\n- **输出**：RED 验证事实。\n- **依赖**：none\n- **并行**：否\n- **FR**：FR-FIX-001\n- **AC**：AC-001\n- **gate_cmd**：\`node --test\`\n- **expected_exit**：1\n- **oracle**：ORACLE-FIXTURE\n- **evidence_path**：quality/tests/T001.json\n\n### T002 GREEN - verify current fixture\n- **ID**：T002\n- **动作**：执行确定性验证并确认通过。\n- **精确文件**：\`src/app.txt\`\n- **输入**：T001 RED 与当前四份材料。\n- **输出**：GREEN 验证事实。\n- **依赖**：T001\n- **并行**：否\n- **FR**：FR-FIX-001\n- **AC**：AC-001\n- **gate_cmd**：\`node --test\`\n- **expected_exit**：0\n- **oracle**：ORACLE-FIXTURE\n- **evidence_path**：quality/tests/T002.json\n`,
  });
}

export function writeCanonicalStageMaterials(artifacts) {
  const values = canonicalStageMaterials();
  for (const [name, value] of Object.entries(values)) artifacts.writeAtomic(name, value);
  return values;
}

function requirementCoverageFixture() {
  const messages = REQUIREMENT_CLASSES.map((message_class, index) => ({
    id: `fixture-message-${index + 1}`,
    content_hash: sha256(`fixture-message-${index + 1}`),
    message_class,
  }));
  const outputs = messages.map((message, index) => ({
    message_id: message.id,
    message_hash: message.content_hash,
    message_class: message.message_class,
    axis_id: `fixture-axis-${index + 1}`,
    impact: index < 2 ? "high" : "medium",
    disposition: "represented",
    decision_ids: [`D-FIXTURE-${index + 1}`],
    requirement_ids: [`R-FIXTURE-${index + 1}`],
    fr_ids: [`FR-FIXTURE-${index + 1}`],
    ac_ids: [`AC-FIXTURE-${index + 1}`],
  }));
  return { authenticated_requirement_messages: messages, requirement_coverage_outputs: outputs };
}

function lifecycleEvents(prefix = "fixture-confirmation") {
  return ["ask", "wait", "reply", "resume"].map((event, index) => ({
    event,
    round: 1,
    card_ref: `${prefix}/card-1`,
    card_hash: sha256(`${prefix}/card-1`),
    ...(event === "reply" || event === "resume" ? { reply_ref: `${prefix}/reply-1`, reply_hash: sha256(`${prefix}/reply-1`) } : {}),
    sequence: index + 1,
  }));
}

/** Test-only Stage Agent producer fixture; runtime authenticates every byte. */
export function writeStageOutcomeFixture({ task, kernel, artifacts, workspace, candidateWorkspace, stage, attemptId = "attempt-stage-1", status = "completed", qualityReview = null, skipAnalyzerValidation = false } = {}) {
  if (!task?.identity?.taskId || !kernel?.publishCanonicalRecord || !artifacts?.read) throw new TypeError("stage outcome fixture requires task, kernel, and ArtifactDir");
  const active = workspace ?? candidateWorkspace;
  if (!active?.worktreeRoot) throw new TypeError("stage outcome fixture requires an authenticated workspace");
  const stepsManifestRef = `workflows/${stage}/steps.json`;
  const skillsManifestRef = `workflows/${stage}/skill-deps.yaml`;
  const stepsManifestRaw = readFileSync(join(process.cwd(), stepsManifestRef), "utf8");
  const skillsManifestRaw = readFileSync(join(process.cwd(), skillsManifestRef), "utf8");
  const snapshot = active.captureSnapshot?.() ?? captureGitWorktreeSnapshot(active.worktreeRoot);
  const values = MATERIALS.map((file) => {
    try { return [file, artifacts.read(file)]; }
    catch (error) { if (error?.code === "ENOENT") return [file, null]; throw error; }
  });
  const revision = materialRevisionFromValues(values);
  const manifest = JSON.parse(stepsManifestRaw);
  const skillManifest = yaml.load(skillsManifestRaw);
  const analyzerStep = manifest.steps.find((step) => ["stage-end-spec-analyze", "final-spec-analyze"].includes(step.step_slug));
  const profile = STAGE_SPEC_ANALYZE_PROFILES[stage] ?? { required_materials: [], required_evidence: [] };
  const materialText = Object.fromEntries(values.map(([file, content]) => [file, content]));
  const analyzerMaterials = Object.fromEntries(profile.required_materials.map((name) => [
    name,
    name === "original_requirement" || name === "decision_log"
      ? materialText["decision-log.md"]
      : name === "spec" || name === "plan" || name === "tasks"
        ? materialText[`${name}.md`]
        : `当前 ${name} 产物已绑定到快照 ${snapshot.tree}`,
  ]));
  const analyzerBindings = {};
  const analyzerEvidenceBindings = {};
  const publishAnalyzerBinding = (logicalRef, statement) => {
    const bindingValue = {
      schema_version: "workflowhub-stage-analyzer-binding.v1",
      task_id: task.identity.taskId,
      stage,
      snapshot_tree: snapshot.tree,
      material_revision: revision,
      logical_ref: logicalRef,
      statement,
    };
    const bindingRaw = `${JSON.stringify(bindingValue, null, 2)}\n`;
    const bindingHash = sha256(bindingRaw);
    const bindingRef = `quality/evidence/stage-analyze-bindings/${bindingHash}.json`;
    kernel.publishCanonicalRecord(bindingRef, bindingRaw);
    return { ref: bindingRef, sha256: bindingHash };
  };
  for (const name of profile.required_materials) {
    if (name === "implementation") {
      const binding = publishAnalyzerBinding(name, "fixture implementation is bound to the current snapshot");
      analyzerBindings[name] = {
        ...binding,
        snapshot_tree: snapshot.tree,
        material_sha256: sha256(analyzerMaterials[name]),
      };
    } else {
      const sourceRef = name === "original_requirement" || name === "decision_log" ? "decision-log.md" : `${name}.md`;
      analyzerBindings[name] = {
        source_ref: sourceRef,
        sha256: sha256(materialText[sourceRef]),
        snapshot_tree: snapshot.tree,
      };
    }
  }
  const analyzerEvidence = profile.required_evidence.map((ref) => {
    const binding = publishAnalyzerBinding(ref, `fixture ${ref} evidence is bound to the current snapshot`);
    analyzerEvidenceBindings[ref] = binding;
    return {
      ref,
      kind: ref,
      canonical_ref: binding.ref,
      status: "fresh",
      hash: binding.sha256,
      snapshot_tree: snapshot.tree,
      ...(ref === "tests" ? {
        test_result: { command: "true", expected_exit: 0, actual_exit: 0, oracle: "ORACLE-FIXTURE", actual_outcome: "fixture current behavior matched" },
      } : {}),
    };
  });
  for (const ref of profile.required_evidence) {
    analyzerEvidenceBindings[ref] = {
      ...analyzerEvidenceBindings[ref],
      snapshot_tree: snapshot.tree,
    };
  }
  const identity = {
    task_id: task.identity.taskId,
    stage,
    material_revision: revision,
    snapshot_tree: snapshot.tree,
  };
  const analyzerPacket = {
    original_requirements: [{ id: "R-001", summary: materialText["decision-log.md"] }],
    materials: analyzerMaterials,
    evidence: analyzerEvidence,
    coverage: [{
      requirement_id: "R-001",
      expected_behavior: materialText["decision-log.md"],
      actual_behavior: `${materialText["decision-log.md"]}并保留可验证产物`,
      semantic_match: true,
      scenario_refs: ["SCN-fixture-stage-end"],
      oracle_refs: ["ORACLE-fixture-stage-end"],
      artifact_refs: [profile.required_materials.find((name) => name !== "original_requirement") ?? "decision_log"],
      evidence_refs: [profile.required_evidence[0]],
      status: "covered",
    }],
    work_summary: `fixture ${stage} stage-end spec-analyze semantic/evidence check`,
    ...((stage === "make-decision") ? {
      ...requirementCoverageFixture(),
      grill_summary: {
        ...identity,
        status: "completed",
        requirement_coverage: { status: "complete", message_classes: [...REQUIREMENT_CLASSES], uncovered: [] },
        exit_checks: {
          external_interfaces: "pass",
          canonical_names: "pass",
          failure_semantics: "pass",
          scope_boundaries: "pass",
        },
      },
      final_confirmation: {
        ...identity,
        decision: "accepted",
        subject_ref: "fixture/decision",
        events: lifecycleEvents(),
      },
    } : {}),
    ...((stage === "build-spec") ? {
      clarify: { ...identity, status: "resolved", trigger: false, reason: "fixture has no material specification ambiguity", open_direction_changing_questions: 0 },
    } : {}),
  };
  if (stage === "build-code") {
    const evidence = (ref) => {
      const entry = analyzerEvidence.find((candidate) => candidate.ref === ref);
      return { ref, canonical_ref: entry.canonical_ref, hash: entry.hash, snapshot_tree: snapshot.tree };
    };
    const firstIdentifier = (text, pattern, fallback) => text.match(pattern)?.[0] ?? fallback;
    analyzerPacket.expected_ac_ids = ["AC-001"];
    analyzerPacket.acceptance_coverage = [{
      acceptance_criterion_id: "AC-001",
      status: "covered",
      task_id: task.identity.taskId,
      material_revision: revision,
      snapshot_tree: snapshot.tree,
      producer_stage: stage,
      source_ids: ["R-001"],
      decision_ids: [firstIdentifier(materialText["decision-log.md"], /\bD-[A-Za-z0-9_-]+\b/, "D-001")],
      fr_ids: [firstIdentifier(materialText["spec.md"], /\bFR-[A-Z][A-Z0-9]*-\d{3}\b/, "FR-FIX-001")],
      task_ids: [firstIdentifier(materialText["tasks.md"], /\bT[A-Za-z0-9_-]+\b/, "T001")],
      file_symbol: "tests/fixture.mjs#currentBehavior",
      implementation_anchor: { id: "fixture-implementation", path: "tests/fixture.mjs", start_line: 1, end_line: 2, role: "implementation" },
      verification_anchor: { id: "fixture-verification", path: "tests/fixture.test.mjs", start_line: 1, end_line: 2, role: "verification" },
      gate: { command: "true", expected_exit: 0, oracle: "ORACLE-FIXTURE" },
      scenario: "fixture current behavior is exercised",
      actual_outcome: "fixture current behavior matched",
      coverage_limits: "fixture only; no external provider",
      evidence_refs: [evidence(profile.required_evidence.includes("tests") ? "tests" : profile.required_evidence[0])],
      test_result: { evidence_ref: "tests", command: "true", expected_exit: 0, actual_exit: 0, oracle: "ORACLE-FIXTURE", actual_outcome: "fixture current behavior matched" },
      review_ref: evidence(profile.required_evidence.includes("ac-trace") ? "ac-trace" : profile.required_evidence[0]),
      stage_end_ref: evidence(profile.required_evidence.includes("ac-trace") ? "ac-trace" : profile.required_evidence[0]),
    }];
  }
  const analyzerResult = !skipAnalyzerValidation && STAGE_SPEC_ANALYZE_PROFILES[stage]
    ? validateStageSpecAnalyzeProfile({ stage, packet: analyzerPacket, strict_material_contracts: true, identity })
    : null;
  if (analyzerResult && !analyzerResult.ok && status === "completed") throw new Error(`stage outcome fixture analyzer packet is invalid: ${analyzerResult.errors.join("; ")}`);
  const makeEvidence = ({ subjectKind, subjectId, outcomeStatus, resultSummary }) => {
    const proofRaw = `${JSON.stringify({
      schema_version: "workflowhub-stage-outcome-evidence.v1",
      task_id: task.identity.taskId,
      stage,
      snapshot_tree: snapshot.tree,
      material_revision: revision,
      subject_kind: subjectKind,
      subject_id: subjectId,
      outcome_status: outcomeStatus,
      result_summary: resultSummary,
      attempt_id: attemptId,
    }, null, 2)}\n`;
    const proofHash = sha256(proofRaw);
    const proofRef = `quality/evidence/stage-outcome-proofs/${proofHash}.json`;
    kernel.publishCanonicalRecord(proofRef, proofRaw);
    return [{ ref: proofRef, sha256: proofHash }];
  };
  const stepOutcomes = manifest.steps.map((step) => {
    const resultSummary = `executed ${step.step_slug}`;
    return {
    step_id: step.step_id, step_slug: step.step_slug, order: step.order, status,
    input_refs: step.entry_conditions.map(({ uri_or_path }) => uri_or_path),
    result_summary: resultSummary,
    evidence_refs: makeEvidence({ subjectKind: "step", subjectId: step.step_slug, outcomeStatus: status, resultSummary }),
    ...(status === "completed" ? {} : { reason: "fixture stage outcome is incomplete for the unavailable review" }),
    cost: { duration_ms: null, tokens: null, status: "unavailable", reason: "fixture host did not expose usage" },
    };
  });
  const skillOutcomes = (skillManifest.skills ?? []).map(({ name }) => {
    const resultSummary = `resolved ${name}`;
    return {
      skill_id: name, status, trigger: true, executed: name === "spec-analyze" || name === "dsh-code-review" || status === "completed", version: "fixture-1.0.0",
      result_summary: resultSummary,
      evidence_refs: makeEvidence({ subjectKind: "skill", subjectId: name, outcomeStatus: status, resultSummary }),
      ...(status === "completed" ? {} : { reason: "fixture stage outcome is incomplete for the unavailable review" }),
      cost: { duration_ms: null, tokens: null, status: "unavailable", reason: "fixture host did not expose usage" },
    };
  });
  const value = {
    schema_version: "workflowhub-stage-outcomes.v1", task_id: task.identity.taskId, stage, attempt_id: attemptId, status,
    snapshot_tree: snapshot.tree, material_revision: revision,
    material_hashes: Object.fromEntries(values.map(([file, content]) => [file, content === null ? null : sha256(content)])),
    steps_manifest_ref: stepsManifestRef, steps_manifest_hash: sha256(stepsManifestRaw),
    skills_manifest_ref: skillsManifestRef, skills_manifest_hash: sha256(skillsManifestRaw),
    step_outcomes: stepOutcomes, skill_outcomes: skillOutcomes,
    ...(stage === "verify-code" ? {
      code_review: {
        schema_version: "workflowhub-code-review-stage-outcome.v1",
        stage,
        snapshot_tree: snapshot.tree,
        material_revision: revision,
        step_slug: "approve-verification",
        skill_id: "dsh-code-review",
        ...(qualityReview ? {
          quality_review_ref: qualityReview.ref ?? qualityReview.resultRef,
        quality_review_hash: qualityReview.sha256 ?? sha256(task.readRecord(qualityReview.ref ?? qualityReview.resultRef)),
        } : {}),
        result: {
          status: String(qualityReview?.ref ?? qualityReview?.resultRef ?? "").includes("/attempts/") ? "unavailable" : "clean",
          findings: [],
          summary: "fixture current implementation code review completed",
          focus: ["correctness", "lifecycle", "security", "consumer_fit", "test_strength"],
          repairs: [],
        },
      },
    } : {
    spec_analyze: {
      schema_version: "workflowhub-spec-analyze-stage-outcome.v1",
      stage,
      snapshot_tree: snapshot.tree,
      material_revision: revision,
      step_slug: analyzerStep?.step_slug,
      skill_id: "spec-analyze",
      material_bindings: analyzerBindings,
      evidence_bindings: analyzerEvidenceBindings,
      packet: analyzerPacket,
      result: analyzerResult,
    },
    }),
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = `quality/evidence/stage-outcomes/${stage}/${sha256(raw)}.json`;
  kernel.publishCanonicalRecord(ref, raw);
  return { ref, sha256: sha256(raw), value };
}
