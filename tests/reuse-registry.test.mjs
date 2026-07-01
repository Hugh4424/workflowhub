// Phase 4: reuse-registry.md well-formedness + CONTEXT.md component-skill concept.
import { test, describe } from "vitest";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const REGISTRY_PATH = join(REPO_ROOT, "skills", "reuse-registry.md");
const ENUM = ["外部改造适配", "自研", "其他平台原生", "外部依赖"];
const EXPECTED = [
  ["make-decision", "自研", "none"],
  ["build-spec", "自研", "none"],
  ["build-plan", "自研", "none"],
  ["build-code", "自研", "none"],
  ["verify-code", "自研", "none"],
  ["scope-triage", "外部改造适配"],
  ["decision-log", "外部改造适配"],
  ["Worker-Mode", "外部依赖"],
  ["3rd-review", "外部依赖"],
  ["TDD 件（capture.mjs）", "外部改造适配"],
];

describe("reuse-registry.md (FR-REG-001/002)", () => {
  test("reuse-registry.md exists under skills", () => {
    assert.ok(existsSync(REGISTRY_PATH), "Missing skills/reuse-registry.md");
  });
  test("registry has all 7 skills with valid 复用类别 enum + non-empty source for external", () => {
    const content = readFileSync(REGISTRY_PATH, "utf-8");
    for (const [name, category] of EXPECTED) {
      const row = content.split("\n").find((l) => l.includes(`| ${name} `) || l.includes(`|${name}|`) || l.includes(`| ${name}|`));
      assert.ok(row, `Missing registry row for ${name}`);
      assert.ok(ENUM.includes(category), `${name} category not in enum`);
      assert.ok(row.includes(category), `${name} row missing category ${category}`);
      if (category === "外部改造适配") {
        // external skill must have a non-empty source path (not 'none')
        const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
        const src = cells[2] || "";
        assert.ok(src.length > 0 && src !== "none", `${name} external skill must have non-empty source path`);
      }
    }
  });
  test("CONTEXT.md defines 组件 skill concept", () => {
    const ctx = readFileSync(join(REPO_ROOT, "CONTEXT.md"), "utf-8");
    assert.ok(ctx.includes("组件 skill"), "CONTEXT.md missing 组件 skill concept");
  });
});
