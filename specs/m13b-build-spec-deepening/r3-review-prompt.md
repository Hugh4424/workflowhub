# Heterologous Round 3 Re-Review: m13b-build-spec-deepening build-plan

You are acting as a heterologous (non-Claude) code reviewer performing a third-round re-review of build-plan artifacts for task `m13b-build-spec-deepening`. This is an independent review — do not defer to previous rounds; verify claims yourself from the raw text.

## Artifacts under review

### spec.md — FR-SELFCHECK-001 (authoritative source, 7-item list)

```
FR-SELFCHECK-001: build-spec 在 spec 产出后必须运行以下 7 条自检，结论（pass/warn/unknown）写入质量事实契约第 2 项：

1. spec-ladder 档位已声明且有依据
2. 所有 FR 使用 FR-{DOMAIN}-NNN 格式
3. 每个 FR 至少有一条 Given/When/Then 场景
4. 五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章
5. spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应
6. 无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）
7. Known Gaps 段存在
```

### tasks.md — T008 (the fix that closed NEW-BLK-1)

```
T008 [P] 在 workflows/build-spec/SKILL.md 新增「7 条自检 + Spec-Purity grep」节：逐条列出 7 条自检编号（1. 至 7.），与 FR-SELFCHECK-001 完全对应：
①spec-ladder 档位已声明且有依据、
②所有 FR 使用 FR-{DOMAIN}-NNN 格式、
③每个 FR 至少有一条 Given/When/Then 场景、
④五章硬门完整（速读卡/FR/不做/验收/影响范围）——A 档可豁免后三章、
⑤spec↔decision-log 覆盖率：decision-log 每条 KEEP 决策在 spec FR 中有对应、
⑥无 [NEEDS CLARIFICATION] 残留（或全部标明已解决/延后理由）、
⑦Known Gaps 段存在；
Spec-Purity grep 检测目标明确（代码块/具体路径/shell 命令），warn 不阻断，文档示例块不自动豁免。FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
```

### tasks.md — T014 (the fix that closed BLK-4)

```
T014 整体 AC 验收：对 workflows/build-spec/SKILL.md 运行 grep 核对 AC-01 至 AC-22；
**显式 grep SKILL.md frontmatter 确认 `version` 字段存在**（S6 技能版本可追溯，验收 SKILL.md 写入了 version 值，如 `version: 2.0.0`）；
确认 scope boundary（禁止触碰文件未被改动）；确认每个任务至少引用 1 个 FR；
更新/核查 specs/m13b-build-spec-deepening/spec-acceptance-count.json 三字段有效性（AC-17）。
FR: FR-CONTRACT-001, FR-SELFCHECK-001, FR-ACCOUNT-001 (stage:3, depends:T012,T013)
```

### plan.md — S6 constitution clause (the fix that closed BLK-4 plan side)

```
[x] S6 技能版本可追溯 — 判据：现有 SKILL.md 有 name/description frontmatter，深化后需新增 version 字段；T014 显式 grep SKILL.md frontmatter 确认 `version` 字段写入（T014 验收步骤中明确列出该检查）；spec 本身有 spec_version: 1.0.0。符合 S6（由 T014 真实核查，非假设）。
```

### plan.md — FR Coverage Matrix (all 24 FRs)

```
| FR | 覆盖 Step | 覆盖 Task |
|----|-----------|-----------|
| FR-BUILD-001       | 2.1 | T007 |
| FR-CONTRACT-001    | 2.3 | T005 |
| FR-CONTRACT-002    | 2.3 | T005 |
| FR-LADDER-001      | 2.2 | T006 |
| FR-LADDER-002      | 2.2 | T006 |
| FR-STRUCTURE-001   | 2.1 | T007 |
| FR-STRUCTURE-002   | 2.1 | T007 |
| FR-SELFCHECK-001   | 2.4 | T008 |
| FR-SELFCHECK-002   | 2.4 | T008 |
| FR-REVIEW-001      | 2.5 | T009 |
| FR-REVIEW-002      | 2.5 | T009 |
| FR-SCOPETRIAGE-001 | 2.6 | T010 |
| FR-ALIGN-001       | 2.7 | T011 |
| FR-TRACKING-001    | 2.8 | T001 |
| FR-TRACKING-002    | 2.8 | T001 |
| FR-TASKDIR-001     | 2.8 | T001 |
| FR-FRICTION-001    | 3.1 | T013 |
| FR-ARTIFACT-001    | 3.1 | T013 |
| FR-BEHAV-001       | 3.1 | T013 |
| FR-BEHAV-002       | 3.1 | T013 |
| FR-COMM-001        | 3.1 | T012 |
| FR-COMM-002        | 3.1 | T012 |
| FR-ACCOUNT-001     | 3.2 | T014 |
| FR-ACCOUNT-002     | 3.2 | T014 |
```

