# Phase P7 — 让驾驶舱显示可追溯的当前状态

沿用现有驾驶舱布局，把当前阶段、工作包、验收和来源接到真实材料。
发布前验证结构、来源和指纹，坏新页拒绝发布。
用户可阅读上一版，并能辨认它已经过期。

## 哪些节必须写，哪些可以省？

本段给出可独立交付、观察、回退的单个结果。

| 段落 | 状态 | 本段用法 |
| --- | --- | --- |
| 交付、依据、开工材料 | written | 定位可观察结果、来源及上游输入。 |
| 验收、写集、验证 | written | 找判据、实际写主和反例。 |
| 消费者、任务与机器字段 | written | 交已知输入及执行边界。 |
| 末验收 | not-applicable | 完整验收归第 10 段。 |

## 这一 Phase 交出什么？

用户能在原入口从阶段与工作包走到可回读的来源。
上一版的 HTML 与节点侧车配对保留。
侧车是承接节点摘要与来源指纹的同名 JSON。
指纹根据当前材料和实际 Phase 字节识别页面是否过期。
失败后的查看路径明确标旧。未知不能显示成已完成。

第 2 段提供真实来源引用，第 6 段提供失败处置与已核执行清单。
当前只做既有页面数据与发布路径。十环质量原件仍由原入口产出。
独立验收者判本段功能和实际排版，下游第 9 段读这些原件做交付对账。
**配套与影响**：配套调整＝`skills/answer-as-page/` 三个脚本与 `quality/evidence/cockpit/` 成对文件；配套迁移＝旧页按新模型重渲染、旧编号映射一次性迁出；配套移除＝自由文本解析器、仅按 mtime 判陈旧、旧编号兼容分支；影响范围＝用户驾驶舱、build-plan 追溯、P9 的交付对账输入。

## 这一 Phase 怎么验收？

### 验收 1：有坏模型时发布会拒绝吗？

独立测试者先用当前材料形状与认证任务运行现生成入口。
输入含具名 Phase、当前索引、真实包角色、报告和现事实。
保存合法生成的 HTML 与侧车原件，在隔离任务内逐项破坏输入。
删必要结构、把来源改成失效引用、让计数与对象指针对不上。
分别再试未知或互相冲突的级别来源，保留未知标记的真实依据。
仅改一个物理 Phase 时保留其他材料，重走同一检查并确证过期。
每个相关反例都要命中其明确错误，保持上一对文件字节可回读。
独立测试作者从当前决策日志包目录和各包正文冻结真相清单。
逐行记当前包身份、标题、原验收映射及来源路径和行锚。
再对照规格附录 A 与编号对照，把原验收接到现行编号与实际包。
旧编号只用来解析已确认的历史对应关系。
级别预期分别取真实已确认声明、无声明或冲突输入的原判据。
清单在看到生成结果前冻结，字段与断言由独立测试者维护。
逐项将清单与生成 HTML 的 DATA 及侧车来源按身份双向对照。
十包须各有且仅有一个对应，组内的验收编号和真实来源也逐项吻合。
补一个同数量却把页面包验收挂错、重号或指向另一原件的坏对照。
独立判据必须拒绝它，页面总数与两个标题出现都不能替代逐项对账。
仅有进程退出或在发布后报错，不能判作拒绝发布。

决策日志第 820 行还要求同一测试命令汇成一个可追溯节点。
用实际执行回执区分重复执行与同一原件的重复引用。
按当前任务、实际工作目录与完整参数序列归并。
相同命令两次真实运行即两个结果。重复引用同一原件只计一次。
复用原测试卡的通过数，显示成功执行次数并能回到逐次原回执。
失败、超时与取消不计通过，各保实际结果和原件链接。
普通未分类命令及不可回读的来源不能填入通过数。
受控输入只证明生成、校验和回退；真实浏览器验收另判。

### 验收 2：用户能分辨当前页与过期旧页吗？

