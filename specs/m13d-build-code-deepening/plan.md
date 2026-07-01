# 实施计划：m13d-build-code-deepening

**Task ID**: `m13d-build-code-deepening` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification `specs/m13d-build-code-deepening/spec.md`
**Status**: Draft

## Summary

给 `workflows/build-code/SKILL.md` 补齐三项质量能力——P0-P3 风险定级、L2 集成冒烟、两阶段独立审查+原子提交——同时把 `metrics/capture.mjs` 扩展四个字段（commit_sha/base_sha/head_sha/risk_level），并将散落在根目录和 `config/` 的两份 `reuse-registry.md` 合并迁移到 `skills/reuse-registry.md` 唯一权威版本。worktree.json 跨阶段复用协议已在 make-decision 阶段落地（`tasks/m13d-build-code-deepening/worktree.json`），本任务直接复用，不新建。设计上四项能力全部走"记录事实、不阻断推进"（宪法 F3/Q1），复用优先于新建（四个复用/改造技能均为本项目自研技能）。

## Technical Context

**Language/Version**: Markdown (SKILL.md), Node.js v20 (`capture.mjs`)
**Primary Dependencies**: None（无第三方依赖新增；`test-routing-advisor` 为跨仓复用 agenthub 内部技能，非外部包依赖）
**Storage**: Filesystem — `workflows/build-code/`、`skills/reuse-registry.md`、`specs/m13d-build-code-deepening/evidence/`
**Testing**: `npm test`（现有测试套件），另 evidence 五件套字段契约由 `tests/` 下新增单测覆盖（M13d 实施阶段补）
**Target Platform**: 本地 CLI / Claude Code agent 执行环境
**Project Type**: workflow orchestration tool（workflowhub 核心项目）
**Performance Goals**: N/A（无性能类需求）
**Constraints**: 不引入阻断式质量门（宪法 F4/Q1/Q2）；两阶段审查须独立子代理独立上下文（避免自审自判，Q3）；原子提交时机集中在 orchestrating skill，实现子代理禁止自行 commit
**Scale/Scope**: 3 个既有文件修订（`workflows/build-code/SKILL.md`、`workflows/build-code/capture.mjs`、`reuse-registry.md` 合并迁移），预估 ~400-600 行改动（含新增章节）

**Cross-Repo Dependency Lock（spec §Known Gap #5 要求）**：`test-routing-advisor` 跨仓依赖版本/路径锁定如下——
- 仓库：`https://github.com/Hugh4424/AgentHub.git`
- 路径：`packages/core/agenthub/skills/test-routing-advisor/SKILL.md`
- 锁定 commit：`f59b4b471df3522fcf46ec4f01c78874c90ded3c`（2026-06-20）
- 维护主体：agenthub 仓库；本任务不修改该文件，仅按此 commit 引用调用协议

## Constitution Check

*GATE: Phase 0 research 已完成，Phase 1 设计如下逐条自查（21 条，对照 constitution-checklist.md）。*

### 框架原则（F）

- [x] **F1 薄核心** — 判据：核心（workflowhub 调度层）零改动，改动全部下沉到 `workflows/build-code/SKILL.md` 单个工作流文件 + 其配套 `capture.mjs`，牵连面小。
- [x] **F2 窄契约** — 判据：evidence 五件套 / `facts.tests.risk_level` / `worktree.json` 均为窄而明确的 JSON/Markdown 接口，字段版本兼容规则见 `data-contracts.md`。
- [x] **F3 物理事实靠机器校验但不阻断** — 判据：risk_level 定级失败、L2 冒烟失败均只记录 + escalate_to_human，不阻断 build-code 继续（AC-RISK-003、AC-SMOKE-002）。
- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001 把原单链自审拆为两个独立子代理（各自独立上下文），取代自审自判；局限：两子代理共用同一引擎（codex），非严格异源引擎，用户已确认接受（spec 附录 B Known Gap #3，非阻断）。
- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：mtime 时序防伪机制已因 F10 四问不达标（安全剧场，`touch` 可绕过）被用户决策整条移除，体现"无用则移除"。
- [x] **F6 统一外置执行记录** — 判据：新增四字段（commit_sha/base_sha/head_sha/risk_level）统一落 `capture.mjs` 采集，纳入 evidence 五件套 + journal，可回溯。
- [x] **F7 推进与不可逆操作不自动越过人** — 判据：原子提交时机收敛在 orchestrating skill（非子代理自行 commit）；C 类升级（连续 3 次 revise_required）触发 escalate_to_human，不自动越过人处理。
- [x] **F8 简单优先** — 判据：simplicity-guard 四阶梯判断结论为"复用优先"（见下方 Complexity Tracking），四个新增/改造能力全部基于本项目已有的 checkpoint-protocol / review-trigger / verdict-handler 三技能改造，无新造轮子。
- [x] **F9 可证伪不假绿** — 判据：Step6 M10 baseline 对照严格遵守"不可得写 unknown + 原因"，不使用占位值（0/-/--）。
- [x] **F10 自动化按真实收益添加** — 判据：本计划提出的每个新机制均过 F10 四问（见下方 F10 Anti-Over-Engineering Gate 章节），无法四问皆答的机制已被移除（mtime 防伪）。

