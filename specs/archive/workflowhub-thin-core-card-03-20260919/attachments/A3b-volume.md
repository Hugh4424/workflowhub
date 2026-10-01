# A3b — 计数与体量取证报告

- 任务：`workflowhub-thin-core-card-04-20260919`
- 外置任务目录 **T** = `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919`
- CARD-04 工作树 **W** = `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`
- 口径：只读；仅 `find/du/wc/stat/shasum/python3-json` 聚合；未 `cat` 任何大文件；未接触 `events.jsonl`/`idx.tsv`/`outputs.jsonl`/`texts.jsonl`/任何 79MB rollout 转录；未跑仓库测试；未改任何文件。

## 1. 任务目录体积解剖（T）
`du -sh $T` = **173M**；`find -type f | wc -l` = **7469**；`find -type d | wc -l` = **1220**。坐标给的「7,469 文件 / 173 MB」**核实一致**。

| 一级子目录 | 文件数 | 体积(B) | 占比 |
|---|---:|---:|---:|
| `quality/` | 7370 | 163,235,050 | 99.9% |
| `identity/` | 97 | 121,466 | 0.07% |
| `locks/` | 0 | 0 | 0 |
| 顶层散文件（`facts.jsonl` 5,258 + `task.json` 540） | 2 | 5,798 | <0.01% |
| **合计** | **7469** | **163,362,314** | 100% |

| `quality/` 二级 | 文件数 | 体积(B) | | `quality/evidence/` 三级 | 文件数 | 体积(B) |
|---|---:|---:|---|---|---:|---:|
| `evidence/` | **6929** | **161,131,598** (98.7%) | | `stage-quality/` | **6580** | **159,384,917** |
| `reviews/` | 93 | 1,653,685 | | `acceptance/` | 218 | 240,955 |
| `facts/` | 267 | 295,483 | | `prewritten-red/` | 33 | 356,876 |
| `tests/` | 70 | 142,756 | | `stage-quality-missing/` | 31 | 11,517 |
| `decisions/` | 1 | 5,918 | | `build-code-targeted/` | 24 | 416,019 |
| `confirmations/` | 8 | 3,985 | | `stage-reflection-availability/` | 24 | 14,616 |
| `oracle/` | 2 | 1,625 | | 其余 4 类 | 19 | 706,698 |

**扩展名 top（文件数 / 体积B）**：`.md` **2604 / 95,391,566（占全库 58.4%）**；`.json` 2435 / 27,990,787；`.mjs` 1680 / 34,024,583；`.txt` 466 / 3,668,436；`.yaml` 48 / 319,647；`.snapshot-manifest` 42；`.output` 39 / 100,333；`.sh` 30 / 132,576；`.jsonl` 25 / 89,399；无扩展名 18；`.tsv` 3 / 625,218；`.diff` 4 / 439,074。

**最大文件 top3**：3,452,507 B 的 `plan.md` ×3（见 §2.6）；`P6/T025-p5-docker-2cd77ac1fc5f-ro-after.stderr.raw.txt` 813,539 B；`build-code/stage_end_spec_analyze-c4f1ab3b…json` 721,329 B。

## 2. 证据目录膨胀
### 2.1 复盘数字指向「工作树 W」，不是外置任务目录 T
复盘称「证据目录约 **2,774 文件 / 28 MB**，其中 **P10 约 940 个**」。实测两个 build-code 证据根：

| 证据根 | 文件数 | `du -sh` | 字节和 | P10 文件数 | P10 字节 |
|---|---:|---:|---:|---:|---:|
| **W** `/quality/evidence/stage-quality/build-code` | **2777** | **28M** | 22,088,862 | **940** | 8,127,008 |
| **T** 同名路径 | **6448** | **166M** | 159,150,713 | 171 | 1,731,688 |

