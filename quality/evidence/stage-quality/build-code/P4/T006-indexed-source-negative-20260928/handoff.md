# P4/T006 Action⑤ 交接

**结果：定向负控有效，P4 整体仍待核。** `move-map` 已先登记新测试 owner/consumer/delete_condition，再创建 `tests/contract/post-acceptance-chain-source-index.test.mjs`。测试读当前真实 `decision-log.md`、`spec.md`；`R-009` 的六条 U 索引进入 AC-29，AC-18 无索引边时保留空值并说明原因。

冻结测试 SHA256 `76e20fa6eca21ada108a6a0632fd8b6d57ac02587da053697ffdcf93eefcdf84`。生产源码原件 SHA256 `38e2a7067c5b640a3ad18266b1ff478cf257a7f6e507f0c6ccc18f34a310e0c0`；隔离副本的唯一故障注入见 `mutation.diff`，变更后 SHA256 `77367cdfabfa534471c650642304fa7d9acb205cac5126eff6443e6dea0bdb9b`。材料 SHA256：decision-log `01a9cb30dee551d30ffc929752ac137f76f14313e30de8e05837ea23ce6bbd40`，spec `38bc36f7944549e39f8ef51d37ad7d1029598e4805b18a24a4d6810516e9daa9`。

| 检查 | exit | 原始输出 |
| --- | ---: | --- |
| 隔离源码故意清空 AC-29 `source_ids`，同一冻结测试 | 1，目标断言失败 | `red-raw.txt` |
| 隔离源码恢复原字节，同一冻结测试 | 0，1/1 | `green-isolated-raw.txt` |
| 真实工作树，同一测试 | 0，1/1 | `green-worktree-raw.txt` |
| 原有七项就近测试，只读运行 | 0，7/7 | `existing-seven-raw.txt` |

第一次冻结版测试误把字符串 `coverage_limits` 当数组读取，恢复源码后 GREEN 失败；旧测试字节与完整原始输出保留在 `invalid-first-attempt/`。修正测试后重新冻结、同一故障注入 RED→恢复 GREEN；不能用旧失败冒充有效结果。

隔离副本中测试原字节与冻结版一致，恢复后的源码原字节与工作树一致，见 `isolated-hashes.txt`。真实生产源码、P4 材料均未由本任务修改。`node --check`、`move-map` JSON 解析及 `git diff --check` exit 0。原有七项输出有一行 Vitest WebSocket 端口占用提示，但测试收集七项并全部通过；未据此扩大测试。

主代理已组织未参与实现者独立审查并反馈认可本次负控；其审查原件由主代理单独归档。P4 finding 处置和官方事实仍由主代理决定。不得据本记录宣称 P4 或整卡完成。

临时隔离副本 `/tmp/card04-p4-index.RSDhiX` 与首次无效尝试副本 `/tmp/card04-p4-index.pYdCPp` 均已核对含本次测试标记、所需原始字节和输出已留在本证据目录，随后用限定路径删除；本证据目录未清理。`isolated-copy-path.txt` 只保留当时运行位置供追溯，该临时路径现已不存在。
