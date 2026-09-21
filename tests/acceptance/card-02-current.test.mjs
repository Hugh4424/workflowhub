import { describe, expect, it } from "vitest";

import {
  ACCEPTANCE_CRITERIA,
  NON_ACHIEVED_READBACKS,
  TEST_ASSERTIONS,
  deriveCard02Entries,
} from "./card-02-current.mjs";

function successfulResults({ omit = null } = {}) {
  const reports = Array.from({ length: 5 }, () => []);
  const observations = [...Object.values(TEST_ASSERTIONS), ...Object.values(NON_ACHIEVED_READBACKS).map(({ assertion }) => assertion)];
  for (const observation of observations) {
    if (observation.file) {
      if (observation.test !== omit) reports[observation.commandIndex].push(` ✓ ${observation.file} > named suite > ${observation.test}`);
    }
  }
  return reports.map((files, index) => ({
    exit_code: 0, signal: null, error: null, timed_out: false,
    stdout: index === 3
      ? `✔ ${TEST_ASSERTIONS["AC-COVER-002"].test} (1ms)\n`
      : files.join("\n"),
  }));
}

const currentMaterials = Object.values(NON_ACHIEVED_READBACKS)
  .flatMap(({ materialMarkers }) => materialMarkers)
  .join("\n");

describe("CARD-02 current acceptance producer", () => {
  it("derives every declared AC from an observed child assertion or current boundary readback", () => {
    const entries = deriveCard02Entries({ results: successfulResults(), taskMaterials: currentMaterials });
    expect(entries.map(({ acceptance_criterion_id }) => acceptance_criterion_id)).toEqual(ACCEPTANCE_CRITERIA);
    expect(entries.filter(({ outcome }) => outcome === "achieved")).toHaveLength(18);
    expect(entries.filter(({ outcome }) => outcome === "deferred").map(({ acceptance_criterion_id }) => acceptance_criterion_id)).toEqual(["AC-TEST-004", "AC-REVIEW-003"]);
    expect(entries.filter(({ outcome }) => outcome === "unavailable").map(({ acceptance_criterion_id }) => acceptance_criterion_id)).toEqual(["AC-REVIEW-001", "AC-REVIEW-002"]);
  });

  it("does not turn a green command group into an achieved AC when its named assertion is absent", () => {
    const entries = deriveCard02Entries({
      results: successfulResults({ omit: TEST_ASSERTIONS["AC-DOC-001"].test }),
      taskMaterials: currentMaterials,
    });
    expect(entries.find(({ acceptance_criterion_id }) => acceptance_criterion_id === "AC-DOC-001")).toMatchObject({
      outcome: "incomplete", owner: "T011", reason: expect.stringContaining("named current-snapshot assertion"),
      assertions: [{ expected: { status: "passed" }, actual: { status: "missing" } }],
    });
  });
});
