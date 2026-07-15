# Uncommitted wh-review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Review every stage from staged, unstaged, renamed, deleted, and untracked work without creating stage commits; create one implementation commit only after the final approved review still matches the worktree.

**Architecture:** The host alone captures a Git tree with a temporary `GIT_INDEX_FILE`; it derives the diff and file hashes from that tree and seals the normal packet. Each flow pins only its last reviewed tree in one private Git ref, so R2 can derive an exact delta and reuse its initial provider session. The task source context stores only `initial_tree` and `last_approved_tree`; it is not a snapshot platform.

**Tech Stack:** Node.js ESM, Git plumbing (`read-tree`, `add -A`, `write-tree`, `diff`, `show`, `update-ref`), Vitest, 3rd-review OpenCode/Kimi smoke tests.

---

## Locked simplifications

- Never create a commit before review. Do not use stash, temporary commits, caller-provided patches, a snapshot database, or an old-flow migration layer.
- The host rejects caller `source_revision`, `unified_diff`, `changed_files`, `diff_sha256`, `packet_hash`, and repository-path fields. Only host capture may populate source material.
- A task stores only initial `HEAD^{tree}` plus the last accepted stage tree. A stage R2 starts from its own prior reviewed tree.
- A flow owns one ref: `refs/workflowhub/review/<task>/<stage>/<track>/<flow>`. It pins the latest business-valid tree and is deleted on reset or final completion.
- `verify-final` compares a fresh temporary-index tree with the final accepted tree. It never commits; verify-code performs one ordinary `git add -A && git commit` only after it passes.

## File map

- Create: `skills/wh-review/scripts/source-tree.mjs` — temporary-index capture, tree diff/file material, ref helpers, equality check.
- Create: `skills/wh-review/scripts/__tests__/source-tree.test.mjs` — staged/unstaged/untracked/rename/delete and index-safety tests.
- Modify: `skills/wh-review/scripts/review-round-facade.mjs` — host capture, R1/R2 tree source, flow ref, approved tree, final verification.
- Modify: `skills/wh-review/scripts/wh-review-cli.mjs` and tests — material-only input and `verify-final`.
- Modify: `skills/wh-review/schemas/review-packet.schema.json`, `review-packet-integrity.mjs`, `review-prompt.mjs` — tree source contract and tree delta wording.
- Modify: `scripts/phase-gate.mjs`, `scripts/validate-stage-result.mjs`, `contracts/facts-subschema.json` and tests — remove per-phase commit/clean checks.
- Modify: `workflows/build-code/SKILL.md`, `workflows/verify-code/SKILL.md`, `scripts/run-wh-review-provider-smoke.mjs` — one final commit and true unstaged smoke.

### Task 1: Capture a temporary-index tree

**Files:**

- Create: `skills/wh-review/scripts/source-tree.mjs`
- Test: `skills/wh-review/scripts/__tests__/source-tree.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
it('captures staged, unstaged, deleted, renamed, and untracked files without changing HEAD or index', async () => {
  const before = await realIndexAndHead(repo);
  const snapshot = await captureWorktreeTree(repo);
  expect(snapshot.tree).toMatch(/^[0-9a-f]{40,64}$/);
  expect(await realIndexAndHead(repo)).toEqual(before);
  expect(snapshot.changedFiles).toEqual(expect.arrayContaining(['new.txt', 'renamed.txt']));
});

it('rejects final drift including a late untracked file', async () => {
  const approved = await captureWorktreeTree(repo);
  await writeFile(path.join(repo, 'late.txt'), 'not reviewed');
  await expect(assertCurrentTree(repo, approved.tree)).rejects.toMatchObject({
    code: 'WORKTREE_DRIFT_AFTER_REVIEW',
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run skills/wh-review/scripts/__tests__/source-tree.test.mjs`

Expected: FAIL because `source-tree.mjs` does not exist.

- [ ] **Step 3: Implement minimal Git plumbing**

