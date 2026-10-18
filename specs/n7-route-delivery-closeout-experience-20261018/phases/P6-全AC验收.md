# Phase P6 — 全任务验收：逐 AC 消费真实原件并诚实保留缺口

读者：独立验收者、verify-code复核者与用户。本卡是同一任务唯一末验收；本次按用户已授权的两项最小实施范围补验收承接；不据材料授权宣实施/验收成功，不新增真实PR或物理close授权。

- **全局规格**：`spec.md#appendix-a--验收判据唯一权威`
- **写入集**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-acceptance-green.output`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-ac-per-ac.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-six-adoptions.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-reverify.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/evidence/2026-10-18-p6-data-readiness.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/evidence/2026-10-18-p6-env-readiness.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-triage.md`
- **依赖**：P1、P2、P3、P4、P5
- **消费者**：verify-code终末复核者与用户
- **gate_cmd**：`node --test tests/integration/main-agent-cost-closeout.node-test.mjs && npx vitest run tests/contract/stage-closeout-step-contract.test.mjs tests/contract/business-repo-experience-file.test.mjs tests/contract/delivery-closeout-charter-contract.test.mjs tests/contract/delivery-note-contract.test.mjs tests/contract/acceptance-matrix-references.test.mjs tests/contract/stage-closeout-skill.test.mjs tests/contract/build-prd-review-contract.test.mjs tests/contract/stage-runtime-reflect-entry.test.mjs tests/n2-skill-catalog-portability.test.mjs tests/acceptance/card-03-current.test.mjs`
- **oracle**：ORACLE-P6-ALL-AC
- **evidence_path**：`quality/tests/2026-10-18-p6-ac-per-ac.md`
- **STOP**：证据形态不符/缺真实输入时只停该条通过主张，列缺口与owner；缺外仓成功、独立来源、真实PR、完整N1或build-prd成本能力均不造pass。失败修复回原Task，安全修复可继续。
- **覆盖 AC**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-013
- **Done**：13条各有实际档位与具名原件；所有适用条件满足才pass。预PR的build-code读回保AC-010真实PR子条件incomplete；verify-code在授权产生真实PR后再消费本卡与新原件，不新增Phase、不以P6全绿作为开PR前置。build-prd成本工具不支持、真实权限/方法试行或N1缺失各保独立限制，未满足不得宣整卡完成。

## 工作包声明（人读事实）

- **读集**：当前spec全部AC/OPEN、完整decision-log及原始来源、P1–P5实际产物与Done原件、真实测试/review/命令、指定成本记录窗口、N4评测治理；仅沿已核引用读必要原件，不整目录复制。
- **定序写主**：T010由非P1–P5实现者的独立上下文执行，不改生产或判据。写入集只外置task精确原件；不存在时create-only，若已存在先比较同字节复用，需新事实沿现有普通记录另取唯一名并先同步精确范围，不覆盖已发布件。
- **接口符号清单**：只读ACCEPTANCE_RESULTS既有词表；无新writer/schema/字段。
- **合并责任**：T010独立验收；发现回T001–T009原owner修，之后换上下文复验。
- **G1 声明（本卡删除／合并／降档了什么）**：合并旧两卡重复汇总/复算为同一逐条判定过程；消费既有原件一次，不强迫验收卡删字，不新增规则或质量门。
- **progress_cursor**：只沿facts现有phase_progress定位，不能推完成。

## 速读卡（人读；只写本 Phase 增量）

- **本 Phase 结果**：每条承诺的实际证据、未达条件和责任人可分别读回，不把机器绿换成全验。
- **非目标**：simplicity P1复用原件/现有工具；不重测已闭环同字节事实，不写真实历史或外仓，不新增runner、评测台、测试机制或第二进度对象。
- **改动前**：上游产物是否实施/测试/审查均依真实记录，不预设五份GREEN已存在。
- **改动后**：单条结论引用对应实际对象/执行/独立读回，未完成仍明确未完成。
- **与相邻 Phase 的边界**：只消费P1–P5和必要未闭环case；修改回原Task。真实PR是verify-code现有关闭动作的结果输入，不是P6的依赖边。
- **主要风险**：PR尚无就卡死build-code或拿稿件替真PR；替代为先发表真实incomplete，原授权关闭到合法时机后沿本卡补新事实，不改旧报告。
- **下一步**：verify-code终末独立复核与真实交付；最终归档/删除/清理仍需真实最终范围确认。
- **动手前必读**：spec Appendix A及OPEN-007/008/009、各Phase真实原件、N4治理评测与冻结测试边界。
- **未决事实**：新方法业务效果、外仓权限成功、匿名质量与完整N1、PR以及build-prd成本支持均不能预填；各原owner提供事实，T010只判已有输入。 另见spec OPEN-010：公共review默认单仓无法容纳本卡声明的外仓/task绝对写路径；013直接scope结果仅结构诊断，不等真实host准入或质量。实际host未提供可信reviewReadScope时该覆盖审查记unavailable，不改parser、不伪造scope或删真实写集求绿；范围明确的安全工作继续，不增推进门。

