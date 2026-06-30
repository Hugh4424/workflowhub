# Heterologous R5 Re-Review Request — m13b-build-spec-deepening build-plan

You are a NON-CLAUDE heterologous reviewer. This is Round 5. Your job: verify R4-BLK-1 is closed AND do a final full pass on the build-plan artifacts.

## CRITICAL RULE: No phantom findings
R3 produced 3 phantom findings that did NOT exist in the actual files. For EVERY blocking finding you report, you MUST quote the exact file:line number and exact text from the file excerpts below. If you cannot quote it, do NOT report it as blocking.

## R4-BLK-1 (the only open finding from R4)

R4 found one real finding (R4-BLK-1): prose inconsistency between:
- tasks.md:64 said "T005–T011 依赖 Stage 1 全部完成" (implying T005 depends on ALL T001–T004)
- tasks.md:31 T005 `depends:` field only listed T001,T002
- tasks.md:75 critical path omitted T012/T013 before T014

The fix applied was:
- tasks.md:64 now reads: "T005 依赖 T001+T002；T006–T011 依赖 T005（及各自 depends 字段所列任务）；T006–T011 之间无互相依赖可并行"
- tasks.md:75 now reads: "T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）"

## Current file excerpts (READ FRESHLY — these are the actual current on-disk contents)

### tasks.md lines 1-100 (FULL CURRENT CONTENT)

