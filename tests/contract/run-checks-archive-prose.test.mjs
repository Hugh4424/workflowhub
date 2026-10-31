// Locks the material prose contract at the run-checks CLI boundary:
// a path segment named archive uses the existing diagnostic mode, while the
// same material outside archive keeps reader prose required.
import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { inspectMaterialWorkspace } from "../../runtime/task/material-workspace.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CARDS = join(ROOT, "specs/archive/n8-four-level-route-20261019");
const roots = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function put(root, path, body) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body);
}

function copyMaterial(target) {
  for (const [path, body] of Object.entries(inspectMaterialWorkspace(CARDS).files)) put(target, path, body);
  return target;
}

// Remove every reader-prose line inside card bodies; the machine fields,
// headings, tables, bullets and fenced blocks remain byte-for-byte.
function stripCardProse(root) {
  for (const path of Object.keys(inspectMaterialWorkspace(root).files).filter(path => /^phases\/P\d+.*\.md$/.test(path))) {
    const lines = readFileSync(join(root, path), "utf8").split(/\r?\n/);
    const kept = [];
    let inCard = false, fence = false;
    for (const line of lines) {
      if (/^\s*```/.test(line)) fence = !fence;
      if (!fence && /^###\s+/.test(line)) inCard = /^###\s+(?:T\d{3,}|任务\s*\d+\s*[:：])/.test(line);
      const prose = !fence && inCard && line.trim() !== ""
        && !/^(?:\s|[-*+>#|`]|\d+[.)、）])/.test(line)
        && !/^(?:机器字段|校验器用|人可跳过)/.test(line);
      if (!prose) kept.push(line);
    }
    writeFileSync(join(root, path), kept.join("\n"));
  }
}

function run(root) {
  const env = { ...process.env };
  delete env.RUN_CHECKS_FORCE_FAIL_CHECKER;
  const result = spawnSync(process.execPath, [join(ROOT, "tools/cli/run-checks.mjs"), "--material-root", root], { cwd: ROOT, env, encoding: "utf8", timeout: 30_000 });
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

describe("run-checks material prose contract", () => {
  it("uses archive diagnostic mode and keeps non-archive prose required", () => {
    const base = mkdtempSync(join(tmpdir(), "material-prose-")); roots.push(base);
    const archive = join(base, "specs", "archive", "n8-four-level-route-20261019");
    const plain = join(base, "specs", "n8-four-level-route-20261019");
    copyMaterial(archive); stripCardProse(archive);
    copyMaterial(plain); stripCardProse(plain);

    const accepted = run(archive);
    expect(accepted.status, accepted.output).toBe(0);
    expect(accepted.output).toContain("[run-checks][material] PASS");
    expect(accepted.output).not.toContain("task card requires reader prose");

    const rejected = run(plain);
    expect(rejected.status, rejected.output).toBe(1);
    expect(rejected.output).toContain("task card requires reader prose");
  });
});
