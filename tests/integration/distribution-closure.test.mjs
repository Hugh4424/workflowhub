import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, test } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";

import { buildSkillBundleRelease } from "../../core/skill-bundle-release.mjs";
import { checkReleaseClosure } from "../../core/check-skill-closure.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const temps = [];
afterEach(() => temps.splice(0).forEach((entry) => fs.rmSync(entry, { recursive: true, force: true })));

describe("skill bundle release", () => {
  test("contains the five workflows and their declared skill closure only", async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-skill-release-"));
    temps.push(outputDir);
    const release = await buildSkillBundleRelease({ packageRoot: ROOT, outputDir });

    expect(release.runner_contract_major).toBeGreaterThan(0);
    expect(release.runner_contract_min_minor).toBeGreaterThanOrEqual(0);
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      expect(release.files.some(({ path: locator }) => locator === `workflows/${stage}/SKILL.md`)).toBe(true);
      expect(release.files.some(({ path: locator }) => locator === `workflows/${stage}/skill-deps.yaml`)).toBe(true);
    }
    for (const lens of ["simplicity-guard", "plan-eng-review"]) {
      expect(release.files.some(({ path: locator }) => locator === `skills/${lens}/SKILL.md`)).toBe(true);
    }
    expect(release.files.some(({ path: locator }) =>
      /(^|\/)(?:node_modules|tests?|__tests__|specs?|evidence|archive|history|historical)(?:\/|$)|\.test\.[^/]+$/.test(locator))).toBe(false);
    expect(JSON.stringify(release)).not.toContain(ROOT);
    for (const { path: locator } of release.files) {
      const content = fs.readFileSync(path.join(outputDir, locator), "utf8");
      expect(content).not.toMatch(/\/Users\/[A-Za-z0-9._-]+\//);
    }
    const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas/skill-bundle.schema.json"), "utf8"));
    const validate = new Ajv2020({ strict: false }).compile(schema);
    expect(validate(release)).toBe(true);
    const missingContract = { ...release };
    delete missingContract.runner_contract_major;
    expect(validate(missingContract)).toBe(false);
    expect(checkReleaseClosure({
      skillRelease: release,
      runnerRelease: { release: "workflowhub-runner", files: [] },
    })).toEqual({ ok: true, errors: [] });
  });
});
