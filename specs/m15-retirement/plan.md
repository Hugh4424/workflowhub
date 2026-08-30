# 实现计划：M15 监控体系退役

- **Input**：`tasks/m15-retirement/decision-log.md`（D-001~D-008 + 附录 A）、`tasks/m15-retirement/spec.md`（8 FR / 8 AC）
- **Template version**：`plan-task.v3`

## Quick Read

- **Goal**：M15 监控采集/投影链从生产代码清零；五阶段自记录分毫不损；历史数据字节级不变；仓外页面冻结为带"已退役"提示的静态快照。
- **Non-goals**：spec §10 七条（D-008）；纯退役不新增任何能力（D-001）。
- **Before**：监控链侵入 stage 流程（runMonitoringSidecar 挂在 run 主路径两处）、task-store facts 读写耦合监控分类器、codex 会话事件附带 token 统计；只有 codex 能采集（F-002）。
- **After**：上述副作用全部消失；自记录（需求认证/快照、step/skill 事件、stage outcome、facts 通用读写）正常；仓外页面静态可开且有退役提示。
- **Main risk**：共享文件误删自记录依赖导致五阶段回归（RISK-001）。
- **Next step**：Phase 0 基线安顿（无关在制品独立 commit + sha256 清单）。

## Technical Context

### Global Constraints

- **Verified facts**：Grill 代码核实报告（decision-log grill 节+附录 A）给出全部纠缠点与符号级边界；wh-review 三路传输事实（codex/luna 方向 track failed、opencode spec track failed，均如实保留）。
- **Language / runtime**：Node.js >= 24（.mjs ESM），无构建步骤。
- **Primary dependencies**：vitest（测试）；无新增依赖。
- **Storage / state**：任务事实存于 `<storageRoot>/Projects/<proj>/tasks/<task>/facts.jsonl`（task-store 读写）；仓外 monitor 三件套在 `~/Knowledge/Projects/`——本任务只读（html 提示条除外）。
- **Testing**：`npm test`（vitest：test:safe + test:exclusive）、`npm run check`（markdownlint + verify-structure + run-checks + skill-closure + smoke）；测试不碰真实仓外数据。
- **Target environment**：本仓库 + 任务 worktree `workflowhub-m15-retirement`（branch task/workflowhub/m15-retirement，基线 292f3b30a）。
- **Scale / scope**：约 14 个仓内文件（9 整删 + 5 行级摘除/改造 + 登记/测试若干）+ 1 个仓外 html。
- **Unresolved facts**：codex 宿主下会话事件完整验证不可在 DSH 执行——OPEN-101（spec §9），延期至下一个 codex 宿主任务。

## Code Anchors

- **Verified anchors**（全部来自 Grill 核实报告，附录 A 为唯一权威清单）：
  - 整删：`runtime/evidence/monitoring-facts.mjs`、`monitoring-diagnostics.mjs`、`monitoring-projector.mjs`、`monitoring-page.html`、`runtime/schemas/monitoring-fact.v1.json`、`monitoring-projection.v1.json`、`tools/cli/collect-task-facts.mjs`、`config/transcript-sources.mjs`、`config/runtime-fact-sources.mjs`、`config/runtime-fact-v2-sources.mjs`；测试 `tests/m15-monitoring-{facts,diagnostics,projector}.test.mjs`、`tests/m15-codex-transcript-adapter.test.mjs`、`tests/m15-monitoring-integration.test.mjs`。
  - 行级摘除：`tools/cli/stage-runtime.mjs`（normalizeCodexRollout:232 / resolveDefaultMonitoringSource:367 / outcomeCostFacts:586-629 / runMonitoringSidecar:1118 / run 主路径 :1390,:1421）；`tools/host/workflowhub-codex-session-state.mjs`（tokenUsageBetween:429-453、finishCodexSessionEvent:658 的 event.usage 行）；`tools/cli/check-task-record-paths.mjs`（:81-82,:99,:226）；`docs/architecture/move-map.json`（:1620-1625,:1638-1661 改登记为已退役）。
  - 保留区（trim 不删）：`codex-transcript-adapter.mjs`（isAuthenticatedRequirementResult、parseRegisteredRequirementTranscript、createRegisteredCodexSource）、`fact-collector.mjs`（authenticateRegisteredRequirementMessages、isTranscriptSourceReader、createTranscriptSourceReader）、`dsh-transcript.mjs`（需求快照/路径函数）、`runtime/task/task-store.mjs`（监控分类器下沉为 schema_version 字符串判断，:113-129，随 T-201 执行）。
  - 测试改造：`tests/helpers/stage-outcome.mjs`（8 个非监控测试依赖）、`tests/m15-codex-session-hook.test.mjs`、`tests/dsh-transcript.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`。
