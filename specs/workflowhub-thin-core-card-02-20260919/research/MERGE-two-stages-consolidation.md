# MERGE：build-spec + build-plan 两阶段合并为一阶段 · 技能与机制合并账

- **任务**：workflowhub-thin-core-card-02-20260919（CARD-02）；本报告回应 T-036 / OI-009 的裁定，纠正 T-011 的「8 条质量核心各自成为独立技能」错误表述。
- **方法**：只读静态分析。实际列出 `skills/` 全部 39 个技能目录并读取各自 `SKILL.md` 的 Purpose/职责段；实际读取 `workflows/build-spec/`、`workflows/build-plan/` 的 `steps.json` 与 `skill-deps.yaml`；读取 I-B 报告全文、旧规划 decision-log（OI-001/OI-003/OI-012/OI-013、D-001、SD-07/SD-08/SD-17）与 card-02 decision-log（T-004/T-011/T-036、V-21/V-23）。
- **用户裁定（T-036 L1176 原话）**：「为什么会新增这么多标准和技能？不是应该替换合并原来的技能吗？怎么可能单纯新增？两个stage合并成1个，怎么可能纯新增？」
- **结论一句话**：合并账成立——28 步合并为 13 步，26 项质量机制全部有语义承接者，K1–K12 无一项「无承接者」；**真正需要新建的技能数 = 0**，需要新建的控制面 = 0；需要的是对 6–8 个**现有技能**做职责合并/改造，加 1 份新合并阶段定义与 1 份模板合并。

---

## 0. 基线事实（可复核）

### 0.1 实际技能目录（`ls skills/` 结果，39 个）

```
anysearch, backend-testing, debate, decision-log, deep-research, design-source-readiness,
diagnosing-bugs, dsh-code-review, frontend-component-quality, frontend-prototype-render,
frontend-testing, fullstack-slice-testing, grill-with-docs, intake-decision-review,
isolated-browser-qa, mini-task, plan-ceo-review, plan-design-review, plan-eng-review,
requirement-lineage, resolving-merge-conflicts, review, simplicity-guard, spec-analyze,
spec-clarify, spec-plan, spec-prd, spec-research, spec-specify, spec-tasks,
stage-handoff, stage-reflection, talk-with-zhipeng, test-routing-advisor,
testing-system-blueprint, ui-project-init, wh-review, workflowhub-host-protocol,
workflowhub-multica-sync
```

（`ls skills/` 实际输出，2026-09-20 读取。`spec-*` 全部带 `SKILL.md`；无任何技能目录名为 `K1`–`K12` 或「需求翻译」「双向追溯」「AC 四段式」等 T-011 设想的「8 条质量核心技能」。）

### 0.2 两阶段现状（与 I-B 报告一致）

| 维度 | build-spec | build-plan |
| --- | --- | --- |
| 步骤 | 15（`steps.json` L5–L19） | 13（`steps.json` L5–L17） |
| 质量机制 | 14（I-B §1.4） | 12（I-B §2.4） |
| 独占能力 | 5（I-B §1.5） | — |
| 权威产物 | `spec.md` | `plan.md` + `tasks.md` |
| 技能依赖 | 13 条 `skill-deps.yaml` L5–L17 | 12 条 `skill-deps.yaml` L3–L14 |

### 0.3 计数口径

- 「步骤」= `steps.json` 的 `step_slug` 条目；`on_stage_end` 的 stage-reflection 也计入。
- 「质量机制」= I-B §1.4 的 14 项 + §2.4 的 12 项，共 26 项。
- 去向四值：`保留`（职责与载体基本不变地进入新阶段）、`合并到 X`（与另一阶段同名/同义项合并为一项）、`改造为 Y`（职责保留，但载体/形态改变：独立步骤→审查 packet 内透镜、双写→单写、哈希绑定→纯文本引用）、`删除（依据）`。
- 「净新增」= 新阶段条目数 −（保留 + 合并后留在新阶段的条目数）；本报告的净新增按「是否产生全新技能/全新控制面」与「步骤数是否超出合并后单阶段基线」双口径给出。

---

## 第 1 部分：K1–K12 → 现有技能的映射表

> K1–K12 取自 I-B 报告 §4（L214–L227）。「现有承接技能 Purpose 原文摘要」均为实际读取 `skills/<name>/SKILL.md` 的首段（description 或 `#` 后首段）摘录。

