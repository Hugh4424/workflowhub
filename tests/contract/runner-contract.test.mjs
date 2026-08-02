import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, test } from "vitest";

import {
  assertRunnerCompatibility,
  createRunnerContract,
} from "../../runtime/interface/runner-contract.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("runner contract", () => {
  test("accepts matching major and sufficient runner minor", () => {
    const runner = createRunnerContract({ major: 2, minor: 3 });
    expect(assertRunnerCompatibility({
      runner_contract_major: 2,
      runner_contract_min_minor: 1,
    }, runner)).toMatchObject({ compatible: true, major: 2, runner_minor: 3 });
  });

  test.each([
    [{}, { runner_contract_major: 1, runner_contract_minor: 0 }],
    [{ runner_contract_major: 1, runner_contract_min_minor: 2 }, { runner_contract_major: 1, runner_contract_minor: 1 }],
    [{ runner_contract_major: 1, runner_contract_min_minor: 0 }, { runner_contract_major: 2, runner_contract_minor: 0 }],
  ])("fails loud for missing or incompatible contracts", (bundle, runner) => {
    expect(() => assertRunnerCompatibility(bundle, runner)).toThrow(/runner contract/i);
  });

  test("runner release schema is closed", () => {
    const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "runtime/schemas/runner-release.schema.json"), "utf8"));
    const validate = new Ajv2020({ strict: false }).compile(schema);
    expect(validate({
      schema_version: 1,
      release: "workflowhub-runner",
      version: "1.0.0",
      runner_contract_major: 1,
      runner_contract_minor: 0,
      files: [{ path: "runtime/interface/runtime-facade.mjs", sha256: "a".repeat(64) }],
      surprise: true,
    })).toBe(false);
  });
});
