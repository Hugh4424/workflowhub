import fs from "node:fs";
import path from "node:path";

const CODE_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"]);
const PYTHON_EXTENSIONS = new Set([".py"]);
const SHELL_EXTENSIONS = new Set([".sh", ".bash", ".zsh"]);
const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx"]);

function cleanTarget(raw) {
  const value = raw.trim().replace(/^<|>$/g, "").split(/[?#]/, 1)[0];
  try { return decodeURIComponent(value); } catch { return value; }
}

function isLocal(value) {
  return value && !value.startsWith("#") && !/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith("//");
}

function references(content, extension) {
  const found = [];
  if (MARKDOWN_EXTENSIONS.has(extension)) {
    for (const match of content.matchAll(/!?(?:\[[^\]]*\])\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g)) found.push(match[1]);
    for (const match of content.matchAll(/`((?:references|templates|scripts|examples)\/[A-Za-z0-9._/-]+)`/g)) found.push(match[1]);
    for (const match of content.matchAll(/`((?:\.\.\/|\.\/)[A-Za-z0-9._/-]+)`/g)) found.push(match[1]);
  }
  if (SHELL_EXTENSIONS.has(extension)) {
    for (const match of content.matchAll(/(?:^|[;&|\n]\s*)(?:source|\.)\s+["']?(\.{1,2}\/[A-Za-z0-9._/-]+)/g)) found.push(match[1]);
    for (const match of content.matchAll(/(?:^|[;&|\n]\s*)(\.{1,2}\/[A-Za-z0-9._/-]+)(?=\s|$)/g)) found.push(match[1]);
  }
  if (PYTHON_EXTENSIONS.has(extension)) {
    for (const match of content.matchAll(/^\s*from\s+(\.+)([A-Za-z_][\w.]*)\s+import\s+/gm)) {
      const levels = match[1].length;
      found.push(`${"../".repeat(Math.max(0, levels - 1))}${match[2].replaceAll(".", "/")}.py`);
    }
  }
  if (CODE_EXTENSIONS.has(extension)) {
    for (const match of content.matchAll(/(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g)) found.push(match[1]);
    for (const match of content.matchAll(/(?:import|require)\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g)) found.push(match[1]);
  }
  return found.map(cleanTarget).filter(isLocal);
}

function resolveReference(source, locator) {
  const initial = path.resolve(path.dirname(source), locator);
  if (fs.existsSync(initial) && fs.statSync(initial).isFile()) return initial;
  for (const suffix of [".js", ".mjs", ".cjs", ".ts", ".json", "/index.js", "/index.mjs"]) {
    if (fs.existsSync(initial + suffix) && fs.statSync(initial + suffix).isFile()) return initial + suffix;
  }
  return initial;
}

export function findUndeclaredStaticDependencies({ skillDir, fileEntries }) {
  const realDir = fs.realpathSync(skillDir);
  const packageRoot = path.dirname(path.dirname(realDir));
  const declared = new Set(fileEntries.map(entry => fs.realpathSync(entry.resolved)));
  const missing = [];
  for (const entry of fileEntries) {
    const extension = path.extname(entry.resolved).toLowerCase();
    if (!MARKDOWN_EXTENSIONS.has(extension) && !CODE_EXTENSIONS.has(extension) && !PYTHON_EXTENSIONS.has(extension) && !SHELL_EXTENSIONS.has(extension)) continue;
    const content = fs.readFileSync(entry.resolved, "utf8");
    for (const locator of references(content, extension)) {
      let target = resolveReference(entry.resolved, locator);
      if (!fs.existsSync(target) && MARKDOWN_EXTENSIONS.has(extension)) {
        const fromSkillRoot = resolveReference(path.join(realDir, "_root.md"), locator);
        if (fs.existsSync(fromSkillRoot)) target = fromSkillRoot;
      }
      if (fs.existsSync(target)) target = fs.realpathSync(target);
      const relative = path.relative(realDir, target);
      if (!fs.existsSync(target)) {
        if (CODE_EXTENSIONS.has(extension) || PYTHON_EXTENSIONS.has(extension) || SHELL_EXTENSIONS.has(extension)) missing.push({ source: entry.path, locator, reason: "referenced file is missing" });
      } else if (relative === ".." || relative.startsWith(`..${path.sep}`)) {
        const packageRelative = path.relative(packageRoot, target);
        if (packageRelative === ".." || packageRelative.startsWith(`..${path.sep}`)) {
          missing.push({ source: entry.path, locator, reason: "escapes package root" });
        }
      } else if (!declared.has(fs.realpathSync(target))) {
        missing.push({ source: entry.path, locator, reason: "not declared in skill-bundle.json" });
      }
    }
  }
  return missing;
}
