# ADR 0010：严重审查问题的异常处置

- 状态：Accepted
- 日期：2026-07-26
- 决定来源：Stage 内容契约 accepted decision；spec-clarify Q1=A、Q2=A；本任务两份独立宪法审计

## 背景

宪法 1.2.0 把质量意见定义为“记录而不阻断”，同时只在 make-decision、build-plan、verify-code 保留正常业务确认。这个方向解决了质量门和重复确认拖死流程的问题，但没有表达用户后来确认的一种窄例外：正式独立审查已经给出有效证据，而且问题同时是 `disposition=actionable` 与 `severity=major|blocking`。

结构错误和质量问题不能混为一类。身份、顺序、hash、必需产物错绑可以确定判断，应继续 fail-loud。一般质量意见仍只记录。只有上述已确认阈值的严重问题先暂停，再让用户在看过具体问题、证据、后果和范围后选择修复或明确承担该项风险。

## 决定

1. CONSTITUTION 升至 1.3.0，只修改 F3、F4、F7、Q1、Q2；旧→新映射保持 F3→F3、F4→F4、F7→F7、Q1→Q1、Q2→Q2，其余 16 条不变。
2. 全部五阶段都消费同一正式阈值：`actionable + major|blocking`。invalid evidence、invalid anchor、unavailable、timeout、adapter failure 和 minor 不触发风险处置。
3. 正常人工确认仍只有 make-decision、build-plan、verify-code。build-spec、build-code 没有严重问题时继续自动推进；严重问题暂停是异常处置点，不是新增日常 gate。
4. 用户可选择修复，或明确承担绑定到具体 finding 和快照的风险。风险接受不修改 review/audit verdict、不伪造 pass、不放行结构错误，也不承载 decision omission。
5. 本 ADR 只确定宪法边界。风险记录 schema、Stage 接线和展示卡在后续 Phase 实现；本 ADR 通过独立审查前不得出现这些实现 diff。

## 取舍

- 选择：窄阈值默认暂停，同时保留用户对具体风险的最终决定权。
- 拒绝“所有质量意见都阻断”：会重新制造质量门和重复等待。
- 拒绝“严重问题也只提醒”：会让证据充分的重大问题被静默忽略。
- 拒绝“安全或不可逆类别永不允许继续”：用户已经明确选择所有类别都可在充分知情后承担；系统职责是把具体风险说清并准确留痕。

## 后果

- 好处：结构完整性、一般质量记录和严重问题处置边界清楚；自动阶段不会恢复成每次确认。
- 代价：后续必须实现严格的 finding/快照/回答绑定和秘密最小化。
- 风险：阈值实现过宽会把异常暂停变成普遍 gate；过窄会漏掉应暂停的问题。后续测试必须同时覆盖 major、minor、invalid、unavailable 和跨快照复用。

## grill-with-docs 退出记录

- `CONTEXT.md`：changed；补充三类窄研究结论和严重问题异常处置边界。
- ADR：created；本决定难以反转、无背景会令人意外、且存在“普遍阻断 / 只提醒 / 窄暂停”的真实取舍，三项均为真。
- 术语冲突：旧“质量事实不阻断”容易被读成绝无例外；现明确为“一般质量只记录，证据充分的严重问题窄暂停”。
- 外部接口：pass；只使用既有正式 wh-review 聚合字段，不新增 provider 或身份系统。
- 唯一命名：pass；严重问题阈值唯一来自 accepted spec，风险接受与 decision omission 分离。
- 失败语义：pass；结构错误 fail-loud，invalid/unavailable 不进入风险接受，风险接受不改 verdict。
- 范围边界：pass；本 Phase 只改宪法、checklist、CONTEXT、Skill 来源和本 ADR，不实现风险处置代码。
