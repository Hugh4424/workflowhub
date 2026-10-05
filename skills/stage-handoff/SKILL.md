---
name: stage-handoff
description: 每个阶段末写当前、可复制的人读交接，不作工作门，也不依赖可选复盘。
version: 1.0.0
---

# stage-handoff

每个 stage 末由当前主会话写一份给人读、可复制的交接 md，供用户或下游会话续接。交接是当前材料与 task facts 的派生视图；各次原件留存，不作质量结论、工作许可证、正式材料替身或 reflection 的消费者。

## 方法

1. 先确定当前 task、stage 与对象范围。只对当前新流程任务执行下列写入动作；旧任务、未完成旧任务及历史对象保持只读，不修改或删除其文件，不产出新交接或兼容链。身份或范围无法确定时披露缺口，继续安全读取，不猜作当前任务。post 读取 decision-log、spec、相关独立 Phase 与指针 index，以及已发生的任务、测试、独立审查和 Git 事实；历史 plan/tasks 只读。尚未产生的下游材料写 not_applicable，应有却不可读的材料写具体失败，不借旧任务或旧交接补齐。
2. 按下表定位四类信息，并给出有实际 source 指针的阶段工作陈述。仅使用 not-started、in-progress、succeeded、failed、blocked、unverified、abandoned 七值。missing、unavailable、incomplete 等质量缺口另述，不转成 succeeded、blocked 或第八状态；游标、ready 值或命令 exit0 不能推定阶段成功。succeeded 须按当前 stage 合同，由当前实际交付、适用质量和现有事实支持；有既定方向或计划确认步骤的 stage 还须引用该 stage 的真实确认。build-code、verify-code 在已确认方向和计划的授权范围内，依其当前合同核对实际交付、适用质量及无未处置严重问题等现有事实，不新增本阶段日常确认；上游确认不能单独推定当前 stage succeeded，工作完成陈述不代替人类业务验收或 Git 授权。依据不足时说明无法确定；源值非法则保留原值和来源作为问题，不采用它作合法阶段值，也不反写源 stage 状态。
3. 发布前，实际回读来源中的 task/stage、四类信息、阶段值和纯文本引用路径，按“回读结果”报告本次检查结果、输入范围、具体路径和原始错误。先用现有安全写入工具把原始检查输出保存为当前 task 的 quality/tests 唯一原件，确认它已存在且可读；失败观察也如实保存。已有实际命令输出只引用原件，不复制。检查结果不是继续工作的许可；检查输出无法保存时如实披露，不能声称本次检查原件已产生。
4. 按本阶段信息需要组织正文，写当前可消费材料、四类 source、真实测试/审查与发现处置、风险、延期和具体未完事项。关键事实只引用已经存在且可读的发布前检查原件及其真实结果，不预填未来写后检查。四类信息确实无事项时明确“无”；缺失或读不到时明确 incomplete、影响和下一步，verify-code 同样如此。重要决策只放原决定指针；材料正文、原始测试/review 不在交接中复制。
5. 当前 stage owner 按已有目录职责准备当前 task 的既存真实目录 handoffDir＝quality/evidence/handoff。调用一次现有 runtime/interface/safe-write.mjs 的 appendRecord(handoffDir, '<stage>-handoff', 'md', bytes)，使用 make-decision、build-prd、build-plan、build-code、verify-code 等既有名称。返回值是已经 create-only 发布的绝对路径 string，报告该实际路径，不再次 write/create 返回路径。UTC 日期、同目录当日三位序号与碰撞重试由现有工具分配；不另写固定名、current 副本或命名算法。
6. 写后只读确认返回路径的本次字节、task 与 stage 是否对应刚才准备的正文，不把这次结果嵌回同一不可变 handoff。写入或确认失败时保留原始错误、目标绝对路径和旧件可能过时的影响；写入失败不声称生成新件，确认失败保留已经发布的原字节，结果进入既有质量事实或下一次普通记录，不回写本件。旧交接不能冒充本次成功；只准备正文未写入时明确未写。
7. 新读者收到明确原件绝对路径时直接只读，核对 task/stage；仅给 task 入口时，从当前 facts 与材料定位实际 stage，再筛选 YYYY-MM-DD-NNN-<stage>-handoff.md，按同 stage 日期、序号选原件。旧固定名只读；选中最近名字不证明正文新鲜。按同一方法回读 source、四类与问题，说明状态、实际证据和具体下一步。已有任务授权的 build-code、verify-code 直接接续，含两技能规定的必要 Git 动作，不因新会话或读取交接重新确认；仅最终 close 前按实际结果与范围确认一次。方向与计划选择仍按对应上游阶段合同，不据交接改变方向或扩大范围。记录缺失、错 task 或读不到时披露具体问题，不用旧聊天或人工补答案假称已定位；继续能够定位的授权内工作，不因回读问题新增确认门。后续读取结果仍进入既有质量事实或下一次普通记录，不改所读原件。

