# AC-27 四类机器结果：下一步实施候选（2026-09-28，只读）

本文件以当前 worktree 的源码和 `AC27-producer-design-v2-addendum-20260927.md` 为依据。**没有改正式材料或源码，没有跑测试。** 当前 `stage-handlers.mjs#acceptanceCoverageForExecution` 已逐必需场景检查唯一 leaf，并保留非 covered 的 ref；它只修复“一个场景通过、另一场景缺失却被写成通过”的窄问题，**不等于四类机器结果已生产**。正在运行的测试结果由主任务核实，本文不代报。

## 现有调用链与分类放置点

当前 post 材料投影 → `stage-handlers.mjs#acceptanceExecutionFacts` → `stage-runner.mjs#privateAcceptanceScenario`/`executeAcceptanceCommandOrService` → 当前 stdout/stderr 与逐 AC `stage-quality-evidence.v1` leaf → `stage-handlers.mjs#acceptanceCoverageForExecution`（逐场景清点）→ `stage-runner.mjs#publishVNextStage` 的逐 AC 循环 → `publishAcceptanceQualityFact` 写 `stage-quality-evidence.v1`、`acceptance-evidence.v1`、`quality-fact.v1` → `freshness.mjs#authenticateNested` 读回。P10 `case-reconciliation.mjs#readCurrentEffect` 是另一个业务效果 consumer，尚未有四类独立判定。

**唯一机器分类函数**的最小位置建议在 `runtime/stage/stage-runner.mjs` 的逐 AC 循环前，局部 `classifyCurrentAcExecution`：消费 handler 已核的必需场景矩阵、逐 leaf 的真实字节/ref/hash、执行器实测元数据与当前 Task/attempt/material/tree；一次返回 `{result, quality_fact_status, source_refs, reason}`。`acceptanceCoverageForExecution` 只负责场景清点、来源认证和非 covered refs 传递，不再另做最终机器结果决策；writer 不从 `item.status`、子进程 `outcome` 或泛用 `missing→deferred` 猜结果。`publishAcceptanceQualityFact` 只接受这条受信逐 AC 路线产生的受限 override；`freshness.mjs` 必须从原件独立复核结果与外层状态的对应，不靠 whitelist 直接放行。旧通用映射及旧历史记录不重写。

## 每类必须真实保留的输入

所有类型先要：当前 Task ID、stage=`build-code`、attempt/run、材料版本、source snapshot tree、AC ID、当前材料声明的每个必需 scenario 身份（source/sample/scenario/tier）、执行器身份、每条已产生 leaf 的 ref/hash、原始 stdout/stderr ref/hash（运行过时）、实际 exit/signal/timeout/cancel/cleanup。reader 须拒绝旧树、异 Task/AC/attempt、重复 scenario/ref、篡改 hash；损坏不是普通业务 `inconsistent`。

| 候选结果 | 在上述共同字段外的最低真实输入 | 当前可行性 |
| --- | --- | --- |
| `missing` | 当前材料声明 AC/必需场景，且受信清点证明该 AC 没有本次可认证执行 leaf 或运行故障原件；保留清点结果与缺项位置。 | 现有清点和当前 stage-quality wrapper 可表达；writer 仍会把 `missing` 变 `deferred`，需受限 override。 |
| `incomplete` | 至少一份当前、可认证的执行原始字节/leaf，外加未完成的必需 scenario/断言/语义项清单；已通过场景 ref 也必须保留。一个场景 pass、另一无 leaf 是主要样例。 | 当前 handler 已保留 noncovered refs 和 `semantic_gap`，但 writer 未把它判作 `incomplete`，reader 也未独立复算。 |
| `unavailable` | **受信 runner 观察到的故障**：可核的检查点/错误码/发生时间、执行器和 scenario 身份；已启动进程另附实际 timeout/cancel/error/exit/cleanup 与 stdout/stderr 原字节；未启动要明确记录 `not_started` 和真实能力检查。不能仅有 `item.status`、`reason` 或子进程 stdout 的 `outcome=unavailable`。 | **当前来源契约不足，不能实施可信正例。** `privateAcceptanceScenario` 多个分支返回无 ref 的 unavailable；现有 leaf 的 `outcome=unavailable` 可由子进程自报，且验证器要求 exit 0、断言全通过，不能证明真实环境故障。 |
| `inconsistent` | 两个**相互独立且均受信**的当前原始观察，对同一 Task/attempt/scenario/AC/断言身份给出互斥事实；保留双方 ref/hash、各自 producer、冲突字段与机器比较结果。不同场景一 pass 一 fail 是旧 `fail`，调用者 `covered` 与真实失败 leaf 冲突也以 `fail` 为准。 | **当前来源契约不足，不能实施可信正例。** 当前 parser/coverage 拒绝同 scenario/AC 重复，单个 leaf 仅有一个状态；仅把两份手写 wrapper 拼一起不是正常 stage 的可达输入。 |

