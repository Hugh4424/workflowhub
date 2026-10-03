# wh-review V4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy single-runner review path with V4 packet-based, session-resumable, skill-aware cross-provider review.

**Architecture:** `3rd-review` gains generic provider-private attachment transport and explicit cancellation provenance. `wh-review` owns stage contracts, immutable review packets, provider-result validation, merge, private/core receipts and workflow projections. All five workflow stages call one facade.

**Tech Stack:** Node.js ESM, node:test/Vitest, JSON Schema, SHA-256, 3rd-review CLI.

---

## Phase 1 — Contracts and repository skills

**Files:** Rename the five `skills/wh-review/contracts/*.md` files to workflow-stage names; create `provider-protocol.md`, `stage-skill-plan.json`, `legacy-rule-ledger.md`, five JSON schemas, five report-only skills and their `review-bundle.json`; modify `skills/wh-review/{SKILL.md,manifest.json}`, `scripts/lib/safe-id.mjs`, `scripts/required-skill-resolver.mjs`; add resolver/contract/bundle tests.

- [ ] Write failing tests that require only repository `skills/`, reject external/gstack roots and validate each `review-bundle.json` closure.
- [ ] Rename contracts and update every stage mapping to `make-decision`, `build-spec`, `build-plan`, `build-code`, `verify-code`; put direction/detail tracks in `make-decision.md`.
- [ ] Add `provider-protocol.md`, StageSkillPlan and schemas for intent, packet, provider output, run result and dispositions.
- [ ] Migrate report-only `plan-ceo-review`, `review`, `plan-design-review`, `plan-eng-review`, `qa-only`; add bundles to them, `spec-analyze` and `verify-change`; remove all gstack/home/network/write/process instructions.
- [ ] Change `speckit-analyze` references to `spec-analyze`; make UI-only design skill conditional.
- [ ] Run targeted tests, `npm run check`, then `3rd-review` contract/skill audit. Commit only after the audit passes.

## Phase 2 — 3rd-review private packet and attachment transport

**Files:** `/Users/Hugh/Hugh/Project/3rd-review/{scripts/3rd-review.mjs,lib/broker.mjs,lib/runtime.mjs,lib/config.mjs,lib/adapters/*.mjs,test/*.test.mjs}`; create `lib/attachments.mjs` and attachment tests.

- [ ] Write failing node tests for `--attachments`, root-bound relative sources, traversal/symlink/hardlink/special-file rejection, byte/hash limits, atomic copies and continuation hash freeze.
- [ ] Add generic attachment CLI/config/schema and provider capability filtering for `file_only` and `always_embed`; return `NO_CAPABLE_PROVIDER` without business semantics.
- [ ] Replace shared runtime workspace with provider-private workspace; copy packet and skills there; Kimi gets its private `--skills-dir`, other adapters receive private cwd and read-only prompt.
- [ ] Store only target/hash/size in broker state; preserve raw output/session/status; add cancellation JSON with source and distinguish cancellation from idle/max duration failures.
- [ ] Run `npm test` in 3rd-review and real Kimi+OpenCode attachment/diff-marker smoke; save runtime evidence paths; use `3rd-review` to audit this phase. Commit after pass.

## Phase 3 — wh-review packet facade and receipts

**Files:** Create `skills/wh-review/scripts/{review-round-facade,broker-client,review-packet,provider-validator,finding-merge,round-receipt,round-projector,flow-reset}.mjs`; modify `wh-review-cli.mjs`, `round-state.mjs`, reports/index; remove or fail-loud legacy production runner entry points; add unit and mock-broker E2E tests.

- [ ] Write failing tests for `review-packet.v1`: shared packet hash, real diff, changed files, AC/design excerpts, host test evidence and material-incomplete rejection.
- [ ] Implement BrokerClient as the only production argv: `<third_review.command> run --config --request [attachments]`; add static tests rejecting old runner, `--diff`, `--output` and direct workflow broker calls.
- [ ] Implement private session/raw/status persistence and three independent axes: transport, packet and semantic verdict; never expose runtime/session/raw in public projections.
- [ ] Implement aggregate predicate `completed && complete && business_valid && semantic_verdict`, hard-gate disposition validation, task lock, deterministic projection manifest and reset/TTL path.
- [ ] Delete old outer 600-second dispatcher timeout. Cancellation must use broker cancel with recorded source; failures never become semantic verdicts.
- [ ] Run targeted tests, `npm test`, `npm run check`, then `3rd-review` audit. Commit after pass.

## Phase 4 — Workflow wiring and end-to-end acceptance

**Files:** Modify `workflows/{make-decision,build-spec,build-plan,build-code,verify-code}/SKILL.md`; update stage-chain and smoke tests; retire obsolete invoke/Claude artifact tests only after replacement coverage exists.

- [ ] Write failing five-stage mock Broker E2E tests, including make-decision direction/detail isolation and first-runtime continuation.
- [ ] Route every workflow through `ReviewRoundFacade`; remove old prepare/invoke instructions, same-source fallback, direct 3rd-review calls and build-code dual-reviewer path.
- [ ] Assert provider-private packet-only access, no git/absolute repository paths, cancellation source, no legacy argv and receipt evidence layout.
- [ ] Run full `npm test` and `npm run check`.
- [ ] Run final real OpenCode+Kimi smoke with one packet diff marker; require both completed raw outputs, session ids and evidence under task private review artifacts.
- [ ] Use `3rd-review` final audit. If it passes, commit and hand off results.

## Phase gates

Each phase stops on test failure, incomplete material, no completed provider or a `3rd-review` blocking finding. A passing phase commits its own files, records the runtime/raw evidence, and automatically starts the next phase. No phase uses a new provider session for follow-up audit: continuation reuses the phase audit's initial runtime when every continuable provider is valid.
