import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { assertRunnerCompatibility, createRunnerContract } from "./runner-contract.mjs";
import { validateSkillBundleRelease } from "./skill-bundle-release.mjs";

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function filesUnder(root, relative, predicate = () => true) {
  const source = path.join(root, relative);
  if (!fs.existsSync(source)) return [];
  return fs.readdirSync(source, { withFileTypes: true }).flatMap((entry) => {
    const locator = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") return [];
      return filesUnder(root, locator, predicate);
    }
    return entry.isFile() && predicate(locator) ? [locator] : [];
  });
}

async function copy(root, destination, locator) {
  const source = path.join(root, locator);
  const stat = fs.lstatSync(source);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`runner release source must be a regular file: ${locator}`);
  const bytes = fs.readFileSync(source);
  const target = path.join(destination, locator);
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  await fs.promises.writeFile(target, bytes, { flag: "wx" });
  return { path: locator, sha256: sha256(bytes) };
}

function addStaticDependencies(root, locators) {
  const queue = [...locators];
  const imports = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while (queue.length) {
    const locator = queue.pop();
    if (!/\.(?:mjs|js|cjs)$/.test(locator)) continue;
    const content = fs.readFileSync(path.join(root, locator), "utf8");
    for (const match of content.matchAll(imports)) {
      const specifier = match[1] ?? match[2];
      if (!specifier?.startsWith(".")) continue;
      const base = path.posix.normalize(path.posix.join(path.posix.dirname(locator), specifier));
      const candidates = path.posix.extname(base) ? [base] : [`${base}.mjs`, `${base}.js`, path.posix.join(base, "index.mjs")];
      const dependency = candidates.find((candidate) => fs.existsSync(path.join(root, candidate)));
      if (!dependency || locators.has(dependency)) continue;
      if (/(?:^|\/)(?:node_modules|__tests__|tests)(?:\/|$)|\.test\.[^/]+$/.test(dependency)) {
        throw new Error(`runner source imports forbidden test content: ${locator} -> ${dependency}`);
      }
      locators.add(dependency);
      queue.push(dependency);
    }
  }
}

export async function buildRunnerRelease({
  packageRoot,
  outputDir,
  runnerContractMajor = 1,
  runnerContractMinor = 0,
} = {}) {
  const root = fs.realpathSync(packageRoot);
  await fs.promises.mkdir(outputDir, { recursive: true });
  const destination = fs.realpathSync(outputDir);
  const locators = new Set([
    "AGENTS.md",
    "CONSTITUTION.md",
    "package.json",
    "package-lock.json",
    ...filesUnder(root, "core", (locator) => /\.(?:mjs|json)$/.test(locator)),
    ...filesUnder(root, "scripts", (locator) => locator.endsWith(".mjs") && !locator.includes("/__tests__/")),
    ...filesUnder(root, "schemas", (locator) => locator.endsWith(".json")),
    ...filesUnder(root, "contracts", (locator) => /\.(?:json|contract)$/.test(locator) || locator.endsWith(".json")),
    ...filesUnder(root, "config", (locator) => /\.(?:ya?ml|json)$/.test(locator)),
    ...filesUnder(root, "metrics", (locator) => /\.(?:mjs|json)$/.test(locator)),
    ...filesUnder(root, "workflows", (locator) => locator.endsWith(".mjs")),
  ...filesUnder(root, "skills/wh-review", (locator) =>
      !/(?:^|\/)__tests__(?:\/|$)|\.test\.[^/]+$/.test(locator)
      && !locator.endsWith("/skill-bundle.json")),
  ]);
  addStaticDependencies(root, locators);
  const files = await Promise.all([...locators].sort().map((locator) => copy(root, destination, locator)));
  const packageVersion = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
  const release = {
    schema_version: 1,
    release: "workflowhub-runner",
    version: packageVersion,
    ...createRunnerContract({ major: runnerContractMajor, minor: runnerContractMinor }),
    files,
  };
  await fs.promises.writeFile(path.join(destination, "runner-release.json"), `${JSON.stringify(release, null, 2)}\n`, { flag: "wx" });
  return Object.freeze(release);
}

