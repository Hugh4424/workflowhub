import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listDeliveryFiles } from "./inventory.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUTPUT = resolve(ROOT, "docs/architecture/complexity-baseline.json");
const SOURCE_EXTENSIONS = new Set([".mjs", ".js", ".cjs", ".ts", ".tsx"]);

function lineCount(path) {
  const text = readFileSync(resolve(ROOT, path), "utf8");
  return text.length === 0 ? 0 : text.split(/\r?\n/).length;
}

function sourceFiles() {
  return listDeliveryFiles().filter((path) => SOURCE_EXTENSIONS.has(extname(path)));
}

function isFormalTest(path) {
  return path.includes("/__tests__/")
    || /\.test\.[cm]?[jt]sx?$/.test(path);
}

function isTestSupport(path) {
  return !isFormalTest(path) && (
    path.startsWith("tests/")
    || path.startsWith("fixtures/")
    || path.includes("/fixtures/")
    || path.includes("/helpers/")
  );
}

function budget(actual, target, limit) {
  return { actual, target, limit, delta_from_target: actual - target, within_limit: actual <= limit };
}

function grepCount(pattern, files) {
  let total = 0;
  for (const path of files) {
    const text = readFileSync(resolve(ROOT, path), "utf8");
    total += (text.match(pattern) ?? []).length;
  }
  return total;
}

