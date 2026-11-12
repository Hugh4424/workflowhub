# Phase P3 — v15 全状态全视口逐格观察与八维设计审查

本文件写给采集执行者、独立复核者与 P5 差异审查者；读完要能找到逐格报告的落点、状态进入序列、门禁命令、八维审查的输入与失败恢复。

## 这一 Phase 交出什么？

v15 在十一个状态、三个视口下逐格留下可回读的观察件，并由实施者之外的人交出八维设计审查与发现处置。

- **本 Phase 结果**：`quality/evidence/c11-p3-cells-index.md` 的每一行都能打开该格的 console、network、根元素溢出与对象身份；`c11-p3-review-eight.md` 八维各有结论且带未覆盖项。
- **非目标**：不改 v15 与载体的字节（本 Phase 只观察）；不审完整 diff 与四维代码质量（P5）；不代答 C05-P3 的完整范围答复（归 C12）；不重做 C02 全量验收。
- **改动前**：C09 判词指出 v15 当前字节的整页内容、状态与视口独立判断未取得，八维审查不存在（台账 G3、G4）。
- **改动后**：状态×视口矩阵逐格有索引与原件；八维审查稿与发现表可回读，未测格具名保留。
- **与相邻 Phase 的边界**：P1 交出 v15 定稿字节；本 Phase 在其上观察与审查，不改字节；P5 只取本 Phase 的逐格报告做完整差异审查。
- **主要风险**：把“页面能打开”当成“状态已到位”，或把审计器的 `--state` 坐标当成页面事实。返工时的替代走法是回到 P1 定稿字节重采该格，旧原件保留。
- **下一步**：P5 读索引与逐格原件；P6 抽两条按指针核原件。
- **动手前必读**：`v15/2026-11-11-002-t019-v15-pending-busy-index.html:113-130`、`v15/2026-11-11-001-t019-v15-pending-busy-app.js:21-45`、`skills/frontend-testing/scripts/run-page-audit.mjs:20-30`。
- **未决事实**：`unknown` — 审计器窗口在 v15 上的导航细节尚未实测；影响是该格可能在采集中被重载回“未选”。每格都在采集前落 `state.txt`，采集后如发现标记漂移，该格按未测记并报本卡 owner，不用漂移后的读数冒充。

## 这一 Phase 怎么验收？

成本账：T001 120 分钟、T002 60 分钟，串行（T002 读 T001 的报告），`acceptance_cost_total=180 active_min`；两条 `retry_cap=1` 的重试预留单列，不计入活动总额。`phase_budget={soft_min:180,hard_min:360,variance_threshold:1.5,source:provisional}`，是估算，不是实测。
资源账：v15 副本、python3 静态服务、agent-browser 0.36.0 无头会话、既有页面审计器与采集器；全部就地复用，不新造采集器。
范围账：本 Phase 只承接验收 3 与验收 4（AC-C11-003、AC-C11-004），其它验收不在这里判。

**验收 3：状态与视口逐格观察**（AC-C11-003）

目标：v15 的十一个状态与三个视口逐格留下可回读的观察件，每格能读到 console、network、根元素溢出与对象身份；“处理中”以瞬时态观察单列；任一必需格未测则整项记未修。
怎么操作：从副本根起静态服务，按本卡“状态进入表”用页面只读 URL 状态入口（`?state=<名称>`）打开每一格，读 `#demo-result` 的 `data-state` 与声明值比对，通过后跑页面审计器与三项采集（采集器重载页面时入口会复现同一状态），逐格落盘并写索引；再任选两格用同一命令重跑到另一目录比对；最后把一格身份故意写错，跑门禁。
什么条件：服务必须从副本根起（页面跨目录引用 v11/v12/v14 资源），地址 `http://127.0.0.1:8080`，入口 `/v15/2026-11-11-002-t019-v15-pending-busy-index.html`；状态由 P1 提供的只读 URL 入口进入，采集器重载页面时该入口把状态复现，因此每格的四项采集都发生在声明状态下；该入口只驱动既有状态机，不给页面加业务分支；三个视口是 1440×900、1280×900、390×844；身份五项经 `PAGE_AUDIT_*` 环境变量或同名参数传入，缺一即退出 2；`--out` 必须落在 `quality/evidence/` 且不覆盖；`--state` 与 URL 的 `state` 参数取同一值，作为审计坐标与身份比对依据。
怎样算通过：T001 门禁退出 0 且输出 `bad:[]` 与单一 identity；索引逐行可打开报告，报告的 `object.state` 与索引“页面 state 标记”一致，`state.txt` 与声明值一致，采集器 `failures` 为空；任何一格的 `data-state` 读数不等于声明值，该格直接判失败，不进入采集，也不写入索引的通过行；抽查两格重跑，条目集合、根元素溢出读数与身份五项一致（时间戳与耗时数值除外）。
故意弄坏一处：把任一格索引的“页面 state 标记”改成另一状态，或把该格 `report.json` 的 `object.route` 改成别的路径，同一门禁必须非零并在输出里点名该格；未改回前不得报通过。
真跑还是替代：真跑。审计器与采集器是既有工具；瞬时态用页内观察器记录同一页面的真实事件，属同一对象的观察而不是替代；不新造采集器。
谁判与证据：未参与采集的独立复核者，在 T001 交回索引与逐格原件后判定；读索引、任抽两格目录（`report.json`、`state.txt`、`p5-audit-*/console|network|overflow.json`）、抽查重跑原件与门禁原始输出；结论写 T001「完成」与 `quality/evidence/c11-p3-cells-index.md`。
失败回修与停止：状态未到位、身份不一致或格子缺失时，先分诊是驱动序列问题还是采集器问题；驱动问题回采集执行者按同一格重进，采集器问题保原错误并记该格未测；已测格保留，不因单格失败改写其它格；同一格两次仍不到位停手报主会话，整项按未修登记。

