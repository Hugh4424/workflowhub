// CARD-03 P4/T011 — ORACLE-FIX-002
// ac-evidence-summary.schema.json 的 result / leaf_result / status 三个枚举
// 必须覆盖 runtime/evidence/acceptance-evidence-validator.mjs:6 冻结的 8 值。
// 校验器与 tests/contract/acceptance-result-machine-classes.test.mjs 冻结，不在本测试改动面内。
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { validateSchema } from "../../runtime/review/schema-validator.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const FROZEN_EIGHT = ["pass", "fail", "inconclusive", "deferred", "missing", "inconsistent", "incomplete", "unavailable"];

function validatorResults() {
  const source = read("runtime/evidence/acceptance-evidence-validator.mjs");
  const match = source.match(/const ACCEPTANCE_RESULTS = (\[[^\]]*\]);/);
  if (!match) throw new Error("ACCEPTANCE_RESULTS declaration not found in validator");
  return JSON.parse(match[1]);
}

function criterionProperties() {
  const schema = JSON.parse(read("runtime/review/schemas/ac-evidence-summary.schema.json"));
  const found = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.properties?.leaf_result && node.properties?.result && node.properties?.status) found.push(node.properties);
    for (const value of Object.values(node)) walk(value);
  };
  walk(schema);
  if (found.length !== 1) throw new Error(`expected exactly one criterion definition, found ${found.length}`);
  return found[0];
}

describe("ORACLE-FIX-002 ac-evidence-summary schema domain matches the frozen validator", () => {
  it("keeps the validator domain frozen at eight machine values", () => {
    expect(validatorResults()).toEqual(FROZEN_EIGHT);
  });

  for (const field of ["result", "leaf_result", "status"]) {
    it(`criterion.${field} enum contains every validator value`, () => {
      const allowed = criterionProperties()[field].enum;
      const missing = validatorResults().filter((value) => !allowed.includes(value));
      expect(missing, `criterion.${field} is missing validator values`).toEqual([]);
    });
  }

  it("keeps previously accepted values so existing summaries stay readable", () => {
    const props = criterionProperties();
    expect(props.result.enum).toEqual(expect.arrayContaining(["pass", "fail", "inconclusive", "deferred", "unknown"]));
    expect(props.status.enum).toEqual(expect.arrayContaining(["passed", "failed", "unknown", "unavailable", "incomplete", "missing"]));
  });

  it("does not add schema fields while widening the enums", () => {
    expect(Object.keys(criterionProperties())).not.toContain("result_invalid");
    expect(typeof validateSchema).toBe("function");
  });
});
