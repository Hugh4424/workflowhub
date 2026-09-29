// CARD-04 / P8 / T017: the original prewritten bytes and target RED are archived;
// this authorized test-only revision adds the P9..P12 evolution counterexample.
// The catalog is a product artifact, not an execution ledger. Only explicit, sourced
// edges are machine discoverable; uncharted legacy behavior remains unknown.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));
const catalogPath = resolve(root, "docs/quality/business-case-catalog.json");
const actualSources = [
  "specs/workflowhub-thin-core-card-04-20260919/decision-log.md",
  "specs/workflowhub-thin-core-card-04-20260919/spec.md",
  "tests/contract/decision-log-census.test.mjs",
  "tests/contract/census-upstream-authoring.test.mjs",
  "tests/contract/acceptance-result-machine-classes.test.mjs",
  "tests/deferred-acceptance-semantics.test.mjs",
];
const actualTargets = [
  "tests/contract/decision-log-census.test.mjs",
  "tests/contract/acceptance-result-machine-classes.test.mjs",
  "tests/deferred-acceptance-semantics.test.mjs",
];
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;

function checkCase(entry, caseId) {
  expect(entry.id).toBe(caseId);
  expect(["feature", "regression"]).toContain(entry.intent);
  expect(entry.status).toBe("active");
  expect(nonempty(entry.owner)).toBe(true);
  expect(nonempty(entry.source.path)).toBe(true);
  expect(existsSync(resolve(root, entry.source.path))).toBe(true);
  expect(nonempty(entry.source.revision)).toBe(true);
  expect(nonempty(entry.rule.id)).toBe(true);
  expect(nonempty(entry.rule.revision)).toBe(true);
  expect(nonempty(entry.rule.statement)).toBe(true);
  for (const name of ["normal", "failure", "boundary", "recovery"]) {
    const scenario = entry.scenarios[name];
    expect(nonempty(scenario.precondition), `${caseId}/${name} precondition`).toBe(true);
    expect(nonempty(scenario.input), `${caseId}/${name} input`).toBe(true);
    expect(nonempty(scenario.observable_success), `${caseId}/${name} success`).toBe(true);
    expect(nonempty(scenario.observable_failure), `${caseId}/${name} counterexample`).toBe(true);
  }
  for (const key of ["risk", "environment", "change_triggers", "implementation_interfaces", "consumers", "related_case_ids", "ac_ids", "task_ids", "phase_ids"]) {
    expect(own(entry, key), `${caseId} missing ${key}`).toBe(true);
  }
  expect(nonempty(entry.risk)).toBe(true);
  expect(nonempty(entry.environment)).toBe(true);
  for (const key of ["change_triggers", "implementation_interfaces", "consumers", "ac_ids", "task_ids", "phase_ids"]) {
    expect(Array.isArray(entry[key]) && entry[key].length > 0, `${caseId} empty ${key}`).toBe(true);
    expect(entry[key].every(nonempty), `${caseId} invalid ${key}`).toBe(true);
  }
  expect(Array.isArray(entry.related_case_ids)).toBe(true); // [] explicitly means no registered edge, not inferred coverage.
  expect(nonempty(entry.execution.target)).toBe(true);
  expect(existsSync(resolve(root, entry.execution.target)), `${caseId} target missing`).toBe(true);
  expect(nonempty(entry.execution.runner_identity)).toBe(true);
  expect(nonempty(entry.execution.command)).toBe(true);
  expect(entry.execution.command).toBe(`npx vitest run ${entry.execution.target}`);
  expect(["automatic", "manual_unavailable"]).toContain(entry.execution.mode);
  expect(nonempty(entry.execution.expected_test_identity)).toBe(true);
}

