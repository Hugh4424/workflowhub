import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, realpathSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { createTrackedTempDir } from "../../runtime/interface/temp-dir.mjs";
import { workflowHubConfigPath } from "../../runtime/evidence/storage-root.mjs";
import { applySkillLink, inspectSkillLink, replaceBrokenSymlink } from "../../tools/cli/onboard-release.mjs";

const CLI = fileURLToPath(new URL("../../tools/cli/onboard-release.mjs", import.meta.url));
const dirs = [];
afterEach(() => { for (const dir of dirs.splice(0).reverse()) dir.dispose(); });

function executable(path, body) {
  writeFileSync(path, `#!/bin/sh\n${body}\nexit 0\n`, { mode: 0o700 });
  return path;
}

function snapshot(root) {
  const entries = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const path = join(directory, entry.name);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) entries.push({ path, kind: "link", content: readlinkSync(path) });
      else if (stat.isDirectory()) { entries.push({ path, kind: "dir", mode: stat.mode & 0o777 }); walk(path); }
      else entries.push({ path, kind: "file", bytes: readFileSync(path).toString("base64"), mode: stat.mode & 0o777 });
    }
  };
  walk(root);
  return entries;
}

function fixture({ withLayout = true } = {}) {
  const dir = createTrackedTempDir("wh-c10-onboard-");
  dirs.push(dir);
  const root = dir.path;
  const home = join(root, "home");
  const xdg = join(root, "xdg");
  const bin = join(root, "bin");
  const project = join(root, "project");
  for (const path of [home, xdg, bin, project]) mkdirSync(path);
  const packageRoot = join(root, "package");
  const skillsRoot = join(packageRoot, "runner", "skills");
  if (withLayout) {
    for (const skill of ["build-code", "wh-review"]) {
      mkdirSync(join(skillsRoot, skill), { recursive: true });
      writeFileSync(join(skillsRoot, skill, "SKILL.md"), `---\nname: ${skill}\n---\n`);
    }
  } else mkdirSync(packageRoot);
  const env = { HOME: home, XDG_CONFIG_HOME: xdg, PATH: bin, ANYSEARCH_API_KEY: "", EGO_BROWSER_BIN: "" };
  const configPath = workflowHubConfigPath({ env: { HOME: home, XDG_CONFIG_HOME: xdg }, home });
  mkdirSync(join(configPath, ".."), { recursive: true });
  const configBytes = Buffer.from(`${JSON.stringify({
    task_dir: join(root, "tasks"),
    third_review: { command: [process.execPath], config: join(root, "providers.json"), attachment_root: join(root, "packets") },
    wh_review: { version: 2, stages: { "build-code": { initial: ["codex/luna"], mode: "full_only" } }, non_stage: {} },
  }, null, 2)}\n`);
  writeFileSync(configPath, configBytes);
  const run = (...args) => {
    const result = spawnSync(process.execPath, [CLI, ...args], {
      env: { ...process.env, ...env }, encoding: "utf8", timeout: 60000,
    });
    let json = null;
    try { json = JSON.parse(result.stdout); } catch { /* the exit/status assertion reports malformed output */ }
    return { code: result.status, signal: result.signal, stdout: result.stdout, stderr: result.stderr, json };
  };
  return { dir, root, home, xdg, bin, project, packageRoot, skillsRoot, configPath, configBytes, env, run, executable };
}

function action(result, host) {
  return result.json.actions.find((item) => item.host === host);
}

