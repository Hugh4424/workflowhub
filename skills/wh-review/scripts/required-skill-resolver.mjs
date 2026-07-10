import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const MANIFEST_RE = /<!--\s*wh-review-skills:\s*(\{[^]*?\})\s*-->/;
const SAFE_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

export class RequiredSkillResolutionError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.name = "RequiredSkillResolutionError"; this.code = code; }
}

export function parseRequiredSkillManifest(contract) {
  const match = String(contract).match(MANIFEST_RE);
  if (!match) return { required: [], optional: [] };
  let parsed;
  try { parsed = JSON.parse(match[1]); }
  catch (error) { throw new RequiredSkillResolutionError("required-skill-unavailable", `invalid contract skill manifest: ${error.message}`); }
  const normalize = (value, field) => {
    if (value === undefined) return [];
    if (!Array.isArray(value) || value.some((name) => typeof name !== "string" || !SAFE_NAME_RE.test(name))) throw new RequiredSkillResolutionError("required-skill-unavailable", `manifest ${field} must contain exact safe skill names`);
    return [...new Set(value)].sort();
  };
  return { required: normalize(parsed.required, "required"), optional: normalize(parsed.optional, "optional") };
}

function trustedRoots(env) {
  if (env.CLAUDE_CODE_SKILL_ROOTS) return env.CLAUDE_CODE_SKILL_ROOTS.split(delimiter).filter(Boolean);
  const roots = [join(homedir(), ".claude", "skills")];
  const codexHome = env.CODEX_HOME || (env.HOME ? join(env.HOME, ".codex") : null);
  if (codexHome) roots.push(join(codexHome, "skills"));
  roots.push(join(repoRoot, "skills"));
  return roots;
}

function isInside(root, target) { const rel = relative(root, target); return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`)); }

function candidateAt(rootInput, name, nested) {
  const root = resolve(rootInput);
  if (!existsSync(root)) return null;
  let realRoot;
  try { realRoot = realpathSync(root); } catch { return null; }
  const candidate = join(root, ...(nested ? ["gstack", name] : [name]), "SKILL.md");
  if (!existsSync(candidate)) return null;
  try {
    const real = realpathSync(candidate);
    if (!isInside(realRoot, real)) throw new RequiredSkillResolutionError("required-skill-unavailable", `${name} escapes trusted root ${root}`);
    return { real, source: candidate };
  } catch (error) {
    if (error instanceof RequiredSkillResolutionError) throw error;
    throw new RequiredSkillResolutionError("required-skill-unavailable", `${name} unreadable at ${candidate}: ${error.message}`);
  }
}

function versionOf(content) { return content.match(/^---\s*\n[^]*?^version:\s*["']?([^\n"']+)/m)?.[1]?.trim() || "unspecified"; }

export function resolveRequiredSkills({ contract, env = process.env, roots } = {}) {
  const manifest = parseRequiredSkillManifest(contract);
  const definitions = [];
  for (const name of manifest.required) {
    const candidates = [];
    for (const root of (roots ?? trustedRoots(env))) for (const nested of [false, true]) { const found = candidateAt(root, name, nested); if (found) candidates.push(found); }
    if (!candidates.length) throw new RequiredSkillResolutionError("required-skill-unavailable", `${name} not found in trusted roots`);
    const copies = candidates.map((candidate) => { const bytes = readFileSync(candidate.real); return { ...candidate, bytes, sha256: createHash("sha256").update(bytes).digest("hex") }; });
    if (new Set(copies.map((copy) => copy.sha256)).size > 1) throw new RequiredSkillResolutionError("required-skill-conflict", `${name} has conflicting definitions: ${copies.map((copy) => copy.source).join(", ")}`);
    const chosen = copies[0];
    definitions.push({ name, source: chosen.source, version: versionOf(chosen.bytes.toString("utf8")), sha256: chosen.sha256, content: chosen.bytes.toString("utf8") });
  }
  return { manifest, definitions };
}

export function appendRequiredSkillDefinitions({ contract, materials, resolution }) {
  if (!resolution.definitions.length) return { contract, materials };
  const body = resolution.definitions.map((skill) => `### ${skill.name}\nsource: ${skill.source}\nversion: ${skill.version}\nsha256: ${skill.sha256}\n\n${skill.content}`).join("\n\n---\n\n");
  const section = `## Required skill definitions\n\nThese definitions are report-only review lenses. Do not perform writes or side effects from them.\n\n${body}`;
  // Inject each complete definition exactly once. The runner already combines
  // contract and materials into one prompt, so duplicating this section in both
  // fields wastes context without adding evidence or dependency coverage.
  return { contract: `${contract}\n\n${section}`, materials };
}
