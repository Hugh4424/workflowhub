# Phase P4 — 审查进展判定与 antigravity 真实读取

- **Global spec**：`spec.md#实现设计全局权威`
- **Write set**：`skills/third-review/lib/adapters/antigravity.mjs`、`skills/third-review/lib/process.mjs`、`skills/third-review/test/antigravity-adapter.test.mjs`、`skills/third-review/test/process.test.mjs`、`skills/third-review/test/review-progress-liveness.test.mjs`、`skills/third-review/test/adapters-health.test.mjs`、`runtime/review/ocr-delegation-adapter.mjs`、`tests/contract/ocr-delegation-adapter.test.mjs`
- **Dependency**：none
- **Consumer**：review 调用者、P8 全 AC 验收与后续审查任务
- **gate_cmd**：`npx vitest run skills/third-review/test/antigravity-adapter.test.mjs skills/third-review/test/process.test.mjs skills/third-review/test/review-progress-liveness.test.mjs skills/third-review/test/adapters-health.test.mjs`
- **oracle**：ORACLE-P4-CHAIN
- **evidence_path**：`quality/tests/2026-10-20-043-p4-success-terminal-cleanup-green.output`
- **STOP**：若 T007/T008 的目标断言未按 ORACLE 通过、三处旧断言被删除或改弱、或任何越界/链接逃逸被放行，停下并把原始失败与 `antigravity.mjs` 行号交本 Phase 实施者按 D-010 与 FR-CHAIN-007/008 修复，不放宽断言或路径检查。
- **覆盖 AC**：AC-M5-1、AC-M5-2
- **Done**：AC-M5-1 `pass` — `quality/tests/2026-10-20-043-p4-success-terminal-cleanup-green.json` 与同名 `.output`，受控拒读活锁、允许读取慢流、缺 close 失败及已有成功 terminal 保全/父后代回收；AC-M5-2 `pass` — 同043原件及 `quality/tests/2026-10-20-027-p4-plan-health.json`，真实 payload 形状放行、bundle 外与链接逃逸拒绝。判定由当前主会话按 Appendix A 原判据提供；限受控场景，未宣真实 agy/native 或慢模型校准通过。独立发现处置见149/150，审查失败与覆盖限制如下保留。

冻结目标RED输入：2026-10-20已read `tests/contract/final-chain-plan-red.test.mjs`（sha256 `0ca1da0ce73bacdff6f01e67bffaabf70b4a4a89f9ede9a0af2f67ef4fcd2ab4`），首部生产writer只读/TCR条件与四组原断言保全；原始总命令 `npx vitest run tests/contract/final-chain-plan-red.test.mjs` exit1，14 tests=11目标行为失败、3本来通过、0 setup，原件 `quality/tests/2026-10-20-016-n9-final-chain-plan-red.json 与同名.output`。本文件只读，不入本Phase未来Write set；不能改断言求绿。每组只证其实际接缝，PLAN-REFRESH为G-2结构合同，不证两次真实刷新。

## 速读卡（本 Phase 增量）

- **本 Phase 结果**：审查 provider 只把「允许读取完成」与「最终答案」当进展，被拒/报错/裸模型轮次不再续命，单路活锁在既有 5 个健康间隔后落终态；已退出/消失但 close 未触发的 provider 在 2 个 liveness 间隔内以 `PROVIDER_NO_TERMINAL_RESULT` 收回；`antigravity` hook 同时接受真实与既有读取 payload，bundle 外与链接逃逸仍拒绝。
- **非目标**：不改 5 个健康间隔常量、不加墙钟总时限、不改 provider 路由与执行者、不实现跨事件状态门控（会改 `observeLine` 的无状态契约）；不降低 manifest 与实时文件校验，不为通过而放宽断言。
- **改动前**：`antigravity.mjs:130-133` 把 `step_update` 的 `ACTIVE`/`DONE`/`ERROR` 全部置 `progress:true`，且 `agent_response` 的 `DONE` 同样是带 `step_type` 的 `step_update`；`process.mjs:167-172` 只在 `progress===true` 时 `noteProgress` 重置窗口，所以真实被拒循环永不触发 `health-runner.mjs:32-38` 的 5 间隔终态。hook 只认 `toolCall.name=view_file`＋`args.AbsolutePath`（`antigravity.mjs:54-64`），真实是 `tool_name`＋`tool_info.parameters.Path` 且 `/tmp/...` 为链接形式。
- **改动后**：真实序列（`ACTIVE`→`ERROR` 被拒 + 穿插 `agent_response` 的 `DONE`）在 5 个间隔内落 `PROCESS_STALLED`，组内其它 provider 结果照常返回；有允许读取 `DONE` 推进的慢 provider 不误判；已退出/消失但 close 未触发的 provider 在 2 个 liveness 间隔内落 `PROVIDER_NO_TERMINAL_RESULT`，不影响仍存活慢流；两种 payload 形状都按 realpath 后精确成员放行。
- **与相邻 Phase 的边界**：P4 独立（`Dependency: none`），只消费既有 health/process/broker 行为，不消费 P1–P3 产物；P8/T014 只读本 Phase 的测试与证据原件，不重跑实现。
- **主要风险**：收紧后只发 `agent_response`、长时间没有允许读取的正常 provider 可能被误杀（spec RISK-05）；若独立读回发现误杀且无允许读取正例支撑，替代走法是保留「被拒不算进展」并把窗口证据交用户决定是否校准，不静默加墙钟时限。
- **下一步**：本 Phase 两 AC 在下述受控范围首判已记录；P8/T014 消费043、017、149/150及并列同源原件复核，不补首次判定；其余 Phase 继续按真实依赖实施。
- **动手前必读**：`skills/third-review/lib/adapters/antigravity.mjs:124-141`；`skills/third-review/lib/process.mjs:140-173`；`skills/third-review/lib/health-runner.mjs:27-38`；`skills/third-review/lib/broker.mjs:1074-1079,1863-1877`；`skills/third-review/test/antigravity-adapter.test.mjs:43-59,91-107`；`skills/third-review/test/process.test.mjs:181-198`；`skills/third-review/test/review-progress-liveness.test.mjs:245-272`；`quality/evidence/2026-10-20-024-build-plan-review-health-and-page-facts.md` §2.1、§2.5。
- **未决事实**：`unavailable` — 真实 agy 模型读取、hook stdin 与真实慢模型的五间隔校准未取得；具名 owner 为后续真实环境验证执行者，须具备隔离 native agy 可运行环境和允许读取样本才能核验。当前受控 payload/子进程不冒这些事实；外置 quality 根沿原卡声明。

