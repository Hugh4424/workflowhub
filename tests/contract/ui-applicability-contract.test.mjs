import { describe, expect, it } from "vitest";
import { buildStageInputPacket, verifyStageInputPacket } from "../../runtime/task/material-workspace.mjs";
import { readUiApplicabilityFromDecisionLog, validateUiApplicability } from "../../runtime/stage/stage-content-contracts.mjs";

const source = (conclusion) => ({ conclusion, reason: `fixture ${conclusion}` });
const valid = (result = "non_ui") => ({
  result,
  sources: {
    raw_requirement: source(result),
    project_inventory: source(result),
    planned_or_changed_frontend_fact: source(result),
  },
  ...(result === "unknown" ? { reason: "source facts conflict", handoff: "make-decision user clarification" } : {}),
});

describe("structured UI applicability contract", () => {
  it("derives non_ui from three explicit source conclusions", () => {
    expect(validateUiApplicability(valid())).toMatchObject({ ok: true, derived_result: "non_ui", source_results: ["non_ui", "non_ui", "non_ui"] });
  });

  it("keeps conflict and missing source facts non-passing", () => {
    const conflict = valid("unknown");
    conflict.result = "non_ui";
    conflict.sources.raw_requirement = source("non_ui");
    conflict.sources.project_inventory = source("ui");
    conflict.sources.planned_or_changed_frontend_fact = source("non_ui");
    expect(validateUiApplicability(conflict)).toMatchObject({ ok: false, derived_result: "unknown" });
    const missing = readUiApplicabilityFromDecisionLog("# Decision\n\n## UI applicability\n\nplain prose only\n");
    expect(missing).toMatchObject({ status: "missing", applicability: "unknown" });
  });

  it("rejects a free-text source and gate-shaped applicability", () => {
    expect(validateUiApplicability({ result: "non_ui", gate: true, sources: {
      raw_requirement: "non_ui", project_inventory: "non_ui", planned_or_changed_frontend_fact: "non_ui",
    } })).toMatchObject({ ok: false });
  });

  it("builds and verifies the production packet with a derived file identity", () => {
    const packet = buildStageInputPacket({
      task_id: "ui-contract-task", stage: "build-spec", material_revision: `revision-${"a".repeat(64)}`, snapshot_tree: "b".repeat(40),
      source_materials: { "decision-log": "## UI applicability\n" + JSON.stringify(valid()) + "\n" },
      derived_files: [{ path: "derived/ui-applicability.json", content: JSON.stringify(valid()), producer: "stage-content-contracts", consumer: "build-spec" }],
    });
    expect(verifyStageInputPacket(packet)).toMatchObject({ ok: true });
    expect(packet.manifest.derived_files[0]).toMatchObject({ authority: "non-material", producer: "stage-content-contracts", consumer: "build-spec" });
  });
});
