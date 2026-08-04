import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateStepManifest } from "../runtime/stage/step-manifest.mjs";

const repoRoot = new URL("..", import.meta.url).pathname;
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const skills = ["requirement-lineage"];

async function text(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

describe("P0 foundation contracts", () => {
  it("publishes discoverable skills with required YAML metadata", async () => {
    for (const skill of skills) {
      const relativePath = `skills/${skill}/SKILL.md`;
      await expect(access(path.join(repoRoot, relativePath))).resolves.toBeUndefined();
      const source = await text(relativePath);
      expect(source).toMatch(new RegExp(`^---\\nname: ${skill}\\ndescription: .+\\n---`, "s"));
      expect(source).toMatch(/## Typed I\/O/);
      expect(source).toMatch(/invalid_input|conflict/);
      expect(source).toMatch(/## Consumers/);
    }
  });

  it("registers every P0 skill to an existing local file", async () => {
    const config = await text("config/workflowhub.yaml");
    const registry = await text("docs/reuse-registry.md");
    for (const skill of skills) {
      const relativePath = `skills/${skill}/SKILL.md`;
      expect(config).toContain(`component_id: ${skill}`);
      expect(config).toContain(`path: ${relativePath}`);
      expect(registry).toContain(`\`${relativePath}\``);
      await expect(access(path.join(repoRoot, relativePath))).resolves.toBeUndefined();
    }
  });

  it("keeps the inventory and five manifests in exact two-way coverage", async () => {
    const inventory = await text("docs/stage-atomic-step-inventory.md");
    const documented = new Set(
      [...inventory.matchAll(/^\| (make-decision|build-spec|build-plan|build-code|verify-code) \| (\d+) \| ([a-z0-9-]+) \|/gm)]
        .map(([, stage, order, step]) => `${stage}:${order}:${step}`),
    );
    const actual = new Set();

    for (const stage of stages) {
      const manifest = JSON.parse(await text(`workflows/${stage}/steps.json`));
      expect(manifest.stage_slug).toBe(stage);
      expect(validateStepManifest(manifest)).toEqual({ ok: true, errors: [] });
      manifest.steps.forEach(({ order, step_slug }) => actual.add(`${stage}:${order}:${step_slug}`));
    }

    expect(documented.size).toBe(46);
    expect(actual.size).toBe(46);
    expect([...documented].sort()).toEqual([...actual].sort());
  });
});
