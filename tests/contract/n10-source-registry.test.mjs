import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import yaml from "js-yaml";
import { checkSkillConsistency } from "../../tools/cli/check-skill-consistency.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const STAGES = ["make-decision", "build-plan", "build-code", "verify-code", "build-prd"];
const PIN = "a".repeat(40);
const SNAPSHOT = "1f0f9c3bac03c4297f6fc8f7644fa412eda57085";
const roots = [];
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const sourceLines = reports => reports.filter(line => line.startsWith("source-registry "));
const findings = reports => sourceLines(reports).filter(line => !line.startsWith("source-registry summary ") && !line.includes("self-referential catalog pointers"));
const read = (root, file) => readFileSync(join(root, file));
const put = (root, file, bytes) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), bytes); };
const saveCatalog = f => put(f.root, "skills/catalog.yaml", yaml.dump(f.catalog));
const runChecker = root => spawnSync(process.execPath, ["tools/cli/check-skill-consistency.mjs", "--root", root], { cwd: ROOT, encoding: "utf8" });
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function sourceFixture() {
  const root = mkdtempSync(join(tmpdir(), "n10-source-")); roots.push(root);
  const script = "export const fixture = 1;\n";
  const upstream = { github_url: "https://github.com/example/source", commit: PIN, license: "MIT", path: "scripts/sample.mjs", adopted: ["sample behavior"], content_sha256: hash(script) };
  const entry = { name: "sample", path: "skills/sample/SKILL.md", status: "adapted", used_by_stages: STAGES, upstream: [upstream] };
  const decision = { name: "sample-use", status: "absorbed", local_path: "skills/sample/SKILL.md", used_by_stages: ["verify-code"], upstream: [{ github_url: upstream.github_url, commit: PIN, path: "SKILL.md", license: "MIT" }] };
  const catalog = { projects: { sample: { github_url: upstream.github_url, commit: PIN } }, skills: [entry, { name: "debate", status: "retired", retirement_reason: "fixture retirement" }], capability_decisions: [decision] };
  const f = { root, catalog, entry, decision, upstream };
  saveCatalog(f);
  put(root, "skills/sample/SKILL.md", "# Sample\n");
  put(root, "skills/sample/scripts/sample.mjs", script);
  put(root, "skills/sample/skill-bundle.json", JSON.stringify({ schema_version: 1, skill: "sample", files: ["SKILL.md"], sources: [{ path: "../catalog.yaml#skills.sample" }] }));
  put(root, "THIRD_PARTY_NOTICES.md", "# Notices\nMIT example/source\n");
  put(root, "skills/reuse-registry.md", "[sample](sample/SKILL.md)\n");
  for (const stage of STAGES) put(root, `workflows/${stage}/skill-deps.yaml`, yaml.dump({ stage, skills: [{ name: "sample", path: entry.path, trigger: "fixture" }] }));
  const required = ["sample"];
  put(root, "skills/wh-review/manifest.json", JSON.stringify({ stage_skill_plan: "stage-skill-plan.json", contracts: { "make-decision": { required_skills_by_track: { direction: required, detail: required } }, ...Object.fromEntries(STAGES.filter(s => s !== "make-decision").map(s => [s, { required_skills: required }])) } }));
  put(root, "skills/wh-review/stage-skill-plan.json", JSON.stringify({ stages: { "make-decision": { tracks: { direction: { required_skills: required }, detail: { required_skills: required } } }, ...Object.fromEntries(STAGES.filter(s => !["make-decision", "build-prd"].includes(s)).map(s => [s, { required_skills: required }])) }, non_stage: { build_prd: { required_skills: required } } }));
  return f;
}

