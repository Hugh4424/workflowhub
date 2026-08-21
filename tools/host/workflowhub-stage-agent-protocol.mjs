#!/usr/bin/env node

/**
 * Tiny producer-side marker for a real Stage Agent that cannot finish its
 * structured execution packet.  The marker is intentionally not a stage
 * outcome and cannot claim success; the host bridge expands it into the
 * authenticated unavailable record after the agent exits.
 */

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import yaml from "js-yaml";

function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`);
  return value.trim();
}

function option(argv, name) {
  const index = argv.indexOf(name);
  return text(index >= 0 ? argv[index + 1] : "", name);
}

function writeAtomic(outputPath, value) {
  mkdirSync(dirname(outputPath), { recursive: true, mode: 0o700 });
  const tempPath = `${outputPath}.tmp-${process.pid}`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(tempPath, outputPath);
}

function manifestFor(runtimeRoot, stage) {
  const steps = JSON.parse(readFileSync(`${runtimeRoot}/workflows/${stage}/steps.json`, "utf8"));
  const skills = yaml.load(readFileSync(`${runtimeRoot}/workflows/${stage}/skill-deps.yaml`, "utf8"));
  if (!Array.isArray(steps.steps) || !Array.isArray(skills?.skills)) {
    throw new TypeError("WorkflowHub Stage Agent manifest is invalid");
  }
  return { steps: steps.steps, skills: skills.skills };
}

const ANALYZER_PROFILES = Object.freeze({
  "make-decision": { materials: ["original_requirement", "decision_log"], evidence: ["decision-log"] },
  "build-spec": { materials: ["original_requirement", "decision_log", "spec"], evidence: ["decision-log", "spec"] },
  "build-plan": { materials: ["original_requirement", "decision_log", "spec", "plan", "tasks"], evidence: ["decision-log", "spec", "plan", "tasks"] },
  "build-code": { materials: ["original_requirement", "decision_log", "spec", "plan", "tasks", "implementation"], evidence: ["decision-log", "spec", "plan", "tasks", "implementation", "tests", "ac-trace"] },
  "verify-code": { materials: [], evidence: [] },
});

function writeTemplate(argv) {
  const outputPath = option(argv, "--output");
  const runtimeRoot = option(argv, "--runtime-root");
  const stage = option(argv, "--stage");
  const { steps, skills } = manifestFor(runtimeRoot, stage);
  const profile = ANALYZER_PROFILES[stage];
  if (!profile) throw new Error(`unsupported stage analyzer profile: ${stage}`);
  const stepId = (...candidates) => steps.find((step) => candidates.includes(step.step_slug))?.step_slug
    ?? steps[0]?.step_slug;
  const evidenceSubjectIds = {
    "decision-log": stepId("read-current-task-documents", "read-current-materials", "read-decision-log", "load-context"),
    spec: stepId("read-current-task-documents", "read-current-materials", "read-decision-log", "load-context"),
    plan: stepId("read-current-task-documents", "read-current-materials"),
    tasks: stepId("read-current-task-documents", "read-current-materials"),
    implementation: stepId("implement-change", "main-agent-repair-batch-1", "read-current-materials-and-code"),
    tests: stepId("run-tests", "run-declared-check-before-independent-review", "run-final-check-and-handoff"),
    "ac-trace": stepId("run-final-aggregate-and-ac-trace", "run-final-check-and-handoff", "publish-verification-result"),
    review: stepId("review-change", "run-one-independent-architecture-review", "publish-verification-attempt"),
    runtime: stepId("run-final-aggregate-and-ac-trace", "run-final-check-and-handoff"),
    delivery: stepId("publish-code-result", "publish-verification-result", "approve-verification"),
  };
  const incompleteCost = { duration_ms: null, tokens: null, status: "unavailable", reason: "not measured yet" };
  const stepEvidence = (step) => [{
    kind: "stage-agent-template",
    status: "incomplete",
    subject_kind: "step",
    subject_id: step.step_slug,
    reason: "template is not an execution result; replace with evidence from this run",
  }];
  const skillEvidence = (skill) => [{
    kind: "stage-agent-template",
    status: "incomplete",
    subject_kind: "skill",
    subject_id: skill.name,
    reason: "template is not an execution result; replace with evidence from this run",
  }];
  const value = {
    schema_version: "workflowhub-stage-agent-execution-template.v1",
    status: "incomplete",
    provenance: { kind: "stage-agent", host: "replace-with-bound-host", agent_run_id: "replace-with-current-agent-run" },
    steps: steps.map((step) => ({
      step_id: step.step_id,
      step_slug: step.step_slug,
      order: step.order,
      status: "incomplete",
      input_refs: step.entry_conditions.map(({ uri_or_path }) => uri_or_path),
      result_summary: "待 Stage Agent 填入本次真实结果",
      evidence: stepEvidence(step),
      reason: "template is not an execution result; replace with the real reason",
      cost: incompleteCost,
    })),
    skills: skills.map((skill) => ({
      skill_id: skill.name,
      status: "incomplete",
      trigger: false,
      executed: false,
      version: "replace-with-used-skill-version",
      result_summary: "待 Stage Agent 填入本次真实结果",
      evidence: skillEvidence(skill),
      reason: "template is not an execution result; replace with the real reason",
      cost: incompleteCost,
    })),
    ...(stage === "verify-code" ? {
      code_review: {
        schema_version: "workflowhub-code-review-stage-outcome.v1",
        stage,
        snapshot_tree: null,
        material_revision: null,
        step_slug: stepId("approve-verification"),
        skill_id: "dsh-code-review",
        result: {
          status: "unavailable",
          findings: [],
          summary: "模板不是实际代码审查结果；请替换为本次真实 review",
        },
      },
    } : {
      spec_analyze: {
        packet: {
          original_requirements: [{
            id: "replace-with-requirement-id",
            summary: "replace with one requirement from the current decision-log",
          }],
          coverage: [{
            requirement_id: "replace-with-requirement-id",
            expected_behavior: "replace with the requirement's expected behavior",
            actual_behavior: "replace with what this run actually observed",
            semantic_match: false,
            scenario_refs: ["replace-with-real-scenario-ref"],
            oracle_refs: ["replace-with-real-oracle-ref"],
            artifact_refs: ["decision_log"],
            evidence_refs: ["decision-log"],
            status: "incomplete",
          }],
          current_stage_repairs: [],
          work_summary: "replace with the truthful current stage-end spec-analyze result",
        },
        ...(profile.materials.includes("implementation") ? {
          implementation_material: "replace with the current implementation/change summary; required for build-code",
          implementation_evidence_subject: { subject_kind: "step", subject_id: evidenceSubjectIds.implementation },
        } : {}),
        evidence_subjects: Object.fromEntries(profile.evidence.map((ref) => [ref, {
          subject_kind: "step",
          subject_id: evidenceSubjectIds[ref],
        }])),
      },
    })
  };
  writeAtomic(outputPath, value);
  process.stdout.write(`${JSON.stringify({ status: "template", output_path: outputPath, step_count: steps.length, skill_count: skills.length })}\n`);
}

function main(argv) {
  if (argv[2] === "write-template") {
    writeTemplate(argv);
    return;
  }
  if (argv[2] !== "write-unavailable") {
    throw new Error("usage: workflowhub-stage-agent-protocol.mjs write-unavailable --reason <text>");
  }
  const reasonIndex = argv.indexOf("--reason");
  const reason = text(reasonIndex >= 0 ? argv[reasonIndex + 1] : "", "--reason");
  const outputPath = text(process.env.WORKFLOWHUB_STAGE_OUTCOME_PATH, "WORKFLOWHUB_STAGE_OUTCOME_PATH");
  const stage = text(process.env.WORKFLOWHUB_STAGE, "WORKFLOWHUB_STAGE");
  const host = text(process.env.WORKFLOWHUB_HOST, "WORKFLOWHUB_HOST");
  const agentRunId = text(process.env.CODEX_THREAD_ID ?? `stage-agent-${process.pid}`, "agent run id");
  const value = {
    schema_version: "workflowhub-stage-agent-unavailable.v1",
    stage,
    status: "unavailable",
    host,
    agent_run_id: agentRunId,
    reason,
  };
  writeAtomic(outputPath, value);
  process.stdout.write(`${JSON.stringify({ status: value.status, output_path: outputPath, reason })}\n`);
}

try {
  main(process.argv);
} catch (error) {
  process.stderr.write(`${error?.stack ?? error}\n`);
  process.exitCode = 1;
}
