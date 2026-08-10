# 任务清单：[填写：功能名]

- **Input**：`[填写：decision-log.md ref]`、`[填写：spec.md ref]`、`[填写：plan.md ref]`
- **Template version**：`plan-task.v3`

## T001 — RED：[填写：失败测试标题]

- **目标**：[填写：先证明哪个目标行为尚未成立]
- **依赖**：none
- **精确文件**：`[填写：测试文件精确路径]`
- **动作**：[填写：增加一个因目标断言失败的测试，不改生产实现]
- **验证**：role=RED; paired_task=T002; gate_cmd=`[填写：可执行命令]`; expected_exit=`[填写：非零整数]`; oracle=`[填写：ORACLE-ID 和目标失败信号]`
- **证据**：evidence_path=`[填写：task-relative 路径]`; record=`[填写：目标断言、exit 和必要输出]`
- **Trace**：[填写：source/decision ID → FR ID → AC ID]
- **STOP**：[填写：环境失败、命令损坏、越界或需要新设计时停止]
- **状态**：`pending`
- **执行事实**：N/A — not started

## T002 — GREEN：[填写：实现标题]

- **目标**：[填写：让 T001 的目标断言通过并保留负例]
- **依赖**：T001
- **精确文件**：`[填写：实现文件及必要测试文件的精确路径]`
- **动作**：[填写：满足目标行为的最小实现]
- **验证**：role=GREEN; paired_task=T001; gate_cmd=`[填写：与 T001 完全相同的命令]`; expected_exit=`0`; oracle=`[填写：同一 ORACLE-ID、成功信号和必要负例]`
- **证据**：evidence_path=`[填写：task-relative 路径]`; record=`[填写：成功信号、exit 和必要输出]`
- **Trace**：[填写：与 T001 对应的 source/decision ID → FR ID → AC ID]
- **STOP**：[填写：需要弱化测试、扩大边界或新增设计时停止]
- **状态**：`pending`
- **执行事实**：N/A — not started
