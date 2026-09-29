# P13 来源清单：P1 当前版本更正

原 [index.json](index.json) 与 [summary.md](summary.md) 保留原字节。其 P1 条目只引用了较早整树的文档检查，现已过期。P13 读取 P1 后续新增的两组原件后，**P1 当前可核的事实改为以下记录**；本文件不改写旧证据，也不表示 P1 或 CARD04 整体完成。

## 当前身份和相位检查

- Task `workflowhub-thin-core-card-04-20260919`，分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`；材料版本 `revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`，树 `a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`。相位检查前后 Task、16 份材料和三份目标文档一致。
- [相位命令](../../P1/ADR0033-current-gate-refresh-20260927/command.txt) SHA-256 `bb7998b2d3ff5f8922b6cf3dab6143cb1b9aebbe602b61ed3d0ee184f138af73`，逐字对应当前 `phases/P1.md:11` 的复合命令。[原始 transcript](../../P1/ADR0033-current-gate-refresh-20260927/transcript.txt) SHA-256 `95e2f394f0ce94b2f4392c91fd0eddaff84da0ddab4bc0af6ccc5027eddb9a30`：唯一 `COMMAND=` 开头，stdout 依次为 `P1 doc assertions OK`、`ADR-0033 tracked`，唯一 `EXIT=0` 结尾，stderr 空。[证据索引](../../P1/ADR0033-current-gate-refresh-20260927/evidence.json) SHA-256 `b80b076cff884e12fb0117a1a9c6261143741f06140706ce418014a76f101cde`，其中原件 ref/hash 已逐一回算匹配。

## 同一当前树的三个任务检查

三份 transcript 均有唯一 `COMMAND=` 与 `EXIT=0`，stderr 为空；其 evidence 内的 Task、材料版本、树和前后 16 份材料哈希一致。[任务检查索引](../../P1/T001-T003-current-task-checks-20260927-e341aa18/summary.json) SHA-256 `85f8d355a73cbdd0694bf38369b4e4b8c5bd8a2ddc86ae8dbc69ea41d9d12af5`。

| 任务 | 检查 ID | 原始 transcript（SHA-256） | 任务证据（SHA-256） | 实际结果 |
| --- | --- | --- | --- | --- |
| T001 | `P1-RULES-DOC` | [T001.transcript.txt](../../P1/T001-T003-current-task-checks-20260927-e341aa18/T001.transcript.txt) `5fdd8f58bdb4dd2b863b8cbfa35a8396b35d5b9817f8e97e25184fea1fd56f72` | [T001.evidence.json](../../P1/T001-T003-current-task-checks-20260927-e341aa18/T001.evidence.json) `0863db37c689602246d9d0a68bec7902a7a63779f82c5900d84472a99aafefe3` | exit 0；`rules doc OK` |
| T002 | `P1-ENTRY-INVENTORY` | [T002.transcript.txt](../../P1/T001-T003-current-task-checks-20260927-e341aa18/T002.transcript.txt) `ac5ddbe7a663bcbe64722041d760cdabff8ca5a7c01fddb64585cfc5529b2af3` | [T002.evidence.json](../../P1/T001-T003-current-task-checks-20260927-e341aa18/T002.evidence.json) `65f85ff3cced7aacf86612684831edbceaae74d33597ed057066c93f12b1811d` | exit 0；`entry inventory OK` |
| T003 | `P1-ADR-TRACKED` | [T003.transcript.txt](../../P1/T001-T003-current-task-checks-20260927-e341aa18/T003.transcript.txt) `58954ceef4417ad7aa26bc999dcdf71a69fc58aad53b808af7bb6d0de14d0fe6` | [T003.evidence.json](../../P1/T001-T003-current-task-checks-20260927-e341aa18/T003.evidence.json) `7d31f22ae7d0da776c0316a4a65a0d1334a19196419f15c79b746316d3f5e36b` | exit 0；`ADR-0033 OK` |

ADR-0033 的 Git index 状态是 **已暂存、未进入当前 HEAD**。P1 文档和任务级检查均是当前树的本地命令证据，未产生正式 build-code 阶段完成记录，也未证明下游真实入口或整卡业务效果。P13 以后读取 P1 时应采用本更正和上述当前原件，旧 ledger 的 P1 旧树条目只作历史时点说明。
