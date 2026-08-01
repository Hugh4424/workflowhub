# 实施计划：multica-ZHI-843

**输入**：accepted `spec.md`。  
**范围**：同 task 的一次性 runner replacement 与 Phase 1 → Phase 0 pointer recovery。  
**状态**：已修订，待最终审查。

## 目标与硬边界

- `runner-replacement`：显式 new runner、old OID ancestry、credential、accepted business snapshot 全部通过后，append-only lineage 并复用现有 final `task.json` atomic flip。
- `phase-pointer`：只允许 current Phase 1→target Phase 0；校验 fixed Phase 0 evidence/review/receipt closure 与 changed snapshot，复用 final `phase-result.json` atomic flip 写 Phase 0/`awaiting_review`；fresh `wh-review` pass 后才继续 Phase 1。
- 不新 task、不改历史、不造 generic reset/recover 或 production credential issuer；不改 Stage Skill/provider/global config/`stage-runtime` 参数白名单。
- failure/no-op 不消费 gate，success 只消费同 kind gate；runner/phase locks、credentials、generation 和 lineage 独立。

## 已执行研究

| 事实 | 计划取舍 |
|---|---|
| `core/task-handle.mjs` 有 migration lock、immutable record、last manifest atomic replace/rollback；`runtime/evidence/runner-identity.mjs` 有 real root/branch/HEAD/AGENTS/Skill checks。 | replacement 复用已有 write shape；initial migration 不变。 |
| `phase-evidence.mjs` 有 phase lock、receipt/tree/diff/formal review、same-Phase repair/current pointer。 | recovery ref 必须早于 `publishLocked` closed/needs_revision guards 和 `deriveBaseline`。 |
| Existing fixtures 覆盖 collision/drift/atomic failure/PASS-repair-continuation。 | 扩展 credential、specific-lock、gate isolation、old-byte 和 fault tests；不加第二 publish/state/barrier。 |

External research：跳过。无外部 API/version decision。

## 契约与发布规则

新增唯一 machine-readable source：

- `core/schemas/workflowhub-recovery-credential.v1.json`
- `core/schemas/workflowhub-recovery-generation.v1.json`

两份 schema `additionalProperties: false`。credential 固定 task identity、kind、nonce、issued_at、`decision: accepted`、accepted snapshot 和恰一个 kind subject；runner subject 绑定 old/new identity、manifest hash/stage；phase subject 绑定 current pointer、baseline Phase 0 evidence/review、Phase 1→0、snapshot、receipts/allowed files。generation 固定 kind/generation、credential、before/after ref/hash/tree、time/result。

新 `core/task-recovery.mjs` 是 schema validator entry，验证 safe task-relative refs、hash/OID、nonce/kind、accepted snapshot、runner provenance、Phase closure，输出全部规定 `RECOVERY_*` errors。

archive 可 create-only prewrite 但无引用不可消费。generation/gate summary/current manifest or pointer 仅走 existing final single atomic flip：runner replacement 必须在 `locks/task-identity-migration.lock` 内完成 archive + final manifest flip；phase-pointer 必须在 `locks/build-code-phase-evidence.lock` 内完成 archive + final pointer flip。same-kind competing mutation/fault 期间返回 `RECOVERY_CONCURRENT_CHANGE` 并不留下可见半状态；另一 kind 不成为 gate 输入。不增加 transaction/barrier；若 existing flip 不能证明 FR-REC-005，停止并新开最小 decision。

## 实施阶段

### Phase 1：schema、validator 与 shared recovery base

**文件**：新增两个 `core/schemas/*.json`、`core/task-recovery.mjs`、`core/__tests__/task-recovery.test.mjs`；修改 `core/task-handle.mjs`。

1. schema 覆盖 required/type/format/enum/extra field，`task-recovery` 统一 safe ref/hash/OID/identity/nonce/error validation。
2. `task-handle` 只加入 shared recovery archive/final-flip base、manifest replacement lineage reconstruction 和 test hooks；不包含 runner identity 检查或 kind-specific committer。
3. test-only canonical credential writer 仅 test import；`testHooks` 不能作为 production CLI arg、record field 或 normal publish input。
4. 分域 fault assertions：runner old/new manifest + old `runner_root_migration.previous_manifest_hash`；phase old pointer archive/current pointer/generation；双方 own/other gate 和 specified lock behavior。

**FR/AC**：FR-REC-002..005、FR-RUN-004、FR-PTR-003、FR-ERR-001、FR-COMP-001；AC-REC-01..04、AC-GATE-01。

### Phase 2：runner replacement（先合并 shared writer 变更）

**文件**：新增 `scripts/task-recovery.mjs`、`scripts/__tests__/task-recovery.test.mjs`；修改 `runtime/evidence/runner-identity.mjs`、`core/task-recovery.mjs`、`core/task-handle.mjs`、runner migration/bootstrap tests。

