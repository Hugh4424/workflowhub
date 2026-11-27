# Phase P8 — 前置任务与全 AC 收口

本文件写给本 Phase 的实施者、独立审查角色与整任务验收者。
读完要能在最终合并版本上判三件事：
前四个任务承诺过的一百二十七条，今天逐条是「打得开／只剩缺口／文件在但内容对不上／未取得」中的哪一个；
四条旧判据各自「仍适用／已过时／本身有缺陷」，判「仍适用」的当场打破一次；
前四任务自己声明过的同一批检查在合并版本上逐行读数。
本 Phase 是唯一末验收，全部 17 条 AC 在这里给出结论。

写作标准：`skills/material-writing/SKILL.md` 的「材料写作标准（唯一）」。
本文件不复述标准，只说明本次例外：
机器字段标题与块内标签按原词逐字读取，不改名、不翻译；
判词表、三态表、集成态读数表与 17 行 AC 表的表头、列序与四值用词按 AC-12 原文逐字固定。

## 哪些节必须写，哪些可以省？

先读这张表再动笔；它决定本 Phase 写哪几节。

| 二级节 | 状态 | 不写时的写法 |
| --- | --- | --- |
| 这一 Phase 交出什么？ | 必填 | 无 |
| 开工就绪表 | 必填 | 无 |
| 这一 Phase 怎么验收？ | 必填 | 无 |
| 为什么现在做，依据是什么？ | 必填 | 依据未取到写 `unverified` 与具体缺口 |
| 开始前读什么？ | 必填 | 无 |
| 每个文件由谁改，先做什么？ | 必填 | 无 |
| 怎么验证？ | 必填 | 无 |
| 下一消费者拿什么继续？ | 必填 | 无 |
| 验收 Phase 才能做的检查 | 必填（唯一末验收） | 无；本 Phase 是唯一末验收，13 项全写 |
| 每张任务卡怎么写？ | 必填 | 无 |
| 派发预算 | 必填 | 无 |
| 机器字段（校验器用，人可跳过） | 必填 | 无 |
| 写完之前三问、怎么拆 Phase、效果判据、字段消费者登记、补充材料 | 删除 | 写作脚手架与模板自带登记，不进真实文件 |

## 这一 Phase 交出什么？

收口的人在同一次读回里能逐条指出：前四个任务的一百二十七条承诺今天哪一条还打得开原件、哪一条只剩具名缺口；
四条旧判据哪些还能照抄、哪些过期了、哪些本身有毛病，且判「仍适用」的那条有打破前后的真实读数；
整版跑一遍前四任务自己声明过的检查，哪些绿、哪些红、哪些因缺输入跳过、哪些声明本身坏；
全部 17 条 AC 在最终字节上各是什么结论。
这次不靠「文件在不在」这种话，靠一条写死的解析规则和一张一百二十七行的判词表；表里每条都有四值结论，没有一条写「通过」。

- **本 Phase 结果**：
  三张表（判词表 127 行、三态表 4 行＋T08 单列缺口行、集成态读数表 41 行）与一张 17 行全 AC 结论表落在任务根 `quality/evidence/p7-replay/`；
  `skills/stage-close/SKILL.md` 第 1 节末多出两段正文（三态三问＋当场打破、集成态一行）；
  `workflows/build-code/SKILL.md:386` 段末多一句指针。
  对应原问题/FR：FR-17「前置任务逐条结论与旧判据三态」、FR-18「集成态与缺件点名」（`spec.md:100-101`）。
- **非目标**：
  本 Phase 不加检查器、不加账本、不加阶段、不加字段或状态对象；
  不改生产代码、不改任何退出码、不改 8 值档位与 9 值回放判词；
  不改前四个任务的任何材料，不改 `decision-log.md`、`spec.md`、其它 Phase 卡与 `phases/index.md`；
  不动 T08 的锚点、不给它补替代读数，也不回填历史报告；
  不把单卡通过说成整版通过，不拿别的命令或改过的参数去救一条跑不了的声明门，不用「过期了」这类同义词凑三态。
- **改动前**：
  仓里没有一处正文说要判旧判据三态，也没有一处写合并之后要重跑（`grep -c '旧判据'` 今天 0；`因缺输入跳过`／`单卡通过不等于集成通过`／`同一批检查` 在 `skills workflows docs` 三树各 0）；
  四份收档报告的判词停在各自的提交上，之后每个任务各又有提交、最后合并又是一笔，看起来全都合法；
  一百二十七条里只有 61 条真命中一份普通文件，18 条只剩同源改了名的候选件，25 条材料只写到目录、没给文件名，23 条确实没有——若把目录也算「打得开」，那 25 行会整块变成绿灯（86／18／0／23）；
  任务二的七包承诺是一个文件七行 `{ans}` 占位，同文件头句却写「均已收到真实答复」；
  任务四里那条被当成「唯一完成依据」的回放，材料里一次都没被引用，它指的月片锚点今天没核；
  四条既有读数面（`run-checks`／`check-specs-archive`／`check-delivery-claims`／`check-stage-steps`）在副本上删掉一条通过证据后输出一字不变，拿它们做破坏证明会假绿。
- **改动后**：
  一百二十七条各有一个四值结论与备注（基准／候选 sha256／仅目录／非路径引用／缺口 owner）；
  四条旧判据各落三态之一，判「仍适用」的那条有「删件前后多出一句点名该件、原有行一条不减、恢复后逐字节相同」的读数；
  四十一行声明门逐行写死 argv、看哪个流、用哪条正则判，37 行可执行、3 行因缺输入跳过、1 行不可执行；
  三张表表头绑定「读的是哪个提交、什么时候读」，与实施时的 `git rev-parse HEAD` 同值；
  17 条 AC 各有结论，缺首判原件的写未取得与 owner。
- **与相邻 Phase 的边界**：
  P2–P7 各自首判自己的 AC 并交回原件；本 Phase 只消费这些原件，另在最终字节上重跑 6 条（AC-03／04／06／13／14／15）；
  P7 交回 `workflows/build-code/SKILL.md` 的 `:327`／`:331`／`:334` 与六句正文位置，本段只写同文件 `:386` 段末一句；
  本段交给整任务验收者的就是三张表、17 行表与两处正文的实际字节。
- **包 7 的 127 条由 AC-12 承载**：包 7 的一百二十七条由 AC-12 承载，不单列 AC。理由一：AC-12 的判法已在最终字节上逐条核这一百二十七条的四种结论，单列一百二十七条 AC 会让同一批承诺出现两套 AC 权威；理由二：AC-01–AC-19 的口径只在 `spec.md` Appendix A 写一次，把一百二十七条拆成 AC 会绕开这条单一事实源。替代方案：若要单列成 AC，须由用户答复改 AC-12 或另立新 AC，本段不自改。
- **主要风险**：口径一松就骗过读者——把目录、行位引用、改名同源件当「打得开」，25 行会一夜变绿，整张表变成「都验过了」的错觉。
  若因它返工，替代走法是只改口径不改判据：把「内容级（已读）」降级为「路径级（内容未核）」并在表头同时报两组数（61／18／25／23 与 86／18／0／23 的对照仍留着），46 行必读清单不删；审查仍不接受时停该路径，回 spec owner 裁决口径（属改判据，不在本段内切换）。
- **下一步**：独立审查角色按本卡「验收 Phase 才能做的检查」判 17 条 AC；整任务验收者读三张表与两处正文的实际字节。
- **动手前必读**：
  `spec.md:221`（P8 行）、`spec.md:823-826`（AC-12 原文）、`spec.md:100-101`（FR-17／18）、`spec.md:384-436`（§5 写集）、`spec.md:440-471`（§6 依赖图）；
  `quality/evidence/build-plan/p7/design.md` 的 §2.1（解析规则）、§2.2（41 行与判据）、§2.3（七槽）、§2.4（破坏探针）、§3（分母与六列）、§4（三张表）、§5（17 行表）、§6（两处正文与六 token）、§7（T08）；
  `quality/evidence/build-plan/p7/card.md`（版本 `65c3649e`）与同目录 `research.md`；
  `skills/stage-close/SKILL.md:12`、`:24`、`:26`（一字不改的边界与插入点）与 `workflows/build-code/SKILL.md:386`（定位字符串 `首判来源与当前适用分开：`）；
  `specs/archive/delivery-quality-foundation-20261122/spec.md`、`…direction-requirements-20261122/spec.md`、`…plan-20261123/spec.md`、`…code-20261124/spec.md`（127 条 AC 块头的来源）。
- **未决事实**：
  ① 最终交付版本的提交号今天不存在（HEAD `12aaa211`、自基线零提交），表头填实施时实测值；工作树另有两处开工前就存在的未提交改动（`skills/third-review/lib/adapters/codex.mjs`、`skills/third-review/test/adapters-health.test.mjs`），归属由主会话确认。
  ② 两段正文按 spec §5 由本段唯一写，但上游包卡写「交收口方法维护者接受」，两处口径不同：按 spec 写，澄清归 spec owner。
  ③ 任务四有三行声明门没被反引号包住、读不到（`P4:1114`／`P5:920`／`P8:928`），记未取得，不为它新写解析器。
  ④ 任务四报告「78 条、62 通过、14 未归桶」与上游「三条无档位」差一条，逐条对账归包 5，本段不猜编号。
  ⑤ T08 的 §7 月片锚点本身在不在，要有人真读原件后判；本段只记未取得，不断言不存在。
  ⑥ 任务二七包逐包原话在用户手里（OPEN-01），七槽仍是占位。
  ⑦ `p7-replay/` 的落点三处写法不一致：AC-12 判法与 P8 行写 `quality/evidence/p7-replay/`，`spec.md:355` 写 `decision-maker/p7-replay/`，上游包卡写 `acceptance-prior-tasks/`——按 AC 落盘，其余两处记笔误，owner＝spec owner。
  ⑧ `phases/index.md` 已于 2026-11-26 23:37 落盘；本卡「消费者」与它 P8 行逐字一致（「整任务验收者、独立审查角色」），依赖 `P7` 与它一致。`run-checks --material-root` 此前唯一的 error 就来自它的缺失，现在应以 P8 卡的字段与顺序为准复核。
  ⑨ 十行「消费首判原件一次」的 AC，其首判原件今天一律不可读（各 Phase 未落地），本段一律记未取得＋owner＝该 Phase。
  ⑩ 三态表的「已过时」今天 0 条，四条样本的对象都还在；若把「三态齐」严格读成三种状态各出现一次，本段做不到——记口径分歧，请 spec owner 裁一句，不靠造样本过关。
  ⑪ `specs/archive/delivery-quality-plan-20261123` 的十二条声明门嵌 `/Users/Hugh/.dsh/…/node` 绝对路径，今天存在、换机不可比，记「换机重跑＝不可比，不是红也不是绿」。
  ⑫ 材料校验 `validatePostPhaseContract` 对 `spec.md` 有两处形状要求：FR 列表须以 `**FR-nn**` 收尾，需求到任务追踪须逐 `P8/Tnnn` 带 oracle；本任务 spec 的 FR 行把标题写在加粗内、§7 追踪表按 FR 列 P8，两处都对不上，读数会报「unknown FR」与「Trace 缺 P8/Tnnn」。属 spec 侧缺口，owner＝spec owner；本卡不代改 `spec.md`，也不删卡上的 FR／AC 绑定。
  ⑬ 今天 `node tools/cli/run-checks.mjs --material-root=<材料根>` 报 54 条错：53 条来自 `spec.md` 的 FR 列表形状与「需求到任务追踪」缺逐 Task oracle 行，1 条来自索引「P1 起、须 P2..Pn 连续」的解析口径；没有一条落在本卡的字段、节或顺序上。两条都属 spec／索引侧，owner＝spec owner 与索引作者；本段只记读数，不代改。

### 开工就绪表

开发开工前只跑一次这张表；缺项要到写代码时才发现。
五列固定为命令、期望、证据、机器或人判、负责人。

本表命令 cwd 分两处：仓内命令用认证 worktree 根 `/Users/Hugh/Hugh/Project/workflowhub-delivery-quality-acceptance-20261126`；
任务库命令用任务根 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-acceptance-20261126`。

| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |
| --- | --- | --- | --- | --- |
| `git rev-parse --show-toplevel` | 0 | `quality/tests/readiness-p7-git.output` | 机器 | 计划负责人 |
| `git rev-parse HEAD` | 0 | 同上（值写表头；今天实测 `12aaa211f6f4f8f39efa2787ae6ae51282a8743b`） | 机器 | 计划负责人 |
| `node --version` | 0 | `quality/tests/readiness-p7-node.output` | 机器 | 计划负责人 |
| `test -r skills/stage-close/SKILL.md` | 0 | `quality/tests/readiness-p7-inputs.output` | 机器 | 计划负责人 |
| `test -r workflows/build-code/SKILL.md` | 0 | 同上 | 机器 | 计划负责人 |
| `test -d specs/archive/delivery-quality-foundation-20261122` | 0 | 同上 | 机器 | 计划负责人 |
| `test -d specs/archive/delivery-quality-code-20261124` | 0 | 同上 | 机器 | 计划负责人 |
| `shasum -a 256 skills/stage-close/SKILL.md` | 0 | `quality/tests/readiness-p7-sha.output`（改前指纹只作前后对照） | 机器 | 计划负责人 |
| `uname -s` | 0 | `quality/tests/readiness-p7-env.output` | 机器 | 计划负责人 |
| 人工核对 `$HOME` 下 `mktemp -d` 副本可跑、`/tmp` 副本报 `original path alias` | 两句读数一致，副本路径写进三态表备注 | `quality/evidence/p7-replay/checks/ac-p7-copy-root.out` | 人 | 计划负责人 |
| 首卡公开入口：`node tools/cli/check-stage-steps.mjs --stage=build-code --step=<本卡步骤> --card --task-path=<任务根> --material-root=<材料根> --commit=<真实 HEAD>` | 读到 skill 指针与 step_slug；五列由读者在卡上复读 | `quality/tests/readiness-p7-first-card-readback.md` | 人 | 计划负责人 |

首卡公开入口与读回：入口就是上一行这条只读命令，读取位置是投影里的 `skill.file#skill.anchor`，不是去执行 Markdown 正文。
该行今天可能因本任务尚在 build-plan 期而读不到步骤投影；读不到记「未取得＋原因」，不回退成第二套开工项。

## 这一 Phase 怎么验收？

先算三笔账，算完再写条款。

- **成本账**：逐条引 AC-12 的成本七字段（`spec.md:826`：`executor=独立审查角色；estimate_min=60；hard_cap_min=120；resources=四任务规格与报告、最终合并提交、既有门命令；observation=四种结论、三态判词、集成态读数；retry_cap=1；evidence_tier=文档级`）。
  本 Phase 动作估时：生成器与 127 行骨架 10、路径级口径确认 15、内容级必读 46 行 40、三态 4 行与一次破坏 10、集成态 41 行分类与 37 行实跑 15、六条 AC 重跑与 17 行表 20、表自检 10＝**120 活动分钟**。
  120 贴 AC-12 的 `hard_cap_min=120`，超 `estimate_min=60` 一倍，属实记录，不缩深度冒充达标。
- **资源账**：四份收档 `spec.md` 与 `phases/*.md`（仓内，只读，绑提交 OID）；任务库四个任务根的 `quality/tests/`、`quality/evidence/`（非 git，记路径＋sha256＋读取时点）；`runtime/task/delivery-claims.mjs:304` 的 `declaredPhaseGates`（只读调用）；`tools/cli/run-checks.mjs:774` 的 PASS 行形态；`$HOME` 下 `mktemp -d` 副本（就地造，做完删净并记路径）。
  四张表由本段就地新建，来源写在该表表头与任务 1–20。
- **范围账**：验收 1 证 FR-17 前半（逐条结论）；验收 2 证「不许把只查了路径写成真读了内容」这条失败长相；验收 3 证 FR-17 后半（三态与当场破坏）与 T08 缺口点名；验收 4 证 FR-18（集成态与缺件点名）与 6 条最终字节重跑；验收 5 证两处正文的唯一性与既有机器面不被改坏。跨 Phase 只作供件，不写「承接」。

以下字段给人读，只填本 Phase，不写任务存储或新预算账本。

- `acceptance_cost_total=120 active_min`：10＋15＋40＋10＋15＋20＋10；无另计共享准备与重试预留（`retry_cap=1` 的等待不计入活动成本，另在交付说明单列）。
- `phase_budget={soft_min:60,hard_min:120,variance_threshold:未取得,source:AC-12 成本字段}`；`variance_threshold` 无来源，记未取得，owner＝spec owner，不补默认值。
- 估时达硬上限时的降级顺序（不改判据）：先砍验收 2 的 L3 抽核 6 行（46 行必读不砍），再压路径级口径确认 15→12；
  不许砍 127 行结论、46 行必读、三态破坏与集成态判据；仍超则如实记「预算超限＋超在哪」，交主会话，不悄悄缩深度还写「已核」。

本 Phase 无页面、路由、组件或样式改动（写集是两份 `.md` 正文与任务库数据表），UI 六项不适用，理由即此。

判法与通过、失败信号以 `spec.md` Appendix A 的 AC-12 原文为唯一权威；本卡只引用同号 AC、不改写判据。

<!-- markdownlint-disable-next-line MD036 -->
**验收 1：一百二十七条逐条有四值结论**

