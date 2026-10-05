import assert from "node:assert/strict";
import { test } from "vitest";
import codex from "../lib/adapters/codex.mjs";
import { planDelivery } from "../lib/attachments.mjs";

test("Codex negotiated delivery keeps a large sealed packet out of the prompt", () => {
  assert.equal(codex.runFromWritableRoot, true);
  const contents = Buffer.alloc(1_600_000, "x");
  const manifestHash = "a".repeat(64);
  const checked = {
    requested_delivery: "negotiated",
    entries: [{ target: "changes.diff", sha256: "b".repeat(64), size: contents.length, embed: false }],
    files: [{ target: "changes.diff", sha256: "b".repeat(64), size: contents.length, embed: false }],
    content_entries: [{ target: "changes.diff", contents }],
    manifest_hash: manifestHash,
    total_bytes: contents.length,
  };

  const planned = planDelivery(codex, checked, "Read the sealed bundle in the working directory.", 4_000_000, { requireTriad: false });
  assert.equal(planned.delivery_mode, "file_only");
  assert.equal(planned.provider_prompt, "Read the sealed bundle in the working directory.");
  assert.equal(planned.material_total_bytes, contents.length);
  assert.equal(planned.material_manifest_hash, manifestHash);
  assert.ok(Buffer.byteLength(planned.provider_prompt, "utf8") < 1_048_576);
});
