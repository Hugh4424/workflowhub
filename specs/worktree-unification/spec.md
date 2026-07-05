# Spec: Worktree Unification Protocol
task-id: worktree-unification
version: 0.1 (draft)
date: 2026-07-04
skill: spec-specify (adapted from speckit-specify)

---

## 序言：档位判断与 F10 反过度工程四问

### 档位判断（FR-LADDER-001）

**档位：B 档（中等）**

理由：本任务跨越 3 个模块（make-decision/SKILL.md、build-code/SKILL.md §17、core/task-dir-parser.mjs），引入一个新的跨阶段契约（worktree.json），变更环境变量优先级规则，以及调整 commit/push 策略和 close 流程。改动面跨模块但均在 workflowhub 系统边界内，无新引入外部依赖。**向后兼容澄清**：task_dir 的 yaml fallback 保留（D1 决策）；但 build-code §17 旧"worktree.json 缺失时自动创建 worktree"fallback 路径被明确废除，改为 fail-loud+escalate_to_human（见 FR-WORKTREE-ENVVAR-003 和 scope 第 8 条）。这是有意为之的行为破坏，确保契约不被绕过。

需完整三层 spec（功能描述 / 验收标准 / 边界场景）。

### F10 反过度工程四问（FR-LADDER-002）

1. **What real threat defend against?**
   ZHI-65 实际案例：decision-log 写入临时 worktree 未 commit，后续 checkout 读取失败，导致跨 stage 产物断链。威胁真实、已发生，非假设。

2. **Does any existing mechanism already cover it?**
   无。make-decision/SKILL.md 目前完全缺少 worktree 章节；build-code §17 FR-WORKTREE-001 已假设上游提供该契约，但上游从未实现；core/task-dir-parser.mjs 硬编码路径而非读取环境变量。三处均空白，没有现有机制可复用。

3. **Can it be bypassed, making security-theatre?**
   主要风险：若 agent 在 make-decision 阶段未写入 worktree.json，下游 build-code 读取失败时若降级静默则契约形同虚设。需要 fail-loud（非静默降级）确保契约被执行而非绕过。

4. **Long-term maintenance cost?**
   中等。worktree.json 新增字段需各消费 stage 同步感知；env-var 优先级变更（`WORKFLOWHUB_TASK_DIR` 优先）需同步更新文档和调用方；commit-per-stage 规则需在 build-code 流程中实际触发可验证。维护成本在可接受范围，无冗余门控。

---

## 1. 功能概述

workflowhub 在 Multica 多 agent 环境下运行时，各 stage 通过独立 checkout 操作目标仓库，导致同一任务的 worktree 信息散落在不同运行上下文中，产物路径在 stage 间断链。本功能建立"目标项目 worktree 统一协议"，使所有 stage 共享一份持久化的 worktree 契约，消除断链问题。

### 核心用户价值

- 每个 stage 可以可靠地找到前序 stage 写入的产物，不因 worktree 差异而丢失
- 任务的 worktree 状态（分支、根路径、推送策略）在所有 stage 间保持一致
- 出现异常时系统明确失败（fail-loud），不静默降级掩盖问题

---

## 2. 关键概念与假设

### 关键概念

| 概念 | 定义 |
|------|------|
| worktree.json | 跨 stage 共享的 worktree 状态契约文件，存储在 `{{task_tracking_root}}/tasks/{task-id}/` 下 |
| task_dir | `{{task_tracking_root}}/tasks` 的缩写，仅供行文简称；规范路径表达统一使用 `{{task_tracking_root}}/tasks/{task-id}/...`，不使用 `{task_dir}/{task-id}/...` |
| WORKFLOWHUB_TASK_DIR | 环境变量，其值等于 `{{task_tracking_root}}`（即 task tracking root 本身，**不含** `/tasks` 子路径）；parser 读取该变量后直接返回 task_tracking_root 本身，**不做任何子路径拼接**；拼接动作由各 stage 调用方自行执行（如：`${task_tracking_root}/tasks/${task_id}/worktree.json`）。**迁移说明**：若 config/workflowhub.yaml 中 `task_dir` 字段当前值已包含 `/tasks` 子路径（如 `/path/to/project/tasks`），则该值为任务根（task_tracking_root/tasks），须将其父目录（`/path/to/project`）设为 WORKFLOWHUB_TASK_DIR 值或更新 yaml `task_dir` 字段值；否则会产生 `/tasks/tasks/{task-id}` 路径错位。兼容性：build-code 中已有使用 `task_dir` 变量拼接路径的调用方，须同步更新拼接逻辑为 `${WORKFLOWHUB_TASK_DIR}/tasks/${task_id}/`。 |
| target_repo_root | 目标仓库的根路径，由 make-decision 在当前会话 cwd 上下文首次探测并固化写入 worktree.json；后续 stage 从 worktree.json 读取，禁止重新探测或重新推导 |
| worktree_root | 实际创建的 worktree 目录路径 |
| push_policy | 推送策略：push 仅在 verify-code close 阶段人工确认后执行一次（close 命令级序列中） |
| created_by_stage | 记录哪个 stage 创建了该 worktree |
| stage-per-commit | 每个 stage/phase 完成后立即 commit，不积压 |

### 假设

- task_dir 由外部环境变量 `WORKFLOWHUB_TASK_DIR` 提供；若未设置，降级读取 config/workflowhub.yaml 中的配置值（fallback，非停止条件）
- `target_repo_root` 表示主 checkout 根目录（即执行 `git worktree add` 的原始 checkout，非任务 worktree）；其值须由 make-decision 在当前会话 cwd 上下文首次探测并固化写入 worktree.json，后续 stage 只从 worktree.json 读取，禁止在任何其他上下文中重新探测或推导（尤其不得在任务 worktree 内重新推导，否则会得到 worktree_root，语义错误）；close 流程需切回此路径执行 merge/remove；`worktree_root` 表示任务 worktree 目录路径，二者不同
- task-id 格式：两到三个小写英文单词，连字符分隔（如 `worktree-unification`），已在 make-decision 阶段确定；**make-decision 对用户/上游输入执行两步处理（decision-log D3）**：
  1. **归一化转换**：先将输入转为小写；再将所有非字母非数字字符统一替换为连字符；再将连续连字符合并为单个连字符；再去除首尾连字符。
  2. **校验**：归一化后的结果必须匹配正则 `^[a-z]+(-[a-z]+){1,2}$`（即 2-3 个纯小写字母词，连字符分隔）；若归一化后仍不合规（如词数不对、含数字词段），则 fail-loud 拒绝，不做进一步猜测修正。
