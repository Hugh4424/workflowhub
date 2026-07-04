# 实施计划：worktree-unification

**Task ID**: `worktree-unification` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification `specs/worktree-unification/spec.md`
**Status**: Draft (awaiting human review at Step 9)

---

## Summary

建立跨 stage 的 worktree 统一协议，消除 Multica 多 agent 环境下跨 stage 产物断链问题。通过在 make-decision 阶段写入 `worktree.json` 契约文件（6 字段），改造 `core/task-dir-parser.mjs` 支持 `WORKFLOWHUB_TASK_DIR` 优先级，在 `build-code §17` 删除旧自动创建 fallback，并完善 `verify-code close` 流程的 spec 归档 + worktree/branch 安全清理逻辑。改动跨 3 个模块，均在 workflowhub 系统边界内，无新引入外部依赖。

---

## Technical Context

**Language/Version**: Markdown (SKILL.md), Node.js v20 (core/task-dir-parser.mjs)
**Primary Dependencies**: Node.js 标准库（fs、path）；无第三方依赖（FR-TASKDIR-001）
**Storage**: Filesystem — `specs/worktree-unification/`（交付物）；`{{task_tracking_root}}/tasks/worktree-unification/`（跟踪产物）
**Testing**: 手动验收（SKILL.md 规则测试）；Node.js 单元测试（task-dir-parser.mjs 边界值校验）
**Target Platform**: workflowhub multi-agent pipeline (Multica 环境)
**Project Type**: Workflow orchestration tool
**Performance Goals**: N/A（路径解析操作，无性能瓶颈）
**Constraints**: 向后兼容 yaml fallback（D1）；build-code §17 旧 fallback 路径被明确废除；worktree.json 不纳入 git 管理（仓库外）
**Scale/Scope**: 3 文件修改（make-decision/SKILL.md + build-code/SKILL.md §17 + core/task-dir-parser.mjs）+ 1 文件新增（verify-code/SKILL.md close 章节补充）

---

## Simplicity-Guard Pre-Check（P0-P3）

**P0 — 这东西需要存在吗？**
需要。ZHI-65 是真实发生过的断链事故，无法靠现有机制规避。worktree.json 作为跨 stage 唯一真相源是解决根因的最小必要机制。

**P1 — 已有覆盖？**
无。make-decision/SKILL.md 完全缺少 worktree 章节；core/task-dir-parser.mjs 硬编码路径；build-code §17 已假设上游存在但上游从未实现。三处均空白。

**P2 — 复用+改造？**
core/task-dir-parser.mjs 改造：现有文件基础上加 `WORKFLOWHUB_TASK_DIR` 优先级判断，其余逻辑复用。属于改造复用。

**P3 — 最小新增**
make-decision/SKILL.md 新增 worktree 章节（R1-R7），build-code §17 删除旧 fallback（最小改动），verify-code close 流程补充（必要步骤）。无冗余新增。

**minimal-path 结论**：
- core/task-dir-parser.mjs：改造复用（最小改动加 env var 优先级）
- make-decision/SKILL.md：新增 worktree 章节（P3，无可复用起点）
- build-code §17：删除旧 fallback（最小变更，非新增）
- verify-code close：补充已定义但未实现的步骤（P3 最小新增）

---

## Project Structure

### Documentation (this feature)

```text
specs/worktree-unification/
├── spec.md              # Build-spec output (authoritative)
├── plan.md              # This file (spec-plan output)
├── tasks.md             # spec-tasks output
├── research.md          # Phase 0 research output
└── data-contracts.md    # Step 1.5 data contracts output
```

### Source Code (repository root)

```text
workflows/make-decision/SKILL.md   MODIFY — 新增 worktree 规则章节（R1-R7）
workflows/build-code/SKILL.md      MODIFY — §17 删除旧"worktree.json 缺失时自动创建"fallback，改为 fail-loud
workflows/verify-code/SKILL.md     MODIFY — close 流程补充完整 5 步骤（入口校验/质量记录/3rd-review/不可逆动作序列/stage-result 落盘）
core/task-dir-parser.mjs           MODIFY — 新增 WORKFLOWHUB_TASK_DIR env var 优先级；保留 yaml fallback；两者均缺失时 fail-loud（不使用硬编码 ~/Knowledge/workflowhub/）
```

