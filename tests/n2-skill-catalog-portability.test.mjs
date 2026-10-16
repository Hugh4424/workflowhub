import { afterEach, describe, expect, it } from "vitest";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import yaml from "js-yaml";
import { checkSkillConsistency } from "../tools/cli/check-skill-consistency.mjs";

// Build-plan target oracles. Production implementations and existing RED tests
// are outside this file's write set. Human source attribution, license review,
// upstream network checks, and whole-catalog dependency semantics remain manual.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STAGES = ["make-decision", "build-plan", "build-code", "verify-code", "build-prd"];
const SAMPLES = ["ui-project-init", "stage-reflection", "spec-specify"];
const temporary = [];
const read = path => readFileSync(path, "utf8");
const catalog = () => yaml.load(read(join(ROOT, "skills/catalog.yaml")));
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const temp = () => { const root = mkdtempSync(join(tmpdir(), "n2-skill-oracle-")); temporary.push(root); return root; };
afterEach(() => { for (const root of temporary.splice(0)) rmSync(root, { recursive: true, force: true }); });

function put(root, path, bytes) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, typeof bytes === "string" || Buffer.isBuffer(bytes) ? bytes : JSON.stringify(bytes));
}

// Only local repository references are examined. A URL and its visible Markdown
// label are removed together; upstream source paths are not local dependencies.
function localSkillReferences(text) {
  const local = text.replace(/\[[^\]]*\]\(https?:\/\/[^)]+\)/gu, "")
    .replace(/https?:\/\/[^\s<>`]+/gu, "");
  return [...new Set([...local.matchAll(/\bskills\/([a-z][a-z0-9-]*)\/SKILL\.md\b/gu)].map(match => match[1]))];
}

function healthyFixture() {
  const root = temp();
  const entry = { name: "sample", path: "skills/sample/SKILL.md", status: "native", used_by_stages: STAGES, upstream: [], dependency_closure: [] };
  const data = { schema_version: 2, skills: [entry] };
  put(root, "skills/catalog.yaml", yaml.dump(data));
  put(root, "skills/sample/SKILL.md", "---\nname: sample\ndescription: fixture\n---\n\n# Sample\n");
  put(root, "skills/sample/skill-bundle.json", { schema_version: 1, skill: "sample", files: ["SKILL.md"] });
  for (const stage of STAGES) put(root, `workflows/${stage}/skill-deps.yaml`, yaml.dump({ stage, skills: [{ name: "sample", path: entry.path, trigger: "fixture" }] }));
  const required = ["sample"];
  put(root, "skills/wh-review/manifest.json", {
    stage_skill_plan: "stage-skill-plan.json",
    contracts: {
      "make-decision": { required_skills_by_track: { direction: required, detail: required } },
      ...Object.fromEntries(STAGES.filter(stage => stage !== "make-decision").map(stage => [stage, { required_skills: required }])),
    },
  });
  put(root, "skills/wh-review/stage-skill-plan.json", {
    stages: {
      "make-decision": { tracks: { direction: { required_skills: required }, detail: { required_skills: required } } },
      ...Object.fromEntries(["build-plan", "build-code", "verify-code"].map(stage => [stage, { required_skills: required }])),
    },
    non_stage: { build_prd: { required_skills: required } },
  });
  return { root, data, entry };
}

describe("N2 skill catalog portability target oracles", () => {
  it("ORACLE-N2-CATALOG: active paths resolve and retired records retain reasons without dead paths", () => {
    const problems = [];
    for (const entry of catalog().skills) {
      if (entry.status === "retired") {
        if (entry.path && !existsSync(join(ROOT, entry.path))) problems.push(`${entry.name}: retired dead path ${entry.path}`);
        if (existsSync(join(ROOT, "skills", entry.name))) problems.push(`${entry.name}: retired directory still exists`);
        if (!entry.local_changes && !entry.reason && !entry.retirement_reason) problems.push(`${entry.name}: retired reason missing`);
      } else if (!entry.path || !existsSync(join(ROOT, entry.path))) problems.push(`${entry.name}: active path missing ${entry.path}`);
    }
    expect(problems, "catalog paths must guide readers to existing current files").toEqual([]);
  });

  it("ORACLE-N2-CATALOG: each active skill carries its readable catalog name without a second version", () => {
    const problems = [];
    for (const entry of catalog().skills.filter(entry => entry.status !== "retired")) {
      if (!entry.path || !existsSync(join(ROOT, entry.path))) continue; // Path failures have their own oracle above.
      const front = read(join(ROOT, entry.path)).match(/^---\n([\s\S]*?)\n---/u);
      const meta = front ? yaml.load(front[1]) : {};
      if (meta?.name !== entry.name) problems.push(`${entry.name}: header name ${meta?.name}`);
      if (Object.hasOwn(meta ?? {}, "version")) problems.push(`${entry.name}: duplicate header version`);
    }
    expect(problems, "catalog owns names/versions; portable body retains one readable identifier").toEqual([]);
  });

  it("ORACLE-N2-SOURCES: adopted registrations identify adopted content and preserve local authorization", () => {
    const problems = [];
    for (const entry of catalog().skills) {
      if (["adapted", "adopted"].includes(entry.status) && !entry.upstream?.length) problems.push(`${entry.name}: ${entry.status} with no source`);
      for (const source of entry.upstream ?? []) {
        if (source.github_url && (!Array.isArray(source.adopted) || !source.adopted.length)) problems.push(`${entry.name}: github source omits adopted content`);
        if (source.kind === "user-provided-local-source" && !source.authorization_basis) problems.push(`${entry.name}: local authorization missing`);
      }
    }
    expect(problems, "a source pin alone cannot explain which content was adopted").toEqual([]);
  });

  it("ORACLE-N2-DEPENDENCIES: declared dependencies are other existing skills and sample body references agree", () => {
    const data = catalog();
    const problems = [];
    for (const entry of data.skills) {
      for (const dependency of entry.dependency_closure ?? []) {
        if (dependency === `skills/${entry.name}`) problems.push(`${entry.name}: self dependency`);
        if (!existsSync(join(ROOT, dependency, "SKILL.md"))) problems.push(`${entry.name}: missing dependency ${dependency}`);
      }
      if (!SAMPLES.includes(entry.name) || !entry.path || !existsSync(join(ROOT, entry.path))) continue;
      for (const name of localSkillReferences(read(join(ROOT, entry.path))).filter(name => name !== entry.name)) {
        if (!(entry.dependency_closure ?? []).includes(`skills/${name}`)) problems.push(`${entry.name}: body dependency ${name} unregistered`);
      }
    }
    expect(problems, "no self/dead dependencies and no undeclared sample cross-skill paths").toEqual([]);
  });

  it("ORACLE-N2-PORTABILITY: single-directory sample copies retain payload and disclose absent local dependencies", () => {
    const target = temp();
    const data = catalog();
    const problems = [];
    for (const name of SAMPLES) {
      const dest = join(target, name);
      cpSync(join(ROOT, "skills", name), dest, { recursive: true });
      const body = read(join(dest, "SKILL.md"));
      const entry = data.skills.find(entry => entry.name === name);
      const bundle = JSON.parse(read(join(dest, "skill-bundle.json")));
      for (const payload of bundle.files) {
        const relative = typeof payload === "string" ? payload : payload.path;
        if (!existsSync(join(dest, relative))) problems.push(`${name}: missing copied resource ${relative}`);
      }
      // A repository dependency declaration must be explicit in the body, not
      // merely present in the catalog that was deliberately not copied.
      const dependencyText = body.split(/\n(?=#{1,3} )/u).filter(section => /^#{1,3} .*?(?:依赖|Dependencies)/iu.test(section)).join("\n");
      for (const dependency of localSkillReferences(body).filter(dependency => dependency !== name)) {
        if (!dependencyText.includes(dependency) || !entry.dependency_closure?.includes(`skills/${dependency}`)) problems.push(`${name}: absent ${dependency} not explicitly disclosed in body and catalog`);
      }
    }
    expect(problems, "single-skill copies must expose missing local dependencies rather than imply self-sufficiency").toEqual([]);
  });

  it("ORACLE-N2-REPORTONLY: missing adopted source is reported without changing healthy failures or CLI exit", () => {
    const { root, data, entry } = healthyFixture();
    expect(checkSkillConsistency(root).failures, "fixture must be healthy before the target mutation").toEqual([]);
    entry.status = "adapted";
    put(root, "skills/catalog.yaml", yaml.dump(data));
    const result = checkSkillConsistency(root);
    expect(result.failures, "source diagnostics must not become dispatch failures").toEqual([]);
    expect(result.reports.some(report => /sample/u.test(report) && /(?:upstream|来源|source)/iu.test(report)), "adapted without a source must be visible in reports").toBe(true);
    const cli = spawnSync(process.execPath, [join(ROOT, "tools/cli/check-skill-consistency.mjs"), "--root", root], { encoding: "utf8" });
    expect(cli.status, cli.stderr).toBe(0);
    expect(cli.stdout).toMatch(/sample/u);
  });

  it("ORACLE-N2-REPORTONLY: empty adopted content surfaces as a report while retaining exit zero", () => {
    const { root, data, entry } = healthyFixture();
    entry.status = "adapted";
    entry.upstream = [{ github_url: "https://github.com/example/sample", path: "SKILL.md", commit: "a".repeat(40), license: "MIT", adopted: ["SKILL.md"] }];
    put(root, "skills/catalog.yaml", yaml.dump(data));
    const before = checkSkillConsistency(root);
    expect(before.failures).toEqual([]);
    expect(before.reports, "legal adapted source must start without source diagnostics").toEqual([]);
    entry.upstream[0].adopted = [];
    put(root, "skills/catalog.yaml", yaml.dump(data));
    const after = checkSkillConsistency(root);
    expect(after.failures).toEqual([]);
    expect(after.reports.length, "an empty adopted-content declaration must add a diagnostic").toBeGreaterThan(before.reports.length);
    expect(after.reports.some(report => /sample/u.test(report) && /(?:adopted|采用|来源|source)/iu.test(report))).toBe(true);
    const cli = spawnSync(process.execPath, [join(ROOT, "tools/cli/check-skill-consistency.mjs"), "--root", root], { encoding: "utf8" });
    expect(cli.status, cli.stderr).toBe(0);
  });
});
