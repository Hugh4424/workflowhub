import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hostname, tmpdir } from "node:os";
import Ajv2020 from "ajv/dist/2020.js";

const root = join(import.meta.dirname, "../..");
const cli = join(root, "tools/cli/record-evolution-result.mjs");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonical = (value) => value === null || typeof value !== "object" ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;

function setup() {
  const storage = mkdtempSync(join(tmpdir(), "m16-ledger-"));
  const facts = mkdtempSync(join(tmpdir(), "m16-ledger-facts-"));
  const file = (name, bytes) => { const path = join(facts, name); writeFileSync(path, bytes); return { path, sha256: sha(bytes) }; };
  const decision = file("decision-log.md", "# Decision Log\n\n### D-1 (test)\n- approval_binding: accepted\n\n- status: accepted\n");
  const before = file("before.json", '{"value":1}\n');
  const after = file("after.json", '{"value":2}\n');
  const revert = file("revert.json", '{"value":1}\n');
  const authorityPath = join(root, "workflows/build-plan/steps.json");
  const authorityBytes = readFileSync(authorityPath);
  const targetRef = { project_id: "Demo", target_kind: "stage", target_id: "build-plan", target_version: null, authority_ref: authorityPath, authority_sha256: sha(authorityBytes) };
  const payload = { attempt_id: "attempt-1", edit_record_id: "edit-1", decision_id: "D-1", decision_ref: decision.path, decision_sha256: decision.sha256, approval: true, changed_surface: "workflow", before_facts_ref: before.path, before_facts_sha256: before.sha256, before_observed_at: "2026-08-30T00:00:00Z", after_facts_ref: after.path, after_facts_sha256: after.sha256, after_observed_at: "2026-08-30T01:00:00Z", observed_at: "2026-08-30T02:00:00Z", validation_method: "focused-test", outcome: "regressed", revert_ref: revert.path, revert_sha256: revert.sha256, evidence_refs: ["evidence:1"], supersedes: null, target_ref: targetRef };
  return { storage, facts, payload, cleanup: () => { rmSync(storage, { recursive: true, force: true }); rmSync(facts, { recursive: true, force: true }); } };
}

function run(storage, kind, payload) {
  return spawnSync(process.execPath, [cli, `--root=${storage}`, "--project=Demo", `--record-kind=${kind}`, `--attempt-id=${payload.attempt_id}`, `--json=${JSON.stringify(payload)}`], { encoding: "utf8", cwd: payload.decision_ref ? join(payload.decision_ref, "..") : undefined });
}