目标：收口的人只看判词表就能说出每一条承诺今天打得开还是打不开，以及打不开是哪一种。
怎么操作：按「键＝任务根／原文编号」逐条读结论列与备注列，抽四支行按 §2.1 规则重算。
什么条件：最终合并版本的仓内字节（绑 `git rev-parse HEAD`）＋任务库四棵子树；数据是四份收档 `spec.md` 的 127 个 AC 块，不构造、不改前四任务材料。
怎样算通过：每一行结论列只有「原件打得开／只剩缺口／文件在但内容对不上／未取得」之一且非空；去掉任务根能复现 12 组撞号、带上任务根重复为零；一条今天打不开的原件被判「只剩缺口」，一条只是改了名的被判「未取得」并写出候选与指纹，一条只写到目录的被判「未取得」并写出缺文件名，任务一 `AC-MAT-001` 被判「文件在但内容对不上」并写出差异句。
故意弄坏一处：把某行的「未取得」改成「原件打得开」，同一读法必须能据备注（无基准、无命中）指出它错；把目录当命中重算，25 行必须整块移动——读法不动就是判据失效。
真跑还是替代：真跑；命令是任务 1–7 的 gate 命令（见各卡），cwd＝任务根；本卡不预填读数。
谁判与证据：未参与实现的独立审查角色在最终提交后判定；读 `quality/evidence/p7-replay/verdict-table.md` 与 `checks/ac-p7-paths.out`；结论记本卡「完成」与任务 2、8 的证据路径。
失败回修与停止：行数不足、键丢了任务根、结论出现四值之外的词、把改名件或目录写成「打得开」，回 P8 实现者重算并补判；口径本身有争议时停该行，回 spec owner，不改 AC。

<!-- markdownlint-disable-next-line MD036 -->
**验收 2：内容级深度与留痕，不许把只查路径写成已读内容**

目标：读表的人能分清哪几行真读了原件内容、哪几行只查了路径。
怎么操作：按深度列抽读，再核 46 行必读清单每行是否引了原件里的一句原文（≤40 字）。
什么条件：同一批 127 行；46 行＝原档位非 pass 的 44 行＋任务四报告未归桶的 2 行；另从 61 行命中里按「任务×对象类型」抽 6 行。
怎样算通过：深度列只有「内容级（已读）／路径级（内容未核）／未取得（原因）」三值，表头报「内容级 N／路径级 M」且两数相加等于 127；46 行每行备注都引到原件里的一句话；`checks/ac-p7-content-46.out` 有「键｜原件路径｜行位｜摘录」四列。
故意弄坏一处：把一行「路径级（内容未核）」改写成「内容级（已读）」但不引原文，读法必须据缺少摘录判它不合格。
真跑还是替代：真跑；命令同验收 1 的任务 5、6 gate；cwd＝任务根。
谁判与证据：独立审查角色抽 6 行复核（其中至少 2 行来自 46 行之外），读 `checks/ac-p7-content-46.out`。
失败回修与停止：只查路径却写已读、或摘录不是原件原文，回 P8 实现者重读该行；原件今天打不开时该行改记未取得并写 owner，不硬凑摘录。

<!-- markdownlint-disable-next-line MD036 -->
**验收 3：旧判据三态，且「仍适用」被当场打破一次**

目标：计划作者能据这张表决定旧判据能不能照抄。
怎么操作：读三态表的四行判据与三问答案；再读「仍适用」那行的破坏前后读数。
什么条件：「仍适用」样本＝任务一「验收4–8（三处对账同判）」；破坏在任务库外 `$HOME` 下 `mktemp -d` 副本里做，删件相对路径写死为 `quality/tests/2026-11-23-409-p4t-independent-verdict.md`（或同族 `2026-11-23-418-p4t-final-recheck-verdict.md`，二者取一并在表里写清是哪一个），入口 argv 照抄 P6 卡、不改参数，比对对象是 stdout 全字节。
怎样算通过：按四条读法判。第一，值域封闭：三态列的值域恰是「仍适用／已过时／本身有缺陷」，出现第四值（含「未取得」「过期」「有毛病」）即判错；第二，每条有判断：判过的每条旧判据都落三态之一、无空格；第三，至少一条「仍适用」并配破坏读数：破坏后新增行数 ≥1 且每条新增行都含被删件的文件名或相对路径、原有行一条不减、恢复后输出与基线逐字节相同且新增行数回 0；第四，今天已过时 0 条，并在表头写明理由（四条样本的对象今天都还在）、恢复条件与「若把三态齐严格读成三种状态各出现一次，本段记口径分歧、owner＝spec owner」；T08 不在三态表里凑一席，单列缺口行。
故意弄坏一处：只写「重跑仍是绿的」或只写退出码变化，读法必须判它没有破坏证明；把 T08 的「未取得」算进第三态，值域检查必须当场报错。
真跑还是替代：真跑；命令是任务 9 的 gate；副本清理后在三态表写「已清理＋路径」。
谁判与证据：独立审查角色读 `quality/evidence/p7-replay/old-criteria-3state.md` 与副本读数；本 Phase 的破坏只在副本里做，不动交付字节。
失败回修与停止：P6 的逐条状态入口对删件不敏感（前后 diff 0），记「破坏证明未取得＋owner＝P6」并回 P6，不改判已过时凑三态、不拿四条不敏感的面冒充。

<!-- markdownlint-disable-next-line MD036 -->
**验收 4：集成态逐行读数，全部 17 条 AC 有结论**

目标：整任务验收者能指出合并版本上哪一行命令真跑过、绿在哪句话上、哪一行今天跑不了。
怎么操作：读集成态读数表 41 行与 17 行 AC 表；抽三行按原 argv 复跑。
什么条件：41 行＝`declaredPhaseGates` 从四任务 `phases/*.md` 读出的同一集合（今天 7／7／12／15）；argv 与参数逐字照原声明；17 行＝除 AC-12 外的 16 条＋AC-12 自判。
怎样算通过：41 行每行有命令、对象、argv、cwd、最终版本 OID、退出码与「看哪个流的哪条正则」，一行只留一条判据；可执行 37、因缺输入跳过 3、不可执行 1 三个数在表下分类计数里；缺输入的写「因缺输入跳过」并写缺什么、谁补，坏声明写「不可执行：声明含未替换占位符」，读不到的 3 行单列并写行位与 owner；17 行表每行有「首判 Phase／首判原件／本 Phase 动作／本次读数／结论」，6 条重跑行写出 argv、退出码与判据行并说明与首判是否一致，其余 10 行读不到首判时写未取得＋owner。
故意弄坏一处：把一行「因缺输入跳过」改写成「通过」，读法必须据「无退出码、无 argv 执行记录」判它不合格；只写退出码不写判据句，抽读时必须判它无法区分「命令写错了也退一样的码」。
真跑还是替代：真跑 37 行；3 行因缺输入跳过（`grep -L` 那条路径已归档，`run-checks --material-root` 两条的输入今天不在），1 行不可执行（占位符未替换）；cwd 逐行写清。
谁判与证据：独立审查角色读 `integration-readings.md` 与 `all-ac-verdicts.md`，抽 3 行复跑并核 OID。
失败回修与停止：读数与某任务自报不一致，回该任务 owner，P8 只记不一致；临时新造命令、加参数或改退出码求绿，停该行并记失败。

<!-- markdownlint-disable-next-line MD036 -->
**验收 5：两处正文只一处正文，既有机器面不变**

目标：收口者与终末报告作者读到的三态与集成态只有一处正文，另一处是指针。
怎么操作：读 `skills/stage-close/SKILL.md` 第 1 节末两段与 `workflows/build-code/SKILL.md:386` 段末一句；再跑既有契约测试与 `AC-14①` 的 `PARA`。
什么条件：写入前字节（`shasum` 指纹）与插入点 `:24`／`:26` 关系已核；两段各一行、段间一个空行，插入后 `## 2.` 及其后内容整体下移 3 行；`:12` 与节名一字不动。
怎样算通过：六个 token（`本身有缺陷`／`故意打破`／`重跑仍是绿的`／`因缺输入跳过`／`单卡通过不等于集成通过`／`同一批检查`）在 `skills workflows docs` 三树各只有该文件一处，`grep -c` 与 `grep -o … | wc -l` 都是 1；三态三词在该文件各 ≥1 且 `本身有缺陷` 为 1；`workflows/build-code/SKILL.md` 只多一句指针、不含「必须走／必须调用／必须按…走／一律走」与「最多派一次异源」，`AC-14①` 的 `PARA` 比值与 P2 交付值同值；三份 stage-close 契约 18 pass、`four-skill-wiring` 8 pass、markdownlint 退 0 仍成立。
故意弄坏一处：把 `skills/run-phase/SKILL.md` 写进新段落，`stage-closeout-skill` 的依赖集合断言（恰四个）必须当场红；把旧名连写写进去，`stage-close-rename` 必须报 `active` 非空。
真跑还是替代：真跑；命令是任务 16–18 的 gate；cwd＝仓库根。
谁判与证据：独立审查角色读两处实际字节与三条测试输出。
失败回修与停止：写了第五个技能路径、出现旧名连写、`PARA` 掉比值，回 P8 实现者改措辞，不改测试、不放宽断言。

### 档位使用规则

`incomplete` 只用于「本可做但本轮没排上」的验收，用它必须写清下次什么时候做。
`unavailable` 只用于外部条件客观不存在，用它必须写清谁能提供、什么时候能给。
因验收标准设计不合理而长期停在 `incomplete` 或 `unavailable` 的，属于标准缺陷，必须改标准，不许一直挂着。

### 改前基线怎么取得？

本 Phase 的「改前」有两类，都必须是被对比行为首次变更之前的一个交付件，不许写成相对时点。

1. **正文改前字节**：`skills/stage-close/SKILL.md`（203 行、§1 末段 `:24`、下一节 `:26`）与 `workflows/build-code/SKILL.md`（430 行、`:386` 独立段）在写入前的 `shasum` 指纹与段界，落 `quality/tests/readiness-p7-sha.output` 与任务 16 的证据；
2. **旧判据的读数基线**：`run-checks --task-path <本任务>` 在 build-plan 期的既有红（exit 1，首行「收敛清单缺指针」）、`build-skill-manifests --check` 的既有红（exit 1、2 条 `FAIL`）、`phase-contract-prose` 的 3 failed——这三条今天就是红的，修前修后必须同数记录，不冲抵、不当门。
   破坏证明不靠「基线红→非红」，靠新增行是否点名被删件；基线红原样保留。

基线取不到时保留原 AC 与判法，按 `unavailable` 记「基线未取得」与原因，owner 与恢复条件写在对应表头。

### 判定对象怎么与需求对齐？

每条验收的判定对象是最终合并版本的仓内字节（绑 `git rev-parse HEAD`）与任务库四棵子树的实际文件，不是「合并前各任务的判词」。
`p7-replay/` 是任务根相对路径，不是 git 仓库的一部分，只能记路径＋sha256＋读取时点；仓内路径用 `git show <OID>:<path>` 取字节。
降级到副本只用于破坏探针，副本读数不能冒充交付字节的结论；副本必须放 `$HOME` 下（`/tmp` 是 `/private/tmp` 的符号链接，实测报 `original path alias`）。
每条验收的证据落点由独立审查角色实际打开并读回；目录不算原件，打不开记 incomplete 并写 owner。

## 为什么现在做，依据是什么？

前四个任务各自关在自己的提交上，之后每个任务又有提交、合并又是一笔，所以「都验过了」这句话今天没人能兑现。
把 127 条按真实编号重数一遍、给每条一个四值结论，才可能让下一个人不靠记忆判断哪条还站得住；
不在最终字节上跑一遍前四任务自己声明过的检查，单卡绿就会被读成整版绿——这正是 AC-12 失败长相里点名的那件事。

- **结果**：三张表、17 行 AC 表与两处正文在最终版本上可读，每条承诺有四值结论、每条旧判据有三态、每行声明门有读数。
- **非目标**：不新增门、账本、检查器或阶段；不改前四个任务的材料与 T08 的锚；不把只读聚合说成端到端执行。
- **与其它 Phase 的区别**：P2–P7 各自首判并交回原件；本 Phase 只做「合并后还成不成立」这一件事，另重跑 6 条必须在最终字节上重判的 AC。
- **依据**：
  用户答复「选项1，另外技能名改成task-breakdown……」（转引自包 7 卡末；逐字原件 `quality/evidence/talk/2026-11-26-p7-t08-answer.md` 本角色未复算 sha256，owner＝主会话）；
  `decision-log.md:543-569`（包 7 段）与 `spec.md:221`（P8 行）；
  验收原文 `spec.md` Appendix A 的 AC-12（`spec.md:823-826`）；
  `quality/evidence/decision-maker/p7/{card.md,design.md}`（上游包 7 卡与设计）。

## 开始前读什么？

本节只列本 Phase 实际用到的锚点；没列进本表的材料不要凭印象引用。

| 材料或锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md:221`（P8 行）、`:100-101`（FR-17／18）、`:823-826`（AC-12） | 定结果、判法与失败长相，不改写 | 开工前 |
| `spec.md:384-436`（§5 写集）、`:440-471`（§6 依赖图）、`:514-537`（§8 重跑列） | 定写集、依赖与哪 6 条必须在最终字节重跑 | 开工前 |
| `skills/spec-plan/templates/phase-template.md` 全文 | 选节、字段、验收与风险块形状 | 开工前 |
| `phases/P4-计划层三问闭环.md` 与 `phases/P7-问题消失验收.md` | 同类卡的节序、任务卡形状与机器字段写法 | 写卡前 |
| `quality/evidence/build-plan/p7/card.md`（版本 `65c3649e`）、`design.md`、`research.md` | 本 Phase 的方案、读数与逐处落点 | 开工前 |
| `quality/evidence/build-plan/p7/cold-read.md`、`adversarial.md` | 已自判自改的六项与附加项，落点见设计 §15 | 写卡前 |
| `skills/stage-close/SKILL.md:10`、`:12`、`:24`、`:26` | 插入点与一字不改的边界 | 开工前 |
| `workflows/build-code/SKILL.md:338`、`:386` | 已引该技能处与指针句落点（定位字符串 `首判来源与当前适用分开：`） | 开工前 |
| `docs/delivery-closeout-charter.md:11` | 节锚 `#1-核输入与未完成范围` 必须存活 | 写卡前 |
| `tests/contract/stage-closeout-skill.test.mjs`、`stage-close-rename.test.mjs`、`stage-close-pr-contract.test.mjs`、`stage-closeout-step-contract.test.mjs` | 三个硬门：依赖集合恰四个、旧名零 active、子串断言 | 写验收 5 前 |
| `runtime/task/delivery-claims.mjs:232`／`:304` | `DECLARED_GATE` 正则与 `declaredPhaseGates` 导出（41 行的来源） | 写集成态表前 |
| `tools/cli/run-checks.mjs:774` | `[run-checks][material] PASS … errors=0` 的判据句形态 | 写集成态判据前 |
| `specs/archive/delivery-quality-foundation-20261122/spec.md`、`…direction-requirements-20261122/spec.md`、`…plan-20261123/spec.md`、`…code-20261124/spec.md` | 127 个 AC 块头与六列原文（只读） | 开工前与该任务卡 |
| 四任务 `phases/*.md` | `declaredPhaseGates` 的 41 行来源（7／7／12／15） | 写集成态表前 |
| 任务根 `quality/evidence/p7-replay/`（今天不存在） | 三张表、17 行表与 `checks/` 的落点，本段创建 | 开工前 |

## 每个文件由谁改，先做什么？

先说清每个具体路径改什么、由谁持笔、谁消费。

- **新增**：
  任务根 `quality/evidence/p7-replay/` 下的 `verdict-table.md`（判词表）、`old-criteria-3state.md`（三态表＋T08 缺口行）、`integration-readings.md`（集成态读数表）、`all-ac-verdicts.md`（17 行 AC 表）、`gen-table.mjs`（只做抽取，不是检查器）、`checks/ac-p7-*.out` 一批读数。
- **修改**：仓内两个文件，逐条见下表。
- **禁止改动**：下文逐条点名。

本 Phase 只有一个写主（P8 实现者），两份仓内文件与任务库证据按表序串行写，不并行。

| 路径 | 三态 | 本段写什么 | 前写者 → 本段 → 后写者 | 依赖 |
| --- | --- | --- | --- | --- |
| `skills/stage-close/SKILL.md` | MODIFY | 第 1 节末（`:24` 之后、`:26` 之前）两段正文；`:12` 与节名一字不改；插入后后续下移 3 行 | 本段唯一 → 无（spec §5 定 P8 唯一写者） | 无 |
| `workflows/build-code/SKILL.md` | MODIFY | `:386` 段末追加一句指针，原句不改、仍是同一段 | P2（`:208`／`:215`）→ P4（`:178`）→ P6（`:334`）→ P7（`:327`／`:331`／`:334`）→ **本段只写 `:386`** | 前六段已落地（否则行号漂移，用定位字符串） |
| `quality/evidence/p7-replay/verdict-table.md` | NEW（证据） | 127 行 × 11 列判词表与表头四数 | 本段唯一 | 四份收档 spec |
| `quality/evidence/p7-replay/old-criteria-3state.md` | NEW（证据） | 4 行三态表＋T08 单列缺口行＋破坏读数 | 本段唯一 | P6 逐条状态入口 |
| `quality/evidence/p7-replay/integration-readings.md` | NEW（证据） | 41 行读数表＋分类计数＋读不到的 3 行 | 本段唯一 | 四任务 `phases/*.md` |
| `quality/evidence/p7-replay/all-ac-verdicts.md` | NEW（证据） | 17 行 AC 结论表 | 本段唯一 | 各首判 Phase 原件 |
| `quality/evidence/p7-replay/checks/` | NEW（证据） | 表自检、46 行留痕、41 行分类、六 token、不是检查器等读数 | 本段唯一 | 上述四张表 |

### 禁止改动

