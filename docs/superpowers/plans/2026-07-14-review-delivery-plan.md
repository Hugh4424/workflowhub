# Review Delivery Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver complete, hash-bound review material through a provider-specific delivery plan before rendering any prompt, while preserving uncommitted review snapshots and exactly one final ordinary Git commit.

**Architecture:** `3rd-review` owns attachment validation, provider-isolated workspaces, delivery negotiation, and delivery records. `workflowhub` seals one complete provider-visible triad (`review-packet.v1.json`, `changes.diff`, `manifest.json`) and asks the broker to deliver it; it never chunks material to evade an embedding limit. Both Kimi and OpenCode use `file_only`; `always_embed` is retained only as a fail-closed bounded mode.

**Tech Stack:** Node.js ESM, Git temporary index snapshots, SHA-256 manifests, Node test runner/Vitest, 3rd-review V4 broker.

---

## Non-negotiable invariants

- Build and persist a provider delivery plan before rendering a provider prompt.
- `file_only` never calls embedded rendering. The provider process is constrained by a real OS/CLI path ACL to the broker-created attachment workspace plus minimum runtime/auth files; only a fixed, root-owned system sandbox policy may authorize its wrapper. A broker probe is deployment health checking, not the trust root. When that policy or a verified wrapper is unavailable it fails as `ATTACHMENT_SANDBOX_UNAVAILABLE`, never as a prompt-only approximation.
- The provider-visible triad is complete and cross-bound: `review-packet.v1.json`, `changes.diff`, and `manifest.json` include/verify packet, diff, manifest hashes, names, sizes, SHA-256 values, and coverage.
- `always_embed` measures the final rendered UTF-8 prompt once. More than 524288 bytes produces `MATERIAL_TOO_LARGE`, no provider semantic verdict, no aggregate/pass, and no continuation verdict.
- No diff chunks are used as a size bypass. A provider without a viable delivery mode receives material failure, not a semantic outcome.
- Raw source material remains private. The broker deterministically replaces registered sensitive host roots, rebuilds the provider-visible triad, and fails closed if any registered root remains.
- Only host disposition of raw provider output may publish a semantic verdict. Delivery success, a copied attachment, or a provider process exit never implies pass.
- R2 reuses the flow/session and verifies the frozen initial-material hash plus an independent complete delta triad/delivery record. `verify-final` still precedes the sole ordinary `git add -A && git commit`.

## Phase 1 — 3rd-review: explicit delivery plan and file-only triad

**Repository:** `/Users/Hugh/Hugh/Project/3rd-review-delivery-mode`

**Files:**
- Create: `lib/delivery-plan.mjs`
- Modify: `lib/attachments.mjs`
- Modify: `lib/broker.mjs`
- Modify: `lib/adapters/opencode.mjs`
- Modify: `lib/adapters/kimi.mjs`
- Test: `test/attachments-protocol.test.mjs`
- Test: `test/delivery-outcome.test.mjs`
- Test: `test/opencode-delivery.test.mjs`

- [ ] **Step 1: Add red tests for a complete `file_only` triad.**

```js
const plan = buildDeliveryPlan({ provider: opencode, delivery: "file_only", attachments });
expect(plan.delivery_mode).toBe("file_only");
expect(plan.material_total_bytes).toBeGreaterThan(524288);
expect(plan.provider_visible_attachment_manifest.entries.map((x) => x.destination))
  .toEqual(expect.arrayContaining(["review-packet.v1.json", "changes.diff", "manifest.json"]));
expect(renderEmbedded).not.toHaveBeenCalled();
```

Also assert missing triad names, duplicate destinations, byte-size/SHA mismatch, `manifest.json` coverage mismatch, or disagreement between `packet_hash`, `diff_sha256`, and `manifest_hash` produces `MATERIAL_INCOMPLETE` before a provider process starts.

- [ ] **Step 2: Run the focused tests (RED).**

Run: `node --test test/attachments-protocol.test.mjs test/delivery-outcome.test.mjs test/opencode-delivery.test.mjs`

