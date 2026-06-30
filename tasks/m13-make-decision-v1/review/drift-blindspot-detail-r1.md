# Drift / Blindspot / Detail Review — R1

- Review target: `tasks/m13-make-decision-v1/decision-log.md` (DRAFT)
- Baseline: `tasks/m13-make-decision-v1/research/make-decision-flow-aligned.md`
- Engine: **codex (gpt-5.5, OpenAI Codex v0.135.0)**
- Command: `omc ask codex "<full prompt>"`  — heterogeneous confirmed (different engine from drafting agent)
- Artifact: `.omc/artifacts/ask/codex-you-are-conducting-a-heterogeneous-drift-blindspot-detail-re-2026-06-29T06-25-29-916Z.md`
- Run date: 2026-06-29

---

## Raw Codex Output

```text
[severity: blocking] detail 草稿仍标记为 DRAFT 且尚未完成 S7d/S9，但 D1-D6 全部写"用户批准: 是"，把"设计依据已确认"和"S9 最终批准"混成同一状态 | 将字段拆成 `设计依据/来源确认` 与 `S9最终批准: 待定`；只有用户在 S9 明确说"同意"后才可改为批准

[severity: major] drift D4 标题写"触发门槛 = blocking finding >2"，但 Gate2 正文写 S7d 只要出现任一 `severity:blocking` finding 就触发 debate，偏离 baseline 的"方向级分歧或 blocking finding >2" | 统一 Gate1/Gate2：触发条件均为"方向级分歧或去重后 blocking finding >2"；单个 blocking finding 进入防漏阀留痕

[severity: major] drift D1/S10 只写"落盘 decision-log"，遗漏 baseline 要求的"版本锚点=git commit hash"和"落盘失败即停" | 在 D1 或验收中补明：S10 写入 git commit hash 版本锚点；落盘失败必须停止并报告，不允许生成假完成记录

[severity: major] drift draft 强调"全做五类动作/完整 11 步"，但 baseline 的 S0.5 明确低风险档可跳过 S1-S5，draft 未覆盖档位分支 | 增加档位状态表：full 走 S1-S10；low-risk 从 S0.5 跳过 S1-S5 后进入指定后续步骤，并记录 skipped artifact

[severity: major] drift S9 只写用户明确批准，未覆盖 baseline 的"台账逐条核对" | 在 S9 补充 D28 台账逐条核对要求：每条原始需求必须为已覆盖/待处理/已丢弃带理由，核对完成后才可批准

[severity: minor] drift S0 只写"背景扎根"，未明确 baseline 的"读 project-memory/ADR/代码/conversation history + 产出完整性自检" | 把 S0 完成条件写全，并要求输出完整性自检记录

[severity: minor] drift D6 交互简洁只写"≤4选项"，遗漏 baseline 的"每选项≤15字" | 改为完整约束："一次只问一个问题，≤4选项，每选项≤15字"

[severity: minor] drift 防漏阀只泛写 blocking 级反对留痕，未明确覆盖盲审、debate、用户反馈等所有来源 | 改为"任何 blocking 级反对均按反对X/决定Y/理由Z留痕；缺失则禁止 S10 落盘"

[severity: major] blindspot S4 方向基线确认写成"挡住流程但非 machine gate"，但未定义用户未确认、部分确认、要求修改时回退到哪里 | 增加 S4 状态：confirmed 进入 S5；revise 标明回退点；no-answer 停在 awaiting_user，不产 final log

[severity: major] blindspot S9 只定义 approve，没有定义 reject、conditional approve、改一条决策时的回退路径 | 增加 S9 状态机：approve→S10；reject→回 S4 或 S7；conditional→生成变更清单后回 S7，不允许直接落盘

[severity: major] blindspot `blocking finding >2` 未定义计数规则；三角度盲审可能重复报同一问题，导致 debate 误触发或漏触发 | 增加 normalized finding 去重规则，并记录 raw_count、dedup_count、trigger_reason

[severity: major] blindspot S3 写"双路返空即停"和 get_sources 失败停下等人，但未定义 partial empty、both empty、source unverified 的主流程状态 | 定义 S3 状态：both_ok 才进 S4；partial_empty/both_empty/source_unverified 进入 awaiting_user，并明确不得用模型记忆补源

[severity: major] blindspot S8 在 S9 前同步 CONTEXT/ADR/project-memory，若 S9 用户拒绝或要求修改，会留下未批准内容 | 将 S8 改为生成 pending patch 或 staging summary；S9 批准后才真正写入，或定义 reject 时的回滚/覆盖规则

[severity: major] blindspot MAKE_DECISION_SKIP_BLIND_REVIEW 和 MAKE_DECISION_SKIP_DEBATE 可跳过关键动作，但验收又要求盲审/debate 产物可见 | 明确 skip 只允许 dev/test；正式 dogfooding 不得启用；若启用必须写 skipped-by-env、reason、operator、timestamp，且不能算对应动作验收通过

[severity: major] blindspot S5 只说 framing 禁含拟定方向，未定义并行盲审的输入包生成和校验，存在 S4 方向泄漏给 framing 的风险 | 增加 S5 input manifest：direction/scope/framing 三份输入分别落盘；framing manifest 只允许原始需求和台账字段，执行前校验

[severity: minor] blindspot S1 要求 ≥3 子代理覆盖五类调研，但未定义五类如何分配，可能满足"≥3"却漏掉某类 | 增加 coverage matrix：问题/根因/风险/方向/扩展必须全部有 owner 和 output path

[severity: minor] blindspot 两次 debate 都输出"裁决书.md"，未定义存放路径和覆盖规则 | 规定输出路径：S5 用 debate-gate1-裁决书.md，S7 用 debate-gate2-裁决书.md，decision-log 引用相对路径

[severity: minor] blindspot task-metrics.jsonl 只作为验收项出现，未定义写入时机、字段、run_id、失败重试规则 | 增加 JSONL schema：step/status/artifact_paths/run_id/timestamp，并要求每步完成后 append 一条

[severity: major] detail D6 说"横切质量机制全部记录态非 blocking，唯一 hard gate = S9"，同段又写"未确认挡住流程""缺失阻断落盘标记"，状态语义冲突 | 明确区分三类：记录提醒、暂停等待用户、禁止 S10 落盘；不要都叫 non-blocking

[severity: major] detail "全做五类动作"与 S3 conditional、debate optional、skip env var 并存，但没有说明"全做"是实现能力还是每次实际执行 | 改成可证验口径：五类动作必须实现并有 smoke 证据；条件跳过必须有判断记录；调试跳过不得计入正式验收

[severity: major] detail D5 写 env var "安全默认+降级"，但开放问题仍在犹豫 get_sources 失败时等人还是降级 anysearch 单路，决策未闭合 | 固化失败转移规则；若降级单路，只能标记 degraded，不能算完成双路互证

[severity: major] detail D2 说 muyu-search-mcp 和 anysearch "照搬"，但证据只指向内部分类文档，没有外部 repo/path/commit/license | 在 D2 或 reuse-registry 补 exact source：仓库或本地路径、版本/commit、license、搬运范围

[severity: major] detail 多个"批准证据"实际是研究文档或宪法原则，不是用户原话批准 | 把"批准证据"改为可引用的用户原话/时间点；没有原话的一律标为"待 S9 确认"或"来源依据，不等于批准"

[severity: major] detail 验收标准"全部可跑""存在对应记录""明确说同意"缺少命令、fixture、文件路径、JSON 字段和匹配规则，容易被空文件误判通过 | 给每条验收补最小判定：执行入口、输入样例、预期路径、必须字段、exit_code、关键内容匹配

[severity: minor] detail S7d 写 intake-review-orchestrator（漂移/盲点/细节），开放问题又说 framing 不重复跑，但没有固定 lens 列表和排除项 | 明确 S7d 只跑 drift/blindspot/detail，framing 已在 S5 前置，不重复执行

Final verdict: REVISE_REQUIRED
```