| K# | 机制名 | 现有承接技能（含 Purpose/职责原文摘要） | 映射判定 | 需要的改造 | 是否必须新建 |
| --- | --- | --- | --- | --- | --- |
| K1 | 需求翻译完整性 + 未溯源回退 | `spec-specify` — "Draft a specification from frozen decision material using controlled artifact callbacks." / "Input is decision/scope content plus controlled `readArtifact(name)` and `writeArtifact(name, content)` callbacks supplied by build-spec."（SKILL.md L2、L7–L10）；缺口 owner 为 `make-decision`/`decision-log` — "Receive original requirement, confirmed direction, constraints, rejected alternatives, risks, and a controlled TaskHandle record callback from make-decision."（decision-log SKILL.md L6–L8） | 完全覆盖 | 无（`spec-specify` L80–L88 已含「无来源 FR = 新需求回 make-decision」） | 否 |
| K2 | 稳定 ID + 双向追溯闭环 | `spec-specify`（稳定 ID/AC 命名，L49–L55）+ `spec-plan` — "Turn the current decision and specification into a minimal, executable implementation plan."（L2，含 plan→task 双向追溯）+ `spec-tasks` — "Project the current plan into compact, dependency-ordered implementation cards."（L2，含映射与投影规则）+ `requirement-lineage`（审计谱系） | 完全覆盖 | 追溯表由 plan.md 迁到 phase 差异文档后，更新 `spec-plan` 的追溯节锚点 | 否 |
| K3 | AC 四段式可执行验收 | `spec-specify`（`验证：/通过：/失败：/证据：` 四标签，I-B §1.6 引 L35–L39）；模板 `skills/spec-specify/templates/spec-template.md` L160–L169 | 完全覆盖 | 按 card-02 T-006（L555–L564）把 AC 词表升级为「条件→行为→可度量标准→失败场景 + 不可判定词黑名单」；仍是 `spec-specify` 内改造，非新技能 | 否 |
| K4 | 场景与状态覆盖矩阵 | `spec-specify` + `spec-template.md` L52–L72（八态清单） | 完全覆盖 | 无 | 否 |
| K5 | 唯一 Clarify 交互 + 十维度完整性检查 | `spec-clarify` — "Resolve material ambiguity in supplied specification content." / "Receive the current `spec.md`, accepted upstream decision material, and controlled named-artifact callbacks from build-spec."（L2、L7–L9；含三类陈述分类、`trigger=false`、十维度检查 L79–L88） | 完全覆盖 | 仅改归属：调用入口由 build-spec 改为新 build-plan（T-005 L548–L553）；删除 receipt 哈希绑定（OI-013） | 否 |
| K6 | 一次独立异源审查 + findings 四态处置 | `wh-review` — "`wh-review` does one thing: review the bytes submitted in the current call with the current stage's review prompt."（L15–L17）+ `review` — "Report-only independent review lens for correctness, scope, evidence, and unresolved risk."（L2） | 完全覆盖 | 按 OI-014（L462–L478）把原 spec 审查与原 plan 审查合并为**一次**；透镜作为 packet 内 lens | 否 |
| K7 | stage-end spec-analyze 跨材料语义一致性 | `spec-analyze` — "Report-only packet lens for consistency between supplied specification, plan, and task excerpts." / "This skill owns the single stage-end semantic check and its quality-fact contract for the four authoring stages."（L2、L9–L11） | 完全覆盖 | 输入由「原始需求+decision+spec」（build-spec 轨）与「四材料」（build-plan 轨）合并为一次调用，覆盖合并后的材料集 | 否 |
| K8 | 顾问透镜组：simplicity-guard / plan-eng-review / plan-design-review（+ plan-ceo-review） | `simplicity-guard` — "这是一个放入 wh-review 冻结 packet 的只读 advisory lens/skill，不产 stage-result"（L9–L11）；`plan-ceo-review` — "Report-only product-direction review lens for premise, scope, leverage, alternatives, and delivery risk."；`plan-eng-review` — "Report-only engineering-plan lens for sequencing, boundaries, failure modes, and verification."；`plan-design-review` — "Report-only UI design lens for information architecture, states, accessibility, and responsive behavior." | 完全覆盖 | 四者由「各自独立成步」改为注入同一次合并审查的 packet（I-B §5.2 L262；四者 SKILL 均声明 packet-local/advisory） | 否 |
| K9 | RED/GREEN 可证伪对 + 精确文件边界 | `spec-plan`（RED/GREEN 同 gate_cmd 同 oracle、`NEW/MODIFY/DO NOT TOUCH`，L70–L78、L114–L132）+ `spec-tasks`（卡内 gate_cmd/expected_exit/oracle/evidence_path，L94–L118） | 完全覆盖 | 删除 `versioned_refs` 哈希与 `acceptance_data` 机器 JSON（OI-013），保留三清单与 RED/GREEN 语义 | 否 |
| K10 | 测试蓝图 + 测试路由判类 | `testing-system-blueprint` — "这是 build-plan 的测试设计输入，不是测试通过门；它只负责把风险维度、场景、oracle、证据路径和覆盖限制折叠进 `plan.md`/`tasks.md`。" + `test-routing-advisor` — "独立读取调用方传入的 `changed_files`、`phase_count`、`test_command` 和阶段标识……只判类，不执行测试。" | 完全覆盖 | 输出目标由 `plan.md`/`tasks.md` 双写改为单一 phase 差异文档 | 否 |
| K11 | 阶段末逐项遗漏披露 + 阶段复盘 | `stage-reflection` — "本技能在当前正式 stage 的步骤结束时由当前主会话执行一次。它回答：哪些 step/skill 帮助了工作、需要改进、造成阻塞、引发人工介入、应该简化，以及现在就能简化什么。"（L9–L13）；「逐项遗漏披露」现由 `workflows/build-spec/SKILL.md` L41–L63 与 `workflows/build-plan/SKILL.md`「阶段末遗漏披露」节内联协议承接（无独立 SKILL） | **部分覆盖（缺独立的、可搬运的「逐项披露」契约文件）** | 两条路：①把披露协议并入 `stage-reflection` 的输入/输出节（推荐）；②下沉为阶段模板中的固定小节。**都不需要新技能** | 否 |
| K12 | 人工确认（真实用户回复） | 无独立技能。现由 `workflows/build-plan/SKILL.md`「Boundaries: no direction replay」节（L103–L117）+ `steps.json` step 12 `publish-plan-result` 的 `human-confirmation.v3` 协议 + 官方 handler consumer 承接 | **部分覆盖（无独立技能文件）** | 保留内联协议与 handler consumer；按 OI-013 把 `quality/confirmations/<sha256>.json` 的哈希命名改为普通文件名 | 否 |

### 1.1 K1–K12 计数

| 判定 | 数量 | K# |
| --- | --- | --- |
| 完全覆盖 | 10 | K1, K2, K3, K4, K5, K6, K7, K8, K9, K10 |
| 部分覆盖 | 2 | K11, K12 |
| 无承接者 | **0** | — |
| 合计 | 12 | — |

> 关键结论：K11/K12 的「部分覆盖」缺的是**一个可搬运的 SKILL.md 文件**，不是缺能力——两者当前都已有内联协议 + 真实 consumer。把它们做成独立技能属于「换个存放位置」（V-23 L922–L925 明令禁止），因此判定为**不新建**。

---

## 第 2 部分：28 步（15+13）→ 新阶段步骤的合并账

### 2.1 逐项去向表

