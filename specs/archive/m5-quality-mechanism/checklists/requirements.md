# M5 质量机制——需求检查清单

> 每条 FR 与 decision-log 决策的映射关系。验收前逐行核，防漂移。

## FR 与 decision-log 映射

| FR | 对应决策 | 来源类型 | 用户批准证据 |
|----|---------|---------|------------|
| FR-FACT-001 | 决策 1/2 | 衍生+原文 | 「行,就这 4 个零开销事实」|
| FR-FACT-002 | 决策 1 | 衍生 | 同上 |
| FR-FACT-003 | 决策 2 / D7 | 原文 | 「不要搞太多文件…尽量复用已有文件」|
| FR-BOUND-001 | 决策 7 | 衍生 | grill 11 条「都对」|
| FR-BOUND-002 | 决策 7 (note 5) | 衍生 | 同上 |
| FR-BOUND-003 | 决策 8a | 原文 | 「都对,去写 decision-log」|
| FR-GATE-001 | 决策 5 | 原文 | 「对,进下一步」|
| FR-GATE-002 | 决策 5 / D7 | 原文 | 同上 |
| FR-GATE-003 | 决策 6 | 原文 | 「只在真危险的几个点问一下」|
| FR-GATE-004 | 决策 6 | 原文 | 同上 |
| FR-RESULT-001 | 决策 3 | 衍生 | grill 11 条「都对,去写 decision-log」|
| FR-RESULT-002 | 决策 3 | 衍生 | 同上 |
| FR-RESULT-003 | 决策 4 | 衍生 | debate 结果确认「都对」|
| FR-RESULT-004 | 决策 3/4 | 衍生 | 同上 |

## 验收清单（V1-V7）与 decision-log 第 7 节对应

| spec 验收 | decision-log 原条 | 防假绿要求 | 真跑活流程 |
|-----------|-----------------|----------|-----------|
| V1 | V1 不卡死 | 是（改 BLOCK 验红） | 是 |
| V2 | V2 质量门=0 | 是（注入 blocking 验红） | 是 |
| V3 | V3 三态放行 | 是（改 BLOCK 验红） | 是 |
| V4 | V4 错误传播 | 是（砍字段验红） | 是 |
| V5a | V5 V5a 拆分 | 是（算法失效验红） | 是 |
| V5b | V5 V5b 仅观察 | 无自动 gate | 是 |
| V6① | V6 坑一 | 是（注入采集 blocking 验红） | 是 |
| V6② | V6 坑二 | 是（注入运行时 gate 验红） | 是 |
| V6③ | V6 坑三 | 是（注入悬空 gate 验红） | 是 |
| V7 | V7 记录本身=交付 | 拒绝质量指标当门 | 是 |

## 覆盖核对（spec 完整性反查）

- [x] decision-log 9 条决策全部有对应 FR 或 spec 章节
- [x] 明确不做（§7 非目标）照搬 decision-log §5 明确不做
- [x] 验收 V1-V7（含 V5a/V5b 拆分、V6 三坑）照搬 decision-log §7
- [x] 防假绿铁律：每条验收命令须构造"声明为假"情形确认会红
- [x] 真跑活流程铁律（决策 8b）覆盖所有验收条
- [x] D5a 诚实声明已入速读卡
- [x] path guard 协同（决策 8a）已入 FR-BOUND-003 + 影响范围 §10
- [x] 四产出物（fact collector / 边界确认 / gate 三类 / stage_result）均有 FR 域覆盖
- [x] 业务影响范围（§10）覆盖 M4 execution-record / M2 path guard / workflowhub CI 三处
- [x] §10 与 decision-log 决策 2/5/8a 的 FR-SRC-TRACE 双向核已在 spec 末尾

## 需求 YAGNI 检查

以下几条在 intake 阶段被明确排除，spec 不出现：
- 撤销/软删机制（依赖 M5 无此基础设施，留未来）
- 独立 fact 文件（违背"别搞太多文件"）
- 强制改写现有 skill（stage_result 是新增可选形状，不强制）
- 平台原生错误形状复用（技术验证否决）
