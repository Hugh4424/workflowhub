# data-contracts.md — m13e-verify-code-deepening

**task-id**: m13e-verify-code-deepening
**generated-by**: build-plan Step 1.5
**date**: 2026-07-02

---

## Contract 1: trace-check-report.json

| 字段 | 说明 |
|------|------|
| **contract name** | trace-check-report |
| **owner side** | verify-code 主技能（trace-check 步骤写入） |
| **consumer side** | stage-result 颜色门（FR-COLOR-001），人工审查 |
| **required fields/types** | `missing_ac_coverage: string[]`（未覆盖 AC ID 列表）; `checked_phases: string[]`（已扫描的 phase 报告路径）; `violations: object[]`（每条含 `ac_id`, `reason`, `exit_code` 字段） |
| **validation rules** | `missing_ac_coverage` 为空数组时 trace-check 通过；非空时触发 D7 颜色门；每条 violation 须有 `ac_id`（格式 `^AC-\d+$`） |
| **version compatibility** | 新增文件，无历史版本兼容约束 |

---

## Contract 2: test-strategy.md（YAML front-matter + Markdown）

| 字段 | 说明 |
|------|------|
| **contract name** | test-strategy |
| **owner side** | test-strategy skill（子代理写入） |
| **consumer side** | verify-code 主技能（机器核查步骤读取），trace-check（查痕引用） |
| **required fields/types** | YAML front-matter 含 `ac_routes: {[AC_ID: string]: "P0"\|"P1"\|"P2"\|"P3"\|"skip"}` |
| **validation rules** | AC ID 格式 `^AC-\d+$`；路由值只允许 `P0/P1/P2/P3/skip`；缺 route → `MISSING_ROUTE: {AC_ID} has no route in test-strategy.md`；未知 ID → `UNKNOWN_AC: {AC_ID} not found in spec AC list` |
| **version compatibility** | 新建文件；格式由 FR-STRATEGY-001 spec 阶段拍板，不向后兼容旧格式 |

---

## Contract 3: freshness.mjs 四段校验输出（mtime_violations[]）

| 字段 | 说明 |
|------|------|
| **contract name** | freshness-violations |
| **owner side** | `freshness.mjs`（扩展后写入） |
| **consumer side** | verify-code 主技能（stage-result 颜色门 FR-COLOR-001 读取） |
| **required fields/types** | `mtime_violations: object[]`，每条含 `segment`（1/2/3/4 或 "l3-iron"），`file`（报告路径），`reason`（string），`expected_sha`（string），`actual_sha`（string） |
| **validation rules** | 段序号 1=phase-N.md, 2=RED报告, 3=GREEN报告, 4=L2报告；L3 git_sha 铁律独立标记 segment="l3-iron"；任一违反 → 触发 D7 red |
| **version compatibility** | 扩展自现有 freshness.mjs；新增段 2/3/4 和 l3-iron，段 1 保持兼容；`mtime_violations[]` 字段名不变 |

---

## Contract 4: evidence/stage-summary.jsonl

| 字段 | 说明 |
|------|------|
| **contract name** | stage-summary-record |
| **owner side** | verify-code 主技能（开始/结束各 append 一行） |
| **consumer side** | 机器验证（统计行数=2，顺序 start→end） |
| **required fields/types** | 每行 JSON: `{"event":"stage_summary","phase":"start"\|"end","ts":"<ISO8601>"}` |
| **validation rules** | 文件中 `"event":"stage_summary"` 行数必须=2；第1行 phase="start"，第2行 phase="end"；不符视为验证失败，记入质量事实第 4 项 |
| **version compatibility** | 新建文件，追加写（append），不覆盖 |

---

## Contract 5: l3-e2e-report.json（via isolated-browser-qa）

| 字段 | 说明 |
|------|------|
| **contract name** | l3-e2e-report |
| **owner side** | isolated-browser-qa 技能（D4 直接复用，写入） |
| **consumer side** | freshness.mjs L3铁律校验（FR-L3IRON-001），stage-result 颜色门 |
| **required fields/types** | `git_sha: string`（当前 HEAD SHA）; `flaky_failure: boolean`（偶发失败标记）; screenshots 路径归 `evidence/screenshots/` |
| **validation rules** | `git_sha` 必须与当前 HEAD 匹配，不一致 → mtime_violations[] 记录 l3-iron，触发 red；`flaky_failure=true` 且其余通过 → yellow |
| **version compatibility** | 复用 isolated-browser-qa 既有输出契约，不改造 skill 本身；本契约仅说明 verify-code 消费侧读取的字段 |

---

## Contract 6: stage-result status 三色 schema

| 字段 | 说明 |
|------|------|
| **contract name** | stage-result-status-v2 |
| **owner side** | verify-code 主技能（stage-result 写入） |
| **consumer side** | 下游流程（make-decision 等读取 status 字段） |
| **required fields/types** | `status: "green"\|"yellow"\|"red"`（破坏性变更：原 `"green"\|"red"` 升为三色） |
| **validation rules** | green=全通；yellow=偶发失败或非关键AC缺失；red=freshness违反/L3铁律/关键AC缺失/test-strategy核查失败 |
| **version compatibility** | 破坏性变更（spec 档位 C），下游消费者需适配新增的 yellow 值 |
