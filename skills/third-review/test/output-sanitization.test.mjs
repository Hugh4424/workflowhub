import assert from "node:assert/strict";
import { test } from "vitest";
import { sanitizeProviderWorkspacePaths } from "../lib/broker.mjs";
import { projectWorkflowHubMemberV3 } from "../lib/workflowhub-result-v3.mjs";

const workspace = "/tmp/3rd-review/runtime-v3/work/grok%2Fgrok";
const workspaceReal = "/private/tmp/3rd-review/runtime-v3/work/grok%2Fgrok";
const workspacePaths = [workspace, workspaceReal];

test("sanitize rewrites the workspace bundle prefix to a relative path", () => {
  const output = sanitizeProviderWorkspacePaths(`review is in ${workspace}/bundle/review-instructions.md`, workspacePaths);
  assert.equal(output, "review is in bundle/review-instructions.md");
});

test("sanitize rewrites any workspace prefix (materials included) to its relative form", () => {
  const output = sanitizeProviderWorkspacePaths(`read ${workspaceReal}/materials/rules.md before judging`, workspacePaths);
  assert.equal(output, "read materials/rules.md before judging");
});

test("sanitize leaves unrelated absolute host paths untouched", () => {
  const input = "cannot read /Users/hugh/secret or /var/lib/host or file:///home/private";
  assert.equal(sanitizeProviderWorkspacePaths(input, workspacePaths), input);
});

test("sanitize does not rewrite a longer sibling path sharing the workspace prefix", () => {
  const input = `copy ${workspace}2/bundle/x.md instead`; // `workspace2` is a sibling directory, not a prefix target
  assert.equal(sanitizeProviderWorkspacePaths(input, workspacePaths), input);
});

test("sanitize rewrites a bare workspace directory at end of text to a relative dot", () => {
  assert.equal(sanitizeProviderWorkspacePaths(`cd ${workspace}`, workspacePaths), "cd .");
});

test("sanitize is idempotent", () => {
  const input = `see ${workspace}/bundle/review-instructions.md and ${workspaceReal}/materials/rules.md`;
  const once = sanitizeProviderWorkspacePaths(input, workspacePaths);
  assert.equal(sanitizeProviderWorkspacePaths(once, workspacePaths), once);
});

test("sanitize passes non-string output through unchanged", () => {
  assert.equal(sanitizeProviderWorkspacePaths(null, workspacePaths), null);
  assert.equal(sanitizeProviderWorkspacePaths(42, workspacePaths), 42);
});

test("public member projection rejects raw workspace paths and accepts sanitized output", () => {
  const context = {
    runtime_id: "runtime-v3",
    material_id: "material-sha",
    contract_id: "contract-sha",
    contract_hash: "contract-sha",
    semantic_hash: "semantic-sha",
    config_id: "config-sha",
    source_id: "grok/grok",
    attempts: [
      { attempt_id: "attempt-1", kind: "initial", status: "completed", started_at_ms: 100, completed_at_ms: 110, duration_ms: 10, session_id: "session-1", error: null, provider_retry_count: 0 },
    ],
  };
  const raw = `${workspaceReal}/bundle/review-instructions.md\n${workspace}/materials/rules.md`;
  assert.throws(
    () => projectWorkflowHubMemberV3({ provider: "grok/grok", adapter: "grok", status: "completed", output: raw }, context),
    { code: "PUBLIC_RESULT_INVALID" },
  );
  const member = projectWorkflowHubMemberV3({ provider: "grok/grok", adapter: "grok", status: "completed", output: sanitizeProviderWorkspacePaths(raw, workspacePaths) }, context);
  assert.equal(member.output, "bundle/review-instructions.md\nmaterials/rules.md");
});