## 本 Phase 材料导航（人读；只列本 Phase 实际用到的锚点）

| 材料 / 锚点 | 用途 | 时机 |
| --- | --- | --- |
| `spec.md:638-690` | I/O、去重、权限夹具、真实PR、N7数字与未决条件 | 逐条前 |
| `docs/architecture/test-asset-governance-rules.md:9-25` | 独立同尺/匿名、物理隔离与真实RED | 判定前 |
| `tools/cli/measure-main-agent-cost.mjs:309-310` | 四stage支持限制，不虚造build-prd账行 | 成本条件时 |
| `tests/contract/business-repo-experience-file.test.mjs:30-68` | 只文本非真实I/O，避免覆盖膨胀 | AC-006/007/009时 |

## L0 — 结果与变更

P0五类必要设计为written，落契约头、工作包、L1/T010及十三项验收小节。真实PR条件deferred给verify-code owner在合法PR产生后交T010；不改当前build-code事实、不制造前置门。外部条件按P1选节展开，L2无必做步骤。

## L1 — 可执行契约

### 文件边界

- **新增**：仅契约头外置task七精确原件，原件未产生不声称已写；普通额外原始输出引用现有执行记录，不复制镜像。
- **修改**：N/A — 无生产修改，不改上游材料/判据/原件。
- **禁止改动**：spec/各Phase/全部冻结测试/历史/生产与外仓路径；新验收事实若需要写范围外，先按已有owner声明范围，不暗扩。

保护实读（2026-10-18，read）：P2冻结测试只读五文件文字与登记，无writer；P3 RESIDENT_BUDGET=36861且固定三文件；P4只字段/闭包；P5仅有限路径字面和共享至少一目标。成本CLI309–310只接受make-decision/build-plan/build-code/verify-code，build-prd报invalid stage。不能因卡上写DO NOT TOUCH就声称已物理隔离；执行者核实际可写面，未建立明确披露，不能修改自身验收契约/标签。

### 任务顺序

T010单卡：消费上游→核缺口与必要重放→逐AC判→六项各真实消费者首验/数字复核→分诊/独立复验。真实PR由原阶段owner执行，不在本卡调用。

### Task graph 与纵向切片

来源与原产物→实际测试/方法/环境原件→独立判断→可交接缺口。旧T016/T017合一避免先判结论后才补输入；无新增UI/API/schema。

### 测试策略

头部命令是本任务受影响集合的保守上限；有同输入有效原件则引用，只重放受修复/缺闭环/新疑点影响的具名部分并记录实际argv，不能把未跑完整命令写成已跑。无全量npm test/test:safe。node:test文件必须用node --test。文字/方法/真实环境/匿名质量分面，P2实际创建/追加/去重/并发/中断/拒绝必须有方法试行原件，不能用静态测试替；必要未闭环case依原Task精确边界执行，T010自身不得写未声明生产路径。

### 覆盖边界

只读聚合不是端到端执行；测试数量/覆盖率/哈希/版本相同不证明效果。无UI产物所以浏览器面不适用，不能据此免文档/I/O/接口。匿名缺失、成本噪声不可估/收益未越波动均不宣更好；N4一般字节质量退役与N7两条明确上限分开。

### 停止

沿STOP，不靠计数或其它AC结果填空，权限失败停相应外部路径且零重试，provider缺失如实unavailable不换成通过。

### 完成

13条结论证据完整，非pass逐条原因/条件/owner；实际缺PR/N1/成本支持时只能诚实部分验收，不把已发布报告写全验。后续新事实发布新唯一原件不覆旧。

### 风险与回滚

发现结论错误保原件，沿现普通记录追加更正引用；不覆盖历史、整文件checkout或动共享生产。修复归原owner具体hunk。

### 交接知识（给下游 Phase 与审查的已核实事实）

