# M5 质量机制（quality mechanism）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 workflowhub 装零消耗质量观测层——4 个物理事实自动落盘、三态边界结构化确认、CI 守住质量门=0、stage_result 七字段结构化错误传播。

**Architecture:** 全在 workflowhub 仓（`/Users/Hugh/Hugh/Project/workflowhub`），零新依赖；复用 M4 execution-record facts 键 + M2 path-guard 接口 + 已有 validate-contract/upsert；新增 3 个 .mjs 文件 + 1 个 contract JSON + 对现有文件的最小改动（collector.mjs 追加 collectFacts 调用 ≤5 行 + 给 upsert 加 export；run-checks.mjs 追加第 6 个 checker；check-path-guard.mjs 给 findViolation 加 export）。upsert/findViolation 现为各自文件的内部函数（collector.mjs:80 / check-path-guard.mjs:97），boundary-confirm.mjs 跨文件复用前必须先加 `export`（仅加关键字、零行为变更）。守恒铁律：只记不挡，任何 facts 采集或 stage_result 护栏不得成为运行时 blocking。

**Tech Stack:** Node.js ESM (.mjs)，无框架，手写校验（zero-AJV），npm test（Vitest），npm run check（markdownlint + verify-structure + run-checks）。

---

## Phase 1 — Fact Collector [FR-FACT-001/002/003]

```
ui_change: false
```

### Goal

在 `metrics/collector.mjs` 的 `updateOwnResult` 末尾追加 `collectFacts` 调用（≤5 行）；`collectFacts` 写 4 个物理事实到 execution-record.facts 键；失败时 stderr 告警不 throw，零阻断。新建 `tests/fact-collector.test.mjs`。

### Files

- Modify: `/Users/Hugh/Hugh/Project/workflowhub/metrics/collector.mjs` — 追加 `collectFacts` 导出 + 在 `updateOwnResult` 末尾调用
- Create: `/Users/Hugh/Hugh/Project/workflowhub/tests/fact-collector.test.mjs` — 单元测试，喂固定进程上下文，查 facts 出
- Reference: `/Users/Hugh/Hugh/Project/workflowhub/metrics/execution-record.mjs` — SIX_KEYS/GAP 顺序（SIG A-003/A-004），只读不改
- Reference: `/Users/Hugh/Hugh/Project/workflowhub/metrics/collector.mjs` — A-001 updateOwnResult，A-002 upsert（同模块内部函数，collectFacts 同文件直用、无需 export/import），签名不变不重写

### Tasks

- [x] T001 [FR-FACT-001] 新建 `tests/fact-collector.test.mjs`，写测试断言四字段存在；先跑失败命令存证（collectFacts 未实现 → exit 1）
  - 入参：无（新建文件）
  - 出参：`tests/fact-collector.test.mjs`；RED 证据存 `$TASK_DIR/apply/evidence/v1-fact-collector-RED.txt`
  - 做什么：测试喂固定 factSeed（exit_code/git_sha/files_changed/review_invoked）+ cfg 进 collectFacts；读回 execution-record JSONL 断言四字段写入正确类型；另写一个测试验证 collectFacts 在 factSeed 为空时不 throw（never-throw 路径）。接口按 plan SIG 第 5 章 `collectFacts(execution_id, factSeed, cfg)` 签名
  - 验证意图：先跑失败命令确认真红（collectFacts 不存在时 exit 1）；存 RED 证据后再进实现