| 原步骤（阶段 + 步号 + slug） | 去向 | 新阶段落点 |
| --- | --- | --- |
| build-spec #1 `read-decision-log` | 合并到 read-current-materials | 新 build-plan 步骤 1（吸收，仅读 decision-log/PRD） |
| build-spec #2 `conditional-spec-research` | 合并到 conditional-spec-research | 新 build-plan 步骤 2（与 build-plan #2 同一职责，去重） |
| build-spec #3 `spec-clarify` | 保留 | 新 build-plan 步骤 3（唯一 Clarify，T-005） |
| build-spec #4 `spec-specify` | 改造为 spec 翻译 + 定稿 | 新 build-plan 步骤 4（吸收 freeze-spec 的定稿语义） |
| build-spec #5 `simplicity-guard` | 改造为合并审查内 advisory lens | 新 build-plan 步骤 9（packet 内 lens，不再独立成步） |
| build-spec #6 `plan-ceo-review` | 改造为合并审查内 advisory lens | 新 build-plan 步骤 9（packet 内 lens） |
| build-spec #7 `ui-project-init` | 保留（条件 UI） | 新 build-plan 步骤 5（条件 UI readiness） |
| build-spec #8 `design-source-readiness` | 合并到条件 UI readiness | 新 build-plan 步骤 5（与 ui-project-init 同步调用） |
| build-spec #9 `conditional-plan-design-review` | 改造为合并审查内 plan-design-review lens | 新 build-plan 步骤 9（保留 UI 预览/截图/人工确认事实） |
| build-spec #10 `freeze-spec` | 合并到 spec 翻译定稿 | 新 build-plan 步骤 4（I-B §5.2 L260：定稿语义并入，不作独立 step 与机器门） |
| build-spec #11 `review-frozen-spec` | 合并到 merged-review | 新 build-plan 步骤 9（OI-014 一次合并审查） |
| build-spec #12 `main-agent-disposes-findings` | 合并到 main-agent-disposes-findings | 新 build-plan 步骤 10（与 build-plan #10 同一步） |
| build-spec #13 `stage-end-spec-analyze` | 合并到 final-spec-analyze | 新 build-plan 步骤 11（两处 spec-analyze 合一，一次 report-only） |
| build-spec #14 `publish-spec-result` | 合并到 publish-result-and-confirm | 新 build-plan 步骤 12（大白话交接 + 人工确认合一次） |
| build-spec #15 `stage-reflection` | 合并到 stage-reflection | 新 build-plan 步骤 13（与 build-plan #13 同一步） |
| build-plan #1 `read-current-materials` | 保留 | 新 build-plan 步骤 1（吸收 build-spec #1） |
| build-plan #2 `conditional-spec-research` | 保留 | 新 build-plan 步骤 2（吸收 build-spec #2） |
| build-plan #3 `testing-system-blueprint` | 保留 | 新 build-plan 步骤 7 |
| build-plan #4 `spec-plan` | 保留（改造为单写） | 新 build-plan 步骤 6（吸收 spec-tasks；删除 plan/tasks 双写） |
| build-plan #5 `simplicity-guard` | 改造为合并审查内 advisory lens | 新 build-plan 步骤 9（与 build-spec #5 同一 lens，去重） |
| build-plan #6 `plan-eng-review` | 改造为合并审查内 advisory lens | 新 build-plan 步骤 9 |
| build-plan #7 `test-routing-advisor` | 保留 | 新 build-plan 步骤 8 |
| build-plan #8 `spec-tasks` | 合并到 spec-plan 单写 | 新 build-plan 步骤 6（phase 差异文档直接承担任务卡职责，D1） |
| build-plan #9 `review-plan` | 合并到 merged-review | 新 build-plan 步骤 9（与 build-spec #11 合并，OI-014） |
| build-plan #10 `main-agent-disposes-findings` | 保留 | 新 build-plan 步骤 10（吸收 build-spec #12） |
| build-plan #11 `final-spec-analyze` | 保留 | 新 build-plan 步骤 11（吸收 build-spec #13） |
| build-plan #12 `publish-plan-result` | 保留 | 新 build-plan 步骤 12（吸收 build-spec #14） |
| build-plan #13 `stage-reflection` | 保留 | 新 build-plan 步骤 13（吸收 build-spec #15） |

### 2.2 合并账计数（列表即计数）

**保留 11 步**
1. build-spec #3 `spec-clarify`
2. build-spec #7 `ui-project-init`
3. build-plan #1 `read-current-materials`
4. build-plan #2 `conditional-spec-research`
5. build-plan #3 `testing-system-blueprint`
6. build-plan #4 `spec-plan`
7. build-plan #7 `test-routing-advisor`
8. build-plan #10 `main-agent-disposes-findings`
9. build-plan #11 `final-spec-analyze`
10. build-plan #12 `publish-plan-result`
11. build-plan #13 `stage-reflection`

**合并 11 步**
1. build-spec #1 → 步骤 1
2. build-spec #2 → 步骤 2
3. build-spec #8 → 步骤 5
4. build-spec #10 → 步骤 4
5. build-spec #11 → 步骤 9
6. build-spec #12 → 步骤 10
7. build-spec #13 → 步骤 11
8. build-spec #14 → 步骤 12
9. build-spec #15 → 步骤 13
10. build-plan #8 → 步骤 6
11. build-plan #9 → 步骤 9

**改造 6 步**
1. build-spec #4 `spec-specify`（承载 spec + 定稿）
2. build-spec #5 `simplicity-guard`（→ packet lens）
3. build-spec #6 `plan-ceo-review`（→ packet lens）
4. build-spec #9 `conditional-plan-design-review`（→ packet lens + UI 预览事实）
5. build-plan #5 `simplicity-guard`（→ packet lens，与 build-spec #5 去重）
6. build-plan #6 `plan-eng-review`（→ packet lens）

**删除 0 步**

> 说明：没有任何旧步骤被整体丢弃——两阶段 28 步全部在合并后有语义落点。被删的是步骤外面的机器外壳与重复声明（见第 6 部分），不是步骤职责本身。这正是「合并而非新增/删除」的实证。

### 2.3 净新增计数

| 口径 | 数值 |
| --- | --- |
| 旧两阶段步骤总数 | 28（15 + 13） |
| 合并后新 build-plan 步骤数 | **13** |
| 净减少 | −15 |
| 相对旧 build-plan 单阶段基线的净新增 | **0**（13 = 13） |
| 合并派生出的全新步骤 | 1（步骤 9 `merged-review`）——但它是 6 个旧步骤 + 5 个透镜的合并产物，不是新增能力 |
| 净新增步骤（去掉合并来源后无来源的步骤） | **0** |

