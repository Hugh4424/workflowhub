---
name: stage-handoff
description: 在四个作者阶段的 reflection 终态后生成当前、可复制的阶段交接包。
version: 1.0.0
---

# stage-handoff

## 目的与边界

本技能只服务 `make-decision`、`build-spec`、`build-plan`、`build-code` 四个作者
阶段。它由现有 `stage-runner#runStageEndReflection` hook 在 reflection 终态后调用，
不新增 public command、stage、控制面或质量 gate；`verify-code` 不挂载本技能。

handoff 是当前续接视图，不是四份材料、reflection 或正式质量事实的
替代品。它只保留指针、边界和下一步；任何 unavailable、failed、unknown 或 stale
都必须原样可见。

## 输入与输出

输入来自当前 WorkflowHub stage run：

1. 当前 task/stage/snapshot/material identity；
2. reflection 的终态结果（如果本次提供）；
3. `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 当前字节。

当前会话直接执行阶段并发布 handoff，不需要外部 Stage Agent、bridge、session 或
stage outcome。旧 stage outcome 只在显式兼容读取时保留 provenance，不是当前 handoff
的输入前置条件，也不能让当前阶段停住。

机器写入固定相对路径：

`quality/evidence/handoff/<stage>.md`

每次成功生成都用原子覆盖，只保留 current view，不归档历史版本。写入后必须读回并
验证 task、stage、snapshot、material revision、reflection 状态、banner 和 13 个有序
区块仍绑定当前输入；返回值必须带绝对路径。写入失败返回 `unavailable` 和绝对路径，
并明确旧文件可能 stale，不能把旧文件当作 current。

当前阶段缺料仍返回 `unknown`/`unavailable`；只有明确属于后续阶段且在既有材料清单
中的缺料才返回 `not_applicable`，并附 reason、`material_category=future`、
`exit_code=0`。未知材料名必须保持非成功诊断，不能伪装成未来材料。

## 内容合同

固定区块依次为：任务身份、背景与目标、当前阶段与进度、重要决策、核心方案、踩过的
坑、重要参考调研、关键事实与数据状态、成功与失败边界、未决项与风险、下一步动作、
待读文件清单、可自行判断与必须问用户的边界。正文应优先给出真实 source ref/hash、
当前状态和一条可执行下一步；不复制四份材料全文，不生成质量分数，不声称发布或物理
交付完成。

reflection 读取保持兼容：status reader 只读回已有原件中的六个结构化区块
`what_helped`、`what_to_improve`、`blockers`、`intervention_reasons`、
`what_to_simplify`、`simplifiable_now`，缺失时保留 `null`/不可用事实，不从旧 handoff
或其他阶段推断。

## 失败隔离

handoff 失败不能覆盖 reflection/stage result 的状态，也不能阻止同一 stage 的工作
继续或让旧 handoff 变成新 handoff。reflection 失败也不能被 handoff 包装成成功；两
者的失败事实分别保留。
