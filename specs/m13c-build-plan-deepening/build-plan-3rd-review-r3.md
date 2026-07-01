# build-plan 3rd-review R3 报告

- 审查产物：specs/m13c-build-plan-deepening/plan.md + tasks.md
- 审查日期：2026-07-01
- 引擎：verifier（异源，独立上下文）
- 参照：build-plan-3rd-review-r2.md（6 条 blocking 原文）

---

verdict: **pass**

blocking_count: 0

---

## R2 六条 Blocking 逐条核查

### Blocking 1 — plan.md:11 non-blocking 原则违背 FR-RESEARCH-002 暂停语义

**R2 原文**：统一非硬阻断原则违背 FR-RESEARCH-002 暂停语义（research.md 缺失须 pause，不能继续 Phase 1）

**R3 核查**：plan.md:11 现写："non-blocking 指不设自动硬停门，不代表跳过 FR-RESEARCH-002 的暂停+人工升级步骤；缺失 research.md 时仍先暂停，经人工确认/升级后才可继续"。语义消歧义完整，与 spec FR-RESEARCH-002 一致。

**结论**：RESOLVED

---

### Blocking 2 — tasks.md:20 T001 fail-loud non-blocking 矛盾

**R2 原文**：T001 spec-research 写成 fail-loud non-blocking，等同允许缺 research.md 仍继续，与 spec pause/escalate 矛盾

**R3 核查**：tasks.md:20 T001 现有括号消歧义："(non-blocking 指不设自动硬停门，不代表跳过 FR-RESEARCH-002 的暂停+人工升级步骤；缺失 research.md 时仍先暂停，经人工确认/升级后才可继续)"。与 plan.md:11 消歧义文本语义一致。

**结论**：RESOLVED

---

### Blocking 3 — tasks.md:41 T006 no-placeholder 发现后"继续完成 tasks.md 写入"违背 spec 场景 4.6 阻断语义

**R2 原文**：T006 no-placeholder 发现后写成"继续完成 tasks.md 写入"，违背 spec 场景 4.6"不允许继续分解/强制人工解决后再推进"阻断语义

**R3 核查**：tasks.md:41 T006 现有精确消歧义："(注意：blocking_item:true 的那条具体任务本身不允许继续分解/向下派发，须先经人工解决——对应 spec 场景 4.6；'不阻断 build-plan stage 推进'指 stage 整体继续写出 tasks.md，不是允许带占位符的任务继续推进)"。明确区分了"stage 整体继续"与"含占位符的具体任务继续"，不再混同。与 spec.md:161（FR-TASKS-001 场景描述）语义一致：spec-tasks 步骤本身继续完成 tasks.md 写入，但 blocking_item:true 的具体任务不允许分解/派发。

**结论**：RESOLVED

---

### Blocking 4 — tasks.md:23 T002 仅声明消费者列表，T004-T006 无实际接入动作

**R2 原文**：T002 仅声明消费者列表，T004-T006 未写明实际将 task_dir 解析器接入各 SKILL.md，AC-16 验证依赖的接入动作无任务覆盖

**R3 核查**：
- tasks.md:23 T002 现写明"消费者接入动作由各自任务负责：T004 在 workflows/build-plan/SKILL.md 中写入解析器调用说明，T005 在 skills/spec-analyze/SKILL.md 中写入，T006 在 skills/spec-tasks/SKILL.md 中写入，T001 在 skills/spec-research/SKILL.md 中写入；接入后须可被 grep 命中（AC-16 口径）"
- tasks.md:35 T004 有"接入 task_dir 解析器：在 SKILL.md 中写入'读写任务跟踪文件前调用 core/task-dir-parser.mjs 取得路径，不得硬编码'（须可被 grep 命中，AC-16 口径）"
- tasks.md:38 T005 有相同接入说明
- tasks.md:41 T006 有相同接入说明