function publicRunnerCommandCount(runtimeText) {
  const allowlist = runtimeText.match(/if \(!new Set\(\[(.*?)\]\)\.has\(command\)\)/s)?.[1] ?? "";
  return new Set([...allowlist.matchAll(/"([^"]+)"/g)].map((match) => match[1])).size;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(resolve(ROOT, path))).digest("hex");
}

function isGitIgnored(path) {
  try {
    execFileSync("git", ["check-ignore", "-q", path], { cwd: ROOT });
    return true;
  } catch {
    return false;
  }
}

function compatibleVersion(actual, { major, minimumMinor, minimumPatch }) {
  const match = String(actual).replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return false;
  const [, actualMajor, actualMinor, actualPatch] = match.map(Number);
  return actualMajor === major
    && (actualMinor > minimumMinor
      || (actualMinor === minimumMinor && actualPatch >= minimumPatch));
}

function splitTopLevel(pattern) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let inClass = false;
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "\\") {
      index += 1;
      continue;
    }
    if (char === "[") inClass = true;
    else if (char === "]") inClass = false;
    else if (!inClass && char === "(") depth += 1;
    else if (!inClass && char === ")") depth -= 1;
    else if (!inClass && char === "|" && depth === 0) {
      parts.push(pattern.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(pattern.slice(start));
  return parts;
}

function closingGroup(pattern) {
  let depth = 0;
  let inClass = false;
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "\\") {
      index += 1;
      continue;
    }
    if (char === "[") inClass = true;
    else if (char === "]") inClass = false;
    else if (!inClass && char === "(") depth += 1;
    else if (!inClass && char === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function firstPathSegments(pattern) {
  const value = pattern.replace(/^\^/, "").replace(/\$$/, "");
  if (value.startsWith("(?:")) {
    const close = closingGroup(value);
    if (close < 0) throw new Error("canonical record-path regex has an unclosed group");
    const inner = value.slice(3, close);
    const suffix = value.slice(close + 1);
    if (suffix.startsWith("\\/")) {
      return splitTopLevel(inner).flatMap((item) => firstPathSegments(`${item}\\/`));
    }
    return splitTopLevel(inner).flatMap(firstPathSegments);
  }
  const alternatives = splitTopLevel(value);
  if (alternatives.length > 1) return alternatives.flatMap(firstPathSegments);
  const literal = value.match(/^([a-z][a-z0-9-]*)\\\//)?.[1];
  return literal ? [literal] : [];
}

export function persistentObjectFamilies() {
  const sourcePath = "core/task-handle.mjs";
  const text = readFileSync(resolve(ROOT, sourcePath), "utf8");
  const source = text.match(/if \(!\/(\^\(\?:.*?\)\$)\/\.test\(relativePath\).*kernel record path required/s)?.[1];
  if (!source) throw new Error("canonical kernel record-path contract not found");
  const rootRecordNames = [
    ...text.matchAll(/(?:resolve|resolveRecord)\(\s*realTaskPath,\s*"([^"/]+)\.(?:json|jsonl)"/g),
  ].map((match) => match[1]);
  const names = [...new Set([...firstPathSegments(source), ...rootRecordNames])].sort();
  if (names.length === 0) throw new Error("canonical record-path contract yielded no persistent families");
  return { source: sourcePath, source_sha256: sha256(sourcePath), names };
}

function bundleContentAudit() {
  const manifestPaths = listDeliveryFiles().filter((path) => path.endsWith("/skill-bundle.json"));
  const violations = [];
  const forbiddenSegment = /(^|\/)(?:node_modules|tests?|__tests__|history|evidence|results|receipts|reviews|tasks|specs)(?:\/|$)/;
  for (const manifestPath of manifestPaths) {
    const manifest = JSON.parse(readFileSync(resolve(ROOT, manifestPath), "utf8"));
    for (const item of manifest.files ?? []) {
      const path = typeof item === "string" ? item : item.path;
      if (typeof path !== "string") {
        violations.push({ manifest: manifestPath, path: null, reason: "non-string bundle path" });
      } else if (path.startsWith("/") || /^[A-Za-z]:[\\/]/.test(path)) {
        violations.push({ manifest: manifestPath, path, reason: "absolute path" });
      } else if (forbiddenSegment.test(path.replaceAll("\\", "/"))) {
        violations.push({ manifest: manifestPath, path, reason: "forbidden delivery content" });
      }
    }
  }
  return { manifests: manifestPaths.length, violations };
}

export function buildReport() {
  const files = sourceFiles();
  const testFiles = files.filter(isFormalTest);
  const supportFiles = files.filter(isTestSupport);
  const productionFiles = files.filter((path) => !isFormalTest(path) && !isTestSupport(path));
  const testLines = testFiles.reduce((sum, path) => sum + lineCount(path), 0);
  const supportLines = supportFiles.reduce((sum, path) => sum + lineCount(path), 0);
  const productionLines = productionFiles.reduce((sum, path) => sum + lineCount(path), 0);
  const coreFiles = productionFiles.filter((path) => path.startsWith("core/"));
  const hotspots = files
    .map((path) => ({ path, lines: lineCount(path) }))
    .sort((a, b) => b.lines - a.lines || a.path.localeCompare(b.path))
    .slice(0, 5);
  const deliveryFiles = listDeliveryFiles();
  const schemas = deliveryFiles.filter((path) => path.endsWith(".schema.json") || path.includes("/schemas/")).length;
  const runtimeText = readFileSync(resolve(ROOT, "scripts/stage-runtime.mjs"), "utf8");
  const families = persistentObjectFamilies();
  const bundleAudit = bundleContentAudit();
  const nodeActual = process.version;
  const npmActual = execFileSync("npm", ["--version"], { cwd: ROOT }).toString("utf8").trim();

  return {
    schema_version: "workflowhub-complexity-report.v1",
    source: {
      git_head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT }).toString("utf8").trim(),
      tracked_files: execFileSync("git", ["ls-files", "-z"], { cwd: ROOT })
        .toString("utf8").split("\0").filter(Boolean).length,
      delivery_files: deliveryFiles.length,
      source_files: files.length,
    },
    measurements: {
      formal_test_files: { actual: testFiles.length, definition: "*.test.* and */__tests__/*" },
      test_support_lines: {
        actual: supportLines,
        files: supportFiles.length,
        definition: "non-test files under tests, fixtures, or helpers",
      },
      persistent_object_families: families,
      bundle_content_audit: bundleAudit,
    },
    runtime_boundary: {
      node: {
        actual: nodeActual,
        requirement: ">=24.14.0 <25",
        compatible: compatibleVersion(nodeActual, { major: 24, minimumMinor: 14, minimumPatch: 0 }),
        source: "process.version",
      },
      npm: {
        actual: npmActual,
        requirement: ">=11.9.0 <12",
        compatible: compatibleVersion(npmActual, { major: 11, minimumMinor: 9, minimumPatch: 0 }),
        source: "npm --version",
      },
    },
    distribution_boundary: {
      node_modules_tracked_files: execFileSync("git", ["ls-files", "node_modules"], { cwd: ROOT })
        .toString("utf8")
        .trim()
        .split("\n")
        .filter(Boolean)
        .length,
      node_modules_gitignored: isGitIgnored("node_modules"),
      package_lock_sha256: sha256("package-lock.json"),
      clean_install_source: "package.json + package-lock.json",
    },
    budgets: {
      formal_test_lines: budget(testLines, 10_000, 12_000),
      production_lines: budget(productionLines, 12_000, 15_000),
      public_runner_behaviors: budget(publicRunnerCommandCount(runtimeText), 7, 8),
      schemas: budget(schemas, 8, 10),
      persistent_object_families: budget(families.names.length, 4, 5),
      largest_core_file_lines: budget(
        Math.max(0, ...coreFiles.map((path) => lineCount(path))),
        800,
        1_000,
      ),
      focused_test_seconds: { actual: null, target: 10, limit: 15, delta_from_target: null, within_limit: null },
      full_test_seconds: { actual: null, target: 90, limit: 120, delta_from_target: null, within_limit: null },
    },
    hard_gates: {
      dedicated_recovery_state: {
        actual: grepCount(/\b(reopen|rebind|continuation|recovery)\b/gi, productionFiles),
        required_final: 0,
        phase_0_status: "observed_for_planned_removal",
      },
      dual_write_markers: {
        actual: grepCount(/\b(dual.?write|legacy.?writer|writeBoth)\b/gi, productionFiles),
        required_final: 0,
        phase_0_status: "observed_for_planned_removal",
      },
      bundle_forbidden_content: {
        actual: bundleAudit.violations.length,
        required_final: 0,
        phase_0_status: bundleAudit.violations.length === 0 ? "observed_zero" : "observed_for_planned_removal",
      },
    },
    hotspots,
    follow_up: [
      "replace legacy recovery and progression mechanisms only after deletion proofs pass",
      "measure focused and full test duration in the final clean-install environment",
      "do not delete quality assertions to meet line-count targets",
    ],
  };
}

export function validateReport(report) {
  const errors = [];
  if (report.schema_version !== "workflowhub-complexity-report.v1") errors.push("invalid schema_version");
  for (const [name, value] of Object.entries(report.budgets ?? {})) {
    for (const field of ["actual", "target", "limit", "delta_from_target", "within_limit"]) {
      if (!(field in value)) errors.push(`budget ${name} missing ${field}`);
    }
  }
  if (!Array.isArray(report.hotspots) || report.hotspots.length !== 5) errors.push("exactly five hotspots required");
  if (!Array.isArray(report.follow_up) || report.follow_up.length === 0) errors.push("follow_up is required");
  for (const runtime of ["node", "npm"]) {
    const value = report.runtime_boundary?.[runtime];
    if (!value || typeof value.actual !== "string" || typeof value.requirement !== "string"
        || value.compatible !== true || typeof value.source !== "string") {
      errors.push(`${runtime} runtime does not satisfy the frozen version contract`);
    }
  }
  if (!Number.isInteger(report.measurements?.formal_test_files?.actual)) {
    errors.push("formal test file count is required");
  }
  if (!Number.isInteger(report.measurements?.test_support_lines?.actual)) {
    errors.push("test support line count is required");
  }
  const families = report.measurements?.persistent_object_families;
  if (!Array.isArray(families?.names) || families.names.length === 0
      || !/^[a-f0-9]{64}$/.test(families.source_sha256 ?? "")
      || report.budgets?.persistent_object_families?.actual !== families.names.length) {
    errors.push("persistent object families must derive from the canonical storage contract");
  }
  const bundleAudit = report.measurements?.bundle_content_audit;
  if (!Number.isInteger(bundleAudit?.manifests) || !Array.isArray(bundleAudit?.violations)
      || report.hard_gates?.bundle_forbidden_content?.actual !== bundleAudit.violations.length) {
    errors.push("bundle forbidden-content count must derive from bundle manifests");
  }
  if (report.distribution_boundary?.node_modules_tracked_files !== 0) {
    errors.push("node_modules must not contain tracked files");
  }
  if (report.distribution_boundary?.node_modules_gitignored !== true) {
    errors.push("node_modules must be ignored");
  }
  if (!/^[a-f0-9]{64}$/.test(report.distribution_boundary?.package_lock_sha256 ?? "")) {
    errors.push("package-lock sha256 is required");
  }
  for (const name of ["dedicated_recovery_state", "dual_write_markers", "bundle_forbidden_content"]) {
    const gate = report.hard_gates?.[name];
    if (!gate || !Number.isInteger(gate.actual) || gate.required_final !== 0 || !gate.phase_0_status) {
      errors.push(`hard gate ${name} is incomplete`);
    }
  }
  return errors;
}

function main() {
  const check = process.argv.includes("--check-hard-gates");
  const expected = buildReport();
  if (check) {
    const actual = JSON.parse(readFileSync(OUTPUT, "utf8"));
    const errors = validateReport(actual);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push("complexity report is stale");
    if (errors.length) {
      for (const error of errors) console.error(error);
      process.exitCode = 1;
      return;
    }
    console.log("complexity report is reproducible; final hard-zero gates remain explicit");
    return;
  }
  writeFileSync(OUTPUT, `${JSON.stringify(expected, null, 2)}\n`, "utf8");
  console.log(`wrote ${relative(ROOT, OUTPUT)} (${statSync(OUTPUT).size} bytes)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