**判定：核实一致——但归属路径必须更正。** 三项声明与 **W** 完全吻合（`du -sk` W=28308 / T=170132；`du -sh W/quality`=28M、`T/quality`=173M）。W 的 `quality/` 是**真实目录非符号链接**（`stat -f %HT`→`Directory`、`readlink` 空），递归 2848 文件 / 22,596,867 B；全库只有 W、T 两个名为 `P10` 的目录。T 侧同名路径实测 6448 文件 / 166M，**与声明相差 2.3× 文件数、5.9× 体积**——差距来自 §2.4 的三份整树快照。

### 2.2 按 build-code 分组
| 组 | W 文件数 | W 字节 | T 文件数 | T 字节 |
|---|---:|---:|---:|---:|
| P1 | 166 | 582,361 | 102 | 845,159 |
| P2 | 59 | 148,842 | 33 | 104,868 |
| P3 | 110 | 636,372 | 7 | 46,121 |
| P4 | 140 | 1,261,382 | 6 | 42,727 |
| P5 | 242 | 1,101,842 | 193 | 3,290,228 |
| P6 | 332 | 1,028,653 | 141 | 2,425,533 |
| P7 | 121 | 5,353,237 | 11 | 87,232 |
| P8 | 211 | 1,446,654 | 36 | 689,873 |
| P9 | 154 | 485,001 | 5 | 42,593 |
| **P10** | **940** | **8,127,008** | 171 | 1,731,688 |
| P11 | 211 | 921,164 | **5655** | **148,167,270（93.1%）** |
| P12 | 30 | 118,673 | **0（无此目录）** | 0 |
| P13 | 35 | 510,365 | 12 | 62,615 |
| 其他（`current-progress-*`、`first-official-stage-row-*`、散文件） | 16 | 304,407 | 76 | 1,614,806 |
| **合计** | **2777** | **22,088,862** | **6448** | **159,150,713** |

→ T 侧缺 P12；P3/P4/P9 在 T 侧仅 5–7 文件 vs W 侧 110/140/154 ⇒ **T 是部分证据，不是 W 的完整镜像**。

### 2.3 文件类型分布（W 侧按扩展名归并；原始测试输出=`.txt/.raw/.output/.stderr/.stdout/.log/.exit`）
| 组 | 原始测试输出 | 指纹(.sha256) | 说明 md | 其他 json | mjs | 补丁 |
|---|---:|---:|---:|---:|---:|---:|
| P1 / P2 | 96 / 24 | 6 / 1 | 16 / 7 | 44 / 26 | 0 / 2 | 4 / 1 |
| P3 / P4 | 50 / 74 | 6 / 3 | 10 / 13 | 43 / 41 | 1 / 8 | 0 / 1 |
| P5 / P6 | 151 / 206 | 5 / 17 | 43 / 43 | 20 / 47 | 19 / 16 | 4 / 8 |
| P7 / P8 / P9 | 28 / 101 / 65 | 0 / 16 / 2 | 23 / 18 / 13 | 32 / 67 / 70 | 28 / 6 / 4 | 4 / 3 / 0 |
| **P10** | **559** | **65** | **111** | **110** | **70** | **16** |
| P11 / P12 / P13 | 105 / 9 / 6 | 6 / 1 / 0 | 18 / 4 / 10 | 77 / 15 / 8 | 0 / 1 / 5 | 3 / 0 / 6 |

### 2.4 T 侧 P11 = 三份近乎相同的整工作树快照（膨胀主因）
| 子目录 | 文件数 | 字节 |
|---|---:|---:|
| `P11/T022-single-browser-red-20260927`（含 `full-pre-change-worktree/`） | 1866 | 48,790,338 |
| `P11/T022-actual-producer-red-v2-final-20260927`（含 `host-only-source-before-v2/`） | 1856 | 47,414,780 |
| `P11/T022-actual-producer-red-v2-20260927`（含 `host-only-source-before-v2/`） | 1854 | 47,409,306 |
| `P11/T022-same-source-projection-v3-20260927` | 26 | 1,388,618 |
| 其余 4 个 `T022-*`（blocked-missing-freshness×2 / browser-ac-mixed / browser-ac-binding） | 53 | 3,164,228 |

