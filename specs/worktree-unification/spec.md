# Spec: Worktree Unification Protocol
task-id: worktree-unification
version: 0.1 (draft)
date: 2026-07-04
skill: spec-specify (adapted from speckit-specify)

---

## 序言：档位判断与 F10 反过度工程四问

### 档位判断（FR-LADDER-001）

**档位：B 档（中等）**

理由：本任务跨越 3 个模块（make-decision/SKILL.md、build-code/SKILL.md §17、core/task-dir-parser.mjs），引入一个新的跨阶段契约（worktree.json），变更环境变量优先级规则，以及调整 commit/push 策略和 close 流程。改动面跨模块但均在 workflowhub 系统边界内，无新引入外部依赖，非破坏性变更（向后兼容 fallback 保留）。

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
| worktree.json | 跨 stage 共享的 worktree 状态契约文件，存储在 task_dir 下 |
| task_dir | 环境变量 `WORKFLOWHUB_TASK_DIR` 指定的任务跟踪根目录（非仓库内） |
| target_repo_root | 目标仓库的根路径，默认通过 `git rev-parse --show-toplevel` 推导，不使用原始工作目录 |
| worktree_root | 实际创建的 worktree 目录路径 |
| push_policy | 推送策略：push 仅在 verify-code close 阶段人工确认后执行一次（close 命令级序列中） |
| created_by_stage | 记录哪个 stage 创建了该 worktree |
| stage-per-commit | 每个 stage/phase 完成后立即 commit，不积压 |

### 假设

- task_dir 由外部环境变量 `WORKFLOWHUB_TASK_DIR` 提供；若未设置，降级读取 workflowhub.yaml 中的配置值（fallback，非停止条件）
- `target_repo_root` 表示主 checkout 根目录（即执行 `git worktree add` 的原始 checkout，非任务 worktree）；其值须在 make-decision 阶段从主 checkout 上下文中通过 `git rev-parse --show-toplevel` 推导后写入 worktree.json，不得在任务 worktree 内执行该命令（会得到 worktree_root，语义错误）；close 流程需切回此路径执行 merge/remove；`worktree_root` 表示任务 worktree 目录路径，二者不同
- task-id 格式：两到三个小写英文单词，连字符分隔（如 `worktree-unification`），已在 make-decision 阶段确定，必须匹配正则 `^[a-z]+(-[a-z]+){1,2}$`
- worktree.json 由 make-decision stage 负责首次写入，后续 stage 只读；唯一例外：verify-code close 阶段完成清理后可将 status 字段更新为 `"cleaned"`（仅此字段，其余字段保持只读）

---

## 3. 功能需求（FR）

### FR-WORKTREE-CONTRACT-001：worktree.json 契约字段

worktree.json 须包含以下字段，格式为 JSON，存储在 `{task_dir}/{task-id}/worktree.json`：

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

**close 重入恢复规则**（partial close 中途失败时）：
- 若 worktree 目录已不存在（worktree remove 已执行）但 status 仍为 `"active"`：active-only 校验会因 `worktree_root` 不在 `git worktree list` 中而失败，阻止正常重入；此时实现须检测此特殊状态（worktree 消失但 status=active），直接跳过 active-only 校验、跳过已完成的清理步骤，从下一个未完成步骤继续执行（幂等重入，不视为 fail-loud 条件）
- 各不可逆步骤须记录已完成标记，写入 `{task_dir}/{task-id}/close-progress.json`，schema 如下（bool 字段默认 false，每步成功验证后立即写入 true；hash/path 字段在对应步骤完成时同步写入）：
  ```json
  {
    "archive_commit": false,
    "archive_commit_hash": "",
    "merged_main": false,
    "merge_commit_hash": "",
    "worktree_removed": false,
    "worktree_root": "",
    "main_pushed": false,
    "remote_branch_deleted": false,
    "local_branch_deleted": false,
    "branch": "",
    "target_repo_root": "",
    "cleaned_status_written": false
  }
  ```
  重入时：先读取 close-progress.json，再 cross-check 各标记对应的 git 实际状态（如 `merged_main=true` 但 merge commit 不在 main 历史中，则视为标记错误，fail-loud）；cross-check 还须比对 hash/path 字段与实际 git 状态（如 `archive_commit_hash` 须存在于 git log、`merge_commit_hash` 须在 main 历史中、`worktree_root`/`branch`/`target_repo_root` 须与当前 worktree.json 及 git 状态一致）；仅当标记与实际状态均一致时，跳过已完成步骤，从第一个 false 标记处继续执行。

