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
// P2-TCR-001: fixture paths are independent contract expectations, not an
// implementation export. Missing templates must stay observable, including in
// the small N2 package fixture.
const AUTHORING_TEMPLATES = [
  "skills/decision-log/templates/decision-log-template.md",
  "skills/spec-specify/templates/spec-template.md",
  "skills/spec-plan/templates/phase-template.md",
  "skills/spec-plan/templates/index-template.md",
  "skills/spec-prd/templates/prd-template.md",
];
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
    expect(before.reports.filter(report => !report.startsWith("material-authoring ")), "legal adapted source must start without source diagnostics").toEqual([]);
    for (const path of AUTHORING_TEMPLATES) {
      const reports = before.reports.filter(report => report.startsWith(`material-authoring ${path}: 必留项 `));
      expect(reports, path).toHaveLength(1);
      expect(reports[0], path).toMatch(/unknown|未覆盖/u);
      expect(reports[0], path).toContain("ENOENT");
      expect(reports[0], path).not.toMatch(/已在场|通过/u);
    }
    const healthyCli = spawnSync(process.execPath, [join(ROOT, "tools/cli/check-skill-consistency.mjs"), "--root", root], { encoding: "utf8" });
    expect(healthyCli.status, healthyCli.stderr).toBe(0);
    for (const path of AUTHORING_TEMPLATES) expect(healthyCli.stdout).toContain(`material-authoring ${path}: 必留项 unknown`);
    expect(healthyCli.stderr).not.toContain("[check-skill-consistency] FAIL");
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

