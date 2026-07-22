import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PACKET_SOURCE_PREFIX, loadTrustedThirdReviewConfig, selectTrustedReviewProviders } from "../third-review-host-config.mjs";

const roots = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

function configuredRoot() {
  const root = mkdtempSync(join(tmpdir(), "wh-review-host-config-")); roots.push(root);
  const packetRoot = join(root, "packets"); const home = join(root, "home"); const brokerConfig = join(root, "3rd-review.json");
  mkdirSync(packetRoot); mkdirSync(join(home, ".workflowhub"), { recursive: true });
  writeFileSync(brokerConfig, JSON.stringify({
    version: 4,
    tiers: [["opencode", "kimi"], ["claude-code", "codex"]],
    providers: {
      opencode: { enabled: true }, kimi: { enabled: true },
      "claude-code": { enabled: true }, codex: { enabled: true },
    },
    attachment_roots: [{ root: packetRoot, sources: [PACKET_SOURCE_PREFIX] }],
  }));
  const hostConfig = join(home, ".workflowhub", "config.json");
  writeFileSync(hostConfig, JSON.stringify({ task_dir: root, third_review: { command: [process.execPath, "/broker/scripts/3rd-review.mjs"], config: brokerConfig, attachment_root: packetRoot } }));
  return { packetRoot, brokerConfig, hostConfig };
}

describe("trusted third-review host configuration", () => {
  it("loads one canonical packet root only when the broker allowlist accepts its packet source", () => {
    const { packetRoot, brokerConfig, hostConfig } = configuredRoot();
    expect(loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig })).toEqual({ command: [process.execPath, "/broker/scripts/3rd-review.mjs"], config: realpathSync(brokerConfig), attachmentRoot: realpathSync(packetRoot), attachmentSource: PACKET_SOURCE_PREFIX });
  });

  it("fails loud when the broker allowlist omits the fixed packet source", () => {
    const { brokerConfig, hostConfig } = configuredRoot();
    writeFileSync(brokerConfig, JSON.stringify({ version: 4, attachment_roots: [{ root: join(brokerConfig, "..", "packets"), sources: ["skills"] }] }));
    expect(() => loadTrustedThirdReviewConfig({ hostConfigPath: hostConfig })).toThrow(/packet source.*allowlisted/i);
  });

  it("selects every enabled heterologous provider in the first configured tier", () => {
    const { brokerConfig } = configuredRoot();
    expect(selectTrustedReviewProviders(brokerConfig, "codex")).toEqual(["opencode", "kimi"]);
    expect(selectTrustedReviewProviders(brokerConfig, "opencode")).toEqual(["kimi"]);
  });

  it("moves to the next configured tier only when the earlier tier has no eligible provider", () => {
    const { brokerConfig } = configuredRoot();
    const config = JSON.parse(readFileSync(brokerConfig, "utf8"));
    config.providers.opencode.enabled = false;
    config.providers.kimi.enabled = false;
    writeFileSync(brokerConfig, JSON.stringify(config));
    expect(selectTrustedReviewProviders(brokerConfig, "codex")).toEqual(["claude-code"]);
  });
});
