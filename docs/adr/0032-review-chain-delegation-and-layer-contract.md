# ADR-0032：审查链以「委托模式 + 逐路独立审查 + 审查层契约」接入

## 状态

已确认（2026-09-22，任务 `workflowhub-thin-core-card-05-20260919` 的 make-decision 阶段）。
决定来源：母 PRD CARD-05 与 SD-07/SD-08/SD-17、规划 decision-log U-001#5 与 OI-005/OI-013/OI-014、
用户 2026-09-22 当面追加声明 1–6 与 Talk round 1–3 / Grill 的逐条真实答复、
以及 4 份真实 build-code/verify-code 执行会话的取证（合计约 13.4 亿 input token）。

**上一轮修订（2026-09-25，decision-log D-043；三面范围由 D-044 覆盖）**：用户撤销比较选型目标。本 ADR 中原 go/no-go、相对阈值、Architect/wh-review 对照和 `candidate_experiment` 的执行顺序均为历史设计；旧 T011 no-go 仍是历史事实。D-043 当时要求 build-code phase、build-code integration、verify-code 三面正常 OCR 委托的逐面真实能力和官方质量事实。P1–P4 不重启，历史原件只读；该轮修订不证明能力已经实跑。

**现行修订（2026-09-25，decision-log D-044）**：正常 build-code 流程不再自动派发重复的 integration review，也不把它作为 build-code 完成要求。当前仅验收 build-code 每 Phase 的 OCR 审查与 verify-code 一次 OCR 终末代码审查，两面均须有真实输入、独立执行、诚实终态及官方读回。跨 Phase 集成测试、最终聚合、逐 AC 验收与 verify-code 功能验收仍分别保留；旧 integration attempts/results、D-043 原决策及 P1–P4 原件只读保留，不充作两面通过。显式 CLI integration 请求与历史 API/reader 兼容仍保留，本文不宣称所有显式请求被禁止。P5 Phase OCR attempt `3fece791-ee35-5b57-a634-f226bc3c2a6e` 已执行但不等于 AC 通过；verify-code 终末审查尚未执行，两面尚未全部读回/验收。D-044 材料修订本身不证明流程/runtime 已完成切换；缺证据保持 incomplete/unavailable，不恢复比较或 go/no-go。

## 决定

1. **接入形态 = OCR（open-code-review）的「委托模式」**。OCR 只做确定性工程（文件筛选 + 规则解析），
   **实际审查推理由 workflowhub 侧按 `~/.config/workflowhub/config.json` 的
   `wh_review.stages.<stage>.initial[]` 起的独立子代理，用其自身 LLM 完成**；OCR 端不调用 LLM、
   不需要 API key。委托模式下 **OCR 不产出 finding，也不提供 finding schema**，两者均由 workflowhub 自定义。
2. **派发判据 = any-of-N，结果 = 全部成功路并集**（D-035 对旧表述的修正）。任一路成功即可记录审查发生；所有已派发路在有界终态后，其成功 findings 全部入账。同 file:line 与同一 claim 才合并；多路一致为 `corroborated`，单路为 `single_source`，均保留原始来源。失败路不抹除已成功结果，不新增固定审查轮次。
3. **修复层次 = 修「审查层」行为契约，不是给旧工具打补丁**。修复面为
   **派发语义 / 聚合语义 / 超时与取消 / 启动自检 / 成本计量**，10 个审查面共同受益。
4. **现行范围 = 2 个代码审查面替换 + 7 个保留审查面问题修复**；D-043 的 3+7 面集及 build-code/integration 改 diff 决定只作历史，正常 build-code 流程不再自动派发 integration 审查或要求其完成；显式 CLI/API 兼容保留；wh-review 物理删除与
   身份/哈希/快照/回执校验机制的移除**仍归 CARD-06**。

**现行实施顺序**：P3 的隔离候选调用和原对照设计保留为历史；P5 将 OCR 委托适配接入 build-code/phase 与 verify-code 终末两个普通审查面，并分别在真实当前 diff 上验收输入、独立执行、终态、finding/覆盖和官方读回；正常 build-code 不自动追加 integration 审查或要求其完成，集成测试与验收保留。零 finding 不自动失败，但必须有真实完成与覆盖声明并与零派发区分。任一面缺失或不可用时保留 incomplete/unavailable 并在同一任务修复；工具 unavailable 的路径为恰一次由未参与实现者完成的独立替代审查，替代也不可用则记 unverified。两个代码面不再执行旧 wh-review/broker，也不以它们作 fallback；七个保留审查面及 P4 的既有 broker 路径仍可执行，其历史原件只读。