- **Existing interfaces**：task-store facts.jsonl 通用读写契约不变（行格式 `{kind, value, ...}`）；session-event CLI 契约不变（仅事件体不再含 usage 字段）。
- **Read now**：上述锚点文件（设计已基于核实报告完成）。
- **Must read before task**：各文件摘除段的当前行内容（行号可能漂移，以符号名为准）。
- **Context mode**：Lite——边界已符号级锁定，无需全仓上下文。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 需求认证/快照保留 | reuse | `codex-transcript-adapter.mjs`/`fact-collector.mjs`/`dsh-transcript.mjs` 内既有符号 | 原地修剪（只删监控导出），消费方 import 路径零改动 |
| task-store 监控分类判断 | extend | `task-store.mjs:113-129` | 监控分类器下沉为行内 schema_version 字符串判断，不引入新模块 |
| 退役守卫 | reuse | `grep` 静态扫描 + 改造后 `check-task-record-paths.mjs` | 不新增守卫测试（见 DEC-003 F10） |
| 仓外页面提示条 | extend | `~/Knowledge/Projects/workflowhub-monitor.html` | 手工/脚本一次性静态插入，无新代码入库 |

## Solution Design

### Overview

拆除分四步推进：先安顿基线（Phase 0），再做 runtime 摘除（Phase 1：sidecar 段+token 统计+evidence 五件套，同时原地修剪三个共享文件的保留区符号并下沉 task-store 分类器），然后清配置/登记/孤儿 CLI（Phase 2），最后改造测试与仓外页面（Phase 3/4）。数据流变化只有一处：stage run 结束后不再触发监控 sidecar，facts.jsonl 回归只承载任务自身事实；task-store 对历史监控行的兼容读取改为本地 schema_version 判断，历史数据零改动。

### Module responsibilities

#### stage-runtime（tools/cli/stage-runtime.mjs）

- **Responsibility**：五阶段公共行为入口（doctor/status/run/review/verify/confirm/authorize）。
- **Consumes**：阶段自记录接口（session-event、task-store）。
- **Produces**：stage 结果与任务事实。
- **Must not decide**：不再含任何监控源解析、rollout 规范化、监控事实生成与快照投影逻辑。

#### task-store（runtime/task/task-store.mjs）

- **Responsibility**：任务 facts.jsonl 的唯一读写者。
- **Consumes**：通用事实行 `{kind, value}`。
- **Produces**：事实读视图（对历史监控行以 schema_version 字符串本地分类，只读兼容）。
- **Must not decide**：不 import 监控 facts 模块；不新增监控写入 API（appendMonitoringFacts/readMonitoringFacts 随删）。

#### 仓外页面（~/Knowledge/Projects/workflowhub-monitor.html）

- **Responsibility**：冻结历史快照的静态展示。
- **Consumes**：同目录 data.js（冻结，不再更新）。
- **Produces**：带"已退役"提示的只读页面。
- **Must not decide**：不再由任何仓内代码生成或更新。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：monitoring-fact.v1 / monitoring-projection.v1 两个 schema 退役删除；历史样本只读留存不构成活契约。session-event 事件体的 `usage` 字段退役（向后不兼容变更）；消费者普查（T-202 前置动作：grep `event.usage`/`.usage` 于 tools/ runtime/ tests/）必须证明唯一消费者是监控侧 cost 归因（同删），普查证据入 `quality/tests/t202-usage-census.log`；若发现非监控消费者 → STOP 回 build-plan。
- **Data flow / state**：stage run → 自记录事件/事实（不变）；~~sidecar → 监控事实 → 快照 → 页面~~（整链消失）。
- **API contract**：N/A — 无 API。
- **UI / external code**：仓外 html 顶部插入静态提示条（纯文本+内联样式，无脚本）；文案："本监控面板已退役，数据冻结于退役时点，后续由离线复盘器任务重建"。
- **Fail-loud behavior**：任何对已删模块的 import 在 node 加载期即报错；验收扫描必须证明此类引用为零。

