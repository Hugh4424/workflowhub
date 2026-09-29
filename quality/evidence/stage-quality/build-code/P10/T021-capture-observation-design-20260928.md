# P10/T021 固定测试执行观察：只读设计核查

日期：2026-09-28。此文是设计核查，不是实施、测试通过或阶段完成事实。

## 现有链实际证明什么

`capture.mjs#runFixedTargetedCapture` 每次生成 UUID receipt/output ref 和 `behavior_fingerprint.run_id`，经 canonical writer 的 `/bin/sh -c` 固定命令执行。writer 在子进程返回、核前后源码快照后写 output/receipt。子进程先发布逐例原始 reporter、case record、聚合 raw、manifest，再把 manifest 指针写入外层 output。父端复核当前源码/材料/目录/库存、receipt、pointer、manifest、逐例 reporter 和 leaf 集合后才返回 `targeted_capture.status=executed`。这条现有原件链，在信任既有 canonical writer 和 Task 存储边界的前提下，足以证明**指定 receipt 曾有一次真实执行**；单独新建普通 JSON 不能加强这个证明。

`dispatch_state` 只在 writer 的当次内存返回值里，持久化 receipt 没它。旧 receipt 可被 writer 返回为 `reused`。所以现有链不能证明**这次调用重新执行**，也不能靠时间或 JSON 中自报的 `executed` 补上。

## 最小选择

推荐先用现有 receipt/ref/hash、固定命令、output→pointer→manifest→raw reporter 链认证“曾执行”，再用本次 `run` 的实际输入及最终阶段行返回值认证“这次 run 消费了哪份”。两项事实分开记录，不新增执行观察文件。这样符合两次 `verify` 同树时任选实际输入一份的语义。

若业务确需进一步声称“这次 `verify` 新跑”，只能在 `runFixedTargetedCapture` 已通过父端全部复核、且 writer 当次返回确为非 `reused` 后发布执行观察；它必须随当次受信返回的 ref/hash 一起传递。当前 `runCapture` 没有 `attempt_id` 输入；独立启动的 `run` 也只持 receipt ref，TaskHandle 没有通用安全枚举 `quality/evidence/` 的接口。因此，单独加一份按自身哈希命名的 JSON，后续 `run` 找不到它，不能完成材料中的跨调用绑定。若坚持跨调用新跑主张，须先明确一个私有定位接线：受信返回的 observation ref/hash 进入同次私有调用，或一个按 receipt 身份确定且只写一次的索引指向内容哈希原件；后者是第二个对象，需登记、处理半写与冲突。不可从调用者 JSON、文件时间或目录扫描推断。

## 若保留执行观察，最小字段和写法

只在完整 `selected`、外层 exit 0、`receipt_ref===freshRef`、`behavior_fingerprint.run_id===runId`、writer 当次状态非 `reused`，且父端复核 manifest/raw/leaf、前后源码/材料/目录/库存一致后，由 `capture.mjs` 经已有 `TaskKernel.publishCanonicalRecord` 写一次内容哈希原件。字段限：schema、Task/已认证 attempt（若取得）、snapshot tree/source digest/material revision、固定 command/hash、receipt ref/hash、外层 output ref/hash、父 run_id、child run_id、catalog ref/hash/revision、registry ref/hash/revision、selection status/selected ids、manifest ref/hash、聚合 raw ref/hash、逐例 record/raw refs/hashes、`dispatch_state:executed`。`observed_at` 若留存只作诊断。写后立即按 ref/hash 重读；发布失败则返回 unavailable，不返回 observed-now。

`reused`、选择失败、完全未映射、外层失败、逐例失败、父端复核失败都**不写成功执行观察**。部分命中但仍有未映射路径，即使选中部分确实跑完，也只保留现有 raw/receipt 和 `unavailable/unmapped_changed_path`，不升为全任务成功。失败原件照旧保留。任何观察均只证明测试执行，业务效果仍是 `unknown`，不改变官方阶段行 schema、公共命令、P5 证书或进度。

## 必要负控和精确改动边界

先用 `tests/contract/build-code-targeted-capture.test.mjs` 做目标失败/通过：`reused`、失败、部分映射、源码/材料/目录/库存漂移不得产出成功观察；更换 receipt 不换观察、伪造 observation JSON、改 output/manifest/raw/hash、错 Task/attempt 必拒。`tests/contract/build-code-case-reconciliation.test.mjs` 核已有 receipt 链与本次消费链分开：同树两份真实回执、本次仅消费输入那份、换两者后重新评价、旧快照拒绝。`tests/integration/vnext-official-stage-run.test.mjs` 核最终行本次返回值、并发替换、pending 行、半写及 stage row error，不得拿写后读到的别次行冒充。只跑这些受影响定向文件，保留 RED/GREEN 原始输出和异源复核。

若采用推荐的无执行观察方案，生产改动限 `runtime/stage/stage-runner.mjs` 私有最终行返回/消费、`runtime/evidence/freshness.mjs` 只读认证、`workflows/build-code/case-reconciliation.mjs` 对账读取和上述测试；`capture.mjs` 不新增 sidecar。若确需新跑观察，才在 `capture.mjs` 专用路径加写入，并先解决跨调用定位与可信 attempt 来源，不扩普通 capture 路径。
