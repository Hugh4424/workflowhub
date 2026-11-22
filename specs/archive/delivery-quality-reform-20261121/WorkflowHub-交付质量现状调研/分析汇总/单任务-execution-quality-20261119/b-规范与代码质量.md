# 单任务深挖 B：`execution-quality-build-code-hardening-20261119` 的项目规范与代码质量

> 只读审计，2026-11-21 11:35–11:50（Asia/Shanghai）。
> 仓库 `/Users/Hugh/Hugh/Project/workflowhub`，HEAD `454aafe5`（PR #35 已合并）。范围 `ad708bff..454aafe5`＝31 提交（29 非合并 + 2 合并）、87 文件、+22030/−6418。
> 材料：`specs/archive/execution-quality-build-code-hardening-20261119/`（12 文件）；任务库 `.../Knowledge/Projects/workflowhub/tasks/execution-quality-build-code-hardening-20261119/`（reviews 50 件、tests 795 件、evidence）。
> 外部审查＝`/Users/Hugh/Downloads/workflowhub-build-code-quality-review-2026-11-20.md`（19:27，基线 `ad708bff`，当时 HEAD `3169c1f7`）。之后 6 笔修复：`58ad5874`、`3a9d901b`、`eb182547`、`4a3c16a6`、`46a81a72`、`c65f44b2`（另有 `f2453852`/`0f183dcc`/`7bdb3ffe`/`afa4f120` 在 19:27–10e6a1db 之间）。所有"已实查"均为本会话实跑或读原件；"拟议"另标。

## 0. 一句话结论

**规范前半段（边界、证据字节、门、常驻授权）写得比检查强，后半段（测试面覆盖、证据等级、独立来源）只有文字没有检查；这次任务真正的进步是"外部审一次、修一遍"，不是"检查器能自己拦住"。** 已实查：19:27 审查点名的 6 个结构性 blocker 在 `10e6a1db` 时仍有 5 个 open；随后的 6 笔修复把它们基本关掉了（页面归约、归档回源、空卡、回放缺原件、门身份），但**修复自带的 3 组反例又被 Phase 门的 `-t` 过滤掉**（P1 2/172、P8 16/40、P9 11/76），同一类"门覆盖不足"在新代码里原地复发。

## 1. 规范检查点：哪些写了却没拦住

