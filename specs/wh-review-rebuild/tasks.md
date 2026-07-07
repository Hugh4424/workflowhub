# Tasks: wh-review-rebuild

**Input**: Design documents `specs/wh-review-rebuild/`
**Prerequisites**: spec.md（authoritative）, plan.md, data-contracts.md, research.md

**Tests**: 端到端冒烟测试方案见 T025（`specs/wh-review-rebuild/test-plan.md`），执行本身留给 verify-code 阶段；本仓库既有单元测试沿用 **vitest**（`core/__tests__/` 风格，`package.json` `"test": "vitest run"`），wh-review 新脚本测试落在 `skills/wh-review/scripts/__tests__/*.test.mjs`，同样用 vitest；3rd-review 仓库测试沿用其自身既有 `node scripts/*.test.mjs` + bash 脚本约定

**Organization**: 本 spec 以 FR 分组而非用户故事组织（spec.md 无独立 User Story 章节），任务按 FR 分组标注 `[Story]` 字段，取值：`[WHREVIEW]`（FR-WHREVIEW-系列）、`[THIRDREVIEW]`（FR-THIRDREVIEW-系列）、`[STAGE]`（FR-STAGE-001 + FR-D2-001）、`[TEST]`（FR-TEST-001 及收尾验证）。

## Format: `- [ ] [TaskID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无依赖）
- **[Story]**: 见上方 Organization 分组
- 每条任务标注 `(stage:N, depends:<task-ids>)`
- 每条任务至少引用一条 spec.md 中的 FR

## Path Conventions

- **wh-review 新技能**: `skills/wh-review/`（本仓库 workflowhub）
- **3rd-review 精简**: 独立仓库，默认与 workflowhub 以兄弟目录形式并列检出于同一父目录下（未显式设置 `THIRD_REVIEW_REPO_ROOT` 时的默认发现路径，见 spec.md FR-THIRDREVIEW-001「3rd-review 仓库根目录发现规则」），跨仓库改动
- **workflowhub 5 stage 工作流**: `workflows/<stage-name>/SKILL.md`
- **Artifacts**: `specs/wh-review-rebuild/`
- **Constitution**: `constitution-checklist.md`, `CONSTITUTION.md`

---

## Stage 1

**Purpose**: 搭建 wh-review 骨架、迁移 5 套合同、打通落盘路径与路由记录。对应 plan.md Phase 1。

- [ ] T001 [WHREVIEW] 创建 `skills/wh-review/SKILL.md` 骨架：输入（task-id, stage）、输出（verdict/findings 摘要 + 落盘路径）、四要素调用协议、task-id 来源契约、落盘路径统一走 `core/task-dir-parser.mjs`。FR: FR-WHREVIEW-001 (stage:1, depends:无)
- [ ] T002 [P] [WHREVIEW] 搬迁 intake 合同至 `skills/wh-review/contracts/intake.md`（来源：agenthub `verifiers/vibecoding`），task-id 参数化改造。FR: FR-WHREVIEW-002 (stage:1, depends:T001)
- [ ] T003 [P] [WHREVIEW] 搬迁 design 合同至 `skills/wh-review/contracts/design.md`。FR: FR-WHREVIEW-002 (stage:1, depends:T001)
- [ ] T004 [P] [WHREVIEW] 搬迁 plan 合同至 `skills/wh-review/contracts/plan.md`。FR: FR-WHREVIEW-002 (stage:1, depends:T001)
- [ ] T005 [P] [WHREVIEW] 搬迁 code 合同至 `skills/wh-review/contracts/code.md`。FR: FR-WHREVIEW-002 (stage:1, depends:T001)
- [ ] T006 [P] [WHREVIEW] 搬迁 test-acceptance 合同至 `skills/wh-review/contracts/test-acceptance.md`。FR: FR-WHREVIEW-002 (stage:1, depends:T001)
- [ ] T007 [WHREVIEW] 实现 `skills/wh-review/scripts/route-decision-writer.mjs`：两阶段写入 `tasks/{task-id}/reviews/route-decision-{stage}-{review_flow_id}.json`（路径按 stage+review_flow_id 隔离，round19 修复）——第一次写入（准备阶段）落盘 stage/contract_path/contract_hash/timestamp/input_mode/review_flow_id/total_round 七字段非空，`review_input_hash` 留空；第二次写入（执行阶段结束后）就地回填 `review_input_hash`，八字段全部非空；同一 `review_flow_id` 内每轮覆盖写入同一文件，不同 `review_flow_id` 因路径隔离互不覆盖；未知 stage fail-loud。FR: FR-WHREVIEW-002 (stage:1, depends:T002,T003,T004,T005,T006)
- [ ] T008 [WHREVIEW] 深化 `skills/wh-review/contracts/intake.md` 内容覆盖 C1-C6 判据（原始需求原文引用/决策证据/scope in-out/无悬挂开放问题/方向一致性），标准字段（decision/scope.in/scope.out/open_questions）均非空。FR: FR-INTAKE-001 (stage:1, depends:T002)
- [ ] T009 [WHREVIEW] 深化 `skills/wh-review/contracts/test-acceptance.md` 内容覆盖 F1-F6 判据（fresh-capture git_sha 一致 / AC-ID 路由非空 / content_hash 比对 / 测试命令与 build-code 产物记录一致）。FR: FR-TESTACCEPTANCE-001 (stage:1, depends:T006)
- [ ] T009a [WHREVIEW] 为 T002-T006 产出的 5 套合同（intake/design/plan/code/test-acceptance）文本各自追加"round2+ 新发现降级规则"段落：默认规则（round2+ 新出现的 blocking finding 默认降级为 minor，不阻断 pass）+ 三类例外定义（(a) 本轮改动新引入的问题 (b) 上一轮审查范围内客观无法发现的问题 (c) 触碰架构边界/scope boundary 违规），使 3rd-review 依据合同文本即可对 round2+ finding 做出正确 severity 判定。FR: FR-WHREVIEW-005 (stage:1, depends:T002,T003,T004,T005,T006)
- [ ] T009b [WHREVIEW] 标记 `design.md`/`plan.md`/`code.md` 三套合同当前仍为"迁移占位版本"（未像 intake/test-acceptance 一样深化）：在三个文件内各自追加一段机器可 grep 到的占位标记（如 `<!-- CONTRACT-DEPTH: placeholder, pending 4-item deepening -->`），并在本文件（tasks.md）"合同深化范围标注"验收标准（见下方 Checkpoint 表新增行）中显式记录：三者后续深化时**必须**补齐 agenthub 原版 4 项质量抓手——①Blocking/Non-blocking 显式分类清单 ②Structural Quality Gate 具体红线 ③FR Consumption Point Scan ④Revision Record append-only 写保护——不得停留在当前空泛版本，防止被后续阶段跳过。本任务本身不要求写出合同全文，仅要求占位标记 + 验收标准落盘。FR: FR-WHREVIEW-002 (stage:1, depends:T003,T004,T005)

