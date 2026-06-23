# 实现计划：M5 质量机制（quality mechanism）

> 基于 SPEC.md 和已通过的 spec（m5-quality-mechanism）。

**功能名**: `m5-quality-mechanism`
**Spec**: `specs/m5-quality-mechanism/spec.md`
**交付仓**: `/Users/Hugh/Hugh/Project/workflowhub`（非 agenthub，宪法条款 F6/Q1/Q2）

## 1. 技术上下文

- **技术栈**：Node.js ESM（.mjs），无框架；手写校验（zero-AJV，对齐 M1-M3 先例）；npm test（Vitest）；CI（npm run check = markdownlint + verify-structure.mjs + run-checks.mjs）。
- **影响代码区**（全在 workflowhub 仓，精确路径）：
  - `metrics/execution-record.mjs`——facts 键写入（复用，无新文件）
  - `metrics/collector.mjs`——updateOwnResult 时机追加 facts 写入
  - `scripts/check-stage-quality.mjs`——新增 CI 扫描 checker
  - `scripts/run-checks.mjs`——追加第 6 个 checker 注册
  - `contracts/stage-result.contract.json`——新增 stage_result schema
  - `tests/stage-quality.test.mjs`——gate 扫描测试（新增）
  - `tests/fact-collector.test.mjs`——fact collector 适配层测试（新增）
  - `core/boundary-confirm.mjs`——三态边界确认接口（新增）
  - `tests/boundary-confirm.test.mjs`——三态测试（新增）
- **相关 ADR**：decision-log 决策 1-9（M5 全部）；依赖 M3 窄契约 + M4 execution-record/collector。
- **待确认项**：
  - `review_invoked` 从 execution-record 推导的具体字段名——已有 execution-record 无审查痕迹字段，需在 fact collector 内约定"若推导不到则记 false+告警"（ponytail，当前无 journal，决策 1 中用户拍板"从 M4 execution-record 推导"）。

## 2. 宪法门禁

> M5 代码写进 workflowhub，以下条款以 CONSTITUTION.md 为准，不以 multica-agenthub CLAUDE.md 为准。

**宪法对照（workflowhub/CONSTITUTION.md）**：

- [x] **F3 物理事实靠机器校验但不阻断**：facts 写入失败发告警不 throw，符合。
- [x] **F4 质量靠异源审查与人，而非阻断式质量门**：CI 扫描守零，非自动阻断，符合。
- [x] **F5 gate 谨慎添加**：仅新增 1 个 checker（check-stage-quality），不堆砌，符合。
- [x] **F6 统一外置执行记录**：facts 写进已有 execution-record，不新建文件，符合。
- [x] **F7 推进与不可逆操作不自动越过人**：超时记未确认仍放行，符合。
- [x] **F8 简单优先**：全复用已有接口（collector/path-guard/contract 格式），符合。
- [x] **F9 可证伪、不假绿**：每个 gate 配故意注入反证，符合。
- [x] **Q1 记事实而非阻断**：FR-FACT-003 / FR-GATE-002 明确只记不挡，符合。
- [x] **Q2 gate 三类划分**：quality blocking=0 / fact only-record / irreversible confirm，符合。
- [x] **不改变 spec 平台定位**：全在 workflowhub 新增，agenthub 零改动，符合。
- [x] **change 可独立验收**：四交付块各自有独立验收命令，符合。

**multica CLAUDE.md 工程硬规则（agenthub 不涉及时写不涉及）**：

- [x] Package Boundary Rules：不涉及（workflowhub 无 packages/core 约束）。
- [x] API Response Compatibility：不涉及（无 REST API 改动）。
- [x] No-Duplication Rule：不涉及（workflowhub 单仓）。
- [x] Backend UUID Parsing：不涉及（无 Go 后端改动）。

## 2.5 治理同步矩阵

| 治理面分类 | 本 change 触碰的文件 | 改/不改 | 对应 Task ID |
|---|---|---|---|
| 项目规则 | workflowhub/CONSTITUTION.md（只读参考，不改） | 不改 | — |
| workflow 定义 | 无 stage prompt 改动 | 不涉及 | — |
| reviewer contract | 无审查合同改动 | 不涉及 | — |
| schema | contracts/stage-result.contract.json（新增） | 改 | T012-T014 |
| runtime config | 无 | 不涉及 | — |
| knowledge/doc | 无 | 不涉及 | — |
| automation gates / CI / hooks | scripts/check-stage-quality.mjs（新增）+ scripts/run-checks.mjs（追加 checker）| 改 | T007-T011 |

