# P10 未映射 31 条运行时与工作流路径只读审计

来源仅为 `T020-unmapped-206-census-20260927/index.json` 中 `runtime/**` 16 条与 `workflows/**` 15 条，索引 SHA-256 `2125e618b10ac49fdfbc50bc9a1acee9485c999f4a6874eb485e9eb90ba76a30`。本次读回身份见 `source-index.json`：CARD-04 Task、分支、HEAD `ef920f1fbd415fe87d50930359059b661e141acd`；只读 status 的当前材料版本 `revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`、来源树 `a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`，与固定索引的捕获树一致。索引按来源把 19 条归为 CARD-05 合并、12 条归为本工作树当时的未提交改动；这是来源分桶，不是代码所有权裁定。

当前 P8 三例只登记 AC-26 来源普查和两例 AC-27 验收状态，九条 `change_triggers`；下列 31 条**无一是三例的直接触发路径**。`tests/deferred-acceptance-semantics.test.mjs:4-8` 间接导入 `stage-runner`/`stage-handlers`，只核状态映射；模块被加载不证明下面的审核、执行、存储、报告或失败边界得到业务验证。建议按共同消费者合并设计少量有源用例和旧回归，**不是机械新增 31 个 case**；完整 215 路径仍由 P10 原始范围保持，未映射整体继续 `unknown/unavailable`。

表中“C5”=索引 `card05_merge_nonarchive_committed`，“本树”=`worktree_only_at_run`。`消费者:行号` 是当前代码/入口的可复核锚点；owner 以当前模块/Phase 负责方为建议，须由相应 owner 最终确认。

