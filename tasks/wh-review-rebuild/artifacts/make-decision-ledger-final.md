# make-decision 台账终态（S8 渲染，2026-07-05）

> 来源文件：make-decision-original-context.md（5 条）+ make-decision-direction-confirmed.md（D1-D7）
> 终态化时间：2026-07-05
> 所有条目均已处理，无"状态未知"条目。

---

## 条目1：背景

**终态：接受**

原文：workflowhub 3rd-review 做异源审查，现在这套技能臃肿、不好用、不好追踪；真根因是 5 个 stage 调用 3rd-review 时都没传 `--checkpoint=<stage>` 标识，导致匹配失败、回退通用合同、11 份专属合同从未被路由；同时 agenthub 原版的分轮全量/增量审查、成本降级、升级人工、报告渲染机制在迁移时全部丢失。

备注：commit e96c257 已修复 checkpoint 路由 bug 本身，但本任务不修旧 bug、直接重设计，背景描述不影响重设计范围（决策草稿 Section 1 已标注）。

---

## 条目2：目标（两层架构原始需求）

**终态：接受**

对应决策 D1 采纳。

原始需求：
- 3rd-review 瘦身为纯异源审查引擎：输入 `{mode, contract, materials}`，做环境探测，派审查 agent，返回 `{verdict, findings, actual_mode}`，零 stage/轮次知识，可独立复用。
- wh-review 新建（workflowhub 专属）：拥有 stage→合同映射、5 套 stage 专属合同（make-decision←intake / build-spec←design / build-plan←plan / build-code←code / verify-code←test-acceptance）、轮次状态、降级/升级大脑、Delta Package 构造、报告模板+渲染脚本（移植 render-review-report.mjs，6 章结构，落盘任务目录）。
- 审查降级机制：第1轮强制全量异源；第2轮起增量+降级；异源最多3轮后强制转同源；连续3轮大量 blocking 或指纹重复 blocking→升级人工；裁决枚举：pass / revise_required / escalate_to_human。

---

## 条目3：整体验收标准

**终态：接受（含修正）**

原始验收标准逐条终态：

1. 各 stage 触发 wh-review 时传对 stage 标识，对应专属合同被正确加载（日志可验证）→ **接受，不变**
2. 审查报告由脚本生成、6 章齐全、落盘可追踪 → **接受，不变**
3. 降级（异源→同源）、异源3轮硬顶、升级人工三条路径可触发且有日志记录 → **接受，不变**
4. "pass 自动推进下一 stage 生效" → **接受但已修正**：原笼统表述已被 D2 收窄：仅 build-spec / build-code 两个 stage 的 pass 会自动推进到下一 stage；make-decision / build-plan / verify-code 的 pass 后靠人工确认推进（D2 补充，用户 2026-07-05 明确）。
5. 3rd-review 瘦身后不含任何 stage/vibecoding/轮次逻辑，可独立复用 → **接受，不变**
6. 新增（D7）：本次两层架构重设计必须配套一份测试方案，验证 wh-review + 瘦身后 3rd-review 组合可用，且整个方案能在 workflowhub 全流程中端到端跑通。

---

## 条目4：已知风险（7条）

逐条标注对应决策覆盖情况：