export function validateRunnerRelease({ releaseRoot, skillBundleManifest } = {}) {
  const root = fs.realpathSync(releaseRoot);
  const manifestPath = path.join(root, "runner-release.json");
  if (!fs.existsSync(manifestPath)) throw new Error("runner release manifest is missing");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const allowed = new Set(["schema_version", "release", "version", "runner_contract_major", "runner_contract_minor", "files"]);
  if (manifest.schema_version !== 1 || manifest.release !== "workflowhub-runner"
      || typeof manifest.version !== "string" || !Array.isArray(manifest.files)
      || Object.keys(manifest).some((key) => !allowed.has(key))) {
    throw new Error("runner release manifest schema is invalid");
  }
  createRunnerContract({ major: manifest.runner_contract_major, minor: manifest.runner_contract_minor });
  const seen = new Set();
  for (const entry of manifest.files) {
    if (!entry || typeof entry.path !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "")
        || Object.keys(entry).some((key) => !new Set(["path", "sha256"]).has(key))
        || path.isAbsolute(entry.path) || entry.path.split(/[\\/]/).includes("..") || seen.has(entry.path)) {
      throw new Error("runner release file manifest is invalid");
    }
    seen.add(entry.path);
    const source = path.join(root, entry.path);
    if (!fs.existsSync(source) || !fs.lstatSync(source).isFile() || fs.lstatSync(source).isSymbolicLink()) {
      throw new Error(`runner release file is missing or unsafe: ${entry.path}`);
    }
    if (sha256(fs.readFileSync(source)) !== entry.sha256) throw new Error(`runner release hash mismatch: ${entry.path}`);
  }
  if (!skillBundleManifest) throw new Error("skill bundle contract is required for runner installation");
  assertRunnerCompatibility(skillBundleManifest, manifest);
  return Object.freeze(manifest);
}

export function installRunnerRelease({ releaseRoot, skillBundleRoot, run = spawnSync } = {}) {
  const root = fs.realpathSync(releaseRoot);
  const bundleRoot = fs.realpathSync(skillBundleRoot);
  const skillBundleManifest = validateSkillBundleRelease({ releaseRoot: bundleRoot });
  const manifest = validateRunnerRelease({ releaseRoot: root, skillBundleManifest });
  for (const entry of skillBundleManifest.files) {
    const source = path.join(bundleRoot, entry.path);
    const target = path.join(root, entry.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (fs.existsSync(target) && sha256(fs.readFileSync(target)) !== entry.sha256) {
      throw new Error(`runner and Skill Bundle disagree on shared file: ${entry.path}`);
    }
    if (!fs.existsSync(target)) fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  }
  const result = run("npm", ["ci", "--ignore-scripts", "--omit=dev"], {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`runner clean install failed: ${result.error?.message ?? result.stderr ?? `exit ${result.status}`}`);
  }
  const schemaCheck = run("node", ["--input-type=module", "-e", [
    "import fs from 'node:fs';",
    "import Ajv2020 from 'ajv/dist/2020.js';",
    "const schema=JSON.parse(fs.readFileSync('schemas/runner-release.schema.json','utf8'));",
    "const value=JSON.parse(fs.readFileSync('runner-release.json','utf8'));",
    "if(!new Ajv2020({strict:false}).compile(schema)(value)) process.exit(1);",
  ].join("")], { cwd: root, encoding: "utf8", shell: false });
  if (schemaCheck.error || schemaCheck.status !== 0) throw new Error("installed runner release failed schema validation");
  fs.writeFileSync(path.join(root, ".gitignore"), "node_modules/\n", { flag: "wx" });
  const gitCommands = [
    ["init", "-q"],
    ["add", "-A"],
    ["-c", "user.name=WorkflowHub Release", "-c", "user.email=release@workflowhub.invalid",
      "commit", "-qm", "installed workflowhub runner"],
  ];
  for (const arguments_ of gitCommands) {
    const git = run("git", arguments_, { cwd: root, encoding: "utf8", shell: false });
    if (git.error || git.status !== 0) {
      throw new Error(`runner Git identity setup failed: ${git.error?.message ?? git.stderr ?? `exit ${git.status}`}`);
    }
  }
  return Object.freeze({ status: result.status, stdout: result.stdout, stderr: result.stderr, manifest });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [packageRoot, outputDir] = process.argv.slice(2);
  process.stdout.write(`${JSON.stringify(await buildRunnerRelease({ packageRoot, outputDir }), null, 2)}\n`);
}
