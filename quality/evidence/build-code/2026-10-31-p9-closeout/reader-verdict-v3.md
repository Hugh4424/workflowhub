# P9 读者复验（v3，2026-10-31）

## ① 片段是示范还是交付

**已解决。** 13 行：「本片段是示范，不是交付……真实落点只有两处——P11 的「这一 Phase 怎么验收？」七槽（正文取自本片段「这一 Phase 怎么验收？」一节），与 spec 的 Appendix A 一行 P1 登记」；33 行：「本 Phase 交 AC-EFFECT-001 的一行（这一行进 spec 的 Appendix A，不进 P11 正文）」；177–178 行：「只把本片段「这一 Phase 怎么验收？」一节的正文写进这七槽，片段其余句子不写入」。写入集（277–279 行）与之一致；evidence 原件由判定者/消费者/第三方产出（181–183 行），不算片段落点。无实质自相矛盾；本节内 51、149 行仍带 P1 字样，按 13 行改写、不照搬即可，178 的「正文」据此读。建议 178 补「不含 P1 归属句」免误读。

## ② 块数口径

**已解决。** 表 226–234 行加「块数」：C07-TCR 0、PAGE-AUDIT-DOC 2、ACCEPT-PLAN 1、CRITERIA-LOCK 1、WRITESET-DIFF 1、ACCEPT-SCOPE 3（1 独立 + 2 合并命名）、ASSET-FIRST 2（1 独立 + 1 带后缀）、SKIP-VISIBLE 与 TIER-MINIMAL 各与 ACCEPT-SCOPE 共用。236 行：「四个测试文件共 10 个 describe 块（page-audit-doc-contract 2、acceptance-plan 1、n11-plan-quality 2、n11-acceptance-rules 5）……块数只是代码组织，不是效果证明」；237 行：「上表九个（10 个 describe 块里的八个具名判定器，加整组判定 ORACLE-C07-TCR）」。对账：0+2+1+1+1+3+2=10，与 2+1+2+5=10 一致；8 具名 + C07-TCR=9，与表 9 行一致；v3-diff 37–50 行给出 10 块的 file:line，可复核。用例 1（112–114 行）改为按表逐行核九个判定器、每个 describe 块有具名通过项，不再另报总数。执行：按九个判定器逐行（C07-TCR 由四文件门禁整体承载），10 个块只用于核具名通过项，效果看用例 2；无需读者裁断。

两条都已解决
