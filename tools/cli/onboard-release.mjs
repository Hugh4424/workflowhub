#!/usr/bin/env node
// C10 P2 onboarding entry. One action plan drives check, dry-run and apply:
// host skill links for Claude Code (.claude/skills) and Codex (.agents/skills)
// plus the single user configuration. It never installs a release, never runs
// npm or Git, and never invents a second configuration source.
import { existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, realpathSync, statSync, symlinkSync, unlinkSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HOSTS = Object.freeze([
  Object.freeze({ id: "claude-code", skills_dir: Object.freeze([".claude", "skills"]) }),
  Object.freeze({ id: "codex", skills_dir: Object.freeze([".agents", "skills"]) }),
]);

function fail(code, message, extra = {}) {
  return Object.assign(new Error(message), { code, ...extra });
}

// Resolve the runtime that belongs to this entry point: a release root keeps it
// under runner/, the source tree keeps it under runtime/. Static relative
// imports would point at the release root instead of runner/runtime.
const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const RELEASE_ROOT = resolve(SCRIPT_DIRECTORY, "..", "..");
const RUNTIME_BASE = existsSync(join(RELEASE_ROOT, "runner", "runtime"))
  ? join(RELEASE_ROOT, "runner", "runtime") : join(RELEASE_ROOT, "runtime");

async function loadRuntimeModule(relativePath, label) {
  const file = join(RUNTIME_BASE, relativePath);
  if (!existsSync(file)) throw fail("RUNTIME_UNAVAILABLE", `${label} is missing under the declared runtime root: ${file}`, { path: file });
  return import(pathToFileURL(file).href);
}

const [{ withLock }, configBootstrapModule, precheckModule, updateCheckModule] = await Promise.all([
  loadRuntimeModule("interface/record-lock.mjs", "record lock"),
  loadRuntimeModule("distribution/config-bootstrap.mjs", "configuration bootstrap"),
  loadRuntimeModule("distribution/precheck.mjs", "precheck"),
  loadRuntimeModule("distribution/update-check.mjs", "update check"),
]);
const { applyHostConfigBootstrap, inspectHostConfig, planHostConfigBootstrap } = configBootstrapModule;
const { precheckForActions } = precheckModule;
const { checkForUpdate, readPackageVersion } = updateCheckModule;

function absolute(value, label) {
  if (typeof value !== "string" || value.trim() === "" || !isAbsolute(value)) {
    throw fail("INVALID_ARGUMENTS", `${label} must be an explicit absolute path: ${String(value)}`);
  }
  return resolve(value);
}

function realDirectory(path, label) {
  let stat;
  try { stat = lstatSync(path); }
  catch (error) {
    if (error.code === "ENOENT") throw fail("LAYOUT_MISSING", `${label} does not exist: ${path}`, { path });
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw fail("LAYOUT_UNSAFE", `${label} must be a real directory: ${path}`, { path });
  return path;
}

function insideRealRoot(rootReal, candidate) {
  return candidate === rootReal || candidate.startsWith(`${rootReal}${sep}`);
}

function discoverSkills(skillsRoot) {
  const skills = [];
  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || !entry.isDirectory()) continue;
    if (!existsSync(join(skillsRoot, entry.name, "SKILL.md"))) continue;
    skills.push(entry.name);
  }
  return skills.sort();
}