---

## 第 3 部分：14 + 12 项质量机制的合并账

### 3.1 build-spec 14 项（I-B §1.4）

| 编号 | 机制 | 去向 | 依据 |
| --- | --- | --- | --- |
| BS-M1 | 决策溯源绑定（FR/AC → `R*/D*` + `source_status`） | 保留（`spec-specify`） | K1；OI-001 L197 保留真实需求链路 |
| BS-M2 | 稳定 ID 与双向追溯 | 保留（`spec-specify` + `spec-plan`） | K2；OI-001 L197「一份权威 spec + 每 phase 只写差异 + 紧凑索引」 |
| BS-M3 | AC 四段式可执行验收 | 改造（`spec-specify`，词表按 T-006 升级） | card-02 T-006 L555–L564；OI-004 验收可执行 |
| BS-M4 | 场景与状态矩阵（八态） | 保留（`spec-specify` 模板） | K4 |
| BS-M5 | PFACT 四态事实层 | 保留（`spec-specify` 模板） | K1/K2；I-B §1.6 |
| BS-M6 | 唯一 Clarify 交互 | 保留（`spec-clarify`，入口迁 build-plan） | card-02 T-005 L548–L553 |
| BS-M7 | Clarify 十维度完整性检查 | 保留（`spec-clarify` L79–L88） | K5 |
| BS-M8 | 一次独立 findings 审查 | 合并（与 BP-M7 合为一次） | OI-014 L462–L478；SD-07 L54① |
| BS-M9 | findings 四态处置（fixed/rejected_invalid/accepted_risk/needs_human） | 保留（主会话文本处置步 10） | I-B §5.1 L250；D-001 L666 |
| BS-M10 | stage-end spec-analyze 严格一致性检查 | 合并（与 BP-M8 合为一次） | K7；I-B §7.3 |
| BS-M11 | simplicity-guard 四阶梯 | 改造（独立 step → packet lens） | I-B §5.2 L262；`simplicity-guard` L9–L13 |
| BS-M12 | plan-ceo-review 方向透镜 | 改造（独立 step → packet lens） | I-B §5.2 L262；`plan-ceo-review` L8–L11 |
| BS-M13 | 条件 UI 路径（UI Contract） | 保留（条件 UI readiness 步骤 + `plan-design-review` lens） | K4；I-B §1.5 |
| BS-M14 | 项目标准源边界（Design.md/Experience.md 的 hash/revision/anchor 绑定） | 改造（删 hash/revision 校验，保留纯文本锚点与语义） | OI-013 L445「彻底全删」；D2 L240；OI-003 L241 损失清单 |

### 3.2 build-plan 12 项（I-B §2.4）

| 编号 | 机制 | 去向 | 依据 |
| --- | --- | --- | --- |
| BP-M1 | 测试系统蓝图 | 保留（`testing-system-blueprint`） | K10 |
| BP-M2 | RED/GREEN 可证伪对 | 保留（`spec-plan`/`spec-tasks`→合并后的单文档） | K9；OI-004 L262「改动前是红的」 |
| BP-M3 | 精确文件边界三清单 | 保留（`spec-plan`） | K9；T-007 复用为预写测试禁改边界 |
| BP-M4 | 依赖、顺序与并行 | 保留（phase 差异文档头部声明 + 紧凑索引） | card-02 T-010 L601–L609；SD-11 L69–L71（降级为事实记录） |
| BP-M5 | 测试路由判类 | 保留（`test-routing-advisor`） | K10 |
| BP-M6 | 双向追溯映射（source→FR→AC→task→oracle） | 保留（`spec-plan` 单文档） | K2 |
| BP-M7 | 一次独立 plan 审查 | 合并（与 BS-M8 合为一次） | OI-014；SD-07① |
| BP-M8 | final-spec-analyze 严格收尾 | 保留（与 BS-M10 合为一次调用） | K7 |
| BP-M9 | STOP 条件 | 保留（`spec-plan`/`spec-tasks`） | I-B §2.4-9 |
| BP-M10 | Phase 交接块（plan 与 tasks 各写同一事实） | 改造（合并为单文档的一套 phase 块，删重复声明） | D1 L239；D5 L243；OI-001 L197 |
| BP-M11 | 人工确认（human-confirmation.v3） | 保留（去 `<sha256>` 哈希命名） | K12；OI-012 L424 两道人为门；OI-013 L445 普通文件名 |
| BP-M12 | 条件 UI Component Quality Map | 保留（`frontend-component-quality`） | I-B §2.4-12；T-010 |

### 3.3 机制合并账计数

| 去向 | 数量 | 编号 |
| --- | --- | --- |
| 保留 | 18 | BS-M1,2,4,5,6,7,9,13 + BP-M1,2,3,4,5,6,8,9,11,12 |
| 合并 | 3 | BS-M8, BS-M10, BP-M7 |
| 改造 | 5 | BS-M3, BS-M11, BS-M12, BS-M14, BP-M10 |
| 删除（顶层机制） | **0** | — |
| 合计 | 26 | 14 + 12 |

### 3.4 被删除的是「机器外壳」，不是机制语义（D1–D5，I-B §5）

> 这 5 项是 I-B §5 明确列出、并经 OI-003/OI-013/D-001 授权的删除面；它们不在这 26 项顶层机制里，而是围绕机制建造的重复层与校验机器。

| # | 删除项 | 判定 | 依据（原文锚点） |
| --- | --- | --- | --- |
| D1 | `plan.md` / `tasks.md` 双写及相等性协议 | 删除 | D-001 L638「删除 plan.md/tasks.md 双写及其相等性协议」；OI-001 L197 收敛为「一份权威 spec + 每 phase 只写差异 + 紧凑索引」 |
| D2 | 哈希/快照/身份/材料/回执校验机器 | 删除 | OI-013 L445「彻底全删……普通文件名+纯文本引用」；D-001 L666「多层重复 evidence 包装」 |
| D3 | stage completion 通用认证 / task kernel / fact graph 强制依赖 | 删除（保留语义、去机器认证） | D-001 L666 点名；OI-003 L241「删除通用事实引擎前必须先承认真实损失清单」 |
| D4 | 固定 Talk 轮次、14 步顺序锁定、强制每 Phase review/handoff/不变路线重选、只保护流程形状的测试 | 删除（合并为一次） | OI-001 L197 原文；OI-014 合并审查；D-001 L666 |
| D5 | 重复 evidence 包装层与冗余 profile/兼容层 | 删除/合并 | OI-003 L241「删除多层重复 evidence 包装」；OI-013 L445 记录层改普通文件名；D-001 L666 |

