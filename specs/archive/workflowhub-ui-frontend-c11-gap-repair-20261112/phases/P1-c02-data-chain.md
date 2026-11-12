# Phase P1 — 查询结果落盘并被页面选择消费

本文件写给 P3、P4 的采集作者与 P5 的差异审查者；读完要能说出改哪几个文件、命令怎么跑、坏数据怎么重现、坏了回哪修。

## 这一 Phase 交出什么？

交付一个只用 Node 标准库的查询写入器、它产出的未截断原始输出与页面可读数据文件，并把 v15 入口页的选择列表改到该文件上。

- **本 Phase 结果**：v15 副本内新增 `v15/2026-11-12-001-c11-query-writer.mjs` 与 `v15/2026-11-12-002-c11-query-data.js`；写入器对**本项目真实知识图** `/Users/Hugh/Hugh/Project/workflowhub/graphify-out/graph.json` 跑一次有界查询（只读引用，不复制图文件），把命令自己写出的完整结果原样落盘；入口页先载数据文件再载页面脚本；`app.js` 把「数据→选项」做成可被 Node 直接加载的纯函数 `C11_queryOptions`，`#sample-options` 与规则面板都由该数据渲染，选择时要求记录 id 存在于数据；数据文件缺失、为空、缺标识、格式坏四种情况各给可读原因且不出现成功选择。
- **语义说明（必须照写）**：查询对象是代码/知识图里的经验条目，**不是** v14 合成的策略版本样例。页面选择列表改称“经验候选”，选项 id 等于查询记录 id（图节点 id），不再使用 `strategy_version_id`。这是把 C02 的“查询→页面选择”链落在真实图数据上；页面原有策略样例文案与 v14 文件不改，v14 脚本不再负责渲染选项。
- **非目标**：不改 `v11/`、`v12/`、`v14/` 任何字节；不建本地服务、不引入 fetch/XHR/localStorage；不动载体与 PB 原仓。
- **给 P3 的供件**：页面审计器采集前会重载页面，点击出来的状态会被重置。因此本 Phase 同时给入口页加一个只读 URL 状态入口（`?state=<状态名>`），让十一个状态在重载后仍可复现；它只驱动既有状态机，不改变默认打开行为，也不改变本 Phase 的数据链判据。该供件本身不为本 Phase 增加验收，P3 用它逐格采集。
- **给 P5/P6 的供件**：本 Phase 收口时发布 `quality/evidence/c11-final-v15.sha256`，列本次改动与新增文件的相对路径与哈希（不复制整目录）。P3、P4 在结论里记该清单的哈希；P6 用它判“结论对应最终字节”。
- **改动前**：选项与规则面板由 `v14/2026-11-11-004-t019-v14-local-samples-clean.js` 的写死数组渲染，入口页没有查询数据脚本，页面没有任何可回读的「查询→选择」来源。
- **改动后**：`#sample-options` 的条目、`#sample-title`、`#rule-fields`、YAML 与结构化内容全部来自 `window.C11_QUERY_DATA`；数据缺失或坏时页面停在无选项并有具名原因，按钮不产生成功选择。
- **与相邻 Phase 的边界**：本 Phase 只交数据链与 v15 入口页改动；33 格观察（P3）、缩放与性能（P4）、完整差异审查（P5）都读本 Phase 的定稿字节，不重复改这些文件。
- **主要风险**：把「数据文件存在」当「页面真的消费」；把写入器自己写的布尔当「未截断」。本 Phase 用「重跑同一查询比对字节」与「选项 id 必须出现在原始输出文本里」两条挡住，不接受文件存在或自报。
- **下一步**：P3、P4 在最终字节上采集；P5 用本 Phase 开工前留下的只读副本与全量清单判完整前后。
- **动手前必读**：`quality/evidence/2026-11-12-011-c11-gap-ledger-v4.md` 的 G1；`spec.md` 的验收 1 与方案 1；`v15/2026-11-11-002-t019-v15-pending-busy-index.html:8-11`；`v15/2026-11-11-001-t019-v15-pending-busy-app.js:1-51`；`v14/2026-11-11-004-t019-v14-local-samples-clean.js:148-240`。
- **未决事实**：`unavailable` — 现状没有运行中的远程图查询服务（C02 的 069 输出截断、未落盘，028:74-75 记缺证）；本 Phase 的查询执行体是对本项目真实知识图的一次有界查询。`graphify` 命令可用时直接调用；不可用时用 Node 只读同一图文件做等价有界查询，两者都不复制图、不编数据。远程服务不可用记在覆盖限制，不写成通过条件。

