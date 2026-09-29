# P5/T007 判决来源修订：独立材料审查（2026-09-28）

## 裁决

**同意有界修订，不能按旧冻结来源断言直接求绿。** T007 是纯转换器，只拿到 `stageResult` 中的判决字符串、裸 `quality_advisory_fact_refs` 和可选证据索引；它没有原件字节或内容哈希，无法把某条判决认证到某份质量事实。当前代码把 `quality_advisory_fact_refs[0]` 填给所有 `stage-end-spec-analyze` 判断，若首项缺失又借相似文件名，均会把候选误报成判决来源。`red.txt` 的四个目标失败直接暴露此问题；这不是完整 P5 验收。

当没有**已核实的同主题、同判决绑定**时，T007 可把 `not_done.source` 设为 `${stageResultPath}#quality_advisories[i]`，无路径则为 `input.stageResult#quality_advisories[i]`。这里的 `i` 必须是原 `quality_advisories` 数组下标，不是筛选后序号。它仅指向转换器实际读到的判断，**不证明底层质量原件**；每条同时写一条覆盖限制，直说“原始质量事实来源未核”。裸 ref 和相似文件名可列为候选，但不得写为该判断的 `not_done.source`，也不得标为已认证。若将来输入有可核绑定，须先有独立材料修订及原件校验，不能由纯转换器自报 `verified`。

## 给 build-plan owner 的最小材料替换文字

在 P5.md 当前 T007 修订段、T007 `GREEN oracle` / `Coverage limit` 和 spec.md 的 DER-06、AC-26 相应段增加同一口径：

> T007 对 `stageResult.quality_advisories[]` 中每条非通过 `stage-end-spec-analyze:<verdict>` 逐条输出阶段、主题、原始机器词面、映射后的机器状态及非空原因；通过值不产生 `not_done`。纯转换器未读取质量原件，不能凭 `quality_advisory_fact_refs` 的位置或 `evidenceIndex` 文件名推定该判断的原件。未有经原件核实的同主题、同判决绑定时，`not_done.source` 精确指向本次 `stageResultPath#quality_advisories[原下标]`；无路径则指向 `input.stageResult#quality_advisories[原下标]`，并逐条披露“原始质量事实来源未核”。候选 refs 可另列，但不可冒充该判断的认证来源。T007 测试通过只证明逐条呈现，不证明底层事实来源或 P5 报告已认证。

P5.md 原冻结测试的**第④段**由“每条 `source` 是任一质量 ref 或相似验收文件名”改为上述 stageResult 字段指针和逐条未核披露。第①逐条数目、第②各自状态与原词面、第③阶段/主题/非空原因，以及“通过时无该项”的负控保留。旧测试原字节与哈希仍作为历史证据，不覆写其来历；记录新测试字节/哈希与目标 RED→GREEN。测试注释中“底层事实（source 指向）”改为“底层事实候选，待 T008 认证”；旧行号与“冻结不可改”旧时点说明须标明被当前经审查的窄修订覆盖。

新增 `不同 advisory 的位置...` 正控目前仍期望 `specFact` 作为来源，**自身与此安全边界冲突**：虽当前生产者常先推 spec-analyze fact，测试输入并未携带该 ref 的主题或判决原件。应把其期望改为 `input.stageResult#quality_advisories[1]` 及逐条未核披露，同时保留 `source` 不等于其它 ref；不能让这个新增测试成为旧错绑的新许可证。其它首项错主题、首项缺失、多条共用一份 ref、当前生产者单条判断的负控/正控继续保留。正式生产者在一次结果中最多给该主题一条判决；三条的合成夹具只检验纯转换器不合并，不等于真实一次运行生成三条。

## T008 需要的精确认证链

当前写侧 `source.quality_facts` 与证书的 `quality_fact_refs` 只包含 `stageResult.quality_fact_refs`，**不含** `stageResult.quality_advisory_fact_refs`。读侧也只重读前者并核 phase review。因此即使 T007 改用诚实字段指针，T008 仍不能宣称这条判决已对上质量原件。写侧须在现有同次私有 source/certificate 增加 advisory 事实的 `{ref, sha256}` 列表，核它与 `stageResult.quality_advisory_fact_refs` 完全对应；读侧独立重读每份原始字节，校验内容哈希、规范 ref、Task、stage、材料版本与代码树。按原件的 `subject=stage_end_spec_analyze` 选取，不能按数组位置猜；该主题缺失、重复或多条判决歧义均不得认证。

对选中的质量事实，再沿其 `evidence` 中的 acceptance wrapper ref/hash 和 wrapper 的 `refs` 中 stage-quality 原件 ref/hash 逐层重读。核 `acceptance_criterion_id=stage_end_spec_analyze`、同一代码树/材料、`summary.actual_outcome`、stage-quality 的 `subject`、`subject_fact.analysis_result.status` 与 `stageResult.quality_advisories` 中 `stage-end-spec-analyze:<verdict>` 的**原始机器词面**一致。注意 quality fact 的 `status` 对非通过值可能是通用 `missing`，不能拿它替代原始判决。缺原件、坏哈希、错主题、错判决、旧树/旧材料、重复主体均让该来源保持未认证并给具体原因；不要静默改成 `passed`。

T008 的全报告认证还受独立的人类例外来源限制：当前 `p5HumanExceptionFromDecisionLog()` 直接返回 `null`，只读认证器最终明确返回 `missing`。本审查**没有**授权绕过该限制、写正式三文件或制造用户确认；本段只修订机器判断的来源契约。不要用通用 `human-confirmation.v3` 给例外背书：该类型还可被不可逆操作授权读路消费，应先建立用途专属且可独立核对的来源。

## 范围和证据

- 只读核对：`material-clarify-proposal.md`、`red-stage-end-report.test.mjs`、`red.txt`、P5.md/spec.md、`runtime/stage/stage-end-report.mjs` 与测试、`stage-runner.mjs` 的 advisory producer/T008 writer、`runtime/evidence/freshness.mjs` 的 T008 reader。
- 本审查未运行测试、未改材料/生产代码/Task facts，未判 T007/T008/P5 完成。
