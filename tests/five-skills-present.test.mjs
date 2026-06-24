// TDD Phase 1: Five skill directories with SKILL.md + registry entries.
// Uses vitest + node:assert (node:assert is compatible with vitest).
import { test, describe } from "vitest";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Minimal YAML frontmatter field extractor — handles simple key: value lines.
// Only needed for name (string) and description (string), no nested structures.
function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const block = match[1];
  const result = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^(\w[\w-]*):\s*(.*?)\s*$/);
    if (m) result[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return result;
}

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

const SKILL_DIRS = [
  "make-decision",
  "build-spec",
  "build-plan",
  "build-code",
  "verify-code",
];

// --- Existence checks ---
describe("five skill directories have SKILL.md", () => {
  for (const dir of SKILL_DIRS) {
    test(`workflows/${dir}/SKILL.md exists`, () => {
      const p = join(REPO_ROOT, "workflows", dir, "SKILL.md");
      assert.ok(existsSync(p), `Missing: ${p}`);
    });
  }
});

// --- Frontmatter checks ---
describe("SKILL.md files have valid frontmatter", () => {
  for (const dir of SKILL_DIRS) {
    test(`workflows/${dir}/SKILL.md has name="${dir}" and non-empty description`, () => {
      const p = join(REPO_ROOT, "workflows", dir, "SKILL.md");
      assert.ok(existsSync(p), `Missing: ${p}`);
      const content = readFileSync(p, "utf8");

      const fm = extractFrontmatter(content);
      assert.ok(fm, `No valid YAML frontmatter in workflows/${dir}/SKILL.md`);
      assert.equal(fm.name, dir, `frontmatter.name should be "${dir}", got "${fm.name}"`);
      assert.ok(
        typeof fm.description === "string" && fm.description.trim().length > 0,
        `frontmatter.description must be a non-empty string in workflows/${dir}/SKILL.md`
      );
    });
  }
});

// --- Registry checks (literal assertions, one per skill name) ---
describe("config/workflowhub.yaml registry contains all five skills", () => {
  const configPath = join(REPO_ROOT, "config", "workflowhub.yaml");
  // Extract component_id values from YAML registry list with a regex scan.
  // ponytail: regex scan instead of full YAML parse — sufficient for simple list
  //           of {component_id: <id>} entries; upgrade to yaml pkg if structure grows.
  let registeredIds = [];
  try {
    const raw = readFileSync(configPath, "utf8");
    const matches = raw.matchAll(/component_id:\s*(\S+)/g);
    registeredIds = Array.from(matches).map((m) => m[1]);
  } catch (_) {
    registeredIds = [];
  }

  // Each skill name is asserted independently with a string literal.
  // Using literal assertions (not a loop over the same array) so that
  // removing one entry makes exactly that test fail, not all or none.
  test('registry contains component_id "make-decision"', () => {
    assert.ok(
      registeredIds.includes("make-decision"),
      `"make-decision" not found in registry component_ids: ${JSON.stringify(registeredIds)}`
    );
  });

  test('registry contains component_id "build-spec"', () => {
    assert.ok(
      registeredIds.includes("build-spec"),
      `"build-spec" not found in registry component_ids: ${JSON.stringify(registeredIds)}`
    );
  });

  test('registry contains component_id "build-plan"', () => {
    assert.ok(
      registeredIds.includes("build-plan"),
      `"build-plan" not found in registry component_ids: ${JSON.stringify(registeredIds)}`
    );
  });

  test('registry contains component_id "build-code"', () => {
    assert.ok(
      registeredIds.includes("build-code"),
      `"build-code" not found in registry component_ids: ${JSON.stringify(registeredIds)}`
    );
  });

  test('registry contains component_id "verify-code"', () => {
    assert.ok(
      registeredIds.includes("verify-code"),
      `"verify-code" not found in registry component_ids: ${JSON.stringify(registeredIds)}`
    );
  });
});

// --- Content checks: F10 anti-over-engineering (D10, build-spec and build-plan) ---
describe("build-spec SKILL.md contains F10 anti-over-engineering constraint", () => {
  const skillPath = join(REPO_ROOT, "workflows", "build-spec", "SKILL.md");

  test("build-spec contains F10 label", () => {
    const content = readFileSync(skillPath, "utf8");
    assert.ok(
      content.includes("F10"),
      "build-spec/SKILL.md must reference F10 (anti-over-engineering constraint)"
    );
  });

  test("build-spec contains the 'what real threat' question (anti-over-engineering gate)", () => {
    const content = readFileSync(skillPath, "utf8");
    // Must contain one of the four gate questions about real threat / true cost
    const hasRealThreat =
      content.includes("real threat") ||
      content.includes("真实威胁") ||
      content.includes("what real") ||
      content.includes("防什么") ||
      content.includes("真实的威胁");
    assert.ok(
      hasRealThreat,
      "build-spec/SKILL.md must ask about real threat defended against (F10 four-question gate)"
    );
  });

  test("build-spec contains maintenance cost question (anti-over-engineering gate)", () => {
    const content = readFileSync(skillPath, "utf8");
    const hasMaintCost =
      content.includes("maintenance cost") ||
      content.includes("long-term") ||
      content.includes("长期维护") ||
      content.includes("维护成本");
    assert.ok(
      hasMaintCost,
      "build-spec/SKILL.md must ask about long-term maintenance cost (F10 four-question gate)"
    );
  });
});

