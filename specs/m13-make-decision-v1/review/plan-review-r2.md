# M13 build-plan 产物审查 r2

verdict: revise_required

blocking_count: 1

审查范围：
- 第一轮报告：`specs/m13-make-decision-v1/review/plan-review-r1.md`
- 上游 spec：`specs/m13-make-decision-v1/spec.md`
- 决策约束：`tasks/m13-make-decision-v1/decision-log.md`
- plan：`specs/m13-make-decision-v1/plan.md`
- tasks：`specs/m13-make-decision-v1/tasks.md`
- analyze：`specs/m13-make-decision-v1/cross-artifact-analysis.md`
- 剧本：`workflows/build-plan/SKILL.md`
- 宪法清单：`constitution-checklist.md`

说明：
- `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` 因当前分支名 `m13-make-decision-v1` 不符合脚本要求退出，未作为事实来源。
- 本轮按用户给定绝对路径亲读目标产物，并使用两个独立子上下文分别核 R1-1 至 R1-7、R1-8 至 R1-15。

## R1 逐条复核

| R1 | 结论 | 说明 |
|----|------|------|
| 1 | fixed | 12 步已统一为 `S0、S0.5、S1-S10`，plan/tasks 已拆出 S0 背景扎根和 S0.5。 |
| 2 | fixed | `quick` 已删除；档位为 `lite/full`；lite 只跳过 S1 和 S3。 |
| 3 | fixed | S4 已改为 `s4_baseline_recorded: true`，非阻断，不再写 confirmed。 |
| 4 | fixed | S5=盲审+第一次 debate 门控，S6=展示盲审/debate 结果。 |
| 5 | fixed | `make-decision-original-context.md` 已移到 S4 后、S5 前，T011 依赖 T010。 |
| 6 | fixed | 6 个 env var 已改成 spec/decision-log 权威清单。 |
| 7 | not fixed | 宪法 21 条仍与真实清单错位，且 analyze 声称已对齐。见 Finding 1。 |
| 8 | fixed | talk 三轮已归位为 S2/S4/S7，T013 依赖 S5/S6 后执行。 |
| 9 | partial | `extra_sources >= 3` 和 `get_sources` 已补，但双路均空的“立即停止”仍缺。见 Finding 5。 |
| 10 | partial | 盲审 5 字段已补，但 `fallback_used` 失败语义和 FR-REVIEW-03 固定留痕格式仍缺。见 Finding 3、4。 |
| 11 | partial | grill 纯委托已写，但验收 artifact 和 draft 引用路径仍缺。见 Finding 6。 |
| 12 | partial | 每个 task 有 FR 映射行，但 scope boundary 仍靠 `spec §14`，无独立 FR。见 Finding 9。 |
| 13 | not fixed | cross-artifact-analysis 仍把残余 major 写成已解决，并有字段契约错误。见 Finding 8。 |
| 14 | partial | recordSkeleton/updateOwnResult 调用点已补，但 metrics 10 个 core fields 写错。见 Finding 7。 |
| 15 | fixed with minor drift | baseline 已是 4 列且 unknown 不占位；列名仍与 build-plan 剧本不一致。见 Finding 11。 |

## Findings

### 1. severity: blocking

位置：
- `constitution-checklist.md:9-35`
- `plan.md:32-56`
- `cross-artifact-analysis.md:18`
- `cross-artifact-analysis.md:63`

问题：
R1-7 没有真修好。`plan.md` 的 Constitution Check 仍不是按真实 21 条清单填写，而是条款身份错配后直接打 `[x]`。

明显错配：
- 真实 F5 是“gate 谨慎添加出事再补无用则移除”，plan F5 写成“推进/不可逆操作经人确认”。
- 真实 F6 是“统一外置执行记录”，plan F6 写成“简单优先”。
- 真实 F7 是“推进与不可逆操作不自动越过人”，plan F7 写成“可证伪检查”。
- 真实 F8 是“简单优先”，plan F8 写成“记录事实而非阻断”。
- 真实 F9 是“可证伪不假绿”，plan F9 写成“引用外部 skill 须登记 reuse-registry”。
- 真实 Q2 是“gate 三类划分”，plan Q2 写成“独立上下文产出”。
- 真实 Q3 是“异源审查加人工把关”，plan Q3 写成“禁止自审自判”。
- 真实 S1-S6 与 plan S1-S6 也整体错位。

`FR-ARTIFACT-01` 幻引已删除，但核心问题仍在：plan 声称“条款名称与真实清单逐条对齐”，analyze 也声称 B7 已解决。这是 F9 假绿。

建议：
- 严格按 `constitution-checklist.md` 的 21 条原名逐条重填 plan。
- `[x]` 只表示该真实条款已核；不符合时写 `[ ]` 加事实理由，不能改条款名。
- cross-analysis 在修前必须把 B7 标为未解决，不能写“21/21 对齐”。

### 2. severity: major

位置：
- `spec.md:81`
- `decision-log.md:45`
- `plan.md:177-181`
- `tasks.md:158-164`
- `cross-artifact-analysis.md:78`

