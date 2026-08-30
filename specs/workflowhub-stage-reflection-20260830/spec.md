# 功能规格：stage-reflection 每阶段自动复盘器与判断层页面

> 基于当前任务的已确认 decision-log.md。本文件只定义用户能看到的行为、数据契约、边界和验收，不定义实现文件、代码符号或工程命令。

- **功能名**：stage-reflection 每阶段自动复盘器 + 判断层输出归档 + 全局复盘页面重建 + 两补丁（人工介入原文 / 产出消费链）
- **来源**：`decision-log.md` 的 R-001～R-015、D-001～D-012、F-001～F-014、审查处置（FND-001～FND-D4）、风险与延期交接、未决项（OPEN-007/008/009）
- **上游交接**：ADR 0021（stage-reflection 判断层）；ADR 0012（M15 监控采集链，已由 m15-retirement 退役）；m15-retirement 的 DEF-001（复盘器 + 页面重做）与 DEF-002（两补丁）正式移交本任务关闭
- **状态**：已冻结并经用户确认（2026-08-30），build-plan 消费
- **content_profile**：`spec-content.v3`

## 速读卡

- **一句话需求**：每个 WorkflowHub 任务的每个 stage 结束时，当前主会话自动做一次轻量复盘，把"值得提升的地方、历史的坑是否又踩、哪里可简化"写成带来源证据的判断层记录，归档到任务 `quality/`，并由一个纯静态全局页面汇总成任务视图与 overall pending 待优化清单，作为未来 M16 的数据输入。
- **核心改动点**：
  - 新技能 `skills/stage-reflection` + 各 authoring stage manifest 声明复盘 step（框架层挂载，走 stage-runner 通用 step/skill outcome 校验通道，不改校验器核心）。
  - 补丁 A：`human-confirmation` 记录升级 v3，新增 `reply_text`（用户回复原文）+ `step_slug` 锚点；旧 v1/v2 记录只读兼容。
  - 补丁 B：消费边从 stage outcome 的 `input_refs`/`evidence_refs` 纯脚本派生，无引用记 `unknown`，不判无用。
  - 全局 lessons 索引按 stage 分文件：机器无条件追加原始观察，复盘成功后才合并去重写回。
  - M15 页面**重建**（非复用）：以仓外 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub-monitor.html` 静态模式为蓝本新建投影器与页面模板，数据源换为复盘产物。
- **最大影响面**：五阶段 workflow 的 steps.json/manifest、confirmation 写入点与读取方、stage outcome 消费方、任务 `quality/` 目录结构、全局页面与 move-map 登记。
- **验收信号**：下一个真实 WorkflowHub 任务跑通——每 stage（含失败 stage）产出合规复盘、两补丁生效、lessons 合并写回、页面展示真实数据、复盘失败不阻断。
- **顺序约束（写死）**：m15-retirement 合并 main 之后才开工本任务 build-code（D-008 / RISK-005）。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / scope | Handoff / risk |
| --- | --- | --- | --- | --- |
| R-004、F-009 | D-001 | FR-TRIG-001～002；AC-001、AC-002 | current / 框架层挂载 | 未声明的 stage 不复盘（manifest 强约束保证声明） |
| R-008、T-001、T-012 | D-002 | FR-EXEC-001；AC-001 | current / 主会话自评 | RISK-001 自评偏差，由 FR-GATE 机器门槛兜底 |
| R-012、F-010、FND-005 | D-003 | FR-EXEC-002；AC-002 | current / 输入范围 | 不读 transcript 全文、不读四份材料全文 |
| T-006、G-001 | D-004（补丁 A） | FR-CONF-001～002；AC-003 | current / 单写入源升级 | RISK-004 迁移兼容 |
| T-006、G-002 | D-004（补丁 B） | FR-EDGE-001～002；AC-004 | current / 纯脚本派生 | RISK-003 漏检保守处理 |
| T-009、T-013、F-012 | D-005 | FR-OUT-001～004、FR-SEV-001；AC-002、AC-010 | current / 六类判断全量 | judgment≠fact 身份写死 |
| G-004、F-012 | D-006 | FR-GATE-001～002；AC-007 | current / 机器门槛 | 初期 remove_candidate 很少（宁缺毋错） |
| R-010、T-004、T-010、G-003、FND-004 | D-007 | FR-LESSON-001～004；AC-005 | current / 防污染防丢失 | RISK-002 冷启动如实 unknown |
| R-006、T-003、T-007、F-014 | D-008（重建） | FR-PAGE-001～006；AC-006、AC-009 | current / 重建非复用 | RISK-005 顺序约束 |
| R-007 | D-009 | FR-FAIL-001～002；AC-008 | current / 不阻断 | 长期失败攒 unknown 由页面可见 |
| T-008、T-011、FND-D2 | D-010 | AC-001～AC-012 | current / 真实任务端到端 | 不设成本上限指标 |
| R-011、R-014 | D-011 | 非目标节 | current / 边界写死 | M16 依赖本任务产出 |
| R-015、F-013 | D-012 | FR-DOC-001；AC-011 | current / 材料落点文档修正 | m15-retirement 会话自行修正其材料 |
| FND-007、FND-D1（accepted_risk） | OPEN-007 | FR-SEV-001～002 | **本 spec 关闭** | severity 三档 + 聚合公式见 §5.4 |
| OPEN-008 | D-005 | FR-OUT-001～004 | **本 spec 关闭** | schema 草案见 §5.1 |
| OPEN-009 | grill no-change | FR-TERM-001 | **本 spec 交接 build-code** | schema 已定稿，术语可补录 |

每条 FR 和 AC 都在本规格中绑定来源决策；没有新增产品方向。

## 1. 问题与紧迫性

用户需要知道：每个 step、每个 skill 对整个任务流程有没有帮助、有没有需要提升的地方、执行中有没有阻塞、人工为什么回复那句话（R-012）。M15 的监控链已由 m15-retirement 会话整体退役（F-014：采集链与投影链全拆，仓外页面留静态尸体），其教训是"没采到≠流程退化"从未解决、页面曾重成空壳。本任务不恢复遥测采集，而是建立一个诚实的**判断层**：由当前主会话在 stage 结束时基于会话经验做结构化复盘，判断明确标注为 judgment（非机器事实），用机器硬信号约束最危险的结论（remove），并把结果沉淀为可聚合、可复核、可供 M16 消费的数据。

## 2. 目标、范围与非目标

### 目标

- 每个 authoring stage 结束自动产出结构化复盘（六类判断 + 证据 ref + confidence），含失败的 stage。
- 复盘输出归档于任务 `quality/stage-reflection/`，可被纯脚本聚合。
- 补丁 A 生效：confirm/authorize 记录含 `reply_text` + stage/step 锚点（v3，旧记录只读兼容）。
- 补丁 B 生效：消费边可从 stage outcome `input_refs`/`evidence_refs` 派生，无引用记 `unknown`。
- lessons 索引按 stage 分文件维护：机器无条件追加原始观察，复盘成功后合并去重写回，失败不污染。
- 全局静态页面显示任务视图 + overall pending，unknown/unavailable 如实展示不伪造。

### 范围内

- `skills/stage-reflection` 技能 + 各 stage 框架层自动挂载（manifest 声明 step + skill）。
- 复盘输出 schema（判断层）与任务 `quality/` 归档。
- 补丁 A（human-confirmation v3）与补丁 B（消费边派生）。
- 全局 lessons 索引（`<storageRoot>/Projects/<proj>/lessons/<stage>.jsonl`）。
- M15 页面重建（投影器 + 静态页面模板，任务视图 + overall pending + 基本筛选）。
- 四份材料落点的 agent 操作约定文档修正（D-012/F-013③）。
- CONTEXT.md 术语补录（stage-reflection / 判断层 vs 事实层）。

### 非目标（写死，D-011）

- 不做 token/耗时/transcript 遥测采集（m15-retirement 已退役；session-event 的 usage 字段亦已退役，本任务无任何 token/耗时数据源）。
- 不做质量打分/质量裁决（归 review/verify 体系）。
- 不做 M16 候选池本体、迭代入口、负例库。
- 不补 DSH/Kimi/Claude 的 per-provider 采集。
- 不做历史任务数据回填（历史数据只读）。
- 不改五阶段主骨架（仅 manifest 声明新 step，不改 stage-runner 校验器核心）。
- R-013 市面调研处置：**已在 make-decision 完成**（F-012 调研结论已落入 D-005/D-006 设计），非本 spec 交付物，无后续动作（decision-log FND-D4 处置记录）。

## 3. 用户场景与状态覆盖

### SCN-001：stage 正常结束，自动复盘

- **Given**：一个真实 WorkflowHub 任务正在运行某个 authoring stage（如 build-spec）。
- **When**：该 stage 的既有 step 序列执行完毕（含 stage-end-spec-analyze），stage 状态为 completed。
- **Then**：当前主会话在同一 stage 内运行 stage-reflection step；产出 `quality/stage-reflection/<stage>.json`，`stage_status=completed`、`status=ok`（或 degraded）；机器向 `<storageRoot>/Projects/<proj>/lessons/<stage>.jsonl` 追加原始观察；复盘成功后合并去重写回 lessons。

### SCN-002：stage 失败，也复盘

- **Given**：某 stage 执行失败（step failed / stage outcome 非 completed）。
- **When**：stage 结束。
- **Then**：仍然产出复盘文件，`stage_status=failed` 如实标注；失败原因本身成为复盘输入的一部分；复盘不因为 stage 失败而跳过。

### SCN-003：复盘器自身失败

- **Given**：复盘输出超时、LLM 归因失败或写盘失败。
- **When**：stage-reflection step 无法完成。
- **Then**：`quality/stage-reflection/<stage>.json` 落 `status:failed`（含错误摘要）；stage 完成与任务 close 照常推进；lessons 不合并（原始观察已由机器追加，不丢失）。

### SCN-004：人工介入被记录原文

- **Given**：stage 中途触发 confirm 或 authorize，用户回复了一句话。
- **When**：确认/授权写入点落盘 human-confirmation 记录。
- **Then**：v3 记录包含 `reply_text`（用户回复原文）与 `step_slug`（当时所处步骤锚点）；复盘 interventions[] 引用该记录做归因；历史 v1/v2 记录被所有读取方只读兼容，不报错、不改写。

### SCN-005：用户打开全局页面

- **Given**：已有若干任务的复盘产物与 lessons 索引。
- **When**：用户用浏览器打开纯静态 HTML 页面（无服务依赖）。
- **Then**：任务视图显示每任务各 stage 判断摘要并可下钻；overall pending 视图按聚合分排序显示跨任务待优化问题（带来源任务 ref）；可按任务/stage/六类判断筛选；缺数据处显示 unknown/unavailable，不补零不猜测；页面明确标注所展示内容为 judgment 而非机器事实。

### SCN-006：冷启动

- **Given**：lessons 索引为空、消费边大量 unknown（前 N 个任务）。
- **When**：复盘与页面生成。
- **Then**：历史坑对照能力弱如实展示（低置信、unknown），不预填、不伪造基线。

## 4. 用户流程：每 stage 结束自动复盘（FR-TRIG/FR-EXEC/FR-FAIL 的行为面）

1. **谁触发**：框架层。各 authoring stage 的 steps.json 增加 stage-reflection step，manifest 声明绑定 `skills/stage-reflection`；stage-runner 通用 step/skill outcome 校验通道已核实支持（F-009），不新增专用强校验槽，不改校验器核心。（FR-TRIG-001）
2. **谁执行**：当前主会话自评。不另起子代理、不读 transcript 全文、不读四份材料全文。（FR-EXEC-001）
3. **读什么**：①当前会话记忆（本 stage 全过程经验）；②`<storageRoot>/Projects/<proj>/lessons/` 索引（小文件）；③本 stage 的 step/skill outcome 记录（会话内已有，含两补丁数据：v3 确认记录的 reply_text/step_slug、outcome 的 input_refs/evidence_refs）。（FR-EXEC-002）
4. **写什么**：
   - 机器先行（零 AI 成本）：向 `lessons/<stage>.jsonl` **无条件追加**本 stage 的原始观察行。
   - 复盘产出：`quality/stage-reflection/<stage>.json`（schema 见 §5.1），随任务归档。
   - 复盘成功后：合并同类项去重写回 `lessons/<stage>.jsonl`。
5. **失败怎么办**：复盘失败/超时 → 落 `status:failed`（含错误摘要）；stage 完成与 close 照常；lessons 只保留机器追加的原始观察，不合并、不写回 merged 行。（FR-FAIL-001）
6. **部分输入缺失**（如 lessons 不可读、消费边数据缺失）：复盘仍产出，`status:degraded`，缺失部分如实记 unknown。（FR-FAIL-002）

## 5. 数据契约（schema 草案）

### 5.1 FR-OUT-001：复盘输出 `quality/stage-reflection/<stage>.json`

`schema_version = "stage-reflection.v1"`。文件身份为**判断层记录**：`record_kind` 固定为 `"judgment"`，并在文件中显式标注"本文件内容为 LLM 判断而非机器事实"（judgment≠fact，R-014/D-005，原则由 ADR 0021 固化）。**禁止**出现质量打分字段。

```json
{
  "schema_version": "stage-reflection.v1",
  "record_kind": "judgment",
  "task_id": "<task-id>",
  "stage": "make-decision|build-spec|build-plan|build-code|verify-code",
  "stage_status": "completed|failed",
  "generated_at": "<ISO8601>",
  "status": "ok|degraded|failed",
  "error": null,
  "judgments": [],
  "interventions": [],
  "lessons_added": []
}
```

- `stage_status`：被复盘 stage 的真实状态；失败的 stage 也复盘并标 `failed`（Clarify #1）。
- `status`：复盘本身的产出状态。`ok`=全部输入齐备；`degraded`=部分输入缺失（缺失处记 unknown）；`failed`=复盘失败（此时 `error` 含错误摘要，`judgments`/`interventions`/`lessons_added` 可为空）。
- `error`：`status=failed` 时为 `{ "summary": "<非空字符串>" }`，否则为 `null`。

### 5.2 FR-OUT-002：judgments[] 条目（六类判断）

```json
{
  "subject_id": "<step_slug 或 skill 名>",
  "subject_kind": "step|skill",
  "classification": "keep|optimize|simplify|merge|remove_candidate|add|needs_evidence",
  "severity": "high|medium|low",
  "reason": "<归因说明>",
  "evidence_refs": ["<outcome/evidence/confirmation 等真实引用>"],
  "confidence": "high|medium|low",
  "next_review_trigger": "<何时复核该判断的触发条件>"
}
```

- `classification` 六类全量（keep/optimize/simplify/merge/remove_candidate/add，D-005）；**第七个取值 `needs_evidence`** 专用于 D-006：机器硬信号不足时，LLM 直觉只能落在这一类，不得落入 remove_candidate（FR-GATE-001）。
- `evidence_refs` 必须指向真实存在的记录（本 stage outcome、evidence、confirmation 引用等），不允许编造；冷启动无证据时允许空数组且 `confidence` 不得为 high。
- `severity` 定义见 §5.4（FR-SEV-001）。

### 5.3 FR-OUT-003/FR-OUT-004：interventions[] 与 lessons_added[]

- `interventions[]`（FR-OUT-004）：人工介入归因。每条 = `{ "confirmation_ref": "quality/confirmations/<sha256>.json", "step_slug": "<锚点>", "reply_text": "<用户回复原文>", "attribution": "<为什么介入的归因>", "confidence": "high|medium|low" }`。`reply_text`/`step_slug` 取自 v3 确认记录；旧 v1/v2 记录无原文时 `reply_text` 记 `null` 且归因 confidence 不得为 high（不伪造）。
- `lessons_added[]`：本次复盘成功合并写回的 lessons 条目引用（文件 + 条目 id 或行号）；复盘失败时为空数组。

### 5.4 FR-SEV-001/FR-SEV-002：severity 三档与聚合规则（关闭 OPEN-007 / FND-007 / FND-D1）

- **severity 三档**（Clarify #2，复盘器按此口径判断）：
  - `high`：影响交付质量，或反复出现的问题。
  - `medium`：拖慢流程但不影响交付质量的问题。
  - `low`：体验问题。
- **聚合规则**（overall pending 排序用）：窗口 = 最近 30 天；条目得分 = 窗口内该条目每次出现的 severity 权重之和，权重 高=3、中=2、低=1（得分 = Σ weight）；频次 = 窗口内出现次数（跨任务去重到"任务×stage"粒度）。排序按得分降序，同分按频次降序，再按最近出现时间降序。

### 5.5 FR-CONF-001/FR-CONF-002：human-confirmation v3（补丁 A）

`schema_version = "human-confirmation.v3"`。v3 = v1/v2 既有字段全集 + 新增：

```json
{
  "schema_version": "human-confirmation.v3",
  "task_id": "<task-id>",
  "stage": "<五阶段枚举>",
  "decision": "accepted|rejected",
  "subject_ref": "<v2 既有语义>",
  "material_revision": "<v2 既有语义>",
  "snapshot_tree": "<v2 既有语义>",
  "confirmed_at": "<ISO8601>",
  "reply_text": "<用户回复原文，非空字符串>",
  "step_slug": "<确认/授权发生时所处的 step 锚点，非空字符串>"
}
```

- v1 既有字段（`attempt_ref`、`checkpoint_plan_hash`）按各自既有语义保留可选；v2 起引入的 `subject_ref`/`material_revision`/`snapshot_tree` 语义不变。
- **写入点**：现有单一写入点升级产出 v3，单写入源、不双写（G-001）。已核实的真实写入点：`runtime/task/task-kernel-implementation.mjs:523`（confirm 产出 `human-confirmation.v2` 内联常量）。`tools/host/workflowhub-codex-session-event.mjs` 经核实**不含**确认/授权写入点（只是会话生命周期标记工具）。
- **authorize 语义**（决策：不升级 authorize 记录本身）：authorize 落盘的是 `irreversible-authorization.v1`（:593-602），通过 `subject_hash` 引用一条 confirmation——该记录保持不变；用户回复原文经由被引用的 v3 confirmation 获得。若出现**无前置 confirmation 的独立 authorize**（其 subject 引用非 v3 记录），复盘 interventions 中对应介入的 `reply_text` 记 `null`、confidence 不得为 high（如实降级，不伪造）。
- **v3 形态决策**（沿用现状模式，不新增文件）：v2 即代码内联常量、无独立 schema 文件（仓库只有 v1 的 schema 文件，属历史契约保留）；v3 跟随 v2 模式在 task kernel 内联产出，schema 以本 spec §5.5 为准，不新增独立 schema 文件；`runtime/schemas/human-confirmation.v1.schema.json` 保持只读不动。
- **兼容**（FR-CONF-002）：所有读取方（completion-predicates、task-kernel、core/task-close、freshness、canonical-evidence-validators 等现存 v2 消费点）必须只读兼容 v1/v2/v3 三个版本；旧记录不被改写、不要求回填 reply_text；读取旧记录时介入原文能力如实降级（见 FR-OUT-004）。

### 5.6 FR-LESSON-001～004：lessons 索引 `<storageRoot>/Projects/<proj>/lessons/<stage>.jsonl`

按 stage 分文件（Clarify #3），JSONL 每行一个条目，两类行：

**原始观察行**（机器无条件追加，零 AI 成本，复盘失败也保留）：

```json
{ "entry_kind": "raw_observation", "entry_id": "<opaque id>", "observed_at": "<ISO8601>", "task_id": "<task-id>", "stage": "<stage>", "text": "<本 stage 观察原文>", "reflection_ref": "quality/stage-reflection/<stage>.json", "merged": false }
```

**合并行**（仅复盘成功后由复盘器合并去重写回）：

```json
{ "entry_kind": "merged_lesson", "entry_id": "<opaque id>", "merged_at": "<ISO8601>", "stage": "<stage>", "lesson": "<去重后的教训>", "severity": "high|medium|low", "occurrence_count": <int>, "source_refs": [ { "task_id": "<task-id>", "raw_entry_id": "<id>" } ], "supersedes": ["<被合并的 merged entry_id>"] }
```

- 合并写回 = 将同类 raw_observation 归并到 merged_lesson（更新 occurrence_count/source_refs），被合并原始行的 `merged` 置 true；**写回与复盘成功解耦**：失败时只有 raw 行，不产生/不更新 merged 行，不污染既有合并结果（FND-004/D-007）。
- 按项目隔离（路径含 `<proj>`）；条目必须带 task/stage ref；冷启动从零积累，无历史预填（G-003），能力缺失如实展示 unknown。

### 5.7 FR-EDGE-001/FR-EDGE-002：消费边派生规则（补丁 B）

由纯脚本（零 AI 成本）从各 stage 的 step/skill outcome 记录派生，不新增埋点：

- **派生规则**：step/skill X 的 outcome `evidence_refs`（及其声明的产出引用）中任一引用，出现在同任务**后续**任一 step/skill outcome 的 `input_refs` 中 → 记一条消费边 X→Y。step outcome 的 `input_refs`/`evidence_refs` 结构已由 stage-runner 通用校验保证为数组且元素为文本/结构化 evidence（stage-runner.mjs:127-148；adapter 落点 stage-agent-outcome-adapter.mjs:589-591）。
- **保守语义**（FR-EDGE-002）：某产出在派生图中没有任何后续引用 → 该产出的消费状态记 `unknown`，**不得**判为"无用"。引用未登记、记录缺失、历史任务（补丁前数据）一律 `unknown`。
- 派生结果是页面与 remove 门槛的机器信号来源；派生本身可对历史 outcome 只读重算，不回写历史。

### 5.8 FR-GATE-001/FR-GATE-002：remove_candidate 机器门槛

仅当以下**两个机器硬信号同时成立**（∧），复盘器才允许输出 `classification=remove_candidate`：

1. **零消费**：在最近 30 天窗口内，该 step/skill 所有已登记产出在派生消费图中的消费计数为 0。注意：消费状态为 `unknown`（引用未登记/数据缺失）**不等于**零消费——unknown 只能支撑 `needs_evidence`。
2. **人工否定/重复介入**：同一对象在窗口内出现人工 `rejected` 确认，或同一 `step_slug` 上的人工重复介入 ≥ 2 次（阈值初定 2，build-plan 可按实测复核调整并记录理由）。

任一条件不满足 → 只能输出 `needs_evidence`。remove 的最终裁决权在人工复核 + 未来 M16 消融实验（D-006；本任务不做消融，DEFER-002）。

## 6. 页面契约（FR-PAGE-001～006）

- **形态**（FR-PAGE-001/FR-PAGE-006）：纯静态 HTML + data.js 注入模式，无服务依赖；以仓外 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub-monitor.html` 静态模式为蓝本**重建**投影器与页面模板（新模块，登记 `docs/architecture/move-map.json` 并注明替代 ADR 0012 退役条目；写明唯一 consumer=用户浏览器/M16 数据输入、owner、删除条件）。数据源 = 各任务 `quality/stage-reflection/*` + `<storageRoot>/Projects/<proj>/lessons/` 索引。
- **任务视图**（FR-PAGE-002）：
  - 任务头区块：task_id、数据生成时间、数据源覆盖说明。
  - 每 stage 摘要行：stage、stage_status（completed/failed）、复盘 status（ok/degraded/failed）、六类判断计数。
  - 下钻判断明细：subject（step/skill）、classification、severity、confidence、reason、evidence_refs（受控回链）、next_review_trigger。
  - 介入区块：interventions[]（reply_text 原文 + step_slug 锚点 + 归因）；旧记录无原文处显示 unknown。
  - lessons 区块：本任务 lessons_added 引用。
