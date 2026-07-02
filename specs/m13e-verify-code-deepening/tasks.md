# Tasks: m13e-verify-code-deepening

**Input**: Design documents `specs/m13e-verify-code-deepening/`
**Prerequisites**: spec.md (authoritative, 3rd-reviewed), plan.md

**Tests**: 机器可查字段校验（JSON/YAML 解析）；手动执行 verify-code 阶段验证颜色门行为

**Organization**: Tasks grouped by dependency layer. Stage 1 = 独立基础设施（无依赖），Stage 2 = 核心实现（依赖 Stage 1），Stage 3 = 收尾验证（依赖 Stage 2）。

---

## Stage 1

**目的**：无前置依赖的基础设施，可并行启动。

- [ ] T001 [P] 新建 `skills/test-strategy/SKILL.md`：定义输入契约（ui_change: boolean, risk_level: low|medium|high, L2报告摘要）、输出契约（test-strategy.md YAML front-matter 含 ac_routes 对象）、AC ID 解析规则（正则 `^AC-\d+$`）、路由值合法集合（P0/P1/P2/P3/skip）、错误格式（MISSING_ROUTE/UNKNOWN_AC）、超时行为（失败记入 yellow）。FR: FR-STRATEGY-001 (stage:1, depends:无)

- [ ] T002 [P] 扩展 `skills/verify-code/freshness.mjs`：在现有段1（phase-N.md）基础上增加段2（RED报告）、段3（GREEN报告）、段4（L2报告）的 git_sha+content_hash 交叉验证；增加 L3 iron-law 专项校验（segment="l3-iron"，针对 l3-e2e-report.json）；所有违反追加到 `mtime_violations[]`，每条含 segment/file/reason/expected_sha/actual_sha 字段。FR: FR-FRESH-001, FR-L3IRON-001 (stage:1, depends:无)

---

## Stage 2

**目的**：核心实现，依赖 Stage 1 产物（test-strategy SKILL.md 和 freshness.mjs 扩展版）。

- [ ] T003 修改 `skills/verify-code/SKILL.md`：在 test-strategy 步骤之后、L3 步骤之前插入 trace-check 查痕步骤。trace-check 逻辑：扫描 `evidence/` 下各 phase 报告，检查（1）文件存在、（2）exit_code==0、（3）git_sha+content_hash 交叉验证（与 freshness.mjs 同一套逻辑）；处理跳过留痕（spec meta 含 `no_browser_test: true` 则不对缺 L3 报告报警）；产出 `trace-check-report.json`（含 missing_ac_coverage[], checked_phases[], violations[]）；关联比对可验证：检查 evidence 是否被本次 journal 引用或由本次 capture.mjs 调用链产生，结果写入 trace-check-report.json。FR: FR-TRACE-001, FR-TRACE-002 (stage:2, depends:T002)

- [ ] T004 修改 `skills/verify-code/SKILL.md`：插入 test-strategy skill 调用步骤（子代理方式，在 L1/L2 执行之后、trace-check 之前）。步骤内容：读取 ui_change、risk_level、L2报告摘要，以子代理方式调用 `skills/test-strategy/SKILL.md`；调用完成后触发机器核查（读 spec AC 列表，逐一在 test-strategy.md 的 ac_routes 中查找）；核查失败（MISSING_ROUTE/UNKNOWN_AC）记入 D7 red 条件触发路径。FR: FR-STRATEGY-001 (stage:2, depends:T001)

- [ ] T005 修改 `skills/verify-code/SKILL.md`：L3 E2E 步骤改为直接调用 `isolated-browser-qa` skill（不修改 isolated-browser-qa 本身）。指定：截图输出到 `evidence/screenshots/`，报告写入 `l3-e2e-report.json`，报告须含 git_sha 和 flaky_failure 字段（复用 isolated-browser-qa 既有输出契约）。FR: FR-L3-001 (stage:2, depends:无)

- [ ] T006 修改 `skills/verify-code/SKILL.md`：在阶段开始（第一步前）和阶段结束（最后步骤后）各插入一次 stage-summary 调用，两次均 append 写入 `evidence/stage-summary.jsonl`，每行 JSON 格式 `{"event":"stage_summary","phase":"start"|"end","ts":"<ISO8601>"}`；写入机器验证规则：统计 "event":"stage_summary" 行数必须=2，第1行 phase="start"，第2行 phase="end"。FR: FR-SUMMARY-001 (stage:2, depends:无)

---

## Stage 3

**目的**：铁律校验与三色门，依赖 Stage 2 所有步骤（trace-check、test-strategy调用、L3执行、stage-summary 均已写入 SKILL.md）。

