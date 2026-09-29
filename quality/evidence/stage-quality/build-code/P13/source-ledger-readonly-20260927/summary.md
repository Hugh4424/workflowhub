# CARD04 P13 来源清单（只读准备）

当前 Task 的 16 份材料版本 `revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`、树 `a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`；`facts.jsonl` SHA-256 `5b323de258d1628bf1aebf98a9c5ceddb06ea40db0b1c4544553654ec096ae78`，只有 make-decision/build-plan 两行，**没有 build-code 阶段行**。本清单逐 Task 的真实 ref/hash、命令、退出码及缺口见 [index.json](index.json)。它不是最终汇总或验收结论。

| Phase | Task | 已有局部事实 | 尚缺 |
| --- | --- | --- | --- |
| P1 | T001, T002, T003 | document_gate_noncanonical | 文档门验证了文字/跟踪，未证明真实入口逐项使用；该门绑定旧整树，四份检查文档当前字节相同。owner: P1/T001-T003。 |
| P2 | T004 | 1 通过，8 未选 | 复杂度数字与断言的局部测试；正式阶段质量和整卡效果缺。owner: P2/T004。 |
| P3 | T005 | Tests  4 passed (4) | 材料入口局部合同；不证明所有 post 路线实跑。owner: P3/T005。 |
| P4 | T006 | Tests  7 passed (7) | acceptanceChain 单测；当前 CARD04 真 build-code 阶段 AC 行缺。owner: P4/T006 / runtime。 |
| P5 | T007, T008 | Tests  20 passed (20) | 仅 T007 纯转换器 20/20；T008 真同次来源、P5 report-facts/report/delivery、真实人工例外声明均缺。owner: P5/T008 与 stage runtime。 |
| P6 | T009, T010, T011, T012, T013, T014, T025, T026, T027 | Tests  79 passed (79) | 八文件 79/79 与 Node guard；夹具 E2E 不是本 Task 真业务。T025 受限样例只窄样；T026 同字节 RED→GREEN→RED 窄样；T027 README 候选四阶段质量/交付不完整。owner: P6/T009-T014,T025-T027 及独立 README Task。 |
| P7 | T015, T016 | Tests  62 passed (62) | 四文件 62/62；当前 CARD04 AC27 官方四类 producer/fact 未由本卡证实，CARD05 owner。 |
| P8 | T017 | Tests  2 passed (2); Tests  10 passed (10) | catalog 两条当前正式合同 2/2+10/10；三个 case effect_observation 仍 not_yet_observed，不能据来源绑定说业务效果通过。owner: P8/T017 与 P10/T021。 |
| P9 | T018, T019 | 两组分别 12/12、11/11 | 真实完整变更/测试资产库存与 206 未映射仍未收口。owner: P9/T018-T019。 |
| P10 | T020, T021 | 合同 78/78、23/23；真实三例 49/49 | 206 路径未映射，整体 unavailable、业务 unknown，当前正式独立 review pending。owner: P10/T020-T021、各未映射路径 owner。 |
| P11 | T022 | 协议 5/5；受影响 24 通过、56 未选；Node 22/22 | 未运行真实页面/服务/浏览器，也无外部效果。owner: P11/T022 与页面服务 owner。 |
| P12 | T023 | Tests  3 passed (3) | 正式 3/3 仅技能文案；真实风险抽样、verify-code 消费、授权者答复均缺。owner: P12/T023 与授权业务者。 |

P1 文档 gate exit0，四份检查文档与现字节相同，但其整树版本较早。P10 当前正式 review 正由另一代理处理，记 pending；旧 review 的树均非当前树，不能当本轮审查。P10 真实三例只跑 49 叶，206 路径未映射，整体 unavailable、业务 unknown。P5 只证 T007；P11 只证协议；P12 只证技能文本。未跑任何新测试，未修改源、材料或 Task facts。
