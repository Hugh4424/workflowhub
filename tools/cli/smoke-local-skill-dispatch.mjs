import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { dispatchStageSkill, preflightStageSkills } from "../../runtime/stage/stage-skill-runtime.mjs";

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
      let authenticatedOutcomeCount = 0;
      const outcomes = new Map();
      const published = [];
      const snapshotTree = "a".repeat(40);
      const kernel = {
        task: {
          identity: { taskId: "local-skill-dispatch-smoke" },
          readRecord(ref) {
            if (!outcomes.has(ref)) throw Object.assign(new Error(`missing smoke outcome: ${ref}`), { code: "ENOENT" });
            return outcomes.get(ref);
          },
        },
        deriveStageWorkflowRunId: value => `smoke:${value}`,
        publishStageSkillInvocation: fact => { published.push(fact); },
      };
      for (const dependency of prepared.manifest.skills) {
        const fake = path.join(fakeRoot, dependency.name, "SKILL.md");
        fs.mkdirSync(path.dirname(fake), { recursive: true });
        fs.writeFileSync(fake, "MALICIOUS GLOBAL SKILL\n");
        if (dependency.invocation === "conditional") {
          const skipped = await dispatchStageSkill({ packageRoot: root, stage, name: dependency.name, triggered: false, hostInvoke: () => { throw new Error("conditional host invoked while skipped"); }, ...doctorOptions });
          if (skipped.status !== "not_invoked") throw new Error(`${stage}/${dependency.name}: missing not_invoked product`);
        }
        const invocation = await dispatchStageSkill({ packageRoot: root, stage, name: dependency.name, kernel, hostInvoke: value => {
          const definition = fs.readFileSync(value.resolved_skill_path, "utf8");
          if (!definition.trim()) throw new Error(`${stage}/${dependency.name}: empty SKILL.md`);
          if (!value.resolved_skill_path.startsWith(path.join(root, "skills") + path.sep)) throw new Error(`${stage}: dispatch escaped artifact skills root`);
          if (!value.resolved_bundle_paths.every(item => item.startsWith(path.join(root, "skills") + path.sep)) || !/^[a-f0-9]{64}$/.test(value.bundle_hash)) {
            throw new Error(`${stage}: invalid dispatch closure payload`);
          }
          const outcomeRef = `evidence/smoke/${stage}/${dependency.name}.json`;
          const raw = `${JSON.stringify({ schema_version: "smoke-skill-outcome.v1", stage, name: dependency.name, bundle_hash: value.bundle_hash, snapshot_tree: snapshotTree })}\n`;
          outcomes.set(outcomeRef, raw);
          return { outcome_ref: outcomeRef, outcome_hash: crypto.createHash("sha256").update(raw).digest("hex"), snapshot_tree: snapshotTree };
        }, ...doctorOptions });
        if (invocation.status !== "executed" || invocation.snapshot_tree !== snapshotTree
            || published.at(-1) !== invocation) throw new Error(`${stage}/${dependency.name}: unauthenticated smoke outcome`);
        dispatchCount += 1;
        authenticatedOutcomeCount += 1;
      }
      dispatched.push({ stage, dispatch_count: dispatchCount, authenticated_outcome_count: authenticatedOutcomeCount });
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
  // tools/cli is two levels below the package root.  Keep the smoke command
  // pointed at the authoritative workflows/ tree rather than tools/workflows.
  const root = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const result = await smokeLocalSkillDispatch(root);
  console.log(`local skill dispatch smoke: ok (${result.length} stages)`);
}
