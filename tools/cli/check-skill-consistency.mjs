import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";
import { loadStageSkillManifest } from "../../runtime/stage/stage-skill-runtime.mjs";
import { validateSkillBundle } from "../../runtime/adapters/local-skill-resolver.mjs";
import { validatePostPhaseContract } from "../../runtime/stage/stage-content-contracts.mjs";

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
  // Source shape is a report-only fact, never proof of identity or permission.
  let validateSource;
  try {
    const schema = JSON.parse(fs.readFileSync(new URL("../../runtime/schemas/skill-bundle.schema.json", import.meta.url), "utf8"));
    validateSource = new Ajv2020({ validateFormats: false, allErrors: true }).compile(schema.properties.sources.items);
  } catch (error) {
    reports.push(`${CATALOG} source schema unavailable: ${error.message}; report-only`);
  }
  for (const entry of catalog.skills) {
    if (!entry || typeof entry !== "object") continue;
    const label = `${CATALOG} ${entry.name ?? "<unnamed>"} upstream source`;
    if (["adapted", "adopted"].includes(entry.status) && (!Array.isArray(entry.upstream) || entry.upstream.length === 0))
      reports.push(`${label}: ${entry.status} registration requires a declared source; report-only`);
    if (entry.upstream !== undefined && !Array.isArray(entry.upstream)) {
      reports.push(`${label}: upstream must be an array; report-only`);
      continue;
    }
    for (const [index, source] of (entry.upstream ?? []).entries()) {
      if (!validateSource) continue; // The explicit schema-unavailable report above covers this gap.
      let projected = source;
      if (source && typeof source === "object" && !Array.isArray(source) && Object.hasOwn(source, "github_url")) {
        // These catalog retrieval/review facts are not bundle-source fields.
        const { github_url, commit_url, skill_url, reviewed_at, review_outcome, ...shape } = source;
        projected = { ...shape, url: github_url };
        if (Object.hasOwn(source, "url"))
          reports.push(`${label}[${index}]: catalog github_url must not be mixed with bundle url; report-only`);
      }
      if (!validateSource(projected))
        reports.push(`${label}[${index}]: ${JSON.stringify(validateSource.errors)}; report-only, shape does not establish authorization or identity`);
    }
  }
  const registrations = new Map();
  const paths = new Set();
  for (const entry of catalog.skills) {
    if (!entry || typeof entry.name !== "string" || !entry.name) {
      fail(CATALOG, "current registration requires name"); continue;
    }
    if (!/^[a-z][a-z0-9-]*$/.test(entry.name) || (entry.status !== "retired" && entry.path !== `skills/${entry.name}/SKILL.md`))
      fail(CATALOG, `name/path mismatch ${entry.name}: ${entry.path}; expected skills/${entry.name}/SKILL.md`);
    if (registrations.has(entry.name)) fail(CATALOG, `duplicate current registration ${entry.name}`);
    registrations.set(entry.name, entry);
    if (entry.status === "retired") continue;
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
    if (registration.status === "retired") { fail(source, `active reference to retired ${name}: ${locator}`); return; }
    if (registration.path !== locator) fail(source, `${CATALOG} path mismatch ${name}: ${registration.path}; expected ${locator}`);
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
  // P2: the existing reports channel serves material authors and run-checks.
  // These are current template inputs, not a second required-section registry.
  // Remove this extension when those consumers retire or a reviewed existing
  // checker takes over; prose completeness remains an independent human task.
  for (const locator of [
    "skills/decision-log/templates/decision-log-template.md",
    "skills/spec-specify/templates/spec-template.md",
    "skills/spec-plan/templates/phase-template.md",
    "skills/spec-plan/templates/index-template.md",
    "skills/spec-prd/templates/prd-template.md",
  ]) {
    const prefix = `material-authoring ${locator}:`;
    try {
      const body = read(locator, value => value);
      // Preserve source lines, but exclude quoted and fenced examples from
      // heading/placeholder diagnostics. Inline code still counts as one unit
      // in the explicitly reference-only sentence figures below.
      let fence = null;
      const lines = body.split(/\r?\n/).map((text, index) => {
        const marker = text.match(/^\s*(`{3,}|~{3,})/);
        if (marker) {
          if (!fence) fence = marker[1];
          else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
          return { line: index + 1, text: "" };
        }
        return { line: index + 1, text: fence || /^\s*>/.test(text) ? "" : text };
      });
      const visible = lines.map(({ text }) => text).join("\n");
      const missing = [];
      if (locator.endsWith("/phase-template.md")) {
        if (!/^##\s+L2\b/m.test(visible)) missing.push("L2");
        const authority = visible.split(/^##\s+L2\b|^###\s+T\d{3,}\b/m, 1)[0];
        if (!/^\s*[-*]\s+\*\*(?:Write set|写入集|写集)\*\*\s*[:：]\s*\S/im.test(authority)) missing.push("写入集");
      }
      if (locator.endsWith("/index-template.md")) {
        // Reuse the production purity condition, including Chinese aliases;
        // unrelated whole-Phase validation errors are not template verdicts.
        // Both index-shape verdicts count: the purity boundary and the missing
        // Execution Index pointer rows. Reporting only the former let an index
        // with no pointer row be reported as structurally present.
        const projection = validatePostPhaseContract({ spec: "Structural report projection only", index: body, phases: {} });
        const indexShapeInvalid = projection.errors.some((error) => /Phase index must remain pointer-only|requires an Execution Index with Phase pointers/.test(error));
        if (!/^##\s+(?:Execution Index|执行索引)\s*$/im.test(visible) || indexShapeInvalid) missing.push("纯指针边界");
      }
      const mechanical = locator.endsWith("/phase-template.md") || locator.endsWith("/index-template.md");
      reports.push(`${prefix} 必留项 ${missing.length ? `缺失 ${missing.join("、")}` : mechanical ? "机器结构在场" : "unknown — 无机器可判声明"}; 散文必留声明 unknown／未覆盖，交独立人读; report-only`);
      const proseLines = [];
      for (const { line, text } of lines) {
        const prose = text.replace(/(`+)(.*?)\1/g, "");
        if (/^\s*#{1,6}\s*$/.test(text) && text.trim()) reports.push(`${prefix} 空标题 line=${line}; report-only`);
        if (/\bTBD\b|待补充|\{\{[^{}]+\}\}/u.test(prose)) reports.push(`${prefix} 占位 line=${line}; report-only`);
        // Headings, table rows and machine field literals are not prose.
        if (/^\s*(?:#|\||[-*]\s+\*\*[^*]+\*\*\s*[:：])/.test(text)) continue;
        proseLines.push(text.replace(/(`+)(.*?)\1/g, "\uE000"));
      }
      const sentenceCounts = proseLines.join("\n").split(/[。！？]/u)
        .map(sentence => (sentence.match(/[\p{Script=Han}]|[A-Za-z0-9]+|\uE000/gu) ?? []).length).filter(count => count > 0);
      reports.push(`${prefix} 句长参考 ${JSON.stringify(sentenceCounts)}; 汉字各1、连续拉丁/数字串1、行内代码1，排除机器字面/引用块/围栏; 校准 TP=unknown FP=unknown 分母=unknown（本检查未接入独立标注；校准见独立原件）；无句长门／评分; report-only`);
    } catch (error) {
      // Only this added read/report capability degrades. Catalog/bundle errors
      // and CLI argument/dependency failures keep their original blocking path.
      reports.push(`${prefix} 必留项 unknown／未覆盖; 原始失败 ${error.code ?? error.name}: ${error.message}; 检测=读取当前模板; 缺失条件=可读模板与可判声明; report-only`);
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
