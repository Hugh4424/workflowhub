import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
const ci = readFileSync(resolve(repoRoot, ".github/workflows/ci.yml"), "utf8");

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

const groupPrefixes = {
  contract: ["tests/contract/"],
  integration: ["tests/integration/"],
  e2e: ["tests/e2e/"],
  review: ["tests/review/"],
  close: ["tests/close/"],
  "left-shift": ["tests/left-shift/"],
  acceptance: ["tests/acceptance/"],
  skills: ["skills/"],
  core: ["core/"],
  root: ["tests/", "scripts/", "specs/", "workflows/build-code/__tests__/"],
};

const trackedAndUntrackedFiles = () => execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { cwd: repoRoot, encoding: "utf8" },
).trim().split("\n").filter(Boolean);

const allTestFiles = trackedAndUntrackedFiles()
  .filter((file) => file.endsWith(".test.mjs"))
  .filter((file) => ["core/", "scripts/", "skills/", "specs/", "tests/", "workflows/build-code/__tests__/"].some((prefix) => file.startsWith(prefix)));

const classify = (file) => {
  for (const name of groupNames) {
    if (groupPrefixes[name].some((prefix) => file.startsWith(prefix))) {
      if (name === "root" && file.startsWith("tests/") && !/^tests\/[^/]+\.test\.mjs$/.test(file)) return null;
      return name;
    }
  }
  return null;
};

const safeFilesByGroup = Object.fromEntries(groupNames.map((name) => [
  name,
  allTestFiles.filter((file) => !exclusiveFiles.has(file) && classify(file) === name),
]));

describe("explicit test entry grouping", () => {
  it("keeps the safe entry explicit, preserves exclusive semantics, and covers the original test universe", () => {
    expect(packageJson.scripts.test).toContain("npm run test:safe");
    expect(packageJson.scripts.test).toContain("npm run test:exclusive");
    expect(packageJson.scripts["test:safe"]).toContain("npm run test:contract");
    for (const name of groupNames) {
      const script = packageJson.scripts[`test:${name}`];
      expect(script, `missing test:${name}`).toBeTypeOf("string");
      if (name === "acceptance") expect(script).toMatch(/node tests\/acceptance\/build-prd-current\.mjs/);
      else expect(script).toContain("vitest run");
      expect(ci).toContain(`npm run test:${name}`);
    }
    expect(packageJson.scripts["test:core"]).toContain("--exclude=core/__tests__/check-extensibility.test.mjs");
    expect(packageJson.scripts["test:core"]).toContain("--exclude=core/__tests__/check-anti-host.test.mjs");
    expect(packageJson.scripts["test:exclusive"]).toContain([...exclusiveFiles][0]);
    expect(packageJson.scripts["test:exclusive"]).toContain([...exclusiveFiles][1]);
    expect(packageJson.scripts["test:exclusive"]).toContain("--poolOptions.forks.singleFork --no-fileParallelism");
    expect(ci).not.toMatch(/- run: npm test\s*$/m);

    const safeUnion = new Set(groupNames.flatMap((name) => safeFilesByGroup[name]));
    const expectedSafe = allTestFiles.filter((file) => !exclusiveFiles.has(file));
    expect([...safeUnion].sort()).toEqual(expectedSafe.sort());
    expect(allTestFiles.filter((file) => classify(file) === null)).toEqual([]);
    expect([...exclusiveFiles].every((file) => allTestFiles.includes(file))).toBe(true);
  });
});