- **overall pending 视图**（FR-PAGE-003）：跨任务待优化问题列表，按 §5.4 聚合分降序；每条字段 = 条目内容、severity、窗口频次、得分、来源 task refs、首见/最近出现时间、建议动作（来自 classification）。
- **筛选**（FR-PAGE-004）：按任务、按 stage、按六类判断（classification）三个基本维度；不做导出/高级可视化（DEFER-003）。
- **状态语义**（FR-PAGE-005）：unknown/unavailable/degraded/failed 如实显示并保留原因，不补零、不猜测、不把 unknown 渲染成"无问题"；页面显著标注所展示内容为 judgment（LLM 判断）而非机器事实；冷启动空数据显示 empty 合法态而非伪造基线（M15 空壳教训）。

## 7. 失败语义（FR-FAIL-001/FR-FAIL-002）

- 复盘失败/超时：`quality/stage-reflection/<stage>.json` 落 `status:failed` + 错误摘要；不阻断 stage 完成、不阻断任务 close（宪法：记录事实而非阻断；指标不当 gate）。
- lessons：原始观察已由机器无条件追加（不丢失）；合并不执行、不写回 merged 行（不污染）。
- 部分输入缺失：`status:degraded`，缺失维度记 unknown。
- 长期复盘失败会积累 unknown/failed，由页面状态可见，交人工介入；不引入任何阻断门。
- 页面投影失败：页面显示 fatal/stale 与原因，不展示陈旧数据冒充新数据。

