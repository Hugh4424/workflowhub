# 原 canonical findings 当前证据核销（事实，非 review-pass）

## 边界、时间与来源

- task：workflowhub-close-readiness-governance-20260906。
- 认证 worktree：/Users/Hugh/Hugh/Project/workflowhub-workflowhub-close-readiness-governance-20260906（pwd 实测）。
- 真实开始时间（UTC）：2026-09-06T14:38:55Z。
- 证据核对结束时间（UTC）：2026-09-06T14:41:30Z；下文为该时点事实整理，不冒充 provider 审查耗时。
- 仅读取原审查、当前 spec 全文（1260 行）、decision-log 全文（1118 行）及限定关联证据。没有发起 provider review、没有新增审查轮次、没有改四材料、没有运行测试或修改原 disposition。仅新建本报告；创建前以 test ! -e 确认本路径不存在（exit 0）。原工作区已有修改与未跟踪产物，不属于本次操作。
- S=当前 spec.md，D=当前 decision-log.md，均相对本任务 specs 目录；表内当前行号不是原审查切片行号。
- 外置审查来源根：/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-close-readiness-governance-20260906/quality/reviews/results/。
  - A：build-spec-simple-b00f40e0-b171-4bbe-bb88-aaa66c4ca0b2.json（4 canonical findings）。
  - B：build-spec-simple-0364b1a2-cc55-4911-bfc2-41aee42609cf.json（9 canonical findings）。
  - C：build-spec-simple-7bb88438-7f3a-4f67-85f2-9ddd524a0a49.json（6 canonical findings）。
- 三份 JSON 为单行文件；已解码顶层 findings 与 provider_results，按原 canonical ID 逐条保留。provider_results 的同一原始观察不重复计数。F=antigravity/flash，L=codex/luna。
- verified_fixed 仅表示原规格缺陷在当前文本有充分修复证据，不表示运行实现/测试完成；unresolved 包含局部已修但关键证据仍不足；复合 finding 只有部分论断被反证不整体 rejected。

## 逐 canonical finding 核销

