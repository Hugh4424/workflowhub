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

复查（N11/make-decision）：方向审查 2 路判材料不完整（E11），第二批细节审查同项判 blocking（G1）；同上条行动，不复制正文。来源：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n11-same-condition-eval-20261022/quality/evidence/decision-log-refs/review-dispositions.md`。

## 证据模块

| 问题 | 下次改变的行动 | 状态 |
| --- | --- | --- |
| 本次把 022 指成 alias 失败原件，实读发现 022 只有索引比对失败；alias 仅 003 摘要，完整 stderr 未独立存（来源：[本次观察](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-046-p2-t002-before-and-source-observations.json)、[022](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-022-n7-build-code-preflight.json)、[003](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/evidence/2026-10-18-003-preflight-confirm-alias-failure.json)）。 | 行动规则已迁入 [KR-EVID-001](acceptance/evidence.md#kr-evid-001--分开版本事实归档绑定与权利)，按原操作/错误/正文核命题，不在经验中另持规则。 | 已落账；对应行动规则已验证并同步，原完整stderr不足仍保留，未声称用户确认解决。 |

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

## 验收证据判读（N10 verify-code）

| 问题 | 下次改变的行动 | 状态 |
| --- | --- | --- |
| 审查建议曾否定 P2 明文允许的 notice 坐标，又把旧汇总漏列原件误作实现缺口（来源：N10/verify-code，`quality/reviews/2026-10-22-064-verify-code-document.json`、`specs/archive/n10-finite-check-wiring-20261020/phases/P2-来源与目录接线.md:111`、`quality/reviews/2026-10-22-087-n10-review-clarification-20261022.md`）。 | 下次处置 finding 先回读对应原 AC、真实消费者和具名原件；与合同冲突时保留建议并写拒绝原因，不增加 hash/freshness 门。 | 已落账；仅纠正证据判读，完整验收限制不变。 |

## 审查聚合与部分结果（N11）

| 问题 | 下次改变的行动 | 状态 |
| --- | --- | --- |
| 方向审查 2 路已完成并产出 15 条意见，卡住的一路让整组等了 41 分钟，汇总层仍判 `unavailable`、`authoritative=false`，已得意见在汇总口径里丢失（来源：N11/make-decision，`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n11-same-condition-eval-20261022/quality/evidence/reviews/2026-10-22-direction-review-failure.md`、同任务 `review-dispositions.md` D10）。 | 下次改审查聚合先核真实失败原件：单路无进展即判该路终态，已产 findings 落 partial 可消费，汇总层不得把已执行结果降为 unavailable。 | 已落账（P5 承接，AC-N11-14/19 验收）。 |

## 质量检查模块（N11）

| 问题 | 下次改变的行动 | 状态 |
| --- | --- | --- |
| 4 份审查汇总的 `material_coverage` 全为 undetermined（read 空），其中 3 份 `status=available`；只看 status 会把「审查返回」当成「材料被读过」（来源：N11/make-decision，同一任务库 `quality/reviews/2026-10-22-005/009/013/017-*.json`）。 | 行动规则已迁入 [KR-EVID-001](acceptance/evidence.md#kr-evid-001--分开版本事实归档绑定与权利)，由唯一证据规范承接覆盖判断。 | 历史覆盖unknown：005 unavailable，009/013/017 available，read空/undetermined仅未证读取，不推实际绝未读；未标解决、未取得用户确认。 |

## 验收设计模块（N11）

| 问题 | 下次改变的行动 | 状态 |
| --- | --- | --- |
| 阶段地图每阶段有独立结果，但验收表曾漏掉四项流程能力的全部验收条目（E1），抽样条目重复一次（E8），两轮审查才发现（来源：N11/make-decision，`review-dispositions.md` E1/E8）。 | 下次收口前做「工作包独立结果 → AC 编号」逐行对照，每行结果至少一条 AC，同一抽样规则只出现一处。 | 已落账；不代用户确认 AC 内容。 |
| 审查建议给验收加耗时/步数熔断，与「不设数字阈值」冲突被拒；成本四组曾只列三组、曾想用别人数据（来源：N11/make-decision，`review-dispositions.md` D2 未采纳、G5/G6）。 | 下次防验收失控先选范围止损（超出点名范围即停问用户），成本对照用本任务前后四组指标分列，不设数字阈值、不借外部数据。 | 已落账（P1/P2 阶段契约承接）。 |

## 交互模块（N11）

| 问题 | 下次改变的行动 | 状态 |
| --- | --- | --- |
| 用户两次确认都只覆盖实际展示的范围，另列 5 项不覆盖的待确认（Git 授权、基线提交哈希、判官与平局规则、P9 被测任务、P2 分档阈值）（来源：N11/make-decision，`/Users/Hugh/Hugh/Project/workflowhub-n11-same-condition-eval-20261022/specs/n11-same-condition-eval-20261022/decision-log.md:219`）。 | 下次记录用户确认时同段列「本次确认不覆盖」的具体项与再问阶段，阶段开工前逐项再问，不把确认当全量授权。 | 已落账。 |

## 流程能力模块

| 问题 | 下次改变的行动 | 状态 |
| --- | --- | --- |
| 调研空结果有真实执行，现有报告只接受三种状态，若混同工具失效会丢掉已执行事实（来源：n11-same-condition-eval-20261022/build-code/P4，runtime/evidence/research-report.mjs 与 079-p4-pre-implementation-facts.md）。 | 下次接薄入口先读唯一报告 producer 的状态与完成条件，零结果保查询、工具、空返回，以 no_results 区分工具不可用，不能为求 completed 伪造来源。 | 已落账；不代表真实调研完整验收。 |
