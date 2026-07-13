import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const REPOSITORY_SKILLS_ROOT = join(repoRoot, "skills");
const STAGE_SKILL_PLAN_PATH = join(repoRoot, "skills", "wh-review", "stage-skill-plan.json");
export class RequiredSkillResolutionError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.name = "RequiredSkillResolutionError"; this.code = code; }
}

function isInside(root, target) { const rel = relative(root, target); return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`)); }

function requireRepositoryRoot(roots) {
  if (!roots) return REPOSITORY_SKILLS_ROOT;
  if (!Array.isArray(roots) || roots.length !== 1 || resolve(roots[0]) !== REPOSITORY_SKILLS_ROOT) {
    throw new RequiredSkillResolutionError("required-skill-unavailable", "required skills must resolve from the repository skills root");
  }
  return REPOSITORY_SKILLS_ROOT;
}

function safeBundlePath(value) {
  return typeof value === "string" && value.length > 0 && !value.startsWith("/") && !value.includes("\\") && !value.split("/").includes("..");
}

function regularSingleLink(pathname, skillName) {
  let stat;
  try { stat = lstatSync(pathname); }
  catch { throw new RequiredSkillResolutionError("required-skill-unavailable", `${skillName} bundle file is missing: ${pathname}`); }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    throw new RequiredSkillResolutionError("required-skill-unavailable", `${skillName} bundle file must be a single-link regular file: ${pathname}`);
  }
}

export function validateReviewBundle({ skillDir, name }) {
  const bundlePath = join(skillDir, "review-bundle.json");
  regularSingleLink(bundlePath, name);
  let parsed;
  try { parsed = JSON.parse(readFileSync(bundlePath, "utf8")); }
  catch (error) { throw new RequiredSkillResolutionError("required-skill-unavailable", `${name} has invalid review-bundle.json: ${error.message}`); }
  const entrypoint = parsed.entrypoint ?? "SKILL.md";
  if (parsed.version !== 1 || !Array.isArray(parsed.files) || !parsed.files.includes(entrypoint) || !safeBundlePath(entrypoint) || parsed.files.some((entry) => !safeBundlePath(entry))) {
    throw new RequiredSkillResolutionError("required-skill-unavailable", `${name} review-bundle.json must declare a safe entrypoint`);
  }
  if ((parsed.mode !== undefined && parsed.mode !== "lens-only") || (parsed.delivery_mode !== undefined && parsed.delivery_mode !== "file_only")) {
    throw new RequiredSkillResolutionError("required-skill-unavailable", `${name} bundle may only declare lens-only file_only delivery`);
  }
  const files = [...new Set(parsed.files)].sort().map((entry) => {
    const file = join(skillDir, entry);
    const resolved = resolve(file);
    if (!isInside(skillDir, resolved)) throw new RequiredSkillResolutionError("required-skill-unavailable", `${name} bundle escapes its skill directory`);
    regularSingleLink(resolved, name);
    const bytes = readFileSync(resolved);
    return { path: entry, sha256: createHash("sha256").update(bytes).digest("hex"), content: bytes.toString("utf8") };
  });
  const sha256 = createHash("sha256").update(JSON.stringify(files.map(({ path, sha256: fileHash }) => ({ path, sha256: fileHash })))).digest("hex");
  return { sha256, files, entrypoint, content: files.find((file) => file.path === entrypoint).content };
}

function bundleAt(root, name) {
  return validateReviewBundle({ skillDir: join(root, name), name });
}

function candidateAt(rootInput, name) {
  const root = resolve(rootInput);
  if (!existsSync(root)) return null;
  let realRoot;
  try { realRoot = realpathSync(root); } catch { return null; }
  const candidate = join(root, name, "SKILL.md");
  if (!existsSync(candidate)) return null;
  try {
    regularSingleLink(candidate, name);
    const real = realpathSync(candidate);
    if (!isInside(realRoot, real)) throw new RequiredSkillResolutionError("required-skill-unavailable", `${name} escapes trusted root ${root}`);
    return { real, source: candidate, bundle: bundleAt(root, name) };
  } catch (error) {
    if (error instanceof RequiredSkillResolutionError) throw error;
    throw new RequiredSkillResolutionError("required-skill-unavailable", `${name} unreadable at ${candidate}: ${error.message}`);
  }
}

function versionOf(content) { return content.match(/^---\s*\n[^]*?^version:\s*["']?([^\n"']+)/m)?.[1]?.trim() || "unspecified"; }

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function readStageSkillPlan(stageSkillPlan) {
  if (stageSkillPlan !== undefined) return stageSkillPlan;
  try { return JSON.parse(readFileSync(STAGE_SKILL_PLAN_PATH, "utf8")); }
  catch (error) { throw new RequiredSkillResolutionError("required-skill-unavailable", `invalid stage skill plan: ${error.message}`); }
}

function assertCompleteProfile(profile, stage) {
  const required = ["logical_skill_id", "material_profile", "output_schema", "checkpoints", "expected_evidence", "bundle_hash", "bundle_closure_files", "review_mode", "delivery_mode", "continuation_policy", "pass_finding_policy"];
  for (const field of required) if (profile?.[field] === undefined) throw new RequiredSkillResolutionError("required-skill-unavailable", `incomplete stage skill plan for ${stage}: missing ${field}`);
  if (typeof profile.logical_skill_id !== "string" || !profile.logical_skill_id.startsWith("wh-review/")) throw new RequiredSkillResolutionError("required-skill-unavailable", `incomplete stage skill plan for ${stage}: invalid logical_skill_id`);
  if (profile.output_schema !== "schemas/reviewer-output.schema.json") throw new RequiredSkillResolutionError("required-skill-unavailable", `incomplete stage skill plan for ${stage}: invalid output_schema`);
  if (!Array.isArray(profile.checkpoints) || !profile.checkpoints.length || profile.checkpoints.some((item) => typeof item !== "string" || !item)) throw new RequiredSkillResolutionError("required-skill-unavailable", `incomplete stage skill plan for ${stage}: invalid checkpoints`);
  if (!Array.isArray(profile.expected_evidence) || !profile.expected_evidence.length || profile.expected_evidence.some((item) => typeof item !== "string" || !item)) throw new RequiredSkillResolutionError("required-skill-unavailable", `incomplete stage skill plan for ${stage}: invalid expected_evidence`);
  if (profile.bundle_hash !== "resolved-at-prepare" || profile.bundle_closure_files !== "resolved-at-prepare") throw new RequiredSkillResolutionError("required-skill-unavailable", `incomplete stage skill plan for ${stage}: bundle metadata must resolve at prepare`);
  if (profile.review_mode !== "lens-only") throw new RequiredSkillResolutionError("required-skill-unavailable", `incomplete stage skill plan for ${stage}: invalid review_mode`);
}

function profileFor({ stage, reviewTrack, ui, stageSkillPlan }) {
  const plan = readStageSkillPlan(stageSkillPlan);
  if (plan?.version !== 1 || !plan?.stages || typeof plan.stages !== "object") throw new RequiredSkillResolutionError("required-skill-unavailable", "invalid stage skill plan root");
  const profile = plan.stages?.[stage];
  if (!profile) throw new RequiredSkillResolutionError("required-skill-unavailable", `unknown stage profile: ${String(stage)}`);
  if (profile.tracks) {
    if (typeof reviewTrack !== "string" || !profile.tracks[reviewTrack]) {
      throw new RequiredSkillResolutionError("required-skill-unavailable", `stage ${stage} requires a known review_track`);
    }
    const selected = { ...profile.tracks[reviewTrack], stage, reviewTrack };
    assertCompleteProfile(selected, `${stage}/${reviewTrack}`);
    return selected;
  }
  if (reviewTrack !== undefined && reviewTrack !== null) {
    throw new RequiredSkillResolutionError("required-skill-unavailable", `stage ${stage} does not accept review_track`);
  }
  const selected = { ...profile, stage, reviewTrack: null, ui: Boolean(ui) };
  assertCompleteProfile(selected, stage);
  return selected;
}

function profileSkillNames(profile, ui) {
  const required = Array.isArray(profile.required_skills) ? profile.required_skills : [];
  const optional = ui ? (profile.optional_skills ?? []).filter(({ when }) => when === "ui").map(({ name }) => name) : [];
  return [...new Set([...required, ...optional])].sort();
}

export function resolveRequiredSkills({ stage, reviewTrack, ui = false, roots, stageSkillPlan } = {}) {
  const profile = profileFor({ stage, reviewTrack, ui, stageSkillPlan });
  const deliveryMode = profile.delivery_mode ?? "file_only";
  if (deliveryMode !== "file_only" && deliveryMode !== "always_embed") {
    throw new RequiredSkillResolutionError("required-skill-unavailable", `invalid delivery mode for ${stage}`);
  }
  if (deliveryMode === "always_embed" && profile.review_mode !== "lens-only") {
    throw new RequiredSkillResolutionError("required-skill-unavailable", `always_embed requires explicit lens-only mode for ${stage}`);
  }
  const root = requireRepositoryRoot(roots);
  const definitions = [];
  for (const name of profileSkillNames(profile, ui)) {
    if (deliveryMode === "always_embed" && (name === "spec-analyze" || name === "verify-change")) {
      throw new RequiredSkillResolutionError("required-skill-unavailable", `${name} cannot use always_embed`);
    }
    const chosen = candidateAt(root, name);
    if (!chosen) throw new RequiredSkillResolutionError("required-skill-unavailable", `${name} not found in repository skills root`);
    const bytes = readFileSync(chosen.real);
    definitions.push({ name, source: chosen.source, version: versionOf(bytes.toString("utf8")), sha256: createHash("sha256").update(bytes).digest("hex"), content: chosen.bundle.content, bundle: chosen.bundle });
  }
  const bundleClosureFiles = definitions.flatMap(({ name, bundle }) => bundle.files.map(({ path, sha256 }) => ({ skill: name, path, sha256 })));
  const skillBundleHash = createHash("sha256").update(canonical(definitions.map(({ name, bundle }) => ({ name, sha256: bundle.sha256 })))).digest("hex");
  return {
    stage,
    reviewTrack: profile.reviewTrack,
    logicalSkillId: profile.logical_skill_id,
    outputSchema: profile.output_schema,
    checkpoints: [...profile.checkpoints],
    expectedEvidence: [...profile.expected_evidence],
    reviewMode: profile.review_mode,
    deliveryMode,
    skillBundleHash,
    bundleClosureFiles,
    definitions,
  };
}

export function appendRequiredSkillDefinitions({ contract, materials, resolution }) {
  if (resolution.deliveryMode !== "always_embed" || !resolution.definitions.length) return { contract, materials };
  const body = resolution.definitions.map((skill) => `### ${skill.name}\nsource: ${skill.source}\nversion: ${skill.version}\nsha256: ${skill.sha256}\n\n${skill.content}`).join("\n\n---\n\n");
  const section = `## Required skill definitions\n\nThese definitions are report-only review lenses. Do not perform writes or side effects from them.\n\n${body}`;
  // Inject each complete definition exactly once. The runner already combines
  // contract and materials into one prompt, so duplicating this section in both
  // fields wastes context without adding evidence or dependency coverage.
  return { contract: `${contract}\n\n${section}`, materials };
}