> 合并账净结果：26 项质量机制**语义零丢失**（保留 18 + 合并 3 + 改造 5），删除 5 个机器/重复外壳。机制层面**新建 0 项**。

---

## 第 4 部分：真正「新建」的最小集

### 4.1 汇总：`无承接者` 项 = 0

K1–K12 中没有一项是「无承接者」。K11、K12 是「部分覆盖」——它们缺的是一份独立 SKILL.md，而不是缺能力。因此：

> **真正需要新建的 SKILL 数 = 0；真正需要新建的控制面 = 0；真正需要新建的 stage = 0。**

### 4.2 逐项说明 K11、K12「若新建」的代价与不新建的替代做法

#### K11 阶段末逐项遗漏披露

- **它是什么**：阶段结束时按 `steps.json` manifest 逐项报告执行状态/产物存在性/完成判据，区分「未启动/跳过/产物缺失/完成判据缺失/unknown/unavailable」，并附六区块复盘。
- **为什么现有技能承接不了（Purpose 原文）**：`stage-reflection` 的 Purpose 是"它回答：哪些 step/skill 帮助了工作、需要改进、造成阻塞、引发人工介入、应该简化，以及现在就能简化什么"——它管**判断**，不管**逐项执行状态清点**；逐项披露目前在 `workflows/build-spec/SKILL.md` L41–L63 与 `workflows/build-plan/SKILL.md`「阶段末遗漏披露」节以**阶段内联协议**存在，没有独立文件。所以严格的「独立可搬运技能」意义上确实缺一个 SKILL.md。
- **若新建需要什么**：`skills/per-step-disclosure/SKILL.md` + `skill-deps.yaml` 声明 + consumer（`stage-runner#runStageEndReflection` 或 `officialStageHandler`）+ 测试 + 删除条件。这正是 T-011 曾暗示的「8 条中的一条」。
- **新建的代价（对照 V-21）**：V-21 L915「不要搞这么多流程、质量、文件！」；V-23 L922–L925「每项新增规则必须给出当前缺陷或用户结果理由，不得只换存放位置」。现有披露协议已在两个 stage 的 SKILL.md 内真实运行，把它抽成技能**只换存放位置**，不改变任何可观察结果，反而 +1 技能、+1 依赖声明、+1 consumer、+1 需要维护的合同；且它与 `stage-reflection` 的调用时机完全重叠（都是 `on_stage_end`）。
- **不新建的替代做法**：把披露协议**并入 `stage-reflection` 的输入/输出节**（该技能已是 `on_stage_end` 唯一挂载点，且其输入已含 steps/facts），并在阶段模板里放一个固定小节。**结论：改造 `stage-reflection`，不新建。**

#### K12 人工确认（真实用户回复）

- **它是什么**：build-plan 完成后大白话展示，取得用户真实回复并发布 `human-confirmation.v3`，交官方 handler 校验 ref；缺失 review 事实不阻断继续。
- **为什么现有技能承接不了（Purpose 原文）**：仓库 39 个技能中没有任何一个的 Purpose 涉及用户确认/发布确认记录。`wh-review` 的 Purpose 是"review the bytes submitted"，`stage-handoff` 的 Purpose 是"生成当前、可复制的阶段交接包"——都不写用户回复。当前确认逻辑在 `workflows/build-plan/SKILL.md` L103–L117 + `steps.json` #12 内联。
- **若新建需要什么**：`skills/human-confirmation/SKILL.md` + `skill-deps.yaml` + handler consumer + 确认记录写入路径。
- **新建的代价（对照 V-21）**：这是**两道人为门之一**（OI-012 L424），本来就是「人在回路里的动作」，不是可独立搬运的机器能力；抽成技能会把「人确认」变成「技能调用」，与 SD-17「零机器门禁」的取向相反。且它天然需要主会话交互上下文（ask→wait→reply），不是可搬运的纯函数。
- **不新建的替代做法**：保留为阶段内联协议 + 现有 handler consumer；按 OI-013 把 `<sha256>.json` 改成普通文件名；把交接文案部分复用 `stage-handoff`。**结论：保留内联 + handler，不新建。**

### 4.3 真正需要「新建」的非技能产物（最小集）

| 项 | 性质 | 为什么必须动 | 不新建的替代 |
| --- | --- | --- | --- |
| 合并后的 `workflows/build-plan/SKILL.md` | 阶段定义（非技能） | 新四阶段拓扑只有一个 build-plan；需要承载 spec + phase 双语义 | 不可替代（stages 目录约定） |
| 合并后的 `workflows/build-plan/steps.json`（13 步） | 阶段 manifest | 28→13 的落点 | 不可替代 |
| 合并后的 `workflows/build-plan/skill-deps.yaml` | 依赖声明 | 原两阶段 25 条依赖去重合并 | 不可替代 |
| phase 差异文档模板（单写，替代 plan-template + tasks-template 双写） | 模板层 | D1 删除双写 | **改造** `skills/spec-plan/templates/plan-template.md` 或 `spec-tasks/templates/tasks-template.md` 之一，保留另一份作历史；不新建第三份模板 |
| AC 四段式词表升级（T-006） | 模板/技能内规则 | 用户已裁定四段式 + 黑名单 | 改造 `spec-template.md`，不新建 |

> 汇总：**新建技能 0、新建 stage 0、新建控制面 0、新建模板 0（全部由现有模板改造）**。需要动的是 6–8 个现有技能与 3 个阶段文件。

### 4.4 需要改造的现有技能清单（不是新建）

