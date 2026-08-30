#!/usr/bin/env node
// 死代码扫描：默认全仓扫描导出的标识符/文件是否零消费者；--verify 时若报告非空且全为零消费者则通过。

import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, relative, sep, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_DIR = resolve(ROOT, "quality/evidence/dead-code-scan");
const REPORT_PATH = resolve(REPORT_DIR, "report.json");

const EXCLUDED_DIRS = ["node_modules", ".git", "quality", "specs/archive", "__tests__", "dist", "build"];
const INCLUDED_EXTS = new Set([".mjs", ".js", ".ts", ".cjs"]);

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    if (arg === "--verify") args.verify = true;
    else if (arg.startsWith("--targets=")) args.targets = arg.slice("--targets=".length);
  }
  return args;
}

function shouldExclude(rel) {
  const parts = rel.split("/");
  for (const ex of EXCLUDED_DIRS) {
    if (parts.includes(ex) || rel === ex || rel.startsWith(`${ex}/`)) return true;
  }
  return false;
}

function* walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const entry of entries) {
    const path = resolve(dir, entry.name);
    const rel = relative(ROOT, path);
    if (shouldExclude(rel)) continue;
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile() && INCLUDED_EXTS.has(extname(entry.name))) yield path;
  }
}

function isTestFile(path) {
  return relative(ROOT, path).includes("/__tests__/");
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractExports(content, filePath) {
  const names = new Set();

  // export function/class/const/let/var with optional async
  const declRe = /export\s+(?:async\s+)?(?:function\s*\*|function\s+|class\s+|const\s+|let\s+|var\s+)([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = declRe.exec(content)) !== null) names.add(m[1]);

  // export { a, b as c }
  const namedRe = /export\s*\{([^}]+)\}/g;
  while ((m = namedRe.exec(content)) !== null) {
    for (const part of m[1].split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const asMatch = trimmed.match(/^(\S+)\s+as\s+(\S+)$/);
      names.add(asMatch ? asMatch[2] : trimmed.split(/\s+/)[0]);
    }
  }

  // export default function name() {} or export default class Name {} or export default name;
  const defaultNamedRe = /export\s+default\s+(?:async\s+)?(?:function\s+|class\s+)?([A-Za-z_$][\w$]*)/g;
  while ((m = defaultNamedRe.exec(content)) !== null) names.add("default:" + m[1]);

  return [...names].map((name) => ({ name, full: `${relative(ROOT, filePath).replace(/\\/g, "/")}#${name}` }));
}

function findIdentifierConsumers(name, files) {
  const consumers = [];
  let searchName = name;
  if (searchName.startsWith("default:")) searchName = searchName.slice("default:".length);
  const re = new RegExp(`\\b${escapeRegExp(searchName)}\\b`, "g");
  for (const file of files) {
    if (isTestFile(file)) continue;
    let content;
    try { content = readFileSync(file, "utf8"); } catch { continue; }
    // skip self-reference in the declaring file
    if (content.includes(searchName) && re.test(content)) {
      consumers.push(relative(ROOT, file));
    }
  }
  return [...new Set(consumers)];
}

