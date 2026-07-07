# 实施计划：wh-review-rebuild

**Task ID**: `wh-review-rebuild` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification `specs/wh-review-rebuild/spec.md`
**Status**: Draft

## 概述

将 workflowhub 的异源审查机制拆分为两层：新建 `skills/wh-review/`（workflowhub 专属调度层，负责 stage→合同映射、轮次状态、降级/升级、Delta Package、报告渲染）与精简后的 3rd-review（跨仓库独立引擎，仅接受 `{mode, contract, materials}`、返回 `{verdict, findings, actual_mode}`）。之所以这样设计，是为了让"审查完成状态可追踪、报告可落盘、stage 专属合同被正确路由"这三个当前完全失效的能力落地，同时不破坏 3rd-review 可被非 workflowhub 场景独立复用的既有能力（隐性必达1）。

## Technical Context

**Language/Version**: Markdown（技能/合同定义）+ Node.js v20（ESM `.mjs` 脚本，与仓库现有 `core/`、`metrics/` 一致）
**Primary Dependencies**: `core/task-dir-parser.mjs`（落盘路径解析）、`metrics/collector.mjs`（M4 指标写入）、3rd-review 独立仓库的 `scripts/run-heterologous-review.mjs` / `scripts/render-review-report.mjs`（跨仓库调用，非 npm 依赖）
**Storage**: Filesystem；wh-review 产物落在 `parseTaskDir()` 解析出的 `task_tracking_root` 下 `tasks/{task-id}/reports/`、`tasks/{task-id}/reviews/route-decision-{stage}-{review_flow_id}.json`、`tasks/{task-id}/reviews/round-state-{stage}-{review_flow_id}.json`（round21 修复：路径按 stage+review_flow_id 隔离，不再是覆盖整个 task 的单一全局文件；轮次状态文件路径为权威定死值，见 spec.md FR-WHREVIEW-003"落盘路径"条款 / data-contracts.md Contract 4，非 wh-review 自行定义）
**Testing**: 现有 `core/__tests__/`（**vitest**，`package.json` `"test": "vitest run"`，非 Node 内置 test runner——此前版本描述有误，已订正）；wh-review 新脚本测试沿用同一约定，落在 `skills/wh-review/scripts/__tests__/*.test.mjs`；3rd-review 仓库自身测试沿用其既有 `node scripts/*.test.mjs` + bash 脚本约定（不引入 vitest 到该独立仓库）；本 task 新增端到端冒烟测试方案见 Phase 3
**Target Platform**: 本地 CLI / Node.js 运行环境，跨 macOS 与 CI 均可执行
**Project Type**: Multi-stage workflow orchestration tool（workflowhub）+ 跨仓库技能引擎（3rd-review）
**Performance Goals**: N/A（无吞吐/延迟类硬性指标；成本目标为"增量模式降低第2轮起审查成本"，非量化 SLA）
**Constraints**: 不新建 worktree（复用已 checkout 的 `workflowhub/wh-review-rebuild` 分支）；3rd-review 跨仓库调用不得在代码中硬编码调用方本机绝对路径，须走 `THIRD_REVIEW_RUNNER`（可执行入口，优先；未设置时按 spec.md FR-THIRDREVIEW-001「Runner 发现规则」的约定默认规则自动定位到 3rd-review 仓库的 `run-heterologous-review.mjs`，不需要额外环境变量兜底）与 `THIRD_REVIEW_REPO_ROOT`（仅作为定位 3rd-review 仓库根目录的可选 override，用于非约定路径场景；未设置本身不构成失败条件，直接走默认约定路径）两个环境变量；仅当最终解析出的 runner 路径在文件系统上确实不存在时才归入既有"runner 不存在"失败映射，不额外新增 fail-loud 分支；不修改 agenthub 侧任何文件
**Scale/Scope**: 预估约 10-14 个文件（新建 `skills/wh-review/` 全模块 ~6 文件 + 3rd-review 仓库内 3-4 文件精简 + workflowhub 5 个 stage SKILL.md 的收尾/D2 门接入校验 + build-code/SKILL.md §7 改写 + 1 份端到端测试方案文档），~1500-2500 行改动（含新建合同文本）

## Constitution Check

*GATE: Phase 0 research 后执行一次；进入 Phase 1 设计前必须全部有勾选与判据。*

### 框架原则（F）

- [x] **F1 薄核心** — 判据：wh-review 只做"stage→合同路由 + 轮次状态 + 降级/升级判断 + 报告渲染调度"，实际审查裁决逻辑仍下沉在 3rd-review 引擎内，wh-review 不重新实现审查算法本身，改动牵连面限定在 `skills/wh-review/` 一个新目录 + 5 个 stage 收尾调用点，符合薄核心。
- [x] **F2 窄契约** — 判据：wh-review↔3rd-review 边界收窄为 `{mode, contract, materials}` → `{verdict, findings, actual_mode}` 单一三元组接口（见 data-contracts.md Contract 1/2），不暴露引擎内部实现细节，调用入口冻结不含 `--checkpoint`。
- [x] **F3 物理事实靠机器校验但不阻断** — 判据：仅 metrics M4 记录（耗时等事后可回溯的质量事实）适用"采集失败只记录不阻断"（spec.md §6.5，FR-WHREVIEW-003 无"采集失败即阻断"表述）；route-decision-{stage}-{review_flow_id}.json、轮次状态文件、最终报告文件（report.md/report-round-*.md）属于 wh-review 主契约的一部分，spec.md 对其落盘有硬性契约与机器验收标准（AC2-2/AC2-3、AC3-1~AC3-4、AC4-2 明确"报告文件缺失则判不通过"），写入失败须按 NFR-2 fail-loud（非零退出），不适用"只记录不阻断"，避免 verdict 判过但关键审计文件缺失。
- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：裁决仍由独立 3rd-review 引擎产出（异源），连续3轮升级人工（Q3 一致），未新增额外的阻断式静态门禁替代审查判断本身。
- [x] **F5 gate 谨慎添加，出事再补，无用则移除** — 判据：本期未新增额外阻断门，仅新增 D2 人工确认门（针对已存在但行为不一致的 pass 后推进规则做统一，非凭空新增），符合隐性必达2"不引入新类别阻断式质量门"。
- [x] **F6 统一外置执行记录** — 判据：审查记录统一写入 `tasks/{task-id}/reports/`、`reviews/route-decision-{stage}-{review_flow_id}.json`、轮次状态文件三处外置文件，metrics 走既有 `metrics/collector.mjs`，不新建独立指标底座（AC-METRICS-1）。
- [x] **F7 推进与不可逆操作不自动越过人** — 判据：D2 门确保 make-decision/build-plan/verify-code 的 pass 结果不自动推进，必须等人工确认（FR-D2-001），符合本条。
- [x] **F8 简单优先** — 判据：报告渲染直接移植复用 3rd-review 仓库已有的 `render-review-report.mjs`（simplicity-guard P1/P2 命中，见下），不重写新渲染逻辑；轮次状态用简单三计数器文件，不引入额外状态机框架。
- [x] **F9 可证伪不假绿** — 判据：AC2-3（未知 stage fail-loud）、AC3 系列（轮次字段非负整数、类型/取值约束可机器 parse）均要求"实际为假时真报失败"，缺数据场景（如 metrics `unknown`）在本 plan 沿用 build-plan 上游同款"标注 unknown 不伪造方向"规则。
- [x] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：本 plan 新增的自动化点（route-decision 记录、轮次状态文件）均直接服务于 spec 明确列出的"审查完成状态不可追踪"根因修复，非为自证机器可校验而堆砌；F10 四问详见下方"F10 Gate 走查"章节。

### 质量原则（Q）

