# Implementation Plan: M4 指标底座（workflowhub metrics foundation）

**Feature**: m4-metrics-foundation
**Spec**: [spec.md](./spec.md)（已过 design-review，0 blocking）
**需求权威源**: tasks/m4-metrics-foundation/artifacts/decision-log.md（D1-D18）
**代码落点**: `/Users/Hugh/Hugh/Project/workflowhub`（独立仓，M1-M3 已在此；不改 agenthub）

## Technical Context

- **语言/运行时**：Node.js ES Module（`.mjs`），与 workflowhub M1-M3 现有约定一致；无 TypeScript、无包封装（直接文件引用）。
- **测试框架**：Vitest 2.1.9，`passWithNoTests: false`（防假绿）；单元测试落 `core/__tests__/*.test.mjs`，集成测试落 `tests/*.test.mjs`。
- **存储形态**：JSON Lines（jsonl）用于指标双写记录；JSON 用于 schema 契约文件（沿用 `contracts/` 的自定义契约结构，非 JSON Schema，无 AJV 依赖——与 M1-M3 的 `validate-contract.mjs` 手写校验风格一致）。
- **配置**：`config/workflowhub.yaml` 的 `ALLOWED_KEYS` 白名单已含 `metrics_path` 占位槽，M4 直接填值启用，**不改 `load-config.mjs`**。
- **CI**：单 job，`npm run check` → `scripts/run-checks.mjs` 聚合；M4 的结构校验 + 聚合冒烟挂入此聚合入口，不新增 job。
- **校验脚本模板**：`scripts/check-contract.mjs`（读 JSON 逐条校验、exit 0/1）是 schema 校验脚本模板；`scripts/run-checks.mjs`（spawnSync 顺序调 checker + 汇总）是聚合冒烟模板。

## Constitution Check（含 CLAUDE.md 工程硬规则逐条）

- [x] **铁律1 不引入需求外概念**：每个新增模块/schema/字段都映射到 decision-log D1-D18（见下方文件结构逐项标注 FR/决策来源）。无需求外抽象。
- [x] **铁律2 动手前列假设**：实现假设已列入 spec §10 未决问题（用量源择一/执行标识生成方式/卡点触发点/告警形态），plan 逐 phase 落为 task。
- [x] **铁律3 每行变更可追溯**：每个 phase task 引 FR 编号，每个 FR 回 decision-log。
- [x] **只记不挡铁律**：所有指标/卡点/版本字段不作 binding gate（FR-GUARD-001 / AC9）；本 plan 不向 workflowhub 引擎注入任何拦截门。
- [x] **代码落 workflowhub 不碰 agenthub**：所有新增文件落 `/Users/Hugh/Hugh/Project/workflowhub`；agenthub 6 个 forbidden 文件不涉及；multica-agenthub 高风险目录不涉及。
- [x] **No-Duplication**：采集核心解耦宿主（FR-COLLECT-005），不在多处复制采集逻辑。
- [x] **注释英文**：workflowhub 代码注释英文（沿用现有约定）。

## 最简方案判断（KISS Ladder）

逐层走，停在第一个能解决问题的层级：

1. **这东西需要存在吗**：M4 六类产出物（采集核心/执行记录 schema/卡点卡片 schema/版本规则/基线字段/CI）逐条对应 D1-D18 已批准决策，无"为以后"的脚手架。卡点卡片的"其他兜底类"是诚实兜底非过度设计。✓
2. **已有能力能否覆盖**：jsonl 原子追加用 Node `fs.appendFileSync`（O_APPEND 原子性），不引第三方写库；schema 校验用手写逐条（沿用 `validate-contract.mjs` 风格），**不引 AJV**（M1-M3 没用，保持一致）。✓
3. **已有模块能否复用**：`config/workflowhub.yaml` 的 `metrics_path` 占位槽复用（不改 load-config）；CI 复用现有 `run-checks.mjs` 聚合入口（不新增 job）；校验脚本复用 `check-contract.mjs` 模板风格。✓
4. **最小新增**：只新增 `core/metrics/`（采集核心 + 适配层）、`contracts/` 两个契约 JSON、`scripts/` 一个校验脚本 + 一个聚合扩展、一份版本规则文档、一份基线字段定义。无多余文件。

**三铁律自查**：删优于增——基线原 5 项指标是派生项不单独采集（FR-BASELINE-001）；统一执行记录不重复存明细只索引串联（FR-EXECREC-002）。每个新增概念都映射 decision-log。资深工程师不会觉得过度设计。

## 项目文件结构（覆盖 spec §11 业务影响每项）

> 所有路径相对 `/Users/Hugh/Hugh/Project/workflowhub`。新增为主，零修改既有实现。