**Checkpoint**（双列可运行验证，详见 plan.md Phase 1 Verify 表）：

| 检查点 | gate_cmd（机器判定） | display_cmd（人工摘要） |
|---|---|---|
| 5 套合同文件均存在（AC2-1） | `npx vitest run skills/wh-review/scripts/__tests__/route-decision-writer.test.mjs` | `wc -l skills/wh-review/contracts/*.md` |
| route-decision-{stage}-{review_flow_id}.json 八字段两阶段写入契约与未知 stage fail-loud（AC2-2, AC2-3） | `npx vitest run skills/wh-review/scripts/__tests__/route-decision-writer.test.mjs`（已知 stage 断言第一次写入后七字段非空、`review_input_hash` 为空，第二次写入后八字段全部非空；未知 stage 断言 `exitCode!==0`，两组均需通过） | `cat tasks/<task-id>/reviews/route-decision-<stage>-<review_flow_id>.json` |
| intake/test-acceptance 判据覆盖（AC9-1, AC10-1） | `npx vitest run skills/wh-review/scripts/__tests__/route-decision-writer.test.mjs`（断言合同内含 `C1`..`C6`/`F1`..`F6` 六个标记） | `grep -cE 'C[1-6]|F[1-6]' skills/wh-review/contracts/intake.md skills/wh-review/contracts/test-acceptance.md` |
| 5 套合同均含 round2+ 降级规则判据（AC-DOWNGRADE-1，本轮新增） | `npx vitest run skills/wh-review/scripts/__tests__/route-decision-writer.test.mjs`（断言 5 个合同文件均含 round2+ 降级规则与 a/b/c 三类例外关键概念） | `grep -l "round2" skills/wh-review/contracts/*.md \| wc -l` |
| design/plan/code 合同深化范围标注（本轮新增，合同深化验收标准）：三者当前维持占位版本，但**必须**在验收标准中明确记录后续深化需补齐 4 项质量抓手（Blocking/Non-blocking 显式分类清单 / Structural Quality Gate 具体红线 / FR Consumption Point Scan / Revision Record append-only 写保护），不得停留在空泛版本、不得被跳过 | `grep -l "CONTRACT-DEPTH: placeholder" skills/wh-review/contracts/design.md skills/wh-review/contracts/plan.md skills/wh-review/contracts/code.md \| wc -l`（须=3） | `grep -A1 "CONTRACT-DEPTH" skills/wh-review/contracts/design.md skills/wh-review/contracts/plan.md skills/wh-review/contracts/code.md` |

---

## Stage 2

**Purpose**: 轮次状态机、裁决与报告渲染、3rd-review 精简、5 stage 接入 D2 门。对应 plan.md Phase 2。

