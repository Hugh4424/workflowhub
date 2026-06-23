# Tasks: M4 指标底座（workflowhub metrics foundation）

**Feature**: m4-metrics-foundation
**Plan**: [plan.md](./plan.md)
**代码落点**: `/Users/Hugh/Hugh/Project/workflowhub`（独立仓，不改 agenthub）

> 所有文件路径相对 `/Users/Hugh/Hugh/Project/workflowhub`。每 phase 末 task = Knowledge 维护。RED/GREEN 命令对齐 plan.md 证据契约。

---

## Phase 1: 采集核心 + 双写 + 三时机
- ui_change: false

**Goal**: 实现采集核心（一行三段更新 + 双写 task级/全局），堵死三历史坑（动作计数去重/阶段重开去重/会话源不可达标 gap）。

**Files**:
- `metrics/collector.mjs`（新增）
- `metrics/record-schema.mjs`（新增）
- `metrics/adapters/host-adapter.mjs`（新增）
- `tests/metrics-collector.test.mjs`（新增）
- `config/workflowhub.yaml`（填 metrics_path 值）

**Tasks**:
- [x] T001 [FR-COLLECT-002] 写 RED：`metrics-collector.test.mjs` 断言执行记录核心字段齐全（含执行标识必填）、缺执行标识判不合格
  - 入参：spec §4 COLLECT 域 + §6 关键实体
  - 出参：apply/evidence/phase-1-RED.stdout（采集失败输出）
  - 文件：`tests/metrics-collector.test.mjs`
  - 验证：`cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/metrics-collector.test.mjs --passWithNoTests=false`（RED 红）
- [x] T002 [FR-COLLECT-001/002/003/004/008] 实现 `record-schema.mjs`（核心字段结构 + 手写校验）+ `collector.mjs`（per-skill/stage 粒度、三时机落骨架/补自身/补全局、凭执行标识从磁盘重定位合并、纯记录不调模型）
  - 入参：T001 的 RED 断言
  - 出参：collector.mjs / record-schema.mjs
  - 文件：`metrics/collector.mjs`、`metrics/record-schema.mjs`
  - 验证：T001 测试转 GREEN
- [x] T003 [FR-COLLECT-006/007] 实现双写（task级 + 全局扁平 jsonl，全局带 task_id/project/skill/version），metrics_path 从 config 读、可配置、默认用户级
  - 入参：T002 collector
  - 出参：双写逻辑 + config/workflowhub.yaml 填值
  - 文件：`metrics/collector.mjs`、`config/workflowhub.yaml`
  - 验证：测试断言两处各一条、删任一处判失败
- [x] T004 [FR-COLLECT-005] 实现 `host-adapter.mjs`（宿主时机→采集核心三时机调用），核心不含宿主硬绑定
  - 入参：T002 collector 接口
  - 出参：host-adapter.mjs
  - 文件：`metrics/adapters/host-adapter.mjs`
  - 验证：测试断言核心无宿主钩子依赖、换适配层核心不改
- [x] T005 [FR-GUARD-002/003/004] 写三历史坑反向用例：①按消息标识去重→归零（验按动作标识去重）②阶段重开→翻倍（验阶段内先去重再 sum）③会话源不可达→填零（验标 gap）
  - 入参：spec AC8 + D16
  - 出参：三条反向用例（故意构造坏情况看红）
  - 文件：`tests/metrics-collector.test.mjs`
  - 验证：三反向用例触发即证防错生效
- [x] T006 [FR-GUARD-001] 写行为测试：采集写入失败发告警但仍推进 + 正常场景不误报警（AC11）
  - 入参：spec AC11 / §3 场景十
  - 出参：写入失败行为测试
  - 文件：`tests/metrics-collector.test.mjs`
  - 验证：失败场景不报警或正常场景误报警即判失败
- [x] T007 [Knowledge] 维护知识文件：Files Touched 清单 + GREEN 证据路径写入 apply/phase-1.md；原始输出落 apply/evidence/；同步 workflow-issues.jsonl 和 state.json
  - 验证：apply/phase-1.md 存在且引用 evidence 路径

**Verify**: `cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/metrics-collector.test.mjs --passWithNoTests=false`

**Knowledge**: apply/phase-1.md + apply/evidence/phase-1-{RED,GREEN}.stdout

**STOP**: Phase 1 GREEN + code review pass 前不进 Phase 2。

---

## Phase 2: 统一执行记录组装
- ui_change: false

**Goal**: 实现统一执行记录（六类键串联视图，不重复存明细，每类键标消费方、无消费方可选、含扩展预留位），boundary_decisions/trace_index 确证数据源否则标 gap。