Expected: FAIL because attachments are rendered during generic validation and OpenCode only supports `always_embed`.

- [ ] **Step 3: Implement `buildDeliveryPlan` before prompt construction.**

```js
export function buildDeliveryPlan({ provider, delivery, frozen }) {
  const visible = verifyReviewTriad(frozen);
  return {
    delivery_mode: delivery,
    material_manifest_hash: visible.manifest_hash,
    material_total_bytes: visible.total_bytes,
    provider_visible_attachment_manifest: visible,
    attachment_ids: visible.entries.map(({ destination, sha256 }) => ({ destination, sha256 })),
  };
}
```

`verifyReviewTriad` must read only broker-frozen files, require exactly one packet/diff/inner-manifest triad, recompute canonical packet and inner-manifest SHA-256 values, verify every referenced name/size/SHA, and bind inner packet fields back to the diff and manifest. It must not render text.

- [ ] **Step 4: Make rendering delivery-specific.**

Move embedded construction out of `validateAttachments` and frozen attachment verification. In `broker.mjs`, negotiate provider delivery first, create the delivery plan, and then:

```js
if (plan.delivery_mode === "file_only") {
  cwd = prepareWritableAttachmentView(runtime, provider.id, state.attachments).cwd;
  prompt = fileOnlyInstruction(plan.attachment_ids, plan.material_manifest_hash);
} else {
  prompt = renderFinalEmbeddedPrompt(basePrompt, frozen);
  if (Buffer.byteLength(prompt, "utf8") > 512 * 1024) {
    throw new ReviewError("MATERIAL_TOO_LARGE", "final embedded review material exceeds 524288 bytes");
  }
}
```

`fileOnlyInstruction` names only attachment IDs and the manifest hash; it must contain no raw diff, source path, worktree path, or host path. `MATERIAL_TOO_LARGE` must be stored as material failure with `semantic_verdict: null`, no session, no continuation eligibility, and no aggregate result.

- [ ] **Step 5: Make OpenCode real `file_only`.**

Change the OpenCode adapter capability to `file_only`. Launch it through a real path ACL/OS sandbox that makes a broker-created workspace the only provider-readable material root. Authorize the wrapper only from a fixed root-owned, non-symlink, non-writable system policy; freeze and fingerprint command/args/SHA/virtual root at load time. A run-level probe must read a virtual-root marker and reject two generated host sentinels plus the repository root, but that probe is only a health check for the already-trusted wrapper. Its provider instruction uses only relative attachment IDs or the wrapper's virtual root, beginning with `manifest.json`; it may not use Git, host source paths, or a worktree. Apply the same requirement to Kimi. If the system policy or wrapper is unavailable, return `ATTACHMENT_SANDBOX_UNAVAILABLE`. Do not add a multi-message protocol in this phase.

- [ ] **Step 6: Add delivery state and continuation checks.**

Persist `{ delivery_mode, material_manifest_hash, material_total_bytes, provider_visible_attachment_manifest }` per provider in broker state. Permit a continuation to attach a separately frozen delta triad; retain and verify the initial material record, construct/verify the delta record, preserve the same provider session, and reject a missing, altered, or unordered delta as `MATERIAL_INCOMPLETE`. Never treat delivery state as a disposition.

- [ ] **Step 7: Run GREEN and commit.**

Run: `node --test test/attachments-protocol.test.mjs test/delivery-outcome.test.mjs test/opencode-delivery.test.mjs`

Expected: PASS, including a 427KB+ `file_only` fixture whose first/middle/last diff markers are absent from stdin and readable only in the attachment workspace.

```bash
git add lib test
git commit -m "feat: plan provider review material delivery"
```

## Phase 2 — workflowhub: seal provider-visible material and fail closed on paths

**Repository:** `/Users/Hugh/Hugh/Project/workflowhub-delivery-mode`

