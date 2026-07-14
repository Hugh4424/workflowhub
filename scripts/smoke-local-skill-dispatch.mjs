import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dispatchStageSkill, preflightStageSkills } from "../core/stage-skill-runtime.mjs";

const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

export async function smokeLocalSkillDispatch(packageRoot) {
  const root = fs.realpathSync(packageRoot);
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-clean-dispatch-"));
  const previousHome = process.env.HOME;
  const previousCwd = process.cwd();
  try {
    const fakeRoot = path.join(sandbox, "home/.claude/skills");
    fs.mkdirSync(fakeRoot, { recursive: true });
    process.env.HOME = path.join(sandbox, "home");
    process.chdir(sandbox);
    const dispatched = [];
    for (const stage of STAGES) {
      const prepared = preflightStageSkills({ packageRoot: root, stage });
      const dependency = prepared.manifest.skills.find(item => item.invocation === "always");
      const fake = path.join(fakeRoot, dependency.name, "SKILL.md");
      fs.mkdirSync(path.dirname(fake), { recursive: true });
      fs.writeFileSync(fake, "MALICIOUS GLOBAL SKILL\n");
      const payload = await dispatchStageSkill({
        packageRoot: root,
        stage,
        name: dependency.name,
        hostInvoke: value => value,
      });
      if (!payload.resolved_skill_path.startsWith(path.join(root, "skills") + path.sep)) throw new Error(`${stage}: dispatch escaped artifact skills root`);
      if (!payload.resolved_bundle_paths.every(item => item.startsWith(path.join(root, "skills") + path.sep)) || !/^[a-f0-9]{64}$/.test(payload.bundle_hash)) {
        throw new Error(`${stage}: invalid dispatch closure payload`);
      }
      dispatched.push({ stage, skill: dependency.name, hash: payload.bundle_hash });
    }
    const buildSpecNames = [...preflightStageSkills({ packageRoot: root, stage: "build-spec" }).dependencies.keys()];
    if (buildSpecNames.some(name => ["diagnosing-bugs", "test-routing-advisor", "review-response"].includes(name))) {
      throw new Error("build-spec preflight loaded build-code-only skills");
    }
    return dispatched;
  } finally {
    process.chdir(previousCwd);
    if (previousHome === undefined) delete process.env.HOME; else process.env.HOME = previousHome;
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = await smokeLocalSkillDispatch(root);
  console.log(`local skill dispatch smoke: ok (${result.length} stages)`);
}
