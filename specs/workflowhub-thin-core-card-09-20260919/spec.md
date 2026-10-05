# 功能规格：CARD-09 外仓审查工具迁入与派发效率

本文件是 CARD-09 build-plan 阶段的唯一功能规格与全局实现设计。决定来源是同目录 `decision-log.md`（D-001..D-048、`## 方案（实施面）` M1–M8、`## 验收面`，以及末尾追加的执行政策 D-049）；本文件只细化，不改方向。AC 的唯一定义在 `Appendix A`。

## 材料导航

本节只帮读者定位，不是权威。

| 要找什么 | 去哪里 | 什么时候读 |
| --- | --- | --- |
| 已确认决定与验收面 | `decision-log.md` `## 决定`、`## 验收面` | 有方向疑问时 |
| 本卡 AC 唯一定义 | 本文件 `Appendix A` | 实施与验收时 |
| 资源组 Phase | `phases/P1.md` | build-code P1 |
| 效率组 Phase | `phases/P2.md` | build-code P2 |
| Phase 指针 | `phases/index.md` | 定位 Phase |
| 调研原件 | `<TASK_DIR>/quality/evidence/execution-inputs/2026-10-04-007-card09-build-plan-research-efficiency.md`、`…-008-card09-build-plan-research-resource.md` | 核对事实来源 |

`<TASK_DIR>` 指 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-09-20260919`。下文 `-007`、`-008` 分别指上表两份调研原件。行号均为 2026-10-04 在 HEAD `0dfd949a` 实读；与调研原件冲突处以实读为准并注明。

## 速读卡（30 秒）

- 问题：审查工具 3rd-review 住在仓外，测试不进本仓回归；broker 孤儿回收缺覆盖；审查请求文件把同目录原件整份内嵌；审查派发、失败保留、等待与取消缺少可观察的效率事实。
- 本卡做：把外仓代码整仓迁入 `skills/third-review/`，测试改写为 Vitest 并挂进回归；补孤儿回收覆盖；请求材料支持按路径引用；修复失败时丢原始成员结果的缺陷；定向补派、停滞降频、短入口导航；用只读脚本现场复算时间分账与派发计数。
- 本卡不做：限并发、CPU/温度指标、新 public command/stage/持久对象/调度器、派生报告文件、改写 CARD-08 交接句。
- 两个 Phase 串行：P1 资源组（M1–M6）先，P2 效率组（M7 + D-044）后。
- 合入后配置切换：按本次真实用户持续授权自动切换仓外 `~/.config/workflowhub/config.json` 的 `third_review.command[1]`，先核稳定 checkout、备份，真实 doctor 失败即回滚；不逐次确认（C-04、D-049），只最终 close 确认。

## 来源与决策映射

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| R-001..R-008、R-021 | D-002、D-003、D-017、D-032、D-036、D-045 | FR-C09-T2、AC-T2 | current；`skills/third-review/` | 无 |
| R-001..R-008 | D-034、D-037 | FR-C09-T3、AC-T3 | current；32 个测试文件 | 无 |
| 母 FR-43 | D-038、D-043 | FR-C09-043、AC-43 | current；补覆盖 | 无 |
| 母 FR-44 | D-001、D-022 | AC-44 | non-goal；已撤销 | 无 |
| 母 FR-45 | D-039、D-046 | FR-C09-045、AC-45 | current；材料引用 | OPEN-002、OPEN-010 |
| 母 FR-46 | D-004、D-031、D-040、D-047 | FR-C09-046、AC-46、AC-51 | current；只读计数 | OPEN-002 |
| 母 FR-58 | D-013、D-015、D-020、D-035 | FR-C09-058、AC-59 | current；现场复算 | 无 |
| 母 FR-59 | D-016、D-048 | FR-C09-059、AC-60 | current；派发与失败保留 | 无 |
| 母 FR-60 | D-016 | FR-C09-060、AC-61 | current；短入口 | 无 |
| 母 FR-61 | D-041 | FR-C09-061、AC-62 | current；暂停按 OPEN-C09-BP-001 消解定义 | 可续暂停延期（后续卡） |
| D-008、D-012 | D-008、D-012 | FR-C09-T1、AC-T1 | current；开工前对齐 | 无 |
| D-027、D-029、D-042、D-044 | 同左 | FR-C09-T4、AC-T4 | current；①已由 main `9ba93e11` 满足 | 无 |

母 PRD 正文：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:486-522`（`:489` 范围与非目标，`:491-499` FR，`:500-509` AC）。

## 1. 需求解释：问题与紧迫性

审查链每轮都调用仓外 3rd-review，但其 32 个测试不在本仓回归里，改动无法被本仓检查发现（decision-log `## 问题`）。同时 CARD-06/CARD-09 的实际运行显示：审查请求文件内嵌整份原件（5 个请求共 637204 B，`-008` Q6）、失败路径把已完成成员改写为失败（`-007` §2）、等待只有固定 5000 ms 轮询而无停滞判断（`-007` §4）、时间与派发数字缺显式时间窗（C-01）。这些问题让下一张卡继续付出重复写入、重复派发和无法核对的成本。

## 2. 背景、目标与范围

### 背景

外仓 `/Users/Hugh/Hugh/Project/3rd-review` HEAD `97132960d7dab9145cbd0bdf610e09bf422e2ec0`（v4.0.0），`git ls-tree` 跟踪 110 个文件，去掉 `.gitignore` 后 109 个待迁（`-008` Q1）。宿主执行点是 `skills/wh-review/scripts/review-provider-client.mjs:1266`，命令来自仓外 `~/.config/workflowhub/config.json` 的 `third_review.command`（`-008` Q2）。

### 目标

- 外仓代码迁入本仓并可改指，被本仓回归与检查覆盖；按 D-049 合入后自动改指完成后，本仓副本才是唯一运行副本。
- 资源事实（文件数、字节数、进程数）与效率事实（调用、派发、等待、时间分账）有原件可复算。
- 审查失败保留原始事实，补派只补缺，等待不误杀、不空转。

### 范围内

- P1：M1 迁入、M4 测试改写、M2 改指准备、M3 救活两检查、M5 回收补覆盖、M6 材料按路径引用。
- P2：M7 效率四项（分账复算、定向补派与失败保留、短入口、停滞与取消）、D-044 契约改写、三份 workflow 方法文字。
- M8 母 PRD 同步已于 main `9ba93e11` 完成（`git log -1 -- specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`），本卡只在 AC-T4 读回。

## 澄清（spec-clarify）

trigger=true。以下 12 条均为 locked（来源已有决定），子代理不新增方向，不向用户提问。

- C-01 计数时间窗。来源 D-004、D-040、D-047、`-007` §6。所有会话日志计数必须写明时间窗起止与来源会话。decision-log `:335` 的「1.13 h（2.1%）」分母是会话创建以来 54.78 h；按 seed 后实际工作时段（`1791104237082` 起，5.809 h）人工等待 1.217 h，占 20.94%。验收按显式时间窗计算，两种分母都登记，不设阈值。
- C-02 定向补派不是复审。来源 D-016、D-048、`skills/wh-review/contracts/provider-protocol.md:36`。某来源启动失败或超时、调用方修复配置后只为该来源补派，属于补完同一次审查覆盖，不计入 D-048 次数；不自动触发；已返回语义结果原样保留、不重发。P2 在 `provider-protocol.md:36` 后加一句澄清，与 D-044 的 `:25` 改写同一 Task。
- C-03 分支 D 是真缺陷。来源 `-007` §2、契约 `provider-protocol.md:30-32`。四处：`skills/wh-review/scripts/simple-review-runner.mjs:1366-1378`、`:1427-1436`、`:1586-1597`、`runtime/review/review-record-route.mjs:72`（均实读一致）。必须保留原始成员结果与原始失败，不得自动 `findings: []` 覆盖已返回发现。
- C-04 M2 落点更正。来源 `-008` Q2。主仓代码零处写死外仓路径；`third-review-host-config.mjs`、`ocr-delegation-adapter.mjs` 不改；`runtime/review/review-packet-identity.mjs:155` 只是注释，可顺带更新。真正改指的是仓外 `~/.config/workflowhub/config.json` 的 `third_review.command[1]`。该改动列为「合入后配置切换与仓外保留」（见 12 节），合入前只做文档化与临时配置测试；主仓稳定 checkout 可用后，按 D-049 的本次真实持续授权自动执行既定路径切换，不逐次确认。
- C-05 M1 与 M4 同一 Task、同一提交。来源 `-008` Q4：只迁不改写会让 Vitest 新增 32 个 `No test suite found in file` 红文件。
- C-06 M3 豁免范围。来源 `-008` Q3。`TABLE_REL` 改读 `specs/archive/workflowhub-thin-core-card-06-20260919/attachments/migration-table.md` 后 residue 805/805、ledger 945/945 通过；迁入后 residue 报 `已删模块 SKILL 以新路径复活：skills/third-review/SKILL.md`（与 MT-3-143 `workflows/build-spec/SKILL.md` 碰撞）。D-017 豁免只覆盖这一个精确路径。
- C-07 M6 落点更正。来源 `-008` Q6，D-046 范围内。真冗余是 `execution-inputs` 下审查请求 JSON 内嵌同目录 `.md` 原件（sha256 已比对）；`approved_direction` 是提交时快照，不算。改点在 `tools/cli/stage-runtime.mjs` 的 review-record 分支输入解析：材料支持 `{ "ref": "<路径>", "sha256": "<hex>" }`，读回原字节并校验 sha256（D-046「路径与校验信息」）；`.wh-review-packets/` 只读隔离副本保留；多步过程输出不删（`provider-protocol.md:38-39`）。
- C-08 写集与顺序。来源 `-007` §8、`-008` Q8。P1 先、P2 后，串行。`tools/cli/stage-runtime.mjs` 按函数分工（见全局文件边界）。与 CARD-08 冻结的 `skills/stage-handoff/SKILL.md` 和五份 workflow 交接句零重叠；P2 只在 `workflows/build-code/SKILL.md:24`、`workflows/verify-code/SKILL.md:22`、`workflows/build-plan/SKILL.md:21` 加方法文字，并在 `skills/wh-review/SKILL.md:21`（第 5 步）加一句补派用法；P1 只拥有同文件 `:18`（第 2 步）的材料 ref 一句。冻结交接句实读位置：`workflows/build-code/SKILL.md:44`、`workflows/verify-code/SKILL.md:40`、`workflows/build-plan/SKILL.md:40`。两份 workflow 的第 1 步 `:15` 由 CARD-08 提交 `ca4095c7`（「docs: complete CARD-08 stage handoff contracts」）写入接续读取句，与交接方法同段，本卡不碰（F13 处置）。`:22`、`:24`、`:21` 实读 `git blame` 为 `77de3608`（早于 CARD-08），`skills/wh-review/SKILL.md:18`、`:21` 为 `6da46d6d`，均不含交接句。
- C-09 FR-58 复算落点。来源 `-007` §1/§7、D-013、D-024、D-035。只读、只写 stdout 的脚本放 `tests/acceptance/card-09-session-ledger.mjs`。实读惯例：`tests/acceptance/card-0{1,2,3,7}-current.mjs` 均未登记 `docs/architecture/move-map.json`（只作 consumer 出现），本卡沿用不登记。算法见实现设计。
- C-10 既有红基线登记。见 `### 既有红基线`。验收「无新增红」以该表为基线；不修既有红，M3 两份除外。
- C-11 M5 无需新注入点。来源 `-008` Q5。既有过期 runtime 只读解除与孤儿 manager/provider 回收两半仍只补测试、不重做（D-038/D-043）。终末验收 `quality/reviews/2026-10-05-017-verify-code-document.json` F02 另证实 manager 启动前私有 job/binding IO 失败残留；当前 Goal 下仅允许 `phases/P1.md#终末验收的定点纠错边界仅-017-f02` 的既有 broker 两符号失败回退及必要 EOF 测试例外，不改 API/identity/schema/成功字节/布局或其它 lib。
- C-12 M7 停滞升级。来源 `-007` §4。`waitForManagedTerminal`（`simple-review-runner.mjs:459-521`）无停滞判定；代码无「暂停」，只有取消。本规格给出停滞降频与取消的最窄设计；「暂停」按主会话裁定（m00277）实读迟到补充路径后回退为「停止等待＝沿既有取消链收场」，依据见 OPEN-C09-BP-001（已消解）。

