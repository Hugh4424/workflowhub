import { describe, expect, it } from "vitest";
import {
  loadStageManifest,
  validateAllStageManifests,
  validateStepManifest,
} from "../runtime/stage/step-manifest.mjs";

const repoRoot = new URL("..", import.meta.url).pathname;
const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

function step(step_id, order, depends_on = [], entry_conditions = null) {
  return {
    step_id,
    step_slug: `step-${step_id}`,
    order,
    entry_conditions: entry_conditions ?? (
      depends_on.length > 0
        ? depends_on.map((dependencyId) => ({ kind: "precondition", uri_or_path: `step://${dependencyId}` }))
        : [{ kind: "precondition", uri_or_path: `memory://${step_id}/entry` }]
    ),
    completion_evidence: [{ kind: "evidence", uri_or_path: `memory://${step_id}/done` }],
    observable_result: `${step_id} completed`,
    depends_on,
  };
}

function manifest(steps = [step(1, 1), step(2, 2, [1])]) {
  return { schema_version: "2.0.0", stage_slug: "make-decision", steps };
}

describe("canonical step manifest", () => {
  it("accepts a manifest with required fields, contiguous order, and ordered dependencies", () => {
    expect(validateStepManifest(manifest())).toEqual({ ok: true, errors: [] });
  });

  it("rejects duplicate stable step IDs", () => {
    const result = validateStepManifest(manifest([step(1, 1), step(1, 2)]));

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/duplicate.*step_id|step_id.*duplicate/i);
  });

  it("rejects an order gap", () => {
    const result = validateStepManifest(manifest([step(1, 1), step(2, 3)]));

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/continuous|contiguous|order.*gap/i);
  });

  it("rejects a step without all required execution evidence fields", () => {
    const incomplete = step(1, 1);
    delete incomplete.entry_conditions;
    delete incomplete.completion_evidence;
    delete incomplete.observable_result;

    const result = validateStepManifest(manifest([incomplete]));

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/entry_conditions/i);
    expect(result.errors.join("\n")).toMatch(/completion_evidence/i);
    expect(result.errors.join("\n")).toMatch(/observable_result/i);
  });

  it("rejects a dependency that does not identify a declared step", () => {
    const result = validateStepManifest(manifest([step(1, 1, [99]) ]));

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/missing-step|depend/i);
  });

  it("rejects a dependency without matching entry evidence", () => {
    const result = validateStepManifest(manifest([
      step(1, 1),
      step(2, 2, [1], [{ kind: "precondition", uri_or_path: "memory://2/entry" }]),
    ]));

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/entry_conditions.*step:\/\/prepare|dependency.*entry evidence/i);
  });

  it("rejects a forward dependency even when its entry evidence is declared", () => {
    const result = validateStepManifest(manifest([
      step(1, 1, [2]),
      step(2, 2),
    ]));

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/must be declared before its dependent/i);
  });

  it("rejects blank dependency identifiers", () => {
    const result = validateStepManifest(manifest([step(1, 1, [0]) ]));

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/depends_on.*positive integers|dependency.*positive/i);
  });

  it("rejects malformed entry and completion evidence references", () => {
    const malformed = step(1, 1);
    malformed.entry_conditions = [{ kind: "precondition" }];
    malformed.completion_evidence = ["evidence"];

    const result = validateStepManifest(manifest([malformed]));

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/entry_conditions.*kind.*uri_or_path|entry_conditions.*uri_or_path/i);
    expect(result.errors.join("\n")).toMatch(/completion_evidence.*object/i);
  });

  it("rejects cyclic dependencies", () => {
    const result = validateStepManifest(
      manifest([step(1, 1, [2]), step(2, 2, [1])])
    );

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/cycle|cyclic/i);
  });

  it("loads and validates exactly the five canonical stage manifests", () => {
    const manifests = STAGES.map((stage) => loadStageManifest(stage, repoRoot));
    const result = validateAllStageManifests(repoRoot);

    expect(manifests.map((item) => item.stage_slug).sort()).toEqual([...STAGES].sort());
    expect(result).toEqual({ ok: true, errors: [] });
    for (const item of manifests) {
      expect(validateStepManifest(item)).toEqual({ ok: true, errors: [] });
    }
  });

  it("keeps all five portable manifests on four materials and quality facts without legacy control-plane containers", () => {
    const forbidden = /journal:\/\/|task:\/\/content|confirmations:\/\/|results:\/\/current|task:\/\/(?:stage-result|stage-attempt)|\b(?:invocation|receipt)\b/i;

    for (const stage of STAGES) {
      const item = loadStageManifest(stage, repoRoot);
      const source = JSON.stringify(item);
      expect(source, `${stage} must not describe a legacy control plane`).not.toMatch(forbidden);
      expect(item.steps[0].entry_conditions).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: "portable_skill_package", uri_or_path: `workflows/${stage}/SKILL.md` }),
        expect.objectContaining({ kind: "portable_skill_dependencies", uri_or_path: `workflows/${stage}/skill-deps.yaml` }),
      ]));
      expect(item.steps.at(-1).observable_result).toMatch(/plain-language handoff|大白话交接|验收通知/i);

      for (const stepItem of item.steps) {
        for (const evidence of [...stepItem.entry_conditions, ...stepItem.completion_evidence]) {
          if (!evidence.uri_or_path.startsWith("step://")) {
            expect(evidence.uri_or_path, `${stage}/${stepItem.step_slug} must use a real path or host-visible input`)
              .not.toMatch(/^[a-z][a-z0-9_-]*:\/\//i);
          }
        }
      }
    }
  });
});
