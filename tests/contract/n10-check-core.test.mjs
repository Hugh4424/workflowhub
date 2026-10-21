import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { createHash } from "node:crypto";
import { checkSkillConsistency } from "../../tools/cli/check-skill-consistency.mjs";
import { checkDecisionLogChain } from "../../tools/cli/check-decision-log-chain.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DECISION = join(ROOT, "tools/cli/check-decision-log-chain.mjs");
const temporary = [];
const temp = () => { const root = mkdtempSync(join(tmpdir(), "n10-check-core-")); temporary.push(root); return root; };
afterEach(() => { for (const root of temporary.splice(0)) rmSync(root, { recursive: true, force: true }); });
function runDecisionChain(args, cwd = ROOT) {
  const result = spawnSync(process.execPath, [DECISION, ...args], { cwd, encoding: "utf8", timeout: 30_000 });
  return { ...result, argv: [process.execPath, DECISION, ...args], output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}
const current = "### D-901 — current\n- 做什么：检查\n- 不做什么：扩张\n- 风险：误报\n- 改动：CLI\n";

describe("ORACLE-N10-CHECK-CORE decision-chain input triage", () => {
  it("retains legal advisory output and exit 0", () => {
    const result = runDecisionChain(["--file", "specs/n10-finite-check-wiring-20261020/decision-log.md"]);
    expect(result.status, result.output).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("non-blocking, exit 0");
  });
  it("names an empty root and default root without claiming zero warnings", () => {
    const root = temp();
    for (const result of [runDecisionChain(["--root", root]), runDecisionChain([], root)]) {
      expect(result.status, result.output).toBe(0);
      expect(result.output).toContain("no input");
      expect(result.output).toContain("nothing checked");
      expect(result.output).not.toContain("0 warning(s)");
    }
  });
  it("names an unreadable file without a Node stack", () => {
    const file = join(temp(), "missing.md");
    const result = runDecisionChain(["--file", file]);
    expect(result.status).toBe(1);
    expect(result.output).toContain(file);
    expect(result.output).toContain("cannot read");
    expect(result.output).not.toContain("Node.js v");
  });
  it.each(["--file", "--root"])("rejects missing value for %s", flag => {
    const result = runDecisionChain([flag]);
    expect(result.status).toBe(1);
    expect(result.output).toMatch(/requires a value|missing value/);
    expect(result.output).toContain(flag);
    expect(result.output).not.toContain("advisory complete");
  });
  it("rejects unknown arguments instead of scanning defaults", () => {
    const result = runDecisionChain(["--bogus"]);
    expect(result.status).toBe(1);
    expect(result.output).toMatch(/unknown|unsupported/);
    expect(result.output).toContain("--bogus");
    expect(result.output).not.toContain("advisory complete");
  });
  it("distinguishes missing and non-directory roots from empty input", () => {
    const root = temp(); const file = join(root, "file"); writeFileSync(file, current);
    for (const input of [join(root, "missing"), file]) {
      const result = runDecisionChain(["--root", input]);
      expect(result.status).toBe(1);
      expect(result.output).toContain("cannot read root");
      expect(result.output).toContain(input);
      expect(result.output).not.toContain("nothing checked");
      expect(result.output).not.toContain("Node.js v");
    }
  });
  it("preserves warning-only advisory semantics", () => {
    const file = join(temp(), "decision-log.md"); writeFileSync(file, "### D-900 — legacy\n- module: unit\n");
    const result = runDecisionChain(["--file", file]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("WARNING");
    expect(result.stdout).toContain("advisory complete");
    expect(result.stdout).toContain("non-blocking, exit 0");
  });
});

describe("ORACLE-N10-CHECK-CORE decision-chain shape inference", () => {
  it("does not report legacy missing fields for the real N10 current decisions", () => {
    const path = join(ROOT, "specs/n10-finite-check-wiring-20261020/decision-log.md");
    const result = checkDecisionLogChain({ markdown: readFileSync(path, "utf8"), source_ref: path });
    expect(result.warnings.filter(w => w.code === "missing_chain_field" && ["module", "requirement_ids", "derived_from", "artifacts"].includes(w.field))).toEqual([]);
    expect(runDecisionChain(["--file", path]).status).toBe(0);
  });
  it("retains legacy fields, exact counts, and the missing derived_from warning", () => {
    const legacy = "### D-900 — legacy\n- module: checker\n- requirement_ids: [R-001]\n- derived_from: []\n- artifacts: [tools/cli/check-decision-log-chain.mjs]\n";
    const result = checkDecisionLogChain({ markdown: legacy });
    expect(result.recognized_blocks).toBe(1);
    expect(result.recognized_fields).toBe(4);
    expect(result.warnings).toEqual([]);
    const broken = checkDecisionLogChain({ markdown: legacy.replace("- derived_from: []\n", "") });
    expect(broken.warnings.filter(w => w.code === "missing_chain_field").map(w => w.field)).toEqual(["derived_from"]);
  });
  it("recognizes current D fields with exact counts", () => {
    const result = checkDecisionLogChain({ markdown: current });
    expect(result.recognized_blocks).toBe(1);
    expect(result.recognized_fields).toBe(4);
    expect(result.warnings).toEqual([]);
  });
  it("keeps historical chain fields and unknown shapes visible", () => {
    const chain = "### D-903 — historical\n- 决定：做\n- 为什么：需求\n- 否掉了什么：扩张\n- 后果与风险：误报\n- 影响面：CLI\n";
    expect(checkDecisionLogChain({ markdown: chain }).warnings).toEqual([]);
    expect(checkDecisionLogChain({ markdown: "### D-902 — unknown\nplain text\n" }).warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "unknown_decision_shape", decision_id: "D-902" })]));
  });
});

