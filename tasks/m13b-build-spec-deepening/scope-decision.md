# M13b build-spec 深化 — 范围决策（scope-decision）

> Stage: make-decision ｜ Task: m13b-build-spec-deepening ｜ 日期: 2026-06-30
> 权威源：roadmap.md 行 350–357（M13b 段）；decision-log.md（只读，未修改）
> 性质：记事实不阻断；开放问题浮现到本文件等用户拍板。

## 1. 原始需求

为 build-spec 补三类质量缺口，并先把跨 stage handoff 契约落地：scope-triage 分档、spec 自检、decision-log×spec 对齐校验、独立 spec-reviewer、handoff v1。承接 .recollect-build-spec.md #3/#4/#13/#26/#27 + M13-M13e 跨 stage 成本契约。

## 2. 问题与目标

build-spec v1（M11 基线）缺三类能力：
- 无范围分档 → 大小需求一刀切，易漏判高危改动。
- 无自检 → placeholder/矛盾/歧义/越界混入 spec 不被发现。
- spec 与已批准方向（decision-log D1–D6）可能漂移，无对齐校验。
- 无独立审查视角；stage 间靠隐式上下文传递，成本高且易误读。

目标：补齐上述能力，全部「记事实不阻断」（违宪 F3 红线），并落地 handoff/latest.json 窄引用契约降低跨 stage 成本。

## 3. 决策记录

### D-M13b-1：P0/P1/P2 全做，不裁剪
roadmap 列 8 项（P0-0~P0-3、P1-1、P1-2、P2-1、P2-2），**全部纳入本轮范围**。理由：每项都有对应验收门和承接条目，互相耦合（handoff 契约是 P0-2/P0-3 产物的落点），拆分反增协调成本。

| 项 | 内容 | 产物 |
|---|---|---|
| P0-0 | handoff/latest.json 契约 + build-spec 启动/写回 | contracts/stage-handoff.contract.json |
| P0-1 | spec-scope-triage skill（lite/full + 黑名单） | skills/spec-scope-triage/SKILL.md |
| P0-2 | F10 gate 后 human review 前四项自检 | spec-self-check.md |
| P0-3 | spec-clarify 后 F10 前 decision-log×spec 对齐 | spec-decision-alignment.md |
| P1-1 | 可选 spec-reviewer 子代理（不 blocking） | spec-reviewer-report.md |
| P1-2 | spec-specify FR-{域缩写}-NNN 格式约束 | spec.md FR 编号 |
| P2-1 | spec-specify 后 AC 计数 | spec-acceptance-count.json |
| P2-2 | 长报告 artifact-first | SKILL.md 规则 |

### D-M13b-2：scope-triage 黑名单沿用 M0 原版
spec-scope-triage 复用 scope-triage（M0）的高危关键词黑名单：**auth / permission / route / gate / feature flag** 等。命中即强制 full 档不可降级（防漏判）。spec 阶段是否需新增域特定关键词 → 见开放问题 OQ-3。档位字段写入 spec-scope-triage-result.md，高危命中但档位=lite 即验收失败。

### D-M13b-3：spec-reviewer 触发条件 = 可选、非阻断
spec-reviewer 是独立子代理（独立上下文，违 Q3 红线 = 同源运行）。结论**仅供参考，禁触发 blocking**（触发即违宪 Q1）。默认触发条件建议：full 档 OR 用户显式要求；lite 档默认跳过。具体阈值 → 见开放问题 OQ-1。

### D-M13b-4：handoff 最小字段契约
contracts/stage-handoff.contract.json 定义完整字段集（承成本契约 line 348）：
`task_id / current_stage / next_stage / worktree_root / upstream_stage_result_ref / decision_log_ref / spec_ref / plan_ref / tasks_ref / data_contracts_ref / evidence_dir / required_reads / artifact_outputs / missing_items / risk_items / last_human_decision`。

build-spec 写回时**必填子集**（缺任一即验收失败）：`task_id / current_stage / next_stage(=build-plan) / spec_ref / required_reads / artifact_outputs`。下游字段（plan_ref/tasks_ref/data_contracts_ref）本轮留空占位，由 M13c 填充。

