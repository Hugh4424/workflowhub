import fs from "node:fs";
import { createHash } from "node:crypto";
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
  const emptySource = catalog == null || (Array.isArray(catalog.skills) && catalog.skills.length === 0
    && (catalog.capability_decisions === undefined || (Array.isArray(catalog.capability_decisions) && catalog.capability_decisions.length === 0)));
  if (emptySource) {
    reports.push("source-registry 没有来源输入，未检查; report-only");
    catalog ??= { skills: [], capability_decisions: [] };
  }
  if (!Array.isArray(catalog?.skills)) {
    fail(CATALOG, "current skills must be an array");
    return { failures, reports };
  }
  if (!emptySource) {
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
    // N10: the existing reports channel is the sole source-registry consumer.
    // Findings describe local declarations; they confer no license or review pass.
    const sourceReport = message => reports.push(`source-registry ${message}; report-only`);
    const present = value => typeof value === "string" && value.trim() !== "";
    const isHonestUnknown = value => value == null || value === "" || /^(?:unresolved(?:-.*)?|unknown|local)$/u.test(value);
    const validCommit = value => /^[a-f0-9]{40}$/u.test(value ?? "") || isHonestUnknown(value);
    const localFile = locator => {
      if (!present(locator) || path.isAbsolute(locator) || locator.split(/[\\/]/u).includes(".."))
        throw new Error(`invalid relative source path: ${locator}`);
      return path.join(root, locator);
    };
    const sourceStart = reports.length;
    try {
      const adopted = catalog.skills.filter(entry => ["adapted", "adopted"].includes(entry?.status));
      let notice = "";
      let noticeError = null;
      try { notice = read("THIRD_PARTY_NOTICES.md", String); if (!notice.trim()) noticeError = "empty"; }
      catch (error) { noticeError = error.code ?? error.message; }
      if (noticeError) sourceReport(`notice unavailable ${noticeError}`);
      let upstreamAdopted = 0;
      let vendored = 0;
      for (const entry of adopted) {
        if (!Array.isArray(entry.upstream) || entry.upstream.length === 0) sourceReport(`${entry.name} requires a declared source`);
        if (noticeError) sourceReport(`notice coverage missing ${entry.name}: notice unavailable`);
        for (const [i, upstream] of (Array.isArray(entry.upstream) ? entry.upstream : []).entries()) {
          const label = `${entry.name} upstream[${i}]`;
          if (!upstream || typeof upstream !== "object") { sourceReport(`${label} source missing`); continue; }
          if (!present(upstream.license)) sourceReport(`${label} license missing`);
          if (upstream.kind === "user-provided-local-source") {
            for (const key of ["path", "authorization_basis"]) if (!present(upstream[key])) sourceReport(`${label} ${key} missing`);
          } else {
            if (!present(upstream.path) && !present(upstream.github_url)) sourceReport(`${label} coordinate missing`);
            if (!validCommit(upstream.commit)) sourceReport(`${label} commit invalid: ${upstream.commit}`);
            const project = Object.values(catalog.projects ?? {}).find(project => project.github_url === upstream.github_url);
            if (/^[a-f0-9]{40}$/u.test(project?.commit ?? "") && /^[a-f0-9]{40}$/u.test(upstream.commit ?? "") && project.commit !== upstream.commit)
              sourceReport(`pinned version mismatch ${label}: expected=${project.commit} actual=${upstream.commit}`);
          }
          if (Array.isArray(upstream.adopted) && upstream.adopted.length) {
            upstreamAdopted += 1;
            const slug = upstream.github_url?.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/?$/u)?.[1];
            const coordinates = [entry.name, entry.path, upstream.path, slug, /^[a-f0-9]{40}$/u.test(upstream.commit ?? "") ? upstream.commit : null];
            if (!noticeError && !coordinates.some(value => present(value) && notice.includes(value)))
              sourceReport(`notice coverage missing ${entry.name} ${upstream.path}`);
          }
        }
      }
      // A content hash is declared only for genuinely vendored bytes; no broad hashing.
      for (const entry of catalog.skills) for (const upstream of (Array.isArray(entry?.upstream) ? entry.upstream : [])) {
        if (typeof upstream?.content_sha256 !== "string") continue;
        vendored += 1;
        const locator = `skills/${entry.name}/${upstream.path}`;
        try {
          // Validate the unprefixed path as well, so an absolute upstream is rejected.
          localFile(upstream.path);
          const actual = createHash("sha256").update(fs.readFileSync(localFile(locator))).digest("hex");
          if (actual !== upstream.content_sha256) sourceReport(`vendored sha256 mismatch ${locator}: expected=${upstream.content_sha256} actual=${actual}`);
        } catch (error) { sourceReport(`vendored file missing ${locator}: ${error.code ?? error.message}`); }
      }
      const decisions = catalog.capability_decisions;
      const statuses = { absorbed: 0, rejected: 0, watch: 0 };
      if (!Array.isArray(decisions)) sourceReport("capability_decisions missing/not an array");
      for (const decision of (Array.isArray(decisions) ? decisions : [])) {
        const name = decision?.name ?? "<unnamed>";
        if (!present(decision?.name)) sourceReport("capability decision name missing");
        if (!Object.hasOwn(statuses, decision?.status)) sourceReport(`${name} status=${decision?.status}`);
        else statuses[decision.status] += 1;
        if (!Array.isArray(decision?.used_by_stages)) sourceReport(`${name} used_by_stages missing/not an array`);
        else for (const stage of decision.used_by_stages) if (!STAGES.includes(stage)) sourceReport(`${name} used_by_stages unknown ${stage}`);
        if (decision?.status === "absorbed" && !present(decision.local_path)) sourceReport(`local_path missing ${name}: absorbed requires a local consumer`);
        if (present(decision?.local_path)) for (const locator of decision.local_path.split(";").map(value => value.trim())) {
          try { if (!fs.existsSync(localFile(locator))) sourceReport(`local_path missing ${name}: ${locator}`); }
          catch (error) { sourceReport(`local_path missing ${name}: ${locator}: ${error.message}`); }
        }
        if (!Array.isArray(decision?.upstream) || !decision.upstream.length) sourceReport(`${name} upstream missing`);
        for (const upstream of (Array.isArray(decision?.upstream) ? decision.upstream : [])) {
          if (!present(upstream?.license)) sourceReport(`${name} upstream license missing`);
          if (upstream?.kind === "user-provided-local-source") {
            if (!present(upstream.authorization_basis)) sourceReport(`${name} authorization_basis missing`);
          } else {
            if (!present(upstream?.path) && !present(upstream?.github_url)) sourceReport(`${name} upstream coordinate missing`);
            if (!validCommit(upstream?.commit)) sourceReport(`${name} upstream commit invalid: ${upstream?.commit}`);
          }
        }
        const outcomes = [decision?.review_outcome, ...(decision?.upstream ?? []).map(upstream => upstream?.review_outcome)].join(" ");
        if (["watch", "rejected"].includes(decision?.status) || /accepted_with|unverified/u.test(outcomes)) {
          if (!present(decision.local_changes) && !present(decision.update_policy)) sourceReport(`${name} exemption reason missing`);
        }
      }
      let registryLinks = 0;
      try {
        const registry = read("skills/reuse-registry.md", String);
        for (const match of registry.matchAll(/\]\(([^)]+)\)/gu)) {
          const target = match[1];
          if (/^(?:https?:|<|#)/u.test(target)) continue;
          registryLinks += 1;
          const locator = target.split("#")[0];
          // Registry links may legitimately navigate to ../workflows within root.
          const resolved = path.resolve(root, "skills", locator);
          if (path.relative(root, resolved).startsWith("..") || !fs.existsSync(resolved)) sourceReport(`reuse-registry link missing: ${target}`);
        }
        for (const entry of catalog.skills.filter(entry => entry?.status === "retired")) {
          if (new RegExp(`\\b${entry.name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\b`, "u").test(registry)) sourceReport(`reuse-registry references retired ${entry.name}`);
        }
      } catch (error) { sourceReport(`reuse-registry unavailable ${error.code ?? error.message}`); }
      let bundles = 0; let withSources = 0; let pointers = 0; let sourceCount = 0;
      const names = new Set(catalog.skills.map(entry => entry?.name));
      for (const directory of fs.readdirSync(path.join(root, "skills"), { withFileTypes: true })) {
        if (!directory.isDirectory()) continue;
        const locator = `skills/${directory.name}/skill-bundle.json`;
        if (!fs.existsSync(path.join(root, locator))) continue;
        bundles += 1;
        try {
          const bundle = read(locator, JSON.parse);
          if (!Array.isArray(bundle.sources) || !bundle.sources.length) continue;
          withSources += 1;
          for (const source of bundle.sources) {
            sourceCount += 1;
            const anchor = source?.path?.match(/^\.\.\/catalog\.yaml#skills\.([a-z0-9-]+)$/u)?.[1];
            if (!anchor) continue;
            pointers += 1;
            if (!names.has(anchor)) sourceReport(`bundle.sources anchor missing ${locator}: ${anchor}`);
          }
        } catch (error) { sourceReport(`bundle.sources unavailable ${locator}: ${error.code ?? error.message}`); }
      }
      const count = reports.length - sourceStart;
      sourceReport(`bundle.sources ${pointers}/${sourceCount} self-referential catalog pointers; no dereferencer/reader`);
      sourceReport(`summary skills=${catalog.skills.length} adopted=${adopted.length} upstream_adopted=${upstreamAdopted} notice=${noticeError ? "unavailable" : "present"} decisions=${Array.isArray(decisions) ? decisions.length : 0} statuses=${statuses.absorbed}/${statuses.rejected}/${statuses.watch} registry_links=${registryLinks} vendored=${vendored} bundles=${bundles}/${withSources} findings=${count}`);
    } catch (error) { sourceReport(`来源段不可用: ${error.code ?? error.message}`); }
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
      if (!Array.isArray(value) || (!emptySource && value.length === 0)) { fail(source, `${label} mandatory required_skills missing`); return null; }
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
      let indexUnknown = false;
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
        const section = visible.split(/^##\s+(?:Execution Index|执行索引)\s*$/im)[1]?.split(/^##\s/m)[0];
        const rows = section?.split(/\r?\n/).filter(line => /^\s*\|/.test(line)) ?? [];
        const hasData = rows.slice(1).some(line => !/^\s*\|\s*:?-{2,}/.test(line));
        const impure = projection.errors.some(error => /Phase index must remain pointer-only/.test(error));
        if (!section || !hasData || impure) missing.push("纯指针边界");
        else indexUnknown = projection.errors.some(error => /requires an Execution Index with Phase pointers/.test(error));
      }
      const mechanical = locator.endsWith("/phase-template.md") || locator.endsWith("/index-template.md");
      reports.push(`${prefix} 必留项 ${missing.length ? `缺失 ${missing.join("、")}` : indexUnknown ? "unknown — Execution Index 有表行但占位未判定" : mechanical ? "机器结构在场" : "unknown — 无机器可判声明"}; 散文必留声明 unknown／未覆盖，交独立人读; report-only`);
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
    console.error(`check-skill-consistency: requires --root <absolute package root>; received: ${args.join(" ") || "none"}`);
    process.exitCode = 1;
  } else {
    try {
      const { failures, reports } = checkSkillConsistency(fs.realpathSync(args[1]));
      for (const report of reports) console.log(`[check-skill-consistency] ${report}`);
      for (const failure of failures) console.error(`[check-skill-consistency] FAIL ${failure}`);
      if (!failures.length && !reports.some(report => report.includes("没有来源输入"))) console.log("[check-skill-consistency] current declarations consistent; historical registrations inactive");
      process.exitCode = failures.length ? 1 : 0;
    } catch (error) {
      console.error(`check-skill-consistency: cannot read root ${args[1]}: ${error.code ?? error.message}; expected an existing absolute directory`);
      process.exitCode = 1;
    }
  }
}
