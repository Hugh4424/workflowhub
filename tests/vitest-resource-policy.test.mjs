import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const scripts = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts;
const config = (await import(pathToFileURL(join(root, "vitest.config.mjs")).href)).default.test;
// These two surviving tests still mutate this repository. This is their current
// safety obligation, not a fixed inventory of all test groups or exclusive files.
const knownRootWriters = [
  "core/__tests__/check-extensibility.test.mjs",
  "core/__tests__/check-anti-host.test.mjs",
].filter((file) => existsSync(join(root, file)));

function matchesFilter(file, filter) {
  if (!/[*?]/u.test(filter)) return file.includes(filter);
  let pattern = "";
  for (let index = 0; index < filter.length; index += 1) {
    const char = filter[index];
    if (char === "*" && filter[index + 1] === "*") {
      index += 1;
      if (filter[index + 1] === "/") { index += 1; pattern += "(?:.*/)?"; }
      else pattern += ".*";
    } else if (char === "*") pattern += "[^/]*";
    else if (char === "?") pattern += "[^/]";
    else pattern += char.replace(/[.+^${}()|[\]\\]/gu, "\\$&");
  }
  return new RegExp(`^${pattern}$`, "u").test(file);
}

describe("Vitest resource policy", () => {
  it("uses bounded forks and rejects empty test selections", () => {
    expect(config.pool).toBe("forks");
    expect(config.poolOptions.forks.minForks).toBeGreaterThanOrEqual(1);
    expect(config.poolOptions.forks.maxForks).toBeLessThanOrEqual(2);
    expect(config.poolOptions.forks.minForks).toBeLessThanOrEqual(config.poolOptions.forks.maxForks);
    expect(config.fileParallelism).toBe(true);
    expect(config.passWithNoTests).toBe(false);
    expect(config.poolOptions.forks.singleFork).not.toBe(true);
  });

  it("keeps surviving repository writers in a serial exclusive target", () => {
    const exclusive = scripts["test:exclusive"];
    expect(exclusive).toBeTypeOf("string");
    expect(exclusive).toContain("--poolOptions.forks.singleFork");
    expect(exclusive).toContain("--no-fileParallelism");
    for (const file of knownRootWriters) {
      expect(exclusive).toContain(file);
      for (const [name, script] of Object.entries(scripts).filter(([name]) => name.startsWith("test:") && name !== "test:exclusive")) {
        const filters = script.trim().split(/\s+/u).slice(2).filter((token) => !token.startsWith("-"));
        if (filters.some((filter) => matchesFilter(file, filter))) {
          expect(script, `${name} must exclude repository writer ${file}`).toContain(`--exclude=${file}`);
        }
      }
    }
  });

  it("has no full-suite aggregate or hidden checker retry", () => {
    expect(scripts).not.toHaveProperty("test");
    expect(scripts).not.toHaveProperty("test:safe");
    expect(scripts).not.toHaveProperty("check:skill-closure");
    for (const [name, script] of Object.entries(scripts).filter(([name]) => name.startsWith("test:"))) {
      expect(script, name).toMatch(/^vitest run\s/u);
      expect(script, name).not.toMatch(/(?:&&|\|\||;|npm\s+run)/u);
    }
    expect(readFileSync(join(root, "tools/cli/run-checks.mjs"), "utf8")).not.toContain("retryTransientCheckerFailure");
  });
});
