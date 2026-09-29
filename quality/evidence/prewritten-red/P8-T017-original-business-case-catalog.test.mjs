// CARD-04 / P8 / T017: build-plan prewritten contract; freeze after the target RED.
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
});