### D-M13b-5：P0-2 四项自检复用 grill-with-docs-lite 思路但改为自动扫描
原 grill-with-docs-lite 是交互逐条质询用户；P0-2 改为**非交互自动自检**四项：placeholder / contradiction / ambiguity / scope，各至少一条结论写 spec-self-check.md。复用 grill「逼出边界」内核，去掉交互盘问。命名归属（独立 spec-self-check skill vs 内联 build-spec）→ 见开放问题 OQ-2。

### D-M13b-6：FR 编号格式 FR-{域缩写}-NNN
spec-specify 加格式约束，spec.md 所有 FR 编号须符合 FR-{域缩写}-NNN（不符即失败）。域缩写表是否预定义 → 见开放问题 OQ-4。

## 4. 复用来源

| 来源（M0） | 类别 | M13b 处置 |
|---|---|---|
| scope-triage | 自研迁入 | 适配为 spec-scope-triage，黑名单直接复用 |
| grill-with-docs-lite | 外部改造迁入 | 取「逼边界」内核，改非交互四项自检 |
| spec-reviewer（M0 ref） | 新建 | 独立子代理，非阻断 |
| 现有 skills/build-spec/ sub-skill | 已有 | spec-specify 修订（FR 格式+AC 计数），其余保留 |

reuse-registry.md 需新增：spec-scope-triage、spec-reviewer 两条登记（本轮范围内修订）。

## 5. 假设

- decision-log D1–D6 已稳定，spec 写前可读取（M13 已交付）。
- Multica 仅作外部 stage 调度方，不进入 workflowhub.yaml 核心配置。
- F10 gate 现有机制可用，新增步骤插在其前后不破坏现有门序。

## 6. 明确不做（边界）

- **不**把 Multica 小队配置写进 workflowhub.yaml（只定义文件契约 + stage 行为）。
- **不**让任何新增检查阻断推进（自检/对齐/审查全部记事实，阻断即违宪 F3/Q1）。
- **不**实现 build-plan / build-code 侧的 handoff 消费（M13c+ 负责）；本轮只定义契约 + build-spec 写回。
- **不**做 spec-reviewer 的 blocking 门或评分卡。
- **不**改 decision-log（只读权威源）。

## 7. 验收标准（摘 roadmap 行 355）

- 上游 stage-result 或 decision-log 引用缺失 → build-spec 启动明确失败，不猜路径。
- 结束后 handoff/latest.json 含必填子集，next_stage=build-plan；stage-result 含 facts.spec_ref + facts.handoff_ref。
- spec-scope-triage-result.md 存在含档位字段；高危命中但档位=lite 即失败。
- spec-self-check.md 含四检查项各≥1 条结论，写入后未阻断流程。
- spec-decision-alignment.md 含差异项列表（无差异须 no_diff:true），比对失败记 gap_items 非中止。
- spec-reviewer-report.md 在独立子代理产出（同源即违 Q3），未触发 blocking。
- spec.md 全部 FR 符合 FR-{域缩写}-NNN。
- 扫描 build-spec SKILL.md：无 blocking gate 关键词；可见 artifact-first 规则。

## 8. 开放问题（待用户确认）

- **OQ-1**：spec-reviewer 触发条件——默认「full 档 OR 用户显式要求」是否采纳？还是无条件可选（每次都问）？
- **OQ-2**：P0-2 四项自检落地形态——独立 spec-self-check skill，还是内联 build-spec SKILL.md 步骤？
- **OQ-3**：spec-scope-triage 黑名单——完全沿用 scope-triage 原版（auth/permission/route/gate/feature flag），还是 spec 阶段需补域特定关键词（如 data-migration/breaking-change）？
- **OQ-4**：FR 域缩写表是否需预定义固定集（如 AUTH/API/UI/DATA），还是 spec-specify 运行时自由命名只校验格式？
- **OQ-5**：handoff 下游字段（plan_ref/tasks_ref 等）本轮留空占位 vs 契约里标 optional——哪种更利于 M13c 衔接？
