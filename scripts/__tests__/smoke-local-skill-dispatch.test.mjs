import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { smokeLocalSkillPackages } from "../../tools/cli/smoke-local-skill-dispatch.mjs";

it("resolves direct skill packages for all five stages", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const result = smokeLocalSkillPackages(root);
  expect(result).toHaveLength(5);
  expect(new Set(result.map(item => item.stage)).size).toBe(5);
  expect(result.every(item => item.skill_count > 0 && item.step_count > 0)).toBe(true);
  expect(result.every(item => item.bundle_hashes.length === item.skill_count)).toBe(true);
});
