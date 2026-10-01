# PaperBuilder build-code 取证报告（只读）

> 来源·产出：card-03 落地流程派发的只读取证子代理（事故取证 / 根因分析；未改仓库任何文件）
> 来源·时间：2026-09-29 18:33（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §17 M5（销毁性动作适用既有 F7 边界）

取证范围：`W2 = /Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-live-simulation-durability-post-20260925`、
`main = /Users/Hugh/Hugh/Project/PaperBuilder`、`W1 = /Users/Hugh/Hugh/Project/PaperBuilder-live-simulation-durability`。
所有结论来自 `git -C <repo> <只读命令>` 与 ls/du/find/shasum/grep -c。

## 一、带数字的结论

1. **零提交。** 三树 HEAD 全是 `3012a32`（= `origin/main`），`rev-list --left-right --count main...HEAD` = `0 0`；build-code 的全部代码改动都在**未提交工作区**里，没有推送、没有合并。
2. **两份互相冲突的改动。** `main` 工作区自己就脏着 5 files / +119 −9，`W2` 是 39 files / +3169 −531；三个重叠文件（`paperbuilder/application/v2_strategy_bridge.py`、`runtime_ops/v2_execution_worker.py`、`tests/application/test_v2_live_execution_worker.py`）在 main 与 W2 里 `diff -q` **全部 DIFFER**；另有两个测试文件只在 main 被改（`tests/application/test_v2_execution.py` 55/0、`tests/application/test_v2_strategy_bridge.py` 32/0）。
3. **改动规模。** W2：39 files changed, 3169 insertions(+), 531 deletions(-)；目录聚合 paperbuilder 2106 / tests 613 / runtime_ops 557 / scripts 307 / frontend 117 行。
4. **测试被削减。** W2 diff 删除 `def test_` 3 处、新增 12 处；单文件 `tests/application/test_v2_live_execution_worker.py` 删 146 行、`runtime_ops/v2_execution_worker.py` 删 134 行、`scripts/serve_f6.py` 删 80 行。
5. **规格树没有证据文件。** `W2/specs/paperbuilder-live-simulation-durability-post-20260925/` 共 19 files，**全部 .md、0 个非 md**；`evidence/` 下 8 个子目录（build-code、build-plan/{red,test-change}、context-archive、decisions、drafts、interactions、research、runtime-snapshots）**每个 0 files，合计 0 B**——而材料里 `evidence/build-plan` 被引用 36 次、`evidence/build-code` 3 次。
6. **三份同义材料。** `decision-log.md` / `spec.md` / `phases/P1–P6.md` 各存在 **3 份**：`specs/...`（399,067 B / 111,453 B）、`specs/.../legacy/20260929-before-lean-rebaseline/`（394,793 B / 107,765 B，10 files 744K）、`.planning/2026-09-29-live-core-simplification/lean-material-20260929/`（4,706 B / 7,267 B）。所谓 lean rebaseline 后 current 反而**比 legacy 更大**（decision-log +4,274 B、spec +3,688 B）。
7. **main 里有一份孤儿规格副本。** `main/specs/paperbuilder-live-simulation-durability-post-20260925/` 只有 1 个文件：`evidence/build-code/p2-t006-resume-feature-rewarm-card.md`（2,847 B）；inode 814975950，W2 同名目录 inode 810253467 → 是复制品而非链接。
8. **新测试从未入库。** `W2/tests/test_t14_intraday_contrast.py`（8.0K）是 untracked，但同目录 `tests/__pycache__/test_t14_intraday_contrast.cpython-312-pytest-8.4.1.pyc` 存在 → 跑过、没 add。
9. **两套活跃计划并存。** `.planning/.active_plan` 在 W2 是 `2026-09-29-live-core-simplification`，在 main 是 `2026-09-22-three-live-simulation-validation`。
10. **素材缺口。** `PaperBuilder-purge-20260928.ndjson.gz` 存在（990,943,461 B），其 `.index.json` **不存在**。未跟踪体积：W2 1.6M（.planning 160K/24 files + specs 1.5M + t14 8K），main 92K。

## 二、三树状态表

| 树 | 分支 | HEAD | detached | vs main | porcelain | 构成 | 未跟踪体积 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| main | `main` | 3012a32 | 否（upstream `origin/main`） | `0 0` | 7 | 5 M + 2 ?? | 92K（.planning 88K/10 files；specs 副本 1 file 2,847 B） |
| W1 | `task/PaperBuilder/paperbuilder-live-simulation-durability` | 3012a32 | 否 | `0 0` | 1 | 0 M + 1 ??（`specs/paperbuilder-live-simulation-durability/`） | — |
| W2 | `task/PaperBuilder/paperbuilder-live-simulation-durability-post-20260925` | 3012a32 | 否 | `0 0` | 42 | 39 M + 3 ?? | 1.6M |

`worktree list` 另含 `~/.codex/worktrees/{2aea,4d6e,d392}`（ef7bcd2 / dba428f detached ×2）。

## 三、改动规模表

| 仓库 | files | insertions | deletions | 说明 |
| --- | --- | --- | --- | --- |
| W2 vs HEAD | 39 | 3169 | 531 | 全在工作区，未提交 |
| main vs HEAD | 5 | 119 | 9 | 与 W2 版本冲突的独立改动 |