## 这一 Phase 怎么验收？

假设本 Phase 全部实现、命令也全部通过，远程查询服务是否可用仍不在本 Phase 的判据内，那部分记覆盖限制。
本 Phase 只承接验收 1，按「一条验收一小段」写。

**验收 1：查询落盘与页面选择（AC-C11-001）**

目标：让独立测试者只凭命令输出与页面读回就能说出「选项从哪份数据来、数据是不是这次查询原样落盘的」，并亲手把数据改坏看到页面失败而不是冒充选中；判据见 Appendix A 的 AC-C11-001。

怎么操作：在 v15 副本内跑写入器一次，记命令、退出码与原始输出字节；从副本根起 `python3 -m http.server 8080`，用 agent-browser 打开入口页读选项与标题；再把数据文件依次改坏为缺失（移走）、为空、缺标识、非法 JSON，各重开一次页面读原因文案与“使用当前候选”是否可用；每步留原件，坏数据验后从只读副本还原。

什么条件：本机 Node 与 python3、agent-browser 会话；入口页跨目录引用 `../v11`、`../v12`、`../v14` 的 css/js，必须从副本根起静态服务，`file://` 打开会被浏览器拒绝；页面无 fetch、无 XHR、无 localStorage，只能走 `<script src>` 载入静态数据；查询输入是项目真实知识图，路径只读。

怎样算通过：门禁命令退出 0，且它做了四件事：①按写入器记录的原命令重跑一次查询，重跑输出先写 `/tmp` 临时路径、校验通过后只说明差异，不覆盖 `c11-p1-query-output.txt`、`c11-p1-query-command.txt` 与 v15 数据文件这些既有原件（门禁另证这三者重跑前后 sha256 不变），输出与落盘原始输出逐字节相同；②原始输出里能找到每一个选项 id；③选项 id 集合与数据 id 集合逐项相等（不是条数相等），且两侧都无重复 id；④四种坏数据下页面没有可选项、给出互不相同的原因、且“使用当前候选”不产生成功选择。

故意弄坏一处（必须变红）：①把数据文件里任一条记录 id 改掉后重跑门禁，必须以「选项 id 不在原始输出里」非零；②删掉 `app.js` 里 `window.C11_queryOptions` 的赋值后重跑，必须退出 2 并打印「页面没有把数据→选项做成可加载的纯函数」；③把写入器记录的查询命令改一个字符后重跑，必须以「重跑输出与落盘不一致」非零；还原后必须重新退出 0。

真跑还是替代：真跑。命令级判据由 Node 在 `vm` 里加载页面脚本与数据文件的真实字节，并由门禁重跑真实查询；页面可见面用真实浏览器打开真实静态服务页；本卡尚未执行，不宣称 RED 或 GREEN。

谁判与证据：未参与实现的独立执行者（来源用 `ocr delegate` 或 wh-review 独立记录，见 spec 的独立性要求），在 P1 实现完成且门禁命令跑完后判定；读门禁原始输出、原始输出文件、数据文件、四张坏数据截图与浏览器读回；结论记本卡「完成」与 `quality/evidence/c11-p1-*`。

失败回修与停止：信号是门禁非零、重跑字节不一致、选项 id 不在原始输出、集合不等、坏数据仍出现成功选择、原因文案缺失或截图与读回不一致。数据链问题回 P1 实施者；页面呈现问题回同一实施者改 `app.js`；Node、端口或浏览器不可用回环境提供者。修后重验门禁与四条负例，并重取坏数据截图与浏览器读回；同一原因两次失败停手报主会话，保留原失败原件。部分改动失败时按开工前基线还原本次两个文件，保留失败原件再重跑。

## 为什么现在做，依据是什么？

先让页面真的从一份可回读、可重新算出的数据里取选项，P3 的 33 格与 P4 的读数才有稳定的页面行为可观察。