### 质量原则（Q）

- [x] **Q1 记事实而非阻断** — 判据：同 F3，风险定级/冒烟/审查结果均为记录浮现，不做阻断门。
- [x] **Q2 gate 三类划分** — 判据：风险定级、L2 冒烟归"记录采集类"；两阶段审查归"独立审查+人工确认类"（C 类升级触发人工）；无新增"记录型误做阻断门"的情况。
- [x] **Q3 异源审查加人工把关** — 判据：两个独立审查子代理分别独立上下文产出 verdict，连续失败升级人工把关；局限同 F4（同引擎非异源），用户已确认接受。

### 技能原则（S）

- [x] **S1 能用外部就不造轮子** — 判据：L2 集成冒烟复用 agenthub 仓库已有的 `test-routing-advisor` 技能，未重造。
- [x] **S2 外部技能可针对项目改造合宪** — 判据：checkpoint-protocol / review-trigger / verdict-handler 均为本项目自研技能，本轮按需改造字段/触发逻辑以适配 workflowhub 契约。
- [ ] **S3 迭代时保持最新并就地检查** — 判据：本轮未做"市面同类方案是否有更新"的专项调研（调研聚焦内部历史教训 m13a/m13c，未覆盖外部同类方案版本核查），标记不达标，非阻断，留待后续迭代补充。
- [x] **S4 自定义技能必须有指标系统** — 判据：`capture.mjs` 新增字段直接纳入现有统一 metrics 采集管线，无游离于指标系统外的新技能。
- [x] **S5 自定义技能方便子代理调用省主上下文** — 判据：两个独立审查子代理产物文件化（verdict.md），orchestrating skill 只读取摘要，不占用主上下文全文。
- [ ] **S6 自定义技能参考市面方案不闭门造车** — 判据：本轮设计主要参考 v3 设计文档预设计 + 内部历史教训，未见明确的市面方案横向调研记录，标记不达标，非阻断。
- [x] **S7 一阶段一技能一工作流一文件夹** — 判据：build-code 仍是独立 workflow 文件夹，本轮无新增/拆分阶段，目录约定不变。
- [x] **S8 自定义技能可独立调用可搬运** — 判据：worktree_root 等路径均为调用方可配置参数（非硬编码宿主路径），已在 `workflows/build-code/SKILL.md` 现有第 71-89 行体现该纪律，本轮沿用。

**完整性**：21/21 条已填 status + rationale，2 条（S3/S6）为 `[ ]` 不符合，按 FR-CONSTITUTION-002 不阻断语义记录，不影响 stage-result 成功。

## Project Structure

### Documentation (this feature)

```text
specs/m13d-build-code-deepening/
├── spec.md              # Build-spec output (authoritative)
├── research.md           # spec-research output (本阶段 Step0 产出)
├── data-contracts.md     # 本阶段 Step1.5 产出
├── plan.md               # spec-plan output（本文件）
├── tasks.md              # spec-tasks output（下一步 Step3 产出）
├── cross-artifact-analysis.md  # spec-analyze output（Step4 产出）
├── constitution-check.md # build-spec 阶段已产出（历史文件，本阶段 Constitution Check 见上）
├── f10-findings.md       # build-spec 阶段已产出（mtime 防伪移除结论）
├── baseline-report.md    # build-spec 阶段已产出
└── evidence/             # build-code 实施阶段产出证据五件套
```

### Source Code (repository root)