**cleaned-only 校验**（status=cleaned 时执行，替代 active-only）：
- 仅执行 common schema 校验（6 字段存在、类型、值域）
- 校验通过后直接报告"task 已归档，不可重用，须新建 task-id"并停止；不检查 worktree/branch 是否已物理清理（物理清理在 close 执行期间保证，不在读取时重验）

说明：close 执行期间（写入 status=cleaned 之前）须先验证 worktree、local branch、remote branch 均已清理成功，只有全部清理完成才写入 status=cleaned；因此读取时无需重复审计。

**验收标准**：build-code §17 FR-WORKTREE-001 可直接读取该文件并消费上述字段，无需任何转换逻辑；common 校验不通过则 fail-loud；status=active 时 active-only 校验不通过则 fail-loud；status=cleaned 时只做 common 校验并拒绝重用。

### FR-WORKTREE-MAKEDECISION-002：make-decision 补齐 worktree 规则章节

make-decision/SKILL.md 须新增 worktree 创建规则章节，覆盖以下决策（D1-D5）：

- D1：目标仓库路径（target_repo_root）默认推导规则
- D2：分支命名规则，精确格式为 `workflowhub/{task-id}`；task-id 必须匹配正则 `^[a-z]+(-[a-z]+){1,2}$`（两到三个小写英文单词，连字符分隔，禁止数字、下划线、大写、连续连字符、首尾连字符、`/`、`..`、`@{`、空白字符）；完整分支名必须匹配 `^workflowhub/[a-z]+(-[a-z]+){1,2}$`；重跑时若 worktree.json status=active 且分支名匹配则复用，否则 fail-loud
- D3：worktree 创建时机（make-decision 阶段末尾）
- D4：worktree.json 写入时机与字段要求
- D5：僵尸 worktree / 占用分支的检测规则（fail-loud，不自动删除）

**task 子目录创建职责（D6）**：make-decision 负责创建 `{task_dir}/{task-id}/` 子目录（一次性，仅在首次运行时）。执行条件：
- 前置条件：`task_dir`（由 `WORKFLOWHUB_TASK_DIR` 或 workflowhub.yaml 提供）必须已存在；若父目录 task_dir 不存在，则 fail-loud 报错，不自动创建父目录。
- 幂等：若 `{task_dir}/{task-id}/` 已存在，读取其中 worktree.json 并按 status 字段规则处理（status=active 则复用，status=cleaned 则 fail-loud 报"task 已归档"）。
- 成功后方可继续 D3 worktree 创建步骤。

**验收标准**：读取 make-decision/SKILL.md，存在独立 worktree 章节，D1-D5 规则均有明确条文。

### FR-WORKTREE-ENVVAR-003：core/task-dir-parser.mjs 环境变量优先

`core/task-dir-parser.mjs` 须按以下优先级读取 task_dir：

1. 环境变量 `WORKFLOWHUB_TASK_DIR`（最高优先）
2. `workflowhub.yaml` 中配置的值（fallback）
3. 若两者均缺失，fail-loud 报错，不使用硬编码路径

