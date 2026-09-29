# P13 多命令候选 v2：假绿修复，未应用

旧候选保留在上层目录，完整原字节 SHA-256 `c9d6d0edf987053d34df15466ecdf0f8e7f65c74d24303a60c6162a39ba37d9a`；审查 finding 原文见 [review-finding-original.txt](review-finding-original.txt)，SHA-256 `274d70f48305352c24ddc14f051768371dafab30db1cc91900de1cee8681aea8`。正式测试当前仍为 SHA-256 `43a83d16123f57fd89dd75fa25e622d565c33fc10b372e49683e6c4ce685f6ba`，本轮未改正式测试/Phase 材料/Task facts，未运行测试。

## 新候选与精确改动

- [candidate-card04-final-aggregate.test.mjs](candidate-card04-final-aggregate.test.mjs) SHA-256 `76d5a58f502cb1482a0b052a6af861a0c6184b376095e682a40a4e42722a896e`；完整 [candidate.patch](candidate.patch) SHA-256 `a38e54423ce2c1c9e087fb528b2b2bde171b82725197da383dfc453dfad7a37c`。两步补丁分别为 [tests-first.patch](tests-first.patch) SHA `784c5b2d8d9c64507ab6c062aa45bd7ce6566fc83168d083d5bcfe516ae4bc51` 与 [implementation-followup.patch](implementation-followup.patch) SHA `200fb2b2548c1fabcf1b08c4d196dddae2679876eae2e94cef322ea58b554d16`；RED 候选副本 SHA `4624bbd33d456b70ae40c680eeedccf5b0bc4d9709bd54fd33e966b8a4e23915`。两个候选 `.mjs` 仅 `node --check` 语法通过，未运行 Vitest。
- 多命令通过分支现在先调用现有 `validateCanonicalTestReceipt`，验证 `workflowhub-receipt.v1`、Task/stage/producer、tree、逐字命令、`command_hash`、output-ref 形状和 exit；再独立核当前 source digest、原始 receipt/output ref/hash、目标测试身份。新增坏 schema 与坏 `command_hash` 内存反例。P1 及其他单命令路径保持 v1 候选原合同。
- JSON reporter 要求 `success=true`、`numTodoTests=0`、总通过=总测试且非零、failed/pending 测试与 suite 均为 0，所有 `testResults` 文件与命令目标**逐个相等**，每个文件 `status=passed` 且 `assertionResults.length>0`，每个叶为 passed、名称完整且不重复。`numTotalTests` 必须等于各文件叶数之和；任何一文件 0 叶，即使另一文件补足总数，也拒绝。`numTotalTestSuites` 是 Vitest `describe` 分组数，不能误要求等于文件数；真实 P9 discovery 中 1 文件对应 2 或 6 suites，已按原件纠正。
- 正向内存向量不再凭空造每文件一叶：直接读 P9 已存 JSON reporter [6 叶原件](../../../P9/T019-discovery-1-20260927.stdout.json) SHA `7d962ad1636d9e83ba42f02c035c46c53dfe5ab2dd074f46b4cf70d87edcbddb` 和 [28 叶原件](../../../P9/T019-discovery-2-20260927.stdout.json) SHA `3e25e2c25c40fecd83d4ebe78c23f88c8dd2518a92308580312062a864d0a9ca`；逐叶 `ancestorTitles/title` 拼出的 ID 与当前 registry 两目标的完整登记 ID 完全一致，目标测试文件 SHA 也与 registry 一致。仅内存包装 receipt，**没有发布伪 Task 回执**；这只验证通用双命令读者，不宣称 P8/P9/P11 gate 正例。
- 负控保留旧的缺第二条/重复/错 Task/tree/digest/command/ref/hash/exit/伪 ID/零测试/P11 `-t` 假全门；新增 P9 双目标文件“第一文件零叶、第二文件补足合计”、todo、整份 `success=false`、file `status=failed`、叶 skipped/pending、失败计数与坏 schema/command_hash。部分回执仍只能放 `partial_gate_evidence`，不得使 `gate_status=passed`。

## 仍待审查与实施的限制

现有 P8/P9/P11 **正式默认文本回执不含完整逐叶 JSON reporter**；P11 第二条还只是带 `-t` 的 24 通过/56 未选子集，与卡面未筛选命令不同。因此本候选按原样会将三相位多命令 gate 维持非通过，直到取得同一当前版本、逐字命令与完整身份可核的真实 JSON reporter 补充原件。P9 两个真实 discovery 正例是测试资产登记原件，不是这三相位 gate 的替身。`P13.md:9` 的写面仍只许可 P5/T008 窄修；实施前需明确扩大授权。正式测试文件或材料一旦改动，会改变当前 tree/source digest，既有阶段行与正式回执变旧版，须重新绑定或保持未完成。

本次只交独立再审的候选 patch；RED/GREEN 目标与真实 P13 完整结构测试均未运行，不能报告通过。
