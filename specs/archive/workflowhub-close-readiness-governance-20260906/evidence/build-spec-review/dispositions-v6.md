# build-spec 审查处置记录 v6（III-2 分类路由执行）

预算执行（D-504/T-033）：初始 v6（4 findings）→ 修复 → focused v61（8 findings）→ 修复 → 窄域核销 v62（6 findings）→ 修复+机器验证。provider 可用性：kimi 三轮均进程退出、grok 三轮均身份未绑定（OPEN-004）=attempt 层 unavailable 如实记录；antigravity+codex 双异源完成三轮。

| finding_id | severity | provider | 分类 | 影响维度 | 证据 | status | next_action | evidence_ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FND-V6-01 | major | antigravity | implementation_defect | 无（材料质量口径细节） | D-302 v4.3/T-032 冻结文本；spec L91/L171/L1240 残留旧 GREEN 强制 | fixed | spec 三处改 RED-only | result-v6.json |
| FND-V6-02 | blocking | codex | spec_ambiguity→user_decided（已有绑定） | 无（验收记录语义，非目标/范围/流程变更） | 回执 a71319ff 真实存在（stage=build-spec/step=spec-clarify/reply=阶段验收只记录事实和恢复建议）+D-301 每 phase 独立验收；codex 引"恢复流程"为误引，spec 原文=恢复建议 | fixed | 决策锚点改 D-301/D-303/D-304/D-401 为主、回执降为执行层佐证 | result-v6.json |
| FND-V6-03 | major | codex | implementation_defect | 无 | D-205 v4.3（reason 排除出 gap_id；跨投影 reason 差异应合并去重排序） | fixed | collision 限定身份字段不一致或哈希冲突；reason 差异合并不触发 | result-v6.json |
| FND-V6-04 | major | codex | implementation_defect | 无 | D-304 v4.3/T-034（file_only/字节不减/零新文件） | fixed | FR-CONTEXT-003 补阶段输入 packet 与审查 packet 边界 | result-v6.json |
| FND-V61-01 | major | antigravity+codex 双源 | implementation_defect | 无 | D-302 v4.3"全部 AC 强制且四段非空"；spec L91 旧文"对适用 AC"弱化 | fixed | 改全部 AC 强制+精确谓词 verification_role=RED 且 paired_task≠N/A | result-v61.json |
| FND-V61-02 | major | antigravity | implementation_defect | 无 | D-303 三态事实模型；spec L136 已有 cancelled→failed/unavailable 映射 | fixed | 回归路径补"成员取消（映射 failed 或 unavailable）"消歧 | result-v61.json |
| FND-V61-03 | minor | antigravity | invalid_finding | — | manifest 截断=v61 变更集文档切片伪影；spec L478 原文完整（已核验） | rejected_invalid | 不改；记录审查提交物完整性教训 | result-v61.json |
| FND-V61-04/07 | blocking/major | antigravity/codex | implementation_defect | 无 | 回执 a71319ff 真实存在；antigravity 无质量目录访问权导致"不存在"误判 | fixed | 引用框架改决策锚定为主（同 FND-V6-02） | result-v61.json |
| FND-V61-05 | major | codex | implementation_defect | 无 | D-205 v4.3 冻结元组第 1 字段=task/material 身份 | fixed | subject_id 钉死为 task/material 身份字段 | result-v61.json |
| FND-V61-06 | major | codex | implementation_defect | 无 | D-305 载体=材料内嵌导航节；F-043 | fixed | 导航首选载体+派生层临时/非权威/不持久显式化 | result-v61.json |
| FND-V61-08 | major | codex | invalid_finding（流程项） | — | 指控针对审查提交物而非 spec 内容；机器验证工件已补 | rejected_invalid | v62-machine-verification.txt 落盘为证 | result-v61.json |
| FND-V62-01 | major | antigravity | implementation_defect | 无 | D-205 v4.3 冻结字段序（第 1 字段 task/material 身份）+算法版本号 | fixed | 字段序改 subject_id 首位+algorithm_version+保序元组数组 | result-v62.json |
| FND-V62-02 | major | codex | implementation_defect | 无 | D-304 未冻结 framing 细节=spec 转译职责 | fixed | packet_freeze_hash preimage 确定性构造+固定测试样例归夹具 | result-v62.json |
| FND-V62-03 | major | codex | implementation_defect | 无 | D-304 上下文守恒（主会话只留 ref+hash+摘要≤500 字） | fixed | 恢复路径禁回灌主会话、派独立上下文 | result-v62.json |
| FND-V62-04 | major | codex | implementation_defect | 无 | D-304/D-305 内嵌导航节 | fixed | 导航节强制结构（节清单/一句话摘要/读取时机/生成更新时点）+校验器存在性检查 | result-v62.json |
| FND-V62-05 | major | codex | implementation_defect | 无 | D-205"派生缺口记录绑 snapshot/material、带来源与 owner" | fixed | canonical 展示记录必含 owner（不进哈希） | result-v62.json |
| FND-V62-06 | major | codex | implementation_defect | 无 | D-303 三态；spec L136 已有谓词散文 | fixed | 成员 cancelled 映射谓词形式化（attempt 有无→failed/unavailable）+AC-REVIEW 回归 | result-v62.json |

收敛声明：18 条 findings 全部处置（fixed=15、rejected_invalid=2、user_decided 经既有绑定=1 计入 fixed）；零 direction_change、零 needs_human；四 validator PASS；机器验证工件 v62/v63-machine-verification.txt。
