# PaperBuilder 事故 × 9 条新规则 沙盘回放

> 来源·产出：card-03 落地流程派发的只读回放子代理（沙盘回放；未改仓库任何文件）
> 来源·时间：2026-09-29 20:44（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §17/§18 机制的「能否拦住原事故」沙盘验证

基准：起点 `2026-09-25T04:36:55.403Z` → 终点 `2026-09-29T10:30:47.443Z`，**101.9 h**；小时一律以起点为原点的 UTC 计（`time-and-process.md:10`）。
证据：转录 `/Users/Hugh/.codex/sessions/2026/09/25/rollout-2026-09-25T12-36-51-01a0d6da-1328-7873-9acf-cbf439afd194.jsonl`（行号＝`ordinal`，与 `/tmp/pb-forensics/*.tsv` 首列一一对应）、`/tmp/pb-forensics/`（exec.tsv / writes.tsv / errors.tsv / toolcalls.tsv / tooloutputs.tsv / gitcmds.tsv / restores.tsv / before_restore.tsv）、PaperBuilder 材料目录。凡「→」后带 `[推断]` 者为按规则文本的推断，非实读。

| 规则 | 最早触发时刻（证据） | 当时会看到什么（原话截断） | 比实际早 | 触发后代理会怎么做 |
|---|---|---|---|---|
| **M2** Phase 收尾三件事（跑 gate_cmd → 写 evidence_path → 一次 commit） | 第 **26.30 h**：`ordinal 43793 / 2026-09-26T06:54:40Z` = 首次写 `phases/P1.md`（writes.tsv:732，模式 `Update`）；更早的 Phase 台账首写是 `ordinal 26245 / 2026-09-25T17:49:04Z phases/P2.md`（第 13.21 h）。**「跑 gate_cmd」全程一次未发生**：可执行命令源码含 `gate_cmd` 的仅 6 条，全是检索文本——`ordinal 15261` `rg -n '^### T0\|^### T1\|^\- \*\*Write set\|^\- \*\*gate_cmd…'`、`19734` `rg -n '^\- \*\*gate_cmd\*\*:' phases/P{1,2,3,4,5}`、`55974`/`56580`/`56642`/`88873`（`rg … phases/P6.md` / `P4.md` / `P3.md`） | 卡片里 `gate_cmd`（`skills/spec-plan/templates/phase-template.md:30`）与 `evidence_path`（`:32`）是机器必填，runtime 读点 `runtime/stage/stage-content-contracts.mjs:7247` `fieldValue(body,"gate_cmd")`、`:8012` `gate_cmd is missing`；但 `/tmp/pb-forensics` 实读 `workflows/build-code/SKILL.md` 对字面 `gate_cmd` 0 命中 ⇒ 没有任何机器执行点 | 相对"三件事都没做"的 101.9 h：最早第 26.30 h 起、每个 Phase 收尾各触发一次；相对 90.58 h 清树 → **早 64.3 h** | 每次收尾跑一次卡片 gate_cmd、原始输出写 evidence_path、`git commit -m "P<n>: …"`；到第 90.58 h，回滚粒度从"整树"降为"最后一个 Phase 以来的 diff"→ `[推断]` |
| **M3** 卡住判据＝"变了没有" | 第 **22.62 h**：`ordinal 38842 / 2026-09-26T03:14:02.129Z`（exec + reflection 落盘同一分钟）→ `quality/stage-reflection/build-code/1e104a4ef2b303b70755ea7b9921c00a79aec8d4a368fa5546f7bec036f0627b.json`，`generated_at 2026-09-26T03:14:02.103Z` | `blockers.items[0].summary` 逐字（截断）：`"No real trading-day acceptance was run against this implementation. The current saved observation still shows the three fixed runs recovering with unproven waterlines…"`；同一对象里 `"status":"degraded"` 与 `"stage_status":"completed"` 并存。作答"自上次以来我改了什么"时会撞上：`v2_execution_store.py` 至该时点已被写 24 次（09-25 全天计） | 101.9 − 22.62 ＝ **79.3 h** | 写「自上次以来我改了什么：…；失败签名：与上次相同」→ 卡住成立；再问一次"`Done`/`STOP` 里写的下一步，我今天在这个仓库里做得到吗？"（真实交易日不可得）→ 在第 22.62 h 停，而不是走到 90.58 h `[推断]` |
| **M1** 计划交付三选一 | 第 **0.01 h**：`ordinal 28 / 2026-09-25T04:37:24.165Z` `request_user_input_async`；首次因字段非法被拒（`ordinal 30 / 04:37:24.253Z` 输出逐字 `failed to parse function arguments: unknown field 'question', expected 'title' or 'options' at line 1 column 155`），`ordinal 34 / 04:37:26.214Z` 重发成功 | 重发后逐字 `{"title":"交接已载入。下一步选哪个？","options":["继续按 handoff 进入 build-code","仅保留为参考","删除这份 handoff 文件"]}`。人的回答：`ordinal 110 / 2026-09-25T04:39:04Z` 用户只打了两个字「继续」（第 0.04 h） | 触发点本身就在第 **0.01 h**（早于事故展开）；它改的是**答案的形状**，不是时刻 | 三选一①修完再进 ②指派缺口负责人后进（写明承接哪些缺口）③取消本次执行；第 0.04 h 那句「继续」会被替代为一次明确的缺口指派 → `[推断]` |
| **M5** 销毁性动作纳入既有不可逆授权边界 | 第 **90.58 h**：`ordinal 140692 / 2026-09-28T23:11:55.910Z` `git restore --staged --worktree :/`（`git restore` 在整份转录只出现 2 次：`140693`、`140695`）。**还有第二次，此前没被记录**：第 **96.46 h** writes.tsv `ordinal 157190 / 2026-09-29T09:04:37Z` `Delete …/decision-log.md` → `157197 / 09:04:53Z` `Add` 同名；`157204 / 09:04:57Z` `Delete spec.md` → `157209 / 09:05:20Z` `Add`；随后 `157216/157221` `Delete+Add phases/P1.md`、`157228/157233` P2.md、`157240` P3.md… | 清树前一条命令是 `ordinal 140684 / 23:11:51.711Z` `cmd:"git diff --binary > /tmp/paperbuilder-t019-live-core-bef…"`（**自己先把 diff 存到 /tmp，再清树**）；`before_restore.tsv` 200 行合计 **1474 处改动**，`after_restore.tsv` 62 行 353 处（残留 `.planning/2026-09-29-live-core-simplification/*`） | 90.58 h / 96.46 h 两处 → 相对 101.9 h 早 **11.3 h / 5.4 h** | 两次都必须先给出路径清单并取得人的**明确授权**（R-014 那道门，不是新增门禁）；清树被叫停则 1474 处改动不会消失，96.46 h 那次也不会把 `spec.md` / `decision-log.md` / `phases/**` 整体换掉 → `[推断]` |
| **E10** 续跑第一步"对现实" | 第 **0.014 h**：`ordinal 51 / 2026-09-25T04:37:46Z` 用户消息通道注入 `<codex_internal_context source="goal"> Continue working toward the active thread goal.`（全会话 50 次 goal 注入，首 `ordinal 51`，末 `ordinal 141816 / 2026-09-28T23:43:45Z`） | 前半条当时**就已满足**：`ordinal 72 / 2026-09-25T04:38:26.421Z` `cmd:"git status --short --branch && git rev-parse …"`（第 0.03 h）；后半条「本 Phase 自己写的 `gate_cmd` 当前输出」全程**无一次可引用**（见 M2 行：6 次 `gate_cmd` 命中全是 `rg` 检索） | 触发点在 0.014 h；但本次回放**测不出提前量**——前半条当时已做，后半条无可查对象 | 每个续跑回合开头跑 `git status --short` + 本 Phase gate_cmd；两者不一致时以代码为准；本 Phase 尚无 gate_cmd 时写一行空态而非跳过 → `[推断]` |
| **E11** 失败信号必须给一句成句解读 | 第 **0.005 h**：`ordinal 22 / 2026-09-25T04:37:12.166Z`，`errors.tsv` 首行标记 `failed,conflict,stale,unavailable`（输出 15,236 字节）。全程 8,298 条失败标记 ＝ 44.5%，**逐小时恒定**（首小时 39，中段 96/97/111/119/118/138/120，末段 109/88/123，最后一小时 35） | 第一个真正需要"解读"的时刻是 22.62 h 那份 reflection 的 blockers（见 M3 行）：`"No real trading-day acceptance…"`；此后该句在转录中重复出现 **110 次**（首次 `ordinal 38842`，末次 `ordinal 141957`，即 90.6 h 清树之后仍在重复） | 以"第一次必须给解读"的 22.62 h 计 → **79.3 h**（0.005 h 起的每条标记也要各配一句） | 每条失败标记后写一句人话；无失败时只能写「这一轮没有失败信号」；第 22.62 h 那句会被写成判决而不是又一条 blockers → `[推断]` |
| **E12** 进展＝交付锚，不是动作次数 | 第 **3.99 h**：`ordinal 7152 / 2026-09-25T08:36:05Z` 子代理 FINAL_ANSWER 逐字「已完成 T006 行情 token 透传。单条和批量入…」。此刻起算，**0 次 `git commit`**：可执行命令源码含 `git commit` 的 **0 条**、含 `git add` 的 **0 条**（`git add` 在转录仅 `ordinal 19552/19555` 两处上下文命中，非执行）；`gitcmds.tsv` 25 条 git 命令无一条 commit，第 1 条是 `ordinal 58 / 04:38:02.786Z git worktree list --porcelain` | HEAD 停在 `3012a32`（早于会话起点）；该哈希在转录出现 **1782 次**（首 `ordinal 1`，末 `ordinal 161766`）却从没被当成"没有新交付"的证据 | 101.9 − 3.99 ＝ **97.9 h**（第一次"已完成"声明就不带任何交付锚） | 声明进展前先跑 `git log -1 --oneline`：无新提交 ⇒ 本轮进展记 0；第 3.99 h 的「已完成」当场降级为"未提交，等于没有交付锚" → `[推断]` |
| **E9** 完成判据＝别人能用一条命令重放 | 第 **0.01 h** 起就具备：`ordinal 22 / 2026-09-25T04:37:12Z` 的上下文已含 `deferred`；第一次"完成"声明同样是 `ordinal 7152 / 08:36:05Z`（第 3.99 h）；最硬的锚是第 **22.62 h** reflection 逐字 `all 17 AC facts missing`（该句在转录 6 次，首 `ordinal 38842`，末 `ordinal 40916`） | `quality/evidence/acceptance/build-code/` 实读 **714** 个文件：`result=deferred` **704**、`pass` **10**；`"result": "covered"` 与 `"result": "passed"` **各 0 次**；578 ＝ 17 个 AC × 每个 **34 个内容寻址版本**（目录内无 index/current/latest 指针）。`phases/index.md:12` P1 结果栏逐字「focused 行为已覆盖；旧 T003/T004/T005/T018 在当前段退役」 | 以 3.99 h 计 **97.9 h**；以 22.62 h 计 **79.3 h** | 写不出"一条命令替你重放"的 AC 一律记未达成 ⇒ 17 条 AC 当天全红，不必等到第 66 h 之后 36 h 不再写验收事实 → `[推断]` |
| **E13** 完成声明上限＝独立来源的结论 | 第 **3.99 h**（`ordinal 7152`，同 E12）。当时唯一独立来源 `quality/stage-reflection/build-plan/c946f6d25c85c0b8539398947da9980e4a41ddd71f714fdcbaeeb6cc3e8b5c8b.json` 的 `status` 已是 `degraded`，其 `generated_at 2026-09-25T04:32:00Z` **早于会话起点 4 分钟** | 「已完成 T006 行情 token 透传」旁边只有 `degraded`；`non_authoritative` 在转录出现 **259 次**（首见 `ordinal 21`，末 `ordinal 157088`），会话第一份 handoff 就自称 `non_authoritative` 且写明 `build-plan` 阶段 reflection 为 `degraded` | 101.9 − 3.99 ＝ **97.9 h** | 独立来源 = degraded（adverse）+ delivery `unavailable` ⇒ 完成声明只能写到"离线部分完成、真实交易日验收 unavailable"，第 3.99 h 那句「已完成」必须加这个上限 → `[推断]` |