| 路径 | 为什么不能碰 |
| --- | --- |
| `specs/archive/delivery-quality-foundation-20261122/`、`…direction-requirements-20261122/`、`…plan-20261123/`、`…code-20261124/` 的全部材料与报告 | 本 Phase 只读它们；回改历史判词会让「今天的结论」变成「改过的历史」，`git diff --name-only` 必须 0 行 |
| `workflows/make-decision/steps.json`、`workflows/build-plan/steps.json`、`workflows/build-code/steps.json`、`workflows/build-prd/steps.json` | AC-03① 要求 `git diff --stat 12aaa211` 在这四个路径上为空；本次任务 `steps.json` 不动 |
| `tools/cli/check-stage-steps.mjs`、`runtime/review/stage-materials.json` | 同属 AC-03① 的比对面；本段不新增机器判定 |
| `tools/`、`runtime/`、`tests/`、`workflows/*/SKILL.md`（除 `build-code` 的 `:386`） | 不新增检查器、不改退出码、不加门；生成器只住任务库 |
| `skills/catalog.yaml`、`skills/reuse-registry.md`、`steps.json` 与 `run-checks` 子检查清单 | 生成器与新表不得被登记成能力，否则它们就成了第二个权威 |
| `…/WorkflowHub-交付质量现状调研/模块优化/03-代码域.md` 与父 `prd.md` | T08 的锚点属域 owner，本段只点名缺口，不改锚、不补替代读数 |
| `spec.md`、`decision-log.md`、`phases/index.md`、其它 `phases/*.md` | 本 Phase 的边界是两处正文＋任务库证据；改它们等于改判据与进度权威 |
| 交付树内做破坏 | 破坏只在任务库外的 `$HOME` 副本里做；交付字节与证据目录一律不删不改 |

### 同文件后写者与不冲突锚

- `workflows/build-code/SKILL.md`：P2 写 `:208`／`:215`，P4 写 `:178`，P6 写 `:334`，P7 写 `:327`／`:331`／`:334`，本段只写 `:386` 段末。
  本段是最后一个写者；前六段落地后行号会漂移，所以定位用字符串 `首判来源与当前适用分开：`，不用行号。
- `skills/stage-close/SKILL.md`：本段唯一写者，无后写者；节名与 `:12` 是外部锚（`docs/delivery-closeout-charter.md:11`），不动。
- 任务库 `p7-replay/`：本段唯一写者，其它 Phase 不写；工具与测试不得 import 其中任何文件。

### 写集说明（改了什么、故意没改什么）

- 改了：`skills/stage-close/SKILL.md` 第 1 节末两段；`workflows/build-code/SKILL.md:386` 一句指针；任务库新增 `p7-replay/` 四张表与 `checks/`。
- 故意没改：前四任务材料与报告、`spec.md`、`decision-log.md`、其它 Phase 卡、四个 `steps.json`、`tools/`、`runtime/`、`tests/`、`03-代码域.md`、父 `prd.md`、`skills/catalog.yaml`。理由：本 Phase 的交付是「判定与读数」，不是新机制；改这些会把判词原件变成第二份进度权威。
- 风险与影响面：两处正文会被既有四个契约测试读（依赖集合恰四个、旧名零 active、子串、catalog 三阶段），`AC-14①` 的 `PARA` 比值也会被读；任务库表没有机器 reader，删掉不影响运行时。
- 独立审查按真实 `git diff --name-only` 逐条比对：只应出现两个仓内 `.md`；任务库增件在 git 之外，另按路径与 sha256 核。

`phases/index.md` 已于 2026-11-26 23:37 落盘：它的 P8 行写「`skills/stage-close/SKILL.md`；`workflows/build-code/SKILL.md`」、依赖 `P7`、消费者「整任务验收者、独立审查角色」，与本卡机器字段一致；任务根证据不进仓内写集列。

## 怎么验证？

先说清用什么真实输入和同一判定器判目标 RED 与 GREEN，怎样留下原始证据。
`gate_cmd` 是结构前置，只证明命令能跑、结构能读；它不产出验收结论。

开工前四要素清单：
验收 1 的验证层是文档级逐行判；命令是任务 2、3、4、7、8 的 gate；预期见下；失败条件是四值外出现别的词、空结论或键丢任务根。
验收 2 的验证层是文档级抽读；命令是任务 5、6 的 gate；失败条件是只查路径写成已读、摘录不是原文。
验收 3 的验证层是副本上的破坏对照；命令是任务 9 的 gate；失败条件是只写退出码变化、或拿不敏感的面冒充。
验收 4 的验证层是命令级逐行实跑；命令是任务 11–15 的 gate；失败条件是静默跳过、改 argv、只记退出码。
验收 5 的验证层是字节与既有测试；命令是任务 16–18 的 gate；失败条件是第五个技能路径、旧名连写、`PARA` 掉比值。

默认只跑本 Phase 范围与六条重跑；跳过项写 `unverified` 加原因与影响面并留在分母。
全量重跑只在本 Phase 改动对象就是流程本身且局部无法证明时执行一次，事先说明范围与理由。

设计 oracle 或替身时读 `skills/backend-testing/SKILL.md` 的「行为测试与证伪」与「执行事实」，按其独立预期与失败归属填原 Task。

下表只示范同一判定器的 RED 与 GREEN 形状，不是本 Phase 的完整命令清单；真实命令在各任务卡内逐条写死。
RED 未采集时写 `unavailable — 原因`，取得原件后再引用真实路径。

| 目标 | Task | 角色 | gate_cmd 与预期退出码 | 判据与证据路径 |
| --- | --- | --- | --- | --- |
| 127 条各有一个四值结论 | T127 | RED | `node -e '…verdict-table.md…'`（cwd＝任务根）与 `nonzero` | ORACLE-P8-TABLE-HYGIENE 与 unavailable — 表今天不存在 |
| 同上 | T127 | GREEN | 同命令与 `0` | ORACLE-P8-TABLE-HYGIENE 与 `quality/evidence/p7-replay/checks/ac-p7-table-hygiene.out` |
| 六句只在收口方法一处 | T137 | RED | `node -e '…六 token 各一次…'`（cwd＝仓库根）与 `nonzero` | ORACLE-P8-SIX-TOKENS 与 unavailable — 正文今天未写 |
| 同上 | T137 | GREEN | 同命令与 `0` | ORACLE-P8-SIX-TOKENS 与 `quality/evidence/p7-replay/checks/ac-p7-six-tokens.out` |

覆盖上限：本 Phase 的证据只证「最终字节上每条承诺与每行声明门各是什么读数」，不证前四任务当初的判词正确，也不证未来任务会照这套读法收口。
显式不覆盖：不证 T08 月片锚点存在与否（未读原件）；不证任务二七包承诺的真实答复（未取得）；不证任务四 78 条里哪几条无档位（归包 5 对账）；不证换机可比（12 行嵌绝对 node 路径）；不证四任务材料本身的质量。

失败了怎么办：

- **风险**：口径一松（目录、行位引用、改名同源件算命中）就会让 25 行假绿；破坏探针在不敏感的读数面上做，会得出「破坏已生效」的假结论。
- **影响**：整张表变成「都验过了」的错觉，下一个人据此照抄旧判据，问题被永久埋掉。
- **缓解**：规则前置并写死（基准按前缀绑定、只认普通文件、候选只进备注）；表头同时报 61／18／25／23 与对照组；破坏必须先证读数面对删件敏感，不敏感就换面或记未取得。
- **回滚**：原 writer 只撤回本卡受影响 hunk（两处正文各一段／一句），保留其它改动、原字节指纹与失败原件；基准为 `12aaa211` 与改前 `shasum`。
- **补救与交接**：无法回滚时由 P8 实现者修对应表或正文，所需输入是四份收档 spec 与 P6 的逐条状态入口；修复后由独立审查角色定向复验受影响的验收。
- **触发条件**：同一条目连续两轮判不合格；口径争议需改判据；破坏探针在三个候选面上都 diff 0；副本必须落在 `/tmp` 才能跑。

## 下一消费者拿什么继续？

- **下游**：整任务验收者与独立审查角色取四样。
  第一，`quality/evidence/p7-replay/verdict-table.md` 的 127 行与表头四数；
  第二，`old-criteria-3state.md` 的四行三态、T08 缺口行与破坏前后读数；
  第三，`integration-readings.md` 的 41 行、分类计数与读不到的 3 行；
  第四，`all-ac-verdicts.md` 的 17 行与两处正文的实际字节（`skills/stage-close/SKILL.md` 第 1 节末、`workflows/build-code/SKILL.md:386`）。
  残余/未闭环：T08 月片锚点未核（owner＝用户与代码域 owner）；任务二七包原话未取得（owner＝用户，OPEN-01）；任务四 78 条里未归桶的 2 行归包 5 对账；四行不敏感读数面归 P6；换机不可比 12 行；`phases/index.md` 未落盘（owner＝主会话）。
- 没有可交接的已核事实时写 `N/A — 理由`；本节不适用。

执行建议（只是建议，是否采用由 build-code 定）：阶段内任务顺序、并行与写集互斥按「定序写主」，本 Phase 不另立排期。
任务 1–8 串行（同一张表逐步成型）；任务 9–10 与 11–13 可并行（三态表与集成态表读的是不同原件）；任务 14–15 依赖任务 12 的读数；任务 16–18 只读仓内字节，可与任务 9–15 并行；任务 19–20 收齐全部读数后执行。

## 验收 Phase 才能做的检查

本节是附加检查，只在唯一末 Phase 用；每个 Phase 自己的验收已写在「这一 Phase 怎么验收？」的一条验收里。
复用既有 Phase、Task 与原始证据，不新增 stage、gate、审查点、schema 或校验器。
纯文档任务按 `skills/spec-plan/SKILL.md` 的「Test design and quality」具名豁免，本任务是混合交付（两处正文＋任务库数据表），不在豁免范围。

验收作者与独立判定者先读 `docs/architecture/test-asset-governance-rules.md` 的「验收标准可执行形式（DER-01、DER-11；R-001、FR-16/AC-16）」节的好坏例、同尺、独立判定与匿名不自判要求。
样本与身份回本任务原件，未执行不预填通过。

1. **入口准则**：逐条核对前置 Phase 的 Done、写入集落地与两份就绪件的 status。
   P2：`AC-14①` 四条 `PARA` 的比值必须与 P2 交付值同值（今天 `build-code` 为 NO-PARA，属红，说明 P2 未落地）——读不到就记未取得＋owner＝P2，并把「P2 未落地」写成集成态表的关系列。
   P3：`test -r skills/task-breakdown/SKILL.md`（今天 exit 1）与三处 `grep -n "task-breakdown"`。
   P4：`git diff --stat 12aaa211 -- workflows/build-plan/SKILL.md` 必须非空、四个 `steps.json` 必须为空。
   P5：五夹具五状态与 `run-phase` 八步正文的可读回。
   P6：逐条状态入口（`acCardStatuses` 或 P6 卡点名的入口）与 `facts.ac_status`；**这是本 Phase 破坏探针唯一合法的面**。
   P7：`build-code:327`／`:331`／`:334` 与六句正文位置。
   每条写核对结果与证据路径；读不到记未取得与 owner，不写「大概在」。
2. **两份就绪件**：数据就绪件与环境就绪件各一份，独立成件放 `quality/evidence/p7-replay/`，各写 status。
   数据就绪件 `readiness-data.md`：四份收档 spec 的提交 OID／任务库四棵子树的路径与 sha256、127 个块头的任务根映射、41 行声明门的来源行位、T08 四件事实的定位；status 取 `pass`／`incomplete`／`unavailable`。
   环境就绪件 `readiness-env.md`：`node --version`、`git rev-parse HEAD`、两个 cwd（worktree 根与任务根）、`$HOME` 下 `mktemp -d` 可跑与 `/tmp` 报 `original path alias` 的两句读数、三条 stage-close 契约与 `four-skill-wiring` 可跑；status 同上。
   缺数据写 `incomplete` 或 `unavailable`，不得伪造；本 Phase 只许补数据并标来源档位（仓内绑 OID、任务库绑 sha256）。
3. **授权边界**：目标账号＝无（本 Phase 不触网、不写生产库）；环境＝认证 worktree 与任务库。
   副作用白名单：两处仓内 `.md` 正文、任务库 `p7-replay/` 的表格与 `checks/`、`$HOME` 下一棵一次性副本目录（做完删净并记路径）。
   数量上限：仓内 2 个文件、任务库 4 张表＋1 个生成器＋`checks/` 一批读数、副本 1 棵。
   明确禁止：改前四任务材料与报告、改四个 `steps.json`、改 `tools/`／`runtime/`／`tests/`、改 T08 锚、在交付树或证据目录内做破坏、改动任何退出码。
   授权有效期＝本 Phase 执行期；失败即停条件＝副本只能在 `/tmp` 下跑、或破坏探针在三个候选面上都 diff 0、或任一前序 Phase 未落地导致六条重跑无法执行。
   agent 全自动操作真实环境，不设人工确认、不等用户到场；凭据失效或环境不可达时按停止条件留真实失败。
4. **逐条结论**：每格带证据才算完成；缺证据如实保留缺口，不读成通过。
   每条验收一行，写编号、一个档位、一条具名证据路径；结论行数必须与承接验收条数相等——本 Phase 承接 17 条 AC（AC-12 首判 1 条＋最终字节重跑 6 条＋消费首判 10 条），所以 `all-ac-verdicts.md` 就是 17 行。
   非 `pass` 一律不计通过，不用计数替代逐条；档位只引用 `runtime/evidence/acceptance-evidence-validator.mjs:6` 的 8 值词表。
   读不到首判原件的消费行记 `incomplete` 或 `unavailable` 并写 owner＝该首判 Phase，不写 pass。
5. **五类执行事实**：逐条记命令与参数、cwd 与执行者、exit code 与 signal 与 timeout；再记原始输出落点与机器可读测试报告（runner 与版本）。
   `refs` 各标以下之一：`execution_record`、`machine_report`、`trace`、`screenshot`、`coverage`、`mutation`、`contract_check`、`red_original`、`negative_control`。
   本 Phase 主要用 `execution_record`（41 行读数）、`contract_check`（三条契约测试）、`negative_control`（破坏探针与 `grep -L` 那条）、`red_original`（四条旧判据的修前读数）。
   首次失败、重跑通过时标 `flaky`、档位记 `inconclusive`，不得记 `pass`。
6. **效果评测**：本 Phase 的效果类判据是「一位没参与的人能否据表指出哪一条打不开、哪一条不许再当通过」，指标与统计量如下。
   比较基线＝改动前的四份收档报告原档位与旧提交判词（同一批 127 条）；指标＝四值分布（61／18／25／23／0）、六列两数（114／13）、深度两数（N／M，N≥46）、41 行三分类（37／3／1）、17 行档位分布。
   正例＝任务一 `AC-CLOSE-001`（原件命中，基准＝spec 同目录）；负例＝`AC-DECL-001`（改名候选→未取得）、`AC-QUAL-001`（只到目录→未取得）、`AC-P1-001`（确失→只剩缺口）、`AC-MAT-001`（文件在但内容对不上）。
   先用这五个具名样本证明读法能区分四种结论，再冻结输入与判据；迭代一次只改一处（口径或表结构之一）并重测，保留有可观察收益且未放松原判据的改动，否则撤回该处。
   不增逐次台账；报告 error 与 work 的实际单位与范围，分开样本数、变更数与未测工程成本。
   仅少量重复未见差异不等于稳定；噪声不可估或收益未越出可观察波动则记 `inconclusive`。
   不用环境指纹、产物 digest、哈希或版本相等判定；不用覆盖率或测试数量判通过；不加固定次数下限、数值门或循环账本。
   本仓无 UI 可写（worktree 无 `apps/`、无 `.tsx`／`.vue`／`.jsx`），但代码与接口面不因此免检——本 Phase 改的是技能正文与数据表，接口面是四条契约测试与 `PARA` 比值。
7. **复验四项**：复验者＝未参与实现的独立审查角色（具名 agent 未取得前记「未取得＋owner＝主会话」），修复者＝P8 实现者，两者上下文不同。
   F2P 清单：本 Phase 新增的判据读数（127 行四值、46 行留痕、41 行读数、六 token 唯一性）逐条列；P3P 清单：三条 stage-close 契约、`four-skill-wiring`、markdownlint 逐条列。
   F2P/P3P 用例计数属测试资产治理事实，不作 PRD/plan 验收判据。
   所跑回归范围＝两处正文与任务库表能影响的最小可证伪集合（四条契约＋`PARA`＋markdownlint＋六 token），并说明为何它是最小集；未知影响面写「换机不可比的 12 行」与「P6 入口未预演」。
   三档判分：F2P 为 1 且 P3P 为 1 记 FULL；0＜F2P＜1 且 P3P 为 1 记 PARTIAL；其余记 NO；PARTIAL 不得记 `pass`，分母为 0 不判通过。
   修复者自己的声明不算复验证据。
8. **变更批准**：本 Phase 不改任何既有测试、不断言、不删检查器；「无」＋理由＝本 Phase 只加两处正文与任务库证据，未触碰 `tests/` 与既有断言。
   若实施中确需增删判据读数或改表列，按 `Change Request ID`、`Impact Assessment`、`Approval Status`、`Closure Notes/Verification Status` 登记，批准者非实现者、非同一上下文；改验收等于改承诺，须重新取得确认。
9. **分诊与关闭**：失败先复现；分诊者不是实现者，保留步骤与结果。
   最低字段：`Defect ID`、描述、是否可复现、`Version detected`、`Severity`、`Priority`、`Disposition`（初值 `Pending`）。
   本 Phase 三条预置缺口：破坏探针 diff 0（回 P6）、六条重跑与首判不一致（回该 Phase）、T08 未核（owner＝用户与代码域 owner）。
   终值只取 `Fixed`、`Won'tFix`、`Deferred`、`AcceptedRisk`、`Duplicate`、`NotABug`、`Referred`；不修的值写理由与风险接受人署名；关闭留 `Closed by`、`Date closed`、`Change reference`、`Test reference`、`Closure Notes`。
10. **回写五项**：`spec.md` 场景卡（本 Phase 不改 spec，写「无改动」与理由）、`spec.md` 验收表（同上）、phase 契约的覆盖验收（本卡「覆盖 AC」列）、`facts.jsonl` 既有字段（本 Phase 不写新字段，只由 stage 流程写既有 `phase_progress`）、本次修复记录（落 `quality/evidence/p7-replay/`）。
    每项写哪条 case 改了、为什么、改后判定；缺一项不算闭环。