```
# Tasks: m13b-build-spec-deepening

**Input**: Design documents `specs/m13b-build-spec-deepening/`
**Prerequisites**: spec.md (authoritative, 3rd-reviewed), plan.md
**Task ID**: `m13b-build-spec-deepening`

**Tests**: `npm test` (tests/five-skills-present.test.mjs) + grep AC checks on `workflows/build-spec/SKILL.md`

**Organization**: Tasks grouped by dependency phase. Stage 1 = Foundation（基础声明节），Stage 2 = Core Implementation（核心质量机制），Stage 3 = Auxiliary & Verification（辅助规范与验收）。Same-stage tasks can run in parallel where marked [P].

---

## Stage 1

**Purpose**: 在 `workflows/build-spec/SKILL.md` 中写入全局声明节——参数约定、结构要求、编号格式——后续所有核心 FR 都依赖这些基础定义就位。

- [ ] T001 在 `workflows/build-spec/SKILL.md` 新增「环境变量与参数约定」节：定义 `TASK_TRACKING_ROOT` 变量（默认值 `~/Knowledge/workflowhub/`、降级行为、warn 不停止）和 `--task-dir` 参数约定（路径推导规则，不依赖 cwd 猜测，缺失时回退默认路径并 warn）。FR: FR-TRACKING-001, FR-TRACKING-002, FR-TASKDIR-001 (stage:1, depends:无)

- [ ] T002 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec 三层结构要求」节：定义层 1 速读卡（一句话需求+核心改动，文件顶部 30 行内）、层 2 正文（问题陈述/背景/FR/AC/影响范围）、层 3 附录（质量事实契约/Known Gaps/设计决策）；新增 Known Gaps 段为必填项说明（可为空列表）。FR: FR-STRUCTURE-001, FR-STRUCTURE-002 (stage:1, depends:无)

- [ ] T003 [P] 在 `workflows/build-spec/SKILL.md` 新增「FR 编号格式规范」节：声明 `FR-[A-Z]+-[0-9]{3}` 格式要求，所有 FR 编号必须符合正则可验证的统一格式。FR: FR-NUMBERING-001 (stage:1, depends:无)

- [ ] T004 [P] 在 `workflows/build-spec/SKILL.md` 新增「AC 计数与 spec-acceptance-count.json 产出」节：声明 build-spec 每次运行必须产出 `specs/{task-id}/spec-acceptance-count.json`，含三字段（ac_count: int, fr_count: int, counted_at: ISO8601 string），字段不可为 null。FR: FR-ACCOUNT-001 (stage:1, depends:无)

---

## Stage 2

**Purpose**: 在 `workflows/build-spec/SKILL.md` 中写入核心质量机制节。这些节依赖 Stage 1 的基础结构定义（spec 三层结构、环境变量约定）就位后方可引用。

- [ ] T005 在 `workflows/build-spec/SKILL.md` 新增「质量事实契约 5 项定义」节：明确 5 项字段名称（scope 边界声明 / 7 条自检结果 / 异源独立审查摘要 / 未解风险清单 / handoff required_reads），每项声明最小内容要求，并明确禁止阻断语义（所有项值可为 unknown，但字段不可缺失）。FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)

- [ ] T006 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec-Ladder A/B/C 档」节：定义 A 档（单文件微改）、B 档（标准，多域 FR，无跨系统）、C 档（跨系统/多 repo/外部 API）三档判断标准；声明档位判断步骤（spec 开始时执行），含 F10 四问摘要一行结论；非阻断，判断结论作为附录 D 写入 spec。FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T002,T005)

- [ ] T007 [P] 在 `workflows/build-spec/SKILL.md` 新增「Spec 构建流水线」节：声明 spec-specify → spec-clarify → 平台约束比对 → 扎根 decision-log 的四步执行顺序；明确每步 I/O 和前置条件；声明流水线各步骤为"编排协议"描述，不修改 spec-specify/spec-clarify 技能本体；spec-specify 别名映射说明（与 speckit-specify 等价）。FR: FR-BUILD-001 (stage:2, depends:T001,T002,T005)

- [ ] T008 [P] 在 `workflows/build-spec/SKILL.md` 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：①spec-ladder 档位已声明且有依据、②所有 FR 使用 FR-{DOMAIN}-NNN 格式、③每个 FR 至少有一条 Given/When/Then 场景、④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、⑦Known Gaps 段存在；Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)

- [ ] T009 [P] 在 `workflows/build-spec/SKILL.md` 新增「异源 3rd-review 独立审查」节：声明 spec 初稿完成后调用异源引擎（如 codex）在独立上下文产出 verdict + findings；禁止自审自判；结论记入质量事实契约第 3 项（审查摘要路径）；审查失败/不可用时降级记录 unknown + 原因，不阻断。可 grep 到 "3rd-review" 或 "异源独立审查"。FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)

- [ ] T010 [P] 在 `workflows/build-spec/SKILL.md` 新增「scope-triage 高危词浮现」节：列出高危词黑名单（"自动阻断""blocking gate""门禁""不能继续""若…则停止"等），声明 grep 发现时位置浮现+修改建议，非阻断继续推进；明确高危词作为黑名单内容列举本身不违规（AC-16 口径）。FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)

- [ ] T011 [P] 在 `workflows/build-spec/SKILL.md` 新增「spec↔decision-log 一致性检查」节：声明逐条对照 decision-log KEEP 列表核查 spec FR 覆盖；差异记入未解风险清单；非阻断，stage 继续。FR: FR-ALIGN-001 (stage:2, depends:T005)

---

## Stage 3

**Purpose**: 写入辅助规范（交互规范、摩擦捕获、artifact-first、行为验证要求），然后整体验收（grep AC 核查）。依赖 Stage 2 所有节就位。

- [ ] T012 在 `workflows/build-spec/SKILL.md` 新增「交互规范」节：声明 REQ-COMM-01（大白话+选项后果，不让编排者猜）、REQ-COMM-02（每完成主要步骤主动报进度：做了啥/下一步/需要你做什么）。FR: FR-COMM-001, FR-COMM-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)

- [ ] T013 [P] 在 `workflows/build-spec/SKILL.md` 新增「摩擦捕获 + Artifact-First + 行为验证要求」节：声明 [FRICTION] 条目格式和触发时机（发现任何流程卡点时记录）；长报告（>500 字）存文件传路径规范（不内联）；FR 场景必须用 Given/When/Then 格式，覆盖正常路径和边界。FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)

- [ ] T014 整体 AC 验收：对 `workflows/build-spec/SKILL.md` 运行 grep 核对 AC-01 至 AC-22；**显式 grep SKILL.md frontmatter 确认 `version` 字段存在**（S6 技能版本可追溯，验收 SKILL.md 写入了 version 值，如 `version: 2.0.0`）；确认 scope boundary（禁止触碰文件未被改动）；确认每个任务至少引用 1 个 FR；更新/核查 `specs/m13b-build-spec-deepening/spec-acceptance-count.json` 三字段有效性（AC-17）。FR: FR-CONTRACT-001, FR-SELFCHECK-001, FR-ACCOUNT-001 (stage:3, depends:T012,T013)

---

## Dependencies & Execution Order

### Stage Dependencies

- **Stage 1 (Foundation)**: T001–T004 — 无外部依赖，全部可并行，立即开始
- **Stage 2 (Core)**: T005–T011 — T005 依赖 T001+T002；T006–T011 依赖 T005（及各自 depends 字段所列任务）；T006–T011 之间无互相依赖可并行
- **Stage 3 (Aux & Verify)**: T012–T014 — 依赖 Stage 2 全部完成；T012/T013 可并行；T014 等 T012+T013 完成后执行

### Critical Path

T001/T002 → T005 → T009 → T012/T013 → T014（含 3rd-review 结论写入质量事实契约）
```

### plan.md FR Coverage Matrix (lines 343-372)

