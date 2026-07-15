import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { smokeLocalSkillDispatch } from "../smoke-local-skill-dispatch.mjs";

it("dispatches all five stages from a clean profile despite global same-name skills", async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const result = await smokeLocalSkillDispatch(root);
  expect(result).toHaveLength(5);
  expect(new Set(result.map(item => item.stage)).size).toBe(5);
});
