# Task Plan: workflowhub mechanism waste reduction build-code

## Goal

在认证 worktree 分支内按当前四份材料完成 build-code P1–P7，覆盖 T001–T017 的真实实现、定向测试、独立 review、finding 处置、最终聚合与阶段事实；不执行 commit、push、merge、archive 或 close。

## Next Step

修复 final integration review 的 raw test-output 解析问题；重新捕获当前实现/最终测试证据，提交一次 `phase_id=null` integration review，再按真实结果完成阶段末事实；无 commit、push、merge、archive 或 close。

## Current Phase

Phase P7 same-task integration review repair

## Phases

### Phase P1: Review source scope / validity freeze
- [x] T001 RED
- [x] T002 GREEN
- [x] route/testing/review/finding disposition/task facts
- **Status:** complete

### Phase P2: Delete review budget machinery
- [x] T003 RED
- [x] T004 GREEN
- **Status:** complete

### Phase P3: External member termination semantics
- [x] T005 RED
- [x] T006 GREEN
- **Status:** complete (review unavailable fact retained)

### Phase P4: Early publish / late supplement contract
- [x] T007 RED
- [x] T008 GREEN
- **Status:** complete (review unavailable fact retained)

### Phase P5: Write identity before formal writes
- [x] T009 RED
- [x] T010 GREEN
- **Status:** complete (semantic review available at minimum threshold; Codex provider failure retained)

### Phase P6: Acceptance single writer / interaction publication
- [x] T011 RED
- [x] T012 GREEN
- [x] route/testing/review/finding disposition/task facts
- **Status:** complete (semantic review partial; provider failure and minor finding facts retained)

### Phase P7: Close / handoff / runtime ergonomics / final aggregate
- [x] T013 RED
- [x] T014 GREEN
- [x] T015 RED
- [x] T016 GREEN
- [x] T017 FINAL
- [x] stage-end spec-analyze / publish / reflection / handoff facts
- **Status:** implementation and targeted aggregate complete; integration-review repair GREEN, final integration review and current-stage completion still pending

### Same-task final integration review repair
- [x] RED: integration subject rejects task cards that list raw `quality/tests/output/*.output` beside a structured receipt
- [x] GREEN: raw test-output refs are ignored for structured bindings; `integration-review-subject.test.mjs` 9/9
- [ ] current implementation/test receipts and final integration review
- [ ] stage-end outcome/reflection/handoff after the final review

## Decisions Made

| Decision | Rationale |
|---|---|
| Work only in `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-waste-reduction-20260915` | Authenticated task worktree; shell checkout `main` is dirty and not the task worktree. |
| Use only the current four materials as product authority | build-code contract; old reviews and history are facts only. |
| Keep commit/push/merge/close pending | No separate irreversible-delivery authorization. |
| Non-UI route | Current spec freezes `non_ui`; use backend testing, no browser QA. |
| P6 public ingress | `interaction_aggregate` was added to the existing public `run` allowlist because FR-RUNTIME-001 already requires that route; no new command or control plane was introduced. |
| P6 review repair | The review-identified retry explanation was corrected and covered by the P2 deletion contract; the stale interaction-allowlist finding was rejected after checking the current source. |
| P7 remote cleanup | Remote branch deletion stays nested in the existing cleanup action; `runtime/task/task-store.mjs` remains unchanged so the frozen five-action schema is not a second control plane. |
| P7 review repair | Five direct actionable findings were repaired and covered by targeted tests. Running v3 snapshots require the publication envelope; retry admission requires an authenticated material/route/source change; unknown future-material names fail closed. The one P7 review was not rerun; its immutable result remains recorded. |
| P7 protocol metadata | v3 provider protocol/schema and wh-review bundle/catalog hashes were synchronized after the repair. |
| P7 stage-end truth | The local bridge published an explicit `unavailable` Stage Agent outcome; public run authenticated it and published a current non-authoritative handoff. Missing implementation/test quality facts and absent reflection executor remain visible; they are not completion permits. |

## Errors Encountered

| Error | Resolution |
|---|---|
| External Knowledge task directory disappeared from filesystem enumeration | Preserve as unavailable fact; use authenticated worktree and current materials; do not recreate it manually. |
| Legacy simple-review-runner regression fixtures omit explicit threshold/model fields | Keep the mandatory vNext contract; record the bounded legacy-suite failure as out-of-scope for T017 instead of weakening production validation. |
| First public stage run saw snapshot mismatch | The input file had been created inside the worktree after the bridge outcome. Removed that input, regenerated the outcome, and used a worktree-external explicit input path; no test rerun. |
| Final integration subject aborted on a raw test-output ref | `completedTasks` attempted to parse `quality/tests/output/*.output` as JSON. Added a bounded filter for raw test-output refs and a regression test; structured receipt validation remains unchanged. |