## UI Delivery Contract

- **UI applicability**：`N/A — non_ui`（spec §11：唯一页面动作是仓外冻结页面的静态提示条，不构成产品设计面；frontend-component-quality 不适用）。

## File Boundary

### NEW

- `N/A — 纯退役任务，不新增文件`（含不新增守卫测试，见 DEC-003）。

### MODIFY

- `tools/cli/stage-runtime.mjs`（摘除监控段）
- `tools/host/workflowhub-codex-session-state.mjs`（摘除 tokenUsageBetween 及 event.usage 行）
- `runtime/task/task-store.mjs`（分类器下沉 + 删监控读写 API）
- `runtime/evidence/codex-transcript-adapter.mjs`（修剪至保留区符号）
- `runtime/evidence/fact-collector.mjs`（修剪至保留区符号）
- `runtime/evidence/dsh-transcript.mjs`（修剪至保留区符号）
- `tools/cli/check-task-record-paths.mjs`（删监控登记项）
- `docs/architecture/move-map.json`（监控条目登记为已退役）
- `tests/helpers/stage-outcome.mjs`（迁移到保留区符号）
- `tests/m15-codex-session-hook.test.mjs`（摘监控断言，留自记录用例）
- `tests/dsh-transcript.test.mjs`（摘监控断言，留快照用例）
- `tests/integration/vnext-official-stage-run.test.mjs`（摘监控断言，加负向断言）
- `~/Knowledge/Projects/workflowhub-monitor.html`（仓外，仅加提示条）

### DELETE

- `runtime/evidence/monitoring-facts.mjs`、`runtime/evidence/monitoring-diagnostics.mjs`、`runtime/evidence/monitoring-projector.mjs`、`runtime/evidence/monitoring-page.html`
- `runtime/schemas/monitoring-fact.v1.json`、`runtime/schemas/monitoring-projection.v1.json`
- `tools/cli/collect-task-facts.mjs`
- `config/transcript-sources.mjs`、`config/runtime-fact-sources.mjs`、`config/runtime-fact-v2-sources.mjs`
- `tests/m15-monitoring-facts.test.mjs`、`tests/m15-monitoring-diagnostics.test.mjs`、`tests/m15-monitoring-projector.test.mjs`、`tests/m15-codex-transcript-adapter.test.mjs`、`tests/m15-monitoring-integration.test.mjs`

### DO NOT TOUCH

- `workflows/`（零监控引用，Grill 已核实）
- `tools/host/workflowhub-codex-session-hook.mjs`、`tools/host/workflowhub-codex-session-event.mjs`（干净，Grill 已核实）
- 全部历史任务目录数据（`~/Knowledge/Projects/**/facts.jsonl` 等）与仓外 `workflowhub-monitor-data.js`、`workflowhub-monitor-facts.jsonl`——历史只读（D-004）
- `specs/archive/`、`docs/adr/0012-*` 及一切历史文档——历史文字引用允许存在（AC-RETIRE-001 豁免）
- `decision-log.md`、`spec.md` 之外材料的旧版本——只读

## Technical Decisions

### DEC-001 — 保留符号原地修剪而非迁移新文件

- **Problem**：需求认证/快照子集住在待删文件中，自记录要用。
- **Options**：a) 迁移到新文件（引用方全部改 import，diff 大、误伤面广）；b) 原地修剪（只删监控导出，消费方零改动）。
- **Selected**：extend（原地修剪）。
- **Reason**：最小改动面；import 路径不变使 8 个依赖 helper 的非监控测试免于连锁修改。
- **Consequence / risk**：修剪后的文件行内边界靠测试与扫描守护；保留符号清单以附录 A 为准。
- **Fallback**：若修剪中发现符号耦合无法行级分离，STOP 回 build-plan 重估。

### DEC-002 — task-store 监控分类器下沉为本地字符串判断

