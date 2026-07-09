# 审查报告 — worktree-unification-build-plan-r9b-20260705T040949Z-05cd9e (round 5)

- verdict: revise_required
- provenance: single-context

## Summary

Round-7/8 的 data-contracts 路径、硬编码 fallback、build-spec 只读边界、stage-result 入库问题基本关闭；本轮仍有新的执行阻断：COMMIT-004 被降级成只读审计、normalization gate 不可稳定执行、task-id 归一化未落任务、T001 仍有假绿风险。required skills 已按 SKILL.md fallback 口径做只读检查：speckit-analyze 覆盖 spec/plan/tasks/data-contracts 一致性，plan-eng-review 覆盖依赖与可执行性，review 覆盖 gate/diff/scope 漂移。

## Findings

- [blocking] 位置: specs/worktree-unification/tasks.md:85 | 问题: FR-WORKTREE-COMMIT-004 仍未形成可执行实现链。T008 只做只读核查，并声明缺失项列为 follow-up、本任务不修改 SKILL.md；但 spec 要求 build-code 每个 phase 完成后必须 commit 或记录 no-change，且这是本任务 IN scope。按当前计划执行，build-code per-phase commit 规则可能仍不存在，审查却只能记录 follow-up，导致阶段产物未提交、跨 stage 读取到旧产物或无法追溯。 | 建议: 把 FR-WORKTREE-COMMIT-004 拆成实现任务，而不是只读审计：在 build-code/SKILL.md 中明确加入 per-phase commit/no-change 规则；在 build-spec/build-plan/verify-code 对应规则已有则锚定，缺失则在允许范围内补任务或明确调整 scope；T008 只保留最终验证，不得把必需实现降级为 follow-up。
- [blocking] 位置: specs/worktree-unification/tasks.md:37 | 问题: T002 normalization gate 不是稳定可执行命令。命令使用 require('./core/task-dir-parser.mjs') 加载 .mjs，和 T001 已改成 node --input-type=module 的方式不一致；同时 normalizeTaskTrackingRoot 是否导出被写成“如无独立 normalize 导出函数，则...”的条件式口径。gate_cmd 必须是确定、可运行、exit 0=pass 的机器门控，不能依赖实现时再决定。 | 建议: 把两条 normalization gate 改为自包含 ESM 命令：使用 node --input-type=module + import；要么在 T001 明确要求导出 normalizeTaskTrackingRoot 并验证该导出，要么删除该导出假设，改为通过临时 WORKFLOWHUB_TASK_DIR/yaml fixture 调 parseTaskDir 验证裁剪结果。
- [blocking] 位置: specs/worktree-unification/tasks.md:38 | 问题: T002 第二条 normalization gate 注释说“env var 指向一个存在的目录”，但命令没有设置 WORKFLOWHUB_TASK_DIR，也没有创建临时目录，实际会依赖本地 yaml/config 状态。按当前计划执行，可能验证的是开发者机器配置，不是 /tasks 后缀归一化要求，无法证明不会产生 /tasks/tasks/{id}。 | 建议: 让 gate 自包含：mktemp 创建带 tasks 后缀的目录场景，显式设置 WORKFLOWHUB_TASK_DIR 或写入临时 config/workflowhub.yaml，然后断言 parseTaskDir() 返回不以 /tasks 结尾且不会双拼接。
- [blocking] 位置: specs/worktree-unification/tasks.md:30 | 问题: task-id 归一化实现没有落到任务。spec 和 data-contracts.md 要求 make-decision 对输入执行两步处理：转小写、替换非字母数字、合并连字符、去首尾，再用 ^[a-z]+(-[a-z]+){1,2}$ 校验；T002 只写了分支命名和 task-id 匹配正则，没有要求实现归一化转换。按当前计划执行，`Worktree Unification` 这类 spec 场景可能被直接拒绝或未统一处理。 | 建议: 在 T002 明确加入 Contract 3 / spec §8 task-id 场景的实现要求：make-decision 必须先归一化再校验；补 gate_cmd 覆盖 `Worktree Unification` -> `worktree-unification` 成功、`My_Feature123` 归一化后因数字词段 fail-loud。
- [blocking] 位置: specs/worktree-unification/tasks.md:17 | 问题: T001 的“两者缺失 fail-loud”错误消息 gate 仍通过管道把 node 退出码交给 grep 判定。虽然下一条单独检查非零退出，但本条文字声称验证“进程以非零退出且 stderr 含明确错误信息”，实际只验证输出匹配；如果 parseTaskDir 错误地成功但输出匹配文本，本条仍可通过。plan-review contract 要求 gate_cmd 不制造假绿。 | 建议: 合并为一个 Node/shell 断言：捕获 stdout/stderr 和 exit code，先断言 exit code 非零，再断言 stderr 含明确错误；或使用 set -o pipefail 并显式检查 wait status，不要让 grep 单独决定 pass。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：FR-WORKTREE-COMMIT-004 仍未形成可执行实现链。T008 只做只读核查，并声明缺失项列为 follow-up、本任务不修改 SKILL.md；但 spec 要求 build-code 每个 phase 完成后必须 commit 或记录 no-change，且这是本任务 IN scope。按当前计划执行，build-code per-phase commit 规则可能仍不存在，审查却只能记录 follow-up，导致阶段产物未提交、跨 stage 读取到旧产物或无法追溯。
- 必须修复：T002 normalization gate 不是稳定可执行命令。命令使用 require('./core/task-dir-parser.mjs') 加载 .mjs，和 T001 已改成 node --input-type=module 的方式不一致；同时 normalizeTaskTrackingRoot 是否导出被写成“如无独立 normalize 导出函数，则...”的条件式口径。gate_cmd 必须是确定、可运行、exit 0=pass 的机器门控，不能依赖实现时再决定。
- 必须修复：T002 第二条 normalization gate 注释说“env var 指向一个存在的目录”，但命令没有设置 WORKFLOWHUB_TASK_DIR，也没有创建临时目录，实际会依赖本地 yaml/config 状态。按当前计划执行，可能验证的是开发者机器配置，不是 /tasks 后缀归一化要求，无法证明不会产生 /tasks/tasks/{id}。
- 必须修复：task-id 归一化实现没有落到任务。spec 和 data-contracts.md 要求 make-decision 对输入执行两步处理：转小写、替换非字母数字、合并连字符、去首尾，再用 ^[a-z]+(-[a-z]+){1,2}$ 校验；T002 只写了分支命名和 task-id 匹配正则，没有要求实现归一化转换。按当前计划执行，`Worktree Unification` 这类 spec 场景可能被直接拒绝或未统一处理。
- 必须修复：T001 的“两者缺失 fail-loud”错误消息 gate 仍通过管道把 node 退出码交给 grep 判定。虽然下一条单独检查非零退出，但本条文字声称验证“进程以非零退出且 stderr 含明确错误信息”，实际只验证输出匹配；如果 parseTaskDir 错误地成功但输出匹配文本，本条仍可通过。plan-review contract 要求 gate_cmd 不制造假绿。

