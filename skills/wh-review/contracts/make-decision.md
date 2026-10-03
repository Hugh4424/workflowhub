# Make Decision 审查合同

provider 只读取本次 bundle，不能访问真实仓库、Git、一般 shell、网络或宿主路径。只有实际 host transport 已证明原生硬包根、工具及环境边界的 Codex，可用 cat、sed、rg 等只读文件查看命令读取该 packet 内声明的路径。这不是一般 shell 许可：仍禁止写入、Git、网络、父目录、宿主材料、Agent/subagent 和 wait/poll。原生权限的 minimal runtime 例外只用于工具运行，不属于审查材料。direction 与 detail 各有自己的 red/blue paired fact，保留 provider × role 来源；pair_id 是普通事实标识，不认证快照或材料许可。每个 role 一次公共 wh-review 请求，不循环取得空 findings；transport 来源按实际记录，不把内部原生会话谎称为旧 broker 执行。

## direction：先重建，再揭示，再挑战

每个请求保留 broker-owned direction-review.v1 内部顺序：reconstruct 只读原始需求、客观事实、硬约束、非目标、问题与未知；到 reveal 才读当前选择、备选方案、理由和独立重建；challenge 检查选择、失败后果及更小可逆路径。不能用第二次 public request 假装同一请求中的 reveal 边界。安全原生 transport 也由现客户端在同一次请求内真实分段：重建包不交付已定材料，只有收到有效重建才创建揭示包，之后才创建挑战包。内部会话、取消、失败与 stdout/stderr 如实保留；不新增会话推进许可或持久进度对象。

questions-only 提供真实未决问题及来源，不能漏关键问题或用大概结论冒充覆盖。reconstruct 阶段不交付 OI 答案、方案结论、确认回复、decision log、detail 结果、spec、plan、代码或测试。答案与选择只能在 reveal 后可见。不要伪造未知问题的回答，也不要求 outline 版本/hash 成为继续工作或问题身份的许可。

## detail：核对完整方案与真实回答

读取原始需求、完整当前 approved_direction（decision-log 与 grill 判断）、待审规格或验收草案。核对问题/成功标准与调研、方向/范围/取舍与风险、盲审发现/假设与剩余风险是否有真实内容；关键决定须说明来源、事实与约束、理由、后果、被拒方案及未决项。真实回答、分组确认与风险接收不能被摘要、direction questions-only 或空 findings 代替。

当前 decision-log 与 supplied approved_direction 不一致时明确诊断，不默换摘要或旧结果；不要求额外 material revision/hash receipt。可选 context/evidence maps 只辅助定位直接片段，未提供说明限制，不补造依据。detail 的同一 packet 包含 simplicity-guard 只读 lens，关注优先删除、直接复用或最小改造、范围膨胀、重复能力和无故障依据的长期抽象。direction 不提前使用依赖候选方案的 lens。

先查会改变交付的缺口：需求是否丢失、用户流程是否完整、状态与失败边界是否可实现、验收是否可被测试打破、是否未经确认扩大范围。记录格式、快照、receipt 或动作痕迹本身不构成 finding。

## 输出与真实边界

使用 provider-protocol 的一个 findings JSON，保留实际严重证据、锚点、provider/role 来源和分歧。没有可信终态、坏 JSON、路径/协议错误、超时、取消等保留 unavailable/incomplete，不能改成无问题或通过。空 findings 不证明 checked_no_gap、逐条问题覆盖、阶段完成或用户批准。

每个 finding 有具体处置和理由；accepted_risk 需要具体风险与真实用户回复，未答仍等待，不把既有实施授权当风险接收。确认前准备可审稿与一致性分析；既有人类确认是决定的最后一步，确认后只读核对实际决定，决定真实变化才重新展示选择。审查、附件 checksum、普通日期编号和历史报告均不成为继续工作的许可，也不替代真实交互。
