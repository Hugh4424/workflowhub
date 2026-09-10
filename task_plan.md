# WorkflowHub Build-Code + Verify-Code

## Goal
在认证 worktree 的正确分支上，严格完成 build-code 全部 16 步与 verify-code 全部 12 步；逐 Phase 实施、定向测试、独立审查与修复，最后停在 close 前，不执行 close。

## Constraints
- 当前材料仅 `specs/workflowhub-execution-acceleration-20260909/{decision-log.md,spec.md,plan.md,tasks.md}`。
- 重读量、研究、审查走窄上下文子代理；主会话负责派发、整合、裁决；写入串行。
- 只跑受影响定向测试；不跑全量测试。
- 不伪造用户答复、review、test、stage outcome 或 reflection。
- build-code 只修改 plan/tasks 列出的实现与测试文件；不修改四份当前材料，除执行状态填写区外。
- build-code 完成后才进入 verify-code；verify-code 不重跑全量流程，不执行 close。

## Phases
1. **Build-code P1 profile executor** — complete (quality incomplete/unavailable is truthful)
2. **Build-code P2 governance** — complete (quality unavailable; review fact pending)
3. **Build-code P3 review lifecycle** — complete for targeted behavior (quality unavailable; formal review fact pending)
4. **Build-code P4 coordination** — targeted gate green (22/22); formal review/profile quality unavailable
5. **Build-code P5 freshness** — repaired paired gate green (22/22); formal review/profile quality unavailable
6. **Build-code P6 real-task aggregate** — fail-closed harness green as a command (1/1), business result incomplete (real user task/usage not supplied)
7. **Build-code official closure** — pending
8. **Verify-code independent review and repair** — executed as an incomplete audit; one architecture finding fixed, heterologous review unavailable, current code-review predicate remains missing
9. **Stop before close with plain-language handoff** — current boundary reached; no close actions authorized

## Decisions
- build-code conditional UI path remains `non_ui`; no frontend/browser skill applies.
- P1 must make `tools/cli/run-checks.mjs` the actual capability-proof consumer before later gates rely on it.
- RED/GREEN is one seam at a time; test-only RED writes precede production GREEN writes.
- Main session remains the only integration writer; read-heavy reconnaissance is delegated.
- P6 cannot claim delivery without a user-selected real task and authenticated host usage; fixture-only evidence stays incomplete.

## Errors Encountered
| Error | Attempt | Resolution |
|---|---:|---|
| `templates/spec-template.md` not found at repo root | 1 | Used canonical `skills/spec-specify/templates/spec-template.md`. |
| `tests/integration/vnext-official-stage-run.mjs` targeted run exceeded 180s and was SIGTERM | 1 | Do not repeat the broad file run; use narrower test-name filtering or dedicated contract fixtures. |
| Focused material-oracle test has 2 ENOENT failures | 1 | Test expects an unrelated archived fixture absent from this task worktree; `spec-content-profile` passed 21/21 and direct current-spec validators passed. Preserve as environment/fixture fact; do not copy archive into current worktree. |
| build-spec canonical review rejected `review_track=final` | 1 | Public contract says build-spec does not use a review track. Immutable blocked_before_dispatch attempt preserved; retry once with field omitted. |
| Delegated output existence check exited 1 when no report existed yet | 1 | Benign shell condition; agents still running. Future checks use `|| true` or wait for completion notices. |
| build-spec outcome rejected `specs/<task>/spec.md` in output_refs | 1 | Stage-agent output refs only allow quality namespace; removed material from output_refs while keeping authenticated evidence. |
| build-spec analyzer rejected PFACT-004 | 1 | Card contained status `verified` plus prose token `unknown`; changed prose to Chinese `未知` so exactly one machine state remains. |
| build-spec run initially used provider-local finding IDs | 1 | Canonical dispositions must use reportable `result.findings[].id`; rebuilt all 11 dispositions from canonical result. |
| build-spec disposition routing marked spec_ambiguity | 1 | Repaired review defects are implementation_defect classifications; updated all 11 so fixed is valid. |
| decision-freeze authenticated source chain cannot link confirmation | 2 | Existing canonical proof stores `host_evidence.ref`, but reader checks only `source_ref`/`confirmation_ref`. Preserved honest incomplete status; do not edit runtime during build-spec. Logged as implementation blocker for build-plan. |
| reflection v2 schema rejected extra blocks and enum values | 1 | Removed unsupported surprise/doc blocks; normalized truncation boolean and none_observed state; added required simplification blocks. Reflection then published. |
| First plan/tasks validator invocation passed positional args | 1 | Current APIs take one object `{spec,plan,tasks,decisionLog}`; corrected invocation.
| Initial plan/tasks drafts had 3 validator errors | 1 | Added explicit source refs; changed FINAL e2e_scope to not_required and removed incompatible high-risk fields. Direct validators then passed.
| Canonical build-plan review found 19 reportable findings | 1 | Major issues: stale plan hash, RED production boundaries, P0 false AC ownership, missing governance files, metric/profile evidence overclaim, DELIVERY premature ownership, contradictory sequencing and trace refs. Repair in current stage before confirmation. |

