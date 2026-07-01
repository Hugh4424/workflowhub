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

function extractFrontmatter(content, relativePath) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${relativePath} must start with YAML frontmatter`);
  return match[1];
}

function assertNonEmptyFrontmatterName(content, relativePath) {
  const frontmatter = extractFrontmatter(content, relativePath);
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

function assertNoPatternInFiles(relativeDir, pattern, label) {
  for (const p of listFilesRecursive(relativeDir)) {
    const content = readFileSync(p, "utf8");
    assert.equal(
      pattern.test(content),
      false,
      `${p.replace(REPO_ROOT + "/", "")} must not contain ${label}`
    );
  }
}

function section(content, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`## ${escaped}[\\s\\S]*?(?=\\n---\\n|\\n## S\\d|\\n## Journal|$)`));
  assert.ok(match, `Missing section: ${heading}`);
  return match[0];
}

const skillPaths = [
  "skills/talk-with-zhipeng/SKILL.md",
  "skills/grill-with-docs/SKILL.md",
  "skills/intake-decision-review/SKILL.md",
  "skills/anysearch/SKILL.md",
];

describe("moat skill integrated file presence and frontmatter", () => {
  test("all required phase artifacts exist", () => {
    for (const relativePath of [...skillPaths, ".mcp.json"]) {
      assert.ok(existsSync(filePath(relativePath)), `Missing required file: ${relativePath}`);
    }
  });

  test("each skill declares a non-empty frontmatter name", () => {
    for (const relativePath of skillPaths) {
      assertNonEmptyFrontmatterName(readRequiredFile(relativePath), relativePath);
    }
  });
});

describe("make-decision in-repo references", () => {
  const skill = readRequiredFile("workflows", "make-decision", "SKILL.md");

  test("S5 references intake-decision-review", () => {
    assert.match(section(skill, "S5"), /skills\/intake-decision-review/);
  });

  test("S7 references grill-with-docs", () => {
    assert.match(section(skill, "S7"), /skills\/grill-with-docs/);
  });

  test("talk-with-zhipeng is referenced and multica-agenthub is gone", () => {
    assert.match(skill, /skills\/talk-with-zhipeng/);
    assert.equal(/multica-agenthub/.test(skill), false, "make-decision must not contain multica-agenthub");
  });
});

describe("intake-decision-review contract", () => {
  const skill = readRequiredFile("skills", "intake-decision-review", "SKILL.md");

  test("declares the three review angles", () => {
    assert.match(skill, /direction|方向/);
    assert.match(skill, /framing|框架/);
    assert.match(skill, /scope|范围/);
  });

  test("declares single-call, exactly-three, fallback, and no-invention behavior", () => {
    assert.match(skill, /恰好.*3|exactly.*3|findings.*length.*3|3.*findings/i);
    assert.match(skill, /fallback_used/);
    assert.match(skill, /单次|single.*call|once/i);
    assert.match(skill, /不得编造|不自行编造|缺角度|重跑|rerun/i);
  });
});

describe("moat skill directories are host portable", () => {
  const forbiddenHostPattern = /multica-agenthub|gbrain|office-hours/;

  test("talk-with-zhipeng has no host-specific references", () => {
    assertNoPatternInFiles("skills/talk-with-zhipeng", forbiddenHostPattern, "host-specific references");
  });

  test("grill-with-docs has no host-specific references", () => {
    assertNoPatternInFiles("skills/grill-with-docs", forbiddenHostPattern, "host-specific references");
  });

  test("intake-decision-review has no host-specific references", () => {
    assertNoPatternInFiles("skills/intake-decision-review", forbiddenHostPattern, "host-specific references");
  });

  test("anysearch has no host-specific references or absolute local paths", () => {
    assertNoPatternInFiles("skills/anysearch", forbiddenHostPattern, "host-specific references");
    assertNoPatternInFiles("skills/anysearch", /\/Users\/|\/home\//, "absolute local paths");
  });
});

describe("muyu search MCP declaration", () => {
  test(".mcp.json mentions and parses muyu-search-mcp", () => {
    const content = readRequiredFile(".mcp.json");
    assert.match(content, /muyu-search-mcp/);

    const config = JSON.parse(content);
    assert.ok(config.mcpServers?.["muyu-search-mcp"], "mcpServers.muyu-search-mcp must exist");
  });
});

describe("reuse registry entries", () => {
  const registry = readRequiredFile("config", "reuse-registry.md");

  test("registers the three reusable moat skills with in-repo relative paths", () => {
    const expectedEntries = [
      ["talk-with-zhipeng", "skills/talk-with-zhipeng/"],
      ["grill-with-docs", "skills/grill-with-docs/"],
      ["intake-decision-review", "skills/intake-decision-review/"],
    ];

    for (const [name, relativePath] of expectedEntries) {
      assert.match(
        registry,
        new RegExp(`${name}[^\\n]*${relativePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
        `${name} must be registered with ${relativePath}`
      );
      assert.equal(relativePath.startsWith("/"), false, `${relativePath} must be relative`);
    }
  });

  test("registry has no ghost paths or host environment references", () => {
    assert.equal(/\/Users\/|\/home\//.test(registry), false, "registry must not contain ghost absolute paths");
    assert.equal(
      /~\/\.claude|multica-agenthub|gbrain|office-hours/.test(registry),
      false,
      "registry must not contain host environment references"
    );
  });
});