| # | 规范原文（路径:行） | 实际检查 | 结论 | 原件/反证 |
| --- | --- | --- | --- | --- |
| A | `docs/standard-workflow.md:75`「每个 Phase 自带…针对性测试，按本 Phase 承接 AC 与**声明测试面**核对」 | Phase 卡 `gate_cmd` 是自由文本，P1/P2/P3/P8/P9 用 `-t` 名字过滤；无"门选中集合 ⊇ 声明测试面"的检查 | **没拦住**；同一条 `AGENTS.md:48` 只禁全量，没授权用名字过滤替代测试面 | 实跑：P1 门 2 passed/170 skipped（172）；P8 门 16 passed/24 skipped（40）；P9 门 11 passed/65 skipped（76）。P8 的归档回源、P9 的 6 条回放反例全在 skipped 里 |
| B | `AGENTS.md:19`「质量裁决由独立来源…禁止自判」+ `docs/standard-workflow.md:67`「**完成声明的上限＝独立来源的结论**」 | `facts.jsonl` 的 `review_origin=not_run`；`check-delivery-claims` 只读 implemented/verified/accepted 三声明，**完全不看 review**；close 也不看 | **没拦住**；P1–P6 两轴由同一审查者兼做、两轴结论均无独立原件（任务库自认，`build-code/dual-axis-deviation.md`） | `quality/reviews/2026-11-19-019..021`、`2026-11-20-001..003` 六份全是 `ocr-unavailable`；事实行仍 `review_origin=not_run`；终报仍算出 16 条 AC pass |
| C | `docs/standard-workflow.md:81`「同一事实＝字节相同…不能用命令相同与字节数一致代替内容比较」 | P2 五列表"证据"格只判有无这一行：`ev-1` 记 `present:null,label:true` 但 `gaps=[]`、`complete=true` | **曾完全失效，收尾才修**；根因是冻结 oracle 断言了错误行为 | 外部审查 §2.1（blocker）；19:27 后由 `TCR-P2-01`（`58ad5874`）改判 gap，`tools/cli/check-stage-steps.mjs:1447,1832` |
| D | `CLAUDE.md:11`「不用兜底掩盖错误」+ `CONSTITUTION.md` Q2「真实错误不吞」 | `core/task-close.mjs:1227,1240` 归档回滚 `catch { /* the failure original stays authoritative */ }`：回滚本身失败无具名事实 | **没拦住**（修 D2 时新引入） | 若 `git mv` 回源失败，第二次重试仍撞 `SOURCE_BYTES_DRIFT`，失败回执只记第一次错误 |
| E | `AGENTS.md:117`「新机制…必须登记真实 consumer…没有消费者的重复控制面不新增」 | `move-map` 登记了 `check-replay.mjs`，consumer 写"调用方显式给案例文件的独立回放验收"＋两个测试；但这两个测试不在任何 Phase 门内 | **半拦住**：登记存在，消费者不可机检 | `docs/architecture/move-map.json` entries[307]；P9 门跳过 6 条 replay 反例 |
| F | `docs/standard-workflow.md:35`「终末整卡固定外部 OCR 全审」 | 6 份 OCR 全 `unavailable`（无 LLM endpoint），终末 `2026-11-20-p10-ocr-review.json` 也 `unavailable`；没有任何门要求 OCR 必须产生结论 | **规范自我豁免**（F4 允许 unavailable 不阻断）；终报如实降级为 `code_review=partial` | 这是"写明了但允许失败"的正确姿势，不算违规；但它让 B 项（独立来源）成为唯一质量闸，而 B 项没有检查 |

**反证（避免一边倒）**：同一批规范有三处真拦住了事——`delivery-claims` 的 accepted 声明在 close 前确实 `fail`（`047` 原件），逼出了真实 close+readback；`gate_identity` 让"读一次技能"的捕获无法冒充声明门（`031/032` 有身份、`030` 无身份）；P3 空卡判空在 `3a9d901b` 后真的 exit 1。**问题不是规范没价值，是"规范→检查"的落点集中在少数几个文件，剩下的靠人读。**

## 2. 真实代码缺陷清单（8 个，按影响排序）

> 每条：症状 → 根因 → 谁发现 → 修复 → 是否补可失败用例 → 复发风险。"已实查"指我读了修复 diff/跑过门。

**D1 页面检查器在 `ok:false` 时仍把 `checks` 全报 true（blocker）**
症状：`check-page-content` exit 1、80 条 errors（79 MODEL_MISMATCH + STALE_PAGE），`checks` 七项仍全 `true`，被 P7 当"七项均 true"的通过依据。
根因：返回值里 `checks` 是字面量 `{structure:true,…}`，与 `errors` 无归约关系（旧 `check-page-content.mjs:253`）。
发现：外部审查 §4.1；差集复核 #18 复现（`quality/reviews/2026-11-21-review-delta.md`）。
修复：`eb182547`——`CHECK_FAILURES` 错误码→轴归约（`:22`），未分类码 fail-closed 到 structure；并加 `--expect-html-sha256` 绑定交付字节。
用例：`tests/contract/cockpit-autogen.test.mjs` 新增"rejected page reports the checks that actually failed"与"browser acceptance can only observe the registered delivery bytes"（坏结构/MODEL_MISMATCH/缺源/交付字节漂移四负例）。**补了。**
复发：低（新码默认 fail-closed）；但归约表手写，新错误码会误报 structure=false（安全方向）。

