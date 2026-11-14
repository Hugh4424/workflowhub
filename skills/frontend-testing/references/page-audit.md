# 页面审计判据

版本：1.0.0。owner：frontend-testing 方法维护者；consumer：页面采集器、编排器、plan-design-review 页面模式与报告读取者。
本件是唯一判据正文；采集器产事实，形状校验器只核结构，独立执行者裁决页面，不以形状合法冒页面验收。

## 报告怎样产生并核对？

从本件判据与当前真实对象开始，先经 isolated-browser-qa 选择一个引擎和自有会话。
对已选 agent-browser，在同一网关scenario内用 `agent-browser --session "$BROWSER_QA_SESSION" get cdp-url` 取得实际receiver端点；不是固定端口，不取用户浏览器端点。
既有ego路径没有承诺可交给CLI的CDP receiver端点，未取得时不能伪造端点或切引擎。当前已有自有Ego page时，可在同一已授权网关scenario内调用原模块入口，不另建审计器：

`import {runPageAudit} from './skills/frontend-testing/scripts/run-page-audit.mjs'`

`await runPageAudit(args,{env:{BROWSER_QA_ENGINE:'ego-lite',BROWSER_QA_EGO_SPACE_ID:String(ownedSpaceId)},egoPage:ownedPage})`

args仍显式提供下述八项当前身份，不传--cdp-url；ownedPage来自本次真实owned空间的p1，不能claim用户页面或猜空间ID。模块拒绝owned page与raw CDP endpoint混用，核页面路由及viewport/DPR，并在有限只读采集前后复核绑定；控制台/网络从当前导航订阅与主loader事实取，不把旧缓存事件当本次结果。现有注册只读事实及原console/a11y/overflow/performance normalizer复用，未加任意evaluate或endpoint探测。

owned路径在实际Node内用同一报告validator核最终字节；SDK宿主execPath可能是helper而非Node，不能拿它重启CLI校验。外层需要CLI形状检查时使用外层真实Node。形状0仍不等页面验收；无独立判定输入的八维保持未测/incomplete，交互性能未知不补值。原raw CDP CLI入口保持原调用方式，owned路径的实际验证不能冒旧route的真实服务覆盖。

SDK控制错误立即停止该owned浏览器路径，保原件，不自动重试、claim、新建空间、切引擎或finish；只有正常结束且可回读才报告清理成功。空间not found不能反推已finish或宿主回收原因。

逐字填当前身份后调用：
`node skills/frontend-testing/scripts/run-page-audit.mjs --cdp-url "$CDP" --state "$STATE" --viewport "$VIEWPORT" --out "$REPORT" --workspace "$WORKSPACE" --service "$SERVICE" --route "$ROUTE" --object-version "$OBJECT_VERSION" --engine-session "$BROWSER_QA_SESSION" --engine "$BROWSER_QA_ENGINE"`
其中workspace/service/route/object-version/session来自本次实际对象；out采用当前任务具名原件位置，旧报告不覆写。
run-page-audit调用五采集器和规范消费检查，八项对象身份缺失拒2；失败/工具异常保原stdout及子原件，不能只留下成功报告。
有报告后用同一 `node skills/frontend-testing/scripts/check-page-audit.mjs --input "$REPORT"` 核形状；0只证结构，不代页面通过。

对报告的实际引用句运行 `node skills/frontend-testing/scripts/check-report-quotes.mjs --source "$REPORT" --quote "$QUOTE" --expect-source-sha256 "$REPORT_SHA256"`；批量引用改用--quotes显式JSON，窗口不唯一按--lines具名定位。
0表示本次引用检查允许，2为限定类遗漏/哈希拒收，1为工具异常；不能丢失否定、未执行与覆盖限制。
对本次真实材料身份清单运行 `node skills/frontend-testing/scripts/check-version-binding.mjs --materials "$MATERIALS" --criteria skills/frontend-testing/references/page-audit.md --expect-criteria-sha256 "$CRITERIA_SHA256"`。
MATERIALS的每行含material_id/ref/sha256/bytes/role并绑定当前实际字节；批准/交付版本报告另按脚本现有version合同，未知不补值，身份数组不冒完整版本链。
0仅证声明与字节关系，2为身份/版本/同意拒收，1为工具异常；不产生新任务授权。

