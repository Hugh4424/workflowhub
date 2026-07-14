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
  const files = bundle.files.map(entry => {
    const locator = typeof entry === "string" ? entry : entry.path;
    assertRelative(locator);
    const absolute = path.resolve(bundleDir, locator);
    const resolved = assertRegularContainedFile(bundleDir, realBundleDir, absolute, `bundle asset ${locator}`);
    if (typeof entry === "object" && entry.sha256) {
      const actual = crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex");
      if (entry.sha256 !== actual) throw new Error(`bundle sha256 mismatch: ${locator}`);
    }
    return resolved;
  });
  const skill = resolveLocalSkill(root, expectedSkillPath);
  if (!files.includes(skill)) throw new Error(`bundle does not include declared SKILL.md: ${expectedSkillPath}`);
  return { bundle, bundlePath: absoluteBundle, files };
}