- [ ] T010 [WHREVIEW] 实现 `skills/wh-review/scripts/round-state.mjs`：维护 spec.md §6/AC-D10/AC-D10.1/AC-D10.2 定义的完整轮次状态字段集——`review_flow_id`（本轮修复新增：某 stage 发起全新审查流程时生成一次，同一流程内不变，用于跨轮 artifact 命名，字段定义见 data-contracts.md Contract 4）、`heterologous_round`/`same_source_round`/`total_round`/`mode`/`actual_mode`/`verdict`/`report_path`/`blocking_count`/`fingerprint_repeated`（`post_review_action` 由 T011a 追加写入同一文件，不在本任务范围）、`stage`（本轮修复新增：写入方显式提供，取值 make-decision/build-spec/build-plan/build-code/verify-code 之一）、`history`（本轮修复新增：每轮写入时追加当轮快照 `{round_type, round_index, total_round, verdict, blocking_count, fingerprint_repeated}`，不覆盖已有条目，字段结构见 data-contracts.md Contract 4）。断言 `total_round = heterologous_round + same_source_round`；断言 `history` 数组随轮次单调追加不缩短。FR: FR-WHREVIEW-003 (stage:2, depends:T001)
- [ ] T010a [WHREVIEW] 实现 `skills/wh-review/scripts/invoke-review-engine.mjs`：wh-review→3rd-review 的主调度执行入口。①runner discovery（代码中不得写死任何一台机器的绝对路径）：优先取 `THIRD_REVIEW_RUNNER` 环境变量作为可执行入口（可为完整路径，也可仅为文件名——为文件名时相对已解析出的 3rd-review 仓库根目录拼接）；`THIRD_REVIEW_RUNNER` 未设置时，按 spec.md FR-THIRDREVIEW-001「Runner 发现规则」的约定默认规则自动定位到 3rd-review 仓库的 `scripts/run-heterologous-review.mjs`，不需要额外环境变量兜底——`THIRD_REVIEW_REPO_ROOT` 仅作为定位 3rd-review 仓库根目录的可选 override（用于非约定路径场景），设置时优先于默认约定路径解析，**未设置本身不构成失败条件**；只有当最终解析出的 runner 路径在文件系统上确实不存在时，才归入下方③"runner 不存在"失败映射（不额外报 fail-loud 配置错误）；②将装配好的 `{mode, contract, materials}` 三元组序列化写入临时 `--diff` 文件，以 `node <runner> --diff=<file> --output=<file>` 格式调用（全部 `--flag=value`，不传 `--checkpoint`/`--round`）；③失败映射：runner 不存在、非零退出、超时、`--output` 缺失或不可解析，统一映射为 `verdict=escalate_to_human`，wh-review 自身以退出码 0 正常返回（NFR-2 例外条款，不视为 wh-review 自身故障）——此类场景下引擎从未产出真实 `--output`，wh-review 须自行合成一份最小失败元数据 JSON（`verdict:"escalate_to_human"` + `synthetic:true` + `failure_reason` 三字段，字段与枚举定义见 spec.md FR-THIRDREVIEW-001"失败路径 raw artifact 合成规则"/data-contracts.md Contract 2）；④将 3rd-review 引擎原始返回结果（正常场景）或③中 wh-review 合成的失败元数据（失败场景）统一落盘至 `tasks/{task-id}/reviews/verdict-{stage}-{review_flow_id}-round-{total_round}.raw.json`（此前修复：文件名加入 `{stage}` 维度；本轮修复：进一步加入 `{review_flow_id}` 维度，避免同 stage 新审查流程覆盖旧流程证据，权威路径见 spec.md FR-THIRDREVIEW-001"evidence/report 落盘路径规则"），两种来源同路径、同字段结构，下游统一读取；并把结构化 `{verdict, findings, actual_mode}` 交还给 round-state.mjs 消费。**前置阻塞项（本轮新增，build-code 阶段启动前必须消除，否则整个方案无法运行）**：本任务开工前必须先对 3rd-review 独立仓库（`$THIRD_REVIEW_REPO_ROOT`，发现规则见 spec.md FR-THIRDREVIEW-001）`scripts/run-heterologous-review.mjs` 的当前实际代码跑通下方 Checkpoint 表 AC5-1/AC5-2 校验，确认其已改造为本任务②所述 canonical 协议（不含 `--checkpoint`/stage flag，`mode`/`contract`/`materials` 随 `--diff` 文件 JSON 内容传入，非纯 diff 文本）；校验未通过（仍要求 `--checkpoint` 或未消费结构化 JSON）即视为阻塞，不得绕过继续实现本任务，须先完成/推进 T015a 或升级人工处理。FR: FR-THIRDREVIEW-001, NFR-2 (stage:2, depends:T001,T007,T015a)
- [ ] T010b [WHREVIEW] 实现 `skills/wh-review/scripts/snapshot-writer.mjs`：每轮审查提交前，对文档类审查对象（spec.md/data-contracts.md/plan.md/tasks.md）自动落盘当轮文档快照至 `tasks/{task-id}/reviews/snapshots/{doc}-{review_flow_id}-r{N}.md`（本轮修复：文件名加入 `{review_flow_id}` 维度，避免同 stage 新审查流程覆盖旧流程快照）；`total_round≥2` 时读取 round(N-1) 快照与当前文档内容做文本 diff，供 T010a 组装 `materials` 时消费；round(N-1) 快照缺失时 fail-loud 报错，不静默退化为全文送审。FR: FR-WHREVIEW-006 (stage:2, depends:T001)
- [ ] T010c [WHREVIEW] 扩展 `invoke-review-engine.mjs`：装配 `materials` 字段时读取 stage 主 agent 派生子代理产出的 `tasks/{task-id}/reviews/prompt-{review_flow_id}-r{N}.md`（本轮修复：文件名加入 `{review_flow_id}` 维度，避免同 stage 新审查流程覆盖旧流程 prompt 文件；若存在则作为 `materials` 唯一来源）；该文件缺失或读取失败时 fail-loud 报错，不静默回退为空 materials；`mode`/`contract` 两个字段独立赋值（分别来自 round-state.json 当轮判定值与 route-decision-{stage}-{review_flow_id}.json 的 `contract_path`/`contract_hash`），不依赖对该文件的解析，见 data-contracts.md Contract 11。FR: FR-WHREVIEW-007 (stage:2, depends:T010a)
- [ ] T011 [WHREVIEW] 在 `round-state.mjs` 中实现降级/升级逻辑：第1轮全量→第2轮起增量降级（构造 Delta Package，文档类审查对象改用 T010b 产出的快照 diff 而非全文，非全量复制文件大小校验）→异源最多3轮→轮级信号（连续3轮 `blocking_count≥3`）直接升级人工且不切同源模式；finding 级信号（同一 `finding_fingerprint` 在 `finding_fingerprints` 中连续2轮 `last_status="open"`，round16 修复：阈值由3改为2）不直接升级，先追加 `root_cause_diagnoses` 记录触发根因诊断+定向修复尝试（该修复尝试对应轮次恰为该阶段轮次硬顶第3轮，仍在硬顶内），修复尝试对应轮次审查后仍未闭合方升级人工（round16 修复：已删除 round14 引入的"终审轮无下一轮，跳过诊断直接升级"例外条款——阈值改为2后，该 finding 首次达到 `consecutive_unresolved_rounds=2` 必发生在阶段第1或第2轮末，第3轮硬顶内必有空间完成修复尝试，不再存在"终审轮无下一轮"的场景，见 spec.md FR-WHREVIEW-003"finding 级信号"段、AC3-6⑤）（本轮修复：轮级"连续3轮"判定须从 `history` 数组中按 `round_type` 过滤出最近3条同类型快照逐一核对，finding 级判定直接读取 `finding_fingerprints.consecutive_unresolved_rounds`，不得仅比较当轮与被覆盖前的单一快照，见 spec.md FR-WHREVIEW-003"升级人工触发条件"判定实现条款）；同时把 T010a 返回的 `verdict`/`actual_mode` 与本轮计算出的 `blocking_count`/`fingerprint_repeated`/`report_path` 写回 round-state.json 顶层字段，把当轮快照追加进 `history` 数组，把本轮 blocking findings 逐一计算指纹更新进 `finding_fingerprints` 数组（AC-D10, AC-D10.1, AC-D10.2, AC3-5, AC3-6）。FR: FR-WHREVIEW-003 (stage:2, depends:T010,T010a,T010b)
- [ ] T011a [WHREVIEW] 在 `round-state.mjs`（同 T010/T011 文件）内新增 `post_review_action` 字段计算与写入逻辑：`verdict=pass` 且 `stage∈{make-decision, build-plan, verify-code}` → `await_human_confirmation`；`verdict=pass` 且 `stage∈{build-spec, build-code}` → `auto_advance`；`revise_required`/`escalate_to_human` → 该字段置空（不适用）。对应 spec.md FR-D2-001 的 `post_review_action` 赋值规则、AC8-1/AC8-2。FR: FR-D2-001 (stage:2, depends:T010,T011)
- [ ] T011b [WHREVIEW] 实现 `skills/wh-review/scripts/human-confirmation.mjs`：只负责**批准态**artifact 的写入与读取，不生成任何等待态文件——等待态完全由 round-state.json 的 `post_review_action=await_human_confirmation` 字段表达，未获人工批准前不落盘 `human-confirmation-*.json`。当 human orchestrator 显式批准后，调用写入函数生成 `tasks/{task-id}/reviews/human-confirmation-{stage}-{review_flow_id}-{total_round}.json`（本轮修复：文件名加入 `{review_flow_id}` 维度，避免同 stage 新审查流程覆盖旧流程批准态文件），字段仅含 `approved_by`/`approved_at`/`stage`/`review_flow_id`/`total_round`（不含 verdict/awaiting_since，避免与等待态语义混用），符合 spec.md FR-D2-001 对该 artifact 的定义。提供读取函数供 T019-T021 的 stage SKILL.md 与 T023a 的 orchestrator 重启恢复逻辑消费：判定"已批准可推进"的唯一依据是该 artifact 存在且其 `stage`/`review_flow_id`/`total_round` 与当前一致。对应 AC8-3（pass 分支无自动推进代码）、AC8-4（重启恢复）。FR: FR-D2-001 (stage:2, depends:T011a)
- [ ] T012 [WHREVIEW] 移植 3rd-review 仓库既有 `scripts/render-review-report.mjs` 至 `skills/wh-review/scripts/render-review-report.mjs`，适配 `parseTaskDir()` 落盘路径，实现裁决枚举 `pass/revise_required/escalate_to_human` 到文件名后缀 `[-pass|-revise|-escalated]` 的一一映射（`pass`→`-pass`、`revise_required`→`-revise`、`escalate_to_human`→`-escalated`，三者不得共用同一后缀）。FR: FR-WHREVIEW-004 (stage:2, depends:T001)
- [ ] T013 [P] [WHREVIEW] 创建 `skills/wh-review/templates/report-template.md`（6 章报告结构，参照 agenthub 既有报告章节划分）。FR: FR-WHREVIEW-004 (stage:2, depends:T001)
- [ ] T014 [WHREVIEW] 实现 `report-index.md` 追加写入逻辑（seq/timestamp/stage/report_kind/verdict/report_path/summary 列），每次渲染追加一行不覆盖历史。FR: FR-WHREVIEW-004 (stage:2, depends:T012)
- [ ] T015 [P] [THIRDREVIEW] 精简 3rd-review 仓库 `SKILL.md`：剥离 stage/轮次知识，仅保留纯引擎接口说明（收入参 `{mode,contract,materials}` → 返回 `{verdict,findings,actual_mode}`），确认调用入口不含 `--checkpoint` 或 stage/round flag。FR: FR-THIRDREVIEW-001 (stage:2, depends:无)
- [ ] T015a [THIRDREVIEW] 精简 3rd-review 仓库调用入口代码本体（依据 decision-log D1"零 stage/轮次知识"决策，不扩大到决策未提及的范围）：①`scripts/run-heterologous-review.mjs` 移除 `loadVerifierContext(checkpoint)` 按 stage 名称解析合同的逻辑与 `--checkpoint`/`--round` CLI flag，改为直接消费 `--diff` 文件内结构化 `{mode,contract,materials}` payload 中的 `contract`/`materials` 送审，CLI 收窄为 `--diff=<file> --output=<file>` 两个必填 flag；②`scripts/route-review.mjs` 中依赖 `--checkpoint` 做跨轮历史隔离的分支（原 FR-DEGRADE-002 checkpoint isolation）随之移除，轮次隔离职责已转移至 wh-review 自身的 round-state.mjs；③`standalone.sh` 同步移除 `--checkpoint=` 参数解析与向 runner 透传 `${CHECKPOINT:+--checkpoint=...}` 的逻辑。对应 AC5-1, AC5-2, AC5-3。FR: FR-THIRDREVIEW-001 (stage:2, depends:T015)
- [ ] T016 [P] [THIRDREVIEW] 改写 `workflows/build-code/SKILL.md` §7：删除 numbered step / if-else 逻辑，仅保留"单次调用语义参见 §13"的概念性导读一句话。FR: FR-THIRDREVIEW-002 (stage:2, depends:无)
- [ ] T017 [THIRDREVIEW] 核查并删除 3rd-review 仓库调用入口（`standalone.sh` 或等价 runner，如 `scripts/run-heterologous-review.mjs`）中以 `revise_required` 为条件的 while/for 循环，确保单次调用返回后进程即终止。FR: FR-THIRDREVIEW-003 (stage:2, depends:T015,T015a)
- [ ] T018 [THIRDREVIEW] 加固 3rd-review 仓库 `scripts/run-threat-auditor.mjs` 的 schema-drift/blocking 语义判断，避免"含敏感词但语义合规"文本被误判 blocking，同时不放过"不含敏感词但实质违反契约"的文本；新增两个回归夹具落在 3rd-review 仓库既有 `__fixtures__/` 目录下——`__fixtures__/semantic-compliant-with-keyword.md`（含敏感词但语义合规，验证不误判 blocking）与 `__fixtures__/semantic-violation-no-keyword.md`（不含敏感词但实质违反契约，验证不漏判），供 checkpoint gate_cmd 用真实 `--spec/--auditor/--output` CLI 断言消费。FR: FR-THIRDREVIEW-004 (stage:2, depends:T015)
- [ ] T019 [STAGE] 迁移 `workflows/make-decision/SKILL.md` 收尾调用点：将原直接调用 3rd-review 的入口替换为调用 wh-review（透传 `stage=make-decision` 与 `task_id`），校验生成的 `route-decision-{stage}-{review_flow_id}.json` 的 `contract_path` 命中 `skills/wh-review/contracts/` 下 make-decision 专属合同（而非通用回退路径）；`post_review_action=await_human_confirmation` 时仅停在 D2 门等待人工批准，不自行生成或伪造 T011b 定义的批准 artifact——批准 artifact 只能由 human orchestrator 触发 T011b 写入，stage 自身不得自动推进。FR: FR-STAGE-001, FR-D2-001 (stage:2, depends:T007,T010,T011a,T011b,T012)
- [ ] T020 [P] [STAGE] 迁移 `workflows/build-plan/SKILL.md` 收尾调用点：同 T019 迁移方式（透传 `stage=build-plan`），校验 route-decision 命中 build-plan 专属合同，`await_human_confirmation` 时接入 D2 门（本文件自身即受此任务影响）。FR: FR-STAGE-001, FR-D2-001 (stage:2, depends:T007,T010,T011a,T011b,T012)
- [ ] T021 [P] [STAGE] 迁移 `workflows/verify-code/SKILL.md` 收尾调用点：同 T019 迁移方式（透传 `stage=verify-code`），校验 route-decision 命中 verify-code 专属合同，`await_human_confirmation` 时接入 D2 门，并对齐 F1-F6 新鲜性判据消费。FR: FR-STAGE-001, FR-D2-001, FR-TESTACCEPTANCE-001 (stage:2, depends:T007,T010,T011a,T011b,T012,T009)
- [ ] T022 [P] [STAGE] 迁移 `workflows/build-spec/SKILL.md` 收尾调用点：替换直接调用 3rd-review 为调用 wh-review（透传 `stage=build-spec` 与 `task_id`），校验 route-decision 命中 build-spec 专属合同；`post_review_action=auto_advance`，确认无 `await_human_confirmation` 误触发、自动推进行为不变。FR: FR-STAGE-001 (stage:2, depends:T007,T011a)
- [ ] T023 [P] [STAGE] 迁移 `workflows/build-code/SKILL.md` 收尾调用点：替换直接调用 3rd-review 为调用 wh-review（透传 `stage=build-code` 与 `task_id`），校验 route-decision 命中 build-code 专属合同；`post_review_action=auto_advance` 保持自动推进（与 T016 的 §7 改写共同验证）。FR: FR-STAGE-001 (stage:2, depends:T007,T011a,T016)
- [ ] T023a [STAGE] 实现 orchestrator 重启恢复判断逻辑：orchestrator 启动/恢复时**先校验 round-state.json 的 `stage` 字段与自身当前 stage 是否一致（本轮修复新增前置校验）**——不一致须 fail-loud 报错终止，不得静默假定该文件属于当前 stage；校验通过后再读取 `post_review_action`——取值 `auto_advance` 直接推进；取值 `await_human_confirmation` 则检查 T011b 定义的**批准态** artifact `human-confirmation-{stage}-{review_flow_id}-{total_round}.json` 是否存在且 `stage`/`review_flow_id`/`total_round` 字段与当前一致：存在且匹配才视为已批准、恢复推进；artifact 不存在（无论是尚未批准还是从未生成过）一律视为未批准，继续停在 D2 确认门，不因重启而重复推进也不误放行。对应 AC8-4。FR: FR-D2-001 (stage:2, depends:T011b,T019,T020,T021)
- [ ] T023b [P] [STAGE] 回归校验：T019-T023 对 5 个 stage SKILL.md 收尾调用点的迁移，不得移除或改写既有"收尾统一调用 `docs/human-brief-template.md`"这条规矩（spec.md AC7-1/AC7-2）——D2 门/route-decision 的新增内容是在收尾调用点内部新增的判断分支，`docs/human-brief-template.md` 的七要素摘要输出格式仍是人工确认界面的唯一呈现层，两者不冲突、不得二选一地把后者删掉。新增 `workflows/__tests__/human-brief-behavioral.test.mjs`（行为级验证，AC-D6，round19 修复）：对 5 个 stage 逐一实际触发其收尾流程，捕获生成的 human-brief 产物文本，断言七要素信息点均实际出现、结尾符合对应 stage 类型（决策 gate 类含"请确认"三选项 / 自动放行类含"自动进入下一阶段"）、不含内部产物名或字段名字面量；5 个 stage 全部通过方为合格，任一 stage 收尾流程被绕过或走死分支即判不通过，不再仅凭 SKILL.md 内引用字符串是否存在放行。逐一 grep 5 个文件确认引用仍在（`make-decision`/`build-spec`/`build-plan`/`build-code`/`verify-code` 五个 `workflows/*/SKILL.md`，5/5 全部命中）作为辅证，非唯一判定依据。FR: FR-STAGE-001 (stage:2, depends:T019,T020,T021,T022,T023)
- [ ] T023c [STAGE] 在 T019-T023 迁移的 5 个 stage SKILL.md 收尾调用点内，统一新增两段式调用流程（round16 修复：消除"子代理需要 review_flow_id/total_round 但这两个 ID 只能由 wh-review 生成"的循环依赖）：①先以"准备模式"调用 wh-review（复用 T007 route-decision-writer.mjs 解析 `contract_path`、T010 round-state.mjs 分配/复用 `review_flow_id` 并计算下一个 `total_round`），取得 `{review_flow_id, total_round, contract_path}` 三元组；②stage 主 agent 拿到三元组后派生审查提示词生成子代理，子代理用这三个已知值（而非自行猜测或重新计算）读取 `contract_path`+当前 materials/diff，写出 `tasks/{task-id}/reviews/prompt-{review_flow_id}-r{total_round}.md`，stage 主 agent 自身不直接在主上下文拼接合同/materials 全文，仅持有该文件路径；③stage 主 agent 再调用 wh-review 执行实际审查并传入该文件路径（与 T010c 的读取侧配套，`contract_path` 权威解析结果仍以步骤①为准，子代理不得重新解析）。逐一 grep 5 个文件确认均含"先准备取得三元组、再派生子代理、再执行审查"三步骤描述，5/5 全部命中才算通过。FR: FR-WHREVIEW-007 (stage:2, depends:T007,T010,T019,T020,T021,T022,T023,T010c)