**Forbidden files（不可触碰）**：
- `workflows/build-spec/SKILL.md`（FR-WORKTREE-SCOPE-008 要求只读 worktree.json，不创建 worktree，只需用到的行为已由 make-decision 提供，无需修改 build-spec 内部实现）
- `workflows/build-plan/SKILL.md`（本 stage 自身，不修改）
- `specs/` 下其他 task 目录

**Structure Decision**: 改动集中于 3 个现有文件 + 1 个 close 流程补充，完全遵循 S7（最小必要变更），无新增模块或层次。

---

## F10 Anti-Over-Engineering Gate

逐一回答 worktree-unification 计划中每个新机制的四问：

### 机制 1：worktree.json 契约文件

1. **What real threat?** ZHI-65 真实发生的断链——make-decision 写在临时 workdir，Multica run 结束后被清理，后续 stage 读不到。
2. **Existing mechanism?** 无。`scripts/` 为空，无任何 worktree 协议机制。
3. **Bypassable?** 若 build-code 读取失败时静默降级则形同虚设——已通过 fail-loud 强制要求杜绝旁路。
4. **Maintenance cost?** 中等。6 字段固定，schema 不频繁变化；消费 stage 读取路径固定，新增字段只影响 make-decision 写入方。可接受。

**结论：保留**

### 机制 2：WORKFLOWHUB_TASK_DIR env var 优先级

1. **What real threat?** 不同 agent 实例 task_dir 解析结果不一致，导致写入路径分叉。
2. **Existing mechanism?** core/task-dir-parser.mjs 已存在，只需改造，非重写。
3. **Bypassable?** env var 缺失时 fallback 到 yaml，yaml 缺失时 fail-loud，无静默绕路。
4. **Maintenance cost?** 低。单文件改造，逻辑简单，文档同步即可。

**结论：保留**

### 机制 3：build-code §17 删除旧 fallback

1. **What real threat?** 旧 fallback 在 worktree.json 缺失时自动创建 worktree，掩盖 make-decision 未完成的真实问题，造成静默损坏。
2. **Existing mechanism?** N/A（这是删除，不是新增）。
3. **Bypassable?** 删除即消除旁路。
4. **Maintenance cost?** 负成本（删除代码）。

**结论：保留（删除操作）**

### 机制 4：close 流程 8 步线性序列

1. **What real threat?** close 流程无序执行（如先删分支再 push，或先 push 再 3rd-review），导致不可逆动作在未审核前发生，回滚代价极高。
2. **Existing mechanism?** 无。verify-code 当前 close 流程缺失或不完整（ZHI-65 验证）。
3. **Bypassable?** 序列固化在 SKILL.md 中，agent 按步执行；不可逆动作须人工确认 user_decision=true + 3rd-review verdict=pass。双重门控足够。
4. **Maintenance cost?** 中等。步骤固定，修改需同时更新 FR-WORKTREE-PUSH-005；但 8 步已覆盖全部情形，不预期频繁变动。

**结论：保留**

**F10 无需移除任何机制**，所有 4 个机制均通过四问。

---

## Implementation Steps

### Phase 1: Foundation（基础）

#### 1.1: 改造 core/task-dir-parser.mjs — env var 优先级

**描述**：修改 `core/task-dir-parser.mjs`，读取优先级改为：① `WORKFLOWHUB_TASK_DIR` env var → ② `config/workflowhub.yaml` 的 `task_dir` 字段 → ③ 两者均缺失时 fail-loud（不使用硬编码路径）。parser 返回 task_tracking_root 本身，**不拼接** `/tasks/{task-id}`。路径存在性校验：路径不存在或非目录时 fail-loud。

**Files**: `core/task-dir-parser.mjs`

**Maps to**: FR-WORKTREE-ENVVAR-003, AC-16

**Verification**:
- `WORKFLOWHUB_TASK_DIR=<绝对路径>` → 返回该路径
- env var 未设置 + yaml 有 `task_dir` → 返回 yaml 值
- env var 未设置 + yaml 无 `task_dir` 字段 → fail-loud 抛出明确错误
- env var 未设置 + yaml 文件不存在 → fail-loud
- 路径不存在 → fail-loud
- 路径存在但非目录 → fail-loud

---

### Phase 2: Core Implementation（核心实现）

#### 2.1: make-decision/SKILL.md — 新增 worktree 规则章节（R1-R7）