- **Problem**：task-store 通用读路径用 monitoring-facts 的分类器函数，模块删除后断链。
- **Options**：a) 保 monitoring-facts 模块（违背全拆决策）；b) 下沉为行内 schema_version 字符串判断。
- **Selected**：extend（下沉）。
- **Reason**：分类依据本就是行内字段，下沉后不引入新依赖；历史监控行仍只读兼容。
- **Consequence / risk**：分类逻辑复制为几行字符串比较；由混测改造后的用例覆盖。
- **Fallback**：N/A（逻辑极简）。

### DEC-003 — 不新增退役守卫测试

- **Problem**：AC-RETIRE-001 需要"引用清零"的可复核证据。
- **Options**：a) 新增守卫测试（断言源码不含监控符号）；b) 复用 grep 静态扫描 + 改造后的登记表检查。
- **Selected**：reuse（不新增）。
- **Reason**：源码字符串断言测试脆弱且价值低；grep 扫描输出已是可归档证据；check-task-record-paths 改造后覆盖登记维度。
- **Consequence / risk**：无自动化回归守卫；接受（一次性退役任务，守卫的维护成本大于收益）。
- **Fallback**：verify-code 若认为证据不足，可在该阶段补最小守卫。
- **F10 real threat**：防"监控代码回流"——已由 review 流程与 move-map 登记覆盖。
- **F10 existing cover**：grep 扫描 + check-task-record-paths + wh-review。
- **F10 bypassable**：守卫测试本身也可被绕过（只查字符串）。
- **F10 maintenance cost**：避免一个脆弱的源码字符串测试。
- **F10 disposition**：`remove`（不建）。

## Test Strategy

设计 RED/GREEN，不在 build-plan 执行命令。两者使用同一 `gate_cmd` 和 oracle identity。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| FR-PRESERVE-002（事件不再含 usage + 快照用例保留） | T-301 | RED | `npx vitest run tests/m15-codex-session-hook.test.mjs tests/dsh-transcript.test.mjs` / 非零（摘除前监控断言引用已删符号而失败） | ORACLE-EVENT-NO-USAGE；`quality/tests/red-t301.log` |
| FR-PRESERVE-002 | T-301 | GREEN | 同一命令 / 0 | ORACLE-EVENT-NO-USAGE；事件记录本体与需求快照用例保持通过；`quality/tests/green-t301.log` |
| FR-RETIRE-001（stage run 无监控副作用） | T-302 | RED | `npx vitest run tests/integration/vnext-official-stage-run.test.mjs` / 非零（**RED 前置到 Phase 1 摘除前**：先加负向断言，此时监控副作用仍存在→断言失败） | ORACLE-NO-MONITOR-SIDE-EFFECT；`quality/tests/red-t302.log` |
| FR-RETIRE-001 | T-302 | GREEN | 同一命令 / 0 | ORACLE-NO-MONITOR-SIDE-EFFECT；`quality/tests/green-t302.log` |
| FR-RETIRE/PRESERVE 全量 | T-401 | GREEN | `npm test && npm run check` / 0 | ORACLE-SUITE-GREEN；`quality/tests/final-suite.log` |
| AC-RETIRE-001（引用清零） | T-401 | GREEN | `grep -rnE "monitoring-facts\|monitoring-diagnostics\|monitoring-projector\|monitoring-page\|monitoring-fact.v1\|monitoring-projection.v1\|runMonitoringSidecar\|outcomeCostFacts\|tokenUsageBetween\|normalizeCodexRollout\|resolveDefaultMonitoringSource\|appendMonitoringFacts\|readMonitoringFacts\|collect-task-facts\|monitoring-snapshot\|__WH_MONITOR_DATA__" runtime/ tools/ workflows/ config/ tests/ core/ scripts/ package.json` / 退出码 1（零命中） | ORACLE-ZERO-REF；白名单=附录 A 保留区文件内合法留存符号（历史文档不在扫描路径内，天然豁免）；`quality/tests/final-zeroref.log` |
| AC-HISTORY-001 | T-401 | GREEN | sha256 清单比对 + 抽样读取（脚本见 tasks.md T-401） / 0 | ORACLE-HISTORY-INTACT；`quality/tests/final-history.log` |

