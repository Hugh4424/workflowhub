# wh-review V4 Design Gap Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every confirmed gap against
`2026-07-12-wh-review-v4-redesign-design.md`, release the finished
3rd-review broker, and prove the production chain with real packet-based
continuation.

**Architecture:** Keep 3rd-review transport-only. Enforce delivery and
continuation eligibility in wh-review before invoking the broker; persist only
normalized, private transport state. Make stage plans/contracts the complete
review specification, then harden facade state transitions and downstream
core-receipt consumers.

**Tech Stack:** Node.js ESM, Vitest, JSON Schema/Ajv, markdownlint, CLI smoke
tests.

## Phase 0: Release and retire superseded 3rd-review work

**Files:**

- Modify: `/Users/Hugh/Hugh/Project/3rd-review/SKILL.md`
- Modify: `/Users/Hugh/Hugh/Project/3rd-review/docs/exceptions.md`
- Test: `/Users/Hugh/Hugh/Project/3rd-review/test/*.test.mjs`

- [ ] Verify `main` contains `8744439` and `0b6d656`.
- [ ] Run `npm test`; expected: all 53 broker tests pass.
- [ ] Run `doctor --attachments-root=/Users/Hugh/.workflowhub/wh-review-packets`;
  expected: `attachments:true`, `attachment_root.status:"ready"`.
- [ ] Record `codex/wh-review-attachments@d546164` as superseded by
  integration; do not merge or cherry-pick it because it uses OpenCode
  `--file review-input.md`.
- [ ] Remove the obsolete attachments worktree/branch only after the final real
  smoke succeeds.
- [ ] Commit only documentation/release-state changes, if any.

## Phase 1: Enforce delivery capability and real continuation eligibility

**Files:**

- Modify: `skills/wh-review/scripts/review-round-facade.mjs`
- Modify: `skills/wh-review/scripts/broker-client.mjs`
- Modify: `skills/wh-review/scripts/lib/safe-id.mjs`
- Modify: `skills/wh-review/scripts/__tests__/review-round-facade.test.mjs`
- Modify: `skills/wh-review/scripts/__tests__/broker-client.test.mjs`
- Modify: `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs`
- Modify: `/Users/Hugh/Hugh/Project/3rd-review/lib/runtime.mjs`
- Test: `/Users/Hugh/Hugh/Project/3rd-review/test/delivery-outcome.test.mjs`

- [ ] RED: add a stage plan with `delivery_mode:"file_only"` and only an
  `always_embed` provider; assert `NO_CAPABLE_PROVIDER` before broker
  invocation.
- [ ] GREEN: filter `candidate_providers` by the exact requested delivery
  capability; reject any broker `delivery_used` mismatch.
- [ ] RED: simulate a tier where only one doctor-ready provider actually runs;
  assert the completed, business-valid provider with a native session is the
  frozen continuable set.
- [ ] GREEN: derive `continuable_providers` from first-round completed outcomes,
  never doctor-ready providers that did not run.
- [ ] RED: assert private provider records include SHA-256 hashes for
  stdout/stderr raw files.
- [ ] GREEN: persist raw hashes in private broker state and RoundReceipt; keep
  hashes out of public projections.
- [ ] RED: pass unknown cancellation source; assert rejection.
- [ ] GREEN: allow only `user`, `workflow_shutdown`, `broker_idle_timeout`, and
  `broker_max_duration` in the public cancellation contract; map internal
  process errors without leaking them publicly.
- [ ] Add a no-model attachment-copy/private-workspace probe to `doctor`; assert
  probe failure makes attachment capability unavailable.
- [ ] Run targeted tests, then full 3rd-review and workflowhub tests; commit.

## Phase 2: Complete stage specification and skill-plan semantics

**Files:**

- Modify: `skills/wh-review/stage-skill-plan.json`
- Modify: `skills/wh-review/contracts/provider-protocol.md`
- Modify: `skills/wh-review/contracts/make-decision.md`
- Modify: `skills/wh-review/contracts/build-spec.md`
- Modify: `skills/wh-review/contracts/build-plan.md`
- Modify: `skills/wh-review/contracts/build-code.md`
- Modify: `skills/wh-review/contracts/verify-code.md`
- Modify: `skills/wh-review/scripts/required-skill-resolver.mjs`
- Modify: `skills/wh-review/scripts/review-prompt.mjs`
- Modify: `workflows/build-plan/SKILL.md`
- Test: `skills/wh-review/scripts/__tests__/required-skill-resolver.test.mjs`
- Test: `skills/wh-review/scripts/__tests__/phase5b-must-read-contracts.test.mjs`

- [ ] RED: require every stage/track plan entry to expose `output_schema`,
  `checkpoints`, `expected_evidence`, `logical_skill_id`, bundle hash, closure
  files, review mode, and delivery mode.
- [ ] GREEN: normalize those fields in `resolveRequiredSkills()` and reject
  incomplete plan entries.
- [ ] Move each stage's role, Must Read order, material list, required skills,
  hard invariants, and incremental policy into its contract; keep
  `review-prompt.mjs` as renderer only.
