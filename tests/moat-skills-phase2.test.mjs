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

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, "SKILL.md must start with YAML frontmatter");
  return match[1];
}

describe("Stage 4 MCP declaration", () => {
  test(".mcp.json exists, parses, and declares muyu-search-mcp", () => {
    const content = readRequiredFile(".mcp.json");
    assert.match(content, /muyu-search-mcp/, ".mcp.json must contain the muyu-search-mcp server key");

    const config = JSON.parse(content);
    assert.ok(config.mcpServers, ".mcp.json must contain mcpServers");
    const server = config.mcpServers["muyu-search-mcp"];
    assert.ok(server, "mcpServers.muyu-search-mcp must exist");
    assert.deepEqual(server.args, ["--from", "${MUYU_MCP_PATH}", "muyu-search"]);
  });

  test(".mcp.json uses placeholders instead of real API keys", () => {
    const config = JSON.parse(readRequiredFile(".mcp.json"));
    const serialized = JSON.stringify(config);

    assert.equal(/"sk-[^"]+"/.test(serialized), false, "MUYU_API_KEY must not be committed as a real sk-* value");
    assert.equal(/"tvly-[^"]+"/.test(serialized), false, "TAVILY_API_KEY must not be committed as a real tvly-* value");
    assert.equal(/"fc-[^"]+"/.test(serialized), false, "FIRECRAWL_API_KEY must not be committed as a real fc-* value");
    assert.equal(serialized.includes("/Users/"), false, ".mcp.json must not contain local /Users/ paths");
    assert.equal(serialized.includes("/home/"), false, ".mcp.json must not contain local /home/ paths");
  });
});

describe("Stage 4 anysearch skill", () => {
  test("SKILL.md exists with non-empty name frontmatter", () => {
    const content = readRequiredFile("skills", "anysearch", "SKILL.md");
    const frontmatter = extractFrontmatter(content);
    const nameLine = frontmatter
      .split(/\r?\n/)
      .find((line) => /^name:\s*\S+/.test(line));

    assert.ok(nameLine, "skills/anysearch/SKILL.md frontmatter must contain a non-empty name field");
  });

  test("copied anysearch files do not contain local absolute paths", () => {
    for (const p of listFilesRecursive("skills/anysearch")) {
      const content = readFileSync(p, "utf8");
      assert.equal(content.includes("/Users/"), false, `${p.replace(REPO_ROOT + "/", "")} must not contain /Users/`);
      assert.equal(content.includes("/home/"), false, `${p.replace(REPO_ROOT + "/", "")} must not contain /home/`);
    }
  });

  test(".env.example exists and .env is ignored", () => {
    const envExample = readRequiredFile("skills", "anysearch", ".env.example");
    assert.match(envExample, /^ANYSEARCH_API_KEY=.+/m, ".env.example must provide ANYSEARCH_API_KEY placeholder");
    assert.match(envExample, /^MUYU_MCP_PATH=.+/m, ".env.example must provide MUYU_MCP_PATH placeholder");

    const rootGitignore = existsSync(filePath(".gitignore")) ? readFileSync(filePath(".gitignore"), "utf8") : "";
    const skillGitignore = existsSync(filePath("skills", "anysearch", ".gitignore"))
      ? readFileSync(filePath("skills", "anysearch", ".gitignore"), "utf8")
      : "";

    assert.ok(
      /^\.env$/m.test(rootGitignore) || /^\.env$/m.test(skillGitignore),
      ".gitignore or skills/anysearch/.gitignore must contain a .env rule"
    );
  });
});