- [x] **Q1 记事实而非阻断** — 判据：metrics 写入失败/质量事实记录失败不代表审查裁决可被降级或跳过（见 data-contracts.md Contract 9 校验规则），推进判断仍由人工基于记录决定。
- [x] **Q2 gate 三类划分** — 判据：D2 人工确认门属于"人工确认类"gate；metrics 属于"记录采集类"，写入失败只记录不阻断；route-decision-{stage}-{review_flow_id}.json/轮次状态文件/最终报告文件属于 wh-review 主契约产物（AC2-2/AC2-3/AC3-1~AC3-4/AC4-2 硬性验收要求），不划入"记录采集类"，写入失败须按 NFR-2 fail-loud，三者不得混淆。
- [x] **Q3 异源审查加人工把关** — 判据：裁决由独立 3rd-review 引擎（异源）产出，连续3轮满足升级条件后转人工把关（escalate_to_human），无自审自判。

### 技能原则（S）

- [x] **S1 能用外部就不造轮子** — 判据：报告渲染逻辑复用 3rd-review 仓库已有的 `scripts/render-review-report.mjs`（已存在实现，见 research.md），5 套合同文本以 agenthub `verifiers/vibecoding` 既有合同为搬迁基础，不从零编写。
- [x] **S2 外部技能可针对项目改造合宪** — 判据：搬迁的 5 套 stage 专属合同按 workflowhub 契约（task-id 参数化、无 `.specify/` 耦合）改造后落入 `skills/wh-review/contracts/`。
- [x] **S3 迭代时保持最新并就地检查** — 判据：Phase 1 迁移合同时须核对 agenthub 源合同是否有更新版本，来源路径写入 wh-review SKILL.md 的注释头（参照 `skills/spec-plan/SKILL.md` 头部"本文件改造自 speckit-plan"的既有写法）。
- [x] **S4 自定义技能必须有指标系统** — 判据：wh-review 通过 `metrics/collector.mjs` 的 `recordSkeleton`/`updateOwnResult` 接入 M4 十核心字段（Phase 3 Step 3.1），不新建独立指标底座。
- [x] **S5 自定义技能方便子代理调用省主上下文** — 判据：wh-review SKILL.md 输入输出契约明确（task-id + stage → verdict/findings 摘要），stage agent 只需读取裁决摘要而非完整审查过程，降低主上下文占用。
- [x] **S6 自定义技能参考市面方案不闭门造车** — 判据：轮次降级/升级机制、报告6章结构、report-index 列结构均参考 agenthub 3rd-review 已验证过的既有实现，非闭门设计。
- [x] **S7 一阶段一技能一工作流一文件夹** — 判据：wh-review 独立成 `skills/wh-review/` 一个文件夹，与 build-plan/build-code 等既有 stage 工作流目录并列，不侵入既有工作流文件夹结构。
- [x] **S8 自定义技能可独立调用可搬运** — 判据：wh-review 的落盘路径解析统一走 `core/task-dir-parser.mjs`，不硬编码任务目录或 3rd-review 本机绝对路径（走 `THIRD_REVIEW_RUNNER`/`THIRD_REVIEW_REPO_ROOT` 环境变量），保证可搬运。

**Constitution Check Result**: 21/21 clauses addressed. 21 pass, 0 fail.

## Project Structure

### Documentation (this feature)

```text
specs/wh-review-rebuild/
├── spec.md              # Build-spec output (authoritative)
├── research.md          # spec-research 输出（背景/调研/风险）
├── data-contracts.md    # 跨边界数据契约
├── plan.md              # 本文件（spec-plan workflow output）
└── tasks.md             # spec-tasks workflow output
```

### Source Code（跨两个仓库，按仓库分组标注）

```text
# 仓库 A：workflowhub（本 worktree，cwd 所在仓库）
skills/wh-review/                              NEW
├── SKILL.md                                   NEW  — 技能定义、输入输出契约、四要素调用协议
├── contracts/
│   ├── intake.md                              NEW  — make-decision 专属，覆盖 C1-C6
│   ├── design.md                              NEW  — build-spec 专属
│   ├── plan.md                                NEW  — build-plan 专属
│   ├── code.md                                NEW  — build-code 专属
│   └── test-acceptance.md                     NEW  — verify-code 专属，覆盖 F1-F6
├── templates/report-template.md               NEW  — 6 章报告结构模板
└── scripts/
    ├── route-decision-writer.mjs              NEW  — 写 route-decision-{stage}-{review_flow_id}.json
    ├── round-state.mjs                        NEW  — 轮次三计数器状态读写 + 降级/升级判定
    └── render-review-report.mjs               NEW（移植自 3rd-review 仓库既有脚本，适配 task-dir 落盘路径）

workflows/build-code/SKILL.md                  MODIFY — §7 改写为纯概念导读，删除 numbered step/if-else
workflows/make-decision/SKILL.md               MODIFY — 收尾统一调用点回归校验 + D2 门接入
workflows/build-spec/SKILL.md                  MODIFY — 收尾统一调用点回归校验（pass 自动推进保留）
workflows/build-plan/SKILL.md                  MODIFY — 收尾统一调用点回归校验 + D2 门接入（本文件自身）
workflows/verify-code/SKILL.md                 MODIFY — 收尾统一调用点回归校验 + D2 门接入 + F1-F6 新鲜性对齐

specs/wh-review-rebuild/test-plan.md           NEW  — D7/FR-TEST-001 端到端测试方案文档
specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs  NEW — T025 配套冒烟测试；build-plan 阶段先落最小占位版（校验 test-plan.md 文档结构），T025 落地时替换为真正跑通 stage 调用链的版本

# 仓库 B：3rd-review（独立仓库，默认与 workflowhub 以兄弟目录形式并列检出于同一父目录下，跨仓库改动，需在该仓库自身分支下提交）
SKILL.md                                       MODIFY — 剥离 stage/轮次知识，仅保留纯引擎接口说明
scripts/run-heterologous-review.mjs            MODIFY — 移除 revise_required 循环包裹逻辑（若存在）
scripts/run-threat-auditor.mjs                 MODIFY — 加固 schema-drift/blocking 语义判断（FR-THIRDREVIEW-004）
（standalone.sh 若存在于该仓库，同步核查并移除 revise 循环）
```

**Structure Decision**：wh-review 独立成一个 `skills/` 目录（S7 一阶段一技能一工作流一文件夹），5 套合同放子目录 `contracts/` 而非散落各 stage 目录，便于 S8"可独立调用可搬运"；3rd-review 侧改动限定在其自身仓库根目录下已有文件，不在 workflowhub 仓库内创建镜像副本，避免双份合同漂移。

**Known Gap（须在 build-code 阶段前二次确认）**：spec.md §2 In-scope 原文写"精简 `skills/3rd-review/SKILL.md`"，但 `skills/3rd-review/` 路径在 workflowhub 仓库内不存在——3rd-review 以独立仓库形式存在（`$THIRD_REVIEW_REPO_ROOT/SKILL.md`）。本 plan 按"该路径是引用约定写法、实际改动落在 3rd-review 独立仓库根目录"处理，若与 build-code 阶段实际理解不一致须提前对齐，不得凭空新建 `skills/3rd-review/` 空壳目录制造双份真相源。

**Known Gap（前置阻塞项，本轮调研新增，build-code 阶段启动前必须先验证并消除，否则整个方案无法运行）**：build-plan 阶段调研发现，spec.md/data-contracts.md 定义的 canonical 调用协议（`node <runner> --diff=<file> --output=<file>` 两个必填 flag、不含 `--checkpoint`/stage 或 round flag、`mode`/`contract`/`materials` 全部随 `--diff` 文件内容以 JSON 形式一并传入）与 3rd-review 独立仓库（`$THIRD_REVIEW_REPO_ROOT`，发现规则见 spec.md FR-THIRDREVIEW-001）`scripts/run-heterologous-review.mjs` 的**当前实际代码**不一致：实际代码仍需要 `--checkpoint` 参数、内部仍硬编码 5-stage 映射（`loadVerifierContext(checkpoint)`）、`--diff` 被当作纯 diff 文本而非结构化 JSON 消费。T015a 已规划此项改造，但该改造本身属于 build-code 阶段（或 3rd-review 瘦身）的实施工作，不在 build-plan 阶段完成，因此存在"计划中假设的协议已就绪、实际尚未就绪"的风险。**前置校验要求**：T010a（`invoke-review-engine.mjs`，装配并调用 canonical 协议）及其后所有依赖 T010a 的联调任务，在开工前必须先对 3rd-review 仓库当前代码跑一次 canonical 协议校验（见 tasks.md T015a 校验行/Phase 2 Verify 表新增检查点）；校验不通过（CLI 仍要求 `--checkpoint` 或未消费 `--diff` 内 JSON）则视为阻塞，不得绕过继续实现 T010a，须先完成 T015a 或升级人工处理。

