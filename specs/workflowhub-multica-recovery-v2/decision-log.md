# WorkflowHub Multica 恢复决定

## 原始需求

WorkflowHub 在 Multica 执行 ZHI-938、ZHI-944 时反复因 Runner、TaskHandle、receipt、invocation outcome、snapshot、bridge、doctor、review lock 等辅助机制停滞。用户要求停止逐卡点补机制，审计事故期间的 27 个提交，从根因恢复简单流程，并保证只要当前阶段需要的四材料可读，同一 task 就能继续修复；质量缺失只能影响完成结论，不能冻结工作。

## 已确认决定

用户于 2026-08-09 确认按恢复计划实施：

1. 从 clean `main@6efd67593ef1e191a4ab929a75402905bc6b49ce` 建立独立 worktree，做前向恢复。
2. `b61e261ba385cf29e9496f397403bf315cc06a22` 只作事故前语义对照，不作开发基线。
3. 不整体 revert 27 个混合提交；逐对象族保留安全修复、删除违宪控制面。
4. 当前真相只有 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`。
5. 工作资格、运行事实写入、完成声明必须分离。
6. Talk、Clarify、Grill 只属于 make-decision；下游读取四材料，不重演过程。
7. 不修改 Multica 源码、provider/model/API Key/daemon 配置。
8. 四材料可读只表示可以工作，不能直接表示阶段完成或触发 completion publication；完成仍由真实交付、测试、逐 AC、独立审查事实和人工交接证明。
9. `tasks.md` 每张卡保留一个最小状态和一处执行事实，供选择下一项工作；它属于四材料，不是 receipt、runtime gate 或第二 ledger。
10. build-plan 仍按宪法保留大白话总结后的真实用户确认；确认只约束“计划已接受/交接完成”的声明，不是开始或继续工作的许可证，也不授权不可逆操作。
11. `wh-review` 不新增本地 lock 或 managed request-id 流程。3rd-review 公共同步 `run` 没有 request-id 参数，因此每次调用如实是一 caller 一次新的 broker public run；不复用旧 canonical result。

## 主要理由

- 整体 revert 会一起丢掉路径认证、symlink 防护、Git 枚举性能和幂等写入等有效修复。
- `6efd675` 只是干净 Git 起点，不是健康架构；所有 27 个提交仍需逐项处置。
- 同 task 直接修复比 successor/recovery/rebind/continuation 更简单，也符合宪法。

## 风险与边界

- 旧脏 worktree 仅归档，不 cleanup；commit、push、merge、cleanup、Multica 同步分别授权。
- 历史 reports 和原始 review/provenance 只读保留。
- 删除对象若仍有真实 consumer，只暂停该项删除并重新设计，不冻结其他工作。
- Downloads 中的恢复计划只是事故设计证据，不是第五份当前材料。
- 2026-08-09 的独立宪法审查与 `opencode/v4flash` 复核均给出 REVISE；当前实现不得合并或宣称完成，必须先修正完成谓词、遗留 current projection/review-flow、公共行为与 immutable report 问题。

## 2026-08-09 复核事实：继续修复，不宣称完成

- 事实：最终一次 `opencode/v4flash` 独立复核（3rd-review runtime `0e6af083-c63b-4f98-adca-3d5961bfbfc9`，packet `recovery-v2-r3.KGCs7h`）仍返回 `REVISE`。阻塞事实是 `tasks.md` 已把 T6 标成 completed/PASS，但本文件仍保留上一条 REVISE 且没有新的 superseding review fact；这会让四材料互相矛盾。
- 处置：本条只纠正此前错误的 `completed/PASS` 任务状态，不改写上一条的 `REVISE` verdict；T6 恢复为 `in_progress`，待补测试、持久化当前复核事实并重新取得独立结论后再更新。
- 边界：该复核事实是质量/审查事实，不是新的运行许可证、锁、receipt、snapshot、bridge 或第五份当前材料；当前 task 仍可直接修复。

## 2026-08-09 最终独立复核事实：PASS

- 事实：新的 `opencode/v4flash` 独立复核（3rd-review runtime `a90a8094-1666-44d1-ab5c-1c4049827029`，packet `recovery-v2-r3.acHTPA`，packet hash `99674c01740760cf9af13ad43c852b8c8b6c60b946cf6f1f60d958e1368d893b`）返回 `PASS`，没有 blocking findings。原 `REVISE` 报告和本文件中的原始事实均保留，不被改写；本条是在新的审查快照和当前材料一致后记录的后续事实。
- 处置：T6 可以依据最终命令验证报告和本次独立审查事实标记为 `completed`；这只表示恢复计划的验证工作完成，不授权 commit、push、merge、cleanup 或 Multica 同步。
- 非阻断修正：已把 canonical result 复用的许可性表述收窄为“每次调用都是一次新的 broker public request；不复用旧 canonical result”；已同步 `wh-review` 与 `spec-clarify` 的 catalog 元数据。没有新增控制面、第五份当前材料或兼容 bridge。
- 边界：该 PASS 是质量事实，不是运行许可证；四材料仍是唯一当前材料，质量事实仍不能冻结同一 task 的修复。

## 2026-08-09 复核后修正：重新验证 T6

- 事实：对最终 PASS 快照的复核发现 `make-decision` 完成谓词仍把独立 `grill` test 当必需项，但当前流程把 Grill 结论写入 `decision-log.md`，不生成该 test receipt；这会让正式完成投影保守地长期保持 `in_progress`。
- 处置：移除该多余的 `grill` 完成谓词；保留 make-decision 的 Grill 技能和 decision-log 结论，不新增 receipt、gate 或控制面。同步把恢复计划中的 inventory 边界限定为已发布 architecture artifacts 与当前步骤索引的区别。
- 状态：T6 暂回 `in_progress`，等待最新命令事实和独立复核；此前 PASS 报告原样保留。

## 2026-08-09 复核后修正：补齐同类研究谓词与真实格式覆盖

- 事实：`opencode/v4flash` 复核 runtime `120c1d9a-20ba-45e2-a7b5-56fe44ce3751`（报告 `recovery-v2-opencode-v4flash-120c1d9a-revise.md`）确认 `research: "test"` 与 `grill` 相同，文档化流程允许研究跳过或不可用时只写 `decision-log.md`，不应把可选研究收据当作 make-decision 完成条件；同时发现 build-code 集成审查仍按旧任务卡格式解析。
- 处置：从 make-decision 完成谓词移除 `research`，保留研究事实的可选记录；把集成审查任务解析统一到当前 H2 任务卡的 `状态`、`执行事实`、`证据`、`Trace` 字段，并加入当前格式测试；补回 stage summary/confirmation summary 的漂移测试；删除 runtime facade 的两条死 `publish-*` 映射。

## 2026-08-10 复核后修正：收紧 vNext 质量命名空间并完成命令验证

- 事实：后续静态审查发现 vNext 新写入仍有三类边界不一致：canonical implementation diff、manual delivery close 和 stage evidence reader 仍允许/生成根级 `evidence/`；stage runner 还保留一层 publication lock 描述，容易重新形成第二协调控制面；`review-runner` 静态分类文字仍误称 review coordination lock。全量回归另发现测试夹具和“执行事实为空”的跨行空白解析问题。
- 处置：vNext canonical record、implementation diff、manual delivery close、acceptance/verify evidence 均统一到 `quality/`；legacy reader 仍只读兼容既有 `evidence/`；vNext ref 校验只接受 `quality/`；移除 stage-level publication lock，保留 TaskKernel 的原子写入；把静态描述改为可信的 review orchestration；把执行事实解析收紧为行内空白，并修正所有当前 vNext 测试夹具。
- 验证：`npm test` exit 0，safe `145` files / `1245 passed` / `1 skipped`，exclusive `2` files / `31 passed`；`npm run check` exit 0；`npm run compare:public-behavior` exit 0，7 个 public behaviors 均为 approved internal change，authorize 为 approved bug fix；`npm run probe:public-behavior` exit 0，10 tests passed；baseline verify exit 0，7 behaviors / 8 probes；`git diff --check` exit 0。
- 边界：本条没有新增 public command、receipt、lock、bridge、snapshot、successor、第五份材料或质量 gate；vNext 新写入路径收紧不改变旧记录读取；这些是当前验证事实，不是运行许可证。T6 仍待全新 `opencode/v4flash` 独立复核后决定是否完成。

## 2026-08-10 独立审查后的最小风险修正

- 事实：独立 `opencode/v4flash` 复核 runtime `16848180-4eb5-4d48-9aae-6cfb2ba3e2e8` 返回 `PASS`、无阻断问题，但指出三项非阻断维护风险：`stage-runner` 中未使用的 `actionableMissing`、恢复计划附录 A 十项缺少显式 `Consumer:` 字段、`plan-design-review` catalog 元数据与 build-spec 条件依赖不一致。
- 处置：删除死函数及悬空计算；为 A01、A02、A04、A05、A07、A12、A18、A23、A24、A27 补显式 Consumer；把 `plan-design-review.used_by_stages` 校正为 `[build-spec]`。这些改动只删除/校正文档和元数据，不新增 Runner、TaskHandle、receipt、snapshot、bridge、lock、continuation、第二执行器或 public route。
- 验证：微修正后 `npm test` exit 0（safe 145 files / 1245 passed / 1 skipped；exclusive 2 files / 31 passed）；`npm run check`、`npm run compare:public-behavior`、`npm run probe:public-behavior`、baseline verify 和 `git diff --check` 均 exit 0。微修正改变了审查快照，必须重新冻结并取得新的独立结论。
- 边界：微修正前的 PASS 原文以 `quality/reviews/reports/recovery-v2-opencode-v4flash-16848180-pass-before-microfix.md` 不可变保留；本条不把它冒充为微修正后的最终审查。

## 2026-08-10 第二次独立审查后的最小边界修正

- 事实：新的 `opencode/v4flash` 复核 runtime `b95a8e19-4338-4d72-9a14-5588c351c80e` 返回 `PASS`、无阻断问题，但指出 `stage-runner` 中的死 `reviewFact`、legacy stage-content reader 缺少行为测试，以及 make-decision 的 direction/detail review 可能依赖 evidence 顺序。
- 处置：删除死 `reviewFact`；保留 `verifyStageContentEvidence`，因为 AC-012 明确要求历史 stage-content 只能通过显式 ref/hash 读取，并补真实 envelope/ref/hash 行为测试；make-decision 完成谓词改为明确的 `direction_review` 与 `detail_review` 两项，显式按 facts 映射，缺任一项不再回退到 evidence_refs 的第一条 review。补充“direction 通过、detail 失败时仍 incomplete”的回归测试。
- 边界：这仍是删除遗留噪音、保留既有历史只读能力和修正现有完成映射，不新增 receipt、lock、bridge、snapshot、continuation、第二执行器、第五份材料或质量 gate；质量事实仍不决定同 task 工作资格。
- 验证：`npx vitest run tests/contract/four-material-non-gate-contract.test.mjs` exit 0（13 passed）；包含 make-decision review 映射的 e2e 与 stage completion 聚焦测试 exit 0（12 + 43 tests）。该修正改变了审查快照，必须再次冻结并取得新的独立结论。

## 2026-08-10 第三次独立审查后的完成边界修正

- 事实：新的 `opencode/v4flash` 独立复核 runtime `b5f9ce57-069c-44ba-8cbb-6a182fece9b0` 返回 `REVISE`。唯一阻断项是 `make-decision` 的 `decision_coverage` 仍依赖被官方 `run` 明确禁止由 caller 提供、且当前没有生产 writer 的 `audit`；因此正常 make-decision 即使四材料和真实审查齐全也无法完成。复核还确认相同的不可达审计门槛出现在 build-spec 的 traceability 以及 build-plan/build-code 的 `missing_items`。
- 处置：删除 build-spec 的 audit-only `traceability` 完成谓词和 build-code 的历史 `tasks_complete` 完成谓词；make-decision、build-spec、build-plan、build-code 的审计缺失统一改为 `audit_gaps` 事实，不再进入 completion `missing_items`。审计记录仍可被读取、校验和展示；没有新增 audit writer、receipt、bridge、lock、snapshot 或第二套 gate。修正 `sectionHasContent` 的标题解析，使当前中文四材料节标题真实可验证。
- 验证：make-decision、build-spec、build-plan、build-code 在没有 audit receipt 时仍能通过官方执行路径继续；定向回归 `108 passed`。缺失审计仍以 `audit_gaps`/质量事实披露，不能被宣称为审计通过；真正的内容、测试、AC、审查和人工确认事实仍按现有谓词如实判断。
- 边界：本条改变了独立复核快照，T6 继续保持 `in_progress`，必须在全量验证后重新取得新的 `opencode/v4flash` 结论；旧 `REVISE` 原文不可变保留。

## 2026-08-10 只读复核后的历史任务 gate 修正

- 事实：只读子代理确认 `build-code` 仍把 `tasks.md` 的历史“任务完成”状态放进 completion predicate；而 `certifyCurrentTaskCompletion` 已明确把它定义为历史审计，当前实现、测试和 AC 才是当前事实。旧任务卡未补齐时，阶段会被无关历史状态拖成 `in_progress`。
- 处置：删除 `build-code.tasks_complete` predicate 及仅服务于它的 dead parser；保留 `tasks.md` completion history 在现有 `phase_completion.audit_gaps` 中，继续如实披露，不伪造完成。补充无 audit、无历史完成 gate 的 public build-plan/build-code 回归断言。
- 验证：六个受影响测试文件共 `132 passed`；T6 仍保持 `in_progress`，等待本轮全量命令和新的独立 `opencode/v4flash` 审查。

## 2026-08-10 最终独立复核事实：PASS

- 事实：当前快照的独立 `opencode/v4flash` 复核（3rd-review runtime `8e5f15af-327f-4cea-8d05-4203c73f4c9e`，provider session `ses_01819cc86ffebgxA9i1Lg1Cr1U`，packet `recovery-v2-r3.OS9MZl`）返回 `PASS`，`blocking_issues=[]`；附件 `file_only` 字节身份验证通过。不可变原文保存在 `quality/reviews/reports/recovery-v2-opencode-v4flash-8e5f15af-pass.md`。
- 处置：T6 标记为 `completed`，仅表示本恢复计划的实现、验证和独立审查完成；不授权 commit、push、merge、cleanup 或 Multica 同步。三项非阻断风险原样保留为质量事实：退役 phase reader 的潜伏死分支、decision-log 标题契约需显式同步、旧任务需按新流程真实生成 Talk/Clarify aggregate。
- 最终验证：safe `npm test` 为 `145 files / 1245 passed / 1 skipped`，exclusive 为 `2 files / 31 passed`；定向受影响测试为 `132 passed`；`npm run check`、public behavior compare/probe、baseline verify、`git diff --check` 全部通过。
- 最终边界：四材料仍是唯一当前材料；audit、历史 tasks completion、receipt、review、provider、snapshot、bridge、lock 等事实不会冻结同一 task 修复，也不会被伪造为通过；本轮没有新增控制面或第五份材料。

## 2026-08-10 新一轮实施决定：保留 Phase review，补齐最小测试与 subject 契约

- **原始需求**：用户要求继续修复，但明确 Phase 开发完成后要按 plan/tasks 中的测试路线执行 `test-routing-advisor`、`testing-system-blueprint` 和一个适用的具体测试技能；Phase 最好有实现提交并对该提交做异源审查；最终要详细设计、审查、实施、测试、审查和验收。
- **Clarify 结论**：`testing-system-blueprint` 属于 build-plan 的 advisory 设计输入，不是 build-plan 的 Grill，也不执行测试；`test-routing-advisor` 是无状态分类；具体测试技能属于 build-code；Phase review 是 Task-local 质量/交接事实，不是运行 gate。文档/材料 Phase 不伪造代码测试。
- **决定**：在同一 `workflowhub-multica-recovery-v2` task 内按 T001-T008 执行；先冻结 `spec.md/plan.md/tasks.md`，再以 RED→实现→GREEN→真实 diff/AC→独立 review→finding repair→handoff 推进。若本 Phase 有独立授权，提交只包含实现代码/必要测试；review subject 由 host 根据 `phase_id`、真实 changed files、baseline/candidate tree 派生；commit tree 不匹配时旧 review 失效；无 commit 时记录 unavailable，不创建 recovery/rebind/continuation。
- **不做**：不把 Grill 放入 build-plan；不新增 receipt、snapshot lineage、review lock、managed request-id、第二 executor、第五份材料或 public route；不删除 Task-local Phase review；不改 Multica、main、provider/model/daemon。
- **验收事实**：`spec.md` 新增 FR-9/FR-10、AC-10/AC-11/AC-12；`plan.md` 按 `plan-task.v3` 重写并完成 source→FR→AC→Task 映射；`tasks.md` 重写为 T001-T011，去掉旧 T6 completed/in_progress 冲突。当前实现仍未因本条自动宣称完成，待独立设计审查与后续 Phase 验证。

## 2026-08-10 当前计划的独立设计审查事实

- **审查来源**：两个独立只读子代理分别做宪法审查和依赖/测试审查；未修改代码，未把审查意见当作通过许可证。
- **发现**：初版计划的 RED/GREEN 卡存在跨行为配对歧义；使用了通配 exact files；T006 错误引用不存在的 “T1 inventory”；FR-5/AC-6 owner 不够明确；blueprint 尚未接入 build-plan；Phase review 的 commit OID、parent、`commit_oid^{tree}`、candidate tree 和无 commit 记录格式不完整；最终 `npm test` 不能单独证明 verify、逐 AC、宪法和隔离。
- **处置**：将计划收敛为 T001-T011；T002/T003、T004/T005、T006/T007、T008/T009 各自独立 RED→GREEN；改用逐文件清单；把 FR-5/AC-6 显式映射到 T002/T003；将 blueprint 接入 build-plan、保持 build-code 消费而不重复执行；补齐 Phase subject/提交树字段；将最终命令降为基础信号，另行要求逐 AC、verify、异源 review、宪法和隔离证据；不新增第五份材料或控制面。
- **当前状态**：设计审查的阻断项已修正；`npx markdownlint-cli2` 四材料 exit=0，Phase route 合同当前 GREEN 为 3 tests passed。T002 的历史 RED 未在本轮材料已被修改后重新伪造，后续执行事实必须如实记录。

## 2026-08-10 Phase A 首轮异源审查与修正事实

- **审查来源**：`opencode/v4flash`，3rd-review runtime `2f529c00-2c5b-4b00-a2eb-a6306ce0964b`；附件 `file_only` 身份校验通过；首轮 packet 的 `changes.diff` 误为 commit stat，未包含 hunks，因此不能把它当作完整代码内容审查。
- **结论**：无 blocking；四材料、文件边界和 Phase A 方向一致。非阻断项为：任务映射遗漏 T001；T002/T003 没有显式记录具体测试技能；FR-10/AC-11 未对称写出 parent；T002/T003 执行事实与当前 GREEN 结果存在时间差；后续 packet 必须提供完整 diff。
- **修正**：映射补入 T001；Phase A 明确以 `backend-testing` 作为唯一具体测试技能并保留材料/文档 N/A 边界；FR-10/AC-11 补充提交 OID、直接 parent、`commit_oid^{tree}`；T002 未捕获的历史 RED 不回溯伪造，T003 只记录实际 GREEN；重新生成完整 diff packet 后再接受 Phase A 的最终 review 结论。
- **边界**：上述修正只更新当前四材料和审查事实，不新增 receipt、snapshot、lock、bridge、ledger 或 public route；首轮 review 的原始输出和 hashes 保留，不覆盖为新的 verdict。

## 2026-08-10 Phase B 实施与 GREEN 事实（异源审查待完成）

- **范围**：修复 Phase build-code review subject 的宿主绑定，避免 caller、可变任务卡路径或旧 snapshot 改变审查对象。
- **实现**：`review-runner` 只消费 `phase_id`；`review-source` 对已提交 Phase 以直接 parent tree 到 candidate tree 派生 changed files，并记录 commit OID、parent、parent/commit/candidate tree 与一致性；未提交 Phase 记录 `commit_oid=null`；树变化使旧结果不可复用。schema、合同和 Phase 回归已同步。
- **测试事实**：T004 在实现前真实 RED（6 中 3 项新增断言失败，exit=1，无 setup 错误）；T005 Phase 合同 GREEN 为 1 file / 7 tests passed，review-runner、schema、integration subject、review-layering 聚焦回归另为 36 tests passed。具体测试技能为 `backend-testing`；测试和 review 仍是质量事实，不是推进 gate。
- **当前状态**：Phase B 代码与测试尚未取得最终独立 `opencode/v4flash` 结论；在审查完成前不标记 Phase B 完成，不宣称整体修复完成。
- **宪法边界**：没有新增 receipt、snapshot lineage、review lock、managed request-id、bridge、successor/recovery/rebind、第二执行器、第五份材料或 public route；没有改 Multica、main、provider/model/daemon。
