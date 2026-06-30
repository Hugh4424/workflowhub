# 宪法合规检查 — m13b-build-spec-deepening

> 检查对象：`specs/m13b-build-spec-deepening/spec.md`
> 检查基准：`CONSTITUTION.md` v1.1.0（21 条）+ `constitution-checklist.md`
> 检查日期：2026-06-30

---

## 框架原则（F）

- [x] **F1 薄核心**
  spec 的核心改动对象是 `workflows/build-spec/SKILL.md`（调度描述层），所有新机制（质量事实契约、自检、审查）均下沉到 SKILL 层描述，核心调度不变；改动牵连面明确限定为单文件深化 + 新增产物文件（影响范围第 7 节），符合"能力下沉技能层、核心只做调度"的薄核心定义。

- [x] **F2 窄契约**
  spec 通过 `--task-dir`（FR-TASKDIR-001）、`TASK_TRACKING_ROOT`（FR-TRACKING-001）、handoff required_reads（质量事实契约第 5 项）三项明确接口与上下游交互，内部实现（7 条自检、三角度审查步骤）不暴露给调用方；模块间接口窄且文件化，符合窄契约定义。

- [x] **F3 物理事实靠机器校验但不阻断**
  spec 明确要求 Spec-Purity grep（FR-SELFCHECK-002）、scope-triage grep（FR-SCOPETRIAGE-001）、spec↔decision-log 一致性检查（FR-ALIGN-001）均为机器客观采集，结论写入质量事实契约，任何命中结果均不阻断（FR-CONTRACT-002 明确"禁止附加任何'若未通过则停止'语义"），符合"采集不阻断"原则。

- [x] **F4 质量靠异源审查与人，而非阻断式质量门**
  spec 将独立三角度审查（FR-REVIEW-001/002）设计为"记录+浮现"语义，偏差结论浮现给人判断；Section 5（不做/非目标）第 1 条直接声明"任何质量检查失败均不阻断推进，违反此条即违反 CONSTITUTION F4/F5"；全 spec 无任何阻断门定义，完全依靠审查浮现和人工把关，符合 F4。

- [x] **F5 gate 谨慎添加、出事再补、无用则移除**
  spec OUT 列表明确剔除 agenthub 的三道阻断门（退出门/审查门/推进门），Section 5 第 1 条再次明确"无阻断门"，现有机制全部为采集记录型，没有预先堆砌关卡；符合"只添加确有必要 gate"的 F5 原则。

- [x] **F6 统一外置执行记录**
  spec 引入 `TASK_TRACKING_ROOT` 全局环境变量（FR-TRACKING-001/002），所有 stage 统一从该变量读取任务跟踪文件根目录，跟踪文件不存 repo（.gitignore 约定），实现了统一外置执行记录；`spec-acceptance-count.json`（FR-ACCOUNT-001）和质量事实契约作为结构化产物补充记录，符合 F6。

- [x] **F7 推进与不可逆操作不自动越过人**
  spec 设计中所有质量事实契约项均"浮现供人判断"（场景 3.2/3.3/3.6 均以"人工可见"或"浮现给人判断"为预期结果），独立三角度审查偏差不自动推进处理，符合"不可逆操作须经人在边界确认"的 F7 原则；spec 未定义任何自动越过人的推进逻辑。

- [x] **F8 简单优先**
  spec 附录 D（spec-ladder 判断）明确说明 F10 四问中"无更简单替代（最小实现已是最简）"；decision-log D1 决策为"质量事实契约最小实现（非逐机制照搬）"；整体设计删除了 agenthub 的复杂阻断门、三 source_family 异源、5 框架外部调研，保留最小必要机制；符合 F8 简单优先。

- [x] **F9 可证伪、不假绿**
  FR-CONTRACT-001 场景明确规定"Given 某项无数据，When 填写该字段，Then 填 unknown，不伪造值（F9 可证伪不假绿）"；FR-SELFCHECK-001 场景声明"全部 pass 不代表 spec 无问题（人判断），有 warn 不阻断推进"，防止假绿；自检结论字段 pass/warn/unknown 三态设计保证了"实际为假时能真实报 warn"，符合 F9。

- [x] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建**
  spec 影响范围第 7 节明确"测试边界：grep SKILL.md 验证 AC-01 至 AC-16；JSON schema 验证 AC-17；正则验证 AC-18"，验证手段为轻量 grep/正则而非独立 CI 门；Section 5（不做）明确排除了遥测分解 [DECOMP] 和门绑定自动写；附录 D F10 四问执行结论"维护成本低（均为 SKILL.md 描述性内容，非代码）"，符合 F10 按真实收益添加自动化的原则。

---

## 质量原则（Q）

- [x] **Q1 记事实而非阻断**
  spec 标题定位即"质量事实契约深化"，核心设计原则"所有新机制均为'记录事实+浮现+人判断'，零阻断"（速读卡）；FR-CONTRACT-002 在 FR 层面硬性约束"禁止附加任何'若未通过则停止/不得继续'语义"；场景 3.2/3.3/3.4/3.6 的预期结果均以"stage 继续推进"结尾，完全符合 Q1。

