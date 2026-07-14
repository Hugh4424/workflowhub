import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { resolveSkillDispatch } from "./local-skill-resolver.mjs";

export function loadStageSkillManifest(packageRoot, stage) {
  if (!/^[a-z][a-z0-9-]*$/.test(stage)) throw new Error(`invalid stage: ${stage}`);
  const root = fs.realpathSync(packageRoot);
  const relative = `workflows/${stage}/skill-deps.yaml`;
  const source = path.join(root, relative);
  const manifest = yaml.load(fs.readFileSync(source, "utf8"));
  if (manifest?.stage !== stage || !Array.isArray(manifest.skills)) throw new Error(`${stage}: invalid skill manifest`);
  return { root, relative, source, manifest };
}

export function preflightStageSkills({ packageRoot, stage }) {
  const loaded = loadStageSkillManifest(packageRoot, stage);
  const dependencies = new Map();
  for (const dependency of loaded.manifest.skills) {
    for (const locator of [dependency.path, dependency.bundle]) {
      const candidate = path.resolve(loaded.root, locator);
      const stat = fs.lstatSync(candidate);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${stage}/${dependency.name}: invalid installation file ${locator}`);
    }
    dependencies.set(dependency.name, dependency);
  }
  return { ...loaded, dependencies };
}

export async function dispatchStageSkill({ packageRoot, stage, name, triggered = true, hostInvoke, independentContextAvailable = true }) {
  const prepared = preflightStageSkills({ packageRoot, stage });
  const dependency = prepared.manifest.skills.find(item => item.name === name);
  if (!dependency) throw new Error(`${stage}: undeclared skill ${name}`);
  if (!triggered) {
    if (dependency.invocation !== "conditional") throw new Error(`${stage}/${name}: always skill cannot be not_invoked`);
    return { name, status: "not_invoked", source_manifest: prepared.source, package_root: prepared.root };
  }
  if (dependency.execution === "independent" && !independentContextAvailable) {
    throw new Error(`${stage}/${name}: independent context capability unavailable; human decision required`);
  }
  if (typeof hostInvoke !== "function") throw new Error(`${stage}/${name}: hostInvoke is required`);
  const payload = resolveSkillDispatch({ packageRoot: prepared.root, manifestPath: prepared.relative, dependency });
  return hostInvoke(payload);
}