**Checkpoint**（双列可运行验证，详见 plan.md Phase 2 Verify 表）：

| 检查点 | gate_cmd（机器判定） | display_cmd（人工摘要） |
|---|---|---|
| AC3-1~AC3-5（轮次字段类型、升级人工条件、history/stage 自校验） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs` | `jq '.review_flow_id,.heterologous_round,.same_source_round,.total_round,.mode,.actual_mode,.verdict,.report_path,.blocking_count,.fingerprint_repeated,.stage,.history' tasks/<task-id>/reviews/round-state.json` |
| AC8-1, AC8-2（`post_review_action` 赋值规则） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs`（覆盖 5 个 stage 的 pass 分支断言） | `jq -r '.post_review_action' tasks/<task-id>/reviews/round-state.json` |
| AC8-3（pass 分支在 D2 门 stage 不绕过人工确认，辅证 AC8-1） | `npx vitest run skills/wh-review/scripts/__tests__/human-confirmation.test.mjs`（复用/扩展 AC8-4 同一测试文件新增用例：构造 verdict=pass 且 `post_review_action=await_human_confirmation`、且 `human-confirmation-{stage}-{review_flow_id}-{total_round}.json` 尚未生成的场景，断言 T023a 消费的推进判断函数返回"停在确认门/不推进"而非因 verdict=pass 直接放行——校验实际控制流是否经过批准态 artifact 存在性判断，而非搜索特定字符串字面量） | `ls tasks/<task-id>/reviews/human-confirmation-*.json 2>/dev/null \|\| echo NOT_APPROVED_STILL_GATED` |
| AC8-4（human-confirmation artifact 生成/重启恢复） | `npx vitest run skills/wh-review/scripts/__tests__/human-confirmation.test.mjs` | `cat tasks/<task-id>/reviews/human-confirmation-*.json` |
| AC8-4（round-state.json `stage` 字段不一致时 fail-loud，本轮新增） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs`（构造 round-state.json 的 `stage` 与 T023a 传入的当前 stage 不一致场景，断言 T023a 恢复逻辑非零退出且不推进） | `jq -r '.stage' tasks/<task-id>/reviews/round-state.json` |
| AC-D5, AC-D6（D2 门行为总览） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs skills/wh-review/scripts/__tests__/human-confirmation.test.mjs` | `ls tasks/<task-id>/reviews/human-confirmation-*.json 2>/dev/null` |
| AC3-6（finding 级指纹追踪+根因诊断改判，round14 新增；round16 修复：阈值3改为2，删除⑤"优先级例外"验证点） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs`（覆盖：①`consecutive_unresolved_rounds=2` 时不直接 `escalate_to_human` 而是追加 `root_cause_diagnoses`；②修复尝试轮后 `last_status="resolved"` 断言非 escalate；③仍 `open` 断言 escalate；④`fingerprint_repeated=true` 单独出现不触发 escalate；⑤模拟 round1 首现→round2 触发诊断(`consecutive_unresolved_rounds=2`)→round3(阶段轮次硬顶)完成修复尝试的完整场景，断言诊断→重试→仍不行才升级路径在硬顶内可达） | `jq '.finding_fingerprints,.root_cause_diagnoses' tasks/<task-id>/reviews/round-state.json` |
| AC-DOWNGRADE-2~4（round2+ 新发现降级规则行为，本轮新增） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs`（覆盖默认降级为 minor、例外 (a) 本轮改动新引入、例外 (c) scope boundary 三组断言） | `jq '.findings[] \| {finding_fingerprint, severity_decision}' tasks/<task-id>/reviews/verdict-<stage>-<review_flow_id>-round-<n>.raw.json` |
| AC-SNAPSHOT-1~4（文档快照 diff 机制，本轮新增） | `npx vitest run skills/wh-review/scripts/__tests__/snapshot-writer.test.mjs`（覆盖 round1 落盘全文快照、round2+ 生成 diff、round(N-1) 快照缺失 fail-loud、路径命名规则四组断言） | `ls tasks/<task-id>/reviews/snapshots/` |
| AC-PROMPT-1~5（审查提示词生成子代理机制，round14 新增；round16 新增 AC-PROMPT-5） | `npx vitest run skills/wh-review/scripts/__tests__/invoke-review-engine.test.mjs`（覆盖 `prompt-{review_flow_id}-r{N}.md` 存在时被读取、缺失/读取失败 fail-loud、`mode`/`contract` 独立于该文件解析、以及"准备"调用返回值与最终文件名/route-decision-{stage}-{review_flow_id}.json 一致（两段式调用顺序，消除循环依赖）四组断言） | `cat tasks/<task-id>/reviews/prompt-<review_flow_id>-r<n>.md` |
| 5 stage route-decision 命中专属合同（T019-T023） | `npx vitest run skills/wh-review/scripts/__tests__/route-decision-writer.test.mjs`（对 5 个 stage 分别断言 `contract_path` 指向对应专属合同文件，非通用回退） | `jq -r '.contract_path' tasks/<task-id>/reviews/route-decision-<stage>-<review_flow_id>.json` |
| 5 stage 收尾真实生成 human-brief 产物（AC-D6 行为验证）+ 仍统一调用 human-brief-template（AC7-1, AC7-2 回归保护, T023b） | `npx vitest run workflows/__tests__/human-brief-behavioral.test.mjs`（对 5 个 stage 逐一实际触发其收尾流程，捕获生成的 human-brief 产物文本，断言七要素信息点均实际出现、结尾符合对应 stage 类型、不含内部产物名/字段名字面量；5 个 stage 全部通过方为合格） | `for f in workflows/make-decision/SKILL.md workflows/build-spec/SKILL.md workflows/build-plan/SKILL.md workflows/build-code/SKILL.md workflows/verify-code/SKILL.md; do grep -q "docs/human-brief-template.md" "$f" \|\| echo "MISSING:$f"; done`（辅证：引用字符串仍在，仅作人工摘要参考） |
| AC5-1, AC5-2（引擎零 stage/轮次知识） | `node $THIRD_REVIEW_REPO_ROOT/scripts/run-heterologous-review.test.mjs`（新增 CLI 契约用例，沿用该仓库既有 `node scripts/*.test.mjs` 测试约定：①仅以 `--diff=<file> --output=<file>` 调用 runner，断言退出码 0 且产出 verdict；②额外附加 `--stage=build-spec --round=2 --checkpoint=build-spec` 调用，断言这些多余参数被忽略——不改变审查结果、不触发按 stage 路由或跨轮隔离分支——或触发非零退出+明确报错，两种行为任一皆可，只要不被静默解析为路由/轮次控制逻辑即算通过）配合精确 flag 定义 grep：`grep -nE "\.option\(['\"](diff\|output\|stage\|round\|checkpoint)['\"]|['\"]--?(diff\|output\|stage\|round\|checkpoint)['\"]" $THIRD_REVIEW_REPO_ROOT/scripts/run-heterologous-review.mjs $(test -f $THIRD_REVIEW_REPO_ROOT/standalone.sh && echo $THIRD_REVIEW_REPO_ROOT/standalone.sh)`（canonical runner `run-heterologous-review.mjs` 恒为必检文件；`standalone.sh` 仅当其存在时才纳入检测，若已按 FR-THIRDREVIEW-003 合法废弃删除则自动从文件列表跳过，不因其缺失误判本检查点失败；直接定位实际的 `yargs`/`process.argv` flag 解析定义代码行，断言命中的 flag 名集合恰为 `{diff, output}`；不再对 SKILL.md 文本做"排除说明性整行后再模糊搜索概念词"式检测——该方案按整行匹配排除，真实违规代码行只要与说明性词凑巧同行即会被一并放过，见 round7 审查发现） | `node $THIRD_REVIEW_REPO_ROOT/scripts/run-heterologous-review.mjs --diff=<file> --output=<file> --stage=build-spec --round=2 2>&1`（人工核对多余参数的实际处理结果是被忽略还是报错，两者皆可但需在输出中直观可见） |
| AC6-1~AC6-4（§7 机器可检验规则） | `npx vitest run workflows/build-code/__tests__/section7-machine-checkable.test.mjs` | `sed -n '/^## 7/,/^## 8/p' workflows/build-code/SKILL.md` |
| AC-THIRDREVIEW3-1/3-2（无循环、单次调用即终止） | `! grep -En "while.*revise_required|for.*revise_required" $THIRD_REVIEW_REPO_ROOT/scripts/run-heterologous-review.mjs $(test -f $THIRD_REVIEW_REPO_ROOT/standalone.sh && echo $THIRD_REVIEW_REPO_ROOT/standalone.sh)`（先在旧版本验证命中 >0，再在改动后验证命中 0；canonical runner `run-heterologous-review.mjs` 恒为必检文件，`standalone.sh` 若已按 FR-THIRDREVIEW-003 合法废弃删除则自动跳过、不参与判定） | `grep -n "revise_required" $(test -f $THIRD_REVIEW_REPO_ROOT/standalone.sh && echo $THIRD_REVIEW_REPO_ROOT/standalone.sh || echo $THIRD_REVIEW_REPO_ROOT/scripts/run-heterologous-review.mjs)` |
| AC-THIRDREVIEW4 系列（threatAuditor 语义判断） | 用真实 CLI 契约 `--spec=<path> --auditor=<path> --output=<path>`（而非不存在的 `--test-fixture`）对 T018 新增的两个夹具各跑一次并双向确认：`node .../run-threat-auditor.mjs --spec=.../__fixtures__/semantic-compliant-with-keyword.md --auditor=.../subreviewers/threat-modeling-auditor.md --output=/tmp/ta-compliant.json && jq -e '[.findings[]\|select(.severity=="blocking")]\|length==0' /tmp/ta-compliant.json`（含敏感词但合规，断言 0 条 blocking）**且** `node .../run-threat-auditor.mjs --spec=.../__fixtures__/semantic-violation-no-keyword.md --auditor=.../subreviewers/threat-modeling-auditor.md --output=/tmp/ta-violation.json && jq -e '.findings\|length>=1' /tmp/ta-violation.json`（不含敏感词但违约，断言 ≥1 条命中）；加固前两条命令分别命中"blocking>0"与"findings 为空"（已用临时夹具人工验证过这一加固前基线），加固后须两条同时反转为通过，仅一条通过不算达标 | `cat /tmp/ta-compliant.json /tmp/ta-violation.json` |
| runner discovery + 调用格式（AC5-3, T010a） | `npx vitest run skills/wh-review/scripts/__tests__/invoke-review-engine.test.mjs`（覆盖 `THIRD_REVIEW_RUNNER` 设置/未设置×`THIRD_REVIEW_REPO_ROOT` 设置/未设置四组断言，均断言调用参数为 `--diff=<file> --output=<file>` 且不含 `--checkpoint`；`THIRD_REVIEW_RUNNER` 未设置时（不论 `THIRD_REVIEW_REPO_ROOT` 是否设置）均按约定默认规则自动定位到 `run-heterologous-review.mjs`，不归入"runner 不存在"failure mapping，仅当最终解析路径在文件系统上确实不存在时才归入该失败映射） | `grep -En "THIRD_REVIEW_RUNNER\|THIRD_REVIEW_REPO_ROOT" skills/wh-review/scripts/invoke-review-engine.mjs`（断言两个环境变量名均出现，且不出现任何 `/Users/`/`/home/` 绝对路径字面量） |
| 3rd-review 失败映射→escalate_to_human（NFR-2 例外） | `npx vitest run skills/wh-review/scripts/__tests__/invoke-review-engine.test.mjs`（分别模拟 runner 不存在/非零退出/超时/`--output` 缺失四种场景，断言均返回 `verdict=escalate_to_human` 且进程退出码为 0） | `review_flow_id=$(jq -r '.review_flow_id' tasks/<task-id>/reviews/round-state.json); jq -r '.verdict' tasks/<task-id>/reviews/verdict-<stage>-${review_flow_id}-round-1.raw.json`（本轮修复：文件名加入 `{review_flow_id}` 维度，需先从 round-state.json 读取该值；失败场景下该文件由 wh-review 自行合成、含 `synthetic:true`，非引擎真实产出，但与正常场景共用同一落盘路径与字段结构，见 FR-THIRDREVIEW-001） |
| verdict-{stage}-{review_flow_id}-round-{n}.raw.json 落盘（此前修复：文件名加入 stage 维度，避免同一 task_id 下不同 stage 各自从1计数导致文件名撞车；本轮修复：进一步加入 review_flow_id 维度，避免同一 stage 先后发起的不同审查流程因 total_round 复位而互相覆盖） | `npx vitest run skills/wh-review/scripts/__tests__/invoke-review-engine.test.mjs` | `ls tasks/<task-id>/reviews/verdict-*-round-*.raw.json` |