## 8. 文档与术语交接（FR-DOC-001 / FR-TERM-001）

- **FR-DOC-001**（D-012/F-013③）：修正 agent 操作约定，把四份材料落点写死为 worktree `specs/<task-id>/`——修正清单：`docs/standard-workflow.md:9`、`workflows/make-decision/SKILL.md:58`、build-spec/build-plan 的 SKILL.md 同条款、`AGENTS.md` 治理边界条。代码约定本已正确（`core/artifact-dir.mjs:73,81-82`），零代码改动。m15-retirement 会话的材料迁移由其会话自行执行（F-013④），本任务不动其他任务材料。
- **FR-TERM-001**（OPEN-009 关闭路径）：本 spec 定稿 schema 后，在 build-code 阶段一次性补录 CONTEXT.md 术语：`stage-reflection`、「判断层（judgment）vs 事实层（fact）」。

## 9. 成功/失败边界

- **成功边界**：见速读卡验收信号 + §10 AC 全量通过。
- **失败边界**（任一即本任务失守）：
  1. 把 LLM 判断写成机器事实（违反 R-014/D-005/ADR 0021）；
  2. 页面重成空壳（有字段无真实数据背书，M15 教训）；
  3. 复盘器成为 stage 完成或 close 的阻断门；
  4. remove_candidate 无机器信号支持（违反 D-006/FR-GATE-001）；
  5. 补丁 A/B 验收不通过（FND-D2 处置）。