## 3. 技术选型决策

| 决策项 | 候选方案 | 选择 | 理由 |
|---|---|---|---|
| review_invoked 来源 | 读 journal / 从 execution-record 推导 | execution-record 推导 | 用户拍板（decision-log 决策 1 note）；workflowhub 无 journal，不新建 |
| facts 写入时机 | recordSkeleton / updateOwnResult / updateStageImpact | updateOwnResult（timing 2）| 进程结束时才有 exit_code，timing 2 是"skill 结束"最小时机 |
| 边界确认记录落点 | execution-record.boundary_decisions / 新文件 | execution-record.boundary_decisions 键（已有 SOURCE_GATED_KEYS） | 复用 M4 已有键，不新建文件；写入需 source 声明（FR-EXECREC-004） |
| CI checker 结构 | 新 checker mjs / 内联进 run-checks | 新 check-stage-quality.mjs | 对齐已有 5 个 checker 各独立文件的模式（S7 一阶段一技能） |
| stage_result schema 格式 | AJV+JSON Schema / 手写 contract | 手写 contract（`{version, validated_by_stage, required_fields[]}`）| 对齐 M1-M3 validate-contract.mjs 先例，zero-AJV（decision-log 决策 3） |

## 4. 数据模型（涉及数据时必填）

**execution-record.facts**（复用 M4，仅写入内容，不改结构）：

- `exit_code`：integer，进程退出码，零开销读进程结束状态。
- `git_sha`：string，当次 git 提交哈希（`git rev-parse HEAD`）。
- `files_changed`：string[]，本次变更文件列表（`git diff --name-only HEAD`）。
- `review_invoked`：boolean，本 stage 是否调用过审查，从 execution-record 推导；推导不到时记 `false` + stderr 告警。

**boundary-confirm 记录**（轻量，写进 execution-record.boundary_decisions）：

- `boundary_state`：`"missing" | "failed" | "unknown"`
- `decision`：`"continue" | "retry" | "abandon"`
- `reason`：string（必填）
- `timestamp`：ISO 8601

**stage_result schema**（contracts/stage-result.contract.json）：

| 字段 | 类型 | 语义 |
|---|---|---|
| status | string（enum: success/failed/unknown）| stage 终态 |
| error_code | string | 失败类型标识符 |
| retryable | boolean | 此失败是否可安全重试 |
| facts | object | 当次 stage 相关物理事实**子集**（非全装 4 个） |
| missing_items | array | 缺少什么，供下游补 |
| user_decision | boolean | 是否有过人工介入决策 |
| reason | string | 面向 orchestrator 的解释（非 debug）|

## 5. API 接口

本期不涉及 REST API 修改。

新增的 JS 模块公开接口（精确签名）：

```js
// core/boundary-confirm.mjs
export function confirmBoundary(state, cfg)
// state: "missing" | "failed" | "unknown"
// cfg: { execution_id, taskMetricsPath, globalMetricsPath, project, taskId }
// returns: { decision, reason, timestamp }
// never throws; writes to boundary_decisions of execution-record

// metrics/collector.mjs (新增导出，在 updateOwnResult 之后)
export function collectFacts(execution_id, factSeed, cfg)
// factSeed: { exit_code?, git_sha?, files_changed?, review_invoked? }
// cfg: same as updateOwnResult cfg
// returns: void; on failure emits stderr warn, never throws
```

## 6. 项目文件结构

```
新增（workflowhub 仓）：
  scripts/check-stage-quality.mjs   — CI gate 扫描，统计质量类 blocking 数量；可红
  contracts/stage-result.contract.json — 七字段 stage_result 最小 schema
  core/boundary-confirm.mjs         — 三态边界确认接口，写进 boundary_decisions
  tests/fact-collector.test.mjs     — fact collector 适配层单测
  tests/boundary-confirm.test.mjs   — 三态边界确认单测
  tests/stage-quality.test.mjs      — CI gate 扫描单测（含故意注入反证）

修改（workflowhub 仓）：
  metrics/collector.mjs             — updateOwnResult 后追加 collectFacts 调用；新增 collectFacts 导出
  scripts/run-checks.mjs            — runAggregate() 追加第 6 个 checker（check-stage-quality）
```