// TCR-P2-003: zero source is legal only when the other declarations are legal
// and contain no active references. The original sourceFixture is not that case.
function emptySourceFixture(content = "skills: []\n") {
  const f = sourceFixture();
  put(f.root, "skills/catalog.yaml", content);
  for (const stage of STAGES) put(f.root, `workflows/${stage}/skill-deps.yaml`, yaml.dump({ stage, skills: [] }));
  const clearArrays = value => Array.isArray(value) ? [] : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clearArrays(child)])) : value;
  for (const file of ["skills/wh-review/manifest.json", "skills/wh-review/stage-skill-plan.json"])
    put(f.root, file, JSON.stringify(clearArrays(JSON.parse(read(f.root, file)))));
  return f;
}

function assertEmptySourceViolation(f, file, mutate, expected) {
  const original = read(f.root, file);
  const baseline = runChecker(f.root);
  expect(baseline.status, baseline.stderr).toBe(0);
  expect(baseline.stdout).toContain("没有来源输入，未检查");
  expect(baseline.stdout).not.toContain("current declarations consistent");
  mutate(original);
  const broken = runChecker(f.root);
  expect(broken.status, broken.stderr).toBe(1);
  expect(broken.stderr).toMatch(expected);
  put(f.root, file, original);
  expect(read(f.root, file).equals(original)).toBe(true);
  expect(hash(read(f.root, file))).toBe(hash(original));
  const restored = runChecker(f.root);
  expect(restored.status, restored.stderr).toBe(0);
  expect(restored.stdout).toContain("没有来源输入，未检查");
  expect(restored.stdout).not.toContain("current declarations consistent");
}

function assertRestored(f, file, mutate, expected, expectedExit = 0) {
  const bytes = read(f.root, file);
  const before = checkSkillConsistency(f.root);
  expect(before.failures).toEqual([]);
  expect(findings(before.reports)).toEqual([]);
  mutate(bytes);
  const result = checkSkillConsistency(f.root);
  const cli = runChecker(f.root);
  expect(cli.status, cli.stderr).toBe(expectedExit);
  expect([...result.reports, ...result.failures].join("\n")).toMatch(expected);
  put(f.root, file, bytes);
  expect(read(f.root, file).equals(bytes)).toBe(true);
  expect(hash(read(f.root, file))).toBe(hash(bytes));
  const restored = checkSkillConsistency(f.root);
  expect(findings(restored.reports)).toEqual([]);
  expect(restored.failures).toEqual([]);
  expect(runChecker(f.root).status).toBe(0);
}

