# P5/T008 六字段接线：独立只读复核

日期：2026-09-28。只读核对当前 P5.md、spec.md、decision-log.md、writer、reader、T007 转换器和 T008 定向测试；未改生产代码、测试、Task facts，未运行测试。本文件不是 P5 完成证明。

## 裁决

设计的主要判断正确：当前 writer 的人工例外函数固定返回 `null`；即使解除这个短路，writer 和 reader 都只向 T007 传 `reason/source_path`，而 T007 要求 `declared_by/reason/scope/expires_at_phase/owner/source_path` 六项。reader 最后固定 `missing`。因此目前没有可认证的 P5 中途报告，不能用现有局部绿测声称 T008 完成。

**可先实施、不依赖用户对“零例外”问题答复的部分**：在 P5 既定写面内做真实非空声明的解析、严格单一性和字段校验；只从已认证 `decision-log.md` 原字节构造六字段及可选 `verbatim`；验证 `scope` 对同次验收项的完整 ID 匹配，并验证到期阶段在当前 `phases/index.md` 中唯一存在且不早于 P5；writer 和独立 reader 用完全相同的字段重算事实及 Markdown。增加缺字段、假夹具、坏哈希、错误范围、过期/不存在阶段、旧材料/树、半写、冲突和重试的定向正反例。隔离夹具的正例只证明机械接线，不能证明 CARD-04 有真人批准。当前 CARD-04 的发布路径必须继续关闭，不写五件正式报告文件。

**不能先决定的部分**：确无例外时中途报告如何写，必须等用户对这个中途报告问题的答复，由材料 owner 同步改决定、规格、T007 正反例。当前 `decision-log.md` 没有 `## 人工例外声明`；历史 G-2 豁免与用户对最终报告“没有例外”的答复都不能替代本次中途报告的例外来源。也不能先生成一条占位例外再删除。

## 必须修正设计中的确认载体建议

提案把 `human-confirmation.v3` 当“绑定记录候选”仍过于危险。`publishHumanConfirmation` 会同时发布 `subject=human_confirmation,status=passed` 的质量事实（`runtime/task/task-kernel-implementation.mjs:940-1064`）。当前 `build-code` 完成谓词没有 `human_confirmation`（`runtime/stage/completion-predicates.mjs:93-97`），所以这条事实**目前**不会单独使 build-code 完成；但它在其它普通确认读路里仍是通用“已确认”事实，不能称为 P5 专用确认。

更直接的越权路径：同一 kernel 的 `publishIrreversibleAuthorization` 对 commit/push/merge/archive/cleanup 只检查确认记录是本 Task 的 `accepted`、非空 `subject_ref`，且材料与树为当前版本；它**不检查** `stage`、`step_slug` 或 `subject_ref` 是否针对该不可逆操作（`runtime/task/task-kernel-implementation.mjs:90-127,1082-1105`）。若为 P5 例外调用公共 `confirm` 生成 accepted v3，即使 subject 精确写成声明路径和哈希，该记录仍可能被后续当作上述操作的授权来源。不能按现提案直接创建或使用它。若要复用 v3，须先由相应 owner 审定并修紧所有相关授权消费者，且有独立负控；这超出当前 P5 精确写面。另一种独立真人来源也必须能让 reader 验证原始用户答复的身份与字节；agent 自填 `reply_text` 或自写 JSON 的 ref/hash 只证明写入内容未变，不能证明答复来自用户。

## 接线细节

- `source_path` 由已认证材料 ref 和唯一声明锚点派生；不要采纳声明自带路径。source 保存材料 ref、原字节哈希及经批准的独立答复来源；reader 重读当前材料和来源，不信 source 自报的确认状态。建议把例外原材料也列入 `evidenceIndex/sources`，同时继续在 `exceptions[].source` 保留定位。
- 当前 reader 只检查 `expires_at_phase` 形如 `P<n>` 且 `n>=5`，会放过不存在的 P99；writer 只用正则判断 P5 在 index 中。应解析当前 index 的唯一阶段路径，并排除重复、错路径、未列出的阶段。`scope` 的现有 regex 只要求至少命中一条验收项；若一句话同时写了有效 AC 和不存在的 AC，也会放过。至少要拒绝未能映射到同次链的明确 AC ID，不能把“命中一个”扩大成整条声明被核准。
- reader 先看 `report-facts.json` 完成标记，这一点正确。无标记的前四件孤儿是 `missing`；有标记后逐件核原字节、固定路径、内容哈希、当前 Task/材料/树、阶段行、收据、测试输出、审查和质量事实，再重算事实与 Markdown。坏证书/篡改归 `missing`，真实读取能力故障归 `unavailable`。这只认证来源，不把报告内的 `not_done` 改成通过。
- 当前测试的跳过正例可逐步用**合成的可信来源适配器**验证机制，但测试须显式标为隔离夹具，且不得调用会产生通用批准副作用的公共 v3 写入作为“安全”正例。正式 CARD-04 正例仍要等真实用户来源和当前 P5 同次官方 run、专属独立审查及再次读回。

结论：六字段和读写机械接线可独立推进；真人来源及零例外写法尚未定，P5 真实报告保持 `missing/not_done`。尤其不能直接用 accepted `human-confirmation.v3` 为 P5 例外取证。
