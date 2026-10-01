# build-plan 阶段 evidence 归档（CARD-03）

本目录把 build-plan 起草期只存在于 `/tmp` 的 RED 原件、基线原件与起草期工具复制进仓库，逐文件核过 sha256（与原件一致，`mismatch_flag=0`），并把 `spec.md` 与 `phases/*.md` 里那 35 处 `/tmp` 引用改成仓库相对路径。归档时点：HEAD `8b2ca1d9`（工作树干净）。这些是**只读原件**，不是交付物，不进任何 Phase 写集。

## 路径映射规则

| 旧路径 | 新路径（仓库相对） |
| --- | --- |
| `/tmp/card03-bp/red/<name>` | `specs/workflowhub-thin-core-card-03-20260919/evidence/build-plan/red/<name>` |
| `/tmp/pb-land/evidence/<name>` | `specs/workflowhub-thin-core-card-03-20260919/evidence/build-plan/baseline/<name>` |
| `/tmp/card03-bp/sim-t014.mjs` | `specs/workflowhub-thin-core-card-03-20260919/evidence/build-plan/tooling/sim-t014.mjs` |

`red/` 是 `/tmp/card03-bp/red/` 的**全量**副本（51 项：49 份 `.txt` + `P2-selfcheck.json` + `P6-T015-service.json`）；`baseline/` 是 `/tmp/pb-land/evidence/` 的全量副本（13 份）。材料逐名引用的是其中 30 份，见下表；其余是同一目录里其它草稿的产物，一并归档以便 `spec.md:243` 的 `red/*.txt` 集合引用仍可解析。

## 逐份文件是什么、哪几张卡引用它

`red/`（下表「引用处」为改指后的材料位置）：

| 引用处 | 文件 | 是什么 |
| --- | --- | --- |
| `P1.md:31` | `P1-baseline-adjacent.txt` | P1 相邻回归六文件基线（3 失败文件 / 4 失败测试） |
| `P1.md:58` | `P1-T001.txt` | T001 RED（`Tests 12 failed | 5 skipped (17)`） |
| `P1.md:83` | `P1-T002.txt` | T002 RED（`Tests 6 failed | 14 skipped (20)`） |
| `P2.md:30` | `P2-baseline-territory.txt` | P2 领地基线（exit 1，23 失败 / 79） |
| `P2.md:30`、`P2.md:59` | `P2-baseline-smoke-specprd.txt` | spec-prd / smoke 基线（smoke 两条缺陷用例本来就红） |
| `P2.md:36`、`P2.md:115`、`P5.md:105` | `P2-adapter-reachability.txt` | P2/T014 adapter 可达性复现（exit 1，9 失败 / 8 通过，17） |
| `P2.md:57`、`P2.md:60` | `P2-T003.txt` | T003 RED（`Tests 1 failed | 2 passed | 9 skipped`） |
| `P2.md:82`、`P2.md:85` | `P2-T004.txt` | T004 RED（`Tests 5 failed | 7 skipped`） |
| `P2.md:107` | `P2-T005.txt` | T005 RED（`Tests 4 failed | 8 skipped`） |
| `P2.md:66`、`P2.md:115` | `skill-closure.txt` | check:skill-closure 3 条既有红基线 |
| `P2.md:115` | `baseline-material-producer-consumer-roundtrip.txt` | roundtrip 基线（旧模板前提） |
| `P2.md:115` | `baseline-distribution-closure.txt` | 分发闭包基线 |
| `P3.md:61` | `P3-T006.txt` | T006 RED（runtime-binding 7 失败；binding 7 失败 / 12 通过） |
| `P3.md:86` | `P3-T007.txt` | T007 RED（`Tests 1 failed | 4 passed`） |
| `P4.md:33`（目录引用）、`P4.md:60` | `P4-T008.txt` / `P4-T008-after-hostfix.txt` | T008 §二十一 反转前后的 RED |
| `P4.md:85` | `P4-T009.txt` / `P4-T009-after-defect3.txt` | T009 加缺陷③用例前后的 RED |
| `P4.md:110` | `P4-T010.txt` | T010（exit 0，本来就通过的执行记录） |
| `P4.md:136` | `P4-T011.txt` | T011 RED（`Tests 3 failed | 3 passed`） |
| `P4.md:144` | `baseline-review-materials-contract.txt` | P4 相邻基线（review-materials-contract 2 失败 / 54） |
| `P4.md:144` | `baseline-governance-review-dispatch-boundary.txt` | 基线红①：`:27` 要求 `docs/standard-workflow.md` 已删句（现由 P4/T016 改断言） |
| `P4.md:144` | `stage-routing.txt` | 基线红②：`:188` 要求 `steps.json:6` 的「独立」措辞（现由 P4/T016 改断言） |
| `P5.md:55` | `P5-T012.txt` | T012 RED（`Tests 2 failed | 2 passed`） |
| `P5.md:80` | `P5-T013.txt` | T013 RED（`Tests 5 failed | 28 passed`） |
| `P5.md:105` | `P5-T014.txt` | T014 RED（Test Files 2 failed，`Tests 4 failed | 5 passed`） |
| `P5.md:97` | `P5-T014-adapter-sim.txt` | T014 adapter 模拟（临时副本只改 ⑧：9 failed → 6 failed / 11 passed） |
| `P5.md:105` | `baseline-post-phase-contract.txt` | post-phase-contract 基线（4 failed / 12 passed） |
| `P5.md:105` | `baseline-phase-quality-handoff.txt` | phase-quality-handoff 基线（2 failed / 8 passed） |
| `P6.md:58` | `P6-T015.txt` | T015 RED（Test Files 1 failed，`Tests 6 failed | 5 passed`） |

