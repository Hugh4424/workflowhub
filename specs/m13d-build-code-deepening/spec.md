---
task_id: m13d-build-code-deepening
milestone: M13d
stage: build-spec
source_decision_log: /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/m13d-build-code-deepening/decision-log.md
status: draft
spec_version: 1.0.0
---

# 功能规格：build-code 深化（M13d）

> 基于 decision-log.md（m13d-build-code-deepening，D1-D7，user_decision:true，S9 已批准 2026-07-01）。
> 本文件不可覆盖项目级规则。CONSTITUTION.md 优先。

**功能名**: `m13d-build-code-deepening`
**来源**: decision-log.md M13d（make-decision 阶段，user_decision: true）
**状态**: 草稿

---

## 速读卡（30 秒看懂这个需求）

**一句话需求**：在 `workflows/build-code/SKILL.md` 中补齐三项质量能力——P0-P3 风险定级、L2 集成冒烟、两阶段独立审查+原子提交，同时修复 worktree 创建时机使跨任务并行成为可能，并将 reuse-registry.md 统一迁移至 `skills/`。（mtime 时序防伪机制已按用户决策移除，见 §Known Gaps / f10-findings.md：安全剧场风险，touch 即可绕过）

**核心改动点**：
1. `workflows/build-code/SKILL.md`：新增 §1 风险定级、§L2 冒烟、两阶段审查子代理拆分、原子提交规则
2. `metrics/capture.mjs`：新增 commit_sha / base_sha / head_sha / risk_level 四字段
3. `skills/reuse-registry.md`：新建并迁移合并原有两份重复文件，补登记三个复用技能
4. worktree 状态文件 `tasks/{task-id}/worktree.json`：跨阶段共享，make-decision 阶段已建
5. evidence 五件套格式契约（phase-N-RED.json / phase-N-GREEN.json / l2-integration-test-report.json / spec-compliance-verdict.md / code-quality-verdict.md）

**最大影响面**：`workflows/build-code/SKILL.md`（主体）、`metrics/capture.mjs`（字段扩展）

**验收信号**：evidence 五件套真实产出 + risk_level 落地 facts.tests + 两个独立审查子代理各自产出 verdict 文件 + commit_sha 写入 GREEN.json

---

## 序言：spec-ladder 档位判断 + F10 反过度工程四问

### 档位判断

**档位：C 档（大改动）**

依据：
- 跨系统边界：build-code（SKILL.md）、metrics（capture.mjs）、reuse-registry（新位置）、worktree 状态文件跨阶段传递，4 个不同子系统均有改动
- 新引入依赖机制：复用 review-trigger / verdict-handler / checkpoint-protocol 三个本项目自研技能（部分改造）
- 破坏性变更：worktree 创建时机从"按需建"改为"make-decision 阶段预建"，影响所有后续阶段的读取流程
- 影响范围分析见"§8 影响范围"

完整三层结构必填，额外要求影响范围分析。

### F10 反过度工程四问（FR-LADDER-002）

| 机制 | Q1 防御什么真实威胁 | Q2 是否已有覆盖 | Q3 是否可绕过成为剧场 | Q4 长期维护成本 |
|---|---|---|---|---|
| P0-P3 风险定级 | 高风险 phase 缺测试覆盖导致假绿 | 无（现有 TDD 无优先级区分）| 若跳过读 facts.tasks 可绕过，但行为被记录可追溯 | 低：只读字段、写结论，无新基础设施 |
| L2 集成冒烟 | 单元绿但集成边界失效 | 无（现有只有 L1 TDD）| 可不触发，但结果记入 evidence 留痕 | 中：需维护 test-routing-advisor 三档逻辑（agenthub 仓库跨仓依赖，来源已定位） |
| 两阶段独立审查 | 单链审查视角盲区 | 已有单链 3rd-review（不拆分）| 两子代理共用同引擎不构成异源，已用户确认接受 | 中：多一个子代理生命周期 |
| 原子提交 | phase 产物散落无法追溯 | 现有无提交约束 | orchestrating skill 控制提交时机，实现子代理被禁止 | 低：commit 动作集中在一处 |
| worktree 预建 | 按需建导致任务间抢 repo | 现有 M13c 方案被用户否决 | 无绕过路径（状态文件为 source of truth）| 低：一次建、四阶段复用 |

