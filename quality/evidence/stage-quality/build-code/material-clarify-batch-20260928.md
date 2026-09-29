# CARD-04 build-code 材料缺口合并核查（2026-09-28，只读）

本页只合并现有证据，供材料 owner 一次修订使用；没有修改 `spec.md`、Phase、代码、Task facts，也没有运行测试。所查工作树为 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`，分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。工作树有未提交文件；下列历史收据不自动代表修订后的材料或代码版本。

## 确需材料 owner 一次纠偏

| 位置与事实 | 最小材料修订；谁消费 | 是否要用户新决定 |
| --- | --- | --- |
| **P4/T006：负控目标过时。** `phases/P4.md:26,38` 仍要求临时把 `source_ids` 改成 `[]` 后测试变红，且一处称五个冻结 `it` 只读；现在无原始 U/V 索引时合法结果就是 `[]`，`runtime/stage/stage-runner.test.mjs` 已是 7 项且为修订版。`P4/T006-source-and-array-revision-20260927.md` 保存旧字节及修订证据，`P4/T006-phase-review-current-20260928/summary.md` 有正式审查 6 个发现，不能用旧 Action⑤ 判当前实现。 | P4 owner 只改 `phases/P4.md` 的 Action⑤、L0/测试数及历史/现行分界：以**有认证索引的 AC**（如真实 AC-29 的 U-006）为负控，临时删掉已认证 U/V ID 后同一目标测试必须红、恢复后绿；无索引时保持空 ID 和逐项披露。同步 `phases/index.md` 的 P4 行，写清现行 7 项、旧五项与旧收据仅历史。消费者：P4 定向测试/独立 Phase 审查、P5 的 acceptanceChain 读取。旧原件不改。 | 不需要；这是把已确认的真实来源规则落实到测试 oracle。 |
| **P5/T007–T008：零例外含义未定。** 当前 `spec.md:320,409,449-450`、`phases/P5.md:23` 要求 `exceptions` 非空，同时只允许真实人写例外；实际 CARD-04 没有可认证的人写例外声明，P5 私有 hook 返回 null，三检查点缺失。用户此前只同意**最终报告在核查确无例外时写“没有例外”**，不能据此伪造一条中途例外或把程序断言当成人工声明。 | 取得下面的用户决定后，P5/决策 owner 同一批改 `decision-log.md` 的 D-004/DER-05 现行解释、`spec.md` 的 DER-05/报告形状、`docs/architecture/test-asset-governance-rules.md` 相应规则、`phases/P5.md` T007/T008 口径；必要时同步 `phases/index.md`。先定清“真实无例外”的可认证表达和来源，再由 build-code owner 改 `stage-end-report.mjs`/测试与 P5 声明读取。消费者：P5 同次报告 writer、`freshness.mjs` 私有 reader、P6/T012 与 P13/T024。保留历史 G-2 及机器 `not_done`，不能用零例外抹掉它们。 | **需要**：中途 P5 对“确无例外”采用何种正式人写声明/允许值。用户对最终报告的许可不等于这条机器可读来源契约。若尚无答复，继续其它独立工作，P5 保持未完成。 |
| **P10/T021：当次官方绑定未授权。** `P10/T021-stage-receipt-binding-gap-20260928.md` 的勘误已撤回借 P5 证书证明 P10 的建议；官方 `facts.jsonl` 阶段行没有测试回执 ref/hash。同树、同材料仍可能是两次运行。当前 `phases/P10.md`/`phases/index.md` 只授权 P10 私有入口、reader 与 P9 capture 接线，未授权官方 stage producer 为本次 P10 回执发布同次来源。 | 若要求 `current_execution_unverified` 转成已验证，P10 与 stage producer owner 一次补 `phases/P10.md`/`phases/index.md` 的精确写面：`runtime/stage/stage-runner.mjs` 当前 build-code 私有发布点、必要的 `runtime/evidence/freshness.mjs` 只读认证、`workflows/build-code/case-reconciliation.mjs` 和定向测试；先证明现有原件可扩展，不能另建账本或改冻结阶段行。来源须同时绑定该次阶段行时间、Task/树/材料、**P10 本次**回执与测试/逐 AC fact ref/hash；reader 独立重读。消费者仅 P10 业务效果对账及后续 verify-code。错同树旧回执、旧阶段行、缺 fact、坏 hash、半写为负控。 | 不需要另问用户；用户已要求全量真实验证。但必须由对应材料 owner 精确登记并独立审查。 |
| **P11/T022：两处合同未闭合。** `P11/T022-same-source-handler-20260927.md` 只证明临时 Task 协议，未实跑真实页面；`P11/T022-real-ui-consumer-audit-20260928.md` 发现 `stage-handlers.mjs` 对仅后台路径直接给 `not_applicable`，而后台结果仍可能供页面使用。当前 Phase 要求同源 aggregate，但逐 AC 同源读取与适用性负控还需精确落点。 | P11 owner 在 `phases/P11.md` 与 `phases/index.md` 一次写明两个窄增量：① `runtime/evidence/freshness.mjs#authenticateE2eExecutionStageQuality` 对每个浏览器 case/AC 重读**同一个** `acceptance_execution` 原始 ref/hash 与 `ui_qa_projection`，按 Task/case/AC/attempt/材料/树/服务身份核对；漏项、串项、多 AC 借一份结果不得 pass。② `runtime/stage/stage-handlers.mjs#uiQaApplicability` 消费 P8/P10 已认证的后台→页面关系；关系未知为 `unknown`，确无页面消费者才 N/A，有页面但服务不可用为 `unavailable`。在 `tests/contract/acceptance-execution-tier.test.mjs` 等现有 P11 定向测试里加可失败正反例。消费者：现有逐 AC quality fact/verify-code reader 和真实浏览器检查。若未取得页面，保持 unknown；不能用内存 settings 夹具冒充。 | 先查 P8/P10 真实消费者。只有确有外部页面而仓库无法发现其 URL/服务/权限时，才需用户提供实际入口；无需先向用户确认代码修复。 |

