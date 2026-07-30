import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import yaml from "js-yaml";
import { resolveSkillDispatch } from "./local-skill-resolver.mjs";
import { doctorCapabilities } from "./capability-doctor.mjs";
import { createStageSkillInvocation } from "./stage-skill-invocation.mjs";

export function loadStageSkillManifest(packageRoot, stage) {
  if (!/^[a-z][a-z0-9-]*$/.test(stage)) throw new Error(`invalid stage: ${stage}`);
  const root = fs.realpathSync(packageRoot);
  const relative = `workflows/${stage}/skill-deps.yaml`;
  const source = path.join(root, relative);
  const manifest = yaml.load(fs.readFileSync(source, "utf8"));
  if (manifest?.stage !== stage || !Array.isArray(manifest.skills)) throw new Error(`${stage}: invalid skill manifest`);
  return { root, relative, source, manifest };
}

export function preflightStageSkills({ packageRoot, stage, activeConditions = [], probes = {}, commands = {}, run } = {}) {
  const loaded = loadStageSkillManifest(packageRoot, stage);
  const dependencies = new Map();
  const payloads = new Map();
  for (const dependency of loaded.manifest.skills) {
    dependencies.set(dependency.name, dependency);
    payloads.set(dependency.name, resolveSkillDispatch({ packageRoot: loaded.root, manifestPath: loaded.relative, dependency }));
  }
  const capabilityResults = doctorCapabilities({ manifest: loaded.manifest, activeConditions, probes, commands, ...(run ? { run } : {}) });
  return { ...loaded, dependencies, payloads, capabilityResults };
}

export async function dispatchStageSkill({ packageRoot, stage, name, triggered = true, hostInvoke, independentContextAvailable = true, activeConditions = [], probes = {}, commands = {}, run, kernel, invocationKey = "default" }) {
  const prepared = preflightStageSkills({ packageRoot, stage, activeConditions, probes, commands, run });
  const dependency = prepared.manifest.skills.find(item => item.name === name);
  if (!dependency) throw new Error(`${stage}: undeclared skill ${name}`);
  if (!triggered) {
    if (dependency.invocation !== "conditional") throw new Error(`${stage}/${name}: always skill cannot be not_invoked`);
    const fact = createStageSkillInvocation({
      ...(kernel ? { taskId: kernel.task.identity.taskId, workflowRunId: kernel.deriveStageWorkflowRunId(stage) } : {}),
      stage, name, invocationKey, declaredTrigger: dependency.trigger, bundleHash: prepared.payloads.get(name).bundle_hash,
      status: "not_invoked", reason: "trigger_false",
    });
    if (kernel) kernel.publishStageSkillInvocation(fact);
    return fact;
  }
  if (dependency.execution === "independent" && !independentContextAvailable) {
    const fact = createStageSkillInvocation({
      ...(kernel ? { taskId: kernel.task.identity.taskId, workflowRunId: kernel.deriveStageWorkflowRunId(stage) } : {}),
      stage, name, invocationKey, declaredTrigger: dependency.trigger, bundleHash: prepared.payloads.get(name).bundle_hash,
      status: "unavailable", reason: "independent_context_unavailable",
    });
    if (kernel) kernel.publishStageSkillInvocation(fact);
    return fact;
  }
  if (typeof hostInvoke !== "function") throw new Error(`${stage}/${name}: hostInvoke is required`);
  let result;
  try {
    result = await hostInvoke(Object.freeze({
      ...prepared.payloads.get(name),
      doctor_diagnostics: Object.freeze([...prepared.capabilityResults]),
    }));
  } catch (error) {
    const fact = createStageSkillInvocation({
      ...(kernel ? { taskId: kernel.task.identity.taskId, workflowRunId: kernel.deriveStageWorkflowRunId(stage) } : {}),
      stage, name, invocationKey, declaredTrigger: dependency.trigger, bundleHash: prepared.payloads.get(name).bundle_hash,
      status: "unavailable", reason: `host_invoke_failed:${error?.name ?? "Error"}`,
    });
    if (kernel) kernel.publishStageSkillInvocation(fact);
    throw error;
  }
  const fact = createStageSkillInvocation({
    ...(kernel ? { taskId: kernel.task.identity.taskId, workflowRunId: kernel.deriveStageWorkflowRunId(stage) } : {}),
    stage, name, invocationKey, declaredTrigger: dependency.trigger, bundleHash: prepared.payloads.get(name).bundle_hash,
    status: "executed", result,
  });
  if (kernel) {
    const raw = kernel.task.readRecord(result?.outcome_ref);
    const actualHash = createHash("sha256").update(raw).digest("hex");
    if (actualHash !== result?.outcome_hash) throw new Error(`${stage}/${name}: hostInvoke outcome hash mismatch`);
    let outcome;
    try { outcome = JSON.parse(raw); } catch { throw new Error(`${stage}/${name}: hostInvoke outcome must be canonical JSON`); }
    if (outcome.snapshot_tree !== result?.snapshot_tree) throw new Error(`${stage}/${name}: hostInvoke outcome snapshot mismatch`);
  }
  if (kernel) kernel.publishStageSkillInvocation(fact);
  return fact;
}
