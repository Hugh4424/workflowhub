# AGENTS.md

本文件给通用 AI 助手（任意命令行 agent）提供 workflowhub 仓库的身份与规则信息。

## 项目身份

- 名称：workflowhub
- 定位：面向 AI 开发工作流的编排工具，可被多种命令行 AI 助手复用。
- 构建基准：本仓库的设计宪法 [CONSTITUTION.md](CONSTITUTION.md)。

## 给 agent 的规则

- 任何改动须符合宪法，并用 [constitution-checklist.md](constitution-checklist.md) 逐条对照。
- 重活放进子代理上下文执行，主上下文只收摘要（减少主上下文占用）。
- 技能应可独立调用、可搬运，不绑死单一宿主环境。
- 质量裁决由独立来源独立上下文产出，禁止自审自判。

## 入口文件

- 项目说明：[README.md](README.md)
- 设计宪法：[CONSTITUTION.md](CONSTITUTION.md)
- 检查清单：[constitution-checklist.md](constitution-checklist.md)
- 术语表：[CONTEXT.md](CONTEXT.md)
