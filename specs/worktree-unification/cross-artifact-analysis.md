# Cross-Artifact Analysis — worktree-unification
<!-- round-9 / 2026-07-05 -->

## 本轮（round-9）审查结论

本轮发现 9 条问题（5 blocking + 4 important），全部已修复。

---

## Blocking Findings（5 条）

### B9 — plan.md build-spec editable 边界矛盾（残留）
- **原文**：plan.md Step 3.1 和 Scope Boundary 含"若 build-spec/SKILL.md 缺失则最小补充（单行）"
- **问题**：与 Forbidden files 章节直接矛盾，执行者无法判断能否改 build-spec
- **修复**：Step 3.1 改为"仅只读核查，禁止任何修改"；Scope Boundary 中"最小补充"改为"禁止任何修改"
- **证据**：`specs/worktree-unification/plan.md`（已修复）

### B10 — tasks.md T001 gate_cmd pipe 吞 exit-code
- **原文**：两者缺失 fail-loud gate 用 `... | grep -q "."` 判断，pipe 丢弃 node 真实 exit code
- **问题**：node exit 非零但 grep 找到输出则整体 exit 0，gate 永远通过
- **修复**：保存子进程 exit code 后 `test $_rc -ne 0`，不走管道
- **证据**：`specs/worktree-unification/tasks.md:17`（已修复）

### B11 — tasks.md T003 gate_cmd exit-code 约定反向
- **原文**：`grep -q ... — exit 1（无匹配即通过）`
- **问题**：gate_cmd 约定 exit 0 = pass，exit 1 会被 runner 判为失败
- **修复**：改为 `! grep -q ... && echo PASS || (echo FAIL; exit 1)` — exit 0
- **证据**：`specs/worktree-unification/tasks.md:39`（已修复）

### B12 — tasks.md T005 gate_cmd worktree-count 仅展示不比较
- **原文**：`git worktree list | wc -l` 注释说前后相同，无比较逻辑
- **问题**：gate 永远 exit 0，无法检测 worktree 泄漏
- **修复**：`_before`/`_after` 变量比较，不等则 exit 1
- **证据**：`specs/worktree-unification/tasks.md:63`（已修复）

### B13 — stage-result.json 已被 git 跟踪（运行时产物不应入库）
- **原文**：`specs/worktree-unification/stage-result.json` 已在 git index
- **问题**：违反 FR-WORKTREE-SCOPE-009；运行时产物应存于仓库外 task_tracking_root
- **修复**：`git rm --cached`；.gitignore 新增 `stage-result.json`、`journal.jsonl`、`task-metrics.jsonl`
- **证据**：`.gitignore`（已修复）

---

## Important（4 条）

### I2 — plan.md 两处 stale cross-reference（spec §7 → spec §5）
- plan.md:172 和 plan.md:265 引用"spec §7 验收标准 1-9"，但 spec §7 为 Out of Scope，验收标准在 §5 AC-01..AC-04
- 修复：改为"spec §5 AC-01..AC-04 + §8 scenarios"

### I3 — data-contracts.md Consumer side 循环依赖表述
- "consumer 通过 worktree_root 字段定位文件"——worktree_root 在文件内部，循环逻辑
- 修复：改为"通过已知 task_tracking_root 拼接路径"，worktree_root 是读取后内部使用字段

### I4 — tasks.md 缺少 FR-WORKTREE-COMMIT-004 per-phase commit 覆盖（T008 缺失）
- tasks.md 仅 T002 R7 提及 commit 规则；build-code per-phase 及其他 stage 无覆盖
- 修复：新增 T008（只读核查 + gate_cmd + 结论写 stage-result）；更新依赖图

### I5 — tasks.md T002 缺少 yaml 路径归一化 gate（双拼接风险）
- 现有 yaml config 值可能以 `/tasks/` 结尾，不归一化则产生 `/tasks/tasks/{id}`
- 修复：T002 新增 normalization gate 两条（归一化函数验证 + 结果不以 /tasks 结尾）

---

## 修复汇总

| 编号 | 文件 | 状态 |
|------|------|------|
| B9  | plan.md | 已修复 |
| B10 | tasks.md T001 gate_cmd | 已修复 |
| B11 | tasks.md T003 gate_cmd | 已修复 |
| B12 | tasks.md T005 gate_cmd | 已修复 |
| B13 | stage-result.json + .gitignore | 已修复 |
| I2  | plan.md cross-reference | 已修复 |
| I3  | data-contracts.md consumer-side | 已修复 |
| I4  | tasks.md T008 新增 | 已修复 |
| I5  | tasks.md T002 normalization gate | 已修复 |

blocking 5 条全部已修复；important 4 条全部已修复。