测试路由预判（test-routing-advisor 合同）：`feature`——单一功能域（stage 运行/任务事实）行为变化，无跨端/API/数据库；build-code 阶段执行技能：`backend-testing`。

## Rollback and Recovery

- **Global recovery rule**：拆除全部发生在任务 worktree 分支；任何失败 `git restore`/`git reset` 回基线 commit，四份材料与质量事实保留。
- **Irreversible boundaries**：commit/merge 回主仓需用户经 authorize 公共行为明确授权；仓外 html 提示条改动前先备份原文件字节（sha256 记录），恢复=写回原字节。
- **Recovery owner**：build-code 执行人；越界或纠缠超预期 → STOP 回 build-plan。

### Engineering Risk Handoff

- **PLAN-RISK-001**：误删自记录共享依赖
  - **Affected IDs**：FR-PRESERVE-001/002、AC-PRESERVE-001、T-201/T-202
  - **Trigger**：修剪三个共享文件或摘除 session-state 行时
  - **Consequence**：五阶段执行报错、需求认证失败
  - **Mitigation or STOP**：附录 A 符号清单逐项核对 + T-301/T-302 RED/GREEN + 全套件；纠缠超预期即 STOP
  - **Handling Stage**：build-code
  - **Verification**：AC-PRESERVE-001 逐项断言
- **PLAN-RISK-002**：测试删除面失控（误删非监控用例）
  - **Affected IDs**：AC-RETIRE-002、T-301/T-302
  - **Trigger**：改造混测文件时
  - **Consequence**：自记录覆盖静默缩水
  - **Mitigation or STOP**：测试清单 diff 对照附录 A；自记录相关用例数不减少
  - **Handling Stage**：build-code/verify-code
  - **Verification**：AC-RETIRE-002 测试清单受控条件

## Implementation Order

producer-before-consumer：Phase 0（基线）→ T-302 RED 前置（负向断言先行录证据）→ Phase 1（runtime 摘除，task-store 下沉与 evidence 删除同原子步）→ Phase 2（配置/登记/CLI）→ Phase 3（T-300 删除 + T-301/T-302 转 GREEN）→ Phase 4（页面提示条，代码全绿后串行）→ FINAL 聚合验证。全部串行；无并行对。

## Dependencies and Parallelism

- 串行：P0 → T-302RED → P1 → P2 → P3 → P4 → FINAL。
- 可并行：P3 内 T-301 与 T-302-GREEN 可并行（不同文件）；P4 不再并行（FND-308）。
- 外部依赖：无（无新包、无网络服务）。

## Requirement and Verification Traceability

| Source | Decision | FR | AC | Task | Oracle |
| --- | --- | --- | --- | --- | --- |
| R-001/R-005 | D-001/D-002 | FR-RETIRE-001 | AC-RETIRE-001/002 | T-201/T-202/T-401 | ORACLE-ZERO-REF/SUITE-GREEN |
| R-002 | D-001/D-008 | FR-RETIRE-002 | AC-RETIRE-002 | T-401 | ORACLE-SUITE-GREEN |
| q-final-stash | D-007 | FR-RETIRE-003 | AC-RETIRE-003 | T-001 | git 记录 |
| F-005/Grill | D-002 | FR-PRESERVE-001 | AC-PRESERVE-001 | T-201/T-302/T-401 | ORACLE-SUITE-GREEN + 逐项断言 |
| F-003 | D-002 | FR-RETIRE-001（测试面） | AC-RETIRE-002 | T-300/T-301/T-302 | ORACLE-SUITE-GREEN + 测试清单 diff |
| PFACT-03 | D-002 | FR-PRESERVE-002 | AC-PRESERVE-002 | T-202/T-301 | ORACLE-EVENT-NO-USAGE |
| FND-106/T-006 | D-003 | FR-PAGE-001/002 | AC-PAGE-001/002 | T-303；T-401 复核 | 浏览器观察 |
| F-004 | D-004 | FR-HISTORY-001 | AC-HISTORY-001 | T-001/T-401 | ORACLE-HISTORY-INTACT |

## Governance Synchronization Matrix

