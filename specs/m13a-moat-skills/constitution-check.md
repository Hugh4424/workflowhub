# 宪法合规检查 — m13a-moat-skills

> 检查对象：`specs/m13a-moat-skills/spec.md`
> 检查基准：`CONSTITUTION.md` v1.1.0（21 条）+ `constitution-checklist.md`
> 检查日期：2026-06-30

---

## 框架原则（F）

- [x] **F1 薄核心**
  spec 的核心改动是将三个护城河动作提升为 in-repo skill 文件，`workflows/make-decision/SKILL.md` 只更新引用路径（S5/S7/talk 指向 in-repo），不改调度逻辑；make-decision 583 行主壳拆分明确排除（Scope OUT），改动牵连面限定为 skills/ 目录新建 + 单文件引用路径更新，符合"核心只做调度、重活下沉技能层"的薄核心定义。

- [x] **F2 窄契约**
  三个新 skill 均通过独立 SKILL.md 文件与 make-decision 交互，接口为"路径引用 + 输入/输出文件"；FR-MAKEDEC-001/002/003 限定 make-decision 只改引用路径，不暴露 skill 内部实现；intake-decision-review 对外只暴露"恰好 3 条 findings + 三角度"契约，内部单次拼装实现不透传，符合窄契约定义。

- [x] **F3 物理事实靠机器校验但不阻断**
  spec 定义的 AC-01~28 验收条件全部为 grep/stat/ls 等机器客观采集（AC-23~28 为新增 COMM/REGISTRY/搬运硬证据/FR-TEST-004(e)负例类，均属机器可验证的 grep/stat 断言）；FR-TEST-001~005 测试断言均为文件存在性、frontmatter、路径引用、关键词的客观检查；附录 B 自检结论（pass/warn/unknown）字段采集结论不设阻断语义；整体设计无阻断门，采集本身不拦截推进，符合 F3。AC-23（S9 等待确认 grep）、AC-24（registry 同行路径 grep）、AC-25（registry 宿主引用 grep，四类全覆盖含 gbrain/office-hours，机器可验证）、AC-26/27（搬运硬证据 grep，机器可验证）、AC-28（FR-TEST-004(e) 负例语义 grep，机器可验证）均属机器事实采集；无新增人工判断类 AC。

- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
  spec §5 非目标第 3 条明确"异源 3rd-review 审查（已在 make-decision 阶段完成，非本 spec 产物）"，将质量裁决交给独立上下文审查与人；附录 B 自检结论为"事实记录"而非阻断判断；spec 全文无任何"若未通过则停止"条款，符合 F4。

- [x] **F5 gate 谨慎添加、出事再补、无用则移除**
  spec 新增机制全部为"可测断言"（测试报红），不引入流程阻断门；FR-TEST-001~005 仅做结构性事实断言（文件在不在、关键词有没有），未堆砌 CI 强制门或审查锁定门；gate 数量最小，出事前不预设，符合 F5。

- [x] **F6 统一外置执行记录**
  FR-TRACKING-001/002 引入 `TASK_TRACKING_ROOT` 环境变量，S10 落盘步骤统一从该变量读取跟踪文件路径；FR-TRACKING-002 定义降级事件 `tracking_root_fallback` 记录进日志；决策 D3（fallback_used=true 停止报错）提供清晰的执行事实记录语义；与 M13b 对齐，执行记录统一外置，符合 F6。

- [x] **F7 推进与不可逆操作不自动越过人**
  spec 中 make-decision S9 用户确认段明确改写为"你现在需要确认，不确认就不继续"（FR-COMM-003）；intake-decision-review fallback_used=true 时停止报错不自动推进（FR-REVIEW-003）；findings 不足时要求重跑不自行编造（FR-REVIEW-004）；所有推进节点均等待人工确认，符合 F7。

- [x] **F8 简单优先**
  spec §序言 F10 四问显示四问全部通过，无过度工程风险；Scope OUT 明确排除了更复杂的 4 个独立 intake-* skill + orchestrator 方案（已取消，合并为单一 intake-decision-review）和 debate in-repo；grill-with-docs-lite 变体取消、原版全量搬入（减少变体维护）；整体选择最直接的搬运+引用更新路径，符合 F8。

- [x] **F9 可证伪、不假绿**
  FR-TEST-001 场景明确"删除 skill 文件后对应断言报红"（AC-20 独立验收可证伪性）；AC-07/08 grep 为空结果是真实可证伪断言（命中即报红）；附录 B 自检结论字段 pass/warn/unknown 三态，"NEEDS CLARIFICATION 残留=0 条"为实际核查结论而非假绿；符合 F9 可证伪不假绿原则。

- [x] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建**
  spec §序言 F10 四问明确三个 skill 为"make-decision 每轮复用、非一次性"（收益真实）；验证手段为轻量 grep/stat（FR-TEST-001~005），不为 CI 全链路单独造执行通道；附录 B 自检结论 Spec-Purity=pass 确认 spec 无代码块、只含 grep 示意；符合 F10 按真实收益添加的原则。

---

## 质量原则（Q）

- [x] **Q1 记事实而非阻断**
  spec §序言 F10 四问结论"记录而非阻断"（record-only，非阻断）；FR-REVIEW-003/004 的失败语义是"停止并报错/要求重跑"，而非自动锁死主流程门；AC-19 npm test 全量绿是验收事实记录，不是推进阻断门；附录 B §3 独立审查摘要字段 pending 如实标注而非假绿，符合 Q1。