## 本 Phase 材料导航

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#实现设计全局权威` 与 FR-CHAIN-007/008 | 取目标、全局写集、测试面与回滚边界；本卡不复制全局设计 | 写卡前 |
| `decision-log.md` D-010 | 取「允许事件算进展、超窗落终态、不加墙钟」的原义 | 写卡前 |
| `quality/evidence/2026-10-20-014-direction-review-slowdown-diagnosis.md:11-32,167-171` | 取活锁根因、`timeout=null`、hook 形状与 stdin 原文未取得的限制 | 写卡前 |
| `quality/evidence/2026-10-20-024-build-plan-review-health-and-page-facts.md` §1.2、§2.1、§2.5 | 取真实事件序列（`agent_response` 的 `DONE` 穿插）、`tool_info.error` 形状与同批测试影响清单 | 写卡前 |
| `quality/evidence/2026-10-20-025-build-plan-knowledge-graph.md:77-83` | 确认看门狗已存在、缺陷是事件分类，因此 broker/health-runner 不需要改 | 写卡前 |
| `runtime/stage/stage-content-contracts.mjs:413-720` | 核本 Phase 契约头与 Task 卡字段按既有校验器可读 | 写卡前 |
| `skills/third-review/lib/adapters/antigravity.mjs:54-65,124-141` | 读 hookDecision 与 observeLine 的当前实现 | 写卡前 |
| `skills/third-review/lib/process.mjs:167-173`、`health-runner.mjs:27-38` | 读 progress 消费与 5 间隔规则 | 写卡前 |
| `skills/third-review/test/antigravity-adapter.test.mjs:43-59,79-107`、`process.test.mjs:181-198`、`review-progress-liveness.test.mjs:245-272` | 读既有断言与 hook 测试 oracle，定位换事件类型的精确位置 | 写卡前 |

## L0 — 结果与变更

本 Phase 把审查进展判定从「任何步骤事件都续命」收紧为「允许读取完成＋最终答案」，并让 `antigravity` hook 接受真实读取 payload。改动落在既有适配器、process 的窄恢复分支与四个测试文件，共 6 个路径；复用既有健康间隔、终态回收与组内收集。恢复只处理已退出/消失却未触发 close 的路径，不给仍存活 provider 增加总时限。

- **结果**：受控被拒序列（含穿插的 `agent_response` 的 `DONE`）在 5 个健康间隔内以 `PROCESS_STALLED` 落终态且同级其它结果保留；有允许读取 `DONE` 推进的慢流正常完成；已退出/消失但 close 未触发的 provider 在 2 个 liveness 间隔内以 `PROVIDER_NO_TERMINAL_RESULT` 终态返回，其余结果保留；真实与既有 payload 均被放行，bundle 外与链接逃逸仍拒绝。
- **非目标**：不把 `agent_response` 做成跨事件门控、不改 `health-runner` 的 5 间隔常量与 `process.mjs` 的终态/进程组回收、不改 `broker.mjs` 的组内等待语义、不改 provider 路由配置；依据 `2026-10-20-025:77-83` 与 `2026-10-20-024` §2.4、§2.5，这些既有规则均保留；process 只允许 T007 声明的已退出/消失但 close 未触发的恢复分支。
- **与其它 Phase 的区别**：P4 不产出十环报告、页面或验收报告；它只让 review 单路活锁可终止并让真实读取可用，结果由 P8 只读消费。

## L1 — 可执行契约

### 文件边界

