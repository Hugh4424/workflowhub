---
task_id: m13b-build-spec-deepening
milestone: M13b
stage: build-spec
source_decision_log: tasks/m13b-build-spec-deepening/decision-log.md
status: draft
spec_version: 1.0.0
---

# 功能规格：build-spec 质量事实契约深化（M13b）

> 基于 decision-log.md（m13b-build-spec-deepening，D1-D8，user_decision:true，S9='A' 已批准）。
> 本文件不可覆盖项目级规则。CONSTITUTION.md 优先。

**功能名**: `m13b-build-spec-deepening`
**来源**: decision-log.md M13b（make-decision stage，execution_id: 1DCFFB01-3F60-426B-A232-5F71CC31852C）
**状态**: 草稿

---

## 速读卡（30 秒看懂这个需求）

**一句话需求**：在 `workflows/build-spec/SKILL.md`（当前 M11 v1）里加入一套薄"质量事实契约"能力——build-spec 每次运行后必须产出 5 项质量事实（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads），所有检查均为记录+浮现，无任何阻断门。

**核心改动点**：

- `workflows/build-spec/SKILL.md` 新增质量事实契约（5 项）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review 独立审查、行为验证、摩擦捕获、TASK_TRACKING_ROOT 全局约定、FR-{DOMAIN}-NNN 编号规范、AC 计数文件、artifact-first 交互规范。
- 所有新机制均为"记录事实 + 浮现 + 人判断"，零阻断。
- TASK_TRACKING_ROOT 环境变量全局落地，所有 stage 按统一约定读取。

---

## 1. 问题陈述

build-spec M11 v1 缺少：

1. 范围分档（无 spec-ladder，容易过度工程）
2. spec 自检（无 7 条自检 + Spec-Purity grep，spec 纯度无法浮现）
3. spec↔decision-log 对齐（spec 偏离决策无感知）
4. 独立审查视角（无异源审查，自审自判风险）
5. 跨阶段任务跟踪（TASK_TRACKING_ROOT 未落地，执行记录不留存）
6. 交互规范（没有统一大白话+选项+进度报告规范）
7. 质量事实契约（无结构化 5 项质量事实产出）

---

## 2. 背景、目标与边界

### 背景

- workflowhub 以 CONSTITUTION.md 为最高规范，F4/F5/F7/F10 明确禁止阻断式质量门。
- 当前 build-spec 产出 spec.md + checklist，但没有系统化的质量事实浮现机制。
- agenthub design 阶段有丰富质量保障体系，但其阻断门机制与 CONSTITUTION 冲突，须按"最小实现+记事实"原则移植。

### 目标

以最小改动让 build-spec 产出 5 项质量事实契约，覆盖 spec 构建本体 + 自检 + 独立审查 + 已知风险 + handoff 交接。

### 边界（scope）

**IN（必须实现）**：

- 质量事实契约 5 项定义 + 最小实现机制
- spec-ladder（A/B/C 档）反过度工程判断
- spec 三层小节结构（速读卡 / 正文 / 附录）
- 7 条自检 + Spec-Purity grep（非阻断，记事实）
- 异源 3rd-review 独立审查（复用现有基础设施，单一异源引擎，非阻断）
- 行为验证要求（Given/When/Then 格式 FR 场景）
- 摩擦捕获（capture-workflow-feedback 精神，记录摩擦点）
- `--task-dir` 命令定位规范
- Known Gaps 段
- handoff required_reads（作为契约第 5 项）
- scope-triage 高危词浮现（浮现+建议，非强制门）
- spec↔decision-log 一致性检查（非阻断，记差异）
- FR-{DOMAIN}-NNN 编号格式（全局统一）
- AC 条数计数存文件 `spec-acceptance-count.json`
- artifact-first：长报告只存路径，交互传路径不传全文
- TASK_TRACKING_ROOT：新增全局环境变量 + 所有 stage 读取约定（任务跟踪文件不存 repo，默认 Knowledge 目录）
- REQ-COMM-01：交互用大白话+给选项说后果
- REQ-COMM-02：勤报进度（做了啥/下一步/需要你啥）

**OUT（明确不做）**：

- agenthub 3 道阻断门（退出门/审查门/推进门）
- TodoWrite 待办模板仪式
- [DECOMP] 遥测
- 门绑定自动写
- Exit Conditions 重复行
- 3 source_family 多重审查（过度工程，单一异源即可）
- 5 框架外部调研（cursor/ECC/compound-engineering/skills/superpowers，单列任务）
- 任何阻断式 gate

---

## 3. 用户场景与用例

> 角色「编排者」= 驱动 workflowhub 任务流程的人或主 AI；「执行代理」= 被派去执行 build-spec 的助手。

### 场景 3.1：编排者走完整 build-spec 流程（正常路径，含质量事实契约）