11. **六项结论**：写在验收 Phase 自己的固定小节（本 Phase 的交付说明与 `all-ac-verdicts.md` 表下），不新增独立验收报告文件类型。
    逐项写评估与局限、与计划的偏差及原因、未充分测试的特性及原因、未解决事件、残留风险、签核对象；每项非空，无则写「无」加理由。
12. **防自证五禁令**：不用授权文本验证授权文本；不删到测试变绿、不改断言消音、不重跑到绿；黄金清单改动由另一主体批准；不用计数代替逐条；不把 `incomplete`、`unavailable`、`missing`、`unverified` 写成 `pass` 或 `succeeded`；判定器必须要求显式通过元素，不用「无失败即通过」。
    本 Phase 的具体落法：四值结论由独立审查角色按规则回放六行重算（不是读表自己声明）；41 行读数由抽 3 行原 argv 复跑核；破坏读数必须有点名新增行，不能只写「重跑仍是绿的」。
13. **失败修复复验闭环**：失败、分诊、根因调研、修复回到原 owner Phase 的 Task、换上下文复验、回写五项。
    本 Phase 的修复去向：表与正文的问题回 P8 实现者；前序字节的问题回该 Phase 写主；T08 与七包承诺属外部 owner，只记缺口。
    降级项 `deferred`、`unavailable`、`incomplete` 同段写风险承接人署名。

验收判定方式标注的唯一权威在 `spec.md` 的 Appendix A，只用三个固定自然语言词（`机器可判`／`只能人读`／`需真实环境，可用自动化采集判`）；本卡只引用原词，不改写、不另写第二份权威。
AC-12 的判定方式是「只能人读」：判定者是实现上下文之外的独立执行单元，按本卡与 AC-12 原文的观察协议复读，不需要用户本人到场。

## 每张任务卡怎么写？

每张卡先按 8 个问题写正文，再写机器字段；正文在机器块之前。
任务编号在全任务内唯一：本段用 T120–T139，连续、不跳号（接 P7 的 T100–T108，中间空号不与其它卡冲突）。

| 人读问题 | 落到哪些既有字段 |
| --- | --- |
| 为什么做 | 来源 / FR / AC |
| 交付什么 | 输出 / 失败 |
| 不做什么 | 边界 / 禁止改动 |
| 前置 | 输入、依赖 |
| 怎么做 | 动作、文件 / 符号 |
| 怎么验收 | 测试层级 / 技能、场景 / 夹具或服务、RED/GREEN 门禁命令、预期退出码、RED 目标失败、GREEN 判定器 |
| 证据 | 证据、覆盖上限 |
| 下游（含何时停） | 停止 / 恢复、完成 |

编号对照：

| 任务 | 编号 | 对应验收 | 依赖 |
| --- | --- | --- | --- |
| 任务 1 | T120 | 验收 1 | 无 |
| 任务 2 | T121 | 验收 1 | 任务 1 |
| 任务 3 | T122 | 验收 1、2 | 任务 1 |
| 任务 4 | T123 | 验收 1 | 任务 1 |
| 任务 5 | T124 | 验收 2 | 任务 2、3 |
| 任务 6 | T125 | 验收 2 | 任务 5 |
| 任务 7 | T126 | 验收 1、2 | 任务 2、3、4 |
| 任务 8 | T127 | 验收 1 | 任务 7 |
| 任务 9 | T128 | 验收 3 | 任务 2 |
| 任务 10 | T129 | 验收 3 | 任务 9 |
| 任务 11 | T130 | 验收 4 | 任务 1 |
| 任务 12 | T131 | 验收 4 | 任务 11 |
| 任务 13 | T132 | 验收 4 | 任务 11、12 |
| 任务 14 | T133 | 验收 4 | 任务 12 |
| 任务 15 | T134 | 验收 4 | 任务 14 |
| 任务 16 | T135 | 验收 5 | 无 |
| 任务 17 | T136 | 验收 5 | 任务 16 |
| 任务 18 | T137 | 验收 5 | 任务 16、17 |
| 任务 19 | T138 | 验收 1、3、4、5 | 任务 7、8、9、13、15、18 |
| 任务 20 | T139 | 验收 4、5 | 任务 8、9、13、14、16、17、18、19 |

二十张卡与 T120–T139 一一对应：任务 7 是表头绑定、任务 8 是表自检，任务 19 是收口读数、任务 20 是交接回写；编号连续、不跳号，且不占用 P7 用过的 T100–T108。

### 任务 1：把四份收档规格的承诺抽成 127 行骨架

为什么做：要在同一张表上逐条判前四个任务的承诺，先把 127 个块头与六列值机械抽出来；对应验收 1。
交付什么：`verdict-table.md` 有 127 个带任务根的键与六列压平后的值，每行 13 格；抽不全或按行切时同一读数立刻掉到 0 行。
不做什么：本卡不判结论、不写备注；不解析原件存在性（属任务 2）；不改前四任务材料。
前置：四份收档 `spec.md` 的当前字节；本目录 `design.md` §3 的分母与六列口径。
怎么做：写 `gen-table.mjs`（只做三件事：抽块头与六列、按字段名＋全角冒号切片、把值内换行替换成一个空格），输出表骨架；`gen-table.mjs` 不进 `tools/`、不被任何门 import。
怎么验收：跑本卡门禁命令从非零变 0；再用「按行切」的负控跑一次必须得 0 行。
证据：骨架表与两次抽取输出进 `checks/ac-p7-skeleton.out`；本卡不证内容真读。
下游（含何时停）：任务 2、3、4、7、11 读这张骨架；若 127 行数对不上或某行 13 格不成立就停，回本卡作者改抽取规则。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T120
- **来源 / FR / AC**：R-010、R-011；FR-17（前置任务逐条结论）前半「在前四任务真实编号上逐条给四种结论之一」；AC-12 判法首句「读那张逐条判词表」；包 7 卡第 1、2 条；逐字来源 `spec.md:823-826`。
- **输入**：四份收档 `specs/archive/delivery-quality-{foundation-20261122,direction-requirements-20261122,plan-20261123,code-20261124}/spec.md`；`design.md` §3 的分母与六列口径；无更早任务。
- **文件 / 符号**：`quality/evidence/p7-replay/gen-table.mjs`（新增，任务库）、`quality/evidence/p7-replay/verdict-table.md`（新增）；符号：`collectAcBlocks`／`sliceColumns`／`flatten`（本文件内私有，不导出给运行时）。
- **动作**：按 `^- [ ] **AC-` 取块头得 12／12／25／78 并与 127 对账；按「字段名＋全角冒号」切六列；把值内换行替换成一个空格（格式压平、不改字）；键写成 `<任务短名>/<原文编号>`，任务短名用 `foundation-20261122`／`direction-requirements-20261122`／`plan-20261123`／`code-20261124`。
- **输出 / 失败**：表骨架 127 行、每行 13 格、键带任务根；块头数不等于 127、某行断行、或键丢任务根时命令非零并打印差在哪。
- **边界 / 禁止改动**：不改四份收档 `spec.md` 与 `phases/*.md`；不把生成器放进 `tools/`、`runtime/`、`tests/`、`skills/`；不写结论列与备注列。
- **依赖**：无
- **测试层级 / 技能**：文档级／数据抽取；`skills/spec-plan` 的材料写作与 `skills/backend-testing` 的「执行事实」。
- **场景 / 夹具或服务**：正例＝四份真实 spec；负例＝同一脚本改用「按行切」得 0 行（今天实测 0/127）；临时脚本放任务库，不建可删临时目录。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/verdict-table.md","utf8");const n=t.split(/\n/).filter(l=>/^\| *(?:foundation-20261122|direction-requirements-20261122|plan-20261123|code-20261124)\//.test(l)).length;process.exit(n===127?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-TABLE-127；改动前 `verdict-table.md` 不存在，同一命令读文件即抛错、目标断言未到达而退出非零；归因是表未建，不是环境失败。
- **GREEN 判定器**：ORACLE-P8-TABLE-127；同一命令退出 0，且「按行切」负控得 0 行、块头数 12／12／25／78 与 127 对账一致。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-skeleton.out`
- **覆盖上限**：只证分母与六列可机械抽，不证结论正确、不证原件存在、不证内容被读过。
- **停止 / 恢复**：块头数与 127 不一致时停，回本卡作者查是否把正文引用的编号算进块头（今天全文去重会得 131／16 组，是错误口径）；仍不一致交 spec owner。
- **完成**：前置（不作完成条件）：四份 spec 可读、脚本可跑、两次抽取输出留原件。完成条件（只写效果）：127 行骨架带任务根与 13 格，按行切负控得 0 行，块头三段数与 127 对账一致。

### 任务 2：按前缀绑定基准给每条一个路径级结论

为什么做：材料说「有原件」不算数，要按一条可复核的规则判今天打不打得开；对应验收 1。
交付什么：结论列只有四值之一，备注写清命中的基准与相对路径、候选件路径与 sha256、「声明只到目录」或缺件试过的三处；把目录算命中会让 25 行整块移动。
不做什么：不改前四任务材料与报告；不把行位引用、键值对、命令当路径 token；不做内容级复核（属任务 5）。
前置：任务 1 交回的 127 行骨架；`design.md` §2.1 的取 token、绑基准、四支与三条件。
怎么做：取「承接」与「证据」两字段的反引号 token，剔除命令、占位符、行位引用与键值对；按前缀绑唯一基准（`quality/…` 只认任务库根，仓内前缀只认仓库根，裸名与 `phases/…` 只认 AC 所在 spec 同目录）；命中必须是普通文件，目录记未取得并写缺文件名；无命中但有同源改名候选时记未取得并写候选与指纹，候选三条件写死（同任务 `quality/` 子树、主干 ≥10 字符、单向子串）。
怎么验收：跑本卡门禁命令从非零变 0；再按五支行逐行重算一遍。
证据：五支读数与备注列进 `checks/ac-p7-paths.out`；本卡不证内容对不对。
下游（含何时停）：任务 5、6、7、8 读这张结论列；口径出现「目录也算命中」时停，把两组分布同时写进表头。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T121
- **来源 / FR / AC**：R-010、R-011；FR-17 前半「在前四任务真实编号上逐条给四种结论之一」；AC-12 判法首句与通过条件「一条今天打不开的原件被判缺件」；包 7 卡第 2、3 条；逐字来源 `spec.md:824-826`。
- **输入**：任务 1 的 127 行骨架；`design.md` §2.1；四份收档 spec 与四任务 `quality/` 树（只读）。
- **文件 / 符号**：`quality/evidence/p7-replay/verdict-table.md` 的结论列与备注列；N/A — 数据表无符号；只读锚点 `skills/spec-plan/templates/phase-template.md` 的「怎么验证？」节。
- **动作**：按 §2.1 四步做：取路径形状 token、按前缀绑唯一基准、按四支定结论、把基准／候选 sha256／仅目录／非路径引用写进备注；候选永不改结论。
- **输出 / 失败**：127 行各有四值之一与备注；把目录、改名件写成「原件打得开」或漏写候选指纹时，验收 1 判不合格。
- **边界 / 禁止改动**：不改四份 spec 与四任务 `quality/` 下的任何文件；不为「读不到」新写解析器捞 token；不把候选件成结论。
- **依赖**：T120
- **测试层级 / 技能**：文档级逐行判定；`skills/backend-testing` 的「行为测试与证伪」用于反例设计。
- **场景 / 夹具或服务**：五支行各一例——任务一 `AC-CLOSE-001`（spec 同目录命中）、任务一 `AC-DECL-001`（改名候选）、任务三 `AC-QUAL-001`（只到目录）、任务四 `AC-P1-001`（确失）、无路径行（今天 0 行，只给判法不造样本）；副本与候选只读。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/verdict-table.md","utf8");const v=new Set(t.split(/\n/).filter(l=>/^\| *(?:foundation|direction-requirements|plan|code)-/.test(l)).map(l=>l.split("|")[3].trim()));const want=["原件打得开","只剩缺口","文件在但内容对不上","未取得"];process.exit([...v].every(x=>want.includes(x))&&["候选","只到目录","三处"].every(k=>t.includes(k))?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-PATH-RULES；改动前结论列全空、备注无候选与目录字样，同一命令因目标断言失败而退出非零；归因是四支判定未做。
- **GREEN 判定器**：ORACLE-P8-PATH-RULES；同一命令退出 0，且四支各有具名行、备注含基准与指纹、目录行写明缺文件名、无路径行给判法（今天 0 行，如实记）。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-paths.out`
- **覆盖上限**：只证路径级打不打得开，不证内容对不对（属任务 5）；不证候选件就是原档位。
- **停止 / 恢复**：口径出现「目录也算命中」的读数时停，把两种分布同时写进表头并回审查复核；基准前缀写错导致任务库文件被判成仓库文件时，按 `grep -n` 重定位，不改结论。
- **完成**：前置（不作完成条件）：token 抽取与四支判定可重放，四支各留一行读数。完成条件（只写效果）：127 行结论列只四值、无空格，四支各有具名行与备注，目录与改名件都不判「打得开」。

### 任务 3：把六列压平到每行 13 格并如实记 13 行缺列

为什么做：六列回读只有 114 行成立，缺格若被补写或留空，「六列齐」会被读成「都有实质值」；对应验收 1、2。
交付什么：表体每行恰好 13 格、断行 0；13 行缺格写「未取得（原材料无此字段）」；表头同时报「六列齐 114 行／含未取得格 13 行」。
不做什么：不从别处补写字段值、不写成「不适用」、不动原文字；不改前四任务材料。
前置：任务 1 的骨架；`design.md` §3 的压平规则与两处实测（35 行／68 个值含换行，另一读法 30／63）。
怎么做：把值内换行替换成一个空格（格式压平、不改字），逐行核 `NF=13`；缺列按任务二 12 行（缺「环境与数据」「承接」）与任务四 `AC-P9-005`（缺「通过」）填未取得格；表头写压平规则原句与两组数。
怎么验收：跑门禁命令从非零变 0；再抽三行核对原文与压平值只差换行。
证据：自检读数与两组计数进 `checks/ac-p7-columns.out`；本卡不证六列值正确。
下游（含何时停）：任务 5、7、8 读压平后的表；出现断行或补写值时停，回本卡。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T122
- **来源 / FR / AC**：R-010、R-011；AC-12「每条承诺的结论列都填着四种结论之一，没有空格子」与六列回读；FR-17；包 7 卡第 4 条；逐字来源 `design.md` §3 的压平规则。
- **输入**：任务 1 的骨架与原值；`design.md` §3 的 35 行／68 值实测。
- **文件 / 符号**：`quality/evidence/p7-replay/verdict-table.md` 表体；N/A — 格式压平，无符号。
- **动作**：把值内换行替换成一个空格、逐行核 NF=13、13 行缺格填「未取得（原材料无此字段）」、表头写规则原句与两数。
- **输出 / 失败**：每行 13 格、断行 0、13 行未取得格；出现断行、把缺格留空或补写值时命令非零。
- **边界 / 禁止改动**：不改六列原文的字符，只替换换行；不把 13 行缺格写成「不适用」；不删缺列行。
- **依赖**：T120
- **测试层级 / 技能**：文档级格式自检；`skills/spec-plan` 的材料写作。
- **场景 / 夹具或服务**：正例＝压平后的表；负例＝保留原换行的一行（会让 `NF≠13`）与把缺格补成别处值的一行；都在副本上试，不碰交付字节。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/verdict-table.md","utf8");const rows=t.split(/\n/).filter(l=>/^\| *(?:foundation|direction-requirements|plan|code)-/.test(l));const bad=rows.filter(l=>l.split("|").length!==15).length;const miss=rows.filter(l=>l.includes("未取得（原材料无此字段）")).length;process.exit(rows.length===127&&bad===0&&miss===13?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-COLUMNS-114；改动前表内仍含原始换行，13 格与断行的目标断言不成立、命令因断言失败退出非零；归因是压平未做。
- **GREEN 判定器**：ORACLE-P8-COLUMNS-114；同一命令退出 0，且表头两数相加等于 127、压平规则原句在位，`checks/ac-p7-columns.out` 有断行 0 的读数。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-columns.out`
- **覆盖上限**：只证非空与格数，不证六列值正确，也不证压平没丢信息（读法见任务 5）。
- **停止 / 恢复**：某行 `NF≠13` 且找不到断行来源时停，回本卡作者逐格比对原文；若原文本身在字段值里含 `|`，转义后仍不合规时在表头声明该行并交审查，不擅自删字符。
- **完成**：前置（不作完成条件）：自检命令可跑、原文与压平结果各留一份读数。完成条件（只写效果）：127 行 13 格、断行 0、13 行未取得格如实标注，表头两数相加为 127。

### 任务 4：给键加任务根，复现 12 组撞号

为什么做：四份规格里有 12 组同名不同义的编号，键不带任务根就会把两条合并成一条；对应验收 1。
交付什么：键 = `<任务根>/<原文编号>`；去掉任务根能复现 12 组重复（正控），带上任务根重复为零；12 行备注统一写「同名异义：另一处是 `code-20261124/<编号>`」。
不做什么：不把两行合并、不改原文编号、不重命名任何 AC。
前置：任务 1 的 127 行骨架。
怎么做：按 `grep -ohE` 逐任务取编号并合并去重，得 127 与 12 组；在 12 行备注列写同名异义说明（含另一处的任务根与一句语义差异，如任务二 `AC-P7-001` 是「最终交接逐包引用首判、负控和覆盖限制」，任务四 `AC-P7-001` 是「`stage-handoff` 与 `stage-close` 各一处复盘段」）。
怎么验收：跑门禁命令从非零变 0；再核 12 组编号与设计列出的完全一致。
证据：两条计数读数进 `checks/ac-p7-collisions.out`；本卡不证同名两条语义判得对。
下游（含何时停）：任务 7、8、14 用这张表的键；去根重复不等于 12 时停，先核分母。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T123
- **来源 / FR / AC**：R-010、R-011；FR-17「真实编号」；AC-12 通过条件（逐条结论、没有空格子）；包 7 卡第 4 条；来源 `research.md` §1.2 的 131／16 组反例。
- **输入**：任务 1 的骨架；设计 §3 的 12 组清单。
- **文件 / 符号**：`quality/evidence/p7-replay/verdict-table.md` 键列与备注列；N/A — 无符号。
- **动作**：键写成「任务根／原文编号」；12 行备注写「同名异义：另一处是 <任务根>/<编号>」与一句语义差异；不合并两行。
- **输出 / 失败**：去根 12 组、带根 0 组、12 行备注；键缺任务根或两行被合并时命令非零。
- **边界 / 禁止改动**：不改四份 spec 的编号；不新增编号；不把撞号写成「重复项删除」。
- **依赖**：T120
- **测试层级 / 技能**：文档级计数；`skills/backend-testing` 的负控写法。
- **场景 / 夹具或服务**：正控＝去任务根后的重复组数必须恰 12；负控＝键不带任务根时重复行应出现且被计数；只用只读文本比对。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/verdict-table.md","utf8");const keys=t.split(/\n/).filter(l=>/^\| *(?:foundation|direction-requirements|plan|code)-/.test(l)).map(l=>l.split("|")[2].trim());const bare=keys.map(k=>k.replace(/^[a-z0-9-]+\//,""));const dup=a=>a.length-new Set(a).size;process.exit(keys.length===127&&dup(keys)===0&&dup(bare)===12?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-KEY-12-COLLISIONS；改动前键不带任务根，去根重复为 0、带根重复不为 0，同一命令因目标断言失败而退出非零；归因是键未加任务根。
- **GREEN 判定器**：ORACLE-P8-KEY-12-COLLISIONS；同一命令退出 0，12 组编号与设计列出的完全一致，12 行备注各写出另一处的任务根与语义差异。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-collisions.out`
- **覆盖上限**：只证键唯一与撞号复现，不证同名两条的语义判得对（由备注逐行读）。
- **停止 / 恢复**：去根重复不等于 12 时停，先核分母是否 127（131／16 组是全文去重的错误口径）；仍不符交 spec owner。
- **完成**：前置（不作完成条件）：两条计数命令可跑并留输出。完成条件（只写效果）：127 行带根键、带根重复 0、去根重复 12，12 行备注写明同名异义。