结论：所有六项机制均有真实防御对象，均无现有覆盖，均由 SKILL.md 执行层强制记录（非 bash 门禁），维护成本合理。无过度工程 finding。

---

## 1. 问题陈述

**当前**：`workflows/build-code/SKILL.md` 已有 TDD RED/GREEN + content_hash 假绿检测 + 单链 3rd-review + facts.review，但缺失四项能力：
1. P0-P3 风险定级：无法识别高风险 phase 需要额外测试覆盖
2. L2 集成冒烟：所有 phase GREEN 后无跨 phase 集成验证
3. 两阶段独立审查：单一 3rd-review 链无法覆盖"spec 合规性"与"代码质量"两个正交维度

此外，worktree 创建时机设计导致跨任务并行不可能（任务间会抢同一 repo 目录），reuse-registry.md 存在两处重复文件且均不在 `skills/` 标准位置。

**问题**：以上三项质量缺口使 build-code 产出的 evidence 对下游 M13e 查痕消费不完整；worktree 时机问题阻碍并行执行效率。

---

## 2. 背景、目标和边界

### 背景

M13 系列深化工作目标是使 workflowhub 的 build-* 流水线每阶段产出标准化、可追溯的 evidence，供后续阶段和下游任务（M13e）消费。M13d 是继 M13b（build-spec 深化）、M13c（build-plan 深化）之后的第三个深化任务，专注于 build-code 质量能力补齐。

M13c 落地的是 data-contracts 机制本身（`workflows/build-plan/SKILL.md` Step 1.5，已实现生效）；M13d 自己的 data-contracts.md 是任务级产物，将在 M13d 进入其自身 build-plan 阶段时由该机制产出，不是本阶段依赖（原判断为阶段顺序理解错误，已于附录B Known Gap #1 更正关闭）。

v3 设计文档（`.stage-deepening-milestones-v3.md` M13d 段）给出的字段定义为本轮权威落地依据。

### 目标

- 在不违反"薄核心窄契约、记录事实不阻断、质量靠独立审查"宪法原则的前提下，补齐 build-code 三项质量能力
- 复用优先于新建：review-trigger / verdict-handler / checkpoint-protocol 三个本项目自研技能按需改造后复用
- worktree 并行隔离：任意两个 task 的 build-code 实例可并行运行互不干扰

### 边界

- 本任务范围：`workflows/build-code/SKILL.md` 修订 + `metrics/capture.mjs` 字段扩展 + `skills/reuse-registry.md` 迁移合并 + evidence 格式契约定义
- 不包含：M13e 查痕消费端实现、data-contracts.md 产出（属 M13d 自身 build-plan 阶段职责，非本阶段）、第二个异源审查引擎接入（已用户确认接受单引擎）

---

## 3. 用户场景与用例

### 场景 A：高风险 phase 自动获得更严格测试覆盖提示

给定 build-code 执行 phase-2，当 phase-2 在 facts.tasks 中被读取并定级为 P0 时，则 facts.tests 中该 phase 的 risk_level 字段记录为 P0，执行日志中出现对应提示，要求该 phase 的行为必须有当前 phase 的测试覆盖。

### 场景 B：所有 phase 完成后触发 L2 冒烟

给定所有 phase 均达到 GREEN 状态，当 build-code 完成最后一个 phase 后，则 test-routing-advisor 按任务特征选择 simple/feature/fullstack 三档之一触发冒烟，结果落盘 evidence/l2-integration-test-report.json，无论冒烟通过或失败均不阻断 build-code 继续（记录事实，不阻断）。

### 场景 D：两阶段独立审查各自产出 verdict

