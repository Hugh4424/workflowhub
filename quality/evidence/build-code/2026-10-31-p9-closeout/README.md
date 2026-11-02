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
| `gate-fix.*` / `validator-fix.*` | 修好两处断言后的同命令重跑：门禁 121 测全绿、退出 0；校验器退出 0 |
| `phase-fragment-v2.md` | 改正版片段：29159 字节、291 行、`7a4e6d7ff214db0570bc8c794326c27dd48d1aee93c3e3e858b124bd501fd8e7`；只改计数 4 处，其余一字不动 |
| `phase-fragment-v2-diff.md` | v1→v2 的改前/改后逐字原文、改动行号（111–112、221、235–236）与理由 |
| `reader-instruction-v2.md` | 派给 v2 新读者的原文 |
| `reader-verdict-v2.md` | v2 新读者原答：第 1、3 问过，第 2 问报两处要自裁 |
| `phase-fragment-v3.md` | 再改正版：30078 字节、292 行、`11476ca21ef0efaaa4fd8110973a489cb57b1e187422ebc13bec514af12beb22`；只修 v2 复验报的两处 |
| `phase-fragment-v3-diff.md` | v2→v3 的改动、理由与十个 describe 块的 file:line |
| `reader-verdict-v3.md` | 同一读者受影响复验：两条都已解决 |
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

## 补记（2026-10-31，后续修复与勘误）

上面各节保留 11:53 当时的实况，不改写；这里补记此后发生的事，两者合起来才是当前状态。

- **门禁两红已修**：`tests/contract/phase-prose.test.mjs` 第 7 行 `35`→`36`；第 8 行按现行标题定位
  （`### 任务 1：…` 到 `### 任务 2：…`），并加一条「改不动就红」的守卫。同一条门禁重跑：
  **121 测全绿、0 红、退出 0**，原件 `gate-fix.stdout.txt`、`gate-fix.stderr.txt`、`gate-fix.exit`。
  删正文探针仍按预期报 `phases/P9-材料为读者写.md T025 task card requires reader prose`（退出 1），
  恢复原字节后 2 测全绿（退出 0）。
- **主仓校验器复跑**：退出 0，`phase_count=12 task_count=36 errors=0`、`ALL CHECKS PASSED`，
  原件 `validator-fix.stdout.txt`、`validator-fix.stderr.txt`、`validator-fix.exit`。
- **勘误（原件未改）**：本目录 `phase-fragment.md`（28902 字节、`87448f78…`）第 111–112、221、235–236 行
  写「八个具名块」，实数是**四个测试文件里 10 个 describe 块承载 9 个判定器**
  （8 个 `ORACLE-` 命名 + 2 个 `page-audit` 块承载 `ORACLE-PAGE-AUDIT-DOC`；
  `ORACLE-C07-TCR` 由四文件门禁整体承载，不另设块）；逐块清单见 `gate-root-cause-probe-2.txt`。
  该文件是两位读者读过的字节版，sha256 被本目录与 P9 卡多处引用，读者原答按行号引用它，
  按证据规则不覆写；更正落在 `specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/phases/P9-材料为读者写.md`
  第 951–953 行与本补记。要彻底收干净，另做一份改正版片段并记改前/改后，或让一位读者按勘误重读三问。

## 补记二（v2 改正版与重读结果）

按「不改被读字节、另出改正版」的办法补齐计数：

- **v1 不动**：`phase-fragment.md` 28902 字节、291 行、`87448f78…`；两位读者原答的行号引用继续有效。
- **v2 只改计数**：`phase-fragment-v2.md` 29159 字节、291 行、
  `sha256 7a4e6d7ff214db0570bc8c794326c27dd48d1aee93c3e3e858b124bd501fd8e7`；
  改 111–112、221、235–236 共 4 处，逐字改动见 `phase-fragment-v2-diff.md`。
- **重读**：一位 fresh-context 新读者只读 `phase-fragment-v2.md`、原始需求 R-001 与 `reader-instruction-v2.md`，
  不看旧原答；原答落 `reader-verdict-v2.md`。结果：第 1 问能、第 3 问能，**第 2 问有**——
  ① 片段既是 `AC-EFFECT-001` 的 P1 行、又要落进 P11 的七槽，哪句进哪份没说死；
  ② 正文说 10 个 describe 块，判定器表只有 9 行、只数得出 8 个具名块。
- **档位**：`AC-C07-010` 仍记 `incomplete`。计数错已在 v2 闭合，但按材料自己的「不用自己裁断」判据，
  新读者仍要自裁两处，故不记 `available`。
- **下一步**：把两处改掉再让一位新读者重读：① 写明哪些文字进 P11 七槽、哪一行进 spec；
  ② 判定器表逐块列出 10 个 describe 块或加块数列。

## 补记三（v3 与 `available`）

v2 重读报的两处按受影响修复处理，v1、v2 都不动，另出 v3：

- **v3 只改那两处**：`phase-fragment-v3.md` 30078 字节、292 行、
  `sha256 11476ca21ef0efaaa4fd8110973a489cb57b1e187422ebc13bec514af12beb22`；改前/改后与块数出处见 `phase-fragment-v3-diff.md`。
  - 归属：加「本片段是示范，不是交付」，写明 P11 七槽只取「这一 Phase 怎么验收？」一节正文，spec 只加一行 P1 登记，P1 专属句不整段搬进 P11。
  - 块数：判定器表加「块数」列（0/2/1/1/1/3/2，SKIP-VISIBLE 与 TIER-MINIMAL 共用 ACCEPT-SCOPE 的块），
    表下写明按文件 2+1+2+5=10、按判定器九个、`ORACLE-C07-TCR` 是整组判定无自己的块、块数不是效果证明；
    用例 1 不再另报总数，改为按表逐行核九个判定器。十个 describe 名的 file:line 见 v3-diff。
- **复验方式**：只请上一位 v2 读者在原会话复核这两条（受影响复验，不重读全篇），原答 `reader-verdict-v3.md`，结论「两条都已解决」。
- **定档**：`AC-C07-010` 记 `available`。依据是 v3 字节；v1 两位读者的原答（`87448f78…`）作历史保留，v2 重读原答（`7a4e6d7f…`）留作过程记录。
- **一条非阻断建议**：读者建议 178 行补「不含 P1 归属句」；不影响定档，留给下一版。
- **不冒充独立测试**：本轮 121 绿与主仓校验器退出 0 是自跑事实；独立测试仍待原测试者 0e7d26f1 复验。
- **主仓校验器分层事实**：本卡修完后整集跑过一次退出 0（`validator-fix.*`，`ALL CHECKS PASSED`）；
  13:12 复跑整集退出 1，唯一错误是 P3 缺 `quality/evidence/build-code/P3-real-page-2026-10-31-readback.json`
  （P3 由他人并发修改，不在本卡写集），P9 段无错误；原件 `validator-recheck.stdout.txt`、`validator-recheck.exit`。