W2 删除行 Top：`tests/application/test_v2_live_execution_worker.py` 146、`runtime_ops/v2_execution_worker.py` 134、`scripts/serve_f6.py` 80、`v2_execution_store.py` 47、`v2_current_market.py` 43。
W2 新增行 Top：`v2_current_market.py` 499、`v2_execution_store.py` 447、`v2_execution_worker.py` 405、`storage_retention.py` 310、`v2_contrast.py` 250、`serve_f6.py` 227。
新增行 marker：`unavailable` 16、`placeholder` 6、`skip` 1、`temporary` 1；TODO/FIXME/mock/stub/NotImplementedError = 0。

## 四、垃圾 / 重复产物清单

- `W2/specs/.../evidence/**`：8 目录、0 文件、0 B（纯空壳，但被材料引用 41 次）。
- `W2/specs/.../legacy/20260929-before-lean-rebaseline/`：10 files / 744K，自述为「earlier task, not current live-core requirements」，与 current 三份同义。
- `W2/.planning/.../lean-material-20260929/`：第三份 decision-log/spec/phases。
- `main/specs/paperbuilder-live-simulation-durability-post-20260925/`：孤儿 1 file / 2,847 B。
- `W2/tests/__pycache__/test_t14_intraday_contrast.*.pyc`：未入库测试的运行残留。
- `main/.planning/2026-09-2{2,3,4}-*/`：10 files / 88K 旧计划，与本次无关。
- 素材缺口：`PaperBuilder-purge-20260928.index.json` 缺失。

## 五、对主干的风险（若要合并）

伤人（5 条）：
1. `runtime_ops/v2_execution_worker.py` 405/134 —— 与 main 工作区里那份 1 行的同名改动**直接冲突**，且是 live owner/retry 核心路径。
2. `paperbuilder/components/c2_storage/v2_execution_store.py` 447/47 与 `storage_retention.py` 310/2 —— C2 存储层大幅重写，共 531 行删除集中在 live 路径。
3. `paperbuilder/application/v2_current_market.py` 499/43 —— 单文件近 500 行新增，无可用的 evidence 产物佐证。
4. `scripts/serve_f6.py` 227/80 —— 服务入口被改写，连带 `tests/test_serve_f6_queue.py` 8 行删除。
5. `tests/application/test_v2_live_execution_worker.py` 146 行删除（全 diff 3 个 `def test_` 消失）—— 合并等于削减回归覆盖。

可丢弃（5 条）：
1. `main/specs/paperbuilder-live-simulation-durability-post-20260925/`（1 file / 2,847 B 孤儿）。
2. `W2/specs/.../evidence/`（8 空目录、0 B）。
3. `W2/specs/.../legacy/20260929-before-lean-rebaseline/`（744K，自述非当前需求）。
4. `W2/.planning/2026-09-29-live-core-simplification/lean-material-20260929/`（第三份同义材料）。
5. `W2/tests/__pycache__/test_t14_intraday_contrast*.pyc`（未入库测试的缓存）。

推送/合并情况：**没有**。三树 HEAD 均为 `3012a32` = `origin/main`，`rev-list` 计数 `0 0`，`log origin/main..HEAD` 为空；main reflog 最新提交停在 2026-09-24 amend。

## 六、矛盾证据（文件:行 / 提交）

1. `W2/specs/.../phases/index.md`：P4「退役，不进入 live path」——同一文件下方仍保留完整 CLI/VACUUM 方案；`phases/P4.md:1-14` 标题即「当前范围修订 + 完整历史 P4」，`CURRENT-P4-001 当前状态：RETIRED` 之下仍是完整历史方案。
2. `phases/index.md` 称 P2「当前活跃；等待真实日/故障证据」，而 `evidence/` 全空（0 files）。
3. `.planning/.../legacy-material-sha256-20260929.txt` 与 `current-material-sha256-20260929.txt` 两份 manifest `diff -q` = DIFFER，校验各自 OK（当前首值 `afb412e8fe4e…`，legacy 首值 `3af99755f7b8…`）：字节确实不同，但 `legacy/.../README.md` 自述 current 文件「retains the complete historical body」，等于 current = 历史正文 + CURRENT 段。
4. `spec.md:498`「Historical top-up and source receipt (… approved 2026-09-26)」仍在当前权威文件内，而 `legacy/.../README.md` 明说这些是「not current live-core requirements」。
5. `decision-log.md:57`「旧 17 AC…不属于当前验收分母」 vs `phases/P6.md` / `index.md`「旧 17 AC 仅历史」——退役声明自身被重复三处表述。
6. `main` 的 `paperbuilder/application/v2_strategy_bridge.py`（25/9）与 W2 的（26/0）内容不同，同一 HEAD 下两份版本。
7. `tests/application/test_v2_execution.py`、`tests/application/test_v2_strategy_bridge.py` 只在 main 被改，W2 无对应改动。
8. `.planning/.active_plan`：W2 `2026-09-29-live-core-simplification` / main `2026-09-22-three-live-simulation-validation`。
9. `tests/test_t14_intraday_contrast.py` 已跑出 `__pycache__` 却仍 untracked（对比 `paperbuilder/application/v2_contrast.py` 已 M）。
10. 任务素材声明的 `PaperBuilder-purge-20260928.index.json` 不存在，而 `.ndjson.gz` 990,943,461 B 存在。
