# P1 当前 ADR-0033 文档门重采（2026-09-27）

- 认证 Task：`workflowhub-thin-core-card-04-20260919`；分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`；HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。只读 `status --action=begin` 前后 exit 0，材料版本 `revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`，来源树 `a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`。
- 命令逐字取自当前 `phases/P1.md:11` 的唯一 `gate_cmd`，保存于 `command.txt`；`run.json` 有 UTC 起止、命令与 exit。完整复合门 exit 0；原始 stdout 仅两行且有序：`P1 doc assertions OK`、`ADR-0033 tracked`；原始 stderr 空。`transcript.txt` 的第一行唯一 `COMMAND=<精确命令>`、中间为原始 stdout、最后非空行唯一 `EXIT=0`；逐字语法核见 `validation.json`。transcript SHA-256 为 `95e2f394f0ce94b2f4392c91fd0eddaff84da0ddab4bc0af6ccc5027eddb9a30`。
- `before.json`/`after.json` 逐项保存 16 份当前 post 材料与三份目标文档 SHA-256；运行前后全部相同。Task facts、分支、HEAD、材料版本及来源树也相同。原始只读 status 在 `status-before.*`/`status-after.*`；全部证据路径和哈希见 `evidence.json`、`artifact.sha256`。
- Git index 中 ADR-0033 有 `100644` 登记，`git status --short` 为 `A`；当前 HEAD 树无该文件。这只证明**已暂存、尚未提交到当前 HEAD**，不代表 Git 提交、正式阶段质量或全卡通过。旧 `ADR0033-current-gate-20260927/` 原件保留未动。本轮未改源、材料、测试或 Task facts；仅新增这份 P1 本地证据。