**D2 交付提交失败后归档不回源，重试撞死（major）**
症状：`commit` 前 `git mv specs/<task> specs/archive/<task>`；pre-commit 拒绝、`assertNoSidecars`/`stagedDelivery` 拒绝或写回执失败后，工作树留下"已移动未提交"，重试报 `SOURCE_BYTES_DRIFT`/`ARCHIVE_TARGET_CONFLICT`，无原入口恢复。
根因：catch 只 reset 图对象，不搬归档（旧 `core/task-close.mjs:1201-1210`）。
发现：外部审查 §4.2；差集 #22。
修复：`eb182547`——失败时若 HEAD 里没有归档且源已消失，`git mv` 回源并 reset 两侧索引（`:1229-1240`）。
用例：`tests/integration/vnext-delivery-close.test.mjs:779` 用真实 pre-commit hook 拒绝，断言 HEAD 不变、源材料回位、暂存清空、同 plan 重试 completed。**补了**（单独跑 1 passed；但见 D8，门不选它）。
复发：中——回滚本身 `catch {}` 吞错（§1-D），第二次失败仍无具名原因。

**D3 游标重建把 `receipt/output/gate` 段整段抹掉（blocker 级可用性）**
症状：重写 build-code 游标后，`check-delivery-claims` 读 `gate:null`、implemented/verified 双 fail，明明已捕获过绿门（`quality/tests/2026-11-21-047-delivery-claims-recheck.json`）。
根因：P5 引入 `String(rowInput.source).split("; readiness: ")[0]`（`b90ac739`），把 readiness 之后的所有事实段截断。
发现：claims 复检原件 `047`（gate=null）＋`tests/contract/build-code-readiness.test.mjs:432` 注释直指该原件。
修复：`c65f44b2`——`sourceWithReadiness`（`tools/cli/stage-runtime.mjs:1183`）只替换 readiness 段、按原位保留其他 writer 的段。
用例：2 条——真实 `verify --action=execute` 捕获后三段原样保留、无捕获时不得凭空造段。**补了。**
复发：高——`source` 已是 20 段/3059 字符/6 个 gate 指针的无类型字符串，只消费最后一个；任何新 writer 用 `split` 就会重演。

**D4 回放案例缺 `original` 仍按 `not_declared` 继续判（blocker）**
症状：不写 `original` 的受控副本可复现 `status=replayed`/`target_red`；`--task-path` 未绑定时 `cases:[]`，逐 case 诊断全丢。
根因：`originalDeclaration(undefined)` 返回 `{status:"not_declared"}` 并继续（旧 `check-replay.mjs:32-34`）；绑定失败整份放弃。
发现：外部审查 §4.3；P9 Standards 轴 `needs_revision`。
修复：`4a3c16a6`——未声明即 `invalid_case` 且不执行副本；workspace.head 从可比条件降为并列漂移；unbound 仍逐 case 诊断（`check-replay.mjs:35-40,90-107`）。
用例：`final-chain-negatives.test.mjs` 的"gate counterexamples"6 条（undeclared 不执行、lost 不执行、post-commit 漂移仍出 target_red 等，带执行 marker 正控）。**补了**（但见 D8，门不选）。
复发：低（代码 fail-closed）；流程性复发高。

**D5 门身份缺失：任意后到的绿捕获可顶掉已声明的红门（blocker）**
症状：`latestGatePointer` 只取最后一个 `gate:` 标记；读一次技能、跑一条无关测试都能写 gate 标记，于是"声明的门红"被后到的绿捕获覆盖。
根因：捕获物只记 `command`，不记"它是不是当前 Phase 声明的 gate"。
发现：P9 Standards 轴（门身份）；差集 #3。
修复：`afa4f120`——捕获时算 `gate_identity{phase_id,phase_ref,gate_cmd,gate_cmd_sha256}`（`delivery-claims.mjs:302`），读取时 `selectDeclaredGate` 只认与当前 Phase 声明同 argv 的最后一个（`:330`）。
用例：`vnext-delivery-close.test.mjs` 3 条（非声明门不得替换红门、另一 Phase 门不得替换、`sh -c` 声明门按脚本文本匹配）。**补了**，且在 P9 门内（名字含 "bound delivery claims"）。
复发：中——门匹配用自写 POSIX 分词＋basename 归一（`shellWords:238`、`canonicalCommand:267`）；等价但写法不同的门会 unbound，声明 fail-closed（误报方向）。