给定一个 phase 完成并到达审查节点，当 build-code orchestrating skill 触发 3rd-review 时，则 spec-compliance-verdict.md（spec 合规性审查）和 code-quality-verdict.md（代码质量审查）由两个独立子代理各自产出，二者产物路径不同，内容维度不交叉。

### 场景 E：verdict-handler 连续失败升级

给定某 phase/stage 的某个独立审查子代理，当同一子代理连续 3 次返回 revise_required 时，则 verdict-handler 将该事件分类为 C 类，触发 escalate_to_human，不再继续自动循环。

### 场景 F：原子提交 commit_sha 写入 GREEN.json

给定 phase GREEN 确认后，当 orchestrating skill（非实现子代理）执行原子提交时，则 commit_sha 写入当前 phase 的 GREEN.json，evidence JSON 同时含 base_sha / head_sha，实现子代理在整个 phase 周期内禁止自行提交。

### 场景 G：worktree 跨任务并行不冲突

给定两个不同 task-id 的 build-code 实例同时运行，当两者均从各自 tasks/{task-id}/worktree.json 读取 worktree_root 时，则两者使用的 worktree 路径不同，互不干扰，make-decision 阶段已预建并记录状态文件。

### 场景 H：reuse-registry.md 统一入口

给定任意阶段需要查找已复用的技能，当查阅 skills/reuse-registry.md 时，则该文件包含所有已复用技能的来源信息（含 checkpoint-protocol / review-trigger / verdict-handler，均为本项目自研），不存在根目录或 config/ 下的重复文件。

---

## 4. 功能需求（FR）

### FR-RISK-001：P0-P3 风险定级读取与写入

**描述**：build-code §1 阶段，读取 facts.tasks 对当前任务每个 phase 进行 P0-P3 风险定级，结论写入 facts.tests 的 risk_level 字段。

**场景**：
- Given: build-code 开始执行，facts.tasks 中存在 phase 列表
- When: §1 风险定级步骤执行
- Then: facts.tests 中每个 phase 对应条目含 risk_level 字段（P0/P1/P2/P3 之一），P0 phase 触发"行为必须有当前 phase 测试覆盖"提示

**验收条件**：
- AC-RISK-001: facts.tests 中所有 phase 的 risk_level 字段均有值，不为 null
- AC-RISK-002: P0 定级的 phase 在执行日志中出现可追溯的覆盖提示记录
- AC-RISK-003: 定级结果不阻断 build-code 继续执行

---

### FR-SMOKE-001：L2 集成冒烟触发与落盘

**描述**：所有 phase 达到 GREEN 后，按 test-routing-advisor 三档逻辑触发 L2 集成冒烟，结果落盘。

**场景**：
- Given: 所有 phase 均为 GREEN 状态
- When: L2 冒烟触发节点到达
- Then: test-routing-advisor 依据任务特征选 simple/feature/fullstack 三档之一，冒烟运行，结果写入 evidence/l2-integration-test-report.json

**验收条件**：
- AC-SMOKE-001: evidence/l2-integration-test-report.json 文件存在，含冒烟结果（pass/fail）、所选档位、执行时间戳
- AC-SMOKE-002: 冒烟失败不阻断 build-code 整体流程，但结果已记录
- AC-SMOKE-003: 三档选择依据（simple/feature/fullstack）记录在报告中可追溯

---

### （已移除）FR-ANTIFORGERY-001：mtime 时序校验与升级

**状态**：已按用户决策移除，不纳入本 spec。原因：mtime 可被 `touch -t` 等命令直接篡改，属安全剧场——只挡诚实失误、挡不住主动作弊，维护成本却持续存在（F10 门四问结论，详见 f10-findings.md）。此处保留标题作审计留痕，不再有对应 FR/AC/GWT 场景。

**场景**：
---

### FR-REVIEW-001：3rd-review 拆分为两个独立子代理

**描述**：3rd-review 由两个独立子代理分别执行 spec 合规性审查（产出 spec-compliance-verdict.md）和代码质量审查（产出 code-quality-verdict.md），二者维度正交，产物路径独立。

