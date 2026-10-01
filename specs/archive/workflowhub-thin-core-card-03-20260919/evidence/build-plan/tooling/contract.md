# CARD-03 build-plan — machine-checked contract for post-cohort spec.md / phases/P<n>.md / phases/index.md

Read-only investigation of worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`. No repo file was modified. No test suite was run. The only thing executed was the read-only checker `/tmp/card03-bp/validate-post.mjs`, against archived examples.
Current task dir `specs/workflowhub-thin-core-card-03-20260919/` holds `attachments/`, `decision-log.md`, `design.md` and `evidence/forensics`. It has no spec.md or phases/ yet.

---

## 0. Top 10 rules the validators actually enforce

1. Phase H1 must match `^#\s+(?:Phase|阶段)\s+Pn\b`, e.g. `# Phase P1 — …`. wh-review projection is stricter: it requires the literal `# Phase Pn` (`runtime/review/provider-material-projection.mjs:109`). **Use `# Phase Pn`, not `# 阶段 Pn`.**
2. Each Phase needs level-2 headings `## L0…`, `## L1…`, `## L2…`. Task cards are `### Tnnn — outcome` level-3 sections **between `## L1` and `## L2`**.
3. File-level fields are the **first** `- **Label**：value` match in the whole file, one line only. Put the header block before any card. Required: Global spec (must contain `spec.md`), Write set, Dependency, Consumer, gate_cmd (executable), oracle (`ORACLE-…` at value start), evidence_path, STOP, Done.
4. The index heading must be **exactly `## Execution Index`**. `## 执行索引` passes validatePostPhaseContract and phaseFilesFromIndex, but wh-review `providerMaterialEntries` splits only on `^##\s+Execution Index\s*$` (projection.mjs:101), so the review would be MATERIAL_INCOMPLETE.
5. Index table: exactly 6 cells `| phase | authority ref | semantic anchor | write set | dependency | consumer |`. Phase cell is exactly `` `Pn` ``, authority is exactly `` `phases/Pn.md` ``, and P1..Pn are contiguous. No `- gate_cmd/expected_exit/oracle/evidence_path` bullets in the index.
6. Phase Write set (backticked tokens) must equal the index write-set cell. No path may appear in two Phases. Phase Consumer must equal the index consumer text; only trailing `。；;` is stripped.
7. Card `Dependency` with no P/T ID must be **exactly** `none` / `无` / `无前序` / `无依赖`. No backticks, no trailing prose. This is the one error in both card-05 and card-07.
8. Card RED target failure and GREEN oracle must start with the same `ORACLE-…` ID. The spec Trace row for that `Pn/Tnnn` must carry the same ORACLE ID.
9. spec.md needs `## 实现设计（全局权威）` (or `## Implementation Design`) with 4 concrete subsections. It also needs `## 材料导航` within the first 80 lines, with columns 章节 / 摘要 / 读取时机, because the packet builder enforces it.
10. Exactly one Task card across all Phases must carry `- **acceptance_role**: acceptance` + `- **acceptance_data**: [JSON]`. Otherwise build-code's acceptance projection is unavailable. This is not a build-plan error.

---

## 1. Templates (authoring guidance, not all machine-checked)