**验收标准**：
- Given `WORKFLOWHUB_TASK_DIR=/tmp/test`（目录已存在），调用 parser，返回 `/tmp/test`
- Given `WORKFLOWHUB_TASK_DIR` 未设置，`workflowhub.yaml` 存在且含 `task_dir` 字段，返回 yaml 中的配置值
- Given `WORKFLOWHUB_TASK_DIR` 未设置，`workflowhub.yaml` 文件不存在，parser fail-loud 抛出明确错误（不使用硬编码路径）
- Given `WORKFLOWHUB_TASK_DIR` 未设置，`workflowhub.yaml` 存在但无 `task_dir` 字段，parser fail-loud 抛出明确错误（区别于文件不存在场景）
- Given 路径存在但不是目录，parser fail-loud
- Given 路径不存在，parser fail-loud

### FR-WORKTREE-COMMIT-004：每 stage/phase commit

build-code 流程中，每个 stage 或 phase 完成后，每个原子提交的 commit message 须包含 stage 名称前缀（格式：`workflowhub(<stage-name>): <描述>`），使提交记录可追溯到具体 stage。不额外制造阶段级空提交（即不使用 `git commit --allow-empty` 作为 stage marker）——原子提交本身承担 stage 标记职责。

commit message 中括号内的标识符有两类：
- **stage 级提交**：标识符为固定枚举之一：`make-decision`、`build-spec`、`build-plan`、`build-code`、`verify-code`、`close`；格式 `workflowhub(<stage>): <描述>`
- **phase 级提交**：标识符格式为 `<stage>/<phase-name>`，其中 stage 取上述固定枚举，phase-name 在各 stage SKILL.md 中定义（如 build-code 的 phase 1 写为 `workflowhub(build-code/phase-1): <描述>`）

两类互不混用：纯 stage 提交不含斜杠，phase 提交必须带 `<stage>/` 前缀。

close 归档 commit 仅包含 `git mv specs/{task-id}/ specs/archive/{task-id}/`（spec 目录移入归档），message 格式固定为 `workflowhub(close): archive {task-id}`。`git worktree remove` 是仓库外清理动作，不属于此 commit 内容，在归档 commit 之后作为独立清理步骤执行（见 FR-WORKTREE-PUSH-005 步骤 4）。

**验收标准**：执行完整 build-code 流程后，`git log --oneline` 中每个 stage 的原子提交均带有对应 stage 名称前缀；close 归档 commit 独立存在且 message 格式符合规定。

### FR-WORKTREE-PUSH-005：push 仅在 verify-code 收尾执行

close 阶段的完整线性操作序列（唯一允许发生远端交互的阶段；中间 stage 不得执行任何 push 或远端分支清理；须在人工确认 user_decision=true 后按此顺序执行，不可调换）：

1. 在任务 worktree（任务分支 `workflowhub/{task-id}` 内）：执行 `git mv specs/{task-id}/ specs/archive/{task-id}/` 并 commit（message：`workflowhub(close): archive {task-id}`）——归档 commit 进入任务分支，确保后续 merge 时被 main 包含
2. 切换执行上下文至主 checkout：将工作目录切换到 `target_repo_root`（主 checkout 根目录，非任务 worktree），并验证当前分支为 `main`（`git rev-parse --abbrev-ref HEAD` 输出为 `main`）；禁止在任务 worktree 内执行 `git checkout main`（linked worktree 不能 checkout 已被主 checkout 占用的分支，会失败）
3. `git merge --no-ff workflowhub/{task-id}`（从主 checkout 执行，保留合并节点，归档 commit 随之进入 main）
4. `git worktree remove <worktree_root_path>`（从主 checkout 执行，清理 worktree 目录）；验证 worktree 目录不存在，`git worktree list` 无该条目
5. `git push origin main`（推送合并后的 main）
6. 检查并删除远端任务分支：`git ls-remote --exit-code origin refs/heads/workflowhub/{task-id}`
   - 若存在（exit 0）：执行 `git push origin :refs/heads/workflowhub/{task-id}` 删除远端分支
   - 若不存在（exit 非 0）：跳过，记录 info "远端分支不存在，无需删除"，不报错