`baseline/`：

| 引用处 | 文件 | 是什么 |
| --- | --- | --- |
| `P6.md:34` | `baseline-failures.txt` | 38 条基线失败测试名（P6 的 `BASELINE_FAILURES` 固化来源） |
| `P6.md:34` | `baseline.txt.files` | 33 个基线文件清单（`BASELINE_FILES` 固化来源） |
| `P6.md:49`（目录引用） | `baseline.txt`、`baseline.txt.names`、`post-change.txt`、`post-change.txt.files`、`post-change.txt.names`、`post-failures-raw.txt`、`post-change-missing-file.txt`、`lint-registration-head.txt`(`.codes`)、`lint-registration-post.txt`(`.codes`) | 同一次基线采集的原始输出、改名/消失文件与 lint 记录 |

`tooling/`（材料未逐名引用，主动归档，只作复现指引）：

| 文件 | 是什么 |
| --- | --- |
| `gen-index.mjs` | `node gen-index.mjs <specs-dir>`：从各 Phase 头部重推导 `phases/index.md` 六列（本轮重跑两次，二次 diff = 0 行，幂等） |
| `validate-post.mjs` | `node validate-post.mjs <repo-root> <specs-dir>`：独立调用官方 `validatePostPhaseContract` 与 `projectPostPhaseAcceptanceExecutionData`（本轮 `ok=true error_count=0`） |
| `sim-t014.mjs` | T014 起草期模拟脚本（复刻两个测试断言，确认新期望可全绿；材料在 `P5.md:97` 引用） |
| `skeleton.md`、`contract.md`、`remaining.md` | 起草期骨架、契约与剩余项草稿（材料未引用，作背景保留） |

## 不存在的 / 丢失的原件、以及有意不改的 `/tmp` 引用

- 材料逐名引用的 `/tmp/card03-bp/red/*` 与 `/tmp/pb-land/evidence/*` 文件**全部存在**，没有丢失项、没有替代件、没有编造。
- `tests/acceptance/card-03-current.mjs`（第 25 行一带注释）里含 `/tmp/pb-land/evidence/...` 路径。它是代码文件、不在本任务允许改动的范围（只许改 `specs/**`），本轮未改，只在此登记；其基线常量与 `baseline/baseline-failures.txt`、`baseline/baseline.txt.files` 一致（38 条 / 33 文件）。
- `decision-log.md`、`design.md` 与 `evidence/forensics/*.md` 里的 `/tmp/wh-card03-session-analysis/*`、`/tmp/pb-forensics/*`、`/tmp/pb-audit/*`、`/tmp/card03-draft/*` 等路径是决策登记与法证材料内部的历史产出路径（forensics 副本按设计只在其 H1 标题下加 3 行来源说明、正文一字未动），本轮**不改**，也不在此归档。