## 10. 验收清单（AC）

| AC ID | 验收内容 | 绑定 FR / 决策 |
| --- | --- | --- |
| AC-001 | **真实任务端到端**：下一个真实 WorkflowHub 任务从正式入口跑通，每个 authoring stage（含任一失败 stage）均产出合规 `quality/stage-reflection/<stage>.json`；用户审查判断质量后确认 | D-010；FR-TRIG/EXEC/OUT |
| AC-002 | 复盘文件 schema 合规：schema_version/record_kind=judgment/task_id/stage/stage_status/generated_at/status/judgments/interventions/lessons_added 齐备；六类 + needs_evidence 取值合法；无质量打分字段；evidence_refs 指向真实记录 | FR-OUT-001～004 |
| AC-003 | **补丁 A 生效**：真实任务中 confirm 落盘 human-confirmation.v3，含非空 reply_text 与 step_slug；authorize 引用的 confirmation 为 v3 时其 reply_text 可得（authorize 记录本身不变，§5.5 决策）；独立 authorize 无前置 v3 confirmation 时 reply_text 降级为 null 且归因 confidence 非 high；现存全部 v1/v2 历史记录被所有读取方只读兼容（不报错、不改写），以既有 v2 消费点（completion-predicates/task-kernel/task-close/freshness）回归通过为证 | FR-CONF-001～002；D-004；失败边界⑤ |
| AC-004 | **补丁 B 生效**：纯脚本从真实任务 outcome 派生消费边；有被后续 input_refs 引用的产出显示消费边；无引用产出显示 unknown（不判无用） | FR-EDGE-001～002；D-004；失败边界⑤ |
| AC-005 | lessons 生命周期：机器无条件追加 raw_observation（含复盘失败的 stage）；复盘成功后合并去重写回 merged_lesson（occurrence_count/source_refs 正确）；复盘失败时不产生/不更新 merged 行，既有合并结果字节级不变 | FR-LESSON-001～004；成功边界⑤ |
| AC-006 | **页面真实数据验收**：用真实任务复盘产物生成页面，浏览器打开可见任务视图两区块与 overall pending；筛选（任务/stage/六类）生效；unknown/unavailable/failed 如实显示；页面标注 judgment 身份；空数据为 empty 合法态 | FR-PAGE-001～006；失败边界② |
| AC-007 | remove 门槛可证伪：构造/真实场景中，无机器硬信号时复盘器输出 needs_evidence 而非 remove_candidate；两硬信号齐备时才允许 remove_candidate | FR-GATE-001～002；失败边界④ |
| AC-008 | 失败语义：人为使复盘失败一次，验证 status:failed 落盘、stage/close 照常、lessons 原始观察保留且不合并 | FR-FAIL-001～002；D-009 |
| AC-009 | **历史数据只读**：m15 仓外静态三件套与历史任务数据不被写入；m15 历史数据样本可读用于验证投影器但不可写（sha256 比对，沿用 m15-retirement AC-HISTORY-001 口径） | D-008；F-014③ |
| AC-010 | 复盘产物可被纯脚本聚合（投影器与 overall pending 聚合零 AI 成本运行，M0） | FR-PAGE-001；F-004 |
| AC-011 | 过程约束：m15-retirement 合并 main 之后才开工 build-code；build-code 开工前复核 m15 合并后代码状态（RISK-005） | D-008；D-012 |
| AC-012 | 文档与术语：FR-DOC-001 四处文档修正落地；CONTEXT.md 补录 stage-reflection 与判断层/事实层术语 | FR-DOC-001、FR-TERM-001 |