```text
workflows/build-code/SKILL.md       # MODIFY — 新增 P0-P3 风险定级、L2 冒烟、两阶段审查+原子提交三大章节
workflows/build-code/capture.mjs    # MODIFY — 新增 commit_sha/base_sha/head_sha/risk_level 四字段（向后兼容，不删旧字段）
skills/reuse-registry.md            # NEW — 合并根目录 reuse-registry.md + config/reuse-registry.md 为唯一权威版本
reuse-registry.md（根目录）           # DELETE — 迁移后删除，避免双份不同步
config/reuse-registry.md            # DELETE — 迁移后删除，避免双份不同步
tests/reuse-registry.test.mjs       # MODIFY — 路径常量迁移至 skills/reuse-registry.md（断言逻辑不变，Step 10 核对发现）
tests/m12-reuse-registry.test.mjs   # MODIFY — 同上
tests/five-skills-present.test.mjs  # MODIFY — 同上
tests/moat-skills.test.mjs          # MODIFY — 路径常量从 config/reuse-registry.md 迁移至 skills/reuse-registry.md
tests/m13-make-decision.test.mjs    # MODIFY — 路径常量迁移至 skills/reuse-registry.md
```

**Structure Decision**：改动全部落在 build-code 单一 workflow 文件夹内（宪法 S7"一阶段一工作流一文件夹"），reuse-registry.md 从两处重复迁移合并为 `skills/` 下唯一权威版本（消除双份不同步风险，呼应 F2 窄契约"唯一真相源"精神）。不新增 workflow 目录，不触碰 build-spec/build-plan/verify-code 的 SKILL.md（spec §2 边界明确排除）。

## Complexity Tracking

simplicity-guard 四阶梯判断结论（P0-P3 全部走到"改造复用"档）：

- **风险定级能力**：P0 需要（用户场景明确要求）→ P1 仓库无现成 →P2 checkpoint-protocol 已有 phase 元数据挂载点，改造复用（新增 risk_level 字段挂载）。
- **L2 集成冒烟**：P0 需要 → P1 agenthub 仓库已有 test-routing-advisor → 直接复用（P1 命中，不进 P2/P3）。
- **两阶段独立审查**：P0 需要 → P1 无现成拆分实现 → P2 review-trigger + verdict-handler 改造（拆分触发逻辑 + A/B/C 升级判定），复用。
- **原子提交留痕**：P0 需要 → P1 无现成 → P2 checkpoint-protocol 已有 commit 时机挂载点，改造复用（只取字段落 GREEN.json）。

WHY: 四项能力均选择"改造已有自研技能"而非新造独立组件。
TRADEOFF: 改造已有技能需要兼容其原有调用方，字段/接口改动需保证向后兼容（已在 data-contracts.md 逐一注明版本兼容规则）。
JUSTIFICATION: 避免维护面翻倍（宪法 F1 薄核心 + S1 不造轮子），且历史教训（m13a 曾因合并/拆分不当引入隐式契约）表明本轮拆分/改造需谨慎守窄契约边界，已在 data-contracts.md 中显式定义。

无宪法违规需额外说明的情况（S3/S6 已在 Constitution Check 中记录为非阻断待办，不构成 complexity violation）。

## F10 Anti-Over-Engineering Gate

对本计划涉及的每个新机制/检查/自动化逐一回答 F10 四问，标注 KEEP/PRUNE：

| 机制 | 1. 防御什么真实威胁 | 2. 已有机制覆盖？ | 3. 可否被绕过（安全剧场风险） | 4. 长期维护成本 | 结论 |
|---|---|---|---|---|---|
| P0-P3 风险定级 | 高风险 phase 缺少测试覆盖提示，隐患漏测 | 无（现状仅 TDD RED/GREEN，无分级） | 定级本身不阻断，误定级只影响提示，不构成可绕过的安全机制 | 低——挂载在现有 facts.tasks 读取点，无新基础设施 | **KEEP** |
| L2 集成冒烟 | phase 级测试通过但集成层断裂未被发现 | 无（现状无集成层测试） | 冒烟失败不阻断，非门禁，无绕过意义 | 低——复用 agenthub 现成 test-routing-advisor，非自建 | **KEEP** |
| 两阶段独立审查拆分 | 单链自审自判导致审查盲区（历史教训 m13c 记录在案） | 现状单链 3rd-review 覆盖不足两个正交维度 | 两子代理独立触发，无法用改一处绕过全部；局限是同引擎非异源（已知非阻断） | 中——两套 verdict 文件+A/B/C 升级判定逻辑，维护成本高于单链，但对应真实历史缺陷 | **KEEP** |
| verdict-handler A/B/C 升级 | 连续失败无自动升级机制，问题被反复忽略 | 无（现状无升级计数逻辑） | 计数逻辑清晰，无法静默绕过（升级触发写入结构化记录） | 低——复用改造 verdict-handler，非新建 | **KEEP** |
| 原子提交留痕 | 提交历史噪音、无法追溯 phase 对应的 commit 边界 | 无（现状 GREEN.json 无 commit_sha 字段） | 记录事实类字段，非阻断门，无绕过意义 | 低——checkpoint-protocol 改造，只加三字段 | **KEEP** |
| mtime 时序防伪（对照组，已移除） | 意图防止证据文件被篡改时间戳 | 无原生机制 | **可被 `touch -t` 直接绕过**，跨文件系统精度不一致 | 维护成本存在但换不来真实防御 | **PRUNE**（已被用户决策移除，不在本计划范围内，列此行仅作 F10 判断对照） |