- **结果**：页面选项、规则面板与整页数据都源自一份落盘数据文件，且该文件能由记录的命令重跑复现；坏数据不产生成功选择。
- **非目标**：不建查询平台、不引运行时依赖、不改 v14 的样例渲染脚本。
- **与其它 Phase 的区别**：本 Phase 只判数据链是否接通，页面在三个视口下的逐格表现归 P3，缩放与性能归 P4。
- **依据**：缺口台账 G1（028:74-75 的查询截断与未落盘）；`spec.md` 的「方案 1：查询写入器加静态数据文件」；decision-log 的包 1 与并行安排。

## 开始前读什么？

| 材料或锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `quality/evidence/2026-11-12-011-c11-gap-ledger-v4.md` G1 | 取原判、真实使用点、关闭判据与反例 | 开工前 |
| `spec.md` 的验收 1、方案 1、接口与失败语义 | 取失败分支与「不退回样例硬编码」的边界 | 开工前 |
| `v15/2026-11-11-002-t019-v15-pending-busy-index.html:8-11` | 读现有脚本顺序与跨目录引用 | 改前 |
| `v15/2026-11-11-001-t019-v15-pending-busy-app.js:1-51` | 读 `transition`、`render`、块级 `state` 与现有 `module.exports` 守卫 | 改前 |
| `v14/2026-11-11-004-t019-v14-local-samples-clean.js:148-240` | 读现写死的选项渲染与样例字段，只读，不修改 | 改前 |
| `v15/README` 与 v15 目录清单 | 确认副本无 `package.json`、无 `node_modules`，只能靠 Node 标准库 | 写卡前 |
| `/Users/Hugh/Hugh/Project/workflowhub/graphify-out/graph.json` | 查询输入的真实图；只读，不复制 | 写卡前 |

## 每个文件由谁改，先做什么？

- **开工前必做（基线）**：先出 v15 全量清单 `quality/evidence/c11-baseline/v15.sha256`（`find v15 -type f` 的相对路径 + sha256，不复制整目录），再把本次要改的两个文件 `v15/2026-11-11-002-t019-v15-pending-busy-index.html`、`v15/2026-11-11-001-t019-v15-pending-busy-app.js` 复制成只读副本存 `quality/evidence/c11-baseline/v15/`（保持相对路径）。清单是 P5 判新增/删除/修改三类的唯一来源；缺它就是 P5 无法成立。
- **新增**：`v15/2026-11-12-001-c11-query-writer.mjs`（只用 Node 标准库）、`v15/2026-11-12-002-c11-query-data.js`（写入器产出）、`quality/evidence/c11-p1-query-command.txt`（查询命令原文与退出码；该命令的 stdout 就是落盘的原始输出，写入器只做原样重定向，不改一个字节，供门禁重跑比对）、`quality/evidence/c11-final-v15.sha256`（收口时的最终清单）。
- **修改**：`v15/2026-11-11-002-t019-v15-pending-busy-index.html`（先载数据文件、去掉 v14 样例脚本标签）、`v15/2026-11-11-001-t019-v15-pending-busy-app.js`（数据→选项纯函数、选项与详情渲染、ID 校验、四种坏数据原因、只读 `?state=` 入口）。
- **禁止改动**：`v11/`、`v12/`、`v14/` 全部文件；载体 `c09-carrier-new-20261103`；PB 源 `PaperBuilder/frontend/src/ui/`；任务库既有证据与判词；`v15/README`。

本 Phase 只有一个写主，没有并行组；`v14` 的样例脚本保持只读，页面不再依赖它渲染选项，因此不需要共享路径先后表。

## 怎么验证？

命令级判据用 Node 在 `vm` 里加载真实页面脚本与真实数据文件，并由门禁重跑写入器记录的查询命令；页面可见面用真实浏览器读回，两层都留原件。

开工前四要素：验证层是命令级加一次浏览器观察；命令是本文件末尾机器字段 `gate_cmd` 的单行命令（整行复制执行，正文不复述）；预期是 RED 退出 2、GREEN 退出 0 且页面读回与数据一致；失败条件是纯函数缺失、重跑字节不一致、选项 id 不在原始输出、集合不等、坏数据仍可选中或原因文案相同。

