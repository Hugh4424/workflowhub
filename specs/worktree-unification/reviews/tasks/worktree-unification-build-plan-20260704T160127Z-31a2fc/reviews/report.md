# 审查报告 — worktree-unification-build-plan-20260704T160127Z-31a2fc (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

Round 2 verdict: revise_required. 已执行 required skill fallback：speckit-analyze、plan-eng-review、review 均以 read-only verifier / skill-file fallback 方式检查 spec.md、plan.md、tasks.md、data-contracts.md、constitution 文件和 round 1 报告。round 1 的核心 blockers 未闭环，至少 data-contracts 路径/fallback、T007 边界冲突、build-plan 覆盖缺口、Forbidden files 冲突、旧宪法假绿、commit 覆盖缺口、parser 测试缺口、真实 3rd-review runner、stage-result 文件名冲突仍存在；部分已连续两轮未修，应在下一轮前逐项修复并写清 resolution。

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:16 | 问题: repeat: worktree.json 契约路径仍与权威 spec 冲突。data-contracts 写的是 `{worktree_root}/worktree.json`，但 spec.md 要求 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`。按当前契约执行会把跨 stage 状态写进目标 worktree，继续复现跨 stage 断链。 | 建议: 把 Contract 1 的 File path 改为 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`，并明确 `worktree_root` 只是目标 repo worktree 字段值，不是契约文件存放根。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:71 | 问题: repeat: task_dir 返回值语义仍是旧模型。data-contracts 写成 parser 返回 `task_dir` 并供调用方拼 `{task_dir}/{task-id}/`，但 spec.md:55 和 spec.md:140 要求 parser 返回 task_tracking_root，调用方拼 `/tasks/{task-id}`。 | 建议: 把 Contract 2 返回值改名并定义为 `task_tracking_root`；调用方统一拼接 `${task_tracking_root}/tasks/${task_id}/...`。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:78 | 问题: repeat: data-contracts 仍保留第三层 fallback `~/Knowledge/workflowhub/`，与 spec/tasks 的“两者缺失 fail-loud、不使用硬编码路径”冲突。实际后果是环境配置缺失会被旧路径掩盖，产物可能写到错误位置。 | 建议: 删除硬编码 fallback；路径解析优先级只能是 `WORKFLOWHUB_TASK_DIR` -> `config/workflowhub.yaml task_dir` -> fail-loud。
- [blocking] 位置: specs/worktree-unification/tasks.md:37 | 问题: repeat: T007 仍计划新增 `specs/worktree-unification/checklists/acceptance.md`，但 spec.md:228 和 tasks.md:35 同时要求 `specs/{task-id}/` 只允许 spec.md、plan.md、tasks.md。执行 T007 会直接让 T006/FR-WORKTREE-SCOPE-009 失败。 | 建议: 推荐把 acceptance checklist 改到 `{{task_tracking_root}}/tasks/{task-id}/checklists/acceptance.md`；若要放 repo 内，必须同步扩展 spec/plan/tasks 的白名单。
- [blocking] 位置: specs/worktree-unification/spec.md:228 | 问题: spec 自身的 repo 内白名单与实际 handoff/现有产物冲突。此行说 `specs/{task-id}/` 只允许 spec.md、plan.md、tasks.md，但 spec.md:519-521 又把 `checklists/requirements.md`、`constitution-check.md`、`baseline-report.md` 列为下游必读；当前目录也已有这些文件和 stage-result.json。实际后果是边界核查会永久红或被迫假绿。 | 建议: 重新定义 repo 内允许的交付物白名单，或把所有非 spec/plan/tasks 的过程/检查产物迁到 `{{task_tracking_root}}/tasks/{task-id}/`，并同步 handoff required_reads。
- [blocking] 位置: specs/worktree-unification/tasks.md:33 | 问题: repeat: FR-WORKTREE-SCOPE-008 要覆盖 build-spec 和 build-plan，但 T005 只核查 `workflows/build-spec/SKILL.md`。build-plan 的 worktree.json 读取、禁止创建 worktree、缺失 fail-loud 没有任务落点，路径连续性无法验证。 | 建议: 扩展 T005 或新增 T005b，明确覆盖 `workflows/build-plan/SKILL.md`，并同步 Dependency Graph、Verification Mapping、Scope Boundary。
- [blocking] 位置: specs/worktree-unification/plan.md:74 | 问题: repeat: Forbidden files 与执行步骤冲突。plan.md:74-76 把 build-spec/build-plan 标为不可触碰或本 stage 禁止修改，但 plan.md:215-217 和 plan.md:256 又允许“如缺失则最小补充”。实际后果是执行者无法判断 build-spec/build-plan 到底能不能改。 | 建议: 二选一写死：若只读核查，删除“缺失则补充”，缺口转 finding/follow-up；若允许最小修改，从 Forbidden files 移出并写清可改范围。
- [blocking] 位置: specs/worktree-unification/plan.md:319 | 问题: repeat: Constitution Check 仍使用旧宪法语义。plan 把 F8 写成“新功能先有 research”，但当前 constitution-checklist.md 的 F8 是“简单优先”；F5、S7、S8 等条目也错位。实际后果是宪法检查假绿，违反 AGENTS.md 要求的逐条对照。 | 建议: 按当前 CONSTITUTION.md / constitution-checklist.md 的 21 条重写 Constitution Check，删除旧 F8 `[ ]` 后再“修正 [x]”的补丁式段落。
- [blocking] 位置: specs/worktree-unification/tasks.md:13 | 问题: repeat: parser 行为变更仍没有可执行测试任务或真实验证命令。plan.md:21 声称有 Node.js 单元测试，plan.md:139-145 列了边界，但 T001 只改实现。现有 `core/__tests__/task-dir-parser.test.mjs` 仍断言旧 fallback。实际后果是 env 优先、yaml fallback、双缺失 fail-loud、相对路径、`~`、不存在、非目录等关键行为只能靠人工阅读，无法客观验收。 | 建议: 新增任务更新 `core/__tests__/task-dir-parser.test.mjs`，覆盖全部边界，并写明真实测试命令，例如 `npx vitest run core/__tests__/task-dir-parser.test.mjs` 或项目等价命令。
- [blocking] 位置: specs/worktree-unification/spec.md:152 | 问题: repeat: FR-WORKTREE-COMMIT-004 要求每个 stage/phase 有 commit 或 no-change 记录，但 tasks.md 只覆盖 make-decision R7，未覆盖 build-code 每 phase commit，也未覆盖 build-spec/build-plan/verify-code 的 commit/no-change 核查。实际后果是核心追溯要求可以被实现阶段跳过。 | 建议: 新增任务：build-code 每个 phase 产生变更时提交 `workflowhub(build-code/<phase-name>): ...`；全 stage 验证 commit/no-change 记录；同步 Verification Mapping。
- [blocking] 位置: specs/worktree-unification/plan.md:189 | 问题: repeat: 3rd-review 是 merge 前关键门控，但 plan/tasks 仍只写“3rd-review 独立审查”，没有定义真实可调用入口、输入、输出 schema、超时/不可达处理和证据文件命名。当前 verify-code/SKILL.md 仍有 `bash /path/to/3rd-review/standalone.sh` 占位命令。实际后果是 close 流程不可执行，agent 可能沿用占位命令或口头 verdict。 | 建议: 在 T004/plan 中定义唯一 runner 或发现规则、输入文件列表、输出 verdict schema、evidence 目录/文件命名、失败/超时语义；若真实 runner 不存在则 fail-loud/escalate，不得保留 `/path/to/...` 占位。
- [blocking] 位置: specs/worktree-unification/spec.md:203 | 问题: stage-result 文件名契约与现有 verify-code workflow 冲突。spec 要求 `stage-result.json`，tasks.md 也泛称 stage-result 落盘，但现有 workflows/verify-code/SKILL.md 写 `stage-result-verify-code.json`。实际后果是下游可能读错文件或生成两份结果记录。 | 建议: 选择唯一文件名。推荐保留现有 `stage-result-verify-code.json`，除非本计划同时覆盖所有 reader/writer 的迁移；选定后同步 spec、plan、tasks、verify-code facts assembly。
- [important] 位置: specs/worktree-unification/spec.md:180 | 问题: close 8 步序列写死 `main` 和 `origin`，但未声明 default branch/remote 探测、主 checkout clean/up-to-date 校验、远端任务分支精确检测。实际后果是非 main 默认分支、远端落后、本地脏状态或同名引用场景下可能误推或误删。 | 建议: 补充 close 前置校验：default branch/remote 来源、`target_repo_root` clean、主分支与远端关系；远端任务分支检测使用 fully-qualified ref，如 `refs/heads/workflowhub/{task-id}`。
- [important] 位置: specs/worktree-unification/spec.md:207 | 问题: close 中途失败只定义 stop/escalate，不定义失败记录固定落点和重入规则。若 merge/push 后、status=cleaned 前失败，下一次读取仍可能看到 status=active，状态与真实 git 世界不一致。 | 建议: 不必实现完整 partial-close 状态机，但至少定义失败步骤记录的固定落点和重入规则：再次 close 前必须读取失败记录并人工确认，禁止从头盲跑。
- [important] 位置: specs/worktree-unification/data-contracts.md:15 | 问题: Contract 1 consumer side 只列 build-code 和 verify-code，漏掉 spec.md:211-217 要求读取 worktree.json 的 build-spec/build-plan。实际后果是契约追踪会让执行者只更新后两段，遗漏前两段路径读取约束。 | 建议: 把 `build-spec`、`build-plan` 加入 Contract 1 consumer side，并标明二者只读 `target_repo_root` / `worktree_root`、缺失时 fail-loud。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：repeat: worktree.json 契约路径仍与权威 spec 冲突。data-contracts 写的是 `{worktree_root}/worktree.json`，但 spec.md 要求 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`。按当前契约执行会把跨 stage 状态写进目标 worktree，继续复现跨 stage 断链。
- 必须修复：repeat: task_dir 返回值语义仍是旧模型。data-contracts 写成 parser 返回 `task_dir` 并供调用方拼 `{task_dir}/{task-id}/`，但 spec.md:55 和 spec.md:140 要求 parser 返回 task_tracking_root，调用方拼 `/tasks/{task-id}`。
- 必须修复：repeat: data-contracts 仍保留第三层 fallback `~/Knowledge/workflowhub/`，与 spec/tasks 的“两者缺失 fail-loud、不使用硬编码路径”冲突。实际后果是环境配置缺失会被旧路径掩盖，产物可能写到错误位置。
- 必须修复：repeat: T007 仍计划新增 `specs/worktree-unification/checklists/acceptance.md`，但 spec.md:228 和 tasks.md:35 同时要求 `specs/{task-id}/` 只允许 spec.md、plan.md、tasks.md。执行 T007 会直接让 T006/FR-WORKTREE-SCOPE-009 失败。
- 必须修复：spec 自身的 repo 内白名单与实际 handoff/现有产物冲突。此行说 `specs/{task-id}/` 只允许 spec.md、plan.md、tasks.md，但 spec.md:519-521 又把 `checklists/requirements.md`、`constitution-check.md`、`baseline-report.md` 列为下游必读；当前目录也已有这些文件和 stage-result.json。实际后果是边界核查会永久红或被迫假绿。
- 必须修复：repeat: FR-WORKTREE-SCOPE-008 要覆盖 build-spec 和 build-plan，但 T005 只核查 `workflows/build-spec/SKILL.md`。build-plan 的 worktree.json 读取、禁止创建 worktree、缺失 fail-loud 没有任务落点，路径连续性无法验证。
- 必须修复：repeat: Forbidden files 与执行步骤冲突。plan.md:74-76 把 build-spec/build-plan 标为不可触碰或本 stage 禁止修改，但 plan.md:215-217 和 plan.md:256 又允许“如缺失则最小补充”。实际后果是执行者无法判断 build-spec/build-plan 到底能不能改。
- 必须修复：repeat: Constitution Check 仍使用旧宪法语义。plan 把 F8 写成“新功能先有 research”，但当前 constitution-checklist.md 的 F8 是“简单优先”；F5、S7、S8 等条目也错位。实际后果是宪法检查假绿，违反 AGENTS.md 要求的逐条对照。
- 必须修复：repeat: parser 行为变更仍没有可执行测试任务或真实验证命令。plan.md:21 声称有 Node.js 单元测试，plan.md:139-145 列了边界，但 T001 只改实现。现有 `core/__tests__/task-dir-parser.test.mjs` 仍断言旧 fallback。实际后果是 env 优先、yaml fallback、双缺失 fail-loud、相对路径、`~`、不存在、非目录等关键行为只能靠人工阅读，无法客观验收。
- 必须修复：repeat: FR-WORKTREE-COMMIT-004 要求每个 stage/phase 有 commit 或 no-change 记录，但 tasks.md 只覆盖 make-decision R7，未覆盖 build-code 每 phase commit，也未覆盖 build-spec/build-plan/verify-code 的 commit/no-change 核查。实际后果是核心追溯要求可以被实现阶段跳过。
- 必须修复：repeat: 3rd-review 是 merge 前关键门控，但 plan/tasks 仍只写“3rd-review 独立审查”，没有定义真实可调用入口、输入、输出 schema、超时/不可达处理和证据文件命名。当前 verify-code/SKILL.md 仍有 `bash /path/to/3rd-review/standalone.sh` 占位命令。实际后果是 close 流程不可执行，agent 可能沿用占位命令或口头 verdict。
- 必须修复：stage-result 文件名契约与现有 verify-code workflow 冲突。spec 要求 `stage-result.json`，tasks.md 也泛称 stage-result 落盘，但现有 workflows/verify-code/SKILL.md 写 `stage-result-verify-code.json`。实际后果是下游可能读错文件或生成两份结果记录。

