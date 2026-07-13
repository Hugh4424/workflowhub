import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { validateEntryPayload, validateExitPayload } from "../core/receipt-schema.mjs";
import { validateAllStageManifests } from "../core/step-manifest.mjs";

const identity = {
  workflow_run_id: "run-p1-contract",
  stage_slug: "build-code",
  step_id: 1,
  attempt_id: "attempt-1",
  manifest_schema_version: "2.0.0",
  timestamp: "2026-07-13T00:00:00.000Z",
};

describe("P1 canonical manifest and receipt boundary", () => {
  it("accepts the long stage and integer manifest step identity", () => {
    expect(() => validateEntryPayload({
      ...identity,
      event_type: "step_entry",
      entry_evidence: { kind: "manifest", uri_or_path: "workflows/build-code/steps.json" },
    })).not.toThrow();
  });

  it("requires an exit to bind the entry journal id from its own attempt", () => {
    expect(() => validateExitPayload({
      ...identity,
      event_type: "step_exit",
      terminal_status: "success",
      entry_journal_entry_id: "entry-1",
      completion_evidence: { kind: "test", uri_or_path: "evidence/green.json" },
    })).not.toThrow();
    expect(() => validateExitPayload({
      ...identity,
      event_type: "step_exit",
      terminal_status: "success",
      completion_evidence: { kind: "test", uri_or_path: "evidence/green.json" },
    })).toThrow("entry_journal_entry_id");
  });

  it.each([
    ["short legacy stage", { ...identity, stage_slug: "bc" }],
    ["string legacy step id", { ...identity, step_id: "bc.work.ph1" }],
    ["missing manifest version", (() => { const value = { ...identity }; delete value.manifest_schema_version; return value; })()],
  ])("rejects %s with migration guidance", (_label, invalidIdentity) => {
    expect(() => validateEntryPayload({
      ...invalidIdentity,
      event_type: "step_entry",
      entry_evidence: { kind: "manifest", uri_or_path: "workflows/build-code/steps.json" },
    })).toThrow(/LEGACY_FIELDS_MISSING|migration_hint/);
  });

  it("makes all 34 declared steps v2 long-stage integer identities", () => {
    const result = validateAllStageManifests(new URL("..", import.meta.url).pathname);
    expect(result).toEqual({ ok: true, errors: [] });

    const counts = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]
      .map((stage) => JSON.parse(readFileSync(new URL(`../workflows/${stage}/steps.json`, import.meta.url), "utf8")).steps.length);
    expect(counts.reduce((total, count) => total + count, 0)).toBe(34);
  });
});