- worktree.json 由 make-decision stage 负责首次写入，后续 stage 只读；唯一例外：verify-code close 阶段完成清理后可将 status 字段更新为 `"cleaned"`（仅此字段，其余字段保持只读）

---

## 3. 功能需求（FR）

### FR-WORKTREE-CONTRACT-001：worktree.json 契约字段

worktree.json 须包含以下字段，格式为 JSON，存储在 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`：

- `target_repo_root`（string）：目标仓库根路径
- `worktree_root`（string）：实际 worktree 目录路径
- `branch`（string）：任务专用分支名
- `created_by_stage`（string）：创建该记录的 stage 名称，值域固定为 `["make-decision"]`；其他值视为非法，fail-loud
- `push_policy`（string）：推送策略标识，值为 `"verify-code-only"`
- `status`（string）：当前状态，值域 `["active", "cleaned"]`

**写权限规则（FR-WORKTREE-CONTRACT-001-WRITE）**：
- `make-decision` stage：首次写入全部 6 字段（含 `status="active"` 初始值）
- `verify-code` close 阶段：仅允许将 `status` 字段从 `"active"` 追加更新为 `"cleaned"`（唯一允许的状态转换）；其余 5 个字段保持只读，不得修改
- 其他 stage / 其他字段 / 其他值：一律禁止写入，违反则 fail-loud

字段校验规则（分层，按 status 区分）：

**common 校验**（所有 status 均执行）：
- 所有 6 个字段必须存在且非空
- `target_repo_root` 和 `worktree_root` 必须为绝对路径（以 `/` 开头）
- `push_policy` 仅允许值 `"verify-code-only"`，其他值视为无效文件
- `status` 值域为 `["active", "cleaned"]`，其他值 fail-loud
- `created_by_stage` 值域固定为 `["make-decision"]`，其他值 fail-loud
- `branch` 必须匹配正则 `^workflowhub/[a-z]+(-[a-z]+){1,2}$`

**active-only 校验**（status=active 时额外执行）：
- `worktree_root` 必须出现在 `git worktree list --porcelain` 输出中
- `branch` 必须与该 worktree 的 HEAD 对应分支一致

**cleaned-only 校验**（status=cleaned 时执行，替代 active-only）：
- 仅执行 common schema 校验（6 字段存在、类型、值域）
- 校验通过后直接报告"task 已归档，不可重用，须新建 task-id"并停止；不检查 worktree/branch 是否已物理清理（物理清理在 close 执行期间保证，不在读取时重验）

说明：close 执行期间（写入 status=cleaned 之前）须先验证 worktree、local branch、remote branch 均已清理成功，只有全部清理完成才写入 status=cleaned；因此读取时无需重复审计。

**验收标准**：build-code §17 FR-WORKTREE-001 可直接读取该文件并消费上述字段，无需任何转换逻辑；common 校验不通过则 fail-loud；status=active 时 active-only 校验不通过则 fail-loud；status=cleaned 时只做 common 校验并拒绝重用。

### FR-WORKTREE-MAKEDECISION-002：make-decision 补齐 worktree 规则章节

make-decision/SKILL.md 须新增 worktree 创建规则章节，覆盖以下规则（R1-R7；注意：R 编号为本章节内部条目标识，与 decision-log 的 D 编号系统相互独立，不可混用）：

- R1（源自 decision-log D1）：task_tracking_root 读取规则 —— make-decision 读取 `WORKFLOWHUB_TASK_DIR` 环境变量作为 task_tracking_root（即跟踪根目录本身，不含 `/tasks` 子路径）；task 专属目录为 `task_tracking_root/tasks/{task-id}/`；若环境变量未设置则按 FR-WORKTREE-ENVVAR-003 降级顺序处理；task_tracking_root **不写入** worktree.json（worktree.json 只含 FR-WORKTREE-CONTRACT-001 定义的 6 字段）；task_tracking_root 由各 stage 各自实时读取 `WORKFLOWHUB_TASK_DIR` 环境变量得到，无需跨 stage 固化传递（因为它是环境变量，每个 stage 运行时均可重新读取，值恒定不变）
- R2（源自 decision-log D2）：目标仓库路径（target_repo_root）探测与固化规则 —— make-decision 在当前会话 cwd 上下文首次探测并做存在性校验，写入 worktree.json 并标注不可覆盖；后续所有 stage 只读该字段，禁止重新探测；字段缺失时 escalate_to_human
- R3（设计延伸，非 decision-log 直接定义）：分支命名规则，精确格式为 `workflowhub/{task-id}`；task-id 必须匹配正则 `^[a-z]+(-[a-z]+){1,2}$`（两到三个小写英文单词，连字符分隔，禁止数字、下划线、大写、连续连字符、首尾连字符、`/`、`..`、`@{`、空白字符）；完整分支名必须匹配 `^workflowhub/[a-z]+(-[a-z]+){1,2}$`；重跑时若 worktree.json status=active 且分支名匹配则复用，否则 fail-loud
- R4（设计延伸）：worktree 创建时机（make-decision 阶段末尾，task 子目录创建成功后）
- R5（源自 decision-log 验收标准 1；其中 `target_repo_root` 固化规则源自 D2）：worktree.json 写入时机与字段要求（首次写入全部 6 字段，写入后标注不可覆盖）
- R6（源自 decision-log D4）：worktree 存在性/冲突检测规则 —— 用 `git worktree list --porcelain` 作为唯一权威校验；已注册且路径存在则复用；路径存在未注册（僵尸目录）则 fail-loud，不自动删除；分支已被其他 worktree 占用则 fail-loud，报告占用详情，不强制 checkout
- R7（源自 decision-log D5）：make-decision stage 完成时 commit 规则 —— 若本 stage 对目标仓库（target_repo_root 下）产生了文件变更（如初始化文件），须 commit，commit message 格式为 `workflowhub(make-decision): <描述>`；worktree.json 本身存储在 task_tracking_root（仓库外，见 FR-WORKTREE-SCOPE-009），不属于此 commit 范围，不受 git 管理；若 make-decision 阶段在目标仓库内无文件变更，须在 stage-result 或 journal 中明确记录"无 repo 内变更"原因，不得静默跳过

**task 子目录创建职责（设计延伸：decision-log D1 决定 task_dir 读取机制，但未显式规定 make-decision 负责创建子目录；本条为基于 D1 语义和 fail-loud 设计原则的派生实现约束，非 D1 原文直接授权）**：make-decision 负责创建 `{{task_tracking_root}}/tasks/{task-id}/` 子目录（一次性，仅在首次运行时）。执行条件：
- 前置条件：`{{task_tracking_root}}/tasks/`（由 `WORKFLOWHUB_TASK_DIR` 值拼接 `/tasks` 得到）必须已存在；若父目录不存在，则 fail-loud 报错，不自动创建父目录。
- 幂等：若 `{{task_tracking_root}}/tasks/{task-id}/` 已存在，读取其中 worktree.json 并按 status 字段规则处理（status=active 则复用，status=cleaned 则 fail-loud 报"task 已归档"）。
- 成功后方可继续 R3 worktree 创建步骤。

**验收标准**：读取 make-decision/SKILL.md，存在独立 worktree 章节，R1-R7 规则均有明确条文（含 D1 task_tracking_root 读取机制、D5 commit 责任：若目标仓库有文件变更则 commit，worktree.json 不纳入 commit，无变更则在 stage-result/journal 记录原因）；R 编号与 decision-log D 编号不可混用。

### FR-WORKTREE-ENVVAR-003：core/task-dir-parser.mjs 环境变量优先

`core/task-dir-parser.mjs` 须按以下优先级读取 task_dir：

1. 环境变量 `WORKFLOWHUB_TASK_DIR`（最高优先）
2. `config/workflowhub.yaml` 中配置的值（fallback）
3. 若两者均缺失，fail-loud 报错，不使用硬编码路径

**parser返回值语义**：parser 始终返回 task_tracking_root 本身（即 `WORKFLOWHUB_TASK_DIR` 的值，或 yaml fallback 值），**不做 `/tasks/{task-id}` 拼接**；该拼接动作由各调用方（各 stage）自行执行。

**验收标准**：
- Given `WORKFLOWHUB_TASK_DIR=<绝对路径>`（目录已存在），调用 parser，返回该路径
- Given `WORKFLOWHUB_TASK_DIR` 未设置，`config/workflowhub.yaml` 存在且含 `task_dir` 字段，返回 yaml 中的配置值
- Given `WORKFLOWHUB_TASK_DIR` 未设置，`config/workflowhub.yaml` 文件不存在，parser fail-loud 抛出明确错误（不使用硬编码路径）
- Given `WORKFLOWHUB_TASK_DIR` 未设置，`config/workflowhub.yaml` 存在但无 `task_dir` 字段，parser fail-loud 抛出明确错误（区别于文件不存在场景）
- Given 路径存在但不是目录，parser fail-loud
- Given 路径不存在，parser fail-loud

### FR-WORKTREE-COMMIT-004：每 stage/phase commit

本 commit 规则适用于 5-stage pipeline 中每个 stage 完成时、以及每个 stage 内每个 phase 完成时。每个原子提交的 commit message 须包含 stage 名称前缀（格式：`workflowhub(<stage-name>): <描述>`），使提交记录可追溯到具体 stage。不额外制造阶段级空提交（即不使用 `git commit --allow-empty` 作为 stage marker）——原子提交本身承担 stage 标记职责。

**硬规则**：每个产生文件变更的 stage/phase 结束前，必须至少存在一条 `workflowhub(<stage-or-phase>)` 前缀的 commit；若某 stage/phase 无文件变更，须在 stage-result 或 journal 中明确记录"无变更"原因，不得静默跳过。


commit message 中括号内的标识符有两类：
- **stage 级提交**：标识符为固定枚举之一：`make-decision`、`build-spec`、`build-plan`、`build-code`、`verify-code`；格式 `workflowhub(<stage>): <描述>`
- **phase 级提交**：标识符格式为 `<stage>/<phase-name>`，其中 stage 取上述固定枚举，phase-name 在各 stage SKILL.md 中定义（如 build-code 的 phase 1 写为 `workflowhub(build-code/phase-1): <描述>`）

两类互不混用：纯 stage 提交不含斜杠，phase 提交必须带 `<stage>/` 前缀。

**close 归档 commit（verify-code 收尾子步骤，非独立 stage）**：close 不是 pipeline 的第六个 stage（decision-log D5/D6 未批准此定义），而是 verify-code 最后不可逆动作序列的第一步。归档 commit 仅包含将 `specs/{task-id}/` 移入 `specs/archive/{task-id}/` 的变更，message 格式固定为 `workflowhub(close): archive {task-id}`（使用 `close` 作为子步骤标识符，不列入 stage 枚举）。worktree 目录清理是仓库外操作，不属于此 commit 内容，在归档 commit 之后作为独立清理步骤执行（见 FR-WORKTREE-PUSH-005 步骤 4）。

**验收标准**（per-stage/per-phase 级别，不限于 build-code）：每个产生文件变更的 stage 完成后，`git log --oneline` 中须存在至少一条 `workflowhub(<stage>):` 前缀的 commit；build-code 内每个 phase 完成后须存在对应 `workflowhub(build-code/<phase-name>):` 前缀的 commit；若某 stage/phase 无文件变更，须在 stage-result 或 journal 中明确记录"无变更"原因，不得静默跳过；close 归档 commit 独立存在且 message 格式符合 `workflowhub(close): archive {task-id}` 规定。

**commit 覆盖矩阵**（分母定义，验收时按此表逐行核查）：

| stage | commit 分母来源 | 无变更记录字段 | 备注 |
|---|---|---|---|
| make-decision | 目标仓库内产生的初始化文件变更 | stage-result.missing_items 或 journal | worktree.json 在仓库外，不计入 |
| build-spec | spec.md + checklists/ 等 spec 产物 | stage-result.missing_items | 通常必有变更 |
| build-plan | build-plan.md 等计划产物 | stage-result.missing_items | 通常必有变更 |
| build-code | 每个 phase（phase-name 由各 SKILL.md 定义）均独立计 | stage-result.facts 或 journal 的 no_change_reason | phase 数量由 build-code/SKILL.md 版本决定，审查时以当时 SKILL.md 为准 |
| verify-code | 验证产物（test-report、evidence）如写入仓库则计入 | stage-result.missing_items | 若 evidence 写在 task_tracking_root 仓库外，本 stage 可无仓库 commit |
| verify-code（close 子步骤） | 归档 commit（git mv specs/{task-id}/ specs/archive/{task-id}/），属于 verify-code 不可逆动作序列第①步 | 不允许无变更跳过，归档 commit 是收尾必要步骤 | message 格式固定为 `workflowhub(close): archive {task-id}`；close 不是独立 stage，归属于 verify-code 范畴 |

### FR-WORKTREE-PUSH-005：push 仅在 verify-code 收尾执行

close 阶段的完整线性操作序列（唯一允许发生远端交互的阶段；中间 stage 不得执行任何 push 或远端分支清理；须在人工确认 user_decision=true 后按此顺序执行，不可调换）：

1. 在任务 worktree（任务分支 `workflowhub/{task-id}` 内）：将 `specs/{task-id}/` 目录移入 `specs/archive/{task-id}/` 并提交归档 commit（message：`workflowhub(close): archive {task-id}`）——归档 commit 进入任务分支，确保后续 merge 时被 main 包含
2. 切换执行上下文至主 checkout：将工作目录切换到 `target_repo_root`（主 checkout 根目录，非任务 worktree），并验证当前分支为 `main`；禁止在任务 worktree 内执行切换到 main 的操作（linked worktree 不能 checkout 已被主 checkout 占用的分支，会失败）
3. 从主 checkout 执行非快进合并（no-ff），将任务分支 `workflowhub/{task-id}` 合并入 main，保留合并节点，归档 commit 随之进入 main
4. 从主 checkout 移除任务 worktree 目录；验证 worktree 目录不存在且 worktree 列表中无该条目
5. 将合并后的 main 推送到远端 origin
6. 检查远端任务分支是否存在：若存在则删除远端任务分支；若不存在则跳过，记录 info "远端分支不存在，无需删除"，不报错
7. 删除本地任务分支（在远端处理完成后再删，便于失败重试）
8. 更新 `{{task_tracking_root}}/tasks/{task-id}/worktree.json` 的 status 字段为 `"cleaned"`（这是 task_tracking_root 下的外部契约文件，不属于目标 repo 的 git commit；仅更改 status 字段，其余字段保持不变）

**验收标准**：close 后 `git log main --merges` 可查到合并节点；`git log main --oneline` 包含 `workflowhub(close): archive {task-id}` commit；worktree 目录不存在；本地分支不存在；远端分支不存在或原本从未存在（均视为满足）；`{{task_tracking_root}}/tasks/{task-id}/worktree.json` status 字段为 `"cleaned"`。

### FR-WORKTREE-CLOSE-006：close 流程完整性

> **修正说明**：本 FR 对 decision-log D5 原顺序做了主动修正。D5 原文顺序是先执行 merge + 分支清理等不可逆动作，再跑 3rd-review 独立审查；本 spec 改为先审后 merge，理由是避免不可逆动作在未过审前发生——3rd-review 若 revise_required，代码已合并进 main，只能 forward-fix，回滚代价极高。

close 流程须包含以下步骤，**严格按以下顺序**执行，无遗漏：

- **① 入口校验**：读取 worktree.json，校验字段完整性（common 校验）和路径/分支存在性（active-only 校验）；校验失败 fail-loud，阻止 close。
- **② 质量事实记录**：将当前验收清单状态写入 final-test-report，如有未验证条目记录 warn 并上报 needs_human=true；不自动阻断 close（宪法 Q2：质量事实只记录，不阻断推进，由人工决定）。
- **③ 3rd-review 独立审查**（在不可逆动作之前执行，即 merge + 分支清理之前）：由独立上下文（3rd-review agent）对本 task 所有 stage 产出执行独立审查；审查结果写入 `{{task_tracking_root}}/tasks/{task-id}/evidence/3rd-review-roundN/`；审查结论须包含明确 verdict（pass / revise_required）；审查产物须落盘可查，不得以摘要或口头声明替代文件证据。verdict=pass 方可进入下一步不可逆动作；verdict=revise_required 时见"pre-merge revise_required 契约"。
- **④ 不可逆动作**（须人工确认 user_decision=true 且 3rd-review verdict=pass 后方可执行）：按 FR-WORKTREE-PUSH-005 定义的 8 步线性序列严格顺序执行，不得调换。序列为：① 归档 commit（移目录 + commit）→ ② 切主 checkout → ③ 非快进合并 → ④ 移除 worktree 目录 → ⑤ 推送 main → ⑥ 删远端分支（或跳过） → ⑦ 删本地分支 → ⑧ 更新 worktree.json status=cleaned。FR-WORKTREE-CLOSE-006 不另行规定顺序，以 FR-WORKTREE-PUSH-005 为唯一权威。删远端/本地分支前须确认目标提交已被 main 包含；确认失败时停止 close，不删除任何分支。
- **⑤ stage-result 落盘**（不可逆动作完成后，或 revise_required 阻止不可逆动作时均须落盘）：将本 task 的 stage-result（包括各阶段产出摘要、质量事实、3rd-review verdict）写入 `{{task_tracking_root}}/tasks/{task-id}/stage-result.json`；不纳入 repo 归档 commit（stage-result 属于过程/追踪内容，须存放在 task_tracking_root 而非 repo specs/ 下）。验收标准：`{{task_tracking_root}}/tasks/{task-id}/stage-result.json` 存在且 verdict 字段与 3rd-review 产物一致。

**pre-merge revise_required 契约**：3rd-review 在不可逆动作之前执行，若 verdict=revise_required：① **不执行 merge、不删分支、不 push**（不可逆动作全部跳过）；② 将 findings 写入 stage-result.json，记录 `review_status=revise_required` 及具体 finding 列表；③ 将 needs_human 置为 true 并列明所有 findings；④ escalate_to_human，等待人工确认修复后重新走 3rd-review（重新从步骤③开始）；⑤ 人工确认修复完成且 3rd-review verdict=pass 后，方可继续步骤④不可逆动作。此路径确保问题在不可逆动作前被阻止，不留歧义。

**不可逆动作中途失败契约**：步骤④ 8 步序列中若某步失败，立即停止，不自动回滚已执行的步骤，不跳过后续步骤；在 stage-result.json 中记录失败步骤编号和错误信息；needs_human=true，escalate_to_human，等待人工决定后续处理（补全还是接受现状）。**不提供自动重试或部分恢复机制**（partial-close 恢复状态机在 decision-log D1-D6 中无对应决策，本任务不实现，见 Known Gaps 第 5 条）。

**验收标准**：close 流程中，3rd-review 独立审查在 merge 之前完成；verdict=pass 才允许执行 merge + 分支清理；verdict=revise_required 时 merge 未发生、分支未删除、stage-result.json 中 review_status=revise_required 且 needs_human=true 可查，并已 escalate_to_human；close 成功完成后，spec 已归档、worktree 已清理、分支已删除、merge commit 可查；3rd-review 证据文件在 `{{task_tracking_root}}/tasks/{task-id}/evidence/` 下可查；stage-result.json 在 `{{task_tracking_root}}/tasks/{task-id}/` 下可查且含 verdict 字段；若质量事实有 warn，needs_human=true 记录可查，但不阻止后续人工推进。

### FR-WORKTREE-SCOPE-008：build-spec / build-plan 不创建 worktree

build-spec 和 build-plan 不执行任何 `git worktree add` 操作，不写入 worktree.json，路径定位规则如下：

- **使用 `target_repo_root`**：当 stage 需要定位主仓库根目录（执行 git 操作、读取仓库级配置）时，读取 worktree.json 中的 `target_repo_root` 字段；若字段缺失或 worktree.json 不存在，须 fail-loud，不静默降级。
- **使用 `worktree_root`**：当 stage 需要写入交付物（spec.md、plan.md、tasks.md 等）时，路径为 `worktree_root` + `specs/{task-id}/`，即写入任务 worktree 目录而非主仓库根；`worktree_root` 同样从 worktree.json 读取，缺失时 fail-loud。

二者不可混用：在主仓库执行 git 命令时用 `target_repo_root`，在任务 worktree 写文件时用 `worktree_root`。

**验收标准**：在 build-spec 和 build-plan 阶段，git worktree list 的条目数量与进入该阶段前一致（无新增 worktree）；worktree.json 缺失时 stage 输出明确错误且退出码非零。

**补充说明**：build-spec 和 build-plan 虽然不创建 worktree，但它们的交付物（spec.md、plan.md、tasks.md）必须写入 worktree.json 中 `worktree_root` 字段所指向的 worktree 根目录下的 `specs/{task-id}/` 路径，并在任务分支上完成 commit。这些 stage 的"只读 worktree.json"约束仅指不新增 worktree 条目，不影响其在已有 worktree 内正常写文件和提交的职责。

---

### FR-WORKTREE-SCOPE-009：repo specs/ 与 task_dir 的存放边界

`specs/{task-id}/` 目录（仓库内）允许存放以下文件（白名单，均纳入 git 版本管理）：
- **核心交付物**：spec.md、plan.md、tasks.md
- **build-plan 过程产物**：research.md、data-contracts.md、baseline-report.md、constitution-check.md、cross-artifact-analysis.md、human-brief.md、plan-summary-draft.md、checklists/（含 requirements.md 等）、reviews/（含 plan-eng-review.md、report-round-N.md 等）、tasks/（含 task 子目录及其 stage-result.json、reviews/）

**禁止**存放：evidence/ 目录（3rd-review 审查证据）、顶层 stage-result.json（verify-code close 产物）、journal.jsonl、task-metrics.jsonl。

`{{task_tracking_root}}/tasks/{task-id}/`（仓库外，WORKFLOWHUB_TASK_DIR 指向）存放运行时追踪类文件：stage-result.json（verify-code close 产物）、decision-log.md、journal.jsonl、task-metrics.jsonl、3rd-review 审查证据（evidence/3rd-review-roundN/...）。

**验收标准**：审查任一 stage 产出时，`git status`/`git show` 中 specs/{task-id}/ 顶层不得出现 evidence/ 子目录、stage-result.json、journal.jsonl 或 task-metrics.jsonl；3rd-review 证据文件必须能在 `{{task_tracking_root}}/tasks/{task-id}/evidence/` 下找到。

---

### FR-WORKTREE-FAILLOUD-007：僵尸检测 fail-loud

`git worktree list --porcelain` 校验逻辑在检测到以下情况时须 fail-loud，不自动删除：

- 僵尸 worktree（路径存在但未被 git worktree list 注册，与 D4 定义一致）
- 占用分支（目标分支已被其他 worktree 持有）

**验收标准**：模拟僵尸 worktree 或占用分支场景，运行校验逻辑，收到明确错误消息且未发生自动删除。

---

## 4. 边界场景与约束

### 边界场景

| 场景 | 期望行为 |
|------|---------|
| `WORKFLOWHUB_TASK_DIR` 未设置，yaml 也无配置 | fail-loud，报错，停止 |
| `WORKFLOWHUB_TASK_DIR` 设置为空字符串 | trim 后空视为缺失，走 yaml fallback |
| `WORKFLOWHUB_TASK_DIR` 设置为带空白的值 | 读取后 trim；trim 后空视为缺失 |
| `WORKFLOWHUB_TASK_DIR` 设置为相对路径或 `~` 开头 | fail-loud，必须绝对路径（以 `/` 开头），不展开 `~` |
| `WORKFLOWHUB_TASK_DIR` 路径存在但不是目录 | fail-loud，路径必须指向目录 |
| `WORKFLOWHUB_TASK_DIR` 路径不存在 | fail-loud，parser 不自动创建目录（由调用方在创建阶段负责 mkdir -p）|
| worktree.json 已存在且 status=active，分支匹配 | 复用现有 worktree 记录，校验字段完整性后继续 |
| worktree.json 已存在且 status=active，分支不匹配 | fail-loud，报字段冲突，不自动覆盖 |
| worktree.json 已存在且 status=cleaned | 报错提示该 task 已归档，须新建 task-id |
| worktree.json 不存在但目标分支已存在 | fail-loud，检测到孤立分支，不自动强制切换，需人工确认 |
| make-decision 未写 worktree.json，build-code 读取时 | fail-loud，报错路径，不静默降级 |
| verify-code 质量事实未达到关闭条件时 close 流程被触发 | 记录质量事实（warn），上报 needs_human=true，由人工决定是否继续 close；不自动阻断（符合宪法 Q2 记录型门控原则） |

### 约束

- task-id 格式：两到三个小写英文单词，连字符分隔；make-decision 对输入执行两步处理（decision-log D3）：①归一化转换（转小写→非字母数字替换为连字符→合并连续连字符→去首尾连字符）；②校验归一化结果必须匹配 `^[a-z]+(-[a-z]+){1,2}$`，仍不合规则 fail-loud 拒绝
- push_policy 字段值固定为 `"verify-code-only"`，不可扩展为其他值（防止后续滥用中间推送）
- worktree.json 由 make-decision 首次写入后，后续 stage 只读，不得修改；verify-code close 阶段完成清理后例外，允许将 status 字段写为 `"cleaned"`
- 不引入任何新的外部 npm 依赖

---

## 5. 成功标准（可度量）

1. 在 Multica 多 agent 环境下跑完全流程，5 个 pipeline stage 均可读取 worktree.json 且产物路径连续，无断链：make-decision（唯一写入方）→ build-spec（只读）→ build-plan（只读）→ build-code（只读）→ verify-code（只读，close 阶段可更新 status 字段）；build-spec 和 build-plan 不创建 worktree，但须读取 worktree.json 的 target_repo_root 字段确定仓库根路径，缺失时 fail-loud
2. 环境变量 `WORKFLOWHUB_TASK_DIR` 优先级覆盖生效，可通过测试用例验证
3. git log 可追溯每个 stage 的提交；main 推送与远端任务分支删除只允许在 verify-code close 阶段人工确认后执行；main 推送必须执行一次，远端任务分支删除仅在远端分支存在时执行一次（不存在则跳过）
4. close 流程执行后四项验收均通过，worktree 和分支均已清理，spec 已归档

---

## 6. 依赖与影响范围

### 直接依赖

- make-decision/SKILL.md（需新增章节）
- build-code/SKILL.md §17 FR-WORKTREE-001（消费方）
- core/task-dir-parser.mjs（需修改）
- config/workflowhub.yaml（已有 task_dir 字段，line 41；无需新增）

### 影响范围

- 所有调用 core/task-dir-parser.mjs 的 stage（环境变量优先级变更为潜在 breaking，但有 fallback 保护）
- build-code 的 commit 触发点（需确认当前是否已有 per-stage commit 逻辑）
- verify-code 的 close 流程（需确认 push 仅在人工确认后执行，质量事实为记录型非阻断型）

### 未解风险

- [RESOLVED] Q1：`config/workflowhub.yaml` 已在 line 41 声明 `task_dir` 字段，字段已存在。FR-WORKTREE-ENVVAR-003 的 fallback 直接读取该现有字段，无需新增配置项。
- [RESOLVED] Q2：close 流程现有入口为 `workflows/verify-code/SKILL.md`，当前 Step 10=3rd-review 独立审查，Step 11=人工 merge gate（confirm + merge + branch-delete）。无独立 close SKILL.md。FR-WORKTREE-CLOSE-006 要求的 spec 归档、worktree 安全清理、分支安全清理、push 等步骤，需在 verify-code Step 11 不可逆动作序列中补充（对应 FR-WORKTREE-PUSH-005 的 8 步线性序列），不另建文件。

### 业务影响范围（Business Impact Scope）

| 影响维度 | 具体内容 | 严重度 |
|---|---|---|
| 跨 stage 产物断链 | worktree.json 缺失或路径不一致导致后续 stage 无法读取，pipeline 中断 | 高 |
| 任务目录丢失 | task_dir 不存在时未 fail-loud，导致产物写入意外位置，静默失败 | 高 |
| 分支污染 | 僵尸分支未清理，下一次同名任务启动时产生冲突，须人工介入 | 中 |
| push 时机失控 | 中间 stage 提前 push，main 分支收到未经验证代码 | 高 |
| close 部分执行 | worktree 或分支未清理即报告 success，后续任务占用同名资源 | 中 |
| pre-merge 3rd-review gate（已消除 post-close 风险） | 原 close 流程曾在 merge 后执行 3rd-review，此时 main 已含问题代码不可回滚；本 spec 将 3rd-review 前移到 merge 之前（FR-WORKTREE-CLOSE-006 步骤③），revise_required 时阻止 merge，彻底消除该高风险场景 | 已消除 |

| task-id 规范化拒绝 | make-decision 引入严格两步归一化（D3：转小写→连字符→校验 `^[a-z]+(-[a-z]+){1,2}$`）；不符合格式的输入（如含大写、特殊字符、单词数不足/过多）被 fail-loud 拒绝，用户看到明确错误提示，须修正 task-id 后重新运行 make-decision；已有任务若 task-id 不合规需人工重建 task-id（无自动迁移）。 | 中 |
| commit 追溯断裂/阶段产物未提交 | per-stage/per-phase commit 规则若未执行（某 stage 无 commit 且未记录"无变更"原因），审查时无法确认该阶段是否已完成、产物是否已固化；跨 stage 读取 stage-result/evidence 时可能读到上一轮遗留数据；影响 build-spec、build-plan、build-code、verify-code 的可追溯性和交付连续性 | 高 |

受影响的下游 stage：build-spec（读 target_repo_root）、build-plan（读 target_repo_root）、build-code（读全量 worktree.json）、verify-code（close 写 status=cleaned）。

---

## 7. 非目标（Out of Scope）

- 经验提取（用户明确说后续有别的任务跟踪，本任务不做）
- 多仓库并发 worktree 管理（超出本任务范围）
- 自动修复僵尸 worktree（明确要求 fail-loud 不自动删除）

---

## 8. Given/When/Then 场景（FR-BEHAV-001）

### FR-WORKTREE-CONTRACT-001

**场景 A — 正常路径**
- Given: make-decision stage 成功完成，task_dir 与 task-id 均已确定
- When: make-decision 在 {{task_tracking_root}}/tasks/{task-id}/ 写入 worktree.json
- Then: 文件存在，包含 target_repo_root / worktree_root / branch / created_by_stage / push_policy / status 全部 6 个字段，build-code 可直接读取消费

**场景 B — build-code 读取失败**
- Given: make-decision 未写入 worktree.json
- When: build-code 尝试读取 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`
- Then: 系统 fail-loud，输出明确错误路径，不静默降级继续执行

### FR-WORKTREE-MAKEDECISION-002

**场景 A — D4 占用分支检测**
- Given: 目标分支已被另一个 worktree 持有
- When: make-decision 执行 worktree 创建前校验
- Then: 输出明确错误说明分支冲突，不自动强制覆盖，停止执行

**场景 B — D3 task-id 不合规拒绝**
- Given: 用户输入 task-id 为 `My_Feature123`（含大写和数字）
- When: make-decision 执行两步归一化（转小写→连字符替换→合并→去首尾）后得到 `my-feature-123`，校验 `^[a-z]+(-[a-z]+){1,2}$` 失败（含数字词段 `123`）
- Then: fail-loud 拒绝，输出明确错误说明不合规原因，不继续执行 worktree 创建；用户须修正 task-id 后重新运行

**场景 C — D3 task-id 兼容归一化**
- Given: 用户输入 task-id 为 `Worktree Unification`（含大写和空格）
- When: make-decision 执行归一化：转小写 → `worktree unification`，空格替换为连字符 → `worktree-unification`，校验 `^[a-z]+(-[a-z]+){1,2}$` 通过（2个纯小写词）
- Then: 使用归一化结果 `worktree-unification` 作为 task-id，继续执行后续步骤

### FR-WORKTREE-ENVVAR-003

**场景 A — 环境变量优先**
- Given: WORKFLOWHUB_TASK_DIR 设置为某绝对路径，config/workflowhub.yaml 中 task_dir 为另一路径
- When: 调用 task-dir-parser 解析 task_dir
- Then: 返回环境变量所设路径，不使用 yaml 中的值

**场景 B — 降级 fallback**
- Given: WORKFLOWHUB_TASK_DIR 未设置，config/workflowhub.yaml 中存在 task_dir 字段
- When: 调用 task-dir-parser 解析 task_dir
- Then: 返回 yaml 中的配置值

**场景 C — 双缺失**
- Given: WORKFLOWHUB_TASK_DIR 未设置，config/workflowhub.yaml 也无 task_dir 字段
- When: 调用 task-dir-parser
- Then: 抛出明确错误，不使用任何硬编码路径

### FR-WORKTREE-COMMIT-004

**场景 A — per-stage commit 可追溯**
- Given: build-code 完整跑完多个 stage，其中部分 stage/phase 产生文件变更，部分无变更
- When: 检查提交历史和 stage-result/journal
- Then: 产生文件变更的 stage 至少对应一条包含 stage 名称的提交记录，无跨 stage 合并提交；无文件变更的 stage/phase 在 stage-result 或 journal 中存在"无变更"原因记录，不得静默跳过，不得创建空 commit

### FR-WORKTREE-PUSH-005

**场景 A — push 门控**
- Given: build-code 执行期间多个 stage 完成 commit
- When: close 流程在人工确认前中止
- Then: 无任何 push 发生

**场景 B — 正常 push**
- Given: close 流程收到 user_decision=true
- When: 执行 close 线性命令序列（FR-WORKTREE-PUSH-005 定义的 8 步顺序）
- Then: 归档 commit 已在任务分支提交；非快进合并已执行，归档 commit 被 main 包含；worktree 目录不存在；main 已推送至远端一次；远端任务分支存在时已删除，不存在时跳过；本地任务分支已删除；worktree.json status 已更新为 cleaned

### FR-WORKTREE-CLOSE-006

**场景 A — 完整 close（3rd-review pass + 人工确认）**
- Given: worktree.json 字段校验通过，质量事实已记录，3rd-review verdict=pass，user_decision=true
- When: 执行 close 流程不可逆动作序列
- Then: spec 已归档至 specs/archive/{task-id}/，worktree 目录不复存在，分支已从本地和远端删除（删除前已确认目标提交被 main 包含），merge commit 可在主线提交历史中查到；stage-result.json 存在且 verdict 字段=pass

**场景 B — 3rd-review revise_required（阻止 merge）**
- Given: worktree.json 字段校验通过，质量事实已记录，3rd-review verdict=revise_required
- When: 执行 close 流程到达步骤③
- Then: merge 未发生，分支未删除，push 未执行；stage-result.json 中 review_status=revise_required 且 needs_human=true；findings 列表可查；已 escalate_to_human

**场景 C — 不可逆动作中途失败**
- Given: 3rd-review verdict=pass，user_decision=true，8 步序列在第 k 步（k < 8）失败
- When: 步骤 k 执行失败
- Then: 立即停止，不自动回滚已执行步骤，不跳过后续步骤；stage-result.json 记录失败步骤编号和错误信息；needs_human=true，已 escalate_to_human

### FR-WORKTREE-SCOPE-008

**场景 A — worktree.json 存在时 build-spec 读取路径**
- Given: make-decision 已在 `{{task_tracking_root}}/tasks/{task-id}/worktree.json` 写入完整字段（含 worktree_root、target_repo_root）
- When: build-spec 执行并需要读取 worktree.json 中的路径信息
- Then: build-spec 从 worktree.json 读取 `worktree_root` 和 `target_repo_root`，不调用任何 `git worktree add`，`git worktree list` 条目数与进入阶段前一致

**场景 B — worktree.json 缺失时 build-spec fail-loud**
- Given: `{{task_tracking_root}}/tasks/{task-id}/worktree.json` 不存在
- When: build-spec 尝试读取 worktree.json
- Then: 系统 fail-loud，输出明确错误路径，退出码非零，不静默降级或自行创建新 worktree

**场景 C — build-spec 不得创建新 worktree**
- Given: 任意时刻 build-spec 或 build-plan 阶段运行中
- When: 阶段执行任意步骤
- Then: 任何时间点不得出现 `git worktree add` 调用；`git worktree list` 条目数在阶段前后保持一致

### FR-WORKTREE-SCOPE-009

**场景 A — specs 目录内不得出现 evidence 文件**
- Given: 3rd-review 执行后产出审查证据文件
- When: 在任意 stage 审查产出（git status / git show 检查 specs/{task-id}/ 目录）
- Then: specs/{task-id}/ 目录下不出现 evidence/ 子目录或任何非 spec/plan/tasks 类文件；3rd-review 证据文件只出现在 `{{task_tracking_root}}/tasks/{task-id}/evidence/` 路径下

**场景 B — evidence 文件正确落点**
- Given: 3rd-review 审查完成，产出证据文件
- When: 查询 `{{task_tracking_root}}/tasks/{task-id}/evidence/3rd-review-roundN/` 路径
- Then: 证据文件存在且可查；对应 git 仓库的 specs/{task-id}/ 路径下无同名文件

### FR-WORKTREE-FAILLOUD-007

**场景 A — 僵尸 worktree**
- Given: 某路径存在于文件系统但未被 git worktree list 注册（D4 定义的僵尸目录场景）
- When: 运行 worktree 校验逻辑
- Then: 输出明确的僵尸 worktree 错误，不执行自动删除

---

## 9. Known Gaps

1. **task-dir-parser.mjs 现状与 FR-WORKTREE-ENVVAR-003 的差距**：当前实现读取 yaml `task_dir` 字段作为 fallback，但完全未实现 `WORKFLOWHUB_TASK_DIR` 环境变量优先逻辑。此为本任务核心改动点之一，需在 build-code 阶段实现。

2. **make-decision/SKILL.md worktree 章节缺失**：build-code §17 FR-WORKTREE-001 已引用该章节，但其当前内容不存在。这是跨 SKILL.md 的规范缺口，需本任务补齐。

3. **verify-code close 步骤未覆盖 spec 归档和 worktree 清理**：现有 verify-code Step 10 有 merge/branch-delete 确认，但无 spec 归档（将 specs/ 移入 specs/archive/）和 worktree 目录移除步骤。需补充。

4. **metrics recordSkeleton 路径解析失败**：当前 metrics/collector.mjs 在 TASK_TRACKING_ROOT 未设置时报 `Cannot read properties of undefined (reading 'taskMetricsPath')`。本任务不修复此问题，记录为已知摩擦。

5. **close 重入恢复机制（partial-close）——decision-log 无对应决策，本任务不实现**：close 流程中途失败后的重入状态机在 decision-log D1-D6 中均无对应决策支持，不得在本任务的 build-plan 或 build-code 阶段实现。须补充 decision-log 决策后方可列入 FR 正文。

---

## 附录：质量事实契约（FR-CONTRACT-001）

### 1. Scope 边界

**IN scope**:
- worktree.json 契约字段定义（6 字段）
- make-decision/SKILL.md 新增 worktree 章节（R1-R7，内部规则编号，不与 decision-log D 编号混用；含 D1 task_tracking_root 读取、D5 commit 责任）
- core/task-dir-parser.mjs 改为 WORKFLOWHUB_TASK_DIR 优先
- build-code §17 删除旧"File does not exist → create worktree"fallback 路径，改为 worktree.json 缺失时 fail-loud（stop/escalate_to_human）；此为废除旧 fallback 的明确要求
- build-code per-stage commit 触发
- push 仅 verify-code close 阶段人工确认后执行一次（--no-ff merge，命令级序列见 FR-WORKTREE-PUSH-005）
- verify-code close 流程补充 spec 归档 + worktree/branch 安全清理

**OUT scope**:
- 经验提取（用户明确排除）
- 多仓库并发 worktree 管理
- 自动修复僵尸 worktree
- metrics/collector.mjs 路径解析 bug 修复

### 2. 自检结果（7 条 + Spec-Purity grep）

| # | 自检项 | 结果 | 说明 |
|---|--------|------|------|
| 1 | spec-ladder 档位已声明且有依据 | pass | 序言中明确标注 B 档，给出三模块跨越理由 |
| 2 | 所有 FR 使用 FR-{DOMAIN}-NNN 格式 | pass | FR-WORKTREE-CONTRACT-001 ~ FR-WORKTREE-FAILLOUD-007，格式符合 |
| 3 | 每个 FR 至少有一条 Given/When/Then 场景 | pass | §8 已补齐全部 9 个 FR 的场景（含 SCOPE-008、SCOPE-009） |
| 4 | 五章硬门完整（速读卡/FR/不做/验收/影响范围） | pass | §1 概述充当速读卡，§3 FR，§7 非目标，§5 成功标准，§6 影响范围 |
| 5 | spec↔decision-log 覆盖率（FR-ALIGN-001） | pass | decision-log D1-D6、验收标准 1-9 均在 FR 中有对应条目：D1→FR-WORKTREE-ENVVAR-003（task_dir 机制/R1）、D2→FR-WORKTREE-CONTRACT-001+MAKEDECISION-002(R2，target_repo_root 探测固化)、D3→FR-WORKTREE-MAKEDECISION-002(R3，task-id 规范化)、D4→FR-WORKTREE-MAKEDECISION-002(R6，worktree 存在性冲突检测)+FAILLOUD-007、D5→FR-WORKTREE-COMMIT-004+PUSH-005、D6→FR-WORKTREE-CLOSE-006+SCOPE-008/009 |
| 6 | 无 [NEEDS CLARIFICATION] 残留 | pass | Q1/Q2 均已标记 [RESOLVED] 并附消解依据 |
| 7 | Known Gaps 段存在 | pass | §9 已添加 |
| Purity | Spec-Purity grep | pass（口径修正） | FR 正文不含实现命令行（`&&`、`$VAR`、shell 管道）；正文中出现的命令级表达（如 `git worktree list`、`git log main --merges`）均作为"验收观察点"（用于描述可检测的外部状态），不属于 FR 内嵌 shell 脚本，符合 spec 可证伪原则；Markdown 表格 `\|` 为 false positive，不计 |

### 3. 独立审查摘要

历史审查记录：
- 第1轮（codex v1，2026-07-04）：revise_required，11 项问题
- 第2轮（codex v2，2026-07-04）：revise_required，7 项残留
- 第3轮（2026-07-04）：用户拍板修改方向，执行后重审，verdict: revise_required（5条finding）
- 第4轮（2026-07-04）：修复5条finding后重审，verdict: revise_required（3条finding：commit scope、close顺序、Known Gaps过期状态）
独立审查历史见 task_dir 下 evidence/3rd-review-round*/ 目录，以最新一轮 verdict.json 为准，不在本文固化轮次编号。

### 4. 未解风险

- [FRICTION] metrics Step 1: recordSkeleton 报 `Cannot read properties of undefined (reading 'taskMetricsPath')`，TASK_TRACKING_ROOT 未设置导致 collector 路径解析失败。非阻断，已跳过。建议: 在 metrics/collector.mjs 添加 TASK_TRACKING_ROOT 缺失时的 fallback 路径或明确错误提示。
- [scope-triage] 高危词 grep：NO_HITS，无阻断语义词命中。
- [spec-purity] 表格 `|` 字符命中 warn（行 51-59、145-151），人工确认为 Markdown 表格，非 shell 管道。
- [align] decision-log 验收标准第 8/9 条（分支/worktree 安全清理）已映射到 FR-WORKTREE-CLOSE-006 和 FR-WORKTREE-FAILLOUD-007。
- [gap-resolved] 3rd-review revise_required（初次 2026-07-04）已修复：11 项 finding（F-01 status 字段只读豁免、F-02 build-code §17 废除旧 fallback、F-03 commit/push/merge 策略补全、F-04 重跑三状态表、F-08 verify-code gate 改为记录+needs_human、F-11 env var 边界值规则、F-12 target_repo_root 推导方式、F-13 分支命名精确格式、F-14 schema 校验规则、F-24 Purity false positive 结论）均已在 spec 中修订。详见 evidence/3rd-review-verdict.md。待重新执行异源审查确认 verdict。

### 5. Handoff required_reads

下游 build-plan 必读：
- `specs/worktree-unification/spec.md`（本文件，含质量事实契约）
- `specs/worktree-unification/checklists/requirements.md`
- `specs/worktree-unification/constitution-check.md`
- `specs/worktree-unification/baseline-report.md`
- `workflows/make-decision/SKILL.md`（待补充 worktree 章节）
- `workflows/build-code/SKILL.md` §17 FR-WORKTREE-001
- `core/task-dir-parser.mjs`（待修改）
- `workflows/verify-code/SKILL.md` Step 9-10（待补充 close 步骤）