**描述**：在 `workflows/make-decision/SKILL.md` 新增独立 worktree 章节，覆盖以下规则：
- **R1**：task_tracking_root 读取（调用 core/task-dir-parser.mjs，结果拼接 `/tasks/{task-id}/` 得任务目录）
- **R2**：target_repo_root 探测与固化（首次在 make-decision cwd 上下文探测，写入 worktree.json，禁止后续 stage 重新探测）
- **R3**：分支命名（`workflowhub/{task-id}`，task-id 匹配 `^[a-z]+(-[a-z]+){1,2}$`）
- **R4**：worktree 创建时机（make-decision 阶段末尾，task 子目录创建成功后）
- **R5**：worktree.json 写入时机与字段（首次写入全部 6 字段，含 status="active"）
- **R6**：worktree 存在性/冲突检测（`git worktree list --porcelain` 为唯一权威；僵尸目录 fail-loud；占用分支 fail-loud）
- **R7**：make-decision stage commit 规则（目标仓库有文件变更则 commit，格式 `workflowhub(make-decision): <描述>`；worktree.json 在仓库外不纳入 commit）

同时补充 task 子目录创建职责：`{{task_tracking_root}}/tasks/{task-id}/` 由 make-decision 创建（幂等），父目录不存在时 fail-loud，已存在时按 worktree.json status 字段处理。

**Files**: `workflows/make-decision/SKILL.md`

**Maps to**: FR-WORKTREE-MAKEDECISION-002, FR-WORKTREE-CONTRACT-001, FR-WORKTREE-FAILLOUD-007, FR-WORKTREE-COMMIT-004

**Verification**:
- 读取 make-decision/SKILL.md，存在独立 worktree 章节
- R1-R7 规则均有明确条文
- R 编号不与 decision-log D 编号混用
- 验收清单（spec §7 验收标准 1-9）逐条可核查

#### 2.2: build-code/SKILL.md §17 — 删除旧 fallback，改为 fail-loud

**描述**：在 `workflows/build-code/SKILL.md §17 FR-WORKTREE-001` 处，删除旧的"worktree.json 不存在时自动创建 worktree"fallback 路径，替换为：worktree.json 缺失时 fail-loud，输出明确错误（包含期望路径），exit 非零，并 escalate_to_human。同时确认 §17 读取 worktree.json 后消费 6 字段的逻辑符合 FR-WORKTREE-CONTRACT-001 的字段校验规则（common 校验 + status=active 时 active-only 校验）。

**Files**: `workflows/build-code/SKILL.md`

**Maps to**: FR-WORKTREE-CONTRACT-001, FR-WORKTREE-ENVVAR-003 (scope 第 8 条)

**Verification**:
- 读取 build-code/SKILL.md §17，"File does not exist → create worktree"等价逻辑不存在
- worktree.json 缺失时产生明确错误消息，不静默降级
- 字段校验规则（common + active-only）有明文约束

#### 2.3: verify-code/SKILL.md — close 流程补充完整 5 步骤

**描述**：在 `workflows/verify-code/SKILL.md` 的 close 章节，补充完整 5 步骤序列（按 FR-WORKTREE-CLOSE-006 + FR-WORKTREE-PUSH-005）：
1. 入口校验（worktree.json common + active-only 校验）
2. 质量事实记录（final-test-report，warn 但不阻断）
3. 3rd-review 独立审查（在 merge 之前，verdict=pass 才继续）
4. 不可逆动作 8 步线性序列（FR-WORKTREE-PUSH-005）：归档 commit → 切主 checkout → no-ff merge → 移除 worktree → push main → 删远端分支（存在则删，不存在则 skip） → 删本地分支 → 更新 worktree.json status=cleaned
5. stage-result 落盘（task_tracking_root 下）

包含：pre-merge revise_required 契约（步骤 4 全部跳过，needs_human=true）；不可逆动作中途失败契约（立即停止，不自动回滚，escalate_to_human）。

**Files**: `workflows/verify-code/SKILL.md`

**Maps to**: FR-WORKTREE-CLOSE-006, FR-WORKTREE-PUSH-005, FR-WORKTREE-CONTRACT-001-WRITE, FR-WORKTREE-SCOPE-009

**Verification**:
- close 流程存在且包含完整 5 步骤，顺序不可调换
- 3rd-review 在 merge 之前（步骤③在步骤④之前）
- 8 步线性序列完整（无遗漏）
- pre-merge revise_required 契约有明文约束
- stage-result 存放路径为 task_tracking_root（非 repo specs/）

---

### Phase 3: Verification（验证与收尾）

#### 3.1: 全流程 worktree.json 读取路径核查

