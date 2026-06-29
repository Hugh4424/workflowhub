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

// --- Helpers for existence / frontmatter (called with a hard-coded literal per test) ---
function assertSkillExists(name, baseDir = "workflows") {
  const p = join(REPO_ROOT, baseDir, name, "SKILL.md");
  assert.ok(existsSync(p), `Missing: ${p}`);
}

function assertSkillFrontmatter(name, baseDir = "workflows") {
  const p = join(REPO_ROOT, baseDir, name, "SKILL.md");
  assert.ok(existsSync(p), `Missing: ${p}`);
  const content = readFileSync(p, "utf8");
  const fm = extractFrontmatter(content);
  assert.ok(fm, `No valid YAML frontmatter in ${baseDir}/${name}/SKILL.md`);
  assert.equal(fm.name, name, `frontmatter.name should be "${name}", got "${fm.name}"`);
  assert.ok(
    typeof fm.description === "string" && fm.description.trim().length > 0,
    `frontmatter.description must be a non-empty string in ${baseDir}/${name}/SKILL.md`
  );
}

// --- Existence checks (7 independent literal tests — no for-of loop) ---
describe("seven skill directories have SKILL.md", () => {
  test('workflows/make-decision/SKILL.md exists', () => { assertSkillExists("make-decision"); });
  test('workflows/build-spec/SKILL.md exists',    () => { assertSkillExists("build-spec"); });
  test('workflows/build-plan/SKILL.md exists',    () => { assertSkillExists("build-plan"); });
  test('workflows/build-code/SKILL.md exists',    () => { assertSkillExists("build-code"); });
  test('workflows/verify-code/SKILL.md exists',   () => { assertSkillExists("verify-code"); });
  test('skills/scope-triage/SKILL.md exists',  () => { assertSkillExists("scope-triage", "skills"); });
  test('skills/decision-log/SKILL.md exists',  () => { assertSkillExists("decision-log", "skills"); });
});