## 3. 用户场景与状态覆盖

### SCN-001：维护者改动审查工具

维护者改 `skills/third-review/lib/**` 后跑针对性测试，结果出现在本仓 Vitest；`node tools/cli/run-checks.mjs` 检查技能包清单。异常：清单漏文件则 run-checks 报红。

### SCN-002：broker 回收孤儿与过期 runtime

过期 runtime 内含 broker 自写只读子树，属主已死；`cleanup` 先解锁再删除，孤儿进程被终止。异常：解锁失败、`EACCES`/`ENOTEMPTY`、孤儿残留。

### SCN-003：主会话提交审查请求

主会话写请求 JSON 时，材料写成 `{ "ref": "quality/evidence/execution-inputs/<文件>.md" }`，stage-runtime 读回原字节交 runner。异常：ref 指向不存在、符号链接、目录外路径，返回可控错误，不派发。

### SCN-004：某个审查来源启动失败

A 启动失败、B 超时、C 已返回发现。调用方修 A 配置后只补派 A；C 的原件不变；B 不因 A 的修复被无依据重派。异常：观察中断时已完成成员的原始结果与失败都保留。

### SCN-005：长时间等待审查

来源长时间无进展，轮询降频并给用户一次可读提示（继续等待 / 停止等待并收场）；来源恢复进展后恢复原频率。用户暂停（停止等待）与用户取消都沿既有取消链收场：自建后代与临时包被回收，已返回发现保留。

### SCN-006：阶段对账时复算时间与派发

阶段人读对账时点，主会话在独立上下文流式跑只读脚本，当场输出分账与计数，不落派生文件。

### 状态覆盖清单

| 状态 | 覆盖 |
| --- | --- |
| default | SCN-001、SCN-003、SCN-006 |
| empty | SCN-003：材料全为字符串时按旧格式读；SCN-006：时间窗内无事件输出 0 并自检 |
| error | SCN-002、SCN-003、SCN-004 |
| loading | SCN-005 |
| cancellation | SCN-005 |
| boundary | SCN-003 路径越界；SCN-006 时间窗裁剪 |
| permission | SCN-002 只读子树 |
| race | SCN-004 观察中断与成员完成同时发生 |

## 4. 产品事实与假设（PFACT）

- PFACT-001 verified：外仓 HEAD `97132960…`，109 个待迁文件（`-008` Q1，实读 `git ls-tree -r --name-only 97132960`）；外仓工作树另有未跟踪 `scripts/.omc/`，必须按 ls-tree 复制。关联 FR-C09-T2、AC-T2。
- PFACT-002 verified：主仓代码零处写死外仓路径，命令来自仓外宿主配置（`-008` Q2；`third-review-host-config.mjs:193-197`、`:531`）。关联 FR-C09-T2、AC-T2。
- PFACT-003 verified：`tools/cli/run-checks.mjs:100-111` 只对 `skills/catalog.yaml` 登记的技能做 `validateSkillBundle`（`runtime/adapters/local-skill-resolver.mjs:75-105`）与静态依赖检查（`runtime/evidence/skill-static-deps.mjs:51`）。关联 AC-T2。
- PFACT-004 verified：Vitest 默认 include 已覆盖 `skills/**/*.test.mjs`（`vitest.config.mjs`），无需改配置即可收集。关联 AC-T3。
- PFACT-005 verified：32 个测试文件 381 个 `test()`，需特殊处理 6 处 `t.mock` 与 1 处 `t.test`（`-008` Q4）。关联 AC-T3。
- PFACT-006 verified：`lib/runtime.mjs:119` `unlockForRemoval` 未导出、`:135` `cleanup(root, ttlHours)`；`lib/attachments.mjs:146` `lockTree`、`:185` `discardManagedAttachments`（外仓实读）。关联 FR-C09-043、AC-43。
- PFACT-007 verified：5 个请求文件共 637204 B，内嵌材料与同目录 `.md` sha256 一致（`-008` Q6）。决策稿 `:847` 的「458 KB / 550 KB」为旧估计，保留原样。关联 FR-C09-045、AC-45。
- PFACT-008 verified：`runtime/review/review-record-route.mjs:92` 只保存 `material_keys`，不保存材料正文；`tools/cli/stage-runtime.mjs:595-607` 已有任务目录与工作树两种根的只读文件读取。关联 AC-45。
- PFACT-009 verified：分支 D 四处丢失原始成员结果（C-03）。关联 FR-C09-059、AC-60。
- PFACT-010 verified：provider 选择只来自受信配置（`simple-review-runner.mjs:1187-1228`），请求侧没有来源子集参数。关联 AC-60。
- PFACT-011 verified：受管健康成员含 `last_progress_at_ms`（`review-provider-client.mjs:125`、`:274`）；`waitForManagedTerminal` 每 `pollMs` 轮询，无停滞判定（`simple-review-runner.mjs:459-521`）。关联 AC-62。
- PFACT-012 verified：代码无「暂停」，只有取消链路（`tools/cli/stage-runtime.mjs:953-968` → `review-record-route.mjs:93` → runner `cancelManagedReview`）。迟到补充（`skills/wh-review/scripts/review-provider-client.mjs:263-265` 字段与 `LATE_SUPPLEMENT_WINDOW_MS`、`:854-918` `registerReviewSupplement`；runner `:1628-1639`）只在同一次调用拿到 broker 终态结果时随结果一并写入；记录只经 `runtime/review/review-record-route.mjs:94` `appendRecord` 写一次新文件（`runtime/interface/safe-write.mjs:216`）；生产代码中 `statusManaged` 的唯一调用者是同一次调用内的 runner `:491`；`managedRequestId`（runner `:139`）每次随机。故调用方停止等待后没有入口取回终态或把迟到结果追加到原记录。证据：`grep -rn 'statusManaged\|registerReviewSupplement' runtime tools skills/wh-review/scripts` 与实读，2026-10-04。影响 AC-62、FR-C09-061。
- PFACT-013 verified：`reviewInstructionsFor`（`review-materials.mjs:479-575`）只给阅读顺序句，无风险与真实消费者导航；大 diff 超 288 KiB 分片（`:20`、`:592-643`）。关联 AC-61。
- PFACT-014 verified：会话日志 `zstd -dc` 为 JSONL，字段 `type/seq/time/data`；工具成对按 `data.message.toolCallId`（`-007` §6）。关联 AC-46、AC-59。
- PFACT-015 inferred：进程数受采样时刻污染（`-007` §6 在派发进行中采到 19 个进程）。来源 `-007` §6；限制：只在无派发的阶段边界采样才可比。关联 AC-46、AC-51。
- PFACT-016 verified：外仓 8 份 docs 在本仓 markdownlint 配置下有 2 处错误（`docs/workflowhub-result-v2.md:87` MD046、`docs/workflowhub-result-v3.md:26` MD001），迁入后 `pnpm check` 的 markdownlint 会红。关联 AC-T2。
- PFACT-017 not_applicable：UI。理由：本卡无界面，母 PRD `:518` `ui_applicability=non_ui`。关联全部 FR。

## 5. 功能需求

### 迁入与回归（C09-T）

- **FR-C09-T2**：外仓代码整仓迁入 `skills/third-review/`，按技能登记，宿主可改指。范围边界：搬 code/test/docs/SKILL.md/package.json/LICENSE/config.example.json，不搬 specs/、references/。依据：D-002、D-003、D-017、D-032、D-036、D-045、PFACT-001..003、PFACT-016。场景：SCN-001。验收：AC-T2。
- **FR-C09-T3**：32 个测试改写为 Vitest，挂入本仓回归并保留专用命令。依据：D-034、D-037、PFACT-004、PFACT-005。场景：SCN-001。验收：AC-T3。
- **FR-C09-T1**：每阶段开工前把声明的文件消费者、owner、命令与真实代码核对，对不上停下问人。依据：D-008、D-012。场景：SCN-006。验收：AC-T1。
- **FR-C09-T4**：母 PRD 同步可读回；provider 协议去掉固定墙钟截止并写清替代收场边界；D-027 保留清单未误删。依据：D-027、D-029、D-042、D-044。场景：SCN-005。验收：AC-T4。

### 资源（C09-R）

- **FR-C09-043**：broker 回收孤儿 manager/provider，并删除含只读子树的过期 runtime，以测试补覆盖。范围边界：不改 `lib/**`。依据：D-038、D-043、PFACT-006。场景：SCN-002。验收：AC-43。
- **FR-C09-045**：只合并已证明的真冗余：请求材料按路径引用，保留只读隔离副本与多步过程输出。依据：D-039、D-046、PFACT-007、PFACT-008。场景：SCN-003。验收：AC-45。
- **FR-C09-046**：真实派发行为被确定性计数验证，并在同负载前后对比。依据：D-004、D-031、D-040、D-047、PFACT-014、PFACT-015。场景：SCN-006。验收：AC-46、AC-51。

