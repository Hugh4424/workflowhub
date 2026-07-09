# 审查报告 — worktree-unification-build-plan-r7-20260705T030033Z-cf9b01 (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

已按要求读取 reviewer contract，并通过 skill-file fallback + 独立子代理执行 speckit-analyze、plan-eng-review、review 三个只读 lens。Round 6 的 B4、B5 主体已关闭，B7 的 shell 字面 `{task-id}` 问题基本关闭；但 B3 仍有 consumer 定位残留，B6 仍存在不可执行/假绿 gate，B8 在 plan.md 后半段仍未关闭。另发现当前 repo 内存在 forbidden `specs/worktree-unification/stage-result.json`，T006 现有 gate 无法发现它。因此本轮不能 pass。

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:15 | 问题: B3 未完全关闭。Contract 1 已把 File path 改成 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`，但 Consumer side 仍写“所有 consumer 通过 `worktree_root` 字段定位文件”。这是循环定位：consumer 必须先读到 worktree.json 才能知道 `worktree_root`，不能用 `worktree_root` 定位 worktree.json 本身。 | 建议: 改为：各 stage 先通过 `core/task-dir-parser.mjs` 得到 `task_tracking_root`，再读取 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`；读取后才使用 `target_repo_root` / `worktree_root`。同时明确 build-spec、build-plan、build-code、verify-code 都是只读 consumer，verify-code close 仅可更新 status。
- [blocking] 位置: specs/worktree-unification/plan.md:215 | 问题: B8 未关闭。plan.md 前文把 `workflows/build-spec/SKILL.md` 标为“仅只读核查，禁止任何修改”，但 Phase 3.1 仍允许“若 build-spec/SKILL.md 缺失该读取逻辑，补充最小必要条文（一行）”。同一计划仍同时允许和禁止修改 build-spec。 | 建议: 全篇统一为只读核查：删除 plan.md:215、217、256 中所有“补充最小必要条文 / 缺失时最小补充”许可；缺失逻辑只记录到 stage-result / journal，另开任务处理。
- [blocking] 位置: specs/worktree-unification/tasks.md:15 | 问题: B6 未关闭。T001 的 parser gate_cmd 使用 `require('./core/task-dir-parser.mjs').then(...)`，但 `core/task-dir-parser.mjs` 是 ESM 且 `parseTaskDir` 为同步导出。实跑会报 `TypeError: require(...).then is not a function`，失败点不是 parser 行为。该命令还用 `startsWith`，无法证明 parser 没有错误拼接 `/tasks/{task-id}`。 | 建议: 改为真实 ESM 调用，例如 `node --input-type=module -e "import { parseTaskDir } from './core/task-dir-parser.mjs'; const r=parseTaskDir(); ..."`；env var 用例必须断言 `r === process.env.WORKFLOWHUB_TASK_DIR`，不能用 `startsWith`。
- [blocking] 位置: specs/worktree-unification/tasks.md:17 | 问题: B6 未关闭。T001 “两者缺失 fail-loud” gate 可以假绿：命令先 `cd` 到临时非 git 目录，再执行 `git rev-parse --show-toplevel`，stderr 只要有任意文本就会被 `grep -q "."` 接受，最后 `test $_rc -eq 0` 通过。它没有证明 parser 进入 env/yaml 双缺失分支，也没有断言 parser 的明确错误。 | 建议: 进入临时目录前先保存 `REPO_ROOT=$(git rev-parse --show-toplevel)`；用 ESM import 调 parser；分别捕获 node exit code 和 stderr；要求 node exit code 非零，stderr 包含明确的 missing `WORKFLOWHUB_TASK_DIR` / `task_dir` 错误文本。
- [blocking] 位置: specs/worktree-unification/tasks.md:21 | 问题: commit gate 不可控且与 spec 冲突。T001 使用 `git log --oneline | head -1 | grep -q "workflowhub(task-dir-parser)"`，只检查最新 HEAD commit，不能证明相关 stage 在本轮变更后已提交；同时 `workflowhub(task-dir-parser)` 不在 spec.md 定义的 stage/phase commit 标识符枚举内。 | 建议: 每个 stage gate 拆成两条可执行分支：有 repo diff 时，在明确提交范围内查找符合 spec 的 `workflowhub(<stage>):` 或 `workflowhub(<stage>/<phase-name>):`；无 repo diff 时，用 jq/grep 验证 stage-result 或 journal 中存在 no-change reason。不要用 `git log --oneline | head -1` 作为 gate。
- [blocking] 位置: specs/worktree-unification/tasks.md:39 | 问题: T003 仍保留反向 grep 的假 gate：`grep -q ...` 并标注 `exit 1（无匹配即通过）`。多数 gate runner 以 exit 0 表示通过，该写法会让正确状态返回非零，无法作为机器通过门控。 | 建议: 改成 exit 0 表示通过的形式，例如 `! grep -Eq '自动创建 worktree|auto.*create.*worktree|worktree add' workflows/build-code/SKILL.md`；如担心误伤“禁止 worktree add”的说明文字，应匹配更精确的旧 fallback 片段。
- [blocking] 位置: specs/worktree-unification/tasks.md:63 | 问题: T005 worktree 条目数检查仍是 display-only，不是 gate。`git worktree list | wc -l` 只打印当前数量，没有 before/after 捕获和比较逻辑，不能证明 build-spec/build-plan 阶段未新增 worktree。 | 建议: 改为可执行比较：阶段前把 `before=$(git worktree list --porcelain | grep -c '^worktree ')` 写到明确外置路径；阶段后读取并计算 `after`，再 `test "$before" -eq "$after"`。如果没有跨阶段保存点，就标为人工记录项，不要叫 gate_cmd。
- [blocking] 位置: specs/worktree-unification/tasks.md:66 | 问题: T006 禁止文件检查是假命令。它用 `git show HEAD -- specs/worktree-unification/ | grep ...` 查当前提交 diff header，既没有反转 grep exit code，也查不到已经存在于树里的 forbidden 文件。当前仓库已跟踪 `specs/worktree-unification/stage-result.json`，但该命令无输出并返回 grep 的 exit 1。 | 建议: 改为检查当前树和工作区事实，例如 `test ! -e specs/worktree-unification/stage-result.json && test ! -d specs/worktree-unification/evidence && test ! -e specs/worktree-unification/journal.jsonl && test ! -e specs/worktree-unification/task-metrics.jsonl`；若查 git，使用 `! git ls-files ... | grep -E ...` 或等价脚本显式返回 exit 0/1。
- [blocking] 位置: specs/worktree-unification/stage-result.json:1 | 问题: 边界冲突未关闭。repo 内顶层 `specs/worktree-unification/stage-result.json` 真实存在并被 git 跟踪，但 spec/tasks/plan 都要求 verify-code close 的 `stage-result.json` 存在于 task_tracking_root 仓库外，禁止放在 `specs/{task-id}/` 顶层。 | 建议: 从 `specs/worktree-unification/` 顶层移除该文件；若需要保留 build-spec 产物记录，放到 `{{task_tracking_root}}/tasks/worktree-unification/stage-result.json`，或放到已允许的子目录且不要与 close 权威文件混名。
- [blocking] 位置: specs/worktree-unification/tasks.md:68 | 问题: T007 顺序错误。它写明 acceptance checklist “供 verify-code 阶段使用”，但 depends 包含 T006；T006 又在验证 verify-code close 后的 stage-result/evidence。结果是 verify-code 需要的 acceptance.md 被安排在 verify-code/close 后才生成。 | 建议: 调整依赖顺序：T007 应在 verify-code 使用前完成，至少应在 T006 最终边界核查前完成。推荐顺序：T001 -> T002/T003/T004 静态规则 -> T005/T007 -> verify-code 使用 checklist -> T006 final boundary。
- [blocking] 位置: specs/worktree-unification/cross-artifact-analysis.md:6 | 问题: closure 文档不可信。cross-artifact-analysis.md 宣称“6 条 blocking 问题，全部已修复”，但当前 artifacts 仍有 B3 consumer 循环定位、B6 多个 fake gate、B8 build-spec 权限冲突，以及 repo 内 forbidden stage-result 实体。 | 建议: 重新生成 closure matrix：逐项标注 B3-B8 当前状态。B4/B5 可标 closed；B3 标 partial/residual consumer wording；B6 open；B7 shell 字面 `{task-id}` 可标 closed 但 T006 gate open；B8 open；并引用真实文件行号和命令 rc。
- [important] 位置: specs/worktree-unification/data-contracts.md:64 | 问题: B4 仍有残留命名漂移。Contract 2 Owner side 仍称 parser“解析并输出 task_dir 绝对路径”，但当前规范已把 parser 返回值定义为 `task_tracking_root`，不是 `task_dir`。 | 建议: 将 line 64 的“task_dir 绝对路径”改为“task_tracking_root 绝对路径”；全文只在解释历史兼容时使用 task_dir，契约返回值统一使用 `task_tracking_root`。
- [important] 位置: specs/worktree-unification/plan.md:172 | 问题: stale traceability 未清。plan.md 仍引用“spec §7 验收标准 1-9”，但 tasks.md 已明确 spec §7 是 Out of Scope，成功标准应来自 spec §5 AC-01..AC-04 和 spec §8 scenarios。 | 建议: 把 plan.md:172 和 plan.md:265 的 “spec §7 验收标准 1-9” 改为 “spec §5 AC-01..AC-04 + spec §8 Given/When/Then scenarios”。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：B3 未完全关闭。Contract 1 已把 File path 改成 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`，但 Consumer side 仍写“所有 consumer 通过 `worktree_root` 字段定位文件”。这是循环定位：consumer 必须先读到 worktree.json 才能知道 `worktree_root`，不能用 `worktree_root` 定位 worktree.json 本身。
- 必须修复：B8 未关闭。plan.md 前文把 `workflows/build-spec/SKILL.md` 标为“仅只读核查，禁止任何修改”，但 Phase 3.1 仍允许“若 build-spec/SKILL.md 缺失该读取逻辑，补充最小必要条文（一行）”。同一计划仍同时允许和禁止修改 build-spec。
- 必须修复：B6 未关闭。T001 的 parser gate_cmd 使用 `require('./core/task-dir-parser.mjs').then(...)`，但 `core/task-dir-parser.mjs` 是 ESM 且 `parseTaskDir` 为同步导出。实跑会报 `TypeError: require(...).then is not a function`，失败点不是 parser 行为。该命令还用 `startsWith`，无法证明 parser 没有错误拼接 `/tasks/{task-id}`。
- 必须修复：B6 未关闭。T001 “两者缺失 fail-loud” gate 可以假绿：命令先 `cd` 到临时非 git 目录，再执行 `git rev-parse --show-toplevel`，stderr 只要有任意文本就会被 `grep -q "."` 接受，最后 `test $_rc -eq 0` 通过。它没有证明 parser 进入 env/yaml 双缺失分支，也没有断言 parser 的明确错误。
- 必须修复：commit gate 不可控且与 spec 冲突。T001 使用 `git log --oneline | head -1 | grep -q "workflowhub(task-dir-parser)"`，只检查最新 HEAD commit，不能证明相关 stage 在本轮变更后已提交；同时 `workflowhub(task-dir-parser)` 不在 spec.md 定义的 stage/phase commit 标识符枚举内。
- 必须修复：T003 仍保留反向 grep 的假 gate：`grep -q ...` 并标注 `exit 1（无匹配即通过）`。多数 gate runner 以 exit 0 表示通过，该写法会让正确状态返回非零，无法作为机器通过门控。
- 必须修复：T005 worktree 条目数检查仍是 display-only，不是 gate。`git worktree list | wc -l` 只打印当前数量，没有 before/after 捕获和比较逻辑，不能证明 build-spec/build-plan 阶段未新增 worktree。
- 必须修复：T006 禁止文件检查是假命令。它用 `git show HEAD -- specs/worktree-unification/ | grep ...` 查当前提交 diff header，既没有反转 grep exit code，也查不到已经存在于树里的 forbidden 文件。当前仓库已跟踪 `specs/worktree-unification/stage-result.json`，但该命令无输出并返回 grep 的 exit 1。
- 必须修复：边界冲突未关闭。repo 内顶层 `specs/worktree-unification/stage-result.json` 真实存在并被 git 跟踪，但 spec/tasks/plan 都要求 verify-code close 的 `stage-result.json` 存在于 task_tracking_root 仓库外，禁止放在 `specs/{task-id}/` 顶层。
- 必须修复：T007 顺序错误。它写明 acceptance checklist “供 verify-code 阶段使用”，但 depends 包含 T006；T006 又在验证 verify-code close 后的 stage-result/evidence。结果是 verify-code 需要的 acceptance.md 被安排在 verify-code/close 后才生成。
- 必须修复：closure 文档不可信。cross-artifact-analysis.md 宣称“6 条 blocking 问题，全部已修复”，但当前 artifacts 仍有 B3 consumer 循环定位、B6 多个 fake gate、B8 build-spec 权限冲突，以及 repo 内 forbidden stage-result 实体。

