import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { findUndeclaredStaticDependencies } from "../skill-static-deps.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-static-"));
  roots.push(root);
  const skillDir = path.join(root, "skills/demo");
  fs.mkdirSync(skillDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(skillDir, name)), { recursive: true });
    fs.writeFileSync(path.join(skillDir, name), content);
  }
  return { skillDir, entries: Object.keys(files).map(name => ({ path: name, resolved: path.join(skillDir, name) })) };
}

it("finds linked Markdown assets omitted from the bundle", () => {
  const value = fixture({ "SKILL.md": "[rules](references/rules.md)", "references/rules.md": "rules" });
  expect(findUndeclaredStaticDependencies({ skillDir: value.skillDir, fileEntries: [value.entries[0]] })).toEqual([expect.objectContaining({ locator: "references/rules.md", reason: "not declared in skill-bundle.json" })]);
});

it("finds static Node imports omitted from the bundle", () => {
  const value = fixture({ "main.mjs": "import './helper.mjs';", "helper.mjs": "export default 1;" });
  expect(findUndeclaredStaticDependencies({ skillDir: value.skillDir, fileEntries: [value.entries[0]] })).toEqual([expect.objectContaining({ locator: "./helper.mjs" })]);
});

it("accepts declared local dependencies", () => {
  const value = fixture({ "SKILL.md": "[rules](references/rules.md)", "references/rules.md": "rules" });
  expect(findUndeclaredStaticDependencies({ skillDir: value.skillDir, fileEntries: value.entries })).toEqual([]);
});