三份大快照合计 **5,576 文件 / 143,614,424 B = T 侧 build-code 证据的 90.2%**；每份是完整工作树（含 `specs/`、`runtime/`、`.git/` 等）。

### 2.5 重复量化（T 侧 build-code 6448 文件 / 159,150,713 B）
`duplicated_files=3849  wasted_bytes=97,258,563（61.1%）`（口径：同 basename + 同字节数，第 2 份起计入）。
最大重复组（份数 / 浪费 B / 单份 B）：`plan.md` ×3 / 10,357,521 / 3,452,507；`remedial-review-input.json` ×3 / 1,698,402 / 566,134；`prd.md` ×3 / 1,660,038 / 553,346；`decision-log.md` ×3 / 1,571,256 / 523,752；`stage-content-contracts.mjs` ×3 / 1,359,990 / 453,330；`stage-runner.mjs` ×5 / 1,305,560 / 261,112；`stage-runner.mjs` ×5 / 1,277,655 / 255,531；`stage-handlers.mjs` ×5 / 237,936；`build-spec-review-input-v6.json` ×3 / 351,798；`tasks.md` ×3 / 313,436。

### 2.6 三个「同一结论多份副本」实例
1. **`plan.md` ×3，各 3,452,507 B，sha256 前 16 位均为 `cbc8c3a6a587776c`（逐字节相同）**：
   - `T/quality/evidence/stage-quality/build-code/P11/T022-single-browser-red-20260927/full-pre-change-worktree/specs/archive/workflowhub-mechanism-simplification-t3-20260912/plan.md`
   - `T/quality/evidence/stage-quality/build-code/P11/T022-actual-producer-red-v2-final-20260927/host-only-source-before-v2/specs/archive/workflowhub-mechanism-simplification-t3-20260912/plan.md`
   - `T/quality/evidence/stage-quality/build-code/P11/T022-actual-producer-red-v2-20260927/host-only-source-before-v2/specs/archive/workflowhub-mechanism-simplification-t3-20260912/plan.md`
2. **`pre-v2-source-manifest.json` ×2，sha256 不同**（`ac395e00091c15fa` vs `35d0e919ba5e6e29`），分处 v2-final 与 v2 两份快照根。
3. **`AC-16`…`AC-34` 指纹 JSON = 38 文件 / 19 对**，每对 523 B 与 534 B（仅差 11 B；mtime 分别 09-27 21:36、09-28 01:29）。

## 3. 正式 Phase 审查逐次清单
**定义**：`T/quality/reviews/attempts/<uuid>/attempt.json`（schema `wh-review-attempt.v1`，策略 `wh_review.v2`）中 `stage=build-code` ∧ `subject_kind="phase"` ∧ `phase_id` 非空。
**已排除的同名非正式产物**：`P5/T008-real-t007-fixture-20260927/nested-canonical-runs/fixture-*/phase-review-result.json` ×6（测试夹具）；`P10/T020-phase-review-official-20260927-b6498394/`（12 文件/302,938 B）与 `P10/T020-phase-review-request-draft-20260927/`（7 文件/341,981 B）（夹具/草稿）；`stage-quality-missing/build-code/phase_review-fae7777e…json`；`W/.planning/2026-09-19-workflowhub-deferred-closeout/p{1..5}-phase-review-request.json`（1,045/1,151/1,063/708/1,124 B，均 09-22 19:41）。
> 下表路径前缀：`A=` `T/quality/reviews/attempts/`；`R=` `T/quality/reviews/results/`；`P=` `T/quality/reviews/reports/`

