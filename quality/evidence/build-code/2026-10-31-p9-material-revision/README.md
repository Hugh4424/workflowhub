# P9 材料修订与重读（2026-10-31）

P9 的验收是「一份材料能不能让没参与的人照着做事」。上一轮两位独立读者读了
`quality/evidence/build-code/2026-10-31-p12-writeside-experiment/phase-fragment.md`
（sha256 `a5ab881f…`），判出四处缺口，P9 记 `incomplete`。
本目录按那四处缺口修订材料，再派新的独立读者重读。第一轮读者 A/B 又发现几处口径缺口，
回修成 v2；第二轮读者 D 指出收口 owner 缺口、C 超时未写出，回修成 v3；
第三轮 E 指出基线/计数/提议确认三处、F 判全过，回修成 v4；最后派 G/H 判 v4。
最终判定以 G/H 为准，前面各轮发现与回修都留在下面。

只写本目录；`phases/P9-*.md` 与 `2026-10-31-p12-writeside-experiment/` 里的原件未改。
原件改前改后重算，字节不变。

## 版本与 sha256

| 文件 | 字节 | sha256 | 说明 |
| --- | ---: | --- | --- |
| `../2026-10-31-p12-writeside-experiment/phase-fragment.md` | 18811 | `a5ab881f4d163b60a7c34bfbe621291dcba2b9782f72d649060624b3c0024afa` | 改前原件，未改 |
| `phase-fragment-v1.md` | 25454 | `054a61e3cfb423e27825b30c4096cd718b3549944b84cb9f75db0f2e46973be4` | 第一轮修订，读者 A/B 读 |
| `phase-fragment-v2.md` | 27391 | `c7f21a09528a7352e5b8136ff07deaa9db6947edaef9fc85046d089aa55d9ecd` | 第二轮修订，读者 D 读（C 超时未写出） |
| `phase-fragment-v3.md` | 27572 | `103b9b622e5eb442bc047b1b766726e69f58ec24dcdb9b13235771ddf01a6215` | 第三轮修订，读者 E/F 读 |
| `phase-fragment.md` | 27939 | `e2dc5fa62bbb9e5d461d6ba04dc42cce2b3eabbae19e3f5505b69e4a7d0c0708` | 第四轮修订，最终材料，读者 G/H 读 |
| `phase-fragment-v1.diff` | 27547 | `05f8ec34de5433cca269e8eaa60d76af355675e6769407a961f87f844342be47` | 原件 → v1 |
| `phase-fragment-v1-to-v2.diff` | 9541 | `a4c29622d510b7b3a90d5c883cd73cfe3f2c0a16fccb54847d740f2e9e26d155` | v1 → v2 |
| `phase-fragment-v2.diff` | 29699 | `a9b0ea6ac1622585c191bad658870a20abb50e33c9588230370c438fecd9044c` | 原件 → v2 |
| `phase-fragment-v2-to-v3.diff` | 5672 | `b0723b5da9248b213463030bf6a7df69423ae4fde963e93d3fae80b835d837de` | v2 → v3 |
| `phase-fragment-v3.diff` | 30401 | `a41985a7c5966799c37ed0f77b1af6cdf38d740c72e80905e84f96c7480934f5` | 原件 → v3 |
| `phase-fragment-v3-to-v4.diff` | 5733 | `a02d0fb4ff61afae581c7c66350e3ff667fc7eb4fc71f9391255bd4c8916307f` | v3 → v4 |
| `phase-fragment.diff` | 31456 | `e5a8ac44cace0813ab9e76d4487760afd9ea539da98879d6eea10fd3bc5a8125` | 原件 → v4，最终 diff |

改前 = `a5ab881f…`；改后（最终）= `e2dc5fa6…`。
四个修订副本都不是原件；原件仍只在 p12 目录，按原字节保留。

## 第一处：落不了地

**改前**（原文）：