1. validate clean non-symlink Git top-level, exact branch/HEAD/AGENTS/Skill, old OID ancestor, manifest/new runner, accepted snapshot.
2. implement dedicated runner replacement branch over Phase 1 base: archive old manifest, `task-runner-root-replacement.v1`, runner generation/gate, final manifest flip inside exact runner lock. Reconstruct prior migration hash by excluding/normalizing only new replacement lineage fields; never modify old migration record.
3. `runner-replacement` explicit CLI args/help/output; new runner bootstrap/stage entry succeeds, old/wrong runner/caller injection fails.
4. test exact runner lock selection, same-kind lock contention/fault returns `RECOVERY_CONCURRENT_CHANGE`, phase gate/lock remains independent.

**FR/AC**：FR-REC-001、FR-RUN-001..006、FR-ERR-001、FR-COMP-001；AC-RUN-01..07、AC-GATE-01 runner half。

### Phase 3：phase-pointer（runner branch merged before shared-file edit）

**文件**：修改 `scripts/task-recovery.mjs`、`core/task-recovery.mjs`、`core/task-handle.mjs`、`workflows/build-code/phase-evidence.mjs`、phase/CLI tests。

1. validate only Phase 1→0, canonical baseline Phase 0 evidence + formal pass, receipts/test closure, allowed files and changed snapshot; same snapshot is no-op.
2. after Phase 2 shared-file merge, implement dedicated phase branch: archive old pointer, phase generation/gate/summary, final pointer flip inside exact phase lock. Test exact phase lock, same-kind contention/fault `RECOVERY_CONCURRENT_CHANGE`, runner gate/lock independent.
3. add second exclusive `phase-pointer` CLI command with common args and only `--stage=build-code`; serialize its same-file addition after runner CLI segment.
4. existing phase evidence input gains controlled recovery ref/hash; identify before specified guards/baseline; fresh pass/repair/new Phase 1 review ref rules.

**FR/AC**：FR-REC-001、FR-PTR-001..006、FR-ERR-001、FR-COMP-001；AC-PTR-01..04、AC-GATE-01 phase half。

### Phase 4：protocol、compatibility、formal evidence

Modify `docs/contracts/task-context.md`, CLI help, required e2e. Document both commands/fixed phase stage/credential/errors/gate/archive/fresh review/hand-edit prohibition. Run targeted RED/GREEN/fault/compat suites, then `npm test`, `npm run check`; retain fresh Phase/integration review evidence.

**FR/AC**：FR-ERR-001、FR-DOC-001、FR-COMP-001；AC-ERR-01、AC-COMP-01 plus recovery AC.

## One-time operation and rollback

runner: trusted host writes canonical credential → clean task-branch runner with old OID → official runner command → use returned new runner with existing bootstrap/stage entry.

phase: retain current Phase 1 + baseline Phase 0 facts + changed receipts/tests → trusted host writes canonical credential → `phase-pointer --stage=build-code` → existing phase evidence input with recovery ref/hash → fresh review pass → Phase 1.

reject/no-op: do not hand-edit JSON/delete archive; correct input and rerun official command. Success has no reverse reset; a new recovery target needs decision/spec.

## Scope, constitution, acceptance

**Change**：listed core/schema/script/phase/test/doc files. **No change**：Stage Skills, stage-runtime flags, wh-review/provider/config, Multica/global config, history.

| Constitution | Result |
|---|---|
| F1/F2/F8/F10 | [x] two narrow CLIs; reuse locks/final flips; no reset/issuer/barrier. |
| F3/F9 | [x] facts and fault tests recomputable/falsifiable. |
| F4/F7/Q1-Q3 | [x] fresh independent review + stage confirmation; no fake pass. |
| F5/F6 | [x] only evidenced gates; canonical lineage. |
| S1-S8 | [x] reuse in-repo TaskHandle/Vitest/wh-review; no new skill. |

**21/21 pass.**

| Area | FR | AC | Evidence |
|---|---|---|---|
| schema/final flip/locks | FR-REC-002..005 | AC-REC-01..04, AC-GATE-01 | unit + lock/fault tests |
| runner | FR-RUN-001..006, FR-REC-001 | AC-RUN-01..07 | CLI + bootstrap continuation |
| Phase | FR-PTR-001..006, FR-REC-001 | AC-PTR-01..04 | phase/fresh-review sequence |
| docs/compat | FR-DOC-001, FR-COMP-001 | AC-ERR-01, AC-COMP-01 | help/tests/check |

**build-code input**：accepted `spec.md`、this `plan.md`、`tasks.md`。T001→T014；shared base → runner → phase → full evidence。
