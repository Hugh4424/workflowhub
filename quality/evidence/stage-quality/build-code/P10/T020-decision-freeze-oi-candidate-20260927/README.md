# T020 当前 OI 冻结候选补丁

仅有候选副本和补丁。正式源码、正式测试、材料未改；未执行 Vitest，不能据此声称 RED/GREEN 或实现完成。

## 文件与来源

先应用 `tests-first.patch`，运行定向 RED；再应用 `implementation-followup.patch`，运行定向 GREEN。`candidate/` 是应用后的预览副本，`build-candidate.py` 可从下面三份当前源码重建。补丁只涉及 P10.md 已登记的两个生产函数及一份定向测试。

| 正式文件 | 本次生成前 SHA-256 |
|---|---|
| `tests/contract/decision-freeze-current-oi.test.mjs` | `8901c7a858766d8626524c610a244fae5d7920b743ac6d7c86e18ae26f884d20` |
| `runtime/stage/stage-content-contracts.mjs` | `653a6f0d516cb7b66c4de0fb081122dbb06354dbaaa51044b1d7666c033d3245` |
| `runtime/stage/stage-handlers.mjs` | `88760292bc8b78d6a13e848fddc5ba9ce1fa4708cd422d404045c8820c21e5c9` |

| 补丁 | SHA-256 |
|---|---|
| `tests-first.patch` | `de427457deb8cb5d502b7f5554a0ca21913edc8bf2d71806e96fd190ba471768` |
| `implementation-followup.patch` | `a134c7f7309ff077a9b4966debb198b045d0181088615ee40a82b582922804a6` |

## 静态检查

- 三份候选副本各自 `node --check`：exit 0。
- 两份补丁各自 `git apply --check` 到当前正式文件：exit 0。
- 无正式测试或真实 handler 调用；后续必须由另一上下文独立审查。

## 候选行为

- 当前唯一 `### OI 记录（解析器权威记录，YAML）` 内严格解析 YAML/JSON，检查 ID、类别、状态和重复；格式坏或无记录明示失败，不从历史文字、历史 YAML 或旧 M6 补齐。
- 仅映射四个冻结类别；当前 `open` OI 使方向未决。
- 当前 CF 节按逐条 CF 的当前状态行判定；缺失、重复或异常状态明示失败。CARD-05 的 CF-5 无状态行，但有明确用户裁决行，候选只对该已知记录例外识别。
- 对象输入、无当前 OI 节的旧 M6 路径及三方确认/身份检查保留原行为；正式 handler 重建认证来源时保留新增内容错误。

## 应用后的定向命令

1. `git apply tests-first.patch`
2. `npx vitest run tests/contract/decision-freeze-current-oi.test.mjs`，保存原始 RED。
3. `git apply implementation-followup.patch`
4. `npx vitest run tests/contract/decision-freeze-current-oi.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs`，保存原始 GREEN。
5. 在已有正式 build-spec/build-plan handler 定向测试中补一条“认证来源齐全但当前 YAML 错误仍暂停”的真实消费者负控；随后只跑该文件。

## 风险和未覆盖

- 现在的 `tests-first.patch` 没有真实 handler 消费者负控；应用前或应用时必须补，不能只靠纯函数测试宣称 handler 安全。
- CF-5 的归档格式特殊，只通过明确用户裁决行识别。其他无当前状态的 CF 都失败关闭；若未来材料改变 CF-5 格式，需重新审查解析合同。
- 这个局部修复不解决 CARD04 的 206 处变更映射、真实业务效果和整体 build-code 验收。
- 应用后源码树改变，旧快照绑定的测试和 stage 回执不能当作新快照结果。
