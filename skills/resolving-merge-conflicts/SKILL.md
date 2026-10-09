---
name: resolving-merge-conflicts
description: Resolve a planned close merge conflict on the task branch.
version: 1.0.0
---

# Resolving Merge Conflicts

用于已授权交付/close 报出的真实 merge conflict；只修任务分支，目标/main worktree只读。

## Procedure

1. 读取实际交付计划、目标 baseline OID 和 task worktree/branch；核当前HEAD和边界，不猜另一仓库或commit。目标baseline变化会使旧方案不适用：先核差异，准备可审查修订；已有授权覆盖的技术修复可继续，新增动作/范围才需用户选择。
2. 在任务 worktree 正常 non-squashing merge 该 baseline。保留双方预期行为，逐个理解冲突；不能用全局 ours/theirs 静默丢一方。对每个冲突说明双方需求及来源、最终保留或有据舍弃的行为与理由，并定位合并后的实现；尚不能解释一方需求的项仍是未解决。
3. 只 stage 已解决文件，跑受影响检查；有未解决冲突就停止，不创建部分merge commit。需要取消merge时用merge abort保留原进度，失败明确报告。逐冲突读回结果与对应检查，交接列实际保全行为、验证结果及未验证限制；只有每项冲突均可解释且无未解决项，才进入后续提交，不把移除标记当成需求已保全。
4. commit 等不可逆动作读取 `runtime/interface/git-authorize.mjs` 核实际授权动作、分支和当时HEAD，漂移拒旧记录；已有授权覆盖时按当前HEAD重记录消费，不逐项重问。读回实际merge commit与任务工作区状态。
5. 交回已声明close执行器继续其授权范围的目标merge/push/归档/清理并分别读回。本技能不代执行这些其它操作，也不重新启动build-code或全量测试。

操作失败、脏目标、身份/分支漂移或不安全清理按真实错误处理；保留证据与用户进度，不能以消除冲突为名改写历史或删除他人文件。
