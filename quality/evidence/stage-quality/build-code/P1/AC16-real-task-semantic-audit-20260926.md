# AC-16：当前 CARD-04 真 task 验收表逐行语义样本审计

- 审计时间：2026-09-26 15:59 UTC。审计者：`/root/phase_map`；未参与本 task 的 decision-log 验收表撰写，也未实施 P1/T001–T003 三份文档。曾参与其它 Phase 的实现/核验，因此这是 **P1 材料异源人工审计**，不是外部 OCR 或最终 verify-code 裁决。
- 样本身份：`task_id=workflowhub-thin-core-card-04-20260919`，`activation_cohort=post`，当前认证 worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`。样本只取 `specs/workflowhub-thin-core-card-04-20260919/decision-log.md:1413-1420` 的整张「本卡自身的验收标准」表，AC-16..AC-21 **分母=6**；不从其它表补行，也不删除标 MISSING 的行。
- 原件身份：decision-log 原始字节 SHA-256 `e7ddb0f1398ee675b4a8c0411283fe24b39b43736d6916e1da32bb5984a45268`；按现行 `materialRevisionFromValues` 对 decision-log 单文件算得 scope revision `revision-1fe976e65d3ee050147a6747ecc80a1211051551b72a8d924a020177a55e0056`，对当前 post 的 decision-log/spec/index/P1..P13 全材料算得 material revision `revision-b377a58c54a3d4016d4f302785139ff206547e627b7e12f27a0b83e14faf750c`。两者是不同范围；此证据只审单文件六行。读取时 HEAD `ef920f1fbd415fe87d50930359059b661e141acd`、HEAD tree `2a0e21e65488fba4e4507e4491f9edcab8e4585b`；材料含未提交内容，不能以 HEAD 代替上列 SHA/revision。

## 逐行判断

下表的「四要素」逐项判断**定义本身**能否让审查者在相应真实输入上作可失败判定；不是声称该 AC 的样例/服务/权限或运行事实已经发生。`C/B/M/F` 分别为条件、可观察行为、可数成功值、至少一条可触发的失败情形。

| AC / 源行 | C / B / M / F 的语义核对 | 定义判定 | 当前执行缺口 |
| --- | --- | --- | --- |
| AC-16 / `:1415` | C：一项有完整 AC 集的真实 task，可按本 task 身份取这六行；B：逐条查四要素；M：以六行为分母，要求每行合格或明标 `incomplete`，可算比例；F：故意缺任一要素且不标 `incomplete` 时本项须失败。 | 四要素可核且能给出反例；本表的逐行审计即该样本的人工语义部分。 | 表中所写位置参数式 `check-decision-log-chain.mjs specs/<task>/decision-log.md` 不会定向该文件：当前 CLI 只识别 `--file`/`--root`，且只报 D-chain warning、总 exit 0，不审 AC 四要素。不能拿它代替本人工矩阵；卡面命令修正属材料 owner。 |
| AC-17 / `:1416` | C：一个实施 task 和明确的只读/隐藏权限模式；B：让实现者尝试读、写验收测试；M：只读可读不可写、隐藏不可读，任一越权即可计失败；F：测试目录可写或隐藏模式可读为可触发反例。 | 四要素可核；缺当前样例/模式开关已在同一行显式 `MISSING — not established`。 | 未建立物理隔离，未运行权限试验；不能因定义合格宣称 AC-17 通过。 |
| AC-18 / `:1417` | C：一个行为变化 task；B：核同一测试改动前后的 RED→GREEN 原件；M：前失败、后通过两份结果同时存在且能同测试身份对照；F：只有 GREEN、无 RED 且无 G-2 豁免披露须失败。 | 四要素可核；同一行显式 `MISSING — not established`。 | 缺材料认领的行为样例 task；本审计不拿其它局部 RED/GREEN 偷换该样例验收。 |
| AC-19 / `:1418` | C：一个纯文档 task；B：核 G-2 豁免处置；M：应有理由、风险、验收披露三项同在的记录，或一条可失败检查；F：直接跳过且无披露须失败。 | 四要素可核；同一行显式 `MISSING — not established`。 | 用户已选择保留样例缺失；P1 的三个文档子 Task 有局部可失败检查，但不是已认证的独立纯文档样例 task，不能由此改写 AC-19 状态。 |
| AC-20 / `:1419` | C：分别准备适用与不适用两种路线；B：逐路线实跑验收并对照适用性；M：适用路线须有真实命令、exit、output、oracle，N/A 须有 reason 且不因缺该产物失败；F：缺适用产物仍判通过、伪造产物、无理由 N/A、或把合法 N/A 判失败，均可使判定失败。 | 四要素具体且有正反边界；这里仅审写法，不把「机制已存在」当实跑。 | 尚无在本样本下绑定两路线的真实命令/原始输出/逐项 oracle；表中 `run`/`verify` 片段也未给足 task/输入参数。 |
| AC-21 / `:1420` | C：取一个已有完成事实的 task；B：回读测试/验收技能的实际执行并比对完成宣称时间；M：每项有可回读 command、exit、output 位置，且真实入口执行先于整体完成宣称；F：只有脚本自证或把 review 当功能验收则判失败。 | 四要素可核，时间和原件可形成反例。 | 本 task 未有足以作为「完成 task」的整体执行/验收链；局部 verify receipt 或入口清单不满足该 C，表中仅记「部分可得」。 |

## 统计与判定边界

- **定义层样本分母 6**：四要素语义可检查 **6/6**；缺一项四要素 **0/6**；有四要素缺项却未标 `incomplete` 的行 **0/6**。AC-17/18/19 的**执行样例**另有显式 `MISSING — not established` **3/6**，不得从定义层 6/6 擦掉。AC-20/21 尚无相应完整实跑/完成样本；本表不评它们为业务通过。
- 本次实际作的是对既有真实 task 六行的独立人工语义核对；「失败情形能失败」为可操作判定规则的审读，**没有注入坏样本或执行负控**。未运行任何测试或 stage 命令，也没有发布官方 `run`/`verify`/review 质量事实。因而本地结论是 **AC-16 的单 task 定义样本 6/6 满足可执行写法**，不是 AC-16 的正式最终通过，也不推及全仓或 AC-17..21。
- `docs/architecture/test-asset-governance-rules.md` 的统计口径要求真实分母与人工核对；P1 关键词 gate 和旧官方 doc receipt只检节名/跟踪。若材料 SHA/revision 改变，应重新审这六行。若需将 AC-16 提升为正式完成，还须由当前 build-code/verify-code owner 将本矩阵与材料身份作为真实证据入账，并处理卡面位置参数与 CLI 实际 `--file` 接口的不一致；不得把 advisory exit 0 写成 AC 语义通过。
