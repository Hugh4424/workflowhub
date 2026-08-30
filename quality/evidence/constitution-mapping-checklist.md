# 宪法映射核对清单

本文件由 `scripts/constitution-mapping-check.mjs` 自动生成，用于复核每条 FR 的宪法依据与 AC-04 边界。

生成时间：2026-08-30T00:14:21.729Z
spec.md 内容哈希：0eac160feda488610d7c694c874aea0cec58c6ef43d917b83e0d1e20a56415af

## 各 FR 宪法依据提取

| FR | 名称 | 宪法依据 | 原始依据文本 |
| --- | --- | --- | --- |
| FR-CLOSE-001 | close 回归五个交付动作，开始前进行一次人工确认清单。 | F7, F9, Q2 | D-002；PFACT-01、PFACT-02；SCN-001、SCN-002、SCN-003；AC-01、AC-02；宪法 F7（不可逆操作独立授权）、F9（可证伪不假绿）、Q2（推进资格、发布结构与完成判据分离）。 |
| FR-CLOSE-002 | 正常 close 与带缺口 close 共用一条路径，删除 risk close 平行机制。 | Q1, F11 | D-002；PFACT-01、PFACT-04；SCN-002；AC-02；宪法 Q1（质量事实不作准入证）、F11（正常执行优先、控制面受限）。 |
| FR-CLOSE-003 | 清理按现有 workspace_mode 字段分支，框架自建目录才删除，绑定目录只记录。 | F3, F7 | D-004；PFACT-01；SCN-001、SCN-002、SCN-004；AC-02；宪法 F3（写边界 fail-loud）、F7（cleanup 不可逆授权）。 |
| FR-CLOSE-004 | close 失败后可断点续跑，手工物理完成可经核对补记 completed.json。 | F7, F9 | D-005；PFACT-01；SCN-003；AC-02；宪法 F7（不可逆操作独立授权）、F9（可证伪不假绿）。 |
| FR-CLOSE-005 | close 与 status 共用同一事实新鲜度判定。 | F8, F11 | D-006；PFACT-01；SCN-001、SCN-005；AC-02；宪法 F8（简单优先，不建 replacement 平台）、F11（控制面受限）。 |
| FR-LEFT-001 | 写边界身份断言。 | F3, F11 | D-007；PFACT-06；SCN-005；AC-05；宪法 F3（写边界 fail-loud）、F11（控制面受限）。 |
| FR-LEFT-002 | review 统一 preflight 分类报错。 | F3, F4 | D-007；PFACT-06；SCN-005；AC-05；宪法 F3、F4（质量靠异源审查，finding 不锁死修复）。 |
| FR-LEFT-003 | fallback 拆 invalid_input 与 unavailable。 | F4, F9 | D-007；PFACT-06；SCN-005；AC-05；宪法 F4、F9（可证伪不假绿）。 |
| FR-LEFT-004 | 子代理结果契约。 | F2, F11 | D-007；PFACT-06；SCN-005；AC-05；宪法 F2（窄契约）、F11（控制面受限）。 |
| FR-LEFT-005 | code_review 一等事件。 | F1, F11 | D-007；PFACT-06；SCN-001、SCN-002；AC-05；宪法 F1（薄核心）、F11（控制面受限）。 |
| FR-PORT-001 | session 宿主可移植化。 | F6, S8 | D-009、D-010；PFACT-05；SCN-004；AC-06；宪法 F6（统一外置执行记录）、S8（自定义技能可搬运）。 |
| FR-EVAL-001 | 双轨事实评估（仅出结论）。 | F4, Q1 | D-009；PFACT-06；SCN-001；AC-06；宪法 F4（质量事实浮现）、Q1（质量事实不作准入证）。 |
| FR-SUB-001 | 死代码扫描与删除。 | F8, F10, F11 | D-009；PFACT-01、PFACT-06；SCN-006；AC-06；宪法 F8（简单优先）、F10（自动化按真实收益）、F11（控制面受限）。 |
| FR-SUB-002 | workflowhub 侧 DSH 可移植化。 | F6, S8 | D-009、D-010；PFACT-05；SCN-004；AC-06；宪法 F6、S8。 |
| FR-SUB-003 | 双轨结论报告交付。 | F4, Q1 | D-009；PFACT-06；SCN-001；AC-06；宪法 F4、Q1。 |
| FR-REV-001 | 审查输入只认提交材料。 | F8, F11, S8 | D-007；PFACT-06；SCN-005；AC-07；宪法 F8（简单优先）、F11（控制面受限）、S8（技能可搬运不绑死宿主）。 |
| FR-REV-002 | 审查结果宽松协议投影与统一 findings 格式。 | F9, F4 | D-007；PFACT-06；SCN-005；AC-07；宪法 F9（可证伪不假绿）、F4（质量靠异源审查，finding 不锁死修复）。 |
| FR-REV-003 | 审查结果落账路径。 | F6, F11 | D-007；PFACT-06；SCN-005；AC-07；宪法 F6（统一外置执行记录）、F11（控制面受限）。 |
| FR-REV-004 | 审查一轮处置闭环。 | F4, F8, Q1 | D-007；PFACT-06；SCN-005；AC-07；宪法 F4、F8（简单优先）、Q1（质量事实不作准入证）。 |

## AC-04 边界核对（git diff --name-only）

```
CONSTITUTION.md
CONTEXT.md
constitution-checklist.md
core/task-close.mjs
docs/architecture/move-map.json
runtime/evidence/acceptance-evidence-validator.mjs
runtime/interface/runtime-facade.mjs
runtime/stage/stage-runner.mjs
runtime/task/workspace.mjs
skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs
skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs
skills/wh-review/scripts/review-runner.mjs
skills/wh-review/scripts/simple-review-runner.mjs
skills/wh-review/scripts/wh-review-cli.mjs
specs/workflowhub-simplicity-close-repair-20260829/decision-log.md
specs/workflowhub-simplicity-close-repair-20260829/plan.md
specs/workflowhub-simplicity-close-repair-20260829/spec.md
specs/workflowhub-simplicity-close-repair-20260829/tasks.md
tests/integration/manual-delivery-close.test.mjs
tools/cli/stage-runtime.mjs
tools/cli/task-close.mjs
```

## 四行无新增结论

- 新增公共命令：无（tools/cli/ 无新增未跟踪文件：是；公共 runtime 行为仍为七类且名称精确：是）
- 新增材料：无（specs/workflowhub-simplicity-close-repair-20260829/*.md 数量为 4：是）
- 新增 manifest 字段：无（workflows/ 无改动：是）
- 新增控制面：无（以上三项均无新增；diff 列表见上节）

---
本文件为可复核产物，不是推进或完成 gate。