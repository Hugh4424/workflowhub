# verify-rootcause.md — 7 条载重结论的独立复核（只读对抗验证）

> 来源·产出：card-03 落地流程派发的只读取证子代理（事故取证 / 根因分析；未改仓库任何文件）
> 来源·时间：2026-09-29 19:13（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §17 根因结论的独立来源复核（7 条载重结论全部重跑）

复核者：独立子代理。所有结论均由本人重跑命令取得，未采信转述。只读，未改任何仓库文件。
路径别名：T=`/Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/paperbuilder-live-simulation-durability-post-20260925`
PD=`/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-live-simulation-durability-post-20260925/specs/paperbuilder-live-simulation-durability-post-20260925/decision-log.md`
C3=`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`，C4=`/Users/Hugh/Hugh/Project/workflowhub/specs/archive/workflowhub-thin-core-card-04-20260919/decision-log.md`
J=`/Users/Hugh/.codex/sessions/2026/09/25/rollout-2026-09-25T12-36-51-01a0d6da-1328-7873-9acf-cbf439afd194.jsonl`

## 【1】成立 —— 证据：命令 `python3 -c "json.load(open(T+'/quality/stage-reflection/build-plan/c946f6d2….json'))"`
文件实测存在：`$T/quality/stage-reflection/build-plan/c946f6d25c85c0b8539398947da9980e4a41ddd71f714fdcbaeeb6cc3e8b5c8b.json` → `stage=build-plan`、`status=degraded`、`generated_at=2026-09-25T04:32:00.533Z`。
会话起点：`head -c 400 $J` 首行 = `{"timestamp":"2026-09-25T04:36:55.403Z","ordinal":0,"type":"session_meta",…,"timestamp":"2026-09-25T04:36:51.139Z","cwd":"/Users/Hugh/Hugh/Project/PaperBuilder"}` ⇒ reflection 早于会话起点 4 分 55 秒。
三份全 degraded 复核通过：`build-code/1e104a4e….json` degraded @2026-09-26T03:14:02.103Z；`build-plan/c946f6d2….json` degraded；`verify-code/09d2575e….json` degraded @2026-09-26T03:49:46.758Z（`glob(T+'/quality/stage-reflection/*/*.json')` 全量 3 份，零例外）。
偏差：文件**不在**结论给出的两个仓库根下——它在 workflowhub 约定的**外置任务追踪目录** `T/quality/stage-reflection/`；`quality/` 前缀对应 T 而非仓库。写方案时路径必须写全，否则复跑会 find 不到。

## 【2】成立 —— 证据：`grep -n non_authoritative /tmp/pb-forensics/turncomplete.tsv`
真实行号就是 47，全文件**唯一**命中（`grep -c` = 1）。第 47 行第 1 字段 = `47`，第 2 字段时间戳 `2026-09-25T04:37:43.`，正文逐字含：`- \`build-plan\` 阶段已完成，reflection 为 \`degraded\`。这份 handoff 标记为 \`non_authoritative\`，只能作当前交接参考。`
偏差：无。文件名与行号均与结论一致（抽取文件名叫 `turncomplete.tsv`，不是 `turncomplete` 之外的别名）。

## 【3】成立 —— 证据：`grep -n "SD-17" $C3/specs/workflowhub-thin-core-card-03-20260919/decision-log.md`
`:111`（=R-014 行）逐字：「SD-17 两道人为门与零机器门禁」「其余一切机器/流程校验……均不构成阶段推进、审查派发、测试执行的前置；规则类要求……一律为**事实记录＋验收核对**——未做或做假＝验收失败事实，如实记录，**不阻断推进**。」同文件 `:370`、`:459` 复述「只能记录，不得成为新门禁」「不阻断推进」。
偏差：无，行号未漂移。

## 【4】不成立（核心断言被反证；仅 M10 子项成立）
- M9 **有**用户溯源：`PD:1248` 的「落到哪里」列写「模块 **M9/M10**」，需求原话格写「**（m00607 校正）**…需要一起参与调查和解决，不要被这些边边角角浪费电脑性能」；`PD:202`（OI-12）逐字「用户 **m00607 明确校正**——原话「…不要被这些边边角角浪费电脑性能」⇒ 本任务纳入，改列模块 M9 必做」；`PD:955` M9 节自述「『电脑性能被边边角角浪费』这一用户诉求（**R-006**）得到正面回应」。
- 矩阵覆盖度：`PD:1239` 节标题 + `:1241-1262` 需求→处置表；`sed -n '1239,1262p' | grep -o "M[0-9]\+" | sort -u` 实测输出 **M1 M2 M3 M4 M5 M6 M7 M8 M9 M10 M11**（11 个模块全出现，含被疑的 M8）。
- 退役卡不成立：`PD:49` 逐字「| T018、T019、T020 | 退役，仅保留历史理由 |」；`PD:57`「旧 17 AC、旧 T001–T020 质量 receipt 和旧 `0/0/17 incomplete` 不属于当前验收分母」⇒ 被点名为退役的只有 **3 张**。`PD` 全文 `grep "T003\|T004\|T005\|T007\|T008\|T014"` 仅命中 `:49`、`:57`。T003/T004/T005 实属**另一个已归档任务**：`…/specs/archive/paperbuilder-phase-foundation-m1-close/tasks.md:31-33`（依赖三源对账，与 CPU 治理无关）；T014 = 前端 `ReplayCompareTab` 孤儿代码扫描（`…/spec.md:613`「do not use or delete orphan module」）；T007/T008 是当前 build-code 的 **Phase 卡**（`T/quality/evidence/build-code/phase-cards/P2-T007-…`、`P2-T008-…`）。
- 子项成立：M10 确由 R-006 原话支持 —— `PD:1248` R-006 原话「监控文档里那 25 个零散提交的审查、原始问题得到解决、代码质量和结构得到保证」⇒ M9/M10；`PD:1159`「F-015 提交审计结论（模块 M10 的正式凭据）」。
偏差（三处夸大）：① 「只有 M9 追不到原始用户需求」与 M9 的 m00607 溯源链直接冲突；② 「10 张退役卡」自相矛盾——列举只有 9 个 ID（T003/T004/T005/T018、T007/T008/T019、T014/T020），而与 `PD:49` 的退役记录只有 3 张；③ 所引 `:1246-1253` **不是模块追踪矩阵**，它是需求表里 R-004…R-010 那几行；模块台账实际在 `PD:865-1019`「step 7 module-convergence」。

