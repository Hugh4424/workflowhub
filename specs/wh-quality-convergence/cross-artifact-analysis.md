# 跨产物一致性分析报告

**Task ID**: `wh-quality-convergence`
**输入产物**: spec.md (356 lines), plan.md (191 lines), tasks.md (148 lines)
**分析日期**: 2026-07-08

## 摘要

跨 spec.md / plan.md / tasks.md 三产物扫描完成，共发现 **20 条问题**（CRITICAL 5 条，HIGH 6 条，MEDIUM 6 条，LOW 3 条）。最严重的问题集中在 D5 task_dir 配置默认值上：spec.md 明确规定 fail-loud（无默认路径），但 plan.md 和 tasks.md 多处仍保留 `默认 ~` 的旧设计口径，与 spec 正文和 F9（可证伪不假绿）冲突。此外，plan.md Verification Mapping 表中多处 AC 映射与对应步骤实际验收标准不匹配；两份非标准 FR 编号（FR-TASKS-001、FR-SRC-TRACE-001）出现在 tasks.md 中但未在 spec 中定义。

## 发现项

| # | type | severity | source_artifact | target_artifact | fr_or_task_id | line_or_anchor | 描述 |
|---|------|----------|-----------------|-----------------|---------------|----------------|------|
| 1 | inconsistency | CRITICAL | plan.md | spec.md | FR-TASKDIR-001 | plan.md Step 2.2 "新建 `~/.workflowhub/config.json`（含 `{"task_dir": "~"}` 默认值）" | plan.md 将 config.json 默认值设为 `~`，但 spec.md FR-TASKDIR-001 明确要求未配置 task_dir 字段时"不得套用任何默认值，须报错并停止（fail-loud）"。plan 仍沿用已过期的旧设计口径（decision-log D5 原版），与 spec 正文冲突。 |
| 2 | inconsistency | CRITICAL | tasks.md | spec.md | FR-TASKDIR-001 | tasks.md T009 "Create ~/.workflowhub/config.json with default {"task_dir": "~"}" | 同上——tasks.md T009 直接要求写入默认值 `~`，与 spec.md fail-loud 要求直接矛盾。T008 的优先级链 "WORKFLOWHUB_TASK_DIR > config.json > default ~" 同样违反 fail-loud。 |
| 3 | inconsistency | CRITICAL | plan.md | spec.md | FR-TASKDIR-001 | plan.md Step 2.2 "注意解决现有测试禁止 home 兜底的冲突" | plan.md 将此冲突标记为待解决（"注意解决"），但 spec.md 未决 1 已声明"已解决——本 spec 已改口径为 fail-loud，与既有测试预期一致，冲突已消除"。plan 口径落后于 spec，可能误导 build-code 阶段重新引入已消除的冲突。 |
| 4 | constitution-alignment | CRITICAL | plan.md | N/A | FR-TASKDIR-001 | plan.md Step 2.2（"默认 ~ 优先级链"） | plan 在 Step 2.2 中保留 `默认 ~` 优先级链设计，违反 CONSTITUTION F9（可证伪不假绿）：当 env 变量和 config.json 均未配置时，静默套用 `~` 等价于伪造一个"有配置"的假结果，而非诚实 fail。spec.md 已在 2026-07-08 改为 fail-loud 以符合 F9。 |
| 5 | constitution-alignment | CRITICAL | tasks.md | N/A | FR-TASKDIR-001 | tasks.md T008 "priority: WORKFLOWHUB_TASK_DIR > config.json > default ~" | 同 #4——tasks.md T008/T009 引入的 `default ~` 路径违反 F9。 |
| 6 | underdefined | HIGH | spec.md | plan.md, tasks.md | FR-RECEIPT-001 | spec.md receipt 证据契约 section（行 118-135） | spec 定义了三大类证据清单（git diff/测试结果/stage-result）、证据绑定规则（diff_sha + test_result_log in facts）、以及 no_code_change/test_not_applicable 声明机制。但 plan Step 1.2 仅提及 getRealChangedFiles() 和 verifyReceipts() 两个函数名，tasks.md T004/T005 也未提及证据绑定规则与豁免声明机制。这些是实现真核验的必要细节，缺失导致 plan/tasks 欠定义。 |
| 7 | inconsistency | HIGH | plan.md | spec.md | FR-RECEIPT-001 | plan.md Verification Mapping 表 Step 1.3 行 | Step 1.3（四阶段 SKILL.md receipt 接线）映射到 FR-RECEIPT-001/002，但 "Verified by AC" 列填的是 AC2-AC3。AC2 = flow_profile，AC3 = project-index——均与 receipt 校验无关。正确应填 AC1。 |
| 8 | inconsistency | HIGH | plan.md | spec.md | FR-FLOWPROFILE-001 | plan.md Verification Mapping 表 Step 1.1 行 | Step 1.1（flow_profile schema）映射到 FR-FLOWPROFILE-001，但 "Verified by AC" 列填的是 AC1-AC2。AC1 = receipt——与 flow_profile 无关。应仅填 AC2。 |
| 9 | inconsistency | HIGH | plan.md | spec.md | FR-PROJECTINDEX-001 | plan.md Verification Mapping 表 Step 2.1 行 | Step 2.1（task-index.mjs）映射到 FR-PROJECTINDEX-001/002，但 "Verified by AC" 列填的是 AC1-AC3。AC1 和 AC2 均非 project-index 验收标准。应仅填 AC3。 |
| 10 | inconsistency | HIGH | plan.md | spec.md | FR-TASKDIR-001 | plan.md Verification Mapping 表 Step 2.2 行 | Step 2.2（config.json）映射到 FR-TASKDIR-001/002/003，但 "Verified by AC" 列填的是 AC1-AC3。TASKDIR 域专属验收标准是 AC4。AC1=receipt 与 config.json 无关。应填 AC4。 |
| 11 | underdefined | HIGH | tasks.md | plan.md | FR-TASKDIR-002 | tasks.md T016 "write core/__tests__/task-dir-parser-config.test.mjs", plan.md Step 3.1 "core/__tests__/task-dir-parser.test.mjs (MODIFY)" | tasks.md T016 创建一个新测试文件 `task-dir-parser-config.test.mjs`，但 plan.md Step 3.1 指定修改现有文件 `task-dir-parser.test.mjs`。文件名不一致，实现者需自行判断哪个是正确的，存在歧义。 |
| 12 | underdefined | MEDIUM | spec.md | tasks.md | FR-FLOWPROFILE-001 | spec.md FR-FLOWPROFILE-001 "由 make-decision 阶段在产出 decision-log.md 时写入" | spec 要求 make-decision 阶段写入 flow_profile 字段到 decision-log，但 plan.md 将 make-decision SKILL.md 列入 "DO NOT TOUCH" 范围，tasks.md 也无对应的写入任务。该 FR 的写入侧完全无 task 覆盖（仅 schema 定义侧有 T001-T003 覆盖）。若写入由上游阶段承担且有意跳过，应在 plan 中显式声明。 |
| 13 | underdefined | MEDIUM | tasks.md | spec.md | FR-TASKS-001 | tasks.md T019 "FR: FR-TASKS-001" | T019（no-placeholder 合规扫描）引用的 FR-TASKS-001 在 spec.md 第 4 节功能需求中不存在。该 FR 编号在 spec 全文未定义。 |
| 14 | underdefined | MEDIUM | tasks.md | spec.md | FR-SRC-TRACE-001 | tasks.md T018 "FR: FR-SRC-TRACE-001" | T018（scope boundary 验证）引用的 FR-SRC-TRACE-001 仅在 spec appendix decision-log 中出现（作为溯源元数据标记，非功能需求），不属于 spec 第 4 节定义的 8 条 FR。技术上是未定义的 FR 引用。 |
| 15 | ambiguity | MEDIUM | plan.md | N/A | unknown | plan.md Technical Context "Performance Goals: N/A" | "N/A" 是模糊表述——应明确写"无性能目标"或"性能不在本轮范围内"，而非留白。 |
| 16 | ambiguity | MEDIUM | tasks.md | N/A | All FRs | tasks.md T017 "Run full regression test suite — all existing tests + new tests must pass" | "all existing tests" 的测试数量未明确——plan.md Technical Context 提及 "152+ tests" 但 tasks.md 未引用该数字或任何计数基准，下游执行者无法判断"全部通过"的范围边界。 |
| 17 | ambiguity | LOW | plan.md | N/A | unknown | plan.md Step 2.2 "默认 `~` 优先级链" 中的 `~` | `~` 在 Node.js 运行环境中不会自动 shell 展开，需 `os.homedir()` 解析。plan.md 未说明 `~` 的解析方式，实现者可能产生路径解析不一致。 |
| 18 | ambiguity | LOW | spec.md | N/A | unknown | spec.md 未决 3 "validateStageResult" 两处同名不同实现，命名混淆 | 未决 3 记录了同名函数混淆，但 plan 和 tasks 均未安排澄清任务，该风险在计划层面无消解路径，仅靠 build-code 阶段自行识别。 |
| 19 | ambiguity | LOW | spec.md | N/A | unknown | spec.md 未决 6 "flow_profile 占位字段 F10 Q1=none" | 未决 6 按 F10 四问核查发现 flow_profile 的 Q1（真实威胁）答案为"无特定威胁"。按规则仅记录非阻断，但报告须标记此 F10 发现供下游审查。 |
| 20 | constitution-alignment | MEDIUM | plan.md | N/A | unknown | plan.md Constitution Check 中 Q1/Q2/Q3 "Quality Principles" | plan.md Constitution Check 引用 Q1/Q2/Q3 作为 Quality Principles 但标准 CONSTITUTION.md 仅包含 F1-F10 和 S1-S8（21 clauses），Q 系列原则不存在。plan 声称 "21/21 clauses addressed"，但额外定义了 3 条非标准 Q 子句，构成伪合规风险——宪法检查自评 21/21 通过但包含了无效条款。 |