| 治理面 | 动作 | 依据 |
| --- | --- | --- |
| move-map.json | 监控条目登记为已退役（Phase 2） | AGENTS.md 目录治理 |
| CONTEXT.md | no-change（decision-log 文档结果节） | Grill 结论 |
| ADR | not-needed（三项判据未全真，决议见 decision-log） | Grill 结论 |
| AGENTS.md / CLAUDE.md | no-change——两份治理文档未点名 M15 监控模块 | 本阶段核实 |

## Constitution Check

- **薄核心窄契约**：纯删除，核心只减负。
- **质量靠独立审查与人**：wh-review 独立 findings + verify-code 独立验证；不自审自判。
- **记录事实而非阻断**：全程 unavailable/failed 事实如实保留（opencode/codex 传输失败、DSH 会话记录 unavailable）。
- **简单优先可证伪**：不新增机制（DEC-003 F10=remove）；验收 oracle 全部可判真伪。
- **推进/不可逆经人确认**：commit/merge 走 authorize；仓外页面改动先备份。

## Phase 0 — 基线安顿

- **Goal**：干净基线 + 历史数据哈希清单。
- **Files**：主工作区 `runtime/stage/stage-agent-outcome-adapter.mjs`、`apply/evidence/current-diff-ac-coverage.json`（无关在制品提交）；仓外三件套与任务 facts.jsonl（仅读，记哈希）。
- **Tasks**：T-001。
- **Verify**：`git -C /Users/Hugh/Hugh/Project/workflowhub status --short` 干净；哈希清单落盘。
- **Knowledge**：无关在制品属 AC 证据绑定修复（Grill 核实）。
- **STOP**：在制品内容超出 Grill 核实结论（即不无关）→ STOP 回 build-plan。
- **Done**：基线 commit 存在且仅含两个改动；sha256 清单存在。
- **Risks and rollback**：commit 内容错误 → 未 push，可 reset。

## Phase 1 — runtime 摘除与保留区修剪

- **Goal**：监控链 runtime 代码清零，自记录分毫不损。
- **Files**：MODIFY 节 stage-runtime/session-state/task-store/adapter/fact-collector/dsh-transcript + DELETE 节 evidence 四件套。
- **Tasks**：T-201（stage-runtime 摘除 + evidence 四件套整删 + **task-store 分类器下沉与监控 API 删除同步进行**——否则 task-store 静态 import 已删文件导致 ESM 加载崩溃，两盲审均判 blocking）；T-202（三个共享文件修剪 + session-state 摘行）。
- **Verify**：**T-302 的 RED 必须在本 Phase 摘除动作之前完成**（先给 integration 测试加负向断言并录 `red-t302.log`，此时监控副作用仍存在、断言失败）；摘除后 `node tools/cli/stage-runtime.mjs doctor` 加载正常。
- **Knowledge**：附录 A 符号清单；行号以符号名为准（可能漂移）。
- **STOP**：保留符号耦合无法行级分离 → STOP 回 build-plan（DEC-001 fallback）。
- **Done**：evidence 四件套删除；stage-runtime/session-state/task-store 无监控符号；自记录符号完好。
- **Risks and rollback**：PLAN-RISK-001；rollback=git restore 到基线。

## Phase 2 — 配置/登记/孤儿 CLI 清理

- **Goal**：schema、空 config、孤儿 CLI、登记表、move-map 同步。
- **Files**：DELETE 节 schemas/CLI/config 三项 + MODIFY 节 check-task-record-paths.mjs、move-map.json。
- **Tasks**：T-203。
- **Verify**：`npm run check` 通过。
- **Knowledge**：三 config 为空 registry、唯一引用者是孤儿 CLI（Grill 核实）。
- **STOP**：run-checks 出现非监控相关失败 → STOP 排查是否误删。
- **Done**：目标文件删除/登记更新，check 绿。
- **Risks and rollback**：误删被引用文件 → git restore。

## Phase 3 — 测试改造