## Complexity Tracking

无需超出简单方案的额外复杂度决策——报告渲染、合同迁移均走复用路径（S1/S6），轮次状态用平面 JSON 文件而非引入状态机库。

No constitution violations requiring justification.

## Governance Sync Matrix

*本表逐一核对本 plan 触及的 7 类治理面是否需要同步变更；标记 changed 的项必须指向具体 Task ID，未标注 Task ID 视为遗漏。*

| Category | Changed? | Reason | Task ID |
|---|---|---|---|
| Project rules（CLAUDE.md / AGENTS.md） | unchanged | 本次改动不触碰任何全局或子包 CLAUDE.md、AGENTS.md 规则文件 | N/A |
| Workflow definitions（stage SKILL.md / workflow 定义） | changed | 5 个 stage 的 SKILL.md 收尾调用点从直接调用 3rd-review 迁移为调用 wh-review + 接入 D2 门（`docs/human-brief-template.md` 统一调用规矩保留，T023b 回归校验）；`build-code/SKILL.md` §7 改写为纯概念导读 | T016, T019, T020, T021, T022, T023, T023a, T023b |
| Reviewer contract（base-verifier / reviewer prompt / 审查合同） | changed | 新建/迁移 5 套 wh-review stage 专属合同（intake/design/plan/code/test-acceptance）；3rd-review 的 `SKILL.md` 精简为纯引擎接口说明 | T002, T003, T004, T005, T006, T008, T009, T015 |
| Schema（journal event / checkpoint / `*.schema.json`） | unchanged | metrics 接入复用既有 `metrics/collector.mjs` M4 十核心字段映射，未在 `contracts/field-mapping.schema.json`、`facts-subschema.json` 等既有 schema 文件新增字段 | N/A |
| Runtime config（`.claude/settings.json` / 引擎配置） | unchanged | 未新增或修改引擎/运行时配置文件 | N/A |
| Knowledge / doc（`docs/WORKFLOW.md` / `CONSTITUTION.md` / 知识规则） | unchanged | 本次改动不修改 `docs/WORKFLOW.md` 或 `CONSTITUTION.md` 本身，仅在 `specs/wh-review-rebuild/` 目录内新增本 feature 的 spec 产物 | N/A |
| Automation gates / CI / hooks（`.github/workflows` / pre-commit / gate 脚本） | unchanged | 未新增或修改 CI workflow、pre-commit hook 或既有 gate 脚本 | N/A |

## Implementation

> 每个 Phase 按合同要求的六段结构组织：Goal（可检查完成定义）/ Files（精确文件清单）/ Tasks（对应 tasks.md 任务）/ Verify（双列可运行验证：`gate_cmd` 机器判定 + `display_cmd` 人工摘要）/ Knowledge（知识沉淀位置）/ STOP（人工停止点）。`<task-id>` 在实际执行时替换为 `parseTaskDir()` 解析出的真实任务目录名。

### Phase 1: Setup / Foundation

**Goal**（可检查完成定义）：
1. `skills/wh-review/SKILL.md` 存在，文内可 grep 出 5 条 stage→合同映射（AC1-1）。
2. `skills/wh-review/contracts/{intake,design,plan,code,test-acceptance}.md` 5 个文件全部存在且非空（AC2-1）；其中 `intake.md` 显式覆盖 C1-C6 六判据（AC9-1）、`test-acceptance.md` 显式覆盖 F1-F6 六判据（AC10-1）。
3. `route-decision-writer.mjs` 存在且导出可调用函数：已知 stage 调用两阶段写入均 exit 0——第一次写入（准备阶段）落盘 `stage`/`contract_path`/`contract_hash`/`timestamp`/`input_mode`/`review_flow_id`/`total_round` 七字段非空、`review_input_hash` 留空；第二次写入（执行阶段结束后）就地回填 `review_input_hash`，此时八字段全部非空；未知 stage 调用以非零退出码终止（AC1-2, AC2-2, AC2-3）。
4. `route-decision-writer.mjs` 对 `task_id` 参数做路径安全校验：仅允许安全字符集 `^[A-Za-z0-9._-]+$`（不含路径分隔符、不含 `..`），非法 `task_id` 调用以非零退出码终止且不产生任何越界写入，不做静默清洗或截断（AC1-6，round23 新增）。

**Files**：
- `skills/wh-review/SKILL.md`（NEW）
- `skills/wh-review/contracts/intake.md`（NEW）
- `skills/wh-review/contracts/design.md`（NEW）
- `skills/wh-review/contracts/plan.md`（NEW）
- `skills/wh-review/contracts/code.md`（NEW）
- `skills/wh-review/contracts/test-acceptance.md`（NEW）
- `skills/wh-review/scripts/route-decision-writer.mjs`（NEW）
- `skills/wh-review/scripts/__tests__/route-decision-writer.test.mjs`（NEW，vitest，与 `core/__tests__/` 同约定）

**Tasks**：T001（SKILL.md 骨架）、T002-T006（5 套合同迁移）、T007（route-decision-writer.mjs）、T008（intake 深化）、T009（test-acceptance 深化）、T009a（round24 修复：不再要求为 5 套合同追加降级规则段落，改为空操作占位，规则实现移至 T011，FR-WHREVIEW-005）、T009b（design/plan/code 三套合同标注占位状态+记录后续深化 4 项质量抓手验收标准，FR-WHREVIEW-002）。每个脚本任务的 Verify 依据即同名 `__tests__/*.test.mjs`，随实现同步产出，不单独立任务。

**Verify**：

| 检查点 | gate_cmd（机器判定） | display_cmd（人工摘要） |
|---|---|---|
| SKILL.md 5 条 stage 映射存在 | `npx vitest run skills/wh-review/scripts/__tests__/route-decision-writer.test.mjs`（用例内 `import` SKILL.md 映射表解析结果，断言长度 `=== 5`；先在骨架空表版本验证断言失败，再在补全版本验证通过，双向确认非仅检查 0） | `grep -A 10 'stage.*合同映射' skills/wh-review/SKILL.md` |
| 5 套合同非空且覆盖对应判据 | `npx vitest run skills/wh-review/scripts/__tests__/route-decision-writer.test.mjs`（用例断言 5 个合同文件 `fs.statSync(...).size > 0`，并对 intake/test-acceptance 分别断言含 `C1`..`C6`/`F1`..`F6` 六个标记） | `wc -l skills/wh-review/contracts/*.md` |
| route-decision-{stage}-{review_flow_id}.json 八字段两阶段写入 + 未知 stage fail-loud | `npx vitest run skills/wh-review/scripts/__tests__/route-decision-writer.test.mjs`（一组用例断言已知 stage 第一次写入〈准备阶段〉后七字段非空且 `review_input_hash` 为空，第二次写入〈执行阶段结束后〉回填后八字段全部非空；另一组断言未知 stage 调用 `exitCode !== 0`，两组均需通过） | `cat tasks/<task-id>/reviews/route-decision-<stage>-<review_flow_id>.json` |
| task_id 路径安全校验，非法字符 fail-loud（AC1-6，round23 新增） | `npx vitest run skills/wh-review/scripts/__tests__/route-decision-writer.test.mjs`（新增用例：传入含 `../`/`/` 等非法字符的 `task_id`，断言 `exitCode !== 0` 且未在文件系统上产生任何越界写入；传入合法 `task_id` 时正常完成两阶段写入） | `echo $?`（对比合法/非法 `task_id` 两次调用的退出码） |