> `> 本片段只写一个试点 Phase，不写其余 Phase；真实任务身份、路径、命令与环境未提供。`（第 6 行）
>
> `- **未决事实**：试点 Phase 是哪一个、真实路径/命令/环境未提供；`（第 30 行）
>
> `- **修改**：`specs/<task-id>/phases/P1-试点验收.md` 的「这一 Phase 怎么验收？」七槽；真实 task-id 未提供，路径 unknown，owner=build-plan。`（第 150–151 行）
>
> `| 控制有效：B 通过全部门禁 | 任务 1 | 控制 | `` `<试点 Phase 的门禁命令>` 与 `0` `` | 全部门禁原始输出；命令 unknown |`（第 187 行）
>
> `- **gate_cmd**: `` `unavailable — 语义判定只能人读；控制有效性命令由试点 Phase 提供` ``（不是可执行命令，按缺口记，不伪造）`（第 228 行）

**改后**（v4 保留）：

> 任务根：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028`；
> 任务 id：`workflowhub-ui-frontend-c07-real-page-verification-20261028`；
> 材料根：`<任务根>/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028`；
> 试点 Phase：`<材料根>/phases/P11-去字面断言.md`（简称 P11）；
> 本片段是 `AC-EFFECT-001` 的 P1 行（验收行号），试点 Phase 是 P11（Phase 编号）。
>
> 写入集改为 `<材料根>/phases/P11-去字面断言.md` 与 `<材料根>/spec.md`。
>
> **门禁命令（真实可执行；2026-10-31 实跑）**
>
> - 材料门禁：`node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/run-checks.mjs --material-root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028`
> - 试点 Phase 门禁（P11 的 `gate_cmd`）：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-doc-contract.test.mjs tests/contract/acceptance-plan.test.mjs tests/contract/n11-plan-quality.test.mjs tests/contract/n11-acceptance-rules.test.mjs`
>
> `gate_cmd` 改为上面那条四文件命令，并注明只证控制有效、不证效果；语义判定仍 `只能人读`。

同组落地的真实指针（不是新判据）：

- `spec.md` 的 `AC-EFFECT-001`：C07 当前 spec 无此编号，原「修改」改为「提议新增」，定义指向
  `quality/evidence/build-code/2026-10-31-p12-writeside-experiment/spec-fragment.md` 的 Appendix A；
  不改 C07 现有 11 条 AC。
- `docs/architecture/test-asset-governance-rules.md` 的「验收标准可执行形式」节：原写 `unavailable — 未提供`，
  实读存在（2026-10-31 核），改为可读指针。
- 环境：原「版本与提交号 unknown」改为本机认证 worktree、HEAD `48a15f02`、执行前核 `git status`。

## 第二处：判定器清单漏项

**改前**：

> `绿而错变体必须通过该 Phase 已列的全部契约测试、门禁命令、判定器、断言和回归；`（第 42 行）
>
> `- **用例 1（控制有效）**：对 B 跑试点 Phase 的全部门禁、契约测试、断言和回归；`（第 89 行）
>
> `B 通过全部门禁、契约测试、断言和回归，但一个用户可观察结果错；`（第 63 行）

三处都把「判定器」漏了；第 18 行又把「判定器」与「门禁命令」并列，不能当同一项。

**改后**（v4 保留）：

> 判据、反向场景 1、用例 1、失败信号、STOP 统一写「P11 已列的全部契约测试、门禁命令、表列九个判定器、断言和回归」。
>
> **P11 承接的判定器（逐条列全；八个具名块 + 一个 Phase 级；B 必须全部通过）**
>
> | 判定器 | 承载文件与具名块 | 判什么 |
> | --- | --- | --- |
> | `ORACLE-C07-TCR` | P11 机器字段 `oracle`；执行入口=四文件门禁，不另设测试文件 | P11 迁移整体 |
> | `ORACLE-PAGE-AUDIT-DOC` | `page-audit-doc-contract.test.mjs` 的 `page-audit.md judgment pack`、`page-audit method wiring` | 判据正文与接线 |
> | `ORACLE-ACCEPT-PLAN` | `acceptance-plan.test.mjs` | 七字段证据计划与缺项 |
> | `ORACLE-N11-CRITERIA-LOCK` | `n11-plan-quality.test.mjs` | 三件套与判据锁 |
> | `ORACLE-N11-WRITESET-DIFF` | 同文件 | 写集差异与越界 |
> | `ORACLE-N11-ACCEPT-SCOPE` | `n11-acceptance-rules.test.mjs` | 验收范围与例外 |
> | `ORACLE-N11-ASSET-FIRST` | 同文件 | 资产先行与登记 |
> | `ORACLE-N11-SKIP-VISIBLE` | 同文件 | 跳过留在分母 |
> | `ORACLE-N11-TIER-MINIMAL` | 同文件 | 未知边界不自动升全链路 |
>
> 并写明：`ORACLE-EFFECT-BLIND` 是本 Phase 判答卷的判定器，不参与「B 全绿」；上表九个才是 P11 的判定器。

