import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import yaml from "js-yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(join(root, relativePath), "utf8");
const json = (relativePath) => JSON.parse(read(relativePath));
const yamlFile = (relativePath) => yaml.load(read(relativePath));
const sha256 = "a".repeat(64);

const uiContractTerms = [
  "component action",
  "real consumer",
  "state owner",
  "typed ViewModel",
  "CSS/token owner",
  "fixture",
  "viewport",
  "browser",
  "a11y",
  "performance",
  "screenshot",
  "coverage limits",
];

const designGapTerms = [
  "design_status",
  "missing_items",
  "fallback_visual_basis",
  "constraints",
  "assumptions",
  "rework_risk",
  "human_confirmation",
  "current_material_ref",
  "preview_refs",
  "fixture_refs",
  "viewport_refs",
  "screenshot_refs",
  "design_revision",
];

function requireTerms(relativePath, terms) {
  const content = read(relativePath);
  for (const term of terms) {
    assert.match(
      content,
      new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      `${relativePath}: missing ${term}`,
    );
  }
}

function validUiRun(overrides = {}) {
  return {
    applicability: "ui",
    result: "pass",
    route: "/settings",
    page: "Settings",
    scenario: "default",
    tool: "agent-browser",
    engine: "agent-browser",
    session: "workflowhub-ui-contract",
    state: { name: "default", interaction: "open settings" },
    viewport: { name: "desktop", width: 1440, height: 900 },
    fixture: { name: "settings-default", data_ref: "fixtures/settings.json" },
    component: { name: "SettingsForm", path: "src/components/SettingsForm.tsx" },
    design_revision: "Design.md@v1",
    visual: { status: "observed", screenshot_refs: ["evidence/settings.png"] },
    a11y: { status: "checked", checks: ["keyboard", "labels"] },
    auth: { mode: "none", login_state_reused: false },
    performance: { status: "not_measured", reason: "contract test only" },
    screenshots: [{ ref: "evidence/settings.png", hash: sha256 }],
    test: {
      command: "node --test settings.test.mjs",
      file: "settings.test.mjs",
      output_ref: "quality/tests/settings.txt",
      output_hash: sha256,
      exit_code: 0,
    },
    cleanup: { status: "completed", app_service_running: true },
    engine_switch: "no",
    ...overrides,
  };
}

test("UI plan and task templates make component and QA handoff executable", () => {
  requireTerms("skills/spec-plan/templates/plan-template.md", uiContractTerms);
  requireTerms("skills/spec-plan/templates/plan-template.md", designGapTerms);
  requireTerms("skills/spec-tasks/templates/tasks-template.md", uiContractTerms);
  requireTerms("skills/spec-tasks/templates/tasks-template.md", designGapTerms);

  for (const path of [
    "skills/spec-plan/templates/plan-template.md",
    "skills/spec-tasks/templates/tasks-template.md",
  ]) {
    const content = read(path);
    assert.match(content, /UI phase|UI task|ui_scope/i, `${path}: UI applicability marker missing`);
    assert.match(content, /N\/A|unknown/i, `${path}: unknown/N\/A handoff is missing`);
    assert.match(content, /design_revision.{0,120}(version|版本)/is, `${path}: design revision must be a version`);
  }
});

test("frontend and browser skills preserve state, evidence, and truthful failure semantics", () => {
  requireTerms("skills/frontend-testing/SKILL.md", [
    "loading", "empty", "error", "cancel", "boundary", "permission",
    "keyboard", "a11y", "responsive", "viewport", "fixture", "screenshot",
    "failure reason", "unknown", "N/A", "component", "CSS", "negative",
    "duplicate", "no consumer", "two consumers", "state owner", "global override", "!important",
  ]);
  requireTerms("skills/isolated-browser-qa/SKILL.md", [
    "blocked", "unknown", "failure_reason", "zero screenshots", "not_applicable",
    "state", "viewport", "fixture", "design_revision", "visual", "a11y", "cleanup",
  ]);
});