```text
core/metrics/
├── collector.mjs          # 采集核心:三时机一行三段更新 + 双写 (FR-COLLECT-001~008, D2/D4/D5/D7)
├── record-schema.mjs      # 执行记录运行时结构 + 手写校验 (FR-COLLECT-002, D2)
├── execution-record.mjs   # 统一执行记录组装:六类键串联 (FR-EXECREC-001~005, D9/D18)
├── knowledge-card.mjs     # 卡点知识卡片:枚举校验 (FR-FEEDBACK-001~004, D11)
├── baseline.mjs           # 基线字段定义 + 从历史归档聚合 + gap 标记 (FR-BASELINE-001/002, D12)
└── adapters/
    └── host-adapter.mjs   # 宿主适配层:翻译宿主时机→采集核心三时机调用 (FR-COLLECT-005, D6)

contracts/
├── execution-record.contract.json   # 执行记录 + 统一记录 schema (沿用自定义契约结构)
└── knowledge-card.contract.json      # 卡点卡片 schema (10类枚举 + 必填项)

docs/
└── skill-version-bump.md  # 技能版本号规则文档 (FR-VERSION-001, D13)

scripts/
└── check-metrics-schema.mjs   # 结构校验脚本 (模板=check-contract.mjs);挂入 run-checks.mjs

core/__tests__/
├── metrics-collector.test.mjs     # 采集核心 + 双写 + 三时机 + 防错三坑
├── execution-record.test.mjs      # 六类键结构校验
├── knowledge-card.test.mjs        # 卡点卡片枚举校验
└── baseline.test.mjs              # 基线聚合 + gap 标记

tests/
└── metrics-smoke.test.mjs         # 聚合冒烟 (临时目录注入全局路径, FR-CI-002)

config/workflowhub.yaml            # [仅填值] metrics_path 占位槽填值启用,不改 load-config
scripts/run-checks.mjs             # [仅追加一行] 追加调用 check-metrics-schema.mjs
.github/workflows/ci.yml           # [无需改] 已跑 npm run check, 自动覆盖新校验
```

**§11 业务影响逐项映射**：
- 既有 workflow-issues 台账（§11）→ `knowledge-card.mjs` 卡点卡片作为反馈来源之一并存，回归测试验证既有台账写入/校验不变。
- 历史已归档 AgentHub M1-M3 任务记录（§11，只读）→ `baseline.mjs` 只读它算基线，测试验证归档字节不变。
- 守恒铁律"只记不挡"（§11）→ 无任何 binding gate；`metrics-collector.test.mjs` 含"写入失败仍推进"行为测试。
- CI 回归路径（§11）→ `metrics-smoke.test.mjs` + `check-metrics-schema.mjs` 挂入 `run-checks.mjs`。

## Data Model（B 档：本期改数据结构，必填）

- **执行记录（jsonl 行）**：执行标识(必填)/技能或阶段名/所在阶段/技能版本/是否执行/用量/耗时/返工轮次(含"无审查"哨兵区别于零返工)/人工介入/卡点引用。task 级 + 全局双写，全局行额外带 task_id/project/skill/version。
- **统一执行记录（JSON）**：六类键 progress/facts/metrics/feedback/boundary_decisions/trace_index；每类键标 first_consumer，无消费方者可选；含扩展预留位。
- **卡点知识卡片（JSON）**：type(10枚举+other)/stage/root_cause/resolution/resolved/occurred_at 必填；prevention/memory_ref/honest_override/metrics_ref/affected_deliverable 可选。
- **基线字段（JSON）**：field_mapping/gap_status/gap_reason/source_task_set/limitation。

## API 契约 / 数据流向

N/A — M4 无对外 HTTP API。数据流为进程内：宿主适配层 → 采集核心 → jsonl 双写；基线模块只读历史归档。判定依据 invariant：无跨服务/跨层网络调用，非借简化偷工。

## 依赖情况

无新增第三方依赖。沿用 Node 内置 `fs`（jsonl 原子追加）+ 现有 Vitest。明确不引 AJV（与 M1-M3 手写校验一致）。

## 实现风险点（B 档：有真实技术风险，必填）

- **三时机重定位丢更新**：会话压缩后凭执行标识从磁盘重定位（FR-COLLECT-004）。缓解：执行标识做全局唯一 + 写回前先读盘合并，测试覆盖压缩中途场景。
- **三历史坑（D16）**：①动作计数按动作自身标识去重非消息标识 ②阶段重开汇总先 dedupe-within-stage 再 sum ③会话源不可达标 gap 不填零。缓解：三个防错点各配反向用例（AC8），故意构造坏情况验证。
- **boundary_decisions/trace_index 数据源（D10）**：design 前置约束要求确证来源。缓解：trace_index 主键用过程记录序号、boundary_decision 用阶段/状态转移；确证无源的键显式标 gap，第一个 phase 先确证再落键。
- **用量字段权威源不可达**：spec §10 未决。缓解：实现期先探测会话用量源是否可达（FR-GUARD-004），不可达则该字段标 gap，不阻塞其他字段采集。

