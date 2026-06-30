# agenthub design.md 逐块评估：留 / 删 / 改

> task-id: m13b-build-spec-deepening ｜ 2026-06-30
> 源：`multica-agenthub/.../vibecoding/stages/design.md`（247 行，已亲读全文）
> 准则：workflowhub CONSTITUTION（薄核心、记事实不阻断、不写阻断门）+ Hugh「不是全保留，很多是浪费 token 的无效流程」
> 性质：本评估是 S5 盲审/debate 的新对象，待 Hugh 确认后再做修正版异源审查。

## 留（高价值、低 token，搬进 build-spec）

| 块 | 行 | 为什么留 |
|---|---|---|
| Goal/Inputs/Allowed/Forbidden | 23-64 | spec 构建本体：speckit-specify/clarify、平台约束交叉比对、扎根读 decision-log。真活。 |
| 最简 spec 阶梯（4 层决策闸） | 74-89 | 反过度工程，正对宪法 F10。决策闸非调研，便宜。 |
| spec.md 三档章节（A硬门/B条件/C精简） | 90-111 | 范围分档的质量结构，低 token 高价值。 |
| 测试策略前移（业务侧验收用例） | 112-120 | 行为验证来源。但 build-spec 只点「属哪类+测试边界」，细节让位 build-plan。 |
| 7 条自检清单 | 128-136 | 非阻断自检，便宜。含 Spec-Purity grep（纯事实粗筛）。 |
| 异源审查触发（3rd-review） | 138-149 | 独立审查，宪法明确要的护城河。 |
| 验收行为验证规则 | 202-204 | 「验行为不只验结构」高价值原则。 |
| 命令定位 --task-dir / FR-TASKDIR-001 | 240 | 直接对接 Hugh 的 TASK_TRACKING_ROOT 决策，保留并适配。 |
| 反馈动态触发（摩擦即记） | 244-246 | capture-workflow-feedback 精神，便宜。 |
| Known Gaps 诚实表 | 206-211 | 诚实记缺口，便宜。 |

## 改（检查逻辑全留，阻断语义改成记录+浮现+人确认）

| 块 | 行 | 怎么改 |
|---|---|---|
| Pre stage_exit 6 条门 | 5-12 | 6 条检查保留为自检事实；删 gate.sh stage_exit 的「没过不能进」阻断。 |
| Post-Review Pass（post_review_pass + stage_advance 双 BLOCK） | 14-21 | 检查保留；「缺一步就 BLOCK」改成记录+浮现边界，由人确认推进。 |
| Exit Conditions / Checkpoint（jq verdict=pass 卡推进） | 151-163 | verdict 作为事实浮现，不作阻断门；revise/escalate 仍提示但不死锁。 |

## 删（浪费 token 的无效流程 / agenthub 专属、workflowhub 无对应）

| 块 | 行 | 为什么删 |
|---|---|---|
| 待办模板 TodoWrite 仪式 | 3, 213-226 | workflowhub 工头协议已管派活/拆解，这套是 agenthub 专属仪式，重复占 token。 |
| [DECOMP] 行 + observe-ability-usage.mjs | 229-238 | agenthub 专属遥测计数，workflowhub 无此观测脚本，纯开销。 |
| host 自动写 capture+stage_summary 绑 gate 的描述 | 18 | 绑在阻断门上的自动写仪式，门删了它也没意义。 |
| Required Skills C 组「gate 通过后按序必调否则 BLOCK」 | 174-176 | 强制顺序+BLOCK 语义违宪；capture/stage-summary 保留为普通留痕、去掉强制门。 |
| Steps verifiedBy 里纯 gate 仪式校验 | 181-200 | 机器校验里「artifact_exists/journal_event」保留为事实记录；纯为过门的仪式步删。 |
| Exit Conditions 重复行 | 158-159 | 源文件「verdict=pass」连写两行，明显冗余，删一行。 |

## 一句话结论

build-spec 深化 = 留「spec 构建本体 + 分档 + 自检 + 异源审查 + 行为验证 + 摩擦即记」这套薄质量能力；3 道门改非阻断；删掉 agenthub 专属的 TodoWrite 仪式、[DECOMP] 遥测、绑门的自动写仪式这些纯 token 开销。这与 debate#1「定义质量事实契约、机制反选最少」一致。
