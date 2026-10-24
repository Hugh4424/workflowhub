# Phase P9 — 五条验收项逐条有档位，非通过项写清原因

读者：verify-code 执行者、独立判定者与项目维护者。
读完要能：按命令与原件逐条判五条 AC，并看懂哪条未通过、缺什么。

> 三问：①一个结果——五条 AC 各有一个档位与证据指针；②判定者——独立判定者按 Appendix A 与真实原件核；③可独立提交——本 Phase 是全任务末验收，复用 P1～P8 的原件，不重做实现。

## Phase 契约头（文件级字段；runtime 逐字读取）

- **全局规格**: `spec.md#实现设计（全局权威）`
- **写入集**: `specs/workflowhub-ui-frontend-c01-norm-init-20261024/spec.md`；`specs/workflowhub-ui-frontend-c01-norm-init-20261024/phases/P9-全AC验收.md`；`quality/evidence/2026-10-24-021-acceptance-results.md`；`quality/evidence/2026-10-24-023-acceptance-data-readiness.md`；`quality/evidence/2026-10-24-024-acceptance-environment-readiness.md`；`specs/workflowhub-ui-frontend-c01-norm-init-20261024/phases/index.md`
- **依赖**: `P8`
- **消费者**: verify-code 的独立判定者；项目维护者
- **gate_cmd**: `sh -c 'exec /usr/local/bin/node /Users/Hugh/Hugh/Project/workflowhub/node_modules/vitest/vitest.mjs run tests/contract/external-capability-intake.test.mjs tests/contract/acceptance-object-cli.test.mjs --root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c01-norm-init-20261024'`
- **oracle**: ORACLE-P9-ACCEPT
- **evidence_path**: `quality/evidence/2026-10-24-021-acceptance-results.md`
- **STOP**: 任一 AC 缺少具名证据、或需要真实环境与用户在场的判据未执行时停下，记具体缺口与承接人；不得用计数或编号在场替代逐条。
- **覆盖 AC**: AC-C01-1、AC-C01-2、AC-C01-3、AC-C01-4、AC-C01-5
- **Done**: 逐条列五条 AC 的档位与证据指针；AC-C01-1 只能人读、AC-C01-2 只能人读、AC-C01-3 机器可判、AC-C01-4 只能人读、AC-C01-5 机器可判＋只能人读；非 pass 项写具体原因、所需条件与具名 owner；未参与实现的人用一条命令重放可执行部分。

## 工作包声明（人读事实）

- **读集**：本任务 `spec.md`、`phases/*.md`、`decision-log.md` 的验收面；P1～P8 的证据原件；两份冻结 oracle 的 GREEN 输出。
- **定序写主**：本 Phase 独占契约头写入集内的结论回写与两份就绪件；执行原件沿 `evidence_path` 保存。消费 P1～P8 已有首判原件，不改其形成时事实。
- **接口符号清单**：无；只消费命令输出与原件。
- **合并责任**：本 Phase 由 verify-code 执行者负责，判定者与实现者不同上下文。
- **progress_cursor**：只指向 `facts.jsonl` 的 `phase_progress`。
- **规则锚**：`spec.md`「Appendix A — 验收判据（唯一权威）」及「首判与最终聚合」；`decision-log.md`「验收面」「WP6 — 验收对象合同与真实任务准备」「WP7 — 负例、独立检查与逐卡验证」。
- **材料变更影响**：358/359登记六路径，360/149后固定三件回写，362/363升级及369/370撤回均保历史。现新增374候选覆盖、376/377两独立充分判断，仅依`quality/evidence/2026-10-24-378-p9-ac2-candidate-closure-result-correction.md`更新本卡/Spec当前AC2pass；AC1 incomplete、AC2–5限原合同pass，不重用362整项推论。Appendix A/decision/index与021/023/024不改，仅必要delta/diffcheck，不跑149或材料结构check，不动facts/cursor。

## 速读卡（人读；只写本 Phase 增量，不复制 `spec.md`）