## Coverage Summary

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-RECEIPT-001 | Yes | T004, T005, T010, T011, T012, T013 | 证据契约细节（diff_sha 绑定、no_code_change 声明）在 plan/tasks 中欠定义 (见 #6) |
| FR-RECEIPT-002 | Yes | T005, T010, T011, T012, T013, T014 | 覆盖充分 |
| FR-FLOWPROFILE-001 | Partial | T001, T002, T003 | 仅覆盖 schema 定义侧；写入侧（make-decision 写 decision-log）无 task (见 #12) |
| FR-PROJECTINDEX-001 | Yes | T006 | 覆盖充分 |
| FR-PROJECTINDEX-002 | Yes | T007, T015 | 覆盖充分 |
| FR-TASKDIR-001 | Yes (with conflict) | T008, T009 | 覆盖但内容与 spec fail-loud 口径冲突 (见 #1, #2, #3) |
| FR-TASKDIR-002 | Yes (with conflict) | T008, T016 | 覆盖但 T008 仍含 `default ~` (见 #1, #2) |
| FR-TASKDIR-003 | Yes (with conflict) | T008, T016 | 覆盖但 T008 优先级链含 `default ~` (见 #1, #2) |

## Constitution Alignment Issues

以下发现源自 plan.md Constitution Check 章节与 spec/tasks 内容的交叉比对。按 SKILL.md 规则，此类发现仅为记录、不阻断下游推进，正式宪法符合性检查由 orchestrator (build-plan) 执行。

| # | type | severity | source_artifact | target_artifact | fr_or_task_id | line_or_anchor | 描述 |
|---|------|----------|-----------------|-----------------|---------------|----------------|------|
| C1 | constitution-alignment | CRITICAL | plan.md, tasks.md | N/A | FR-TASKDIR-001 | plan.md Step 2.2, tasks.md T008/T009 | D5 config.json 仍保留 `默认 ~` 设计，违反 F9（可证伪不假绿）：无法获取配置时静默输出假路径。spec.md 已改口径为 fail-loud 以符合 F9。 |
| C2 | constitution-alignment | MEDIUM | plan.md | N/A | unknown | plan.md Q1-Q3 行 | plan 宪法检查引用了标准 21-clause 之外的 Q1/Q2/Q3 子句，同时声称 "21/21 clauses addressed"——此自评可能掩盖真正的宪法合规缺口。 |

## Unmapped Tasks

以下 tasks 引用的 FR 在 spec.md 第 4 节功能需求列表（共 8 条 FR）中不存在：

| Task ID | 引用 FR | 说明 |
|---------|---------|------|
| T018 | FR-SRC-TRACE-001 | FR-SRC-TRACE-001 仅出现在 spec appendix decision-log 中作为溯源标记，非功能需求 |
| T019 | FR-TASKS-001 | FR-TASKS-001 在 spec.md 全文未定义 |

T017 和 T020 引用 "All FRs"，属于摘要类映射，不视为未映射。

## Metrics

- Total Requirements: **8** (FR-RECEIPT-001, FR-RECEIPT-002, FR-FLOWPROFILE-001, FR-PROJECTINDEX-001/002, FR-TASKDIR-001/002/003)
- Total Tasks: **20** (T001-T020)
- Coverage % (requirements with >=1 task): **100%** (8/8)——注意：TASKDIR 域任务覆盖率存在但内容与 spec 冲突；FLOWPROFILE 写入侧缺少 task
- Ambiguity Count: **5** (#15, #16, #17, #18, #19)
- Duplication Count: **0**
- Critical Issues Count: **5** (#1, #2, #3, #4, #5——含 2 条 constitution-alignment)

## Next Actions

- **CRITICAL > 0**: 强烈建议在 build-code 阶段开始前解决 D5 default `~` 与 spec fail-loud 口径的冲突（#1-#5）。plan.md Step 2.2、tasks.md T008/T009 需与 spec.md FR-TASKDIR-001/003 及 AC4 对齐为 fail-loud，移除所有 `默认 ~` 表述。
- **HIGH issues 建议处理**: Verification Mapping 表的 AC 映射错误（#7-#10）应在 plan.md 中修正，task-dir-parser 测试文件名不一致（#11）应在 plan 和 tasks 间统一。
- **MEDIUM issues**: 未定义 FR 引用（#13, #14）建议在 tasks 中更正或补充定义；flow_profile 写入侧缺失（#12）需明确是否由上游 make-decision 负责并标注为已覆盖。
- **LOW issues**: 术语模糊（#17）和同名函数混淆（#18）可在 build-code 阶段顺带解决。

## 溢出摘要

无溢出——发现总数 20 条，未超过 50 条上限。