function extractImportPaths(content, fromFile) {
  const paths = [];
  const baseDir = dirname(fromFile);
  // import ... from "..."
  const staticRe = /import\s+(?:[^"']*?\s+from\s+|(?:[^"']*?)\s*)["']([^"']+)["']/g;
  let m;
  while ((m = staticRe.exec(content)) !== null) {
    paths.push(m[1]);
  }
  // dynamic import("...")
  const dynamicRe = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = dynamicRe.exec(content)) !== null) {
    paths.push(m[1]);
  }
  // bare import "..." (side-effect)
  const sideRe = /import\s+["']([^"']+)["']/g;
  while ((m = sideRe.exec(content)) !== null) {
    paths.push(m[1]);
  }
  // resolve relative paths to absolute
  return paths
    .filter((p) => p.startsWith("."))
    .map((p) => {
      const joined = resolve(baseDir, p);
      // if points to a directory, look for index file
      try {
        const st = statSync(joined);
        if (st.isDirectory()) {
          for (const ext of INCLUDED_EXTS) {
            const candidate = resolve(joined, `index${ext}`);
            if (existsSync(candidate)) return candidate;
          }
          return joined;
        }
      } catch { /* not a directory */ }
      // if lacks extension, try adding one
      if (!extname(joined)) {
        for (const ext of INCLUDED_EXTS) {
          const candidate = `${joined}${ext}`;
          if (existsSync(candidate)) return candidate;
        }
      }
      return joined;
    });
}

function findFileConsumers(targetPath, allFiles) {
  const consumers = [];
  for (const file of allFiles) {
    if (isTestFile(file)) continue;
    let content;
    try { content = readFileSync(file, "utf8"); } catch { continue; }
    const imported = extractImportPaths(content, file);
    if (imported.some((abs) => normalize(abs) === normalize(targetPath))) {
      consumers.push(relative(ROOT, file));
    }
  }
  return [...new Set(consumers)];
}

function loadTargets(targetsArg) {
  if (!targetsArg) return null;
  try {
    const parsed = JSON.parse(readFileSync(resolve(ROOT, targetsArg), "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function main() {
  const args = parseArgs(process.argv);
  const allFiles = [...walk(ROOT)];
  const targets = loadTargets(args.targets);

  const entries = [];

  if (Array.isArray(targets)) {
    // Explicit target mode (e.g., T13 supplied list)
    for (const target of targets) {
      if (!target || typeof target !== "object" || !target.type || !target.name) continue;
      const consumers = target.type === "file"
        ? findFileConsumers(resolve(ROOT, target.name), allFiles)
        : findIdentifierConsumers(target.name, allFiles);
      entries.push({
        target: target.name,
        type: target.type,
        consumer_count: consumers.length,
        consumers: consumers.slice(0, 20),
        zero_consumer: consumers.length === 0,
        evidence: consumers.length === 0 ? "no references found" : `referenced by ${consumers.length} file(s)`,
      });
    }
  } else {
    // Default scan mode: scan every source file for exports
    for (const file of allFiles) {
      if (isTestFile(file)) continue;
      let content;
      try { content = readFileSync(file, "utf8"); } catch { continue; }
      const rel = relative(ROOT, file).replace(/\\/g, "/");
      const exports = extractExports(content, file);

      // Check file-level consumers
      const fileConsumers = findFileConsumers(file, allFiles);
      if (fileConsumers.length === 0) {
        entries.push({
          target: rel,
          type: "file",
          consumer_count: 0,
          consumers: [],
          zero_consumer: true,
          evidence: "no import references found",
        });
      }

      for (const exp of exports) {
        const consumers = findIdentifierConsumers(exp.name, allFiles);
        if (consumers.length === 0) {
          entries.push({
            target: exp.full,
            type: "identifier",
            consumer_count: 0,
            consumers: [],
            zero_consumer: true,
            evidence: "no identifier references found outside __tests__",
          });
        }
      }
    }
  }

  const report = {
    schema_version: "dead-code-scan-report.v1",
    generated_at: new Date().toISOString(),
    root: ROOT,
    scan_options: { verify: args.verify, targets_count: targets?.length ?? null, mode: Array.isArray(targets) ? "targets" : "default" },
    entries,
  };

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log(`wrote ${REPORT_PATH}`);

  if (args.verify) {
    const hasReferenced = entries.some((e) => !e.zero_consumer);
    const isEmpty = entries.length === 0;
    if (hasReferenced || isEmpty) {
      console.error(`verify failed: referenced=${hasReferenced}, empty=${isEmpty}`);
      process.exit(1);
    }
    console.log("verify passed: all targets have zero consumers");
  }
}

main();
