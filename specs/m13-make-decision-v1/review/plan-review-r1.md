# M13 build-plan 产物审查 r1

verdict: revise_required

blocking_count: 7

审查范围：
- 上游 spec：`specs/m13-make-decision-v1/spec.md`
- 决策约束：`tasks/m13-make-decision-v1/decision-log.md`
- 待审 plan：`specs/m13-make-decision-v1/plan.md`
- 待审 tasks：`specs/m13-make-decision-v1/tasks.md`
- 待审 analyze：`specs/m13-make-decision-v1/cross-artifact-analysis.md`
- 剧本依据：`workflows/build-plan/SKILL.md`

## Findings

### 1. severity: blocking

位置：
- `spec.md:67-83`
- `spec.md:436-437`
- `decision-log.md:31`
- `decision-log.md:41-45`
- `plan.md:114-119`
- `tasks.md:56-62`

问题：
正确步数应统一为 **12 个命名步骤**：S0、S0.5、S1、S2、S3、S4、S5、S6、S7、S8、S9、S10。原因很简单：当前权威枚举中 S0.5 是独立项，S0 到 S10 又包含 11 个整数步骤，合计 12 项。

`spec.md:67/69/71` 写“11 步”，但 `spec.md:72-83` 明确列出 12 项；`spec.md:436-437` 的澄清也错误，它声称“不矛盾”，但列表漏掉 S1，且当前 FR-FLOW-01 并不存在“S7 被展开为两条 bullet”的情况。`decision-log.md:31/41/45` 同样把 S0–S10 加 S0.5 称为 11 步。

plan/tasks 另有更严重偏差：它们把 `S0` 写成 `scope-triage`，但 spec 中 `S0` 是背景扎根，`S0.5` 才是 scope-triage。这样会直接漏掉 S0 背景扎根步骤。

建议修法：
- 全仓统一写“12 步流程（S0、S0.5、S1–S10）”。
- 修改 `spec.md:67/69/71`、`decision-log.md:31/41/45`。
- 删除或重写 `spec.md:436-437` 的错误澄清。
- `plan.md` Phase 2 拆成：
  - Step 2.1：S0 背景扎根
  - Step 2.2：S0.5 scope-triage
  - 后续步骤顺延
- `tasks.md` 增加或改写任务：
  - T004：S0 背景扎根
  - T005：S0.5 scope-triage
  - 后续 task 编号或内容相应调整

### 2. severity: blocking

位置：
- `spec.md:87-91`
- `tasks.md:56-62`
- `tasks.md:152-158`
- `plan.md:116-119`
- `plan.md:209`

问题：
档位术语和路由被改错。spec 只有 `lite / full`，并明确 `lite` 只跳过 S1 内部调研和 S3 外部调研，然后从 S2 talk#1 继续执行。tasks 改成了 `quick / full`，并写成 quick 档跳过 S1–S7 直接到 S8。这会跳过 talk、盲审、grill、debate、draft 等核心护城河动作，违背 M13 目标。

plan/tasks 也没有显式覆盖 `FR-FLOW-02`，这是一个独立 FR，不应只塞进 FR-FLOW-01。

建议修法：
- 全部改回 `lite / full`。
- 删除 `quick 档跳过 S1–S7 直接到 S8`。
- 明确 lite 路由：
  - S1 记 `skipped: scope=lite`
  - S2 以空内部调研上下文进入 talk#1
  - S3 记 `skipped: scope=lite`
  - S4–S10 正常继续
- 在 plan 和 tasks 中显式映射 `FR-FLOW-02`。

### 3. severity: blocking

位置：
- `spec.md:296-300`
- `decision-log.md:116-120`
- `plan.md:137-140`
- `plan.md:240`
- `tasks.md:80-86`

问题：
S4 被 plan/tasks 写成等待用户确认的 gate，违反上游 spec 和“唯一硬门 S9”规则。spec 明确要求 S4 是“记录模式，非阻断”，展示方向基线后直接推进到 S5，不等待显式确认；journal 事件应为 `s4_baseline_recorded: true`，不是 `s4_baseline_confirmed: true`。

这不是文案问题。若按 plan/tasks 实现，会新增 S9 之外的强制等待点，违反 D5/唯一 hard gate。

建议修法：
- `plan.md:137-140` 改为：展示方向基线摘要，记录 `s4_baseline_recorded: true`，直接进入 S5。
- `plan.md:240` 改为验证 `s4_baseline_recorded: true`。
- `tasks.md:80-86` 改为“不等待确认，不写 confirmed”。
- 只允许 S9 使用 `user_approved` / `confirmed` 语义。

