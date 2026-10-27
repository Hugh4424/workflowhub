# Phase P8 — 全 AC 终末验收

读者：本 Phase 验收者、verify-code 终末复核者，以及 C06／C08 的下游读者。
读完要能：按哪份原件逐条判每条 AC、缺什么输入、失败怎么闭环。

引用外部来源时写清版本与原文位置；行号是生成时刻快照、会漂移、不作契约。

## Phase 契约头（文件级字段；runtime 逐字读取）

- **全局规格**: `spec.md#Appendix A — 验收判据（唯一权威）`
- **写入集**: `quality/evidence/P8-acceptance.json`；`quality/evidence/P8-readiness-data.json`；`quality/evidence/P8-readiness-env.json`；`quality/tests/fixtures/c03-acceptance-missing-ac.json`
- **依赖**: `P5、P7`
- **消费者**: verify-code；C06、C08 下游读者
- **gate_cmd**: `node quality/tests/c03-evidence-check.mjs P8`
- **oracle**: ORACLE-C03-P8-ACCEPTANCE
- **evidence_path**: `quality/evidence/P8-acceptance.json`
- **STOP**: 任一 AC 缺证据、某条上游 Phase 的 Done 未达成、或真浏览器不可用时停下；材料交对应上游 Phase 作者，修复路径是回该 Phase 的 Task 补证据，不在本 Phase 改上游结论。
- **覆盖 AC**: `AC-C03-1`、`AC-C03-2`、`AC-C03-3`、`AC-C03-4`、`AC-C03-5`、`AC-C03-6`、`AC-C03-7`、`AC-C03-8`
- **Done**: 八条 AC 逐条给一个档位与一条具名证据指针；非 `pass` 项写未通过原因、所需条件与具名 owner；本 Phase 只执行未闭环 case，不重跑全部。

## 工作包声明（人读事实）

- **读集**：`spec.md` 的 Appendix A 与实现设计；P1～P7 每个 Phase 的契约头 `Done` 与 `quality/evidence/P*.json`；`quality/evidence/P1-ledger.json`；`quality/evidence/P2-reuse.json`；`quality/evidence/P3-counterexamples.json`；`quality/evidence/P4-page.json`；`quality/evidence/P5-handoff.json`；`quality/evidence/P6-shared-segment.json`；`quality/evidence/P7-external.json`。
- **定序写主**：三份证据文件只由本 Phase 写；上游证据只读，不改写、不修补。
- **接口符号清单**：无共享函数；消费 `quality/tests/c03-evidence-check.mjs P8` 的检查结果。
- **合并责任**：验收者负责提交与冲突协调；失败换新执行者重做，原失败保留。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值。

## 速读卡（人读；只写本 Phase 增量，不复制 `spec.md`）

- **本 Phase 结果**：八条 AC 各有一个档位与可回读证据，缺的写清缺在谁那里。
- **非目标**：不在本 Phase 修上游缺陷（回原 Phase）；不重跑全量回归；不重判已在各 Phase 判过的结论。
- **改动前**：六条产物分散在 P1～P7，没有任何一处能回答「整卡是否达标」。
- **改动后**：一张逐条结论表，加两份就绪件与复验记录，能直接交 verify-code。
- **与相邻 Phase 的边界**：P5 交 C08 清单、P7 交外部项结论；本 Phase 只汇总与补未闭环 case。
- **主要风险**：把「材料存在」当成「AC 通过」。若因此返工，替代走法是逐条回读证据并对照真实文件。
- **下一步**：verify-code 终末复核，之后按关闭方法收口。
- **动手前必读**：`spec.md#Appendix A — 验收判据（唯一权威）`；`runtime/evidence/acceptance-evidence-validator.mjs:6`（八值词表）；上一 Phase `P7-外部引用台账与登记.md` 的「交接知识」。
- **未决事实**：两条链能否在本机跑起来（`spec.md` PFACT-008 为推断）；影响 AC-C03-4，处理位置 T014 的入口准则。