describe("M16 ledgers", () => {
  it("records an approved terminal attempted edit as a committed framed batch", () => {
    const fixture = setup();
    try {
      const result = run(fixture.storage, "attempted-edit", fixture.payload);
      expect(result.status, result.stdout).toBe(0);
      const records = readFileSync(join(fixture.storage, "Projects/Demo/attempted-edits.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
      expect(records.map((entry) => entry.record_kind)).toEqual(["batch_begin", "attempted-edit", "batch_commit"]);
      expect(records[0]).toMatchObject({ publication_generation: 1 });
      expect(records[2]).toMatchObject({ count: 1, publication_generation: 1, status: "committed" });
    } finally { fixture.cleanup(); }
  });

  it("rejects every attempted edit without a verified revert reference before writing", () => {
    const fixture = setup();
    try {
      const { revert_ref, revert_sha256, ...payload } = fixture.payload;
      const result = run(fixture.storage, "attempted-edit", payload);
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "invalid_input" });
      expect(existsSync(join(fixture.storage, "Projects/Demo/attempted-edits.jsonl"))).toBe(false);
    } finally { fixture.cleanup(); }
  });

  it("refuses an expired project lock without changing the lock or ledger", () => {
    const fixture = setup();
    try {
      const projectRoot = join(fixture.storage, "Projects", "Demo");
      mkdirSync(projectRoot, { recursive: true });
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
      writeFileSync(lockPath, `${JSON.stringify(lock)}\n`);
      const before = readFileSync(lockPath);
      const result = run(fixture.storage, "attempted-edit", fixture.payload);
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "conflict" });
      expect(readFileSync(lockPath)).toEqual(before);
      expect(existsSync(join(projectRoot, "attempted-edits.jsonl"))).toBe(false);
    } finally { fixture.cleanup(); }
  });

  it("rejects negative results without the frozen D24 identity after classification", () => {
    const fixture = setup();
    try {
      const result = run(fixture.storage, "negative-result", { ...fixture.payload, negative_id: "neg-1", failure_identity: "failure-1", failure_domain: "process", failure_kind: "workflow_regression", evidence_status: "complete", independent_before_after_evidence: true, failure_evidence_refs: ["failure:1"], attempted_edit_id: "edit-1", status: "active" });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "wrong_domain", error: { code: "wrong_domain" } });
      expect(existsSync(join(fixture.storage, "Projects/Demo/negative-results.jsonl"))).toBe(false);
    } finally { fixture.cleanup(); }
  });

  it("rejects a duplicate attempted-edit identity without appending", () => {
    const fixture = setup();
    try {
      const first = run(fixture.storage, "attempted-edit", fixture.payload);
      const path = join(fixture.storage, "Projects/Demo/attempted-edits.jsonl");
      const before = readFileSync(path);
      const second = run(fixture.storage, "attempted-edit", fixture.payload);
      expect(first.status).toBe(0); expect(second.status).not.toBe(0); expect(readFileSync(path)).toEqual(before);
    } finally { fixture.cleanup(); }
  });

  it("rejects an attempted edit with an extra row field before writing any framed bytes", () => {
    const fixture = setup();
    try {
      const result = run(fixture.storage, "attempted-edit", { ...fixture.payload, unexpected: "must-not-be-persisted" });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "failed", error: { code: "failed" } });
      expect(readFileSync(join(fixture.storage, "Projects/Demo/attempted-edits.jsonl"), { encoding: "utf8", flag: "a+" })).toBe("");
    } finally { fixture.cleanup(); }
  });

  it("rejects malformed batch envelopes and rows already present in the ledger", () => {
    const fixture = setup();
    try {
      const path = join(fixture.storage, "Projects/Demo/attempted-edits.jsonl"); mkdirSync(join(fixture.storage, "Projects/Demo"), { recursive: true });
      const batch = "legacy"; const row = { record_kind: "attempted-edit", ledger_batch_id: batch, attempt_id: "legacy", legacy_before_facts: [] };
      const begin = { record_kind: "batch_begin", ledger_kind: "attempted-edit", batch_id: batch, attempt_id: "legacy", publication_generation: 1 };
      const commit = { schema_version: "workflow-evolution.v1", record_kind: "batch_commit", ledger_kind: "attempted-edit", batch_id: batch, attempt_id: "legacy", publication_generation: 2, count: 1, content_hash: sha(canonical([row])), status: "committed" };
      writeFileSync(path, `${JSON.stringify(begin)}\n${JSON.stringify(row)}\n${JSON.stringify(commit)}\n`); const before = readFileSync(path);
      const result = run(fixture.storage, "attempted-edit", fixture.payload);
      expect(result.status).not.toBe(0); expect(JSON.parse(result.stdout)).toMatchObject({ status: "failed" }); expect(readFileSync(path)).toEqual(before);
    } finally { fixture.cleanup(); }
  });

  it("rejects an authenticated abort whose generation does not match the abandoned batch", () => {
    const fixture = setup();
    try {
      const path = join(fixture.storage, "Projects/Demo/attempted-edits.jsonl"); mkdirSync(join(fixture.storage, "Projects/Demo"), { recursive: true });
      const torn = Buffer.from('{"record_kind":"batch_begin"');
      const abort = { schema_version: "workflow-evolution.v1", record_kind: "batch_abort", ledger_kind: "attempted-edit", batch_id: "b", publication_generation: 99, reason: "torn", last_committed_prefix_hash: sha(Buffer.alloc(0)), abandoned_start_offset: 0, observed_suffix_length: torn.length, observed_suffix_hash: sha(torn) };
      writeFileSync(path, Buffer.concat([torn, Buffer.from(`\n${JSON.stringify(abort)}\n`)])); const before = readFileSync(path);
      const result = run(fixture.storage, "attempted-edit", fixture.payload);
      expect(result.status).not.toBe(0); expect(JSON.parse(result.stdout)).toMatchObject({ status: "failed" }); expect(readFileSync(path)).toEqual(before);
    } finally { fixture.cleanup(); }
  });

  it("authenticates a torn terminal batch before appending the next effective head", () => {
    const fixture = setup();
    try {
      expect(run(fixture.storage, "attempted-edit", fixture.payload).status).toBe(0);
      const path = join(fixture.storage, "Projects/Demo/attempted-edits.jsonl"); const prefix = readFileSync(path); const torn = Buffer.from('{"record_kind":"batch_begin","ledger_kind":"attempted-edit"'); appendFileSync(path, torn);
      const corrected = run(fixture.storage, "attempted-edit", { ...fixture.payload, edit_record_id: "edit-2", supersedes: "edit-1" });
      expect(corrected.status, corrected.stdout).toBe(0);
      const bytes = readFileSync(path); expect(bytes.subarray(0, prefix.length)).toEqual(prefix);
      const records = bytes.toString("utf8").split("\n").flatMap((line) => { try { return [JSON.parse(line)]; } catch { return []; } });
      expect(records.filter((entry) => entry.record_kind === "batch_abort")).toHaveLength(1);
      expect(records.filter((entry) => entry.record_kind === "batch_commit")).toHaveLength(2);
    } finally { fixture.cleanup(); }
  });

  it("rejects D24 authority on an attempted edit before any framed write", () => {
    const fixture = setup();
    try {
      const result = run(fixture.storage, "attempted-edit", { ...fixture.payload, d24_boundary: { schema_version: "d24-eval-boundary.v1" } });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "invalid_input" });
      expect(readFileSync(join(fixture.storage, "Projects/Demo/attempted-edits.jsonl"), { encoding: "utf8", flag: "a+" })).toBe("");
    } finally { fixture.cleanup(); }
  });

  it("rejects a target authority hash mismatch before writing", () => {
    const fixture = setup();
    try {
      const result = run(fixture.storage, "attempted-edit", { ...fixture.payload, target_ref: { ...fixture.payload.target_ref, authority_sha256: "0".repeat(64) } });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "stale_source" });
      expect(readFileSync(join(fixture.storage, "Projects/Demo/attempted-edits.jsonl"), { encoding: "utf8", flag: "a+" })).toBe("");
    } finally { fixture.cleanup(); }
  });

  it("rejects a validly hashed target authority that is not the current repository manifest", () => {
    const fixture = setup();
    try {
      const authority = join(fixture.facts, "foreign-stage-manifest.json");
      const bytes = '{"stage":"build-plan","version":"2.0.0"}\n';
      writeFileSync(authority, bytes);
      const result = run(fixture.storage, "attempted-edit", { ...fixture.payload, target_ref: { ...fixture.payload.target_ref, authority_ref: authority, authority_sha256: sha(bytes) } });
      expect(result.status).not.toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ status: "stale_source" });
      expect(existsSync(join(fixture.storage, "Projects/Demo/attempted-edits.jsonl"))).toBe(false);
    } finally { fixture.cleanup(); }
  });

  it("writes a superseding attempted-edit record that validates against the published schema", () => {
    const fixture = setup();
    try {
      expect(run(fixture.storage, "attempted-edit", fixture.payload).status).toBe(0);
      const corrected = run(fixture.storage, "attempted-edit", { ...fixture.payload, edit_record_id: "edit-2", supersedes: "edit-1" });
      expect(corrected.status, corrected.stdout).toBe(0);
      const row = JSON.parse(corrected.stdout).record;
      const schema = JSON.parse(readFileSync(join(root, "runtime/schemas/workflow-evolution.v1.json"), "utf8"));
      const validate = new Ajv2020({ strict: false }).compile(schema.$defs.attempted_edit);
      expect(validate(row), validate.errors).toBe(true);
      expect(row).toMatchObject({ schema_version: "workflow-evolution.v1", record_kind: "attempted-edit", edit_record_id: "edit-2", record_id: "edit-2", supersedes: "edit-1" });
    } finally { fixture.cleanup(); }
  });

  it("rejects caller-asserted approval when the decision entry is not accepted", () => {
    const fixture = setup();
    try {
      writeFileSync(fixture.payload.decision_ref, "# Decision Log\n\n### D-1\n- approval_binding: pending\n");
      const payload = { ...fixture.payload, decision_sha256: sha(readFileSync(fixture.payload.decision_ref)) };
      const result = run(fixture.storage, "attempted-edit", payload);
      expect(result.status).not.toBe(0);
      expect(existsSync(join(fixture.storage, "Projects/Demo/attempted-edits.jsonl"))).toBe(false);
    } finally { fixture.cleanup(); }
  });

  it("does not treat notes, comments, or quoted text as a structured approval", () => {
    for (const binding of [
      "- note: approval_binding: accepted",
      "<!-- - approval_binding: accepted -->",
      "- approval_binding: \"accepted\"",
    ]) {
      const fixture = setup();
      try {
        writeFileSync(fixture.payload.decision_ref, `# Decision Log\n\n### D-1\n${binding}\n`);
        const payload = { ...fixture.payload, decision_sha256: sha(readFileSync(fixture.payload.decision_ref)) };
        const result = run(fixture.storage, "attempted-edit", payload);
        expect(result.status).not.toBe(0);
        expect(JSON.parse(result.stdout)).toMatchObject({ status: "stale_source" });
        expect(existsSync(join(fixture.storage, "Projects/Demo/attempted-edits.jsonl"))).toBe(false);
      } finally { fixture.cleanup(); }
    }
  });

  it("rejects a negative result until a torn attempted-edit tail is recovered and rebound", async () => {
    const fixture = setup();
    try {
      expect(run(fixture.storage, "attempted-edit", fixture.payload).status).toBe(0);
      appendFileSync(join(fixture.storage, "Projects/Demo/attempted-edits.jsonl"), '{"record_kind":"batch_begin"');
      const { D24_EVAL_BOUNDARY } = await import("../../runtime/evidence/workflow-evolution.mjs");
      const result = run(fixture.storage, "negative-result", { ...fixture.payload, negative_id: "neg-1", failure_identity: "failure-1", failure_domain: "process", failure_kind: "workflow_regression", evidence_status: "complete", independent_before_after_evidence: true, failure_evidence_refs: ["failure:1"], attempted_edit_id: "edit-1", status: "active", d24_boundary: D24_EVAL_BOUNDARY });
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout).record.attempted_edit_head_sha256).toMatch(/^[a-f0-9]{64}$/);
    } finally { fixture.cleanup(); }
  });
});
