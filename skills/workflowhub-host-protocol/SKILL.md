---
name: workflowhub-host-protocol
description: 规定当前 WorkflowHub 会话如何直接执行五阶段，并把调度、任务事实和完成结论分开。
---

# WorkflowHub 宿主协议

当前主会话直接读取并执行五阶段方法。正式阶段为 make-decision、build-plan、build-code、verify-code、build-prd；post 的真相材料是 decision-log、spec、独立 Phase 与纯指针 index，规划PRD由spec-prd单作者写。历史pre材料只读。

## 方法与事实

1. 先核实际task worktree、当前材料和目标范围；方法/依赖按 name/path/trigger 读取，steps只是清单。公共doctor/status只报告当前可用性/实际事实，能力缺失不自动阻止不依赖它的工作。
2. make-decision澄清真实方向并写decision-log；build-plan写产品/全局实现设计和Phase；build-code在声明范围实施/针对性验证；verify-code独立核真实实现/失败/验收；build-prd协调实际规划材料与展示，不代spec-prd写正文。
3. 使用已有窄工具核工作区/写边界①、采真实命令②、安全原子写文件③、不可逆Git授权④、共享记录锁⑤。工具各自处理实际安全职责，不建立快照/hash/receipt推进许可证。
4. 两道人为门：confirm只接受已展示可审稿的真实答复；authorize只约束不可逆Git动作。已有授权覆盖当前动作/范围时按当前HEAD重新记录消费，漂移拒旧记录；新增范围才需用户选择，普通修复不重复问。
5. 文档建议由wh-review；代码Phase/终末由OCR；OCR缺失或低于1.12.9才允许wh-review回退，已装失败保留unavailable。独立质量由独立来源产出，原始provider输出与失败只存一次；实施者不自判质量。
6. 任务执行与阶段事实通过现有公共run记录，review/test/evidence只是事实。缺测试、未修严重发现或质量未知不能宣称完成，但同任务可继续安全修复；不创建新public动作、外部Stage Agent/session/bridge前置。
7. 每stage末写人读stage-handoff，列实际绝对材料/证据路径、已做/未做、风险和下一步。reflection可选普通md，不认证材料，不由交接或复盘推出阶段成功。

## 交付与恢复

代码、验证、用户选择、质量、Git/发布与物理关闭分别报告。评论是给人看的通知，不是第二进度权威；未执行/unknown/unavailable/incomplete照实保留。需要用户决定的变化先完成可审查准备，再说明待决内容和后果。旧outcome/receipt/历史snapshot只读背景，不能恢复成当前writer或工作许可。

## 任务与 worktree

WorkflowHub 运行仓与业务仓分开；只用项目登记资源或认证 task worktree 的实际绝对路径，不扫描目录、不猜路径、不从旧记录回退。路径或任务身份错误只拒绝那次写入，回同一 task 修复；不另建替代任务或恢复许可。外部系统同步需要明确授权，不能从阶段完成或审查结论推断。

## 问题恢复

1. 能安全自行修复就直接修复、测试、回读，说明当前影响；原始失败不覆盖。
2. 缺当前材料时，在同一 task 按材料 owner 的职责修复，不创建替代 task。
3. provider 或工具失败保留原始错误，继续同 task 中不依赖该事实的工作；只在输入未变且错误可恢复时做一次明确重试。
4. 路径互斥属于短暂等待，释放后继续；同一 task 不并发重复执行。
5. verify-code 给出真实结论后，按授权范围分别处理修复、交付和 close；不得把未完成质量事实包装成 release 或物理关闭。