## 本 Phase 材料导航（人读；只列本 Phase 实际用到的锚点）

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#Appendix A — 验收判据（唯一权威）` | 取八条 AC 的验证、通过、失败、证据四行 | 开工前 |
| `runtime/evidence/acceptance-evidence-validator.mjs:6` | 取八值档位词表，不自造新词 | 填表前 |
| `quality/evidence/P1-ledger.json` 至 `P7-external.json` | 逐条 AC 的证据原件 | 逐条判决前 |
| 各 Phase 契约头的 `Done` | 入口准则逐条核对 | 开工前 |
| `quality/tests/c03-evidence-check.mjs` | 结构检查与负例控制 | 每次写证据后 |

没列进本表的材料不要凭印象引用；列进来的每条锚点在写卡片时都要实际打开过。

## L0 — 结果与变更

前七个 Phase 各自交一部分：台账、两条链的选择与改动、反例、页面证据、交 C08 的清单、共享资产段、外部项结论。它们各自的 Done 只回答自己那一段，不回答整卡是否达标。

本 Phase 把这些原件消费一次，逐条给出 AC 档位，只补执行上游没有闭环的 case，交一份能复核的结论。它对应全局目标的最后一个可验收结果：整卡的判据能被别人重放，而不是只有作者知道结论。

- **结果**：八条 AC 各有一个档位与一条证据指针，非 pass 项写明原因与 owner。
- **非目标**：不改上游材料、不重跑全量、不新增 AC。
- **与其它 Phase 的区别**：前七个 Phase 产证据，本 Phase 判证据；判决不改变上游原件。

## L1 — 可执行契约

### 文件边界

- **新增**：`quality/evidence/P8-acceptance.json`；`quality/evidence/P8-readiness-data.json`；`quality/evidence/P8-readiness-env.json`
- **修改**：N/A — 上游证据只读，不修改。
- **禁止改动**：`quality/evidence/P1-ledger.json` 至 `quality/evidence/P7-external.json`（上游原件）；`spec.md` 的 Appendix A（判据不允许在本 Phase 放宽）；`PB/frontend/src/**`（缺陷回 P2／P4 修，不在验收 Phase 改代码）；`WH/skills/frontend-component-quality/SKILL.md`（归 P6）。

### 任务顺序

`T014` 单任务。它按固定顺序做四件事：入口准则 → 逐条结论 → 未闭环 case → 六项结论。

### Task graph 与纵向切片（现有 Task 字段的写法）

本 Phase 是一个纵向切片：读七份上游证据 → 逐条 AC 结论 → verify-code 与下游读者读取。没有新增运行时行为；它不存在的层是「新的产品能力」，明确不适用。

### 测试策略

本 Phase 的判据是「逐条 AC 有证据、有档位」，不是新的行为测试。项目声明的测试面里，本 Phase 适用「静态核对面」与「真浏览器页面面」的复核（只在页面证据缺失或不可复读时补跑），不适用单元测试面与构建面，理由：本 Phase 不改代码。

- 逐条 AC 的验证层：静态核对（读原件、对真实文件）＋ 必要的浏览器复核。
- 命令：`node quality/tests/c03-evidence-check.mjs P8`。
- 预期结果：退出 0；缺任一条 AC 的档位或证据指针必须非 0。
- 失败条件：非 pass 项被记成 pass；档位用了八值词表以外的词；证据指针打不开。

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 缺一条 AC 档位时检查器非 0 | T014 | 负例控制 | `node quality/tests/c03-evidence-check.mjs P8 --input=quality/tests/fixtures/c03-acceptance-missing-ac.json` / `1` | ORACLE-C03-P8-ACCEPTANCE / unavailable — 本阶段未执行，负例夹具尚未建立 |
| 八条 AC 齐且有证据指针 | T014 | GREEN | `node quality/tests/c03-evidence-check.mjs P8` / `0` | ORACLE-C03-P8-ACCEPTANCE / `quality/evidence/P8-acceptance.json`（本阶段未执行） |

### 覆盖边界

- **覆盖上限**：只能确立「八条 AC 在本次实际证据下的档位」。不能确立：设计源是否获批、C08 的更新能力、跨项目可搬运性、未覆盖对象的语义。
- **显式不覆盖**：全量回归、其它页面域、发布流程。

