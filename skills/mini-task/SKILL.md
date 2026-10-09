---
name: mini-task
description: 用独立 task/worktree/branch 紧凑交付一个小功能，并在需要时恢复被它阻塞的普通任务 A。
---

# mini-task

边界清楚、单一结果、有限影响的小功能可用独立 task/worktree/branch 交付。它不是第六正式阶段，不创建 successor/recovery 关系对象。范围扩大到重大架构/迁移/权限/安全选择时，把风险写清，给用户缩小当前小任务或采用普通五阶段任务的真实选择；不自动转换。

## 方法

1. 确认目标仓库/分支、已授权范围和工作区状态，独立工作。post 依当前 decision-log、spec、独立 Phase 与指针 index 组织材料，历史 pre 四材料只读，不补旧 plan/tasks 双写。
2. 对方案作独立文档建议；对实现作当前工作流规定的独立代码建议。文档走 wh-review，代码走 OCR；只有 OCR 命令不存在（ENOENT）或版本低于1.12.9，才用 architect-code-review 执行同一代码审查，保留检测输出、原因、真实执行者和覆盖限制。版本检测其它错误保持 unknown/unavailable，不推断未安装；已安装失败、超时、取消、无效输出、零成功路或空 findings 均不回退，原失败保留 unavailable。`skills/mini-task/scripts/mini-task-runner.mjs` 是保留运行器的实际位置；执行时核对其真实审查调用及返回来源，方法声明不证明该运行器已按代码审查路线执行，差异按实际发现交 owner 修复。
3. 实现限定功能，核真实用户结果和受影响测试，保存命令、actual exit、oracle、覆盖限制、原始发现/失败和逐AC结果。有效问题在小任务内修，不用 caller pass 或空 findings 代真实审查。审查材料按真实范围覆盖当前 diff、测试命令与 oracle、实际结果、逐 AC trace、coverage limits、跳过理由和剩余风险；这是覆盖说明，不设必填字段或新增校验器。
4. 不可逆 Git 操作前读取 `runtime/interface/git-authorize.mjs`，记录并消费实际授权动作、分支和当时 HEAD；消费前 HEAD 漂移拒绝旧记录。已有用户授权覆盖动作/范围时按当前HEAD重记录消费，新增动作或范围才请用户决定。工作区核对读取 `runtime/interface/workspace-check.mjs` 检查脏源/目标和边界；出现真实共享记录写冲突时读取 `runtime/interface/record-lock.mjs` 处理相应写者；没有授权不执行，未完成照实报告。
5. 使用已声明 close/交付能力完成计划内操作，逐项读回 commit/merge/push/archive/cleanup 的实际物理结果。计划内未授权或未完成的操作保持 pending/incomplete，不能当作 skipped；skipped 只用于不在计划内的操作，并说明理由；发布、质量、Git 和物理关闭分别报告。
6. 由任务 A 触发时，先按既有授权保存 A 的实际进度，在 A 的真实 worktree 对已核 target OID 正常 merge。冲突立即 abort，保留 A 的进度与失败，无 MERGE_HEAD/假完成；只复验受影响范围，再从 A 原阶段继续。只读母任务/兄弟边界，不无声覆盖它们。

取消只停止未来动作，保留材料、事实、worktree、branch 和已有Git对象；reset/删除/回退/cleanup 需已有授权明确覆盖，缺授权先准备可审查方案再取得决定。保留运行器位于 `skills/mini-task/scripts/mini-task-runner.mjs`，由该运行器 owner 维护实际执行；本技能不改运行器，不调用私有 session 或声称尚未发生的同步/交付。
