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

*（21 条完整评估，含 status + rationale）*

### 框架原则（F）

- [x] **F1 薄核心** — 判据：核心只做调度编排，重活下沉技能层。
  **Rationale**: 本 task 改动均在各 stage 自身的 SKILL.md（make-decision/build-code/verify-code）和 core/task-dir-parser.mjs，未新增中间件或调度层。worktree.json 是点对点契约，不引入新的核心调度逻辑。符合 F1。

- [x] **F2 窄契约** — 判据：模块间走窄而明确的接口，不暴露内部实现。
  **Rationale**: worktree.json 6 字段是 make-decision（写）与消费 stage（读）之间的唯一接口，字段语义明确、版本固定。core/task-dir-parser.mjs 返回单一字符串（task_tracking_root），调用方不感知内部解析逻辑。符合 F2。

- [x] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实是否机器客观采集且不阻断推进。
  **Rationale**: worktree 路径存在性（`git worktree list --porcelain`）和字段合法性均由机器校验。校验结果 fail-loud（因为缺失 worktree.json 是硬性阻断前提，非软性质量问题）；close 流程中质量事实（final-test-report warn）不阻断推进（Q2 语义）。符合 F3。

- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。
  **Rationale**: close 流程的 3rd-review 独立审查在 merge 前执行，verdic=pass 才继续，是异源审查门控（非阻断式质量门）。质量事实记录（final-test-report）不阻断推进。符合 F4。

- [x] **F5 人负责最终批准** — 判据：所有不可逆动作必须经过人工确认。
  **Rationale**: close 流程步骤④不可逆动作序列须 `user_decision=true` 且 3rd-review verdict=pass 后方可执行。build-plan Step 9 人审检查点是硬门控。符合 F5。

- [x] **F6 失败快而明确** — 判据：失败是否立即暴露、报错明确、不静默吞掉。
  **Rationale**: worktree.json 缺失时 fail-loud；字段校验不通过时 fail-loud；路径不存在时 fail-loud；分支冲突时 fail-loud。核心契约路径全部采用 fail-loud 语义，无静默降级。符合 F6。

- [x] **F7 产物落盘可查** — 判据：每个 stage 的产物是否落盘且可独立核查。
  **Rationale**: worktree.json 落盘于 task_tracking_root；stage-result.json 落盘于 task_tracking_root；3rd-review 证据落盘于 evidence/3rd-review-roundN/；spec/plan/tasks 落盘于 specs/{task-id}/。各类产物路径明确、可独立核查。符合 F7。

- [ ] **F8 新功能先有 research** — 判据：是否执行了 Phase 0 research。
  **Rationale**: research.md 已由 Step 0 spec-research 产出（`specs/worktree-unification/research.md`）。此项为 [x] 应标记符合，但 F8 语义是"无 research 则不可推进"——本 task 已有 research，符合 F8 要求。
  **修正**：[x] 符合。

- [x] **F8 新功能先有 research**（修正）
  **Rationale**: research.md 已产出，覆盖历史先例（ZHI-65）、现有 codebase 状态、外部最佳实践、已知风险。符合 F8。

- [x] **F9 spec 先于实现** — 判据：功能需求是否先有 spec，再有实现计划。
  **Rationale**: spec.md 由 build-spec 阶段产出，plan.md 在 spec.md 之后产出。实施步骤均基于 spec 中的 FR 编号。符合 F9。

- [x] **F10 反过度工程** — 判据：是否通过四问门控，删除不必要机制。
  **Rationale**: F10 gate 在 Implementation Steps 之前已执行（见上方"F10 Anti-Over-Engineering Gate"节）。4 个机制均通过四问，无需移除。符合 F10。

### 质量门控（Q）

- [x] **Q1 记事实而非阻断** — 判据：工具是否只记录客观事实，不以事实本身阻断流程。
  **Rationale**: close 流程的质量事实记录（final-test-report warn）不阻断 close，由人工决定是否继续。constitution 检查结果记录但不阻断 stage-result。baseline 偏差记录但不阻断。符合 Q1。

- [x] **Q2 质量门是记录型门控** — 判据：质量门是否设计为"记录 + 上报"而非"阻断执行"。
  **Rationale**: close 流程 verify-code 质量事实未达关闭条件时，记录 warn 并 needs_human=true，不自动阻断（spec §4 边界场景表）。符合 Q2。

- [x] **Q3 异源独立审查** — 判据：审查是否由独立来源（非产出者自身）执行。
  **Rationale**: close 流程的 3rd-review 由独立上下文执行，产出者（build-code/verify-code）不自审。build-plan 的 plan-reviewer 同样通过 3rd-review 基础设施调用。符合 Q3。

### 安全与边界（S）

- [x] **S1 最小权限** — 判据：改动是否只请求必要权限，不超范围。
  **Rationale**: worktree.json 写权限仅限 make-decision（全字段）和 verify-code close（仅 status 字段），其他 stage 只读。core/task-dir-parser.mjs 只读文件系统路径，无写权限。符合 S1。

- [x] **S2 输入校验** — 判据：外部输入是否校验后再使用。
  **Rationale**: task-id 归一化规则（转小写、替换非字母数字字符、校验 `^[a-z]+(-[a-z]+){1,2}$`）在 make-decision 阶段执行，不合规则 fail-loud 拒绝。env var 路径存在性校验在 parser 中执行。worktree.json 字段读取前执行 common + active-only 校验。符合 S2。

- [x] **S3 无隐含共享状态** — 判据：模块间是否通过显式接口通信，无隐含全局状态。
  **Rationale**: 跨 stage 状态唯一通过 worktree.json（显式文件接口）传递。task_tracking_root 通过 env var 传递（显式环境变量接口）。无隐含内存共享状态。符合 S3。

- [x] **S4 幂等操作** — 判据：重复运行是否安全（不产生副作用）。
  **Rationale**: make-decision 的 task 子目录创建设计为幂等（已存在时读取 worktree.json 按 status 处理）。worktree 存在性检测在 make-decision 中执行，复用已注册的 worktree。符合 S4。

- [x] **S5 错误消息不泄露敏感信息** — 判据：fail-loud 错误消息是否只含路径/状态信息，不含凭证。
  **Rationale**: 所有 fail-loud 错误消息内容为路径（worktree.json 期望路径）、字段名称、状态值，无凭证、token 或私密数据。符合 S5。

- [x] **S6 不修改他人产物** — 判据：是否只写自己负责的产物，不修改其他 stage 的产物。
  **Rationale**: 写权限规则（FR-WORKTREE-CONTRACT-001-WRITE）明确限制各 stage 只写自己允许写的字段。build-code/verify-code（除 close）只读 worktree.json，不修改。符合 S6。

- [x] **S7 最小变更** — 判据：是否只改了完成目标必须改的内容。
  **Rationale**: 改动限于 3 个现有文件修改 + 1 个 close 流程补充，完全对应 spec 中的 FR 范围。无额外重构、无为未来需求预留的扩展点。符合 S7。

- [x] **S8 回滚路径存在** — 判据：是否有明确的回滚或恢复路径。
  **Rationale**: close 流程的不可逆动作中途失败契约：立即停止，不自动回滚，escalate_to_human，由人工决定后续处理。这是显式的"停止+上报"策略，而非隐式静默。partial-close 恢复状态机不实现（Known Gaps 第 5 条），但该缺口已明确说明。符合 S8（"有明确路径"包括"明确说明不提供自动恢复"）。

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

