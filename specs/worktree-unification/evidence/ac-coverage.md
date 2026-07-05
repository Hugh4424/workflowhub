# AC 覆盖核对报告：worktree-unification

生成时间：2026-07-05T12:45:00Z
证据基础：phase-result.json (phase-3) + phase-3-T005-GREEN.json / phase-3-T007-GREEN.json / phase-3-T008-GREEN.json + stage-result-build-code.json

---

## §5 成功标准（AC-01..AC-04）

### AC-01
**内容**：5 个 pipeline stage 均可读取 worktree.json 且产物路径连续；build-spec/build-plan 不创建 worktree，但须读取 target_repo_root，缺失时 fail-loud。[Task: T001, T002, T003, T004, T005]

**覆盖状态**：partial

**证据**：
- T005 (phase-3-T005-GREEN.json)：9/9 gates 全过，含 `bs-no-worktree-add`、`bp-no-worktree-add`、`bs-field-read`、`bs-fail-loud`、`bp-field-read`、`bp-fail-loud`、`bs-mjs-ref`、`bp-mjs-ref`、`mjs-exists`，exit_code=0。覆盖 build-spec/build-plan 不创建 worktree + 读取 target_repo_root + fail-loud 部分。
- T001/T002/T003/T004：属于 phase-1/phase-2 任务，build-code stage-result-build-code.json 记录 phase-1/phase-2 均 status=done，review verdict=pass。但 phase-1/phase-2 的 gate evidence 文件不在本次提供的 phase-3 证据包内，无法逐条核查门级通过情况。
- **partial 原因**：T005 覆盖的 build-spec/build-plan 子条目有完整 gate 证据；T001-T004 覆盖的其余子条目仅有 stage-result 摘要（verdict=pass），无单独 gate 文件可引用。

---

### AC-02
**内容**：环境变量 `WORKFLOWHUB_TASK_DIR` 优先级覆盖生效，可通过测试用例验证。[Task: T001]

**覆盖状态**：partial

**证据**：
- stage-result-build-code.json phase-1 commit=3816932，tasks=["T001"]，status=done，review verdict=pass（rounds=2）。
- T001 对应 core/task-dir-parser.mjs 修改，phase-1 review 通过。
- **partial 原因**：无 phase-1-T001 gate 文件在本次提供证据包中，仅有 phase-result 摘要层证据，无可引用的逐条 PASS 输出。

---

### AC-03
**内容**：git log 可追溯每个 stage 的提交；main 推送与远端分支删除只允许在 verify-code close 阶段人工确认后；main 推送必须执行一次，远端分支删除按存在性执行。[Task: T004]

**覆盖状态**：partial

**证据**：
- T008 (phase-3-T008-GREEN.json)：12/12 doc-checks 全过（OVERALL rc=0），含 `T008-F-commit`、`T008-A-commit`、`T008-B-commit`、`T008-C-commit`、`T008-D-prefix`、`T008-E-step`、`T008-E-commitsha` 等门，覆盖 commit 触发点文档层核查。
- stage-result-build-code.json 记录 T008 status=done_with_finding：12/13 doc-level gate 通过；1 项历史性 post-hoc 检查（git history 中无 `workflowhub(build-code/<phase-name>):` 格式提交）人工裁定放行，无需补救。
- AC-03 中 main 推送/分支删除属于 close 流程（T004），T004 phase-2 review=pass（rounds=13），无单独 gate 文件。
- **partial 原因**：commit 追溯部分有 T008 gate 证据；push/merge 执行部分（T004 close 流程）尚未实际运行（close 流程未完成），仅有 doc 层 + build-code review 证据。

---

### AC-04
**内容**：close 流程执行后四项验收均通过，worktree 和分支已清理，spec 已归档。[Task: T004]

**覆盖状态**：not_covered

**证据**：
- close 流程（FR-WORKTREE-CLOSE-006）尚未执行：当前任务处于 verify-code 阶段，3rd-review + 人工确认 + 不可逆动作均未发生。
- T004 build-code 层 review verdict=pass，但 verify-code close 流程是运行时行为，非静态 doc 核查可覆盖。
- **not_covered 原因**：close 流程属于运行时验收，当前阶段尚未执行，无执行证据。

---

## §8 Given/When/Then 场景核查项

（注：以下条目不匹配 `^AC-\d+$` 格式，不计入 ac_routes 机器核查，仅供完整性记录）

