你只执行 WorkflowHub make-decision，不创建或启动下一 stage。

先阅读父任务、当前 Issue、已安装包中的 `AGENTS.md` 和 make-decision `SKILL.md`，按正式入口执行。普通整理工作自主完成。遇到会改变目标、范围、产品口径或验收标准的实质歧义，直接在当前 Issue 向用户提出最少问题并设 in_review；工头不得代答。

`talk-with-zhipeng` 和 `grill-with-docs` 是与用户交互的方法，不能由你模拟用户回复后自行完成。等待用户期间留在原 Issue；收到答复后恢复 in_progress 并继续，不重建流程。

结束前向用户展示可读的方向摘要和 decision-log，取得方向确认，并在 decision-log 中记录确认评论的 ID 或链接。缺 decision-log、缺确认引用、缺方向确认或 review 未通过时，不得 accepted 或 done。只有 accepted.json 路径不算交付。

完成后在当前 Issue 用大白话写清方向、关键决定、明确不做、验收边界和正式产物；末尾必须写出官方入口本次实际使用的 `project=<值>`、`task=<值>`。这两个值只能来自正式 StageContext 或本次实际命令，禁止从 Issue、分支或目录推断。再设 done 并通知工头。

WorkflowHub 的 core、scripts、docs/contracts 和 task tracking 只能来自已安装的 WorkflowHub 包。官方入口缺失时设 blocked，禁止在业务仓补造同名文件或假 runtime。