**场景**：
- Given: phase 达到审查节点
- When: 两个独立审查子代理被触发
- Then: spec-compliance-verdict.md 仅包含 spec 合规性维度的审查结论，code-quality-verdict.md 仅包含代码质量维度的审查结论，二者为独立文件

**验收条件**：
- AC-REVIEW-001: spec-compliance-verdict.md 和 code-quality-verdict.md 均存在于 evidence/ 目录下
- AC-REVIEW-002: 两个文件的内容维度不重叠（一个聚焦 spec 符合度，一个聚焦代码质量）
- AC-REVIEW-003: 任一子代理失败不自动终止另一子代理

---

### FR-REVIEW-002：verdict-handler A/B/C 升级分类

**描述**：verdict-handler 监控同一 phase/stage 的同一审查子代理连续返回 revise_required 次数，达到 3 次时触发 C 类升级（escalate_to_human）。

**场景**：
- Given: 某审查子代理对同一 phase/stage 返回 revise_required
- When: 同一子代理连续第 3 次返回 revise_required
- Then: verdict-handler 输出 C 类分类，触发 escalate_to_human，不再继续自动循环；1-2 次时仅记录（A/B 类）

**验收条件**：
- AC-REVIEW-004: A 类（1次）、B 类（2次）、C 类（3次）分类阈值明确记录在 SKILL.md 中
- AC-REVIEW-005: C 类触发时产出包含升级原因的结构化记录
- AC-REVIEW-006: escalate_to_human 触发后不自动推进，等待人工确认

---

### FR-COMMIT-001：原子提交由 orchestrating skill 统一执行

**描述**：每个 phase GREEN 确认后，由 orchestrating skill 执行原子提交，commit_sha 写入 GREEN.json，evidence JSON 含 base_sha / head_sha。实现子代理（implementer）在 phase 周期内禁止自行提交。

**场景**：
- Given: phase GREEN 确认完成
- When: orchestrating skill 执行原子提交
- Then: commit_sha 写入 GREEN.json，base_sha 和 head_sha 写入相应 evidence JSON，实现子代理在此前整个 phase 周期内未执行任何 git commit

**验收条件**：
- AC-COMMIT-001: GREEN.json 含 commit_sha 字段，值为合法 git commit SHA
- AC-COMMIT-002: evidence JSON 含 base_sha（提交前最后一个 SHA）和 head_sha（提交后 SHA）
- AC-COMMIT-003: SKILL.md 中实现子代理（implementer）段落存在"DO NOT commit"或等效禁止指令

---

### FR-WORKTREE-001：worktree 状态文件跨阶段复用

**描述**：make-decision 阶段在发现 worktree 不存在时主动 checkout 并写入 `tasks/{task-id}/worktree.json`；build-spec / build-plan / build-code / verify-code 四阶段优先读该文件复用，不存在才兜底自建。checkout 失败时 escalate_to_human，不写入损坏内容。

**场景**：
- Given: build-code 阶段开始执行
- When: 读取 tasks/{task-id}/worktree.json
- Then: 若文件存在且完整，直接复用其中 worktree_root；若文件不存在，兜底自建并写入；若文件存在但内容损坏，不读取损坏内容，escalate_to_human

**验收条件**：
- AC-WORKTREE-001: 两个不同 task-id 的 build-code 并行运行时，各自使用独立的 worktree_root，不发生路径冲突
- AC-WORKTREE-002: worktree.json 包含 worktree_root / created_at_stage / ts 三个字段
- AC-WORKTREE-003: checkout 失败时不写 worktree.json（文件不存在优于存在损坏内容）

---

### FR-REUSE-001：reuse-registry.md 统一迁移至 skills/

**描述**：`skills/reuse-registry.md` 作为唯一权威注册表，合并原有根目录和 `config/` 下两份重复内容，补登记三个本任务新引用的复用技能（checkpoint-protocol / review-trigger / verdict-handler，均为本项目自研，非外部引入）。

