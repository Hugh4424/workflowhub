# P3/T005 当前材料的两份定向测试

- Worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`; branch `task/workflowhub/workflowhub-thin-core-card-04-20260919`; HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。
- 官方命令：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-04-20260919 --input=<本目录/request.json>`。请求只运行 `npx vitest run tests/contract/stage-runtime-material-check.test.mjs tests/contract/post-build-plan-missing-index.test.mjs`，超时 180000ms。
- 结果：CLI exit 0；canonical receipt exit 0；2 个文件、8 个测试全过。原始输出分别为本目录的 `verify.stdout.raw`、`verify.stderr.raw` 和 `canonical-output.copy.txt`。
- 运行前两次、运行后一次 official status 身份相同：Task `workflowhub-thin-core-card-04-20260919`；material revision `revision-30e50b760cb29e92f9b114a9be6db6105647a76b7c3c8caeb15a4a949a4975b6`；snapshot tree `4381e90d43a7072ba12d1a4359ba757c3ddd5786`。运行前后分支、HEAD、16 份材料、两份生产文件、两份测试文件、task.json 与 facts.jsonl 的 SHA-256 均未变。各文件哈希见 `before.json` 和 `after.json`。
- canonical receipt：外置 Task `quality/tests/card04-P3-T005-two-targets-2ec04542-fc3c-4f75-8bfb-ec87394bf9da.json`；SHA-256 `212381123f183ba80881adfb2f92c5a2284bf62a07f4eceaab90c7c31ac847f5`。canonical output：`quality/tests/output/card04-P3-T005-two-targets-2ec04542-fc3c-4f75-8bfb-ec87394bf9da.output`；SHA-256 `b0c198193741dcd70312a902a1c5bf6bf9f4db8bc589fa24bddf8b9162716688`。本目录两份 `canonical-*.copy.*` 与外置原件字节相同，receipt 的 output_hash 也相符。
- 冻结测试 SHA-256 `7369285cde321c82180e9b07254e1295a3360771235d1bec11c03ae2849192d5`；新增测试 `c28df1638be546c906196e5ca74b1031855d2b769fe542740d24d489b89b0373`；被测生产文件分别 `a926c3217456cfa3397252945b483f78260009cdc9b393e265b921480eab079f` 和 `60aee6dcfc18f66739f44e5467e6a4447f7386998fe3dc19dc10b8b97bfd47fd`。

这只记录两份定向测试的正式结果，不是独立 Phase 审查、G-2 解除裁决或 build-code 完成结论。历史 RED 原件未覆盖。