独立读者在实现后，用现产物在隔离真实浏览器走一条真实路径。
先读同一任务的 facts 与 HTML，观察阶段头、包列表、详情和原始来源。
打开一个可回读的来源，核文字、链接或来源指针及实际路径。
再用坏新模型重发，通过同任务的原查看入口看上一版和过期提示。
顶部应读到「上一版 · 已过期」，还能点旧包与来源。
回读原 HTML 和侧车的哈希应保持相同。
没有可验证旧版时，查看入口显名报缺口，不能给坏模型补一个新页。
恢复合法输入后重走原入口。当前页可读，派生旧版只清本次自有件。
当可读实际任务已经进入实施时，页面不能仍暗示当前正在写计划。
缺阶段原件显示未核实及依据。原件不可读不能补取虚构状态。
行为以实际可见文字、链接、状态和 DOM 采集判。
DOM 是页面运行后的真实节点与文字。排版判据另取真实截图。
凭据不会用于本路径。浏览器不可达保原失败，独立读者继续可跑的数据面。
独立验收人签当前冻结证据；正式收口范围由用户另确认。

### 页面六项怎样观察？

1. 设计源为现 `skills/answer-as-page/templates/overview-template.html`，
   版本 `aa274178ff8ab0f889f4a64689b7f73edb4c1485`。
   读于 2026-11-19，SHA-256 为
   `e981ac4c21326e26c589e5c2be6abeb1f50818b6d4dadcc20f5165c770161ec9`。
   对照真实模板的标题、目录、对象卡、来源抽屉和过期提示。
   另有独立稿路径合同冲突，见设计来源准备原件；保具名缺口。
2. 原入口为任务库 `quality/evidence/cockpit/overview.html`。
   在 1440×900、768×960、390×844 看正常总览、包选中与来源展开。
   同尺寸分别观察阶段未知、来源失败、旧页提示。实际状态不足逐格留缺。
3. 比标题、阶段条、导航和详情层级，三宽保主要操作与来源可见顺序。
   中宽摘要省略仍可进详情，手机两滚动区各自可操作。
   只对排版观察留截图，按用户认可的布局比；新偏差由其在对应范围确认。
4. 前端质量门五项各带可观察判据。
   组件质量＝组件结构复用以原消费者实读为据；本段无组件改动时写「不适用＋理由」。
   浏览器验收＝隔离浏览器读当前 URL、ready DOM、来源操作与实际 console，1440×900 与 390×844 都能打开且无控制台错误。
   响应式＝三视口无横向滚动，390 宽主操作可达。
   无障碍＝键盘 Tab 依次到阶段条、包卡与来源，焦点可见，可访问名非空；200% 缩放主操作可达且不裁切；实体读屏在隔离环境做一次并记录。
   性能＝同一次隔离浏览器运行的 trace 读数满足 LCP 不超过 2.5 秒、CLS 不超过 0.1、INP 不超过 200 毫秒。
   键盘、200% 缩放与性能可由隔离浏览器完成，不记 unavailable；实体读屏做不了才记 unavailable，并由页面 owner 给恢复条件。
   实测未取得时在该项写具名缺口与 owner，不用「未测」带过，也不因缺一项读数改写其余已确认范围。
   行为看真实可见文字、链接和状态，排版用截图，均沿编号 013 的答复。
5. 复用原阶段、目录、总览、包卡与来源组件，不新增通用组件。
   无组件沉淀变更，组件规范回写不适用。行为接线归原页面/测试入口。
6. 未参与实施的独立读者按八维比较原模板和真实新产物。
   保存原观察、排版截图、失败和未覆盖。修后只回看受影响面。
   现有受控样本的末个历史缺口定位歧义保持失败，不提前签修后验收。

三面依据是用户要求持续可追溯、仓内原生单页和已确认的实际范围。
布局沿原模板，状态和指纹跟真实源。独立稿与产品现有基准各按实报告。

| 验收 | 成本类别 | 活动分钟 | 上限与来源 | 重试 | 资源提供者 | 首判与末验 |
| --- | --- | ---: | --- | --- | --- | --- |
| 1 | 命令级 | 15 | 30 分钟，待校准 | 只重放异常面 | 页面 owner 与独立命令执行者提供受控认证任务 | P7 发布前首判；末段读原件 |
| 2 | 真实环境级 | 26 | 50 分钟，待校准 | 同选引擎必要复验一次 | 页面 owner 供当前产物，隔离浏览器执行者取事实 | P7 实现后首判；第 9 段和末段回读 |

