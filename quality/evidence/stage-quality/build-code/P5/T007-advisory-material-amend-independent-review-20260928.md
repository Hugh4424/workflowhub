# P5/T007 advisory 来源材料修订：独立复核（2026-09-28）

## 结论

**本次材料窄修订无 blocker。** 仅审材料差分，不裁决 T007 代码、测试或 P5/T008 完成。当前 `P5.md` 与 `spec.md` 的 sha256 分别为 `160c6c44c7276954ba93b0d5c2ea078c3ef34065144e07fb09aaba053703a10c`、`5c26350bd12e9976e60aef871b2d03247670eed6699de2ff509c3764e74cdceb`，与修订包 `after.sha256` 相同；`before.*` 和差分保留。

## 核对

- 原 FR-26/AC-26 要求机器判决原词面可见、进入“没做到”、不增推进门；FR-20/21 仍要求实际来源和执行事实。新文字仅把 T007 无法认证的 `source` 改为 `stageResult.quality_advisories` 原数组位置，同时逐条写明质量原件未核，没有把候选 ref 写成认证来源。
- 三种非通过判决 `material_incomplete`、`inconsistent`、`unavailable` 仍分别映为 `incomplete`、`inconsistent`、`unavailable`；逐条数目、各自机器词面、阶段、主题、非空原因和 `consistent` 不入“没做到”的负控均被明确保留。合成三条只测转换器不合并，不冒充一次正式运行。
- 冻结测试只许可修来源断言第④项和同样错误的“不同 advisory 位置”正控；首项错主题/缺失、多条共用 ref、生产者单条判决正负控继续保留。旧测试字节、哈希和 RED 须留存，新测试另记 RED→GREEN。当前工作树测试仍是旧来源断言，**本次材料通过不等于测试已修或已绿**。
- T008 仍须重读 advisory 质量事实、acceptance wrapper、stage-quality 原件并核 ref/hash、身份、主题及原始判决；缺失或歧义不能认证。正式 P5 报告仍受当前真实人写例外来源和其它同次来源条件约束，且明确禁止以通用 `human-confirmation.v3` 冒充专用例外来源。没有新增公共命令、门、进度账本、第二报告或质量权威。

## 范围

只读对照 `P5.diff`、`spec.diff`、修订前后哈希、前一份独立材料审查、当前 T007 测试及 FR-20/21/26、AC-20/21/26；未运行测试，未修改材料、生产代码或 Task facts。
