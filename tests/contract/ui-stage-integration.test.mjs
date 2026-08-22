import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import yaml from "js-yaml";

import {
  activeAcceptanceCriterionIds,
  buildShortUiDesignPrompt,
  buildUiProjectInitFact,
  deriveDesignSourceReadiness,
  validateComponentQualityMap,
  validateUiApplicability,
  validateUiContract,
  validateUiDesignLoopFact,
} from "../../runtime/stage/stage-content-contracts.mjs";
import { alignUiDesignEvidence } from "../../workflows/verify-code/design-alignment.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(join(root, relativePath), "utf8");
const json = (relativePath) => JSON.parse(read(relativePath));
const yamlFile = (relativePath) => yaml.load(read(relativePath));

function dependency(stage, name) {
  const manifest = yamlFile(`workflows/${stage}/skill-deps.yaml`);
  return (manifest.skills ?? []).find((entry) => entry.name === name);
}

function requireTerms(relativePath, terms) {
  const content = read(relativePath);
  for (const term of terms) {
    assert.match(
      content,
      new RegExp(term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i"),
      `${relativePath}: missing ${term}`,
    );
  }
}

test("UI applicability merges the three trusted inputs and rejects caller downgrade", () => {
  requireTerms("workflows/make-decision/SKILL.md", [
    "raw_requirement",
    "project_inventory",
    "planned_or_changed_frontend_fact",
    "ui",
    "non_ui",
    "unknown",
    "conflict",
    "caller",
    "downgrade",
    "re-evaluate",
    "recompute",
    "handoff to make-decision",
  ]);

  const makeDecision = read("workflows/make-decision/SKILL.md");
  assert.match(makeDecision, /plan.{0,40}frontend.{0,40}(change|fact).{0,40}(re-?evaluat|recompute)/is);
  assert.doesNotMatch(makeDecision, /caller.{0,80}(override|force).{0,80}ui/is);
});

test("UI applicability validates the derived conclusion from all three source facts", () => {
  const uiSources = {
    raw_requirement: "Build a settings page with an editable form",
    project_inventory: { frontend: true, routes: ["/settings"] },
    planned_or_changed_frontend_fact: { conclusion: "ui", component: "SettingsForm" },
  };
  const ui = validateUiApplicability({ result: "ui", sources: uiSources });
  assert.equal(ui.ok, true, ui.errors.join("; "));
  assert.equal(ui.derived_result, "ui");
  assert.equal(validateUiApplicability({
    result: "ui",
    sources: {
      raw_requirement: "ui",
      project_inventory: "frontend",
      planned_or_changed_frontend_fact: "page",
    },
  }).ok, true);
  assert.equal(validateUiApplicability({
    result: "non_ui",
    sources: {
      raw_requirement: "non_ui",
      project_inventory: "backend-only",
      planned_or_changed_frontend_fact: "api-only",
    },
  }).ok, true);
  assert.equal(validateUiApplicability({ result: "non_ui", sources: uiSources }).ok, false);
  assert.equal(validateUiApplicability({ result: "unknown", sources: uiSources, source_reasons: [], handoff: "make-decision" }).ok, false);
  assert.equal(validateUiApplicability({
    result: "unknown",
    sources: { ...uiSources, planned_or_changed_frontend_fact: { result: "ui", frontend: false } },
    source_reasons: ["conflicting source facts"],
    handoff: "make-decision",
  }).ok, true);

  const nonUiSources = {
    raw_requirement: { conclusion: "non_ui", reason: "backend-only migration" },
    project_inventory: { conclusion: "non_ui", reason: "no frontend surface" },
    planned_or_changed_frontend_fact: { conclusion: "non_ui", reason: "schema-only" },
  };
  assert.equal(validateUiApplicability({ result: "non_ui", sources: nonUiSources }).ok, true);
  assert.equal(validateUiApplicability({
    result: "unknown",
    sources: {
      raw_requirement: { status: "unknown", reason: "missing" },
      project_inventory: { status: "unknown", reason: "missing" },
      planned_or_changed_frontend_fact: { status: "unknown", reason: "missing" },
    },
    source_reasons: [],
    handoff: "make-decision",
  }).ok, false);

  const unknown = validateUiApplicability({
    result: "unknown",
    sources: {
      raw_requirement: { status: "unknown", reason: "requirement is incomplete" },
      project_inventory: { status: "unknown", reason: "inventory unavailable" },
      planned_or_changed_frontend_fact: { status: "unknown", reason: "plan not frozen" },
    },
    source_reasons: ["upstream facts are not frozen"],
    handoff: "make-decision",
  });
  assert.equal(unknown.ok, true, unknown.errors.join("; "));
});

test("build-spec UI path is init then readiness then the existing plan-design-review", () => {
  for (const skill of ["ui-project-init", "design-source-readiness", "plan-design-review"]) {
    const entry = dependency("build-spec", skill);
    assert.ok(entry, `build-spec dependency missing ${skill}`);
    assert.equal(entry.owner, "stage", `${skill} must have build-spec as the owner`);
    assert.equal(entry.execution, "independent", `${skill} must remain portable/independent`);
  }

  const steps = json("workflows/build-spec/steps.json").steps;
  const order = new Map(steps.map((step) => [step.step_slug, step.order]));
  assert.ok(order.has("ui-project-init"), "build-spec must expose the UI init step");
  assert.ok(order.has("design-source-readiness"), "build-spec must expose the readiness step");
  assert.ok(order.has("conditional-plan-design-review"), "existing plan-design-review step must remain");
  assert.ok(order.get("ui-project-init") < order.get("design-source-readiness"));
  assert.ok(order.get("design-source-readiness") < order.get("conditional-plan-design-review"));

  requireTerms("workflows/build-spec/SKILL.md", [
    "ui-project-init",
    "design-source-readiness",
    "Screen Read Map",
    "plan-design-review",
    "no gate",
    "unknown",
    "not_bindable",
  ]);
});

test("component quality has one conditional owner across plan, code, and verify", () => {
  const owner = dependency("build-plan", "frontend-component-quality");
  assert.ok(owner, "build-plan must own the Component Quality Map");
  assert.equal(owner.owner, "stage");
  assert.equal(owner.execution, "inline");
  assert.equal(owner.trigger, "ui_scope");

  const code = dependency("build-code", "frontend-component-quality");
  assert.ok(code, "build-code must consume component quality facts");
  assert.equal(code.owner, "stage");
  assert.equal(code.trigger, "actual_frontend_test");

  const verify = dependency("verify-code", "frontend-component-quality");
  assert.ok(verify, "verify-code must consume component quality facts");
  assert.equal(verify.owner, "stage");
  assert.equal(verify.trigger, "ui_acceptance");

  requireTerms("workflows/build-plan/SKILL.md", [
    "frontend-component-quality",
    "Component Quality Map",
    "real consumer",
    "state owner",
    "typed ViewModel",
    "CSS/token",
    "does not execute frontend-testing",
    "no gate",
  ]);
  requireTerms("workflows/build-code/SKILL.md", [
    "frontend-component-quality",
    "real consumer",
    "state owner",
    "frontend-testing",
  ]);
  requireTerms("workflows/verify-code/SKILL.md", [
    "frontend-component-quality",
    "real consumer",
    "state owner",
    "CSS/token",
  ]);
});

test("runtime and review contracts add UI fields without a new stage, gate, or material", () => {
  const stageContract = read("runtime/stage/stage-content-contracts.mjs");
  for (const field of [
    "ui_applicability",
    "ui_contract",
    "design_status",
    "missing_items",
    "fallback_visual_basis",
    "constraints",
    "assumptions",
    "rework_risk",
    "human_confirmation",
    "current_material_ref",
    "design_revision",
    "visible_labels",
    "preview_refs",
    "fixture_refs",
    "viewport_refs",
    "screenshot_refs",
    "page_or_region",
    "interaction_flow",
    "name",
    "visible_structure",
    "fixture_shape",
    "available_actions",
    "disabled_actions",
    "trigger",
    "recovery_or_exit",
    "permission_result",
    "responsive",
    "a11y",
    "preview_browser_screenshot_assertion",
    "component_quality_map",
    "real_consumer",
    "state_owner",
    "typed_view_model",
    "css_token_owner",
  ]) {
    assert.match(stageContract, new RegExp(field.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i"), `runtime missing ${field}`);
  }

  const materials = json("runtime/review/stage-materials.json");
  for (const stage of ["build-spec", "build-plan", "build-code", "verify-code"]) {
    const fields = Object.entries(materials.surfaces ?? {})
      .filter(([surface]) => surface === stage || surface.startsWith(`${stage}/`))
      .flatMap(([, surface]) => surface.semantic_fields ?? []);
    assert.ok(fields.includes("ui_contract"), `${stage} review materials must include ui_contract`);
    assert.ok(fields.includes("ui_applicability"), `${stage} review materials must include ui_applicability`);
  }
  assert.equal(Object.keys(materials.stages).filter((stage) => stage.startsWith("ui-")).length, 0, "no UI stage may be added");
  assert.equal(materials.version, "wh-review-stage-materials.v2");

  for (const path of [
    "workflows/make-decision/SKILL.md",
    "workflows/build-spec/SKILL.md",
    "workflows/build-plan/SKILL.md",
    "workflows/build-code/SKILL.md",
    "workflows/verify-code/SKILL.md",
  ]) {
    requireTerms(path, ["no new stage", "no gate"]);
  }
});

test("canonical namespaced ACs and legacy compact ACs share the parser", () => {
  const canonical = activeAcceptanceCriterionIds([
    "## Acceptance Criteria",
    "- **AC-UI-001**: trusted applicability facts are merged.",
    "- **AC-UI-011**: UI handoff remains observable.",
  ].join("\n"));
  const legacy = activeAcceptanceCriterionIds([
    "## Acceptance Criteria",
    "- **AC-001**: the old compact contract remains readable.",
    "- **AC-011**: the old handoff remains readable.",
  ].join("\n"));
  assert.deepEqual(canonical, ["AC-UI-001", "AC-UI-011"]);
  assert.deepEqual(legacy, ["AC-001", "AC-011"]);
});

test("design gaps remain unknown facts and never become a UI gate", () => {
  const unknown = alignUiDesignEvidence({
    uiContract: {
      design_status: "unknown",
      missing_items: [{ code: "DESIGN-SOURCE-MISSING", reason: "Design.md is unavailable" }],
      current_material_ref: "spec.md",
    },
    component_quality_map: [],
    consumer_facts: [],
  });
  assert.equal(unknown.status, "unknown");
  assert.equal(unknown.gate, false);
  assert.equal(unknown.continuation_allowed, true);
  assert.ok(unknown.gaps.some((entry) => entry.reason === "design_gap_unknown"));

  const missingOwner = alignUiDesignEvidence({
    uiContract: { design_status: "approved", current_material_ref: "spec.md" },
    component_quality_map: [{ action: "reuse", component: "Button", real_consumer: "settings-page" }],
    consumer_facts: [{ component: "Button", consumers: ["settings-page"] }],
  });
  assert.equal(missingOwner.gate, false);
  assert.ok(missingOwner.gaps.some((entry) => entry.reason === "component_quality_owner_missing"));

  const unknownConsumer = alignUiDesignEvidence({
    uiContract: { design_status: "approved", current_material_ref: "spec.md" },
    component_quality_map: [{ action: "add-local", component: "Button", real_consumer: { status: "unknown", reason: "scan unavailable" } }],
    consumer_facts: [],
  });
  assert.equal(unknownConsumer.gate, false);
  assert.ok(unknownConsumer.gaps.some((entry) => entry.reason === "component_quality_consumer_unknown"));
  assert.ok(unknownConsumer.gaps.some((entry) => entry.reason === "component_quality_story_test_missing"));
});

test("UI validators require state evidence, confirmation consistency, and component ownership facts", () => {
  const state = Object.fromEntries([
    ["name", "default"],
    ["interaction_flow", "open settings, edit a value, and submit"],
    ["visible_structure", "settings form"],
    ["fixture_shape", "settings-default"],
    ["available_actions", "save"],
    ["disabled_actions", "save while loading"],
    ["trigger", "click save"],
    ["recovery_or_exit", "retry or leave"],
    ["permission_result", "allowed"],
    ["responsive", "narrow view stacks actions and prevents horizontal overflow"],
    ["a11y", "Settings form has labelled controls, logical focus order, and keyboard submit"],
    ["preview_browser_screenshot_assertion", "preview matches screenshot"],
  ]);
  const validContract = {
    page_or_region: "settings-page",
    design_status: "ready",
    design_revision: "Design.md@v1",
    missing_items: [],
    fallback_visual_basis: "component fixture",
    constraints: ["reuse existing form"],
    assumptions: [],
    rework_risk: "none",
    human_confirmation: { result: "approved" },
    current_material_ref: "spec.md",
    visible_labels: ["Settings", "Save"],
    preview_refs: ["evidence/settings-preview"],
    fixture_refs: ["fixtures/settings-default"],
    viewport_refs: ["desktop-1440x900", "narrow-390x844"],
    screenshot_refs: ["evidence/settings.png"],
    states: [state],
  };
  assert.equal(validateUiContract(validContract).ok, true);
  assert.equal(validateUiContract({ ...validContract, page_or_region: undefined }).ok, false);
  assert.equal(validateUiContract({ ...validContract, states: [{ ...state, name: undefined }] }).ok, false);
  assert.equal(validateUiContract({ ...validContract, states: [{ ...state, interaction_flow: undefined }] }).ok, false);
  assert.equal(validateUiContract({ ...validContract, design_revision: "unknown" }).ok, false);
  assert.equal(validateUiContract({ ...validContract, design_revision: { path: "Design.md" } }).ok, false);
  assert.equal(validateUiContract({ ...validContract, states: [] }).ok, false);
  assert.equal(validateUiContract({ ...validContract, human_confirmation: { result: "acknowledged" } }).ok, false);
  assert.equal(validateUiContract({ ...validContract, design_revision: "" }).ok, false);
  assert.equal(validateUiContract({ ...validContract, preview_refs: [] }).ok, false);
  assert.equal(validateUiContract({ ...validContract, missing_items: [{ status: "unknown" }] }).ok, false);

  const owners = { component: "SettingsForm", state_owner: "settings-state", typed_view_model: "SettingsVm", css_token_owner: "tokens/forms" };
  assert.equal(validateComponentQualityMap([{ action: "modify", real_consumer: "settings-page", story_or_test_update: "settings.test.mjs", ...owners }]).ok, true);
  assert.equal(validateComponentQualityMap([{ action: "modify", real_consumer: "settings-page", story_or_test_update: "settings.test.mjs", ...owners, component: undefined }]).ok, false);
  assert.equal(validateComponentQualityMap([{ action: "modify", real_consumer: null, ...owners }]).ok, false);
  assert.equal(validateComponentQualityMap([{ action: "modify", real_consumers: ["settings-page", null], story_or_test_update: "settings.test.mjs", ...owners }]).ok, false);
  assert.equal(validateComponentQualityMap([{ action: "remove-after-no-consumers", real_consumer: "unknown", no_consumer_evidence: "scan", ...owners }]).ok, false);
  assert.equal(validateComponentQualityMap([{ action: "modify", real_consumer: { status: "unknown", reason: "consumer scan unavailable" }, story_or_test_update: "record risk", ...owners }]).ok, true);
  assert.ok(validateComponentQualityMap([{ action: "reuse", real_consumer: { status: "unknown", reason: "legacy consumer inventory unavailable" }, ...owners }]).risks.length > 0);
  assert.equal(validateComponentQualityMap([{ action: "extract-shared", real_consumers: ["settings-page", { status: "unknown", reason: "consumer scan unavailable" }], story_or_test_update: "SettingsForm.stories.tsx", ...owners }]).ok, true);
  assert.equal(validateComponentQualityMap([{ action: "extract-shared", real_consumers: ["settings-page", "settings-page"], story_or_test_update: "SettingsForm.stories.tsx", ...owners }]).ok, false);
  assert.equal(validateComponentQualityMap([{ action: "add-local", real_consumer: "settings-page", ...owners }]).ok, false);
  assert.equal(validateComponentQualityMap([{ action: "add-local", real_consumer: "settings-page", story_or_test_update: "SettingsForm.stories.tsx", ...owners }]).ok, true);
  assert.equal(validateComponentQualityMap([{ action: "remove-after-no-consumers", ...owners, component: undefined }]).ok, false);
  assert.equal(validateComponentQualityMap([{ action: "remove-after-no-consumers", no_consumer_evidence: "consumer scan 2026-08-22", ...owners }]).ok, true);
});

test("executable UI project init and Design.md readiness preserve unknown facts", () => {
  const initialized = buildUiProjectInitFact({
    mode: "new",
    design_path: "Design.md",
    design_revision: "2026.08",
    scope: "Settings page",
    component_boundary: "src/components/settings",
    style_boundary: "tokens/forms",
    fixture: "settings-default",
    viewport: "desktop-1440x900",
    preview: "stories/Settings.stories.tsx",
  });
  assert.equal(initialized.ok, true, initialized.errors.join("; "));
  assert.equal(initialized.status, "ready");
  assert.equal(initialized.design_revision, "2026.08");
  assert.equal(initialized.gate, false);

  const legacy = buildUiProjectInitFact({ mode: "legacy", project_inventory: { routes: ["/settings"] } });
  assert.equal(legacy.ok, true, legacy.errors.join("; "));
  assert.equal(legacy.status, "not_ready");
  assert.equal(legacy.design_revision.status, "unknown");
  assert.ok(legacy.missing_items.some((item) => item.code === "DESIGN-REVISION-MISSING"));
  assert.deepEqual(legacy.legacy_inventory.routes, ["/settings"]);
  assert.equal(legacy.legacy_inventory.coupling_risks.status, "unknown");
  assert.equal(legacy.gate, false);

  const inventoriedLegacy = buildUiProjectInitFact({
    mode: "legacy",
    design_path: "Design.md",
    design_revision: "legacy-2026.08",
    first_page: "Settings page",
    component_boundary: "src/components/settings",
    style_boundary: "src/styles/settings.css",
    fixture: "settings-default",
    viewport: "desktop-1440x900",
    preview: "stories/Settings.stories.tsx",
    project_inventory: {
      technology_stack: "React + Vite",
      routes: ["/settings"],
      css_side_effects: ["global body margin reset"],
      data_entrypoints: ["src/data/settings.ts"],
      component_candidates: ["SettingsForm"],
      testing_capability: ["Vitest", "Playwright"],
      baseline: "settings page renders before migration",
      legacy_exceptions: ["shared legacy form wrapper"],
      first_page_candidates: ["Settings page"],
      coupling_risks: ["global form CSS selector"],
      minimal_scope_reduction: "limit first iteration to /settings form",
    },
  });
  assert.equal(inventoriedLegacy.ok, true, inventoriedLegacy.errors.join("; "));
  assert.equal(inventoriedLegacy.status, "ready");
  assert.deepEqual(inventoriedLegacy.legacy_inventory.routes, ["/settings"]);
  assert.equal(inventoriedLegacy.legacy_inventory.minimal_scope_reduction, "limit first iteration to /settings form");

  const readiness = deriveDesignSourceReadiness({
    design_path: "Design.md",
    design_revision: "2026.08",
    expected_design_revision: "2026.08",
    sections: [{
      anchor: "settings",
      page_or_region: "Settings page",
      goal: "edit settings",
      primary_action: "Save",
      states: ["default", "loading", "error"],
      components: "SettingsForm",
      tokens: "tokens/forms",
      fixture: "settings-default",
      viewport: "desktop-1440x900",
      responsive: "stack actions on narrow viewport",
      a11y: "label controls and preserve focus order",
      evidence: "preview/settings",
    }],
  });
  assert.equal(readiness.ok, true, readiness.errors.join("; "));
  assert.equal(readiness.binding_state, "bindable");
  assert.equal(readiness.freshness.status, "matching");
  assert.equal(readiness.read_map[0].anchor, "settings");
  assert.deepEqual(readiness.missing_items, []);

  const stale = deriveDesignSourceReadiness({
    design_path: "Design.md",
    design_revision: "2026.09",
    expected_design_revision: "2026.08",
    content: "## Settings page",
  });
  assert.equal(stale.binding_state, "not_bindable");
  assert.equal(stale.freshness.status, "stale");
  assert.ok(stale.missing_items.some((item) => item.code === "DESIGN-REVISION-MISMATCH"));
  const missing = deriveDesignSourceReadiness({});
  assert.equal(missing.binding_state, "not_bindable");
  assert.equal(missing.gate, false);
  assert.ok(missing.missing_items.some((item) => item.code === "DESIGN-SOURCE-MISSING"));
});

test("executable short prompt and design-loop facts cover recovery states", () => {
  const prompt = buildShortUiDesignPrompt({
    page_or_region: "Settings page",
    interactions: ["edit field", "submit form"],
    states: ["default", "loading", "error"],
    visible_labels: ["Settings", "Save", "Retry"],
  });
  assert.equal(prompt.ok, true, prompt.errors.join("; "));
  assert.match(prompt.prompt, /^页面\/区域：Settings page/m);
  assert.match(prompt.prompt, /交互：edit field；submit form/);
  assert.match(prompt.prompt, /状态：default；loading；error/);
  assert.match(prompt.prompt, /可见 label：Settings、Save、Retry/);
  assert.doesNotMatch(prompt.prompt, /viewport|fixture|responsive|a11y|CSS/i);
  assert.equal(buildShortUiDesignPrompt({ page_or_region: "Settings" }).ok, false);

  const base = { current_material_ref: "spec.md" };
  assert.equal(validateUiDesignLoopFact({
    ...base,
    state: "preview_ready",
    preview_refs: ["quality/facts/settings-preview"],
    visible_actions: ["确认设计", "需要修改"],
  }).ok, true);
  assert.equal(validateUiDesignLoopFact({
    ...base,
    state: "preview_unavailable",
    reason: "no preview host",
    visible_actions: ["重新读取", "生成设计提示词", "继续并记录风险"],
  }).ok, true);
  assert.equal(validateUiDesignLoopFact({
    ...base,
    state: "design_prompt_ready",
    prompt: prompt.fields,
    prompt_text: prompt.prompt,
    visible_actions: ["取消"],
  }).ok, true);
  assert.equal(validateUiDesignLoopFact({
    ...base,
    state: "external_design_pending",
    prompt_ref: "quality/facts/settings-design-prompt",
    visible_actions: ["未返回", "取消"],
  }).ok, true);
  assert.equal(validateUiDesignLoopFact({
    ...base,
    state: "external_design_returned",
    design_ref: "external/Design.md",
    expected_design_revision: "2026.08",
    returned_design_revision: "2026.08",
    visible_actions: ["确认设计", "需要修改"],
  }).ok, true);
  for (const state of ["external_design_cancelled", "external_design_not_returned"]) {
    assert.equal(validateUiDesignLoopFact({
      ...base,
      state,
      reason: "user ended external design wait",
      preserves_current_contract: true,
      visible_actions: state === "external_design_cancelled" ? ["继续并记录风险"] : ["重新生成设计提示词", "继续并记录风险"],
    }).ok, true);
  }
  assert.equal(validateUiDesignLoopFact({
    ...base,
    state: "external_design_version_mismatch",
    expected_design_revision: "2026.08",
    returned_design_revision: "2026.07",
    reason: "returned Design.md is stale",
    preserves_current_contract: true,
    visible_actions: ["重新读取并确认"],
  }).ok, true);
  for (const [state, result] of [["human_approved", "approved"], ["human_acknowledged", "acknowledged"], ["human_not_approved", "not_approved"]]) {
    assert.equal(validateUiDesignLoopFact({
      ...base,
      state,
      human_confirmation: { result },
      continuation_allowed: true,
    }).ok, true);
  }
  assert.equal(validateUiDesignLoopFact({
    ...base,
    state: "external_design_returned",
    design_ref: "external/Design.md",
    expected_design_revision: "2026.08",
    returned_design_revision: "2026.07",
    visible_actions: ["确认设计", "需要修改"],
  }).ok, false);
  assert.equal(validateUiDesignLoopFact({ ...base, state: "preview_ready", preview_refs: ["preview"], gate: true, visible_actions: ["确认设计", "需要修改"] }).ok, false);
});