**描述**：检查 build-spec/SKILL.md 和 build-plan/SKILL.md，确认两者不执行 `git worktree add`，且在需要定位仓库根路径时读取 worktree.json 的 `target_repo_root` / `worktree_root` 字段（缺失时 fail-loud），而非重新探测。若现有实现缺失该读取逻辑，补充必要说明。

**Files**: `workflows/build-spec/SKILL.md`（只读核查；如缺失则最小补充）, `workflows/build-plan/SKILL.md`（只读核查）

**Maps to**: FR-WORKTREE-SCOPE-008

**Verification**:
- git worktree list 条目数在 build-spec/build-plan 阶段前后不变
- worktree.json 缺失时产生明确错误且非零退出

#### 3.2: 存放边界核查

**描述**：核查 verify-code close 流程确认 stage-result.json 写入 `{{task_tracking_root}}/tasks/{task-id}/`（仓库外），不写入 `specs/{task-id}/`（仓库内）。核查 `specs/{task-id}/` 下只存放 spec.md、plan.md、tasks.md。

**Files**: `workflows/verify-code/SKILL.md`（已在 2.3 覆盖）

**Maps to**: FR-WORKTREE-SCOPE-009

**Verification**:
- `git status` / `git show` 中 specs/{task-id}/ 下不出现 evidence/ 或 stage-result.json

---

## Scope Boundary Verification

### 不可触碰路径

| 路径 | 原因 |
|------|------|
| `workflows/build-plan/SKILL.md` | 本 stage 自身，禁止修改 |
| `specs/` 下其他 task 目录 | 边界外 |
| `metrics/` 相关文件 | 非本 task scope |

### 本 task scope 明确边界

本 task 只允许修改以下 4 个文件：
1. `core/task-dir-parser.mjs`
2. `workflows/make-decision/SKILL.md`
3. `workflows/build-code/SKILL.md`
4. `workflows/verify-code/SKILL.md`

build-spec/SKILL.md 仅只读核查，若确实缺少 target_repo_root 读取逻辑则最小补充（单行说明），不重构现有章节。

---

## Verification Mapping

| Implementation Step | FR 编号 | AC / 验收标准 |
|---|---|---|
| 1.1 core/task-dir-parser.mjs | FR-WORKTREE-ENVVAR-003 | WORKFLOWHUB_TASK_DIR 优先；yaml fallback；两者缺失 fail-loud；路径不存在 fail-loud |
| 2.1 make-decision worktree 章节 | FR-WORKTREE-MAKEDECISION-002, FR-WORKTREE-CONTRACT-001, FR-WORKTREE-FAILLOUD-007, FR-WORKTREE-COMMIT-004 | R1-R7 均有明确条文；spec §7 验收标准 1-9 可核查 |
| 2.2 build-code §17 删除旧 fallback | FR-WORKTREE-CONTRACT-001, scope §8 | 旧 fallback 逻辑不存在；缺失时 fail-loud |
| 2.3 verify-code close 5 步骤 | FR-WORKTREE-CLOSE-006, FR-WORKTREE-PUSH-005, FR-WORKTREE-CONTRACT-001-WRITE, FR-WORKTREE-SCOPE-009 | 5 步骤完整顺序；3rd-review 在 merge 前；stage-result 在 task_tracking_root |
| 3.1 全流程核查 | FR-WORKTREE-SCOPE-008 | git worktree list 条目无新增 |
| 3.2 存放边界核查 | FR-WORKTREE-SCOPE-009 | specs/ 下无 evidence/ 或 stage-result.json |

---

## Complexity Tracking

**决策 1：task_tracking_root 不写入 worktree.json**
- WHY: task_tracking_root 是环境变量，每次 run 均可重新读取，无需跨 stage 固化传递
- TRADEOFF: 各 stage 均需独立读取 env var，有少量重复逻辑
- JUSTIFICATION: 避免 worktree.json 中出现环境相关变量，保持契约纯粹性；符合 F2 窄契约原则

**决策 2：3rd-review 在 merge 之前（修正 D5 原顺序）**
- WHY: D5 原顺序先 merge 再审，若 revise_required 只能 forward-fix，代价极高
- TRADEOFF: 审查后才能 merge，close 流程稍复杂
- JUSTIFICATION: 不可逆动作前审查是符合 F4（质量靠异源审查）的正确位置；已在 spec FR-WORKTREE-CLOSE-006 注释中说明