历史npm-check原输出与reference-audit是不同观察，前者曾有markdownlint失败但原输出缺实际exit字段、涉及多个来源，不推断全因N2或reference-audit；合入后真实检查回当前原件，未读不作当前结论。成本允许续记非重叠窗口，同stage不保证永久一行；一次收口只触发一次record并核该窗口不重复、不重置起点。

## 验收 Phase 固定小节

### 1. 入口准则

逐P1–P5读Done、实际diff、写集及独立审查/限制，数据/环境件status逐项对应原件。缺Done证据只停对应通过主张，继续有依据安全工作，不让就绪件变门。

### 2. 两份就绪件

数据件为头部quality/evidence中具名data-readiness.md：真实经验条目及来源、P1之后的交接、方法正反/并发/中断/拒绝、真实PR是否已有各列status/提供者；build-plan历史交接只基线。环境件同目录env-readiness.md：实际Node/runner与依赖、受控fixture授权和清理范围、两业务仓成功证据/权限缺口、PR凭据及成本CLI四stage限制；缺输入不N/A冒通过。

### 3. 授权边界

T010只读生产/外仓，写限七精确task原件；任何受控fixture补执行由原T002/T003 owner沿其真实测试授权与路径进行，验收者消费其原件。本卡不push/开PR/merge/归档/清理分支/worktree；真实PR由verify-code合法关闭owner负责，阶段切换/HEAD变化不自动撤已有范围授权但须按真实范围/HEAD record/consume；新增范围不能借本卡获得。权限/真实资源失败停对应路径，报告替代道路。

### 4. 逐条结论

AC-013仍是六项采用，不另造第七项；P1核五项核心方法、P4核opening-a-pr，git-workflow-and-versioning/ketchup的AGENTS治理落点由P3/T007首次验收。只拿P1方法原件不能宣这两项全部落点已交；缺治理首验回T007，不由P6末尾汇总首次补实现。

结论件13行：每AC一个既有ACCEPTANCE_RESULTS档位和具名原件，非pass不计通过。AC-003须有P1之后按新方法产生的四类具名试行，真实受控失败、真实取消各至少一次且原件齐全，缺任一类或原件则对应子条件incomplete；AC-004须用该问用户/不该问用户的成对输入（两类各至少一例）分别核漏问、多问，空动作项列表不代通过。AC-002/003成本build-prd子条件因现CLI不支持保incomplete；AC-006/007方法与真实两仓、AC-009路径限制/方法授权语义、AC-010结构/实际PR、AC-012数字/含义保全/质量/完整N1分条件，不互相补绿。

### 5. 五类执行事实

逐命令记实际参数、cwd/执行者、exit/signal/timeout、原始输出、runner版本/机器报告，refs沿模板现值分类。未采集的项明缺口，不填0。仅同代码、同输入、同环境且未经修复的失败重跑转绿标flaky/inconclusive；修复后转绿按F2P记录，保留失败与通过的前后版本及原件；旧相同原件直接引用，不复制。完整测次未执行不写整命令成功。

### 6. 效果评测

先读N4治理9–11行，比较前冻结同题输入与judge标准（分别不可变原件）；生成者只见必要输入不见rubric/身份/其它候选，标准作者与judge、实现者隔离，另一上下文匿名A/B。质量五维按N4：独立行动、必留项、引用可核、失败/权限保全、篇幅集中；逐维更好/打平/无法判断及原因/总体，任维全无法判断保缺口，缺匿名或独立judge不冒接受。普通findings不代比较。

先用具名受控正负材料确认测具可区分，再冻结输入/指标/停止；一次只改一处，可观察收益未越波动记inconclusive，不设次数/分数门。error以独立oracle误报漏报/错误结果计，work为实际处理输入/对照次数，样本/变更/工程成本分别报，标签逐项回实际原件。无实际量不估算。

N7数字独立核：常驻固定三文件≤36861、被替代固定14文件≤211944、新增单列且含新增总数、已发生+1463包含；merge前基线不覆写、merge后真实现读数另列，不改分母支付。数字不证质量/token收益。完整N1四组、同条件次数/波动/全部尝试必须回原件，缺失unknown/incomplete，不称整卡成本全验。

### 7. 复验四项

记录非实现者具体身份/上下文差异；F2P列真实失败后通过目标用例，P2P列既有保护清单，两分母均>0才判三档，按模板FULL/PARTIAL/NO实际比率给结果，PARTIAL不pass；历史RED未核不混入。回归为头部受影响集合中必要部分，说明保守超集理由，不借全量绿。文本F2P不替人工效果。

