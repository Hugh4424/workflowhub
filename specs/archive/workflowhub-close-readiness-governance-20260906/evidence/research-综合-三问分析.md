# 综合报告 — 三问分析（Q1 升级效果 / Q2 token 成本 / Q3 材料质量与分工思路）

> 本文件是 make-decision 新需求（R-007~R-010）的诊断交付物之一；详细取证见
> research-Q1-convergence-task-effect.md、research-Q2-cost-root-cause.md、
> research-Q3-materials-quality.md（三份子报告）。经 Talk R1-R3 用户确认，本报告中
> 的分析结论已转化为方向卡 v4.1 的 II 部分治理机制。

## 问题 1：requirement-convergence-depth 任务（make-decision 强升级）效果如何？

**结论：升级已 100% 落盘 main 且被本次执行完整使用，make-decision 收敛质量与可控性确实改善。**

| 维度 | 事实 |
|---|---|
| 实现落盘 | 8 phase + 10 项关键能力全部在 main（pair_id/role/disputed schema、isPairedMakeDecisionInput 红蓝配对、debate 技能、deep-research 技能、M/S/B/P 执行模型、决策链提醒、AGENTS.md 只跑受影响测试、check-skill-closure、mailbox 契约）；实现=单 snapshot（64 文件+7153/-150，过程折叠） |
| 真实使用 | 本任务 make-decision：方向审查红蓝配对完整（pair_status=complete，6/6 provider）→ 23 findings；细节审查 39 findings（pair partial 6/10）；四队辩论 round-1（10 文件+裁决书）；三轮 Talk 12 项结构化问答；调研子代理落盘 |
| 质量指标 | 方向卡 6.9KB（可读）；62 findings 全部处置；方向语义 step 10 前锁定；用户"make-decision 还算可控"体感成立 |
| 残余问题 | ①红蓝双发放大 provider 不可用（细节审查 4/10 失败，grok/pi source_id=null）；②审查选中 flash/编码档模型而非高智力 tier（tier[0] 存在但未强制）；③实施过程单 snapshot 不可追溯；④已知 CLI 组合 bug（REVIEW_NO_SEMANTIC_RESULT 文案与实际 39 findings 矛盾） |

## 问题 2：build-spec/build-plan 为什么烧数亿 token？如何优化？

**结论：主因不是"模型笨"，是"无度量 + 材料体量×全量重读轮次 + 阶段内子代理独立上下文 + 审查材料包全量注入 + 无执行规范"。make-decision 便宜是因为材料小+有收敛环。**

**可量化结构（档案层）：**
- 系统无 token 度量（task-metrics.jsonl tokens 字段全 null；completed 调用 usage 全 null；唯一真实 usage=失败调用合计≈145 万 token，单次最大 53.4 万）——"几亿"来自 CLI/Web 侧统计，档案层无法证实/证伪
- 材料体量：WH 任务 587KB（decision-log 119K/plan 109K/spec 86K/tasks 273K）；T12 121KB+research 203KB
- 审查材料包：build-plan 单轮 282,170 字符 ×5 provider ×2 轮；build-spec 119,325×3
- 主会话重读：T12 tasks.md 全篇修订 5 次/spec 3 次（每次修订前后全量重读）
- 审查失败空转：单次 grok 失败烧 53.4 万 token（完成率 40-75%）

**五大根因：** ①无度量 ②主会话（工头）仍全量读（M/S/B/P 只覆盖了 make-decision）③审查材料包全量自包含（但审查者按清单读，读多少取决于引导）④findings 处置/终检在 M 上下文 ⑤模板口径不统一致返工。

**优化（已收敛，方向卡 v4.1 II-3）：**
1. 全阶段 Execution model 移植（make-decision 上下文守恒 6 条：全量落盘/主会话只留 ref+sha256+摘要≤500字/S 回传≤500字/并行上限/交互独占/每步依赖上一步摘要）
2. 材料输入契约改"收冻结 packet"（对齐 spec-research；宿主侧组装→脱敏冻结→按需读）
3. 材料导航节（材料文件头部内嵌节清单+摘要+读取时机；锚点读法；起草即生成）
4. 子代理派发扩展（findings 处置/终检/调研子代理化，主会话只审摘要）
5. 审查材料包内容分层（投递链保持 file_only 冻结链；包内导航+摘要+按需）
6. 模板口径单源 + 审查可靠性（OPEN-004 配置修复）

