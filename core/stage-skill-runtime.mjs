import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { resolveSkillDispatch } from "./local-skill-resolver.mjs";
import { doctorCapabilities } from "./capability-doctor.mjs";

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
    for (const locator of [dependency.path, dependency.bundle]) {
      const candidate = path.resolve(loaded.root, locator);
      const stat = fs.lstatSync(candidate);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${stage}/${dependency.name}: invalid installation file ${locator}`);
    }
    dependencies.set(dependency.name, dependency);
    payloads.set(dependency.name, resolveSkillDispatch({ packageRoot: loaded.root, manifestPath: loaded.relative, dependency }));
  }
  const capabilityResults = doctorCapabilities({ manifest: loaded.manifest, activeConditions, probes, commands, ...(run ? { run } : {}) });
  const blocking = capabilityResults.filter(result => ["blocked", "human_required"].includes(result.status));
  if (blocking.length) throw new Error(`${stage}: capability preflight failed: ${blocking.map(item => `${item.id}:${item.status}`).join(", ")}`);
  return { ...loaded, dependencies, payloads, capabilityResults };
}

export async function dispatchStageSkill({ packageRoot, stage, name, triggered = true, hostInvoke, independentContextAvailable = true, activeConditions = [], probes = {}, commands = {}, run }) {
  const prepared = preflightStageSkills({ packageRoot, stage, activeConditions, probes, commands, run });
  const dependency = prepared.manifest.skills.find(item => item.name === name);
  if (!dependency) throw new Error(`${stage}: undeclared skill ${name}`);
  if (!triggered) {
    if (dependency.invocation !== "conditional") throw new Error(`${stage}/${name}: always skill cannot be not_invoked`);
    return { name, status: "not_invoked", source_manifest: prepared.source, package_root: prepared.root };
  }
  if (dependency.execution === "independent" && !independentContextAvailable) {
    return { name, status: "unavailable", reason: "independent_context_unavailable", source_manifest: prepared.source, package_root: prepared.root };
  }
  if (typeof hostInvoke !== "function") throw new Error(`${stage}/${name}: hostInvoke is required`);
  return hostInvoke(prepared.payloads.get(name));
}
