# make-decision 原始需求原文（台账渲染点①）

> 来源：issue 描述原文（verbatim，一字未改）。初始状态统一标"待处理"，S8 终态化。

---

## 条目1：背景

workflowhub 各 stage 用 3rd-review 做异源审查，现在这套技能臃肿、不好用、不好追踪：审查有没有审完不知道、审查报告基本没生成过、审查质量无法保证。

真根因：workflowhub 5 个 stage 调用 3rd-review 时都没传 stage 标识。3rd-review 靠 `--checkpoint=<stage>` 前缀匹配路由到 stage 专属合同，标识永远为空导致匹配失败，回退到通用合同，挂在 `verifiers/vibecoding/` 下的 11 个 stage 专属合同从未被路由使用。

同时原版 agenthub 的 3rd-review 已实现的分轮全量/增量审查、成本降级、升级人工、报告渲染机制，迁移到 workflowhub 时全部丢失，退化成一次性通用审查。本任务不修旧 bug，直接重设计。

**初始状态：待处理**

---

## 条目2：目标（原始需求）

重设计为两层架构：
- **3rd-review（瘦身，全局通用）**：纯异源审查引擎，输入 `{mode, contract, materials}`，做环境探测，派审查 agent，返回 `{verdict, findings, actual_mode}`，零 stage/轮次知识，可独立复用。
- **wh-review（workflowhub 专属，新建）**：拥有 stage→合同映射、5 套 stage 专属合同（从 agenthub verifiers/vibecoding 先搬后补）、轮次状态、降级/升级大脑、Delta Package 构造、报告模板+渲染脚本。

Stage 合同映射：make-decision←intake，build-spec←design，build-plan←plan，build-code←code，verify-code←test-acceptance。

审查降级机制：第1轮强制全量异源；第2轮起增量Delta Package+降级；异源最多3轮后强制转同源；连续3轮大量blocking或指纹重复blocking→升级人工。裁决枚举：pass/revise_required/escalate_to_human。报告脚本渲染（移植render-review-report.mjs），6章结构，落盘任务目录。

**初始状态：待处理**

---

## 条目3：整体验收标准

- 各 stage 触发 wh-review 时传对 stage 标识，对应专属合同被正确加载（日志可验证）。
- 审查报告由脚本生成、6章齐全、落盘可追踪。
- 降级（异源→同源）、异源3轮硬顶、升级人工三条路径可触发且有日志记录。
- pass 自动推进下一 stage 生效。
- 3rd-review 瘦身后不含任何 stage/vibecoding/轮次逻辑，可独立复用。

**初始状态：待处理**

---

## 条目4：已知风险

- 接口不强制 stage 参数则前功尽弃：wh-review→3rd-review 接口必须把 stage/contract 设为必填，缺失即报错。
- 两层协作契约风险：findings schema、verdict 枚举、mode 取值两边必须对齐。
- 空泛合同首版打折：intake 方向节、verify-code 新鲜性判据先搬后补，首版审查质量偏弱。
- 硬顶3轮转同源可能放过真bug：需在报告和日志里显式标 actual_mode=same-source，保留人工复核入口。
- render 脚本移植依赖数据结构对齐，否则报告渲染失败。
- build-code SKILL.md §7 与 §13 文档矛盾，重设计前需清理歧义。
- 留白：各 stage 合同判据细节、空泛合同（intake方向节、verify-code新鲜性）的补强，在 make-decision 阶段自行细化。

**初始状态：待处理**

---

## 补充（用户在 S2 追问中的回复，2026-07-05）

用户原话："不影响，继续重设计。不用再查外部资料，直接进入下一步收拢方向"
（针对 foreman 在 S2 提出的两个问题：1. checkpoint 路由已在 e96c257 修复，是否影响重设计范围；2. 是否需要再做一轮外部双路调研）

**初始状态：待处理**
