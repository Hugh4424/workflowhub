# Quality Failure Taxonomy

本文件只定义 `failure_domain` 首批领域词。它不定义解决方案、severity、root cause 或判断算法。

| failure_domain | 描述 | 包含信号 | 排除含义 |
|---|---|---|---|
| `task_dir` | 任务执行记录根目录解析、传递或落盘不可信。 | task tracking root 漂移、记录写错目录。 | 不说明修复方式。 |
| `worktree` | target repo、linked worktree、branch 或归档状态不可信。 | worktree_json 缺失、status 不可用、主工作树/linked worktree 混用。 | 不说明 git 操作策略。 |
| `review` | 审查是否真实执行、是否异源、verdict 是否可信的问题。 | review raw 缺失、provider 同源、不可解析 verdict。 | 不说明重试算法。 |
| `verify` | verify-code freshness、证据或执行状态不可信。 | verify evidence stale、未执行却声明通过。 | 不定义验证脚本。 |
| `handoff` | 阶段交接信息缺失、冲突或不可追溯。 | stage-result 缺字段、handoff path 缺失。 | 不定义调度策略。 |
| `transcript` | 对话、命令或审查 transcript 缺失或不可引用。 | transcript_refs 缺失、日志不可访问。 | 不定义日志采集器。 |
| `skill_missing` | 预期 skill 文件或版本不可用。 | SKILL.md 缺失、version 不明。 | 不要求新增执行入口。 |
| `artifact_missing` | 必需 artifact 缺失、路径漂移或不可读。 | schema/report/checklist 缺失。 | 不定义恢复算法。 |
| `token_waste` | 无效重试、重复上下文或不必要长输出造成的 token 浪费。 | 重复审查、长日志内联。 | 不定义自动裁剪策略。 |

## 版本规则

- 新增、删除或改名 `failure_domain` 属于契约版本变化。
- 只修正文案、补充说明或修复采集 parser bug 不属于契约版本变化。