九个判定器怎么核：四文件门禁退出 0；再加 `--reporter=verbose` 看每个 `describe` 名与通过项。
`ORACLE-C07-TCR` 是 Phase 级，执行入口就是四文件门禁，不把它当第九个测试块。

## 第三处：A/B 原件「用后删除」与「保留」互斥

**改前**：

> `临时 worktree 用后删除；`
>
> `A/B 原件、失败输出、答卷、消费者记录保留，不删不改。`

**改后**（v4 保留）：

> `A/B 所在目录随原件一并保留，不删除、不覆写；只关闭其中启动的服务；`
>
> `A/B 原件、失败输出、答卷、消费者记录保留，不删不改。`

全文再无「用后删除」。只留「保留」，理由：验收要可复核，删了原件无法复核。

## 第四处：判定者被要求答「门禁为何区分不了」却没读门禁

**改前**：

> `判定者只读验收、原始需求与 A/B，消费者按同一场景用一次；`（第 58 行）
>
> `判定方式=ORACLE-EFFECT-BLIND 核查答卷必填项（标签、用户可观察差异、门禁为何区分不了），缺一项不算通过。`（第 95 行）
>
> `- **边界**：判定者不改本 Phase 的验收标准或实现，只按原判据读真实产出；`（第 109 行）

**改后**（v4 保留，取「判定者判」这一种）：

> `- **本片段的选择（门禁为何区分不了由谁答）**：取「判定者判」这一种。理由：判定者是唯一同时看到 A/B 与用户可观察差异的角色；由实验设计者答等于自证。判定者可读门禁命令与原始输出（不含 A/B 标签），答卷必须写出这一问；实验设计者不再另答。`
>
> 场景、用例 2、边界同步改为「只读验收、原始需求、A/B、门禁命令与原始输出（不含标签）」。
>
> 判据新增「答卷同时写出门禁为何区分不了：指认门禁原始输出里哪一项只证明通过、没有覆盖该用户可观察差异」；
> 失败信号新增「答卷缺这一问或只复述退出码」。

## 第一轮读者发现与回修（v1 → v2）

第一轮读者 A/B 读 v1（`054a…`），发现四处主缺口已补，但仍有三类口径缺口：

- 读者 A：A/B 在仓外隔离 worktree，门禁命令却是相对路径，没写在哪跑；材料门禁预期锁死改动前计数 `12/36`；
  「三者缺一」不知道指哪三者。
- 读者 B：`ORACLE-C07-TCR` 的承载写作「P11 机器字段 oracle」，没有执行入口，与「九个具名块」冲突；
  消费者那次要不要用户在场未写、也没 owner；P11 的 A 现在有没有、没实施时谁先做未写；盲包格式与哈希算法未写；
  看具名块还得自己补 `--reporter=verbose`。

v2 的回修：

1. **A/B 构造与 cwd**：新增「A 取 P11 当前交付（P11 开发已完成，正式审测待派发，四文件门禁当前 145 通过）；A/B 各复制到仓外隔离目录，保留相对结构，`node_modules` 软链回仓根；门禁 cwd=A/B 各自根目录；做法同 `2026-10-31-p11-bad-input/runbook.sh`」。
   A 缺失时停、回 build-plan、记 `incomplete`。盲包写清包含物、清单与 `shasum -a 256`。
