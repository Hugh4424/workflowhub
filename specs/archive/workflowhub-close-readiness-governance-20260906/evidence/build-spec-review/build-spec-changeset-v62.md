# build-spec 变更集 v6.2（窄域核销审查范围）

初始审查 v6（4 findings）→ focused v6.1（8 findings）→ 实现级修复 v6.2。请仅核对以下 6 处修复：①是否与冻结决策一致（D-302 v4.3/T-032、D-303、D-205 v4.3、D-304/T-034、D-305、D-301）；②修复是否正确完整、有无引入新矛盾。机器验证工件（全 spec 旧语义 zero-match+四 validator PASS）见 evidence/build-spec-review/v62-machine-verification.txt，无需重复要求。

## V62-1（L91）
FND-V61-01：四段"对全部 AC 强制且四段非空"+精确谓词 verification_role=RED 且 paired_task≠N/A（对齐 D-302 v4.3/T-032）
```
- **材料质量治理（II-1）**：新生成 spec/plan 的 AC 四段卡和 tasks 的结构化 oracle 口径统一；验证、通过、失败、证据四段对全部 AC 强制且四段非空；行为验证 oracle 使用 `pass` 与 `reject` 两部分；verification_role=RED 且 paired_task≠N/A 的配对行为验证强制 reject 非空（GREEN 配对仅要求配对关联与 oracle.pass 非空，不强制 reject）；verify 入口只读检查材料存在、身份绑定、非占位符、非零 digest 与当前 snapshot 绑定。
```

## V62-2（L1240）
FND-V61-02：回归路径成员取消映射说明（对齐 D-303 三态）
```
- **回归路径**：新 spec 的正常 AC、缺失败段、RED 配对缺 reject（GREEN 配对不强制）、非行为验证、材料缺失/旧绑定/占位符/零 digest、独立审查成功/失败/不可用/成员取消（原始 cancelled 仅保留在成员级，聚合独立审查事实按 D-303 映射 failed 或 unavailable，不作第 4 聚合态）；检查历史材料只读不变。
```

## V62-3（L354）
FND-V61-04/07：FR-FLOW-003 决策锚点=D-301/D-303/D-304/D-401，回执 a71319ff 降为执行层佐证
```
- **FR-FLOW-003**（依据=D-301 每 phase 独立验收+D-303/D-304/D-401；执行层佐证=第一轮 spec-clarify 用户确认回执 quality/confirmations/a71319ffcd4b8e55c68c7c0089126b39392cf4917e6d9d5e67786bfaca3da2f5.json，用户确认"阶段验收只记录事实和恢复建议"，不改变本 FR 的决策锚定）：每个 phase 的用户验收必须形成独立事实，复用既有 human-confirmation/interactions 载体，不新增 store、第二状态机或独立 phase 账本；事实绑定 task、phase、当前 material revision、snapshot、confirmation receipt 和用户回执；owner 是当前 phase 主会话，读取方是阶段汇报、build-plan 和 verify-code。验收事实只能如实记录用户明确 accepted、rejected、deferred，或交互/回执 unavailable；这些值是对用户事实的记录，不是新的自动状态机、推进门或 current 选择算法。用户未答、取消或回执缺失保持 deferred/unavailable，不得由阶段完成或风险接收推断。恢复建议固定为：rejected 提示当前 phase 修复后重新请求验收；deferred 提示待用户答复并只做不依赖该验收的工作；unavailable 记录真实原因并可按既有公共合同重试；系统只如实消费这些事实和建议，不新增自动阻断 gate。phase 验收事实与第 8 节的 acceptance_status 是两个并列事实：accepted 只表示用户接受该 phase 的验收请求，不从逐 AC 证据推导 pass；acceptance_status 只由逐 AC 验收证据派生，也不由 phase accepted 改写；阶段汇报必须并列展示二者及原因。deferred/unavailable 的 reason 只允许 user_cancelled、user_no_response、receipt_missing、unknown_reason 或 unavailable 的真实通道原因；无法区分时使用 reason=unknown_reason，不新增 unknown 顶层验收值，也不猜。phase 验收事实不参与 product_release_status 或 physical_close_status 的派生；product_release_status 仍只由五阶段当前完成、逐 AC 验收证据和既有 verify human-confirmation receipt 派生，physical_close_status 仍只由授权后的物理读回派生；phase rejected/deferred/unavailable 必须在阶段汇报和 close 记录旁显示，由用户决定下一步，不产生自动阻断或自动完成。
```