- [x] T002 [FR-FACT-001/FR-FACT-002/FR-FACT-003] 实现 `collectFacts`，接入 `updateOwnResult`
  - 入参：`metrics/collector.mjs`（现有，按 A-001/A-002 签名）；`metrics/execution-record.mjs`（只读，按 A-004 GAP 哨兵）
  - 出参：`metrics/collector.mjs`（修改，追加 collectFacts 导出 + updateOwnResult 末尾调用）
  - 做什么：在 `updateOwnResult`（A-001）末尾追加 collectFacts 调用，≤5 行；collectFacts 内部用已有 upsert（A-002）写 facts 键；采集 exit_code/git_sha/files_changed 走进程/git 零开销来源；review_invoked 从 execution-record 推导，推导不到记 `false` + stderr 告警；整个 collectFacts 用 try/catch 包住，失败只 stderr warn 不 throw（FR-FACT-003 守恒铁律）；GAP 哨兵（A-004）用于 review_invoked 推导失败时标缺口
  - 验证意图：真跑活流程——经真实 collector 管道（updateOwnResult 触发 collectFacts）写 facts；读回 execution-record 断言四字段；采集失败路径（如强制让 git 命令返回非零）验流程继续 + 有 stderr 告警（判据必须是被测命令真实退出码，不吞退出码）

- [x] T003 [FR-FACT-001/002/003] 维护知识文件（Phase 1）
  - 入参：Phase 1 实现结果
  - 出参：`$TASK_DIR/apply/phase-1.md`；evidence 路径 `$TASK_DIR/apply/evidence/v1-fact-collector-GREEN.txt`
  - 做什么：写 phase-1.md，含 Files Touched（collector.mjs + fact-collector.test.mjs 精确路径）、RED/GREEN 证据路径、FR-FACT-001/002/003 覆盖说明
  - 验证意图：phase-1.md 存在且 Files Touched 精确路径与实际改动文件一一对应

### Verify

- V1（不卡死）：造 exit_code≠0 或 review_invoked=false 场景，流程能继续推进 + facts 里能查到遗漏；流程被 BLOCK 即失败
- V5a（可测）：能算出 fact 采集对主流程上下文新增的字节数并输出，无额外人工交互；算不出即失败
- V5b（仅观察，不设 gate）：字节数是否"够小"由人拍阈值，不设自动 gate（FR-GATE-001 守住）
- 防假绿：把 facts 写入改成 blocking check 后验 V1 应红；用 set -o pipefail 确保判据是真实退出码

### Knowledge

- fact collector 失败告警不抛拦截是守恒铁律（FR-GATE-002/D7），任何修改不得破此铁律
- review_invoked 从 execution-record 推导，推导不到记 `false`（非 null/undefined），ponytail：当前无 journal，未来有 journal 再升级来源
- collectFacts 采集的字节开销在 V5a 需可算出，但"够小"由人拍非自动 gate（V5b）

### STOP

Phase 1 完成条件：T001-T003 全绿；V1 通过；fact-collector.test.mjs 真跑活流程（非隔离 /tmp fixture）；collector.mjs 改动 ≤5 行。

---

## Phase 2 — Stage 边界确认 [FR-BOUND-001/002/003]

```
ui_change: false
```

### Goal

新建 `core/boundary-confirm.mjs`，暴露 `confirmBoundary(state, cfg)` 接口；三态（missing/failed/unknown）各能选"继续"并把选择+原因写进 execution-record.boundary_decisions；复用 M2 findViolation 检测不可逆操作类型（FR-BOUND-003），不新建确认机制。

### Files

- Create: `/Users/Hugh/Hugh/Project/workflowhub/core/boundary-confirm.mjs` — 三态边界确认接口
- Create: `/Users/Hugh/Hugh/Project/workflowhub/tests/boundary-confirm.test.mjs` — 三态单元测试
- Modify: `/Users/Hugh/Hugh/Project/workflowhub/scripts/check-path-guard.mjs` — A-005b：`function findViolation`（L97）加 `export`（仅加关键字，不改函数体/CLI 行为），使 boundary-confirm.mjs 可 import
- Modify: `/Users/Hugh/Hugh/Project/workflowhub/metrics/collector.mjs` — A-002b：`function upsert`（L80）加 `export`（仅加关键字，不改函数体/签名），使 boundary-confirm.mjs 可 import 写 boundary_decisions 键
- Reference: `/Users/Hugh/Hugh/Project/workflowhub/scripts/check-path-guard.mjs` — A-005 findViolation 接口，export 后 import 不复制

### Tasks

