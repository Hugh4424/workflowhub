# c · 验收与执行效率：execution-quality-build-code-hardening-20261119

- 调查对象：workflowhub 任务 `execution-quality-build-code-hardening-20261119`，提交 `ad708bff..454aafe5`，PR #35（MERGED，`0c1a818e`）。
- 方法：只读。读任务库原件、归档材料、外部审查、主仓提交；未改仓库、未重跑测试/门禁、未重签任何档位。
- 根目录缩写：`T`=`~/Knowledge/Projects/workflowhub/tasks/execution-quality-build-code-hardening-20261119`；`A`=`specs/archive/execution-quality-build-code-hardening-20261119`；`W`=主仓（HEAD `454aafe5`，任务 worktree 已删）。
- 口径：**已实查**＝本次亲手读到该原件/行位/字节；**拟议**＝未发生、由本次提出的改法。档位一律沿用对账 §14，不新增判定。

---

## 0. 一页结论

1. **19 条 pass 不是实现被推进出来的，是证据被补出来、门被放宽后重跑、并真实 close 之后才出现的。** 19 条里只有 4 条因代码/判据行为改变而翻盘（AC-P2-002 的旧清单拒绝、AC-P6-001 的检查器归约、AC-P6-002 的模板可访问性、AC-P7-002 的回放判据）；3 条只靠真实 close；其余 12 条只靠补证、改材料，或把 gate 从 1/14、2/184 改成全量后重跑。（已实查：`T:quality/reviews/2026-11-20-final-ac-reconciliation.md` §9–§14 逐轮变化表；`W` 提交 `eb182547`、`0f183dcc`、`4a3c16a6`、`46a81a72`。）
2. **长期不收口的三条主因都不是"实现没写完"**：①首判从未落盘（P1–P6 六个 Phase 只有 OCR `unavailable` 原件）；②判据与文本错配（AC-P3-002 的 U-022 对象）；③历史不可回补（P4-002/P5-001/P5-002/P3-003）。资源不可用只有 AC-P1-002 一条 AC。（已实查：`T:quality/evidence/build-code/dual-axis-deviation.md` §二/§四；`A/spec.md:719`、`A/decision-log.md:718`。）
3. **门的判据比 AC 低一档**：门只验"命令绿"，不验"选中的是不是全部用例"、不验"检查器报的 checks 是否由错误码归约"、不验"缺原件是否也算放行"。三处都有原件与修复提交。（已实查：`T:quality/tests/p4-isolated-test-data-green.output:12-13`、`T:quality/tests/2026-11-20-054-p10-gate.output`、`T:quality/reviews/2026-11-21-review-delta.md` #18、`W:tools/cli/check-replay.mjs` 修复前 diff。）
4. **返工的大头是"指针失效"而不是"做错"**：32 次门捕获（P9 11 + P10 21）、158 份 readiness 回执、43 份 replay 回执、5 次签字；多数由"上游材料改一字节→下游全失效"触发。（已实查：`T:quality/evidence/gate-results/` 文件清单；`T:facts.jsonl` build-code 行；`T:quality/evidence/verdict.history-*.json`。）
5. **"19 pass"读的时候要减配**：其中 5 条是"具名缺口下的 pass"（P10-005、P7-002、P6-002、P8-002、P4-001），正式口径仍是 §14.5 那句"已交付但带 1 fail / 5 incomplete / 1 partial / 1 unavailable"。（已实查：对账 §14.4/§14.5；终末报告 v2 第 2 节"缺口 owner"列。）

---

## 1. 验收为何长期不能收口

### 1.1 27 条的六次重算（读数全部来自对账自述，未独立重算）