/** Validate the declared release layout without writing anything. */
export function inspectPackageLayout(packageRoot) {
  const root = absolute(packageRoot, "package root");
  const problems = [];
  let skillsRoot = null;
  let skills = [];
  try {
    realDirectory(root, "package root");
    const realRoot = realpathSync(root);
    // The runner ancestor is part of the declared layout: a symlinked runner
    // must not point the host links at a different tree (e.g. the source repo).
    const runnerRoot = join(root, "runner");
    realDirectory(runnerRoot, "runner");
    const realRunner = realpathSync(runnerRoot);
    if (!insideRealRoot(realRoot, realRunner)) {
      throw fail("LAYOUT_OUTSIDE", `runner real path escapes the package root: ${realRunner}`, { path: realRunner });
    }
    skillsRoot = join(runnerRoot, "skills");
    realDirectory(skillsRoot, "runner/skills");
    const realSkills = realpathSync(skillsRoot);
    if (!insideRealRoot(realRoot, realSkills)) {
      throw fail("LAYOUT_OUTSIDE", `runner/skills real path escapes the package root: ${realSkills}`, { path: realSkills });
    }
    skills = discoverSkills(skillsRoot);
    if (skills.length === 0) {
      problems.push(Object.freeze({ code: "LAYOUT_SKILLS_EMPTY", path: skillsRoot,
        message: `runner/skills contains no skill directory with SKILL.md: ${skillsRoot}` }));
    }
  } catch (error) {
    if (!["LAYOUT_MISSING", "LAYOUT_UNSAFE", "LAYOUT_OUTSIDE"].includes(error.code)) throw error;
    problems.push(Object.freeze({ code: error.code, path: error.path ?? root, message: error.message }));
  }
  return Object.freeze({
    package_root: root,
    skills_root: skillsRoot,
    skills: Object.freeze(skills),
    ok: problems.length === 0,
    problems: Object.freeze(problems),
    next_action: problems.length === 0 ? null
      : `build or install the release so ${join(root, "runner", "skills")} exists with at least one <skill>/SKILL.md, then rerun`,
  });
}

