import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

export const MANIFEST_FIELDS = [
  "id",
  "path",
  "version",
  "origin_path",
  "origin_framework",
  "local_changes",
  "owner_stage",
  "metrics_enabled",
];

function upstreamSources(entry) {
  return Array.isArray(entry?.upstream)
    ? entry.upstream.filter((source) => source && typeof source === "object")
    : [];
}

function originFramework(source) {
  const match = source?.github_url?.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)/);
  return match?.[1] ?? "workflowhub";
}

export function manifestEntryFromCatalog(entry) {
  const sources = upstreamSources(entry);
  return {
    id: entry?.name ?? null,
    path: entry?.path ?? null,
    version: entry?.local_version ?? null,
    origin_path: sources.map((source) => typeof source.path === "string" ? source.path : null),
    origin_framework: sources.map(originFramework),
    local_changes: entry?.local_changes ?? null,
    owner_stage: Array.isArray(entry?.used_by_stages) ? [...entry.used_by_stages] : [],
    metrics_enabled: typeof entry?.metrics_enabled === "boolean" ? entry.metrics_enabled : null,
  };
}

export function buildRepoSkillsManifest(catalog) {
  const entries = Array.isArray(catalog?.skills) ? catalog.skills : [];
  return {
    schema_version: 1,
    source: "skills/catalog.yaml",
    skills: entries
      .map(manifestEntryFromCatalog),
  };
}

function parseArgs(argv) {
  const args = { check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      args.check = true;
    } else if (["--catalog", "--output"].includes(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value`);
      args[argument.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return args;
}

function diffManifests(expected, actual) {
  const differences = [];
  if (expected?.schema_version !== actual?.schema_version) {
    differences.push(`schema_version: expected ${JSON.stringify(expected?.schema_version)}, got ${JSON.stringify(actual?.schema_version)}`);
  }
  if (expected?.source !== actual?.source) {
    differences.push(`source: expected ${JSON.stringify(expected?.source)}, got ${JSON.stringify(actual?.source)}`);
  }
  const expectedSkills = Array.isArray(expected?.skills) ? expected.skills : [];
  const actualSkills = Array.isArray(actual?.skills) ? actual.skills : [];
  if (expectedSkills.length !== actualSkills.length) {
    differences.push(`skills.length: expected ${expectedSkills.length}, got ${actualSkills.length}`);
  }
  const count = Math.max(expectedSkills.length, actualSkills.length);
  for (let index = 0; index < count; index += 1) {
    const expectedSkill = expectedSkills[index];
    const actualSkill = actualSkills[index];
    for (const field of MANIFEST_FIELDS) {
      const expectedValue = expectedSkill?.[field];
      const actualValue = actualSkill?.[field];
      if (JSON.stringify(expectedValue) !== JSON.stringify(actualValue)) {
        differences.push(`skills[${index}].${field}: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`);
      }
    }
    for (const field of Object.keys(actualSkill ?? {}).filter((key) => !MANIFEST_FIELDS.includes(key))) {
      differences.push(`skills[${index}].${field}: unexpected field ${JSON.stringify(actualSkill[field])}`);
    }
  }
  return differences;
}

export function writeOrCheckManifest({ catalogPath, outputPath, check = false }) {
  const catalog = yaml.load(fs.readFileSync(catalogPath, "utf8"));
  const expected = buildRepoSkillsManifest(catalog);
  if (!check) {
    fs.writeFileSync(outputPath, `${JSON.stringify(expected, null, 2)}\n`, "utf8");
    return { ok: true, differences: [] };
  }
  let actual;
  try {
    actual = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  } catch (error) {
    return { ok: false, differences: [`manifest: ${error.message}`] };
  }
  const differences = diffManifests(expected, actual);
  return { ok: differences.length === 0, differences };
}

function repositoryRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const root = repositoryRoot();
    const result = writeOrCheckManifest({
      catalogPath: path.resolve(args.catalog ?? path.join(root, "skills/catalog.yaml")),
      outputPath: path.resolve(args.output ?? path.join(root, "repo-skills.manifest.json")),
      check: args.check,
    });
    if (!result.ok) {
      console.error(result.differences.map(difference => `- ${difference}`).join("\n"));
      process.exitCode = 1;
    } else if (args.check) {
      console.log("repo skills manifest: ok");
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