| 时点 | HEAD | pass | partial | fail | incomplete | unavailable | 这一轮真正改变了什么 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| §0（11-20 20:xx） | `decfac49` | 4 | 8 | 2 | 12 | 1 | 第一次把"Done 自报 incomplete"写成正式档位 |
| §9（21:xx） | `0f183dcc` | 6 | 6 | 5 | 9 | 1 | 补材料断链（P10-001/002 转 pass）；P1–P6 补审把 3 条下调 fail |
| §10（21:4x） | `7bdb3ffe` | 8 | 5 | 4 | 9 | 1 | P7 二次复审 + 报告源归一转 P6-001/002 |
| §11（22:5x） | `5d0e70f9` | 10 | 6 | 1 | 9 | 1 | 用户材料确认转 P2-001；findings 二轮转 P10-003 |
| §12（23:1x） | `10e6a1db` | 14 | 6 | 1 | 5 | 1 | 全量重跑替代 1/14、readiness 复跑 |
| §13（02:4x） | `c65f44b2` | 16 | 4 | 1 | 5 | 1 | 外部审查 6 笔修复（回放判据、清单拒绝） |
| §14（03:4x） | `454aafe5` | **19** | 1 | 1 | 5 | 1 | 真实 close：accepted 读回、双推送、两段图回执 |

- 原件：`T:quality/reviews/2026-11-20-final-ac-reconciliation.md`（sha256 `b0e1b21e…`）§0、§9.3、§10.3、§11.3、§12.4、§13.4、§14.4。
- 反证：这不是"档位在涨＝质量在涨"。同期实现 diff 在 §13 之后只剩 6 笔定向修复，而档位从 16 涨到 19 全部来自 close 产生的读回。（已实查：`W:git log ad708bff..454aafe5`；§14.2 三行重判。）
- 失效机制：框架把"证据/判定"当成可后补的事实，却没有"后补也算数"的明确入口——每补一次都要人工重开一轮对账（共 14 次改判），于是收口被拆成 7 次重算。
- 后果：终末报告与 PR 正文只能写"带缺口交付"，不能写"验收通过"。

### 1.2 四类归因（逐类给原件）

**A. 证据缺口（首判没落盘）— 12 条 → 5 条，是最大的一类**

- 主张：P1–P6 六个 Phase 没有一份独立审查结论原件，只有 OCR 失败件。
- 原件：`T:quality/reviews/` 下对应六件全是 `…-code-review-ocr-unavailable.json`（`2026-11-19-019/020/021`、`2026-11-20-001/002/003`，各 1.2KB）；`dual-axis-deviation.md` §二表逐 Phase 列出"一个审查角色兼两轴"；§四给出四条"不可补"理由。
- 反证：同一批原件在 `decfac49` 上由补审 `T:quality/reviews/2026-11-20-p1p6-spec-axis.md`（sha `4f459677…`）真做出 13 条首判（pass 4/partial 4/incomplete 1/fail 3/unavailable 1）。说明"没有独立来源"不是"没人能判"，而是"当时没派"。
- 失效机制：Done 自报档位是正式档位上限（`p1p6-spec-axis.md` §0"Done 上限"），Phase 卡又停在计划态（`A:phases/P1-skill-loading.md:204`），于是"原件支持 pass"也无法落地。
- 后果：这 12 条在 §0 全部记 incomplete，卡的不是实现，是判定身份。

**B. 判据/文本错配 — 至少 3 处，1 条至今不能 pass**

- AC-P3-002：通过条件写"U-022 接受该转写"（`A/spec.md:719`），而 U-022 实际是需求 11–14 的转写接受（`A/decision-log.md:718`）。统一说明反而确认了错配（对账 §12.2 原文："这是 AC 文本与 U-022 对象的错配"）。
- 计数笔误：P10 交接写"附录 A 26 条"（`T:quality/tests/log-terminal-effects.output:54`），实际 27 条；`A/spec.md` Appendix B 曾缺第 27 行（由 `4a3c16a6` 补；已实查 `A/spec.md:1244`）。
- 双首判冲突：`T:quality/reviews/2026-11-20-004-…p7-independent-acceptance.md:51`（pass）与 `…005-…p7-spec-axis.md:13`（fail）同时存在，靠二次复审才收口（`T:quality/reviews/2026-11-20-p7r-spec-recheck.md` §6）。
- 反证：`decision-log.md` 自己规定"冲突时以本节和 Appendix A 为准"，而它的扩展正文又与 Appendix A 相反——规则自指冲突，机器与人都无法据此判 pass。
- 失效机制：AC 正文是唯一通过条件，但改 AC 需要"改 AC/方向"分诊，属用户独占决定；代理只能记 incomplete。
- 后果：AC-P3-002 在证据早已可读（U-021 十包确认、包 6 的 013 答复）的情况下，仍以 incomplete 交付。