**场景**：
- Given: 任意阶段需要查找已复用外部技能
- When: 查阅 skills/reuse-registry.md
- Then: 文件存在且包含所有已知复用技能的来源信息；根目录和 config/ 下不再存在重复文件

**验收条件**：
- AC-REUSE-001: skills/reuse-registry.md 存在，含三个新技能条目（checkpoint-protocol / review-trigger / verdict-handler）
- AC-REUSE-002: 每个条目含来源字段，标注"本项目自研"（非外部引入，无需来源 URL）
- AC-REUSE-003: 迁移完成后根目录和 config/ 下的重复文件已删除（不可逆操作，在 build-code 实施阶段执行）

---

### FR-METRICS-001：metrics/capture.mjs 新增四字段

**描述**：`metrics/capture.mjs` 记录的 evidence JSON 新增 commit_sha / base_sha / head_sha / risk_level 四个字段。

**场景**：
- Given: build-code 完成一个 phase
- When: metrics/capture.mjs 写入 evidence 记录
- Then: 写入的 JSON 含 commit_sha / base_sha / head_sha / risk_level 四字段，值可为 null 但字段必须存在

**验收条件**：
- AC-METRICS-001: GREEN.json 中含 commit_sha / base_sha / head_sha / risk_level 四字段
- AC-METRICS-002: risk_level 值为 P0/P1/P2/P3 之一（或 null 若定级未执行）
- AC-METRICS-003: 字段新增不破坏现有字段（向后兼容，现有字段保持不变）

---

## 5. 关键实体与数据

### 证据五件套（evidence 五件套）

| 文件 | 产出阶段 | 关键字段 |
|---|---|---|
| phase-N-RED.json | 每 phase RED 时 | phase_id, content_hash, ts, risk_level |
| phase-N-GREEN.json | 每 phase GREEN 时 | phase_id, content_hash, ts, risk_level, commit_sha, base_sha, head_sha |
| l2-integration-test-report.json | 所有 phase GREEN 后 | routing_tier, result (pass/fail), ts |
| spec-compliance-verdict.md | 3rd-review 子代理 1 | verdict (pass/revise_required), findings |
| code-quality-verdict.md | 3rd-review 子代理 2 | verdict (pass/revise_required), findings |

### worktree.json

```
{
  "worktree_root": "<绝对路径>",
  "created_at_stage": "make-decision",
  "ts": "<ISO8601>"
}
```

字段与 decision-log §7 验收标准中已落地的证据保持一致。

---

## 6. 模块划分（条件触发）

本功能涉及四个子系统，均有改动：

- **workflows/build-code/SKILL.md**：主体，承载所有新增 phase 步骤和控制逻辑
- **metrics/capture.mjs**：字段扩展，新增四个字段
- **skills/reuse-registry.md**：新建并迁移合并
- **tasks/{task-id}/worktree.json**：跨阶段共享状态（由 make-decision 阶段写入）

自研技能（checkpoint-protocol / review-trigger / verdict-handler）按需改造后以"引用并改造"方式记录在 reuse-registry.md，不新建基础设施文件。

---

## 7. 数据和生命周期（条件触发）

- **evidence 文件**：每 task 一套，task 完成后归档，供 M13e 查痕消费
- **worktree.json**：每 task 一个，make-decision 阶段建，task 全周期复用，task 结束后可清理
- **reuse-registry.md**：项目级常驻文件，每次引入新外部技能时更新

---

## 8. 影响范围分析（C 档必填）

| 受影响模块 | 变更类型 | 影响描述 |
|---|---|---|
| workflows/build-code/SKILL.md | 内容修订 | 主要改动：新增 §1 风险定级、L2 冒烟、两阶段审查、原子提交四个新机制 |
| metrics/capture.mjs | 字段扩展 | 新增四字段，向后兼容，不影响现有字段读写 |
| skills/reuse-registry.md | 新建 + 迁移 | 合并两个旧文件，删除旧位置（不可逆，build-code 实施阶段执行） |
| tasks/{task-id}/worktree.json | 新协议约定 | 跨 4 个阶段（build-spec/plan/code/verify）均需先读此文件 |
| workflows/build-spec/SKILL.md 等 | 协议对齐 | 需在四个阶段各自检查是否已有 worktree.json 读取逻辑（本任务只定方向，各阶段各自对齐） |

