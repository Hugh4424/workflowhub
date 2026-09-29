# P13 多命令 gate 候选补丁（未应用）

仅供审阅。没有修改正式 `tests/contract/card04-final-aggregate.test.mjs`、Phase 材料、最终三文件或 Task facts；没有运行 Vitest。候选副本只做过 `node --check` 语法检查。

## 输入身份与交付物

- 正式测试原字节 SHA-256 `43a83d16123f57fd89dd75fa25e622d565c33fc10b372e49683e6c4ce685f6ba`；P13.md SHA-256 `8abe3827356186e53416f7aaaf77201a270a202c18b65c0257545936ab6e11ff`。P8/P9/P11.md SHA 分别为 `33873942388466ff6754c4a10b77e7f33d4b2b9140e24b5da5c5e41aa63e9490`、`dcfd25eaab81f7e6adc8a01adbf37f81757010d14cb7b9299e7de39f396e488a`、`896f2ca748fcd495104b7716e03f43c3e9a38ad6f4e35e3e3961f3899916f5dd`。
- [tests-first.patch](tests-first.patch)：仅追加内存正反向量；[candidate-red-test.mjs](candidate-red-test.mjs) SHA `66d561bd8e47e96fc48b208fa80cd6ae6c4ed1027aae5e4db9fbe6013211e54b`。旧解析器遇 P8 当前卡面应在现有第三个定向测试中目标 RED；这只是**预计**，本次未运行。
- [implementation-followup.patch](implementation-followup.patch)：在不改上述测试向量的前提下补 P8/P9/P11 解析和多回执认证；[candidate-card04-final-aggregate.test.mjs](candidate-card04-final-aggregate.test.mjs) SHA `c9d6d0edf987053d34df15466ecdf0f8e7f65c74d24303a60c6162a39ba37d9a`。完整单步补丁见 [candidate.patch](candidate.patch)。补丁均以当前正式测试路径为目标；证据目录中的候选副本不应就地运行，其相对 import 是为正式路径准备的。

## 语义和真实来源边界

1. P8.md:13 逐字取两条；P9.md:12 验证三段标签和顺序，第一条“旧定向合同”仅保留历史、当前只取 T018/T019 两条；P11.md:18 逐字取第一步和第二步。少命令、换标签/顺序立即报歧义。P1 和其余单命令相位保持原 `gate_cmd`、P1 `command_checks`、单回执对象断言。
2. 多命令 Phase 沿用 `card04-final-aggregate.v1`：`gate_cmd` 为第一条，`additional_gate_cmds[]` 为其余必需命令；`gate_status=passed` 时 `gate_evidence.commands[]` 按序逐项含 Task `quality/tests` 回执与 `quality/tests/output` 原件的绝对 ref/SHA、真实 runner `test_ids`。候选独立重读 ref 原字节，核同 Task、stage、执行器、当次工作树/tree/source digest、**逐字命令**、内部 exit 0、receipt→output ref/hash、两条不重复。任一缺失/坏哈希/旧树/错 Task/错命令/非零/零测试/伪造 test_ids 都拒绝 `passed`。
3. `gate_status` 非通过时可在 `partial_gate_evidence[]` 引真实 ref/hash，并写 reason/owner；这组部分原件不进入通过判据。P11 已有第二份回执带 `-t`，24 通过/56 未选，**不等于**卡面未筛选第二命令；Node 22 项是邻接证据，也不属于卡面两步 gate。因此现时 P11 多命令 gate 应 `unknown/not_done`，浏览器业务效果仍 unknown/unavailable。
4. 现有 P8/P9/P11 正式 Vitest 默认输出主要给文件/总数，未提供完整逐测试身份。候选只接受可独立解析的 JSON reporter 且必须与命令目标、数量和所有 `test_ids` 完全相同；旧回执即使 exit 0 也**不足以标多命令 gate passed**。若要求正向 passed，须先取得同一当前版本的完整 runner 身份原件，并让卡面命令和正式回执逐字一致；不能手填测试名或拿另一命令补证。实际 JSON reporter 格式与 CLI 包装还需实施时定向核验，当前候选未实跑。

## 后续 RED → GREEN（实施者执行，本轮未跑）

1. 再核正式测试 SHA 与上述源身份一致，保存原始测试/P13.md 和现有 P13 RED。只应用 `tests-first.patch` 后定向跑第三项 `-t "rejects absent, stale, displaced bad-news and unknown-laundered refs without creating receipts"`；目标 RED 应来自 P8 当前 gate 解析失败，不接受 import/setup/零收集或其它先失败。保存原始 stdout/stderr/exit/test SHA。
2. 再应用 `implementation-followup.patch`，同一测试**向量文本**不变，定向跑第三项；目标 GREEN。向量包含 P8/P9 解析正例、P9 旧命令误作当前、P11 `-t` 冒充全命令、两条正确内存 reporter、缺第二条、重复回执、缺 output、坏 hash/Task/tree/source digest/命令/exit、零测试及调用者伪报 ID。内存记录绝不发布为 Task receipt。随后只跑必要的 P13 单文件；最终三文件尚缺时前两项目标仍会 RED，不能冒称全文件通过。
3. 真实三文件到位后，仍要由异源审查逐份核真实 canonical receipt/output 和业务来源。结构测试可以在 `overall_status=incomplete` 时 GREEN，意思仅是如实披露，不是 CARD04 验收通过。

## 写面和快照代价

P13.md:9 当前写面只允许 P5/T008 窄测试修订。本补丁扩大 `card04-final-aggregate.test.mjs` 的读取合同，实施前要由 P13 材料/测试 owner 明确授权并更新该限制；本提案本身不执行授权。若改 P13.md，材料版本和执行树会变化；即使**只应用正式测试补丁**，测试文件属于工作树源码，也会改变执行 tree/source digest。现有 P2–P12 同版正式回执、P10 真实固定捕获及可能新增的 build-code 阶段行会成为旧快照证据，不能直接拿来给新快照判 passed。可先如实记历史局部结果并保持 gate 非通过；若需要新版本正向 passed，须在写面稳定后按受影响范围重采正式原件，再重新核 P8/P9/P11 命令与完整身份。

只让多命令相位一律非通过，可使诚实的最终坏消息报告在解析修好后结构 GREEN，但会失去“两个正式回执分别绑定且均通过”的正向保护；P8/P9 的已测局部结果也只能记为部分证据。保留正反向量与失败原因，不能靠忽略第二条或拼出一条未实际执行的 `&&` 命令求绿。