## 7. 数据流向

```text
stage 执行结束
  → updateOwnResult(execution_id, patch, cfg)
  → collectFacts(execution_id, {exit_code, git_sha, files_changed, review_invoked}, cfg)
      → 采集成功：写 execution-record.facts（upsert）
      → 采集失败：stderr 告警，不 throw，流程继续

stage 交接遇三态
  → confirmBoundary(state, cfg)
      → 返回 {decision, reason, timestamp}
      → 写 execution-record.boundary_decisions（含 source 声明）

skill 失败时（可选）
  → 返回 stage_result = {status:"failed", error_code, retryable, facts, missing_items, user_decision, reason}
  → 下游读 error_code/retryable/missing_items 决策

CI npm run check
  → run-checks.mjs runAggregate()
  → check-stage-quality.mjs 扫描质量类 blocking 数量
      → 数量=0：exit 0
      → 数量>0：exit 1（CI 红）
```

## 8. 依赖情况

- **已有模块**：
  - `metrics/collector.mjs`——updateOwnResult（复用）/upsert（同模块直用；跨文件复用前加 export，见 A-002b）
  - `metrics/execution-record.mjs`——assembleExecutionRecord/SIX_KEYS/GAP（只读参考）
  - `scripts/check-path-guard.mjs`——findViolation（FR-BOUND-003 复用前加 export，见 A-005b）/PROTECTED_PATHS
  - `core/validate-contract.mjs`——validateContract（CI checker 校验 stage_result.contract.json）
  - `scripts/run-checks.mjs`——runChecker/runAggregate（追加第 6 个 checker）
- **npm 包**：无新增（node: 子进程 / fs 内置全够）。
- **API 端点**：无。

## 9. 与现有功能集成

- **接线点**：
  - `metrics/collector.mjs` 的 `updateOwnResult` 末尾追加 `collectFacts` 调用（最小钩子）。
  - `scripts/run-checks.mjs` 的 `runAggregate()` 第 6 条追加 `check-stage-quality` checker。
- **是否使用了最小 hook**：是。updateOwnResult 是"skill 结束"的唯一稳定时机；runAggregate 是唯一 CI 聚合入口。改动量：各 ≤5 行。

## 10. 上游合并安全评估

> M5 代码全在 workflowhub，不触碰 multica-agenthub upstream 文件。

| 上游文件 | 改动原因 | 是否不可避免 | 最小 hook 替代方案 |
|---|---|---|---|
| 无 | M5 全部落在 workflowhub 独立仓（含新增文件 + 对 collector.mjs/check-path-guard.mjs/run-checks.mjs 已有文件的最小改动：追加 collectFacts/checker、给 upsert/findViolation 加 export），均不在 multica-agenthub upstream | — | — |

- [x] 已检查禁止修改文件清单（auth.go、client.ts、types.ts 等 6 个文件未被触碰）。
- [x] 所有上游改动已标注"为什么不可避免"（此处无上游改动）。

## 11. Code Anchor 表 + 复用优先矩阵

