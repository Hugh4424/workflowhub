# 实施计划：m13e-verify-code-deepening

**Task ID**: `m13e-verify-code-deepening` | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification `specs/m13e-verify-code-deepening/spec.md`
**Status**: Draft

---

## 概述

本计划为 verify-code 阶段打 7 个补丁（D1-D7），提升证据可信度与放行判断可靠性。改动范围：新建 `skills/test-strategy/SKILL.md`、扩展 `workflows/verify-code/SKILL.md`（插入 trace-check、test-strategy 调用、stage-summary JSONL 写入、L3 铁律、三色门）、扩展 `freshness.mjs` 至四段校验。所有改动仅限 verify-code 阶段及其子技能，不触碰 build-code / build-plan / make-decision / build-spec。

---

## Technical Context

**Language/Version**: Markdown, Node.js v20（freshness.mjs 为 ESM）
**Primary Dependencies**: isolated-browser-qa skill（D4 复用，不改造；须在 `workflows/verify-code/isolated-browser-qa.md` 中补充机器可读 JSON 输出契约，含 git_sha/flaky_failure 字段）; stage-summary JSONL（D5：无独立 stage-summary skill，直接在 workflows/verify-code/SKILL.md 中 inline append 写入 evidence/stage-summary.jsonl）
**Storage**: Filesystem `specs/m13e-verify-code-deepening/`；运行时产物写入 `evidence/`
**Testing**: 手动执行 verify-code 阶段；机器可查字段通过 JSON/YAML 解析验证
**Target Platform**: workflowhub agent runtime
**Project Type**: workflow orchestration skill
**Performance Goals**: N/A（无延迟要求）
**Constraints**: 不修改 L1/L2 测试逻辑本身；不改造 isolated-browser-qa；stage-result status 破坏性变更须向下游说明
**Scale/Scope**: 3 文件修改 + 1 文件新建，~400 行

---

## Constitution Check

### F1 薄核心
[x] 新增逻辑全部下沉至 test-strategy skill（独立子代理上下文）；verify-code 主技能只做调用、读结果、判推进，不含业务逻辑；trace-check 和 freshness 扩展均以 JSON 文件接口与主技能交互，核心改动牵连面最小。

### F2 窄契约
[x] verify-code ↔ test-strategy：test-strategy.md YAML front-matter 文件接口；verify-code ↔ freshness.mjs：mtime_violations[] JSON 数组；verify-code ↔ trace-check：trace-check-report.json。三条接口均窄且明确，不暴露内部实现；变更可追溯回 FR。

### F3 物理事实靠机器校验但不阻断
[x] trace-check 和 freshness.mjs 客观采集物理事实（exit_code、git_sha、content_hash、mtime），结果写入 JSON 文件；采集本身不阻断推进，颜色门仅决定 escalate 路径，推进权在人。

### F4 质量靠异源审查与人而非阻断式质量门
[x] test-strategy 在独立子代理上下文产出，verify-code 主技能不自审；颜色门基于机器硬条件，仅 escalate 不阻断；red/yellow 均等人确认，不设阻断式质量门。

### F5 gate 谨慎添加、出事再补、无用则移除
[x] 本次仅补真实暴露问题对应的 7 个补丁（D1-D7），每个补丁均有对应 FR 支撑；未预先堆砌额外关卡；无现有关卡被删除。

### F6 统一外置执行记录
[x] stage-summary.jsonl 以 append 写追踪执行轨迹（start/end 两条）；trace-check-report.json、l3-e2e-report.json、mtime_violations[] 均为外置可回溯记录；统一写入 evidence/ 目录。

### F7 推进与不可逆操作不自动越过人
[x] red/yellow 均 escalate 后等人，不自动放行；iron-law 校验失败直接 red 并等人确认；stage-result 状态变更由人决策，不可逆操作不自动执行。

### F8 简单优先
[x] L3 直接复用 isolated-browser-qa（D4），不重新设计执行器；freshness.mjs 扩展现有文件而非新建；stage-summary 复用已有 skill（D5）；无冗余抽象，出错明确报告不兜底。