```
### FR 覆盖矩阵（24 FRs）

| FR | 覆盖 Step | 覆盖 Task（tasks.md） |
|----|------------|----------------------|
| FR-BUILD-001 | Step 2.1 | T007 |
| FR-CONTRACT-001 | Step 2.3 | T005 |
| FR-CONTRACT-002 | Step 2.3 | T005 |
| FR-LADDER-001 | Step 2.2 | T006 |
| FR-LADDER-002 | Step 2.2 | T006 |
| FR-STRUCTURE-001 | Step 1.2 | T002 |
| FR-STRUCTURE-002 | Step 1.2 | T002 |
| FR-SELFCHECK-001 | Step 2.4 | T008 |
| FR-SELFCHECK-002 | Step 2.4 | T008 |
| FR-REVIEW-001 | Step 2.5 | T009 |
| FR-REVIEW-002 | Step 2.5 | T009 |
| FR-BEHAV-001 | Step 3.2 | T013 |
| FR-BEHAV-002 | Step 3.2 | T013 |
| FR-FRICTION-001 | Step 3.2 | T013 |
| FR-TASKDIR-001 | Step 1.1 | T001 |
| FR-TRACKING-001 | Step 1.1 | T001 |
| FR-TRACKING-002 | Step 1.1 | T001 |
| FR-NUMBERING-001 | Step 1.3 | T003 |
| FR-ACCOUNT-001 | Step 1.3 | T004 |
| FR-ARTIFACT-001 | Step 3.2 | T013 |
| FR-COMM-001 | Step 3.1 | T012 |
| FR-COMM-002 | Step 3.1 | T012 |
| FR-SCOPETRIAGE-001 | Step 2.6 | T010 |
| FR-ALIGN-001 | Step 2.7 | T011 |

全部 24 FR 均有对应 Step 和 Task 覆盖，无遗漏。
```

## Checks to perform

**Q1: R4-BLK-1 closed?**
- tasks.md:64 — does the prose now match T005 depends: field (T001,T002 only, not all Stage 1)?
- tasks.md:75 — does the critical path now include T012/T013 before T014?
- Quote the exact current line text to confirm.

**Q2: Dependency graph acyclic?**
- List every task's depends: field extracted from the file above.
- Verify no cycle exists.
- Verify T002 does NOT depend on T005 (R3 phantom finding — confirm it is NOT there).
- Quote each depends: field.

**Q3: FR matrix — 24 FRs match spec.md?**
The spec.md declares these 24 FRs: FR-BUILD-001, FR-CONTRACT-001, FR-CONTRACT-002, FR-LADDER-001, FR-LADDER-002, FR-STRUCTURE-001, FR-STRUCTURE-002, FR-SELFCHECK-001, FR-SELFCHECK-002, FR-REVIEW-001, FR-REVIEW-002, FR-BEHAV-001, FR-BEHAV-002, FR-FRICTION-001, FR-TASKDIR-001, FR-TRACKING-001, FR-TRACKING-002, FR-NUMBERING-001, FR-ACCOUNT-001, FR-ARTIFACT-001, FR-COMM-001, FR-COMM-002, FR-SCOPETRIAGE-001, FR-ALIGN-001.
- Count matrix rows: exactly 24?
- Any phantom FRs (in matrix but NOT in spec.md list above)?
- Any orphan FRs (in spec.md but NOT in matrix)?
- Do Task column entries match what tasks.md says for each FR? Verify a sample of 5.

**Q4: T004 schema correct?**
- tasks.md T004 declares: ac_count, fr_count, counted_at — does this match spec.md requirement?
- Quote the T004 line.

**Q5: T008 7-item list correct?**
- tasks.md T008 lists 7 self-check items ①–⑦. Does the content match FR-SELFCHECK-001?
- Quote the T008 line.

**Q6: S6 truthful?**
- Does plan.md S6 cite a real verification mechanism (T014) that exists in tasks.md?
- T014 explicitly greps SKILL.md frontmatter for `version` field?

**Q7: Any real new blocking issues?**
- IMPORTANT: only report if you can quote exact file:line and text from excerpts above.
- Do NOT report R3 phantoms (T002/T005 cycle, phantom FR-ACCOUNT-002, FR-STRUCTURE wrong task).
- Do NOT report issues that you cannot directly quote from the provided excerpts.

## Required Output Format

```
ROUND: R5
REVIEWER: [your engine name]
DATE: 2026-06-30

R4-BLK-1: CLOSED / NOT-CLOSED
  Evidence: tasks.md:64 "<exact text>"
            tasks.md:75 "<exact text>"

DEPENDENCY GRAPH:
  T001 depends: [quoted]
  T002 depends: [quoted]
  T003 depends: [quoted]
  T004 depends: [quoted]
  T005 depends: [quoted]
  T006 depends: [quoted]
  T007 depends: [quoted]
  T008 depends: [quoted]
  T009 depends: [quoted]
  T010 depends: [quoted]
  T011 depends: [quoted]
  T012 depends: [quoted]
  T013 depends: [quoted]
  T014 depends: [quoted]
  Acyclic: YES/NO
  Cycle detected: [describe or NONE]

FR MATRIX:
  Row count: [N]
  Phantom FRs: [list or NONE]
  Orphan FRs: [list or NONE]
  Sample task-column verification (5 FRs): [list each with result]

T004 SCHEMA: CORRECT / INCORRECT
  Evidence: "<exact T004 line>"

T008 7-LIST: CORRECT / INCORRECT
  Evidence: "<exact T008 line excerpt>"

S6: TRUTHFUL / NOT-TRUTHFUL
  Evidence: [T014 text]

NEW BLOCKING FINDINGS: [list each with exact file:line quote, or NONE]

VERDICT: PASS / REVISE_REQUIRED
RATIONALE: [1-3 sentences]
```