---

## Parsed Findings Table

| # | Severity | Lens | Finding (short) | Fix (short) |
|---|----------|------|-----------------|-------------|
| 1 | **blocking** | detail | D1-D6 全部标"用户批准: 是"，把设计确认与 S9 最终批准混同 | 拆字段：设计依据确认 vs S9最终批准(待定) |
| 2 | major | drift | D4 Gate2 触发条件与标题不一致（单个 blocking vs >2） | 统一两次门控条件：方向级分歧或去重后 blocking >2 |
| 3 | major | drift | D1/S10 未覆盖 git commit hash 版本锚点 + 落盘失败即停 | 在 D1 或验收补全 S10 要求 |
| 4 | major | drift | 未覆盖低风险档可跳 S1-S5 的档位分支 | 增加档位状态表（full / low-risk） |
| 5 | major | drift | S9 未覆盖台账 D28 逐条核对要求 | 在 S9 补台账逐条核对 |
| 6 | minor | drift | S0 未明确 baseline 完成条件（4项读取 + 自检） | 补全 S0 完成条件 |
| 7 | minor | drift | D6 交互简洁漏"每选项≤15字" | 补全约束 |
| 8 | minor | drift | 防漏阀来源范围不全 | 改为覆盖所有 blocking 来源 |
| 9 | major | blindspot | S4 无状态机（confirmed/revise/no-answer） | 增加 S4 三态 |
| 10 | major | blindspot | S9 只有 approve，无 reject/conditional 回退路径 | 增加 S9 状态机 |
| 11 | major | blindspot | blocking finding 计数无去重规则 | 增加 dedup 规则 + raw/dedup/trigger 记录 |
| 12 | major | blindspot | S3 双路状态（partial/both empty/unverified）未定义 | 定义 S3 四态 |
| 13 | major | blindspot | S8 在 S9 前写入，S9 reject 后产生脏数据 | S8 改为 pending patch，S9 批准后才写入 |
| 14 | major | blindspot | skip env var 与验收要求盲审/debate 产物冲突 | skip 必须留痕，不得计入正式验收 |
| 15 | major | blindspot | S5 framing 输入隔离无 manifest 校验机制 | 增加 S5 input manifest 落盘+执行前校验 |
| 16 | minor | blindspot | S1 五类调研无 coverage 矩阵 | 补 coverage matrix（五类各有 owner+output） |
| 17 | minor | blindspot | 裁决书.md 路径未定义，两次 debate 会冲突 | 固定路径：gate1/gate2 各自独立 |
| 18 | minor | blindspot | task-metrics.jsonl 未定义 schema + 写入时机 | 补 JSONL schema 和 append 时机 |
| 19 | major | detail | D6 非 blocking 语义与"挡住流程/阻断落盘"冲突 | 区分三级：记录提醒/暂停等待/禁止落盘 |
| 20 | major | detail | "全做五类动作"无法区分实现能力与每次执行 | 改为可证验口径（smoke + 跳过判断记录） |
| 21 | major | detail | D5 get_sources 失败路径未闭合（等人 vs 降级单路） | 固化失败转移规则，降级标 degraded |
| 22 | major | detail | D2 muyu-search-mcp/anysearch 缺外部 source 证据 | 补 repo/path/commit/license |
| 23 | major | detail | 多处"批准证据"是研究文档，非用户原话 | 改为用户原话引用或标"待 S9 确认" |
| 24 | major | detail | 验收标准不可证伪（无命令/路径/字段/exit_code） | 每条补最小判定条件 |
| 25 | minor | detail | S7d lens 列表与 framing 排除项未固定 | 明确 S7d 只跑 drift/blindspot/detail |

---

## Verdict

**REVISE_REQUIRED**

- Blocking findings: **1**
  - [blocking] detail: D1-D6 在 DRAFT 状态下全部标"用户批准: 是"，将设计依据确认与 S9 最终批准混同，需在正式落盘前拆分字段。

- Major findings: **14** (see table rows 2-5, 9-15, 19-24)

- Minor findings: **10** (see table rows 6-8, 16-18, 25 + rows with minor)
