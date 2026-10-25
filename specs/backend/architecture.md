# WorkflowHub 后端架构

版本/最后更新：2026-10-25。作用域：本项目当前任务。owner：原架构/运行时owner；consumer：规划、实现与代码审查者。

## 依据与职责

[设计宪法](../../CONSTITUTION.md#框架原则f)及[目录职责](../../AGENTS.md#当前目录职责)。生产代码归runtime已有分区，CLI只作人工/CI入口，不建设阶段状态机。

本件是专业规则读法与最小适用边界，不替代原字段、业务需求、判据或执行记录。

## 专业规则与失败边界

模块之间经窄public接口通信；真实caller先于扩面。普通任务事实经认证task handle保存，历史只读；新机制须已有consumer/owner/替代及删除条件。`runtime/interface/record-lock.mjs`的withLock按共同dir/name互斥，task锁只覆盖单task；原子文件写不冒多文件事务。错误沿原owner明确暴露，不吞成默认成功。

## 真实consumer与接缝

`runtime/interface/runtime-facade.mjs` → `createRuntimeFacade/invokeRuntimeCommand`；`runtime/task/task-handle.mjs` → `openTask`；真正调用路径是`tools/cli/stage-runtime.mjs`到既有stageRuntimeCliMain及其delegates，不在本文增加入口。

## 反例与核对

反例：复制接口/质量字段表并以本文存在宣称真实任务通过，或失败改成默认成功。独立reader从项目AGENTS到本入口、正文和具名原源，选一正常及无效输入核唯一owner/错误方向；执行结果只写任务原件，不写本文为pass。

## 缺口与维护

未读具体任务的权限、环境、并发和服务效果保持unknown，由对应任务/专业owner补真实原件；仅暂停依赖缺规则的判断，安全工作继续。修改本件先核适用原源/consumer，不从当前偶然实现推应然标准；原源变化同步必要导航，不清洗历史。
