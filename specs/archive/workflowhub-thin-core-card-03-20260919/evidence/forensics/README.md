# PaperBuilder 事故取证与调研报告归档（`evidence/forensics/`）

本目录归档 **card-03 落地（提交 `8b452fc0`）与 §十七/§十八 决策登记所依据的 18 份报告类 `.md` 原件**。

## 目录说明

- **为什么归档**：`decision-log.md` §十七 与 §十八 的每条机制都由这些报告支撑，而原件此前只存在于 `/tmp/pb-forensics/`、`/tmp/pb-audit/`、`/tmp/pb-replay/`、`/tmp/pb-land/`（易失）。归档后结论可回溯到原始取证，不靠摘要覆盖来源。
- **只归档报告类 `.md`**：同批的 `.tsv`／`.py`／中间数据（`adds.tsv`、`errors.tsv`、`exec.tsv`、`writes.tsv`、`guard-*.txt` 等）未归档——它们是原始数据，不是报告，且体量与本卡决策面不成比例。
- **未改正文**：每份文件只在其 H1 标题下**加 3 行来源说明**（谁产出 / 何时 / 支撑哪条结论），正文一字未动；正文内的 `/tmp/**` 路径与行号仍按产出时点保留。
- **目录名选择**：本卡 `specs/workflowhub-thin-core-card-03-20260919/` 内**没有**既有 §14 系列证据目录（本卡证据在 Knowledge 任务根 `quality/evidence/**` 与 `/tmp/pb-land/evidence/**`），故不与任何既有目录冲突；`tools/cli/check-task-record-paths.mjs` 校验的是生产模块的直接文件系统写入者与 `specs` 字面派生，**不校验 `specs/<task-id>/` 的子目录名**。两个回退条件均未触发，因此采用 brief 的首选路径 `evidence/forensics/`，未改用 `evidence/paperbuilder-forensics/`。仓内已有 `specs/<task-id>/evidence/` 先例（`specs/workflowhub-ui-frontend-capability-20260904/evidence/`）。

## 索引（文件名 → 一句话内容 → 支撑哪一节决策）

| 文件 | 一句话内容 | 支撑的决策节 |
| --- | --- | --- |
| `proposal.md` | 三份根因报告合成的 M1–M5 方案本体（三份根因报告合成终稿） | `decision-log.md` §17（M1–M5 原始方案）；`design.md` §15 |
| `verify-proposal.md` | 对 `proposal.md` 7 条载重前提的对抗验证——推翻／修正 5 处措辞与前提 | §17 / `design.md` §15「对抗验证修正后」口径 |
| `verify-rootcause.md` | 对 7 条载重结论的独立复核（全部重跑命令、不采信转述） | §17 根因结论的独立来源 |
| `rootcause-control.md` | 「已跑偏信号一直存在，为什么没有任何机制据此停下」的根因与最少绊线 | §17 M3 卡住判据（无阈值） |
| `rootcause-phase-done.md` | 「一个 Phase 凭什么叫做完」的失效根因与执行层收敛判据 | §17 M2 Phase 收尾三件事；§18 E13 完成声明的上限 |
| `rootcause-plan-bloat.md` | 「build-plan 里再加一张卡为什么是局部最优」的根因 | §18 E1／E5／E6 |
| `bloat-and-guard.md` | 方案臃肿取证 ＋ `simplicity-guard` 使用判定 | §18 E14／E15／E16；「加与删同价」 |
| `bloat-sources.md` | build-plan 臃肿生成点逐点审计（引文逐字） | §18 E1／E5／E6 与 E14 删除类读数 |
| `repo-damage.md` | PaperBuilder build-code 仓库损伤取证 | §17 M5 销毁性动作边界 |
| `scope-creep.md` | build-code 越界取证（含 0 次 git commit 的事实） | §17 M5；§18 E10 |
| `time-and-process.md` | 101.9 h 会话时间都花在哪（转录流式扫描） | §17 全部机制的事故基线 |
| `coverage-a.md` | 过程与产物类问题 → card-03 设计档案覆盖判定（A 组） | §17／§18 落地前的覆盖判定 |
| `coverage-b.md` | card-03 设计档案 × build-code 事故覆盖判定（B 组：范围／臃肿／技能执行／验收真相） | §17／§18 落地范围裁定 |
| `agent-executability.md` | 外部做法调研：让 AI agent 真的能高质量执行 | §18 E10／E12 |
| `external-spec-practices.md` | 外部调研：好的 spec 与执行计划长什么样的差距表 | §18 E7／E8／E9 |
| `simplicity-guard-B.md` | B 方案落地设计：缩小／退役决定必须引用 lens 条目 | §18 E14／E15／E16 |
| `replay.md` | PaperBuilder 事故 × 9 条新规则的沙盘回放（101.9 h 基准） | §17／§18 机制的「能否拦住原事故」验证 |
| `landing-brief.md` | 本轮施工清单：E1–E16 ＋ 硬约束 ＋ 验证与交付要求 | §18 与提交 `8b452fc0` 的逐条落点 |

**合计 18 份、247,909 字节**（含本 README 之外的 18 份正文；此处字节数为归档后含 3 行来源说明的文件总量）。

**原件路径（归档时点）**：`/tmp/pb-forensics/*.md`（12 份）、`/tmp/pb-audit/*.md`（4 份）、`/tmp/pb-replay/*.md`（1 份）、`/tmp/pb-land/landing-brief.md`（1 份）。
