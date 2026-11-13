# Make Decision 审查合同

provider 只读取本次 bundle，不能访问真实仓库、Git、一般 shell、网络或宿主路径。只有实际 host transport 已证明原生硬包根、工具及环境边界的 Codex，可用 cat、sed、rg 等只读文件查看命令读取该 packet 内声明的路径。这不是一般 shell 许可：仍禁止写入、Git、网络、父目录、宿主材料、Agent/subagent 和 wait/poll。原生权限的 minimal runtime 例外只用于工具运行，不属于审查材料。direction 保留 red/blue paired fact、provider × role 来源，每 role 一次公共 wh-review 请求；detail 每 provider 每轮一次，不重复配对。pair_id 是普通事实标识，不认证快照或材料许可。两轨均不循环取得空 findings；保留实际 provider/transport 来源，不把内部原生会话谎称为旧 broker 执行。

## direction：先重建，再揭示，再挑战

direction 轨输入由 `skills/wh-review/scripts/review-materials.mjs` 的 `validateDirectionReviewInput` 校验，并在 `buildReviewMaterials` 创建 packet 前调用。方向包是大纲本身，不是问题清单，逐键必含：

- `raw_requirement`：原始需求原文（PRD 卡原文或用户原话），不是摘要。
- `research_context`：调研结论与来源，每条带来源路径或 ID，并写清「已知／未知／冲突」；不得含 proposed_solution。
- `objective_facts`：环境、约束与既有事实。
- `convergence_outline`：具体大纲——包划分、包间依赖与顺序、每包范围边界、每包验收草案或缺口、风险与失败后果、未解项、较小可逆选项。
- `current_selection`：已确认方向、范围与非目标。
- `alternatives`＋`selection_rationale`：被否候选与否决理由。
- `key_assumptions`：会推翻当前方向的假设。

同一请求带被审大纲的可回读 ref＋sha256。这四份揭示材料在 reveal 前不交付，但缺失它们不是“可选的简化”，而是请求不完整：公共审查入口直接失败并报“方向审查缺少揭示材料，challenge 无法执行”，不静默降级成盲审或省略 reveal。缺失或为空的必填材料、同轨非法 key 明确抛错；此轨不比较 decision-log 字节。detail 与 build-plan 的公开审查入口（`runSimpleReview`）在建包前执行同一拦截：任一 required 键缺失或为空、或调用方键全部不在本轨 allowlist 时，入口报 MATERIAL_INCOMPLETE 并列缺失键与 legal keys。只有直接调用裸建包入口 `buildReviewMaterials` 时，缺料才只写进 `review-instructions.md` 的 “Supplied material is incomplete”；那行只是包内事实，不得据此派发、记 available 或进入 finding 处置。审查记录若 `material_coverage.read` 为空且 `undetermined` 覆盖全部材料，不得记 available，记 unavailable 并写缺键。

每个请求保留 broker-owned direction-review.v1 内部顺序：reconstruct 只读原始需求、客观事实、硬约束、非目标、问题与未知；到 reveal 才读骨架级选择（方向、范围、非目标与已确认骨架）、备选方案、理由和独立重建；当前选择不含逐模块方案结论、字段级取舍或实现细节；challenge 检查选择、失败后果及更小可逆路径。不能用第二次 public request 假装同一请求中的 reveal 边界。安全原生 transport 也由现客户端在同一次请求内真实分段：重建包不交付已定材料，只有收到有效重建才创建揭示包，之后才创建挑战包。内部会话、取消、失败与 stdout/stderr 如实保留；不新增会话推进许可或持久进度对象。

方向包提供真实未决问题及来源，也提供被审大纲的骨架本身，不能漏关键问题或用大概结论冒充覆盖。

方向材料缺上述任一必含键，建包前抛 MATERIAL_INCOMPLETE 并列缺键；不得以「材料已给」记 available。键级缺失（含 `research_context`）由 `validateDirectionReviewInput` 与调用方预检在代码中拦截。段级必含段当前是文本约束，代码拦截待批：某份材料内部缺必含段时，审查者写 finding 与覆盖限制，主会话补件后重派，不得据此记 available。reconstruct 阶段不交付 OI 答案、方案结论、确认回复、decision log、detail 结果、spec、plan、代码或测试；答案与选择只能在 reveal 后可见。不要伪造未知问题的回答，也不要求 outline 版本/hash 成为继续工作或问题身份的许可。方向包须带被审大纲的可回读 ref＋sha256，说明审了哪版；这是材料身份，不是继续工作、问题身份或阶段许可。包内缺当前选择、备选或否决理由任一项时，本步不得记完成；包内缺方向或骨架是本步输入未备，不是已审发现。方向包接受人守：是否漏关键问题、骨架是否可读由主会话与用户人工核对，不设机器 producer 或校验器。