**不影响**：verify-code SKILL.md 主体逻辑（仅 worktree 读取协议需对齐）、现有 TDD RED/GREEN 核心机制（保持不变）、content_hash 假绿检测（保持不变）

---

## 9. 不做和隐性必达

### 明确不做

> 以下三项继承自 decision-log §5，design/plan/build 阶段不得逾越。

1. **不实现 `verifier-index-check`**：workflowhub 无对应"中心索引文件"设计，硬套等于凭空建新文件体系，违反"薄核心窄契约"。
2. **不实现 `checkpoint-protocol` 提审前 8 项 bash 自检**：8 项均检查 agenthub 专属文件（workflow-issues.md/AGENTS.md/chat-archiver 产物等），workflowhub 现有产物体系无一对应，不复用这部分逻辑。
3. **不采用"按需 checkout"方案**：即"哪个阶段要读代码就当场 checkout"——已被用户在 decision-log §3 D6 中明确否决。

### 隐性必达

- 所有质量检查均为"记录事实、不阻断"（宪法原则）：L2 冒烟失败、risk_level P0 提示——均记录，不自动阻断 build-code 继续，只有 escalate_to_human 情况才停等人工
- 实现子代理（implementer）在 phase 周期内禁止自行 git commit（FR-COMMIT-001 隐性边界）
- 字段扩展不破坏 metrics/capture.mjs 现有字段（向后兼容）
- `skills/reuse-registry.md` 内三个条目（review-trigger/verdict-handler/checkpoint-protocol）均为本项目自研，来源字段标注"本项目自研"，不写成外部 URL

---

## 10. 验收清单及未决问题

### 验收检查（success_criteria）

| AC 编号 | 验收条件 | 失败判据 | 来源 FR |
|---|---|---|---|
| AC-RISK-001 | facts.tests 中所有 phase 含 risk_level 字段 | 任一 phase 缺 risk_level 或为 null 时未说明原因 | FR-RISK-001 |
| AC-RISK-002 | P0 phase 在日志中有覆盖提示记录 | P0 phase 无任何提示记录 | FR-RISK-001 |
| AC-RISK-003 | 风险定级不阻断后续执行 | 定级失败导致 build-code 中止 | FR-RISK-001 |
| AC-SMOKE-001 | l2-integration-test-report.json 存在且含档位和结果 | 文件不存在或缺 routing_tier / result 字段 | FR-SMOKE-001 |
| AC-SMOKE-002 | 冒烟失败不阻断 build-code | 冒烟失败导致 build-code 中止 | FR-SMOKE-001 |
| AC-SMOKE-003 | 档位选择依据可追溯 | 报告中无档位选择理由 | FR-SMOKE-001 |
| AC-REVIEW-001 | 两个 verdict 文件均存在于 evidence/ | 任一文件缺失 | FR-REVIEW-001 |
| AC-REVIEW-002 | 两文件内容维度不重叠 | 两文件内容基本相同 | FR-REVIEW-001 |
| AC-REVIEW-003 | 一子代理失败不终止另一个 | 任一失败导致另一个未执行 | FR-REVIEW-001 |
| AC-REVIEW-004 | A/B/C 分类阈值明确写入 SKILL.md | SKILL.md 无 A/B/C 分类说明 | FR-REVIEW-002 |
| AC-REVIEW-005 | C 类触发时产出升级记录 | C 类触发无结构化记录 | FR-REVIEW-002 |
| AC-REVIEW-006 | escalate_to_human 后不自动推进 | 升级后仍自动继续循环 | FR-REVIEW-002 |
| AC-COMMIT-001 | GREEN.json 含 commit_sha | commit_sha 字段缺失或为空 | FR-COMMIT-001 |
| AC-COMMIT-002 | evidence JSON 含 base_sha / head_sha | 任一字段缺失 | FR-COMMIT-001 |
| AC-COMMIT-003 | SKILL.md 实现子代理段存在禁止提交指令 | 无"DO NOT commit"或等效指令 | FR-COMMIT-001 |
| AC-WORKTREE-001 | 两 task 并行时 worktree_root 路径不冲突 | 两 task 使用同一路径 | FR-WORKTREE-001 |
| AC-WORKTREE-002 | worktree.json 含三个必填字段 | 任一字段缺失 | FR-WORKTREE-001 |
| AC-WORKTREE-003 | checkout 失败时不写 worktree.json | 失败时写入损坏/空文件 | FR-WORKTREE-001 |
| AC-REUSE-001 | skills/reuse-registry.md 含三个新条目（review-trigger/verdict-handler/checkpoint-protocol） | 任一新技能未登记 | FR-REUSE-001 |
| AC-REUSE-002 | 每条目含来源字段，标注"本项目自研" | 来源字段缺失或错误标注为外部来源 | FR-REUSE-001 |
| AC-REUSE-003 | 迁移后旧位置文件已删除（build-code 阶段） | 旧文件仍存在 | FR-REUSE-001 |
| AC-METRICS-001 | GREEN.json 含四个新字段 | 任一字段缺失 | FR-METRICS-001 |
| AC-METRICS-002 | risk_level 值为 P0/P1/P2/P3 或 null | 值为其他字符串 | FR-METRICS-001 |
| AC-METRICS-003 | 新字段不破坏现有字段 | 现有字段读取报错 | FR-METRICS-001 |