| Anchor | 路径:符号（行号）| 当前职责 | 本次怎么用 | 禁止 |
|---|---|---|---|---|
| A-001 | `metrics/collector.mjs:updateOwnResult`（L150）| timing 2 skill 结束时 patch facts/tokens/duration | 追加 collectFacts 调用；签名不变 | 不重写、不挪位 |
| A-002 | `metrics/collector.mjs:upsert`（L80，当前未导出的内部函数）| 写 JSONL metrics 文件 | collectFacts 在 collector.mjs 同模块内直接用 upsert（无需 import）| 不复制出去 |
| A-002b | `metrics/collector.mjs:upsert`（L80，**Modify**）| 同上 | boundary-confirm.mjs 跨文件复用前置：`function upsert` → `export function upsert`，仅加关键字、零行为变更，使独立文件可 import | 不改函数体、不改签名 |
| A-003 | `metrics/execution-record.mjs:assembleExecutionRecord`（L42）| 从 seed 组装六键执行记录 | 只读参考；M5 不改此函数 | 不改签名 |
| A-004 | `metrics/execution-record.mjs:SIX_KEYS / GAP`（L20/L35）| 六键顺序 + GAP 哨兵 | collectFacts 写入 facts 键时遵循相同顺序；GAP 用作 review_invoked 推导失败哨兵 | 不另定义同名常量 |
| A-005 | `scripts/check-path-guard.mjs:findViolation`（L97，当前未导出的内部函数）| 判断路径是否落入 PROTECTED_PATHS | FR-BOUND-003 边界确认协同：confirmBoundary 调用 findViolation 判不可逆操作类型 | 不复制 PROTECTED_PATHS |
| A-005b | `scripts/check-path-guard.mjs:findViolation`（L97，**Modify**）| 同上 | boundary-confirm.mjs 跨文件复用前置：`function findViolation` → `export function findViolation`，仅加关键字、零行为变更（不影响 check-path-guard CLI 行为），使独立文件可 import | 不改函数体、不改 CLI |
| A-006 | `scripts/run-checks.mjs:runChecker / runAggregate`（L174）| 聚合运行 5 个 checker | 追加第 6 个 checker 调用（check-stage-quality）| 不改已有 checker 注册顺序 |
| A-007 | `core/validate-contract.mjs:validateContract`（全文）| 手写 contract 校验（zero-AJV）| check-stage-quality.mjs 用此校验 stage-result.contract.json | 不引入 AJV |
| A-008 | `contracts/execution-record.contract.json`（格式参考）| version/validated_by_stage/required_fields[] 极简格式 | stage-result.contract.json 对齐此格式 | 不引入 $schema |

**复用优先矩阵**：

| 功能点 | 优先策略 | 已有候选 | 选择理由 |
|---|---|---|---|
| facts 写入 | 适配已有 | A-001 updateOwnResult | 最小时机钩子，5 行内完成 |
| 边界确认记录落盘 | 适配已有 | A-002b export 后的 upsert（boundary_decisions 键）| 已有 upsert 通用，加 export 后跨文件 import，仅换 key |
| 不可逆操作检测 | 复用 | A-005b export 后的 findViolation | FR-BOUND-003 复用：加 export 后跨文件 import，不复制 |
| CI checker | 复用模式新增文件 | A-006 runChecker 模式 | 每个 checker 独立文件是既有约定 |
| schema 格式校验 | 复用 | A-007 validateContract | zero-AJV 先例不破 |
| stage_result contract | 新增 | contracts/stage-result.contract.json | 七字段无现有同形 contract；格式对齐已有 |
| boundary-confirm 模块 | 新增 | core/boundary-confirm.mjs | 三态接口无现有同形模块；≤50 行 |

## 12. 实现风险点和 phase 级回滚

| Phase | 风险 | 预防措施 | 回滚方式 |
|---|---|---|---|
| T001 fact collector | collectFacts throw 导致 updateOwnResult 后续被中断 | try/catch + stderr warn，保证 never-throw；测试故意让 git 命令失败验证告警路径 | 删 collectFacts 调用行（1 行 rollback）|
| T002 boundary-confirm | confirmBoundary 写入 boundary_decisions 缺 source 字段违反 FR-EXECREC-004 | 写入时带 `{source:"boundary-confirm@m5"}` | 删 core/boundary-confirm.mjs + 测试 |
| T003 stage_result schema | 七字段漏写或类型不对 | 对照 FR-RESULT-002 逐字段核 + CI 格式校验测试 | 改 contracts/stage-result.contract.json |
| T004 CI gate | check-stage-quality 恒绿（假绿）| 故意注入质量 blocking 验 exit 1；run-checks.mjs self-test 覆盖 | 删 check-stage-quality 注册行 |
| 全局 | "只记不挡"被歪做 blocking | V2/V6 防复发验收；check-stage-quality 专门扫此类违规 | spec 层 FR-GATE-001/002 是铁律，任何 blocking 即 CI 红 |

## 13. 验证策略

### 证据契约预声明（evidence-contract，机器可解析，apply 阶段填真 git_sha）

