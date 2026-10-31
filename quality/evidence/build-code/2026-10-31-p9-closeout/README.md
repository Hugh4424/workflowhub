# P9 读者验收收口（2026-10-31）

这一目录收口 P9 的验收 10（`AC-C07-010`）：补上上一轮读者判出的四处缺口，
再派两位互不可见的独立读者重读同一三问，最后定档。

只写本目录与 `specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/phases/P9-材料为读者写.md`；
不动 `skills/decision-log/templates/decision-log-template.md`、`workflows/build-plan/SKILL.md`，也不做 Git 写。
被读的旧原件不复制、不改：`2026-10-31-p12-writeside-experiment/phase-fragment.md` 仍是
18811 字节、`a5ab881f4d163b60a7c34bfbe621291dcba2b9782f72d649060624b3c0024afa`。

## 文件

| 文件 | 说明 |
| --- | --- |
| `phase-fragment.md` | 本轮被读材料，28902 字节、`87448f78ac59a113da4f64d7797085c49cd9b2f2f9f3030b23ab9f55c2e5b48e`；在 v4 上补路径、补派发与分诊人、换 HEAD 锚 |
| `gaps-before-after.md` | 四处缺口的改前/改后逐条原文 |
| `reader-instruction.md` | 派给两位读者的原文，两人拿到的是同一份 |
| `reader-verdict-1.md` / `reader-verdict-2.md` | 两位读者各判一次，互不可见，都判「三件都过」 |
| `p9-gate.*` | 本轮 P9 门禁第一次运行：退出 1，121 测 2 红 119 绿 |
| `p9-gate-after-edit.*` | 改 P9 材料后再跑一次：同样 2 红，说明改材料不改变这两红 |
| `gate-root-cause-probe.txt` | 根因探针：旧标题定位改不动字；现行标题删正文后校验器返回 `ok=false` |
| `main-validator.*` | 主仓校验器整集输出与退出码 |
| `final-p9-gate.*` / `final-main-validator.*` | 全部改完后的最后一次同命令重跑：门禁 2 红 119 绿、退出 1；校验器退出 0 |
| `closeout.json` | 档位、三问结论、缺口、门禁事实与限制的机器可读记录 |

## 门禁：3 红只剩 2 红

- 改前（`2026-10-31-p9-reader-acceptance/p9-gate-worktree.*`）：103 测，3 红 100 绿，退出 1，红在
  `phase-contract-prose.test.mjs`（1 条）与 `phase-prose.test.mjs`（2 条）。
- 改后（本目录 `p9-gate.*`）：121 测，2 红 119 绿，退出 1，红只在 `phase-prose.test.mjs`。
  多出的 18 测来自 11:23 的 `e97e2810` 同步 `phase-contract-prose.test.mjs`；那条红因此自愈。
- 剩 2 红不是自愈项：11:23 材料重写把 P9 的卡标题从 `### T025 — 任务 1…` 改成 `### 任务 1：…`、
  编号挪进「任务编号」字段，又给 P12 补了一张卡（35→36）。测试仍按 `### T025` 定位、写死 35，于是
  「删正文」的变体改不动任何字、变成空操作，而断言要求它被拒。
  修法三处：`tests/contract/phase-prose.test.mjs` 第 7 行 `35`→`36`；
  第 8 行两个定位点都要换（`### T025`→`### 任务 1`、`(?=^### T026)`→`(?=^### 任务 2)`）。
  只换标题仍匹配不到，照改还是红——`gate-root-cause-probe-2.txt` 有这一步的实测。
  该文件在 Phase 的写入集里，不在本轮任务的写集里，没代改，如实记红。
- 校验器机制没坏：按现行标题删掉 T025 卡正文后返回
  `ok=false`、`phases/P9-材料为读者写.md T025 task card requires reader prose`；原样材料 `ok=true`、`task_count=36`。
- 主仓校验器两次都退出 0：`phase_count=12 task_count=36 errors=0`、`ALL CHECKS PASSED`。

## 结论

`AC-C07-010` 记 `incomplete`。文本层两条读者都判「能做 / 没有待裁断 / 不必问作者」，各带行号；
消费者记录只作第二条的旁证。但同源审查抓到一处文本与事实不符，见下，按较严的一档记。

同源审查三条（原文见 `same-source-review.md`）：

1. 门禁 2 红成立、整体不绿；我原先写的「修法两行」不成立——第 8 行仍含 `(?=^### T026)`，只换标题仍红，已改成三处定位。
2. 三问成立但有保留：答案具体；`reader-verdict-1.md` 把「用户在场」引成 41 行（实 43），
   且先说写 P11 再说未确认前不改，与第 158 行相反；「没有矛盾」只在文本层成立。
3. 模板在场基本成立；`available` 只在「读者说得出」这一自定判据内成立，
   上限没写「读者没跑命令、没核路径」。

因此未解项一条：材料在讲「四个文件里八个具名块」，四文件实有 10 个 describe 块
（8 个 `ORACLE-` 命名 + 2 个 `page-audit` 块承载 `ORACLE-PAGE-AUDIT-DOC`）；逐块清单见 `gate-root-cause-probe-2.txt`。
改法一句话；改完让读者加 `--reporter=verbose` 数块后重读三问即可改档。
本轮不改材料字节，免得两位读者的原答对不上新材料。

限制：只判这一版字节；两位读者都没跑命令、没核路径与计数；材料是提议、未在真实任务执行；
不推页面验收、其它 Phase 与长期稳定性。Phase 自身也未收口：门禁 2 红、原测试者复验未到。
