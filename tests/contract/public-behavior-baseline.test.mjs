import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import {
  COMPARISON_CLASSES,
  classifyComparison,
  collectBehaviorEvidence,
} from "../../tools/architecture/public-behavior-baseline.mjs";

const baseline = JSON.parse(readFileSync("tests/fixtures/public-behavior-baseline/v1/baseline.json", "utf8"));
const candidate = JSON.parse(readFileSync("tests/fixtures/public-behavior-baseline/v1/candidate.json", "utf8"));

describe("public behavior baseline", () => {
  let evidence;

  beforeAll(() => {
    // The live collector is an explicit architecture probe. Keep the normal suite
    // bounded and run the 14 isolated CLI cases only when requested.
    evidence = process.env.WORKFLOWHUB_LIVE_PUBLIC_BEHAVIOR === "1"
      ? collectBehaviorEvidence(process.cwd())
      : candidate;
  });

  it("covers exactly the seven stable public behaviors plus help", () => {
    expect(Object.keys(evidence)).toEqual(["help", "doctor", "status", "run", "review", "verify", "confirm", "authorize"]);
    expect(evidence.help).toMatchObject({ status: expect.any(Number), stdout: expect.any(String), stderr: expect.any(String) });
    for (const behavior of ["doctor", "status", "run", "review", "verify", "confirm", "authorize"]) {
      expect(evidence[behavior].cases[0].result).toMatchObject({ status: expect.any(Number), stdout: expect.any(String), stderr: expect.any(String) });
    }
  });

  it("does not treat private action names as additional public behaviors", () => {
    expect(Object.keys(evidence)).not.toContain("prepare");
    expect(Object.keys(evidence)).not.toContain("start-run");
  });

  it("uses a known public action and a fixed input for every behavior case", () => {
    for (const behavior of ["doctor", "status", "run", "review", "verify", "confirm", "authorize"]) {
      expect(evidence[behavior]).toMatchObject({ cases: expect.any(Array) });
      expect(evidence[behavior].cases.length).toBeGreaterThanOrEqual(2);
      expect(evidence[behavior].cases[0].action).not.toBe("__baseline_probe__");
      expect(JSON.stringify(evidence[behavior])).not.toContain("unknown public runtime action");
    }
  });

  it("baseline:multi-case keeps two independently executed cases per public behavior", () => {
    for (const behavior of ["doctor", "status", "run", "review", "verify", "confirm", "authorize"]) {
      const cases = baseline[behavior].cases;
      expect(cases.length).toBeGreaterThanOrEqual(2);
      expect(new Set(cases.map((item) => item.case_id)).size).toBe(cases.length);
      expect(cases.every((item) => item.result && Array.isArray(item.write_set))).toBe(true);
    }
  });

  it("baseline:four-value-diff exposes the complete behavior comparison vocabulary", () => {
    expect(COMPARISON_CLASSES).toEqual(["preserved", "approved_internal_change", "approved_bug_fix", "behavior_regression"]);
    const same = { result: { status: 0, stdout: "same", stderr: "" } };
    expect(classifyComparison({ probe: "status", baseline: same, candidate: structuredClone(same) })).toBe("preserved");
    expect(classifyComparison({
      probe: "run",
      baseline: { result: { stderr: "legacy attempt writer is unavailable for vNext tasks" } },
      candidate: { result: { status: 0, stdout: "published" } },
    })).toBe("approved_bug_fix");
    expect(classifyComparison({
      probe: "run",
      baseline: { action: "scope", result: { status: 0, stdout: "legacy ledger" } },
      candidate: { action: "execute", result: { status: 1, stderr: "TypeError: run input requires a receipts object" } },
    })).toBe("approved_internal_change");
    expect(classifyComparison({
      probe: "authorize",
      baseline: { result: { status: 1, stderr: "full audit writer is only valid for a bounded human-confirmation attempt" } },
      candidate: { result: { status: 0, json: { value: { schema_version: "authorization.v2" } } } },
    })).toBe("approved_bug_fix");
    expect(classifyComparison({
      probe: "doctor",
      baseline: { result: { status: 0 } },
      candidate: { result: { status: 0, json: { stage: "make-decision", materials: "not_applicable" } } },
    })).toBe("approved_internal_change");
    expect(classifyComparison({
      probe: "verify",
      baseline: { result: { status: 0 } },
      candidate: { result: { status: 0, json: { schema_version: "workflowhub-receipt.v1", source_digest: "a" } } },
    })).toBe("approved_internal_change");
    expect(classifyComparison({
      probe: "confirm",
      baseline: { result: { status: 0 } },
      candidate: { result: { status: 0, json: { ref: "evidence/confirmations/x.json", value: { schema_version: "human-confirmation.v2" } } } },
    })).toBe("approved_internal_change");
    expect(classifyComparison({ probe: "status", baseline: same, candidate: { result: { status: 1 } } })).toBe("behavior_regression");
  });

  it("baseline:write-set-content-hash binds every case write set to its content hashes", () => {
    for (const evidence of [baseline, candidate]) {
      for (const behavior of ["doctor", "status", "run", "review", "verify", "confirm", "authorize"]) {
        for (const item of evidence[behavior].cases) {
          expect(item.write_set_content_hash).toBe(createHash("sha256").update(JSON.stringify(item.write_set_content)).digest("hex"));
          expect(item.write_set_content.map(({ ref }) => ref)).toEqual(item.write_set);
        }
      }
    }
  });

  it("baseline:candidate-binding keeps baseline identity and candidate evidence separate", () => {
    const manifest = JSON.parse(readFileSync("tests/fixtures/public-behavior-baseline/v1/manifest.json", "utf8"));
    expect(manifest.baseline_commit).toBe("c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf");
    expect(manifest.baseline.path).not.toBe(manifest.candidate.path);
    expect(manifest.baseline.sha256).not.toBe(manifest.candidate.sha256);
  });

  it("baseline:candidate-equals-baseline does not silently overwrite a changed candidate", () => {
    expect(JSON.stringify(candidate)).not.toBe(JSON.stringify(baseline));
  });
});