- [ ] Make protocol text accept exactly one optional full JSON fence, matching
  `parseOutput`; reject extra prose.
- [ ] RED: construct an `always_embed` bundle above 512KiB; assert prepare fails
  before spawning a provider.
- [ ] GREEN: budget provider prompt plus embedded bundle with a stable
  `PROMPT_TOO_LARGE` diagnostic.
- [ ] Remove the remaining production `speckit-analyze` reference; assert
  `spec-analyze` is the only accepted name.
- [ ] Run contract, resolver, and markdownlint tests; commit.

## Phase 3: Close facade state-machine and downstream-consumer gaps

**Files:**

- Modify: `skills/wh-review/scripts/review-round-facade.mjs`
- Modify: `skills/wh-review/scripts/finding-state.mjs`
- Modify: `skills/wh-review/scripts/wh-review-cli.mjs`
- Modify: `skills/wh-review/schemas/dispositions.schema.json`
- Modify: `skills/wh-review/schemas/round-run-result.schema.json`
- Modify: `core/task-record-paths.mjs`
- Modify: `tools/cli/ci-chain-check.mjs`
- Modify: `scripts/validate-stage-result.mjs`
- Test: `skills/wh-review/scripts/__tests__/review-round-facade.test.mjs`
- Test: `skills/wh-review/scripts/__tests__/finding-state.test.mjs`
- Test: `core/__tests__/task-record-paths.test.mjs`
- Test: `scripts/__tests__/ci-chain-check.test.mjs`

- [ ] RED: repeatedly submit invalid dispositions until the configured limit;
  assert the next result is `blocked_by_human_confirmation` and no provider is
  recalled.
- [ ] GREEN: persist per-flow disposition attempts in the private receipt and
  enforce the configured limit.
- [ ] RED: omit a previous open cross-stage carryover from a continuation input;
  assert it remains in the continuation state and prompt.
- [ ] GREEN: call `mergeCrossStageCarryovers()` from prepare/run and persist
  inherited state in the receipt.
- [ ] RED: send an unprovable late H-rule finding; assert it is minor and
  excluded from hard gates.
- [ ] GREEN: compute hard gates only from blocking, non-late findings.
- [ ] RED: publish an `escalate_to_human` result; assert core/report/index/
  stage-result are projected in that same publish transaction.
- [ ] GREEN: publish blocked projections atomically without waiting for a later
  prepare recovery.
- [ ] Make CI and stage validators consume group-scoped core receipt fields
  (`core_receipt_hash`, `semantic_verdict`, `needs_human`) and reject legacy raw
  artifact-path dependencies.
- [ ] Run targeted plus full workflowhub tests; commit.

## Phase 4: Real workflow and provider acceptance

**Files:**

- Modify: `tests/wh-review-v4-workflow-wiring.test.mjs`
- Create: `tests/wh-review-v4-real-chain-smoke.test.mjs`
- Modify: `workflows/make-decision/SKILL.md`
- Modify: `workflows/build-spec/SKILL.md`
- Modify: `workflows/build-plan/SKILL.md`
- Modify: `workflows/build-code/SKILL.md`
- Modify: `workflows/verify-code/SKILL.md`

- [ ] Add one real entry-point test per workflow stage: prepare → run →
  disposition → publish, using the stage's actual packet builder and
  group-scoped stage-result path.
- [ ] Add a real OpenCode two-round smoke: R1 receives `DIFF_HEAD` and
  `DIFF_TAIL`; R2 uses the same native session and receives only
  `DELTA_ONLY_MARKER`.
- [ ] After Kimi login is restored, run the same packet through Kimi: assert raw
  output echoes marker, packet hash, and diff hash; then run R2 using Kimi's
  native session and delta only.
- [ ] Persist evidence paths, runtime id, provider session ids, and delivery mode
  only in private runtime artifacts; assert public status/core/report contain
  none.
- [ ] Run full workflowhub tests, full 3rd-review tests, and both real smokes;
  commit evidence-free test code only.

## Phase 5: Final review, integration and cleanup

**Files:**

- Modify: `docs/superpowers/specs/2026-07-12-wh-review-v4-redesign-design.md`
  only if the design changes by explicit approval.
- Modify: `/Users/Hugh/.workflowhub/config.json` only to point at released
  `3rd-review/main`.

- [ ] Build a hash-verified final review packet containing the design,
  implementation diff, test evidence, and smoke manifest.
- [ ] Run `3rd-review` with OpenCode; require `APPROVED` or fix every finding
  and repeat.
- [ ] Independently review code changes, then run `npm test`, `git diff --check`,
  and relevant markdownlint from clean worktrees.
- [ ] Merge `codex/wh-review-v4` into `workflowhub/main` only after resolving
  the user's uncommitted `skills/wh-review/SKILL.md` conflict without
  overwriting it.
- [ ] Verify `workflowhub/main` invokes only `3rd-review ... run --request`, has
  no legacy runner tokens, and the production doctor root is ready.
- [ ] Remove `/Users/Hugh/Hugh/Project/3rd-review-wh-attachments` and branch
  `codex/wh-review-attachments` only after the release smoke passes.