### F9 可证伪、不假绿
[x] 所有校验在"实际为假"时真报失败：freshness 违反写 mtime_violations[]；AC 缺 route 写 MISSING_ROUTE: 错误行；git_sha 不匹配触发 red；缺数据记入 missing_ac_coverage[] 而非假通过。

### F10 自动化按真实收益添加，不为"机器可校验"本身堆基建
[x] freshness.mjs 四段扩展、trace-check、stage-summary 均对应真实暴露的证据可信度问题；未为"机器可校验"本身添加 CI 门或 schema；L3 复用已有 isolated-browser-qa 不造轮子。

### Q1 记事实而非阻断
[x] 所有检查结果（mtime_violations[]、missing_ac_coverage[]、stage-summary 行数、l3-e2e-report.json）均落盘记录；颜色门仅决定 escalate 路径，不卡死流程，推进权在人。

### Q2 gate 三类划分
[x] 入口校验：task-id 缺失立即报错停止（必需产物存在性）；记录采集：freshness/trace-check/stage-summary 均为采集型，不阻断；人工确认：red/yellow 均 escalate 等人，三类分工明确不混用。

### Q3 异源审查加人工把关
[x] test-strategy skill 在独立子代理上下文产出；颜色门基于机器硬条件（非 LLM 主观打分）；verify-code 不对自身产物打分；trace-check 和 freshness 输出可供第三方验证的 JSON。

### S1 能用外部就不造轮子
[x] L3 E2E 直接调用 isolated-browser-qa（D4，不改造）；stage-summary 直接调用已有 skill（D5，不改造）；未为这两个能力另起实现。

### S2 外部技能可针对项目改造合宪
[x] isolated-browser-qa 和 stage-summary 均以调用方式复用，本次未发现需改造之处；freshness.mjs 属自研扩展，不适用本条，登记 N/A。

### S3 迭代时保持最新并就地检查
[x] 本迭代已确认 isolated-browser-qa 和 stage-summary 接口无版本变化；test-strategy 为新建 skill，来源路径在其 SKILL.md 中声明。

### S4 自定义技能必须有指标系统
[x] test-strategy skill 输出 test-strategy.md 含 ac_routes 字段，供 verify-code 读取并记入 trace-check-report.json；执行结果写入 evidence/ 统一执行记录底座，可后续评估。

### S5 自定义技能方便子代理调用、省主上下文
[x] test-strategy skill 以子代理方式调用（独立上下文），verify-code 主技能只读结论文件；trace-check 和 freshness.mjs 均输出文件接口，主上下文只读 JSON 摘要。

### S6 自定义技能参考市面方案、不闭门造车
[x] test-strategy skill 设计参考 AC-to-route 映射的通用测试策略模式；trace-check 参考 evidence traceability 标准实践；freshness 四段校验参考 content_hash + git_sha 交叉验证方案。

### S7 一阶段一技能、一工作流一文件夹
[x] 新建 test-strategy skill 落 `skills/test-strategy/SKILL.md`，独立目录；verify-code 修改限于 `workflows/verify-code/` 目录；运行时产物落 `evidence/`；核心工作流目录零改动。

### S8 自定义技能可独立调用、可搬运
[x] test-strategy skill 输入契约自洽（ui_change, risk_level, L2报告摘要），不绑死 verify-code 环境，可在其他 stage 独立调用；freshness.mjs 为可独立运行的 Node.js ESM 模块；isolated-browser-qa 不改造保持原有可搬运性。

**Constitution Check Result**: 21/21 clauses addressed. 21 pass, 0 fail.

---

## Project Structure

### Documentation (this feature)

```text
specs/m13e-verify-code-deepening/
├── spec.md              Build-spec output (authoritative)
├── research.md          Phase 0 research output
├── data-contracts.md    Cross-boundary data contracts
├── plan.md              This file (spec-plan output)
├── tasks.md             spec-tasks output
└── cross-artifact-analysis.md  spec-analyze output
```

### Source Code (repository root)

