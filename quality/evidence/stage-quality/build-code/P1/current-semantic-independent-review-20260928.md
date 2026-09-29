# P1/T001–T003 现行语义独立复核（2026-09-28）

复核者：独立子代理 `/root/p1_current_semantics`。范围仅为当前三份 P1 交付文档、P1 卡、当前 `decision-log.md`/`spec.md`、相关真实生产者与 P2–P5 消费面；只读核对，不运行 P1 gate、全量测试或正式审查，不写 Task 事实。本文件不是官方审查结果。

## 结论

**有阻碍 P1 语义收口的现行矛盾。**三份文档的关键词检查曾通过，ADR-0033 已暂存，但入口库存的「当前实现状态」、规则文档的 AC-17 样例状态和 P1 卡的来源/入口状态已经与当前源码、规格冲突。先修这些现行文字，再用当时版本重采 P1 定向检查并独立核对；不能据旧 gate 绿色或本报告称 P1 Done。文档里的规则本身不等于真实权限隔离、业务验收或最后报告。

## 当前字节身份

工作树 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`，分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。本次读取的 SHA-256：

| 当前文件 | SHA-256 |
| --- | --- |
| `docs/architecture/test-asset-governance-rules.md` | `7522aded2bc14460c740ea2c42ab4775660c1249753f6201ba122e94f82ff128` |
| `docs/architecture/real-entry-inventory.md` | `394a73b8007defd569d77280f76b7db92853348a922d71fc48b1efbeb7ac23a0` |
| `docs/adr/0033-acceptance-truth-presentation-and-cohort-parity.md` | `77b43e75e1ca63ca565467a49f6bec34e880f39543a7de6e2f601ebb830c1c9f` |
| `specs/workflowhub-thin-core-card-04-20260919/phases/P1.md` | `dbec2499828cbfbf5e3cf4779fef29d5cdadea0c084ff1cd1ae3e095a5277057` |
| `specs/workflowhub-thin-core-card-04-20260919/spec.md` | `5c26350bd12e9976e60aef871b2d03247670eed6699de2ff509c3764e74cdceb` |
| `specs/workflowhub-thin-core-card-04-20260919/decision-log.md` | `01a9cb30dee551d30ffc929752ac137f76f14313e30de8e05837ea23ce6bbd40` |

ADR-0033 在 Git index 中为 `A`，`git ls-files --stage` 有当前文件；还没有进入 HEAD。前次 `current-gap-audit-20260928.md` 记的旧 `spec.md` 哈希已非当前字节，不能借它认证现行 AC-16 结论。

## 必须处置的现行问题

1. **T002 入口库存把已存在的实现写成尚未实现。**`real-entry-inventory.md:54` 称 `buildPostAcceptanceChainRows` 尚未实现、`acceptanceChain` 仍仅内联；当前 `runtime/stage/stage-runner.mjs:4264` 已导出该函数，`:4450` 已由 `currentPostBuildCodeSpecAnalyze` 调用。`:55` 称 `runtime/stage/stage-end-report.mjs` 仍为空壳；当前该文件已有 `buildStageEndReportFacts`、`renderStageEndReport`、`collectStageEndReportFacts` 三个实现导出。这两行是三处「冻结接口面」中的现行状态，P4/P5 与 CARD-10 会读，属于实质过时。应把“实现已存在但相位/真实消费未验收”分开写，不把源码存在说成整项通过。`:54` 同时把 `ac` 列为返回字段又注明实际字段为 `acceptance_criterion_id`；冻结形状应只写真实字段，避免消费者写错。
2. **T001 规则的样例现状已过期。**`test-asset-governance-rules.md:15` 仍称“没有 AC-17 样例任务，AC-17 MISSING”。当前 `spec.md:119`、`:637` 记录了 P6/T025 的受限实施者窄样例及独立复核，同时明确 P6 和整卡未完成；不能继续把“没有样例”当当前事实。`:43` 又称 P5/T007 “只负责未来事实层”，而现行转换器已有实现；应改为准确的局部完成/正式来源未完成状态。保留物理隔离尚不覆盖所有路径、真实验收仍不完整的限制。
3. **P1 卡的入口事实自相矛盾。**`P1.md` 的 T002 段承认入口清单已落盘且旧目标检查通过，但其增量测试蓝图中的“P1 独立 Phase 四层与跨 Task 旅程”仍称“T002 入口/消费者 inventory 仍 RED”；同页 T002 接口栏又要求核 `ENTRYPOINT.md`，而 `real-entry-inventory.md:3` 已查明本工作树和 Git 均无此文件。真实 UI 消费关系目前仍须 `unknown`，但不能继续用已不存在的“库存仍 RED”作为理由。应按当前库存与实际源码、`package.json` 重写状态与核查来源。
4. **T003 的来源编号不准确。**`P1.md:63` 把 T003 标为 `R-007（decision-log D-008）`；现行 `decision-log.md` 的 D-008 `requirement_ids` 是 `[R-001, R-004]`，R-007 在原始需求索引中主要是流程纪律，并非 ADR 内容的直接需求来源。ADR 正文的验收呈现与 cohort 决定来自 D-002/D-004/D-005，D-008 负责规则/ADR 的落地时序。应更正 T003 的来源链，保留历史 ADR-0032→0033 迁号事实。
5. **AC-17/18/19 的“当前处置”在规格自身互相冲突。**`spec.md:522–530` 仍分别称无受限实施者原件、行为样例未成立、纯文档 Task 样例缺失；同一规格 `:119–121`、`:637` 已记录三项窄样例或样例层独立复核。P1 的 AC-16 全集引用该 Appendix，故须把“样例层已证”与“完整功能/阶段尚未证”写成一致的当前事实；不能沿用旧 `MISSING`，也不能把窄样例升级成全项通过。

## 已核一致的部分及旧问题处置

- **AC-16 定义层**：当前 Appendix A 的 AC-16…AC-34 正好 **19 个不同条目**，编号连续。逐条读其条件、可观察行为、可比较的成功判据和具体失败例，19/19 都可按反例判定；当前没有发现四要素缺项且未标 `incomplete` 的条目。`decision-log.md:1415–1420` 的前六项与 Appendix 前六项是同一编号的历史来源，不另算六项。`spec.md:519–520` 已把旧审计所指的错误 `decision-log.md:1313–1340` 改成 Appendix A 与决策日志前六项；旧错误指针已不是当前问题。这只证明**定义可核**，不证明 19 项真的执行和通过；尤其 AC-17/18/19 的处置文字仍要按上项同步。
- **ADR 号与内容**：当前 ADR-0033 有背景、决定、后果三节，`ADR:3` 解释 0032 撞号迁移，`ADR:11` 已承认新增 `stage-end-report.mjs` 和 `stage-end-report-facts.v1`，并没有旧审查所指的“绝不新增文件/schema”矛盾。其“聊天原样交付、异源执笔、坏消息逐项列出、不把缺事实改成阻断门”的方向与 D-002/D-004/D-005、`CONSTITUTION.md` F3/F4/F7/Q1/Q3 相容。它记录方向，不证明当前生产路径已做到跨 cohort 核查或完成聊天交付。
- **旧替代审查三项**：`architect-fallback-output.json` 的 P1-ALT-01（T002 transcript 身份）有 `T002-green.meta.json` 和原件路径，属旧时点的证据补边，现行材料/源码变动后仍要同版重采；P1-ALT-02 的旧 ADR-0032 文件/schema 冲突在现行 ADR-0033 文本已修；P1-ALT-03 的 `--help` 原始输出已在 `T002-help.txt` 引用。原官方 attempt 是 `REVIEW_SOURCE_DRIFT/unavailable`，本次也没有把替代审查冒称官方通过。
- **下游引用**：P4 当前代码真实使用 `buildPostAcceptanceChainRows`，P5 当前转换器真实存在，`vitest.config.mjs:26` 引用规则文档；CARD-10 在库存三处接口消费者栏均列明。文档被引用或函数存在只说明消费者/落点，不能替代 P2–P5 的执行证据。P1 的三个结构命令只查关键词和 Git index，不能发现上述语义过时；这符合 `CONSTITUTION.md` Q1/Q3 与 `constitution-checklist.md` 对完成/独立审查的要求。

后续只需由材料 owner 精确修上列现行状态与来源，保持历史证据不改；稳定版本后按 `P1.md` 的三个任务命令和一个相位复合命令重新采当前原始结果，再做独立语义复核。本次没有运行这些命令，也没有发布 P1 完成结论。
