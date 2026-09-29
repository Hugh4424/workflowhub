# P10 未对应改动的最小处理方案（只读分析，未实施）

## 基线与当前边界

- 原始证据是 `T020-unmapped-206-census-20260927/index.json`：认证任务起点 `35a881ac3c3288249677597a9079d445949de778`，捕获树 `a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`，材料版本 `revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`；215 个真实改动路径，9 个对应三项登记案例，206 个未对应。分桶是 CARD05 归档 51、CARD05 合入非归档 94、当时工作树独有 61。此清单及原始分母原样保留，不通过改 Git 起点、缩小差分或删除路径求通过。
- **当前源码树已经变化**：例如 P13 正式测试原 SHA-256 `43a83d16123f57fd89dd75fa25e622d565c33fc10b372e49683e6c4ce685f6ba`，当前为 `76d5a58f502cb1482a0b052a6af861a0c6184b376095e682a40a4e42722a896e`（见 `P13/multi-gate-candidate-20260927/v2/source-identity.json` 和 `P13/aggregate-candidate-readonly-20260927/analysis.md`）。故旧树上的 215/206 是不可变历史观察，不代表新树的当次范围或收据有效；下一次正式运行前须由现有 Task/源码快照读取器重新取树、材料版本和真实差分，再另记新分母。不能复制旧回执称当前通过。
- **已有安全排除数为 0**。路径来源标签和当前三例无直接触发关系都不是无消费者证明。`AGENTS.md:58` 要求 `specs/archive/**` 只读保留；但 `tests/contract/post-spec-analyze-original-source.test.mjs:5` 确实读 CARD05 归档，不能把 51 项直接判为噪音。`case-selection.mjs:110-143` 目前对未对应路径返回整体 `unavailable/unmapped_changed_path`，这个事实应保持，直到新范围及关系经独立核查。

## 按真实消费者组织的最少业务用例组

以下是**候选组**，并非已经登记、执行或通过的案例；一组可覆盖多条同一调用链的路径，不能机械每路径一例。每组先由源码 owner 确定规则、消费者、完整正反观察和测试资产，再写登记关系并独立审查。

| 组 | 来源和真实消费者 | 要观察的行为及失败边界 |
| --- | --- | --- |
| 任务起点→自动选测→原始回执 | CARD04 P9/P10；`workflows/build-code/change-scope.mjs`、`test-asset-inventory.mjs`、`case-selection.mjs`、`targeted-capture.mjs`、`targeted-runner.mjs`、`capture.mjs`、`case-reconciliation.mjs`，由现有 build-code `verify` 入口消费 | 当前 Task 起点与树绑定，改动选到真实测试叶，子进程原始结果、哈希和回执可读；未对应路径、错 Task/树、漏叶/跳过/失败均保留并不得报业务通过。现有三例 49/49 只证已执行叶，不证全部改动或业务效果。 |
| 同次报告和人工例外 | CARD04 P5；`runtime/stage/stage-end-report.mjs` 由 `stage-runner.mjs` 消费 | 同次真实来源和报告逐项一致，真实用户例外声明可认证；缺报告、旧声明或异常缺源保持缺失。当前 T008 真报告未取得。 |
| 审查→阶段事实→状态 | CARD05 review/Task/Stage owners；`runtime/review/**`、`runtime/stage/completion-predicates.mjs`、`runtime/task/**` 与 `tools/cli/stage-runtime.mjs` 的现有调用链 | 真 provider 结论、attempt/result、阶段质量事实和 status 同 Task/材料/树对账；provider 不可用、错来源、缺审查不能变成完成。历史 bridge 只有证明不在当前 public 路径后才可讨论不适用。 |
| 决策来源→验收结果 | CARD04 P6/P7 与 CARD05 的四类结果生产者；`workflows/make-decision/SKILL.md`、当前 decision-log、验收校验/读取链 | 原始需求来源与当前写入结果一致；机器缺失、不完整、不可用仍为未完成；跨 owner 的生产结果须实际读回，不能从局部测试推定。 |
| 业务抽样→验收交接 | CARD04 P12、CARD05 verify owner；`workflows/verify-code/{SKILL.md,skill-deps.yaml,steps.json}` | 实际抽查来源、结构/风险、用户授权和交接顺序；文字检查通过不替代真实抽样或确认。 |
| 页面交互（仅找到真实入口后） | CARD04 P11；真实服务/路由和对应页面消费者 | 实际页面正常与失败路径、截图/控制台/网络原件；目前无认证页面入口，保持 `unknown`，不因无 URL 就写不适用。 |

P1/P2/P3/P4/P8/P9/P13 的文档、材料、配置和测试资产分别用已有定向门及真实消费者核对；测试文件/归档材料不强行伪装为业务功能。所有新登记关系必须指向有来源的规则和可运行测试，并保留 `uncharted_legacy=unknown`，直到库存实证覆盖。

## 第一项可执行目标

先做“任务起点→自动选测→原始回执”组。以**重新读取的当前 Task 树和材料版本**为输入，沿现有 `verify`→固定入口运行一项已登记案例，核测试目标的完整叶身份、原始退出码、回执哈希和当前源码绑定；再对照真实业务效果来源，没有独立效果就明确保持 `unknown`。最小负控：在同一认证差分中加入一条有当前生产消费者但未登记的改动路径，仍跑已选案例，并确认该路径完整留在 `unmapped_changed_paths`、整体仍是 `unavailable`；另用错 Task/旧树和漏测试叶分别证明不会误报通过。旧 206 清单不覆盖、不归零。现有 P10 合同和 49/49 回执可作为历史对照，不能复用为新树通过。

## CARD05 owner 需提供的排除依据

- **51 条 CARD05 归档**：逐路径或同一不可变目录给出来源、归档后消费者反向引用、哪些测试仍读取、为何不属于本次业务选例，以及相应历史/当前回归的独立结果。只读保留规则本身不够。
- **94 条 CARD05 合入非归档**：凡主张从 CARD04 业务选例排除的路径，均需对应 owner 给当前调用方、唯一消费者、功能归属与独立验证结果；其中 `runtime/review/**`、`runtime/stage/**`、`runtime/task/**`、`tools/cli/stage-runtime.mjs`、build-code/verify-code 技能与步骤有当前调用链，不能整桶排除。其余 docs、skills、tests、fixtures 也应按实际读者分类，不凭扩展名排除。
- 排除只能作为**有证据的选例分类**，原始 Task 差分和历史 206 列表仍可读；任何新增规则都须有负控，确保一个仍被生产入口使用的路径不会被误排除。没有上述证明时维持 `unknown/unavailable`。不能把“待 CARD05 核实”换算成已安全排除数量。

依据：`T020-runtime-workflows-31-audit-20260927/audit.md`（31 条代码/入口消费者）、`T020-worktree-only-61-audit-20260927/{index.json,summary.md}`（61 条 owner 与缺口）、`docs/quality/business-case-catalog.json`（仅三项种子案例、旧范围未知）、`workflows/build-code/case-selection.mjs:110-143`（未对应时的实际返回）。本文件未改产品代码、材料、目录或 Task facts，也未运行测试。