问题：
S8 职责被改错。上游 spec 和 decision-log 的 12 步流程写的是：
- S8：同步 CONTEXT / ADR / project-memory

但 plan/tasks 写成：
- S8：台账渲染点②

台账渲染点②确实存在，但 spec 没把它定义为 S8 主职责。按当前 plan/tasks 实现，会漏掉 FR-FLOW-01 中明确列出的 S8 同步步骤；cross-analysis 仍写 FR-FLOW-01 覆盖，是假绿。

建议：
- 推荐修法：S8 写成“同步 CONTEXT / ADR / project-memory + 台账渲染点②”，并在 T014 输出/完成条件补上同步动作和可验收证据。
- 不推荐反向改 spec/decision-log；那会修改已批准流程。

### 3. severity: major

位置：
- `spec.md:165-175`
- `plan.md:157-165`
- `tasks.md:121-138`
- `cross-artifact-analysis.md:66`
- `cross-artifact-analysis.md:81`

问题：
FR-REVIEW-03 只是被“映射”了，没有落成可执行验收。spec 要求 blocking 反对必须固定留痕：

```text
反对 X：<反对的具体内容>
决定 Y：<用户最终决定>
理由 Z：<决定的理由>
```

并且“留痕缺失时 decision-log 不得标注落盘完整”。plan/tasks 没写这三行格式，也没写 S10 落盘前检查；analyze 却把 FR-REVIEW-03 写成覆盖/已解决。

建议：
- 在 Step 2.7 / T011 写明 blocking finding 的固定三行格式。
- 在 S10 / T016 增加落盘前检查：存在 blocking 反对时，未找到三行留痕不得标注“落盘完整”。
- cross-analysis 在修前不得继续把 FR-REVIEW-03 标为覆盖。

### 4. severity: major

位置：
- `spec.md:145-151`
- `plan.md:159`
- `tasks.md:127-130`
- `cross-artifact-analysis.md:66`

问题：
`fallback_used` 字段已补，但失败语义没补。spec 要求：
- 三个 `source_family` 必须不同。
- 任一角度触发同源降级时记录 `fallback_used: true`。
- 该角度审查失败，不得进入合并结果。
- 停下报告用户。

plan/tasks 只写了字段存在和 `source_family` 两两不同，没有写 `fallback_used: true` 后“失败、不合并、停下报告用户”。这会把同源降级风险变成普通字段，破坏异源盲审。

建议：
- 在 Step 2.7 / T011 完成条件补：任一 `fallback_used: true` 或 `source_family` 冲突时，该角度失败、结果不得合并、停下报告用户。
- analyze 修正 M3 状态，不能写“补全所有字段即已解决”。

### 5. severity: major

位置：
- `spec.md:128-132`
- `plan.md:140-148`
- `tasks.md:96-106`
- `cross-artifact-analysis.md:65`

问题：
双路调研的 `extra_sources >= 3` 和 `get_sources` 已补，但“双路均空即停”仍没落到 plan/tasks。spec 明确写：
- muyu 和 anysearch 两路均为空时，立即停止。
- artifacts 记录 `dual_research_empty: true`。
- 不得继续合成虚假调研摘要。

plan/tasks 只写“写 `dual_research_empty: true`，不合成摘要”，没有写“立即停止/等待用户指令”。这会允许流程带着空调研继续进 S4，和 spec 的 let-it-crash 语义不一致。

建议：
- 在 Step 2.5 / T009 补上：两路均空时立即停止，向用户报告双路均空，等待用户明确继续/重试/中止指令。
- cross-analysis 不能把 R1-9 完整标为已解决。

### 6. severity: major

位置：
- `spec.md:239-247`
- `plan.md:167-175`
- `tasks.md:140-152`

问题：
grill 纯委托主方向已修，但验收证据没补。spec 要求：
- `artifacts/make-decision-grill-with-docs.md` 存在。
- decision-log 草稿含 grill 产物引用路径。

plan/tasks 只写调用 `grill-with-docs-lite` 和产出 decision-log draft，没有把 grill artifact 列入输出，也没有要求 draft 引用该路径。这样实现者可以“调用了”但不留下可验收证据。

建议：
- 在 Step 2.9 / T013 输出中加入 `artifacts/make-decision-grill-with-docs.md`。
- 完成条件加：decision-log draft 必须引用 grill artifact 路径。

### 7. severity: major

位置：
- `spec.md:330-337`
- `plan.md:112-114`
- `plan.md:188-193`
- `tasks.md:52-58`
- `tasks.md:174-180`
- `metrics/record-schema.mjs:16-24`

问题：
metrics 调用点已补，但“10 个核心字段”写错。仓库 M4 core fields 是：
- `execution_id`
- `skill_or_stage`
- `stage`
- `skill_version`
- `executed`
- `tokens`
- `duration_ms`
- `rework_rounds`
- `human_intervention`
- `friction_ref`