**C. 历史不可回补 — 4 条 + 1 组**

- AC-P3-003：research 派发 06:42 早于用户汇报 06:55（`T:quality/evidence/build-code/2026-11-19-003-p3-main-session-report-and-reads.md:20-24`，sha `ac667e73…`），失败条款"先派发后补报"成立（`A/spec.md:745`），时序不可倒签。
- AC-P4-002：P5 期间没有真实红条件派发与写集变更（`T:quality/evidence/p5-readiness-observation.md:69`）。
- AC-P5-001/002：P6 没有真实两轮修复/验收，也没有提交前冻结判据哈希与独立裁决（`T:quality/evidence/p6-repair-observation.md:95,98`）。
- AC-P3-002 的逐包原件：10 包里 9 包无同包方案卡/冷读/对抗（对账 §13.6 限制段）。
- 反证：事后重派只能产生"新审查"（`dual-axis-deviation.md` §四.1／§四.3），且 `review --action=record` 明确拒绝导入调用方结果（试点回执 `T:quality/tests/2026-11-20-001-backfill-pilot-a1-review-import-retired.json`，exit 1）。
- 失效机制：框架没有"历史事实"与"可后补证据"的类型区分，两者都只能写成 incomplete/fail 具名缺口。
- 后果：任务以 1 fail + 3 incomplete（另 2 条 incomplete 可补未完）交付，且永远补不上。

**D. 资源不可用 — 1 条 AC + 6 类事实**

- AC-P1-002：无"仓外隔离宿主根 + 另一项目新会话"（`A/spec.md:622` 缺失处理条款；`T:quality/evidence/build-code/execution-checklist-p1.md:202`）。
- 事实级：T6/T16 原版字节（`T:quality/tests/p9-unavailable-t6.output`、`…t16.output`）、OCR endpoint（六份 unavailable）、实体读屏、真实 INP、P10 环 9 canonical 审查（`chain_state=unverified`）。
- 反证：close 一发生，P7-001/P9-001/P9-002 立刻翻 pass——说明 unavailable 是资源问题，不是判据问题；反过来说，凡是"要真实环境"的项，不到环境到位就不会动。
- 后果：报告必须长期带 unavailable 行；任何"全 pass"表述都不成立。

### 1.3 为什么"每一轮只动几条"

- 每翻一条都要么新增一份独立原件（补审、全量重跑、真实 close），要么改一次材料字节——两者都会让其他指针失效（见 §4）。所以 7 次重算每次只动 2–4 条。
- 拟议判读（未发生）：如果把"首判落盘"和"gate 覆盖"作为 Phase 边界机器条件，27 条里 12 条 incomplete 本可在 P1–P6 当期消掉，收口轮次可从 7 次压到 2 次（close 前一次 + close 后一次）。

---

## 2. 门与测试的真实覆盖（5 个"门绿但 AC 没过"实例）

