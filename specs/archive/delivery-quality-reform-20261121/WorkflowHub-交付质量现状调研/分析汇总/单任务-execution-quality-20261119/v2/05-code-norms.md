# 05 · 代码质量与规范强制（`execution-quality-build-code-hardening-20261119`）

只读提取。事实＝读原件/实跑；推断另标。未改仓库、未改任务库。

## 0. 对象与本次读数

| 项 | 值（原件/命令） |
| --- | --- |
| 仓库 / HEAD | `/Users/Hugh/Hugh/Project/workflowhub`，`454aafe5`（`git rev-parse`） |
| 范围 | `ad708bff..454aafe5`：29 非合并 + 2 合并提交，87 文件，+22030/−6418（`git diff --numstat` 汇总） |
| 规范原件 | `CONSTITUTION.md` 176 行、`constitution-checklist.md` 59、`AGENTS.md` 140、`CLAUDE.md` 21、`docs/standard-workflow.md` 103、`docs/architecture/move-map.json` 657 条目 |
| 任务库 | `~/Hugh/Knowledge/Projects/workflowhub/tasks/execution-quality-build-code-hardening-20261119`：reviews 51 件、tests 795 件/26MB（439 个 `.output`，4 件 >512KB）、evidence 16MB |
| 声明链（实跑） | `node tools/cli/check-delivery-claims.mjs --task-path=…` exit 0；三声明 pass（gate `…-032` exit 0、verdict `74a71577…`、close readback `…-013`） |
| 质量事实（原件） | `facts.jsonl` build-code 行：`review_origin=not_run`、`spec_analyze=null`、`finding_dispositions=[]` |
| 终末审查 | 7 份 OCR 原件 `status=unavailable`（6 Phase + `2026-11-20-p10-ocr-review.json` exit 1，无 LLM endpoint） |
| AC 分档（`final-ac-reconciliation` §14.4） | 27 条：pass 19、fail 1、incomplete 5、partial 1、unavailable 1 |
| 旧稿对照 | `分析汇总/单任务-execution-quality-20261119/b-规范与代码质量.md`（177 行）；本稿独立复核，不照抄 |

## 1. 规范条款强制率（14 条）

判「有」＝存在可执行检查器/断言；「半」＝有字段或登记但无校验；「无」＝只靠人读。

| # | 条款原文（≤30 字） | 机器检查 | 本次违反 | 证据（原件:行） | 没检查会怎样 |
| --- | --- | --- | --- | --- | --- |
| 1 | 完成声明上限＝独立来源的结论 | 半：`check-delivery-claims.mjs` 查三声明＋签字非作者＋close 读回，不看 `review_origin` | **部分** | claims 全 pass，而 `review_origin=not_run`；7/7 OCR `unavailable`；P1–P6 两轴同一审查者（`quality/evidence/build-code/dual-axis-deviation.md` 自认） | 无独立审查也能把 19/27 AC 说成完成 |
| 2 | 同一事实＝字节相同 | 有：`stage-runtime.mjs:1020 resolveOutputRef` 真实内容比较；`deduplication: unknown` 保新件 | 否 | 复用只经该 resolver；未发现「命令相同即复用」的原件 | 旧件会被当新事实复读 |
| 3 | 新机制须有真实消费者 | 半：`move-map.json` 有 `consumer`/`delete_condition` 字段，无生成或校验器 | **是** | 35 个新增文件里 16 个非材料件，**11 个无 move-map 条目**（`skills/decision-maker/**` 10 件 + 1 测试）；`check-replay` 无代码 caller | 控制面只增不撤，无人知其能否删 |
| 4 | 终末整卡固定外部 OCR 全审 | 无：`stage-runtime.mjs:1547 terminalAssessmentQuality` 只在已有 ref 时验哈希 | **部分** | 终末 OCR 与 6 次 Phase OCR 均 unavailable；无门要求 OCR 必须给结论 | 终末质量只剩人读，且降级不需具名批准 |
| 5 | 只跑受影响测试，禁全量 | 无 | 否（未发现无范围全量） | 门是子集：P1 2/172、P2 4/89、P8 16/40、P9 11/76（本会话实跑） | 反向风险：子集漏掉新反例（见 D8） |
| 6 | 按承接 AC 与声明测试面核对 | 无：无 `gate_scope`／「门选中集合 ⊇ 声明测试面」差集 | **是** | 10 张卡 5 张用 `-t`（P1/P2/P3/P8/P9）；D2、D4 的反例不在门内 | 门绿≠反例通过 |
| 7 | 禁整树/目录快照 | 无 | 否 | 未发现 tar/整树件；但 26MB/795 件无上限累积（4 件 >512KB） | 无人拦「整目录保存」 |
| 8 | 公共入口只七类 | 有：`tests/contract/runtime-facade.test.mjs` 断言列表；`runtime/interface/runtime-facade.mjs:4` | 否 | 新增 4 个 `check-*` 均为 CLI 工具，未进 public 七类 | 第 8 个 public 操作可静默混入 |
| 9 | 失败必须报失败 | 无：无 lint/检查拦空 `catch` | **是** | `core/task-close.mjs:1227,1240` 新加两处 `catch { /* … */ }` | 回滚失败后重试仍只报第一次错误 |
| 10 | 严重 finding 先修复或人承担 | 无 | 否 | AC-P3-003 保持 fail；19/1/1/5/1 如实分档 | 一条 fail 可被「整体 pass」掩盖 |
| 11 | 历史原件只读不重写 | 无 | 否 | 51 份 review 只增；差集另存 `review-delta.md` | 摘要覆盖原始失败 |
| 12 | 审查正文记执行者与三维读数 | 无 | **部分** | `2026-11-20-p1p6-standards-axis.md` 无审查者标识；两轴同人 | 无法按轴复核，独立性不可证 |
| 13 | 事实须对应真实执行 | 有：`check-stage-steps.mjs:886 validateSkillReadReceipt`、claims 拒手造 gate 原件（`delivery-claims.mjs:351` `gate_identity`） | 否 | 有失败用例：`bound delivery claims: a hand-built gate original … is refused` | 手写 JSON 可冒充门 |
| 14 | commit 前核范围/HEAD 并 record | 有：close 套件＋consumed 回执；D2 补 `task_branch_push` 声明 | 否 | `core/task-close.mjs:512,619,925` | 未声明动作借已确认范围执行 |