```text
skills/
├── test-strategy/
│   └── SKILL.md                  NEW — D2 独立 test-strategy skill
└── verify-code/
    ├── SKILL.md                  MODIFY — 插入 D1/D2/D4/D5/D6/D7 步骤
    └── freshness.mjs             MODIFY — D3 四段校验扩展
```

**Structure Decision**: test-strategy 作为独立 skill 落 `skills/test-strategy/`，符合宪法 S7（每个阶段一个独立技能）；freshness.mjs 扩展而非新建，保留向后兼容的 mtime_violations[] 接口（S2 窄接口）。

---

## Complexity Tracking

**D7 三色 schema 破坏性变更**
WHY: 需要区分"明确失败"（red）和"偶发不稳定"（yellow），二色无法表达。
TRADEOFF: 下游消费者需适配新增的 yellow 值，有改动成本。
JUSTIFICATION: 不引入 yellow 则偶发失败只能走 red 路径，会导致误阻断；三色是最小可行扩展，不引入新状态机。

**D2 test-strategy 子代理**
WHY: 需要独立上下文执行策略推导，禁止自审（宪法 Q3）。
TRADEOFF: 子代理调用增加超时/失联风险。
JUSTIFICATION: 独立上下文是宪法硬要求；超时走 yellow 降级路径，不阻断。

---

## Implementation Steps

### Phase 1: 基础设施（新建 test-strategy skill）

**Step 1.1 — 新建 `skills/test-strategy/SKILL.md`**
做什么：按 FR-STRATEGY-001 定义，编写 test-strategy skill 的 SKILL.md，包含：输入契约（ui_change, risk_level, L2报告摘要）、输出契约（test-strategy.md YAML front-matter + ac_routes）、解析规则（AC ID 格式、路由值合法集合、MISSING_ROUTE/UNKNOWN_AC 错误格式）、超时行为（失败记入 yellow）。
涉及文件：`skills/test-strategy/SKILL.md`（NEW）
映射 FR：FR-STRATEGY-001

---

### Phase 2: Core Implementation

**Step 2.1 — 扩展 `freshness.mjs`（D3 四段校验）**
做什么：在现有 phase-N.md 校验基础上增加段 2（RED报告）、段 3（GREEN报告）、段 4（L2报告）的 git_sha+content_hash 交叉验证；增加 L3 iron-law 专项校验（segment="l3-iron"）；所有违反追加到 `mtime_violations[]`。
涉及文件：`workflows/verify-code/freshness.mjs`（MODIFY）
映射 FR：FR-FRESH-001, FR-L3IRON-001

**Step 2.2 — 修改 `verify-code/SKILL.md`：插入 trace-check 步骤（D1）**
做什么：在 test-strategy 步骤之后、L3 之前插入 trace-check 步骤。trace-check 扫描 evidence/ 下各 phase 报告：检查存在性、exit_code==0、git_sha+content_hash 交叉验证；处理 `no_browser_test: true` 跳过留痕；产出 `trace-check-report.json`（含 missing_ac_coverage[]）。增加 FR-TRACE-002 的关联比对可验证步骤。
涉及文件：`workflows/verify-code/SKILL.md`（MODIFY）
映射 FR：FR-TRACE-001, FR-TRACE-002

**Step 2.3 — 修改 `verify-code/SKILL.md`：插入 test-strategy 调用步骤（D2）**
做什么：在 verify-code 流程中插入 test-strategy skill 调用步骤（子代理方式）；读取 L2 报告摘要、ui_change、risk_level 作为输入；调用完成后触发机器核查（读 spec AC 列表，逐一核对 test-strategy.md ac_routes 字段）；核查失败记入 D7 red 条件。
涉及文件：`workflows/verify-code/SKILL.md`（MODIFY）
映射 FR：FR-STRATEGY-001

**Step 2.4 — 修改 `verify-code/SKILL.md`：L3 复用 isolated-browser-qa（D4）**
做什么：L3 E2E 步骤改为直接调用 isolated-browser-qa skill；指定截图输出到 `evidence/screenshots/`，报告写入 `l3-e2e-report.json`；调用接口不修改 isolated-browser-qa 本身。
涉及文件：`workflows/verify-code/SKILL.md`（MODIFY）
映射 FR：FR-L3-001