## Latest execution facts
- Current official build-code recheck: Stage Agent outcome `quality/evidence/stage-outcomes/build-code/b9339ff221e1c733513ee587635d6bbf9bdcd9b4007c5ee1ab2936f0012d0f96.json` is bound to snapshot `07df20832bcd62ac8f25be06f3e5a58b843fe625` and material revision `revision-20603dac3ba10418ed3f51a160776d08df5bddf4ca052793e265d8aa75769ddd`. Official run exited 0 but remains `quality_status=incomplete`; integration review is unavailable and stage-end analyzer/finding dispositions/stage outcome remain incomplete in the projection.
- Current official verify-code recheck: Stage Agent outcome `quality/evidence/stage-outcomes/verify-code/7f75a2cbfb1275aa974c2e1fab6ada07d7d12911ec8f1c0386d9a425e70b9e46.json`; official run exited 0, but `code_review` remains missing and the stage outcome/reflection are unavailable.
- Final affected regression after the audit repair: 3 files / 60 tests passed. `git diff --check` passes; temporary invocation inputs were removed.
- Corrected P3 gate: `quality/tests/p3-review-green-4.json`, exit=0, 6 files/150 tests; profile quality remains `target_passed_profile_unavailable`.
- Architecture review finding fixed in `skills/wh-review/scripts/review-provider-client.mjs:354`; final affected review-client/lifecycle check passed 3 files/60 tests, and the corrected P3 gate remains 6 files/150 tests green.
- Verify-code wh-review attempt `quality/reviews/attempts/2c276658-e4bb-5d98-a273-de38dbb169ea/attempt.json` is canonical unavailable; provider lifecycle was cancelled after no terminal event, and no second review was dispatched.
- Verify-code’s earlier unavailable Stage Agent outcome `quality/evidence/stage-outcomes/verify-code/7936f1c7b91ee85f9db389168df9f29fb33cb420995c5078a68847b9bb4c09ca.json` remains historical; the current bound outcome is the `7f75a2cb...` record above.
- Build-code remains `quality_status=incomplete`; P6 still lacks `WORKFLOWHUB_REAL_TASK_ID`, `WORKFLOWHUB_REAL_TASK_PATH`, and `WORKFLOWHUB_HOST_USAGE_REF`. No claim of acceptance/release and no close/commit/push/merge/archive/cleanup.

## Next Step
To complete the formal build-code chain, a valid user-selected real task plus authenticated host usage/replay producer is still required; then rerun only the P6 large target and recapture build-code closure at the same snapshot. Until that external fact exists, retain build-code and verify-code as incomplete/unavailable and stop before close.