- [x] **Q2 gate 三类划分**
  spec 设计中只保留了"记录事实的采集"类 gate（Spec-Purity grep、scope-triage、一致性检查），明确剔除了阻断式质量门；入口校验仅限于字段必须存在（FR-CONTRACT-001 "字段必须存在，值可为空字符串或 unknown，但禁止字段缺失"）；人工确认通过质量事实契约浮现，三类划分清晰，未将记录型采集做成阻断门，符合 Q2。

- [x] **Q3 异源审查加人工把关**
  spec 设计了独立三角度审查（FR-REVIEW-001，方向/框架/范围三角度），结论浮现给人判断；FR-REVIEW-002 明确禁止宣称"source_family 异源"，诚实标注单代理切换视角的局限（附录 B Known Gap 2："单代理切换角度的独立性不等同于多代理异源审查"）；质量裁决由人最终把关，符合 Q3 基本要求；注：单代理三角度审查的独立性有限（已在 Known Gaps 明示），不构成合规问题，但为诚实标注项。

---

## 技能原则（S）

- [x] **S1 能用外部就不造轮子**
  spec Section 2 背景说明"agenthub design 阶段有丰富质量保障体系……须按'最小实现+记事实'原则移植"，明确是对已有外部方案的移植复用而非从零自研；FR-REVIEW-002 决策 D4 锁定复用 1-AI-3-angle 概念而非另起炉灶；符合 S1 优先复用外部方案的原则。

- [x] **S2 外部技能可针对项目改造合宪**
  spec 明确对 agenthub 原有质量保障体系进行了合宪改造：删除三道阻断门（不符合 F4/F5），保留质量事实浮现机制；FR-REVIEW-002 将三 source_family 异源改造为 1-AI-3-angle 单代理三角度（合宪简化）；这正是"按项目需要改造使其合宪"的典型体现，符合 S2。

- [x] **S3 迭代时保持最新并就地检查**
  spec 是对 build-spec M11 v1 的迭代深化（见 Section 1 问题陈述，列出 7 项 M11 v1 缺失项），handoff required_reads（附录 A 第 5 项）包含 `workflows/build-spec/SKILL.md`（深化目标文件，需与本 spec AC 对照），确保下游执行时能就地检查最新版本；符合 S3 迭代保持最新并就地检查的要求。

- [x] **S4 自定义技能必须有指标系统**
  spec 通过 `TASK_TRACKING_ROOT` + 任务跟踪文件（FR-TRACKING-001/002）、`spec-acceptance-count.json`（FR-ACCOUNT-001，含 ac_count/fr_count/counted_at）、质量事实契约 5 项结构化产出共同构成指标采集体系；metrics recordSkeleton 场景（3.7）专门处理指标写入失败的降级路径，符合 S4 配套指标采集的要求。

- [x] **S5 自定义技能方便子代理调用、省主上下文**
  FR-ARTIFACT-001（artifact-first）明确规定"长报告只存路径，禁止在交互消息或 stage-result 中内联完整报告文本（超过 500 字即视为长报告）"；FR-COMM-002 要求勤报进度用路径而非全文；这两条直接减少主上下文占用，便于子代理独立调用技能，符合 S5。

- [x] **S6 自定义技能参考市面方案、不闭门造车**
  spec Section 2 背景明确参考了 agenthub design 阶段的质量保障体系（外部成熟方案），并在 Section 5 OUT 列表中点名排除了其不合宪部分；决策 D3 参考了 1-AI-3-angle 角度审查概念；spec 的设计过程有明确外部参考来源，非闭门造车，符合 S6。

- [x] **S7 一阶段一技能、一工作流一文件夹**
  spec 影响范围明确"直接修改：`workflows/build-spec/SKILL.md`（主产物）"，build-spec 工作流对应 `workflows/build-spec/` 文件夹，一工作流一文件夹；Section 5 第 8 条"不修改现有 spec-specify/spec-clarify 技能"保证了各阶段技能独立不干扰；符合 S7 一阶段一技能、一工作流一文件夹原则。

- [x] **S8 自定义技能可独立调用、可搬运**
  spec 通过 `--task-dir` 参数（FR-TASKDIR-001）和 `TASK_TRACKING_ROOT` 环境变量（FR-TRACKING-001）将路径全部参数化，消除了对特定 cwd 的隐式依赖；`--task-dir` 缺失时有默认值降级（不报错停止），技能可在不同宿主环境运行；符合 S8 可独立调用、可搬运的要求。

---

## 汇总

| 类别 | 合规 | 不合规 | N/A |
|------|------|--------|-----|
| 框架原则 F（F1-F10） | 10 | 0 | 0 |
| 质量原则 Q（Q1-Q3） | 3 | 0 | 0 |
| 技能原则 S（S1-S8） | 8 | 0 | 0 |
| **合计** | **21** | **0** | **0** |

**结论：21/21 合规，0 不合规，0 N/A。**

该 spec 的设计核心（零阻断门、记事实+浮现+人判断、薄核心下沉）与宪法 F3/F4/F5/Q1/Q2 高度契合；已知局限（单代理三角度审查独立性有限）已在 Known Gaps 诚实标注，符合 F9 可证伪不假绿原则。