- **Goal**：纯监控测试删除；混测与 helper 改造后自记录覆盖不缩水；负向断言落地。
- **Files**：DELETE 节五个测试 + MODIFY 节 helper 与三个测试。
- **Tasks**：T-300（**整删五个纯监控测试文件**，附录 A 清单唯一权威）、T-301（session-hook 测试改造，RED/GREEN pair 1）、T-302（integration 测试改造收尾转 GREEN，其 RED 已在 Phase 1 前置完成）、T-303 在 Phase 4。
- **Verify**：`npm test` 全绿；自记录用例数不减少（diff 核对）。
- **Knowledge**：helper 被 8 个非监控测试依赖（Grill 核实清单）。
- **STOP**：改造后非监控测试失败且原因不明 → STOP 回 build-plan。
- **Done**：测试清单与附录 A 一致；套件绿。
- **Risks and rollback**：PLAN-RISK-002；rollback=git restore。

## Phase 4 — 仓外页面提示条

- **Goal**：冻结页面顶部出现"已退役"提示。
- **Files**：`~/Knowledge/Projects/workflowhub-monitor.html`（先备份原字节）。
- **Tasks**：T-303（**串行**：必须在 T-301/T-302 代码全绿之后执行——若代码回滚，页面不留退役提示；改动前把 html 原始字节备份到 `quality/tests/t303-monitor-html.backup.html`，哈希只用于校验不作恢复手段）。
- **Verify**：浏览器打开页面正常渲染+提示可见（AC-PAGE-001/002）。
- **Knowledge**：页面自包含已实测（PFACT-02）；只改 html 一个文件。
- **STOP**：页面结构异常（提示条插入后渲染破坏）→ 恢复原字节，STOP。
- **Done**：提示可见，原数据展示不变。
- **Risks and rollback**：写回原字节即恢复。

## Phase FINAL — 聚合验证

- **Goal**：AC 全量证据归档。
- **Files**：`quality/tests/`（证据日志）。
- **Tasks**：T-401（聚合：套件+零引用扫描+哈希比对+抽样读取+页面观察+逐项自记录断言）。
- **Verify**：Test Strategy 表全部 GREEN 行。
- **Knowledge**：真实任务端到端验证=本任务 verify-code 阶段自身（AC-PRESERVE-001 载体）。
- **STOP**：任一 AC 证据缺失 → 不宣称完成，回 build-code 修复。
- **Done**：八条 AC 证据齐全归档。
- **Risks and rollback**：证据造假=直接失败（宪法）。

## 计划评审处置（step 9-10，wh-review build-plan track）

- 执行事实：outcome=partial；kimi/coding、antigravity/flash、codex/luna completed，opencode/v4flash failed（SESSION_IDLE_WITHOUT_TERMINAL，事实保留）；10 条 findings（含 2 条 blocking）。

| finding_id | 来源/摘要 | status | 处置 |
| --- | --- | --- | --- |
| FND-301 | kimi：五个纯监控测试删除无任务认领 | fixed | 新增 T-300 卡（Phase 3） |
| FND-302 | antigravity blocking：T-201 删 monitoring-facts 时 task-store 仍 import 它，中间态 ESM 崩溃 | fixed | task-store 分类器下沉+监控 API 删除并入 T-201 同一原子步 |
| FND-303 | antigravity：grep 扫描含 move-map 与退役登记冲突 | fixed | 扫描路径剔除 move-map，白名单声明含登记文字 |
| FND-304 | antigravity：T-302 排在 Phase 3 导致 RED 不可能 | fixed | T-302 RED 前置到 Phase 1 摘除前 |
| FND-305 | codex blocking：同 FND-302（消费者先行原则） | fixed | 同 FND-302 |
| FND-306 | codex：零引用扫描符号/目录覆盖不足 | fixed | 扫描模式扩至 15 个符号 + core/scripts/package.json，白名单明示 |
| FND-307 | codex：T-001 oracle 无法证明 commit 内容 | fixed | gate 增加 `git diff-tree --name-only` 精确文件集合校验 |
| FND-308 | codex：T-303 并行+只记哈希无法恢复 | fixed | 改串行（代码全绿后）+ 原始字节备份入 quality/tests/ |
| FND-309 | codex：usage 字段"无现存消费者"缺普查证据 | fixed | T-202 前置 grep 普查动作+证据文件；发现非监控消费者则 STOP；契约表述改为"usage 字段退役" |
| FND-310 | codex minor：RED 日志无明确捕获步骤 | fixed | T-201 动作含 red-t302.log 捕获；T-202 完成点录 red-t301.log |