### 8. 变更批准

T001既有lastSlug及T009引用/驱动更新须各有Rationale for Change、Impact Assessment、旧新断言、此前真实RED与独立批准者原ref；列Change Request ID/Impact Assessment/Approval Status/Closure Notes/Verification Status。作者不能自批；无其它变更写无及理由，不预断仅两项必然全获批准。

### 9. 分诊与关闭

独立于实现者先复现，记Defect ID、描述、可复现、Version detected、Severity、Priority、Disposition初Pending；终值沿模板既有集合，未修须理由/风险接受人真实署名。Closed by/Date closed/Change reference/Test reference/Closure Notes/Verification Status有据才写；不伪造接受人。

### 10. 回写五项

逐项说明spec场景、spec AC表、Phase覆盖AC、facts既有字段、修复记录的实际影响；T010不改材料，若需变更由原owner修并独立核，不以“无”掩有修复。未改明确理由。没有完整五项不称闭环。

### 11. 六项结论

在本卡指向的逐条结论件写评估/局限、计划偏差及原因、未充分测试特性、逐条未解决事件、残留风险、签核对象；各项非空，无则具名理由。预PR/权限/N1/匿名或costCLI缺口逐条披露，不新增报告种类。

### 12. 防自证五禁令

授权文字不验证授权文字；不改测试/断言/判分消音，不重跑直到绿；黄金清单另一主体批准；计数不代逐条；unknown/unavailable/incomplete/missing/unverified不写pass或succeeded。要求显式通过元素，absence不是成功。仅声明DO NOT TOUCH不证物理隔离。

### 13. 失败修复复验闭环

失败→独立分诊→根因→原T001–T009修→独立上下文F2P/P2P→回写五项；降级项注明真实责任人及接受范围，未有真实接受保needs_human，不代签。复用本卡与现事实，无新阶段/许可/账本。

### T010 — 全AC逐条件独立读回、必要复验与缺口交接