## 问题 3：高智力设计+低智力执行思路效果如何？（用户澄清后=四材料质量审计）

**结论：思路方向正确（需求前锁+设计高投入+执行可验证），但"分工"只是人肉习惯（零记录零约束，有反例）；真正决定 verify 洪流的是——①材料质量缺口（模板/校验器错位、拒绝条件无表达位、verify 不验材料）②verify 独立性≈0。四材料体系保障度=中。**

**材料质量审计（四维度）：**
| 维度 | 评分 | 依据 |
|---|---|---|
| 无歧义性 | 中高 | 模板+校验器强，但"拒绝条件"类 AC 无表达位 |
| 可执行粒度 | 高 | plan 13 节+tasks 字段化+RED/GREEN 同命令同 oracle 互反（校验器强制） |
| 可验证性 | 中 | AC 四段式有要求但校验器只验"场景≥8字符+一个验证标签"；通过/失败/证据三段零校验 |
| 边界完整 | 中 | 失败分支表方向级有；任务卡级"拒绝条件"未法定化 |

**三大缺口（已转化为 II-1/II-2 治理）：**
1. 模板/校验器标签错位（bold `**验证方法**：` vs plain `验证：`——按模板生成会被判"缺 oracle"，历史上靠脚本"绕过"；104 个 bold AC 存量）
2. 拒绝条件类 AC 无表达位（"身份不符必须拒绝/收据不绑快照=不通过/findings:[] 无 provenance 不算通过"无法写入 oracle）
3. verify 不验材料完整性（verify-code step1 明文不验；三任务 verify.json 全 unknown+零 digest）+ 独立审查执行率≈0

**模型分工事实（背景）**：task.json 无模型字段；反例=convergence build-code 用 gpt-5.6-luna、m17 五阶段同 host；审查 tier 存在但实际选中 flash/编码档；"高智力前三/低智力后二"无法从档案层证实——用户澄清此点非需求，仅作背景事实。

## 已转化的治理动作（方向卡 v4.1）

- **II-1 材料质量升级**：四段式全部 AC 强制+oracle 结构化 {pass,reject}+校验器同步+verify 入口 4 项轻量校验（非 gate）
- **II-2 verify 独立性**：发起异源独立审查请求+三态事实记录（非条件/非 gate；异源=身份链判定）
- **II-3 全阶段上下文管理**：Execution model 移植+冻结 packet 契约+材料导航节+派发扩展+审查包内容分层
- **I 部分收口治理（v3）不变**：A+B 预检链 9 字段、D 唯一缺口源、E 边界校验、F 六状态分层、C/G 并入

## 交付物清单（本任务）

| 文件 | 内容 |
|---|---|
| evidence/research-Q1-convergence-task-effect.md | 问题 1 取证（子代理 0b2049cb + 本任务证据） |
| evidence/research-Q2-cost-root-cause.md | 问题 2 取证（子代理 b12b32f9 + 材料实测） |
| evidence/research-Q3-materials-quality.md | 问题 3 审计（子代理 a4d19fdd + f2368ca8） |
| evidence/direction-review/direction-card.md | 方向卡 v4.1（I+II 全量语义） |
| evidence/direction-review/result-v4.json | 方向红蓝审查 25 findings |
| evidence/detail-review/result-v4.json | 细节红蓝审查 findings（进行中） |
| evidence/debate/round-2/ | 案卷/4 立场/4 质询/裁决书 |

## 数据边界声明（诚实标注）

- "几亿 token"无法从任务档案层证实/证伪（无度量）；可量化的下界=审查材料包 28.2 万字符×5×2 轮+材料 587KB×重读 8-15 轮+失败空转 145 万——档案层口径 1000 万-3000 万 token 级；"亿"级需叠加 CLI/Web 会话全量，数量级结构一致。
- 模型分工无存储级证据；"高智力/低智力"为用户习惯性配置，非机制事实。
- verify 洪流与"材料不足"无直接证据链（verify.json 零 digest）；可证关联=协议/绑定错误风暴（verify-close 任务：绑定类≥5、SCHEMA_VALIDATION_FAILED≥5、单任务重跑 31）+gate_cmd 不可执行（3×exit 127）。
