# T012 build-code 分析结果绑定复测

独立审查发现上一版 E2E 只要求任意阶段出现一条分析结果：若 build-code 的分析结果丢失，别的阶段仍可能让该用例通过。按当前 P6 材料，只在同一「诚实性-1」用例增加两条断言：每条 `stageQuality.stage=build-code` 的事实必须有分析器状态；样例至少有一条这样的 build-code 事实。make-decision 无分析器时仍须明确 `missing/deferred`，已有分析器时原值、事实槽位和结果映射断言未改。

- 修改前测试 SHA-256 `dd57cf5ee5c715d33ac412bfb50e2d6dad4d4c142c78e1e9775366f006103bf4`；生产 `stage-runner.mjs` SHA-256 `defe0343739b1df8182a0fba3d281eb98f11d545fb74742ccd87f04935b52e74`；P6 材料 SHA-256 `df594ef472705cd733ed849ee65d73ad39831a5c5011fd8132a09ae4cd5d67ab`。
- 命令：`npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs`。退出 `0`，1 文件、17/17 通过。原始输出：同名前缀 `.stdout.txt` SHA-256 `5d71d32e2b283d68f76303056b0e39355eaf26968447cf858efd02a2a78a45cc`，`.stderr.txt` SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`，`.exit.txt` 内容 `0`。
- 修改后测试 SHA-256 `81d081c929eef1ccd3199adc74a278ec36d787da7f791f97ba6fc89b553303d6`；生产与 P6 材料哈希未变。

限制：这只验证当前 E2E 的来源区分和 AC26 局部机器判断。没有真实 P5 报告正例，也没有正式 build-code 阶段事实；P6 和整卡未完成。待独立复核本次新增断言。