- **本 Phase 结果**：五条 AC 各一个档位、一条证据指针，缺项具名。
- **非目标**：不重做实现、不修 P1～P8 的产物（除非复验失败回原 owner）、不做业务 E2E。
- **改动前**：五条 AC 的判据已定，但尚无逐条档位与两份就绪件。
- **改动后**：验收档位表、缺口清单与两份就绪件；只回写本卡写集内的六处。
- **与相邻 Phase 的边界**：上游各 Phase 给各自执行与首次独立结论，P8 给负例事实；本 Phase 聚合并复放，只回写本卡允许路径，不替上游首次判定。
- **主要风险**：以"文件存在"或"命令 exit 0"冒充 AC 通过；返工替代走法是回到原 AC 判据逐条补证。
- **下一步**：closeout 与交接。
- **动手前必读**：`spec.md` 的 Appendix A；`decision-log.md` 的「验收面」；P1～P8 的证据原件。
- **未决事实**：AC-C01-4 的语义适用性判据只能人读，需具名判定者。

## 本 Phase 材料导航（人读；只列本 Phase 实际用到的锚点）

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md` 的 Appendix A | 取五条 AC 的唯一判据 | M 开工前 |
| `decision-log.md` 的「验收面」 | 取可观察边界与承接负责人 | M 开工前 |
| P1～P8 的证据原件 | 逐条给证据指针 | M 逐条判定时 |

## L0 — 结果与变更

本 Phase 是全任务唯一的末验收：不重跑实现，只消费已有原件与命令输出，按 Appendix A 给五条 AC 各一个档位。可执行部分用一条命令重放；语义部分由独立读者核。任何一条非 pass 都要写清缺什么、谁承接。

- **结果**: 五条 AC 的档位表与缺口清单，可被 verify-code 与维护者直接读。
- **非目标**: 不重做实现、不改判据、不做业务 E2E。
- **与其它 Phase 的区别**: 只有本 Phase 覆盖全部五条 AC。

## L1 — 可执行契约

### 文件边界

- **新增**: `quality/evidence/2026-10-24-021-acceptance-results.md`（逐条档位与缺口清单）、`quality/evidence/2026-10-24-023-acceptance-data-readiness.md`、`quality/evidence/2026-10-24-024-acceptance-environment-readiness.md`（两份就绪件）
- **修改**: `spec.md`（待独立结论后新增“本次结果回写”段及场景事实，不改Appendix A判据或强行勾选）、`specs/workflowhub-ui-frontend-c01-norm-init-20261024/phases/P9-全AC验收.md`（具名runner/真实RED/TCR说明及固定结论回写）、`specs/workflowhub-ui-frontend-c01-norm-init-20261024/phases/index.md`（仅P9行完整路径与六路径写集同步）
- **禁止改动**: `spec.md` 的 Appendix A 判据；`tests/contract/**`（冻结 oracle）；P1～P8 的证据原件；PaperBuilder 任意文件

### 任务顺序

T022 单卡覆盖五条 AC；内部按 AC-C01-1 → 2 → 3 → 4 → 5 顺序逐条判。

### Task graph 与纵向切片（现有 Task 字段的写法）

T022 纵切"AC 判据 → 命令或原件 → 档位"，五条 AC 各占一行，不合并。

### 测试策略

| 测试面 | 适用性 | 命令 | 预期 | 失败条件 |
| --- | --- | --- | --- | --- |
| 冻结 oracle 重放 | 适用 | `sh -c 'exec /usr/local/bin/node /Users/Hugh/Hugh/Project/workflowhub/node_modules/vitest/vitest.mjs run tests/contract/external-capability-intake.test.mjs tests/contract/acceptance-object-cli.test.mjs --root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c01-norm-init-20261024'` | 退出 0 | 任一断言失败 |
| 独立人读 | 适用 | 按 Appendix A 逐条核原件 | 五条各有证据指针 | 以编号在场代覆盖 |
| 浏览器与业务 E2E | 不适用 | — | — | 本卡不做（C05／C07 承接） |

### 覆盖边界

- **覆盖上限**: 只证明五条 AC 在本任务范围内的判据被执行；不证明产品质量与 C09 业务闭环。
- **显式不覆盖**: 真实用户旅程、视觉还原、视觉差异。

### 停止

任一 AC 缺具名证据、或需真实环境与用户在场的判据未执行时停下，记缺口与承接人。

### 完成

五条 AC 各一档位与证据指针；非 pass 写原因、条件与 owner；可执行部分由独立者重放通过。

### 风险与回滚

- **风险**: 用"命令 exit 0"替代 AC 语义
- **影响**: 假通过
- **缓解**: 每条 AC 单列人读判据与见证人
- **回滚**: 退回原 AC 判据重判，不改判据
- **触发条件**: 审查发现某条 AC 只有命令没有语义证据

### 交接知识（给下游 Phase 与审查的已核实事实）

- 五条 AC 的判定方式：AC-C01-1 只能人读、AC-C01-2 只能人读、AC-C01-3 机器可判、AC-C01-4 只能人读、AC-C01-5 机器可判＋只能人读。
- 验收证据档位只能取 `pass`、`fail`、`inconclusive`、`deferred`、`missing`、`inconsistent`、`incomplete`、`unavailable`（`runtime/evidence/acceptance-evidence-validator.mjs` 的既有词表）。

### 验收 Phase 固定小节

1. **入口准则**：按 spec「首判与最终聚合」核对 P1～P8 的 Done、执行原件与首次独立结论、写入集落地及两份就绪件状态。缺首判时记具体缺口并回原 owner Phase 补证；其余安全核对继续，不由 P9 新写结论倒填上游完成。
2. **两份就绪件**：数据就绪件写 `quality/evidence/2026-10-24-023-acceptance-data-readiness.md`（验收对象与来源清单），环境就绪件写 `quality/evidence/2026-10-24-024-acceptance-environment-readiness.md`（实际Node/已装Vitest来源、认证cwd/root及目录/runner读取事实；不预设npx可用或本树无node_modules，不把配置默认端口冒运行实例）；各写 status。
3. **授权边界**：只读生产文件、PB worktree 与既有上游原件；仅按契约头写入集回写本卡结论与就绪件，保留 spec 原验收判据；凭据失效或环境不可达时按停止条件留真实失败。
4. **逐条结论**：每条 AC 一行，写编号、一个档位、一条具名证据路径；结论行数等于 AC 条数。
5. **五类执行事实**：命令、cwd、exit code、stdout 落点、runner 与版本；`refs` 标 `execution_record`／`machine_report` 等既有类型。
6. **效果评测**：历史`quality/tests/2026-10-24-120-build-plan-red-v2.txt`只证其形成时源码/argv，不预设“同为12条失败到0”。按各原owner真实RED/GREEN逐case比较（保095→099、125→128等各自范围）；当前两冻结文件只由独立执行者单次复放并保存原件，未跑不预填GREEN。不用覆盖率或测试数量判通过。
7. **复验四项**：写复验者与修复者的上下文差异、真实可比较的F2P与P2P清单、回归范围与未知影响面；缺case前后原件即记missing及原因，不造计数或拿不同argv/源码的读数冒同一比较。
8. **变更批准**：不改AC/Appendix A。冻结oracle断言若变更才沿原TCR及独立批准；既有授权内新增受控输入/运行记录不自动冒冻结测试变更，逐项引用原批准/影响与实际文件差异；未改冻结tests则据实说明，不倒造TCR。
9. **分诊与关闭**：失败先复现，分诊者非实现者；字段按模板固定项写。
10. **回写五项**：① `spec.md`独立“本次结果回写”段与场景追加事实（原判据不改）；② 本卡（`specs/workflowhub-ui-frontend-c01-norm-init-20261024/phases/P9-全AC验收.md`）的逐条结论；③ `quality/evidence/2026-10-24-021-acceptance-results.md`；④ `facts.jsonl` 既有字段由任务运行时写入，不在本卡写集；⑤ 本次修复记录（若失败复验后修复）。
11. **六项结论**：评估、与计划偏差、未充分测试特性、未解决事件、残留风险、签核对象。
12. **防自证五禁令**：不用授权文本验授权；不删到绿、不改断言消音、不重跑到绿；黄金清单由另一主体批准；不拿计数代逐条；不把 `incomplete`/`unavailable`/`missing`/`unverified` 写成 `pass`。
13. **失败修复复验闭环**：失败 → 分诊 → 根因 → 回原 owner Phase 修 → 换上下文复验 → 回写五项。

### 本次固定小节回写与本 Phase 自带判据小结

独立判定者：Parfit原Spec轴376及原Standards轴377；writer：Kant，六路径唯一材料writer。360基础合读后到374/376/377与`quality/evidence/2026-10-24-378-p9-ac2-candidate-closure-result-correction.md`更新AC2，370撤回历史不变，不复用362被撤回整项推论，不改Appendix A。

| AC | 档位 | 独立结论与原件 | 范围/缺口 |
| --- | --- | --- | --- |
| AC-C01-1 | incomplete | `quality/evidence/2026-10-24-360-p9-independent-five-ac-aggregation.json`（合读218） | 第一链missing、第三链incomplete；八类/模板局部可消费不补生成因果。 |
| AC-C01-2 | pass | `quality/evidence/2026-10-24-378-p9-ac2-candidate-closure-result-correction.md`（374当前候选审计＋376/377两独立轴；合原360） | 当前两仓相关候选/reader覆盖已独立确认；非全历史/零读者/47组等义全迁，DES04/OPEN03仍unknown。 |
| AC-C01-3 | pass | `quality/evidence/2026-10-24-360-p9-independent-five-ac-aggregation.json`（019/127/129/015及149） | 限真实对象结构、consumer与缺项/owner/本地文件负例；不证明页面、服务或权限。 |
| AC-C01-4 | pass | `quality/evidence/2026-10-24-360-p9-independent-five-ac-aggregation.json`（012/013/313/338） | 限真实离线准备、五类分权、原字节与首次独立语义；实际实例/数据/权限/页面仍unknown。 |
| AC-C01-5 | pass | `quality/evidence/2026-10-24-360-p9-independent-five-ac-aggregation.json`（138/142/148与P1原011/012） | 限原查询及失败可核：current=pin；history unavailable，不宣无更新。 |

- **入口/两份就绪件**：上游首判沿360，021/023/024保形成时字节；当前合读378：AC1 incomplete，AC2由374/376/377补齐后pass。当前候选覆盖与旧局部观察分清，不倒签370撤回时点或上游完成。
- **五类执行事实**：149 receipt/raw：真实WH cwd，直接Node/已装Vitest绝对argv，两具名test、显式root，12/12 exit0，无signal/timeout/cancel/truncation。此为当前独立复放，外层sh包装未执行，不伪称同argv；本writer不重跑测试。
- **效果/复验四项**：095→099与125→128各按其原源码/argv/case引用，当前149只12例。360为独立人读聚合。F2P/P2P逐case清单未取得完整可比原件的部分记missing，四项全过程计量/人工时间与完整三级缺陷分母unknown，不填0或造12失败到0。
- **变更批准**：本次仅材料结果回写，无AC/冻结断言变更；不新造TCR。358先登记真实六路径，index只P9对应行。固定三件首次创建，历史原件保全。
- **分诊/残留/签核对象**：AC1归P3原writer/决定owner（姓名未取得）补真实生成链，不重演历史。AC2当前相关候选/reader及375剩余缺源已由原两轴376/377确认充分；global-reskin目标case读四CSS；live-pages读CSS＋metadata＋test-only oracle，不读旧Markdown，未运行case不冒新GREEN。新具体第二active反例才回其owner窄修独立核，不造全历史/零读者门；原轴最后核转录，不由作者签阶段/交付。
- **已验/未验**：149两冻结文件pass，未重跑；当前五AC合读360及378：AC1 incomplete、AC2–5限原合同pass。376/377是当前两仓相关规范候选与reader的独立判断，非机器/页面/动态零读者证明。DES04/OPEN03、差3、真实服务/数据/权限/页面unknown保原，PB相应owner后续提供获准实例/样本/合同，当前离线AC4不需启服务。
- **六项结论**：评估为全AC未通过；偏差仍为AC1两链未齐，AC2现依据374/376/377补齐；未充分测试为真实页面/业务/动态边界；未解决事件合读021/360与378；残留风险合读023/024及当前独立覆盖边界；签核对象仅材料与原件，最后转录复核待原两轴，不自判质量或阶段完全完成。

### T022 — 五条 AC 逐条给档位与缺口

- **来源 / FR / AC**: `R-001`～`R-021` 与 `U-001`～`U-024`（PRD C01 卡 L202 的四条 AC ＋ §S3 的更新检查义务；decision-log「验收面」）——五条验收项逐条判定；FR-NORM-001～FR-NORM-011；AC-C01-1、AC-C01-2、AC-C01-3、AC-C01-4、AC-C01-5。
- **输入**: P1～P8 的证据原件与命令输出；本任务 `spec.md` 与 `phases/*.md`。执行 owner 为 verify-code 执行者；判定者为非实现者上下文。
- **文件 / 符号**: `specs/workflowhub-ui-frontend-c01-norm-init-20261024/spec.md`、`specs/workflowhub-ui-frontend-c01-norm-init-20261024/phases/P9-全AC验收.md`、`quality/evidence/2026-10-24-021-acceptance-results.md`、`quality/evidence/2026-10-24-023-acceptance-data-readiness.md`、`quality/evidence/2026-10-24-024-acceptance-environment-readiness.md`、`specs/workflowhub-ui-frontend-c01-norm-init-20261024/phases/index.md`；符号：N/A — 只回写档位与结论。
- **动作**: 消费并复放上游首判原件，按 Appendix A 逐条记档位；首判归属沿 spec「首判与最终聚合」，缺项回原 owner Phase 补证，不由 P9 替上游首次作结论。同时汇总各 Phase 在第一次实际执行时按 PRD §S6 采集的四项计量（任务返工、缺陷、人工时间、验收确认）现状与三级严重度（严重／中等／轻微）的处置结果，缺记录写 unknown 不填 0；仅写契约头内六处路径，执行原件沿 evidence_path 保存，不改其它材料。
- **输出 / 失败**: 五条档位与缺口清单；失败信号是缺证据仍记 pass。
- **边界 / 禁止改动**: 只回写契约头内允许内容；不改验收判据、冻结 oracle、P1～P8 原件与 PaperBuilder 文件，不替上游补造执行事实。
- **依赖**: `P8`
- **测试层级 / 技能**: 验收执行（定向命令＋独立人读）；主测试技能 `skills/spec-analyze/SKILL.md` 的只读核对。
- **场景 / 夹具或服务**: 正例=五条 AC 均有原件与命令输出；反例=以"文件存在"或 exit 0 代 AC 语义；不搭夹具。
- **RED/GREEN 门禁命令**: `sh -c 'exec /usr/local/bin/node /Users/Hugh/Hugh/Project/workflowhub/node_modules/vitest/vitest.mjs run tests/contract/external-capability-intake.test.mjs tests/contract/acceptance-object-cli.test.mjs --root /Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c01-norm-init-20261024'`
- **预期退出码**: RED nonzero; GREEN 0
- **RED 目标失败**: ORACLE-P9-ACCEPT；任一条 AC 的判据无法复放或命令失败，断言失败即视为未验收。
- **GREEN 判定器**: ORACLE-P9-ACCEPT；两条冻结 oracle 退出 0 且五条 AC 各有证据指针；反向行为=任一 AC 非 pass 仍记通过即失败。
- **证据**: `quality/evidence/2026-10-24-021-acceptance-results.md`
- **覆盖上限**: 不证明业务效果、真实用户旅程与视觉还原。
- **停止 / 恢复**: 缺证据或需真实环境未执行时停，记缺口与承接人，不冒通过。
- **测试变更请求**: none
- **完成**: 五条 AC 档位齐、非 pass 有原因与 owner、可执行部分由独立者重放通过。

## L2 — 可删除参考

五条 AC 的命令与原件清单会随任务演进；删掉本节不改变 L0/L1。

## 补充材料

- 唯一判据：`spec.md` 的 Appendix A
- 可观察边界：`decision-log.md` 的「验收面」