**Files**:
- `metrics/execution-record.mjs`（新增）
- `contracts/execution-record.contract.json`（新增）
- `tests/execution-record.test.mjs`（新增）

**Tasks**:
- [x] T008 [FR-EXECREC-001] 写 RED：`execution-record.test.mjs` 断言六类键齐全则通过、缺任一类键判不合格
  - 入参：spec §4 EXECREC 域
  - 出参：apply/evidence/phase-2-RED.stdout
  - 文件：`tests/execution-record.test.mjs`
  - 验证：`cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/execution-record.test.mjs --passWithNoTests=false`（RED 红）
- [x] T009 [FR-EXECREC-001/002/003] 实现 `execution-record.mjs`（六类键组装 + 结构校验，凭 trace_index 索引串联不拷贝明细，硬指标/软反馈分形态）+ `contracts/execution-record.contract.json`
  - 入参：T008 RED
  - 出参：execution-record.mjs + 契约 JSON
  - 文件：`metrics/execution-record.mjs`、`contracts/execution-record.contract.json`
  - 验证：T008 转 GREEN
- [x] T010 [FR-EXECREC-004/005] 实现 boundary_decisions/trace_index 数据源确证（trace_index 主键=过程记录序号、boundary_decision=阶段/状态转移），无源显式标 gap 不空占不人工填；每类键标 first_consumer、无消费方降可选 + 扩展预留位
  - 入参：D10/D18
  - 出参：数据源确证逻辑 + 消费方标注
  - 文件：`metrics/execution-record.mjs`
  - 验证：测试断言无源键标 gap、无消费方键不因空 BLOCK
- [x] T011 [Knowledge] 维护知识文件：apply/phase-2.md + evidence 路径 + workflow-issues/state 同步
  - 验证：apply/phase-2.md 存在

**Verify**: `cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/execution-record.test.mjs --passWithNoTests=false`

**Knowledge**: apply/phase-2.md + apply/evidence/phase-2-{RED,GREEN}.stdout

**STOP**: Phase 2 GREEN + review pass 前不进 Phase 3。

---

## Phase 3: 卡点知识卡片
- ui_change: false

**Goal**: 实现卡点知识卡片（10 类枚举 + other 兜底，必填六项 + 可选五项），作为反馈类键来源之一，与既有 workflow-issues 台账并存且不让其退化。

**Files**:
- `metrics/knowledge-card.mjs`（新增）
- `contracts/knowledge-card.contract.json`（新增）
- `tests/knowledge-card.test.mjs`（新增）

**Tasks**:
- [x] T012 [FR-FEEDBACK-002/003] 写 RED：`knowledge-card.test.mjs` 断言必填六项齐全则通过、缺任一判失败、type 取枚举外值判不合格、未知类落 other
  - 入参：spec §4 FEEDBACK 域 + §6 卡点卡片实体
  - 出参：apply/evidence/phase-3-RED.stdout
  - 文件：`tests/knowledge-card.test.mjs`
  - 验证：`cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/knowledge-card.test.mjs --passWithNoTests=false`（RED 红）
- [x] T013 [FR-FEEDBACK-001/002/003] 实现 `knowledge-card.mjs`（枚举校验 + 必填/可选项）+ `contracts/knowledge-card.contract.json`（10 类枚举 + other）
  - 入参：T012 RED
  - 出参：knowledge-card.mjs + 契约 JSON
  - 文件：`metrics/knowledge-card.mjs`、`contracts/knowledge-card.contract.json`
  - 验证：T012 转 GREEN
- [x] T014 [FR-FEEDBACK-004] 接入反馈键来源 + 既有 workflow-issues 台账并存回归测试（验证既有台账写入/校验行为不变）
  - 入参：spec §11 既有台账影响
  - 出参：并存接入 + 回归测试
  - 文件：`metrics/knowledge-card.mjs`、`tests/knowledge-card.test.mjs`
  - 验证：既有台账行为回归不变
- [x] T015 [Knowledge] 维护知识文件：apply/phase-3.md + evidence + 同步
  - 验证：apply/phase-3.md 存在

**Verify**: `cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/knowledge-card.test.mjs --passWithNoTests=false`

**Knowledge**: apply/phase-3.md + apply/evidence/phase-3-{RED,GREEN}.stdout

**STOP**: Phase 3 GREEN + review pass 前不进 Phase 4。

---

## Phase 4: 基线字段 + 技能版本规则
- ui_change: false

**Goal**: 实现基线字段定义 + 从已归档 AgentHub M1-M3 算基线（gap 结构化、记源任务集、标局限），原 5 项任务级指标作派生项；产出技能版本号规则文档。

