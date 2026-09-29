import { describe, expect, it } from "vitest";
import { projectPostPhaseAcceptanceExecutionData } from "../../runtime/stage/stage-content-contracts.mjs";

// P11/T022 prewritten counterexample at the existing post Phase acceptance projection seam.
// This is not a browser run or a browser adapter: it proves whether the official
// post acceptance source can represent a browser scenario for an affected AC.
// Use P1 as the minimal valid consecutive Phase index; the tested behavior is P11's
// proposed post-browser seam, not the index's unrelated ordered-ID requirement.
const INDEX = "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n";
const SERVICE_EXECUTION = {
  module_ref: "tests/acceptance/current-service.mjs",
  export_name: "run",
  input: { case_id: "CASE-BROWSER-001" },
  timeout_ms: 5000,
};
const BROWSER_EXECUTION = {
  module_ref: "tests/acceptance/current-browser.mjs",
  export_name: "run",
  input: { case_id: "CASE-BROWSER-001" },
  timeout_ms: 5000,
};

function project(tier, execution) {
  const scenario = {
    source: "CASE-BROWSER-001: changed backend response is consumed by the real settings page",
    sample: "current authenticated settings service and page",
    scenario: "saving valid settings changes the visible page; a rejected request leaves the saved state unchanged",
    tier,
    execution,
  };
  const phase = [
    "# Phase P1 — backend-to-browser business acceptance fixture",
    "## L1 — acceptance",
    "### T022 — reconcile affected settings consumer",
    "- **Source / FR / AC**：R-016 / FR-31 / AC-31 / FR-32 / AC-32 / FR-33 / AC-33",
    "- **acceptance_role**：acceptance",
    `- **acceptance_data**：\`${JSON.stringify([scenario])}\``,
  ].join("\n");
  return projectPostPhaseAcceptanceExecutionData({
    index: INDEX,
    phases: { "phases/P1.md": phase },
    spec: "# Settings acceptance\n\nAC-31: layer design. AC-32: real settings browser consumer must be executed. AC-33: each affected case must reconcile.\n",
  });
}

describe("P11/T022 post business browser acceptance representation", () => {
  it("accepts the same indexed post AC and scenario as a service-tier control", () => {
    const result = project("service", SERVICE_EXECUTION);
    expect(result.errors).toEqual([]);
    expect(result).toMatchObject({ status: "ready", eligible_for_pass: true });
    expect(result.scenarios).toHaveLength(1);
    expect(result.scenarios[0]).toMatchObject({ tier: "service", acceptance_criterion_ids: ["AC-31", "AC-32", "AC-33"] });
  });

  it("does not reject browser-tier acceptance for an AC with a real backend-to-page consumer", () => {
    const result = project("browser", BROWSER_EXECUTION);
    expect(result.errors).toEqual([]);
    expect(result).toMatchObject({ status: "ready", eligible_for_pass: true });
    expect(result.scenarios).toHaveLength(1);
    expect(result.scenarios[0]).toMatchObject({ tier: "browser", acceptance_criterion_ids: ["AC-31", "AC-32", "AC-33"] });
  });
});