### 4. severity: blocking

位置：
- `spec.md:78-80`
- `spec.md:181-190`
- `plan.md:11`
- `plan.md:142-150`
- `tasks.md:100-114`

问题：
S5/S6 职责被错位。spec 的顺序是：
- S5：三角度并行盲审 + 第一次 debate 门控
- S6：给用户看盲审/debate 结果

plan/tasks 把第一次 debate 门控放到 S6，并没有给 S6 设计“给用户看结果”的任务或产物。这会导致用户在 S7 前看不到盲审/debate 结果，破坏流程中“先展示异源发现，再进入 talk#3/grill/draft”的收敛顺序。

建议修法：
- 将第一次 debate 门控并入 S5 任务。
- 新增或改写 S6 任务：展示三角度盲审结果、debate 裁决或 skip 原因，记录展示 artifact / journal。
- T010 不应叫“实现 S6 首次 debate 门控”，应改为“S6 展示盲审/debate 结果”。

### 5. severity: blocking

位置：
- `spec.md:272-284`
- `plan.md:157-160`
- `tasks.md:128-134`
- `cross-artifact-analysis.md:29`

问题：
台账渲染点①被排到 S8/T012，太晚。spec 明确要求 `artifacts/make-decision-original-context.md` 在 S4 后落盘，并且 `framing-challenge` 在该文件落盘前不得派发。当前 tasks 把该文件放在 T012，而 T009 的 S5 framing-review 已经早于 T012 执行，直接违反“原始需求台账先落盘，审查后派发”的约束。

cross-artifact-analysis 把这个问题降成 LOW 歧义，也是误判；这是执行顺序错误，不是建议项。

建议修法：
- 把渲染点①移动到 S4 结束后、S5 前。
- T009 依赖应包含“original-context.md 已存在”。
- S8/T012 只负责渲染点②和 S9 展示基础，不负责首次落盘原始需求。
- cross-artifact-analysis 必须把该项改为 blocking/major 级一致性问题。

### 6. severity: blocking

位置：
- `spec.md:306-318`
- `decision-log.md:101-105`
- `plan.md:102-105`
- `tasks.md:36-42`