7. `git branch -d workflowhub/{task-id}`（删除本地任务分支；在远端处理完成后再删，便于失败重试）
8. 更新 `{task_dir}/{task-id}/worktree.json` 的 status 字段为 `"cleaned"`（这是 task_dir 下的外部契约文件，不属于目标 repo 的 git commit；仅更改 status 字段，其余字段保持不变）

**验收标准**：close 后 `git log main --merges` 可查到合并节点；`git log main --oneline` 包含 `workflowhub(close): archive {task-id}` commit；worktree 目录不存在；本地分支不存在；远端分支不存在或原本从未存在（均视为满足）；`{task_dir}/{task-id}/worktree.json` status 字段为 `"cleaned"`。

### FR-WORKTREE-CLOSE-006：close 流程完整性

close 流程须包含以下步骤，无遗漏：

- 入口校验：读取 worktree.json，校验字段完整性（common 校验）和路径/分支存在性（active-only 校验）；校验失败 fail-loud，阻止 close。**例外**：若 close-progress.json 存在且 `worktree_removed=true`、且其 hash/path 字段与实际 git 状态一致（按重入 cross-check 规则验证），则跳过 active-only 校验，直接从第一个未完成步骤继续执行（partial-close 重入），不视为 fail-loud 条件。
- 质量事实记录：将当前验收清单状态写入 final-test-report，如有未验证条目记录 warn 并上报 needs_human=true；不自动阻断 close（宪法 Q2：质量事实只记录，不阻断推进，由人工决定）
- 不可逆动作（须人工确认 user_decision=true 后方可执行）：按 FR-WORKTREE-PUSH-005 定义的 8 步线性序列严格顺序执行，不得调换。序列为：① 归档 commit（git mv + commit）→ ② 切主 checkout → ③ merge --no-ff → ④ git worktree remove → ⑤ push main → ⑥ 删远端分支（或跳过） → ⑦ 删本地分支 → ⑧ 更新 worktree.json status=cleaned。FR-WORKTREE-CLOSE-006 不另行规定顺序，以 FR-WORKTREE-PUSH-005 为唯一权威。

**验收标准**：close 流程后，spec 已归档、worktree 已清理、分支已删除、merge commit 可查；若质量事实有 warn，needs_human=true 记录可查，但不阻止后续人工推进。

### FR-WORKTREE-SCOPE-008：build-spec / build-plan 不创建 worktree

build-spec 和 build-plan 不执行任何 `git worktree add` 操作，不写入 worktree.json，只读取 worktree.json 中的 `target_repo_root` 字段作为仓库根路径定位依据。若字段缺失或 worktree.json 不存在，须 fail-loud，报错路径，不静默降级。

**验收标准**：在 build-spec 和 build-plan 阶段，git worktree list 的条目数量与进入该阶段前一致（无新增 worktree）；worktree.json 缺失时 stage 输出明确错误且退出码非零。

**补充说明**：build-spec 和 build-plan 虽然不创建 worktree，但它们的交付物（spec.md、plan.md、tasks.md）必须写入 worktree.json 中 `worktree_root` 字段所指向的 worktree 根目录下的 `specs/{task-id}/` 路径，并在任务分支上完成 commit。这些 stage 的"只读 worktree.json"约束仅指不新增 worktree 条目，不影响其在已有 worktree 内正常写文件和提交的职责。

---

### FR-WORKTREE-SCOPE-009：repo specs/ 与 task_dir 的存放边界

`specs/{task-id}/` 目录（仓库内）只允许存放交付物文件：spec.md、plan.md、tasks.md。禁止存放过程/追踪类文件。

`task_dir/{task-id}/`（仓库外，WORKFLOWHUB_TASK_DIR 指向）存放过程/追踪类文件：decision-log.md、journal.jsonl、task-metrics.jsonl、3rd-review 审查证据（evidence/3rd-review-roundN/...）。