**验收 4：八维独立设计审查**（AC-C11-004）

目标：八维各有结论、输入、观察、证据与未覆盖项；执行者不是实施者；发现逐条有处置与复验。
怎么操作：独立审查者逐维复读 v15 当前字节与 T001 报告，在真实会话里复核交互与呈现，写审查稿与发现表；第二读者把某一维的观察替换成“只看截图”，跑同一门禁。
什么条件：v15 当前字节（P1 定稿）与 T001 报告可读；浏览器会话可复核交互；审查稿首部写明审查者与实施者两个身份且不相同；发现表逐条有处置与复验列。
怎样算通过：T002 门禁退出 0 且八维齐全、逐维四件齐、观察是可复读的观察而不是截图结论；发现表每行处置与复验非空；没有发现时文件写明“无发现”。
故意弄坏一处：把任一维“观察”替换成“只看截图”，同一门禁必须非零并点名该维；截图不能作为该维成立的证据。
真跑还是替代：真跑。审查是人读判定，命令只判结构与替代检测，不代替审查结论；八维的语义判断由独立审查者给。
谁判与证据：未参与实施的独立审查者给结论，处置复验由另一独立执行者判；读 `quality/evidence/c11-p3-review-eight.md`、`c11-p3-findings.md`、T001 报告与门禁原始输出；结论写 T002「完成」。
失败回修与停止：缺维、缺未覆盖项或观察是截图结论时回 T002 审查者补正；发现无处置时把该发现退回原处置 owner 并保留原稿；同一维两次仍不合格停手报主会话，该维记未测，其余维照常收口。

## 为什么现在做，依据是什么？

P1 交出 v15 定稿字节后，才能在同一份字节上判“整页每个状态、每个视口都被看过”。

- **结果**：状态×视口矩阵逐格可回读，八维审查有独立结论。
- **非目标**：不改 v15 字节、不做代码 diff、不代答 C05-P3。
- **与其它 Phase 的区别**：本 Phase 判观察与设计审查，P5 判完整代码差异。
- **依据**：缺口台账 G3、G4 与 `spec.md#实现设计（全局权威）` 的“需求到任务追踪”把 R-003/R-004 绑到 P3/T001、P3/T002 与 ORACLE-C11-AUDIT、ORACLE-C11-DESIGN；`decision-log.md:154` 写明本包只审 v15、不代答 C05-P3。

## 开始前读什么？

| 材料或锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#Appendix A` 的 AC-C11-003、AC-C11-004 | 读唯一判据与证据名；本卡只引用编号 | 开工前 |
| `quality/evidence/2026-11-12-011-c11-gap-ledger-v4.md:37-58` | 读 G3、G4 的原判与反例 | 开工前 |
| `v15/2026-11-11-001-t019-v15-pending-busy-app.js:1-45` | 读状态机、`dataset.state` 与 150ms 定时 | 写卡前 |
| `v15/2026-11-11-002-t019-v15-pending-busy-index.html:113-130` | 读控件 id 与初始状态 | 写卡前 |
| `skills/frontend-testing/scripts/run-page-audit.mjs:20-30` | 读必填参数、身份五项与退出 2 条件 | 实施前 |
| `skills/frontend-testing/scripts/collect-overflow.mjs:6-10` | 读溢出只取根元素两值 | 实施前 |
| `skills/frontend-testing/scripts/collect-a11y.mjs:6-9` | 读可访问树只给 node_id/role/name/focusable | 实施前 |

## 每个文件由谁改，先做什么？

- **新增**：`quality/evidence/c11-p3-cells-index.md`（T001 写）；`quality/evidence/c11-p3-review-eight.md`、`quality/evidence/c11-p3-findings.md`（T002 写）。
- **修改**：`N/A — 本 Phase 不改仓库正文与 v15 字节`。
- **证据原件**：每格目录 `quality/evidence/c11-p3-cells/<state>-<viewport>/` 放 `report.json`、`state.txt` 与 `p5-audit-*/console|network|overflow.json`；“处理中”格放 `observer.json`。它们是单份原件，由索引逐格登记，不另入材料写入集。
- **禁止改动**：v15 副本字节、载体两页、`spec.md`、`decision-log.md`、P1 数据文件与 P1 证据；证据只增不改，`--out` 不覆盖已有文件。

| 顺序 | 文件或目录 | 唯一写主 | 消费者 |
| --- | --- | --- | --- |
| 1 | `quality/evidence/c11-p3-cells/` 与索引 | T001 采集执行者 | T002、P5、P6 |
| 2 | `c11-p3-review-eight.md`、`c11-p3-findings.md` | T002 独立审查者 | P5、P6 |

T002 必须读 T001 的报告，所以两卡串行；同一路径只有一名写主，没有并行组。

## 怎么验证？

