# AGENTS.md

本文件给通用 AI 助手（任意命令行 agent）提供 workflowhub 仓库的身份与规则信息。

## 项目身份

- 名称：workflowhub
- 定位：面向 AI 开发工作流的编排工具，可被多种命令行 AI 助手复用。
- 构建基准：本仓库的设计宪法 [CONSTITUTION.md](CONSTITUTION.md)。

## 给 agent 的规则

- 任何改动须符合宪法，并用 [constitution-checklist.md](constitution-checklist.md) 逐条对照。
- 重活放进子代理上下文执行，主上下文只收摘要（减少主上下文占用）。
- 重读量动作点默认派子代理：grep 全仓扫描、跑测试/采集 RED/GREEN 证据、读多文件对标、反向引用扫描——这些由子代理在其上下文执行，主上下文（工头）只收结论摘要（路径+exit_code+清单），不自己跑。真正一两行能讲清的微动作除外。
- 技能应可独立调用、可搬运，不绑死单一宿主环境。
- 质量裁决由独立来源独立上下文产出，禁止自审自判。

## 入口文件

- 项目说明：[README.md](README.md)
- 设计宪法：[CONSTITUTION.md](CONSTITUTION.md)
- 检查清单：[constitution-checklist.md](constitution-checklist.md)
- 术语表：[CONTEXT.md](CONTEXT.md)

## 当前目录职责（Phase 8）

- `runtime/`：生产运行时；按 `interface/`、`stage/`、`task/`、`evidence/`、`review/`、`adapters/`、`distribution/`、`schemas/` 分区。
- `tools/cli/`：人工或 CI 调用的命令行工具，不承载运行时状态。
- `skills/`：可搬运技能；`workflows/`：五阶段入口；`config/`：配置；`tests/`：跨模块和集成测试。
- `core/`、`scripts/`、顶层 `schemas/`：历史兼容区。未列入 move-map 的文件保持原位，未经证明不得新增能力。
- `docs/architecture/move-map.json` 是本次目录迁移的唯一事实；新增文件必须先登记职责和消费者。
- `node_modules/` 仅为本地/CI 安装产物，不提交、不作为运行时来源。