由独立执行者回读真实报告、原始子证据与两检查输出，逐项裁决；缺子件、失败、范围不足都保未测/incomplete。
同一回修只复验原finding及受影响面，报告、修复记录与独立复验各留原件，历史不得覆盖。

## 八维骨架

名称沿 [设计审查原文](../../plan-design-review/SKILL.md#check)，原文只读，页面模式分别交付：

- **业务任务**：页面任务脚本、实际对象与可观察终态，分开发出、等待、生效、失败和未知。
- **IA 导航**：入口、阅读顺序、返回及完整任务路径证据。
- **交互状态**：适用状态与异步序列结果，同一维分「行为与状态」「运行性能」两组。
- **内容数据**：真实值、缺值、长文本和大数完整值可达证据，声明 fixture/mock 边界。
- **视觉规范**：九维子检查，引用 token、字体、布局与设计基准，分列源缺陷及批准偏差。
- **响应式布局**：任务指定宽高、缩放、局部滚动、浮层及压力内容结果。
- **无障碍**：可访问名、标签、键盘焦点、对比及减少动效证据，只核可访问性。
- **真实代码交接**：页面模式只核工作区、commit、构建、路由与代码版本对应，交接受理面逐项判适用。

file-only 只核源码及缺证据，运行项保持未验证；独立测试或审查者执行页面验收，开发者不自签独立复验。
运行性能只报原始值与 unknown：ttfb、domContentLoadedEventEnd、loadEventEnd 各三次取中位数；交互记 performance.mark/measure、超过 50 ms 的长任务次数与最长值。
性能不设通过线、不进严重度；设计模式的性能写不适用及理由。

## 九维到八维的映射

九维为视觉规范子检查目录，主维判成败，副维只补证据，同一根因只有一个失败点。
对比度、可访问名、键盘焦点以无障碍主判，视觉读数补证据，不重复计数。

| 九维项 | 主维（判成败） | 副维（只补证据） |
| --- | --- | --- |
| layout | 主⑥响应式布局 | 副⑤视觉规范 |
| typography | 主⑤视觉规范 | 副无 |
| colors | 主⑤视觉规范 | 副⑦无障碍 |
| spacing | 主⑤视觉规范 | 副⑥响应式布局 |
| shadows | 主⑤视觉规范 | 副无 |
| borders | 主⑤视觉规范 | 副无 |
| radius | 主⑤视觉规范 | 副无 |
| icons | 主⑤视觉规范 | 副⑦无障碍 |
| states | 主③交互状态 | 副⑤视觉规范、⑦无障碍 |

取值沿 property（属性）、declared（原源声明）、rendered（同状态视口渲染值）、comparison（差异与观察）四项口径。
layout 取矩形与 overflow；typography 取 font-family/font-size/font-weight/line-height；colors 取前景、背景与对比。
spacing 取 margin/padding/gap；shadows 取 box-shadow/text-shadow；borders 取各边 width/style/color；radius 取四角 border-radius；icons 取资产、尺寸、颜色与可访问名；states 取控件状态与计算样式。
各项注明元素、状态、视口、对象版本与原证据；数值、几何、渲染和独立观察并排记录，分歧保复核，不取平均。

## 四态

- 通过：全声明范围实际执行且满足判据，写依据与证据；限定范围不能写通过。
- 失败：已执行且观察到违背判据的事实，写理由与原证据。
- 未测：缺输入、工具、来源或覆盖，写理由、缺项、提供者及恢复条件；unknown 保留，不能补零或跳过。
- 不适用：该项与对象无关，必须同时写理由与依据，不能整页不适用吞掉适用项。

机器事实保原词与原因：pass、fail、incomplete、inconclusive、deferred、missing、inconsistent、unavailable；展示四态不新增机器枚举。
采集 unavailable 是执行事实，不直接塞进检查项 state；依赖该次执行的项保未测及失败引用。
报告形状为 `{object, criteria[], coverage_limits[], summary:{overall}}`，每项含 `{id, dimension, state, evidence, untested_reason?}`；未测及不适用的理由写 untested_reason。
正式证据项沿 `{ref, sha256}`，指向可回读原件；引用、哈希与对象对应由执行者核实，形状合法不证明内容真实。
冻结局部形状测试只要求非空 ref，校验器兼容 ref-only；提供 sha256 时核其格式，但不强制补 hash、不读文件或重算，也不核完整八项身份。
正式报告生产者和验收消费者须逐子证据承接真实 sha256 与对象绑定，不能以本校验器 exit0 或其它未读 criteria 的检查器代替。
object 保 workspace、service、route、state、viewport、engine、engine_session、object_version 八项身份，缺项具名报出，不填默认值。
state 是声明的审计坐标，不是已观测状态；object.state_observation 记 `{declared, observed, result}`，observed 只取页面 URL 的 query state 参数，result 为 match、unknown 或 mismatch。hash 形式（如 `#state=…`）不计入观测，保持 unknown；要观测 hash 状态须改由页面任务作者提供可经 query 观测的入口。
result 非 match（query 无 state 参数、参数不符，或状态只由前端内存持有而无法经 URL 观测）时，报告追加 coverage_limits，说明状态未被观测、由页面任务作者或采集执行者提供可经 URL 观测的状态后重跑，整体保持 incomplete；不把声明值呈现为已观测，也不新增评分、百分比或未知聚合。页面 URL 读取失败时 state_observation 记 reason，coverage_limits 写「状态 URL 未读到：<原因>」，不把未读当作「URL 无 state 参数」。state 不符不中止五维采集，报告记 mismatch 并保留覆盖限制；其它身份坐标不符仍按原身份不符停止。
summary.overall 保真实整体事实词，未覆盖或未测存在时用 incomplete 等原词，保逐项四态，不给总分或百分比。
校验命令 `node skills/frontend-testing/scripts/check-page-audit.mjs --input <report.json>`：0 仅证形状合法，2 形状拒收，其它非零为用法、读取、解析或脚本失败，不作页面裁决。
stdout 恰好一行 JSON，形如 `{"ok":true,"errors":[]}`；各错误含 code、path、message，收集全部结构错误。
六类必驳码：E_TOTAL_SCORE（总分或百分比）、E_UNKNOWN_AGGREGATED（未知聚合为通过或数值）、E_MISSING_EVIDENCE（通过缺证据）、E_MISSING_UNTESTED_REASON（未测缺理由）、E_STATE_OUT_OF_ENUM（四态外状态）、E_LIMITED_PASS（限定范围写通过）；其它字段或类型缺陷以具名结构码定位。

## 分级刻度

BLOCKER（阻断）对应 critical/blocking，任务无法完成或关键操作不可达。
IMPORTANT（重要）对应 moderate/major，明显违背规范或还原要求，即使任务仍可完成。
MINOR（次要）对应 minor，按具名项目规则接受的小偏差，逐项写「按某规则接受」，不冒用户确认或签字。
校准负例：字体 20px→17px、间距 16px→8px、颜色 #1A73E8→#3A83E8 三条都属 IMPORTANT，不因仍能操作降档。
阻断负例：主操作命中区被全屏遮罩接管，elementFromPoint 命中遮罩、任务无法完成，属 BLOCKER；依据是可操作性，不是像素百分比。
同一明确数值 diff 同标尺跑两次须同级；负例不足或有分歧时保未测及复核，不用工具 threshold 当严重度。
处置沿已修、驳回、接受风险、需人定、用户已定，复验另记，保原 finding 正文。

## 采集失败四类

- 未启动 NOT_STARTED：服务或页面未起，执行事实记 unavailable＋对象未就绪；相关检查项记未测及启动条件。
- 失联 UNREACHABLE：CDP 失联，相关项记未测并保已观察事实，写恢复条件。
- 工具异常 TOOL_ERROR：脚本自身异常记 unavailable，异常本身不得写成未测；依赖执行的项保未测及异常引用。
- 身份不符 IDENTITY_MISMATCH：receiver 身份不符记 unavailable，列实际与声明不一致及修复指引，停在该对象。

四类均保已观察事实与原失败，空 items 不冒正常，旧截图不充本次通过。
浏览器经 isolated-browser-qa 唯一入口，选择与回退随身份块保存，选定后失败不切换引擎。

## 必测门

200% 缩放与键盘、焦点顺序及返回是必测，缺任一项就保未测及理由。
读屏/AT 为高优先补充证据，不作必测门，不单独决定通过或失败，没执行写条件与提供者。
file:// 按对象适用性记录，没测就写未测；截图、自动分数与首屏不替代完整交互和页面事实。
状态按真实任务选择默认、加载、空、错误、取消、边界、权限、重复操作、部分成功或结果未知、恢复，逐项有据，不机械创造业务状态。

## 业务任务脚本

按页面任务脚本与可观察终态判成败，列入口、角色、对象、许可、动作、等待、生效、失败与未知；HTTP 200、截图或 toast 不单独证明业务成功。
mock 上写真实业务未覆盖；模拟角色只作状态输入，不冒真人研究，缺权限或数据保未测。
未知只查询，不自动重发真实业务写；失败、取消、重复及恢复分别记录。

## 回修闭环

先复现并定位到页面、元素、状态、视口、对象身份、根因与 owner，再最小修复；设计问题回设计 owner，代码问题回有权写的副本，跨任务规范回原 owner。
独立复验由同一独立角色核原问题及受影响回归，开发者不自签；问题清单交用户和设计 owner 并归档。
局部最多三轮，一轮无新增通过项即停，写原因、缺口与下一路径；停止不等于通过或失败。
预算停止只说明执行终止，工具失败、产品缺陷、资料不足、权限不足分记，未测不算通过。
改变方向、范围、验收或需用户承担风险才升级，攒批列影响和不答后果，其余授权内修复继续。
终末只复核四项：审计报告、修复记录、受影响面回归、独立复验证据；不重跑已证范围，不作首次审计。

## 不适用与依据

每个不适用项必须同时写理由与依据，引用对象特征、实际来源及边界。
无设计源只将设计还原度记不适用，规范、token、内部一致性、状态与布局继续判，不声称视觉还原已验。
静态设计无 URL/console 时对对应运行项列不适用及理由，不凭设计事实签页面通过。

## 四条越界规则

1. 材料身份白名单只有材料号、引用、摘要、字节、角色；改名但摘要与字节相同算同一身份，缺项或字节不同不以改名等价覆盖。
2. 封闭词表保否定、限定、未执行、不能证明、待补证五类；覆盖须登记引用句、理由、签名人、失效条件，缺项不得扩大原结论。
3. 结果措辞不写「已通过」「已闭环」，不引用历史编号作为本次结论，保本次范围、原证据与未覆盖，不继承历史限定 pass。
4. 九类区域各映射到维度与严重度，见附录；受控注入只证校准，不替代真实页面。

采用外部采集或计算件前核证据绑定、严格输入、未知保留、子失败传播，所选实际链用失败注入验证传播，未采用明确写未采用或未修。
本节只定义规则与失败条件，不实现身份、覆盖或判据自哈希工具，不新增控制面。

### 附录：九类区域

| 区域 | 主判归属（采集分类） | 严重度 |
| --- | --- | --- |
| R1-hash-tooltip：哈希浮窗 | ⑥响应式布局（overflow） | IMPORTANT |
| R2-long-text：长文本 | ⑥响应式布局（layout） | IMPORTANT |
| R3-narrow：窄容器 | ⑥响应式布局（layout） | BLOCKER |
| R4-zoom：缩放 | ⑥响应式布局（layout） | BLOCKER |
| R5-scroll-occlude：滚动遮挡 | ③交互状态（interaction） | BLOCKER |
| R6-hover-bridge：悬停桥 | ③交互状态（interaction） | IMPORTANT |
| R7-keyboard-focus：键盘焦点 | ⑦无障碍（a11y） | BLOCKER |
| R8-reduced-motion：减少动效 | ⑦无障碍（interaction 采集分类） | IMPORTANT |
| R9-error-permission-repeat：错误权限重复 | ③交互状态（interaction） | IMPORTANT |

## 规范来源

每个判据登记实际读过的路径、节、版本、作用域、负责人、使用者及用法，报告另列「本次实际读了哪些规范、用在哪」，缺失、过期或未核留 missing/stale/unknown 与影响。
开工最小读取集四类：当前任务入口与真实验收/设计及对象；隔离 QA 方法；所用准则及工具输入/失败实现；适用角色方法及采用前原始证据。
缺任一类，相关项记未测，写缺哪件、谁提供、恢复条件及原 ref，路径存在或 CLI exit0 不推覆盖。

| 路径与节 | 版本/作用域 | 负责人 | 使用者与用法 |
| --- | --- | --- | --- |
| skills/plan-design-review/SKILL.md · Check | 当前可读版/八维原文 | 设计审查方法 owner | 页面审查者保名称与证据边界 |
| skills/project-norm-init/SKILL.md · 规范职责、非UI规范与索引 | 当前可读版/来源路由 | 专业规范原 owner | 执行者按实际检查类回源 |
| skills/frontend-testing/SKILL.md · build-code 实际消费 | 当前可读版/状态及运行 | 前端测试方法 owner | 页面执行者保真实输入输出及未覆盖 |
| skills/isolated-browser-qa/SKILL.md · Core Rules、Output Contract | 本次实际读取版本/采集 | QA 网关 owner | 实际采集者保单引擎、身份、清理与失败 |

路由表不是已读证明，执行者补本次实际版本或 hash 与用法，没读按缺源处理。
精确 token/CSS/API 回任务提供的原专业源，本件不复制值表；规范变更交 norm-sync 及原 owner。
个人研究适用范围与权利沿项目证据规范，许可 unknown 保留，不写成已获 grant。

### 当前溢出采集实际覆盖什么？

现有两条采集路径均只读根元素 html 的 scrollWidth/clientWidth。
它们不扫描后代或内部滚动容器，根未溢出不证明内部布局无溢出。
owned 子原件沿所选 engine 保同一身份；旧 raw 路径保原规范化合同。
owned 候选先由原 collectErrors 校验，拒收字节和子原件保在现证据目录，
正式 out 不发布；已发布原件不覆盖、不为重试删除。

## 组件复用与沉淀结论怎么判？

UI 任务时，页面审计在八维之外另写组件复用与沉淀结论，
结论与八维并列，不替代八维。
结论写清四件事：复用哪些既有组件、改动或新增了哪些组件、这些组件的真实消费者，
以及写回目标项目根下的组件规范哪个路径、读的人是谁；演练时目标项目是演练副本。
没有可复用组件时写「无沉淀」及理由，不写通过；不改组件也要写这句理由。
同一页面的结论交第 7 段审查读，审查不重做审计。

页面审计同时产出七项界面判定字段，交审查读：UI 适用性、UI 合同、组件质量图、
真实消费者、状态所有者、类型化视图模型、样式令牌所有者。
七项中缺任一项证据即未通过，实现者不能自签；补证后由独立执行者复验原项。
非 UI 跳过。