**Knowledge**：Phase 1 完成后，在 `tasks/<task-id>/artifacts/build-code-phase1-progress.md` 记录已完成 Step、实际文件清单、Verify 执行结果摘要（build-code 阶段落盘；本 plan 仅约定路径与内容项）。

**STOP**：Phase 1 四项 Goal 全部 Verify 通过后方可进入 Phase 2；任一 Verify 失败须留在本 Phase 修复，不得带着失败结果进入下一 Phase。本 Phase 无需人工确认即可自动进入 Phase 2（非 D2 门覆盖范围，D2 门只作用于 stage 级 pass/fail 裁决，见 Phase 2）。

### Phase 2: Core Implementation

**Goal**（可检查完成定义）：
1. `round-state.mjs` 维护 spec.md §6/AC-D10/AC-D10.1/AC-D10.2 定义的完整字段集：`review_flow_id`（本轮修复新增，本次审查流程的稳定唯一 ID，全流程内不变，用于报告/prompt/人工确认/raw verdict/文档快照等跨轮 artifact 命名，避免同 stage 新流程覆盖旧流程历史文件，见 data-contracts.md Contract 4）、`heterologous_round`/`same_source_round`/`total_round`/`mode`/`actual_mode`/`verdict`/`report_path`/`blocking_count`/`fingerprint_repeated`（`post_review_action` 由 T011a 追加）、`stage`（本轮修复新增，写入方标识，恢复读取时须与调用方当前 stage 一致，不一致 fail-loud，见 data-contracts.md Contract 4）、`history`（本轮修复新增，每轮追加快照的历史数组，供轮级升级人工判定读取最近3轮，同 Contract 4）、`finding_fingerprints`（元素须含 `file`/`line`/`category`/`finding_fingerprint` 四个指纹计算相关必需字段，见 Contract 4）/`root_cause_diagnoses`（本轮新增，finding 级指纹连续追踪+根因诊断记录，同 Contract 4），降级/升级规则符合 AC3-1~AC3-6、AC-D10、AC-D10.1、AC-D10.2；`post_review_action` 赋值规则符合 spec.md FR-D2-001（pass 且 stage∈{make-decision,build-plan,verify-code}→`await_human_confirmation`；pass 且 stage∈{build-spec,build-code}→`auto_advance`）。
2. 5 个 stage 的收尾调用点从"直接调用 3rd-review 并可能传 `--checkpoint`"迁移为"调用 wh-review 并传 `stage`+`task_id`"，`route-decision-{stage}-{review_flow_id}.json` 的 `contract_path` 逐一命中各自专属合同（AC-D5, AC-D6, AC8-1~AC8-4，对应 spec.md §8 Business Impact Scope "5 stage 异源审查触发"行）；该迁移不得破坏 5 个 stage 收尾既有的"统一调用 `docs/human-brief-template.md`"规矩（AC7-1, AC7-2 回归保护，T023b）。
3. D2 门在 make-decision/build-plan/verify-code 三个 stage 生效：等待态仅由 `post_review_action=await_human_confirmation` 表达，不落盘任何等待态文件；只有人工显式批准后才写入批准态 artifact `human-confirmation-{stage}-{review_flow_id}-{total_round}.json`（`{review_flow_id}` 本轮修复新增，避免同 stage 新审查流程覆盖旧流程批准态文件；字段仅含 `approved_by`/`approved_at`/`stage`/`review_flow_id`/`total_round`）；orchestrator 重启后只信任该批准态 artifact 是否存在且字段匹配来恢复判断，不因重启而误放行或死锁（AC8-4）。
4. wh-review→3rd-review 主调度执行链完整落地：runner discovery（`THIRD_REVIEW_RUNNER` 环境变量优先；未设置时按 spec.md FR-THIRDREVIEW-001「Runner 发现规则」的约定默认规则自动定位到 3rd-review 仓库的 `scripts/run-heterologous-review.mjs`，不需要额外环境变量兜底；`THIRD_REVIEW_REPO_ROOT` 仅作为定位 3rd-review 仓库根目录的可选 override，未设置本身不构成失败条件；仅当最终解析路径在文件系统上确实不存在时才归入下方"runner 不存在"失败映射，代码中不得写死任何一台机器的绝对路径）、`node <runner> --diff=<file> --output=<file>` 调用格式、timeout/非零退出/结果缺失或不可解析统一映射为 `verdict=escalate_to_human`（NFR-2 例外，wh-review 退出码 0）、原始结果落盘至 `tasks/{task-id}/reviews/verdict-{stage}-{review_flow_id}-round-{total_round}.raw.json`（此前修复：文件名加入 `{stage}` 维度；本轮修复：进一步加入 `{review_flow_id}` 维度，避免同 stage 新审查流程覆盖旧流程证据，权威路径见 spec.md FR-THIRDREVIEW-001"evidence/report 落盘路径规则"；AC5-3, NFR-2）。
5. 3rd-review 精简为纯引擎（AC5-1, AC5-2，含移除 `loadVerifierContext(checkpoint)`/`--checkpoint` CLI flag/checkpoint 历史隔离分支等代码本体改动）、build-code/SKILL.md §7 改写（AC6-1~AC6-4）、revise 循环删除（AC-THIRDREVIEW3-1/3-2）、threatAuditor 加固（AC-THIRDREVIEW4-1/4-2）全部落地。

**Files**：
- `skills/wh-review/scripts/round-state.mjs`（NEW，含 `post_review_action` 字段写入）
- `skills/wh-review/scripts/invoke-review-engine.mjs`（NEW）— wh-review→3rd-review 调度入口：runner discovery、`--diff`/`--output` 调用、失败映射（失败场景下由 wh-review 自行合成 `synthetic:true` 的失败元数据，权威规则见 spec.md FR-THIRDREVIEW-001"失败路径 raw artifact 合成规则"）、`verdict-{stage}-{review_flow_id}-round-{n}.raw.json` 落盘（此前修复：文件名加入 `{stage}` 维度；本轮修复：进一步加入 `{review_flow_id}` 维度，避免同 stage 新审查流程覆盖旧流程证据）
- `skills/wh-review/scripts/human-confirmation.mjs`（NEW）— 只负责批准态 artifact 的写入与读取，不生成等待态文件
- `skills/wh-review/scripts/render-review-report.mjs`（NEW，移植自 3rd-review 仓库既有脚本）
- `skills/wh-review/scripts/snapshot-writer.mjs`（NEW）— 文档类审查对象快照生成与 round(N-1) diff 读取（FR-WHREVIEW-006）
- `skills/wh-review/templates/report-template.md`（NEW）
- `skills/wh-review/scripts/__tests__/round-state.test.mjs`、`__tests__/invoke-review-engine.test.mjs`、`__tests__/human-confirmation.test.mjs`、`__tests__/render-review-report.test.mjs`、`__tests__/snapshot-writer.test.mjs`（NEW，vitest）
- `workflows/make-decision/SKILL.md`（MODIFY — 调用点迁移至 wh-review + D2 门接入）
- `workflows/build-spec/SKILL.md`（MODIFY — 调用点迁移至 wh-review，pass 自动推进保留）
- `workflows/build-plan/SKILL.md`（MODIFY — 调用点迁移至 wh-review + D2 门接入，本文件自身）
- `workflows/build-code/SKILL.md`（MODIFY — 调用点迁移至 wh-review，pass 自动推进保留 + §7 改写）
- `workflows/verify-code/SKILL.md`（MODIFY — 调用点迁移至 wh-review + D2 门接入 + F1-F6 新鲜性对齐）
- `workflows/build-code/__tests__/section7-machine-checkable.test.mjs`（NEW，vitest，把 AC6-1~AC6-4 的机器可检验规则本身操作化为可执行断言，不新造独立检查工具）
- 3rd-review 仓库（跨仓库，路径 `$THIRD_REVIEW_REPO_ROOT/`）：`SKILL.md`（MODIFY）、`scripts/run-heterologous-review.mjs`（MODIFY — 移除 `loadVerifierContext(checkpoint)`/`--checkpoint`/`--round` CLI flag，CLI 收窄为 `--diff`/`--output`）、`scripts/route-review.mjs`（MODIFY — 移除 checkpoint 历史隔离分支）、`scripts/run-threat-auditor.mjs`（MODIFY）、`standalone.sh`（MODIFY — 移除 `--checkpoint=` 解析与透传）、对应 `scripts/*.test.mjs`（沿用该仓库既有 `node scripts/*.test.mjs` 约定，非 vitest）

