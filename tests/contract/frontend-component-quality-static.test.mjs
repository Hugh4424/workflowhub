import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { checkFrontendComponentQuality } from "../../skills/frontend-component-quality/scripts/check-frontend-component-quality.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const script = join(root, "skills/frontend-component-quality/scripts/check-frontend-component-quality.mjs");

test("static component/CSS quality lens accepts scoped CSS and a unique component", () => {
  const result = checkFrontendComponentQuality({
    component_quality_map: [{ component: "SettingsForm" }],
    css_files: [{
      path: "src/settings.css",
      scope: ".settings-form",
      content: ".settings-form .save { color: red; }\n.settings-form[aria-busy=\"true\"] .save { opacity: .6; }",
    }],
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.status, "ok");
  assert.deepEqual(result.findings, []);
});

test("static component/CSS quality lens reports duplicate, global, important, and leak findings", () => {
  const result = checkFrontendComponentQuality({
    component_quality_map: [{ component: "SettingsForm" }, { component: "SettingsForm" }, {}],
    css_files: [{
      path: "src/settings.css",
      scope: ".settings-form",
      content: "body { margin: 0 !important; }\n.outside { color: red; }\n.outside { color: blue; }",
    }],
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, "findings");
  assert.deepEqual(
    new Set(result.findings.map((entry) => entry.code)),
    new Set(["duplicate-component", "component-missing", "global-override", "important-declaration", "css-leak", "duplicate-selector"]),
  );
});

test("static component/CSS quality lens keeps missing inputs not_applicable", () => {
  const result = checkFrontendComponentQuality();
  assert.equal(result.ok, false);
  assert.equal(result.status, "not_applicable");
  assert.match(result.reason, /no Component Quality Map entries/i);
});

test("static component/CSS quality lens is independently executable", () => {
  const run = spawnSync(process.execPath, [script], {
    cwd: root,
    input: JSON.stringify({
      css_files: [{ path: "src/global.css", scope: ".card", content: "body { color: red; }" }],
    }),
    encoding: "utf8",
  });
  assert.equal(run.status, 1, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.status, "findings");
  assert.ok(result.findings.some((entry) => entry.code === "global-override"));
});

