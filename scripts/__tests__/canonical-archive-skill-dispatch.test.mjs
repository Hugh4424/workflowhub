import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, expect, it } from "vitest";
import { smokeLocalSkillPackages } from "../../tools/cli/smoke-local-skill-dispatch.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

it("resolves direct skill packages from the canonical git archive", async () => {
  const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-archive-"));
  roots.push(temporary);
  const archive = path.join(temporary, "workflowhub.tar");
  const artifact = path.join(temporary, "artifact");
  const temporaryIndex = path.join(temporary, "candidate.index");
  fs.mkdirSync(artifact);
  const env = { ...process.env, GIT_INDEX_FILE: temporaryIndex };
  execFileSync("git", ["read-tree", "HEAD"], { cwd: repository, env });
  execFileSync("git", ["add", "-A"], { cwd: repository, env });
  const candidateTree = execFileSync("git", ["write-tree"], { cwd: repository, env, encoding: "utf8" }).trim();
  execFileSync("git", ["archive", "--format=tar", "-o", archive, candidateTree], { cwd: repository });
  execFileSync("tar", ["-xf", archive, "-C", artifact]);
  // A canonical archive intentionally excludes node_modules. Install the
  // declared production dependencies before exercising the extracted runtime.
  execFileSync("npm", ["ci", "--ignore-scripts", "--offline"], { cwd: artifact, stdio: "ignore" });
  const result = smokeLocalSkillPackages(artifact);
  expect(result).toHaveLength(5);
  expect(result.every(item => item.skill_count > 0 && item.step_count > 0)).toBe(true);
  expect(result.every(item => item.bundle_hashes.length === item.skill_count)).toBe(true);
  expect(fs.existsSync(path.join(artifact, ".git"))).toBe(false);
}, 15_000);