- [x] T004 [FR-BOUND-001/002/003] 新建 `tests/boundary-confirm.test.mjs`，写三态测试；先跑失败命令存证
  - 入参：无（新建文件）
  - 出参：`tests/boundary-confirm.test.mjs`；RED 证据存 `$TASK_DIR/apply/evidence/v3-boundary-RED.txt`
  - 做什么：为 missing/failed/unknown 三态各写一个测试，断言 confirmBoundary 返回 `{decision, reason, timestamp}` 且 decision 可为"continue"；验证选择和原因落进 boundary_decisions 键（可查记录，非孤儿）；接口签名按 plan 第 5 章 `confirmBoundary(state, cfg)` 
  - 验证意图：先跑失败命令确认真红（boundary-confirm.mjs 不存在 → exit 1）；三态各独立可测

- [x] T005 [FR-BOUND-001/002/003/FR-GATE-003/FR-GATE-004] 实现 `core/boundary-confirm.mjs`（含 confirmBoundary 三态 + confirmIrreversible 不可逆四类×三结果）
  - 入参：`scripts/check-path-guard.mjs`（A-005b：先给 findViolation 加 export，再 import 不复制）；`metrics/collector.mjs`（A-002b：先给 upsert 加 export，再 import）
  - 出参：`core/boundary-confirm.mjs`（新建）
  - 做什么：⓪前置（A-002b/A-005b）：先给 `metrics/collector.mjs:upsert`（L80）和 `scripts/check-path-guard.mjs:findViolation`（L97）各加 `export` 关键字（仅加关键字、不改函数体/签名/CLI 行为），使 boundary-confirm.mjs 能跨文件 import；改后跑一次现有 run-checks 确认 collector/check-path-guard 无回归。①`confirmBoundary(state, cfg)` 接受三态枚举（missing/failed/unknown）和 cfg（含 execution_id/taskMetricsPath/globalMetricsPath/project/taskId）；返回 `{decision, reason, timestamp}`；写进 boundary_decisions 键（含 source 声明 `boundary-confirm@m5`，遵 FR-EXECREC-004）。②另暴露 `confirmIrreversible(op, cfg, targetPath, opts)` 处理不可逆操作确认（FR-GATE-003/004）：覆盖 delete/push/merge/archive 四类、对涉及路径的操作复用 A-005 findViolation 判断是否命中保护区、命中则记 needs_manual_confirm；结果按 opts.outcome 支持 confirmed/rejected/timeout 三种，各写 boundary_decisions（带 source）。③两函数均 never throws，失败 stderr 告警后仍返回结果（FR-BOUND-001 放行不卡死）；rejected/timeout 也记录并继续不 BLOCK（FR-GATE-004 守恒铁律）
  - 验证意图：真跑活流程——①三态各一例能选"继续"并让选择和原因落进可查询记录（非孤儿，FR-BOUND-002）；②不可逆确认对 delete/push/merge/archive 四类分别触发、对普通修改等非四类断言不触发；confirmed/rejected/timeout 三结果各断言 boundary_decisions 有记录且流程继续不 BLOCK（FR-GATE-003/004）；③复用 findViolation（FR-BOUND-003）被换成自建机制时测试应红

- [x] T006 [FR-BOUND-001/002/003] 维护知识文件（Phase 2）
  - 入参：Phase 2 实现结果
  - 出参：`$TASK_DIR/apply/phase-2.md`；evidence 路径 `$TASK_DIR/apply/evidence/v3-boundary-GREEN.txt`
  - 做什么：写 phase-2.md，含 Files Touched、RED/GREEN 证据路径、FR-BOUND-001/002/003 覆盖说明
  - 验证意图：phase-2.md 存在且 Files Touched 精确路径与实际改动文件一一对应

### Verify

- V3（三态放行）：missing/failed/unknown 各造一例，都能选"继续"并记原因；任一态卡住即失败；须真跑活流程
- 防孤儿（FR-BOUND-002）：确认结果必须落进可查询记录，不是打印到 stdout 就算
- 防假绿：把某态处理改成 BLOCK 后验该态应红；复用 findViolation 被换成自建机制后测试应红

### Knowledge

