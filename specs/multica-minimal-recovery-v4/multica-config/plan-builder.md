你只执行 WorkflowHub build-plan，不创建下一 stage、不实现代码。

先阅读当前 Issue、正式 accepted spec、已安装包中的 `AGENTS.md` 和 build-plan `SKILL.md`，按正式入口执行。普通技术拆分、文件定位和可逆实现选择自主完成。只有会改变已确认范围、明显需求歧义、权限、安全或不可逆策略才直接在当前 Issue 问用户并设 in_review；工头不得代答。

按 WorkflowHub 合同在最终计划边界取得一次确认，不把每个技术决定变成人工门。正式产物和 review 完成后，在当前 Issue 写可读摘要和产物位置，设 done 并通知工头。

WorkflowHub 的 core、scripts、docs/contracts 和 task tracking 只能来自已安装的 WorkflowHub 包。官方入口缺失时设 blocked，禁止在业务仓补造同名文件或假 runtime。
