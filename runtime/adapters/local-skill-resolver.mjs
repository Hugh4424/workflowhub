import fs from "node:fs";
import path from "node:path";

function assertRelative(locator) {
  if (typeof locator !== "string" || !locator || path.isAbsolute(locator)) throw new Error(`skill locator must be relative: ${locator}`);
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
  const directory = path.dirname(bundlePath);
  const expectedName = path.basename(directory);
  const expectedDir = path.resolve(root, directory);
  if (!inside(path.join(root, "skills"), expectedDir) || expectedDir === path.join(root, "skills"))
    throw new Error(`bundle must be inside a declared skill directory: ${bundlePath}`);
  // Check every nested directory; a contained realpath does not authorize a symlink.
  let parent = skillsRoot;
  for (const segment of path.relative(path.join(root, "skills"), expectedDir).split(path.sep))
    parent = assertDirectory(parent, segment, `skill directory ${segment}`);
  const realExpectedDir = parent;
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
  const seenDestinations = new Set();
  const fileEntries = bundle.files.map(entry => {
    if (typeof entry !== "string" && (!entry || typeof entry !== "object" || Array.isArray(entry))) {
      throw new Error(`invalid bundle asset entry: ${bundlePath}`);
    }
    if (typeof entry !== "string" && Object.keys(entry).some(key => !["path", "sha256", "destination"].includes(key))) {
      throw new Error(`invalid bundle asset entry: ${bundlePath}`);
    }
    const locator = typeof entry === "string" ? entry : entry.path;
    const hasDestination = typeof entry !== "string" && Object.hasOwn(entry, "destination");
    const destination = hasDestination ? entry.destination : locator;
    assertRelative(locator);
    assertRelative(destination);
    if (destination.includes("\\") || /^[A-Za-z]:/.test(destination) || destination.endsWith("/") || destination === "."
        || path.posix.normalize(destination) !== destination) {
      throw new Error(`skill destination must be a normalized relative path: ${destination}`);
    }
    if (locator === path.posix.basename(bundlePath) || destination === path.posix.basename(bundlePath)) {
      throw new Error(`bundle asset may not collide with its manifest: ${bundlePath}`);
    }
    if (seen.has(locator)) throw new Error(`duplicate bundle asset: ${locator}`);
    if (seenDestinations.has(destination)) throw new Error(`duplicate bundle destination: ${destination}`);
    seen.add(locator);
    seenDestinations.add(destination);
    const absolute = path.resolve(bundleDir, locator);
    const resolved = assertRegularContainedFile(bundleDir, realBundleDir, absolute, `bundle asset ${locator}`);
    return hasDestination ? { path: locator, destination, resolved } : { path: locator, resolved };
  });
  const skill = resolveLocalSkill(root, expectedSkillPath);
  if (!fileEntries.some(entry => entry.resolved === skill)) throw new Error(`bundle does not include declared SKILL.md: ${expectedSkillPath}`);
  return { bundle, bundlePath: absoluteBundle, files: fileEntries.map(entry => entry.resolved), fileEntries };
}

export function resolveSkillPackage({ packageRoot, manifestPath, dependency }) {
  const skill = dependency?.name;
  try {
    const bundle = dependency?.bundle === undefined ? `skills/${skill}/skill-bundle.json` : dependency.bundle;
    if (!skill || !dependency.path || !bundle) throw new Error("skill dependency is incomplete");
    const externalFamily = bundle === `skills/external/${skill}/skill-bundle.json`;
    if (!externalFamily && bundle !== `skills/${skill}/skill-bundle.json`)
      throw new Error(`skill dependency bundle does not match its declared name: ${skill}`);
    if (externalFamily) {
      assertRelative(dependency.path);
      if (!dependency.path.startsWith(`skills/external/${skill}/`) || !dependency.path.endsWith(".md"))
        throw new Error(`skill dependency path does not match its declared family: ${skill}`);
    } else if (dependency.path !== `skills/${skill}/SKILL.md`)
      throw new Error(`skill dependency path does not match its declared name: ${skill}`);
    const root = fs.realpathSync(packageRoot);
    assertRelative(manifestPath);
    const manifest = path.resolve(root, manifestPath);
    assertRegularContainedFile(root, root, manifest, `source manifest ${manifestPath}`);
    const skillPath = resolveLocalSkill(root, dependency.path);
    const checked = validateSkillBundle(root, bundle, dependency.path);
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
