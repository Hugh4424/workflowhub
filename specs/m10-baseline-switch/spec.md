# M10 — 基线映射 + 自举切换

## 1. 问题陈述

旧 agenthub 和新 workflowhub 之间没有度量桥——切换前无数据支撑。旧系统没有明确的冻结/退役规则。

## 2. 背景、目标和边界

**背景**：workflowhub M1-M9 已交付，五段薄骨架能跑但从未端到端度量。agenthub M0 教训：60% token 花在 gate/流程维护，单 checkpoint 死循环 13 轮烧 80 分钟。

**目标**：建一座用完能拆的桥——从 4 个 agenthub 历史 task journal 算 5 项流程指标基线，workflowhub 跑一次对照，写清旧系统冻结/退役/迁移/回滚规则。

**边界**：只建桥不加路。M10 之后 workflowhub 自举切换，agenthub 逐步退役。

## 3. 用户场景和用例

**正常场景**：
1. 开发者运行基线脚本，输出 4 个历史 task 的 5 项指标均值
2. workflowhub 端到端跑一次 verify-code，产 task-metrics.jsonl
3. 对照报告显示 例如 5 项中 4 项不差于基线，满足 ≥3 项达标规则，结论"达标"

**失败场景**：
4. 基线脚本因 journal 格式异常报错——输出明确错误行号和缺失字段
5. workflowhub collector 接线后 E2E 跑不通——报错不静默吞

**边界场景**：
6. 某历史 task 的 journal 缺少某 stage 的 stage_exit 事件——该 stage 的 executed 记为 false
7. apply 阶段 phase 数为 0——test_execution_rate 输出 null + unable_to_derive
8. 对照报告中 5 项全差于基线——报告结论明确写"不达标"，不模糊

## 4. 功能需求

### FR-BASE（基线计算）
- FR-BASE-001：agenthub-baseline.mjs 从 4 个历史 task 的 journal.jsonl 读取事件流，按 5 项指标推导规则计算 5 项指标
  - Given 4 个 task 的 journal 路径（见下），When 运行脚本，Then 输出每个 task 的 5 项指标值及 4 task 均值

**4 个基线 task**（绝对路径前缀：/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/）：
| task_id | 事件数 | 审查轮数 | 状态 |
|---------|:------:|:--------:|------|
| review-cost-deep-reduction | 1450 | ~4 | completed |
| ns1b-attribution-freeze-fix | 1458 | 5 | review_intake_required |
| gate-debloat-and-admission | 1445 | 4 | ready_to_advance |
| test-quality-executor-system | 1371 | 3 | completed |

**5 项指标固定映射表**：

| metric_name | journal event | workflowhub field | formula | polarity | source_type | missing_behavior |
|-------------|--------------|-------------------|---------|:--------:|-------------|---------|
| missed_step_rate | stage_enter/exit | executed | 缺 stage_exit 的 stage 数/5 | ↓ | proxy | null→skip |
| test_execution_rate | phase_pre_review | executed | 有 pre_review 的 phase 数/apply 总 phase 数 | ↑ | weak_proxy | denom=0→null |
| review_execution_rate | checkpoint_request | executed | 有 checkpoint_request 的 stage 数/4 | ↑ | proxy | denom=0→null |
| rework_rounds | checkpoint_request | rework_rounds | mean(max(0, count-1)) per stage | ↓ | proxy | no review→0 |
| rework_proxy_count | checkpoint_request | rework_rounds | sum(max(0, count-1)) all stages | ↓ | weak_proxy | no review→0 |

- FR-BASE-002：单个 task "达标"判据 = 五局三胜（5 项中 ≥3 项不差于基线）+ 人工异常条款
  - Given task 对照报告，When 5 项中 ≥3 项方向不差于基线，Then 判"达标"
  - Given 任一核心指标（missed_step_rate 或 test_execution_rate）值差于基线 ×2 以上，When 对照，Then 结论降为"需人工复核"（不直接判达标或不达标）
  - Given test_execution_rate 的 ↑ better 方向，When workflowhub 值显著低于基线（倒退），Then 判定为 bad