| # | 实例 | 门当时的读数（原件） | 根因层 | 修复提交 | 残余 |
| --- | --- | --- | --- | --- | --- |
| 1 | P4 门只选 1/14 | `1 passed \| 3 skipped (4)`（`T:quality/tests/p4-isolated-test-data-green.output:12-13`），文件后来长到 14 例仍只选 1（`…green-r3.output` 同形） | 契约：gate 写成 `-t ORACLE-P4-ISOLATED-TEST-DATA` 的散文行，用例增长无人对账 | `46a81a72`（卡改全量，**仅文档**）+ 全量回执 `2026-11-20-122/123`（14 passed） | 卡改了但机器无"选中数=收集数"校验 |
| 2 | P10 门只选 2/184 | `2 passed \| 182 skipped (184)`，两个整文件被跳（`T:quality/tests/2026-11-20-054-p10-gate.output`、`…058-…`） | 同上 | `46a81a72` + `2026-11-21-041-p10-four-files-full-r2.output`（191 passed / 2 skipped） | 同上 |
| 3 | P7 检查器 `ok:false` 却 checks 全 true | 实跑 exit 1、80 条 errors（79 `MODEL_MISMATCH` + 1 `STALE_PAGE`），`checks` 七项仍 true（`T:quality/reviews/2026-11-21-review-delta.md` #18，旧 `check-page-content.mjs:253` 字面量） | 工具：checks 是常量不是归约 | `eb182547`（`CHECK_FAILURES` 归约 + 未分类错误码 fail-closed + `--expect-html-sha256`） | 浏览器观察仍需自行登记交付字节 sha |
| 4 | P9 replay 缺原件放行 | 旧 `check-replay.mjs`：case 不写 `original` 记 `not_declared` 继续判；且绑 `workspace.head`，提交后真红全变 `incomparable` | 工具：把"未声明"当"未失去"，把 HEAD 当可比条件 | `4a3c16a6`（未声明→`invalid_case`；HEAD 降为漂移读数） | T6/T16 原版仍 lost（具名） |
| 5 | P2 标签形证据判通过 | 五列"证据"填 `ev-1` 时 `present:null,label:true`、`gaps=[]`、`complete=true`；测试还把 `gaps=[]` 写成期望（delta #1，`check-stage-steps.mjs` 旧 `:1415,1421,1425`、测试旧 `:1708-1711`） | 工具 + 契约：被固化的错误判据，改它要 TCR | `58ad5874` + `T:quality/evidence/build-code/tcr-p2-label-evidence.md`（改后记"证据标签非原件"具名 gap） | **TCR 由实施者自己改冻结断言，独立审查未进行**（TCR 文末自述） |

补充两个"门绿＋AC 未过"的直接对照：

- P9 声明门 `011` exit 0、implemented/verified pass，但 `accepted` 仍 fail（`T:quality/evidence/2026-11-20-001-p9-signer-check.json:71-74`）→ AC-P7-001 只能 partial。门绿与 AC 绿不是同一件事。
- P10 声明门 `031` exit 0、191 passed，但 AC-P10-008 仍 partial（A 表只有第 13 步人工消费者、C 表未机器化接图）→ 门覆盖的是合同，不是验收条件。

另有一处"门绿但证据不存在"：P5/P6 就绪表 14:26 才回填，表中声明的 `p5-readiness-*.output`、`p6-readiness-*.output` 全部不存在，而入口只查证据格非空（`W:tools/cli/stage-runtime.mjs:1332` 一带；delta #13/#14）。修复：`3a9d901b` 给 `run-checks` 加 `readinessEvidenceStatus`（planned/missing/verified 并具名失败）。

---

## 3. 独立性与首判：事实、影响、被纠正的与仍是限制的

**事实（已实查）**

- P1–P6：每 Phase 只有一个审查角色兼 Standards/Spec 两轴，结论不落 `quality/reviews/`（`dual-axis-deviation.md` §二表；六份 OCR unavailable 原件）。
- 测试作者：P1–P7 未见独立测试作者原件（P9 审查把"独立测试作者缺失"列为 F4）；P8 的冻结断言变更由独立测试作者 `tcr-p8` 出 TCR、P9（`T:quality/tests/2026-11-20-040-p9-independent-test-author-tcr.md`）、P10（`…060-p10-independent-test-author-tcr.md`）才有独立测试作者；P10 B/C 测试与实现同 writer 仍是 AC-P10-008 的 partial 理由。
- P1 曾**自己改冻结断言**（期望方向、用例名、追加 `--current-read-receipt`），无 TCR、无独立审查（`T:quality/reviews/2026-11-20-p1p6-standards-axis.md` S-01 high）。
- P3 独立验收判 fail 的原件未落 `quality/reviews/`（`T:quality/evidence/build-code/execution-budget-backfill.md:44`；`2026-11-19-003-…md:20`）。

**对最终档位的影响**