**合计**：有 4 条（2/8/13/14）、半 3 条（1/3/12）、无 7 条。**能被机器拦住的只有「事实绑定」这一族；「完成质量」「测试面」「登记」三族全靠人读。**

## 2. 缺陷清单升级版（8 条，状态按 HEAD `454aafe5`）

| ID | 严重级 | 症状（≤30 字） | 根因层 | 发现者 | 修复提交 | 可失败用例 | 在门内 | 复发风险与依据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | blocker | `ok:false` 仍 checks 七项全 true | 工具 | 外部审查 §4.1；差集 #18 | `eb182547` | 有（`cockpit-autogen` 3 条，含交付字节 sha 绑定） | 是（P7 整文件） | 低：`CHECK_FAILURES` 未分类码 fail-closed 到 structure |
| D2 | major | 交付提交失败后归档不回源，重试撞死 | 工具 | §4.2；差集 #22 | `eb182547` | 有（`restores the archived materials…`） | **否**：名字不含 P8 `-t` 任一模式 | 中：回滚自身两处 `catch {}` 吞错 |
| D3 | blocker | 游标重建抹掉 gate/receipt/output 段 | 协议+工具 | claims 复检 `…-047` | `c65f44b2` | 有 2 条（保留三段／不得凭空造段） | 是（P5 整文件） | 高：3059 字符/20 段无类型字符串，只消费最后一段 |
| D4 | blocker | 回放缺 `original` 仍继续判 | 工具 | §4.3；P9 轴 | `4a3c16a6` | 有 6 条（`gate counterexamples`） | **否**：describe 名不含 P9 `-t` 模式 | 低：现 `invalid_case` fail-closed |
| D5 | blocker | 后到绿捕获顶掉声明的红门 | 契约+工具 | P9 轴；差集 #3 | `afa4f120` | 有 4 条（非声明门／他 Phase 门／`sh -c`） | 是（P9 `-t 'bound delivery claims'`） | 中：自写 POSIX 分词＋basename 归一，写法不同即 unbound |
| D6 | blocker | 11 格留空 8 格仍 exit 0 | 工具 | §3.1 实测；差集 #6 | `3a9d901b` | 有（`ORACLE-P3-ROLE-SOURCES … eight rows … empty`） | 是（P3 `-t` 命中该 token） | 低-中：4 字符阈值仍弱（「待定」可过） |
| D7 | blocker | 标签形证据判 `complete=true` | 契约(冻结 oracle)+工具 | §2.1；差集 #1 | `58ad5874`（TCR-P2-01） | 有（`check-stage-steps.test.mjs:1756`，在 `ORACLE-P2-CURRENT-V2-CHECKLIST` 内） | 是（P2 `-t`） | 低：现 fail-closed；改冻结断言仍需 TCR |
| D8 | 系统性 | 门用 `-t`，新增反例自动掉出门外 | 模板+流程 | 本稿实跑（非 19:27 报告发现） | **无**（`46a81a72` 仅把 P4/P10 改整文件） | 无——这正是缺陷 | 不适用 | **高**：再加反例即掉出，门仍显示绿 |