方向审查四问（逐包回答，不是判原始需求有没有意义，也不是另给一个更粗的大纲）：① 这张大纲实现之后，能不能保证原始需求被正确实现——每条需求在大纲里有没有落点、落点能不能兑现承诺；② 所有功能是否都有接线——谁调用谁、上游输出是否被下游真读，是否有产出无人消费或消费方拿不到输入；③ 所有验收标准是否合理、可判、能证伪——通过和不通过能否被独立观察，反例是什么；④ 范围、风险、依赖是否覆盖——越界、漏项、未解依赖、失败后果与回退有没有交代。答不出或答“无法判断”就是 finding，写第几问、缺哪份证据、该谁补；四问都不成问题时不写 finding，把比对范围（审了哪些包、依赖与验收）写进 evidence。

## detail：核对完整方案与真实回答

`approved_direction` 是完整当前 decision-log。`draft_spec_or_acceptance` 可选；提供时是基于已确认方向的待审规格或验收草案，保留原始需求、真实用户回答与取舍来源；不能用 direction questions-only、旧审查摘要或虚构回答替代。

读取原始需求、完整当前 approved_direction（decision-log 与 grill 判断）、待审规格或验收草案。核对问题/成功标准与调研、方向/范围/取舍与风险、盲审发现/假设与剩余风险是否有真实内容；关键决定须说明来源、事实与约束、理由、后果、被拒方案及未决项。真实回答、分组确认与风险接收不能被摘要、direction questions-only 或空 findings 代替。

当前 decision-log 与 supplied approved_direction 不一致时明确诊断，不默换摘要或旧结果；不要求额外 material revision/hash receipt。可选 context/evidence maps 只辅助定位直接片段，未提供说明限制，不补造依据。detail 的同一 packet 包含 simplicity-guard 与 plan-eng-review 只读 lens：前者关注优先删除、直接复用或最小改造、范围膨胀、重复能力和无故障依据的长期抽象；后者按每个工作包回答 Check 1、6、7、9(c)(g)。direction 不提前使用依赖候选方案的 lens。

detail 轨的 `requirement_index` 与 `per_package_projection` 是可选键，提供即按下列段核对；缺段按材料不完整写 finding，并把无法核对的段落写进 evidence 的覆盖限制，不得用推断补齐：

- `requirement_index`：逐条给出被承接需求的编号、原始需求原文的可回读 ref 与 sha256、用户答复原文与位置（文件与行号，或消息标识）。缺任一条即缺索引；缺索引记 finding，不按「大致覆盖」记完成。
- `per_package_projection`：每个工作包一行五行 `{scope, plan, acceptance, risk, source_ref}`——该包范围、方案、验收、风险与可核来源。缺行即该包未交审；只写部分行的包按未覆盖记 finding。`per_package_projection` 与 `context_map.proposal_projection` 是同一投影的两种承载位置，提供任一即视为该包已投影；两处都提供时必须一致，不一致按材料不完整记 finding。

两键都未提供时，把「未提供 requirement_index／per_package_projection」写进 evidence 的覆盖限制并说明因此无法核对需求落点与逐包方案；未提供不等于已核对，也不得据此推断。

按四问逐包给结论，按仔细检查设计的深度读，不按文件、编号或格式齐备判：① 方案成立吗——选定做法能不能兑现承接的需求，放弃的替代与代价是否交代；② 验收可判吗——AC 编号、通过／失败信号与反例是否齐备，独立观察者能否据此判真伪；③ 范围越界吗——是否覆盖未确认范围、漏掉承接需求或自带未经确认的新能力；④ 风险覆盖吗——失败后果、恢复回退、外部依赖与未解项是否交代。答不出或答“无法判断”就是 finding，issue 写第几问、缺哪份证据、该谁补；四问都不成问题时不写 finding，把比对范围写进 evidence。格式、编号、索引、字段齐备由既有脚本核对，不计入本轨 finding。`context_map.proposal_projection` 缺任意一行即该包方案未交审，detail 审查不得记完成。

**设计审查镜头（仅 UI 包）**：detail 审查在四问之外加一个镜头，核对 UI 需求是否收敛、设计源是否确认、验收是否可判；缺设计源、缺对照项或缺反例都具名报出，写清第几包、缺哪份证据、该谁补。非 UI 包不加镜头。

## 输出与真实边界

使用 provider-protocol 的一个 findings JSON，保留实际严重证据、锚点、provider/role 来源和分歧。没有可信终态、坏 JSON、路径/协议错误、超时、取消等保留 unavailable/incomplete，不能改成无问题或通过。空 findings 不证明 checked_no_gap、逐条问题覆盖、阶段完成或用户批准。

每个 finding 有具体处置和理由；accepted_risk 需要具体风险与真实用户回复，未答仍等待，不把既有实施授权当风险接收。确认前准备可审稿与一致性分析；阶段末 spec-analyze 先核决策草稿，缺口和处置交最终确认；既有人类确认是决定的最后一步，决定真实变化才重新展示选择。审查、附件 checksum、普通日期编号和历史报告均不成为继续工作的许可，也不替代真实交互。
