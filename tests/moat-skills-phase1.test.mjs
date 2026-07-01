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
  test("talk-with-zhipeng has no multica-agenthub, gbrain, office-hours, or host path residue", () => {
    assertNoForbiddenStrings(
      "skills/talk-with-zhipeng",
      /multica-agenthub|gbrain|office-hours|\/Users\/|\/home\//,
      "host-specific residue"
    );
  });

  test("grill-with-docs has no local absolute paths or host environment references", () => {
    assertNoForbiddenStrings(
      "skills/grill-with-docs",
      /\/Users\/|\/home\/|~\/\.claude|multica-agenthub|gbrain|office-hours/,
      "local absolute paths or host environment references"
    );
  });

  test("intake-decision-review has no local absolute paths or host environment references", () => {
    assertNoForbiddenStrings(
      "skills/intake-decision-review",
      /\/Users\/|\/home\/|~\/\.claude|multica-agenthub|gbrain|office-hours/,
      "local absolute paths or host environment references"
    );
  });
});

describe("intake-decision-review execution protocol", () => {
  test("contains S0 through S9 protocol steps", () => {
    const content = readRequiredFile("skills", "intake-decision-review", "SKILL.md");
    for (let i = 0; i <= 9; i += 1) {
      assert.match(content, new RegExp(`\\bS${i}\\b`), `Missing S${i} step`);
    }
  });

  test("defines the three-angle review contract and exactly three findings", () => {
    const content = readRequiredFile("skills", "intake-decision-review", "SKILL.md");
    assert.match(content, /direction/, "must include direction review angle");
    assert.match(content, /framing/, "must include framing review angle");
    assert.match(content, /scope/, "must include scope review angle");
    assert.match(content, /恰好\s*3\s*条|exactly\s*3|3\s*条\s*findings/i, "must require exactly 3 findings");
    assert.match(content, /单次|single\s+call|一次调用/i, "must require a single 3rd-review call");
  });

  test("rejects fallback and incomplete findings without inventing missing angles", () => {
    const content = readRequiredFile("skills", "intake-decision-review", "SKILL.md");
    assert.match(content, /fallback_used/, "must inspect fallback_used");
    assert.match(content, /停止|报错|blocked|不采用/, "fallback_used must stop instead of continuing");
    assert.match(content, /不足|缺角度|缺.*角度/, "must detect insufficient findings or missing angles");
    assert.match(content, /重跑|rerun|重新调用/, "must require rerun on missing findings or angles");
    assert.match(content, /不得编造|不自行编造|不得补齐|不补齐/, "must not invent missing angles");
  });

  test("S2, S4, and S9 user communication rules are explicit", () => {
    const content = readRequiredFile("skills", "intake-decision-review", "SKILL.md");
    const s2 = content.match(/S2[\s\S]*?(?=\n###?\s*S3\b|\n##\s*S3\b)/)?.[0] ?? "";
    const s4 = content.match(/S4[\s\S]*?(?=\n###?\s*S5\b|\n##\s*S5\b)/)?.[0] ?? "";
    const s9 = content.match(/S9[\s\S]*$/)?.[0] ?? "";

    assert.match(s2, /推荐/, "S2 options must include a recommendation marker");
    assert.match(s2, /后果|影响|会导致|这样做/, "S2 options must explain consequences in Chinese");
    assert.match(s4, /推荐/, "S4 problem options must include a recommendation marker");
    assert.match(s4, /后果|影响|会导致|这样做/, "S4 options must explain consequences in Chinese");
    assert.match(s9, /不确认|等待确认/, "S9 must say it will wait and not continue without confirmation");
  });
});
