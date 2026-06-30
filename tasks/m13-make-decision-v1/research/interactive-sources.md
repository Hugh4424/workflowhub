# M13 Interactive Actions — Source Research Notes

## 1. talk-with-zhipeng

**Source**: `/Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/talk-with-zhipeng/SKILL.md`

- Trigger: 调研完成后、方向确认前；剩余问题中有 high/medium 影响未收敛时进入。
- 调用形状: 编排层(make-decision)直接调用本 skill；交互由主管家在主上下文内完成，禁用 AUQ，一次只问一个问题，按对方向影响排序，每答重排直到无 high/medium 为止。
- 输入: 已有调研结论 + 未收敛问题列表（带影响评级）。
- 输出: 结构化决策记录（含范围四维判定：痛点/复杂度ROI/风险/时机，每维标证据来源），写回 spec/decision-log。

---

## 2. grill-with-docs-lite

**Source**: `/Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/grill-with-docs-lite/SKILL.md`

- Trigger: talk 收敛后，方向确认前；对已有文档/需求边界逐条质询压测（范围/验收标准/隐含假设）。
- 调用形状: make-decision 编排层调用；内部薄壳，不加载外部 grill-with-docs 正文，只保留盘问流程骨架，交互在主上下文完成。
- 输入: 当前 spec 草稿 + talk 产出的决策记录。
- 输出: 盘问出的明确边界 + 隐含假设显式化，写回 spec/decision-log 并标来源（SKILL.md 行号）。

---

## 3. debate（外部 repo）

**Source**: `/Users/Hugh/Hugh/Project/debate/SKILL.md`

- Trigger: grill 压测后，发现方向级分歧（问题定义/范围/需求解释）或需规避 self-preference bias 时触发；决策对抗阶段。
- 调用形状（外部 repo 调用）:

```
# make-decision 内登记 reuse-registry 后，用 Skill 指令调起：
/oh-my-claudecode:debate
# 或通过 skills/ 路径引用外部 repo：
source: /Users/Hugh/Hugh/Project/debate
skill: SKILL.md
```

  实际机制：环境有 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 时走五方法庭对抗（spawn 甲/乙/丙/丁四队 + 法官）；无则自动降级单人三档。触发前须写 `debate/trigger-decision.md`（含触发理由），缺此记录视为未执行。

- 输入: 审查发现清单 + Claude 当前决策 + decision-log 版本号（方案版本锚点）。
- 输出: 逐条裁决表（采纳/部分采纳/驳回/存疑）+ `裁决书.md`，写入输出根下 `debate/` 目录。最多 2 轮强制停。

- reuse-registry 登记要求(D15/D16): 源路径 `/Users/Hugh/Hugh/Project/debate`，标注为外部依赖，非内嵌。

---

## 顺序约束

`talk（收敛）→ grill（压测）→ debate（对抗）`

debate 是可选便利层，环境不具备时自动降级，不阻塞工作流推进（D5: 不引入 blocking gate）。