**Files:**
- Modify: `skills/wh-review/scripts/review-round-facade.mjs`
- Modify: `skills/wh-review/scripts/review-prompt.mjs`
- Modify: `skills/wh-review/scripts/source-tree.mjs`
- Modify: `skills/wh-review/scripts/broker-client.mjs`
- Modify: `skills/wh-review/scripts/__tests__/review-round-facade.test.mjs`
- Modify: `skills/wh-review/scripts/__tests__/source-tree.test.mjs`
- Modify: `skills/wh-review/scripts/__tests__/broker-client.test.mjs`
- Modify: `tests/wh-review-v4-workflow-wiring.test.mjs`

- [ ] **Step 1: Add RED tests for a sealed provider-visible manifest.**

```js
const prepared = await facade.prepare(input);
const manifest = await readJson(prepared.private_paths.provider_manifest);
expect(manifest.files).toEqual(expect.arrayContaining([
  expect.objectContaining({ destination: "review-packet.v1.json" }),
  expect.objectContaining({ destination: "changes.diff" }),
]));
expect(manifest.packet_hash).toBe(prepared.packet.packet_hash);
expect(manifest.diff_sha256).toBe(prepared.packet.diff_sha256);
expect(prepared.attachments.entries.every((entry) => entry.embed === false)).toBe(true);
expect(prepared.request.prompt).not.toContain("R1_DIFF_MARKER");
```

Add failure cases for a missing/forged provider manifest, absolute path in tracked or untracked diff material, and a 427KB+ file-only packet. Assert no broker call, no public aggregate/pass, and `semantic_verdict === null` on material failure.

- [ ] **Step 2: Run focused RED tests.**

Run: `npx vitest run skills/wh-review/scripts/__tests__/source-tree.test.mjs skills/wh-review/scripts/__tests__/review-round-facade.test.mjs skills/wh-review/scripts/__tests__/broker-client.test.mjs tests/wh-review-v4-workflow-wiring.test.mjs`

Expected: FAIL because the provider manifest is private-only, all attachments are `embed:true`, and no source path policy exists.

- [ ] **Step 3: Build material first, then a delivery-aware prompt.**

Freeze packet/diff/contracts/schema/skills, then create and freeze `manifest.json` as a provider-visible inner manifest. Avoid self-reference: its `files` list covers packet/diff/contracts/schema/skills and its own SHA is carried only by the outer broker manifest. The inner manifest binds `packet_hash`, `manifest_hash`, `diff_sha256`, changed files, total bytes, and each file destination/size/SHA.

For `file_only`, construct only a short instruction with attachment IDs plus manifest hash after the material plan exists. For `always_embed`, hand the same complete frozen material to the broker and let the broker apply its whole-final-prompt gate. Remove every production diff chunk path.

- [ ] **Step 4: Keep raw paths private and delegate registered-root derivation to the broker.**

WorkflowHub does not guess arbitrary path syntax or reject historical deletion lines. It submits the exact raw triad, then accepts semantics only when the broker's private attestation binds that raw material hash to a complete derived triad.

- [ ] **Step 5: Preserve verdict boundaries and R2 integrity.**

Record delivery mode/material hashes/private visible manifest only in private receipt state. Require broker delivery record plus raw provider output before `#outcome` can be business-valid. R2 must retain the initial material hash, verify full delta triad, and reuse runtime/session; material failure must leave no continuation semantic verdict. Leave `verifyFinal` and verify-code's single post-pass commit sequence unchanged.

- [ ] **Step 6: Run GREEN and commit.**

Run: `npx vitest run skills/wh-review/scripts/__tests__/source-tree.test.mjs skills/wh-review/scripts/__tests__/review-round-facade.test.mjs skills/wh-review/scripts/__tests__/broker-client.test.mjs tests/wh-review-v4-workflow-wiring.test.mjs`

Expected: PASS. The `provider_allowlist` preparation path must enter the broker client without a `providerId` reference error.

```bash
git add skills/wh-review tests
git commit -m "feat(wh-review): seal file-only review delivery"
```

## Phase 3 — cross-repository contract tests and real smoke

**Repositories:** both delivery-mode worktrees