**D6 空卡可过：11 格留空 8 格仍 exit 0（blocker）**
症状：`validate-card` 只查"有没有这一行"，空格/占位词照样通过。
根因：`rowValues` 只收集键；`meaningful()` 只用于验收四件（旧 `validate-card.mjs:61-70,222`）。
发现：外部审查 §3.1 实测复现；差集 #6 再复现。
修复：`3a9d901b`——对 `CARD_ROWS` 每格复用 `meaningful(cell,4)`，空/占位/纯标点记具名 reason（`:222-235`）。
用例：`decision-evidence-consumption.test.mjs`「rejects a card whose eight rows are present but empty」（`ORACLE-P3-ROLE-SOURCES`，在 P3 门内）。**补了。**
复发：低-中——4 字符阈值仍弱（"待定"两个字能过），语义质量仍靠冷读/对抗。

**D7 P2 标签形证据被当已读（blocker，需 TCR 才能修）**
症状：五列表证据填 `ev-1`，检查器记 `label:true` 但 `complete=true`、`gaps=[]`；测试还主动断言 `gaps=[]`。
根因：检查器把"形状"当"证据"；冻结 oracle 把错误行为写成期望，修它要动冻结断言。
发现：外部审查 §2.1；差集 #1。
修复：`58ad5874`——`TCR-P2-01` 改冻结用例，标签/空格记具名 gap、`complete=false`（`check-stage-steps.mjs:1447,1832`）。
用例：`check-stage-steps.test.mjs`「names label-shaped and empty evidence cells as gaps and exits non-zero」。**补了。**
复发：低（现 fail-closed）；但成本证据：改一条错误断言要 TCR＋owner 决定，说明"测试把错误固化"的代价被严重低估。

**D8 门覆盖：`-t` 门跳过后来新增的反例（系统性，仍 open）**
症状：P1 门 2/172、P8 门 16/40、P9 门 11/76；P8 的归档回源与任务分支三条、P9 的 6 条回放反例、P1 的 5 条回执身份反例全部不在门内。
根因：Phase 卡把门写成"测试名过滤"，且没有"门选中集合 ⊇ 本 Phase 声明测试面 / ⊇ 本次 diff 新增测试"的检查；外部审查只复跑了被点名的 P4/P10 两处。
发现：本报告实跑三条门（`vitest run … -t …` 读数见 §1-A）；不是 19:27 报告的发现。
修复：仅 P4/P10 在 `46a81a72` 改成整文件；P1/P2/P3/P8/P9 五张卡未改。**没有补用例——这正是缺陷本身。**
复发：**高**——每次往同一测试文件加反例都自动掉出门外，而门仍显示绿。

## 3. 可维护性：新面有没有真消费者，哪里过度实现

**3.1 消费者核对（实查）**

| 新增面 | 真实消费者 | 判 |
| --- | --- | --- |
| `tools/cli/check-delivery-claims.mjs`（47 行） | `core/task-close.mjs` 的 `executeClosePlan`→`recordCloseClaimsReadback`；`skills/stage-close/SKILL.md` §6；P10 终末；测试 | 真，且是全链唯一闭合点 |
| `runtime/task/delivery-claims.mjs`（583 行） | 同上＋`stage-runtime.gateIdentityFromCapture` | 真 |
| B/C 表（`build-decision-baseline.mjs`） | `skills/spec-analyze/SKILL.md:108-110` 人工读；A 表另被 `check-decision-log-chain.requirementIndexPointers`（`:852`）机器消费 | 真。**反证**：终报说"A 表仍只有人工消费者"（`2026-11-20-005-…:AC-P10-008`），与代码不符——维护者对消费者的自述不可靠 |
| `gate_identity` 字段 | `gate-results/031/032` 有值、`030` 为 null；`selectDeclaredGate` 消费 | 真 |
| `sourceWithReadiness` | 游标写入唯一 writer | 真，但协议脆（见 3.2） |
| `tools/cli/check-replay.mjs`（244 行） | 只有 SKILL 指令＋两个测试；无自动消费者；反例测试不在任何 Phase 门内 | 半：登记了，但"能不能用"没有机检 |