- **来源 / FR / AC**：R-001至R-015及U-001至U-005；FR-CLOSE-001、FR-CLOSE-002、FR-CLOSE-003、FR-CLOSE-004、FR-CLOSE-005、FR-CLOSE-006、FR-CLOSE-007、FR-CLOSE-008、FR-CLOSE-009、FR-CLOSE-010；AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-013；真实现有路线五件/收口/经验/交付/保护/减法完整承诺，不能用汇总替首次采用。
- **输入**：P1–P5真实产物/命令/独立原件与当前spec；实施owner提供实际新交接、经验来源/方法试行、受控正反、固定字节；verify-code owner在合法实际PR后提供其正文/URL/验证/diff。输入缺失逐条列owner/取得条件，不能等未来PR阻塞本次partial读回。
- **文件 / 符号**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-acceptance-green.output`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-ac-per-ac.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-six-adoptions.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-reverify.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/evidence/2026-10-18-p6-data-readiness.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/evidence/2026-10-18-p6-env-readiness.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n7-route-delivery-closeout-experience-20261018/quality/tests/2026-10-18-p6-triage.md`；符号只读ACCEPTANCE_RESULTS，无生产修改。
- **动作**：只读实际原件先核手工独立oracle与worker标签逐项对应；形成两就绪件；只执行必要未闭环定向case，已闭环引用；按十三小节判13AC，核六项核心方法P1/P4及适用AGENTS治理P3/T007各自首验原件（缺则回原Task补，不在末尾首次实现）；复算最终N7两条数字及新增总数，质量/成本分别判；分诊修复回原owner；预PRincomplete诚实发布，verify-code真实PR后同卡读新事实不覆旧件。
- **输出 / 失败**：逐条档位、对应原件、覆盖上限和未达owner；缺任何适用条件不算整AC通过，命令非零原事实保留。
- **边界 / 禁止改动**：上游spec/Phase/冻结测试、历史、生产/外仓只读；不借验收创建PR或越权探写，无新运行/测试机制。
- **依赖**：P1、P2、P3、P4、P5
- **测试层级 / 技能**：受影响文本contract/node:test＋方法独立人读＋真实环境原件＋匿名质量/成本；主技能backend-testing。真实新增代码N/A，本任务不造实现替身。
- **场景 / 夹具或服务**：五Phase实际产物为正；文本绿冒I/O、拒绝冒两仓成功、无PR冒可读、无judge冒更好为负；具名一次性fixture只沿原Task授权，历史与无关仓绝不成为测试负载。
- **预写测试**：复用冻结五目标与现有保护，不新增判据/框架；缺行为原件按同一原方法必要实跑，未跑保持缺口。
- **可观察接缝**：真实上游producer→task唯一原件/工作树→独立验收者；本轮read各冻结测试和spec638–690确认分面；当前GREEN/方法/PR输入须逐原件核，不以预期路径存在冒执行。
- **RED/GREEN 门禁命令**：`node --test tests/integration/main-agent-cost-closeout.node-test.mjs && npx vitest run tests/contract/stage-closeout-step-contract.test.mjs tests/contract/business-repo-experience-file.test.mjs tests/contract/delivery-closeout-charter-contract.test.mjs tests/contract/delivery-note-contract.test.mjs tests/contract/acceptance-matrix-references.test.mjs tests/contract/stage-closeout-skill.test.mjs tests/contract/build-prd-review-contract.test.mjs tests/contract/stage-runtime-reflect-entry.test.mjs tests/n2-skill-catalog-portability.test.mjs tests/acceptance/card-03-current.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0为沿用上游目标/回归预期；本卡不新造RED，不把未全执行该组合写成执行成功，实际只重放必要具名部分。
- **RED 目标失败**：ORACLE-P6-ALL-AC；各上游具名目标断言失败沿原RED核，环境错误不算；本卡无新增行为目标，缺RED事实unknown不制造失败。
- **RED 证据**：五Phase历史red.output及当前独立执行原件只引用，不预称全部有效；实际归因由T010逐原件读回。
- **GREEN 判定器**：ORACLE-P6-ALL-AC；必要目标/回归实际命令0只支持其范围，13条按spec证据形态独立判，所有适用条件明确通过才pass；build-prd成本/PR/N1/权限/质量缺项保持原档位。
- **证据**：头部逐条结论为计划位置，五类执行原件及各独立读回保持单份；已存在同字节直接引用，缺机报告/轨迹写缺口不造文件。
- **覆盖上限**：不证真实用户长期效果、任意环境权限、完整N1未测收益或物理交付；只读汇总不冒端到端。
- **停止 / 恢复**：沿STOP，失败回原owner hunk修，结论错误发布新事实不覆已发布原件。
- **测试变更请求**：none；读取T001/T009实际批准与范围，不代批准。
- **完成**：13AC逐条档位/原件/缺口完整、独立复验与六项首验有据、N7数字/语义/质量/成本分列；缺条件不宣阶段成功或整卡全验。

### 本次授权补充的验收承接与Docker边界

本次用户已批准P5原两文件适配现行公共consumer、P1先补build-prd成本最小方案再实施定向验证；P6仍只读消费各原owner的新原件，不扩大自身写集。P5须逐13旧AC核承接与正负控，原AC-FIX-001未覆盖仍incomplete；导入失败/0tests不能当行为RED。P1新增成本标签不改变正式stage；核唯一旧账本、真实session/window/来源、原字节保全及读回，未取得前OPEN-009与对应成本子条件保持incomplete，旧invalid stage原件不改。

已核根因是原评测输入048的task_input.materials与061的judging.access_boundary臆增独立host-mounted实现；N4原义要求实际访问结果，并未指定机器或容器。048/061旧原件不可变，修正版由原标准owner另出唯一原件并保缺陷来源，P6取到后按其真实引用消费，不覆写历史。用户明确拒绝Docker，禁止启动daemon、安装或配置；不为本卡建立容器基础设施。匿名比较复用现有native packet最小权限工具边界，按原AC-012及效果评测要求固定输入/标准、分开作者/候选/标记者/judge；候选不能见rubric、身份或其它候选，以真实访问轨迹核实际工具/文件可见面，不要求用户提供独立认证host、新机器或容器；没有物理隔离不宣已建立，但不得把N4的AC-17机械移为N7整卡前置。匿名/独立证据缺失仍保unknown/incomplete，不用普通findings代比较；不删N1四组同条件成本与真实来源要求，不用拒绝Docker作豁免。

所有新材料/测试变更仍沿原T001/T009精确TCR和独立审查，不新建控制面、阶段、许可或账本；历史原件与OPEN-006/008/009/010保留，新授权只消除两项范围待决，不自动关闭质量缺口。

## L2 — 可删除参考

not-applicable — 全局设计与原判据在spec，原始失败和历史不复写；本节删去不影响L0/L1。
