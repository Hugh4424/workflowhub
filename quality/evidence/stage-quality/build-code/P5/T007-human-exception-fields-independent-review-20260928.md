# P5/T007 人工例外六字段：独立代码审查

日期：2026-09-28。审查者只读核对代码、测试、材料与原始测试输出；没有修改产品代码、测试、材料或 Task facts，没有自行重跑测试。本记录只裁定本次 T007 两文件的局部修复，不是 P5 Phase 正式审查，也不证明真实 T008 报告可产出。

## 局部结论

本次六字段局部改动没有发现阻断问题。当前 `runtime/stage/stage-end-report.mjs` 对人工例外要求 `declared_by`、`reason`、`scope`、`expires_at_phase`、`owner`、`source_path` 六项非空文本。其输入的 `source_path` 在 facts 中按既有报告字段保存为 `source`；可选 `verbatim` 非空时原样保存在 facts，渲染时字面化显示。到期值只接受 `P<n>`、安全整数且 `n>=5`，不声称 `P999` 在当前任务索引中真实存在。机器五种状态不能作为人工声明状态。直接把调用方构造的坏 facts 交给渲染器，也会再次验证同样的字段、到期值和状态。渲染保留六项、来源与原话，没有吞掉机器 `not_done`。

原先 `declared.exceptions` 缺失/空数组时记 `not_done=missing` 且渲染拒绝的规则未改；P5 中途报告能否写“没有例外”仍待用户答复。本次没有创造真人声明或默认值。

## 原件与写面

- 改前 `stage-end-report.mjs` / `.test.mjs` 原字节已存于 `T007-human-exception-fields-20260928/before-*`，SHA-256 分别为 `7828fe354db7cc4507ddd5a503ad9cd97279d81ac1e2d51291b48dab11ba6b43` / `3882d202565978f5e4d3d6a4985bcabccac907263e4e3f53782c79928c353428`。
- 当前两文件 SHA-256 分别为 `367c04f2f5fb6a039f250ecc7e6ad9568457f1529cc4769caebe57e6b902227a` / `036cdb5476e98d068f7f7fbb163113e86e1c34dc159761002b367fae40acb08d`，与 `after.sha256` 一致。与改前副本逐字 diff：产品代码只改六字段验证/保留、直接渲染验证和人工声明输出；测试只补合法夹具、逐字段正反例及直入渲染反例。既有测试未删除，原八项冻结断言保留。本批未改 P5 零例外规则、T008 writer/reader 或三文件。
- 本批原始定向 RED 为 `32 failed | 23 passed (55)`、exit 1；失败点是新增行为断言，不是导入或环境错误。修复后同文件 `55 passed (55)`、exit 0。相邻 `p5-same-run-report-source.test.mjs` 原始结果为 `12 passed | 6 skipped (18)`、exit 0；跳过的正例不能当作真实报告通过。原件见本目录下 `red.raw.txt`、`red.exit.txt`、`green.raw.txt`、`green.exit.txt`、`adjacent.raw.txt`、`adjacent.exit.txt`。
- 实现者的 `T007-human-exception-fields-20260928/handoff.md` 与以上最终 SHA、命令和边界相符。两产品文件尚未进入 Git 跟踪，故本审查直接比较保存的改前原字节和当前文件；`git diff --check` 的成功不能覆盖这两文件。实现者记录 `node --check` 两文件成功，本审查没有另跑该检查。

## 仍须单独完成

1. 真实 T008 writer `runtime/stage/stage-runner.mjs` 当前只把 `reason/source_path` 交给 T007，reader `runtime/evidence/freshness.mjs` 重算时也只传这两项。若以后真实声明满足其它条件，新六字段校验会让这条路径失败。T008 owner 须按其写面显式传入源声明中的其余字段和可选原话，并核对认证索引中的到期阶段；随后运行正反例。相邻 12 项通过多为“不产报告”负控，不能遮盖此缺口。
2. 当前 `spec.md` / `P5.md` 尚未由材料 owner 把本次精确字段名与 T007/T008 分界写入正式材料；独立合同审查已批准修订提案的方向，但提案不是正式材料。正式材料修订与同版质量事实仍需另办。
3. 用户尚未答复 P5 **中途**报告在确无例外时的写法。保持现行拒绝空数组，不能填一条假例外；不能以本次 55/55 宣称 T007 全语义、T008 或 P5 完成。

本审查按 `constitution-checklist.md` 的 F9、Q1、Q3 保留来源与质量边界：定向 GREEN 只证明本地行为，独立审查不替代正式 Phase 事实，缺真人确认和真实报告继续记未完成。
