import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createReadOnlyRunnerFixture, runScenarioInChild } from "../helpers/read-only-runner-fixture.mjs";

const fixtures = [];
afterEach(() => {
  while (fixtures.length) fixtures.pop().dispose();
});

describe("five-stage normal path", () => {
  it("runs all five stages from a clean read-only runner without changing Hub source", async () => {
    const fixture = await createReadOnlyRunnerFixture({ taskId: "normal" });
    fixtures.push(fixture);
    const before = fixture.sourceHashBefore;
    const result = runScenarioInChild(fixture, "normal");
    expect(result.accepted_stages).toEqual(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
    expect(result.source_hash).toBe(before);
    expect(fixture.sourceHashBefore).toBe(before);
    expect(fixture.finish()).toBe(before);
    expect(fs.existsSync(path.join(fixture.runnerRoot, "node_modules"))).toBe(true);
    expect(fs.existsSync(path.join(fixture.runnerRoot, "tests"))).toBe(false);
  }, 120_000);
});