开工前四要素：验证层是采集级与页面观察；命令是下方两条门禁；预期是 GREEN 退出 0、RED 非零；失败条件是采集器未启动、状态未到位、身份不一致或缺格。

两条门禁都是可直接执行的整条命令，cwd 不影响结果（脚本只读绝对路径）；下面路径里的任务根是 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112`。RED 与 GREEN 共用同一条命令，RED 由改坏一格的身份或状态产生。

**T001 逐格门禁**

```bash
node --input-type=module -e 'import{readFileSync,existsSync,readdirSync}from"node:fs";import{createHash}from"node:crypto";const R="/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence",S=["unselected","ready","pending","success","duplicate","empty","error","permission","partial","unknown","recovered"],V=["1440x900","1280x900","390x844"],IDK=["workspace","service","object_version","engine_session"],bad=[],idn=new Set(),rts=new Set(),P=f=>{try{return readFileSync(f)}catch(e){console.log(JSON.stringify({bad:["unreadable:"+f]}));process.exit(2)}};const idx=P(R+"/c11-p3-cells-index.md").toString("utf8").split(/\r?\n/).filter(l=>/^\|\s*(?:[a-z]+)\s*\|/.test(l)).map(l=>l.split("|").slice(1,-1).map(s=>s.trim()));for(const s of S)for(const v of V){const r=idx.find(x=>x[0]===s&&x[1]===v);if(!r){bad.push("missing:"+s+":"+v);continue}const ref=R+"/"+r[2];if(!existsSync(ref)){bad.push("noreport:"+s+":"+v);continue}const dir=ref.replace(/\/[^/]+$/,"");if(r[5]==="transient"){const o=JSON.parse(P(ref).toString("utf8"));if(o.seen_pending!==true||!Array.isArray(o.states)||!o.states.includes("pending"))bad.push("transient:"+s+":"+v);if(!String(r[4]).startsWith("pending→"))bad.push("transient-state:"+s+":"+v);if(!o.identity||!o.events||!Array.isArray(o.events.console)||!Array.isArray(o.events.network)){bad.push("transient-shape:"+s+":"+v);continue}idn.add(IDK.map(k=>o.identity[k]).join("~"));rts.add(String(o.identity.route||""));if(!String(o.identity.route||"").includes("state="+s))bad.push("route-state:"+s+":"+v)}else{const b=P(ref),j=JSON.parse(b.toString("utf8")),ob=j.object||{};if(createHash("sha256").update(b).digest("hex")!==r[3])bad.push("sha:"+s+":"+v);if(ob.state!==s||r[4]!==s)bad.push("state:"+s+":"+v);const st=dir+"/state.txt";if(!existsSync(st)||readFileSync(st,"utf8").trim()!==s)bad.push("marker:"+s+":"+v);const os=dir+"/observed-state.json";if(!existsSync(os))bad.push("observed-missing:"+s+":"+v);else{const ob2=JSON.parse(P(os).toString("utf8"));if(ob2.state!==s||typeof ob2.command!=="string"||!ob2.observed_at)bad.push("observed:"+s+":"+v)}idn.add(IDK.map(k=>ob[k]).join("~"));rts.add(String(ob.route||""));if(!String(ob.route||"").includes("state="+s))bad.push("route-state:"+s+":"+v);const org=readdirSync(dir).filter(n=>n.startsWith("p5-audit-"));if(org.length!==1)bad.push("originals:"+s+":"+v);else for(const d of ["console","network","overflow"]){const p=dir+"/"+org[0]+"/"+d+".json";if(!existsSync(p)){bad.push(d+":"+s+":"+v);continue}const o=JSON.parse(P(p).toString("utf8"));if(!o.object||o.object.state!==s||(o.failures||[]).length>0)bad.push(d+"-obj:"+s+":"+v)}}}if(idn.size!==1)bad.push("identity-drift:"+idn.size);if(rts.size!==11)bad.push("route-drift:"+rts.size);console.log(JSON.stringify({rows:idx.length,identity:[...idn],route_values:rts.size,bad}));process.exit(bad.length?1:0)'
```

**T002 逐维门禁**

```bash
node --input-type=module -e 'import{readFileSync}from"node:fs";const R="/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence",D=["业务任务","信息架构","交互状态","内容与数据","视觉规范","响应式布局","无障碍","真实代码交接"],bad=[],P=f=>{try{return readFileSync(f,"utf8")}catch(e){console.log(JSON.stringify({bad:["unreadable:"+f]}));process.exit(2)}},text=P(R+"/c11-p3-review-eight.md"),who=n=>(text.match(new RegExp("^-\\s*"+n+"[：:]\\s*(.+)$","m"))||[])[1]?.trim()||"",reviewer=who("审查者"),implementer=who("实施者");if(!reviewer||!implementer||reviewer===implementer)bad.push("identity");const parts=text.split(/^###\s+/m).slice(1);for(const d of D){const body=parts.find(p=>p.split(/\r?\n/)[0].includes(d));if(!body){bad.push("dim:"+d);continue}for(const f of ["输入","观察","证据","未覆盖项"]){const m=body.match(new RegExp("^-\\s*"+f+"[：:]\\s*(.+)$","m"));if(!m||m[1].trim().length<8)bad.push("field:"+d+":"+f)}const ob=(body.match(/^-\s*观察[：:]\s*(.+)$/m)||[])[1]||"";if(ob.length<40)bad.push("thin:"+d);if(/只看截图|仅看截图|仅凭截图/.test(ob))bad.push("screenshot:"+d)}const findings=P(R+"/c11-p3-findings.md");if(!/无发现/.test(findings)){const rows=findings.split(/\r?\n/).filter(l=>/^\|\s*F\d+/.test(l)).map(l=>l.split("|").slice(1,-1).map(s=>s.trim()));if(rows.length===0)bad.push("findings-empty");for(const r of rows){if(!r[3]||r[3].length<8)bad.push("dispose:"+r[0]);if(!r[4]||!/复验|复核|重跑|重读/.test(r[4]))bad.push("reverify:"+r[0])}}console.log(JSON.stringify({dims:parts.length,reviewer,implementer,bad}));process.exit(bad.length?1:0)'
```

| 目标 | Task | 角色 | gate_cmd 与预期退出码 | 判据与证据路径 |
| --- | --- | --- | --- | --- |
| 逐格观察可回读 | T001 | RED | T001 门禁（改一格身份后）与 1 | ORACLE-C11-AUDIT 与 `planned: quality/evidence/c11-p3-cells/`（坏副本另存） |
| 逐格观察可回读 | T001 | GREEN | T001 门禁与 0 | ORACLE-C11-AUDIT 与 `planned: quality/evidence/c11-p3-cells-index.md` |
| 八维审查可判 | T002 | RED | T002 门禁（某维换成只看截图后）与 1 | ORACLE-C11-DESIGN 与 `planned: quality/evidence/c11-p3-review-eight.md` |
| 八维审查可判 | T002 | GREEN | T002 门禁与 0 | ORACLE-C11-DESIGN 与 `planned: quality/evidence/c11-p3-review-eight.md` |

覆盖上限：本 Phase 只证 P1 定稿字节在三个视口下的观察与八维的设计层结论。状态身份以页面自身的 `data-state` 读数与索引为准；URL 入口是 P1 提供的只读测试入口，真实用户打开页面时不会带它，因此不证明默认点击路径之外的交互差异；“处理中”只有约 150ms，瞬时态观察是同一窗口内的近似记录，不等同于该格的完整四项采集；溢出只读根元素 `scrollWidth/clientWidth`，不扫后代与内部滚动容器。
显式不覆盖：不证真实用户任务、真人读屏、C12 的能力验收与发布可用；不证 C05-P3，即完整范围展示后的用户答复，归 C12，本 Phase 只记未测，不写成必过条件。
失败了怎么办：状态进不到声明值时保该格原样并记未测，回采集执行者重进；采集器报错保原错误，不换命令求绿；身份五项缺失时回 P1 补版本标签，不在本卡编造；审查缺维回审查者补，发现无处置退回原处置 owner。

- **风险**：把审计器 `--state` 坐标当成页面状态，或采集后页面被重载仍用旧读数；URL 入口写坏时整列状态都会失真。
- **影响**：格子报告与真实状态脱节，整项的“逐格”结论失效。
- **缓解**：采集前写 `state.txt`，采集后复读并记录漂移；门禁核 `state.txt` 与 `object.state`。
- **回滚**：只撤本格目录与索引相应行，保留其它格与失败原件。
- **补救与交接**：回 P1 owner 确认字节版本；重采该格后由原复核者重报。
- **触发条件**：同一格两次标记不一致，或 `state.txt` 与 `report.json` 的 state 不同。

## 下一消费者拿什么继续？

- **下游**：P5/T001 取逐格报告与索引做完整差异审查，只读不改；P6/T002 抽两条按指针核原件。
- 交回：索引、逐格目录、T002 审查稿与发现表；未测格与原因逐条列出。
- 未完成项：任何未测格在该行写明 `incomplete` 与原因、恢复条件，不用“暂缺”带过。

## 每张任务卡怎么写？

### 任务 1：逐格跑完 v15 的状态与视口矩阵

为什么做：C09 判词说 v15 的整页内容、状态与视口独立判断未取得；本卡用真实点击进入每个状态并留下四项观察，对应 R-003 与 AC-C11-003。
交付什么：33 格索引与逐格目录；失败信号是状态未到位、报告缺失、采集器 `failures` 非空或身份不一致。
不做什么：不改 v15 字节、不改载体、不写 G-2 文档、不新造采集器、不代答 C05-P3。
前置：P1 定稿的 v15 副本、python3、agent-browser 会话与既有审计器；依赖 P1。
怎么做：从副本根起 `python3 -m http.server 8080`，按“状态进入表”逐格用 `?state=` 打开并用 `data-state` 断言，再跑审计器与采集器，逐格落盘，最后写索引并抽查两格重跑。
怎么验收：跑 T001 门禁，GREEN 退出 0 且 `bad:[]`；改一格身份后同一命令非零并点名该格。
证据：索引与逐格目录各留单份原件；抽查重跑与坏副本另存；未执行时记 `unavailable` 与原因，不宣称 RED 或 GREEN。
下游（含何时停）：T002 与 P5 读索引与逐格原件；状态两次不到位或采集器持续报同一错误时停手报主会话。

**状态进入表**

| 状态 | 进入方式（URL 状态入口） | 断言值（`#demo-result` 的 `data-state`） |
| --- | --- | --- |
| 未选 | `?state=unselected`（等价于直接打开入口） | `unselected` |
| 就绪 | `?state=ready` | `ready` |
| 处理中 | `?state=pending`（页面停在约 150ms 的瞬时态） | `pending`（瞬时态观察，不跑四项报告） |
| 成功 | `?state=success` | `success` |
| 空 | `?state=empty` | `empty` |
| 失败 | `?state=error` | `error` |
| 拒绝 | `?state=permission` | `permission` |
| 部分 | `?state=partial` | `partial` |
| 未知 | `?state=unknown` | `unknown` |
| 重复 | `?state=duplicate` | `duplicate` |
| 已恢复 | `?state=recovered` | `recovered` |