后一验收接前一验收的成功产物与失败回退样本，按串行估算。
总账 15 + 26 + 合用准备 7 + 受影响复验 8 = 56 活动分钟。
已有三视口基线和隔离运行证据只校准步骤，不将短命令耗时冒人工实测。
`phase_budget={soft_min:75,hard_min:120,variance_threshold:1.5,source:provisional}`。
`execution_budget={window_minutes:100,command_cap:14,wait_cap:unknown,retry_reserve:8}`。
来源为蓝图中的受控复跑与三尺寸回读，待实施首轮核真实耗时。
用户等候只在对应视觉偏差或正式范围需要时分账。
独立审查和实际浏览器环境等待分账。页面负责人供可读当前页，
隔离执行者确认可用时结束环境等待；实体设备未列必备资源。

## 为什么现在做，依据是什么？

现真实基线的原始需求误投写法说明，工作包只显示一个缺口对象。
现代码先发布再查内容，只看两个材料文件时间判断陈旧。
决策日志第六包选择让现数据入口产生有来源的模型。
用户已确认原页面和样例形态，以及截图和签字各自的用途。

## 开始前读什么？

读第 2、6 段交来的来源与阶段原件。
读 `quality/evidence/build-plan/2026-11-19-013-page-preview-and-acceptance-answer.md`。
连同 010 的设计源准备、011/012 的受控预览与来源说明一起读。
现浏览器原件 `quality/tests/2026-11-19-005-build-plan-controlled-preview-browser.output`
保留场景退出 1，另读 `quality/tests/2026-11-19-006-controlled-preview-independent-reader.md`。
读 `skills/answer-as-page/SKILL.md` 的「当前任务驾驶舱」和实际入口。
按 `skills/project-norm-init/SKILL.md` 和组件质量方法读取适用视觉、布局与前端源。
后端、接口和验收规则分别读 `specs/backend/architecture.md`、
`specs/api/contract.md`、`specs/acceptance/acceptance.md`。

## 每个文件由谁改，先做什么？

本段开发先在现 `buildPageData` 形成有来源的模型。
工作包、级别、验收、来源、计数、指纹取现结构化输入。
阶段/游标只从已认证的现 facts 或其只读状态接口消费。
用现身份验证保留既有路径和历史只读读法。
新形态的结构数据缺失时给具名错误。级别空缺或冲突给 unknown。
保过去仍被消费的合法输入，停无来源的散文猜包。
测试执行先沿现 `isTestReceipt` 分类，再用可回读回执做同命令汇总。
以经认证的原件路径或已证同字节的同一原件识别重复引用。
两次执行即便 stdout 相同，仍按两份真实回执分别记。
用现模板测试详情的 `pass`、`fail` 与来源列表显示。
说明通过数是实际运行成功次数。组内仍能找到失败回执及原输出。
现路径已经满足时，保实现并只加独立回归覆盖。
渲染器消费现模型。三道校验在进入发布锁之前发现错误。
发布锁内核候选来源未漂移，配对变更若部分失败保可读旧件与原错误。
复用 `publishPair` 已有单写主；成对文件原子性以实际失败注入观察。

坏候选退出非零，保旧 HTML 和侧车原字节并返回原错误。
`refreshAnswerPage` 当前把阶段结果的 HTML 交给现 `openInSystemBrowser`。
它传任务清单的 `project_name/task_id` 作标记，并传实际任务根作 URL 复用范围。
保该调用和标记；文件式查看沿同任务库根，另起临时 HTTP 会改变复用范围。
失败时先从已认证输出目录把上一对安全读回，核旧配对指纹和先前通过原件。
旧侧车、HTML 或先前通过证据不可验证时，显明报「无可验证的上一版」。
禁止用失败候选生成看似正常的页面。

有可验证旧版时，使用这对旧字节，以现模板的 `stageStatus` 显示已过期。
保留旧业务对象、包和来源，新失败内容只放经转义的过期理由。
视图保留可读旧阶段的时间语义。顶部明确表示展示的是上一版。
在认证任务的现 cockpit 目录复用单一临时位置 `overview.expired.html`。
原页和侧车字节保持，临时页仅供现开页入口展示。
临时页不进入任务 facts、原页指纹或成功发布结论。
沿同目录现 `publishPair` 的锁和输出归属检查串行更新。
只处理固定位置及该任务自有、非链接的普通文件；冲突或归属不明保原件报错。
重复失败复用同一位置。成功确认刷新当前页后，沿同锁清本任务自有临时页。
宿主未确认打开或清理范围未核时保真实缺口，只留一个原派生位置。
URL 回执只证明标签目标，页面文字及交互另走隔离浏览器。
正常查看范围内不另立状态源。直接读原历史文件仍只能看到当时记录。
并发导致来源变动时重新读取或拒绝，不能把错配的一对当成成功。