**Tasks**：T010（round-state.mjs 完整字段集）、T010a（invoke-review-engine.mjs 调度入口，前置阻塞项：开工前须先通过 AC5-1/AC5-2 校验 3rd-review CLI 已改造为 canonical 协议）、T010b（snapshot-writer.mjs 文档快照生成+diff 读取，FR-WHREVIEW-006）、T010c（invoke-review-engine.mjs 扩展读取 `prompt-{review_flow_id}-r{N}.md`，FR-WHREVIEW-007）、T011（降级/升级逻辑并写回 verdict/actual_mode/blocking_count/fingerprint_repeated/report_path/finding_fingerprints/root_cause_diagnoses；round24 修复：同时在本地计算 FR-WHREVIEW-005 的 `severity_decision` 并写回 `finding_fingerprints`，不下放给 3rd-review）、T011a（round-state.mjs 追加 `post_review_action` 字段写入）、T011b（`human-confirmation.mjs` 只写批准态 artifact）、T012-T014（render-review-report.mjs 移植 + report-template.md + report-index.md）、T015（3rd-review SKILL.md 精简）、T015a（3rd-review 调用入口代码本体精简：run-heterologous-review.mjs/route-review.mjs/standalone.sh）、T016（§7 改写 + section7-machine-checkable.test.mjs）、T017（revise 循环删除）、T018（threatAuditor 加固）、T019-T023（5 个 stage 逐一迁移调用点，见 tasks.md 明细）、T023a（orchestrator 重启恢复判断，只信任批准态 artifact）、T023b（回归校验 5 stage 仍统一调用 `docs/human-brief-template.md`，AC7-1/AC7-2；round19 修复：新增行为级验证，实际触发各 stage 收尾流程并校验产出 artifact 结构，AC-D6）、T023c（5 stage 收尾统一新增审查提示词生成子代理派生步骤，FR-WHREVIEW-007）。

**Verify**：

