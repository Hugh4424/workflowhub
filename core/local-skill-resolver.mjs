import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function assertRelative(locator) {
  if (!locator || path.isAbsolute(locator)) throw new Error(`skill locator must be relative: ${locator}`);
  if (locator.split(/[\\/]/).includes("..")) throw new Error(`skill locator may not traverse: ${locator}`);
}

function inside(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function sha256(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }

export function createSkillDiagnostic({
  source,
  skill,
  status,
  code,
  message = null,
  enforcement = source === "doctor" ? "advisory" : "fail_loud",
}) {
  return Object.freeze({
    schema_version: "workflowhub-skill-diagnostic.v1",
    source,
    skill,
    status,
    code,
    message,
    enforcement,
  });
}

function resolverError(skill, error) {
  if (error?.diagnostic?.schema_version === "workflowhub-skill-diagnostic.v1") return error;
  const wrapped = new Error(error?.message || "skill resolution failed", { cause: error });
  wrapped.diagnostic = createSkillDiagnostic({
    source: "resolver",
    skill: skill || "unknown",
    status: "blocked",
    code: "SKILL_RESOLUTION_FAILED",
    message: wrapped.message,
  });
  return wrapped;
}

function assertDirectory(root, relative, label) {
  const candidate = path.join(root, relative);
  const stat = fs.lstatSync(candidate);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${label} must be a real directory`);
  const resolved = fs.realpathSync(candidate);
  if (!inside(root, resolved)) throw new Error(`${label} realpath escapes package root`);
  return resolved;
}

function assertRegularContainedFile(lexicalRoot, realRoot, candidate, label) {
  if (!inside(lexicalRoot, candidate)) throw new Error(`${label} escapes its allowed directory`);
  const stat = fs.lstatSync(candidate);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`${label} must be a regular non-symlink file`);
  if (stat.nlink > 1) throw new Error(`${label} may not be hard-linked`);
  const resolved = fs.realpathSync(candidate);
  if (!inside(realRoot, resolved)) throw new Error(`${label} realpath escapes its allowed directory`);
  return resolved;
}

export function resolveLocalSkill(packageRoot, declaredPath) {
  if (!path.isAbsolute(packageRoot)) throw new Error("workflowhub_package_root must be absolute");
  assertRelative(declaredPath);
  const root = fs.realpathSync(packageRoot);
  const skillsRoot = assertDirectory(root, "skills", "skills root");
  const lexical = path.resolve(root, declaredPath);
  if (!inside(path.join(root, "skills"), lexical)) throw new Error(`skill path escapes package skills/: ${declaredPath}`);
  return assertRegularContainedFile(path.join(root, "skills"), skillsRoot, lexical, `skill path ${declaredPath}`);
}

export function validateSkillBundle(packageRoot, bundlePath, expectedSkillPath) {
  assertRelative(bundlePath);
  const root = fs.realpathSync(packageRoot);
  const skillsRoot = assertDirectory(root, "skills", "skills root");
  const expectedName = expectedSkillPath.split("/").at(-2);
  const expectedDir = path.join(root, "skills", expectedName);
  const realExpectedDir = assertDirectory(path.join(root, "skills"), expectedName, `skill directory ${expectedName}`);
  const absoluteBundle = path.resolve(root, bundlePath);
  assertRegularContainedFile(expectedDir, realExpectedDir, absoluteBundle, `bundle ${bundlePath}`);
  const bundle = JSON.parse(fs.readFileSync(absoluteBundle, "utf8"));
  if (bundle.schema_version !== 1 || !Array.isArray(bundle.files) || bundle.files.length === 0) {
    throw new Error(`invalid skill bundle: ${bundlePath}`);
  }
  if (bundle.skill !== expectedName) throw new Error(`bundle skill id mismatch: expected ${expectedName}, got ${bundle.skill}`);
  const bundleDir = path.dirname(absoluteBundle);
  const realBundleDir = fs.realpathSync(bundleDir);
  if (realBundleDir !== realExpectedDir) throw new Error(`bundle must be directly inside skill directory: ${bundlePath}`);
  const seen = new Set();
  const fileEntries = bundle.files.map(entry => {
    const locator = typeof entry === "string" ? entry : entry.path;
    assertRelative(locator);
    if (seen.has(locator)) throw new Error(`duplicate bundle asset: ${locator}`);
    seen.add(locator);
    const absolute = path.resolve(bundleDir, locator);
    const resolved = assertRegularContainedFile(bundleDir, realBundleDir, absolute, `bundle asset ${locator}`);
    const actual = sha256(fs.readFileSync(absolute));
    if (typeof entry === "object" && entry.sha256) {
      if (entry.sha256 !== actual) throw new Error(`bundle sha256 mismatch: ${locator}`);
    }
    return { path: locator, resolved, sha256: actual };
  });
  const skill = resolveLocalSkill(root, expectedSkillPath);
  if (!fileEntries.some(entry => entry.resolved === skill)) throw new Error(`bundle does not include declared SKILL.md: ${expectedSkillPath}`);
  const bundleHash = sha256(canonical(fileEntries.map(({ path: locator, sha256: hash }) => ({ path: locator, sha256: hash })).sort((a, b) => a.path.localeCompare(b.path))));
  return { bundle, bundlePath: absoluteBundle, files: fileEntries.map(entry => entry.resolved), fileEntries, bundleHash };
}

export function validateReviewBundleProjection(packageRoot, reviewBundlePath, expectedSkillPath) {
  assertRelative(reviewBundlePath);
  const root = fs.realpathSync(packageRoot);
  const skillName = expectedSkillPath.split("/").at(-2);
  const checked = validateSkillBundle(root, `skills/${skillName}/skill-bundle.json`, expectedSkillPath);
  const skillDir = path.join(root, "skills", skillName);
  const projectionPath = path.resolve(root, reviewBundlePath);
  assertRegularContainedFile(skillDir, fs.realpathSync(skillDir), projectionPath, `review bundle ${reviewBundlePath}`);
  const projection = JSON.parse(fs.readFileSync(projectionPath, "utf8"));
  if (projection.schema_version !== 1 || projection.skill !== skillName || !Array.isArray(projection.files) || projection.files.length === 0) {
    throw new Error(`invalid review bundle projection: ${reviewBundlePath}`);
  }
  if (projection.mode !== "lens-only" || !["file_only", "always_embed"].includes(projection.delivery_mode)) {
    throw new Error(`review bundle must be a lens-only delivery projection: ${reviewBundlePath}`);
  }
  const entrypoint = projection.entrypoint || "SKILL.md";
  const allowed = new Map(checked.fileEntries.map(entry => [entry.path, entry]));
  const selected = [];
  for (const locator of projection.files) {
    assertRelative(locator);
    const entry = allowed.get(locator);
    if (!entry) throw new Error(`review bundle asset is not in skill-bundle.json: ${locator}`);
    selected.push(entry);
  }
  if (!selected.some(entry => entry.path === entrypoint)) throw new Error(`review bundle omits entrypoint: ${entrypoint}`);
  const projectionHash = sha256(canonical(selected.map(({ path: locator, sha256: hash }) => ({ path: locator, sha256: hash })).sort((a, b) => a.path.localeCompare(b.path))));
  return { projection, projectionPath, entrypoint, files: selected, bundleHash: checked.bundleHash, projectionHash };
}

export function resolveSkillDispatch({ packageRoot, manifestPath, dependency }) {
  const skill = dependency?.name;
  try {
    if (!skill || !dependency.path || !dependency.bundle) throw new Error("skill dependency is incomplete");
    const root = fs.realpathSync(packageRoot);
    assertRelative(manifestPath);
    const manifest = path.resolve(root, manifestPath);
    assertRegularContainedFile(root, root, manifest, `source manifest ${manifestPath}`);
    const skillPath = resolveLocalSkill(root, dependency.path);
    const checked = validateSkillBundle(root, dependency.bundle, dependency.path);
    return {
      name: skill,
      resolved_skill_path: skillPath,
      resolved_bundle_paths: checked.fileEntries.map(entry => entry.resolved),
      bundle_hash: checked.bundleHash,
      source_manifest: manifest,
      package_root: root,
      diagnostic: createSkillDiagnostic({
        source: "resolver",
        skill,
        status: "available",
        code: "SKILL_RESOLVED",
      }),
    };
  } catch (error) {
    throw resolverError(skill, error);
  }
}
