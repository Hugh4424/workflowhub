import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import {
  COMPARISON_CLASSES,
  classifyComparison,
  collectBehaviorEvidence,
} from "../../tools/architecture/public-behavior-baseline.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";

const baseline = JSON.parse(readFileSync("tests/fixtures/public-behavior-baseline/v1/baseline.json", "utf8"));
const candidate = JSON.parse(readFileSync("tests/fixtures/public-behavior-baseline/v1/candidate.json", "utf8"));
const TEN_ENTRY_MATRIX = Object.freeze([
  ["host", "work_progress", "user-facing current conclusion"],
  ["doctor", "work_progress", "capability and parse errors"],
  ["status", "all four views", "current task state"],
  ["monitor", "all four views", "read-only projection"],
  ["run", "work_progress/stage_quality", "stage publication"],
  ["review", "stage_quality", "review facts and unavailable"],
  ["verify", "stage_quality/product_release", "AC and code result"],
  ["confirm", "work_progress/stage_quality", "human decision"],
  ["authorize", "physical_delivery", "explicit physical permission"],
  ["close", "product_release/physical_delivery", "itemized delivery result"],
]);

describe("public behavior baseline", () => {
  let evidence;
  const liveProbe = process.env.WORKFLOWHUB_LIVE_PUBLIC_BEHAVIOR === "1";

  beforeAll(() => {
    // The live collector is an explicit architecture probe. Keep the normal suite
    // bounded and run the 14 isolated CLI cases only when requested.
    evidence = liveProbe
      ? collectBehaviorEvidence(process.cwd(), {
        // The public run contract authenticates a Stage Agent outcome; the live
        // probe must provide that real current-snapshot receipt instead of
        // silently testing an obsolete caller-only input shape.
        stageOutcomeWriter: ({ stage, task }) => {
          const candidateWorkspace = prepareTaskWorkspace(task);
          const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
          const kernel = createTaskKernel(task, { candidateWorkspace });
          return writeStageOutcomeFixture({ task, kernel, artifacts, candidateWorkspace, stage });
        },
      })
      : candidate;
  });

  it("keeps the ten-entry consumer matrix explicit without adding public commands", () => {
    expect(TEN_ENTRY_MATRIX).toHaveLength(10);
    expect(new Set(TEN_ENTRY_MATRIX.map(([entry]) => entry)).size).toBe(10);
    expect(TEN_ENTRY_MATRIX.every(([, views, conclusion]) => views && conclusion)).toBe(true);
    expect(Object.keys(evidence)).toEqual(expect.arrayContaining(["doctor", "status", "run", "review", "verify", "confirm", "authorize"]));
    expect(Object.keys(evidence)).not.toEqual(expect.arrayContaining(["host", "monitor", "close"]));
  });

  it.runIf(liveProbe)("executes every public behavior successfully in the real probe", () => {
    expect(evidence.help.status, evidence.help.stderr).toBe(0);
    for (const behavior of ["doctor", "status", "run", "review", "verify", "confirm", "authorize"]) {
      for (const item of evidence[behavior].cases) {
        expect(item.result.status, `${behavior}/${item.case_id}: ${item.result.stderr}`).toBe(0);
      }
    }
    expect(evidence.doctor.cases[0].result.json).toMatchObject({ stage: "make-decision", materials: "working" });
    expect(evidence.status.cases[0].result.json).toMatchObject({
      work_status: "ready",
      quality_status: "in_progress",
    });
    expect(evidence.run.cases[0].result.json).toMatchObject({
      schema_version: "stage-runtime-result.vnext",
      stage: "build-code",
      work_status: "ready",
    });
    expect(evidence.review.cases[0].result.json).toMatchObject({ status: "continue" });
    expect(evidence.verify.cases[0].result.json).toMatchObject({
      schema_version: "workflowhub-receipt.v1",
      stage: "verify-code",
      exit_code: 0,
    });
    expect(evidence.confirm.cases[0].result.json).toMatchObject({ value: { schema_version: "human-confirmation.v2" } });
    expect(evidence.authorize.cases[0].result.json).toMatchObject({ value: { schema_version: "irreversible-authorization.v1" } });
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
    })).toBe("behavior_regression");
    expect(classifyComparison({
      probe: "verify",
      baseline: { result: { status: 0, stdout: "test receipt" } },
      candidate: { result: { status: 1, stderr: "TypeError: run input requires a receipts object" } },
    })).toBe("behavior_regression");
    expect(classifyComparison({
      probe: "authorize",
      baseline: { result: { status: 1, stderr: "full audit writer is only valid for a bounded human-confirmation attempt" } },
      candidate: { result: { status: 0, json: { value: { schema_version: "authorization.v2" } } } },
    })).toBe("approved_bug_fix");
    expect(classifyComparison({
      probe: "doctor",
      baseline: { result: { status: 0 } },
      candidate: { result: { status: 0, json: { stage: "make-decision", worktree_root: "/tmp/worktree", baseline_commit: "a".repeat(40) } } },
    })).toBe("approved_internal_change");
    expect(classifyComparison({
      probe: "status",
      baseline: { result: { status: 0 } },
      candidate: { result: { status: 0, json: { work_status: "blocked_by_missing_material", quality_status: "in_progress", quality_predicates: {} } }, public_write_set: ["task.json"] },
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

  it("baseline:compare fails loud when --baseline is not the frozen fixture commit", () => {
    const manifest = JSON.parse(readFileSync("tests/fixtures/public-behavior-baseline/v1/manifest.json", "utf8"));
    const requestedBaseline = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    expect(requestedBaseline).not.toBe(manifest.baseline_commit);

    const result = spawnSync(process.execPath, [
      "tools/architecture/public-behavior-baseline.mjs",
      "compare",
      `--baseline=${requestedBaseline}`,
      "--candidate=worktree",
    ], { encoding: "utf8" });

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("baseline fixture commit mismatch");
    expect(result.stderr).toContain(requestedBaseline);
    expect(result.stderr).toContain(manifest.baseline_commit);
  }, 60_000);

  it("baseline:candidate-equals-baseline does not silently overwrite a changed candidate", () => {
    expect(JSON.stringify(candidate)).not.toBe(JSON.stringify(baseline));
  });
});