> 4 个交付单元各一个块（性质不同不合并）。RED = 实现前断言失败，GREEN = 实现后通过。七字段对齐 `harness/plan-evidence-contract.schema.json`，git_sha 为 plan 阶段占位（apply 阶段采证时填真值），timestamp 为预声明时刻。

单元1 — fact collector（FR-FACT-001/002/003）：

```evidence-contract
{
  "red": {
    "command": "npm test -- --reporter=verbose --testNamePattern=\"fact collector writes 4 physical facts\"",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "a3864c5",
    "exit_code": 1,
    "timestamp": "2026-06-23T08:44:58Z",
    "phase": 1,
    "mode": "RED"
  },
  "green": {
    "command": "npm test -- --reporter=verbose --testNamePattern=\"fact collector writes 4 physical facts\"",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "a3864c5",
    "exit_code": 0,
    "timestamp": "2026-06-23T08:44:58Z",
    "phase": 1,
    "mode": "GREEN"
  },
  "evidenceSink": "$TASK_DIR/apply/evidence/v1-fact-collector.txt",
  "affectedTests": [
    "tests/metrics-collector.test.mjs",
    "tests/fact-collector.test.mjs"
  ]
}
```

单元2 — stage 边界确认（FR-BOUND-001/002/003）：

```evidence-contract
{
  "red": {
    "command": "npm test -- --reporter=verbose --testNamePattern=\"boundary-confirm three states pass-through\"",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "a3864c5",
    "exit_code": 1,
    "timestamp": "2026-06-23T08:44:58Z",
    "phase": 2,
    "mode": "RED"
  },
  "green": {
    "command": "npm test -- --reporter=verbose --testNamePattern=\"boundary-confirm three states pass-through\"",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "a3864c5",
    "exit_code": 0,
    "timestamp": "2026-06-23T08:44:58Z",
    "phase": 2,
    "mode": "GREEN"
  },
  "evidenceSink": "$TASK_DIR/apply/evidence/v3-boundary.txt",
  "affectedTests": [
    "tests/boundary-confirm.test.mjs"
  ]
}
```

单元3 — gate 质量扫描 CI（FR-GATE-001/002/003/004 + V6 防复发）：

```evidence-contract
{
  "red": {
    "command": "node scripts/check-stage-quality.mjs --self-test",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "a3864c5",
    "exit_code": 1,
    "timestamp": "2026-06-23T08:44:58Z",
    "phase": 3,
    "mode": "RED"
  },
  "green": {
    "command": "node scripts/check-stage-quality.mjs --self-test",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "a3864c5",
    "exit_code": 0,
    "timestamp": "2026-06-23T08:44:58Z",
    "phase": 3,
    "mode": "GREEN"
  },
  "evidenceSink": "$TASK_DIR/apply/evidence/v2-gate-scan.txt",
  "affectedTests": [
    "scripts/check-stage-quality.mjs",
    "core/__tests__/run-checks.test.mjs"
  ]
}
```

单元4 — stage_result 契约（FR-RESULT-001/002/003/004）：

```evidence-contract
{
  "red": {
    "command": "npm test -- --reporter=verbose --testNamePattern=\"stage_result contract seven fields\"",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "a3864c5",
    "exit_code": 1,
    "timestamp": "2026-06-23T08:44:58Z",
    "phase": 4,
    "mode": "RED"
  },
  "green": {
    "command": "npm test -- --reporter=verbose --testNamePattern=\"stage_result contract seven fields\"",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "a3864c5",
    "exit_code": 0,
    "timestamp": "2026-06-23T08:44:58Z",
    "phase": 4,
    "mode": "GREEN"
  },
  "evidenceSink": "$TASK_DIR/apply/evidence/v4-stage-result.txt",
  "affectedTests": [
    "tests/stage-result-contract.test.mjs",
    "core/__tests__/validate-contract.test.mjs"
  ]
}
```

- [x] TypeScript / Go 静态检查：不涉及（全 .mjs），改为 `npm run check`（markdownlint + verify-structure + run-checks）。
- [x] 关键 happy path 可手动或自动验证（V1/V3/V4）。
- [x] 关键 failure paths 可验证（V2/V6 防复发三坑）。
- [x] 每个 task 的验证命令可执行（见下方四字段结构）。

### 四类标准

