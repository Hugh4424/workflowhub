import { afterEach, expect, test } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTrustedThirdReviewConfig } from "../../skills/wh-review/scripts/third-review-host-config.mjs";
import yaml from "js-yaml";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

test("the real skill checker consumes third-review from skills rather than capability decisions", () => {
  const catalog = yaml.load(readFileSync(new URL("../../skills/catalog.yaml", import.meta.url), "utf8"));
  expect(catalog.skills.filter(entry => entry.name === "third-review")).toEqual([
    expect.objectContaining({ path: "skills/third-review/SKILL.md", local_version: "4.0.0", status: "native" }),
  ]);
  expect(catalog.capability_decisions.some(entry => entry.name === "third-review")).toBe(false);
});

test("temporary host configuration starts the migrated broker doctor", () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "card09-host-path-"))); roots.push(root);
  const attachmentRoot = join(root, "packets"); mkdirSync(attachmentRoot);
  const example = fileURLToPath(new URL("../../skills/third-review/config.example.json", import.meta.url));
  const config = JSON.parse(readFileSync(example, "utf8"));
  config.attachment_roots = [{ root: attachmentRoot, sources: [".wh-review-packets"] }];
  config.runtime.root = join(root, "runtime");
  const brokerConfig = join(root, "broker.json"); writeFileSync(brokerConfig, JSON.stringify(config));
  const script = fileURLToPath(new URL("../../skills/third-review/scripts/3rd-review.mjs", import.meta.url));
  const hostConfigPath = join(root, "host.json");
  writeFileSync(hostConfigPath, JSON.stringify({ third_review: { command: [process.execPath, script], config: brokerConfig, attachment_root: attachmentRoot } }));
  const trusted = loadTrustedThirdReviewConfig({ hostConfigPath });
  expect(trusted.command[1]).toBe(script);
  const result = spawnSync(trusted.command[0], [...trusted.command.slice(1), "doctor", `--config=${trusted.config}`], { encoding: "utf8", timeout: 10_000 });
  expect(result.error).toBeUndefined();
  expect(result.stderr).not.toMatch(/wh_review\.(profiles|priority)/);
  expect(result.status).toBe(0);
  expect(JSON.parse(result.stdout)).toBeTypeOf("object");
});
