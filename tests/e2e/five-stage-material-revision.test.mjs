import { afterEach, describe, expect, it } from "vitest";

import { createReadOnlyRunnerFixture, runScenarioInChild } from "../helpers/read-only-runner-fixture.mjs";

const fixtures = [];
afterEach(() => {
  while (fixtures.length) fixtures.pop().dispose();
});

describe("five-stage material revision path", () => {
  it("keeps accepted history readable while stale quality facts remain a verify concern", async () => {
    const fixture = await createReadOnlyRunnerFixture({ taskId: "material-revision" });
    fixtures.push(fixture);
    const result = runScenarioInChild(fixture, "material-revision");
    expect(result.accepted_stages).toEqual(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
    expect(result.stale).toBe(true);
    expect(result.source_hash).toBe(fixture.sourceHashBefore);
    expect(fixture.finish()).toBe(fixture.sourceHashBefore);
  }, 120_000);
});