**每格采集命令（示例：成功 × 1440×900）**

```bash
node /Users/Hugh/Hugh/Project/workflowhub/skills/frontend-testing/scripts/run-page-audit.mjs \
  --cdp-url "$(agent-browser --session c11-p3 get cdp-url)" \
  --state success --viewport 1440x900 \
  --workspace /Users/Hugh/Hugh/Project/c11-v15-work-20261112/t019-wf-native-next \
  --service http://127.0.0.1:8080 \
  --route '/v15/2026-11-11-002-t019-v15-pending-busy-index.html?state=success' \
  --object-version "$(shasum -a 256 /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/c11-final-v15.sha256 | cut -c1-16)" \
  --engine-session c11-p3 \
  --out /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/c11-p3-cells/success-1440x900/report.json
```

其余格只换 URL 的 `state` 值、`--state`、`--viewport` 与 `--out` 的目录名，输出目录用 `<state>-<viewport>` 的英文状态名；每格采集前先把该格的 `data-state` 写进同目录 `state.txt`。处理中格不跑这条命令，改用页内观察器：用 `?state=pending` 打开后装 MutationObserver 与 console、resource 记录，约 500ms 回读，写出 `observer.json`，键为 `seen_pending`、`states`、`identity`、`events`、`observed_window_ms`。