| 技能 | 改造内容 | 依据 |
| --- | --- | --- |
| `spec-specify` | ①AC 词表升级为 T-006 四段式 + 黑名单；②承载 spec 定稿/freeze 语义；③删除 packet hash/revision 强制绑定 | T-006；BS-M3/BS-M14；OI-013 |
| `spec-clarify` | 调用入口由 build-spec 改为 build-plan；删除 receipt 哈希/快照绑定 | T-005；OI-013 |
| `spec-plan` | 唯一文档写者（吸收 spec-tasks 的卡投影）；追溯/phase 块单写；删除 `versioned_refs` 哈希 | D1；OI-013 |
| `spec-tasks` | 职责并入 `spec-plan`（保留技能文件作可搬运能力，但新阶段不再双写调用）；或改造为「phase 差异文档渲染器」 | D1；BP-M10 |
| `spec-analyze` | 单次调用覆盖合并后的材料集（decision-log/PRD + spec + phase 文档） | K7；I-B §7.3 |
| `wh-review` | 承载一次合并审查（同时覆盖 spec 与 phase 两类质量核心）；透镜入 packet | OI-014；SD-07① |
| `stage-reflection` | 吸收「逐项遗漏披露」输出节 | K11；SD-17 |
| `ui-project-init` / `design-source-readiness` / `frontend-component-quality` | 条件 UI 路径合并为一个 readiness 步骤 + 一次审查 lens；删 hash 绑定 | BS-M13/BS-M14；OI-013 |

---

## 第 5 部分：合并后的新 build-plan 形态

### 5.1 新步骤清单（有序，13 步）

executor 记号：**M** = 主会话直接执行（inline 技能/交互）；**S** = 子代理独立上下文；**B** = 后台作业。

| # | step_slug | 作用 | executor | 调用技能（优先现有） | 来源（合并账） |
| --- | --- | --- | --- | --- | --- |
| 1 | `read-current-materials` | 读 portable 包 + decision-log（+PRD，若有） | M | `workflowhub-host-protocol`（内联） | P1 保留 + BS1 合并 |
| 2 | `conditional-spec-research` | 事实不足才研究；否则记 skipped+理由 | S | `spec-research` | P2 保留 + BS2 合并 |
| 3 | `spec-clarify` | 唯一澄清流：一批独立问题 + 真实 ask→wait→reply→resume | M | `spec-clarify` | BS3 保留 |
| 4 | `spec-specify` | 生成行为规格并定稿（含 freeze 语义、AC 四段式、PFACT、八态、来源绑定） | S | `spec-specify` | BS4 改造 + BS10 合并 |
| 5 | `conditional-ui-readiness` | UI 时建立 new/legacy 边界 + Screen Read Map + 原型预览事实；非 UI 记 N/A | S | `ui-project-init`, `design-source-readiness`, `frontend-prototype-render` | BS7 保留 + BS8 合并 |
| 6 | `spec-plan` | 产**单一** phase 差异文档（含任务卡：Goal/Files/AC/FR/RED-GREEN/命令/oracle/证据/STOP/rollback + 写集/依赖声明 + 双向追溯 + 文件边界三清单） | S | `spec-plan`（吸收 `spec-tasks` 投影规则） | P4 保留 + P8 合并 |
| 7 | `testing-system-blueprint` | 每个行为 phase 的风险维度/场景/oracle/命令/证据/覆盖限制 | S | `testing-system-blueprint` | P3 保留 |
| 8 | `test-routing-advisor` | 按预计改动判 simple/feature/fullstack | S | `test-routing-advisor` | P7 保留 |
| 9 | `merged-review` | **一次**合并审查：spec 质量核心 + plan 质量核心；`wh-review` 冻结发送，packet 内注入透镜 | B | `wh-review` + `simplicity-guard` + `plan-ceo-review` + `plan-eng-review` + `plan-design-review` + `review` + `frontend-component-quality`（UI） | BS11 合并 + P9 合并 + BS5/BS6/BS9/P5/P6 改造为 lens |
| 10 | `main-agent-disposes-findings` | 逐条处置 fixed/rejected_invalid/accepted_risk/needs_human | M | （内联协议） | P10 保留 + BS12 合并 |
| 11 | `final-spec-analyze` | 一次严格 report-only 跨材料一致性检查（含 DEFER/OPEN 四要素与每个 task oracle） | S | `spec-analyze` | P11 保留 + BS13 合并 |
| 12 | `publish-result-and-confirm` | 大白话交接 + 取得真实回复 + 发布 human-confirmation（普通文件名） + `stage-handoff` | M | （内联协议）+ `stage-handoff` | P12 保留 + BS14 合并 |
| 13 | `stage-reflection` | 阶段末复盘 + 逐项遗漏披露（非阻断） | M | `stage-reflection` | P13 保留 + BS15 合并 |

### 5.2 与旧两阶段的对照

**保留的行为（语义不变）**
- 唯一 Clarify 交互与十维度检查（BS3 → 步骤 3）。
- spec 的可验收翻译：来源绑定、稳定 ID、AC 四段式、场景/状态矩阵、PFACT（BS4 → 步骤 4）。
- 条件 UI 闭环：ui-project-init → design-source-readiness → 预览/截图 → plan-design-review（BS7/8/9 → 步骤 5 + 9）。
- 可证伪翻译：RED/GREEN 同命令同 oracle、精确文件边界、依赖/并行、STOP、双向追溯（步骤 6）。
- 测试蓝图 + 路由判类（步骤 7/8）。
- findings 四态处置、逐项遗漏披露、阶段复盘、人工确认、两道人为门（步骤 10/12/13）。
- 一次独立异源审查 + 一次严格 report-only 一致性检查（步骤 9/11）。

**消失的行为/载体**
- `build-spec` 作为独立 stage 的入口与 15 步顺序（D4；OI-001 L197）。
- `plan.md` / `tasks.md` 双写及相等性协议（D1；D-001 L638）。
- 两次固定审查（spec 一次 + plan 一次）→ 一次合并审查（OI-014；SD-07①）。
- 两次 spec-analyze（stage-end + final）→ 一次（步骤 11）。
- 两次 publish（publish-spec-result + publish-plan-result）→ 一次（步骤 12）。
- hash/snapshot/revision/receipt 校验机器、`<sha256>` 命名、`versioned_refs`、`material_fingerprint`、`acceptance_data` JSON（D2/D3/D5；OI-013）。
- 三份材料各写一遍的「材料导航」表（I-B §5.2；D5）。
- `stage completion` 通用认证/task kernel/fact graph 强制依赖（D3；D-001 L666）。

