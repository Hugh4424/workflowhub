import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import yaml from "js-yaml";
import { resolveSkillDispatch } from "../adapters/local-skill-resolver.mjs";
import { doctorCapabilities } from "../evidence/capability-doctor.mjs";
import { createStageSkillInvocation } from "../../core/stage-skill-invocation.mjs";
import { validateStepManifest } from "./step-manifest.mjs";

export function loadStageSkillManifest(packageRoot, stage) {
  if (!/^[a-z][a-z0-9-]*$/.test(stage)) throw new Error(`invalid stage: ${stage}`);
  const root = fs.realpathSync(packageRoot);
  const relative = `workflows/${stage}/skill-deps.yaml`;
  const source = path.join(root, relative);
  const manifest = yaml.load(fs.readFileSync(source, "utf8"));
  if (manifest?.stage !== stage || !Array.isArray(manifest.skills)) throw new Error(`${stage}: invalid skill manifest`);
  return { root, relative, source, manifest };
}

export function loadStageSkillStepManifest(packageRoot, stage) {
  if (!/^[a-z][a-z0-9-]*$/.test(stage)) throw new Error(`invalid stage: ${stage}`);
  const root = fs.realpathSync(packageRoot);
  const relative = `workflows/${stage}/steps.json`;
  const source = path.join(root, relative);
  const manifest = JSON.parse(fs.readFileSync(source, "utf8"));
  const validation = validateStepManifest(manifest);
  if (!validation.ok) throw new Error(`${stage}: invalid step manifest: ${validation.errors.join("; ")}`);
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

export async function dispatchStageSkill({ packageRoot, stage, name, triggered = true, notInvokedReason = "trigger_false", hostInvoke, independentContextAvailable = true, activeConditions = [], probes = {}, commands = {}, run, kernel, invocationKey = "default" }) {
  const prepared = preflightStageSkills({ packageRoot, stage, activeConditions, probes, commands, run });
  const dependency = prepared.manifest.skills.find(item => item.name === name);
  if (!dependency) throw new Error(`${stage}: undeclared skill ${name}`);
  if (!triggered) {
    if (dependency.invocation !== "conditional") throw new Error(`${stage}/${name}: always skill cannot be not_invoked`);
    const fact = createStageSkillInvocation({
      ...(kernel ? { taskId: kernel.task.identity.taskId, workflowRunId: kernel.deriveStageWorkflowRunId(stage) } : {}),
      stage, name, invocationKey, declaredTrigger: dependency.trigger, bundleHash: prepared.payloads.get(name).bundle_hash,
      status: "not_invoked", reason: notInvokedReason,
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

function orderedSkillNames(step, controls = {}) {
  const entries = (step.completion_evidence ?? [])
    .filter((entry) => typeof entry?.uri_or_path === "string" && entry.uri_or_path.startsWith("skill://"))
    .map((entry) => ({
      name: entry.uri_or_path.slice("skill://".length),
      invocationKey: entry.invocation_key ?? `step-${step.order}`,
    }))
    .filter(({ name }) => name);
  return entries.flatMap(({ name, invocationKey }) => {
    if (name !== "concrete-testing") return [{ name, invocationKey }];
    const notApplicable = controls.testingNotApplicable ?? controls.testing_not_applicable;
    if (notApplicable === true) {
      const reason = controls.testingNotApplicableReason
        ?? controls.testing_not_applicable_reason;
      if (typeof reason !== "string" || reason.trim() === "") {
        throw new Error("build-code/concrete-testing: testingNotApplicableReason is required");
      }
      return [];
    }
    const selected = controls.selectedTestingSkill ?? controls.selected_testing_skill;
    if (typeof selected !== "string" || selected.trim() === "") {
      throw new Error("build-code/concrete-testing: selectedTestingSkill is required");
    }
    return [{ name: selected, invocationKey }];
  });
}

/**
 * Dispatch stage-owned skills in the stage's declared step order. The existing
 * manifest remains the authority for skill identity and bundle closure; the
 * step manifest supplies the ordering and the observable skill-output boundary.
 * This is a private orchestration helper, not a second stage state machine.
 */
export async function dispatchOrderedStageSkills({
  packageRoot,
  stage,
  controls = {},
  hostInvoke,
  activeConditions = [],
  probes = {},
  commands = {},
  run,
  kernel,
} = {}) {
  const prepared = preflightStageSkills({ packageRoot, stage, activeConditions, probes, commands, run });
  const steps = loadStageSkillStepManifest(prepared.root, stage).manifest.steps
    .slice().sort((left, right) => left.order - right.order);
  const facts = [];
  const seen = new Set();
  const seenNames = new Set();
  const globalNotApplicableReason = controls.testingNotApplicableReason
    ?? controls.testing_not_applicable_reason;
  for (const step of steps) {
    for (const { name, invocationKey } of orderedSkillNames(step, controls)) {
      const invocationIdentity = `${name}/${invocationKey}`;
      if (seen.has(invocationIdentity)) throw new Error(`${stage}: skill ${name} invocation ${invocationKey} is declared more than once`);
      const dependency = prepared.manifest.skills.find((item) => item.name === name);
      if (!dependency) throw new Error(`${stage}: ordered step references undeclared skill ${name}`);
      const control = controls?.[name] ?? {};
      const selectedTestingSkill = controls.selectedTestingSkill ?? controls.selected_testing_skill;
      const testingNotApplicable = controls.testingNotApplicable === true || controls.testing_not_applicable === true;
      const isConcreteTestingStep = step.completion_evidence?.some(({ uri_or_path }) => uri_or_path === "skill://concrete-testing");
      const isAuthenticatedSelectedTestingSkill = stage === "build-code"
        && isConcreteTestingStep
        && !testingNotApplicable
        && name === selectedTestingSkill;
      const triggered = control.triggered
        ?? (isAuthenticatedSelectedTestingSkill ? true : dependency.invocation === "always");
      const perSkillHostInvoke = control.hostInvoke
        ?? (typeof hostInvoke === "function"
          ? (payload) => hostInvoke(Object.freeze({
              stage,
              name,
              invocationKey,
              step: Object.freeze({ step_id: step.step_id, step_slug: step.step_slug, order: step.order }),
              dependency,
              control: Object.freeze({ ...control }),
              payload,
            }))
          : undefined);
      facts.push(await dispatchStageSkill({
        packageRoot: prepared.root,
        stage,
        name,
        triggered,
        notInvokedReason: control.notInvokedReason ?? control.not_invoked_reason ?? "conditional_step_not_triggered",
        hostInvoke: perSkillHostInvoke,
        independentContextAvailable: control.independentContextAvailable ?? control.independent_context_available ?? true,
        activeConditions,
        probes,
        commands,
        run,
        kernel,
        invocationKey: control.invocationKey ?? control.invocation_key ?? invocationKey,
      }));
      seen.add(invocationIdentity);
      seenNames.add(name);
    }
  }
  for (const dependency of prepared.manifest.skills) {
    if (seenNames.has(dependency.name)) continue;
    if (dependency.invocation !== "conditional") {
      throw new Error(`${stage}/${dependency.name}: always skill is missing from ordered steps`);
    }
    const control = controls?.[dependency.name] ?? {};
    facts.push(await dispatchStageSkill({
      packageRoot: prepared.root,
      stage,
      name: dependency.name,
      triggered: false,
      notInvokedReason: control.notInvokedReason
        ?? control.not_invoked_reason
        ?? (controls.testingNotApplicable === true || controls.testing_not_applicable === true
          ? globalNotApplicableReason
          : undefined)
        ?? "not_declared_by_ordered_steps",
      activeConditions,
      probes,
      commands,
      run,
      kernel,
      invocationKey: control.invocationKey ?? control.invocation_key ?? "default",
    }));
    seen.add(`${dependency.name}/default`);
    seenNames.add(dependency.name);
  }
  return Object.freeze(facts);
}