## 验证策略（B 档：落仓库改动，必填）

- **单元测试（核心逻辑）**：采集核心三时机/双写、执行记录六类键校验、卡点卡片枚举校验、基线聚合+gap，落 `core/__tests__/*.test.mjs`。
- **防错反向测试**：三历史坑各一条"故意构造坏情况看红"的反向用例（AC8），防假绿。
- **行为测试**：采集写入失败仍推进 + 正常场景不误报警（AC11），运行时行为非仅代码存在。
- **聚合冒烟**：`tests/metrics-smoke.test.mjs` 用临时目录注入全局 metrics_path（FR-CI-002），跑结构校验 + 聚合，负向喂坏 schema 验证能红（AC10）。
- **零回归基线**：跑全量 `npm test` + `npm run check`，与改动前基线 JSON 逐行 diff（防 -t 过滤假绿）。

## 证据契约预声明

```evidence-contract
{
  "changeId": "m4-metrics-foundation",
  "gitSha": "PLACEHOLDER_RESOLVED_AT_APPLY",
  "phases": [
    {
      "phase": "phase-1-collector-core",
      "red": { "command": "cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run core/__tests__/metrics-collector.test.mjs --passWithNoTests=false", "evidenceSink": "apply/evidence/phase-1-RED.stdout", "affectedTests": ["core/__tests__/metrics-collector.test.mjs"] },
      "green": { "command": "cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run core/__tests__/metrics-collector.test.mjs --passWithNoTests=false", "evidenceSink": "apply/evidence/phase-1-GREEN.stdout", "affectedTests": ["core/__tests__/metrics-collector.test.mjs"] }
    },
    {
      "phase": "phase-2-execution-record",
      "red": { "command": "cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run core/__tests__/execution-record.test.mjs --passWithNoTests=false", "evidenceSink": "apply/evidence/phase-2-RED.stdout", "affectedTests": ["core/__tests__/execution-record.test.mjs"] },
      "green": { "command": "cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run core/__tests__/execution-record.test.mjs --passWithNoTests=false", "evidenceSink": "apply/evidence/phase-2-GREEN.stdout", "affectedTests": ["core/__tests__/execution-record.test.mjs"] }
    },
    {
      "phase": "phase-3-knowledge-card",
      "red": { "command": "cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run core/__tests__/knowledge-card.test.mjs --passWithNoTests=false", "evidenceSink": "apply/evidence/phase-3-RED.stdout", "affectedTests": ["core/__tests__/knowledge-card.test.mjs"] },
      "green": { "command": "cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run core/__tests__/knowledge-card.test.mjs --passWithNoTests=false", "evidenceSink": "apply/evidence/phase-3-GREEN.stdout", "affectedTests": ["core/__tests__/knowledge-card.test.mjs"] }
    },
    {
      "phase": "phase-4-baseline-version",
      "red": { "command": "cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run core/__tests__/baseline.test.mjs --passWithNoTests=false", "evidenceSink": "apply/evidence/phase-4-RED.stdout", "affectedTests": ["core/__tests__/baseline.test.mjs"] },
      "green": { "command": "cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run core/__tests__/baseline.test.mjs --passWithNoTests=false", "evidenceSink": "apply/evidence/phase-4-GREEN.stdout", "affectedTests": ["core/__tests__/baseline.test.mjs"] }
    },
    {
      "phase": "phase-5-ci-smoke",
      "red": { "command": "cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/metrics-smoke.test.mjs --passWithNoTests=false", "evidenceSink": "apply/evidence/phase-5-RED.stdout", "affectedTests": ["tests/metrics-smoke.test.mjs"] },
      "green": { "command": "cd /Users/Hugh/Hugh/Project/workflowhub && npm run check && npx vitest run tests/metrics-smoke.test.mjs --passWithNoTests=false", "evidenceSink": "apply/evidence/phase-5-GREEN.stdout", "affectedTests": ["tests/metrics-smoke.test.mjs"] }
    }
  ]
}
```

## 上游合并安全评估

- M4 全部新增落 workflowhub 独立仓，**不触碰 multica-agenthub upstream 高风险目录**（apps/web、server、packages/*）、不碰 6 个 forbidden 文件。
- workflowhub 内为新增文件 + 两处极小追加（workflowhub.yaml 填 metrics_path 值、run-checks.mjs 追加一行 checker 调用），无深改既有实现。
- 上游合并风险：低。