plan/tasks 写成了：
- `task_id`
- `stage`
- `status`
- `duration_ms`
- `user_decision`
- `s9_approved`
- `debate_1_triggered`
- `debate_2_triggered`
- `blind_review_completed`
- `journal_event_count`

这些业务字段可以作为扩展字段，但不能替代 core fields。否则 metrics 记录会和现有 schema/扫描器不兼容。

建议：
- recordSkeleton/updateOwnResult 必须传 M4 core fields。
- `user_decision`、`s9_approved`、debate 和 journal 计数字段放到扩展字段或 facts 中。
- T004/T016 与 Verification Mapping 同步修正。

### 8. severity: major

位置：
- `workflows/build-plan/SKILL.md:54-56`
- `cross-artifact-analysis.md:14`
- `cross-artifact-analysis.md:18`
- `cross-artifact-analysis.md:27-47`
- `cross-artifact-analysis.md:63-69`
- `cross-artifact-analysis.md:78-88`

问题：
cross-artifact-analysis 仍是假绿，而且自身字段不符合 build-plan 契约。

具体问题：
- 它声称 FR-REVIEW-03、FR-GRILL-01、FR-METRIC-01 已覆盖，但本轮仍发现关键验收语义缺失。
- 它声称宪法 21/21 对齐，但 plan 仍与真实清单错位。
- build-plan 剧本要求每条 finding 含 `line_or_anchor`，当前 F001/F002 用的是 `location`。
- F001 声称 spec 对 anysearch 单路返空有“等待时间上限”，但 `spec.md:128-132` 没有这个要求，属于编造来源。

建议：
- 修完 plan/tasks 后重新生成 analyze。
- 每条 finding 用 `type/source_artifact/target_artifact/fr_or_task_id/line_or_anchor` 五字段。
- 删除“等待时间上限”这个无来源 residual。
- 在修复前不要写“FR 覆盖率已覆盖”或“B7/M3/M5 已解决”。

### 9. severity: major

位置：
- `workflows/build-plan/SKILL.md:179`
- `tasks.md:194-200`
- `spec.md:357-366`

问题：
scope boundary 仍没有独立 FR 回指。T018 的核心动作是确认不改下游阶段文件和 `config/workflowhub.yaml`，但 FR 映射仍靠 `spec §14`；`spec §14` 是“不做和隐性必达”，不是 FR。

T018 同时挂了 FR-ACCEPT-01/02/03，但这三条只覆盖 S4/S9 台账与批准，不覆盖“禁止触碰下游阶段文件”。这不满足 build-plan 剧本“每个 task 至少引用一个 spec FR”的精神：task 的核心验收点没有 FR 承接。

建议：
- 新增 `FR-SCOPE-01`：不改下游阶段文件、不改 `config/workflowhub.yaml`、scope boundary verification 可验收。
- T018 回指 `FR-SCOPE-01`，FR-ACCEPT-01/02/03 只保留为附带验收。

### 10. severity: minor

位置：
- `decision-log.md:45`
- `spec.md:72-83`
- `plan.md:120-128`
- `tasks.md:64-78`

问题：
decision-log 的 D1 仍写 `S0.5 scope-triage+台账`，但当前 spec/plan/tasks 中 S0.5 只做 scope-triage；原始需求台账落盘已被修到 S4 后、S5 前。

建议：
- 把 `decision-log.md:45` 改成 `S0.5 scope-triage`。
- 台账职责只保留在 S4 后渲染点①和 S7 后渲染点②。

### 11. severity: minor

位置：
- `workflows/build-plan/SKILL.md:104-111`
- `plan.md:267-277`
- `cross-artifact-analysis.md:69`

问题：
baseline 4 列和 unknown 已修，但列名仍与 build-plan 剧本不一致。剧本固定输出列名为 `M12 实值`，plan 写 `M13 实值`。

语义上 `M13 实值`更自然，但当前剧本没有更新；这会造成模板契约漂移。

建议：
- 推荐把 build-plan 剧本列名改成“当前实值”或“{task-id} 实值”。
- 若不改剧本，则 plan 按剧本写 `M12 实值`。

### 12. severity: minor

位置：
- `decision-log.md:151-155`
- `spec.md:441-456`

问题：
开放问题状态不一致。decision-log 写“无”，但后面又列两个待确认项；其中 muyu `get_sources` 已在 spec 标为 resolved，S7 orchestrator framing 仍是 OPEN-2。

建议：
- decision-log 只保留真实开放项 OPEN-2，或同步关闭 OPEN-2。
- 删除已解决的 muyu 待确认描述。

## 结论

不能进入 build-code。

必须先修：
1. 宪法 21 条真实对齐，去掉假绿。
2. S8 与 spec/decision-log 对齐。
3. 盲审 fallback 和 FR-REVIEW-03 留痕语义落入 plan/tasks。
4. S3 双路均空即停、grill artifact、metrics core fields。
5. 重新生成或手工修正 cross-artifact-analysis，不能继续写覆盖/已解决假绿。