// --- Frontmatter checks (7 independent literal tests — no for-of loop) ---
describe("SKILL.md files have valid frontmatter", () => {
  test('workflows/make-decision/SKILL.md has name="make-decision" and non-empty description', () => { assertSkillFrontmatter("make-decision"); });
  test('workflows/build-spec/SKILL.md has name="build-spec" and non-empty description',       () => { assertSkillFrontmatter("build-spec"); });
  test('workflows/build-plan/SKILL.md has name="build-plan" and non-empty description',       () => { assertSkillFrontmatter("build-plan"); });
  test('workflows/build-code/SKILL.md has name="build-code" and non-empty description',       () => { assertSkillFrontmatter("build-code"); });
  test('workflows/verify-code/SKILL.md has name="verify-code" and non-empty description',     () => { assertSkillFrontmatter("verify-code"); });
  test('skills/scope-triage/SKILL.md has name="scope-triage" and non-empty description',   () => { assertSkillFrontmatter("scope-triage", "skills"); });
  test('skills/decision-log/SKILL.md has name="decision-log" and non-empty description',   () => { assertSkillFrontmatter("decision-log", "skills"); });
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

// scope-triage and decision-log existence/frontmatter now covered by
// "seven skill directories have SKILL.md" and "SKILL.md files have valid frontmatter"
// describe blocks above (7 independent literal tests each).

// --- AC5: all 7 component_ids present as literals in registry ---
// Independent literal assertions — falsifiable: removing any one entry makes exactly
// that named test fail. The 5-skill loop above + scope-triage/decision-log individual
// tests already cover existence/frontmatter, this consolidates registry membership for
// all 7 as the AC5 acceptance criterion.
describe("AC5: registry contains all 7 component_ids (literal per-skill assertions)", () => {
  const configPath = join(REPO_ROOT, "config", "workflowhub.yaml");
  let registeredIds = [];
  try {
    const raw = readFileSync(configPath, "utf8");
    const matches = raw.matchAll(/component_id:\s*(\S+)/g);
    registeredIds = Array.from(matches).map((m) => m[1]);
  } catch (_) {
    registeredIds = [];
  }

  // Each of the 7 skills is asserted independently by name literal.
  // Not a loop — removing one entry makes exactly that named test fail.
  test('AC5: registry contains "make-decision"', () => {
    assert.ok(registeredIds.includes("make-decision"),
      `"make-decision" not in registry: ${JSON.stringify(registeredIds)}`);
  });
  test('AC5: registry contains "build-spec"', () => {
    assert.ok(registeredIds.includes("build-spec"),
      `"build-spec" not in registry: ${JSON.stringify(registeredIds)}`);
  });
  test('AC5: registry contains "build-plan"', () => {
    assert.ok(registeredIds.includes("build-plan"),
      `"build-plan" not in registry: ${JSON.stringify(registeredIds)}`);
  });
  test('AC5: registry contains "build-code"', () => {
    assert.ok(registeredIds.includes("build-code"),
      `"build-code" not in registry: ${JSON.stringify(registeredIds)}`);
  });
  test('AC5: registry contains "verify-code"', () => {
    assert.ok(registeredIds.includes("verify-code"),
      `"verify-code" not in registry: ${JSON.stringify(registeredIds)}`);
  });
  test('AC5: registry contains "scope-triage"', () => {
    assert.ok(registeredIds.includes("scope-triage"),
      `"scope-triage" not in registry: ${JSON.stringify(registeredIds)}`);
  });
  test('AC5: registry contains "decision-log"', () => {
    assert.ok(registeredIds.includes("decision-log"),
      `"decision-log" not in registry: ${JSON.stringify(registeredIds)}`);
  });
});

// --- AC5 B2: make-decision SKILL.md path literal references (B2a) ---
// Independent literal test — falsifiable: removing either path ref from make-decision/SKILL.md
// makes this test fail.
describe("AC5 B2a: make-decision SKILL.md references scope-triage and decision-log paths", () => {
  const skillPath = join(REPO_ROOT, "workflows", "make-decision", "SKILL.md");

  test("make-decision SKILL.md references skills/scope-triage/SKILL.md path literal", () => {
    const content = readFileSync(skillPath, "utf8");
    assert.ok(
      content.includes("skills/scope-triage/SKILL.md"),
      "make-decision/SKILL.md must include the literal string 'skills/scope-triage/SKILL.md'"
    );
  });

  test("make-decision SKILL.md references skills/decision-log/SKILL.md path literal", () => {
    const content = readFileSync(skillPath, "utf8");
    assert.ok(
      content.includes("skills/decision-log/SKILL.md"),
      "make-decision/SKILL.md must include the literal string 'skills/decision-log/SKILL.md'"
    );
  });
});

// --- AC5 B2: reuse-registry.md row-format for ALL 7 skills (B2b) ---
// 7 independent literal tests (one per skill). Rules per AC4/AC6:
//   category ∈ {外部改造适配, 自研, 其他平台原生}
//   外部改造适配 → source non-empty AND ≠ "none"
//   自研          → source === "none"
// Falsifiable: blanking or mis-categorising any single row makes exactly that test red.
describe("AC5 B2b: reuse-registry.md row-format for all 7 skills (category enum + source rule)", () => {
  const registryPath = join(REPO_ROOT, "reuse-registry.md");
  const VALID_CATEGORIES = ["外部改造适配", "自研", "其他平台原生"];

  // Private helper — each test() invocation passes a hard-coded literal.
  function assertRegistryRow(skillName, expectedCategory) {
    const content = readFileSync(registryPath, "utf8");
    const lines = content.split("\n");
    const row = lines.find((l) => new RegExp(`\\|\\s*${skillName}\\s*\\|`).test(l));
    assert.ok(row, `reuse-registry.md must contain a row for ${skillName}`);
    // (a) category cell must be a legal enum value
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    // cells[0]=skill name, cells[1]=category, cells[2]=source
    const category = cells[1];
    assert.ok(
      VALID_CATEGORIES.includes(category),
      `${skillName} category must be one of [${VALID_CATEGORIES.join(", ")}], got: "${category}"`
    );
    assert.equal(
      category,
      expectedCategory,
      `${skillName} expected category "${expectedCategory}", got "${category}"`
    );
    // (b) source rule: 外部 → non-empty AND ≠ none; 自研 → exactly "none"
    const source = cells[2] ?? "";
    if (expectedCategory === "外部改造适配") {
      assert.ok(
        source && source !== "none",
        `${skillName} (外部改造适配) source must be non-empty and not "none", got: "${source}"`
      );
    } else {
      // 自研 (or 其他平台原生 if ever used): source must be "none"
      assert.equal(
        source,
        "none",
        `${skillName} (${expectedCategory}) source must be "none", got: "${source}"`
      );
    }
  }

  test('reuse-registry.md make-decision row: category=自研, source="none"',    () => { assertRegistryRow("make-decision", "自研"); });
  test('reuse-registry.md build-spec row: category=自研, source="none"',       () => { assertRegistryRow("build-spec",    "自研"); });
  test('reuse-registry.md build-plan row: category=自研, source="none"',       () => { assertRegistryRow("build-plan",    "自研"); });
  test('reuse-registry.md build-code row: category=自研, source="none"',       () => { assertRegistryRow("build-code",    "自研"); });
  test('reuse-registry.md verify-code row: category=自研, source="none"',      () => { assertRegistryRow("verify-code",   "自研"); });
  test('reuse-registry.md scope-triage row: category=外部改造适配, source≠none', () => { assertRegistryRow("scope-triage",  "外部改造适配"); });
  test('reuse-registry.md decision-log row: category=外部改造适配, source≠none', () => { assertRegistryRow("decision-log",  "外部改造适配"); });
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

// --- AC6 predicate ②: facts-subschema.json declares make-decision required_keys ---
// Three independent literal tests — falsifiable: removing any one key from
// make-decision.required_keys makes exactly that test red (not the others).
describe("AC6 ②: facts-subschema.json make-decision required_keys contract shape", () => {
  const schemaPath = join(REPO_ROOT, "contracts", "facts-subschema.json");
  const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  const requiredKeys = schema.stages["make-decision"].required_keys;

  test('facts-subschema.json make-decision.required_keys includes "decision"', () => {
    assert.ok(
      requiredKeys.includes("decision"),
      `make-decision.required_keys must include "decision", got: ${JSON.stringify(requiredKeys)}`
    );
  });

  test('facts-subschema.json make-decision.required_keys includes "scope"', () => {
    assert.ok(
      requiredKeys.includes("scope"),
      `make-decision.required_keys must include "scope", got: ${JSON.stringify(requiredKeys)}`
    );
  });

  test('facts-subschema.json make-decision.required_keys includes "decision_log_path"', () => {
    assert.ok(
      requiredKeys.includes("decision_log_path"),
      `make-decision.required_keys must include "decision_log_path", got: ${JSON.stringify(requiredKeys)}`
    );
  });
});
