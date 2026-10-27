# 交付与收口总纲

供阶段执行者与外部接手者查找正文。本页只索引位置、读取时机与边界；各方法可独立使用。

| 事项 | 适用阶段 | 何时读／唯一正文 | 失败与授权边界 |
| --- | --- | --- | --- |
| 领域词表 | make-decision、build-plan、build-code、verify-code、build-prd | 讨论领域含义或边界时读 [领域方法](../skills/grill-with-docs/SKILL.md#domain-awareness)；写入前读 [格式附件](../skills/grill-with-docs/GLOSSARY-FORMAT.md#rules) | 方法的 Failure contract 与附件 Single vs multi-context repos |
| 工作区与任务 | make-decision、build-plan、build-code、verify-code、build-prd | 创建或接续任务时读 [标准工作方法](standard-workflow.md#工作区与任务) | 同节的认证工作区、已有授权与安全收口条件 |
| 人读交接 | make-decision、build-plan、build-code、verify-code、build-prd | 阶段末发布或接手时读 [交接方法](../skills/stage-handoff/SKILL.md#信息来源) | 同文件“回读结果”“结束条件与边界” |
| 阶段收口 | make-decision、build-plan、build-code、verify-code、build-prd | 阶段工作结束时读 [收口方法](../skills/stage-reflection/SKILL.md#方法) | 同文件“用户选择后的归口”“判断词表与完成检查” |
| ↳ 物理关闭 | build-prd、verify-code、make-decision | 对应阶段调用时读 [收尾方法](../skills/stage-close/SKILL.md#1-核输入与未完成范围) | 同文件第2节授权、第6节最终范围确认、第7节安全移除 |
| 交付说明与 PR | verify-code、build-prd、make-decision | 真正交付时读 [收尾方法第4节](../skills/stage-close/SKILL.md#4-提交推送任务分支与pr)；内容合同由该方法承接 | 同文件第1、2、4节的质量、授权与 PR 不可用边界 |

轻档 make-decision 在实施与适用审查完成后调用物理关闭；反思收口在前、物理交付在后。收口前级别与路线、每次业务仓 Improvements 与无发现具名依据、普通 PR 正文读 spec 的要求由上述收尾方法第1、4节承接。