function runCli(name, args = [], force) {
  const env = { ...process.env }; delete env.RUN_CHECKS_FORCE_FAIL_CHECKER;
  if (force) env.RUN_CHECKS_FORCE_FAIL_CHECKER = force;
  const result = spawnSync(process.execPath, [join(ROOT, "tools/cli", name), ...args], { cwd: ROOT, encoding: "utf8", timeout: 30_000, env });
  return { ...result, argv: [process.execPath, join(ROOT, "tools/cli", name), ...args], output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}
describe("ORACLE-N10-CHECK-CORE report semantics (three CLIs)", () => {
  it("retains legal consistency reports", () => {
    const result = runCli("check-skill-consistency.mjs", ["--root", ROOT]);
    expect(result.status, result.output).toBe(0);
    expect(result.stderr).not.toContain("FAIL");
    expect(result.stdout).toContain("current declarations consistent");
  });
  it("names invalid and unreadable consistency roots without Node stacks", () => {
    const missing = join(temp(), "missing");
    for (const [root, pattern] of [["relative", /requires --root <absolute package root>.*received: relative|requires --root <absolute package root>.*received: --root relative/], [missing, /cannot read root/]]) {
      const result = runCli("check-skill-consistency.mjs", ["--root", root]);
      expect(result.status).toBe(1);
      expect(result.output).toMatch(pattern);
      expect(result.output).toContain(root);
      expect(result.output).not.toContain("Node.js v");
    }
  });
  it("retains all six aggregate sections without running material or final-chain output", () => {
    const result = runCli("run-checks.mjs");
    expect(result.status, result.output).toBe(0);
    for (const name of ["check-anti-host", "check-metrics-schema", "skill-static-deps", "check-skill-consistency", "check-stage-quality", "check-decision-log-chain"]) expect(result.stdout).toContain(`[run-checks] running ${name}`);
    expect(result.stdout).toContain("ALL CHECKS PASSED");
    expect(result.stdout).not.toContain("final-chain");
    expect(result.stdout).not.toContain("[run-checks][material]");
  });
  it("rejects bad aggregate arguments and names real blocking failure", () => {
    const bad = runCli("run-checks.mjs", ["--bogus"]);
    expect(bad.status).toBe(1);
    expect(bad.output).toContain("unsupported arguments");
    expect(bad.output).not.toContain("ALL CHECKS PASSED");
    const failed = runCli("run-checks.mjs", [], "check-anti-host");
    expect(failed.status).toBe(1);
    expect(failed.output).toContain("FAILED: check-anti-host (exit 1)");
    expect(failed.output).not.toContain("ALL CHECKS PASSED");
  });
});

function healthyFixture() {
  const root = temp();
  const stages = ["make-decision", "build-plan", "build-code", "verify-code", "build-prd"];
  const entry = { name: "sample", path: "skills/sample/SKILL.md", status: "native", used_by_stages: stages, upstream: [], dependency_closure: [] };
  const put = (path, value) => { const target = join(root, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, typeof value === "string" ? value : JSON.stringify(value)); };
  put("skills/catalog.yaml", yaml.dump({ schema_version: 2, skills: [entry] }));
  put("skills/sample/SKILL.md", "---\nname: sample\ndescription: fixture\n---\n\n# Sample\n");
  put("skills/sample/skill-bundle.json", { schema_version: 1, skill: "sample", files: ["SKILL.md"] });
  for (const stage of stages) put(`workflows/${stage}/skill-deps.yaml`, yaml.dump({ stage, skills: [{ name: "sample", path: entry.path, trigger: "fixture" }] }));
  put("skills/wh-review/manifest.json", { stage_skill_plan: "stage-skill-plan.json", contracts: {
    "make-decision": { required_skills_by_track: { direction: ["sample"], detail: ["sample"] } },
    ...Object.fromEntries(stages.filter(s => s !== "make-decision").map(s => [s, { required_skills: ["sample"] }])),
  } });
  put("skills/wh-review/stage-skill-plan.json", { stages: {
    "make-decision": { tracks: { direction: { required_skills: ["sample"] }, detail: { required_skills: ["sample"] } } },
    ...Object.fromEntries(["build-plan", "build-code", "verify-code"].map(s => [s, { required_skills: ["sample"] }])),
  }, non_stage: { build_prd: { required_skills: ["sample"] } } });
  return root;
}
function observe(label, result) {
  console.log(JSON.stringify({ scenario: label, argv: result.argv, exit: result.status, stdout: result.stdout, stderr: result.stderr }));
  return result;
}
describe("ORACLE-N10-CHECK-CORE controlled violations and byte-identical restore", () => {
  it("names duplicate registration and missing required_skills then restores the same legal bytes", () => {
    const root = healthyFixture();
    const cli = () => runCli("check-skill-consistency.mjs", ["--root", root]);
    expect(checkSkillConsistency(root).failures).toEqual([]);
    expect(observe("consistency legal", cli()).status).toBe(0);
    const catalogPath = join(root, "skills/catalog.yaml"); const catalogBytes = readFileSync(catalogPath);
    const catalog = yaml.load(catalogBytes.toString()); catalog.skills.push({ ...catalog.skills[0], path: "skills/other/SKILL.md" });
    writeFileSync(catalogPath, yaml.dump(catalog));
    expect(checkSkillConsistency(root).failures.join("\n")).toContain("duplicate current registration sample");
    const duplicate = observe("duplicate registration violation", cli());
    expect(duplicate.status).toBe(1); expect(duplicate.output).toContain("duplicate current registration sample");
    writeFileSync(catalogPath, catalogBytes); expect(readFileSync(catalogPath)).toEqual(catalogBytes);
    expect(checkSkillConsistency(root).failures).toEqual([]);
    expect(observe("duplicate registration byte-identical restore", cli()).status).toBe(0);
    const manifestPath = join(root, "skills/wh-review/manifest.json"); const manifestBytes = readFileSync(manifestPath);
    const manifest = JSON.parse(manifestBytes); delete manifest.contracts["build-plan"].required_skills;
    writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(checkSkillConsistency(root).failures.join("\n")).toContain("build-plan mandatory required_skills missing");
    const missing = observe("missing required_skills violation", cli());
    expect(missing.status).toBe(1); expect(missing.output).toContain("build-plan mandatory required_skills missing");
    writeFileSync(manifestPath, manifestBytes); expect(readFileSync(manifestPath)).toEqual(manifestBytes);
    expect(checkSkillConsistency(root).failures).toEqual([]);
    expect(observe("required_skills byte-identical restore", cli()).status).toBe(0);
  });
  it("names a missing field in a real decision-log copy, restores bytes, and leaves the real source unchanged", () => {
    const source = join(ROOT, "specs/n10-finite-check-wiring-20261020/decision-log.md");
    const original = readFileSync(source); const hash = bytes => createHash("sha256").update(bytes).digest("hex");
    const path = join(temp(), "decision-log.md"); writeFileSync(path, original);
    const baseline = observe("decision legal", runDecisionChain(["--file", path])); expect(baseline.status).toBe(0);
    expect(baseline.stdout).not.toContain("D-006.做什么");
    const body = original.toString(); const section = /^### D-006\b[^\n]*\n[\s\S]*?(?=^### |$(?![\s\S]))/m.exec(body);
    if (!section || !/^- \*\*做什么\*\*：.*$/m.test(section[0])) throw new Error("fixture guard: D-006 做什么 line missing");
    const broken = body.slice(0, section.index) + section[0].replace(/^- \*\*做什么\*\*：.*\n?/m, "") + body.slice(section.index + section[0].length);
    writeFileSync(path, broken);
    const violation = observe("decision missing 做什么 violation", runDecisionChain(["--file", path]));
    expect(violation.status).toBe(0); expect(violation.stdout).toContain("WARNING"); expect(violation.stdout).toContain("D-006.做什么");
    writeFileSync(path, original); expect(readFileSync(path)).toEqual(original);
    const restored = observe("decision byte-identical restore", runDecisionChain(["--file", path]));
    expect(restored.status).toBe(0); expect(restored.stdout).not.toContain("D-006.做什么");
    expect(hash(readFileSync(source))).toBe(hash(original));
    console.log(JSON.stringify({ scenario: "real decision source unchanged", sha256: hash(original), byte_identical: true }));
  });
});


describe("ORACLE-N10-CHECK-CORE review follow-up", () => {
  it("reports incomplete reads without an exit-0 success summary and still reads valid siblings", () => {
    const root = temp();
    const good = join(root, "specs", "good", "decision-log.md");
    const bad = join(root, "specs", "bad", "decision-log.md");
    mkdirSync(dirname(good), { recursive: true }); writeFileSync(good, "### D-900 — legacy\n- module: unit\n");
    mkdirSync(bad, { recursive: true });
    for (const result of [runDecisionChain(["--file", join(root, "missing.md")]), runDecisionChain(["--root", root])]) {
      expect(result.status, result.output).toBe(1);
      expect(result.output).toContain("cannot read");
      expect(result.output).not.toContain("advisory complete");
      expect(result.output).not.toContain("non-blocking, exit 0");
      expect(result.output).not.toContain("Node.js v");
    }
    const mixed = runDecisionChain(["--root", root]);
    expect(mixed.output).toContain("specs/bad/decision-log.md");
    expect(mixed.output).toContain("D-900.requirement_ids");
  });
  it.each(["", " \n\t\r\n"])("names empty file content as unchecked without a success or warning summary", content => {
    const root = temp(); const file = join(root, "specs", "empty", "decision-log.md");
    mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content);
    for (const result of [runDecisionChain(["--file", file]), runDecisionChain(["--root", root])]) {
      expect(result.status, result.output).toBe(0);
      expect(result.output).toContain("no input");
      expect(result.output).toContain("nothing checked");
      expect(result.output).toContain("decision-log.md");
      expect(result.output).not.toContain("WARNING");
      expect(result.output).not.toContain("advisory complete");
      expect(result.output).not.toContain("0 warning(s)");
    }
  });
  it("keeps nonempty unrecognized text observable as an advisory warning", () => {
    const file = join(temp(), "decision-log.md"); writeFileSync(file, "This nonempty material has no recognized decision heading.\n");
    const result = runDecisionChain(["--file", file]);
    expect(result.status, result.output).toBe(0);
    expect(result.stdout).toContain("WARNING");
    expect(result.stdout).toContain("no decision entries were recognized");
    expect(result.stdout).toContain("non-blocking, exit 0");
    expect(result.stdout).not.toContain("no input");
  });
});