| # | Phase | mtime | 类型 | 有效? | 路径 | 体积(B) |
|---:|---|---|---|---|---|---|
| 1 | **P1** | 09-26 19:47 | attempt | **不可用**(`unavailable`，无 result) | `A/e7623be1-6f1d-5258-aded-9b1e72812074/attempt.json` + `P/build-code-simple-e7623be1-….md` | 5,243 + 47,245 |
| 2 | **P2** | 09-26 21:37 | attempt→result | 有效(`semantic`) | `A/68ef7817-c3bd-5b84-a444-4e2304423403/attempt.json` + `R/build-code-simple-68ef7817-….json` + `P/….md` | 5,192 / 60,396 / 121,650 |
| 3 | **P3**① | 09-26 21:54 | attempt→result | 有效 | `A/e0d109e4-be5d-5ad1-a137-cb7d47c5696c/attempt.json` + `R/build-code-simple-e0d109e4-….json` + `P/….md` | 5,194 / 22,534 / 68,311 |
| 4 | **P4**① | 09-26 22:17 | attempt→result | 有效 | `A/3d13aab6-f60e-535a-a050-12707123d310/attempt.json` + `R/build-code-simple-3d13aab6-….json` + `P/….md` | 5,194 / 33,702 / 79,164 |
| 5 | **P8** | 09-26 22:47 | attempt→result | 有效 | `A/e6a78c63-9d28-5b2f-aa78-b0a89ec924fd/attempt.json` + `R/build-code-simple-e6a78c63-….json` + `P/….md` | 5,193 / 26,106 / 69,999 |
| 6 | **P7**① | 09-26 22:58 | attempt | **不可用** | `A/3cf5854b-2d38-5934-aff2-7efa815649cb/attempt.json` + `P/build-code-simple-3cf5854b-….md` | 2,264 + 1,335 |
| 7 | **P7**② | 09-26 23:20 | attempt→result | 有效 | `A/9fa24202-246a-5c83-a92a-45d4f3bfb1ee/attempt.json` + `R/build-code-simple-9fa24202-….json` + `P/….md` | 5,193 / 35,865 / 86,203 |
| 8 | **P9** | 09-26 23:44 | attempt→result | 有效 | `A/99581ac4-c4d0-5061-ae6d-47e699a1b302/attempt.json` + `R/build-code-simple-99581ac4-….json` + `P/….md` | 5,194 / 27,383 / 73,741 |
| 9 | **P3**② | 09-28 00:57 | attempt→result | 有效 | `A/4f2643f1-2185-507d-ad19-ec19bedb433b/attempt.json` + `R/build-code-simple-4f2643f1-….json` + `P/….md` | 5,198 / 1,292 / 53,091 |
| 10 | **P4**② | 09-28 01:21 | attempt→result | 有效 | `A/1258c827-37b6-5f95-a408-d4028e3f1eb1/attempt.json` + `R/build-code-simple-1258c827-….json` + `P/….md` | 5,194 / 22,670 / 79,412 |

另有孤儿报告 `P/make-decision-simple-1a2e192a-6ef7-5780-ac4f-d896b539d28a.md`(1,097 B) 无对应 attempt 目录。

**核实复盘声明：**

| 声明 | 实测 | 判定 |
|---|---|---|
| 10 次尝试 | build-code×phase 的 attempt **恰 10 次** | **核实一致** |
| 7 个 Phase | P1/P2/P3/P4/P7/P8/P9 = **7 个** | **核实一致** |
| P3 与 P4 各两次 | P3 ✓、P4 ✓，但 **P7 也有两次**（3cf5854b 不可用 + 9fa24202 有效） | **不完整——漏报 P7** |

10 次中 **8 次产出 result**，**2 次不可用**（P1 的 e7623be1、P7 首轮的 3cf5854b，仅有 1,335–47,245 B 失败报告）。未被正式 Phase 审查覆盖：**P5、P6、P10、P11、P12、P13（6 个）**。
`reviews/attempts/` 共 **22** 个目录：make-decision 7、build-plan 5、build-code 10（上述 10 次）。

