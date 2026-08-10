import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadStageSkillManifest,
  loadStageSkillStepManifest,
  resolveStageSkillPackages,
} from "../../runtime/stage/stage-skill-runtime.mjs";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

function isInside(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

export function smokeLocalSkillPackages(packageRoot) {
  const root = fs.realpathSync(packageRoot);
  return STAGES.map((stage) => {
    const loaded = loadStageSkillManifest(root, stage);
    const orderedSteps = loadStageSkillStepManifest(root, stage);
    const resolved = resolveStageSkillPackages({ packageRoot: root, stage });
    const declaredNames = loaded.manifest.skills.map((dependency) => dependency.name);

    if (JSON.stringify([...resolved.dependencies.keys()]) !== JSON.stringify(declaredNames)
        || JSON.stringify([...resolved.payloads.keys()]) !== JSON.stringify(declaredNames)) {
      throw new Error(`${stage}: resolved skill packages do not preserve manifest order`);
    }
    if (!orderedSteps.manifest.steps.every((step, index) => step.order === index + 1)) {
      throw new Error(`${stage}: steps are not stored in declared order`);
    }

    const bundleHashes = [];
    for (const name of declaredNames) {
      const payload = resolved.payloads.get(name);
      if (payload.package_root !== root || payload.source_manifest !== loaded.source) {
        throw new Error(`${stage}/${name}: package metadata does not point at the portable package`);
      }
      if (!isInside(path.join(root, "skills"), payload.resolved_skill_path)
          || !payload.resolved_bundle_paths.every((entry) => isInside(path.join(root, "skills"), entry))) {
        throw new Error(`${stage}/${name}: resolved path escaped the portable package`);
      }
      if (!/^[a-f0-9]{64}$/.test(payload.bundle_hash)) {
        throw new Error(`${stage}/${name}: invalid bundle hash`);
      }
      bundleHashes.push(payload.bundle_hash);
    }

    return Object.freeze({
      stage,
      skill_count: declaredNames.length,
      step_count: orderedSteps.manifest.steps.length,
      bundle_hashes: Object.freeze(bundleHashes),
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const result = smokeLocalSkillPackages(root);
  console.log(`local skill package smoke: ok (${result.length} stages)`);
}
