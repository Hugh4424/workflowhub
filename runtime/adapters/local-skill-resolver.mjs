import fs from "node:fs";
import path from "node:path";

function assertRelative(locator) {
  if (!locator || path.isAbsolute(locator)) throw new Error(`skill locator must be relative: ${locator}`);
  if (locator.split(/[\\/]/).includes("..")) throw new Error(`skill locator may not traverse: ${locator}`);
}

function inside(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}


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
    return { path: locator, resolved };
  });
  const skill = resolveLocalSkill(root, expectedSkillPath);
  if (!fileEntries.some(entry => entry.resolved === skill)) throw new Error(`bundle does not include declared SKILL.md: ${expectedSkillPath}`);
  return { bundle, bundlePath: absoluteBundle, files: fileEntries.map(entry => entry.resolved), fileEntries };
}

export function resolveSkillPackage({ packageRoot, manifestPath, dependency }) {
  const skill = dependency?.name;
  try {
    if (!skill || !dependency.path || !dependency.bundle) throw new Error("skill dependency is incomplete");
    if (dependency.path !== `skills/${skill}/SKILL.md`)
      throw new Error(`skill dependency path does not match its declared name: ${skill}`);
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