## 11. 宪法对照（FR → 决策/原则绑定）

| FR | 决策 | 宪法/原则承接 |
| --- | --- | --- |
| FR-TRIG-001～002 | D-001 | 薄核心：复用 stage-end step 机制，核心零改动；manifest 强约束 |
| FR-EXEC-001～002 | D-002/D-003 | 简单优先、省 token；自评偏差用 FR-GATE 机器门槛兜底 |
| FR-OUT-001～004 | D-005 | 判断层身份写死（R-014/ADR 0021），judgment≠fact；禁止质量打分（质量裁决归 review，禁止自审自判） |
| FR-SEV-001～002 | OPEN-007/D-005 | 可证伪：刻度与公式写明，实际为假时能被检查出来 |
| FR-CONF-001～002 | D-004 补丁 A | 禁止双写：单写入源升级；旧记录只读兼容（provenance 保留） |
| FR-EDGE-001～002 | D-004 补丁 B | D28/M0：纯脚本派生零 AI 成本；采不到记 unknown 不猜测 |
| FR-LESSON-001～004 | D-007 | 记录事实而非阻断；写回与成败解耦防污染；来源保留（source_refs） |
| FR-GATE-001～002 | D-006 | 简单优先可证伪；最危险结论必须机器信号支撑 |
| FR-FAIL-001～002 | D-009 | 指标不当 gate；复盘失败不阻断 |
| FR-PAGE-001～006 | D-008 | 新控制面登记：move-map 写明唯一 consumer/owner/替代关系/删除条件；unknown/unavailable 不伪造 |
| FR-DOC-001 | D-012 | 四份材料落点约定恢复；代码零改动 |
| FR-TERM-001 | OPEN-009 | 术语固化在 schema 定稿后，避免过早固化 |