<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T001
- **来源 / FR / AC**: R-003 / 台账 G3；FR-C11-003：v15 十一个状态乘三个视口逐格有独立观察；AC-C11-003：每格含 console、network、溢出与对象身份，任一必需格未测则整项未修，处理中格单列瞬时态观察、不冒充四项报告。判据全文只在 `spec.md#Appendix A`，本卡只引用编号。
- **输入**: P1 定稿的 v15 副本字节（`/Users/Hugh/Hugh/Project/c11-v15-work-20261112/t019-wf-native-next`，入口 `v15/2026-11-11-002-t019-v15-pending-busy-index.html`）；产出方为 P1/T001 最终字节，消费方是本卡审计器与索引；身份五项由执行者按对象填写；执行 owner 是 T001 采集执行者，时点在 P1 定稿后。
- **文件 / 符号**: `quality/evidence/c11-p3-cells-index.md`；symbol: N/A — 证据索引与逐格 JSON，非代码文件。
- **动作**: 先从副本根起静态服务并开会话、设视口；再按状态进入表点击，读 `data-state` 写该格 `state.txt`，不等于声明值即该格判失败、不进入采集；随后跑审计器写 `report.json` 与采集器原件；处理中格先装页内观察器再点击，约 500ms 后回读；然后写索引 33 行（固定表头：`| 状态 | 视口 | 报告路径 | 报告sha256 | 页面观测状态 | 类型 |`，每行按此列序）；每格另存 `observed-state.json`，由独立浏览器读回写入 `{state,command,observed_at}`；最后任选两格重跑到另一目录比对。示例：`agent-browser --session c11-p3 check 'input[name="local-sample"]'` → `click '#demo-use-sample'` → `eval 'document.getElementById("demo-result").dataset.state'` 应返回 `ready`。
- **输出 / 失败**: 索引逐行可打开报告，`report.json` 有 `object` 五项、`criteria`、`coverage_limits`；采集器 `failures` 为空；失败时该格标未测、保原件，不清空已测格。
- **边界 / 禁止改动**: v15 副本字节、载体两页、`spec.md`、`decision-log.md`、P1 数据与 P1 证据都不改；不新增采集器；`--out` 不覆盖已有文件。
- **依赖**: P1；本卡无同 Phase 前置。
- **测试层级 / 技能**: 采集级加页面观察；技能 `frontend-testing` 的页面审计器与采集器、`isolated-browser-qa` 的会话；不写浏览器端到端，因为页面无后端且状态由点击驱动，端到端只重复同一采集。
- **场景 / 夹具或服务**: 状态进入表在本卡上方；反向用例是改一格索引的 state 标记、改一格 `report.json` 的 `object.route`；清理是停 `http.server`、关会话，保留失败原件，不删已测格。
- **RED/GREEN 门禁命令**: `node --input-type=module -e 'import{readFileSync,existsSync,readdirSync}from"node:fs";import{createHash}from"node:crypto";const R="/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence",S=["unselected","ready","pending","success","duplicate","empty","error","permission","partial","unknown","recovered"],V=["1440x900","1280x900","390x844"],IDK=["workspace","service","object_version","engine_session"],bad=[],idn=new Set(),rts=new Set(),P=f=>{try{return readFileSync(f)}catch(e){console.log(JSON.stringify({bad:["unreadable:"+f]}));process.exit(2)}};const idx=P(R+"/c11-p3-cells-index.md").toString("utf8").split(/\r?\n/).filter(l=>/^\|\s*(?:[a-z]+)\s*\|/.test(l)).map(l=>l.split("|").slice(1,-1).map(s=>s.trim()));for(const s of S)for(const v of V){const r=idx.find(x=>x[0]===s&&x[1]===v);if(!r){bad.push("missing:"+s+":"+v);continue}const ref=R+"/"+r[2];if(!existsSync(ref)){bad.push("noreport:"+s+":"+v);continue}const dir=ref.replace(/\/[^/]+$/,"");if(r[5]==="transient"){const o=JSON.parse(P(ref).toString("utf8"));if(o.seen_pending!==true||!Array.isArray(o.states)||!o.states.includes("pending"))bad.push("transient:"+s+":"+v);if(!String(r[4]).startsWith("pending→"))bad.push("transient-state:"+s+":"+v);if(!o.identity||!o.events||!Array.isArray(o.events.console)||!Array.isArray(o.events.network)){bad.push("transient-shape:"+s+":"+v);continue}idn.add(IDK.map(k=>o.identity[k]).join("~"));rts.add(String(o.identity.route||""));if(!String(o.identity.route||"").includes("state="+s))bad.push("route-state:"+s+":"+v)}else{const b=P(ref),j=JSON.parse(b.toString("utf8")),ob=j.object||{};if(createHash("sha256").update(b).digest("hex")!==r[3])bad.push("sha:"+s+":"+v);if(ob.state!==s||r[4]!==s)bad.push("state:"+s+":"+v);const st=dir+"/state.txt";if(!existsSync(st)||readFileSync(st,"utf8").trim()!==s)bad.push("marker:"+s+":"+v);const os=dir+"/observed-state.json";if(!existsSync(os))bad.push("observed-missing:"+s+":"+v);else{const ob2=JSON.parse(P(os).toString("utf8"));if(ob2.state!==s||typeof ob2.command!=="string"||!ob2.observed_at)bad.push("observed:"+s+":"+v)}idn.add(IDK.map(k=>ob[k]).join("~"));rts.add(String(ob.route||""));if(!String(ob.route||"").includes("state="+s))bad.push("route-state:"+s+":"+v);const org=readdirSync(dir).filter(n=>n.startsWith("p5-audit-"));if(org.length!==1)bad.push("originals:"+s+":"+v);else for(const d of ["console","network","overflow"]){const p=dir+"/"+org[0]+"/"+d+".json";if(!existsSync(p)){bad.push(d+":"+s+":"+v);continue}const o=JSON.parse(P(p).toString("utf8"));if(!o.object||o.object.state!==s||(o.failures||[]).length>0)bad.push(d+"-obj:"+s+":"+v)}}}if(idn.size!==1)bad.push("identity-drift:"+idn.size);if(rts.size!==11)bad.push("route-drift:"+rts.size);console.log(JSON.stringify({rows:idx.length,identity:[...idn],route_values:rts.size,bad}));process.exit(bad.length?1:0)'`
- **预期退出码**: RED nonzero; GREEN 0；RED 由身份、状态或缺格断言产生，采集器未启动、目录为空或脚本读不到索引只算未执行，不算目标 RED。
- **RED 目标失败**: ORACLE-C11-AUDIT 断言：索引某格的“页面 state 标记”或报告的身份与页面实际不符时，同一命令必须非零并点名该格；当前无证据时同一命令以 `unreadable:` 或 `noreport:` 退出，属未执行而非通过。
- **GREEN 判定器**: ORACLE-C11-AUDIT 同一命令退出 0，输出 `bad:[]` 与单一 identity；反向行为是改一格 state 或 route 后非零并点名，处理中格缺 `seen_pending` 或 `events` 时同样非零。
- **证据**: `planned: quality/evidence/c11-p3-cells-index.md`（索引）；`planned: quality/evidence/c11-p3-cells/`（逐格目录，由索引逐格登记）；抽查两格重跑原件；坏副本与门禁原始输出。
- **覆盖上限**: 只证当前字节在三个视口下的观察；不证真实用户任务、真人读屏、C12 能力验收；溢出只读根元素；处理中是瞬时间近似；报告自身 `state_observation` 为 unknown 是页面无 URL 状态入口的事实，不是缺口。
- **停止 / 恢复**: 同一格两次进不到声明值时停该格，保原错误，回 T001 采集执行者按同一格重进；身份字段缺失回 P1 补版本标签，不在本卡编造；不改门禁求绿。
- **完成**: 前置（不作完成条件）：服务与会话就绪，审计器能跑，门禁命令有真实退出码与原始输出。完成条件（只写效果）：AC-C11-003 的状态×视口矩阵逐格可回读、四项齐、抽查两格一致、身份写错被判不一致；未测格逐条具名保留并整项记未修。

