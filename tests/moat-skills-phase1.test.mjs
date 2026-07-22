import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

function filePath(...parts) {
  return join(REPO_ROOT, ...parts);
}

function readRequiredFile(...parts) {
  const p = filePath(...parts);
  assert.ok(existsSync(p), `Missing required file: ${parts.join("/")}`);
  return readFileSync(p, "utf8");
}

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, "SKILL.md must start with YAML frontmatter");
  return match[1];
}

function assertNonEmptyFrontmatterName(content, relativePath) {
  const frontmatter = extractFrontmatter(content);
  const nameLine = frontmatter
    .split(/\r?\n/)
    .find((line) => /^name:\s*\S+/.test(line));
  assert.ok(nameLine, `${relativePath} frontmatter must contain a non-empty name field`);
}

function listFilesRecursive(relativeDir) {
  const root = filePath(relativeDir);
  assert.ok(existsSync(root), `Missing required directory: ${relativeDir}`);
  const files = [];

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      const stats = statSync(p);
      if (stats.isDirectory()) walk(p);
      else if (stats.isFile()) files.push(p);
    }
  }

  walk(root);
  return files;
}

function assertNoForbiddenStrings(relativeDir, forbiddenPattern, label) {
  for (const p of listFilesRecursive(relativeDir)) {
    const content = readFileSync(p, "utf8");
    assert.equal(
      forbiddenPattern.test(content),
      false,
      `${p.replace(REPO_ROOT + "/", "")} must not contain ${label}`
    );
  }
}

describe("Stage 1 moat skill files", () => {
  test("talk-with-zhipeng SKILL.md exists with required frontmatter and sections", () => {
    const content = readRequiredFile("skills", "talk-with-zhipeng", "SKILL.md");
    assertNonEmptyFrontmatterName(content, "skills/talk-with-zhipeng/SKILL.md");
    assert.match(content, /输入|入参|已有调研|初始咨询材料/, "talk skill must describe inputs");
    assert.match(content, /步骤|执行协议|核心层/, "talk skill must describe steps or protocol");
    assert.match(content, /输出|产出|决策记录/, "talk skill must describe outputs");
    assert.match(content, /影响排序|impact/, "talk skill must keep impact-ordered questioning");
    assert.match(content, /talk/, "talk skill must retain the talk keyword");
  });

  test("grill-with-docs full file set exists with required frontmatter", () => {
    const skill = readRequiredFile("skills", "grill-with-docs", "SKILL.md");
    assertNonEmptyFrontmatterName(skill, "skills/grill-with-docs/SKILL.md");
    assert.ok(existsSync(filePath("skills", "grill-with-docs", "CONTEXT-FORMAT.md")));
    assert.ok(existsSync(filePath("skills", "grill-with-docs", "ADR-FORMAT.md")));
    assert.match(skill, /输入|Input|what-to-do|supporting-info/, "grill skill must describe inputs or usage context");
    assert.match(skill, /步骤|During the session|执行协议/, "grill skill must describe steps or session protocol");
    assert.match(skill, /输出|Update CONTEXT\.md|ADR/, "grill skill must describe outputs");
    assert.match(skill, /grill/i, "grill skill must retain the grill keyword");
  });

  test("intake-decision-review SKILL.md exists with required frontmatter", () => {
    const content = readRequiredFile("skills", "intake-decision-review", "SKILL.md");
    assertNonEmptyFrontmatterName(content, "skills/intake-decision-review/SKILL.md");
  });
});

describe("Stage 1 moat skills avoid host-specific residue", () => {
  test("talk-with-zhipeng has no host repository, gbrain, office-hours, or host path residue", () => {
    assertNoForbiddenStrings(
      "skills/talk-with-zhipeng",
      /[a-z0-9][a-z0-9._-]*-agenthub\b|gbrain|office-hours|\/Users\/|\/home\//i,
      "host-specific residue"
    );
  });

  test("grill-with-docs has no local absolute paths or host environment references", () => {
    assertNoForbiddenStrings(
      "skills/grill-with-docs",
      /\/Users\/|\/home\/|~\/\.claude|[a-z0-9][a-z0-9._-]*-agenthub\b|gbrain|office-hours/i,
      "local absolute paths or host environment references"
    );
  });

  test("intake-decision-review has no local absolute paths or host environment references", () => {
    assertNoForbiddenStrings(
      "skills/intake-decision-review",
      /\/Users\/|\/home\/|~\/\.claude|[a-z0-9][a-z0-9._-]*-agenthub\b|gbrain|office-hours/i,
      "local absolute paths or host environment references"
    );
  });
});

describe("intake-decision-review execution protocol", () => {
  test("is a pure blind direction lens owned by wh-review", () => {
    const content = readRequiredFile("skills", "intake-decision-review", "SKILL.md");
    assert.match(content, /pure review lens/i);
    assert.match(content, /used only by the `wh-review` make-decision[\s\S]*direction track/i);
    assert.match(content, /`wh-review` owns[\s\S]*provider invocation/i);
    assert.match(content, /never invokes a provider/i);
    assert.match(content, /never[\s\S]*asks the user a question[\s\S]*waits for[\s\S]*confirmation/i);
    assert.doesNotMatch(content, /\bS9\b|fallback_used|single 3rd-review call/i);
  });

  test("defines four blind angles with no fixed findings cap", () => {
    const content = readRequiredFile("skills", "intake-decision-review", "SKILL.md");
    assert.match(content, /direction/, "must include direction review angle");
    assert.match(content, /framing/, "must include framing review angle");
    assert.match(content, /scope/, "must include scope review angle");
    assert.match(content, /feasibility/, "must include feasibility review angle");
    assert.match(content, /0-N|do not cap real findings/i, "must state no fixed cap on findings count");
  });

  test("accepts only objective blind material and rejects candidate material", () => {
    const content = readRequiredFile("skills", "intake-decision-review", "SKILL.md");
    assert.match(content, /raw user requirement/i);
    assert.match(content, /objective facts/i);
    assert.match(content, /hard constraints/i);
    assert.match(content, /explicit non-goals/i);
    assert.match(content, /must not contain[\s\S]*proposed or recommended solution/i);
    assert.match(content, /decision log[\s\S]*specification[\s\S]*plan[\s\S]*code[\s\S]*diff/i);
    assert.match(content, /Missing required material, forbidden material[\s\S]*`unavailable`/i);
  });
});
