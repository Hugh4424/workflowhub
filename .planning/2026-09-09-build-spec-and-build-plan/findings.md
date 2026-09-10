# Findings & Decisions

## Requirements
- 用户要求继续同一任务，严格执行 WorkflowHub `build-spec` 和 `build-plan` 全部步骤，直到两个阶段完成。
- 顺序不可倒置：build-plan 当前因 `spec.md` 缺失而 `continuation_allowed=false`。
- build-spec 当前缺：`zero_major_ambiguities`、`clarify`、`stage_end_spec_analyze`、`stage_outcome`。
- build-plan 当前缺：`fr_coverage`、`ac_coverage`、`dependencies`、`deletion_proofs`、`executable_tasks`、`stage_end_spec_analyze`、`human_confirmation`、`stage_outcome`。

## Manifest Facts
- build-spec：15 步，最后 reflection 非阻塞；唯一独立 review 在 step 11；step 3 只在存在 material ambiguity 时执行一批独立问题；UI steps 7–9 对 non-UI 明确记 N/A。
- build-plan：13 步，最后 reflection 非阻塞；step 9 独立 review；step 11 必须在 finding 处置和最后 authored revision 后跑 current five-input strict analyzer；step 12 必须先普通话 handoff，再用用户真实回复发布 human-confirmation.v3。
- 两阶段 review unavailable/partial 必须如实记录，不能伪造成空成功。

## Repository Constraints
- 仅四份当前材料是工作真相：decision-log/spec/plan/tasks；task store 只放执行证据，不能新增 gate。
- 质量裁决需独立来源；主 agent 负责处置 findings，不可自审自判。
- 新生产文件/命令/schema/持久对象需登记 owner/consumer/替代关系/删除条件。
- 测试只跑受影响针对性测试；禁止全量 vitest/npm test/test:safe。
- 当前 scope 为 non-UI；build-spec UI steps 7–9 应记录 not_applicable。

## Build-spec Discovery
- `spec.md` 新输出必须遵循 `spec-content.v3`：13 个固定二级章节、SCN/PFACT/FR/AC 卡、唯一 `### 明确不做`；表最多 5 列；不得含工程路径/代码符号/精确命令。
- 每个 AC 必须用无缩进且严格顺序的四段：`验证：`、`通过：`、`失败：`、`证据：`；每段非空。
- `validateSpecClarifyAndDirectionFidelity` 要求无材料歧义时显式写一行 `spec-clarify trigger=false reason=<非空> open_direction_changing_questions=0`。
- 当前 UI applicability=`non_ui`，UI project/design steps 7–9 要在 spec 与 outcome 写 `not_applicable` + 理由；不能省略或伪造设计事实。
- `build-spec` 官方 handler 会在最终材料快照上验证：spec 内容 hash、current decision freeze、review binding、stage input packet、acceptance design、clarify status、UI fact。
- spec 只写产品可观察行为；具体文件、symbol、exact commands、task breakdown 全部留给 plan/tasks。
- 条件研究已启动，问题集中在现有 outline/requirement framework、review material、completion/analyzer、host-session source 的真实契约；这是规格精确性所需，不重复 make-decision 深度调研。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| build-spec 不先写 plan/tasks | 避免越阶段；manifest 要先冻结 spec 并通过阶段末分析 |
| build-plan 用户确认放在所有 finding 修复与 final analyzer 后 | confirmation 必须绑定最终 plan/tasks snapshot，否则会失效 |
| review 运行期间冻结 current material | 上阶段已有 REVIEW_SOURCE_DRIFT 失败教训 |
| spec-clarify 初始判定 trigger=false | D-001～D-029 已锁定产品方向；当前只有工程落点与测试细化，不会改变范围/验收/接口/数据/安全/运维产品行为 |
| D-029 的宿主无关适配差异不重问用户 | cli-parity 强制 bridge 宿主无关只改变工程分层，不改变已批准 opt-in/机械筛选/失败不伪造语义；实际路径留 build-plan |

## Pending Spec Repairs (apply only after frozen review settles)
1. RQ-05 uses non-enumerable family ranges (`FR-OUTLINE-001～FR-GOV-001`); enumerate all FR/AC IDs explicitly.
2. Source header/Clarify line references upstream `AC-08`; current spec canonical ACs are `AC-SOURCE-001/002`. Rephrase as upstream AC-08 → current AC-SOURCE mapping, avoiding dangling local ID.
3. FR-CLOSE-001 exhaustive conjunction omits current detail-review result and applicable user-consumption result although FR-REVIEW/AC-REVIEW say all three consumers are mandatory. Add both to authoritative conjunction.
4. Flow freezes questions-only before Talk/research and then mutates OI before direction review. Specify re-freeze immediately before direction review whenever current OI changed.
5. Source failure must be one unambiguous state: `unavailable`; empty projection is internal absence representation, never successful empty result.

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| `workflows/{...}` glob 没结果 | 直接读明确存在的两个 manifest |
| `templates/spec-template.md` 路径不存在 | 按 skill 引用读取 `skills/spec-specify/templates/spec-template.md` |
| 初稿含“新增产品方向”否定句触发方向发明检测 | 改为不含触发短语的等义边界；校验恢复 ok |
| formal review 运行中发现 5 个 trace/semantic gap | 遵守冻结纪律，先记录到 planning；审查结束后与正式 findings 一并修复，不中途改材料 |

## Resources
- `workflows/build-spec/steps.json`
- `workflows/build-plan/steps.json`
- `specs/workflowhub-make-decision-hardening/decision-log.md`
- `runtime/review/stage-materials.json`
- `CONSTITUTION.md`
- `constitution-checklist.md`