- boundary_decisions 写入必须带 source 声明（`boundary-confirm@m5`），遵 M4 FR-EXECREC-004
- findViolation（A-005）是复用强制项（FR-BOUND-003），不可新建同功能逻辑
- confirmBoundary never throws 是铁律，与 collectFacts 的 never-throw 对称

### STOP

Phase 2 完成条件：T004-T006 全绿；V3 三态各一例通过；boundary_decisions 记录非孤儿（event 可读回断言）；boundary-confirm.mjs ≤50 行。

---

## Phase 3 — Gate 质量扫描 CI [FR-GATE-001/002/003/004]

```
ui_change: false
```

### Goal

新建 `scripts/check-stage-quality.mjs`，扫描质量类 blocking 数量；质量类 blocking=0 时 exit 0，>0 时 exit 1（CI 可红）；支持 `--self-test` 模式注入真实路径验证可红；在 `scripts/run-checks.mjs` 追加为第 6 个 checker。V6 三坑防复发逻辑在此模块实现。

### Files

- Create: `/Users/Hugh/Hugh/Project/workflowhub/scripts/check-stage-quality.mjs` — CI gate 扫描
- Modify: `/Users/Hugh/Hugh/Project/workflowhub/scripts/run-checks.mjs` — 追加第 6 个 checker（≤5 行）
- Reference: `/Users/Hugh/Hugh/Project/workflowhub/scripts/run-checks.mjs` — A-006 runChecker/runAggregate，不改已有 checker 顺序
- Reference: `/Users/Hugh/Hugh/Project/workflowhub/core/validate-contract.mjs` — A-007 validateContract，用于格式校验
- Reference: `/Users/Hugh/Hugh/Project/workflowhub/metrics/` — 扫描范围含此目录（fact collector 所在），排除 check-stage-quality.mjs 自身

### Tasks

- [x] T007 [FR-GATE-001/002] 新建 `scripts/check-stage-quality.mjs`（先跑文件不存在时 RED 证据）
  - 入参：无（新建文件）
  - 出参：`scripts/check-stage-quality.mjs`；RED 证据存 `$TASK_DIR/apply/evidence/v2-gate-scan-RED.txt`
  - 做什么：先跑 `node scripts/check-stage-quality.mjs` 确认因文件不存在而 exit 1，存为 RED 证据
  - 验证意图：先跑失败命令确认真红，存 RED 证据后进实现

- [x] T008 [FR-GATE-001/002/003/004] 实现 `check-stage-quality.mjs` 主体
  - 入参：workflowhub 仓 `scripts/` 目录（扫描目标）；`metrics/` 目录（含 fact collector，须纳入扫描范围）
  - 出参：`scripts/check-stage-quality.mjs`（实现）
  - 做什么：扫描全部 checker 文件统计质量类 blocking 数量（FR-GATE-001）；识别三类违规——① fact collector 失败被写成 blocking（V6①，FR-GATE-002）；② stage_result schema 被用在运行时拦截（V6②，FR-RESULT-003）；③ 不可测指标当自动 gate（V6③，FR-GATE-001）；支持 `--self-test` flag，注入真实路径模拟违规验扫描可红；扫描范围必须含 `metrics/`（fact collector 所在），排除自身文件；self-test 用真实路径注入（非硬编码字符串），能真正让注入后扫描变红
  - 验证意图：正常扫描 exit 0（质量类 blocking=0）；故意注入质量类 blocking 后 exit 1（防假绿）；`--self-test` 路径注入验证：注入后能变红（FR-GATE-001 场景二）；self-test 测试的是真实注入非 mock

- [x] T009 [FR-GATE-001/FR-GATE-002/FR-GATE-003/FR-GATE-004] 追加第 6 个 checker 进 `run-checks.mjs`
  - 入参：`scripts/run-checks.mjs`（现有，按 A-006 runChecker/runAggregate 模式）
  - 出参：`scripts/run-checks.mjs`（修改，追加 ≤5 行）
  - 做什么：在 runAggregate() 末尾追加 check-stage-quality checker 注册，保持已有 5 个 checker 顺序不变（A-006 禁止改已有顺序）；checker 聚合结果要能反映 FR-GATE-003（不可逆确认四类）和 FR-GATE-004（超时仍放行不 BLOCK）的违规扫描——这两类违规由 T008 实现，T009 只负责接入到 CI 聚合链
  - 验证意图：`npm run check` 能调用到第 6 个 checker；故意注入质量违规时 npm run check 整体 exit 1