### 任务 5：真读 46 行原件内容并留一句原文

为什么做：只查路径会把 61 行「命中」读成「内容也对」，AC-12 的失败长相点的就是这件事；对应验收 2。
交付什么：46 行（原档位非 pass 的 44 行＋任务四未归桶的 2 行）逐行真读，备注各引原件里一句原文（≤40 字）；`checks/ac-p7-content-46.out` 有「键｜原件路径｜行位｜摘录」四列；任务一 `AC-MAT-001` 判「文件在但内容对不上」并写差异句。
不做什么：不把没读的行写成已读；不猜任务四哪 2 行无档位（归包 5 对账）；不改原件。
前置：任务 2 的路径级结论（命中与未取得两类）；`design.md` §3 的 L2 与 §4.5 的 B6 兜底。
怎么做：按原档位非 pass 取 44 行、按报告差额取 2 行；逐行打开原件读第一屏与结论行，写一句判词与一句原文摘录；命中件是旁证件、红侧捕获或对象不同即升级为「文件在但内容对不上」。
怎么验收：跑门禁命令从非零变 0；再抽 3 行核摘录确实是原件里的句子。
证据：46 行四列清单进 `checks/ac-p7-content-46.out`；本卡不证其余 81 行内容。
下游（含何时停）：任务 6、8、19 读深度列与清单；原件打不开时该行改未取得并写 owner。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T124
- **来源 / FR / AC**：R-010、R-011；FR-17 失败长相「把只查了路径写成真读了内容」；AC-12 通过条件「文件在但内容对不上判得出来」；包 7 卡第 6 条。
- **输入**：任务 2 的结论列；`design.md` §3 的 L2 与 §4.5 的 B6 兜底；四任务原件（只读）。
- **文件 / 符号**：`quality/evidence/p7-replay/verdict-table.md` 备注列与深度列、`checks/ac-p7-content-46.out`；N/A — 无符号。
- **动作**：取 44 行非 pass 与 2 行未归桶，逐行读第一屏与结论行，写一句判词与一句 ≤40 字原文；旁证件／红侧捕获／对象不同即升级为内容不符。
- **输出 / 失败**：46 行有内容级判词与摘录，深度列写「内容级（已读）」；摘录不是原件原文、或只写「已核」时验收 2 判不合格。
- **边界 / 禁止改动**：不改原件与前四任务报告；不补造任务四缺失的 2 行编号；不把「读不到」写成「读过」。
- **依赖**：T121、T122
- **测试层级 / 技能**：文档级逐行阅读；`skills/backend-testing` 的「执行事实」用于记录阅读位置。
- **场景 / 夹具或服务**：必判样本＝任务一 `AC-MAT-001`；升级样本＝命中「开工对象分配」件而声明件不存在；其余 44 行按任务分组读；只读原件，不建副本。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/verdict-table.md","utf8");const n=(t.match(/内容级（已读）/g)||[]).length;const c=fs.readFileSync("quality/evidence/p7-replay/checks/ac-p7-content-46.out","utf8");const rows=c.split(/\n/).filter(l=>l.split("|").length>=5).length;process.exit(n>=46&&rows>=46&&c.includes("AC-MAT-001")?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-CONTENT-46；改动前无内容级判词与留痕清单，同一命令读文件失败退出非零；归因是内容级未做。
- **GREEN 判定器**：ORACLE-P8-CONTENT-46；同一命令退出 0，46 行摘录都是原件原文，`AC-MAT-001` 有差异句，若内容不符仅此 1 行则表头写「1 行；其余 45 行判词见清单」。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-content-46.out`
- **覆盖上限**：只证 46 行读过，不证其余 81 行内容也对（深度列如实写路径级）；不证任务四 2 行的编号选择正确（归包 5）。
- **停止 / 恢复**：原件今天打不开时该行记未取得＋owner＝该任务材料作者，不硬凑摘录；若 46 行读下来内容不符为 0，必须写「46 行全核过、零不符」并由独立读者抽 3 行复核。
- **完成**：前置（不作完成条件）：46 行清单与摘录可读、命令可跑。完成条件（只写效果）：46 行各引一句原件原文，`AC-MAT-001` 判内容对不上，深度计数进入表头。

### 任务 6：从命中行里抽 6 行做分层抽核，并把深度两数报清

为什么做：46 行必读只覆盖非 pass 与未归桶，命中行仍可能内容不符；抽核用来证伪「路径在 ⇒ 内容对」；对应验收 2。
交付什么：从 61 行命中里按「任务×对象类型」抽 6 行真读；深度列只有三值；表头报「内容级 N／路径级 M」且 N＋M=127。
不做什么：不把抽核当全量；不因抽核通过就把其余 55 行写成已读；不改结论列。
前置：任务 5 的 46 行判词与深度三值口径。
怎么做：按四个任务×对象类型（文档、命令输出、判定件、门捕获）分层抽 6 行；读法同任务 5；深度列只三种值，未取得行写原因。
怎么验收：跑门禁命令从非零变 0；再核 6 行样本键可指认、分层至少各 1。
证据：样本键与两数进 `checks/ac-p7-depth.out`；不证抽样代表性。
下游（含何时停）：任务 8、19 读深度两数；样本不足时表头写「分层样本不足」与 owner。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T125
- **来源 / FR / AC**：R-010、R-011；AC-12 失败长相（把只查了路径写成真读了内容）；FR-17；包 7 卡第 6 条；来源 `design.md` §3 的 L3。
- **输入**：任务 5 的 46 行清单与深度三值；61 行命中清单。
- **文件 / 符号**：`quality/evidence/p7-replay/verdict-table.md` 深度列、`checks/ac-p7-depth.out`；N/A — 无符号。
- **动作**：按「任务×对象类型」抽 6 行，读法同任务 5；深度列只三种值；表头写「内容级 N／路径级 M」。
- **输出 / 失败**：6 行有判词与摘录，深度两数相加为 127；把抽核写成全量、或深度列出现第三种以外的值（如「部分」）时验收 2 判不合格。
- **边界 / 禁止改动**：不超抽、不换样本凑结论；不改 46 行清单；不动原件。
- **依赖**：T124
- **测试层级 / 技能**：文档级抽样；`skills/spec-plan` 的分层抽样口径。
- **场景 / 夹具或服务**：6 行样本键写进 `checks/ac-p7-depth.out`；每层至少 1 行；只读原件。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/verdict-table.md","utf8");const d=t.split(/\n/).filter(l=>/内容级（已读）|路径级（内容未核）|未取得（原因）/.test(l)).length;const m=t.match(/内容级\s*(\d+)\s*\/\s*路径级\s*(\d+)/);process.exit(d>=127&&m&&Number(m[1])+Number(m[2])===127?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-DEPTH-LAYERS；改动前深度列与两数未写，同一命令因目标断言失败而退出非零；归因是分层未做。
- **GREEN 判定器**：ORACLE-P8-DEPTH-LAYERS；同一命令退出 0，6 行样本可指认、深度值域封闭、两数相加 127，抽核结论与 46 行判词不矛盾。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-depth.out`
- **覆盖上限**：只证 6 行抽核，不证其余命中行内容正确；不证抽样代表性。
- **停止 / 恢复**：抽核发现内容不符时，把该行升级并回任务 5 补同类检查；样本无法分层时停并在表头写「分层样本不足」与 owner。
- **完成**：前置（不作完成条件）：深度列与表头两数可读。完成条件（只写效果）：6 行抽核有判词与摘录，深度值域封闭，表头两数相加 127。

### 任务 7：把表头绑到提交与时点，并报四个数

为什么做：一张不绑提交的判词表，明天换个人读就成了「旧提交的判词」；对应验收 1。
交付什么：表头写「读取提交｜读取时点｜工作树」三件；同时报路径级四数（61／18／25／23）与对照组一句（目录算命中则 25 行移动）。
不做什么：不把「未取得」的提交号编一个；不把工作树的脏文件算成读取依据（只报事实）；不改逐行结论。
前置：任务 2、3、4 的结论列、格数与键。
怎么做：取值 `git rev-parse HEAD` 的 40 位与读取时点（`YYYY-MM-DDTHH:MM+08:00`）、`git status --porcelain` 的条数；三件写表头下一行（不改列数，保持每行 13 格）；四数与对照组写在同一表头。
怎么验收：跑门禁命令从非零变 0；再核 OID 与当前 `git rev-parse HEAD` 完全一致。
证据：表头读数进 `checks/ac-p7-header.out`；不证读取后字节未变。
下游（含何时停）：任务 8、19 与三态表、集成态表读同一提交；OID 不一致时停，重读全部行。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T126
- **来源 / FR / AC**：R-010、R-011；AC-12 失败长相「拿合并前判词或旧提交当交付版本」；FR-17；包 7 卡第 11 条；来源 `design.md` §4 的表头要求。
- **输入**：任务 2、3、4 的结论列与键；`git rev-parse HEAD` 与 `git status --porcelain`。
- **文件 / 符号**：`quality/evidence/p7-replay/verdict-table.md` 表头；N/A — 无符号。
- **动作**：写「读取提交｜读取时点｜工作树」三件与路径级四数、对照组一句；不改列数，保持每行 13 格。
- **输出 / 失败**：表头三件与四数在位；提交号与逐行读数不是同一次读取、或四数与逐行计数不符时验收 1 判不合格。
- **边界 / 禁止改动**：不改四份 spec；不写工作树脏文件的归属结论（owner＝主会话）；不改逐行结论。
- **依赖**：T121、T122、T123
- **测试层级 / 技能**：文档级；`skills/spec-plan` 的材料写作与 AC-12 失败长相「拿旧提交当交付版本」。
- **场景 / 夹具或服务**：正例＝实施时实测 OID；负例＝手工填一个短号（与 40 位不一致）；只读 `git` 与文件。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/verdict-table.md","utf8");const h=t.split(/\n/).slice(0,12).join("\n");const oid=h.match(/读取提交[：:]\s*([0-9a-f]{40})/);const nums=["61","18","25","23"].every(n=>h.includes(n));process.exit(oid&&nums&&/读取时点/.test(h)&&/工作树/.test(h)&&/若把目录算作打得开/.test(h)?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-HEADER-BINDING；改动前表头无提交、时点与四数，同一命令因目标断言失败而退出非零；归因是绑定未做。
- **GREEN 判定器**：ORACLE-P8-HEADER-BINDING；同一命令退出 0，OID 与 `git rev-parse HEAD` 完全一致，四数与逐行计数一致，对照组句在位。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-header.out`
- **覆盖上限**：只证表头与一次读取对齐，不证读取之后字节未变；不证脏文件归属。
- **停止 / 恢复**：OID 与当前 HEAD 不一致时停，重读表内全部行再填；工作树有未提交改动时照实记条数，不据此改结论。
- **完成**：前置（不作完成条件）：`git rev-parse` 与 `git status` 可跑并留输出。完成条件（只写效果）：表头三件与四数在位、OID 与当前 HEAD 同值、四数与逐行计数一致。

### 任务 8：把判词表自检成可复算的读数

为什么做：表填满了不等于可判；行数、四值、空格、动作和与反代签必须能被一条命令重算；对应验收 1。
交付什么：七条自检读数落 `checks/ac-p7-table-hygiene.out`：127 数据行、每行 13 格、结论只四值、空结论 0、动作三值和 127、`T08` 可搜到、四个代签词零命中。
不做什么：不新增检查器；不把自检写成 `tools/` 里的命令；不改结论凑读数。
前置：任务 7 的表头与逐行结论。
怎么做：按 `design.md` §4.5 的九条 `awk`／`grep` 写成一次性命令，输出逐条落盘；每条写「读数＋期望＋实际」。
怎么验收：跑门禁命令从非零变 0；再跑三条负控（改结论、删行、写代签词）确认都被抓。
证据：七条自检读数进 `checks/ac-p7-table-hygiene.out`；不证结论判断正确。
下游（含何时停）：任务 19 用这张读数判 Done；四值外出现词时停，回任务 2。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T127
- **来源 / FR / AC**：R-010、R-011；AC-12 通过条件「每条承诺的结论列都填着四种结论之一，没有空格子」与防自证禁令第 12 项；FR-17；包 7 卡第 12 条。
- **输入**：任务 7 的表头与逐行结论。
- **文件 / 符号**：`quality/evidence/p7-replay/verdict-table.md`、`checks/ac-p7-table-hygiene.out`；N/A — 无符号。
- **动作**：按 `design.md` §4.5 九条写成一次性只读命令，逐条落「期望／实际」；命令不进 `tools/`、不被任何门读。
- **输出 / 失败**：七条读数齐；任一条不符（结论出现「通过」、空结论、动作和不等于 127、代签词命中）即命令非零。
- **边界 / 禁止改动**：自检命令只落 `checks/`，不进 `tools/`、不被 `run-checks` 或测试引用；不改表内数据求绿。
- **依赖**：T126
- **测试层级 / 技能**：文档级自检；`skills/spec-plan` 的材料自检与 `skills/backend-testing` 的负控。
- **场景 / 夹具或服务**：正例＝成表；负例＝在副本上把一行结论改成「通过」、删一行使动作和变 126、写入一个代签词，三条都必须被抓到。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/verdict-table.md","utf8");const rows=t.split(/\n/).filter(l=>/^\| *(?:foundation|direction-requirements|plan|code)-/.test(l));const v=new Set(rows.map(l=>l.split("|")[3].trim()));const empty=rows.filter(l=>!l.split("|")[3].trim()).length;const acts=rows.map(l=>l.split("|")[4].trim());process.exit(rows.length===127&&v.size===4&&empty===0&&acts.every(a=>["路径级","内容级","破坏"].includes(a))&&!/(已确认|已批准|视为接受|默认接受)/.test(t)?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-TABLE-HYGIENE；改动前自检未跑、读数文件不存在，同一命令读文件失败退出非零；归因是自检未做。
- **GREEN 判定器**：ORACLE-P8-TABLE-HYGIENE；同一命令退出 0，七条读数在记录里齐备，三条负控都被抓到。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-table-hygiene.out`
- **覆盖上限**：只证表形状与四值封闭，不证结论判断正确（由任务 2、5、6 的行级判词负责）。
- **停止 / 恢复**：结论出现四值外的词时停，回任务 2 改该行；若需改判据才能过，停该路径交 spec owner，不删行凑数。
- **完成**：前置（不作完成条件）：七条自检命令可跑并逐条留读数。完成条件（只写效果）：127 行、13 格、四值封闭、空结论 0、动作和 127、代签词零命中，三条负控都被抓到。

### 任务 9：给四条旧判据判三态，并当场打破「仍适用」那条