---

## Stage 3

**Purpose**: 指标接入、端到端测试方案、Scope Boundary 与 F10 走查收尾。对应 plan.md Phase 3。

- [ ] T024 [WHREVIEW] 在 `round-state.mjs`（同 T010/T012 文件，不新建 metrics-bridge.mjs）内追加调用，将 wh-review 轮次/耗时/升级信息接入 `metrics/collector.mjs`（`recordSkeleton`/`updateOwnResult`）：`total_round`→`rework_rounds`，本轮耗时→`duration_ms`，`escalate_to_human`→`human_intervention`，不手写独立指标文件。FR: spec.md §6.5 metrics 契约 (stage:3, depends:T010,T012)
- [ ] T025 [TEST] 编写 `specs/wh-review-rebuild/test-plan.md`：定义至少一个可在 workflowhub 本地跑通的完整 stage 调用链端到端冒烟用例，覆盖 wh-review + 精简后 3rd-review 组合；同步创建/扩写配套的 `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs`（NEW，vitest，Phase 3 checkpoint 引用的即此文件），令其真正执行 test-plan.md 定义的那条 stage 调用链并断言 `exitCode===0`——build-plan 阶段已先落一版仅校验 test-plan.md 文档结构（含 `## 冒烟用例`/`## 未覆盖 stage` 两个必需小节）的最小占位实现，T025 落地 T010-T023 后须把该占位测试替换/扩写为真正跑通调用链的版本，不得保留占位版本充数。FR: FR-TEST-001 (stage:3, depends:T019,T020,T021,T022,T023)
- [ ] T025a [P] [TEST] 新增独立测试 `skills/wh-review/scripts/__tests__/stage-invocation-chain.test.mjs`（不复用 T007 的 `route-decision-writer.test.mjs`——后者只覆盖合同路径映射/文件写入，测不到调用链本身），对 T025 端到端冒烟用例未直接覆盖的其余 stage（5 个迁移 stage 中未被选为冒烟主线的 stage）逐一实际触发其收尾入口（`invoke-review-engine.mjs`，可用 `THIRD_REVIEW_RUNNER` 指向确定性 stub runner 隔离外部依赖）完成一次真实调用，断言每个 stage 的调用链 `exitCode===0` 且正常落盘 `route-decision-{stage}-{review_flow_id}.json`/`verdict-*-round-*.raw.json`，验证迁移在调用链层面未引入回归，而非仅断言数据结构/合同映射正确。FR: FR-STAGE-001 (stage:3, depends:T019,T020,T021,T022,T023,T025)
- [ ] T026 [P] [TEST] Scope Boundary 核查：确认改动未触碰 `workflows/build-code/SKILL.md` §13、agenthub 侧文件、3rd-review 仓库允许清单以外的其他共享技能、UI/通知机制；同时对 3rd-review 仓库自身的 diff 执行同等的允许清单校验（不得只检查 workflowhub 侧、放过 3rd-review 侧的越界改动）；3rd-review 允许清单需含 T018 新增的 `__fixtures__/semantic-compliant-with-keyword.md`、`__fixtures__/semantic-violation-no-keyword.md`（见下方 Scope Boundary 校验脚本），不得因这两个合法 fixture 文件误判越界。FR: spec.md §9 不做清单 (stage:3, depends:T015,T016,T017,T018)
- [ ] T027 [P] [TEST] F10 Anti-Over-Engineering Gate 走查记录归档，与 Constitution Check 结果一并移交 build-plan 后续 spec-analyze 步骤做跨产物一致性分析。FR: 宪法 F10 (stage:3, depends:T010,T012,T014)

