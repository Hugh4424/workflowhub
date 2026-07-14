import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, expect, it } from "vitest";
import { smokeLocalSkillDispatch } from "../smoke-local-skill-dispatch.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });

it("dispatches the canonical git archive under a clean HOME", async () => {
  const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-archive-"));
  roots.push(temporary);
  const archive = path.join(temporary, "workflowhub.tar");
  const artifact = path.join(temporary, "artifact");
  fs.mkdirSync(artifact);
  execFileSync("git", ["archive", "--format=tar", "-o", archive, "HEAD"], { cwd: repository });
  execFileSync("tar", ["-xf", archive, "-C", artifact]);
  const result = await smokeLocalSkillDispatch(artifact);
  expect(result).toHaveLength(5);
  expect(result.every(item => item.dispatch_count > 0)).toBe(true);
  expect(fs.existsSync(path.join(artifact, ".git"))).toBe(false);
});