**Step 2.5 — 修改 `verify-code/SKILL.md`：stage-summary 双调用（D5）**
做什么：在 verify-code 阶段开始插入第一次 stage-summary 调用（phase="start"），在阶段结束插入第二次调用（phase="end"）；两次调用均 append 写入 `evidence/stage-summary.jsonl`；机器验证：统计 "event":"stage_summary" 行数=2，顺序 start→end。
涉及文件：`workflows/verify-code/SKILL.md`（MODIFY）
映射 FR：FR-SUMMARY-001

**Step 2.6 — 修改 `verify-code/SKILL.md`：L3 iron-law + 三色门（D6/D7）**
做什么：在 L3 执行后增加 iron-law 校验（l3-e2e-report.json git_sha 必须匹配当前 HEAD）；三色门逻辑映射到 stage-result contract 允许值（success|failed|unknown）：全通→success，yellow 条件（flaky_failure=true 等非致命异常）→unknown，red 条件（git_sha 不匹配等致命失败）→failed；不新增 green/yellow/red 枚举，yellow 不阻断，red escalate 等人。
涉及文件：`workflows/verify-code/SKILL.md`（MODIFY）
映射 FR：FR-L3IRON-001, FR-COLOR-001

---

### Phase 3: Polish / Verification

**Step 3.1 — Scope Boundary Verification**
做什么：确认未触碰红线文件（build-code/SKILL.md、build-plan/SKILL.md、make-decision/SKILL.md、build-spec/SKILL.md、isolated-browser-qa/SKILL.md）；确认 isolated-browser-qa 未被改造。

**Step 3.2 — 机器可查契约自检**
做什么：验证 test-strategy.md 解析规则（AC ID 正则、路由值集合、错误格式）已完整写入 SKILL.md；验证 stage-summary.jsonl 行数校验规则已写入；验证 freshness.mjs 四段 segment 标识与 data-contracts.md 一致。

---

### Scope Boundary Verification

