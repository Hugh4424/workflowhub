import { afterEach, describe, expect, it } from "vitest";

import { createReadOnlyRunnerFixture, runScenarioInChild } from "../helpers/read-only-runner-fixture.mjs";

const fixtures = [];
afterEach(() => {
  while (fixtures.length) fixtures.pop().dispose();
});

describe("five-stage interrupted and resumed path", () => {
  it("records provider unavailability once, resumes idempotently, and completes", async () => {
    const fixture = await createReadOnlyRunnerFixture({ taskId: "idempotent-resume" });
    fixtures.push(fixture);
    const result = runScenarioInChild(fixture, "idempotent-resume");
    expect(result.accepted_stages).toEqual(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
    expect(result.provider_recovered).toBe(true);
    expect(result.provider_history_preserved).toBe(true);
    expect(result.source_hash).toBe(fixture.sourceHashBefore);
    expect(fixture.finish()).toBe(fixture.sourceHashBefore);
  }, 120_000);
});