| 检查点 | gate_cmd（机器判定） | display_cmd（人工摘要） |
|---|---|---|
| round-state 完整字段集（§6/AC-D10/AC-D10.1/AC-D10.2） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs` | `review_flow_id=$(jq -r .review_flow_id tasks/<task-id>/reviews/active-flow-<stage>.json); jq '.review_flow_id,.heterologous_round,.same_source_round,.total_round,.mode,.actual_mode,.verdict,.report_path,.blocking_count,.fingerprint_repeated,.stage,.history' tasks/<task-id>/reviews/round-state-<stage>-${review_flow_id}.json`（round21 修复：路径已按 stage+review_flow_id 隔离；round22 修复：`review_flow_id` 未知时改为读取 data-contracts.md Contract 4 附属"活跃审查流程指针文件"`active-flow-<stage>.json` 取得，不再用 mtime 通配排序作为默认发现路径，mtime 仅作该指针文件丢失/损坏时的人工兜底排障手段） |
| round-state history 追加不覆盖 + stage 自校验（AC3-5/AC-D10.2，本轮新增） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs`（断言连续多轮后 `history` 数组长度随轮次单调递增；断言 `stage` 与调用方当前 stage 不一致时 fail-loud 非零退出） | `jq '.history | length' tasks/<task-id>/reviews/round-state-<stage>-<review_flow_id>.json`（发现规则同上行） |
| `post_review_action` 赋值规则（AC8-1, AC8-2） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs`（用例分别覆盖 pass+{make-decision,build-plan,verify-code}→`await_human_confirmation` 与 pass+{build-spec,build-code}→`auto_advance` 两组断言） | `jq -r '.post_review_action' tasks/<task-id>/reviews/round-state-<stage>-<review_flow_id>.json`（发现规则同上行） |
| finding 级指纹追踪 + 根因诊断改判（AC3-6，本轮新增） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs` | `jq '.finding_fingerprints,.root_cause_diagnoses' tasks/<task-id>/reviews/round-state-<stage>-<review_flow_id>.json`（发现规则同上行） |
| round2+ 新发现降级规则（AC-DOWNGRADE-1~5，round23 新增 AC-DOWNGRADE-5 验证判定基线改为历史 `finding_fingerprints` 全集而非仅上一轮，覆盖"重新开放的历史发现"场景；round24 修复：AC-DOWNGRADE-1 验证对象由"5 套合同含判据关键词"改为"round-state.mjs 含判定基线/降级判据/三类例外/重新开放处理逻辑"，判定主体由 3rd-review 合同改为 wh-review 本地计算） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs` | `review_flow_id=$(jq -r .review_flow_id tasks/<task-id>/reviews/active-flow-<stage>.json); jq '.finding_fingerprints[] \| {finding_fingerprint, severity_decision}' tasks/<task-id>/reviews/round-state-<stage>-${review_flow_id}.json`（round21 修复：round-state 路径已按 stage+review_flow_id 隔离；round22 修复：`review_flow_id` 改为读取 data-contracts.md Contract 4 附属"活跃审查流程指针文件"`active-flow-<stage>.json` 取得，不再用 mtime 通配排序作为默认发现路径；round24 修复：`severity_decision` 由 wh-review 本地写入 round-state 文件的 `finding_fingerprints` 数组，不再从 3rd-review 原始 verdict-*.raw.json 读取） |
| active-flow 并发约束（round24 新增，data-contracts.md Contract 4 附属"活跃审查流程指针文件"并发约束/prepare 判断顺序） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs`（覆盖：既有流程 `verdict` 未到达终态时 prepare 默认复用既有 `review_flow_id` 不覆盖指针；既有流程已到达 `pass`/`escalate_to_human` 终态时可分配新值；未显式传入"强制开新流"标志时对进行中流程尝试覆盖须 fail-loud 非零退出） | `jq -r .review_flow_id tasks/<task-id>/reviews/active-flow-<stage>.json`（前后两次 prepare 调用对比：进行中流程场景下该值应保持不变） |
| 文档快照 diff 机制（AC-SNAPSHOT-1~4，本轮新增） | `npx vitest run skills/wh-review/scripts/__tests__/snapshot-writer.test.mjs` | `ls tasks/<task-id>/reviews/snapshots/` |
| 审查提示词生成子代理机制（AC-PROMPT-1~7，round16 新增 AC-PROMPT-5 验证两段式调用消除 review_flow_id/total_round 循环依赖；round23 修复：该机制定位由"materials 唯一来源"收紧为"补充上下文"，`materials` 本体改由 wh-review 自身按 Contract 10 生成，见 T010c/T023c） | `npx vitest run skills/wh-review/scripts/__tests__/invoke-review-engine.test.mjs` | `cat tasks/<task-id>/reviews/prompt-<review_flow_id>-r<n>.md` |
| pass 分支在 D2 门 stage 不绕过人工确认（AC8-3，辅证 AC8-1） | `npx vitest run skills/wh-review/scripts/__tests__/human-confirmation.test.mjs`（复用/扩展 AC8-4 同一测试文件新增用例：构造 verdict=pass 且 `post_review_action=await_human_confirmation`、且 `human-confirmation-{stage}-{review_flow_id}-{total_round}.json` 尚未生成的场景，断言 T023a 消费的推进判断函数返回"停在确认门/不推进"而非因 verdict=pass 直接放行——校验实际控制流是否经过批准态 artifact 存在性判断，而非搜索特定字符串字面量） | `ls tasks/<task-id>/reviews/human-confirmation-*.json 2>/dev/null \|\| echo NOT_APPROVED_STILL_GATED` |
| human-confirmation 只写批准态 artifact（FR-D2-001） | `npx vitest run skills/wh-review/scripts/__tests__/human-confirmation.test.mjs`（用例断言未批准前不生成任何 `human-confirmation-*.json`，仅在显式批准调用后生成，且字段仅含 `approved_by`/`approved_at`/`stage`/`review_flow_id`/`total_round`） | `jq '.approved_by,.approved_at,.stage,.review_flow_id,.total_round' tasks/<task-id>/reviews/human-confirmation-*.json` |
| orchestrator 重启恢复（AC8-4） | `npx vitest run skills/wh-review/scripts/__tests__/human-confirmation.test.mjs`（用例覆盖批准态 artifact 不存在→模拟重启后仍返回"停在确认门"、artifact 存在且 stage/review_flow_id/total_round 匹配→模拟重启后返回"恢复推进"两组断言） | 人工核对 `round-state-<stage>-<review_flow_id>.json`（`review_flow_id` 未知时先读取 `active-flow-<stage>.json` 指针文件取得，见 data-contracts.md Contract 4 附属"活跃审查流程指针文件"；round22 修复：不再用 mtime 通配排序作为默认发现路径，mtime 仅作该指针文件丢失/损坏时的人工兜底排障手段）的 `post_review_action` 字段与对应批准态 `human-confirmation-*.json` 是否存在 |
| 5 stage 调用迁移命中专属合同 | `npx vitest run skills/wh-review/scripts/__tests__/route-decision-writer.test.mjs`（对 5 个 stage 逐一断言 `contract_path` 指向对应专属合同文件，而非通用合同回退路径，5 组断言全部通过） | `jq -r '.contract_path' tasks/<task-id>/reviews/route-decision-<stage>-<review_flow_id>.json`（round19 修复：`route-decision-{stage}-{review_flow_id}.json` 路径按 stage+review_flow_id 隔离，不再是单文件覆盖写；仍建议在对应 stage 触发调用后立即人工核对，因 `review_flow_id` 为运行时动态生成值，无法预先拼出完整文件名一次性遍历） |
| 5 stage 收尾真实生成 human-brief 产物（AC-D6 行为验证）+ 仍统一调用 human-brief-template（AC7-1, AC7-2 回归保护, T023b） | `npx vitest run workflows/__tests__/human-brief-behavioral.test.mjs`（round19 修复，NEW：对 5 个 stage 逐一实际触发其收尾流程，捕获生成的 human-brief 产物文本，断言：①七要素对应信息点均实际出现，非空洞占位；②决策 gate 类 stage〈make-decision/build-plan/verify-code〉产出含"请确认"三选项结尾，自动放行类 stage〈build-spec/build-code〉产出含"自动进入下一阶段"结尾；③不含内部产物名/字段名字面量〈如 spec.md、escalate_to_human〉；5 个 stage 全部通过方为合格，任一 stage 收尾流程被绕过或走死分支导致未真实生成合规产物即判不通过，不因 SKILL.md 内引用字符串仍在而放行） | `for f in workflows/make-decision/SKILL.md workflows/build-spec/SKILL.md workflows/build-plan/SKILL.md workflows/build-code/SKILL.md workflows/verify-code/SKILL.md; do grep -q "docs/human-brief-template.md" "$f" \|\| echo "MISSING:$f"; done`（辅证：引用字符串仍在，仅作人工摘要参考，非机器判定唯一依据） |
| runner discovery + 调用格式（AC5-3, T010a） | `npx vitest run skills/wh-review/scripts/__tests__/invoke-review-engine.test.mjs`（覆盖 `THIRD_REVIEW_RUNNER` 设置/未设置×`THIRD_REVIEW_REPO_ROOT` 设置/未设置四组断言，均断言调用参数为 `--diff=<file> --output=<file>` 且不含 `--checkpoint`；`THIRD_REVIEW_RUNNER` 未设置时（不论 `THIRD_REVIEW_REPO_ROOT` 是否设置）均按约定默认规则自动定位到 `run-heterologous-review.mjs`，不归入"runner 不存在"failure mapping，仅当最终解析路径在文件系统上确实不存在时才归入该失败映射） | `grep -En "THIRD_REVIEW_RUNNER\|THIRD_REVIEW_REPO_ROOT" skills/wh-review/scripts/invoke-review-engine.mjs`（断言两个环境变量名均出现，且不出现任何 `/Users/`/`/home/` 绝对路径字面量） |
| 3rd-review 失败映射→escalate_to_human（NFR-2 例外；超时分支同时锁定 AC5-5，本轮新增，回归 round30 卡死根因） | `npx vitest run skills/wh-review/scripts/__tests__/invoke-review-engine.test.mjs`（分别模拟 runner 不存在/非零退出/超时/`--output` 缺失四种场景，断言均返回 `verdict=escalate_to_human` 且进程退出码为 0；超时场景须用"调用后挂起不返回"的 stub runner 驱动，断言子进程被实际终止、`failure_reason=timeout`，见 spec.md AC5-5） | `review_flow_id=$(jq -r .review_flow_id tasks/<task-id>/reviews/active-flow-<stage>.json); jq -r '.verdict,.failure_reason' tasks/<task-id>/reviews/verdict-<stage>-${review_flow_id}-round-1.raw.json`（此前修复：文件名加入 `{review_flow_id}` 维度；round21 修复：round-state 路径已按 stage+review_flow_id 隔离；round22 修复：`review_flow_id` 改为读取 data-contracts.md Contract 4 附属"活跃审查流程指针文件"`active-flow-<stage>.json` 取得，不再用 mtime 通配排序作为默认发现路径；失败场景下该文件由 wh-review 自行合成、含 `synthetic:true`，非引擎真实产出，但与正常场景共用同一落盘路径与字段结构，见 FR-THIRDREVIEW-001） |
| verdict-{stage}-{review_flow_id}-round-{n}.raw.json 落盘（此前修复：文件名加入 stage 维度；本轮修复：加入 review_flow_id 维度） | `npx vitest run skills/wh-review/scripts/__tests__/invoke-review-engine.test.mjs` | `review_flow_id=$(jq -r .review_flow_id tasks/<task-id>/reviews/active-flow-<stage>.json); ls tasks/<task-id>/reviews/verdict-*-${review_flow_id}-round-*.raw.json`（round21 修复：round-state 路径已按 stage+review_flow_id 隔离；round22 修复：`review_flow_id` 改为读取 data-contracts.md Contract 4 附属"活跃审查流程指针文件"`active-flow-<stage>.json` 取得，不再用 mtime 通配排序作为默认发现路径） |
| 3rd-review 精简为纯引擎（AC5-1, AC5-2） | `node $THIRD_REVIEW_REPO_ROOT/scripts/run-heterologous-review.test.mjs`（新增 CLI 契约用例，沿用该仓库既有 `node scripts/*.test.mjs` 测试约定：①仅以 `--diff=<file> --output=<file>` 调用 runner，断言退出码 0 且产出 verdict；②额外附加 `--stage=build-spec --round=2 --checkpoint=build-spec` 调用，断言必须触发非零退出+明确报错，不允许这些多余参数被静默忽略后继续执行——"忽略后不改变审查结果"不再是可接受的通过分支，唯一通过条件是显式报错）配合精确 flag 定义 grep：`grep -nE "\\.option\\(['\"](diff\|output\|stage\|round\|checkpoint)['\"]|['\"]--?(diff\|output\|stage\|round\|checkpoint)['\"]" $THIRD_REVIEW_REPO_ROOT/scripts/run-heterologous-review.mjs $THIRD_REVIEW_REPO_ROOT/scripts/route-review.mjs $(test -f $THIRD_REVIEW_REPO_ROOT/standalone.sh && echo $THIRD_REVIEW_REPO_ROOT/standalone.sh)`（canonical runner `run-heterologous-review.mjs` 与路由脚本 `route-review.mjs`（见 T015a/Files 清单，MODIFY — 移除 checkpoint 历史隔离分支）恒为必检文件；`standalone.sh` 仅当其存在时才纳入检测，若已按 FR-THIRDREVIEW-003 合法废弃删除则自动从文件列表跳过，不因其缺失误判本检查点失败；直接定位实际的 `yargs`/`process.argv` flag 解析定义代码行，断言命中的 flag 名集合恰为 `{diff, output}`；不再对 SKILL.md 文本做"排除说明性整行后再模糊搜索概念词"式检测——该方案按整行匹配排除，真实违规代码行只要与说明性词凑巧同行即会被一并放过，见 round7 审查发现） | `node $THIRD_REVIEW_REPO_ROOT/scripts/run-heterologous-review.mjs --diff=<file> --output=<file> --stage=build-spec --round=2 2>&1`（人工核对进程是否以非零退出码结束且报错信息在输出中直观可见；若命令静默返回 0 并继续产出 verdict，判定本检查点不通过） |
| 3rd-review 调用入口代码精简（AC5-1~AC5-3, T015a） | `grep -Ecn "checkpoint|--round" $THIRD_REVIEW_REPO_ROOT/scripts/run-heterologous-review.mjs $THIRD_REVIEW_REPO_ROOT/scripts/route-review.mjs $(test -f $THIRD_REVIEW_REPO_ROOT/standalone.sh && echo $THIRD_REVIEW_REPO_ROOT/standalone.sh)`（精简前验证命中 `>0`，精简后验证命中 `0`；canonical runner `run-heterologous-review.mjs`/`route-review.mjs` 恒为必检文件，`standalone.sh` 若已合法废弃删除则自动跳过、不参与判定） | `grep -En "diff=|output=" $(test -f $THIRD_REVIEW_REPO_ROOT/standalone.sh && echo $THIRD_REVIEW_REPO_ROOT/standalone.sh || echo $THIRD_REVIEW_REPO_ROOT/scripts/run-heterologous-review.mjs)` |
| §7 机器可检验规则（AC6-1~AC6-4） | `npx vitest run workflows/build-code/__tests__/section7-machine-checkable.test.mjs`（直接把 spec.md AC6 的 4 条检测规则实现为断言，不新造独立工具） | `sed -n '/^## 7\./,/^## 8\./p' workflows/build-code/SKILL.md` |
| revise 循环删除（AC-THIRDREVIEW3-1/3-2） | `node $THIRD_REVIEW_REPO_ROOT/scripts/run-heterologous-review.test.mjs`（沿用该仓库既有测试约定） | `grep -En "while.*revise_required|for.*revise_required" $THIRD_REVIEW_REPO_ROOT/scripts/run-heterologous-review.mjs` |
| threatAuditor 语义防误判（AC-THIRDREVIEW4-1/4-2） | `run-threat-auditor.test.mjs` 在 3rd-review 仓库不存在，改用真实 CLI 契约 `--spec/--auditor/--output`（详见 tasks.md AC-THIRDREVIEW4 系列行）对 T018 新增夹具 `__fixtures__/semantic-compliant-with-keyword.md`/`__fixtures__/semantic-violation-no-keyword.md` 各跑一次，双向断言：加固后前者 0 条 blocking、后者 ≥1 条命中，两者同时成立才算通过 | `cat /tmp/ta-compliant.json /tmp/ta-violation.json` |