## V62-4（L380）
FND-V61-05：subject_id 钉死为 task/material 身份字段（对齐 D-205 v4.3 冻结元组第 1 字段）
```
- **FR-GAP-001**：同一渲染快照内的 gap_id 必须由规范化缺口语义确定性派生；canonical payload 固定为 `gap_kind、subject_id、expected_fact、actual_fact、reason` 五字段；其中 `subject_id` 固定为 task/material 身份字段（绑定 task_id 与当前材料身份，对应 D-205 v4.3 冻结元组第 1 字段"task/material 身份"），`gap_kind` 对应冻结元组第 2 字段"缺口类别"，`expected_fact`+`actual_fact` 对应冻结元组第 3 字段"规范化内容正文"（规范化内容正文由期望/实际两事实字段组成，字段序固定）；其中 reason 是非空 provenance 列表，每项为 `{producer, reason_text}`，只用于用户阅读和追溯，不参与 gap_id 身份。gap_id 输入固定为规范化后的 `gap_kind、subject_id、expected_fact、actual_fact` 四字段；规范化规则固定为缺失/null 记为 `unknown`、字符串转 Unicode NFC、去首尾空白、连续空白归一、大小写按原样保留、字段顺序按上述顺序归一；序列化使用 UTF-8 canonical JSON：四身份字段必须是 string 或 null；null 先规范化为 `unknown` 字符串；对象键按 ASCII 字典序输出；不输出多余空白；字符串转义遵循 JSON 最短形式，保留非 ASCII 字符；数字、数组和对象在这些身份字段中一律拒绝；hash 为 `gap-<sha256(serialized)>` 的完整 64 位十六进制值；collision 判定只限两种情形：①同一 gap_id 的四身份字段规范化值不一致（不同缺口被误判为同一 ID）或②发生 SHA-256 哈希冲突。任一情形成立时，当前渲染显示 `gap_projection_unavailable`、reason=invalid_gap_collision，不自动合并，也不允许任何 gap-bound confirmation 消缺，直到生产者修复。canonical payload 仅在 reason/provenance 上的差异按本节去重排序规则合并，不触发 collision。不同投影为同一 gap_id 提供多个 reason 时，每项的 producer 和 reason_text 都做 Unicode NFC、去首尾空白、连续空白归一；按 `(producer, reason_text)` 精确去重，再按 producer、reason_text 的 ASCII 字典序排序，形成 canonical provenance 列表；reason 列表不改变 gap_id，也不把任一 producer 的 reason 提升为唯一原因。若任一 gap_id 身份字段是数字、数组或对象，该缺口不得被静默丢弃：当前渲染必须显示 `gap_projection_unavailable`，保留 producer、subject_id、reason=invalid_gap_identity、owner=当前阶段主会话和修复建议；此时不生成 gap_id，也不参与确认消缺。
```

## V62-5（L478）
FND-V61-06：导航首选载体=材料内嵌导航节（D-305）+packet 派生层=临时/非权威/不持久；含 V62 阶段输入 packet 与审查 packet 边界（D-304/T-034）
```
- **FR-CONTEXT-003**：spec、plan、tasks 的输入必须以宿主组装、脱敏并冻结的 packet 交付，packet 由冻结材料正文、packet manifest、包内导航/摘要和按需详情文件组成；**本 packet 为阶段输入 packet（consumer=spec-specify/spec-plan/spec-tasks 的主会话与派发子代理），与审查 packet 边界分明：审查 packet 维持既有 file_only 冻结链、字节不减、零新文件（D-304/T-034），diagnostic-report.md、context-baseline.json 等派生文件只作为本 packet 派生层条目供阶段输入消费，不得进入审查冻结链；导航首选载体=材料内嵌导航节（D-305），packet 内导航/摘要与派生层均为可再生、非权威、随 packet 生命周期存在的临时派生，不持久、不成为第五材料、不回写材料正文**；diagnostic-report.md、context-baseline.json 等 build-plan 需要的 evidence 文件以 packet 派生层条目进入，manifest 记录其 path、source_digest、sha256、producer、consumer 和“非材料”声明；packet manifest 至少记录 task_id、stage、material_revision、snapshot_tree、每份源材料 sha256、派生文件清单、每个派生文件的 source_digest 和权威声明；packet 冻结 hash 覆盖 manifest、正文和派生层，禁止投递后与源材料漂移。`spec-specify`、`spec-plan`、`spec-tasks` 的输入契约必须改为只消费冻结 packet，禁止以“Read the current ... 全文”方式直读当前材料；`simplicity-guard` 与 `plan-eng-review` 保持 inline 声明，其声明、调用位置和失败回退必须与实际执行路径一致。包内导航/摘要是 packet 的可再生派生内容，不是第五材料；findings 处置、终检复查和调研必须派发给独立上下文，主会话只审结构化摘要；审查 packet 维持 file-only 冻结链，并在既有审查说明材料中先引导导航和摘要、再按需读取详情，不允许审查者直接读取任务目录。冻结 packet 失败恢复按阶段拆分：若组装、manifest 或冻结本身失败，owner=对应阶段主会话，consumer=当前 stage 输入消费者；触发方式为同一 task/material_revision/snapshot_tree 下由主会话重新发起 packet 组装一次；重建失败则标 unavailable，并记录真实原因、owner、next_action=修复 packet 组装环境或输入绑定后重新发起当前 stage；主会话不得读取任务目录，也不得宣称 packet 可回退。若冻结已成功但派发或摘要回传失败，可按既有通道重试一次，仍失败时标 unavailable，owner=对应阶段主会话，next_action=用户决定是否修复通道后重试；主会话只允许回退读取该已冻结 packet 的完整内容，hash 和 snapshot 不变，且不得把降级写成优化成功。packet_freeze_hash 固定使用 SHA-256；每个文件按 POSIX 相对路径排序，正文按 UTF-8 字节计算，换行统一为 LF；manifest 使用 UTF-8 canonical JSON，对象键按 ASCII 字典序、无多余空白、文件列表按路径排序；manifest 自身的 packet_freeze_hash 字段不参与其 hash 输入。
```

## V62-6（L666）
FND-V61-04/07：第 6 节依据行同步改决策锚定
```
- **依据**：D-303、D-304、D-401、D-301；执行层佐证=第一轮 spec-clarify 用户确认回执 quality/confirmations/a71319ffcd4b8e55c68c7c0089126b39392cf4917e6d9d5e67786bfaca3da2f5.json（本轮用户澄清确认，不改变决策锚定）；本节只保留事实和恢复建议，不新增状态机、attempt 重试链或 current 选择算法。
```
