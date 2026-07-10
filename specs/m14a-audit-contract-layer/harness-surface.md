# Harness Surface Contract

本文件定义可被审计的 harness surface 边界。它只表达风险、归属、权限和验证方式，不实现权限系统，不给出自进化建议。

## Permission Semantics

| permission | 语义 |
|---|---|
| `locked` | 默认不可由自动流程修改；变更需要明确人工决策。 |
| `append_only` | 可追加记录或条目，不可重写既有事实。 |
| `editable` | 可在受控流程内修改，必须保留 provenance。 |
| `human_controlled` | 决策权归人类，自动流程只能记录和浮现。 |

## Surface Table

| surface | risk | owner | permission | validation_method |
|---|---|---|---|---|
| schema | 字段漂移会导致事实不可比较。 | workflowhub contract owner | `human_controlled` | schema review + version diff + required field coverage check |
| orchestrator | 调度语义变化会影响 stage 边界和人工确认点。 | workflow orchestrator owner | `human_controlled` | stage-result receipt + issue workflow review |
| skills | skill 契约变化会影响执行步骤和上下文消耗。 | skill owner | `editable` | SKILL.md version check + metrics wiring check |
| adapters | 外部工具适配失败会造成假执行或假审查。 | adapter owner | `append_only` | raw verdict/provenance artifact check |
| dashboard | 展示层误读会把 unknown 呈现为 pass。 | dashboard owner | `editable` | UI facts mapping review + unknown-state fixture |

## Version Rule

- surface 范围、permission 语义或 validation_method 语义变化属于契约版本变化。
- 文案修正或展示顺序调整不属于契约版本变化。
