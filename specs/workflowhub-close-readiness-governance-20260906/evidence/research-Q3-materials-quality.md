# 分析：问题 3 — 四材料质量对"低智力模型执行"的支撑度评估

> 主会话分析；2026-09-06。**用户澄清**（Talk R1/Q4）：问题 3 的真实含义=审计
> decision-log/spec/plan/tasks 是否足够清晰、专业、详细，足以让 build-code/verify-code
> 使用低智力模型也能保证交付质量；不是记录/建议各 stage 的模型使用。
> 本文件把模型分工背景事实保留在附录（附 A），主体重做材料质量审计。

## 一、审查框架（质量维度 × 低智力执行需求）

低智力模型在 build-code/verify-code 中"保证交付质量"需要的材料特征：
1. **无歧义性**：需求/规格表述到"if-then 可判"（不需要智力推理就能判定是否符合）
2. **可执行粒度**：任务卡的 gate_cmd/oracle/expected_exit/evidence_path 可直接运行验证
3. **可验证性**：AC 带"验证：/通过：/失败：/证据："四段式；关键断言可机读
4. **边界完整**：失败分支/非目标/风险/延期有明确下一步（低智力模型不做"推理兜底"）
5. **可追溯性**：需求→决策→FR/AC→任务卡→验证命令五层闭合（改一处知道要动哪些）

## 二、现有材料体系的保障机制（模板层+校验器层）

### 2.1 模板层（把"免思考"编码进结构）

| 材料 | 模板关键机制 | 对低智力执行的作用 |
|---|---|---|
| decision-log | decision-entry.v1 字段链（question/recommendation/decision/reason/consequences/rejected_alternatives/unresolved_items） | 方向决策成为"可引用的单行事实"，执行者无需重推 |
| spec | AC 块要求 `验证：/通过：/失败：/证据：` 四段式（plain 行首标签，validator 要求） | AC 从"描述"变"判据"；低智力模型按判据跑即可 |
| plan | plan-task.v4 13 节（Quick Read/Code Anchors/File Boundary [NEW/MODIFY/DO NOT TOUCH 精确路径]/Technical Decisions/Test Strategy RED-GREEN/Rollback/Implementation Order/Dependencies/Constitution Check） | 文件边界精确到路径（禁通配符）→ 执行时"照 file 清单改"；RED/GREEN 先验可证伪 |
| tasks | 任务卡字段 v3/v4：ID/Phase/goal/精确文件/boundary/verification_role/paired_task/gate_cmd/expected_exit/oracle/evidence_path/STOP/recovery/task risk | 每卡自带"如何算通过"；paired_task 保证行为变更有成对验证；STOP/recovery 定义卡住时怎么办 |

### 2.2 校验器层（材料不达标将在输入时被拒）

`runtime/stage/stage-content-contracts.mjs`：
- `validateAcceptanceDesignMinimum`（L2934）：每个 AC 块必须含**可观察场景**（≥8 字符）+ **oracle/验证规则**（验证|验收|判定|oracle|verification|assertion|test oracle 前缀）
- `validateSpecContentProfile`（L2865）：spec 内容轮廓
- `validateSpecFailureConditions`（L4153）：失败条件显式声明
- `validateRequirementCoverage`（L1941）：需求覆盖
- `validateStageMaterialContracts`（L4446）+ plan 章节别名映射（13 节）+ TASK_FIELDS_V3/V4 字段枚举 + paired_task 互反校验（L5059-5062）+ RED 先于 GREEN + gate_cmd/oracle 必备
- `validateSpecClarifyAndDirectionFidelity`（L2566）：spec 与 decision-log 方向保真（不靠 build-spec 补需求）

**→ 体系本身是"低智力可执行"导向的**：字段化 + 机读校验 + 先验 oracle，比"让高智力模型现场推理"更便宜。

## 三、缺口审计（模板有了，为什么还会 verify 洪流？）

### 3.1 历史验证（归档任务材料实际达标度）

| 任务（archive） | spec 验证:行 | tasks gate_cmd/oracle | 结果参考 |
|---|---|---|---|
| m17-repo-skills-multicli-20260903 | 12 | 23/30 | 该任务的 verify/close 阶段问题洪流（R-001 引例） |
| verify-close-protocol-robustness-20260902 | **0** | 21/16 | close 协议类任务，spec 层无 oracle |

**事实**：m17/verify-close 的材料**并非缺字段**（tasks 有 gate_cmd/oracle），它们仍然在 verify 堆积
问题——说明缺陷不在"模板没有要求"，而在**特定类别的 AC 无法用现有模板表达为可验证判据**。

### 3.2 本任务 F 表揭示的三类"模板表达不了"的缺口（正是模板盲区）

