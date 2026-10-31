# 改正版片段 v3 的改动记录（2026-10-31）

v3 只修 v2 重读报出的两条，不动 v1、不动 v2；验收七槽、判据、命令、A/B 路径不变。

| 版本 | 文件 | 字节 | 行数 | sha256 |
| --- | --- | --- | --- | --- |
| v1（两位读者读过，未动） | `phase-fragment.md` | 28902 | 291 | `87448f78ac59a113da4f64d7797085c49cd9b2f2f9f3030b23ab9f55c2e5b48e` |
| v2（只改计数，未动） | `phase-fragment-v2.md` | 29159 | 291 | `7a4e6d7ff214db0570bc8c794326c27dd48d1aee93c3e3e858b124bd501fd8e7` |
| v3（本轮） | `phase-fragment-v3.md` | 30078 | 292 | `11476ca21ef0efaaa4fd8110973a489cb57b1e187422ebc13bec514af12beb22` |

## v2 错在哪（保留，不抹）

v2 把计数改成「10 个 describe 块承载 9 个判定器」，这一句是**压缩过头**：

- 10 个 describe 块承载的是 **8 个具名判定器**（PAGE-AUDIT-DOC 2 块、ACCEPT-PLAN 1 块、
  CRITERIA-LOCK 1 块、WRITESET-DIFF 1 块、ACCEPT-SCOPE 3 块、ASSET-FIRST 2 块；SKIP-VISIBLE 与
  TIER-MINIMAL 与 ACCEPT-SCOPE 共用合并块）；
- `ORACLE-C07-TCR` 是**整组判定**，由四文件门禁整体承载、没有自己的 describe 块；它加那 8 个才是 9 个判定器。

v2 的写法让读者没法从表里把 10 块与 9 个判定器对上，也没有说清片段是示范还是交付。

## v3 改了什么

1. 头部加一条「本片段是示范，不是交付」：真实落点只有两处——P11 的七槽（正文取自本片段「这一 Phase 怎么验收？」一节）与 spec 的 Appendix A 一行 P1 登记；片段里的 P1 专属句不整段搬进 P11。
2. 边界句「本 Phase 交 AC-EFFECT-001 的一行」补注明去向：进 spec 的 Appendix A，不进 P11 正文。
3. 写集「修改 P11 七槽」补一句：只把本片段「这一 Phase 怎么验收？」一节写进七槽，其余句子不写入。
4. 用例 1 不再另报块数，改为「按判定器表逐行核九个判定器」，避免执行说明里出现第二个计数口径。
5. 判定器表加一列「块数」，逐行给：C07-TCR 0（整组判定）、PAGE-AUDIT-DOC 2、ACCEPT-PLAN 1、
   CRITERIA-LOCK 1、WRITESET-DIFF 1、ACCEPT-SCOPE 3（1 独立 + 2 合并命名）、ASSET-FIRST 2（1 独立 + 1 带后缀）、
   SKIP-VISIBLE 与 TIER-MINIMAL 各「与 ACCEPT-SCOPE 共用那块」。
6. 表下两条重写：按文件四个、按判定器九个、按 describe 块十个（`page-audit-doc-contract` 2、`acceptance-plan` 1、
   `n11-plan-quality` 2、`n11-acceptance-rules` 5 = 10）；写明 C07-TCR 是整组判定、不另设块；
   并写明块数只是代码组织、不是效果证明，判效果看九个判定器各自被判过（用例 2）。

## 块数的出处（经真实文件核，不靠口头数）

| describe 名 | 文件:行 |
| --- | --- |
| `page-audit.md judgment pack` | `tests/contract/page-audit-doc-contract.test.mjs:29` |
| `page-audit method wiring` | `tests/contract/page-audit-doc-contract.test.mjs:103` |
| `ORACLE-ACCEPT-PLAN` | `tests/contract/acceptance-plan.test.mjs:66` |
| `ORACLE-N11-CRITERIA-LOCK` | `tests/contract/n11-plan-quality.test.mjs:26` |
| `ORACLE-N11-WRITESET-DIFF` | `tests/contract/n11-plan-quality.test.mjs:42` |
| `ORACLE-N11-ACCEPT-SCOPE` | `tests/contract/n11-acceptance-rules.test.mjs:45` |
| `ORACLE-N11-ASSET-FIRST` | `tests/contract/n11-acceptance-rules.test.mjs:67` |
| `ORACLE-N11-ASSET-FIRST authoritative prohibition presence (approved TCR)` | `tests/contract/n11-acceptance-rules.test.mjs:89` |
| `ORACLE-N11-ACCEPT-SCOPE ORACLE-N11-SKIP-VISIBLE` | `tests/contract/n11-acceptance-rules.test.mjs:104` |
| `ORACLE-N11-ACCEPT-SCOPE ORACLE-N11-TIER-MINIMAL unknown fallback` | `tests/contract/n11-acceptance-rules.test.mjs:175` |

十个块，四个文件；`ORACLE-C07-TCR` 不在其中。

## 没改什么

- 验收七槽、判据、用例 2–4、门禁命令、A/B 路径、owner、未决项：一字未动。
- v1、v2 字节不动；v3 是第三个文件。
