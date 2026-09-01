import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
const root = join(import.meta.dirname, "../..");
const cli = join(root, "tools/cli/generate-iteration-brief.mjs");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonical = (value) => value === null || typeof value !== "object" ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;

function targetArgs() { return ["--target-kind=stage", "--target-id=build-plan"]; }
describe("M16 iteration brief", () => {
  it("renders all seven fixed sections and preserves missing-source states", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs()], { encoding: "utf8" });
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
      const args = [`--root=${storage}`, "--project=Demo", ...targetArgs()];
      expect(spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" }).status).toBe(0);
      const path = join(storage, "Projects/Demo/iteration-brief.md");
      writeFileSync(path, readFileSync(path, "utf8").replace("Candidates", "Forged candidates"));
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", "--read-current=true"], { encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "stale_source" });
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it("rejects a caller-selected target authority outside the current repository manifest", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const authority = join(storage, "foreign-stage-manifest.json");
      const bytes = '{"stage":"build-plan","version":"1"}\n';
      writeFileSync(authority, bytes);
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(), "--target-version=1", `--authority=${authority}`, `--authority-sha256=${sha256(bytes)}`], { encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "stale_source" });
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it("fails closed when an input ledger has a malformed terminal tail", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const projectRoot = join(storage, "Projects/Demo");
      writeFileSync(join(storage, "seed"), "seed");
      const seed = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs()], { encoding: "utf8" });
      expect(seed.status, seed.stdout).toBe(0);
      writeFileSync(join(projectRoot, "attempted-edits.jsonl"), '{"record_kind":"batch_begin"');
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(), "--attempt-id=malformed-tail"], { encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "failed" });
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it("rejects a committed ledger row that only has retired legacy fields", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const projectRoot = join(storage, "Projects/Demo");
      spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs()], { encoding: "utf8" });
      const batch = "legacy-batch"; const row = { record_kind: "attempted-edit", ledger_batch_id: batch, attempt_id: "legacy-row", legacy_before_facts: [], legacy_after_facts: [] };
      const begin = { schema_version: "workflow-evolution.v1", record_kind: "batch_begin", batch_id: batch, ledger_kind: "attempted-edit", attempt_id: "legacy-row", publication_generation: 1 };
      const commit = { schema_version: "workflow-evolution.v1", record_kind: "batch_commit", batch_id: batch, ledger_kind: "attempted-edit", attempt_id: "legacy-row", status: "committed", count: 1, content_hash: sha256(canonical([row])), publication_generation: 1 };
      writeFileSync(join(projectRoot, "attempted-edits.jsonl"), `${JSON.stringify(begin)}\n${JSON.stringify(row)}\n${JSON.stringify(commit)}\n`);
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(), "--attempt-id=legacy-row"], { encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "failed", error: { summary: expect.stringContaining("row schema invalid") } });
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it("rejects legacy fields on ledger batch envelopes", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const projectRoot = join(storage, "Projects/Demo"); spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs()], { encoding: "utf8" });
      writeFileSync(join(projectRoot, "attempted-edits.jsonl"), `${JSON.stringify({ schema_version: "workflow-evolution.v1", record_kind: "batch_begin", ledger_kind: "attempted-edit", batch_id: "b", attempt_id: "a", legacy_phase: "old" })}\n`);
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(), "--attempt-id=envelope"], { encoding: "utf8" });
      expect(result.status).not.toBe(0); expect(JSON.parse(result.stdout).error.summary).toContain("envelope schema invalid");
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it("rejects a batch commit whose attempt differs from its begin", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const projectRoot = join(storage, "Projects/Demo"); spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs()], { encoding: "utf8" });
      const begin = { schema_version: "workflow-evolution.v1", record_kind: "batch_begin", ledger_kind: "attempted-edit", batch_id: "b", attempt_id: "attempt-a", publication_generation: 1 };
      const commit = { schema_version: "workflow-evolution.v1", record_kind: "batch_commit", ledger_kind: "attempted-edit", batch_id: "b", attempt_id: "attempt-b", count: 0, content_hash: sha256(canonical([])), publication_generation: 1, status: "committed" };
      writeFileSync(join(projectRoot, "attempted-edits.jsonl"), `${JSON.stringify(begin)}\n${JSON.stringify(commit)}\n`);
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(), "--attempt-id=commit-forge"], { encoding: "utf8" });
      expect(result.status).not.toBe(0); expect(JSON.parse(result.stdout).error.summary).toContain("committed batch integrity mismatch");
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it.each(["batch_begin", "batch_commit", "batch_abort"])("rejects a %s envelope without publication_generation", (kind) => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const projectRoot = join(storage, "Projects/Demo");
      spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs()], { encoding: "utf8" });
      let ledger;
      if (kind === "batch_begin") {
        ledger = { schema_version: "workflow-evolution.v1", record_kind: kind, ledger_kind: "attempted-edit", batch_id: "b", attempt_id: "a" };
        writeFileSync(join(projectRoot, "attempted-edits.jsonl"), `${JSON.stringify(ledger)}\n`);
      } else if (kind === "batch_commit") {
        const begin = { schema_version: "workflow-evolution.v1", record_kind: "batch_begin", ledger_kind: "attempted-edit", batch_id: "b", attempt_id: "a", publication_generation: 1 };
        ledger = { schema_version: "workflow-evolution.v1", record_kind: kind, ledger_kind: "attempted-edit", batch_id: "b", attempt_id: "a", count: 0, content_hash: sha256(canonical([])), status: "committed" };
        writeFileSync(join(projectRoot, "attempted-edits.jsonl"), `${JSON.stringify(begin)}\n${JSON.stringify(ledger)}\n`);
      } else {
        const torn = Buffer.from('{"record_kind":"batch_begin"');
        ledger = { schema_version: "workflow-evolution.v1", record_kind: kind, ledger_kind: "attempted-edit", batch_id: "b", publication_generation: undefined, reason: "torn", last_committed_prefix_hash: sha256(Buffer.alloc(0)), abandoned_start_offset: 0, observed_suffix_length: torn.length, observed_suffix_hash: sha256(torn) };
        delete ledger.publication_generation;
        writeFileSync(join(projectRoot, "attempted-edits.jsonl"), `${torn.toString()}\n${JSON.stringify(ledger)}\n`);
      }
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(), `--attempt-id=missing-${kind}`], { encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "failed", error: { summary: expect.stringContaining(`${kind} envelope schema invalid`) } });
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it.each([
    ["skill", "stage-reflection", "skills/catalog.yaml"],
    ["surface", "tools/cli/generate-iteration-brief.mjs", "docs/architecture/move-map.json"],
  ])("derives a %s target only from its current catalog or move-map authority", (kind, id, authoritySuffix) => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", `--target-kind=${kind}`, `--target-id=${id}`], { encoding: "utf8" });
      expect(result.status, result.stdout).toBe(0);
      const read = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", "--read-current=true"], { encoding: "utf8" });
      expect(read.status, read.stdout).toBe(0);
      expect(JSON.parse(read.stdout).header.target_ref.authority_ref).toMatch(authoritySuffix);
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });
});