## 12. 延期交接

| ID | 内容 | 状态 |
| --- | --- | --- |
| OPEN-007 | severity 刻度/频次窗口/排序公式 | **本 spec 关闭**（§5.4：三档 + 权重 3/2/1 + 30 天窗口） |
| OPEN-008 | 判断文件字段 schema 定稿 | **本 spec 关闭**（§5.1～5.3 草案，build-plan 落正式 schema 文件） |
| OPEN-009 | CONTEXT.md 术语补录 | 交接 build-code 执行（FR-TERM-001，schema 已定稿） |
| DEFER-001 | M16 候选池/迭代入口/负例库 | 后续独立任务（依赖本任务 + m15-retirement 产出） |
| DEFER-002 | 消融实验体系（with/without 定案 remove/merge） | M16 / 后续任务；remove 最终裁决权归此 |
| DEFER-003 | 页面可视化增强（导出/高级筛选） | 后续；非 M16 输入必需 |
| RISK-001 | 主会话自评偏差 | 缓解已入设计（FR-GATE + confidence 展示 + M16 消融） |
| RISK-002 | 冷启动 lessons 空/消费边 unknown | 如实标注（SCN-006） |
| RISK-003 | 消费边漏检 | 保守规则（FR-EDGE-002） |
| RISK-004 | v3 迁移影响确认流程 | FR-CONF-002 兼容策略 + AC-003 回归 |
| RISK-005 | m15 方案再变 | 顺序约束（AC-011）+ build-code 前复核 |

## 13. 独立审查事实与处置

- **transport 事实**：build-spec 冻结材料审查，status=unavailable / outcome=partial；provider_results：kimi/coding completed（3 findings）；opencode/v4flash failed（PUBLIC_RESULT_INVALID）；codex/luna failed（PUBLIC_RESULT_INVALID）。partial 不是通过，保留一条语义建议事实，不重试。
- **finding 处置**：

| finding | 内容 | status | 处置 |
| --- | --- | --- | --- |
| FND-S1（major） | D30 引用不可追溯（决策材料中无 D30 定义） | **fixed** | 全部 D30 裸引用改为 R-014/D-005/ADR 0021（§5.1、§9、§11） |
| FND-S2（major） | AC-003 与 §5.5 矛盾（authorize 是否产 v3） | **fixed** | 决策写死：authorize 记录（irreversible-authorization.v1）不升级，原文经被引用 v3 confirmation 获得；独立 authorize 降级；AC-003 同步改写 |
| FND-S3（minor） | R-013 市面调研未在 spec 收口 | **fixed** | §2 非目标节显式处置（make-decision 已完成，非 spec 交付物） |
