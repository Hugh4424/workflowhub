# 两个 CARD05 旧路径测试：当前实际结果

- 精确命令、cwd、HEAD、两文件 SHA-256、UTC 起止时间、完整 stdout/stderr 及其 SHA-256 在同目录 `run.json`、`stdout.raw.txt`、`stderr.raw.txt`。
- 命令退出码 **1**；共 20 个测试，**18 通过、2 失败**。
- `tests/contract/decision-freeze-current-oi.test.mjs:18` 读取旧的 `specs/workflowhub-thin-core-card-05-20260919/decision-log.md`，实际报 `ENOENT`。
- `tests/contract/post-phase-contract.test.mjs:297` 读取旧的 `specs/workflowhub-thin-core-card-05-20260919/phases/P5.md`，实际报 `ENOENT`。
- 因此不是夹具保护或静态推测；归档移动后这两个测试真实失败。本次只采集证据，未修改测试或归档文件，也未运行其他测试。
