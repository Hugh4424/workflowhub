# P10/T021 提案独立只读审查（2026-09-28）

结论：提案正确保留了“测试执行”“正式验收场景”“独立业务效果”三种事实的界线，也正确指出当前缺唯一验收 Task/真实场景、固定回执没有进入逐 AC 原件。**但现在直接实施整套解析器扩展和回执发布，会先扩大协议，仍不能使 P10 验收成立。**建议先取得真实场景及其独立观察，再决定最小材料/代码形状。本文不改材料、代码或 Task facts，未运行测试。

读取快照：HEAD `ef920f1fbd415fe87d50930359059b661e141acd`；`stage-runner.mjs` 工作树 Git blob `be2fbf3edc7073b5253a75264a4771e0b3095d64`，`stage-handlers.mjs` `5020a39ffda31c816f38b678f9cda30a0dde707b`，`stage-content-contracts.mjs` `3e5c79496b945bddedd0a95d8ffc5a0c7427919c`，`case-reconciliation.mjs` `486cffebd3c15d11c554935af550bedbeb233d0c`，目录 `86df3700db68a0ee082a97da1b914745f5b07ffb`。并行 agent 正改 `verifyOfficialEvidence`；本审查不评价该函数修后的最终字节。

## 可行动问题

1. **逐场景 AC 字段是有条件需要，不是 AC-26/27 的必需新协议。** 当前解析器把验收 Task 的全部 AC 给每个场景；执行器能要求每个场景各返回各 AC 的独立叶。若一个真实受控场景确实逐一观察全部 AC，现协议即可表达，不必新增字段。但把三个 P8 seed 当三个独立场景时，现协议会串号；此时才需要显式逐场景 AC 子集。先审定实际场景，不能为了目录三行先改变通用解析协议。负控：声明 AC-26/27 的单场景只回 AC-26，必须失败；三个各自场景在当前协议下均要求全部 AC，也必须先展示真实错配。
2. **同一个 AC-27 聚合事实不能同时是通过和缺失。** `case-reconciliation.mjs#readCurrentEffect` 给两个 AC-27 seed 读取同一逐 AC fact：机器类别 seed 恒回 `independent_effect_reader_unavailable`，旧延期 seed 却要求同一 wrapper 为 `missing/deferred`；若两个正向场景均通过，聚合 AC-27 应为 `passed/pass`，这个旧延期判据就必然失败。旧延期场景的 *被测输入* 可以是 missing/deferred，而该场景的 *验收结果* 应通过；要从现有逐场景叶和原始输出核这层区别，并以两个场景合成 AC-27。不能为满足旧读路而把聚合 AC-27 降为 missing，也不能另建第二验收权威。负控：只给两个场景其中一个成功、把“输入是 deferred”误写为“聚合 AC 通过”、叶与场景身份错绑。
3. **仅把 receipt 添加给 `publishAcceptanceQualityFact(... evidenceRefs)` 会在一条成功叶时被跳过。** `stage-runner.mjs` 的逐 AC 发布循环在非浏览器、`covered/passed`、恰一条成功叶时传 `executionEvidence=actualLeaves[0]`；`publishAcceptanceQualityFact` 使用 `executionEvidence ?? {... evidence_refs ...}`。此路径完全忽略新增 `evidenceRefs`，所以提案中“补到逐 AC subject_fact.evidence_refs”不能靠简单追加参数实现。要么在不改原始叶的前提下生成新的聚合 stage-quality 原件并核叶引用，要么调整受信叶来源结构；同一目标测试须覆盖一叶和多叶两种形状，并证明 receipt 不会提升 status。
4. **当前 P10 reader 必须按本次调用定位质量事实，不能继续全 Task 同树搜一条。** `readCurrentEffect` 枚举 `listCanonicalQualityFactRefs()`，同树/材料 0 条给 missing，2 条给 conflicting。官方 `run` 可在同树多次写新 fact；即便每条都认证，直接全局搜索会拒绝合法的本次运行，或把旧回执与新运行混配。提案已有“本次消费原件/locator”方向，实施时应以其列出的本次 quality fact ref/hash 读取；0、重复、旧运行 locator 与当前行不符、同树 A/B 回执互换均 fail closed。此定位原件只记录已消费事实，不充当业务通过证明。
5. **三个 seed 远不足 AC-26/27/33 全验收。** P8 自称有限目录，三项效果全 `not_yet_observed`；AC-26 还要求诊断原样可见、机器状态和阶段报告“没做到”；AC-27 是四类可表达、非法值拒绝、质量存储不变成 passed、旧记录字节不变，且旧 123 条缺冻结逐文件基线；AC-33 还要失败原件、同任务修复、新快照重选与邻近回归。此前 P10 只读采样有 208 条受影响路径未映射；在此状态下 `reconcileCurrentTaskCases` 于读业务效果前就返回 `unmapped_changed_path`。补三个场景、补回执也不能说 P10 完成。
6. **独立 oracle 不能来自场景脚本自己填的 expected/actual。** 当前 `deriveAcceptanceExecutionAssertions` 只做脚本输出值相等核对；恶意或错误脚本可写 `expected=true,actual=true`。正式场景可复用现有 `service`（worktree 相对模块）或 `command` 受控子进程和官方 `verify/run` 回执，但必须由另一只读路径根据当前材料、Task 原件及正反输入重算预期，读 stdout/stderr/hash 与过程身份。P8 测试名、test exit 0 只能证明定向测试结果，不能自行升级为业务效果。

## 最小顺序

1. **先完成现有事实入口**：按 P6/P7 原材料做 AC-26 诊断/报告链与 AC-27 helper/旧字节实测，保留无法证明的 123 条兼容为 unknown；把 P8/P9 的真实变化路径和测试库存映射到能安全运行的固定 P10 命令。此前采样的 208 条未映射先复核处理，仍未解决则如实保留 P10 unavailable。
2. **逐例选真正入口与独立读取者**：优先用现有官方 `verify` 固定回执、`run` 事实和现成 Node 导出/受控 `service`；如这些已经满足具体 AC 判据，就不要另造 adapter。只有对不能由现有原件证明的判据，才新增一支最小的受控场景适配器；正、反、恢复原始字节与清理均保留。由独立读取者从原件重算，不让脚本自签。
3. **再定验收 Task 材料形状**：若单一真实场景可诚实给 AC-26/27/33 各自独立叶，现解析协议足够；若需多个不同场景，build-plan owner 才登记 `acceptance_criterion_ids` 子集合同和失败负控，并在唯一 Task 保留 AC-33 独立场景。场景 `sample` 对 P8 case 的映射是本卡业务规则，应由目录/reader 核，不宜无条件塞成所有 post Task 的解析器规则。
4. **最后补来源关联**：P10 owner 只从官方实际输入、已认证的固定 receipt→output→manifest→原始 reporter 与当前 case→AC 映射，给本次逐 AC 聚合原件补 ref/hash；状态仍取各场景及独立效果。覆盖一叶快捷路径、多叶聚合、同树 A/B、旧树、目录/库存漂移、坏 hash、半写和并发换行；独立 reader 以本次 locator 取 fact，不枚举历史猜“当前”。源链完整只证明“执行并被本次消费”，业务效果还须各自判。

`verifyOfficialEvidence` 的独立 JSON 值比较属于可立即处理的有界修复；它只解决正式回执误拒，与上述业务验收互不代替。现有七类公共命令、Task 质量事实、验收场景叶可作消费者与原件，不需要新公共命令、第二进度账本或凭测试绿自动过关。