- **操作步骤**：编排者传入 task-id + decision-log 路径，调起 build-spec；执行代理读 decision-log，产出 spec 初稿，运行 spec-ladder 判断档位，执行 7 条自检 + Spec-Purity grep，运行异源 3rd-review 独立审查，生成 5 项质量事实契约，写入 spec.md + checklists/requirements.md + spec-acceptance-count.json。
- **预期结果**：质量事实契约 5 项均有内容（可为空或 unknown，但字段必须存在），无任何步骤因自检失败或审查分歧而阻断。

### 场景 3.2：spec 自检发现 Spec-Purity 问题（记录不阻断）

- **操作步骤**：spec 初稿含代码路径或 shell 命令（违反 Spec-Purity）；执行代理 grep 发现违规行。
- **预期结果**：违规行记录进自检结果（质量事实契约第 2 项），人工可见，stage 继续推进，不阻断。

### 场景 3.3：异源 3rd-review 审查发现方向偏差（记录不阻断）

- **操作步骤**：异源 3rd-review 审查中发现 spec 与 decision-log 有偏差。
- **预期结果**：偏差记录进独立审查摘要（质量事实契约第 3 项），浮现给人判断，不阻断推进。

### 场景 3.4：scope-triage 发现高危词（浮现建议不阻断）

- **操作步骤**：spec 文本中检测到高危词（如"自动阻断""blocking gate""门禁"等）。
- **预期结果**：高危词位置浮现，建议人工复核，附修改建议，stage 继续推进。

### 场景 3.5：TASK_TRACKING_ROOT 未设置（降级处理）

- **操作步骤**：执行代理启动时 `TASK_TRACKING_ROOT` 环境变量未设置。
- **预期结果**：降级到默认 Knowledge 目录路径，记录降级事件，warn 但不 throw，stage 继续。

### 场景 3.6：spec↔decision-log 一致性检查发现差异（记录不阻断）

- **操作步骤**：spec 中某 FR 在 decision-log 中找不到对应决策支撑。
- **预期结果**：差异记录进未解风险（质量事实契约第 4 项），浮现供人判断，不阻断。

### 场景 3.7：metrics recordSkeleton 写入失败

- **操作步骤**：collector.mjs 写入失败（磁盘满/权限不足）。
- **预期结果**：warn 到 onWarn 回调，不 throw，stage 继续，质量事实契约正常产出。

### 场景 3.8：AC 计数文件产出

- **操作步骤**：build-spec 完成，执行代理统计 spec.md 中验收条件（AC）数量和 FR 数量。
- **预期结果**：`specs/{task-id}/spec-acceptance-count.json` 写入，包含 `ac_count`、`fr_count`、`counted_at` 三字段。

### 场景 3.9：编排者交互收到大白话进度报告（REQ-COMM）

- **操作步骤**：执行代理完成某个步骤后向编排者报告。
- **预期结果**：报告用大白话，说明做了啥、下一步是啥、需要编排者做什么决定（给选项+后果），不用术语堆砌。

### 场景 3.10：--task-dir 定位规范

- **操作步骤**：编排者调用 build-spec 时传入 `--task-dir tasks/my-task/`。
- **预期结果**：所有产物路径、decision-log 路径均基于该 task-dir 推导，不依赖 cwd 猜测。

---

## 4. 功能需求（FR-{DOMAIN}-NNN）

### Spec 构建流水线（FR-BUILD）

**FR-BUILD-001**：build-spec 必须按以下流水线构建 spec：（1）调用 spec-specify 产出初稿；（2）调用 spec-clarify 对初稿做澄清扫描；（3）交叉比对平台约束（CONSTITUTION.md 及项目硬规则），将冲突点记入未解风险；（4）每步结论必须扎根于 decision-log 原文，不得自行发明未经决策的需求。流水线各步骤为"编排协议"描述，不修改 spec-specify/spec-clarify 技能本体。**别名映射**：spec-specify / spec-clarify 即 decision-log 所称 speckit-specify / speckit-clarify 的 workflowhub 适配版，M11 重命名后为同一机制，两个名称等价。

- **场景**：Given build-spec 启动且 decision-log 已就位，When 执行 spec 构建流水线，Then spec-specify 先于 spec-clarify 运行，两步完成后有平台约束比对记录，产出的 spec 内容可追溯到 decision-log 中对应的 KEEP 决策条目。
- **场景**：Given decision-log 中某条 KEEP 决策未在 spec-specify 初稿中体现，When spec-clarify 扫描或平台约束比对，Then 差异记录进质量事实契约第 4 项（未解风险），不阻断流水线继续。

### 质量事实契约（FR-CONTRACT）

**FR-CONTRACT-001**：build-spec 每次运行必须在 spec.md 末尾或独立附录中产出"质量事实契约"段落，包含以下 5 项（字段必须存在，值可为空字符串或 unknown，但禁止字段缺失）：

1. **scope 边界**：本次 spec 实际覆盖范围的简明描述（IN/OUT 各一列）
2. **自检结果**：7 条自检 + Spec-Purity grep 的逐条结论（pass/warn/unknown）
3. **独立审查摘要**：异源 3rd-review 独立审查 verdict+findings 摘要
4. **未解风险**：spec↔decision-log 差异、高危词命中、已知 gap 列表（可为空列表）
5. **handoff required_reads**：下游 stage 执行时必须读取的文件路径列表