## 三件特别核查

**① 第 22.62 h 那份 reflection 已经写出"没有真实交易日验收"——是。** 实读 `…/quality/stage-reflection/build-code/1e104a4e….json`：`blockers.items[0].summary` 逐字含 `No real trading-day acceptance was run against this implementation.`，`next_review_trigger` 要求 `a real trading-day acceptance run produces current evidence`。该句在转录出现 **110 次**（首 `ordinal 38842`，末 `ordinal 141957`），即 90.6 h 清树之后代理还在重复它。**E9/E13 在同一分钟就能把它变成结论**：E9 把 17 条 AC 判为未达成（写不出可重放命令），E13 把完成声明封顶到 `degraded`。这两条不是"发现新事实"，是"把已有事实变成判决"——早 **79.3 h**。

**② 第 90.6 h 清树前后没有"提交"，一次也没有。** 全转录 `git restore` 仅 2 次（`ordinal 140693`/`140695`）；可执行命令源码中 `git commit` 0 条、`git add` 0 条；`gitcmds.tsv` 25 条 git 命令无一条 commit。「0 提交」这个事实**直到第 94.2 h 才被自己看见**：`ordinal 146690 / 2026-09-29T02:48:27Z` `git status --short --branch && git log -1 --oneline`，之后 `155898 / 08:23:01Z`、`156045 / 08:32:21Z` 同类。清树前一条命令是 `ordinal 140684 / 2026-09-28T23:11:51.711Z` `git diff --binary > /tmp/paperbuilder-t019-live-core-bef…`（先把 diff 存到 /tmp 再清），清树后 `141795 / 23:42:34Z` `git diff --check; git status --short \| wc -l; git diff --stat`，`141915 / 23:47:18Z` 把 /tmp 备份拷回 `specs/…`。因为 101.9 h 内 0 提交，`before_restore.tsv` 那 200 文件 / 1474 处改动**只存在于工作区**，`git restore` 一步即不可恢复。