| 条目 | 覆盖状态 | 证据来源 |
|------|----------|----------|
| FR-WORKTREE-CONTRACT-001 场景A：make-decision 写入 6 字段，build-code 可读取 | partial | phase-2 T002 review=pass；无单独 gate 文件 |
| FR-WORKTREE-CONTRACT-001 场景B：worktree.json 缺失时 fail-loud | partial | phase-2 T003 review=pass；T005 gate bp-fail-loud/bs-fail-loud=PASS 覆盖 build-spec/plan 侧；build-code 侧无 gate 文件 |
| FR-WORKTREE-MAKEDECISION-002 场景A：分支占用时 fail-loud | partial | phase-2 T002 review=pass；无 gate 文件 |
| FR-WORKTREE-MAKEDECISION-002 场景B：task-id 不合规时 fail-loud | partial | phase-2 T002 review=pass；无 gate 文件 |
| FR-WORKTREE-MAKEDECISION-002 场景C：task-id 归一化后合规时继续 | partial | phase-2 T002 review=pass；无 gate 文件 |
| FR-WORKTREE-ENVVAR-003 场景A：env var 优先于 yaml | partial | phase-1 T001 review=pass；无 gate 文件 |
| FR-WORKTREE-ENVVAR-003 场景B：env var 未设置时降级 yaml | partial | phase-1 T001 review=pass；无 gate 文件 |
| FR-WORKTREE-ENVVAR-003 场景C：两者均缺失时明确报错 | partial | phase-1 T001 review=pass；无 gate 文件 |
| FR-WORKTREE-COMMIT-004 场景A：per-stage commit 或记录无变更原因 | covered | T008 gate 12/12 PASS（T008-F-commit、T008-A-commit 等），exit_code=0 |
| FR-WORKTREE-PUSH-005 场景A：close 确认前无 push | not_covered | close 流程未执行 |
| FR-WORKTREE-PUSH-005 场景B：8步线性序列完成 | not_covered | close 流程未执行 |
| FR-WORKTREE-CLOSE-006 场景A：完整 close 后归档/清理/merge 可查 | not_covered | close 流程未执行 |
| FR-WORKTREE-CLOSE-006 场景B：revise_required 时阻止 merge | not_covered | close 流程未执行 |
| FR-WORKTREE-CLOSE-006 场景C：中途失败立即停止 | not_covered | close 流程未执行 |
| FR-WORKTREE-SCOPE-008 场景A：build-spec 读取路径不调用 worktree add | covered | T005 gate bs-no-worktree-add/bs-field-read=PASS，exit_code=0 |
| FR-WORKTREE-SCOPE-008 场景B：worktree.json 缺失时 build-spec fail-loud | covered | T005 gate bs-fail-loud/bp-fail-loud=PASS，exit_code=0 |
| FR-WORKTREE-SCOPE-008 场景C：build-spec/plan 不得调用 git worktree add | covered | T005 gate bs-no-worktree-add/bp-no-worktree-add=PASS，exit_code=0 |
| FR-WORKTREE-SCOPE-009 场景A：specs/{task-id}/ 下无 evidence/ | covered | T007 gate ALL_T007_GATES_PASS，exit_code=0 |
| FR-WORKTREE-SCOPE-009 场景B：evidence 落点在 task_tracking_root 下 | covered | T007 gate ALL_T007_GATES_PASS，exit_code=0 |
| FR-WORKTREE-FAILLOUD-007 场景A：僵尸 worktree 时报错不自动删除 | partial | phase-1 T001、phase-2 T003 review=pass；无 gate 文件 |

---

## 汇总（AC-01..AC-04，匹配 `^AC-\d+$`）

| AC ID | 覆盖状态 | 备注 |
|-------|----------|------|
| AC-01 | partial  | T005 gate 覆盖 build-spec/plan 子条目；T001-T004 仅摘要证据 |
| AC-02 | partial  | T001 review=pass；无 gate 文件 |
| AC-03 | partial  | T008 gate 覆盖 commit 追溯；push/merge 为运行时行为未执行 |
| AC-04 | not_covered | close 流程尚未执行 |

- covered：0 条
- partial：3 条（AC-01, AC-02, AC-03）
- not_covered：1 条（AC-04）

**说明**：AC-04 not_covered 及 AC-03 partial 的 push/merge 部分均属于 close 流程运行时验收，非本次 doc-only 变更可覆盖范围；人工已裁定本次变更豁免 fresh 测试（comment cb3945ac）。AC-04 的 not_covered 状态预期在 close 流程实际执行后才可消除。