成本：executor=独立测试者；estimate_min=60；hard_cap_min=120；retry_cap=1；evidence_tier=命令级。

| 目标 | Task | 角色 | gate_cmd 与预期退出码 | 判据与证据路径 |
| --- | --- | --- | --- | --- |
| 选项来自查询原始输出、四种坏数据不选中 | T001 | RED | 门禁命令在改动前退出 2，stderr 含「页面没有把数据→选项做成可加载的纯函数」 | ORACLE-C11-DATA 与 `quality/evidence/c11-p1-gate-red.output` |
| 选项来自查询原始输出、四种坏数据不选中 | T001 | GREEN | 门禁命令退出 0，并打印重跑字节一致、选项 id 命中、四种原因 | ORACLE-C11-DATA 与 `quality/evidence/c11-p1-gate-green.output`、`c11-p1-query-output.txt`、`c11-p1-query-command.txt`、`c11-p1-query-data.json`、`c11-p1-bad-data-*.png` |

覆盖上限：只证明「真实知识图 → 一次有界查询 → 落盘 → 页面选择」这条链在当前字节上接通，以及四种坏数据不产生成功选择；查询记录是图里的经验条目，不是策略版本样例，页面语义已按此改名。
显式不覆盖：不证明远程或托管图查询服务可用（现状无此类服务）；不证明 11 个状态与 3 个视口下的整页表现（归 P3）；不证明缩放、可访问与性能（归 P4）；不证明载体页面。

失败了怎么办：纯函数缺失、重跑不一致或集合不等交 P1 实施者改数据链；页面呈现与原因文案问题交同一实施者改 `app.js`；Node、端口或浏览器不可用交环境提供者。加载失败与断言不符分别记录，均不能算通过；目标断言未到达时不得改判定器求绿。

## 下一消费者拿什么继续？

P3 与 P4 在同一份定稿字节上采集并记录 `c11-final-v15.sha256` 的哈希；P5 用基线清单与最终清单判新增/删除/修改三类。

- 交回：`v15/2026-11-12-001-c11-query-writer.mjs`、`v15/2026-11-12-002-c11-query-data.js`、改后的入口页与 `app.js`、门禁命令 RED/GREEN 原输出、原始输出文件与查询命令记录、数据文件 JSON 副本、四张坏数据截图、`c11-final-v15.sha256`。
- 未完成项：本条尚未执行，RED 与 GREEN 原件都记 `incomplete`，判定者、观察协议与证据落点按本节执行；远程查询服务不可用记 `unavailable` 与恢复条件（出现可运行的服务时重跑写入器）。

## 每张任务卡怎么写？

### 任务 1：查询落盘并让页面从数据渲染选项

为什么做：v15 的选项与规则写死在 v14 数组里，没有可回读、可重算的查询结果，对应 R-001、FR-C11-001 与 AC-C11-001；台账 G1 判它缺证。
交付什么：写入器跑一次产出原样落盘的查询输出与页面数据文件；入口页从数据渲染选项与详情，选择时要求 ID 存在；缺失、空、缺标识、格式坏四种坏数据各给可读原因且不出现成功选择。
不做什么：不改 `v11/`、`v12/`、`v14/`；不建服务、不引依赖、不写 fetch/XHR/localStorage；只读 `?state=` 入口是本 Phase 给 P3 的供件，除此之外不加任何 URL 业务参数；不改载体与 PB 原仓；不为通过而放宽判定器。
前置：开工前先出 v15 全量清单并把两个将改文件复制到 `quality/evidence/c11-baseline/v15/`；阅读顺序见本文件「开始前读什么」；无更早的 Task 依赖。
怎么做：先抄基线与清单，再写写入器（`--graph`、`--raw`、`--data`、`--command` 四个参数，坏输入必须非零；查询命令与退出码写入 `c11-p1-query-command.txt`）；跑一次写入器；最后改入口页与 `app.js`，把选项与详情渲染迁到数据上，ID 不在数据里就停在无选项并给原因。
怎么验收：跑本卡 RED/GREEN 门禁命令，RED 退出 2、GREEN 退出 0，再用 agent-browser 读回页面选项与四种坏数据呈现；判定器见 `ORACLE-C11-DATA`。
证据：`quality/evidence/c11-p1-gate-red.output`、`c11-p1-gate-green.output`、`c11-p1-query-output.txt`、`c11-p1-query-command.txt`、`c11-p1-query-data.json`、`c11-p1-bad-data-missing-file.png`、`c11-p1-bad-data-empty.png`、`c11-p1-bad-data-missing-id.png`、`c11-p1-bad-data-invalid-json.png`、`c11-baseline/v15.sha256`、`c11-final-v15.sha256`；本条尚未执行，原件记 `incomplete`。
下游（含何时停）：P3、P4 在定稿字节上采集，P5 读两份清单；纯函数、重跑字节或集合断言未到达就停手，回 P1 实施者修，不改判定器求绿。