**计数**：8 条中 7 条有修复且 7 条补了可失败用例；**5/7 在门内，D2、D4 的用例存在但门选不到**。

## 3. 控制面清单（本任务新增/修改）

| 路径 | 行数 | 真实消费者 | 门内测试 | 删除条件 | 标记 |
| --- | --- | --- | --- | --- | --- |
| `runtime/task/delivery-claims.mjs` | 583 | `core/task-close.mjs` `executeClosePlan`；`check-delivery-claims`；`stage-runtime` 捕获侧；3 个测试文件 | 是（P5 整文件、P9 `-t`） | 写明 | 有自动消费者（全链唯一闭合点） |
| `tools/cli/check-delivery-claims.mjs` | 47 | `skills/stage-close/SKILL.md` §6 指令、P10 对账（人读） | 是（P9 `-t`） | 写明 | 半：无代码 caller |
| `tools/cli/check-replay.mjs` | 244 | 2 个测试 + `build-code/SKILL.md` 文本 | 部分（P9 仅 1 条 replay 用例；6 条反例不在门内） | 写明 | **无自动消费者** |
| `tools/cli/check-specs-archive.mjs` | 60 | `vnext-delivery-close` 测试、`stage-close` 文本 | 是（P8 `-t` 命中 archive CLI 用例） | 写明 | 半 |
| `skills/decision-maker/scripts/validate-card.mjs` | 420 | `dispatch.mjs`/`status.mjs`/SKILL/模板；`decision-evidence-consumption` 测试 | 是（P3 `-t`） | **未登记** | **无 move-map 条目** |
| `skills/decision-maker/scripts/dispatch.mjs` / `status.mjs` | 177 / 75 | 仅 SKILL 指令（人/代理读） | 否 | **未登记** | **无自动消费者** |
| `skills/answer-as-page/scripts/check-page-content.mjs`（改） | 314 | `cockpit-autogen` 测试、`render-answer-page`、SKILL | 是（P7 整文件） | 写明 | 有 |
| 字段 `gate_identity`（`stage-runtime.mjs:1102` → `delivery-claims.mjs:351`） | — | claims 读取、close 前置 | 是 | 随入口退役 | 有 |
| 字段 `task_branch_push`（`core/task-close.mjs:619`） | — | `authorizeClosePlan`/`executeClosePlan` 校验 | 是（P8 部分选中） | 未写 | 有 |
| `move-map` 4 条新条目（+104 行） | — | 无 reader、无生成校验（纯登记） | 否 | 每条有 `delete_condition` | **无自动消费者** |

## 4. 复杂度热点

**函数行数 top 8**（本会话按括号配平实测；「新增分支」＝区间 diff 内 `+` 的 `if/else/case/switch/catch/?` 行，代理指标）

| # | 函数 | 行数 | 位置 | 所在文件（行数／新增分支） |
| --- | --- | --- | --- | --- |
| 1 | `runStageStepsCheck` | 775 | `tools/cli/check-stage-steps.mjs:958` | 1869 行／+113 |
| 2 | `validatePostPhaseContract` | 459 | `runtime/stage/stage-content-contracts.mjs:872` | 1408 行／+44 |
| 3 | `executeClosePlan` | 333 | `core/task-close.mjs:917` | 1260 行／+81 |
| 4 | `checkPageContent` | 229 | `check-page-content.mjs:67` | 314 行／+67 |
| 5 | `inspectDeliveryCloseState` | 184 | `core/task-close.mjs:733` | 同上 |
| 6 | `coldReadGaps` | 164 | `check-stage-steps.mjs:589` | 同上 |
| 7 | `terminalAssessmentQuality` | 161 | `tools/cli/stage-runtime.mjs:1547` | 2414 行／+49 |
| 8 | `validateCard` | 161 | `skills/decision-maker/scripts/validate-card.mjs:211` | 420 行／+72 |

> 行数为括号配平实测（±3）。**更正旧稿 b**：其「`runStageStepsCheck` 958 行」实为起始行号（`:958`），真实 775 行（`958–1732`，下一函数 `validateSkipIdentity` 在 `:1734`）。

**重复实现：4 套 argv 解析**（同一份 argv 的「相等/归一/隔离」各写一遍）

| 实现 | 位置 | 语义 | 差异后果 |
| --- | --- | --- | --- |
| `argvMatches` | `runtime/task/final-chain-runner.mjs:286` | 精确 join | `sh -c` 与非绝对路径匹配不到 |
| `shellWords` + `canonicalCommand` | `runtime/task/delivery-claims.mjs:238,267` | POSIX 引号、`sh -c` 解包、basename 归一 | 与上一处同回执可一绿一红 |
| `checkReadOnlyArgv` / `readinessProbeArgv` | `runtime/stage/stage-content-contracts.mjs:797,846` | allowlist＋元字符白名单 | 只读探针语义独一份 |
| `isolatedArgv` | `tools/cli/check-replay.mjs:69` | 路径隔离 | 仅回放用 |