| 精确路径 | 本段落点或实际消费 |
| --- | --- |
| `skills/answer-as-page/scripts/build-page-data.mjs` | `buildPageData` 的明确来源、包与事实投影和全 Phase 指纹 |
| `skills/answer-as-page/scripts/check-page-content.mjs` | `checkPageContent` 的 prepublish 对照及已有页过期检查 |
| `skills/answer-as-page/scripts/render-answer-page.mjs` | `renderAnswerPage`、`refreshAnswerPage`、`publishPair`，拒绝坏候选；读已验证旧版，派生临时过期视图并复用现 opener |
| `tests/contract/cockpit-autogen.test.mjs` | 独立测试字节增加具名结构、来源、Phase 实变反例，先冻结 |
| `tests/contract/cockpit-event.test.mjs` | 独立测试字节增加现事件入口与半失败旧版保留，先冻结 |

## 怎么验证？

先核 `git rev-parse --show-toplevel` 与进程 cwd 一致且为认证任务工作树。
核该树的 `package-lock.json` 可读，并实查本地 Vitest 文件与版本。
实施测试负责人复用 `P1-skill-loading.md#怎么验证` 的锁定依赖准备与回执。
运行器、锁文件、工作树或测试收集缺失是装置失败，不能记为目标红。
恢复后由原独立测试负责人执行同一组定向用例。
用现 CLI 入口绑定真实认证工作树、隔离任务、报告和任务证据输出目录。
命令前先执行这段初始化；八个变量都是字面路径，复制即可跑。

```sh
WH_TASK=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/execution-quality-build-code-hardening-20261119
WH_REPORT=$WH_TASK/quality/evidence/final-chain-report.json
WH_OUT=$WH_TASK/quality/evidence/cockpit
WH_HTML=$WH_OUT/overview.html
WH_NODES=$WH_OUT/overview.nodes.json
WH_URL=file://$WH_HTML
WH_BROWSER_EVIDENCE=$WH_TASK/quality/tests/browser-qa-2026-11-19
WH_BROWSER_SCENARIO=$WH_TASK/quality/tests/browser-qa-scenario.sh
```

`WH_REPORT` 由「共同刷新」里的 `node tools/cli/run-checks.mjs --task-path "$WH_TASK"` 输出存成该文件；缺它时三个脚本按各自缺口报错，不补造。
`WH_OUT`、`WH_HTML`、`WH_NODES` 是现有任务库驾驶舱目录与成对文件名，侧车名与 HTML 同名。
`WH_URL` 取当前页的 file 形式；若场景必须经静态服务，用同一次运行返回的 URL 替换它并记入证据。

```sh
node skills/answer-as-page/scripts/build-page-data.mjs --task-path "$WH_TASK" --report "$WH_REPORT"
node skills/answer-as-page/scripts/render-answer-page.mjs --task-path "$WH_TASK" --report "$WH_REPORT" --out-dir "$WH_OUT" --html overview.html
node skills/answer-as-page/scripts/check-page-content.mjs --task-path "$WH_TASK" --report "$WH_REPORT" --html-path "$WH_HTML" --nodes-path "$WH_NODES"
```

