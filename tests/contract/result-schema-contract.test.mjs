import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const OLD_IMPLEMENTATION = "../../runtime/review/schema-validator.mjs";
const RESULT_SCHEMA = "../../runtime/review/schemas/result.schema.json";
const RECORD_ROUTE = "../../runtime/review/review-record-route.mjs";
const RUNNER_RELEASE = "../../runtime/distribution/runner-release.mjs";

describe("ORACLE-SCHEMA-RETIREMENT old implementation versus retained contract", () => {
  it("makes the old validateSchema module and symbol unavailable while keeping result.schema.json readable", async () => {
    await expect(import(OLD_IMPLEMENTATION)).rejects.toMatchObject({ code: "ERR_MODULE_NOT_FOUND" });

    const schema = JSON.parse(readFileSync(new URL(RESULT_SCHEMA, import.meta.url), "utf8"));
    expect(schema).toBeTypeOf("object");
    expect(schema.$schema).toContain("json-schema.org");
    expect(schema.$defs || schema.definitions).toBeTypeOf("object");
  });

  it("does not reintroduce the retired validator through the record writer or release closure", () => {
    const writer = readFileSync(new URL(RECORD_ROUTE, import.meta.url), "utf8");
    expect(writer).not.toMatch(/schema-validator\.mjs|validateSchema\s*\(/);

    const release = readFileSync(new URL(RUNNER_RELEASE, import.meta.url), "utf8");
    expect(release).toContain("result.schema.json");
    expect(release).not.toContain("schema-validator.mjs");
  });
});
