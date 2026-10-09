# 标准工作方法

## 当前路线

领域术语读取根 [GLOSSARY.md](../GLOSSARY.md)；旧术语来源与历史 ADR 引用只读保留。

当前 WorkflowHub 主会话按认证工作区的当前材料执行。post 材料为 decision-log.md、spec.md、独立 phases/P<n>.md 与纯指针 index；旧四材料与旧执行记录只读保留。七类公共工具是 doctor/status/run/review/verify/confirm/authorize；run:execute 只更新导航游标，不恢复旧官方 stage pipeline。质量缺失如实 unknown/unavailable/incomplete，不锁修复，也不证明完成。

方向与计划两道人为选择按真实答复执行；已有授权继续有效。主会话组织必要交互，重活按工作类型派给独立上下文，修复回原实施者；不整份继承父上下文。独立审查与人把关不由实现者自判，普通小修不重复全范围审查。

进入已授权任务的 build-code、verify-code 后，自动完成实施、验证、审查、修复及交付必要的 commit/push/merge；阶段切换、新会话与 handoff 不重置授权，不再次申请本地提交、日常技术验收或风险承担确认。authorize 复用真实授权来源，实际操作前核范围、分支、当前 HEAD 并 record/consume。最终 close 默认收口已交付的任务材料、task-owned worktree 和任务分支：先展示实际交付结果、质量限制、待归档路径、待删除 worktree/本地分支及存在的同名远端分支，列出具名安全例外，取得一次最终范围确认；质量声明与清理授权分别保真。确认后归档已交付材料，复用 `runtime/task/workspace.mjs` 的 `inspectWorktreeCleanup`、`createTaskWorktreeRemoval` probe/execute/verify 与现有 authorize/run-command，普通移除已合入目标分支且无未交付或未知独有字节的 task-owned worktree，再用 `git branch -d` 删除本地任务分支；远端同名任务分支实际存在且已交付时才普通删除。main 与 existing workspace 保留；未知、私有、未交付资料逐件写明路径、原因、保管位置或最终明确可弃的范围，保护这些具体例外，不以惯例保留整个已安全交付 worktree。执行备忘从创建起用现有 appendRecord 外置到任务库，仅记必要上下文；旧 worktree 备忘逐件核已有唯一原件保管位置或最终明确舍弃，不能按目录名当可丢缓存。禁止 `--force`、`-D` 或强推；默认策略变更本身不是当前任务的删除确认，不解除另有来源的 packet TTL 延期。无法修复或验证的事项如实保留并继续可执行部分，不能自行 accepted_risk 或伪造通过。

## build-code 测试与质量

只运行受影响针对性测试与当前计划明确的最终检查，禁止无范围全量 vitest/npm test/test:safe；例外须用户或 CI 明确要求。源与测试应验证真实效果、失败和取消，假 transport 不能证明实际模型或硬隔离。已有成功范围只在新变化/失败/未解疑点时重跑，不按每个文件机械新增审查。

文档面用 wh-review；代码面默认 OCR，只有 OCR 命令不存在（ENOENT）或版本低于1.12.9，才回退 architect-code-review 执行同一代码审查，并保存检测输出、原因、真实执行者和覆盖限制。版本检测其它错误保持 unknown/unavailable，不推断未安装；OCR 已装而执行失败、超时、取消、无效输出、零成功路或空 findings 均不触发回退，原始事实保留。三审查点保留，真实未执行或不足独立数量保持 unavailable/incomplete，有效单源发现原来源照留。原始失败、晚 raw、取消与来源不被摘要覆盖。

### 专业质量

每个行为风险都必须落到可执行任务和真实 oracle，不能用任务数量、文件列表或测试命令字符串代替设计质量。**完成声明的上限 = 独立来源的结论**；该结论为 adverse 或 unavailable 时，只能声明到该结论允许的程度，不得把未验证的部分说成已完成；这只限制声明的措辞，不阻断同任务内的修复与后续安全工作。

### 证据只留原始件

raw 测试输出、正式回执和审查原件各一份；必要证据区只保存不同事实原件/引用。禁止复制镜像、整棵目录/工作树快照、tar、git archive 或全树清单。证明范围仅保实际改动文件字节+路径+hash；历史原件不重写。需要前后历史字节检查时内存比较，只落实际摘要，不保存目录清单。

### stage 结束

主会话按实际已有记录接口和安全写入保普通 stage facts，不恢复 run:execute 完整官方执行门。实施、质量、Git交付与物理清理分别读回；局部GREEN不说明全任务完成。逐AC只由实际交付和对应证据判断，缺项如实保留；新唯一人读handoff MD给绝对ref和实际下一阶段，旧原件immutable。最终 close 按上文默认安全收口执行并回读归档、worktree、本地及远端任务分支的实际结果；未知或未执行项给具体例外，不把质量 incomplete 改写为完成，也不把它单独当清理许可或阻断条件。

卡住先说明现在卡在哪、原因、可行路线和代价；只有真实方向改变需用户选择，避免用内部编号作为唯一说明。同一尝试没有新事实则停止重复，不自动续跑空转。未取得的答复、provider失败或许可不能靠时间流逝当同意。
