# WorkflowHub 术语

## 五段方法

| 方法 | 英文标签 | 当前职责 |
| --- | --- | --- |
| make-decision | intake | 收敛用户目标与方向，写 decision-log.md |
| build-spec | design | pre/history 四材料方法只读留存 |
| build-plan | plan | post 的 spec.md 全局设计、独立 Phase 与纯指针 index |
| build-code | apply | 按当前 Phase 实施与针对性验证 |
| verify-code | test-acceptance | 当前交付终末独立核对与逐 AC 判断 |

post 日常路线是 make-decision → build-plan → build-code → verify-code。旧四材料、旧报告和历史执行记录只读保留；它们不是新 writer 或推进许可。

## 当前事实

- task：业务身份与普通元信息。post 的材料位于认证工作区 specs/<task-id>/。
- Phase：实现工作包；输入、写集、oracle、边界在独立 P<n>.md，index 只存六列纯指针。
- phase_progress：facts.jsonl 的一个当前导航游标；不证明完成，不另存序列。材料提交变更后 stale，纯代码变更不使它 stale。
- 质量事实：真实测试、审查和来源；缺失为 unknown/unavailable/incomplete，不阻止修复，也不能冒完成。
- finding：带原始来源与证据的发现；有效单源发现不能因独立数量不足被丢弃。严重问题先修复或由人承担具体风险。
- 三审查点：build-plan 合并、build-code 每 Phase、verify-code 终末。文档 wh-review，代码 OCR；仅 OCR 未安装时回退 wh-review 并保存实际 fallback。
- 两道人为门：方向选择与计划选择。已有授权持续有效；真正方向未决才交用户。
- 人读交接：唯一新的 Markdown，解释结果、风险和下一步；旧交接原件不覆盖，不产生机器状态。
- 窄工具：工作区检查、命令采集、普通原子记录、Git 操作授权、锁、人类回复。工具事实不成为阶段许可。
- 报告 immutable：只保一份 raw/正式回执原件，引用代替镜像；不保存整棵工作树或目录作为证据。
- pre/history：旧四材料和旧执行原件只读；接续能力由 Card-08 负责，当前不能声称已实现历史重放。
