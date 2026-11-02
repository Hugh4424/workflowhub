# 独立读者判定（P9 材料重读，2026-10-31）

fresh context，只读三份文件，判「没参与的人能否照做」。

## 1. 三问

**问 1 下一步做什么、在哪做、跑什么：能。**
动作与输入：把本片段验收七槽落进试点 Phase 的验收节，并在 spec 补一行 AC。L167「本 Phase 的唯一 writer 是试点 Phase 的材料作者（build-plan 作者）」；L169–170「修改：…/phases/P11-去字面断言.md 的「这一 Phase 怎么验收？」七槽；owner=build-plan」；L171–172「新增（提议）：`<材料根>/spec.md` 的 Appendix A 登记 AC-EFFECT-001 的 P1 行…只加这一行」。
在哪：任务根（L8）、材料根（L10）、P11 与 `<材料根>/spec.md`（L11、L269）；A/B 放仓外隔离目录、`node_modules` 软链回仓根、门禁 cwd=各自根（L95–96）。
跑什么：材料门禁 `…/workflowhub/tools/cli/run-checks.mjs --material-root <材料根>`，看到「退出 0、`errors=0`、`ALL CHECKS PASSED`」，L208 说明 `phase_count=12`、`task_count=36`「不是通过条件」（L206–208）。控制有效性：A、B 各自根跑 `node node_modules/vitest/vitest.mjs run` 四文件（L210），看到 4 passed／145 passed；加 `--reporter=verbose` 核八个具名块（L212）；B 须过九个判定器＝八个具名块 + `ORACLE-C07-TCR`，逐条在 L216–226，L228 写 C07-TCR 不另设测试、入口即四文件门禁。
只能人读：L235「`unavailable — 只能人读`」，读验收、原始需求、A/B、门禁命令与原始输出（不含标签）（L48、L112），看「A 对、B 错、理由具体、门禁缺口具体」（L113–114）；L236 消费者记录环境、输入、实际结果、是否求助作者、基线（L115–117）。

**问 2 有没有要我自己裁断的矛盾：没有硬矛盾；两处已裁断但会误导。**
L234 同格并列「`node quality/tests/build-blind-packet.mjs` 与 `0`」和「脚本未提供，unknown — 不虚构；owner=任务 1 执行者（手工复制、随机编号、第三方封存）」：走手工已写明，但照抄会去跑不存在的脚本。L92「A 取 P11 当前交付（仓内当前字节；…正式审测尚待派发…）」对 L127「时点：实现完成、审查问题修完之后才判」与 L272「依赖：`none`」：按 L127 可判，不必我定，但三处口径宜统一。已裁断单列：人名 unknown、owner=主会话（L39、L124–126）；用户是否在场（L41「未定」对 L88–89「不留给读者猜」）；A 取不到即停并记 `incomplete`（L93、L101）；语义判定无命令（L121）。

**问 3 能不能不回头问作者：下一步能，收口不能。**
能：造 B 的做法「在 A 的副本上只改一处用户可观察行为，使同一门禁仍全绿」（L94）、封包与「`shasum -a 256`」（L97）、失败回修分诊（L130–136）、模板与治理节指针（L35–36、L162–163）都写死。不能：L273–274「消费者…必须与 `phases/index.md` 的 consumer 逐字一致；index 未提供，unknown」须问真值；L126 要「第三方编号与拆封」，而 L39 人名清单只有判定者、红队、消费者，第三方无人无 owner，用例 4（L118–120）拆封记录无人可出。两处不补，承接（L139–142）与 Done 只能停在 `incomplete`。

## 2. 覆盖范围

三份全文（284／19／53 行）。未读 README、旧 verdict、原件目录、`specs/`、git 历史；未跑命令、未查仓库、未问作者。材料引用的 P11 正文、phase 模板、`test-asset-governance-rules.md`、`phases/index.md` 与 145／12／36 等数字我未核实，故判的是可照做性，不是这些事实成立。按指令未用 `R-PILOT-001`。

## 3. 结论

有缺口：第 3 件——下一步能照做，收口前必须问 `phases/index.md` 的 consumer 真值与「谁做第三方编号与拆封」，材料未给两者 owner；第 1 件过；第 2 件过，但上述两处宜统一。
