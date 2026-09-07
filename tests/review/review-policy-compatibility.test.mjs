import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PACKET_SOURCE_PREFIX, loadTrustedThirdReviewConfig, migrateWhReviewConfig, resolveTrustedReviewRoute, restoreWhReviewConfig, selectTrustedReviewProviderSelection } from "../../skills/wh-review/scripts/third-review-host-config.mjs";

const roots = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-review-policy-"));
  roots.push(root);
  const packetRoot = join(root, "packets");
  const runtimeRoot = join(root, "runtime");
  const brokerPath = join(root, "3rd-review.json");
  const hostPath = join(root, "workflowhub.json");
  mkdirSync(packetRoot);
  mkdirSync(runtimeRoot);
  writeFileSync(brokerPath, JSON.stringify({
    version: 4,
    tiers: [["kimi/coding", "grok/grok"]],
    runtime: { root: runtimeRoot },
    providers: {
      "kimi/coding": { enabled: true, model: "kimi-v1", effort: null, thinking: true, source_id: "kimi-source" },
      "grok/grok": { enabled: true, model: "grok-v1", effort: "high", thinking: null, source_id: "grok-source" },
    },
    attachment_roots: [{ root: packetRoot, sources: [PACKET_SOURCE_PREFIX] }],
  }));
  writeFileSync(hostPath, JSON.stringify({
    task_dir: root,
    third_review: { command: [process.execPath, "broker.mjs"], config: brokerPath, attachment_root: packetRoot },
    wh_review: {
      version: 2,
      stages: { "build-code": { initial: ["grok/grok", "kimi/coding"], mode: "full_only", minimum_heterologous: 1 } },
    },
  }));
  return { root, brokerPath, hostPath };
}

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

describe("review policy single-source compatibility", () => {
  it("loads a route without WorkflowHub profiles and keeps explicit provider order", () => {
    const { brokerPath, hostPath } = fixture();
    const trusted = loadTrustedThirdReviewConfig({ hostConfigPath: hostPath });
    const route = resolveTrustedReviewRoute(trusted.whReview, "build-code");
    expect(route).toMatchObject({ initial: ["grok/grok", "kimi/coding"], mode: "full_only" });
    const selected = selectTrustedReviewProviderSelection(brokerPath, "codex/coding", route);
    expect(selected.providers).toEqual(["grok/grok", "kimi/coding"]);
    expect(selected.effectiveProfiles).toEqual([
      expect.objectContaining({ provider: "grok/grok", model: "grok-v1" }),
      expect.objectContaining({ provider: "kimi/coding", model: "kimi-v1" }),
    ]);
    expect(route).not.toHaveProperty("profile_priorities");
  });

  it("rejects the retired duplicate profiles declaration with a migration diagnostic", () => {
    const { hostPath } = fixture();
    const host = JSON.parse(readFileSync(hostPath, "utf8"));
    host.wh_review.profiles = { "grok/grok": { model: "stale", effort: "high", thinking: null, priority: 1 } };
    writeFileSync(hostPath, JSON.stringify(host));
    expect(() => loadTrustedThirdReviewConfig({ hostConfigPath: hostPath }))
      .toThrow(/wh_review\.profiles.*not supported|migrat/i);
  });

  it("keeps the migration target untouched for invalid hashes and missing backups", () => {
    const { hostPath } = fixture();
    const before = readFileSync(hostPath);
    const backupPath = join(roots[0], "config.backup");
    expect(() => migrateWhReviewConfig({ configPath: hostPath, backupPath, expectedHash: "0".repeat(64) }))
      .toThrow(/CONFIG_RESTORE_CONFLICT|changed before migration/i);
    expect(readFileSync(hostPath)).toEqual(before);
    expect(() => restoreWhReviewConfig({
      configPath: hostPath,
      backupPath: join(roots[0], "missing.backup"),
      expectedCurrentHash: hash(before),
      expectedBackupHash: hash(before),
    })).toThrow(/regular file|backup/i);
  });
});
