# Phase 2 Notes — m13-make-decision-v1 (Stage 3: S0–S4)

**Date**: 2026-06-29
**Executor**: build-code Phase 2

## 结果摘要

| 项目 | 值 |
|------|----|
| RED exit_code | 1 (26 failures / 54 tests) |
| GREEN exit_code | 0 (54/54 passed) |
| RED content_hash | `d454a36916c7f04f5d107b7df038ee8bafceb0aabb042a8ed3751c06ddf162f5` |
| GREEN content_hash | `cc9cb97471f4114271966daa8455fbfe071830e6cf6183c3d9e64a150a6974f7` |
| Hash differ | ✓ 是 |
| Phase 1 保留 | ✓ 28 条旧测试全过 |

## 改动文件

1. `tests/m13-make-decision.test.mjs` — 新增 Phase 2 describe 块（T005–T010），共 31 条新断言：
   - T005 (3): S0 section header, context loading, `s0_context_loaded` event
   - T006 (6): S0.5 section, lite/full tiers, no quick tier, lite skips S1, lite skips S3, `s0_5_scope` event
   - T007 (7): S1 section, full-only, ≥3 sub-agents, 5 categories, `internal-research-summary.md`, `s1_all_agents_failed`, non-blocking
   - T008 (6): S2 section, 一次一问, 三轮结构, presents summary, Q1 外部调研, 按影响排序
   - T009 (5): S3 section, muyu-search-mcp, anysearch, lite skip, `extra_sources`
   - T010 (4): S4 section, `s4_baseline_recorded`, `make-decision-original-context.md`, Q2 方向收敛

2. `workflows/make-decision/SKILL.md` — 新增 S0/S0.5/S1/S2/S3/S4 六节 prose 剧本（插入在 legacy Phase A/B 之前）

## 关键设计决策

- **no-quick 断言**：初版检查 `s05Idx+500` 内 `quick 档` 是否存在，但 SKILL.md 自身写了「无 quick 档」解释导致误判。修正为检查 `scope=quick` 或 `scope: quick` 字符串（真正的档位声明），不会误报负向说明。
- **lite 档跳过语义**：S0.5 和 S3 均使用 `skipped: scope=lite` 格式记录跳过事件，与 tasks.md 完成条件一致。
- **S1 非阻断**：全部 sub-agents 失败时记录 `s1_all_agents_failed: true` 并继续到 S2，不抛错不阻断。
- **台账渲染点①**：S4 节明确写入 `make-decision-original-context.md` 路径，满足 FR-LEDGER-01 要求，T011 可 depend T010。

## 未改动文件（符合 scope boundary）

- `config/workflowhub.yaml` — 未改
- `workflows/build-spec/SKILL.md` — 未改
- `workflows/build-plan/SKILL.md` — 未改
- `workflows/build-code/SKILL.md` — 未改
- `workflows/verify-code/SKILL.md` — 未改
