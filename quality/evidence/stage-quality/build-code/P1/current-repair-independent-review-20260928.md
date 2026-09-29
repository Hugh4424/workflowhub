# P1/T001–T003 现行修正独立复核（2026-09-28）

复核者：独立子代理 `/root/p1_repair_review`。只读检查本次两份交付文档、P1 卡与 `spec.md` 的修前/修后字节、当前源码和独立样例原件；未改代码、材料或 Task facts，未跑全量测试。本文件是独立语义复核，不是官方阶段审查或完成裁决。

## 结论

**上次指出的五类现行文字矛盾，已按当前可核来源修正；本轮未见新增语义 blocker。** 两份文档和 P1/spec 修订后的四条定向结构检查也已有同版原件，均 exit 0；这只证明文档结构，不是 P1 正式完成。旧官方 OCR attempt 仍为 `REVIEW_SOURCE_DRIFT/unavailable`，无 canonical result；本复核不把它改写为通过。

## 逐项核对

1. **P4/P5 的现状**：`real-entry-inventory.md` 修正了冻结接口表。当前 `runtime/stage/stage-runner.mjs` 导出 `buildPostAcceptanceChainRows`，`currentPostBuildCodeSpecAnalyze` 调用它；`runtime/stage/stage-end-report.mjs` 有 `buildStageEndReportFacts`、`renderStageEndReport`、`collectStageEndReportFacts` 三个导出。清单把这些称为局部实现，同时明说 P4/P5 正式 Phase、逐 AC 业务效果与跨卡消费未通过；行标识字段改为实际的 `acceptance_criterion_id`，不再误列 `ac`。
2. **受限实施者与报告样例**：`test-asset-governance-rules.md` 不再说 AC-17 完全没有样例，也不再把 P5/T007 写成仅有未来设计。P6/T025–T026 的两种容器样例及独立复核原件真实存在，复核 SHA-256 为 `6d88e1a8fe49e4a04752973846725e484283229a8a543deea204ac11ecc6b0ba`。规则保留网络旁路、认证最小化及完整 AC/P6 未证的限制；T007 转换器与 T008 真实报告来源分开表述。
3. **P1 卡入口与页面关系**：T002 输入及分层蓝图改用现有 `tools/cli/stage-runtime.mjs`、`runtime/interface/runtime-facade.mjs`、`package.json`、`README.md` 和库存证据。本 worktree 和 Git 跟踪文件均无 `ENTRYPOINT.md`，卡面不再将它作来源，也不再说库存仍 RED。页面消费者未核实，UI 适用性仍为 `unknown/provisional`，没有写成 N/A 或浏览器验收通过。
4. **T003 来源链**：P1 卡现将 ADR 内容连到 D-002/D-004/D-005，把 D-008 限于落地时序；R-007 被明确标为流程纪律。当前决策日志 D-008 的 `requirement_ids=[R-001,R-004]`，ADR 正文三项选择与上述决定相符。旧 ADR-0032→0033 迁号、旧失败原件未被改写；当前 ADR-0033 仍由 Git index 跟踪，未提交。
5. **AC-17/18/19 处置与 19 条原判据**：`spec.md` 三条现行处置分别承认 P6/T025–T026 的只读/隐藏及同字节 RED→GREEN→故障 RED 窄样例，以及独立纯文档 Task 的专属可失败检查；均继续写明完整 AC、P6/整卡未完成。AC-19 独立裁决当前 SHA-256 `144e3b617ce586fe25d1bd264322431acfbd2dfa0cad1f17326373cc89e58010`，只认可样例层，样例 Task 的交付/关闭尚未完成。逐条比对 `spec.before.md` 与当前 `spec.md`：AC-16…AC-34 共 19 条，条件、行为、度量和失败例所在的原判据行 **19/19 字节相同**；本轮仅改三条下面的“当前处置”。

## 检查原件和剩余边界

- 两份文档的修前/修后 SHA-256 与 `T001-T002-current-doc-repair-20260928/readback.json` 一致：规则文档 `7522aded…`→`890d0834…`，入口库存 `394a73b8…`→`513082d9…`。同目录 `T001-current-target.raw.txt` 和 `T002-current-target.raw.txt` 均含准确命令、原始输出 `rules doc OK` / `entry inventory OK` 及 `EXIT=0`。这些是**两条文档结构检查**，不能证明语义或整相位。
- P1 卡与 `spec.md` 的修前/修后 SHA-256 与 `current-material-repair-20260928/summary.md` 相符：P1 `dbec2499…`→`e3d12ac4…`，spec `5c26350b…`→`cd75ee93…`；该目录逐行差分只含上述精确修订。
- `T001-T003-gate-refresh-20260928` 的旧 T001/T002/T003/L0 原始 stdout、stderr、transcript 哈希均与 manifest 相符，四项 exit 都是 0；**但它记录的规则文档哈希 `7522aded…` 已非当前 `890d0834…`**，且其 P1 卡与材料版本亦为旧字节。不得把这组旧四绿称为当前 P1 gate。原官方 P1 review attempt `quality/reviews/attempts/e7623be1-6f1d-5258-aded-9b1e72812074/attempt.json` 仍 `unavailable`；旧替代审查及本次独立复核均不能冒充正式审查通过。
- 随后新增的 `T001-T003-current-gate-20260928` **属于本轮当前字节**：我重读其 `before.identity.json`、`after.identity.json` 和四份 `*.metadata.json`，Task ID 相同，材料版本均 `revision-a371277a19b8191bff44739b2a29ac88bb785a63f55752a02d9ffd22c5a251a6`，源码快照均 `cefe704ef140cc7cea7ed8bdd5ab3e0606f65571`，六份源材料哈希在每条命令前后稳定并与当前文档/P1/spec 字节相符。四份原始 stdout 分别为 `rules doc OK`、`entry inventory OK`、`ADR-0033 OK`、`P1 doc assertions OK` 加 `ADR-0033 tracked`；stderr 均空、exit 均 0，transcript 均有命令首行与 `EXIT=0` 末行。此为**本时点结构门通过**，不检查语义、入口实跑或业务效果，也不消除旧官方审查 `unavailable`。
