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

handoff 是当前续接视图，不是四份材料、stage outcome、reflection 或正式质量事实的
替代品。它只保留指针、边界和下一步；任何 unavailable、failed、unknown 或 stale
都必须原样可见。

## 输入与输出

输入必须来自同一次已认证 stage run：

1. 当前 task/stage/snapshot/material identity；
2. authenticated canonical stage outcome ref/hash；
3. reflection 的终态结果；
4. `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 当前字节。

机器写入固定相对路径：

`quality/evidence/handoff/<stage>.md`

每次成功生成都用原子覆盖，只保留 current view，不归档历史版本。写入后必须读回并
验证 task、stage、snapshot、material revision、reflection 状态、banner 和 13 个有序
区块仍绑定当前输入；返回值必须带绝对路径。写入失败返回 `unavailable` 和绝对路径，
并明确旧文件可能 stale，不能把旧文件当作 current。

## 内容合同

固定区块依次为：任务身份、背景与目标、当前阶段与进度、重要决策、核心方案、踩过的
坑、重要参考调研、关键事实与数据状态、成功与失败边界、未决项与风险、下一步动作、
待读文件清单、可自行判断与必须问用户的边界。正文应优先给出真实 source ref/hash、
当前状态和一条可执行下一步；不复制四份材料全文，不生成质量分数，不声称发布或物理
交付完成。

## 失败隔离

handoff 失败不能覆盖 reflection/stage result 的状态，也不能阻止同一 stage 的工作
继续或让旧 handoff 变成新 handoff。reflection 失败也不能被 handoff 包装成成功；两
者的失败事实分别保留。