## 4. 非正式复核规模（按 Phase）
**口径**：`quality/` 下**文件名含 `review` 或 `audit`**（大小写不敏感）的 `.md`，**排除** `quality/reviews/`（正式引擎输出）。
```bash
find "$ROOT/quality" -type f -name '*.md' | grep -iE '/[^/]*(review|audit)[^/]*\.md$' | \
  while read f; do p=$(echo "$f"|grep -oE '/(P[0-9]{1,2})/'|head -1|tr -d '/'); [ -z "$p" ] && p="(noP)"; \
  printf '%s\t%s\n' "$p" "$(stat -f %z "$f")"; done | \
  awk -F'\t' '{c[$1]++;b[$1]+=$2} END{for(k in c) printf "%-6s %4d files %10d B\n",k,c[k],b[k]}'
```
| Phase | W 文件数 | W 体积(B) | T 文件数 | T 体积(B) |
|---|---:|---:|---:|---:|
| **P10** | **26** | **141,353** | 2 | 9,812 |
| **P5** | **15** | **51,048** | 2 | 6,499 |
| P6 | 7 | 20,090 | 1 | 3,262 |
| P8 | 5 | 13,665 | 1 | 2,799 |
| P1 | 5 | 35,982 | 0 | 0 |
| P9 | 3 | 9,260 | 0 | 0 |
| P13 | 3 | 13,276 | 0 | 0 |
| P11 | 3 | 16,318 | 0 | 0 |
| P7 | 2 | 3,886 | 0 | 0 |
| P4 | 2 | 8,625 | 0 | 0 |
| P2 | 1 | 2,846 | 1 | 1,895 |
| P3 / P12 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| 不归属任何 P | 4 | 27,437 | 7 | 183,413 |
| **合计** | **76** | **343,786** | **14** | **207,680** |

**核实声明：** 「**P5 至少 15 份**」→ W 侧**恰好 15 份 / 51,048 B**；「**P10 至少 26 份**」→ W 侧**恰好 26 份 / 141,353 B**。两项均**核实一致（精确命中）**。
**归属更正（与 §2.1 同一模式）：** T 侧同口径只有 P5 = 2 份 / 6,499 B、P10 = 2 份 / 9,812 B，相差 7.5× 与 13× ⇒ 复盘体量数字**系统性地描述 W**，被误贴到 T 上。
P10 的 26 份全部落在 `W/quality/evidence/stage-quality/build-code/P10/`，mtime **集中在 09-27～09-28 两天**，命名模板化（`T02x-<主题>-independent-review-20260928.md`）；其中最大 `T020-runtime-workflows-31-audit-20260927/audit.md` 10,315 B、次大 `T021-material-independent-review-20260928.md` 9,728 B、最小 `T021-current-case-full-file-independent-review-20260928.md` 1,946 B。P5 的 15 份同样集中在 `.../build-code/P5/`，最大 `T007-advisory-ref-material-independent-review-20260928.md` 5,981 B、最小 `T008-parser-indent-independent-review-20260928.md` 1,869 B ⇒ 是**同一轮集中补写的复核说明**，非跨阶段自然积累。

## 5. 测试回执
回执原件目录 = **`T/quality/tests/`**（W 侧**无**此目录；W 全库仅 3 个 `*.receipt.json`）。
| 声明 | 实测 | 判定 |
|---|---|---|
| 外置任务有 **32 份测试回执** | `ls "$T/quality/tests"/*.json \| wc -l` = **32** | **核实一致（精确命中）** |