## 【5】成立 —— 证据：`grep -n orphan $C3/workflows/build-plan/SKILL.md`
`:228` 是全文**唯一** orphan 行，逐字：「6. Cross-check decision, spec, every Phase, and index for omissions, contradictions, **orphan tasks**, boundary widening, missing two-way traceability, and invalid commands.」——只查 orphan **tasks**，无 orphan **modules**；228 = 198+30，与结论「第 198 行附近 +30 行」一致。
`$C3/docs/standard-workflow.md:288-289` 逐字：「缺 AC/FR 映射、任务无真实 oracle、文件边界不明、依赖未解决或 DEFER/OPEN 没有 owner/触发条件/消费者/关闭条件时，当前 stage 修复后再交接。」
偏差：结论把原句压缩成「OPEN 无 owner/关闭条件」——原文是「DEFER/OPEN 没有 owner/触发条件/消费者/关闭条件」，语义一致但引用时须用原句。另 `:280-287`、`:290-294` 均不涉及模块级检查，无遗漏。

## 【6】部分成立 —— 证据：`sed -n '2029,2040p' $C4`、`grep -n 'BP-R[0-9][0-9]' $C4`
B-01…B-12 确在 `:2029-2040`（节标题 `#### B. 不得做的事` 在 `:2025`），12 条齐全。对该区间 `grep -c "变大\|膨胀\|行数\|文件大小"` = **0** ⇒ 「没有一条『不许变大 Y』」成立。
偏差一：「全是『不许新增 X』」不准确：B-03 不得触碰 `runtime/review/**`、B-04 不得做总集成验收、B-05 不得删除存量、B-11 不得把 unavailable 改写成通过、B-12 不得自产自判——是「不许碰/不许删/不许改写」，不是「不许新增」。
偏差二（重要，会误导方案）：**该卡并非没有反膨胀约束**，只是不在 B 清单而在 D-007/OI-010：`:252`「落点规则 = 模块×层级矩阵 + 就近放置 + **反膨胀预算（文件大小、孤儿文件、契约测试占比）**，全部以事实与预算形式落在既有 `tools/architecture/complexity-report.mjs` 与 `tests/contract/repository-inventory.test.mjs` 载体上，不新增门」；`:280` 明示「已知该预算基线**今天已被超限 6/8**」。写方案时不可写成「card-04 完全没有反膨胀设计」。
BP-R01…BP-R12：`:1927-2016` 逐条存在（每条含 规则编号/规则文本/载体/为什么不需要新建载体）；确无「不许变大」禁令。唯一碰到膨胀数字的是 `:2001`（BP-R10）「必须把 `docs/architecture/complexity-baseline.json` 的 `formal_test_lines` 数字改成与实测口径一致」——是**修正口径**，不是禁令，引用时不要当成反膨胀条款。

## 【7】成立 —— 证据：三条硬数全部复跑通过
① **0 次 git commit**：`grep -c "git commit" /tmp/pb-forensics/gitcmds.tsv` = 0（该文件 25 行，只有 `git worktree list --porcelain`×6、`git worktree remove --force`、`git status`、`git worktree add --detach`、`git restore --staged --worktree :/`）。独立复核：在 PD 所属仓库执行 `git log --oneline --since=2026-09-25 | wc -l` = **0**，`git log -1 --format='%H %cI %s'` = `3012a32e885e03d01262e76fed450f75e9c62a4e 2026-09-24T23:38:57+08:00 fix(t06): retry recovering live workers`（HEAD 早于会话起点 2026-09-25T04:36:55Z，全程无新提交）。
② **704 deferred / 10 pass（共 714 份）**：对 `$T/quality/evidence/acceptance/build-code/` 全量复算 —— `total files 714`，`[('deferred', 704), ('pass', 10)]`，零解析错误、零第三种 result。
③ **第 22.6 小时 reflection 已写明 blockers**：`$T/quality/stage-reflection/build-code/1e104a4e….json` 的 `generated_at=2026-09-26T03:14:02.103Z`，`blockers.items[0].summary` 逐字以「**No real trading-day acceptance was run against this implementation.**」开头（后续为「The current saved observation still shows the three fixed runs recovering with unproven waterlines and no public Historical receipt readback; local tests do not prove live continuity.」）；04:36:55Z → 次日 03:14:02Z = 22 h 37 min ≈ 22.6 h。
偏差：无。三条均成立，且②是精确等值而非约数。