**Files**:
- `metrics/baseline.mjs`（新增）
- `docs/skill-version-bump.md`（新增）
- `tests/baseline.test.mjs`（新增）

**Tasks**:
- [x] T016 [FR-BASELINE-001/002] 写 RED：`baseline.test.mjs` 断言能算字段给数值、算不出给结构化 gap（状态/原因）、伪造数字或以零充缺或未记源任务集判失败
  - 入参：spec §4 BASELINE 域 + AC7
  - 出参：apply/evidence/phase-4-RED.stdout
  - 文件：`tests/baseline.test.mjs`
  - 验证：`cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/baseline.test.mjs --passWithNoTests=false`（RED 红）
- [x] T017 [FR-BASELINE-001/002] 实现 `baseline.mjs`（基线字段定义 + 从已归档 M1-M3 聚合 + gap 标记 + 记源任务集 + 标局限）；原 5 项任务级指标从核心字段派生算出
  - 入参：T016 RED + D12
  - 出参：baseline.mjs
  - 文件：`metrics/baseline.mjs`
  - 验证：T016 转 GREEN
- [x] T018 [FR-VERSION-001/002] 写 `docs/skill-version-bump.md`（声明对外契约=技能清单 + 各级版本变化触发规则 + 1.0 前处理 + 变更说明）；版本号作执行记录字段，本期不做自动契约比对守卫
  - 入参：spec §4 VERSION 域 + D13
  - 出参：版本规则文档
  - 文件：`docs/skill-version-bump.md`
  - 验证：文档含对外契约定义 + 各级触发规则，可由他人复算同一结论
- [x] T019 [Knowledge] 维护知识文件：apply/phase-4.md + evidence + 同步
  - 验证：apply/phase-4.md 存在

**Verify**: `cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/baseline.test.mjs --passWithNoTests=false`

**Knowledge**: apply/phase-4.md + apply/evidence/phase-4-{RED,GREEN}.stdout

**STOP**: Phase 4 GREEN + review pass 前不进 Phase 5。

---

## Phase 5: CI 校验脚本 + 聚合冒烟
- ui_change: false

**Goal**: 新增结构校验脚本挂入 run-checks.mjs，聚合冒烟用临时目录注入全局路径（覆盖双写代码路径不依赖用户级目录），负向喂坏 schema 验证能红。

**Files**:
- `scripts/check-metrics-schema.mjs`（新增）
- `tests/metrics-smoke.test.mjs`（新增）
- `scripts/run-checks.mjs`（追加一行）

**Tasks**:
- [x] T020 [FR-CI-001/002] 写 RED：`metrics-smoke.test.mjs` 断言临时目录注入全局路径跑结构校验+聚合通过、负向喂缺类键记录或坏 schema 须判失败（红）
  - 入参：spec §4 CI 域 + AC10
  - 出参：apply/evidence/phase-5-RED.stdout
  - 文件：`tests/metrics-smoke.test.mjs`
  - 验证：`cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/metrics-smoke.test.mjs --passWithNoTests=false`（RED 红）
- [x] T021 [FR-CI-001/002] 实现 `check-metrics-schema.mjs`（模板=check-contract.mjs，校验执行记录/卡点卡片/统一记录结构）+ 挂入 `run-checks.mjs` 聚合
  - 入参：T020 RED + check-contract.mjs 模板
  - 出参：校验脚本 + run-checks 追加调用
  - 文件：`scripts/check-metrics-schema.mjs`、`scripts/run-checks.mjs`
  - 验证：T020 转 GREEN + `npm run check` 含新校验
- [x] T022 [FR-CI-002] 聚合冒烟用临时目录注入 metrics_path（不依赖用户级目录），正向通过 + 负向能红
  - 入参：T021 校验脚本
  - 出参：临时目录注入冒烟
  - 文件：`tests/metrics-smoke.test.mjs`
  - 验证：正向通过 + 负向喂坏输入能红
- [x] T023 [Knowledge] 维护知识文件：apply/phase-5.md + evidence + 同步；零回归基线 diff（全量 npm test + npm run check）
  - 验证：apply/phase-5.md 存在 + 零回归

**Verify**: `cd /Users/Hugh/Hugh/Project/workflowhub && npm run check && npx vitest run tests/metrics-smoke.test.mjs --passWithNoTests=false`

**Knowledge**: apply/phase-5.md + apply/evidence/phase-5-{RED,GREEN}.stdout

**STOP**: Phase 5 GREEN + review pass = M4 全交付。