为什么做：旧判据能不能照抄没人判过；判「仍适用」的必须当场打破一次，才不是自说自话；对应验收 3。
交付什么：`old-criteria-3state.md` 四行判据，三态列只用三个词；第 4 行（任务一「验收4–8」）有「删件前后多出一句点名、原有行不减、恢复后逐字节相同」的前后读数。
不做什么：不把 T08 放进三态表凑一席；不用「过期／有毛病」凑三态；不把「重跑仍是绿的」当证明。
前置：任务 2 的结论列（取旧判据对象）；P6 的逐条状态入口已落地（argv 照抄 P6 卡）。
怎么做：四条样本按设计 §4.2 写——任务四 `AC-P1-006`、任务三 `AC-QUAL-016`、任务二 `task-close` 三码被拒三条判「本身有缺陷」，任务一「验收4–8」判「仍适用」；破坏在 `$HOME` 下 `mktemp -d` 副本里删 `quality/tests/2026-11-23-409-p4t-independent-verdict.md`（或同族 `…418-p4t-final-recheck-verdict.md`，二选一并在表里写清），先取基线输出，再比对新增行是否点名该件、原有行是否不减、恢复后是否逐字节相同。
怎么验收：跑门禁命令从非零变 0；再核「仍适用」行有新增点名行、原有行不减、恢复后逐字节相同。
证据：破坏前后读数与清理记录进 `checks/ac-p7-3state-break.out`；不证其余旧判据。
下游（含何时停）：任务 10、19 读这张表；探针 diff 0 时记未取得并回 P6。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T128
- **来源 / FR / AC**：R-010、R-011；FR-17「判『仍适用』的当场做一次人为破坏」；AC-12 通过条件「旧判据三态齐且仍适用有破坏后变红的记录」；包 7 卡第 7、8 条；来源 `design.md` §2.4／§4.2。
- **输入**：任务 2 的结论列；P6 逐条状态入口 argv（照抄 P6 卡）；`$HOME` 下 `mktemp -d` 副本。
- **文件 / 符号**：`quality/evidence/p7-replay/old-criteria-3state.md`、`checks/ac-p7-3state-break.out`；N/A — 数据表无符号。
- **动作**：四行判据按设计写三态与三问答案；在副本删 `quality/tests/2026-11-23-409-p4t-independent-verdict.md`（或同族 418，写明取一），取基线、比对点名与行数、恢复后逐字节比。
- **输出 / 失败**：四行判据有三问答案与判据要点，「仍适用」行有前后读数与清理记录；三态值域出现第四值、或只写退出码变化时命令非零。
- **边界 / 禁止改动**：破坏只在任务库外副本里做、做完删净；不改前四任务材料与 T08 锚；不改 P6 的入口参数。
- **依赖**：T121
- **测试层级 / 技能**：文档级＋命令级对照；`skills/backend-testing` 的「行为测试与证伪」与 `skills/spec-plan` 的三态口径。
- **场景 / 夹具或服务**：副本放 `$HOME` 下 `mktemp -d`（`/tmp` 实测报 `original path alias`）；样本＝任务一「验收4–8」；负例＝在同一批数据上只改退出码的「假破坏」；做完 `rm -rf` 副本并在表里记「已清理＋路径」。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/old-criteria-3state.md","utf8");const states=["仍适用","已过时","本身有缺陷"];const rows=t.split(/\n/).filter(l=>/^\| *[0-9]+ *\|/.test(l));const used=new Set(rows.map(l=>l.split("|")[3].trim()));process.exit(rows.length===4&&[...used].every(s=>states.includes(s))&&used.size>=2&&/新增行/.test(t)&&/逐字节相同/.test(t)&&/已清理/.test(t)?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-3STATE-BREAK；改动前表不存在、无前后读数，同一命令因目标断言失败而退出非零；归因是三态与破坏未做。
- **GREEN 判定器**：ORACLE-P8-3STATE-BREAK；同一命令退出 0，三态值域封闭、四条各有判断、「仍适用」行有前后读数与清理记录，破坏读数是点名行增删而非仅退出码。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-3state-break.out`
- **覆盖上限**：只证四条旧判据与一次破坏，不证其余旧判据（未列入本表的不判）；不证「三态各出现一次」。
- **停止 / 恢复**：探针 diff 0 时记「破坏证明未取得＋owner＝P6」并回 P6，不改判「已过时」凑三态；副本落在 `/tmp` 时报错即停，换 `$HOME` 重来。
- **完成**：前置（不作完成条件）：副本可建、P6 入口 argv 可照抄、清理记录可写。完成条件（只写效果）：四条旧判据各落三态之一、值域封闭、「仍适用」有破坏前后读数与清理记录，已过时 0 条理由写在表头。

### 任务 10：把 T08 写成单列缺口行，不改锚

为什么做：T08 不是一个「能不能照抄」的判据，而是一条缺口；塞进三态表会占掉一席、让「未取得」冒充第三态；对应验收 3。
交付什么：三态表下方独立段「缺口行：T08 域级读数」，写四件可核事实＋未取得＋owner＋恢复条件，并写明同源另一条锚不是 §7 月片锚。
不做什么：不写「已改锚」「§7 不存在」「补做一次回放即可」；不改 `03-代码域.md`、父 `prd.md` 与前四任务材料；不补替代读数。
前置：任务 8 的三态表（缺口行排在表下，不占表行）。
怎么做：按设计 §7 四件事实逐条写定位（域卡 `03-代码域.md:132`／`:136`／`:144`；父 `prd.md:682-731` 八小节无此条、只在 `:1413` 变更记录出现；任务四 `spec.md` 的 `T08` 0 命中、`:20` 自述「六节」；同源另一条锚已被 `direction-review.md:107`／`:153` 判失效，要写明那不是 §7 月片锚）；结论写未取得并写 owner 与恢复条件。
怎么验收：跑门禁命令从非零变 0；再核四件事实各带行位、禁止语零命中。
证据：`grep -n "T08"` 的命中与四件事实进 `checks/ac-p7-t08.out`；不断言锚存在与否。
下游（含何时停）：任务 19 与终末报告作者读这行；有人声称锚已改时停，回用户与代码域 owner。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T129
- **来源 / FR / AC**：R-010、R-011；FR-18「T08 域级读数缺失点名」；AC-12 通过条件「T08 域级读数缺失被点名」；包 7 卡第 9 条；来源 `design.md` §7。
- **输入**：域卡 `03-代码域.md:132`／`:136`／`:144`、父 `prd.md:682-731`／`:1413`、任务四 `spec.md:20`（只读）。
- **文件 / 符号**：`quality/evidence/p7-replay/old-criteria-3state.md` 缺口行、`checks/ac-p7-t08.out`；N/A — 无符号。
- **动作**：写四件事实与「未取得＋owner＋恢复条件」，写明同源另一条锚不是 §7 月片锚；不改锚、不补替代读数。
- **输出 / 失败**：四件事实、未取得、owner、恢复条件齐；出现禁止语、或把该行算进三态计数时命令非零。
- **边界 / 禁止改动**：不改 T08 锚与父 PRD；不改域卡；不把「未核」写成「不存在」。
- **依赖**：T128
- **测试层级 / 技能**：文档级；`skills/spec-plan` 的缺口写法与 AC-12「T08 域级读数缺失被点名」。
- **场景 / 夹具或服务**：正例＝四件事实各带行位；负例＝只写「T08 未取得」一行（缺四件事实）与写入「已改锚」一句；只读原件。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/old-criteria-3state.md","utf8");const ok=["03-代码域.md","682-731","1413","T08","未取得","owner"].every(k=>t.includes(k))&&/不是 §7 月片锚|不是§7 月片锚/.test(t)&&!/(已改锚|§7 不存在|补做一次回放即可)/.test(t);process.exit(ok?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-T08-GAP；改动前缺口行不存在，同一命令读文件与关键字均失败退出非零；归因是缺口行未写。
- **GREEN 判定器**：ORACLE-P8-T08-GAP；同一命令退出 0，四件事实各带行位、未取得与 owner 与恢复条件齐、无禁止语、该行不计入三态。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-t08.out`
- **覆盖上限**：只证缺口被点名并写清谁能补，不断言锚点存在或不存在；不证 T08 原件内容。
- **停止 / 恢复**：有人声称 T08 锚已改或不存在时停，回用户与代码域 owner；本段不改锚、不补读数。
- **完成**：前置（不作完成条件）：四件事实的行位可读、`grep -n "T08"` 能在回放目录命中。完成条件（只写效果）：缺口行四件事实齐、未取得与 owner 与恢复条件齐、无禁止语、三态计数不变。

### 任务 11：把 41 行声明门逐行写死 argv 与判据

