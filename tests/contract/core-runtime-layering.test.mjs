import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function sourceFiles(directory) {
  const files = [];
  const visit = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const child = resolve(path, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile() && extname(child) === ".mjs") files.push(relative(root, child).replaceAll("\\", "/"));
    }
  };
  visit(resolve(root, directory));
  return files;
}

function staticGraph() {
  const files = [...sourceFiles("core"), ...sourceFiles("runtime")].sort();
  const known = new Set(files);
  const graph = new Map(files.map((path) => [path, []]));
  for (const path of files) {
    const source = readFileSync(resolve(root, path), "utf8");
    for (const match of source.matchAll(/(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g)) {
      if (!match[1].startsWith(".")) continue;
      let target = relative(root, resolve(dirname(resolve(root, path)), match[1])).replaceAll("\\", "/");
      if (extname(target) === "") target += ".mjs";
      if (known.has(target)) graph.get(path).push(target);
    }
  }
  return graph;
}

function stronglyConnectedComponents(graph) {
  const index = new Map();
  const lowlink = new Map();
  const stack = [];
  const active = new Set();
  const components = [];
  let nextIndex = 0;
  const visit = (node) => {
    index.set(node, nextIndex);
    lowlink.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    active.add(node);
    for (const adjacent of graph.get(node)) {
      if (!index.has(adjacent)) {
        visit(adjacent);
        lowlink.set(node, Math.min(lowlink.get(node), lowlink.get(adjacent)));
      } else if (active.has(adjacent)) {
        lowlink.set(node, Math.min(lowlink.get(node), index.get(adjacent)));
      }
    }
    if (lowlink.get(node) !== index.get(node)) return;
    const component = [];
    let adjacent;
    do {
      adjacent = stack.pop();
      active.delete(adjacent);
      component.push(adjacent);
    } while (adjacent !== node);
    if (component.length > 1) components.push(component.sort());
  };
  for (const node of graph.keys()) if (!index.has(node)) visit(node);
  return components.sort((left, right) => left[0].localeCompare(right[0]));
}

describe("core/runtime layering", () => {
  it("has no static import SCC across production core and runtime modules", () => {
    expect(stronglyConnectedComponents(staticGraph())).toEqual([]);
  });

  it("keeps freshness and audit carrying independent from TaskKernel implementation", () => {
    const freshness = readFileSync(resolve(root, "runtime/evidence/freshness.mjs"), "utf8");
    const auditCarrier = readFileSync(resolve(root, "runtime/evidence/audit-summary-carrier.mjs"), "utf8");
    const acceptanceValidator = readFileSync(resolve(root, "runtime/evidence/acceptance-evidence-validator.mjs"), "utf8");
    expect(freshness).not.toContain("task-kernel-implementation");
    expect(auditCarrier).not.toContain("task-handle.mjs");
    expect(acceptanceValidator).not.toMatch(/(?:task-kernel|task-handle|core\/)/);
  });
});
