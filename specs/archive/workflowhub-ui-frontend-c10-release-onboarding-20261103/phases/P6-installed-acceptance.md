# Phase P6 — 最终安装的真实验证和六层结论

本段给独立安装/页面/业务执行者、终末质量读者和发布维护者。
它是唯一末验收Phase，汇总原件并对最终安装/真实旅程补必要未闭环，不重跑全量。

## 哪些节必须写，哪些可以省？

本文件written的结果、验收、依据、读源、写主、验证、任务卡和机器字段承载本段增量。
下一消费者和唯一末验检查均written。
固定机器标签、精确路径/命令和表格是行宽/标题例外；其余按材料写作标准。

## 这一 Phase 交出什么？

发布读者能分清最终包实际跑成什么、哪些仍缺真实条件。

- **本 Phase 结果**：安装后真实流程、C10跨任务读回和六层发布结论分别可独立回读。
- **非目标**：不修前段生产、不改外部载体源、不改C12历史报告，不用报告/固定夹具代业务。
- **改动前**：当前只完成规划，上游C12未覆盖业务；C10自身尚未读新版两页。
- **改动后**：各真实子面有实际执行或具名缺口，六层结论不把局部通过泛化。
- **与相邻 Phase 的边界**：前段首判保留；本段只重建最终README/方法组合，新增验证驱动。
- **主要风险**：缺真实业务输入时把C12演示页或HTTP200冒整链；替代走法是技术面单列完成，业务保未测并交服务owner。
- **下一步**：用户审阅可交付结果，原caller按现stage-close处理已授权Git与一次最终范围确认。
- **动手前必读**：前五段真实原件；PRD C10当前卡；C12报告+057/058/059及重建入口。
- **未决事实**：真实业务服务/数据与双宿主可用性待执行核；owner为服务/环境提供者和本段独立执行者。

## 这一 Phase 怎么验收？

本段首判验收6/7/8/13，读取其余首判；验收10沿途判断在此汇总。

成本账：20 + 45 + 15 + 10 + 原件读回15 + 准备10 + 重验预留20 = 135活动分钟。
资源账：最终包、已装宿主、原C12可重建源、真实业务入口/数据、独立质量原件。
范围账：读取全部AC，不重跑已闭环技术面；仅补最终组合和声明完整实际旅程。
`phase_budget={soft_min:unknown,hard_min:unknown,variance_threshold:unknown,source:provisional proposal}`。
`execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:unknown}`。
没有当前用户预算或S/M/L选择来源；报价不作批准，用户/审查/环境等待分账。
L提案只指本卡最终声明旅程一次，不等于全仓回归；真实最长运行时长未取得。

1. 验收标准：唯一条件在Appendix A；跨任务读回与真实业务分别判，不能互相替代。
2. 场景：最终包加载成功/缺入口；新版两页计算值；真实业务正常/服务失败/取消/无授权写；报告缺ref负例。
3. 环境与数据：从当前最终工作输入重建包，只装该包；载体源只读，复建和token变更仅在P1生命周期scratch；原始证据外置。
4. 用例：三张任务卡分别给执行协议；真实输入由原provider提供，不猜“最新服务”；缺件保unavailable/incomplete及恢复。
5. 谁判与承接：未参与实现的独立安装/浏览器执行者；终末质量由现OCR/独立读者按原方法，不由本段writer自签。
6. 失败回修与重验：输入包/ref/服务对象不匹配或真实环境缺失时，停受影响旅程保原错误和提供者；
包/接入/方法/README问题分别回P4/P2/P3/P5原writer，页面和业务环境回原owner；同一独立方按修复影响定向复验，不用替身填通过。

### 实际观察页面时怎样验收？

本段实际观察两页，因此适用当前模板六项UI验收，即使不写产品前端。

1. 设计源：C12已归档报告的真实页面/来源原件及所引设计比较，
报告sha为b9e713a971e170ff784b2494cb20877f7c6e95250d4ce07e015a4aa388aa5a2d。
   设计不完整/同页预览不可用沿原件保限制，不能把本次scratch当新设计源。
2. 页面/状态/视口：/simulation-board切empty以显露.inlineactions；/sim-workbench正常显示；
   1440×900与390×844；业务结果/失败态按真实服务入口追加，未取得不能假列ready通过。
3. 视觉对照：复用原token/间距事实作局部16px计算值对照；同页完整视觉基准未取得，
   该比较面保持unknown并交原设计owner，不编截图或接受偏差。
4. 前端质量：复用现组件无新抽取；采当前console/network、两尺寸可打开、溢出/主操作、
   键盘/焦点/可访问名、200%缩放，物理读屏与LCP/CLS/INP缺资源则逐项unavailable。
   现模板目标LCP<=2.5s、CLS<=0.1、INP<=200ms只按实测给结论，不以截图存在通过。
   既有board横溢/字体404/workbench刷新位置未证保持原问题，非本段授权修页面。
5. 组件复用与沉淀：action=reuse；真实consumer为两页及.inlineactions，
   token owner为载体app/globals.css；本段只在复建副本复现已交token，不引入产品组件，
   因无已独立验证的新规则/组件，沉淀写原ref和“不新增”，不新写外仓规范。
