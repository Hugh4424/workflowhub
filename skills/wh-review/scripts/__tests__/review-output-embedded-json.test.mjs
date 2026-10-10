import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MAX_REVIEWER_OUTPUT_BYTES, parseReviewerOutput } from "../../../../runtime/review/review-output.mjs";

// T026 / FR-QUAL-014① — the fourth route accepts the shape the independent
// review actually produced (PFACT-017): `quality/reviews/2026-10-10-002-build-plan-document-provider-1.output`
// is one line of 118 characters of prose glued to one complete findings object
// (10 findings) with the object running to the end of the output.  This test
// reproduces that shape with its own bytes so it never depends on the task
// library, and it pins the three directions that must stay invalid.
const finding = { severity: "major", path: "src/app.mjs", line: 1, issue: "Unsafe mutation", recommendation: "Guard the real mutation", root_cause: "Missing guard", evidence_kind: "direct", evidence: "src/app.mjs:1" };
const findings = JSON.stringify({ findings: [finding] });
const empty = JSON.stringify({ findings: [] });
const PROSE = "All citations verified. Writing the final review now — exactly one JSON object per the requested findings-only schema.";
const rejection = (raw, options) => {
  try { parseReviewerOutput(raw, options); } catch (error) { return error; }
  throw new Error("expected OUTPUT_INVALID, but the output was accepted");
};

describe("embedded findings object route", () => {
  it("accepts prose glued to one trailing findings object and records the extraction", () => {
    const parsed = parseReviewerOutput(`${PROSE}${findings}`, { requireEvidence: true });
    expect(parsed.findings).toHaveLength(1);
    expect(parsed.findings[0]).toMatchObject({ severity: "major", path: "src/app.mjs", issue: "Unsafe mutation" });
    expect(parsed.parse_route).toBe("embedded_json");
    expect(parsed.discarded_facts).toBeUndefined();
    const emptyReview = parseReviewerOutput(`prose glued to an honest empty review${empty}`);
    expect(emptyReview).toEqual({ findings: [], parse_route: "embedded_json" });
  });

  it("rejects two candidate objects as ambiguous", () => {
    const error = rejection(`prose${findings}between${findings}`);
    expect(error.code).toBe("OUTPUT_INVALID");
    expect(error.parse_error).toMatch(/embedded JSON object: 2 candidates are ambiguous/);
  });

  it("bounds candidate retention for many tiny objects near the output limit", () => {
    const tinyObject = "{}";
    const prefix = "prose";
    const tinyCount = Math.floor((MAX_REVIEWER_OUTPUT_BYTES - Buffer.byteLength(prefix)) / Buffer.byteLength(tinyObject));
    const raw = `${prefix}${tinyObject.repeat(tinyCount)}`;
    expect(Buffer.byteLength(raw)).toBeGreaterThan(MAX_REVIEWER_OUTPUT_BYTES - 16);
    expect(Buffer.byteLength(raw)).toBeLessThanOrEqual(MAX_REVIEWER_OUTPUT_BYTES);
    const started = performance.now();
    const error = rejection(raw);
    const elapsed = performance.now() - started;
    expect(error.code).toBe("OUTPUT_INVALID");
    expect(error.parse_error).toMatch(/embedded JSON object: 2 candidates are ambiguous/);
    expect(elapsed).toBeLessThan(1000);
  });

  it("rejects a glued object that is not valid JSON", () => {
    const error = rejection(`prose{"findings": [oops}`);
    expect(error.code).toBe("OUTPUT_INVALID");
    expect(error.parse_error).toMatch(/embedded JSON object is not valid JSON/);
  });

  it("rejects prose without any object instead of reporting empty findings", () => {
    const error = rejection("only prose, no JSON object at all");
    expect(error.code).toBe("OUTPUT_INVALID");
    expect(error.message).toMatch(/no valid JSON\/fence\/embedded findings candidate/);
    expect(error.parse_error).toMatch(/whole output is not JSON/);
  });

  it("applies the same findings validation to the embedded object", () => {
    const unsafe = `prose${JSON.stringify({ findings: [{ ...finding, path: "/Users/private.mjs" }] })}`;
    expect(rejection(unsafe, { requireEvidence: true }).parse_error).toMatch(/finding 0 is invalid/);
    const notAnArray = `prose${JSON.stringify({ findings: { severity: "major" } })}`;
    expect(rejection(notAnArray).parse_error).toMatch(/findings must be an array/);
    const withoutFindings = "prose{}";
    expect(rejection(withoutFindings).parse_error).toMatch(/must contain findings/);
    const evidenceMissing = `prose${JSON.stringify({ findings: [{ ...finding, root_cause: undefined }] })}`;
    expect(rejection(evidenceMissing, { requireEvidence: true }).parse_error).toMatch(/evidence is invalid/);
  });

  it("keeps outputs whose object is separated from or followed by prose invalid", () => {
    // skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs:2058
    expect(rejection(`provider prose: ${empty}`).parse_error).toMatch(/not glued to a prose prefix/);
    // skills/wh-review/scripts/__tests__/review-runner.test.mjs:14-15
    expect(rejection("我没有输出 `{\"findings\": []}`。没读到").parse_error).toMatch(/not the final content/);
    expect(rejection(`provider prose:${findings} then refusal`, { requireEvidence: true }).parse_error).toMatch(/not the final content/);
    expect(rejection(`prose${findings} and then a refusal`).parse_error).toMatch(/not the final content/);
  });

  it("keeps the three original routes and their result shape unchanged", () => {
    expect(parseReviewerOutput(empty)).toEqual({ findings: [] });
    expect(parseReviewerOutput(JSON.stringify({ findings: [finding] }, null, 2), { requireEvidence: true }).findings).toHaveLength(1);
    expect(parseReviewerOutput(`note\n\`\`\`json\n${findings}\n\`\`\``).findings).toHaveLength(1);
    const rows = `${findings}\n${JSON.stringify({ findings: [{ ...finding, severity: "minor" }] })}`;
    expect(parseReviewerOutput(rows).findings).toHaveLength(2);
    expect(parseReviewerOutput(`   ${findings}  `).findings).toHaveLength(1);
  });

  it("does not add a new parse_outcome value", () => {
    const enums = [];
    const walk = (node, visit) => {
      if (!node || typeof node !== "object") return;
      for (const [key, value] of Object.entries(node)) {
        if (key === "parse_outcome") visit(value);
        walk(value, visit);
      }
    };
    for (const name of ["result.schema.json", "attempt.schema.json"]) {
      const schema = JSON.parse(readFileSync(new URL(`../../../../runtime/review/schemas/${name}`, import.meta.url), "utf8"));
      walk(schema, (entry) => enums.push(entry.enum));
    }
    expect(enums.length).toBe(3);
    for (const value of enums) expect(value).toEqual(["ok", "invalid", "empty_output", null]);
  });
});
