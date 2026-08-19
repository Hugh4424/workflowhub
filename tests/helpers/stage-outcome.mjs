import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";

import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { STAGE_SPEC_ANALYZE_PROFILES, validateStageSpecAnalyzeProfile } from "../../runtime/stage/stage-content-contracts.mjs";

const MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

/** Test-only Stage Agent producer fixture; runtime authenticates every byte. */
export function writeStageOutcomeFixture({ task, kernel, artifacts, workspace, candidateWorkspace, stage, attemptId = "attempt-stage-1", status = "completed" } = {}) {
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
  const revision = `revision-${sha256(JSON.stringify(values))}`;
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
  const analyzerEvidence = profile.required_evidence.map((ref) => ({
    ref,
    kind: ref,
    status: "fresh",
    hash: (analyzerEvidenceBindings[ref] = publishAnalyzerBinding(ref, `fixture ${ref} evidence is bound to the current snapshot`)).sha256,
    snapshot_tree: snapshot.tree,
  }));
  for (const ref of profile.required_evidence) {
    analyzerEvidenceBindings[ref] = {
      ...analyzerEvidenceBindings[ref],
      snapshot_tree: snapshot.tree,
    };
  }
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
  };
  const analyzerResult = STAGE_SPEC_ANALYZE_PROFILES[stage]
    ? validateStageSpecAnalyzeProfile({ stage, packet: analyzerPacket })
    : null;
  if (analyzerResult && !analyzerResult.ok) throw new Error(`stage outcome fixture analyzer packet is invalid: ${analyzerResult.errors.join("; ")}`);
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
    cost: { duration_ms: null, tokens: null, status: "unavailable", reason: "fixture host did not expose usage" },
    };
  });
  const skillOutcomes = (skillManifest.skills ?? []).map(({ name }) => {
    const resultSummary = `resolved ${name}`;
    return {
      skill_id: name, status, trigger: true, executed: name === "spec-analyze" || name === "dsh-code-review" || status === "completed", version: "fixture-1.0.0",
      result_summary: resultSummary,
      evidence_refs: makeEvidence({ subjectKind: "skill", subjectId: name, outcomeStatus: status, resultSummary }),
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
        step_slug: "code-review-closure",
        skill_id: "dsh-code-review",
        result: {
          status: "clean",
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