- [x] **交付标准（done）**：
  - T001：`execution-record.facts` 在 updateOwnResult 后含 exit_code/git_sha/files_changed/review_invoked（或告警标记），无新文件新建。
  - T002：`confirmBoundary("missing"/"failed"/"unknown", cfg)` 各返回合法 decision + reason，并在 execution-record.boundary_decisions 有可查记录。
  - T003：`contracts/stage-result.contract.json` 存在，validateContract 通过七字段校验，CI 格式校验报绿。
  - T004：`npm run check` 跑 check-stage-quality 报零质量 blocking；故意注入后报红。
- [x] **异常标准（边界）**：
  - fact 采集失败（git 命令失败）：告警 stderr，facts.git_sha = null + 标"推导失败"，updateOwnResult 正常返回。
  - confirmBoundary 超时/拒绝：记 `{decision:"continue", reason:"timeout-no-confirm"}`, 推进不 BLOCK。
  - stage_result 下游读取失败：调用方 try/catch，裸 throw 场景不强制改写（FR-RESULT-004）。
- [x] **测试标准（双栏可跑命令）**：见下方"验证四字段结构"。
- [x] **代码标准**：遵循 workflowhub/CONSTITUTION.md + eslint（无额外代码标准）。lint error 是硬门。

### 验证四字段结构

**V1 不卡死（FR-FACT-001/003 + FR-GATE-002）**

- **验证目标**：facts 写入失败不 BLOCK 推进，遗漏有迹可查。
- **gate_cmd**：
  ```sh
  cd /Users/Hugh/Hugh/Project/workflowhub && npm test -- --reporter=verbose --testNamePattern="fact collector"
  ```
- **expected_exit**：`0`
- **evidence_path**：`$TASK_DIR/apply/evidence/v1-fact-collector.txt`
- **display_cmd**：`grep -E "PASS|FAIL" $TASK_DIR/apply/evidence/v1-fact-collector.txt`

**V2 质量门=0（FR-GATE-001）**

- **验证目标**：CI 扫描质量类 blocking 数量=0；故意注入后变红。
- **gate_cmd**：
  ```sh
  set -o pipefail; cd /Users/Hugh/Hugh/Project/workflowhub && node scripts/run-checks.mjs 2>&1 | tee $TASK_DIR/apply/evidence/v2-gate-scan.txt; status=${PIPESTATUS[0]}; printf 'exit:%s\n' "$status" >> $TASK_DIR/apply/evidence/v2-gate-scan.txt; exit $status
  ```
- **expected_exit**：`0`（正常）；注入后期望 `1`（反证）
- **evidence_path**：`$TASK_DIR/apply/evidence/v2-gate-scan.txt`
- **display_cmd**：`grep "quality_blocking_count" $TASK_DIR/apply/evidence/v2-gate-scan.txt`

**V3 三态放行（FR-BOUND-001/002）**

- **验证目标**：缺失/失败/unknown 三态各能选继续并记录；须真跑活流程。
- **gate_cmd**：
  ```sh
  cd /Users/Hugh/Hugh/Project/workflowhub && npm test -- --reporter=verbose --testNamePattern="boundary-confirm"
  ```
- **expected_exit**：`0`
- **evidence_path**：`$TASK_DIR/apply/evidence/v3-boundary.txt`
- **display_cmd**：`grep -E "missing|failed|unknown" $TASK_DIR/apply/evidence/v3-boundary.txt`

**V4 错误传播（FR-RESULT-004）**

- **验证目标**：skill 返回 status=failed，下游能读 error_code/retryable/missing_items 三字段。
- **gate_cmd**：
  ```sh
  cd /Users/Hugh/Hugh/Project/workflowhub && npm test -- --reporter=verbose --testNamePattern="stage_result"
  ```
- **expected_exit**：`0`
- **evidence_path**：`$TASK_DIR/apply/evidence/v4-stage-result.txt`
- **display_cmd**：`grep -E "error_code|retryable|missing_items" $TASK_DIR/apply/evidence/v4-stage-result.txt`

**V5a 字节数可算（V5a 观察项）**

- **验证目标**：fact 采集对主流程上下文新增字节数能算出，无额外人工交互。
- **gate_cmd**：
  ```sh
  cd /Users/Hugh/Hugh/Project/workflowhub && npm test -- --reporter=verbose --testNamePattern="fact bytes"
  ```