- [x] T010 [FR-GATE-001/002/003/004] 新建 `tests/stage-quality.test.mjs`，写 self-test 真实路径注入测试
  - 入参：`scripts/check-stage-quality.mjs`
  - 出参：`tests/stage-quality.test.mjs`（新建）
  - 做什么：测试正常扫描结果 exit 0；测试故意注入 blocking（三类各一例）后 exit 1；self-test 注入须用真实路径（非字符串 mock），确保测试可证伪（注入一个 blocking → 结果变红；删掉 blocking → 恢复绿）；扫描范围覆盖 metrics/ 验证测试
  - 验证意图：每类注入测试必须可证伪——故意把注入逻辑改掉后测试应红（防假绿）；self-test 真实路径注入能红是 FR-GATE-001 防假绿的核心

- [x] T011 [FR-GATE-001/002/003/004] 维护知识文件（Phase 3）
  - 入参：Phase 3 实现结果
  - 出参：`$TASK_DIR/apply/phase-3.md`；evidence 路径 `$TASK_DIR/apply/evidence/v2-gate-scan-GREEN.txt`
  - 做什么：写 phase-3.md，含 Files Touched、RED/GREEN 证据路径、FR-GATE-001/002/003/004 覆盖说明；记录 self-test 注入路径设计（避免 apply 阶段遗忘）
  - 验证意图：phase-3.md 存在且 Files Touched 精确路径与实际改动文件一一对应

### Verify

- V2（质量门=0）：CI 扫描全部 gate，质量类 blocking 数量=0；出现任一即失败
- V6①：fact collector 被改成 blocking check 时能被检出
- V6②：stage_result schema 被用在运行时拦截时能被检出（CI 格式校验不在此列）
- V6③：不可测指标当自动 gate 时能被检出
- 防假绿：故意注入三类违规各一例后扫描应红；self-test 真实路径注入不是恒绿空扫

### Knowledge

- 扫描范围必须含 `metrics/`（fact collector 在此），排除 check-stage-quality.mjs 自身（不自扫）
- self-test 用真实路径注入，不用字符串 mock——这是防假绿的核心手段，apply 实现时必须钉死
- CI 层对 schema 格式校验是合规检查，不在 V6② 检出范围内（FR-RESULT-003 明确区分）

### STOP

Phase 3 完成条件：T007-T011 全绿；V2/V6 三坑通过；self-test 注入后能真红；run-checks.mjs 追加行 ≤5 行；npm run check 整体通过。

---

## Phase 4 — Stage Result 契约 [FR-RESULT-001/002/003/004]

```
ui_change: false
```

### Goal

新建 `contracts/stage-result.contract.json`（七字段，对齐已有 contract 格式）；新建 `tests/stage-result-contract.test.mjs` 含七字段完整性测试 + 语义约束测试 + 运行时拦截违规检出测试；用 A-007 validateContract（zero-AJV）做 CI 格式校验。

### Files

- Create: `/Users/Hugh/Hugh/Project/workflowhub/contracts/stage-result.contract.json` — 七字段最小 schema
- Create: `/Users/Hugh/Hugh/Project/workflowhub/tests/stage-result-contract.test.mjs` — 契约测试
- Reference: `/Users/Hugh/Hugh/Project/workflowhub/contracts/execution-record.contract.json` — A-008 格式参考（version/validated_by_stage/required_fields[]），只读对齐格式
- Reference: `/Users/Hugh/Hugh/Project/workflowhub/core/validate-contract.mjs` — A-007 validateContract，zero-AJV，不引 AJV

### Tasks