不可触碰的文件和路径：
- `workflows/build-code/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `workflows/make-decision/SKILL.md`
- `workflows/build-spec/SKILL.md`
- `skills/isolated-browser-qa/SKILL.md`（D4 是复用，不是改造）
- `workflows/verify-code/SKILL.md`（D5 stage-summary JSONL：无独立 skill，直接 inline append 写入 evidence/stage-summary.jsonl，不改造外部组件）
- L1/L2 测试逻辑相关文件

---

## Verification Mapping

| Step | Maps to FRs | Verified by AC |
|------|-------------|----------------|
| Step 1.1: 新建 test-strategy/SKILL.md | FR-STRATEGY-001 | AC: test-strategy.md 存在含 ac_routes; MISSING_ROUTE/UNKNOWN_AC 错误格式正确 |
| Step 2.1: 扩展 freshness.mjs 四段 | FR-FRESH-001, FR-L3IRON-001 | AC: mtime_violations[] 含段标识; GREEN content_hash 不符触发 red |
| Step 2.2: 插入 trace-check 步骤 | FR-TRACE-001, FR-TRACE-002 | AC: trace-check-report.json 存在; missing_ac_coverage[] 正确填充; 关联比对机器可查 |
| Step 2.3: 插入 test-strategy 调用 | FR-STRATEGY-001 | AC: 机器核查通过/失败触发正确颜色门 |
| Step 2.4: L3 复用 isolated-browser-qa | FR-L3-001 | AC: l3-e2e-report.json 存在; evidence/screenshots/ 有截图 |
| Step 2.5: stage-summary 双调用 | FR-SUMMARY-001 | AC: stage-summary.jsonl 行数=2, 顺序 start→end |
| Step 2.6: iron-law + 三色门 | FR-L3IRON-001, FR-COLOR-001 | AC: git_sha 不匹配触发 red; flaky_failure=true 触发 yellow; 全通触发 green |
| Step 3.1: Scope boundary check | 全部（不做约束） | AC: 红线文件无改动 |
| Step 3.2: 机器可查契约自检 | FR-TRACE-002, FR-STRATEGY-001, FR-SUMMARY-001 | AC: 契约字段与 data-contracts.md 一致 |

---

## M10 Baseline Comparison

基线来源：`specs/archive/m10-baseline-switch/baseline-report.md`（4个历史 agenthub task 均值）

M12 实值说明：本次记录时点为 build-plan 阶段，全流程未完成，上游只有 make-decision/build-spec 落盘产物，build-code/verify-code 均未执行，无法采集真实执行数据。

| 指标名 | M12 实值 | M10 baseline | delta |
|--------|----------|--------------|-------|
| missed_step_rate | unknown（build-plan 阶段，全流程未完成，无法统计跳步率） | 0.05 | unknown |
| test_execution_rate | unknown（build-plan 阶段无测试执行数据，待 build-code/verify-code） | 0.8295 | unknown |
| review_execution_rate | unknown（review 阶段尚未执行） | 1 | unknown |
| rework_rounds | unknown（全流程未完成，无返工数据） | 6.075 | unknown |
| rework_proxy_count | unknown（全流程未完成，无代理返工数据） | 25.25 | unknown |

---

## F10 Gate

对 plan.md 中提出的新机制逐项回答四问。

### F10-01：test-strategy skill（新建 `skills/test-strategy/SKILL.md`）

1. **真实威胁**：verify-code 阶段缺乏结构化的 AC→测试路由映射，导致高风险 AC（如 L3 E2E）可能被跳过，且跳过行为无可查证据。spec.md FR-STRATEGY-001 记录了该已观察失效模式。
2. **现有机制是否覆盖**：现有 verify-code SKILL.md 无 AC→路由映射逻辑；isolated-browser-qa 是执行层（不做路由决策）；无现有机制覆盖。
3. **是否可轻易绕过**：SKILL.md 是文本协议，agent 可选择不调用。但 verify-code SKILL.md 会插入"调用 test-strategy + 机器核查 test-strategy.md 存在且含 ac_routes"步骤，绕过会导致机器核查失败（red 或 yellow），有可观测后果，不是无声绕过。
4. **长期维护成本**：一个 SKILL.md 文件，契约稳定（YAML front-matter + ac_routes 字段），无运行时依赖，低维护成本。AC 集合变化时同步更新即可。

**结论**：保留。四问全部可答，真实威胁已观察，无现有覆盖，绕过有可观测后果，维护成本低。

---

### F10-02：freshness.mjs 四段校验（扩展现有模块）

1. **真实威胁**：verify-code 当前仅校验 phase-N.md（段1），RED/GREEN 报告和 L2 报告可能来自上一轮旧文件，造成"假新鲜"放行。spec.md FR-FRESH-001 记录了该已观察失效。
2. **现有机制是否覆盖**：freshness.mjs 已存在段1校验，段2-4 是在同一文件内扩展，属于改造复用（P2），不是新引入机制。
3. **是否可轻易绕过**：freshness.mjs 是 verify-code 执行路径上的强依赖；绕过需要不调用该模块，会导致 mtime_violations 缺失，阶段证据不完整。
4. **长期维护成本**：在现有模块添加3个 segment 分支，改动局限于 freshness.mjs，无新文件、无新依赖。

**结论**：保留。属于现有机制改造扩展（P2），维护成本极低。

---

### F10-03：trace-check 步骤（新增到 verify-code SKILL.md）

1. **真实威胁**：verify-code 当前无 AC→evidence 可追溯性检查，导致某些 AC 实际无对应测试证据但阶段仍放行。spec.md FR-TRACE-001/002 记录了该已观察失效。
2. **现有机制是否覆盖**：现有 verify-code SKILL.md 无 trace-check 步骤，无现有机制覆盖。
3. **是否可轻易绕过**：trace-check-report.json 输出为机器可查（JSON 字段），verify-code 步骤要求该文件存在且 missing_ac_coverage[] 符合预期；绕过有可观测后果。
4. **长期维护成本**：新增一个 SKILL.md 步骤 + 输出一个 JSON 文件。AC 集合来自 spec.md，变更时同步即可。

**结论**：保留。真实威胁已观察，无现有覆盖，绕过可观测，维护成本低。

---

### F10-04：stage-summary 双调用（start + end）

1. **真实威胁**：verify-code 当前无阶段摘要机制，缺乏可机器验证的"阶段开始/结束"证据，导致无法判断阶段是否完整执行。FR-SUMMARY-001 记录该问题。
2. **现有机制是否覆盖**：仓库无独立 stage-summary skill，D5 改为在 workflows/verify-code/SKILL.md 中 inline append 写入 evidence/stage-summary.jsonl，不依赖外部组件。属于最小侵入实现，不是新机制。
3. **是否可轻易绕过**：stage-summary.jsonl 行数=2 且顺序 start→end 为机器可查约束；绕过有可观测后果。
4. **长期维护成本**：两行调用，依赖现有 stage-summary skill，零新代码（已修正：仓库无独立 stage-summary skill，D5 改为 inline append）。

**结论**：保留。复用现有 skill，维护成本接近零。

---

### F10-05：L3 iron-law（git_sha 匹配校验）+ 三色门（success/unknown/failed，对齐 stage-result contract）

1. **真实威胁**：L3 报告可能来自不同 commit（旧 SHA），且现有 red/green 二色门无法区分"flaky 失败"与"真实失败"，导致误阻断或漏放行。FR-L3IRON-001、FR-COLOR-001 记录了该已观察失效。
2. **现有机制是否覆盖**：现有 verify-code SKILL.md 无 git_sha 校验，无三色门逻辑，无覆盖。
3. **是否可轻易绕过**：git_sha 从 l3-e2e-report.json 读取并与 HEAD 比对，需报告文件包含正确字段；绕过需伪造报告，有操作成本且可审计。
4. **长期维护成本**：在 SKILL.md 中新增两段逻辑描述（iron-law + 三色门触发条件），不引入新文件或依赖。三色门触发条件由人设定阈值，稳定后无需频繁改动。

**结论**：保留。真实威胁已观察，无现有覆盖，绕过有审计成本，维护成本低。

**F10 移除项**：无。所有5个新机制/扩展均通过四问，无项被移除。tasks.md 和 cross-artifact-analysis.md 无需同步变更。

---

## Simplicity-Guard Minimal-Path

`minimal-path: P2 — 核心改动均为改造现有 verify-code/SKILL.md 和 freshness.mjs（扩展，不重写）；新建 test-strategy/SKILL.md 是 P3（无现有覆盖，最小新增），整体以 P2 为主，局部 P3 最小实现。`

---

## Step 10: File Identification

### 涉及文件清单（改/增/删/改名）

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| MODIFY | `workflows/verify-code/SKILL.md` | 插入 trace-check、test-strategy 调用、stage-summary JSONL 写入、L3 iron-law、三色门逻辑（D1-D7 全部） |
| MODIFY | `workflows/verify-code/freshness.mjs` | 扩展段2（RED报告）、段3（GREEN报告）、段4（L2报告）校验 |
| CREATE | `skills/test-strategy/SKILL.md` | 新建 test-strategy skill，定义 AC→路由映射协议 |

### 红线文件确认（禁止触碰）

| 文件 | 状态 |
|------|------|
| `workflows/build-code/SKILL.md` | 未触碰 |
| `workflows/build-plan/SKILL.md` | 未触碰 |
| `workflows/make-decision/SKILL.md` | 未触碰 |
| `workflows/build-spec/SKILL.md` | 未触碰 |
| `skills/isolated-browser-qa/SKILL.md` | 未触碰（D4 仅复用调用） |
| `evidence/stage-summary.jsonl` | 运行时产物（D5 inline append 写入，无独立 skill） |

所有改动仅限 `workflows/verify-code/` 目录（2个文件）和新建 `skills/test-strategy/SKILL.md`，无禁止文件被触碰。