2. **材料门禁计数**：改为「退出 0、`errors=0`、`ALL CHECKS PASSED`；`12/36` 是改动前实读对照，不是通过条件」。
3. **「三者」**：改为「判据、成功信号、失败信号三者缺一」。
4. **`ORACLE-C07-TCR`**：表头改为「八个具名块 + 一个 Phase 级」，承载加「执行入口=四文件门禁，不另设测试文件」；
   用例 1 改为「八个具名块各有通过项；C07-TCR 由四文件门禁整体承载」。
5. **用户在场**：加「消费者默认不需要用户在场；若 P11 的真实消费场景必须用户操作，按原条件执行；是否需要用户由主会话派发时确认（owner=主会话）」。
6. **具名块**：门禁块加「同一条命令后加 `--reporter=verbose`，看到每个 `describe` 名与通过项」。

## 第二轮读者发现与回修（v2 → v3）

读者 D 读 v2（`c7f2…`）：Q1 能，Q2 没有硬矛盾（两处已裁断但会误导），Q3 不能。它的四点：

1. 机器字段「消费者」要求与 `phases/index.md` 的 consumer 逐字一致，但 index 未提供、也没 owner，收口无法核对；
2. 需要「第三方编号与拆封」，而人名清单只有判定者、红队、消费者，第三方没人也没 owner，用例 4 拆封记录无人可出；
3. 盲包行并列 `node quality/tests/build-blind-packet.mjs` 与「脚本未提供，unknown」，照抄会去跑不存在的脚本；
4. A 取「当前字节」与「审查问题修完之后才判」「依赖 none」三处口径不一。

读者 C 在 v2 上超时未写出 verdict（已中断），按 `未取得` 记，不拿它的缺席当通过。

v3 的回修：

1. **消费者**：`index 未提供，unknown，owner=build-plan 写卡前核；核不到停在该字段，不猜`。
2. **第三方**：`第三方由主会话派独立子代理，名字派发时填，owner=主会话`；未决事实的人名清单加「第三方」。
3. **盲包**：删掉不存在的脚本命令，改为「手工步骤：复制 A/B、随机编号、第三方封存；无现成脚本，不写假命令」。
4. **A 的时点**：改为「A 取 P11 审测收口后的交付；当前 145 通过只作预检，不作为 A 的最终字节」；
   依赖字段加「判定时点等 P11 正式审测收口，见『构造与清理』」。

## 第三轮读者发现与回修（v3 → v4）

读者 E 读 v3（`103b…`）：Q1 能；Q2 有；Q3 不能。它的三点：

1. 基线：判据说「若改既有行为，有改动前基线」，失败信号与 STOP 却无条件写「缺基线」；而材料又说产品行为保持原样，读者得自己定缺基线是否只限改行为。
2. 计数：A 的构造说 145 只是预检、不作为最终字节；门禁却要求看到 145。若 P11 审测后测试数变化，以退出 0 还是 145 为准，未写。
3. 提议：材料说「本片段是提议，未经真实确认」，没给确认 owner/条件；又写「见……自评」，材料没有「自评」节。

读者 F 读同一份 v3：Q1 能、Q2 没有、Q3 能，结论「三件都过」。

v4 的回修：

1. **基线条件**：判据加「本任务产品行为保持原样，故本条当前不适用，不拿空基线充数」；失败信号与 STOP 改为「改既有行为却缺基线」。
2. **计数**：门禁块写「145 是当前对照，不是锁定计数；P11 审测后按当前字节的实际通过数为准，门是退出 0」；`gate_cmd` 同步。
3. **提议确认**：加「确认 owner=build-plan 写卡前交主会话确认，未确认前不改 P11 或 spec」；删掉「与自评」的悬空指针。

## 门禁真实输出

| 命令 | 退出 | 真实输出 | 原件 |
| --- | ---: | --- | --- |
| `run-checks.mjs --material-root <材料根>` | 0 | `phase_count=12 task_count=36 errors=0`；`ALL CHECKS PASSED` | `gate-run-checks.stdout.txt` / `.exit` |
| P11 四文件 vitest 门禁 | 0 | `Test Files 4 passed (4)`；`Tests 145 passed (145)` | `gate-p11-vitest.stdout.txt` / `.exit` |

