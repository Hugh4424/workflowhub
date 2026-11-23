import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const OLD_IMPLEMENTATION = "../../runtime/review/schema-validator.mjs";
const RESULT_SCHEMA = "../../runtime/review/schemas/result.schema.json";
const RECORD_ROUTE = "../../runtime/review/review-record-route.mjs";
const RUNNER_RELEASE = "../../runtime/distribution/runner-release.mjs";

describe("ORACLE-SCHEMA-RETIREMENT old implementation versus retained contract", () => {
  it("makes the old module unavailable while keeping result.schema.json readable", async () => {
    let loaded = false;
    try { await import(OLD_IMPLEMENTATION); loaded = true; } catch { /* load failure or missing file */ }
    expect(loaded, "the retired schema-validator module must not load").toBe(false);

    expect(existsSync(new URL(OLD_IMPLEMENTATION, import.meta.url)), "the retired module file must be physically absent").toBe(false);
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
