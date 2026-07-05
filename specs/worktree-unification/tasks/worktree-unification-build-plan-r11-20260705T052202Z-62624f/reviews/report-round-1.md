# 审查报告 — worktree-unification-build-plan-r11-20260705T052202Z-62624f (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

Round-10 的 F3、T001 单元测试、T006 依赖冲突基本闭合；但 T005 行为验证、T008 commit 矩阵、T008/T005 依赖、T002 归一化可验证性仍不够可执行，需修订。

## Findings

- [blocking] 位置: specs/worktree-unification/tasks.md:79 | 问题: T005 声称验证 build-spec 缺失 target_repo_root/worktree_root 时 fail-loud，但 gate_cmd 只 grep 文档中是否出现 target_repo_root。它没有调用 build-spec 的读取路径，也没有断言缺失字段时非零退出。执行后可能文档文字存在但真实 stage 仍静默走错路径。 | 建议: 把 T005 的 build-spec/build-plan fail-loud gate 改成可执行验证：构造缺字段 worktree.json，按对应 SKILL.md 的实际入口或最小读取命令运行，断言 exit code 非零且错误包含缺失字段/路径。不能用 grep 文档替代行为验证。
- [blocking] 位置: specs/worktree-unification/tasks.md:98 | 问题: T008 仍未完整覆盖 FR-WORKTREE-COMMIT-004 的 commit 矩阵。spec.md 矩阵包含 make-decision 行和 close 子步骤固定 message `workflowhub(close): archive {task-id}`，但 T008 覆盖列表缺 make-decision，且 close gate 只查“归档 commit/commit_sha”，没有验证固定 close message。 | 建议: T008 按 spec.md commit 覆盖矩阵逐行列 gate：make-decision、build-spec、build-plan、build-code phase、verify-code、verify-code close。close 必须验证 `workflowhub(close): archive {task-id}`，不是 `workflowhub(verify-code)` 或泛 grep。
- [blocking] 位置: specs/worktree-unification/tasks.md:104 | 问题: T008 标注 depends:T005，但依赖图又写 T008 `[P with T005, T006]`。T008 读取 build-spec/build-plan 的 commit/fail-loud 规则，T005 又可能最小修改这两个文件；并行会导致 T008 在 T005 修改前读取旧内容，产生假失败或假通过。 | 建议: 移除 T008 与 T005 的并行关系，并在依赖图中明确 T008 串行依赖 T005；或拆分 T008 中不依赖 T005 的部分，依赖 build-spec/build-plan 规则的部分必须在 T005 后执行。
- [blocking] 位置: specs/worktree-unification/tasks.md:39 | 问题: T002 的 task-id 归一化 gate 只 grep 是否出现“归一化/normalize/小写”等词和顺序，没有验证 spec 要求的实际转换链。`Worktree Unification -> worktree-unification` 场景仍可能只写文案、不实现转换，gate 仍通过。 | 建议: 增加可执行或至少精确文本 gate：必须覆盖小写、非字母数字替换连字符、合并连续连字符、去首尾连字符，并加入 `Worktree Unification` 归一化为 `worktree-unification` 后再校验正则的验证。
- [important] 位置: specs/worktree-unification/tasks.md:134 | 问题: Dependency Graph 末尾仍写“T005 只读 build-spec，禁止任何修改”，与 line 70 的“核查并按需最小修改 build-spec/build-plan”冲突。 | 建议: 同步更新该 Knowledge 说明：T005 必须先读 build-spec 和 build-plan，若缺字段读取/fail-loud 逻辑则仅允许最小补充；不要再写“禁止任何修改”。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：T005 声称验证 build-spec 缺失 target_repo_root/worktree_root 时 fail-loud，但 gate_cmd 只 grep 文档中是否出现 target_repo_root。它没有调用 build-spec 的读取路径，也没有断言缺失字段时非零退出。执行后可能文档文字存在但真实 stage 仍静默走错路径。
- 必须修复：T008 仍未完整覆盖 FR-WORKTREE-COMMIT-004 的 commit 矩阵。spec.md 矩阵包含 make-decision 行和 close 子步骤固定 message `workflowhub(close): archive {task-id}`，但 T008 覆盖列表缺 make-decision，且 close gate 只查“归档 commit/commit_sha”，没有验证固定 close message。
- 必须修复：T008 标注 depends:T005，但依赖图又写 T008 `[P with T005, T006]`。T008 读取 build-spec/build-plan 的 commit/fail-loud 规则，T005 又可能最小修改这两个文件；并行会导致 T008 在 T005 修改前读取旧内容，产生假失败或假通过。
- 必须修复：T002 的 task-id 归一化 gate 只 grep 是否出现“归一化/normalize/小写”等词和顺序，没有验证 spec 要求的实际转换链。`Worktree Unification -> worktree-unification` 场景仍可能只写文案、不实现转换，gate 仍通过。