- **expected_exit**：`0`
- **evidence_path**：`$TASK_DIR/apply/evidence/v5a-bytes.txt`
- **display_cmd**：`grep "bytes_added" $TASK_DIR/apply/evidence/v5a-bytes.txt`

**V6 防复发三坑（FR-GATE-001/002/FR-RESULT-003）**

- **验证目标**：三类违规注入后 CI 能检出（fact blocking / 运行时 schema gate / 不可测 gate）。
- **gate_cmd**：
  ```sh
  cd /Users/Hugh/Hugh/Project/workflowhub && node scripts/check-stage-quality.mjs --self-test > $TASK_DIR/apply/evidence/v6-antiregression.txt 2>&1; status=$?; printf 'exit:%s\n' "$status" >> $TASK_DIR/apply/evidence/v6-antiregression.txt; exit $status
  ```
- **expected_exit**：`0`（self-test 内含故意注入反证，期望全通过）
- **evidence_path**：`$TASK_DIR/apply/evidence/v6-antiregression.txt`
- **display_cmd**：`grep -E "CAUGHT|PASSED|FAILED" $TASK_DIR/apply/evidence/v6-antiregression.txt`

### 已有接口签名锚点

| 锚点 | 对象 | 当前接口签名 |
|---|---|---|
| SIG-001 | `metrics/collector.mjs:updateOwnResult` | `(execution_id: string, patch: object, cfg: {taskMetricsPath, globalMetricsPath, tokenSourceReachable?}) → object\|null` |
| SIG-002 | `metrics/collector.mjs:recordSkeleton` | `(seed: {execution_id, skill_or_stage, stage, skill_version, executed, tokens, duration_ms, rework_rounds, human_intervention, friction_ref, actions, stage_unit}, cfg) → object` |
| SIG-003 | `scripts/check-path-guard.mjs:findViolation` | `(changedFile: string) → string\|null`（返回命中的 protected path 或 null） |
| SIG-004 | `scripts/run-checks.mjs:runChecker` | `(name: string, args: string[]) → number`（返回 exit code）|
| SIG-005 | `core/validate-contract.mjs:validateContract` | `(output: object, contract: object) → {valid: boolean, errors: string[]}` — 注意参数顺序：output 在前，contract 在后（L8 实测确认）|
| SIG-006 | `metrics/execution-record.mjs:assembleExecutionRecord` | `(seed: {execution_id, progress?, facts?, metrics?, feedback?, boundary_decisions?, trace_index?, consumers?, ext?}) → object` |
| SIG-007 | `metrics/collector.mjs:upsert`（A-002b export 后）| `(path: string, execution_id: string, patch: object, cfg: object) → void`（按文件就地 upsert JSONL 行，L80 实测确认）|

> 所有 SIG 锚点已在 plan 阶段实测确认，apply 阶段直接引用，不得更改签名。

### UI 实现合同

本期不涉及 UI。

## 14. 自查 5 条（stage 定义要求，写到 plan.md 末尾）

- [x] **宪法门禁逐条勾选**（含 CLAUDE.md 工程硬规则）：见第 2 章，CONSTITUTION.md F3-F9/Q1/Q2 + multica 工程硬规则全部对照勾选。
- [x] **每个 task 引用了至少一个 FR 编号**：tasks.md T001-T014 行首均带 `[FR-XXX]`，14 个 FR 全覆盖（FR-FACT×3/BOUND×3/GATE×4/RESULT×4）。
- [x] **tasks.md 每个 phase 有 Goal/Files/Tasks/Verify/Knowledge/STOP 六节**：Phase 1-4 经亲核各六节齐全，每 phase 声明 `ui_change: false`。
- [x] **上游合并安全评估完成**：见第 10 章，M5 代码全在 workflowhub 独立仓，零触碰 multica-agenthub upstream / 6 个禁止修改文件。
- [x] **不适用段已标注 N/A 并写理由**：API Contracts（无 REST 改动）/ UI 实现合同（无 UI）已标 N/A；Data Model 实写（涉及 facts/boundary/stage_result 数据结构）；证据契约 + 验证策略实写（落仓库改动，不 N/A）。