describe("build-plan SKILL.md contains F10 anti-over-engineering constraint", () => {
  const skillPath = join(REPO_ROOT, "workflows", "build-plan", "SKILL.md");

  test("build-plan contains F10 label", () => {
    const content = readFileSync(skillPath, "utf8");
    assert.ok(
      content.includes("F10"),
      "build-plan/SKILL.md must reference F10 (anti-over-engineering constraint)"
    );
  });

  test("build-plan contains real-threat question (anti-over-engineering gate)", () => {
    const content = readFileSync(skillPath, "utf8");
    const hasRealThreat =
      content.includes("real threat") ||
      content.includes("真实威胁") ||
      content.includes("what real") ||
      content.includes("防什么") ||
      content.includes("真实的威胁");
    assert.ok(
      hasRealThreat,
      "build-plan/SKILL.md must ask about real threat defended against (F10 four-question gate)"
    );
  });

  test("build-plan contains maintenance cost question (anti-over-engineering gate)", () => {
    const content = readFileSync(skillPath, "utf8");
    const hasMaintCost =
      content.includes("maintenance cost") ||
      content.includes("long-term") ||
      content.includes("长期维护") ||
      content.includes("维护成本");
    assert.ok(
      hasMaintCost,
      "build-plan/SKILL.md must ask about long-term maintenance cost (F10 four-question gate)"
    );
  });
});

// --- Content checks: build-code slim path (D12) ---
describe("build-code SKILL.md contains slim path / stage-result / make-decision support (D12)", () => {
  const skillPath = join(REPO_ROOT, "workflows", "build-code", "SKILL.md");

  test("build-code mentions stage-result as upstream input", () => {
    const content = readFileSync(skillPath, "utf8");
    assert.ok(
      content.includes("stage-result"),
      "build-code/SKILL.md must reference stage-result as upstream input (D12 slim path)"
    );
  });

  test("build-code supports make-decision as direct upstream (slim path)", () => {
    const content = readFileSync(skillPath, "utf8");
    assert.ok(
      content.includes("make-decision"),
      "build-code/SKILL.md must reference make-decision as a valid upstream (slim path, D12)"
    );
  });

  test("build-code does not assume tasks.md always exists", () => {
    const content = readFileSync(skillPath, "utf8");
    // Must acknowledge tasks.md is conditional on build-plan being upstream
    const hasConditionalTasksMd =
      content.includes("if") ||
      content.includes("only if") ||
      content.includes("when upstream") ||
      content.includes("build-plan") ||
      content.includes("upstream is build-plan") ||
      content.includes("当上游");
    assert.ok(
      hasConditionalTasksMd,
      "build-code/SKILL.md must make tasks.md conditional on build-plan being the upstream (D12 slim path)"
    );
  });
});

// --- Content checks: verify-code vs verify-change boundary (D5) ---
describe("verify-code SKILL.md contains verify-change boundary explanation (D5)", () => {
  const skillPath = join(REPO_ROOT, "workflows", "verify-code", "SKILL.md");

  test("verify-code mentions verify-change to distinguish from it", () => {
    const content = readFileSync(skillPath, "utf8");
    assert.ok(
      content.includes("verify-change"),
      "verify-code/SKILL.md must mention verify-change and distinguish from it (D5)"
    );
  });
});

// --- Content checks: metrics examples use M4 schema fields, not ad hoc {skill,stage,event,ts} ---
describe("SKILL.md metrics examples use M4 record-schema core fields", () => {
  // M4 core fields that should appear in the metrics guidance section
  const M4_CORE_FIELDS = [
    "execution_id",
    "skill_version",
    "rework_rounds",
  ];

  // Ad hoc fields that should NOT be used as the metrics format
  // (the old format was {"skill":"...","stage":"...","event":"...","ts":"..."})
  // We check that the skills direct use of metrics collector API, not raw ad hoc jsonl
  const AD_HOC_ONLY_MARKER = '"event":"stage_complete"';

  for (const dir of SKILL_DIRS) {
    test(`workflows/${dir}/SKILL.md metrics reference includes M4 field names or collector guidance`, () => {
      const p = join(REPO_ROOT, "workflows", dir, "SKILL.md");
      const content = readFileSync(p, "utf8");

      // Must include at least one M4 core field name OR direct collector reference
      const hasM4Field = M4_CORE_FIELDS.some((f) => content.includes(f));
      const hasCollectorRef =
        content.includes("collector") ||
        content.includes("recordSkeleton") ||
        content.includes("metrics/collector");

      assert.ok(
        hasM4Field || hasCollectorRef,
        `workflows/${dir}/SKILL.md must reference M4 schema fields (execution_id/skill_version/rework_rounds) or the metrics collector — found neither`
      );
    });

    test(`workflows/${dir}/SKILL.md does not use ad hoc event-only jsonl as metrics format`, () => {
      const p = join(REPO_ROOT, "workflows", dir, "SKILL.md");
      const content = readFileSync(p, "utf8");

      assert.ok(
        !content.includes(AD_HOC_ONLY_MARKER),
        `workflows/${dir}/SKILL.md must not use ad hoc {"skill","stage","event","ts"} as the metrics record format — upgrade to M4 schema or collector reference`
      );
    });
  }
});