1. 13 条 P1–P6 AC 在 §0 全部 incomplete，即便其中 4 条"原件支持 pass"——独立性缺失直接把档位钉在 Done 上限。
2. 补审（`4f459677…`/`971723279…`）不是追认：它把 P2-001、P2-002、P3-003 从 incomplete 下调为 **fail**，同时救活 P3-001、P8-001、P8-002、P4-001、P2-001、P2-002。也就是说，"补审"既杀人也救人，档位来自它的独立重判，不是来自事后的善意追认。
3. AC-P7-001 的 pass 语义要打折：`accepted` 转 pass 的唯一依据是 close 写出了下游读回（`T:quality/evidence/close/2026-11-20-013-close-claims-readback.json`，sha `0481fffa…`）。它证明"声明有消费者"，不证明"质量被独立验收通过"。

**已被后期纠正的**

- P2-001/P2-002：由用户材料确认 + 12 个文件级 sha 绑定（`T:quality/evidence/human-confirmations/2026-11-20-001-…json`）+ 旧清单真拒绝（`58ad5874`）改为 pass。
- P3-003：由"incomplete 顶替"改为 fail，并在三处材料同步（`phases/P3:245,262`、`P10:377`、对账 §12.3）。
- P6-001/P6-002：二次复审 + 交付 sha 回读后 pass。
- P4-001/P8-001/P8-002：用当前材料/全量运行重取原件后 pass。

**仍是限制的**

- AC-P1-001：回执身份修好了（`58ad5874`），但 step 1 仍 `已留痕/unavailable`，完成判据未成立。
- P5/P6 的真实派发与两轮修复永远不会发生（P6 提交 `21ba510f` 只有三份 md，零代码）。
- P3 逐包原件 9/10 缺；P10 A 表仍只有人工消费者。
- **外部审查后的 6 笔修复（`58ad5874`…`c65f44b2`）本身没有独立审查或 OCR 复审**；TCR-P2-01 由实施者改冻结断言、独立审查待做（终末报告 v2 §3.4 自述）。
- 因此 19 pass 的上限是"独立终末对账 + close 读回"，不是"独立质量签字"。

---

## 4. 执行效率：返工 / 等待 / 重复执行（不算耗时与 token）

计数（已实查）：门捕获 32 次（`T:quality/evidence/gate-results/` 001–011 P9、012–032 P10）；回执 795 份，其中 readiness 158、gate 89、replay 43、`check-page-content` 16、`build-page-data` 12、render 15、浏览器 QA 目录 28；签字 5 次（`verdict.history-*` 三件 + 当前 + 首签 `b86cfe1a`）；`signer-check` 2 次，两次都因 accepted fail 而 fail。

