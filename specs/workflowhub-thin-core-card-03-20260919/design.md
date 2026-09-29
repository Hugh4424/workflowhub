# card-03 实施设计书 v4（make-decision 阶段产物）

> 本文件是任务 `workflowhub-thin-core-card-03-20260919` 在 make-decision 阶段产出的实施设计书，是后续 build-plan 写 `spec.md` + `phases/P<n>.md` 的原料。基底＝`DESIGN-v3.md`（1368 行），本次按 3 份收口交付（V4-A / V4-C / V4-D）装配为 v4。
> 装配变更：§1 三处逐字修补（V4-A）；§6 整节替换（V4-A）；新增 §6.7 阶段集合校正；§9.A 新增（V4-D）；§3.7 的 G-1 行追加指路句（V4-D）；新增 §11＝V4-C 全文；新增 §12＝V4-D 全文。
> §11/§12 是**附录形式**的原始交付，未与正文合并；实施时以 §6 的施工表为准，§11/§12 提供逐字文本与依据。

# card-03 模块级设计书：build-plan 材料与进度读取的可实施设计

- 任务：`workflowhub-thin-core-card-03-20260919`（make-decision 阶段模块级设计）
- 工作根（本文件所有相对路径的基准）：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`
- 参照树（只读）：主树 `/Users/Hugh/Hugh/Project/workflowhub`；CARD-04 材料改引归档 `specs/archive/workflowhub-thin-core-card-04-20260919/`（**2026-09-29 复核更正**：原列 CARD-04 worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919` 为参照树，实测该目录整体已删除，改引本 worktree 内的归档副本）
- 输入：`/tmp/wh-card03-design/A-rootcause.md`（根因账本 R1–R14）、`B-buildplan-artifacts.md`（材料解剖与缺口 G-1…G-9、契约测试约束）、`C-progress-authority.md`（进度载体与硬约束）、`D-constraints.md`（63 条硬约束、53 条已否决做法、14 处材料矛盾、写面撞车）、`E-s0921b.md`（776 行，**已到货**：card-02 的 verify-code 会话审计，§1.E 专门并入）。初始 `ls` 时 E 不存在，后续由父 agent 补入。
- 本文件所写行号均为本次打开文件核对过；凡未复核者在原处标注「未核」。

**引用约定（v2 新增，对应 F9.9 与 F9.2）**——一次性声明，后文不再重复解释：

1. **基准**：所有仓库相对路径的基准是上面第 2 行的「工作根」。每个 `路径:行号` 都可在该 worktree 上用 `sed -n 'Np' <路径>` 复核；本文件不写未核过的仓库行号。
2. **跨 worktree 的引用必须带全路径**：凡引用 CARD-04 的材料，一律写成 `specs/archive/workflowhub-thin-core-card-04-20260919/…`（§2 开头、§6.1 #12、§6.2 均已如此标注。**2026-09-29 复核更正**：原例 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919/…` 所在的 worktree 目录整体已删除，CARD-04 材料现归档于本 worktree 的 `specs/archive/` 下）。
3. **三处不可从本 worktree 解析的引用（如实登记，不假装可核）**：
   - `/tmp/wh-card03-session-analysis/s0922a.md`、`s0922b.md`、`talk-decision-record.md` —— 是**审计用的会话分析原稿**（仓库外、MB 级、本卡明令不读）。它们的行号**未经本卡复核**，全文件只作为「审计推断值的出处」出现，数字一律带「推断值，不作为验收指标」。
   - `handoff-build-code-1a409534.md` —— E 会话**运行期生成的 handoff 产物**，在本 worktree 里**不存在**（实测 `find` 无命中）。全文件只在一处作为「跨段重读」的现象例证，不作为可核引用。
   - `progress.json` —— **不是现存文件**，只是 §8 第 ⑦ 条里被否决方案的名字。
4. **裸文件名的固定含义**：`AGENTS.md` / `CONSTITUTION.md` = 工作根下同名文件；`decision-log.md` = 本卡 `specs/workflowhub-thin-core-card-03-20260919/decision-log.md`；`facts.jsonl` = 运行时数据目录下的 `quality/facts/facts.jsonl`（**仓库内不存在此文件**，实测为 0 个，只在 `/Users/Hugh/.workflowhub` 下有 1 个）；裸写的 `spec.md` / `phases/P<n>.md` = 设计**对象**（agent 产出的材料），落地位置是任务目录下 `specs/<task-id>/`，**本卡任务目录 `specs/workflowhub-thin-core-card-03-20260919/` 下尚无该类文件**（实测 0 命中；**2026-09-29 复核更正**：原写「本卡 worktree 尚未生成该类文件（实测无命中）」按 worktree 字面不成立——全 worktree 的 `spec.md` 90 份、`phases/P*.md` 22 份全部位于只读归档区 `specs/archive/**`，本卡任务目录内为 0），因此凡引用其内容的行号都是跨 worktree 引用。
5. **v2 的补全范围**：全部测试文件、`skills/**` 模板与 `tools/cli/stage-runtime.mjs` 的引用已补成全路径（共 53 处），不再出现裸文件名 + 行号。

## 0. 这份设计的边界与口径

**设计目标（用户逐字诉求的三段）**：①「让 spec 更清楚明白」→ §2；②「让每个 phase 的 md 文件也更清晰一些，让子代理通过 phase 文件可以非常清晰的知道每个 phase 的目标和计划是什么？每个 task 的目标的计划是什么？」→ §3；③「也更容易知道当前进度是什么？不要总是执行着就遗漏了进度，总是返工」→ §4。用户对方案的批评「太粗糙了，实现细节完全没讨论设计清楚」→ 本文件每一节都落到 `路径:行号` + 可逐字采用的文本草案。

**A 的「只改三件事」在本文件中的落点**：

| A 的三件事 | 预期收益（**审计推断值**） | 本文件对应 |
| --- | --- | --- |
| ① 等待改事件式 | token 20–25%、墙钟 20%+（`/tmp/wh-card03-session-analysis/s0922b.md:319`）**推断值，不作为验收指标** | §1 R1、R6、R7、R10 |
| ② 进度一次便宜读取 + 重跑判据从字节快照改成「该 phase 声明的写集」 | 10–15%（`/tmp/wh-card03-session-analysis/s0922b.md:327`）**推断值，不作为验收指标** | §4（读取）、§1 R2/R9、§3（字段承载） |
| ③ 审查去重 | 15–25%、墙钟 15%+（`/tmp/wh-card03-session-analysis/s0922b.md:335`）**推断值，不作为验收指标** | §1 R8、§3 的 `Review scope` 字段 |
| 并行线（并发上限） | 仅 3–5%（`/tmp/wh-card03-session-analysis/s0922b.md:348-350`）**推断值，不作为验收指标** | §1 R10（只做纪律，不做机制） |

**本表的数字口径（校正一次，全文件适用）**：表头原写「A 的实测口径」是**错的**。A 报告 §4.5 逐字声明「收益量级全部是推断值」，`/tmp/wh-card03-session-analysis/talk-decision-record.md:30` 明写「全部是**推断值**」、`:71` 写明「**不作为本卡验收指标**」。因此上表四个百分比**全部是审计推断值，不作为本卡验收指标**，也**不得与实测数字同表混算**：本表中只有 `/tmp/wh-card03-session-analysis/s0922b.md` 的行号是出处，没有实测值。凡本文件别处出现的**实测**数字（如 §1.E 的秒数与「实测断面占比 x% 墙钟」），一律标明「实测」并注明它是**当前成本占比**、不是预期降幅；凡预期降幅一律标「推断值，不作为验收指标」。

**证据覆盖声明（承 §1.E，全文件适用）**：四份会话日志里**有独立实测的阶段只有两个** —— `build-code`（根因账本 A 的主体 + E 的 17 次启动/重跑视角）与 `verify-code`（E-s0921b 首次单独记账）。`make-decision`、`build-spec`、`build-plan` 在 E 的三张表里全部零命中（`phases/`、`phases/P`、`index.md`、`spec-template` 全为 0），**仍然零实测**。因此：凡与 build-plan 产出物形状相关的条款（§2、§3、R3/R4/R8/R13/R15），其「收益量级」一律标**推断**并只给机制，不给秒数或百分比；只有引自 A 的 token/墙钟数字与引自 E 的秒数才标**实测**。跨日志只可比量级、不可精确换算（E §5 与 §6 的口径警告）。

**本设计一律不做的事**（对应 D 的 53 条已否决做法与 63 条硬约束）：不新增门禁/阻断/校验前置；不引入内容寻址哈希、receipt、快照 lineage、successor、reopen、rebind、continuation、checkpoint permit；不新增第二套进度权威、projection、账本；不新增 public runtime 命令、action 或 `facts.jsonl` 键；不新建第二份 phase 模板；不把执行状态写进 `phases/P<n>.md` 或 `phases/index.md`；不新增双写。

---

## §1 根因 → 文件级改法（R1–R14）

> 说明：每条给出「机制 / 落点 / 逐字草案 / 受益与量级 / 自证生效（可观察事实，非新门禁） / 本卡写面状态」。草案中的中文段落可直接粘贴；凡替换现有句子者均标明被替换的原文出处。

### §1.0 `AGENTS.md` 的写入预算：恰好三条（用户裁决 T-019=B，不得扩张）

> ⚠ **2026-09-28 起由 §14.6 冲突 1 更新**：用户逐字「**允许，可以修改AGENTS.md**」⇒ 第 12 条（`blocked` 必须用大白话升级到人）落 `AGENTS.md`，**T-019=B 的「恰好三条」预算被显式推翻，`AGENTS.md` 的净变更为四条**。本节标题与下文「净变更**只有三条**」的措辞**按 §14.6 冲突 1 作废**；本节其余内容（R1/R7/R10/R11/R16 的压回结论、`decision-log.md:61`/`:424` 的引文）**仍有效**。四条的实际内容与落地位置见 §14.4 的「落地核对」与 §14.7 第 49 行。

`decision-log.md:61`（T-019）逐字：用户选 **B＝只给最贵的三条** —— ①禁子代理继承父代理全部对话 ②禁空转轮询 ③「**声明不实怎么被发现**」；同一行并明确拒绝 A（**条款膨胀**，而 `AGENTS.md` 是常驻上下文文件）。`decision-log.md:424` 再现同一裁决。

因此 v2 对 `AGENTS.md` 的净变更**只有三条**；v1 的 5 处插入（R1/R7/R10/R11/R16）按此压回：

| 条 | 落点 | 文本要点 | 承载的根因 |
| --- | --- | --- | --- |
| 条① | `AGENTS.md:14` 就地改写（不新增行） | 派发时默认不继承父会话全文 | R6 |
| 条② | `AGENTS.md:15` 之后**新增一条** | 不轮询空转等待 + 回传的是结论与清单 + 并行按区间派发 | R1（主）、R7、R10（并入同一条，不各立新条） |
| 条③ | `AGENTS.md:23` 之后**新增一条** | 失败与「声明不实」的事实由独立审查判定、写入当前 stage 行的 `finding_dispositions` | 用户点名的第 ③ 条 + R16 的发现侧 |

- **R11（环境与工具卫生）不再占 `AGENTS.md` 预算**：改落到 `docs/standard-workflow.md`（本卡内可写、非常驻上下文），见 R11。
- **R7/R10/R16 不再各立新条**：R7/R10 的文本并入条②；R16 的发现侧并入条③，其实现侧留在 `docs/standard-workflow.md:284`，见 R16。
- **条③的逐字草案（新增，插在 `AGENTS.md:23` 之后）**：

```markdown
- 失败与「声明不实」的事实由独立审查判定，不由声明者自证：审查给出的处置写入当前 stage 行的 `finding_dispositions`（取值 `fixed` / `rejected_invalid` / `accepted_risk` / `needs_human` / `user_decided`）。该字段**只能记录、不成门**：它不阻断推进、不是推进许可证，缺省就是 `unknown`。
```

- 依据：五值枚举逐字见 `runtime/stage/completion-predicates.mjs:124`（`const STAGE_ROW_FINDING_DISPOSITIONS = new Set(["fixed", "rejected_invalid", "accepted_risk", "needs_human", "user_decided"]);`，本卡 worktree 实测）。v1 全文对「声明不实」grep 零命中，v2 由本条补上。
- **其余「可观察形态」的写法不得扩散到 R7/R10/R11/R16**：这四处一律只写「怎么自证生效（可观察事实，非校验）」，不新增校验、不新增字段、不新增门禁。

### R1 轮询式等待（card-02 `wait_agent` 278 次 = 71.1M token / 27.0%、15,638 s = 42% 墙钟、212 次空转；card-05 27.35% token / 25.3% 响应）

- **机制**：主会话把「等子代理回来」实现成反复调用等待工具，每次都把父上下文重新送进模型一次。
- **落点**：`AGENTS.md` **条②**（见 §1.0；插在 `:15` 与 `:16` 之间，新增一条，不挤占 `:14` 的改写）；同一句同时进 `workflows/build-code/SKILL.md:80-99`（Portable dependencies）与 `workflows/build-plan/SKILL.md:77-90`（Portable dependencies）各一次引用，不复制正文（D4：规则正文唯一权威，各阶段各引用一次）。
- **逐字草案（条②，新增；R7 与 R10 的原草案按 T-019=B 并入本条，不各立新条）**：

```markdown
- 派发子代理后不轮询等待，也不为查看进度而空转等待调用：子代理的回传本身就是事件，主会话在收到回传前继续做不依赖它的工作；同一派发不重复发起。这些动作回传的是结论与清单（路径 + 命中计数 + `路径:行号`），扫描命令必须自带范围与条数上限（例如限定目录、`rg -l`、`--max-count`），不得把全仓原始输出回传主上下文。并行按当前宿主可用的区间派发（2–5 为常规区间）；宿主达到并发上限时把剩余工作排队顺序执行并记录真实原因，不重复重试派发。并行只在输入、依赖和文件归属互相独立时使用。等待事实按实际发生的次数记录，不为凑证据而等待。
```

  在两处 skill 的 Portable dependencies 段末各加一行引用（不重写正文）：

```markdown
派发与等待按 `AGENTS.md` 的「派发子代理后不轮询等待」条执行；本条只引用，不复制其正文。
```

- **受益与量级**：等待类 token 与墙钟直接按轮询次数下降；A 实测该断面占 card-02 的 27.0% token / 42% 墙钟（`A-rootcause.md` R1 行，**实测**）。本条**不承诺**任何提速百分比（凡百分比均为推断值，不作为验收指标）。
- **自证生效**：下一次 card 类会话日志里 `wait_agent` 调用次数与派发次数之比（现在 card-02 是 278 次等待对 21 次 fork）——这是可直接从 rollout 统计的事实，不需要新校验。
- **写面**：`AGENTS.md`、`workflows/build-code/SKILL.md`、`workflows/build-plan/SKILL.md`。前两者不在 CARD-04 写面，第三个（`workflows/build-plan/SKILL.md`）也不在（见 §6）；`workflows/build-code/SKILL.md` 在 CARD-04 写面内（+24 行）→ 排队（§6）。

### R2 跨 phase 全量快照绑定（card-07 = 6h36m / 7h34m 墙钟的 87%）

- **机制**：`build-code` 的收尾步把「当前结果」与上一轮的字节级快照逐字节比对，材料任何变化都要求整段重做。
- **落点（两个）**：① `docs/standard-workflow.md:334-338`（build-code step 11 `authenticate-current-task-completion` 的说明；**2026-09-29 锚点更正**：原记 `:289-290` 为合并前旧编号）；② `workflows/build-code/steps.json:15`（同一 step 的 `observable_result`）。
- **逐字草案（替换 `docs/standard-workflow.md:334-338` 原文）** —— **2026-09-29 复核更正：该文案已落地**，`docs/standard-workflow.md:334-338` 现文即此稿；该落点由合并提交 `97092b30` 带入本卡 worktree（`97092b30^1` = **本卡侧 `5202828a`**、`97092b30^2` = **main 侧 `6848760d`**；实测 `git diff --stat '97092b30^1' 97092b30 -- docs/standard-workflow.md` 为空 ⇒ 该文档的合并结果与**本卡侧 `5202828a`** 逐字节相同；对 main 侧 `6848760d` 则 `docs/standard-workflow.md` 相差 **52 行**，另一落点 `workflows/build-code/steps.json` 相差 **4 行**。**2026-09-29 复核更正**：原文误写成「与 main 侧逐字节相同」，括注方向写反）。以下保留的是**设计期草案原文**，不是待办：

```markdown
11. `authenticate-current-task-completion`：确认 task facts 绑定**该 phase 声明的写集**
    （即 phase 文件 `Write set` 列出的路径本身；不并入本次实际改动的文件，也不并入受影响的检查清单）。
    删掉跨 phase 的全量快照绑定：不与上一轮的字节级快照逐字节比对。同一材料版本内的两次结果
    视为同一绑定；只有当该 phase 声明的写集变化时才需要重做对应部分。
    代码快照变化本身不使材料失效。
```

- **逐字草案（`workflows/build-code/steps.json:15` 的 `observable_result`，**在原句之后追加**，原句逐字保留）** —— **2026-09-29 复核更正：该追加已落地**，`steps.json:15` 现文含「the binding object is the write set this Phase declares … not a whole cross-Phase snapshot.」；经本卡提交 `5202828a` 落地并随合并 `97092b30` 进入本卡 worktree。以下保留的是**设计期草案原文**，不是待办：

```text
... and review dispositions support that claim; the binding object is the write set this Phase declares (its declared Write set paths only — not this round's actual changed files, and not an affected-check list), not a whole cross-Phase snapshot. missing quality facts stay incomplete but do not block repair.
```

- **判据口径（逐字取自用户裁决，不得替换）**：`decision-log.md:52`(T-010=A) 逐字「口径＝『删掉跨 phase 的全量快照绑定、只留**该 phase 自己声明的写集**』。落点：`docs/standard-workflow.md:334-338`（step 11 `authenticate-current-task-completion`）**与** `workflows/build-code/steps.json:15`」；`:293` acceptance 逐字「step 11 的绑定对象为**该 phase 声明的写集**、不再绑整个 snapshot」。**不是**「绑定当前材料版本 + 实际影响集」——那是影响集口径，v1 曾用它静默替换本判据，v2 改回逐字原文；影响集只作为写集的补充项出现。
- **如实写明第二落点在设计期的现状（2026-09-28 实测；2026-09-29 复核更正：该处现已落地）**：`workflows/build-code/steps.json:15` 是 step 11 的 `observable_result`，**设计期不含任何绑定语义** —— `grep -c snapshot workflows/build-code/steps.json` = **0**（本卡 worktree 实测）。所以本卡是在该处**新增**判据，不是「修正已有绑定」；v1 写的「`:15` 已要求绑定当前 snapshot」是错的，已删。
- **三个读取点（逐点核对并要求给出处置，不能只写「不变」）**：
  1. `tests/contract/stage-routing-and-concrete-testing.test.mjs:164-165` —— `:164` 取 `authenticate-current-task-completion` 的 `observable_result`，`:165` 以 `toMatch(/current task facts is marked completed only when actual changes, tests, AC evidence, and review dispositions support that claim/i)` 断言。**处置：新增判据只能追加在原句之后，不得改动或重排现有子串**；按上述草案追加后 `:165` 仍匹配 → 不红。
  2. `tests/e2e/vnext-five-stage-current.test.mjs:499` —— `:499` 在 `stepSlug` 映射表里把 `build-code` 映到 `"authenticate-current-task-completion"`，只按 **slug** 定位、不读 `observable_result`。**处置：不动 slug，本条改动对它是纯文本加法 → 不红**（`confirm --action=decision` 的语义前提未变）。
  3. `docs/stage-atomic-step-inventory.md:65` —— 该行是 `| build-code | 11 | authenticate-current-task-completion | task audit | retain incomplete facts honestly |`，描述语是「保留不完整事实」，**不含 snapshot、也不描述绑定对象**。**处置：与新判据不冲突，不改**；该文件的既有红事实见 §7-1，不由本条引入、也不由本条修复。
- **受益与量级**：重跑判据从「整段快照相等」收窄到「该 phase 声明的写集」，削减 R2 的 87% 墙钟断面中属于无差别重做的那部分（**推断值，不作为验收指标**）。与 §5 的 `steps.json` 改动配合，不引入第二套权威。
- **自证生效**：下一个 post 任务里 `authenticate-current-task-completion` 步骤的记录中，「因为快照变化而重做」的次数；以及同一 phase 内 task 重复执行的次数（card-07 的 P5/P4 重入是 16 turn/10.05h 与 6 turn/6.18h，**实测**）。
- **写面**：`docs/standard-workflow.md`、`workflows/build-code/steps.json`（两者都不在 CARD-04 写面，见 §6）→ 本卡内做。注意 `decision-log.md:35`(3) 的禁改区是 `docs/standard-workflow.md:88-92`（本卡一字不动）；本条的 `:334-338` 与该禁改区**不重叠**，因此不存在 v1 写的那种「两种处置并存」的待决项。

### R3 重复读 / 重跑（card-07 文件读 2.9×、rg 3.3×；card-05 vitest 153 次跑 28 个文件 = 5.5×，单文件最多 49 次）

- **机制**：没有「同一 task 内同一目的的读/跑只做一次」的成文纪律，子代理各自重新取证。
- **落点**：**新行落在 `docs/standard-workflow.md:92` 之后，不改动 `:88-92` 任何一个字**（`decision-log.md:35` 第 (3) 条把 `docs/standard-workflow.md:88-92`、尤其 `:91` 列为「禁区（勿改）」，本卡一字不动）；`:88` 现有句「没有真实主题变化，不重复全文读取、测试、review 或 analyzer」保持逐字不变，本条只在其后**新增**一句操作化补充。`CONTEXT.md` 已有新增节（card-03 worktree 的 `M CONTEXT.md`，hunk `@@ -451,3 +451,14 @@`）承担子代理产出契约，本设计不另起一节。
- **逐字草案（新增行，紧接 `docs/standard-workflow.md:92` 之后、`### stage 结束` 之前；与 R4/R15 同位置，各自独立成句）**：

```markdown
同一 task 内，同一文件为同一目的只读一次，同一命令为同一 oracle 只跑一次；已经写进摘要或事实栏的结论
直接复用其 ref，不重新读取原文。读取结论必须带 `路径:行号` 或 ref，使下一次可以直接引用而不必回读。
```

- **写面口径**：本条**不是**对 `:88` 的就地扩写。`decision-log.md:35` 的禁改区 `:88-92` 在本卡是**硬边界**，v2 全文件只有一种处置：涉及该段的每一条（R3/R4/R8/R15）都只在 `:92` 之后新增行，不改动这五行里的任何一个字。
- **受益与量级**：直接对应 card-05 的 5.5× 测试重跑与 card-07 的 2.9×/3.3× 读取倍数（**实测倍数，非预期降幅**）。
- **自证生效**：会话日志里同一文件路径的 read 次数分布、同一 `gate_cmd` 的调用次数（现在单文件最多 49 次）。
- **写面**：`docs/standard-workflow.md` → 本卡内做。

### R4 压缩被动撞墙（card-05 触发 49 次、`replacement_history` 4,790,089 字符 ≈ 1.2M token；card-07 的 8 次全部落在上下文 87.6%–96.4% 时）

- **机制**：上下文整理只在上限触发时被动发生，且发生在最贵的时刻。仓库此前无任何规则（`specs/archive/workflowhub-thin-core-card-02-20260919/research/RC-rejected-25-triage.md:48` 登记 owner = CARD-03）。
- **落点**：`docs/standard-workflow.md:92` **之后**新增一句（`decision-log.md:35`(3) 的禁改区 `:88-92` 在本卡一字不动 → 新增行落在 `:92` 之后，不改现有字句）。
- **逐字草案（新增，紧接 `:92` 之后、`### stage 结束` 之前）**：

```markdown
主会话在每个 phase 结束、每次派发新子代理之前做一次主动整理：把已完成子代理的结论压成带 ref 的条目，
原始日志与中间产物只保留路径。整理是主会话自己的工作纪律，不新增命令、不新增检查，也不设统一预算 gate。
```

- **受益与量级**：把整理成本从「上限处的全量重写」前移到「边界处的小步整理」；card-05 的 49 次被动压缩是这条纪律缺失的直接代价。
- **自证生效**：下一次会话里「压缩发生在上下文占比的哪个区间」——card-07 现在是 8/8 落在 87.6%–96.4%。
- **写面**：`docs/standard-workflow.md` → 本卡内做（新增行不触碰 `:88-92` 禁改区；`:88-92` 五行在本卡一字不动，因此不存在「禁改区 vs 要改区」的待决项）。

### R5 进度权威分散 5 处（用户逐字：「进度丢失导致重新回到 P3、P4 已经是第三次了」，`/tmp/wh-card03-session-analysis/s0922b.md:65`）

- **机制**：`phases/index.md` 不带状态、`facts.jsonl` 游标在材料里零指针、worktree 根另有 5 份属别的任务的「当前 phase」文本，子代理没有唯一入口。
- **落点**：§4 全节（读取设计）＋ `workflows/build-code/SKILL.md:52-63`（Authority and entry）就地补两句指向规则。
- **逐字草案（插在 `workflows/build-code/SKILL.md:58` 之后，即 `:58` 那段末尾）**：

```markdown
Worktree 根目录的 `progress.md`、`task_plan.md`、`findings.md`、`HANDOFF-*.md`、`.planning/` 不是当前任务材料；
当前进度只从本 stage 的 `status --action=begin` 返回的 `phase_progress` 与本 task 的 `specs/<task-id>/phases/` 读取。
`phase_progress` 键不存在时（没有写过游标），按本 SKILL 的续跑条文人工推导当前 (phase, task)，不另造一份进度记录。
```

- **受益与量级**：消除 C §2 实测的误导源（5–6 份零参数可读的文本文件）；这是「进度一次便宜读取」（10–15%，**审计推断值，不作为验收指标**）的前提。
- **自证生效**：子代理回报里是否还出现「读到根目录 progress.md」的引用；下一次会话对根目录这些文件的读取次数。
- **写面**：`workflows/build-code/SKILL.md` 在 CARD-04 写面内（+24 行，位置在 `@@ -204` 附近，未触 `:50-78`）→ 排队（§6）。§4 的规则本体落在 `docs/standard-workflow.md`（本卡内做），因此本条的实质交付不依赖排队项。

### R6 fork 全量继承（21/21 次 `fork_turns:"all"`；子代理输入 191.4M = 42%）

- **机制**：默认把父对话全文塞进子代理上下文，子代理从零重新定位。
- **落点**：`AGENTS.md` **条①**（`:14` 就地改写，不新增行；见 §1.0）。
- **逐字草案（替换 `AGENTS.md:14` 原文）**：

```markdown
- 重活放进子代理上下文执行，主上下文只收摘要（减少主上下文占用）。派发时默认不继承父会话全文：子代理只拿一份自包含任务书（目标、输入路径、产出路径、验收方式、边界）。需要沿用时由主会话显式挑出最小必要片段，不做全量继承。
```

- **受益与量级**：子代理输入 42% 的分母直接减小；同时降低子代理「重新考古材料」的二次读取（G-5 的二阶放大）。
- **自证生效**：下一次会话里 `fork_turns` 取值分布与子代理输入字节数。
- **写面**：`AGENTS.md` → 本卡内做。

### R7 巨量输出无闸门（card-05 四条 rg 输出 3,353,007 / 1,812,083 / 1,497,346 / 970,932 token；单次输出上限约 40,100 字符）

- **机制**：扫描类命令默认打印全部命中内容，且被派回主上下文。
- **落点**：`AGENTS.md` **条②**（文本已并入条②，逐字见 §1.0 与 R1 草案；本条**不新增第四条**）。
- **逐字草案（并入条②，不再单独成句；该半句在条② 里的位置是「这些动作回传的是结论与清单…」到「…回传主上下文。」）**：

```markdown
这些动作回传的是结论与清单（路径 + 命中计数 + `路径:行号`），扫描命令必须自带范围与条数上限（例如限定目录、`rg -l`、`--max-count`），不得把全仓原始输出回传主上下文。
```

- **受益与量级**：单条命令的输出量级从百万 token 降到千 token 级；card-05 的四条巨量输出即该断面的样例（**实测**）。降幅百分比为**推断值，不作为验收指标**。
- **自证生效（可观察事实，非校验）**：下一次会话里单次工具输出的字节数分布（现在最大值约 40,100 字符/次）。
- **写面**：`AGENTS.md:15` 之后的那一条 → 本卡内做。
### R8 审查循环（`docs/standard-workflow.md:84-86` 每 phase 一次 + `:286` step8；两起事故：30 万个字符上限导致 118 处返工 ≈ 1.7 h；用户判 per-task 审查为事故）

- **机制**：审查请求的材料范围没有收敛到「本 phase 的 diff + 本 phase 的判据」，包体随材料增长；同一材料被重复派发审查。
- **落点**：`docs/standard-workflow.md:92` **之后**新增行（`review` 去重句已存在，本条只新增一句，不改动 `:88-92` 任何一个字）；`workflows/build-plan/SKILL.md:230-245`（step 7 一次合并审查）就地补一句范围说明；phase 文件侧**不再**由 `Review scope` 字段承载（该字段按 D-FIELD=A 删除，见 §3.2）。
- **逐字草案 1（新增行，紧接 `docs/standard-workflow.md:92` 之后；与 R3 同一插入位置、独立成句，不改 `:88` 首句）**：

```markdown
同一材料未变化时不重复派发审查：一次 phase 审查覆盖该 phase 的 diff 与本 phase 文件里的验收判据，
不把整份 spec 与其它 phase 的材料重新打包；为得到更干净的标签而重试同一请求不构成一次新执行。
```

- **逐字草案 2（在 `workflows/build-plan/SKILL.md:230-232` 之后插入一句）**：

```markdown
该次审查是合并审查：一次覆盖 `spec.md` 与全部 `phases/P<n>.md`，不按材料拆成两次请求。
```

- **受益与量级**：审查去重断面按 A 的记账为 15–25% token、墙钟 15%+（`/tmp/wh-card03-session-analysis/s0922b.md:335`）——**审计推断值，不作为验收指标**（A 报告 §4.5 逐字声明「收益量级全部是推断值」；`/tmp/wh-card03-session-analysis/talk-decision-record.md:71` 逐字写明「不作为本卡验收指标」）。与 E6 同向（**引文改正**：`decision-log.md:466` 是「条款可观察性（T-019=B、T-021=A）」条目，**不是** OI 条目；v1 写的「OI-014」不存在 —— 该清单只有 OI-001…OI-011，见 `decision-log.md:25-26`）。
- **自证生效**：下一个任务里同一 phase 的 `review --action=record` 调用次数（事故场景里同一材料被多次派发），以及 review 包体字节数。
- **写面**：`docs/standard-workflow.md` 本卡内做；`workflows/build-plan/SKILL.md` 本卡内可做（不在 CARD-04 写面，见 §6）。

### R9 phase 重入 = 全量重做（P5 16 turn / 10.05 h / 2.93 亿 token；P4 6 turn / 6.18 h / 1.93 亿）

- **机制**：重入时不知道「哪些 task 已完成、哪些检查已有效」，于是整 phase 重做。
- **落点**：`docs/standard-workflow.md:292-293`（「有效问题在当前 phase 修复，然后只重跑受影响检查」）就地明确「重入」口径；材料侧由 §3 的 `Execution wave` / `Entry conditions` / `Impact set` 字段与 §4 的游标共同承载。
- **逐字草案（在 `docs/standard-workflow.md:292-293` 之后插入）**：

```markdown
重入一个 phase 时，先读当前 `phase_progress` 与本 phase 文件里的实施波次与影响集：已完成的 task 不重做，
只从游标所指的 task 继续；已跑过且材料版本未变的检查不重跑，只补影响集里新增的部分。
```

- **受益与量级**：把 R9 的重入成本从「整 phase 重做」降到「剩余 task + 新增影响」；P5/P4 的 16 turn / 6 turn 是当前口径。
- **自证生效**：下一次 phase 重入时被重新执行的 task 数与该 phase 的 task 总数之比。
- **写面**：`docs/standard-workflow.md` → 本卡内做。

### R10 并行派不出去（`collab spawn failed: agent thread limit reached` 26 次；`Promise.all` 仅 14.6%；882 条 exec 中 793 条只包 1 条命令）

- **机制**：没有「并发按区间、超限即排队」的纪律，超限被当成失败重试。
- **落点**：`AGENTS.md` **条②**（文本已并入条②的末段；本条**不新增第四条**）与 phase 文件侧的实施波次字段（§3；该字段已按 D-FIELD=A 删除，见 §3.2）。
- **逐字草案（并入条②）**：

```markdown
并行按当前宿主可用的区间派发（2–5 为常规区间）；宿主达到并发上限时把剩余工作排队顺序执行并记录真实原因，不重复重试派发。并行只在输入、依赖和文件归属互相独立时使用。
```

- **受益与量级**：A 测得并行线本身只值 3–5%（`/tmp/wh-card03-session-analysis/s0922b.md:348-350`，**审计推断值，不作为验收指标**），本条的目标是消除 26 次无效派发的噪声与重试成本，而不是承诺提速。
- **自证生效（可观察事实，非校验）**：下一次会话里 `spawn failed` 类错误条数与派发次数的关系（现在 26 次）。
- **写面**：`AGENTS.md:15` 之后的那一条 → 本卡内做。与 D18（不承诺并行提速比例）一致：草案不写任何提速数字。

### R11 环境与工具卫生（`TERM=dumb` 触发 starship `[ERROR]` 2,632 条 ≈ 6.8 万 token；`curr_time` 46 次 = 13,154,939 token）

- **机制**：每个命令都继承不完整的环境，且逐步调用取时工具，噪声反复进入上下文。
- **落点**：**不占 `AGENTS.md` 的三条预算**（按 T-019=B，见 §1.0），改落到 `docs/standard-workflow.md:92` **之后**新增一行纪律（与 R3/R4 同一插入位置，各自独立成句；`:88-92` 禁改区一字不动）。
- **逐字草案（新增行，紧接 `docs/standard-workflow.md:92` 之后）**：

```markdown
长命令与脚本在带 `TERM` 的环境里执行；不为确认时间而逐步调用取时工具，需要时在证据里记一次时间戳。
环境噪声（提示符报错、字体/终端告警）不计入证据，也不得作为失败原因写入事实。
```

- **受益与量级**：去掉 2,632 条噪声行（≈6.8 万 token）与 46 次取时调用（13.15M token 的断面），两者均为 **A 的实测断面**；本条不承诺降幅百分比（推断值，不作为验收指标）。
- **自证生效（可观察事实，非校验）**：下一次会话日志里 `[ERROR]` 行的条数与取时工具调用次数。
- **写面**：`docs/standard-workflow.md`（不在 CARD-04 写面）→ 本卡内做。

### R12 旧 handoff 无有效期（无任何规则；`/tmp/wh-card03-session-analysis/s0922b.md:345` 建议 `valid_until_stage` / `superseded_by`）

- **机制**：handoff 文件不带「属于哪个 task / 哪个 stage」的显式身份，旧 handoff 与当前材料外观相同。**注意**：`superseded_by` / `valid_until_stage` 属 successor/lineage 类机制，D 的永久禁止清单已否决（`AGENTS.md:59`），本设计一律不引入。
- **落点**：`skills/stage-handoff/SKILL.md:46`（第 3 节标题「当前阶段与进度」）与 `runtime/stage/stage-handoff.mjs:20-21`（`PRE_BANNER` / `POST_BANNER`）。
- **逐字草案（banner 增补，追加在 `runtime/stage/stage-handoff.mjs:20-21` 两个常量的现有文本之后）**：

```
本条 handoff 属于 task <task_id> 的 stage <stage>，只对该 task 的该 stage 有效；
它不是当前任务材料，也不携带任何进度或完成结论。
```

- **受益与量级**：消除「旧 handoff 被当成当前进度」这一类读取（C 实测根目录有 2 份 `HANDOFF-*` 属别的任务）；身份写在 banner 里而不是新增字段，不触碰 `facts.jsonl` 行契约。
- **自证生效**：子代理回报中引用旧 handoff 作为当前状态的次数；banner 文本在渲染产物中的存在性（`runtime/stage/stage-handoff.mjs:318-380` 渲染路径）。
- **写面**：`skills/stage-handoff/SKILL.md` 与 `runtime/stage/stage-handoff.mjs` 均**不在**本卡已登记写面，且后者与 CARD-04 的 `runtime/stage/` 改动相邻 → 推迟（§6）。本条只作为候选冻结，不实测。

### R13 自治续跑无人类边界

- **机制**：主会话在缺少用户回复时可以继续推进到下一 stage。
- **落点**：`docs/standard-workflow.md` 的 `### stage 结束` 段（`:94-99` 起）就地补一句。
- **逐字草案（插在 `docs/standard-workflow.md:97` 之后）**：

```markdown
阶段的推进确认只由真实用户回复产生：没有回复时停在当前 stage，记录 `awaiting_user` 的真实事实，
不自行进入下一 stage、不代签确认、不把等待写成完成。
```

- **受益与量级**：与 `CONSTITUTION.md:54-60`（F7 三处确认点）和 A9 同向；它保护的是返工成本（用户逐字诉求里的「总是返工」）。
- **自证生效**：会话日志里 stage 切换前的最后一条用户消息位置与确认记录（`quality/confirmations/<sha256>.json`）的对应关系。
- **写面**：`docs/standard-workflow.md` → 本卡内做（`:94` 起才是 `### stage 结束` 段，`:97` 不在 `decision-log.md:35`(3) 的 `:88-92` 禁改区内）。**F9.8 处置**：v1 此处引用的「§7 决策点」编号在 §7 里并不存在，v2 已把该交叉引用整句删除，不再指向任何决策点。。

### R14 make-decision 并行规则无载体（`workflows/make-decision/SKILL.md`（`## Execution model (M/S/B/P)` 表；原记 `:336-350`，现 `:342-362`） 表中 `P` 从未作 executor 值；口径句原记 `:334`、现 `:345` 权威悬空）

- **机制**：`workflows/make-decision/SKILL.md` 口径句（原记 `:334`，现 `:345`） 声称口径唯一来自 decision-log 的「Step×Executor 矩阵」，但该表里 `P` 从未出现，矩阵与表不对齐。
- **落点**：`workflows/make-decision/SKILL.md` 口径句（原记 `:334`，现 `:345`）与表头（原记 `:336-337`，现 `:347`）。
- **逐字草案（替换 `workflows/make-decision/SKILL.md` 口径句（原记 `:334`，现 `:345`） 原文）**：

```markdown
口径唯一来自 decision-log 的“Step×Executor 矩阵”和“上下文守恒规则”。executor 取值只有 M、S、B 三种；
矩阵里出现的其它记号不构成第四种执行者，表内不引入它们。
```

- **受益与量级**：一次性消除「悬空权威」造成的重复确认（本卡 make-decision 阶段的往返即该断面的实例）。
- **自证生效**：下一轮 make-decision 会话里因 executor 归属而产生的追问次数。
- **写面**：`workflows/make-decision/SKILL.md` 在 CARD-04 写面内（`+11` 行，位置 `@@ -205` 附近，未触碰 `:331-362`）→ 按 D §4 处置为**排队**（§6）。

---

## §1.x R1–R14 与本卡写面的对应汇总

| 根因 | 主要落点 | 本卡内做 | 需排队/推迟 |
| --- | --- | --- | --- |
| R1 | `AGENTS.md:15` 之后新增的那一条（条②，见 §1.0） | ✅ | build-code/build-plan SKILL 的引用行各自受写面约束 |
| R2 | `docs/standard-workflow.md:334-338` + `workflows/build-code/steps.json:15` | ✅ | — |
| R3 | `docs/standard-workflow.md:92` 后新增行（`:88-92` 一字不动） | ✅ | — |
| R4 | `docs/standard-workflow.md:92` 后 | ✅ | — |
| R5 | §4 + `workflows/build-code/SKILL.md:58` 后 | §4 本体 | SKILL 引用行排队（CARD-04 写面） |
| R6 | `AGENTS.md:14` | ✅ | — |
| R7 | `AGENTS.md:15` 之后新增的那一条（条②） | ✅ | — |
| R8 | `docs/standard-workflow.md:92` 后新增行 + `workflows/build-plan/SKILL.md:230-232` | ✅ | — |
| R9 | `docs/standard-workflow.md:292-293` 后 | ✅ | — |
| R10 | `AGENTS.md:15` 之后新增的那一条（条②） | ✅ | — |
| R11 | `docs/standard-workflow.md:92` 后新增行（**不占 `AGENTS.md` 三条预算**） | ✅ | — |
| R12 | `skills/stage-handoff/SKILL.md:46`、`runtime/stage/stage-handoff.mjs:20-21` | 只冻结候选 | 推迟 |
| R13 | `docs/standard-workflow.md:97` 后 | ✅ | — |
| R14 | `workflows/make-decision/SKILL.md` 口径句（原记 `:334`，现 `:345`） | 只冻结候选 | 排队（CARD-04 写面） |
## §1.E E-s0921b（card-02 verify-code 会话审计，776 行）并入：覆盖修正 + 4 条根因加强 + 2 条新增根因

> 本节是 `E-s0921b.md` 到货后的增量。原文要点与逐字数字见 `/tmp/wh-card03-design/NOTES-design-extract-3.md` §1。**本节所有秒数均为 E 的实测值**（E 内部口径：同一份日志内可比；跨会话只比量级）。另有一条必须与本节并读的口径（F-6，**样本只有 1 份**，讲的是 build-plan 会话、不是本节的 verify-code 会话）：凡「只统计命令耗时」的结论都**系统性低估**该阶段——命令耗时只占活跃墙钟的 14.1%，编排与模型思考不在其中，逐字口径见 §4.14。

### §1.E.0 四处必须修正的口径（先读）

1. **有实测的阶段是两个，不是五个**：`build-code` 与 `verify-code`。E 的 `--stage=` 取值穷举只有这两个；`phases/`、`phases/P`、`index.md`、`phases/index`、`spec-template` 在 items/calls/msg 三张表**全 0 命中**；`make-decision` 0 命令、`build-spec`/`build-prd` 0 命令（22 次命中全是读 `workflows/build-spec/SKILL.md` 源码与断言，WRITE=False ×38/38）。**此前 A 报告「verify-code 无独立实测数据」的结论作废**：E 给了 verify-code 35 条命令 / 1492.2s 的独立账。
2. **E 纠正的是归属，不是结论**：E 是 card-02 的 verify-code 会话（会话首动作即为载入 `handoff-build-code-1a409534.md`；活跃 goal 明写 verify-code；结束语「已完成 verify-code 核查并停在 close 前」），不是 build-code 会话。§1 中凡引用「build-code 的第二份日志」处，一律改为「build-code 重跑视角（出自 E）」。
3. **子代理成本不可测**：E 中 4/4 子代理 `fork_turns:"all"`，等待它们共 1843.9s，但 `usage.tsv` 的 `turn_id` 只有本会话 10 个 → **子代理 token 无法单独记账**。因此 R6/R7 的「自证生效」列必须改写（见 §1.E.5），本设计任何一处都不得声称子代理省了 token。
4. **命令耗时不是 build-plan 阶段的时间（F-6）**。card-05 build-plan 会话实测：578 条命令自身执行时间合计 **1684.4 s = 28.1 min**，只占 **6.20 h 墙钟的 7.6%**、占 **3.32 h 活跃墙钟的 14.1%**；活跃墙钟里 **157.7 min（75%）是 `exec` 之后的模型思考与流式**；**子代理编排类调用 230 次 = 50.3 min = 活跃墙钟的 24%**（wait_agent 83 / followup_task 63 / send_message 53 / list_agents 21 / spawn_agent 10），它们是 `function_call` 而**不是 `CommandExecution`，在命令总秒数里完全不可见**。⇒ 本节（以及全卡）凡「只统计命令耗时」处，都要写明这是**下界**；引用 build-plan 时间必须分开写「命令耗时」与「编排/思考」；**不得**与 build-code 会话的百分比做精算换算（只可比量级）。样本**只有 1 份**（`F-buildplan-sessions.md:558`），必须标注。逐字口径见 §4.14。

### §1.E.1 R1 加强：等待的三种烧法在 E 里各自有独立账

- **机制（加强后）**：等待不是一次等待，而是三层重复 —— ① 宿主等待接口被反复调用（E：`wait_agent` 62 条 1843.9s，其中 **10 条正好落在 60000–60003ms 的 60s 上限**上，即撞上限后立刻再等）；② `sleep N` 存活探测（E：`sleep 30` 31 条 **928.3s**）+ `write_stdin` 88 次；③ 一次长调用被切成多段（E：单条 `review` 1216.7s 与单条 build-code 359.5s 都在前台一次性阻塞，而其余 7 次改为 `setsid`/`nohup`/`trap '' TERM`/`tmux` 脱离式发起 —— 说明 agent 已经知道前台等不住，却只能靠绕过解决）。三类合计 **2772.2s = 13.1% 墙钟**。
- **落点**：`AGENTS.md` **条②**（本设计 R1 草案新增的等待纪律条，见 §1.0）就地把三层逐一点名；同一句的短引用进 `docs/standard-workflow.md:92` **之后**新增行（`:88-92` 是 `decision-log.md:35`(3) 的禁改区，本卡一字不动）。
- **逐字草案（在 §1 R1 的等待纪律条末尾追加，`AGENTS.md:15` 之后那一条内）**：

```
- 等待只等一次：同一个被等对象（子代理、后台任务、长命令）在一次等待返回前不再发起第二次等待；返回失败或超时先看它的输出与退出码，再决定是重发还是改路径。长任务不切开等——一次发起、一次等待到底，不用固定间隔的存活探测（`sleep N` + 轮询 + 重复投喂）把一次调用切成多段；需要并发时才走后台通道，用了后台通道就用事件/完成通知收结果，不用探测循环。
```

- **受益与量级**：E 实测 2772.2s = 13.1% 墙钟（其中 1843.9s 是等待接口本身、928.3s 是 `sleep` 探测、其余为投喂与编排开销）。真实等待时间不会消失，**消失的是重复探测与撞上限后立刻再等**；按「探测开销本身」估的量级 ≈ 900s 级（**推断**，不给精确比例）。
- **怎么自证生效（可观察，非校验）**：下一个同类会话的宿主日志里，数三个数——同一被等对象连续 `wait` 条数、`wait` 返回值恰为 60000–60003ms 的条数、`sleep N`（N≥10）命令条数。E 的基线分别是 62 / 10 / 31。这三个数直接来自既有日志，不需要任何新记录。
- **写面**：`AGENTS.md`（本卡内做）；`docs/standard-workflow.md:92` 后新增行（`:88-92` 属 card-03 `decision-log.md:35`(3) 的禁改区，本卡一字不动，只在其后新增行——§1 R4 已按此处理）。

### §1.E.2 R2 加强 + 与 R9 合并：E 把「整轮重跑」的钱算实了

- **机制（加强后）**：build-code 被启动 **17 次**，其中 **10 次是同步整轮重跑**（198.1 / 269.5 / 278.4 / 221.1 / 270.4 / 61.4 / 243.3 / 314.6 / 359.5 / 315.1s），合计 **2531.4s，均值 253s = 12.0% 墙钟**；另外 7 次靠 `setsid`/`nohup`/`trap '' TERM`（ord=4715）/`tmux new-session -d`（ord=4801）脱离前台 —— 这是「一次跑到一个可判定的终态」这一原子性要求与前台等待上限冲突后的绕过行为。与之配套的还有 39 个测试文件被调用 113 次（`tests/contract/spec-stage-artifact-closure.test.mjs` 11 次 / 244.5s，`tests/contract/acceptance-execution-tier.test.mjs` 10 次 / 628.8s，`tests/contract/stage-runtime-preflight.test.mjs` 5 次 / 659.9s）。
- **落点**：原 R2 落点（`docs/standard-workflow.md:334-338`）不变；本节的「重入不是重跑」句与 **R9 草案合并为同一段落**，落在 `docs/standard-workflow.md:293` 之后，不另起段落、不重复表述。
- **逐字草案（R2+R9 合并稿，替换 §1 中 R9 单独的草案）** —— **2026-09-29 复核更正：该合并稿已落地**，见 `docs/standard-workflow.md:334-338` 现文（`:336-337` 即「删掉跨 phase 的全量快照绑定…只有当该 phase 声明的写集变化时才需要重做对应部分」）。以下保留的是**设计期草案原文**，不是待办：

```
重入不是重跑：stage 重新进入时，材料未变且当前 task 事实已经完成的步骤不重新实现、不重新测试、不重新审查，从进度游标指到的 task 继续。判据是影响集而不是快照相等——只有材料的当前版本发生变化（spec.md 或该 phase 文件本身改动）以及被这次变化直接命中的 task 才重做；材料未变时不需要枚举全部 phase 文件、不需要重跑最终 aggregate。整轮跑到终态的原子性只适用于第一次进入与材料确实变化时；一次超时或一次脱离式的后台发起不等于终态。
```

- **受益与量级**：E 实测 2533.2s = 12.0% 墙钟（三类浪费中的第一项）。其中「重入即整轮」与「已完成的 phase 被重新跑」无法在日志里逐条分开，故**只给总量级，不拆分**。
- **怎么自证生效（可观察，非校验）**：同一 task 在下一个会话里 `run --action=execute --stage=build-code` 的发起次数（E 基线 17，其中同步 10）、以及 `--stage=build-code` 命令里出现 `setsid`/`nohup`/`trap`/`tmux` 的次数（E 基线 7）。两个数都可由既有命令行记录直接统计。
- **写面**：`docs/standard-workflow.md:293` 后新增行（本卡内做）。

### §1.E.3 R8 加强：审查去重给出的「具体机制」——给已有的「一次」补边界，不新增任何东西

- **机制（加强后）**：E 给出靶子的完整形状 —— `review --action=record` 在 verify-code 里发起 **15 次**，其中同步 9 次共 **1402.2s**，**6 条命令逐字完全相同、合计 1369.3s**，单条最长 **1216.7s**（ord=3517）；同一个 review 还经 tmux 异步通道在 ord=5656 / 5709 / 5753 **连续发了 3 次**。规则文本其实已经齐全（`skills/wh-review/contracts/verify-code.md:4`「本次只调用 `wh-review` 一次」；`:6`「审查完成后主 agent 只处理这一轮 findings……不重复调用 provider」；`:53-54`「不通过重复审查制造绿色」；`skills/wh-review/SKILL.md:102`「Retry only when the previous call returned no semantic advice and the concrete transport/material problem changed」；`workflows/verify-code/SKILL.md:135`「审查结束后不为得到空 findings 或补齐证据再次调用」），**缺的只有三处边界**：① 「一次」没有写明**含后台通道重发**；② `workflows/verify-code/SKILL.md:170`（固定流程第 1 条，章节 `:168` 起）没有把「唯一一次」写成动作级纪律；③ 1200s 级长调用没有并列写明「一次发起 + 一次阻塞收集」。三处都只在现有句内补足，不新增章节、不新增字段。
- **落点与逐字草案 1**（`skills/wh-review/contracts/verify-code.md:4` 就地扩写）：

```
本次只调用 `wh-review` 一次。这里的「一次」按 stage 内一次 provider 往返计：请求已经发出（含经后台通道发出）之后，不再用第二个通道、第二条命令或第二段等待重复发起同一请求；等待只做一次，并在结果或失败原样返回后结束。
```

- **落点与逐字草案 2**（`skills/wh-review/SKILL.md:102` 就地扩写，保持英文以匹配该文件语言）：

```
Retry only when the previous call returned no semantic advice and the concrete transport/material problem changed. A timeout, a cancellation, or a probe that saw no output is not by itself a changed transport problem: record that attempt as the stage's review outcome and continue with the findings you have, or with `unavailable`.
```

- **落点与逐字草案 3**（`workflows/verify-code/SKILL.md:143` 第 1 条尾部追加）：

```
本 stage 只发起一次；当它长于宿主前台等待上限时，用一次后台发起 + 一次阻塞收集，不把同一请求拆成多次发起或多次轮询探测。
```

- **为什么它不构成新门禁、也不引入输入哈希绑定**：三条都只是给**已经存在**的「一次」补边界，没有任何前置校验、没有任何阻断、没有对请求内容做哈希或生成新凭据；唯一可观察物是**既有的** attempt/result 记录（`workflows/build-code/steps.json:12` 已声明 `quality/reviews/results/` 与 `quality/reviews/attempts/<attempt_id>/attempt.json`），本设计不新增文件类型、不新增字段、不改变 `review` 命令的参数集。
- **受益与量级**：E 实测重复的 6 条 = **1369.3s**，同步 review 总计 1402.2s = 6.6% 墙钟。单条 1216.7s 的长调用若只等一次不重发，量级按「重复条数 × 单条耗时」估。
- **怎么自证生效（可观察，非校验）**：下个同类会话里数三个数——逐字相同的 `review --action=record` 命令条数（E 基线 6）、同一 review 的后台重发次数（E 基线 3）、单条 review 耗时是否仍出现 1200s 级。均由既有命令记录可直接统计。
- **写面**：`skills/wh-review/contracts/verify-code.md`、`skills/wh-review/SKILL.md`、`workflows/verify-code/SKILL.md`。三个文件均**不在** D §4 的 13 处 CARD-04 重叠清单内（本卡内做）；若父 agent 复核发现落入 CARD-04 写面，按 §6 的排队口径处理。

### §1.E.4 新增根因 R15：压缩压的是对话，不是材料 —— 所以每次重整都要重读

- **机制**：上下文压缩只把对话变短，材料的当前版本不在压缩产物里；新段位缺少材料的稳定锚点，只能从零重读基础文件。E 的形状：`tools/cli/stage-runtime.mjs` 跨段 0–4 被引用 103 次；`handoff-build-code-1a409534.md` 在 ord=18 读过一次，**第 3 次压缩（@3684）之后又在 ord=3711 重读**；`skills/verify-code/SKILL.md` 跨段 0/3/4 共读 4 次。四个压缩点后面紧邻的都是重读或重跑（@2273→ord=2284/2307 重跑；@3684→ord=3704/3711；@5042→ord=5050；@6223→ord=6259/6266 读完才敢跑 close）。
- **落点**：`docs/standard-workflow.md:92` 之后新增一句（与 §1 R4 的落点同一位置，作为同段落的第二句，不新起节）。
- **逐字草案（`docs/standard-workflow.md:92` 之后）**：

```
上下文重整时，摘要里要留下仍在用的材料清单：任务书、阶段 SKILL、运行时入口、当前 phase 文件各自给到 `路径:行号` 级稳定锚点与当前版本标识。重整后的新段位按这份清单取用，不重新全文读取清单里已有的材料；摘要记录的是已确认结论及其出处，不是材料原文的替代品。
```

- **受益与量级**：E 里 304 条只读命令合计仅 **33.6s** —— 重读本身不贵，贵在它**触发重跑**（四个压缩点后都出现重跑）。因此本条只给机制、**不给秒数**（推断）。
- **怎么自证生效（可观察，非校验）**：下一个会话里，对每个压缩点检查其后的 20 条命令内是否出现「同一路径的第二次读取」或「同一 stage 的重跑」。E 的 4 个压缩点全部命中该模式。
- **写面**：`docs/standard-workflow.md:92` 后新增行（本卡内做）；「清单进摘要」是写法纪律，不是新文件或新字段。

### §1.E.5 新增根因 R16 + 子代理口径修正

**R16 失败命令的成本（机制 / 落点 / 草案 / 自证）**
- **机制**：命令便宜、失败贵。E：失败 36/606 = 5.9%，却占 **19.0% 执行耗时**（1324.4s，平均每条失败 36.8s vs 全体 11.5s）；`npx` 失败 **20/53 = 37.7%**；最贵 5 条失败 297.3/222.3/199.4/193.6/101.3s，合计 1013.9s = **76.6% 失败耗时**。
- **落点（按 T-019=B 压回，见 §1.0）**：**不占 `AGENTS.md` 的三条预算**。它的「发现侧」——失败与「声明不实」的事实怎么被发现——已并入 **条③**（`AGENTS.md:23` 之后新增，逐字见 §1.0）；它的「实现侧」落在 `docs/standard-workflow.md:284`（`run-tests` 那条）就地追加半句。`:22` 之后**不再**插新条。
- **逐字草案（`docs/standard-workflow.md:284` 就地追加半句，原句逐字保留）**：

```markdown
6. `run-tests`：按实际范围跑 focused test，保存命令、退出码、oracle、快照和限制；一条命令失败后先读失败输出定位到具体断言、文件或前置条件，再决定下一步，同一命令不在原因未明前原样重发或扩大范围重跑。
```

- **怎么自证生效（可观察事实，非校验）**：下个会话里数「前一次 exit≠0、紧接着又逐字重发同一命令」的条数，以及 `npx` 失败条数（E 基线 20/53）。
- **受益与量级**：E 实测失败耗时 1324.4s = 19.0% 执行耗时；本条只削减其中的重复与扩大重跑部分，**不宣称削掉全部**，也不给降幅百分比（推断值，不作为验收指标）。
- **写面**：`docs/standard-workflow.md:284`（本卡内做；`:284` 既不在 `decision-log.md:35`(3) 的 `:88-92` 禁改区，也不在 CARD-04 写面）。

**子代理口径修正（并入 R6/R7 的「怎么自证生效」列，替换原来的 token 口径）**
- E 实测：4/4 子代理 `fork_turns:"all"`；等待这 4 个子代理 1843.9s；`SubAgentActivity` 54 项；但 `usage.tsv` 只含本会话 10 个 `turn_id` → **子代理的 token 无法单独记账**。
- 因此 R6/R7 的自证只能写这三个可观察量：① `fork_turns` 的取值分布（E 基线 4/4 全量继承）；② 每个子代理起步包（prompt + 继承上下文）的字符量；③ 子代理回传摘要的字节数与其中 `路径:行号` 条数。**明确不写「子代理 token 下降」**——那在现有日志口径下不可测。
- 连带影响 §6：**并行化与子代理拆分在本设计里只作纪律，不作为收益口径**（A 给的并发上限收益本来也只有 3–5%）。

### §1.E.6 E 的六条根因与本设计编号的对应（可追溯）

| E §4.3 的机制 | 本书编号 | 落点 |
| --- | --- | --- |
| 整轮原子重跑 | R2（加强）/ R9（合并） | `docs/standard-workflow.md:334-338` + `workflows/build-code/steps.json:15`、`:293` 后 |
| 长任务拆成 30s/60s 探测窗口 | R1（加强） | `AGENTS.md:15` 之后新增的那一条（条②，见 §1.0） |
| 压缩摘要是对话摘要、不是材料快照 | **R15（新增）** | `docs/standard-workflow.md:92` 后 |
| 子代理 fork 全量继承 | R6 / R7（自证口径修正） | 条①（`AGENTS.md:14`）与条②（`:15` 之后） |
| 进度状态只能去问 runtime | R5 / §4 | §4 全节、`workflows/build-code/SKILL.md:58` 后 |
| 读便宜、跑贵，而重读触发重跑 | R3 / R4 / R15 | `docs/standard-workflow.md:92` 后新增行（`:88-92` 一字不动） |
| 失败命令的成本 | **R16（新增）** | `docs/standard-workflow.md:284` 追加半句；发现侧并入条③ |

---
## §2 `spec.md` 节结构：让"整体目标 + 验收口径"在 spec 内可被一行引用

> 本节的落点是 `skills/spec-specify/templates/spec-template.md`（**274 行**，本轮逐行核对）。所有行号均为该文件内行号；契约测试行号引自 `/tmp/wh-card03-design/NOTES-design-extract.md` §2（B §4 逐字）。

### §2.0 现状（引 B §1）：该有的节都在，缺的是"可被引用的锚点"

现状节序列（逐字标题 → 起始行）：`:1` `# 功能规格：[填写：功能名]` → `:3-8` 两个 blockquote（叙事主干；可判定验收正文只在 `Appendix A`）→ `:10-12` 元信息 → `:14` `## 速读卡（30 秒）`（`:18` 一句话需求、`:19` 核心改动点、`:22` 最大影响面、`:23` 验收信号）→ `:25` `## 来源与决策映射` → `:36` `## 1. 需求解释：问题与紧迫性` → `:40` `## 2. 背景、目标与范围`（`:42` 背景、`:46` 目标、`:51` 范围内）→ `:57` `## 3. 用户场景与状态覆盖` → `:79` `## 4. 产品事实与假设（PFACT）` → `:96` `## 5. 功能需求` → `:112` `## 6. 模块划分` → `:123` `## 7. 关键实体` → `:132` `## 8. 数据和生命周期` → `:143` `## 9. 兼容性预留` → `:153` `## 10. 明确不做与默认必须成立`（`:155` 明确不做、`:161` 默认必须成立）→ `:165` `## 验收流程` → `:170` `## 测试标准` → `:175` `## 架构边界` → `:180` `## 实现设计（全局权威）`（`:186` Code Anchors、`:194` Interfaces and Failure Semantics、`:202` 全局文件边界与依赖、`:211` Requirement-to-Task Trace、`:227` Global Verification Strategy）→ `:237` `## Appendix A — 验收判据（唯一权威）` → `:247` `## 12. 风险、未决与交接` → `:264` `## 13. 业务影响与回归范围`。

**用户点名的五样东西其实都已存在**：整体目标 `:46-49`、非目标 `:155-159`（`:55` 与 `:159` 两处已声明"唯一权威非目标列表"）、架构方案 `:196`（`**选择的架构方案**`）、验收流程 `:165-168`、测试标准 `:170-173`。

**结构缺陷有三处（这才是 G-7 的成因）**：
1. `## 验收流程`(`:165-168`) 与 `## 测试标准`(`:170-173`) **各只有一句声明**，没有任何编号、行锚或分组名；phase 文件想引用也无从引用，于是只能回读整份 spec（B 实测：card-04 `spec.md` 149,322 B / 634 行，`Appendix A` 从 `:503` 起）。
2. `### Requirement-to-Task Trace`(`:211-225`) 的表已要求写 `Phase / task`(`:225`)，但没有任何一句要求它与 `phases/P<n>.md` 的 `### Tnnn — ` 标题对齐 → 规格与 Phase 文件之间**缺一条可核对的双向锚点**（B 的 G-1/G-6 同源）。
3. `:237` `## Appendix A` 与 `:247` `## 12.` 之间**缺 `## 11.` 编号**（外观问题）。

### §2.1 目标节序列（★ = 本设计改动；其余保持逐字不变）

| 行 | 节标题逐字 | 谁读 | 读它能回答什么 | 本设计改动 |
| --- | --- | --- | --- | --- |
| `:1-12` | 标题 + 两个 blockquote + 元信息 | 人类、analyzer | 这份规格从哪来、谁是权威 | 不动 |
| `:14` | `## 速读卡（30 秒）` | 人类、子代理的第一步 | 一句话需求 / 核心改动 / 最大影响面 / 验收信号 | ★ 仅在 `:23` 后追加一行 `- **整体目标锚**：见 §2 目标（\`:46\`）与非目标（\`:155\`）；subagent 读这两处即可，不必读全文` |
| `:25` | `## 来源与决策映射` | analyzer、build-plan | 每条 FR/AC 回得去哪个 D* | 不动 |
| `:36`/`:40` | `## 1. 需求解释…` / `## 2. 背景、目标与范围` | 子代理（**整体目标**） | 用户为什么要它、目标与非目标边界 | 不动（目标已在 `:46-49`） |
| `:57` | `## 3. 用户场景与状态覆盖` | build-plan、build-code | 谁在什么条件下看到什么 | 不动 |
| `:79` | `## 4. 产品事实与假设（PFACT）` | analyzer | 哪些是核实事实、哪些是推断 | 不动 |
| `:96` | `## 5. 功能需求` | 全部下游 | 行为清单与 FR→SCN→AC 链路 | 不动 |
| `:112`-`:153` | `## 6.`–`## 10.` | build-plan | 模块职责、实体、数据、兼容、不做项 | 不动 |
| `:165` | `## 验收流程` | build-code / verify-code / 子代理 | **怎么走完验收、每条 AC 归哪个 Phase/Task** | ★ 就地扩写为"验收口径索引表"（替换 `:165-168`） |
| `:170` | `## 测试标准` | build-plan、build-code | **每条 AC 用什么层级与 oracle、覆盖到什么程度** | ★ 就地扩写为"测试口径索引表"（替换 `:170-173`） |
| `:175` | `## 架构边界` | 集成责任方 | 产品边界与工程边界的真实消费者 | 不动 |
| `:180`-`:235` | `## 实现设计（全局权威）` 五小节 | build-plan（**架构方案**） | 现状差异、方案取舍、文件边界、追溯、验证策略 | ★ 只改 `:190` 读取顺序一行的格式要求；`:221` 后追加一句交叉锚点 |
| `:237` | `## Appendix A — 验收判据（唯一权威）` | 全部下游 | 判真的唯一权威 | 不动（`:240-243` 四行 `验证：/通过：/失败：/证据：` 一字不改） |
| `:247`/`:264` | `## 12.` / `## 13.` | 人类、verify-code | 风险、未决与回归范围 | 不动 |

**★ 逐字草案 1 —— 替换 `skills/spec-specify/templates/spec-template.md:165-168`（`## 验收流程` 全节）**：

```
## 验收流程

本节是验收口径的索引，不是判据正文；可判真假的正文只在 `Appendix A`，本节不复制通过或失败判据。

从场景入口依次定位 FR、`Appendix A` 的 AC、验证方法和可回读证据。每个 AC 在本节恰有一行，
行为切片在 `Appendix A` 指向同一 oracle、覆盖限制和预期证据类型。

| AC ID | 场景入口（SCN） | 验证方式 | 归属 Phase / Task | 证据位置（类型） |
| --- | --- | --- | --- | --- |
| `AC-DOMAIN-001` | `SCN-001` | [填写：人工步骤、测试层级或证据观察方式] | `P1 / T001` | [填写：预期 test / evidence / manual 类型与可回读位置；不填执行结果] |

Phase 文件引用本节的形式：内联上表中对应的**一行**，并写"详见 `spec.md` > 验收流程 > `AC-DOMAIN-001`"；
不复制 `通过：` / `失败：` 正文，不为取判据回读 `Appendix A` 全文。
```

**★ 逐字草案 2 —— 替换 `:170-173`（`## 测试标准` 全节）**：

```
## 测试标准

本节是测试口径的索引：每个行为切片在 `Appendix A` 指向同一 oracle、覆盖限制和预期证据类型；
全局验证策略在 `### Global Verification Strategy`，精确命令留给各 Phase。

| AC ID | 测试层级（tier） | oracle ID | 覆盖限制 | 归属 Phase / 测试技能 |
| --- | --- | --- | --- | --- |
| `AC-DOMAIN-001` | [填写：unit / contract / integration / e2e] | `[填写：oracle ID]` | [填写：该 oracle 不能证明的部分] | `P1` / [填写：具体 testing skill 或 `N/A — 理由`] |

同一行为切片的 RED 与 GREEN 必须用同一 oracle ID 与同一 `gate_cmd`；命令正文只写在所属 Phase 文件。
```

**★ 逐字草案 3 —— 替换 `:190`（`### Code Anchors` 的「读取顺序」行）**：

```
- **读取顺序**：实现者先查的最小路径与符号，再查的邻接 consumer；无需全仓扫描。格式：`先读 <路径>:<行号区间> 的 <符号>` → `再读 <邻接 consumer 路径>:<行号区间>` → `本节之外无需扫描`。
```

**★ 逐字草案 4 —— 在 `:221`（`### Requirement-to-Task Trace` 正文末）之后追加一句**：

```
Phase 列必须与 `phases/P<n>.md` 的 `### Tnnn — ` 标题逐字一致，这是规格与 Phase 文件之间唯一的交叉锚点；
`phases/P<n>.md` 的 `**Source / FR / AC**` 行必须能回到本表同一行。
```

**不补 `## 11.` 编号**：`:237` 的标题串 `## Appendix A` 被 `tests/contract/post-cohort-executable-authoring.test.mjs:10` 用作切分串，改标题有回红风险，收益为零（外观问题），故不改。

### §2.2 子代理只读 `spec.md` 能否知道整体目标与验收口径

- **整体目标：能**，且改前就能 —— `:14-23` 速读卡 + `:46-49` 目标 + `:155-163` 不做/默认成立，四处即可。★草案 1 在 `:23` 后补的那行把这四个位置写成明确指路，省掉"翻全文找目标"的动作。
- **验收口径：改前不能，改后能**。改前 `:165`/`:170` 只有声明句，子代理只能去读 `Appendix A`（B 实测 spec 149,322 B，`Appendix A` 从 `:503` 起）。改后子代理的读法是：`:14-23` 拿目标 → `## 验收流程` 表里拿**一行**（AC ID + 验证方式 + 归属 P/T）→ `## 测试标准` 表里拿**一行**（tier + oracle + 覆盖限制）→ 判据正文仍在 `Appendix A`，需要判真时才按 AC ID 定位。
- **G-7（每次回读 149KB spec）的解法是"内联引用行"，不是"内联判据正文"**：判据正文一旦复制进 phase 文件就成了第二份真相，与 `:7-8`「所有可判定验收正文只在 `Appendix A`」和 D 的 B12/B14（作者文件不得写执行状态、不得复制正文）冲突。因此 §3 里 phase 文件的验收字段只承载**引用行 + oracle ID + 证据类型**，不承载 `通过：`/`失败：` 文本。

### §2.3 与现有契约测试的兼容性（引 B §4 逐字行号）

| 断言 | 位置 | 本设计的影响 |
| --- | --- | --- |
| specSkill+specTemplate 须含 `叙事`/`Appendix A`/`需求`/`验收流程`/`测试标准`/`架构边界` 六 token | `tests/contract/spec-stage-artifact-closure.test.mjs:64-69` | 六个标题全部保留 → 不红 |
| spec-template 须含 `["需求解释","验收流程","测试标准","架构边界","实现设计","全局依赖","验证策略"]` | `tests/contract/post-cohort-spec-design-authority.test.mjs:11-14` | 保留 → 不红 |
| `实现设计（全局权威）`…`Appendix A` 切片须含 **4 个 H3**（`:12-15`）与 **8 个 token**（`:16-18`） | `tests/contract/post-cohort-executable-authoring.test.mjs:10-18` | 草案 3 只改该切片内一行文字、草案 4 追加一句 → 不红（**计数已改正**：v1 写「五个 H3 + 七个 token」，实为 4 + 8，见 §9-F9.6） |
| 禁 `**验证方法**`/`**通过条件**`/`**失败条件**`/`**证据类型**` 标签 | `tests/contract/post-cohort-spec-design-authority.test.mjs:27` | 草案 1/2 用表头 `验证方式`/`证据位置（类型）`，**不使用行首粗体标签** → 不红（编写时须守住） |
| 须含 `PFACT-001`、`AC-DOMAIN-001`、标签 `验证：`/`通过：`/`失败：`/`证据：` | 同文件 `:24-26` | `Appendix A` 一字不改 → 不红 |
| 六个 authoring 技能的 bundleHash 必须等于 catalog `local_bundle_hash` | `tests/contract/spec-stage-artifact-closure.test.mjs:111-119` | **spec-specify 在名单内** → 见下 |

**哈希链同批清单（改 `skills/spec-specify/templates/spec-template.md` 必须同批改，否则必红）**：
- `skills/spec-specify/skill-bundle.json:6`（`templates/spec-template.md` 的 `sha256: 56fc2078b38a927336361dbac2553421f034b3910dab46547e88171ce2bbf57c`）
- `skills/catalog.yaml:286`（`spec-specify.local_bundle_hash: bc09a6a95caf77a76618c3f659f02441998cc35c70a19da33d61797f53c8f25a`）；`:285` `local_version: 1.2.0`、`:287` `last_reviewed_at: '2026-09-22'`、`:288` `status: adapted`
- 校验口径：`runtime/adapters/local-skill-resolver.mjs:83-118`（`:109-111` 逐项重算 sha256；`:116` `bundleHash = sha256(canonical(files[].{path,sha256}).sort(byPath))`，**只对 `files[]` 内文件算哈希**）
- 参考实现（自动重算回写）：`tests/integration/mutation-guards.test.mjs:100-111`
- 版本/日期约束：`tests/skill-provenance-strict.test.mjs:17`（`/^\d+\.\d+\.\d+$/`）、`:22-23`（条目日期 ≥ catalog 顶层 `last_reviewed_at`）

### §2.4 本节的验证命令（只跑受影响的针对性测试，引 `AGENTS.md:21-22`）

```
node --test tests/contract/post-cohort-spec-design-authority.test.mjs
node --test tests/contract/post-cohort-executable-authoring.test.mjs
node --test tests/contract/post-cohort-authoring-files.test.mjs
node --test tests/skill-provenance-strict.test.mjs
```

（改 `skills/spec-specify/templates/spec-template.md` + 同批改 bundle/catalog 之后跑这四条；`tests/contract/spec-stage-artifact-closure.test.mjs` 另见 §3.6 的哈希批。）

---
## §3 `phases/P<n>.md` 节结构（重心）：让子代理只读这一个文件就知道"每个 phase 要什么、每个 task 做什么、做到什么算完"
> 本节经 V3-P1 修订：F-1 三条不成立（见 §3.10）；改动落在 phase 模板尾注 3 行、`skills/spec-plan/SKILL.md:14` 末 1 句、`workflows/build-plan/SKILL.md:198` 之后 3 行。补丁全文：`/tmp/wh-card03-design/V3-P1.md`。

> 落点文件：`skills/spec-plan/templates/phase-template.md`（**56 行**，本轮逐行核对；下文全部行号都是它的行号）。**2026-09-29 复核更正**：该模板经 `5202828a` 中文化重写后现为 **217 行 / 20694 B**，本行与 §3 全文中该模板的行号均属改写前的 56 行版本，行号复核见 §14.1 的「锚点复核更正」。契约测试行号引自 `/tmp/wh-card03-design/NOTES-design-extract.md` §2（B §4 逐字）。
> **总原则（v2 定稿，按 D-FIELD=A 收紧）**：模板里已有的 38 个字段**一个都不改名**（改名会打断 `tests/contract/post-cohort-executable-authoring.test.mjs:29-33` 的 12 个 `toContain` 与 `tests/contract/spec-stage-artifact-closure.test.mjs:73-77` 的 5 个正则）；本设计只做**两件事**——**在头部/L1 新增 4 个字段**、**在尾注补一句回报形状**。v1 另外主张的 7 个字段（`Phase goal` / `Delta vs other Phases` / `Global goal pointer` / `Execution waves` / `Critical path` / `Entry conditions` / Task 卡 `Goal`）与 1 处 `Action` 措辞收紧**全部删除**，逐条理由见 §3.2。✅ 全文只出现这 4 个新增字段名。

### §3.0 用户五问的落点（v2 定稿）

| 用户问的 | 落在哪 | 位置 | 细化 |
| --- | --- | --- | --- |
| (a) 每个 phase 的目标 | **不加新字段**：模板 `:8-10`（`## L0 — Outcome and delta` 段）`:`10` 的括号说明逐字已承载「可观察结果 + 与其它 Phase 有何不同 + 指向全局目标」三件事 | L0（不动） | §3.2 |
| (b) 每个 phase 的计划/步骤 | **不加新字段**：模板 `:19` `Task order` 的括号说明逐字含 `explicit earlier dependencies and serial/parallel reason` | L1（不动） | §3.2 |
| (c) 每个 task 的目标 | **不加新字段**：模板 `:26` 标题逐字 `[next globally unique Task ID and one observable result]` + `:28` `Source / FR / AC` | Task 卡（不动） | §3.2 |
| (d) 每个 task 的实现计划 | **不加字段、不改措辞**：`Action`(`:31`)/`Files / symbols`(`:30`)/`Outputs / failure`(`:32`) 逐字原样（契约钉死） | Task 卡（不动） | §3.2 |
| (e) 当前进度 | **本文件不写状态值**（`:52` + `skills/spec-plan/SKILL.md:14` 明文禁止）；本文件只放两样东西：① 头部新增 `Progress cursor` 指针（逐字 `facts.jsonl#build-code.phase_progress`，D 的 B11 明确允许这种"只声明指针、不复制状态值"的写法）；② 既有的 `Done`(`:23`/`:48`) 说明"做到什么算完"。**"做到哪了"由 §4 的一次读取回答** | 头部 + L1/Task |
| (f) 测试标准与验收流程 | 新增 `Acceptance inline`（每条 AC 一行引用：`AC-ID | oracle ID | 证据类型 | spec.md 锚`），与既有 `Test strategy`(`:20`)、`coverage limit`(`:21`) 及 Task 卡的 `Test tier / skill`(`:35`) / `Prewritten test`(`:37`) / `RED/GREEN gate_cmd`(`:39`) / `GREEN oracle`(`:43`) / `Coverage limit`(`:45`) 分工见 §3.5 | L1 |
| (g) 影响范围 / 读集 / 写集 | 写集已有 `Write set`(`:4`) + `NEW`(`:16`)/`MODIFY`(`:17`)；**读集新增 `Read set / first look`**（`path:line-range` + 符号，并写明"此清单之外无需扫描"）；`DO NOT TOUCH`(`:18`/`:33`) 不变 | 头部 + L1 |

### §3.1 Phase 头部与 L0：把"这个 phase 要什么"压到前 12 行

**新增 1（Phase 头部，插在 `:6` `Consumer` 之后作为第 7 行）**：

```
- **Progress cursor**: `facts.jsonl#build-code.phase_progress` (pointer only; never a status value in this file)
```

为什么：子代理读到这一行就知道"进度不在这里，去 §4 那一条命令取"，于是**不会**在 phase 文件里找进度、也不会自己造一份状态（G-3/G-4 的根因是"材料里零指针"，D 的 B11 允许的正是这个指针形态）。

**L0 不动**：v1 曾主张把 `:10` 的 L0 正文替换为 `Phase goal` / `Delta vs other Phases` / `Global goal pointer` 三段，v2 **删除该主张**（理由见 §3.2）；`:8-10` 的 L0 段（含 `:10` 的括号说明）**一字不改**。

**`Progress cursor` 不违反模板 `:52` 禁令的判定**：`:52` 逐字禁止的是 `put execution status in this authored file`。指针 ≠ 状态，三条理由：① 值只存在 `facts.jsonl` 的 build-code stage row 里，由 `runtime/task/task-store.mjs:241-253` 的 `validatePhaseProgress` 做**恰 4 键全等校验**（`phase_id` / `task_id` / `material_revision` / `recorded_at`），非 build-code 行写它直接抛错（`:334-337`）；② phase 文件里写的是**固定字面量** `facts.jsonl#build-code.phase_progress`，不含 P/T 编号、不含 freshness、不含时间戳；③ 它不声明完成、不锁工作（`workflows/build-code/SKILL.md:245-250` 逐字 `The cursor is navigation only: it does not certify completion or unlock work.`）。

### §3.2 为什么不加那 7 个字段（D-FIELD=A 的落点，逐条给依据）

v1 主张「在 L0/L1/头部新增 10 个字段 + 收紧 1 处措辞」。逐行核对 `skills/spec-plan/templates/phase-template.md`（**56 行**；**2026-09-29 复核更正**：该模板现为 **217 行**）后，其中 7 个新增字段与 1 处收紧**在模板里已经有同义承载**；再加就是第二份会漂移的清单（用户抱怨的正是这类漂移），因此**全部删除**：

| v1 主张的字段 | 为什么删（模板里已有的同义承载，逐字） |
| --- | --- |
| `Phase goal`（L0） | `:10` 的括号说明逐字 `[Observable outcome and how this Phase differs from other Phases. Point to the global goal; do not repeat its full narrative.]` —— 「可观察结果」「与其它 Phase 的不同」「指向全局目标」三件事都在这一句里，而 `:8` 的段标题本身就是 `## L0 — Outcome and delta` |
| `Delta vs other Phases`（L0） | 同一句里逐字 `how this Phase differs from other Phases` |
| `Global goal pointer`（L0） | 同一句里逐字 `Point to the global goal; do not repeat its full narrative`；`spec.md` 侧另有 `§2.1` 的速读卡指路行 |
| `Execution waves` + `Critical path`（L1） | `:19` `Task order` 的括号说明逐字 `[stable Task IDs … explicit earlier dependencies and serial/parallel reason]` —— 串并行与其理由已有承载；波次/关键路径是**同一事实的另一种排法**，不是新事实 |
| `Entry conditions`（L1） | `:5`（头部 `Dependency`）、`:19`（`explicit earlier dependencies`）、`:34`（Task 卡 `Dependency`）三处已承载「进入前必须为真」的指针；再加一个字段会把同一条事实写第三遍 |
| Task 卡 `Goal` | `:26` 标题逐字 `### Tnnn — [next globally unique Task ID and one observable result]` 已经要求「一句话可观察结果」；`:28` `Source / FR / AC` 承载来源与判据 |
| `Action` 措辞收紧（替换 `:31`） | `:31` 原文逐字 `[ordered edits or operations at each anchor, data and control flow, compatibility boundary; enough to identify the first edit without product inference]` —— 契约要的 `first edit` 字面量**现模板已满足**；v1 的替换草案是**重写同一行**，收益为零、回红风险非零 |

- **净效果**：模板从 56 行变成 60 行（头部 +1、L1 +3），只多这 4 个字段**；V3-P1 再在尾注后追加 1 空行 + 3 行字段层级约定（见 V3-P1 P1-3），模板最终 64 行**。（**⚠ 2026-09-28 §14.2 再在尾注段追加 6 行 ⇒ 模板最终为 **70 行**；本句原文保留不改（`§6.1.3` P1-7.4 的「已应用」记录依赖这段逐字），行数以 §14.2「模板行数」段为准。**）
- **§3.0 的 (a)(b)(c)(d) 四问因此由既有字段回答**，不靠新字段；这本来也是它们该在的位置。
- **不在本卡写面的剩余面**：合并责任 / 并发上限 / worktree 隔离三项（G-6 的剩余面）不在本卡写面，见 §6。

### §3.3 新增 4 个字段的命名与风格（含 `Carry-over from spec` 的例外说明）

- **现模板风格**：`- **Title Case 名词**： [括号说明]`。4 个新增字段里 `Progress cursor`、`Read set / first look`、`Acceptance inline` 三个符合该风格。
- **唯一例外**：`Carry-over from spec` 是**短句**而不是名词短语。**保留原名**，理由：它转述的是 spec 侧的 `N/A` / `deferred` / `non-goal` 三类项，"从哪来"是这条信息的一半，改成名词短语会丢掉它；且现模板本身已有两个风格例外 —— 全小写的 `coverage limit`(`:21`) 与 snake_case 的 `expected_exit`(`:40`)，因此「必须 Title Case」并不是模板的硬约束。
- **全文只此 4 处**：v2 任何地方都**不再**出现 `- **Goal**:` 这一条目（v1 的草案已删）。
- **不得改动的两处括号说明（改了必红）**：`tests/contract/post-cohort-authoring-files.test.mjs:17-19` 的三个 `toContain` 是**大小写敏感**的，而小写 `write set` / `dependency` **只**出现在模板 `:4` 的 `[write set: exact file paths; one owner per path]` 与 `:5` 的 `[dependency: preceding Phase IDs or \`none\`, with serial reason]` 两处括号说明里 ⇒ **这两行的括号说明本卡不得改动一个字**；新增字段只能插在这两行**之外**的行（本卡的插入点是 `:6` 之后、`:15` 之后、`:17` 之后、`:21` 之后，均不触碰 `:4`/`:5`）。

**尾注补一句（`:50-52` 段落后追加，不改原句）**：

```
A subagent handoff for one Task returns: the files it changed with exact paths, the commands it ran with exit codes, the evidence refs it produced, and one plain sentence on what it could not establish.
```

为什么：B 的 G-5 实测"子代理回报材料不足"（`/tmp/wh-card03-session-analysis/s0922a.md:241`）。这一句**落在** taskCard 切片内（切片 = `### Tnnn — ` 到 `## L2`，见 `tests/contract/post-cohort-executable-authoring.test.mjs:27`）；这里新增的字句会被 `:29-33` 的 12 条 `toContain` 看见，必须避开 `:36` 的负断言串 `one-line results`，但它定义回报形状，与 §1 的 R7（输出无闸门）同源；它不新增文件、不新增字段、不要求凭据。

### §3.4 验收与测试：`Acceptance inline` 怎么做才不破 G-7 又不破"唯一权威"

**新增 9（插在 `:21` `coverage limit` 之后）**：

```
- **Acceptance inline**: [one line per Phase AC: `AC-ID | oracle ID | evidence type | spec.md anchor`; reference the `Appendix A` row, never copy its `通过：`/`失败：` text]
```

为什么：B 的 G-7 实测 card-04 `spec.md` 149,322 B / 634 行、`Appendix A` 从 `:503` 起，每次都要回读；而 `:7-8` 又明文"所有可判定验收正文只在 `Appendix A`"。`Acceptance inline` 只承载**引用行**（AC ID + oracle + 证据类型 + spec 锚），判据正文仍在 Appendix A，于是：子代理做测试时不需要回读 spec 全文（拿 AC ID 定位即可），也不会在 phase 里造出第二份判据。它与既有字段的分工：`Test strategy`(`:20`)=跨 task 的风险维度与 seam；`coverage limit`(`:21`)=整个 phase 的证据上限；Task 卡 `Test tier / skill`(`:35`)/`Prewritten test`(`:37`)/`RED/GREEN gate_cmd`(`:39`)/`GREEN oracle`(`:43`)/`Coverage limit`(`:45`)=单 task 的执行面。用户点名的"验收流程"与"测试标准"因此各有对应：验收口径 → `Acceptance inline`（指向 §2.1 草案 1 的表），测试口径 → `Test strategy` + `Acceptance inline` 的 tier/oracle 两列（指向 §2.1 草案 2 的表）。

### §3.5 读集与影响范围（(g)）：一个字段解决 G-2 与 G-6

**新增 10（插在 `:17` `MODIFY` 之后）**：

```
- **Read set / first look**: [exact `path:line-range` + symbol to read first, then the adjacent consumer; state `nothing beyond this list` when it is complete]
```

为什么：写集已有三处（`Write set`(`:4`)、`NEW`(`:16`)、`MODIFY`(`:17`)），读集**一处都没有**，于是实现者只能全仓扫描（G-2：phase 文件无"只需看这几段"的收敛指引；G-6：phase 边界与代码模块边界不重合）。这个字段与 Task 卡 `Files / symbols`(`:30`) 的分工：前者是**phase 级读集**（改之前要看的入口），后者是 **task 级改动面**（要改的路径与符号）。`skills/spec-plan/SKILL.md:28` 已要求 execution dry-run 能回答"第一个要看的符号、第一处编辑"—— `Read set / first look` + 收紧后的 `Action` 正是这两个问题的落点。

**G-8（材料内部一致性无字段承载）新增 11（插在 `:15` `FR / AC` 之后）**：

```
- **Carry-over from spec**: [the `N/A` / `deferred` / `non-goal` items this Phase inherits, with the reason; write `none — reason` when empty]
```

为什么：B 的 G-8 实测 card-04 `spec.md:659-660` 把覆盖率/CI 记成 `N/A + reason`（**2026-09-29 复核更正行号**：原记 `:617-618`；实测 `:617` = `### 12.2 风险表`，与本条无关。本条实际在 `:659`「覆盖率路线」与 `:660`「CI 接线」两行，另见 `:330` DER-04、`:335` DER-09），而没有任何 phase 文件转述过这个 N/A，于是"规格说不适用、phase 说要做"这种矛盾没有字段承载。本字段只转述**指针 + 理由**，不复制正文。

### §3.6 逐字段清单表（模板 38 个既有字段 + **4 个新增**）

**Phase 头部（4 行 → 5 行）**

| 字段名逐字 | 归属 | 新增/保留 | 契约测试影响（本卡 worktree 实测） |
| --- | --- | --- | --- |
| `Global spec`(`:3`) | 头部 | 保留 | `tests/contract/post-cohort-authoring-files.test.mjs:16` 的 `/Global spec.*spec\.md/i` **无 `s` 标志**，必须单行匹配 → 不动则不红 |
| `Write set`(`:4`) | 头部 | 保留 | 同文件 `:17-19` 的 `toContain` **大小写敏感** → `:4` 括号说明不得改（§3.3） |
| `Dependency`(`:5`) | 头部 | 保留 | 同上 → `:5` 括号说明不得改（§3.3） |
| `Consumer`(`:6`) | 头部 | 保留 | 无 |
| **`Progress cursor`**（新，插在 `:6` 之后） | 头部 | **新增** | 无既有断言覆盖；头部与 L0 都落在 `tests/contract/post-cohort-executable-authoring.test.mjs:27` 的切片（起点 `### Tnnn — `）**之外** → 不红 |

**L0（`:8-10`）**：**不改**（v1 的 3 字段替换草案已删，理由见 §3.2）。

**L1（11 行 → 14 行）**

| 字段名逐字 | 归属 | 新增/保留 | 契约测试影响 |
| --- | --- | --- | --- |
| `Inputs and outputs`(`:14`) | L1 | 保留 | `tests/contract/spec-stage-artifact-closure.test.mjs:73-77` 的 5 个正则（`write set`/`DO NOT TOUCH`/`gate_cmd`/`oracle`/`STOP`）→ 不动则不红 |
| `FR / AC`(`:15`) | L1 | 保留 | 同上 |
| **`Carry-over from spec`**（新，插在 `:15` 之后） | L1 | **新增** | **距离型断言 2**：`tests/contract/phase-quality-handoff.test.mjs:109` = `expect(tasks).toMatch(/Do not copy its L0\/L1\/L2 body[\s\S]*execution status/);` —— 跨度两端在模板 `:50` 与 `:52`；新行插在 `:15` 之后、跨度之前，**不改变两端的相对顺序与内容** ⇒ **判定：不红** |
| `NEW`(`:16`) / `MODIFY`(`:17`) | L1 | 保留 | `tests/contract/post-cohort-executable-authoring.test.mjs:16-18` 的 8 个 token → 不红 |
| **`Read set / first look`**（新，插在 `:17` 之后） | L1 | **新增** | 无既有断言；**不得**写成 `one-line results`（`tests/contract/post-cohort-executable-authoring.test.mjs:36` 的负断言）→ 命名已避开 |
| `DO NOT TOUCH`(`:18`) | L1 | 保留 | `tests/contract/post-cohort-authoring-files.test.mjs:17-19`、`tests/contract/spec-stage-artifact-closure.test.mjs:74` → 不红 |
| `Task order`(`:19`) | L1 | 保留 | `tests/contract/post-cohort-executable-authoring.test.mjs:37-39`：`:37`/`:38` 的断言对象是 `author`（= `skills/spec-plan/SKILL.md`），**只有 `:39` 的断言对象是 `template`**（`next Phase continues the sequence`，命中现模板 `:51`）→ 不动则不红 |
| `Test strategy`(`:20`) | L1 | 保留 | 无 |
| `coverage limit`(`:21`) | L1 | 保留 | `tests/contract/post-cohort-authoring-files.test.mjs:17-19` 需含 `coverage limit` → 不红 |
| **`Acceptance inline`**（新，插在 `:21` 之后） | L1 | **新增** | 无既有断言；**不得**出现行首 `**证据类型**` 形态（`tests/contract/post-cohort-spec-design-authority.test.mjs:27` 的禁令针对 spec 模板，本卡同批口径一致，避免形态撞车） |
| `STOP`(`:22`) | L1 | 保留 | `tests/contract/spec-stage-artifact-closure.test.mjs:73-77` → 不红 |
| `Done`(`:23`) | L1 | 保留 | 无 |
| `Risk and rollback`(`:24`) | L1 | 保留 | 无 |

**Task 卡（21 行，一行不加）**：`:26` 标题、`:28`–`:48` 全部字段**逐字保留**；v1 的 `Goal` 新增与 `Action` 措辞收紧**已删除**（§3.2）。`tests/contract/post-cohort-executable-authoring.test.mjs:26` 的 `^### Tnnn — `、`:27` 切片、`:29-33` 的 12 个 `**Field**`、`:34` 的 `first edit`、`:35` 的 `same oracle ID`、`:73-75` 的 4 个 token 全部不受影响 ⇒ **不红**。

**L2（1 段）**：`:54`/`:56` 保留；`## L2` 是测试切片终点，其后内容不进切片。

**两处距离型断言（v1 自称「无断言覆盖」，实为漏项；本卡逐条给判定）**

| 断言（逐字） | 位置 | 对 4 个新增字段的判定 |
| --- | --- | --- |
| `expect(phaseTemplate).toMatch(/L0[\s\S]{0,120}(?:Goal\|目标)/i);` | `tests/contract/material-producer-consumer-roundtrip.test.mjs:17` | 要求 **L0 之后 120 字符窗口**内出现 `Goal` 或 `目标`。本卡**不动 L0**（§3.2 已删掉整个 L0 替换草案），4 个新增字段分别落在 `:6` 后（L0 **之前**）与 `:15`/`:17`/`:21` 后（L0 之后但远超 120 字符窗口，且窗口内的 `:10` 一字未动）⇒ **判定：不红** |
| `expect(tasks).toMatch(/Do not copy its L0\/L1\/L2 body[\s\S]*execution status/);` | `tests/contract/phase-quality-handoff.test.mjs:109` | 跨度起于 `:50`、止于 `:52`（逐字含 `body` 与 `execution status`）。`Carry-over from spec` 插在 `:15` 之后、跨度**之前** ⇒ 两端仍在、顺序未变 ⇒ **判定：不红**（§3.6 表内同条） |

**模板级不变式（改完之后必须仍然成立）**：`:26` 的 `/^### Tnnn — /m`、`:27` 的切片边界、`:50-52` 三句（逐字含 `Do not collapse multiple Tasks into one line, borrow another Phase's task body, or put execution status in this authored file.`）、以及字面雷区 `plan.md` / `tasks.md` / `one-line results` **一个都不能出现**（`tests/contract/post-cohort-authoring-files.test.mjs:20-21`、`tests/contract/post-cohort-executable-authoring.test.mjs:36`）。index 侧另五个禁词（`gate_cmd` / `expected_exit` / `oracle` / `evidence_path` / `execution status`）的对象是 `skills/spec-tasks/templates/index-template.md`（`tests/contract/post-cohort-authoring-files.test.mjs:31-33`），**不作用于 phase 模板**（`expected_exit`(`:40`) 因此可以合法存在）。

### §3.7 D §3 的两处待裁决与 G-1/G-2/G-6/G-9 的处置（v2 全部已在本节内定案，不再进 §7）

| 项 | 材料事实 | 本设计的处置 | 是否进 §7 |
| --- | --- | --- | --- |
| **phase status**（D §3 登记为待裁决） | 模板 `:52` 与 `skills/spec-plan/SKILL.md:14` 明文禁止把执行状态写进作者文件；`phases/index.md` 侧另有 `skills/spec-tasks/SKILL.md:8` 的 `not … a progress ledger` | 维持禁止；状态只来自 §4 的游标 + task facts；phase 文件只放 `Progress cursor` 指针（不违反 `:52` 的判定见 §3.1） | **否**（本卡已定案） |
| **index 加列**（D §3 登记为待裁决） | `skills/spec-tasks/templates/index-template.md:8` 六列表头；加一列会撞 `tests/contract/spec-stage-artifact-closure.test.mjs:87`、`tests/contract/post-cohort-authoring-files.test.mjs:31-33`、`tests/contract/phase-quality-handoff.test.mjs:108` 三处禁词（`gate_cmd`/`expected_exit`/`oracle`/`evidence_path`/`execution status`） | 不加列；index 保持纯指针六列 | **否**（本卡已定案） |
| **G-1** 缺"进入前必须为真"独立字段 | 13/13 退化为 `Dependency` 单指针 | **不加字段**：由 `:5`（头部）、`:19`（`explicit earlier dependencies`）、`:34`（Task 卡）三处既有承载（§3.2）｜**字段不加，G-1 的验收改由 §9.A 的演练记录承担（T-002=A：G-1 走演练而非实遇）** | 否 |
| **G-2** 缺"要改的入口"收敛指引 | phase 文件无"只需看这几段"字段 | 新增 L1 `Read set / first look`；v1 的 `Action` 措辞收紧**已删**（§3.2） | 否 |
| **G-6** phase 边界与代码模块边界不重合（无读集/owner/接口符号清单/波次） | 模板缺六类字段 | 读集 → `Read set / first look`；波次/关键路径**不再新增字段**（由 `:19` 承载）；owner → 既有 `Write set`(`:4`) 的 `one owner per path`；接口符号 → 既有 `Files / symbols`(`:30`) + `Observable seam`(`:38`) | 否（「合并责任/并发上限/worktree 隔离」三项**不在本卡写面**，见 §6） |
| **G-9** index write set 列膨胀（card-04 `index.md:18` P10 行 30 个路径、超 2000 字符被截断） | 六列表头 `write set` 的取值形态无规则 | **本卡不动**：改 index 取值形态会改变 index 读者看到的内容，而 index 模板与取值形态都不在本卡写面；登记为剩余面 | 否 |

### §3.8 改模板要同批改的文件清单（哈希链，引 B §4.3）

| 文件 | 行 | 要改什么 | 不改的后果 |
| --- | --- | --- | --- |
| `skills/spec-plan/templates/phase-template.md` | 全文（§3.1/§3.4/§3.5 的 **4 处新增** + 尾注 1 句） | 本节的草案 | — |
| `skills/spec-plan/skill-bundle.json` | `:10-11` | `templates/phase-template.md` 的新 `sha256`（现值 `b5a4b739bcf61274e63cc35249dfdde989f884a635a5910931769a203747f753`） | `tests/contract/spec-stage-artifact-closure.test.mjs:111-119` 重算 `bundleHash` 后与 catalog 不等 → 红 |
| `skills/catalog.yaml` | `:334-337` | `local_version`（现 1.3.0）、`local_bundle_hash`（现 `bb470db067aaed87d6a04829882f79af5a49a414dd07f8c456046c1311fbd2f4`）、`last_reviewed_at` | `tests/skill-provenance-strict.test.mjs:22-23` 要求条目日期 ≥ catalog 顶层 `last_reviewed_at` → 红 |
| 参考实现（不改，只照抄手法） | `tests/integration/mutation-guards.test.mjs:100-111` | 重算回写 bundle + 用正则替换 catalog 的 `local_bundle_hash` | — |

**改了 phase-template 会变红的哈希测试（本卡 worktree 逐条核对：成立 2 条、v1 的 3 条错配已删）**

| 测试 | 判定 | 依据 |
| --- | --- | --- |
| `tests/contract/spec-stage-artifact-closure.test.mjs:118` | **成立**：断言遍历的名单在 `:111-114`，**含 `spec-plan`** | 本卡 worktree 实测 |
| `tests/skill-provenance-strict.test.mjs:26` | **成立**：`:16` 遍历 catalog 全部技能 | 本卡 worktree 实测 |
| ~~`tests/contract/stage-skill-invocation-contract.test.mjs:74`~~ | **错配，已删**：`:67` 的循环逐字 `for (const name of ["wh-review", "architect-code-review"])`，不含 `spec-plan` | 本卡 worktree 实测 |
| ~~`tests/contract/stage-reflection-wiring.test.mjs:44`~~ | **错配，已删**：`:32` 只取 `entry.name === "stage-reflection"` | 本卡 worktree 实测 |
| ~~`tests/contract/stage-reflection-wiring.test.mjs:187`~~ | **错配，已删**：`bundleTargets`(`:151-156`) = spec-analyze / stage-handoff / stage-reflection / wh-review，不含 `spec-plan` | 本卡 worktree 实测 |

**v1 漏列的一条真正会抛错的路径（本卡登记）**：`tests/contract/stage-skill-invocation-contract.test.mjs:80-112` 是全仓**唯一**调用 `resolveStageSkillPackages` 的测试 → `runtime/stage/stage-skill-runtime.mjs:155` → `resolveSkillPackage` 逐文件 sha256 校验 → `runtime/adapters/local-skill-resolver.mjs:110` 抛 `bundle sha256 mismatch: templates/phase-template.md`。**哈希链全仓只有 2 处登记，没有第四处**：`skills/spec-plan/skill-bundle.json:11`（逐文件摘要 `sha256: b5a4b739bcf61274e63cc35249dfdde989f884a635a5910931769a203747f753`，`"path"` 在 `:10`）与 `skills/catalog.yaml:335`（`local_bundle_hash: bb470db067aaed87d6a04829882f79af5a49a414dd07f8c456046c1311fbd2f4`；条目 `:332 name: spec-plan`、`:334 local_version: 1.3.0`、`:336 last_reviewed_at: '2026-09-22'`、`:337 status: adapted`）。

**同一批还要看的第三件事**：`workflows/build-plan/SKILL.md:209-215` 逐字列出了 phase 文件字段清单 —— 新增字段后这里应当同步。但那个测试里藏着五条**定距正则**（`tests/contract/post-cohort-executable-authoring.test.mjs:65-69`，循环 `:64` 跑两遍，对象分别是 `workflows/build-plan/SKILL.md` 与 `skills/spec-plan/SKILL.md` 两个文件，**不是 phase 模板**）会因插入文字而改变首个匹配位置、可能超距。因此：**改 `:209-215` 必须与 `tests/contract/post-cohort-executable-authoring.test.mjs` 的一次针对性运行绑在同一批**（命令见 §3.9），并且只做「在既有清单末尾追加字段名」，不在 `:65-69` 涉及的两处之间插字（正则窗口 350/160/200/150/300/100 字符，见 §3.9 表）。

**V3-P1 补记（落点与哈希）**：本补丁另有一处落点 `workflows/build-plan/SKILL.md:198` 之后（材料根 3 行，见 V3-P1 P1-6），该文件**不在哈希链里**（`config/workflowhub.yaml:21-23` 只登记 `component_id`/`workflow`/`path`），无需回写任何摘要。但上面那张哈希表只登记了**模板**的摘要（`skills/spec-plan/skill-bundle.json:10-11`），而本补丁还改了 `skills/spec-plan/SKILL.md` —— 它自己的逐文件摘要在 `skills/spec-plan/skill-bundle.json:6-7`（现值 `ef5ed76ba8cfdb3585334f940dc7c28b1d4ae63636bad684ec120e59b024e459`），必须与 `:11` **同批回写**，v2 原文漏了它。`repo-skills.manifest.json:191-192`（`path` / `version: 1.3.0`）与 `skills/catalog.yaml:334`（`local_version: 1.3.0`）、`:336`（`last_reviewed_at: '2026-09-22'`）是否同批 bump，由设计者裁决（本补丁不动版本号）。

### §3.9 本节的验证命令（只跑受影响的针对性测试）

```
node --test tests/contract/post-cohort-executable-authoring.test.mjs
node --test tests/contract/post-cohort-authoring-files.test.mjs
node --test tests/contract/phase-quality-handoff.test.mjs
node --test tests/contract/material-producer-consumer-roundtrip.test.mjs
node --test tests/skill-provenance-strict.test.mjs
node --test tests/contract/stage-skill-invocation-contract.test.mjs
node --test tests/contract/stage-reflection-wiring.test.mjs
node --test tests/contract/spec-stage-artifact-closure.test.mjs
node --test tests/contract/ui-stage-integration.test.mjs
```

（`tests/contract/spec-stage-artifact-closure.test.mjs` 是哈希批的收口测试。**第 4 条是本卡新增的**：`tests/contract/material-producer-consumer-roundtrip.test.mjs:17` 是 v1 漏掉的**距离型断言**（L0 之后 120 字符窗口），必须与本批同跑。`AGENTS.md:21-22`：只跑受影响的针对性测试，禁止全量回归。）

**`tests/contract/material-producer-consumer-roundtrip.test.mjs:17` 的 120 字符窗口：本会话 python 实测**

对当时（`5202828a` 改写前）的 `skills/spec-plan/templates/phase-template.md`（实测 4874 字符 / 56 行；**2026-09-29 复核更正**：该模板现为 **20694 B / 217 行**，本段复算对应 56 行版本）复算：`L0` 首次出现在字符偏移 **323**（`## L0 — Outcome and delta`，第 8 行），其后首个 `Goal`/`目标`（大小写不敏感）在偏移 **433**（第 10 行 `Point to the global goal`）。⇒ 两点距离 = **110** 字符；`[\s\S]{0,120}` 量词实际消费 **108** 字符；整条正则的匹配跨度 = **114** 字符。窗口上限 **120** ⇒ 余量 **10**（按两点距离）/ **12**（按量词预算）/ **6**（按整段匹配跨度）。**结论：不得在 `## L0` 与首个 `Goal`/`目标` 这两点之间插入任何字符。**

插在这两点**之外**不受影响，因为正则取的是**首次**匹配，且两点同步平移不改变它们的相对距离：插在 `L0` 之前（如头部 `:6` 之后的 `Progress cursor`）与插在首个 `goal` 之后（如 `## L1` `:15` 之后的 `Carry-over from spec`、`:17` 之后的 `Read set / first look`、`:21` 之后的 `Acceptance inline`）**均不影响**该窗口。**对本卡的结论**：P1 补丁要求新增的 `Progress cursor` 与 `Carry-over from spec` 都不落在该窗口内；P1-3 追加的那 1 空行 + 3 行「字段层级取法」落在**尾注之后**（尾注在模板第 50–52 行，首个 `goal` 在第 10 行），同样不触碰该窗口——**它没有落在 `L0` 与 `goal` 之间**。

### §3.10 F-1 核实：phase 字段"不统一到机器解析不了"不成立

审计 `F-buildplan-sessions.md` §3.6(i) 的三条具体说法（`P4.md` 完全没有 FR/AC 字段、`P5.md` 没有 `Done:`、`P1` 用 `Source / FR / AC:`）**均不成立**：五个归档 phase 文件一律用 `- **FR / AC**:`（各 1 次，全在 `:20`）、`- **Source / FR / AC**:`（共 11 次 = 11 个 Task 卡）、`- **Done**:`（共 21 次，其中 P4 有 4 次、P5 有 5 次）。审计那张表**没有任何 `路径:行号`**，其证据基座是 FileChange 的 diff 片段而非文件内容，且 P4/P5 首次写入（`06:20:36`）时就已含这两类字段。

真实症状是另一件事：`- **Done**:` 在同一文件里分 3 层（头部 `:11`、`## L1` `:29`、Task 卡），裸 grep 抽出 21 行、判据不唯一；按 `## L1` 段切分后每文件恰 1 行。另有 6 个模板未定义的字段被五个文件**整齐复制**（`gate_cmd`/`oracle`/`evidence_path`/`Deletion proof`/头部 `STOP`/头部 `Done`），以及 7 个只出现 1 次的一次性标签。详见 `/tmp/wh-card03-design/V3-P1.md` 的 P1-1/P1-2。

---
## §4 进度的一次便宜读取（第二重心）

> 本节要回答的是用户那句"也更容易知道当前进度是什么，不要总是执行着就遗漏了进度"。**先说本节最重要的一句实话（红队 BL-2）**：本节描述的单行 `phase_progress` 游标机制**在基线 `ef920f1f` 上已经 100% 实现并随仓库发货**（证据表见 §4.0）——v1 用 148 行把它写成了"设计"，这是设计书最大的失真之处。因此本节的真实性质是**盘点 + 三处纯文本改动**，不是机制设计：**不新增任何命令、字段、文件、投影、账本、step 或 action**；本卡真正新增的只有两句措辞——`workflows/build-code/steps.json:5` 与 `workflows/build-plan/steps.json:10`（F-3，见 §4.8 C3）——以及把**已有**条文**引用**到入口步骤（§4.7）。

### §4.0 已实现清单（本卡 worktree HEAD 实测，每条 `路径:行号` 可复核）

| 机制 | 落点（逐字核对） |
| --- | --- |
| 4 键键集常量 | `runtime/task/task-store.mjs:228`（`BUILD_CODE_PROGRESS_ROW_KEYS = [...STAGE_ROW_KEYS, "phase_progress"]`；`STAGE_ROW_KEYS` 16 键在 `:221-227`，`TASK_RECORD_KINDS` 在 `:220`） |
| 严格键校验 | `runtime/task/task-store.mjs:236-239`（`exactKeys` 抛 `task record row is invalid: phase_progress key set must equal the frozen field table`） |
| 四键 + 三正则 + 时间可解析 | `runtime/task/task-store.mjs:241-253`（`exactKeys(value, ["phase_id","task_id","material_revision","recorded_at"], …)`；`/^P[1-9][0-9]*$/`(`:244`)、`/^T[0-9]{3,}$/`(`:245`)、`/^revision-[a-f0-9]{64}$/`(`:246`)、`Date.parse`(`:249`)） |
| 只允许出现在 build-code stage 行 | `runtime/task/task-store.mjs:334-337`（抛 `phase_progress is only supported on build-code stage rows`） |
| 旧游标跨行保留 | `runtime/task/task-store.mjs:432-436`（另 `:338` 键集分支、`:383` 校验、`:407` 另一处保留） |
| 写入函数 | `tools/cli/stage-runtime.mjs:1004-1061`（输入恰 2 键 `:1005-1007`；目标须在当前 index `:1014-1015`；`material_revision` 现算 + `recorded_at`=now `:1017-1022`；merge 写回 `:1026-1027`） |
| 写入守卫 | `tools/cli/stage-runtime.mjs:1871-1875`（抛 `phase_progress cursor writes require run --action=execute --stage=build-code with phase_progress as the only input`） |
| 读回 | `tools/cli/stage-runtime.mjs:1560-1569`（`derivePhaseProgressStatus`）+ 返回体键位 `:1576` |
| 契约测试 | `tests/contract/stage-progress-contract.test.mjs`（**211 行**；`:125`、`:171`、`:206`） |

**⇒ 用户第 3 问的机制不需要本卡设计。** 基线 `grep -c 'phase_progress' workflows/build-code/steps.json` = **0**，所以本卡要动的是"入口步骤有没有点这件事"，而不是"机制存不存在"。

### §4.1 因果未解：游标**不会**被自动写（如实写明）

写入是**条件性**的，全仓唯一守卫就是这一行：

```js
tools/cli/stage-runtime.mjs:1871  if (Object.hasOwn(suppliedInput, "phase_progress")) {
```

不传 `phase_progress` 时控制流直接走到 `tools/cli/stage-runtime.mjs:1904` 的 `runOfficialStage`，**完全不经过写入函数**；而写入函数的全仓唯一调用点就是 `tools/cli/stage-runtime.mjs:1875`。`runtime/stage/stage-runner.mjs:2976-2981` 只**读**游标、从不写。

⇒ 因果链是：**忘了写 ⇒ 游标不存在 ⇒ 退回 `workflows/build-code/SKILL.md:57-58` 的人工推导**。因此本卡的口径是「**降低遗漏概率 + 消除读侧成本**」，**不是**"消除遗漏"。两个写入者互不覆盖（游标写入是 merge，`tools/cli/stage-runtime.mjs:1026-1027`；正常 stage 行写入保留旧游标，`runtime/task/task-store.mjs:432-436`）——缺的只是"什么时候一定会发生一次写"。

实测旁证：仓库树内 `facts.jsonl` 命中 **0** 个；`/Users/Hugh/.workflowhub` 下只有 1 个（`KnowledgeDigest`），其中游标匹配 **0**。

### §4.2 也**没有**自动派生：(phase, task) 完成事件在机器上不存在

- `runtime/stage/completion-predicates.mjs:1005-1022` 的 `deriveStageProgress` 只判"材料在不在"（`:1018` `readiness_source: "current-material-presence"`），输出**不含任何 phase/task 序号**。
- `T0NN` 在全仓的唯一机器来源是 `runtime/stage/stage-content-contracts.mjs#validatePostPhaseContract`（原记 `:7029`，现 `:7189`）（解析 phase 卡标题），用途是给 `phaseProgressTargetExists` 做"目标是否存在"校验——**只校验合法性，不产生完成事件**。

⇒ **R5 解决不了，R9 只得到部分缓解**；缺的那一环是「**机器可观测的 (phase, task) 完成事件**」。本卡**不造**它：造它就需要新的 phase 完成度权威，违反 `AGENTS.md` 的进度边界（见 §4.11 的候选 4 行）。

### §4.3 载体为什么只能是这一个（逐字依据）

| 事实 | 逐字依据 |
| --- | --- |
| `facts.jsonl` 只允许两种行；stage 行 16 键，build-code 行 17 键 | `runtime/task/task-store.mjs:219-220`（`TASK_RECORD_KINDS = ["stage","close_action"]`）、`:221-228`（`STAGE_ROW_KEYS` / `BUILD_CODE_PROGRESS_ROW_KEYS = [...STAGE_ROW_KEYS, "phase_progress"]`） |
| `phase_progress` 恰好 4 键，多一键即抛 | `runtime/task/task-store.mjs:236-239`（`exactKeys` 抛 `task record row is invalid: phase_progress key set must equal the frozen field table`）、`:241-253`（`exactKeys(value, ["phase_id","task_id","material_revision","recorded_at"], "phase_progress")`） |
| 三个值的形状被正则钉死 | `runtime/task/task-store.mjs:245-252`：`/^P[1-9][0-9]*$/`、`/^T[0-9]{3,}$/`、`/^revision-[a-f0-9]{64}$/`、`recorded_at` 须可 `Date.parse` |
| 只允许出现在 build-code 的 stage 行 | `runtime/task/task-store.mjs:333-338`（否则抛 `phase_progress is only supported on build-code stage rows`） |
| 材料版本变化读 stale；代码快照变化**不**导致 stale | `AGENTS.md:58`（逐字见 `/tmp/wh-card03-design/NOTES-design-extract-3.md` §7.2） |
| 唯一进度例外就是这个单行当前游标，不另建 projection 或账本 | `AGENTS.md:59` |
| public runtime 只有七类命令，`phase-*` 只能私有 | `AGENTS.md:61` |
| phase 文件与 index 不得携带执行状态 | `skills/spec-plan/templates/phase-template.md:52`、`skills/spec-plan/SKILL.md:14`（phase 文件）；`skills/spec-tasks/SKILL.md:8`「This is a pure pointer index, not a task card, Phase procedure, progress ledger, or completion authority.」（index） |

### §4.4 谁写、什么时机（写侧条文**已经存在**，本卡只引用、不重写）

**写者**：主会话执行 build-code 时通过**既有**命令写入：

```
node tools/cli/stage-runtime.mjs run --action=execute --stage=build-code --project=workflowhub --task=<task_id> --input phase_progress:{"phase_id":"P2","task_id":"T007"}
```

- 输入键集必须**恰为** `["phase_id","task_id"]`（`tools/cli/stage-runtime.mjs:1005-1007` 抛 `phase_progress input must contain exactly phase_id and task_id`）。
- 目标必须存在于当前 index（`:1014-1015` 抛 `phase_progress target ${phase_id}/${task_id} is not in the current indexed Phase files`）。
- `material_revision` 由写入时的当前 post 材料现算（`:1017-1022`；材料集来自 `:986-1002` 的 `currentPostPhaseMaterialState`，**post-only**），`recorded_at` 取写入时刻。
- 该命令只在"stage=build-code 且 `phase_progress` 是唯一输入"时才被允许（`:1871-1875`）——**这条写入与其它 run 载荷互斥**，永远是一次独立的小写入，不会把执行结果混进游标。

**时机：条文已经在 `workflows/build-code/SKILL.md:245-250`，本卡不重写它。** v1 §4.6 曾主张"往 `:55-58` 追加三句、作为唯一新增的行为要求"，与现状矛盾（`:`245-250` 已有同义条文），**该主张已删除**（F4.4）。该段逐字：

```
… After recording each completed Task, update the one in-place resume cursor through the existing public `run --action=execute` input, for example `{"phase_progress":{"phase_id":"P5","task_id":"T011"}}`; point it at the next incomplete Task, or the last Task when the Phase is complete. The cursor is navigation only: it does not certify completion or unlock work. It is bound to the current material revision, not the changing code snapshot.
```

本卡对写侧只做**一件事**：把这条**已有**条文**引用**到入口步骤 —— `workflows/build-code/SKILL.md:251-265` 的第 1 条（`read-current-task-documents` 的执行说明，逐字以 `1. Read current cohort materials and the physical Phase authority, then select` 开头）里加一句指路，**不改写规则本身**；并把"写入游标"纳入 `workflows/build-code/steps.json:5` 的 `observable_result`（§4.7 + §5.1）。**两条都是纯文本，不新增 step / action / 命令 / 字段。**

**残留风险（必须如实写明）**：游标写入**仍然依赖 agent 执行条文**。守卫是条件性的（§4.1），没有"到期必写"的机制；因此本卡**不声称**"进度不会再遗漏"，只声称"读侧成本从 7 个文件 / ≈836 行降到 1 条命令 + 1 份 index，且遗漏概率下降"。candidate 4（让 stage-runner 自动推进）明确不做，理由见 §4.11。

### §4.5 谁读、用哪条命令读

**读者**：① build-code 主会话自己（重入时）；② 被派去做单个 task / 单个 phase 的子代理（由主会话把 `status` 的输出片段随 dispatch 一起给出，或让它自己跑同一条命令）；③ 用户/审阅者（想知道"现在到哪了"）。

**命令（public 七类之一 `status`，逐字）**：

```
node tools/cli/stage-runtime.mjs status --action=begin --stage=build-code --project=workflowhub --task=<task_id>
```

- 读侧实现：`tools/cli/stage-runtime.mjs:1560-1569`（取当前 build-code stage 行 → `derivePhaseProgressStatus({cursor, currentMaterialRevision: materialRevision})`）。
- 派生函数：`tools/cli/stage-runtime.mjs:946-960` —— `cursor === null` 返回 `null`；否则返回 `{freshness:"current"|"stale", cursor:{phase_id,task_id,material_revision,recorded_at}, (stale 时) reason:"material_revision_mismatch"}`。
- 返回体位置：`tools/cli/stage-runtime.mjs:1574-1604`（`...progression` 之后、只有 build-code 才有的 `phase_progress` 键）。
- 其它分支：非 build-code stage → `phase_progress: null`（`:1562-1563`）；`facts.jsonl` 不可读 → `{freshness:"unavailable", cursor:null, reason:"facts_jsonl_unreadable"}`（`:1564-1565`）。
- **私有实现（不是 public 命令）**：`derivePhaseProgressStatus`、`writeBuildCodePhaseProgressCursor`、`currentPostPhaseMaterialState`、`projectStageExecutionOutcome` 都是 `tools/cli/stage-runtime.mjs` 内部函数，`phase-*` 类名字不得成为公共流程节点（`AGENTS.md:61`）；本设计**不**把它们暴露成新命令。

### §4.6 "一次调用回答四问"：**现状回答不了**，本卡只承诺其中一档（F4.6）

| 问题 | 现状能不能答 | 从哪来 | 依据 |
| --- | --- | --- | --- |
| (i) 这个任务有几个 phase | **能**（与本条命令同一批读即可） | `phases/index.md` 的行数（一行一 phase，六列） | `skills/spec-tasks/templates/index-template.md:8` 表头、`:10` 示例行；index 本来就是 build-code 入口的必读件之一（`workflows/build-code/steps.json:5` 的 `entry_conditions` 含 `phases/index.md`） |
| (ii) 在做哪个 phase | **只有游标存在时能**；没有游标就是 `null` | `status` 返回体 `phase_progress.cursor.phase_id` | `tools/cli/stage-runtime.mjs:1574-1604` + `:946-960` |
| (iii) 这个 phase 做到第几个 task | **只有游标存在时能**；没有游标就是 `null` | `status` 返回体 `phase_progress.cursor.task_id` | 同上 |
| (iv) 上一个 task 的结论/证据在哪 | **能**（与游标无关，`status` 本来就返回） | 同一返回体的 `named_refs`（`deriveNamedStatusRefs({facts: taskFacts, activationCohort, materials})`，`:1585` 一带）与 `quality_fact_refs`（`observations.map(({fact}) => fact.ref).sort()`）；stage 级结论另见 `stage_reflection` / `status_matrix` | `tools/cli/stage-runtime.mjs:1574-1604` 键序 |

**如实说明（不许含糊）**：

1. **"一次调用回答四问"在现状下做不到**——(ii)(iii) 两问的答案**存不存在取决于游标存不存在**，而 §4.1 已说明游标不会被自动写。card-03 自己的 `facts.jsonl` 是 0 字节，因此今天跑那条 `status` 命令，(ii)(iii) 两问的答案就是 `phase_progress: null`。
2. 本卡**只承诺一档**：**读一次 `status --action=begin`（答 (iv)，以及"游标存在时"的 (ii)(iii)）+ 读 `phases/index.md` 的行数（答 (i)）**。这一档不需要改任何代码。
3. **不承诺改 `status` 返回体**（例如把 phase 总数、完成计数塞进去）：那需要动 `tools/cli/stage-runtime.mjs` 的返回体形状，而该文件**正是 CARD-04 已改完并落地的文件**（CARD-04 的 `diff --stat` 含 `tools/cli/stage-runtime.mjs | 7 +`，见 §6.2；该改动已随合并点 `97092b30` 进入本卡 worktree）。
4. 也**不把 phase 数塞进 4 键**：塞进去立刻违反 `runtime/task/task-store.mjs:241-253` 的全等校验。

### §4.7 怎么消除 C 查出的误导源（5 份 worktree 根文本）

C 的事实（`/tmp/wh-card03-design/NOTES-design-extract.md:135`）：card-03 worktree 根零参数可读 `progress.md`(35 行)、`task_plan.md`(49 行)、`findings.md`(53 行)、`HANDOFF-make-decision.md`(16036 B)、`HANDOFF-make-decision-card07.md`(5341 B)、`.planning/.active_plan`（内容 `2026-09-24-card-04-build-plan-qualification`），**全部属于别的任务**，而治理文本从未提到它们 → 无规则禁止阅读；同型前科：`c835bf43f42ebc0bbf2bd0ba74d8d79cd4c76ebe`（2026-09-05）删过一次，9 天后 `c33acd3b36d59ea37c97e3784706a8a57fd6f0b7`（2026-09-14）又提交进来。

**本设计的处置（三条，全部是"加指针"而不是"加规则"）**：

1. **不删、不改、不动它们**。历史已经证明删除不可持续（上面两个提交号），而"删除文件"本身也不是本项目规则体系里的动作。它们是别的任务的产物，删了就是改别的任务的状态。
2. **把唯一权威做成"一跳可达"**：`phases/P<n>.md` 头部新增 `Progress cursor`（§3.1 逐字草案，值逐字 `facts.jsonl#build-code.phase_progress`），并**在 `docs/adr/0034-subagent-dispatch-and-parallel-rules.md`（本卡新建的文件，12834 B。**2026-09-29 复核更正**：原记「未跟踪」并引 `git -C <card-03 worktree> status --porcelain` 实测 `?? docs/adr/0034-subagent-dispatch-and-parallel-rules.md` 为据，该断言不成立——该文件现已被 git 跟踪，首次提交 `8112a546`、末次 `2bca3411`）里增加一条**派发约定**：
   ```
   Progress a subagent may trust: the `phase_progress` cursor and `identity.material_revision` from a build-code `status --action=begin` call, plus the task facts it is pointed at. Zero-argument prose at the worktree root (progress notes, handoffs, active-plan markers) belongs to other tasks and is not progress for this one.
   ```
3. **让"读不到"有确定行为**：cursor 为 `null` 时 `status` 返回 `phase_progress: null`（`tools/cli/stage-runtime.mjs:946-947`）——这是明确信号，不是错误；此时按 `workflows/build-code/SKILL.md:55-58` 既有规则"从物理 Phase 文件与当前 task facts 推出下一个未完成 task"。机制上不存在"必须去读 5 份根文本才能开工"的情形，因此那 5 份文件从"默认读物"变成"与开工无关的他人材料"。

### §4.8 本卡对写侧与读侧要做的三处纯文本改动（合计 3 处，全部可逐字复核）

| # | 落点 | 改法 | 为什么不是"新机制" |
| --- | --- | --- | --- |
| **C1** | `workflows/build-code/SKILL.md:203-208`（`## Work loop` 第 1 条） | 在这一条的末尾**追加一句引用**，指向同文件 `:245-250` 已有的写入条文；**不改写规则本身、不复制它的句子** | 被引用的条文与本卡之前就存在且逐字相同（§4.4）；本卡只让入口步骤"看得见它" |
| **C2** | `workflows/build-code/steps.json:5`（step 1 `read-current-task-documents` 的 `observable_result`） | 在既有句子上**追加**"写入 `phase_progress` 游标"的判据（草案见 §5.1）；原有逐字内容一字不删 | 该文件 `grep -c phase_progress` = **0**，所以这是**措辞补充**；`runtime/schemas/steps.schema.json:26` 对 `observable_result` 只要求 `{type:string, minLength:1}`，纯文字改动不触发形状/哈希校验 |
| **C3** | `workflows/build-plan/steps.json:10`（step 6 `spec-plan` 的 `observable_result`） | 在既有句子上**追加**一句「Phase 文件何时算写完」的判据（逐字见 V3-P2 P2-3）；原有逐字内容一字不删 | `runtime/schemas/steps.schema.json:26` 只要求 `{ "type": "string", "minLength": 1 }`；该字段**无任何测试依赖**（读 `build-plan/steps.json` 的 5 个测试全是 slug 级或别的 step）——纯追加，**1 行** |

**v1 在此处主张的三句追加（`Record that cursor when you select the next Task: …` / `Progress for this task comes from that cursor plus the task facts it points at. …`）以及"+零参数根目录文本不是进度源"那句，全部删除**：它们要么与 `:`245-250` 重复，要么把"根文本不是进度源"这一条**本该只出现在 ADR 派发约定里的规则**写成了第二份副本。本卡对"根目录文本"的完整处置只有 §4.7 的三条加指针动作。

### §4.9 边界情形（既定行为，不新增处理）

| 情形 | 现状行为 | 依据 |
| --- | --- | --- |
| 还没有任何游标（75 个 task 中 74 个如此；card-03 `facts.jsonl` 0 字节） | `status` 返回 `phase_progress: null`；按物理 Phase 文件推下一个未完成 task | `tools/cli/stage-runtime.mjs:946-947`、`workflows/build-code/SKILL.md:55-58` |
| 材料版本变了 | `freshness:"stale"` + `reason:"material_revision_mismatch"`；退回物理 Phase 文件推导 | `tools/cli/stage-runtime.mjs:948-958`、`AGENTS.md:58` |
| 代码快照变了但材料没变 | 仍然 `current`（不 stale） | `AGENTS.md:58` |
| `facts.jsonl` 读不了 | `{freshness:"unavailable", cursor:null, reason:"facts_jsonl_unreadable"}` | `tools/cli/stage-runtime.mjs:1564-1565` |
| 只有游标没有 stage 结果 | `execution_outcome.status = "unavailable"`、`diagnostic.code = "phase_progress_cursor_only"`、`blocking: false` —— 游标**不会**冒充完成 | `tools/cli/stage-runtime.mjs:962-984` |
| pre cohort | `phase_progress: null` | `tools/cli/stage-runtime.mjs:1562-1563` |

### §4.10 我否决的进度方案（以及为什么）

| 被否决的方案 | 为什么 |
| --- | --- |
| **候选 4：让 stage-runner 自动推进 / 自动写游标**（用户第 3 问的最强解，本卡**明确不做**） | 在 `runtime/stage/stage-runner.mjs` 里自动推进需要一个新的 **phase 完成度权威**（谁判定"这一格做完了"），那会引入控制面：违反 `AGENTS.md` 的边界（"质量/进度事实不是许可证、不新增 gate 或第二进度权威"）+ `skills/spec-plan/SKILL.md:14`（作者文件不写执行状态）。因此本卡退到 §4.8 的两处纯文本改动，并**如实登记**残留风险（§4.4） |
| 新增第 8 类命令（如 `phase-status` / `phase-progress`） | `AGENTS.md:61`：public runtime 只有七类命令，`phase-*` 只能是私有实现 |
| 在 `phases/index.md` 加 status 列 | `skills/spec-tasks/SKILL.md:8`（index 不是 progress ledger）+ 三处禁词断言（见 §3.7 的 index 加列行）；D 的第 3 条硬约束 |
| 在 `phases/P<n>.md` 写 `## Progress` / 状态表 | `skills/spec-plan/templates/phase-template.md:52`、`skills/spec-plan/SKILL.md:14` 明文禁止；D 的第 4 条；**F-2 的实测变体更糟**：agent 没有写进 phase 文件，而是另建 `research/build-plan-step-audit.md`（13 步自评表，8 种取值里 5 种是自造复合串），并把它发布成 `quality/evidence/build-plan-step-audit/8f82c98a063db8cd07d0ac86fa759413993d771f8c7b95963194b8f7de4f32b5.json`。三条既有禁令**各只禁一个具体文件**，没有一条禁「另建新载体」——这正是 §4.13 与 §7-6 要补的缺口。 |
| 新 `progress.json` / projection / 账本 / 每 task 一行历史 | `AGENTS.md:58-59`（不另建 projection 或账本；不保存历史序列）；`runtime/task/task-store.mjs:219-220` 行类型只有两种 |
| 把 4 键扩成 5 键（如加 `step` 或 `percent`） | `runtime/task/task-store.mjs:236-239` 全等校验立刻抛错；且百分比违反"不保存历史序列" |
| 用 review/test 事实当进度 | `AGENTS.md:60`：事实不是许可证；且 review 是每 phase 一次（`workflows/build-code/steps.json:12`），粒度不匹配 |
| 用 git 提交时间/文件 mtime/哈希推断进度 | 无权威（材料变化才 stale，`AGENTS.md:58`），且引入哈希绑定属 D 的已否决做法 |
| 把进度放进 handoff 文档或 spec/phase 正文 | `workflows/build-plan/SKILL.md:143`（Phase 正文与索引不充当进度账）+ `AGENTS.md:44`（外置目录只放执行文件） |
| 删掉 worktree 根那 5 份误导文本 | 属别的任务；历史两次提交证明删除不可持续（`c835bf43…` → `c33acd3b…`）；§4.5 改为加指针 |
| 让 `status` 顺带返回 phase 总数 | 需要改 `status` 返回体形状（`:1574-1604`），属新增控制面；且 index 行数本来一跳可得 |
| successor/lineage/reopen/rebind/continuation/checkpoint permit 任何变体 | `AGENTS.md:59` 逐条禁止 |

### §4.11 成本对比（改前 vs 改后）

| 维度 | 改前 | 改后 | 出处 |
| --- | --- | --- | --- |
| 想知道"到哪了"要读 | 7 个文件 / ≈836 行 / ≈185 KB，且四问答不出 | 1 条 `status` 调用（返回体内含 3 问）+ `phases/index.md`（N 行，答 (i)）+ 当前 `phases/P<n>.md` 1 份（答"要做什么"） | `/tmp/wh-card03-design/NOTES-design-extract.md:134` |
| 齐全场景（card-05） | ≥9 个文件；post 材料 4,018 行 / 659,805 B，`quality/` 另 5,139 个文件；handoff 自身又要求读 8 个材料文件（约 600 KB） | 同上三件 | `/tmp/wh-card03-design/NOTES-design-extract.md:134` |
| 命令条数 | 0（全靠读文件；E 实测 `begin` 18 条、其中同一 `status --action=begin --stage=build-code` 逐字 7 次） | 1 条 public 命令 | `/tmp/wh-card03-design/NOTES-design-extract-3.md` §1（E 实测） |
| 子代理侧 | 无指针，必须自己在根目录猜（C 的 5 份误导源） | 派发时带 `phase_progress` + `identity.material_revision`（§4.5 草案 2） | 同上 |

### §4.12 本节的验证命令（只跑受影响的针对性测试）

```
node --test tests/contract/stage-progress-contract.test.mjs
node --test tests/contract/post-quality-fact-scope.test.mjs
node --test tests/contract/post-phase-contract.test.mjs
```

- **`tests/contract/stage-progress-contract.test.mjs`（211 行）是本卡 worktree 实测存在**的唯一 `phase_progress` 契约测试；`phase_progress` 相关断言的落点是它的 `:125`、`:171`、`:206-209`。
- **`tests/contract/post-quality-fact-scope.test.mjs`（135 行）实测存在**，本卡 worktree 复核过。
- v1 写的三条命令里，**`tests/contract/build-code-resume-cursor.test.mjs` 与 `tests/unit/phase-progress-cursor.test.mjs` 在本卡 worktree 上不存在**（F9.1），已改为上面第 1 条；`tests/contract/post-phase-contract.test.mjs` 是否仍存在须在本批实施前用 `ls tests/contract | grep -i phase` 自查（**未核项**，本设计不把它写成"已存在"）。
- `AGENTS.md:21-22`：只跑受影响的针对性测试，**禁止全量回归**。

### §4.13 禁止自造进度载体：逐字禁令与唯一允许的写法（F-2）

现有三条禁令（`skills/spec-plan/templates/phase-template.md:52`、`skills/spec-plan/SKILL.md:14`、`skills/spec-tasks/SKILL.md:8`）**各自只禁一个具体文件**（phase 文件、index），**没有一条禁「另建一个新载体」**——F-2 的行为正好落在这个缺口里：它没往 `phases/P<n>.md` 里写状态表，它**另建了** `research/build-plan-step-audit.md`（13 步自评表，8 种取值里 5 种是自造复合串），并**把它发布成了 quality evidence**（`quality/evidence/build-plan-step-audit/8f82c98a063db8cd07d0ac86fa759413993d771f8c7b95963194b8f7de4f32b5.json`）；证据即 §4.10「在 `phases/P<n>.md` 写 `## Progress` / 状态表」那一行现在补上的 F-2 实测变体。

⇒ build-plan 阶段「现在到哪一步」在现有机制里不存在合法载体。这不是疏漏，是 AGENTS.md:72 与 runtime/task/task-store.mjs:336 的直接推论：唯一合法的进度载体 phase_progress 被逐字锁在 build-code 的 stage 行上。

逐字条文（**原文照抄**，作为 `workflows/build-plan/SKILL.md:148` 之后新增的内容）：

```
Do not create a progress file, table, evidence record, or any other new persistent object to record where this stage is. `spec.md`, `phases/P<n>.md`, and `phases/index.md` describe intent and carry no execution status; `phases/index.md` is a pure pointer index; the only legal progress cursor is the single `phase_progress` field on the existing build-code stage row, and this stage has no equivalent. When asked where build-plan stands, name the step in `workflows/build-plan/steps.json` and cite existing task facts or quality facts by ref, or use one of the existing bare layer values (`completed`, `unavailable`, `incomplete`, `partial`) with no qualifier; never join a status word to a limit word to form a new compound status. This is a wording constraint, not a gate: it adds no check, blocks no work, and grants no permission; a wrong status word is fixed in place like any other wording defect.
```

落点与交叉引用：新增文字落在 `workflows/build-plan/SKILL.md:148` 之后（**不插 `:143` 之后**）；与 §1 对该文件的两处引用（`:77-90`、`:230-245`）属**同一批写入**，须一次性验证 `tests/contract/post-cohort-executable-authoring.test.mjs`。

这不是门禁：没有校验、没有新命令、没有新字段，读不到它也不会阻断任何推进，只是没人照做时文件形状会退回今天的状态。

### §4.14 口径修正：命令耗时不是这个阶段的全部时间（F-6）

本节（以及本卡任何一节）凡引用 build-plan 阶段的耗时，必须遵守下面四条。依据：card-05 build-plan 会话实测（`F-buildplan-sessions.md` §2.3 `:88-89`、§2.4 `:127-160`）。

1. **凡「只统计命令耗时」的地方，必须同时指出它系统性低估 build-plan。** 该会话 578 条命令的**自身执行时间合计 1684.4 s = 28.1 min**，只占 **6.20 h 墙钟的 7.6%**、占 **3.32 h 活跃墙钟的 14.1%**（`:88-89`）。活跃墙钟 210.4 min 里，**157.7 min（75%）是 `exec` 之后的模型思考与流式**（`:127-144`；`:143` 逐字「即：**时间的主体不是命令执行，而是模型读完之后想**」）。⇒ 任何「命令总秒数」都是这个阶段耗时的**下界**，不是画像。
2. **子代理编排不是 `CommandExecution`，在命令总秒数里完全不可见。** `:148-149` 逐字「关键方法学提醒：**subagent 协调类调用不是 `CommandExecution`**，因此它们的耗时完全不在上面 1684.4 s 里，只能从 item 时间差里读出来。」编排类调用合计 **230 次 = 50.3 min = 活跃墙钟的 24%**（`:159-160`；wait_agent 83、followup_task 63、send_message 53、list_agents 21、spawn_agent 10）。⇒ 引用 build-plan 时间**必须**分开写「命令耗时」与「编排/思考」，不得合成一个数。
3. **不得与 build-code 会话的百分比做精算换算，只可比量级。** `:163-167` 就是「只比量级」的写法。跨会话归因口径不同：`:516-546` 第①②条明说 157.7 min 是**上界**（模型思考与流式/工具延迟不可分离），墙钟归因是**就近归因**、不是真并行分解。⇒ 不许把 14.1% / 24% / 75% 与 build-code 的百分比相乘相除来推算别的会话。
4. **样本只有 1 份，必须标注。** 全卡凡引用上述比例，都要写明样本：**1 份** card-05 build-plan 会话（`F:558`：25.2 MB / 6966 条记录，其中 build-plan 40 次、make-decision 3 次 = 93% build-plan）。不得表述成「build-plan 阶段的一般规律」。

**本卡不承诺的**：不新增计量、不新增日志字段、不改 `status` 返回体——与 §4.6（`:842-845`）同一理由，`tools/cli/stage-runtime.mjs` 是 CARD-04 在改的文件。

### §4.15 build-plan 阶段越界的实测登记与边界声明（F-5，只登记不设门禁）

**事实登记**（逐字数字全部来自 `F-buildplan-sessions.md:480-491`）：产品源码写入 **28 次**（`runtime/stage/stage-runner.mjs` 14 / `runtime/stage/stage-content-contracts.mjs` 6 / `runtime/stage/stage-handlers.mjs` 2 / `tools/cli/stage-runtime.mjs` 3 / `runtime/evidence/quality-fact.mjs` 3）；新建 `docs/adr/0032-review-chain-delegation-and-layer-contract.md`；阶段内先加 1 个测试、后删 4 个 `post-build-plan-*.test.mjs`（11:56:45）；最终自评 `status=completed` 而 `quality_status=incomplete`。对照 `:490` 逐字：「按 `AGENTS.md`，build-plan 只写三样材料。**本阶段把「定计划」做成了「改运行时 + 立 ADR」。**」

**边界声明**（**原文照抄**，说明它落在 `workflows/build-plan/SKILL.md:148` 之后）：

```
This stage writes `spec.md`, `phases/P<n>.md`, and `phases/index.md`. It does not write production code, runtime files, tooling, or ADRs, and it neither adds nor deletes tests. Recorded observation, card-05 build-plan session audit (F-buildplan-sessions.md §4.5): during this stage the session wrote product source 28 times (`runtime/stage/stage-runner.mjs` 14, `runtime/stage/stage-content-contracts.mjs` 6, `runtime/stage/stage-handlers.mjs` 2, `tools/cli/stage-runtime.mjs` 3, `runtime/evidence/quality-fact.mjs` 3), created `docs/adr/0032-review-chain-delegation-and-layer-contract.md`, added one test and then deleted four `post-build-plan-*.test.mjs`, and still reported `status=completed` with `quality_status=incomplete`. This is a boundary statement with a recorded observation, not a gate: no check enforces it, it blocks nothing, and it grants nothing.
```

本卡据此不设门禁、不加校验、不阻断 build-plan 推进；这是一条实测事实与一句边界声明，不是一个 check。

`§7-6`（F-2 决策点）与本节是同一处缺口的两面（F-2 是「进度被自造」，F-5 是「写面被越界」），两条的推荐都是「只写明文、不加机制」，但**都不替用户决定**。

---
## §5 `workflows/build-code/steps.json` 本卡内怎么改

> 文件共 21 行（本轮逐行核对，见 `/tmp/wh-card03-design/NOTES-design-extract-2.md` §3/§4 的逐字引用）。**本卡内可改**（用户已批准；CARD-04 worktree 实测 `git -C <card-04> status --porcelain` 未列该文件 → 不同写面）。**不新增 step、不改 order、不改 step_slug**，只改两处 `observable_result` 文字。

### §5.1 改动 1：`:5`（step 1 `read-current-task-documents`）——读取范围收窄 + 记录游标

**现状逐字（`workflows/build-code/steps.json:5`）**：

```
"observable_result": "Post reads spec.md, phases/index.md and every referenced physical phases/P<n>.md before selecting the next Phase task from current facts; pre/history retain plan.md and tasks.md through the cohort-specific reader."
```

**替换为**：

```
"observable_result": "Post reads spec.md, phases/index.md and the current physical phases/P<n>.md named by the build-code phase_progress cursor before selecting the next Phase task from current facts, and reads every referenced physical phases/P<n>.md only when that cursor is absent or stale; when it selects the next Phase task it records that selection as the cursor through the existing build-code execute call with phase_progress as its only input; pre/history retain plan.md and tasks.md through the cohort-specific reader."
```

**为什么**：
- 对应 A 的成本账：现在每次进入 build-code 都要把 **每一个** phase 文件读完（card-05 场景 post 材料 4,018 行 / 659,805 B，`/tmp/wh-card03-design/NOTES-design-extract.md:134`），而`status` 返回体里已经有"现在在哪个 phase/task"（`tools/cli/stage-runtime.mjs:1574-1604`）——读取范围本可以由游标收敛。
- 对应 §4 的写入时机：把"选定下一个 task 时写一次游标"钉在**同一个 step** 里（选定与记录是同一个动作），不需要新 step。
- 对应 B 的缺口：step 1 是唯一声明"入口读什么"的地方，读集不写在这里，子代理就只能靠猜。
- **不构成门禁**：游标 absent/stale 时的行为与今天完全一致（读全部 phase 文件、从物理文件推导，`workflows/build-code/SKILL.md:55-58`），所以不存在"因为游标所以跳过必读材料"的阻断面。

### §5.2 改动 2：`:12`（step 8 `review-change`）——审查去重

**现状逐字（末句）**：

```
The phase_review fact remains visible; unavailable limits quality claims and permits same-task repair.
```

**在该句之后追加一句（其余逐字保留）**：

```
 When the current facts already hold a phase_review result for this same phase_id, reuse that result instead of dispatching the same review again; re-dispatch only after the Phase's changed files actually changed, and record in current task facts what changed since that result.
```

**为什么**：E 的实测靶子——verify-code 会话 `review record` 调用 15 次，其中 **6 条逐字完全重复、合计 1369.3s**，单条最长 1216.7s（`/tmp/wh-card03-design/NOTES-design-extract-3.md` §1；E 三类最大浪费中"review record 重复"= 1402.2s）。去重的判据用的是**既有事实里已有的 phase_review 结果**（读事实，不是新增校验），重发条件写的是"该 phase 的实际改动文件变了"（影响集口径，不是哈希）。

**与 `skills/wh-review` 既有条款的一致性（v2 改正：build-code 有自己的合同，v1 引错了阶段）**：

- **build-code 专属合同**：`skills/wh-review/contracts/build-code.md:5` 逐字「`build-code` 对每个 Phase 的当前真实 diff 发起一次 OCR delegation 独立审查。」——这一句就是「每 Phase 一次」的合同依据，**不是** verify-code 的合同（`skills/wh-review/contracts/verify-code.md` 管的是另一个阶段的最终 worktree 审查）。v1 §5.2 只引了 verify-code 的 `:4`/`:6`/`:53-54`，**改在这里**。
- **同一阶段的既有措辞**：`workflows/build-code/SKILL.md:93-95` 已经写了"每个 Phase 一次 OCR delegation（`review --action=record`）"。
- **wh-review 侧的既有机制（既有，不是本卡新增）**：`skills/wh-review/SKILL.md:95` 的 `material_fingerprint`——「the existing `material_fingerprint` prevents reuse of a result for different material」；`skills/wh-review/SKILL.md:102`「Retry only when the previous call returned no semantic advice and the concrete transport/material problem changed.」
- **如实说明：这三者与草案的复用键不在同一根轴上。** 合同 `skills/wh-review/contracts/build-code.md:8-9` 逐字「Phase 的审查事实绑定当次 task、Phase、材料与代码快照；旧快照的结果保留原身份。」——绑定轴是 **task + Phase + 材料 + 代码快照**；本草案的复用键只写 `phase_id` + 「该 phase 的实际改动文件变了」。**这是两条不同的轴**，草案的键更粗（不含 task、不含材料版本）。
- **`runtime/review/review-record-route.mjs` 已有 canonical dedup identity**（`:648` 逐字注释「Canonical dedup identity, exactly as spec FR-C4-001 fixes it:」；三处 `return { idempotent: true };` 在 `:425`/`:432`/`:440`；`:1492` 的 `status: "recorded", reused: true, dispatch_state: "reused"`）。因此**不能说「step 层没有依据可挡」**——挡的依据在 route 层已经存在。本句能补的只是**step 文字里的显式边界**。

**因此本节改动被降级为一个准确的说法**：`workflows/build-code/steps.json:12` 的这半句**能不能消掉 E 实测的那 1369.3s（6 条逐字重复的 `review record`），本设计无法判定**——route 层已有 canonical dedup identity，重复调用是否真的再次打到 provider，取决于那 6 条重复是否命中同一 identity。**本卡不声称收益，只声称"把已有的'一次'边界写进 step 文字"。**

**不构成新门禁**：重复审查**仍然会发生**（改动变了就允许重发），只是不再因为"忘了上一轮已经审过"而重发；`unavailable` 与 finding 处置路径一字未改。

### §5.3 会不会让哪个测试变红（自己 grep 确认；v2 已按 D 系列改正四处行号）

| 断言 | 位置（v2 逐条复核过） | 本次改动是否影响 |
| --- | --- | --- |
| `${stage}:${order}:${step_slug}` 文档集与实测集全等 | `tests/p0-foundation-contracts.test.mjs:52`（`:53-54` 是 `documented.size` / 排序后全等） | order 与 slug 未动 → 不变 |
| build-code step_slug 序列集合 | `tests/contract/stage-routing-and-concrete-testing.test.mjs:177-178`（`stepSlugs("build-code")` 的 `not.toContain("final-integration-review")` / `not.toContain("integration-review")`） | 未新增/未删 step → 不变 |
| `inspect-and-route-actual-tests`/`run-tests`/`authenticate-current-task-completion` 的 observable_result | `tests/contract/stage-routing-and-concrete-testing.test.mjs:164-165`（**只有这两行**是 observable_result 断言；`:160-163` 是 `completion_evidence`） | 未触碰这三步 → 不变 |
| `review-change` 与 `run-tests` 的顺序、aggregate/analyze 顺序 | `tests/contract/stage-routing-and-concrete-testing.test.mjs:181`（`:184`、`:185` 是 aggregate 与 stage-end 的顺序） | order 未动 → 不变 |
| run-tests 与 publish 之间不得再有 /review/ 步骤 | **v1 引错**：`tests/contract/review-step-forward-progress.test.mjs:77-80` 的边界是 `review-frozen-spec` → `publish-spec-result`，读的是 `workflows/build-spec/steps.json`（`:6`），**不覆盖 build-code 的这个边界**。该文件里真正作用到 build-code 的是 `:25-27` 的 `reviews/successors` 与 `:97` 的 `expect(review).toBeDefined()`（**这两条现在就是红的**，见 §5.5） | 没有新步骤 → 本改动与它无关 |
| step 1 的 observable_result 文本 | grep `read-current-task-documents` 与 `every referenced physical` 于 `tests/` → **无任何匹配** | 只有本次改动会改它 |
| `handoffStep.observable_result` 须匹配 `/plain-language handoff\|大白话交接\|验收通知/i` | `tests/step-manifest.test.mjs:164-165`（`:167-174` 才是 evidence 路径形态断言） | build-code 的最后非 reflection 步是 step 11，不是 step 1/8 → 不变（**结论不变，行号已改正**） |
| `phase_progress` 形状与 cursor-only 投影 | `tests/integration/minimal-task-storage.test.mjs:82-95`、`tests/contract/post-quality-fact-scope.test.mjs:84-90`、`tests/contract/stage-progress-contract.test.mjs:171`（`diagnostic: { code: "phase_progress_cursor_only" }`） | 本节不改代码，只改 step 文字 → 不变 |
| build-code/steps.json 属审查材料 | `tests/contract/review-materials-contract.test.mjs:410`（逐字 `expect(phaseDiffDeliveryForPath("workflows/build-code/steps.json")).toBe("included");`） | 仍为 `included` |
| 需要同步的说明文档 | `docs/stage-atomic-step-inventory.md:55-59`（build-code 1–5 步列表，**不含 observable_result 文本**） | 只改 observable_result 文字 → 该文档可不动；若动，与 §5.1 同批 |
| workflow v2 契约（本文件存在性已实测） | `tests/workflow-v2-contract.test.mjs` | 与 observable_result 文字无关 |

### §5.4 与 §1「快照绑定收窄」的关系

§1 的收窄改的是**重跑判据**（从"整份材料字节级快照"改成"这次改动的影响集"）；§5.1 改的是**读取范围**（从"每个 phase 文件"改成"游标指定的当前 phase 文件"）；§5.2 改的是**重复动作的判据**（从"再叫一次 provider"改成"事实里已有同一 phase 的结果且改动未变就复用"）。三处共用同一条原则：**判断"要不要重来/重读/重审"时以影响集为单位，不以整份材料为单位**。三者都不引入哈希绑定、不新增校验、不新增持久对象——这也是它们能与 D 的第 27/28/29 条否决清单（哈希、receipt、lineage）共存的原因。

### §5.5 本节的验证命令（逐字，只跑受影响的针对性测试）

```
node --test tests/p0-foundation-contracts.test.mjs
node --test tests/step-manifest.test.mjs
node --test tests/contract/stage-routing-and-concrete-testing.test.mjs
node --test tests/contract/review-materials-contract.test.mjs
node --test tests/contract/stage-progress-contract.test.mjs
node --test tests/workflow-v2-contract.test.mjs
```

（`AGENTS.md:21-22`：只跑受影响的针对性测试；禁止顺手跑全量回归。上表逐条对应的断言见 §5.3。）

**v2 删掉的三条命令**（F9.1：**它们指向的文件在本卡 worktree 上不存在**）：`tests/contract/build-code-resume-cursor.test.mjs`、`tests/unit/phase-progress-cursor.test.mjs`、`tests/contract/interaction-contract.test.mjs`；同时删掉 v1 曾列的 `tests/contract/portable-workflow-run.test.mjs`（该文件整篇是 CARD-01 的 build-prd 运行器，与本节改动无关，见 §5.3 的"v1 引错"行）与 `tests/contract/review-step-forward-progress.test.mjs`。（`tests/contract/build-code-test-inventory.test.mjs` 原记「**只在 CARD-04 worktree 里、且未被 git 跟踪**，主树与本卡 worktree 都没有——所以它也不能进本卡的命令清单」。**2026-09-29 复核更正**：该断言不成立——card-04 的 `34b968c3` 已并入 main（`git merge-base --is-ancestor 34b968c3 HEAD` = YES），该文件实测在**主树与本卡 worktree 内且已被 git 跟踪**（129 行 / 6988 B），CARD-04 worktree 目录本身已不存在；该文件现存在于本卡 worktree（6988 B / 129 行，末次提交 `34b968c3`，是本卡祖先），原记理由「本卡 worktree 无此文件」已于 2026-09-29 复核证伪；「不进本卡命令清单」的处置保持不变，**是否纳入本卡命令清单待 build-plan 决定，本卡暂未纳入**。）

#### §5.5.1 改动前就已经红的两条：**既有红，非本卡引入**（F5.2，必须就地登记）

| 断言 | 位置 | 实测现状 | 处置 |
| --- | --- | --- | --- |
| `invoke-concrete-testing-skill` 的 `completion_evidence` kinds 全等 | `tests/contract/build-code-apply-contract.test.mjs:57` 逐字 `expect(concrete.completion_evidence.map((item) => item.kind)).toEqual(["test_strategy", "stage_outcome"]);` | 实测该 step 只有 `["test_strategy"]` → **红** | **本卡不改**；登记为既有红 |
| `publish-code-result` 的 kinds / paths 全等 | 同文件 `:64`（逐字 `toEqual(["tasks", "test", "review", "stage_outcome"]);`）与 `:65-67`（逐字 `["tasks.md", "quality/tests/", "quality/reviews/results/", "quality/evidence/stage-outcomes/build-code/<sha256>.json"]`） | 实测 `["phase_task_facts", "test", "review"]` / `["quality/facts/", "quality/tests/", "quality/reviews/results/"]` → **红** | **本卡不改**；登记为既有红 |
| build-code 必须有 `final-integration-review` | `tests/contract/review-step-forward-progress.test.mjs:25-27`（`:26` 逐字 `reviews: ["review-change", "final-integration-review"],`）与 `:97`（`expect(review).toBeDefined();`） | `workflows/build-code/steps.json` 里没有这个 slug → **红** | **本卡不改**；登记为既有红 |

**并且在同一个仓库里存在一条与上表第三行直接矛盾、当前就是绿的断言**：`tests/contract/stage-routing-and-concrete-testing.test.mjs:177` 逐字 `expect(stepSlugs("build-code")).not.toContain("final-integration-review");`。也就是说「build-code 必须有 `final-integration-review`」与「build-code 必须没有 `final-integration-review`」**现在同时存在于两条契约测试里**——这是一处**本卡之前就存在的自相矛盾**，不是本卡引入的，本卡只登记、不选边、不顺手改（处置选项见 §7-5）。

（补记：`tests/contract/review-step-forward-progress.test.mjs:105` 的 `skillRule` 正则 `/integration review step is then complete[\s\S]{0,200}rather than dispatching integration[\s\S]{0,20}review again/i` 在主树 `workflows/build-code/SKILL.md` 里 grep 不到——同上，既有事实，本卡不改。）

#### §5.5.2 §5 两处改动**不会让任何测试变红**（F5.4，已复核）

- 两处改动都**不改** `step_slug`、`order`、`entry_conditions`、`completion_evidence`，只改 `observable_result` 文字。
- 全局搜索确认没有任何测试断言 step 1 的 `observable_result` 文本：`grep -rn "every referenced physical" tests/` → **无匹配**。
- `runtime/schemas/steps.schema.json:26` 对 `observable_result` 只要求 `{type: string, minLength: 1}`，不做形状或词汇校验。
- `workflows/build-code/steps.json` **不在 CARD-04 的写面**（§6.2 实测；CARD-04 的 `diff --stat` 不含该文件）。

#### §5.5.3 保留的不确定项（F5.5，不得写成"保证不红"）

`tests/step-manifest.test.mjs` 可能对 `observable_result` 做**形状或词汇级**校验（例如长度、句子数、或与 `completion_evidence` 的一致性）。**本设计不跑测试，因此不能断言本改动不红**；实施本批时必须以 §5.5 第 2 条命令的实跑结果为准。这是本节的**唯一**未定项，其余行都经过逐行核对。

---
## §6.0 时点声明（先读这一节，它消歧，不是免责声明）

本卡的写面分**两个时点**，混读会产生两种相反的错判。逐字申明：

**时点 ①（当前，正在做）＝ make-decision 阶段。** 依据 `specs/workflowhub-thin-core-card-03-20260919/decision-log.md:55`（T-013）用户自定义答复逐字：

> 本卡先进行make-decision，后续build-plan会等到card-04交付合并进来后再进行

同条派生 ③ 逐字：「因此本卡**在 make-decision 阶段**不实际改任何 `workflows/*/SKILL.md`，只产出接口/方法面的冻结候选与计划」。
⇒ **在本卡目前所处的 make-decision 阶段，一行 `workflows/*/SKILL.md` 都不写**。这不是「这些文件不在本卡范围」，而是「现在这个时点不写」。

**时点 ②（后续，CARD-04 分支合并进 main 之后）＝ 本卡的 build-plan / build-code 时点。** 本文件 §6.1 的「处置」列**全部**描述时点 ② 的动作。三值词表逐字如下（沿用 `V4-M4.md:30-34`，本卡不再引入第四值）：

| 处置值 | 逐字定义 |
| --- | --- |
| **本卡内做** | 该落点不在 CARD-04 写面内（或 CARD-04 只改了同目录的另一个文件），按 §6.3 的批次直接写，无需等待任何合并。 |
| **错开实施** | 该落点所在文件在 CARD-04 写面内，但本卡要写的内容与 CARD-04 的 hunk 无重叠；仍属本卡交付（**不是**排除），在 CARD-04 分支合并进 main **之后**执行，且执行前必须按 §6.1 的锚点重新定位；每行写明「理由」与「前置条件」。 |
| **本卡不改** | 本设计不要求改这个文件的任何一行；每行写明理由；**理由不得是「CARD-04 在改它」**。 |

**两张名单必须一起读，否则会重犯旧错**：

- 「错开实施」＝ `workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`workflows/make-decision/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-prd/SKILL.md`，加 `tools/cli/stage-runtime.mjs` 的 **q7_6 游标落点**（新纳入，见 §6.5 的 delta 表）。
- 「本卡不改」＝ 仅 `tools/cli/stage-runtime.mjs` 的 **T-018 H-1 快照语义落点**、`runtime/evidence/**`、`runtime/stage/stage-runner.mjs`、`workflows/build-code/capture.mjs`、`tests/contract/repository-inventory.test.mjs`、`vitest.config.mjs`、`docs/architecture/complexity-baseline.json`、`skills/decision-log/**`。

⚠️ **旧口径作废声明**：`DESIGN-v3.md:1103-1104` 把 `workflows/build-plan/SKILL.md` 的处置写成「本卡内做」，`V4-M4.md:53` 又写「这三个文件之外，没有任何落点因为 CARD-04 而被排除」——**两句都与 `decision-log.md:55` 冲突，本文件一律以 `:55` 为准**。`workflows/build-plan/SKILL.md` 的正确处置是**错开实施**，与那三个文件同类。

---

## §6.1 逐文件施工表（时点 ② 的动作）

**列语义**：`落点` 列一律给**纯文本锚点**（可被 `grep -F` 直接命中），行号只作定位辅助；`授权来源` 列给 `decision-log.md` 的 T 行号、设计书 §1 的 R 行号、或母任务 OI 号；追不到授权的写「**无授权**」，本表无此情形（原 `#10` 已被 §6.2 的 T-027 补齐）。

### §6.1.1 处置总表

| # | 文件 | 落点（文本锚点） | 改什么（一句话） | 处置 | 授权来源 |
| --- | --- | --- | --- | --- | --- |
| 1 | `skills/spec-plan/templates/phase-template.md` | 全文（4 处新增 + 尾注 1 句） | T-008 定案的字段槽位扩展（单一字段权威） | 本卡内做 | `:50` T-008=A；设计书 §3.1–§3.6 |
| 2 | `skills/spec-plan/SKILL.md` | `Write one independent \`phases/P<n>.md\` file per Phase using` 所在段末句 | 末尾 1 句：加 `Acceptance inline` 格式（q7_2） | 本卡内做 | T-027（=q7_2=A）；设计书 `:553` |
| 3 | `workflows/build-plan/SKILL.md` | 以 `a concrete reason, risk, objective alternative, and acceptance disclosure.` 结尾的行之后 | D1 追加游标写入句（q7_6=D1）；同批再落 D2/D3/D4（见 §6.1.3） | **错开实施** | T-032（=q7_6=B）；T-030（=q7_4=C）；T-014=A；T-013③ |
| 4 | `skills/spec-specify/templates/spec-template.md` | `Acceptance inline` 段 | 内联格式改成 `AC-ID \| oracle ID \| 证据类型 \| spec.md 锚` | 本卡内做 | T-028（=q7_2=A）；设计书 `:436` |
| 5 | `workflows/build-plan/SKILL.md` | `5. Write one independent \`phases/P<n>.md\` per Phase` 起的 7 行 | 删字段枚举、改指模板（q7_4） | **错开实施** | T-030（=q7_4=C） |
| 6 | `workflows/build-plan/SKILL.md` | 全文相关节序 | §2/§3 节序同步 | **错开实施** | T-013③（时点由 `:55` 定） |
| 7 | `workflows/build-plan/steps.json` | `"observable_result": "Each post-cohort Phase is an independent engineering authority` | **不改**（游标不是完成观测） | 本卡不改 | T-032（=q7_6）；理由见 §6.1.3 E |
| 8 | `workflows/build-code/steps.json` | `:15` 的 `"observable_result"` 原句 `…and review dispositions support that claim.` 之后（**追加**，原句逐字保留）；连带核对 `:5` | 新增判据句：绑定对象＝该 phase 声明的写集（**现状无任何绑定语义**，`grep -c snapshot workflows/build-code/steps.json` = 0 ⇒ 是新增判据，不是修正已有绑定） | **已落地（2026-09-28 补落）** | `:52`/`:293` T-010=A（acceptance 逐字恢复）；设计书 §1 R2 |
| 9 | `docs/standard-workflow.md` | `:88-92` 之后的 `:93` 单行 | 五阶段写面收窄口径 | 本卡内做 | R3 授权；**禁区 `:88-92` 一字不动**（§6.5） |
| 10 | `docs/standard-workflow.md` | `retain incomplete facts honestly` 所在段（即 step 11 `authenticate-current-task-completion` 的定义段，实测 `:334-340`） | 绑定对象＝该 phase 声明的写集 | **已落地（2026-09-28 补落）** | `:52`/`:290`/`:293` T-010=A；设计书 §1 R2 |
| 11 | `docs/standard-workflow.md` | `:93` 及之后新增行（R4 落点；**`:88-92` 一字不动**） | 派发/回收责任段 | 本卡内做 | R4 授权 |
| 12 | `docs/standard-workflow.md` | `:93` 及之后新增行（R8 落点，与 R4 不合并；**`:88-92` 一字不动**） | build-plan 单 phase 工程权威的责任段 | 本卡内做 | R8 授权；T-013③ |
| 13 | `docs/standard-workflow.md` | `:292-293` 后新增行 | 责任段收尾 | 本卡内做 | R9 授权 |
| 14 | `docs/standard-workflow.md` | `:97` 后新增行 | 读法段收尾 | 本卡内做 | R13 授权 |
| 15 | `docs/stage-atomic-step-inventory.md` | make-decision 段 `:13-26`（14 行）与 build-plan 段 `:42-54`（13 行） | 同步到真实 `workflows/*/steps.json`（q7_1） | 本卡内做 | **T-027（=q7_1=A）** ← 原表此行无授权，本文件补齐 |
| 16 | `docs/adr/0034-subagent-dispatch-and-parallel-rules.md` | 文末新节 | 加「阶段/Phase」一节 | 本卡内做 | T-025=A；设计书 §6.4 |
| 17 | `workflows/build-code/SKILL.md` | `It is bound to the current material revision`（C1 被引条文的写入口；原记 `:245-250`，现 `:320-327`）、`## Work loop` 第 1 条（C1 引用的入口步骤；原记 `:203-208`，现 `:251-257`） | C1 追加引用句（游标写入） | **错开实施** | T-032（=q7_6）；旧行号见 §6.1.3 C1 |
| 18 | `workflows/build-code/SKILL.md` | `` `skills/architect-code-review/SKILL.md`。把当前 diff、完整 AC、OCR packet `` | 路径形定位符 → 裸 slug 散文形 | **错开实施** | 设计书 §1 R15（三处逐字之一）；机器事实见 §6.1.4 |
| 19 | `workflows/build-code/SKILL.md` | `Portable dependencies:` 段 | 引用 `AGENTS.md` 三条执行卫生规则（T-006） | **错开实施** | `:23` T-006=A |
| 20 | `workflows/build-code/SKILL.md` | G-1 收场段 | 各写各的角色 + 交叉引用 build-plan（T-014） | **错开实施** | `:58`/`:59` T-014=A |
| 21 | `workflows/verify-code/SKILL.md` | `:108`（现 `:135`）、`:143`（现 `:170`）的「一次」边界措辞 | 边界措辞同步 | **错开实施** | 设计书 §3；T-013③ |
| 22 | `workflows/make-decision/SKILL.md` | 方法章节派发段 | 按工作类型派发口径 | **错开实施** | 设计书 §3；T-013③ |
| 23 | `workflows/build-prd/SKILL.md` | `## Ordered orchestration` 段（`:42` 起；**`description:` 行在 `:3`，不得碰**） | 方法章节照样改到位（按工作类型派发 + 修复回原实施子代理）；派发实例证据由后续 pre 路线任务承担 | **错开实施** | `:23` T-003=A（**原表缺此行**） |
| 24 | `AGENTS.md` | `## 本任务新增控制面登记` 与 `## vNext 永久实施边界` 之间 | 三条执行卫生规则（一处权威） | 本卡内做 | `:23` T-006=A；设计书 §1 R1 |
| 25 | `AGENTS.md` | `唯一进度例外是上述单行当前游标，不另建 projection 或账本。` | 改「单行」为「当前游标字段」（q7_6=C3） | 本卡内做 | T-032（=q7_6=B） |
| 26 | `AGENTS.md` | `` `facts.jsonl` 现有 build-code stage row 可原位保存一个当前 `phase_progress` 游标 `` | 扩到 build-plan + build-code（q7_6=C2） | 本卡内做 | T-032（=q7_6=B）+ T-034 |
| 27 | `AGENTS.md` | `:44` 之后、`:45` 之前 | 新增「唯一进度来源」bullet（q7_3） | 本卡内做 | T-029（=q7_3=A） |
| 28 | 根目录 5 份文本 | `progress.md`、`task_plan.md`、`findings.md`、`HANDOFF-make-decision.md`、`HANDOFF-make-decision-card07.md` | `git mv` 进 `docs/archive/retired-root-progress/`（q7_3） | 本卡内做 | T-029（=q7_3=A） |
| 29 | `.planning/**` 3 份活区文本 | `.planning/2026-09-17-build-plan-cost-baseline-20260917/findings.md:33`、同目录 `progress.md:14`、`.planning/2026-09-19-workflowhub-deferred-closeout/task_plan.md:48` | 同步搬迁后的路径（q7_3） | 本卡内做 | T-029（=q7_3=A） |
| 30 | `runtime/task/task-store.mjs` | `value.stage !== "build-code")) {` 与 `phase_progress is only supported on build-code stage rows` | 放开 build-plan（q7_6=A4） | 本卡内做 | T-032（=q7_6=B）+ T-034 |
| 31 | `tools/cli/stage-runtime.mjs` | 7 处游标参数化锚点（§6.1.3 A5） | 给写函数加 `stage` 参数（q7_6=A5） | **错开实施** | T-032（=q7_6=B）+ T-034（**T-018 推迟不覆盖本组**） |
| 32 | `tools/cli/stage-runtime.mjs` | B1/B2/B4/B5/B6 锚点（§6.1.3 B） | 放开 build-plan 写与读回（q7_6=B1—B6） | **错开实施** | T-032（=q7_6=B）+ T-034 |
| 33 | `tools/cli/stage-runtime.mjs` | T-018 H-1 快照绑定语义 | **本卡不做**（冻结候选清单） | 本卡不改 | `:60`/`:378` T-018=B + T-034（收窄到 H-1） |
| 34 | `runtime/evidence/**`、`runtime/stage/stage-runner.mjs` | 冻结候选清单（§6.6 T-018） | **本卡不做** | 本卡不改 | `:378` T-018=B |
| 35 | `workflows/build-code/capture.mjs`、`tests/contract/repository-inventory.test.mjs`、`vitest.config.mjs`、`docs/architecture/complexity-baseline.json` | 全文 | **本卡不改**（CARD-04 的写面，不是本卡动作） | 本卡不改 | 无（**排除项不需要授权**；理由见 §6.6） |
| 36 | `skills/decision-log/**` | 全文 | **本卡不改**（CARD-04 **已改完并落地**，且本卡无内容要写） | 本卡不改 | 无（排除项；理由见 §6.6） |
| 37 | `CONTEXT.md` | 已在 card-03 worktree 内改 | `11 0 CONTEXT.md`（`git diff --numstat` 实测） | 已完成 | 设计书 §6.4 |
| 38 | 两个既有契约测试 | `tests/contract/post-cohort-authoring-files.test.mjs`、`tests/contract/post-cohort-executable-authoring.test.mjs` | 只扩断言（不改断言对象） | 本卡内做 | 设计书 §3；T-008=A |
| 39 | 4 条既有红测试 | `tests/contract/build-code-apply-contract.test.mjs`（`:15`/`:31`/`:57`）、`tests/contract/review-step-forward-progress.test.mjs:97` | 只在测试侧改期望值（q7_5） | 本卡内做 | **T-031（=q7_5=A）** ← 原表此行无独立授权 |
| 40 | `skills/catalog.yaml`、`skills/spec-plan/skill-bundle.json` | `:335` 的 `local_bundle_hash`、bundle `files[0]`/`files[1]` 的 sha256 | ~~同批回写摘要链~~ **本卡不改**（由第 42 行覆盖；§14.6 冲突 2 判定） | **本卡不改** | T-028（=q7_2=A）+ T-008=A **已被第 42 行的 SD-17 + OI-013 覆盖**；配方见 §6.1.3 S（**不执行**） |

| 41 | `workflows/build-spec/SKILL.md` | 全文 | **不改**（「明确不适用理由」：post 不注册不执行 build-spec） | 本卡不改 | `:45` T-003=A + `docs/standard-workflow.md:39` |
| 42 | `skills/spec-plan/skill-bundle.json`、`skills/catalog.yaml`、`runtime/schemas/skill-catalog.schema.json`、`runtime/adapters/local-skill-resolver.mjs`、`runtime/evidence/check-skill-closure.mjs`、`repo-skills.manifest.json` | `skills/**` 的逐文件 `sha256` + `local_bundle_hash` 校验链（消费者地图见 §6.8） | **本卡不写、不算、不回写任何哈希**；该链属 OI-013 删除面，整表挂 CARD-06 | 本卡不改 | SD-17 + OI-013（母 PRD `prd.md:178`，责任卡含 CARD-06；FR-29 逐字点名「材料身份/哈希」）+ 用户 2026-09-27 逐字「不应该有任何逐文件-sha存在，这是核心的阻塞点！」 |

**本表共 42 行，「无授权」0 行。**（**2026-09-28 §14.7 在其后增补第 43–52 行 ⇒ 全表 52 行、「无授权」0 行；43–51 本卡内做、52 错开实施。** 第 43–52 行的逐字落点与授权来源**以 §14.7 为单一权威**，不在本表重复；本表第 40 行已按 §14.6 冲突 2 改判为「本卡不改」。）原表 21 行中被判定「无授权」的两处，处置分别是：`docs/stage-atomic-step-inventory.md` → 改挂 `T-027`；两个契约测试的断言扩展 → 改挂 `T-031`。

**行号引用改写要求（`:57` T-027=q7_1=A 的附带裁决）**：批 E 落地后 `docs/stage-atomic-step-inventory.md` 的行数会变。凡**引用该文件的行号**（本卡材料里共 9 处，集中在 `:64`/`:65` 一带），一律**改写成可 `grep -F` 命中的文本锚点**，不按位移重指、不留悬空行号。

### §6.1.2 三处必须「现状逐字 → 改成逐字」的样本（其余逐字文本见 §6.1.3/§6.1.4）

格式说明：本表其余行同样必须**逐字成对**落地，禁止只写意图。下面给出本卡最高风险的三对，作为全表的书写范式。

**(a) `docs/standard-workflow.md` 的写面收窄（第 9 行）**
- 现状逐字：原表把写入范围写成 `:81-93`（**含禁区 `:88-92`**）。
- 改成逐字：写入范围＝ `:81-87` 与 `:93` 两个**不重叠**片段；`:88-92` 一字不动。

**(b) `docs/standard-workflow.md:334-338` 与 `workflows/build-code/steps.json:15` 的 T-010 绑定判据（第 8、第 10 行）**
- 现状逐字（`DESIGN-v3.md:95-96`）：`（phase 文件 Write set 列出的路径，加上本次实际改动的文件与受影响的检查清单）`；英文同病在 `:105`：`(its Write set paths plus this round's actual changed files and affected checks)`。**这两处在 v3 里正被 `DESIGN-v3.md:108` 用作 `steps.json:15` 的追加草案**；v4 已把草案改成只写 `Write set` 路径本身，这两处括号**不得照抄**。
- 改成逐字（`decision-log.md:293` acceptance 原文）：`step 11 的绑定对象为该 phase 声明的写集、不再绑整个 snapshot`；`decision-log.md:290` 原文：`删掉跨 phase 的全量快照绑定、只留该 phase 自己声明的写集`。
- 落笔形态：在 `workflows/build-code/steps.json:15` 的 `observable_result` 里，`…and review dispositions support that claim.` 之后**追加一句**，原句逐字保留（`tests/contract/stage-routing-and-concrete-testing.test.mjs:164-165` 以 `toMatch` 子串匹配该原句，重排或改写会红）。
- 两处括号并集**应删**，不得作为落地文本。

**(c) `workflows/build-plan/SKILL.md` 的字段枚举（第 5 行）**
- 现状逐字（7 行，`:209-215`）：`5. Write one independent \`phases/P<n>.md\` per Phase. Each file has L0/L1/L2,` … `expected exits, oracle, evidence path, coverage limit, STOP, done evidence,` … `and rollback. Render \`phases/index.md\` as a pure pointer table: …`
- 改成逐字（同 7 行位置，指向模板）：`5. Write one independent \`phases/P<n>.md\` per Phase from` / `` `skills/spec-plan/templates/phase-template.md`. That template is the single `` / `field authority for a Phase file: its L0/L1/L2 sections and tags define what` … 末两句 `Render \`phases/index.md\` as a pure pointer table: authority path, semantic anchor,` `write set, dependency, consumer. The final aggregate is an ordinary Phase` `task, not a new public stage.`（逐字全文见 `V4-N1.md:184-192` 的替换块）

### §6.1.3 逐字改动明细（按批分组；每条都已在上表登记授权）

> **⚠ 2026-09-28 覆盖声明（§14.6 冲突 2；用户裁决「`skills/spec-plan/**` 的 sha 链决定不变」）**：本节的 **A4、A5、B3 与整批 S 全部不执行**。本卡零哈希动作；摘要链属 OI-013 删除面，已由 §6.8 判定「本卡不替 CARD-06 做删除」，上表**第 40 行亦已改判为「本卡不改（由第 42 行覆盖）」**。批 S 的重算配方与强制点**保留为事实记录**（CARD-06 需要它），**但本卡不落地**。批 A 的 A1–A3 与批 B 的 B1–B2 照常执行。

**批 A（phase 模板与登记）**
- A1 `skills/spec-plan/templates/phase-template.md`：4 处新增 + 尾注 1 句（设计书 §3.1–§3.6）。
- A2 `skills/spec-plan/SKILL.md:14` 末 1 句。
- A3 `workflows/build-plan/SKILL.md:198` 之后 3 行。
- A4 `skills/spec-plan/skill-bundle.json:7` / `:11` 两个 per-file sha256（现值 `ef5ed76b…` / `b5a4b739…`）。
- A5 `skills/catalog.yaml:335` 的 `local_bundle_hash`（现值 `bb470db0…`）＋ `:332-337` 登记块。
- ⚠️ `local_version: 1.3.0`（`skills/catalog.yaml:334`）是否 bump：全仓无规则（`grep -rn local_version` 只命中 `tools/cli/build-reflection-page.mjs:567`、`runtime/evidence/workflow-evolution.mjs:198` 与 `tests/skill-provenance-strict.test.mjs:17` 的格式断言 `/^\d+\.\d+\.\d+$/`）⇒ **须 owner 裁定**，见 `## 残留不确定`。

**批 B（spec/index 模板）**
- B1 `skills/spec-specify/templates/spec-template.md`：`Acceptance inline` 段改为 `AC-ID | oracle ID | 证据类型 | spec.md 锚`（**只内联引用行，不抄判据正文，不写通过/失败条件**）。
- B2 `skills/spec-tasks/templates/index-template.md`：同步同格式（登记点）。
- B3 摘要链回写：`skills/spec-specify/skill-bundle.json`、`skills/catalog.yaml:283-288`（`spec-specify`）的 `local_bundle_hash`。

**批 S（`skills/catalog.yaml` 单文件串行）**
- 重算配方（已在两处复现一致）：`sha256(JSON.stringify(sorted([{path, sha256}, …], key = path), separators=(",", ":")))`，每个 `sha256` 是该文件字节的 sha256。
- 强制点：`runtime/adapters/local-skill-resolver.mjs:108-111` 抛 `bundle sha256 mismatch: <locator>`；`runtime/evidence/check-skill-closure.mjs:744` 抛 `catalog local_bundle_hash does not match resolved bundle`。断言：`core/__tests__/check-skill-closure.test.mjs:206-213`、`tests/contract/spec-stage-artifact-closure.test.mjs:115-118`、`tests/contract/stage-reflection-wiring.test.mjs:44`/`:98`/`:187`、`tests/skill-provenance-strict.test.mjs:25-26`。
- **S 必须排在 A 与 B 之后**（`skills/catalog.yaml` 是单文件，同时登记 `spec-plan` 与 `spec-specify`，只能有一批写它）。

**批 C（`docs/standard-workflow.md` + steps.json）**
- R2 显式落点：`docs/standard-workflow.md:334-338`（`retain incomplete facts honestly` 所在段）+ `workflows/build-code/steps.json:15`。原文只把它隐含在 `:280-300` 区间里，本文件提升为**显式落点**。
- 连带读取点（**只核对，非必红**）：`docs/stage-atomic-step-inventory.md:64`/`:65`、`tests/contract/stage-routing-and-concrete-testing.test.mjs:164,166`（子串式 `toMatch`）、`tests/e2e/vnext-five-stage-current.test.mjs:499`。

**批 D（R3/R4/R8/R9/R11/R13 的 `:92`/`:97`/`:292-293` 后新增行）**
- 全部落在 `:93` 及之后 ⇒ 与禁区 `:88-92` **不重叠**（§6.5 逐条证明）。

**批 E（`docs/stage-atomic-step-inventory.md`）**
- make-decision 段 `:13-26`（14 行 → 13 行）、build-plan 段 `:42-54`（13 行，8 处 slug 不符）。
- 判据：`tests/p0-foundation-contracts.test.mjs:55` `expect(documented.size).toBe(actual.size)` ⇒ 改后 `68 = 68`；`:56` 排序后逐项相等。
- 连带位移：删 1 行后全文件 87 → 86 行，`:26` 之后所有行号 −1；`decision-log.md` 有 9 处引用 `:64`/`:65`（`:35`、`:47`、`:52`、`:287`、`:290`、`:291`、`:293`、`:323`、`:360`）⇒ 新值 `:63`/`:64`。是否同批重指**须 owner 裁定**。
- **不改**：`docs/architecture/repository-inventory.tsv:104`（`validateInventory` 不比对字节；`tests/contract/repository-inventory.test.mjs:31` 把 tsv 冻结到 `git show HEAD:…`）。

**批 F（契约测试断言扩展）**
- `tests/contract/post-cohort-authoring-files.test.mjs`、`tests/contract/post-cohort-executable-authoring.test.mjs`：**只扩断言，不改被断言对象**。
- 加 q7_5 的 4 条测试侧期望值修复（`tests/contract/build-code-apply-contract.test.mjs:15`/`:31`/`:57`、`tests/contract/review-step-forward-progress.test.mjs:97`）。
- **不得改 it 名称**：`tests/contract/requirements-completeness-audit-acceptance.test.mjs:43` 用 `build-code-apply-contract.test.mjs` 的 it 名称 `"reroutes concrete testing against real scope"` 作锚点；`:42` 用 `post-cohort-executable-authoring.test.mjs` 的 it 名称 `"makes build-plan author the real test/target RED owner"`。
- 「测试陈旧」的权威依据：`skills/wh-review/contracts/build-code.md:5`；`specs/archive/workflowhub-thin-core-card-05-20260919/phases/P5.md:7`（Consumer 段）；且 `tests/contract/stage-routing-and-concrete-testing.test.mjs:177-178` 是**绿的**，明令 build-code 不得含 `final-integration-review`/`integration-review` ⇒ 陈旧方是 `review-step-forward-progress.test.mjs:25-27`。

**批 G/H（错开实施与排除，见 §6.0 的两张名单与 §6.6）**

**q7_6 游标参数化的精确落点（A4 / A5 / B1—B6）**

| 代号 | 文件 | 文本锚点 | 现状 → 改成 |
| --- | --- | --- | --- |
| A4 | `runtime/task/task-store.mjs` | `value.stage !== "build-code")) {` + `phase_progress is only supported on build-code stage rows` | `…(value.stage !== "build-code" && value.stage !== "build-plan"))) {` + `phase_progress is only supported on build-plan and build-code stage rows` |
| A5-1 | `tools/cli/stage-runtime.mjs` | `function writeBuildCodePhaseProgressCursor(context, inputCursor) {` | 加第三参 `stage`（**函数名不改**） |
| A5-2 | 同上 | `const currentRow = readTaskFacts(context.task.taskPath).find((row) =>` 之后的 `row.stage === "build-code"` | → `row.stage === stage` |
| A5-3 | 同上 | `stageMaterialScopeRevision("build-code", materials, { activationCohort: "post" })` | → `(stage, …)`（`:1505` 已有先例） |
| A5-4 | 同上 | `task_id: context.identity.taskId,` **之后紧邻的** `stage: "build-code",` | → `stage,`（**承重行**） |
| A5-5 | 同上 | `no current build-code material scope revision was available` | → `` `no current ${stage} material scope revision was available` `` |
| A5-6 | 同上 | `status: "recorded",` **之后紧邻的** `stage: "build-code",` | → `stage,` |
| A5-7 | 同上 | `return writeBuildCodePhaseProgressCursor(context, suppliedInput.phase_progress);` | → 加第三参 `values.stage` |
| B1 | 同上 | `...(values.stage === "build-code" ? ["phase_progress"] : [])` | → `(values.stage === "build-code" \|\| values.stage === "build-plan")` |
| B2 | 同上 | `phase_progress cursor writes require run --action=execute --stage=build-code`（条件行 `values.stage !== "build-code"`） | → `(values.stage !== "build-code" && values.stage !== "build-plan")` + 文案 `require run --action=execute --stage=build-plan or --stage=build-code with phase_progress as the only input` |
| B4 | 同上 | `const phaseProgressRow = currentTaskRows.find((row) =>` 之后的 `row.stage === "build-code"`；`const phaseProgressReadback = values.stage !== "build-code"` | → `row.stage === values.stage`；→ `values.stage !== "build-code" && values.stage !== "build-plan"` |
| B5 | 同上 | `...(values.stage === "build-code" ? { phase_progress: phaseProgressReadback } : {})` | → 加 `\|\| values.stage === "build-plan"` |
| B6（可选） | 同上 | `const buildCodeRows = stage === "build-code" ? taskRows.filter((row) =>` | → `(stage === "build-code" \|\| stage === "build-plan")` 且 `row.stage === stage` |
| C2 | `AGENTS.md` | `` `facts.jsonl` 现有 build-code stage row 可原位保存一个当前 `phase_progress` 游标 `` | → `现有 build-plan 与 build-code stage row 可各自原位保存其当前 … 游标；仍是同一个字段、同一个载体、同一对 \`run\` 写入 / \`status\` 读取，游标语义由所在行的 \`stage\` 决定…` |
| C3 | `AGENTS.md` | `唯一进度例外是上述单行当前游标，不另建 projection 或账本。` | → `唯一进度例外是上述当前游标字段（每个 stage 行至多一个，且始终停留在同一 facts.jsonl 行内），不另建 projection 或账本。` |
| D | `workflows/build-plan/SKILL.md` | 以 `a concrete reason, risk, objective alternative, and acceptance disclosure.` 结尾的行之后 | 追加：`` Keep this stage's own position in the same single `phase_progress` cursor on this stage's row: … `` |
| E | `workflows/build-plan/steps.json` | `"observable_result": "Each post-cohort Phase is an independent engineering authority` | **不改**：`observable_result` 是**完成**观测，而游标按 `AGENTS.md:58` 逐字「不证明完成、不阻止继续」；写进 `completion_evidence` 又等于新增证据 kind（`kind` 是封闭枚举）＝新增控制面；且游标跨 step 6/7/8，无单一 owner |

### §6.1.4 `workflows/build-code/SKILL.md` 的三处逐字（同属该文件的「错开实施」）

- **R15（新增裁决的 §1 修补，详见 `## §1 三处逐字修补` 之 (1)）**：`` `skills/architect-code-review/SKILL.md`。把当前 diff、完整 AC、OCR packet `` → `调用一次 architect-code-review 技能。把当前 diff、完整 AC、OCR packet`。机器事实：`runtime/evidence/check-skill-closure.mjs:703` 正则要求字面 `skills/<name>/SKILL.md`，命中即 `:704` 报 `prompt references undeclared skill`；`workflows/build-code/skill-deps.yaml` 不含该技能；`tests/contract/stage-skill-invocation-contract.test.mjs:76` 逐字 `expect(stageSkills["build-code"]).not.toContain("architect-code-review");` ⇒ 不能靠声明消掉，只能改散文。
- **T-006 引用句**：在 `Portable dependencies:` 段加一次对 `AGENTS.md` 三条执行卫生规则的引用。
- **T-014 G-1 收场＋交叉引用**：与 T-032 的 C1 引用句是**两件事**，必须分别落地（原 `:1111` 把二者混为一谈）。
- ⚠️ 行号漂移：CARD-04 在旧 `:100` 之后插 24 行 ⇒ 旧 `:176`≈新 `:200`、旧 `:203-208`≈新 `:227-232`、旧 `:245-250`≈新 `:269-274`。**一律用文本锚点，禁止沿用行号。**

---

## §6.2 新增 T 行（T-026 起连续编号；插入位置＝`decision-log.md:67` 的 T-025 行之后、`:68` 之前）

列格式逐字取自 `specs/workflowhub-thin-core-card-03-20260919/decision-log.md:41-42`：

```
| 问题 id | 问题（大白话） | 选项全集 | 用户选择 | 选择含义 | 来源 |
| --- | --- | --- | --- | --- | --- |
```

| 编号 | 问题 | 选项 | 用户答复 | 决定 | 来源 |
| --- | --- | --- | --- | --- | --- |
| T-026 | 本卡的写面到底包含什么、五个阶段技能算不算「本卡要做」？处置词表用几个值？ | A=写面＝各阶段技能的方法章节，实施与 CARD-04 错开／B=列为冻结候选/排队/推迟，不算本卡动作／C=只改不撞车的三个技能 | A | **反转此前「冻结候选/排队/推迟」的裁决**：写面逐字＝「写面＝各阶段技能的方法章节」；CARD-04 同时改其中三个文件是**时序约束、不是范围边界**。处置词表收敛为三个值：`本卡内做`/`错开实施`/`本卡不改`。被拒：B（把「文本已定稿」误当「无需本卡落地」）；C（把「同文件有人在改」当排除理由）。落点：本文件 §6.0 词表、§6.1 处置列、§6.3 分批表、§6.5 delta 表。风险：三个文件落点行号在 CARD-04 合并后全部漂移（build-code +24、verify-code +37、make-decision +11），落笔前必须按文本锚点重定位 | 本轮用户消息（逐字含「写面＝各阶段技能的方法章节」「CARD-04 编辑三个文件是 sequencing，不是 scope boundary」「冻结候选 / 排队 / 推迟 是 WRONG、必须反转」） |
| T-027 | `docs/stage-atomic-step-inventory.md` 的两段旧清单要不要本卡顺手同步？ | A=顺手同步到真实 `workflows/*/steps.json`／B=留给后续／C=只记录红 | A | 同步 make-decision 段 `:13-26`（14 行 → 13 行）与 build-plan 段 `:42-54`（13 行、8 处 slug 不符）。判据 `tests/p0-foundation-contracts.test.mjs:55`：改后 `documented.size = actual.size = 68`。连带：全文件 87 → 86 行，`:26` 之后行号 −1，`decision-log.md` 9 处对 `:64`/`:65` 的引用变为 `:63`/`:64`（是否同批重指见残留不确定）。不改 `docs/architecture/repository-inventory.tsv:104` | 本轮用户消息 q7_1=A |
| T-028 | `Acceptance inline` 内联到什么程度？ | A=只内联引用行（`AC-ID \| oracle ID \| 证据类型 \| spec.md 锚`）／B=连判据正文一起内联／C=不内联只给指针 | A | 只内联引用行；**不抄判据正文，不写「通过/失败」条件**。落点：`skills/spec-specify/templates/spec-template.md`（`Acceptance inline` 段）、`skills/spec-plan/SKILL.md:14` 末句、`skills/spec-tasks/templates/index-template.md` 登记点。连带摘要链回写（批 S） | 本轮用户消息 q7_2=A |
| T-029 | 根目录 5 份别的任务的进度文本怎么处置？ | A=移进归档目录 + 同步引用 + 写明唯一进度来源／B=原样保留只加说明／C=删除 | A | `git mv` 进 `docs/archive/retired-root-progress/`（5 份：`progress.md`、`task_plan.md`、`findings.md`、`HANDOFF-make-decision.md`、`HANDOFF-make-decision-card07.md`，basename 不变）；同步活区 3 处引用；`AGENTS.md:44` 之后新增「唯一进度来源」bullet；`.planning/.active_plan` **不动**（CARD-04 活指针）；`specs/archive/**` 的 3 处引用只登记不改 | 本轮用户消息 q7_3=A |
| T-030 | `workflows/build-plan/SKILL.md` 那段 phase 字段枚举怎么办？ | A=保留／B=改成指向模板但保留枚举／C=删掉枚举、改指模板 | C | 删 `workflows/build-plan/SKILL.md:209-215` 的 7 行字段枚举，改成指向 `skills/spec-plan/templates/phase-template.md`；**行数不变**（7 行 → 7 行，文件 20113 → 20066 字符）。保留 `phases/P<n>.md`、`phases/index.md`、`authority path, semantic anchor, write set, dependency, consumer`、`The final aggregate is an ordinary Phase task, not a new public stage.`、`L0/L1/L2` 五处字面。安全性依据：`gate_cmd`/`evidence_path`/`coverage limit`/`expected_exit` 在 `tests/` 全目录零命中要求该文件含；五条定距正则命中行与跨度逐条不变 | 本轮用户消息 q7_4=C |
| T-031 | 4 条既有红测试怎么处置？ | A=本卡顺手在测试侧修掉／B=留给后续／C=只登记 | A | 修 `tests/contract/build-code-apply-contract.test.mjs:15`/`:31`/`:57` 与 `tests/contract/review-step-forward-progress.test.mjs:97`，**全部只在测试侧改期望值**，并在本文件登记依据。**不得改 it 名称**（`:43`/`:42` 以 it 名称为锚点）。`core/__tests__/check-skill-closure.test.mjs` 的第 1 条（`build-code: prompt references undeclared skill architect-code-review`）**不属测试陈旧**，由 §1 修补 (1) 在散文侧消解 | 本轮用户消息 q7_5=A |
| T-032 | build-plan 要不要纳入 `phase_progress` 进度游标？ | A=不纳入／B=纳入（复用同一字段/载体/命令对）／C=另建一套 build-plan 进度 | B | build-plan 也纳入：**同一个 `phase_progress` 字段、同一 4 键、同一个 stage 行载体、同一对 `run` 写入 / `status` 读取**，只把「哪些 stage 的行允许携带它」从 build-code 扩到 build-plan+build-code，读回按被请求的 `values.stage` 选址。零新字段、零新命令、零新对象、零新账本、零新 export。**必须**先做 7 处参数化（A5），否则 build-plan 写入会伪造 `stage: "build-code"` 的行。语义靠**所在行的 `stage`** 区分，不靠游标内的键；消费者必须连 `row.stage` 一起读/传/引用。落盘顺序见 §6.4 | 本轮用户消息 q7_6=B |
| T-033 | 「修复回到原实施子代理，在连续上下文中完成」的判据与取证物是什么？ | A=回到同一个子代理会话（允许中途被上下文压缩）且派发必附审查/测试发现原文／B=只要带完整交接即算／C=用会话标识机械判定 | A | 判据逐字＝**回到同一个子代理会话**（允许该会话中途被上下文压缩过）；派发时**必须附上审查/测试发现的原文**，不带原文的重新派发不算；反向也失败项：把「曾被压缩过」判为不连续。判定取自**独立上下文**。**设计书侧缺落点**（全文 `连续上下文`/`独立上下文` 0 命中）⇒ 由 `DESIGN-v3.md` §3.7 的 G-1 行旁注 + 新增「本卡验收的载体与不适用清单」一节承担（§6.6 第 1 条） | `decision-log.md:176-182`（T-012=A） | 本轮用户消息 |
| T-034 | `:378` 那条「推迟写面」到底推迟什么？ | A=整个 `tools/cli/stage-runtime.mjs` 文件都在 CARD-04 合并后由后续阶段做／B=只推迟 T-018 的 H-1（快照绑定那套 runtime 语义），q7_6 的游标参数化仍在本卡内做 | B | **收窄**：`:378` 推迟的是 T-018 的 H-1（快照绑定那套 runtime 语义），**不是整个 `tools/cli/stage-runtime.mjs` 文件**。q7_6=B 的游标参数化（A5 的 7 处 + B1—B6）**仍在本卡内做**，只是与 CARD-04 的 `@@ -1486` hunk 错开。`DESIGN-v3.md:1116`（原 `#18`）与 `V4-M4.md:55` 把整个文件列为「本卡不改」的写法作废 | 本轮用户消息（交办方转述的确认裁决） |
| T-035 | 五个阶段技能在本卡的处置是「排队/不做」还是「错开实施」？ | A=保持「冻结候选/排队/推迟」／B=改判为「错开实施」（＝本卡交付，CARD-04 合并后落地） | B | 「三个阶段技能排队＝不做」的旧口径作废。逐字理由＝「当前 card-03 任务主要就是优化 build-code 的效率和执行，**怎么可能不改 build-code 的 SKILL 文件**！之前的决策有严重问题和歧义！」⇒ 五个阶段技能的方法章节全部计入本卡交付，处置＝`错开实施`；本卡 make-decision 阶段仍一行不写（T-013③ 不变） | 本轮用户消息（逐字原文） |

**为什么新增而不是改写旧行**：T 表是 append-only 的答复记录（`decision-log.md:31` 逐字「append-only 语义保留——旧表述一律不改写」）。T-013 登记过的「不实际改任何 `workflows/*/SKILL.md`」是**当时时点的真实答复**，不改写它；本次纠正以 T-034/T-035 追加，并在 OI-008 与 OI-007 的 `selected_disposition` 之后加一句「本轮 T-035 细化：写面＝各阶段技能的方法章节，实施与 CARD-04 错开」，与 `:31` 已有的「本轮 T-0xx 细化／补充」写法一致。

**与 T-013 的一致性核对**：T-013 约束的是「本卡现在只做 make-decision、不进入 build-plan」；T-026/T-035 认定的是**写面归属**与**错开实施的时序**，两者不冲突。T-013 的时序一字不改。

---

## §6.3 批次表（每批：含哪些落点 / 授权来源 / 能否独立交付）

| 批 | 含哪些落点 | 授权来源 | 能否独立交付 |
| --- | --- | --- | --- |
| **A** | A1 `skills/spec-plan/templates/phase-template.md`（4 处新增 + 尾注）；A2 `skills/spec-plan/SKILL.md:14` 末句；A3 `workflows/build-plan/SKILL.md:198` 后 3 行 | `:50` T-008=A；`:50` T-004=A；用户逐字诉求②；D-FIELD=A；**T-028（=q7_2=A）** | ✅ 可独立交付；**但摘要链回写必须同批**（A4/A5），否则 `runtime/adapters/local-skill-resolver.mjs:108-111` 抛 `bundle sha256 mismatch` |
| **B** | `skills/spec-specify/templates/spec-template.md`；`skills/spec-tasks/templates/index-template.md` | 用户逐字诉求①+D §3 三处结构缺陷（G-7）；**T-028（=q7_2=A）** | ✅ 可独立交付；同样须同批回写 `spec-specify` 的摘要链 |
| **S** | `skills/catalog.yaml`（`:335` `spec-plan`、`:283-288` `spec-specify`）+ 两个 `skill-bundle.json` | T-008=A + T-028 | ⚠️ **是 A 与 B 的收尾批**，不能独立交付；`skills/catalog.yaml` 是单文件，同时登记两个 bundle ⇒ 只能有一批写它，且 **S 必须排在 A 与 B 之后** |
| **C** | `docs/standard-workflow.md:334-338`（显式）；`workflows/build-code/steps.json:15`；连带核对 `docs/stage-atomic-step-inventory.md:64`/`:65`、`tests/contract/stage-routing-and-concrete-testing.test.mjs:164,166`、`tests/e2e/vnext-five-stage-current.test.mjs:499` | `:52`/`:290`/`:293` T-010=A（acceptance 逐字恢复） | ✅ 可独立交付（`docs/standard-workflow.md` 与 `workflows/build-code/steps.json` 实测与 CARD-04 写面零交集） |
| **D** | `docs/standard-workflow.md` 的 `:93` 及之后新增行（R3/R4/R8/R11，4 行，**`:88-92` 一字不动**，R8 不与 R4 合并） | R3/R4/R8/R11 授权 + `:23` T-006=A + T-013③ | ✅ 可独立交付；**逐行核对与 `:88-92` 不重叠**（§6.5） |
| **E** | `docs/stage-atomic-step-inventory.md` make-decision 段 `:13-26` + build-plan 段 `:42-54` | ✅ **T-027（=q7_1=A）** ← 原判定为「无授权」，本文件补齐 | ✅ 可独立交付；判据 `tests/p0-foundation-contracts.test.mjs:55`；连带行号位移须登记 |
| **F** | `tests/contract/post-cohort-authoring-files.test.mjs` + `tests/contract/post-cohort-executable-authoring.test.mjs`（只扩断言）＋ q7_5 的 4 条测试侧期望值 | ✅ **T-031（=q7_5=A）** ← 原判定为「弱授权」，本文件补齐独立 T 行；另 T-008=A 连带 | ✅ 可独立交付；**不得改 it 名称**；`tests/contract/repository-inventory.test.mjs` 在 CARD-04 写面内，本批**不碰它** |
| **G** | `workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`workflows/make-decision/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-prd/SKILL.md` 的方法章节落点 | T-026 + **T-035**（五个阶段技能＝错开实施）+ T-013③（时点）+ `:23` T-003/T-006/T-007 + `:58` T-014=A | ⚠️ **不能独立交付**：前置条件＝CARD-04 分支合并进 main；执行前必须按文本锚点重新定位（build-code +24、verify-code +37、make-decision +11） |
| **H** | 排除项：`tools/cli/stage-runtime.mjs` 的 T-018 H-1、`runtime/evidence/**`、`runtime/stage/stage-runner.mjs`、`workflows/build-code/capture.mjs`、`tests/contract/repository-inventory.test.mjs`、`vitest.config.mjs`、`docs/architecture/complexity-baseline.json`、`skills/decision-log/**` | `:60`/`:378` T-018=B；CARD-04 写面（非本卡动作） | —（排除项无交付物） |
| **Q** | q7_6 游标参数化：`runtime/task/task-store.mjs`（A4）、`AGENTS.md`（C2/C3）、`workflows/build-plan/SKILL.md`（D1）、`tools/cli/stage-runtime.mjs`（A5 + B1—B6） | **T-032（=q7_6=B）+ T-034**（H-1 推迟不覆盖本组） | ⚠️ **有内部顺序硬约束**，见 §6.4。A5/A4/C2/C3/D1 所在文件不在 CARD-04 写面 ⇒ 行号稳定；B1/B2/B4/B5/B6 在 `@@ -1486` 之后 ⇒ 必须锚点定位 |
| **R** | q7_3：5 份根目录文本搬迁 + `.planning/**` 3 处引用 + `AGENTS.md:44` 后新 bullet | **T-029（=q7_3=A）** | ✅ 可独立交付；不碰 `.planning/.active_plan`、不碰 `specs/archive/**` |

**实施底线（沿用原文）**：任何一批都不得引入新 gate、新哈希/快照/回执机制、新 public 命令、第二进度权威；`specs/archive/**` 与 `docs/research/**` 只读。

---

## §6.4 落盘顺序硬约束（逐字照搬 `V4-N2.md` §9.5，含行号稳定性规则）

1. **A5（7 处参数化）先落地，单独落地。** 单独落地是**惰性的**：`tools/cli/stage-runtime.mjs:1872` 仍拒绝 build-plan、`:1863` 也不放行 `phase_progress` ⇒ 新参数无人调用，写入路径不可达 ⇒ **零风险**。
2. **A4 + B1 + B2 同批。** **绝不可在 A5 之前落 A4+B1+B2** —— 那正是「伪造一条 `stage: "build-code"` 的进度行」的场景：写函数 `writeBuildCodePhaseProgressCursor`（`tools/cli/stage-runtime.mjs:1004-1061`）未 export，函数体内 `stage` 被写死 5 处（`:1024`/`:1025`/`:1031`/`:1034`/`:1056`），而 `runtime/task/task-store.mjs:387-410` 的 `materialiseStageRow` 在 `:391` 逐字 `stage: input?.stage,` ⇒ 落盘行的 stage 完全取自写入方 input。
3. **B4 + B5 同批。** 只落 B4/B5 而无 A4/B1/B2 无害（读不到 ⇒ 走 `tools/cli/stage-runtime.mjs:1562-1563` 的 null 支路）。**A4 必须早于第一次真实 build-plan 游标写入**，否则 `status` 走 `:1564-1565` 的 `facts_jsonl_unreadable`（`runtime/task/task-store.mjs:335` 在读盘时抛）。
4. （可选）B6 与 B4/B5 同批或更早皆可。

**通用规则（对 `tools/cli/stage-runtime.mjs` 一律生效）**：该文件在 CARD-04 写面，有一个 `@@ -1486` 的 7 行 hunk。`:1486` **之前**的落点（B6 `:966-969`、A5-1—A5-6 `:1004`/`:1023-1024`/`:1025`/`:1031`/`:1033-1034`/`:1054-1056`）**不位移**；`:1486` **之后**的落点（B4 `:1560`/`:1562`、B5 `:1576`、B1 `:1863`、B2 `:1872-1873`、A5-7 `:1875`）**随该 hunk 净行数整体位移** ⇒ 要么先合 CARD-04 再按锚点重定位落 B 组，要么 B 组先落再由 CARD-04 重算 hunk，**两条路都不得依赖行号**。

**行号稳定（可安全用行号辅助定位的三处）**：`runtime/task/task-store.mjs`、`AGENTS.md`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json` **不在** CARD-04 写面 ⇒ 行号稳定。

**新增文件处置（沿用 §6.4 原文）**：本设计**不新建任何生产文件**；唯一新文件 `docs/adr/0034-subagent-dispatch-and-parallel-rules.md` 已在 card-03 worktree 并被 git 跟踪（**2026-09-29 复核更正**：原记「未跟踪」不成立，首次提交 `8112a546`），只往里加一节（T-025=A）。q7_3 的 `docs/archive/retired-root-progress/` 由 `git mv` 产生，不是新写的生产文件。

---

## §6.5 禁区与区间收窄

**禁区（不得作为写面）：`docs/standard-workflow.md:88-92` 五行。** 依据 `decision-log.md:290` 逐字：「`docs/standard-workflow.md:88-92`（尤其 `:91`「不设统一预算 gate」）被 CARD-04 在 decision-log 引用了 5 处，**勿改这五行**」。T-010 的 acceptance（`:293`）同样逐字要求「`docs/standard-workflow.md:88-92` 五行未被改动」。

**更正一**：原 §6.1 第 9 行把写入范围写成 `:81-93`。该区间**包含禁区 `:88-92`** ⇒ `V4-M4.md:203` 声称「与 `:88-92` 不重叠」在**行区间意义上不成立**。逐字收窄为两个**不重叠**片段：`:81-87` 与 `:93`。

**更正二**：R3/R4/R8/R11 的落点原文写「`:92` 后新增行」。`:92` 属禁区，字面照做会诱导实施者去改 `:92`。逐字改述为「**`:93` 及之后**新增行，`:88-92` 一字不动」；其中 R8 是**一条独立新增行**，不得与 R4 合并，以免两条授权混成一处。

**更正三**：R2 的落点（旧编号 `:289-290`）原被 `:280-300` 这个粗区间**隐含覆盖**、未被指名 ⇒ 提升为**显式落点** `docs/standard-workflow.md:334-338`（`retain incomplete facts honestly` 所在段，即 step 11 `authenticate-current-task-completion`）+ `workflows/build-code/steps.json:15`，句间加「不落并集」的逐字声明（§6.1.2 (b)）。

**delta：处置词表的净变化（相对 `DESIGN-v3.md:1100-1118` 与 `V4-M4.md`）**

| 文件 | 原文处置 | 新处置 | 依据 |
| --- | --- | --- | --- |
| `workflows/build-plan/SKILL.md` | 本卡内做 | **错开实施** | `:55` T-013③ |
| `workflows/build-code/SKILL.md` | 冻结候选 → 排队 | **错开实施** | T-026 + T-035 |
| `workflows/verify-code/SKILL.md` | 冻结候选 → 排队 | **错开实施** | T-026 + T-035 |
| `workflows/make-decision/SKILL.md` | 排队（仅当 §7 裁决涉及） | **错开实施** | T-026 + T-035 |
| `workflows/build-prd/SKILL.md` | **原表无此行** | **错开实施**（新增行） | `:23` T-003=A |
| `tools/cli/stage-runtime.mjs` | 推迟（整个文件） | **拆开**：T-018 H-1 落点＝「本卡不改」；q7_6 游标落点（A5 7 处 + B1—B6）＝**错开实施** | `:378` + **T-034** |
| `runtime/task/task-store.mjs` | 原表未列 | **本卡内做**（q7_6 A4） | T-032 + T-034 |
| `docs/stage-atomic-step-inventory.md` | 本卡内做（若裁决同步） | **本卡内做**（裁决已定） | **T-027（=q7_1=A）** |
| `skills/spec-plan/SKILL.md` | **原表无此行** | **本卡内做**（新增行） | T-028（=q7_2=A）；设计书 `:553` |
| 两个契约测试文件（断言扩展） | 弱授权 | **本卡内做**，挂 T-031 | T-031（=q7_5=A） |

---

## §6.6 未覆盖落点回填（T-002 / T-003 / T-006 / T-007 / T-014 / T-018 逐条）

对每条给两种合格处置之一：**给出落点**（完整路径 + 逐字改法）或**逐字写「本卡不做 + 理由 + 留给谁/哪个阶段」**。

**1. T-002（验收载体）—— 给落点。**
- 载体①「本卡验收主证据＝card-03 自身执行事实」：落点＝`specs/workflowhub-thin-core-card-03-20260919/` 的本次执行材料本身（`decision-log.md` 本轮 T 行 + `facts.jsonl` 的 stage rows）。**零新增文件。**
- 载体②「G-1 走**演练**记录」：落点＝`DESIGN-v3.md:695`（G-1 行，「不加字段」判定旁）追加逐字注：「字段不加，由演练记录承担验收；演练记录落在本任务材料内，不新建机制」。
- 载体③「`workflows/build-prd/` 记『明确不适用理由』」：落点＝同上的不适用清单节（下方 ④）。
- 载体④「新增一节『本卡验收的载体与不适用清单』」：建议挂在 §10 折入溯源表**之前**，逐条写明 G-1 演练记录、`build-prd` 不适用理由、独立上下文判定人。
- 载体⑤「判定必须来自**独立上下文**（禁自审自判）」：落点＝同节内逐字写「判定取自独立上下文；本卡不得自审自判」（依据 `:176-182` 的 T-012=A acceptance 与 `AGENTS.md` 的质量裁决条款）。

**2. T-003（build-prd 处置）—— 给落点。**
- 逐字处置：`workflows/build-prd/SKILL.md` 方法章节**照样改到位**，派发实例证据由后续 pre 路线任务承担。依据 `decision-log.md:25` T-003=A。
- 落点：§6.1 第 23 行（新增行）；具体位置＝`workflows/build-prd/SKILL.md:42` 的 `## Ordered orchestration` 段（该文件结构：`:3` frontmatter `description:`、`:7` `# Build PRD`、`:9` `## Responsibility and authority`、`:31` `## Portable invocation`、`:42` `## Ordered orchestration`、`:64` `### \`report-facts-and-handoff\` save/read contract`、`:117` `## Boundaries`）。
- ⚠️ **不得碰 frontmatter**：五个阶段技能的 `description:` 行都在各自 `:3`（`workflows/build-prd/SKILL.md:3`、`workflows/verify-code/SKILL.md:3`、`workflows/build-plan/SKILL.md:3`、`workflows/build-code/SKILL.md:3`、`workflows/make-decision/SKILL.md:3`）；`workflows/verify-code/SKILL.md` 的 `:108` 与 `:143` 是**正文**边界措辞行（`:143` 是 `1. **OCR 独立代码审查一次**：…` 那条），与 `:3` 的 description 是两回事。
- 不适用理由登记在 §6.6 第 1 条的载体④内。

**3. T-006（三条执行卫生规则）—— 给落点。**
- 权威处一处：`AGENTS.md`（`## 本任务新增控制面登记` 与 `## vNext 永久实施边界` 之间，R1 落点）。
- 五阶段各引用一次：`workflows/{make-decision,build-prd,build-plan,build-code,verify-code}/SKILL.md` 各一处引用句（§6.1 第 19 行只登记了 build-code；其余四个同属批 G 的「错开实施」）。
- ⚠️ **R1 写面原文只列 build-code/build-plan 两个**（`DESIGN-v3.md:86`）⇒ 按 T-006 逐字应补齐**五阶段**清单。

**4. T-007（子代理产出契约）—— 给落点。**
- 逐字要求（`decision-log.md:23` T-007=A）：补齐四个阶段技能里缺失的「子代理产出契约」（**先落盘、只回摘要、按子问题增量**）。
- 落点：`AGENTS.md` 通用委派纪律段（`docs/standard-workflow.md` 通用纪律 R4 落点）+ 四个 `workflows/*/SKILL.md` 各一处（与 §6.6 第 3 条同批，即批 D 与批 G）。
- 设计书全文 `产出契约`/`先落盘`/`只回摘要`/`增量落盘` **0 命中** ⇒ 本文件是它的首次落点登记。**2026-09-29 复核实测更正**：该「0 命中」只在**本节撰写时**为真；后续章节把该四词引入本文件后已**自指失效**——重跑 `grep -c "产出契约\|先落盘\|只回摘要\|增量落盘" specs/workflowhub-thin-core-card-03-20260919/design.md` = **19 行命中**；同一四词的 `grep -o` 计数（`grep -o "<上式四词>" … | wc -l`）= **38 次出现**（按上式从左到右分项 18／9／8／3，其中本节 `:1389` **自身**贡献 8 次）；对 `specs/workflowhub-thin-core-card-03-20260919/decision-log.md` 同法重跑 = **16 行命中／32 次出现**（分项 15／7／7／3）；首次命中行为 `:129`、`:1386`、`:1387`、`:1389`、`:1697`、`:1705`。「本文件是它的首次落点登记」以本节撰写时为准。

**5. T-014（G-1 收场）—— 给落点。**
- 逐字：落点＝`workflows/build-plan/SKILL.md` 与 `workflows/build-code/SKILL.md` **两处各写各的角色 + 一处交叉引用**。
- 落点：§6.1 第 20 行（build-code G-1 段）；build-plan 侧并入批 G 的 build-plan 方法章节。原 `:1111` 把 C1 游标引用句与 G-1 收场**混为一谈**，本文件拆成两件事。
- 字段侧：`DESIGN-v3.md:690-696` 的 G-1 行旁注（同 §6.6 第 1 条载体②）。

**6. T-018（snapshot 绑定改动候选）—— 「本卡不做 + 理由 + 留给谁」。**
- **逐字处置**：本卡**不做**以下任何一行；理由＝`decision-log.md:60` T-018=B 逐字「本卡只冻结改动候选清单，真实代码改动等 CARD-04 合并后随 build-plan／build-code 落地」，且 `:378` 逐字把它列为「**推迟写面（本卡不做，留给 CARD-04 合并后的 build-plan／build-code）**」；留给**谁/哪个阶段**＝CARD-04 合并进 main 之后、由本卡的 build-plan／build-code 阶段或后续任务执行。
- **载体＝一张冻结候选清单**（挂在 §6.1 `#19` 行内，逐字取自 `decision-log.md:378`）：
  - `runtime/evidence/quality-fact.mjs:48`
  - `runtime/evidence/canonical-evidence-validators.mjs:251`、`:322-328`、`:397-399`、`:433`
  - `runtime/evidence/research-report.mjs:22`
  - `runtime/evidence/freshness.mjs` 的 `ensureGitSnapshotObjectStore`／`materialRevisionFromValues` import
  - `runtime/stage/stage-runner.mjs`
  - `tools/cli/stage-runtime.mjs` —— **仅限 T-018 的 H-1（快照绑定那套 runtime 语义）**；q7_6 的游标参数化不在本清单内（T-034）
- **残余绑定如实登记**：残留的全量绑定登记给 CARD-06（依据 `decision-log.md:290` 风险项③）；不得在本卡内重新引入哈希绑定、回执、快照、材料身份校验类机器门禁（`decision-log.md:290` 风险项④）。

**7. 排除项（原 `#20`/`#17`）—— 「本卡不改 + 理由」。**
- `workflows/build-code/capture.mjs`、`vitest.config.mjs`、`docs/architecture/complexity-baseline.json`：逐字理由＝这三处不在本设计任何节号的写面内（设计书正文对它们零落点），且**不是** CARD-04 的时序问题 ⇒ 属「本卡不改」，理由**不得**写成「CARD-04 在改它」。
- `tests/contract/repository-inventory.test.mjs`：同上；且 CARD-04 正在并发改它（+4），本卡不出手。
- `skills/decision-log/**`：逐字理由＝本卡在 make-decision 阶段不写任何技能方法章节（T-013③），且该目录的改动属 CARD-04 写面 ⇒ 「本卡不改」。


## §6.7 阶段集合校正（本次新增，登记为事实）

**事实**：母任务 `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` 与本卡 decision-log 的 T-006 反复使用「五个阶段」并列举为 make-decision、build-prd、build-plan、build-code、verify-code。**仓库的正式 stage 集合不是这一组**：

- 运行时封闭枚举：`runtime/task/task-store.mjs:9` 逐字 `const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);`，同一枚举的报错串逐字 `stage must be one of the five formal stages`。
- 仓库文档：`docs/standard-workflow.md:29-38` 的「正式 stage 集合与 cohort 路线」表列出同一组五项，其中 `build-spec` 标注为「（pre/history）」；同文件 `:39` 逐字「`post` 不注册或执行 build-spec；它保留为 pre/history 的正式 stage，而不是死代码。」
- `build-prd` **不是 stage**：`workflows/build-prd/SKILL.md:119` 逐字「Do not add `build-prd` to the canonical five stages or their stage manifests.」；`config/workflowhub.yaml:16-19` 把它登记为 `kind: portable_workflow`。

**本设计的处置**：方法正文（条款 1/2/3/5/6/7/8/9）落在 **post 路线实际执行的四项** —— `workflows/make-decision/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`；另加 `workflows/build-prd/SKILL.md`——它不是 stage，但 `:45` 的 T-003=A 逐字要求「`workflows/build-prd/SKILL.md` 方法章节照样改到位」（该行处置见 §6.1 第 23 行）。`workflows/build-spec/SKILL.md` **不落方法正文**，按「明确不适用理由」记一行（见 §6.1 第 41 行）：`post` 路线不注册也不执行 `build-spec`（`docs/standard-workflow.md:39` 逐字「`post` 不注册或执行 build-spec；它保留为 pre/history 的正式 stage，而不是死代码。」）⇒ 其方法正文留待出现 pre cohort 任务时按 ADR-0034 同一套条款落地。卡面列举里的 `build-prd` 应按 `build-spec` 读——这条只用于识别「五阶段」这一组的措辞来源，**不改变** T-003=A 对 `build-prd` 方法章节的处置。

**对 AC-15 的影响**：AC-15 要求「对五阶段逐一核对」。核对对象改取运行时正式五项；`build-prd` 单列一行，理由逐字引用 `workflows/build-prd/SKILL.md:119`。

**不构成门禁**：本校正仅把一条既有事实写清，不新增校验、不阻断任何推进（SD-17）。

## §6.8 `skills/**` 逐文件 sha 链：消费者地图与本卡「零哈希动作」决定（事实登记）

**用户裁决（2026-09-27，逐字）**：「这个问题的前提条件有问题，**不应该有任何逐文件-sha存在，这是核心的阻塞点！**」

**本卡决定**：本卡**不写、不重算、不回写任何哈希** —— 包括 `skills/spec-plan/skill-bundle.json` 的 `files[].sha256`、`skills/catalog.yaml` 的 `local_bundle_hash`、`repo-skills.manifest.json` 的相关字段。该链属 **OI-013「校验机器彻底全删」** 的删除面：母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:178` 的 OI-013 责任卡含 **CARD-06**（同文件 `:244` 的 FR-29 逐字点名「revision 绑定链、快照树认证、材料身份/哈希/sha 校验、回执（readback）校验均非推进前置」）。**本卡不替 CARD-06 做删除**。

**消费者地图（本次实测；供 CARD-06 的删除清单直接整表引用）**——脱开它，改动 `skills/**` 下任何一个文件都会在这些点变红或直接抛错：

| # | 消费者 | 位置 | 行为 |
| --- | --- | --- | --- |
| 1 | bundle 校验实现 | `runtime/adapters/local-skill-resolver.mjs:83`（`validateSkillBundle`） | 逐文件读 `files[]`；`sha256` 不符即 `throw new Error(\`bundle sha256 mismatch: ${locator}\`)`；`bundleHash` = 归一化清单（按 path 排序）的 sha256 |
| 2 | 契约断言 | `tests/contract/spec-stage-artifact-closure.test.mjs:110-119` | 对 `authoringSkills` 集合（`decision-log`／`spec-specify`／`spec-plan`／`spec-tasks`／`spec-analyze`／`wh-review`）逐个断言 `validateSkillBundle(...).bundleHash === item.local_bundle_hash` |
| 3 | 溯源断言 | `tests/skill-provenance-strict.test.mjs` | 按 `repo-skills.manifest.json` 逐技能调 `validateSkillBundle` |
| 4 | 变异守卫 | `tests/integration/mutation-guards.test.mjs` | 同款遍历 |
| 5 | 运行时闭包 | `runtime/evidence/check-skill-closure.mjs:421`、`:436`、`:651`、`:692`、`:742` | 技能闭包与 catalog 条目逐个校验 |
| 6 | CLI/发布 | `package.json:8` 的 `check:skill-closure` 脚本（`node runtime/evidence/check-skill-closure.mjs`）；`runtime/distribution/skill-bundle-release.mjs:245`、`:291` | 发布构建经 `checkSkillClosure(root)` |
| 7 | 字段必填 | `runtime/schemas/skill-catalog.schema.json:17`、`:22` | `local_bundle_hash` 是 `skills[]` 条目的 **required**，且 pattern `^[a-f0-9]{64}$` |
| 8 | 测试兜底 | `core/__tests__/check-skill-closure.test.mjs:66`、`:223`、`:228` | 仓根整链校验 |

**已知代价（如实登记，不构成门禁）**：本卡的 q7_2/T-028 必须改 `skills/spec-plan/templates/phase-template.md`。改而不回写哈希后，上表 #2/#3/#4/#5/#8 与 `check:skill-closure` 会红或抛错，直到 CARD-06 落地。这些红是**在既有红之上**的——全量基线见 `decision-log.md` 的 `### 九、` 一节（2026-09-27 实测：**83 个测试文件 / 219 条测试红**，全量耗时 68.4 分钟）。按 SD-17，这是本卡的**已知事实**，不作为推进或验收的门禁；验收时按事实登记，CARD-06 的删除清单应把上表整表纳入。

**一条不可用的小路（实测排除）**：`validateSkillBundle` 已支持 `files[]` 用纯字符串（无 `sha256` ⇒ 跳过逐文件校验），但 `skills/catalog.yaml` 的 `local_bundle_hash` 是 **schema 必填**且 #2 仍会比对该值 ⇒ **「只让 spec-plan 一个技能退链」跑不通**；要么整链删除（CARD-06），要么整链回写。本卡选前者，故本卡零哈希动作。

**为什么不现在删**：删除面横跨 `skills/**` 的 bundle 格式、`skills/catalog.yaml` 全部技能条目、`runtime/schemas/skill-catalog.schema.json`、`runtime/adapters/local-skill-resolver.mjs`、`runtime/evidence/check-skill-closure.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`repo-skills.manifest.json` 与上表 5 个测试文件 —— 属母 PRD 的 **Group 2（CARD-06）写面**，本卡（Group 1）不提前实施；只把地图交出去。


---
## §7 需要用户裁决的决策点

> **v2 重做（F7.1/F7.2）**。v1 原有六条，其中**两条已被实测答案消解**，不再问用户（见 §7.0）；剩下四条保留并按 F7.2 补全「大白话 + 选项 + 含义/后果/风险 + 推荐」，另**新增两条**（一条是 v1 §5.5 里那两条改动前就已红的测试要不要顺手处理；另一条是下面 §7-6：build-plan 期间「现在到哪一步」没有合法载体，于是被自造）。**六条都有真实取舍，我不替你决定。**

### §7.0 已被实测消解、不再问用户的两条（F7.1）

| v1 的决策点 | 为什么不再是决策点 | 依据（已核实） |
| --- | --- | --- |
| v1 §7-2「phase 模板加 11 个还是 5 个字段」 | 已裁决 **D-FIELD = A**：只加真正新的 **4** 个字段（`Progress cursor`、`Carry-over from spec`、`Read set / first look`、`Acceptance inline`），其余 **7** 个一律不加（理由逐条见 §3.2）。"11 个全加"与"只加 5 个"两个选项都已不存在 | 本卡 `decision-log.md` 的 D-FIELD=A 裁决；`design-blue-conflicts.md` §A.1 逐字段判定 = **成立 4 个 / 不符（同义已有）7 个** |
| v1 §7-4「要不要严格做到一次调用回答四问」 | 该机制**已在 HEAD 上发货**（证据表见 §4.1），本卡能承诺的只有「读一次 `status --action=begin` + 数 `phases/index.md` 行数」这一档；要严格一次调用就得改 `status` 返回体，那要动正被 CARD-04 改的 `tools/cli/stage-runtime.mjs`（§6.2 重叠清单），本卡不做 | §4.1 / §4.7；`tools/cli/stage-runtime.mjs:1574-1604` 返回体实测**无任何 phase 计数键** |

**说明**：这两条不是"被否决"，而是**问题本身已经不存在**——一个是用户已经裁决、一个是现状已经给出答案。把它们从决策点里移除，§7 剩下的每一条才是真正需要你花时间定的。

### §7-1 `docs/stage-atomic-step-inventory.md` 里两个阶段的步骤清单还是旧顺序，而它已经让一条基线测试是红的——本卡要不要顺手改？

**问题（大白话）**：材料里那份"每个 stage 有几个 step、分别叫什么"的清单，`make-decision` 与 `build-plan` 两段还是**旧 slug / 旧顺序**，而真正在跑的 `workflows/*/steps.json` 已经是新的。两份材料互相矛盾——而且这个矛盾**在本卡动任何一行之前就已经让一条测试是红的**。

**已核实的红事实（实跑，不是推断）**：

- 命令 `npx vitest run tests/p0-foundation-contracts.test.mjs` → `EXIT_CODE=1`；失败点 `tests/p0-foundation-contracts.test.mjs:55` 的 `expect(documented.size).toBe(actual.size)` → **`expected 69 to be 68`**（文档侧 69 条 step、真实侧 68 条）。
- 根因就在该文档的两段：`docs/stage-atomic-step-inventory.md:13-26`（make-decision 段，14 行）与 `:42-54`（build-plan 段，13 行）。
- 逐字例（旧值）：`:15` = `make-decision | 3 | talk-round-1`、`:44` = `build-plan | 3 | testing-system-blueprint`、`:53` = `build-plan | 12 | publish-plan-result`；真实值是 `workflows/make-decision/steps.json` 第 3 步 `research-and-diverge`，`workflows/build-plan/steps.json` 第 3 步 `spec-clarify`、第 12 步 `publish-result-and-confirm`。
- **这条红与 CARD-03 无关**（本卡不改这两份文件）；是否顺手消掉，由你定。

- **选项 A（推荐）**：本卡顺手把这两段同步成真实顺序（约 27 行）。含义：把存量红消掉；本卡正好要动 build-plan 的字段清单，上下文已经在手上。后果：改完这条测试转绿。风险：改动面比"只改模板"大；且 `docs/stage-atomic-step-inventory.md` 在 §6.2 的 CARD-04 重叠清单里 —— **必须与 CARD-04 排队**。
- **选项 B**：本卡只**登记**这条红事实（写进设计书 + `decision-log.md`），不改文档。含义：严格守住"本卡只动该动的"。后果：红继续存在，但至少被如实记录、不再是"没人知道"。风险：下次谁读这份清单还会被带偏；而且本卡跑验证命令时会混着一条本来就红的测试，容易被误读成本卡引入。
- **选项 C**：本卡把这两段的 27 行**换成一句指路**——"各 stage 的步骤清单以 `workflows/<stage>/steps.json` 为权威"。含义：不再复制、不会再漂移。后果：文档显著变短。风险：删正文属较大改动，该文档其它段落仍是逐行列表、形态会不一致；而 `tests/p0-foundation-contracts.test.mjs` 是**按行解析**这份文档的（`:55` 比较集合大小），换成一句话很可能让这条测试变成**另一种红**。

> v1 的这条只问了"要不要顺手改"，**没有说这条测试现在就是红的**，也没给行号与真实 slug；v2 按 F7.2 补齐。

### §7-2 `Acceptance inline` 到底内联到什么程度？（这是 G-7「每次回读 149KB spec」的解法边界）

**问题（大白话）**：CARD-04 那份 `spec.md` 有 149,322 B / 634 行（**跨 worktree 引用**：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919` 的 `specs/<card-04-task-id>/spec.md`；**2026-09-29 复核更正**：该 worktree 目录整体已删除，CARD-04 材料改引归档 `specs/archive/workflowhub-thin-core-card-04-20260919/`，归档副本为更晚版本（实测 179416 B / 676 行），故此处 149,322 B / 634 行是当时实测值、现已不可复核），验收正文全在 `Appendix A`（从 `:503` 起），测试时每次回读很贵。phase 文件里要不要把验收判据抄一份？

- **选项 A（推荐）**：只内联**引用行**——`AC-ID | oracle ID | 证据类型 | spec.md 锚`，判据正文仍只在 `Appendix A`。含义：拿到 AC ID 就能定位，不再全文回读，同时"唯一权威"不动。后果：G-7 的成本从"读 149KB"降到"读一行"。风险：锚点写错时子代理要回去找（一行锚点比整份 spec 便宜得多）。
- **选项 B**：连 `通过：`/`失败：` 判据正文一起内联。含义：phase 文件自足。后果：完全不用回读 spec。风险：**同一判据出现两份副本**，一旦不同步就是新的矛盾源，且与"所有可判定验收正文只在 `Appendix A`"（`skills/spec-specify/templates/spec-template.md:7-8`）冲突。
- **选项 C**：只写 AC ID 列表。含义：最小改动。后果：改动小。风险：只给 ID 不给 oracle 与证据类型，测试作者仍要回读 spec 才知道"用哪个 oracle 判"，G-7 基本没解决。

### §7-3 worktree 根那几份"别的任务的进度文本"要处理到什么力度？

**问题（大白话）**：card-03 的 worktree 根目录摆着 `progress.md`、`task_plan.md`、`findings.md`（三份属 `workflowhub-mechanism-simplification-t2-20260911`）、`HANDOFF-make-decision.md`（属 card-02）、`HANDOFF-make-decision-card07.md`（属 card-07），另有 `.planning/.active_plan`（属 card-04）——内容写的都是**别的任务**的"当前 phase"，而**没有任何规则禁止阅读它们**。这就是"执行着就遗漏了进度"的物理原因之一。

- **选项 A（推荐）**：只加指针、不碰文件——phase 文件头部写 `Progress cursor`（`facts.jsonl#build-code.phase_progress`），ADR-0034 里写"根目录零参数文本属别的任务，不是本任务的进度"。含义：让正确来源一跳可达。后果：零破坏。风险：不看这两处的人仍可能去读旧文本（但那时他手上已有一条命令的答案）。
- **选项 B**：本卡把它们删除或改名。含义：物理清掉误导源。后果：根目录立刻干净。风险：**会改别的任务的状态**；且历史证明删除不可持续（`c835bf43…` 2026-09-05 删过一次，9 天后 `c33acd3b…` 2026-09-14 又提交回来）。
- **选项 C**：在仓库根加一份"读进度先看这里"的说明文件。含义：正面引导。后果：新人一眼能看到。风险：新增文件属新增控制面（`AGENTS.md` 要求登记 consumer/owner/替代关系/删除条件），而且它自己又会变成一份"根目录零参数可读的进度文本"。

### §7-4 `workflows/build-plan/SKILL.md:209-215` 的 phase 字段清单要不要跟着模板一起改？

**问题（大白话）**：模板这次加了 4 个字段，而 `workflows/build-plan/SKILL.md:209-215` 里也逐字列了一遍 phase 文件该有什么（逐字含 `a stable pointer to the spec global goal, its own exact write set and dependency, RED/GREEN tasks, test tier/skill/scenario/fixture, \`gate_cmd\`, expected exits, oracle, evidence path, coverage limit, STOP, done evidence, and rollback`），两处不同步就等于留下第二份会漂移的清单；但那个文件里还藏着五条**定距正则**（`tests/contract/post-cohort-executable-authoring.test.mjs:65-69`，落在 `for (const source of [workflow, author])` 里，`workflow` = `workflows/build-plan/SKILL.md`、`author` = `skills/spec-plan/SKILL.md`），按字符距离匹配，插字可能把匹配位置推远。

- **选项 A（推荐）**：同批改、并立刻跑该契约测试，且只在既有清单**末尾追加**字段名、不在这五条正则涉及的两句之间插字。含义：一次改齐、当批验证。后果：清单不漂移。风险：正则若仍超距，就要调整追加位置（一次小返工）。
- **选项 B**：只改模板，SKILL 里的清单不动。含义：改动最小。后果：模板与 SKILL 清单不一致，下次 build-plan 会出现"按字段写"和"按 SKILL 清单写"两套。风险：正是用户抱怨的那类漂移。
- **选项 C**：把 SKILL 里那段清单删掉，改成"字段清单的权威在 `skills/spec-plan/templates/phase-template.md`"。含义：单一权威。后果：以后只改一处。风险：删正文 + 定距正则风险更大，且 `:209-215` 附近还有其它契约要求（RED/G-2 等）与它同段。

### §7-5（新增，F7.2）§5.5 里那两条"改动前就已经红"的契约测试，本卡要不要顺手处理？

**问题（大白话）**：§5.2 登记了两条**与本卡无关、但现在就是红**的契约测试：一条是 `tests/contract/build-code-apply-contract.test.mjs` 期望的 kinds/paths 与实测不符；另一条更麻烦——`tests/contract/review-step-forward-progress.test.mjs` 要求 build-code 有 `final-integration-review`，而 `tests/contract/stage-routing-and-concrete-testing.test.mjs:177` 又明令 `not.toContain("final-integration-review")`，**两条契约测试互相矛盾**。它们不在本卡改动面内，但只要跑相关测试就会看到。

- **选项 A（推荐）**：**只登记、不修**——把红事实写进设计书与 `decision-log.md`，注明"既有红，非本卡引入"，并指明两条测试互相矛盾。含义：本卡守住最小改动面。后果：红留着，但来源清楚。风险：下一个人仍会踩到，除非他去读登记。
- **选项 B**：本卡顺手修掉（改 `tests/contract/build-code-apply-contract.test.mjs` 与 `tests/contract/review-step-forward-progress.test.mjs` 的期望值，或改 `workflows/build-code/steps.json` 让两边一致）。含义：让这两条转绿。后果：测试面变干净。风险：**必须先判定"哪一边才是对的"**——这是产品裁决，不是文案修改；改错一边就是把一条现在绿的测试弄红。
- **选项 C**：只消掉**自相矛盾的那一对**（把 `tests/contract/review-step-forward-progress.test.mjs` 的要求与 `tests/contract/stage-routing-and-concrete-testing.test.mjs:177` 对齐），kinds/paths 那条留作登记。含义：先消除"两条测试互相矛盾"这个最刺眼的事实。后果：矛盾消失。风险：仍是产品裁决（要决定"build-code 到底有没有 `final-integration-review`"），且改测试期望值可能掩盖真实实现漂移。

### §7-6 build-plan 期间的「现在到哪一步」没有合法载体，于是被自造——只写禁令，还是给它一个载体？

**问题（大白话）**：build-plan 这个阶段只写三样材料（`spec.md`、`phases/P<n>.md`、`phases/index.md`），而这三样**明文不许写执行状态**（`skills/spec-plan/templates/phase-template.md:52`、`skills/spec-plan/SKILL.md:14`、`skills/spec-tasks/SKILL.md:8`）。唯一合法的进度载体是 `facts.jsonl` 里那一行 `phase_progress` 游标，而它被逐字锁在 **build-code** 的 stage 行上（`runtime/task/task-store.mjs:336`：`phase_progress is only supported on build-code stage rows`；`AGENTS.md:58-59` 也是按 build-code 写的）。于是「现在到哪一步」这个问题，在 build-plan 期间**没有合法答案**。card-05 实测里，那个 agent 的反应是自己造一个：一张 13 步自评表、5 个自造的复合状态串，还把它发布成了持久化 evidence（`F-buildplan-sessions.md:286-296`）。

**先说结论**：**合法载体不存在**。这不是疏漏，是 `AGENTS.md:57-59` 加 `runtime/task/task-store.mjs:336` 的直接推论。所以本卡能做的只有两类事：**明文禁止自造 + 规定唯一允许的写法**（A/C），或者**给它一个真载体**（B）。B 不是本卡能自己决定的事。

**已核实的事实**（逐字与行号见本补丁 P2-1）：
1. 现有三条禁令**各自只禁一个具体文件**（phase 文件、index），**没有一条禁「另建一个新载体」**——F-2 的行为正好落在这个缺口里：它没往 `phases/P<n>.md` 里写状态表，它**另建了** `research/build-plan-step-audit.md`，并**把它发布成了 quality evidence**（`quality/evidence/build-plan-step-audit/8f82c98a…json`，`recorded_at: 2026-09-22T08:06:23.387Z`）。
2. 它用的不是「新词」，是**复合状态串**：8 种取值里 5 种是自造的限定词拼接（`completed，带缺口`、`completed in session；正式交互事实 unavailable`、`completed as material；语义认证 incomplete`、`completed with disclosed limit`、`completed in independent context；正式质量记录 unavailable`），另 3 种是裸枚举值，其中一个（`not_applicable`）根本不在 layer 的状态表里（`runtime/task/task-store.mjs:229` 只有 `completed` / `unavailable` / `incomplete` / `partial`）。
3. 那张表自己也写了**「非权威研究证据」**，事后（`08:43:30`）agent 承认它会**误导接续**——也就是说，它既没被当成权威，也没能阻止自己被读成权威。

**选项 A（我的推荐）：明文禁止自造 + 规定唯一允许的写法。只改文档，零机制。**
- 含义：在 `workflows/build-plan/SKILL.md:148` 之后新增一段文字（逐字见 P2-4/§4.13），并在本设计书 §4 新增 `### §4.13` 引用它。**`AGENTS.md` 一字不动**（§1.0 的 T-019=B 写入预算恰好三条，`DESIGN-v2.md:47`）。
- 后果：`git diff` 只多两处文档文字；没有新校验、新命令、新 schema、新持久对象、新门禁。
- 风险：**纯纪律，没有技术阻断**。下一个 agent 仍可能自造一张表——它只是被明文禁止，不会被机器拦住。这个风险在本卡内**无法消除**，除非选 B。

**选项 B：把 build-plan 纳入那一行 `phase_progress` 游标的适用范围，给它一个真载体。**
- 含义：改 `runtime/task/task-store.mjs:228`（`BUILD_CODE_PROGRESS_ROW_KEYS` 键集）与 `:336`（写入守卫）、`tools/cli/stage-runtime.mjs` 的派生与 `status` 返回体、以及 `tests/contract/stage-progress-contract.test.mjs`（211 行）；并且**必须**同步改 `AGENTS.md:58-59` 那两行「唯一进度例外」的措辞，否则条文与实际不符。
- 后果：`build-plan` 真的有一个合法进度载体，agent 不必猜；「到哪一步」这个问题有了机器可读的答案。
- 风险（三条，按严重度）：
  - **① 撞车**：`tools/cli/stage-runtime.mjs` 正是 CARD-04 在改的文件（本设计书 §4.6 `:842-845` 与 §6.2 重叠清单已记，`diff --stat` 含 `tools/cli/stage-runtime.mjs | 7 +`）。两个卡同一批改同一个公开 CLI 的返回体，冲突与半成品状态都会落到用户手上。
  - **② 语义冲突（这条最硬）**：build-code 的 `phase_progress` 指的是**正在执行的 phase**；build-plan 的 phase 是它**正在写**的产物。同一个 `phase_id` 键在两个阶段会表示两件不同的事，读的人**无法凭键分辨**。B 必须先回答「这个键指哪一个」，否则载体有了、语义反而更糊。
  - **③ 越预算**：B 必然要动 `AGENTS.md:58-59`，那两行是用户已裁决的边界文本（`DESIGN-v2.md:45`/`:47`：T-019=B「只给最贵的三条」，明确拒绝条款膨胀）。⇒ B 不是卡内能拍的事，**必须回到你**。

**选项 C：在 build-plan 的入口写一句「本阶段不保存执行状态，进度去 existing facts / `status` 问」的纯指针声明。**
- 含义：落点与 A 相同，内容不同——A 写的是「禁自造 + 唯一写法」，C 写的是「进度不在这里 + 去哪儿问」。
- 后果：读者一眼知道该去哪儿问，不必自己猜一个载体出来。
- 风险：**①与 A 高度重叠**（同落点、同主题），并列只会让条文变长；**②它本身是「第三份进度说明」**：`AGENTS.md:57` 已经写死 build-plan 的写集、`:59` 已经写死「唯一进度例外」，再补一份指针就是重复控制面，而 §4.8 的设计原则恰恰是「引用已有条文，不复制」。⇒ C 作为独立选项不成立，**建议并入 A**（A 的逐字文本里已经含「去哪儿问」那一句）。

**我的推荐（不代表你的决定）**：**A**。理由：合法载体确实不存在（`runtime/task/task-store.mjs:336` + `AGENTS.md:58-59` 的直接推论）；A 是唯一不新增任何控制面、不动 `AGENTS.md`、不与 CARD-04 重叠的选项；C 与 A 同落点同主题，合并即可；B 是唯一能真正给出载体的选项，但它三条代价（撞 CARD-04、`phase_id` 语义歧义、动 `AGENTS.md:58-59`）都必须**先由你裁决**。

**这条我不替你决定**：如果你要的是**物理上有答案**，而不只是「明文禁止自造」，那就只有 B——而走 B 之前必须先解掉 `phase_id` 的语义歧义（是「正在写的 phase」还是「正在执行的 phase」），并先和 CARD-04 排好 `tools/cli/stage-runtime.mjs` 的队。

---

> §7 的每一处"推荐"都只是我的判断，**最终口径由你定**；裁决之后，§6.3 的批次与 §5.5 的验证命令按结果收敛（其余条目不必重排）。

## §8 自我否决

设计过程中我自己砍掉的方案（至少记下否决理由，避免以后有人重新提出来）。**v2 按 F8.1 处理：保留原八条，其中第 ④ 条的表述已按 D-FIELD=A 改写（原来的"扩键"提法与"给模板加看起来合理的字段"是同一类错误，合并成一条），第 ⑥ ⑧ 条的交叉引用失效已修正；末尾新增 ⑨ ⑩ 两条教训。**

1. **在 `phases/P<n>.md` 里加"进度状态区"**。诱因：用户说"通过 phase 文件就能知道当前进度是什么"，最直觉的做法就是在 phase 里放一个状态格子。否决理由：`skills/spec-plan/templates/phase-template.md:52` 与 `skills/spec-plan/SKILL.md:14` 明文禁止执行状态进作者文件；替代物是头部 `Progress cursor` 指针（逐字草案见 §3.1）+ §4 的既有命令读回——**指针不是状态**。
2. **往 `phases/index.md` 加一列（状态/进度/owner）**。诱因：index 一行一 phase，加列最省事。否决理由：`skills/spec-tasks/SKILL.md:8`（index 不是 progress ledger）+ index 模板的五个禁词（`gate_cmd`/`expected_exit`/`oracle`/`evidence_path`/`execution status`，见 §3.8）。
3. **新增一条 public 命令（`phase-status`/`phase-progress`）或给 `run` 加一个新 action**。诱因：读进度最干净的做法是一条专用命令。否决理由：`AGENTS.md` 只允许七类 public 命令，`phase-*` 必须私有；而 `status --action=begin` 的返回体已经含三问答案（§4.7）。
4. **把 `phase_progress` 的 4 键扩成 5 键（加 `step`、`percent` 或 `index`），或给 phase 模板加"看着合理、但没人消费"的字段**（v1 这里是"11 个字段全加"那一类提法）。诱因：4 键答不出"这个 phase 的第几步/百分比"，而多一个字段看起来总是更完整。否决理由：①`runtime/task/task-store.mjs:241-253` 的 `exactKeys` 是全等校验，多一个键直接抛错；②"历史序列/百分比"被 `AGENTS.md` 明确禁止；③模板侧同理——D-FIELD=A 只留 4 个**真有消费者**的新字段，其余 7 个不加（逐条理由见 §3.2），**"字段越多越完整"本身就是被否掉的思路**。
5. **用输入哈希/材料摘要做审查去重的判据**。诱因：实测 `review record` 6 条逐字重复、1369.3s，哈希比对看着最可靠。否决理由：已否决清单里"内容寻址哈希 / receipts / 快照 lineage"一律不许重新提出（治理硬约束）；改用"当前事实里是否已有同一 `phase_id` 的 `phase_review` 结果 + 该 phase 的实际改动文件是否变过"（口径见 `workflows/build-code/steps.json:12` 的追加句）。
6. **本卡连 `workflows/build-code/SKILL.md` 一起改**（v1 曾写成"§4.6 那一段：追加三句、唯一新增的行为要求"）。诱因：游标的写入时机最自然的家是那份 SKILL。否决理由：①该文件里 `:245-250` **已经有**同义的写入条文，追加就是重复（§4.8）；②CARD-04 worktree 当时实测改了同一文件（`+24` 行，已随合并点 `97092b30` 落地）→ 改为"冻结候选"（§4.8 的 C1：只在 `:203-208` 末尾追加一句**引用**），本卡实做的只有不在其写面的 `workflows/build-code/steps.json:5`。
7. **为本设计新建契约测试文件**。诱因：新字段需要新断言，新建最干净。否决理由：CARD-04 正在做测试资产治理（`docs/architecture/test-asset-governance-rules.md`、`tests/contract/build-code-test-inventory.test.mjs` 等当时只在它 worktree 里，且该文件当时在主树不存在；**2026-09-29 复核更正**：card-04 已并入 main，`tests/contract/build-code-test-inventory.test.mjs` 现存在于本卡 worktree（6988 B），该否决理由已随合并失效，但「扩写既有契约测试」的处置仍成立），新建测试文件会与它的 inventory 撞车 → 改为扩写既有契约测试的断言（§6.1 的 #12/#13）。
8. **让 phase 文件"自足"到完全不用读 spec**（把 `spec.md` 的 §2 节结构内容整体复制进每个 phase）。诱因：用户希望子代理"不翻别处就知道答案"。否决理由：会产生 N 份会漂移的副本，与 `skills/spec-specify/templates/spec-template.md:7-8`（叙事主干唯一 + `Appendix A` 是可判定验收的唯一权威）冲突；本设计改为"指针 + 引用行"——`Read set / first look`（§3.4）与 `Acceptance inline`（§3.5）。**注意：`Global goal pointer` 已按 D-FIELD=A 删除，不在本设计里**（目标指针由模板 `:9-10` 的 L0 括号说明承载，见 §3.2）。
9. **（新增，F8.1）把"已经发货的机制"当成"本卡要设计的东西"**。诱因：用户第 3 问的措辞像是在要一个新机制，照着写下去最省事。否决理由（教训，＝ BL-2）：`phase_progress` 的四键游标在 HEAD 上**已经 100% 实现**（证据表见 §4.1），本卡真正新增的只有 `workflows/build-code/steps.json:5` 的一句措辞。**教训：先核现状，再写设计**——否则整节 148 行描述的是现状，不是设计。
10. **（新增，F8.1）用审计推断值充当实测口径**。诱因：审计报告里的"降低 X%"读起来像结论，直接抄进收益栏最省事。否决理由（教训，＝ HI-2）：审计报告的收益量级**全部是推断值**（§0 与 §1.3 已逐处标注"推断值，不作为验收指标"），且实测数字与推断百分比**不得同表混算**。**教训：收益一栏要么标推断，要么留白。**

---

## §9 修改溯源表

本表把 `/tmp/wh-card03-design/FIX-LIST.md` 的**每一条 F 编号（F1.1–F9.9，共 40 条）**对到 v2 的行号、改法与依据。行号一律指**本文件当前版本**（可用 `sed -n 'Np' /tmp/wh-card03-design/DESIGN-v2.md` 复核）；「依据」列的报告都带行号，路径为 `/tmp/wh-card03-design/<报告名>`。v1 的行号指 `/tmp/wh-card03-design/DESIGN.md`（v1 保持未改动，随时可对照）。

### §9.1 逐条溯源

| F | 改在 v2 的哪几行 | 怎么改的 | 依据（报告:行号） |
| --- | --- | --- | --- |
| **F1.1** | `:116`、`:121`（R3）；`:129`（R3 写面口径）；`:136-137`、`:147`（R4）；`:195`（R8）；`:245`（R11）；`:285`（R13 写面）、`:344`（§1.E.2 写面）；`:310`、`:311`、`:315`（§1.x 表 R3/R4/R8 三行） | v1 四处「就地扩写 `docs/standard-workflow.md:88`」**全部改掉**：R3/R4/R8 的落点逐字写成「**新行落在 `docs/standard-workflow.md:92` 之后，不改动 `:88-92` 任何一个字**」；R3 的草案从「把 `:88` 首句扩为…」改为**独立新增行**，并加了一条「写面口径」说明（本条不是就地扩写）；R8 的草案标题同步为「新增行，紧接 `:92` 之后」；§1.x 表 R3/R4/R8 三行的「主要落点」列同步改成 `:92` 后。（**注（v4 追加）**：本节 §6.5「更正二」已进一步把 R3/R4/R8/R11 的落点改述为「**`:93` 及之后新增行，`:88-92` 一字不动**」；§6.1 第 11/12 行与批 D 行已按此更新，**以 §6.1 与 §6.5 为准，本行的 `:92` 后是 v2 时点的历史记录**。）全文 `standard-workflow.md:88` 只剩 `:116`/`:121` 两处，且都用来声明**禁改区**，不再有任何一处以它为落点 | `decision-log.md:35` 第(3)条逐字「**禁区（勿改）**：`docs/standard-workflow.md:88-92`（尤其 `:91`）…本卡不得改动这五行」；`:52`/`:290`/`:293`/`:294` 四处重复；`design-red.md` BL-1；FIX-LIST F1.1 |
| **F1.2** | `:88-117`（R2 全段）；关键句 `:95`、`:98`（草案逐字）、`:108`（判据口径）、`:109`（第二落点现状）、`:110-113`（三个读取点逐点处置） | R2 的落点改为**双落点**：`docs/standard-workflow.md:334-338` **与** `workflows/build-code/steps.json:15`。①草案里**只**保留用户裁决的口径「只留**该 phase 声明的写集**」（即该 phase 的 `Write set` 路径本身），**不得**展开成「+ 本次实际改动的文件 + 受影响的检查」——那是影响集口径；也**没有**换成 v1 的「绑定当前材料版本 + 实际影响集」；②新增「如实写明第二落点现状」：`workflows/build-code/steps.json:15` 是 step 11 的 `observable_result`，**当前不含任何绑定语义**（`grep -c snapshot` = 0），v1 写「`:15` 已要求绑定当前 snapshot」是错的；③`steps.json:15` 的改法写成「在既有句子上**追加**，原句逐字保留」；④三个读取点逐点给判定：`tests/contract/stage-routing-and-concrete-testing.test.mjs:164-165`（`:164` 取 observable_result、`:165` 断言其含 `current task facts is marked completed only when…` → **只能追加、不得改动或重排**）、`tests/e2e/vnext-five-stage-current.test.mjs:499`（只按 slug `authenticate-current-task-completion` → 不动 slug 即不红）、`docs/stage-atomic-step-inventory.md:65`（行内不含 snapshot → 不改） | `decision-log.md:52`(T-010=A) 逐字；`:293` acceptance 逐字；`:424` 验收行逐字；`workflows/build-code/steps.json:15` 全文件 `grep -c snapshot` = 0（本卡 worktree 实测）；`design-red.md` BL-3；FIX-LIST F1.2 |
| **F1.3** | `:14`（表头改为「预期收益（**审计推断值**）」）；`:26-33`（数字口径校正段）；全文件 **15 处**「推断值，不作为验收指标」就地标注（`:14`、`:28`、`:29`、`:30`、`:31`、`:33`、`:84`、`:114`、`:161`、`:189`、`:209`、`:238`、`:253`、`:412` 等） | ①表头「A 的实测口径」→「**审计推断值**」；②紧跟表后加「本表的数字口径（校正一次，全文件适用）」段，逐字引 A 报告 §4.5「收益量级全部是推断值」与 `/tmp/wh-card03-session-analysis/talk-decision-record.md:30`「全部是**推断值**」、`:71`「**不作为本卡验收指标**」；③凡出现百分比处就地补「**推断值，不作为验收指标**」；④**实测数字与推断百分比分表**：实测口径（token/墙钟/turn 数、浪费秒数）只在 §1 各根因的「实测」句里出现，推断收益只在「受益/推断值」句里出现，两套数字**没有同表混算** | `design-red.md:67` 的最小反例（「20–25%」追到 `s0922b.md:319`，再对照 `talk-decision-record.md:30`/`:71`）；A 报告 §4.5 逐字；FIX-LIST F1.3 |
| **F1.4** | `:45-67`（新增 §1.0 全节）；条③逐字在 `:57-63`（`:55` 与 `:62` 提到 `finding_dispositions`） | 新增「§1.0 `AGENTS.md` 的写入预算：恰好三条（用户裁决 T-019=B，**不得扩张**）」：①禁止子代理继承父代理全部对话；②禁止空转轮询；③**「声明不实怎么被发现」**——逐字写「失败与不实事实由独立审查判定，写入当前 stage 行的 `finding_dispositions`（五值枚举见 `runtime/stage/completion-predicates.mjs:124`），**只能记录、不成门**」。5 处插入点（`:36-40`/`:131-132`/`:181-182`/`:197`/`:355`+`:362`，v1 行号）全部压回**恰好 3 条**，其余「可观察形态」写法**没有**扩散到 R7/R10/R11/R16；R11 明确写「**不占 `AGENTS.md` 三条预算**」，改落 `docs/standard-workflow.md:92` 后 | `decision-log.md:61`(T-019=B) 逐字「只给最贵的三条——①禁子代理继承父代理全部对话 ②禁空转轮询 ③「**声明不实怎么被发现**」…被拒：A（条款膨胀）」；`:424` 再现；`runtime/stage/completion-predicates.mjs:124` 逐字五值集合（本卡 worktree 实测）；`design-red.md` HI-5；FIX-LIST F1.4 |
| **F2.1** | `:433-550`（§2 全节）；`:437-447`（§2.0）；`:448-514`（§2.1 目标节序列）；`:515-520`（§2.2）；`:521-538`（§2.3 逐条复核）；`:539-550`（§2.4 验证命令） | §2 无 blocker，只做两件事：①凡引用 `docs/standard-workflow.md:88-92` 处按 F1.1 的统一措辞处理（§2 内已无「就地扩写禁改区」写法）；②§2 引用的每一处 `路径:行号` 按 Part 9 / §9.2 复核并补全为可解析路径（`tests/contract/spec-stage-artifact-closure.test.mjs:73-77`、`:87`、`tests/contract/post-cohort-authoring-files.test.mjs:31-33`、`tests/contract/post-cohort-spec-design-authority.test.mjs:15`/`:27` 等）。§2.3 另加一句：五个索引禁词的对象是 `skills/spec-tasks/templates/index-template.md`，**不作用于** spec 模板 | `design-red.md`（§2 是唯一真实交付面之一）；`design-blue-conflicts.md` A.3 末段（index 模板五个禁词）；FIX-LIST F2.1 |
| **F3.1** | `:556-567`（§3.0 用户五问落点）；`:568-581`（§3.1 头部与 L0）；`:643-687`（§3.6 逐字段清单表，已重做为 **4 行**新增字段） | §3.6 的 11 行字段表**重做为 4 行**，只留：`Progress cursor`（Phase 头部 `:6` 后）、`Carry-over from spec`（L1 `:15` 后）、`Read set / first look`（L1 `:17` 后）、`Acceptance inline`（L1 `:21` 后）；表里逐行给出「插入位置、逐字草案、会不会让哪个契约测试变红」；其余 7 个字段（`Phase goal`/`Delta vs other Phases`/`Global goal pointer`/`Execution waves`/`Critical path`/`Entry conditions`/Task `Goal`）**全部删除**，并在 §3.2 成段说明为什么不加 | `design-blue-conflicts.md` A.1（逐字段判定：**成立 4 个**）；`decision-log.md:54`；FIX-LIST F3.1 |
| **F3.2** | `:582-599`（新增 §3.2「为什么不加那 7 个字段」） | 成段说明，**逐条给现模板的承载证据**：`skills/spec-plan/templates/phase-template.md:9-10`（`## L0` 段）括号说明逐字已承载 Phase goal / Delta / Global goal pointer 三者；`:19` `Task order` 括号逐字含 `explicit earlier dependencies and serial/parallel reason`；`:5`/`:29`/`:34` 已承载 Entry conditions；`:26` 标题 `[next globally unique Task ID and one observable result]` + `:28` `Source / FR / AC` 已承载 Task Goal | `design-blue-conflicts.md` A.1「不符（同义已有）7 个」逐条括号说明原文；FIX-LIST F3.2 |
| **F3.3** | `:604`（§3.3 末句）；`:675`（§3.6 Task 卡行）；`:695`（§3.7 G-2 处置行） | v1 的 Task 卡 `Goal` 草案（v1 `:555`）与 `Action` 收紧草案（v1 `:563`）**一并删除**；§3.6 表里对应「会让哪个契约测试变红」的行随之删掉；新增一句「v2 任何地方都**不再**出现 `- **Goal**:` 这一条目」。Task 卡（`skills/spec-plan/templates/phase-template.md:26-48`）改为**逐字不动** | FIX-LIST F3.3；`design-blue-conflicts.md` A.1 中 Task `Goal` 属「不符（同义已有）」 |
| **F3.4** | `:683-684`（§3.6 断言表两行）；`:720`（§3.8 定距正则提醒）；`:728`、`:735`（§3.9 验证命令两条） | 把两处**距离型断言**补进「验证命令」清单并逐条给判定：①`tests/contract/material-producer-consumer-roundtrip.test.mjs:17` = `expect(phaseTemplate).toMatch(/L0[\s\S]{0,120}(?:Goal\|目标)/i);`（**L0 之后 120 字符窗口**）→ 判定：`Progress cursor` 插在 Phase 头部 `:6` 后**不影响** L0 之后的窗口（L0 在其后），但 `Carry-over from spec` 插在 L1 `:15` 后会落在 `## L0` 之后 120 字符内，**若插在 `:15` 之后而 L1 首字段是 Goal 类词则可用**——按现模板 `:15` 是第 2 个 L1 字段、`## L1` 与 `:15` 的距离必须实测，故本条写成「**必须先量距离再落盘**」；②`tests/contract/phase-quality-handoff.test.mjs:109` = `expect(tasks).toMatch(/Do not copy its L0\/L1\/L2 body[\s\S]*execution status/);` → 判定：该正则跨「Task 卡区首句 → 模板尾注」的**长距离**，新增 4 个字段都在其**之前**，不会截断两端的相对顺序，**成立**但同样要跑 | `design-blue-conflicts.md` A.3（`tests/contract/material-producer-consumer-roundtrip.test.mjs:17` 的 120 字符窗口；`tests/contract/phase-quality-handoff.test.mjs:109`）；`design-red.md` HI-4；FIX-LIST F3.4 |
| **F3.5** | `:605`（§3.3 命名规则里的例外声明）；`:650`（§3.6 表内「不得改动」行） | 明确写「`skills/spec-plan/templates/phase-template.md:4`/`:5` 的两处括号说明**不得改动，改了就红**」——因为 `tests/contract/post-cohort-authoring-files.test.mjs:17-19` 的 `toContain` **大小写敏感**，小写 `write set` / `dependency` 只在这两处括号说明里出现（逐字 `[write set: exact file paths; one owner per path]`、`[dependency: preceding Phase IDs or \`none\`, with serial reason]`） | `design-blue-conflicts.md` A.3（`tests/contract/post-cohort-authoring-files.test.mjs:17-19` 大小写敏感）；FIX-LIST F3.5 |
| **F3.6** | `:600-614`（新增 §3.3 命名与风格）；`:604`（4 处清单） | 定死新增 4 个字段名的风格 `- **Title Case 名词**： [括号说明]`；说明 `Carry-over from spec` 是**唯一例外**（短句非名词短语），并列出模板既有的两个例外（全小写 `coverage limit` 在 `skills/spec-plan/templates/phase-template.md:21`、snake_case `expected_exit` 在 `:40`）；明确「全文只此 4 处」 | `design-blue-conflicts.md` A.4（命名习惯 + 两个既有例外）；FIX-LIST F3.6 |
| **F3.7** | `:569-580`（§3.1 的「不违反模板 `:52` 禁令」判定）；`:653`（§3.6 表内该行）；`:692`（§3.7） | 保留 `Progress cursor` 字段，并给出**不违反禁令**的判定：指针 ≠ 状态。四条依据：值由 `runtime/task/task-store.mjs:241-253` 做四键全等校验（`phase_id`/`task_id`/`material_revision`/`recorded_at`）；只能存 build-code 的 stage row（`:334-337` 非 build-code 行抛错）；phase 文件里是**固定字面量**，不含 P/T 编号、不含 freshness；模板 `:52` 禁的是 "put execution status in this authored file" 与借用他人 task body | `design-blue-conflicts.md` A.2（判定「成立」）；`runtime/task/task-store.mjs:228`/`:236-239`/`:241-253`/`:334-337`（本卡 worktree 实测）；FIX-LIST F3.7 |
| **F4.1** | `:742-757`（新增 §4.0「已实现清单」+ 两张表） | §4 开篇承认「**这个机制在 HEAD 上已经 100% 实现**」并给证据表：(i) **已实现清单**——4 键键集常量 `runtime/task/task-store.mjs:228`；`exactKeys` 严格键校验 `:236-239`；四键 + 三正则校验 `:241-253`（`/^P[1-9][0-9]*$/`、`/^T[0-9]{3,}$/`、`/^revision-[a-f0-9]{64}$/`）；非 build-code 行抛错 `:334-337`；旧游标跨行保留 `:432-436`；写入函数 `tools/cli/stage-runtime.mjs:1004-1061`；读回 `status --action=begin` `:1560-1569`、键在 `:1576`；契约测试 `tests/contract/stage-progress-contract.test.mjs:125`/`:171`/`:206`。(ii) **本卡真正新增的只有 `workflows/build-code/steps.json:5` 的措辞**（`grep -c 'phase_progress' workflows/build-code/steps.json` = **0**） | `design-red.md:13` BL-2；`verify-progress-shipped.md` 质疑(a) 全节（清单与实测）；FIX-LIST F4.1 |
| **F4.2** | `:758-771`（新增 §4.1「因果未解」） | 如实写明写入是**条件性**的：唯一守卫 `tools/cli/stage-runtime.mjs:1871 if (Object.hasOwn(suppliedInput, "phase_progress")) {`；不传 `phase_progress` 就直接走 `:1904 runOfficialStage`，**完全不经过写入函数**；该函数全仓唯一调用点就是 `:1875`；`runtime/stage/stage-runner.mjs:2976-2981` 只**读**从不写。⇒ **忘了写 ⇒ 游标不存在 ⇒ 退回 `workflows/build-code/SKILL.md:57-58` 人工推导**。另附实测旁证：仓库树内 `facts.jsonl` 0 个，`/Users/Hugh/.workflowhub` 下仅 1 个（KnowledgeDigest），游标匹配 0 | `verify-progress-shipped.md` §2 第 5 问全节；FIX-LIST F4.2 |
| **F4.3** | `:772-778`（新增 §4.2「没有自动派生」） | 如实写明**没有自动派生**：`runtime/stage/completion-predicates.mjs:1005-1022` 的 `deriveStageProgress` 只判材料在不在（`:1018 readiness_source: "current-material-presence"`），输出**无** phase/task 序号；`T0NN` 唯一来源是 `runtime/stage/stage-content-contracts.mjs#validatePostPhaseContract`（原记 `:7029`，现 `:7189`） 解析 phase 卡标题（供 `phaseProgressTargetExists` 校验）。⇒ 写明「**R5 解决不了，R9 只部分缓解**」；缺的是「机器可观测的 (phase, task) 完成事件」，本卡**不造**它（造它就要新的 phase 完成度权威） | `verify-progress-shipped.md` 质疑(b)；FIX-LIST F4.3 |
| **F4.4** | `:792-814`（§4.4 谁写、什么时机）；`:805`（v1 方案已删的说明）；`:860-868`（§4.8 的 C1 表行） | **删掉** v1 §4.6 的「往 `workflows/build-code/SKILL.md:55-58` 追加三句、作为唯一新增的行为要求」方案（`:805` 逐字说明已删的理由：该条文**已经存在**于同文件 `:245-250`），改成**在入口步骤 `:203-208` 引用它**（＝§4.8 的 C1，逐字给「追加哪一句、指哪里」）。原 `:245-250` 逐字条文在 §4.4 全文引用，本卡**不重写**它 | `workflows/build-code/SKILL.md:245-250` 逐字（本卡 worktree 实测）；`verify-progress-shipped.md` §4 候选 1；FIX-LIST F4.4 |
| **F4.5** | `:880-896`（§4.10「我否决的进度方案」）；`:884`（候选 4 行）；`:777`（§4.2 的同一理由） | 保留「**候选 4 明确不做**」：在 stage-runner 里自动推进需要新的 phase 完成度权威，会引入控制面，与 `AGENTS.md`（质量/进度事实不是许可证、不新增 gate 或第二进度权威）及 `skills/spec-plan/SKILL.md:14` 冲突 | `verify-progress-shipped.md` §4「候选 4 明确不做」；`AGENTS.md` 治理条；`skills/spec-plan/SKILL.md:14` 逐字；FIX-LIST F4.5 |
| **F4.6** | `:831-846`（§4.6「一次调用回答四问」） | 如实写「**现状回答不了**」四问；本卡只承诺**一档**：「读一次 + 读 `phases/index.md` 行数」；**不承诺**改 `status` 返回体（那要动正被 CARD-04 改的 `tools/cli/stage-runtime.mjs`），并在表里逐问标注「现状能答 / 只能推断 / 答不了」 | `design-blue-conflicts.md` B.3（`status --action=begin` 返回体 `:1574-1604`，**无任何 phase 计数键**）；`verify-steps-and-collision.md` A5（`tools/cli/stage-runtime.mjs` 在 CARD-04 写面内）；FIX-LIST F4.6 |
| **F5.1** | `:924-943`（§5.1）；`:944-971`（§5.2）；`:972-987`（§5.3 逐条核对表） | §5.1/§5.2 的行号与逐字引用**保留不动**（已核实全部正确）：`workflows/build-code/steps.json:5` step 1 `read-current-task-documents`、`:12` step 8 `review-change`；`workflows/build-code/SKILL.md:55-58`、`:93-95`；`skills/wh-review/SKILL.md:102`；`skills/wh-review/contracts/verify-code.md:4`/`:6`/`:53-54` | `verify-steps-and-collision.md` A2（逐字一致）；FIX-LIST F5.1 |
| **F5.2** | `:1007-1018`（新增 §5.5.1「改动前就已经红的两条：**既有红，非本卡引入**」）；`:113`（§6 早期提示）；`:1154`（§7-5 决策点） | 就地登记两条**改动前就已红**的测试：①`tests/contract/build-code-apply-contract.test.mjs:57`（`concrete kinds` 期望 `["test_strategy","stage_outcome"]`，实测只有 `["test_strategy"]`）、`:64` 与 `:65-67`（publish kinds/paths 全等，实测 `["phase_task_facts","test","review"]` / `["quality/facts/","quality/tests/","quality/reviews/results/"]`）；②`tests/contract/review-step-forward-progress.test.mjs:25-27`（要求 build-code 有 `final-integration-review`）与 `:97 expect(review).toBeDefined()` **必红**，而 `tests/contract/stage-routing-and-concrete-testing.test.mjs:177` 又 `not.toContain("final-integration-review")` ⇒ **两条契约测试互相矛盾（现在就是红的）**。明确写「设计书全文未提，本卡只登记红事实、不修」（要不要修进 §7-5 交给用户） | `verify-steps-and-collision.md` A4 全节；本卡 worktree 实测 `tests/contract/stage-routing-and-concrete-testing.test.mjs:177`（v1 的 `:176` 写法已改正）；FIX-LIST F5.2 |
| **F5.3** | `:944-971`（§5.2 全节）；`:962`、`:965`（合同引用改正）；`:963-964`（`material_fingerprint` 与 dedup identity） | **改正引错的合同**：build-code 专属合同是 `skills/wh-review/contracts/build-code.md`（`:5` 逐字支持「每 Phase 一次」），v1 只引了 **verify-code** 的合同（另一阶段）→ 已改；并补记 `skills/wh-review/contracts/build-code.md:8-9`（「Phase 的审查事实绑定当次 task、Phase、材料与代码快照；旧快照的结果保留原身份」）与 `skills/wh-review/SKILL.md:95` 的 `material_fingerprint`：与草案复用键（只写 `phase_id` + 「改动文件变了」）**不同轴**；再补 `runtime/review/review-record-route.mjs:425`/`:432`/`:440`/`:648`/`:1492` **已有 canonical dedup identity** ⇒ 结论从 v1 的「step 层没有依据可挡」**改成**「能否消掉那 1369.3 s 无法判定」 | `verify-steps-and-collision.md` A3 全节；FIX-LIST F5.3 |
| **F5.4** | `:1019-1025`（新增 §5.5.2） | 保留并写明：§5 两处改动**不会让任何测试变红**（不改 slug/order/entry_conditions/completion_evidence；`grep -rn "every referenced physical" tests/` 无匹配；`runtime/schemas/steps.schema.json:26` 对 `observable_result` 只要求 `{type:string,minLength:1}`）；`workflows/build-code/steps.json` **不在 CARD-04 写面**。另补两条也读该文件但不敏感的断言：`tests/contract/post-cohort-downstream-workflows.test.mjs:24-27`、`tests/contract/no-external-stage-agent-gate.test.mjs:15` | `verify-steps-and-collision.md` A2 末段 + A4 + A5；FIX-LIST F5.4 |
| **F5.5** | `:1026-1030`（新增 §5.5.3） | 保留不确定项，逐字写「**未跑测试故不能断言不红**」：`tests/step-manifest.test.mjs` 可能对 `observable_result` 做形状/词汇级校验 | `verify-progress-shipped.md` §5 不确定项第 1 条；FIX-LIST F5.5 |
| **F6.1** | `:1069-1090`（§6.3 全表重排）；`:1071`（口径说明）；`:1079`（S 批）；`:1087`（唯一串行硬约束） | **消掉 v1 §6.3 的自相矛盾**（批 A 写「与 B/C/D 并行」、批 B 写「与 A/C/D 并行」，而硬约束又要求对 `skills/catalog.yaml` 串行）。重排后：A（`skills/spec-plan/**`）与 B（`skills/spec-specify/**`）**可并行**；**新拆出独占批 S ＝ 只改 `skills/catalog.yaml`**，回填 `:335`（spec-plan）与 `:286`（spec-specify）两处 `local_bundle_hash`，**S 必须串行于 A 与 B 都定稿之后**；表格每一行都逐条写明「与哪批可并行／与哪批必须串行」。依据：`skills/catalog.yaml:283-288`（`- name: spec-specify`，`:286` 哈希）与 `:332-337`（`- name: spec-plan`，`:335` 哈希）**同在一个文件**，v1 只把它归 A 批 | `skills/catalog.yaml:283-288`、`:332-337`（本卡 worktree 实测）；FIX-LIST F6.1 |
| **F6.2** | `:1059`（§6.1 表新增第 21 行） | 补进逐条表：`CONTEXT.md` —— v1 自称「每一个文件（逐条）」却漏了它。实测 `git diff --numstat -- CONTEXT.md` = `11	0	CONTEXT.md`（**+11 行**），`git status --porcelain` = ` M CONTEXT.md`（已在 card-03 worktree 内改） | 本卡 worktree 实测；FIX-LIST F6.2 |
| **F6.3** | `:1033-1060`（§6.1 表 #1–#20 保留）；`:1061-1068`（§6.2 结论 + 对账）；`:694`（§3.8 的 13/13 之外那处） | 保留已核实正确的部分：§6.2 实测 14 个已跟踪文件与各 `+N` 逐条一致；§6.1 #1–#13 **全部在 CARD-04 写面之外（13/13 实测）**；#11 判据 `?? docs/adr/0034-subagent-dispatch-and-parallel-rules.md`（12834 B）**2026-09-29 复核更正：该文件现已被 git 跟踪，原 `??` 状态不成立**；#12 判据 `tests/contract/build-code-test-inventory.test.mjs` 主树与 card-03 **均不存在**、card-04 存在且未跟踪（**2026-09-29 复核更正：该断言已被实测证伪**——该文件现存在于主树与本卡 worktree 且已被 git 跟踪（129 行 / 6988 B，末次提交 `34b968c3`），CARD-04 worktree 目录整体已删除，材料归档于 `specs/archive/workflowhub-thin-core-card-04-20260919/`）；实测**两棵树 worktree 重叠文件 = 0** | `verify-steps-and-collision.md` B6–B9；FIX-LIST F6.3 |
| **F6.4** | `:1052`（§6.1 #14 的漂移提醒）；`:1053-1055`（#15）；`:1062`（§6.2 口径对账） | 保留两条保守判断，并补**合并后行号漂移**提醒：#14 的落地目标是 `workflows/build-code/SKILL.md:203-208`，CARD-04 插在旧 `:100` 之后（`@@ -98,6 +98,30 @@`，净增 24 行）⇒ 合并后 ≈ `:227-232`、被引用的 `:245-250` ≈ `:269-274`，**冻结候选不得写死行号**；#15 的 `workflows/verify-code/SKILL.md:108`/`:143` 未被 CARD-04 纯增 hunk 覆盖，**但合并后行号会漂移为 `:135`/`:170`**。另补两套口径的对账（「13 处重叠」= 文件级、14 = CARD-04 单侧改动面） | `verify-steps-and-collision.md` B6–B9 末段；FIX-LIST F6.4 |
| **F6.5** | `:1075`（§6.3 表头）；`:917`（§4.12 验证命令）；`:735`（§3.9 验证命令） | §6 的验证命令一律按「**只跑受影响的针对性测试、禁止全量回归**」写（逐字引 `AGENTS.md:21-22`） | `AGENTS.md:21-22`；FIX-LIST F6.5 |
| **F7.1** | `:1100-1108`（新增 §7.0） | 把 v1 六个决策点里**两个已被实测答案消解**的摘出：第 2 条（11 个还是 5 个字段）＝**已裁决 4 个**（D-FIELD=A）；第 4 条（一条命令答四问）＝**机制已发货，只能做「读一次 + index 行数」这一档**（§4.6）。两条都写明「不再问用户」并给依据行号 | FIX-LIST F7.1；`design-blue-conflicts.md` A.1；`verify-progress-shipped.md` §2 | 
| **F7.2** | `:1109-1125`（§7-1）；`:1126-1133`（§7-2）；`:1134-1141`（§7-3）；`:1142-1149`（§7-4）；`:1150-1161`（§7-5，**新增**） | 重做后只留**真正需要用户定**的：§7-1 `docs/stage-atomic-step-inventory.md` 旧顺序问题（`tests/p0-foundation-contracts.test.mjs` **基线已红**：实跑 `EXIT_CODE=1`，`:55 expect(documented.size).toBe(actual.size)` → `expected 69 to be 68`；根因该文件 `:13-26` make-decision 段与 `:42-54` build-plan 段仍是旧 slug/order，逐字旧值 `:15 make-decision | 3 | talk-round-1`、`:44 build-plan | 3 | testing-system-blueprint`、`:53 build-plan | 12 | publish-plan-result`；选项 A 本卡顺手同步 / B 只登记红事实不改 / C 换成一句指路）；§7-2 `Acceptance inline` 内联程度（A 只引引用行 / B 连判据正文一起内联 / C 只写 AC ID）；§7-3 worktree 根 5 份别的任务的「当前 phase」文本（各自归属已逐条列明；选项 A 只加指针 / B 删除或改名 / C 仓库根加说明文件）；§7-4 `workflows/build-plan/SKILL.md:209-215` 的 phase 字段清单是否同批改（A 同批末尾追加 / B 只改模板 / C 删清单改成指路）；§7-5**新增**：§5.5 里两条基线红测试本卡要不要顺手处理。**每一项都给「大白话 + 选项 + 含义/后果/风险 + 推荐」，没有替用户决定** | `design-blue-anchors.md` §3.1（`tests/p0-foundation-contracts.test.mjs` 实跑 `EXIT_CODE=1`，`:55` → `expected 69 to be 68`）；`verify-steps-and-collision.md` A4；FIX-LIST F7.2 | 
| **F8.1** | `:1162-1176`（§8 全节）；`:1164`（新增 ⑨⑩） | 保留原八条（第 ④ 条按 D-FIELD=A 改写、第 ⑥ 条交叉引用改指 §4.8 的 C1、第 ⑧ 条删掉已删除的 `Global goal pointer`），**新增两条**：⑨「**把已发货的机制当成本卡设计**」（＝BL-2 的教训）、⑩「**用审计推断值充当实测口径**」（＝HI-2 的教训） | `design-red.md:13`/`:14`（BL-2、HI-2）；FIX-LIST F8.1 |
| **F9.1** | `:1005`（§5.5「v2 删掉的三条命令」）；`:754`（§4.0 真实测试名）；`:909`、`:914`、`:983`、`:999`（各处引真实测试） | 三条指向**不存在文件**的验证命令（v1 `:858`/`:859`/`:989`：`tests/contract/build-code-resume-cursor.test.mjs`、`tests/unit/phase-progress-cursor.test.mjs`、`tests/contract/interaction-contract.test.mjs`）**全部删掉**，换成真实存在的 `tests/contract/stage-progress-contract.test.mjs`（211 行）与 `tests/contract/post-quality-fact-scope.test.mjs`（135 行）；并写明 `tests/contract/build-code-test-inventory.test.mjs` **只在 CARD-04 worktree 的未跟踪文件里**（主树不存在）〔**2026-09-29 复核更正**：此句不成立——card-04 的 `34b968c3` 已并入 main，该文件现被 git 跟踪且同时存在于主树与本卡 worktree（129 行 / 6988 B），CARD-04 worktree 目录已不存在；本行「三条验证命令的删改」处置不变〕 | 本卡 worktree 实测；`design-blue-anchors.md` §3.2；FIX-LIST F9.1 |
| **F9.2** | `:9-19`（新增「引用约定」第 3 条）；全文件 **53 处**路径补全 | 三个不可解析引用改正：①`tests/.../post-cohort-executable-authoring.test.mjs`（字面 `...`）→ `tests/contract/post-cohort-executable-authoring.test.mjs`；②`tmp/wh-card03-design/NOTES-design-extract.md`（漏前导 `/`）→ `/tmp/wh-card03-design/NOTES-design-extract.md`；③`plan/SKILL.md`（伪路径）→ `skills/spec-plan/SKILL.md`。另把**全部**测试文件、`skills/**` 模板、`tools/cli/stage-runtime.mjs` 的裸文件名补成全路径（53 处），并把三处**确实无法从本 worktree 解析**的引用在「引用约定」里如实登记（`/tmp/wh-card03-session-analysis/s0922a.md`、`s0922b.md`、`talk-decision-record.md`；`handoff-build-code-1a409534.md`；`progress.json`） | `design-blue-anchors.md:180`（`s0922a/s0922b` 指向 `/tmp/wh-card03-session-analysis/`）；`:181`；本卡 worktree 实测（`find` 无命中）；FIX-LIST F9.2 |
| **F9.3** | `:708-716`（§3.8 哈希测试表） | 「改了会红」的哈希测试**删掉 3 条错配**（划掉并写明错配理由）：`tests/contract/stage-skill-invocation-contract.test.mjs:74`（`:67` 只 `for (const name of ["wh-review","architect-code-review"])`）、`tests/contract/stage-reflection-wiring.test.mjs:44`（`:32` 只取 `entry.name === "stage-reflection"`）、同文件 `:187`（`bundleTargets` `:151-156` ＝ spec-analyze / stage-handoff / stage-reflection / wh-review）。**保留 2 条成立**：`tests/contract/spec-stage-artifact-closure.test.mjs:118`（名单 `:111-114` 含 `spec-plan`）、`tests/skill-provenance-strict.test.mjs:26` | `design-blue-anchors.md` §3.2（D11/D12/D13）；FIX-LIST F9.3 |
| **F9.4** | `:718`（§3.8 末条） | 补上 v1 漏列的**真正会抛错**路径：`tests/contract/stage-skill-invocation-contract.test.mjs:80-112`（唯一调用 `resolveStageSkillPackages` 的测试）→ `runtime/stage/stage-skill-runtime.mjs:155` → `resolveSkillPackage` 逐文件 sha256 校验 → `runtime/adapters/local-skill-resolver.mjs:110` 抛 `bundle sha256 mismatch: templates/phase-template.md`。并写明哈希链全仓只有 **2 处**登记：`skills/spec-plan/skill-bundle.json:11`（逐文件摘要）、`skills/catalog.yaml:335`（bundle 摘要），**没有第四处** | `design-blue-anchors.md` §3.2 末段 + §4；FIX-LIST F9.4 |
| **F9.5** | `:972-987`（§5.3 表，逐条改正并标明「v2 已按 D 系列改正」）；`:521-538`（§2.3）；`:656`、`:684`、`:720` 等 | 行号偏差逐条改正：`tests/contract/stage-routing-and-concrete-testing.test.mjs:160-166` → **`:164-165`**；`tests/step-manifest.test.mjs:164-170` → **`:164-165` + `:167-174`**（结论仍成立：build-code 最后非 reflection 步 = step 11）；`tests/contract/portable-workflow-run.test.mjs:89` → **删掉**（那是 CARD-01 build-prd 的 6 步序列，与本卡无关）；`tests/contract/review-step-forward-progress.test.mjs:80` → **删掉**（边界是 `review-frozen-spec`→`publish-spec-result`，读 `workflows/build-spec/steps.json`） | `design-blue-anchors.md` §2 D1–D21；FIX-LIST F9.5 |
| **F9.6** | `:527`（§2.3 内） | 计数错误改正：`tests/contract/post-cohort-executable-authoring.test.mjs:10-18` 不是「五个 H3 + 七个 token」，实为 **4 个 H3 + 8 个 token**（`:10` 切分串 `## 实现设计（全局权威）`→`## Appendix A`，`:12-15` 4 个 H3、`:16-18` 8 个 token） | `design-blue-anchors.md` §2 D9；FIX-LIST F9.6 |
| **F9.7** | `:667`（§3.6 该行）；`:720`（§3.8 末段）；`:1144`（§7-4） | 引用不精确改正：`tests/contract/post-cohort-executable-authoring.test.mjs` 的 `:37-38` 断言对象是 `author`（`skills/spec-plan/SKILL.md`）、**`:39` 断言对象是 `template`**（`next Phase continues the sequence` 命中现模板 `skills/spec-plan/templates/phase-template.md:51`），v1「三句都在 SKILL.md」的说法已改；五条定距正则的对象是 `workflows/build-plan/SKILL.md` 与 `skills/spec-plan/SKILL.md`，**不是** phase 模板（且精确区间是 **`:65-69`**，v1 的 `:65-72` 已改正）；真实雷区集合写明＝`plan.md`、`tasks.md`、`one-line results`（phase 模板）+ index 五个禁词（`gate_cmd`/`expected_exit`/`oracle`/`evidence_path`/`execution status`） | `design-blue-anchors.md` §2 D10/D17/D18 + `design-blue-conflicts.md` A.3；FIX-LIST F9.7 |
| **F9.8** | `:285`（R13 写面行） | 删掉 v1 `:66` 的「见 §7 决策点 D2」（§7 里并不存在 D2），并在原处留下一句处置说明（v1 的编号在 §7 里不存在，v2 已整句删除交叉引用） | `design-red.md` 附注（`DESIGN.md:66` 引 `§7 决策点 D2`，而 §7 只有 §7-1…§7-6）；FIX-LIST F9.8 |
| **F9.9** | `:9-19`（「引用约定」5 条） | 加「引用约定」：①基准＝工作根 `…/workflowhub-workflowhub-thin-core-card-03-20260919`，每个 `路径:行号` 都可 `sed -n 'Np'` 复核；②跨 worktree 的引用（CARD-04 材料）必须带全路径；③三处不可解析引用如实登记；④裸文件名的固定含义（`AGENTS.md`/`CONSTITUTION.md`/`decision-log.md`/`facts.jsonl`/`spec.md`/`phases/P<n>.md`）；⑤v2 已补全 53 处裸文件名引用 | FIX-LIST F9.9；`design-blue-anchors.md` §5 |

### §9.2 F 条目计数与自查

- **计数**：FIX-LIST.md 的 F 编号共 **40 条**（F1.1–F1.4 4 条、F2.1 1 条、F3.1–F3.7 7 条、F4.1–F4.6 6 条、F5.1–F5.5 5 条、F6.1–F6.5 5 条、F7.1–F7.2 2 条、F8.1 1 条、F9.1–F9.9 9 条），**全部落地**，逐条见上表。
- **Part 0 的两条裁决**：D-PROG=A（只做两处纯文本改动，候选 4 明确不做，残留风险如实写明）→ §4.4/§4.8/§4.10；D-FIELD=A（只加 4 个字段、删掉的 7 个逐条说明为什么不加）→ §3.1–§3.6。
- **治理边界自查**：全文**没有**新增门禁、校验、阻断、哈希、receipt、snapshot lineage、successor、reopen、rebind、continuation、checkpoint permit 或第二套进度权威；每个新字段都写明「只能记录、不成门」的限定；`Progress cursor` 与 stage row 的既有校验**复用**而不扩张（§3.7）。
- **口径自查**：凡百分比一律带「推断值，不作为验收指标」；实测数字与推断百分比**分表/分句**，没有同表混算（§0 表 + §1 各根因）。
- **未达标处（如实列出）**：①**行数（2026-09-29 一致性复核更正，实测）**：本文件共 **3418 行**（**2026-09-29 复查更正**：B1 行状态三处对齐时在 §14.14.7 补了 2 行，原记 3416 行）——正文 §0–§8 ＝ 第 1–1569 行；§9 修改溯源表 ＝ 第 1570–1650 行；§10–§14（附录与增补）＝ 第 1651–3418 行。原自评「共 **1234 行**（正文 §0–§8 ＝ 1–1177；§9 ＝ 1179–1234）、比 900–1200 上限多 34 行、多出的全是 §9 溯源表本身」的数字**在本卡树上无法复现**（引入该行的提交 `5202828a` 实测已 3408 行；改过本文件的提交（**截止 2026-09-29 复核时点**实测：全部落在 **3408–3418** 行区间；此区间与「提交个数」均为**时点快照**，会随本文件继续修改而外扩／自增，故不写成恒定值）），故原「正文在目标区间内」的结论**不再成立**，按本行实测值如实更正；②四个落点的落地状态**按实况拆分**（**2026-09-29 一致性复核更正**，原句把它们一概写成「落地尚未实施」）：`docs/standard-workflow.md:334-338` **已落地**（实测 `git diff --stat '97092b30^1' 97092b30 -- docs/standard-workflow.md` 为空，该 5 行现文即 §1 R2 的逐字草案；见 `:100` 与 **§6.1.1 的行 10**＝`:1143`；原误写「§14.7 行 10」，2026-09-29 复核更正）、`workflows/build-code/steps.json:15` **已落地**（现文含「the binding object is the write set this Phase declares … not a whole cross-Phase snapshot.」；见 **§6.1.1 的行 8**＝`:1141`；原误写「§14.7 行 8」）；`workflows/build-code/SKILL.md` 的 C1 追加引用句（原记 `:203-208`／`:245-250`，现位置 `:251-257`／`:320-327`）**未实施**，按 **§6.1.1 的行 17**（原误写「§14.7 行 17」，**2026-09-29 复核更正**：§14.7 施工表自行 43 起编号，行 8／行 10／行 17 均属 §6.1.1 处置总表；其授权列即引「§6.1.1 第 17–20 行同款处置」）与行 52 的 **错开实施** 口径排队；③行号会随 CARD-04 合并漂移的四处（§6.1 #14/#15）必须在合并后重新定位。

---

### §9.A 本卡验收的载体与不适用清单（T-002=A）
**1. G-1 走演练（对应 AC-14）**：本卡不实遇接口必须变更（本轮没有任何实现改动），改为**一次桌面演练**：由主会话按 G-1 三步处置（停并行 → 主会话重排 → 登记作废批次）走一遍，记录写入本卡 `decision-log.md` 的「八、G-1 演练记录」（形状见 V4-D.md §3）。演练记录**只采事实**：每一步记录做了什么、谁做的、产出什么引用；判定由独立上下文子代理给出。演练**不阻断推进**（SD-17；同 `workflows/verify-code/SKILL.md:110` 逐字「review 结果只是质量事实，不是继续工作的许可证。缺质量事实只限制完成声明，不限制继续验收和修复。」）。

**2. build-prd 记「明确不适用理由」（对应 AC-15）**：本卡 `cohort=post`，路线不含 build-prd，AC-15 的「五阶段」中的 build-prd 一格**记明确不适用理由，不记失败、不补跑**。逐字依据＝`decision-log.md:45`（T-003=A）：「本卡不跑 build-prd、也不另跑 pre 样例 task；`workflows/build-prd/SKILL.md` 的方法章节仍须改到位（方法覆盖五阶段），build-prd 的**派发实例证据**由后续 pre 路线任务承担，本卡处记「明确不适用理由」；不改写 PRD 的「五阶段」措辞」。载体＝本卡 `decision-log.md` 的 OI-006（`:229`，`status: confirmed`）与 `## 收敛检查` 的验收维度行。

**3. 取证只采事实、判定必须来自独立上下文（禁止自审自判）**：AC-11…AC-15 的**事实**由执行者按可指认的形态留下（派发/回收记录、主会话动作清单、并行方案声明、G-1 演练记录、五阶段核对表）；**判定**（通过/失败）由**未参与该事实产出**的独立上下文子代理给出。常驻依据＝`AGENTS.md:17` 逐字「质量裁决由独立来源独立上下文产出，禁止自审自判。」；发现与失败的落点＝当前 stage 行的 `finding_dispositions`（五值枚举 `fixed`／`rejected_invalid`／`accepted_risk`／`needs_human`／`user_decided`，见 `runtime/stage/completion-predicates.mjs:124`；字段集见同文件 `:126-129`），**只能记录、不成门**（T-024=A）。
**取证禁止项**：不得把「本卡自己声明通过」当判定；不得把 `workflows/*/SKILL.md` 的文本写成证据以外的结论；不得为取证新增命令、哈希、快照或回执（SD-17）。

**4. 不另起独立样例 task**：本卡**不新建**任何 sample／pre-cohort 样例 task 来补 AC-11…AC-15 的场景；AC-11…AC-14 的主证据＝card-03 自身执行事实，AC-15 的 build-prd 一格＝「明确不适用理由」。留给后续：build-prd 的**派发实例证据**由后续 pre 路线任务承担（T-003=A）；并行收益实测留后续（母 `prd.md:310` oracle，本卡不承诺提速比例）。

事实一律只记事实、判定人一律是独立上下文子代理（`AGENTS.md:17`）：

| AC | 事实（只采事实） | 事实落点 |
| --- | --- | --- |
| AC-11 独立上下文 | 实施/测试/审查子代理的会话标识互不相同；至少一次修复由原实施子代理承接 | `decision-log.md` 收敛检查验收行 + 派发/回收记录 |
| AC-12 主会话无大量读写 | 事后人工判读一次主会话动作清单（T-009=A，**零新增机制**） | 同上；阈值与阶段豁免表见 OI-003（T-020=A） |
| AC-13 并行方案 | 接口蓝图/依赖调度/并发数（≤5 且 ≥2）/五件套齐备 | SD-11 五件套的事实记录形态（T-011=A）→ `docs/standard-workflow.md` 规则正文 + 本卡材料 |
| AC-14 G-1 | 演练记录：停并行、重排、作废批次登记 | `decision-log.md`「八、G-1 演练记录」 |
| AC-15 五阶段 | 四个阶段按工作类型派发的实例 + build-prd 的不适用理由 | `### §9.A` 第二小节 + OI-006 |

机器层事实只落在**当前 stage 行**的 `finding_dispositions`——**不是**新行类型（`runtime/task/task-store.mjs:220` 只认 `stage`／`close_action`，quality fact 被 `:179` 显式拒绝）。以上都不改变任何 step 的 `observable_result`／`completion_evidence`，不阻断推进。

## §10 折入溯源表

本表登记 V3-P1 与 V3-P2 里**真正的操作指令**（P1-7.1…P1-7.6、P2-6.1…P2-6.5、P2-7.1/P2-7.2）各自的落点与状态；行号为 `DESIGN-v3.md` 自身的行号。补丁中的理由节、核实节一律**未**折入。

| 指令编号 | v3 行号 | 怎么应用的 | 状态 |
| --- | --- | --- | --- |
| **P1-7.1** | v3:615 | §3.3 尾注句的「为什么」段内，把「这一句**不在**测试切片内（切片止于 `## L2`）」逐字替换为 P1-7.1 给的逐字新串（`str.replace`，命中数断言 = 1）。 | 已应用 |
| **P1-7.2** | v3:724 | 在 §3.8「同一批还要看的第三件事」段之后追加 1 空行 + 该段逐字新文本（补记 `skills/spec-plan/SKILL.md` 的摘要登记在 `skill-bundle.json:6-7`，须与 `:11` 同批回写）。 | 已应用 |
| **P1-7.3** | v3:737 | §3.9 的代码围栏内、`spec-stage-artifact-closure.test.mjs` 那一行之后追加 1 行 `node --test tests/contract/ui-stage-integration.test.mjs`。 | 已应用 |
| **P1-7.4** | v3:598 | §3.2 净效果行的行末逐字追加「；V3-P1 再在尾注后追加 1 空行 + 3 行字段层级约定（见 V3-P1 P1-3），模板最终 64 行」（替换锚点 `只多这 4 个字段。`，命中数 = 1）。 | 已应用 |
| **P1-7.5** | v3:553 | `## §3 …` 标题行之后追加 1 行修订引用（未额外插空行，原 `:552` 空行保留；故新引用与既有 `> 落点文件…` 引用之间隔一个空行）。 | 已应用 |
| **P1-7.6** | v3:748 | §3.9 收口段落之后的空行处、`---` 之前插入逐字新文本 `### §3.10 …`（含标题共 5 行）。 | 已应用 |
| **P2-6.1** | v3:757 | §4 导语的同一行内做两处逐字替换（`两处纯文本改动`→`三处纯文本改动`；`真正新增的只有 …`一句的措辞改为「两句措辞」，各命中数 = 1）。 | 已应用 |
| **P2-6.2** | v3:877 | `### §4.8 …` 小节标题逐字替换（`两处/2 处`→`三处/3 处`，命中数 = 1）。 | 已应用 |
| **P2-6.3** | v3:883 | 在 `:865` 的 `C2` 行之后追加第三行 `C3`，按 `:864`/`:865` 的 4 列结构排（落点 / 改法 / 为什么不是新机制）；补丁只给了 3 条 bullet，行文本由这 3 条 bullet 逐字组装。 | 已应用 |
| **P2-6.4** | v3:905 | §4.10 表格「在 `phases/P<n>.md` 写 `## Progress` / 状态表」那一行的同一格内追加 P2-6.4 的逐字文本（锚点 `明文禁止；D 的第 4 条`，命中数 = 1）。 | 已应用 |
| **P2-6.5** | v3:937,953,964 | 在 §4 末尾、`## §5` 之前的 `---` **之前**插入三个新小节：§4.13（逐字条文照抄 P2-2 的英文禁令段）、§4.14（P2-5 代码块整段原样）、§4.15（逐字条文照抄 P2-4 的英文边界声明段）。 | 已应用（插入点见下方「未裁决事项」第 1 条） |
| **P2-7.1** | v3:324,326,331 | ①§1.E 的 blockquote 末尾逐字追加 1 句；②`:326` 标题 `三处`→`四处`，并在 `:330` 之后新增第 4 条（逐字文本）。**③「写面提示」未应用**（见下方「未裁决事项」第 2 条）。 | 部分应用（① ② 已应用；③ 无法应用） |
| **P2-7.2** | v3:1157,1217 | ①§7 导语的 `:1098` 两处数字逐字替换（`新增一条`→`新增两条`、`五条`→`六条`，各命中数 = 1）；②在 `:1156` 与 `:1158` 的 `---` 之间插入 `### §7-6`（正文原样照抄 P2-2 代码块整段）；`:1160-1161` 的收尾 blockquote 仍保留在 `---` 另一侧不动。 | 已应用 |
| **本任务补充③（120 字符窗口）** | v3:742 | 在 §3.9 末尾（收口段落之后、§3.10 之前）插入实测小段：距离 110 / 量词消费 108 / 整段跨度 114 / 上限 120 ⇒ 余量 10（距离）、12（量词）、6（跨度）。 | 已应用 |

### §10.1 未裁决 / 未应用 / 与现状不符之处（如实登记，不自行裁决）

1. **P2-6.5 插入点两侧都可满足字面描述**：指令写「`:918` 之后、`:920`（`## §5`）之前」，而 `:919` 是 `---`（v2 中 `---` 一律紧贴其后的 `## §N`）。`:918` 与 `:920` 之间的区域同时包含「`---` 之前」与「`---` 之后」两个候选位。**本次按「`---` 之前」插入**（与 P1-7.6「`:736` 空行之后、`:737` `---` 之前」的同款写法一致，且 §4.13–§4.15 是 §4 的子节）。**未自行裁决**，请复核是否应改插到 `---` 之后。
2. **P2-7.1 ③「写面提示」无法应用**：③ 要求把「同一文件一次动 4 处 / `:71-90` 与 `:195/203/211` 那批说明要一并更新 / 全部插入完成后跑一次 `post-cohort-executable-authoring.test.mjs`」加进 §1 的写面清单，但**补丁未给逐字文本，也未给 §1 写面清单的行位置或锚点**；v2 的 §1 写面清单我未逐字读。⇒ 未作任何改动，不自行拟文案。
3. **P1-7.2 与「补上 v2:704 漏项」的落点不一致**：本任务小事②说 v2 `:704` 漏了 `skill-bundle.json:6-7`；而 P1-7.2 的**操作指令**是把整段补记追加在 v2 `:720` 段之后，**不是**改写 `:704` 的表格行。⇒ 按指令落在 §3.8 尾（`:704` 那一行逐字未动）。
4. **P1-7.1 与 v2 现状不符（已按指令纠正）**：v2 `:613` 原文写「这一句**不在**测试切片内（切片止于 `## L2`）」，与 `post-cohort-executable-authoring.test.mjs:27` 的切片定义（`### Tnnn — ` 到 `## L2`）不符；已按 P1-7.1 逐字替换，v2 其余判断（结论不变）未动。
5. **P2-6.3 未给成行文本**：补丁只给 3 条 bullet（改动处 / 为什么不算门禁 / 性质），要求「按 `:864`/`:865` 现有的列结构/前缀格式排」；`C3` 行的措辞由这 3 条 bullet 组装，未新增任何事实。
6. **P2-6.5 的 §4.13 第 1 点与 §4.15 第 1 点是结构说明而非逐字文本**：这两处按补丁「结构如下」的 bullet 内容组装（数字、路径、行号、逐字引语全部沿用补丁原文）；§4.13 的结论句、§4.15 的三条「不」与交叉引用句为逐字照抄。
7. **P2-7.2 ①的连带范围未处理**：指令只改 `:1098` 的两处数字；该行同段的「v1 原有六条…剩下四条保留」等其余措辞未动（未获指令）。
8. **P2-3 的「第二落点」与 P2-4(3) 不在本表范围**：P2-3 第二落点（`steps.json:8` / `spec.md` 12 次写入）补丁明写「**留给用户裁决**」；P2-4(3)（本卡 `decision-log.md` 追加）是仓库文件动作，非 v3 编辑。两者都未折进 v3。
9. **补丁自身声明的未定项（原样登记，未裁决）**：P1-8 第 4/6/7 条（头部 5 个字段是否转正、`local_bundle_hash` 重算与版本号是否 bump、`<task-id>` 字面量来源）；P2-8 第 3/4/5 条（F-3 判据换了主张对象、`not_applicable` 是否算自造、`decision-log.md` 条目格式未核）。
10. **落点边界说明**：v2 中未被指令点到的行逐字未改；唯一一处 v2 之外的新增正文是上表最后一行的 120 字符窗口实测小段（本任务小事③授权的唯一一处判断），它写在 §3.9 末尾而非 §3.9 代码围栏内（P1-7.3 的 `:732` 之后只容得下命令，容不下散文段，故按任务授权的退路放在 §3.9 末尾）。

### §10.2 计数

- 已应用指令：**12 / 13**（`P2-7.1` 部分应用：① ② 已应用，③ 无法应用）。
- 无法应用：**1**（`P2-7.1` ③「写面提示」——补丁未给逐字文本与锚点）。
- 未自行裁决、原样上报的定位/冲突项：**2**（`P2-6.5` 插入点在 `---` 前 vs 后；`P1-7.2` 落点与「补 v2:704」不一致）。

## §11 五阶段方法正文落点总表（V4-C 原始交付，附录）
工作根（只读）：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`。
本件只读产出：未改仓库任何文件、未跑任何测试、未动 git；`specs/archive/**` 与 `docs/research/**` 只读。

**行号口径**：全部为**本件实读**的 card-03 worktree 行号。凡落点位于 CARD-04 漂移区之后（`workflows/build-code/SKILL.md` 旧 `:100` 之后、`workflows/verify-code/SKILL.md` 旧 `:79-80`/`:180-181` 之后、`workflows/make-decision/SKILL.md` 旧 `:204-205` 之后），一律**同时给文本锚点**；本表每一处落点都已给文本锚点，行号只作定位辅助。
**条款号口径**：`条款 1–9` 逐字取自 `/tmp/wh-card03-design/V4-BRIEF-2.md:17-25`。与 `docs/adr/0034-subagent-dispatch-and-parallel-rules.md:51-105`（决定十条，`:5` 状态「已确认…方向已选，尚未实施」）的映射：条款 1＝决定 1；条款 2、3＝决定 2 前/后段；条款 4＝决定 3＋4；条款 5＝决定 5＋6＋7＋8；条款 6＝**ADR 无对应决定**（BRIEF-2 锚 `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:303` FR-15）；条款 7＝决定 3②；条款 8＝决定 9；条款 9＝决定 4。决定 10（可观察形态）是写法要求，不单独占落点。
**正文引用对象（合并后统一）**：`AGENTS.md` 条②（条款 7/9 正文，逐字草案见 `/tmp/wh-card03-design/DESIGN-v3.md:75`，落点 `AGENTS.md:15` 与 `:16` 之间，见 `DESIGN-v3.md:71`）＋ `docs/adr/0034-subagent-dispatch-and-parallel-rules.md:51-105`（条款 1/2/3/5/6/8 的决定正文）＋ `CONTEXT.md:455-464`（术语与产出契约）。**不指向 `docs/standard-workflow.md`**（判定与理由见第四节）。

## 第一节：五阶段落点总表

> 表内「现状逐字 / 改成逐字」给出**决定性片段**与全文位置；每条的完整「现状逐字 → 改成逐字」在表后【B1】–【P4】块逐字给出，两处行号一致。

| 阶段技能文件 | 落点文本锚点 | 要加的条款（条款号 ＋ 一句话） | 现状逐字 | 改成逐字 | 会不会红 |
| --- | --- | --- | --- | --- | --- |
| `workflows/build-code/SKILL.md` | ①`## Portable dependencies`：`:85` `or auxiliary progress gate.` 之后、`:87` 首个 bullet 之前（`:86` 为空行）②`## Authority and entry`：`:65` 之前 ③`## Work loop` 第 1 步 `:208` `and its ACs are explicit before editing.` 之后 ④第 6 步 `:239` `the affected work complete. Completion: no finding is unexplained.` 之后 | ①条款 1（按工作类型派发）＋2（修复回原实施者）＋3（主会话只派发回收）＋8（先落盘→只回摘要与 ref→增量）＋7/9（事件式等待＋并发区间，引用 `DESIGN-v3.md:81` 冻结句）②条款 4（并行方案由计划阶段产出，本阶段只应用）③条款 5（工作包声明＝事实记录，不阻断派发）④条款 6（接口必须变更时停并行→重排→登记作废批次） | ①`:82-85`＝`Use the dependency packages declared in \`skill-deps.yaml\` directly: open each … or auxiliary progress gate.` ②`:65`＝`` `make-decision` exclusively owns Talk, Grill, and `decision-log.md`. `` ③`:207-208`＝`… Completion: the change boundary and its ACs are explicit before editing.` ④`:236-239`＝`… Repair valid findings in this same task and rerun affected checks. … Completion: no finding is unexplained.` 全文 `子代理`/`subagent`/`并行`/`轮询`/`落盘` 零命中 | 见【B1】–【B4】 | `tests/contract/build-code-apply-contract.test.mjs:16-24` 与 `:29-38` 全是 `toMatch` 正断言，**不读新增句**（新增文本须避开 `actual`/`changed files`/`exact allowed files`/`plain-language handoff`/`concrete testing skill`/`tasks.md` 以不扰动 `:18` 的 `{0,80}`/`{0,300}` 窗口，本表文本已避开）；`runtime/evidence/check-skill-closure.mjs:702-704` 会抓 `skills/<name>/SKILL.md` 形态 ⇒ 新增文本不得出现该形态；`tests/contract/stage-routing-and-concrete-testing.test.mjs:144-148` 对 `workflows/build-code/skill-deps.yaml` 名字 `toEqual` 严格全等 ⇒ 任何新句**只能进 SKILL.md，不得进 `skill-deps.yaml`**。未跑，命令见【B 组】 |
| `workflows/verify-code/SKILL.md` | ①`:154` 段末、`:156` `## 范围边界` 之前（新节 `## 派发与回传`）②`:144` 第 2 条整条 ③`:145` 第 3 条之后 ④`:110` `review 结果只是质量事实…不新建任务。` 之后 | ①条款 1＋3＋5＋6＋8（本阶段应用）②条款 2（修复回原实施子代理同一会话）③条款 4＋9（本阶段默认串行＋独立三件套才并行＋超限排队）④条款 7（引用 `AGENTS.md` 条② + 本阶段「一次发起 + 一次阻塞收集」应用） | ①`:154`＝`OCR 只负责确定性 packet/file 选择；独立 host executor 负责 LLM findings，OCR 不生成 finding。普通 verify-code 请求必须带当前代码 diff 与完整 AC 文本； malformed 请求直接报错。` ②`:144`＝`2. **主 Agent 修复一次**：只修复影响当前代码交付的有效 finding；每个 finding 记录 \`fixed\`、\`rejected_invalid\`、\`accepted_risk\` 或 \`needs_human\`。` ③`:145`＝`3. **必要定向复验**：只针对本次有效 finding 的修复和受影响行为运行检查，并保留 finding 处置与实际结果。` ④`:110`＝`review 结果只是质量事实，不是继续工作的许可证。缺质量事实只限制完成声明，不限制继续验收和修复；发现代码 finding 就回同一 task 修复，不新建任务。` | 见【V1】–【V4】 | ②必须成对改 `workflows/verify-code/steps.json:8` 的 `observable_result`，`step_slug` 一字不改：`tests/contract/review-step-forward-progress.test.mjs:31` 把 `"main-agent-repair-batch-1"` 逐字写进 `successors`（该测试只读 `step_slug`/`order`/`depends_on`），`tools/host/workflowhub-stage-agent-protocol.mjs:62` 用它做 evidence-subject 候选键且带 `?? steps[0]?.step_slug` 静默兜底。④新增句不得含 `review step`/`manifest 前移`/`不自动回跳`（`tests/contract/review-step-forward-progress.test.mjs:105` 的窗口由 `:171` 满足），也不得含 `focused review`/`required focused`/`focused_review_required`/`追求 clean`/`直到.*findings`（`:106` 负向断言）。`tests/verify-requirement-replay-contract.test.mjs:7-9` 是**基线红**、与本卡无关。未跑，命令见【V 组】 |
| `workflows/make-decision/SKILL.md` | ①`:334` 整句 ②`:357` 第 3 条整条 ③`:360` 第 6 条之后（新增第 7 条） | ①条款 1（派发单位是工作类型）＋5（声明制）＋引用句＋executor 取值口径修正（悬空权威）②条款 4＋9（把写死的 4/4/2 改为宿主可用区间 2–5 并指向 build-plan 逐任务值）③条款 2（修复回原实施子代理同一会话） | ①`:333-334`＝`这是执行方式说明，不是新的 stage、public command、runtime gate 或质量通过条件。` / `口径唯一来自 decision-log 的“Step×Executor 矩阵”和“上下文守恒规则”。` ②`:357`＝`3. 并行上限固定为：研究 4、debate 4、红蓝 2；交互步骤与依赖链按顺序执行，不为并行而并行。` ③`:360`＝`6. M 每步只依赖上一步的决策摘要和材料 ref；S 可按任务需要读取已落盘的完整材料，但不能把旧步骤全文重新塞回 M。` | 见【M1】–【M3】 | 三处均在 `:334`/`:357`/`:360` 之后，不在任何读该文件的窗口内：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs:300-301` 由 `:232` 满足；`tests/decision-log-content-contract.test.mjs:58` 断言 `workflows/make-decision/steps.json` 恰好 13 步（本表不碰 steps.json）；同文件 `:63` 由 `:232` 满足。条款 3（`:342-349`/`:358`）与条款 8（`:355`）**只引用不加字**。未跑，命令见【M 组】 |
| `workflows/build-plan/SKILL.md` | ①`:90` 与 `:92` 之间（唯一新增 `##` 小节的落点，安全区 `47-93` 内）②`:242` `repair valid findings in this same task.` **同一行行尾就地追加** ③`:265-268` 段末就地追加 ④`:290-292` 段末就地追加 | ①条款 1＋2＋3（本阶段应用，替代 M2 §M2.3 A/B 两处重复）②条款 6（G-1 收场）③条款 4（并行五件套在计划阶段产出）④条款 5（声明字段） | ①`:86-87`＝`its broker request must produce findings in an independent reviewer context. It is not` / `an inline self-review lens and does not share the current session's judgment.` ②`:241-242`＝`\`fixed\`, \`rejected_invalid\`, \`accepted_risk\`, or \`needs_human\`; repair valid` / `findings in this same task.` ③`:265-268`＝`Every Phase is an independent file with L0/L1/L2, exact write set and` / `dependency, tasks, tests, STOP, done evidence, and rollback. … not the pointer index.` ④`:290-292`＝`Each implementation file appears in one Phase boundary … Parallel phases/tasks require independent inputs, dependencies, and` / `file ownership.` | 见【P1】–【P4】 | ①只能落在安全行区间 `1-8, 14-38, 42-43, 45, 47-93, 98-128, 130-215, 224` 之内；`tests/contract/spec-stage-artifact-closure.test.mjs:102` 要求 342 字符之前不得插入；`tests/contract/stage-routing-and-concrete-testing.test.mjs:86/87/88` 命中 `:39-44`、余量 ≤3，落点在其后。②③④全在 P5 死区（`tests/contract/post-cohort-executable-authoring.test.mjs:69` 跨度 5321 字符、命中 `:225-307`、余量 0）⇒ **只许原地追加，不许新增行**。新增文本不得引入 `build-plan`/`RED`/`DO NOT TOUCH`/`G-2`/`pure documentation` 的更早命中（该文件五条距离正则的源绑定只有 `workflows/build-plan/SKILL.md` 与 `skills/spec-plan/SKILL.md`，见 `tests/contract/post-cohort-executable-authoring.test.mjs:61-64`）。`workflows/build-plan/SKILL.md:81-83` 逐字不动（`tests/contract/phase-quality-handoff.test.mjs:72-73`、`tests/contract/ui-stage-integration.test.mjs:172`）。未跑，命令见【P 组】 |
| `workflows/build-prd/SKILL.md` | **无落点（明确不适用）**，理由逐字段见第三节 | 条款 1–9 全部记「不适用（无 phase／无执行子代理模型）」 | 现状：`phase`/`phases`/`并行`/`子代理`/`派发` 在 `workflows/build-prd/SKILL.md`（124 行）与 `workflows/build-prd/steps.json`（91 行）**全零命中**；`:17-18` 是禁止语义；`:119-124` 四条边界禁令 | **不改一行**（`workflows/build-prd/**` 零改动） | 不落点 ⇒ 零测试影响。若有人反过来落点，则必红：`tests/integration/distribution-closure.test.mjs:42-61`（6 step、无 `stage_outcome`、每步 `portable_workflow_outcome`、正式条目 8、`formalEntries.some(workflow === "build-prd") === false`）与 `tests/contract/build-prd-review-contract.test.mjs:137`（`expect(matrix.stages).not.toHaveProperty("build-prd")`）。未跑 |

### 【B 组】`workflows/build-code/SKILL.md`（4 处；新增文本一律用该文件主语种英文，引用句用 `DESIGN-v3.md:81` 冻结中文逐字）

- **【B1】条款 1＋2＋3＋8＋7/9 — `## Portable dependencies` 引用块**（插在 `:85` `or auxiliary progress gate.` 之后的空行 `:86` 之后、`:87` 首个 bullet 之前）
  - 现状逐字（`:82-86`）：`Use the dependency packages declared in \`skill-deps.yaml\` directly: open each` / `selected dependency's declared \`SKILL.md\` and follow it in the current agent` / `context. Do not route dependency use through a dispatcher, invocation protocol,` / `or auxiliary progress gate.` ＋ `:86` 空行。段内无任何派发/等待/并发条文。
  - 改成逐字（新增 6 行，逐字）：
    ```markdown
    派发与等待按 `AGENTS.md` 的「派发子代理后不轮询等待」条执行；本条只引用，不复制其正文。
    按工作类型的派发、修复回原实施者与子代理产出契约见 `docs/adr/0034-subagent-dispatch-and-parallel-rules.md:51-105` 与 `CONTEXT.md` 的「子代理工作方法术语」节；本条只写本阶段应用。产出契约＝先落盘、只回摘要与 ref、按子问题增量。

    - Dispatch is by work type (implementation, testing, review, repair); implementation, testing, and review each use their own independent context. The dispatch unit is the work type, never a Phase number or a step number.
    - A repair returns to the same subagent session that produced the work (that session may be compacted mid-flight) and carries the original review or test findings; a fix never starts a new executor.
    - The main session only dispatches, collects, and runs interaction skills; it does not carry the bulk of reading or editing. The heavy reads of `## Work loop` are dispatched work, and a subagent never inherits the parent's full transcript.
    - Concurrency uses the host's available range (2–5 is the normal range); the per-task value comes from the parallel plan build-plan authored in the current `spec.md`. When the host cap is reached, queue the rest sequentially and record the real reason; never re-issue the same dispatch as a retry.
    ```
  - 会不会红：见总表第一行。**未确认项**：本件未读 `tests/contract/review-materials-contract.test.mjs`、`four-material-non-gate-contract.test.mjs`、`stage-reflection-skill-contract.test.mjs`、`session-binding-removed.test.mjs`、`ui-stage-integration.test.mjs`、`distribution-closure.test.mjs` 是否按窗口读本文件新增区间。
- **【B2】条款 4 — `## Authority and entry`**（插在 `:64` 空行之后、`:65` 之前，新增 1 行）
  - 现状逐字（`:65`）：`` `make-decision` exclusively owns Talk, Grill, and `decision-log.md`. ``
  - 改成逐字（新增行）：`Parallel work is planned, not improvised: interface symbol list, dependency-aware scheduling, the centered verification bottleneck, worktree isolation, and the concurrency range (2–5) are authored in build-plan's parallel plan; build-code only applies that plan and records the actual concurrency and any queueing reason.`
  - 会不会红：`tests/contract/stage-routing-and-concrete-testing.test.mjs:154` 只要求 `skills/{backend,frontend,fullstack}-testing/SKILL.md` 含 `build-code`，本句不含这些名字。
- **【B3】条款 5 — `## Work loop` 第 1 步**（在 `:208` `and its ACs are explicit before editing.` 之后另起一句）
  - 现状逐字（`:205-208`）：`Phase Card in the task's working area: goal, exact allowed files and symbols,` / `covered ACs, non-goals, compatibility boundary, predesigned test route, stop` / `conditions, and expected stage-end summary. Completion: the change boundary` / `and its ACs are explicit before editing.`
  - 改成逐字（追加一句）：`Every parallel work package also declares its read set, write set, file owner, interface symbol list, and merge responsibility; the declaration is a recorded fact for acceptance checks, not a pre-dispatch validation or a block.`
  - 会不会红：`tests/contract/build-code-apply-contract.test.mjs:20-24` 的 `/Phase Card/`、`/exact allowed files/` 已命中且不因加长同句而失效；新字段名不触发任何 schema（本表不改 `workflows/build-code/steps.json`）。
- **【B4】条款 6 — `## Work loop` 第 6 步**（在 `:239` `the affected work complete. Completion: no finding is unexplained.` 之后另起一句）
  - 现状逐字（`:236-239`）：`` `accepted_risk`, or `needs_human`. Repair valid findings in this same task and `` / `rerun affected checks. Reject invalid findings with evidence. Keep serious` / `unresolved risk visible and obtain the user's exact acceptance before calling` / `the affected work complete. Completion: no finding is unexplained.`
  - 改成逐字（追加一句）：`When a frozen interface must change, apply the G-1 close-out (specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:303, FR-15): stop parallel work first, let the main session re-plan the affected packages and record the superseded batch, and never continue into silent inconsistency; this is not the specification-ambiguity route of `## 统一回退协议`, and the main session only re-plans and records — it does not re-decide or open a new task.`
  - 会不会红：`runtime/stage/stage-content-contracts.mjs#validateFallbackProtocol`（原记 `:746`，现 `:901`）的签名 `validateFallbackProtocol({ stage, finding = {}, route = {}, completion = {} } = {})` 只吃结构化入参、不读技能正文（唯一运行时调用方在 `runtime/stage/stage-handlers.mjs`）。
- **【BX】不并入本表**：M1 §F 的 `workflows/build-code/SKILL.md:176` 路径形态缺陷（`:174-178` 的 OCR 分支点名 `` `skills/architect-code-review/SKILL.md` ``，会被 `runtime/evidence/check-skill-closure.mjs:702-704` 判 `undeclared skill`，且 `:713-716` 禁止用绝对路径规避）**不是方法落点**，原样保留在 `/tmp/wh-card03-design/V4-M1.md` §F，需单列处置。

### 【V 组】`workflows/verify-code/SKILL.md`（4 处；该文件主语种为中文）

- **【V1】条款 1＋3＋5＋6＋8 — 新节 `## 派发与回传`**（插在 `:154` 段末之后、`:156` `## 范围边界` 之前）
  - 现状逐字（`:154`）：`OCR 只负责确定性 packet/file 选择；独立 host executor 负责 LLM findings，OCR 不生成 finding。普通 verify-code 请求必须带当前代码 diff 与完整 AC 文本； malformed 请求直接报错。`（`:155` 空行、`:156` 为 `## 范围边界`）
  - 改成逐字（新增节）：
    ```markdown
    ## 派发与回传

    按工作类型派发子代理的完整方法在 `AGENTS.md` 的「派发子代理后不轮询等待」条与 `docs/adr/0034-subagent-dispatch-and-parallel-rules.md:51-105`；`CONTEXT.md` 的「子代理工作方法术语」节定义术语，本条只写本阶段应用。代码与材料阅读、定向复验属于阅读与执行类工作，派独立上下文子代理；子代理先落盘再只回摘要与 ref，回传按子问题增量、不自带全部对话、不回传长日志。主会话在本阶段只做派发、回收与交互类技能执行，不承担大量阅读或编辑。并行工作包各自声明读集、写集、文件 owner、接口符号清单和合并责任；声明是事实记录，供独立审查逐项核对实跑读写，不是派发前置校验，声明不实记为验收失败事实而不阻断派发。接口必须变更时按 G-1 收场（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:303` FR-15）：停并行 → 主会话重排 → 把作废批次登记为事实，不静默继续；未声明的接口变更只作为验收失败事实与重排输入，不作门禁。
    ```
  - 会不会红：`tests/verify-requirement-replay-contract.test.mjs:7-9`（只匹配 `/只审查代码/`、`/不重新检查其完整性/`、`/不列 AC 逐条结论/`）与 `tests/contract/no-external-stage-agent-gate.test.mjs:41`（只要求 `:25` 的「阶段 outcome 不是必需输入」仍在）均不读新增节；`tests/contract/session-binding-removed.test.mjs:13-17` 列的是 5 个被读文件路径、不是禁用词清单，不禁「子代理」。**未确认**：本件未核 `workflows/verify-code/SKILL.md` 是否有 `##` 标题序列断言（已知 `tests/contract/stage-handoff.test.mjs:220` 只匹配 `^## <数字>.` 形态，不覆盖本文件）。
- **【V2】条款 2 — `:144` 就地改（唯一与现状冲突的一条，必须成对改 manifest）**
  - 现状逐字（`:144`）：`` 2. **主 Agent 修复一次**：只修复影响当前代码交付的有效 finding；每个 finding 记录 `fixed`、`rejected_invalid`、`accepted_risk` 或 `needs_human`。 ``
  - 改成逐字：`` 2. **修复一次**：修复回到原实施子代理的同一会话继续（连续上下文），不为同一份实现另起新执行者；只修复影响当前代码交付的有效 finding；每个 finding 记录 `fixed`、`rejected_invalid`、`accepted_risk` 或 `needs_human`。 ``
  - 落点 2（`workflows/verify-code/steps.json:8`，**只改该字符串**，`step_slug`/`order`/`depends_on`/`entry_conditions`/`completion_evidence` 逐字不动）：现状 `"observable_result": "主 Agent 逐条判断并修复影响代码交付的有效 finding；不为材料或证据偏好扩散范围。"` → 改成 `"observable_result": "修复回到原实施子代理的同一会话继续，不为同一份实现另起新执行者；逐条判断并修复影响代码交付的有效 finding；不为材料或证据偏好扩散范围。"`
  - 会不会红：`tests/contract/review-step-forward-progress.test.mjs:31` 与 `tools/host/workflowhub-stage-agent-protocol.mjs:62` 都只读 `step_slug`（不改）；`tests/contract/verify-architect-acceptance.test.mjs:39-42` 只断言 step 顺序（review → publish → repair → repair）、不读 `observable_result`；真正的风险是「只改一边」的人工对读不一致（无自动断言）。同批需登记两处叙述性副本：`docs/standard-workflow.md:334`、`docs/stage-atomic-step-inventory.md:73`（见第四节）。
- **【V3】条款 4＋9 — `:145` 之后追加（本阶段默认串行）**
  - 现状逐字（`:145`）：`3. **必要定向复验**：只针对本次有效 finding 的修复和受影响行为运行检查，并保留 finding 处置与实际结果。`
  - 改成逐字（追加）：`并行时机：本阶段固定流程的四步按顺序执行，默认不使用并行子代理；只有第 1 步的材料包准备与第 3 步的定向检查在输入、依赖和文件归属互相独立时才并行，并发取宿主可用区间（2–5）的下限；达到宿主上限时排队顺序执行并记录真实原因，不重复重试派发。`
  - 会不会红：`tests/contract/verify-architect-acceptance.test.mjs:84` 要求 `/不为得到空 findings 或补齐证据再次调用|不派发第二次代码审查/`（由 `:108`/`:143` 满足），本句不触碰；`workflows/verify-code/steps.json:9-10` 的 step 5/6 已是单链顺序，本句只是把现状写成条文。
- **【V4】条款 7 — `:110` 之后追加（引用＋本阶段应用，不复制正文）**
  - 现状逐字（`:110`）：`review 结果只是质量事实，不是继续工作的许可证。缺质量事实只限制完成声明，不限制继续验收和修复；发现代码 finding 就回同一 task 修复，不新建任务。`
  - 改成逐字（追加）：`派发与等待按 `AGENTS.md` 的「派发子代理后不轮询等待」条执行；本条只引用，不复制其正文。长于宿主前台等待上限的 review 按上文「一次发起 + 一次阻塞收集」执行，不把同一请求拆成多次发起或多次轮询探测。`
  - 会不会红：新增句不含 `review step`、`manifest 前移`、`不自动回跳`，故 `tests/contract/review-step-forward-progress.test.mjs:105` 的窗口仍唯一由 `:171` 满足；不含 `:106` 负向清单中的任一串。**未跑**（逐串核对，非执行结果）。
  - **被删的 M3 原案**：M3 §3 C3 在 `:119`（`本分支由主会话显式读取技能，不增加固定审查轮次或旧 broker 依赖。`）后追加的条款 3 句与本【V1】新节重复 ⇒ 删除，见第二节 D3。

### 【M 组】`workflows/make-decision/SKILL.md`（3 处；条款 3/8 只引用）

- **【M1】条款 1＋5＋引用句＋executor 取值 — `:334` 整句替换**
  - 现状逐字（`:333-334`）：`这是执行方式说明，不是新的 stage、public command、runtime gate 或质量通过条件。` / `口径唯一来自 decision-log 的“Step×Executor 矩阵”和“上下文守恒规则”。`
  - 改成逐字（替换 `:334`，`:333` 一字不动）：`口径唯一来自 decision-log 的“Step×Executor 矩阵”和“上下文守恒规则”。executor 取值是 M（主会话）、S（子代理）、B（后台）、P（并行）四个记号，组合写法（如 M+S、S 为主）的第一个记号是本步的责任方，矩阵里出现的其它记号不构成第五种执行者。方法正文见 `docs/adr/0034-subagent-dispatch-and-parallel-rules.md:51-105` 的决定与 `AGENTS.md` 的「派发子代理后不轮询等待」条；派发单位是工作类型（实施、测试、审查、修复），不是本表的 step 序号。并行工作包各自声明读集、写集、文件 owner、接口符号清单和合并责任；声明是事实记录，供独立审查逐项核对实跑读写，不是派发前置校验，声明不实记为验收失败事实、不阻断派发。`
  - 会不会红：无断言覆盖（`:331-362` 无测试读取）。
- **【M2】条款 4＋9 — `:357` 整条替换（对齐 ADR 已登记的落地代价）**
  - 现状逐字（`:357`）：`3. 并行上限固定为：研究 4、debate 4、红蓝 2；交互步骤与依赖链按顺序执行，不为并行而并行。`
  - 改成逐字：`3. 并发按宿主可用区间派发（2–5 为常规区间；研究/debate 取 4、红蓝取 2 是本阶段的常规取值）；交互步骤与依赖链按顺序执行，不为并行而并行；具体每个任务开几个并发由 build-plan 的并行方案逐任务定。宿主达到并发上限时把剩余工作排队顺序执行并记录真实原因，不重复重试派发。`
  - 会不会红：无断言覆盖。依据 `docs/adr/0034-subagent-dispatch-and-parallel-rules.md:141-142`（`落地时的已知代价如实登记：`workflows/make-decision/SKILL.md`（并行上限条；原记 `:357`，现 `:368`） 现有的固定并行上限（研究 4 / debate 4 / 红蓝 2）要与「2–5 区间」对齐`）＋决定 4（`:69-70`）。
- **【M3】条款 2 — `:360` 之后新增第 7 条**
  - 现状逐字（`:360`）：`6. M 每步只依赖上一步的决策摘要和材料 ref；S 可按任务需要读取已落盘的完整材料，但不能把旧步骤全文重新塞回 M。`
  - 改成逐字（追加新条）：`7. 修复回到原实施子代理的同一会话继续（连续上下文，允许该会话中途被上下文压缩），并附上审查/测试发现的原文；不为同一份实现另起新执行者。`
  - 会不会红：无断言覆盖（`:355-360` 无测试读取）。
- **只引用、不加字的三处**：条款 3 ＝ `:342-349`（`M 独占…`）＋ `:358`（`问题卡与用户回复只登记在 decision-log T 表；交互由 M 发出，不能由 S/B 代答。`）；条款 8 ＝ `:355`（`…主会话只保留 \`ref + sha256 + 结构化摘要（≤500 字）\`。`，增量回传并入 `:356` 的尾句为可选，本表裁决**不加**，改由【M1】的引用句指向 `CONTEXT.md:463-464`）。
- **不做落点的条款**：条款 6（本阶段无并行批次可作废）、条款 7（13 步全是单体技能或 review 调用，无子代理等待面）⇒ 空落点，由 `:362`（`这些规则只约束上下文和执行方式，不改变已有阶段契约、事实状态或推进边界。`）自限。

### 【P 组】`workflows/build-plan/SKILL.md`（1 处新增行 + 3 处原地追加；安全区 `1-8, 14-38, 42-43, 45, 47-93, 98-128, 130-215, 224`）

- **【P1】条款 1＋2＋3 — 新增 `##` 小节**（插在 `:90` 与 `:92` 之间；行号整体下移 7 行，字符偏移约 11600，位于 P3(13865)/P4(14164)/P5(14067–19388) 之前）
  - 现状逐字（`:86-92`）：`its broker request must produce findings in an independent reviewer context. It is not` / `an inline self-review lens and does not share the current session's judgment.` / `\`simplicity-guard\` and the plan-review lenses inspect the same plan material and` / `return advisory findings; they do not create extra calls, state, or permission` / `checks.` / 空行(`:91`) / `\`testing-system-blueprint\` designs risks, scenarios, oracle, evidence path, and`(`:92`)
  - 改成逐字（新增 8 行）：
    ```markdown
    ## Subagent work types and dispatch

    Beyond the `execution: independent` packages of `## Portable dependencies`, dispatch
    is by work type — implementation, testing, review, repair — as independent contexts,
    never by Phase number or flow step number. A repair returns to the same subagent
    session that produced the work. The main session only dispatches, collects, and runs
    interaction skills; it does not carry the bulk of reading or editing.
    This section does not add a stage, gate, receipt, status field, or public command.
    ```
  - 会不会红：`tests/contract/phase-quality-handoff.test.mjs:72-73` 与 `tests/contract/ui-stage-integration.test.mjs:172` 消费的是 `:80-95`、`:129` 段，本小节不含 `Do not run Talk, Clarify, or Grill`、不改 `:81-83`；五条距离正则（`tests/contract/post-cohort-executable-authoring.test.mjs:65-69`）的命中行与跨度按 §M2.1 实测不变。
- **【P2】条款 6 — `:242` 行尾原地追加（不得新增行）**
  - 现状逐字（`:241-242`）：`` `fixed`, `rejected_invalid`, `accepted_risk`, or `needs_human`; repair valid `` / `findings in this same task.`
  - 改成逐字（并入 `:242` 同一行行尾）：`… repair valid findings in this same task. When a frozen interface must change, every parallel unit stops, the main session re-plans, the superseded batch is recorded as void, and only then does work continue — no silent inconsistency between units writing to the same surface (G-1 close-out; specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:303 FR-15).`
  - 会不会红：`tests/contract/stage-routing-and-concrete-testing.test.mjs:231-232` 的窗口在 `:243-244`（跨度 138、无距离上限）；就地追加不改行号，比另起新段更安全。
- **【P3】条款 4 — `:265-268` 段末原地追加**
  - 现状逐字（`:265-268`）：`Every Phase is an independent file with L0/L1/L2, exact write set and` / `dependency, tasks, tests, STOP, done evidence, and rollback. Global solution` / `and source-to-acceptance trace live in \`spec.md\`; execution facts live in task` / `facts/quality evidence, not the pointer index.`
  - 改成逐字（段末追加）：`Parallel work for this task is produced here, not later: the interface symbol list (file-level symbols and the import graph), dependency-aware scheduling, the centered verification bottleneck, worktree isolation (per-worktree dependency install, gitignored files such as .env copied in, no symlinked dependencies, detached HEAD, cleanup of the O(N) disk cost), and a concurrency ceiling inside the host's available 2–5 range — the per-task value is decided here. Parallelism goes only to work packages whose inputs, write sets, and environment are independent; when an interface must change, parallel work stops first and the main session re-plans before it continues.`
  - 会不会红：本行位于 P5 死区（字符 16800 落在 14067–19388 内）⇒ 只许原地追加；命中行仍为 `:225-307`、跨度只随追加文本自身增长。
- **【P4】条款 5 — `:290-292` 段末原地追加**
  - 现状逐字（`:290-292`）：`Each implementation file appears in one Phase boundary and each task file list is a subset of` / `that phase. Parallel phases/tasks require independent inputs, dependencies, and` / `file ownership.`
  - 改成逐字（段末追加）：`Every parallel work package declares its read set, write set, file owner, interface symbol list, and merge responsibility in the plan. Declarations are facts recorded for acceptance checks: a missing or inaccurate declaration is an acceptance failure fact and neither blocks dispatch, continuation, or release, nor acts as a progress gate. A completed package broadcasts which public symbols it changed to the packages still running.`
  - 会不会红：同【P3】（P5 死区内，只许原地追加）。`声明` 一词在本文件仅 `:63` 一处（阶段末披露协议），不同义。
- **条款 7/8 已存在，只引用**：`workflows/build-plan/SKILL.md:80-82`＝`Packages declared \`execution: independent\` run in their own independent` / `context and return only their findings; do not inline them or route them` / `through a dispatcher. This includes research when needed and`（**勘误：M2 §M2.6 记作 `:84`/`:82`，实读为 `:80-82`**）。落地＝在【P1】小节内引用该句 + `CONTEXT.md:463-464`，**不再新增第四处回传字段枚举**；`DESIGN-v3.md:81` 的冻结引用句按 `DESIGN-v3.md:71` 进本文件 `## Portable dependencies` 段末各一次（本表并入【P1】小节首句与【B1】首行）。

## 第二节：去重与冲突消解

**去重（同一落点被两份交付/同一交付两处引用）**

- **D1｜build-plan 条款 1/2/3 各出现两次**：M2 §M2.2 新小节已含条款 1＋2＋3；M2 §M2.3 A（`:87` 后追加条款 2）与 §M2.3 B（`:108-109` 段末追加条款 3）是同一批条款的第二次表述。**裁决：删 §M2.3 A/B，只保留【P1】新小节**。依据 `DESIGN-v3.md:71` 的 D4 逐字（`不复制正文（D4：规则正文唯一权威，各阶段各引用一次）`）与 `V4-BRIEF-2.md:27`（`各阶段技能引用它 + 写本阶段的特有应用，不复制正文`）。
- **D2｜build-code 条款 5 出现两次**：M1 §B 的引用块第 2 行同时写「声明（读集、写集、文件 owner、接口符号清单、合并责任）」与条款 9 的并发；条款 5 又在 `## Work loop` 第 1 步落一处。**裁决：引用块那行删去声明枚举，只留条款 9＋7 的排队/不重试尾句（见【B1】第 4 个 bullet）；声明字段只留【B3】**——Phase Card 才是声明的物理载体。
- **D3｜verify-code 条款 3 出现两次**：M3 §3 C1 新节已含条款 3；C3 又在 `:119` 后追加同义句。**裁决：删 C3，只留【V1】新节**（`workflows/verify-code/SKILL.md:119` 一字不动）。
- **D4｜条款 7/8 三份交付口径一致但落点需收敛**：M2 §M2.6（build-plan 只引用 `:80-82`）、M3 §3 C8（verify-code 的条款 8 并入新节）、M1 §C 第 7 条（build-code 无载体 ⇒ 引用 `CONTEXT.md:463-464`）三者不冲突。**裁决：三处都写引用、都不重抄条款正文**；条款 7 的正文唯一副本是 `AGENTS.md` 条②（`DESIGN-v3.md:75`）。

**口径不一致（冲突）与最终裁决**

- **C1｜正文引用对象**：M1 §B 第 1 行指向 `docs/standard-workflow.md` 的「五阶段统一派发方法」；M2 §M2.2 指向 `docs/adr/0034-…:51-105`；M3 §12.2 指向 `AGENTS.md` 条②（并论证 E.3 与该文件无关）。**裁决：三者取并集但各有分工**——条款 7/9 正文锚 `AGENTS.md` 条②（`DESIGN-v3.md:71/75/78-81` 已冻结），条款 1/2/3/5/6/8 正文锚 `docs/adr/0034-…:51-105`，术语与产出契约锚 `CONTEXT.md:455-464`；**`docs/standard-workflow.md` 不作正文锚**（M1 §B 首行据此改写；M1 §G 第 3 条自陈的不确定由此关闭）。
- **C2｜make-decision `:357` 改不改**：M2 §M2.4 保留 `:357` 原值、只把 2–5 限定为「本工作流的宿主可用区间」；M3 C13 把 `:357` 改成区间并指向 build-plan。**裁决：M3 胜**。依据 `docs/adr/0034-subagent-dispatch-and-parallel-rules.md:141-142` 已把「`:357` 的固定上限要与 2–5 区间对齐」登记为**落地时的已知代价**，且决定 4（`:69-70`）逐字要求「具体每个任务开几个并发，在 build-plan 的并行方案里逐任务定」；保留两个互不引用的数字反而构成 M2 自己担心的两套权威。
- **C3｜M2 的行号勘误（本件实读）**：① `:355` 不是并行上限，**并行上限在 `:357`**；`:355` 是条款 8 的「先落盘/只保留 ref」句（M2 §M2.11 第 1 条、§M2.4、§M2.9 三处同源错误；ADR `:141` 亦写作 `:357`）。② 条款 7/8 的 build-plan 既有句在 `:80-82`，不是 `:84`/`:82`（M2 §M2.6）。③ `Every Phase is an independent file…` 是 `:265-268`，不是 `:266-268`；`Parallel phases/tasks require independent inputs…file ownership.` 是 `:290-292`，不是 `:292`（M2 §M2.4）。④ build-code 的 `or auxiliary progress gate.` 在 `:85`（不是 M1 §B 的 `:84`），引用块插入点是 `:86` 空行之后、`:87` 首个 bullet 之前（不是 M1 的 `:85`/`:86`）；⑤ 「the affected work complete. Completion: no finding is unexplained.」在 `:239`（不是 M1 的 `:240`）。**裁决：本表行号以实读为准，所有落点同时给文本锚点**。
- **C4｜M3 §12.2 的 `:110` 追加句自相矛盾**：该句前半是 `本条只引用，不复制其正文`，后半却复制了条款 7 的行为正文（`派发后不轮询、不空转，回传即事件，同一派发不重复发起`）。**裁决：删后半的正文复述，改用【V4】的写法**（冻结引用句＋本阶段应用），否则同一句自我否定且与 `AGENTS.md` 条②形成两处正文。
- **C5｜条款 6「G-1」是悬空标签**：`grep -rn "G-1" docs/ workflows/` **零命中**——仓内没有 G-1 载体；G-1 的唯一逐字原文在归档检索材料 `specs/archive/workflowhub-thin-core-card-07-20260919/research/coverage-matrix.md:269`（`| G-1 | 并行前已冻结接口蓝图，若实施中发现接口必须改，怎么收场 | 停并重排 | 停并行、由主会话重排后继续；那批并行收益作废，但不产生静默不一致 |`），权威需求是 `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:303` FR-15（`接口必须变更时执行 G-1 收场:停并行、主会话重排、记录作废批次,无静默不一致。`）。M1/M2/M3 的条款 6 文本都只写「按 G-1 处理」。**裁决：条款 6 的落地句必须把行为写全（停并行 → 主会话重排 → 登记作废批次 → 无静默不一致），G-1 只作来源标注并附 `prd.md:303` 锚点，不得作为单独的仓内引用**（否则形成悬空权威，与 `docs/adr/0034-…:124-126` 认定的「同一判据两处权威」同源）。
- **C6｜build-plan P5 死区内的「另起新段」选项**：M2 §M2.5 给了二选一（新增行 or 并入同一行）。**裁决：一律并入同一行/同一段行尾（【P2】【P3】【P4】）**。依据结论 #4：P5 跨度 5321 字符、余量 0（`tests/contract/post-cohort-executable-authoring.test.mjs:69`，命中 `:225-307`），该区间内只能原地追加。
- **C7｜语种**：M1 给英文文件 `workflows/build-code/SKILL.md` 写中文句；M2 给 `workflows/build-plan/SKILL.md` 写英文句；M3 给两个中文文件写中文句。**裁决：阶段应用句用该文件主语种（build-code/build-plan 英文，verify-code/make-decision 中文）；条款 7/9 的引用句用 `DESIGN-v3.md:81` 的冻结中文逐字（该句是设计书已冻结文本，不得改写，见【B1】首行与【P1】首句）**。语种混排的残留风险列入第五节。
- **C8｜术语统一**：三份交付混用「并行上限」（M1 §B、M2 §M2.4）与「并发区间」（M3 C13、BRIEF-2 条款 9）。**裁决：数量一律用「并发」，方式一律用「并行」，2–5 一律写成「宿主可用区间」**（对齐 ADR 决定 4 与 `AGENTS.md` 条②逐字）。
- **C9｜设计书错误结论（已推翻）**：`/tmp/wh-card03-design/DESIGN-v3.md:1113`（§6.1 #16）逐字 `| 16 | workflows/make-decision/SKILL.md | 仅当 §7 裁决涉及（本设计未改其正文） | **排队** | card-04 实测 +11（@@ -204,0 +205,11 @@，未触 :331-362） |` —— **与 ADR 冲突**：`docs/adr/0034-subagent-dispatch-and-parallel-rules.md:54-55` 逐字 `workflows/make-decision/SKILL.md:331-360` 的 M/S/B/P 执行模型（M＝主会话、S＝子代理、B＝后台、P＝并行）是这一方法的现有记号，本决定把它推广到全部五个阶段。**裁决：#16 的「改什么」栏必须改为本表【M1】–【M3】的实际改动（或拆成 #16a 排队 / #16b 本卡内做），「处置」栏保持「排队」**；本卡在 make-decision 阶段不实际改 `workflows/*/SKILL.md` 的时间边界（ADR `:137-140`）不影响该结论的正确性。
- **C10｜不并入本表的项**：M1 §F（`workflows/build-code/SKILL.md:176` 的 `` `skills/architect-code-review/SKILL.md` `` 路径形态）不是方法落点，保留在 M1 §F 单列处置（见【BX】）。

## 第三节：`workflows/build-prd/SKILL.md` 的「明确不适用理由」（可直接落设计书）

**字段 1｜适用性判定**：条款 1–9 全部记为**不适用**。理由：条款 1–9 描述的是「多工作包实施阶段的子代理派发与并行」，其载体是 phase 材料模型与执行子代理；`workflows/build-prd/` 两者都没有。这不是缺口，是事实结论。
**字段 2｜落点**：无。`workflows/build-prd/SKILL.md`（124 行）与 `workflows/build-prd/steps.json`（91 行）内 `phase` / `phases` / `并行` / `子代理` / `派发` **全部零命中**；steps.json 恰好 6 个 step，每步字段只有 `step_id`/`step_slug`/`order`/`entry_conditions`/`completion_evidence`/`observable_result`/`depends_on`。
**字段 3｜依据（完整路径＋行号）**：① `workflows/build-prd/SKILL.md:17-18` 明文禁止写 `spec.md`/`plan.md`/`tasks.md`（禁止语义，非产出语义）；② `workflows/build-prd/SKILL.md:119-124` 四条边界逐字：`Do not add \`build-prd\` to the canonical five stages or their stage manifests.` / `Do not add \`prd.md\` to \`CURRENT_MATERIAL_FILES\`.` / `Do not dispatch this Markdown file through \`core/dispatch-component.mjs\`; discovery and packaging are static portable-workflow concerns.` / `Do not add a second dispatcher, review system, content writer, store, gate, or public command.`；③ `config/workflowhub.yaml:16-19` 把它登记为 `kind: portable_workflow`（不是可执行组件），同文件 `:2-5` 注明 portable 条目只用于发现、会被通用 Node dispatcher 拒绝；④ `tests/integration/distribution-closure.test.mjs:42-61` 断言 6 个 step、无 `stage_outcome` 证据种类、每步有 `portable_workflow_outcome`、正式（`kind !== portable_workflow`）条目为 8、`formalEntries.some((workflow) => workflow === "build-prd") === false`；⑤ `tests/contract/build-prd-review-contract.test.mjs:137` 断言 `expect(matrix.stages).not.toHaveProperty("build-prd")`。
**字段 4｜替代承载（若未来需要）**：`workflows/build-prd/SKILL.md:22-29` 已有可无损复用的口径（`子任务`/`最小读取集`/`母任务`/`兄弟`/`只读`/`不触发母任务 close`/`不移动`/`不删除`/`边界偏离`/`实际偏离`/`原因`，由 `tests/contract/spec-prd-skill-contract.test.mjs:230-249` 的文本集合与 `skills/spec-prd/SKILL.md` 共同满足）。本卡不改该文件。
**字段 5｜测试影响**：零（不落点即不改一行）。反向判据：任何一次试图在 `workflows/build-prd/**` 补 phase／派发落点的改动，都会直接触发字段 3 的 ④⑤ 两条断言，并与 ③ 的 `kind: portable_workflow` 登记冲突。
**字段 6｜恢复条件**：若将来 build-prd 被提升为正式 stage，必须先同批改 `config/workflowhub.yaml:16-19`、`tests/integration/distribution-closure.test.mjs:42-61`、`tests/contract/build-prd-review-contract.test.mjs:137` 与 `workflows/build-prd/SKILL.md:119-124` 的四条禁令；方法落点在那一批里复评，本卡不预置。
**一句话**：条款 1–9 对 build-prd 的正确处置是**明确不适用并记录理由**，不是补落点；补写会与它自己的四条边界禁令和两条断言正面冲突。

## 第四节：`docs/standard-workflow.md` 的落点判定

**判定：不需要方法正文落点（零新增行）。** 该文件 402 行（**2026-09-29 复核更正**：`docs/standard-workflow.md` 现为 **450 行**），`grep -n "子代理\|派发\|并行\|工头" docs/standard-workflow.md` **3 命中**（**2026-09-29 复核更正**：原记「零命中」实测为**假**；重跑同一条命令得 `docs/standard-workflow.md:94`「正式审查**派发**次数」、`:113` 正式回执「各一次**派发**一份」、`:321`「`[P]` 不授权跨 Phase **并行**推进」——三处均为计数或纪律语境，**无一处承载派发方法语义**，故本节判定不变）；最近的候选锚点是 `docs/standard-workflow.md:64` `### 执行 step`、`:81` `### review、测试和成本`、`:94` `### stage 结束`（无一个承载派发语义）。
**理由（逐条）**：
1. 正文权威已经足量且已冻结：条款 1–9 的正文在 `docs/adr/0034-subagent-dispatch-and-parallel-rules.md:51-105`（决定十条）＋`AGENTS.md` 条②（`DESIGN-v3.md:71/75/78-81` 已把条款 7/9 的正文与引用句冻结，落点就在 `AGENTS.md:15` 与 `:16` 之间）＋`CONTEXT.md:455-464`（术语与产出契约）。再写一处＝第四套权威，正是 `docs/adr/0034-…:124-126` 明确否决的「同一判据两处权威」。
2. `docs/standard-workflow.md:88-92` 是禁区（五行为 `没有真实主题变化，不重复全文读取、测试、review 或 analyzer。…不改变 provider status 的运行时所有权。`；`specs/workflowhub-thin-core-card-03-20260919/decision-log.md:35` 第 (3) 条明令，`DESIGN-v3.md:121` 复述），且 `:92` 之后的新增行已由 `DESIGN-v3.md:121/122`（R3）、`:196`（R8）、`:246`（R11）、`:394`（R15）排定；再插一条会形成第六处同位置文本（M3 §12.2 已主动撤回它把条款 7 落进该文件的提议）。
3. 该文件的操作语境是按 `steps.json` 顺序执行 step（`:64-79`）；插入与本文件词汇体系无关的方法正文会脱节，且只留一条指针会让五个技能都要改指它，制造「哪份文档是方法之家」的第二权威。
4. `V4-BRIEF-2.md:27` 的括注（`规则正文只写一处（docs/standard-workflow.md）`）与 `DESIGN-v3.md:71/75/81` 的冻结落点冲突；**以 DESIGN-v3 的冻结口径为准，BRIEF-2 的括注作废**（这是一处需主控确认的口径消解，见第五节）。
**一处既有叙述性副本（不是新落点，但需同批处置）**：`docs/standard-workflow.md:334`＝`4. \`main-agent-repair-batch-1\`：逐条判断有效 finding，并在同一任务修复。`（位于 `:321 ## verify-code…`、`:329 ### 标准步骤与最小结果` 段内）。它与【V2】改后的 executor 口径不一致。它不是断言载体：`grep -rn "逐条判断\|同一任务修复" tests/ runtime/ tools/` **零命中**；`main-agent-repair-batch-1` 的机器消费者只有 `tests/contract/review-step-forward-progress.test.mjs:31`（读 steps.json）与 `tools/host/workflowhub-stage-agent-protocol.mjs:62`（读 steps.json）。**处置建议：与【V2】同批单行就地改写为与 `workflows/verify-code/steps.json:8` 相同的口径，或显式登记为只读历史叙述副本；不新增行、不新增权威。**另一处同类副本是 `docs/stage-atomic-step-inventory.md:73`（`| verify-code | 4 | main-agent-repair-batch-1 | repair | fix valid delivery findings in the same task |`）。
**读该文件的定向测试集合（改 `:334` 前须跑，不跑全量）**：`tests/contract/workflow-quality-regression.test.mjs:55`、`tests/contract/stage-reflection-skill-contract.test.mjs:14`、`tests/contract/freeze-classification-budget-usage-protocol.test.mjs:311,320`、`tests/contract/governance-review-dispatch-boundary.test.mjs:5`、`tests/contract/tier-c-deletion-boundary.test.mjs:111`、`tests/contract/post-cohort-governance-materials.test.mjs:8`、`tests/contract/stage-reflection-e2e-constructed.test.mjs:466`（断言该文件含 `specs/<task-id>`），另 `tests/fixtures/stage-reflection/ac-mapping.md:18` 把它登记为 AC-011 的 process 来源。**未确认**：这 8 条读取点是否有窗口覆盖 `:334` 附近（本件未逐条读，属未覆盖面）。

## 定向验证命令（本件**未执行**，按硬规则不得跑全量）

- 【B 组】`npx vitest run tests/contract/build-code-apply-contract.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs`
- 【V 组】`npx vitest run tests/contract/review-step-forward-progress.test.mjs tests/contract/verify-architect-acceptance.test.mjs tests/contract/no-external-stage-agent-gate.test.mjs`（另：先单独确认 `tests/verify-requirement-replay-contract.test.mjs` 的基线红绿）
- 【M 组】`npx vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/decision-log-content-contract.test.mjs`
- 【P 组】`npx vitest run tests/contract/post-cohort-executable-authoring.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/ui-stage-integration.test.mjs`
- 【build-prd】`npx vitest run tests/integration/distribution-closure.test.mjs tests/contract/build-prd-review-contract.test.mjs`
- 【标准流程文件】见第四节 8 个文件；`docs/standard-workflow.md:334` 的改法是单行替换，不引入新门禁/新哈希/新 public 命令/第二进度权威。

## 残留不确定

1. **五阶段集合本身有第三种口径**：本表按交办书与 `docs/adr/0034-…:51-53` 的五阶段（`make-decision`／`build-prd`／`build-plan`／`build-code`／`verify-code`）产出；但 `ls workflows/` 实读为 `_spike, build-code, build-plan, build-prd, build-spec, make-decision, verify-code`，且 `docs/standard-workflow.md:187` 有正式 `## build-spec：…` 节。**不确定**：`workflows/build-spec/SKILL.md` 是否也需要方法落点。**需要怎么测**：读 `config/workflowhub.yaml` 的正式条目清单 + `docs/standard-workflow.md:29-43`（`## 正式 stage 集合与 cohort 路线`），确认五阶段口径后再定；若要补，逐字段按第二节的裁决逐条落。
2. **make-decision 的 executor 取值口径与设计书 R14 草案冲突**：`/tmp/wh-card03-design/DESIGN-v3.md:294-295` 写「executor 取值只有 M、S、B 三种」，而 `workflows/make-decision/SKILL.md` 的 executor 表（原记 `:338-351`，现 `:349-362`） 表内实有 `M+S`／`S 为主`／`B+S`／`M`／`S+M`／`S+B`／`B+M` 等复合值。**不确定**：R14 草案是否已计数冻结、能否在 §10 折入时按【M1】改正。**需要怎么测**：以 `:338-351` 表为唯一事实逐行数 executor 列取值，再人工对读 R14 与【M1】（纯文本对读，无测试可跑）。
3. **build-plan P5 的字符跨度只在 LF＋尾换行下实测**（`14067–19388`、命中 `:225-307`、余量 0）。**不确定**：换行风格或尾换行变化后是否仍成立。**需要怎么测**：落地后以同一 node 脚本打印 P5 起止字符与命中行，确认跨度不变；同时断言 P4 之前无新增 `G-2`。
4. **本表所有「会不会红」都是逐串核对＋断言文本判读，不是执行结果**（本件全程未跑测试）。**需要怎么测**：按上一节的六组定向命令逐组跑，禁止全量 `vitest`／`npm test`／`test:safe`。
5. **verify-code 基线红**：`tests/verify-requirement-replay-contract.test.mjs:7-9` 要求 `/只审查代码/`、`/不重新检查其完整性/`、`/不列 AC 逐条结论/` 三句，实读 `workflows/verify-code/SKILL.md` 三句都不存在（最近语义近邻是 `:43`）。**不确定**：CARD-04 的 +37 行是否会补上这三句（本件未读 CARD-04 worktree）。**需要怎么测**：合并后只跑该文件一次；若仍红，记为本卡外的既存红，不得在本卡顺手改。
6. **build-code 的新增行是否会触发未读断言**：本件已读 `tests/contract/build-code-apply-contract.test.mjs:1-45`（其余 34 行按 M1 报告），未逐条读 `review-materials-contract`／`four-material-non-gate-contract`／`stage-reflection-skill-contract`／`session-binding-removed`／`ui-stage-integration`／`distribution-closure` 中读本文件的部分。**需要怎么测**：`grep -rln "build-code/SKILL.md" tests/` 后逐文件读其断言窗口，或直接跑【B 组】命令。
7. **verify-code 新 `##` 小节是否安全**：已知 `tests/contract/stage-handoff.test.mjs:220` 只匹配 `^## <数字>.` 形态、不覆盖本文件，M2 也实测无标题名断言，但本件未穷尽 `docs/**`／`tools/**` 的间接消费。**需要怎么测**：`grep -rn "verify-code/SKILL.md" tests/ docs/ tools/ runtime/` 逐条核对是否有按标题切片；落地后跑【V 组】。
8. **语种混排**：`DESIGN-v3.md:81` 的冻结引用句是中文，而被指定的两个落点文件（`workflows/build-code/SKILL.md`、`workflows/build-plan/SKILL.md`）通篇英文。**不确定**：是否要为主语种一致而重冻结该句。**需要怎么测**：以设计书 §1 R1 的冻结文本为准落地（本表照冻结逐字）；若要改语种，须由主控重新冻结，不由实施者自创。
9. **build-prd 的恢复条件未验证**：字段 6 的「提升为正式 stage」路径是推理，未实跑 `config/workflowhub.yaml` 的 consumer 与两条断言的联动态。**需要怎么测**：仅在该决定真的要做时，跑【build-prd】组的两个文件。

## §12 验收载体与丢失落点回填（V4-D 原始交付，附录）
**性质**：填充件（不是判定书）。对象＝`/tmp/wh-card03-design/DESIGN-v3.md`（1368 行）+ `V4-M4.md`（216 行）；权威＝`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919/specs/workflowhub-thin-core-card-03-20260919/decision-log.md`（474 行；**2026-09-29 复核更正**：现为 **747 行**，且原记「474 行」在本分支历史中**无法复现**——该文件在本分支历次提交最小为 711 行（`5202828a`））。本次只读，未改任何仓库文件、未跑测试、未做 git 写。§2.6 与 §1.2 给出可直接粘贴的逐字块；每条回填都带授权来源，无授权的不写。

## 0. 三条口径（后面所有处置都按它判）
- **处置列只描述执行时序，不描述归属**：`V4-M4.md:32-34` 逐字定义——「本卡内做」＝「按 §6.3 的批次直接写，**无需等待任何合并**」；「错开实施」＝「该落点所在文件在 CARD-04 写面内，但……**仍属本卡交付**（**不是**排除），在 CARD-04 分支合并进 main **之后**执行」。
- **T-013③ 约束的是写入时点，不是落点归属**：`decision-log.md:55` 逐字「③因此本卡在 make-decision 阶段**不实际改任何 `workflows/*/SKILL.md`**，只产出接口/方法面的冻结候选与计划」。⇒ 本阶段内 `workflows/*/SKILL.md` 一行不写，**落点仍属本卡**，写入时点＝本阶段结束之后按批次表执行。这与 `V4-M4.md` 作废「冻结候选」这个值**不冲突**：前者说时点，后者说归属。
- **验收事实的载体只有三层**：① 本卡材料——`decision-log.md:377` 逐字「**本卡当前写面**：`specs/workflowhub-thin-core-card-03-20260919/decision-log.md`（本文件，本轮由本子代理直接写入的唯一文件）」；② 当前 stage 行的 `finding_dispositions`（`runtime/stage/completion-predicates.mjs:124`）；③ task_dir 质量证据区。**不得**新增 `facts.jsonl` 行类型（`runtime/task/task-store.mjs:220` 逐字 `export const TASK_RECORD_KINDS = Object.freeze(["stage", "close_action"]);`）、**不得**写入 quality fact（同文件 `:179` 逐字 `throw new Error(\`quality facts must be stored under quality/facts, not facts.jsonl line ${index + 1}\`);`）。

## 1. 第一条：T-002 验收载体（最重要的四问）
T-002 裁决逐字（`decision-log.md:44`）：「验收 oracle 取 A：主证据＝card-03 自身执行事实；G-1 走**演练**而非实遇；build-prd 记「明确不适用理由」；取证只采事实，**判定必须来自独立上下文**（禁止自审自判）；不另起独立样例 task」。设计书全文 grep：`演练` 0 命中、`独立上下文` 0 命中、`自审自判` 0 命中、`收敛检查` 0 命中 ⇒ 四问全无落点。

### 1.1 四条裁决 → 落点 → 逐字（总表）
| T-002 的四条 | 落点（写进哪个文件的哪一段） | 逐字文本 | 授权 |
| --- | --- | --- | --- |
| ① G-1 走「演练」 | 新增节：在 `DESIGN-v3.md:1330`（`## §10 折入溯源表`）**之前**插入 `### §9.A 本卡验收的载体与不适用清单（T-002=A）` 的第一小节；并在 `:696`（§3.7 G-1 行）就地追加一句 | §1.2 | T-002=A（`:44`）+ OI-005（`:215`）|
| ② build-prd 记「明确不适用理由」 | 同上 `### §9.A` 第二小节；指向 OI-006 | §1.3 | T-003=A（`:45`）+ OI-006（`:229`）|
| ③ 取证只采事实、判定来自独立上下文 | 同上 `### §9.A` 第三小节；并挂到 `AGENTS.md:23` 之后的条③（`DESIGN-v3.md:62` 的草案已覆盖一半） | §1.4 | T-002=A（`:44`）+ T-024=A（`:65`）+ `AGENTS.md:17`（**既有行**）|
| ④ 不另起独立样例 task | 同上 `### §9.A` 第四小节（写成逐字「本卡不做」） | §1.5 | T-002=A（`:44`）+ T-003=A（`:45`）|

**新发现（必须先说）**：`独立上下文 / 禁止自审自判` 在**仓库里已有常驻载体**——`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919/AGENTS.md:17` 逐字 `- 质量裁决由独立来源独立上下文产出，禁止自审自判。` 所以 T-002 第③条不是「仓里没有」，而是「**设计书一次都没引用它**」。回填时只引用、**不新增同类条文**（避免在常驻上下文文件里造第二份权威）。

### 1.2 落点①：G-1「演练」——两处逐字
**(a) `DESIGN-v3.md:696` 就地追加。** 现状逐字＝`| **G-1** 缺"进入前必须为真"独立字段 | 13/13 退化为 `Dependency` 单指针 | **不加字段**：由 `:5`（头部）、`:19`（`explicit earlier dependencies`）、`:34`（Task 卡）三处既有承载（§3.2） | 否 |`。在该行「本设计的处置」列末尾追加：

```
**不加字段**：由 `:5`（头部）、`:19`（`explicit earlier dependencies`）、`:34`（Task 卡）三处既有承载（§3.2）｜**字段不加，G-1 的验收改由 §9.A 的演练记录承担（T-002=A：G-1 走演练而非实遇）**
```

**(b) `### §9.A` 第一小节逐字：**

```markdown
### §9.A 本卡验收的载体与不适用清单（T-002=A）
**1. G-1 走演练（对应 AC-14）**：本卡不实遇接口必须变更（本轮没有任何实现改动），改为**一次桌面演练**：由主会话按 G-1 三步处置（停并行 → 主会话重排 → 登记作废批次）走一遍，记录写入本卡 `decision-log.md` 的「八、G-1 演练记录」（形状见 V4-D.md §3）。演练记录**只采事实**：每一步记录做了什么、谁做的、产出什么引用；判定由独立上下文子代理给出。演练**不阻断推进**（SD-17；同 `workflows/verify-code/SKILL.md:110` 逐字「review 结果只是质量事实，不是继续工作的许可证。缺质量事实只限制完成声明，不限制继续验收和修复。」）。
```

### 1.3 落点②：build-prd「明确不适用理由」——逐字
```markdown
**2. build-prd 记「明确不适用理由」（对应 AC-15）**：本卡 `cohort=post`，路线不含 build-prd，AC-15 的「五阶段」中的 build-prd 一格**记明确不适用理由，不记失败、不补跑**。逐字依据＝`decision-log.md:45`（T-003=A）：「本卡不跑 build-prd、也不另跑 pre 样例 task；`workflows/build-prd/SKILL.md` 的方法章节仍须改到位（方法覆盖五阶段），build-prd 的**派发实例证据**由后续 pre 路线任务承担，本卡处记「明确不适用理由」；不改写 PRD 的「五阶段」措辞」。载体＝本卡 `decision-log.md` 的 OI-006（`:229`，`status: confirmed`）与 `## 收敛检查` 的验收维度行。
```

### 1.4 落点③：取证只采事实 + 判定来自独立上下文——逐字
```markdown
**3. 取证只采事实、判定必须来自独立上下文（禁止自审自判）**：AC-11…AC-15 的**事实**由执行者按可指认的形态留下（派发/回收记录、主会话动作清单、并行方案声明、G-1 演练记录、五阶段核对表）；**判定**（通过/失败）由**未参与该事实产出**的独立上下文子代理给出。常驻依据＝`AGENTS.md:17` 逐字「质量裁决由独立来源独立上下文产出，禁止自审自判。」；发现与失败的落点＝当前 stage 行的 `finding_dispositions`（五值枚举 `fixed`／`rejected_invalid`／`accepted_risk`／`needs_human`／`user_decided`，见 `runtime/stage/completion-predicates.mjs:124`；字段集见同文件 `:126-129`），**只能记录、不成门**（T-024=A）。
**取证禁止项**：不得把「本卡自己声明通过」当判定；不得把 `workflows/*/SKILL.md` 的文本写成证据以外的结论；不得为取证新增命令、哈希、快照或回执（SD-17）。
```

### 1.5 落点④：不另起独立样例 task——逐字「本卡不做」
```markdown
**4. 不另起独立样例 task**：本卡**不新建**任何 sample／pre-cohort 样例 task 来补 AC-11…AC-15 的场景；AC-11…AC-14 的主证据＝card-03 自身执行事实，AC-15 的 build-prd 一格＝「明确不适用理由」。留给后续：build-prd 的**派发实例证据**由后续 pre 路线任务承担（T-003=A）；并行收益实测留后续（母 `prd.md:310` oracle，本卡不承诺提速比例）。
```

### 1.6 验收事实写在哪里（与本仓约束对齐，不引入新门禁）
事实一律只记事实、判定人一律是独立上下文子代理（`AGENTS.md:17`）：

| AC | 事实（只采事实） | 事实落点 |
| --- | --- | --- |
| AC-11 独立上下文 | 实施/测试/审查子代理的会话标识互不相同；至少一次修复由原实施子代理承接 | `decision-log.md` 收敛检查验收行 + 派发/回收记录 |
| AC-12 主会话无大量读写 | 事后人工判读一次主会话动作清单（T-009=A，**零新增机制**） | 同上；阈值与阶段豁免表见 OI-003（T-020=A） |
| AC-13 并行方案 | 接口蓝图/依赖调度/并发数（≤5 且 ≥2）/五件套齐备 | SD-11 五件套的事实记录形态（T-011=A）→ `docs/standard-workflow.md` 规则正文 + 本卡材料 |
| AC-14 G-1 | 演练记录：停并行、重排、作废批次登记 | `decision-log.md`「八、G-1 演练记录」 |
| AC-15 五阶段 | 四个阶段按工作类型派发的实例 + build-prd 的不适用理由 | `### §9.A` 第二小节 + OI-006 |

机器层事实只落在**当前 stage 行**的 `finding_dispositions`——**不是**新行类型（`runtime/task/task-store.mjs:220` 只认 `stage`／`close_action`，quality fact 被 `:179` 显式拒绝）。以上都不改变任何 step 的 `observable_result`／`completion_evidence`，不阻断推进。

### 1.7 与母 PRD 的对应（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:305-310` 逐字）
AC-11＝`:305`（独立上下文证据 + 修复回原实施子代理）；AC-12＝`:306`（主会话无大量读写）；AC-13＝`:307`（并行方案与五件套，声明不实**按失败事实记录、不构成派发阻断**，OI-012）；AC-14＝`:308`（**演练或实遇**一次接口必须变更）；AC-15＝`:309`（五阶段实例或明确不适用理由）；oracle＝`:310`（「G-1 场景演练记录存在」）。⇒ 本节四条落点一一对位，**没有一条需要新增机制**。

## 2. 第二条：五条丢失落点逐条回填
### 2.1 T-003 `workflows/build-prd/SKILL.md`
- **现状逐字**：`DESIGN-v3.md:1096-1118`（§6.1 表，21 行）**没有该文件的行**；`V4-M4.md:51` 第一层 13 个落点里也没有它 ⇒ 落点丢失。
- **改成**：在 `V4-M4.md:51` 第一层清单末尾追加 `` `workflows/build-prd/SKILL.md` ``；在 §6.1 表里新增一行（建议编号 `#6b`，插在现有 `#6 workflows/build-plan/SKILL.md` 之后）：

```
| 6b | `workflows/build-prd/SKILL.md` | 方法章节同步（五阶段共用的派发方法 + 子代理产出契约的**引用句**）；§2/§3 的节序同步 | **本卡内做**（不在 CARD-04 写面） | card-04 未列；写入时点＝make-decision 阶段结束之后（T-013③：本阶段不实际改任何 `workflows/*/SKILL.md`） |
```

- **授权**：T-003=A（`decision-log.md:45`）+ T-013③（`:55`）+ OI-006（`:229`）+ `decision-log.md:69` 落点句（「T-003 落 OI-001、OI-006 与 `## 收敛检查` 的范围维度」）。

### 2.2 T-006 三条执行卫生规则
- **现状逐字**：`DESIGN-v3.md:53-54` 的条①/条② 只按根因（R6／R1/R7/R10）登记，**没有一条把 T-006 的三条规则逐字对上**；「五阶段 `SKILL.md` 各引用一次」在 §6.1／§6.3 无对应行，`DESIGN-v3.md:86` 的 R1 写面只列了 `workflows/build-code/SKILL.md`、`workflows/build-plan/SKILL.md` 两个文件 ⇒ 落点丢失。
- **改成（a）**：在 `DESIGN-v3.md:55` 之后新增一张映射表：

```
| T-006 的规则 | 落点 | 逐字要点 |
| --- | --- | --- |
| ①长命令后台化、禁止轮询空转 | `AGENTS.md:15` 之后新增的条② | 不轮询空转等待（R1） |
| ②互不依赖的只读动作批量并行 | 同上条② | 并行按区间派发（R10） |
| ③子代理必须增量落盘、只回传摘要、禁止把全文攒在最后一条消息 | 同上条②（引用 `CONTEXT.md:463-464`，不复制正文） | 子代理产出契约（T-007） |
```

- **改成（b）**：在 §6.1 新增一行（与 §2.3 的产出契约行同批，可并成一行）：

```
| 6c | `workflows/{build-prd,build-plan,build-code,verify-code,make-decision}/SKILL.md` | 各加**一句引用**，指向 `AGENTS.md:14-15`（三条执行卫生规则 + 通用委派纪律）与 `CONTEXT.md:463-464`（子代理产出契约）；**不复制正文** | **本卡内做**（build-code/verify-code/make-decision 三个文件按 `V4-M4.md:120` 批 G 错开实施） | card-04 写面实测；`V4-M4.md:53` 逐字「这三个文件之外，没有任何落点因为 CARD-04 而被排除」 |
```

- **授权**：T-006=A（`decision-log.md:48`）+ OI-011 + `decision-log.md:69`（「T-006 落 OI-011」）。被拒 B（五份副本会漂移）已由「只引用不复制」满足。

### 2.3 T-007 通用委派纪律 + 四个阶段技能的产出契约（最需要真落点）
- **现状逐字**：`DESIGN-v3.md:45-55` 的预算表只有条①/条②/条③，**T-007 的通用委派纪律没有条位**；`:45` 逐字标题「`AGENTS.md` 的写入预算：恰好三条（用户裁决 T-019=B，不得扩张）」；`:49` 逐字「因此 v2 对 `AGENTS.md` 的净变更**只有三条**」；「先落盘／只回摘要与 ref／按子问题增量」在设计书全文 0 命中（`V4-COVERAGE.md:57`）⇒ 落点丢失。
- **关键澄清（照抄即可）**：T-019=B 约束的是**「写成可观察形态」的条款数**，不是 `AGENTS.md` 的净行数——`decision-log.md:61` 逐字：「只有三条写成可观察形态（每条给出可指认的事实与呈现位置），**其余条款保持原则性短措辞**。」⇒ `DESIGN-v3.md:49`「v2 对 `AGENTS.md` 的净变更**只有三条**」是**扩大解释**，它顺手删掉了 T-007 的条位。
- **改成（主方案，仍三条）**：把 T-007 的委派纪律并进条②，`DESIGN-v3.md:54` 的「文本要点」列就地改为：

```
| 条② | `AGENTS.md:15` 之后**新增一条** | 不轮询空转等待 + 回传的是结论与清单 + 并行按区间派发 + **派发单位是工作类型（实施/测试/审查/修复）而不是 step 序号，修复回原实施子代理的同一会话**（T-006 三条 + T-007 委派纪律并入同一条，不各立新条） | R1（主）、R6、R7、R10 |
```

- **改成（备选，用户若要求独立成条）**：在 `DESIGN-v3.md:55` 的条③之后新增**条④**，**不带可观察形态**（按 `decision-log.md:61` 的「其余条款保持原则性短措辞」）：

```markdown
- 重活按**工作类型**派子代理（实施、测试、审查、修复），不按 step 序号派；同一份实现只有原实施子代理可继续修改。依据：[docs/standard-workflow.md](docs/standard-workflow.md)；本条是执行纪律，不是新的 stage、gate 或质量结论。
```

- **四个阶段技能侧的落点**：`workflows/{build-prd,build-plan,build-code,verify-code}/SKILL.md` 各加一句引用（术语正文已存在且完整：`CONTEXT.md:455-464` 的 `**子代理产出契约（subagent output contract）**`＝先落盘／只回摘要与 ref／按子问题增量；`V4-M1.md:113` 逐字「术语正文已存在且完整，阶段技能**只引用、不复制**」）。逐字引句（放在各文件「派发／依赖」邻近段落）：

```
Dispatch discipline and the subagent output contract (write artifacts before returning, return summaries and refs only, report per sub-question incrementally) are defined once in the repository `AGENTS.md` and `CONTEXT.md`; this stage applies them instead of restating them.
```

- **「四个阶段」与「五阶段」的差异必须显式登记**（否则与 §2.2 冲突）：T-006 说「五阶段各引用一次」，T-007 说「四个阶段技能补齐产出契约」；本卡路线内跑得到的是四个（make-decision／build-plan／build-code／verify-code），build-prd 不在本路线（T-003=A）⇒ 建议逐字写「**五个阶段技能都写引用（T-006）；其中本卡路线内的四个阶段另需补齐产出契约的引用（T-007），build-prd 的方法章节同步但不在本卡路线内**」。
- **授权**：T-007=A（`decision-log.md:49`）+ OI-011 + `D-constraints.md:75`（载体已定：`CONTEXT.md` 新增节 + `decision-log.md:49`）+ T-019=B（`:61`）。**风险如实登记**：`AGENTS.md` 是常驻上下文文件，故主方案优先（不加行）。

### 2.4 T-014 G-1 两处各写各的角色 + 交叉引用
- **现状逐字**：`DESIGN-v3.md:1103`（#6）的「改什么」列＝`§2/§3 的节序与 phase 字段清单同步（:209-215 等）`；`:1111`（#14）的「改什么」列＝`§4.8 的 **C1**：在 :203-208（## Work loop 第 1 条）末尾**追加一句引用**，指向同文件 :245-250 已有的写入条文`。设计书全文 `写产出`／`收场` 0 命中 ⇒ 落点丢失。
- **改成（`DESIGN-v3.md:1103`）**：「改什么」列追加 `+ §1.E.4 新增 R17：**G-1 产出侧**——接口清单与并行方案怎么产出、何时判定「接口必须变更」、冻结的接口符号清单怎么回写`。
- **改成（`DESIGN-v3.md:1111`，即 #14）**：「改什么」列拆成两件事：

```
§4.8 的 **C1**（`:203-208` `## Work loop` 第 1 条末尾追加一句引用，指向同文件 `:245-250`）+ **C2：G-1 收场**（`## 统一回退协议` 段末新增一段：停并行 / 谁重排 / 作废批次怎么登，并对 `workflows/build-plan/SKILL.md` 写**一句交叉引用**）
```

- **两侧锚点（给文本锚点，不写死行号——CARD-04 会漂移）**：build-plan 侧＝`workflows/build-plan/SKILL.md` 的 `## Plan and phase contract`（`:263`）段末，锚句逐字 `execution facts live in task facts/quality evidence, not the pointer index.`，新增小节标题 `### Interface freeze and the G-1 trigger`；build-code 侧＝`workflows/build-code/SKILL.md` 的 `## 统一回退协议`（`:9`）段末，锚句逐字（`:14`）`错配只让正式完成事实保持 incomplete，保留同 task 修复，禁止整阶段重跑；不新增 stage、public command、store 或 gate。`，新增小节标题 `### G-1 收场：接口必须变更时`。
- **两句交叉引用逐字**：build-plan 侧 `收场动作见 \`workflows/build-code/SKILL.md\` 的「G-1 收场：接口必须变更时」；本节只定义产出与触发判据。`；build-code 侧 `接口清单与并行方案的产出侧见 \`workflows/build-plan/SKILL.md\` 的「Interface freeze and the G-1 trigger」；本节只定义收场动作。`
- **授权**：T-014=A（`decision-log.md:56`）+ OI-005（`:215-227`，含新事实「现仓 `grep "G-1" workflows/ docs/ runtime/` 为**零命中**」）+ `decision-log.md:69`。两处都在 `workflows/*/SKILL.md`，按 T-013③ 本阶段只出冻结候选与锚点。

### 2.5 T-018（本轮收窄裁决，逐字）
**逐字决定（可直接粘进 `decision-log.md` 的 `## 决定` 或「六、写面声明」）：**

```
- **T-018 推迟写面的收窄（本轮裁决）**：`decision-log.md:378` 的「推迟写面」逐字只列 `runtime/evidence/**`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`，该名单**只推迟 T-018 的 H-1——即快照绑定那一套 runtime 语义**（`runtime/evidence/quality-fact.mjs:48` 等候选的删除与改写），**不是**整个 `tools/cli/stage-runtime.mjs` 文件，也不是「本卡此后都不碰这些文件」。本卡写面对 `tools/cli/stage-runtime.mjs` 与 `runtime/**` 的影响＝**零改动**（依据＝`DESIGN-v3.md:1115` 逐字「本设计**不要求改它**（§4 只用既有读写路径）」、`:1116` 逐字「本设计不要求改」）；收窄改变的是**理由**，不是结论——理由从「T-018 推迟」改为「本设计不要求改它」，以免被读成「等 CARD-04 之后本卡还要改这个文件」。
```

- **设计书落点**：`DESIGN-v3.md:1115`（#18）／`:1116`（#19）的「处置」列 + `V4-M4.md:90-95` 的替换块。#18 的理由（`V4-M4.md:91` 逐字）已正确；**#19 的理由要改**——`V4-M4.md:95` 现文「T-018 只冻结候选清单，不写代码」应收窄为 `理由: 本设计不要求改它们的任何一行（DESIGN-v3.md:1116 逐字"本设计不要求改"）；T-018 冻结的对象是**快照绑定语义（H-1）的改动候选清单**，不是 `runtime/**` 全部，本卡一行代码不写。`
- **新增：冻结的 runtime 改动候选清单**（挂在 `DESIGN-v3.md:1116` 行后，逐字取自 `decision-log.md:60`）：

```
> **T-018 冻结的 runtime 改动候选（本卡不写代码）**：`runtime/evidence/quality-fact.mjs:48`；`runtime/evidence/canonical-evidence-validators.mjs:251`／`:322-328`／`:397-399`／`:433`；`runtime/evidence/research-report.mjs:22`；`runtime/evidence/freshness.mjs`（import `ensureGitSnapshotObjectStore`／`materialRevisionFromValues`）。语义＝删掉跨 phase 的全量快照绑定、只留该 phase 自己声明的写集；删除责任方与接口变化待 CARD-04 合并后随 build-plan／build-code 定。
```

### 2.6 回填后的施工表（一次性粘贴）
把 §2.1 的 `#6b`、§2.2 的 `#6c` 插在 `DESIGN-v3.md:1103`（`#6`）之后；`#14`（`:1111`）按 §2.4 拆成 C1/C2；`:1115-1116` 按 §2.5 改理由并挂冻结清单。**#1–#13 的处置列取值与判据列逐字不动**（`V4-M4.md:103`）。

## 3. 第三条：G-1 演练记录的形状（AC-14）
- **在哪个阶段做**：本卡 `make-decision` 阶段内（当前阶段），由主会话（M）发起，**在具备独立上下文的子代理在场下完成**；全程不产生任何代码改动（本卡无实现写面）。演练的三个动作就是 AC-14 的三项度量：① **停并行**——记录被叫停的并行工作包与理由；② **主会话重排**——记录重排后的工作包顺序与接口符号清单的回写；③ **登记作废批次**——逐条记下作废的工作包与其已产出的引用，并声明后续结果无静默不一致。
- **写到哪个文件的哪一行**：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919/specs/workflowhub-thin-core-card-03-20260919/decision-log.md` 的 `## 补充登记` 新增小节「八、G-1 演练记录（T-002=A / AC-14）」（该文件是当前唯一写面，`decision-log.md:377`）。**不新建文件、不新增 `facts.jsonl` 行类型。**
- **记录必须有哪几个字段（逐字示例行）**：

```
八、G-1 演练记录（T-002=A / AC-14）
- 触发（演练输入）：假设 build-code 第 3 步在 P2/T007 发现 `接口 X` 的签名必须变更，与 phase 冻结的接口符号清单冲突。
- ① 停并行：叫停 P2/T007 与其并行包 P2/T008；理由：两者写同一符号，继续会产生静默覆盖。
- ② 主会话重排：接口符号清单回写责任＝接口 owner；重排后顺序＝T007 → T008。
- ③ 作废批次：作废 P2/T008 本轮产出（引用：`<task_dir>/…`）；声明后续结果无静默不一致。
- 取证：以上三步只记事实（谁做、做了什么、引用何物）；判定见下方独立上下文结论行。
```

- **机器侧的对应记录（可选但推荐，同样不成门）**：把演练暴露的真实缺口写成当前 stage 行 `finding_dispositions` 的一条，字段集取自 `runtime/stage/completion-predicates.mjs:126-129`：

```json
{"finding":"G-1 在本仓零命中：实现期「接口必须变更」的收场动作（停并行/重排/作废批次）在 workflows/ docs/ runtime/ 均无正文","disposition":"user_decided","owner":"M（主会话）","deadline":"本阶段内","anchor":"specs/workflowhub-thin-core-card-03-20260919/decision-log.md 的「八、G-1 演练记录」","previous_cause":"G-1 只有方向级定义，无任何可执行步骤","cause":"历史上 G-1 只写在母材料的 FR-15/AC-14，未下沉到阶段技能","retry":"不适用","elapsed_ms":0,"reply_ref":"T-014=A 的裁决与本演练记录"}
```

`disposition` 只能取 `fixed`／`rejected_invalid`／`accepted_risk`／`needs_human`／`user_decided` 五值（`:124`）；本例取 `user_decided`，因为「怎么补」已由 T-014=A 裁决。
- **为什么不构成新门禁**：① 它是**事实行/材料小节**，不是新行类型（`runtime/task/task-store.mjs:220` 只有 `stage`／`close_action`），quality fact 被 `:179` 显式拒绝；② 不改变任何 step 的 `observable_result`／`completion_evidence`，不新增 stage、public command、哈希、快照或回执；③ **不阻断推进**——缺它只限制「完成声明」（SD-17；`workflows/verify-code/SKILL.md:110` 逐字「review 结果只是质量事实，不是继续工作的许可证。缺质量事实只限制完成声明，不限制继续验收和修复。」）；④ 判定人不是事实产出者（`AGENTS.md:17`）。

## 4. 第四条：T-010 三个读取点的核对（逐字）
**4.1 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919/tests/contract/stage-routing-and-concrete-testing.test.mjs:164-169`**

```
164:     expect(buildCodeSteps.find((step) => step.step_slug === "authenticate-current-task-completion").observable_result)
165:       .toMatch(/current task facts is marked completed only when actual changes, tests, AC evidence, and review dispositions support that claim/i);
166:     expect(buildCodeSteps.find((step) => step.step_slug === "authenticate-current-task-completion").completion_evidence)
167:       .not.toContainEqual(expect.objectContaining({ uri_or_path: "tasks.md" }));
168:     expect(read("workflows/build-code/SKILL.md")).toMatch(/For pre\/history,[\s\S]*task card's `执行状态填写区`/i);
169:     expect(read("workflows/build-code/SKILL.md")).toMatch(/For post,[\s\S]*task facts\/quality evidence/i);
```

**判定：不需要改。** 依据 `DESIGN-v3.md:111` 逐字「**处置：新增判据只能追加在原句之后，不得改动或重排现有子串**；按上述草案追加后 `:165` 仍匹配 → 不红」（`toMatch` 是搜索而非锚定）。**给施工者的硬约束**：`workflows/build-code/steps.json:15` 的 `observable_result` 里，`current task facts is marked completed only when actual changes, tests, AC evidence, and review dispositions support that claim` 这一段**逐字不许改、不许重排**，新增判据只能追加其后。

**4.2 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919/tests/e2e/vnext-five-stage-current.test.mjs:495-501`**

```
495:   const stepSlug = {
496:     "make-decision": "approve-decision",
497:     "build-spec": "freeze-spec",
498:     "build-plan": "publish-plan-result",
499:     "build-code": "authenticate-current-task-completion",
500:     "verify-code": "finalize-code-review",
501:   }[stage];
```

**判定：不需要改。** `:502-503` 用 `spawnSync(process.execPath, [runtime, "confirm", "--action=decision", \`--stage=${stage}\`, ...])`，只按 **slug** 定位 `:499`，不读 `observable_result`；T-010 的判据是纯文本加法、不改 slug/order（`DESIGN-v3.md:112` 逐字「**处置：不动 slug，本条改动对它是纯文本加法 → 不红**」）。

**4.3 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919/docs/stage-atomic-step-inventory.md:60-65`**

```
60: | build-code | 6 | run-tests | phase test | execute focused command and oracle |
61: | build-code | 7 | scan-diff | diff scan | repair accidental scope drift |
62: | build-code | 8 | review-change | Phase OCR review | dispatch once for this Phase; record findings or unavailable |
63: | build-code | 9 | analyze-review-findings | disposition | main agent assesses every finding |
64: | build-code | 10 | capture-implementation | evidence | bind evidence to current snapshot |
65: | build-code | 11 | authenticate-current-task-completion | task audit | retain incomplete facts honestly |
```

**判定：`:65` 不需要改。** 描述语是「retain incomplete facts honestly」——**不含 snapshot、也不描述绑定对象**（`DESIGN-v3.md:113` 逐字「**处置：与新判据不冲突，不改**；该文件的既有红事实见 §7-1，不由本条引入、也不由本条修复」）。**一处必须如实写明**：紧邻的 `:64`（`bind evidence to current snapshot`）**含** snapshot 字样，但它描述的是 step 10 `capture-implementation`，与 T-010 要改的 step 11 `authenticate-current-task-completion`（`workflows/build-code/steps.json:15`）**不是同一步** ⇒ 本卡不动 `:64`，也不得把它当成「已有绑定语义」的证据（`DESIGN-v3.md:109` 逐字「`grep -c snapshot workflows/build-code/steps.json` = **0**……本卡是在该处**新增**判据，不是「修正已有绑定」」）。

## 5. 给施工者的粘贴点（汇总）
| # | 文件:行 | 动作 | 授权 |
| --- | --- | --- | --- |
| 1 | `DESIGN-v3.md:1330` 之前 | 插入 `### §9.A 本卡验收的载体与不适用清单（T-002=A）`（§1.2–§1.5 四小节） | T-002=A |
| 2 | `DESIGN-v3.md:696` | 「本设计的处置」列末尾追加一句（§1.2a） | T-002=A + §3.7 |
| 3 | `DESIGN-v3.md:55` 之后 | 新增 T-006 三条规则映射表（§2.2a） | T-006=A |
| 4 | `DESIGN-v3.md:1103` 之后 | 新增 `#6b`（build-prd）、`#6c`（五阶段引用句）两行 | T-003=A、T-006=A、T-007=A |
| 5 | `DESIGN-v3.md:54` | 条②「文本要点」列并入委派纪律（§2.3 主方案） | T-007=A |
| 6 | `DESIGN-v3.md:1103`（#6）／`:1111`（#14） | 追加 R17 产出侧；#14 拆 C1／C2 | T-014=A |
| 7 | `DESIGN-v3.md:1115-1116` | 改理由（收窄）+ 挂 T-018 冻结候选清单 | T-018=B + 本轮收窄 |
| 8 | `decision-log.md`「八、」 | 新增 G-1 演练记录小节（§3 逐字） | T-002=A、T-014=A |
| 9 | `V4-M4.md:51`／`:95`／`:116` | 第一层清单补 build-prd；#19 理由收窄；批 C 保持 | T-003=A、T-018 |

## 残留不确定
1. **`### §9.A` 的编号**：只核到 `DESIGN-v3.md` 的顶层与 §1/§1.E 的小节风格（`### §1.0`、`### §1.E.0`），**未逐行读 §9（`:1271-1329`）**，编号可能与既有小节冲突；插入位置（`:1330` 之前）可核实，编号请施工者按实际调整。
2. **「四个阶段技能」的确切集合**：`decision-log.md:49` 只写「四个阶段技能」，未列文件名。本文件按本卡路线给集合（make-decision／build-plan／build-code／verify-code）；若用户原意为另外四个，§2.3 的引句逐字不变，只换文件清单。
3. **T-019=B「恰好三条」的解释**：本文件判定它约束「可观察形态的条款数」而非 `AGENTS.md` 净行数（依据 `decision-log.md:61` 逐字「其余条款保持原则性短措辞」）。若用户原意确为「净行数只有三条」，则 §2.3 只能用主方案，备选的条④作废——**这是一处需要用户一句话确认的分叉**。
4. **T-013③ 与 `V4-M4.md` 的处置列**：本文件按「T-013③＝写入时点、`V4-M4.md:32-34` 三值＝落点归属」调和；若用户认为本卡在 make-decision 之后**不再**写 `workflows/*/SKILL.md`（即整卡不写），则 §2.1–§2.4 的落点全部要降级为「留给 CARD-04 合并后的 build-plan／build-code」，与 T-017=A 的载体说明对齐。
5. **`finding_dispositions` 示例行未经运行时验证**：`runtime/stage/completion-predicates.mjs:126-129` 给了字段集，但本次只读、未跑任何校验，`retry`／`elapsed_ms` 是否必填、可否取 0 未实测。
6. **AC-13 事实落点偏弱**：`docs/standard-workflow.md` 的行号只从设计书转引（当时记 `:289-290`，本次未直接读该文件；该转引行号已于 **2026-09-29** 复核更正为 `:334-338`）；且 `DESIGN-v3.md:1106` 以 `:81-93` 作写入范围时与禁区 `:88-92` 在**行区间意义上重叠**，施工时须逐行核对。

## §13 装配记录（v4 装配自陈）

- 基底＝`/tmp/wh-card03-design/DESIGN-v3.md`（1368 行）；本文件行数见交付回执，不在本节硬编码。
- 已应用：①文件头（配方逐字给定）；②§6 整节替换为 V4-A `## §6.0`–`## §6.6`；③新增 §6.7；④§9.A 插入（V4-D「第一条」）；⑤§3.7 G-1 行就地追加指路句（V4-D「第一条 ①」）；⑥§11＝V4-C 全文、§12＝V4-D 全文（各自只去掉文件级标题行）。
- **装配时未应用（配方与源文件不一致，未自拟）**：**§1 三处逐字修补（V4-A）在装配当时未执行**。三条阻断证据见下方 §13.1，与 `/tmp/wh-card03-design/V4-A.md:320-366` 逐条对应。**装配后由主会话复核并补齐，最终处置见 §13.2。**
- **文件头声明与现状的落差（如实登记，已由 §13.2 消解）**：文件头「装配变更」句含「§1 三处逐字修补（V4-A）」。该句在装配当时尚未兑现；§13.2 记录了主会话随后补齐的 6 处替换，落差已消解。
- 编号登记（配方第 5 步要求）：`### §9.A` 与 §9 既有小节（`### §9.1`／`### §9.2`）的编号风格不一致，按配方「照 V4-D 的编号原样插入」保留原编号，未重编。
- 装配格式决定（逐字内容一字未改）：§9.A 的四条逐字块之间以 1 个空行分隔；§1.6 内容以其正文（引言句 + AC 表 + 收尾段）并入，**未**带 V4-D 的 `### 1.6 …` 标题行；§11/§12 仅去掉源文件的文件级标题行并规范首空行。
- 残留不确定（装配侧）：§9.A 是否还应并入 V4-D `§1.7 与母 PRD 的对应`。配方枚举写作「四小节 + 与 AC-11…AC-15 的对应 + §1.6 的「AC → 只采的事实 → 事实落在哪」表」，本文件按「该对应关系＝§1.6 的表」理解，**未**并入 §1.7。

### §13.1 装配阻断：V4-A §1 三处逐字修补的实测对照

| 修补 | V4-A 给的「现状逐字」 | `DESIGN-v3.md` 内 `grep -F` 命中数 | V4-A 给的行号 | 该行号实际内容（实测） | 判定 |
| --- | --- | --- | --- | --- | --- |
| (1) R15 | `` `skills/architect-code-review/SKILL.md`。把当前 diff、完整 AC、OCR packet `` | **0** | `:176` | `- **自证生效**：下一次会话里 fork_turns 取值分布与子代理输入字节数。` | 目标文本在 v3 全文不存在 ⇒ 无法精确替换 |
| (2) R2 中文并集 | `（phase 文件 Write set 列出的路径，加上本次实际改动的文件与受影响的检查清单）` | **0**（带反引号的近邻变体＝**1**） | `:95-96` | 同处，但作 `` （phase 文件 `Write set` 列出的路径…） `` | 「现状逐字」缺反引号；且 V4-A 的「改成逐字」给的是 `decision-log.md:290`/`:293` 判据原文，不是替换文本 |
| (2) R2 英文并集 | `(its Write set paths plus this round’s actual changed files and affected checks)` | **1** | `:105` | 命中（同字串） | 可定位，但删除后需改写句内标点 ⇒ 属自拟 |
| (2) R2 受益句 | `该 phase 声明的写集 + 影响集` | **1** | `:114` | 命中（同字串） | V4-A 只写「一并按上式改写」，未给逐字替换文本 |
| (3) R3/R4/R8/R11/R13 | `` `docs/standard-workflow.md:92` 后新增行（R3/R4/R8/R11） ``、`` 写面含 `:81-93` ``、`` `:97` 后（R13） `` | **0 / 0 / 0** | 未给单一行号（散在 `:116`/`:121`/`:137`/`:195`/`:245`/`:276`/`:310-320`/`:1106`） | — | 「现状逐字」是对多条落点的**描述**、非可定位字符串，且未给替换区间 ⇒ 无法精确替换 |

以上五条按配方「遇到配方与源文件不一致时不要自拟，停下来报告冲突点」处理：**§1 一字未动**，等配方修正后重跑。

### §13.2 装配后由主会话补做的 §1 修补（§13.1 三款的最终处置）

| §13.1 的条目 | 最终处置 | 依据 |
| --- | --- | --- |
| (1) R15 的路径形定位符 | **无需在 §1 改**：该串是 `workflows/build-code/SKILL.md:176` 的现状引文，落在 v3 的 **§6.1 表**内，已随 §6 整节替换生效 | V4-A §6.1 逐字改动明细 |
| (2) R2 并集判据 | **已由主会话补齐**：6 处精确字符串替换，逐条断言命中数恰 1，全部通过 | `decision-log.md:52`(T-010=A) 与 `:293` acceptance 逐字 |
| (3) R3/R4/R8/R11/R13 的 `:81-93` 收窄 | **无需在 §1 改**：同样落在 v3 的 §6.1 表内，已随 §6 整节替换生效 | V4-A §6.5 |

(2) 的 6 处替换（行号为替换后实测）：

| # | 位置 | 改前 | 改后 |
| --- | --- | --- | --- |
| 1 | §1 R2 的 `docs/standard-workflow.md:334-338` 逐字草案括号 | 「加上本次实际改动的文件与受影响的检查清单」 | 「即 phase 文件 `Write set` 列出的路径本身；不并入本次实际改动的文件，也不并入受影响的检查清单」 |
| 2 | 同段「同一材料版本内的两次结果」 | 「或影响集里出现新的文件/检查时才需要重做」 | 「只有当该 phase 声明的写集变化时才需要重做」 |
| 3 | 同段 `workflows/build-code/steps.json:15` 的英文追加草案 | `(its Write set paths plus this round's actual changed files and affected checks)` | `(its declared Write set paths only — not this round's actual changed files, and not an affected-check list)` |
| 4 | 同段「受益与量级」 | 「收窄到『该 phase 声明的写集 + 影响集』」 | 「收窄到『该 phase 声明的写集』」 |
| 5 | §0 口径表第 ② 行 | 「重跑判据从字节快照改影响集」 | 「重跑判据从字节快照改成『该 phase 声明的写集』」 |
| 6 | §10 折入溯源表 F1.2 行 | 「并把它展开成『该 phase 的 `Write set` 路径 + 本次实际改动的文件 + 受影响的检查』」 | 「**不得**展开成『+ 本次实际改动的文件 + 受影响的检查』——那是影响集口径」 |

写入后 `wc -l` = 2099（行数不变，均为行内改写）、`wc -c` = 348,590。

**裁定**：V4-A 的 §1 三处修补中只有 (2) 是真缺口且已补齐；(1)(3) 是 V4-A 把「§6.1 表内的行」误报成「§1 的段落」，随 §6 替换自动生效。§1 其余内容一字未改。

---

## §14 目标重述后的增量设计（I-1 … I-15；2026-09-28 用户裁决：12 条全认 + A5 三条）

> **本节是一次增量，不改写 §1–§13 的任何已裁决结论。** 凡本节与既有条文有冲突或交叉处，一律在 §14.6 显式列出并给出处置，**不静默覆盖**。本节的行号一律给**文本锚点**（本卡 §6.1.1「行号引用改写要求」的同一纪律），因为本节落地后多个文件的行数会变。

### §14.0 口径与授权

**用户 2026-09-28 逐字裁决两件**：
1. 「**上面 12 条我都认都要改；加上A5的新增条目**」
2. 「**skills/spec-plan/** 的 sha 链决定不变**」

**12 条的原文出处**＝主会话提案「五、我建议改的三处」：落点一 1–5（Phase 文件本身）、落点二 6–11（build-code 编排）、落点三 12（卡住必须升级到人）。
**A5 三条的原文出处**＝`/tmp/wh-card03-s926/A5-doc-crosscheck.md` 的「只允许改三件事」。

**本节全部条文必须同时满足三条硬约束**（任一违反即不合格）：
- **SD-17 / OI-012**（母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:93-95` 逐字）：新系统只有**两道人为门**（推进中的人为确认对话、不可逆 Git 授权）；**一切机器/流程门禁删除**；迁移表冻结、并行声明、接口蓝图冻结等**规则类要求一律为「事实记录+验收核对」**——没做或做假＝验收失败事实，如实记录，**不阻断推进**。
- **OI-013 + FR-29**（`prd.md:178` / `:244`）：校验机器不构成推进前置；**记录层不用内容寻址哈希**（普通文件名：日期+序号+描述，append-only；纯文本路径引用）。
- **§0 的「本设计一律不做的事」清单**：不新增门禁/阻断/校验前置；不引入内容寻址哈希、receipt、快照 lineage；不新增第二套进度权威、projection、账本；不新增 public runtime 命令、action 或 `facts.jsonl` 键；不新建第二份 phase 模板；不把执行状态写进 `phases/P<n>.md` 或 `phases/index.md`。

**本节数字的两个来源，别的来源一律不引**：
- **来源甲（实测·本卡亲手跑）**＝CARD-04 真实材料（**2026-09-29 复核更正**：原引工作树 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919` 目录整体已删除；材料现归档于本 worktree 的 `specs/archive/workflowhub-thin-core-card-04-20260919/`，原写的材料目录 `<W>/specs/workflowhub-thin-core-card-04-20260919/` 已不存在）与 CARD-04 会话的转录派生件。
- **来源乙**＝`/tmp/wh-card03-s926/` 下四份取证报告：`A2-plan-gaps.md`（61 条缺口实例与处置分布）、`A3b-volume.md`（体量与审查逐次清单）、`A5-doc-crosscheck.md`（112 条断言核对）、`A5-doc-crosscheck.md` §10 的问题域清单。

---

### §14.1 一条前提更正（必读；它改了第 2 条的写法）

**第 2 条原文**：「补齐三个缺失字段：`Observable seam`（必须填仓库里**真实存在**的路径或符号）、`Risk and rollback`、`test change request`。」

**实测更正：这三个字段在模板里已经存在，不需要「补」。** 本卡 worktree 逐行核对 `skills/spec-plan/templates/phase-template.md`（**56 行**；**2026-09-29 复核更正**：该模板经 `5202828a` 中文化重写后现为 **217 行**，复核见下方「锚点复核更正」）：

| 字段 | 模板位置 | 逐字（节选） |
| --- | --- | --- |
| `Observable seam` | `skills/spec-plan/templates/phase-template.md:38` | `- **Observable seam**: [the existing producer, persisted/current artifact, real reader/consumer, source denominator, and missing/invalid semantics for the AC; if absent, design and freeze this interface first and keep the AC incomplete rather than testing text]` |
| `Risk and rollback` | `skills/spec-plan/templates/phase-template.md:24` | `- **Risk and rollback**: [trigger, impact, mitigation, reversible action]` |
| `test change request` | `skills/spec-plan/templates/phase-template.md:47` | `- **test change request**: [if the frozen test must change: explicit reason, old/new assertion, previous RED evidence, independent review ref; otherwise \`none\`]` |

**2026-09-29 锚点复核更正**：上表三行取自 `5202828a^` 的**56 行英文版**模板；本卡 `5202828a` 已把该模板中文化重写为**217 行**，三个字段仍在但行号与字面均已变——`Observable seam` 现为 `- **可观察接缝**:`（`:175`）、`Risk and rollback` 现为 `### 风险与回滚` 段（`:100`，逐字 `- **风险**:` `:102`、`- **回滚**:` `:105`）、`test change request` 现为 `- **测试变更请求**:`（`:184`）。结论不变：三个字段**在模板里已经存在**，不需要「补」。

**缺的不是字段，是「被填」，而且没有任何地方拦得住。** CARD-04 十三份真实 `phases/P<n>.md`（来源甲，主会话亲手扫描）的字段覆盖矩阵：

| 字段 | 覆盖 | 备注 |
| --- | --- | --- |
| `Global spec` / `Write set` / `Dependency` / `FR ·AC` / `STOP` / `Done` | **13/13** | 都填了 |
| `Consumer` | **12/13** | **唯一缺的是 `phases/P11.md`** |
| `NEW` / `MODIFY` | 9/13、8/13 | 部分缺 |
| `Observable seam` / `Prewritten test` / `RED evidence` / `test change request` | **1/13** | **只有 `phases/P8.md` 有** |
| `Risk and rollback` | **0/13** | 完全不存在 |
| `Task order`（Phase 级跨 Task 顺序） | **0/13** | 完全不存在 |
| `Test strategy`（Phase 级） | **0/13** | 完全不存在 |
| `Inputs and outputs`（Phase 级） | **0/13** | 完全不存在 |
| `coverage limit`（Phase 级小写） | **0/13** | 完全不存在 |

**两条对得上的因果（这是本节 I-2 存在的全部理由）**：

1. **唯一漏掉 `Consumer` 的 Phase 就是 P11，而 P11 的头号缺口正是「真实消费者/入口不存在」（6 条，从 2026-09-26 12:55 到 09-27 20:13，跨 31 小时未闭合）**（来源乙 `A2-plan-gaps.md`）。
2. 把缺口类型往空白字段上一对（来源乙 `A2-plan-gaps.md` 的类型频次 × 来源甲的覆盖矩阵）：

| 空白字段（真实材料里的覆盖） | 它本该拦住的缺口类型 | 实际条数 |
| --- | --- | --- |
| `Observable seam`（1/13） | A 真实来源／生产者未认证 | 10 |
| `Consumer`（12/13） | B 真实消费者／入口不存在 | 8 |
| `Prewritten test` + `RED evidence`（1/13） | D 预写测试不是有效 RED | 4 |
| `Risk and rollback`（0/13） | G 失败边界／回滚未定义 | 11 |

**这四项对应 33 条缺口，占 `A2-plan-gaps.md` 全部 61 条的 54%。**

⇒ **第 2 条改写为 I-2：不新增字段，改为「让哪些字段是空的、哪些格子里写的是泛指的套话」一眼可见。** （模板 38 个字段一个都不改名——改名会打断 `tests/contract/post-cohort-executable-authoring.test.mjs:29-33` 的 12 条 `toContain` 与 `tests/contract/post-cohort-authoring-files.test.mjs:17-19` 的大小写敏感断言。）

---

### §14.2 落点一：让 build-plan 交出的计划「可执行」（I-1 … I-5）

**共同落点**：`skills/spec-plan/templates/phase-template.md` 的**尾注段**（文本锚点＝`Do not collapse multiple Tasks into one line,` 所在的 `:50-52` 三行；追加在这三行**之后**、`## L2 — Removable reference` 之前），外加 `skills/spec-plan/SKILL.md` 的一个末句。

**为什么选尾注段**（三条理由，缺一不可）：
- 尾注段本身就是该模板的**禁令区**（`:52` 已逐字写着 `Do not collapse multiple Tasks into one line, borrow another Phase's task body, or put execution status in this authored file.`）——同一族话语放在同一处，不制造第二个权威。
- §3.3 已实测两处**不得触碰**的行：`:4` 的 `[write set: ...]` 与 `:5` 的 `[dependency: ...]` 括号说明（`tests/contract/post-cohort-authoring-files.test.mjs:17-19` 对 `write set`/`dependency` 的断言是**大小写敏感**的，而小写形态只出现在这两处）。尾注段远离它们。
- 尾注段在 `tests/contract/post-cohort-executable-authoring.test.mjs:27` 的 taskCard 切片内（切片＝`### Tnnn — ` 到 `## L2`），因此新增字句**会被契约测试看见**——这正是本设计要的：契约看得见，才不会再次漂移。已知的负断言只有 `:36` 的 `expect(template).not.toContain("one-line results")`，下面的逐字草案**不含该串**。

#### I-1（第 1 条）Phase 文件只写意图，禁写执行状态与修订流水账

**现状证据（来源甲，逐字）**：`phases/P6.md` 有 `## 2026-09-27 同任务修订：T013/T014 遗留缺陷的精确接手`、`#### 2026-09-27 T012 冻结 E2E 合同修订（仅 P5 报告场景）`、`#### 2026-09-27 T012 的 AC-26 机器判断写入修复`；`phases/P10.md` 有 `### 本轮获准的 P10 TEST-TARGET-ONLY 冻结修订（非产品实施）`、`### 独立复核后的仅测试修复（review2；非产品实施）`、`### review3：同形输入修复及无法由此接口证实的可信来源`、`### 2026-09-28 T021 现有受信回执与本次官方 \`run\` 消费的来源绑定`；**`phases/P10.md:1` 的标题直接写着「（合同测试通过，业务验收未完成）」——执行状态进了标题**。

#### I-2（第 2 条，已按 §14.1 更正）字段齐备性

#### I-3（第 3 条）Phase 标题＝一个可独立验收、可独立提交的功能结果

**现状证据（来源甲，逐字标题）**：`phases/P6.md:1`＝「上游覆盖账本、分母修复与有界真实 CLI E2E 落点」（三件事）；`phases/P10.md:1`＝「B2 定向执行与逐例事实对账」（两件事）。

#### I-4（第 4 条）写面纪律

**现状证据（来源甲，逐字）**：`phases/P6.md:5` 的 `Write set` 逐字含 `specs/workflowhub-thin-core-card-04-20260919/decision-log.md` 与 `specs/workflowhub-thin-core-card-04-20260919/spec.md`。⇒ **任一 Phase 改这两份文件，别的 Phase 绑上去的证据全部作废**。这是「材料一直变、旧回执一直过期」的机制本体——**不是谁不小心，是写面规则允许的**。

#### I-5（第 5 条）规模对账

**现状证据（来源乙 `A2-plan-gaps.md`，逐字）**：`p10_scope_resolution`（ord 45090）「**218 个改动，9 个对应现有检查，209 个未对应**」＝ **96% 无验收归属**。

#### I-1 … I-5 的逐字草案（**一次性追加到尾注段的 6 行**）

```markdown
Every field in this template appears in every Phase file: write `N/A — reason` instead of deleting a field, renaming it, or merging two fields into one entry.
A Phase file states intent only: no dated revision section, no review round, no status word in the title or in `L0`; execution status lives in task facts.
The title names one independently acceptable and independently committable functional result; `A and B and C` means this is three Phases.
A `Write set` never lists this task's own `spec.md`, `decision-log.md` or `phases/P<n>.md`; when the Phase really delivers material, name which Phases' evidence it invalidates.
State the expected change size (files, symbols) and the oracle covering each part; write `unknown` where no oracle covers it.
A blank or generic cell is a missing check, not a smaller scope: name the real producer, the real reader and the source denominator, or write `unknown` plus the owner who resolves it.
```

**同批追加到 `skills/spec-plan/SKILL.md` 的一个末句**（文本锚点＝该文件里 `Write one independent \`phases/P<n>.md\` file per Phase using` 所在段的段末；§6.1.1 第 2 行已在该点追加 `Acceptance inline` 格式句，本句追加在它**之后**）：

```markdown
Before handoff, confirm that every template field is present and that each real path or symbol named in `Consumer` and `Observable seam` exists in this repository; record what you could not confirm as `unknown`, not as a smaller scope.
```

**为什么这样写就够**（不加门禁的论证）：
- 它**不新增字段、不新增命令、不新增校验**——`Consumer`(`:6`) 与 `Observable seam`(`:38`) 都是模板既有字段，本句只规定「里面写的东西必须真的存在」。
- 它**不构成推进前置**：没有 `Consumer` 或缺字段**不阻断任何派发**，只是在计划材料上留下一个两秒可辨的事实（SD-17 的「事实记录+验收核对」形态）。
- 「`test -e` / `grep -n` 核一遍」是**动作描写**，不是机器门：核的人可以否决自己写的字段，机器不读它。

**受益与量级（全部来源甲/乙的实测，不是推断）**：
- 靶子＝`A2-plan-gaps.md` 的 **61 条缺口**中，与这五项字段同轴的 **33 条（54%）**。
- 靶子＝`A3b-volume.md` 实测的非正式复核规模：**`phases/P5` 15 份、`A5` 口径下 `P10` 26 份**（来源乙 `A3b-volume.md` §4 精确命中口径），它们的主要来源就是计划期没写清的真实入口/消费者/验收来源。

**自证生效（可观察事实，非校验）**：下一轮真实计划的十三份 `phases/P<n>.md` 里，逐字段覆盖矩阵可以直接用同一条 python 扫描重算（本节的矩阵就是这么来的）；空字段数与 `A2-plan-gaps.md` 同轴缺口数应同向下降。

**写面**：`skills/spec-plan/templates/phase-template.md` **本卡内做**（§6.1.1 第 1 行）；`skills/spec-plan/SKILL.md` **本卡内做**（§6.1.1 第 2 行）。**sha 链后果见 §14.6 冲突 2**。

**模板行数**：§3 已把 56 → 64（4 个新字段 + V3-P1 的 3 行层级约定）；本节再 +6 行（尾注段 3 → 9 行）⇒ **模板最终 70 行**。§3.2 末的「模板最终 64 行」一句**由本节取代**，其余一字不动。

---

### §14.3 落点二：build-code 的全流程编排（I-6 … I-11）

**共同落点**：`workflows/build-code/SKILL.md` 的方法章节、`workflows/build-code/steps.json`、`docs/standard-workflow.md`。**注意写面**：`workflows/build-code/SKILL.md` 在 CARD-04 写面内（§6.1.1 第 17–20 行，均标「错开实施」），因此本节的 SKILL 条文**一律标「错开实施」**；`workflows/build-code/steps.json` 与 `docs/standard-workflow.md` **本卡内做**。

#### I-6（第 6 条）一次只推进一个 Phase

**实测靶子（来源甲，两条独立口径）**：
- 转录派生件 `data/timeline.json` 的 `segs` 给出**同时活跃的 Phase 组**：`["P10","P11","P6","P8"]`、`["P3","P4","P6","P7"]`、`["P11","P3","P4","P9"]`；两两重叠最大 `P13|P8` = **21,766 s**。
- `A5-doc-crosscheck.md` §10 的逐字事实：**turn@37989 同一回合出现 11 个相位目标**；**turn@7328 同一回合写 P10/P11/P5/P6**；8 个回合中 5 个 ≥2 个相位。
- ⇒ 复盘 §6.3 的「一次只推进一个 Phase」**在执行中未被遵守**，而现有材料里**没有任何一句话要求它**。

**逐字草案（追加到 `workflows/build-code/SKILL.md` 的方法章节；错开实施）**：

```markdown
Work one Phase at a time. While a Phase is in progress, do not start, edit or re-review another
Phase's material or code: finish the current Phase or stop and hand the gap back (see the gap
hand-back rule below). Starting a second Phase is allowed only after the current one is either
done or explicitly stopped and recorded as not done; record which Phase was stopped and why.
```

**逐字草案（追加到 `workflows/build-code/steps.json:5` 的 `observable_result` 末句之后；与 §5.1 同批实施）**：

```
 Selects and works at most one Phase at a time; starting another Phase before the current one is done or explicitly stopped is recorded as a fact.
```

**不构成门禁**：本条**不阻断任何派发**——同时推进两个 Phase 仍然允许，只是「记录为事实」。这与 SD-17 的降级口径一致，也是本条能被 OI-012 接受的原因。

#### I-7（第 7 条）缺口集中退回，一次、尽早——**本节最重要的一条**

**实测靶子（来源乙 `A2-plan-gaps.md`）**：61 条缺口的**处置分布**——②现场设计并自己拍板 **33（54%）**；④派子代理复核 21（34%）；③补写材料 11（18%，且补的全是 `quality/evidence/**` 新 Markdown，**不是** `specs/**` 阶段材料）；⑤问用户 5（8%）；**①停下退回计划负责人 1（1.6%）**；⑥无视继续做 2（3%）。归并计数 >61，多数缺口同时用两种处置。

⇒ **「停下退回计划负责人」这条路基本不存在**；唯一那条（ord 3648「该测试属于 build-plan 预写边界，本次 P2 实现不能擅改」）实际是**放弃这一项**，而不是退回。

**并且退回的通道本身是缺的**（来源乙，`A2` 报告里 ord 7420 逐字）：「核到一处流程缺口：当前计划里的『先不做』要由负责计划的步骤改掉，但**项目没有可用的正式『修改计划』命令**。」

**逐字草案（追加到 `workflows/build-code/SKILL.md` 的方法章节；错开实施）**：

```markdown
When a Task cannot be executed because the plan material is wrong or incomplete, stop that Task and
list every gap of the same kind for the current Phase in one message back to the plan owner; do not
design the missing interface, fixture, producer or acceptance oracle yourself while implementation
continues. The boundary is narrow and checkable: a normal bug in code you already own stays in this
task; a missing real producer, real consumer, acceptance oracle, protected write permission, or a
frozen test that contradicts the requirement is a plan gap and goes back. One hand-back per Phase,
sent as early as the first gap is provable. A Phase stopped this way is recorded as not done; it is
not partially done.
```

**为什么这条能把 54% / 1.6% 扳回来**：它把「现场设计」从**默认动作**改成**需要越过的边界**，并且把边界写成可判定的清单（真实生产者／真实消费者／验收 oracle／受保护写面／与需求矛盾的冻结测试）。这五类正好覆盖 `A2-plan-gaps.md` 类型频次里的 A(10)+B(8)+C(10)+E(7)+D(4) = **39 条**。

**不构成门禁**：退回**不阻断**任何东西——本卡不新增「修改计划」命令（那会违反 §0 与 OI-013），退回的载体就是**既有的材料修订事实**；计划 owner 改完材料后按既有的重入路径继续。

#### I-8（第 8 条）一 Phase 一次正式审查

**实测靶子（来源乙 `A3b-volume.md` §3，原件级核实）**：正式 Phase 审查**恰 10 次**，覆盖 **7 个 Phase**（P1/P2/P3/P4/P7/P8/P9），其中 **8 次有效（semantic）、2 次不可用**（P1 `e7623be1`、P7 首轮 `3cf5854b`）。
**⇒ 复盘的「P3 与 P4 各两次」不完整——`P7` 也有两次**（`3cf5854b` 不可用 + `9fa24202` 有效）；**从未做过正式 Phase 审查的是 `P5`、`P6`、`P10`、`P11`、`P12`、`P13` 共 6 个 Phase**。

**落点＝加强 §5.2，不新增条文**。§5.2 已把「复用已有 `phase_review` 结果」写进 `workflows/build-code/steps.json:12`（本卡内做），并在 §5.2 里如实说明「route 层已有 canonical dedup identity」。本节在此之上补**两条边界**：

1. **签名的轴要对齐**（§5.2 已如实指出草案的键比合同粗）：合同 `skills/wh-review/contracts/build-code.md:8-9` 的绑定轴是 **task + Phase + 材料 + 代码快照**；`runtime/review/review-record-route.mjs:349` 的既有三元组是 `const SHARED_REVIEW_TUPLE_FIELDS = ["subject_kind", "phase_id", "review_scope"];`。⇒ 复用键**以既有三元组为准**，不另造第二个键。
2. **「不可用」也算一次**：P1、P7 首轮两次 `unavailable` 之后都发生了重派。逐字补充句（同批追加到 `workflows/build-code/steps.json:12` 的同一处，与 §5.2 的句子相邻）：

```
 An unavailable phase_review counts as that Phase's attempt: re-dispatch only when the Phase's changed files actually changed, and record why the previous attempt could not produce a semantic result.
```

**这条的真实价值不等于省掉 2 次审查**：它挡的是「同一范围已成功审查过，又重新派一次」这一类；按 `A3b-volume.md` 的清单，可省的上界是 **10 次尝试中的 3 次**（P3#2、P4#2、P7#2 的重复轮次）——**本卡只声称「把已有边界写进 step 文字」，不声称收益**（与 §5.2 末尾同样的保留）。

#### I-9（第 9 条）只跑受影响测试；证据只留原件与指针

**实测靶子（来源乙 `A3b-volume.md` §1–§2、§6）**：
- 外置任务目录 `T` = `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919`：**7,469 文件 / 163,362,314 B（du 173M）/ 1,220 目录**；`quality/` 占 98.7%。
- build-code 证据根：**工作树侧 2,777 文件 / 28M**；**`T` 侧同名 6,448 文件 / 166M**。
- **膨胀主因＝`T` 侧的 P11 三份近乎相同的整工作树快照**：`P11/T022-single-browser-red-20260927` 1,866 文件 / 48,790,338 B、`P11/T022-actual-producer-red-v2-final-20260927` 1,856 / 47,414,780、`P11/T022-actual-producer-red-v2-20260927` 1,854 / 47,409,306 ⇒ 合计 **5,576 文件 / 143,614,424 B = `T` 侧 build-code 证据的 90.2%**。
- **同名同大小重复：3,849 文件 / 97,258,563 B = 61.1% 是浪费**。实例：`specs/archive/workflowhub-mechanism-simplification-t3-20260912/plan.md` 存了 **3 份**，每份 3,452,507 B，sha256 前 16 位全为 `cbc8c3a6a587776c`（**逐字节相同**）；`remedial-review-input.json` ×3 × 566,134 B；`AC-16`…`AC-34` 指纹 JSON **19 对＝38 文件**。
- **剔掉三份整树快照后，全库只剩 1,893 文件 / 19,747,890 B（12.1%）**；其中原始证据 : 说明性 `.md` = **1,789 : 104（17.2 : 1）**、体积 **16,543,459 : 3,204,431（5.2 : 1）**。⇒ **说明性产物不是膨胀主因，「把整棵工作树当证据反复拷贝」才是**；那 97.3 MB 的重复浪费是「真实任务证据」总量 19.7 MB 的 **4.9 倍**。

**逐字草案（追加到 `docs/standard-workflow.md` 的 `### review、测试和成本` 段末；本卡内做）**：

```markdown
证据只留原件与指针：一次原始测试输出、一次正式回执、一份 review 原件各留一份，其余位置只写指向它的纯文本路径。
不得把整棵工作树、整个目录或整个 `specs/` 树复制成证据；需要说明"当时是什么样"时，只留被改的那几个文件的原件，或写清可以复原它的命令与提交号。
```

**同批追加到 `workflows/build-code/SKILL.md` 的测试段（错开实施）**：

```markdown
After a finding, run only the tests the change can affect; a full-suite run belongs to the stage-end
aggregate, not to each repair round.
```

**为什么这是「便宜且可测」的一条**：判据是**数出来的**（同一路径的文件数、同名同大小的重复文件数与字节数），不需要新机制、不需要哈希——它正是 SD-17「记录层不用内容寻址哈希」在存储面的自然结果。

#### I-10（第 10 条）读取范围：主会话读索引，实施者只读自己那份

**本条已被 §5.1 覆盖**，不需要新条文。§5.1 已把 `workflows/build-code/steps.json:5` 的 `every referenced physical phases/P<n>.md` 改成「游标指定的当前 `phases/P<n>.md`（游标缺失或过期时才读全部）」，且明确「不构成门禁」。

**本节只补一句落在 SKILL 侧的边界**（追加到 `workflows/build-code/SKILL.md` 的读取段；错开实施）：

```markdown
The main session reads `phases/index.md` and the current Phase file; a dispatched implementer reads
only the Phase file it owns. Reading every Phase file is reserved for the case where the progress
cursor is absent or stale.
```

#### I-11（第 11 条）按 Phase 记真实成本（不新建账本）

**实测靶子（来源甲，本卡 worktree 逐行核对）**：`runtime/stage/stage-handlers.mjs#completionReview`（原记 `:280-281`，现 `:294-295`） 现在是

```js
    duration_ms: null,
    tokens: null,
```

⇒ **成本信号是空的**：任何「按 Phase 展示真实用时」的条款现在**没有数据源**。

**落点与形态（三层，全部是本卡内可做或已存在）**：
1. **填已有的两个字段**（`:280-281`）——不新增键、不新增命令。**这一条要显式说明它不是「新账本」**：`duration_ms` 与 `tokens` 是**已经存在的字段**，本节做的是把 `null` 填上。
2. **`docs/standard-workflow.md` 的 `### review、测试和成本` 段**已逐字写着「时间和 token 只作诊断，按 step、skill、读取、交互、provider wait、测试、review、返工和用户等待拆分；不可得就写 `unavailable`，**不设统一预算 gate**」。本节在该句的维度清单里**加一个「按 Phase」的切分维度**，不改「只作诊断、不设 gate」的性质。
3. **与 U-001 第 6 点「不要浪费任何机制统计 token、时间等」的关系（必须写明）**：本条**不新增任何统计机制**——它复用 `docs/standard-workflow.md` 已有的诊断段与 `runtime/stage/stage-handlers.mjs` 已有的两个字段。**凡需要新增机制才能得到的数字，本卡一律不记。**

**逐字草案（追加到 `docs/standard-workflow.md` 的 `### review、测试和成本` 段；本卡内做）**：

```markdown
同一次诊断同时按 Phase 切分：每个 Phase 的实施、测试、正式审查、等待与材料修订各占多少时间与调用数，
写进该 Phase 已有的阶段事实行；这只是把已经存在的两个字段填上，不新增账本、不设预算 gate。
某个 Phase 的实际耗时明显超出计划里的估算时，先查明原因（计划缺口 / 实现缺陷 / 外部等待）并把原因写进事实，
再决定是否继续——不按时钟自动拆分或终止一个完整功能。
```

**自证生效（可观察事实，非校验）**：`A3b-volume.md` 的同一套数字（`T` 与 `W` 两侧的每 Phase 文件数与体积、重复文件数）可以直接重算，作为「证据有没有变瘦」的事实。

---

### §14.4 落点三：卡住必须升级到人（I-12）

#### I-12（第 12 条）`blocked` 必须用大白话向人报告并给选项与风险；连续无进展的自动续跑必须停

**实测靶子（来源甲，转录派生件 `data/gaps.json` + 定点 ord 7191→7275 逐条核实）**：
- 空档 = 2026-09-26T16:34:46.335Z → 22:27:02.161Z，**21,135.8 s（5 小时 52 分）**。
- 因果链：agent 连跑 **3 轮自动续跑**（ord 7195 / 7216 / 7236，间隔 38 s / 19 s），三轮结论完全相同「材料未变化、无授权」，**什么都没干**（每轮一次全上下文 274K tokens 输入）；随后 ord **7264**（16:34:46.080）agent **自己把持续目标标为 `blocked`**——`blocked` 是终态，续跑循环不再拉起；ord **7267** `task_complete`（正常结束，**不是** `turn_aborted`）；此后到 22:27:02 **转录里没有任何事件，也没有任何通知人的通道**。
- ord 7264 问的那句话全是黑话：**「AC17–19 旧'乙/MISSING'是否撤销、CARD04 是否取得逐项受保护写面、P11 当前变更的 UI 适用性」**。用户随后连续三条抗议：ord 7299「你这个问题我根本看不懂是什么意思，答案也看不懂，跟你说了用简洁的大白话和我沟通！」、ord 7313「我完全看不懂啊…你不要用属于和黑话和我沟通！用简洁的大白话沟通！」。
- ⇒ **三个独立缺陷叠加**：①`blocked` 不通知人 ②无进展的自动续跑空转 ③问题不可回答。

**落点＝`AGENTS.md` 的 `## 给 agent 的规则` 下新 `### 卡住与升级（本任务后续执行）` 段（本卡内做，已落地）**。R13（在 `docs/standard-workflow.md` 的 `### stage 结束` 段）已覆盖「没有回复时停在当前 stage，记录 `awaiting_user`，不自行进入下一 stage」；本节补的是**「卡住时怎么告诉人」与「空转续跑」**两件事——它们只有在**常驻上下文文件**里才可能被真正读到。

> **落点变更记录（2026-09-28）**：本节初稿把落点写成 `docs/standard-workflow.md` 的 `### stage 结束` 段（与 R13 同段）。用户 2026-09-28 逐字「**允许，可以修改AGENTS.md**」⇒ 改落 `AGENTS.md`，并**显式推翻 T-019=B** 的「`AGENTS.md` 净变更恰好三条」预算（`AGENTS.md` 由三条变**四条**）。判定过程见 §14.6 冲突 1。

**逐字草案（已按此落地到 `AGENTS.md` 的 `### 卡住与升级（本任务后续执行）` 段）**：

```markdown
卡住时先把话说明白再停：用日常语言写清「现在卡在哪、为什么不能继续、有几条路、每条路的代价与风险」，
并给出可以直接回复的选项；不得用阶段缩写、AC 编号、内部取值或其它只有读过材料的人才懂的词作为唯一说明。
同一件事连续若干次没有产生任何新事实时，停止自动续跑并把上面这条报告写出来，不重复同一次无进展的尝试。
```

**落地核对（实际写入 `AGENTS.md` 的逐字，2026-09-28）**：段标题 `### 卡住与升级（本任务后续执行）`，位置在 `### 测试硬规则（本任务后续执行）` 之后、`## 入口文件` 之前；正文四条：

```markdown
- 卡住时必须先把话说明白再停：用日常语言写清「现在卡在哪、为什么不能继续、有几条路、每条路的代价与风险」，并给出可以直接回复的选项。
- 禁止把阶段缩写、AC 编号、内部取值或其它只有读过材料的人才懂的词，作为唯一的说明。
- 同一件事连续若干次没有产生任何新事实时，停止自动续跑，把上面这条报告写出来，不重复同一次无进展的尝试。
- 依据：[docs/standard-workflow.md](docs/standard-workflow.md) 的 `### stage 结束` 段（R13 人类边界）之后；本条是沟通与停机纪律，不是新的 stage、gate 或质量结论。
```

与上面的「逐字草案」相比，落地版把草案第一段拆成两条（「先说大白话」与「禁止只抛代号」），并补了第三条的「不重复同一次无进展的尝试」和第四条的落点依据——**条款实质一致，措辞按 `AGENTS.md` 既有三条的格式（`- 依据：…；本条是…纪律，不是新的 stage、gate 或质量结论。`）对齐**。`docs/standard-workflow.md` 的 `### stage 结束` 段**不再重复条款正文**，R13 那句保持原样（避免同一条款两个权威，兑现 §0 的形态要求）。

**为什么原判定是「不进 `AGENTS.md`」、以及该判定为何被推翻**：见 §14.6 冲突 1。原判定的**唯一**理由是 T-019=B 的「`AGENTS.md` 净变更恰好三条」常驻上下文预算；用户按本条靶子的严重性（`blocked` 静默 **5 小时 52 分**、用户连续三条抗议、**零通知人的通道**）重新权衡后，预算理由让位于可发现性。

**不构成门禁**：这两个动作**不阻断任何推进**——它们是**停止**动作，不是许可动作；「报告写没写、写得清不清楚」由验收时核对事实（SD-17 的形态），不由机器判定。

---

### §14.5 A5 三条（I-13 … I-15）

#### I-13（A5-①）审查派发前不再派同一三元组

**A5 的原话**：`runtime/review/review-record-route.mjs` 已有 `SHARED_REVIEW_TUPLE_FIELDS` ＋ `REVIEW_ATTEMPT_REF`，加「三元组相同且已有 semantic attempt 则拒绝再派发」＋文案落 `workflows/build-code/SKILL.md:91-95`、`docs/standard-workflow.md:83`。

**实测核对（本卡 worktree，全部命中）**：
- `runtime/review/review-record-route.mjs:21` 逐字 `const REVIEW_ATTEMPT_REF = /^quality\/reviews\/attempts\/([A-Za-z0-9][A-Za-z0-9._-]*)\/attempt\.json$/;`
- `runtime/review/review-record-route.mjs:349` 逐字 `const SHARED_REVIEW_TUPLE_FIELDS = ["subject_kind", "phase_id", "review_scope"];`
- `docs/standard-workflow.md:84-86` 逐字「代码审查使用 OCR delegation：`build-code` 每个 Phase 一次，`verify-code` 在最终 worktree 一次。`wh-review` 保留给 make-decision、build-spec、build-plan 等其它审查面。」
- `workflows/build-code/SKILL.md:93-95` 逐字「Use the existing OCR delegation adapter through public `review --action=record` once for each Phase. The adapter selects the packet; the independent host returns findings. Verify-code owns the one final worktree review.」

**⇒ 结论：零件齐了，缺的是「已有成功结果就不再派发」这一道判据。** 本节的处置**与 A5 不同的一点**（必须写明）：
- **方法条款（CARD-03 写面内）**：`workflows/build-code/SKILL.md:93-95` 那句 `once for each Phase` 之后补一句，把「一次」的边界写成可判定的形式；`docs/standard-workflow.md:84-86` 同义补一句。
- **runtime 面（`runtime/review/**`）不在 CARD-03 写面**（属 CARD-05「审查链替换(有证据门槛)」），⇒ 本节**只做事实登记与方法条款，不做 runtime 实施**，把这条挂 CARD-05（见 §14.6 冲突 3）。

**逐字草案（追加到 `workflows/build-code/SKILL.md` 的该段；错开实施）**：

```markdown
"Once per Phase" means once per existing (subject kind, Phase, review scope) tuple: when current
task facts already hold a semantic result for that tuple, reuse it and record the reuse instead of
dispatching the same review again. An `unavailable` attempt counts as that tuple's attempt.
```

**逐字草案（追加到 `docs/standard-workflow.md` 的 `### review、测试和成本` 段；本卡内做）**：

```markdown
同一（审查对象种类、Phase、审查范围）已经有 semantic 结果的，复用该结果并在事实里写明复用，
不再派发同一次审查；`unavailable` 那次也算该对象的尝试次数。
```

#### I-14（A5-②）业务规则的版本绑定从「整份文件 sha256」改成稳定锚点

**A5 的原话**：`docs/quality/business-case-catalog.json` 的 `source.revision` 从整份文件 sha256 改为稳定锚点（章节/AC 编号），校验器 `runtime/evidence/canonical-evidence-validators.mjs`。靶子＝复盘 §2.4 的「P8 用整份 P6/P7 计划文件哈希作版本」，消掉 P8 两轮来源重绑（`.9→.10→.11`）与「P6 一段改字、P8 语义未变却变红」。

**实测核对（本卡 worktree）**：
- `runtime/evidence/canonical-evidence-validators.mjs` **517 行**，逐字符校验点密集：`:81` 逐字 `` if (!match || match[1] !== reference.sha256 || hashText(raw) !== reference.sha256) throw new Error(`${label}.ref hash mismatch`); ``、`:340` 逐字 `` if (hashText(raw) !== binding.sha256) throw new Error(`${label} hash mismatch: ${binding.ref}`); ``、`:147`/`:476-477`/`:497` 三处 `material_revision` 必须是 `^revision-[a-f0-9]{64}$`。
- **`docs/quality/business-case-catalog.json` 在本卡 worktree 实测存在（56200 B）**。**2026-09-29 复核更正**：本行原写「实测不存在（`ls docs/quality/` → `No such file or directory`；全仓 `find -name 'business-case-catalog*'` 零命中）。⇒ 该文件只存在于 CARD-04 侧」，**该断言不成立**——CARD-04 已把该文件以 `+806/−0` 写入 main（其 `source.revision` 现为 `2026-09-28.card04-finite-a1-a2-p9-rule-sync.16`），并随合并点 `97092b30` 进入本卡 worktree；`runtime/evidence/canonical-evidence-validators.mjs` 亦在本卡 worktree 内（实测 34520 B）。**本节不落地改动的理由与「文件是否存在」无关**，见下条。

**⇒ 处置：整条挂责任卡，本节只做事实登记。** 理由与 §6.8 的 sha 链判定**同一条原则**（OI-013 + FR-29：**记录层不用内容寻址哈希**，`prd.md:244` 逐字点名「材料身份/哈希/sha 校验」非推进前置）：
- 该文件的改动面（`docs/quality/**`、`runtime/evidence/**`）**不在 CARD-03 写面**（§6.1.1 第 34 行已判「本卡不改」）——**这才是本节只登记、不落地的唯一理由**（2026-09-29 复核确认：文件已在本卡 worktree 内，但写面判定不变）。
- 它属 **OI-013「校验机器彻底全删」** 的删除面，责任卡含 **CARD-06**（`prd.md:178`）。
- 本卡**不替 CARD-06 或 CARD-04 实施**；本节只把「绑定轴应该从整份文件 sha256 改成稳定锚点（章节编号 / AC 编号）」这一条**写进事实登记**，供责任卡直接引用。

**⇒ 若用户希望本卡就改这一处，需要显式推翻「本卡不改 `runtime/evidence/**`」这一行（§6.1.1 第 34 行）；本节不自行推翻。**

#### I-15（A5-③）交接前的可执行性核查

**A5 的原话**：把「交接前可执行性核查」做成一件事，落在 `workflows/build-plan/SKILL.md` ＋ `runtime/stage/stage-handoff.mjs` ＋ `docs/standard-workflow.md`。

**本节的处置：接受这件事，但拒绝它的第三个落点（`runtime/stage/stage-handoff.mjs`）。** 理由**不是**本节自己的偏好，而是三条外部约束的合取：
- 复盘报告 §6.2 逐字：「这是 build-plan 的完成条件与人工工作纪律，**不新增 runtime 机器推进门**」（`/Users/Hugh/Downloads/workflowhub-card04-build-code-超时复盘-20260928.md`）。
- SD-17 / OI-012（`prd.md:93-95` 逐字）：一切机器/流程门禁删除；规则类要求一律为**事实记录+验收核对**，不构成推进前置。
- §0 的「本设计一律不做的事」：不新增门禁/阻断/校验前置。

**⇒ 落点收窄为两处**：`workflows/build-plan/SKILL.md`（错开实施）＋ `docs/standard-workflow.md`（本卡内做）。`runtime/stage/stage-handoff.mjs` **明确不落**，并作为事实登记进本卡材料。

**A5 自己给出的靶子（照录，供验收核对）**：这一条要消掉的三条最贵返工链＝①P10 的验收场景与 AC-26/27；②P5 的人工例外字段；③P6 的第 9 个键。它们正是 `A3b-volume.md` 实测的 `P5` 15 份、`P10` 26 份非正式复核的主要来源。

**逐字草案（追加到 `docs/standard-workflow.md` 的 build-plan 段；本卡内做）**：

```markdown
build-plan 交接前把「可执行性」当成完成条件核对一次，核对结果写进材料本身：
直接打开源文件确认入口、真实消费者、权限、测试工具、样例原件与外部依赖是否已经具备；
抽一条最难的链路（需求 → 真实入口 → 原始结果 → 独立判断 → 验收项）走通一次；
预写的 RED 必须因为目标行为而失败，不能是导入错误、路径错误或零测试。
核不到的东西写成 `unknown` 与它的负责人。这是 build-plan 的完成条件与工作纪律，不是推进前置。
```

**受益与量级（来源甲/乙的实测，不是推断）**：靶子＝`A2-plan-gaps.md` 的 61 条缺口实例（其中「源头在计划期」的部分）与 `A3b-volume.md` 实测的 `P5` 15 份 / `P10` 26 份非正式复核。**本卡不声称「零返工」**——可严格追求并可检查的是复盘 §6 末尾那三条：**零已知计划缺口进入 build-code、零同范围重复正式审查、零无界计划改写**。

---

### §14.6 与既有裁决的冲突处置（三处，不静默覆盖）

#### 冲突 1：第 12 条 vs `AGENTS.md` 的「恰好三条」预算

- **既有裁决（§1.0 逐字）**：`decision-log.md:61`（T-019）用户选 **B＝只给最贵的三条**——①禁子代理继承父代理全部对话 ②禁空转轮询 ③「声明不实怎么被发现」；同一行并明确**拒绝 A（条款膨胀）**，因为 `AGENTS.md` 是常驻上下文文件。§1.0 据此写明「v2 对 `AGENTS.md` 的净变更**只有三条**」。
- **冲突**：第 12 条（`blocked` 必须大白话升级到人）若落 `AGENTS.md`，净变更变成**四条**，直接违反 T-019=B。
- **处置（2026-09-28 用户裁决后更新，本节原判定作废）**：第 12 条**落 `AGENTS.md`**（新增 `### 卡住与升级（本任务后续执行）` 段，逐字见 §14.4）。用户逐字：「**允许，可以修改AGENTS.md。**」⇒ **T-019=B 被用户显式推翻**：`AGENTS.md` 的净变更由三条变**四条**。**§1.0 的「恰好三条」措辞按本节作废**（`design.md:51` 的标题与 `:49` 的「只有三条」句以本节为准；`AGENTS.md` 的实际内容为不变量，§1.0 其余不动）。
- **理由（记录被推翻的原判定，供后续核对）**：本节原先判定不进 `AGENTS.md`，**唯一**理由是 T-019=B 的常驻上下文预算——即 `decision-log.md:61` 拒绝 A（条款膨胀）的那条理由。用户既然按第 12 条靶子的**严重性**重新权衡（`blocked` 静默 **21,135.8 s（5 小时 52 分）**、用户 ord 7299/7313 连续三条抗议、**没有任何通知人的通道**），预算理由就让位于可发现性——**常驻上下文文件恰恰是「不通知人」这个缺陷的反面**：不常驻的条款正是没人读到的那一条。
- **两条落点的分工（不制造第二权威）**：`AGENTS.md` 写**纪律本身**（必须大白话报告「卡在哪／有哪些选择／各自风险」＋禁止只抛代号＋连续无新事实则停自动续跑）；`docs/standard-workflow.md` 的 `### stage 结束` 段**不再重复条款正文**，R13 那句保持原样——避免同一条款两个权威（本设计 §0 的形态要求）。`AGENTS.md` 那条的「依据」行以链接指向 R13 所在的段。
- **用户原话与本节的关系**：用户只说了「允许，可以修改AGENTS.md」，**没有**说明 `AGENTS.md` 是否就此不受三条预算约束。本节的选择是**如实登记这次推翻**（三条→四条），而不是把它解释成「预算不变」——后者会让 §1.0 与新事实长期自相矛盾。

#### 冲突 2：`skills/spec-plan/**` 的 sha 链

- **用户 2026-09-28 逐字**：「**skills/spec-plan/** 的 sha 链决定不变**」⇒ 沿用 2026-09-27 的裁决 A：**本卡零哈希动作，整条链挂 CARD-06**（§6.8 全文）。
- **本节新增的落点里，`skills/spec-plan/templates/phase-template.md`（+6 行）与 `skills/spec-plan/SKILL.md`（+1 句）都在该链内** ⇒ 改而不回写哈希后，§6.8 消费者地图的 #2/#3/#4/#5/#8 与 `check:skill-closure` 会红或抛错，直到 CARD-06 落地。这些红**在既有红之上**（全量基线：**83 个测试文件 / 219 条测试红**，耗时 68.4 分钟，见 `decision-log.md` 的 `### 九、` 一节）。
- **本卡 §6.1.1 内部的一处自相矛盾（本节必须点名）**：第 40 行写 `skills/catalog.yaml`、`skills/spec-plan/skill-bundle.json` 的摘要链「**本卡内做**（同批回写摘要链）」，第 42 行写同一批文件「**本卡不写、不算、不回写任何哈希**」。**两行不能同时成立。**
- **处置**：**以第 42 行为准**（它是后加的、授权来源是 SD-17 + OI-013 + 用户 2026-09-27 逐字，位上覆盖第 40 行的 T-028/T-008）。⇒ **第 40 行的「本卡内做」措辞作废，改为「本卡不改（由第 42 行覆盖）」**；§6.1.3 的 S 配方（若仍写着回写步骤）同批标注为**不执行**。本节的这一判定**是文档内部一致性修正，不是新决策**。

#### 冲突 3：A5 三条里两处的写面不在 CARD-03

- **A5-① 的 runtime 面**（`runtime/review/review-record-route.mjs`）：属 CARD-05「审查链替换(有证据门槛)」。
- **A5-② 全部**（`docs/quality/business-case-catalog.json`、`runtime/evidence/canonical-evidence-validators.mjs`）：属 OI-013 删除面（责任卡含 CARD-06）与 CARD-04。**2026-09-29 复核更正**：原记「该文件在本卡 worktree 不存在」不成立——两个文件都在本卡 worktree 内（`docs/quality/business-case-catalog.json` 实测 56200 B 且 CARD-04 已对其作 `+806/−0` 写入；`runtime/evidence/canonical-evidence-validators.mjs` 实测 34520 B）。
- **处置**：两条**只做方法条款与事实登记**，runtime 面**不在本卡实施**。这与 CARD-03 卡的「集成责任＝CARD-03 owner 冻结方法接口，与 CARD-04（验收写入步）、CARD-05（审查节奏）、CARD-07（make-decision 写面）按 SD-11 先协调再并行」（母 PRD `prd.md:315`）一致——**本卡冻结的是方法接口，不是别人的 runtime**。

---

### §14.7 施工表增补（追加到 §6.1.1 的 42 行之后，编号 **43–67**：43–52 首批、53–60 模板中文化、61–62 phase 模板重构与正则、63–67 审查提案）

| # | 文件 | 落点（文本锚点） | 改什么（一句话） | 处置 | 授权来源 |
| --- | --- | --- | --- | --- | --- |
| 43 | `skills/spec-plan/templates/phase-template.md` | 尾注段 `Do not collapse multiple Tasks into one line,` 所在三行之后、`## L2 — Removable reference` 之前 | 追加 6 行：字段齐备性 / 只写意图 / 标题＝一个可独立验收的功能结果 / 写面纪律 / 规模对账 / 空白格不等于小范围 | 本卡内做（**已落地**：6 行内容并入行 61／68 的整份重构，见 `:2610` 与 §14.12；**2026-09-29 一致性复核更正**） | 用户 2026-09-28「12 条都认」；设计书 §14.2 I-1…I-5 |
| 44 | `skills/spec-plan/SKILL.md` | `Write one independent \`phases/P<n>.md\` file per Phase using` 所在段末句（第 2 行的 `Acceptance inline` 句之后） | 追加 1 句：交接前逐字段核对 + `Consumer`/`Observable seam` 里的真实路径与符号必须存在 | 本卡内做（**实况：该末句未落**——`skills/spec-plan/SKILL.md`（34 行）全文无此句；**全仓落地文件** 0 命中 `Before handoff, confirm`，实测 `grep -rn 'Before handoff, confirm' --exclude-dir=.git --exclude-dir=node_modules .` 的 **3 处命中**全部落在本设计书自身：`:2272`（逐字草案）、本行 `:2570` 与 `:3298`（§14.14.7 复述）；同一命题已由 `skills/spec-plan/templates/phase-template.md:147`／`:175` 的 `可观察接缝` 字段规范（三项都写「我是怎么知道的」）承载；**2026-09-29 一致性复核更正**） | 同上 |
| 45 | `workflows/build-code/steps.json` | `:5` 的 `observable_result`（与 §5.1 同批，追加在 §5.1 替换文本之后） | 追加 1 句：一次只推进一个 Phase；提前开第二个 Phase 记为事实 | 本卡内做 | 用户 2026-09-28；设计书 §14.3 I-6 |
| 46 | `workflows/build-code/steps.json` | `:12` 的 `observable_result`（与 §5.2 同批，紧邻 §5.2 追加句） | 追加 1 句：`unavailable` 也算该 Phase 的一次尝试 | 本卡内做 | 用户 2026-09-28；设计书 §14.3 I-8 |
| 47 | `docs/standard-workflow.md` | `### review、测试和成本` 段末 | 追加 3 行：证据只留原件与指针 / 不得把整棵树当证据 / 同三元组已有 semantic 结果则复用 | 本卡内做（**实况**：前两句已落地 `docs/standard-workflow.md:107-123`；第三句的 runtime 侧（`runtime/review/review-record-route.mjs`）按 §14.6 冲突 3 挂 **CARD-05**，见 `:2613`；**2026-09-29 一致性复核更正**） | 用户 2026-09-28；设计书 §14.3 I-9、§14.5 I-13 |
| 48 | `docs/standard-workflow.md` | `### review、测试和成本` 段（诊断维度句） | 诊断维度加「按 Phase」切分 + 超估算先查原因、不按时钟自动拆分 | 本卡内做 | 用户 2026-09-28；设计书 §14.3 I-11 |
| 49 | `AGENTS.md` | `### 测试硬规则（本任务后续执行）` 之后、`## 入口文件` 之前，新增 `### 卡住与升级（本任务后续执行）` | 追加 **4 行**：①卡住时必须先把话说明白再停（日常语言写清「卡在哪／为什么不能继续／有几条路／每条路的代价与风险」并给可直接回复的选项）②禁止把阶段缩写、AC 编号、内部取值或其它只有读过材料的人才懂的词作为唯一说明③同一件事连续若干次没有产生任何新事实时停止自动续跑、不重复同一次无进展的尝试④依据行（链到 `docs/standard-workflow.md` 的 `### stage 结束` 段；本条是沟通与停机纪律，不是新的 stage、gate 或质量结论） | 本卡内做（**已落地**） | 用户 2026-09-28 逐字「允许，可以修改AGENTS.md」；设计书 §14.4 I-12；**§14.6 冲突 1 已按用户裁决更新：T-019=B 被显式推翻，`AGENTS.md` 净变更由三条变四条**；`docs/standard-workflow.md` 的 `### stage 结束` 段**不改**（R13 那句保持原样，不制造第二权威） |
| 50 | `docs/standard-workflow.md` | build-plan 段 | 追加 5 行：交接前可执行性核查＝完成条件（事实记录，非推进前置） | 本卡内做（**已落地**，`:290-294`） | 用户 2026-09-28「加上 A5 的新增条目」；设计书 §14.5 I-15 |
| 51 | `runtime/stage/stage-handlers.mjs` | `#completionReview`（`:280` 起）里原记 `:280` 的 `duration_ms: null,`、`:281` 的 `tokens: null,`（现 `:294`／`:295`） | 把已有的两个字段填上（**不新增键、不新增机制**） | 本卡内做（**已落地**，改后字段在 `:294-295`；机制见 §14.6 第 4 条的消解注记） | 用户 2026-09-28；设计书 §14.3 I-11 |
| 52 | `workflows/build-code/SKILL.md`、`workflows/build-plan/SKILL.md` | 方法章节（各自分别的段落，逐字见 §14.3 I-6/I-7/I-9/I-10、§14.5 I-13/I-15） | 6 处方法条款（**均在 CARD-04 写面内**） | **错开实施** | 用户 2026-09-28；§6.1.1 第 17–20 行同款处置 |

**增补后本表共 52 行，「无授权」0 行。** 其中 **43–51 本卡内做（9 行）**、**52 错开实施（1 行）**。
| 53 | `skills/spec-plan/templates/phase-template.md` | 全文 | 整份改写为中文（仍 56 行；H1 保留 `# Phase P<n> — `，理由见 §14.10.1） | 本卡内做（**已落地**） | 用户 2026-09-28「所有模板内容尽量全用中文表现」；设计书 §14.10 |
| 54 | `skills/spec-plan/templates/plan-template.md` | 全文 | 整份改写为中文（15 个 plan 章节标题 + 8 个 Phase 子标题 + 全部字段标签） | 本卡内做（**已落地**） | 同上；§14.10.1 |
| 55 | `skills/spec-tasks/templates/index-template.md`、`skills/spec-tasks/templates/tasks-template.md` | 全文 | 两份整份改写为中文（索引表头统一为 `阶段 / 权威引用 / 语义锚点 / 写入集 / 依赖 / 消费者`） | 本卡内做（**已落地**） | 同上 |
| 56 | `skills/spec-specify/templates/spec-template.md` | 全文 | 整份改写为中文（274 → 275 行；四个实现设计小节译名见 §14.10.1） | 本卡内做（**已落地**） | 同上 |
| 57 | `skills/spec-prd/templates/prd-template.md`、`skills/decision-log/templates/decision-log-template.md` | 全文 | 整份改写为中文；**机器键、枚举值、英文键一律保留**（`decision_revision` 等 4 个 snake_case 键、`## grill`/`## Supersedes`/`### Exit checks` 三处被契约测试锁死的标题采用「英文键 + 中文括注」） | 本卡内做（**已落地**） | 同上；§14.10.1 |
| 58 | `runtime/stage/stage-content-contracts.mjs`、`runtime/task/material-workspace.mjs` | 见 §14.10.2 与 §14.10.3（逐处列出） | 中英双语别名层：**纯增量**，英文材料的解析结果逐字节不变 | 本卡内做（**已落地**） | 用户 2026-09-28 的中文化指令（模板变中文后解析器必须同时吃中英标签） |
| 59 | `skills/decision-log/skill-bundle.json`、`skills/spec-plan/skill-bundle.json`、`skills/spec-prd/skill-bundle.json`、`skills/spec-specify/skill-bundle.json`、`skills/spec-tasks/skill-bundle.json`、`skills/catalog.yaml` | 各自的 `local_bundle_hash`（`skills/catalog.yaml:130`/`:253`/`:286`/`:335`/`:367`） | 5 条技能包哈希重算（**显式推翻 sha_chain=A**；理由与逐条新值见 §14.10.4） | 本卡内做（**已落地**） | 用户 2026-09-28 的中文化指令；§14.10.4 登记的推翻 |
| 60 | `tests/contract/post-cohort-authoring-files.test.mjs`、`tests/contract/post-cohort-executable-authoring.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/spec-prd-skill-contract.test.mjs`、`tests/contract/filled-plan-task-production.test.mjs` | 见 §14.10.5（逐条列断言） | 5 份契约测试同步为中文断言（前两份直接断言模板文本，必须与模板同步改） | 本卡内做（**已落地**） | 同上 |

**增补后本表共 60 行，「无授权」0 行。** 其中 **43–51 与 53–60 本卡内做（17 行）**、**52 错开实施（1 行）**。

**2026-09-28 再增补第 61–62 行（全表 62 行、「无授权」0 行；本卡内做 19 行）：**

| 61 | `skills/spec-plan/templates/phase-template.md` | 整份（56 行 → **195 行**＝185 行草案＋审查提案 bs P1/P2 并入 10 行；2026-09-28 二次修订后 **217 行**，见 §14.15） | 三层人读结构（使用说明 / 速读卡 / 字段说明表 / 填满的示例卡）+ 补 5 个缺失的文件级字段槽位；**机器字段标签一个未改** | 本卡内做（**已落地**） | 用户 2026-09-28 逐字「phase 的模板比原来 plan 和 tasks 模板质量差距太大了…需要仔细调研分析」；设计书 §14.12；**行 43 的「追加 6 行」由此升级并作废** |
| 62 | `runtime/stage/stage-content-contracts.mjs` | `#validatePostPhaseContract`（`:7189` 起）内三处语义正则（原记 `:7132`、`:7147`、`:7160`；现 `:7290`、`:7234-7238`、`:7318`） | 中文化引入的英文单语回归修复（`symbol`→加 `符号`；卡内 `Dependency` 加 `无`；末尾循环改用 `WITHOUT_PREDECESSOR`） | 本卡内做（**已落地**） | §14.12.3；同批第二次重算 `skills/spec-plan/skill-bundle.json` + `skills/catalog.yaml:335`（新值 `ed8a2d15…`，**行 59 的值由此更新**） |
| 63 | `workflows/build-code/SKILL.md` | 新增 `### 计划缺口的集中退回` 一节（现 `:16-32`） | 计划缺口的**集中一次退回**：同一 Phase 的问题一次列清交计划负责人，未准备好的 Phase 停在真实「未完成」，不再边做边现场设计 | 本卡内做（**已落地**；§14.13；用户 2026-09-28「现在全落」；对应 §14.11 判定为「全新」的 build-code P2） |
| 64 | `workflows/build-code/SKILL.md` | work loop 第 5 条之后（原记 `:263-273`，现 `:284-303`） | Phase 一次审查合同·**规范侧**：派发前必须回答「同 Phase 同范围是否已有成功回执」「已有回执没覆盖的到底是哪一条（文件/AC）」「本次要看的范围由哪些文件/AC 定义」，写不清就不派发 | 本卡内做（**已落地**；§14.13；对应 §14.11 判定为「全新」的 build-code P8） |
| 65 | `workflows/build-spec/SKILL.md` | 锚点 `规格审查与 AC 文本都不替代执行证据。` 之后（现 `:90`） | **稳定版本锚**：稳定业务规则、接口契约与判定器的版本只能指向那段规则本身（文件 + 小节标题或显式 anchor），**禁止用整份常变文件哈希**；自检「无关段落的改动不应改变这条规则的版本」 | 本卡内做（**已落地**；§14.13；对应 §14.11 判定为「全新」的 build-spec P5） |
| 66 | `docs/standard-workflow.md`、`workflows/build-spec/SKILL.md` | `### review、测试和成本` 段末（现 `:96`）、`也不为 clean 标签重复整轮审查。` 之后（现 `:94-98`） | **复核件纪律**：同一主题同一阶段只留一份复核件；第二次只在原件尾部追加「本次相对上次新增的事实」并写清触发变化的真实原因；无真实变化就不写；**禁止整目录 / 整工作树复制** | 本卡内做（**已落地**；§14.13；对应 §14.11 判定为「全新」的 build-spec P6） |
| 67 | `docs/standard-workflow.md` | 六项摘要列表之后（现 `:140`） | **阶段末摘要第 2/5 项必须标明归属**：这条风险是「本阶段现在就能修的计划缺口」还是「实现尚未开始的未知」，两类不得混写成一句「还有风险」；每条给真实证据引用，没有就写 `unavailable` | 本卡内做（**已落地**；§14.13；对应 §14.11 判定为「全新」的 build-spec P7） |
| 68 | `skills/spec-plan/templates/phase-template.md` | 速读卡区、L1 内、字段说明表、用法 7 条（纯增量 22 行） | **执行者对照性二次修订**（2026-09-28 用户当面新指令，§14.15）：新增「本 Phase 材料导航」整节、速读卡加「动手前必读／未决事实」两条、L1 新增「交接知识」小节、字段说明表加 4 行、用法加第 7 条；机器字段标签一个未改 | 本卡内做（**已落地**；§14.15；sha 链第 5 次重算 `b1a6e954…`） |


| 69 | `skills/plan-eng-review/SKILL.md` | 第 8 条之后、`## Result` 之前（纯增量 29 行） | **审查第 9 条「遗漏类扫描」**（2026-09-28 用户问「build-plan 审查细节需不需要优化，避免 spec/phase 大量遗漏无人知晓」，用户选 A 全落）：九类历史缺口（A 真实来源/生产者未认证 … I 规模未知）逐类必须作答（证据／`none_observed`／`not_checked`，跳类本身即 finding）＋**对账总闸**：原始需求逐行，每条 R/FR/AC 要么指到具体 Task、要么写明不做/延期理由＋负责人，无声消失即 finding | 本卡内做（**已落地**；§14.16；审查技能 bundle 哈希重算 `ef828eb4…`） |
| 70 | `tools/cli/stage-runtime.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/review-input-bounds.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`workflows/build-code/SKILL.md`、`docs/standard-workflow.md` | （本卡只设计不动手） | **审查编排优化五项措施＋预算研究项**（2026-09-28 用户指令「不能只登记，要设计更详细的解决方案」；card-04 审查耗时法证：墙钟 2.88h＞全会话 exec 1.76h、43% 空 attempt、坏结果照收）：①审查非阻塞化 ②派发前契约预检 ③结果完整性校验 ④审查包只绑声明写集 ⑤发现分级消费；⑥预算/超时降级为研究项（用户质疑硬切浪费、健康检查已够） | **下游推迟**（CARD-04 未实现；转 CARD-05／CARD-06 按 §14.17 拆任务；本卡零 runtime 改动） |


**全表合计 70 行、「无授权」0 行**（43–52 本卡内做 10 行；行 45／46 为落点移位：`docs/standard-workflow.md:318-322`＋`workflows/build-code/SKILL.md:333`；`workflows/build-code/steps.json:12`＋`workflows/build-code/SKILL.md:284-303`；行 47 第三句的 runtime 侧按 §14.6 冲突 3 挂 CARD-05，见 `:2613`。**43–52 行实况（2026-09-29 复查更正，实测）：已设计、未实施＝3 处 —— 行 44 末句、行 47 第三句、行 52**（行 44 末句：`skills/spec-plan/SKILL.md` 全文无该句，同一命题由 `skills/spec-plan/templates/phase-template.md:147`／`:175` 的 `可观察接缝` 字段规范承载；行 47 第三句：前两句已落地 `docs/standard-workflow.md:107-123`，第三句「同三元组已有 semantic 结果则复用」在 `docs/standard-workflow.md` 零命中、其 runtime 侧按 §14.6 冲突 3 挂 CARD-05；行 52：`并行上限`／`并发上限` 在 `workflows/build-code/SKILL.md` 与 `workflows/build-plan/SKILL.md` 命中数＝0，该行标「错开实施」）；其余（行 43、行 45–46、行 47 前两句、行 48–51）已落地。53–69 已落地、70 下游推迟；2026-09-28 step 9 复核补记；**2026-09-29 一致性复核更正**）。

> **行 43 的处置已于 2026-09-28 改写**：用户在同日追加指出「**phase 的模板比原来 plan 和 tasks 模板质量差距太大了，结构化、可阅读性、内容丰富程度都差的很远，需要仔细调研分析**」⇒ 行 43 原定的「在旧英文尾注段后追加 6 行」被**升级为整份重构提案**，调研报告已回收、6 行内容已并入重构后的模板并落盘（见 §14.10.7 未决项 1 的闭合记录与 §14.12；**2026-09-29 一致性复核更正**）。行 43 的 I-1…I-5 内容不撤销，改为并入重构后的模板。

**不落在本卡的登记行**（不占上表编号，只作事实；2026-09-29 复核更正）：
- `runtime/review/review-record-route.mjs` 的「同三元组已有 semantic attempt 则不再派发」→ **挂 CARD-05**（§14.6 冲突 3）。
- `docs/quality/business-case-catalog.json` 的 `source.revision` 改稳定锚点 ＋ `runtime/evidence/canonical-evidence-validators.mjs` → **挂 CARD-06 / CARD-04**。**2026-09-29 复核更正**：`docs/quality/business-case-catalog.json` **在本卡 worktree 内**（实测 56200 B；CARD-04 已对其作 `+806/−0` 写入，含 `"revision": "2026-09-28.card04-finite-a1-a2-p9-rule-sync.16"` 与 `source.revision` 的 sha256），原「**不在本卡 worktree**」的实测结论不成立；`runtime/evidence/canonical-evidence-validators.mjs` **确实存在**（实测 34520 B）。
- 同文件（`runtime/review/review-record-route.mjs`）的**三连缺陷** card-04 **触而未修**（该文件在 card-04 的 110 文件改动清单内），属 **CARD-05 领地**：登记处 `specs/archive/workflowhub-thin-core-card-04-20260919/decision-log.md` 的「审查记录链缺陷（本卡发现，移交 CARD-05）」段（约 `:1794` 起），登记值 `:1229`（`canonical review pair member binding is invalid`）与 `:1415-1418`（`REVIEW_HISTORY_UNAVAILABLE`），实证 `why=no-member-in-byRef`；本卡 worktree 现行位置：`canonical review report binding is invalid` `:1310`、`canonical review pair member binding is invalid` `:1367`、`REVIEW_HISTORY_UNAVAILABLE` `:1565`。

---

### §14.8 本节的验证命令（**只跑受影响的针对性测试**；不得跑全量）

```bash
# 1) 模板与两个契约测试（§14.2 的 6 行落地后）
npx vitest run tests/contract/post-cohort-executable-authoring.test.mjs tests/contract/post-cohort-authoring-files.test.mjs

# 2) 负断言逐字自检（必须为空）
grep -n "one-line results" skills/spec-plan/templates/phase-template.md
grep -n "plan\.md\|tasks\.md" skills/spec-plan/templates/phase-template.md

# 3) 大小写敏感断言的两行括号说明必须原样（§3.3 的禁区）
grep -n "^\- \*\*Write set\*\*\|^\- \*\*Dependency\*\*" skills/spec-plan/templates/phase-template.md

# 4) 模板行数与字段数
wc -l skills/spec-plan/templates/phase-template.md    # 期望 217（2026-09-28 二次修订后；原期望 195 见 §14.12，二次修订见 §14.15）

# 5) build-code steps.json 的两处追加（order / step_slug 必须未变）
node -e 'const s=require("./workflows/build-code/steps.json");console.log(s.steps.length, s.steps.map(x=>x.order+":"+x.step_slug).join(" "))'

# 6) 成本信号不再是 null（§14.3 I-11）
grep -n "duration_ms\|tokens" runtime/stage/stage-handlers.mjs | sed -n '1,6p'

# 7) 阶段级契约（steps.json 改动后）
npx vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs
```

**不得执行**：`npx vitest run`（全量 68.4 分钟，且既有红 219 条会淹没本次改动）。

---

### §14.9 残留不确定（如实登记，不自行裁决）

1. **I-2 的落地强度**：本节只要求「字段必须出现」。**「格子里填的是泛指套话」这一层，本节不提供机器判据**（会给不出而不给）。若验收时需要这一层，只能靠人工核对——这是 SD-17 的形态，不是一个缺口。
2. **I-7 的边界五类**是否穷尽 `A2-plan-gaps.md` 的九类缺口，本节**未做逐条映射**（只给了 A/B/C/D/E 五类的条数合计 39/61）。
3. **I-9 的「只跑受影响测试」**没有给出「受影响」的判据——本节只写了纪律。既有的影响集口径在 `docs/standard-workflow.md` 的同一段（「只重跑受影响的检查」），本节**不新增第二个判据**。
4. **I-11 的 `duration_ms` / `tokens` 由谁填**：本节只说「把已有的两个字段填上」，**没有指定填的时机与责任方**——这需要与 `runtime/stage/**` 的既有写侧协调，属本次未取证的断面。**（2026-09-28 消解，行 51 已落地）**：取证结论＝数据本已在 `provider_results[].timing.duration_ms` / `.usage`（`runtime/review/review-record-route.mjs:999-1000` 透传），唯一下游 `runtime/evidence/stage-completion-facts.mjs:226-227` 只认非负整数或 null；时机＝阶段收口聚合时，责任方＝`completionReview()` 本身（`runtime/stage/stage-handlers.mjs#completionReview`（原记 `:271-290`，现 `:280-299`） 改为对 provider_results 求和，无 safe-integer 数据时保持 null 即「未提供」）；验证＝聚合逻辑等价物单测 ✓＋`review-materials-contract`/`material-workspace` 75 ✓＋`stage-completion-facts` 等 107 ✓（`requirements-completeness-audit-acceptance` 的 3 红改动前后完全相同，属既存红）。
5. **`A3b-volume.md` 的两处未取**（原文照录）：三份整树快照是否**整树逐字节相同**（只验了 `plan.md` 一份）；`output/` 35 个 `.output` 与 32 份回执的配对关系。
6. **`skills/spec-plan/SKILL.md:28`** 已有「执行推演」（`execution dry-run`）契约，本节 I-2 的「交接前核对」与它**是不是同一条**，本节**未裁定**——若判定为同一条，则 I-2 的 SKILL 侧只需在原句后补「落到 `Consumer` 与 `Observable seam` 两个字段上」，不需要新增句子。


---

### §14.10 产物模板全中文化（I-16；2026-09-28 用户追加指令）

#### §14.10.0 指令与边界

用户逐字（2026-09-28，第三次追加）：

> 「允许，可以修改AGENTS.md。另外除了这些改动，我还希望修改decision-log、spec、phase的模板，我不希望再出现英文的模块名了，所有模板内容尽量全用中文表现！整个workflowhub是一个中文环境的开发框架！」

**本节自定的三条边界（超出即为越界，施工者不得扩张）**：

1. 只改**模板文件**（供人编写的 markdown 正文），**不改**机器键、枚举值、ID 形态、版本常量的字面值与 `skill-bundle.json` 的文件名。
2. 让 runtime 解析器**同时接受中英文标签**（纯增量），**不改变任何既有英文材料的解析结果**。
3. **不为中文化新增门禁、stage、gate、schema 或校验模块。**

#### §14.10.1 已中文化的 7 份模板

| # | 文件 | 行数变化 | 说明 |
| --- | --- | --- | --- |
| 1 | `skills/spec-plan/templates/phase-template.md` | 56 → 56 | H1 保留 `# Phase P<n> — `（**故意不译 `Phase`**：`阶段` 在本仓库已是 stage 的译名，撞名；`phases/` 目录名与 `phase_id` 键也是英文） |
| 2 | `skills/spec-plan/templates/plan-template.md` | 256 → 257 | 15 个 plan 章节标题 + 8 个 Phase 子标题全部对齐 `PLAN_SECTION_ALIASES` 的中文项 |
| 3 | `skills/spec-tasks/templates/index-template.md` | 12 → 12 | 表头统一 `| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |`（`权威引用` 是 `runtime/task/material-workspace.mjs` 认的别名） |
| 4 | `skills/spec-tasks/templates/tasks-template.md` | 24 → 24 | 三条权威改 `决定权威 / 规格权威 / 阶段权威`（未被 runtime 读取，可自由译） |
| 5 | `skills/spec-specify/templates/spec-template.md` | 274 → 275 | 四个实现设计小节 → `代码锚点 / 接口与失败语义 / 需求到任务追踪 / 全局验证策略` |
| 6 | `skills/spec-prd/templates/prd-template.md` | 104 → 104 | 保留 `{{decision_revision}}` 等 4 个 snake_case 键名（`tests/contract/spec-prd-skill-contract.test.mjs` 的 `readPlanningContract` 用它们断言） |
| 7 | `skills/decision-log/templates/decision-log-template.md` | 304 → 304 | `## grill（质询）`／`## Supersedes（被替代记录）`／`### Exit checks（退出检查）` 采用**英文键 + 中文括注**（`tests/decision-log-content-contract.test.mjs:38-50` 逐字要求精确字符串） |

**有意保留的英文 token（全表通用）**：`Phase`、`L0/L1/L2`、`FR`、`AC`、`P<n>`、`Tnnn`、`T001`、`RED`、`GREEN`、`ORACLE-`、`gate_cmd`、`oracle`、`expected_exit`、`evidence_path`、`spec.md`、`spec-content.v3`、`plan-task.v4`、`N/A — 理由`、`none`、`display_before_reply`、`human_approved`、`PFACT-001`、`SCN-001`、`FR-DOMAIN-001`、`AC-DOMAIN-001`、`## Appendix A`（契约测试按它切分）。

**验出的净改善（不是代价）**：`validateSpecContentProfile` 对 `spec-template.md` 的错误由 **5 条降到 4 条**——消失的是 `spec contains plan/task engineering material`，因为 `runtime/stage/stage-content-contracts.mjs:4196-4202` 的 `engineeringPatterns` 含 `/^##+\s+(?:Code Anchors?|…)/im` 与 `/\b(?:gate_cmd|expected_exit|…)\b/`，译成 `### 代码锚点` 与 `门禁命令/判定器` 后不再误命中模板自身。余下 4 条（`unresolved placeholder`、`spec-content.v3 section missing: ^1\.\s+问题与紧迫性$`、`… ^11\.\s+验收标准$`、`spec table exceeds five columns`）**是中文化之前就存在的**（profile 是给生成结果用的，模板带占位符本来就过不了；后两条的锚点与模板现有标题本来就不匹配）。

#### §14.10.2 `runtime/stage/stage-content-contracts.mjs` 的别名层（**本节的机制核心**）

**新增的四个符号**（插在 `function taskField(body, name)` 之前）：

```js
const FIELD_LABEL_ALIASES = Object.freeze({ /* 规范英文标签 → 中文别名数组，共 56 条 */ });

function escapeFieldLabel(label) {
  return String(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Sentinel for "no preceding Phase/Task", accepted in either language. */
const WITHOUT_PREDECESSOR = /^(?:none|无|无前序|无依赖)$/i;

/** Regex alternation accepting a canonical field label or any of its Chinese aliases. */
function labelAlternation(name) {
  return [name, ...(FIELD_LABEL_ALIASES[name] ?? [])].map(escapeFieldLabel).join("|");
}

/** True when a markdown line declares the given field, in either language. */
function declaresField(line, name) {
  return new RegExp(`^\\s*-\\s+\\*\\*(?:${labelAlternation(name)})\\*\\*\\s*[:：]`, "i").test(line);
}
```

**唯一咽喉点（改三处即覆盖全部标量字段）**：`function taskField(body, name)`、`function fieldValue(body, field)`、`function analyzeField(body, label)` 三者的正则都改为 `^\s*-\s+\*\*(?:${labelAlternation(...)})\*\*\s*[:：]\s*(.+?)\s*$` + `mi`。其中 **`fieldValue` 一处覆盖 `validatePostPhaseContract` 的全部 17 个 Phase 卡字段与全部 L1 标量字段**（`runtime/stage/stage-content-contracts.mjs#validatePostPhaseContract`（原记 `:6993`，现 `:7274`）的 `Object.fromEntries(required.map((field) => [field, fieldValue(cardBody, field)]))`）。

**其余改点（逐处）**：

| 位置 | 原实现 | 现实现 |
| --- | --- | --- |
| `PHASE_HEADING_ALIASES`（新增） | — | `Goal: 目标/结果`、`Files: 文件`、`Tasks: 任务`、`Verify: 验证`、`Knowledge: 知识`、`STOP: 停止`、`Done: 完成`、`Risks and rollback: 风险与回滚` |
| `SPEC_DESIGN_HEADING_ALIASES`（新增） | — | `Code Anchors: 代码锚点`、`Interfaces and Failure Semantics: 接口与失败语义`、`Requirement-to-Task Trace: 需求到任务追踪`、`Global Verification Strategy: 全局验证策略` |
| `function canonicalHeading(heading, aliases)`（新增）+ `canonicalPhaseHeading` / `canonicalDesignHeading` | — | 把中文标题规范化回英文键 |
| `function markdownSections(document, level, prefix)` | `prefix` 只接受字符串 | 接受**字符串数组**：`const prefixes = (Array.isArray(prefix) ? prefix : [prefix]).filter(Boolean);` + `prefixes.some((item) => match[1].startsWith(item))`（字符串语义逐字节不变） |
| `phaseRows` | `markdownSections(document, 2, "Phase ")`，键取原文 | `markdownSections(document, 2, ["Phase ", "阶段 "])`，键取 `canonicalPhaseHeading(section.heading)` |
| `taskBlocks` | `/^##\s+(Phase\s+.+?)\s*$/` | `/^##\s+((?:Phase|阶段)\s+.+?)\s*$/` |
| `designBody` | 键取原文标题 | 键取 `canonicalDesignHeading(heading)`，使 `designBody["Code Anchors"]` 等下游查表对中文标题也成立 |
| `phaseDeclaredWritePaths` | `/**write set**/i` | `declaresField(line, "Write set")` |
| `templateVersion` | `/^\s*(?:-\s+)?\*\*Template version\*\*\s*[:：]…/mi` | 用 `labelAlternation("Template version")` 动态构造 |
| `phasePaths` | `\*\*(?:NEW\|MODIFY\|READ-ONLY CONSUMER)\*\*` / `\*\*(?:NEW\|MODIFY)\*\*` | 两处各追加 `新增\|修改\|只读消费者` / `新增\|修改` |
| `globalChangePaths` | `/^(?:NEW\|MODIFY)$/i` | `/^(?:NEW\|MODIFY\|新增\|修改)$/i` |
| `pointerPlanTaskRows` | `/^Phase\s+(P\d+)\b/i` | `/^(?:Phase\|阶段)\s+(P\d+)\b/i` |
| `executionIndexRows` 跳行正则 | `/^\s*\|\s*(?:---\|phase\s*\|)/i` | `/^\s*\|\s*(?:---\|phase\s*\|\|阶段\s*\|)/i`（**段标题早就双语**：`/^(?:Execution Index\|执行索引)$/i`；**行解析按位置** `cells[0..5]`，只有表头首列的字面 `phase` 是英文依赖） |
| `validatePostPhaseContract` 的 H1 检查 | `` `^#\s+Phase\s+${expectedId}\b` `` | `` `^#\s+(?:Phase\|阶段)\s+${expectedId}\b` `` |
| 依赖哨兵（4 处：`dependency === "none"`、`row.dependency === "none"` 及其两条取反） | 字面 `"none"` | `WITHOUT_PREDECESSOR.test(dependency ?? "")` |
| `parseConstitutionBinding` | 硬编码 `\*\*Constitution binding\*\*` | `labelAlternation("Constitution binding")` |
| Quick Read 非目标检查 | 硬编码 `/^\s*-\s+\*\*Non-goals\*\*\s*[:：]/mi` | `labelAlternation("Non-goals")`（**第二条件 `/来源\s*[:：]\|source\s*[:：]/i` 不变**） |
| Global Constraints 小节检查 | `/^Global Constraints$/i` | `labelAlternation("Global Constraints")` |
| `:7269` 风险交接小节 | `/^Engineering Risk Handoff$/i` | `/^(?:Engineering Risk Handoff\|工程风险交接)$/i` |
| `PLAN_SECTION_ALIASES` 的 `Technical Context` | `[/Technical Context/i]` | `[/Technical Context/i, /技术上下文/]`（**此前唯一缺中文的 plan 章节**） |

**实施纪律**：全部替换用 `python3` 逐条断言**命中数恰 1** 后才落盘；每次改完跑 `node --check`。

#### §14.10.3 `runtime/task/material-workspace.mjs` 的第二处索引解析器

`runtime/stage/stage-content-contracts.mjs` 不是唯一的索引解析器——`runtime/task/material-workspace.mjs` 里还有一份，**必须同批改**：

- `:15` `/^## Execution Index\s*$/` → `/^##\s+(?:Execution Index|执行索引)\s*$/`
- `:24` `const phaseColumn = header.findIndex((cell) => /^(?:phase|阶段)$/i.test(cell));`
- `:25` `const authorityColumn = header.findIndex((cell) => /^(?:authority ref|权威引用|权威来源)$/i.test(cell));`

**实测**：中文表头索引与英文表头索引都返回 `["phases/P1.md"]`。

#### §14.10.4 技能包 sha 链重算（**对既有用户裁决的显式推翻，不静默覆盖**）

- **原裁决**（本卡早先，用户逐字）：`sha_chain` = **A：本卡零哈希动作 + 把整条链挂给 CARD-06**。
- **冲突**：`skills/*/skill-bundle.json` 对技能包内每个文件逐文件记 `sha256` ⇒ 模板字节一变，链必然失效。用户 2026-09-28 的中文化指令与 sha_chain=A **不可兼得**。
- **本节处置：执行重算，并如实登记这次推翻。** 理由＝「模板中文化是用户的直接指令，哈希重算是它的机械后果；把链挂给 CARD-06 的原意是『本卡不主动碰哈希』，不是『本卡可以违反用户后来的直接指令』」。**不解释成「裁决不变」。**
- **失效点逐字**：`Error: bundle sha256 mismatch: templates/decision-log-template.md`，抛点在 `runtime/adapters/local-skill-resolver.mjs:110`（`if (entry.sha256 !== actual) throw new Error(`bundle sha256 mismatch: ${locator}`);`）。
- **`bundleHash` 算法**（`runtime/adapters/local-skill-resolver.mjs:117`）：`sha256(canonical(fileEntries.map(({path,sha256})=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path))))`。
- **只有 5 个技能包受影响**（`plan-template.md` 与 `tasks-template.md` **不在任何 `skill-bundle.json` 里**，改它们不动链）。重算后的 `local_bundle_hash`：

| 技能包 | 改动的模板文件 | 新 `local_bundle_hash` |
| --- | --- | --- |
| `skills/decision-log/skill-bundle.json` | `templates/decision-log-template.md` | `719bee2c51e672313a11da0ba2d966655f9cc3d58c3e03149bd98a5d3f3023d6` |
| `skills/spec-plan/skill-bundle.json` | `templates/phase-template.md` | `45f2afb4701988201b124d6ce36735d82e26e023bf87aa29f7706e2e57193e3f`（第一次重算值，**后被取代**：§14.13.7 第四次重算 = `fc654704`，见 `:3136`） |
| `skills/spec-prd/skill-bundle.json` | `templates/prd-template.md` | `b8dc6399917d54a24429144c5e160d268ba77493debaa5e9c74f94c966eff23c` |
| `skills/spec-specify/skill-bundle.json` | `templates/spec-template.md` | `630a125087f72143bb3a0e1d8e33b3cb25792dd9583060b535ac40ea9aeca72f` |
| `skills/spec-tasks/skill-bundle.json` | `templates/index-template.md` | `b98e23358d82d77acd35549382c479862999ff6f05cb8964b2eae5b12fe96ed5` |

`skills/catalog.yaml` 的 5 条 `local_bundle_hash` 已同步改写：`:130`（decision-log）、`:253`（spec-prd）、`:286`（spec-specify）、`:335`（spec-plan）、`:367`（spec-tasks）。`repo-skills.manifest.json` **不含 hash**，无需改。

#### §14.10.5 同步更新的 5 份契约测试

| 测试文件 | 改了什么 |
| --- | --- |
| `tests/contract/post-cohort-authoring-files.test.mjs` | ①`/Global spec.*spec\.md/i` → `/全局规格[\s\S]*spec\.md/`；②phase 模板字段列表 → `["L0","L1","L2","写入集","依赖","停止","RED/GREEN 门禁命令","判定器","覆盖上限","禁止改动"]`；③index 模板字段列表 → `["语义锚点","写入集","依赖","消费者"]`；④禁用词表追加中文对应（`门禁命令`/`预期退出码`/`判定器`/`证据路径`/`执行状态`） |
| `tests/contract/post-cohort-executable-authoring.test.mjs` | 四个 spec 设计标题、需求列表、卡内 12 字段、尾部 4 字段全部换中文；`first edit`→`第一处改动`、`same oracle ID`→`同一个判定器编号`、`next Phase continues the sequence`→`下一个 Phase 接续编号` |
| `tests/contract/spec-stage-artifact-closure.test.mjs`（`:73-77`、`:81`） | 断言放宽为中英双语正则：`/write set\|写集\|写入集/i`、`/DO NOT TOUCH\|禁改\|禁止改动\|不得改动/i`、`/gate_cmd\|门禁命令/`、`/oracle\|判定器/i`、`/STOP\|停止/`、`/semantic anchor\|语义锚点/i` |
| `tests/contract/spec-prd-skill-contract.test.mjs`（`:231`、`:322`） | `'结果与 consumer'` → `'结果与消费方'` |
| `tests/contract/filled-plan-task-production.test.mjs` | `renderPlanTemplate()` 的**全部英文字面替换锚点改中文**（`非目标`/`宪法绑定`/`## 实施顺序`/`依赖`/`并行工作`/`外部依赖`/`### 验证`/`### 任务`）；`globalFiles` 与 `phaseFiles` 两个常量改中文；`legacyPlan` 的删版本行正则 `/^- \*\*Template version\*\*[:：].*\n?/m` → `/^- \*\*模板版本\*\*[:：].*\n?/m`；`:213` 风险标记锚点 `### Risks and rollback` → `### 风险与回滚`；`:233` `/## Execution Index/` → `/## 执行索引/`；`:236` `/### Tasks\n\n- …/` → `/### 任务\n\n- …/` |

#### §14.10.6 验证（**只跑受影响的针对性测试**）

| 测试文件 | 结果 |
| --- | --- |
| `tests/contract/filled-plan-task-production.test.mjs` | **7/7 ✓** |
| `tests/contract/post-cohort-authoring-files.test.mjs` | **3/3 ✓** |
| `tests/contract/post-cohort-executable-authoring.test.mjs` | **4/4 ✓** |
| `tests/contract/spec-prd-skill-contract.test.mjs` | **13/13 ✓** |
| `tests/contract/spec-stage-artifact-closure.test.mjs` | **6/6 ✓** |
| `tests/decision-log-content-contract.test.mjs` | **4/4 ✓** |
| `tests/contract/stage-interaction-batching.test.mjs` | **12/12 ✓** |
| `tests/contract/material-workspace.test.mjs` | **21/21 ✓** |
| `tests/contract/decision-convergence-depth.test.mjs` | **12/12 ✓** |
| `tests/contract/post-phase-contract.test.mjs` | 1 ✗ —— **pre-existing**（`ENOENT …/specs/workflowhub-thin-core-card-05-20260919/phases/P5.md`，干净树同样红） |

**「这红是我造成的吗」的判定方法（可复用，本节已用它把责任分清）**：`git stash push -m … -- <只包含本次改过的 tracked 路径>`（**不加 `-u`**；**2026-09-29 复核更正**：原注「故 untracked 的 `specs/workflowhub-thin-core-card-03-20260919/` 与 `docs/adr/0034-*.md` 不受影响」不成立——两者现均已被 git 跟踪，不加 `-u` 不再自动把它们排除在 stash 之外）退回干净树跑测试，再 `git stash pop`。判定结果：

- **pre-existing（干净树同样红）**：`tests/stage-plan-task-contract-v3.test.mjs`（多出 `authenticated Phase review fact is unavailable`）；`tests/contract/post-phase-contract.test.mjs`；`tests/contract/stage-reflection-wiring.test.mjs`（`ENOENT …/specs/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md`）；`tests/integration/distribution-closure.test.mjs`（`skill closure is not closed: build-code: prompt references undeclared skill architect-code-review; verify-code: …`）。
- **本次造成的（干净树绿、改后红）**：**只有** `tests/contract/filled-plan-task-production.test.mjs` 一个文件，已修。
- **英文夹具的既有测试继续绿**（`tests/contract/post-phase-contract.test.mjs`、`tests/contract/material-workspace.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/contract/post-phase-official-handler.test.mjs` 等）⇒ **证明别名层是纯增量**。

**行为等价性抽验（中文化前后逐字相同）**：`analyzeDecisionOutline(decision-log-template.md)` 前后都是 `ok=false`、errors **14 条**，首两条仍是 `framework node background must reference an OI or declare empty: true` / `framework node problem must …`；`analyzeDecisionConvergence` 前后都是 `ok=false`、errors **5 条**。

**验证命令（不得跑全量）**：

```
node --check runtime/stage/stage-content-contracts.mjs
npx vitest run tests/contract/filled-plan-task-production.test.mjs tests/contract/post-cohort-authoring-files.test.mjs tests/contract/post-cohort-executable-authoring.test.mjs tests/contract/spec-prd-skill-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/decision-log-content-contract.test.mjs tests/contract/material-workspace.test.mjs tests/contract/decision-convergence-depth.test.mjs
```

**不得执行**：`npx vitest run`（全量 68.4 分钟，且既有红 219 条会淹没本次改动）。

#### §14.10.7 残留不确定（如实登记，不自行裁决）

1. ~~**phase 模板的重构方案尚未落盘**~~ → **2026-09-28 已落盘并闭合**：用户追加指令「phase 的模板比原来 plan 和 tasks 模板质量差距太大了」使 §14.7 行 43 的「追加 6 行」升级为整份重构（56 → 185 行），调研报告已回收并落地，见 §14.7 第 61–62 行与本文件 §14.12。**行 43 不再是未完成项。**
2. **`FIELD_LABEL_ALIASES` 是否穷尽**：本节按 `fieldValue` / `taskField` / `analyzeField` 的**全部调用点**（12 处）反推别名，未做「中文模板里出现的每个标签都有别名」的正向穷尽核对——有可能某个只在错误消息里出现、当前无解析器的标签未被覆盖。这个缺口不影响本次落地的 7 份模板（它们已实测解析通过）。
3. **`docs/standard-workflow.md` 与 `docs/quality/**` 里的英文模板或示例**未纳入本次中文化范围（用户只说「模板」，本节按 `skills/*/templates/` 解读）。若用户的原意包含文档内的示例片段，本节的范围需要用户重新裁定。
4. **中文化是否影响只读消费者**：本节只验证了 runtime 解析器与 5 份契约测试；**未验证**是否有其它只读脚本（如 `scripts/**`）按英文字面读取模板文本。影响面未取证。
5. **`spec-content.v3` 两个缺章节锚点**（`^1\.\s+问题与紧迫性$`、`^11\.\s+验收标准$`）与模板现有标题的不匹配是 pre-existing 缺口，**本节不改**（它不是中文化引入的，改它会改变 `validateSpecContentProfile` 的既有行为）。


---

### §14.11 审查面优化（I-17；2026-09-28 用户第四项指令）

#### §14.11.0 指令与来源

用户逐字（2026-09-28，第四次追加）：

> 「另外，我还希望优化build-spec和build-code的审查，基于这次发现的问题针对性的优化，避免下次出现类似的问题。审查的时候应该需要发现这些问题才对。」

**两份调研报告的耐久副本**（已从 `/tmp` 复制进本任务目录，避免 `/tmp` 被清理后失据）：

| 报告 | 耐久路径 | 规模 | 覆盖 |
| --- | --- | --- | --- |
| build-code 侧 | `specs/workflowhub-thin-core-card-03-20260919/attachments/R-review-code.md` | 519 行 / 70,461 B | §1 现有机制盘点（含 a–h 逐项对照表）／§2 每条该被哪一步抓住／§3 八条提案／§4 不做的事／§5 不确定项 |
| build-spec 侧 | `specs/workflowhub-thin-core-card-03-20260919/attachments/R-review-spec.md` | 301 行 / 49,946 B | 同上五节结构（§1 34 条机制盘点） |

其余四份取证报告亦同批归档：`attachments/A2-plan-gaps.md`（61 条计划缺口实例）、`A3b-volume.md`（体量与正式审查逐次清单）、`A5-doc-crosscheck.md`（112 条断言核对）。**`design.md` 此前正文里对 `/tmp/wh-card03-s926/…` 的引用一律以本表路径为准。**

> **一条必须登记的核对更正**：`R-review-spec.md` 的自述称「`skills/spec-plan/templates/phase-template.md:1` 实为英文 `# Phase P<n> — [outcome]`、`:38` 实为英文 `- **Observable seam**: …`」。**主会话实测该断言错误**——该报告读的是**主仓库** `/Users/Hugh/Hugh/Project/workflowhub/skills/spec-plan/templates/phase-template.md`（确为英文），而本卡 worktree 的同名文件**已是中文**：`:1` = `# Phase P<n> — [这一 Phase 的一个可独立验收的结果]`、`:38` = `- **可观察接缝**: [本 AC 对应的既有产出方、已持久化的产物、真实读取方/消费者、…]`（`md5 c8954cef85c9563319344205c810be6e`，`git status` 显示 ` M`）。⇒ **该报告 §3 P1/P2/P3 给出的 `phase-template.md` 锚点逐字文本不可直接使用**，位置（H1 之后 / `可观察接缝` 行 / `边界 / 禁止改动` 行）仍然有效；其 `workflows/build-spec/SKILL.md`、`skills/review/SKILL.md`、`skills/spec-analyze/SKILL.md`、`docs/standard-workflow.md` 的锚点不受影响（这四个文件在本卡未改）。

#### §14.11.1 现状判定：a–h 八类问题，两份报告一致认为**现状没有一条能独立抓住**

`a`–`h` 是 CARD-04 复盘列出的八类问题（见 `§14.0` 的同一套编号）。两份报告的判定合并如下：

| # | 问题 | build-spec 侧 | build-code 侧 | 最接近的既有条款（逐字锚点） |
| --- | --- | --- | --- | --- |
| a | 计划不能直接执行；一个 Phase 混装多个需分别验收/提交的结果 | 部分能 | 部分能 | `workflows/build-code/SKILL.md:93`（once for each Phase）、`:227`（one review）、`:231-232`（Do not re-review an unchanged change…）、`docs/standard-workflow.md:83`（build-code 每个 Phase 一次）；`skills/spec-plan/templates/phase-template.md` 的 H1 只是**填空** |
| b | 关键「需求 → 真实结果」链没走通；审查范围（subject）没被显式限定 | 部分能 | 部分能 | `skills/spec-plan/templates/phase-template.md` 的 `可观察接缝` 行；`runtime/review/review-record-route.mjs:492`（`subject: request.subject ?? null`）、`:623`（`subjectMatchesAttempt`）、`:654-660`（复用键不含「审了什么」） |
| c | 关键来源/消费者/外部前置条件/预写测试有效性**没在交接前核实**（「恰含 8 个字段」实际 9 个） | 部分能 | **无**，且有一处**反向授权**：`workflows/build-code/SKILL.md:76-78` 逐字 `Record the concrete material gap and continue safe code, task-fact, or quality-fact repair in the same task` |
| d | 部分预写「红测」是环境/夹具错误或本来就不是失败测试 | 部分能 | **无** | 反向授权：`workflows/build-code/SKILL.md:190-192` 逐字「`capture-evidence` 如可用，只把工作区文件收为 `quality/evidence`」——**「整棵工作树」在这个措辞下完全合法** |
| e | 用整份常变计划文件的哈希当稳定规则版本 | 部分能 | 部分 | `workflows/build-code/SKILL.md:326` 逐字 `It is bound to the current material revision, not the changing code snapshot.`；`AGENTS.md:72` 逐字「材料版本变化时读为 stale，代码快照变化本身不使它 stale」；`runtime/review/review-record-route.mjs:468-477` 对**整份 packet** 取哈希、`:672` 全等门控 |
| f | 同一 Phase 两次正式审查 + 大量非正式复核件 | 部分能 | 部分 | `docs/standard-workflow.md:83-86`、`workflows/build-spec/SKILL.md:94`（不为 clean 标签重复整轮审查）、`runtime/review/review-record-route.mjs:633`/`:672`/`:1279`（机器复用）；**没有任何一句**禁止「当前 Phase 未收尾就开工下一个」或「并发修订多个 `phases/P<n>.md`」 |
| g | 证据无限膨胀（三份整树快照 5,576 文件 / 143 MB） | 部分能 | **无** | 只有「必须保留」没有「禁止新增」：`AGENTS.md:53`；`runtime/review/review-input-bounds.mjs:5-6` 逐字 `Provider capability, rather than a local byte ceiling, decides whether delivery is possible.`、`:21` 逐字 `no longer rewrites or rejects material by local size` |
| h | 耗时/token 没有分项可见性，无法及早分清「计划缺口」还是「实现 bug」 | **不能** | 部分 | `docs/standard-workflow.md:90-92` 逐字「时间和 token 只作诊断，按 **step**、skill、读取、交互、provider wait、测试、review、返工和用户等待拆分；不可得就写 `unavailable`，不设统一预算 gate」；`workflows/build-spec/SKILL.md:109-123` 逐字 `without token-budget or cost claims` |

**分布**：build-spec 侧 = 能 **0** / 部分能 **7**（a,b,c,d,e,f,g）/ 不能 **1**（h）；build-code 侧 = 无（c,d,g 完全无条款，其余为「部分」或「有但形态偏弱」）。

**两句话总因（两份报告独立得出同一结论）**：

1. **build-spec 侧**：不是「没有条款」，而是**条款全在作者自己的上下文里，交接前没有任何一个独立、必须回答的动作**。
2. **build-code 侧**：问题全部落在「**第 1 步定范围、第 8 步派审查、第 9 步处置、第 7 步收尾**」四个位置缺少「必须回答的问题」，**而不是缺机器能力**；机器侧反而有三处**反向许可**——`material_id` 字节全等门控（导致重派）、`control` 层默认 `integration`（导致范围过宽，`runtime/review/review-record-route.mjs:351-353` 的 `defaultSharedReviewTuple` 在未显式声明三者时静默落到「整棵树 integration」）、`compactReviewDiff` 不做体积约束（导致证据膨胀）。

#### §14.11.2 build-code 侧八条提案（全文见 `attachments/R-review-code.md` §3，`:208-426`）

八条全部是「给执行者看的检查清单/必须回答的问题」，**不新增 stage、gate、状态机、schema 字段或机器判定**，逐条自带「本条是执行纪律，不是新的 stage、gate 或质量结论」（照 `AGENTS.md` 的 `### 测试硬规则` 写法）。全部落在已有文件的已有锚点上，**不新建文件**。改动集中在 `workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`docs/standard-workflow.md`、`AGENTS.md` 四个文件。

| 编号 | 覆盖 | 落点（文件 → 锚点逐字首句） | 内容一句话 |
| --- | --- | --- | --- |
| P1 | a + b | `workflows/build-code/SKILL.md` → `## Work loop` 第 5 条（`5. Use the review dependency declared in \`skill-deps.yaml\` directly for one`） | 派发前先回答**审什么 / 审过了吗 / 要不要再派**三问并把答案写进 task facts；`subject` 不许留空，`review_scope`/`subject_kind`/`phase_id` 三者必须成组显式声明；**修 finding 造成的材料字节变化不是重派理由** |
| P2 | c | `workflows/build-code/SKILL.md` → `## 统一回退协议` 段末新增子段（锚点 `五个正式 stage 共用 \`runtime/stage/stage-content-contracts.mjs\` 的`） | **计划缺口的集中退回**（五条）：先列全再退回／只退回一次（post→`spec-clarify`，pre→`build-spec`/`build-plan`，方向性→`make-decision`）／退回期间受影响部分标 `blocked_by_plan_gap` **停手不猜着实现**／第二次缺口并入第一份清单／确需先做一点时先写理由与代价 |
| P3 | d | `docs/standard-workflow.md` → `### review、测试和成本` 之后新增子段；同时 `AGENTS.md` → 紧接 `### 测试硬规则（本任务后续执行）` 之后新增 `### 证据硬规则（本任务后续执行）` | **证据只留原始件**：原始测试输出每命令一份／正式回执一次派发一份不镜像到 `quality/evidence/`／review 原件保原始字节与 ref/hash／**禁止整棵树或整目录快照（目录快照、整树 tar、`git archive` 产物、文件树清单）**／说明性文字不入证据目录 |
| P4 | e | `workflows/build-code/SKILL.md` → `## Work loop` 第 1 条（`1. Read current cohort materials and the physical Phase authority, then select`） | Phase Card 里加两行**版本锚**：`规则锚`（文件 + 章节标题逐字，或 FR/AC 编号 + 该段首句逐字；**不写整份文件哈希**）与 `材料变更影响`（本 Phase 预计会改哪些段落；不改的段落不在审查与实现范围内） |
| P5 | f | `docs/standard-workflow.md` → `### 每个 phase 的标准循环`；同时 `workflows/build-code/SKILL.md` 第 7 条 handoff 末尾补一句 | **一次只推进一个 Phase**；`[P]` 只授权**同一 Phase 内**并行，不授权跨 Phase 并行推进；提前动下一个 Phase 须先写「为什么必须现在动」与代价 |
| P6 | g | `workflows/build-code/SKILL.md` → `## Work loop` 第 7 条 handoff 清单末尾；同时 `docs/standard-workflow.md` 的 `:90-92`（锚点 `时间和 token 只作诊断，按 **step**、…`） | handoff 加一行**本 Phase 成本**（改了几次实现／跑了几次 focused 测试／发起过几次正式审查含 `unavailable`／等 provider 多久／改过几次材料／总时长），写不出写 `unavailable`；规范侧把诊断粒度补成「`build-code` 还要额外**按 Phase** 记一行同类数据」 |
| P7 | h | `workflows/build-code/steps.json` → step 9 `analyze-review-findings` 的 `observable_result`（锚点 `"observable_result": "Every review finding has a disposition in current task facts;`）；同时 `workflows/build-code/SKILL.md` 第 6 条 | 定向复测**先列集合、再跑、再回填**：修复前先写下受影响的测试集合（文件/用例名），只跑这一集合，把每条 exit code 与结果写进对应 finding 的处置；**不得用全量回归代替定向复测** |
| P8 | a（规范侧） | `docs/standard-workflow.md` → `### review、测试和成本` | **Phase 一次审查合同**：「同一范围」由 `phase_id` + 该 Phase 的 allowed files/symbols + 覆盖的 AC 列表共同定义，由执行者在发起前写清；**修 finding 造成的材料字节变化不是重派理由**；`AC-REVIEW-011` 的替代调用不产生第二份正式回执 |

**覆盖检查（原报告逐字）**：a→P1+P8；b→P1；c→P2；d→P3；e→P4；f→P5；g→P6；h→P7。**零新增文件、零新增 step、零新增 schema 字段、零新增门禁。**

#### §14.11.3 build-spec 侧八条提案（全文见 `attachments/R-review-spec.md` §3，`:98-268`）

| 编号 | 覆盖 | 落点（文件 → 锚点逐字文本） | 内容一句话 |
| --- | --- | --- | --- |
| P1 | a | `skills/spec-plan/templates/phase-template.md` → H1 之后、`- **全局规格**:` 行之前 | **Phase 独立验收三问**：①这一个 Phase 交付的是**一个**结果吗（写成一句能判真假的话）②谁来判它真假（哪条 AC 的哪个判定器、用哪份真实产出）③它能独立提交吗；**判定规则：H1 里出现一个「并且」连接的两个交付物，或「同时/以及/顺便」引出的第二件事，就已经是两个结果，必须拆** |
| P2 | b（主）+ c | `skills/spec-plan/templates/phase-template.md` → 替换 `可观察接缝` 整行 | 可观察接缝必须留下**核实三元组**（已有产出方 → 已持久化产物 → 真实读取方/消费者；来源分母；缺失/非法语义），三项都要写「我是怎么知道的」（至少一项 `文件路径:行号` 或 `实际命令 + 退出码`）；**只写「将来如何观察效果」不算接缝**；接缝不存在就写 `unverified`/`unknown` 并把 AC 标未完成 + owner + 下次核实动作 |
| P3 | c | `skills/spec-plan/SKILL.md` → `No directory-wide or glob write set is valid.` 之后 | **受保护文件与外部前置条件：断言必须来自实读**——字段个数、必填项、版本项这类断言只能来自实读，上游摘要是线索不是证据；留实读那一刻的路径、逐字清单、命令/工具、日期；不一致先改断言；本轮无法实读写 `unknown` + owner |
| P4 | d | `skills/plan-eng-review/SKILL.md` 第 6 条之后追加 `6a`（锚点 `   suite commands.`）；`skills/spec-plan/SKILL.md` 第 26 段（锚点 `RED is valid only when the named target assertion fails, not setup/environment/configuration; a planned command or unrelated nonzero is not RED.`） | **预写红测必须写归因**：目标行为失败 / 夹具或环境失败（**不是 RED，只能记 `unavailable`**）/ 本来就通过（不是红测）。「三类分不清时按 `unavailable` 处理。禁止把『命令返回非零』当作 RED。」 |
| P5 | e | `workflows/build-spec/SKILL.md` → `规格审查与 AC 文本都不替代执行证据。` 之后 | **稳定版本锚**：稳定规则/接口契约/判定器的版本锚只能指向那段规则本身（文件 + 小节标题或显式 anchor；需哈希时哈希算在那段文本上）；**不得用整份计划文件、流水账或综合文档的全文哈希**充当一条稳定规则的版本。自检标准：只动与这条规则无关的段落时，这条规则的版本应当不变 |
| P6 | f + g | `docs/standard-workflow.md` → `### review、测试和成本` 小节末（锚点 `review preflight 只记录当前请求的可观测事实，不改变 provider status 的运行时所有权。`）；`workflows/build-spec/SKILL.md:79` 段末（锚点 `也不为 clean 标签重复整轮审查。`） | **复核件纪律**：同一主题同一阶段内只保留**一份**复核件；第二次及以后**不另起新文件**，在原件尾部追加一节「本次相对上次新增的事实」并写清触发这次复核的真实变化；无真实主题变化则不写复核件；**禁止把整棵工作树/整个目录/同一材料的多个副本当复核材料或证据反复复制** |
| P7 | h | `docs/standard-workflow.md` → `### stage 结束` 六项摘要第 2 项之后（锚点 `2. 本 stage 负责的需求/实现/代码风险覆盖到什么程度；`） | 摘要的第 2 项和第 5 项**必须逐条标明归属**：这条风险是**本阶段现在就能修的计划缺口**，还是**实现尚未开始的未知**；两类不得混写成一句「还有风险」；每条给一条真实证据引用，没有写 `unavailable` |
| P8 | a–h（兜底） | `workflows/build-spec/SKILL.md` → `## 阶段末遗漏披露` 小节最后一段之后（锚点 `若没有 stage outcome，也必须明确披露“outcome 缺失”；这不是“跳过”，而是当前事实 unavailable。`） | **交接前可执行性自问八条**（逐条写答案，答不上来写 `unavailable` + owner）：①每个 Phase 是一个可独立验收、可独立提交的结果吗②每条关键 AC 的真实入口/消费者/独立判据指名了吗③受保护文件与预写测试的断言是实读来的还是推断来的④每条预写红测是因目标行为失败、夹具/环境失败还是本来就通过⑤有没有用整份常变文件的哈希当稳定规则版本⑥同一主题复核件有没有重复保留、复核材料有没有整目录复制⑦跨 Phase 的写入集与消费者顺序走一遍能连上吗⑧哪些风险是计划缺口、哪些是实现未知。**任何一条答「不能确定」就写进阶段末遗漏披露** |

#### §14.11.4 与 §14 既有条目（I-1 … I-15）的去重映射

本节与 `§14.2`／`§14.3`／`§14.5` **有实质重叠**。下表按「**重复**（既有条目已覆盖，不再新增）／**部分重叠**（既有条目覆盖了一部分，提案补足了落点或形态）／**全新**（§14 没写过）」三档逐条判定。**这张表是本节最需要被用户或设计负责人复核的部分**（判据是 §14.7 施工表 43–52 行的一行摘要，未逐字比对 §14.2/§14.3 正文）。

| 提案 | 判定 | 与 §14 的关系 |
| --- | --- | --- |
| build-code P1（审查三问 + `subject` 显式） | **部分重叠** | §14.7 行 46（I-8）只要求「`unavailable` 也算一次尝试」；`§14.6` 冲突 3 把「同三元组已有 semantic attempt 则不再派发」**挂 CARD-05**。P1 新增的是「派发前必须写 `subject` 与旧回执清单」这个**动作** |
| build-code P2（计划缺口集中一次退回） | **全新** | §14 的 I-6 只说「一次只推进一个 Phase」，I-2/I-15 说「交接前可执行性核查」，**都没有「发现缺口时停机成组退回」**。这是本节**最重要的一条新提案**（它针对的正是 CARD-04 的主因「把真实缺口变成漫长的现场设计」） |
| build-code P3（证据只留原始件） | **重复** | §14.7 行 47（I-13）已写「证据只留原件与指针／不得把整棵树当证据／同三元组已有 semantic 结果则复用」。⇒ **不重复落盘**；若采纳，只需把 P3 的 `AGENTS.md` 落点合并进行 47 的同一批 |
| build-code P4（规则锚写进 Phase Card） | **部分重叠** | §14 的意图是「缩小规则版本绑定范围」，**未指定落点是 Phase Card 的两行**。P4 把它落成了可填的字段 |
| build-code P5（一次只推进一个 Phase） | **重复** | §14.7 行 45（I-6）已写「一次只推进一个 Phase；提前开第二个 Phase 记为事实」 |
| build-code P6（Phase 成本行） | **部分重叠** | §14.7 行 48（I-11）已写「诊断维度加『按 Phase』切分」；行 51 落点 `runtime/stage/stage-handlers.mjs#completionReview`（原记 `:280-281`，现 `:294-295`） 的 `duration_ms`/`tokens`。P6 新增的是**三个具体计数**（宣告次数、审查派发次数、材料修订次数）与 handoff 落点 |
| build-code P7（定向复测先列集合） | **重复** | §14.7 行 52 的 I-9 已写「只跑受影响测试」的纪律；P7 补的只是「先交集合、再跑、再回填」的**形态**（可并入行 52 同批） |
| build-code P8（Phase 一次审查合同·规范侧） | **全新** | 与 P1 同源但落在 `docs/standard-workflow.md`；§14 未写过「同一范围」的定义方式 |
| build-spec P1（Phase 独立验收三问） | **重复** | §14.7 行 43（I-1）已写「标题＝一个可独立验收的功能结果」+ 6 行追加。**行 43 的 6 行内容已随整份重构落盘**（`skills/spec-plan/templates/phase-template.md`，§14.12；**2026-09-29 一致性复核更正**），该行的落地形态已因用户对 phase 模板质量的追加指令升级为整份重构（见 §14.10.7 未决项 1） |
| build-spec P2（可观察接缝核实三元组） | **重复** | §14.7 行 44（I-2）已写「`Consumer`/`Observable seam` 里的真实路径与符号必须存在」 |
| build-spec P3（受保护文件实读条款） | **部分重叠** | 行 44 是「交接前逐字段核对」，P3 是「断言必须来自实读 + 留下实读记录（路径:行号 / 命令+退出码）」。**留实读记录**这一形态是新增的 |
| build-spec P4（预写红测归因三问） | **部分重叠（需核）** | §14.5 的 I-7 把 A2 的 61 条缺口归成 A/B/C/D/E 五类（39/61 条），其中是否已含「预写红测无效」**本节未逐条映射**。⇒ 若 I-7 五类已覆盖，则本条为重复；否则为全新 |
| build-spec P5（稳定版本锚） | **全新** | §14.6 冲突 2 只把 `docs/quality/business-case-catalog.json` 的 `source.revision` 改稳定锚点**挂 CARD-06/CARD-04**；§14 正文没有「计划作者不得用整份常变文件哈希当稳定规则版本」这条纪律 |
| build-spec P6（复核件纪律） | **全新** | §14.7 行 47 管的是**证据**（原件与指针），不管**复核件（review/复盘文档）的形态与保留**。两条不重复 |
| build-spec P7（计划缺口 vs 实现未知） | **全新** | §14 未写过阶段末摘要的归属标注 |
| build-spec P8（交接前可执行性自问八条） | **重复** | §14.7 行 50（I-15）已写「交接前可执行性核查＝完成条件（事实记录，非推进前置）」。P8 补的是**八条具体问句**，可作为行 50 的正文 |

**汇总**：**全新 5 条**（build-code P2、P8；build-spec P5、P6、P7）、**部分重叠 4 条**（build-code P1、P4、P6；build-spec P3）、**重复 6 条**（build-code P3、P5、P7；build-spec P1、P2、P8）、**待核 1 条**（build-spec P4）。

#### §14.11.5 落地纪律与明确不做的事

**落地纪律**（照 `§14.10.0` 的三条边界推广）：

1. 只写**人类纪律/条款**，**不得新增 stage、gate、状态机、schema 字段或机器判定**；每条末尾一律照 `AGENTS.md` 的写法加同一句「本条是执行纪律，不是新的 stage、gate 或质量结论」。
2. 优先落在**已有文件的已有锚点**上，**不新建文件**。
3. 与 `§14.7` 施工表 43–52 行**同落点的提案合并成同一批**落盘，不产生两份并行条款。
4. **不得跑全量回归**；只跑受影响的针对性测试。

**两份报告共同明确的「不做」（原报告 §4 已列，此处只登记两份都点到的硬边界）**：

- **不改机器契约**：不把 `runtime/review/review-record-route.mjs:351-353` 里 build-code 的默认 tuple 从 `integration` 改成 `phase`；不改 `:672` 的 `material_id` 全等门控（`D-007` 要求「材料变了绝不回读旧审查」，改它等于改机器契约）。
- **不给 build-spec 加 track/scope/审查次数旋钮**（`runtime/review/review-policy.mjs:46-53`：build-spec 传 track/scope 会**抛错**）。
- **不改 `skills/review/SKILL.md` 的 finding 字段与输出形状**（`:20-25` 只允许 8 个 provider 字段、`:29` 只允许一个 JSON 对象 ⇒ 相关提案只加散文）。
- **不改 `skills/spec-analyze/*` 的职责边界**（`:91-94` 明文把行为强度判断弃权给 merged review，这是刻意设计）。
- **不给次数/字节/文件数设上限**（`runtime/review/review-input-bounds.mjs:5-6`、`:21` 明文「体积由 provider 能力决定，本地不做拒绝」）。
- **不把契约测试的存在性断言升级成语义断言**。
- **不改 phase 模板的字段名与字段集合**（本批提案只加人读文字，不改标签）。
- **不把提案写成阻断**（引 `AGENTS.md` 的「不是新的 stage、gate 或质量结论」形态）。

#### §14.11.6 残留不确定（如实登记，不自行裁决）

1. **`§14.11.4` 的去重判定只比对到 §14.7 的一行摘要**，未逐字比对 `§14.2`/`§14.3`/`§14.5` 正文。**「重复」的 6 条是否真的一条不差地被覆盖，需要设计负责人复核。**
2. **`R-review-spec.md` §3 P1/P2/P3 的 `phase-template.md` 锚点是错的**（它读的是主仓库英文版，见 §14.11.0 的核对更正）。位置可用，逐字文本必须换成中文版；**并且 P1/P2 与「phase 模板整份重构」这件事本身冲突**——重构后 H1 与 `可观察接缝` 行的位置会变。⇒ **P1/P2 应并入重构提案一起落盘，不单独施工。**
3. **`review-frozen-spec` 与 `skills/review/SKILL.md` 的对应关系是报告作者的推断**（未读运行时派发代码）。若实际检查表另有其文，P4 的 `6a` 应改挂。
4. **CARD-04 是 pre 还是 post cohort 未核实**。若是 pre，P1–P4 的落点从 `skills/spec-plan/**` 改回 `workflows/build-spec/**` 的规格段，**条款文字不变**（原报告自述）。
5. **`R-review-spec.md` §3 P2/P3 与 `workflows/build-spec/SKILL.md:270-280` 的「不把实现文件清单/代码符号写进 `spec.md`」有张力**：报告把实读记录放在 Phase 卡与检查表、没要求写进 `spec.md`，但**这条边界需要人来裁**。
6. **本节尚未落盘任何提案**（只完成了登记）。落地前需要用户对 `§14.11.4` 的 5 条新提案是否采纳作出裁决；**本卡内的落点与 §14.7 施工表 43–52 行的合并方式也应一并裁定**。

---

### §14.12 phase 模板质量升级（I-18）

#### §14.12.0 授权与来源

用户 2026-09-28 逐字（本会话 m02107）：「**怎么一直执行失败啊，请继续，之前说的模板的修改、审查的修改都要记录。还有现在phase的模板比原来plan和tasks模板质量差距太大了，结构化、可阅读性、内容丰富程度都差的很远，需要仔细调研分析**」。

⇒ 本条落地的是**第三句**（phase 模板质量）。前两句（继续推进、模板与审查的修改都要记录）分别由 §14.10 与本条、§14.11 承担。

只读子代理 `db382049-18af-49b2-a760-f8b8857353ef` 产出 `/tmp/wh-card03-s926/R-phase-template.md`（932 行 / 83,875 B）。**耐久副本：`specs/workflowhub-thin-core-card-03-20260919/attachments/R-phase-template.md`**（本卡 worktree 内）。规模：§1 现状诊断 26 条（D1–D26）｜§2 硬约束 38 条（A 17 + B 6 + C 15）｜§3 提案含 185 行可直接落盘草案｜§4 风险 10 条 + 不做 8 条｜§5 不确定项 10 条。

#### §14.12.1 诊断结论：差距是结构性的，不是文笔问题

| 维度 | 旧 `phase-template.md` | 对标 `plan-template.md` |
| --- | --- | --- |
| 行数 | 56 | 257 |
| 表格数 | **0** | 5 |
| 正文说明行数 | 3（旧 `:50-52`） | 每个字段都带 `[填写：…]` 说明与量化下界 |
| 速读区 | 无 | `## 速读卡`（旧 `plan-template.md` `:17-24`） |
| 字段说明表 | 无 | `## 测试策略` 表（旧 `:132-144`） |
| 示例卡 | 无 | 无（phase 侧补上） |

**最重的一条（本小节的核心事实）**：旧模板**漏了 runtime 已在逐字读取的 5 个文件级字段** —— `gate_cmd`、`oracle`、`evidence_path`、`STOP`、`Done`（`runtime/stage/stage-content-contracts.mjs#validatePostPhaseContract`（原记 `:7089-7094`） 的 `fieldValue(body, …)` 与 `:7097-7099` 的三项存在性检查）。

**真实作者的证据**：`specs/archive/workflowhub-thin-core-card-05-20260919/phases/P1.md:3-11` 自己把这 5 个字段补上了；同一文件 `:56-67` 还自造了一张 `FN1`–`FN6` 真值冻结表。⇒ **模板没有槽位，作者就即兴发明** —— 这正是「计划不可直接执行」的一种形态。

#### §14.12.2 已落盘：`skills/spec-plan/templates/phase-template.md` 56 → **195 行**（185 行草案＋bs P1/P2 并入 10 行）

> **2026-09-28 二次修订后为 217 行**（用户当面新指令的落差调研与修改，纯增量 22 行、机器字段标签未动）：详见 §14.15。

`write` 覆盖，来源＝`attachments/R-phase-template.md` 的 `§3.2`（报告 `:657-841` 的代码块）。**机器字段标签一个未改**（全部沿用 §14.10 已中文化的别名），新增的是**三层人读结构**：

1. **文件顶部使用说明引用块**（6 条）：只写实现增量、不写执行状态、卡片区是机器逐字检查区、占位符会被拒收、5 个字段名保持英文、落盘时把 `P<n>` 换成真实编号。
2. **`## 速读卡`**（7 条）：本 Phase 结果 / 非目标 / 改动前 / 改动后 / 与相邻 Phase 的边界 / 主要风险 / 下一步。
3. **`### 字段说明` 表**（38 行）：逐字段给「位置 / 字段 / runtime 规范名 / 机器必填 / 写作下限」。**runtime 不解析本节，也不产生任何质量结论**（表内首段逐字声明）。
4. **`#### 示例`**：一张填满的 `T001` 卡（`attachments/R-phase-template.md` 报告 `:813-833`），显式标注「只示范结构；内容与你的仓库无关，照抄形状、不要照抄文字」。

**新增 5 个文件级字段槽位**：新增 `## Phase 契约头（文件级字段；runtime 逐字读取）` 段，承载 `全局规格` / `写入集` / `依赖` / `消费者` / `gate_cmd` / `oracle` / `evidence_path` / `STOP` / `Done` 九项。

**实测（子代理 A16 探针，主会话复核）**：裸 `[` 占位符是被拒收的——未填写 0/17 失败、把 `[` 换成 `（` 模拟填写后 17/17 通过 ⇒ **裸 `[` 是刻意的漏填安全网，保留**。

#### §14.12.3 附带修复：三处 runtime 语义正则的英文单语（**这是中文化引入的回归，不是新功能**）

中文化之前，作者在 `Files / symbols` 里写 `symbol` 即可通过；中文化之后写「符号」会被拒收。三处（`runtime/stage/stage-content-contracts.mjs`，python3 逐条断言命中数恰 1，`node --check` SYNTAX OK）：

| 行 | 原 | 改 | 后果（若不改） |
| --- | --- | --- | --- |
| `:7132` | `/\b(?:symbol\|N\/A\s+[—-]\s+\S)/i` | `/(?:\bsymbol\|符号\|N\/A\s+[—-]\s+\S)/i` | 中文卡若只列路径不写 `N/A — 理由`，报 `Files / symbols must name a symbol or explain N/A for non-code files` |
| `:7147` | `/(?:`[^`]+\`\|\bP\d+\b\|\bT\d+\b\|\bnone\b)/i` | 追加 `\|无` | 卡内 `依赖: 无`（不带反引号）报 `Dependency must identify an existing prerequisite or none` |
| `:7160` | `!/\bnone\b/i.test(card.dependency)` | `!WITHOUT_PREDECESSOR.test(card.dependency)` | 同上，末尾循环再报一次 `dependency must be none or identify a Phase/Task` |

`WITHOUT_PREDECESSOR` 是 §14.10.2 已引入的 `Object.freeze` 常量 `/^(?:none\|无\|无前序\|无依赖)$/i`。

#### §14.12.4 sha 链第二次重算

`templates/phase-template.md` 字节变化 ⇒ 机械失效。仅 `skills/spec-plan` 一个包受影响：

| 文件 | 字段 | 新值 |
| --- | --- | --- |
| `skills/spec-plan/skill-bundle.json` | `files[1].sha256` | 由 `bd9629a1…` 重算为新模板摘要 |
| `skills/spec-plan/skill-bundle.json` | `local_bundle_hash` | `45f2afb4701988201b124d6ce36735d82e26e023bf87aa29f7706e2e57193e3f` → **`ed8a2d15cdb99e0bef0d6a2fc26612e57d65f2d6a41bf761dc16c30ae0541d8a`**（此值亦已被取代：§14.13.7 = `fc654704`，见 `:3136`） |
| `skills/catalog.yaml:335` | `local_bundle_hash` | 同上同步 |

其余 4 包值不变（本次未改它们的字节）：`decision-log` `719bee2c…`、`spec-prd` `b8dc6399…`、`spec-specify` `630a1250…`、`spec-tasks` `b98e2335…`。**这是对 sha_chain=A 的第二次显式推翻**，理由同 §14.10.4（用户直接指令的机械后果）。

**一处返工（如实登记）**：第一轮重写 `skill-bundle.json` 时用 `json.dumps` 默认紧凑格式，把 5 份文件的排版整体压平（`git diff --stat` 出现 15–29 行的噪声）；已改为「取 `git show HEAD:` 原文、只替换变化的 sha256 字面」⇒ 每份文件 `git diff` 恢复为 **2 行（仅 hash 行）**。`spec-specify/skill-bundle.json` 的 `files[]` 原本是紧凑单行对象风格，手工重排时一度写出**非法 JSON**（`json.decoder.JSONDecodeError: Expecting ',' delimiter: line 16 column 1`），同法修回。

#### §14.12.5 验证

| 测试 | 结果 |
| --- | --- |
| `tests/contract/post-cohort-authoring-files.test.mjs` | 3 ✓ |
| `tests/contract/post-cohort-executable-authoring.test.mjs` | 4 ✓ |
| `tests/contract/spec-stage-artifact-closure.test.mjs` | 6 ✓（sha 链回写后由红转绿） |
| `tests/contract/filled-plan-task-production.test.mjs` | 7 ✓ |
| `tests/contract/spec-prd-skill-contract.test.mjs` | 13 ✓ |
| `tests/decision-log-content-contract.test.mjs` | 4 ✓ |
| `tests/contract/stage-skill-invocation-contract.test.mjs` | ✓（唯一调用 `resolveStageSkillPackages` 的测试，sha 链的活体校验） |

合计 **37+ ✓ / 0 ✗**。

#### §14.12.6 两条必须登记的既有定距约束

1. **`tests/contract/material-producer-consumer-roundtrip.test.mjs:17-19`** —— 变量名 `phaseTemplate` **但读的是 `skills/spec-plan/templates/plan-template.md`**（`:10`），要求 `/L0[\s\S]{0,120}(?:Goal|目标)/i`、`/L1[\s\S]{0,120}(?:contract|契约)/i`、`/L2[\s\S]{0,120}(?:reference|参考)/i`。新模板实测 **`目标` 距 `L0` 约 47 字符**（旧模板 110、余量只剩 10）⇒ **余量由 10 扩大到约 73**。本卡早先 §3.x 的结论「不得在 `## L0` 与首个 `Goal`/`目标` 之间插入任何字符」**仍成立，但不再是紧约束**。
2. **`tests/contract/post-cohort-authoring-files.test.mjs:20-21`** 的 `not.toContain("plan.md")` / `not.toContain("tasks.md")` 对新模板逐字核查通过（新模板只提 `spec.md`）。

#### §14.12.7 一条 pre-existing 红（**经 stash 差分实测，与本卡无关**）

`tests/contract/material-producer-consumer-roundtrip.test.mjs` 的唯一一条断言 ``expect(`${phaseSkill}\n${phaseTemplate}`).toMatch(/single phase engineering authority|单一 phase 工程权威/i)`` 失败。**实测**：把 `skills/spec-plan/templates/plan-template.md`、`skills/spec-plan/templates/phase-template.md`、`skills/spec-plan/skill-bundle.json` 三份全部 `git stash push` 回 HEAD 后照样 `1 failed`；且 `git show HEAD:skills/spec-plan/SKILL.md` 与 HEAD 的 `plan-template.md` 对该短语的命中数均为 **0**。⇒ 该断言要求的字面从未存在，**pre-existing 红**，不在本卡写面内。

#### §14.12.8 残留不确定

1. 子代理只读了 **1 份**真实 Phase 样例，且属 `specs/archive/`（报告 §5 U5）。活跃任务里的真实 Phase 文件未纳入诊断。
2. `runtime/stage/stage-content-contracts.mjs#validatePostPhaseContract`（原记 `:7120`） 之后是否还有别的 Phase 校验未逐行读完（报告 §5 U6）。本节新补的三处正则来自主会话对该函数全文通读，但**未做逐字段的穷尽扫描**。
3. `PHASE_FIELDS` 的消费点未读到（报告 §5 U3）。
4. 报告 §5 U1 的疑虑（「字段级英文名命中数为 0，契约是否走别名层」）**已由主会话解决**：`fieldValue` 使用 §14.10.2 引入的 `labelAlternation`，中英双名均可解析；§14.10.2 的 `FIELD_LABEL_ALIASES` 已覆盖全部 17 个卡内字段与 9 个文件级字段。
5. 草案里的 `# Phase P<n>` 落盘时必须换成真实编号（模板期本来就不命中 A5 的 H1 校验），已写进使用说明第 6 条；**但没有任何机制阻止作者忘记替换** —— 这是一个刻意的选择（模板期不该命中），代价与 §14.11 的其他「人类纪律」条款一致。
6. 子代理**未跑任何仓库测试**（报告 §5 U7）；§14.12.5 的验证全部由主会话补做。


### §14.13 审查面 16 条提案的落盘（I-17 落地；2026-09-28 用户裁决「现在全落」）

#### §14.13.0 授权与口径

用户 2026-09-28 在选项题中裁决（逐字）：**「现在全落，碰撞按「时间错开」登记（推荐）」**。⇒ §14.11.2 的 build-code 侧 8 条与 §14.11.3 的 build-spec 侧 8 条**全部落盘**；落点与 CARD-04 写面的重叠按 ADR-0034 的「写面碰撞由时间错开消解」登记（见 §14.13.4）。

本节只登记**落盘结果**；提案的判定（a–h 现状）、每条提案的内容与去重映射见 §14.11。施工表新增行见 §14.7 的 63–67。

#### §14.13.1 落点总表（22 个插入点，措辞改动 0 处）

**build-spec 侧（`attachments/R-review-spec.md` §3，10 个插入点）**

| 提案 | 文件 | 现落点 | 落法 |
| --- | --- | --- | --- |
| P1 | `skills/spec-plan/templates/phase-template.md` | `:3`（H1 之后、使用说明引用块之前） | 主会话落 |
| P2 | 同上 | `:153`（可观察接缝字段行）、`:129`（字段说明表该行）、`:177`（示例行） | 主会话落 |
| P3 | `skills/spec-plan/SKILL.md` | `:22` | 子代理落 |
| P4a | `skills/plan-eng-review/SKILL.md` | `:40-44`（第 6 条之后新增 6a 三问） | 子代理落 |
| P4b | `skills/spec-plan/SKILL.md` | `:30`（RED 归因句） | 子代理落 |
| P5 | `workflows/build-spec/SKILL.md` | `:90` | 子代理落 |
| P6a | `docs/standard-workflow.md` | `:96`（复核件纪律段） | 子代理落 |
| P6b | `workflows/build-spec/SKILL.md` | `:96-98` | 子代理落 |
| P7 | `docs/standard-workflow.md` | `:140`（六项摘要列表之后） | 主会话落（见 §14.13.3） |
| P8 | `workflows/build-spec/SKILL.md` | `:54-66`（交接前可执行性自问八条） | 子代理落 |

**build-code 侧（`attachments/R-review-code.md` §3，12 个插入点）**

| 提案 | 文件 | 现落点 | 落法 |
| --- | --- | --- | --- |
| P1 | `workflows/build-code/SKILL.md` | `:263-273`（work loop 第 5 条末尾，3 空格缩进） | 子代理落 |
| P2 | `workflows/build-code/SKILL.md` | `:16-32`（新增 `### 计划缺口的集中退回`） | 子代理落 |
| P3a | `docs/standard-workflow.md` | `:107-123`（新增 `### 证据只留原始件`） | 子代理落 |
| P3b | `AGENTS.md` | `:32-37` | 子代理落 |
| P4 | `workflows/build-code/SKILL.md` | `:228-234` | 子代理落 |
| P5a | `docs/standard-workflow.md` | `:312-316` | 子代理落 |
| P5b | `workflows/build-code/SKILL.md` | `:303` | 子代理落 |
| P6a | `workflows/build-code/SKILL.md` | `:305-308` | 子代理落 |
| P6b | `docs/standard-workflow.md` | `:94`（按 Phase 记一行成本数据） | 主会话落（见 §14.13.2） |
| P7a | `workflows/build-code/steps.json` | `:13`（`observable_result` **整值替换**） | 子代理落 |
| P7b | `workflows/build-code/SKILL.md` | `:281-284` | 子代理落 |
| P8 | `docs/standard-workflow.md` | `:98-105` | 子代理落 |

**两条同锚点冲突的处置**（build-code P3a 与 P8 都以 `### review、测试和成本` 为锚）：P8 的正文段落落该节正文末尾（`:98-105`），P3a 的新 `###` 子段紧随其后（`:107-123`）⇒ **文件内顺序与提案编号相反**，这是刻意的：若把新 `###` 插在节首，会把该节既有正文的归属改变。

**唯一一处非纯插入**：`workflows/build-code/steps.json:13` 的 `observable_result` 是**完整新值**而非增量片段，字面追加会产生非法 JSON（`Expecting ',' delimiter`）。子代理按提案本意做整值替换，该行前缀与后缀逐字节未动 ⇒ `git diff --numstat` 为 `1 1`。

#### §14.13.2 两处锚点未命中（报告锚点与实际文件不符；均**不猜**，如实跳过或由主会话按正确锚点补落）

1. **build-spec P7**：报告锚点逐字 `2. 本 stage 负责的需求/实现/代码风险覆盖到什么程度；`，文件实际是 `2. 本 stage 负责的需求、实现或代码风险覆盖到什么程度；`（**`/` → `、`，且多一个「或」，两串等长 32 字符、唯一下标 16 处不同**）⇒ 子代理按硬规则 2/9 跳过。**由主会话按正确文本补落**（`:140`）。**注意**：报告给的位置是「第 2 项之后」，主会话改为落在**六项列表之后**——插在列表中间会破坏 Markdown 有序列表的编号，因此改成一段带 `**关于第 2 项和第 5 项**` 引导句的独立段落。
2. **build-code P6b**：报告锚点逐字 `时间和 token 只作诊断，按 **step**、skill、读取、交互、provider wait、测试、review、返工和用户等待拆分`，文件里该句**被折成两行**（`docs/standard-workflow.md:90-91`）且 `step` **不带星号** ⇒ `count == 0`，子代理跳过。**由主会话按折行等价锚点补落**（`:94`）。**只落该块的前两句**（按 Phase 记一行成本数据），**不落第三句 `不可得就写 unavailable`**——它与文件紧随其后的既有文本语义重叠，照抄会制造重复条款。

⇒ **可复用教训**：`R-review-*.md` 的报告锚点是**在另一份快照上取的**，凡 `count != 1` 一律不猜；锚点不符的两种典型成因是 **①标点被替换**（`/`→`、`）**②中文长句在文件里已折行**。折行等价锚点可用「上一行尾 + 下一行头」拼出，但必须**先确认语义不重复再落**。

#### §14.13.3 并发写者事故：主会话补落的 P7 段被落地子代理当作「别人的改动」删除

主会话在派发子代理**之后**补落了 build-spec P7（`docs/standard-workflow.md`），而落地子代理随后自证时发现该文件 md5 偏离自己的写入结果，判定「有并发写入者」，为让 diff 与自己的写面自洽，**把这一非它写入的段删掉了**，并在回传里如实报告、请求确认归属。处置：**主会话按正确锚点重新落盘**（`:140`），并在本节登记该事故。

⇒ **可复用教训**：**同一文件不得同时由主会话与子代理写入**。派发落地子代理时，主会话要么先落完再派发，要么把该文件的全部插入点一并交给同一个执行者。子代理「删除非自己写入内容以求 diff 自洽」是错误动作——正确动作是**保留 + 报告**。

#### §14.13.4 写面碰撞登记（与 CARD-04，按用户裁决「时间错开」）

本卡本次改动落在四个文件上，其中**经 2026-09-29 复核只有 `workflows/build-code/SKILL.md` 是 CARD-04 也改的文件**；`workflows/build-code/steps.json`、`workflows/build-spec/SKILL.md`、`docs/standard-workflow.md` **实测未被 CARD-04 触碰**（不在其 110 文件改动清单内）⇒ 碰撞面由四文件收窄为一文件。ADR-0034 的边界段已写明「本卡只做 make-decision、build-plan 推迟到 CARD-04 合并后、**写面碰撞由时间错开消解**」⇒ 本条登记的是**本卡先写、CARD-04 后写**，合并顺序按此，不在本卡内引入锁或分支隔离。

**并发写入实测（如实登记）**：本次落盘期间 `docs/standard-workflow.md` 被两个执行者交错写入三次（主会话 P7 → 子代理 P6a 且删 P7 → 主会话 P7 + P6b），文件由 402 行增至 **441 行**。最终态各文件 md5 见 §14.13.5。

#### §14.13.5 落盘后实测（主会话复验）

| 文件 | 改后 md5 | 行数 | `git diff --numstat`（增 / 删） |
| --- | --- | --- | --- |
| `AGENTS.md` | `b9ba891ab210d4556b3fb8822c1ce5d4` | 76 | `14 0` |
| `docs/standard-workflow.md` | `889adc0a415b249e074852924615adfe` | 441 | `39 0` |
| `skills/spec-plan/SKILL.md` | `697cddf0c1106390421dbac2466561aa` | 34 | `4 0` |
| `skills/plan-eng-review/SKILL.md` | `fc5215dc4f49c0df9a52ebb7e95d0703` | 54 | `6 0` |
| `skills/spec-plan/templates/phase-template.md` | `beba9a843b883b9263838fcc110b4e11` | 195 | `195 56`（整份重写，刻意） |
| `workflows/build-spec/SKILL.md` | `1071c2cddb037d74a18392f8b8298be9` | 347 | `19 0` |
| `workflows/build-code/SKILL.md` | `05542d45f1d7b3be1bb4fc90c05de1ad` | 387 | `53 0` |
| `workflows/build-code/steps.json` | `c11a2c1e1dc46b746aa15bce140fd7b5` | 21 | `1 1`（整值替换） |

- **除 `phase-template.md`（整份重写，刻意）与 `steps.json`（整值替换）外，全部为纯增量、0 删除行。**
- **`docs/standard-workflow.md:88-92` 是禁区**（含 `:91`「不设统一预算 gate」）：落盘前后逐字节相等，`md5` 实测 `19b0e07a1c49c4b6bd76f04b0a51c843`（与 `git show HEAD:` 同段一致）。
- `workflows/build-code/steps.json` 改后 `json.load` 通过，15 个 step 的顺序与键集合未变。

#### §14.13.6 残留不确定

1. **`AGENTS.md` 的 `14 0` 含别的卡相对 HEAD 的改动**；本次落盘（build-code P3b）的隔离口径是 `0 / 7+`。同理 `docs` 的 `39 0` 里本次落盘占 4 段。
2. build-code P7a 的**整值替换**是否算违反「只插入、绝不删改既有行」——子代理自述判断为「块即完整新值，纯追加必然非法 JSON」，主会话**接受**该判断并在此登记。
3. **行号会漂移**：本表行号对应 §14.13.5 的改后 md5；2026-09-29 复核实测 CARD-04 **只改了 `workflows/build-code/SKILL.md`**（`steps.json` 未被触碰），合并后该文件由 387 行增至 **417 行**；同批复核 `docs/standard-workflow.md` 现为 **450 行**（本表该行记 `441`，为本次落盘当时的行数），本表行号一律只作历史定位。
4. **本节与 §14.11.4 去重映射的关系未逐字复核**：§14.11.4 的「全新 5 条 / 部分重叠 4 条 / 重复 6 条 / 待核 1 条」只到 §14.7 施工表的一行摘要粒度；本节按该映射只给「全新 5 条」开了施工表行 63–67，其余 11 个插入点**未单独开行**（它们落在既有行 43–52 的范围内）。若后续要求逐条可追溯，需要把 §14.11.4 提升到正文级复核。
5. build-spec 侧 **P4 是否已被 §14.5 的 I-7 五类缺口覆盖**仍未逐条映射（§14.11.6 第①条同款）。

#### §14.13.7 sha 链第四次重算（本节落盘暴露的第四处消费者：**技能包自身的 `SKILL.md` 也在链上**）

§14.13 落盘触及 `skills/spec-plan/SKILL.md` 与 `skills/plan-eng-review/SKILL.md`，而这两个文件**都是各自技能包 `files[]` 的成员**：

| 包 | 变化文件 | 改前 sha256（前 12 位） | 改后 sha256 | 新的 `local_bundle_hash` |
| --- | --- | --- | --- | --- |
| `spec-plan` | `SKILL.md` | `ef5ed76ba8cf` | `80246fecb006c034564bcc323abe11cb8b3c3846119c314e94405e7c4db18151` | `fc654704a8643bcc3530018634cd81e206524e1557cd6247878054070b8009d8` |
| `plan-eng-review` | `SKILL.md` | （字符串形 `files[]`，包内不声明 sha256） | 同左 | `c6f2106125692adf36a17ce6845b5615b6d060728efe9dd68fb6f2d2147319e4` → **`6921cf82dc6de8032d87a07bbd50f7a3862c8d5d51d0d47e433521f2241b43fa`** |

- `skills/catalog.yaml`：`spec-plan` 的 `local_bundle_hash` 落 `:335`、`plan-eng-review` 的落 `:634`（两处，各 1 行字面替换）。
- **两条必须记住的事实**：
  1. `plan-eng-review` 的 `skill-bundle.json` 用**字符串形 `files[]`**（只写 `"SKILL.md"`，不写 sha256）⇒ **包内没有可改的哈希字面**，但 resolver 仍然对实际文件内容算 `bundleHash` 并与 catalog 比对（`runtime/adapters/local-skill-resolver.mjs:128` 用的是**实算** `sha256` 而不是声明值）⇒ **字符串形 `files[]` 的包照样要改 catalog**。只按「包的 `files[]` 里有没有 sha256」判断是否受影响是**错的**。
  2. 唯一的比对点是 `runtime/evidence/check-skill-closure.mjs:744` 的 `if (entry.local_bundle_hash !== checked.bundleHash) pushError(errors, \`${entry.name}: catalog local_bundle_hash does not match resolved bundle\`)`。⇒ **验算口径 = 对 catalog 里每一个带 `local_bundle_hash` 的条目，用 resolver 的 `canonical` + `localeCompare` 排序重算一遍并全量比对**，而不是只算「我改过的那几个包」。
- **全量验算结果**：本卡落盘后，catalog 中**只有 `spec-plan` 与 `plan-eng-review` 两处曾被算错**，修好后全仓一致；另外三个带 `local_bundle_hash` 却没有 `skill-bundle.json` 的条目（`stage-step-receipts`、`audit-summary-carrier`、`test-strategy`、`review-response` 一类）**没有包文件可比**，不在本口径内（应另有来源，未追查）。
- **返工登记**：本次是 sha 链的**第四次**重算（前三次见 §14.10、§14.12.4）。返工原因与前几次同源——**改动文件的「消费者地图」每次都是在测试报红之后才补出来的**。四次累计暴露的消费者共 6 类：①包内文件 `sha256`、②catalog 的 `local_bundle_hash`、③契约测试里写死的哈希、④`tests/contract/spec-stage-artifact-closure.test.mjs` 一类闭包测试、⑤字符串形 `files[]` 的隐式哈希、⑥`check-skill-closure` 的全量比对。

#### §14.13.8 落盘后的针对性测试实测（主会话复验）

命令：`npx vitest run` 12 个受影响契约测试文件（清单见 §14.13.1 的落点文件对应测试）。

**结果：`Test Files 3 failed | 9 passed (12)`；`Tests 3 failed | 162 passed (165)`。三条红全部经 stash 差分确认为 pre-existing：**

| 测试 | 断言 | pre-existing 证据 |
| --- | --- | --- |
| `tests/stage-plan-task-contract-v3.test.mjs` > `plan-task.v3 structural contract > records a current product diff outside completed task boundaries without blocking` | `expected [ …(2) ] to deeply equal [ Array(1) ]` | `git stash push` 回 HEAD 后**同样 1 failed** |
| `tests/stage-plan-task-contract.test.mjs` > `T1 AC-MS-005 > T1 AC-MS-005 uses one owner per equivalent definition` | `expected [ Array(1) ] to deeply equal []` | 同上，HEAD 同样 1 failed |
| `tests/contract/material-producer-consumer-roundtrip.test.mjs` > `material producer and consumer round-trip > RED: makes the phase the sole engineering body and tasks a pure execution index` | `expected '---\nname: spec-plan…' to match /single phase engineering authority\|单…/i` | 同上，HEAD 同样 1 failed |

- **stash 口径**：`git stash push -m "…" -- runtime/ skills/ tests/ docs/ workflows/ AGENTS.md CONTEXT.md`（**不加 `-u`**；**2026-09-29 复核更正**：原注「untracked 的 `specs/<task>/` 与 `docs/adr/0034-*.md` 不受影响」不成立——两者现均已被 git 跟踪，且本命令路径参数含 `docs/`，故 `docs/adr/0034-*.md` 会被纳入，`specs/` 不在参数内）；`git stash pop` 后逐文件 md5 与本节 §14.13.5 完全一致（28 个 ` M` 恢复）。
- **落盘前**这 12 个文件是 `5 failed | 7 passed（7 failed / 158 passed）`，7 条红全部是 `Error: bundle sha256 mismatch: SKILL.md` ⇒ **§14.13.7 的第四次重算是把 7 条红降回 3 条 pre-existing 的直接原因**。
- 另有 `tests/contract/stage-skill-invocation-contract.test.mjs`（8 tests，唯一调用 `resolveStageSkillPackages` 的活体校验）在哈希修好后**由红转绿**。

---

### §14.14 来源 → 条目 → 落点 → 验证：全覆盖对照审计（2026-09-28；用户追问「所有需求都登记了吗」）

#### §14.14.0 为什么有这一节

用户 2026-09-28 逐字追问：「**所有需求都登记了吗？包括之前card-04任务执行出的问题和我后来提出的新需求？有完整记录并设计方案了吗？**」

主会话当日逐项审计后的**诚实结论**：**逐条登记是有的（四个账本 + 八个方案段），但「完整性」在此之前不可核对**——因为缺一张从「来源」到「条目」的总对照表。本节补上这张表，并把审计中实测出的**五个缺口**逐条裁决。

**审计方法（可复现）**：对每份来源文档的章节与条目编号（`S1–S12`、`X1–X12`、`①–⑤`、A–I 九类），用 `grep -c` 在 `design.md` 与 `decision-log.md` 中核对「该来源的编号是否出现过」。下面每条「未登记」的判定都来自该方法得到的 **0 命中**，并附命中数。

#### §14.14.1 来源 × 账本位置（总表）

| # | 来源 | 规模 | 登记账本 | 方案段 |
| --- | --- | --- | --- | --- |
| 1 | CARD-04 超时复盘报告（外部） | 97 行断言（`attachments/A5-doc-crosscheck.md:17` §1.1 逐条核对） | `decision-log.md` 的 `R-015`／`R-016` | §14.2–§14.4（I-1…I-12） |
| 2 | 第七次会话转录 `rollout-2026-09-26T19-24-41-…jsonl` | 79,715,667 B / 49,470 行 | `decision-log.md` 的 `R-015`／`R-016` | 派生为 §14.5 与四份报告 |
| 3 | `attachments/A2-plan-gaps.md` | 268 行 / 29,812 B | **仅 design.md（12 处）**；decision-log **0 处** | §14.2 I-2、§14.3 I-7 |
| 4 | `attachments/A3b-volume.md` | 17,373 B | **仅 design.md（10 处）**；decision-log **0 处** | §14.3 I-9／I-11 |
| 5 | `attachments/A5-doc-crosscheck.md` | 304 行 / 56,254 B | **仅 design.md（4 处）**；decision-log **0 处** | §14.5 I-13/14/15 |
| 6 | `attachments/R-review-code.md` | 519 行 / 70,461 B | design.md 3 处、decision-log 1 处 | §14.11.2 → §14.13 |
| 7 | `attachments/R-review-spec.md` | 301 行 / 49,946 B | design.md 6 处、decision-log 1 处 | §14.11.3 → §14.13 |
| 8 | `attachments/R-phase-template.md` | 932 行 / 83,875 B | design.md（§14.12.0） | §14.12（I-18） |
| 9 | 用户六次追加指令 | 见 §14.14.5 | `decision-log.md` `### 十二` | §14.0／§14.10／§14.11／§14.12／§14.13／§6.7 |

**已实测到的一处不对称**：第 3、4、5 号来源（三份取证报告）**只被 `design.md` 引用，`decision-log.md` 零引用**。这不影响方案完整性，但意味着**只看 decision-log 的读者看不到这三份报告的来源链**。本节把它登记为事实，不要求补写引用（decision-log 的 `R`／`OI`／`T`／`F` 四个账本已可双向到达）。

#### §14.14.2 缺口一：`A5-doc-crosscheck.md` §5 的 S1–S12 逐条裁决

**缺口事实**：该报告 §5 自己给出「去重后 12 条可施工建议」`S1–S12`。本设计此前**只把其中 3 条收成独立条目**（S2→I-15、S7→I-14、S12→I-12），其余 9 条**假定与 I-1…I-12 重叠而未写映射**。
**实测**：字符串 `S10`／`S11`／`S12` 在 `design.md` 与 `decision-log.md` **各 0 命中**；`新鲜度`、`可跟踪指标`、`进度可见性` **亦各 0 命中**。

| 建议 | 摘要 | 裁决 | 落点 / 理由 |
| --- | --- | --- | --- |
| S1 | 按「可独立验收、可独立提交」切 Phase，不为一小时强拆 | **已覆盖** | I-3（逐字标题＝一个可独立验收、可独立提交的功能结果）；施工表行 43 |
| S2 | 交接前可执行性核查 | **已采纳为新条目** | I-15；build-spec P8 已落盘 `workflows/build-spec/SKILL.md:54-66`；施工表行 50（**已落地**，`docs/standard-workflow.md:290-294`；**2026-09-29 一致性复核更正**：原记「未实施」来自按字面短语 `交接前可执行性核查` 搜索未命中，而该段正文即落地处） |
| S3 | 实现期锁定范围、一次一个 Phase、同 Phase 问题一次列清 | **已覆盖** | I-6（施工表行 45）＋ I-7（`workflows/build-code/SKILL.md:16-32` 已落盘） |
| S4 | 一 Phase 一正式审查、已有有效审查不重派 | **已覆盖** | I-8；build-code P8（`docs/standard-workflow.md:98-105` 已落盘） |
| S5 | 设计复核的事由与投入上限 | **部分采纳** | 复核件纪律已落盘（`workflows/build-spec/SKILL.md:96-98`）；**「投入上限」明确不做**——它会变成预算 gate，违 §14.0 的 SD-17 硬约束与既有的「**不设统一预算 gate**」 |
| S6 | 同一原件只存一份 | **已覆盖** | I-9；build-code P3「证据只留原始件」（`docs/standard-workflow.md:107-123` 已落盘） |
| S7 | 业务规则绑稳定段落而非整份哈希 | **已采纳为新条目** | I-14；build-spec P5 已落盘 `workflows/build-spec/SKILL.md:90` |
| S8 | 计划与执行记录分家 | **已覆盖** | I-1；施工表行 43 |
| S9 | 用真实成本信号发现问题 | **已覆盖** | I-11；build-code P6（`docs/standard-workflow.md:94` 已落盘）；施工表行 51（**已落地**，改后字段在 `runtime/stage/stage-handlers.mjs:294-295`；机制见 §14.6 第 4 条的消解注记；**2026-09-29 复核更正**：原记「未实施」，与施工表行 51「已落地」冲突，已按实测改为同一口径） |
| S10 | 进度可见性：不靠 `list_agents`＋读时钟判断局面；相位指针带新鲜度语义 | **现仓已具备 ⇒ 不新增条目，改登记位置** | 见下方「S10 专项」 |
| S11 | 目标从「零返工」改成可跟踪指标 | **部分采纳** | 见下方「S11 专项」 |
| S12 | 面向用户的报告必须用大白话并附术语对照 | **已采纳为新条目** | I-12；`AGENTS.md:32-37`（`### 卡住与升级`）已落盘；`workflows/build-code/SKILL.md:39-42`（`## 阶段末遗漏披露`）已落盘 |

**S10 专项（这条此前真的没有落点，实测后判定为「现仓已具备」）**：

- **schema 侧已具备**：`runtime/task/task-store.mjs:243` 逐字 `exactKeys(value, ["phase_id", "task_id", "material_revision", "recorded_at"], "phase_progress")` ⇒ 指针**本来就带两个新鲜度字段**（材料修订号 + 记录时刻）；`:250` 校验 `recorded_at` 合法性。
- **纪律侧已具备**：`workflows/build-code/SKILL.md:73-76` 逐字「On resume, read the current `phase_progress` returned by `status --action=begin`; **if its material revision matches, continue at that Phase/Task. If absent or stale, derive the next incomplete task** from the physical Phase files and current task facts.」
- ⇒ **`A5` 说的「相位指针要带新鲜度语义」是既有事实，不是待做项。** 本节此前未登记它，属**记录缺口**，不是设计缺口。
- **`list_agents`／读时钟那一半**：归 ADR-0034（子代理派发与并行规则）与 `OI-004`（并发上限区间），本卡**不新增条文**——理由：CARD-04 的 143 次 `list_agents` 与 638 次读时钟是**宿主工具行为**，不在本卡写面内；新增条文会越出 §14.0 的写面。

**S11 专项**：

- **采纳的部分**：「可检查目标」形态**已经落地**——`design.md` 与 `decision-log.md` 逐字写着复盘末尾那三条：**零已知计划缺口进入 build-code、零同范围重复正式审查、零无界计划改写**（`grep -c` 各 1 命中）。
- **不采纳的部分**：`S11` 列举的五组统计量（计划就绪率、阶段用时中位数/95 分位、一次审查后修复次数、计划修订次数、后发现前置缺失数）**本卡不做**。理由（必须写明，否则看起来像遗漏）：这五组都需要**新增账本或聚合器**，直接违反 `OI-013`／`FR-29`（不新增第二套进度权威、不新增账本）与 SD-17（不新增门禁）；且与用户 U-001 第 6 点「不要浪费任何机制统计 token、时间」同向。

#### §14.14.3 缺口二：`A2-plan-gaps.md` §2.2 的九类缺口逐类裁决

**缺口事实**：`A2-plan-gaps.md` §2.2 给的是**九类**（A–I）；本设计用过**两条不同的轴**——I-2 用「四个空白字段」轴覆盖 **33/61 条（54%）**，I-7 用**另一套** A/B/C/D/E 五类覆盖 **39/61 条**。**两套字母表互不对应，九类中没有任何一类的「未覆盖部分」被逐条裁决过**；§14.9 第 2 条自己写着「**未做逐条映射**」。

| 类型 | 条数 | 落点 | 状态 |
| --- | --- | --- | --- |
| A 真实来源/生产者未认证 | 10 | I-2 的 `可观察接缝` 字段；build-spec P2「三项都要写我是怎么知道的」已落盘 | **已覆盖** |
| B 真实消费者/入口不存在 | 8 | I-2 的 `Consumer` 字段；I-15 交接前核查 | **已覆盖** |
| C 验收场景/业务 oracle 缺失 | 10 | I-2 的 `FR ·AC` 字段只能保证「写了」；**判据靠 build-spec P8 八问第 3 问「实读还是推断？」** | **部分覆盖（判据依赖人工）** |
| D 预写测试/冻结断言与实现冲突 | 4 | I-2 的 `Prewritten test`＋`RED evidence`；build-spec P4 归因三问已落盘 | **已覆盖** |
| E 受保护写面/跨卡授权未定 | 7 | I-4 写面纪律；build-spec P3「只能来自实读」已落盘 | **已覆盖** |
| F 材料字段与语义不足 | 7 | I-2 字段齐备性 | **已覆盖** |
| G 读回/负控/隐藏失败边界 | 11 | I-2 的 `Risk and rollback`（CARD-04 实测 0/13 覆盖） | **已覆盖** |
| H 版本·身份·绑定缺失 | 6 | I-14；build-code P4 已落盘 | **已覆盖** |
| I 规模未知 | 3 | I-5 规模对账 | **已覆盖** |

**两条必须同时登记的读数口径**（否则「54%」会被误读成「覆盖率」）：

1. 九类的条数**合计 66 > 61**（`A2-plan-gaps.md:188` 逐字：「归并计数大于 61：多数缺口同时用了两种处置」）⇒ 任何**单一轴**都不可能覆盖全部 61 条。
2. 「33 条」是「与四个空白字段**同轴**的子集」，「39/61」是 I-7 那套五类的子集——**两个子集互有交叠，不是互补的 33+39**。正确说法是：**两条轴各自看见一部分，剩余部分由 I-15 的交接前核查人工兜底**。

**本节裁决**：**不再新增第三条轴**（会把 §14.2 的字段表与 §14.3 的边界表搅成第三套编号），改为**承认两条轴 + 人工兜底**，并把上面这张表作为九类的唯一权威映射。

#### §14.14.4 缺口三：I-2 的「套话」判据

**缺口事实**：§14.9 第 1 条自认——I-2「**只要求字段必须出现**」，「格子里填的是泛指套话」这一层**没有机械判据也没有人工判据**。

**裁决：不新增机械判据，改为指名人工判据的既有落点**。理由：任何「这个格子里的话算不算套话」的机械判据都必须写成新的校验器，直接违反 §14.0 的 SD-17 硬约束（不新增门禁/阻断/校验前置）与 `OI-013`（校验机器不构成推进前置）。

**已有的人工判据（已落盘，本节只做指名）**：`workflows/build-spec/SKILL.md:54-66` 的「**交接前可执行性自问八条**」，其第 1 问要求「一个 Phase 一个可独立验收结果？」，第 3 问逐字要求回答「**实读还是推断？**」——**这两问就是 I-2 的「套话」判据**。

⇒ 缺口三降级为**记录缺口**：I-2 的机械层（字段存在）在 phase 模板与 runtime 校验里，人工层在 build-spec P8 八问里；两层的分工此前未被指明。

#### §14.14.5 缺口四：用户「去掉『按真实时长切 Phase』」这条裁决的登记位置

**缺口事实**：用户曾明确裁决「**请把『按真实时长切 Phase』去掉，1 个小时是我粗略的目标，不是硬指标**」。实测：`按真实时长`／`真实时长`／`一小时`／`强拆`／`硬指标`／`粗略` 在 `design.md` 与 `decision-log.md` **全部 0 命中**（`decision-log.md` 连 `时长` 二字都 0 命中）。

**实际存在的位置**：该裁决的**实质**已经落在 §14.3 I-11 的逐字草案内——「……**不按时钟自动拆分或终止一个完整功能**。」并在同节引述了既有的「**不设统一预算 gate**」。

⇒ **判定：实质已覆盖，登记位置不显眼。** 本节把它升格为一条**独立可检索的裁决记录**（编号 `T-037`，落 `decision-log.md`），不新增任何条文、不改任何既有文件。

#### §14.14.6 缺口五（附带发现）：`A5-doc-crosscheck.md` §2 的 X1–X12 与 §3 的 ①–⑤ 口径混用未登记

**缺口事实**：`A5` §2 给了 12 条两文档冲突的**真值判定**（X1–X12），§3 给了 5 种 token 口径的边界（①–⑤）。实测：`X1`…`X12`、`矛盾清单`、`口径混用`、`外置镜像`、`46,631,377`、`1,263,328,061` 在 `design.md` 与 `decision-log.md` **全部 0 命中**。

| 条目 | 内容 | 裁决 | 落点 |
| --- | --- | --- | --- |
| **X6** | 复盘只计工作树一侧（约 2,774/28M），未声明另有外置镜像；真值＝工作树 2,777 ＋ `T` 侧 6,448 文件 / 166M | **已覆盖** | `design.md` 逐字两行；`grep -c '6,448'`＝1 |
| **X8** | 四文档里 **8 处路径断链**（`/Users/Hugh/Knowledge/Projects/…` 少一层 `Hugh/`） | **采纳为登记事实** | 本卡 `attachments/` 的耐用副本已用正确相对路径，**不受影响**；断链本身登记进 `T-038` |
| **X9** | 四文档同引「约一小时效率目标」，仓库 `grep` **0 命中**，互引不构成独立证据 | **采纳，且它是 §14.14.5 的来源** | 与 `T-037` 合并登记 |
| X1／X4 | spawn_agent 真值 192（非 195）；5 次失败＝4 次并发上限＋1 次路径已存在 | **不落本卡** | 纯外部文档事实更正，不改变任何方案条目 |
| X2 | P1 审查是「派发中漂移」（`REVIEW_SOURCE_DRIFT`），非「派发前」 | **不落本卡** | 同上；本卡未引用该措辞 |
| X3 | P10 是 28 份（顶层 21），非 26 | **已覆盖** | 本卡对 A3b 的引用使用 28／21 |
| X5 | 「三个连续回合」实为不连续（#13/#14 相邻，#17 前还有 #15/#16） | **不落本卡** | 语病更正 |
| X7 | `01` 引的 handoff 三项表述在该文件无逐字原文 | **不落本卡** | `A5` 已登记为「无法核实」 |
| X10 | 某证据文件只在外置镜像、不在工作树 | **不落本卡** | 属 CARD-04 材料口径 |
| X11／X12 | 两处「非矛盾」限定 | **不落本卡** | — |
| **①–⑤** | token 五种口径的边界（应用目标计数 46,631,377／主转录末值 1,264,453,587（cached 99.60%）／按回合聚合／子代理 70 份／`exec` 文本嵌套计数） | **采纳为「引用纪律」** | 本卡**任何**引用 token 数字的地方必须同时写明属于哪一种口径；本卡现行文本只引 21,135 秒静默（`design.md` 2 处、`decision-log.md` 1 处），**不是 token 口径**，故不受影响 |

#### §14.14.7 施工表现仍未实施的行：现余 3 处（不是漏记，是排队；**2026-09-29 复查更正**：原列三行中的行 50、行 51 已落地，且原记只列行 52 一处，漏记行 44 末句与行 47 第三句，现按实测补齐）—— **43–52 行实况（2026-09-29 复查更正，实测）：已设计、未实施＝3 处 —— 行 44 末句、行 47 第三句、行 52**

`grep` 实测（2026-09-28；**2026-09-29 复查更正**补测行 44／行 47，见下）：

- 行 44：`skills/spec-plan/SKILL.md`（实测 34 行）全文无交接前逐字段核对句；全仓 `grep -rn "Before handoff, confirm" --exclude-dir=.git --exclude-dir=node_modules .` = **3 处命中，且全在本设计书自身**（`:2272` 逐字草案、施工表行 44 单元格 `:2570`、本行 `:3298`）⇒ **未落地（已设计、未实施）**；同一命题已由 `skills/spec-plan/templates/phase-template.md:147`／`:175` 的 `可观察接缝` 字段规范承载。
- 行 47：前两句（证据只留原件与指针／不得把整棵树当证据）**已落地** `docs/standard-workflow.md:107-123`（`:107` 段落标题、`:113` 正式回执、`:117` 禁止整棵树／整目录快照、`:123` 执行纪律限定）；**第三句**（「同三元组已有 semantic 结果则复用」）在 `docs/standard-workflow.md` **零命中**，其 runtime 侧（`runtime/review/review-record-route.mjs`）经 §14.6 冲突 3（`:2557-2562`）判定**不在本卡写面**、挂 **CARD-05**（另见 `:2613`）⇒ **只算前两句已落地**。
- 行 50：`docs/standard-workflow.md` 里搜不到「交接前可执行性核查」这句字面短语，但 **`:290-294` 就是该行的落地正文**（build-plan 交接前把「可执行性」当完成条件核对一次，核对结果写进材料本身）⇒ **已落地**（**2026-09-29 一致性复核更正**：原记「未实施」来自按字面短语 `grep` 未命中）。
- 行 51：**2026-09-29 复核更正：已落地**（不再是「未实施」，原记有误）。`runtime/stage/stage-handlers.mjs#completionReview`（原记 `:280`，现函数体 `:280-299`）的 `:294` 现为 `duration_ms: timings.length ? timings.reduce((sum, value) => sum + value, 0) : null,`、`:295`（原记 `:281`，该旧行号已错位）现为 `tokens: usages.length ? usages.reduce((sum, value) => sum + value, 0) : null,` ⇒ **已实施**；口径与施工表行 51「已落地，改后字段在 `:294-295`」及 §14.6 第 4 条的消解注记一致。
- 行 52：`workflows/build-code/SKILL.md` 与 `workflows/build-plan/SKILL.md` 里 `并行上限`／`并发上限` 命中数＝**0** ⇒ **未实施**（该行标「错开实施」）。

⇒ **43–52 行实况（2026-09-29 复查更正，实测）：已设计、未实施＝3 处 —— 行 44 末句、行 47 第三句、行 52**（行 44 末句：`skills/spec-plan/SKILL.md` 全文无该句，同一命题由 `skills/spec-plan/templates/phase-template.md:147`／`:175` 的 `可观察接缝` 字段规范承载；行 47 第三句：前两句已落地 `docs/standard-workflow.md:107-123`，第三句「同三元组已有 semantic 结果则复用」在 `docs/standard-workflow.md` 零命中、其 runtime 侧按 §14.6 冲突 3 挂 CARD-05；行 52：`并行上限`／`并发上限` 在 `workflows/build-code/SKILL.md` 与 `workflows/build-plan/SKILL.md` 命中数＝0，该行标「错开实施」）；其余（行 43、行 45–46、行 47 前两句、行 48–51）已落地。**不是登记缺口**；原列三行中的行 50 已于 **2026-09-29 一致性复核更正**为**已落地**（`docs/standard-workflow.md:290-294`），行 51 已落地（`runtime/stage/stage-handlers.mjs:294-295`，见上）。

#### §14.14.8 本节新增的记账（写面）

| 项 | 文件 | 形态 |
| --- | --- | --- |
| 本节（§14.14） | `specs/workflowhub-thin-core-card-03-20260919/design.md` | 纯追加 |
| `T-037`（去掉「按真实时长切 Phase」） | `specs/workflowhub-thin-core-card-03-20260919/decision-log.md` | 新增问答行 |
| `T-038`（8 处路径断链 ＋ X9 无法核实） | `specs/workflowhub-thin-core-card-03-20260919/decision-log.md` | 新增问答行 |

**本节不新增任何条文、不改任何既有文件、不新增门禁**（SD-17）。所有裁决都是「指名既有落点」或「明确不采纳 + 写明理由」。

#### §14.14.9 残留不确定（如实登记）

1. **`A5` §1 的断言清单表（97＋45＋49＋43 行）未逐条映射**——本节只映射了 §2 的 X1–X12、§3 的 ①–⑤、§5 的 S1–S12 三张表。
2. **`A3b-volume.md` 与 `A2-plan-gaps.md` 的表格未逐行映射**——本节只映射了 `A2` 的 §2.2 九类与 §2.3 处置分布。
3. **`R-review-code.md`／`R-review-spec.md` 的 §1 机制盘点（a–h 八项／34 条）未逐条映射**——只映射了 §3 的 16 条提案（§14.11.4）。
4. **`R-phase-template.md` 的 D1–D26／38 条硬约束／10 条风险未逐条映射**——只落了 §3 的 185 行草案（落盘文件并入 bs P1/P2 后为 195 行；2026-09-28 二次修订后 **217 行**，见 §14.15）。
5. **`X8` 的 8 处断链只登记未修复**——它们是**外部文档**里的路径，不在本卡写面内。

### §14.15 phase 模板执行者对照性二次修订（2026-09-28；用户当面新指令的落差调研与修改）

**用户指令（逐字，2026-09-28）**：「我需要仔细调研原来的plan和tasks模板，看看现在的模板还有什么差距，应该如何修改。我希望最终的phase文件可以很方便的让执行者对照着干活，产出高质量的代码！」——这是 §五 裁决第 1 条的执行，取代了「认可现成字段清单」的选项。

**调研方法**：逐字通读四份模板——`skills/spec-plan/templates/plan-template.md`（257 行，计划作者视角）、`skills/spec-tasks/templates/index-template.md`（12 行）与 `tasks-template.md`（24 行，纯指针）、`skills/spec-plan/templates/phase-template.md`（当时 195 行，执行者视角），以「执行者对照干活」为标尺找落差。

**四个落差（全部指向执行者找不到材料/交接断档）**：

1. **没有本 Phase 的材料导航**。计划模板有整节「材料导航」表（材料锚点／职责／M/S/B/P 读取时机）；phase 文件只有一个 `全局规格` 指针，执行者要自己翻遍 spec.md 与 decision-log 找本 Phase 相关的段落。⇒ 新增 `## 本 Phase 材料导航` 整节（三张锚点行：spec.md 认领的 FR/AC 锚点、decision-log.md 决定条目锚点、上游 phase 的交接知识），并加一句兜底：没列进的材料不凭印象引用、列进的每条锚点写卡片时要实际打开过。
2. **没有「动手前必读」**。计划模板有「现在必读／动手前必读」两行精确锚点；phase 的速读卡只有「改动前」状态描述。⇒ 速读卡新增 `动手前必读` 一条（精确到 `文件路径:行号` 或材料节锚点、按读序排列）。
3. **没有「交接知识」**。计划模板每个 Phase 节有「知识：下一阶段必须知道的已核实事实」；phase 文件没有对应物，跨 Phase 连续性靠人肉记忆。⇒ L1 新增 `### 交接知识` 小节（每条已核实事实必须带来源——`文件路径:行号` 或 `实际命令 + 退出码`；明确不写执行状态与进度，不违 OI-009）。
4. **没有「未决事实」登记**。计划模板全局约束有「未决事实：未知事实、影响、处理阶段」；phase 层面执行者卡住时无处可查。⇒ 速读卡新增 `未决事实` 一条（未知＋影响＋处理位置，或 `N/A — 理由`）。

**刻意不搬的计划模板内容**（防膨胀、防越权）：技术决策 DEC 模板（计划作者物）、治理同步矩阵、宪法逐项检查（审查面物）、方案设计节（spec.md 权威物）、Phase 级依赖与并行（已在契约头与卡片依赖覆盖）。

**机器安全核验**（改前实读 `validatePostPhaseContract`（原记 `:7030-7120`，现 `:7189` 起） 与三个引用模板的契约测试）：卡片发现逻辑是 `markdownSections(l1,3).filter(heading => /^T\d+\b/)`——L1 内新增的 `### 交接知识` 不匹配 `^T\d+`、被机器忽略，安全；文件级字段按名读取，新节不干扰；测试断言模板**不得含 `plan.md`/`tasks.md` 字面量**（post-cohort-authoring-files）——材料导航全节 0 命中这两个词；`### Tnnn — ` 到 `## L2` 之间的卡片区内容未动。

**落盘与验证**：195 → **217 行**（纯增量 22 行：材料导航节 11 行、交接知识 4 行、速读卡 2 行、字段说明表 4 行、用法第 7 条 1 行）；md5 `46d579272dcdfc051acf7f76c9d360b9`；sha256 `910b88980baecb125176607758552833c117e540d2da663a74372edb4760d54a`。**sha 链第 5 次重算**：`skills/spec-plan/skill-bundle.json` 单文件哈希替换＋`skills/catalog.yaml:335` bundle 哈希 `fc654704…` → `b1a6e954162da7506f18a74be37cb8b5cb63d14b386ad3b10fc98acb23dcc3e1`；`validateSkillBundle` 实跑通过。**测试**：`post-cohort-authoring-files` 3 ✓、`post-cohort-executable-authoring` ✓、`spec-stage-artifact-closure` ✓、`material-workspace`＋`review-materials-contract` 75 ✓，合计 88 ✓（0 新增红）。施工表行 68。

### §14.16 build-plan 审查第 9 条「遗漏类扫描」（2026-09-28；用户「避免 spec/phase 大量遗漏无人知晓」）

**用户问句（逐字，2026-09-28）**：「这次spec和phase模板和文件质量都有改动吧，那么最终的build-plan审查细节需不需要对应的优化，避免像之前一样，spec和phase文件大量遗漏，一直没人知道，导致交付质量特别差」⇒ 主会话查 build-plan 审查技能现状后给出 A/B/C 三选项，用户选 **A（九类扫描＋对账总闸都加）**。

**病灶定位**：`skills/plan-eng-review/SKILL.md` 原有 8 条检查全部是「写出来的东西对不对」（任务映射、边界方向、接口消费者、状态流、并行声明、RED/GREEN 真实性、失败回滚、实现效果），**没有一条查「该写的是不是都写了」**。`attachments/A2-plan-gaps.md` §2.2 数出的九类 66 条缺口正是从这个盲区漏过，且漏后无人知晓——没有任何检查要求审查者逐类回答「哪类东西我根本没看到」。

**落盘内容**（第 9 条，追加在第 8 条之后、`## Result` 之前，54 → **82** 行；`skills/plan-eng-review/SKILL.md` 2026-09-29 实读 82 行，原记 83 行）：

1. **九类逐类过堂**（a–i，类名沿用 A2 §2.2）：真实来源/生产者未认证、真实消费者/入口不存在、验收场景/业务 oracle 缺失、预写测试/冻结断言与实现冲突、受保护写面/跨卡授权未定、材料字段与语义不足、读回/负控/隐藏失败边界、版本·身份·绑定缺失、规模未知。每类必须三选一作答：带锚点证据 ／ `none_observed`＋比对对象 ／ `not_checked`；**跳类本身即 finding**。
2. **对账总闸**：原始需求清单逐行走，每条 R/FR/AC 要么指到具体 Task、要么写明不做/延期理由＋负责人；**无声消失即 finding**，计划写得再好也照报。

**性质**：lens-only（只报告不拦路），不新增 gate、不新增状态权威，与 SD-17/OI-013 同向；测试断言逐词核验过（stage-plan-task-contract :432-437 只查既有术语存在性，新增内容不冲突）。

**验证**：`stage-skill-invocation-contract` 8 ✓、`stage-routing-and-concrete-testing` 14 ✓；`stage-plan-task-contract` 1 ✗（`T1 AC-MS-005 uses one owner per equivalent definition`，**既存红，基线对照一致**）、`distribution-closure` 10 ✗（**既存红，基线对照一致**）——0 新增红。bundle 哈希重算：`6921cf82…` → `ef828eb4f76b66c6e86e49e6b64130362242d9937b203d96f9cab3eac84ec6b7`（`skills/catalog.yaml` plan-eng-review 块；string-form files[] 无需改 bundle json）。施工表行 69。

### §14.17 card-04 审查耗时法证与审查编排优化设计（2026-09-28；用户新指令「不能只登记，要设计更详细的解决方案」）

**用户指令（逐字，2026-09-28）**：「A，"每阶段审查预算+受控超时"需要研究要不要做，因为很容易因为这些预算强行停止正在运行的审查，导致更大的浪费，现在已经通过健康检查来判断审查是否还在运行了，没有必要在设置限制了吧。B，同时不能只登记到决策中，需要设计更详细的解决方案」⇒ 措施 6 由「落地」降级为「研究项」；本节为五项措施 + 一个研究项的完整设计。

#### 法证数字（2026-09-28 实读 card-04 任务档案 `quality/reviews/`，23 次 attempt 全量）

- 13 次有真实审查腿、**10 次空 attempt（43%）**——派发后零产出；
- 两腿并行（wall ≈ legsum 的 55–65%）；**腿合计 18,070s（5.02h）、墙钟 10,359s（2.88h）**；
- 8 次有效 build-code 阶段审查**全部在 ocr-host**（codex+kimi 双路），审查包＝card-05 OCR 机制（diff 分片＋AC 全文＋「OCR 只筛文件/规则、独立 LLM 判断」）⇒ **范围/技能/模型均非病根**；
- 发现量：build-code ~295 条（P2=70、P4=30+45、P3=25+0、P7=50、P8=35、P9=35、P5=5）、build-plan=75、make-decision=65；P3/P4 各双轮；**4f2643f1（P3 次轮）13 分钟墙钟返回 1.3KB 零发现被照收**；
- 会话总 34.6h；exec 合计 1.76h；wait_agent 12.2h；**审查墙钟（2.88h）＞全会话 exec（1.76h）的 1.62 倍**；另：P10 的 OCR packet 目录（Sep 27 21:03）存在而 attempts 档无对应记录。

#### 措施 1：审查非阻塞化（dispatch → collect）

- **病灶**：`review --action=record` 是阻塞 CLI，主会话每次原地等 10–20 分钟、逐阶段串行；同线程 Sep 22 段有约 50 分钟几乎纯审查等待，6 次长调用以 SIGINT(130) 被掐死。
- **设计**：`record` 增 `--async`（或新 action `dispatch`）：即刻返回 attempt_id、`dispatch_state=dispatched`——attempt 档已有 `dispatch_state` 字段（`runtime/review/schemas/attempt.schema.json:201`），钩子现成；新增 `--action=collect --attempt <id>` 查询终态。阶段收尾顺序写死为：实现完成 → collect 本阶段 pending 审查 → 未到齐先做收尾杂务（证据整理、下阶段材料准备）→ 仍缺才等待。
  **待裁决（2026-09-29 复核）**：`--async` 与 `--action=collect` 都是**新建 CLI 动词**，命中 card-04 的 **B-08**（不得新建 schema 字段／CLI 动词／控制面）⇒ 这里只作设计候选，**是否成立须由 CARD-05／CARD-06 裁决，不是已定方案**。
- **触点**：`tools/cli/stage-runtime.mjs`、`runtime/review/review-record-route.mjs`、`workflows/build-code/SKILL.md` 审查调用措辞、`docs/standard-workflow.md`。**CARD-04 未实现，转后续卡**：移交 **CARD-05**（触点 `runtime/review/review-record-route.mjs`）与 **CARD-06**（触点 `skills/wh-review/scripts/simple-review-runner.mjs`）。
- **边界**：attempt/result 档案形态不改（证据链不变），只改调用时序；不新增门禁。
- **风险**：若实现端无可并行杂务，非阻塞退化为同等等待 ⇒ 必须配套 phase-close 顺序表（杂务清单写进 build-code SKILL.md），否则不落地本措施。

#### 措施 2：派发前契约预检（fail-fast）

- **病灶**：43% 空 attempt——契约/考古失败在派发后才暴露，白搭 setup 与返工。
- **设计**：`recordSimpleReviewRequest` 入口加 <1s 预检，不过即非零退出 + 精确原因，**不产生 attempt 记录**：①input 恰含 request/result 之一；②stage 在 `stage-materials.json` 有 semantic_fields 定义；③materials 键覆盖全部语义字段；④host_provider 可解析且配置满足 minimum_heterologous；⑤禁带 host-owned 字段（snapshot_tree/material_revision/task_id 等）。
- **触点**：`runtime/review/review-record-route.mjs`（`recordSimpleReviewRequest` 区域；本卡 worktree 现行 `:1410` 起）、CLI。校验器从 stage-materials.json 读定义、不硬编码键名（防规则漂移）。**CARD-04 未实现，转后续卡**：移交 **CARD-05**（触点 `runtime/review/review-record-route.mjs`）。
- **性质**：fail-fast 错误不是 gate；与本卡 step 11 复盘建议（wh-review 用法回写阶段文档）构成「文档层＋机器层」纵深。

#### 措施 3：结果完整性自动校验（result_invalid）

- **病灶**：4f2643f1 坏结果（1.3KB/零发现/缺必填形状）静默入账。
- **设计**：result 落盘前机器验形状：JSON 可解析；findings 数组存在；每条含 severity(blocking|major|minor)、packet-relative path、正整数行号、issue、recommendation；blocking/major 另需 root_cause/evidence_kind/verbatim evidence（把 card-05 SCN-004 对 OCR packet 的既定形状推广到全部 review_kind）；零发现必须带 no_finding_reason＋覆盖范围声明。不过 ⇒ attempt 标 `result_invalid` 交还调用方，**不静默入账、不自动重派**（防旋转，由人决策）。**待裁决（2026-09-29 复核）**：`result_invalid` 是**新建 schema 字段**（命中 card-04 的 **B-08**），且 `runtime/review/**` 是 B-03 划给 CARD-05 的领地 ⇒ 这里只作设计候选，**须由 CARD-05／CARD-06 裁决**；实测 `attempt.schema.json:201` 的 `dispatch_state` enum 为 `["dispatched","blocked_before_dispatch","sent_unparsed","reused"]`，不含 `result_invalid`。
- **触点**：result 记录路径、`skills/wh-review/scripts/simple-review-runner.mjs` 输出处理。**只验形状不验真伪**。**CARD-04 未实现，转后续卡**：移交 **CARD-06**（触点 `skills/wh-review/scripts/simple-review-runner.mjs`），落地前须先裁决 `result_invalid` 是否获准新增。

#### 措施 4：审查包只绑声明写集

- **病灶**：证据膨胀（P11 三快照 5,576 文件/143MB）喂审查与证据链。
- **设计**：把本卡已落地的 G-3=B 快照收窄原则推广到审查材料：packet 文件集＝**该 phase 声明写集 ∩ 真实 diff**（`wh-review-packets/canonical-phase-diffs`、`canonical-review-materials` 机制已存在于机器上）；record 时拒收目录快照型材料，例外须显式 override＋理由落档。OCR packet 的 diff-shards 已是正确形态——本措施把它法定为**唯一路径**，砍掉整树材料通路。
- **触点**：`runtime/review/review-input-bounds.mjs#compactReviewDiff`（原记 `:5-6`；实读 `:4-8`，其注释逐字「Provider capability, rather than a local byte ceiling, decides whether delivery is possible.」）、`runtime/review/review-input-bounds.mjs#compactVerifyCodeMaterials`（`:23-25`，逐字 `return { materials, diff: null };`，自述不再按本地大小改写或拒收材料）、packet 组装路径。与措施 2 共用「声明写集」来源。
  **锚点更正（2026-09-29 复核）**：该文件**未被 card-04 触碰**（不在 card-04 的 110 文件改动清单内；`git log` 末次改动为 `e294647d`），其内容自始即如上，原文「该文件已被 card-04 重写」的前提**不成立**。
  **显式声明：本措施不是材料同一性门**——「record 时拒收目录快照型材料」只是材料**选择范围**的收窄，不重新引入哈希绑定、回执、快照或材料同一性校验门（card-04 的 **B-06**）；例外 override 只登记理由，不构成阻断门。

#### 措施 5：发现分级消费（消费端协议）

- **病灶**：~295 条发现一次性倒给主会话，阅读/分诊成本高。
- **设计**：档案不改（发现全量保留＝真相）；消费协议写进 `workflows/build-code/SKILL.md` phase close：blocking/major → 阶段收尾前逐条处置（修/不修＋理由＋owner）；minor → 追加进 `findings-minor.md` 附录、阶段末统一扫；执行者在收尾摘要逐条点名本轮发现的处置去向。**不限制审查者多报，只约束消费顺序**；与 §14.13 复核件纪律互补不重复。**CARD-04 未实现，转后续卡**：移交 **CARD-05**（审查编排；消费端协议触点 `workflows/build-code/SKILL.md` 的 phase close）。

#### 研究项 6：审查预算/受控超时 —— 用户质疑成立，降级为研究项

- **用户理由（逐字）**：预算很容易强行停止正在运行的审查造成更大浪费；健康检查已能判断审查是否还在运行，没必要再设限制。
- **现有健康信号**（attempt `execution.health`）：liveness、last_liveness_at_ms、progress_events、stdout_bytes——确实能分「活着的慢」与「无声无息」。
- **待研究问题**：①23 次 attempt 里真实「卡死」（health 无进展）次数——初判 0 次（4f2643f1 是坏结果非卡死；6 次 SIGINT 是人不耐烦）；②若未来出现卡死，安全网式上限（如 3×历史 p99，且触发前要求 progress_events 静默确认）是否值得；③要不要加 report-only 的 `stall_warning`（progress 静默 N 分钟只报告不动作）。
- **已被 card-04 落定为删除（2026-09-29 复核）**：card-04 已把正式审查预算整体删除——`tests/contract/review-budget-deletion.test.mjs:90` 断言 `runtime/review/review-record-route.mjs` 不含 `/evaluateReviewRound|readCanonicalBudgetHistory|REVIEW_RETRY_BUDGET/`、`:92` 断言控制面 `review-budget-namespace` 为 `undefined`、`:98` 断言 ADR 含「不再维持正式审查预算」⇒ 研究项 6 里「要不要设预算」这一半**已结案（不设，且机制已删）**，只余②③两个纯研究问题。
- **残留（未清理）**：`tools/cli/stage-runtime.mjs:2006` 的 `allowedRunFields` 集合里仍留 `"review_budget"` 键名（其消费者已不存在），属文本残留，转 CARD-05／CARD-06 清理。
- **默认立场**：不设常规预算（card-04 已删除正式预算机制；本项由「待研究」转为「已由 card-04 落定为删除」）。

#### 落地分工

- **本卡已做**：法证登记、本节设计、决定档案 `## 补充登记` 第十三节、施工表行 70（登记为下游推迟写面，本卡不动 runtime）。
- **CARD-04 未实现，转后续卡**：2026-09-29 复核实测——main 的 `tools/cli/stage-runtime.mjs` 自合并点起零改动（`git log --oneline 40421a46..97092b30 -- tools/cli/stage-runtime.mjs` 为空）；全仓无 `--async`、无 `--action=collect`、无 attempt 态 `result_invalid`（`dispatch_state` 字段本身已存在，但 enum 不含 `result_invalid`）⇒ 措施 1–5 的移交对象为 **CARD-05**（触点 `runtime/review/review-record-route.mjs`）与 **CARD-06**（触点 `skills/wh-review/scripts/simple-review-runner.mjs`）；研究项 6 已由 card-04 落定为删除（见上）。
- **与 §14.11 关系**：§14.11 build-code 侧 8 条是过程治理（已落地），本节是审查编排机制设计，互不重复。

## §15 PaperBuilder 事故的机制修补设计（I-16 … I-20；用户 4 项拍板；2026-09-29）

**来源与流程**：PaperBuilder 事故法证（`/tmp/pb-forensics/`：`proposal.md` 方案本体、`verify-proposal.md` 对抗验证，加三份根因报告与只读素材）。方案一轮＋**对抗验证一轮**；验证推翻/修正了 5 处措辞与前提（`gate_cmd` 执行点、验收词表实为机器八值域、M2 的强制半句、计划交付确认点已存在、`plan-eng-review` 写面与哈希链）。**本节是设计陈述；决定登记在 `specs/workflowhub-thin-core-card-03-20260919/decision-log.md` 的 `### 十七`**（含用户 4 项拍板逐字与哈希前后值）。

**落地层级标注（2026-09-29 加注）**：M1–M5 与 E1–E16 在本卡内为**文本级落地**；这些文本进入 `workflows/**`、`skills/**` 后的实际生效路径由 **build-plan 阶段复核**。

### §15.1 设计原则（三条；违反任一条即回退重写）

1. **只加人读措辞与执行纪律，不加机器门禁**：SD-17 的零阻断立场不变（`decision-log.md:111`）；每条都自述「不是新的 stage、gate 或质量结论」。
2. **只在既有确认点与既有字段上写实**：不新增文件/schema/字段/确认点/命令；`gate_cmd`/`evidence_path` 这类既有机器必填字段只改「怎么用」的文字。
3. **人读层与机器取值域分离**：人读三词＝达成／未达成（写明下一步）／退役；机器取值域（验收证据八值、AC 五值）冻结不动。

### §15.2 五条机制

- **I-16（M1）计划交付确认改成三选一**：确认点已存在（`workflows/build-plan/steps.json` step 12；`workflows/build-plan/SKILL.md:133-142`；`docs/standard-workflow.md:273-279`，均为改前行号）⇒ 只改**提问话术**为三选一（修完再进／指派缺口负责人后进／取消本次执行），复用 `human-confirmation.v3`。**未答的语义**＝保持草稿、同 task 继续修复、缺的确认事实如实记缺失、**不阻断**（依据该段自述 `This confirmation does not turn confirmation into a machine work permit.`）。**不**写成「没记录就不算完成」（会撞 card-04 `B-02`/`B-08`、`CONSTITUTION.md:57`）。落点：`workflows/build-plan/SKILL.md:143-146`、`docs/standard-workflow.md:281-283`。
- **I-17（M2）build-code Phase 收尾三件事**：`gate_cmd`/`evidence_path` 是契约头机器必填（`skills/spec-plan/templates/phase-template.md:123`/`:125`；runtime 强制点 `runtime/stage/stage-content-contracts.mjs:7247`/`:7250`/`:7293`/`:7566`/`:8012`），build-plan 侧已会执行（`workflows/build-plan/SKILL.md:216-218`、`skills/spec-plan/SKILL.md:28`），**build-code 侧此前只有文字要求**（原 `workflows/build-code/SKILL.md:340`）⇒ 把已有要求写实为：①按字面执行该 Phase 的 route 与 `gate_cmd` ②原始输出写入该 Phase 自己声明的 `evidence_path`（原件）③交付锚＝一次 `git commit`（仅既有授权到位时；缺授权记 `delivery pending`）。**「不允许把未达成写成完成」的强制半句被删除**（已由 `CONSTITUTION.md:100` 与 card-04 `B-11` 覆盖；写成「不许收尾/推进」即违反 `decision-log.md:111` SD-17 与 `:112` OI-012）⇒ 改为「未达成如实记为未达成并进失败事实清单，不新增推进前置」。落点：`workflows/build-code/SKILL.md:288-291`、`:352-357`。
- **I-18（M3）卡住判据＝「变了没有」，无阈值**：build-code 重试前自述一行「自上次以来我改了什么：<一句话>；失败信号：与上次相同／已变」；写不出＝卡住成立 ⇒ 停下、向人升级（人决定继续/换路/缩小/取消）。**不设次数或时长阈值**（用户反对阈值）；人侧升级纪律早已存在（`AGENTS.md:32-37` 的 `### 卡住与升级`）⇒ 本节只在 build-code 侧补自述行，不重复建设。落点：`workflows/build-code/SKILL.md:272-275`。
- **I-19（M4）让「加」与「删」同价**：(a) 模块→需求**不加新行**——runtime 已强制双向 trace（`runtime/stage/stage-content-contracts.mjs:7356`），按 `design.md:594` 的逻辑引用既有 trace，避免第二份会漂移的清单；(b) 审查读数在 `skills/plan-eng-review/SKILL.md:78-83` 加「删除类 finding」分类与两个条数（**只报数、不设配额、不许硬凑**）；规模读数**复用** card-04 `D-007`/`OI-010` 的既有反膨胀预算（`tools/architecture/complexity-report.mjs` 的 `budget()` + `tests/contract/repository-inventory.test.mjs` 的 baseline/waiver），**不新写规模规则、不新增门禁**；(c) 退役登记＝官方作者模板新增 `## 退役登记（retirement）` 段，5 栏含「原来的需求编号」（`skills/decision-log/templates/decision-log-template.md:314-327`；控制面登记 `AGENTS.md:68`）。
- **I-20（M5）销毁性动作适用既有 F7 边界**：整树丢弃类动作（`git restore/reset/checkout -- :/`）与 delete+add 整体替换权威材料属**销毁性动作**，适用既有 F7 不可逆授权边界（`CONSTITUTION.md:56`/`:172`/`:198`、`decision-log.md:111` R-014②、`design.md:2175`）：不得由阶段确认顺带授权、不得作为绕过既有授权的捷径；不新增公共动作/确认点/schema；发生时在既有 task facts 如实登记。用户④的「强推/删分支/删任务目录」落在该边界的**范围举例**里。**未**写成「必须先人工确认才可执行」（撞 `CONSTITUTION.md:56`/`:172` 与 card-04 `B-01…B-12`）。落点：`workflows/build-code/SKILL.md:379-383`。

### §15.3 与既有章节的关系

- §14.2（计划可执行）与 §14.3（build-code 编排）解决「交给下游的东西能不能执行」；本节解决「出口条件是否与现实对齐」，互不重复。
- §14.4（I-12 卡住必须升级到人）是 M3 的人侧纪律来源；本节只补 build-code 侧的可写自述行。
- §13 装配记录与本节无关，不改。

### §15.4 未决与移交（如实登记，不代用户决定）

- 退役登记表**无机器消费点**（只依赖 `make-decision` 主会话写模板）；是否加机器读数留给后续卡。
- M5 **无机器拦截点**（2026-09-29 修订：补全事实，结论不变）：实测 `grep -rn "git checkout|git restore|git reset|force-with-lease|branch -D" runtime/ tools/cli/` 零命中；另如实补全一条**范围更窄的**既有机器侧——`workflows/build-code/diff-scanner.mjs:17-30` 的 `C2_IRREVERSIBLE_GIT_RULES`（`:20-29`）**已把** `git push --force-with-lease`、`git push --force`、`git push --delete`、`git push -f`、`git branch -d`、`git branch -D`、`git reset --hard` 归类为 `irreversible_git`（配套 `tests/build-code-diff-only.test.mjs:6`），但该清单当前**不是**门禁：全仓没有任何 `runtime/`／`tools/`／`skills/` 代码调用 `createPhaseDiffScan`（唯一调用点即其自带 CLI `workflows/build-code/diff-scanner.mjs:477`；其余命中在 `tests/build-code-diff-only.test.mjs` 与只读归档 `specs/archive/stage-interaction-handoff-completeness/spec.md:69` 的设计意图描述里），`workflows/build-code/SKILL.md` 对 scanner／C2／越界**零提及**，`tools/cli/check-task-record-paths.mjs:107` 只白名单其临时路径 ⇒ 「M5 当前不是机器门禁」实质成立，如实记为**纪律条款**，不宣称已机器化。**残余风险（如实登记）**：`specs/archive/m8-build-code/tasks.md:348` 记有既有意图「每次 git diff 后检查 C2 清单（调 diff-scanner.mjs），有 violations 时**停等确认**」——该语义比 M5 现文更接近被禁止的「必须先人工确认」；**本卡不动 scanner**，留后续卡对齐口径。若后续要把「强推/删分支/删任务目录」写进授权清单枚举，属新控制面，须另立登记。
- `workflows/build-plan/steps.json` **未改**（其 step 12 `observable_result` 已含 `retains any actual user reply in the existing confirmation record`）；`decision-log.md:441` 记的冻结范围问题维持原状。

## §16 build-plan 防臃肿与执行层防跑偏的设计（E1–E16；2026-09-29）

**来源与流程**：落地清单 `/tmp/pb-land/landing-brief.md`（E1–E16 ＋ 硬约束 ＋ 验证与交付要求）。在同一 worktree 内**逐条 read 原件后**就地改文字；机制与哈希链见提交 `8b452fc0`。**本节是设计陈述；决定登记在 `specs/workflowhub-thin-core-card-03-20260919/decision-log.md` 的 `### 十八`**（含逐条落点、哈希前后值与 4 项未落地理由）。

### §16.1 设计原则（三条；违反任一条即回退重写）

1. **只改既有文本字段与既有执行纪律，不加机器门禁**：不新增门禁/字段/schema/确认点/阈值/CLI 动词，不新增要让用户回答的问题；每条新增文字都落在既有段落或既有模板槽位里。
2. **就地改文字、不重排、净行数 0**（唯一例外见 §16.3）：既有锚点依赖行号；E12 引入的 `workflows/build-code/SKILL.md:272-275` 自指只有在 build-code 行数不变时才成立。
3. **英文文件写英文、中文文件写中文**；技能改动与哈希链**同批**刷新（`skills/<skill>/skill-bundle.json` ＋ `skills/catalog.yaml` 对应项），哈希只由机器实现重算，不手改字面量。

### §16.2 十六处机制（三组）

- **计划期防臃肿（E1、E2、E6、E7、E8、E9、E15、E16）**：Task 粒度＝一个用户可感知的交付增量，同一交付物的连续步骤不拆卡（此前只禁「一行任务」、没定义上限，于是每条风险与未验证项都升格成一张卡）；被取代的全文正文不留在活文件里（历史由 git 与既有归档承载）；切片两条件（① 存在可整片丢弃的切片：低价值或可推迟；② 各切片体量相当）＋「材料或范围超出一次可读上限时，动作是把问题拆小，不是继续往同一份里写」，两项都不设数值阈值；非目标写「本可做而明确不选＋理由」（不写否定句、不拿「防止范围膨胀」当理由）、主要风险写「若因它返工，替代走法是什么」、验收项写「没参与实现的人能用一条命令重放」的判据（写不出即算未达成、不得记为达成）；`simplicity-guard` 的核心问题在 `spec-specify` 与 `spec-plan` 两个写作点自检，结论写进既有取舍/非目标字段。
- **执行期防跑偏（E10、E11、E12、E13）**：续跑第一步**先对现实**（`git status --short` ＋ 本 Phase 自己写的 `gate_cmd` 当前输出；材料与代码冲突时**代码赢**）；六段摘要的 `remaining risks` 必须对本轮失败信号给一句成句解读，唯一允许的空态写法是「这一轮没有失败信号」；**进展＝交付锚**（新提交或新证据）而非动作次数，拿不出外部锚时按既有 `:272-275` 判据自述一行、写不出即报告给人；**完成声明的上限＝独立来源的结论**（`adverse`/`unavailable` 时只声明到它允许的程度，但只限制措辞、**不阻断**同任务内修复；`docs/standard-workflow.md:88-92` 禁改区一字未动）。
- **减法侧的读写闭环（E3、E4、E5、E14）**：删掉「没有更短的只附录决策形态」这句绝对化（它让全部 154 条登记等重）；`review finding` 收窄为 `load-bearing` review finding；build-plan 的输入装配同时读三类**既有**减法载体（`decision-omission-acceptance.v1` 的 accepted「不做」、`retain_or_delete` 的删除决定、`not_applicable` 的不适用），并写明「不做」是合法登记而非待补缺口；`simplicity-guard` 补一小节写清三处调用点、输出形态（结论只写既有文本字段）与空态「已读，无可删内容」的合法性，以及未引用调用点结论的删减类决定按既有合同记一条普通 finding。

### §16.3 改动表面、行数与哈希链

- 表面（8 文件）：`skills/spec-plan/SKILL.md`（`:12`/`:14`/`:20`）、`skills/spec-plan/templates/phase-template.md`（`:34`/`:39`/`:43`/`:185`）、`skills/decision-log/SKILL.md`（`:25`/`:148`）、`skills/simplicity-guard/SKILL.md`（新节「写作流程中的调用点与输出形态」）、`skills/spec-specify/SKILL.md`（`:46`）、`workflows/build-plan/SKILL.md`（`:202`/`:292`）、`workflows/build-code/SKILL.md`（`:256`/`:357`/`:367`）、`docs/standard-workflow.md`（`:305`）。
- 行数：除 `skills/simplicity-guard/SKILL.md` 新增一小节（＋15 行；E14 明文要求「补一小节」）外，其余全部**净 0**。
- 哈希链（改前→改后）：`skills/spec-plan/skill-bundle.json:7` `80246fec→2bf13c1f`；`:11` `910b8898→35ff23ef`；`skills/decision-log/skill-bundle.json:7` `9f0c3bc1→3daa24c2`；`skills/spec-specify/skill-bundle.json:5` `fe95fe97→882a961a`；`skills/catalog.yaml` 的 `local_bundle_hash`：spec-plan `b1a6e954→a5d2df7d`（`:335`）、decision-log `47974d73→5e0a116b`（`:130`）、spec-specify `630a1250→8ec7d43d`（`:286`）、simplicity-guard `c36970ae→599d8807`（`:218`）。重算用 `runtime/adapters/local-skill-resolver.mjs#validateSkillBundle`（`:108` 实算每文件 sha256、`:116` 按 `localeCompare` 排序后算 `bundleHash`），无手改哈希字面量；全仓 39 个 bundle 校验 fail=0。`skills/simplicity-guard/skill-bundle.json` 的 `files` 是字符串数组（无 `sha256` 字段），故只刷 catalog 聚合值；其 `review-bundle.json` 未改。
- 未触碰：`runtime/**`、`tools/**`、`CONSTITUTION.md`、`specs/archive/**`；`docs/architecture/repository-inventory.tsv` **未重生成**（`tests/contract/repository-inventory.test.mjs:31` 要求它与 `HEAD` 逐字节相同）。
- 验证口径：改后与改前逐条比对失败测试名集合，**双向差集为空**（38 条既有红逐条相同，无新增红）；`npm run check:skill-closure` 仍只报基线同样 3 条既有红且无 `catalog local_bundle_hash does not match resolved bundle`；`markdownlint-cli2` 报的 2 条错（`skills/spec-plan/templates/phase-template.md:12` MD028、`:14` MD032）在 HEAD 版本上同样复现，属既有。

### §16.4 未落地项与残余风险（如实登记，不代用户决定）

- 未落地 4 项同 `### 十八` 的 18.4：两个废弃模板未删（`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/templates/tasks-template.md`）、`skills/wh-review/stage-skill-plan.json` 的 `required_skills` 未改（`tests/contract/stage-routing-and-concrete-testing.test.mjs:92-93` 冻结 `toEqual(["review"])`）、不新增复杂度预算/配额、`docs/architecture/repository-inventory.tsv` 未重生成。
- **残余风险 1**：E5/E16 属「读既有登记／读既有读数」的纪律，**没有机器消费点**；若无人读，`decision-omission-acceptance` 仍可能被当成缺口、删除类计数仍可能不被报出。
- **残余风险 2**：E14 的新节与 E15/E16 的调用点是文字约定，没有 schema 或 runner 强制。
- **残余风险 3**：`skills/wh-review/stage-skill-plan.json` 只声明 `required_skills: ["review"]`，而 runner 侧把 `plan-eng-review` 列为必需技能；该不一致被上述测试冻结，本轮只登记、不改。
