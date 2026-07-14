import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertAuditEvidence, auditE2eOptions } from "../run-wh-review-audit-e2e.mjs";

const script = fileURLToPath(new URL("../run-wh-review-audit-e2e.mjs", import.meta.url));

describe("run-wh-review-audit-e2e", () => {
  it("skips before touching task or provider state unless explicitly enabled", () => {
    const result = spawnSync(process.execPath, [script], { encoding: "utf8", env: { PATH: process.env.PATH ?? "" } });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ status: "SKIP", reason: "WH_REVIEW_AUDIT_E2E=1 is required" });
  });

  it("requires source and task paths but never hard-codes a historical file count", () => {
    expect(() => auditE2eOptions({ WH_REVIEW_AUDIT_E2E: "1" })).toThrow("WH_REVIEW_AUDIT_SOURCE is required");
    const source = readFileSync(script, "utf8");
    expect(source).toContain("auditMaterial.changed_files.length");
    expect(source).not.toMatch(/(?:93|96) files/);
    expect(source).toContain('provider_allowlist: ["kimi", "opencode"]');
    expect(source).toContain("THIRD_REVIEW_SOURCE_ROOT");
  });

  it("requires both file-only providers, host hashes, sessions, and all three raw markers", () => {
    const root = mkdtempSync(join(tmpdir(), "audit-e2e-evidence-"));
    const markers = ["BEGIN", "MIDDLE", "END"];
    const padding = "x".repeat(100); const unified_diff = `BEGIN${padding}${padding}MIDDLE${padding}${padding}END`;
    const packet = { packet_hash: "a".repeat(64), diff_sha256: "b".repeat(64), changed_files: Array.from({ length: 6 }, (_, index) => ({ path: String(index) })), unified_diff };
    const outcomes = [];
    for (const id of ["kimi", "opencode"]) {
      const raw = join(root, `${id}.raw`); writeFileSync(raw, `${markers.join(" ")}\n`);
      const sha = createHash("sha256").update(readFileSync(raw)).digest("hex");
      const provider_visible_attachment_manifest = ["test-strategy.md", "requirements-ledger.json", "requirements-coverage.json"].map((name) => ({ destination: `evidence/${name}`, sha256: "d".repeat(64), size: 1 }));
      outcomes.push({ provider: id, transport_status: "completed", packet_status: "complete", business_valid: true, delivery_used: "file_only", session_id: `${id}-session`, raw_stdout_ref: raw, raw_stdout_sha256: sha, delivery: { derived_attestation: { packet_hash: packet.packet_hash, diff_sha256: packet.diff_sha256, delivery_manifest_hash: "c".repeat(64) }, provider_visible_attachment_manifest } });
    }
    expect(assertAuditEvidence({ receipt: { provider_outcomes: outcomes }, packet, auditScopeFiles: 3, markers })).toMatchObject({ kimi: { session_id: "kimi-session" }, opencode: { session_id: "opencode-session" } });
  });
});