### 停止

出现以下任一即停：① 某条 AC 的证据指针打不开；② 页面证据缺失且真浏览器不可用；③ 上游 Done 与证据不符。交对应上游 Phase 作者，按该 Phase 的「停止/恢复」处理；本 Phase 不改上游结论。

### 完成

要诚实下结论需要：八条 AC 各一个档位与证据指针、两份就绪件、五类执行事实、复验四项、六项结论、回写记录。结论强度只到「本次证据下的档位」，不到「资产或设计质量通过」。

### 风险与回滚

- **风险**：把「文件存在」当成「AC 通过」。
- **影响**：整卡被高估，verify-code 拿到假结论。
- **缓解**：每条 AC 必须能回读一个证据原件并说清判了什么；非 pass 不写 pass。
- **回滚**：删除本 Phase 三份证据文件重做，不动上游原件。
- **触发条件**：发现任一档位与证据不符。

### 交接知识（给下游 Phase 与审查的已核实事实）

- 八值档位词表在 `runtime/evidence/acceptance-evidence-validator.mjs:6`：`pass`、`fail`、`inconclusive`、`deferred`、`missing`、`inconsistent`、`incomplete`、`unavailable`。不自造第九个。
- P1～P7 的 `evidence_path` 分别是 `quality/evidence/P1-ledger.json`、`P2-reuse.json`、`P3-counterexamples.json`、`P4-page.json`、`P5-handoff.json`、`P6-shared-segment.json`、`P7-external.json`；本 Phase 只读它们。
- 末 Phase 不新增全量重跑：各 AC 的首判归 spec 指定的承接 Phase，本 Phase 只补未闭环 case。

### 验收 Phase 固定小节

1. **入口准则**：逐条核对 P1～P7 的 `Done`、写入集落地与两份就绪件的 status；每条写核对结果与证据路径。任一条未达成，该条起 AC 记 `incomplete`，不先把整卡判 `pass`。
2. **两份就绪件**：数据就绪件 `quality/evidence/P8-readiness-data.json`（两条链的夹具/路由参数/预期记录），环境就绪件 `quality/evidence/P8-readiness-env.json`（Node、pnpm、`frontend/node_modules`、`vite`／`vitest`／`playwright` 可用性、端口、日期）。各写 `status`，缺数据记 `incomplete` 或 `unavailable`，不伪造。
3. **授权边界**：写目标＝PaperBuilder 工作树与本任务证据目录；允许的本机动作＝启动 dev server、跑定向 vitest、跑 playwright 定向用例、只读 git；禁止＝改发布流程、改 `catalog.yaml`／`reuse-registry.md`／`AGENTS.md`、推远端、全量回归；失败即停条件＝dev server 起不来或浏览器不可用。
4. **逐条结论**：每条 AC 一行，写编号、一个八值档位、一条具名证据指针。结论行数与 AC 条数相等，均为 8 行，不按计数替代逐条。
5. **五类执行事实**：逐条记命令与参数、cwd 与执行者、exit code／signal／timeout、原始输出落点、机器可读测试报告（runner 与版本）。`refs` 各标 `execution_record`、`machine_report`、`trace`、`screenshot`、`coverage`、`mutation`、`contract_check`、`red_original`、`negative_control` 之一。首次失败重跑通过标 `flaky`、档位记 `inconclusive`。
6. **效果评测**：本卡的效果指标是「八条 AC 的档位分布」与「台账覆盖条数／分母」，不设像素或百分比阈值。先用负例控制证明检查器能区分（缺字段非 0），再冻结输入与停止条件；报告里分开样本数、变更数与未测成本；噪声不可估或收益未越过可观察波动时记 `inconclusive`。
7. **复验四项**：写复验者与修复者的上下文差异（具体 subagent 身份或 provider 名）、F2P 与 P2P 各自用例清单且计数都大于 0、所跑回归范围与它为何是本次最小可证伪集合，并记未知影响面、三档判分。F2P＝1 且 P2P＝1 记 FULL；其余按该节规则记 PARTIAL 或 NO；PARTIAL 不记 `pass`。
8. **变更批准**：AC 或用例集合每次增删改，写独立审查批准者身份、`Rationale for Change`、`Impact Assessment`，登记列为 `Change Request ID`、`Impact Assessment`、`Approval Status`、`Closure Notes/Verification Status`。本卡若无变更写「无＋理由」。本 spec 在 AC-C03-1～4 之外新增 AC-C03-5、AC-C03-6、AC-C03-7、AC-C03-8，来源分别是决策验收面第 5 行、G-10、G-07 与 U-001 用户答复（扩卡、按实数）；这是规格阶段的新增，需在本节登记并给影响评估。
9. **分诊与关闭**：失败先复现；分诊者不是实现者。最低字段 `Defect ID`、描述、是否可复现、`Version detected`、`Severity`、`Priority`、`Disposition`（初值 `Pending`）。终值只取 `Fixed`、`Won'tFix`、`Deferred`、`AcceptedRisk`、`Duplicate`、`NotABug`、`Referred`；不修的值写理由与风险接受人。关闭留 `Closed by`、`Date closed`、`Change reference`、`Test reference`、`Closure Notes/Verification Status`。
10. **回写五项**：① `spec.md` 场景卡；② `spec.md` AC 表；③ 各 Phase 契约 `覆盖 AC`；④ `facts.jsonl` 既有字段；⑤ 本次修复记录。每项写哪条 case 改了、为什么改、改后判定；缺一项不算闭环。
11. **六项结论**：逐项写评估（含局限）、与计划的偏差及原因、未充分测试的特性及原因、未解决事件（逐条）、残留风险、签核对象。每项非空；无则写「无＋理由」。
12. **防自证五禁令**：不用授权文本验证授权文本；不删到测试变绿、不改断言消音、不重跑到绿；黄金清单改动由另一主体批准；不用计数代替逐条；不把 `incomplete`、`unavailable`、`missing`、`unverified` 写成 `pass`。
13. **失败修复复验闭环**：失败 → 分诊 → 根因调研 → 修复回原 owner Phase 的 Task → 换上下文复验（F2P 加 P2P）→ 回写五项。降级项同段写风险承接人署名。