**3.2 过度实现（实查）**

1. **四套命令解析**：`runtime/task/final-chain-runner.mjs:286 argvMatches`（精确 join，不做 basename 归一）／`runtime/task/delivery-claims.mjs:238 shellWords`+`:267 canonicalCommand`（POSIX 引号、`sh -c` 解包、basename 归一）／`runtime/stage/stage-content-contracts.mjs:846 readinessProbeArgv`（引号＋只读白名单）／`tools/cli/check-replay.mjs:69 isolatedArgv`（路径隔离）。同一份 argv 的"相等/归一/隔离"三种语义各写一遍，同一回执在两处可能一绿一红。
2. **`runStageStepsCheck` 958 行**（文件 1870 行）：读技能回执、后到捕获全目录扫描、清单派生、包证据、AC/WP token 全塞进一个函数；6 笔修复继续往里加分支。`executeClosePlan` 335 行、`terminalAssessmentQuality` 393 行同理。
3. **`source` 字符串协议**：facts 的 build-code 行 20 段/3059 字符，6 个 `gate:`＋6 个 `receipt:`，只消费最后一个。`sourceWithReadiness` 按 `"; "` 切分并"保留其他 writer 段"，等于把并发写协调压进字符串位置约定；还靠 `replace(/[\r\n;]+/g," ")` 防注入。F6 说 facts 只承载事实，这里已是一条无界 append-only 历史。
4. **全目录扫描**：`laterSkillReadReceipt` 每次步骤检查扫 `quality/tests` 全部 JSON（795 文件/26MB，4 个 >512KB 还要分块全文扫）。任务历史越长越慢，且与"历史只读、不重读"口径相反。
5. **门覆盖只有一处改动**：P4/P10 改整文件、P1/P2/P3/P8/P9 仍 `-t`，同一条规则两套做法。

**3.3 重构后更难懂还是更好懂**

- 更好懂：`delivery-claims` 的守卫被拆成 `shellWords/canonicalCommand/selectDeclaredGate`，各自有注释和直测；`check-page-content` 的归约表一眼可核。
- 更难懂：判定散落在 6 个入口（Phase 卡文本、`gate_cmd`、facts `source`、claims、close、page），**没有一张"证据等级→可声明什么"的单一表**；同一件事（"这个门是不是真的"）要在卡文本、`gate-results`、`facts.source`、claims 四处各读一遍。新增面都是"局部可读、整体更绕"。

## 4. 最早偏离（2 条链）

**链 A：门只测形状 → AC 用标签证据 → 外部审查判 blocker → 改一条冻结断言要 TCR**
1. 第一处可纠正偏差：P2 写冻结五列 oracle 时，把"证据"判据写成"有这一行/非空"，并在测试里断言 `gaps=[]`（旧 `check-stage-steps.test.mjs:1682-1690`）。规范 `docs/standard-workflow.md:81` 已写"同一事实＝字节相同"，此时改成"必须解析到同包同字节原件"只差一个断言。
2. 放大：检查器记 `label:true` 但 `complete=true`；P3/P10 链检查与 AC 台账把 `complete` 当已覆盖；AC-P2-002 在 11-20 判 pass。
3. 放大：外部审查判 blocker；修复必须先 `TCR-P2-01` 改冻结断言（`58ad5874`），成本从"改一个断言"变成"改冻结 oracle＋记理由＋重核 10 包"。
4. 失效机制：测试一旦把"形状"写成期望，检查器就会把"有标签"当"有证据"，且后续 Phase 继承同一判据。
5. 后果：AC-P2-002 的 pass 一度没有字节支撑；修复后仍留下"改冻结断言需 TCR"的路径依赖。

