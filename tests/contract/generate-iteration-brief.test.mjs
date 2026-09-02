import { describe, expect, it } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { hostname } from "node:os";
import { createHash } from "node:crypto";
const root = join(import.meta.dirname, "../..");
const cli = join(root, "tools/cli/generate-iteration-brief.mjs");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonical = (value) => value === null || typeof value !== "object" ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;

function targetArgs() { return ["--target-kind=stage", "--target-id=build-plan"]; }
function runBrief(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, ...args], { encoding: "utf8" }); let stdout = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.on("close", (status) => resolve({ status, stdout }));
  });
}
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

  it("resolves a unique current versioned step target and renders the same seven sections", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-step-"));
    try {
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", "--target-kind=step", "--target-id=read-current-materials"], { encoding: "utf8" });
      expect(result.status, result.stdout).toBe(0);
      const raw = readFileSync(join(storage, "Projects/Demo/iteration-brief.md"), "utf8");
      const header = Buffer.from(raw.match(/<!-- workflow-evolution-brief:([^ ]+) -->/)?.[1] ?? "", "base64").toString("utf8");
      expect(JSON.parse(header).target_ref).toMatchObject({
        target_kind: "step",
        target_id: "read-current-materials",
        target_version: "2.0.0",
        authority_ref: "workflows/build-plan/steps.json",
      });
      for (const heading of ["Candidates", "Negative results", "Attempted edits", "External skill updates", "Retained behavior", "Open decisions", "Market comparison"]) expect(raw).toContain(heading);

      const stale = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", "--target-kind=step", "--target-id=read-current-materials", "--target-version=1.0.0"], { encoding: "utf8" });
      expect(stale.status).not.toBe(0);
      expect(JSON.parse(stale.stdout)).toMatchObject({ status: "stale_source" });
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it("keeps the brief as traceable facts and does not emit an automatic change proposal", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-facts-"));
    try {
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs()], { encoding: "utf8" });
      expect(result.status, result.stdout).toBe(0);
      const raw = readFileSync(join(storage, "Projects/Demo/iteration-brief.md"), "utf8");
      expect(raw).toContain("本简报只包含事实、状态和证据引用。");
      expect(raw).not.toMatch(/把[^\n]{0,160}(?:改成|改为|替换为)/u);
      expect(raw).not.toMatch(/(?:自动|系统)(?:地)?(?:决定|修改|创建|生成|应用)/u);
      expect(raw).toContain('"source_refs"');
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

  it("refuses an expired project lock without changing the lock or brief", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const projectRoot = join(storage, "Projects", "Demo");
      const lockPath = join(projectRoot, ".workflowhub-evolution.lock");
      const lock = {
        schema_version: "workflow-evolution.v1",
        project: "Demo",
        attempt_id: "live-attempt",
        owner_token: "live-owner",
        fencing_token: "live-fence",
        pid: process.pid,
        host_id: hostname(),
        boot_id: process.env.WORKFLOWHUB_BOOT_ID ?? "boot-local",
        session_epoch: process.env.WORKFLOWHUB_SESSION_EPOCH ?? "session-local",
        acquired_monotonic_ms: 0,
        lease_deadline_monotonic_ms: 1,
      };
      mkdirSync(projectRoot, { recursive: true });
      writeFileSync(lockPath, `${JSON.stringify(lock)}\n`);
      const before = readFileSync(lockPath);
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(), "--attempt-id=expired-lock"], { encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "conflict" });
      expect(readFileSync(lockPath)).toEqual(before);
      expect(readFileSync(join(projectRoot, "iteration-brief.md"), { encoding: "utf8", flag: "a+" })).toBe("");
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it("keeps exactly one current brief when two writers race", async () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-race-"));
    try {
      const common = [`--root=${storage}`, "--project=Demo", ...targetArgs()];
      const results = await Promise.all(["a", "b"].map((suffix) => runBrief([...common, `--attempt-id=brief-race-${suffix}`])));
      const payloads = results.map((result) => JSON.parse(result.stdout));
      expect(results.filter((result) => result.status === 0)).toHaveLength(1);
      expect(payloads.filter((payload) => payload.status === "conflict")).toHaveLength(1);
      const path = join(storage, "Projects/Demo/iteration-brief.md");
      const raw = readFileSync(path, "utf8");
      const header = JSON.parse(Buffer.from(raw.match(/<!-- workflow-evolution-brief:([^ ]+) -->/)?.[1] ?? "", "base64").toString("utf8"));
      expect(["brief-race-a", "brief-race-b"]).toContain(header.brief_attempt_id);
      expect(raw.match(/<!-- workflow-evolution-brief:/g)).toHaveLength(1);
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

  it("rejects a batch commit whose generation differs from its begin", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const projectRoot = join(storage, "Projects/Demo"); spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs()], { encoding: "utf8" });
      const begin = { schema_version: "workflow-evolution.v1", record_kind: "batch_begin", ledger_kind: "attempted-edit", batch_id: "b", attempt_id: "attempt-a", publication_generation: 1 };
      const commit = { schema_version: "workflow-evolution.v1", record_kind: "batch_commit", ledger_kind: "attempted-edit", batch_id: "b", attempt_id: "attempt-a", count: 0, content_hash: sha256(canonical([])), publication_generation: 2, status: "committed" };
      writeFileSync(join(projectRoot, "attempted-edits.jsonl"), `${JSON.stringify(begin)}\n${JSON.stringify(commit)}\n`);
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(), "--attempt-id=commit-generation-forge"], { encoding: "utf8" });
      expect(result.status).not.toBe(0); expect(JSON.parse(result.stdout).error.summary).toContain("committed batch integrity mismatch");
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it("rejects a first batch whose publication generation skips one", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const projectRoot = join(storage, "Projects/Demo"); spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs()], { encoding: "utf8" });
      const begin = { schema_version: "workflow-evolution.v1", record_kind: "batch_begin", ledger_kind: "attempted-edit", batch_id: "b", attempt_id: "a", publication_generation: 2 };
      const commit = { schema_version: "workflow-evolution.v1", record_kind: "batch_commit", ledger_kind: "attempted-edit", batch_id: "b", attempt_id: "a", count: 0, content_hash: sha256(canonical([])), publication_generation: 2, status: "committed" };
      writeFileSync(join(projectRoot, "attempted-edits.jsonl"), `${JSON.stringify(begin)}\n${JSON.stringify(commit)}\n`);
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(), "--attempt-id=first-generation-forge"], { encoding: "utf8" });
      expect(result.status).not.toBe(0); expect(JSON.parse(result.stdout).error.summary).toContain("publication generation is not contiguous");
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it("rejects a repeated publication generation across committed batches", () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const projectRoot = join(storage, "Projects/Demo"); spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs()], { encoding: "utf8" });
      const batch = (batchId) => [{ schema_version: "workflow-evolution.v1", record_kind: "batch_begin", ledger_kind: "attempted-edit", batch_id: batchId, attempt_id: batchId, publication_generation: 1 }, { schema_version: "workflow-evolution.v1", record_kind: "batch_commit", ledger_kind: "attempted-edit", batch_id: batchId, attempt_id: batchId, count: 0, content_hash: sha256(canonical([])), publication_generation: 1, status: "committed" }];
      writeFileSync(join(projectRoot, "attempted-edits.jsonl"), `${batch("first").map(JSON.stringify).join("\n")}\n${batch("second").map(JSON.stringify).join("\n")}\n`);
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(), "--attempt-id=repeated-generation-forge"], { encoding: "utf8" });
      expect(result.status).not.toBe(0); expect(JSON.parse(result.stdout).error.summary).toContain("publication generation is not contiguous");
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });

  it.each([
    ["batch id", { batch_id: "forged-batch", publication_generation: 1 }],
    ["publication generation", { batch_id: "recovery-batch", publication_generation: 2 }],
  ])("binds a recovery abort to the open begin %s", (_label, override) => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-"));
    try {
      const projectRoot = join(storage, "Projects/Demo"); spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs()], { encoding: "utf8" });
      const begin = { schema_version: "workflow-evolution.v1", record_kind: "batch_begin", ledger_kind: "attempted-edit", batch_id: "recovery-batch", attempt_id: "recovery-attempt", publication_generation: 1 };
      const torn = Buffer.from('{"record_kind":"attempted-edit"');
      const abandonedSuffix = Buffer.concat([Buffer.from(`${JSON.stringify(begin)}\n`), torn, Buffer.from("\n")]);
      const abort = { schema_version: "workflow-evolution.v1", record_kind: "batch_abort", ledger_kind: "attempted-edit", ...override, reason: "torn", last_committed_prefix_hash: sha256(Buffer.alloc(0)), abandoned_start_offset: 0, observed_suffix_length: abandonedSuffix.length, observed_suffix_hash: sha256(abandonedSuffix) };
      writeFileSync(join(projectRoot, "attempted-edits.jsonl"), Buffer.concat([abandonedSuffix, Buffer.from(`${JSON.stringify(abort)}\n`)]));
      const before = readFileSync(join(projectRoot, "attempted-edits.jsonl"));
      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(), "--attempt-id=recovery-abort"], { encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "failed", error: { summary: expect.stringContaining("batch_abort identity mismatch") } });
      expect(readFileSync(join(projectRoot, "attempted-edits.jsonl"))).toEqual(before);
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

  it("renders only active candidate rows while retaining superseded history in the ledger", async () => {
    const storage = mkdtempSync(join(tmpdir(), "m16-brief-active-candidates-"));
    try {
      const evolution = await import("../../runtime/evidence/workflow-evolution.mjs");
      const manifestRef = "workflows/build-plan/steps.json";
      const manifestBytes = readFileSync(join(root, manifestRef));
      const observation = {
        task_id: "brief-task",
        confirmation_ref: "legacy-confirmation",
        confirmation_sha256: "a".repeat(64),
        occurred_at: "2026-08-30T00:00:00Z",
        intervention_kind: "retry",
        intervention_payload: { reason: "same" },
        target_ref: { kind: "stage", id: "build-plan", version: null, authority: manifestRef, authority_sha256: sha256(manifestBytes) },
      };
      const first = evolution.refreshEvolutionSnapshot({ storageRoot: storage, project: "Demo", attemptId: "candidate-first", inventory: { observations: [observation] }, now: "2026-08-31T00:00:00Z" });
      expect(first.status).toBe("ok");
      const candidate = first.records[0];
      const lock = evolution.acquireProjectLock({ storageRoot: storage, project: "Demo", attemptId: "candidate-supersede" });
      const transitioned = evolution.recordCandidateTransition({ storageRoot: storage, project: "Demo", attemptId: "candidate-supersede", currentSnapshotId: first.snapshot_id, candidateId: candidate.candidate_id, candidateRecordId: candidate.candidate_record_id, expectedRevision: candidate.revision, currentSourceIdentities: candidate.source_identities, currentMaterialIdentities: candidate.material_identities, humanConfirmation: { ref: candidate.human_confirmation_ref, sha256: candidate.human_confirmation_sha256 }, lifecycleStatus: "superseded", lockAuthority: lock });
      expect(transitioned.status).toBe("ok");
      expect(lock.release().status).toBe("ok");

      const result = spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", ...targetArgs(), "--attempt-id=brief-active-filter"], { encoding: "utf8" });
      expect(result.status, result.stdout).toBe(0);
      const raw = readFileSync(join(storage, "Projects/Demo/iteration-brief.md"), "utf8");
      const candidates = JSON.parse(raw.match(/## Candidates\n\n```json\n([\s\S]*?)\n```/)[1]);
      expect(candidates.items).toHaveLength(1);
      expect(candidates.items[0]).toMatchObject({ row_status: "active", lifecycle_status: "open" });
      expect(evolution.readCurrentEvolutionProjection({ storageRoot: storage, project: "Demo" }).candidates).toEqual(expect.arrayContaining([expect.objectContaining({ row_status: "historical", lifecycle_status: "superseded" })]));
      const template = readFileSync(join(root, "tools/cli/build-reflection-page-template.html"), "utf8");
      expect(template).toContain('entry.row_status === "active" && entry.tier === tier');
    } finally { rmSync(storage, { recursive: true, force: true }); }
  });
});