describe("ORACLE-N10-CHECK-CORE permission lookup", () => {
  it.each(["root", "task"])("preserves real EACCES while looking through denied %s", deniedKind => {
    const root = temp(); const task = join(root, "specs", "owned");
    mkdirSync(task, { recursive: true }); writeFileSync(join(task, "decision-log.md"), current);
    const denied = deniedKind === "root" ? root : task;
    const lookup = deniedKind === "root" ? join(root, "specs") : join(task, "decision-log.md");
    try {
      chmodSync(denied, 0o000);
      if (deniedKind === "root") expect(statSync(root).isDirectory(), "fixture guard: root metadata remains readable").toBe(true);
      else expect(readdirSync(join(root, "specs")), "fixture guard: specs enumeration reaches owned task").toContain("owned");
      let lookupError;
      try { statSync(lookup); } catch (error) { lookupError = error; }
      expect(lookupError?.code, "fixture guard: directory traversal must actually fail with EACCES").toBe("EACCES");
      const result = observe(`permission lookup denied ${deniedKind}`, runDecisionChain(["--root", root]));
      expect(result.status, result.output).toBe(1);
      expect(result.output).toContain("cannot read root");
      expect(result.output).toContain("EACCES");
      expect(result.output).toContain(root);
      expect(result.output).not.toContain("advisory complete");
      expect(result.output).not.toContain("no input");
      expect(result.output).not.toContain("nothing checked");
      expect(result.output).not.toContain("non-blocking, exit 0");
    } finally { chmodSync(denied, 0o700); }
  });
});
