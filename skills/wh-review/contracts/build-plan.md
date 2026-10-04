# Build Plan 审查合同

审查当前提交的材料。provider 只读取 bundle，不访问真实仓库、Git、一般 shell、网络或宿主路径。只有实际 host transport 已证明原生硬包根、工具及环境边界的 Codex，可用 cat、sed、rg 等只读文件查看命令读取该 packet 内声明的路径。这不是一般 shell 许可：仍禁止写入、Git、网络、父目录、宿主材料、Agent/subagent 和 wait/poll。原生权限的 minimal runtime 例外只用于工具运行，不属于审查材料。

## 材料与问题

post 使用原始需求、当前 `draft_spec`（产品规格与全局实现设计）、验收标准、独立 `phase_authorities` 与纯指针 `phase_index`。各 Phase 内容应完整可读，不拼成另一份 plan/tasks。pre/history 可提供旧 approved spec、draft_plan、draft_tasks 作为只读上下文，不能冒充 post 当前材料。

先检查需求 → 实现 → 真实消费者 → 验证的因果链，再检查依赖、可并行边界、接口/状态交接、失败恢复与回滚、是否真的需要新增能力。关注计划是否能执行、验证能否在行为错误时失败、直接消费者是否遗漏、是否引入无需求的重复能力。Phase 字段、编号、索引或审查记录本身不是继续工作的许可证，不按统一顺序锁住工程正文。

可选 context_map/evidence_map 用于指出直接依赖与可验证的相对路径/行范围。未提供或无法复核时说明限制，不补造依据，不默读整个仓库。required/optional reviewer skills 按当前 stage-skill-plan 选择；适用的 simplicity-guard 只是同一 packet 的只读 lens，不单独运行、生成 receipt 或新的 facts。

## 结果与处置

manifest 的 byte size/checksum 只用于实际附件传输与来源核对，不能认证 WorkflowHub 阶段身份或许可。审查记录存于 `quality/reviews/` 的普通日期编号文件；旧结果保留只读，不用 hash/snapshot 判断能否复用或继续。

只输出 provider-protocol 的一个 findings JSON。具体 finding 要能影响交付，保留来源、严重程度和可复核锚点。空 findings 不等于通过、完成、逐条覆盖或批准。无文本、坏 JSON、路径/协议错误、超时、取消及其他 provider 失败保留 unavailable/incomplete，未知处保留 unknown，不伪造成功。

所有真实 finding（含普通 finding）都要有 fixed、rejected_invalid、accepted_risk 或 needs_human 处置及理由。accepted_risk 必须对应具体问题、后果和真实用户回复；普通授权不冒充风险接收，真实安全保护不作为可接受损失。缺回复仍待人决定。普通修复不为追求空 findings 重审；明确新问题或真实变更的必要审查由当前方法决定，不查旧快照许可对象。审查是质量事实，不替代既有人类确认。
