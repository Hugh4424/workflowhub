import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { loadStageSkillManifest } from "../../runtime/stage/stage-skill-runtime.mjs";
import { validateSkillBundle } from "../../runtime/adapters/local-skill-resolver.mjs";

// T016: finite, read-only development facts consumed by run-checks and --root
// fixture checks. No Runner dispatch, progress authority, or history scanner.
const STAGES = ["make-decision", "build-plan", "build-code", "verify-code", "build-prd"];
const CATALOG = "skills/catalog.yaml";
const MANIFEST = "skills/wh-review/manifest.json";

export function checkSkillConsistency(root) {
  const failures = [];
  const reports = [];
  const actualStages = new Map();
  const fail = (source, message) => failures.push(`${source}: ${message}`);
  const read = (locator, parse) => {
    if (typeof locator !== "string" || !locator || path.isAbsolute(locator)
        || locator.split(/[\\/]/).includes("..")) throw new Error(`invalid relative locator: ${locator}`);
    return parse(fs.readFileSync(path.join(root, locator), "utf8"));
  };
  let catalog;
  try { catalog = read(CATALOG, yaml.load); }
  catch (error) { fail(CATALOG, error.message); return { failures, reports }; }
  if (!Array.isArray(catalog?.skills)) {
    fail(CATALOG, "current skills must be an array");
    return { failures, reports };
  }
  const registrations = new Map();
  const paths = new Set();
  for (const entry of catalog.skills) {
    if (!entry || typeof entry.name !== "string" || !entry.name) {
      fail(CATALOG, "current registration requires name"); continue;
    }
    if (!/^[a-z][a-z0-9-]*$/.test(entry.name) || entry.path !== `skills/${entry.name}/SKILL.md`)
      fail(CATALOG, `name/path mismatch ${entry.name}: ${entry.path}; expected skills/${entry.name}/SKILL.md`);
    if (registrations.has(entry.name)) fail(CATALOG, `duplicate current registration ${entry.name}`);
    registrations.set(entry.name, entry);
    if (typeof entry.path !== "string" || paths.has(entry.path)) fail(CATALOG, `duplicate/invalid current path ${entry.name}: ${entry.path}`);
    paths.add(entry.path);
  }
  const payloads = new Set();
  function consume(name, locator, source, stage) {
    const expected = `skills/${name}/SKILL.md`;
    if (typeof name !== "string" || !/^[a-z][a-z0-9-]*$/.test(name) || locator !== expected) {
      fail(source, `name/path mismatch ${name}: ${locator}; expected ${expected}`); return;
    }
    const registration = registrations.get(name);
    if (!registration) { fail(source, `${CATALOG} has no current registration for ${name}: ${locator}`); return; }
    if (registration.path !== locator) fail(source, `${CATALOG} path mismatch ${name}: ${registration.path}; expected ${locator}`);
    if (registration.status === "retired") { fail(source, `active reference to retired ${name}: ${locator}`); return; }
    if (!actualStages.has(name)) actualStages.set(name, new Set());
    actualStages.get(name).add(stage);
    if (payloads.has(name)) return;
    payloads.add(name);
    const bundle = `skills/${name}/skill-bundle.json`;
    try { validateSkillBundle(root, bundle, locator); }
    catch (error) { fail(source, `${locator} / ${bundle}: ${error.message}`); }
  }
  for (const stage of STAGES) {
    const source = `workflows/${stage}/skill-deps.yaml`;
    let loaded;
    try { loaded = loadStageSkillManifest(root, stage); }
    catch (error) { fail(source, error.message); continue; }
    for (const dep of loaded.manifest.skills) consume(dep.name, dep.path, source, stage);
  }
  let manifest;
  let plan;
  let planLocator;
  try {
    manifest = read(MANIFEST, JSON.parse);
    planLocator = path.posix.join("skills/wh-review", manifest.stage_skill_plan ?? "");
    if (typeof manifest.stage_skill_plan !== "string" || !manifest.stage_skill_plan
        || path.isAbsolute(manifest.stage_skill_plan) || manifest.stage_skill_plan.split(/[\\/]/).includes("..")) {
      throw new Error(`invalid stage_skill_plan pointer: ${manifest.stage_skill_plan}`);
    }
    plan = read(planLocator, JSON.parse);
  } catch (error) { fail(`${MANIFEST} / ${planLocator ?? "stage_skill_plan"}`, error.message); }
  if (manifest && plan) {
    function required(value, source, label) {
      if (!Array.isArray(value) || value.length === 0) { fail(source, `${label} mandatory required_skills missing`); return null; }
      const seen = new Set();
      for (const name of value) {
        if (seen.has(name)) fail(source, `${label} duplicate required skill ${name}`);
        seen.add(name);
        consume(name, `skills/${name}/SKILL.md`, source, label.split("/")[0]);
      }
      return seen;
    }
    function compare(stage, track, left, right) {
      const label = track ? `${stage}/${track}` : stage;
      const a = required(left, MANIFEST, label);
      const b = required(right, planLocator, label);
      if (!a || !b) return;
      for (const name of new Set([...a, ...b])) {
        if (a.has(name) !== b.has(name)) fail(`${MANIFEST} / ${planLocator}`, `${label} mandatory mismatch ${name}`);
      }
    }
    for (const track of ["direction", "detail"]) compare("make-decision", track,
      manifest.contracts?.["make-decision"]?.required_skills_by_track?.[track],
      plan.stages?.["make-decision"]?.tracks?.[track]?.required_skills);
    for (const stage of ["build-plan", "build-code", "verify-code"]) compare(stage, null,
      manifest.contracts?.[stage]?.required_skills, plan.stages?.[stage]?.required_skills);
    compare("build-prd", null, manifest.contracts?.["build-prd"]?.required_skills,
      plan.non_stage?.build_prd?.required_skills);
  }
  for (const name of registrations.keys()) {
    const stages = actualStages.get(name) ?? new Set();
    const source = registrations.get(name)?.used_by_stages;
    const current = [...stages].sort();
    if (!Array.isArray(source) || JSON.stringify([...new Set(source)].sort()) !== JSON.stringify(current)) {
      reports.push(`${CATALOG} ${name} used_by_stages source=${JSON.stringify(source)} actual=${JSON.stringify(current)}; report-only, not dispatch authority`);
    }
  }
  return { failures, reports };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--root" || !path.isAbsolute(args[1])) {
    console.error("check-skill-consistency: requires --root <absolute package root>");
    process.exitCode = 1;
  } else {
    try {
      const { failures, reports } = checkSkillConsistency(fs.realpathSync(args[1]));
      for (const report of reports) console.log(`[check-skill-consistency] ${report}`);
      for (const failure of failures) console.error(`[check-skill-consistency] FAIL ${failure}`);
      if (!failures.length) console.log("[check-skill-consistency] current declarations consistent; historical registrations inactive");
      process.exitCode = failures.length ? 1 : 0;
    } catch (error) {
      console.error(`[check-skill-consistency] ERROR ${error.message}`);
      process.exitCode = 1;
    }
  }
}