**决策 3：partial-close 恢复机制不实现**
- WHY: decision-log D1-D6 未批准此设计；实现复杂度高，不在本 task scope
- TRADEOFF: close 中途失败后需人工介入
- JUSTIFICATION: fail-loud + escalate_to_human 足以覆盖；partial-close 状态机是独立决策，应另立 task

---

## Constitution Check

*（21 条完整评估，逐条对照 constitution-checklist.md 当前版本，含 status + rationale）*

### 框架原则（F）

- [x] **F1 薄核心** — 判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。
  **Rationale**: 本 task 改动均在各 stage 自身的 SKILL.md（make-decision/build-code/verify-code）和 core/task-dir-parser.mjs，未新增中间件或调度层。worktree.json 是点对点契约，不引入新的核心调度逻辑。改动牵连面限于 4 个文件。符合 F1。

- [x] **F2 窄契约** — 判据：模块间是否走窄而明确的接口、不暴露内部实现。
  **Rationale**: worktree.json 6 字段是 make-decision（写）与消费 stage（读）之间的唯一接口，字段语义明确、版本固定。core/task-dir-parser.mjs 返回单一字符串（task_tracking_root），调用方不感知内部解析逻辑。符合 F2。

- [x] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
  **Rationale**: worktree 路径存在性（`git worktree list --porcelain`）和字段合法性均由机器客观采集。worktree.json 缺失时 fail-loud 是入口校验（Q2 入口类）而非质量门阻断；close 流程中 final-test-report warn 不阻断推进（Q1 记录语义）。符合 F3。

- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量是否靠独立审查+人，而非阻断门。
  **Rationale**: close 流程的 3rd-review 独立审查（独立上下文，非产出者自审）在 merge 前执行，verdict=pass 才继续。quality 事实（final-test-report）只记录不阻断，由人工决定。符合 F4。

- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡是否按需添加、无用即移除，未预先堆砌。
  **Rationale**: 本 task 新增关卡仅：入口校验（worktree.json 读取时 common + active-only 校验）和 3rd-review 审查门控，均有真实故障场景支撑（ZHI-65 断链）。F10 gate 已过滤所有机制，无预堆基建。符合 F5。

- [x] **F6 统一外置执行记录** — 判据：进度/指标/回溯是否统一记录、可回溯。
  **Rationale**: stage-result-verify-code.json 落盘于 task_tracking_root（外置，不在 repo 内）；journal.jsonl / task-metrics.jsonl 亦在 task_tracking_root；3rd-review 证据落盘于 evidence/3rd-review-roundN/。所有过程/追踪类产物统一外置，可回溯。符合 F6。

- [x] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作是否经人边界确认。
  **Rationale**: close 流程步骤④不可逆动作序列须 `user_decision=true` 且 3rd-review verdict=pass 后方可执行。build-plan Step 9 人审检查点是硬门控（无超时旁路）。符合 F7。

- [x] **F8 简单优先** — 判据：是否选更简单依赖更少的方案、不写掩盖问题的兜底。
  **Rationale**: simplicity-guard 四阶梯评估：core/task-dir-parser.mjs 改造复用（P2），build-code §17 删除旧 fallback（负成本），其余为必要最小新增（P3）。build-code 旧 fallback 主动删除正是"不写掩盖问题的兜底"。符合 F8。

- [x] **F9 可证伪不假绿** — 判据：检查是否在"实际为假"时真报失败、缺数据标未知。
  **Rationale**: worktree.json common 校验、active-only 校验均在"实际为假"时 fail-loud 真报失败，不静默通过。baseline 5 指标均标注 unknown + 原因（非 0 或 `-` 占位），符合"缺数据标未知"。符合 F9。

- [x] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化是否真实收益大于长期维护成本、不为"机器可校验"本身预堆基建、能实跑的优先实跑。
  **Rationale**: F10 Anti-Over-Engineering Gate（见上方专节）对 4 个机制逐一回答四问，无需移除任何机制。predecessor 系统教训（~95000 行 gate 代码）已内化为门控标准。符合 F10。

### 质量门控（Q）

- [x] **Q1 记事实而非阻断** — 判据：质量事实是否只记录浮现、不阻断推进。
  **Rationale**: close 流程 final-test-report warn 记录质量事实，不阻断 close，needs_human=true 仅上报；constitution check 结果记录不阻断 stage-result；baseline 偏差记录不阻断。符合 Q1。