6. 独立设计审查/证据：未参与实现者沿skills/plan-design-review/SKILL.md的八维执行，
   在本轮现有独立设计审查中逐维写输入/观察/原ref/缺源owner及恢复，不加另一轮。
   八维逐字沿现方法：业务任务、IA导航、交互状态、内容数据、视觉规范、响应式布局、无障碍、真实代码交接。
   本次对象为两页声明状态/视口；同页稿缺失只限制忠实度对照，仍核可观察布局/状态/键盘等。
   计算gap仅支持间距子事实，不能冒整维通过；性能、读屏等缺源逐维保未测。
   每维均给原源、version/范围、owner与consumer；缺源只限制对应观察并给恢复。
   业务任务/交互/内容读原T018A和本次HTTP/UI；IA/视觉读当前适用原稿与两页；
   响应式按实际两个视口及第三宽缺口分别记；无障碍缺AX/键盘/辅助技术就保未测；
   真实代码交接读本次源/包/服务身份，不能由gap推其它面。
   独立原件planned: quality/reviews/p6-eight-dimension-design-review.md，
   保engine/owned session/实际URL/状态/视口/源版本及观察raw ref，不复用C12旧截图冒本次。

## 为什么现在做，依据是什么？

最终安装与上游读回只有拿完整最终包后才能判，C12实际未验业务不能替本段。
来源为R-002/004/017/018/020/026、CARD-C12-004和ADR-001/004。
P4已独立判断包，P5已判断文稿；本段不是延迟它们的首判。
任务6/7输入独立、分别首判，任务8汇总两者真实结果或具名缺口；两者可按唯一writer串行但不设相互产品依赖。
本段三张卡的原件共同交给同一发布读者，结论必须消费真实执行，合并逐条件核见spec附录，不给廉价聚合另立Phase。

## 开始前读什么？

先读前五段现原件和最新当前报告组合，不只读facts滞后投影。
作者2026-11-16实读C12归档报告:150–159/184/318及研究005的057/058/059逐项表。
C09 041/042只作历史产品未达，C11 closeout-index-v2保G8等残留，
C12 005/006/009有最终独立结论，004仍未测，不能照旧正文“待复判”或泛称全绿。
UI方法读取frontend-testing、isolated-browser-qa、frontend-component-quality当前正文；
实际执行时再按其原ready/页面审计/引擎路由合同；只读方法不冒已执行。

## 每个文件由谁改，先做什么？

本段未来只窄扩现driver复制根guard和对应scope测试；产品/载体源只读，
业务/结论沿现capture和普通记录，不新增三模式驱动。

| 路径 | 分类及唯一writer动作 | 真实consumer/承接条件 |
| --- | --- | --- |
| `tests/acceptance/c12-update-chain.mjs` | modify；只窄扩现复制根guard以接受认证C10本次owned根，复用现全部复制/身份/token/build/browser/cleanup | T006独立读回consumer；不是通用三模式driver |
| `tests/acceptance/installed-release-flow.test.mjs` | new；本段writer：验证驱动输入/失败保真及真实入口断言；固定替身和真实运行分层，不以fixture冒业务 | 本段声明下游；现输入先读回，不增第二owner |

新驱动由独立验收执行者消费，真实参数/原件ref由前段和服务owner提供。
驱动无独立状态或schema；只有本卡验收消费者保留，全部消费者由替代承接后删除。
禁止写现产品接口、上游PRD/spec/报告、载体原树、provider/Git底座和前段测试oracle。
如果修前段，由该原writer收回自己的写集；本段不临场扩权限。

新增文件创建前先由本段writer修改`docs/architecture/move-map.json`，
登记上表新增项的职责、实际consumer、测试和全部consumer迁移后的删除条件。
本段写主独占该登记动作；不新增另一份职责账本。

### 页面读回怎样复用现驱动而不重写？

2026-11-16实读c12-update-chain:532–555/884–908/1370–1385/2030–2037/2248–2254。
现CLI已有prepare、browser-env、collect、cleanup；显式task-record-root可认证C10，
p1-identity/service/design/interaction允许绝对原ref，C12_UPDATE_RUN_DIR支持本次根。
复制、十九件身份、token、build、服务、browser采集及cleanup一律复用，不新造三模式driver。
真实接口限制是assertCopyRootSafe:452–456只接受/tmp/c12-c12-p1/carrier，
认证C10专用root仍被E_COPY_ROOT_SCOPE拒绝；先用具名scope测试留真实反例，
未来仅窄扩该guard：当前TaskHandle为C10、父根是本次tracked marker/UID/inode且copy为其内固定子目录；
foreign/旧C12根不据本次授权扩删，原C12默认调用保持原行为。当前不实施此修改。

下列是未来执行的完整调用形状，变量由同一Node生命周期的真实owned根/探测端口提供，
不是用户填写凭据；本轮只运行不启动服务的scope测试。

```bash
node tests/acceptance/c12-update-chain.mjs prepare --run-id=c10-readback --copy-root="$C10_COPY_ROOT" --port="$C10_OWNED_PORT" --task-record-root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c10-release-onboarding-20261103 --source-root=/Users/Hugh/Hugh/Project/c09-carrier-new-20261103 --p1-identity=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114/quality/evidence/2026-11-14-1102-two-pages-identity.json --p1-service=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114/quality/evidence/2026-11-14-1100-two-pages-service.json --p1-design=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114/quality/evidence/2026-11-14-1108-two-pages-design-facts.json --p1-interaction=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114/quality/evidence/2026-11-14-1106-two-pages-interaction.json
node tests/acceptance/c12-update-chain.mjs browser-env --run-id=c10-readback --task-record-root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c10-release-onboarding-20261103 --p1-service=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114/quality/evidence/2026-11-14-1100-two-pages-service.json
node tests/acceptance/c12-update-chain.mjs collect --run-id=c10-readback --service-url="$C10_OWNED_URL" --task-record-root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c10-release-onboarding-20261103
node tests/acceptance/c12-update-chain.mjs cleanup --run-id=c10-readback --copy-root="$C10_COPY_ROOT" --task-record-root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c10-release-onboarding-20261103
```

