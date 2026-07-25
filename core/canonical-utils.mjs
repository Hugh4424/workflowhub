import { createHash } from "node:crypto";

export function sha256(raw) { return createHash("sha256").update(raw).digest("hex"); }
export function canonical(value) { return `${JSON.stringify(value, null, 2)}\n`; }

export function isRuntimeOnlyPath(path) {
  return typeof path === "string" && (path === "node_modules" || path.startsWith("node_modules/"));
}

export function normalizeRuntimeOnlyPaths(paths) {
  if (!Array.isArray(paths)) throw new TypeError("paths must be an array");
  return [...new Set(paths.filter((path) => !isRuntimeOnlyPath(path)))].sort();
}

function normalizeForComparison(value) {
  if (Array.isArray(value)) return value.map(normalizeForComparison);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalizeForComparison(value[key])]));
}

export function deepEqual(left, right) {
  return JSON.stringify(normalizeForComparison(left)) === JSON.stringify(normalizeForComparison(right));
}