- 总体积 **38,986 B**（均 1,218 B/份；最大 `card04-P1-doc-gate.json` 2,415 B，最小 `card04-P4-L0-official-20260926.json` 1,082 B）。命名 `card04-P<N>-<描述>-<uuid8>.json`；mtime 跨 **09-26 19:35 ~ 09-28 05:17**。
- 按 Phase：P1 **1**、P2 **2**、P3 **3**、P4 **3**、P5 **2**、P6 **2**、P7 **4**、P8 **3**、P9 **4**、P10 **4**、P11 **3**、P12 **1**、**P13 0** ⇒ 合计 **32**。
- 配套（不计入 32）：`T/quality/tests/output/` **35** 个 `.output`（约 86 KB 原始 stdout）；`T/quality/tests/targeted/` **3** 个 json（5,791 B）；`T/quality/evidence/**/*.receipt.json` **8** 个 L0 回执（散落 P2/P3/P4/P5/P7×2/P8/P9）。`output/` 35 vs 回执 32 存在 3 份**有输出无回执**的落单文件，未逐一配对。

## 6. 一句话结论
**说明性产物不是膨胀主因；「把整棵工作树当证据反复拷贝」才是。**

| 度量 | 数值 | 占比 |
|---|---:|---:|
| T 全库 | **7,469 文件 / 163,362,314 B** | 100% |
| ① P11 下三份整工作树快照 | **5,576 文件 / 143,614,424 B** | 文件 **74.7%** / 体积 **87.9%** |
| ② 剔快照后的「真实任务证据与产物」 | 1,893 文件 / 19,747,890 B | 文件 25.3% / 体积 **12.1%** |
| ② 中说明性 `.md`（summary/handoff/复核/报告） | 104 文件 / 3,204,431 B | 占② **16.2%** |
| ② 中原始证据（测试输出/捕获 JSON/指纹/补丁） | 1,789 文件 / 16,543,459 B | 占② **83.8%** |
| 全库 `.md`（含快照内仓库自带文档副本） | 2,604 文件 / 95,391,566 B | 全库体积 **58.4%** |
| 原始测试输出类（`.txt/.output/.raw/.stderr/.stdout/.log`） | 513 文件 / 3,769,388 B | 全库 2.3% |
| 指纹类（`.sha256` / `*manifest*`） | 130 文件 / 2,949,012 B | 全库 1.8% |
| **同名同大小重复副本**（build-code 证据内） | **3,849 文件 / 浪费 97,258,563 B** | 证据体积 **61.1%**（≈全库 59.5%） |

- 剔快照后 **原始证据原件 : 说明性产物 = 1,789 : 104 ≈ 17.2 : 1**（文件数）；体积比 **16,543,459 : 3,204,431 ≈ 5.2 : 1**。
- 整树快照单独吃掉全库 **87.9% 体积**；其重复浪费（**97.3 MB**）是「真实任务证据」总体积（19.7 MB）的 **4.9 倍**。

## 未取证 / 不确定
| 项 | 状态与原因 |
|---|---|
| **复盘原文**（声称 2774/28MB/940/10 次/32 回执/15 份/26 份的那份文档） | **未取得**。在 `T/quality/reviews/reports/build-code-simple-*.md` 中 grep `2774`/`940` 只命中 sha256 十六进制子串（假阳性）。所有核实均为对**文件系统实体**的直接实测，**非**与复盘文本比对。 |
| T 侧三份 P11 快照是否**整树逐字节相同** | **未取得**。仅对 `plan.md` 做了 sha256 验证；全树哈希成本高未做。 |
| `T/quality/facts/` 267 个内容寻址 JSON 的语义 | **未取得**（只统计数量 267 / 体积 295,483 B / 269 子目录），未读内容。 |
| `identity/` 97 文件 / 121,466 B 的构成 | **未取得**，未逐项解剖。 |
| 「非正式复核」的**唯一权威口径** | **未取得**。§4 的口径能精确命中 15/26，但未见复盘原文的定义，无法排除其他口径。 |
| W 与 T 两份 `quality/` 的先后/复制关系 | **未取得**（无时间线凭证比对）。 |
| `quality/tests/output/` 35 份与 32 份回执的配对关系 | **未取得**，未逐一比对。 |
| `events.jsonl`、`idx.tsv`、`outputs.jsonl`、`texts.jsonl`、79MB rollout 转录 | **按硬规则未接触**。 |
