# workflowhub

一个面向 AI 开发工作流的编排工具项目：把需求确认、规格/计划、实现和验证做成可被多种命令行 AI 助手复用的工作流与技能集合，按一套设计宪法构建。

## 是什么

workflowhub 的正式 stage 集合有五项；普通任务按冻结的 activation cohort 选择实际路线。每个 stage 都是独立、可搬运、可被子代理调用的技能；多个技能组成一个工作流。它强调：薄核心、窄契约、质量靠独立审查与人（而非阻断式质量门）、记录事实而非卡死流程。完整的设计原则见 [CONSTITUTION.md](CONSTITUTION.md)，逐条检查清单见 [constitution-checklist.md](constitution-checklist.md)。

## 怎么装

本仓库当前为初始骨架。克隆后安装依赖并运行项目自带的检查命令即可验证骨架可用：

```bash
npm install
npm run check
```

`npm run check` 对仓库内的文档做一致性检查。完整安装与使用文档将在后续里程碑补充。

## 代码结构

生产运行时在 `runtime/`，命令行工具在 `tools/cli/`，技能和正式 stage 入口分别在 `skills/` 与 `workflows/`。`core/`、`scripts/` 和顶层 `schemas/` 只保留已登记的历史兼容文件；目录迁移清单见 [`docs/architecture/move-map.json`](docs/architecture/move-map.json)。

> 说明：`check` 是对交付物结构的**一致性入口校验**（属宪法 Q2 的入口校验类），不是宪法 F4/Q1 所反对的阻断式质量判断门——它只校验客观结构事实（条目数、四段是否齐、锚点是否可达、术语是否合规），不替代独立审查与人的质量裁决。

## 普通任务路线

- `pre`：`make-decision → build-spec → build-plan → build-code → verify-code`。既有任务、历史记录和缺少冻结 cohort 的任务都保留这条五阶段路线。
- `post`：`make-decision → build-plan → build-code → verify-code`。`build-plan` 负责当前 `spec.md`、`plan.md` 和 `tasks.md`；`build-spec` 只读保留 pre/history。

cohort 只在创建任务时冻结；不是用户在命令行临时选择。`stage-runtime status --action=begin` 会回显实际的 `task_type`、`activation_cohort` 和 `topology`。

## 正式 stage 集合速览

1. **需求确认（intake）**：把需求收敛清楚，产出需求权威记录。
2. **设计（design）**：把"做什么、怎么验收"写成设计文档。
3. **计划（plan）**：把设计拆成可执行的任务与技术方案。
4. **实现（apply）**：逐项实现，配套测试与独立审查。
5. **验收（test-acceptance）**：独立验证交付是否达标。

这五项是正式 stage 集合，不表示每个普通任务都会执行五项。每个阶段按目录约定组织（见 `skills/`、`workflows/`、`config/`）。

## 多 CLI 宿主接线

宿主调用阶段时必须显式提供 `--project` 与 `--task`，或运行在已认证的 task worktree。当前 WorkflowHub 会话直接执行阶段；外部 Stage Agent、bridge、session 或 stage outcome 都不是任务推进前置条件。旧 host 结果只读保留历史 provenance，不参与当前 run、reflection、handoff 或 close。接线细则见 [`skills/workflowhub-host-protocol/SKILL.md`](skills/workflowhub-host-protocol/SKILL.md)。
