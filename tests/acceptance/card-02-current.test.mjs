import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  ACCEPTANCE_CRITERIA,
  NON_ACHIEVED_READBACKS,
  TEST_ASSERTIONS,
  deriveCard02Entries,
  evaluateCard02PostPhaseEvidence,
} from "./card-02-current.mjs";

const liveRoot = resolve("specs/workflowhub-thin-core-card-07-20260919");
function livePostMaterials() {
  const phases = Object.fromEntries(readdirSync(resolve(liveRoot, "phases"))
    .filter((name) => /^P[0-9]+\.md$/.test(name))
    .map((name) => [`phases/${name}`, readFileSync(resolve(liveRoot, "phases", name), "utf8")]));
  return { spec: readFileSync(resolve(liveRoot, "spec.md"), "utf8"), index: readFileSync(resolve(liveRoot, "phases/index.md"), "utf8"), phases,
    legacyFiles: ["plan.md", "tasks.md"].filter((name) => existsSync(resolve(liveRoot, name))) };
}

function successfulResults({ omit = null } = {}) {
  const reports = Array.from({ length: 1 }, () => []);
  const observations = [...Object.values(TEST_ASSERTIONS), ...Object.values(NON_ACHIEVED_READBACKS).map(({ assertion }) => assertion).filter(Boolean)];
  for (const observation of observations) {
    if (observation.file) {
      if (observation.test !== omit) reports[observation.commandIndex].push(` ✓ ${observation.file} > named suite > ${observation.test}`);
    }
  }
  return reports.map((files, index) => ({
    exit_code: 0, signal: null, error: null, timed_out: false,
    stdout: files.join("\n"),
  }));
}

const currentMaterials = Object.values(NON_ACHIEVED_READBACKS)
  .flatMap(({ materialMarkers }) => materialMarkers ?? [])
  .join("\n");

describe("CARD-02 current acceptance producer", () => {
  it("validates independent post Phase files and rejects missing authority", () => {
    const sample = livePostMaterials();
    expect(evaluateCard02PostPhaseEvidence(sample).ok).toBe(true);
    const missing = { ...sample, phases: { ...sample.phases } };
    delete missing.phases["phases/P2.md"];
    expect(evaluateCard02PostPhaseEvidence(missing).ok).toBe(false);
  });

  it("rejects index body copy and missing pointer", () => {
    const sample = livePostMaterials();
    expect(evaluateCard02PostPhaseEvidence({ ...sample, index: sample.index.replace("`phases/P2.md`", "`phases/MISSING.md`") }).ok).toBe(false);
    expect(evaluateCard02PostPhaseEvidence({ ...sample, index: `${sample.index}\n\`gate_cmd\`: \`npm test\`\n` }).ok).toBe(false);
  });

  it("rejects post plan/tasks dual write and unindexed phases", () => {
    const sample = livePostMaterials();
    expect(evaluateCard02PostPhaseEvidence({ ...sample, legacyFiles: ["plan.md", "tasks.md"] }).ok).toBe(false);
    expect(evaluateCard02PostPhaseEvidence({ ...sample, phases: { ...sample.phases, "phases/P9.md": "extra" } }).ok).toBe(false);
  });
  it("derives every declared AC from an observed child assertion or current boundary readback", () => {
    const entries = deriveCard02Entries({ results: successfulResults(), taskMaterials: currentMaterials, postPhaseEvidence: { ok: true, errors: [] } });
    expect(entries.map(({ acceptance_criterion_id }) => acceptance_criterion_id)).toEqual(ACCEPTANCE_CRITERIA);
    expect(entries.filter(({ outcome }) => outcome === "achieved")).toHaveLength(0);
    expect(entries.filter(({ outcome }) => outcome === "incomplete")).toHaveLength(18);
    expect(entries.filter(({ outcome }) => outcome === "deferred").map(({ acceptance_criterion_id }) => acceptance_criterion_id)).toEqual(["AC-TEST-004", "AC-REVIEW-003"]);
    expect(entries.filter(({ outcome }) => outcome === "unavailable").map(({ acceptance_criterion_id }) => acceptance_criterion_id)).toEqual(["AC-REVIEW-001", "AC-REVIEW-002"]);
  });

  it("keeps DOC-003/004 structural checks without claiming their full original acceptance", () => {
    const entries = deriveCard02Entries({ results: successfulResults(), taskMaterials: currentMaterials,
      postPhaseEvidence: { ok: true, errors: [] } });
    for (const [id, missingProof] of [["AC-DOC-003", "independent weak-model implementation cold read"],
      ["AC-DOC-004", "real index-reader consumer"]]) {
      expect(entries.find((entry) => entry.acceptance_criterion_id === id)).toMatchObject({
        outcome: "incomplete", owner: "CARD-02", reason: expect.stringContaining(missingProof),
        assertions: expect.arrayContaining([
          { id: `${id}:${TEST_ASSERTIONS[id].test}`, expected: { status: "passed" }, actual: { status: "passed" } },
          { id: `${id}:physical-post-phase-readback`, expected: { status: "passed" }, actual: { status: "passed" } },
          { id: `${id}:original-acceptance-proof`, expected: { status: "passed" }, actual: { status: "missing" } },
        ]),
      });
    }
  });

  it("does not turn a green command group into an achieved AC when its named assertion is absent", () => {
    const entries = deriveCard02Entries({
      results: successfulResults({ omit: TEST_ASSERTIONS["AC-DOC-003"].test }),
      taskMaterials: currentMaterials,
      postPhaseEvidence: { ok: true, errors: [] },
    });
    expect(entries.find(({ acceptance_criterion_id }) => acceptance_criterion_id === "AC-DOC-003")).toMatchObject({
      outcome: "incomplete", owner: "T011", reason: expect.stringContaining("named current-snapshot assertion"),
      assertions: expect.arrayContaining([{ id: expect.any(String), expected: { status: "passed" }, actual: { status: "missing" } }]),
    });
  });

  it("keeps original CARD-02 Phase ACs incomplete when current physical materials are missing", () => {
    const entries = deriveCard02Entries({ results: successfulResults(), taskMaterials: currentMaterials,
      postPhaseEvidence: { ok: false, errors: ["phases/P2.md missing"] } });
    for (const id of ["AC-DOC-003", "AC-DOC-004"]) {
      expect(entries.find((entry) => entry.acceptance_criterion_id === id)).toMatchObject({
        outcome: "incomplete", reason: expect.stringContaining("phases/P2.md missing"),
        original_requirement: expect.stringContaining("R-002/AC-08"),
      });
    }
    expect(entries.find((entry) => entry.acceptance_criterion_id === "AC-FLOW-003")).toMatchObject({
      outcome: "incomplete", original_requirement: expect.stringContaining("R-002/AC-09"),
    });
  });

  it("does not promote unrelated passing checks into original CARD-02 AC completion", () => {
    const entries = deriveCard02Entries({ results: successfulResults(), taskMaterials: currentMaterials,
      postPhaseEvidence: { ok: true, errors: [] } });
    for (const id of ["AC-DOC-005", "AC-TEST-001", "AC-TEST-002", "AC-AUTH-002", "AC-FLOW-002", "AC-HANDOFF-001"]) {
      expect(entries.find((entry) => entry.acceptance_criterion_id === id)?.outcome, id).toBe("incomplete");
      expect(TEST_ASSERTIONS).not.toHaveProperty(id);
      expect(NON_ACHIEVED_READBACKS).toHaveProperty(id);
    }
  });
});