**Knowledge**：Phase 2 完成后，在 `tasks/<task-id>/artifacts/build-code-phase2-progress.md` 记录 5 个 stage 迁移逐一结果、D2 门 Verify 结果、3rd-review 跨仓库改动的 commit 引用（build-code 阶段落盘）。

**STOP**（不可逆推进点，呼应宪法 F7）：D2 门覆盖的三个 stage（make-decision/build-plan/verify-code）在 human-confirmation artifact 生成前必须停在人工确认门，不得因实现者"判断这轮没问题"而绕过；Phase 2 全部 Verify 通过后，须等待人工确认再进入 Phase 3，不自动跳转。

### Phase 3: Polish / Verification

**Goal**（可检查完成定义）：
1. wh-review 轮次/耗时/升级信息接入既有 `metrics/collector.mjs`，`AC-METRICS-1/2` 可查（不新建指标底座）。
2. `specs/wh-review-rebuild/test-plan.md` 存在且含至少 1 个可在 workflowhub 本地跑通的端到端冒烟用例；未被该冒烟用例直接覆盖的 stage，在调用迁移后仍可正常调用、不因接口变更报错或阻塞。
3. Scope Boundary 核查确认未越界（§9 不做清单），覆盖 workflowhub 与 3rd-review 两个独立仓库各自的 diff；F10 走查有明确结论。

**Files**：
- `skills/wh-review/scripts/round-state.mjs`（同 Phase 2 文件，追加 metrics 上报调用）
- `specs/wh-review-rebuild/test-plan.md`（NEW）
- `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs`（NEW，T025 配套，Phase 3 checkpoint 直接引用）
- `skills/wh-review/scripts/__tests__/stage-invocation-chain.test.mjs`（NEW，T025a 专属，实际触发 invoke-review-engine.mjs 走完调用链，不复用 route-decision-writer.test.mjs 的合同映射断言）

**Tasks**：T024（metrics 接入）、T025（test-plan.md 编写）、T025a（未被冒烟直接覆盖的 stage 收尾调用链本身不因迁移报错的独立集成验证，见 stage-invocation-chain.test.mjs）、T026（Scope Boundary 核查）、T027（F10 走查归档）。

**Verify**：

| 检查点 | gate_cmd（机器判定） | display_cmd（人工摘要） |
|---|---|---|
| metrics 接入（AC-METRICS-1, AC-METRICS-2） | `npx vitest run skills/wh-review/scripts/__tests__/round-state.test.mjs`（断言 `recordSkeleton`/`updateOwnResult` 被调用且字段映射正确：`total_round→rework_rounds`、耗时→`duration_ms`、`escalate_to_human→human_intervention`） | `cat metrics/<task-id>/skeleton.json`（实际落盘路径以 `metrics/collector.mjs` 为准） |
| test-plan.md 至少 1 个端到端冒烟用例 | `npx vitest run specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs`（T025 落地前为 build-plan 阶段已建的最小占位版，校验 test-plan.md 存在且含 `## 冒烟用例`/`## 未覆盖 stage` 两个必需小节；T025 落地 T010-T023 后须扩写为实际跑一次 stage 调用链、断言 exitCode===0 的版本，不得保留占位版本充数） | `cat specs/wh-review-rebuild/test-plan.md` |
| 未覆盖 stage 不因迁移报错 | `npx vitest run skills/wh-review/scripts/__tests__/stage-invocation-chain.test.mjs`（不复用 route-decision-writer.test.mjs——后者只测合同映射/文件写入、测不到调用链本身；本测试对未被冒烟直接跑到的 stage，逐一实际触发其收尾入口 invoke-review-engine.mjs 发起对 wh-review/3rd-review 的真实调用，断言 `exitCode === 0` 且落盘 route-decision-{stage}-{review_flow_id}.json/verdict-*-round-*.raw.json，覆盖调用链本身，不因迁移而报错阻塞） | `grep -A3 "未覆盖 stage" specs/wh-review-rebuild/test-plan.md` |
| Scope Boundary 无越界 | 见下方 Scope Boundary 校验脚本（断言无输出） | `git diff --stat` |
| F10 走查有明确结论 | `grep -c 'F10 门控结论' specs/wh-review-rebuild/plan.md`（断言 `≥1`） | `cat tasks/wh-review-rebuild/artifacts/build-plan-f10-gate.md` |

Scope Boundary 校验脚本（build-code 阶段实际执行；覆盖 workflowhub 与 3rd-review 两个独立仓库各自的 diff，均断言无输出方为通过，工作区未提交改动与各自 HEAD 相比）：

