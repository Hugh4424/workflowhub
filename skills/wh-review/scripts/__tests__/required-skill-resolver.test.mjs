import { existsSync, mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appendRequiredSkillDefinitions, parseRequiredSkillManifest, resolveRequiredSkills } from "../required-skill-resolver.mjs";
import { invokeReviewEngine } from "../invoke-review-engine.mjs";

const manifest = '<!-- wh-review-skills: {"required":["review","plan-design-review","plan-ceo-review"]} -->';
function skill(root, name, content, nested = false) { const dir = join(root, ...(nested ? ["gstack", name] : [name])); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, "SKILL.md"), content); }

describe("Claude required skill dependency closure", () => {
  it("parses and deterministically sorts the machine-readable manifest", () => {
    expect(parseRequiredSkillManifest(manifest)).toEqual({ required: ["plan-ceo-review", "plan-design-review", "review"], optional: [] });
  });

  it("resolves exact root/name and root/gstack/name definitions in name order", () => {
    const root = mkdtempSync(join(tmpdir(), "skills-"));
    skill(root, "review", "REVIEW-BYTES\n"); skill(root, "plan-ceo-review", "CEO-BYTES\n", true); skill(root, "plan-design-review", "DESIGN-BYTES\n");
    const result = resolveRequiredSkills({ contract: manifest, roots: [root] });
    expect(result.definitions.map((d) => d.name)).toEqual(["plan-ceo-review", "plan-design-review", "review"]);
  });

  it("deduplicates byte-identical copies but fails loud on different copies", () => {
    const a = mkdtempSync(join(tmpdir(), "skills-a-")); const b = mkdtempSync(join(tmpdir(), "skills-b-"));
    skill(a, "review", "same"); skill(b, "review", "same");
    expect(resolveRequiredSkills({ contract: '<!-- wh-review-skills: {"required":["review"]} -->', roots: [a, b] }).definitions).toHaveLength(1);
    writeFileSync(join(b, "review", "SKILL.md"), "different");
    expect(() => resolveRequiredSkills({ contract: '<!-- wh-review-skills: {"required":["review"]} -->', roots: [a, b] })).toThrow(/required-skill-conflict/);
  });

  it("fails before use for missing, traversal names, and symlink SKILL.md", () => {
    const root = mkdtempSync(join(tmpdir(), "skills-"));
    expect(() => resolveRequiredSkills({ contract: '<!-- wh-review-skills: {"required":["missing"]} -->', roots: [root] })).toThrow(/required-skill-unavailable/);
    expect(() => parseRequiredSkillManifest('<!-- wh-review-skills: {"required":["../escape"]} -->')).toThrow(/required-skill-unavailable/);
    const outside = join(mkdtempSync(join(tmpdir(), "outside-")), "SKILL.md"); writeFileSync(outside, "outside"); mkdirSync(join(root, "review")); symlinkSync(outside, join(root, "review", "SKILL.md"));
    expect(() => resolveRequiredSkills({ contract: '<!-- wh-review-skills: {"required":["review"]} -->', roots: [root] })).toThrow(/required-skill-unavailable/);
  });

  it("injects complete bytes and metadata; changing bytes changes sha256", () => {
    const root = mkdtempSync(join(tmpdir(), "skills-")); const full = "---\nversion: 9.1\n---\nFULL\nBYTES\n"; skill(root, "review", full);
    const contract = '<!-- wh-review-skills: {"required":["review"]} -->';
    const first = resolveRequiredSkills({ contract, roots: [root] });
    const augmented = appendRequiredSkillDefinitions({ contract, materials: "M", resolution: first });
    expect(augmented.contract).toContain(full); expect(augmented.materials).toBe("M"); expect(augmented.contract).toContain("version: 9.1");
    writeFileSync(join(root, "review", "SKILL.md"), `${full}changed`);
    expect(resolveRequiredSkills({ contract, roots: [root] }).definitions[0].sha256).not.toBe(first.definitions[0].sha256);
  });

  it("design contract declares and resolves all three required definitions in full", () => {
    const contract = readFileSync(new URL("../../contracts/design.md", import.meta.url), "utf8");
    const root = mkdtempSync(join(tmpdir(), "skills-")); skill(root, "review", "review-full"); skill(root, "plan-ceo-review", "ceo-full"); skill(root, "plan-design-review", "design-full");
    const result = resolveRequiredSkills({ contract, roots: [root] });
    expect(result.definitions.map((d) => d.content)).toEqual(["ceo-full", "design-full", "review-full"]);
    const augmented = appendRequiredSkillDefinitions({ contract, materials: "M", resolution: result });
    for (const bytes of ["ceo-full", "design-full", "review-full"]) {
      expect(augmented.contract).toContain(bytes);
    }
    expect(augmented.materials).toBe("M");
  });

  it("plan contract declares and packages all three required definitions", () => {
    const contract = readFileSync(new URL("../../contracts/plan.md", import.meta.url), "utf8");
    const root = mkdtempSync(join(tmpdir(), "skills-"));
    skill(root, "speckit-analyze", "analyze-full"); skill(root, "plan-eng-review", "eng-full"); skill(root, "review", "review-full");
    const result = resolveRequiredSkills({ contract, roots: [root] });
    expect(result.manifest.required).toEqual(["plan-eng-review", "review", "speckit-analyze"]);
    const augmented = appendRequiredSkillDefinitions({ contract, materials: "M", resolution: result });
    for (const bytes of ["analyze-full", "eng-full", "review-full"]) expect(augmented.contract).toContain(bytes);
  });

  it("fails before Claude spawn when plan-design-review is missing", () => {
    const contract = readFileSync(new URL("../../contracts/design.md", import.meta.url), "utf8");
    const taskRoot = mkdtempSync(join(tmpdir(), "tasks-")); const root = mkdtempSync(join(tmpdir(), "skills-"));
    skill(root, "review", "review-full"); skill(root, "plan-ceo-review", "ceo-full");
    expect(() => invokeReviewEngine({ taskId: "closure-test", stage: "build-spec", reviewFlowId: "missing-design", totalRound: 1, mode: "full", contract, materials: "M", taskTrackingRoot: taskRoot, env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex", CLAUDE_CODE_SKILL_ROOTS: root } })).toThrow(/plan-design-review not found/);
    expect(existsSync(join(taskRoot, "closure-test", "reviews", "verdict-build-spec-missing-design-round-1.raw.json"))).toBe(false);
  });

  it("fails required-skill resolution before Claude is spawned or an artifact is written", () => {
    const taskRoot = mkdtempSync(join(tmpdir(), "tasks-")); const emptySkills = mkdtempSync(join(tmpdir(), "skills-"));
    const previous = process.env.WORKFLOWHUB_TASK_DIR; process.env.WORKFLOWHUB_TASK_DIR = taskRoot;
    try {
      expect(() => invokeReviewEngine({ taskId: "closure-test", stage: "build-spec", reviewFlowId: "closure-flow", totalRound: 1, mode: "full", contract: '<!-- wh-review-skills: {"required":["review"]} -->', materials: "M", taskTrackingRoot: taskRoot, env: { WH_REVIEW_PROVIDER: "claude-code", THIRD_REVIEW_RUNNER: "claude-code", WH_REVIEW_HOST_PROVIDER: "codex", CLAUDE_CODE_SKILL_ROOTS: emptySkills } })).toThrow(/required-skill-unavailable/);
      expect(existsSync(join(taskRoot, "closure-test", "reviews", "verdict-build-spec-closure-flow-round-1.raw.json"))).toBe(false);
    } finally { if (previous === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = previous; }
  });

  it("keeps custom runner contract and materials byte-for-byte unchanged", () => {
    const taskRoot = mkdtempSync(join(tmpdir(), "tasks-")); const runnerDir = mkdtempSync(join(tmpdir(), "runner-")); const capture = join(runnerDir, "capture.json"); const runner = join(runnerDir, "runner.mjs");
    writeFileSync(runner, `import {readFileSync,writeFileSync} from "node:fs";const a=Object.fromEntries(process.argv.slice(2).map(x=>x.slice(2).split("=")));const p=JSON.parse(readFileSync(a.diff,"utf8"));writeFileSync(${JSON.stringify(capture)},JSON.stringify(p));writeFileSync(a.output,JSON.stringify({verdict:"pass",findings:[],actual_mode:p.mode}));`);
    const previous = process.env.WORKFLOWHUB_TASK_DIR; process.env.WORKFLOWHUB_TASK_DIR = taskRoot;
    try {
      invokeReviewEngine({ taskId: "closure-test", stage: "build-spec", reviewFlowId: "custom-flow", totalRound: 1, mode: "full", contract: `${manifest}\nC\u0000`, materials: "M\r\nbytes", taskTrackingRoot: taskRoot, env: { THIRD_REVIEW_RUNNER: runner } });
      const received = JSON.parse(readFileSync(capture, "utf8")); expect(received.contract).toBe(`${manifest}\nC\u0000`); expect(received.materials).toBe("M\r\nbytes");
    } finally { if (previous === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = previous; }
  });
});
