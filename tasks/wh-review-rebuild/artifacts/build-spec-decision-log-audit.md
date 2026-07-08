# build-spec 决策日志覆盖审计

审查对象：`specs/wh-review-rebuild/spec.md`
权威依据：`tasks/wh-review-rebuild/decision-log.md`
审查方式：只读，逐条核对 D1-D7 / intake C1-C6 / verify-code F1-F6 / §7 改写范围约束 / 未决问题
审查时间：2026-07-06

---

## 一、BLOCKING（内容缺失/矛盾，阻断执行）

### B1. FR-THIRDREVIEW-002（§7 改写）目标文件归属错误

**decision-log 原文**（`decision-log.md:86-91`）：
> ### D3 build-code SKILL.md §7/§13 文档矛盾清理
> - 矛盾内容：§7（L96-117）定义单次 3rd-review 调用产出单一 verdict 直接决定推进；§13（L221-250）定义两个独立 subagent 聚合，`pass` 需两边都 `pass`。
> - 采纳解决方向（方向1）：以 §13 为准。§7 主体改写为纯概念说明（3rd-review standalone 是每个 subagent 调用的底层入口），删除 §7 的三态 verdict 处理指令和调用命令模板，仅保留降级规则作为 §13 的补充说明。

`decision-log.md:46`（已知风险）也明确写：`build-code SKILL.md §7 与 §13 文档矛盾，重设计前需清理歧义`。

**实测核实**：`workflows/build-code/SKILL.md:96` 为 `### 7. 3rd-review standalone`，`workflows/build-code/SKILL.md:221` 为 `### 13. 两阶段独立审查拆分 (FR-REVIEW-001)`——行号与 decision-log 引用的 L96-117 / L221-250 精确吻合。仓库内用 `find`/`Glob` 核实**不存在任何 `skills/3rd-review/` 目录**；3rd-review 仅以外部脚本路径 `bash /path/to/3rd-review/standalone.sh` 的形式被 `build-code/SKILL.md` §7 调用。

**spec.md 问题**：spec.md 多处把 D3 的改写目标误写成"3rd-review 自己的 SKILL.md"，而非真正需要改的 `build-code/SKILL.md`：
- `spec.md:17`：`现有 §7（3rd-review SKILL.md 中的流程步骤段）改写为...`
- `spec.md:58`：`改写 3rd-review §7：删除 numbered step / if/else...`（In-scope）
- `spec.md:268`：FR-THIRDREVIEW-002 描述 `改写 3rd-review SKILL.md 中的 §7...`
- `spec.md:428`：§7.4 影响分析 `当前行为：3rd-review SKILL.md §7 含 stage/轮次路由逻辑...`
- `spec.md:490`：AC-D2 `对精简后的 3rd-review §7，执行端到端调用...`

**影响**：这是 D1（3rd-review 精简为纯引擎，FR-THIRDREVIEW-001，目标是 3rd-review 自身，独立于本条）与 D3（build-code 文档自相矛盾清理，目标是 build-code/SKILL.md）两个不同决策被 spec 混为一谈、张冠李戴。按 spec 字面执行，实现者会去找一个不存在的"3rd-review SKILL.md §7"，而不会去改真正需要改的 `build-code/SKILL.md` 的 §7/§13，D3 决策实质上不会被落地。且与 spec 自身 Out-of-scope（`spec.md:73` "修改 agenthub 侧的任何文件"）存在潜在自相矛盾——若 3rd-review 确实是 agenthub 侧文件，FR-THIRDREVIEW-001/002 要求改写它就违反了 spec 自己划的边界。

**修复建议**：FR-THIRDREVIEW-002 及所有引用点改为明确目标 `workflows/build-code/SKILL.md` 的 §7（L96-117）/§13（L221-250），与 FR-THIRDREVIEW-001（3rd-review 引擎本身精简，若该技能确实存在于仓库之外/待新建，需在 spec 中明确其物理位置或标记为待 build-plan 阶段确认）分开处理，不可合并成同一条 FR。

---

### B2. OPEN-1 单方面取消 decision-log 明确要求的跟进 issue

**decision-log 原文**（`decision-log.md:162-168`）：
> ## 6. 开放问题
> 无遗留待定项（D1-D7 均已用户明确定案，无遗留待定项）。
> **待跟进事项**：
> - **3rd-review 调用契约与 SKILL.md 描述不一致**：standalone.sh 实际调用参数/返回结构与 SKILL.md 文档描述（`--engine`/`--output`，返回 findings 三条+direction_divergence）存在不一致。当前范围不阻断，issue 编号待后续 build-plan 阶段创建：[占位符，build-plan 阶段需替换为实际 issue 编号]

对应假设（`decision-log.md:149`）仅是"假设该不一致会在后续实现阶段一并同步"，并非承诺自动解决；"待跟进事项"是独立于该假设、明确要求 build-plan 阶段建 tracking issue 的动作项。

**spec.md 问题**（`spec.md:504`）：
> **OPEN-1**（已按 decision-log D1 结构化三元组口径解决）：...路由不一致问题不复存在。**无需 build-plan 阶段另建 tracking issue。**

spec 把"未来新接口设计消除了路由不一致"和"当前 standalone.sh 实际行为与现有 SKILL.md 文档描述不一致"混为一谈，前者是 D1 的架构结论，后者是 decision-log 明确标记、要求 build-plan 阶段建 issue 跟踪的独立事项。spec-specify 阶段没有权限单方面取消 decision-log 明确写下的后续动作项。