| # | 事件 | 触发 | 重复了什么 | 根因层 | 框架怎么改能避免 |
| --- | --- | --- | --- | --- | --- |
| E1 | P3 超预算重跑 | 包 6 真跑用 7 个子代理 >「每包≤3」 | 独立验收判 fail 后，在 3 个代理内把整包三角色重跑一遍（`2026-11-19-003-…md:20`；`package-06-page/README.md:1-5`） | 计划/契约：预算只是派发 brief 里的提示串（`dispatch.mjs:111`），无计数与失败语义 | 把预算写成任务记录的可执行字段，超限记具名失败并停派发（delta #7） |
| E2 | P7 浏览器场景 4 次失败重跑 | 脚本自身与环境 | run1/run2 `waitForFunction` 超时（20s/10s）、run3 选择器 0 命中、r2 `SyntaxError: await is only valid in async`；r2 note-open 拍到收起态 → r4 重拍；r3-latency 再遇点击失败（`T:quality/tests/browser-qa-p7*.output` 尾部错误；`T:quality/evidence/p7-browser-observation.md:57`） | 工具（脚本脆）+ 环境（浏览器 10–20s 等待） | 观察前预检：选择器快照、目标页 sha 登记、`stageLabel` 断言；失败即停并落诊断，不连跑（delta #19 的最小修法） |
| E3 | 页面报告源返工 | 卡指定 canonical 报告过期，页面实际用了 tests 目录的 086 复跑件 | 重生成 canonical + 归档旧件 + 重建页面/侧车 + 归一来比较 + 6 份新回执（`T:quality/evidence/p7-report-source-normalization.md` §修复内容；提交 `7bdb3ffe`） | 流程/契约：同一事实允许两份副本身份，卡里"canonical 路径"不是权威绑定 | 报告只允许一个 canonical 路径 + sha 绑定；tests 目录产物禁止作页面源 |
| E4 | P8 冻结断言 TCR + "12 绿"读数不可复现 | AC 改归档顺序，8 条旧断言失败；验收声称"12 条转绿" | 一次 TCR 批准与执行（`df6a631b`）＋ 三棵干净树重跑 4 次（head/current/main + remain4）证明 16 红一致（`T:quality/tests/archive-graph-notes.md:19-50`） | 契约（冻结判据变更）+ 测量口径（按文件过滤造成假绿） | 冻结断言变更走 TCR（已做）；门的回执必须记套件路径清单与选中数，失败名集合逐行比对 |
| E5 | P9 replay 全量失效 | 真红绑 `workspace.head`，实施提交一落地全部 `incomparable` | 43 份 replay 回执、多轮 red/green 重捕（`T:quality/tests/p9-replay-*.output`、`claims-replay-*`） | 工具：可比性条件选错 | 可比性只用案例字节 sha + 环境指纹；HEAD 漂移只作读数（已由 `4a3c16a6` 实装） |
| E6 | 门重捕 7 次 + 重签 5 次 | 每次材料/证据变动（decision-log、需求索引、收敛清单、findings 图、报告重绑）都使 gate/verdict 失配 | P10 门 026→027→028→029→030→031→032；verdict 13:03→14:37→18:34→19:12Z（外加首签） | 流程 + 工具：门指针/签字没有生命周期，一变全废 | 门指针与材料指纹成对写 append-only 索引；签字只签一次"当前对"，改动走增量读回（见 §5-C3） |
| E7 | source 重建丢 gate | `stage-runtime.mjs` 用第一个 `; readiness: ` 切分后只保留前半段，`receipt/output/gate` 段全丢 | `delivery-claims` 读成 `gate=null`（`T:quality/tests/2026-11-21-047-delivery-claims-recheck.json`）→ 必须重捕门 + 重签；修复加 2 条 ORACLE 用例（`T:quality/evidence/build-code/fix-source-rebuild-notes.md` §1–§4，提交 `c65f44b2`） | 工具：游标重建的字符串手术 | 游标重建只替换 readiness 段（已实装）；claims 增加 `gate_lost` 状态而不是静默 null |
| E8 | P1 回执绑实时 HEAD | 每轮审后提交一次，此前所有 step 回执变 `unavailable` | 反复重捕读技能回执与步骤检查（`T:quality/tests/2026-11-20-065…068`；delta #4 记该行在 `10e6a1db` 仍 open） | 契约：`stale` 定义与"代码快照变化不使材料 stale"冲突 | 回执只绑技能字节 sha + task/stage/step 身份，commit 只记录不比较 |
| E9 | readiness 全链重跑 | 材料指纹一变，10 个 Phase 的就绪原件全部作废 | 158 份 readiness 回执；`readiness-refresh-46a81a72` 把 P1–P10 全部重跑一遍（`T:quality/tests/readiness-refresh-46a81a72-runs.jsonl`） | 流程：没有"受影响范围"的增量重跑口径 | 就绪结果按 (phase, material_sha) 缓存；材料变更只重跑声明受影响的行 |

**等待（未取得，本身就是发现）**：六类等待都没有读数——用户等待无按键回执、provider 审查在无 endpoint 处即时失败（stderr 213 B）、真实环境等待从未开始、活动分钟与 token 未记录（`T:quality/evidence/build-code/execution-budget-backfill.md` §三）。所以本任务"效率"只能核"重复执行次数"，不能核"等了多久"。

**反证**：E6/E9 的多次重捕并非全是浪费——`c65f44b2` 确实修掉一个真缺陷，`46a81a72` 之后的全量运行确实补上了 13 条被跳过的用例。失效的是"一变全废、无增量"的机制，不是重跑本身。

---

## 5. 框架改造（3 条，均落在验收/效率）

### C1 · gate 覆盖自校验（拟议）

