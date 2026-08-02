import { afterEach, describe, expect, test } from "vitest";

import { createReadOnlyRunnerFixture, runScenarioInChild } from "../helpers/read-only-runner-fixture.mjs";

const fixtures = [];
afterEach(() => { while (fixtures.length) fixtures.pop().dispose(); });

describe("final release acceptance", () => {
  for (const scenario of ["normal", "material-revision", "idempotent-resume"]) {
    test(`clean installed Runner completes ${scenario} without mutating Hub`, async () => {
      const fixture = await createReadOnlyRunnerFixture({ taskId: `final-${scenario}` });
      fixtures.push(fixture);
      const result = runScenarioInChild(fixture, scenario);
      expect(result.accepted_stages).toEqual(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
      expect(result.source_hash).toBe(fixture.sourceHashBefore);
      if (scenario === "material-revision") expect(result.stale).toBe(true);
      if (scenario === "idempotent-resume") {
        expect(result.provider_recovered).toBe(true);
        expect(result.provider_history_preserved).toBe(true);
      }
    }, 120_000);
  }
});
