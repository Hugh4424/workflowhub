import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";

const contractSet = JSON.parse(readFileSync(
  new URL("../contracts/contract-set.2026-07-16.1.json", import.meta.url),
  "utf8",
));
const ajv = new Ajv2020({ strict: false, formats: { "date-time": true } });

function assertClosedObjects(node, path = "$") {
  if (!node || typeof node !== "object") return;
  if (node.type === "object") {
    if (node["x-workflowhub-map"] === true) {
      expect(node.additionalProperties, `${path} map value schema`).toMatchObject({
        type: "object",
        additionalProperties: false,
      });
    } else {
      expect(node.additionalProperties, `${path} must be closed`).toBe(false);
    }
  }
  for (const [key, value] of Object.entries(node)) {
    assertClosedObjects(value, `${path}.${key}`);
  }
}

function nestedUnknownVariants(value, path = []) {
  if (!value || typeof value !== "object") return [];
  const variants = [];
  for (const [key, child] of Object.entries(value)) {
    if (!child || typeof child !== "object" || Array.isArray(child)) continue;
    const copy = structuredClone(value);
    let target = copy;
    for (const segment of path) target = target[segment];
    target[key].unexpected = true;
    variants.push(copy);
  }
  return variants;
}

describe("P0 closed-object v1 contract set", () => {
  it("pins 18 exact contracts without latest or version ranges", () => {
    expect(contractSet.schema_version).toBe("1.0.0");
    expect(contractSet.contracts).toHaveLength(18);
    expect(JSON.stringify(contractSet)).not.toMatch(/latest|[~^*]/i);
  });

  for (const entry of contractSet.contracts) {
    it(`${entry.schema_ref} accepts its fixture and rejects unknown fields`, () => {
      expect(entry.version).toBe("1.0.0");
      expect(entry.producer).toBeTruthy();
      expect(entry.consumer).toBeTruthy();
      expect(entry.migration).toBeTruthy();
      const schema = JSON.parse(readFileSync(new URL(`../${entry.schema_ref}`, import.meta.url), "utf8"));
      expect(schema.$id).toBe(entry.schema_id);
      expect(schema.required).toContain("schema_id");
      expect(schema.properties.schema_id.const).toBe(entry.schema_id);
      expect(schema.additionalProperties).toBe(false);
      expect(schema.properties.schema_version.const).toBe("1.0.0");
      assertClosedObjects(schema);
      const validate = ajv.compile(schema);
      expect(validate(entry.fixture), JSON.stringify(validate.errors)).toBe(true);
      expect(validate({ ...entry.fixture, unexpected: true })).toBe(false);
      for (const variant of nestedUnknownVariants(entry.fixture)) {
        expect(validate(variant), `${entry.schema_ref} accepted nested unknown field`).toBe(false);
      }
      expect(createHash("sha256").update(JSON.stringify(entry.fixture)).digest("hex"))
        .toBe(entry.fixture_hash);
    });
  }
});

function contractValidator(schemaRef) {
  const schema = JSON.parse(readFileSync(new URL(`../${schemaRef}`, import.meta.url), "utf8"));
  return new Ajv2020({ strict: false, formats: { "date-time": true } }).compile(schema);
}

function fixtureFor(schemaRef) {
  return structuredClone(contractSet.contracts.find((entry) => entry.schema_ref === schemaRef).fixture);
}

describe("Phase 0 review constraints", () => {
  it("requires release_kind and accepts only preview or final", () => {
    const ref = "schemas/release-manifest.v1.schema.json";
    const validate = contractValidator(ref);
    const fixture = fixtureFor(ref);
    expect(validate(fixture)).toBe(true);
    expect(validate({ ...fixture, release_kind: "final" })).toBe(true);
    const { release_kind: _missing, ...missing } = fixture;
    expect(validate(missing)).toBe(false);
    expect(validate({ ...fixture, release_kind: "candidate" })).toBe(false);
  });

  it("binds fact packet, rollback target, and expected/current live pointer", () => {
    const ref = "schemas/switch-plan.v1.schema.json";
    const validate = contractValidator(ref);
    const fixture = fixtureFor(ref);
    expect(validate(fixture)).toBe(true);
    for (const field of [
      "fact_packet_ref", "fact_packet_hash", "rollback_target_ref", "rollback_target_hash",
      "live_pointer_ref", "expected_live_pointer_hash", "current_live_pointer_hash",
    ]) {
      const invalid = structuredClone(fixture);
      delete invalid[field];
      expect(validate(invalid), `accepted switch plan without ${field}`).toBe(false);
    }
    expect(validate({ ...fixture, fact_packet_hash: "not-a-hash" })).toBe(false);
  });

  it.each(["admin-repin", "switch"])("accepts %s confirmation purpose", (purpose) => {
    const ref = "schemas/human-confirmation-envelope.v1.schema.json";
    const validate = contractValidator(ref);
    expect(validate({ ...fixtureFor(ref), purpose })).toBe(true);
  });

  it("accepts the public status command", () => {
    const ref = "schemas/cli-input.v1.schema.json";
    const validate = contractValidator(ref);
    expect(validate({ ...fixtureFor(ref), command: "status" })).toBe(true);
  });

  it("requires each of the six locked skill roles exactly once", () => {
    const ref = "schemas/multica-skills-lock.v1.schema.json";
    const validate = contractValidator(ref);
    const fixture = fixtureFor(ref);
    expect(validate(fixture)).toBe(true);
    const duplicate = structuredClone(fixture);
    duplicate.skills[5] = { ...duplicate.skills[4] };
    expect(validate(duplicate)).toBe(false);
  });
});