collect沿installed isolated-browser-qa --run执行，host注入当前C10 task_id和owned session；
C12_UPDATE_RUN_DIR指本次copy父根，不借用旧state或原任务输出。
本任务原件从真实computed结果追加普通C10读回记录，不能只改task_id或搬旧报告。
旧driver的综合C12判词不是本任务业务/设计通过，board改前未测仍保留。
业务与结论复用下文具体原协议+capture/append，不写通用新driver。

### 真实业务的最小旅程和就绪件是什么？

适用原卡是specs/archive/workflowhub-ui-frontend-c09-dual-path-verification-20261103/
phases/P4-新侧流程贯通.md:1271–1394；隔离原件为
/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c09-dual-path-verification-20261103/quality/evidence/P4/T018A-isolation.md:17–22。
原HTTP/SQLite有限链已恢复，不再宣首GET仍死锁；原browser仍未证，不能冒整AC通过。
原脚本P4-T018A-env.sh和P4-T018A-chain.sh只作已实读合同，不重跑硬编码C09目标/写其证据。

本次最小旅程是原三张模拟卡的卡片级取消/恢复，不是运行级停止、订单或权益。

| 步骤/具体输入 | 独立预期和持久/UI读回 | 错误/重复/恢复 |
| --- | --- | --- |
| GET /api/v2/simulation-record-summaries | 200 records含simulation-qa-running/stopped/pending；board?source=live显示三态 | 不能只HTTP200，要卡ID与UI对应 |
| GET /api/v2/simulation-summaries/simulation-qa-stopped?target_session_date=2026-06-29 | 200 card.simulation_id=simulation-qa-stopped；workbench六灯/时间线/风险预算/证据边界和指标真读 | pending详情为空态；不是冻结演示态充数 |
| POST /api/v2/simulation-cards/simulation-qa-pending/discard，body={} | 200 card.discarded=true；独立GET card及外部SQLite读同真值，页面“已废弃”；strategy_version_id/history_run_ids不变 | 若初始已true只能判幂等，不拼接别次false→true |
| 停本次API后同QA根重启 | GET card仍true；外部只读SQL仍1；不reset库 | 清理/重启只核本次PID/启动时间/cwd/root；旧句柄不可复用 |
| 重复discard→restore→再restore | discard幂等200 true；restore200 false、SQL0；再restore409 | 不能把409改200；运行中卡discard409，未知卡GET404 |
| 停本次API后刷新board，再启动恢复 | 真错误态→恢复读取；同卡恢复不改策略历史 | 捕获取消先保存原件并停自有服务/浏览器；未到达段保持未测 |

外部独立oracle：PaperBuilder .venv/bin/python以sqlite3 URI mode=ro查
metadata/metadata.sqlite3中的v2_simulation_cards，读取simulation_id/state及
json_extract(payload_json,'$.discarded'/'$.archived'/'$.history_run_ids')，
只在服务进程外运行，值与HTTP/UI逐步比，不复制DB作证或让API证明自己。

本次启动命令沿原入口但绑定当前任务owned输入，不运行旧env.sh：

```bash
uv run python runtime_ops/prepare_local_qa.py --storage-root "$C10_QA_ROOT"
uv run python scripts/serve_f6.py --non-authoritative-qa --storage-root "$C10_QA_ROOT" --no-worker --host 127.0.0.1 --port "$C10_API_PORT" --readback-compat-port 0 --release-task-id workflowhub-ui-frontend-c10-release-onboarding-20261103
npm run dev -- --port "$C10_PAGE_PORT"
```

两份普通就绪原件分别由环境变量C10_DATA_READY_REF、C10_ENV_READY_REF显式给当前任务相对ref。
预写测试读原件而非猜目录；数据件至少qa_root、tasks_root、allowed_simulation_ids、
target_session_date、initial_discarded；环境件至少task_id、installed_package_root、
api_url/api_port、python_executable及下述本次源码/服务/浏览器身份。
本次变更场景要求pending初始false；若已true仅另判幂等，不能合成false→true。
前两命令cwd为只读PaperBuilder源根，最后为本次carrier副本；
PAPERBUILDER_TASKS_ROOT绑定本次独立QA任务目录，PAPERBUILDER_API_ORIGIN指本次API，
uv使用现.venv，禁止改PB源码/生产数据/重置旧QA库。命令仅规划，本轮未运行。

两份普通就绪原件在真实执行前由独立执行者经appendRecord提供：

- 数据就绪件：本次当前三卡/日期/初始discarded、策略历史、只读SQL、数据数量上限3、
  manifest local-qa-m08.v4及来源/可用授权；提供者PB C2/QA数据owner。
- 环境就绪件：最终包ref和runner安装根、当前PB源码绑定（不只HEAD）、
  自有QA根/独立TASKS根、API/page真实端口/URL/PID/cwd/启动时间、OpenAPI与两路由、
  隔离浏览器engine/session及当前控制权限；提供者PB C2/SDK/QA环境owner。

两件只对本次attempt有效，HEAD/源码字节、QA根、卡集、端口或进程身份改变即重核。
受控副作用白名单仅本次隔离QA三卡：pending discard/restore、运行卡负例及未知GET；
卡片级取消不是运行取消。只允许本次QA库、TASKS和自有服务/浏览器，禁止生产库、
外部订单/权益/账号、worker和旧C09证据/库的写入。需要真实外部许可时沿原授权核。
任一就绪件缺失、root进仓/PB生产目录、越白名单、状态码偏差或cleanup失败即停对应段，
保真实失败，交PB C2/SDK/QA具名owner恢复；其它包安装/独立页面读回不受阻。

