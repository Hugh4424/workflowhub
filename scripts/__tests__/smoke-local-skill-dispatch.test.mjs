import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterEach, expect, it } from "vitest";
import { checkSkillClosure } from "../../runtime/evidence/check-skill-closure.mjs";
import { smokeLocalSkillPackages } from "../../tools/cli/smoke-local-skill-dispatch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const temps = [];
afterEach(() => temps.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true })));

function portableFixture() {
  const isolated = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-smoke-isolated-")));
  temps.push(isolated);
  const root = path.join(isolated, "package");
  for (const directory of ["skills", "workflows", "runtime/schemas"]) {
    fs.cpSync(path.join(ROOT, directory), path.join(root, directory), { recursive: true });
  }
  for (const locator of ["config", "THIRD_PARTY_NOTICES.md", "skills/reuse-registry.md"]) {
    fs.cpSync(path.join(ROOT, locator), path.join(root, locator), { recursive: true });
  }
  const env = { PATH: process.env.PATH, LANG: "C.UTF-8", NODE_PATH: "", GIT_CONFIG_NOSYSTEM: "1" };
  for (const [key, relative] of Object.entries({ HOME: "home", CODEX_HOME: "codex", XDG_CONFIG_HOME: "config", WORKFLOWHUB_TASK_DIR: "tasks" })) {
    env[key] = path.join(isolated, relative);
    fs.mkdirSync(env[key], { recursive: true });
  }
  for (const key of ["CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH"]) delete env[key];
  const config = path.join(env.HOME, ".config/workflowhub/config.json");
  const sink = path.join(isolated, "sink.jsonl");
  fs.mkdirSync(path.dirname(config), { recursive: true });
  fs.writeFileSync(config, "invalid-host-config-must-not-be-read\n");
  fs.writeFileSync(sink, "untouched-sink\n");
  return { isolated, root, env, config, sink };
}

function smokeChild(fixture) {
  const script = `import {smokeLocalSkillPackages} from ${JSON.stringify(pathToFileURL(path.join(ROOT, "tools/cli/smoke-local-skill-dispatch.mjs")).href)}; console.log(JSON.stringify(smokeLocalSkillPackages(process.argv[1])));`;
  return spawnSync(process.execPath, ["--input-type=module", "-e", script, fixture.root], { cwd: fixture.root, env: fixture.env, encoding: "utf8" });
}

it("resolves direct skill packages for all five stages", () => {
  const result = smokeLocalSkillPackages(ROOT);
  expect(result).toHaveLength(5);
  expect(new Set(result.map(item => item.stage)).size).toBe(5);
  expect(result.every(item => item.skill_count > 0 && item.step_count > 0)).toBe(true);
  expect(result.every(item => item.bundle_hashes.length === item.skill_count)).toBe(true);
});

it("resolves copied portable bytes with isolated host paths and no host config dependency or sink mutation", () => {
  const fixture = portableFixture();
  const result = smokeChild(fixture);
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toHaveLength(5);
  expect(fs.readFileSync(fixture.config, "utf8")).toBe("invalid-host-config-must-not-be-read\n");
  expect(fs.readFileSync(fixture.sink, "utf8")).toBe("untouched-sink\n");
  expect(fs.readdirSync(fixture.env.WORKFLOWHUB_TASK_DIR)).toEqual([]);
});

it.each(["missing-bundle", "tampered-template", "escaped-template"])("detects %s through its owning validation seam", defect => {
  const fixture = portableFixture();
  const template = path.join(fixture.root, "skills/spec-plan/templates/phase-template.md");
  if (defect === "missing-bundle") fs.rmSync(path.join(fixture.root, "skills/spec-plan/skill-bundle.json"));
  if (defect === "tampered-template") fs.appendFileSync(template, "\nchanged after declaration\n");
  if (defect === "escaped-template") {
    const outside = path.join(fixture.isolated, "outside-template.md");
    fs.copyFileSync(template, outside);
    fs.rmSync(template);
    fs.symlinkSync(outside, template);
  }
  const result = smokeChild(fixture);
  if (defect === "tampered-template") {
    expect(result.status, result.stderr).toBe(0);
    expect(checkSkillClosure(fixture.root).errors.join("\n"))
      .toMatch(/spec-plan: catalog local_bundle_hash does not match resolved bundle/);
  } else {
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/bundle|symlink|regular file|outside|escap/i);
    expect(result.stdout).toBe("");
  }
  expect(fs.readFileSync(fixture.sink, "utf8")).toBe("untouched-sink\n");
  expect(fs.readdirSync(fixture.env.WORKFLOWHUB_TASK_DIR)).toEqual([]);
});