- **新增**：N/A — 全部改动落在既有 8 个文件，新场景写入既有测试文件，不新增测试文件或夹具。
- **修改**：`skills/third-review/lib/process.mjs`（仅 T007 存活观察恢复分支）、`skills/third-review/lib/adapters/antigravity.mjs`、`skills/third-review/test/antigravity-adapter.test.mjs`、`skills/third-review/test/process.test.mjs`、`skills/third-review/test/review-progress-liveness.test.mjs`、`skills/third-review/test/adapters-health.test.mjs`。 `runtime/review/ocr-delegation-adapter.mjs`、`tests/contract/ocr-delegation-adapter.test.mjs`（T008 既有真实 OCR guard consumer 补修）。
- **禁止改动**：`skills/third-review/lib/health-runner.mjs`（5 间隔规则已在 `:36,61-62` 就绪）；`skills/third-review/lib/process.mjs` 的既有终态、进程组回收与 progress 消费（仅存活观察内已退出/消失但 close 未触发的窄分支可改）；`skills/third-review/lib/broker.mjs`（组内等待 `:1077` 与结果保留 `:1863-1877` 已成立）；`antigravity.mjs` 的 `requireNativeHooks`、`packetPolicy`、`installPacketHook`（`:14-30,32-52,68-95` 的版本、合同与 manifest 校验不因形状放宽而降低）；provider 路由与 `~/.config` 配置（D-010 不改路由与执行者）。

本次017有效major的范围修正：下述原“process仅存活观察”限制增加一个已具名例外——既有成功wait_for_close分支只保存内存终态，供死父缺close恢复优先保全已见成功；不改正常close/已有终态claim或回收。依据136/142及本节末017处置，实际diff须逐hunk独立核。

### 任务顺序

T007 先改 `observeLine` 与 process 的窄恢复分支并换三处旧断言，T008 后改 `hookDecision` 并加 payload 测试。两者同写 `antigravity.mjs` 与 `antigravity-adapter.test.mjs`，所以串行而不是并行；T008 的 hook 用例不依赖 T007 的行为，串行只为同一文件单一写主。

### 测试策略

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 被拒/报错/裸模型轮次不再算进展，5 间隔内落 `PROCESS_STALLED` | T007 | RED | 上方 gate_cmd / `1` | ORACLE-P4-HEALTH / unavailable — build-plan 未执行，首个 build-code 动作采集 |
| 三场景：活锁终态、允许读取慢流正常、已退出/消失但 close 未触发时有界恢复 | T007 | GREEN | 上方 gate_cmd / `0` | ORACLE-P4-HEALTH / `quality/tests/2026-10-20-043-p4-success-terminal-cleanup-green.output` |
| 真实 payload 放行、bundle 外与链接逃逸拒绝 | T008 | RED | 上方 gate_cmd / `1` | ORACLE-P4-ANTIGRAVITY / unavailable — build-plan 未执行，首个 build-code 动作采集 |
| 同上且既有 `view_file/AbsolutePath` 断言保留 | T008 | GREEN | 上方 gate_cmd / `0` | ORACLE-P4-ANTIGRAVITY / 同上原件 |

红测归因：T007、T008 的 RED 都是目标行为断言失败（被拒序列仍被当进展／真实形状仍被拒）；夹具搭建失败另记，不算 RED；改动前本来就通过的旧断言不制造 RED。测试面为单元与进程内集成，不调真实模型；浏览器与 UI 面不涉及。

### 覆盖边界

- **覆盖上限**：只证明受控子进程事件序列与两种 hook payload 形状下的判定；不证明真实 `agy` 模型行为、真实 hook stdin 原文、真实慢样本的 5 间隔校准。
- **显式不覆盖**：真实 provider 是否发出被允许读取、`/tmp` 与 `/private/tmp` 之外的宿主路径形态、组内等待语义的改动（不需要改）；浏览器/UI 面与跨 provider 路由行为均为 N/A。

### 停止

若受控负例未在 5 个间隔内落 `PROCESS_STALLED`、允许读取慢流被误判、任一旧断言被删除或改弱而非换事件类型、真实形状仍被拒、已退出/消失但 close 未触发时未在有界恢复内返回、或越界/链接逃逸被放行，停并把命令、exit 与事件序列交本 Phase 实施者；health-runner/broker 或 process 窄恢复分支之外需要改动时同样停，交 build-plan owner 重核写集，不自行扩写集。

### 完成

gate_cmd 退出 0、两卡的 RED/GREEN 与负例原件落 `quality/tests/2026-10-20-043-p4-success-terminal-cleanup-green.output`、本 Phase 的 `git diff --name-only` 只含契约头 6 条写集路径，T007 三场景与 T008 两种 payload／路径边界均有原件，且由未参与实现的审查者独立读回后，才可判本 Phase 完成；未观察部分如实写 unavailable。

### 风险与回滚

- **风险**：收紧后只发 `agent_response`、连续 5 个间隔没有被允许读取的正常 provider 被误杀（spec RISK-05）。
- **影响**：正常但极慢的一路被 `PROCESS_STALLED` 终止，组结果缺一路但其它结果保留。
- **缓解**：T007 正例必须用「有允许读取 `DONE` 推进」的慢流；校准依据与真实慢样本读数随证据记录，不预填窗口数值。
- **回滚**：只回退 `observeLine` 的事件分类改动（恢复 ACTIVE/DONE/ERROR 三态判定），保留 T008 的 hook 形状修复；测试换事件类型的改动随分类一起回退；恢复分支若误伤存活进程，只回退 process 对应 hunk 与其新增场景，保留既有终态回收，不整份 checkout。
- **触发条件**：独立读回出现「无被拒读取、有允许读取推进」仍落 `PROCESS_STALLED`，或用户确认当前窗口口径不可接受。

### 交接知识

