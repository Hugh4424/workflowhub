import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

function readRequiredFile(...parts) {
  const p = join(REPO_ROOT, ...parts);
  assert.ok(existsSync(p), `Missing required file: ${parts.join("/")}`);
  return readFileSync(p, "utf8");
}

function section(content, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`## ${escaped}[\\s\\S]*?(?=\\n---\\n|\\n## S\\d|\\n## Journal|$)`));
  assert.ok(match, `Missing section: ${heading}`);
  return match[0];
}

describe("Stage 2 make-decision moat references", () => {
  const skill = readRequiredFile("workflows", "make-decision", "SKILL.md");

  test("S5 points blind review at the in-repo intake-decision-review skill", () => {
    assert.match(
      section(skill, "S5"),
      /skills\/intake-decision-review/,
      "S5 must reference skills/intake-decision-review"
    );
  });

  test("S7 points grill at the in-repo grill-with-docs skill", () => {
    assert.match(section(skill, "S7"), /skills\/grill-with-docs/, "S7 must reference skills/grill-with-docs");
  });

  test("talk rounds point at the in-repo talk-with-zhipeng skill", () => {
    assert.match(section(skill, "S2"), /skills\/talk-with-zhipeng/, "S2 must reference skills/talk-with-zhipeng");
    assert.match(section(skill, "S4"), /skills\/talk-with-zhipeng/, "S4 must reference skills/talk-with-zhipeng");
    assert.match(section(skill, "S7"), /skills\/talk-with-zhipeng/, "S7 must reference skills/talk-with-zhipeng");
  });

  test("old external talk references are gone", () => {
    assert.equal(/multica-agenthub.*talk/i.test(skill), false, "must not contain multica-agenthub talk references");
    assert.equal(/~\/\.claude.*talk/i.test(skill), false, "must not contain ~/.claude talk references");
  });
});

describe("Stage 2 make-decision tracking root", () => {
  const skill = readRequiredFile("workflows", "make-decision", "SKILL.md");

  test("declares TASK_TRACKING_ROOT and records fallback when unset", () => {
    assert.match(skill, /TASK_TRACKING_ROOT/, "SKILL.md must declare TASK_TRACKING_ROOT");
    assert.match(skill, /tracking_root_fallback/, "SKILL.md must mention tracking_root_fallback");
  });
});

describe("Stage 2 make-decision plain Chinese user communication", () => {
  const skill = readRequiredFile("workflows", "make-decision", "SKILL.md");

  test("S2 uses recommended plain Chinese options", () => {
    const s2 = section(skill, "S2");
    assert.match(s2, /推荐/, "S2 must mark a recommended option");
    assert.doesNotMatch(s2, /\b(framing|scope)\b/i, "S2 must not expose English framing/scope terms");
  });

  test("S4 uses recommended plain Chinese options", () => {
    const s4 = section(skill, "S4");
    assert.match(s4, /推荐/, "S4 must mark a recommended option");
    assert.doesNotMatch(s4, /\b(framing|scope)\b/i, "S4 must not expose English framing/scope terms");
  });

  test("S9 explicitly waits for confirmation before continuing", () => {
    assert.match(section(skill, "S9"), /不确认|等待确认/, "S9 must say it will wait and not continue without confirmation");
  });
});
