# P6/T013：当前失败与材料 owner 修订建议（2026-09-27）

## 结论

T013 的三文件定向命令仍为 `EXIT=1`：24 个测试中 5 失败、19 通过。失败分为两类，必须分别修复；没有 GREEN，也没有 T013 Done。本文是提案，不修改生产文件、冻结测试或任务材料，不替代正式审查/阶段事实。

## 身份和原件

- 工作树：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`；分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`；HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。
- 当前三文件运行原件：`quality/evidence/stage-quality/build-code/P6/T013-current.txt`；SHA-256 `84aa1d95bdfb0eb9d9ef105279142a2dd2de0d5816bb678e0ea279719ec97a06`。其中 `spec-analyze-truthfulness` 目标断言失败 1 条；`post-spec-analyze-original-source` 因同一缺失路径失败 4 条；`post-phase-official-handler` 通过。该原件已有命令、测试身份、输出和 exit，本次只读复核，未重跑。
- 历史预置 RED 在外置 Task store 的 `quality/evidence/prewritten-red/P6-T013-spec-analyze-red.txt`、`P6-T013-gate-three-command-red.txt`、`P6-T013-channel-probe.txt`；这些是 build-plan 预置材料，不当成当前 canonical build-code 结果。
- 当前源码 SHA-256：`runtime/stage/stage-content-contracts.mjs` = `6e37babab8152b78dd7ffb0f87580120b4542b6ae298bc02f33895ef8e470f49`；冻结 T013 测试 = `add4d7d8d371cbcda53b6a0a1a767b0d874ea283636463db51b8b23207ec1f38`；相邻 CARD-05 测试 = `dff27f9043cf339d5fb724f799d86a00f2acdc725259410887f6e5f7fb1f334b`。

## 两处根因

1. `runtime/stage/stage-content-contracts.mjs` 的 post build-code 普查分支：当认证普查 `status="present"`、`entries=[]` 且 `errors` 包含三节缺失诊断时，零条目分支只输出一条通用错误；逐条 `census.errors` 投影位于 `else` 内，因此被跳过。真实消费测试要求至少两条互不相同且指名缺失节的机器可读诊断，当前读到 0 条。生产侧 owner 应保持空分母仍失败，并把逐条 errors 投影移出非空 entries 分支；对 `status` 不正确、`entries` 不是数组的情形仍 fail-closed，不凭自报伪造来源。保持 `stage_end_spec_analyze` 的 advisory 属性，不加推进门。
2. `tests/contract/post-spec-analyze-original-source.test.mjs:5` 把 CARD-05 材料根路径写成 `specs/workflowhub-thin-core-card-05-20260919`；当前同一卡材料已在 `specs/archive/workflowhub-thin-core-card-05-20260919`，其中 `phases/P1.md` 与 `spec.md` 均存在。4 条测试在读取 P1 时以 `ENOENT` 中止，尚未执行自身语义断言。该测试的 owner 应将 fixture 指向实际归档路径并确认其余依赖仍存在；不得从 T013 命令删除该测试。

## 所需同任务材料修订

当前 P6/T013 卡面明确禁止改 `runtime/stage/stage-content-contracts.mjs` 和 `tests/contract/post-spec-analyze-original-source.test.mjs`，且把两个问题指定给 CARD-05 写面。CARD-05 已归档，这两个问题没有在当前 CARD-04 工作树内的授权实现任务。由 post 材料 owner `build-plan` 在同一 CARD-04 的 `spec.md`/`phases/P6.md` 明确认领跨卡修复：给出两个文件的精确写面、各自消费者、责任人、取代关系、删除条件和测试；保留旧 RED、原文件 hash 与原因。若方向需要推翻先前用户裁定，先由 `make-decision` 增量记录，不能由 build-code 暗改。材料变更后的审查、确认和正式运行按新材料版本办理，不能沿用旧版本事实。

材料 owner 可选择让 CARD-05 责任方在其自己的新任务修复，但 CARD-04 的 T013 在两处真实修复和原三文件命令 `EXIT=0` 前继续 `not_done`。不得以改夹具为 `entries>0`、删相邻测试或只跑其中一个测试制造通过。

## 修复后的验证

1. 定向核对零条目负例：缺三节时至少两条不同、指名缺节的诊断；空分母仍失败。合规归档 decision-log 的负控零虚报；返回形状稳定。
2. 运行原三文件命令：`npx vitest run tests/contract/spec-analyze-truthfulness.test.mjs tests/contract/post-phase-official-handler.test.mjs tests/contract/post-spec-analyze-original-source.test.mjs`。保存完整原始输出、exit、源码/测试 SHA 和当前材料版本；逐项归因。只有命令和语义判据均满足，才可写 GREEN。
3. 对照 `CONSTITUTION.md` F3、F4、F9 和 `constitution-checklist.md`：质量事实不可冒充完成；生产失败明确暴露；审查由独立来源作出。本提案不新增 stage、gate 或持久控制面。

## 当前状态

按 P6/T013 明示 STOP 条款，生产与受保护测试未改；T013 保持 `not_done/G2`。未请求独立实现审查，因为本次没有实现变更。材料提案仍需 owner 采纳与独立质量审查。