- `process.mjs:167-172` 只在 `progress===true` 且 `progress_key` 未见过时 `noteProgress`；`progress_key` 去重是既有机制，T007 保留并用 `${step_index}:DONE`。
- `health-runner.mjs:32-38` 用 `generation` 是否变化累计 `stagnant`，阈值是 5 个 interval；`process.mjs:6` 的 `SEMANTIC_STALL_INTERVALS = 12` 属于 `streamLiveness` 路径，不要混用。
- `antigravity.mjs:153` 的 start 返回 `streamProgress:true` 且没有 `probeSession`，所以走 health-runner 的无 probe 分支。
- `broker.mjs:1077` 的 `Promise.all` 在该路落终态后自然返回，`:1863-1877` 的 outcome 保留 `providers` 数组，因此“其余结果照常返回”不需要改 broker。
- hook 测试 oracle 是执行 `.agents/hooks.json` 里安装的 command（`antigravity-adapter.test.mjs:79-89`），不是直接调私有函数。

### T007 — 被拒与报错不再算进展

- **Source / FR / AC**：U-006；D-010（进展只认被允许的读取、模型推进步骤与最终答案；被拒/报错/重复调用不计进展；超 5 个既有健康间隔落终态，其余结果返回）/ FR-CHAIN-007 / AC-M5-1（被拒序列穿插 `agent_response` 的 `DONE` 仍在 5 间隔内落 `PROCESS_STALLED`，有允许读取推进的慢 provider 不误判；已退出/消失但 close 未触发时以 `PROVIDER_NO_TERMINAL_RESULT` 有界回收）。与 D-010 字面「模型推进步骤」的差异：真实序列每 1–2 次被拒读取就穿插一次 `agent_response` 的 `DONE`（10–182s，小于 5×60s），按字面仍会清零窗口；故按 D-010 同一目标收紧为「被允许的读取完成＋最终答案」，差异已记 spec §12 RISK-05/RISK-06 与 `2026-10-20-024` §2.1。
- **Files / symbols**：`skills/third-review/lib/adapters/antigravity.mjs`；symbol: observeLine（事件分类）。`skills/third-review/lib/process.mjs`；symbol: observeProcessLiveness（存活观察与有界恢复）。`skills/third-review/test/antigravity-adapter.test.mjs`、`skills/third-review/test/process.test.mjs`、`skills/third-review/test/review-progress-liveness.test.mjs`、`skills/third-review/test/adapters-health.test.mjs`；symbol: N/A — 测试文件无导出符号，改的是既有 test 用例断言。
- **Action**：在 `observeLine` 把语义进展收窄为 `event==="step_update"` 且 `state==="DONE"` 且 `step_type` 为 `tool` 或缺省（排除 `agent_response`/`user_input` 的 `DONE`）且 `tool_info.error` 为空，返回 `{liveness:true, progress:true, cursor, progress_key, event:"step_update"}`，`progress_key` 用 `step_index` 加 `:DONE`（如 `7:DONE`，保留既有去重机制；真实事件总带 `step_type`，缺省只用于既有合成夹具的 DONE，保持 `process.test.mjs:198` 的 40 计数）；`ACTIVE`、`ERROR`、`agent_response`/`user_input` 的 `DONE` 只返回 `{liveness:true, progress:false, cursor, event:"step_update"}`；`result` 维持既有 terminal 结算、不新增 progress 计数（终态立即完成，计数只服务 5 间隔窗口，且可避免 `process.test.mjs:198` 的 `progress_events === 40` 变成 41）。测试同批：`antigravity-adapter.test.mjs:46` 的 ACTIVE 断言改 `progress:false`，新增允许读取 DONE 为 true、ERROR 与裸 `agent_response` DONE 为 false；`process.test.mjs:192`、`review-progress-liveness.test.mjs:272` 把重复 ACTIVE 换成重复允许读取 DONE，`progress_events === 1` 断言强度不变；`adapters-health.test.mjs` 新增 `node -e` 受控子进程：被拒 ACTIVE/ERROR 穿插 `agent_response` DONE 的序列 → `PROCESS_STALLED` 且 `progress_events === 0`，允许读取 DONE 每 2 个间隔推进的慢流 → 正常完成。
；**另设计候选根因的防守性有限case**（012未直接采样close事件/后代stdio，不能声称该次挂起已证如此）：`process.mjs` 的 `observeProcessLiveness` 在发现 child 已不存活而 `close` 未触发（后代仍持有 stdio）时，启动 2 个 liveness 间隔的有界恢复，到点 `claimFailure("PROVIDER_NO_TERMINAL_RESULT")` 并 settle 该路；活着的慢 provider 不受影响，仍不设总时长上限。
- **Inputs**：PFACT-011 实读 `antigravity.mjs:124-141`（三态 progress）与 `process.mjs:167-172`（progress 才 `noteProgress`）；真实事件序列来自 `quality/evidence/2026-10-20-024-build-plan-review-health-and-page-facts.md` §2.1；无上游 Task，测试事件由本卡内 `node -e` 受控子进程提供（不新增夹具文件）。
- **Outputs / failure**：被拒/报错/裸模型轮次只保留 liveness，5 个间隔后由 health-runner 既有规则发布 `PROCESS_STALLED` 终态失败，`process.mjs` 既有 SIGTERM→SIGKILL 回收进程组，失败如实回传、不伪造成功；允许读取 DONE 递增 generation，慢流不被误杀；已退出/消失但 close 未触发时在 2 个 liveness 间隔内落 `PROVIDER_NO_TERMINAL_RESULT` 并 settle，既有终态回收与组内结果保留不变；事件形状非法（缺 `step_index`、负数）仍按 `progress:false` 处理。
- **Boundary / DO NOT TOUCH**：不改 `health-runner.mjs:36,61-62` 的 5 个健康间隔常量与判定；只在 `process.mjs` 的存活观察上新增一条有界恢复分支，不改 `:43-51,58` 的既有终态与进程组回收；不改 `broker.mjs:1077` 的组内等待与 `:1863-1877` 的结果保留；不改 provider 路由、不换执行者、不加墙钟总时限、不实现跨事件状态门控（保持 `observeLine` 无状态）。
- **Dependency**：none
- **Test tier / skill**：unit + 进程内 integration / backend-testing；真实 `child_process` 与 vitest，不调真实 provider。
- **Scenario / fixture or service**：正例是允许读取 DONE 每 2 个健康间隔推进、总时长跨过 5 个间隔后发 `result` SUCCESS 的慢流；反例一是同一 `step_index` 反复 `ACTIVE`→`ERROR`（被拒读取形状）并在其间穿插带 `step_type:"agent_response"` 的 `DONE`，5 个间隔内必须落 `PROCESS_STALLED`；反例二是假 CLI 让子进程退出但由仍活的后代持有 stdout（`close` 不触发），必须在 2 个 liveness 间隔的有界恢复内落 `PROVIDER_NO_TERMINAL_RESULT` 并让组返回；清理靠 `execute` 既有进程组回收与临时目录删除。
- **预写测试**：`skills/third-review/test/antigravity-adapter.test.mjs`（observeLine 分类）、`skills/third-review/test/adapters-health.test.mjs`（execute 级正反例），以及 `process.test.mjs`、`review-progress-liveness.test.mjs` 的换事件类型；作者 build-plan，实施前先写并跑出 RED。
- **可观察接缝**：`antigravity.mjs:129-133` 当前把三态都置 `progress:true`；`process.mjs:167-172` 仅在 `progress===true` 时 `noteProgress`；`health-runner.mjs:32-38` 在 generation 连续 5 个 tick 不变时发布 `PROCESS_STALLED`；`broker.mjs:1077` 在该路落终态后返回其余结果——以上均为 2026-10-20 实读。
- **冻结RED/GREEN接缝**：`npx vitest run tests/contract/final-chain-plan-red.test.mjs -t PLAN-HEALTH`；016四类liveness非progress目标失败，allowed read DONE与SUCCESS final两个control本来通过，不制造RED；未来同命令四负例与二control均0。此组不证明liveness消失恢复/真实provider，后者另沿本卡原目标设计。D010“模型推进步骤”字面与本卡收紧有差异，未获用户具体接受，待本次完整计划确认，不能用051继续授权冒风险接受。
- **RED/GREEN gate_cmd**：`npx vitest run skills/third-review/test/antigravity-adapter.test.mjs skills/third-review/test/process.test.mjs skills/third-review/test/review-progress-liveness.test.mjs skills/third-review/test/adapters-health.test.mjs`
- **expected_exit**：RED nonzero（目标分类、活锁终态或已退出/消失但 close 未触发时的恢复断言失败；旧断言原本通过如实记录）；GREEN 0。
- **RED target failure**：ORACLE-P4-HEALTH 断言：被拒 ACTIVE/ERROR 与穿插的 `agent_response` DONE 仍被算作进展、5 个间隔内未落 `PROCESS_STALLED`，该反例断言失败；已退出/消失而后代持有 stdout 的场景未返回 `PROVIDER_NO_TERMINAL_RESULT` 也属目标失败。旧 ACTIVE 断言按本卡 TCR 保留原文与变更来源，不把旧断言本来通过伪写为 RED。
- **GREEN oracle**：ORACLE-P4-HEALTH；同一命令下被拒序列 5 个间隔内落 `PROCESS_STALLED` 终态，允许读取 DONE 慢流正常完成、不误判；已退出/消失但 close 未触发时在 2 个 liveness 间隔内落 `PROVIDER_NO_TERMINAL_RESULT`，组返回其余结果；三场景逐项有实际原件。反向行为：仍把 ACTIVE/ERROR/`agent_response` 当进展，或把 DONE 慢流误杀、恢复场景无终态，即失败。
- **Evidence**：RED 证据 unavailable — 该补充测试/未来模块尚未存在，当前不可达目标断言；缺文件/import属setup不算RED；首个可达接缝实施前采集（已可达冻结组见016）；计划原件 `quality/tests/2026-10-20-043-p4-success-terminal-cleanup-green.output`（相对任务基准）保存三场景命令、exit 与事件序列（活锁、存活慢流、退出后 close 未触发）。
- **STOP / recovery**：受控序列未落终态、DONE 慢流被误杀、或任一旧断言被删除/改弱而非换事件类型时停，回本卡实施者按 D-010 与 FR-CHAIN-007 重核分类与测试；保原始失败，禁止改断言语义求绿。
- **Coverage limit**：只证明受控事件序列下的分类与 5 间隔行为；不证明真实 `agy` 事件形状、真实模型行为、5 间隔对真实慢样本已校准（RISK-05 的校准记录留 build-code）。
- **测试变更请求**：理由均为 D-010/FR-CHAIN-007 要求被拒/报错/裸模型轮次不计进展。① `antigravity-adapter.test.mjs:46` 旧断言 `{liveness:true,progress:true,cursor:"7:ACTIVE",progress_key:"7:ACTIVE"}`，新断言 `{liveness:true,progress:false,cursor:"7:ACTIVE",event:"step_update"}`；② `process.test.mjs:192` 旧断言用重复 ACTIVE 且 `progress_events===1`，新断言改用重复允许读取 DONE，`progress_events===1` 与 `PROCESS_STALLED` 均保留；③ `review-progress-liveness.test.mjs:272` 同样把重复 ACTIVE 换成重复允许读取 DONE、保留 `progress_events===1`；④ `adapters-health.test.mjs` 新增上述正反例断言。此前 RED 证据：unavailable — build-plan 未执行；独立审查引用：P8/T014 独立读者读回 + 本 Phase 独立审查。
- **Done**：gate_cmd 退出 0、三处旧断言按换事件类型保留原强度、正反例原件可复放、本 Phase 实际改动落在头部 6 条路径，health-runner/broker 零改动，process 只改上述窄恢复分支；三个场景分别为 `PROCESS_STALLED`、正常完成、`PROVIDER_NO_TERMINAL_RESULT`，不以任一场景代另外两项，并由未参与实现者读回 `quality/tests/2026-10-20-043-p4-success-terminal-cleanup-green.output` 后判 AC-M5-1。

