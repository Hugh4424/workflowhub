# P5/T007 人工例外字段合同：最小修订提案（只读）

日期：2026-09-28。本页只提议字段和定向负控；未改 `spec.md`、`phases/P5.md`、规则文档、代码、测试或 Task facts，未运行测试。依据 `P5/T007-current-independent-audit-20260928.md`、`P5/T007-human-exception-contract-independent-review-20260928.md` 与当前源码/测试。**“确无例外”怎样写入 P5 中途报告仍待用户答复，本提案不决定空数组语义，也不制造一条例外。**

## 当前缺口

- `docs/architecture/test-asset-governance-rules.md:45` 要求每条真实人工例外有声明者、理由、影响范围、到期阶段、owner；`spec.md` DER-05 至少列理由、到期阶段。当前 `runtime/stage/stage-end-report.mjs#humanExceptionDeclaration` 只要求 `reason/source_path`，返回结果也丢失其它字段；渲染器“人工声明”只输出理由和来源。缺字段的对象会被接受。
- 就近测试 `runtime/stage/stage-end-report.test.mjs` 的合法 `DECLARED.exceptions[0]` 也只有理由/来源；现有负控只覆盖字符串、空对象、缺理由和缺来源。2026-09-27 旧材料/源码定向 20/20、exit 0 不能证明五字段合同；`P5/T007-current-independent-audit-20260928.md` 只是独立只读核查，不是当前版正式 Phase 审查。
- `phases/P5.md:8,19-23` 已给 T007 这两个文件的有界写面与先存旧测试字节、目标 RED、同目标 GREEN、独立审查要求。真实 P5 声明原件/reader 已使用 `declared_by`、`owner`、`scope`、`expires_at_phase`、`verbatim`、`reason`，而 T008 writer 目前只把 `reason/source_path` 交给 T007；因此字段补缺与真实来源接线是两项不同工作，不能凭 T007 单测称 T008 可产报告。

## 建议的字段合同

真实 `declared.exceptions[]` 每项至少提供非空文本：`declared_by`（声明者）、`reason`（理由）、`scope`（影响范围）、`expires_at_phase`（到期 Phase）、`owner`（负责处理者）和已有 `source_path`（声明原件位置）。优先沿用 P5 来源原件的 `scope/expires_at_phase`，不另造 `impact_scope/expires_at_stage` 或默默改名。来源原件的 `verbatim` 原话若传到 T007，必须非空、原样保留并在渲染时字面化，不能由转换器合成；T008 的独立认证仍要求它。六项都无默认值；T007 只做结构验证，不凭姓名/路径认证真人授权。`status` 仍为可选的人写状态，不得取五个机器判定值；不扩大允许值或改人审方向。

到期值应是 `P<n>` 的 Phase 名：T007 不掌握经认证的 index，至少按当前 P5 reader 的结构边界要求 `^P[1-9][0-9]*$`、安全整数且 `n>=5`，`never`/`P4`/`P0`/溢出数字均拒。当前任务索引只有 `P1..P13`；`P14` 或 `P999` 虽可能满足上述局部形状，**不能被 T007 宣称对当前任务有效**。T008 来源认证须另据当前认证 index 验证该 Phase 真存在（当前即 `P5..P13`），这属于 T008 writer/reader 后续写面，不在 T007 两文件内硬编码本任务上限。

`humanExceptionDeclaration` 缺任一必填字段、空白文本、坏到期 Phase 或机器状态时抛 `TypeError`，错误指明字段；合法项原样保留五项声明内容、可选 `verbatim` 及 `source` 路径到 `stage-end-report-facts.v1.exceptions[]`。`renderStageEndReport` 能直接接收调用方构造的 facts，故也必须对每条 `exceptions[]` 独立执行同一六字段/到期/状态检查，不能只信转换器；在“人工声明”中逐项输出声明者、理由、范围、到期 Phase、owner、来源及存在时的原话，继续用现有字面化函数转义特殊字符。`not_done[]` 的机器缺项、`coverage_limits[]` 的未证明范围仍独立保留，人工声明不抵消它们。

## 定向 RED/GREEN 与范围

1. 先保存当前 `stage-end-report.test.mjs` 和 `stage-end-report.mjs` 原字节、SHA-256 及已有 20 项定向回执。把测试自用的合法声明夹具补全 `declared_by/reason/scope/expires_at_phase/owner/source_path` 与当前原件的 `verbatim`，到期用真实形态 `P6`；既有正例核 facts 保留六个必填字段和原话、Markdown 逐项显示并把特殊字符字面化。这个夹具不是 CARD04 用户声明。表驱动负控对**六字段各自**删除与只填空白，并测 `verbatim` 若出现却为空、`expires_at_phase=never/P4/P0/过大非安全整数`、机器状态；在未改产品上以目标断言失败取得 RED，不把 import/setup 问题当红。
2. 另用调用方直接构造的 `stage-end-report-facts.v1` 负控绕过 `buildStageEndReportFacts`：六字段逐一缺失/空白、可选 `verbatim` 存在但为空、坏到期、机器状态均须被 `renderStageEndReport` 拒绝；合法完整 facts 的渲染逐字段带来源及原话，不能由转换器测试替代。T007 转换器对 `P999` 只可说格式有效，T008 后续认证须按当前 index 拒不存在的 Phase，二者分别测试。
3. 在已登记的 T007 写面内只改 `humanExceptionDeclaration` 与渲染器的 exception 校验/输出，不改收集器、T008 writer/reader 或机器判定。再跑 `npx vitest run runtime/stage/stage-end-report.test.mjs` 及确受影响的相邻合同，保存测试身份、命令/exit、原始输出、源码/材料/测试 SHA；独立审查确认正反例与原文规则一致。局部 GREEN 只说明字段合同已实现，不代表 T008 真实报告、P5 相位或整卡完成。
3. `declared.exceptions` 缺失或空数组的现行 `not_done=missing` 与渲染拒绝逻辑暂不改。用户对最终报告“没有例外”的答复不能自动套到 P5 中途报告；待中途报告问题收到明确答复，再由对应 owner 单独修订 decision/spec/规则/T007 的零例外合同和测试，不把本字段修复当作那项决定。

## 材料最小落点与风险

post build-plan owner 只需在 `spec.md` DER-05 的**实施说明**与 `phases/P5.md` 当前 T007 修订段选定 `scope/expires_at_phase`、六字段、局部到期格式与 T008 拓扑认证分界，说明直入渲染负控和不认证人身份；规则文档已要求五项，无需为这次字段补缺改方向。`runtime/stage/stage-end-report.mjs` 为 T007 转换器 owner，直接消费者是 T007 事实层与渲染；未来 T008 writer 当前只传 `reason/source_path`，须由其 owner **另在 T008 写面**显式映射原件的 `declared_by/owner/scope/expires_at_phase/reason/source_ref`，保留 `verbatim` 原话，并由 reader 核当前索引/原件/真实用户确认。T007 不能顺手改写 T008，也不能因本地六字段绿称真实报告已产出。等价的统一声明合同经审查接管时删除 T007 局部重复校验，保留已发布原件。旧只有两字段的夹具/调用方变为显式失败是补齐规则的目标；须核真实调用者，不静默填默认值或放宽以求绿。