| 风险条目 | 终态 | 覆盖决策 | 备注 |
|---|---|---|---|
| 接口不强制 stage 参数则前功尽弃 | 接受 | D1 两层架构接口设计已覆盖（stage/contract 设为必填，缺失即报错） | 实现阶段需落地强校验 |
| 两层协作契约风险（findings schema / verdict 枚举 / mode 取值两边必须对齐） | 接受 | D1 架构边界已定义；实现阶段需明确 schema 对齐协议 | 风险保留，实现阶段处理 |
| 空泛合同首版打折（intake 方向节 / verify-code 新鲜性判据先搬后补） | 接受，风险解除 | D4（intake C1-C6）/ D5（verify-code F1-F6）判据已定案覆盖，不再是"后补"，已在本阶段定案 | 原风险条目描述已过期 |
| 硬顶3轮转同源可能放过真bug | 接受 | 保留人工复核入口的要求需在实现阶段落地（actual_mode=same-source 显式标注 + 人工复核入口） | 风险保留，实现阶段处理 |
| render 脚本移植依赖数据结构对齐，否则渲染失败 | 接受 | 留给实现阶段处理，D1 已明确移植目标（render-review-report.mjs） | 风险保留，实现阶段处理 |
| build-code SKILL.md §7/§13 文档矛盾 | 接受，已决策 | D3 已清理：以 §13 为准，§7 改写为纯概念说明，删除三态 verdict 处理指令，保留降级规则作补充说明；实际修改由后续 build-code 阶段执行 | 决策已定，待实现 |
| 判据留白（各 stage 合同判据细节、空泛合同补强） | 接受，风险解除 | D4（C1-C6）/ D5（F1-F6）已在本阶段补全，不再留白 | 原风险条目描述已过期 |

---

## 补充（用户 S2 回复，2026-07-05）

**终态：接受**

用户原话："不影响，继续重设计。不用再查外部资料，直接进入下一步收拢方向。"

已用于：确认 checkpoint 路由 bug 修复（e96c257）不影响重设计范围；确认无需再做外部调研，直接推进方向收拢。

---

## D1-D7 决策终态

所有决策来源均为用户 2026-07-05 明确确认，非 foreman 自行拍板。

**D1 两层架构：接受**
3rd-review 瘦身为纯异源审查引擎，wh-review 新建承接 workflowhub 专属知识。来源：issue feb2e69b 原始需求 + 用户 2026-07-05 确认。

**D2 pass 自动推进范围收窄：接受**
只有 build-spec / build-code 两个 stage 的 pass 自动推进；make-decision / build-plan / verify-code 靠人工确认后推进。来源：用户 2026-07-05 明确。

**D2 补充 非自动推进 stage 推进方式：接受**
make-decision / build-plan / verify-code 这 3 个 stage 推进方式确定为靠人工确认后推进，非自动、非留白后补。来源：用户 2026-07-05 明确。

**D3 build-code §7/§13 文档矛盾清理：接受**
以 §13 为准，§7 改写为纯概念说明。本阶段只记录决策，实际修改由 build-code 阶段执行。来源：用户 2026-07-05 + explore sub-agent 调研。

**D4 intake 方向节判据（C1-C6）：接受**
C1 原始需求原文引用 / C2 决策有证据支撑 / C3 范围边界明确 in/out / C4 无悬挂开放问题 / C5 方向与上游输入一致 / C6 决策产物格式可机器消费。来源：architect sub-agent + 用户 2026-07-05 确认。

**D5 verify-code 新鲜性判据（F1-F6）：接受**
F1 代码提交时间戳校验 / F2 测试覆盖最新 AC 全集 / F3 无引用废弃字段 / F4 fresh-capture git_sha 一致 / F5 content_hash 未变 / F6 测试命令与 build-code 产物记录一致。来源：architect sub-agent + 用户 2026-07-05 确认。

**D6 五个 stage 收尾总结统一模板：接受**
5 个 stage 各自 SKILL.md 收尾步骤都必须调用同一统一"大白话总结"模板/渲染脚本，禁止各自格式不一致。现状核查结论已在 issue 评论记录；若不统一则由 build-code 阶段改造落实。来源：用户 2026-07-05 明确。

**D7 测试方案要求：接受**
本次重设计必须配套测试方案，验证新 wh-review + 瘦身后 3rd-review 组合可用，全流程端到端跑通。具体方案设计与执行留给后续 build-plan / verify-code 阶段。来源：用户 2026-07-05 明确。

---

## 新想法候选

新想法候选: []

（本次 grill/S7 过程未产生超出当前 task 范围的新 task 候选）