### T008 — antigravity 接受真实读取 payload

FR-CHAIN-008 形状来源澄清（384/390）：`tool_name`＋`tool_info.parameters.Path` 是已观察 stream 字段，并非已捕获 hook stdin；原 stdin 未取得。真实 OCR 使用既有 `runtime/review/ocr-delegation-adapter.mjs` 的 `installAgPacketGuard`，本 T008 同时覆盖该 consumer 与原 skills adapter。stream+audit 重建的受控候选为 `toolCall.name=read_file`＋`args.Path`；保旧 `view_file/AbsolutePath` 与顶层 `tool_name/tool_info.parameters.Path`。仅在原 guard 统一解析、decision/audit/permissionOverrides/inspect/启动提示；override 只取已核精确文件，不新 guard/manifest/schema/root。路径策略按原 owner 分列：OCR guard 保原祖先 alias/link deny；skills adapter 保原目录 alias 归一后精确 manifest 匹配的 allow oracle，final-file link/hardlink/hash 边界沿原实现与受保护断言。两者各保原 canonical 根、manifest/bytes/hash、越界/冲突拒绝及同 session pre/post 完整内容覆盖强度，不统一放宽或统一收紧；仅 pre、partial/error/缺 content/hook 自读不算完整读取。受控实际安装 hook 命令验证与真实 native 调用分别记录；031 的 packet guard failed/coverage 未确定及独立远端503原件保留，受控通过不倒填 native 成功。此为材料 scope，同轮447 TCR 独立核进行中；尚未实施/测试授权，新增面未验不能沿原受控 pass 报过。