test("browser evidence schema accepts pass/fail and reasoned blocked/unknown without false green", () => {
  const schema = json("runtime/schemas/browser-qa-evidence.v1.json");
  const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

  assert.equal(validate(validUiRun()), true, validate.errors?.map((entry) => entry.message).join("; "));
  assert.equal(validate(validUiRun({ result: "fail", test: { ...validUiRun().test, exit_code: 1 } })), true);

  const blocked = validUiRun({
    result: "blocked",
    screenshots: [],
    failure_reason: "agent-browser is unavailable in this environment",
    visual: { status: "not_observed", reason: "browser did not start" },
    a11y: { status: "not_applicable", reason: "browser did not start" },
    test: { ...validUiRun().test, exit_code: 1 },
  });
  assert.equal(validate(blocked), true, validate.errors?.map((entry) => entry.message).join("; "));

  const unknown = validUiRun({
    result: "unknown",
    screenshots: [],
    failure_reason: "preview was not returned",
    visual: { status: "not_observed", reason: "preview unavailable" },
    a11y: { status: "not_applicable", reason: "preview unavailable" },
    test: { ...validUiRun().test, exit_code: 1 },
  });
  assert.equal(validate(unknown), true, validate.errors?.map((entry) => entry.message).join("; "));

  assert.equal(validate({ ...blocked, failure_reason: undefined }), false, "blocked without reason must fail");
  assert.equal(validate({ ...validUiRun(), screenshots: [] }), false, "pass without screenshot must fail");
  assert.equal(validate(validUiRun({ visual: { status: "not_observed" } })), false, "not_observed without reason must fail");
  assert.equal(validate(validUiRun({ a11y: { status: "not_checked" } })), false, "not_checked without reason must fail");
  assert.equal(validate(validUiRun({ visual: { status: "observed" } })), false, "observed visual must reference screenshots");
  assert.equal(validate(validUiRun({ a11y: { status: "checked" } })), false, "checked a11y must list checks");
  assert.equal(validate(validUiRun({ component: { name: "SettingsForm" } })), false, "component must retain a path/ref");
});

test("UI governance records have one owner, consumer, and deletion condition", () => {
  const catalog = yamlFile("skills/catalog.yaml");
  const entries = new Map((catalog.skills ?? []).map((entry) => [entry.name, entry]));
  for (const skill of ["frontend-testing", "isolated-browser-qa"]) {
    const entry = entries.get(skill);
    assert.ok(entry, `${skill}: catalog entry missing`);
    assert.match(entry.local_changes ?? "", /owner/i, `${skill}: owner missing`);
    assert.match(entry.local_changes ?? "", /consumer/i, `${skill}: consumer missing`);
    assert.match(entry.local_changes ?? "", /delete|remove/i, `${skill}: deletion condition missing`);
  }

  const moveMap = json("docs/architecture/move-map.json");
  const entriesBySource = new Map((moveMap.entries ?? []).map((entry) => [entry.source, entry]));
  for (const path of [
    "skills/spec-plan/templates/plan-template.md",
    "skills/spec-tasks/templates/tasks-template.md",
    "skills/frontend-testing/SKILL.md",
    "skills/isolated-browser-qa/SKILL.md",
    "runtime/schemas/browser-qa-evidence.v1.json",
    "skills/catalog.yaml",
    "skills/reuse-registry.md",
    "CONTEXT.md",
    "THIRD_PARTY_NOTICES.md",
  ]) {
    const entry = entriesBySource.get(path);
    assert.ok(entry, `move-map entry missing ${path}`);
    assert.match(entry.owner ?? "", /\S/);
    assert.match(entry.consumer ?? "", /\S/);
    assert.match(entry.delete_condition ?? "", /\S/);
  }

  const inventory = read("docs/architecture/repository-inventory.tsv");
  for (const path of [
    "skills/spec-plan/templates/plan-template.md",
    "skills/spec-tasks/templates/tasks-template.md",
    "skills/frontend-testing/SKILL.md",
    "skills/isolated-browser-qa/SKILL.md",
    "runtime/schemas/browser-qa-evidence.v1.json",
    "skills/catalog.yaml",
    "skills/reuse-registry.md",
    "CONTEXT.md",
    "THIRD_PARTY_NOTICES.md",
  ]) {
    assert.match(inventory, new RegExp(`^${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\t`, "m"), `inventory row missing ${path}`);
  }
  requireTerms("skills/reuse-registry.md", ["frontend-testing", "isolated-browser-qa", "owner", "consumer", "delete"]);
  requireTerms("CONTEXT.md", ["UI phase", "component", "browser", "screenshot", "unknown"]);
  requireTerms("THIRD_PARTY_NOTICES.md", ["browser QA", "frontend-testing"]);
});