describe("C10 P2 onboarding CLI black box", () => {
  it("checks a clean isolated target without writing any user byte", () => {
    const f = fixture();
    const before = { home: snapshot(f.home), project: snapshot(f.project) };
    const result = f.run("--check", `--package-root=${f.packageRoot}`);
    expect(result.code).toBe(0);
    expect(result.json.mode).toBe("check");
    expect(result.json.scope).toBe("user");
    expect(action(result, "claude-code")).toMatchObject({ status: "would-create", path: join(f.home, ".claude", "skills") });
    expect(action(result, "codex")).toMatchObject({ status: "would-create", path: join(f.home, ".agents", "skills") });
    expect(result.json.config).toMatchObject({ status: "noop", path: f.configPath });
    expect(snapshot(f.home)).toEqual(before.home);
    expect(snapshot(f.project)).toEqual(before.project);
    expect(readFileSync(f.configPath).equals(f.configBytes)).toBe(true);
  });

  it("dry-runs with the same plan and still writes nothing", () => {
    const f = fixture();
    const before = snapshot(f.home);
    const result = f.run("--dry-run", `--package-root=${f.packageRoot}`);
    expect(result.code).toBe(0);
    expect(result.json.mode).toBe("dry-run");
    expect(action(result, "claude-code").status).toBe("would-create");
    expect(action(result, "codex").status).toBe("would-create");
    expect(snapshot(f.home)).toEqual(before);
    expect(existsSync(join(f.home, ".claude"))).toBe(false);
    expect(existsSync(join(f.home, ".agents"))).toBe(false);
    expect(readFileSync(f.configPath).equals(f.configBytes)).toBe(true);
  });

  it("applies only the two named host links, then reports no-op on the second apply", () => {
    const f = fixture();
    const first = f.run("--apply", `--package-root=${f.packageRoot}`);
    expect(first.code).toBe(0);
    expect(first.json.summary.created).toBe(2);
    const claude = join(f.home, ".claude", "skills");
    const codex = join(f.home, ".agents", "skills");
    expect(realpathSync(claude)).toBe(realpathSync(f.skillsRoot));
    expect(realpathSync(codex)).toBe(realpathSync(f.skillsRoot));
    expect(lstatSync(claude).isSymbolicLink()).toBe(true);
    expect(lstatSync(codex).isSymbolicLink()).toBe(true);
    expect(readlinkSync(claude)).toBe(relative(join(f.home, ".claude"), f.skillsRoot));
    expect(readFileSync(f.configPath).equals(f.configBytes)).toBe(true);
    expect(snapshot(f.home).map((entry) => entry.path)).toEqual([
      join(f.home, ".agents"),
      join(f.home, ".agents", "skills"),
      join(f.home, ".claude"),
      join(f.home, ".claude", "skills"),
    ]);
    // The onboarding entry never runs the release installer or Git.
    for (const path of [f.packageRoot, f.home, f.project]) expect(existsSync(join(path, ".git"))).toBe(false);
    expect(existsSync(join(f.packageRoot, "runner", "node_modules"))).toBe(false);

    const before = { home: snapshot(f.home), ino: lstatSync(claude).ino };
    const second = f.run("--apply", `--package-root=${f.packageRoot}`);
    expect(second.code).toBe(0);
    expect(second.json.summary.noop).toBe(3);
    expect(action(second, "claude-code").status).toBe("noop");
    expect(action(second, "codex").status).toBe("noop");
    expect(second.json.config.status).toBe("noop");
    expect(lstatSync(claude).ino).toBe(before.ino);
    expect(snapshot(f.home)).toEqual(before.home);

    unlinkSync(codex);
    const recreated = f.run("--apply", `--package-root=${f.packageRoot}`);
    expect(recreated.code).toBe(0);
    expect(action(recreated, "codex").status).toBe("created");
    expect(action(recreated, "claude-code").status).toBe("noop");
    expect(realpathSync(codex)).toBe(realpathSync(f.skillsRoot));
    const settled = f.run("--apply", `--package-root=${f.packageRoot}`);
    expect(settled.json.summary.noop).toBe(3);
  });

  it("reports named review inputs on check without blocking the host links", () => {
    const f = fixture();
    const result = f.run("--check", `--package-root=${f.packageRoot}`);
    expect(result.code).toBe(0);
    const missingIds = result.json.review_readiness.missing.map((item) => item.id);
    expect(missingIds).toContain("provider");
    const provider = result.json.review_readiness.missing.find((item) => item.id === "provider");
    expect(provider).toMatchObject({ code: "PROVIDER_CONFIG_NOT_FOUND", path: join(f.root, "providers.json") });
    expect(provider.next_action).toContain("3rd-review");
    expect(action(result, "claude-code").status).toBe("would-create");
  });

  it("preserves a same-name user directory and still applies the independent host link", () => {
    const f = fixture();
    const claude = join(f.home, ".claude", "skills");
    mkdirSync(claude, { recursive: true });
    const userFile = join(claude, "user-notes.md");
    writeFileSync(userFile, "user data\n");
    const result = f.run("--apply", `--package-root=${f.packageRoot}`);
    expect(result.code).toBe(1);
    expect(action(result, "claude-code")).toMatchObject({ status: "conflict", path: claude });
    expect(action(result, "codex")).toMatchObject({ status: "created" });
    expect(readFileSync(userFile, "utf8")).toBe("user data\n");
    expect(lstatSync(claude).isDirectory()).toBe(true);
    expect(result.json.blocking).toHaveLength(1);
  });

  it("replaces a broken host symlink and treats a live foreign link as a conflict", () => {
    const f = fixture();
    const broken = join(f.home, ".agents", "skills");
    mkdirSync(join(f.home, ".agents"));
    symlinkSync(join(f.root, "gone-package", "runner", "skills"), broken);
    const foreignTarget = join(f.root, "other-skills");
    mkdirSync(foreignTarget);
    const claude = join(f.home, ".claude", "skills");
    mkdirSync(join(f.home, ".claude"));
    symlinkSync(foreignTarget, claude);
    const result = f.run("--apply", `--package-root=${f.packageRoot}`);
    expect(result.code).toBe(1);
    expect(action(result, "codex").status).toBe("created");
    expect(realpathSync(broken)).toBe(realpathSync(f.skillsRoot));
    expect(action(result, "claude-code").status).toBe("conflict");
    expect(realpathSync(claude)).toBe(realpathSync(foreignTarget));
  });

  it("keeps project-level writes inside the explicit target and leaves the user scope untouched", () => {
    const f = fixture();
    const before = snapshot(f.home);
    const result = f.run("--apply", `--package-root=${f.packageRoot}`, `--target=${f.project}`);
    expect(result.code).toBe(0);
    expect(result.json.scope).toBe("project");
    expect(realpathSync(join(f.project, ".claude", "skills"))).toBe(realpathSync(f.skillsRoot));
    expect(realpathSync(join(f.project, ".agents", "skills"))).toBe(realpathSync(f.skillsRoot));
    expect(snapshot(f.home)).toEqual(before);
    expect(existsSync(join(f.project, ".git"))).toBe(false);
  });

  it("rejects a package whose runner ancestor links into the source tree", () => {
    const f = fixture();
    const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
    rmSync(join(f.packageRoot, "runner"), { recursive: true, force: true });
    symlinkSync(repoRoot, join(f.packageRoot, "runner"));
    const result = f.run("--apply", `--package-root=${f.packageRoot}`);
    expect(result.code).toBe(1);
    expect(result.json.problems.map((item) => item.code)).toContain("LAYOUT_UNSAFE");
    expect(existsSync(join(f.home, ".claude"))).toBe(false);
    expect(existsSync(join(f.home, ".agents"))).toBe(false);
  });

  it("names a missing release layout and writes nothing", () => {
    const f = fixture({ withLayout: false });
    const before = snapshot(f.home);
    const result = f.run("--check", `--package-root=${f.packageRoot}`);
    expect(result.code).toBe(1);
    expect(result.json.problems[0].code).toBe("LAYOUT_MISSING");
    expect(result.json.next_action).toMatch(/runner\/skills/);
    expect(snapshot(f.home)).toEqual(before);
  });

  it.skipIf(typeof process.getuid === "function" && process.getuid() === 0)("reports a permission failure per item and continues the independent host link", () => {
    const f = fixture();
    const claudeDir = join(f.home, ".claude");
    mkdirSync(claudeDir);
    chmodSync(claudeDir, 0o555);
    try {
      const result = f.run("--apply", `--package-root=${f.packageRoot}`);
      expect(result.code).toBe(1);
      const failed = action(result, "claude-code");
      expect(failed.status).toBe("failed");
      expect(failed.error.path).toContain(".claude");
      expect(String(failed.error.message)).not.toBe("");
      expect(action(result, "codex")).toMatchObject({ status: "created" });
      expect(existsSync(join(f.home, ".claude", "skills"))).toBe(false);
    } finally {
      chmodSync(claudeDir, 0o755);
    }
  });

  it("never executes external tools during check, dry-run or apply", () => {
    const f = fixture();
    const marker = join(f.root, "spawned.txt");
    for (const name of ["npm", "git", "ocr", "ego-browser"]) {
      f.executable(join(f.bin, name), `echo "${name} $@" >> '${marker}'`);
    }
    for (const mode of ["--check", "--dry-run", "--apply"]) {
      const result = f.run(mode, `--package-root=${f.packageRoot}`);
      expect(result.code).toBe(0);
    }
    expect(existsSync(marker)).toBe(false);
    expect(existsSync(join(f.packageRoot, "runner", ".git"))).toBe(false);
  });

  it("reports the global configuration without writing it in project scope", () => {
    const f = fixture();
    const mergeable = `${JSON.stringify({
      task_dir: join(f.root, "tasks"),
      third_review: { command: [process.execPath], config: join(f.root, "providers.json"), attachment_root: join(f.root, "packets") },
      wh_review: { version: 2, stages: {} },
    }, null, 2)}\n`;
    writeFileSync(f.configPath, mergeable);
    const result = f.run("--apply", `--package-root=${f.packageRoot}`, `--target=${f.project}`);
    expect(result.json.config).toMatchObject({ status: "report-only", path: f.configPath });
    expect(readFileSync(f.configPath, "utf8")).toBe(mergeable);
    expect(readdirSync(join(f.configPath, "..")).some((name) => name.includes(".bak-"))).toBe(false);
    expect(realpathSync(join(f.project, ".claude", "skills"))).toBe(realpathSync(f.skillsRoot));
  });

  it("does not create host links when the required configuration is not usable", () => {
    const f = fixture();
    writeFileSync(f.configPath, "{ not json\n");
    const result = f.run("--apply", `--package-root=${f.packageRoot}`);
    expect(result.code).toBe(1);
    expect(existsSync(join(f.home, ".claude"))).toBe(false);
    expect(existsSync(join(f.home, ".agents"))).toBe(false);
    expect(result.json.actions.every((item) => item.status === "blocked")).toBe(true);
    expect(result.json.config.status).toBe("blocked");
  });

  it("keeps a mergeable configuration opt-in and verifies the write explicitly", () => {
    const f = fixture();
    const mergeable = `${JSON.stringify({
      task_dir: join(f.root, "tasks"),
      third_review: { command: [process.execPath], config: join(f.root, "providers.json"), attachment_root: join(f.root, "packets") },
      wh_review: { version: 2, stages: {} },
    }, null, 2)}\n`;
    writeFileSync(f.configPath, mergeable);
    const skipped = f.run("--apply", `--package-root=${f.packageRoot}`);
    expect(skipped.code).toBe(0);
    expect(skipped.json.config).toMatchObject({ status: "skipped" });
    expect(String(skipped.json.config.next_action)).toContain("--write-config");
    expect(readFileSync(f.configPath, "utf8")).toBe(mergeable);
    const written = f.run("--apply", "--write-config", `--package-root=${f.packageRoot}`);
    expect(written.code).toBe(0);
    expect(written.json.config).toMatchObject({ status: "applied" });
    expect(written.json.config.backup_path).toMatch(/\.bak-/);
    expect(JSON.parse(readFileSync(f.configPath, "utf8")).wh_review).toEqual({ version: 2, stages: {}, non_stage: {} });
  });

  it.skipIf(typeof process.getuid === "function" && process.getuid() === 0)("reports a configuration write failure with a recovery step", () => {
    const f = fixture();
    const mergeable = `${JSON.stringify({
      task_dir: join(f.root, "tasks"),
      third_review: { command: [process.execPath], config: join(f.root, "providers.json"), attachment_root: join(f.root, "packets") },
      wh_review: { version: 2, stages: {} },
    }, null, 2)}\n`;
    writeFileSync(f.configPath, mergeable);
    const configDir = join(f.configPath, "..");
    chmodSync(configDir, 0o555);
    try {
      const result = f.run("--apply", "--write-config", `--package-root=${f.packageRoot}`);
      expect(result.code).toBe(1);
      expect(result.json.config.status).toBe("failed");
      expect(result.json.config.error.path).toContain("config.json");
      expect(String(result.json.config.error.message)).not.toBe("");
      expect(result.json.config.error.path).toBe(f.configPath);
      expect(String(result.json.config.next_action)).toContain("--write-config");
      expect(String(result.json.config.next_action)).not.toContain("original error");
      expect(readFileSync(f.configPath, "utf8")).toBe(mergeable);
    } finally {
      chmodSync(configDir, 0o755);
    }
  });

  // Known gap: this copies the source tree into runner/ instead of using the
  // real buildRunnerRelease output; P4/P6 must replay the real release tree.
  it("loads the runtime from the release layout and fails when a required module is missing", () => {
    const f = fixture();
    const releaseRoot = join(f.root, "release");
    mkdirSync(join(releaseRoot, "tools", "cli"), { recursive: true });
    copyFileSync(CLI, join(releaseRoot, "tools", "cli", "onboard-release.mjs"));
    // Build the real layout shape: runner/runtime + runner/skills.
    cpSync(fileURLToPath(new URL("../..", import.meta.url)) + "/runtime", join(releaseRoot, "runner", "runtime"), { recursive: true });
    cpSync(fileURLToPath(new URL("../..", import.meta.url)) + "/skills", join(releaseRoot, "runner", "skills"), { recursive: true });
    const entry = join(releaseRoot, "tools", "cli", "onboard-release.mjs");
    const run = () => spawnSync(process.execPath, [entry, "--check", `--package-root=${f.packageRoot}`], {
      env: { ...process.env, ...f.env }, encoding: "utf8", cwd: releaseRoot, timeout: 120000,
    });
    const positive = run();
    expect(positive.status, positive.stderr).toBe(0);
    expect(JSON.parse(positive.stdout).package_root).toBe(f.packageRoot);
    rmSync(join(releaseRoot, "runner", "runtime", "distribution", "precheck.mjs"));
    const negative = run();
    expect(negative.status).toBe(1);
    expect(`${negative.stdout}${negative.stderr}`).toContain("RUNTIME_UNAVAILABLE");
  });

  it("refuses to follow a host directory replaced by an outside symlink", async () => {
    const f = fixture();
    const outside = join(f.root, "outside");
    mkdirSync(outside);
    mkdirSync(join(f.project, ".claude"));
    rmSync(join(f.project, ".claude"), { recursive: true });
    symlinkSync(outside, join(f.project, ".claude"));
    const legacy = join(f.project, ".claude", "skills");
    const action = { kind: "skill-link", host: "claude-code", scope: "project", path: legacy, target: f.skillsRoot,
      state: "create", link_content: relative(dirname(legacy), f.skillsRoot), create_parents: [join(f.project, ".claude")] };
    const result = await applySkillLink(action, { skillsRoot: f.skillsRoot, base: f.project });
    expect(result.status).toBe("failed");
    expect(result.error.code).toBe("TARGET_OUTSIDE_BASE");
    expect(existsSync(join(outside, "skills"))).toBe(false);
  });

  it("verifies a broken link identity before removing it", () => {
    const f = fixture();
    const target = join(f.project, "target");
    mkdirSync(target);
    const link = join(f.project, "skills");
    symlinkSync(join(f.project, "gone"), link);
    // It was a symlink at planning time, but a regular file now exists there.
    rmSync(link);
    writeFileSync(link, "user file\n");
    expect(() => replaceBrokenSymlink(link, "gone")).toThrow(/no longer a symlink|not a symlink/);
    expect(readFileSync(link, "utf8")).toBe("user file\n");
    expect(() => replaceBrokenSymlink(link)).toThrow();
  });

  it("lists the specific route problem instead of a generic blocked configuration", () => {
    const f = fixture();
    writeFileSync(f.configPath, `${JSON.stringify({
      task_dir: join(f.root, "tasks"),
      third_review: { command: [process.execPath], config: join(f.root, "providers.json"), attachment_root: join(f.root, "packets") },
      wh_review: { version: 2, stages: { "build-code": { initial: "codex", mode: "full_only" } } },
    }, null, 2)}\n`);
    const result = f.run("--check", `--package-root=${f.packageRoot}`);
    expect(result.code).toBe(1);
    expect(result.json.config.status).toBe("blocked");
    const problems = JSON.stringify(result.json.config.problems);
    expect(problems).toContain("CONFIG_WH_REVIEW_ROUTE_INVALID");
    expect(problems).toContain("build-code");
    expect(String(result.json.config.next_action)).toMatch(/route/i);
  });

  it("quotes the package root in recovery commands", () => {
    const f = fixture();
    const spaced = join(f.root, "package root");
    renameSync(f.packageRoot, spaced);
    writeFileSync(f.configPath, `${JSON.stringify({
      task_dir: join(f.root, "tasks"),
      third_review: { command: [process.execPath], config: join(f.root, "providers.json"), attachment_root: join(f.root, "packets") },
      wh_review: { version: 2, stages: {} },
    }, null, 2)}\n`);
    const result = f.run("--apply", `--package-root=${spaced}`);
    expect(result.code).toBe(0);
    const command = String(result.json.config.next_action);
    expect(command).toContain(`--package-root='${spaced}'`);
    expect(command).not.toContain("original error");
    expect(command).not.toContain("restore");
    const executed = spawnSync("/bin/sh", ["-c", command], {
      cwd: fileURLToPath(new URL("../..", import.meta.url)),
      env: { ...process.env, ...f.env, PATH: `${dirname(process.execPath)}:${process.env.PATH}` },
      encoding: "utf8", timeout: 60000,
    });
    expect(executed.status, executed.stderr).toBe(0);
    expect(JSON.parse(readFileSync(f.configPath, "utf8")).wh_review).toEqual({ version: 2, stages: {}, non_stage: {} });
  });

  it.skipIf(typeof process.getuid === "function" && process.getuid() === 0)("returns an executable-only recovery command after a config write failure", () => {
    const f = fixture();
    const spaced = join(f.root, "package root");
    renameSync(f.packageRoot, spaced);
    writeFileSync(f.configPath, `${JSON.stringify({
      task_dir: join(f.root, "tasks"),
      third_review: { command: [process.execPath], config: join(f.root, "providers.json"), attachment_root: join(f.root, "packets") },
      wh_review: { version: 2, stages: {} },
    }, null, 2)}\n`);
    const configDir = join(f.configPath, "..");
    chmodSync(configDir, 0o555);
    let failed;
    try { failed = f.run("--apply", "--write-config", `--package-root=${spaced}`); }
    finally { chmodSync(configDir, 0o755); }
    expect(failed.code).toBe(1);
    const command = String(failed.json.config.next_action);
    expect(command.startsWith("node tools/cli/onboard-release.mjs --apply --write-config --package-root=")).toBe(true);
    expect(command).not.toContain(";");
    expect(command).not.toContain("original error");
    const executed = spawnSync("/bin/sh", ["-c", command], {
      cwd: fileURLToPath(new URL("../..", import.meta.url)),
      env: { ...process.env, ...f.env, PATH: `${dirname(process.execPath)}:${process.env.PATH}` },
      encoding: "utf8", timeout: 60000,
    });
    expect(executed.status, executed.stderr).toBe(0);
    expect(JSON.parse(readFileSync(f.configPath, "utf8")).wh_review).toEqual({ version: 2, stages: {}, non_stage: {} });
  });

  it("treats an unreachable (self-loop) host link as a conflict instead of deleting it", async () => {
    const f = fixture();
    const link = join(f.home, ".agents", "skills");
    mkdirSync(join(f.home, ".agents"));
    symlinkSync(link, link);
    const inspected = inspectSkillLink(link, f.skillsRoot);
    expect(inspected.state).toBe("conflict");
    expect(String(inspected.reason)).toMatch(/ELOOP|loop|not reachable/i);
    const result = f.run("--apply", `--package-root=${f.packageRoot}`);
    expect(result.code).toBe(1);
    expect(action(result, "codex").status).toBe("conflict");
    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    expect(readlinkSync(link)).toBe(link);
    expect(existsSync(join(f.skillsRoot, "build-code", "SKILL.md"))).toBe(true);
  });

  it("does not rebuild a link when its target appeared after planning", () => {
    const f = fixture();
    const target = join(f.project, "target");
    const link = join(f.project, "skills");
    symlinkSync(target, link);
    // Target was missing at inspection time, then the user restored it.
    mkdirSync(target);
    writeFileSync(join(target, "user.txt"), "user data\n");
    expect(() => replaceBrokenSymlink(link, target)).toThrow(/no longer|changed|not a symlink|reachable/);
    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    expect(readFileSync(join(target, "user.txt"), "utf8")).toBe("user data\n");
  });

  it("refuses to write when a real path escapes the authorized base through a symlinked ancestor", async () => {
    const f = fixture();
    const outside = join(f.root, "outside");
    mkdirSync(join(outside), { recursive: true });
    symlinkSync(outside, join(f.project, "linked"));
    const link = join(f.project, "linked", "skills");
    const action = { kind: "skill-link", host: "claude-code", scope: "project", path: link, target: f.skillsRoot,
      state: "create", link_content: relative(dirname(link), f.skillsRoot), create_parents: [] };
    const result = await applySkillLink(action, { skillsRoot: f.skillsRoot, base: f.project });
    expect(result.status).toBe("failed");
    expect(result.error.code).toBe("TARGET_OUTSIDE_BASE");
    expect(existsSync(join(outside, "skills"))).toBe(false);
  });

  it("blocks every host link when the configured route is not usable", () => {
    const f = fixture();
    writeFileSync(f.configPath, `${JSON.stringify({
      task_dir: join(f.root, "tasks"),
      third_review: { command: [process.execPath], config: join(f.root, "providers.json"), attachment_root: join(f.root, "packets") },
      wh_review: { version: 2, stages: { "build-code": { initial: "codex", mode: "full_only" } } },
    }, null, 2)}\n`);
    const result = f.run("--apply", `--package-root=${f.packageRoot}`);
    expect(result.code).toBe(1);
    expect(existsSync(join(f.home, ".claude"))).toBe(false);
    expect(existsSync(join(f.home, ".agents"))).toBe(false);
    expect(result.json.actions.every((item) => item.status === "blocked")).toBe(true);
    expect(JSON.stringify(result.json.config.problems)).toContain("CONFIG_WH_REVIEW_ROUTE_INVALID");
  });

  it("builds a resolving link when the release root and host directory use different real aliases", () => {
    const f = fixture();
    // macOS exposes /private/var as /var; use the lexical alias for HOME while
    // the release root keeps the real path, so a purely lexical relative link
    // would point through the alias and dangle.
    if (!f.root.startsWith("/private/var/")) return;
    const aliasHome = join("/var", f.root.slice("/private/var/".length), "home");
    const result = spawnSync(process.execPath, [CLI, "--apply", `--package-root=${f.packageRoot}`], {
      env: { ...process.env, ...f.env, HOME: aliasHome }, encoding: "utf8", timeout: 60000,
    });
    expect(result.status, result.stderr).toBe(0);
    const link = join(aliasHome, ".claude", "skills");
    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    let resolved;
    try { resolved = realpathSync(link); }
    catch { resolved = null; }
    expect(resolved).not.toBeNull();
    expect(resolved).toBe(realpathSync(join(f.packageRoot, "runner", "skills")));
  });

  it("rejects ambiguous arguments before touching any target", () => {
    const f = fixture();
    const before = snapshot(f.home);
    expect(f.run(`--package-root=${f.packageRoot}`).code).toBe(1);
    expect(f.run("--check", "--apply", `--package-root=${f.packageRoot}`).code).toBe(1);
    expect(f.run("--check", `--package-root=relative/path`).code).toBe(1);
    expect(f.run("--check", `--package-root=${f.packageRoot}`, "--unknown=1").code).toBe(1);
    expect(snapshot(f.home)).toEqual(before);
  });
});
