import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const generator = path.join(root, "tools/cli/repo-skills-manifest.mjs");
const catalog = path.join(root, "tests/fixtures/catalog-drift/catalog.yaml");
const temporaryDirectories = [];

function temporaryManifestPath() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-m17-manifest-"));
  temporaryDirectories.push(directory);
  return path.join(directory, "repo-skills.manifest.json");
}

function runGenerator(...args) {
  return spawnSync(process.execPath, [generator, "--catalog", catalog, ...args], {
    encoding: "utf8",
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe("repo skills manifest", () => {
  it("maps every catalog entry to the fixed eight-field manifest contract", () => {
    const output = temporaryManifestPath();
    const result = runGenerator("--output", output);
    expect(result.status).toBe(0);

    const manifest = JSON.parse(fs.readFileSync(output, "utf8"));
    expect(manifest.skills).toHaveLength(3);
    expect(manifest.skills[0]).toEqual({
      id: "core-runtime",
      path: "skills/core-runtime/SKILL.md",
      version: "1.2.3",
      origin_path: ["skills/core-runtime/SKILL.md"],
      origin_framework: ["example/framework"],
      local_changes: "native runtime contract",
      owner_stage: ["build-code"],
      metrics_enabled: true,
    });
    expect(manifest.skills[1].origin_path).toEqual([]);
    expect(manifest.skills[1].origin_framework).toEqual([]);
    expect(manifest.skills[2].origin_path).toEqual(["skills/first/SKILL.md", "skills/second/SKILL.md"]);
    expect(manifest.skills[2].origin_framework).toEqual(["example/first-framework", "example/second-framework"]);
  });

  it("returns a non-zero check with a field-level drift", () => {
    const output = temporaryManifestPath();
    expect(runGenerator("--output", output).status).toBe(0);
    const manifest = JSON.parse(fs.readFileSync(output, "utf8"));
    manifest.skills[0].version = "9.9.9";
    fs.writeFileSync(output, JSON.stringify(manifest, null, 2) + "\n");

    const result = runGenerator("--output", output, "--check");
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain("skills[0].version");
  });

  it("reports missing entries and unexpected fields instead of only a length drift", () => {
    const output = temporaryManifestPath();
    expect(runGenerator("--output", output).status).toBe(0);
    const manifest = JSON.parse(fs.readFileSync(output, "utf8"));
    manifest.skills.pop();
    manifest.skills[0].unexpected = true;
    fs.writeFileSync(output, JSON.stringify(manifest, null, 2) + "\n");

    const result = runGenerator("--output", output, "--check");
    expect(result.status).not.toBe(0);
    const outputText = `${result.stdout}\n${result.stderr}`;
    expect(outputText).toContain("skills.length");
    expect(outputText).toContain("skills[0].unexpected");
    expect(outputText).toContain("skills[2].id");
  });
});
