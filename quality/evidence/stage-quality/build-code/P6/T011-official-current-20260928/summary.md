# P6/T011 当前正式定向检查（2026-09-28）

- 正确 worktree 与分支；HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。两次运行前 status/材料/测试/镜像原字节一致，正式命令只运行一次。首次取证脚本在正式运行前因自身 bytes 编码错误停止，见 `capture-preflight-error.txt`；修正后才执行正式命令。
- 精确命令：`npx vitest run tests/contract/oracle-mirror.test.mjs`，经公共 `verify --action=execute` 执行，CLI exit 0，正式 receipt 内部 exit 0；runner 报 `1 file / 9 tests passed`，真实文件身份为 `✓ tests/contract/oracle-mirror.test.mjs (9 tests) 16ms`。原始 CLI stdout/stderr 和 runner 输出均保存。
- 正式 receipt `quality/tests/card04-P6-T011-official-current-3640546b-e3c9-445e-874e-7afe8a7a29e2.json`，原字节 SHA-256 `18b0fe7e1012677b8920b0a6b7a150f8914267241461f9a5b26038139304c1d7`；输出 `quality/tests/output/card04-P6-T011-official-current-3640546b-e3c9-445e-874e-7afe8a7a29e2.output`，原字节 SHA-256 `2f54dc47ddebf72ee8ce776695087a7161fe0c0c6544c0004644877eda705007`。stdout receipt hash 与本地重算一致：True；receipt output hash 与重算一致：True。
- 前后 `task_id/material_revision/snapshot_tree` 相等：True，身份 `{'task_id': 'workflowhub-thin-core-card-04-20260919', 'material_revision': 'revision-4e8fec6ee25373d66986926b22f6124f8635c14c32156b2b37eeae4f02c9b08f', 'snapshot_tree': 'b2c331cdfbdddca013a98b95f12fa15c96ee7c3b'}`；相关材料、测试、镜像和 Task facts 原字节一致：True。质量状态仍 `in_progress`，缺项 `['acceptance_criteria']`。
- 这是 T011 当前镜像的正式**定向测试事实**，只证明这 9 项文件系统断言在该快照通过；不证明 T012 全链、P6 全部任务、完整 AC24 或业务效果。