- **Source / FR / AC**：U-006；D-010（hook 同时接受真实 `tool_name`＋`tool_info.parameters.Path` 与 `toolCall.name=view_file`＋`args.AbsolutePath`，先 realpath 再与 bundle 内精确文件比对，越界与链接逃逸继续拒绝）/ FR-CHAIN-008 / AC-M5-2（真实形状放行，bundle 外与链接逃逸拒绝，既有形状不回归）。
- **Files / symbols**：`skills/third-review/lib/adapters/antigravity.mjs`；symbol: hookDecision（payload 归一化）；`runtime/review/ocr-delegation-adapter.mjs`、`tests/contract/ocr-delegation-adapter.test.mjs`（既有 installAgPacketGuard、audit、permissionOverrides、inspect 与 native 启动提示的同口径消费）。`skills/third-review/test/antigravity-adapter.test.mjs`；symbol: N/A — 测试文件无导出符号，新增 hook 断言。
- **Action**：在 `hookDecision` 先取候选：既有形状 `payload.toolCall.name==="view_file"` 用 `args.AbsolutePath`，真实形状 `payload.tool_name` 用 `tool_info.parameters.Path`；工具名只允许 `view_file`、`read_file`，`tool_info.name` 存在时必须与工具名一致；路径必须为绝对且已规范化，`lstat` 必须是普通文件且最后一段非符号链接，再 `realpathSync` 与 `policy.files` 精确 `file` 比对，命中后保留既有 `nlink===1`、size、sha256 校验；其余一律 deny。`requireNativeHooks` 的版本/合同检查、`packetPolicy` 的 manifest/成员校验、1 MiB stdin 上限与默认 deny 不变。
- **Inputs**：`quality/evidence/2026-10-20-024-build-plan-review-health-and-page-facts.md` §1.2 的真实事件形状与 §1.4 的最小改法；`2026-10-20-014:11-25,167-171` 的只读探针与 stdin 原文未取得限制；无上游 Task，测试用既有 `n3AgPacket`/`n3AgHook` 夹具执行安装后的 hook 命令。
- **Outputs / failure**：真实形状与既有形状对冻结成员返回 `{decision:"allow"}`；bundle 外、别名指向外部、最后一段符号链接、`..` 遍历、未知工具名、缺失路径或 JSON 非法均返回 `{decision:"deny"}`；hook 入口异常仍输出默认 deny，不产生 allow。
- **Boundary / DO NOT TOUCH**：不改 `requireNativeHooks`（`:14-30` 的 `1.4.x` 版本与 `PreToolUse`/`.agents/hooks.json`/`Hard block` 标记）；不改 `packetPolicy`（`:32-52` 的 manifest、realpath、lstat、nlink、size、sha256）；不改 `installPacketHook`（`:68-95` 的 0500/0400 与拒绝替换）；不放宽到 `read_file`/`view_file` 之外的任何工具，不用前缀匹配替代精确成员。
- **Dependency**：`T007`
- **Test tier / skill**：unit / 合同测试 / backend-testing；子进程执行真实 hook 命令，不调真实模型。
- **Scenario / fixture or service**：`n3AgPacket()` 生成冻结 packet 与 `n3AgHook()`；正例用指向 packet 根目录的目录别名构造 `/tmp/...` 链接形式，分别发真实形状 `{tool_name:"read_file",tool_info:{name:"read_file",parameters:{Path:aliasPath}}}` 与既有形状 `{toolCall:{name:"view_file",args:{AbsolutePath:inside}}}`；反例发 bundle 外路径、别名指向外部、bundle 内最后一段符号链接、`..` 遍历、`run_command` 等未知工具；`finally` 解锁权限并删除临时目录。
- **预写测试**：`skills/third-review/test/antigravity-adapter.test.mjs` 的 hook 用例与真实 payload 断言；作者 build-plan，先于实现写完并跑出 RED。
- **可观察接缝**：`antigravity.mjs:54-65` 当前只读 `toolCall/AbsolutePath`；`:99-106` 原生入口读 stdin 后输出 JSON decision；`antigravity-adapter.test.mjs:79-89` 执行 `.agents/hooks.json` 内安装的 command 并解析 decision，是独立于私有函数的 oracle。
- **RED/GREEN gate_cmd**：`npx vitest run skills/third-review/test/antigravity-adapter.test.mjs skills/third-review/test/process.test.mjs skills/third-review/test/review-progress-liveness.test.mjs skills/third-review/test/adapters-health.test.mjs`
- **expected_exit**：RED nonzero（真实形状仍被 deny 时断言失败）；GREEN 0。
- **RED target failure**：ORACLE-P4-ANTIGRAVITY 断言：真实 `tool_name`＋`tool_info.parameters.Path` 对冻结成员应 allow，当前 `hookDecision` 只认 `toolCall.name=view_file` 而返回 deny，断言失败。
- **GREEN oracle**：ORACLE-P4-ANTIGRAVITY；同一命令下真实与既有形状均 allow，bundle 外与链接逃逸均 deny，既有 `view_file/AbsolutePath` 断言原样通过；反向行为：放宽后越界可读或真实形状仍被拒即失败。
- **Evidence**：RED 证据 unavailable — 该补充测试/未来模块尚未存在，当前不可达目标断言；缺文件/import属setup不算RED；首个可达接缝实施前采集（已可达冻结组见016）；GREEN 与三类输入输出存 `quality/tests/2026-10-20-043-p4-success-terminal-cleanup-green.output`。
- **STOP / recovery**：真实形状仍被拒、任一越界/链接逃逸被放行、或 `packetPolicy`/`requireNativeHooks` 需要改动时停，回本卡实施者按 D-010 与 FR-CHAIN-008 重核形状归一化与精确成员比对；保原始失败，不放宽 manifest 或版本检查。
- **Coverage limit**：只证明两种 payload 形状与三类路径输入的 hook 决策；不证明 `agy` 内部是否调用该 hook、真实 hook stdin 原文（014 未取得）或模型遵守结果。
- **测试变更请求**：none — 只新增断言；T007 已负责换事件类型的既有断言，本卡不改或删除既有 hook 断言。
- **Done**：gate_cmd 退出 0、真实/既有/越界/逃逸四类输入输出可复放、`requireNativeHooks`/`packetPolicy`/`installPacketHook` 零改动（本卡减法：只放宽 `hookDecision` 的形状归一化），既有 hook 断言保留，并由未参与实现者读回 `quality/tests/2026-10-20-043-p4-success-terminal-cleanup-green.output` 后判 AC-M5-2。