---

## 附录 A：质量事实契约

> build-spec 流水线后续步骤已填充（2026-07-01）。

1. **F10 findings 摘要**：共 4 个新引入机制逐条通过 F10 四问审查（见 `specs/m13d-build-code-deepening/f10-findings.md`）。其中 mtime 防伪时序校验（原 FR-ANTIFORGERY-001）——高安全剧场风险，**已按用户决策整条移除**（非降级，直接去掉）。剩余需人工决策的机制 1 项：L2 冒烟外部技能（FR-SMOKE-001）——test-routing-advisor 维护成本需人工确认是否可接受。P0-P3 风险定级和 3rd-review 双子代理保留（后者用户已批准 S9）。

2. **baseline 对照摘要**：M13d 当前处于 build-spec 阶段，代码未实施，5 项指标（missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count）均为 unknown。M10 基线已从 4 个历史 agenthub task 计算完成（rework_proxy_count 均值 25.25，rework_rounds 均值 6.08）。对照须在 build-code / verify-code 阶段运行后补填。详见 `specs/m13d-build-code-deepening/baseline-report.md`。

3. **独立审查摘要路径**：`specs/m13d-build-code-deepening/evidence/3rd-review-verdict.md`。verdict=**patch is incorrect**（非降级，异源独立审查已完成）。根因：前两次超时是用裸 `codex exec` 跑通用 prompt；诊断后改用正确子命令 `codex exec review --uncommitted`，成功产出 2 条 P2 发现（遗留嵌套 worktree、reuse-registry 验收表与 FR 正文不一致），均已核实并修复。

4. **未解风险**（Known Gaps，见附录 B）：(a)(b) 已关闭——M13c data-contracts 机制已核实生效、reuse-registry 三技能已核实自研无需来源URL；(c) 第二异源审查引擎暂不可用（用户已确认接受单引擎，非阻断）；(d) **已关闭**——3rd-review 本轮用正确子命令成功跑成，verdict=patch is incorrect，发现均已修复；(e) **已关闭**——test-routing-advisor 来源已在 agenthub 仓库定位。

5. **rework_proxy_count**：unknown（build-spec 阶段无执行数据，build-code / verify-code 运行后由 metrics/capture.mjs 采集）。M10 基线 rework_proxy_count 均值 25.25（weak_proxy，推导自 checkpoint_request 计数 D10）。

---

## 附录 B：Known Gaps

