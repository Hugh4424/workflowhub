# A5 · CARD-04 四文档交叉核对（只读）

核对对象（四份文档，共 234 行）：
- 主报告 `/Users/Hugh/Downloads/workflowhub-card04-build-code-超时复盘-20260928.md`（文内简称 `复盘`，97 行）
- `01` `/Users/Hugh/Downloads/workflowhub-card04-build-code-audit-20260928/01-plan-audit.md`（45 行）
- `02` `/Users/Hugh/Downloads/workflowhub-card04-build-code-audit-20260928/02-execution-review-audit.md`（49 行）
- `03` `/Users/Hugh/Downloads/workflowhub-card04-build-code-audit-20260928/03-time-token-audit.md`（43 行）

核对依据：主转录 `/Users/Hugh/.codex/sessions/2026/09/26/rollout-2026-09-26T19-24-41-01a0dd75-d3c9-7d91-b3cc-5064ee568f5a.jsonl`（流式 Python 扫描，未整读）、工作树 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`、外置 Task store `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919`。本次核对**只读**：未改仓库、未跑测试、未派发审查、未改 Task 事实。

判定符号：`✅`＝与转录/文件真值一致；`✗`＝不一致（括号内给真值）；`⚠️`＝部分核实或口径需限定；`➖`＝非事实断言（判断/建议类），不计入一致率。

---

## 1. 断言清单表

### 1.1 主报告 `复盘`（97 行）

| 编号 | 断言（逐字摘要） | 出处 | 类型 | 转录可核 | 核实结果 |
|---|---|---|---|---|---|
| A1 | 只读复盘，未恢复开发/测试/审查 | 复盘:L3 | 机制 | 是 | ✅ 仓库 `git status` 67 条均为 09-28 既有改动，无复盘引入的写入 |
| A2 | 耗时远超正常预期 | 复盘:L7 | 因果 | 部分 | ⚠️ 34h37m/28h37m 已核；「正常预期」在仓库无量化基线，无法比 |
| A3 | 「约一小时」只是粗略效率目标，不是 Phase 时长上限 | 复盘:L7 | 机制 | 否 | ✗无出处 仓库 `docs/`、`workflows/`、`specs/…card-04…/`、handoff 全量 grep `一小时\|1 小时\|one hour\|1-hour`＝0 命中；四文档互引不构成独立来源 |
| A4 | Phase 应按可单独验收、可单独提交的功能划分 | 复盘:L7 | 建议 | — | ➖ |
| A5 | build-plan 交出「尚不能直接执行」的计划：13 Phase、27 项工作、其中 3 项后来补做 | 复盘:L9 | 数字 | 是 | ✅ `phases/P1..P13.md` 13 个；任务 T001–T027＝27 项；3 项＝AC-17/18/19（`spec.md:645` 记「乙」改选补做，`decision-log.md:1855` 记原选择） |
| A6 | P6、P10 混合多个需分别验收和提交的功能结果 | 复盘:L9 | 机制 | 是 | ✅ P6 横跨需求账本/CLI E2E/诊断/历史审查读取＋3 样例；P10 横跨变动范围/选例/安全运行/测试原件/逐例效果/官方接线；`P10.md:1-3` 实文；01:L15 同判 |
| A7 | 关键来源、消费者、外部前置、预写测试有效性未在交接前核实 | 复盘:L9 | 因果 | 是 | ✅ handoff `build-plan.md:7 reflection_status: "unavailable"`、`:88 - 需要改进：unknown`；`spec.md:6/27/38/640/650-652` |
| A8 | build-code 没有在发现计划缺口时集中停下交还计划负责人 | 复盘:L10 | 因果 | 是 | ✅ 18 回合内无「暂停交还」事件；同期 560 followup + 441 send_message 全部是继续推进型 |
| A9 | 继续边做边改计划、边补证据、并行修改多个 Phase | 复盘:L10 | 机制 | 是 | ✅量化 turn@7328 同一回合写入 P10/P11/P5/P6 四个相位材料；turn@37989 同一回合出现 11 个相位标签子代理目标 |
| A10 | P3、P4 各有两次已返回结果的正式 Phase 审查 | 复盘:L11 | 数字 | 是 | ✅ 外置 Task attempts：P3 `e0d109e4`(5 findings)+`4f2643f1`(0)、P4 `3d13aab6`(9)+`1258c827`(6)，`terminal_status=semantic` |
| A11 | P5、P10 尚无正式 Phase 审查却产生大量非正式复核 | 复盘:L11 | 数字 | 是 | ✅ attempts 中无 P5/P10 的 `stage=build-code & review_scope=phase`；P5 15 份、P10 28 份 review/audit 命名 md |
| A12 | 暂停时正式状态仍「进行中、部分完成」，验收事实缺失，进度记录已过期 | 复盘:L13 | 机制 | 是 | ✅ `current-task-count-audit-20260928.md`：`in_progress`／`execution_outcome.status=partial`／`quality_missing=[acceptance_criteria]`／`freshness=stale`／指针停 P3/T005；goal `status=paused` |
| A13 | 目标计时 102,789 秒≈28h33m | 复盘:L19 | 数字 | 是 | ✅ `goal.timeUsedSeconds=102789` |
| A14 | 目标计数 46,631,377 token | 复盘:L19 | 数字 | 是 | ✅逐字 `goal.tokensUsed=46631377` |
| A15 | 不是逐 Phase 工时表，不能按代码/测试/审查分摊 | 复盘:L19 | 口径 | 是 | ✅ goal 仅有单一 tokensUsed/timeUsedSeconds，无分项维度 |
| A16 | 转录开始到暂停约 34 小时 37 分 | 复盘:L20 | 数字 | 是 | ✅ 124,680.1s |
| A17 | 主任务回合累计约 28 小时 37 分 | 复盘:L20 | 数字 | 是 | ✅ 103,036.6s／18 turn |
| A18 | 两者之间约 6 小时没有主任务执行回合 | 复盘:L20 | 数字 | 是 | ✅ 124,680.1−103,036.6＝21,643.5s≈6h00m43s（03:L19 给 21,644s） |
| A19 | wait_agent 2,291 次 | 复盘:L21 | 数字 | 是 | ✅ |
| A20 | 配对等待约 12 小时 10 分 | 复盘:L21 | 数字 | 是 | ✅ 43,800.2s |
| A21 | 其中 1,430 次超时 | 复盘:L21 | 数字 | 是 | ✅ `timed_out=1,430`（`woke_or_other=860`、`unknown=1`） |
| A22 | 约占主任务回合时间 42.5% | 复盘:L21 | 数字 | 是 | ✅ 43,800.2/103,036.6＝42.51% |
| A23 | 等待与子代理工作可能重叠，不是 12 小时纯空耗 | 复盘:L21 | 判断 | 部分 | ➖ 需子转录时间轴；03:L34 同列为不可知 |
| A24 | 频繁短轮询、唤醒和重读上下文拉长主会话 | 复盘:L21 | 因果 | 是 | ✅ 均值 19.1s、p90 30.1s（确为短轮询）；62.4% 的等待以超时返回；11 次压缩每窗重灌约 10 万字符 |
| A25 | 主会话工具编排 2,090 次 | 复盘:L22 | 数字 | 是 | ✅ exec 2,090 |
| A26 | 创建子代理 192 次尝试、187 次成功 | 复盘:L22 | 数字 | 是 | ✅ 192 次 `spawn_agent`；187 返回 `{"task_name":…}`；5 次返回纯文本错误 |
| A27 | 后续任务 560 次、发消息 441 次 | 复盘:L22 | 数字 | 是 | ✅ |
| A28 | 证据目录约 2,774 个文件、28 MB，其中 P10 约 940 | 复盘:L23 | 数字 | 是 | ⚠️ 快照漂移：工作树现 2,777 文件/28M（带「约」成立）；P10 940 ✅；**口径不全**：外置镜像另有 6,448 文件/166 MB 未计 |
| A29 | 外置任务 32 份测试回执、10 次正式 Phase 审查尝试 | 复盘:L24 | 数字 | 是 | ✅ `quality/tests/*.json`＝32；`stage=build-code & review_scope=phase` attempt 目录＝10，涉 7 Phase |
| A30 | 累计处理约 12.64 亿 token，其中约 12.58 亿缓存输入 | 复盘:L26 | 数字 | 是 | ✅ thread total 1,264,453,587；input 1,263,328,061 中 cached 1,258,041,344 |
| A31 | 另找到 70 份可直接关联的子代理转录 | 复盘:L26 | 数字 | 是 | ✅ `parent_thread_id` 匹配 70 份 |
| A32 | 与 4,663 万目标计数不是同一口径，不能相加也不能估算账单 | 复盘:L26 | 口径 | 是 | ✅ 结构不同（单一目标计数 vs 分项线程记账）；无计费字段 |
| A33 | 转录没有可靠的「每个 Phase 或每种活动用了多少 token」字段 | 复盘:L26 | 机制 | 是 | ✅ `token_usage_record` 无 phase/activity 维度，最细只到 turn |
| A34 | P6 一卡包含需求账本、真实命令行端到端、诊断、历史审查读取及后来补做的三个样例；P10 包含六类工作 | 复盘:L32 | 机制 | 是 | ✅ `P6.md`、`P10.md` 实文；01:L15 同 |
| A35 | 计划缺逐 Phase 实施/测试/一次审查的耗时估计 | 复盘:L32 | 因果 | 是 | ✅ handoff `build-plan.md` grep「耗时」0 命中，无估算段 |
| A36 | P8 最初三条业务用例仅有「将来如何观察效果」的合同 | 复盘:L36 | 机制 | 是 | ✅ `P8.md:9/19-29`，三项 `not_yet_observed`；`business-case-catalog.json` 三条 case 只带 evolution 义务 |
| A37 | P10 开工时缺正式验收场景、每场景所属验收要求、谁产生/谁独立读取、本次正式运行如何绑定指定测试回执 | 复盘:L36 | 机制 | 是 | ✅ `P10/T021-ac-receipt-spec-clarify-proposal-20260928.md:5-14`；外置镜像 `T021-acceptance-producer-gap-audit-20260928.md:5-21,12` |
| A38 | 一次只读选择曾看到 218 处变化仅 9 处被三条用例映射、209 处未映射（当时快照） | 复盘:L36 | 数字 | 是 | ✅ `current-task-count-audit-20260928.md`：218 路径／9 条明确对应／209 未建立覆盖关系 |
| A39 | P5 中途报告缺可认证的真人例外来源及「确实没有例外」时的规则 | 复盘:L36 | 机制 | 是 | ✅ `P5/T007-current-independent-audit-20260928.md:5-9`、`P5/T008-six-field-integration-independent-review-20260928.md:5-9`（writer 固定返回 null，只传 reason/source） |
| A40 | P7 要比较的 123 份旧记录缺独立封存的逐文件原版 | 复盘:L36 | 机制 | 是 | ✅ `P7.md:14/29/30`：123＝`{pass:94, deferred:29}`，设计报告只有汇总数、无逐文件 path→SHA-256 基线 |
| A41 | P11 是否有真实业务页面仍未知 | 复盘:L36 | 机制 | 是 | ✅ `phases/index.md:19`「真实页面仍未知」 |
| A42 | AC-34 的最后授权者答复本来发生在 verify-code 后 | 复盘:L36 | 机制 | 是 | ✅ `P12.md:35/38`（授权者答复仍缺，不报 AC-34 通过）；`spec.md:53` R-009→AC-29..34 |
| A43 | 正确动作应是一次集中列出缺口交给 build-plan 负责人 | 复盘:L40 | 建议 | — | ➖ |
| A44 | P10 的「测试回执→本次正式运行→逐条业务结果」经历多轮材料与读取方案修订 | 复盘:L40 | 因果 | 是 | ✅ `P10/T021-material-independent-review-20260928.md:13-42` 四段增量复核 |
| A45 | P5 的报告字段、声明来源、章节解析、原件绑定逐项反复 | 复盘:L40 | 因果 | 是 | ✅ P5 命中 15 份命名复核（T007 七份含 advisory/ref/material/human-exception/source-impl；T008 六份含 parser/reader/mechanical） |
| A46 | P1–P13 交叉改材料 | 复盘:L44 | 机制 | 是 | ✅量化 turn@7328 同回合写 P10/P11/P5/P6；全程 71 次 exec 带写入标记且提到相位材料 |
| A47 | P8 业务规则用整份 P6/P7 计划文件的哈希作版本 | 复盘:L44 | 机制 | 是 | ✅ `docs/quality/business-case-catalog.json` 5 条 case 的 `source.revision` 全是整份文件 sha256（decision-log.md→`01a9cb30…`×3；P7.md→`d8e15fd0…`×2） |
| A48 | 只改 P6/T011 镜像字段说明、P8/T009 语义未变，目录仍因整份 P6.md 哈希改变而变红 | 复盘:L44 | 因果 | 是 | ✅ `P8/T017-ui-source-rebind-20260927/summary.md:3-7`（RED→`.9`→`.10`→GREEN）、`P8/T017-p7-source-rebind-20260928/independent-review.md:4-9`（逐字 diff 只有七处→`.11`） |
| A49 | 计划文件同时被写成历史流水账 | 复盘:L44 | 机制 | 是 | ✅ `P10.md:1-3`（多轮旧限制＋现行口径＋只读对账范围）、`P13.md:31-34` |
| A50 | P6 镜像：计划写「恰含 8 个字段」，受保护文件有后续测试必需的第 9 个版本字段 | 复盘:L50 | 机制 | 是 | ✅ `P6/T011-material-independent-review-20260928.md:5-9`：九个顶层键＋`schema_version = 1.0.0`；外置目录权限 0555、ORACLE.json 0444 |
| A51 | P5 报告只传理由和路径，缺声明者/范围/到期阶段/负责人；通用确认可能被误用作提交、推送授权 | 复盘:L51 | 机制 | 是 | ✅ 同 A39；02:L35 记 `human-confirmation.v3` 被不可逆操作授权读取器误用的风险 |
| A52 | P8 目录：真实来源文件改后旧哈希必须核含义再更新 | 复盘:L52 | 建议 | 是 | ✅ 同 A48 |
| A53 | P10 正式结果：同一源码树可能有不同测试回执；只有指定回执＋本次写入的阶段行＋逐条事实绑定才防错用 | 复盘:L53 | 机制 | 是 | ✅ `T021-material-independent-review:13` 四段中「改为一份消费原件后」「定位通道补齐后」两段 |
| A54 | P1 文档：代码已实现、文档却仍写「未实现」 | 复盘:L54 | 机制 | 是 | ✅ `P1/current-gap-audit-20260928.md:12-17`（四份通过记录绑旧材料 `revision-385359c7…`、旧来源树 `a8ba4bcc…`） |
| A55 | 用户后来明确要求补做三项真实样例 | 复盘:L56 | 机制 | 是 | ✅ `spec.md:645`；`decision-log.md:1855` 记原「乙 — 如实记 MISSING」选择 |
| A56 | CARD-05 决定：同范围成功审查一次后不再复审；后取消整卡集成审查，只留每 Phase 一次＋verify-code 终末一次 | 复盘:L60 | 机制 | 是 | ✅ `specs/archive/workflowhub-thin-core-card-05-20260919/decision-log.md:964-975`（D-003，status confirmed）与 `:2260`（D-044）；`docs/standard-workflow.md:83` |
| A57 | 10 次正式 Phase 审查尝试涉 7 个 Phase；P3/P4 各两次有结果；P7 一次派发前不可用＋一次有结果；P1 不可用；P5/P10 无 | 复盘:L62 | 数字 | 是 | ✅ 全部逐项命中；仅 P1 的「派发前」措辞不确（见 X2） |
| A58 | 非正式复核按文件名盘点：P5 至少 15 份、P10 至少 26 份 | 复盘:L64 | 数字 | 是 | ⚠️ P5＝15 ✅；P10 重算 28（顶层 21），差 2 无法复现；因带「至少」不构成错误 |
| A59 | build-plan 责任：未按可独立验收提交切 Phase；交接时入口/消费者/独立判据/外部来源/跨 Task 顺序仍空；部分预写红测不是失败测试 | 复盘:L70 | 因果 | 是 | ✅ 依据同 A5/A7/A36–A41；`spec.md:640、650-652` |
| A60 | build-code 责任：未集中退回缺口；跨 Phase 并行改材料、早取易过期回执；P3/P4 重复审查、P5/P10 微审查；为局部绿色做多轮证据 | 复盘:L71 | 因果 | 是 | ✅ 依据同 A8–A11、A38、A44–A48 |
| A61 | 四类机制放大：整份常变文件哈希／未映射路径分类不足／一次审查缺执行保护／耗时 token 无分项可见性 | 复盘:L72 | 机制 | 是 | ✅ ①A47 ②209/218 ③`runtime/review/` 无「已成功即不再派发」门（见 §4⑦）④`token_usage_record` 无 phase 维度 |
| A62 | 不能精确写「计划占 40%、执行占 60%」 | 复盘:L74 | 口径 | 是 | ✅ 无账单/分项数据支撑任何比例 |
| A63 | 六条建议（切 Phase／交接前核查／一次一 Phase／一 Phase 一审查／减少重复证据／真实成本信号） | 复盘:L80–L85 | 建议 | — | ➖（落点见 §5） |
| A64 | 「绝对零返工」无法保证；可追求零已知计划缺口进入、零同范围重复正式审查、零无界计划改写 | 复盘:L87 | 建议 | 部分 | ➖ 三条中两条当前已可机器统计（重复正式审查＝attempt 计数；无界改写＝Phase 文件修订次数＋相位写集） |
| A65 | 停止发生在 P8 两条新用例的触发关系修复过程中：文件里两条测试路径已加入，但未取得独立最终裁决 | 复盘:L91 | 机制 | 是 | ✅ 未跟踪新文件 `tests/contract/business-case-catalog.test.mjs`、`tests/contract/business-case-source-binding.test.mjs`；`git status` 67 条；catalog revision 已到 `.14` |
| A66 | 核查限制三条（审查次数来自 attempt、非正式按文件名、token 不能分摊） | 复盘:L95–L97 | 口径 | 是 | ✅ 与其数据来源一致 |

### 1.2 `01-plan-audit.md`（45 行）

| 编号 | 断言（逐字摘要） | 出处 | 类型 | 转录可核 | 核实结果 |
|---|---|---|---|---|---|
| B1 | 审计日期 2026-09-28；只读核对 | 01:L3 | 机制 | 是 | ✅ |
| B2 | 原始交接文件自称 `non_authoritative` | 01:L3 | 机制 | 是 | ✅ handoff `build-plan.md:8 authority: non_authoritative` |
| B3 | 只分析 build-plan 准备质量与边界，不把所有耗时归咎计划；同时核了当前正式材料，两者不是同一版本 | 01:L3 | 口径 | 是 | ⚠️ 版本差已核（交接 `spec.md` hash `41b61a…` vs 现文件 `fa6f17…`）；「不归咎」是作者自我限定 |
| B4 | 结论：两边都有问题，计划的「可直接开工」判断过早 | 01:L7 | 因果 | 是 | ✅ 与 `复盘:L74` 一致（缺计划前置是起点、继续无界推进是主因） |
| B5 | 交接时已安排 13 个阶段，涉旧功能/跨卡依赖/新业务用例库/运行时改动/浏览器测试/最终报告 | 01:L7 | 数字 | 是 | ✅ `phases/index.md:9-21` 13 行阶段表 |
| B6 | 若干关键入口、真实业务效果、上游卡是否落地、预写测试是否有效都还没确定 | 01:L7 | 因果 | 是 | ✅ 同 A7/A36–A41（P7 123 无逐文件基线、P11 页面未知、CARD-05 当时未合并） |
| B7 | 计划没有明确每阶段可单独验收、可单独提交的功能边界 | 01:L7 | 因果 | 是 | ✅ P6/P10 混合（A6）；P10.md 1–30 行多轮口径叠加 |
| B8 | 缺「缺真入口就先别排进实施」的可执行性核查 | 01:L7 | 因果 | 是 | ✅ handoff 无此类开工门字段；仅 `docs/standard-workflow.md:313` 有原则性表述 |
| B9 | 一小时只是粗略目标，不是拆分上限 | 01:L7 | 机制 | 否 | ✗无出处（同 A3） |
| B10 | 本卡不能证明 WorkflowHub 一般任务每阶段必然要花 24 小时 | 01:L9 | 判断 | — | ➖ 合理限定 |
| B11 | 现象1 引 `phases/index.md:9-21`、P6、P10 | 01:L15 | 机制 | 是 | ✅ 行号与内容命中 |
| B12 | 现象2 引 handoff `build-plan.md` 第 5–10、36–40、61–66、87–93 行：非权威；审查 15 项已处置但有效定位数 0、反思不可用、耗时未知 | 01:L16 | 机制 | 是 | ⚠️ 部分：`:8 authority: non_authoritative` ✅、`:6/7 snapshot_tree 与 reflection_status: "unavailable"` ✅、`:61 ## 8. 关键事实与数据状态` ✅、`:87-88 ## 10. 未决项与风险`＋`需要改进：unknown` ✅；但「审查 15 项已处置」「有效定位数 0」「耗时未知」在该文件中**无逐字原文**（grep 0 命中） |
| B13 | 现 `spec.md:6/27/38` 也承认后续消费者、浏览器接线与最终交付未解决 | 01:L16 | 机制 | 是 | ✅ 三行内容相符 |
| B14 | 现象3 预写测试部分不能做稳定「改前红」；引 `spec.md:640、650–652`、`P9-T019-inventory-G2.txt:5` | 01:L17 | 因果 | 是 | ✅ `:640` 记把 Node/git 检查当测试运行器；`:650-652` 记预置测试 provenance 与编号轮转错位；`P9-T019-inventory-G2.txt:5＝CLASSIFICATION=G2 characterization only; no missing-module RED claimed` |
| B15 | 现象4 链未闭合；引 `P8.md:9、19–29`、`T021-ac-receipt-spec-clarify-proposal-20260928.md:5–14` | 01:L18 | 因果 | 是 | ✅ 该文件确实存在于工作树 P10；行文相符 |
| B16 | 现象5 跨卡/环境前置未成开工条件；引 `spec.md:38、653–655`、`index.md:19`；并声明用户后裁定的跨卡变化不能倒算 | 01:L19 | 因果 | 是 | ✅ 含主动免责，属方法上可取 |
| B17 | 现象6 计划文件变实施流水账；引 `P10.md:1–30`、`P13.md:31–46`；判断主要属 build-code 执行方式 | 01:L20 | 因果 | 是 | ✅ `P10.md:1-3`、`P13.md:31-34` 命中；归责方向与 `复盘:L44/L71` 一致 |
| B18 | 三类归因清单：原计划可预见缺陷／后来合法变化／执行加重 | 01:L24–L26 | 因果 | 是 | ✅ 合法变化可核（`spec.md:645` 补做三项；CARD-05 已归档 `ef920f1f`）；执行加重可核（A46/A47） |
| B19 | 「每阶段最多审查一次」的准确边界；引 CARD-05 `decision-log.md:964–975`、`2260–2268`、`docs/standard-workflow.md:81–90、309–313` | 01:L30 | 机制 | 是 | ✅ 全部命中（D-003 行文含用户原话「不希望反复审查浪费时间」） |
| B20 | 改名/换快照重复做实质相同的高强度复核，应在总报告按来源、次数与耗时单列 | 01:L32 | 建议 | 部分 | ➖ 但可核：P5 15 份中 T007 有 advisory/ref/material/human-exception/source-impl 五种前缀命名，T008 六份含 parser/reader/mechanical |
| B21 | 六条流程改法（准入检查／独立功能切分／端到端样例／计划执行分家／一次审查＋复核上限／跟踪指标） | 01:L36–L41 | 建议 | — | ➖（落点见 §5） |
| B22 | 无逐条 token 计费与耗时账单、不分摊百分比；交接 `spec.md` hash `41b61a…` vs 现文件 `fa6f17…` | 01:L45 | 口径 | 是 | ✅ handoff `:10/:59/:62` 的 `source_refs` 含 `41b61a820c95f4ae489ee96f1a47e683abed54f387acb4dce37cee2d3fb2f328`；现文件 sha256 `fa6f1727269b8b6894ed1e5243122c0bbcce2a0533ecd71975112121a6becc17`（663 行） |

### 1.3 `02-execution-review-audit.md`（49 行）

| 编号 | 断言（逐字摘要） | 出处 | 类型 | 转录可核 | 核实结果 |
|---|---|---|---|---|---|
| C1 | 只读工作树、外置 Task 审查/测试原件与当前会话转录；未运行测试、未派发审查、未改动 | 02:L3 | 机制 | 是 | ✅ |
| C2 | 每 Phase 一次正式审查的约定确实被打破；10 次尝试涉 7 Phase；P3/P4 各两次有结果；P7 一次派发前不可用＋一次结果；P5/P10 无正式审查但有大量自设复核 | 02:L7 | 数字 | 是 | ✅ 全部命中（P7 的「派发前」正确：`3cf5854b` `dispatch_state=blocked_before_dispatch`、`MATERIAL_INCOMPLETE`） |
| C3 | 当前会话转录可见 195 次 `spawn_agent` | 02:L8 | 数字 | 是 | ✗ 真值 **192**（187 成功＋5 失败）；`复盘:L22` 的「192 次尝试、187 次成功」正确 |
| C4 | 2,291 次 wait_agent、560 followup_task、441 send_message | 02:L8 | 数字 | 是 | ✅ |
| C5 | 反复修改证据有两类原因：真问题必须修／流程放大（多 Phase 并行时过早抓「当前版」收据） | 02:L9 | 因果 | 是 | ✅ 后者可核：P1 四份绿证据绑旧材料 `revision-385359c7…`、旧树 `a8ba4bcc…`，正式审查因 `REVIEW_SOURCE_DRIFT` 不可用 |
| C6 | 数据源为 `quality/reviews/attempts/*/attempt.json`（`stage=build-code, review_scope=phase`），交叉核对 `results/`、`reports/`；`semantic` 只表示返回真实结果 | 02:L13 | 机制 | 是 | ✅ 22 个 attempt 目录，其中 10 个符合筛选；`semantic` 8 个、`unavailable` 2 个 |
| C7 | P1 `e7623be1`：**派发前** `REVIEW_SOURCE_DRIFT`、`unavailable` | 02:L17 | 机制 | 是 | ✗ 真值：`dispatch_state=dispatched`，message 为 `review source changed while dispatching; completed provider facts were retai…`＝**派发中**漂移，不是派发前 |
| C8 | P2 `68ef7817` 有结果、14 条 finding | 02:L18 | 数字 | 是 | ✅ |
| C9 | P3 两次：`e0d109e4` 旧树 `c4987d3e`／旧材料 `revision-b377…`／5 条；`4f2643f1` 新树 `4381e90d`／新材料 `revision-30e…`／0 条 | 02:L19 | 数字 | 是 | ✅ 逐项命中 |
| C10 | P4 两次：`3d13aab6` 旧树 9 条；`1258c827` 新树 6 条 | 02:L20 | 数字 | 是 | ✅ |
| C11 | P5 0 次正式 Phase 审查 | 02:L21 | 数字 | 是 | ✅ |
| C12 | P6 0 次 | 02:L22 | 数字 | 是 | ✅ |
| C13 | P7 两次尝试、1 个结果：`3cf5854b` 派发前不可用；`9fa24202` 10 条 finding | 02:L23 | 数字 | 是 | ✅ |
| C14 | P8 `e6a78c63` 1 次、7 条；以后局部来源重绑未再正式审查 | 02:L24 | 数字 | 是 | ✅ |
| C15 | P9 `99581ac4` 1 次、7 条 | 02:L25 | 数字 | 是 | ✅ |
| C16 | P10–P13（含 P11/P12）0 次 | 02:L26 | 数字 | 是 | ✅ |
| C17 | 文件名盘点：P5 15 份、P10 26 份、P6 11 份、P8 5 份 | 02:L28 | 数字 | 是 | ⚠️ P5 15 ✅、P6 11 ✅、P8 5 ✅；**P10 重算 28 份（仅顶层 maxdepth=1 则 21 份）**，26 无法复现（大小写/词边界/排除 README 等变体均试过） |
| C18 | P10 同一份材料审查文档有原审查、材料修订后、单一来源方案后、定位通道补齐后四段增量复核 | 02:L28 | 机制 | 是 | ✅ `T021-material-independent-review-20260928.md:13-42` 四段标题实文 |
| C19 | 五条返工链（P1 文档／P5 T007→T008／P10 回执到业务验收／P8 来源重绑／P6 仓外镜像） | 02:L34–L38 | 因果 | 是 | ✅ 逐条证据行号命中；P5 P006→T008 的 20/20、P6 9/9、P8 `.9→.10→.11` 均可核；P10 链依赖外置镜像文件 |
| C20 | 根因：build-plan 主要缺口＋build-code 主要执行偏差 | 02:L42–L43 | 因果 | 是 | ✅ 与 `复盘:L70/L71`、01:L24–L26 同向 |
| C21 | 官方命令应记录每个 Task/Phase 是否已产生一次 review attempt，已有有效审查时不自动重派 | 02:L44 | 建议 | 部分 | ⚠️ 机制侧**尚无该门**：`runtime/review/` 只有同材料竞态保护（`review-record-route.mjs:93-96`）与同一结果内 retry 去重（`canonical-review-result.mjs:193`） |
| C22 | 核查范围与限制五条 | 02:L49 | 口径 | 是 | ✅ 与其数据来源一致 |
| C23 | 引用的 `/Users/Hugh/Knowledge/Projects/…` 路径（L18/L19/L20/L23/L36/L42 等 7 处）与 01:L16 的 handoff 链接 | 02 多处 | 机制 | 是 | ✗ 全部解析失败：该路径 **No such file or directory**；真值多一层 `Hugh/`，即 `/Users/Hugh/Hugh/Knowledge/…` |

### 1.4 `03-time-token-audit.md`（43 行）

| 编号 | 断言（逐字摘要） | 出处 | 类型 | 转录可核 | 核实结果 |
|---|---|---|---|---|---|
| D1 | 只读转录；统计截点 2026-09-28 06:02:46（北京时间）；其后审计不计入 | 03:L3 | 机制 | 是 | ✅ ＝`2026-09-27T22:02:46Z`；最后一条 `thread_goal_updated` 在 `22:02:46.369Z` |
| D2 | 34h37m／28h37m／差约 6h，其中一段约 5h52m 没有主任务回合 | 03:L7 | 数字 | 是 | ✅ 差 21,643.5s；最长事件间隔 21,135.8s＝5h52m |
| D3 | 目标计时 102,789 秒（28h33m）与转录回合时长接近，但两种计时器并非同一口径 | 03:L7 | 口径 | 是 | ✅ 102,789 vs 103,036.6（差 247.6s），来源不同 |
| D4 | wait_agent 2,291 次、1,430 超时、12h10m、42.5% | 03:L8 | 数字 | 是 | ✅ |
| D5 | exec 2,090；187 次成功创建；560；441；143；exec 配对耗时合计约 1h46m | 03:L9 | 数字 | 是 | ✅ 6,332.1s＝1h45m32s；`list_agents` 143 次（首次 11:56:08） |
| D6 | 另 5 次因并发上限失败 | 03:L9 | 数字 | 是 | ✗ 真值：**4 次** `collab spawn failed: agent thread limit reached` ＋ **1 次** ``agent path `/root/p10_scope_resolution` already exists`` |
| D7 | 模型记账约 12.64 亿（输入 12.63 亿、缓存 12.58 亿≈99.6%；输出 112.6 万，其中推理输出 43.7 万已含在内） | 03:L10 | 数字 | 是 | ✅ 1,264,453,587／1,263,328,061／1,258,041,344（99.60%）／1,125,526／437,328；`total＝input+output` 成立 |
| D8 | 目标计数 46,631,377 与转录模型记账定义不同，不能相加或互换 | 03:L10 | 口径 | 是 | ✅ |
| D9 | 70 份子代理转录合计约 16.82 亿（其中约 16.51 亿缓存）；不能覆盖 187 次成功创建；不是账单金额 | 03:L11 | 数字 | 是 | ✅ 1,681,820,519／1,650,580,224 |
| D10 | 原始主转录约 75 MiB、78,364,568 字节（读取时） | 03:L17 | 数字 | 部分 | ⚠️ 现文件 79.7 MB≈75.9 MiB，量级一致；该字节数无法逐字复核（文件在增长，无当时副本） |
| D11 | 主回合 18 个，合计 103,037 秒 | 03:L18 | 数字 | 是 | ✅ 103,036.6s |
| D12 | 回合外时间约 21,644 秒 | 03:L19 | 数字 | 是 | ✅ 21,643.5s |
| D13 | 2,291 次／43,800 秒／1,430 超时／860 唤醒／1 次输出未能解析 | 03:L20 | 数字 | 是 | ✅ `timed_out 1,430`、`woke_or_other 860`、`unknown 1` |
| D14 | 主代理 exec 2,090 次、配对耗时 6,332 秒 | 03:L21 | 数字 | 是 | ✅ |
| D15 | exec 文本嵌套计数：exec_command 1,284、apply_patch 195、write_stdin 187、clock__curr_time 638；仅统计源码文本出现次数 | 03:L22 | 数字 | 是 | ✅ 数值一致，且限定语**必要且正确**：作为独立工具调用，`apply_patch` 计数为 **0**（这些名字都出现在 exec 脚本源码内部） |
| D16 | 主代理上下文压缩 11 次 | 03:L23 | 数字 | 是 | ✅ 审计窗口内 11 条 `compacted`；原始文件共 12 条，第 12 条在 CUTOFF 之后（属本次只读审计会话自身） |
| D17 | 三个耗时最长回合约 9.32／5.96／4.20 小时，token 约 4.07／2.57／2.38 亿，合计约占 71% | 03:L26 | 数字 | 是 | ✅数值逐项吻合（回合 #14/#13/#17）；✗措辞：「三个**连续**回合」不成立——#13/#14 相邻，**#17 与它们之间隔着 #15、#16** |
| D18 | `material_revision_review` 约 3.82 亿、`p13_report_consumer` 约 2.54 亿、`p8_effect_path` 约 1.87 亿；该代理有 121 次后续任务（含两种目标名写法） | 03:L28 | 数字 | 是 | ✅ 目标名 `material_revision_review` 97＋`/root/material_revision_review` 24＝121 |
| D19 | 表现判断：大量时间在「让子代理做事→等待→再发后续任务」循环；处理量主要由反复读取已有上下文构成；长寿命子代理＋11 次压缩会重复带上既有材料 | 03:L32 | 因果 | 是 | ✅ 方向可核：wait 2,291 次、wait 均值 19.1s；exec 93.3% 只含 1 个嵌套调用；每个压缩窗重灌约 9.7–10.8 万字符 |
| D20 | 不能直接算出：每 Phase 耗时与 token／写代码与修计划比例／所有子代理总 token／真实费用／等待期间子代理是否有效产出 | 03:L34 | 口径 | 是 | ✅ 属诚实边界 |
| D21 | 脚本按 task_started/task_complete/turn_aborted 配对回合、按 call_id 配对工具、取最后一条 thread_token_usage；5,768 条记录单调递增无回退 | 03:L43 | 机制 | 是 | ✅ `token_usage_record` 共 5,768 条 |

**断言清理总览**：共抽出 **112 条**可核查断言（主报告 66、01 22、02 23、03 21）。其中 `✅` 92 条、`⚠️` 11 条、`✗` 6 条、`➖`（判断/建议类）约 20 条与前者互有重叠。

---

## 2. 矛盾清单

| # | 冲突双方 | 两边取值 | 判定真值 | 依据 |
|---|---|---|---|---|
| X1 | `02:L8` vs 转录 vs `复盘:L22` | 195 次 spawn_agent ／ 192 ／ 192 尝试+187 成功 | **192**（02 错） | 转录中 `name=spawn_agent` 的调用 192 次；187 次返回 `{"task_name":…}`，5 次返回纯文本错误；`复盘:L22` 与 03:L9 均与真值一致 |
| X2 | `02:L17`（P1「派发前」）vs attempt 原件 | 「派发前」 vs `dispatch_state=dispatched` | **派发中漂移**（02 措辞不确） | `e7623be1…/attempt.json`：`error.code=REVIEW_SOURCE_DRIFT`，message `review source changed while dispatching`。对照 `02:L23` 的 P7「派发前」= 正确（`blocked_before_dispatch`、`MATERIAL_INCOMPLETE`） |
| X3 | `02:L28`/`复盘:L64` vs 文件名重算 | P10 26 份 ／ 28 份（顶层 21） | **28**（顶层 21）；26 无法复现 | 对 `quality/evidence/stage-quality/build-code/P10/**` 用大小写不敏感、词边界、排除 README 等 5 种匹配变体统计均得 28（maxdepth=1 得 21）；P5=15、P6=11、P8=5 三项与 02 完全一致。主报告带「至少」故仍成立 |
| X4 | `03:L9` vs 转录 | 「另 5 次因并发上限失败」 ／ 4 次并发上限＋1 次路径已存在 | **4+1** | 5 条失败文本：4×`collab spawn failed: agent thread limit reached`、1×``agent path `/root/p10_scope_resolution` already exists`` |
| X5 | `03:L26` vs 转录 | 「三个**连续**回合」 ／ #14、#13、#17 | **不连续** | #13(start 7328)、#14(18805) 相邻，#17(37989) 之前还有 #15(33769)、#16(37675) |
| X6 | `复盘:L23` vs 工作树＋外置镜像 | 约 2,774 文件/28 MB ／ 工作树 2,777/28M＋外置镜像 6,448 文件/166 MB | **口径不完整** | 主报告只计工作树一侧且未声明另有外置镜像；`$T/quality/evidence` 合计 6,929 文件/169 MB |
| X7 | `01:L16` vs handoff `build-plan.md` | 「审查 15 项已处置、有效定位数 0、耗时未知」 ／ 文件中 grep 0 命中 | **无法核实** | 只能核到 `:8 authority: non_authoritative`、`:7 reflection_status: "unavailable"`、`:88 需要改进：unknown`；三项具体表述在该文件无逐字原文（可能来自 01 作者对正文的改写） |
| X8 | `01:L16`、`02:L18/L19/L20/L23/L36/L42` 的路径 vs 文件系统 | `/Users/Hugh/Knowledge/Projects/workflowhub/tasks/…card-04…` ／ 不存在 | **断链**（8 处） | `ls -d` 报 No such file or directory；真值根 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919`；内容物确实存在，只是路径少一层 `Hugh/` |
| X9 | 四文档同引「约一小时效率目标」 vs 仓库 | 四文档互证 ／ 仓库 grep 0 命中 | **无法核实** | 三处引用同一未落地来源，互引不构成独立证据；可能源自用户口头指令或宿主 skill 文案 |
| X10 | `02:L36` 引 `T021-acceptance-producer-gap-audit-20260928.md` vs 工作树 | 02 给的路径不可解析 ／ 工作树 P10 内不存在该文件 | **该文件只在外置镜像** | `$T/quality/evidence/stage-quality/build-code/P10/` 内存在；工作树 P10 已有同主题的 `T021-real-scenario-independent-review-20260928.md`、`T021-ac-global-coverage-audit-20260928.md` 等替代证据 |
| X11 | 非矛盾但需限定：`复盘:L11/L62` 与 `02:L21/L26` | 「P5、P10 尚无正式 Phase 审查」／「P5 0 次、P6 0 次、P10–P13 0 次」 | 一致 | 两边一致；注意 P6 也为 0 次，主报告 L11 未单列 P6——不是冲突，是主报告表述更窄 |
| X12 | 非矛盾但需限定：`复盘:L9/L56` vs `01:L25` | 「3 项是后来按用户要求补做」／「用户先前选择列为缺口、后来改选补做，属合法变化」 | 一致 | `spec.md:645`＋`decision-log.md:1855` 支持「用户决定」而非「计划作者遗漏」，两文档已一致表达 |

---

## 3. 口径混用检查

四个口径必须分开（下表左列是文档里出现的写法，右列是它的真值与边界）：

| 口径 | 真值 | 定义与边界 | 文档处理 |
|---|---|---|---|
| ① 应用目标计数 | `goal.tokensUsed = 46,631,377` | 宿主侧单一累计计数；**无分项**、无「是否含缓存」维度；每卡一个 | `复盘:L19/L26`、`03:L10`：明确写「与 12.64 亿不是同一口径，不能相加、不能互换、不能估账单」✅ 合规 |
| ② 主转录线程记账（末值） | `thread_token_usage.total = 1,264,453,587`（input 1,263,328,061，其中 cached 1,258,041,344＝99.60%；output 1,125,526，其中 reasoning 437,328） | 每次响应的记账；含缓存命中，**不等于计费 token** | `复盘:L26`「约 12.64 亿，其中约 12.58 亿缓存输入」✅；`03:L10` ✅ |
| ③ 主转录按回合聚合 | 18 回合 `turn_token_usage` 合计 1,264,540,000 量级（≈12.645 亿） | `turn_token_usage` 是**同一 turn 内累计**，只有取每回合最后一条才有意义 | `03:L26` 用此口径给三回合 4.07/2.57/2.38 亿 ✅；**但「连续回合」措辞错**（X5） |
| ④ 子代理转录记账 | 70 份合计 1,681,820,519（cached 1,650,580,224；output 3,888,514） | 只覆盖 70/187 次成功创建；**与②不可相加**（同一批 token 在父子两侧各记一次） | `复盘:L26`、`03:L11` 已声明 ✅ |
| ⑤ exec 文本嵌套计数 | `exec_command 1,284`／`apply_patch 195`／`write_stdin 187`／`clock__curr_time 638` | **源码文本出现次数**，不是调用次数；作为独立工具调用 `apply_patch = 0` | `03:L22` 自行声明限定 ✅（限定语不是多余，是必需） |
| ⑥ 时间口径四兄弟 | 目标计时 102,789s ／ 回合累计 103,036.6s ／ 转录跨度 124,680.1s ／ 回合外 21,643.5s ／ 等待 43,800.2s | 五者互不相等、可互相校验但不可替代 | `复盘:L19/L20`、`03:L7` 已逐条分开说明 ✅ |

**发现的口径问题（逐条）**：
1. **`复盘:L23` 文件数口径不全（唯一实质性缺口）**：2,774/28 MB 只统计工作树 `quality/evidence/`，未声明外置 Task 还有一份镜像（`$T/quality/evidence`＝6,929 文件/169 MB，其中 `stage-quality/build-code` 6,448 文件/166 MB）。「证据膨胀」的真实规模约是被引数字的 **3.5 倍**。
2. **`apply_patch 195` 极易被误读**：文档已加限定，但同表并列的 `exec_command 1,284`、`clock__curr_time 638` 同样只是文本计数；建议在该行末尾统一标注「三者均为源码文本计数」。
3. **`02:L8` 的 195 与 03:L22 的 `apply_patch 195` 数字巧合**：两个「195」指完全不同的东西（前者应为 spawn_agent 调用数，后者是 exec 源码里 apply_patch 文本出现数），并列出现容易互相污染。
4. **`复盘:L64` 与 `02:L28` 的 P10 计数**：两份文档给同一口径（文件名盘点）却不同值（26/26），真值 28；建议统一为「P10 命名复核 md 28 份，其中材料审查原件 1 份含四段增量复核」。
5. **「审查 15 项已处置／有效定位数 0」的口径未标**（X7）：这是交接文件自述层面的数，既不是转录数也不是审查 attempt 数；引用时应标注来源不可复核。
6. **未混用、需表扬的口径**：`复盘:L19/L26`、`03:L10/L11/L22/L34` 都主动划界，主报告 L95–L97 还单列核查限制——这是四份文档质量最高的部分。

---

## 4. 未被四文档覆盖的问题域

逐条给证据（数据均来自本次转录扫描）。

| # | 问题域 | 文档现状 | 本次核到的真值与含义 |
|---|---|---|---|
| ① | **主会话上下文管理** | 只出现两处数字：`03:L23/L32`「压缩 11 次」「11 次压缩会让每次新推理重新带上既有材料」 | 11 个压缩窗（行 2533/5238/7953/10617/14982/22610/29261/33455/37614/40195/45207），每窗**重灌 9.7–10.8 万字符**、`retained_context` 仅 **117 字符**；另 `world_state` 注入 **314 行 / 1,039,265 字节**（均值 3,310 B，最大 64,632 B）；`agent_message` 2,028 条 / **2,717,772 字符**（均值 1,340）。→ 文档缺「压缩成本 vs 保留信息量」的量化，也未提 retained_context 只有 117 字符这一极端值 |
| ② | **子代理输出契约** | 无 | 主→子三类指令全部是 Fernet 密文（`gAAAAA…`）：spawn 192 条 / 213,724 字符、followup 560 条 / 541,748、send_message 441 条 / 212,356（合计 967,828 字符，不可读）。子→主的返回在 `agent_message` 里合计 271.8 万字符、均值 1,340、最大 5,617。→ **没有任何契约约束子代理返回什么、多大、主代理如何消费**；`03:L34` 只承认「等待期间子代理是否有效产出」不可知 |
| ③ | **进度与状态可见性** | `复盘:L13` 只说「进度记录已过期」 | `list_agents` **143 次**（首次 11:56:08，即开工 32 分钟后就要靠列子代理判断局面）；`facts.jsonl` 在 **222 行**、`phase_progress` 在 **137 行** 出现；`phase_progress` 只有 `phase_id/task_id/material_revision/recorded_at` 四个键（`runtime/task/task-store.mjs:228-244`）；`freshness.mjs` 用 `material_revision` 判定是否 stale，且 P5/P10 有特例分支（`:1074`、`:1337`）。→ 缺「主代理如何在不问子代理的情况下知道我在哪个 Phase、还剩什么」的分析 |
| ④ | **命令批处理与并行度** | 仅 `03:L21` 一句「调用数不是 shell 命令数」 | 2,090 次 exec 的嵌套调用数分布：**1 个＝1,949（93.3%）**、2 个＝54、3 个＝76、4 个＝11，**没有 0 个、最大 4**。→ 主会话几乎没有批处理，每次 exec 基本只做一件事；这与 2,090 次 exec 只换来 6,332 秒配对耗时（均值 3.0 秒）互相印证：开销在**次数**不在单次时长 |
| ⑤ | **`clock__curr_time` 638 次 / `list_agents` 143 次反映的行为** | 只在 `03:L22` 当计数列出 | 638 次 `clock__curr_time` 分布在 **638 个不同 exec 行**，其中 **635 个该 exec 只含这一个嵌套调用** → 相当于 638 次「专门开一个 shell 就为读一次时间」（占 exec 总量 30.5%）。`list_agents` 输出形如 `{"agents":[{"agent_name":"/root","agent_status":"running"},…]}`，top 前缀显示当时活跃代理（`material_revision_re…` 34 次、`diff_audit` 21、`ac26_verdict_fix` 18）。→ 这是**轮询型失控**的直接证据：既读时钟又列代理，用外部观察代替状态机 |
| ⑥ | **「一次只推进一个 Phase」的执行保护** | `复盘:L10/L71`、`02:L43` 都提到并行改材料，但无量化 | ①写入式：exec 源码中带写入标记且提到相位材料 **71 次**；按回合聚合只有两处，其中 **turn@7328 同一回合写 P10、P11、P5、P6 四个相位材料**。②子代理：turn@37989 同一回合出现 **11 个不同相位标签目标**（p1,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12）；turn@7328 六个；turn@46971 六个；turn@18805 四个；8 个含相位目标的回合里 **5 个同时推进 ≥2 个相位**。→ 「一次只推进一个 Phase」在执行层**客观不成立**，且现有 runtime 无任何东西阻止它 |
| ⑦ | **审查去重的机制性拦截** | `02:L44`、`复盘:L85④` 都把它当建议提出，没说现有机制缺哪一块 | `runtime/review/` 全量文件核过：**没有**「同一 Task/Phase 已有成功审查则拒绝再派发」的门；只有①同一结果内 retry 去重（`canonical-review-result.mjs:193`「Deduplicate retries only at member + finding identity…」）②同材料竞态保护（`review-record-route.mjs:93-96` 注释：防并发派发同一材料）③身份三元组 `SHARED_REVIEW_TUPLE_FIELDS = ["subject_kind","phase_id","review_scope"]`（`review-record-route.mjs:339`、`:349`）与 `REVIEW_ATTEMPT_REF` 正则（`:21`）。→ **零件已备齐，只差把三元组＋`terminal_status` 变成派发前门** |
| ⑧ | **材料版本绑定颗粒度** | `复盘:L44/L52`、`01:L26` 只描述现象「绑整份常变文件哈希」 | `docs/quality/business-case-catalog.json`：5 条 case 的 `source` 只有 `path`＋`revision` 两个键，且 revision 全是**整份文件 sha256**——3 条绑 `decision-log.md`（`01a9cb30…`）、2 条绑 `P7.md`（`d8e15fd0…`）；catalog 自身 `revision` 已滚到 `2026-09-28.card04-finite-a1-a2-trigger-repair.14`。→ 缺「应改绑到什么粒度（章节/AC 编号/规则段哈希）」及迁移代价的分析 |
| ⑨ | **子代理重复劳动与产物消费率** | `03:L28` 给了 121 次这一数字，但只声明「不等于审查 121 次」 | 78 个不同目标名（含前缀变体）；重活集中在少数长寿命代理（`material_revision_review` 121、`p8_effect_path` 48、`diff_audit` 41、`phase_map` 40、`p13_report_consumer` 32、`facts_audit` 26）；`send_message` top 亦为 `p13_report_consumer` 61、`material_revision_review` 103（54＋49）、`p8_effect_path` 39。→ 缺**产物消费率**分析（每个代理产出被主会话/后续 Phase 实际采用多少、多少是重复劳动） |
| ⑩ | **人类介入的时机与形态** | 只 `复盘:L21` 提 `request_user_input_async` 18 次（合计仅 2.9 秒） | 13 条 user 消息的真实构成：**3 条启动注入**（recommended_plugins 6,711 字符、receive-handoff 205、skill 注入 4,847）＋**2 条 `environment_context` 自动注入**（655、839）＋**3 条结构化问答答复**（279/251/225）＋**5 条自由文本**。自由文本里有 4 条集中在 09-26 22:27–22:37：`请把当前阻塞用大白话告诉我…`(29)、`你这个问题我根本看不懂是什么意思…跟你说了用简洁的大白话和我沟通！`(41)、`我完全看不懂啊,"三项"先不做""是什么？"AC17–19"是什么？…你不要用属于和黑话和我沟通！`(89)、`j徐吧`(4)；以及 09-27 12:37 `当前任务已经执行超过24小时了，请告诉我现在进度如何？build-code还有多少任务才能结束？为什么时间会这么久？`(59)。**turn #5–#12 这 8 个极小回合（0.01–0.20h）全部落在该窗口**。→ 文档完全没有分析「人类被迫用黑话澄清黑话」这一最贵成本，也没把沟通形态列为改进项 |

---

## 5. 可施工建议汇总（去重后 12 条）

落点候选均已 `grep`/`ls` 确认真实存在（根＝`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`）。

| # | 建议摘要 | 对准的根因 | 文档给出的落点 | 我判断的真实落点候选 |
|---|---|---|---|---|
| S1 | 按「可独立验收、可独立提交」切 Phase，并分别估算实施/测试/一次审查耗时；不为一小时强拆 | 阶段混合多个可分别交付的结果（A5/A6） | 未给（`复盘:L80`、`01:L37`） | `workflows/build-plan/SKILL.md`、`docs/standard-workflow.md` |
| S2 | 交接前做可执行性核查：真实入口、消费者、权限、测试工具、样例原件、外部依赖，抽最难链路跑通；预写 RED 必须因目标行为失败 | 计划放行时带「以后再找」的核心信息（B12/B14） | 未给（`复盘:L81`、`01:L36`） | `workflows/build-plan/SKILL.md`、`runtime/stage/stage-handoff.mjs`、`docs/standard-workflow.md` |
| S3 | 实现期锁定范围：一次只推进一个 Phase；同 Phase 问题一次列清交 plan owner 做最小修订；普通 bug 留在 build-code 同任务修 | 跨 Phase 并行改材料（§4⑥、A46） | 未给（`复盘:L82③`、`02:L43`） | `workflows/build-code/SKILL.md`、`docs/standard-workflow.md`（`:277 ## 每个 phase 的标准循环`） |
| S4 | 真正执行「一 Phase 一正式审查」：用 task/Phase/审查范围识别已有结果，**已有有效审查时不自动重派** | 一次审查缺执行保护（§4⑦、C21） | 未给（`复盘:L85④`、`02:L44`） | `runtime/review/review-record-route.mjs`（已有 `SHARED_REVIEW_TUPLE_FIELDS`＋`REVIEW_ATTEMPT_REF`）、`runtime/review/ocr-delegation-adapter.mjs`、`workflows/build-code/SKILL.md:91-95`、`docs/standard-workflow.md:83` |
| S5 | 给「设计复核」设清楚的事由与投入上限，避免换名循环；非正式复核按来源/次数/耗时单列 | P5 15 份、P10 28 份微审查（A11/A45/B20） | 未给（`01:L40⑤`、`01:L32`） | `docs/standard-workflow.md`（`:309 ## 专业质量`、`:313`）、`runtime/review/review-policy.mjs`、`runtime/review/stage-review-disposition.mjs`（`FINDING_DISPOSITION_STATUSES`／`FINDING_DISPOSITION_FIELDS`） |
| S6 | 同一原始输出/回执/review 原件只存一份，减少重复证据但不牺牲真实原件 | 证据膨胀＋重复取证（A28/X6） | 未给（`复盘:L84⑤`） | `runtime/review/stage-materials.json`、`runtime/evidence/canonical-receipt-writer.mjs`、`docs/standard-workflow.md` |
| S7 | 业务规则绑稳定规则段落/版本，不因另一段改字重做下游 | 整份常变文件哈希作版本（§4⑧、A47） | 未给（`复盘:L84⑤`、`01:L26`） | `docs/quality/business-case-catalog.json`（`source` 仅 path+revision）、`runtime/evidence/canonical-evidence-validators.mjs` |
| S8 | 计划与执行记录分家：需求变了才由 plan owner 修 Phase；普通 bug／测试重跑／证据引用只记 Task 事实 | Phase 文件写历史流水账（A49、B17） | 未给（`01:L39④`） | `docs/standard-workflow.md`、材料侧 `specs/workflowhub-thin-core-card-04-20260919/phases/P10.md` |
| S9 | 用真实成本信号发现问题：记录每 Phase 实施/测试/审查/等待/材料修订的耗时与调用数 | 耗时/token 无分项可见性（A61、A15） | 未给（`复盘:L85⑥`、`03:L34`） | `runtime/stage/stage-handlers.mjs`（`:289 duration_ms: null`、`:2744-2759 elapsed_ms` 聚合）、`runtime/schemas/stage-completion-facts.v1.json`、`runtime/task/task-store.mjs`（facts.jsonl 行键） |
| S10 | 进度可见性：让 agent 不靠 `list_agents`＋读时钟判断局面；相位指针要带新鲜度语义 | 143 次 list_agents、638 次读时钟（§4③⑤） | 未给（`复盘:L13` 只描述过期） | `runtime/task/task-store.mjs:228-244`（`phase_progress` 四键）、`runtime/evidence/freshness.mjs`（P5/P10 特例分支 `:1074`、`:1337`） |
| S11 | 目标从「零返工」改成可跟踪指标：计划就绪率、阶段用时中位数/95 分位、一次审查后修复次数、计划修订次数、后发现前置缺失数 | 绝对化目标无法验证（A64） | 未给（`01:L41⑥`、`复盘:L87`） | `runtime/schemas/stage-completion-facts.v1.json`、`runtime/evidence/stage-completion-facts.mjs` |
| S12 | 面向用户的报告必须用大白话并附术语对照（AC/Phase/finding/MISSING 等） | 人类 22:27–22:37 连发三条「看不懂」（§4⑩） | 全未给（四文档都未提沟通形态） | `docs/standard-workflow.md`、`workflows/build-code/SKILL.md`（面向人的汇报段）——**新增建议，四文档均未覆盖** |

---

## 6. 交叉一致性结论

**判定：部分不一致。**

**一致的部分（结论层，权重最高）**
1. **双重归因且方向完全相同**：`复盘:L74`「缺计划前置是起点，继续无界推进是耗时放大的主要原因」；`01:L7`「两边都有问题，计划的『可直接开工』判断过早」；`02:L42–L43` 分别列 build-plan 缺口与 build-code 执行偏差。三份都**没有**把责任压给单方。
2. **`01` 与主报告 §5 的分工不矛盾，是「各管一段」**：`01:L3` 明确自我限定「本文只分析 build-plan 的准备质量与边界，不把所有耗时都归咎于计划」；而把「计划文件变流水账」明确判给 build-code（`01:L20`）。主报告 §5 的 L70（计划责任）与 L71（执行责任）与之同构，且 L74 明确拒绝 40/60 分摊。**不存在「一个更归责计划、一个更归责执行」的自相矛盾**。
3. **同一套规则依据**：三份都引 CARD-05 D-003（`decision-log.md:964–975`）、D-044（`:2260`）与 `docs/standard-workflow.md`（83／81–90／309–313），行号均可核。
4. **同一套「合法变化不可倒算」的纪律**：`复盘:L56`、`01:L19/L25` 都主动排除用户后改选与跨卡裁定。

**不一致的部分（数字与引用层）**
- 4 处需订正：`02:L8` 的 195（真值 192）、`02:L17` 的 P1「派发前」（真值派发中）、`02:L28`/`复盘:L64` 的 P10 26（真值 28/顶层 21）、`03:L9` 的「5 次并发上限」（真值 4＋1 路径冲突）。
- 1 处措辞错误：`03:L26`「三个连续回合」（真值 #13/#14/#17，不连续）。
- 2 处口径缺口：`复盘:L23` 未计外置镜像（6,448 文件/166 MB）；`03:L22` 与 `02:L8` 的两个「195」易互相污染。
- 1 处不可复核引用：`01:L16` 的「审查 15 项已处置／有效定位数 0／耗时未知」在 handoff 文件无原文。
- 8 处断链：`/Users/Hugh/Knowledge/…` 全部少一层 `Hugh/`（`02` 7 处＋`01` 1 处）。

**一句话结论**：四份文档的**判断与归因互相一致、彼此不推责**，可直接作为决策输入；但**数字层有 4 处必须订正、2 处口径必须补声明、8 处链接必须修**，否则引用进后续决策会把 P10 的证据规模（26 vs 28）和证据总量（2,774 vs 10,000＋）继续传错。

---

## 7. 对「下一步怎么改」的直接输入

**如果只允许改三件事（按优先级）**

1. **S4 —— 把「一 Phase 一正式审查」变成派发前的机器门**。落点 `runtime/review/review-record-route.mjs`（已有 `SHARED_REVIEW_TUPLE_FIELDS = ["subject_kind","phase_id","review_scope"]` 与 `REVIEW_ATTEMPT_REF`）＋约定文案 `workflows/build-code/SKILL.md:91-95`、`docs/standard-workflow.md:83`。规则：三元组相同且已存在 `terminal_status=semantic` 的 attempt 时，除显式例外记录外**拒绝再派发**。预期消掉：P3/P4 各多出的 1 次完整正式审查（总尝试 10 → 7 次本可足够），以及 P5/P10 的 15/28 份微审查中由「每个局部发现都开一轮独立裁决」产生的部分。
2. **S7 —— 业务规则版本从「整份文件 sha256」改为稳定锚点**。落点 `docs/quality/business-case-catalog.json`（5 条 case 的 `source` 只有 path＋整份 revision）＋校验器 `runtime/evidence/canonical-evidence-validators.mjs`。预期消掉：P8 的两轮来源重绑（`P8/T017-ui-source-rebind-20260927/summary.md:3-7` 的 `.9→.10`、`P8/T017-p7-source-rebind-20260928/independent-review.md:4-9` 的 `.10→.11`，两轮 RED+GREEN 定向测试）与「只改 P6/T011 说明、P8/T009 语义未变却整卡变红」这类重复取证。
3. **S2 —— 交接前可执行性核查（开工门）**。落点 `workflows/build-plan/SKILL.md`、`runtime/stage/stage-handoff.mjs`、`docs/standard-workflow.md`。要求每 Phase 在交接清单里必须有：真实入口、消费者、固定输入、可观察成功/失败结果、前置依赖状态、定向测试与一次审查范围；核不出的标「不具备开工条件」。预期消掉：02 记录的三条最贵返工链（P10 验收场景/AC-26-27 质量事实缺失、P5 人工例外字段、P6 第 9 键冲突），这三条链正是 P5 15 份＋P6 11 份＋P10 28 份复核的主要来源。

**其余 12 条（可直接进 backlog）**

4. **S3**：把「一次只推进一个 Phase」写进执行入口并在文件写集上可见（同回合写 P10/P11/P5/P6 这种模式要被显式拦住）；落点 `workflows/build-code/SKILL.md`＋`docs/standard-workflow.md:277`。
5. **S9**：给每 Phase 记「实施/测试/审查/等待/材料修订」五项耗时与调用数（`duration_ms` 目前直接写 `null`）；落点 `runtime/stage/stage-handlers.mjs:289`、`:2744-2759`、`runtime/schemas/stage-completion-facts.v1.json`。这是让「无分项可见性」不再靠人肉复盘的关键。
6. **S10**：进度指针带新鲜度语义并可直接读到「我在哪、还剩什么」；落点 `runtime/task/task-store.mjs:228-244`（`phase_progress` 四键仅 phase_id/task_id/material_revision/recorded_at）、`runtime/evidence/freshness.mjs`。目标是让 `list_agents 143 次`＋`clock__curr_time 638 次`（其中 635 次是「专门读一次时钟」）降下来。
7. **S1**：Phase 切分标准换成「可独立验收/提交」并附耗时估计；落点 `workflows/build-plan/SKILL.md`。
8. **S5**：给非正式「设计复核」设事由与预算上限，并在总报告按来源/次数/耗时单列；落点 `docs/standard-workflow.md:309-313`、`runtime/review/review-policy.mjs`、`runtime/review/stage-review-disposition.mjs`。
9. **S6**：同一原件只存一份；落点 `runtime/review/stage-materials.json`、`runtime/evidence/canonical-receipt-writer.mjs`。
10. **S8**：Phase 文件不写流水账（`P10.md:1-3` 这种多轮口径叠加要拆到 Task 事实）；落点 `docs/standard-workflow.md`＋材料侧 `specs/workflowhub-thin-core-card-04-20260919/phases/P10.md`。
11. **S11**：把「零返工」换成五个可测指标；落点 `runtime/schemas/stage-completion-facts.v1.json`、`runtime/evidence/stage-completion-facts.mjs`。
12. **口径修补（文档侧，无仓库落点）**：订正 4 处数字（`02:L8` 195→192、`02:L17` 派发中、P10 26→28、`03:L9` 5→4+1）、1 处措辞（`03:L26` 去掉「连续」）、2 处口径声明（`复盘:L23` 补外置镜像规模、统一标注 exec 嵌套计数）。
13. **断链修补**：`02` 的 7 处与 `01` 的 1 处 `/Users/Hugh/Knowledge/…` → `/Users/Hugh/Hugh/Knowledge/…`（内容物确实存在，只缺一层）。
14. **S12（四文档均未覆盖）**：面向用户的汇报必须用大白话并附术语对照表——09-26 22:27–22:37 用户连发三条「看不懂/不要黑话」，随后 8 个极小回合（#5–#12，合计 0.01–0.20h）全部耗在这个窗口；术语障碍是可量化的人类成本。
15. **子代理输出契约（四文档均未覆盖）**：给 spawn/followup/send_message 定义返回结构（结论＋证据指针＋长度上限），并定义主会话消费方式；当前 2,028 条 `agent_message` 合计 271.8 万字符完全无契约，`03:L34` 只能承认「等待期间子代理是否有效产出」不可知。

---

### 附：核对方法与限制
- 转录**未整读**：全部用 `python3` 逐行 `json.loads` 流式扫描＋按字段聚合，共 49,470 行、约 79.7 MB；行号仅用于定位，未引用原始长文本。
- 未做的事：未跑任何测试；未修改工作树、外置 Task 或文档；未派发审查；未读 187 个子代理各自转录（只读主转录中的 `agent_message` 与 `parent_thread_id` 关联的 70 份）。
- 「无法核实」共 3 类：①「约一小时」目标（仓库 0 命中，无独立来源）②`01:L16` 三项交接自述（文件无逐字原文）③`03:L17` 的原始字节数（文件持续增长，无当时副本）；另 `复盘:L23` 的文件数为快照值，已按「现时＋外置镜像」补正。
