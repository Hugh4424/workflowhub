# P9 读者判定（改正版片段 v2，2026-10-31）

## 1. 三问

### 问 1：下一步做什么、在哪做、跑什么

**答：能。**

- 做什么、在哪做：按 158 行先取主会话确认（未确认不改 P11/spec），再改写 `<材料根>/phases/P11-去字面断言.md` 的「这一 Phase 怎么验收？」七槽、在 `<材料根>/spec.md` Appendix A 加 AC-EFFECT-001 的 P1 行（176–179）。A 取「P11 审测收口后的交付」（95，正式审测尚待主会话派发）；B 由红队「在 A 的副本上只改一处用户可观察行为，使同一门禁仍全绿」（97）。A/B 放 `/tmp/c07-p1-effect-A`、`/tmp/c07-p1-effect-B`（完整树，`node_modules` 软链回仓根，98）；第三方随机编号封存，盲包=两份交付目录、验收节、原始需求、门禁命令与输出、清单（路径+sha256）（100）；原件与 `A/`、`B/` 同字节副本进 `quality/evidence/…/P1-effect/`，两处都保留（102、145）。
- 跑什么：任务根跑 `node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/run-checks.mjs --material-root <材料根>`，看退出 0、`errors=0`、`ALL CHECKS PASSED`（214–215）。A/B 各自根跑 `node node_modules/vitest/vitest.mjs run`，带 `tests/contract/` 下 page-audit-doc-contract、acceptance-plan、n11-plan-quality、n11-acceptance-rules 四个 `.test.mjs`，看退出 0（216–218）；加 `--reporter=verbose` 看每个 describe 具名通过项（219）。B 还须过九个判定器：C07-TCR（由四文件门禁整体承载，225、235）、PAGE-AUDIT-DOC、ACCEPT-PLAN、N11-CRITERIA-LOCK、N11-WRITESET-DIFF、N11-ACCEPT-SCOPE、N11-ASSET-FIRST、N11-SKIP-VISIBLE、N11-TIER-MINIMAL（221–234）；任一红即控制无效（114）；语义判定记 `unavailable — 只能人读`（242、283）。
- 只能人读时：判定者写「用户应看到什么」「哪类错必须被拒绝」「门禁为何区分不了」再标 A/B（115–117）；消费者记环境、输入、实际结果、是否求助作者、基线（118–120）；成功信号见 58 行。

### 问 2：有没有需要自己裁断的矛盾

**答：有。**

- P11 新验收节从哪来没写：12 行「本片段是 `AC-EFFECT-001` 的 P1 行（验收行号）」，33 行「本 Phase 交 AC-EFFECT-001 的一行」，176 行「修改……P11……的『这一 Phase 怎么验收？』七槽」、277 行写入集也是 P11 文件。照抄会把 33 行这类 P1 句带进 P11，另写又没判据；取哪种由我定。
- 块数对不上：111、112、221 行写「10 个 describe 块」，235 行写「8 个块以 `ORACLE-` 命名」，表 223–234 只列 8 个具名块（2 个 page-audit + 6 个 `ORACLE-` 前缀）。用例 1 的预期挂在「10 个 describe 块各有具名通过项」（112），又没像 145 那样写「计数不锁定」（218、283）；按 10 还是 8 判由我定。

已裁断：名字→owner=主会话（42、127–130）；用户在场→主会话（44、92）；消费者字段 unknown→build-plan、核不到停车（280–281）；A 取不到即停、回 build-plan（95–96）；145 只作对照、任务卡 RED/GREEN 属保留缺口（194–197、291）。

### 问 3：能不能不回头问作者

**答：能。** 依据 95–96、126–132、100–103、42/44/280–281、134–142/287–289；要协调的是主会话派发，不是作者。

## 2. 覆盖范围

只读指定的三份：本指令、`phase-fragment-v2.md`（291 行全文）、`original-need.md`（R-001 逐字）。没读 README、旧 verdict、原件、`specs/`、git 历史；没跑命令、没查仓库、没问作者，故不判路径与命令真伪，只判能否照着做事。

## 3. 结论

有缺口：第 2 问——P11 新验收节的来源与写法没写；describe 块数 10 与表列 8 对不上，需读者自裁。