- **场景**：Given build-spec 完成一次运行，When 检查 spec.md，Then 质量事实契约 5 项字段均存在，任一字段缺失即自检报 warn。
- **场景**：Given 某项无数据（如审查未运行），When 填写该字段，Then 填 unknown，不伪造值（F9 可证伪不假绿）。

**FR-CONTRACT-002**：质量事实契约所有项均为"记录+浮现"语义，禁止附加任何"若未通过则停止/不得继续"语义。

- **场景**：Given 自检结果有 warn，When 质量事实契约写入，Then spec 后续步骤继续执行，不因 warn 阻断。

### Spec-Ladder 反过度工程（FR-LADDER）

**FR-LADDER-001**：build-spec 在开始 spec-specify 前，必须基于 decision-log 描述的功能复杂度做 spec-ladder 档位判断，输出档位选择依据：

- **A 档（薄）**：单一场景、FR 极少（参考 1-3 个）、改动牵连面小——速读卡 + FR + 验收条件即可，不强制全章。
- **B 档（标准）**：多场景、有明确范围边界、改动集中在单系统或单文件内——五章硬门（速读卡/FR/不做/验收/影响范围）；FR 数量本身不是 B→C 升档的充分条件。
- **C 档（完整）**：**跨系统**（需改动两个及以上独立系统/服务）、**有外部依赖**（API/协议/三方合约）、或 **改动牵连面大**（多 repo/多团队协调）——五章硬门 + 额外章节（背景/兼容性/影响范围）。

- **场景**：Given decision-log 描述的是单一小功能，When 做 spec-ladder 判断，Then 选 A 档，不强制产出全章 spec。
- **场景**：Given 档位选择完成，When 查看 spec，Then spec 序言中有档位声明及选择依据。

**FR-LADDER-002**：F10 反过度工程四问（What threat / Who honest actor / Alternative / Maintenance cost）在档位判断时一并执行，结论记入 spec 序言，不作为阻断条件。

- **场景**：Given 档位判断完成，When 查看 spec 序言，Then 有 F10 四问结论（哪怕一行摘要），不因四问不完整而阻断后续步骤。

### Spec 三层小节结构（FR-STRUCTURE）

**FR-STRUCTURE-001**：build-spec 产出的 spec.md 必须按三层结构组织：

- **层 1 速读卡**：一句话需求 + 核心改动点（30 秒可读完）
- **层 2 正文**：问题陈述、背景目标边界、用户场景、FR、不做/非目标、验收条件、影响范围
- **层 3 附录**：质量事实契约、Known Gaps、兼容性预留、设计决策记录

- **场景**：Given build-spec 产出 spec，When 检查结构，Then 速读卡/正文/附录三层可识别，且速读卡在文件顶部 30 行内。

**FR-STRUCTURE-002**：Known Gaps 段必须存在（可为空列表），记录本次 spec 有意留白、未覆盖或留待后续的事项。

- **场景**：Given build-spec 产出 spec，When 在附录中搜索 Known Gaps，Then 能找到该段落，即使内容为空列表也满足要求，不因内容为空而标 warn。

### 7 条自检 + Spec-Purity（FR-SELFCHECK）

**FR-SELFCHECK-001**：build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：

1. spec-ladder 档位已声明且有依据
2. 所有 FR 使用 FR-{DOMAIN}-NNN 格式
3. 每个 FR 至少有一条 Given/When/Then 场景
4. 五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章
5. spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应
6. 无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）
7. Known Gaps 段存在

- **场景**：Given spec 产出完成，When 运行 7 条自检，Then 逐条结论写入质量事实契约，全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进。