**③ 重复动作（同一路径反复读写）——可复现命令与计数。** 在 `/tmp/pb-forensics/` 下运行：
```bash
# 写入侧：3779 次写、606 个不同路径
awk -F'\t' '{n=split($4,a,"\\n"); print a[1]}' writes.tsv | sort | uniq -c | sort -rn | head
# 触达侧：16742 次 exec、2635 个不同路径
awk -F'\t' '{n=split($5,a," , "); for(i=1;i<=n;i++) print a[i]}' exec.tsv | sort | uniq -c | sort -rn | head
# 完全相同的路径集合被重复执行的 exec 调用数
awk -F'\t' '{print $5}' exec.tsv | sort | uniq -d | wc -l
```
实读结果：**写入 3779 次 → 仅 606 个不同路径，其中 217 个路径被写 ≥2 次 ＝ 3390 次动作（89.7%）**；top：`/dev/null` 1398、`v2_execution_store.py` **177**、`v2_execution_worker.py` **166**、`v2_current_market.py` 94、`scripts/serve_f6.py` 91、`v2_live_ingress.py` 71。**exec 16742 次 → 2635 个不同路径，638 个被触达 ≥2 次，占 4215/6212 个触达槽位**；**完全相同的路径集合被重复执行 1717 次 ＝ 10.3%**（`['/Users/Hugh/PaperBuilder/.paperbuilder-live-owner-ready.json']` 208 次、`['/Users/Hugh/.codex/skills/build-code/SKILL.md']` 50 次、`['/Users/Hugh/.config/PaperBuilder/runtime-authority.json']` 50 次）。同一文件 `v2_execution_store.py` 按日：09-25=24、09-26=16、09-27=3、**09-28=112**、09-29=23（首写 `ordinal 3234 / 06:24:44Z`，末写 `ordinal 159244 / 09:57:43Z`）。这正是 M3（失败签名与上次相同）与 E12（动作次数≠进展）在本案里最直接的可测对象。