**修复建议**：OPEN-1 拆成两条——保留 D1 架构层面路由问题已解决的结论；另起一条明确保留"3rd-review 调用契约与 SKILL.md 描述不一致，需 build-plan 阶段创建 tracking issue"的待办，不得声明"无需另建"。

---

## 二、MAJOR（造成较大返工）

### M1. FR-INTAKE-001 的 C2 判据语义漂移

**decision-log 原文**（`decision-log.md:102`）：
> **C2** 决策有证据支撑：每条**"选X非Y"**结论需附至少一条具体理由（技术约束/风险评估/用户表态）；裸断言视为不通过。

**spec.md**（`spec.md:322`）：
> C2：决策有证据支撑（每条 **KEEP** 结论须附具体理由）

"选X非Y"指任意比较型决策结论（选择方案 A 而非 B），覆盖面远大于"KEEP"（仅保留现状类结论）。spec 把判据范围窄化为 KEEP 类型，字面执行时"改为 Y""新增 Z""拒绝 W"等非 KEEP 型结论可能不再被 C2 要求提供证据，实现的 intake 合同判据检查项会比 decision-log 原意更松。

**修复建议**：C2 措辞改回"每条比较型/选择型决策结论（选X非Y）"，不要窄化为 KEEP。

### M2. D3 解决方案中"降级规则保留到 §13"的要求未在 spec 中体现

decision-log D3 解决方向（`decision-log.md:89`）明确写：`删除 §7 的三态 verdict 处理指令和调用命令模板，仅保留降级规则作为 §13 的补充说明`——即"3rd-review 不可用时降级为 same_source"的规则不能被直接删除，须迁移保留、作为 §13 的补充说明留存。

spec.md 的 FR-THIRDREVIEW-002（`spec.md:266-281`，含 AC6-1~AC6-4）只规定"§7 不含任何 step/if-else，仅留一句'参见 §13'的概念性导读"，未提及"降级规则需要迁移到 §13 作为补充说明保留"这一具体要求。按 spec 字面执行会导致该降级规则被直接删除、无处安放，属于信息丢失。（此条与 B1 同源但性质不同，独立列出便于跟踪。）

**修复建议**：在 FR-THIRDREVIEW-002 或 §13 对应 FR 中补一条 AC，要求"降级规则迁移保留在 §13 补充说明中，不得直接删除"。

---

## 三、MINOR（措辞/轻微）

### MI1. FR-STAGE-001 未说明"当前已合规、本 FR 主要是防回归验证闸"

decision-log 假设 (b)（`decision-log.md:148`）明确：5 stage 收尾现状已核实符合 D6 规则，非缺陷，D6 的"改动后需逐一核实"更偏向验证而非从零实现。spec.md 的 FR-STAGE-001（`spec.md:285-296`）措辞读起来像是需要从头实现（"统一调用...禁止各自实现不一致的收尾逻辑"），虽然 AC7-2 有"逐一核实"字样部分缓解，但没有明确说明当前状态已合规，容易让实现者误判工作量。建议补一句"现状已核实合规，本 FR 为防回归验证闸"。

---

## 四、正确覆盖、无需修改的部分（核实通过）

- **D1（两层架构 + 结构化三元组）**：FR-WHREVIEW-001/002/003/004 + FR-THIRDREVIEW-001 对 `{mode, contract, materials}` → `{verdict, findings, actual_mode}` 接口描述与 decision-log 原文一致，字段名一致。
- **D2（自动推进范围收窄）**：FR-D2-001 / AC-D5 / §7.2 / Business Impact Scope 表格与 decision-log "仅 build-spec/build-code 自动推进，其余 3 个 stage 人工确认"完全一致。
- **D6（5 stage 统一收尾模板）**：FR-STAGE-001 覆盖到位，字段/路径一致（措辞问题见 MI1，非缺失）。
- **D7（配套测试方案）**：FR-TEST-001 正确归属"build-plan 设计测试方案文档、verify-code 执行验证"两阶段分工，与 decision-log D7 原文一致。
- **intake C1、C3、C4、C5、C6**：与 decision-log D4 原文语义一致（C2 见 M1）。
- **verify-code F1-F6**：字段命名、判据内容与 decision-log D5 逐条一致，无遗漏。
- **§7 改写范围约束的机器可检验规则本身**（"§7 不含 numbered step / if/else，含中英文步骤词绕过检测"）：规则内容与 decision-log `decision-log.md:91` 一致（只是应用到了错误的文件，见 B1）。
- **GAP-4/GAP-5**：spec 明确标注为"spec-clarify 补充"、非 decision-log 原文，属于合理的、有出处标注的澄清，非过度发挥。
- **GAP-6**：明确标注"3rd-review 实测发现"，非冒充 decision-log 结论，处理得当。
- 未发现"3 选项待定"或同类模糊表述残留于 spec.md。

---

## 五、severity 汇总

| 编号 | 类型 | 严重度 |
|---|---|---|
| B1 | FR-THIRDREVIEW-002 目标文件误写为"3rd-review SKILL.md"，实为 build-code/SKILL.md | BLOCKING |
| B2 | OPEN-1 单方面取消 decision-log 要求的 build-plan 跟进 issue | BLOCKING |
| M1 | intake C2 判据"选X非Y"被窄化为"KEEP" | MAJOR |
| M2 | D3 降级规则应保留至 §13 的要求未体现 | MAJOR |
| MI1 | FR-STAGE-001 未说明现状已合规、防回归定位 | MINOR |