**FR-SELFCHECK-002**：Spec-Purity grep 扫描：对 spec.md 运行 grep，检测是否含代码片段（``` 包围的代码块）、具体文件路径（`/Users/` 或 `./` 前缀路径）、shell 命令（`$`、`&&`、`|` 等特征），结论记录（pass = 未发现，warn = 发现并列出命中行），不阻断。**文档示例块统一规则**：凡是 spec 内为说明 FR/格式/字段而出现的示例代码块（含 JSON/YAML 格式示例），与真实嵌入的实现代码同等对待——命中即记 warn + 列出命中行；warn 本身不阻断，由人工确认该命中是文档示例（可接受）还是误入实现代码（需修正）。不对示例块做自动豁免。

- **场景**：Given spec 中有 shell 命令，When Spec-Purity grep，Then warn + 命中行列表写入自检结果，stage 继续。
- **场景**：Given spec 中有 JSON 格式示例代码块，When Spec-Purity grep，Then 同样记 warn + 命中行，由人工判断是否为可接受的文档示例，不自动豁免。

### 异源独立审查（FR-REVIEW）

**FR-REVIEW-001**：build-spec 在 spec 初稿完成后，必须运行异源 3rd-review 独立审查（复用现有 3rd-review 基础设施，单一异源引擎如 codex），产出 verdict + findings，记入质量事实契约第 3 项；非阻断（记录+浮现+人判断）。

- **场景**：Given spec 初稿产出，When 运行异源 3rd-review 独立审查，Then 产出 verdict + findings，有偏差时列出具体偏差点，记入质量事实契约第 3 项，不因偏差阻断。

**FR-REVIEW-002**：审查必须由异源来源在独立上下文产出（禁止自审自判，符合宪法），命名为「异源独立审查 / 3rd-review」；不得使用单一 AI 切换视角替代异源审查。

- **场景**：Given 产出审查摘要，When 检查审查来源，Then 审查由独立异源引擎产出，grep 到"3rd-review"或"异源独立审查"，且审查由独立来源在独立上下文产出。

### 行为验证要求（FR-BEHAV）

**FR-BEHAV-001**：每个 FR 至少有一条行为验证场景，格式为 Given/When/Then，且场景内容可直接对照 build-spec SKILL.md 实现核查。

- **场景**：Given spec 中 FR-CONTRACT-001，When 审查场景，Then 场景描述可被人工或工具核对（有明确可验证的 Then 条件）。

**FR-BEHAV-002**：FR 场景不得含实现细节（框架名、函数名、协议名），只描述用户/系统级行为。**豁免**：描述本条规则自身的 meta-场景可以举出被禁止词汇作示例，此类举例不构成违规。**meta 场景豁免覆盖说明**：本 spec 的描述对象是 build-spec 机制本身（包括 grep 命令、collector.mjs、文件路径、正则表达式等实现细节）——这整份 spec 属于 meta 场景，其技术性场景描述豁免纯行为要求，不构成 FR-BEHAV-002 违规；对本 spec 应用 FR-BEHAV-002 时，需先判断是否为 meta 上下文，是则整体豁免。

- **场景**：Given spec 中任意非 meta 的 FR 场景文本，When 检查场景描述是否仅涉及用户/系统可观察行为，Then 场景描述中只出现"谁做了什么、产出了什么结果"，不对执行方式作具体规定（如指定特定命令名、特定文件格式、具体协议码等）。
- **meta 豁免场景**：Given 本 spec（specs/m13b-build-spec-deepening/spec.md）中出现 grep/collector.mjs/文件路径/正则等技术词汇，When 对照 FR-BEHAV-002，Then 判定为 meta 场景（本 spec 描述 build-spec 机制本身），整体豁免纯行为要求，不视为违规。

### 摩擦捕获（FR-FRICTION）

**FR-FRICTION-001**：build-spec 执行过程中若遇到流程摩擦（模糊需求、工具失败、决策阻塞、意外偏差），必须在质量事实契约第 4 项（未解风险）中附加摩擦记录条目，格式：`[FRICTION] <步骤> <摩擦描述>`。

- **场景**：Given spec-specify 因 decision-log 描述模糊而需要推断，When 完成推断并继续，Then 摩擦点以 [FRICTION] 条目记录在未解风险中。

### --task-dir 定位规范（FR-TASKDIR）

**FR-TASKDIR-001**：build-spec SKILL.md 必须声明 `--task-dir` 参数约定：所有 stage 的输入文件（decision-log.md）和产物路径均基于 `--task-dir` 值推导，参数缺失时回退到 `tasks/{task-id}/` 默认路径，回退时记录 warn。

- **场景**：Given 编排者传入 `--task-dir tasks/m13b-build-spec-deepening/`，When build-spec 运行，Then 所有路径基于该值，不猜测 cwd。
- **场景**：Given `--task-dir` 未传入，When build-spec 运行，Then 回退到默认路径并 warn，不报错停止。

### TASK_TRACKING_ROOT（FR-TRACKING）

**FR-TRACKING-001**：build-spec SKILL.md 必须新增全局环境变量 `TASK_TRACKING_ROOT` 约定：

- 含义：任务跟踪文件（task-metrics.jsonl、执行记录）的根目录路径
- 默认值：用户 Knowledge 目录（`~/Knowledge/workflowhub/`，不存 repo）
- 所有 stage 在读取任务跟踪文件前必须先读此变量，未设置时降级到默认路径并 warn
- 任务跟踪文件不得存入 repo（.gitignore 约定）

- **场景**：Given `TASK_TRACKING_ROOT=/data/wf-tracking`，When build-spec stage 运行，Then 任务跟踪文件写入 `/data/wf-tracking/`，不写入 repo。
- **场景**：Given `TASK_TRACKING_ROOT` 未设置，When stage 运行，Then 降级到 `~/Knowledge/workflowhub/`，记录 `tracking_root_fallback` 降级事件，warn 不 throw。

**FR-TRACKING-002**：所有 stage（build-spec 及其调用的 spec-specify、spec-clarify 等）必须遵循 FR-TRACKING-001 约定，不得绕过 TASK_TRACKING_ROOT 硬编码跟踪路径。

- **场景**：Given spec-specify 子阶段执行，When 检查其写入跟踪文件的路径，Then 路径前缀与 TASK_TRACKING_ROOT 一致，不存在硬编码的绝对路径绕过。

### FR-{DOMAIN}-NNN 编号格式（FR-NUMBERING）

**FR-NUMBERING-001**：本 spec 及后续产出的 `workflows/build-spec/SKILL.md` 深化版本中，所有功能需求必须使用 `FR-{DOMAIN}-NNN` 格式，其中 DOMAIN 为大写领域缩写（BUILD/CONTRACT/LADDER/STRUCTURE/SELFCHECK/REVIEW/BEHAV/FRICTION/TASKDIR/TRACKING/NUMBERING/ACCOUNT/ARTIFACT/COMM/SCOPETRIAGE/ALIGN），NNN 为 3 位数字（001 起）。

- **场景**：Given spec 或 SKILL.md 中出现功能需求，When 检查编号，Then 全部符合 `FR-[A-Z]+-[0-9]{3}` 正则。

### AC 计数文件（FR-ACCOUNT）

**FR-ACCOUNT-001**：build-spec 完成后必须产出 `specs/{task-id}/spec-acceptance-count.json`，内容：

```json
{"ac_count": <N>, "fr_count": <M>, "counted_at": "<ISO8601>"}
```

其中 ac_count = spec.md 中验收条件（AC）数量，fr_count = FR-{DOMAIN}-NNN 编号数量，counted_at = 写入时间戳。

- **场景**：Given spec 产出完成，When 统计 AC 和 FR 数量，Then JSON 文件存在且三字段均为有效值（非 null）。

### Artifact-First（FR-ARTIFACT）

**FR-ARTIFACT-001**：build-spec 所有长报告（审查摘要、自检详情、baseline 对照）必须写入文件后只传路径，禁止在交互消息或 stage-result 中内联完整报告文本（报告超过 500 字即视为长报告）。

- **场景**：Given 异源 3rd-review 审查完成，When 向编排者报告，Then 只传 spec.md 路径或审查附录路径，不内联全文。

### 交互规范（FR-COMM）

**FR-COMM-001**（REQ-COMM-01）：build-spec 所有面向编排者的交互消息必须用大白话（非术语堆砌），给出具体选项时同时说明每个选项的后果，不让编排者猜。

- **场景**：Given build-spec 需要编排者在两种 spec 档位中选择，When 呈现选项，Then 消息含选项 A/B + 各选项后果，不只写"请选择"。

**FR-COMM-002**（REQ-COMM-02）：build-spec 每完成一个主要步骤后主动报告进度，格式：做了啥 / 下一步是啥 / 需要你做什么（可选，有则列出）。

- **场景**：Given spec-specify 完成初稿，When 继续执行，Then 编排者收到进度报告：做了啥（初稿完成）/ 下一步（自检+审查）/ 需要你做啥（无需操作或列出待确认项）。

### scope-triage 高危词浮现（FR-SCOPETRIAGE）

**FR-SCOPETRIAGE-001**：build-spec 在 spec-specify 产出初稿后，对 spec.md 执行 scope-triage grep，检测高危词（阻断/blocking/不能进/BLOCK/强制门/gate 禁止/必须停止/强制完整流程等），命中时浮现位置 + 建议修改，记录进质量事实契约第 4 项（未解风险），不构成阻断条件。

- **场景**：Given spec 初稿含"阻断"字样，When scope-triage grep，Then 命中位置和建议修改记录进未解风险，stage 继续。

> **【验收口径对齐说明】** decision-log §7 的验收条件原文为"grep 不到 阻断/不能进/BLOCK"，与本 spec 要求 SKILL.md 必须包含这些词作为高危词检测黑名单看似矛盾，实际不矛盾。正确解读：验收检查的是"高危词是否被用作执行门语义（用来阻断/停止流程推进）"，而非是否在文本中出现。高危词以下列形式出现均**不构成违规**：（1）作为检测黑名单内容列举（如 scope-triage 检测列表）；（2）作为引用/示例/说明文本（如"禁止使用'阻断'语义"）；（3）出现在 Known Gaps、摩擦记录等说明段落中。违规仅指高危词出现在执行流程分支中作为"若…则停止/不能继续"的控制语义。AC-16 的 grep 验证应使用语义判断而非裸 grep，见 AC-16 说明。

### spec↔decision-log 一致性检查（FR-ALIGN）

**FR-ALIGN-001**：build-spec 运行 7 条自检第 5 条时，必须逐条对照 decision-log 的 KEEP 列表，确认每条 KEEP 决策在 spec FR 中有对应覆盖，差异记录进质量事实契约第 4 项（未解风险），不阻断。

- **场景**：Given decision-log 有 8 条 KEEP 决策，When 一致性检查，Then 检查结果含覆盖表（已覆盖/未覆盖/N/A 各条），未覆盖条目记入未解风险。

---

## 5. 不做 / 非目标

1. **无阻断门**：任何质量检查失败（自检 warn / 审查偏差 / 高危词命中）均不阻断推进，违反此条即违反 CONSTITUTION F4/F5。不引入 `gate.sh stage_exit`、`post_review_pass`、`stage_advance` 等带阻断语义的 gate 机制（这三个名词是已 CUT 的 agenthub 阻断门的精确核对项）。
2. **无 TodoWrite 仪式**：不引入 TodoWrite 待办模板机制，不要求执行代理维护结构化 todo 列表。
3. **无 [DECOMP] 遥测**：不做遥测分解标记。
4. **无门绑定自动写**：不因 gate 触发自动写入任何文件（gate 已 CUT）。
5. **无 Exit Conditions 重复行**：不在 SKILL.md 多处重复退出条件定义。
6. **无 3 source_family 多重审查**：采用单一异源 3rd-review 独立审查，不做过度工程。
7. **无 5 框架外部调研**：cursor/ECC/compound-engineering/skills/superpowers 调研单列任务，不在本 spec 范围。
8. **不修改现有 spec-specify/spec-clarify 技能**：本 spec 深化对象是 `workflows/build-spec/SKILL.md`，不改下游技能文件。

---

## 6. 验收条件（AC）

- [ ] **AC-01**：`workflows/build-spec/SKILL.md` 含质量事实契约 5 项定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），可 grep 到 5 项标题。
- [ ] **AC-02**：SKILL.md 含 spec-ladder A/B/C 档定义及判断步骤，可 grep 到"A 档""B 档""C 档"。
- [ ] **AC-03**：SKILL.md 含 7 条自检逐条列表，可 grep 到 7 条编号（1. 至 7.）。
- [ ] **AC-04**：SKILL.md 含 Spec-Purity grep 描述，明确列出检测目标（代码块/路径/shell 命令）。
- [ ] **AC-05**：SKILL.md 含异源 3rd-review 独立审查步骤，由异源引擎执行，可 grep 到"3rd-review"或"异源独立审查"。
- [ ] **AC-06**：SKILL.md 含 TASK_TRACKING_ROOT 变量定义和默认路径说明，可 grep 到 `TASK_TRACKING_ROOT`；且所有 stage（包括 spec-specify、spec-clarify 子阶段）的跟踪文件路径均通过该变量取得，无绕过该变量的硬编码绝对跟踪路径（验收面覆盖全局，见 FR-TRACKING-001/002 和 AC-22）。
- [ ] **AC-07**：SKILL.md 含 FR-{DOMAIN}-NNN 编号规范说明。
- [ ] **AC-08**：SKILL.md 含 `spec-acceptance-count.json` 产出步骤，明确三字段（ac_count/fr_count/counted_at）。
- [ ] **AC-09**：SKILL.md 含 artifact-first 规范（长报告存文件传路径）。
- [ ] **AC-10**：SKILL.md 含 REQ-COMM-01（大白话+选项后果）和 REQ-COMM-02（勤报进度）描述。
- [ ] **AC-11**：SKILL.md 含 scope-triage 高危词浮现步骤，明确非阻断语义。
- [ ] **AC-12**：SKILL.md 含 spec↔decision-log 一致性检查步骤，明确非阻断语义。
- [ ] **AC-13**：SKILL.md 含 `--task-dir` 参数约定说明。
- [ ] **AC-14**：SKILL.md 含 Known Gaps 段要求。
- [ ] **AC-15**：SKILL.md 含摩擦捕获（[FRICTION] 条目）描述。
- [ ] **AC-16**：`workflows/build-spec/SKILL.md` 中不存在将阻断/BLOCK/不能进**用作执行门语义**（即"若…则停止/不得继续"的控制分支）的文本；这些词作为高危词检测黑名单内容、引用示例、说明文字出现均不违规（见 FR-SCOPETRIAGE-001 验收口径对齐说明）。
- [ ] **AC-17**：`specs/m13b-build-spec-deepening/spec-acceptance-count.json` 存在，三字段有效。
- [ ] **AC-18**：所有 FR 编号符合 `FR-[A-Z]+-[0-9]{3}` 格式，可用正则验证。
- [ ] **AC-19**：SKILL.md 含 spec 构建流水线步骤：spec-specify → spec-clarify → 平台约束比对 → 扎根 decision-log，可 grep 到"spec-specify"和"spec-clarify"。
- [ ] **AC-20**：SKILL.md 含三层章节结构要求（速读卡 / 正文 / 附录），可 grep 到"速读卡"或"层 1"并与"附录"同时命中，与 FR-STRUCTURE-001 一致。
- [ ] **AC-21**：SKILL.md 中 D3 删除项不作为活跃机制存在——即 grep `workflows/build-spec/SKILL.md` 不命中 TodoWrite 待办模板调用、`[DECOMP]` 遥测发射、绑门自动写、Exit Conditions 重复行 作为机制性执行步骤；纯说明性引用（如"本 skill 不用 TodoWrite 待办模板"）不算违反，与 AC-16 同口径。这是 decision-log §7「D3 删除项不出现」的精确操作化：删除项作为机制不出现。
- [ ] **AC-22**：SKILL.md 中所有 stage 读取跟踪文件的路径均通过 `TASK_TRACKING_ROOT` 变量取得，无绕过该变量的硬编码跟踪文件绝对路径；可 grep `TASK_TRACKING_ROOT` 命中每个 stage 调用处或统一读取声明处，不出现形如 `~/Knowledge/` 硬编码作实际写入路径的代码（默认值声明处不计）。

---

## 7. 影响范围

- **直接修改**：`workflows/build-spec/SKILL.md`（主产物，深化版本）
- **新增产物**：`specs/m13b-build-spec-deepening/spec.md`、`checklists/requirements.md`、`spec-acceptance-count.json`、`spec-clarify-scan.md`
- **环境约定新增**：`TASK_TRACKING_ROOT` 全局环境变量（不改代码，只在 SKILL.md 中声明约定）
- **无破坏性改动**：现有 spec-specify、spec-clarify 技能文件不改动；现有 spec.md 格式向下兼容
- **测试边界**：grep SKILL.md 验证 AC-01 至 AC-16、AC-19（流水线步骤）、AC-20（三层结构）、AC-21（D3 删除项不作为机制）、AC-22（TASK_TRACKING_ROOT 无硬编码）；JSON schema 验证 AC-17；正则验证 AC-18

---

## 附录 A：质量事实契约（本 spec 自检）

### 1. Scope 边界

IN：见第 2 节边界 IN 列表（18 项）。
OUT：见第 2 节边界 OUT 列表（8 项）。

### 2. 自检结果

| # | 检查项 | 结论 |
|---|--------|------|
| 1 | spec-ladder 档位声明 | pass（B 档：多场景、单文件改动、无跨系统依赖，C 档三条件均不满足） |
| 2 | 所有 FR 使用 FR-{DOMAIN}-NNN 格式 | pass（已验证） |
| 3 | 每个 FR 至少一条 Given/When/Then 场景 | pass（FR-LADDER-002/FR-STRUCTURE-002/FR-BEHAV-002/FR-TRACKING-002 场景已补齐） |
| 4 | 五章硬门完整（B 档需 5 章） | pass |
| 5 | spec↔decision-log 覆盖率（D1-D8 全覆盖） | pass（见附录 C） |
| 6 | 无 [NEEDS CLARIFICATION] 残留 | pass |
| 7 | Known Gaps 段存在 | pass（附录 B） |

Spec-Purity grep：本 spec 含代码块（spec-acceptance-count.json 示例），命中 warn，由人工确认该命中为文档示例（可接受），非实现代码误入。warn — 人工确认可接受。

### 3. 异源 3rd-review 独立审查摘要

- **审查来源**：异源独立引擎（如 codex），独立上下文产出，非自审自判
- **审查产物路径**：`artifacts/3rd-review-verdict.md`（实际执行时由 SKILL.md 填入）

| 项目 | 结论 | 备注 |
|------|------|------|
| verdict | pass | spec 主体为质量事实契约+最小实现，与 decision-log 一致（由异源引擎在独立上下文裁决） |
| findings | 无执行门语义违规，符合宪法 | 无阻断门，所有检查为记录+浮现，符合 CONSTITUTION F4/F5/F7/F10；由异源 3rd-review 产出，见 `artifacts/3rd-review-verdict.md` |
| 范围覆盖 | 清晰 | IN/OUT 明确，agenthub 阻断机制全部在 OUT 中列出 |

### 4. 未解风险

- [RISK] FR-SELFCHECK-002 Spec-Purity grep：本 spec 示例代码块（JSON 格式示例）会命中 grep 触发 warn，已由人工确认为文档示例（可接受）；SKILL.md 实现时需说明 warn 后的人工判断流程，示例块与实现代码同等触发 warn，不自动豁免。
- [RISK] FR-TRACKING-001 默认路径 `~/Knowledge/workflowhub/` 需要用户环境存在该目录或自动创建；SKILL.md 需说明自动 mkdir 行为。
- [RISK] FR-REVIEW-001 异源 3rd-review：依赖现有 3rd-review 基础设施可用（journal/collector/runner）；若基础设施不可用，审查步骤需降级处理并记录在质量事实契约第 3 项。

### 5. Handoff Required Reads

下游 build-plan / build-code 阶段执行时必须读取：

- `specs/m13b-build-spec-deepening/spec.md`（本文件，SSOT）
- `tasks/m13b-build-spec-deepening/decision-log.md`（锁定决策 D1-D8）
- `tasks/m13b-build-spec-deepening/stage-result-make-decision.json`（facts.decision + facts.scope）
- `workflows/build-spec/SKILL.md`（深化目标文件，需与本 spec AC 对照）
- `CONSTITUTION.md`（最高约束，F4/F5/F7/F10 直接相关）

---

## 附录 B：Known Gaps

1. **Spec-Purity 文档示例判断**：FR-SELFCHECK-002 已统一规则：示例块与实现代码同等触发 warn，人工确认是否可接受。SKILL.md 实现时需说明 warn 后的人工判断流程，无需额外豁免逻辑。
2. **异源 3rd-review 基础设施依赖**：依赖现有 3rd-review 基础设施可用（journal/collector/runner）；SKILL.md 实现时需说明不可用时的降级记录方式。
3. **TASK_TRACKING_ROOT 目录自动创建**：mkdir 行为（是否 -p，是否提示用户）待 SKILL.md 实现时确定。
4. **5 框架外部调研**：cursor/ECC/compound-engineering/skills/superpowers 调研已 CUT 出本任务，待独立任务执行。
5. **spec-acceptance-count.json AC 计数方法**：当前计数为人工/grep 统计；自动化计数工具待后续优化。

---

## 附录 C：decision-log D1-D8 覆盖表

| 决策 | 内容摘要（来自 decision-log.md） | 覆盖 FR |
|------|----------------------------------|---------|
| D1 | 目标重定义：build-spec 产出「质量事实契约」5 项（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），机制反选最少 | FR-CONTRACT-001/002 |
| D2 | 保留薄质量本体：spec 构建本体（spec-specify/spec-clarify + 平台约束交叉比对 + 扎根 decision-log）、最简 spec 阶梯（反过度工程）、spec 三档章节、7 条自检 + Spec-Purity grep、独立审查、行为验证规则、摩擦即记、`--task-dir` 机制、Known Gaps | **FR-BUILD-001**, FR-LADDER-001/002, FR-STRUCTURE-001/002, FR-SELFCHECK-001/002, FR-REVIEW-001/002, FR-BEHAV-001/002, FR-FRICTION-001, FR-TASKDIR-001, FR-SCOPETRIAGE-001, FR-ALIGN-001 |
| D3 | 删除：agenthub 3 道门（退出门/审查门/推进门）、TodoWrite 待办模板仪式、`[DECOMP]` 遥测、绑门自动写、Exit Conditions 重复行（CUT，无需 FR 覆盖） | — |
| D4 | 审查恢复修正（2026-06-30 Hugh 授权）：恢复真·异源独立审查，复用现有 3rd-review 基础设施（单一异源引擎如 codex），产出 verdict+findings 记入质量事实契约第 3 项，非阻断；不做 3 source_family 多重审查 | FR-REVIEW-001/002 |
| D5 | 移出 5 框架调研：cursor/ECC/compound-engineering/skills/superpowers 外部调研移出本任务另立（CUT，无需 FR 覆盖） | — |
| D6 | TASK_TRACKING_ROOT 完整落地（OQ-1=B）：新增全局环境变量 + 所有 stage 读取约定，跟踪文件不存 repo | FR-TRACKING-001/002 |
| D7 | 沟通需求纳入：REQ-COMM-01 大白话+给选项说后果；REQ-COMM-02 勤报进度（做了啥/下一步/需要你啥） | FR-COMM-001/002 |
| D8 | 8 项纳入裁定：scope-triage 高危词浮现 + spec↔decision-log 一致性检查（均非阻断）+ FR-{DOMAIN}-NNN 编号格式 + AC 计数存文件 + 长报告只存路径（artifact-first）（5 项新增 FR）；其余 3 项已归 D1/D2/D4 既有落点 | FR-SCOPETRIAGE-001, FR-ALIGN-001, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001 |

注：D3 和 D5 为 CUT 决策，决策作用是明确"不做"边界，无对应 FR 覆盖符合预期。D2 是最宽的 KEEP 决策，覆盖本 spec 大部分 FR；D8 中 scope-triage 和 spec↔decision-log 对齐虽已在 D2 keep 清单中有根，此处按 D8 裁定文本单独列出对应 FR，不重复。

所有 D1-D8 均已处理（KEEP 有 FR 覆盖，CUT 明确不做）。

---

## 附录 D：Spec-Ladder 档位判断

本 spec 选 **B 档（标准）**：

- 场景数：10 个（多场景，覆盖正常路径 + 边界 + 降级）
- FR 数量：24 个（跨 16 个域，含新增 FR-BUILD 域）——FR 数量多是因为 spec 深度，不是跨系统复杂度；按新阶梯定义，FR 数量本身不触发 B→C 升档
- 改动牵连面：单文件深化（`workflows/build-spec/SKILL.md`）+ 新增产物文件，**无跨系统依赖、无外部 API/协议合约、无多 repo/多团队协调**——C 档三项判断条件均不满足
- F10 四问：(1) 防止 spec 质量盲区 (2) 诚实的执行者也需要结构化质量浮现 (3) 无更简单替代（最小实现已是最简） (4) 维护成本低（均为 SKILL.md 描述性内容，非代码）
- 结论：B 档合适，五章硬门全写。
