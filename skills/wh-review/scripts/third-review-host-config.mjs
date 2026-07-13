import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";

export const PACKET_SOURCE_PREFIX = ".wh-review-packets";

function regularFile(path, label) {
  if (!isAbsolute(path)) throw new Error(`${label} must be an absolute path`);
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`${label} must be a real regular file`);
  return realpathSync(path);
}

function realDirectory(path, label) {
  if (!isAbsolute(path)) throw new Error(`${label} must be an absolute path`);
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${label} must be a real directory`);
  return realpathSync(path);
}

function hostConfigPath() { return join(process.env.HOME || homedir(), ".workflowhub", "config.json"); }
function readJson(path, label) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { throw new Error(`${label} is invalid JSON: ${error.message}`); }
}

function command(value) {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item)) return [...value];
  throw new Error("workflowhub host third_review.command must be a command string or non-empty argv array");
}

function verifyPacketAllowlist(configPath, attachmentRoot) {
  const config = readJson(configPath, "3rd-review config");
  const entry = Array.isArray(config?.attachment_roots)
    ? config.attachment_roots.find((item) => typeof item?.root === "string" && (() => {
      try { return realDirectory(item.root, "3rd-review attachment_roots.root") === attachmentRoot; } catch { return false; }
    })())
    : null;
  if (!entry || !Array.isArray(entry.sources) || !entry.sources.includes(PACKET_SOURCE_PREFIX)) throw new Error(`fixed packet source ${PACKET_SOURCE_PREFIX} is not allowlisted for the configured attachment root`);
}

/**
 * Resolve broker execution data from the host-owned WorkflowHub config only.
 * CLI/workflow input has no authority to replace command, broker config, or
 * the fixed packet root.
 */
export function loadTrustedThirdReviewConfig({ hostConfigPath: configuredPath = hostConfigPath() } = {}) {
  const path = regularFile(configuredPath, "workflowhub host config");
  const config = readJson(path, "workflowhub host config");
  const thirdReview = config?.third_review;
  if (!thirdReview || typeof thirdReview !== "object" || Array.isArray(thirdReview)) throw new Error("workflowhub host config requires third_review");
  const configPath = regularFile(thirdReview.config, "workflowhub host third_review.config");
  const attachmentRoot = realDirectory(thirdReview.attachment_root, "workflowhub host third_review.attachment_root");
  verifyPacketAllowlist(configPath, attachmentRoot);
  return { command: command(thirdReview.command), config: configPath, attachmentRoot, attachmentSource: PACKET_SOURCE_PREFIX };
}