每个消费者任务均含明确接入动作说明，AC-16 验证口径（grep 命中）已明确写入各任务。

**结论**：RESOLVED

---

### Blocking 5 — plan.md:73 F10 gate 排除 task_dir 解析器审查

**R2 原文**：F10 gate 明确排除 task_dir 解析器审查，且漏 ambiguity_items、no-placeholder 验证、upstream_delta 字段等新机制

**R3 核查**：plan.md:73-80 新增"机制 5：task_dir 解析器（新建 core/task-dir-parser.mjs）"，用 F10 标准四问（防御什么威胁、现有机制是否覆盖、最小实现是否够用、是否造成新复杂度）完整覆盖，结论"合理引入，已最简实现"。task_dir 解析器不再被排除。ambiguity_items、no-placeholder、upstream_delta 属于对已有 skill 修订（非新独立机制），plan.md F10 section 的四个新机制（spec-research、data-contracts、simplicity-guard、plan-reviewer）+ task_dir 解析器已覆盖所有新建/引入的独立机制，未增加独立机制的字段级改动不需要单独四问（宪法 F10 针对新机制，非每个字段）。

**结论**：RESOLVED

---

### Blocking 6 — constitution-check.md:93 21/21 pass 基于错误失败语义属假绿

**R2 原文**：21/21 pass 建立在错误失败语义（research non-blocking、no-placeholder 继续）基础上，属假绿

**R3 核查**：constitution-check.md 审查对象是 spec.md，不是 plan/tasks。spec.md 本身的 FR-RESEARCH-002、FR-TASKS-001 语义是正确的（spec 从未宣称 research.md 缺失可以自动继续，no-placeholder 在 spec 层也区分了 blocking item 与 stage 推进）。R2 发现的错误失败语义存在于 plan.md 和 tasks.md，而非 spec.md。现 plan.md:11、tasks.md:20（Blocking 1/2）和 tasks.md:41（Blocking 3）均已修正为与 spec.md 一致的语义。constitution-check.md 审查的 spec.md 语义从未错误，plan/tasks 层错误已修正，21/21 pass 不再是假绿。

**结论**：RESOLVED

---

## AC-16 审查粒度声明

本轮审查按"计划层是否充分约束执行"的粒度评判，非"现在 grep 能否命中 SKILL.md"。

- **计划层约束已充分**：T002 声明消费者接入责任分配，T004/T005/T006/T001 各自写明接入动作，AC-16 验证口径（须代码级 grep 命中，文档/注释不通过）已写入计划和验收步骤 T010。
- **SKILL.md 实际接入代码在 build-code 阶段落地**：build-code 阶段执行时，T010 将执行实际 grep 验证；若命中失败，T010 本身构成 build-code 阶段的阻断项（AC-16 是验收条件，非计划层自验）。
- **不混判**：本轮不以"现在 grep 到 SKILL.md 是否已含调用字样"为通过条件；以"计划层任务是否写明实际接入动作、验收步骤是否有对应 grep 验证"为通过条件。结论：通过。

---

## Non-blocking 观察

- plan.md 第 159 行 data-contracts 步骤仍无"内容非空检查"细节（R2 non-blocking 7 未修）；评估为可接受——FR-DATACONTRACTS-002 已声明缺失时 warn+escalate non-blocking，build-code 阶段实现时需补充具体检查逻辑，不构成计划层阻断。
- cross-artifact-analysis.md 的可靠性问题（R2 non-blocking 8）已被本轮独立审查取代，不影响 verdict。

---

## 底线判断

plan.md 和 tasks.md 的六条 blocking 语义问题均已有针对性修正：两处失败语义消歧义（Blocking 1/2/3），task_dir 消费者接入动作显式化（Blocking 4），F10 补全 task_dir 解析器分析（Blocking 5），plan/tasks 语义修正使 constitution-check 不再假绿（Blocking 6）。

可推进 build-code 阶段。