- [x] **Q2 gate 三类划分** — 判据：关卡是否分入口校验/记录采集/人工确认三类、未把记录型做成阻断门。
  **Rationale**: 入口校验（worktree.json schema 校验）= 入口类；final-test-report warn = 记录采集类（不阻断）；user_decision=true 确认不可逆动作 = 人工确认类。三类划分清晰，记录型未变阻断门。符合 Q2。

- [x] **Q3 异源审查加人工把关** — 判据：质量裁决是否由独立来源独立上下文产出、无自审自判。
  **Rationale**: close 流程 3rd-review 由独立上下文执行（不是 verify-code 自身）；build-plan 的 plan-reviewer 同样通过 3rd-review 基础设施由独立引擎审查。无自审自判。符合 Q3。

### 技能与可复用性（S）

- [x] **S1 能用外部就不造轮子** — 判据：通用能力是否优先复用外部、文件直放项目内。
  **Rationale**: core/task-dir-parser.mjs 改造复用（P2，非重写）；无新引入第三方依赖；git worktree 机制直接使用 git 原生能力（外部）。符合 S1。

- [x] **S2 外部技能可针对项目改造合宪** — 判据：采用的外部技能是否按需改造至合宪。
  **Rationale**: spec-plan / spec-tasks / spec-analyze 均为从 speckit-* 改造至 workflowhub 宪法合规的内部技能（去 git 分支耦合、task-id 参数化、模板内置）。符合 S2。

- [x] **S3 迭代时保持最新并就地检查** — 判据：迭代时是否查更新/更优、来源路径写进技能文件。
  **Rationale**: decision-log D1-D5 是本次迭代的上游决策，已引用并在 spec/plan 中标注来源（R1 源自 D1、R7 源自 D5 等）；research.md 记录历史先例和外部最佳实践来源。符合 S3。

- [x] **S4 自定义技能必须有指标系统** — 判据：自研技能是否配套指标、纳入统一执行记录。
  **Rationale**: build-plan 阶段通过 metrics/collector.mjs `recordSkeleton` + `updateOwnResult` 记录指标（M4 字段），task-metrics.jsonl 外置于 task_tracking_root。本 task 改动的各 stage SKILL.md 均纳入同一指标体系。符合 S4。

- [x] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能是否便于子代理调用、减少主上下文占用。
  **Rationale**: spec-plan / spec-tasks / spec-analyze / spec-research 均设计为独立 task-id 参数化调用，主 build-plan 流程调用后只收产物路径摘要，无需主上下文读全文。core/task-dir-parser.mjs 单一字符串返回值，调用方上下文负担最小。符合 S5。

- [x] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能是否参考成熟方案优化。
  **Rationale**: research.md §4 记录了外部生态最佳实践（"谁创建谁清理"、平级目录命名惯例、分支唯一性约束）；task-id slug 规则参考业界 CI/CD 惯例。符合 S6。

- [x] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流是否一一对应独立、按目录约定、核心零改可加。
  **Rationale**: 改动的 4 个文件均在对应阶段目录下（workflows/make-decision/, workflows/build-code/, workflows/verify-code/, core/）；无跨阶段文件混放；新阶段按目录约定添加，核心零改。符合 S7。

- [x] **S8 自定义技能可独立调用可搬运** — 判据：自研技能是否可独立调用、可跨宿主搬运、不绑死环境。
  **Rationale**: core/task-dir-parser.mjs 无第三方依赖（FR-TASKDIR-001）；worktree.json 使用标准 JSON 格式；env var + yaml fallback 设计不绑死特定宿主环境（WORKFLOWHUB_TASK_DIR 可在任意环境注入）。符合 S8。

---

## M10 Baseline Comparison

| Metric | M10 Baseline | M12 Current | Delta | 备注 |
|---|---|---|---|---|
| missed_step_rate | 0.05 | unknown | unknown | 仅 upstream make-decision/build-spec 两段已完成且已落盘，全五段值待 verify-code 完成后才可计算 |
| test_execution_rate | 0.8295 | unknown | unknown | build-plan 阶段无测试执行数据，待 build-code/verify-code |
| review_execution_rate | 1 | unknown | unknown | review 阶段尚未执行 |
| rework_rounds | 6.075 | unknown | unknown | 全流程未完成，无返工数据 |
| rework_proxy_count | 25.25 | unknown | unknown | 全流程未完成，无代理返工数据 |

**说明**：所有 M12 值在 build-plan 阶段均为 unknown，原因各异（见 delta 备注列）。非阻断，不影响 stage-result status。

