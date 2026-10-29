# Phase P8 — 七条验收各有可重放判据与档位，未达成写缺口不写通过

## L0 — 结果与变更

### 这个 Phase 做什么

本 Phase 是唯一的验收 Phase，给七条验收各写一条判据与一个真实档位。
先正面说清一件事：真实环境 case 要执行，执行者不是写这份材料的会话。
执行发生在 build-code 阶段运行本 Phase 时，由验收执行子代理做。
验收执行者与修复者必须是不同上下文，不能是同一个人。
写作期（build-plan）一条都不跑：真实采集、受控页注入、真浏览器运行都没发生。
所以七条现在都记未执行、不算通过，档位与缺口只写进完成节与证据原件。
写作期未执行，不等于执行期可以七条一起记 `unavailable` 收口：到 build-code 跑本 Phase 时，每条要么判过给档位与证据，要么单写它缺的输入、owner 与恢复条件。
七条判定器的名字、对照与承接见 `spec.md:463-474`；本 Phase 只按那张表写 `GREEN 判定器`，不另造名字。

### 交付什么

交付四件东西，全部落在本 Phase 内：
- 一个测试文件 `tests/contract/page-audit-acceptance.test.mjs`，四个测试组。
- 七行档位与逐条缺口，见证据原件的 `per_ac[]`。
- 两份就绪件：数据就绪与环境就绪，各带一个合法 status。
- 一条门禁命令，退出 0 只证明结构成立，不证明验收通过。

### 为什么现在做

现在做，因为只有这里能把七条串成一份可判的记录。
前七个 Phase 各自证明自己那一块，没有一处回答"七条能不能判、判到哪、缺什么"。
本 Phase 只消费它们的原件，不重做它们的工作，也不重判它们的过程质量。
它不新增阶段、不新增闸门、不新增校验器，规格正文保持只读。

## L1 — 可执行契约

### 基本信息（机器头 10 项）