| 原来源 / 原 ID / provider | status | 当前行号 / 决策对照 | 理由 |
| --- | --- | --- | --- |
| A / F-091d5f5eefca / L | verified_fixed | S380–386、884–886；D240 | collision 明确仅限四身份字段规范化值不一致或 SHA-256 碰撞；reason/provenance 差异明确合并不触发 collision，并按 producer/reason_text 去重排序。AC 要求跨 producer 不同 reason 同 ID，原身份/provenance 混比问题有实质修复。其他算法不足分别保留在原 C/B finding 下。 |
| A / F-1d77de235e30 / F | verified_fixed | S91、171、434、957–964、1240；D364、373、707 | 范围、场景和回归原三个残留均改成 RED 配对强制；FR/AC 给出 RED && paired_task≠N/A，GREEN 只要求 pairing/pass 并明确不因缺 reject 失败。不是仅检索 marker；逐处与 D-302/T-032 正文对照。D1011 仍有历史 RED/GREEN 旧表述，但 D373 明确作废 GREEN 强制，不能把历史残留反向作为当前 spec 要求。 |
| A / F-8c3ab4fddcec / L | unresolved | S49、354–356、671–680、847–854、1222–1225；D344、444、466、486、908–916 | D-301/D-306 支持每 phase 独立验收，但不足以独立证明新增四值用户确认事实、绑定字段及恢复/授权规则全部已冻结。S49 明言这些澄清不修改冻结 decision-log，S676 写依赖下一步未授权。真实 a71319ff 只证明 build-spec 澄清，不能代替 D-501/D-502 所要求的方向增补绑定。新增语义是否仅属转译需用户决策，不能由本报告宣布 fixed。 |
| A / F-91dc4b458d3d / L | unresolved | S478–479、730–731、1023–1030；D404、709 | S478 已区分 stage/review packet 并禁止派生文件进入 review 链；但 S730 仍登记 diagnostic/evidence 条目 consumer=build-plan/审查者，S731 混列阶段与审查 manifest/hash，AC-CONTEXT-003 仍将 stage/审查者并入统一分层要求。禁止加入审查链与审查者消费派生条目没有一致验收边界，原混淆未充分清除。 |
| B / F-3d96190488d3 / L | unresolved | S91、380、1240；证据 v62-machine-verification.txt L1–12、v63-machine-verification.txt L1–15；D404、709 | 原 B 输入 draft_spec 实为 34 行/3500 字符切片，C 为 39 行/5961 字符；v62 工件只有“残留-1/2/3 zero-match”等标签，未给实际 regex、命令、输入 digest。v63 亦只是勾选。当前全文可核对原语义已部分修复，但不倒改原提交证据不足这一实际缺陷，且本次不提交新 provider 包。因此不能一概 invalid，也不能因本地全文存在宣布原审查提交链已补齐。 |
| B / F-5bb3ff5b0b2f / L | unresolved | S354–356、1222–1224；D344、444、466、486、914–916；a71319ff 回执 L3–11 | a71319ff 真实存在，stage=build-spec、step_slug=spec-clarify、decision=accepted，含阶段验收引文；但它绑定 revision-ef0f6e…/snapshot a8c804…，不是 D 第二轮 revision-e9bc49bc/snapshot e94e3cee 的增量 D/approval_binding。当前依据仍有未冻结语义争点，原“不在批准决策中”的核心尚未充分修复。 |
| B / F-61267e2ac7f1 / F | verified_fixed | S478、1028；D412 | 原切片 source 截断是实际提交缺陷而非无效 finding；当前完整条文已闭合为 source_digest 和权威声明，并列 path、source_digest、sha256、producer、consumer、非材料声明。这里只核销缺字段/截断这个窄问题，不把 packet 全域判通过。 |
| B / F-a9578dbda072 / L | unresolved | S472–479、729–731、1012–1028；D404、424 | 内嵌导航、临时派生、owner/恢复及 manifest 末尾已补；但 S730 的派生 evidence consumer 仍含审查者且随任务归档，S478 又称 packet 派生层不持久且禁止进入审查链；原关于 carrier/lifecycle/consumer 的复合缺陷没有全篇一致的修复证据。原切片不足不得用 invalid 抹去。 |
| B / F-b5530d86b004 / L | verified_fixed | S91、428、434、950–964；D364、373 | 全部 AC 四段非空已明确；machine-testable RED && paired_task≠N/A 谓词及 GREEN 例外均在 FR/AC 写实。与 F-d3dc1a1d78cb 同主题但本条额外覆盖精确谓词，保留两个来源。 |
| B / F-c997a3cf7827 / L | unresolved | S380、884–888；D240 | subject_id 已说明为绑定 task_id 与当前材料身份，四字段顺序也已修；但没有定义该组合身份 string 的唯一构造/分隔规则，algorithm_version 的固定值/类型/明确数组位置未钉死，D205 明确交 build-spec 落盘的固定向量未找到。原要求的完整冻结身份算法仍不能由独立实现唯一复现。 |
| B / F-d3dc1a1d78cb / F | verified_fixed | S91、428、950–952；D364 | “对适用 AC”弱化已改为全部 AC 强制且四段非空，FR/AC 无此例外。与 F-b5530d86b004 并列保留双源，不因主题去重丢掉原 ID。 |
| B / F-deddf4298265 / F | unresolved | S354、666、1222–1224；D344、444、466、486、914–916；a71319ff 回执 L1–12 | “回执不存在/引文虚构”子断言有反证：回执确实存在且 L10 有相应引文；不能继续称虚构。但“未进入冻结决策”的另一核心成立，降为执行佐证并不补增量决策链，故复合原 ID 不整体 rejected_with_evidence、不判 fixed。 |
| B / F-fbc3ff3dab3e / F | verified_fixed | S136、450、661、984、1240；D384、506、1037 | 原第四聚合态取消已取消：cancelled 只保留成员原始状态，review_result 仅 executed/failed/unavailable。回归中的成员取消场景不是第四聚合值，当前文字明确分层。映射确定性另按 C 原 ID 核对。 |
| C / F-12dd4d98878f / L | unresolved | S478、1028；D404、412 | 已新增 canonical JSON({manifest_minus_hash,file_entries}) 和路径排序/hash 排除自身，比原拼接描述更具体；但 file entry 写成 {path, sha256(…)} 未给第二字段确切 key，canonical JSON 的外层/字符串转义等字节规则未完整固定；没有实际 manifest/file bytes→preimage→固定期望 digest 向量。只写“固定 hash 测试样例由本规格验收夹具落盘”不是已经落盘，v63 L11 勾选不构成证明。 |
| C / F-4eac5d133077 / F | unresolved | S380、885；D240 | subject_id 已前移且说明数组保序、对象键排序只用于独立对象；但 algorithm_version 仅有字段名，没有固定值、类型与无歧义数组布局，AC885 仍说“只用四身份字段”未对应版本输入。固定向量未落盘证据见下；原确定性契约未充分完成。 |
| C / F-621ab6f5798d / L | unresolved | S466、478、1006–1007、1028；D404、1014 | S478 尾部已禁止恢复回灌主会话，要求独立上下文恢复；但 FR-CONTEXT-001 S466 仍明确唯一例外可完整读取一次，AC-CONTEXT-001 S1006 同样把这一例外列通过条件。不是 marker 缺失而是同一 spec 仍有直接矛盾，原问题未消除。 |
| C / F-8ab46cc38cc1 / L | verified_fixed | S380、603–604；D240 | 正常 canonical 缺口展示记录现明确必含 owner=产生缺口的当前阶段主会话，作为修复责任路由方，不入 hash，绑 snapshot/material 与来源；不是只在非法身份分支有 owner，满足原窄缺陷。 |
| C / F-938343c41c9f / L | verified_fixed | S472–478、1012–1019；D404、412 | 规范已要求适用材料头部节清单、一句摘要、读取时机，起草生成、定稿更新；S478 又规定结构校验器检查存在性，AC 检查头部与变更更新。当前 spec 有 L10–24 导航。该条核销规范可测试性，不宣称实现 validator 或后续 plan/tasks 已测试通过。历史冻结 decision-log 只读豁免明确写出。 |
| C / F-996765cb7038 / L | verified_fixed | S136、450、984、1240；D384、506、1042 | S136 已给互斥谓词：成员有已发起 attempt（括注明确 provider 已执行）→failed；无 attempt（未发起/通道不可用）→unavailable，且不能 executed；两分支指定进入 AC-REVIEW 回归夹具，AC984 消费此规则。按原“映射留给实现任选”的规格缺陷已修。此结论不证明夹具已运行，也不把仅有预分配 attempt ID 当已执行证据。 |