指定 HTML 名保证现非事件入口参数齐备；它不调用用户浏览器。
独立测试作者把冻结的逐包真相清单放受控测试原件。
用卡内定向测试命令按身份对照输出，含三处契约坏值和同数错绑输入。
沿现 `cockpit-autogen.test.mjs` 的隔离任务夹具，
让独立测试用 `task.captureCommand` 实际跑同一短 `node --test` 命令。
第一次成功；移除可再生夹具的通过标记后，第二次到达目标断言并失败。
保存两份不同原回执、失败原输出，并从现测试证据入口重复引用第一份。
先核真实命令与退出，再读生成页的测试详情。
若同命令分成多个节点、同原件被加计，或失败无原件可追，须命中断言。
正常结果是同命令汇总、通过数只对应成功原件，失败原件仍可读。
第二次重复执行即使输出与第一次相同，也按实际新回执处理。
该反例沿现定向测试命令重放，无新增浏览器场景或视口。
该测试利用现 `cockpit-autogen.test.mjs` 与 `cockpit-event.test.mjs`，无需新 runner。
正式事件使用同入口的现事件参数；只在隔离或已授权查看能力下运行。
`node skills/answer-as-page/scripts/render-answer-page.mjs --task-path "$WH_TASK" --report "$WH_REPORT" --out-dir "$WH_OUT" --html overview.html --event phase-closed`
测试先走合法事件，再换坏源重跑；核退出非零、原对哈希和旧版查看结果。
用原来受管的查看入口，在隔离浏览器分别察看当前页和边界内的过期视图。
观察标签真实 URL、旧版文字和旧来源展开，随后恢复合法源再刷新。
连跑两次坏候选，核原对字节不变且只有同一个已拥有的临时位置。
确认当前页刷新成功后核该位置清理。测试无有效旧对、固定位置被占、
归属不明或宿主拒绝时的原始失败。
真实打开必须由宿主回执确认，隔离 DOM 或截图单独保存。
最后只改一份 Phase 的业务字节。旧 checker 漏检为预计目标失败。
只有同一断言实际失败且生成/读取正常，才留下目标 RED。
浏览器验收用任务隔离静态服务，仅服务本次页并调用现网关。
`bash skills/isolated-browser-qa/scripts/browser-qa-context.sh --run --url "$WH_URL" --evidence-dir "$WH_BROWSER_EVIDENCE" -- bash "$WH_BROWSER_SCENARIO"`
场景脚本由独立读者按本卡列明的 DOM、动作、截图与反例接到真实入口。
本规划取得现工作包投影的一条目标红。
从当前决策日志解析到实际包名，buildPageData 却只投缺口节点。
原件见本卡 RED 证据；缺规格与索引的合同错误单列，补齐后隔离复验。
该红、现页与受控示例都未证明新模型、生产过期或拒绝。

## 下一消费者拿什么继续？

给用户及第 9 段交页面、侧车、现入口证据和本段独立签字。
保浏览器原始失败、未覆盖状态和环境身份。
材料错误由对应来源 owner 修，发布或显示错误由页面 owner 修。
恢复后按同一份冻结判据重验受影响面，避免用新截图替换原失败。

## 每张任务卡怎么写？

### 任务 7：把驾驶舱接到真实来源再发布

为什么做：旧页面把原始需求和缺口节点错误显示为业务数据。
交付什么：模型有来源，正常页可追溯，旧页可读且过期显式。
不做什么：不另换布局、路线、事实存储和已有验收签字规则；不再修自由文本解析器、不保留按 mtime 判陈旧、不保留旧编号映射分支。
前置：读第二段来源合同、第六段交接、当前模板和页面展示答复。
怎么做：改模型投影及发布顺序，核原件指纹后走现配对写入。
怎么验收：独立执行同一生成正反例，并在真实浏览器走包与来源。
证据：原始回执、页面及侧车、实际 DOM、排版截图、受限签字。
下游（含何时停）：失败保旧件，交对应 owner，受影响处独立复验。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T007
- **来源 / FR / AC**：U-002、U-006、U-007；需求 7，决策日志第六包和 D-007，FR-WH-006，
  AC-P6-001、AC-P6-002。真实展示和判法以任务库编号 013 答复为准。
- **输入**：P2/T002 来源合同，P6/T006 处置原件，现模板与任务事实。
  页面 owner 供实际相同字节，独立读者在实现后判。
- **文件 / 符号**：`skills/answer-as-page/scripts/build-page-data.mjs`、
  `skills/answer-as-page/scripts/check-page-content.mjs`、
  `skills/answer-as-page/scripts/render-answer-page.mjs`、
  `tests/contract/cockpit-autogen.test.mjs`、`tests/contract/cockpit-event.test.mjs`。
  符号：`buildPageData`、`checkPageContent`、`publishPair`。
- **动作**：读取真实模型，验证形状、来源、计数与来源指纹，候选通过后配对发布；
  实变与错误读回原件。独立测试人先冻结逐包真相清单。
  `refreshAnswerPage` 失败时只在确证上一对后走现 opener 展示其过期派生件。
- **输出 / 失败**：合法数据发布成对文件并可独立读回；
  错模型拒绝，正常查看明确过期。原对字节保留，无可核旧版显名缺口。
- **边界 / 禁止改动**：`skills/answer-as-page/templates/overview-template.html`
  布局与样式，`runtime/task/task-store.mjs`，私有库、真凭据、历史页及冻结判据。
- **依赖**：T002、T006
- **测试层级 / 技能**：`fullstack`。S 级生成与发布对照、M 级真实材料子集与真实隔离浏览器；
  主技能 fullstack-slice-testing。测试数据由页面 owner 提供，无生产全量或登录面。
