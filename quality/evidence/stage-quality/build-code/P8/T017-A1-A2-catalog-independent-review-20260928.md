# P8/T017 A1/A2 有限目录独立审查（2026-09-28）

结论：**1 项阻断新两例的自动选测；本轮目录暂不判可保留完成。**本审查只读产品文件和原始证据，未改目录、测试、材料或 Task 事实，未跑全量测试。

## 必须修复

两例 `CARD04-AUTHENTICATED-TASK-CHANGE-SCOPE`、`CARD04-INDEPENDENT-TEST-INVENTORY` 的 `execution.target` 分别是 `tests/contract/build-code-preexecution-source.test.mjs`、`tests/contract/build-code-test-registry.test.mjs`，但各自 `change_triggers` 均未包含该测试文件。真实选择器 `workflows/build-code/case-selection.mjs` 只用 `entry.change_triggers.includes(changed)` 把变化路径映射到用例（当前文件约 113–118 行）。因此只改其中一个测试文件时，该目录不会选出相应 A1/A2，返回 `unmapped_changed_path`；不会假报通过，但不能完成“测试变化触发对应业务用例”的合同。当前 `tests/contract/business-case-source-binding.test.mjs` 的 `finiteP9CaseErrors` 只检查规则文件和消费者路径，也未查 `execution.target` 是变化触发路径，所以 19/19 绿未覆盖该缺口。

建议 P8 owner 在两个 case 的 `change_triggers` 各加自身 `execution.target`，来源绑定测试增加可失败负控：删掉该触发路径应失败；选择器定向夹具以“只改该测试文件”为输入，应从当前 `unmapped_changed_path` 变为选出对应 case。P9 独立测试库存仍须登记两个目标并核完整叶子；仅补目录不能替代库存、实跑或逐例业务效果。保留本轮 RED/GREEN 原件，修后以新字节重留针对性结果和独立复核。

## 已核对、可沿用的有限事实

- `docs/quality/business-case-catalog.json` 当前 SHA-256 `786b68f7353a035d52c81d1111f6f0d2229dc7ecadfe887175aecd8db34e073e`，来源绑定测试 SHA-256 `6c423f95da75efe8c3e40c12fb8252514a3b12be4b772885c1b8c60a1a9e02b8`。新两例分别锚当前 `decision-log.md` SHA-256 `01a9cb30...40` 与 `P9.md` SHA-256 `8aa16431...bb1`；原 U-006、R-011..R-014 与 P9/T018/T019 规则语义相符，P8/spec 的有限新增范围相符。真实 `targeted-capture.mjs` 调用两个声明接口。四种场景、正反效果、风险、环境、唯一目标、owner 和 P10 未来 reader 均已填写，观察状态均为 `not_yet_observed`。
- A1/A2 目标源码 SHA-256 分别仍为 `e5ec0396...076af`、`9afc2b3b...761d2e`。`P9/T019-A1-A2-real-leaf-discovery-20260928/` 的原始 Vitest JSON SHA 与库存记录一致，分别实报 7/7、8/8；目录的完整叶 ID 与独立发现的 7 和 8 条逐项相等。此事实只证明当时两个定向测试的叶身份，不证明 AC-30/32 或业务效果。
- `T017-A1-A2-catalog-20260928/` 中最终测试字节与隔离 RED 测试字节同 SHA `6c423f95...e02b8`。隔离副本仅删新两例，保留旧三例和其余目录字段；隔离 RED 7 个目标断言失败、旧 12 个通过、exit 1，失败均为缺新例而非装载错误；当前五例同字节 GREEN 19/19、exit 0。首次隔离漏复制 P6 材料造成的额外环境失败另存 `isolated-red.setup-attempt.*`，没有被当成目标 RED。当前工作树目录及测试 hash 与 `green-final-same-bytes.input.sha256` 一致；隔离夹具位于 `/tmp/card04-p8-a1a2-isolated-fixture-20260928`，未改正式工作树。证据目录已保存隔离目录 JSON、同字节测试、输入哈希和 stdout/stderr/exit，临时完整夹具在审查后可清理，但本审查未删除。
- 起步旧 census 例仅因 P6 全文件变动而更新 `rule.revision` 及 `effect_observation.rule_revision`；T009 的 U/V/R、非零分母、零解析错误、R-001..R-008 规则没有改。另两旧例逐字相同；`evolution.phase_obligations` 七条逐字相同，继续 `not_done`。旧 RED、旧两目标与当前五例的业务效果均未因结构检查升格。

边界：P9 尚未把 A1/A2 纳入正式独立测试库存并完成当前 Task 的官方定向执行；P10 逐例效果读者尚未实现，整体变化还有未映射路径。本文只裁决 P8 新两例目录与来源绑定这一轮，不裁决 P8 全阶段或 CARD-04 完成。