结论：本计划新增的 5 项机制全部通过 F10 四问，判定 KEEP；唯一未通过的 mtime 防伪机制已在 build-spec 阶段被移除，不在本轮实施范围内。

## Implementation Steps

### Phase 1: Setup / Foundation

#### 1.1: reuse-registry.md 合并迁移
描述：读取根目录 `reuse-registry.md` 与 `config/reuse-registry.md` 两份内容，去重合并，新增本轮四个复用/改造技能条目（checkpoint-protocol、review-trigger、verdict-handler、test-routing-advisor），写入 `skills/reuse-registry.md` 作为唯一权威版本，删除旧两份文件；同步迁移 5 个现有测试文件中硬编码的旧路径常量（仅改路径，断言逻辑不变）。
**Files**: `skills/reuse-registry.md`（NEW），`reuse-registry.md`（DELETE），`config/reuse-registry.md`（DELETE），`tests/reuse-registry.test.mjs`/`tests/m12-reuse-registry.test.mjs`/`tests/five-skills-present.test.mjs`/`tests/moat-skills.test.mjs`/`tests/m13-make-decision.test.mjs`（MODIFY，路径迁移）
**Maps to**: FR-REUSE-001

#### 1.2: capture.mjs 字段扩展
描述：在 `workflows/build-code/capture.mjs` 现有输出对象中新增 `commit_sha`、`base_sha`、`head_sha`、`risk_level` 四字段，值不可得时写 `null`（字段必须存在），不删除/不改动现有 7 个字段（command/cwd/git_sha/exit_code/timestamp/content_hash/anomaly_flags）。
**Files**: `workflows/build-code/capture.mjs`
**Maps to**: FR-METRICS-001

### Phase 2: Core Implementation

#### 2.1: P0-P3 风险定级章节
描述：在 `workflows/build-code/SKILL.md` 新增风险定级步骤——从 `facts.tasks` 读取每个 phase 的风险标注，写入 `facts.tests[].risk_level`（P0-P3），P0 phase 触发更严格测试覆盖提示日志；定级失败不阻断执行，只记录。
**Files**: `workflows/build-code/SKILL.md`
**Maps to**: FR-RISK-001

#### 2.2: L2 集成冒烟章节
描述：所有 phase GREEN 后，调用 agenthub 仓库的 `test-routing-advisor` 技能生成 `l2-integration-test-report.json`（**routing_tier + routing_rationale（非空字符串，档位选择理由）+ result + ts**）；冒烟失败不阻断 build-code。（独立审查 round2/round3 发现：此前本节仅写 routing_tier+result+ts、"理由需可追溯"未落成具体字段名，与 data-contracts.md/tasks.md T004/T010 已定义的 routing_rationale 必填字段脱节，现已对齐）
**Files**: `workflows/build-code/SKILL.md`，`specs/m13d-build-code-deepening/evidence/l2-integration-test-report.json`（运行期产出，非本阶段产出）
**Maps to**: FR-SMOKE-001, AC-SMOKE-003

#### 2.3: 两阶段独立审查拆分
描述：3rd-review 拆为两个独立子代理，分别产出 `spec-compliance-verdict.md`（合规性维度）和 `code-quality-verdict.md`（代码质量维度），二者独立文件、维度不重叠，任一失败不终止另一个。
**Files**: `workflows/build-code/SKILL.md`
**Maps to**: FR-REVIEW-001

#### 2.4: verdict-handler A/B/C 升级分类
描述：verdict-handler 监控同一 phase/stage 同一审查子代理连续 `revise_required` 次数，达 3 次触发 C 类升级（escalate_to_human），升级时产出结构化记录；**escalate_to_human 触发后必须暂停自动推进、等待人工确认（AC-REVIEW-006），不可只写记录后自动继续下一轮重试循环**（独立审查 round2 发现：本节此前只写"产出记录"，未在 plan.md 主文档中重申暂停要求，虽 tasks.md T006 已含此要求，但 plan.md 作为主实施依据也须明确，避免实现方只读 plan.md 漏掉暂停语义）。
**Files**: `workflows/build-code/SKILL.md`
**Maps to**: FR-REVIEW-002, AC-REVIEW-006