function missingParents(directory, base) {
  const missing = [];
  let cursor = resolve(directory);
  const stop = resolve(base);
  while (cursor !== stop) {
    if (existsSync(cursor)) {
      const stat = lstatSync(cursor);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw fail("TARGET_UNSAFE", `target ancestor must be a real directory: ${cursor}`, { path: cursor });
      break;
    }
    missing.unshift(cursor);
    const parent = dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return missing;
}

/** Inspect one host skill-directory link against the package skills root. */
export function inspectSkillLink(link, skillsRoot) {
  const target = dirname(link);
  const content = relative(target, skillsRoot);
  if (content === "") throw fail("TARGET_UNSAFE", `skills root equals its own link path: ${link}`, { path: link });
  let stat;
  try { stat = lstatSync(link); }
  catch (error) {
    if (error.code === "ENOENT") return Object.freeze({ state: "create", link_content: content });
    throw error;
  }
  if (!stat.isSymbolicLink()) {
    return Object.freeze({ state: "conflict", link_content: content,
      reason: `${link} exists and is not a symlink; the user value is preserved` });
  }
  const existing = readlinkSync(link);
  const resolvedExisting = resolve(target, existing);
  if (resolvedExisting === resolve(skillsRoot)) return Object.freeze({ state: "noop", link_content: content, existing });
  // Only ENOENT is a genuinely broken link. ELOOP/EACCES/ENOTDIR/EIO mean the
  // target is unreachable, not absent: never delete or rebuild the user link.
  let targetState = "exists";
  try { statSync(resolvedExisting); }
  catch (error) { targetState = error.code ?? "UNKNOWN"; }
  if (targetState === "ENOENT") {
    return Object.freeze({ state: "replace-broken", link_content: content, existing, broken_target: resolvedExisting });
  }
  if (targetState === "exists") {
    return Object.freeze({ state: "conflict", link_content: content, existing,
      reason: `${link} already links to a different live target; the user value is preserved` });
  }
  return Object.freeze({ state: "conflict", link_content: content, existing,
    reason: `${link} target is not reachable (${targetState}); the user link is preserved` });
}

/**
 * Append the release version state to the existing onboarding result. The
 * installed fact comes from the package's runner root; the source version must
 * be explicit. Missing/unreadable sources are "cannot check", never "no update".
 */
export function inspectReleaseVersion({ packageRoot, sourceVersion, sourcePackage } = {}) {
  let installed = null;
  try { installed = readPackageVersion(join(packageRoot, "runner", "package.json")); }
  catch { installed = null; }
  const installedVersion = installed?.version ?? null;
  if (typeof sourcePackage === "string" && sourcePackage !== "") {
    let source;
    try { source = readPackageVersion(sourcePackage); }
    catch (error) {
      return Object.freeze({
        status: "unavailable", installed_version: installedVersion, source_version: null,
        source: `--source-package=${sourcePackage}`, reason: `source version is unreadable: ${error.message}`,
      });
    }
    return checkForUpdate({ installedVersion, sourceVersion: source.version, source: `--source-package=${sourcePackage}` });
  }
  return checkForUpdate({ installedVersion, sourceVersion, source: typeof sourceVersion === "string" && sourceVersion !== "" ? "--source-version" : null });
}

function scopeBase({ target, home }) {
  return target === undefined ? home : target;
}

/** Compute the single action plan shared by check, dry-run and apply. */
export function planOnboarding({ packageRoot, target, env = process.env, home, requestedStage = "build-code", requestedTrack = null, requestedReviewKind = null, probe = "static", sourceVersion, sourcePackage } = {}) {
  if (typeof home !== "string" || !isAbsolute(home)) throw new TypeError("home must be an absolute path");
  const layout = inspectPackageLayout(packageRoot);
  const scope = target === undefined ? "user" : "project";
  let base = home;
  const targetProblems = [];
  if (target !== undefined) {
    try { base = realDirectory(absolute(target, "project target"), "project target"); }
    catch (error) {
      if (error.code !== "LAYOUT_MISSING" && error.code !== "LAYOUT_UNSAFE") throw error;
      targetProblems.push(Object.freeze({ code: error.code, path: error.path ?? target, message: error.message }));
    }
  }
  const baseValid = targetProblems.length === 0;
  const actions = [];
  for (const host of HOSTS) {
    const link = join(base, ...host.skills_dir);
    let inspection;
    let parents = [];
    try {
      inspection = inspectSkillLink(link, layout.skills_root ?? join(layout.package_root, "runner", "skills"));
      if (baseValid && inspection.state !== "noop" && inspection.state !== "conflict") parents = missingParents(dirname(link), base);
    } catch (error) {
      inspection = { state: "conflict", reason: error.message, link_content: null };
    }
    actions.push(Object.freeze({
      kind: "skill-link", host: host.id, scope, path: link,
      target: layout.skills_root, state: inspection.state,
      link_content: inspection.link_content ?? null,
      create_parents: Object.freeze(parents),
      ...(inspection.existing === undefined ? {} : { existing: inspection.existing }),
      ...(inspection.broken_target === undefined ? {} : { broken_target: inspection.broken_target }),
      ...(inspection.reason === undefined ? {} : { reason: inspection.reason }),
    }));
  }
  const inspection = inspectHostConfig({ env, home });
  const configPlan = planHostConfigBootstrap(inspection);
  const configAction = Object.freeze({
    kind: "config", path: inspection.path, source: inspection.source,
    state: configPlan.action === "merge" ? "merge" : configPlan.action, next_action: configPlan.next_action,
    problems: Object.freeze([...(inspection.problems ?? []), ...(inspection.route_problems ?? [])]),
  });
  const precheck = precheckForActions(["onboard"], { env, home, requestedStage, requestedTrack, requestedReviewKind, probe });
  const tools = precheckForActions(["tools"], { env, home, requestedStage, requestedTrack, requestedReviewKind, probe });
  // Named review inputs (OCR/provider/route) are informational for onboarding;
  // they never block the host links or the user configuration action.
  const reviewReadiness = precheckForActions(["review-full"], { env, home, requestedStage, requestedTrack, requestedReviewKind, probe });
  return Object.freeze({
    scope,
    base,
    package_root: layout.package_root,
    skills_root: layout.skills_root,
    skills: layout.skills,
    layout,
    target_problems: Object.freeze(targetProblems),
    config_inspection: inspection,
    config_plan: configPlan,
    config: configAction,
    actions: Object.freeze(actions),
    version: inspectReleaseVersion({ packageRoot: layout.package_root, sourceVersion, sourcePackage }),
    required: precheck,
    tools,
    review_readiness: reviewReadiness,
  });
}

function plannedState(action, { scope = "user", writeConfig = false } = {}) {
  if (action.kind === "config") {
    if (action.state === "blocked") return "blocked";
    if (scope === "project") return "report-only";
    if (action.state === "merge") return writeConfig ? "would-merge" : "skipped";
    return "noop";
  }
  if (action.state === "create") return "would-create";
  if (action.state === "replace-broken") return "would-replace-broken";
  if (action.state === "merge") return "would-merge";
  return action.state;
}

function shellQuote(value) {
  return `'${String(value).split("'").join("'\\''")}'`;
}

// next_action is copied and executed verbatim: it contains only the command.
// The reason stays in error.message / reason so the two never mix.
function configWriteNextAction({ packageRoot, writeConfig }) {
  return `node tools/cli/onboard-release.mjs --apply${writeConfig ? " --write-config" : ""} --package-root=${shellQuote(packageRoot)}`;
}

function skippedConfigNextAction({ packageRoot }) {
  return `node tools/cli/onboard-release.mjs --apply --write-config --package-root=${shellQuote(packageRoot)}`;
}

function realpathOfExistingPrefix(path) {
  let current = resolve(path);
  const tail = [];
  while (!existsSync(current)) {
    tail.unshift(basename(current));
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  const real = existsSync(current) ? realpathSync(current) : current;
  return tail.length ? join(real, ...tail) : real;
}

function assertWithinBase(directory, base) {
  // Lexical containment plus an explicit no-symlink walk: temp/system aliases
  // such as /var -> /private/var keep the authorized base identity.
  const realBase = resolve(base);
  const realDirectory0 = resolve(directory);
  const scopeRelative = relative(realBase, realDirectory0);
  if (scopeRelative.startsWith("..") || isAbsolute(scopeRelative)) {
    throw fail("TARGET_OUTSIDE_BASE", `refusing to write outside the authorized target ${realBase}: ${realDirectory0}`, { path: realDirectory0 });
  }
  const realBaseResolved = realpathSync(realBase);
  const realDirectory = realpathOfExistingPrefix(realDirectory0);
  const realRelative = relative(realBaseResolved, realDirectory);
  if (realRelative.startsWith("..") || isAbsolute(realRelative)) {
    throw fail("TARGET_OUTSIDE_BASE", `refusing to write outside the authorized real target ${realBaseResolved}: ${realDirectory}`, { path: realDirectory });
  }
  let cursor = realBase;
  for (const part of scopeRelative.split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    const stat = lstatSync(cursor, { throwIfNoEntry: false });
    if (!stat) break;
    if (stat.isSymbolicLink()) throw fail("TARGET_OUTSIDE_BASE", `refusing to follow a symlinked host directory: ${cursor}`, { path: cursor });
    if (!stat.isDirectory()) throw fail("TARGET_UNSAFE", `host directory component is not a directory: ${cursor}`, { path: cursor });
  }
}

export function replaceBrokenSymlink(path, expectedContent) {
  const stat = lstatSync(path, { throwIfNoEntry: false });
  if (!stat || !stat.isSymbolicLink()) throw fail("SYMLINK_REPLACED", `refusing to remove ${path}: it is no longer a symlink`, { path });
  const actual = readlinkSync(path);
  if (expectedContent !== undefined && actual !== expectedContent) {
    throw fail("SYMLINK_REPLACED", `refusing to remove ${path}: its link target changed`, { path });
  }
  // Re-check the target immediately before unlink: only a still-missing target
  // (ENOENT) is removable. A restored target or inaccessible target stops us.
  try { statSync(path); }
  catch (error) {
    if (error.code !== "ENOENT") throw fail("SYMLINK_REPLACED", `refusing to remove ${path}: target is not reachable (${error.code ?? "UNKNOWN"})`, { path });
  }
  if (existsSync(path)) throw fail("SYMLINK_REPLACED", `refusing to remove ${path}: target is reachable again`, { path });
  unlinkSync(path);
}

export async function applySkillLink(action, { skillsRoot, base } = {}) {
  if (typeof base !== "string" || !isAbsolute(base)) throw fail("INVALID_ARGUMENTS", "applySkillLink requires the authorized base directory");
  if (action.state === "conflict") return { ...action, status: "conflict" };
  if (action.state === "noop") return { ...action, status: "noop" };
  try {
    assertWithinBase(dirname(action.path), base);
    for (const directory of action.create_parents) {
      mkdirSync(directory, { mode: 0o755 });
      const stat = lstatSync(directory, { throwIfNoEntry: false });
      if (!stat || !stat.isDirectory() || stat.isSymbolicLink()) {
        throw fail("TARGET_OUTSIDE_BASE", `refusing to use a replaced host directory: ${directory}`, { path: directory });
      }
    }
    const directory = dirname(action.path);
    mkdirSync(directory, { recursive: true });
    return await withLock(directory, "onboard-skill-link", async () => {
      assertWithinBase(directory, base);
      const current = inspectSkillLink(action.path, skillsRoot);
      if (current.state === "noop") return { ...action, status: "noop" };
      if (current.state === "conflict") return { ...action, status: "conflict", reason: current.reason };
      if (current.state === "replace-broken") replaceBrokenSymlink(action.path, current.existing);
      symlinkSync(current.link_content, action.path);
      return { ...action, status: "created", link_content: current.link_content };
    });
  } catch (error) {
    return { ...action, status: "failed",
      error: { code: error.code ?? "APPLY_FAILED", message: String(error.message ?? error), path: error.path ?? action.path } };
  }
}

async function applyConfig(configPlan) {
  const result = await applyHostConfigBootstrap(configPlan);
  if (result.status === "applied") return { status: "applied", path: result.path, backup_path: result.backup_path, added: result.added };
  if (result.status === "noop") return { status: "noop", path: result.path };
  if (result.status === "conflict") return { status: "conflict", path: result.path, preserved: true, reason: result.reason,
    next_action: `re-read ${result.path} and rerun the command after resolving the concurrent change` };
  return { status: "blocked", path: result.path, problems: result.problems, next_action: result.next_action };
}

function summarize(results) {
  const counts = {};
  for (const item of results) counts[item.status] = (counts[item.status] ?? 0) + 1;
  return Object.freeze(counts);
}

function blockingResults(results) {
  return results.filter((item) => ["conflict", "failed", "blocked"].includes(item.status));
}

function resultEnvelope(plan, mode, results, extra = {}) {
  const blocking = blockingResults(results);
  return Object.freeze({
    mode,
    scope: plan.scope,
    base: plan.base,
    package_root: plan.package_root,
    skills_root: plan.skills_root,
    skills: plan.skills,
    config: results.find((item) => item.kind === "config") ?? plan.config,
    actions: Object.freeze(results.filter((item) => item.kind !== "config")),
    version: plan.version,
    required: plan.required,
    tools: plan.tools,
    review_readiness: plan.review_readiness,
    ...extra,
    summary: summarize(results),
    blocking: Object.freeze(blocking),
    exit_code: blocking.length === 0 && plan.required.status === "ready" ? 0 : 1,
  });
}

/** Execute the plan. check/dry-run never write; apply only touches named targets. */
export async function onboardRelease({ mode, packageRoot, target, env = process.env, home, writeConfig = false, sourceVersion, sourcePackage } = {}) {
  if (!["check", "dry-run", "apply"].includes(mode)) throw fail("INVALID_ARGUMENTS", "exactly one of --check, --dry-run or --apply is required");
  if (sourceVersion !== undefined && sourcePackage !== undefined) throw fail("INVALID_ARGUMENTS", "use either --source-version or --source-package, not both");
  const plan = planOnboarding({ packageRoot, target, env, home, probe: "static", sourceVersion, sourcePackage });
  const layoutProblems = [...plan.layout.problems, ...plan.target_problems];
  if (layoutProblems.length) {
    return Object.freeze({
      mode, scope: plan.scope, base: plan.base, package_root: plan.package_root, skills_root: plan.skills_root,
      skills: plan.skills, config: plan.config, actions: Object.freeze([]), version: plan.version,
      required: plan.required, tools: plan.tools,
      review_readiness: plan.review_readiness,
      problems: Object.freeze(layoutProblems), next_action: plan.layout.next_action ?? null,
      summary: Object.freeze({}), blocking: Object.freeze(layoutProblems), exit_code: 1,
    });
  }
  const configReady = plan.config_inspection.state === "present" && (plan.config_inspection.route_problems ?? []).length === 0;
  if (mode !== "apply") {
    const results = [
      ...plan.actions.map((action) => Object.freeze({ ...action, status: plannedState(action, { scope: plan.scope, writeConfig }) })),
      Object.freeze({ ...plan.config, status: plannedState(plan.config, { scope: plan.scope, writeConfig }),
        ...(plannedState(plan.config, { scope: plan.scope, writeConfig }) === "skipped"
          ? { next_action: skippedConfigNextAction({ packageRoot: plan.package_root }),
            reason: `merging the non-sensitive structure of ${plan.config.path} is opt-in with --write-config` } : {}) }),
    ];
    return resultEnvelope(plan, mode, results);
  }
  const results = [];
  const nodeMissing = plan.required.checks.find((item) => item.id === "node" && item.status === "missing");
  for (const action of plan.actions) {
    // Host links are a dependent action: an unusable required configuration
    // stops them instead of writing links the host cannot load.
    if (nodeMissing || !configReady) { results.push(Object.freeze({ ...action, status: "blocked" })); continue; }
    try {
      results.push(Object.freeze(await applySkillLink(action, { skillsRoot: plan.skills_root, base: plan.base })));
    } catch (error) {
      results.push(Object.freeze({ ...action, status: "failed", error: Object.freeze({ code: error.code ?? "APPLY_FAILED", message: String(error.message ?? error), path: error.path ?? action.path }),
        next_action: `restore write access to ${dirname(action.path)} and rerun the command` }));
    }
  }
  try {
    let configResult;
    if (nodeMissing) {
      configResult = { status: "blocked", path: plan.config.path, next_action: plan.required.checks.find((item) => item.id === "node")?.next_action ?? null };
    } else if (!configReady) {
      configResult = { status: "blocked", path: plan.config.path, problems: plan.config.problems, next_action: plan.config.next_action };
    } else if (plan.scope === "project") {
      configResult = { status: "report-only", path: plan.config.path,
        next_action: plan.scope === "project" ? "the global configuration is reported only in project scope; run the user-scope command to repair it" : null };
    } else if (plan.config_plan.action === "merge" && !writeConfig) {
      configResult = { status: "skipped", path: plan.config.path, next_action: skippedConfigNextAction({ packageRoot: plan.package_root }),
            reason: `merging the non-sensitive structure of ${plan.config.path} is opt-in with --write-config` };
    } else {
      configResult = await applyConfig(plan.config_plan);
    }
    results.push(Object.freeze({ kind: "config", ...configResult }));
  } catch (error) {
    results.push(Object.freeze({ kind: "config", path: plan.config.path, status: "failed",
      error: Object.freeze({ code: error.code ?? "CONFIG_APPLY_FAILED", message: String(error.message ?? error), path: plan.config.path,
        ...(error.path === undefined || error.path === plan.config.path ? {} : { cause_path: error.path }) }),
      next_action: configWriteNextAction({ packageRoot: plan.package_root, writeConfig }) }));
  }
  return resultEnvelope(plan, mode, results);
}

function parseArguments(argv) {
  const values = {};
  let mode = null;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") return { help: true, values, mode };
    if (token === "--write-config") { values.writeConfig = true; continue; }
    if (["--check", "--dry-run", "--apply"].includes(token)) {
      if (mode !== null) throw fail("INVALID_ARGUMENTS", "exactly one of --check, --dry-run or --apply is allowed");
      mode = token.slice(2);
      continue;
    }
    if (!token.startsWith("--")) throw fail("INVALID_ARGUMENTS", `unknown argument: ${token}`);
    const separator = token.indexOf("=");
    const name = separator < 0 ? token.slice(2) : token.slice(2, separator);
    if (!["package-root", "target", "source-version", "source-package"].includes(name)) throw fail("INVALID_ARGUMENTS", `unknown option: --${name}`);
    const value = separator < 0 ? argv[(index += 1)] : token.slice(separator + 1);
    if (value === undefined || value === "") throw fail("INVALID_ARGUMENTS", `--${name} requires a value`);
    if (Object.hasOwn(values, name)) throw fail("INVALID_ARGUMENTS", `--${name} may be given once`);
    values[name] = value;
  }
  if (mode === null) throw fail("INVALID_ARGUMENTS", "exactly one of --check, --dry-run or --apply is required");
  if (!Object.hasOwn(values, "package-root")) throw fail("INVALID_ARGUMENTS", "--package-root is required");
  if (Object.hasOwn(values, "source-version") && Object.hasOwn(values, "source-package")) {
    throw fail("INVALID_ARGUMENTS", "use either --source-version or --source-package, not both");
  }
  return { help: false, values, mode };
}

export async function onboardReleaseCliMain(argv = process.argv.slice(2), { env = process.env, home } = {}) {
  const parsed = parseArguments(argv);
  if (parsed.help) {
    return Object.freeze({
      usage: "node tools/cli/onboard-release.mjs --check|--dry-run|--apply --package-root=<absolute> [--target=<absolute project>] [--write-config] [--source-version=<semver> | --source-package=<absolute>]",
      notes: [
        "user-level default targets: <home>/.claude/skills and <home>/.agents/skills",
        "project-level targets require an explicit --target and only write inside it",
        "the bare wh-review scripts still default to <home>/.config/workflowhub/config.json; custom XDG_CONFIG_HOME is used by WorkflowHub callers",
        "the non-sensitive configuration merge is opt-in with --write-config; it is never applied in project scope",
        "this command never installs a release, never runs npm or Git, and never executes tool version probes",
        "the version state is reported only for the installed runner package and one explicit source version; without a source it reports cannot check",
      ],
    });
  }
  return onboardRelease({ mode: parsed.mode, packageRoot: parsed.values["package-root"], target: parsed.values.target, env, home,
    writeConfig: parsed.values.writeConfig === true, sourceVersion: parsed.values["source-version"], sourcePackage: parsed.values["source-package"] });
}

// Resolve symbolic-link invocations to the real file before deciding whether
// this module is the process entry point; otherwise a /tmp alias silently
// exits 0 without running the CLI.
function isDirectInvocation() {
  if (process.argv[1] === undefined) return false;
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}

if (isDirectInvocation()) {
  onboardReleaseCliMain(process.argv.slice(2), { env: process.env, home: process.env.HOME })
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exitCode = result.exit_code;
    })
    .catch((error) => {
      process.stderr.write(`${JSON.stringify({ code: error.code ?? "ONBOARD_FAILED", message: error.message, ...(error.path ? { path: error.path } : {}) })}\n`);
      process.exitCode = 1;
    });
}