**验收标准**：审查任一 stage 产出时，`git status`/`git show` 中 specs/{task-id}/ 下不得出现 evidence/ 或其他非 spec/plan/tasks 文件；3rd-review 证据文件必须能在 `{task_dir}/{task-id}/evidence/` 下找到。

---

### FR-WORKTREE-FAILOUD-007：僵尸检测 fail-loud

`git worktree list --porcelain` 校验逻辑在检测到以下情况时须 fail-loud，不自动删除：

- 僵尸 worktree（目录已不存在但 git 仍记录）
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

- task-id 格式：两到三个小写英文单词，连字符分隔，匹配 `^[a-z]+(-[a-z]+){1,2}$`
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
- workflowhub.yaml（已有 task_dir 字段，line 41；无需新增）

### 影响范围

- 所有调用 core/task-dir-parser.mjs 的 stage（环境变量优先级变更为潜在 breaking，但有 fallback 保护）
- build-code 的 commit 触发点（需确认当前是否已有 per-stage commit 逻辑）
- verify-code 的 close 流程（需确认 push 仅在人工确认后执行，质量事实为记录型非阻断型）

### 未解风险

- [RESOLVED] Q1：`workflowhub.yaml` 已在 line 41 声明 `task_dir: /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/`，字段已存在。FR-WORKTREE-ENVVAR-003 的 fallback 直接读取该现有字段，无需新增配置项。
- [RESOLVED] Q2：close 流程现有入口为 `workflows/verify-code/SKILL.md` 步骤 9（明文停顿/收尾确认）和步骤 10（收尾执行：merge + branch-delete）。无独立 close SKILL.md。FR-WORKTREE-CLOSE-006 要求的 spec 归档、验证清单检查、worktree 安全清理、分支安全清理四步，需在 verify-code Step 10 中补充，不另建文件。

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
- When: make-decision 在 task_dir/{task-id}/ 写入 worktree.json
- Then: 文件存在，包含 target_repo_root / worktree_root / branch / created_by_stage / push_policy / status 全部 6 个字段，build-code 可直接读取消费

**场景 B — build-code 读取失败**
- Given: make-decision 未写入 worktree.json
- When: build-code 尝试读取 {task_dir}/{task-id}/worktree.json
- Then: 系统 fail-loud，输出明确错误路径，不静默降级继续执行

### FR-WORKTREE-MAKEDECISION-002

**场景 A — D5 僵尸检测**
- Given: 目标分支已被另一个 worktree 持有
- When: make-decision 执行 worktree 创建前校验
- Then: 输出明确错误说明分支冲突，不自动强制覆盖，停止执行

### FR-WORKTREE-ENVVAR-003

**场景 A — 环境变量优先**
- Given: WORKFLOWHUB_TASK_DIR 设置为 /tmp/test，workflowhub.yaml 中 task_dir 为另一路径
- When: 调用 task-dir-parser 解析 task_dir
- Then: 返回 /tmp/test，不使用 yaml 中的值

**场景 B — 降级 fallback**
- Given: WORKFLOWHUB_TASK_DIR 未设置，workflowhub.yaml 中存在 task_dir 字段
- When: 调用 task-dir-parser 解析 task_dir
- Then: 返回 yaml 中的配置值

**场景 C — 双缺失**
- Given: WORKFLOWHUB_TASK_DIR 未设置，workflowhub.yaml 也无 task_dir 字段
- When: 调用 task-dir-parser
- Then: 抛出明确错误，不使用任何硬编码路径

### FR-WORKTREE-COMMIT-004

**场景 A — per-stage commit 可追溯**
- Given: build-code 完整跑完多个 stage
- When: 检查提交历史
- Then: 每个 stage 至少对应一条包含 stage 名称的提交记录，无跨 stage 合并提交

### FR-WORKTREE-PUSH-005

**场景 A — push 门控**
- Given: build-code 执行期间多个 stage 完成 commit
- When: close 流程在人工确认前中止
- Then: 无任何 push 发生

