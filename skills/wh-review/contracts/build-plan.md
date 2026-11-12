# Build Plan 审查合同

审查当前提交的材料。provider 只读取 bundle，不访问真实仓库、Git、一般 shell、网络或宿主路径。只有实际 host transport 已证明原生硬包根、工具及环境边界的 Codex，可用 cat、sed、rg 等只读文件查看命令读取该 packet 内声明的路径。这不是一般 shell 许可：仍禁止写入、Git、网络、父目录、宿主材料、Agent/subagent 和 wait/poll。原生权限的 minimal runtime 例外只用于工具运行，不属于审查材料。

## 材料与问题

post 先读 `decision_baseline`，再读当前 `draft_spec`、验收标准、独立 `phase_authorities` 与纯指针 `phase_index`。
原始需求是可选的短摘录。各 Phase 全文可读，不拼成另一份 plan/tasks。
pre/history 仍按旧 approved spec、draft_plan、draft_tasks 的既定范围审查，不冒 post 当前材料。

post 的 `requirement_index`、`phase_risk_index` 与 `decision_log` 是可选键；提供即按下列段核对，缺段按材料不完整写 finding，并把缺口写进 evidence 的覆盖限制，不得用推断补齐：

- `requirement_index`：每条需求的编号、原始需求原文的可回读 ref 与 sha256、用户答复原文与位置（文件与行号，或消息标识）；缺一条即缺索引。
- `phase_risk_index`：每个 Phase 的失败后果、回退/恢复、外部依赖、不可逆动作、owner 与未覆盖项。
- `decision_log`：用户答复与已确认决定的原文索引，只读引用，不改写、不以摘要替代；它不是 `decision_baseline` 的替代，两者并存时用原文核对基线是否忠实。

未提供上述可选键时，把「未提供 requirement_index／phase_risk_index／decision_log」写进 evidence 的覆盖限制并说明无法核对的范围；不得把未提供当作已核对。
`context_map` 中同名段与 `requirement_index`／`phase_risk_index` 是同一事实的两种承载位，两处都提供时必须一致；不一致按材料不完整记 finding。

A 路（role=red）偏问 1、2：
- **方案成立吗**：逐条对照基线中的需求与真实答复，核方案是否回答承诺；缺设计与缺判据分别说明。
- **验收可判吗**：寻找“测试会绿、承诺却失败”的反例，核失败条件是否可观察、能否证伪。

B 路（role=blue）偏问 3、4：
- **范围越界吗**：挑战前提、依赖、共享写主、回退与不必要的新能力，指出未经确认的扩范围，提出更小可行替代。
- **风险覆盖吗**：独立读者能否定位首改路径、实际命令、oracle 与失败恢复；沿完整 Phase 正文核真实消费者与命令，不以文本自洽充当判断。

两路都对每个 Phase、每条 AC 回答同一四问，结论写进 finding 或 evidence 的比对范围。答不出或答“无法判断”就是 finding，写第几问、缺哪份证据、该谁补；四问都不成问题时不写 finding。

可执行性复用包内 `contracts/authoring-contract.md` 的五问与失败恢复；写作规则唯一读 `skills/spec-specify/SKILL.md` 的 WR001。
文本字段、编号与对齐由既有脚本核对，不以它们代替四轴判断，也不把普通文本自洽问题充当模型贡献。
同批共享路径互斥，跨批共享路径需真实依赖和具名先后 writer。方案替代须在已确认方向内。
Phase 字段、编号、索引或审查记录本身不是继续工作的许可证，不按统一顺序锁住工程正文。

可选 context_map/evidence_map 用于指出直接依赖与可验证的相对路径/行范围。未提供或无法复核时说明限制，不补造依据，不默读整个仓库。required/optional reviewer skills 按当前 stage-skill-plan 选择；适用的 simplicity-guard 只是同一 packet 的只读 lens，不单独运行、生成 receipt 或新的 facts。

## 结果与处置

manifest 的 byte size/checksum 只用于实际附件传输与来源核对，不能认证 WorkflowHub 阶段身份或许可。审查记录存于 `quality/reviews/` 的普通日期编号文件；旧结果保留只读，不用 hash/snapshot 判断能否复用或继续。

只输出 provider-protocol 的一个 findings JSON。具体 finding 要能影响交付，保留来源和严重程度。
每条给五项：锚点用 `path`/`line`；问题用 `issue`；依据在 `root_cause`/`evidence` 引用决定或需求原文；替代方案用 `recommendation`；覆盖范围也写 `evidence`，说明审到哪里、哪里未查及原因。
五项是判断义务，沿既有字段承载，不新增结果必填字段，不按字数或“四轴全齐”制造质量许可。
空 findings 合法，不逼审查者造问题，也不等于通过、完成、逐条覆盖或批准。宿主按实际投递、读取事实与限制说明覆盖，不能由包存在推已读。
无文本、坏 JSON、路径/协议错误、超时、取消及其他 provider 失败保留 unavailable/incomplete，未知处保留 unknown，不伪造成功。

所有真实 finding（含普通 finding）都要有 fixed、rejected_invalid、accepted_risk 或 needs_human 处置及理由。accepted_risk 必须对应具体问题、后果和真实用户回复；普通授权不冒充风险接收，真实安全保护不作为可接受损失。缺回复仍待人决定。普通修复不为追求空 findings 重审；明确新问题或真实变更的必要审查由当前方法决定，不查旧快照许可对象。审查是质量事实，不替代既有人类确认。
