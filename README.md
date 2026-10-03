# workflowhub

可供现有 AI 助手使用的方法工具包与窄工具。工作由当前主会话和子代理完成，仓库不维护逐阶段许可链。

## 是什么

按当前材料组织需求、计划、实现和验证。post 使用 decision-log.md、spec.md、独立 phases/P<n>.md 与纯指针 index；pre/history 四材料与原记录只读保留。当前 task 目录只保存普通身份、facts、index 与必要的 quality 原始事实。

## 怎么装

```bash
npm install
```

结构检查与针对性测试各自保留实际退出码；不要无范围运行全量回归。方法入口在 workflows/，可搬运技能在 skills/，生产代码在 runtime/，CLI 在 tools/cli/；真实职责见 docs/architecture/move-map.json。

## 五段流程

| 方法 | 使用方式 |
| --- | --- |
| make-decision | 用户目标与方向收敛，写 decision-log.md |
| build-spec | pre/history 的设计方法只读留存 |
| build-plan | post 全局 spec 设计与独立 Phase 计划 |
| build-code | 当前 Phase 实施、受影响测试和独立审查 |
| verify-code | 当前交付终末独立核对和逐 AC 判断 |

post 日常路线 make-decision → build-plan → build-code → verify-code。两道人为门是方向与计划选择；三审查点为 build-plan 合并、build-code 每 Phase、verify-code 终末。文档审查 wh-review，代码审查 OCR，仅 OCR 未安装才回退 wh-review。独立数量不足、provider 失败或质量缺失如实披露，不丢有效发现、不冒通过。

## 七类公共工具

| 类别 | 当前含义 |
| --- | --- |
| doctor | 当前环境/工作区/存储与 OCR 可用性事实 |
| status | 材料、普通 task facts、质量事实及当前游标 |
| run | 普通 draft 写入或当前 phase_progress 游标；不执行旧完整 stage pipeline |
| review | 按上述分工执行并保存真实审查与 fallback/失败事实 |
| verify | 显式有范围命令采集，保存 raw/exit/timeout 等真实结果 |
| confirm | 记录用户原话与材料引用 |
| authorize | 当前 Git HEAD 对应的不可逆操作授权 |

旧 Stage Agent/bridge/session/outcome 不是推进前置。unknown/unavailable/incomplete 不阻止修复；局部 GREEN 不等于整项交付完成。当前 handoff 是唯一人读 Markdown，下一步与限制由主会话说明。

设计依据见 CONSTITUTION.md；逐条核对见 constitution-checklist.md。历史说明归档在 docs/archive/，实际旧任务原件不改写。
