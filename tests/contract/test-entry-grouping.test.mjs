import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const scripts = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8")).scripts;
const config = (await import(pathToFileURL(resolve(repoRoot, "vitest.config.mjs")).href)).default.test;
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
  cwd: repoRoot, encoding: "utf8",
}).trim().split("\n").filter((file) => file.endsWith(".test.mjs") && existsSync(resolve(repoRoot, file)));

function globRegex(glob) {
  let pattern = "";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    if (char === "*" && glob[index + 1] === "*") {
      index += 1;
      if (glob[index + 1] === "/") { index += 1; pattern += "(?:.*/)?"; }
      else pattern += ".*";
    } else if (char === "*") pattern += "[^/]*";
    else if (char === "?") pattern += "[^/]";
    else pattern += char.replace(/[.+^${}()|[\]\\]/gu, "\\$&");
  }
  return new RegExp(`^${pattern}$`, "u");
}

const matchesFilter = (file, filter) => /[*?]/u.test(filter)
  ? globRegex(filter).test(file) : file.includes(filter);
const configuredSuite = (file) => config.include.some((glob) => globRegex(glob).test(file))
  && !config.exclude.some((glob) => globRegex(glob).test(file))
  && /\bfrom\s+["']vitest["']/u.test(readFileSync(resolve(repoRoot, file), "utf8"));
const entries = Object.entries(scripts).filter(([name]) => name.startsWith("test:"));

describe("explicit test entry grouping", () => {
  it("removes aggregate, retired capture and closure script entries", () => {
    for (const name of ["test", "test:safe", "test:profile", "test:acceptance", "check:skill-closure", "smoke:skill-packages"]) {
      expect(scripts, `retired script ${name}`).not.toHaveProperty(name);
    }
    expect(Object.keys(scripts).filter((name) => /^(?:probe|compare):/u.test(name))).toEqual([]);
    expect(scripts.check).toBe('markdownlint-cli2 "**/*.md" && node tools/cli/verify-structure.mjs && node tools/cli/run-checks.mjs');
  });

  it("points every directory or file filter at existing collectible suites", () => {
    expect(entries.length).toBeGreaterThan(0);
    expect(scripts["test:skills"]).toBeTypeOf("string");
    for (const [name, script] of entries) {
      expect(script, name).toMatch(/^vitest run\s/u);
      const tokens = script.trim().split(/\s+/u).slice(2);
      const filters = tokens.filter((token) => !token.startsWith("-"));
      const exclusions = tokens.filter((token) => token.startsWith("--exclude=")).map((token) => token.slice("--exclude=".length));
      expect(filters.length, `${name} must declare a target`).toBeGreaterThan(0);
      for (const filter of filters) {
        expect([".", "./", "*", "**", "**/*.test.mjs", repoRoot], `${name} must not select the whole repository`).not.toContain(filter);
        const matched = files.filter((file) => matchesFilter(file, filter));
        expect(existsSync(resolve(repoRoot, filter)) || matched.length > 0, `${name}: missing target ${filter}`).toBe(true);
        const collectible = matched.filter((file) => configuredSuite(file)
          && !exclusions.some((glob) => globRegex(glob).test(file)));
        expect(collectible.length, `${name}: target ${filter} collects no Vitest suite`).toBeGreaterThan(0);
      }
    }
  });

  it("removes exclusions for deleted files while keeping live Node-runner exclusions explicit", () => {
    for (const excluded of config.exclude.filter((glob) => !/[*?]/u.test(glob))) {
      expect(existsSync(resolve(repoRoot, excluded)), `stale exclusion ${excluded}`).toBe(true);
    }
  });
});