```js
export async function captureWorktreeTree(root) {
  const index = await mkdtemp(path.join(tmpdir(), 'wh-review-index-'));
  try {
    await git(root, ['read-tree', 'HEAD'], { GIT_INDEX_FILE: index });
    await git(root, ['add', '-A'], { GIT_INDEX_FILE: index });
    const tree = (await git(root, ['write-tree'], { GIT_INDEX_FILE: index })).trim();
    return buildTreeMaterial(root, await headTree(root), tree);
  } finally {
    await rm(index, { force: true });
  }
}
```

`buildTreeMaterial` must use `git diff --binary --find-renames --full-index`, `git diff --name-status -z`, and `git show <tree>:<path>`; it must never parse a caller patch. Ignored files remain excluded by Git.

- [ ] **Step 4: Run GREEN**

Run: `npx vitest run skills/wh-review/scripts/__tests__/source-tree.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/wh-review/scripts/source-tree.mjs skills/wh-review/scripts/__tests__/source-tree.test.mjs
git commit -m "feat(wh-review): capture uncommitted source trees"
```

### Task 2: Seal host-owned R1 packets

> **Atomic boundary:** Task 2 changes the source schema used by continuation. Do not require the full facade suite to pass between Tasks 2 and 3; implement Task 3 immediately, then run the combined continuation/facade suite before either task is reviewed.

**Files:**

- Modify: `skills/wh-review/schemas/review-packet.schema.json`
- Modify: `skills/wh-review/scripts/review-round-facade.mjs`
- Modify: `skills/wh-review/scripts/review-packet-integrity.mjs`
- Modify: `skills/wh-review/scripts/review-prompt.mjs`
- Test: `skills/wh-review/scripts/__tests__/review-round-facade.test.mjs`

- [ ] **Step 1: Write failing facade tests**

```js
it('rejects caller-owned source fields and builds R1 from uncommitted host work', async () => {
  await expect(facade.prepare({
    materials,
    source_revision: { base_tree: fakeTree, snapshot_tree: fakeTree },
  })).rejects.toMatchObject({ code: 'SOURCE_FIELDS_FORBIDDEN' });
  await editTrackedAndCreateUntracked(repo);
  const prepared = await facade.prepare({ materials });
  expect(prepared.packet.unified_diff).toContain('untracked-file-marker');
  expect(prepared.packet.source_revision.snapshot_tree).not.toBe(fakeTree);
  expect(await gitHead(repo)).toBe(initialHead);
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run skills/wh-review/scripts/__tests__/review-round-facade.test.mjs`

Expected: FAIL because packets require commit-only `base/head`.

- [ ] **Step 3: Implement host-owned tree source**

Replace `buildHostGitSource` and caller source verification with `captureWorktreeTree`. Require and hash:

```js
source_revision: {
  base_tree: source.baseTree,
  snapshot_tree: source.tree,
  captured_head: source.head,
}
```

Use the task’s initial/last-approved tree as R1 base. Change continuation prompt labels from `previous_head/current_head` to `previous_tree/current_tree`.

- [ ] **Step 4: Run GREEN**

Run: `npx vitest run skills/wh-review/scripts/__tests__/review-round-facade.test.mjs skills/wh-review/scripts/__tests__/reviewer-output-validator.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/wh-review/schemas/review-packet.schema.json skills/wh-review/scripts/review-round-facade.mjs skills/wh-review/scripts/review-packet-integrity.mjs skills/wh-review/scripts/review-prompt.mjs skills/wh-review/scripts/__tests__/review-round-facade.test.mjs
git commit -m "feat(wh-review): seal host worktree review packets"
```

### Task 3: Continue from a reviewed tree and verify final equality

**Files:**

- Modify: `skills/wh-review/scripts/source-tree.mjs`
- Modify: `skills/wh-review/scripts/review-round-facade.mjs`
- Modify: `skills/wh-review/scripts/wh-review-cli.mjs`
- Test: `skills/wh-review/scripts/__tests__/review-round-facade.test.mjs`
- Test: `skills/wh-review/scripts/__tests__/wh-review-cli-continuation.test.mjs`
- Test: `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`

