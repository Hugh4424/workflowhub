// C10 P4 release update check. Node built-in only: this module compares an
// installed package version with one explicitly supplied source version. It is
// not a version service, never contacts the network and never owns config.
import { readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

function versionError(message) {
  return Object.assign(new Error(message), { code: "VERSION_INVALID" });
}

/** Parse a strict semantic version; build metadata is retained but ignored for precedence. */
export function parseSemver(value) {
  if (typeof value !== "string") return null;
  const match = SEMVER.exec(value);
  if (!match) return null;
  return Object.freeze({
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? Object.freeze(match[4].split(".")) : Object.freeze([]),
    build: match[5] ?? null,
  });
}

function comparePrerelease(left, right) {
  if (left.length === 0 && right.length === 0) return 0;
  if (left.length === 0) return 1;
  if (right.length === 0) return -1;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const a = left[index];
    const b = right[index];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    const numericA = /^\d+$/.test(a);
    const numericB = /^\d+$/.test(b);
    if (numericA && numericB) {
      const difference = Number(a) - Number(b);
      if (difference !== 0) return difference < 0 ? -1 : 1;
    } else if (numericA !== numericB) {
      return numericA ? -1 : 1;
    } else if (a !== b) {
      return a < b ? -1 : 1;
    }
  }
  return 0;
}

/** Compare two strict semantic versions; returns -1, 0 or 1. */
export function compareSemver(left, right) {
  const a = parseSemver(left);
  const b = parseSemver(right);
  if (!a || !b) throw versionError(`invalid semantic version: ${!a ? left : right}`);
  for (const key of ["major", "minor", "patch"]) {
    if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1;
  }
  return comparePrerelease(a.prerelease, b.prerelease);
}

/**
 * Read the version fact from an explicit package directory or package.json path.
 * A missing/unreadable file, bad JSON or an absent version is an error: callers
 * report "cannot check", never "no update".
 */
export function readPackageVersion(target) {
  if (typeof target !== "string" || target.trim() === "" || !isAbsolute(target)) {
    throw versionError(`package source must be an explicit absolute path: ${String(target)}`);
  }
  const file = target.endsWith(".json") ? resolve(target) : join(resolve(target), "package.json");
  let bytes;
  try {
    bytes = readFileSync(file, "utf8");
  } catch (error) {
    throw Object.assign(new Error(`package version source is unreadable: ${file} (${error.code ?? error.message})`), { code: error.code ?? "VERSION_SOURCE_UNREADABLE", path: file });
  }
  let value;
  try {
    value = JSON.parse(bytes);
  } catch (error) {
    throw Object.assign(new Error(`package version source is not valid JSON: ${file}`), { code: "VERSION_SOURCE_INVALID", path: file, cause: error });
  }
  if (!value || typeof value.version !== "string" || value.version.trim() === "") {
    throw Object.assign(new Error(`package version is missing: ${file}`), { code: "VERSION_MISSING", path: file });
  }
  return Object.freeze({ version: value.version.trim(), path: file });
}

function unavailable({ installedVersion, sourceVersion, source, reason }) {
  return Object.freeze({
    status: "unavailable",
    installed_version: typeof installedVersion === "string" ? installedVersion : null,
    source_version: typeof sourceVersion === "string" ? sourceVersion : null,
    source: source ?? null,
    reason,
  });
}

/**
 * Compare one installed version with one explicit source version. Three states
 * only: update_available, up_to_date, unavailable — each with a reason/source.
 */
export function checkForUpdate({ installedVersion, sourceVersion, source = null } = {}) {
  if (installedVersion === undefined || installedVersion === null || installedVersion === "") {
    return unavailable({ installedVersion, sourceVersion, source, reason: "no installed version was provided; the installation is not readable" });
  }
  if (!parseSemver(installedVersion)) {
    return unavailable({ installedVersion, sourceVersion, source, reason: `invalid installed version: ${String(installedVersion)}` });
  }
  if (sourceVersion === undefined || sourceVersion === null || sourceVersion === "") {
    return unavailable({ installedVersion, sourceVersion, source, reason: "no explicit source version was provided; pass --source-version or --source-package" });
  }
  if (!parseSemver(sourceVersion)) {
    return unavailable({ installedVersion, sourceVersion, source, reason: `invalid source version: ${String(sourceVersion)}` });
  }
  const comparison = compareSemver(sourceVersion, installedVersion);
  if (comparison > 0) {
    return Object.freeze({
      status: "update_available",
      installed_version: installedVersion,
      source_version: sourceVersion,
      source: source ?? null,
      reason: `source version ${sourceVersion} is newer than installed ${installedVersion}`,
    });
  }
  if (comparison === 0) {
    return Object.freeze({
      status: "up_to_date",
      installed_version: installedVersion,
      source_version: sourceVersion,
      source: source ?? null,
      reason: `installed ${installedVersion} equals source ${sourceVersion}`,
    });
  }
  return Object.freeze({
    status: "up_to_date",
    installed_version: installedVersion,
    source_version: sourceVersion,
    source: source ?? null,
    reason: `installed ${installedVersion} is ahead of source ${sourceVersion}`,
  });
}
