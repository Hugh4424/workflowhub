import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
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
    const doctorOptions = {
      commands: { "target-test-command": [process.execPath, "--version"] },
      probes: new Proxy({}, { get: () => true }),
    };
    for (const stage of STAGES) {
      const prepared = preflightStageSkills({ packageRoot: root, stage, ...doctorOptions });
      if (!prepared.capabilityResults.some(result => result.status === "available")) throw new Error(`${stage}: capability doctor was not exercised`);
      let dispatchCount = 0;
      for (const dependency of prepared.manifest.skills) {
        const fake = path.join(fakeRoot, dependency.name, "SKILL.md");
        fs.mkdirSync(path.dirname(fake), { recursive: true });
        fs.writeFileSync(fake, "MALICIOUS GLOBAL SKILL\n");
        if (dependency.invocation === "conditional") {
          const skipped = await dispatchStageSkill({ packageRoot: root, stage, name: dependency.name, triggered: false, hostInvoke: () => { throw new Error("conditional host invoked while skipped"); }, ...doctorOptions });
          if (skipped.status !== "not_invoked") throw new Error(`${stage}/${dependency.name}: missing not_invoked product`);
        }
        const payload = await dispatchStageSkill({ packageRoot: root, stage, name: dependency.name, hostInvoke: value => {
          const definition = fs.readFileSync(value.resolved_skill_path, "utf8");
          if (!definition.trim()) throw new Error(`${stage}/${dependency.name}: empty SKILL.md`);
          return value;
        }, ...doctorOptions });
        if (!payload.resolved_skill_path.startsWith(path.join(root, "skills") + path.sep)) throw new Error(`${stage}: dispatch escaped artifact skills root`);
        if (!payload.resolved_bundle_paths.every(item => item.startsWith(path.join(root, "skills") + path.sep)) || !/^[a-f0-9]{64}$/.test(payload.bundle_hash)) {
          throw new Error(`${stage}: invalid dispatch closure payload`);
        }
        dispatchCount += 1;
      }
      dispatched.push({ stage, dispatch_count: dispatchCount });
    }
    const buildSpecNames = [...preflightStageSkills({ packageRoot: root, stage: "build-spec", ...doctorOptions }).dependencies.keys()];
    if (buildSpecNames.some(name => ["diagnosing-bugs", "test-routing-advisor", "review-response"].includes(name))) {
      throw new Error("build-spec preflight loaded build-code-only skills");
    }
    const routing = await import(pathToFileURL(path.join(root, "skills/test-routing-advisor/scripts/route.mjs")));
    const diagnosis = await import(pathToFileURL(path.join(root, "skills/diagnosing-bugs/scripts/validate-diagnosis.mjs")));
    const response = await import(pathToFileURL(path.join(root, "skills/review-response/scripts/validate-response.mjs")));
    if (routing.routeTests({ changed_files: ["docs/readme.md"] }, () => new Date("2026-01-01T00:00:00Z")).result !== "pass") throw new Error("test-routing executable contract failed");
    if (!diagnosis.validateDiagnosis({ reproduction: "r", hypotheses: ["a", "b", "c"], confirmed_root_cause: "x", probe_evidence: "e" }).valid) throw new Error("diagnosis executable contract failed");
    if (!response.validateReviewResponse({ finding_id: "f", decision: "reject", evidence: "e" }).valid) throw new Error("review-response executable contract failed");
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
