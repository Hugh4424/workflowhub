import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { resolveSkillPackage } from "../adapters/local-skill-resolver.mjs";
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

export function resolveStageSkillPackages({ packageRoot, stage } = {}) {
  const loaded = loadStageSkillManifest(packageRoot, stage);
  const dependencies = new Map();
  const payloads = new Map();
  for (const dependency of loaded.manifest.skills) {
    dependencies.set(dependency.name, dependency);
    payloads.set(dependency.name, resolveSkillPackage({ packageRoot: loaded.root, manifestPath: loaded.relative, dependency }));
  }
  return { ...loaded, dependencies, payloads };
}
