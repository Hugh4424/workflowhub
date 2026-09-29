# T020 当前 OI 冻结候选 v3

v1/v2 原件保留；本目录只放 v3 候选。正式源码、正式测试、材料未改，未执行 Vitest。

## 修正的两处假绿

1. 无当前状态行的 CF，必须核对用户批准行、当前 `confirmed` OI、落地行指向的 D 决定；该 D 段的**同一句当前裁决**必须同时出现目标 OI 和“显式批准”。错 D、错 OI 或把两句话拼起来不能通过。明确 `open` 状态始终优先。
2. 当前 OI 节中，完整围栏之外的双反引号笔误、裸 `oi_id:` / `category:` / `status:` 记录都会报内容错误；四类齐全也不能掩盖。CARD-05 归档当前节静态扫描为 35 对正常 YAML 围栏、0 行此类异常。

## 补丁与检查

| 补丁 | SHA-256 | `git apply --check` |
|---|---|---|
| `tests-first.patch` | `27601c9e4f03adc29aca38abc9a5296c24a7f2a3f53936c660449de8fb839ff2` | exit 0 |
| `implementation-followup.patch` | `a4687e953ce0a9cbbcfea60e85fc09c82fb35014bdb3c1f2f05e6ef2f826b2ea` | exit 0 |

四份候选副本各自 `node --check` exit 0。两补丁触及文件互不重叠，可按 tests-first → 实际 RED → implementation-followup → 定向 GREEN 的顺序应用。基线源码 SHA 与 v2 README 相同。

建议的定向命令：

```sh
npx vitest run tests/contract/decision-freeze-current-oi.test.mjs
npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t 'keeps a current OI content failure'
npx vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs
```

真实 handler 负控已包含在 tests-first.patch，并在批准前让坏 OI 进入材料，避免只测到“批准后材料变旧”。尚未实跑，不能宣称测试或完整 build-code 通过。