**校验器用，人可跳过**

- **任务编号**：T001
- **Source / FR / AC**：R-001 / FR-C11-001 / AC-C11-001；选项必须来自一次查询的原样落盘输出，坏数据不得被选中。
- **Inputs**：无更早 Task；真实输入是 v15 当前字节、项目知识图与 Node 运行时；远程查询服务现状不可用，如实记在覆盖上限与未决事实。
- **Files / symbols**：`v15/2026-11-12-001-c11-query-writer.mjs`（新增）、`v15/2026-11-12-002-c11-query-data.js`（新增）、`v15/2026-11-11-002-t019-v15-pending-busy-index.html`（改）、`v15/2026-11-11-001-t019-v15-pending-busy-app.js`（改）；symbols：`C11_queryOptions`、`window.C11_QUERY_DATA`、`#sample-options`、`#demo-use-sample`。
- **Action**：先抄全量清单与两文件基线，再写只用 Node 标准库的写入器并跑一次，原样落盘查询输出、记录命令与退出码、产出页面数据文件；入口页先载数据文件再载页面脚本；`app.js` 把数据→选项做成纯函数并同时挂 `window` 与 `module.exports`，选项、标题、规则、YAML 与结构化内容都由数据渲染，选择时校验记录 id 存在，缺失、空、缺标识、格式坏各给互不相同的可读原因；并加只读 URL 状态入口供 P3 重载后复现状态；移除改动仅退回本 hunk。
- **Outputs / failure**：GREEN 时重跑字节与落盘一致、每个选项 id 出现在原始输出、选项集合等于数据集合、四种负例各有原因，命令退出 0；数据缺失、纯函数缺失、重跑不一致、id 未命中、集合不等、坏数据仍可选中、原因缺失或文案相同一律非零，不造成功。
- **Boundary / DO NOT TOUCH**：`v11/`、`v12/`、`v14/` 全部字节；载体 `c09-carrier-new-20261103`；PB 源 `PaperBuilder/frontend/src/ui/`；任务库既有证据与判词；`v15/README`；不新增服务、依赖、fetch/XHR/localStorage；只读 `?state=` 状态入口只驱动既有状态机，不承载业务数据。
- **Dependency**：none；开工前必须先出全量清单与基线，否则 P5 无法判完整前后。
- **Test tier / skill**：feature / frontend-testing；真实页面脚本、真实数据文件与真实查询重跑的命令级判据加一次浏览器读回，不涉及网络与数据库。
- **Scenario / fixture or service**：v15 副本起 `python3 -m http.server 8080`；正例是写入器产出的数据文件；四条负例在副本内临时构造（移走文件、空、缺标识、非法 JSON），验后从基线还原；不修改生产字节以外的既有证据。
- **RED/GREEN gate_cmd**：见本文件机器字段 `gate_cmd`（整行复制执行）。
- **expected_exit**：RED 2；GREEN 0；纯函数缺失或载入顺序错为 2，重跑不一致、id 未命中、集合/条数与负例问题为 3，两类都算未通过，环境失败另记。
- **RED target failure**：`ORACLE-C11-DATA` 在改动前断言 `window.C11_queryOptions` 存在且选项来自数据；现状选项写死在 `v14/2026-11-11-004-t019-v14-local-samples-clean.js:200-236`、`app.js` 无数据入口，断言必失败并退出 2；若原字节已含等价入口，如实记本来通过，不制造生产回退。
- **RED evidence**：改前无当前读取记录与查询落盘；风险是把「数据文件被读取」当成「查询结果被消费」；客观替代是重跑查询比对字节加选项 id 命中。
- **GREEN oracle**：`ORACLE-C11-DATA` 判重跑输出与落盘逐字节相同、每个选项 id 出现在原始输出文本、选项集合等于数据集合、四种负例各有互不相同的非空原因；同一断言拒绝自报未截断、拒绝条数相等但 id 不命中、拒绝坏数据可选中。
- **Evidence**：门禁原输出（RED、GREEN 各一份）、查询命令与退出码、原始输出文件、数据文件 JSON 副本、四张坏数据截图与浏览器读回、开工清单与最终清单，各留单份原件；本条尚未执行，原件记 `incomplete`。
- **STOP / recovery**：纯函数、重跑或集合断言未到达时定位真实输入与当前字节，回 P1 实施者修；环境失败交环境提供者；保原失败，禁止改判定器求绿，禁止把远程服务不可用改写成通过。
- **Coverage limit**：只证「真实知识图 → 一次有界查询 → 原样落盘 → 页面选择」与四种坏数据不产生成功选择；不证远程查询服务、不证 11 状态 3 视口、不证缩放与性能、不证载体。
- **Done**：前置（不作完成条件）：全量清单与两文件基线在场，门禁命令在真实字节上跑过并留 RED/GREEN 原输出。完成条件（只写效果）：AC-C11-001 的页面选项来自查询原样落盘的数据、重跑可复现、四种坏数据无成功选择且有可读原因；证据为 `c11-p1-query-output.txt`、`c11-p1-query-command.txt`、`c11-p1-query-data.json`、`c11-p1-bad-data-*.png` 与门禁原输出；远程服务不可用与未执行项具名保留，不预填通过。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计（全局权威）`
- **写入集**：v15 副本内的 `v15/2026-11-12-001-c11-query-writer.mjs`、`v15/2026-11-12-002-c11-query-data.js`、`v15/2026-11-11-002-t019-v15-pending-busy-index.html`、`v15/2026-11-11-001-t019-v15-pending-busy-app.js`；任务库内的 `quality/evidence/c11-baseline/v15.sha256`、`quality/evidence/c11-baseline/v15/`、`quality/evidence/c11-final-v15.sha256`、`quality/evidence/c11-p1-*`
- **依赖**：none
- **消费者**：P3、P4、P5
- **gate_cmd**：`cd /Users/Hugh/Hugh/Project/c11-v15-work-20261112/t019-wf-native-next && node -e 'const fs=require("node:fs"),vm=require("node:vm"),cp=require("node:child_process"),cr=require("node:crypto"),TR="/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112",WT2="/Users/Hugh/Hugh/Project/c11-v15-work-20261112/t019-wf-native-next";const app="v15/2026-11-11-001-t019-v15-pending-busy-app.js",dataP=WT2+"/v15/2026-11-12-002-c11-query-data.js",htmlP="v15/2026-11-11-002-t019-v15-pending-busy-index.html",RAWSRC=TR+"/quality/evidence/c11-p1-query-output.txt",CMDSRC=TR+"/quality/evidence/c11-p1-query-command.txt",tmpRaw="/tmp/c11-p1-gate-rerun-raw.txt",tmpData="/tmp/c11-p1-gate-rerun-data.js",tmpCmd="/tmp/c11-p1-gate-rerun-command.txt";const sha=f=>cr.createHash("sha256").update(fs.readFileSync(f)).digest("hex");const snap=()=>[RAWSRC,CMDSRC,dataP].map(f=>f+"="+sha(f)).join("|"),before=snap();const ctx={window:{},module:{exports:{}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(app,"utf8"),ctx);if(typeof ctx.window.C11_queryOptions!=="function"){console.error("RED: 页面没有把数据→选项做成可加载的纯函数");process.exit(2)}const html=fs.readFileSync(htmlP,"utf8"),i=html.indexOf("2026-11-12-002-c11-query-data.js"),j=html.indexOf("2026-11-11-001-t019-v15-pending-busy-app.js");if(i<0||j<0||i>j){console.error("RED: 入口页未先载查询数据再载页面脚本");process.exit(2)}vm.runInContext(fs.readFileSync(dataP,"utf8"),ctx);const d=ctx.window.C11_QUERY_DATA,build=ctx.window.C11_queryOptions;if(!d||!Array.isArray(d.samples)){console.error("RED: 页面读不到查询数据文件");process.exit(3)}const raw=fs.readFileSync(RAWSRC,"utf8"),cmd=fs.readFileSync(CMDSRC,"utf8").trim();if(!cmd){console.error("RED: 没有查询命令记录，不能重跑");process.exit(3)}const rerun=cmd.split(RAWSRC).join(tmpRaw).split(WT2+"/v15/2026-11-12-002-c11-query-data.js").join(tmpData).split(CMDSRC).join(tmpCmd);const re=cp.spawnSync(rerun,{shell:true,encoding:"utf8",maxBuffer:64*1024*1024});if(re.status!==0){console.error("RED: 重跑查询失败",re.status,String(re.stderr).slice(0,200));process.exit(3)}if(re.stdout!==raw){console.error("RED: 重跑输出与落盘不一致");process.exit(3)}if(!fs.existsSync(tmpRaw)||fs.readFileSync(tmpRaw,"utf8")!==raw){console.error("RED: 重跑临时落盘与原件字节不一致");process.exit(3)}if(!fs.existsSync(tmpData)||fs.readFileSync(tmpData,"utf8")!==fs.readFileSync(dataP,"utf8")){console.error("RED: 重跑数据文件与 v15 数据文件不一致");process.exit(3)}if(snap()!==before){console.error("RED: 门禁改动了原件字节");process.exit(3)}const got=build(d);if(got.ok!==true){console.error("RED: 页面选项与数据不等");process.exit(3)}const optIds=got.options.map(o=>String(o.id)),dataIds=d.samples.map(s=>String(s.id)),so=new Set(optIds),sd=new Set(dataIds);if(so.size!==optIds.length||sd.size!==dataIds.length){console.error("RED: 选项 id 或数据 id 有重复");process.exit(3)}for(const id of so)if(!sd.has(id)){console.error("RED: 选项 id 不在数据 id 集合里",id);process.exit(3)}for(const id of sd)if(!so.has(id)){console.error("RED: 数据 id 不在选项 id 集合里",id);process.exit(3)}for(const o of got.options){if(!raw.includes(String(o.id))){console.error("RED: 选项 id 不在原始输出里",o.id);process.exit(3)}}const negs=[["缺失",build(null)],["空数据",build({samples:[]})],["缺标识",build({samples:[{label:"x"}]})],["格式坏",build({samples:"bad"})]];const reasons=new Set();for(const [k,v] of negs){if(v.ok!==false||typeof v.reason!=="string"||!v.reason.trim()){console.error("RED: 负例无可读原因",k);process.exit(3)}reasons.add(v.reason)}if(reasons.size!==4){console.error("RED: 四种坏数据原因未区分");process.exit(3)}console.log("GREEN: 重跑一致且原件字节未变，选项 id 集合等于数据 id 集合",got.options.length,"条，四种原因齐")'`
- **oracle**：ORACLE-C11-DATA
- **evidence_path**：`quality/evidence/c11-p1-gate-green.output`（同类证据落 `quality/evidence/c11-p1-*`，清单落 `quality/evidence/c11-baseline/v15.sha256` 与 `c11-final-v15.sha256`）
- **STOP**：全量清单与真实图输入缺失时先补清单再开工；纯函数、重跑或集合断言未到达时保原失败、回 P1 实施者修，不移除负例、不改判定器求绿；远程查询服务不可用记 `unavailable` 与恢复条件，不写成通过。
- **覆盖 AC**：AC-C11-001
- **Done**：前置（不作完成条件）：全量清单与 `SHA256SUMS` 在场，门禁命令在真实字节上跑过并留 RED 与 GREEN 原输出。完成条件（只写效果）：AC-C11-001 的页面选项来自一次查询的落盘输出、重跑可复现，缺失/空/缺标识/格式坏四种情况下无成功选择且有可读原因；未执行与远程服务不可用逐项记 `incomplete` 或 `unavailable` 并写恢复条件，不预填完成。
