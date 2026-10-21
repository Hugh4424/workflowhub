# N8 归档摘要与技能档位更正

性质：N8 归档 spec 的更正件；归档原文不改。当前读者以本件覆盖下述三处摘要与术语矛盾，不新增矩阵、字段或第二进度权威。

## 与归档的关系

来源是 `specs/archive/n8-four-level-route-20261019/spec.md`；用户 2026-10-21 明确不允许修改归档 spec。矛盾位置为 :31/:98/:285，正确侧为 :121/:619。本件只更正被点名内容，不复制整份 spec；归档历史与验收缺口保留。

## 普通路线审查摘要更正

- :31：普通先逐模块收敛后做一次方案审（detail 轨），整次实施再做一次实现审，审查面直接复用 build-code。
- :98：普通任务先逐模块收敛后做一次方案审（detail 轨），整次实施再做一次实现审，审查面与 provider 同 build-code。
- :285：普通任务先逐模块收敛后做一次方案审（detail 轨），整次实施再做一次实现审，直接复用 build-code 审查面。

## 术语更正

:121 的“方案审一次”指逐模块收敛后的方案审（detail 轨）；:619 的“代码审”统一读为“实现审”。AC-FLOW-3 判据强度不变；普通路线不另开方向审。

## normal intake 更正

`flows/normal/SKILL.md` 的 intake-decision-review 由按需恢复跳过，对齐归档 PRD :83 的普通档字面，不算降档。mini-task 退役与根复杂表的 N6 继承不在本件扩围。

## 技能档位降档登记

来源：`specs/archive/skills-framework-redesign-20261014/prd.md:62/:83/:84/:85`，消费者正文是 `workflows/make-decision/flows/` 对应档位的 SKILL。下表为原矩阵的五处差异登记，不新增矩阵文件或字段；每行技能定义/消费者不变。真实调用数与成本未测，不把静态档位登记当运行结果。

| 档位 | 技能 | 原档位来源 | 当前消费与理由 | 成本事实 |
| --- | --- | --- | --- | --- |
| small | talk-with-zhipeng | PRD :62 必需→按需 | small/SKILL.md:99；有会改变方向的未决问题才读，零问题不追加空轮；定义/消费者不变。 | 真实调用与成本未测 |
| normal | plan-ceo-review | PRD :84 必需→按需 | normal/SKILL.md:136；真实选中产品镜头才读，不额外起审；定义/消费者不变。 | 真实调用与成本未测 |
| planning | intake-decision-review | PRD :83 必需→按需 | planning/SKILL.md:121；选定 intake 镜头才读，未选不另起；定义/消费者不变。 | 真实调用与成本未测 |
| planning | plan-ceo-review | PRD :84 必需→按需 | planning/SKILL.md:122；真实选中产品镜头才读；定义/消费者不变。 | 真实调用与成本未测 |
| planning | review | PRD :85 必需→按需 | planning/SKILL.md:123；有对应镜头/真实实现 diff 才读；定义/消费者不变。 | 真实调用与成本未测 |

## 历史验收边界

归档 `phases/P7-四级验收与成本对照.md:201/:229` 的 AC-FLOW-3 与真实四路/负例/对照仍为 incomplete；按 D-021 不重跑，不改历史。错序负例未建立/未跑，原历史 owner 为 verify-code。本任务新增静态顺序断言只验证书面顺序，真实执行顺序未验证。