```bash
# 仓库 A：workflowhub（当前仓库）
git diff --name-only | grep -vE '^(skills/wh-review/|workflows/(make-decision|build-spec|build-plan|build-code|verify-code)/SKILL.md$|workflows/build-code/__tests__/section7-machine-checkable.test.mjs$|specs/wh-review-rebuild/)'
# 仓库 B：3rd-review（独立仓库；THIRD_REVIEW_REPO_ROOT 为可选 override，与 T010a/invoke-review-engine.mjs 的运行时 discovery 契约一致：设置时优先使用其值，未设置时按 spec.md FR-THIRDREVIEW-001「3rd-review 仓库根目录发现规则」的兄弟目录约定自动发现——取 workflowhub 仓库根目录的上一级目录下的 3rd-review 子目录，不强制要求显式设置，仅当默认发现路径最终在文件系统上也不存在时才报错）
THIRD_REVIEW_REPO_ROOT="${THIRD_REVIEW_REPO_ROOT:-$(cd "$(git rev-parse --show-toplevel)/.." && pwd)/3rd-review}"
[ -d "$THIRD_REVIEW_REPO_ROOT" ] || { echo "3rd-review 仓库根目录不存在：$THIRD_REVIEW_REPO_ROOT（THIRD_REVIEW_REPO_ROOT 未设置时按兄弟目录约定发现失败，可显式设置该环境变量指向实际仓库位置）"; exit 1; }
git -C "$THIRD_REVIEW_REPO_ROOT" diff --name-only | grep -vE '^(SKILL\.md|scripts/(run-heterologous-review|route-review|run-threat-auditor)\.(mjs|test\.mjs)|standalone\.sh|scripts/standalone\.test\.sh|__fixtures__/(semantic-compliant-with-keyword|semantic-violation-no-keyword)\.md)$'
```

**Knowledge**：Phase 3 完成后，在 `tasks/<task-id>/artifacts/build-code-phase3-progress.md` 汇总三个 Phase 的 Verify 结果、最终 diff 范围核对结论（build-code 阶段落盘），并更新本 plan.md 的 M10 Baseline 对照表（build-code/verify-code 阶段的实际值，替换 build-plan 阶段的 `unknown` 占位）。

**STOP**：Phase 3 全部 Verify 通过后，build-code 阶段视为完成，交由 verify-code 阶段的独立异源审查产出裁决，不由实现者自行宣布"任务完成"；D2 门在 verify-code stage 同样生效（见 Phase 2 STOP）。

## F10 Anti-Over-Engineering Gate 走查

对 plan.md/tasks.md 中出现的每个新机制/脚本/gate（route-decision-{stage}-{review_flow_id}.json、round-state.mjs、report-index.md、D2 人工确认门、render-review-report.mjs、metrics 接入、5 stage 收尾统一回归校验、`human-confirmation.mjs`，共 8 项）逐一回答 F10 四问（①防什么真实威胁 ②有无现成机制覆盖 ③能否被绕过成摆设 ④长期维护成本）。

完整走查过程与四问明细见 `tasks/wh-review-rebuild/artifacts/build-plan-f10-gate.md`。

**F10 门控结论（build-plan 阶段）**：8 项走查对象全部通过四问检验（Q1 均有具体威胁、Q2 中多项为迁移复用/接入既有底座非重复建设、Q3 风险项均有机器可查 AC 兜底、Q4 均为低/中等无"高且持续"项），**无需从 plan.md/tasks.md 删除任何机制**，与 build-spec 阶段 F10 走查结论一致。route-decision-{stage}-{review_flow_id}.json 合同映射表可配置化建议（F10-W1，承自 build-spec 阶段）继续沿用供 build-code 参考，不阻断推进。本轮为响应 plan-reviewer 审查意见新增 `human-confirmation.mjs` 机制、拆分 D2/5-stage 迁移任务粒度，属于 plan.md/tasks.md 任务内容的实质性补全（非删减），已在本文件"Governance Sync Matrix"章节同步标注对应 Task ID；是否需重跑 Step 2-4（spec-plan/spec-tasks/spec-analyze）的判断见 `tasks/wh-review-rebuild/artifacts/build-plan-cross-artifact-analysis.md` 的相应复核记录。

## M10 Baseline 对照（build-plan 阶段）

| Metric | M12 Actual（build-plan 阶段） | M10 Baseline | Delta | 说明 |
|---|---|---|---|---|
| missed_step_rate | unknown | 0.05 | unknown | 全流程尚未执行到 build-code/verify-code，无 stage_enter/exit journal 事件流可推导 |
| test_execution_rate | unknown | 0.8295 | unknown | 测试执行记录（rowKind=test）需在 verify-code 阶段产生，build-plan 阶段仅完成测试方案设计（test-plan.md），尚未执行 |
| review_execution_rate | unknown | 1 | unknown | 3rd-review 独立审查（plan-reviewer/verdict）尚未在本阶段完成，无 rowKind=review 记录 |
| rework_rounds | unknown | 6.075 | unknown | build-plan 阶段是否发生返工需等 plan-reviewer + human review checkpoint（Step 8/9）结果落定后才能计入，当前尚在走查阶段，核心字段未定案 |
| rework_proxy_count | unknown | 25.25 | unknown | 需跨 journal + reviews.jsonl blocking 计数汇总，当前阶段无完整 journal 事件流 |

**unknown 原因汇总**：wh-review-rebuild 任务在 build-plan 阶段尚未走完 plan-reviewer（Step 8）与 human review checkpoint（Step 9），5 项指标均依赖后续步骤或 verify-code 阶段才能产出真实数据，本阶段如实记录为 unknown，不使用 `0` 或 `-` 占位（F9 诚实记录）。

**数据局限性**：M10 baseline 来自 archived AgentHub M1-M3 quasi-experiment，跨系统（AgentHub→workflowhub）数据无法直接映射，仅作粗略参考线，非受控测量，不阻断推进（F3/Q1）。

## Verification Mapping

| Step | Maps to FRs | Verified by AC |
|---|---|---|
| Step 1.1 wh-review SKILL.md 骨架 | FR-WHREVIEW-001 | AC1 系列（落盘路径解析、task-id 来源契约、AC1-6 task_id 路径安全约束） |
| Step 1.2 迁移 5 套合同 | FR-WHREVIEW-002 | AC2-1 |
| Step 1.3 route-decision-writer.mjs | FR-WHREVIEW-002 | AC2-2, AC2-3, AC1-6（task_id 路径安全校验实现） |
| Step 1.4 intake/test-acceptance 合同深化 | FR-INTAKE-001, FR-TESTACCEPTANCE-001 | AC9-1, AC9-2（对应 C1-C6 判据）/ AC10-1, AC10-2（对应 F1-F6 判据） |
| Step 2.1 round-state.mjs | FR-WHREVIEW-003 | AC3-1, AC3-2, AC3-3, AC3-4, AC3-5 |
| Step 2.2 render-review-report.mjs + report-index | FR-WHREVIEW-004 | AC4 系列（报告命名规则、索引追加） |
| Step 2.3 精简 3rd-review SKILL.md | FR-THIRDREVIEW-001 | AC5-1, AC5-2 |
| Step 2.4 §7 改写 | FR-THIRDREVIEW-002 | AC6-1, AC6-2, AC6-3, AC6-4（机器可检验规则） |
| Step 2.5 删除 revise 循环 | FR-THIRDREVIEW-003 | AC-THIRDREVIEW3-1, AC-THIRDREVIEW3-2 |
| Step 2.6 threatAuditor 加固 | FR-THIRDREVIEW-004 | AC-THIRDREVIEW4 系列 |
| Step 2.7 5 stage 收尾统一 + D2 门 | FR-STAGE-001, FR-D2-001 | AC8-1, AC8-2, AC8-3, AC8-4, AC-D5, AC-D6, AC7-1, AC7-2（T023b 回归保护） |
| Step 3.1 metrics 接入 | spec.md §6.5 | AC-METRICS-1, AC-METRICS-2 |
| Step 3.2 端到端测试方案 | FR-TEST-001 | FR-TEST-001 验收标准 |
| Step 3.3 Scope Boundary 核查 | spec.md §9 | 隐性必达1/2/3 |
| Step 3.4 F10 走查 | 宪法 F10 | 本文件"F10 Anti-Over-Engineering Gate 走查"章节 |
