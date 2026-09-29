# P8/T017 P6 来源重绑：独立复核

结论：**本次窄范围无阻断**。这是目录来源版本修复；不能据此认定业务效果已实现或 P8 完成。

- 原目录保存在 `catalog-before.json`，其 SHA-256 为 `a16fd876ad2935fd812835c56f863a4b91bd33ac4f618b3edca32d5d763a32d9`；当前目录 SHA-256 为 `269e8ed894b2d0d4ed7a7f55ff8cbebe69117549419118de9932b9c3c56be343`。逐字节 diff 仅三处：目录修订 `.11`→`.12`、第一例 `rule.revision` 与 `effect_observation.rule_revision` 均从旧 P6 SHA 更新到 `35b15b6739106d5f4e2ac8e2e0f69b3c1b365f81ce45bf4efcfd9471b85967c3`。没有改 case、规则文字、正反谓词、测试身份或效果状态。
- 实读当前 `phases/P6.md`，SHA 与新值相同。T009 仍要求真实 decision-log 的 U/V/R 三节、非零 U/V 来源分母、零解析错误和 R-001..R-008 索引；目录第一例规则文字与观察谓词仍对应这些要求。decision-log 与 P7 的当前 SHA 分别为 `01a9cb30dee551d30ffc929752ac137f76f14313e30de8e05837ea23ce6bbd40`、`d8e15fd017d53ff91fcb3bd4197f424bcb0779deb156d7a7daef24de3e3bb097`，与前后测试身份记录一致。
- 同一测试文件 SHA `b6cbed445ecedb3fb10cbe88ea916abe1eb2a523ba251d6e78e752e87de8c7fd`、同一命令的原始记录显示：改前 exit 1，仅 1/10 失败，错误为 `stale rule.revision`；改后 exit 0，10/10 通过。失败是目标来源版本检查，不是测试收集或环境错误。
- 三例 `effect_observation.observation_status` 仍均为 `not_yet_observed`。本次测试只核来源绑定和合同文本，不证明独立业务效果、P8 全相位或整卡完成。

复核范围限于本次目录 diff、当前 P6 T009 与上述原始记录；没有重新运行测试，也没有把此前 P6 内容改动整体裁决为纯文字变化。