为什么做：「前四任务自己声明过的检查」今天有三套能自证的口径，不点名一套就无法判；对应验收 4。
交付什么：`integration-readings.md` 41 行，每行有命令、对象、argv（逐字）、cwd、最终版本 OID、退出码、判据（流＋正则）、实际输出关键行、与前四任务自报读数关系、备注；分类计数 16／13／5／1／1／5。
不做什么：不选五条 CLI 或任务四手列 18 行；不并写两套判据；不把读不到的 3 行混进 41 行计数。
前置：`runtime/task/delivery-claims.mjs:304` 的 `declaredPhaseGates` 可读；四任务 `phases/*.md` 今天给出 7／7／12／15。
怎么做：用同一函数遍历四任务得 41 行，按 argv 形态分五类（vitest 16、`node --test` 13、其它 node 脚本 5、`grep -c` 1、`grep -L` 1、`run-checks` 5）；每行只写一条判据——退出码 ∈ 期望且指定流匹配指定正则（`Test Files`／`ℹ fail 0`／`^ok:`（脚本终句以 ok: 开头）／四个数 ≥1／stdout 为空／JSON 可解析且 stderr 不含 `usage:`／`[run-checks][material] PASS` 且 `errors=0`）。
怎么验收：跑门禁命令从非零变 0；再核 41 行各只有一条判据、argv 逐字。
证据：41 行与分类计数进 `checks/ac-p7-integration-41.out`；不证命令跑过。
下游（含何时停）：任务 12、13 与任务 15 读这 41 行；函数读不到声明门时停，不改解析器。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T130
- **来源 / FR / AC**：R-010、R-011；FR-18「在最终版本上跑前四任务自己声明过的检查」；AC-12 通过条件「只跑前四任务自己声明过的命令」；包 7 卡第 10 条；来源 `design.md` §2.2。
- **输入**：`runtime/task/delivery-claims.mjs:304` 的 `declaredPhaseGates`；四任务 `phases/*.md`（7／7／12／15）。
- **文件 / 符号**：`quality/evidence/p7-replay/integration-readings.md`、`checks/ac-p7-integration-41.out`；符号：`declaredPhaseGates`（只读调用，`runtime/task/delivery-claims.mjs:304`）。
- **动作**：用同一函数列 41 行，按 argv 分五类，每行写 argv、cwd、OID、退出码与一条「流＋正则」判据；3 行读不到的单列在外。
- **输出 / 失败**：41 行各有 argv 与一条判据、分类计数相加为 41；并写两套判据、把 `<任务根>` 占位符行当可执行、或漏掉 3 行读不到时命令非零。
- **边界 / 禁止改动**：不改四任务 `phases/*.md` 的声明门原文；不改 argv 与参数；不改任何退出码。
- **依赖**：T120
- **测试层级 / 技能**：文档级＋命令级；`skills/backend-testing` 的「执行事实」与 `skills/spec-plan` 的集成态写法。
- **场景 / 夹具或服务**：正例＝41 行全部列出；负例＝把 `run-checks` 非法 argv 的退出码 0 当绿（今天实测 stderr 有 `unsupported arguments`）、把 `grep -c` 零命中的退出 1 当真红；只读。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/integration-readings.md","utf8");const rows=t.split(/\n/).filter(l=>/^\| *(?:c[1-5]|vitest|node --test|run-checks|grep)/.test(l));const cnt=[16,13,5,1,1,5].every(n=>t.includes(String(n)));process.exit(rows.length>=41&&cnt&&/stdout|stderr/.test(t)&&/退出码/.test(t)?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-INTEGRATION-41；改动前表不存在，同一命令读文件失败退出非零；归因是集成态表未建。
- **GREEN 判定器**：ORACLE-P8-INTEGRATION-41；同一命令退出 0，41 行各一条判据与逐字 argv，计数 16／13／5／1／1／5 相加为 41，3 行读不到单列在外。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-integration-41.out`
- **覆盖上限**：只证清单与判据写死，不证命令跑过（属任务 12）；不证声明门本身正确。
- **停止 / 恢复**：函数读不到某任务的声明门时停，先核该任务 `phases/*.md` 是否被前序既改；不改解析器去捞无背引号的行，只记读不到。
- **完成**：前置（不作完成条件）：`declaredPhaseGates` 可读、41 行可列。完成条件（只写效果）：41 行各有逐字 argv 与一条流＋正则判据，分类计数相加 41，读不到的 3 行单列。

### 任务 12：逐行实跑 37 行并读关键行

为什么做：只看退出码会让「命令写错了」也看起来是绿的；对应验收 4。
交付什么：41 行各有退出码与实际输出关键行；可执行 37 行实跑，3 行因缺输入跳过、1 行不可执行；每行判据句逐字入表。
不做什么：不静默跳过、不改 argv、不加参数、不换退出码；不把「因缺输入跳过」写成「通过」。
前置：任务 11 的 41 行 argv 与判据。
怎么做：按表逐行跑（cwd 逐行记）；vitest 类看 stdout `Test Files` 与 `passed`；`node --test` 看 stdout `ℹ fail 0`（无 TAP 的 `# fail 0`）；`validate-card` 看首行 `^ok:`（脚本终句以 ok: 开头）；`run-checks --task-path` 看 stdout 是否 JSON 可解析且 stderr 不含 `usage:`；`--material-root` 看 stdout 含 `[run-checks][material] PASS` 与同行 `errors=0`；`grep -L` 那条因路径已归档记「因缺输入跳过」；`run-checks` 占位符那条记「不可执行：声明含未替换占位符」。
怎么验收：跑门禁命令从非零变 0；再抽 3 行按原 argv 复跑核判据句。
证据：逐行 exit 与关键行进 `checks/ac-p7-integration-run.out`；不证换机可比。
下游（含何时停）：任务 13、14、15 与终末报告读这些读数；某行与自报不一致时回该任务。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T131
- **来源 / FR / AC**：R-010、R-011；FR-18「缺输入写因缺输入跳过」；AC-12 通过条件「集成态写出缺输入与不一致」；包 7 卡第 10 条；来源 `research.md` §1.8 的两个假绿陷阱。
- **输入**：任务 11 的 41 行 argv；`tools/cli/run-checks.mjs:774` 的 PASS 行形态。
- **文件 / 符号**：`quality/evidence/p7-replay/integration-readings.md` 读数列、`checks/ac-p7-integration-run.out`；N/A — 无符号。
- **动作**：逐行跑 37 行（cwd 逐行记），按五类看指定流与正则；3 行缺输入写「因缺输入跳过」＋缺什么＋谁补；1 行占位符写「不可执行」。
- **输出 / 失败**：37 行有 exit 与关键行，3 行跳过与 1 行不可执行各有具名理由；静默跳过或改写 argv 时命令非零。
- **边界 / 禁止改动**：不为跑绿而改声明门原文；不改 `tools/`／`runtime/`；既有红（`build-skill-manifests` 等）原样保留、不冲抵。
- **依赖**：T130
- **测试层级 / 技能**：命令级；`skills/backend-testing` 的「执行事实」。
- **场景 / 夹具或服务**：正例＝37 行原 argv；负例＝把 `run-checks` 非法 argv 当绿、把 `grep -c` 零命中当红；临时输出落 `checks/`，不建其它目录。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/integration-readings.md","utf8");const ran=(t.match(/exit\s*[=:：]\s*\d+/g)||[]).length;process.exit(ran>=37&&/因缺输入跳过/.test(t)&&/不可执行：声明含未替换占位符/.test(t)&&/既有红/.test(t)?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-INTEGRATION-RUN；改动前无退出码与关键行，同一命令读文件失败退出非零；归因是实跑未做。
- **GREEN 判定器**：ORACLE-P8-INTEGRATION-RUN；同一命令退出 0，37 行有 exit 与判据句命中，3 行跳过与 1 行不可执行具名，既有红与各任务自报绿并排记录。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-integration-run.out`
- **覆盖上限**：只证 37 行本次读数，不证这些门覆盖全量风险；不证换机可比（12 行绝对 node 路径）。
- **停止 / 恢复**：某行读数与任务自报不一致时，回该任务 owner 并只记不一致；命令因环境缺失跑不动时记未取得＋owner，不换命令代跑。
- **完成**：前置（不作完成条件）：41 行 argv 可执行或具名不可执行、输出可落盘。完成条件（只写效果）：37 行有真实退出码与判据句，3 行缺输入与 1 行不可执行具名，既有红原样保留。

### 任务 13：把读不到、跳过与不可执行三类分开登记

为什么做：三类缺口混写就会把「声明本身坏了」记成「缺输入」，或把「解析器读不到」记成「没有这条门」；对应验收 4。
交付什么：三段登记——因缺输入跳过（缺什么、谁补）、不可执行（声明含未替换占位符）、读不到＝未取得（行位＋owner）；3 行无背引号的声明门（`P4:1114`／`P5:920`／`P8:928`）单列，不混进 41 行。
不做什么：不为读不到的行新写解析器；不把 3 行并进 41 行计数；不把占位符行写成缺输入。
前置：任务 11、12 的 41 行与读数。
怎么做：逐行判三类落哪一类并写理由与 owner；读不到的三行写行位与「任务四材料作者（历史只读）」；表下三段各写计数。
怎么验收：跑门禁命令从非零变 0；再核三类不混、3 行读不到的计数与 41 分开。
证据：三段登记进 `checks/ac-p7-gaps.out`；不证缺口能补上。
下游（含何时停）：任务 19 与终末报告读这三段；某行同时像两类时按「缺输入→不可执行→读不到」顺序判一次。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T132
- **来源 / FR / AC**：R-010、R-011；FR-18「缺输入写因缺输入跳过」与「T08 域级读数缺失点名」；AC-12 通过条件；包 7 卡第 10 条。
- **输入**：任务 11、12 的 41 行与读数；三行无背引号声明门（`P4:1114`／`P5:920`／`P8:928`）。
- **文件 / 符号**：`quality/evidence/p7-replay/integration-readings.md` 表下三段、`checks/ac-p7-gaps.out`；N/A — 无符号。
- **动作**：三类各写具名行、理由与 owner；读不到的三行写行位与「任务四材料作者（历史只读）」，不并进 41 行。
- **输出 / 失败**：三段各有具名行与 owner；把占位符行写成缺输入、或把读不到的行算进 41 时命令非零。
- **边界 / 禁止改动**：不改四任务 `phases/*.md`（历史只读）；不新写解析器；不改 41 行 argv。
- **依赖**：T130、T131
- **测试层级 / 技能**：文档级；`skills/spec-plan` 的缺口三类分工。
- **场景 / 夹具或服务**：三类各一具名例（`grep -L` 归档路径、`run-checks` 占位符、三行无背引号）；只读。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/integration-readings.md","utf8");const ok=["因缺输入跳过","不可执行","读不到","P4:1114","P5:920","P8:928"].every(k=>t.includes(k))&&/owner/.test(t);process.exit(ok?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-UNREADABLE-3；改动前三类登记不存在，同一命令因目标断言失败而退出非零；归因是缺口未分。
- **GREEN 判定器**：ORACLE-P8-UNREADABLE-3；同一命令退出 0，三类各有具名行与 owner，三行读不到的计数与 41 行分开，占位符行没有写成缺输入。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-gaps.out`
- **覆盖上限**：只证缺口分得清，不证缺的行能被补上；不证任务四材料作者的可用性。
- **停止 / 恢复**：某行同时像两类时停，按「输入不存在→缺输入；声明坏→不可执行；解析器读不到→未取得」的顺序判一次并写明依据；仍分歧交 spec owner。
- **完成**：前置（不作完成条件）：三类登记可读、行位可核。完成条件（只写效果）：三类各有具名行与 owner，3 行读不到单列且计数不与 41 行混。

### 任务 14：把 17 条 AC 写成一张结论表

为什么做：整任务验收需要一处能看到全部 17 条 AC 在最终字节上的结论；对应验收 4。
交付什么：`all-ac-verdicts.md` 17 行，列 `AC｜首判 Phase｜首判原件｜本 Phase 动作｜本次读数（argv/exit/关键行）｜结论｜备注`；10 行消费只写「首判说什么＋原件在哪」，读不到写未取得＋owner。
不做什么：不重判首判结论；不用推断补读不到的原件；不把 AC-12 自判算进「16 条」凑数。
前置：任务 12 的集成态读数（重跑行用）；其余 10 行读各首判 Phase 的原件。
怎么做：按 `design.md` §5 的表逐行落：AC-03／04／06／13／14／15 标「最终字节重跑」，AC-01／02／05／07／08／09／10／11／16／17 标「消费一次」，AC-12 标「自判」；每行写首判原件路径或未取得＋owner。
怎么验收：跑门禁命令从非零变 0；再核 17 条各一行、结论列非空。
证据：17 行与未取得清单进 `checks/ac-p7-all-ac.out`；不证首判结论正确。
下游（含何时停）：任务 15 与整任务验收者读这张表；某原件不存在时照实写未取得。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T133
- **来源 / FR / AC**：R-010、R-011；Phase 表 P8 行写『全部 17 条 AC』，本卡按同一批 17 条判，AC-12 原文见 `spec.md` Appendix A（无『16 条』字样，Phase 表与 AC-12 是两处）；FR-17／18；spec §8 的重跑列（`spec.md:514-537`）；包 7 卡第 1 条。
- **输入**：任务 12 的读数；各首判 Phase 的原件（P1／P2／P4／P5／P6／P7）。
- **文件 / 符号**：`quality/evidence/p7-replay/all-ac-verdicts.md`、`checks/ac-p7-all-ac.out`；N/A — 无符号。
- **动作**：17 行按 `design.md` §5 落：6 行标重跑、10 行标消费、AC-12 标自判；每行写首判原件或未取得＋owner。
- **输出 / 失败**：17 行各有结论列；读不到的原件写成「通过」、或 AC-12 行缺席时命令非零。
- **边界 / 禁止改动**：不改各 Phase 原件与 `spec.md` 的 AC 原文；不新增 AC 编号。
- **依赖**：T131
- **测试层级 / 技能**：文档级；`skills/spec-plan` 的全 AC 收口写法。
- **场景 / 夹具或服务**：正例＝17 行齐；负例＝只写 6 条重跑、或把 `incomplete` 写成 `pass`；只读原件。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/all-ac-verdicts.md","utf8");const rows=new Set((t.match(/AC-(?:0[1-9]|1[0-7])\b/g)||[]));process.exit(rows.size>=17&&/未取得/.test(t)&&/owner/.test(t)&&/首判/.test(t)?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-ALL-AC-17；改动前表不存在，同一命令读文件失败退出非零；归因是 17 行表未建。
- **GREEN 判定器**：ORACLE-P8-ALL-AC-17；同一命令退出 0，17 条各一行、结论列非空、读不到的带未取得与 owner、AC-12 行标自判。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-all-ac.out`
- **覆盖上限**：只证 17 条有结论与来源指针，不证首判结论正确；不证读不到的原件存在。
- **停止 / 恢复**：某首判原件不存在时照实写未取得＋owner＝该 Phase，不写「大概通过」；若某 AC 编号在 `spec.md` 改动后变化，停并回 spec owner。
- **完成**：前置（不作完成条件）：17 条编号可核、首判原件路径可写或可判未取得。完成条件（只写效果）：17 行各有结论与来源指针，10 行消费不重判，AC-12 行自判且不计入 16 条。

### 任务 15：在最终字节上重跑 6 条 AC

为什么做：这 6 条的结论随字节变（P2–P8 都改过它们的判定对象），必须在本 Phase 重判；对应验收 4。
交付什么：AC-03／04／06／13／14／15 各有本次 argv、退出码、判据行与「与首判是否一致」；不一致时回该 Phase、不改判据。
不做什么：不改任何 AC 的判据与期望值；不用推断补跑不了的读数；不把「重跑仍是绿的」当唯一结论。
前置：任务 14 的 17 行表；各条命令分别来自 AC-03／13／14／15 原文与 P5／P6 卡。
怎么做：AC-03 跑 `BASE=12aaa211` 两条 `git diff --stat`（①空、②非空）；AC-13 跑 `test -r skills/task-breakdown/SKILL.md` 与三处 `grep -n "task-breakdown"`；AC-14 跑四条内联 `PARA` 与旧出口 grep、`node --test tests/contract/four-skill-wiring.test.mjs`；AC-15 跑六条读数；AC-06 跑逐条状态入口并核三处同结论；AC-04 读 `run-phase` 八步与任务四 13 段点名。
怎么验收：跑门禁命令从非零变 0；再核 6 行各有一致性判断。
证据：6 条读数进 `checks/ac-p7-rerun-6.out`；不证其余 10 条首判。
下游（含何时停）：任务 19 与整任务验收者读这 6 行；读数不一致时回该 Phase。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T134
- **来源 / FR / AC**：R-010、R-011；AC-03／04／06／13／14／15 原文与 spec §8「末 Phase 是否重跑＝是」；FR-17；包 7 卡第 1 条。
- **输入**：任务 14 的 17 行表；各条命令原文与各 Phase 卡上的目标断言。
- **文件 / 符号**：`all-ac-verdicts.md` 的读数列、`checks/ac-p7-rerun-6.out`；N/A — 无符号。
- **动作**：逐条跑：AC-03 两条 `git diff --stat 12aaa211`、AC-13 `test -r` 与三处 grep、AC-14 四条 `PARA` 与旧出口 grep 与 `four-skill-wiring`、AC-15 六条读数、AC-06 逐条状态三处同结论、AC-04 八步与 13 段点名。
- **输出 / 失败**：6 行各有读数与一致性判断；把读不到写成通过、或改了判据时命令非零。
- **边界 / 禁止改动**：不改 `tests/`、不改 AC 判据、不改四个 `steps.json`；既有红同数保留。
- **依赖**：T133
- **测试层级 / 技能**：命令级＋文档级；`skills/backend-testing` 的「执行事实」。
- **场景 / 夹具或服务**：正例＝当前字节实跑；负例＝把 `PARA=NO-PARA`（今天 `build-code`、`build-plan` 都是）写成合格；只读。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/all-ac-verdicts.md","utf8");const need=["AC-03","AC-04","AC-06","AC-13","AC-14","AC-15"];const ok=need.every(a=>new RegExp(a+"[^\\n]*(重跑|argv|exit)").test(t))&&/PARA/.test(t)&&/git diff/.test(t);process.exit(ok?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-RERUN-6；改动前 6 条无本次读数，同一命令读文件失败退出非零；归因是重跑未做。
- **GREEN 判定器**：ORACLE-P8-RERUN-6；同一命令退出 0，6 条各有 argv、退出码、判据行与一致性判断，读数与首判不一致的行写明回哪个 Phase。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-rerun-6.out`
- **覆盖上限**：只证这 6 条本次读数，不证其余 10 条首判；不证换机可比。
- **停止 / 恢复**：命令跑不动（缺输入、路径已归档）时记未取得＋原因＋owner，不换命令代跑；读数与首判不一致时回该 Phase，交由它修复后由原判定者重报。
- **完成**：前置（不作完成条件）：六条命令可跑或可判不可执行、输出可落盘。完成条件（只写效果）：6 条各有本次读数与一致性判断，不一致回该 Phase，未跑记未取得与 owner。

### 任务 16：在收口方法第 1 节末写两段正文

为什么做：三态三问与集成态今天在仓里没有一处正文，收口的人无从照做；对应验收 5。
交付什么：`skills/stage-close/SKILL.md` 第 1 节末（`:24` 之后、`:26` 之前）多出两段，每段一整行、段间一个空行；插入后 `## 2.` 及其后内容整体下移 3 行；`:12` 与节名一字不动。
不做什么：不写第五个技能路径（`stage-closeout-skill` 的依赖集合恰四个）、不写旧名连写、不改 `:12`、不改节名与八个步骤锚。
前置：`skills/stage-close/SKILL.md` 改前字节（203 行）与 `design.md` §6 F1 的逐字拟文。
怎么做：在 `:24` 段后插段一（三态三问＋故意打破：三条结论词、必须当场打破一次、只写「重跑仍是绿的」不算、读数不敏感也不许当证明、其余两种只点名缺口写 owner）；再插段二（集成态一行：合并后在最终交付版本上跑前四任务自己声明过的同一批检查、argv 逐字照原声明、写清命令与对象与 cwd 与提交号与退出码与判据行、缺输入写「因缺输入跳过」、单卡通过不等于集成通过、既有红原样保留不冲抵）。
怎么验收：跑门禁命令从非零变 0；再核 `## 2.` 行号＝原行号＋3、三条契约 18 pass。
证据：两段原文与测试输出进 `checks/ac-p7-stage-close.out`；不证收口者会照做。
下游（含何时停）：任务 17、18 与终末报告读这两段；依赖集合或旧名测试红时停，改措辞不改测试。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T135
- **来源 / FR / AC**：R-010、R-011；FR-17「旧判据三态」与 FR-18「集成态」；AC-12；包 7 卡第 10、11 条；来源 `design.md` §6 F1。
- **输入**：`skills/stage-close/SKILL.md:24`／`:26` 与改前指纹；`design.md` §6 的逐字拟文。
- **文件 / 符号**：`skills/stage-close/SKILL.md` 第 1 节末；N/A — 技能正文，无代码符号；只读锚点 `:10`／`:12`。
- **动作**：在 `:24` 后插两段（各一行、段间一个空行）：段一三态三问＋当场打破，段二集成态一行；不改 `:12`、节名与锚。
- **输出 / 失败**：两段在位、六 token 各一次、下移 3 行；写了第五个技能路径或旧名连写、或改成「重跑仍绿即可」时验收 5 判不合格。
- **边界 / 禁止改动**：不改节名、`:12` 原句、`:10` 标题与第八节以后内容；不新建锚（`grep -c '<a id'` 保持 0）。
- **依赖**：无
- **测试层级 / 技能**：文档级＋契约测试；`skills/spec-plan` 的材料写作与 `skills/norm-sync` 的原文同步判据。
- **场景 / 夹具或服务**：正例＝两段新文本；负例＝在副本里把 `skills/run-phase/SKILL.md` 写进段落（触发依赖集合断言）与写入旧名连写（触发 `active` 非空）；副本只用于负控。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("skills/stage-close/SKILL.md","utf8");const tok=["本身有缺陷","故意打破","重跑仍是绿的","因缺输入跳过","单卡通过不等于集成通过","同一批检查"];const once=tok.every(x=>t.split(x).length-1===1);const bad=/skills\/(?:run-phase|spec-plan|task-breakdown)\/SKILL\.md/.test(t)||/stage-closeout/.test(t);process.exit(once&&!bad&&/旧判据/.test(t)?0:1)'`（cwd＝仓库根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-STAGE-CLOSE-PROSE；改动前六 token 各 0，同一命令因目标断言失败而退出非零；归因是正文未写。
- **GREEN 判定器**：ORACLE-P8-STAGE-CLOSE-PROSE；同一命令退出 0，两段各一行且段间一空行、`## 2.` 行号＝原行号＋3、三份 stage-close 契约仍 18 pass、markdownlint 退 0。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-stage-close.out`
- **覆盖上限**：只证两段在位数与不破既有断言，不证收口者会照做；不证其它技能的同类正文。
- **停止 / 恢复**：依赖集合或旧名测试红时停，回本卡作者改措辞（不改测试、不放宽断言）；行号漂移时按 `grep -n` 重定位，不改节名。
- **完成**：前置（不作完成条件）：改前字节与指纹已留、插入点可定位。完成条件（只写效果）：两段在位、六 token 各一次、下移 3 行、`:12` 与节名未动、三条契约仍绿。

### 任务 17：在终末方法旁加一句指针，不复制正文

为什么做：终末第 8 段讲「首判来源与当前适用分开」，需要一句指向三态与集成态的唯一正文；对应验收 5。
交付什么：`workflows/build-code/SKILL.md` 的 `:386` 段末多一句「旧判据三态与集成态读数见 `skills/stage-close/SKILL.md` 第 1 节；本段不复述。」，原句不改、仍是同一段。
不做什么：不复制正文、不含「必须走／必须调用／必须按…走／一律走」、不含「最多派一次异源」；不改 `:338` 已引该技能处。
前置：任务 16 的两段正文已落地（指针指向它）；`:386` 段用定位字符串 `首判来源与当前适用分开：` 定位，不用行号（P2／P4／P6／P7 都改过本文件）。
怎么做：在该段末追加一句，保留段界（`:385`／`:387` 仍为空行）；追加后重跑 `AC-14①` 的四条 `PARA`，比值必须与 P2 交付值同值。
怎么验收：跑门禁命令从非零变 0；再重跑 `AC-14①` 四条 `PARA` 核比值不变。
证据：指针句与 PARA 输出进 `checks/ac-p7-pointer.out`；不证收口者会去读正文。
下游（含何时停）：任务 18 与终末报告读这句；比值变化时停，改措辞。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T136
- **来源 / FR / AC**：R-010、R-011；FR-18；AC-12；包 7 卡第 11 条；来源 `design.md` §6 F2。
- **输入**：任务 16 的两段正文；`workflows/build-code/SKILL.md` 的定位字符串 `首判来源与当前适用分开：`。
- **文件 / 符号**：`workflows/build-code/SKILL.md:386` 段末；N/A — 技能正文，无代码符号；只读锚点 `:338`。
- **动作**：段末追加一句「旧判据三态与集成态读数见 `skills/stage-close/SKILL.md` 第 1 节；本段不复述。」，原句与段界不动。
- **输出 / 失败**：指针句一次、段界不变、`PARA` 比值不变；出现四个禁词或该句被复制进 `stage-close` 以外的技能时验收 5 判不合格。
- **边界 / 禁止改动**：不改 `:386` 原句、不改 `:338`、不改其它技能正文；不把三态正文复制过来。
- **依赖**：T135
- **测试层级 / 技能**：文档级＋内联命令；`skills/spec-plan` 的指针化写法。
- **场景 / 夹具或服务**：正例＝一句指针；负例＝在副本里写「必须走」使 `PARA` 变成 `n/(n+1)`、写「最多派一次异源」使 AC-15② 变红；副本只用于负控。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("workflows/build-code/SKILL.md","utf8");const once=t.split("旧判据三态与集成态读数见").length-1===1;const bad=/必须走|必须调用|必须按[^。]{0,20}走|一律走/.test(t.split("\n").filter(l=>l.includes("旧判据三态与集成态读数见")).join("\n"))||t.includes("最多派一次异源");process.exit(once&&!bad?0:1)'`（cwd＝仓库根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-BUILD-CODE-POINTER；改动前该句 0 次，同一命令因目标断言失败而退出非零；归因是指针未写。
- **GREEN 判定器**：ORACLE-P8-BUILD-CODE-POINTER；同一命令退出 0，指针句恰一次、段内无四个禁词、无「最多派一次异源」，`AC-14①` 的 `PARA` 与 P2 交付值同值。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-pointer.out`
- **覆盖上限**：只证一句指针在不破既有断言的前提下在位，不证收口者会去读正文。
- **停止 / 恢复**：`PARA` 比值变化时停，回本卡作者改措辞（不带四个词），不改 `PARA` 命令、不放宽断言。
- **完成**：前置（不作完成条件）：定位字符串可命中、四条 `PARA` 可跑。完成条件（只写效果）：指针句一次、原句与段界不变、`PARA` 比值同值、无禁句。

### 任务 18：核六个词只出现一次，三态三词齐

为什么做：正文写了不等于「只一处正文」；同一句被复制到别的技能，读者就会遇到第二套口径；对应验收 5。
交付什么：六个 token 在 `skills workflows docs` 三树各只有 `skills/stage-close/SKILL.md` 一处（`grep -c` 与 `grep -o … | wc -l` 都是 1）；三态三词在该文件各 ≥1 且 `本身有缺陷` 为 1。
不做什么：不用已被占用的词当唯一性 token（`仍适用` 2 处、`已过时` 3 处）；不把 `specs/` 算进唯一性范围；不新增第七个词。
前置：任务 16、17 的正文与指针。
怎么做：对六个词各跑「`grep -rl` 只输出该文件」与「`grep -o | wc -l` 等于 1」；`specs/` 排除的理由写表里（`因缺输入跳过`／`单卡通过不等于集成通过` 在 `specs/` 各有 3 处机制名，那是机制不是正文）；三态三词另判。
怎么验收：跑门禁命令从非零变 0；再核三树 `grep -rl` 各只一行、`grep -o | wc -l` 为 1。
证据：六词与三词读数进 `checks/ac-p7-six-tokens.out`；不证读者理解一致。
下游（含何时停）：任务 19 与终末报告读这些读数；某词被历史占用时不删历史，写清范围。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T137
- **来源 / FR / AC**：R-010、R-011；AC-12 通过条件与失败长相；FR-17／18；包 7 卡第 12 条；来源 `design.md` §6.1。
- **输入**：任务 16、17 的正文与指针；三树现状（`skills workflows docs`）。
- **文件 / 符号**：`skills/stage-close/SKILL.md`、`workflows/build-code/SKILL.md`、`checks/ac-p7-six-tokens.out`；N/A — 无符号。
- **动作**：六个 token 各核「只一处」与「出现一次」；三态三词另判；`specs/` 排除理由写表里。
- **输出 / 失败**：六个词各一次、三词齐；某词在第二处命中、或 `specs/` 被算入范围时命令非零。
- **边界 / 禁止改动**：不改其它技能正文去「凑唯一」；不改 `specs/`；不删 `stage-close` 里的三态词。
- **依赖**：T135、T136
- **测试层级 / 技能**：文档级搜索；`skills/spec-plan` 的材料唯一性与 `skills/norm-sync` 的同步口径。
- **场景 / 夹具或服务**：正例＝六个词各一处；负例＝在副本里把一段正文抄进 `skills/run-phase/SKILL.md`（`grep -rl` 应出现两行）；只读交付树。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("skills/stage-close/SKILL.md","utf8");const tok=["本身有缺陷","故意打破","重跑仍是绿的","因缺输入跳过","单卡通过不等于集成通过","同一批检查"];const ok=tok.every(x=>t.split(x).length-1===1)&&["仍适用","已过时","本身有缺陷"].every(x=>t.includes(x));process.exit(ok?0:1)'`（cwd＝仓库根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-SIX-TOKENS；改动前六个词各 0，同一命令因目标断言失败而退出非零；归因是正文与唯一性未做。
- **GREEN 判定器**：ORACLE-P8-SIX-TOKENS；同一命令退出 0，三树搜索各只命中该文件一次，`grep -o | wc -l` 为 1，三态三词齐且 `本身有缺陷` 为 1。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-six-tokens.out`
- **覆盖上限**：只证六个词与三态三词的字面唯一，不证读者理解一致；不证 `specs/` 里那些机制名。
- **停止 / 恢复**：某词被占用的历史事实出现（如 `已过时` 在归档里 3 处）时，不删历史文件，只把唯一性范围与理由写清；若必须在第二处写同句，停该路径回 spec owner。
- **完成**：前置（不作完成条件）：三树搜索可跑、词表固定。完成条件（只写效果）：六个词各一处、三态三词齐、范围与排除理由写清。

### 任务 19：收口时核「表不是检查器」、三表同值、未取得清单齐

为什么做：表一旦被工具读、被登记成能力，它就从判词原件变成第二份进度权威；对应验收 1、3、4、5。
交付什么：`checks/ac-p7-not-a-checker.out` 三件读数（`grep -rn "gen-table" tools runtime tests workflows skills` 0 命中；不在 `skills/catalog.yaml`；不在任何 `steps.json` 与 `run-checks` 子检查清单）；三张表表头 OID 三处同值且等于 `git rev-parse HEAD`；未取得清单（T08、七包原话、任务四未归桶、四行不敏感面、换机不可比、索引未落盘）逐条带 owner。
不做什么：不把表接进 `run-checks` 或 CI；不新增 consumer；不删未取得项冒充齐备。
前置：任务 7、9、10、13、15、18 的全部读数。
怎么做：跑三件只读搜索；把三表表头 OID 与 `git rev-parse HEAD` 比对；把未取得清单按六类逐条写 owner 与恢复条件；最后按「完成」栏判 Done。
怎么验收：跑门禁命令从非零变 0；再核三表 OID 同值、未取得六类各带 owner。
证据：三件读数与未取得清单进 `checks/ac-p7-not-a-checker.out`；不证判词正确。
下游（含何时停）：任务 20 与整任务验收者读这份清单；发现接线时停，撤掉接线并按治理边界登记。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T138
- **来源 / FR / AC**：R-010、R-011；AC-12 失败长相「单卡绿外推成整版绿」；FR-18；`AGENTS.md` 治理边界（新控制面须登记 consumer／owner／替代关系／删除条件）。
- **输入**：任务 7、8、9、13、15、18 的读数。
- **文件 / 符号**：四张表、`gen-table.mjs`、`checks/ac-p7-not-a-checker.out`；N/A — 数据与脚本，无共享符号。
- **动作**：跑三件只读搜索（`gen-table` 不在 `tools/`／`runtime/`／`tests/`／`workflows/`／`skills/`；不在 `catalog.yaml`；不在任何 `steps.json` 与 `run-checks` 子检查清单）；核三表 OID；写未取得六类与 owner。
- **输出 / 失败**：三件读数齐、三处 OID 同值、未取得清单齐；表被任何工具 import、或三处 OID 不一致、或未取得项被删时命令非零。
- **边界 / 禁止改动**：不改 `tools/`／`runtime/`／`tests/`／`catalog`／`steps.json`；不删未取得行；不改三表结论凑齐。
- **依赖**：T126、T127、T128、T129、T132、T134、T137
- **测试层级 / 技能**：文档级＋只读搜索；`skills/spec-plan` 的收口与 `AGENTS.md` 的治理边界（新控制面须登记 consumer／owner／替代关系／删除条件）。
- **场景 / 夹具或服务**：三件搜索与一次 OID 比对；未取得六类各一具名行；只读。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs"),{execSync}=require("child_process");const head=execSync("git rev-parse HEAD",{encoding:"utf8"}).trim();const dir="quality/evidence/p7-replay/";const files=["verdict-table.md","old-criteria-3state.md","integration-readings.md"];const same=files.every(f=>fs.readFileSync(dir+f,"utf8").includes(head));const gaps=fs.readFileSync(dir+"checks/ac-p7-not-a-checker.out","utf8");process.exit(same&&gaps.includes("0")&&gaps.includes("owner")?0:1)'`（cwd＝任务根；仓内三处 grep 的原始输出落在 `checks/ac-p7-not-a-checker.out` 里，不在本命令内重跑）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-NOT-A-CHECKER；改动前三表不存在、无 OID 与搜索读数，同一命令因目标断言失败而退出非零；归因是收口未做。
- **GREEN 判定器**：ORACLE-P8-NOT-A-CHECKER；同一命令退出 0，三表 OID 同值且等于当前 HEAD，三件「不是检查器」读数齐，未取得六类各带 owner 与恢复条件。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-not-a-checker.out`
- **覆盖上限**：只证表没被接成机制与三处 OID 同值，不证表的判词正确；不证未取得项将来能补上。
- **停止 / 恢复**：发现有人把生成器或表接进 `run-checks`／CI 时停，回本卡作者撤掉接线并按治理边界登记（新控制面须先有 consumer 与 owner），不改表内容求绿。
- **完成**：前置（不作完成条件）：三件搜索与 OID 比对可跑并留读数。完成条件（只写效果）：三表 OID 同值、不是检查器三件齐、未取得六类各带 owner 与恢复条件，Done 判读与表内档位一致。

### 任务 20：把六项结论与回写五项写清，缺件留名字与 owner

为什么做：收口结果要能被下一个人接着用，缺件必须留名字与 owner，而不是留一张看起来齐的表；对应验收 4、5。
交付什么：`all-ac-verdicts.md` 表下的六项结论与回写五项各一行，未取得项带 owner 与恢复条件。
不做什么：不改 `spec.md` 与 `facts.jsonl` 的字段（只由 stage 流程写既有 `phase_progress`）；不新增报告文件类型；不把缺件写成通过。
前置：任务 19 的未取得清单与 Done 判读。
怎么做：按「验收 Phase 才能做的检查」第 10、11 项逐项写「哪条 case 改了／为什么／改后判定」；六项结论逐项非空；交接只列用户独占决定与不可逆动作（T08 原件由用户与域 owner 提供、七包原话由用户提供）。
怎么验收：跑门禁命令从非零变 0；再核六项与五项各有一行、未取得各带 owner 与恢复条件。
证据：六项结论与交接段进 `checks/ac-p7-closeout.out`；不证缺件能被补上。
下游（含何时停）：终末报告作者与整任务验收者读这两段；缺项留空或写成通过时停，回本卡作者。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T139
- **来源 / FR / AC**：R-010、R-011；FR-17／18 的收口要求；AC-12；`skills/spec-plan/templates/phase-template.md` 的「验收 Phase 才能做的检查」第 10、11 项。
- **输入**：任务 19 的未取得清单与 Done 判读；`all-ac-verdicts.md` 的 17 行。
- **文件 / 符号**：`quality/evidence/p7-replay/all-ac-verdicts.md` 的表下结论段、`checks/ac-p7-closeout.out`；N/A — 数据表无符号。
- **动作**：写六项结论（评估与局限／偏差与原因／未充分测试／异常与未解决事件／残留风险／签核对象）与回写五项，逐项写「改了什么、为什么、改后判定」；缺件写 owner 与恢复条件。
- **输出 / 失败**：六项与五项各非空、未取得带 owner；留空、写「无」不带理由、或把缺件写成通过时命令非零。
- **边界 / 禁止改动**：不改 `spec.md`、`decision-log.md`、`facts.jsonl` 的字段与既有记录；不新增报告文件；不改前四任务材料。
- **依赖**：T127、T128、T132、T133、T135、T136、T137、T138
- **测试层级 / 技能**：文档级；`skills/spec-plan` 的收口写法与 `skills/stage-handoff` 的交接口径。
- **场景 / 夹具或服务**：正例＝六项与五项齐；负例＝只写「已完成」一行、或把 T08 写成已解决；只读材料。
- **RED/GREEN 门禁命令**：`node -e 'const fs=require("fs");const t=fs.readFileSync("quality/evidence/p7-replay/all-ac-verdicts.md","utf8");const keys=["评估与局限","偏差","未充分测试","未解决事件","残留风险","签核对象","回写","未取得","owner"];process.exit(keys.every(k=>t.includes(k))?0:1)'`（cwd＝任务根）
- **预期退出码**：RED nonzero; GREEN 0
- **RED 目标失败**：ORACLE-P8-CLOSEOUT；改动前表下结论段不存在，同一命令读文件或关键字失败退出非零；归因是收口段未写。
- **GREEN 判定器**：ORACLE-P8-CLOSEOUT；同一命令退出 0，六项与回写五项各非空、未取得各带 owner 与恢复条件、无「已完成」一句话充数。
- **证据**：`quality/evidence/p7-replay/checks/ac-p7-closeout.out`
- **覆盖上限**：只证结论文本在场与带 owner，不证缺件能被补上；不证用户会提供 T08 原件与七包原话。
- **停止 / 恢复**：某项写不出时照实写「未取得＋谁补＋补到什么算有效」，不写「无」；若需改 spec 或 facts 字段才能收口，停该路径交 spec owner。
- **完成**：前置（不作完成条件）：17 行表与未取得清单可读、命令可跑。完成条件（只写效果）：六项结论与回写五项各非空且带 owner，缺件写明恢复条件，无一句话充数。

## 派发预算

本节只描述写卡阶段的派发预算；执行阶段按内核 R2 的角色（一开发一审查一测试）另外计。

- **各次派发做什么**：
  第一次，调研与设计（已完成：`quality/evidence/build-plan/p7/` 的 `research.md`、`design.md`、`card.md`）。
  第二次，落卡作者写本 Phase 卡（本次）。
  第三次，实现者按任务 1–8 落判词表（生成器、路径级、六列、撞号、内容级、抽核、表头与自检）。
  第四次，实现者按任务 9–10 落三态表、破坏探针与 T08 缺口行。
  第五次，实现者按任务 11–15 落集成态表、缺口登记、17 行表与 6 条重跑。
  第六次，实现者按任务 16–18 落两处正文与唯一性读数。
  第七次，实现者按任务 19–20 收口与交接回写；独立审查角色按「验收 Phase 才能做的检查」判 17 条 AC。
- **哪一段与谁并行**：判词表（任务 1–8）与三态表（9–10）、集成态表（11–15）读的是不同原件，可并行；两处正文（16–18）只读仓内字节，可与表并行。
  同一文件的写者仍串行：`workflows/build-code/SKILL.md` 前六个写者已落地，本段只写 `:386`；`skills/stage-close/SKILL.md` 本段唯一写者。
- **超过预算写理由**：本段无法把 20 张卡压成更少：127 行表、三态破坏、41 行读数、6 条重跑、两处正文各自有独立判定器与独立 evidence 路径，压成一次派发会让「哪一步失败」不可归因，代价是多轮派发与更长的等待；批准人＝主会话。
- **审查轮次**：一次结论，按 `skills/wh-review/SKILL.md` 的任务级限制写，不写成全仓上限。
- **回读不属于派发预算**：回读按 `skills/phase-maker/SKILL.md` 的「回读契约」单列。

## 机器字段（校验器用，人可跳过）

- **全局规格**: `specs/delivery-quality-acceptance-20261126/spec.md#实现设计全局权威`
- **写入集**（推荐，不校验）: `skills/stage-close/SKILL.md`、`workflows/build-code/SKILL.md`（与 `phases/index.md` 的 `P8` 行一致）；任务根证据 `quality/evidence/p7-replay/`（判词表、三态表、集成态读数表、17 行 AC 表、`gen-table.mjs` 与读数子目录）不在仓内写集列，留在这张卡的机器字段里
- **依赖**: P7（本段只写同文件 386 行段末一句，须待它交回 327／331／334 三段与六句硬规则正文位置）；前五段的原件只作 6 条重跑与 10 条消费的输入（见各 Task 的「输入」），任一未落地时该行记未取得＋owner＝该 Phase
- **消费者**: 整任务验收者、独立审查角色
- **gate_cmd**: `node -e 'const fs=require("fs");const sc=fs.readFileSync("skills/stage-close/SKILL.md","utf8");const bc=fs.readFileSync("workflows/build-code/SKILL.md","utf8");const tok=["本身有缺陷","故意打破","重跑仍是绿的","因缺输入跳过","单卡通过不等于集成通过","同一批检查"];const once=tok.every(x=>sc.split(x).length-1===1)&&["仍适用","已过时"].every(x=>sc.includes(x));const bad=/skills\/(?:run-phase|spec-plan|task-breakdown)\/SKILL\.md/.test(sc)||/stage-closeout/.test(sc)||/必须走|必须调用|必须按[^。]{0,20}走|一律走/.test(bc.split("\n").filter(l=>l.includes("旧判据三态与集成态读数见")).join("\n"))||bc.includes("最多派一次异源");process.exit(once&&!bad&&bc.split("旧判据三态与集成态读数见").length-1===1?0:1)'`（cwd＝仓库根；结构前置，不产出验收结论；三张表的形状由任务 1–13 的 gate 各自核）
- **oracle**: ORACLE-P8-PRIOR-TASK-AC-CLOSE
- **evidence_path**: planned: `quality/evidence/p7-replay/`（相对任务根；目录已建，四张表与 `checks/` 读数待 P8 期产出）
- **STOP**: 需要新增检查器、改任何退出码、改前四任务材料或 T08 锚、把目录或改名件当原件、或用同义词凑三态才能过时，停该路径；写缺口、owner 与恢复条件，不改 AC、不改判定器求绿。破坏探针在三个候选面上都 diff 0 时记「破坏证明未取得＋owner＝P6」并回 P6，不改判「已过时」。副本只能在 `/tmp` 下跑时报 `original path alias`，改用 `$HOME` 下 `mktemp -d`。
- **覆盖 AC**: AC-12（首判）；AC-03、AC-04、AC-06、AC-13、AC-14、AC-15（最终字节重跑）；其余 AC-01、AC-02、AC-05、AC-07、AC-08、AC-09、AC-10、AC-11、AC-16、AC-17（消费首判原件一次）
- **Done**: 前置（不作完成条件）：两处正文可读、四张表与 `checks/` 可读、`git rev-parse HEAD` 与 `git status --porcelain` 可跑，六条重跑与 41 行读数各有真实输出，三条既有红（`run-checks --task-path` build-plan 期 exit 1、`build-skill-manifests --check` exit 1／2 FAIL、`phase-contract-prose` 3 failed）修前修后同数。完成条件（只写效果）：AC-12 判 `pass` 须同时满足——127 条各有四值结论且无空格、撞号正控 12 组、46 行内容级留痕、四条旧判据三态值域封闭且「仍适用」有破坏前后点名读数、T08 缺口行四件事实齐、41 行各有 argv 与判据句（37 可执行／3 因缺输入跳过／1 不可执行）、三表表头 OID 同值、17 行 AC 表齐；AC-03／04／06／13／14／15 各记本次读数与「与首判是否一致」，不一致回该 Phase；AC-01／02／05／07／08／09／10／11／16／17 读不到首判原件时记 `incomplete` 或 `unavailable` 并写 owner＝该首判 Phase，不写 pass；任一未达成写具体原因、所需条件与具名 owner。两条正文另需三份 stage-close 契约 18 pass、`four-skill-wiring` 8 pass、`AC-14①` 的 `PARA` 与 P2 交付值同值、markdownlint 退 0。