- [x] T012 [FR-RESULT-001/002/003/004] 新建 `tests/stage-result-contract.test.mjs`，写七字段测试；先跑失败命令存证
  - 入参：无（新建文件）
  - 出参：`tests/stage-result-contract.test.mjs`；RED 证据存 `$TASK_DIR/apply/evidence/v4-stage-result-RED.txt`
  - 做什么：测试七字段齐全性（status/error_code/retryable/facts/missing_items/user_decision/reason 一个不漏）；测试语义约束——status 限 success/failed/unknown 枚举、missing_items 为 array、retryable 为 boolean——这些约束靠独立语义校验而非只 typeof 的 validateContract（FR-RESULT-002）；测试下游能从 stage_result 读到 error_code/retryable/missing_items 三字段（FR-RESULT-004）；先跑失败命令存 RED 证据（contract 文件不存在 → exit 1）
  - 验证意图：先跑失败命令确认真红；status 语义校验必须可证伪（填枚举外的值后校验应红）；missing_items array 约束可证伪（填非 array 后应红）

- [x] T013 [FR-RESULT-001/002/003/004] 实现 `contracts/stage-result.contract.json`
  - 入参：`contracts/execution-record.contract.json`（A-008，格式参考）；plan 第 4 章七字段定义
  - 出参：`contracts/stage-result.contract.json`（新建）
  - 做什么：按 A-008 格式（version + validated_by_stage + required_fields[]）写七字段契约；七字段逐条含类型约定——status（string，enum: success/failed/unknown）、error_code（string）、retryable（boolean）、facts（object，当次 stage 相关子集，非全装四个）、missing_items（array）、user_decision（boolean）、reason（string，面向 orchestrator 非 debug）；零 AJV（A-007），格式对齐已有 contract；护栏仅在 spec/CI 层，绝不进运行时（FR-RESULT-003）
  - 验证意图：validateContract（A-007）对契约格式校验通过；七字段任一缺失时校验应红；status 枚举外的值在语义校验时应红（依赖 T012 的独立语义校验，非只 typeof）

- [x] T014 [FR-RESULT-001/002/003/004] 维护知识文件（Phase 4）
  - 入参：Phase 4 实现结果
  - 出参：`$TASK_DIR/apply/phase-4.md`；evidence 路径 `$TASK_DIR/apply/evidence/v4-stage-result-GREEN.txt`
  - 做什么：写 phase-4.md，含 Files Touched、RED/GREEN 证据路径、FR-RESULT-001/002/003/004 覆盖说明
  - 验证意图：phase-4.md 存在且 Files Touched 精确路径与实际改动文件一一对应

### Verify

- V4（错误传播）：造一个 skill 返回 status=failed，下游能读到 error_code/retryable/missing_items 并继续；须真跑活流程
- V7（记录本身=交付）：验收判据是"事实有没有记下、三态能否放行"，不是"质量指标达没达标"
- 防假绿：把七字段之一砍掉后校验应红；status 填枚举外值后语义校验应红

### Knowledge

- stage_result 语义约束（status 枚举/missing_items array）靠独立语义校验，不靠只 typeof 的 validateContract——两层不是同一件事，apply 阶段必须分开实现
- stage_result 护栏在 spec/CI，绝不进运行时（FR-RESULT-003 铁律）；CI 格式校验合规，运行时拦截违规
- facts 字段装当次 stage 相关子集，非全装四个（Clarifications 2026-06-23）

### STOP

Phase 4 完成条件：T012-T014 全绿；V4 真跑活流程；七字段语义校验可证伪；contracts/stage-result.contract.json 格式对齐 A-008。

---

## Dependencies

- Phase 1（fact collector）先完成，Phase 2-4 可并行
- Phase 3 的扫描范围含 Phase 1 的 metrics/ 目录——Phase 1 完成后 Phase 3 才能做扫描 self-test
- Phase 4 不依赖 Phase 1-3，可与 Phase 2 并行；但 V4 活流程验收建议 Phase 1 完成后跑
- M2 check-path-guard（findViolation）和 M4 execution-record（facts 键）是前置依赖，已存在于 workflowhub
