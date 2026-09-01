import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
const root = join(import.meta.dirname, "../..");
describe("M16 skill update receipt", () => {
  it("does not claim an update check when no caller-owned receipt is supplied", () => {
    const result = spawnSync(process.execPath, [join(root, "tools/cli/check-skill-updates.mjs")], { encoding: "utf8" });
    expect(result.status).toBe(0); expect(JSON.parse(result.stdout)).toMatchObject({ status: "not_checked", checked: false });
  });

  it("binds an upstream response URL and raw bytes hash into the durable receipt", () => {
    const dir = mkdtempSync(join(tmpdir(), "m16-skill-check-"));
    try {
      const bytes = JSON.stringify({ skill_id: "demo", version: "2", content_sha256: "2".repeat(64) });
      const installed = join(dir, "installed.json"); const catalog = join(dir, "catalog.json"); const receipts = join(dir, "receipts");
      writeFileSync(installed, JSON.stringify({ skill_id: "demo", version: "1", content_sha256: "1".repeat(64) }));
      writeFileSync(catalog, JSON.stringify({ skill_id: "demo", version: "1", content_sha256: "1".repeat(64) }));
      const url = `data:application/json,${encodeURIComponent(bytes)}`;
      const result = spawnSync(process.execPath, [join(root, "tools/cli/check-skill-updates.mjs"), `--installed=${installed}`, `--catalog-entry=${catalog}`, `--receipt-root=${receipts}`, "--network=allow", "--now=2026-08-31T00:00:00Z", `--upstream-url=${url}`, "--timeout-ms=100"], { encoding: "utf8" });
      expect(result.status, result.stdout).toBe(0);
      const value = JSON.parse(result.stdout);
      expect(value).toMatchObject({ status: "update_available", upstream_url: url, upstream_response_sha256: createHash("sha256").update(bytes).digest("hex") });
      expect(JSON.parse(readFileSync(value.receipt_path, "utf8"))).toMatchObject({ upstream_url: url, upstream_response_sha256: value.upstream_response_sha256 });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
