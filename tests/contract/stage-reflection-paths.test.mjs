import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(join(fileURLToPath(new URL(".", import.meta.url)), "../.."));
const whitelistSources = [
  "runtime/stage/stage-handlers.mjs",
  "runtime/stage/stage-runner.mjs",
  "runtime/task/task-kernel-implementation.mjs",
  "runtime/evidence/canonical-evidence-validators.mjs",
];

describe("stage-reflection quality path contract", () => {
  it.each(whitelistSources)("registers quality/stage-reflection in %s", (relativePath) => {
    const source = readFileSync(join(repoRoot, relativePath), "utf8");
    expect(source).toContain("quality/stage-reflection/");
  });

  it("keeps stage-reflection out of the quality-fact schema channel", () => {
    const source = readFileSync(join(repoRoot, "runtime", "schemas", "quality-fact.v1.json"), "utf8");
    expect(source).not.toContain("stage-reflection");
    expect(source).not.toContain('"record_kind"');
  });
});

describe("T1 AC-MS-006", () => {
  const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
  const hash = "a".repeat(64);

  it("T1 AC-MS-006 preserves producer acceptance and rejects invalid refs", async () => {
    const canonical = await import("../../runtime/evidence/canonical-evidence-validators.mjs");
    const violations = [];
    const { STAGE_REFLECTION_REF, STAGE_OUTCOME_REF, CLOSE_PLAN_REF } = canonical;
    for (const [name, value] of Object.entries({ STAGE_REFLECTION_REF, STAGE_OUTCOME_REF, CLOSE_PLAN_REF })) {
      if (!(value instanceof RegExp)) violations.push(`${name} is not exported from its single canonical owner`);
    }
    if (STAGE_REFLECTION_REF instanceof RegExp) {
      for (const stage of stages) {
        if (STAGE_REFLECTION_REF.test(`quality/stage-reflection/${stage}.json`) !== true) violations.push(`rejected bare producer ref for ${stage}`);
        if (STAGE_REFLECTION_REF.test(`quality/stage-reflection/${stage}/${"0".repeat(64)}.json`) !== true) violations.push(`rejected hashed producer ref for ${stage}`);
      }
      // No grammar is retained here. Every other stage-reflection grammar in the
      // repository is the shared owner above, except the deliberately narrower
      // bare-ref variant in runtime/task/task-kernel-implementation.mjs, which
      // tests/stage-plan-task-contract.test.mjs registers as an owner exception.
    }
    if (STAGE_OUTCOME_REF instanceof RegExp) {
      for (const stage of stages) {
        const match = STAGE_OUTCOME_REF.exec(`quality/evidence/stage-outcomes/${stage}/${"b".repeat(64)}.json`);
        if (match?.[1] !== stage || match?.[2] !== "b".repeat(64)) violations.push(`outcome grammar does not capture stage/hash for ${stage}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("T1 AC-MS-006 rejects invalid stage names, hash widths, case misuse, extra segments, traversal and trailing bytes", async () => {
    const canonical = await import("../../runtime/evidence/canonical-evidence-validators.mjs");
    const { STAGE_REFLECTION_REF, STAGE_OUTCOME_REF, CLOSE_PLAN_REF } = canonical;
    const rejected = [
      `quality/stage-reflection/unknown-stage/${hash}.json`,
      `quality/stage-reflection/Build-Code/${hash}.json`,
      `quality/stage-reflection/build-code/${"a".repeat(63)}.json`,
      `quality/stage-reflection/build-code/${"a".repeat(65)}.json`,
      `quality/stage-reflection/build-code/${"A".repeat(64)}.json`,
      `quality/stage-reflection/build-code/nested/${hash}.json`,
      `quality/stage-reflection/../build-code/${hash}.json`,
      `quality/stage-reflection/build-code/${hash}.json.tmp`,
      `quality/stage-reflection/build-code/${hash}.json `,
      `quality/stage-reflection/${hash}.json`,
      `quality/stage-reflection/build-code/${hash}`,
      `quality/other-reflection/build-code/${hash}.json`,
    ];
    const violations = [];
    for (const value of rejected) {
      if (STAGE_REFLECTION_REF?.test(value) !== false) violations.push(`reflection grammar accepted ${value}`);
      if (STAGE_OUTCOME_REF?.test(`quality/evidence/stage-outcomes/build-code/${hash}.json`) !== true) violations.push("outcome grammar rejected its own hashed form");
    }
    for (const value of [
      `quality/evidence/stage-outcomes/build-code/${"b".repeat(63)}.json`,
      `quality/evidence/stage-outcomes/build-code/${"B".repeat(64)}.json`,
      `quality/evidence/stage-outcomes/build-code/${"b".repeat(64)}.json.tmp`,
      "quality/evidence/stage-outcomes/build-code/plan.json",
    ]) if (STAGE_OUTCOME_REF?.test(value) !== false) violations.push(`outcome grammar accepted ${value}`);
    for (const value of [
      `operations/close/plans/${"c".repeat(64)}/plan.json`,
      `operations/close/plans/${"c".repeat(63)}/plan.json`,
      `operations/close/plans/${"C".repeat(64)}/plan.json`,
      `operations/close/plans/${"c".repeat(64)}/steps/archive-spec.json`,
    ]) {
      const expected = value.endsWith(`/${"c".repeat(64)}/plan.json`);
      if (CLOSE_PLAN_REF?.test(value) !== expected) violations.push(`close-plan grammar disagreed on ${value}`);
    }
    expect(violations).toEqual([]);
  });
});