### 本次 OCR 发现处置与真实原件（2026-10-20）

所有下列quality路径均相对本卡已声明的外置task根；原件保留，不复制raw。

- 审查来源：`quality/reviews/2026-10-20-017-build-code-phase-p4.json`；Codex/luna major原件`quality/reviews/2026-10-20-011-build-code-phase-provider-1.output`，Kimi minor原件`quality/reviews/2026-10-20-013-build-code-phase-provider-3.output`。AG packet read未确认失败保留，不改成通过。
- Kimi minor：原未编号output是计划路径，实际未生产。本卡全部消费指针现指向真实043原件，不新造原路径。原RED为021-p4-t007-red、025-p4-t008-red；原GREEN为024-p4-t007-green、026-p4-t008-green；冻结组为027-p4-plan-health（6通过8非该组跳过）。这些短名均指`quality/tests/2026-10-20-<短名>.json`及同stem.output。
- Codex/luna major：已有成功terminal的wait_for_close在死父/后代持stdio时不得报无terminal。主会话按017明确授权必要窄修：除原存活观察分支，在既有成功wait_for_close分支记一个内存终态；恢复到点优先既有claimCompleted保raw/session/cursor，否则保原失败。这是原“仅观察hunk”边界的具名修正，不扩health-runner/broker/路由、正常close、既有失败/取消或回收逻辑。
- 新增oracle/TCR为`quality/evidence/2026-10-20-136-p4-success-terminal-tcr.md`，独立核为`quality/evidence/2026-10-20-142-p4-success-tcr-independent.md`；case先落盘、短暂移除又恢复的顺序偏差保留，不倒写为先审后写。原三断言TCR独立核仍沿094。
- 动态复现`quality/tests/2026-10-20-039-p4-success-terminal-red.json`及.output：1目标失败90通过。修复后同gate`quality/tests/2026-10-20-042-p4-success-terminal-green.json`及.output：91通过，无timeout/cancel/truncation。诊断原件`quality/evidence/2026-10-20-145-p4-success-terminal-diagnosis.md`。资源加严请求`quality/evidence/2026-10-20-143-p4-success-terminal-cleanup-tcr.md`经独立`quality/evidence/2026-10-20-147-targeted-fix-and-cleanup-tcr.md`核后落同case；`quality/tests/2026-10-20-043-p4-success-terminal-cleanup-green.json`及.output同gate91通过，真实父/后代PID及父进程组均已不存在（ESRCH不存在、EPERM存在）；health_harvested本身仍只证接管，不代回收。该资源原件仅覆盖本POSIX场景，不声明Windows通过。
- controlled hook不证明真实agy模型读取；真实hook stdin、真实慢样本校准未取得。修复后两项 finding 已由 `quality/evidence/2026-10-20-150-p4-findings-independent-readback.md` 定向独立读回为 fixed，资源面由043实际测试；该读回不是全 Phase 重审或质量通过；不以执行绿自判Phase质量，不重派整scope追空。

