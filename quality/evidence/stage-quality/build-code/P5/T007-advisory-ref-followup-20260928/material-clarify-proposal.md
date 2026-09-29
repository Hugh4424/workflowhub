# P5/T007 报告来源断言修订提案（只读，未改材料）

## 已证实的问题

`quality_advisories[]` 给出主题和机器判决，`quality_advisory_fact_refs[]` 只给哈希命名的裸 ref；二者不保证同一数组下标，裸 ref 本身不含主题或判决。`evidenceIndex[]` 的文件名也不能证明判决。纯转换器拿不到原始质量事实字节，不能验证某个 ref 属于哪条 `stage-end-spec-analyze` 判断。

旧冻结测试 `spec-analyze 判决逐条入账` 一次合成三条非通过判断，要求每条 `source` 是任一质量事实 ref 或相似文件名。这不是当前正式生产者的形状：`stage-runner.mjs` 每次最多产生一条该主题判断，且旧断言允许三条都指同一份原件。新负控表明错首项、缺首项但索引有相似文件名、多条共用同一份 ref 均会被旧实现当成具体来源；4 个新增目标测试真实 RED，原始输出 `red.txt`。本目录保存修订前两文件和 RED 测试字节及哈希。

## 建议给 build-plan 材料 owner 的最小改动

1. 将 P5/T007 原测试的“每条 source 必须是质量 ref/验收文件名”改为：每条非通过机器判断仍逐条保留阶段、主题、原词面和机器状态；在没有经原件核验的同主题、同判决绑定时，`source` 指向本次 `stageResultPath#quality_advisories[index]`（无路径则 `input.stageResult#quality_advisories[index]`），每条再列“原始质量事实来源未核”的覆盖限制。不得用裸数组位置或相似文件名猜原件。原冻结字节保留作历史证据。
2. 保留“当前生产者单条非通过判断”的正控，确认它仍逐条披露真实机器词面与状态；正控只证明阶段结果中这条判断被如实呈现，不宣称质量事实原件已经由纯转换器认证。
3. T007 转换器可据此 fail closed。现有 `quality_advisory_fact_refs` 和 `evidenceIndex` 如继续列入 `sources`，必须显式标为未认证候选，不得成为该判断的 `not_done.source`。

## T008 独立认证需要补的来源链

当前 T008 `source.quality_facts` 只收 `stageResult.quality_fact_refs`；`stage_end_spec_analyze` 原件在 `quality_advisory_fact_refs`，不在这份来源证书列表内。T008 writer 应在已有私有 P5 同次 source/certificate 内增加这份 advisory 原件的内容哈希绑定；reader 不能只信数组位置，须重读原件并核：Task、stage、材料版本、代码树、ref/sha256、`subject=stage_end_spec_analyze`，再沿 quality fact → acceptance wrapper → stage-quality 原件核 `summary.actual_outcome`、`subject_fact.analysis_result.status` 与 `stageResult.quality_advisories` 的原词面相等。缺失、重复、错主题、错判决或原字节不一致时，报告来源保持未认证并给具体原因。此步骤属于 P5/T008 写侧和只读认证者，非 T007 纯转换器；不增公共命令或第二份进度账本。

在上述材料修订及独立审查之前，本 agent 停在 RED，不改生产代码，不改旧冻结断言，不生成正式 P5 报告或 Task facts。