## 重点证据与限度

### 固定向量不是“有 marker 即落盘”

已对当前任务 specs 目录限定搜索 algorithm_version、test.vector、固定.*样例、固定.*向量、packet_freeze_hash（md/json/txt），并列出 build-spec-review 目录现有文件。命中的是规范承诺、原审查材料与勾选工件；没有找到本任务绑定的输入、规范化预像字节及完整预期 hash 的固定向量。S380/S478 没有向量路径，D240 明文由 build-spec 落盘，而非笼统延期 build-plan。本结论是“限定证据面未找到/当前无可引用落盘证据”，不是声称整个磁盘不可能存在文件。

### 原输入切片与机器验证声明

解码本地原输入副本 materials：v6 draft_spec=1260 行/100651 字符；v61=34 行/3500 字符；v62=39 行/5961 字符。后两者 materials 只有 raw_requirement、approved_decision、draft_spec，没有将所引用 v62-machine-verification.txt 作为独立材料提交。不得以当前全文可读、或原审查者未看到全文，否定原提交缺陷。

本次对完整 S 运行只读 Python 字面检索（每项 s.count(pattern)），以下五个实际 pattern 均 count=0：

1. RED/GREEN 且有配对的行为验证需要非空 reject
2. RED/GREEN 配对行为的 oracle 同时有可通过和可拒绝断言
3. RED/GREEN 缺 reject
4. 对适用 AC 强制
5. 不同 canonical payload

这些零命中只佐证精确旧句消失，不证明语义全清；例如恢复规则反例仍在 S466/S1006。没有执行或复述旧工件的 validator PASS 为本次结果。

### 当前字节指纹

只读 SHA-256（用于限定本次观察版本，不是冻结/批准操作）：

- spec.md：187796 bytes，edf3835cd79b7d473a77714e06d763040010fab5a3b46ad7d362a0aa455453fa。
- decision-log.md：158178 bytes，a099877b618083252f510c7a2de56e9824d25f72ad6031a26bb037a4d5f68c08。
- plan.md：39796 bytes，b9822449a9f5a13d89e5b5472eac2b87d88dfb6adf7def770c128410c2dccbe4。
- tasks.md：47186 bytes，843e142b91e59bcf2956ee1e9b5485f0ddd181f713bceae431259a91a4c5d563。

plan/tasks 仅采字节指纹，不将其视为本次全文核销对象。

## 统计与双源保留

- 原 canonical 记录：A 4 + B 9 + C 6 = **19**（互异原 ID 19）。
- verified_fixed：**9**；unresolved：**10**；rejected_with_evidence：**0**。
- 来源分别：A=2 fixed/2 unresolved；B=4 fixed/5 unresolved；C=3 fixed/3 unresolved。
- 主题压缩可记 14 组，但不能替代 19 条台账：phase 组保留 A F-8c3ab4fddcec + B F-5bb3ff5b0b2f（L）+ B F-deddf4298265（F）；packet 生命周期边界组保留 A F-91dc4b458d3d + B F-a9578dbda072；AC 强制组保留 B F-b5530d86b004（L）+ F-d3dc1a1d78cb（F）；gap 身份算法组保留 B F-c997a3cf7827（L）+ C F-4eac5d133077（F）；其余 10 条各一组。组内范围并非完全相同，不能丢掉各自额外要求或 provider provenance。
- a71319ff “不存在/虚构”的子断言被反证，不额外增删 canonical 条目，也不据此覆盖同条未解决的冻结依据问题。

## 必须由用户决定的事项（本次未代决策）

1. phase 四值确认及恢复/授权规则是否认定为既有逐 phase 验收的合法转译，还是要按 D-501/D-502 作增量决策，或删回仅已冻结语义？现有回执存在不等于此问题已获绑定裁决。
2. 原切片提交缺陷与剩余规格证据缺口，是否授权后续只修材料/补确定性向量与可复现证据，或明确接受哪些剩余风险？本次没有此修改权限，也不自动延长审查预算。
3. 如有人拟保留主会话完整 packet 回读例外、或允许派生 evidence 进入审查链，这不是本次可凭经验选择的修复；需明确用户授权并对齐 D-304/T-034。否则只能指出当前矛盾，不宣布规则已统一。

本报告是限定证据核销事实，不是 review-pass、阶段完成、质量通过、进入下一阶段或风险接收的许可。
