# 独立读者判定（P9 收口，2026-10-31）

## 第 1 节：三问

### 1. 下一步做什么、在哪做、跑什么
**能。**
- 做什么：先由 build-plan 作者把七槽写进 P11 的「这一 Phase 怎么验收？」（第176–177行），并把 AC-EFFECT-001 的 P1 行加进 `<材料根>/spec.md` 的 Appendix A（第178–179行）；本片段是提议，未确认前不改 P11 或 spec，确认 owner=build-plan 交主会话（第158行）。P11 正式审测尚待主会话派发，收口后 A 取 P11 交付；红队在 A 副本上只改一处用户可观察行为造 B（第95–97行）。盲包由第三方复制 A/B、随机编号、封存，并记 sha256 与清单（第100–101、241行）。
- 在哪做：A/B 工作副本放 `/tmp/c07-p1-effect-A`、`/tmp/c07-p1-effect-B`；收口原件另存 `quality/evidence/workflowhub-ui-frontend-c07-real-page-verification-20261028/P1-effect/A/`、`B/`；两处都保留，不删不覆写，只关闭其中启动的服务（第14–16、98、102、146行）。答卷、记录与门禁原始输出也放 `P1-effect/`（第145行）。
- 跑什么：材料门禁在任务根跑 `node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/run-checks.mjs --material-root …`，看退出 0、`errors=0`、`ALL CHECKS PASSED`；12/36 只作对照（第213–215行）。B 的四文件门禁在 A/B 各自根目录跑，看退出 0、4 files/145（145 不锁）；加 `--reporter=verbose` 核八个具名块，并按表核九个判定器 = 八个具名块 + ORACLE-C07-TCR；ORACLE-EFFECT-BLIND 不参与「B 全绿」（第216–219、221–236、282–284行）。判定与消费者只能人读：判定者读验收、原始需求、A/B、门禁命令与原始输出，答卷须写标签、用户可观察差异、门禁为何区分不了；消费者按场景用一次并记录（第115–120、124、242–243行）。

### 2. 有没有需要我自己裁断的矛盾
**没有。** 已裁断项（单列，不算要裁断）：
- 提议未确认与写 P11/spec：第158行写明未确认前不改，确认 owner=build-plan 交主会话。
- 八个具名块与九个判定器：第54、235–236行写明四个文件、八个具名块加 Phase 级 ORACLE-C07-TCR；ORACLE-EFFECT-BLIND 不参与 B 全绿。
- 「门禁为何区分不了」由谁答：第57行取「判定者判」。
- 用户是否在场：第41行未定，第92行写默认不需要、owner=主会话派发时确认。
- AC-EFFECT-001 定义与登记：第167行说读 spec 的 Appendix A，第179行明确该编号当前不在 C07 spec、定义见 spec-fragment；取第179行。
- 145、12/36 只作对照不锁：第215、218、283行。
- 语义判定写不出 RED/GREEN 命令：第194–203行保留缺口、记 `incomplete`，不写假命令。

### 3. 能不能不回头问作者
**能。** 依据：判定者、红队、第三方、消费者名字未定但 owner=主会话派发时填（第42–43、129–130行）；A 取不到或 P11 未实施则停、记 `incomplete` 与恢复条件（第95–96、104行）；消费者字段核不到停在字段、owner=build-plan（第280行）；提议待确认 owner=主会话（第158行）。这些都有 owner 或恢复条件，不是要问作者；需等的只是主会话派发 P11 正式审测与各角色。

## 第 2 节：覆盖范围
按指令全文读了 `reader-instruction.md`、`phase-fragment.md`、`original-need.md` 三份；未读 README、旧 verdict、specs、其它 evidence 或 git 历史，也未跑命令、未核路径真实性，原因是指令限定。判定只按材料是否足以让未参与者照做。

## 第 3 节：结论
三件都过。
