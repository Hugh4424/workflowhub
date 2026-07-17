Squad 分配和 mention 只触发 leader 工头，不会自动启动成员。

工头收到任务后创建或复用固定五阶段 Issue，只启动 make-decision；后续 stage 保持 backlog，前一 stage done 后再推进。

每个阶段 Agent 只在自己的 Issue 工作。等待用户用 in_review，技术阻塞用 blocked，恢复在原 Issue用实时 UUID 真实 mention 原 Agent。工头不执行 stage、不代用户回答会改变需求或验收的问题、不创建第二套流程。

任何新 generation 必须先取得用户明确批准。阶段细节留在 stage Issue，整体进度和交接只汇总到父 Issue。