- **改前**：gate 只存 exit 0。`-t` 过滤选中 1/14、2/184 仍算绿；整文件被 skip 无人知道。
- **改后**：gate 回执必带 `declared_files[]`、`collected`、`selected`、`skipped`、逐文件 `selected/total`；声明的文件里出现 `skipped>0` 或某文件 `selected=0` 即 fail；Phase 卡的 `gate_cmd` 不允许裸 `-t`（只能整文件，或 `-t` 时必须在卡里声明"该门只覆盖 N 条"并计入 AC 覆盖说明）。
- **触发**：每次 gate 捕获（`verify --action=execute`）。
- **正回放（已实查原件）**：拿 P4 `08:13` 原件（1 passed / 3 skipped，后 1/14）→ 必红；拿 `2026-11-20-054`（2/184，两整文件 skip）→ 必红；拿 `122`（14 passed / 0 skipped）→ 必绿；拿 `041`（191 passed / 2 skipped）→ 若 2 skipped 是库内既有 skip，需白名单，否则红——这正好暴露"白名单必须显式"。
- **反回放**：单文件、单用例即可覆盖的窄 AC（如 P7 的 8 行归约）会被"整文件"要求放大成本；所以规则只约束"声明为覆盖某 AC 的 gate"，不约束探索性运行。
- **撤回条件**：当 gate 命令由 manifest 生成（文件级、无 `-t`）且回执已带文件级计数，可只保留"声明文件数=实际文件数"一条。

### C2 · AC ↔ 证据/首判机器台账（拟议）

- **改前**：27 行靠人写，14 次改判、7 次重算；计数靠抄；两处笔误（26/27、Appendix B 缺行）；"首判"是散文里的一个词。
- **改后**：单一 `quality/ac-ledger.json`，每 AC 至少 `{ac_id, ac_text_sha256, tier, evidence[{ref,sha256}], first_judgment{ref,sha256,reviewer,at}, gap{owner,recover}}`；`check-ac-ledger` 重算并按档位输出计数；报告只能引用该命令输出与 sha。硬规则：`tier=pass` 必须有 `first_judgment` 且 `reviewer` ≠ 实现者；`ac_text_sha256` 与当前 spec 不符时旧判定自动失效（改 AC 文本→必须重判）。
- **触发**：终末报告、close、任何 tier 变更。
- **正回放**：对 §0 表重算应得 4/8/2/12/1，对 §14 得 19/1/1/5/1；把 AC-P3-002 的 `ac_text_sha256` 指向改前文本 → 台账自动判"判定已过期"，正好复现 U-022 错配那一类。
- **反回放**：AC-P10-005 是"具名缺口下 pass"，台账若只允许 pass/fail 会把它错记为干净通过；必须支持 `conditional_pass` 并在计数里单列（否则 5 条具名缺口被吞）。
- **撤回条件**：若 27 条全部可由机器判据直接判定（无"只能人读"项），台账退化为 gate 的一部分。

### C3 · 签字/门指针生命周期 + 审查原件落盘前置（拟议）

- **改前**：facts 单行游标被重写时丢 gate（E7）；claims 读不到 gate 只报"没有门"；verdict 每次材料变都重签（E6）；P1–P6 无审查原件也能一路推进（§3）。
- **改后**：①游标重建只替换 readiness 段（已由 `c65f44b2` 实装）；②`delivery-claims` 区分 `gate_never_captured` 与 `gate_lost`，后者 exit 1 并给恢复动作；③门指针与材料指纹成对写 append-only `gate-results/index.jsonl`，verdict 引用 `(material_sha, gate_sha)` 对；④Phase 边界机器检查 `quality/reviews/<phase>-spec.md` 与 `-standards.md` 两份原件存在，缺则 Done 只能 incomplete。
- **触发**：每次 `run`/`verify`/签字/Phase 收口。
- **正回放**：`c65f44b2` 自带的 RED（receipt/output/gate 段被丢）→ 新规则下 claims 必须报 `gate_lost`；`2026-11-21-047` 的 `gate=null` 原件 → 新规则下不再是"无门"而是"丢门"，恢复动作唯一；`dual-axis-deviation.md` 所述 P1–P6 → 新规则下当期就应判 incomplete（与最终档位一致，只是早 30 小时）。
- **反回放**：单人研究任务合法地只有一个执行者，强制两轴会阻断合法流程；必须允许 `single-agent: true` 声明并在报告记账，不能静默通过。
- **撤回条件**：facts 行改成 append-only 事件流（不再重写游标）后，②③可退化为读时计算，只保留④。