### tasks.md — full task list (for dependency and ordering check)

```
Stage 1:
- T001 FR: FR-TRACKING-001, FR-TRACKING-002, FR-TASKDIR-001 (stage:1, depends:无)
- T002 [P] FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)  [NOTE: listed under Stage 1 header but declared stage:2]
- T003 [P] FR: FR-LADDER-001, FR-LADDER-002 (stage:1, depends:T001)
- T004 [P] FR: FR-STRUCTURE-001, FR-STRUCTURE-002 (stage:1, depends:T001)

Stage 2:
- T005 FR: FR-CONTRACT-001, FR-CONTRACT-002 (stage:2, depends:T001,T002)
- T006 [P] FR: FR-LADDER-001, FR-LADDER-002 (stage:2, depends:T001,T002,T003)
- T007 [P] FR: FR-BUILD-001 (stage:2, depends:T001,T002,T005)
- T008 [P] FR: FR-SELFCHECK-001, FR-SELFCHECK-002 (stage:2, depends:T002,T003,T005)
- T009 [P] FR: FR-REVIEW-001, FR-REVIEW-002 (stage:2, depends:T005)
- T010 [P] FR: FR-SCOPETRIAGE-001 (stage:2, depends:T005)
- T011 [P] FR: FR-ALIGN-001 (stage:2, depends:T005)

Stage 3:
- T012 FR: FR-COMM-001, FR-COMM-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
- T013 [P] FR: FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 (stage:3, depends:T005,T006,T007,T008,T009,T010,T011)
- T014 FR: FR-CONTRACT-001, FR-SELFCHECK-001, FR-ACCOUNT-001 (stage:3, depends:T012,T013)
```

---

## Your job: Round 3 independent review

Perform a complete fresh pass. Answer each question explicitly with PASS or FAIL and brief evidence:

**Q1 — NEW-BLK-1 closed?**
Compare T008's 7-item list verbatim against spec.md FR-SELFCHECK-001's 7 items. Do all 7 items match in content and order? Any deviation = FAIL.

**Q2 — BLK-4 closed?**
Does T014 contain an explicit step to grep SKILL.md frontmatter for `version` field? Does plan.md S6 now cite T014 as the real verification mechanism (not a nonexistent step)? Both must be true = PASS.

**Q3 — FR Coverage complete (24 FRs)?**
Check: every FR in the matrix has a corresponding task that declares it. Check for orphan FRs (in spec but not matrix) or phantom tasks (task claims FR not in matrix). Any gap = FAIL.

**Q4 — plan↔tasks consistency?**
FR Coverage Matrix step column should match task step assignments. Task stage/dependency declarations should be internally consistent (no circular deps, no task depending on a task that doesn't exist).

**Q5 — Constitution 21/21 truthfulness?**
Focus on S6: does it now reference a real, concrete verification step (T014 frontmatter grep)? Is the claim falsifiable?

**Q6 — Dependency ordering soundness?**
T002 is listed under Stage 1 header but declared `stage:2, depends:T005`. T005 is Stage 2 and depends on T002. Is this a circular dependency? Evaluate carefully.

**Q7 — Scope drift check?**
Do any tasks modify files outside the declared scope (`workflows/build-spec/SKILL.md` and `specs/m13b-build-spec-deepening/`)?

**Q8 — Any new blocking issues?**
Fresh eyes pass: any remaining issue that would cause build-code to produce wrong behavior if tasks.md is executed as written?

---

## Output format

```
ROUND: 3
REVIEWER: <your model/engine name>
DATE: 2026-06-30

NEW-BLK-1 (T008 self-check list): [CLOSED/STILL-OPEN] — <1-sentence evidence>
BLK-4 (T014 version grep + S6 citation): [CLOSED/STILL-OPEN] — <1-sentence evidence>

Q1: [PASS/FAIL] — evidence
Q2: [PASS/FAIL] — evidence
Q3: [PASS/FAIL] — evidence
Q4: [PASS/FAIL] — evidence
Q5: [PASS/FAIL] — evidence
Q6: [PASS/FAIL] — evidence
Q7: [PASS/FAIL] — evidence
Q8: [PASS/FAIL] — evidence or "no new blocking found"

VERDICT: [pass / revise_required / escalate]
BLOCKING: <list any new blocking issues, or "none">
NON-BLOCKING: <list any non-blocking observations>
```