- 材料门禁用主检出的 CLI：`/Users/Hugh/Hugh/Project/workflowhub/tools/cli/run-checks.mjs`。
  本工作树的 `tools/cli/run-checks.mjs` 不支持 `--material-root`，实跑报 `unsupported arguments`、exit 1；
  材料写的是实跑通过的那条。
- P11 门禁必须在仓根跑（`node_modules/vitest` 在仓根）；在证据目录内跑相对路径会 `MODULE_NOT_FOUND`。
  本目录保存的是仓根那次真实输出。

## 读者第一轮原答（v1，`054a…`）

- 读者 A 文件：`reader-verdict-a.md`。三问：Q1 能；Q2 有（3 处）；Q3 能（带条件）。末行：
  「有缺口：第 2 件（A/B 隔离 worktree 与相对路径门禁怎么合、改动后材料门禁的预期计数、三者指哪些）。第 1、3 件过。」
- 读者 B 文件：`reader-verdict-b.md`。三问：Q1 不能；Q2 有（2 处）；Q3 不能。末行：
  「有缺口：第 1、2、3 件——第 1 件缺 `ORACLE-C07-TCR` 的执行入口与 A/B 构造、A 的取得；第 2 件缺该判定器落点与用户在场的取舍；第 3 件因此必须回头问作者。」

两读者原答全文在各自文件；上面是结论行与主要发现，不改写原话。

## 读者第二轮原答（v2，`c7f2…`）

- 读者 D 文件：`reader-verdict-d.md`。三问：Q1 能；Q2 没有硬矛盾（两处已裁断但会误导）；Q3 不能。末行：
  「有缺口：第 3 件——下一步能照做，收口前必须问 `phases/index.md` 的 consumer 真值与「谁做第三方编号与拆封」，材料未给两者 owner；第 1 件过；第 2 件过，但上述两处宜统一。」
- 读者 C：超时未写出 verdict（已中断），记 `未取得`；不拿缺席当通过。

D 原答全文在 `reader-verdict-d.md`；上面是结论行与主要发现。

## 读者第三轮原答（v3，`103b…`）

- 读者 E 文件：`reader-verdict-e.md`。三问：Q1 能；Q2 有（2 处）；Q3 不能。末行：
  「结论：有缺口：第二件、第三件——需补「缺基线」适用条件、145 的判定规则，并给「提议」的确认 owner/条件。」
- 读者 F 文件：`reader-verdict-f.md`。三问：Q1 能；Q2 没有；Q3 能。末行：「三件都过」。

两读者原答全文在各自文件；上面是结论行与主要发现。

## 读者第四轮原答（v4，`e2dc…`）

- 读者 H 文件：`reader-verdict-h.md`。三问：Q1 能；Q2 没有；Q3 能。末行：「三件都过」。
  它的 Q1 把「先交主会话确认提议 → 改 P11 七槽与 spec 一行 → 跑材料门禁 → 等 P11 审测收口取 A → 跑四文件门禁与九个判定器 → 人读盲判/消费者」串成了一条链。
- 读者 G 文件：`reader-verdict-g.md`。三问：Q1 能；Q2 没有；Q3 不能。原答：
  「失败回修只写「分诊者不是实现者」（L136），未指分诊者与重报人；P11「正式审测尚待派发」（L92）未写派发人。」
  G 只写了三问结论与行号，缺指令要求的覆盖范围与末行格式；按原答记，不替它补写。

两读者原答全文在各自文件；上面是结论行与主要发现。

## 三问结论

按较严记：两位读者都过才算过。

| 问 | 读者 H（v4） | 读者 G（v4） | 总体 |
| --- | --- | --- | --- |
| 1 下一步做什么、在哪做、跑什么 | 能 | 能 | 过 |
| 2 有没有需要自己裁断的矛盾 | 没有 | 没有 | 过 |
| 3 能不能不回头问作者 | 能 | 不能 | **不过** |

