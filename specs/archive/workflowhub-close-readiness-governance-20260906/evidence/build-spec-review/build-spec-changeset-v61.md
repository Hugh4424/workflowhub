# build-spec 变更集 v6.1（focused review 范围）

本变更集是初始审查 v6（4 findings）处置后的窄域修复。请核对：①每处修复是否与冻结决策一致（D-302 v4.3/T-032、D-205、D-304/T-034、D-301）；②修复是否正确完整、有无引入新矛盾或遗漏同源残留（全 spec 搜索 GREEN 强制 reject/collision 旧语义应为零）。

## FIX-1 — 第 2 节范围内·材料质量治理（II-1）
修复内容：GREEN 强制 reject 旧语义残留→RED-only
修复后文本：
- **材料质量治理（II-1）**：新生成 spec/plan 的 AC 四段卡和 tasks 的结构化 oracle 口径统一；验证、通过、失败、证据四段对适用 AC 强制且非空；行为验证 oracle 使用 `pass` 与 `reject` 两部分；verification_role=RED 且有配对的行为验证需要非空 reject（GREEN 配对仅要求配对关联与 oracle.pass 非空，不强制 reject）；verify 入口只读检查材料存在、身份绑定、非占位符、非零 digest 与当前 snapshot 绑定。

## FIX-2 — SCN-010 Then 段
修复内容：同上
修复后文本：
- **Then**：四段式全部存在且非空；verification_role=RED 且配对行为的 oracle 同时有可通过和可拒绝断言（GREEN 配对仅要求配对关联与 oracle.pass 非空）；不满足时直接显示材料不完整，不靠额外脚本改写材料。

## FIX-3 — 第 13 节回归路径
修复内容：同上
修复后文本：
- **回归路径**：新 spec 的正常 AC、缺失败段、RED 配对缺 reject（GREEN 配对不强制）、非行为验证、材料缺失/旧绑定/占位符/零 digest、独立审查成功/失败/不可用/取消；检查历史材料只读不变。

## FIX-4 — FR-GAP-001 collision 判定
修复内容：collision 只限身份字段不一致或哈希冲突；reason/provenance 差异合并不触发
修复后文本：
- **FR-GAP-001**：同一渲染快照内的 gap_id 必须由规范化缺口语义确定性派生；canonical payload 固定为 `gap_kind、subject_id、expected_fact、actual_fact、reason` 五字段；其中 reason 是非空 provenance 列表，每项为 `{producer, reason_text}`，只用于用户阅读和追溯，不参与 gap_id 身份。gap_id 输入固定为规范化后的 `gap_kind、subject_id、expected_fact、actual_fact` 四字段；规范化规则固定为缺失/null 记为 `unknown`、字符串转 Unicode NFC、去首尾空白、连续空白归一、大小写按原样保留、字段顺序按上述顺序归一；序列化使用 UTF-8 canonical JSON：四身份字段必须是 string 或 null；null 先规范化为 `unknown` 字符串；对象键按 ASCII 字典序输出；不输出多余空白；字符串转义遵循 JSON 最短形式，保留非 ASCII 字符；数字、数组和对象在这些身份字段中一律拒绝；hash 为 `gap-<sha256(serialized)>` 的完整 64 位十六进制值；collision 判定只限两种情形：①同一 gap_id 的四身份字段规范化值不一致（不同缺口被误判为同一 ID）或②发生 SHA-256 哈希冲突。任一情形成立时，当前渲染显示 `gap_projection_unavailable`、reason=invalid_gap_collision，不自动合并，也不允许任何 gap-bound confirmation 消缺，直到生产者修复。canonical payload 仅在 reason/provenance 上的差异按本节去重排序规则合并，不触发 collision。不同投影为同一 gap_id 提供多个 reason 时，每项的 producer 和 reason_text 都做 Unicode NFC、去首尾空白、连续空白归一；按 `(producer, reason_text)` 精确去重，再按 producer、reason_text 的 ASCII 字典序排序，形成 canonical provenance 列表；reason 列表不改变 gap_id，也不把任一 producer 的 reason 提升为唯一原因。若任一 gap_id 身份字段是数字、数组或对象，该缺口不得被静默丢弃：当前渲染必须显示 `gap_projection_unavailable`，保留 producer、subject_id、reason=invalid_gap_identity、owner=当前阶段主会话和修复建议；此时不生成 gap_id，也不参与确认消缺。

## FIX-5 — FR-CONTEXT-003 开头
修复内容：阶段输入 packet 与审查 packet 边界显式化（审查链 file_only/字节不减/零新文件；派生文件不进审查链）
修复后文本：
- **FR-CONTEXT-003**：spec、plan、tasks 的输入必须以宿主组装、脱敏并冻结的 packet 交付，packet 由冻结材料正文、packet manifest、包内导航/摘要和按需详情文件组成；**本 packet 为阶段输入 packet（consumer=spec-specify/spec-plan/spec-tasks 的主会话与派发子代理），与审查 packet 边界分明：审查 packet 维持既有 file_only 冻结链、字节不减、零新文件（D-304/T-034），diagnostic-report.md、context-baseline.json 等派生文件只作为本 packet 派生层条目供阶段输入消费，不得进入审查冻结链**；diagnostic-report.md、context-baseline.json 等 build-plan 需要的 evidence 文件以 packet 派生层条目进入，manifest 记录其 path、source_digest、sha256、producer、consumer 和“非材料”声明；packet manifest 至少记录 task_id、stage、material_revision、snapshot_tree、每份源材料 sha256、派生文件清单、每个派生文件的 source

## FIX-6 — FR-FLOW-003 依据+第 6 节依据行
修复内容：补强用户确认回执 a71319ff 引用+D-301 锚点
修复后文本：
- **FR-FLOW-003**（依据=D-301 每 phase 独立验收+第一轮 spec-clarify 用户确认回执 quality/confirmations/a71319ffcd4b8e55c68c7c0089126b39392cf4917e6d9d5e67786bfaca3da2f5.json，用户确认"阶段验收只记录事实和恢复建议"）：每个 phase 的用户验收必须形成独立事实，复用既有 human-confirmation/interactions 载体，不新增 store、第二状态机或独立 phase 账本；事实绑定 task、phase、当前 material rev
- **依据**：D-303、D-304、D-401、D-301 与第一轮 spec-clarify 用户确认回执 quality/confirmations/a71319ffcd4b8e55c68c7c0089126b39392cf4917e6d9d5e67786bfaca3da2f5.json（本轮用户澄清确认）；本节只保留事实和恢复建议，不新增状态机、attempt 重试链或 current 选择算法。
