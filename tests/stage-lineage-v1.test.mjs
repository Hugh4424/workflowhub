import { describe, expect, it } from "vitest";
import { loadPhaseCapability } from "./helpers/side-effect-snapshot.mjs";

const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const schemaId = "https://workflowhub.dev/schemas/task-accepted.v1.schema.json";
const accepted = stages.map((stage, index) => ({
  schema_id: schemaId,
  schema_version: "1.0.0",
  task_id: "task-a",
  stage,
  attempt_ref: `results/${stage}/attempt-0001.json`,
  attempt_hash: `${index}`.repeat(64),
  acceptance_mode: ["make-decision", "build-plan", "verify-code"].includes(stage) ? "human" : "automatic",
  ...(["make-decision", "build-plan", "verify-code"].includes(stage) ? { confirmation_ref: `confirmations/${stage}.json` } : {}),
  accepted_at: "2026-07-17T00:00:00.000Z",
  upstream_refs: index === 0 ? [] : [{ ref: `results/${stages[index - 1]}/accepted.json`, sha256: `${index - 1}`.repeat(64) }],
}));

describe("AC-003/004 stage lineage", () => {
  it("accepts the exact five-stage lineage", async () => {
    const verify = await loadPhaseCapability("../core/stage-runner.mjs", "verifyStageLineage");
    expect(verify({ taskId: "task-a", accepted })).toMatchObject({ ok: true });
  });

  it.each([
    ["skipped upstream", accepted.filter(({ stage }) => stage !== "build-plan")],
    ["cross-task ref", accepted.map((record, i) => i === 2 ? { ...record, task_id: "task-b" } : record)],
    ["hash drift", accepted.map((record, i) => i === 2 ? { ...record, attempt_hash: "f".repeat(64) } : record)],
    ["forged accepted", accepted.map((record, i) => i === 2 ? { ...record, attempt_ref: "results/build-plan/attempt-9999.json", attempt_hash: "f".repeat(64) } : record)],
  ])("rejects %s before publishing a record", async (_label, records) => {
    const verify = await loadPhaseCapability("../core/stage-runner.mjs", "verifyStageLineage");
    expect(() => verify({ taskId: "task-a", accepted: records, expected: accepted })).toThrow(/lineage|hash|task|upstream/i);
  });
});