### 效率（C09-E）

- **FR-C09-058**：阶段对账时点现场复算时间分账，每个基本段恰好归属一次。依据：D-013、D-015、D-020、D-035、PFACT-014。场景：SCN-006。验收：AC-59。
- **FR-C09-059**：既定审查按真实来源保留成功、失败与语义发现；只为失败来源定向补派；修复后只复验受影响范围。依据：D-016、D-048、PFACT-009、PFACT-010。场景：SCN-004。验收：AC-60。
- **FR-C09-060**：昂贵调用前由现有 producer 暴露可控错误；审查包给短入口导航，完整原字节可达。依据：D-016、PFACT-013。场景：SCN-003、SCN-004。验收：AC-61。
- **FR-C09-061**：按工作包派发；无新事实不自动续发；有进展继续等待；暂停＝调用方停止等待，与取消同沿既有 owner 回收（OPEN-C09-BP-001 已消解）；可续暂停延期。依据：D-041、PFACT-011、PFACT-012。场景：SCN-005。验收：AC-62。

## 6. 模块划分

- 审查工具技能 `skills/third-review/`：迁入的 broker、adapters、CLI 与测试；owner P1。
- 审查宿主 `skills/wh-review/`：runner、provider client、材料打包、协议；P1 只改 `SKILL.md:18`（第 2 步）一句，P2 改 `SKILL.md:21`（第 5 步）一句与其余文件（`review-provider-client.mjs` 不改）。
- 运行时记录 `runtime/review/review-record-route.mjs`：审查事实唯一 producer；归 P2。
- 阶段入口 `tools/cli/stage-runtime.mjs`：按函数分工，见全局文件边界。
- 只读验收脚本 `tests/acceptance/card-09-session-ledger.mjs`：归 P2。

## 7. 关键实体

- 材料引用：`{ "ref": "<路径>", "sha256": "<hex>" }`，只出现在主会话写的请求 JSON；stage-runtime 读回并校验 sha256 后转为字符串即消失，不持久化新对象。
- 停滞观察：内存中前后两次轮询的 `(provider, status, last_progress_at_ms)` 比较结果；不落盘。
- 分账基本段：脚本内存结构，只输出到 stdout。

## 8. 数据和生命周期

- 请求 JSON：主会话 safe-write，任务目录 `quality/evidence/execution-inputs/`；修后只存 ref，原 `.md` 是唯一原件。
- 审查记录：`review-record-route.mjs:94` `appendRecord` 不可变新文件；本卡只增加失败保留字段与可选派发理由，不改写旧记录。
- 审查包：`.wh-review-packets/review-*` 临时只读副本，`bundle.dispose()`（`stage-runtime.mjs:937`）回收。

## 9. 兼容性预留

- 旧请求格式（材料为字符串）照常可读（D-046）。
- 宿主配置未改指前，旧外仓路径继续可用；改指只换 `command[1]`，可用备份回滚。
- 外仓 `/Users/Hugh/Hugh/Project/3rd-review` 原样保留作归档（不删除、不改写，迁入后不再作为宿主执行来源；基线 HEAD `97132960d7dab9145cbd0bdf610e09bf422e2ec0`）（D-003）。GitHub 端 `Hugh4424/3rd-review` 是否做 archive 属仓外动作，不在本卡；本卡不执行，留用户另行决定。

## 10. 明确不做与默认必须成立

### 明确不做

- 不限制并发（D-001、D-022）；AC-44 已撤销。
- 不采 CPU%、thermal、风扇（D-004、D-023）。
- 不新增 public command、stage、持久对象、永久遥测、调度器、progress trace、checkpoint permit（`prd.md:489`、D-024）。
- 不新增时间分账派生文件或报告文件（D-013、D-024、`CONSTITUTION.md:174`）。
- 不重写 CARD-06 已修调用缺陷（`prd.md:512`）；不改 CARD-08 接续职责、既有审查点、CARD-10 套件主体（`prd.md:489`）。
- 不重跑全 Phase 集成审查；环境层四项卡外（`prd.md:489`）。
- 不做精确浪费小时或收费 token 宣称（D-013）。
- 不修既有红基线（M3 两份除外）；不改仓外宿主配置（合入后按本次持续授权执行的既定 `third_review.command[1]` 路径切换除外，见 D-049）。
- simplicity-guard 自检：每项设计都复用既有入口（stage-runtime 输入解析、runner 轮询循环、record route catch、reviewInstructionsFor）；没有新增文件格式解析平台、准备命令或认证包装。

### 默认必须成立

- 质量缺失保持 `unknown`/`unavailable`/`incomplete`，不伪造通过。
- 原始失败、来源与原件字节不被摘要覆盖。
- 只跑受影响针对性测试，禁止无范围全量回归（`AGENTS.md` 测试硬规则）。

## 验收流程

每个 Phase 的 build-code 末步按 Appendix A 逐 AC 对账；P2 完成后在 build-code 第 10 步与 verify-code 第 8 步当场跑一次 `card-09-session-ledger.mjs`（D-035）。未取得原件的 AC 写 `inconclusive` 或 `unverified`，不写通过。

## 测试标准

只认目标断言真实失败为行为 RED；收集失败、夹具或环境失败单独记录。所有命令为针对性命令，见测试蓝图。

## 架构边界

不新增模块层级；新代码只在既有函数内或其相邻私有函数。`skills/third-review/` 作为普通技能目录，不进入 runtime Bundle（`runtime/distribution/runner-release.mjs` 不改）。

## 实现设计（全局权威）

### 代码锚点

| 锚点 | 实读位置 | 用途 |
| --- | --- | --- |
| 审查执行点 | `skills/wh-review/scripts/review-provider-client.mjs:1266` | M2 改指后的启动处 |
| 宿主配置读取 | `skills/wh-review/scripts/third-review-host-config.mjs:531` | 临时配置测试注入 `hostConfigPath` |
| 请求读取 | `tools/cli/stage-runtime.mjs:595-607`、`:896-900` | M6 ref 解析 |
| 停滞等待 | `skills/wh-review/scripts/simple-review-runner.mjs:459-521` | M7 降频 |
| 分支 D | 同文件 `:1366-1378`、`:1427-1436`、`:1586-1597`；`runtime/review/review-record-route.mjs:72` | 失败保留 |
| 来源选择 | 同文件 `:1187-1228` | 定向补派 |
| 审查包入口 | `skills/wh-review/scripts/review-materials.mjs:479-575`、`:645-679` | 短入口 |
| 取消链路 | `tools/cli/stage-runtime.mjs:953-968`、`review-record-route.mjs:93` | 取消观察 |
| 协议句 | `skills/wh-review/contracts/provider-protocol.md:25`、`:36` | D-044、C-02 |

### 接口与失败语义

- 材料引用（P1）：`resolveMaterialRefs(context, materials)` 私有函数，位于 `tools/cli/stage-runtime.mjs` 的 `readPlainInputFile` 之后。值为字符串时原样返回；值为恰好只有 `ref` 与 `sha256` 两个键的对象时，按 `readTaskBoundInput` 同一根规则（`quality/(tests|evidence)/` 前缀走任务目录，其余走工作树根）用 `readPlainInputFile` 读 UTF-8 文本，并对读回原字节算 sha256 与声明值比对，不一致即拒绝（D-046）；拒绝绝对路径、`..`、符号链接、多链接、目录外路径，错误码沿用 `TASK_FILE_INVALID`。读回后的字符串照常进入 runner，`review-materials.mjs` 不变。
- 失败保留（P2）：分支 D 三处 runner 结果保留 broker 已给出的每个成员原始 `status`、`error`、原始输出 ref 与已返回 findings；round 级 `status` 保持 `unavailable`，`error` 记原始失败码（`PROVIDER_RESULT_INVALID` / `REVIEW_MATERIAL_IDENTITY_MISMATCH`）。身份未认证的成员不得被提升为通过，也不得改写为 `failed`；`identity_authenticated: false` 成员的 findings 不进入 `record.findings`（不经 `review-record-route.mjs:76-79` partialFindings），原始字节只经该成员 `raw_output_ref` 保留。runner 抛错分支的 producer：runner 在 broker 等待点（`simple-review-runner.mjs:1313` startManaged、`:1325` consumeTerminal、`:1339` cancelManaged）捕获抛错，把已观察到的已结算成员附到错误上或转为 `unavailableResult`；`review-record-route.mjs:72` 的 catch 保留随错误附带的已结算成员与本轮已写的原始输出 ref，不再无条件 `provider_results: []`。若实现必须改 `review-provider-client.mjs`，STOP，AC-60 D 的该分支记 `unverified`。
- 定向补派（P2）：请求可带 `only_providers: string[]` 与 `dispatch_reason: string`。`only_providers` 必须是受信选择 `providerSelection.providers` 的非空子集，否则在 `:1228` 后以 `ROUTE_UNAVAILABLE` + `preflightDiagnostic` 返回、不派发；有 `only_providers` 时 `dispatch_reason` 必填。补派必须绑定原记录：请求带 `supplements: { "record_ref": "<原记录路径>", "record_sha256": "<hex>" }`；runner 读回原记录校验 sha256，要求原记录 `request.material_id` 存在且等于本轮 `material_id`、subject 元组相同、`only_providers` 是原记录未 completed 成员的子集，否则 `ROUTE_UNAVAILABLE`、不派发（材料已变化或原记录无 `material_id` 均拒绝）。record 的 `request` 增加 `only_providers`、`dispatch_reason`、`supplements` 与当前 `material_id`（`review-record-route.mjs:90` 现把 `material_id` 从结果解构丢弃；`runtime/review/schemas/result.schema.json` 的 `request` 为开放对象，不改 schema）。不自动触发，不重发未列来源。
- 停滞降频（P2）：`waitForManagedTerminal` 比较相邻两次观察的成员 `(status, last_progress_at_ms)`；连续 `stallPolls`（默认 12 次，即 60 s）无变化，轮询间隔翻倍至上限 60000 ms，并调用一次可选依赖 `onManagedStall({request_id, providers, unchanged_since_ms})`；任一成员有变化只恢复 `pollMs` 并复位连续停滞计数，不重置已提示标记；整次请求最多提示一次。停滞从不转成失败、不触发取消。stage-runtime 把 `onManagedStall` 接到一行 stderr 提示（选项：继续等待；Ctrl-C 取消，已返回发现会保留）。
- 短入口（P2）：`reviewInstructionsFor` 返回文本前加不超过 6 行的「先读」导航：按顺序列出风险/AC 所在材料键、真实消费者材料键、diff 入口（`changes.diff` 或 `diff-index.json`），每项给 manifest 相对路径；不复制正文、不截断任何材料。私有 navigation 数据只由 `buildReviewMaterials` 既有 instruction 调用一处传入（filtered 材料展开后的 keys/type、codePacket 与真实 diff 字节量），导航计算仍只在 `reviewInstructionsFor`；diff 入口须对齐既有规范化 diff 的实际布局，不改 writer、阈值、manifest 字段或其它 builder 逻辑。
- 会话分账脚本（P2）：`node tests/acceptance/card-09-session-ledger.mjs --session <dir|file> [--since <ms>] [--until <ms>] [--reviews <dir>]`，只读，stdout 输出 JSON。

