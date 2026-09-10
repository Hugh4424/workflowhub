import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { deriveStatusGroups } from "../../tools/cli/stage-runtime.mjs";

const inventoryPath = join(process.cwd(), "docs/architecture/control-plane-inventory.json");

describe("control-plane inventory", () => {
  it("records responsibility, consumers, ownership and deletion conditions", () => {
    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
    expect(inventory.schema_version).toBe("workflowhub-control-plane-inventory.v1");
    expect(inventory.owner).toBeTruthy();
    expect(inventory.consumer).toBeTruthy();
    expect(inventory.delete_condition).toBeTruthy();
    expect(inventory.controls.length).toBeGreaterThanOrEqual(5);
    expect(inventory.controls.map((control) => control.id)).toEqual(expect.arrayContaining(["research-report", "stage-handoff"]));
    for (const control of inventory.controls) {
      for (const key of ["id", "producer", "consumer", "owner", "effect", "disposition", "delete_condition", "evidence"]) {
        expect(control[key], `${control.id}.${key}`).toBeTruthy();
      }
    }
  });

  it("keeps the frozen 21 skip dispositions auditable", () => {
    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
    expect(inventory.skip_dispositions).toHaveLength(21);
    const counts = Object.groupBy(inventory.skip_dispositions, (entry) => entry.disposition);
    expect(counts.retire_with_replacement).toHaveLength(15);
    expect(counts.defer).toHaveLength(6);
    expect(counts.restore ?? []).toHaveLength(0);
    for (const entry of inventory.skip_dispositions) {
      expect(entry.file).toBe("tests/final-cutover-guards.red.test.mjs");
      expect(entry.line).toEqual(expect.any(Number));
      expect(entry.owner).toBeTruthy();
      expect(entry.consumer).toBeTruthy();
      expect(entry.delete_condition).toBeTruthy();
      if (entry.disposition === "defer") expect(entry.replacement).toBeNull();
      else expect(entry.replacement).toBeTruthy();
    }
  });

  it("keeps acceptance IDs distinct and does not relabel release gaps as quality", () => {
    const groups = deriveStatusGroups({
      stage: "verify-code",
      quality: { missing: [] },
      productRelease: { reasons: ["acceptance_result_not_pass:AC-001", "acceptance_result_not_pass:AC-002"] },
    });
    expect(groups.gap_groups).toEqual([
      expect.objectContaining({
        root_cause_id: "acceptance_result_not_pass:AC-001",
        source_layer: "release",
        owner: "stage-runtime",
        derived_views: ["release", "close"],
        gaps: ["acceptance_result_not_pass:AC-001"],
      }),
      expect.objectContaining({
        root_cause_id: "acceptance_result_not_pass:AC-002",
        source_layer: "release",
        owner: "stage-runtime",
        derived_views: ["release", "close"],
        gaps: ["acceptance_result_not_pass:AC-002"],
      }),
    ]);
  });
});