- **场景 / 夹具或服务**：正常包 → 来源，实际阶段，坏结构/指针/计数，
  同数错绑包或 AC 也要拒绝。仅改 Phase 触发过期，旧文件字节保留，
  同一命令的两份真实回执及重复引用须保成功、失败与原件的正确归属。
  真实浏览器按六项观察。初始无可核旧对时预期显名缺口。
- **预写测试**：已冻结 `quality/tests/2026-11-19-008-build-plan-prewritten-page-oracle.mjs`；其工作包子判据已红。独立作者先冻结剩余用例。
- **可观察接缝**：现生成入口的真实 HTML、侧车与错误，隔离页面 DOM 与来源行为。
- **测试变更请求**：无；变更走现独立裁决并保旧判据和证据。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run tests/contract/cockpit-autogen.test.mjs tests/contract/cockpit-event.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0。同一前置与独立判据。
  先回读 P1 锁定依赖准备、认证 cwd 和本地运行器；装置失败不计入 RED。
  工作包投影子断言已实跑 exit 1；该综合命令的配对回执待取得。
- **RED 目标失败**：ORACLE-PROGRESS-PAGE；仅改 Phase 未报陈旧，
  或坏模型进入发布且旧对被替换。
  同命令分裂、同一回执双计或失败来源丢失也须命中具名断言。
  404、空白或环境失败分开记。
- **RED 证据**：`quality/tests/2026-11-19-007-build-plan-page-baseline-red.json` 与同名 `.output`。ORACLE-PROGRESS-PAGE 的工作包子判据命中真实标题投影缺失；初始 spec、index 缺失另记。用 `node --test "$WH_TASK/quality/tests/2026-11-19-008-build-plan-prewritten-page-oracle.mjs"` 保同一断言复验；其余目标红未取得。
- **GREEN 判定器**：ORACLE-PROGRESS-PAGE 用独立断言命中三类坏对照，
  逐个包、级别与验收匹配独立真相清单。
  测试详情的通过数按实际命令回执核，每条失败可回原件。
  真实浏览器读到可追溯状态和前版过期。
- **证据**：计划 `quality/tests/p7-page-contract.output` 和
  `quality/evidence/p7-browser-observation.md`。替换为实际回执路径。
- **覆盖上限**：旧现页和受控规划示例只证明实际观察形态；
  P7 真实模型和旧页拒绝待实现。历史实据不从假数据还原。
- **停止 / 恢复**：范围或身份不明、证据来源不可读或页对不一致时停止发布；
  保存可读旧件和原错误，由对应负责人恢复并独立复验。
- **完成**：前置（不作完成条件）：实际入口、命令退出与浏览器环境可读。
  完成条件（只写效果）：受控错模型拒绝和正常入口追溯可复验，
  逐包对账无漏绑错绑，同命令测试汇总的通过、失败分别可追。
  真实页面可辨当前阶段与上一版过期，排版截图可读。
  AC-P6-001、AC-P6-002 当前 incomplete，正式行为与签字未取得。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计全局权威`
- **Write set**：`skills/answer-as-page/scripts/build-page-data.mjs`、
  `skills/answer-as-page/scripts/check-page-content.mjs`、
  `skills/answer-as-page/scripts/render-answer-page.mjs`、
  `tests/contract/cockpit-autogen.test.mjs`、`tests/contract/cockpit-event.test.mjs`
- **Dependency**：P2、P6
- **消费者**：驾驶舱用户、P9 交付对账与末段验收者
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/cockpit-autogen.test.mjs tests/contract/cockpit-event.test.mjs`
- **oracle**：ORACLE-PROGRESS-PAGE
- **evidence_path**： planned: `quality/evidence/p7-browser-observation.md`
- **STOP**：校验失败不发布，保原错误、旧件及范围，再由独立读者复验。
- **覆盖 AC**：AC-P6-001、AC-P6-002
- **Done**：前置（不作完成条件）：现生成链、失败退回原件及隔离浏览器输入可用。
  完成条件（只写效果）：AC-P6-001 命令级、AC-P6-002 真实环境级，当前均 incomplete。
  需实际结构反例、只改 Phase 的过期检测、可读上一版、真实包和来源交互、
  排版截图及独立验收签字。缺浏览器时对应真实环境项 unavailable 并留恢复条件。