**链 B：门写成名字过滤 → 新反例自动掉出门外 → 修复看起来有测试**
1. 第一处可纠正偏差：P1 卡把 `gate_cmd` 写成 `-t ORACLE-P1-CURRENT-SKILL-LOAD`（`P1-skill-loading.md:197,215`），把"门"定义成"名字匹配的子集"。规范 `docs/standard-workflow.md:75` 要求按"声明测试面"核对，此时写成整文件或"oracle 标签集合"即可。
2. 放大：P2/P3/P8/P9 复制同一写法（5 张卡）。
3. 放大：每次修复往同一测试文件加反例（P1 5 条、P8 3 条、P9 6 条），名字不匹配 → 门自动跳过；门读数仍是 2/172、16/40、11/76。
4. 放大：外部审查只发现被点名复跑的 P4/P10；差集复核也没查门选中集合，所以这条偏差在 19:27 报告与差集复核里都不存在。
5. 后果：修复提交的"可失败用例"存在但不被门执行；下一任维护者会以为"门绿＝反例通过"。

## 5. 框架改造（3 条，先做 1、3）

**R1 门覆盖对账（最该先做）**【拟议】
- 改前：`gate_cmd` 自由文本，`-t` 过滤无检查；P1 2/172、P8 16/40、P9 11/76。
- 改后：Phase 卡把门声明成 `gate_scope: {files, selectors}`；`check-stage-steps` 在 Phase 收口时列"门实际选中的测试名"（`vitest list` 或解析 `-t`）与"声明测试面""本次 `git diff` 新增/修改的测试名"做差集；差集非空 → 具名 gap，AC 不得 pass。允许登记 `excluded: [{test, reason, owner}]`。
- 触发：Phase 收口 / 每次 gate 运行后；owner：build-code 运行时 owner＋验收 owner。
- 正回放：P10 整文件门（191 passed）通过；P8 改整文件后 40/40 通过。
- 反回放：当前 P8/P9 卡 → 3 条、6 条具名 gap；"故意删一条反例"仍能被"diff 新增测试 ⊆ 门选中"抓到。
- 撤回：连续两个任务只产生已登记的慢测/手工测排除误报 → 降为 warning，不删检查。

**R2 证据等级单一表**【拟议】
- 改前：AC 档位可写"命令级/部分证据"或标签；claims 只看三声明，不看 AC 与 review。
- 改后：一张归约表 `byte_bound`（ref+sha 可读）> `human_read`（reader+readback ref）> `label`（不可 pass）。AC pass 至少 `byte_bound` 或 `human_read`；`label` 只能 incomplete；review 独立来源缺失时，完成声明上限按 `docs/standard-workflow.md:67` 自动降级，不靠人记。
- 触发：AC 台账读取 / close 声明；owner：验收 owner。
- 正回放：终报 16 条 pass 里带 `ref#sha` 的仍 pass（抽查 AC-P2-001/AC-P8-001/AC-P4-001 有 ref+sha）；反回放：P2 旧标签证据 → incomplete。
- 撤回：若某 AC 只能人读且无法保存读回原件，允许 `human_read`＋owner＋时点，不强制机器；两个任务无 label 漏网则保留。

**R3 控制面与解析收敛（代码质量最该先做）**【拟议】
- 改前：4 套 argv 解析；`check-replay` 无自动消费者；facts `source` 3KB 多写者字符串、6 个 gate 指针。
- 改后：(a) 抽 `runtime/interface/command-identity.mjs`，只留 `tokens/sameCommand/isolation` 三个函数，四处共用、删各自实现；(b) `move-map` 新增 `authority: gate|diagnostic`，`gate` 必须有自动消费者且测试在某 Phase 门内，否则只能标 `diagnostic`；(c) gate 指针 last-wins 替换而非追加，`source` 只保留当前 gate＋当前 receipt/output。
- 触发：新增第三个命令匹配点 / 新增控制面 / 每次 gate 捕获；owner：runtime/interface owner。
- 正回放：P10 声明门（`031/032`）收敛后仍匹配；`sh -c` 门在 claims 与 final-chain 两处同结论。
- 反回放：就绪探针必须仍拒绝 `sh -c`、`python -c`、`/bin/rm`（allowlist＋元字符）；若收敛丢了这层语义 → 回退。
- 撤回：若收敛改变冻结 oracle 结论（如 basename 归一影响 final-chain 判定），保留两处并登记差异，不强并。