### 1.1 spec.md — `skills/spec-specify/SKILL.md` + `skills/spec-specify/templates/spec-template.md`
- `SKILL.md:10-16`: one `Appendix A` is the exclusive AC authority.
- `SKILL.md:33-37`: `## 材料导航` near the top. Rows give section, summary and timing.
- `SKILL.md:56-60`: each AC uses plain, unindented labels in order `验证：` `通过：` `失败：` `证据：`. The validator does not check these; card-07 used nested `- **验证方法**` etc. and passed.
- `SKILL.md:73-79`: IDs `FR-{DOMAIN}-{NNN}`, `AC-{DOMAIN}-{NNN}`, `PFACT-{NNN}`.
- `SKILL.md:88-95`: PFACT status is verified / inferred / unknown / not_applicable.
- Template headings in order:
  - `## 速读卡（30 秒）`, `## 来源与决策映射`
  - `## 1. 需求解释：问题与紧迫性`, `## 2. 背景、目标与范围`
  - `## 3. 用户场景与状态覆盖` (### SCN-001…, 状态覆盖清单)
  - `## 4. 产品事实与假设（PFACT）`
  - `## 5. 功能需求` (`- **FR-DOMAIN-001**：…`)
  - `## 6. 模块划分`, `## 7. 关键实体`, `## 8. 数据和生命周期`, `## 9. 兼容性预留`, `## 10. 明确不做与默认必须成立`
  - `## 验收流程`, `## 测试标准`, `## 架构边界`
  - `## 实现设计（全局权威）` → `### 代码锚点`, `### 接口与失败语义`, `### 全局文件边界与依赖`, `### 需求到任务追踪`, `### 全局验证策略`
  - `## Appendix A — 验收判据（唯一权威）` (`- [ ] **AC-DOMAIN-001**：…`)
  - `## 12. 风险、未决与交接`, `## 13. 业务影响与回归范围`
- Trace table columns in the template: `来源/决定 | 原义行为/强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 | 依赖 / 状态`.

### 1.2 Phase — `skills/spec-plan/SKILL.md` (34 lines), `skills/spec-plan/templates/phase-template.md` (217 lines)
- `SKILL.md:10`: spec.md owns global design: code anchors, solution, interfaces, file boundary, dependency graph, source→FR→AC→Phase→oracle trace, risks, rollback, testing.
- `SKILL.md:14`: every Task gets a card.
- `SKILL.md:16`: T IDs are global and continuous. T001 is used only for the first task.
- `SKILL.md:20`: exact write sets, no globs, single owner.
- `SKILL.md:22`: DO NOT TOUCH needs a verbatim real-read record (path, fields, command, date).
- `SKILL.md:28`: G-2 rule, quoted in §5.
- `SKILL.md:30`: each RED is attributed as `目标行为失败` / `夹具或环境失败` / `本来就通过`.
- `SKILL.md:34`: bind to the stage-input packet.
- Template layout:
  - `# Phase P<n> — …`
  - `## Phase 契约头（文件级字段；runtime 逐字读取）` with bullets `- **全局规格**:`, `- **写入集**:`, `- **依赖**:`, `- **消费者**:`, `- **gate_cmd**:`, `- **oracle**:`, `- **evidence_path**:`, `- **STOP**:`, `- **Done**:`. Line 18: gate_cmd / oracle / evidence_path / STOP / Done stay English. Line 17: bare `N/A`, empty, TBD, TODO, 待补充 and values starting with `[` are rejected; write `N/A — 理由`.
  - `## 速读卡`, `## 本 Phase 材料导航`, `## L0 — 结果与变更`
  - `## L1 — 可执行契约`
    - ### 文件边界 (新增 / 修改 / 禁止改动)
    - ### 任务顺序
    - ### 测试策略 (table 目标 | Task | 角色 | gate_cmd/预期退出码 | 判据/证据路径)
    - ### 覆盖边界, ### 停止, ### 完成
    - ### 风险与回滚 (风险 / 影响 / 缓解 / 回滚 / 触发条件)
    - ### 交接知识, ### 字段说明
    - `### Tnnn — outcome` cards
    - ### 编号与交接
  - `## L2 — 可删除参考`
  - **Caution**: the ### 文件边界 … ### 编号与交接 sections sit between L1 and L2. They are fine because only level-3 headings starting `T\d+` are treated as cards.
- Card fields (template lines 165-185):
  - 来源 / FR / AC; 输入; 文件 / 符号; 动作; 输出 / 失败; 边界 / 禁止改动; 依赖
  - 测试层级 / 技能 (simple|feature|fullstack plus exactly one skill)
  - 场景 / 夹具或服务; 预写测试; 可观察接缝
  - RED/GREEN 门禁命令; 预期退出码; RED 目标失败; RED 证据; GREEN 判定器; 证据
  - 覆盖上限; 停止 / 恢复; 测试变更请求; 完成
- A filled example is at template lines 187-209.

### 1.3 index — `skills/spec-tasks/templates/index-template.md`, `skills/spec-tasks/SKILL.md:10-12`
- Template: `# Phase 索引 — [任务名]`, `## 执行索引`, `| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |`.
- SKILL: one row per Phase, no commands / oracle / evidence, bijection with files, no cycles.
- **Template/runtime conflict**: the template's `## 执行索引` breaks wh-review projection (rule 4). Use `## Execution Index` with English header cells, as card-07 does. English header cells also satisfy phaseFilesFromIndex (`phase`, `authority ref`).

### 1.4 testing-system-blueprint / test-routing-advisor
- `skills/testing-system-blueprint/SKILL.md:15-27`: output covers scope, risk dimensions, tier, scenario, command, expected oracle, fixture/service, executor, evidence path, coverage limits and snapshot binding. Each behavior Task needs its own normal and negative cases, target RED and GREEN on the same `gate_cmd`, expected failing assertion, and STOP/recovery. It is written into the Phase Task cards; no separate ledger file.
- `skills/test-routing-advisor/SKILL.md:8`: "post build-plan 的预判写入所属 `phases/P<n>.md` 逐 Task 卡". It forbids running tests and modifying the repo. build-code's re-judgment goes into task facts.
- `workflows/build-plan/steps.json`:
  - step 7: "the blueprint does not replace the spec-plan step's separately recorded real target RED"
  - step 8: "Each behavior Phase has one selected concrete test route."

---

## 2. Runtime validators and verbatim error strings

### 2.1 `validatePostPhaseContract({ spec, index, phases })` — `runtime/stage/stage-content-contracts.mjs:7189-7388`
`phases` is an object keyed `"phases/Pn.md"`. Returns `{ ok, errors, facts }`.
In the strings below, `${p}` = `phases/Pn.md`, `${id}` = `Tnnn`, `Pn/T…` = e.g. `P1/T001`.

**Presence and index**
- "spec.md content is required"
- "phases/index.md content is required"
- "independent Phase files are required"
- "phases/index.md requires an Execution Index with Phase pointers": heading `## Execution Index` or `## 执行索引`; rows with exactly 6 cells; header row skipped if it starts `phase |` / `阶段 |` (executionIndexRows :4726)
- "Phase index must remain pointer-only; command, oracle, and evidence belong to Phase files": fires on index lines `- gate_cmd` / `- expected_exit` / `- oracle` / `- evidence_path`
- "Phase index must declare contiguous P1..Pn; expected Pn"
- "Pn authority ref must be phases/Pn.md"
- "Pn semantic anchor is required"
- "Pn consumer is required"
- "duplicate Phase authority ref: …"
- "unindexed Phase file: …"

**Phase file level**
- "${p} is missing or empty"
- "${p} must declare Phase Pn"
- "${p} is missing L0" / "…L1" / "…L2"
- "${p} Write set is missing"
- "${p} write set differs from Phase index"
- "${p} write set duplicates X owned by …"
- "${p} dependency must match the index and reference only earlier Phase IDs"
- "${p} requires a stable spec.md pointer": the Global spec value must contain `spec.md`
- "${p} consumer differs from Phase index"
- "${p} requires an executable gate_cmd and oracle"
- "${p} requires STOP, Done, and evidence_path"
- "${p} requires independent ### Tnnn task cards; one-line Tasks is insufficient"
- "${p} task card requires stable ### Tnnn — outcome heading": regex `^(T\d{3,})\s+[—–-]\s+\S`
- "${p} duplicate task card T owned by …"

**Card level**
- "${p} ${id} task card missing concrete ${field}", for each of 17 fields. A field is rejected if its value matches `/^(?:TBD|TODO|待补充|\[|N\/A\s*$)/i`:
  1. `Source / FR / AC`
  2. `Files / symbols`
  3. `Action`
  4. `Inputs`
  5. `Outputs / failure`
  6. `Boundary / DO NOT TOUCH`
  7. `Dependency`
  8. `Test tier / skill`
  9. `Scenario / fixture or service`
  10. `RED/GREEN gate_cmd`
  11. `expected_exit`
  12. `RED target failure`
  13. `GREEN oracle`
  14. `Evidence`
  15. `STOP / recovery`
  16. `Coverage limit`
  17. `Done`
- Not checked: `预写测试` / Prewritten test, `RED 证据` / RED evidence, `可观察接缝`, `测试变更请求`. They are optional for the validator but required by the template and SKILL.
- "${p} ${id} Source / FR / AC must bind original source, FR, and AC": needs an FR ID, an AC ID, and `\b(?:R|U|PRD|CARD)-[A-Z0-9-]+\b`
- "${p} ${id} Files / symbols must name owned write-set paths": every backticked token containing `/` or `.` must be in this Phase's write set, and there must be at least one
- "${p} ${id} Files / symbols must name a symbol or explain N/A for non-code files": the value contains `symbol`, `符号` or `N/A — x`
- "${p} ${id} needs one executable RED/GREEN gate_cmd"
- "${p} ${id} needs an identifiable GREEN oracle": the value starts with `ORACLE-`
- "${p} ${id} RED oracle must match GREEN oracle": the first `ORACLE-…` in RED target failure equals GREEN's
- "${p} ${id} RED target failure must identify the failing assertion": contains assert, 断言, expected, 预期, nonzero or 失败
- "${p} ${id} expected_exit must distinguish RED target failure from GREEN 0": one line matching `RED[^\n]*\b(?:nonzero|[1-9])\b` and `GREEN[^\n]*\b0\b`. Example: `RED nonzero 来自目标断言；GREEN 0`
- "${p} ${id} Dependency must identify an existing prerequisite or none"
- "Pn/Tnnn dependency must be none or identify a Phase/Task": a value with no IDs must be exactly `none` / `无` / `无前序` / `无依赖` (WITHOUT_PREDECESSOR)
- "Pn/T dependency Px must be an earlier Phase"
- "Pn/T dependency Tx must be an existing earlier task"
- "Pn/T task card references unknown FR: …" / "…unknown AC: …"

**spec.md**
- "spec.md requires Implementation Design (全局权威)": level-2 heading `实现设计（全局权威）` or `Implementation Design`
- "spec.md Implementation Design requires concrete Code Anchors" / "…Interfaces and Failure Semantics" / "…Requirement-to-Task Trace" / "…Global Verification Strategy". Aliases: ### 代码锚点 / 接口与失败语义 / 需求到任务追踪 / 全局验证策略. Any of these fails on placeholder noise: `<!-- -->`, `{...}`, `[填写：…]`, or a lone TBD/TODO/待补充 outside backticks or code fences.
- "spec.md Code Anchors must identify a concrete path": a backticked token containing `/` or `.`
- "spec.md Requirement-to-Task Trace needs source → FR → AC → Phase/Task → oracle rows": each table row needs `(R|U|PRD|CARD)-X`, an FR ID, an AC ID, `P\d+/T\d{3,}` and `ORACLE-…`
- "spec.md Requirement-to-Task Trace is missing FR: x" / "…missing AC: x" / "…missing Pn/Tnnn FR/AC binding"
- "spec.md Requirement-to-Task Trace Pn/Tnnn oracle differs from task card"
- "spec.md Global Verification Strategy requires a concrete command": a backticked command starting npx, npm, pnpm, yarn, bun, node, python, pytest, go, cargo, make, bash, sh, git or ./
- "FR has no executable Phase task coverage: x"
- "AC has no executable Phase task coverage: x"
- "spec.md requires accepted FR and AC definitions"

**Grammar**
- FR is declared by `^-\s+\*\*(FR-…)\*\*`.
- AC is declared by `^-\s+(?:\[[ xX]\]\s+)?\*\*(AC-…)\b`.
- ID grammar (:9): FR `FR-[A-Z][A-Z0-9]*-\d{3}`; AC `AC(?:\d{1,3}|-\d{1,3}|(?:-[A-Z][A-Z0-9]*)+-\d{1,3})`.
- Active ACs come from `acceptanceCriterionDispositions` (:8426); markers deferred / 延期 / 不计入 / not_applicable exclude an AC from the coverage requirement.
- `fieldValue` (:4993): `^\s*-\s+\*\*(label|aliases)\*\*\s*[:：]\s*(.+?)\s*$`, first match, multiline, case-insensitive.
- `hasExecutableCommand` (:4824): the first backtick span must start mkdir, npx, npm, pnpm, yarn, bun, node, python, pytest, go, cargo, make, bash, sh, git or ./.
- FIELD_LABEL_ALIASES (:4455) — Chinese labels you may use:
  - File level: Global spec=全局规格; Write set=写入集 / 写集; Dependency=依赖; Consumer=消费者; STOP=停止; Done=完成; gate_cmd=门禁命令; oracle=判定器; evidence_path=证据路径.
  - Card: `来源 / FR / AC`, `输入`, `文件 / 符号`, `动作`, `输出 / 失败`, `边界 / 禁止改动` (or `边界 / 不得改动`), `依赖`, `测试层级 / 技能`, `场景 / 夹具或服务`, `RED/GREEN 门禁命令`, `预期退出码`, `RED 目标失败`, `GREEN 判定器`, `证据`, `停止 / 恢复`, `覆盖边界` / `覆盖上限`, `完成`.
  - **Pitfall**: file-level fields are the first match in the file. If a header field is missing, a card's `依赖` / `完成` line gets read as the Phase-level value. Keep the header complete and at the top.

### 2.2 `runtime/task/material-workspace.mjs`
- `:9` `POST_BASE_MATERIAL_FILES = ["decision-log.md","spec.md","phases/index.md"]`.
- `phaseFilesFromIndex` (`:12-40`) needs an `## Execution Index` / `## 执行索引` line, and header cells `phase` / `阶段` plus `authority ref` / `权威引用` / `权威来源`. Errors:
  - "post Phase index is missing"
  - "post Phase index lacks Execution Index section"
  - "post Phase index lacks phase/authority ref columns"
  - "post Phase index row has mismatched Phase authority"
  - "post Phase index has no Phase refs"
  - "…unsafe Phase ref"
  - "…duplicate Phase refs"
  - "post Phase index must list consecutive ordered Phases"
- `inspectMaterialWorkspace` (`:163`) flags an on-disk `phases/*.md` that is not indexed as `unindexed_phase`.
- `validateMaterialNavigation` (`:250`): `## 材料导航` within the first 80 lines, table header containing 章节, 摘要, 读取时机, at least 2 rows with no empty cells. Codes: `material_navigation_section_missing` / `material_navigation_columns_missing` / `material_navigation_row_incomplete`. `buildStageInputPacket` (`:339`) applies it to spec.md and throws "spec material navigation is incomplete".

### 2.3 Official handler — `runtime/stage/stage-handlers.mjs:3970` (HANDLERS["build-plan"])
- Post flow: reads the index and the cohort files, then runs `validatePostPhaseContract`. On failure it throws `build-plan minimum executable contract failed: <errors joined "; ">`.
- Builds `stageInputPacketFacts(worker, "build-plan", materials)` (`:98`) internally from worker.currentMaterialRevision and the snapshot.
- Always pushes the missing item (`:4010`): "prewritten target RED evidence is not authenticated by the post build-plan handler; Phase command/oracle text is only a declaration".
- In self_checks, `no_prewritten_test` is hard-coded `false` for post (`:2798-2801`).
- completion_subjects: fr_coverage, ac_coverage, dependencies, deletion_proofs, executable_tasks. deletion_proofs looks for `deletion proofs?|删除证明|不涉及删除|no deletion` in the Phase text; write e.g. `- **Deletion proof**：N/A — 不删除…`.
- test_strategy uses the **last** Phase's header gate_cmd.

### 2.4 spec-analyze (post)
- `stage-content-contracts.mjs:6632` holds the build-plan contract; `validateStageSpecAnalyzeProfile` is at `:6680`.
- Post requires `packet.materials {decision_log, spec, phase_index, phases}`; otherwise "MATERIAL_INCOMPLETE: … material is required for post build-plan".
- It then re-runs validatePostPhaseContract and reports its errors as findings under rule `post-build-plan-structural-report`. Structure only (`docs/standard-workflow.md`, 专业质量 section).

### 2.5 Build-code acceptance projection — `projectPostPhaseAcceptanceExecutionData` (:8300)
- Needs exactly one card with `- **acceptance_role**: acceptance` and `- **acceptance_data**: [{"source":…,"sample":…,"scenario":…,"tier":"command|service|browser","execution":…}]`.
- Optional `ui_scope` and `e2e_scope` (`not_required` disables the independent E2E verdict).
- Error example: "post Phase acceptance contract requires one acceptance_role=acceptance Task".

### 2.6 wh-review post projection — `runtime/review/provider-material-projection.mjs:91-120`
- Request `materials` must include `phase_authorities` (a plain object `{ "phases/P1.md": "<text>", … }`) and `phase_index` (string).
- The index is parsed only under `^##\s+Execution Index\s*$`.
- Row count must equal ref count, which must equal the number of authorities.
- Each authority must match `^#\s+Phase\s+Pn\b`.
- Errors:
  - "MATERIAL_INCOMPLETE: post phase_authorities and phase_index are required"
  - "MATERIAL_INCOMPLETE: post phase_index requires Execution Index"
  - "MATERIAL_INCOMPLETE: post phase index and physical files differ"
  - "MATERIAL_INCOMPLETE: phases/Pn.md is missing or invalid"

---

## 3. Real examples (no archived example passes cleanly)

Checked with `node /tmp/card03-bp/validate-post.mjs <repo> <dir>`:

| Example | Result |
|---|---|
| `specs/archive/workflowhub-thin-core-card-07-20260919` (4 Phases, 20 tasks, 23 FR, 23 AC) | **only** error "P1/T001 dependency must be none or identify a Phase/Task"; spec nav ok; acceptance projection ready |
| `specs/archive/workflowhub-thin-core-card-05-20260919` (5 Phases, 11 tasks, 13 FR, 9 AC) | same single error; also spec nav `material_navigation_columns_missing` |
| `specs/archive/workflowhub-thin-core-card-04-20260919` (13 Phases) | many errors (write set / consumer drift, missing card fields); do not copy |

Cause in card-07: `phases/P1.md:39` `- **Dependency**：`none`；独立建立目标判据，…`. Writing exactly `- **Dependency**：none` makes it pass. **Use card-07 as the model.**

### index.md skeleton (card-07 `phases/index.md:1-9`)
```markdown
# Phase index — <task-id>

> 纯指针索引。工程正文、命令、oracle、执行状态只在对应独立 Phase 文件；本索引不复制。

## Execution Index

| phase | authority ref | semantic anchor | write set | dependency | consumer |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1.md` | `phase-p1` | `path/a.mjs`; `path/b.md` | `none` | post `build-plan` 作者、正式 handler、`build-code` 与 `verify-code` |
| `P2` | `phases/P2.md` | `phase-p2` | `path/c.mjs` | `P1` | … |
```
Multiple dependencies are written as `P1, P2`, as in card-07 P3.

### P1.md skeleton (card-07 `phases/P1.md:1-53`, with the Dependency fix)
```markdown
# Phase P1 — <title>

- **Global spec**：`spec.md#<anchor>`；…
- **Write set**：`path/a.mjs`; `path/b.md`
- **Dependency**：`none`。
- **Consumer**：<same text as index consumer cell>

## L0 — Outcome and delta
…
## L1 — Executable contract

- **FR / AC**：FR-…／AC-…
- **Inputs and outputs**：…
- **NEW**：… / **MODIFY**：… / **DO NOT TOUCH**：…
- **Deletion proof**：N/A — 本 Phase 不删除…
- **Task order**：T001 → T002
- **Test strategy**：…
- **gate_cmd**：`npx --no-install vitest run tests/contract/x.test.mjs`
- **oracle**：ORACLE-XXX-001；…
- **evidence_path**：`quality/tests/<name>.json`（未由正式 capture 发布时状态为 planned）
- **STOP**：…
- **Done**：…
- **Risk and rollback**：…

### T001 — <outcome>

- **Source / FR / AC**：R-030、U-006；FR-47；AC-47。…
- **Files / symbols**：`tests/contract/x.test.mjs`（symbol: …）
- **Action**：…
- **Inputs**：…
- **Outputs / failure**：…
- **Boundary / DO NOT TOUCH**：…
- **Dependency**：none
- **Test tier / skill**：feature / backend-testing；…
- **Scenario / fixture or service**：…
- **Prewritten test**：…
- **Observable seam**：…
- **RED/GREEN gate_cmd**：`npx --no-install vitest run tests/contract/x.test.mjs`
- **expected_exit**：RED nonzero 来自目标断言；GREEN 0 且保留负例。
- **RED target failure**：ORACLE-XXX-001；断言 … 不得 `ok:true`（旧实现错误接纳）
- **GREEN oracle**：ORACLE-XXX-001；同一命令中 …
- **Evidence**：`quality/tests/<red>.json` 与 `quality/tests/<green>.json`
- **RED evidence**：<actual receipt ref | honest "尚未核得…待验证">
- **Coverage limit**：…
- **STOP / recovery**：…
- **test change request**：none；…
- **Done**：…

## L2 — Deletable reference
…
```
Note: the Phase header Dependency value `` `none`。 `` is fine. Only the **card** Dependency is compared against the exact none regex.

### spec.md skeleton (card-07 spec.md heading lines)
- `## 速读卡（30 秒）`
- `## 材料导航` with table `| 章节 | 摘要 | 读取时机 |` and at least 2 full rows
- `## 来源与决策映射`, then `## 1.` … `## 10.`
- FRs declared under `## 5. 功能需求` as `- **FR-33**：…`
- `## 验收流程`, `## 测试标准`, `## 架构边界`
- `## 实现设计（全局权威）` → `### Code Anchors`, `### Interfaces and Failure Semantics`, `### Architecture Choices and Dependencies`, `### Requirement-to-Task Trace`, `### Global Verification Strategy` (Chinese aliases also accepted)
- Trace row example (`spec.md:434`): `| R-030、R-031、U-006；母 PRD CARD-02 | FR-47 FR-49 FR-50 FR-51 / AC-47 AC-49 AC-50 AC-51 | P1/T001 | ORACLE-RAW-TRACE-001；空壳/漏来源/错绑目标 RED | 先建立判据；不以测试收集失败充 RED |`
- Global Verification Strategy includes a backticked `npx --no-install vitest run …` command
- `## Appendix A — 验收判据（唯一权威）` with `- [ ] **AC-33 — 真发散**` plus nested `需求 / 验证方法 / 通过条件 / 失败条件 / 证据类型`. For CARD-03, follow the spec-specify SKILL form `验证：/通过：/失败：/证据：`; either form passes the validator.
- `## 12. 风险、未决与交接`, `## 13. 业务影响与回归范围`
- Card-07 AC IDs are `AC-33`; the grammar also accepts `AC-DOMAIN-001`.

---

## 4. Local validation without publishing

**A. Structural self-check (read-only, recommended)**
```
node /tmp/card03-bp/validate-post.mjs /Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919 /Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919/specs/workflowhub-thin-core-card-03-20260919
```
- Imports and runs `validatePostPhaseContract`, `projectPostPhaseAcceptanceExecutionData`, `phaseFilesFromIndex` and `validateMaterialNavigation`.
- Prints ok, errors, phase / task / FR / AC counts and acceptance status.
- It does **not** run the wh-review `## Execution Index` / `# Phase Pn` checks from 2.6; check those by eye, or add `providerMaterialEntries({stage:"build-plan",activation_cohort:"post",materials:{phase_index,phase_authorities}})` from `runtime/review/provider-material-projection.mjs`.

**B. Public CLI** (`tools/cli/stage-runtime.mjs`). Usage: `stage-runtime.mjs <doctor|status|run|review|verify|confirm|authorize> --stage=<stage> --project=<project> --task=<task> [...]` (:977).
- Public → internal routes (:2192-2210):

  | Public route | Internal |
  |---|---|
  | `run:execute` | run |
  | `run:preflight` | run |
  | `run:draft` | artifact |
  | `run:reflect` | reflect |
  | `review:risk` | review-risk-pause |
  | `review:record` | review-record |
  | `verify:execute` | capture-tests |
  | `confirm:decision` | confirm |
  | `authorize:{commit,push,merge,archive,cleanup}` | authorize-operation |

- Write-action args are limited to `action, stage, project, task, task-path` plus `input` (execute), `input, now` (reflect) or `name, input` (draft).
- `node tools/cli/stage-runtime.mjs run --action=preflight --stage=build-plan --project=workflowhub --task=workflowhub-thin-core-card-03-20260919` → preflight. **Unverified** whether it runs validatePostPhaseContract without publishing.
- `run --action=execute --stage=build-plan …` runs the official handler, which **publishes** facts. That is not a dry run.
- The stage-input packet (`workflowhub-stage-input-packet.v1`, algorithm `stage-input-packet.v1`) is assembled **internally** by the handler (`stageInputPacketFacts`, stage-handlers.mjs:98 → `buildStageInputPacket`, material-workspace.mjs:339). No standalone public command exists. Fields: task_id, stage, material_revision, snapshot_tree (40-hex), source_materials [{material_name, path, sha256}], derived_files, packet_freeze_hash.

**C. Review request (build-plan)**
```
node tools/cli/stage-runtime.mjs review --action=record --stage=build-plan --project=workflowhub --task=workflowhub-thin-core-card-03-20260919 --input=/tmp/…/review-request.json
```
- The input must hold exactly one of `request` / `result`; otherwise "review-record input requires exactly one of 'request' or 'result'".
- `activation_cohort` is injected from the task manifest. A mismatching value throws "build-plan review activation_cohort differs from authenticated task cohort" (:1844-1851; `review-record-route.mjs:1399`).
- Forbidden host-owned fields: `snapshot_tree`, `material_revision`, `task_id`, `task_path`, `project_name` ("review request identity field is host-owned: …"). Also forbidden: `e2e_binding`, `confirmation*`, `result`.
- Post material keys (`runtime/review/stage-materials.json` stages.build-plan.profiles.post):
  - required: `raw_requirement`, `draft_spec`, `acceptance_criteria`, `phase_authorities`, `phase_index`, `review_instructions` (the last is listed under generated too)
  - optional: `context_map`, `evidence_map`
  - **forbidden**: `approved_spec`, `draft_plan`, `draft_tasks`
- Request shape:
```json
{ "request": { "stage": "build-plan", "host_provider": "<current host, e.g. claude|codex>",
  "materials": { "raw_requirement": "…", "draft_spec": "<spec.md>", "acceptance_criteria": "<Appendix A>",
    "phase_index": "<phases/index.md>", "phase_authorities": { "phases/P1.md": "…", "phases/P2.md": "…" } } } }
```
- Unverified: whether the runtime fills `review_instructions` itself (it is listed as generated) or the caller must send it; the exact accepted `host_provider` values; and whether the CLI loads materials from disk for build-plan.

---

## 5. RED facts and G-2 N/A

- Step 6 (`workflows/build-plan/steps.json`) observable result: "applicable behavior tests are prewritten, target RED is actually observed in existing quality/test facts, and frozen test identity is disclosed; missing or setup-only RED remains incomplete."
- **No build-plan writer for RED receipts.**
  - `quality/tests/` receipts are written by `verify --action=execute` (capture-tests), which only accepts `--stage=build-code|verify-code` (`tools/cli/stage-runtime.mjs:1483-1484`). Input keys: `command`, `receipt_ref`, optional `output_ref`, optional `timeout_ms`.
  - Producer component is `build-code-test-capture` or `verify-code-test-capture` (`runtime/evidence/canonical-evidence-validators.mjs:289-312`).
  - Receipt shape (`validateCanonicalTestReceipt` :242-287): `schema_version:"workflowhub-receipt.v1"`, `task_id`, `stage`, `producer.{stage,component}`, `snapshot_tree` (OID), `command`, `command_hash`=sha256(command), `exit_code` (int), `output_hash`, `output_ref` matching `^quality/tests/output/…`, plus optional `source_digest`, `runtime_profile`, `duration_ms`, `capability_proof`.
  - The receipt file itself sits at `quality/tests/<name>.json` (`task-handle.mjs:737-756`).
  - `quality-fact.v1` (`runtime/schemas/quality-fact.v1.json`) has kind `test` with status `passed|failed|unavailable|missing`.
  - The post build-plan handler states that RED is **not authenticated** (`stage-handlers.mjs:4010`), and `no_prewritten_test` is `false` (:2798).
- **Practical consequence.** In the Phase card, record RED either as:
  - the actual run: command, exit code, named failing assertion and raw output location, attributed per `SKILL.md:30` as 目标行为失败 / 夹具或环境失败 / 本来就通过; or
  - an honest statement, as card-07 did (`P1.md:49`): "同身份 command、exit、具名 failing assertion 和 raw output ref 尚未核得；上列仅计划路径，状态待验证".
  - Do not fabricate a `quality/tests` receipt. Its planned path goes in `Evidence` / `evidence_path`, marked planned. Unverified: any build-plan-stage writer for RED; none was found.
- **G-2 N/A for pure-documentation work** (`skills/spec-plan/SKILL.md:28`): "G-2 for pure documentation or exploratory work permits N/A only with a concrete reason, risk, objective alternative (prefer a falsifiable check), and acceptance disclosure; do not manufacture a failure." Template `phase-template.md:174` `- **预写测试**:` says "若 G-2 不适用，给出理由、风险与客观替代". `docs/standard-workflow.md:329`: "纯材料任务明确记录不适用".
- **G-2 N/A still has to pass the card checks.** All 17 validator fields stay mandatory, and bare `N/A` is rejected. For a doc-only card:
  - `Prewritten test`: `N/A — G-2 不适用：纯文档改动；风险：…；客观替代：…；验收披露：…`
  - `RED/GREEN gate_cmd`: still an executable command, e.g. a falsifiable `node -e …` or a `grep`-based check wrapped in `bash -c`, or a vitest doc-contract test
  - `expected_exit`: must still contain `RED … nonzero` and `GREEN … 0`
  - RED target failure / GREEN oracle: must share an ORACLE ID
  - `Files / symbols`: `N/A — 非代码文件` is allowed
- Unknown: there is no dedicated machine field for G-2 N/A. It is prose in `Prewritten test` / `预写测试`.