- FR-BASE-003：每项指标在输出中标注 source_type（direct/proxy/weak_proxy）
  - Given 任一指标值，When 查看输出，Then source_type 字段非空
- FR-BASE-004：agenthub-baseline.mjs 是独立文件，不 import 或修改 baseline.mjs 核心逻辑
  - Given baseline.mjs 原始内容，When 对比修改前后，Then baseline.mjs 的 hash 不变

### FR-MAP（字段映射）
- FR-MAP-001：字段映射样例覆盖全部 5 项指标
  - Given 映射表，When 检查列数，Then 每行含 metric_name/journal_event/workflowhub_field/formula/polarity/source_type/missing_behavior 七列
- FR-MAP-002：rework_proxy_count 标注为 weak_proxy，附说明"所有 stage 返工轮次之和，不代表真实缺陷数"
  - Given 映射表 rework_proxy_count 行，When 查看 source_type，Then 值为 weak_proxy

### FR-COLL（collector 接线）
- FR-COLL-001：verify-code 目录下新增 metrics-writer.mjs
  - Given verify-code E2E 运行，When 执行完毕，Then task-metrics.jsonl 存在且含一条合法记录
- FR-COLL-002：metrics-writer.mjs 不修改 host-adapter.mjs 或 build-code/make-decision 代码
  - Given host-adapter.mjs 原始内容，When 对比修改前后，Then hash 不变

### FR-FREEZE（冻结退役）
- FR-FREEZE-001：freeze-and-retire.md 定义两段式退役：N₁=3 连续达标→只读 fallback；N₂=5 连续达标→全量退役
  - Given task-metrics.jsonl 中有 N 个自举 task 的对照记录，When 人工判定，Then 能明确判断当前处于哪个阶段
- FR-FREEZE-002：退役条件不设自动 gate，由人判定
  - Given 对照报告，When 人判断是否退役，Then 无自动 CI 阻断

### FR-MIG（迁移回滚）
- FR-MIG-001：migration-and-fallback.md 含四分支：switch（继续用 workflowhub）/ hold（暂停排查）/ rollback（切回 agenthub）/ manual_review（任一核心指标倒退2倍→人工复核）+"现跑 task"范围 = agenthub harness 中 state=active 且 currentStatus≠completed 的 task（D8）
  - Given 对照报告 bad_count 值，When 查判定表，Then 能确定走哪个分支
- FR-MIG-002：任一核心指标倒退 2 倍以上→manual_review
  - Given missed_step_rate > 基线×2 或 test_execution_rate < 基线/2（↑better 指标，值显著偏低=倒退），When 对照，Then 结论降为"需人工复核"
- FR-MIG-003：回滚步骤写成可执行操作列表
  - Given rollback 判定，When 按步骤执行，Then 系统切回 agenthub 且 workflowhub 停止

### FR-CI（持续集成）
- FR-CI-001：CI 冒烟验证 agenthub-baseline.mjs 可执行
  - Given CI 环境，When 运行 node agenthub-baseline.mjs --smoke，Then exit=0
- FR-CI-002：CI 校验字段映射样例 schema
  - Given 映射表 JSON，When 校验 schema，Then 7 列齐全且 source_type 值在白名单内

## 5. 模块划分

### M1: agenthub-baseline.mjs（独立脚本）
- 位置：workflowhub metrics/ 同级或 scripts/
- 职责：读 journal.jsonl → 按 5 项推导规则算 5 项指标 → 出对照报告
- 测试边界：单元测试验证 5 项推导规则；smoke 测试验证脚本可执行
- 输入：4 个 journal 文件路径
- 输出：对照报告（含 5 项指标 + source_type + source_ref）

### M2: metrics-writer.mjs（collector 接线）
- 位置：workflowhub workflows/verify-code/
- 职责：导入 metrics/collector.mjs，在 verify-code 运行前后调 recordSkeleton + updateOwnResult
- 测试边界：smoke 测试验证 task-metrics.jsonl 产出合法记录
- 约 30 行

### M3: freeze-and-retire.md（文档）
- 位置：workflowhub docs/ 或 specs/m10-baseline-switch/
- 职责：冻结规则 + 两段式退役条件 + 可复算判定方法
- 测试边界：N/A（纯文档）