### T014 — 八条 AC 逐条结论与未闭环 case

- **来源 / FR / AC**: `prd.md:244` 的 AC-C03-1、AC-C03-2、AC-C03-3、AC-C03-4 加用户「外部内容逐项引入」一条（R-011，PRD 无对应条文）；`spec.md` 依 G-10、G-07 补的 AC-C03-6、AC-C03-7；依 U-001 用户答复补的 AC-C03-8；以及 AC-C03-5（外部能力项逐项结论）。FR-C03-001、FR-C03-002、FR-C03-003、FR-C03-004、FR-C03-005、FR-C03-006、FR-C03-007、FR-C03-008、FR-C03-009 全体。改动结果：一张能交 verify-code 的逐条结论表。
- **输入**：P1～P7 的证据原件与各 Phase 的 `Done`（由 T001～T014X 产出）；`spec.md` 的 Appendix A；八值词表。结果对象＝八条 AC 的档位；producer＝本 Phase 的验收者；consumer＝verify-code 复核者；执行 owner＝验收者；时点＝P7 收口之后。
- **文件 / 符号**：`quality/evidence/P8-acceptance.json`；`quality/evidence/P8-readiness-data.json`；`quality/evidence/P8-readiness-env.json`（均新增）。符号：N/A — 非代码文件（证据）。
- **动作**：① 按固定小节第 1 项核入口准则；② 建两份就绪件；③ 逐条读 AC 证据并给档位，缺的记 `incomplete`／`unavailable` 并写 owner；④ 只补上游未闭环 case（例如页面证据只在 640 像素取过一次时补桌面宽度；外部台账只在 C03 五项上核过时补全量清单抽核）；⑤ 按第 10 项回写；⑥ 写六项结论与签核对象。
- **输出 / 失败**：输出是八行结论与三份证据文件。失败信号：某条 AC 无证据指针、档位词不在八值内、把 `incomplete` 写成 `pass`、把上游未达成当成自己新判。
- **边界 / 禁止改动**：不改上游证据、不改 `spec.md` 的 Appendix A、不改代码。
- **依赖**：`T010`、`T012`、`T013`（P5 的交接清单、P7 的对外结论与台账）。
- **测试层级 / 技能**：静态核对面为主，真浏览器面只在补未闭环 case 时用；主技能 `skills/frontend-testing/SKILL.md`，浏览器面用 `skills/isolated-browser-qa/SKILL.md`。不测单元与构建面，理由：本 Phase 不改代码。
- **场景 / 夹具或服务**：正常例＝八条 AC 都有可回读证据；反向例＝缺一条 AC 档位的验收表，检查器必须非 0；服务＝按需启动的 PaperBuilder dev server。
- **预写测试**：调用 P1/T001 交付的 `quality/tests/c03-evidence-check.mjs` 的 P8 分支（T014 不改该脚本，只跑它），断言「八条 AC 各一行、档位在八值内、证据指针能打开」；负例夹具 `c03-acceptance-missing-ac.json` 由 T014 建立并必须判非 0。
- **可观察接缝**：产出方＝本 Phase 的三份证据；已持久化产物＝`quality/evidence/P8-acceptance.json`；真实读取方＝verify-code 终末复核者与 C06／C08。怎么知道的：`runtime/evidence/acceptance-evidence-validator.mjs:6` 定义了档位词表；P1～P7 的 `evidence_path` 在各自契约头逐字给出。
- **RED/GREEN 门禁命令**：`node quality/tests/c03-evidence-check.mjs P8`（负例加 `--input=quality/tests/fixtures/c03-acceptance-missing-ac.json`）。
- **预期退出码**：`RED 1（缺 AC 的负例）；GREEN 0`；归因：八条 AC 缺行属**目标行为失败**，证据指针打不开属**环境失败**。
- **RED 目标失败**：ORACLE-C03-P8-ACCEPTANCE；断言＝缺 `AC-C03-6` 行的验收表必须被判非 0，并点名缺失的 AC 编号。
- **RED 证据**：`unavailable — 本阶段未执行`。原因：本阶段不进入 build-code，未在 PaperBuilder 上跑命令，也未建立负例夹具；build-code 收口前先跑负例再跑正式表。
- **GREEN 判定器**：ORACLE-C03-P8-ACCEPTANCE；正式表退出 0，八条 AC 齐；反向行为：把任一 `pass` 换成 `incomplete` 后，检查器仍应 0，但下游复核能读出差异——档位检查只核词表与指针，不替人判真假。
- **证据**：`quality/evidence/P8-acceptance.json`、`P8-readiness-data.json`、`P8-readiness-env.json` 与负例执行原件。
- **覆盖上限**：只确立本次证据下的档位；不证明设计批准、C08 更新能力或全库语义。
- **停止 / 恢复**：证据指针打不开或页面证据缺失且浏览器不可用即停；交对应上游 Phase。恢复方式：回该 Phase 补证据，再重跑本 Phase 的同一命令。
- **测试变更请求**：none。
- **完成**：八条 AC 各一行、档位在八值内、证据指针可打开、两份就绪件有 status、复验四项与六项结论齐、回写五项有记录；每条验收项写成没参与实现的人能用一条命令重放的形式。

## L2 — 可删除参考

删除本节不改变 L0／L1：它是给验收者的提醒——先读证据再判，不要先写结论再找证据；判不出来就写判不出来的原因，别用一个像结论的词把它盖住。

## 补充材料

- 判据：`spec.md#Appendix A — 验收判据（唯一权威）`
- 上游证据：`quality/evidence/P1-ledger.json`、`P2-reuse.json`、`P3-counterexamples.json`、`P4-page.json`、`P5-handoff.json`、`P6-shared-segment.json`、`P7-external.json`
- 档位词表：`runtime/evidence/acceptance-evidence-validator.mjs:6`
- 验收资产治理：`docs/architecture/test-asset-governance-rules.md#验收标准可执行形式der-01der-11r-001fr-16ac-16`