### 会话分账算法

1. 输入：主会话与子代理 `session.v4.jsonl.zstd`（子代理 id 来自 `agent/inbox/spliced` 与 `user/message.data.source.senderSessionId`）、`quality/reviews/*.json` 的 `provider_results[].timing`、平台中断（`turn/end` `reason.kind=aborted` 且错误文本匹配安全策略）、`ask_user_question` call→result 区间。
2. 流式解压（`zstd -dc` 管道），不整份读入主上下文。
3. 裁剪到时间窗，取全部区间端点切成基本段。
4. 每段按优先级恰好归属一次：平台/安全策略中断 > 明确人工等待 > provider 活动 > 工具/子代理 > 未归因。
5. 自检：各类之和等于跨度，否则非零退出。
6. 计数：工具调用总数（按 name 分）、subagent 派发数、ask_user_question 次数与等待时长、主会话自行执行数；输出时间窗起止与来源会话、输入路径 sha256。

### 全局文件边界与依赖

| 路径 | 动作 | owner | 说明 |
| --- | --- | --- | --- |
| `skills/third-review/`（精确清单＝P1 T001 `git ls-tree -r --name-only 97132960` 输出减 `.gitignore`，109 个文件） | NEW | P1 | 迁入 + 测试改写；终末 017 F02 仅已有 broker.mjs 两符号与 managed-session-lifecycle.test.mjs EOF 7 用例，见 P1 定点纠错边界 |
| `skills/third-review/skill-bundle.json` | NEW | P1 | D-045；运行文件子集含 `SKILL.md` 的最小静态依赖闭包：仅已迁入的 `docs/exceptions.md`、`docs/workflowhub-result-v3.md`、`docs/cursor-adapter.md` 三件；不列测试或其余 docs |
| `skills/third-review/test/card09-orphan-reclaim.test.mjs` | NEW | P1 | M5 |
| `skills/catalog.yaml`、`repo-skills.manifest.json`、`skills/reuse-registry.md` | MODIFY | P1 | 登记 |
| `docs/architecture/move-map.json` | MODIFY | P1 | 生产文件登记 |
| `.markdownlint-cli2.jsonc` | MODIFY | P1 | 两个外仓 docs 精确忽略 |
| `package.json` | MODIFY | P1 | 专用命令 `test:third-review` |
| `tests/contract/thin-core-residue.test.mjs`、`tests/contract/card06-migration-ledger.test.mjs` | MODIFY | P1 | M3 |
| `tests/contract/card09-third-review-host-path.test.mjs` | NEW | P1 | M2 |
| `tests/contract/card09-material-ref.test.mjs` | NEW | P1 | M6 |
| `docs/adr/0001-two-layer-review-architecture.md`、`docs/adr/0032-review-chain-delegation-and-layer-contract.md` | MODIFY | P1 | 改指文档化 |
| `runtime/review/review-packet-identity.mjs` | MODIFY | P1 | 仅 `:153-155` 注释 |
| `skills/wh-review/SKILL.md` | MODIFY | P1 / P2 | P1 仅 `:18`（第 2 步）材料 ref 一句；P2 仅 `:21`（第 5 步）补派用法一句 |
| `tools/cli/stage-runtime.mjs` | MODIFY | P1 / P2 | 见下表 |
| `skills/wh-review/contracts/provider-protocol.md` | MODIFY | P2 | `:25`、`:36` |
| `skills/wh-review/scripts/simple-review-runner.mjs` | MODIFY | P2 | 分支 D、补派、停滞 |
| `runtime/review/review-record-route.mjs` | MODIFY | P2 | `:72`、`:92` |
| `skills/wh-review/scripts/review-materials.mjs` | MODIFY | P2 | 仅 `reviewInstructionsFor` 与 `buildReviewMaterials` 既有 instruction 调用一处透传私有 navigation 数据；不改其它 builder、diff writer/阈值或 manifest |
| `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` | MODIFY | P2 | 仅 T008 原 identity-gap case 经已审 TCR 的 oracle 加强与同 case 字节/hash、未认证非空 finding 反例；其它 case 不改；原件 `quality/evidence/execution-inputs/2026-10-05-002-card09-p2-t008-identity-oracle-tcr.json` |
| `tests/review/card09-targeted-dispatch.test.mjs`、`tests/review/card09-failure-preservation.test.mjs`、`tests/review/card09-short-navigation.test.mjs`、`tests/review/card09-stall-cancel.test.mjs` | NEW | P2 | AC-60/61/62 |
| `tests/acceptance/card-09-session-ledger.mjs`、`tests/acceptance/card-09-session-ledger.test.mjs` | NEW | P2 | AC-59/46/51 |
| `workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`workflows/build-plan/SKILL.md` | MODIFY | P2 | 只改 `:24`、`:22`、`:21` |

#### 共享写集分工

| 文件 | P1 段落 | P2 段落 |
| --- | --- | --- |
| `tools/cli/stage-runtime.mjs` | 新增 `resolveMaterialRefs`；review-record 分支 `:900` 请求构造处一行调用 | `onManagedStall` stderr 提示接线（`:60-84` 相邻）与 review-record 分支其余部分 |
| `skills/wh-review/**` | 只 `SKILL.md:18`（第 2 步）一句 | `SKILL.md:21`（第 5 步）一句；protocol、runner、`reviewInstructionsFor` 与 builder 既有 instruction 调用一处的私有 navigation 接线归 P2 修改；`review-provider-client.mjs` 不改 |

P2 开工首步读回 P1 合入后的 `stage-runtime.mjs` 行号再定位；行号漂移按函数名定位。

#### DO NOT TOUCH 与实读记录

| 路径 | 实读内容 | 命令与日期 |
| --- | --- | --- |
| `skills/stage-handoff/SKILL.md` | CARD-08 冻结 | `git log -1` 2026-10-04 |
| `workflows/build-code/SKILL.md:15`、`workflows/verify-code/SKILL.md:15` | 第 1 步「接续时读取 `skills/stage-handoff/SKILL.md`…」（CARD-08 `ca4095c7`） | `git blame` 2026-10-04 |
| `workflows/build-code/SKILL.md:44`、`workflows/verify-code/SKILL.md:40`、`workflows/build-plan/SKILL.md:40` | 交接句「阶段主会话执行 `skills/stage-handoff/SKILL.md` 保存交接…」等 | `read` 2026-10-04 |
| `vitest.config.mjs` | include 含 `skills/**/*.test.mjs`；pool forks maxForks 2 | `read` 2026-10-04 |
| `skills/wh-review/scripts/third-review-host-config.mjs`、`runtime/review/ocr-delegation-adapter.mjs` | 无外仓路径（C-04） | `-008` Q2，2026-10-04 |
| `skills/wh-review/scripts/review-provider-client.mjs` | `:265` `LATE_SUPPLEMENT_WINDOW_MS=600000` 必须保留 | `read` 2026-10-04 |
| `runtime/review/schemas/result.schema.json` | `request` 为 `{"type":"object"}`，additionalProperties true | `node -e` 2026-10-04 |
| `~/.config/workflowhub/config.json` | `third_review.command=["node","/Users/Hugh/Hugh/Project/3rd-review/scripts/3rd-review.mjs"]` | `-008` Q2，合入前不改 |

### 需求到任务追踪

| 来源 | FR / AC | Phase/Task | Oracle |
| --- | --- | --- | --- |
| R-001..R-008、R-021；D-008、D-012 | FR-C09-T2 / AC-T2；FR-C09-T3 / AC-T3；FR-C09-T1 / AC-T1 | P1/T001 | ORACLE-P1-MIGRATE |
| R-001..R-008、R-021 | FR-C09-T2 / AC-T2 | P1/T002 | ORACLE-P1-REGISTER |
| R-001..R-008、R-021 | FR-C09-T2 / AC-T2 | P1/T003 | ORACLE-P1-RESIDUE |
| R-001..R-008、R-021 | FR-C09-T2 / AC-T2 | P1/T004 | ORACLE-P1-HOSTPATH |
| R-001（母 FR-43） | FR-C09-043 / AC-43 | P1/T005 | ORACLE-P1-RECLAIM |
| R-003（母 FR-45）、R-004（母 FR-46）、R-008（母 FR-61） | FR-C09-045 / AC-45；FR-C09-046 / AC-46、AC-51；FR-C09-061 / AC-62 | P1/T006 | ORACLE-P1-MATREF |
| R-006（母 FR-59）；D-027、D-029、D-042、D-044；D-008、D-012 | FR-C09-T4 / AC-T4；FR-C09-059 / AC-60；FR-C09-T1 / AC-T1 | P2/T007 | ORACLE-P2-PROTOCOL |
| R-006（母 FR-59） | FR-C09-059 / AC-60 | P2/T008 | ORACLE-P2-PRESERVE |
| R-006（母 FR-59） | FR-C09-059 / AC-60 | P2/T009 | ORACLE-P2-DISPATCH |
| R-008（母 FR-61） | FR-C09-061 / AC-62 | P2/T010 | ORACLE-P2-STALL |
| R-007（母 FR-60）、R-008（母 FR-61） | FR-C09-060 / AC-61；FR-C09-061 / AC-62 | P2/T011 | ORACLE-P2-NAV |
| R-005（母 FR-58）、R-004（母 FR-46）、R-008（母 FR-61） | FR-C09-058 / AC-59；FR-C09-046 / AC-46、AC-51；FR-C09-061 / AC-62 | P2/T012 | ORACLE-P2-LEDGER |
| R-005（母 FR-58）、R-006（母 FR-59）、R-008（母 FR-61） | FR-C09-058 / AC-59；FR-C09-059 / AC-60；FR-C09-061 / AC-62 | P2/T013 | ORACLE-P2-METHOD |

来源列的 R 编号为本卡局部 source_id（`decision-log.md` 原始需求索引）；每行 FR / AC 与对应 Task 卡「来源 / FR / AC」一致，按 FR 汇总即原 FR→Task 对应关系不变。

### 全局验证策略

只跑下列针对性命令；全部带文件范围。Phase 门禁不让既有红经 `&&` 阻断后续检查：无既有红的命令须退出 0；含既有红的文件按「既有红基线」逐文件逐失败名比对，失败名集合是基线子集（无新增红）才算过，新增红逐条列出。

- P1：`npx vitest run skills/third-review/test`、`npx vitest list --filesOnly skills`、`npx vitest run tests/contract/thin-core-residue.test.mjs tests/contract/card06-migration-ledger.test.mjs`、`npx vitest run tests/contract/card09-third-review-host-path.test.mjs tests/contract/card09-material-ref.test.mjs tests/contract/stage-runtime-preflight.test.mjs tests/contract/review-materials-contract.test.mjs`、`node tools/cli/run-checks.mjs`、`node tools/cli/verify-structure.mjs`、`npx markdownlint-cli2 <本 Phase 改动 md>`。
- P2：`npx vitest run tests/review/card09-*.test.mjs tests/review/review-record-route.test.mjs tests/review/review-managed-lifecycle.test.mjs`、`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`（对基线失败名单逐名比对）、`npx vitest run tests/acceptance/card-09-session-ledger.test.mjs`、`npx vitest run tests/contract/review-materials-contract.test.mjs tests/contract/ocr-review-contract-bundle.test.mjs`、`npx markdownlint-cli2 <本 Phase 改动 md>`。

### 既有红基线

| 测试 | 基线 | 归因 | 来源命令 |
| --- | --- | --- | --- |
| `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` | 38 红 / 111；失败名单由 P2 T007 开工前实跑保存为 `quality/tests/<日期>-card09-p2-runner-baseline.txt` | 真红 | `npx vitest run <file>`（`-007` §9） |
| `tests/contract/ocr-delegation-adapter.test.mjs` | 3 红 / 46 | TMPDIR 符号链接伪红 | 同上；`TMPDIR=/private/tmp/<dir>` 下 46/46 |
| `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs` | 2 红 / 25 | TMPDIR 伪红 | 同上 |
| `tests/contract/external-supplement-window.test.mjs` | 2 红 / 4 | 真红 `PROTOCOL_INCOMPATIBLE` | 同上 |
| `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs` | 1 红 / 34 | `TypeError: unknown review stage build-spec` | 同上（`-008` Q9） |
| `skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs` | 2 红 / 7 | `MATERIAL_INCOMPLETE` 文本不符 | 同上 |
| `tests/contract/thin-core-residue.test.mjs`、`tests/contract/card06-migration-ledger.test.mjs` | collect 失败 | 本卡修（M3） | 同上 |
| `tests/host-independence.test.mjs` | 红 `TypeError: The "path" argument must be of type string. Received undefined` | 既有 | 同上 |
| 外仓 `test/cli-lifecycle.test.mjs:81`（`:71` 用例「CLI returns a parseable v2 group instead of exit 2 when one provider output contains a private path」） | 1 红 / 385（`node --test` 运行计数；静态 `test()` 381，t.test 拆分致口径差） | actual `'completed'` expected `'failed'` | `node --test test/*.test.mjs`（外仓） |

迁入后外仓这 1 红随文件进入本仓，按原因登记为既有红，不在本卡修。

## Appendix A — 验收判据（唯一权威）

口径 A：会话日志元数据只证明事件计数（调用、派发、时长、人工等待）；进程数、文件数、字节量须另有原件（`ps`、文件统计命令输出）。口径 B：所有修前/修后数字写采样范围（轮次、目录、时间窗起止、来源会话），两种分母都登记（C-01）。

- [ ] **AC-43**：broker 回收孤儿 manager/provider，并删除含 broker 自写只读子树的过期 runtime；关联 FR-C09-043；母 AC-43。
验证：在临时 root 构造过期 runtime（`expires_at_ms=0`、属主 pid 已死），内含 `lockTree` 只读子树（目录 0o500、文件 0o400）与慢速孤儿 provider 子进程；调用 `cleanup(root, ttl_hours)`（必要时两次），另对附件路径单独调用 `discardManagedAttachments`。
通过：五项全真：①runtime 目录 `existsSync` 为 false；②只读子树被解锁后删除且未抛错；③返回的清理标识数等于构造数；④按 pid 查无残留 broker/manager/provider 进程；⑤`discardManagedAttachments` 后附件目录不存在。
失败：`EACCES`/`ENOTEMPTY`、孤儿残留、数量不符，或只验 runtime 未验附件。
证据：`npx vitest run skills/third-review/test/card09-orphan-reclaim.test.mjs` 原始输出与测试内 `ps -o pid= -p <pid>` 结果，存任务 `quality/tests/`。

- [ ] **AC-44**（not_applicable）：已撤销（D-001、D-022）；不验证。
验证：无。
通过：无。
失败：无。
证据：decision-log D-001。

- [ ] **AC-45**：只合并真冗余后，同一审查任务的写入量可测下降；关联 FR-C09-045；母 AC-45。
验证：修前样本＝T006 改代码前对四处统计文件数与字节数：①`quality/evidence/execution-inputs/`；②`quality/tests/`；③`quality/reviews/`（含 `*.output`）；④`work/<key>/bundle/materials/`（provider 只读工作区）。修后样本＝用同一批材料（修前样本的请求文件 `quality/evidence/execution-inputs/2026-10-04-009-card09-build-plan-merged-review-request.json`）按 ref 形态重建请求文件，只做构建与预检、不派发 provider（D-048），比较 ①execution-inputs 的文件数与字节。②③④ 按设计不受 ref 改动影响，由测试断言 packet/bundle 内材料字节与修前一致来证明。不用合入后自然发生的下一次审查（负载不同，不可比），也不为测量另派审查。`.wh-review-packets` 的生成与 dispose 另记，不算冗余。并跑 ref 读回与 sha256 校验测试。
通过：execution-inputs 内已证明重复的内嵌材料被 ref 取代，字节数可测下降；ref 读回字节与声明 sha256 一致，不一致被拒；packet/bundle 内材料字节与修前一致（只读隔离副本不变）；旧字符串格式仍可读。
失败：不降、无测量、未证明重复就删除、破坏隔离副本、ref 读回字节不一致。无真冗余可合并，或重建请求必须派发 provider 才能产生时，记 `inconclusive`（D-039、D-046、D-048）。
证据：修前四处与修后 execution-inputs 各一份 `find <dir> -type f | wc -l` 与字节求和命令原始输出、重建请求文件与预检输出、`npx vitest run tests/contract/card09-material-ref.test.mjs` 原始输出，存 `quality/tests/`。

- [ ] **AC-46**：真实派发行为被确定性计数验证；关联 FR-C09-046；母 AC-46。
验证：按显式时间窗对本卡实际会话采集六项：①主会话工具调用总数；②subagent 派发次数；③ask_user_question 次数与人工等待时长；④主会话自行执行次数（按工具名）——来自会话日志；⑤进程数——`ps -axo pid=,ppid=,comm=` 在无派发的阶段边界采样（修前由 P1 T006 改代码前采，修后由 P2 T012 采）；⑥文件数与写入字节量——文件统计命令。
通过：六项均有原件可复算，且有实测数字与时间窗、来源会话；不设阈值（D-047）。
失败：缺原件、估计值、⑤⑥归到会话日志、采样外推，或计数无时间窗。会话日志取不到记 `inconclusive`。
证据：①–④ 由 `card-09-session-ledger.mjs` 在 build-code 第 10 步与 verify-code 第 8 步当场运行并展示（D-035），不落文件（D-013），修前时间窗用 `--since/--until` 对会话日志原件复算；脚本正确性由 `npx vitest run tests/acceptance/card-09-session-ledger.test.mjs` 的原始输出证明；⑤⑥ 的 `ps` 与文件统计命令原始输出存 `quality/tests/`。

- [ ] **AC-51**：同一工作负载修前/修后对比；关联 FR-C09-046；母 AC-51。
验证：同一审查任务、相同输入规模，修前/修后各一次，指标为调用数、派发数、自行执行数、人工等待、进程数、文件数与字节；与 AC-46 共享同一次采集。会话计数的修前窗＝P1 首个代码提交前的本卡会话时间窗，修后窗＝P2 完成时的时间窗，两窗都由 T012 同一脚本只读复算；进程数修前由 T006、修后由 T012 采样。
通过：各指标可测下降或持平，持平写理由；固定变量（提交、配置、负载）有记录。
失败：无对比宣称改善、`inconclusive` 写成改善、采样外推。无法复现同负载记 `inconclusive`，不算失败也不写改善。
证据：同 AC-46，另附两次采样的提交 hash 与时间窗。

- [ ] **AC-59**：于既有阶段人读对账时点现场复算时间分账；关联 FR-C09-058；母 AC-59。
验证：在 build-code 第 10 步与 verify-code 第 8 步各当场跑一次 `node tests/acceptance/card-09-session-ledger.mjs`，输入为同类原始时间戳与一组重叠 provider 区间（如 `quality/reviews/2026-10-04-027-make-decision-direction.json`），并跑合成夹具测试。
通过：五项全真：①各类合计等于总跨度；②人工等待与平台中断各单列；③未知归 `unattributed`；④实际完成两次条件可比的分账：修前窗（P1 首个代码提交前）与修后窗（P2 完成）用同一脚本，并记修前/修后提交、配置与差异；⑤每个基本段恰好归属一次，重叠取并集不重复计时（如 027 的 provider 并集 555.258 s，而非累计 29.10 min）。
失败：只做一次、以累计代替区间、重复或漏归属、并发相加、平台中断混入人工等待、落派生报告文件。
证据：验收时在 build-code 第 10 步、verify-code 第 8 步当场运行并展示（D-035），不落文件（D-013）；脚本正确性由 `npx vitest run tests/acceptance/card-09-session-ledger.test.mjs` 的原始输出证明（存 `quality/tests/`）；修前时间窗用 `--since/--until` 对会话日志原件复算，修前/修后提交、配置与差异在当场展示中写明。

- [ ] **AC-60**：审查按真实来源保留结果，只为失败来源定向补派；关联 FR-C09-059；母 AC-60。
验证：四场景：A 启动失败、B 超时、C 已返回语义发现、D 观察中断/身份不匹配/绑定失败/runner 抛错。修 A 配置后带 `only_providers=[A]` 与 `dispatch_reason` 补派。
通过：只启动 A；C 原件字节不变且不重发；B 不因 A 的修复被重派；D 四处保留成员原始 `status`、`error` 与已返回发现，round 保持 `unavailable` 并记原始错误码；每次补派在记录 `request` 中有派发理由；修 finding 后复验范围限于受影响 file/case 并写明理由（方法文字）。
失败：未变化来源反复耗尽预算、成功结果重发、全量重测、原失败被删或写为空 findings、身份未认证成员被提升为通过、旧结果反绑新材料、自动触发补派。
证据：`npx vitest run tests/review/card09-targeted-dispatch.test.mjs tests/review/card09-failure-preservation.test.mjs` 原始输出，存 `quality/tests/`。

- [ ] **AC-61**：昂贵调用前暴露可控错误，审查包给短入口且完整原字节可达；关联 FR-C09-060；母 AC-61。
验证：路径/后缀缺失、来源配置冲突、错误 lifecycle、解析不匹配四种输入，以及一个大于 288 KiB 的完整 diff 样本；同一审查范围比较修前/修后入口 bytes 与需读索引量；另记实际阅读范围与真实完成时间（`prd.md:508`）：真实完成时间取记录 `started_at`/`completed_at`，实际阅读范围取 provider 原件中可观察的读取项，不可观察时记 `inconclusive`。
通过：四种输入各由现有 producer 返回可控错误（错误码与 `preflightDiagnostic` 字段），不派发；导航每项指向 manifest 中真实存在的路径，指向字节与复制字节 sha256 一致；完整 diff、合同、AC 不截断；到达风险/AC 所需打开的条目数可测下降（入口 bytes 同时记录）。
失败：索引指向不存在字节、与复制字节不一致、入口无差别膨胀、正文截断或漏 AC、以 `selected_files` 冒充全部阅读、以命令存在冒充能力。不能复现不报改善；实际阅读范围不可观察记 `inconclusive`，不算失败。
证据：`npx vitest run tests/review/card09-short-navigation.test.mjs` 原始输出，存 `quality/tests/`。

- [ ] **AC-62**：按包派发，停滞降频不误杀，取消回收可观察；关联 FR-C09-061；母 AC-62。
验证：用假 broker 构造已停滞请求与仍有进展请求，含延迟返回、用户暂停与用户取消；同一工作包修前/修后比较四类运行度量，P1、P2 各作为一个工作包：协调次数＝T010 轮询次数 + T012 派发与消息计数；重复读取＝T012 同路径重复读取次数；材料量＝T011 入口 bytes + T006 请求文件 bytes；交付耗时＝T012 分账跨度。逐包五字段为文档属性，读 P1/P2 工作包声明。暂停按 OPEN-C09-BP-001 消解定义＝调用方停止等待并沿既有取消链收场：在停滞提示出现后停止等待，与任意时点的取消各断言一次。
通过：停滞请求轮询间隔增长且只提示一次，不转失败、不自动取消；有进展请求保持原频率并正常完成；延迟返回在等待期内被接收；暂停与取消两条路径各自可观察：broker cancel 恰好调用一次，自建后代进程不存在、临时包目录不存在、已返回发现保留、记录为 `unavailable` + `REVIEW_CANCELLED`；四类度量各有可复算的前后数字（缺原件或无法复现同负载时该项记 `inconclusive`，不写 pass 也不写改善，不算失败）；逐包五字段（输入、写集、owner、完成证据、成本假设）齐全可读。
失败：无新事实自动整轮续跑、过度消息链、wait timeout 当失败、误杀健康请求、跳质量检查、假完成、暂停或取消后后代残留或发现丢失、把暂停写成「迟到结果可追加到原记录」、逐包五字段缺任一项、把 `inconclusive` 度量写成通过或改善。两类分界：五字段是文档属性，缺即失败；四类运行度量依赖原件与同负载复现，取不到记 `inconclusive`（D-004、口径 B、`## 验收流程`）。
证据：`npx vitest run tests/review/card09-stall-cancel.test.mjs` 原始输出，存 `quality/tests/`。

- [ ] **AC-T1**：每阶段开工前对齐声明与真实代码；关联 FR-C09-T1。
验证：build-plan、build-code、verify-code 开工首步，把声明的文件消费者、owner、命令与实读代码逐条核对。
通过：三阶段各有一份核对记录（build-plan 为本文件 `#### DO NOT TOUCH 与实读记录` 与代码锚点表；后两阶段为 Phase 首个 Task 首步记录）；对不上时有停下问人的记录。
失败：任一阶段缺记录，或对不上仍继续。
证据：本文件；build-code/verify-code 的阶段交接原件。

- [ ] **AC-T2**：外仓整仓迁入并可被宿主与检查使用；关联 FR-C09-T2。
验证：读迁入目录、登记与检查输出。
通过：①`skills/third-review/` 含 `SKILL.md`、`lib/**`、`scripts/**`、`test/**`、`docs/**`（8 项：`2026-07-22-antigravity-pi-runtime-support-design.md`、`2026-07-23-workflowhub-managed-session-design.md`、`adr/`、`archive/`、`cursor-adapter.md`、`exceptions.md`、`workflowhub-result-v2.md`、`workflowhub-result-v3.md`）、`config.example.json`、`package.json`、`LICENSE`；②不存在 `specs/rewrite-universal-review`、`specs/zhi66`、`references/ac1-inconclusive-token.log`；③`SKILL.md` 来源行含 `v4.0.0` 与 `97132960d7dab9145cbd0bdf610e09bf422e2ec0`；④临时宿主配置指向新路径时解析成功且命令可启动（无 `wh_review.profiles/priority` 旧键报错）；⑤`skill-bundle.json` 存在，bundle `files[]` 只列运行文件子集，且与实际迁入文件一致，登记进 `skills/catalog.yaml` 后 `node tools/cli/run-checks.mjs` 退出 0；⑥两份 M3 检查从 collect 失败变为通过，迁入后仍通过，且仍能真实检出残留（豁免只覆盖 `skills/third-review/SKILL.md`）。
失败：任一项不成立；豁免放宽到 basename 或其它路径；改仓外配置未经用户确认。此项授权要求不撤销：本次用户真实原话及其来源、sha256 见 D-049，该持续授权覆盖合入后的既定 `third_review.command[1]` 路径切换，无须逐次确认；不能据此改其它配置或扩范围。
证据：`node tools/cli/run-checks.mjs`、M3 两份与 host-path 测试原始输出，存 `quality/tests/`。

- [ ] **AC-T3**：32 个测试改写为 Vitest 并挂入回归；关联 FR-C09-T3。
验证：改写后在默认 Vitest 配置下列出与运行。
通过：①32 个文件不再 import `node:test`（保留 `node:assert/strict`）；②`npx vitest list --filesOnly skills` 列出全部 32 个文件（`pnpm test:skills` 与无参 `npx vitest run` 共用同一 include），`npx vitest run skills/third-review/test` 跑通（细化：命令形态由 build-plan 落定；`decision-log.md` AC-T3 原写「`pnpm test:skills` 与 `npx vitest run` 两条命令均能扫到并跑通」，因两者共用同一 include 且 AGENTS.md 禁无范围全量运行，改为列出 + 定向运行）；③根 `package.json` 有专用命令 `test:third-review`；④相对既有红基线无新增红，新增红逐条列出。
失败：只能用专用命令跑、被 exclude 静默不跑、新增红未登记。
证据：`npx vitest list --filesOnly skills` 与 `npx vitest run skills/third-review/test` 原始输出，存 `quality/tests/`。

- [ ] **AC-T4**：母 PRD 同步可读回，协议无固定截止且保留清单未误删；关联 FR-C09-T4。
验证：读回命令。
通过：①`git log --oneline -1 -- specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` 指向 `9ba93e11` 或其后同步提交；②`grep -n "600000" skills/wh-review/contracts/provider-protocol.md` 无匹配；③协议有「显式调用方取消」与「ownerloss guardian」两条收场路径文字；④`LATE_SUPPLEMENT_WINDOW_MS = 600000`（`review-provider-client.mjs:265`）、`DEFAULT_MANAGED_STATUS_POLL_MS`（`simple-review-runner.mjs:32`）、`REVIEW_BROKER_TIMEOUT_FROM_ENV`、`DEFAULT_EXECUTOR_CANCELLATION_GRACE_MS = 30_000`、supervisor `Date.now() + 5000` 仍在。
失败：任一项不成立。
证据：四条读回命令原始输出，存 `quality/tests/`。

## 测试蓝图（testing-system-blueprint）

| Task | 风险维度 | 层级 / 执行者 | Oracle | 覆盖限制 |
| --- | --- | --- | --- | --- |
| T001 | 跨模块 seam、行为结果 | feature / 实施子代理 | ORACLE-P1-MIGRATE | 外仓 1 红随迁；cursor keychain 测试依赖 macOS |
| T002 | 可观测性/来源 | simple | ORACLE-P1-REGISTER | 只证清单一致，不证分发 |
| T003 | 行为结果 | simple | ORACLE-P1-RESIDUE | 只证一个路径豁免 |
| T004 | 权限/安全、跨模块 seam | simple | ORACLE-P1-HOSTPATH | 不读真实用户配置 |
| T005 | 错误/取消/恢复、权限、并发 | feature | ORACLE-P1-RECLAIM | 依赖本机 `ps` |
| T006 | 状态/数据流、权限/安全 | feature | ORACLE-P1-MATREF | 只覆盖 review-record 分支 |
| T007 | 可观测性/来源 | simple（G-2） | ORACLE-P2-PROTOCOL | 文档读回 |
| T008 | 错误/恢复、并发/原子性 | feature | ORACLE-P2-PRESERVE | 假 broker |
| T009 | 行为结果、权限 | feature | ORACLE-P2-DISPATCH | 假 broker |
| T010 | 错误/取消/恢复、并发 | feature | ORACLE-P2-STALL | 假时钟与假 broker |
| T011 | 行为结果、可观测性 | feature | ORACLE-P2-NAV | 只证导航与字节 |
| T012 | 可观测性/来源 | feature | ORACLE-P2-LEDGER | 合成夹具 + 一次真实会话 |
| T013 | 可观测性 | simple（G-2） | ORACLE-P2-METHOD | 文档读回 |

UI 维度全部 N/A（PFACT-017）。每 Task 的场景、夹具、命令、预期退出码与证据位置在对应 Phase 文件的 Task 卡。行为 RED 只认 Task 卡写明的目标断言真实失败；收集失败、TMPDIR 伪红、外仓既有红单独记录。

## 测试路线（test-routing-advisor）

- simple：T002、T003、T004（静态登记与小测试）；T007、T013 为纯方法/契约文字，走 G-2：RED 证据写 `N/A`，客观替代为读回命令（`grep`、`markdownlint-cli2`）与独立文档审查。
- feature：T001、T005、T006、T008–T012，各有新测试文件与目标断言。
- fullstack：无（非 UI、无部署）。
- 本阶段未运行任何新测试；所有 Task 的 RED 证据当前为 `unavailable — 尚未取得真实 RED`，不称 RED。

## UI readiness

不适用。理由：本卡无界面、无设计稿（母 PRD `:518` `ui_applicability=non_ui`），所有改动为技能代码、CLI 解析、测试与方法文字。

## 审查处置

审查记录：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-09-20260919/quality/reviews/2026-10-04-051-build-plan-document.json`（provider 原件 `-046`..`-050`；请求 `quality/evidence/execution-inputs/2026-10-04-009-card09-build-plan-merged-review-request.json`）。处置草稿：同目录 `quality/evidence/execution-inputs/2026-10-04-010-card09-build-plan-review-disposition-draft.md`。同根因组：G1 成本假设字段；G2 修前采样无 Task；G3 AC-62 度量来源；G4 修后样本；G5 既有红阻断门禁。

| 编号 | severity | 来源 | 问题一句 | 处置 | 改动位置或反证 |
| --- | --- | --- | --- | --- | --- |
| F01 | major | kimi | AC-46 进程数修前原件无 Task 生产 | fixed（G2） | P1 T006 动作① 加修前 `ps`、证据 `…-p1-t006-ps-before.txt`；P1 Done 不再宣称已取得；AC-46 ⑤ |
| F02 | major | kimi | 工作包无「成本假设」字段 | fixed（G1） | P1、P2 工作包声明各加 `成本假设` 行 |
| F03 | minor | kimi | T007 门禁漏读回 AC-T4④ 两项常量 | fixed | P2 T007 门禁加 `ocr-delegation-adapter.mjs:12`、`:1333` 两条 grep，且以 `git log` 起头使门禁可执行 |
| F04 | minor | kimi | 「通过数 ≥ 384」与 381/385 口径不一 | fixed | P1 T001 GREEN＝收集用例数 − 1；`#既有红基线` 记 385/381 口径差 |
| F05 | major | pi | AC-62 四类度量只有轮询次数 | fixed（G3） | 同 F23 |
| F06 | major | pi | AC-51 修前采集无 Task | fixed（G2） | 同 F01；AC-51 验证写修前窗/修后窗 |
| F07 | minor | pi | P2 并行句与串行顺序矛盾 | fixed | P2 并行方案改为「T007→T013 同一实施会话串行」 |
| F08 | minor | pi | `package.json` 未限定哪份 | fixed | P1 T001 动作④ 写 `skills/third-review/package.json`，根只加 `test:third-review` |
| F09 | minor | pi | 修后未测四处、未断言隔离副本 | fixed（G4） | 同 F30 |
| F10 | minor | pi | 同 F02 | fixed（G1） | 同 F02 |
| F11 | major | flash | 同 F02 | fixed（G1） | 同 F02 |
| F12 | major | flash | gate_cmd 被既有 1 红阻断 | fixed（G5） | 同 F14 |
| F13 | minor | flash | verify-code 无「开工首步核对」 | accepted_risk | 草稿修法要改 `workflows/verify-code/SKILL.md:15`、`workflows/build-code/SKILL.md:15`，两行是 CARD-08 `ca4095c7` 交接段第 1 步，按 C-08 不扩写集。现有 `:15` 已要求读真实入口、消费者、diff 与完整 AC（verify-code）、核真实工作区与允许写集（build-code），但 verify-code 未逐字写「对不上停下问人」。残余风险：verify-code 核对记录靠阶段主会话自觉。owner：CARD-09 verify-code 阶段主会话，在阶段交接写核对记录；后续改该段由 CARD-08 交接段 owner 决定。T013① 撤回错放在第 10 步的开工核对句 |
| F14 | major | opus | 同 F12 | fixed（G5） | P1 gate_cmd 拆为两条各自执行，按既有红失败名比对；`#全局验证策略` 写通用规则 |
| F15 | major | opus | 无逐文件清单、docs 计数、`git archive` | fixed（部分驳回） | 驳回：`git ls-tree -r --name-only 97132960` 计 110＝109＋`.gitignore`，docs 8 项属实，提交不跟踪 `specs/`、`references/`。成立：`git archive` 带入 `.gitignore`。改 `#全局文件边界与依赖` 清单定义、P1 T001 ② 只逐文件 `git show`、证据加清单原件 |
| F16 | major | opus | ref 无校验信息 | fixed | C-07、`#关键实体`、`#接口与失败语义` 材料引用改 `{ref, sha256}` 读回校验（D-046）；P1 T006 ③ 加不符被拒 |
| F17 | major | opus | 修后靠手改、主会话未被要求用 ref | fixed（G4） | P1 T006 ④ SKILL 句改为「已落盘时写 ref（带 sha256），不再内嵌」；修后样本按主会话裁定 ③（AC-45） |
| F18 | major | opus | 同 F01，AC-59 两次可比未说明 | fixed（G2） | AC-59 ④、P2 T012 ⑤ 修前窗/修后窗同一脚本 |
| F19 | major | opus | `only_providers` 透传与用法说明 | fixed（部分驳回） | 驳回：`tools/cli/stage-runtime.mjs:900` `request={...original,…}`、`runtime/review/review-record-route.mjs:71` `runRound({...request,…})` 整体展开，字段不丢。成立：测试未走真实入口、无用法。P2 T009 加经 `review --action=record` 的用例；`skills/wh-review/SKILL.md:21` 一句归 P2 |
| F20 | major | opus | 补派与原记录无绑定 | fixed | `#接口与失败语义` 定向补派、P2 T009 ② 加 `supplements{record_ref, record_sha256}` 与 `material_id` 比对（记录 `request` 增写 `material_id`，`review-record-route.mjs:90` 现丢弃） |
| F21 | major | opus | runner 抛错分支无 producer | fixed | `#接口与失败语义` 失败保留、P2 T008 ③：runner 在 `:1313`/`:1325`/`:1339` 捕获并附已结算成员；需改 client 即 STOP、记 `unverified` |
| F22 | major | opus | 身份不符成员 findings 进入发现集 | fixed | P2 T008 ④ 与 RED：`identity_authenticated: false` 成员 findings 不进 `record.findings`，原字节经 `raw_output_ref` |
| F23 | major | opus | AC-62 度量与五字段无 Task 产出 | fixed（G3、G1） | AC-62 验证写四类来源（T010/T011/T012/T006）；P2 T010 GREEN、T011 ④、T012 ⑤；追踪表 AC-62 挂 T006、T010–T013 |
| F24 | minor | opus | runner 基线只有计数 | fixed | P2 T007 ④ 保存失败名单 `…-p2-runner-baseline.txt`；P2 Done 与 T008 按名比对 |
| F25 | minor | opus | 共享写集「改/不改」混写 | fixed | `#共享写集分工` wh-review 行改写 |
| F26 | minor | opus | 索引复制写集/消费者成双源 | rejected_invalid | 列格式是投影契约：`runtime/stage/stage-content-contracts.mjs:885-896` 要求 6 列，`:1045-1047` 要求 Phase 头写入集等于索引，`:1064-1066` 消费者相等；`skills/spec-tasks/SKILL.md:10` 同规定；`runtime/review/provider-material-projection.mjs:126-127` 要求 Execution Index |
| F27 | minor | opus | 改指无 owner/证据，「唯一副本」提前 | fixed | `#合入后配置切换与仓外保留` 加负责人与 doctor 证据路径；`## 2.` 目标改为改指完成后才唯一 |
| F28 | minor | opus | 成员可能不允许 `identity_authenticated` | rejected_invalid | `runtime/review/schemas/result.schema.json:600` provider_results 成员 `"additionalProperties": true`；`runtime/review/review-record-route.mjs:36` `providerFact` 以 `{...member}` 保留 |
| F29 | minor | opus | AC-61 缩减实际阅读范围与真实完成时间 | fixed | AC-61 验证/失败、P2 T011 ④：完成时间取 `started_at`/`completed_at`，阅读范围取可观察项，否则 `inconclusive`（`prd.md:508`） |
| F30 | major | codex | 修后在临时目录，不证四处下降 | fixed（G4） | 按主会话裁定 ③：AC-45、P1 T006 ⑤、RISK-005、OPEN-002；②③④ 由 packet/bundle 字节一致测试证明 |
| F31 | major | codex | 同 F02 | fixed（G1） | 同 F02 |
| F32 | major | codex | AC-62 同包前后配对未定义 | fixed（G3） | 同 F23；P1、P2 各作一个工作包 |

计数：fixed 29 / rejected_invalid 2 / accepted_risk 1 / needs_human 0。草稿「需用户裁定」四项由主会话在既有决定内裁定：外仓归档（D-003，`#兼容性预留`、`#合入后配置切换与仓外保留` 第 5 步）；AC-62 五字段缺即失败、运行度量取不到记 `inconclusive`（D-004、口径 B）；AC-45 修后样本只构建与预检不派发（D-039、D-046、D-048）；F13/F19 写集只扩 `skills/wh-review/SKILL.md:21`，两份 workflow `:15` 不扩。

### 当前事实澄清（2026-10-05）

旧 F13 的 `accepted_risk` 来源在有限原件核查内未证实：`<TASK_DIR>/quality/evidence/human-confirmations/2026-10-04-006-build-plan-card09-build-plan-approve.json`（sha256 `bae1b9540dfa22ed263a1624daeef44bab3b69067bd7deea5c62f6341ba9cf62`）只记录阶段批准，没有绑定 F13 残余风险的真实回复。旧表标签保留只读，当前不把它当作风险接受、质量通过或推进许可。本次按 D-049 明确 verify-code 方法首步对实际 worktree、branch、HEAD、write_set 与材料来源核对，并经已有 `run-command` 保存 `quality/tests/` 原件，不新增中间风险确认或 runtime gate。

当前以实际核对支持：既存原件 `<TASK_DIR>/quality/tests/2026-10-05-087-card09-verify-initial-risk-samples-final.output`、`…/2026-10-05-101-card09-verify-final-prepublish-readback.output`、`…/2026-10-05-123-card09-delivered-final-source-readback.output`、`…/2026-10-05-128-card09-doc-findings-source-scope.output` 只证明各自记录时点及其范围的核对事实，不预填后续执行结果。AC-45/AC-51 资源结果继续按原件 `2026-10-04-014-card09-p1-t006-resource-inconclusive.output`、`2026-10-05-051-card09-build-code-spec-analyze.md`、`2026-10-05-062-card09-spec-analyze-actual-disposition.md`、`2026-10-05-085-card09-build-code-current-factual-addendum.md` 保持 `inconclusive`（均在 `<TASK_DIR>/quality/tests/`）；目录累计增量不能证明同负载下降。

## 12. 风险、未决与交接

### 风险

- RISK-001 迁入打断审查链。受影响 ID：AC-T2。触发：宿主改指后启动失败。后果：本卡及后续审查不可用。缓解：合入前不改真实配置；稳定 checkout 可用后按 D-049 的本次持续授权切换，改指前备份，真实 doctor 失败即恢复备份及 `third_review.command[1]` 原值。处理阶段：合入后配置切换。验证：改指后跑一次 `node skills/third-review/scripts/3rd-review.mjs doctor`。
- RISK-002 skill-bundle 清单漏文件。受影响 ID：AC-T2。触发：登记 catalog 后 run-checks 红。后果：检查红。缓解：T002 用 `git ls-files skills/third-review` 生成并核对。验证：`node tools/cli/run-checks.mjs`。
- RISK-003 M3 豁免过宽。受影响 ID：AC-T2。触发：豁免写成 basename 或通配。后果：残留检查失真。缓解：精确路径常量，另加反例断言。验证：T003 测试。
- RISK-004 Vitest 并发下外仓测试互扰（固定 `/tmp/opencode-canonical-cwd-` 与 127.0.0.1 端口）。受影响 ID：AC-T3。触发：`npx vitest run skills/third-review/test` 间歇红。后果：回归不稳。缓解：只在测试内部改用 `mkdtemp`；不改 `vitest.config.mjs`，需要改则 STOP 交 build-plan。验证：同命令连跑两次结果一致。
- RISK-005 写入量基线不可复现。受影响 ID：AC-45、AC-51。触发：修后没有同一审查任务可重放。后果：`inconclusive`。缓解：T006 修前在改代码前采集四处；修后用同一请求文件 `-009` 的材料按 ref 形态重建请求，只构建与预检、不派发（D-048）；重建必须派发时记 `inconclusive`。验证：两次采样同一材料来源，修后重建文件与预检输出存档。
- RISK-006 进程数被采样时刻污染。受影响 ID：AC-46、AC-51。触发：采样时有派发在跑。后果：数字不可比。缓解：只在无派发的阶段边界采样并记采样时刻。验证：`ps` 原件时间戳。
- RISK-007 `stage-runtime.mjs` 两 Phase 冲突。受影响 ID：AC-45、AC-62。触发：P2 改动 P1 的 `resolveMaterialRefs`。后果：越权写入。缓解：函数级分工；审查用 `git diff` 比对。验证：P2 diff 不含该函数。
- RISK-008 provider-protocol 改动改变每个审查包 material_id。受影响 ID：AC-T4、AC-60。触发：T007 合入。后果：旧 material_id 不可复用（预期）。缓解：不复用旧结果绑定新材料。验证：T007 后首次审查记录新 material_id。
- RISK-009 停滞提示被误读为失败。受影响 ID：AC-62。触发：提示文字含糊。后果：用户误取消健康请求。缓解：提示用日常语言写明「仍在运行，不是失败」与两个选项。验证：T010 断言提示文字。

### 未决

- OPEN-002 同口径资源基线可复现条件。受影响 ID：AC-45、AC-46、AC-51。负责人：build-code P1 实施者。影响：复现不了则 `inconclusive`。处理阶段：build-code。关闭条件：本规格已定可复现条件（AC-45 修后＝同一请求文件材料按 ref 重建、只构建与预检不派发；四处目录修前统计、②③④ 修后由字节一致测试证明；进程数在无派发阶段边界采；会话计数用修前窗/修后窗；记提交与时间窗）；修前与修后原件都取得即关闭；重建须派发或原件取不到时保持 open 并记 `inconclusive`。
- OPEN-003 段落级写集。已消解：本文件 `#### 共享写集分工` 给出函数级 owner，CARD-08 冻结句实读零重叠。
- OPEN-005 母 decision-log `:936`「仍待实施的优化」正文为空。保持 open，只登记不代编。负责人：母规划 owner。影响：无本卡 AC。关闭条件：母材料补正文。
- OPEN-006 母材料行号漂移。已消解：本阶段按标题定位并实读 `prd.md:486-522`。
- OPEN-010 写入量与进程数采样命令、时长、阈值。已消解：命令为 `find <dir> -type f | wc -l` 与字节求和（四处目录）、`ps -axo pid=,ppid=,comm=`（无派发阶段边界一次）；记录口径按 `-008` Q7（一份 record json 为一轮，计 `raw_output_ref` ∪ `evidence_refs` 与对应请求，孤儿 `.output` 单列不计）；不设阈值（D-047）。
- OPEN-C09-BP-001 「用户暂停」切片。已消解。主会话裁定（m00277）首选「暂停＝停止等待但不取消，迟到结果经 late supplement 追加到同一记录」，并要求先实读确认、不成立则回退本条选项①。实读结论：不成立（PFACT-012）——迟到补充只在同一次调用拿到终态结果时随结果写入，记录只追加写一次新文件，停止等待后无取回或追加入口；若不发取消就退出，受管请求会脱离当前等待者，只能靠 ownerloss guardian 收场，已返回结果不进记录。按裁定回退：暂停＝调用方停止等待并沿既有取消链收场，已返回发现保留，不新增入口或对象；AC-62 暂停与取消共用同一取消链，各自断言（T010）。可续暂停（停止等待后再取回终态或追加原记录）需要可重新附着的请求标识与记录更新入口，违反 `prd.md:489` 不新增持久对象与记录只追加，延期，owner＝后续卡。
- 结构校验已知限制（build-plan 收口记录，不阻断推进）。`runtime/stage/stage-content-contracts.mjs:1010` 的 `validatePostPhaseContract` 对本卡材料剩余 14 条结构错误，主会话裁定按校验器限制接受、不改含义。依据：唯一生产调用 `tools/cli/stage-runtime.mjs:499` 只取各 Phase 的 write_set 过滤审查 diff，不检查 `ok`。原件：外置任务目录 `quality/tests/2026-10-04-001-card09-build-plan-post-phase-contract-check.md`。该原件记录的 sha256 指 2026-10-04 第一次校验时的文件，之后改过写法（final-spec-analyze 修复），重跑后错误集合不变（仍是 14 条）。
  - a 类，12 条（P1 T001–T004 的来源绑定各 1 条，追踪表对这四个 Task 的绑定与 oracle 各 1 条）：这四张卡只绑 FR-C09-T1..T4、AC-T1..T4；校验器 FR 正则（`:1102`）与 AC 正则（`:6`）只认数字序号。AC-T1..AC-T4 是 decision-log 已定 ID（`decision-log.md:399`、`:408`、`:416`、`:425`），改名即改 ID，故不改。
  - b 类，2 条（P2 写入集与 P1 重复持有 `tools/cli/stage-runtime.mjs`、`skills/wh-review/SKILL.md`）：校验器 `:1047-1052` 对已被前一 Phase 持有的路径一律报重复，`:1107-1108` 要求 Task 文件必须在本 Phase 写入集内，没有共享或承接声明；本卡保持 `#### 共享写集分工` 的段落级 owner 不变。
  - build-code 的 Phase 审查打包按文件级 write_set 过滤 diff（`runtime/review/review-input-bounds.mjs:36`，精确路径或尾斜杠前缀），这两个共享文件会同时出现在 P1、P2 两个 Phase 的审查 diff 里，属预期；审查者按段落分工只判本 Phase 段落。

### 合入后配置切换与仓外保留

负责人：CARD-09 主会话。D-049 的真实用户持续授权覆盖第 3 步既定路径切换，不新增中间确认；只最终 close 前统一确认。外仓与 GitHub archive 边界仍按第 5 步。

1. 本卡合入 main 后，核对主仓稳定 checkout 的实际分支为 `main`、工作树干净、当前 HEAD 等于已核对的本卡交付提交，并确认该 checkout 实际存在 `skills/third-review/scripts/3rd-review.mjs`。
2. 备份 `~/.config/workflowhub/config.json`。
3. 按 D-049 的本次真实持续授权，自动把 `third_review.command[1]` 改为 `/Users/Hugh/Hugh/Project/workflowhub/skills/third-review/scripts/3rd-review.mjs`，不再逐次请求确认；只改该索引，保留其它配置。
4. 跑一次 `node /Users/Hugh/Hugh/Project/workflowhub/skills/third-review/scripts/3rd-review.mjs doctor`，原始输出存任务 `quality/tests/<日期>-card09-third-review-doctor.txt`；失败即恢复备份。
5. 外仓 `/Users/Hugh/Hugh/Project/3rd-review` 原样保留作归档（D-003）；GitHub 端 `Hugh4424/3rd-review` 是否 archive 由用户决定，本卡不执行。

### 延后项承接

- 可续暂停（停止等待后再取回终态，或把迟到结果追加到原记录）：延期，owner＝后续卡；依据 OPEN-C09-BP-001 消解结论与 PFACT-012。
- 外仓既有红 `test/cli-lifecycle.test.mjs:81` 与其它既有红基线，留给各自 owner。

## 13. 业务影响与回归范围

- 审查链：迁入时只换代码来源位置；正常成功行为与公开 API/identity/schema/hash/布局不变。终末 017 F02 仅纠正 manager 启动前私有 IO 失败的 owned 产物回退，原 IO 错误不吞，竞争赢家与此前 terminal operation 不动；既有回收两半不重做。协议文字变化让审查包 material_id 改变。
- 回归范围：`skills/third-review/test/**`、两份 M3 检查、`tests/review/` 与 `tests/contract/` 中本卡点名文件、`simple-review-runner.test.mjs` 基线比对。不跑全量。
