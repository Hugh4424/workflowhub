/**
 * section7-machine-checkable.test.mjs — T016 (FR-THIRDREVIEW-002, spec.md AC6-1~AC6-4)
 *
 * Operationalizes AC6-1~AC6-4's machine-checkable rules directly as assertions
 * against `workflows/build-code/SKILL.md` §7 (no separate lint tool is built —
 * per plan.md this test file itself IS the check).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_MD_PATH = join(__dirname, "..", "SKILL.md");

function extractSection7(content) {
  const lines = content.split("\n");
  const startIdx = lines.findIndex((l) => /^###\s*7\./.test(l));
  if (startIdx === -1) {
    throw new Error("§7 heading (### 7. ...) not found in build-code SKILL.md");
  }
  const endIdx = lines.findIndex((l, i) => i > startIdx && /^###\s*8\./.test(l));
  if (endIdx === -1) {
    throw new Error("§8 heading (### 8. ...) not found after §7 in build-code SKILL.md");
  }
  return lines.slice(startIdx, endIdx).join("\n");
}

describe("build-code SKILL.md §7 (AC6-1~AC6-4 machine-checkable rules)", () => {
  const section7 = extractSection7(readFileSync(SKILL_MD_PATH, "utf8"));

  it("AC6-1: does not contain a numbered list (1. 2. 3.)", () => {
    expect(section7).not.toMatch(/^\s*\d+\.\s/m);
  });

  it("AC6-2: does not contain if/else/conditional-branch logic description", () => {
    expect(section7).not.toMatch(/\bif\b|\belse\b|如果|否则|条件分支/i);
  });

  it("AC6-3: contains the '单次调用语义参见 §13' pointer (or an equivalent statement)", () => {
    expect(section7).toMatch(/单次调用语义.*§13/);
  });

  it("AC6-4: does not contain equivalent sequential-step-bypass wording (CN or EN)", () => {
    expect(section7).not.toMatch(/第一步|首先|其次|然后|接着|最后/);
    expect(section7).not.toMatch(/\bstep\s*1\b|\bfirst\b.*\bthen\b|\bfinally\b|\bnext\b/i);
  });
});