### 任务 2：在真实会话里逐维复核八维并处置发现

为什么做：C09 判词说没有 v15 的八维独立设计审查；本卡让实施者之外的人逐维复读并处置发现，对应 R-004 与 AC-C11-004。
交付什么：八维审查稿与发现处置表；失败信号是缺维、观察是截图结论、身份相同或发现无处置。
不做什么：不改 v15 字节、不改实现、不重采 T001 的 33 格、不代答 C05-P3。
前置：P1 定稿字节与 T001 的索引和逐格报告；依赖 T001。
怎么做：逐维读 v15 当前字节与 T001 报告，在真实会话复核交互与呈现，按输入、观察、证据、未覆盖项四件写；发现逐条写处置与复验。
怎么验收：跑 T002 门禁，GREEN 退出 0；把任一维观察换成“只看截图”后同一命令非零并点名该维。
证据：审查稿、发现表、门禁原始输出；处置复验原件另存；未执行时记 `unavailable`。
下游（含何时停）：P5 与 P6 读审查稿与发现表；缺维或处置无 owner 时停手报主会话。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T002
- **来源 / FR / AC**: R-004 / 台账 G4；FR-C11-004：八维独立设计审查，结论、输入、观察、证据与未覆盖项齐备；AC-C11-004：执行者不是实施者，发现逐条处置，截图替代被判无效。判据全文只在 `spec.md#Appendix A`，本卡只引用编号。
- **输入**: P1 定稿的 v15 当前字节与 T001 的索引、逐格报告；产出方是 T001 采集执行者，消费方是独立审查者与处置复验者；执行 owner 是 T002 独立审查者，时点在 T001 交回报告后。
- **文件 / 符号**: `quality/evidence/c11-p3-review-eight.md`；`quality/evidence/c11-p3-findings.md`；symbol: N/A — 审查稿与发现表，非代码文件；只读锚点 `quality/evidence/c11-p3-cells-index.md`。
- **动作**: 先写审查者与实施者两个身份，再逐维写四件；然后逐条记发现与处置；最后跑门禁并把某维观察换成“只看截图”验证会被判无效，验后还原。八维是业务任务、信息架构与导航、交互状态、内容与数据、视觉规范、响应式布局、无障碍、真实代码交接。
- **输出 / 失败**: 审查稿八维齐全、发现表逐行有处置与复验；失败时该维标未测并保原稿，不删已写维度。
- **边界 / 禁止改动**: v15 字节、载体、`spec.md`、`decision-log.md`、T001 的 33 格原件都不改；本卡只写两份成稿与会话观察记录。
- **依赖**: T001；T001 交回报告后才做独立复核。
- **测试层级 / 技能**: 独立审查级与人读判定；技能 `frontend-testing` 的页面观察与 `wh-review` 的只读边界；命令只判结构与截图替代，不代替语义结论。
- **场景 / 夹具或服务**: 正常用例是八维逐维复读；反向用例是把任一维观察写成“只看截图”或删掉未覆盖项；清理是关会话，保留还原前后的两份稿。
- **RED/GREEN 门禁命令**: `node --input-type=module -e 'import{readFileSync}from"node:fs";const R="/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence",D=["业务任务","信息架构","交互状态","内容与数据","视觉规范","响应式布局","无障碍","真实代码交接"],bad=[],P=f=>{try{return readFileSync(f,"utf8")}catch(e){console.log(JSON.stringify({bad:["unreadable:"+f]}));process.exit(2)}},text=P(R+"/c11-p3-review-eight.md"),who=n=>(text.match(new RegExp("^-\\s*"+n+"[：:]\\s*(.+)$","m"))||[])[1]?.trim()||"",reviewer=who("审查者"),implementer=who("实施者");if(!reviewer||!implementer||reviewer===implementer)bad.push("identity");const parts=text.split(/^###\s+/m).slice(1);for(const d of D){const body=parts.find(p=>p.split(/\r?\n/)[0].includes(d));if(!body){bad.push("dim:"+d);continue}for(const f of ["输入","观察","证据","未覆盖项"]){const m=body.match(new RegExp("^-\\s*"+f+"[：:]\\s*(.+)$","m"));if(!m||m[1].trim().length<8)bad.push("field:"+d+":"+f)}const ob=(body.match(/^-\s*观察[：:]\s*(.+)$/m)||[])[1]||"";if(ob.length<40)bad.push("thin:"+d);if(/只看截图|仅看截图|仅凭截图/.test(ob))bad.push("screenshot:"+d)}const findings=P(R+"/c11-p3-findings.md");if(!/无发现/.test(findings)){const rows=findings.split(/\r?\n/).filter(l=>/^\|\s*F\d+/.test(l)).map(l=>l.split("|").slice(1,-1).map(s=>s.trim()));if(rows.length===0)bad.push("findings-empty");for(const r of rows){if(!r[3]||r[3].length<8)bad.push("dispose:"+r[0]);if(!r[4]||!/复验|复核|重跑|重读/.test(r[4]))bad.push("reverify:"+r[0])}}console.log(JSON.stringify({dims:parts.length,reviewer,implementer,bad}));process.exit(bad.length?1:0)'`
- **预期退出码**: RED nonzero; GREEN 0；RED 由缺维、缺未覆盖项或截图替代断言产生，文件不存在只算未执行。
- **RED 目标失败**: ORACLE-C11-DESIGN 断言：某维观察只有“只看截图”时该维被判无效并点名；审查者与实施者同名时同样非零。
- **GREEN 判定器**: ORACLE-C11-DESIGN 同一命令退出 0，八维齐全、四件齐、身份不同、发现均有处置与复验；反向行为是替换一维观察后非零并点名该维。
- **证据**: `planned: quality/evidence/c11-p3-review-eight.md`；`planned: quality/evidence/c11-p3-findings.md`；门禁原始输出与还原前后的稿。
- **覆盖上限**: 只证 v15 当前字节的设计层结论；不证真实用户任务、真人读屏、代码质量与 C12 能力验收；不证 C05-P3 的用户答复。
- **停止 / 恢复**: 缺维或观察是截图结论时回 T002 审查者补正；发现无处置时退回原处置 owner 并保原稿；同一维两次仍不合格停手报主会话，该维记未测；不改门禁求绿。
- **完成**: 前置（不作完成条件）：T001 报告可读，门禁命令有真实退出码。完成条件（只写效果）：AC-C11-004 的八维各有结论且带未覆盖项、执行者不是实施者、截图替代被判无效、发现逐条有处置与复验。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计（全局权威）`
- **写入集**：`quality/evidence/c11-p3-cells-index.md`；`quality/evidence/c11-p3-review-eight.md`；`quality/evidence/c11-p3-findings.md`
- **依赖**：P1
- **消费者**：P5、P6
- **gate_cmd**：`node --input-type=module -e 'import{readFileSync,existsSync,readdirSync}from"node:fs";import{createHash}from"node:crypto";const R="/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence",S=["unselected","ready","pending","success","duplicate","empty","error","permission","partial","unknown","recovered"],V=["1440x900","1280x900","390x844"],IDK=["workspace","service","object_version","engine_session"],bad=[],idn=new Set(),rts=new Set(),P=f=>{try{return readFileSync(f)}catch(e){console.log(JSON.stringify({bad:["unreadable:"+f]}));process.exit(2)}};const idx=P(R+"/c11-p3-cells-index.md").toString("utf8").split(/\r?\n/).filter(l=>/^\|\s*(?:[a-z]+)\s*\|/.test(l)).map(l=>l.split("|").slice(1,-1).map(s=>s.trim()));for(const s of S)for(const v of V){const r=idx.find(x=>x[0]===s&&x[1]===v);if(!r){bad.push("missing:"+s+":"+v);continue}const ref=R+"/"+r[2];if(!existsSync(ref)){bad.push("noreport:"+s+":"+v);continue}const dir=ref.replace(/\/[^/]+$/,"");if(r[5]==="transient"){const o=JSON.parse(P(ref).toString("utf8"));if(o.seen_pending!==true||!Array.isArray(o.states)||!o.states.includes("pending"))bad.push("transient:"+s+":"+v);if(!String(r[4]).startsWith("pending→"))bad.push("transient-state:"+s+":"+v);if(!o.identity||!o.events||!Array.isArray(o.events.console)||!Array.isArray(o.events.network)){bad.push("transient-shape:"+s+":"+v);continue}idn.add(IDK.map(k=>o.identity[k]).join("~"));rts.add(String(o.identity.route||""));if(!String(o.identity.route||"").includes("state="+s))bad.push("route-state:"+s+":"+v)}else{const b=P(ref),j=JSON.parse(b.toString("utf8")),ob=j.object||{};if(createHash("sha256").update(b).digest("hex")!==r[3])bad.push("sha:"+s+":"+v);if(ob.state!==s||r[4]!==s)bad.push("state:"+s+":"+v);const st=dir+"/state.txt";if(!existsSync(st)||readFileSync(st,"utf8").trim()!==s)bad.push("marker:"+s+":"+v);const os=dir+"/observed-state.json";if(!existsSync(os))bad.push("observed-missing:"+s+":"+v);else{const ob2=JSON.parse(P(os).toString("utf8"));if(ob2.state!==s||typeof ob2.command!=="string"||!ob2.observed_at)bad.push("observed:"+s+":"+v)}idn.add(IDK.map(k=>ob[k]).join("~"));rts.add(String(ob.route||""));if(!String(ob.route||"").includes("state="+s))bad.push("route-state:"+s+":"+v);const org=readdirSync(dir).filter(n=>n.startsWith("p5-audit-"));if(org.length!==1)bad.push("originals:"+s+":"+v);else for(const d of ["console","network","overflow"]){const p=dir+"/"+org[0]+"/"+d+".json";if(!existsSync(p)){bad.push(d+":"+s+":"+v);continue}const o=JSON.parse(P(p).toString("utf8"));if(!o.object||o.object.state!==s||(o.failures||[]).length>0)bad.push(d+"-obj:"+s+":"+v)}}}if(idn.size!==1)bad.push("identity-drift:"+idn.size);if(rts.size!==11)bad.push("route-drift:"+rts.size);console.log(JSON.stringify({rows:idx.length,identity:[...idn],route_values:rts.size,bad}));process.exit(bad.length?1:0)'`（T002 用本文件任务 2 的逐维门禁）
- **oracle**：ORACLE-C11-AUDIT 与 ORACLE-C11-DESIGN（T001 用前者，T002 用后者）
- **evidence_path**：`planned: quality/evidence/c11-p3-cells-index.md`
- **STOP**：状态两次不到位、身份字段缺失或采集器持续报同一错误时停该格并保原错误；回 T001 采集执行者或 P1 owner，不改门禁求绿
- **覆盖 AC**：AC-C11-003、AC-C11-004
- **Done**：前置（不作完成条件）：两条门禁在真实证据上跑过并留 cwd、退出码与原始输出。完成条件（只写效果）：AC-C11-003 的矩阵逐格可回读、抽查一致、身份错配可判出；AC-C11-004 的八维齐、身份合规、截图替代被判无效、发现均有处置与复验；C05-P3 与未测格具名保留，不写成必过条件。