### M4: migration-and-fallback.md（文档）
- 位置：workflowhub docs/ 或 specs/m10-baseline-switch/
- 职责：现跑 task 四分支处置 + 切换步骤 + 回滚步骤 + fallback 触发信号
- 测试边界：N/A（纯文档）

### M5: 字段映射样例（文档附件）
- 位置：对照报告附件或独立文件
- 职责：5 行×7 列映射表 + 推导说明
- 测试边界：CI schema 校验

## 6. 关键实体

### MetricsRecord（已有，M4 定义）
12 核心字段：execution_id, skill_or_stage, stage, skill_version, executed, tokens, duration_ms, rework_rounds, human_intervention, friction_ref, action_count, stage_unit

### BaselineReport（新增）
| 字段 | 类型 | 说明 |
|------|------|------|
| metric_name | string | 指标名 |
| agenthub_value | number | agenthub 基线值 |
| workflowhub_value | number | workflowhub 对照值 |
| direction | ↑/↓ | 更好方向 |
| verdict | ✓/✗ | 是否不差于基线 |
| source_type | direct/proxy/weak_proxy | 推导类型 |
| source_ref | string | journal path + event id 或 metrics line |

### RollbackDecision（新增）
| 字段 | 类型 | 说明 |
|------|------|------|
| bad_count | number | 差于基线的指标数 |
| reviewer_judgment | string | 根因是否是 workflowhub |
| action | switch/hold/rollback/manual_review | 判定动作 |

## 7. 数据和生命周期

本期不涉及（无新增持久化数据存储；task-metrics.jsonl 复用 M4 collector 既有双写路径；对照报告为一次性输出文件）

## 8. 兼容性预留

- 基线为固定快照（M1-M3 + 4 agenthub task），不滚动更新
- agenthub-baseline.mjs 为独立文件，agenthub 退役后可直接删除
- 字段映射表 7 列结构预留扩展列（M14 加趋势数据时追加）

## 9. 不做和隐性必达

**不做**：
- 不扩展 baseline.mjs 核心
- 不建三层抽象（adapter→baseline→report）
- 不做自动 gate 对照
- 不做实时仪表盘/趋势线/雷达图
- 不修 host-adapter.mjs 宿主层接线
- 不碰 build-code/make-decision 的 collector 接线

**隐性必达**：
- 任何新 gate/校验须过"真实收益>维护成本"评估
- 对照报告不因单个指标无法推导而整体失败
- agenthub-baseline.mjs 在 agenthub 退役后能一行 git rm 删干净

## 10. 验收清单及未决问题

### 验收清单

| # | 标准 | 验证方式 |
|---|------|---------|
| AC1 | node agenthub-baseline.mjs 跑出 4 task × 5 指标 + 均值 | 手动执行 |
| AC2 | verify-code E2E 产 task-metrics.jsonl + 对照报告 | 手动执行 |
| AC3 | 字段映射 5 行×7 列齐全 | CI schema 校验 |
| AC4 | freeze-and-retire.md N₁=3/N₂=5 可复算 | 人工审查 |
| AC5 | migration-and-fallback.md 四分支完整 | 人工审查 |
| AC6 | CI 冒烟通过 | CI 自动 |
| AC7 | baseline.mjs hash 不变 | CI 自动 |
| AC8 | 对照报告每行有 source_type + source_ref | 人工审查 |

### 未决问题
- A2：M9 verify-code 端到端能否跑通（collector 接线后）——M10 apply 先跑最小 E2E 验证
- A4：等效推导规则误差是否可接受——用 4 个历史 task 抽样复核 proxy 规则

## 11. 影响范围（业务性质）

- **旧 agenthub**：冻结→退役，不再接新功能。M10 是退役决策的数据依据
- **workflowhub**：metrics/ 目录新增独立脚本（用完可删）；verify-code 新增 metrics-writer.mjs
- **现跑 agenthub task**：需按 migration-and-fallback.md 四分支处置
- **后续 M11-M15**：依赖 M10 的基线对照数据支撑自举切换决策