- [ ] **Step 1: Write failing R2/ref/final-tree tests**

```js
it('builds R2 from the last business-valid tree and reuses the R1 runtime', async () => {
  const r1 = await completeBusinessValidRoundWithUncommittedChange();
  await edit(repo, 'R2_DELTA_ONLY_MARKER');
  const r2 = await facade.prepare({ materials, continuation_of: r1.flowId });
  expect(r2.packet.source_revision.base_tree).toBe(r1.packet.source_revision.snapshot_tree);
  expect(r2.runtime_id).toBe(r1.runtime_id);
});

it('deletes the flow ref on reset and rejects a final tree that drifted', async () => {
  const pass = await publishPass();
  await expect(facade.verifyFinal(pass.flowId)).resolves.toMatchObject({ approved: true });
  await edit(repo, 'late change');
  await expect(facade.verifyFinal(pass.flowId)).rejects.toMatchObject({
    code: 'WORKTREE_DRIFT_AFTER_REVIEW',
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run skills/wh-review/scripts/__tests__/review-round-facade.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-continuation.test.mjs`

Expected: FAIL because flow records only commits and CLI has no `verify-final`.

- [ ] **Step 3: Implement one ref and equality check**

```js
const ref = `refs/workflowhub/review/${safe(taskId)}/${safe(stage)}/${safe(track)}/${safe(flowId)}`;
await git(root, ['update-ref', ref, packet.source_revision.snapshot_tree]);
flow.last_reviewed_tree = packet.source_revision.snapshot_tree;

export async function verifyFinal(root, approvedTree) {
  const current = await captureWorktreeTree(root);
  if (current.tree !== approvedTree) throw coded('WORKTREE_DRIFT_AFTER_REVIEW');
  return { approved: true, tree: current.tree };
}
```

Move the ref only after a business-valid aggregate. Store `approved_tree` only for semantic pass. Reset and successful final completion delete the ref. Add `wh-review-cli verify-final --task-id --stage --track --flow-id`; it compares only and never commits.

- [ ] **Step 4: Run GREEN**

Run: `npx vitest run skills/wh-review/scripts/__tests__/review-round-facade.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-continuation.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/wh-review/scripts/source-tree.mjs skills/wh-review/scripts/review-round-facade.mjs skills/wh-review/scripts/wh-review-cli.mjs skills/wh-review/scripts/__tests__/review-round-facade.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-continuation.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs
git commit -m "feat(wh-review): continue uncommitted review flows"
```

### Task 4: Remove the per-stage commit gate

**Files:**

- Modify: `scripts/phase-gate.mjs`
- Modify: `scripts/validate-stage-result.mjs`
- Modify: `contracts/facts-subschema.json`
- Modify: `workflows/build-code/SKILL.md`
- Modify: `workflows/verify-code/SKILL.md`
- Test: `tests/phase-gate.test.mjs`
- Test: `tests/facts-subschema.test.mjs`
- Test: `tests/receipt-verification.test.mjs`

- [ ] **Step 1: Write failing no-commit gate tests**

```js
it('accepts dirty tracked and untracked implementation with a published passing core', async () => {
  await writeUncommittedImplementation(repo);
  const result = await phaseGate(stageResultWithPublishedPassCore());
  expect(result.checked).not.toContain('implementation_commit');
  expect(result.status).toBe('GREEN');
});

it('accepts phase completion records without commit sha', () => {
  expect(validateFacts({
    phase_completion: { phase_records: [{ phase_id: 'P1', changed: true }] },
  })).toBe(true);
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/phase-gate.test.mjs tests/facts-subschema.test.mjs tests/receipt-verification.test.mjs`

Expected: FAIL because commit/clean-worktree checks remain mandatory.

- [ ] **Step 3: Remove only commit/clean checks**

Delete commit-record and clean-worktree checks from `phase-gate.mjs`. Retain status, RED/GREEN evidence, diff scan, and public core receipt triple checks. Replace `commit_records` with `phase_records: [{ phase_id, changed }]`; never add private flow/ref data to CI inputs.