| 路径 | 来源；建议 owner | 当前消费者与具体风险 | 可执行处理 |
| --- | --- | --- | --- |
| `runtime/review/canonical-review-result.mjs` | C5；CARD-05 review | `stage-handlers.mjs:9,12`、`freshness.mjs:21` 解析/认证 provider 结论；错认会洗掉 finding | 与下五条共建当前 Phase OCR 结果/坏来源负控，不借旧 OCR 原件判通过 |
| `runtime/review/ocr-delegation-adapter.mjs` | C5；CARD-05 review | `tools/cli/stage-runtime.mjs:70,1763` 派发独立审查；路由/失败失真会让 review 假绿 | 同一评审 case 核真实 provider 结果、不可用 attempt 与 Task/材料/树错绑 |
| `runtime/review/review-packet-identity.mjs` | C5；CARD-05 review | `review-record-route.mjs:3`、CLI `:64` 绑定 packet/material；错 hash 可接纳异源结论 | 评审 case 纳旧 packet/错 hash 负控 |
| `runtime/review/review-record-route.mjs` | C5 且索引时脏；CARD-05 review | CLI `:10,1701` 写 canonical attempt/result；错 Task/重复分派影响审查事实 | 评审 case 核当前 `review --action=record` 返回 ref、失败保留和后续 phase_review 消费 |
| `runtime/review/schemas/attempt.schema.json` | C5；CARD-05 review | `schema-validator.mjs:5` 校验 attempt；坏 provider 原件可能被接纳 | 评审 case 保留坏 attempt schema 负控 |
| `runtime/review/schemas/result.schema.json` | C5；CARD-05 review | `schema-validator.mjs:6` 校验 result；不完整结论可能被误记 | 评审 case 保留坏 result/错 attempt 引用负控 |
| `runtime/stage/completion-predicates.mjs` | C5；stage runtime owner | `stage-runner.mjs:12`、CLI `:32` 推导阶段完成/材料范围；漏缺口可误报 completed | 建正式 run→quality→status 的同 Task 对账 case，缺审查/测试须保持 incomplete |
| `runtime/stage/protocol-error-whitelist.mjs` | C5；stage runtime owner | `stage-runner.mjs:26` 分辨协议错与质量失败；错误吞没会写假成功 | 同一阶段 case 用坏输入保原始错误与非通过行 |
| `runtime/stage/stage-agent-outcome-adapter.mjs` | C5；CARD-05 历史桥 owner | `tools/host/workflowhub-stage-agent-bridge.mjs:23` 仍可导入；项目 `AGENTS.md:48` 禁其回到 active run/close | 做“当前 public run 不读旧 bridge/outcome”的负控；仅证明无活跃消费者后才可判当前业务 N/A，历史字节保留 |
| `runtime/stage/stage-context.mjs` | 本树；CARD-04/CARD-05 stage owner | CLI `:19` 的 `bootstrapStage` 认证 Task/worktree；错目录可污染别的任务 | 阶段 case 核错 Task、错 worktree、旧材料拒绝 |
| `runtime/stage/stage-end-report.mjs` | 本树；CARD-04 P5 | `stage-runner.mjs:27` 转换/渲染；缺项可从报告消失 | P5/T007+T008 单独来源 case：真实同次 chain/报告/人工例外认证，缺源保持 missing |
| `runtime/stage/stage-end-report.test.mjs` | 本树；CARD-04 P5 测试 owner | P5 门及 `freshness.mjs:1077` 核其当前字节；它是测试资产，不是业务原件 | 登记为上述 P5 case 的真实测试目标和叶身份；测试绿不替 T008 用户确认 |
| `runtime/stage/stage-handoff.mjs` | C5；stage runtime owner | `stage-runner.mjs:24,1261` 阶段末交接；遗漏失败项会误导人 | 阶段 case 核 `not_done/unknown` 逐项保留，不把交接当通行证 |
| `runtime/stage/stage-runner.test.mjs` | 本树；CARD-04 P4 测试 owner | `phases/P4.md:14` 是 acceptanceChain 定向门；不是三例的执行目标 | 纳 P4 既有回归/相关业务关系，核真实 source_ids/coverage_limits；不能仅凭 7/7 升全卡通过 |
| `runtime/task/task-kernel-implementation.mjs` | C5；runtime/task owner | `task-handle.mjs:26` 与 `canonical-receipt-writer.mjs:8` 认证 writer；坏 ref 可入 Task | 阶段 case 核 canonical writer 的 Task/树/原始字节错绑负控 |
| `runtime/task/task-store.mjs` | C5；runtime/task owner | `stage-runner.mjs:28,1311`、CLI `:45` 写/读单行阶段事实；旧行覆盖可失真 | 同一阶段 case 核只有当前行、旧事实保留、质量 fact 回读一致 |
| `workflows/build-code/SKILL.md` | C5 且索引时脏；CARD-04 build-code owner | `workflows/build-code/steps.json:5` 是当前 agent 入口；可能漏自动选测、失败披露 | 在 P9/P10 真实入口 case 中核指令与固定执行/报告一致；文字绿不当业务绿 |
| `workflows/build-code/capture.mjs` | 本树；CARD-04 P9/P10 | CLI `:28,1653` 的正式 `verify` 捕获路；错命令/旧 receipt 可假绿 | P10 固定入口 case 核唯一命令、canonical raw/exit/ref/hash 与失败保留 |
| `workflows/build-code/case-reconciliation.mjs` | 本树；CARD-04 P10/T021 | `capture.mjs:329` 读逐例效果；错源会把 business `unknown` 升 pass | 同一 case 核原始效果、旧回执拒绝、206 未映射读回，整体不升绿 |
| `workflows/build-code/case-selection.mjs` | 本树；CARD-04 P10/T020 | `targeted-capture.mjs:11,96` 选受影响例；漏路径会静默漏测 | 同一 case 核混合/纯未映射及错树，未映射原列表保留 |
| `workflows/build-code/change-scope.mjs` | 本树；CARD-04 P9/T018 | `targeted-capture.mjs:9,90` 从 bootstrap 读 committed/dirty 变化；错起点漏测 | P9→P10 case 核当前全量差分、重命名/删除、错 Task 与起点缺失 |
| `workflows/build-code/skill-deps.yaml` | C5；build-code stage owner | `stage-skill-runtime.mjs:130`、`stage-runner.mjs:747` 绑定测试/审查依赖；错路由会跳检查 | 阶段 case 核实际测试技能/缺能力披露，不能由依赖文件存在推运行 |
| `workflows/build-code/steps.json` | C5；build-code stage owner | `step-manifest.mjs:164`、`stage-runner.mjs:753` 读取步骤；漏 P10/审查步骤可提前交付 | 阶段 case 核当前步骤事实/遗漏披露；不是新增 gate |
| `workflows/build-code/targeted-capture.mjs` | 本树；CARD-04 P10/T020 | `capture.mjs:15,363` 固定子入口；错 catalog/registry 可跑危险目标 | P10 case 核全认证后才执行、失败逐例原件及外层非零 |
| `workflows/build-code/targeted-runner.mjs` | 本树；CARD-04 P10/T020 | `targeted-capture.mjs:12,120` 真跑目标；路径/argv/reporter 错可伪造叶 | P10 case 核安全目标、完整叶/skip/坏 reporter、前例成功后失败保全 |
| `workflows/build-code/test-asset-inventory.mjs` | 本树；CARD-04 P9/T019 | `targeted-capture.mjs:10,92` 与 `case-reconciliation.mjs:12` 读独立 registry；漏叶可假全过 | P9→P10 case 核实际测试叶对 registry 双向完整、旧测试标识拒绝 |
| `workflows/build-plan/SKILL.md` | C5；build-plan owner 待认 | `workflows/build-plan/steps.json:5` 当前计划技能入口；错误计划可能遗漏相位/来源 | 对 CARD-05 合并行为做单独 plan 来源/消费者审计；本卡三业务例无此语义，不能机械 N/A |
| `workflows/make-decision/SKILL.md` | 本树；CARD-04 P7/decision owner | `workflows/make-decision/steps.json:5` 决策写入入口；错三来源可留下假 `non_ui` | 扩 P6/P7 来源写入用例或加决策材料 case，核当前 UI unknown 与旧原话分离 |
| `workflows/verify-code/SKILL.md` | C5 且索引时脏；CARD-04 P12/CARD-05 verify owner | `workflows/verify-code/steps.json:5` 语义抽样/授权交接入口；代码绿可洗成业务绿 | P12 真样本与授权交接 case；文案 3/3 不能替真实答复 |
| `workflows/verify-code/skill-deps.yaml` | C5；verify-code owner | `stage-skill-runtime.mjs:130` 绑定独立 review/业务依赖；缺路由可跳审 | 与 P12 case 核真实依赖调用或 unavailable 原件 |
| `workflows/verify-code/steps.json` | C5；verify-code owner | `step-manifest.mjs:164`、`stage-runner.mjs:753` 读审查/确认流程 | 与 P12 case 核真实 review→处置→确认顺序，缺任一项不判完成 |

## 决策边界

- **优先补关系的四组**：P9/P10 固定选择与真实效果（上表十个 build-code 路径）、P5 报告与来源、CARD-05 review/Task 阶段事实链、P12 业务抽样与验收交接。旧 P4 测试、make-decision 写入和 build-plan 技能分别补回归/来源审查；历史 bridge 只可在负控证明无活跃消费者后讨论当前 N/A。owner 应先确认业务规则/可观察效果/测试资产，随后改 catalog 和 registry；本审计不直接赋予任何 case `passed`。
- **不可机械判 N/A**：19 条 CARD-05 合并文件仍处于从 Task 起点到当前的真实差分，且多条在当前 public CLI 消费链；12 条本树路径也是执行/来源代码。三例测试间接导入模块、P4/P5/P12 局部测试变绿、或暂未发现页面，都不等于对应功能没有消费者或效果已证。当前 206 未映射路径仍须逐条在整体结果中披露，不能由这个所有权表缩减。
