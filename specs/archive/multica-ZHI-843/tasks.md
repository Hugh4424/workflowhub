# 实施任务：multica-ZHI-843

**输入**：accepted `spec.md` 与 `plan.md`。
**测试**：Vitest；定向 `npx vitest run <files>`，完成前 `npm test`、`npm run check`。
**不变式**：explicit identity、canonical refs/hashes、history append-only；failure/no-op no gate consumption；no Stage Skill/provider/config/stage-runtime flag change。

## 阶段 1：schema、validator、shared base

- [ ] T001 [shared] 新建 `core/schemas/workflowhub-recovery-credential.v1.json`、`core/schemas/workflowhub-recovery-generation.v1.json`：required/type/format/enum/kind `oneOf`/`additionalProperties: false`。
  FR：FR-REC-003/004、FR-ERR-001。依赖：无。验证：schema fixtures required/format/enum/extra/nonce。

- [ ] T002 [shared] 新建 `core/task-recovery.mjs`：唯一 schema validator entry，safe ref/hash/OID/task/accepted snapshot/credential/generation and stable `RECOVERY_*` errors。
  FR：FR-REC-002/003/004、FR-ERR-001。依赖：T001。验证：missing/inline/noncanonical/mismatch/replay zero mutation。

- [ ] T003 [shared] 修改 `core/task-handle.mjs`：仅建立 shared recovery archive/final-flip base、replacement lineage reconstruction/test hooks；kind-specific runner/phase committers 留给 T006/T010。
  FR：FR-REC-004/005、FR-RUN-004、FR-PTR-003。依赖：T002。验证：shared base supports both domain suites; no new barrier/transaction.

- [ ] T004 [P] [tests] 新建 `core/__tests__/task-recovery.test.mjs` test-only credential fixture/writer；`testHooks` only test API option，never production CLI/normal input/record schema。
  FR：FR-REC-003/005、FR-COMP-001。依赖：T001。验证：fixture no production import; production input cannot supply hook/inline credential。

## 阶段 2：runner replacement（shared files first merge）

- [ ] T005 [runner] 修改 `runtime/evidence/runner-identity.mjs`/`core/task-recovery.mjs`：clean real Git top-level、exact branch/HEAD/AGENTS/Skill、old OID ancestor、manifest/new identity、accepted business snapshot validation。
  FR：FR-RUN-001..003。依赖：T002、T003。验证：nested/symlink/dirty/branch/contract/ancestor/business mismatch zero mutation。

- [ ] T006 [runner] 修改 `core/task-handle.mjs`/`core/task-recovery.mjs` 的 runner-only branch：archive manifest、`task-runner-root-replacement.v1`、runner generation/gate，inside `locks/task-identity-migration.lock` final manifest flip；prior migration hash reconstruction excludes/normalizes new replacement fields only。
  FR：FR-RUN-004/005、FR-REC-004/005。依赖：T003、T005。验证：exact runner lock held across archive+final flip; same-kind contention/fault returns `RECOVERY_CONCURRENT_CHANGE`; old/new manifest and old `runner_root_migration.previous_manifest_hash` invariants recalc; phase lock/gate unchanged。

- [ ] T007 [runner] 新建 `scripts/task-recovery.mjs` runner segment：`runner-replacement` strict args/help/output；new `scripts/__tests__/task-recovery.test.mjs` runner integration。
  FR：FR-REC-001、FR-RUN-006、FR-ERR-001。依赖：T006。验证：new bootstrap/stage entry success; old/wrong/caller injection fail。

- [ ] T008 [P] [runner-regression] 更新 runner migration/bootstrap tests。
  FR：FR-RUN-004/005、FR-COMP-001。依赖：T006。验证：targeted Vitest suites。

## 阶段 3：phase-pointer（shared files after runner merge）

- [ ] T009 [phase] 修改 `core/task-recovery.mjs` phase validator：only Phase 1→0; baseline evidence/pass review/receipt-test closure/allowed files/changed snapshot。
  FR：FR-PTR-001/002/006。依赖：T002、T003；T004 only test support。验证：pointer/evidence/review/tree/closure/same-snapshot/cross-kind rejects zero mutation。

- [ ] T010 [phase] 修改 `core/task-handle.mjs`/`core/task-recovery.mjs` phase-only branch，**after T006 merges shared files**：archive `phase-result.json`、phase generation/gate/summary，inside `locks/build-code-phase-evidence.lock` final pointer flip to awaiting_review。
  FR：FR-PTR-003、FR-REC-004/005。依赖：T006、T009。验证：exact phase lock held across archive+final flip; same-kind contention/fault returns `RECOVERY_CONCURRENT_CHANGE`; pointer/archive/generation recalc; runner lock/gate unchanged。

- [ ] T011 [phase] 修改 same `scripts/task-recovery.mjs` **after T007 runner segment**：second exclusive `phase-pointer`, common args + only `--stage=build-code`, wire T010, help/output/reject tests。
  FR：FR-REC-001、FR-PTR-001、FR-ERR-001、FR-DOC-001。依赖：T007、T010。验证：missing/wrong-stage/wrong-runner zero mutation。

- [ ] T012 [phase] 修改 `workflows/build-code/phase-evidence.mjs`：existing input only recovery ref/hash；recognize recovered Phase 0 before `publishLocked` closed/needs_revision guards and next-Phase `deriveBaseline`; fresh pass/repair/new Phase 1 ref。
  FR：FR-PTR-003..005。依赖：T011。验证：old/wrong/revise/unavailable no continuation; repair no reconsume; Phase 1 requires new review。

- [ ] T013 [phase-tests] phase/CLI tests：success/reject/fresh review/repair/Phase 1 continuation/normal reopen。
  FR：FR-PTR-001..006、FR-COMP-001。依赖：T004(test support)、T012。验证：targeted Vitest AC-PTR-01..04/AC-GATE-01。

## 阶段 4：protocol + full evidence

- [ ] T014 [cross-cutting] update `docs/contracts/task-context.md`/help/e2e；document both commands/fixed stage/credential/errors/gate/archive/fresh review/no hand edit；run targeted suites, `npm test`, `npm run check`, record fresh Phase/integration review facts。
  FR：FR-ERR-001、FR-DOC-001、FR-COMP-001。依赖：T008、T013。验证：AC-REC/RUN/PTR/GATE/ERR/COMP full evidence。

## 真实依赖与停止点

```text
T001 ─┬─ T002 → T003 → T005 → T006 → T007 → T008 ─┐
      │                                              ├→ T014
      └─ T004                                        │
                         T003 → T009 ───────────────┘
                                       ↓
                            T006 + T009 → T010 → T011 → T012 → T013 ─┘
```

- T006 and T010 touch `core/task-handle.mjs`/`core/task-recovery.mjs`: explicitly serial merge order T006 then T010. T007/T011 likewise serial same-file segments.
- T004 is test-only and not a production prerequisite.
- Stop on visible half state, wrong/missing specified lock, absent fresh Phase 0 pass, or missing test evidence. No best-effort fallback or manual records edit.
