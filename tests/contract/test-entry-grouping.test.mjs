import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
// The real configuration is imported, not restated: "covered" below has to account
// for the files Vitest is configured never to collect.
const vitestConfig = (await import(pathToFileURL(resolve(repoRoot, "vitest.config.mjs")).href)).default;

const groupNames = [
  "contract",
  "integration",
  "e2e",
  "review",
  "close",
  "left-shift",
  "acceptance",
  "skills",
  "core",
  "root",
];

const exclusiveFiles = new Set([
  "core/__tests__/check-extensibility.test.mjs",
  "core/__tests__/check-anti-host.test.mjs",
]);

// Explicit waivers. A waived file is named here on purpose and is never counted as
// covered by a group, so a suite that drops out of the grouping cannot be reported
// as tested by the union assertion below.
const exemptFiles = new Map([
  [
    "tests/acceptance/workflow-execution-current-task.test.mjs",
    "Node acceptance aggregator of a retired task, not a Vitest suite: test:acceptance only runs `node tests/acceptance/build-prd-current.mjs`, and vitest.config.mjs excludes this file from collection, so no group executes it. Waived explicitly rather than reported as acceptance-group coverage.",
  ],
]);

// *.test.mjs files whose path a group's Vitest scope matches but which Vitest is
// configured never to collect: they run under the Node test runner through their own
// evidence commands. Listed explicitly so "in scope" is not misread as "collected".
const nodeRunnerFiles = new Set([
  "tests/contract/ui-skill-contract.test.mjs",
  "tests/contract/ui-stage-integration.test.mjs",
  "tests/contract/ui-frontend-governance.test.mjs",
  "tests/contract/frontend-component-quality-static.test.mjs",
]);

const trackedAndUntrackedFiles = () => execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { cwd: repoRoot, encoding: "utf8" },
).trim().split("\n").filter(Boolean);

const allTestFiles = trackedAndUntrackedFiles()
  .filter((file) => file.endsWith(".test.mjs"))
  .filter((file) => ["core/", "scripts/", "skills/", "specs/", "tests/", "workflows/build-code/__tests__/"].some((prefix) => file.startsWith(prefix)));

const globToRegExp = (glob) => new RegExp(`^${glob.split("/").map((segment) => (segment === "**"
  ? ".*"
  : segment.replace(/[.+^${}()|[\]\\]/gu, "\\$&").replace(/\*/gu, "[^/]*"))).join("/")}$`, "u");

// Positions of `vitest run` come from the real npm script, so a group whose scope
// changed (or that stopped running Vitest at all) changes this result.
const vitestScopeTokens = (name) => {
  const tokens = packageJson.scripts[`test:${name}`].trim().split(/\s+/);
  const runIndex = tokens.indexOf("run");
  if (runIndex === -1) return null;
  return tokens.slice(runIndex + 1).filter((token) => !token.startsWith("-"));
};

// Vitest collects a file when one of its positional filters matches the path: a
// directory filter is a substring match, a shell-expanded glob is segment-wise.
const isInScope = (file, tokens) => tokens.some(
  (token) => file.includes(token) || globToRegExp(token).test(file),
);

const isVitestExcluded = (file) => vitestConfig.test.exclude.some(
  (pattern) => globToRegExp(pattern).test(file),
);

const collectedFilesByGroup = Object.fromEntries(groupNames.map((name) => {
  const tokens = vitestScopeTokens(name);
  const collected = tokens === null ? [] : allTestFiles.filter(
    (file) => isInScope(file, tokens) && !isVitestExcluded(file),
  );
  return [name, collected.filter((file) => !exclusiveFiles.has(file))];
}));

// Files no group's Vitest command collects, for either reason: the path is outside
// every declared scope, or Vitest is configured not to collect it.
const uncollectedFiles = allTestFiles.filter((file) => !exclusiveFiles.has(file)
  && !groupNames.some((name) => collectedFilesByGroup[name].includes(file)));

describe("explicit test entry grouping", () => {
  it("keeps the safe entry explicit, preserves exclusive semantics, and covers the original test universe", () => {
    expect(existsSync(resolve(repoRoot, ".github/workflows/ci.yml"))).toBe(false);
    expect(packageJson.scripts.test).toContain("npm run test:safe");
    expect(packageJson.scripts.test).toContain("npm run test:exclusive");
    expect(packageJson.scripts["test:safe"]).toContain("npm run test:contract");
    for (const name of groupNames) {
      const script = packageJson.scripts[`test:${name}`];
      expect(script, `missing test:${name}`).toBeTypeOf("string");
      if (name === "acceptance") expect(script).toMatch(/node tests\/acceptance\/build-prd-current\.mjs/);
      else expect(script).toContain("vitest run");
    }
    expect(packageJson.scripts["test:core"]).toContain("--exclude=core/__tests__/check-extensibility.test.mjs");
    expect(packageJson.scripts["test:core"]).toContain("--exclude=core/__tests__/check-anti-host.test.mjs");
    expect(packageJson.scripts["test:exclusive"]).toContain([...exclusiveFiles][0]);
    expect(packageJson.scripts["test:exclusive"]).toContain([...exclusiveFiles][1]);
    expect(packageJson.scripts["test:exclusive"]).toContain("--poolOptions.forks.singleFork --no-fileParallelism");
    // The acceptance group runs a Node script: it collects no Vitest suite, so it
    // cannot be the group that covers any *.test.mjs file.
    expect(vitestScopeTokens("acceptance")).toBeNull();

    const safeUnion = new Set(groupNames.flatMap((name) => collectedFilesByGroup[name]));
    const expectedSafe = allTestFiles.filter((file) => !exclusiveFiles.has(file)
      && !exemptFiles.has(file)
      && !nodeRunnerFiles.has(file));
    expect([...safeUnion].sort()).toEqual(expectedSafe.sort());
    expect([...exclusiveFiles].every((file) => allTestFiles.includes(file))).toBe(true);
    expect([...nodeRunnerFiles].every((file) => allTestFiles.includes(file)
      && vitestConfig.test.exclude.includes(file))).toBe(true);
    // Nothing else may fall outside every group: the files no group executes are
    // exactly the declared waivers plus the Node-runner precedent above.
    expect(uncollectedFiles.sort()).toEqual([...nodeRunnerFiles, ...exemptFiles.keys()].sort());
  });

  it("waives the retired acceptance aggregator explicitly instead of counting it as covered", () => {
    for (const [file, reason] of exemptFiles) {
      expect(reason.trim().length, `${file} needs a written waiver reason`).toBeGreaterThan(0);
      expect(existsSync(resolve(repoRoot, file)), `${file} is gone: remove the waiver`).toBe(true);
      expect(allTestFiles).toContain(file);
      expect(vitestConfig.test.exclude).toContain(file);
      expect(uncollectedFiles).toContain(file);
      expect(groupNames.filter((name) => collectedFilesByGroup[name].includes(file))).toEqual([]);
    }
  });
});
