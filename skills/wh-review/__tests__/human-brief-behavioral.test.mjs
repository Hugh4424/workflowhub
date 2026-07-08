/**
 * human-brief-behavioral.test.mjs — T023b (AC-D6, round19 修复)
 *
 * Honest scope note (documented per fail-loud / no-fake-completion discipline):
 * `docs/human-brief-template.md` is a pure prose template with no programmatic
 * renderer/consumer in this repo — there is no deterministic runtime harness
 * that can "actually trigger" an LLM stage agent's closing flow and capture
 * its generated human-brief text inside a vitest test. A literal behavioral
 * test as tasks.md's wording suggests is therefore not achievable here.
 *
 * This test is the best-faithful static/structural proxy, following the same
 * established precedent as `workflows/build-code/__tests__/section7-machine-
 * checkable.test.mjs` (T016): it operationalizes what CAN be checked
 * mechanically — that each of the 5 stage SKILL.md files' closing section (a)
 * actually points at `docs/human-brief-template.md`, (b) instructs producing
 * the 七要素 (seven elements), (c) carries forward the template's hard rule
 * forbidding internal artifact/field-name literals in the *rendered* brief,
 * and (d) uses the ending form matching its own gate classification (D2
 * human-confirmation gate vs auto-advance) — never both, never neither.
 *
 * Path note: tasks.md names this file `workflows/__tests__/human-brief-
 * behavioral.test.mjs`. This phase's allowed_paths (FR-DIFF-002 Scope
 * Boundary) does not cover that path — only `skills/wh-review/`, the 5 stage
 * SKILL.md files themselves, one specific pre-existing build-code test file,
 * and `specs/wh-review-rebuild/` are in scope. `workflows` glob patterns are
 * also not in vitest.config.mjs's `include` list (only the workflows/build-
 * code/__tests__ directory's test files are), and extending either is itself
 * out of this phase's scope. This file is placed under `skills/wh-review/
 * __tests__/` instead —
 * in scope for both the diff-scanner allowlist and the vitest include glob —
 * since wh-review is the natural owner of this cross-stage contract test
 * regardless of which directory tasks.md originally named.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..", "..");

const GATE_STAGES = ["make-decision", "build-plan", "verify-code"];
const AUTO_ADVANCE_STAGES = ["build-spec", "build-code"];
const ALL_STAGES = [...GATE_STAGES, ...AUTO_ADVANCE_STAGES];

/**
 * Extract the closing "human-brief" instruction block from a stage's
 * SKILL.md: from the line referencing docs/human-brief-template.md, up to
 * (but not including) the next level-2 (`## `) heading, or EOF if none.
 *
 * Level-2 (not level-3/4) is the right granularity here: some stages
 * (e.g. verify-code) split "produce the brief" (### 9) and "ask for the
 * actual confirmation" (### 11) across sibling level-3 subsections of the
 * same closing flow — bounding at the next level-3 heading would truncate
 * before the real ending marker. Bounding at the next level-2 heading keeps
 * the whole closing flow together without reaching into an unrelated later
 * top-level section (S9/Step 9/### 9 etc. are themselves already scoped
 * inside one level-2 section in every stage file).
 */
function extractHumanBriefBlock(stage) {
  const path = join(REPO_ROOT, "workflows", stage, "SKILL.md");
  const lines = readFileSync(path, "utf8").split("\n");
  const startIdx = lines.findIndex((l) => l.includes("human-brief-template.md"));
  if (startIdx === -1) {
    throw new Error(`workflows/${stage}/SKILL.md does not reference docs/human-brief-template.md`);
  }
  let endIdx = lines.findIndex((l, i) => i > startIdx && /^##\s+\S/.test(l) && !/^###/.test(l));
  if (endIdx === -1) endIdx = lines.length;
  return lines.slice(startIdx, endIdx).join("\n");
}

describe("human-brief closing-flow contract across all 5 stages (T023b, AC-D6)", () => {
  for (const stage of ALL_STAGES) {
    describe(`workflows/${stage}/SKILL.md`, () => {
      const block = extractHumanBriefBlock(stage);

      it("references docs/human-brief-template.md", () => {
        expect(block).toMatch(/human-brief-template\.md/);
      });

      it("instructs producing the 七要素 (seven elements)", () => {
        expect(block).toMatch(/七要素|seven elements/);
      });

      it("carries forward the hard rule against internal artifact/field-name literals in the rendered brief", () => {
        expect(block).toMatch(/不出现内部产物名|禁止出现内部产物名|internal artifact names/);
      });
    });
  }

  // The literal rendered gate ending is "请确认：" (with a colon) followed by the
  // option list — that is the actual ending FORM being used. Auto-advance stages
  // legitimately still mention the bare phrase "请确认" in prose while explaining
  // that they do NOT use it (e.g. "Do not append a '请确认' section") — that is
  // correct, expected content, not a violation. So the discriminator checks for
  // the colon-terminated ending form specifically, not the bare substring.
  const GATE_ENDING_FORM = /请确认[:：]/;
  // Same negation-awareness concern as the gate-ending check above, mirrored: gate
  // stages legitimately say "不得自动放行"/"不得自动通过" while explaining why they
  // are NOT an auto-advance stage — that bare "自动放行"/"自动通过" substring match
  // would be a false positive. Anchor on the actual ending-form names instead of
  // the bare verbs so a negated mention of the concept doesn't trip this check.
  const AUTO_ADVANCE_ENDING_FORM = /自动放行结尾|自动进入下一阶段/;

  describe("D2 human-confirmation gate stages (make-decision / build-plan / verify-code)", () => {
    for (const stage of GATE_STAGES) {
      it(`${stage}: uses the "请确认：" gate ending form, not the auto-advance ending`, () => {
        const block = extractHumanBriefBlock(stage);
        expect(block).toMatch(GATE_ENDING_FORM);
        expect(block).not.toMatch(AUTO_ADVANCE_ENDING_FORM);
      });
    }
  });

  describe("auto-advance stages (build-spec / build-code)", () => {
    for (const stage of AUTO_ADVANCE_STAGES) {
      it(`${stage}: uses the auto-advance ending, never the "请确认：" gate ending form`, () => {
        const block = extractHumanBriefBlock(stage);
        expect(block).toMatch(AUTO_ADVANCE_ENDING_FORM);
        expect(block).not.toMatch(GATE_ENDING_FORM);
      });
    }
  });
});
