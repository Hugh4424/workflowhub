import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkDecisionLogChain } from "../../tools/cli/check-decision-log-chain.mjs";

const ROOT = [
  "### D-001",
  "module: review",
  "requirement_ids: [R-001]",
  "derived_from: []",
  "artifacts: [spec.md#FR-001]",
  "### D-002",
  "module: delivery",
  "requirement_ids: [R-002]",
  "derived_from: [D-001]",
  "artifacts: [plan.md#T001]",
].join("\n");

function run(markdown) {
  return checkDecisionLogChain({ markdown, source_ref: "fixture/decision-log.md" });
}

describe("decision-log chain warnings are observable but non-blocking", () => {
  it("warns when a chain field is missing and returns exit code 0", () => {
    const result = run(ROOT.replace("module: review\n", ""));
    expect(result.exit_code).toBe(0);
    expect(result.failures).toEqual([]);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "missing_chain_field", field: "module", decision_id: "D-001" }),
    ]));
  });

  it("warns on an illegal chain-field value without entering failures", () => {
    const result = run(ROOT.replace("requirement_ids: [R-001]", "requirement_ids: [bad-id]"));
    expect(result.exit_code).toBe(0);
    expect(result.failures).toEqual([]);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "invalid_chain_field", field: "requirement_ids", decision_id: "D-001" }),
    ]));
  });

  it("warns when derived_from points to a decision that does not exist", () => {
    const result = run(ROOT.replace("derived_from: [D-001]", "derived_from: [D-999]"));
    expect(result.exit_code).toBe(0);
    expect(result.failures).toEqual([]);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "missing_decision_reference", field: "derived_from", decision_id: "D-002" }),
    ]));
  });

  it("ignores fenced decision examples", () => {
    const result = run("```text\n### D-999\nmodule: example\n```\n" + ROOT);
    expect(result.warnings.some(({ decision_id }) => decision_id === "D-999")).toBe(false);
  });

  it("keeps the run-checks registration advisory even if the checker reports failure", () => {
    const result = spawnSync(process.execPath, [join(process.cwd(), "tools/cli/run-checks.mjs")], {
      encoding: "utf8",
      env: { ...process.env, RUN_CHECKS_FORCE_FAIL_CHECKER: "check-decision-log-chain" },
    });
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout + result.stderr).toContain("advisory failed");
    expect(result.stdout + result.stderr).toContain("ALL CHECKS PASSED");
  });
});

describe("planning-hardening decision-log chain disclosure", () => {
  it("AC-COVER-002 reports the real archived CARD-01/02 field gap without treating advisory exit 0 as acceptance", () => {
    const archived = ["01", "02"].map((card) => {
      const sourceRef = `specs/archive/workflowhub-thin-core-card-${card}-20260919/decision-log.md`;
      return checkDecisionLogChain({
        markdown: readFileSync(join(process.cwd(), sourceRef), "utf8"),
        source_ref: sourceRef,
      });
    });

    expect(archived.map(({ recognized_blocks, recognized_fields }) => ({ recognized_blocks, recognized_fields }))).toEqual([
      { recognized_blocks: 10, recognized_fields: 39 },
      { recognized_blocks: 15, recognized_fields: 56 },
    ]);
    expect(archived.reduce((total, { recognized_blocks }) => total + recognized_blocks, 0)).toBe(25);
    expect(archived.reduce((total, { recognized_fields }) => total + recognized_fields, 0)).toBe(95);
    expect(archived[0].warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "missing_chain_field", decision_id: "D-010", field: "artifacts" }),
    ]));
    for (const field of ["module", "requirement_ids", "derived_from", "artifacts"]) {
      expect(archived[1].warnings).toEqual(expect.arrayContaining([
        expect.objectContaining({ code: "missing_chain_field", decision_id: "D-015", field }),
      ]));
    }
    // D-015 was appended after the original 24-block criterion; excluding it still leaves 95/96 fields.
    expect(archived[0].recognized_blocks + archived[1].recognized_blocks - 1).toBe(24);
    expect(archived[0].recognized_fields + archived[1].recognized_fields).not.toBe(24 * 4);
    expect(archived.map(({ exit_code }) => exit_code)).toEqual([0, 0]);
    expect(archived.every(({ warnings }) => warnings.length === 0)).toBe(false);
  });

  it("T005 recognizes all four fields in list-prefix/fullwidth-colon decision blocks", () => {
    const markdown = Array.from({ length: 24 }, (_, index) => {
      const id = String(index + 1).padStart(3, "0");
      return [
        `### D-${id}`,
        "- module：coverage",
        `- requirement_ids：[R-${id}]`,
        "- derived_from：[]",
        `- artifacts：[spec.md#FR-${id}]`,
      ].join("\n");
    }).join("\n\n");
    const result = run(markdown);
    expect(result).toMatchObject({ recognized_blocks: 24, recognized_fields: 96 });
    expect(result.warnings).toEqual([]);
  });

  it("planning-hardening AC-CHAIN-001 recognizes h3 and h4 decisions and preserves real missing-field warnings", () => {
    const h3 = run([
      "### D-101",
      "module: review",
      "requirement_ids: []",
      "derived_from: []",
      "artifacts: []",
    ].join("\n"));
    expect(h3.exit_code).toBe(0);
    expect(h3.warnings).toEqual([]);

    const h4 = run([
      "#### D-102",
      "requirement_ids: []",
      "derived_from: []",
      "artifacts: []",
    ].join("\n"));
    expect(h4.exit_code).toBe(0);
    expect(h4.failures).toEqual([]);
    expect(h4.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "missing_chain_field", decision_id: "D-102", field: "module" }),
    ]));
  });

  it("planning-hardening AC-CHAIN-001 explicitly warns when no decision entries are recognized", () => {
    const result = run("# Decision log\nThis material contains no decision heading.\n");
    expect(result.exit_code).toBe(0);
    expect(result.failures).toEqual([]);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "no_decision_entries",
        decision_id: "unknown",
        field: "decision_entries",
        message: expect.stringMatching(/no decision entries|zero decision entries/i),
      }),
    ]));
  });
});
