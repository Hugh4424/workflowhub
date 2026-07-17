import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(
  new URL("./fixtures/multica-isolation-recovery-v2/manifest.json", import.meta.url),
  "utf8",
));

describe("legacy v2 migration freeze", () => {
  it("keeps every legacy input byte-for-byte unchanged", () => {
    expect(manifest.schema_version).toBe("1.0.0");
    expect(manifest.frozen_files).toHaveLength(4);
    for (const fixture of manifest.frozen_files) {
      const digest = createHash("sha256")
        .update(readFileSync(resolve(root, fixture.path)))
        .digest("hex");
      expect(digest, fixture.path).toBe(fixture.sha256);
    }
  });

  it("freezes representative legacy record payloads rather than schemas or source", () => {
    expect(manifest.frozen_files.map(({ kind }) => kind)).toEqual([
      "task-attempt.v2",
      "task-accepted.v2",
      "git-checkpoint",
      "execution-record",
    ]);
    for (const fixture of manifest.frozen_files) {
      expect(fixture.path).toMatch(/^tests\/fixtures\/multica-isolation-recovery-v2\/.*\.json$/);
      expect(() => JSON.parse(readFileSync(resolve(root, fixture.path), "utf8"))).not.toThrow();
    }
    const readJson = (relative) => JSON.parse(readFileSync(resolve(root, relative), "utf8"));
    const attempt = readJson(manifest.frozen_files[0].path);
    const accepted = readJson(manifest.frozen_files[1].path);
    const checkpoint = readJson(manifest.frozen_files[2].path);
    const execution = readJson(manifest.frozen_files[3].path);
    const ajv = new Ajv2020({ strict: false, formats: { "date-time": true } });
    expect(ajv.compile(readJson("schemas/task-attempt.v2.schema.json"))(attempt)).toBe(true);
    expect(ajv.compile(readJson("schemas/task-accepted.v2.schema.json"))(accepted)).toBe(true);
    expect(accepted.checkpoint).toEqual(checkpoint);
    const executionContract = readJson("contracts/execution-record.contract.json");
    expect(executionContract.required_fields.every(({ name }) => Object.hasOwn(execution, name))).toBe(true);
  });

  it("reads frozen v2 records without rewriting them", async () => {
    const { readLegacyRecord } = await import("../core/legacy-record-reader.mjs");
    for (const fixture of manifest.frozen_files.slice(0, 2)) {
      const path = resolve(root, fixture.path), before = readFileSync(path);
      expect(readLegacyRecord(before.toString("utf8"), { expectedSchema: fixture.kind })).toMatchObject({ schema_version: fixture.kind });
      expect(readFileSync(path)).toEqual(before);
    }
  });

  it("uses the real migration entrypoint instead of a fixture-only planner", async () => {
    const { migrateTask } = await import("../scripts/migrate-task-v2.mjs");
    expect(migrateTask).toBeTypeOf("function");
  });
});
