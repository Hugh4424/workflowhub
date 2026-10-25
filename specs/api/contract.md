# WorkflowHub 接口合同

版本/最后更新：2026-10-25。作用域：本项目当前任务。owner：public runtime及task API owner；consumer：CLI调用者、独立测试与任务作者。

## 依据与职责

[runtime facade](../../runtime/interface/runtime-facade.mjs)和[task handle](../../runtime/task/task-handle.mjs)是实际合同；schema与校验仍在原实现。

本件是专业规则读法与最小适用边界，不替代原字段、业务需求、判据或执行记录。

## 专业规则与失败边界

公共行为仅doctor/status/run/review/verify/confirm/authorize；请求在委托边界核兼容，不透传storage/framework内部表示。task必须由openTask以真实project/task身份打开，普通记录/命令/Git沿handle既有方法；appendRecord保create-only原件，命令exit/signal/timeout/cancel原样留存。输入非法与来源不可读保错误，不以空结果冒成功；具体参数只读原符号，不强加HTTP或OpenAPI。

## 真实consumer与接缝

`tools/cli/stage-runtime.mjs`消费public facade；方法作者经`openTask`消费appendRecord/captureCommand，现有resolver只消费bundle，不证明方法运行。

## 反例与核对

反例：复制接口/质量字段表并以本文存在宣称真实任务通过，或失败改成默认成功。独立reader从项目AGENTS到本入口、正文和具名原源，选一正常及无效输入核唯一owner/错误方向；执行结果只写任务原件，不写本文为pass。

## 缺口与维护

未读具体任务的权限、环境、并发和服务效果保持unknown，由对应任务/专业owner补真实原件；仅暂停依赖缺规则的判断，安全工作继续。修改本件先核适用原源/consumer，不从当前偶然实现推应然标准；原源变化同步必要导航，不清洗历史。
