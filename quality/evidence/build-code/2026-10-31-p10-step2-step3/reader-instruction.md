# 独立读者指令（2026-10-31，③ 复验）

执行者：step 2/3 执行子代理。读者：fresh-context 子代理 `7b2b648c-6bfb-48f2-b05a-2c6dacecbac0`（未参与写作与改稿）。
以下为实际派发原文（补充指令接在末尾）。

---

你是 P10 验收第三步的独立读者。你没有参与被审材料的写作，也没有参与上一轮审查与改稿。你只判一件事：一条指定 finding 在改稿后的两张 Phase 卡里是否消失、改稿有没有引入同类新问题。

## 只读这几份（其它一律不读）
1. /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/phases/P4-报告接入与回修闭环.md
2. /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/phases/P8-全AC终验.md
3. /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/skills/wh-review/contracts/build-plan.md
4. /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/quality/evidence/build-code/2026-10-30-p10-real-review/decision-baseline.md（只看它，别读同目录其它文件）

纪律：只读，不改任何文件；唯一允许写的是第 5 条指定的 verdict 文件。不读 git 历史、不读其它 Phase、不读其它 evidence 目录，避免被别人的结论污染。

## 原 finding（改稿前，逐字）
位置 P4 依赖字段、正文 P4:292 一带；主张：
「P4 从 P3 的受控页取文件，依赖只写 P1；且 P4（批 4）与 P8（批 7）跨批回修成环」。
改稿要证的就是：P4 的依赖与执行链不再漏直接上游 P3，也不再把修源反向挂到 P8 的运行上。

## 判据（照原判据读，不新增判据）
- 轴：需求成立性、验收充分性、方案合理性、可执行性（见第 3 份合同）。
- 每条 finding 必须五项齐全：锚点（文件:行号）、问题、依据（逐字或可核原文）、替代方案、覆盖范围。没有就明确写零发现，并写清读了什么、没读什么、为什么。
- 第三步只判两件：① 原 finding 在 P4、P8 里是否已消失（依赖是否已含 P3；正文是否仍把修源/检出反向挂给 P8）；② 这两张卡里有没有同根的新问题（例如依赖与正文/消费者不一致、单向流水线又被写成反向回环、下游声明与上游交付对不上）。

## 输出（中文，≤1200 字）
先按四轴列 findings（没有就写零发现 + 覆盖范围），再给两块判定：
A. 原 finding：消失 / 仍在（给锚点与逐字依据）。
B. 新问题：有 / 无（同类问题逐条五项；不同类也照五项列，但注明「非本步判据」）。
最后一行：结论 = 通过（原 finding 消失且无新同类问题） / 不通过（写卡在哪一处）。

## 产物
把完整结论原样写到（UTF-8）：
/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/quality/evidence/build-code/2026-10-31-p10-step2-step3/verdict-independent-reader.md
同时在回传里给出同一结论的精简版（含 A、B、结论三行）。不要改其它任何文件。

---

补充（同一读者，派发后追加；不新增材料）：除了 A 原 finding、B 新问题，再明确答第三问 **C. 这两张卡能不能按原文执行**——即卡里写的依赖、执行链、命令与证据落点是否自洽可执行（例如依赖的上游是否真的被正文取用、P8 只读重放是否不需要反向写源）。三问都要给锚点与逐字依据。结论行改成：「通过（原 finding 消失、无新同类问题、可按原文执行）」或「不通过（写卡在哪一处）」。其余照原要求。