**Files:**
- Modify: `scripts/run-wh-review-provider-smoke.mjs`
- Modify: `scripts/__tests__/run-wh-review-provider-smoke.test.mjs`
- Modify: `docs/adr/0002-v4-review-exception-state-matrix.md`
- Modify: `3rd-review/docs/exceptions.md`
- Modify: `3rd-review/docs/adr/0001-v4-cli-contract.md`

- [ ] **Step 1: Add RED cross-boundary tests.**

Create a 427KB+ fixture containing distinct first/middle/last markers. Assert Kimi and OpenCode file-only requests have no diff marker in stdin, their raw outputs echo all three markers plus packet/diff/manifest hashes, and evidence includes each provider's delivery record. Assert `always_embed` returns `MATERIAL_TOO_LARGE` with no provider raw semantic output and no aggregate/public pass.

- [ ] **Step 2: Run RED.**

Run: `npx vitest run scripts/__tests__/run-wh-review-provider-smoke.test.mjs tests/wh-review-v4-workflow-wiring.test.mjs`

Expected: FAIL because OpenCode is currently embedded-only and no delivery record/triad is present.

- [ ] **Step 3: Implement evidence and docs.**

Persist provider-specific delivery mode, material hash, total bytes, provider-visible manifest hash, raw output hashes, runtime ID, and session ID. Document `MATERIAL_TOO_LARGE`, `MATERIAL_INCOMPLETE`, and `SOURCE_CONTAINS_ABSOLUTE_PATH` as transport/material states distinct from semantic verdicts. Document that a provider reviews a sanitized object only when a future explicit sanitized hash relation exists; this implementation fails closed instead.

- [ ] **Step 4: Run GREEN, real smoke, and independent review.**

Run: `npm test` in workflowhub and `npm test` in 3rd-review. The current 3rd-review baseline has four stream-timing failures (`attachments-protocol` OpenCode 80KB continuation, broker progress timestamp, Kimi retry progress, process stream monitor); distinguish them from this change and make the focused delivery suite green before deciding whether they require a separate repair.

Run real smoke only through:

```bash
WH_REVIEW_PROVIDER_SMOKE=1 WH_REVIEW_NATIVE_AUTH_CONFIRMED=1 WH_REVIEW_SMOKE_ASSUME_NATIVE_AUTH=1 node scripts/run-wh-review-provider-smoke.mjs
```

Expected: both providers complete R1/R2 through `file_only`, echo first/middle/last marker plus all three hashes, reuse their sessions, leave source HEAD unchanged, and emit durable evidence. Then use only `3rd-review.mjs run --request` with its standard attachment flags for independent review.

## Plan self-review

- Delivery plan precedes all rendering: Phase 1 Task 3–4 and Phase 2 Task 3.
- File-only triad, hash/coverage validation, OpenCode, 512KB failure, provider/semantic separation, R2, final-only commit, and absolute path policy each have a concrete task and regression test.
- No chunk workaround or host-side path parser is included.
- The transport-derived bundle uses separate raw/derived hashes and private semantic labeling; business/public schemas remain unchanged.

## Phase 4 — minimal transport-derived bundle

**Trigger:** a complete raw diff can contain a historical absolute path in a deletion. Skipping that line leaks data; forcing an intermediate commit conflicts with the single-final-commit workflow.

- Keep business review schemas, public projection, aggregate, and verify-final unchanged.
- The broker validates and privately freezes the raw triad, then deterministically derives a provider-visible triad by replacing every absolute/non-HTTP path token. It rebuilds `changes.diff`, packet, inner manifest, outer manifest, and all hashes.
- Both `file_only` and `always_embed` deliver only the derived triad. Post-derivation scanning is fail-closed.
- Private delivery state records `raw_bundle_hash`, `derived_bundle_hash`, rule version, replacement count, and `material_representation`. Provider output continues to bind the derived packet/manifest/diff hashes already required by the existing protocol.
- WorkflowHub accepts a derived result only when the broker attestation binds the exact raw material hash it submitted, the derived triad validates, raw→derived recomputation succeeds, and raw provider output exists. No new public review-object protocol.
- R2 reuses the same runtime/session and rule version; each delta has its own raw/derived hashes and predecessor binding.
