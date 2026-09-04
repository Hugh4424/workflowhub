import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PROTOCOL_ERROR_WHITELIST,
  classifyProtocolError,
  createProtocolErrorDiagnostic,
} from "../../runtime/stage/protocol-error-whitelist.mjs";

const root = resolve(import.meta.dirname, "../..");
const fixtureNames = [
  "build-code-schema.json",
  "build-code-acceptance-coverage.json",
  "verify-code-binding.json",
  "close-authorization.json",
];

function loadFixtures() {
  return fixtureNames.flatMap((name) => JSON.parse(readFileSync(resolve(root, "tests/fixtures/protocol-errors", name), "utf8")).entries);
}

const expectedClasses = [
  "stage_publication_transient",
  "verify_review_without_outcome",
  "verify_outcome_unbound_review",
  "verify_review_mismatch",
  "verify_receipt_fields",
  "close_bind_outcome",
  "close_outcome_ref",
  "close_outcome_current",
  "close_review_binding",
  "close_review_identity",
  "close_finding_coverage",
  "build_review_kind",
  "build_review_track",
  "acceptance_coverage_spec_mismatch",
  "acceptance_coverage_invalid_status",
  "acceptance_coverage_invalid_evidence",
];

describe("protocol error classification contract", () => {
  it("exposes the 15 historical plus one explicit retryable publication class", () => {
    expect(PROTOCOL_ERROR_WHITELIST).toHaveLength(16);
    expect(PROTOCOL_ERROR_WHITELIST.map((entry) => entry.class_id)).toEqual(expectedClasses);

    for (const entry of PROTOCOL_ERROR_WHITELIST) {
      expect(entry).toEqual(expect.objectContaining({
        class_id: expect.any(String),
        stages: expect.arrayContaining([expect.any(String)]),
        match: expect.any(Function),
        diagnostic: expect.objectContaining({
          check_id: expect.any(String),
          expected: expect.anything(),
          actual: expect.anything(),
        }),
      }));
    }
  });

  it("classifies each historical fixture as protocol_error and preserves diagnostic fields", () => {
    for (const fixture of loadFixtures()) {
      const classified = classifyProtocolError(new Error(fixture.error), {
        stage: fixture.stage,
        surface: fixture.surface,
      });
      expect(classified, fixture.entry_id).toMatchObject({
        classification: "protocol_error",
        class_id: fixture.class_id,
        diagnostic: {
          check_id: expect.any(String),
          expected: expect.anything(),
          actual: expect.anything(),
        },
      });
    }
  });

  it("marks only the narrow publication failure as retryable", () => {
    const transient = new Error("protocol publication failed transiently");
    transient.code = "PROTOCOL_PUBLICATION_FAILURE";
    expect(classifyProtocolError(transient, {
      stage: "build-code",
      surface: "stage",
    })).toMatchObject({ classification: "protocol_error", class_id: "stage_publication_transient", retryable: true });
    expect(classifyProtocolError(new Error("build-code acceptance_coverage must match the current spec acceptance criteria"), {
      stage: "build-code",
      surface: "stage",
    })).toMatchObject({ classification: "protocol_error", retryable: false });
  });

  it("classifies an unlisted error as quality_failure by default", () => {
    expect(classifyProtocolError(new Error("new quality finding must remain fail-closed"), { stage: "build-code" })).toMatchObject({
      classification: "quality_failure",
    });
  });

  it("does not expose configuration or environment-variable overrides", () => {
    expect(Object.isFrozen(PROTOCOL_ERROR_WHITELIST)).toBe(true);
    expect(() => { PROTOCOL_ERROR_WHITELIST.push({}); }).toThrow();
    expect(() => { PROTOCOL_ERROR_WHITELIST[0].class_id = "relaxed"; }).toThrow();
  });

  it("constructs the public diagnostic wire shape", () => {
    expect(createProtocolErrorDiagnostic({
      check_id: "review_kind",
      expected: ["phase", "integration"],
      actual: "unexpected",
    })).toEqual({
      check_id: "review_kind",
      expected: ["phase", "integration"],
      actual: "unexpected",
    });
  });
});