CARD-05 承担 **review 派发面** 的 FR-57/AC-58：送审输入以纯文本路径引用，不把材料身份、哈希、sha、快照或回执读回变派发许可证；派发后的 provenance 及正式 stage 发布认证仍要如实记录。CARD-06 才删除其它通用机制。临时 `candidate_experiment:true` 是 P3 历史隔离标志，P5 收束该选择逻辑，普通请求直接走 OCR 委托；不留下第二个常设 public command、review store 或机器 gate。

## build-plan 适配合同（D-019/D-020/D-032–D-035/D-041）

本节是新 OCR 委托路径的设计合同；首次接入前须由正式 build-plan 修订、审查并绑定当前材料。旧 wh-review 记录只读，不能借旧 forbidden 清单静默删掉新 packet 内容。

| FR-53 六要素 | 新路径取值 | owner 与可判定失败 |
| --- | --- | --- |
| 输入形态 | packet = 当前全文 AC、真实 diff、相关代码和逐文件规则；diff 以受支持扩展名+include 或 git commit 物化 | OCR adapter；AC 截断、diff 被 unsupported_ext 排除均记未审维度 |
| finding schema | WorkflowHub 自有；OCR LlmComment 骨架 path/content/start_line/end_line/category/severity，外加非空 suggestion_code、file:line 与可复现证据、来源集合和强度 | canonical result；锚点无效不得标 true |
| 等待/健康语义 | 两个代码面的 direct OCR executor 以直接子进程的启动、输出、存活采样、退出和取消结果为健康/进度依据，等待真实终态；内部采样默认间隔 5 秒、可配置，不是 3rd-review managed-status 轮询或执行期限。不以运行时长或暂时无输出杀进程。明确取消时清理子进程及 packet，未确认退出不得记 clean；采样结果的官方持续读回和 owner 失联清理尚待实现或验证，覆盖保持 unknown。七个保留面/P4 继续各自的 broker managed-status 契约。 | 两代码面：WorkflowHub direct OCR executor；七个保留面/P4：3rd-review broker/runtime 与 managed-status client/runner；等待时长不是健康判据 |
| unavailable 状态集合 | 下表按派发状态与覆盖维度分类；原始 error_code/warning 原样保留，未知码走同一结构分支 | review record；任何未分类原始信号不得变成功 |
| provider 身份 | initial[] 每项一独立子代理/上下文，宿主记录 provider/model/adapter/attempt；mode 仅校验，不改变路数 | host；身份缺失记 unavailable |
| 审查事实位置 | 沿用 quality/reviews/，新原件 append-only，日期+序号+描述命名；旧原件只读 | canonical writer；不得双写或覆盖旧 ref |

新 verify-code OCR packet 按 D-041 **携带验收标准全文**。旧 wh-review reviewed_execution 的 `forbidden: acceptance_criteria` 是旧路径合同，不能套用新 OCR packet；若新 packet 缺 AC，只能记 `cannot_review_requirement_fidelity`，不得宣称该维度已审。

### unavailable 与覆盖状态的完备分类

适配层只按可观测结构判类，不枚举上游所有未来错误码。每个外部信号保留 raw code/message、来源、dispatch_state、provider_attempts、被排除文件和阶段；未知码按是否已派发进入相应 unavailable 类并标 `unclassified_raw_signal`，不会静默转成成功。

| 分类 | 触发与判定 | 路径 | 记账字段与已取证种子 |
| --- | --- | --- | --- |
| pre_dispatch_unavailable | 路由、身份、git/规则或材料在派发前失败；provider_attempts=[] | 可用则一次独立替代审查，否则 unverified；不阻断同任务修复 | dispatch_state、error_code、raw_message；`ROUTE_UNAVAILABLE`、`REVIEW_HISTORY_UNAVAILABLE`、`is not a git repository`、`not a valid commit ref`、`MATERIAL_INCOMPLETE` |
| dispatched_unavailable | 已派发但该路 transport/provider/timeout/cancel 终态失败；可与成功路并存 | 保留成功路并集；零成功则独立替代审查或 unverified；不阻断修复 | provider_attempts、terminal_status、error_code、elapsed、cleanup；`REVIEW_EXECUTION_FAILED`、`REVIEW_QUORUM_INCOMPLETE` 的旧原始信号不再丢成功结果 |
| partial_coverage | 文件被排除、内容 too_large/上下文截断、AC 缺失、规则回退；可有成功 finding，但相关维度未审 | 已审部分入账，缺失维度 unverified 并披露；不阻断修复 | excluded_files/reason、context_truncated、rule_fallback、unreviewed_dimension；`unsupported_ext`、`ocr rules check` 畸形规则静默回退 |
| completed_zero_findings | 至少一路真实完成且原始/规范 finding 均为零，覆盖声明完整 | 记录零 finding，不与零派发混淆；结合覆盖判断该面能力，不要求非零 finding | completed route 身份、coverage、finding_count=0 |
| completed_with_findings | 至少一路真实完成并有 finding | 并集入账，逐条标 `single_source`/`corroborated` | provider 来源集合、锚点、claim、强度、disposition |

