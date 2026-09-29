# P13 候选聚合独立复核（只读）

结论：候选内容没有把局部测试或旧阶段记录写成整卡通过，可作为“未完成”报告底稿；不得原样发布为正式最终报告。本复核未运行测试，未改候选 JSON/Markdown、源码、相位材料或 Task 事实。

## 核查身份和文件

- 官方 `status --action=begin` 原件 `status-begin.stdout.json`（SHA-256 `27e3e907656e932ddc96e3a61ac3fc302ea780e6a7e60547b0018eb3f3067329`，exit 0）及独立再次只读读取一致：Task `workflowhub-thin-core-card-04-20260919`，材料 `revision-3ce06a4d0f1643e8d3ffda4b49baa9ac9df8a23081cf34d71d99b244f2805646`，源码树 `870b92175454f8b7691149b8eb672c12d8814665`。旧 build-code 行 provenance 为 `stale`，执行状态 `partial`，质量仍 `in_progress`。
- `candidate-aggregate.json` SHA-256 `486c8c7197cced1ba9761df6d64d008a56dea153fce9ba9b6618350020a819e8`；`candidate-aggregate.md` SHA-256 `e3449cc1462378171eccdc6247dd73548d28356fe4a0eb4120b9eab7ce2c8029`；`sha256-manifest.json` SHA-256 `ad1bd256fb1e334bd56defb93c764452efea6cf19eb4b19535234df87a9d54f0`。三份原字节均与本次读取一致。
- 对照的正式测试 `tests/contract/card04-final-aggregate.test.mjs` SHA-256 `76d5a58f502cb1482a0b052a6af861a0c6184b376095e682a40a4e42722a896e`；当前材料 `specs/workflowhub-thin-core-card-04-20260919/phases/P13.md` SHA-256 `0bc5e71272b2128a6d0d13e64d3e6aee4314942e286ef1f4c1a2999815890dfe`。

## 内容与来源

- JSON 有 P1–P12 共 12 个相位、26 个 Task；顺序、各相位 Task 编号与当前卡片逐字一致。P8/P9/P11 的两条现行命令均正确列出，P9 历史命令没有误作当前命令。全部相位、Task 和检查状态均非通过，并有非空原因、影响和负责人。
- `sha256-manifest.json` 的 60 条已引用原件逐一重读，文件存在、SHA-256 匹配，真实路径在认证工作树或本 Task 根内。唯一被拒引用是另一 README Task 的 `card04-ac19-readme-evidence-index.json`，原因 `outside_authenticated_roots`；候选将它从 P6/T027 的引用中剔除，T027 保持 `incomplete`。重复使用的同一原件仍分别记在各任务引用里，因此 60 是引用数，不代表 60 份独立证据。
- Markdown 先以“没做到”开头，完整列出 12 个相位和 26 个 Task 的 38 条未通过项，逐条包含身份、状态、原因、影响和负责人；其后依次为“路线适用”“执行事实”。P11 页面适用性仍为 unknown，P5 没有虚构人工“无例外”声明，P10 的 206 条未映射和业务效果 unknown 均保留。

## 正式交付边界

- `candidate_only: true` 与正式最终报告语义冲突，不能直接复制到 `final-aggregate.json`。`official_status` 和 `source_verification` 是候选审计信息；当前 P13 正式报告合同未登记它们的消费者。建议留在本候选旁证，正式 v1 报告只保留合同字段，并在发布时重新核当前身份、原件引用和状态。
- `quality/evidence/stage-quality/build-code/P13/T024-delivery.json` 尚不存在，独立执笔者的真实叙述、主会话原样贴出及其时间/身份也未发生。即使 JSON/Markdown 经修订发布，仍不能宣称 P13/T024 或 CARD-04 完成。