## 信息来源

布局按需，四类信息须可独立定位；source 使用原件纯文本路径及必要节锚点。

| 信息 | 来源与读取边界 |
| --- | --- |
| 已决定 | 只指向 decision-log 的 ADR 或原始决定正文，决定权威仍在原件 |
| 已完成且验证 | 当前阶段 facts 与实际测试、审查、逐项原件；引用真实 evidence 命令、退出、失败签名及原件路径，未实测和质量限制原样披露 |
| 未完成 | 当前 spec、物理 Phase 与实际 task facts，列具体未完 Task/事项；phase_progress 只辅助定位，不证明完成或形成历史清单 |
| 证据位置 | 原始 quality/tests、quality/reviews 和当前材料的纯文本路径；可读不证明有效、新鲜或证据链认证 |

## 回读结果

单纯缺四类信息属于 incomplete：逐项披露缺项、影响和下一步，不判齐备，不产生硬缺陷 failed。非法阶段值，以及引用路径不存在或实际不可读，属于本次记录检查的硬缺陷：保留原值或具体路径、实际错误与真实 failed 观察。不存在/不可读称为陈旧；路径仍可读而内容变化不判陈旧，不用内容 hash、revision、Git 提交号或 phases_head 判断。

两类问题都允许在同一 task/root 修复当前材料或来源后执行通常的新记录动作，旧交接和失败原件保持不变；不改变原 stage 工作状态或历史 test/review。检查不能只给建议而不实跑：由非实现者上下文消费实际检查原件，保留其输入范围和原始输出；适用硬缺陷场景须留至少一次真实 failed 观察。缺原件或未执行独立消费时明确 unavailable/未执行，不能报告已完成检查或质量通过。

appendRecord 的 INVALID_SLUG、INVALID_EXTENSION、EEXIST 重试、RECORD_SEQUENCE_EXHAUSTED 和实际读写错误按原代码、路径披露。目录须真实且已存在；slug 限 [a-z0-9-]{1,48}，ext 限 [a-z0-9]{1,16}，同目录当日序号超过 999 显式失败。保留各次实际原件，冲突不能静默覆盖或退回固定名；外部删除或清理导致材料消失只披露，本方法不能保证其恢复。

## 结束条件与边界

下一会话能从实际交接路径定位当前材料、四类 source、未知/失败与一个可执行下一步；发布前检查原件、不可变 handoff、写后只读确认和必要非实现者消费均按实际情况报告，缺项不假称完成。五个 workflow 保存句使用本方法返回的实际绝对路径，build-code 与 verify-code 读取同一方法。

正式阶段事实仍由既有任务流程记录，本技能不新增 facts 状态/evidence 字段、writer、schema、公共命令、解析器或持久对象；不写状态/质量 graph，不把测试 GREEN 当作人类接受、发布或物理交付。按需布局不要求13有序区块、reflection 终态、locks、snapshot/hash 或 skill-deps 认证发布。缺交接只披露，同任务继续修复不依赖它。