> 本节必须存在。空列表表示无已知未解风险。

1. ~~M13c data-contracts.md 尚未落盘~~ — **已关闭（用户 2026-07-01 澄清后核实）**
   - 更正：此前判断是阶段顺序理解错误。`data-contracts.md` 不是 M13c 里程碑本身要产出的全局文件，而是**每个任务自己在其 build-plan 阶段 Step 1.5 产出的任务级产物**（`specs/{task-id}/data-contracts.md`）——已核实 `workflows/build-plan/SKILL.md` Step 1.5（46-53 行）该机制已真实实现并生效
   - 结论：M13d 自己的 `specs/m13d-build-code-deepening/data-contracts.md` 会在 M13d 进入其自身 build-plan 阶段时由该机制自动产出，不是 build-spec 阶段职责，也不存在"上游未落盘"的跨任务契约冲突风险
   - 本 spec 中定义的字段名（evidence 五件套 / risk_level 枚举 / commit_sha / base_sha / head_sha）由本 spec 自身权威定义，下一阶段 data-contracts.md 从本 spec 派生，不是反向依赖，无需假设、无需人工确认

2. ~~reuse-registry.md 技能来源 URL 待补~~ — **已关闭（用户澄清）**
   - 更正：review-trigger / verdict-handler / checkpoint-protocol 三个技能均为**本项目自研**，不是外部引入，不存在需要补的上游 git remote URL；reuse-registry.md 来源字段标注"本项目自研"即为最终状态，不是临时占位
   - （anti-forgery-evidence 随 FR-ANTIFORGERY-001 一并移除，不再纳入 reuse-registry 登记范围）

3. **第二异源审查引擎暂不可用**
   - 事实：gemini 崩溃、antigravity 不可用、grok/cursor 未安装；用户已确认接受单引擎（codex）状态
   - 影响：FR-REVIEW-001 的异源独立性仅由单引擎保证
   - 本次假设：接受当前状态，非阻断；若后续装上其他 provider 应重新评估（用户已确认，此项关闭）

4. ~~3rd-review（codex）未跑成~~ — **已关闭**
   - 根因：前两次用裸 `codex exec "<prompt>"` 跑通用对话式 prompt，90s 超时。诊断（`codex exec review --help`/`codex doctor`）发现正确子命令应为 `codex exec review --uncommitted`（专用于审查 uncommitted 改动），改用后成功产出 verdict（patch is incorrect，2 条 P2 发现），详见 `evidence/3rd-review-verdict.md`
   - 状态：FR-REVIEW-002"禁止自审自判"要求的异源独立审查已真实执行，发现的 2 项问题已修复

5. ~~test-routing-advisor 具体来源不明~~ — **已关闭**
   - 事实：已核实该技能不在本仓库 `skills/` 目录下，但已在 agenthub 仓库定位到源文件：`multica-agenthub/packages/core/agenthub/skills/test-routing-advisor/SKILL.md`。是同一技术体系（agenthub → workflowhub）内的跨仓库依赖，不是无主外部黑盒
   - 影响：L2 集成冒烟（FR-SMOKE-001）依赖此技能，维护主体明确为 agenthub 仓库，跨仓库依赖需在 build-plan 阶段声明版本/路径锁定，非无主风险
   - 状态：来源已定位，不再是待议项

---

## 附录 C：设计决策引用

- D1：FR-RISK-001 来源
- D2：FR-SMOKE-001 来源
- D3：原 FR-ANTIFORGERY-001 来源决策（复用 anti-forgery-evidence）——**spec 阶段已按用户决策移除该 FR**（安全剧场，touch 可绕过），decision-log 保留原始决策记录供审计，spec 不再落地该机制
- D4：FR-REVIEW-001 / FR-REVIEW-002 来源（复用 review-trigger + verdict-handler，拆分逻辑新增）
- D5：FR-COMMIT-001 来源（改造 checkpoint-protocol，只取字段）
- D6：FR-WORKTREE-001 来源（用户直接拍板）
- D7：FR-REUSE-001 来源