- [x] **Q2 gate 三类划分**
  spec 只含"记录事实的采集"类（AC-01~18 grep/stat）和"人工确认"类（S9 用户确认、FR-REVIEW-003 停止报错等待人判断）；入口处只校验 SKILL.md 文件是否存在（FR-TEST-001）；无阻断式质量门（spec §5 非目标第 5 条"宪法 21 条逐条勾选由独立人工完成"）；三类划分清晰，未误将采集做成阻断门，符合 Q2。

- [x] **Q3 异源审查加人工把关**
  spec §速读卡来源注明"异源盲审 codex direction_divergence=false"（make-decision 阶段已完成）；附录 B §3 独立审查摘要"本 spec 阶段异源审查：pending（由后续工头安排独立上下文审查）"诚实标注局限而非声称已完成；质量裁决由人判断，符合 Q3 基本要求；Known Gap 如实记录审查 pending 状态，不假绿。

---

## 技能原则（S）

- [x] **S1 能用外部就不造轮子**
  FR-TALK-001 明确 talk-with-zhipeng 源自 multica-agenthub 已实现版本搬运，不自研核心逻辑；FR-GRILL-002 明确 grill-with-docs 源自 `~/.claude/skills/grill-with-docs/` 原版搬入；intake-decision-review 复用 make-decision 阶段已验证的 3rd-review 机制；三个 skill 均以搬运/复用为先，符合 S1。

- [x] **S2 外部技能可针对项目改造合宪**
  FR-TALK-001 要求 adapter 层路径改写为 workflowhub 路径（multica-agenthub 路径清零）；FR-TALK-003/FR-MOAT-003 删除 gbrain/office-hours 等宿主依赖，按项目要求改造；grill-with-docs 原版搬入后同样要清除本机绝对路径（FR-GRILL-003/AC-08）；改造原则与宪法合宪，符合 S2。

- [x] **S3 迭代时保持最新并就地检查**
  附录 B §5 Handoff Required Reads 明确列出 `workflows/make-decision/SKILL.md`（需与改动对照）和来源 skill 路径（`~/.claude/skills/grill-with-docs/`、multica-agenthub 搬运源），确保执行时可就地核查来源最新版；RISK-01/02 记录了搬运时需逐行检查路径残留的迭代动作，符合 S3。

- [x] **S4 自定义技能必须有指标系统**
  FR-TRACKING-001/002 引入 `TASK_TRACKING_ROOT` 统一指标写入路径，S10 落盘时记录 `tracking_root_fallback` 事件；intake-decision-review 的 findings 数量（恰好 3 条）和三角度覆盖状态均为可采集指标；与 M13b 的 `spec-acceptance-count.json` 同底座对齐；符合 S4。

- [x] **S5 自定义技能方便子代理调用、省主上下文**
  三个 skill 均为独立 SKILL.md 文件，子代理可独立加载调用而无需拉取整个 make-decision 上下文（FR-MOAT-001）；make-decision 引用路径更新后，子代理可按路径直接调用对应 skill，无需感知主 skill 内部；artifact-first 模式（附录 B §5 Handoff Required Reads）确保长内容不内联，符合 S5。

- [x] **S6 自定义技能参考市面方案、不闭门造车**
  talk-with-zhipeng 参考 multica-agenthub 的已实现方案（FR-TALK-001 来源注明）；grill-with-docs 参考 `~/.claude/skills/` 现有成熟方案；intake-decision-review 参考 make-decision 阶段验证的 1-AI-3-angle 三角度审查概念（decision-log D3）；三个 skill 均有外部成熟方案参考，非闭门造车，符合 S6。

- [x] **S7 一阶段一技能、一工作流一文件夹**
  三个新 skill 各自对应独立目录：`skills/talk-with-zhipeng/`、`skills/grill-with-docs/`、`skills/intake-decision-review/`，一技能一文件夹（FR-MOAT-001）；make-decision 工作流对应 `workflows/make-decision/` 独立文件夹，只更新引用不新增文件夹；各技能独立目录、互不干扰，符合 S7。

- [x] **S8 自定义技能可独立调用、可搬运**
  FR-MOAT-003/FR-GRILL-003 明确三个 skill 文件不含本机绝对路径（`/Users/`、`~/.claude/`、`multica-agenthub/`），无宿主依赖残留（AC-07/08）；FR-TRACKING-002 通过环境变量参数化路径，非硬编码；talk-with-zhipeng adapter 改写后路径为 workflowhub in-repo 路径，可在不同环境运行；符合 S8 可独立调用、可搬运原则。

---

## 汇总

| 类别 | 合规 [x] | 不合规 [ ] | N/A |
|------|----------|------------|-----|
| 框架原则 F（F1-F10） | 10 | 0 | 0 |
| 质量原则 Q（Q1-Q3） | 3 | 0 | 0 |
| 技能原则 S（S1-S8） | 8 | 0 | 0 |
| **合计** | **21** | **0** | **0** |

**结论：21/21 合规，0 不合规。**

关键看点核查：
- **S7**：三个新 skill 各自独立目录（talk-with-zhipeng/、grill-with-docs/、intake-decision-review/），一技能一文件夹，合规。
- **S8**：FR-MOAT-003/AC-07/08 强制清除宿主依赖，skill 不绑死宿主，合规。
- **薄核心窄契约**：make-decision 只改引用路径（FR-MAKEDEC-001~003），不改调度逻辑，改动牵连面最小，合规。
- **记录事实而非阻断**：spec 全文无阻断门，所有检查均为 record-only，§5 非目标第 5 条将宪法勾选移交人工，合规。

> 注：本文件为事实记录步骤，不是 gate。任何 [ ] 未勾选项透明记录原因，不阻断 pipeline 继续。本次无未勾选项。