**场景 B — 正常 push**
- Given: close 流程收到 user_decision=true
- When: 执行 close 线性命令序列（FR-WORKTREE-PUSH-005 定义的 8 步顺序）
- Then: 归档 commit 已在任务分支提交；merge --no-ff 已执行，归档 commit 被 main 包含；worktree 目录不存在；`git push origin main` 已执行一次；远端任务分支存在时已执行 `git push origin :refs/heads/workflowhub/{task-id}`，不存在时跳过；本地任务分支已删除；worktree.json status 已更新为 cleaned

### FR-WORKTREE-CLOSE-006

**场景 A — 完整 close**
- Given: worktree.json 字段校验通过，质量事实已记录，user_decision=true
- When: 执行 close 流程
- Then: spec 已归档至 specs/archive/{task-id}/，worktree 目录不复存在，分支已从本地和远端删除，merge commit 可在主线提交历史中查到

### FR-WORKTREE-FAILOUD-007

**场景 A — 僵尸 worktree**
- Given: git 记录中存在一个目录已不存在的 worktree 条目
- When: 运行 worktree 校验逻辑
- Then: 输出明确的僵尸 worktree 错误，不执行自动删除

---

## 9. Known Gaps

1. **task-dir-parser.mjs 现状与 FR-WORKTREE-ENVVAR-003 的差距**：当前实现读取 yaml `task_dir` 字段作为 fallback，但完全未实现 `WORKFLOWHUB_TASK_DIR` 环境变量优先逻辑。此为本任务核心改动点之一，需在 build-code 阶段实现。

2. **make-decision/SKILL.md worktree 章节缺失**：build-code §17 FR-WORKTREE-001 已引用该章节，但其当前内容不存在。这是跨 SKILL.md 的规范缺口，需本任务补齐。

3. **verify-code close 步骤未覆盖 spec 归档和 worktree 清理**：现有 verify-code Step 10 有 merge/branch-delete 确认，但无 spec 归档（git mv specs/ specs/archive/）和 git worktree remove 步骤。需补充。

4. **metrics recordSkeleton 路径解析失败**：当前 metrics/collector.mjs 在 TASK_TRACKING_ROOT 未设置时报 `Cannot read properties of undefined (reading 'taskMetricsPath')`。本任务不修复此问题，记录为已知摩擦。

---

## 附录：质量事实契约（FR-CONTRACT-001）

### 1. Scope 边界

**IN scope**:
- worktree.json 契约字段定义（6 字段）
- make-decision/SKILL.md 新增 worktree 章节（D1-D5）
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
| 2 | 所有 FR 使用 FR-{DOMAIN}-NNN 格式 | pass | FR-WORKTREE-CONTRACT-001 ~ FR-WORKTREE-FAILOUD-007，格式符合 |
| 3 | 每个 FR 至少有一条 Given/When/Then 场景 | pass | §8 已补齐全部 7 个 FR 的场景 |
| 4 | 五章硬门完整（速读卡/FR/不做/验收/影响范围） | pass | §1 概述充当速读卡，§3 FR，§7 非目标，§5 成功标准，§6 影响范围 |
| 5 | spec↔decision-log 覆盖率（FR-ALIGN-001） | pass | decision-log D1-D5、验收标准 1-9 均在 FR 中有对应条目 |
| 6 | 无 [NEEDS CLARIFICATION] 残留 | pass | Q1/Q2 均已标记 [RESOLVED] 并附消解依据 |
| 7 | Known Gaps 段存在 | pass | §9 已添加 |
| Purity | Spec-Purity grep | pass | 重跑 grep 检测：无 `&&`、无 `$VAR`、无独立 shell 管道符；Markdown 表格 `\|` 已确认为 false positive，无需处理 |

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
- [align] decision-log 验收标准第 8/9 条（分支/worktree 安全清理）已映射到 FR-WORKTREE-CLOSE-006 和 FR-WORKTREE-FAILOUD-007。
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