## 直接继续 build-code，不靠改材料制造通过

| 项 | 下一动作与边界 |
| --- | --- |
| P3/T005 | `P3/T005-phase-handoff-current-20260928.md` 已有当前 8/8 正式定向收据及独立审查零新发现。历史 G-2 的**该处两条回归**可按原件结算；AC-18/19 全项仍缺。无需为 P3 再改材料或重跑无关测试。 |
| P4 当前源码/收据错版 | `P4/current-gap-audit-20260928.md` 指出 runner/handler 已晚于旧 7/7 receipt。材料纠偏并稳定源码后，重取一次定向收据和独立 Phase 审查；真实 CLI acceptanceChain→P5 的逐 AC ref/hash 留给集成核查。不要把 P4 helper 绿当真实报告。 |
| P5 同次 writer/reader | `P5/T008-current-source-recheck-20260927.md` 与 `phases/P5.md:88-103` 已给私有生产/读回的精确写面和 P1-only 不产 P5 文件的负控。用户决定零例外语义后，直接补真实声明来源、当前 P5 review、同次来源和三文件，做坏 hash/半写/重试控制；不需再新增材料权限。 |
| P10 测试孙进程 | `P10/T020-review-fixes-20260927.md` 已在现有 `targeted-runner.mjs`、`targeted-capture.mjs`、`capture.mjs` 与 `tests/contract/build-code-targeted-capture.test.mjs` 写面做进程组修复，10/10 与相邻 9/9 是当时局部结果。继续在**同一现有写面**用真实孙进程、监听端口和超时/取消检查进程及端口均释放；先失败后修复并留原件。无须为此再改 P10 材料；不可把旧延迟标记测试当孙进程清理已证。 |
| P7 历史 123 条 | `P7/T015-historical-baseline-audit-20260928.md` 及 addendum 核到现存 123 条候选与当前质量事实 123/123 hash 相符，但无**当时独立封存**的逐文件旧清单/原始字节。材料或新算 hash 都不能倒造历史基线；保留 `unknown/G2`，若能取得旧备份再逐条比较。无需用户重定需求，也不能为求 Done 修改旧事实或把当前候选写成旧见证。 |
| P10/P11 真业务效果 | 先解决 P8/P9/P10 的完整变化与业务关系。`P11/T022-real-ui-consumer-audit-20260928.md` 的旧快照 217 条变更中 208 条未映射；这只能说明关系未证明。逐 case 判真实消费者后再决定浏览器是否适用，不能靠扩展名/仓库无 dev 脚本写 N/A。 |

## 一次性顺序，避免收据反复失效

1. **先收集独立事实，不改材料：**确认 P4 正负控现状、P10 阶段行与回执不能同次绑定的准确发布点、P11 每个 AC 的实际读路与后台消费者；P7 旧见证仅查有无，不拿当前副本顶替。
2. **材料 owner 一次成批修订：**P4 纠正负控与测试数；P10 登记 stage producer/reader 的窄写面；P11 登记逐 AC 读回和适用性窄写面；P5 零例外待用户决定后同步 decision-log/spec/规则/P5。同步 `phases/index.md` 指针行，独立审查本批材料。若 P5 答复尚未到，先提交其余三项材料修订，不因等待而停工。
3. **之后再实施及抓取当前版证据：**按 Phase 原定向命令做真正 RED→GREEN、负控、真实官方收据和独立审查；稳定材料/源码后才抓正式 current receipt。每次材料变动会改变 material revision，旧收据只留历史，不能在最终 P13 当作当前版通过。

本页未判任何 Phase 完成，也不授权跳过 P7 旧基线、P10 官方同次、P11 真页面、P5 真实报告的缺口。