问题：
tasks 中的 6 个 env var 与上游权威清单不一致。spec/decision-log 的 6 个是：
- `MAKE_DECISION_DEBATE_PATH`
- `MAKE_DECISION_SKIP_DEBATE`
- `MAKE_DECISION_SKIP_BLIND_REVIEW`
- `THIRD_REVIEW_RUNNER`
- `REVIEW_DISPATCH_CONFIG`
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`

tasks 写成：
- `MAKE_DECISION_DEBATE_PATH`
- `MAKE_DECISION_SEARCH_MCP_ENABLED`
- `MAKE_DECISION_ANYSEARCH_ENABLED`
- `MAKE_DECISION_3RD_REVIEW_ENABLED`
- `MAKE_DECISION_GRILL_ENABLED`
- `MAKE_DECISION_JOURNAL_PATH`

后 5 个不是 spec 清单项，反而漏掉了 skip debate、skip blind review、3rd-review runner、dispatch config、Agent Teams 开关。

建议修法：
- `tasks.md:T002` 改为 spec 的 6 个 env var。
- plan Step 1.2 不要只写“等 6 个”，要列全 6 个，避免实现者沿用错误清单。
- 验收条件补上非法值行为和“检测结果写入 decision-log 执行环境字段”。

### 7. severity: blocking

位置：
- `constitution-checklist.md:9-35`
- `plan.md:32-56`

问题：
Constitution Check 不是按真实 21 条清单填写，存在条款身份错配和假绿。例子：
- 清单 F5 是“gate 谨慎添加”，plan F5 写成“推进/不可逆操作经人确认”。
- 清单 F6 是“统一外置执行记录”，plan F6 写成“简单优先”。
- 清单 F7 是“推进与不可逆操作不自动越过人”，plan F7 写成“可证伪检查”。
- 清单 F9 是“可证伪不假绿”，plan F9 写成“引用外部 skill 须登记 reuse-registry”。
- 清单 Q2 是“gate 三类划分”，plan Q2 写成“独立上下文产出”。
- 清单 Q3 是“异源审查加人工把关”，plan Q3 写成“禁止自审自判”。
- 清单 S1–S6 也整体错位。

另外 `plan.md:48` 引用了 `FR-ARTIFACT-01`，但 spec 中没有这个 FR。这不是“有判据”，是不存在的回指。

建议修法：
- 严格按 `constitution-checklist.md` 的 21 条原名重填。
- F9 必须检查“可证伪不假绿”：例如 unknown 是否写 unknown、验收是否能在失败时真失败、cross-analysis 是否没有把实际阻断项报成 LOW。
- Q2 必须明确入口校验 / 记录采集 / 人工确认三类，并指出 S9 是唯一人工确认硬门。
- 删除不存在的 `FR-ARTIFACT-01` 引用，改用真实 spec 行或 FR。

### 8. severity: major

位置：
- `spec.md:214-233`
- `plan.md:126-130`
- `tasks.md:72-94`
- `tasks.md:100-122`

问题：
talk 三轮的位置和依赖错乱。spec 是 S2/S4/S7 三轮；plan 写成 “S2/S3/S4 三轮”；tasks T008 写 “talk#3 在 S7 grill 后 / S9 前”，但 T008 的依赖只有 T007，执行顺序在 T009/T010/T011 之前。也就是说 tasks 试图在盲审、debate、grill、draft 之前完成 talk#3，但 talk#3 的输入应来自已知盲区和边界，属于 S7。

建议修法：
- plan Step 2.3 只覆盖 S2 talk#1 和 S4 talk#2，不要写 S3 talk。
- talk#3 移入 S7 对应任务，依赖 S5/S6 产物。
- 若 S7 内部顺序按 spec 执行，应写：talk#3 → grill-with-docs-lite → decision-log draft → orchestrator → debate2。
- 删除 “S7 grill 后 / S9 前” 这类与 spec 顺序冲突的描述。

### 9. severity: major

位置：
- `spec.md:116-132`
- `plan.md:132-135`
- `tasks.md:80-86`

问题：
双路调研失败语义被弱化。spec 要求：
- muyu 必须传 `extra_sources >= 3`
- 调用后必须 `get_sources`
- `get_sources` 无法核实时立即停下等用户指令，不得自动降级
- 双路均空时 artifacts 记录 `dual_research_empty: true`，不得合成摘要

plan/tasks 只写“双路并发；任一返空记录继续；双路均空记 `s3_dual_empty: true`”，没有 `extra_sources >= 3`、没有 `get_sources`，也把 spec 要求的 artifact 字段写成了 journal 字段 `s3_dual_empty`。这会掩盖 muyu 无来源的风险。

建议修法：
- S3 任务写清 muyu 调用参数 `extra_sources >= 3`。
- S3 任务写清 `get_sources` 校验失败时停下等用户指令。
- 双路均空时写 `artifacts/make-decision-background-research.md` 中的 `dual_research_empty: true`。
- 不要写“任一返空则 skip”；应分别处理单路有效、单路空、双路空、muyu 无来源失败。

### 10. severity: major

位置：
- `spec.md:138-175`
- `plan.md:142-145`
- `tasks.md:100-106`
- `plan.md:241`

问题：
三角度盲审覆盖不完整。plan/tasks 只泛泛写“3rd-review 链、输入隔离、findings list”，但 spec 还有关键机器可校验字段和失败语义：
- `reviewer_runtime_id`
- `reviewer_source`
- `source_family`
- `fallback_used`
- 三个 `source_family` 必须两两不同
- `fallback_used: true` 时该角度失败且不得进入合并结果
- `input_hash` 与 bundle 路径
- blocking 反对必须按“反对 X / 决定 Y / 理由 Z”留痕（FR-REVIEW-03）

plan/tasks 完全没有映射 `FR-REVIEW-03`，Verification Mapping 也漏了。

建议修法：
- T009/Step 2.6 增加 FR-REVIEW-03。
- 完成条件列出 reviewer checkpoint 必填字段、source_family 两两不同、fallback_used 处理规则。
- 增加 bundle hash 和路径交叉引用扫描要求。
- 增加 blocking 反对留痕格式，且明确“不阻断流程，但不得标注落盘完整”。

### 11. severity: major

位置：
- `spec.md:239-247`
- `plan.md:152-155`
- `tasks.md:116-122`
- `plan.md:218`

问题：
grill 薄壳要求没有被正确转成任务。spec 的重点是“纯委托，禁止内嵌逻辑”，薄壳 ≤40 行，且不在薄壳中重新实现多轮问答、盲审、debate、调研、decision-log 内容决策。plan/tasks 却写“grill 四件事退出条件明确”，容易让实现者把退出判断做进 make-decision 薄壳，反而违反 spec。

同时，spec 中“≤40 行 + 禁关键字扫描”本身也需要 F10 重新判断：关键字扫描很容易误伤正常说明文字，也很容易被绕过，属于低质量机器校验。

建议修法：
- plan/tasks 明确：make-decision 只调用 grill-with-docs-lite，并记录 artifact 路径；退出条件由被调用 skill 内部处理。
- F10 中重新评估“≤40 行 + 关键字扫描”，建议改为人工可审的薄壳边界和最小调用契约，不做脆弱关键字门。

### 12. severity: major

位置：
- `workflows/build-plan/SKILL.md:58-65`
- `tasks.md:164-170`

问题：
build-plan 剧本要求每个 task 至少引用一个 spec FR。T016 的 FR 映射是 `spec §14 明确不做`，不是 FR。严格按剧本，这个 task 不满足“每个 task 对应 FR”的输出要求。

建议修法：
- **推荐**：在 spec 中新增 `FR-SCOPE-01` 或类似条目，表达“不改下游阶段 / 不改 config/workflowhub.yaml / scope boundary verification”。
- 或把 T016 合并到 T017 的验收前置检查中，但仍需有 FR/AC 回指。

### 13. severity: major

位置：
- `cross-artifact-analysis.md:13-17`
- `cross-artifact-analysis.md:21-30`
- `cross-artifact-analysis.md:45-61`

问题：
cross-artifact-analysis 结论假绿。它报告“FR 覆盖率 100%”“无 CRITICAL / HIGH / MEDIUM”，但实际存在：
- FR-FLOW-02 未被 plan/tasks 显式覆盖
- FR-REVIEW-03 未进入 plan/tasks implementation/verification mapping
- S4 非阻断被 plan/tasks 改成确认 gate
- env var 清单错误
- 台账渲染点①顺序错误
- S6 展示步骤缺失

这违反 F9“可证伪不假绿”，也会误导人审。

建议修法：
- 重新跑或手工修订 cross-artifact-analysis。
- 至少把上面这些问题列为 blocking/major。
- 覆盖率不能写 100%，除非 plan/tasks 已真实补齐全部 FR 和 AC。

### 14. severity: major

位置：
- `spec.md:328-337`
- `plan.md:167-175`
- `tasks.md:144-158`

问题：
metrics 覆盖不完整。spec 要求 make-decision 阶段开始调用 `recordSkeleton`，阶段结束调用 `updateOwnResult`，并写 10 个核心字段。plan/tasks 主要把 metrics 放在 S10 落盘和 journal 完整性里，没有明确 stage start 的 `recordSkeleton`，也没有列出 10 个核心字段。

建议修法：
- 在最前置任务中增加“stage start 调用 recordSkeleton”。
- 在 S10 或最终任务中增加“stage end 调用 updateOwnResult”。
- 完成条件写明 10 个核心字段，以及 metrics 写失败 warn 不 throw。

### 15. severity: minor

位置：
- `workflows/build-plan/SKILL.md:126-157`
- `plan.md:253-263`

问题：
M10 baseline comparison 的格式不符合 build-plan 剧本。剧本要求 4 列：`指标名 / M12 实值 / M10 baseline / delta`，并且 delta 全部写 `unknown`。plan 当前是 `指标 / M10 基线 / M13 当前值 / 原因`，没有 delta 列。

建议修法：
- 改成剧本要求的 4 列格式。
- M13 可作为任务名上下文，但列名按剧本保持 `M12 实值` 或同步更新剧本，否则不要混用。

## 依赖和 stage 结论

tasks 依赖图本身没有发现环；所有 `depends` 引用的 task ID 都存在，stage 编号也没有后向依赖。

但依赖排序仍有语义错误：
- T008 把 talk#3 放在 T009/T010/T011 之前，违背 S7 输入依赖。
- T012 把 original-context 首次落盘放在 S5 framing-review 之后，违背台账先行约束。

因此不能按当前 tasks 进入 build-code。

## 总结

当前 plan/tasks 不是小修即可放行。必须先修正 12 步命名、lite/full 路由、S4 非阻断、S5/S6 分工、台账渲染时机、env var 清单、宪法检查和 cross-analysis 假绿问题。修完后应重新执行 build-plan 的 spec-plan/spec-tasks/spec-analyze 三步，确保三产物同步。