**新增的行为/载体**
- 1 个合并审查步骤 `merged-review`（步骤 9）——它是 11 个旧项的合并产物，非新增能力（见 2.3）。
- 1 个条件 UI readiness 步骤（步骤 5）——ui-project-init + design-source-readiness 合并，+ `frontend-prototype-render` 补入显式步骤（该技能原在 `skill-deps.yaml` L12 但未在 build-spec steps.json 显式成步，属既有能力的落点补齐）。
- 单份 phase 差异文档模板——由现有 plan/tasks 模板改造，非净新增。
- **净新增能力项：0。**

---

## 第 6 部分：删除账

### 6.1 因合并而消失的东西

| # | 消失项 | 类型 | 依据 |
| --- | --- | --- | --- |
| 1 | `workflows/build-spec/` 作为独立 stage（`SKILL.md` + `steps.json` 15 步 + `skill-deps.yaml` 13 条） | 控制面 + 步骤 | OI-001 L197；SD-07（新四阶段无 build-spec）；I-B §7.1 |
| 2 | `plan.md` / `tasks.md` 双写及相等性协议 | 文件 + 机制 | D-001 L638；D1 L239；OI-001 L197 |
| 3 | plan-template 与 tasks-template 的 Phase 块重复声明（Goal/Files/Tasks/Verify/Knowledge/STOP/Done/Risks 各两份） | 文件结构 | D1；D5；I-B §6.3 L285 |
| 4 | spec/plan/tasks 三份各写一遍的「材料导航」M/S/B/P 表 | 文件结构 | I-B §5.2 L261；D5 |
| 5 | `stage-input-packet.v1` 的 `material_revision` / `snapshot_tree` / source digests / `packet_freeze_hash` 绑定 | 校验机器 | D2；OI-013 L445；build-spec SKILL.md L100–L112、build-plan SKILL.md L85–L96 |
| 6 | `versioned_refs` SHA-256、`acceptance_data` JSON、delivery contract JSON、`material_fingerprint` 防复用 | 校验机器 | D2/D5；OI-013；tasks-template L37、L63–L90；wh-review L95 |
| 7 | clarify receipt 的 `revision-[a-f0-9]{64}` 与 `snapshotTree` 校验 | 校验机器 | D2；OI-013；`runtime/evidence/canonical-receipt-writer.mjs` L450–L452 |
| 8 | `quality/confirmations/<sha256>.json` 的内容寻址命名 | 记录层 | OI-013 L445；SD-17 L94（普通文件名+纯文本引用） |
| 9 | stage completion 通用认证 / task kernel / fact graph 对日常工作的强制依赖 | 控制面 | D3；D-001 L666；OI-003 L241 |
| 10 | 固定 Talk 轮次、15/13 步顺序锁定、强制每 Phase review/handoff/不变路线重选、只保护流程形状的测试 | 控制面 | D4；OI-001 L197；D-001 L666 |
| 11 | 重复 evidence 包装层（`quality/facts/` + `quality/evidence/` + `quality/reviews/attempts\|results\|reports/` + `quality/stage-reflection/` + `quality/confirmations/` 多层同事实） | 记录层 | D5；OI-003 L241；OI-013 |
| 12 | 两次固定审查与两次 spec-analyze 的重复调度 | 步骤 | OI-014 L466；SD-07 L54①；I-B §5.2 L262 |
| 13 | `content_profile: spec-content.v3` fail-closed 与 legacy `ambiguity-ledger.v2` 兼容分支 | 兼容层 | D5；OI-003 L241；spec-specify L57–L63 |
| 14 | build-spec 专有的 UI Contract hash 绑定（组件/fixture hash 必须逐字节匹配） | 校验机器 | BS-M14；OI-013 |

### 6.2 `plan.md`/`tasks.md` 双写的删除如何影响步骤数

- 旧 build-plan 有 `spec-plan`（写 plan.md）与 `spec-tasks`（把 plan 投影成 tasks.md）两步，`spec-tasks` 的投影规则要求「卡 ID、依赖、精确文件、FR/AC 映射从 plan.md 复制」——同一事实两份声明。
- 删除双写后，**这两步合并为一步**（新步骤 6 `spec-plan`）：单一 phase 差异文档直接承担任务卡职责（D1 L239 给出的正是这条路径：「让 phase 差异文档直接承担任务卡职责，或让 plan.md 成为唯一 phase 权威」；card-02 T-010 L604–L609 已裁定「phase 文档自己声明写集/依赖 + 紧凑索引汇总」）。
- **步骤数影响**：`spec-plan` + `spec-tasks`（2 步）→ 1 步，**净减 1 步**；同时消除「plan 与 tasks 相等性协议」这一整类检查（D1）。
- 合并账里这体现为 `build-plan #8 spec-tasks → 合并到 spec-plan 单写`，是 28→13 中净减 15 的组成部分之一。

### 6.3 删除账计数

| 类型 | 数量 |
| --- | --- |
| 消失的 stage | 1（build-spec） |
| 消失的文件形态/协议 | 4（plan/tasks 双写、Phase 块重复、三份导航表、content_profile 兼容层） |
| 消失的校验机器/记录层机制 | 5（packet 哈希绑定、versioned_refs/acceptance_data、clarify receipt 哈希、confirmations 哈希命名、UI hash 绑定） |
| 消失的控制面 | 3（stage completion 通用认证、固定轮次/步序锁定、重复 evidence 包装层） |
| 消失的重复调度 | 2（两次审查→一次、两次 spec-analyze→一次） |
| 合计 | 15 项（与 2.3 的净减 15 步口径不同：此处按「物项」计，非按步骤计） |

---

## 第 7 部分：自我检查

### 7.1 「纯新增」的指控是否被证伪？

**是，已被证伪。** 净新增计数：