## L2 — 可删除参考

事件形状样例、探针命令与旧断言原文只用于实施期对照；GREEN 后删除本节不改变 L0/L1：决策、边界、命令与 oracle 已在上方契约头与两张卡中。保留 014/024 原件指针作为差异理由，不在此另建权威。


### 本 Phase 自带判据小结（审后收口）

- 规则锚：spec Appendix A「AC-M5-1」首句「关联 FR-CHAIN-007；来源 U-006；观察对象是受控假 provider 与正常慢 provider。」；「AC-M5-2」首句「关联 FR-CHAIN-008；来源 U-006；观察对象是 antigravity hook。」；decision-log「D-010」与当前 FR-CHAIN-007/008 仍为原行为来源。
- 材料变更影响：本次只补本卡契约头 Done、当前状态、原件和判据小结；不改 spec、独立 AC/oracle、其它 Phase 或生产行为。原修改范围六条源码/测试由原实施者串行持笔；process 额外成功 wait_for_close 的内存 pendingCloseTerminal hunk 是主会话按017 major的具名必要修复授权，来源149/150及136/142/143/147；未扩 health-runner/broker/config/路由或持久状态。
- 已验：原 gate 四文件命令由043真实执行 exit0，91/91；039 为新增成功 terminal 丢失目标 RED（1失败90通过），042/043恢复GREEN。原021/025目标RED、024/026 GREEN、027冻结组6通过及028/029受控变异、030恢复均保原件，不复制raw；043记录父57881、后代57898及组均不存在。AC-M5-1、AC-M5-2按本卡Done首判为pass，只代表原受控判据。
- 未验：真实 native agy读取、真实hook stdin、真实慢模型五间隔校准均 unavailable；后续真实环境验证执行者负责取得隔离环境/真实样本后核验。Windows回收行为 unavailable，本阶段仅POSIX受控场景；后续Windows执行者须用实际平台场景核。UI/browser为N/A，本卡无浏览器可见面。
- OCR：原017为 available-with-failures；Kimi/coding与Codex/luna均completed/parse_outcome=ok，原minor/major分别保013/011 provider.output；AG失败OCR_PROVIDER_PACKET_GUARD_FAILED（native packet prompt read未确认）保原件，coverage undetermined不倒填。原review仅对应当时输入，后修复仅以149处置＋150独立定向读回承接，不追空重派或冒全Phase新审。
- 同源并列：Standards原117＋协议补120，Spec原119＋协议补121，均same_source_degraded、0条可支持finding；范围、截断/未读与真实环境限制沿各原文。它们不替代OCR，原017错误与未确认覆盖不被空findings覆盖。
- finding处置：Codex/luna成功terminal丢失major、Kimi证据路径minor均在149记fixed，150独立确认；原意见、原RED和限制不删。136 case先落盘后短暂移除/恢复、142独立审晚于首次落盘的顺序偏差保真；资源断言按147之后追加，不能倒写先审后写。
- Git范围：本Phase提交仅上述六源码/测试与本卡七条；规划基线另为dd3d320d，P1模块/测试/move-map排除。提交只交付Phase受控结果，不是build-code stage-end、verify-code、发布、merge或物理close。