- 第 1、2 问：两读者都过。材料已把真实 task-id、P11 文件、两条门禁命令、九个判定器、A/B 构造与盲包步骤写清；两读者都认为没有未裁断的硬矛盾。
- 第 3 问：H 过，G 不过。G 指两处没有 owner：
  一是失败回修的「分诊者」与「重报人」只写「不是实现者」，没写是谁；
  二是 P11「正式审测尚待派发」没写由谁派。
- 结论：三问没有都过。按 P9「一条缺就记缺哪条，不拿另两条补」，P9 不能改 `available`。

## P9 能否改档

**不能，维持 `incomplete`。**

- 四处原缺口已补：真实 task-id、P11 文件与两条门禁命令；P11 九个判定器逐条列全；A/B 只留「保留」；「门禁为何区分不了」明确由判定者判并给了读集。
- 但最终 v4 上，读者 G 的第 3 问不过；按较严记，P9 的验收 10 仍不成立。
- 本目录只判「材料可用性」这一条；P9 整 Phase 的 Done 由 P9 自己的材料与其它验收决定，本目录不代签。
- 也不能因为 H 过了就改档：P9 的口径是「一条缺就记缺哪条」，两读者不一致时按较严记。

## 若不过程，P9 下次缺什么

只差 G 指出的两处 owner，补完再派两位 fresh 读者重读同一三问：

1. **失败回修的分诊者与重报人**：写明谁分诊（建议：独立判定者，不是实现者）、谁重报（建议：原判定者与原消费者），owner=主会话派发时填。
2. **P11 正式审测的派发人**：写明由主会话派发 P11 的正式审测，本 Phase 只等收口、不代派；收口前不取 A、不判。
3. 若再重读，建议同时保留 G 这种「只给三问结论」的短判与 H 这种全格式判，避免只看格式。

补这两处不需要改判据或结构，约十分钟；补完用同一三问重读即可。除这两处外，H 没有其它 open 项；
第一轮 A/B、第二轮 D、第三轮 E 的发现都已在 v2/v3/v4 回修并留了 diff。

## 新目录文件清单

### 材料版本与 diff

| 文件 | 字节 | sha256 | 用途 |
| --- | ---: | --- | --- |
| `phase-fragment.md` | 27939 | `e2dc5fa62bbb9e5d461d6ba04dc42cce2b3eabbae19e3f5505b69e4a7d0c0708` | 最终材料 v4（G/H 读） |
| `phase-fragment-v1.md` | 25454 | `054a61e3cfb423e27825b30c4096cd718b3549944b84cb9f75db0f2e46973be4` | v1（A/B 读） |
| `phase-fragment-v2.md` | 27391 | `c7f21a09528a7352e5b8136ff07deaa9db6947edaef9fc85046d089aa55d9ecd` | v2（D 读） |
| `phase-fragment-v3.md` | 27572 | `103b9b622e5eb442bc047b1b766726e69f58ec24dcdb9b13235771ddf01a6215` | v3（E/F 读） |
| `phase-fragment.diff` | 31456 | `e5a8ac44cace0813ab9e76d4487760afd9ea539da98879d6eea10fd3bc5a8125` | 原件 → v4 |
| `phase-fragment-v1.diff` | 27547 | `05f8ec34de5433cca269e8eaa60d76af355675e6769407a961f87f844342be47` | 原件 → v1 |
| `phase-fragment-v1-to-v2.diff` | 9541 | `a4c29622d510b7b3a90d5c883cd73cfe3f2c0a16fccb54847d740f2e9e26d155` | v1 → v2 |
| `phase-fragment-v2.diff` | 29699 | `a9b0ea6ac1622585c191bad658870a20abb50e33c9588230370c438fecd9044c` | 原件 → v2 |
| `phase-fragment-v2-to-v3.diff` | 5672 | `b0723b5da9248b213463030bf6a7df69423ae4fde963e93d3fae80b835d837de` | v2 → v3 |
| `phase-fragment-v3.diff` | 30401 | `a41985a7c5966799c37ed0f77b1af6cdf38d740c72e80905e84f96c7480934f5` | 原件 → v3 |
| `phase-fragment-v3-to-v4.diff` | 5733 | `a02d0fb4ff61afae581c7c66350e3ff667fc7eb4fc71f9391255bd4c8916307f` | v3 → v4 |