**Checkpoint**（双列可运行验证，详见 plan.md Phase 3 Verify 表）：

| 检查点 | gate_cmd（机器判定） | display_cmd（人工摘要） |
|---|---|---|
| metrics 接入（AC-METRICS-1, AC-METRICS-2） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs` | `cat metrics/<task-id>/skeleton.json`（实际落盘路径以 `metrics/collector.mjs` 为准） |
| test-plan.md ≥1 端到端冒烟用例 | `npx vitest run specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs` | `cat specs/wh-review-rebuild/test-plan.md` |
| 未被冒烟覆盖 stage 不因迁移报错（T025a） | `npx vitest run skills/wh-review/scripts/__tests__/stage-invocation-chain.test.mjs`（对未被冒烟直接覆盖的 stage 逐一实际触发 invoke-review-engine.mjs 走完调用链，断言 exitCode===0，覆盖调用链本身而非仅合同映射；不复用 route-decision-writer.test.mjs） | `grep -A3 "未覆盖 stage" specs/wh-review-rebuild/test-plan.md` |
| Scope Boundary 无越界项 | 见下方 Scope Boundary 校验脚本（断言无输出） | `git diff --stat` |
| F10 走查记录完整 | `grep -c 'F10 门控结论' specs/wh-review-rebuild/plan.md`（断言 `≥1`） | `cat tasks/wh-review-rebuild/artifacts/build-plan-f10-gate.md` |

Scope Boundary 校验脚本（build-code 阶段实际执行；覆盖 workflowhub 与 3rd-review 两个独立仓库各自的 diff，均断言无输出方为通过，工作区未提交改动与各自 HEAD 相比）：

```bash
# 仓库 A：workflowhub（当前仓库）
git diff --name-only | grep -vE '^(skills/wh-review/|workflows/(make-decision|build-spec|build-plan|build-code|verify-code)/SKILL.md$|workflows/build-code/__tests__/section7-machine-checkable.test.mjs$|specs/wh-review-rebuild/)'
# 仓库 B：3rd-review（独立仓库；THIRD_REVIEW_REPO_ROOT 为可选 override，与 T010a/invoke-review-engine.mjs 的运行时 discovery 契约一致：设置时优先使用其值，未设置时按 spec.md FR-THIRDREVIEW-001「3rd-review 仓库根目录发现规则」的兄弟目录约定自动发现——取 workflowhub 仓库根目录的上一级目录下的 3rd-review 子目录，不强制要求显式设置，仅当默认发现路径最终在文件系统上也不存在时才报错）
THIRD_REVIEW_REPO_ROOT="${THIRD_REVIEW_REPO_ROOT:-$(cd "$(git rev-parse --show-toplevel)/.." && pwd)/3rd-review}"
[ -d "$THIRD_REVIEW_REPO_ROOT" ] || { echo "3rd-review 仓库根目录不存在：$THIRD_REVIEW_REPO_ROOT（THIRD_REVIEW_REPO_ROOT 未设置时按兄弟目录约定发现失败，可显式设置该环境变量指向实际仓库位置）"; exit 1; }
git -C "$THIRD_REVIEW_REPO_ROOT" diff --name-only | grep -vE '^(SKILL\.md|scripts/(run-heterologous-review|route-review|run-threat-auditor)\.(mjs|test\.mjs)|standalone\.sh|scripts/standalone\.test\.sh|__fixtures__/(semantic-compliant-with-keyword|semantic-violation-no-keyword)\.md)$'
```

---

## Dependencies & Execution Order

### Stage Dependencies

- **Stage 1**: 无前置依赖，可立即开始
- **Stage 2**: 依赖 Stage 1（route-decision-writer、5 套合同需先落地）
- **Stage 3**: 依赖 Stage 2 全部任务完成

### Parallel Opportunities

- Stage 1 内：T002-T006（5 套合同搬迁，不同文件、无相互依赖）可并行
- Stage 2 内：T013（报告模板）、T015（3rd-review SKILL.md 精简）、T016（§7 改写）互不依赖，可并行；T020-T023（4 个 stage SKILL.md 迁移，不同文件）可并行——T019（make-decision）不并行标注，因其是首个跑通 wh-review+D2 门调用链的样例，其余 4 个 stage 迁移方式对 T019 的验证结果做复用参照；T010a（调用引擎）须待 T015a（3rd-review 接口精简）完成后才能对齐新接口联调，不与其并行
- Stage 3 内：T025a、T026、T027 可并行

### Within Each Stage

- Stage 1：先建骨架（T001）→ 并行搬迁合同（T002-T006）→ 汇总实现路由记录（T007）→ 深化两个专属合同（T008/T009）
- Stage 2：wh-review 侧（T010-T014，其中 T010a 依赖 T015a）与 3rd-review 侧（T015-T018）大部分可并行推进，但 5 个 stage SKILL.md 接入（T019-T023）需等 wh-review 侧路由/轮次/渲染/调用引擎能力就绪
- Stage 3：指标接入（T024）与测试方案（T025）需等 Stage 2 全部收口

---

## Implementation Strategy

### MVP

1. 完成 Stage 1：wh-review 骨架 + 5 套合同 + 路由记录
2. 完成 Stage 2 中的 WHREVIEW 任务（T010-T014）+ 至少一个 stage（如 build-plan，T020）接入 D2 门
3. **STOP 校验**：单个 stage 的完整审查调用链可跑通（route-decision 写入 → 引擎调用 → 报告渲染 → D2 门生效）
4. 最小可用：核心追踪链路已闭环

### Incremental Delivery

1. Stage 1 → wh-review 基础设施就绪
2. Stage 2 WHREVIEW 部分 → 追踪能力可用；THIRDREVIEW 部分并行推进 → 引擎瘦身完成
3. Stage 2 STAGE 部分 → 5 stage 全部接入
4. Stage 3 → 指标、测试方案、边界核查收尾

## Notes

- 跨仓库任务（T015、T017、T018）物理改动发生在 `$THIRD_REVIEW_REPO_ROOT/` 独立仓库，需在该仓库自身分支下提交，不在 workflowhub 仓库内创建镜像副本（见 plan.md "Known Gap"）。
- `[P]` 标记任务均已确认涉及不同文件、无相互依赖，可安全并行执行。
- 任务列表未凑够更多阶段块——依赖链实际只分 3 层（骨架/迁移 → 核心机制与精简 → 收尾验证），与 `--stage 3` 参数一致，不为凑数量制造虚假阶段。
