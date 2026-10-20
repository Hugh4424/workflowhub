写作、状态、用户确认清理及“下次要改的那一步 + 现象”判重见 `skills/stage-reflection/SKILL.md` 的「用户选择后的归口」。

# Improvements

## 迁入的历史说明

以下保留迁移前原文，只说明该历史时点，不作为当前写作规则：

```text
# Improvements

这是本项目需人判断的未解待办，不是规范或知识库。读写与用户选择、来源引用及人工 prune 方法见 `skills/stage-reflection/SKILL.md` 的「用户选择后的归口」；搬运到其它项目时由调用方定位同一方法。

当前本次创建未写入任何问题条目：没有可引用的本次真实用户候选选择或已确认未解项，选择与后继任务消费未观测。后续条目仅记问题、来源路径与真实选择／未解状态，不用空表或未选建议代替事实。
```

## 审查模块

| 问题 | 下次改变的行动 | 状态 |
| --- | --- | --- |
| 跨仓材料声明了论文仓路径，但默认单仓审查确实拒绝这些路径（来源：N7/build-plan 的 [013 原件](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-013-n4-n7-material-contract.json)、当前 spec OPEN-010）。 | 下次筹备跨仓审查时先核真实 host 能否提供可信读取范围；缺面如实 unavailable，直接函数 scope 诊断不当宿主接通。 | 已落账；跨仓宿主接线仍缺，本条不代用户决定或新授权。 |

## 证据模块

| 问题 | 下次改变的行动 | 状态 |
| --- | --- | --- |
| 本次把 022 指成 alias 失败原件，实读发现 022 只有索引比对失败；alias 仅 003 摘要，完整 stderr 未独立存（来源：[本次观察](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-046-p2-t002-before-and-source-observations.json)、[022](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-022-n7-build-code-preflight.json)、[003](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/evidence/2026-10-18-003-preflight-confirm-alias-failure.json)）。 | 下次引用失败或写经验前，逐项核对操作、错误与原件正文是否对应；只有摘要时明确覆盖限制，不把另一失败替进去。 | 已落账；本次错误指针已纠正，未声称用户确认清理。 |

## 匿名评测模块

| 问题 | 下次改变的行动 | 状态 |
| --- | --- | --- |
| 本次把匿名候选的访问隔离扩大成独立host/Docker，又用全进程seatbelt挡住CLI自身并要求用户供环境（来源：N7/build-code，`quality/evidence/2026-10-18-090-native-isolation-docker-root-cause-audit.md`、`quality/tests/2026-10-18-094-p3-common-input-corrected.json`、`095-p3-judge-standard-corrected.json`、`101-native-exact-packet-host-probe.json`）。 | 下次先核现有原生packet权限及真实允许/拒绝，区分CLI控制面与模型工具；质量与成本条件分列，单路线失败不增加Docker或独立host前置。 | 已落账；未作用户确认已解决，不清理；原生探针仅证实测面，网络与工具注入缺口保留。 |

上条经验的补充来源（N8/build-code）：[当前包能力拒绝审计](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n8-four-level-route-20261019/quality/evidence/2026-10-20-140-p4-ag-capability-cancellation.json)、[真实终态](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n8-four-level-route-20261019/quality/evidence/2026-10-20-141-p4-ocr-terminal-readback.md)。同上条行动；本次保留两路有效结果与一路不可用，未把原问题标为已解决。

## 审查健康与页面结构（N9）

| 问题 | 下次改变的行动 | 状态 |
| --- | --- | --- |
| 审查 provider 反复调用被 packet hook 拒绝的读取，拒绝事件仍被算作“有进展”，整组因等待全部 provider 而不返回（来源：N9 make-decision 方向审查，`quality/evidence/2026-10-20-014-direction-review-slowdown-diagnosis.md`）。 | 下次审查前先核 provider 真实工具名/参数形状与 hook 白名单是否一致；重复拒绝不计进展，无进展窗口到即把该路判终态，其余结果照常返回；不加墙钟超时。 | 已落账（N9 D-010，待实施）。 |
| 把任务页面的节点分类（七环）误当成流程步骤（十环），直接合并会丢五态与分母的承载位置（来源：N9 M6，`quality/evidence/2026-10-20-018-n6-page-seven-vs-ten-rings-analysis.md`）。 | 下次改页面前先分清“节点分类”和“执行环节”两个维度；五态、分母、证据类型放执行维度，历史页保留不动。 | 已落账（N9 D-011，含用户要求改十环的取舍）。 |
| 方向/细节审查包只内联摘要，关键来源原件不在包内，审查者只能看到指针（来源：N9 detail 审查发现 11，`quality/evidence/2026-10-20-020-detail-findings-dispositions.md`）。 | 下次组包把会改变判断的来源原件内联，或在材料里明确列为不可读缺口，不让审查者猜。 | 已落账（本次按材料边界记录，未改脚本）。 |

## 计划来源与验收对象（N9）

| 问题 | 下次改变的行动 | 状态 |
| --- | --- | --- |
| 初版把十环有落点当成父 PRD 全覆盖，漏掉逐实际步骤 consumer 与完成判据回填；结构检查仍能通过（来源：N9/build-plan，父 PRD:464/530、047/049 调查原件与当前 R-010）。 | 下次收口先回读原 PRD 的跨卡采用/consumer 条款，再逐条核来源→真实交付→反例，不用本地 FR/AC 数量代替原需覆盖。 | 已落账；本次补设计不冒代码实施或独立质量通过。 |
| 静态 HTML 已明确要改，却把“无现成服务/未跑浏览器”当成不适用并把 service/viewport 交给用户补（来源：N9/build-plan，旧验收对象原件009、061澄清）。 | 下次先核原 QA 方法并由 agent 规划自有隔离会话、loopback 产物服务和测试尺寸；真实环境失败才记 unavailable，不伪装非 UI。 | 已落账；浏览器效果须后续真实执行，未记用户确认已解决。 |
| 上游代码合并与整卡验收在材料里曾混为同一关闭条件（来源：N9/build-plan，N8 最新010交接与本任务037/050）。 | 下次依赖复核分别读代码交付、实际效果与成本欠账；保旧基线并单列合入增量，不因 merge 自动关闭质量依赖或重置预算。 | 已落账；N8 整卡缺口仍保留，不转成 N9 新范围。 |