| 口径 | 净新增 |
| --- | --- |
| 新建 SKILL | **0** |
| 新建 stage | **0** |
| 新建控制面（skill-deps consumer / receipt / store） | **0** |
| 新建模板 | **0**（全部由现有 plan/tasks/spec 模板改造） |
| 新建阶段步骤（无合并来源的步骤） | **0** |
| 步骤净变化 | 28 → 13，**净减 15** |
| K1–K12 中「无承接者」 | **0** |
| 26 项质量机制中语义丢失 | **0**（保留 18 / 合并 3 / 改造 5） |

T-011 曾表述为「8 条质量核心各自成为 `skills/` 下的独立可搬运技能」。按本合并账：那 8 条中，需求翻译完整性、稳定 ID 双向追溯、AC 四段式、唯一 Clarify、一次独立异源审查、跨材料语义一致、simplicity-guard **全部已有现成承接技能**（`spec-specify` / `spec-clarify` / `spec-analyze` / `wh-review` / `simplicity-guard`）；逐项遗漏披露已有 `stage-reflection` 内联承接。**该表述确属把「合并」误写成「新建」，T-036 L1178 的自我纠正成立。**

### 7.2 有没有「看似合并实则新增」的项？

有 4 处需要显式盯住，本报告均已在合并账中标为**改造**而非保留，避免被读成新增：

1. **`spec-specify` 承载 spec 定稿 + T-006 四段式词表**：`freeze-spec` 的定稿语义被并入（合并），但 T-006 的「条件→行为→可度量标准→失败场景 + 黑名单」是**新的验收词表规则**。这是对现有技能的规则升级（改造），但对技能来说确实增加了职责。→ 必须按 V-23 给出理由：I-B/A 报告发现 AC 写成口号、可用「测试通过」代替 oracle（K3 防的问题），属真实缺陷驱动，不是换存放位置。
2. **`merged-review` 一次审查承载 6 个 lens + 2 个旧审查**：如果实现时给每个 lens 都加 `skill-deps` consumer、receipt 或 `*-facts`，就会变成「一次审查、N 套控制面」的伪合并。→ 必须保持 lens 为 packet 内 advisory（四者 SKILL 原文均已声明 packet-local/no stage result），只留 **1 个** consumer（`stage-handlers#safeReviewFacts`）。
3. **条件 UI readiness 步骤**：把 `ui-project-init` + `design-source-readiness` 合成一步，同时把原本只出现在 `skill-deps.yaml`（L12）而**未在 steps.json 成步**的 `frontend-prototype-render` 显式纳入。看起来像 +1 能力，实际是既有能力落点补齐（该技能已是 build-spec 声明的依赖）；不新增技能、不新增 consumer。
4. **phase 差异文档模板**：如果新建第三份模板（既非 plan-template 也非 tasks-template），就是新增文件。→ 必须**改造**其中一份（推荐保留 `plan-template.md` 骨架并把 `tasks-template.md` 的 `plan-task.v4` 卡契约并入），另一份转历史只读。

### 7.3 合并后是否出现职责空白（某个旧步骤的能力无人承接）？

逐项核对 28 步，**未发现无承接者的职责空白**；但以下 5 处是高风险点，必须在实施时确认承接者：

| 风险点 | 旧承接者 | 新承接者 | 结论 |
| --- | --- | --- | --- |
| `freeze-spec` 的「冻结后不得改写 decision-log、唯一可写区是 tasks 执行状态填写区」语义 | build-spec #10 + build-plan SKILL.md L114–L115 | 步骤 4 `spec-specify` 定稿语义 + 单一文档的可写区约定 | 有承接；需在 SKILL 明文写「定稿后只可追加执行事实」 |
| `publish-spec-result` 的「六字段大白话摘要」 | build-spec #14 | 步骤 11 `final-spec-analyze` 的六段摘要 + 步骤 12 交接 | 有承接；两步分工需写清，避免重复输出 |
| `design-source-readiness` 的 Screen Read Map 消费者 | build-spec #8 → `plan-design-review` / `frontend-prototype-render` | 步骤 5 产出 → 步骤 9 `plan-design-review` lens + `frontend-component-quality` | 有承接；需保留「非 UI 记 N/A」 |
| `plan.md` 作为「权威映射」的单一真相 | build-plan #4 → `spec-tasks` 从 plan 复制 | 步骤 6 单文档，phase 文档为权威、紧凑索引只做指针（T-010 L609） | 有承接；索引不得复制正文 |
| 逐项遗漏披露 | 两 stage SKILL.md 内联 | 步骤 13 `stage-reflection`（吸收）+ SKILL 内联 | 有承接；若只留在 SKILL 而不进 reflection，会退化为「一条结论均摊所有 step」（K11 防的问题） |

> 另需保留的外部消费者不受影响：`requirement-lineage`（verify-code 审计）、`deep-research`/`decision-log`/`grill-with-docs`/`talk-with-zhipeng`/`intake-decision-review`/`debate`（make-decision）、`dsh-code-review`（verify-code）、`backend-testing`/`frontend-testing`/`fullstack-slice-testing`（build-code；真实 UI 流程再由 `frontend-testing` 路由到 `isolated-browser-qa`）。这些技能在本合并中**零改动**。

### 7.4 结论

合并账证明：
1. **28 步 → 13 步**，保留 11 / 合并 11 / 改造 6 / 删除 0，净减少 15 步，无合并来源的全新步骤 0。
2. **K1–K12**：完全覆盖 10 / 部分覆盖 2（K11、K12，缺独立 SKILL 文件但有内联协议承接）/ 无承接者 0。
3. **26 项质量机制**：保留 18 / 合并 3 / 改造 5 / 语义丢失 0；另删除 D1–D5 共 5 个机器/重复外壳。
4. **真正新建的最小集 = 空集**：0 技能、0 stage、0 控制面、0 模板；只需改造 6–8 个现有技能 + 3 个阶段文件 + 1 份模板合并。
5. 与 V-21「不要搞这么多流程、质量、文件」一致：合并后文件更少（双写删除）、步骤更少（28→13）、技能数不变（39 个，0 新增）、控制面更少（哈希/认证机器删除）。

---

*报告完成时间：2026-09-20。本报告为只读分析，未修改仓库任何源文件。*
