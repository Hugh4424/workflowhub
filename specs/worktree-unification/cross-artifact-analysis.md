# Cross-Artifact Analysis — worktree-unification
<!-- round-8 / 2026-07-05 -->

## 本轮（round-6/8）审查结论

本轮发现 6 条 blocking 问题，全部已修复。

---

## Blocking Findings（6 条）

### B3 — data-contracts.md:16 worktree.json 文件路径错误
- **原文**：File path 写为 `{worktree_root}/worktree.json`（worktree 根路径下）
- **问题**：与 FR-WORKTREE-CONTRACT-001 不一致；所有 consumer 应通过 `task_tracking_root` 定位，不通过 worktree 本身路径
- **修复**：改为 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`；Consumer side 补充"所有 consumer 通过 `worktree_root` 字段定位文件"说明
- **证据**：`specs/worktree-unification/data-contracts.md:16`（已修复）

### B4 — data-contracts.md:71 Contract 2 返回值描述不准确
- **原文**：返回值描述为"task_dir 绝对路径，供调用方拼接 `{task_dir}/{task-id}/`"
- **问题**：命名不一致（task_dir vs task_tracking_root），且拼接格式与 FR-WORKTREE-ENVVAR-003 不符
- **修复**：改为"`task_tracking_root` 绝对路径（不含 `/tasks/{task-id}` 段）；所有 consumer 拼接完整路径时统一写 `{{task_tracking_root}}/tasks/{task-id}/...`"
- **证据**：`specs/worktree-unification/data-contracts.md:71`（已修复）

### B5 — data-contracts.md:78 保留旧硬编码 fallback `~/Knowledge/workflowhub/`
- **原文**：fallback 第 3 条为 `~/Knowledge/workflowhub/`
- **问题**：与 FR-WORKTREE-ENVVAR-003、tasks.md T001 明确要求的"两者缺失 fail-loud"直接矛盾
- **修复**：第 3 条改为"两者均缺失 → fail-loud（明确错误信息，exit 非零，无 fallback）"；增加删除旧硬编码说明
- **证据**：`specs/worktree-unification/data-contracts.md:78`（已修复）

### B6 — tasks.md T001 gate_cmd 不可执行（路径不存在、竞态）
- **原文**：gate_cmd 直接用 `/tmp/testdir`（不保证存在）、`WORKFLOWHUB_TASK_DIR=`（空字符串，yaml fallback 依赖 cwd 不确定）、grep 语义反向
- **问题**：env var 测试路径不存在会 fail-loud 触发 path-not-found 门控，yaml fallback 测试 cwd 不确定，grep 负向逻辑写反
- **修复**：全部改为带 mktemp -d / mktemp 隔离、正确退出码语义的可执行命令；grep 负向改为 `! grep -q`
- **证据**：`specs/worktree-unification/tasks.md:13-26`（已修复）

### B7 — tasks.md T006 gate_cmd 含不可执行的 `{task-id}` 字面占位符
- **原文**：shell 命令中用 `${WORKFLOWHUB_TASK_DIR}/tasks/{task-id}/stage-result.json`、`specs/{task-id}/`
- **问题**：`{task-id}` 是字面字符串，shell 不展开，命令直接失败
- **修复**：所有 gate_cmd shell 命令中的 `{task-id}` 替换为具体任务名 `worktree-unification`；描述文本中的语义模板保持不变
- **证据**：`specs/worktree-unification/tasks.md:66`（已修复）

### B8 — plan.md Forbidden files 与 tasks.md T005 矛盾
- **原文**：plan.md 将 `build-spec/SKILL.md` 列为禁止触碰，但 tasks.md T005 同时允许"补充最小必要条文（一行）"
- **问题**：同一文件在同一 spec 两处描述相互矛盾，执行方无法判断是否可写
- **修复**：plan.md:75 改为"仅只读核查，禁止任何修改"；tasks.md T005 删除"补充最小必要条文"许可，改为纯核查并记录结论；commit gate 改为无需 commit
- **证据**：`specs/worktree-unification/plan.md:75`、`specs/worktree-unification/tasks.md:57-68`（已修复）

---

## Important（非 blocking）

### I1 — tasks.md T005 grep 反向逻辑（已在同批修复）
- T005 gate_cmd 原写 `grep -q "git worktree add" ... — exit 1`，注释说"无匹配即通过"，但 exit 1 是 grep 无匹配的返回值，逻辑歧义
- 修复：改为 `! grep -q ...` — exit 0（无匹配即通过，语义明确）
- 证据：`specs/worktree-unification/tasks.md:60-61`（已修复）

---

## 修复汇总

| 编号 | 文件 | 行号 | 状态 |
|------|------|------|------|
| B3 | data-contracts.md | 16 | 已修复 |
| B4 | data-contracts.md | 71 | 已修复 |
| B5 | data-contracts.md | 78 | 已修复 |
| B6 | tasks.md | 13-26 | 已修复 |
| B7 | tasks.md | 66 | 已修复 |
| B8 | plan.md / tasks.md | 75 / 57-68 | 已修复 |
| I1 | tasks.md | 60-61 | 已修复 |

blocking 总计：6 条，全部已修复。important 总计：1 条，已修复。