`quality-fact.v1` 逐 AC 状态对应：`missing/incomplete/inconsistent→missing`，有受信故障原件的 `unavailable→unavailable`，实际断言失败 `fail→failed`，全部必需场景和证明齐全才 `pass→passed`。当前 `freshness.mjs#expectedPassed` 仅允许 `missing` 搭非终态；可信 unavailable 的读回必须同步加入**仅** `unavailable↔unavailable` 的严配，拒绝反向或其他混配。`deferred` 历史字节保持可读；新子进程自报延期不等于真人决定或当前材料授权。

## 先补的最小来源契约（不新增账本）

1. 对 unavailable：在现有 `stage-quality-evidence.v1.subject_fact` 中增加受信 runner 生成的**故障观察**，至少有 `observation_kind`（白名单：adapter_absent/process_timeout/process_cancelled/process_start_error/service_unreachable 等实际可观测种类）、Task/attempt/material/tree/scenario/AC/executor、`started`、发生点、错误码与时间；已启动须附既有 stdout/stderr ref/hash 和进程/cleanup 元数据。由 `privateAcceptanceScenario` 或 `executeAcceptanceCommandOrService` 的实际分支产生，写入现有内容寻址 stage-quality 路径；handler 必须传 ref/hash，reader 重读并按种类核对应字段。仅当此原件存在且认证，才允许 wrapper.result 和 quality fact.status 都为 unavailable。无原件则按真实情况 `missing/incomplete`，不冒认故障。
2. 对 inconsistent：先确定一条**正常正式运行可到达**、且能保存两份受信来源的冲突场景；在同一既有 stage-quality wrapper 的 `subject_fact` 增加 `conflicting_observations: [{ref,sha256,producer,identity,field}]` 两项及机器对照字段，reader 独立重读双方和重算冲突。若现有执行链天然禁止同身份双来源，应保持该类“校验器可表达、正式生产不可验证”，不能放宽 parser 的唯一性或造双写机制只为产出一个绿例。必要时另选已存在的两个独立、受信来源字段，但必须先证明其实际 producer 和同一观察身份。
3. 上述扩展只是现有原件中的窄字段，owner 仍是 stage writer，consumer 是 freshness/P10/verify-code；不新增 public 命令、schema 文件、持久进度对象或第二判定者。任何字段若 reader 无法从原始字节独立复核，就不进入 `pass` 或已实现声明。P7 当前正式材料若仍禁写 `runtime/stage/**`，先由材料 owner 修订写面；改材料/源码后，旧树绑定测试与阶段行只算历史。

## 四个隔离 Task 失败样例的优先顺序

1. **缺失**：声明一个必需 AC/scenario，真实 stage run 无本次 leaf/故障原件；目标 RED 为当前 `deferred`，GREEN 为 `missing`，外层 `missing`，reader 拒绝冒充 pass。
2. **未完成**：同 AC 两个必需场景，A 正常 pass，B 无 leaf；先确认现有窄补丁不再 covered，再让唯一分类给 `incomplete` 并保留 A 的原始 ref/hash。B 补齐后的新快照才可 pass；旧失败原件保留。
3. **不可用**：先落上述受信故障原件契约，再用真实无 adapter 或受控超时的正式 stage run，验证 `unavailable` 原件与 reader；在契约落地前**不实施正例**，只做“无 ref 的 item.status 不得当故障”的负控。
4. **互相矛盾**：先证明正常 stage 有双受信来源及可达冲突，再跑同身份矛盾，验证两份原件和 reader；在此之前**不实施正例**，只做不同场景一 pass 一 fail 必须是 `fail`、重复/伪造 ref 必须拒绝的负控。

四个样例分别用隔离 Task store 运行现有正式入口，不能在真实 CARD-04 Task 的同 AC/材料/树下连续追加四个当前事实；P10 reader 当前要求唯一候选。局部合同测试与样例原件不能代替当前 CARD-04 的业务效果、真实页面、独立审查或历史 123 条字节兼容。当前可先做 1、2 和 3/4 的拒绝负控；3/4 正例的来源契约与实际可达性未建立，保持 not_done。
