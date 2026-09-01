import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
const root = join(import.meta.dirname, "../..");
const cli = join(root, "tools/cli/generate-iteration-brief.mjs");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function targetArgs(storage) {
  const authority = join(storage, "build-plan-steps.json");
  const bytes = '{"stage":"build-plan","version":"1"}\n';
  writeFileSync(authority, bytes);
  return ["--target-kind=stage", "--target-id=build-plan", "--target-version=1", `--authority=${authority}`, `--authority-sha256=${sha256(bytes)}`];
}
describe("M16 iteration brief", () => {
  it("renders all seven fixed sections and preserves missing-source states", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(storage)], { encoding: "utf8" });
      expect(result.status).toBe(0);
      const raw = readFileSync(join(storage, "Projects/Demo/iteration-brief.md"), "utf8");
      for (const heading of ["Candidates", "Negative results", "Attempted edits", "External skill updates", "Retained behavior", "Open decisions", "Market comparison"]) expect(raw).toContain(heading);
      expect(raw).toContain("not_checked");
      const read = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", "--read-current=true"], { encoding: "utf8" });
      expect(read.status, read.stdout).toBe(0);
      expect(JSON.parse(read.stdout)).toMatchObject({ status: "ok" });
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it("rejects a current brief whose rendered body no longer matches its header identity", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const args = [`--root=${storage}`, "--project=Demo", ...targetArgs(storage)];
      expect(spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" }).status).toBe(0);
      const path = join(storage, "Projects/Demo/iteration-brief.md");
      writeFileSync(path, readFileSync(path, "utf8").replace("Candidates", "Forged candidates"));
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", "--read-current=true"], { encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "stale_source" });
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });
});