describe("ORACLE-N10-SOURCE-REGISTRY", () => {
  it("[AC-SOURCE-1] real repository has one honest source summary, one bundle information line and zero findings", () => {
    const result = checkSkillConsistency(ROOT);
    expect(result.failures).toEqual([]);
    expect(findings(result.reports)).toEqual([]);
    expect(sourceLines(result.reports).filter(line => line.startsWith("source-registry summary "))).toHaveLength(1);
    expect(sourceLines(result.reports).find(line => line.startsWith("source-registry summary "))).toMatch(/findings=0; report-only$/u);
    expect(sourceLines(result.reports).filter(line => line.includes("self-referential catalog pointers"))).toHaveLength(1);
    for (const line of sourceLines(result.reports)) expect(line).toMatch(/; report-only$/u);
    expect(runChecker(ROOT).status).toBe(0);
  });

  it.each([
    ["declared source", f => { delete f.entry.upstream; }, /sample.*requires a declared source/u],
    ["pin", f => { f.upstream.commit = "b".repeat(40); }, /pinned version mismatch sample.*expected=a{40} actual=b{40}/u],
    ["license", f => { delete f.upstream.license; }, /sample.*license missing/u],
  ])("[AC-SOURCE-2] catalog %s violation is named and byte restoration clears it", (_name, change, expected) => {
    const f = sourceFixture();
    assertRestored(f, "skills/catalog.yaml", () => { change(f); saveCatalog(f); }, expected);
  });

  it("[AC-SOURCE-2] deleted notice reports unavailable and one missing outlet per skill then restores", () => {
    const f = sourceFixture();
    assertRestored(f, "THIRD_PARTY_NOTICES.md", () => rmSync(join(f.root, "THIRD_PARTY_NOTICES.md")), /notice unavailable ENOENT/u);
    const bytes = read(f.root, "THIRD_PARTY_NOTICES.md");
    put(f.root, "THIRD_PARTY_NOTICES.md", "");
    const lines = sourceLines(checkSkillConsistency(f.root).reports);
    expect(lines.filter(line => /notice coverage missing sample/u.test(line))).toHaveLength(1);
    expect(lines.join("\n")).toContain("notice unavailable");
    put(f.root, "THIRD_PARTY_NOTICES.md", bytes);
    expect(findings(checkSkillConsistency(f.root).reports)).toEqual([]);
  });

  it("[AC-SOURCE-2] vendor one-byte drift reports both hashes and clears after byte restoration", () => {
    const f = sourceFixture();
    assertRestored(f, "skills/sample/scripts/sample.mjs", bytes => put(f.root, "skills/sample/scripts/sample.mjs", Buffer.concat([bytes, Buffer.from("x")])), /vendored sha256 mismatch.*expected=[a-f0-9]{64} actual=[a-f0-9]{64}/u);
  });

  it("[AC-SOURCE-2] active retired debate dependency retains the existing hard failure", () => {
    const f = sourceFixture();
    assertRestored(f, "workflows/build-code/skill-deps.yaml", bytes => { const data = yaml.load(bytes.toString()); data.skills.push({ name: "debate", path: "skills/debate/SKILL.md", trigger: "fixture" }); put(f.root, "workflows/build-code/skill-deps.yaml", yaml.dump(data)); }, /active reference to retired debate/u, 1);
  });

  it.each([
    ["status", f => { f.decision.status = "orphan"; }, /sample-use.*status=orphan/u],
    ["local path", f => { f.decision.local_path = "skills/missing/SKILL.md"; }, /local_path missing sample-use.*skills\/missing/u],
    ["stage", f => { f.decision.used_by_stages.push("unknown-stage"); }, /sample-use.*unknown-stage/u],
    ["exemption reason", f => { f.decision.status = "watch"; }, /sample-use.*exemption reason missing/u],
  ])("[AC-SOURCE-4] decision %s mutation is named and restored", (_name, change, expected) => {
    const f = sourceFixture(); assertRestored(f, "skills/catalog.yaml", () => { change(f); saveCatalog(f); }, expected);
  });

  it("[AC-SOURCE-4] honest unknown and watch with no local path retain reasons without inventing adoption", () => {
    const f = sourceFixture(); f.decision.status = "watch"; f.decision.local_path = ""; f.decision.local_changes = "Not adopted; consumer-only observation."; f.decision.upstream[0].commit = "unresolved-pstack-content-snapshot"; saveCatalog(f);
    expect(findings(checkSkillConsistency(f.root).reports)).toEqual([]);
  });

  it.each([
    ["broken registry", "skills/reuse-registry.md", f => put(f.root, "skills/reuse-registry.md", "[missing](missing/SKILL.md)\n"), /reuse-registry link missing: missing\/SKILL.md/u],
    ["retired registry", "skills/reuse-registry.md", f => put(f.root, "skills/reuse-registry.md", "retired debate\n"), /reuse-registry references retired debate/u],
    ["bundle anchor", "skills/sample/skill-bundle.json", f => put(f.root, "skills/sample/skill-bundle.json", JSON.stringify({ schema_version: 1, skill: "sample", files: ["SKILL.md"], sources: [{ path: "../catalog.yaml#skills.missing" }] })), /bundle.sources anchor missing.*missing/u],
  ])("[AC-SOURCE-4] %s mutation reports and restores", (_name, file, change, expected) => {
    const f = sourceFixture(); assertRestored(f, file, () => change(f), expected);
  });

  it.each(["", "# empty source\n", "skills: []\n"])("[AC-SOURCE-3] empty catalog %j is not a passed check", content => {
    const f = emptySourceFixture(content);
    const cli = runChecker(f.root); expect(cli.status, cli.stderr).toBe(0);
    expect(cli.stdout).toContain("没有来源输入，未检查"); expect(cli.stdout).not.toContain("current declarations consistent");
  });

  it.each(["", "# empty source\n", "skills: []\n"])("[AC-SOURCE-3] empty catalog %j still rejects an active unregistered stage dependency and restores", content => {
    const f = emptySourceFixture(content);
    assertEmptySourceViolation(f, "workflows/build-code/skill-deps.yaml", () => put(f.root, "workflows/build-code/skill-deps.yaml", yaml.dump({ stage: "build-code", skills: [{ name: "sample", path: "skills/sample/SKILL.md", trigger: "fixture" }] })), /has no current registration for sample/u);
  });

  it.each([
    ["missing manifest", f => rmSync(join(f.root, "skills/wh-review/manifest.json")), /manifest\.json.*ENOENT/u],
    ["malformed manifest", f => put(f.root, "skills/wh-review/manifest.json", "{"), /manifest\.json.*(?:JSON|property)/u],
    ["invalid plan pointer", f => { const m = JSON.parse(read(f.root, "skills/wh-review/manifest.json")); m.stage_skill_plan = "../outside.json"; put(f.root, "skills/wh-review/manifest.json", JSON.stringify(m)); }, /invalid stage_skill_plan pointer/u],
    ["missing required field", f => { const m = JSON.parse(read(f.root, "skills/wh-review/manifest.json")); delete m.contracts["build-code"].required_skills; put(f.root, "skills/wh-review/manifest.json", JSON.stringify(m)); }, /build-code mandatory required_skills missing/u],
    ["nonarray required field", f => { const m = JSON.parse(read(f.root, "skills/wh-review/manifest.json")); m.contracts["build-code"].required_skills = "sample"; put(f.root, "skills/wh-review/manifest.json", JSON.stringify(m)); }, /build-code mandatory required_skills missing/u],
    ["unregistered required reference", f => { const m = JSON.parse(read(f.root, "skills/wh-review/manifest.json")); m.contracts["build-code"].required_skills = ["sample"]; put(f.root, "skills/wh-review/manifest.json", JSON.stringify(m)); }, /has no current registration for sample/u],
    ["duplicate required reference", f => { const m = JSON.parse(read(f.root, "skills/wh-review/manifest.json")); m.contracts["build-code"].required_skills = ["sample", "sample"]; put(f.root, "skills/wh-review/manifest.json", JSON.stringify(m)); }, /build-code duplicate required skill sample/u],
    ["required set mismatch", f => { const m = JSON.parse(read(f.root, "skills/wh-review/manifest.json")); m.contracts["build-code"].required_skills = ["sample"]; put(f.root, "skills/wh-review/manifest.json", JSON.stringify(m)); }, /build-code mandatory mismatch sample/u],
    ["invalid required name", f => { const m = JSON.parse(read(f.root, "skills/wh-review/manifest.json")); m.contracts["build-code"].required_skills = ["../sample"]; put(f.root, "skills/wh-review/manifest.json", JSON.stringify(m)); }, /name\/path mismatch \.\.\/sample/u],
  ])("[AC-SOURCE-3] empty source retains %s failure and byte restoration", (_name, change, expected) => {
    const f = emptySourceFixture();
    assertEmptySourceViolation(f, "skills/wh-review/manifest.json", () => change(f), expected);
  });

  it("[AC-SOURCE-3] missing or malformed catalog remains exit one; nonempty decisions are not zero input", () => {
    const f = sourceFixture(); rmSync(join(f.root, "skills/catalog.yaml")); let cli = runChecker(f.root);
    expect(cli.status).toBe(1); expect(cli.stderr).toContain("skills/catalog.yaml");
    put(f.root, "skills/catalog.yaml", "skills: [\n"); expect(runChecker(f.root).status).toBe(1);
    f.catalog.skills = []; saveCatalog(f); cli = runChecker(f.root);
    expect(cli.stdout).not.toContain("没有来源输入"); expect(cli.status).toBe(1);
  });

  it("[AC-SOURCE-4] T009 data binds the chosen snapshot and honest fixed figure bytes uniquely", () => {
    const catalog = yaml.load(read(ROOT, "skills/catalog.yaml").toString());
    const decisions = catalog.capability_decisions;
    const figure = decisions.filter(d => d.name === "figure-it-out"); expect(figure).toHaveLength(1);
    expect(figure[0]).toMatchObject({ status: "absorbed", used_by_stages: ["verify-code"], local_path: "workflows/verify-code/SKILL.md; skills/stage-reflection/SKILL.md" });
    expect(figure[0].upstream[0]).toMatchObject({ commit: "unresolved-pstack-content-snapshot", license: "MIT", path: "skills/figure-it-out/SKILL.md" });
    expect(figure[0].local_changes).toContain("d9574cc24929773d5c23f40626ae1e09660afddd7de48e08dd6494d9fff9bbf0");
    const swarm = decisions.filter(d => d.name === "swarm"); expect(swarm).toHaveLength(1); expect(swarm[0]).toMatchObject({ status: "watch", used_by_stages: [] });
    expect(swarm[0].local_changes).toContain("63e724b308f355f9940fa6753a6fa728d7c5c0df2104742fa1000019e11b17cd");
    expect(decisions.filter(d => d.name === "n3-setup-ts-deep-modules")).toHaveLength(1);
    const reflection = catalog.skills.find(s => s.name === "stage-reflection");
    for (const [p, expectedHash] of [["skills/correct/SKILL.md", "bf482bacc972b3f124a4af8bf9364b4b3e280cb5845e44c326ea4f4565e5c904"], ["skills/principle-encode-lessons-in-structure/SKILL.md", "228963799189f481827d6f28065f278bc2008ffa37030b1234cbd5814d36b9e9"]]) {
      const u = reflection.upstream.find(u => u.path === p); expect(u.commit).toBe(SNAPSHOT); expect(u.commit_url).toContain(SNAPSHOT); expect(u.skill_url).toContain(SNAPSHOT); expect(read(ROOT, "skills/catalog.yaml").toString()).toContain(expectedHash);
    }
    const vendor = catalog.skills.find(s => s.name === "anysearch").upstream.find(u => u.path === "scripts/anysearch_cli.js");
    expect(vendor.content_sha256).toBe("2f94ff9aa2091234ac225bfe8f16e02a148eba141b49921a8740c2d36ff4e980");
    expect(hash(read(ROOT, "skills/anysearch/scripts/anysearch_cli.js"))).toBe(vendor.content_sha256);
    const poteto = decisions.find(d => d.name === "n6-technical-sketch"); expect(poteto.upstream[0].commit).toBe("unresolved-pstack-content-snapshot");
    const notices = read(ROOT, "THIRD_PARTY_NOTICES.md").toString(); for (const name of ["figure-it-out", "correct", "encode-lessons-in-structure"]) expect(notices).toContain(name);
    expect(read(ROOT, "skills/reuse-registry.md").toString()).toContain("N10有限检查来源");
    for (const d of [figure[0], swarm[0]]) for (const p of d.local_path.split(";").map(p => p.trim())) expect(existsSync(join(ROOT, p)), p).toBe(true);
  });

  it("[AC-SOURCE-5] aggregate consumes source facts without changing public exit zero", () => {
    const env = { ...process.env }; delete env.RUN_CHECKS_FORCE_FAIL_CHECKER;
    const cli = spawnSync(process.execPath, ["tools/cli/run-checks.mjs"], { cwd: ROOT, env, encoding: "utf8", timeout: 30_000, maxBuffer: 8 * 1024 * 1024 });
    expect(cli.status, cli.stderr).toBe(0); expect(cli.stdout).toContain("source-registry summary"); expect(cli.stderr).not.toContain("FAILED:");
  });
});