- [ ] T007 修改 `skills/verify-code/SKILL.md`：在 L3 执行之后插入 L3 iron-law 校验步骤——读取 l3-e2e-report.json 的 git_sha，与当前 HEAD 对比；不匹配则 mtime_violations[] 追加 segment="l3-iron" 记录，触发 D7 red 条件。引用 freshness.mjs 的 l3-iron 校验逻辑（T002 扩展）。FR: FR-L3IRON-001 (stage:3, depends:T002,T005)

- [ ] T008 修改 `skills/verify-code/SKILL.md`：将 stage-result status 字段从 green/red 扩展为 green/yellow/red 三色门。实现 FR-COLOR-001 触发条件逻辑（机器硬条件，非 LLM 主观）：green=全通；yellow=flaky_failure=true 或非关键AC缺失（非 missing_ac_coverage[] 关键项）；red=freshness 任一段 content_hash 不符/L3 git_sha 不匹配/missing_ac_coverage[] 含关键AC/test-strategy 机器核查失败。yellow 不阻断推进，red escalate 后等人确认，不自动放行。FR: FR-COLOR-001 (stage:3, depends:T003,T004,T006,T007)

- [ ] T009 [P] Scope boundary 自检：逐一确认红线文件无改动（build-code/SKILL.md、build-plan/SKILL.md、make-decision/SKILL.md、build-spec/SKILL.md、isolated-browser-qa/SKILL.md、stage-summary/SKILL.md）；确认 isolated-browser-qa 本身未被改造。FR: FR-L3-001（out-of-scope 约束） (stage:3, depends:T003,T004,T005,T006,T007,T008)

- [ ] T010 [P] 机器可查契约自检：验证 test-strategy.md 解析规则（AC ID 正则、路由值集合、错误格式行）已完整写入 `skills/test-strategy/SKILL.md`；验证 stage-summary.jsonl 行数校验规则已写入 verify-code SKILL.md；验证 freshness.mjs 四段 segment 标识与 data-contracts.md Contract 3 一致；验证 no_browser_test 字段名与 spec FR-TRACE-001 正文一致（非场景笔误版 skip_ui_test）。FR: FR-TRACE-001, FR-TRACE-002, FR-STRATEGY-001, FR-SUMMARY-001 (stage:3, depends:T001,T002,T003,T006)

---

## Dependencies & Execution Order

### Stage Dependencies

- **Stage 1**（T001, T002）：无依赖，立即并行启动
- **Stage 2**（T003, T004, T005, T006）：T003 依赖 T002；T004 依赖 T001；T005/T006 无前置（可与 Stage 1 并行，但归入 Stage 2 以保持语义清晰）
- **Stage 3**（T007, T008, T009, T010）：T007 依赖 T002+T005；T008 依赖 T003+T004+T006+T007；T009/T010 依赖 Stage 2 所有任务完成

### Parallel Opportunities

- T001 和 T002 可并行（不同文件，无依赖）
- T005 和 T006 可并行（修改同一文件不同位置，建议串行以避免冲突；若分工到不同人可并行）
- T009 和 T010 可并行（只读自检）

### Within Each Stage

- Stage 2 中 T003/T004 分别依赖 T002/T001，T005/T006 无前置；T003 和 T004 可在各自前置完成后立即开始
- Stage 3 中 T007 在 T005 完成后即可启动，不必等 T008；T008 须等 T007 完成

---

## Implementation Strategy

### MVP

1. 完成 Stage 1（T001 新建 test-strategy SKILL.md + T002 扩展 freshness.mjs）
2. 完成 Stage 2 T004（test-strategy 调用） + T005（L3 复用）+ T006（stage-summary 双调用）
3. **STOP VALIDATE**: verify-code 流程可跑通，test-strategy.md 可产出，stage-summary.jsonl 行数=2
4. 完成 Stage 2 T003（trace-check）
5. 完成 Stage 3（iron-law + 三色门 + 自检）

### Incremental Delivery

1. Stage 1 并行 → 基础设施就绪
2. Stage 2 → 核心步骤插入 verify-code SKILL.md
3. Stage 3 → 颜色门收口 + 自检验证

---

## Notes

- 字段名以 spec FR-TRACE-001 正文为准：`no_browser_test`（snake_case），场景中出现的 `skip_ui_test` 是笔误，不使用。
- T008 三色门实现须引用 T003 的 trace-check-report.json（missing_ac_coverage[]）、T002 的 freshness.mjs（mtime_violations[]）、T004 的机器核查结果，三者均为 JSON 接口，机器直读。
- Stage 2 中 T003~T006 均修改同一文件 `skills/verify-code/SKILL.md`，执行时须按步骤顺序串行合并，避免覆盖冲突。
