#!/usr/bin/env node

import fs from "node:fs";

const GLOBAL_SELECTOR = /^(?:html|body|:root|\*|#(?:app|root)|:global\s*\()/i;
const RULE = /([^{}]+)\{([^{}]*)\}/g;

function text(value) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function componentName(value) {
  if (text(value)) return text(value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return text(value.name) || text(value.path) || text(value.ref);
  }
  return null;
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

function finding(code, message, extra = {}) {
  return Object.freeze({ code, message, ...extra });
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, " "));
}

function inspectCssFile(file, findings) {
  const path = text(file?.path) || "<inline-css>";
  const source = typeof file?.content === "string" ? file.content : null;
  const scope = text(file?.scope);
  if (source === null) {
    findings.push(finding("css-source-unavailable", `${path}: CSS source content is unavailable`, { path }));
    return;
  }
  if (!scope) {
    findings.push(finding("css-scope-unavailable", `${path}: a component scope is required to check CSS leakage`, { path }));
  }

  const clean = stripComments(source);
  const selectors = new Map();
  for (const match of clean.matchAll(RULE)) {
    const rawSelector = match[1].trim();
    const body = match[2];
    const startLine = lineNumber(source, match.index ?? 0);
    if (!rawSelector || rawSelector.startsWith("@")) continue;
    for (const selector of rawSelector.split(",").map((part) => part.trim()).filter(Boolean)) {
      const normalized = selector.replace(/\s+/g, " ");
      if (selectors.has(normalized)) {
        findings.push(finding(
          "duplicate-selector",
          `${path}:${startLine}: duplicate CSS selector ${normalized}`,
          { path, line: startLine, selector: normalized },
        ));
      } else {
        selectors.set(normalized, startLine);
      }
      if (GLOBAL_SELECTOR.test(normalized)) {
        findings.push(finding(
          "global-override",
          `${path}:${startLine}: global selector ${normalized} requires an explicit project-level owner`,
          { path, line: startLine, selector: normalized },
        ));
      }
      if (scope && !normalized.includes(scope)) {
        findings.push(finding(
          "css-leak",
          `${path}:${startLine}: selector ${normalized} escapes component scope ${scope}`,
          { path, line: startLine, selector: normalized, scope },
        ));
      }
    }
    if (/!\s*important\b/i.test(body)) {
      findings.push(finding(
        "important-declaration",
        `${path}:${startLine}: !important is not allowed in component CSS`,
        { path, line: startLine },
      ));
    }
  }
}

/**
 * Check the static part of a Component Quality Map and its CSS sources.
 *
 * This is deliberately a small, independent lint lens. It reports facts and
 * never grants a stage permit. Browser, visual, a11y, and runtime behavior
 * remain the responsibility of frontend-testing and isolated-browser-qa.
 */
export function checkFrontendComponentQuality(input = {}) {
  const findings = [];
  const map = Array.isArray(input.component_quality_map)
    ? input.component_quality_map
    : Array.isArray(input.componentQualityMap) ? input.componentQualityMap : [];
  const seenComponents = new Map();
  for (const [index, entry] of map.entries()) {
    const component = componentName(entry?.component);
    if (!component) {
      findings.push(finding(
        "component-missing",
        `component quality entry ${index + 1} is missing component`,
        { entry: index + 1 },
      ));
      continue;
    }
    if (seenComponents.has(component)) {
      findings.push(finding(
        "duplicate-component",
        `component quality map repeats component ${component}`,
        { component, entry: index + 1, first_entry: seenComponents.get(component) },
      ));
    } else {
      seenComponents.set(component, index + 1);
    }
  }

  const cssFiles = Array.isArray(input.css_files)
    ? input.css_files
    : Array.isArray(input.cssFiles) ? input.cssFiles : [];
  for (const file of cssFiles) inspectCssFile(file, findings);

  if (map.length === 0 && cssFiles.length === 0) {
    return Object.freeze({
      ok: false,
      status: "not_applicable",
      reason: "no Component Quality Map entries or CSS sources were supplied",
      findings: Object.freeze([]),
    });
  }
  return Object.freeze({
    ok: findings.length === 0,
    status: findings.length === 0 ? "ok" : "findings",
    findings: Object.freeze(findings),
  });
}

function readInput(locator) {
  const raw = locator && locator !== "-"
    ? fs.readFileSync(locator, "utf8")
    : fs.readFileSync(0, "utf8");
  return JSON.parse(raw);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = checkFrontendComponentQuality(readInput(process.argv[2]));
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (!result.ok) process.exitCode = result.status === "not_applicable" ? 2 : 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}