Update build-code wording to permit uncommitted fixes. Update verify-code to run `verify-final` after final PASS, then make the one ordinary implementation commit.

- [ ] **Step 4: Run GREEN**

Run: `npx vitest run tests/phase-gate.test.mjs tests/facts-subschema.test.mjs tests/receipt-verification.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/phase-gate.mjs scripts/validate-stage-result.mjs contracts/facts-subschema.json workflows/build-code/SKILL.md workflows/verify-code/SKILL.md tests/phase-gate.test.mjs tests/facts-subschema.test.mjs tests/receipt-verification.test.mjs
git commit -m "fix(workflow): commit once after final review"
```

### Task 5: Prove real providers see uncommitted material

**Files:**

- Modify: `scripts/run-wh-review-provider-smoke.mjs`
- Modify: `scripts/__tests__/run-wh-review-provider-smoke.test.mjs`
- Modify: `tests/wh-review-v4-workflow-wiring.test.mjs`
- Modify: `docs/adr/0002-v4-review-exception-state-matrix.md`

- [ ] **Step 1: Write failing smoke-script test**

```js
it('uses no git commit and requires host tree hashes in real R1 and R2 output', async () => {
  const source = await readFile(smokeScript, 'utf8');
  expect(source).not.toContain("git', ['commit'");
  expect(source).toContain('R1_UNCOMMITTED_MARKER');
  expect(source).toContain('R2_DELTA_ONLY_MARKER');
  expect(source).toContain('packet_hash');
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run scripts/__tests__/run-wh-review-provider-smoke.test.mjs`

Expected: FAIL because the current smoke fixture commits R1/R2 work.

- [ ] **Step 3: Implement real unstaged smoke**

Create R1 and R2 edits without commits. Invoke only standard wh-review/3rd-review entrypoints. Require OpenCode and Kimi R1 raw output to echo `R1_UNCOMMITTED_MARKER`, `packet_hash`, and `diff_sha256`; require each R2 to reuse its session and echo only `R2_DELTA_ONLY_MARKER` plus current hashes. Add `WORKTREE_DRIFT_AFTER_REVIEW` to ADR 0002.

- [ ] **Step 4: Run full verification**

Run: `npx vitest run scripts/__tests__/run-wh-review-provider-smoke.test.mjs tests/wh-review-v4-workflow-wiring.test.mjs && npm test`

Expected: PASS.

- [ ] **Step 5: Run real smoke and final 3rd-review**

Run: `WH_REVIEW_PROVIDER_SMOKE=1 WH_REVIEW_NATIVE_AUTH_CONFIRMED=1 node scripts/run-wh-review-provider-smoke.mjs`

Expected: OpenCode and Kimi R1/R2 PASS from uncommitted work, each reusing its session; evidence JSON contains runtime/raw hash checks.

Create a strict final packet and call only:

```bash
node /Users/Hugh/Hugh/Project/3rd-review/scripts/3rd-review.mjs run --config=/Users/Hugh/.config/3rd-review/config.json --request=/tmp/unstaged-review-final/request.json
```

Expected: `APPROVED`.

- [ ] **Step 6: Commit**

```bash
git add scripts/run-wh-review-provider-smoke.mjs scripts/__tests__/run-wh-review-provider-smoke.test.mjs tests/wh-review-v4-workflow-wiring.test.mjs docs/adr/0002-v4-review-exception-state-matrix.md
git commit -m "test(wh-review): smoke uncommitted review flows"
```

## Plan self-review

- Coverage: Tasks 1–3 remove commit-only source capture while keeping host authority, frozen packets, R2 session/delta, one flow ref, and final equality. Task 4 removes every per-stage commit gate while preserving published-core CI checks. Task 5 proves real providers receive host-generated uncommitted material.
- Deliberate omissions: no temporary commits/stash, caller patch acceptance, generic snapshot registry, fingerprint service, migration layer, or finalizer service.
- Consistency: packets use `base_tree`/`snapshot_tree`; flows use `last_reviewed_tree`; semantic pass stores `approved_tree`; `verify-final` compares the same tree representation.