已取证但不构成委托路径 unavailable 的两项也保留：OCR 自管模式未配置 LLM provider 属被否路径，委托模式不依赖它；git 版本低于 2.41 是 warning，若当前 OCR 调用仍完成，不升级为失败。未知上游码进入结构分类并标原始码，故不需要靠易漏白名单假装枚举了全部未来码。

这些分类只扩展既有 quality/reviews 原件；owner 为 runtime/review，consumer 为 stage review facts 与 status 读回。定向测试须覆盖上表每类及未知原始码。删除条件：统一审查结果 schema 经审查替代本分类且上述消费者已迁移；不得平行保留两套分类。

### 并集与入账时点

每个 `initial[]` route 有独立终态；any-of-N 仅决定至少一路成功已发生，**不能**提前丢弃仍在运行的路。两个代码面的 direct OCR executor 等待所派子进程真实退出后提交最终并集；活跃路未结束时保持该 request 进行中，不因总耗时或暂时无进展自动终止。七个保留面仍由既有 broker managed status 观察。去重键为归一化仓内 path、起止行和同一可复现 claim；只按 file:line 而 claim 不同的两条不得合并。`corroborated` 仅在至少两个不同来源报告同一去重键时成立；其它为 `single_source`。来源强度不代替 finding 严重度。任何一路失败、明确取消或未确认清理，只影响该路状态，不删除成功路 finding。

### 对 ADR-0031 的覆盖边界（D-024）

本卡按用户 D-024 裁决承担等待/取消契约与 ADR 覆盖。原 ADR-0031 固定 20 分钟的旧决定由 2026-09-23 用户当前指示更新：审查执行没有墙钟终止上限。两个代码面由 direct OCR executor 观察子进程并等待真实退出；活跃但暂时无新输出不因墙钟被杀，明确取消走 direct executor 的进程终止与清理链，未确认退出如实记账。该路径内部默认每 5 秒采样存活与输出进度，但不调用 3rd-review managed status 或 cancelManaged；采样结果的官方持续读回及 owner 失联清理尚待实现或验证。七个保留面/P4 的 broker 路径继续按既有 managed-status/cancelManaged 契约处理。P2/P4 的既有跨旧 10/20 分钟阈值、真实状态回读、明确取消和 owner-loss 验证属于其原路径，不证明 direct OCR 路径覆盖；不实际等待 20 分钟。旧的 600,000/30,000 ms route policy 与 1,200,000 ms managed wait cap 保留为历史决策，被本段 supersede。ADR-0031 其它不相关决定维持原边界。

## 背景：为什么不是「修工具」

4 份真实会话的失败与「模型不够聪明」无关，全部是编排层机制：

- `initial[]` 语义为「必须全部可派发」，任一所列 provider 未配置即整条 `ROUTE_UNAVAILABLE` 且**零派发**；
  `minimum_heterologous` 在「选择期 / 派发前 / 聚合期」用**三把不同的尺子**，导致派发前 eligible、
  派发后判 `SAME_SOURCE`——**谁跑成功谁被排除**。
  但 `host_provider must be a supported 3rd-review provider` 这一类失败**不是** `initial[]` 枚举造成的：
  该错误串的唯一生产者是 `skills/wh-review/scripts/third-review-host-config.mjs:211`
  （`adapterOf()`：`if (!SUPPORTED_PROVIDER_IDS.has(adapter)) throw new Error(label + " must be a supported 3rd-review provider")`），
  而 label 取 `"host_provider"` 的唯一调用点是 `:701`，它位于 `:708` 的
  `for (const tier of candidates)`／`:710` 的 `for (const provider of tier)` 循环**之前**，
  校验的是 `host_provider` 自身（一个不受支持的 provider id），与 `initial[]` 成员无关；`:205` 的注册表已含 `dsh`。
  **更正记录（2026-09-22）**：本 bullet 早前的表述把「provider 未配置／不受支持」类失败一并挂在 `initial[]` 枚举账上，
  其中上面这一错误串的归因**是错的**（独立替代审查 finding H2 判定为误归因；材料 `decision-log.md` 的 RF-09／P1／OI-008 已同步更正）。
  `initial[]` 的整组严格性作为**代码行为**仍然属实。