### 原需、指令与读者原答

| 文件 | 字节 | sha256 | 用途 |
| --- | ---: | --- | --- |
| `original-need.md` | 1183 | `a563c55380fdf0b2a8db0c36c89bf160efcf376f252ee1c5649869af5a431f19` | 原始需求 R-001 逐字 |
| `reader-instruction.md` | 2728 | `80c9f777b4f01c59a7a0ac9b60b7e3ba68e9cffe5404bdbcf5ef79f73f746942` | 三问与纪律 |
| `reader-verdict-a.md` | 4390 | `895f22ad58b5e98a099f7b316bac3ebd2ef255e8e350f16256ba5211ca44b243` | 第一轮 A（v1） |
| `reader-verdict-b.md` | 4156 | `45ecf31659b8223c5228227ea7dde3212c93777191147466cdf69b595b26aaa8` | 第一轮 B（v1） |
| `reader-verdict-d.md` | 3984 | `2a34e440e327de7d0ad2af1d63da9582102ca63d083ffec115740c64cbbde707` | 第二轮 D（v2） |
| `reader-verdict-e.md` | 3034 | `1f1ddb6e2603e47c81f05ce755d516b4f209d45eb8e257621484aa513e164e45` | 第三轮 E（v3） |
| `reader-verdict-f.md` | 4490 | `2c1a567d3a040c9ffbeb61b59d692753c8b42f44e0d42fa453e00c4ae8b002da` | 第三轮 F（v3） |
| `reader-verdict-g.md` | 601 | `4fedd65c6d288c7e23ed4a6c2c3d63088a4c6a2b7fc555fc4403a44ac08bc1c4` | 第四轮 G（v4，短判） |
| `reader-verdict-h.md` | 2915 | `c5ee3f41552d8fcceaaefd2c326e195200e0707490adcf31a7d5525185131f47` | 第四轮 H（v4） |

### 门禁原件

| 文件 | 字节 | sha256 | 用途 |
| --- | ---: | --- | --- |
| `gate-run-checks.stdout.txt` | 9892 | `fe9daa346c6acaad4c8df954ad35bc8e1ceba303228ef1a288bebd225ecd9015` | 材料门禁完整输出 |
| `gate-run-checks.stderr.txt` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 空 |
| `gate-run-checks.exit` | 2 | `9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa` | 退出码 `0` |
| `gate-p11-vitest.stdout.txt` | 556 | `d2c50a6bde7348c9e7b5ff21490c57acd805bc6732df89ce8fe4a4efe56f2281` | P11 四文件门禁输出 |
| `gate-p11-vitest.stderr.txt` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | 空 |
| `gate-p11-vitest.exit` | 2 | `9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa` | 退出码 `0` |

### 本记录

`README.md`（本文件；哈希随最终写入变化，不列自哈希）。

## 限制

- 四轮读者都是 fresh-context 子代理，但无法证明完全无背景；按「独立上下文」记。
  读者 C 超时未写出，记 `未取得`；读者 G 只写了短判、缺覆盖范围与末行格式，按原答记。
- 读者只读材料、原需与指令三份，未跑命令、未核路径；他们判的是文字能否让读者做事，不是路径真伪。
  路径与命令的真实性由本目录的门禁原件与实跑记录证。
- 两读者结论不一致时按较严记：H 判三件都过，G 判第 3 件不过；P9 因此仍 `incomplete`，不挑对自己有利的一份。
- 门禁原件是在 v4 定稿前跑的；两条命令不随材料版本变化，仍有效。
  P11 门禁是在仓根对当前仓跑的，证明命令可执行、当前 145 通过；它不等于 A/B 各自根目录那次控制。
- 修订副本是提议材料；P1 行未执行：没有 A/B、没有独立判定者、没有消费者、没有拆封记录。
  本目录只判「材料可用性」，不把可用性冒成效果；P9 这次没有改档。
- 本目录是逐件原件，不是目录快照；原件未复制，只引用路径与 sha256。