describe("CARD-04 business-case catalog: explicit sourced business relationships", () => {
  it("materializes a versioned, machine-readable catalog with real CARD-04 and affected regression cases", () => {
    // Behavioral target assertion, not a top-level JSON import: when the product
    // catalog does not yet exist, Vitest collects this test and THIS assertion is RED.
    expect(existsSync(catalogPath), "ORACLE-BUSINESS-CASE-CATALOG: catalog is missing").toBe(true);
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    expect(catalog.schema).toBe("workflowhub-business-case-catalog.v1");
    expect(catalog.project).toBe("workflowhub");
    expect(nonempty(catalog.revision)).toBe(true);
    expect(nonempty(catalog.owner)).toBe(true);
    expect(catalog.consumers).toEqual(expect.arrayContaining(["P9", "P10"]));
    expect(nonempty(catalog.retirement_policy)).toBe(true);
    expect(catalog.uncharted_legacy.status).toBe("unknown");
    expect(nonempty(catalog.uncharted_legacy.reason)).toBe(true);
    expect(nonempty(catalog.uncharted_legacy.owner)).toBe(true);
    expect(Array.isArray(catalog.cases)).toBe(true);
    const cases = new Map(catalog.cases.map((entry) => [entry.id, entry]));
    expect(cases.size).toBe(catalog.cases.length); // no duplicate IDs silently shadowing relationships

    // Independent anchors from current task/regrression sources, NOT a fabricated
    // all-legacy inventory: do not claim coverage for any source not registered here.
    const census = cases.get("CARD04-DECISION-LOG-CENSUS");
    const acceptance = cases.get("CARD04-ACCEPTANCE-MACHINE-CLASSES");
    const deferred = cases.get("CARD04-DEFERRED-ACCEPTANCE-REGRESSION");
    for (const [id, entry] of [
      ["CARD04-DECISION-LOG-CENSUS", census],
      ["CARD04-ACCEPTANCE-MACHINE-CLASSES", acceptance],
      ["CARD04-DEFERRED-ACCEPTANCE-REGRESSION", deferred],
    ]) checkCase(entry, id);
    expect(census.intent).toBe("feature");
    expect(census.execution.target).toBe("tests/contract/decision-log-census.test.mjs");
    expect(census.ac_ids).toContain("AC-26");
    expect(census.change_triggers).toContain("specs/workflowhub-thin-core-card-04-20260919/decision-log.md");
    expect(acceptance.execution.target).toBe("tests/contract/acceptance-result-machine-classes.test.mjs");
    expect(acceptance.ac_ids).toContain("AC-27");
    expect(deferred.intent).toBe("regression");
    expect(deferred.execution.target).toBe("tests/deferred-acceptance-semantics.test.mjs");
    expect(acceptance.related_case_ids).toContain(deferred.id);
    expect(deferred.related_case_ids).toContain(acceptance.id);
    expect(acceptance.change_triggers).toContain("runtime/evidence/freshness.mjs");
    expect(deferred.consumers).toContain("runtime/evidence/freshness.mjs");

    // Inventory of named source/target paths is independently resolvable; an
    // existing test file without a case edge is NOT automatically business coverage.
    for (const path of [...actualSources, ...actualTargets]) {
      expect(existsSync(resolve(root, path)), `source/target missing: ${path}`).toBe(true);
    }
    const allTargets = new Set(catalog.cases.map((entry) => entry.execution.target));
    for (const target of actualTargets) expect(allTargets.has(target), `unmapped affected target ${target}`).toBe(true);
    for (const entry of catalog.cases) {
      checkCase(entry, entry.id);
      for (const related of entry.related_case_ids) expect(cases.has(related), `${entry.id} stale edge ${related}`).toBe(true);
    }
    expect(catalog.uncharted_legacy.status).not.toBe("covered");
  });

  it("does not let three P6/P7 seeds conceal the sourced P9..P12 B2 obligations", () => {
    // These are real, existing CONTRACT targets, not authenticated business
    // cases. A fixture's random CASE-* ID or P11's CASE-BROWSER-001 must not
    // become a project business ID without a rule and real consumer review.
    expect(existsSync(catalogPath), "ORACLE-BUSINESS-CASE-CATALOG: B2 evolution is missing with catalog").toBe(true);
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    const obligations = catalog.evolution?.phase_obligations;
    expect(Array.isArray(obligations), "ORACLE-BUSINESS-CASE-CATALOG: missing P9..P12 evolution obligations").toBe(true);
    const expected = [
      ["P9", "T018", "tests/contract/build-code-change-scope.test.mjs", "workflows/build-code/capture.mjs", "AC-32", "not_implemented", "workflows/build-code/capture.mjs"],
      ["P9", "T019", "tests/contract/build-code-test-inventory.test.mjs", "workflows/build-code/capture.mjs", "AC-30", "not_implemented", "workflows/build-code/capture.mjs"],
      ["P10", "T020", "tests/contract/build-code-case-selection.test.mjs", "workflows/build-code/case-selection.mjs", "AC-32", "not_implemented", "workflows/build-code/case-selection.mjs"],
      ["P10", "T020", "tests/contract/build-code-targeted-runner.test.mjs", "workflows/build-code/targeted-runner.mjs", "AC-32", "not_implemented", "workflows/build-code/targeted-runner.mjs"],
      ["P10", "T021", "tests/contract/build-code-case-reconciliation.test.mjs", "workflows/build-code/case-reconciliation.mjs", "AC-33", "not_implemented", "workflows/build-code/case-reconciliation.mjs"],
      ["P11", "T022", "tests/contract/post-business-browser-reconciliation.test.mjs", "runtime/stage/stage-content-contracts.mjs", "AC-32", "unknown", "tests/contract/post-business-browser-reconciliation.test.mjs"],
      ["P12", "T023", "tests/contract/verify-code-business-handoff.test.mjs", "workflows/verify-code/SKILL.md", "AC-34", "test_only", "workflows/verify-code/SKILL.md"],
    ];
    const keys = obligations.map(({ phase_id, task_id, test_target }) => `${phase_id}/${task_id}/${test_target}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.sort()).toEqual(expected.map(([phase, task, target]) => `${phase}/${task}/${target}`).sort());
    const active = new Map(catalog.cases.map((entry) => [entry.id, entry]));
    for (const [phase, task, target, consumer, ac, consumerStatus, trigger] of expected) {
      const entry = obligations.find((item) => item.phase_id === phase && item.task_id === task && item.test_target === target);
      expect(["not_done", "active"]).toContain(entry.status);
      expect(nonempty(entry.owner), `${phase}/${task} needs a named maintenance owner`).toBe(true);
      expect(nonempty(entry.impact), `${phase}/${task} needs an explicit coverage impact`).toBe(true);
      expect(entry.promotion_trigger, `${phase}/${task} needs source, real consumer and runner-oracle proof`).toMatch(/source.*consumer.*runner.*oracle/i);
      if (entry.status === "not_done") {
        expect(entry.case_id, `${phase}/${task}: no authenticated B2 business case ID yet`).toBe(null);
        expect(entry.business_rule_status, `${phase}/${task}: contract fixture is not an authenticated business rule`).toBe("unknown");
      } else {
        expect(nonempty(entry.case_id), `${phase}/${task} active case needs a stable ID`).toBe(true);
        const registered = active.get(entry.case_id);
        checkCase(registered, entry.case_id);
        expect(registered.execution.target).toBe(target);
        expect(registered.ac_ids).toContain(ac);
        expect(registered.task_ids).toContain(task);
        expect(registered.phase_ids).toContain(phase);
        expect(registered.change_triggers).toContain(trigger);
        expect(registered.consumers).toContain(consumer);
        expect(entry.business_rule_status).toBe("verified");
        expect(nonempty(entry.independent_review_ref), `${phase}/${task} needs a real independent review ref`).toBe(true);
        expect(existsSync(resolve(root, entry.independent_review_ref)), `${phase}/${task} review ref missing`).toBe(true);
      }
      expect(entry.ac_ids).toContain(ac);
      expect(entry.source_path).toBe(`specs/workflowhub-thin-core-card-04-20260919/phases/${phase}.md`);
      expect(entry.consumer_path).toBe(consumer);
      expect(entry.consumer_status).toBe(entry.status === "active" ? "verified" : consumerStatus);
      expect(entry.change_trigger, `${phase}/${task} needs a sourced change trigger`).toBe(trigger);
      for (const path of [entry.source_path, entry.test_target, entry.consumer_path, entry.change_trigger]) {
        expect(existsSync(resolve(root, path)), `sourced B2 obligation missing path ${path}`).toBe(true);
      }
      if (entry.status === "not_done") expect(active.has(entry.case_id), "unknown case IDs cannot imply active coverage").toBe(false);
    }
    const unresolved = obligations.filter((entry) => entry.status === "not_done");
    expect(unresolved.length, "a three-seed catalog must not erase the currently unproved B2 relations").toBeGreaterThan(0);
    expect(obligations.filter((entry) => entry.phase_id === "P11" || entry.phase_id === "P12").every((entry) => entry.status === "not_done"),
      "hypothetical browser fixtures and verify-code text are not authenticated business cases").toBe(true);
    expect(catalog.evolution.unmapped_b2_status).toBe("unknown");
    expect(nonempty(catalog.evolution.owner)).toBe(true);
    expect(nonempty(catalog.evolution.impact)).toBe(true);
    expect(nonempty(catalog.evolution.promotion_policy)).toBe(true);
    expect(catalog.uncharted_legacy.status).toBe("unknown");
  });
});
