// ORACLE-VERSIONED-RELEASE: the installed version and one explicit source
// version decide update_available / up_to_date / unavailable. Invalid or
// unreadable inputs must never be reported as "no update". No network here.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { createTrackedTempDir } from "../../runtime/interface/temp-dir.mjs";
import { checkForUpdate, compareSemver, parseSemver, readPackageVersion } from "./update-check.mjs";

const source = fileURLToPath(new URL("../..", import.meta.url));
const dirs = [];
afterEach(() => { for (const dir of dirs.splice(0).reverse()) dir.dispose(); });

function tempPackage(files) {
  const lifetime = createTrackedTempDir("wh-c10-update-");
  dirs.push(lifetime);
  for (const [relative, bytes] of Object.entries(files)) {
    const target = join(lifetime.path, relative);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  }
  return lifetime.path;
}

describe("ORACLE-VERSIONED-RELEASE semantic versions", () => {
  it("orders release and prerelease versions without treating 1.0.0-rc.1 as 1.0.0", () => {
    expect(compareSemver("1.0.0", "1.0.0")).toBe(0);
    expect(compareSemver("1.0.1", "1.0.0")).toBe(1);
    expect(compareSemver("1.0.0", "1.0.1")).toBe(-1);
    expect(compareSemver("1.0.0", "1.0.0-rc.1")).toBe(1);
    expect(compareSemver("1.0.0-alpha", "1.0.0-beta")).toBe(-1);
    expect(compareSemver("1.0.0+build.7", "1.0.0")).toBe(0);
    expect(parseSemver("1.12.9")).toMatchObject({ major: 1, minor: 12, patch: 9, prerelease: [] });
    // SemVer 2.0.0: numeric prerelease identifiers must not carry leading zeros;
    // "0" alone is legal, and alphanumeric identifiers stay legal. In
    // "1.0.0-alpha.01" the final "01" is a numeric identifier, so the version is
    // invalid even though "alpha" itself is alphanumeric.
    for (const invalid of ["1.0", "v1.0.0", "01.0.0", "", null, "1.0.0.0", "1.0.0-01", "1.0.0-00", "1.0.0-alpha.01"]) {
      expect(parseSemver(invalid), String(invalid)).toBeNull();
    }
    for (const valid of ["1.0.0-0", "1.0.0-alpha", "1.0.0-alpha1", "1.0.0-beta-1", "1.0.0-0.1"]) {
      expect(parseSemver(valid), String(valid)).not.toBeNull();
    }
    expect(compareSemver("1.0.0-0", "1.0.0-alpha")).toBe(-1);
  });
});

describe("ORACLE-VERSIONED-RELEASE update three states", () => {
  it("reports an update with the exact installed/source versions and source label", () => {
    const result = checkForUpdate({ installedVersion: "1.0.0", sourceVersion: "1.1.0", source: "--source-version" });
    expect(result).toMatchObject({
      status: "update_available", installed_version: "1.0.0", source_version: "1.1.0", source: "--source-version",
    });
    expect(result.reason).toMatch(/1\.1\.0/);
    expect(result.reason).toMatch(/newer/);
  });

  it("reports no update when the installed version equals or is ahead of the source", () => {
    const equal = checkForUpdate({ installedVersion: "1.0.0", sourceVersion: "1.0.0", source: "package.json@source" });
    expect(equal).toMatchObject({ status: "up_to_date", installed_version: "1.0.0", source_version: "1.0.0" });
    expect(equal.reason).toMatch(/equals|at or ahead/);
    const ahead = checkForUpdate({ installedVersion: "1.2.0", sourceVersion: "1.1.9", source: "package.json@source" });
    expect(ahead).toMatchObject({ status: "up_to_date", installed_version: "1.2.0", source_version: "1.1.9" });
    expect(ahead.reason).toMatch(/ahead/);
  });

  it("treats a leading-zero numeric prerelease as invalid instead of up_to_date", () => {
    const installedInvalid = checkForUpdate({ installedVersion: "1.0.0-01", sourceVersion: "1.0.0" });
    expect(installedInvalid).toMatchObject({ status: "unavailable", code: "VERSION_INVALID", installed_version: "1.0.0-01" });
    const sourceInvalid = checkForUpdate({ installedVersion: "1.0.0", sourceVersion: "1.0.0-00" });
    expect(sourceInvalid).toMatchObject({ status: "unavailable", code: "VERSION_INVALID", source_version: "1.0.0-00" });
    const bothInvalid = checkForUpdate({ installedVersion: "1.0.0-00", sourceVersion: "1.0.0-00" });
    expect(bothInvalid.status).toBe("unavailable");
    const zero = checkForUpdate({ installedVersion: "1.0.0-0", sourceVersion: "1.0.0-0" });
    expect(zero).toMatchObject({ status: "up_to_date", installed_version: "1.0.0-0" });
    const ahead = checkForUpdate({ installedVersion: "1.0.0-0", sourceVersion: "1.0.0-alpha" });
    expect(ahead).toMatchObject({ status: "update_available", source_version: "1.0.0-alpha" });
  });

  it("reports unavailable for a missing, invalid or unreadable version instead of no update", () => {
    const missing = checkForUpdate({ installedVersion: "1.0.0" });
    expect(missing).toMatchObject({ status: "unavailable", installed_version: "1.0.0", source_version: null });
    expect(missing.reason).toMatch(/source version/);

    const invalidSource = checkForUpdate({ installedVersion: "1.0.0", sourceVersion: "latest" });
    expect(invalidSource).toMatchObject({ status: "unavailable", source_version: "latest" });
    expect(invalidSource.reason).toMatch(/invalid source version/);

    const invalidInstalled = checkForUpdate({ installedVersion: "1.0", sourceVersion: "1.0.0" });
    expect(invalidInstalled).toMatchObject({ status: "unavailable", installed_version: "1.0" });
    expect(invalidInstalled.reason).toMatch(/invalid installed version/);

    expect(() => readPackageVersion(join(tempPackage({}), "missing"))).toThrow();
    const unreadable = checkForUpdate({ installedVersion: "1.0.0", sourceVersion: null, source: "missing source" });
    expect(unreadable.status).toBe("unavailable");
  });
});

describe("ORACLE-VERSIONED-RELEASE package sources", () => {
  it("reads the repository package and lock version from the same source", () => {
    const pkg = JSON.parse(readFileSync(join(source, "package.json"), "utf8"));
    const lock = JSON.parse(readFileSync(join(source, "package-lock.json"), "utf8"));
    expect(pkg.version).toBe("1.0.0");
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages[""].version).toBe(pkg.version);
    expect(checkForUpdate({ installedVersion: pkg.version, sourceVersion: lock.packages[""].version, source: "package-lock.json" }).status).toBe("up_to_date");
  });

  it("reads a package directory and an explicit package.json path, and fails on bad JSON", () => {
    const root = tempPackage({ "package.json": JSON.stringify({ name: "fixture", version: "2.3.4" }) });
    expect(readPackageVersion(root)).toMatchObject({ version: "2.3.4" });
    expect(readPackageVersion(join(root, "package.json"))).toMatchObject({ version: "2.3.4" });
    const broken = tempPackage({ "package.json": "{not json" });
    expect(() => readPackageVersion(broken)).toThrow();
    const absentVersion = tempPackage({ "package.json": JSON.stringify({ name: "fixture" }) });
    expect(() => readPackageVersion(absentVersion)).toThrow();
  });
});