- **全局规格**：`specs/workflowhub-ui-frontend-c07-real-page-verification-20261028/spec.md#5-验收`（第 454 行起，七条判据的唯一权威，只读）
- **写入集**：`tests/contract/page-audit-acceptance.test.mjs`
- **依赖**：`P1、P2、P3、P4、P5、P6、P7`
- **消费者**：skills/stage-close/SKILL.md
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-acceptance.test.mjs`
- **oracle**：ORACLE-P8-ACCEPTANCE
- **evidence_path**：`quality/evidence/build-code/P8-acceptance.json`
- **覆盖 AC**：AC-C07-1、AC-C07-2、AC-C07-3、AC-C07-4、AC-C07-5、AC-C07-6、AC-C07-7
- **STOP**：任一 AC 缺证据时写 `incomplete`/`unavailable` 与缺口、条件、owner，不改 AC、不删用例、不重跑到绿、不写回规格；需真实环境加用户在场的条目，用户不在场时保持 `unavailable`；判据需变更时停该条并交 spec owner；前序 Phase 原件缺失时回对应 Phase 修复，不自行补造。
- **Done**：七条逐条定性，每条只能是两种之一——`available`（判过了，按八值词表落具体档位与具名证据）或 `unavailable`＋具名原因与 owner；`available`/`unavailable` 只表示这条判没判过，落 `per_ac[]` 时仍用 `runtime/evidence/acceptance-evidence-validator.mjs:6` 的八值词表。七条全 `unavailable` 时本 Phase 记未完成，不得收口，不得以"本文件是 build-plan 计划"作共同原因收口。证据指针统一为 `quality/evidence/build-code/P8-acceptance.json` 的 `per_ac[]`，逐条缺口与 owner 见「完成与交接」，不写 pass。

七条验收各配一个判定器，名字与 spec 第 5 节逐字对应；判定器写在卡的 `GREEN 判定器` 与证据行，不另设门：

| 判据 | 判定器 | 卡内组名 | 本 Phase 的判法 |
| --- | --- | --- | --- |
| AC-C07-1 | ORACLE-C07-1（`ORACLE-C07-COVERAGE`） | `AC-C07-1` | 逐维结果可重放：判据条目、未测理由、无总分 |
| AC-C07-2 | ORACLE-C07-2（`ORACLE-C07-IDENTITY`） | `AC-C07-2` | 身份八字段、四类失败码、回退四子字段 |
| AC-C07-3 | ORACLE-C07-3（`ORACLE-C07-STRESS`） | `AC-C07-3` | 检出、修复、复验三段加 200% 与键盘两项必测 |
| AC-C07-4 | ORACLE-C07-4（`ORACLE-C07-GRADE`） | `AC-C07-4` | 两次同级加三条校准负例 |
| AC-C07-5 | ORACLE-C07-5（`ORACLE-C07-LOOP`） | `AC-C07-5` | 定位、路由、最小修复、独立复验、回归五段 |
| AC-C07-6 | ORACLE-C07-6（`ORACLE-C07-NOAGG`） | `AC-C07-6` | 四类非法输入不聚合成通过 |
| AC-C07-7 | ORACLE-C07-7（`ORACLE-C07-TRACE`） | `AC-C07-7` | 三面可追溯，无资产写不适用加依据 |

七条不是七张卡：T022 判 1、2、6 的机器可判部分，T023 判 3、5、7 里必须真实环境的那些，T024 判 4 的重复定级并把七条收成七行档位；没有一条可以只写 unavailable 就收口。

### 开始前要读什么

先读规格第 5 节的七条判据与第 6 节的计划 8，再动手写卡。
- 七条判据：`spec.md:476`、`:494`、`:508`、`:527`、`:541`、`:557`、`:571` 七个三级标题，各含场景、通过、失败、证据。
- 判定器对照：`spec.md:463-474` 的七行表与判定规则给出 `ORACLE-C07-1` 到 `ORACLE-C07-7` 与审查件别名，本 Phase 照它写 `GREEN 判定器`。
- 状态与压力面：`spec.md:508-525` 的九类反例与十态；四项深度面在 `spec.md:424`。
- 运行参数：`spec.md:591-592` 的服务、route 与三档视口，200% 缩放必测；样本写主在 `spec.md:593`（P4 修、P8 只读复验）。
- 验证面：`spec.md:778` 面 3、`:781` 读回命令、`:782` 编排入口（身份参数见 P5 参数表）、`:787` 禁止无范围全量回归。
- 八值档位词表：`runtime/evidence/acceptance-evidence-validator.mjs:6`。
- 证据引用正则与 final-report 口径：`acceptance-evidence-validator.mjs:5`、`skills/stage-close/SKILL.md:12`。
- 逐字事实与读命令不在这里抄：见 `2026-10-29-003-code-anchors-and-consumers.md` 第 177、179、205 行。

### 文件边界与任务

本 Phase 只新增一个测试文件，其它路径一律只读；样本只读复验，改样本归 P4。
- 新增：`tests/contract/page-audit-acceptance.test.mjs`，验收执行者写，消费方是本 Phase 门禁。
- 修改：无。档位与证据指针写进 Done 与证据原件，不写回规格正文。
- 禁止改动：`spec.md`；P1–P7 与 P9–P11 的写入集；`runtime/**` 与 `tools/cli/**`；
  C05 归档与工作区；`decision-log.md`；`.creator` 与任务事实库。
- 样本的读法：`samples/` 的六个运行文件只读复验（AC-3 与 AC-5 的修复发生在 P4，写主也是 P4），本 Phase 不改一个字节、不改受控页与三张校准页。
- 受保护面：`spec.md:454-602`；`acceptance-evidence-validator.mjs:5-6`；`stage-close/SKILL.md:12`。

四张卡按编号接续前一个 Phase：
1. 任务 1：入口准则与两份就绪件。
2. 任务 2：三条验收的离线可重放判据。
3. 任务 3：需真实环境与用户在场的未闭环 case。
4. 任务 4：七行档位、六项结论与五项回写。

### T021 — 任务 1：入口准则与两份就绪件可读

这张卡先把分母定下来：前七个 Phase 的完成与写入集落地没有、两份就绪件有状态没有。
没有分母就判不了七条，所以它排第一。
它不判断那些材料写得好不好，只核原件在不在、status 在不在八值词表里。
交付两件：数据就绪件与环境就绪件，都是 `quality/evidence/build-code/` 下的 JSON。

| 位置 | 必须出现什么 | 出处 |
| --- | --- | --- |
| 数据就绪件 | 六个样本文件哈希；受控页与三张校准页在场；status | `001-c05-sample-copy-pin.json`；`spec.md:591` |
| 环境就绪件 | 引擎探测输出；node 与 vitest 版本；视口与缩放工具；status | `spec.md:592` 三档视口 |
| 授权边界 | 目标、副作用白名单、数量上限、禁止事项、失败即停 | `spec.md:787` 禁止无范围全量回归 |
| 入口组断言 | 两份就绪件存在；status 在八值词表 | `acceptance-evidence-validator.mjs:6` |

做四件事：
1. 核七份 Phase 的证据路径是否被真实引用。
2. 写数据就绪件：六个样本文件哈希、受控页与三张校准页是否在场，各带 status。
3. 写环境就绪件：引擎探测、node 与 vitest 版本、可用视口与缩放工具，各带 status。
4. 写授权边界五项，并在门禁里断言两份就绪件的形状。

跑：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-acceptance.test.mjs -t "entry"`
看到：退出 0，两份就绪件在场、status 合法、缺件具名到负责方。

失败怎么办：
- 六哈希与钉版不一致：停，回主会话取复制留痕，不改哈希断言。
- 就绪件缺失或 status 用自造词：该条验收记未达成，写缺件与负责方。

机器字段（校验器用，人可跳过）：
- **来源 / FR / AC**：R-C07-35、R-C07-05；D-002；FR-C07-005、FR-C07-028；AC-C07-5、AC-C07-1。
- **文件 / 符号**：`tests/contract/page-audit-acceptance.test.mjs`（新增；符号 `describe("ORACLE-P8-ACCEPTANCE")`、`readEvidence`）。
- **动作**：核七份证据路径被引用；写两份就绪件（数据：六文件哈希与受控页、校准页在场；环境：引擎探测、node 与 vitest 版本、缩放与读屏工具），各写 status；写授权边界五项；入口组断言就绪件在场且 status 在八值词表；结果写入 `per_ac[]` 前置段，不改前序文件。
- **输入**：P1–P7 文件与证据路径；`001-c05-sample-copy-pin.json` 六哈希；`acceptance-evidence-validator.mjs:5-6`。
- **输出 / 失败**：两份就绪件齐、status 合法、缺失项具名；失败＝就绪件缺失、status 用自造词、把缺数据写成 pass。
- **边界 / 禁止改动**：不改 C05 归档与样本字节；不装包；不改规格正文；不改 P1–P7 契约头。
- **依赖**：`P1`、`P2`、`P3`、`P4`、`P5`、`P6`、`P7`（本卡只读）。
- **测试层级 / 技能**：定向契约测试 + 就绪件读回；预写测试＝本文件（作者＝验收执行者）；主技能 `skills/testing-system-blueprint/SKILL.md`；测试变更请求＝none。
- **场景 / 夹具或服务**：正常＝前序原件齐、六哈希与钉版一致；反向＝删一份就绪件、把 status 写成 `ok`；接缝＝产出方 P1–P7 文件与样本目录，产物两份就绪件 JSON，读取方终末复核与收口技能，分母＝七条 AC 与六个对象文件。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-acceptance.test.mjs -t "entry"`。
- **预期退出码**：RED nonzero; GREEN 0。
- **RED 目标失败**：ORACLE-P8-ACCEPTANCE 的 `entry` 组：就绪件未生成时 `expect(existsSync(dataReadiness)).toBe(true)` 失败；status 不在词表时 `expect(RESULTS).toContain(status)` 失败；归因＝目标行为失败。
- **RED 证据**：`unavailable — build-plan 期不执行；真实 RED 由 build-code 首次执行写入 quality/tests/<date>-p8-entry.*`。
- **GREEN 判定器**：ORACLE-P8-ACCEPTANCE：两份就绪件存在、status 合法、缺件具名到 owner；反向"缺数据写 pass"判红。
- **证据**：`P8-acceptance.json` 的 `readiness` 段；判什么＝P1–P7 的 Done 与写集是否落地、两份就绪件是否有 status；怎么判＝入口组加两次读件；谁提供＝验收执行者；何时＝build-code P8 开工；成本＝命令级；拿不到＝记 `unavailable` 并写缺件与 owner。
- **停止 / 恢复**：六哈希与钉版不一致时停，回主会话取复制留痕，不改哈希断言。
- **覆盖上限**：只证明就绪件在场与形状，不证明数据可跑。
- **完成**：一条命令重放；两份就绪件、status 词表、缺件具名三项命中。

### T022 — 任务 2：三条验收的离线可重放判据

这张卡给三条能离线判的验收各写一个可重放的断言块。
三条是：验收 1 的逐维结果形状、验收 2 的身份与四类失败、验收 6 的非法输入不聚合。
每块都要有具名通过元素，不能靠"没有失败"算通过。
三块只读前序原件，不改它们的脚本与夹具。

| 位置 | 必须出现什么 | 出处 |
| --- | --- | --- |
| 验收 1 块 | 八维各有判据条目；缺失有未测理由；无总分 | `spec.md:476-492`；`page-audit-shape.test.mjs:141-159` |
| 验收 2 块 | 身份八字段；四类失败码；引擎回退四子字段 | `spec.md:494-506` |
| 验收 6 块 | 未测时总体不是"通过"；工具错误不出报告 | `spec.md:557-569` |
| 负例三条 | 删未测理由、工具错误写成未测、加总分，各判红 | `page-audit-shape.test.mjs:141-159` |

做四件事：
1. 写验收 1 块：八维判据条目、未测理由、无总分。
2. 写验收 2 块：身份八字段、四类失败码、引擎回退四子字段。
3. 写验收 6 块：未测时不判通过、工具错误不出报告、样本"止于 mock"表述在场。
4. 三块各配一个负例，必须判红。

跑：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-acceptance.test.mjs -t "AC-C07-1"`
看到：退出 0，三个断言块全绿，各带一个判红的负例。

失败怎么办：
- 前序报告字段与断言不符：停，回对应 Phase 修复后重判，不改断言迁就实现。
- 断言只查存在、负例被放过：该条验收不许记通过，重写断言。

机器字段（校验器用，人可跳过）：
- **来源 / FR / AC**：R-C07-25、R-C07-26、R-C07-30；D-007；FR-C07-003、FR-C07-009、FR-C07-031、FR-C07-018、FR-C07-019、FR-C07-021；AC-C07-1、AC-C07-2、AC-C07-6。
- **文件 / 符号**：`tests/contract/page-audit-acceptance.test.mjs`（追加三个断言块；符号 `replay`）。
- **动作**：①AC-C07-1：断言八维各有 `criteria[]`、每处缺失有 `untested_reason`、无 `total_score`；②AC-C07-2：断言身份八字段、四类失败码、`engine_fallback` 四子字段；③AC-C07-6：断言未测时 overall 不等于"通过"、`TOOL_ERROR` 不出报告、样本"止于 mock、真实业务未覆盖"在场；④三块都要具名通过元素；⑤结果写入 `per_ac[]` 前三行，不改 P5、P7 文件。
- **输入**：P5 报告样张与 `P5-orchestration.json`；P7 的 quotes 与 binding 输出；P1 判据包与 `check-page-audit.mjs`；`page-audit-shape.test.mjs:141-159`。
- **输出 / 失败**：三块全绿且每块至少一个负例判红；失败＝断言只查存在、负例被放过。
- **边界 / 禁止改动**：不改 P1、P5、P7 的脚本与夹具；不改 AC 判据文本；不改 `spec.md`。
- **依赖**：`T021`（就绪件是分母）。
- **测试层级 / 技能**：定向契约测试（读原件 + 子进程）；预写测试＝本文件（作者＝验收执行者）；主技能 `skills/test-routing-advisor/SKILL.md`；测试变更请求＝none。
- **场景 / 夹具或服务**：正常＝前序原件齐；反向＝删 `untested_reason`、把 `TOOL_ERROR` 写成未测、加 `total_score`；接缝＝产出方 P5、P7 输出与 P1 形状校验器，产物 `per_ac[]` 前三行，读取方终末复核，分母＝AC-C07-1/2/6 的通过条件。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-acceptance.test.mjs -t "AC-C07-1"`。
- **预期退出码**：RED nonzero; GREEN 0。
- **RED 目标失败**：ORACLE-P8-ACCEPTANCE 的 AC-C07-1 块：`expect(dimensions.every(d=>results.some(r=>r.dimension===d))).toBe(true)` 收到 false；负例里 `expect(report.total_score).toBeUndefined()` 被 `E_TOTAL_SCORE` 提前拒；归因＝目标行为失败。
- **RED 证据**：`unavailable — 同上，落 quality/tests/<date>-p8-ac1.*`。
- **GREEN 判定器**：ORACLE-P8-ACCEPTANCE：三块齐全、每题通过元素具名、负例判红；反向"缺 `untested_reason` 仍绿"判红。
- **证据**：`P8-acceptance.json` 的三行；判什么＝AC-C07-1/2/6 的机器可判部分各有具名通过元素；怎么判＝三个断言块；谁提供＝验收执行者；何时＝build-code P8；成本＝命令级；拿不到＝记 `unavailable` 并写缺哪个原件。
- **停止 / 恢复**：报告字段与断言不符时停，回对应 Phase 修复后重判，不改断言迁就实现。
- **覆盖上限**：只判机器可判部分；页面真实结果与语义判断不在此列。
- **完成**：一条命令重放；三个断言块全绿且各带一个判红负例。

### T023 — 任务 3：需真实环境与用户在场的未闭环 case

这张卡写的是本次不执行、要等 build-code 才执行的那批 case。
共六组：九类反例注入、缩放与键盘、读屏证据行、本地协议页、C05 样本 A/B、业务止于 mock。
它只写命令、预期与条件，不写结果。
执行时由测试子代理做，与修复者不同人；用户不在场就保持未达成。

| 位置 | 必须出现什么 | 出处 |
| --- | --- | --- |
| 九类反例 | 每类注入命令、期望档位、修复后复验命令 | `spec.md:508-517`；契约分析 004 第 61-77 行 |
| 200% 与键盘焦点 | 各一条命令加预期；写进必测门 | `spec.md:519`；`spec.md:592` |
| 读屏 | 证据行或未测；不单独判通过或失败 | `spec.md:519`；`spec.md:424` |
| 本地协议页 | 按适用性记录；未测不写已验 | `spec.md:520` |
| C05 样本 A/B | 对象身份 `9efb7e57` 与六哈希；止于 mock、真实业务未覆盖 | `001-c05-sample-copy-pin.json`；`spec.md:778` |
| 两条命令 | 本地服务逐字；编排入口按 P5 参数表补五个身份参数 | `spec.md:591`；P5「命令行参数分三层」 |

做六件事：
1. 九类各写三行：注入命令、期望检出档位、修复后复验命令，标需真实环境加用户在场。
2. 缩放与键盘焦点各一条具名命令与预期；未测则验收 3 保持未测说明。
3. 读屏只写证据行或"未测"，不作必测门。
4. 本地协议页按对象适用性记录。
5. C05 样本 A/B 写对象身份与"止于 mock、真实业务未覆盖"。
6. 断言六组各有一条具名命令与预期，档位不是通过。

跑：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-acceptance.test.mjs -t "real environment"`
看到：退出 0，六组各一条命令加预期，必测门在场，读屏不作门。

失败怎么办：
- 用户不在场：停这条路径，保持未达成，写条件与下一次动作，不催下一阶段。
- 缺缩放或键盘、读屏被当门、受控页结果写成产品通过：该条验收不许记通过。

机器字段（校验器用，人可跳过）：
- **来源 / FR / AC**：R-C07-27、R-C07-31、U-C07-53、U-C07-58；D-033；FR-C07-001、FR-C07-012、FR-C07-027、FR-C07-020；AC-C07-3、AC-C07-7、AC-C07-5。
- **文件 / 符号**：`tests/contract/page-audit-acceptance.test.mjs`（追加 `real_environment` 组与命令表；符号 `realEnvironment`）。
- **动作**：①九类各写"注入命令 → 期望档位 → 复验命令"三行，标需真实环境加用户在场；②200% 缩放与键盘焦点各一条命令与预期；③读屏只写证据行或未测，不设门；④`file://` 按适用性记录；⑤C05 A/B 写对象身份（`9efb7e57`、六哈希）与"止于 mock、真实业务未覆盖"；⑥断言六组各有一条命令与预期、state 不是 pass；⑦本地服务沿用 `spec.md:591` 原文，编排入口沿用 `spec.md:782` 并照 `phases/P5-审计编排入口与规范消费证明.md` 的参数表补全五个身份参数，两处指同一个接口。
- **输入**：004 的九类 region 与期望档位；004 的三条校准负例；`spec.md:508-525` 分母（只读）；`spec.md:591-592`；C05 样本六文件。
- **输出 / 失败**：六组各一条具名命令与预期；失败＝缺 200% 或键盘、读屏当门、受控页写成产品通过、`file://` 未测写已验。
- **边界 / 禁止改动**：不改受控页与校准页；不改 C05 样本；不改 `spec.md`；不把模拟角色写成真人研究。
- **依赖**：`T022`（同一文件串行；命令表引用 AC-C07-1/2/6 的就绪件）。
- **测试层级 / 技能**：真实环境级（本卡只写判据，执行在 build-code）；预写测试＝本文件（作者＝验收执行者）；主技能 `skills/isolated-browser-qa/SKILL.md`；测试变更请求＝none。
- **场景 / 夹具或服务**：受控页九 region、校准页三件、C05 A/B 副本；清理＝引擎会话收尾与临时目录删除；接缝＝产出方受控页与样本，产物 `real_environment[]` 与采集原件，读取方终末复核与产品验收者，分母＝九类加四项深度面（`spec.md:424`）。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-acceptance.test.mjs -t "real environment"`。
- **预期退出码**：RED nonzero; GREEN 0。
- **RED 目标失败**：ORACLE-P8-ACCEPTANCE 的 `real environment` 组：`expect(entries).toHaveLength(6)` 收到 0；`expect(entry.command).toMatch(/node |bash /)` 失败；归因＝目标行为失败。
- **RED 证据**：`unavailable — 同上，落 quality/tests/<date>-p8-real.*`。
- **GREEN 判定器**：ORACLE-P8-ACCEPTANCE：六组各一条命令加预期与 state；200% 与键盘必测行在场；读屏不作门；反向"受控页当产品通过"判红。
- **证据**：`P8-acceptance.json` 的 `real_environment[]`；判什么＝九类、200%/键盘、读屏证据行、`file://`、C05 A/B、业务止于 mock 各有具名命令与预期；怎么判＝清单逐条读回；谁提供＝测试子代理（独立于修复者）与用户在场；何时＝build-code 真实环境窗口；成本＝真实环境级加人在场级；拿不到＝保持 `unavailable` 并写条件与 owner。
- **停止 / 恢复**：用户不在场时停该路径，保持 `unavailable`，写条件与下一次动作，不催下一阶段。
- **覆盖上限**：只保证判据与命令在场；真实执行结果与本 Phase 无关，未执行即 `unavailable`。
- **完成**：一条命令重放；六组命令与预期、必测门、读屏非门三项命中。

### T024 — 任务 4：七行档位、六项结论与五项回写

这张卡把前面三张的结果收成七行档位，并写六项结论与五项回写。
每行一个档位加一条具名证据，非通过项写原因、条件与负责方。
它只写记录，不改判据、不改规格、不改前序文件的契约头。
档位词表只有八个词，见 `runtime/evidence/acceptance-evidence-validator.mjs:6`。

| 位置 | 必须出现什么 | 出处 |
| --- | --- | --- |
| 七行档位 | 每行 AC 编号、一个八值档位、一条具名证据路径 | `acceptance-evidence-validator.mjs:6` |
| 非通过项 | 原因、条件、负责方，缺一不算写完 | `spec.md:458` |
| 六项结论 | 评估与局限、偏差、未充分测试、未解决事件、残留风险、签核对象 | 本文件「怎么验证」第 11 项 |
| 回写五项 | Done、`per_ac[]`、本文件自一致、`facts.jsonl` 字段、修复记录 | `stage-close/SKILL.md:12` |

做五件事：
1. 七行各写编号、一个八值档位、一条具名证据路径。
2. 非通过项写原因、条件与负责方。
3. 写六项结论。
4. 写复验四项：原问题用例与回归用例各大于零，判定记全量、部分或没有。
5. 写回写五项，并在门禁里断言七行齐、无禁词。

跑：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-acceptance.test.mjs -t "verdicts"`
看到：退出 0，七行齐、档位在词表、无禁词、没有写回规格。

失败怎么办：
- 某行必须改判据才能达成：停该条，交规格负责人，不就地改判据。
- 出现"已通过""已闭环""用户已确认"这类表述：判红重写，不许留。

机器字段（校验器用，人可跳过）：
- **来源 / FR / AC**：R-C07-28、R-C07-31；D-009、D-037；FR-C07-004、FR-C07-013、FR-C07-032、FR-C07-022；AC-C07-4、AC-C07-7、AC-C07-6。
- **文件 / 符号**：`tests/contract/page-audit-acceptance.test.mjs`（追加 `verdicts` 组；符号 `verdictRows`）。
- **动作**：①七行各写 AC 编号 + 一个八值档位 + 一条具名证据路径；②非 pass 项写原因、条件与 owner；③写六项结论；④写复验四项（F2P/P2P 与 FULL/PARTIAL/NO）；⑤写回写五项（Done、`per_ac[]`、本契约头自一致、`facts.jsonl` 既有字段、修复记录），不写 `spec.md`；⑥断言七行齐、档位在词表、无"防假绿成立/已通过/已闭环"字样、无"用户已确认"小毛病表述。
- **输入**：T022、T023 的七行草稿；P7 的校准与绑定输出；`skills/stage-close/SKILL.md:12` 的最终报告消费口径。
- **输出 / 失败**：七行加六项加复验加回写齐；失败＝漏行、档位自造、把 `incomplete` 写 pass、出现禁词、写回规格。
- **边界 / 禁止改动**：不改 P1–P7 契约头；不改 AC 判据；不改 `spec.md` 与 `decision-log.md`。
- **依赖**：`T022`、`T023`（七行来源）。
- **测试层级 / 技能**：定向契约测试 + 文本禁令扫描；预写测试＝本文件（作者＝验收执行者）；主技能 `skills/spec-specify/SKILL.md`（WR001）；测试变更请求＝none。
- **场景 / 夹具或服务**：正常＝七行齐；反向＝删一行、写 pass 但证据缺、出现"已闭环"字样；接缝＝产出方前两块与 P7 输出，产物 `per_ac[]` 七行与 Done，读取方终端 final-report 与收口技能，分母＝七条 AC。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-acceptance.test.mjs -t "verdicts"`。
- **预期退出码**：RED nonzero; GREEN 0。
- **RED 目标失败**：ORACLE-P8-ACCEPTANCE 的 `verdicts` 组：`expect(rows.map(r=>r.ac)).toEqual(SEVEN)` 收到不足七行；`expect(rows.filter(r=>r.state==='pass')).toEqual([])`（本任务无 pass）失败于任一自造 pass；归因＝目标行为失败。
- **RED 证据**：`unavailable — 同上，落 quality/tests/<date>-p8-verdicts.*`。
- **GREEN 判定器**：ORACLE-P8-ACCEPTANCE：七行齐、档位合法、非 pass 有原因与 owner、禁词为零、回写不触及 `spec.md`；反向"缺行/自造 pass/禁词/写回规格"判红。
- **证据**：`P8-acceptance.json` 的 `per_ac[]`；判什么＝七行档位与指针、六项结论、复验四项、回写五项；怎么判＝读 `per_ac[]` 加五禁令扫描；谁提供＝验收执行者；何时＝build-code P8 收口；成本＝命令级；拿不到＝记 `unavailable`。
- **停止 / 恢复**：七行中任一需改判据才能达成时，停该条并交 spec owner，不就地改判据。
- **覆盖上限**：只证明记录完整与禁令未破，不证明 AC 通过。
- **完成**：一条命令重放；七行、六项、复验、回写、禁词五项命中。

### 写主与并行

唯一开发写手是本 Phase 的验收执行子代理，审查与复验只读。
验收执行者与修复者必须是不同上下文。
四张卡共用同一个测试文件，所以按编号串行写：任务 1 → 2 → 3 → 4。
任务 1 定分母必须先做；任务 2 与 3 内容互不依赖，可以并行构思；
任务 4 收口两者，必须最后做。编号接续前一个 Phase 的最后一张卡。

### 怎么验证

跑一条门禁命令；四个组全绿只说明结构成立，不等于验收通过。
- 门禁命令：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-acceptance.test.mjs`
- 期望：退出 0；入口、三条离线判据、真实环境清单、七行档位四组全绿。
- 判定器：ORACLE-P8-ACCEPTANCE 是结构判定器；七条验收各自的判定器是 ORACLE-C07-1 到 ORACLE-C07-7，1、2、6 落在 T022 的三块，3、5、7 落在 T023 的六组，4 落在 T024 的七行。结构绿不等于七条判过。
- 收口条件：七条每条要么 `available`（有档位与具名证据）要么 `unavailable`＋具名原因与 owner；七条全 `unavailable` 时本 Phase 记未完成，不得收口。
- 证据：`quality/evidence/build-code/P8-acceptance.json` 的 `per_ac[]`。
- 不证明什么：不证明任何页面事实，也不把未达成写成通过。

哪些测、哪些只写命令：
- 测两块：七条验收的离线判据；业务任务止于 mock 的表述（验收 6 的文本部分）。
- 只写命令不测三块：九类反例与修复复验、缩放与键盘与读屏、C05 样本 A/B 真实审计。
- 分级可重复只部分测：离线只判校准负例与规则文本在场，两次同级要真执行才判。

执行时按 13 项固定留痕，逐项填：
1. 入口准则：核前七个 Phase 的完成、写入集落地、两份就绪件状态；缺一项即未达成。
2. 两份就绪件：数据件（六哈希、受控页在场）、环境件（引擎、版本、缩放与读屏工具）各带状态。
3. 授权边界：范围只本任务工作树与只读样本；副作用只写证据目录；每条跑一次、修复后复验一次。
4. 逐条结论：七行，每行一个档位加一条具名证据；非 pass 不计通过，档位不写回规格。
5. 五类执行事实：每命令记参数、目录、执行者、退出码、原始输出落点、机器报告。
6. 效果评测：基线用前七个 Phase 的红绿原件；指标是命中数与未覆盖数；不用覆盖率判通过。
7. 复验四项：复验者与修复者不同上下文；原问题用例与回归用例各大于零；写最小可证伪集。
8. 变更批准：用例增删改写要独立批准者、理由、影响评估；无变更写"无"加理由。
9. 分诊与关闭：失败先复现，分诊者非实现者；记编号、严重度、处置；终值只取六种。
10. 回写五项：Done、`per_ac[]`、本文件自一致、任务事实库字段、修复记录；不写规格。
11. 六项结论：评估与局限、偏差、未充分测试的特性、未解决事件、残留风险、签核对象。
12. 防自证五禁令：不用授权文本验授权；不删到绿、不改断言、不重跑到绿；不用计数代替逐条。
13. 失败闭环：失败 → 分诊 → 根因 → 回修复原 Phase 的任务 → 换上下文复验 → 回写五项。

### 风险、回滚、停点

最大的风险是把"测试退出 0"当验收通过。
- 触发条件：某条断言只查文件存在或只查字符串在场。
- 影响：验收变成形式证据，证据只作事实的约定被破。
- 缓解：每条断言必须要求具名通过元素（字段值、错误码、对象身份），缺失即失败。
- 回滚：只撤回那一条断言，其余六条保留；恢复条件是原判据可回读。
- 无法回滚：交 spec owner 与独立审查者裁定；审查指出某条可"无证据通过"即回滚该条。

停点四条：
- 前序 Phase 原件缺失：停该条，回对应 Phase 修复，不以本 Phase 的断言代替。
- AC 需变更：停，交 spec owner 取用户确认；不就地放宽，不由验收改规格。
- 需真实环境而用户不在场：保持 `unavailable`，写条件、具名命令与预期。
- 失败反复且没有新事实：按四类分诊处理，保留原失败原件。

覆盖上限：
- 本 Phase 能确立"七条验收的适用条件是否齐、缺口在哪、谁补"。
- 它不确立任何页面事实，也不把 `incomplete`/`unavailable` 变成 pass。
- 显式不覆盖：真浏览器读数、修复是否真的生效、用户对次要问题的接受、C06 真实业务、设计资产。
- 未决：AC-C07-4 的刻度取值依赖 OPEN-07；样例是否够由判据负责人在 build-code 核。

### 完成与交接

完成要六项：四组测试真跑出红与绿、七行档位与指针、两份就绪件状态、
真实环境命令与预期、复验四项与分诊记录、独立审查按 diff 核写集。
缺任一项，对应 AC 保持非 pass，并在 Done 写明。
七条全 `unavailable` 时本 Phase 记未完成：不收口、不写完成、不以"计划阶段未执行"当共同原因；
每条要单写它缺的那件输入、owner 与恢复条件。

三条交接事实：
- `acceptance-evidence-validator.mjs:5` 只接受 `evidence/` 或 `quality/evidence/` 前缀；
  `:6` 是八值档位，逐字见 `2026-10-29-003-code-anchors-and-consumers.md` 第 179 与 205 行。
- `spec.md:476-583` 是七条判据原文；本 Phase 只读它，档位写 Done 与证据原件。
- `quality/tests/2026-10-29-001-build-plan-page-audit-red.txt` 是唯一已发生的真实失败，
  只当"判据已冻结"的事实，不当本任务的 AC 通过。

下游：build-code 终末按 `per_ac[]` 写 final-report 的验收行；`stage-close/SKILL.md:12` 读同一指针。
进度值只保存在任务事实库的 `phase_progress` 游标里，本文件不保存进度。

## L2 — 可删除参考

删掉本节不改变 L0 与 L1；这里只放命名建议与编号对照。
- 断言命名建议：`entry`、`AC-C07-1` 到 `AC-C07-7`、`real environment`、`verdicts`。
- `per_ac[]` 字段建议：`{ac,state,evidence,reason,owner}`；就绪件字段：对象哈希、在场清单、status。
- 编号对照：正文的"验收 1 到 7"依次是 `AC-C07-1` 到 `AC-C07-7`；
  "决定 N"指 `decision-log.md` 的 `D-0NN`，本 Phase 用到 D-002、D-007、D-009、D-033、D-037。
- 逐字事实与读命令：`2026-10-29-003-code-anchors-and-consumers.md`（本卡不复制）。
- 受保护面实读（2026-10-29，HEAD `fa56dbc6`，只读）：`spec.md` 第 454 行起的验收节逐条标题、
  `acceptance-evidence-validator.mjs` 第 1 至 12 行、`stage-close/SKILL.md` 第 1 至 16 行，三处都实读过。
