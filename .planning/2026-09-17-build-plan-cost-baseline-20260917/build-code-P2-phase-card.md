# Build-code P2 Phase Card — T003 RED

- **task / phase**: T003 / Phase P2 — 3rd-review 健康、重发与公开 attempt 事实
- **goal**: 只在外部守卫测试中建立可证伪的 BROKER-HEALTH RED；不改 producer 实现。
- **authenticated WorkflowHub worktree**: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-cost-baseline-and-blocker-close-20260917`
- **authenticated external target**: `/Users/Hugh/Hugh/Project/3rd-review`, branch `main`, HEAD `a96f28b724b7f14df307716cb3feeae21da13d88`, clean at preflight
- **current material identity**: `material_revision=revision-f505d785a347ce041a4a7c80d28b0acbce1537103b04c1bc87636c35c16c8853`; `spec_sha256=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847` (read from the current four materials; execution-status bookkeeping in `tasks.md` excluded)
- **material anchors read**: `tasks.md:157-221` (T003), `plan.md:609-650` (P2), `spec.md:741-782` (P2 ACs), and the current P1 closeout card

## Exact allowed file and symbols

Only this external file may be edited:

`/Users/Hugh/Hugh/Project/3rd-review/test/managed-session-lifecycle.test.mjs`

The writable semantic boundary is limited to the existing managed lifecycle status guard around current lines `58-71` and the related local terminal/private-path guard around current lines `146-155`, including immediately adjacent T003 RED assertions/helpers required to exercise those same seams. No other external file, WorkflowHub file, config, branch, or commit is in scope.

## Covered ACs

- `AC-HEALTH-001`: Antigravity print-timeout is classified as `PROVIDER_PRINT_TIMEOUT`, not empty output.
- `AC-HEALTH-002`: the provider-facing timeout maps to `PROCESS_TIMEOUT` and enters the one-shot retry path.
- `AC-BROKER-001`: `single_round` and `full_only` each receive exactly one `fresh_execution` retry.
- `AC-BROKER-002`: a `same_session_repair` decision with no resume capability falls back to one `fresh_execution`.
- `AC-BROKER-003`: public attempts follow parse outcome and distinguish process failure from parse failure.
- `AC-HEALTH-003`: managed non-terminal status exposes only controlled member health facts at top-level `providers`.
- `AC-HEALTH-004`: explicit timeout failure is distinguishable from a healthy-but-slow running member.

FR mapping: `FR-HEALTH-001`, `FR-HEALTH-002`, `FR-BROKER-001`, `FR-BROKER-002`, `FR-BROKER-003`, `FR-HEALTH-003`, `FR-HEALTH-004`.

## Non-goals and compatibility boundary

- RED-only: no change to `lib/adapters/antigravity.mjs`, `lib/provider-failure.mjs`, `lib/recovery-policy.mjs`, `lib/broker.mjs`, or `lib/workflowhub-result-v3.mjs`.
- No WorkflowHub implementation/test/config/material edit; no provider configuration change; no real network or provider call; no review, commit, push, merge, archive, or cleanup.
- P1 route/testing facts are not rerun. This phase consumes the P1 consumer compatibility fact only as a cross-repository contract.
- Non-terminal managed envelopes may expose a controlled top-level `providers` map with member `status`, `error`/`error.code`, and `last_progress_at_ms`; `group` remains terminal-only. Extra unrelated health-envelope keys are not a new public fact.
- A private path in one member must fail only that member; a mixed v3 terminal group remains `partial` with the other member intact. The seven fail-closed red lines and existing malformed/unbound terminal-group negative cases remain unchanged.

## Pre-designed route, oracle, and evidence

- **old route**: `feature` — targeted local Node `node:test` across the declared P2 command; backend review/broker behavior, no UI/browser.
- **selected route**: `feature`.
- **reroute**: `no`; the actual external changed-file boundary is one backend lifecycle test file in one review/broker behavior domain, with no database, auth, deployment, or UI seam.
- **test-routing-advisor result** (one direct use, `2026-09-17T17:02:00Z`):

  `{ "routing_tier": "feature", "routing_rationale": "实际 changed_files 仅为 3rd-review/test/managed-session-lifecycle.test.mjs 的后端 managed lifecycle guard 与 T003 RED assertions，属于单一 broker/review 行为域，无 UI、数据库、认证或部署链路。", "result": "pass", "ts": "2026-09-17T17:02:00Z" }`

- **concrete testing skill**: `backend-testing`, one direct use for this actual Node backend test boundary.
- **command**: `bash -c 'cd /Users/Hugh/Hugh/Project/3rd-review && node --test --test-timeout=30000 test/antigravity-adapter.test.mjs test/provider-failure.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs test/workflowhub-result-v3-hardening.test.mjs test/output-sanitization.test.mjs'`
- **expected exit**: `1` for T003 RED; failure must be a target assertion, not setup, environment, fixture, or command failure.
- **oracle**: `ORACLE-BROKER-HEALTH {"pass":"BROKER-HEALTH 的全部 AC 通过且负例保留","reject":{"input":"当前实现未满足目标行为","expected_rejection":"targeted assertion exits non-zero","observation":"失败来自目标 assertion 而非环境或 fixture setup"}}`
- **fixture/service**: deterministic temporary scripted CLI and existing fake/slow CLI fixtures only; no network/provider; spawned processes must be stopped by test cleanup paths.
- **coverage limits**: only the seven listed ACs, the exact managed envelope seam, and retained seven-redline/terminal-group negative cases; this does not prove GREEN, full regression, WorkflowHub end-to-end release, or external producer completion.
- **evidence path**: `quality/tests/output/P2-red.txt`; do not create or update any GREEN or RED→GREEN evidence file.

## STOP

Stop and preserve the real failure if the command/setup is broken, the RED is not caused by a target assertion, the diff leaves this file/region, a new design or config/provider/confirmation-point change is needed, a seven-redline or old-negative guard regresses, or a producer implementation would be required in T003. Do not execute review; P2 review belongs after T004.

## Actual T003 execution summary

- **recorded_at**: canonical root readback of the current P2-red evidence
- **actual external diff**: only `test/managed-session-lifecycle.test.mjs`; `153 insertions(+), 20 deletions(-)`; `git diff --check` passed. No producer, config, WorkflowHub, branch, or commit change.
- **actual command**: the exact `tasks.md` gate command; executed once; `exit_code=1`.
- **evidence**: current canonical `quality/tests/output/P2-red.txt`, `244 lines / 13,490 bytes`, `sha256=1c6803fb226fa3d06f8e0417d1ab5f02ca35179764879acaf480b4cc3d159f35`.
- **run summary**：`85 tests`, `77 pass`, `8 fail`, `0 cancelled`, `0 skipped`; duration `7497.371125ms`。Seven T003 target assertions failed; the remaining failure is the pre-existing `workflowhub-result-v3-hardening` negative (`P2-red.txt:228-244`). The earlier `035ea23…` output is retained only as pre-fixture-repair provenance; its `provider.auth.env is not iterable` setup failure is not a current P2-red fact。
- **AC facts**：`AC-HEALTH-001=RED` (print-timeout assertion remains `false`, `P2-red.txt:120-134`; its later stderr-parse assertion is not reached); `AC-HEALTH-002=RED` (actual `PROCESS_EXIT_NONZERO`, expected `PROCESS_TIMEOUT`, `P2-red.txt:137-155`); `AC-BROKER-001=RED` (`single_round` remains `failed`, `P2-red.txt:157-174`); `AC-BROKER-002=RED` (no-resume case remains `failed`, `P2-red.txt:176-193`); `AC-BROKER-003=RED` (parse-failed attempt is recorded `completed`, `P2-red.txt:195-212`); `AC-HEALTH-003=RED` (non-terminal `providers` health fields are absent and the failed member is not visible, `P2-red.txt:97-118` and `:214-225`); `AC-HEALTH-004=RED` (failed member is not observable before the healthy slow member completes, `P2-red.txt:214-225`).
- **boundary/negative facts**：existing managed terminal invalid-group guard passed (`P2-red.txt:53-56`); v3 private-path/mixed-version tests passed (`P2-red.txt:77-85`); the separate pre-existing `workflowhub-result-v3-hardening` negative remains failed (`P2-red.txt:228-244`), so seven-redline completeness is not claimed。
- **route/testing**：one `test-routing-advisor` use, old=`feature`, selected=`feature`, reroute=`no`; one direct `backend-testing` use; no P1 route/testing rerun. Oracle=`ORACLE-BROKER-HEALTH` was not satisfied because the current run includes the unrelated hardening failure。
- **review/delivery**: review `not executed` (P2 review is after T004); no commit/push/merge/archive/cleanup.
- **status**：T003 is `completed` only at the canonical RED-only task boundary; this does not mark P2, Phase, or Stage complete. T004's separate implementation/GREEN facts are recorded below。

## Stage-end summary

The current T003 RED fact is the post-fixture-repair canonical exit-1 run: seven target ACs have real RED assertions, and one unrelated existing hardening negative also fails. The former `035ea23…` output remains historical provenance only and is not the current evidence. T004 implementation and its historical `85/85 GREEN` fact are recorded below; independent review remains `unavailable`, so P2/Phase/Stage completion is not claimed and no review pass is inferred。

## Actual T004 closeout result

- **status**: `completed` — only T004 implementation plus the historical same-command `85/85 GREEN` fact; this does not claim P2, Phase, or Stage completion.
- **implementation boundary**: the authenticated `/Users/Hugh/Hugh/Project/3rd-review` `main` worktree contains exactly the six T004 allowlist files: `lib/adapters/antigravity.mjs`, `lib/provider-failure.mjs`, `lib/recovery-policy.mjs`, `lib/broker.mjs`, `lib/workflowhub-result-v3.mjs`, and `test/managed-session-lifecycle.test.mjs`. The existing `workflowhub-result-v3-hardening` negative was repaired within that boundary; this closeout worker added no source/test bytes.
- **RED → GREEN facts**: the task-declared command in `tasks.md:196` ran historically for T003 with `exit=1` and `85 tests / 77 pass / 8 fail`; the same command ran for T004 with `exit=0` and `85/85 pass`. Current RED is `quality/tests/output/P2-red.txt` (`sha256=1c6803fb226fa3d06f8e0417d1ab5f02ca35179764879acaf480b4cc3d159f35`); current GREEN is `quality/tests/output/P2-green.txt` (`sha256=cc8f4c9723e02f68124e3d6f8ebc6339096a81261f7dd9b0090c902371bb07f2`); RED→GREEN aggregate is `quality/tests/output/P2-red-green.txt` (`sha256=a36b8691da5543bc3463bbe62418902351d5fd099ba8a0f31ad8f3f2d4609667`, `49 lines / 5119 bytes`). Historical pre-* files remain unchanged.
- **current material identity**: `spec_sha256=7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847`; `material_revision=revision-f505d785a347ce041a4a7c80d28b0acbce1537103b04c1bc87636c35c16c8853`. The prior `revision-d693...` is not current.
- **AC facts**: T004 targeted GREEN covers all seven P2 target AC assertions (`AC-HEALTH-001`, `AC-HEALTH-002`, `AC-BROKER-001`, `AC-BROKER-002`, `AC-BROKER-003`, `AC-HEALTH-003`, `AC-HEALTH-004`) plus the existing v3 hardening negative. This remains targeted test evidence; independent review coverage is incomplete.
- **review fact**: `review=unavailable`, `dispatch_state=blocked_before_dispatch`, `result_ref=null`; canonical refs are `attempt=quality/reviews/attempts/a4b8755e-e893-5eff-aff8-873c1e3f79ea/attempt.json` and `report=quality/reviews/reports/build-code-simple-a4b8755e-e893-5eff-aff8-873c1e3f79ea.md`. The real error is `PROTOCOL_INCOMPATIBLE`: the review binding used `revision-d693aac95e68f5779923e7bce2f93f403f768e8a7b1c48e4e3f060af1593fc0e`, which mismatches current `revision-f505d785a347ce041a4a7c80d28b0acbce1537103b04c1bc87636c35c16c8853`; the requested `quality/reviews/` files are absent at closeout readback, so no review result exists to bind.
- **next pending task**: `T005 — RED：派发前预检、等待止损与源漂移分类` (`tasks.md:317-324`), still pending; read from `tasks.md`, not inferred.