| 缺口类别 | 实例（本任务核查事实） | 现有模板为何没兜住 |
|---|---|---|
| **防御性内部契约** | bridge 入口无 `attempt_id===agent_run_id` 校验（F-020/F-021）；测试收据不绑当前 snapshot/material（F-020）；alias 固化（F-018/F-019） | plan/tasks 的 oracle 只测"功能结果"（如"检查函数返回"），不测"防误用契约"（如"写入请求身份不符时必须拒绝"）——模板没有"拒绝条件"专用字段 |
| **负向/异常断言** | findings:[] 无 provenance 不算通过（F-015 T09）；unavailable 不得改写为 empty findings（失败分支表） | AC 四段式的"失败："段通常写"业务失败"，不写"证据不合法也视为失败"；oracle 大多只覆盖正向路径 |
| **跨材料状态一致性** | 完成/质量两套判定派生源未共享（F-017）；确认断裂=已确认事实仍被报缺失（F-013） | 校验器查"单材料内部一致性"，不查"跨材料语义一致性"（如 completes 事实与 quality 决议不同源） |

### 3.3 子代理审计 D（a4d19fdd）的关键发现（修正/细化）

**发现 1：模板与校验器标签错位（比"无表达位"更精确）**
- spec-specify 模板的 AC 卡用 `**验证方法**：`（bold 形式），而
  `validateAcceptanceDesignMinimum` 只认 plain 行首 `验证：|验收：|判定：|oracle：` 等
  （mjs L2948 正则）——**按模板生成的 spec 会被判"缺 oracle 规则"**。
- 历史上 WH 任务用脚本给 28 个 AC 补 plain 标签行"绕过"（而不是修正模板）——错位真实存在。
- `通过：/失败：/证据：` 三段**零校验覆盖**（校验器只查"≥8 字符场景 + 一个验证类标签"）。

**发现 2："材料不足→verify 失败"无直接证据链**
- 三个历史任务 verify.json 全部 status=unknown + material_digest 全零；
  verify-code steps.json step1 明文"不在本阶段重新验证材料完整性"。
- 真实可证关联 = **协议/绑定错误风暴**（verify-close-protocol-robustness 任务因此而生：
  其 decision-log 记录绑定类错误≥5 次、SCHEMA_VALIDATION_FAILED≥5 次、单任务 build-code
  重跑 31 次）+ **gate_cmd 不可执行**（m17 build-code 3×exit 127=npm test 缺失）。

**发现 3：AC 格式三任务三套写法**（m17=indent 验证行/verify-close=0/exec-efficiency=7），
无统一规格；模板仅提示不强制。

### 3.4 verify 阶段独立性缺失（最薄弱一环）

- convergence 任务 verify-code：**0 provider 审查执行**（unavailable，无 completed build-code outcome 链）；
  m17 verify-code 1 次 dsh-code-review completed；simplicity 2/2。
- 即：verify 阶段绝大多数任务没有独立审查——低智力执行模型的"自查证据"就是唯一质量来源。
  若自查（正方向）与规格（防误用）不同向，问题洪流必然出现。

## 四、评分与缺口（供给 Talk 收敛）

| 维度 | 评分 | 依据 |
|---|---|---|
| 无歧义性 | 中高 | 模板+校验器强，但"防御契约/负向断言"类 AC 无表达位 |
| 可执行粒度 | 高 | plan 13 节+tasks 字段化+gate_cmd/oracle；历史任务已达标（m17 23/30） |
| 可验证性 | 中 | AC 四段式已强制，但 oracle 正向为主；"证据不合法=失败"未成文 |
| 边界完整 | 中 | 失败分支表存在（本任务方向级），未模板化为任务卡级"拒绝条件" |
| 可追溯性 | 高 | traceability 校验（FR→AC→Step）真实运行 |

**最大缺口 3 个**：
1. **"拒绝条件"类验收无模板表达位**（内部协议类 AC：身份不符拒绝、收据不绑快照拒绝、无 provenance 不算通过）——需要 spec/plan/tasks 增加"负向 oracle"先验要求（本任务 D 系列已有 9 字段合同概念，可推广为通用机制）
2. **verify 独立性不足**（verify-code 审查执行率≈0）——低智力自查无法成为质量唯一来源
3. **材料增量维护缺"差异级"复核**（问题 2：全量重读轮次多导致"改一处漏核查他处"）→ 与 OPT-A/B 相关

## 附 A：模型分工背景事实（用户澄清后仅作背景）

- task.json 无模型字段；出现的模型名全是审查者身份；反例：convergence build-code=codex/luna(gpt-5.6-luna)、m17 五阶段同 host=codex。
- 唯一"分工"文本=make-decision SKILL L279-302 M/S/B/P（执行角色分工，仅 make-decision）。
- 审查 tier[0]（opus/pax3.8/luna）存在但实际选中 kimi/coding、antigravity/flash；失败模式=source_id=null（OPEN-004）+ 输出契约问题。
- 结论（背景）：分工目前是人肉习惯、零记录零约束；但按用户澄清，非本次需求范围，仅作背景事实存档。
