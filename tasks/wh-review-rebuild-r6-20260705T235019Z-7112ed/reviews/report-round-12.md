# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 12)

- verdict: revise_required
- provenance: single-context

## Summary

先收敛 4 个硬点：真实目标路径、3rd-review 落地来源、唯一落盘目录契约、F7 自动推进例外；再进入 build-plan/实现，否则验收会失真。

## Findings

- [blocking] 问题: 目标文件集合写错，stage 落点与仓库现状不一致 | 建议: 规格多处把改动目标写成“5 个 stage 的 SKILL.md”并放在 `skills/` 语义下，但当前仓库的 5 个 stage 文件实际位于 `workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`。如果不把目标路径和受影响文件清单改成 `workflows/` 真实落点，执行者可能去改错目录、额外创建重复 skill，验收也无法判定覆盖是否完整。
- [blocking] 问题: `skills/3rd-review/` 被当成既有文件，但仓库里并不存在该落点 | 建议: 规格要求“精简 `skills/3rd-review/SKILL.md`”，还要求改写其 §7、保留其纯引擎接口；但当前仓库没有 `skills/3rd-review/`，只在 `skills/reuse-registry.md` 里把 3rd-review 记为外部依赖。规格没有定义这次是先把外部 skill vendoring 进仓库、还是新建兼容壳、还是继续依赖外部路径。实现入口缺失，导致 in-scope 产物、来源锚点、验收对象都不确定。
- [blocking] 问题: 报告与轮次状态的落盘路径契约前后不一致 | 建议: 同一规格里同时出现“当前任务目录”“任务目录下固定子路径”和 AC1-3 的 `ls <task-dir>/<task-id>/reviews/` 三种表述，但没有给出唯一的 task root 发现规则和最终目录公式。这样会直接影响 wh-review 的 route-decision、round state、report_path、AC1-3/AC4-2/AC-D10 的实现与测试，执行者无法知道应落到 `<task-dir>/reviews/` 还是 `<task-dir>/<task-id>/reviews/`。这个路径契约必须先收敛成唯一规则。
- [blocking] 问题: D2 自动推进规则与宪法 F7 冲突，缺少例外批准依据 | 建议: 规格明确要求 `build-spec`、`build-code` 在 pass 后自动推进，但项目宪法 `CONSTITUTION.md` 的 F7 明确写的是“阶段推进与不可逆操作必须经人在边界确认，不由系统自动越界执行”，且治理段说明宪法优先于其他临时约定。若本次要保留两条 auto-advance 路径，规格必须显式记录经批准的例外或同步修宪；否则实现出来也属于不合宪交付。
- [minor] 问题: §7 机器校验规则过弱，容易假通过 | 建议: FR-THIRDREVIEW-002 只给了 `^\s*\d+\.` 和 `/\bif\b.*\belse\b/` 这类模式。后者只会抓到同一行同时出现 `if` 和 `else` 的文本，抓不住分行条件、`when/unless/otherwise`、中文条件分支等常见写法，无法支撑“删除所有 if/else 逻辑”的验收结论。建议把规则改成更完整的禁用模式或改成人工审读要求。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：目标文件集合写错，stage 落点与仓库现状不一致
- 必须修复：`skills/3rd-review/` 被当成既有文件，但仓库里并不存在该落点
- 必须修复：报告与轮次状态的落盘路径契约前后不一致
- 必须修复：D2 自动推进规则与宪法 F7 冲突，缺少例外批准依据