- `REVIEW_QUORUM_INCOMPLETE` **丢弃已成功完成的审查**：单会话中 `kimi/coding` 完成 22 次、
  `codex/luna` 完成 11 次（`process_outcome:ok`、最长 1113 s），去重后 ≥70 分钟真实第三方算力 → 0 findings。
  该机制在本任务的 make-decision 方向审查中**被原样复现**（blue attempt：antigravity 220 s + codex 410 s
  产出 11 条 findings，整体丢弃，`result_ref=null`）。
- 轮次上限**只存在于散文**，代码层无任何数字上限；宿主等待预算（45/60/65 s）远小于 provider 需求
  （实测 1,200,000 ms），且**超时不取消 broker**，既未审成又付了额度并留下孤儿进程。
  **更正记录（2026-09-22，按 `decision-log.md` 的 L1／M7 对齐）**：① 「代码层无任何数字上限」作用域过宽——
  应为「**审查链**代码内无数字轮次上限」（反例：`skills/debate/pk-rules.ts:104` 的 pk 环节 `if (round >= 2)`，
  不属审查链）；② `1,200,000 ms` **不是 provider 的需求**，而是宿主侧**总等待上限** `DEFAULT_MANAGED_TERMINAL_WAIT_MS`
  （`skills/wh-review/scripts/simple-review-runner.mjs:41`，其 `:39-40` 自述「It is a total wait bound, NOT a stall detector」）；
  材料实测的 provider 最长耗时是 **432,004 ms**（RF-16）；③ 「45/60/65 s」仓内只有 **65 s**
  （`runtime/review/review-record-route.mjs:26` `DEFAULT_REVIEW_ROUND_TIMEOUT_MS = 65_000`），45 s／60 s 无对应常量；
  ④ 「留下孤儿进程」与本仓注释及 broker 设计**相反**——broker 在超时时**有意不取消**，遗留进程由
  `cleanup(root, ttl_hours)` 回收（实现于第二个仓库 `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:664,702,725`
  ＋ `lib/runtime.mjs:96,135,155`，`orphan_timeout_ms` 默认 30000）。
  实质关切保留：轮次超时 **65 s ≪ provider 实耗最长 432 s**，且 broker 不因墙钟取消。
  **当前语义更正（2026-09-23）**：此处 `DEFAULT_MANAGED_TERMINAL_WAIT_MS=1,200,000` 描述的是旧实现；依本 ADR 前述更新，当前 host 持续读取 managed health 到 provider 真实终态，不再使用 20 分钟停止等待界限。
- `fail-closed` + 「一 phase 一次不重试」把一次基建抖动**永久固化**为该 phase 无法重审。

因此修工具等于把病灶留在原地；修编排层契约才能让所有审查面受益，且与最终删除旧工具不冲突。

## 被考虑并拒绝的方案

- **直接把 OCR 预设为选型（历史方案）**：原方案按母 PRD 的比较要求被拒；2026-09-25 用户以 D-043 明确撤销比较目标，随后 D-044 将现行要求收为两面真实能力验收。本条保留当时取舍，不再阻止正常 OCR 接入。
- **用 OCR 自管 LLM 路径（`ocr review` / `scan`）**：本机未配置任何 LLM provider；
  且该路径与「用 config.json 的 provider 作为审查者」的用户诉求不符；还引入一类新凭据。
- **保留 wh-review/broker 作为可执行 fallback**：母 PRD OI-006 明确旧路径只读，
  **不构成可执行 fallback**，也不得换名搬进 Skill。fallback 改为「一次由未参与实现者完成的独立替代审查」。
- **双写 finding schema**（内部一套 + 导出映射一套）：AGENTS.md 明令禁止新增双写与永久 compatibility bridge。
- **10 个审查面全部换成 OCR 委托**：与 card-02 已承接的「①build-plan 合并审查 + 适配合同文档审查档」重叠，
  且需为每类文档材料另写 rubric，超出本卡可交付范围。

## 后果

- **正向**：派发不再整组失败；已完成的审查不再被丢弃；审查者**能读仓库代码**
  （旧链路合同明令禁止访问仓库，结构上无法发现「与现有代码的意外交互」）；审查标准由 workflowhub 自有 rubric 定义。
- **代价**：finding schema、锚点硬校验、多来源聚合、盲审隔离等原由旧链路提供的能力，
  须由 workflowhub 自行实现或显式放弃——**不得因为「新工具不管」而静默省略**。
- **边界**：wh-review 物理删除、身份/哈希/快照/回执校验机制的移除归 CARD-06；审查基建并发上限值归 CARD-09。
  与 CARD-06 存在写面重叠（它要删的正是本层要修的），按 SD-14「先冻结接口的一方为集成责任方」协调，须错时或分面合并。
- **本 ADR 记录的是已解决的方向**，不引入新的 stage、public command 或 gate。