> 关于"探针可执行任意命令"【实查，更正】：本任务历史里**没有**这一缺陷。只读 allowlist＋拒绝解释器/元字符自 P5 首个提交 `b90ac739` 就存在（`stage-content-contracts.mjs:775-864`），我实读确认 `sh`/`python`/`/bin/...` 均被拒。真实残余风险是"材料文本可让探针**读**任意路径"（`test -f`、`shasum <path>` 合法），属信息面而非执行面；按 F10 不建议为它再加门。

## 6. 六项回传

1. **任务**：调研 WorkflowHub 任务 `execution-quality-build-code-hardening-20261119` 的项目规范与代码质量，只读，产出本文件。
2. **结论与状态**：可用（有保留）。规范前半段有牙齿、后半段靠人；8 个真实缺陷中 7 个已有修复和可失败用例，门覆盖（D8）仍 open。
3. **已做与未做**：已读 3 份既有分析、外部审查、任务库 reviews/tests/evidence、8 个修复提交 diff、6 个源文件；实跑 4 条门（P1/P8/P9/delivery-claims）与 1 条单测。未做：全量回归（按 AGENTS 禁）、P1–P10 逐行 code review、真实 close/远端复跑。
4. **产物或原件引用**：本文件；关键原件见 §7。
5. **失败与限制**：门读数有时点性（材料在 19:27 后改了 6 次）；"6 笔修复"按终报口径（`58ad5874/3a9d901b/eb182547/4a3c16a6/46a81a72/c65f44b2`）；`--clean 删到根外`、`探针任意命令`两条示例在本任务无对应提交，已如实更正，不冒充。
6. **下一消费者动作**：框架 owner 先落 R1（门覆盖对账）与 R3(a)(c)（命令身份收敛＋gate 指针 last-wins）；验收 owner 用 R2 回放 16 条 pass。

## 7. 原件索引（可核）

- 规范：`CONSTITUTION.md:61-87`（F8/F9/F10/F11）、`AGENTS.md:19,48,57,117`、`docs/standard-workflow.md:35,61,67,75,81`、`constitution-checklist.md`、`runtime/interface/runtime-facade.mjs:5-13`（七 public behavior 未增）
- 外部审查：`/Users/Hugh/Downloads/workflowhub-build-code-quality-review-2026-11-20.md` §0/§2.1/§2.4/§3.1/§3.2/§4.1-4.3/§6.1
- 差集复核：任务库 `quality/reviews/2026-11-21-review-delta.md`（46 行：fixed 4/partial 15/open 27，时点 `10e6a1db`）
- 修复：`eb182547`（D1/D2）、`c65f44b2`（D3）、`4a3c16a6`（D4）、`afa4f120`（D5）、`3a9d901b`（D6）、`58ad5874`（D7）、`46a81a72`（P4/P10 门改全量）
- 证据：`quality/tests/2026-11-21-047-delivery-claims-recheck.json`（gate=null）、`quality/evidence/gate-results/2026-11-20-030/031/032-build-code-p10.json`（null/有身份/有身份）、`quality/evidence/build-code/dual-axis-deviation.md`、`quality/evidence/2026-11-20-005-final-report-build-code-v2.md` §5
- 实跑命令：`node tools/cli/check-delivery-claims.mjs --task-path=<任务库>`（exit 0，accepted 已由真实 close readback 闭合）；`node node_modules/vitest/vitest.mjs run tests/contract/check-stage-steps.test.mjs -t ORACLE-P1-CURRENT-SKILL-LOAD`（2/172）；`… tests/integration/vnext-delivery-close.test.mjs … -t 'isolated archive before delivery|bounded graph handoff and close'`（16/40）；`… -t 'bound delivery claims|matched target replay'`（11/76）；`… -t 'restores the archived materials…'`（1 passed/30 skipped）