## 怎么验证？

本段范围命令验证驱动合同，真实观察必须另外运行下列模式并由独立方判断。

```bash
node --test tests/acceptance/installed-release-flow.test.mjs
```

本轮仅补scope预写测试；现driver生产行为不改，浏览器/业务/结论命令未执行。
输入从前段实际capture返回的构建ref/输出及现服务owner显式绑定取得，不猜路径/最新文件。
未绑定必要输入时明确非零/具名缺项；这属于setup/环境，不冒目标RED或正常业务。
本轮只补具名预写测试，不实施生产；真实目标RED/原本通过/环境缺项分开记录。
后续build-code先固定目标测试和可证伪正反例；收集/导入/环境错误不算目标RED。
新目标冻结后由独立方保护，物理隔离未建立时如实披露；改断言走同卡TCR。

## 每张任务卡怎么写？

三张卡分别交跨任务读回、真实业务、原件聚合，编号按全任务递增。

### 任务 6：C10自己读回新版两页计算值

为什么做：C12同任务重放不是C10采用，原004仍缺本任务读回。
交付什么：本任务原件记录新版两页实际计算gap、对象版本、执行者与时间，并保原board改前缺口。
不做什么：载体原树/C12原报告/既有页面生产字节只读；只在本次可回收副本重建，不修既有溢出或字体错误。
前置：P1生命周期、P4最终包输入与P5成稿；C12归档报告:150–159重建入口，
原源/Users/Hugh/Hugh/Project/c09-carrier-new-20261103只读。
怎么做：步骤1，只窄扩现c12-update-chain的复制根guard，之后直接复用prepare/browser-env/collect/cleanup；在同一Node生命周期分配本任务tracked根作为当前copy父根；它不作为证据快照，原始输出/计算值直接外置task；
先核源十九件对应原1602身份，身份仅传输核对不是授权。
步骤2，只在副本app/globals.css把--inline-action-gap从12px复现为16px；
核原交付be3160ca09f6a7f983202538d5dc8eb55441a0479b4b2f536a001dc1992a5538以确定对象，
不凭hash判效果。
步骤3，在副本cwd用node node_modules/next/dist/bin/next build --webpack，
端口选择先探真实可用且避41921/41922/41923；记录自有服务URL/进程并finally停该进程，禁停用户服务。
步骤4，沿installed isolated-browser-qa --run一次自有session，
board路由切select[data-demo-state]=empty，workbench正常显示；
独立读取两页.inlineactions的computed gap和实际URL/状态/视口。
步骤5，两页计算值与时间/版本/执行者保存本任务原件后清本次scratch/自有服务/owned browser；保原始失败。只有C10读回子结果成立，
不倒填board改前未测，不自宣C12整条004通过。
怎么验收：独立浏览器按当前源计算值和模板六项UI观察协议，真实两页均读16px；CLI/hashes/token字符串不能替DOM计算值。
证据：原始命令/输出从开始保task库，quality/evidence/p6-cross-task-readback-effect.md只是计划落点，
不冒已执行。
下游（含何时停）：任务8消费本任务原件；任务7不消费也不依赖该页面读回；缺源/引擎/服务条件回原owner，不能复用C12同任务日志补。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T006
- **来源 / FR / AC**：CARD-C12-004、R-026；ADR-001/004；FR-C10-012；AC-C10-013；本任务原件记录新版两页实际计算gap、对象版本、执行者与时间，并保原board改前缺口。
- **输入**：P1生命周期、P4最终包输入与P5成稿；C12归档报告:150–159重建入口，原源/Users/Hugh/Hugh/Project/c09-carrier-new-20261103只读。；producer为原交付owner，独立执行者在本卡实际运行时取得真实当前字节。
- **文件 / 符号**：`tests/acceptance/c12-update-chain.mjs`；`tests/acceptance/installed-release-flow.test.mjs`；`docs/architecture/move-map.json`；符号：c12-update-chain现prepare/browser-env/collect/cleanup及复制根guard窄扩展；只读既有createTrackedTempDir和C12报告原重建入口。
- **动作**：步骤1，只窄扩现c12-update-chain的复制根guard，之后直接复用prepare/browser-env/collect/cleanup；在同一Node生命周期分配本任务tracked根作为当前copy父根；它不作为证据快照，原始输出/计算值直接外置task；；先核源十九件对应原1602身份，身份仅传输核对不是授权。；步骤2，只在副本app/globals.css把--inline-action-gap从12px复现为16px；；核原交付be3160ca09f6a7f983202538d5dc8eb55441a0479b4b2f536a001dc1992a5538以确定对象，；不凭hash判效果。；步骤3，在副本cwd用node node_modules/next/dist/bin/next build --webpack，；端口选择先探真实可用且避41921/41922/41923；记录自有服务URL/进程并finally停该进程，禁停用户服务。；步骤4，沿installed isolated-browser-qa --run一次自有session，；board路由切select[data-demo-state]=empty，workbench正常显示；；独立读取两页.inlineactions的computed gap和实际URL/状态/视口。；步骤5，两页计算值与时间/版本/执行者保存本任务原件后清本次scratch/自有服务/owned browser；保原始失败。只有C10读回子结果成立，；不倒填board改前未测，不自宣C12整条004通过。
- **输出 / 失败**：本任务原件记录新版两页实际计算gap、对象版本、执行者与时间，并保原board改前缺口。；失败按输入包/ref/服务对象不匹配或真实环境缺失时，停受影响旅程保原错误和提供者；包/接入/方法/README问题分别回P4/P2/P3/P5原writer，页面和业务环境回原owner；同一独立方按修复影响定向复验，不用替身填通过
- **边界 / 禁止改动**：载体原树/C12原报告/既有页面生产字节只读；只在本次可回收副本重建，不修既有溢出或字体错误。
- **依赖**：P1、P4、P5
- **测试层级 / 技能**：UI真实计算值/本次方法安装消费；frontend-testing预判，isolated-browser-qa原网关；UI六项见本段。；只测本卡当前面，不全量回归。
- **场景 / 夹具或服务**：原源身份正确及缺源/错版本；board empty/workbench正常；1440×900/390×844；应用取消/浏览器清理失败；原board改前缺口保留。
- **预写测试**：真实现prepare guard只许可旧C12根，认证C10 owned root已到达E_COPY_ROOT_SCOPE目标断言；foreign root保拒绝基线。当前DOM计算值/八维设计/浏览器清理未执行，不凭scope RED算页面效果完成。
- **可观察接缝**：独立浏览器按当前源计算值和模板六项UI观察协议，真实两页均读16px；CLI/hashes/token字符串不能替DOM计算值。
- **RED/GREEN 门禁命令**：`node --test tests/acceptance/installed-release-flow.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0；目标assertion须到达；缺资源或导入错误单列，不冒目标RED。
- **RED 目标失败**：ORACLE-CROSS-TASK-READBACK；当前认证C10 owned root被现copy guard错误拒绝的具名断言先失败；当前计算值/把token当DOM的原目标尚需真实浏览器，不把scope结果代它。
- **RED 证据**：actual: `quality/tests/2026-11-16-050-c10-repair-readback-and-business-tests.output`中C10 root错误拒绝断言失败；计算值/设计/清理未执行。
- **GREEN 判定器**：ORACLE-CROSS-TASK-READBACK；当前C10真实两页computed gap为16px且有身份/时间/执行者原件，旧未测仍显露。
- **证据**：planned: `quality/evidence/p6-cross-task-readback-effect.md`；原capture/独立读回与实际输入版本一同引用，固定输入与真实服务分开。
- **覆盖上限**：只证C10自身新版读回；不补原board改前值、C12整条004、原全部页面质量或实际业务。
- **停止 / 恢复**：输入包/ref/服务对象不匹配或真实环境缺失时，停受影响旅程保原错误和提供者；包/接入/方法/README问题分别回P4/P2/P3/P5原writer，页面和业务环境回原owner；同一独立方按修复影响定向复验，不用替身填通过
- **测试变更请求**：本轮预写稿的夹具修正旧字节及原失败已留019–023，未改目标期望方向；最终冻结后任何断言变更回原owner和独立批准者，保原因/影响/原失败/复验，不改判据求绿。
- **完成**：前置（不作完成条件）：命令可执行且真实原件可读。完成条件（只写效果）：独立执行者按Appendix A原判据复放本卡消费者效果、反例及限制；语义未执行记incomplete，判定者为本卡独立测试/读者，协议为本卡场景，计划落点`quality/evidence/p6-cross-task-readback-effect.md`；机器面未跑不冒通过。

### 任务 7：从最终安装包运行真实业务流程

为什么做：当前PRD称C12已验业务与实际报告冲突，真实安装后运行必须由C10自验。
交付什么：安装路径加载的真实caller/skill、请求处理、必要持久结果、UI读回及失败段原件对应当前输入。
不做什么：禁止用源码checkout、C12演示态、HTTP200、toast、固定fixture、单测或审查回执代真实业务；不改服务生产或前段实现。
前置：P2双宿主已验接入、P3终末方法、P4构建ref、P5成稿、T018A/P06-7当前真实业务入口/服务/可控数据由原服务owner提供，
现未核可用。
怎么做：步骤1，从前段实际构建输入按spec外层/runner/skill-bundle布局重建一次最终包并记录三根实际位置，只做README/最终依赖受影响定向解析，
不重跑前段已闭环全部判据。
步骤2，干净目标只装该包；明确调用`installRunnerRelease({releaseRoot:releaseRoot+"/runner",skillBundleRoot:releaseRoot+"/skill-bundle"})`，npm ci/Git只在runner根，标准bundle保持不变；隔离目标授权单列，onboard不代调。
步骤3，按README与P2真实宿主从安装位置加载caller/skill，保存实际解析路径/版本，不从源码或外部缓存补缺件。
步骤4，读取T018A/P06-7原入口及当前服务owner的真实输入绑定；无绑定/服务不存在时停止该业务路径并写真实尝试、缺件、提供者和恢复，不换假服务求绿。
步骤5，真实执行一条声明业务旅程，记录请求→处理→必要持久结果→UI读回，以及有意义服务失败/重复操作/可捕获取消恢复；所需外部写按原授权且作用域可控，
结果与页面状态对应。
步骤6，独立执行者按原AC读回原件并分别说明技术安装/宿主调用/真实业务；产品缺陷回原Phase，真实环境缺项保持未测。清理仅本次可再生物，
自有服务先停再dispose。
怎么验收：真实入口实际效果与请求/处理/持久/页面读回协议；本段测试命令含复制根合同及具名HTTP/外部SQL子集；缺两就绪件只跳过真实路径，
同根重启/UI/离线恢复/cleanup仍须独立观察原件，不能把测试子集通过冒整业务通过。
证据：原始命令/输出从开始保task库，quality/evidence/p6-installed-business-effect.md只是计划落点，
不冒已执行。
下游（含何时停）：任务8消费真实效果与未完成条件；业务失败不妨碍其它安全结论，但禁止把安装成功写业务通过。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T007
- **来源 / FR / AC**：R-002、R-017、R-018、R-020、R-026；ADR-001/004；FR-C10-008；AC-C10-6；安装路径加载的真实caller/skill、请求处理、必要持久结果、UI读回及失败段原件对应当前输入。
- **输入**：P2双宿主已验接入、P3终末方法、P4构建ref、P5成稿、T018A/P06-7当前真实业务入口/服务/可控数据由原服务owner提供，现未核可用。；producer为原交付owner，独立执行者在本卡实际运行时取得真实当前字节。
- **文件 / 符号**：`tests/acceptance/installed-release-flow.test.mjs`只读已预写合同；符号：captureCommand/appendRecord与具名测试callback；本卡记录事实，不修改任务6 driver或move-map，不新建通用运行模式。
- **动作**：步骤1，从前段实际构建输入按spec外层/runner/skill-bundle布局重建一次最终包并记录三根实际位置，只做README/最终依赖受影响定向解析，；不重跑前段已闭环全部判据。；步骤2，干净目标只装该包；明确调用`installRunnerRelease({releaseRoot:releaseRoot+"/runner",skillBundleRoot:releaseRoot+"/skill-bundle"})`，npm ci/Git只在runner根，标准bundle保持不变；隔离目标授权单列，onboard不代调。；步骤3，按README与P2真实宿主从安装位置加载caller/skill，保存实际解析路径/版本，不从源码或外部缓存补缺件。；步骤4，读取T018A/P06-7原入口及当前服务owner的真实输入绑定；无绑定/服务不存在时停止该业务路径并写真实尝试、缺件、提供者和恢复，不换假服务求绿。；步骤5，真实执行一条声明业务旅程，记录请求→处理→必要持久结果→UI读回，以及有意义服务失败/重复操作/可捕获取消恢复；所需外部写按原授权且作用域可控，；结果与页面状态对应。；步骤6，独立执行者按原AC读回原件并分别说明技术安装/宿主调用/真实业务；产品缺陷回原Phase，真实环境缺项保持未测。清理仅本次可再生物，；自有服务先停再dispose。
- **输出 / 失败**：安装路径加载的真实caller/skill、请求处理、必要持久结果、UI读回及失败段原件对应当前输入。；失败按输入包/ref/服务对象不匹配或真实环境缺失时，停受影响旅程保原错误和提供者；包/接入/方法/README问题分别回P4/P2/P3/P5原writer，页面和业务环境回原owner；同一独立方按修复影响定向复验，不用替身填通过
- **边界 / 禁止改动**：禁止用源码checkout、C12演示态、HTTP200、toast、固定fixture、单测或审查回执代真实业务；不改服务生产或前段实现。
- **依赖**：P2、P3、P4、P5
- **测试层级 / 技能**：安装后真实端到端/真实业务；frontend-testing预判、按实际API面复用backend-testing；浏览器沿唯一网关。；只测本卡当前面，不全量回归。
- **场景 / 夹具或服务**：当前最终包/已声明双宿主；真实服务正常/具名失败/取消/重复；缺包入口/错安装路径；服务未提供不得冒通过。
- **预写测试**：tests/acceptance/installed-release-flow.test.mjs已预写真实安装caller/具体HTTP+外部只读SQL断言；本轮缺C10_DATA_READY_REF/C10_ENV_READY_REF而跳过，不能冒目标RED。重启/真实UI/离线与取消恢复及cleanup原件尚缺。
- **可观察接缝**：真实入口实际效果与请求/处理/持久/页面读回协议；本段测试命令只测驱动合同，具体原业务协议另运行并独立判。
- **RED/GREEN 门禁命令**：`node --test tests/acceptance/installed-release-flow.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0；目标assertion须到达；缺资源或导入错误单列，不冒目标RED。
- **RED 目标失败**：ORACLE-INSTALLED-FLOW；缺实际安装caller或业务必要结果却报成功的具名assertion失败；setup/服务不可用另记。
- **RED 证据**：actual: `quality/tests/2026-11-16-050-c10-repair-readback-and-business-tests.output`中ORACLE-INSTALLED-FLOW为SKIP，两显式就绪原件未提供；不是RED，真实重启/UI/离线/清理缺口保留。
- **GREEN 判定器**：ORACLE-INSTALLED-FLOW；实际安装入口和业务各段结果均可回读，具名失败/取消恢复有真实观察；缺输入不冒成功。
- **证据**：planned: `quality/evidence/p6-installed-business-effect.md`；原capture/独立读回与实际输入版本一同引用，固定输入与真实服务分开。
- **覆盖上限**：只覆盖一条声明实际旅程和所测环境；固定driver测试不证明外部服务、未声明宿主、全业务或远端上线。
- **停止 / 恢复**：输入包/ref/服务对象不匹配或真实环境缺失时，停受影响旅程保原错误和提供者；包/接入/方法/README问题分别回P4/P2/P3/P5原writer，页面和业务环境回原owner；同一独立方按修复影响定向复验，不用替身填通过
- **测试变更请求**：当前未发生测试变更；冻结后任何断言变更回原owner和独立批准者，保原因/影响/原失败/复验，不改判据求绿。
- **完成**：前置（不作完成条件）：命令可执行且真实原件可读。完成条件（只写效果）：独立执行者按Appendix A原判据复放本卡消费者效果、反例及限制；语义未执行记incomplete，判定者为本卡独立测试/读者，协议为本卡场景，计划落点`quality/evidence/p6-installed-business-effect.md`；机器面未跑不冒通过。