#### 2.5: 原子提交留痕
描述：提交时机收敛在 orchestrating skill 层，语义完整点才 commit；`commit_sha`/`base_sha`/`head_sha` 写入 GREEN.json，实现子代理不得自行 commit。
**Files**: `workflows/build-code/SKILL.md`，`workflows/build-code/capture.mjs`
**Maps to**: FR-COMMIT-001

#### 2.6: worktree 预建时机协议对齐
描述：build-code 阶段确认 `tasks/{task-id}/worktree.json` 存在即直接复用（不重复拉取），不存在时按 make-decision 阶段规则自建；本任务自身已验证复用成功（`tasks/m13d-build-code-deepening/worktree.json`）。**新增异常路径**（独立审查 round2/round3 发现：本节此前只写存在/不存在两种正常分支，与 tasks.md T008 已补的异常分支脱节，现已对齐）——文件内容损坏（JSON 解析失败或 `worktree_root` 非法/指向不存在路径）时不得读取继续，escalate_to_human 并停止推进；checkout 失败时不写 worktree.json（AC-WORKTREE-003：文件不存在优于存在损坏内容）。
**Files**: `workflows/build-code/SKILL.md`（读取协议说明，不改变已生效的 worktree_root 配置机制）
**Maps to**: FR-WORKTREE-001, AC-WORKTREE-003

### Phase 3: Polish / Verification

#### 3.1: 文档一致性核对
描述：核对 `workflows/build-code/SKILL.md` 修订后与 `data-contracts.md` 五类契约字段命名完全一致，无別名/拼写不一致（尤其 `rework_proxy_count` 等禁止别名字段）。
**Files**: `workflows/build-code/SKILL.md`，`specs/m13d-build-code-deepening/data-contracts.md`
**Maps to**: FR-METRICS-001, FR-RISK-001, FR-SMOKE-001

#### 3.2: evidence 五件套单测补充
描述：为 phase-N-RED.json / phase-N-GREEN.json / l2-integration-test-report.json 新增字段补充单元测试断言（字段存在性、枚举值合法性）。
**Files**: `tests/m13d-build-code-deepening.test.mjs`（NEW）
**Maps to**: AC-RISK-001, AC-SMOKE-001, AC-METRICS-001~003

## Verification Mapping

| Implementation Step | FR | AC |
|---|---|---|
| 1.1 reuse-registry.md 合并 | FR-REUSE-001 | AC（spec 附录已核实自研无需来源URL，见 spec Known Gap #(b)） |
| 1.2 capture.mjs 字段扩展 | FR-METRICS-001 | AC-METRICS-001, AC-METRICS-002, AC-METRICS-003 |
| 2.1 风险定级 | FR-RISK-001 | AC-RISK-001, AC-RISK-002, AC-RISK-003 |
| 2.2 L2 集成冒烟 | FR-SMOKE-001 | AC-SMOKE-001, AC-SMOKE-002, AC-SMOKE-003 |
| 2.3 两阶段独立审查 | FR-REVIEW-001 | AC-REVIEW-001, AC-REVIEW-002, AC-REVIEW-003 |
| 2.4 verdict-handler A/B/C | FR-REVIEW-002 | AC-REVIEW-004, AC-REVIEW-005, AC-REVIEW-006 |
| 2.5 原子提交留痕 | FR-COMMIT-001 | （spec §4 对应 AC，字段落 GREEN.json） |
| 2.6 worktree 协议对齐 | FR-WORKTREE-001 | worktree.json 已验证复用成功（决策阶段验收标准） |
| 3.1 文档一致性核对 | 跨 FR | 全部 evidence 字段命名与 data-contracts.md 一致 |
| 3.2 单测补充 | 跨 FR | AC-RISK-001, AC-SMOKE-001, AC-SMOKE-003, AC-METRICS-001~003 |

### Scope Boundary Verification

不可触碰的文件和路径（根据 spec §2 边界明确排除）：

- `workflows/verify-code/SKILL.md` — 不改动（M13e 查痕消费端实现属另一任务）
- `workflows/build-plan/SKILL.md` — 不改动（data-contracts.md 产出机制已在 M13c 落地生效，本任务不重复实现）
- `workflows/build-spec/SKILL.md` — 不改动
- 第二个异源审查引擎接入 — 不实现（用户已确认接受单引擎，非本任务范围）