---

## 6. 证据上限与不可回补项

**本次的证据上限（已实查范围）**：读了对账全 754 行、终末报告 v2、外部审查 265 行、review-delta 46 行、预算/偏离/源重建/浏览器观察/归档图/两轴补审等原件，核了 6 笔修复提交的 diff 与 5 处修复后代码；**未**重跑任何测试或门禁，**未**独立重算 27 条档位（沿用 §14），**未**逐张复核 P7 截图，**未**读全部 32 份门回执，**未**核 795 份回执的字节一致性。

**不可回补**

| 项 | 为什么不可回补 | 现状 |
| --- | --- | --- |
| AC-P3-003 | 06:42 派发早于 06:55 汇报是已发生时序 | fail（永久） |
| AC-P4-002 | P5 当期没有真实红派发与写集变更 | incomplete（永久） |
| AC-P5-001 | P6 当期没有真实两轮修复 | incomplete（永久） |
| AC-P5-002 | 没有提交前冻结判据哈希与独立裁决 | incomplete（永久） |
| P1–P6 两轴审查原件 | 事后重派是新审查，不得倒签（`dual-axis-deviation.md` §四） | 6 个 Phase 永久缺"当时独立审查" |
| P3 逐包原件 9/10 | 历史对话原件未落盘 | 具名缺口（owner/时点） |
| T6/T16 原版字节 | 原件已失，只剩受控副本 | 记 unavailable，不冒充原版 |
| AC-P1-002 | 真实隔离宿主/新会话从未提供 | unavailable |

**可补而未补**：AC-P1-001（缺 step 1 成功判据）、AC-P3-002（改 AC 文本或补包答复接受原件）、AC-P10-008（A 表机器消费者 / C 表接图）。

**一句话**：这个任务不是"做完了没验收"，而是"验收证据的生产线比实现慢了一个数量级"——7 次重算、32 次门捕获、158 份 readiness、5 次签字，最后靠真实 close 才把 3 条最贵的 AC 一次性翻过来。

---

## 7. 原件索引（本文件引用到的关键件）

| 原件 | sha256（前 16 或全值见文） | 用途 |
| --- | --- | --- |
| `T:quality/reviews/2026-11-20-final-ac-reconciliation.md` | `b0e1b21e…` | 27 条七次重算的唯一权威 |
| `T:quality/evidence/2026-11-20-005-final-report-build-code-v2.md` | `1abee4fd…` | 终末报告 v2（16/4/1/5/1 时点） |
| `T:quality/evidence/build-code/dual-axis-deviation.md` | `bb9a9546…` | P1–P6 独立性偏离与不可补理由 |
| `T:quality/reviews/2026-11-20-p1p6-spec-axis.md` | `4f459677…` | P1–P6 13 条补审首判 |
| `T:quality/reviews/2026-11-20-p1p6-standards-axis.md` | `97172327…` | 规范轴 S-01..S-13 |
| `T:quality/reviews/2026-11-21-review-delta.md` | `83e959fe…` | 外部审查 46 行差集（4 fixed/15 partial/27 open） |
| `T:quality/evidence/build-code/fix-source-rebuild-notes.md` | `09669b14…` | 游标重建丢 gate 的复现与修复 |
| `T:quality/evidence/build-code/execution-budget-backfill.md` | `4662c0b2…` | 预算/等待/回执计数（112 条回执等） |
| `T:quality/evidence/p7-report-source-normalization.md` | `54d1c4a6…` | 报告源返工全过程 |
| `T:quality/tests/archive-graph-notes.md` | `4f262839…` | P8 TCR 与"12 绿"不可复现 |
| `A/spec.md`（27 条 AC、Appendix B） | — | 判据文本与计数 |
| `W` 提交 `46a81a72`/`eb182547`/`4a3c16a6`/`58ad5874`/`3a9d901b`/`c65f44b2` | — | 5 类门缺陷的修复 |

---

*本文件是只读调查产物，不是质量签字，也不改变任何 AC 档位。*
