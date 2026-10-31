# 独立读者判定（f，2026-10-31）

角色：fresh-context 读者，只读 `phase-fragment.md`、`original-need.md`、`reader-instruction.md`。

## 第 1 节：三问

### 1. 下一步做什么、在哪做、跑什么——能

**做什么**：取 A（P11 审测收口后的交付，由 P11 实施者提供），由红队在 A 副本上只改一处用户可观察行为造 B（同一门禁仍全绿），A/B 各复制到仓外隔离目录、`node_modules` 软链回仓根，第三方随机编号封存；再依次跑用例 1（控制）→ 用例 2（盲判）→ 用例 3（消费者）→ 用例 4（拆封核对）。
依据：「A 取 P11 审测收口后的交付……当前四文件门禁 145 通过只作预检，不作为 A 的最终字节」（92 行）；「B 由红队在 A 的副本上只改一处用户可观察行为，使同一门禁仍全绿」（94 行）。

**在哪做**：任务根 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028`；A/B 在仓外隔离目录，门禁 cwd=A/B 各自根目录（86、96 行）；材料改 `<材料根>/phases/P11-去字面断言.md` 七槽与 `<材料根>/spec.md` 的 P1 行（169、171 行）；证据落 `quality/evidence/workflowhub-ui-frontend-c07-real-page-verification-20261028/P1-effect/`（139 行）。

**跑什么**：
- 材料门禁（任务根，`errors=0`、`ALL CHECKS PASSED`，208 行）；
- 试点门禁：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-doc-contract.test.mjs tests/contract/acceptance-plan.test.mjs tests/contract/n11-plan-quality.test.mjs tests/contract/n11-acceptance-rules.test.mjs`，预期退出 0、`Test Files 4 passed (4)`、`Tests 145 passed (145)`（210–211 行）；加 `--reporter=verbose` 核八个具名块（212 行）；九个判定器＝八个具名块＋Phase 级 `ORACLE-C07-TCR`，B 必须全过（214、218、228–229 行）。
- 语义判定「只能人读」（235–236 行）：判定者只读验收、原始需求、A/B、门禁命令与原始输出（不含标签），先写「用户应看到什么」「哪类错必须被拒绝」「门禁为何区分不了」，再标 A/B，由 `ORACLE-EFFECT-BLIND` 核答卷三项（112–114 行）；消费者按真实场景用一次并记录，判定看记录而非重跑门禁（115–117 行）。

### 2. 有没有需要自己裁断的矛盾——没有

未找到两处冲突且材料未写取哪个的地方。易误读处，材料均已自裁：
- 「按文件四个、按判定器九个」已写明取舍（228–229 行），并写明 `ORACLE-EFFECT-BLIND` 不参与 B 全绿（229 行）。
- 「门禁为何区分不了」由判定者答，写明「由实验设计者答等于自证」（54 行）。
- 任务卡不展开：写明保留缺口、不写假卡片（187–196 行），属已裁断的缺口。
- 依赖字段 `none`（272 行）与「判定时点等 P11 正式审测收口」（92 行）并存：字段自身把时点指向「构造与清理」，取「时点等收口、不依赖更早 Phase 产品代码」，非无主矛盾。
- 门禁全绿仍不能作 A：明写 145 通过只作预检（92 行）。

### 3. 能不能不回头问作者——能

依据：人名未定均写 owner=主会话，「名字未提供，owner=主会话派发时填」（39、124–126 行）；是否需用户在场「由主会话派发时确认」（89 行）；机器字段消费者未提供时「owner=build-plan 写卡前核；核不到停在该字段，不猜」（273–274 行）；A 取不到写明「停，回 build-plan，不代做 A，记 `incomplete` 与恢复条件」（93 行）；拿不到写 `unavailable`/`incomplete`（101 行）。缺口已连 owner/恢复条件交出，读者按判据推进，不必问作者。

残留一处需读者自行派发（非问作者）：A 依赖 P11 正式审测派发与收口，材料只写「正式审测尚待派发」（92 行），未写由谁触发；属主会话派发职责。

## 第 2 节：覆盖范围

- 读了：`reader-instruction.md` 全文 53 行；`original-need.md` 全文 19 行；`phase-fragment.md` 全文 284 行，重点 43–142、198–257 行。
- 没读：README、旧 verdict、原件目录、`specs/`、git 历史、模板与门禁文件、`runbook.sh`；按指令排除。
- 没跑命令、没查仓库、没问作者，故无法核实路径和门禁是否真存在：只判「材料能否让没参与的人照着做事」。

## 第 3 节：结论

三件都过