describe("ORACLE-N4-REPORT-ONLY writing reports", () => {
  const phasePath = AUTHORING_TEMPLATES[2];
  const indexPath = AUTHORING_TEMPLATES[3];
  const phase = "# Phase P1\n- **写入集**: `README.md`\n## L0\n结果\n## L1\n合同\n## L2\n参考\n";
  const index = "# Phase 索引\n## Execution Index\n| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |\n| --- | --- | --- | --- | --- | --- |\n| P1 | `phases/P1.md` | L0 | `README.md` | 无 | 作者 |\n";
  const fixture = () => {
    const { root } = healthyFixture();
    for (const path of AUTHORING_TEMPLATES) put(root, path, "# 材料\n必留项由作者用散文声明，需要独立人读。\n");
    put(root, phasePath, phase);
    put(root, indexPath, index);
    return root;
  };
  const reportFor = (root, path) => {
    const result = checkSkillConsistency(root);
    expect(result.failures).toEqual([]);
    const reports = result.reports.filter(report => report.startsWith(`material-authoring ${path}: 必留项 `));
    expect(reports, path).toHaveLength(1);
    return reports[0];
  };

  it("reports each of five missing templates as unknown with its original error, without failures", () => {
    const { root } = healthyFixture();
    for (const path of AUTHORING_TEMPLATES) {
      expect(reportFor(root, path)).toContain("unknown");
      expect(reportFor(root, path)).toContain("ENOENT");
    }
  });

  it("keeps prose-only declarations undetermined instead of claiming missing or present", () => {
    const root = fixture();
    for (const path of [AUTHORING_TEMPLATES[0], AUTHORING_TEMPLATES[1], AUTHORING_TEMPLATES[4]]) {
      expect(reportFor(root, path)).toContain("unknown");
      expect(reportFor(root, path)).not.toContain("缺失");
      expect(reportFor(root, path)).not.toContain("在场");
    }
  });

  it.each([
    ["L2", phase.replace("## L2\n", "")],
    ["写入集", phase.replace("- **写入集**: `README.md`\n", "")],
    ["写入集", "# Phase P1\n## L0\n结果\n## L1\n合同\n## L2\n- **写入集**: `README.md`\n"],
  ])("distinguishes legal, missing %s and byte-identical restored Phase input", (item, broken) => {
    const root = fixture();
    expect(reportFor(root, phasePath)).toContain("机器结构在场");
    put(root, phasePath, broken);
    expect(reportFor(root, phasePath)).toContain(`缺失 ${item}`);
    put(root, phasePath, phase);
    expect(read(join(root, phasePath))).toBe(phase);
    expect(reportFor(root, phasePath)).toContain("机器结构在场");
  });

  it.each(["门禁命令", "预期退出码", "判定器", "证据路径", "gate_cmd"])("reports pointer-only index contamination by %s and clears it after restore", label => {
    const root = fixture();
    expect(reportFor(root, indexPath)).toContain("机器结构在场");
    put(root, indexPath, `${index}\n- **${label}**：0\n`);
    expect(reportFor(root, indexPath)).toContain("缺失 纯指针边界");
    put(root, indexPath, index);
    expect(reportFor(root, indexPath)).toContain("机器结构在场");
  });

  it("reports empty headings and explicit placeholders while excluding inline code, fences and quotes", () => {
    const root = fixture();
    const path = AUTHORING_TEMPLATES[1];
    put(root, path, "# 材料\n##\nTBD 待补充 {{作者}}\n");
    let reports = checkSkillConsistency(root).reports.filter(report => report.startsWith(`material-authoring ${path}:`));
    expect(reports.some(report => report.includes("空标题") && report.includes("line=2"))).toBe(true);
    expect(reports.some(report => report.includes("占位") && report.includes("line=3"))).toBe(true);
    put(root, path, "# 材料\n`TBD 待补充 {{作者}}`\n> TBD 待补充 {{作者}}\n```md\n##\nTBD 待补充 {{作者}}\n```\n");
    reports = checkSkillConsistency(root).reports.filter(report => report.startsWith(`material-authoring ${path}:`));
    expect(reports.some(report => report.includes("空标题") || report.includes("占位"))).toBe(false);
  });

  it("keeps inline-code-only headings nonempty while still detecting a truly empty heading", () => {
    const root = fixture();
    const path = AUTHORING_TEMPLATES[1];
    put(root, path, "# `API`\n## `symbol`\n### ``a`b``\n## `TBD`\n## \n");
    const reports = checkSkillConsistency(root).reports.filter(report => report.startsWith(`material-authoring ${path}:`));
    const emptyHeadings = reports.filter(report => report.includes("空标题"));
    expect(emptyHeadings).toHaveLength(1);
    expect(emptyHeadings[0]).toContain("line=5");
    expect(reports.some(report => report.includes("占位"))).toBe(false);
    expect(checkSkillConsistency(root).failures).toEqual([]);
  });

  it("reports reference sentence counts and unknown calibration without a length gate or fabricated denominator", () => {
    const root = fixture();
    const path = AUTHORING_TEMPLATES[1];
    put(root, path, "甲乙 ABC123 `x+y`。\n> 不应计入。\n");
    let reports = checkSkillConsistency(root).reports.filter(report => report.startsWith(`material-authoring ${path}:`));
    expect(reports.some(report => report.includes("句长参考 [4]") && report.includes("TP=unknown FP=unknown 分母=unknown"))).toBe(true);
    put(root, path, "甲乙\n丙丁。\n");
    reports = checkSkillConsistency(root).reports.filter(report => report.startsWith(`material-authoring ${path}:`));
    expect(reports.some(report => report.includes("句长参考 [4]"))).toBe(true);
    put(root, path, `${"甲".repeat(500)}。\n`);
    const cli = spawnSync(process.execPath, [join(ROOT, "tools/cli/check-skill-consistency.mjs"), "--root", root], { encoding: "utf8" });
    expect(cli.status, cli.stderr).toBe(0);
    expect(cli.stdout).toContain("句长参考 [500]");
    expect(cli.stderr).not.toContain("FAIL");
    expect(checkSkillConsistency(root).failures).toEqual([]);
  });

  it("distinguishes a readable empty index from an unreadable template without inventing presence", () => {
    const root = fixture();
    put(root, indexPath, "");
    const report = reportFor(root, indexPath);
    expect(report).toContain("缺失 纯指针边界");
    expect(report).not.toContain("ENOENT");
    expect(report).not.toContain("机器结构在场");
    put(root, indexPath, index);
    expect(reportFor(root, indexPath)).toContain("机器结构在场");
  });

  it("keeps an unreadable template local to reports and retains CLI argument/root failures", () => {
    const root = fixture();
    rmSync(join(root, phasePath));
    mkdirSync(join(root, phasePath));
    expect(reportFor(root, phasePath)).toContain("unknown");
    expect(reportFor(root, phasePath)).toContain("EISDIR");
    expect(reportFor(root, indexPath)).toContain("机器结构在场");
    const cli = spawnSync(process.execPath, [join(ROOT, "tools/cli/check-skill-consistency.mjs"), "--root", root], { encoding: "utf8" });
    expect(cli.status, cli.stderr).toBe(0);
    expect(cli.stdout).toContain("EISDIR");
    expect(cli.stderr).not.toContain("FAIL");
    // Keep the real failure/detection bytes in the native test output rather
    // than letting successful assertions hide the unavailable scene.
    console.log(JSON.stringify({ scenario: "N4-template-unavailable", argv: [process.execPath, join(ROOT, "tools/cli/check-skill-consistency.mjs"), "--root", root], cwd: ROOT, exit: cli.status, signal: cli.signal, stdout: cli.stdout, stderr: cli.stderr, fixture_cleanup: "afterEach removes the temporary root" }));
    for (const args of [[], ["--root", "relative"], ["--root", join(root, "absent")]]) {
      const bad = spawnSync(process.execPath, [join(ROOT, "tools/cli/check-skill-consistency.mjs"), ...args], { encoding: "utf8" });
      expect(bad.status, bad.stdout + bad.stderr).toBe(1);
    }
    rmSync(join(root, phasePath), { recursive: true });
    put(root, phasePath, phase);
    expect(reportFor(root, phasePath)).toContain("机器结构在场");
  });

  it("exposes the real report through run-checks and retains a forced blocking failure", () => {
    const runChecks = join(ROOT, "tools/cli/run-checks.mjs");
    const env = { ...process.env };
    delete env.RUN_CHECKS_FORCE_FAIL_CHECKER;
    const normal = spawnSync(process.execPath, [runChecks], { cwd: ROOT, env, encoding: "utf8", timeout: 30_000 });
    expect(normal.status, normal.stdout + normal.stderr).toBe(0);
    for (const path of AUTHORING_TEMPLATES) expect(normal.stdout).toContain(`material-authoring ${path}: 必留项 `);
    expect(normal.stderr).not.toContain("FAILED:");
    const failed = spawnSync(process.execPath, [runChecks], { cwd: ROOT, env: { ...env, RUN_CHECKS_FORCE_FAIL_CHECKER: "check-anti-host" }, encoding: "utf8", timeout: 30_000 });
    expect(failed.status, failed.stdout + failed.stderr).toBe(1);
    expect(failed.stderr).toContain("FAILED: check-anti-host (exit 1)");
  });

  it("states unconnected calibration availability without claiming independent labels are absent", () => {
    const root = fixture();
    const diagnostic = () => checkSkillConsistency(root).reports.filter(report => report.includes("句长参考"));
    const before = diagnostic();
    expect(before).toHaveLength(5);
    for (const report of before) {
      expect(report).toContain("本检查未接入独立标注；校准见独立原件");
      expect(report).toContain("TP=unknown FP=unknown 分母=unknown");
      expect(report).not.toContain("P5人工标注尚未提供");
    }
    // Independent evidence may exist, but this CLI has no label input/reader.
    // Its diagnostic must neither invent availability nor consume that file.
    put(root, "quality/evidence/independent-labels.json", { annotator: "independent", TP: 1, FP: 0, denominator: 1 });
    expect(diagnostic()).toEqual(before);
    expect(checkSkillConsistency(root).failures).toEqual([]);
    const cli = spawnSync(process.execPath, [join(ROOT, "tools/cli/check-skill-consistency.mjs"), "--root", root], { encoding: "utf8" });
    expect(cli.status, cli.stderr).toBe(0);
    expect(cli.stdout).toContain("本检查未接入独立标注；校准见独立原件");
    expect(cli.stdout).toContain("TP=unknown FP=unknown 分母=unknown");
    expect(cli.stdout).not.toContain("P5人工标注尚未提供");
  });
});