**无界字符串**：`facts.jsonl` build-code 行 `source` ＝ **3059 字符 / 20 段**（`"; "` 分隔），含 **6 个 `gate:`、6 个 `receipt:`、6 个 `output:`、1 个 `readiness:`**；`sourceWithReadiness`（`stage-runtime.mjs:1183`）按位置替换并「保留其他 writer 段」，只消费最后一段；注入防护靠 `replace(/[\r\n;]+/g," ")`。**新增分支**：`+49`（`stage-runtime` 整体）。附带：`laterSkillReadReceipt` 每次步骤检查全扫 `quality/tests`（795 件/26MB，4 件分块全文扫）。

## 5. 重构前后可读性判定（3 处）

| 处 | 结论 | 一句理由 |
| --- | --- | --- |
| claims 守卫（`selectDeclaredGate`＋`gate_identity`） | **更好懂** | 判定收敛进一个具名函数，4 条直测＋失败原因写清「无匹配 gate_identity，请重跑声明门」；代价是新增跨模块字段，读技能不再能冒充门的前提要靠捕获侧一处保证。 |
| page checks 归约（`CHECK_FAILURES`→`checks`） | **更好懂** | 一张错误码→轴的表可逐行核，未分类码 fail-closed 到 `structure`，`ok` 与 `checks` 不再各说各话。 |
| source 重建（`sourceWithReadiness`） | **更难懂** | 把并发写协调压进 `"; "` 的位置约定，20 段字符串只有一个消费者；正确性依赖「谁都别再 split」的隐含约定，而不是类型或结构。 |

## 6. 一页结论（可直接进报告）

1. **规范写了 14 条，机器能拦的只有 4 条**（有 4／半 3／无 7）；被拦住的都属「事实绑定」（字节、回执身份、公共入口、授权），「完成质量」「测试面」「控制面登记」三族全靠人读。
2. **8 个缺陷 7 个已修、7 个有可失败用例，但只有 5 个落在门内**；D2（归档回源）与 D4（回放缺 `original`）的用例名字不含门 `-t` 模式，门显示绿而反例从未执行。
3. **门覆盖率是本任务最硬的缺口**：P1 2/172、P2 4/89、P8 16/40、P9 11/76（本会话实跑），10 张卡仍有 5 张用 `-t`；`46a81a72` 只把 P4/P10 改成整文件。
4. **控制面登记滞后于代码**：35 个新增文件里 16 个非材料件，**11 个无 `move-map` 条目**（整个 `decision-maker` 技能＋1 测试）；4 个 `check-*` 中 `check-replay` 无自动消费者，`move-map` 本身无 reader/生成校验。
5. **声明链能闭合，但不能证明独立**：三声明 pass（gate `032` exit 0、verdict `74a71577…`、close readback `013`），同时 `review_origin=not_run`、7 份 OCR unavailable、AC 19/27 pass——按 sw:67 的口径，P1–P6 的质量**不能被本仓规范推成「已独立审查通过」**。

## 7. 原件索引

- 规范：`CONSTITUTION.md:67,70,172,176`、`constitution-checklist.md`、`AGENTS.md:19,48,57,117`、`CLAUDE.md:11`、`docs/standard-workflow.md:35,61,67,75,81`
- 差集：任务库 `quality/reviews/2026-11-21-review-delta.md`（42 行：fixed 4／partial 15／open 23，时点 `10e6a1db`）
- 偏离自认：`quality/evidence/build-code/dual-axis-deviation.md`
- 声明：`quality/evidence/gate-results/2026-11-20-032-build-code-p10.json`、`quality/evidence/close/2026-11-20-013-close-claims-readback.json`
- 修复：`eb182547`（D1/D2）、`c65f44b2`（D3）、`4a3c16a6`（D4）、`afa4f120`（D5）、`3a9d901b`（D6）、`58ad5874`（D7）、`46a81a72`（仅 P4/P10 门）
- 实跑命令与读数：`node node_modules/vitest/vitest.mjs run tests/contract/check-stage-steps.test.mjs -t ORACLE-P1-CURRENT-SKILL-LOAD` → 2 passed/170 skipped (172)；`… -t ORACLE-P2-BOUND-HANDOFF` → 4/85 (89)；`… tests/integration/vnext-delivery-close.test.mjs … -t 'isolated archive before delivery|bounded graph handoff and close'` → 16/24 (40)；`… -t 'bound delivery claims|matched target replay'` → 11/65 (76)