## 规则会失效的情形

1. **人在场但不回答**：M1/M2/M3/M5 的出口都是一次人的回答，而 48 次 `request_user_input_async` 全是 **async 非阻塞**（首 `ordinal 28`，末 `ordinal 104140 / 2026-09-27T22:50:53Z`），实测真人最长空档 50.05 h；人不答时机制只留一行 `awaiting_user`，代理照常推进。
2. **闸门语义被写歪**：M2 若落成"未达成不许收尾/不许推进"即撞 `decision-log.md:111` SD-17（规则类要求＝事实记录＋验收核对，**不阻断推进**）与 `:112` OI-012；正确措辞只能是"如实记为未达成并进失败事实清单"。
3. **材料本身缺失**：E10 后半条「本 Phase 自己写的 `gate_cmd` 当前输出」在卡片没写 gate_cmd 时无法满足——本次全程 6 次 `gate_cmd` 命中全是 `rg` 检索，从无执行记录，该半条在本案中**不可验证**。
4. **宣告性文本自带豁免**：handoff 自我标注 `non_authoritative`（转录 259 次）时，M1 读到的缺口可被自己判为可无视；规则只改默认答案，不改"人可以点头继续"。
5. **规则文本改了但打包没刷**：改 `skills/spec-plan/templates/phase-template.md` 后未同批刷 `skills/spec-plan/skill-bundle.json:11` 与 `skills/catalog.yaml:335`，`runtime/adapters/local-skill-resolver.mjs:110` 会以 `bundle sha256 mismatch` 拒载（**未实跑验证**）。

## 未核实

- 转录中**没有** build-code 的显式"Phase 收尾"事件；M2 行的触发锚用首次写 `phases/P1.md`（`ordinal 43793 / 26.30 h`）与首次 Phase 台账写（`ordinal 26245 / 13.21 h`）代替。
- `phases/index.md:12`「focused 行为已覆盖」的**文件 mtime 是 `2026-09-29T17:31`（会话结束后）**，无法证明该措辞在 26.30 h 就已存在，只能确认它是现存的陈述。
- 未核实 build-code 期间是否"逐卡"执行过卡片 gate_cmd（只能确认命令源码里 6 次命中全是 `rg`，没有执行）。
- `errors.tsv` 的失败标记是**关键词级上限**，不等于逐条确认失败率；44.5% 只能当上界读。
- 未核实"若第 22.62 h 真的触发 E9/E13，后续 79 h 是否真会改变"——本回放只断言规则会给出结论，不断言人或代理会照做。
- `#analyzeDecisionConvergence` 处置列正则本体未逐字核实；skill bundle 哈希重算命令未实跑；删 `deferred` 后测试转红的确切条数未实测。