### 任务 8：消费全部原件并给六层发布结论

为什么做：局部通过不能说明整卡交付、质量和物理收尾都发生。
交付什么：每条AC有当前原件/状态/owner，六层分别列事实和未完成，沿途九包范围无无主遗漏。
不做什么：不重跑前段已闭环或改旧报告，不自签独立质量，不以已授权动作文本验证动作已发生，不写第二进度账本。
前置：P1至P5首判及任务6/7原件、真实当前diff/最终包、独立终末审查；原用户选择/授权/最终范围答复如实际存在，不能预填。
怎么做：步骤1，逐条原需→当前FR/唯一AC→独立Phase/Task→真实原件双向核；旧九包来源只作覆盖，不按九个状态行数冒完成。
步骤2，当前C12报告与057/058/059组合读回，005/006/009不因旧正文滞后重新写未判；004和业务未测/失败及C11残留分别保owner。
步骤3，独立终末质量按现build-code最终整份diff/包和canonical原件；finding回原实施同会话，受影响独立方复验后读新原件，
原失败不覆写。
步骤4，逐层写能力、质量、用户验收、包安装/兼容、Git/远端发布、物理清理；插件形式未做、未验证宿主、PRD业务冲突及真实未执行动作均单列。
步骤5，运行现run-checks仅取真实十环及missing_steps，环10在build-code为skipped；
原caller实际stage-close后才补stage-closed原件，不提前写全链成功。
步骤6，norm-sync/reflection/成本/当前final-report按现owner产出；关闭reader拿真实final-report 
ref/sha继续P3方法的条件链，最终提交/PR/merge/push/归档/清理逐项读回。
怎么验收：独立读者以真实ref/cwd/argv/exit/版本/时间核结论，受控缺ref/缺结果负例不能通过；全部首判原件只读汇总。
证据：原始命令/输出从开始保task库，quality/evidence/p6-layered-conclusion-effect.md只是计划落点，
不冒已执行。
下游（含何时停）：用户和维护者拿当前最终报告/不可变handoff与真实动作范围；当前计划未确认，正式实施和后续Git均未发生。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T008
- **来源 / FR / AC**：R-004、R-011、R-012、R-018、R-019、R-020、R-026、R-028；ADR-001/003/004；FR-C10-009、FR-C10-011；AC-C10-7、AC-C10-8、AC-C10-010；其它AC只在本Phase末段聚合，不作为本卡新首判；每条AC有当前原件/状态/owner，六层分别列事实和未完成，沿途九包范围无无主遗漏。
- **输入**：P1至P5首判及任务6/7原件、真实当前diff/最终包、独立终末审查；原用户选择/授权/最终范围答复如实际存在，不能预填。；producer为原交付owner，独立执行者在本卡实际运行时取得真实当前字节。
- **文件 / 符号**：`tests/acceptance/installed-release-flow.test.mjs`只读已预写合同；符号：captureCommand/appendRecord与具名测试callback；本卡记录事实，不修改任务6 driver或move-map，不新建通用运行模式。
- **动作**：步骤1，逐条原需→当前FR/唯一AC→独立Phase/Task→真实原件双向核；旧九包来源只作覆盖，不按九个状态行数冒完成。；步骤2，当前C12报告与057/058/059组合读回，005/006/009不因旧正文滞后重新写未判；004和业务未测/失败及C11残留分别保owner。；步骤3，独立终末质量按现build-code最终整份diff/包和canonical原件；finding回原实施同会话，受影响独立方复验后读新原件，；原失败不覆写。；步骤4，逐层写能力、质量、用户验收、包安装/兼容、Git/远端发布、物理清理；插件形式未做、未验证宿主、PRD业务冲突及真实未执行动作均单列。；步骤5，运行现run-checks仅取真实十环及missing_steps，环10在build-code为skipped；；原caller实际stage-close后才补stage-closed原件，不提前写全链成功。；步骤6，norm-sync/reflection/成本/当前final-report按现owner产出；关闭reader拿真实final-report ；ref/sha继续P3方法的条件链，最终提交/PR/merge/push/归档/清理逐项读回。
- **输出 / 失败**：每条AC有当前原件/状态/owner，六层分别列事实和未完成，沿途九包范围无无主遗漏。；失败按输入包/ref/服务对象不匹配或真实环境缺失时，停受影响旅程保原错误和提供者；包/接入/方法/README问题分别回P4/P2/P3/P5原writer，页面和业务环境回原owner；同一独立方按修复影响定向复验，不用替身填通过
- **边界 / 禁止改动**：不重跑前段已闭环或改旧报告，不自签独立质量，不以已授权动作文本验证动作已发生，不写第二进度账本。
- **依赖**：T006、T007
- **测试层级 / 技能**：原件/独立质量与结论语义；现wh-review/OCR方法，技术路线以真实diff选，不重跑全量。；只测本卡当前面，不全量回归。
- **场景 / 夹具或服务**：原件齐全及缺ref/错误任务/未测冒通过；C12最终判词与旧正文冲突；实际动作未执行/部分失败；环10未关闭。
- **预写测试**：结论卡不新建运行driver；普通证据/独立读者按原run-checks和六层协议消费，当前前段未交付与独立终末质量缺失，伪成功反例/结论首判未执行，不用任务6 scope测试代本卡判定。
- **可观察接缝**：独立读者以真实ref/cwd/argv/exit/版本/时间核结论，受控缺ref/缺结果负例不能通过；全部首判原件只读汇总。
- **RED/GREEN 门禁命令**：`node --test tests/acceptance/installed-release-flow.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0；目标assertion须到达；缺资源或导入错误单列，不冒目标RED。
- **RED 目标失败**：ORACLE-LAYERED-CONCLUSION；缺真实原件/未测业务被写通过或环10未执行被填成功的具名assertion失败。
- **RED 证据**：planned: `quality/tests/t008-target-red.output`；当前未执行，目标测试owner在实施前提供真正目标断言和来源。
- **GREEN 判定器**：ORACLE-LAYERED-CONCLUSION；独立读者按原AC辨认六层事实/缺口及来源，受控伪成功输入被拒绝，实际未执行明确。
- **证据**：planned: `quality/evidence/p6-layered-conclusion-effect.md`；原capture/独立读回与实际输入版本一同引用，固定输入与真实服务分开。
- **覆盖上限**：结论与结构命令不证明未执行动作或业务，审查不可用保持限制；仅聚合当前本卡范围，不改上游/历史。
- **停止 / 恢复**：输入包/ref/服务对象不匹配或真实环境缺失时，停受影响旅程保原错误和提供者；包/接入/方法/README问题分别回P4/P2/P3/P5原writer，页面和业务环境回原owner；同一独立方按修复影响定向复验，不用替身填通过
- **测试变更请求**：当前未发生测试变更；冻结后任何断言变更回原owner和独立批准者，保原因/影响/原失败/复验，不改判据求绿。
- **完成**：前置（不作完成条件）：命令可执行且真实原件可读。完成条件（只写效果）：独立执行者按Appendix A原判据复放本卡消费者效果、反例及限制；语义未执行记incomplete，判定者为本卡独立测试/读者，协议为本卡场景，计划落点`quality/evidence/p6-layered-conclusion-effect.md`；机器面未跑不冒通过。

## 下一消费者拿什么继续？

原caller拿唯一final-report精确ref/sha、全部AC原档位、未完成/真实尝试和独立质量原件。
P3方法负责实际条件收尾；最终范围确认只覆盖真实具名归档/删除，不把计划确认替代它。
不可变handoff由现stage-handoff owner发布并独立读回，本段只交输入不造第二账本。

## 验收 Phase 才能做的检查

本段是唯一末验，首判以外只读对账和必要未闭环补验。

- 输入一致：读取前段原件与真实当前最终包，不绑跨Phase整树快照。
- 含义对齐：逐条原始需求/已选取舍/上游限制/当前实现/AC同义，冲突回原owner。
- 测试充分：确认每个具名正常/错误/取消/幂等面真实到达目标；替身、setup失败、缺RED和未知影响逐项披露。
- 分诊与复验：可复现性/根因/责任Phase/独立受影响复验、TCR理由/影响/批准按原规则留原件，不用改oracle求绿。
- 结论六项：评估/局限、偏差/原因、未充分测试特性、未解决事件、残留风险、签核对象由独立读者逐项写，不新增报告类型。
- 回写：修复涉及原场景/AC/Phase覆盖/任务facts/处置原件时由其原owner改本应改的项，禁止本段越界。
- 完成语义：缺输入保持具名未完成；全AC聚合不重签前段通过，只有最终边界AC按现方法在最终字节首判。

## 任务编号怎样对照？

| 正文 | 机器编号 | 独立增量 |
| --- | --- | --- |
| 任务6 | T006 | C10自身新版两页读回 |
| 任务7 | T007 | 最终安装后实际业务 |
| 任务8 | T008 | 全AC原件与六层结论 |

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计（全局权威）`
- **写入集**：`tests/acceptance/c12-update-chain.mjs`；`tests/acceptance/installed-release-flow.test.mjs`；`docs/architecture/move-map.json`
- **依赖**：P1、P2、P3、P4、P5
- **消费者**：用户、原终末caller与后续发布维护者
- **gate_cmd**：`node --test tests/acceptance/installed-release-flow.test.mjs`
- **oracle**：ORACLE-INSTALLED-FLOW
- **evidence_path**：planned: `quality/evidence/p6-layered-conclusion-effect.md`
- **STOP**：输入包/ref/服务对象不匹配或真实环境缺失时，停受影响旅程保原错误和提供者；包/接入/方法/README问题分别回P4/P2/P3/P5原writer，页面和业务环境回原owner；同一独立方按修复影响定向复验，不用替身填通过
- **覆盖 AC**：AC-C10-1、AC-C10-2、AC-C10-3、AC-C10-4、AC-C10-5、AC-C10-6、AC-C10-7、AC-C10-8、AC-C10-009、AC-C10-010、AC-C10-011、AC-C10-012、AC-C10-013
- **Done**：前置（不作完成条件）：当前原件与范围命令可读。完成条件（只写效果）：逐条按同一Appendix A给AC-C10-1、AC-C10-2、AC-C10-3、AC-C10-4、AC-C10-5、AC-C10-6、AC-C10-7、AC-C10-8、AC-C10-009、AC-C10-010、AC-C10-011、AC-C10-012、AC-C10-013的消费者效果/反例及原件；语义未执行记incomplete，具体独立判定者/协议在本文件验收节，计划落点为`quality/evidence/p6-layered-conclusion-effect.md`；当前只规划未实施，机器面未执行不报pass，真实资源缺失给owner和恢复条件。
