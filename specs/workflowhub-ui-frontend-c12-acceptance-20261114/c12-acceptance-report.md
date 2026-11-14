# C12 验收报告：两页与 v15 的逐格事实、页面质量与未测项

这份报告回答三件事：测了什么、每一格结论是什么、没测的谁去补。

它不写发布结论，也不给整套能力打分；九条验收逐条给档位，缺口逐项留 owner 与恢复条件。

两个内部名字先解释。C10 是发布上线任务 `workflowhub-ui-frontend-c10-release-onboarding-20261103`；C10 读回指它在自己任务里实际加载并读取 `be3160…` 版本的两页 `.inlineactions` 计算值，留下原件，C12 同任务重放不算。C11 是上一张 UI 修复任务 `workflowhub-ui-frontend-c11-gap-repair-20261112`；它的对象是两页入库副本与 v15 七件，四维审查原件属它的字节。

## 这份报告写给谁、怎么读

先读「测了什么」与「九条验收的最终档位」，再按需要查「能力结论」或「页面质量事实」。

不熟悉本项目的人只需记住三类对象：两页（board 与 workbench 两条路由）、v15 单页、设计源六十六件。

四值是逐对象逐能力的判词：可用、部分可用、不可用、未测；它们不是整包评分。

## 测了什么、没测什么

本任务分三段采集：两页（P1）、v15（P2）、更新链（P3）；P4 只读回原件并写本报告。

两页在临时副本上构建并起自有服务，采两条路由乘两个视口的五维，再用页内控件走六个演示态。

v15 起只读静态服务，用页内控件进入十个稳定态乘三个视口，逐格采五维并读状态标记。

更新链在同一个两页副本上把 `--inline-action-gap` 从 12px 改为 16px，重构建并读两页 `.inlineactions` 计算值。

P4 没有重跑 P1/P2/P3 的三条 `node --test`，没有重算上游评分，没有开新浏览器会话。

两页原树 `/Users/Hugh/Hugh/Project/c09-carrier-new-20261103` 全程只读；构建与更新只发生在已删除的临时副本。

## 能力结论

四值定义按 decision-log：可用要四件套加真实回执；部分可用要写清覆盖哪部分；不可用要有失败回执；未测要写缺什么。

下表原件列省略公共前缀 `quality/evidence/`；`…` 表示同一文件名的前段。

### 两页（十六格）

| 能力格 | 四值 | 四件套、覆盖与理由 | 原件 |
| --- | --- | --- | --- |
| C02-P1 查询→页面选择 | 未测 | 两页没有查询调用点，使用冻结样例；按矩阵记未测，不判不可用。owner=用户；恢复=提供两页查询入口后重采。 | `2026-11-14-1504-two-pages-capability.json` |
| C02-P2 经验被页面采用 | 未测 | 需具名后续真实任务读取新版；同任务重放不算采用。owner=用户/后续任务 owner；恢复=具名任务读取新版并回读 C10。 | `2026-11-14-1504-two-pages-capability.json` |
| C03-P1 四对象页面使用点 | 可用 | 调用点=board panels:8、workbench panels:8、primitives:42；输入=primitives props 与冻结 view-model；输出=`pb-ui-metric/status-badge/action/lineage` DOM；消费者=产品内两页。回执=DOM 计数与运行原件。 | `…-1504-two-pages-capability.json`；`…-1508-two-pages-design-facts.json`；`…-1506-two-pages-interaction.json` |
| C03-P2 资产/页面两层检查 | 部分可用 | 覆盖=资产层源码对照与页面 DOM 计数；缺=删 import 的构建红负例，因会改副本字节、干扰 P3 交接而未重跑。owner=独立审查者/Phase 4；恢复=隔离副本执行删 import 构建负例。 | `…-1505-two-pages-design-compare.md`；`…-1508-two-pages-design-facts.json` |
| C04-P1 来源→页面使用点（token） | 可用 | 调用点=`app/globals.css:5` 与 `app/ui/primitives.tsx:14`；输入=设计源 ui 源与 PB token；输出=四格 token 计算值 12px；消费者=产品内两页样式。board 无常驻 `.inlineactions`，其 inline_gap 为 null，不冒充计算值。 | `…-1508-two-pages-design-facts.json`；`…-1505-two-pages-design-compare.md` |
| C05-P1 需求→可运行原型（六演示态） | 可用 | 调用点=页内 `select[data-demo-state]`；输入=六态选择值；输出=`data-load-state`、role、`aria-busy`、重试/恢复按钮；消费者=产品内两页表单。两页 6+6 态实际取得、12/12 与源码期望一致。 | `…-1506-two-pages-interaction.json` |
| C05-P3 完整范围后用户答复 | 未测 | 需用户本人就完整范围作答复；设计源范围不等于用户批准。owner=用户；恢复=用户本人答复。 | `…-1504-two-pages-capability.json` |
| C06-P1 状态 owner/错误/重复/身份 | 可用 | 调用点=panels:29/30 的演示控件与面板；输入=冻结样例/用户动作；输出=DataState、错误文案、按钮可见性；消费者=产品内两页 DOM。12/12 状态标记与源码期望一致。 | `…-1506-two-pages-interaction.json` |
| C06-P2 定向检查读当前字节 | 可用 | 调用点=临时副本；输入=当前十九件；输出=`next build`（含类型检查）回执；消费者=验收报告。构建 exit 0。 | 任务库 `quality/tests/2026-11-14-064-c12-p1-build.json` |
| C06-P3 完整 diff + 四维审查 | 可用 | 调用点=C11 十件清单；输入=当前十九件；输出=十件逐件哈希差异；消费者=验收报告。10/10 与 C11 清单一致；四维审查原件属 C11 字节，本段不重做。 | `…-1602-two-pages-identity.json`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/c11-final-carrier.sha256`（sha256 `63b5136d…`） |
| C07-P1 视觉/布局/溢出/视口 | 可用 | 调用点=两页根元素 `scrollWidth/clientWidth`；输入=四格渲染；输出=四格 overflow 原件；消费者=验收矩阵。4/4 取得；board 390 的 492/375 作为页面质量事实保留。 | `2026-11-14-1512-c12-p1-overflow-board-1280x800.json`；`2026-11-14-1517-c12-p1-overflow-board-390x844.json`；`2026-11-14-1522-c12-p1-overflow-workbench-1280x800.json`；`2026-11-14-1527-c12-p1-overflow-workbench-390x844.json` |
| C07-P2 交互/键盘/焦点/AX | 部分可用 | 覆盖=四格可访问树与两页 Tab 序列；缺=对比度真实回执（采集器只读 role/name/focusable）。owner=独立读者；恢复=按计算色补对比度测量。 | `…-1513-…`；`…-1518-…`；`…-1523-…`；`…-1528-…`；`…-1506-…` |
| C07-P3 a11y 实际 + 200% 缩放 | 部分可用 | 覆盖=AX 树与键盘当前原件；缺=真实 200% 缩放与物理读屏，保持未测。owner=环境 owner/用户；恢复=合法会话 200% 与真人读屏。 | `…-1506-two-pages-interaction.json`；`…-1513-…` |
| C07-P4 性能 | 部分可用 | 覆盖=四格导航计时的 ttfb/DCL/load（各三次取中位）；缺=LCP/CLS/INP 与交互闭包，采集器没有，均未测且无阈值。owner=采集器 owner；恢复=补指标与真实任务闭包。 | `…-1514-…`；`…-1519-…`；`…-1524-…`；`…-1529-…` |
| C07-P5 定位→回修→独立复验 | 部分可用 | 覆盖=C11 四维审查适用于当前字节（两页十九件与 C11 终态 10/10 一致）；缺=独立定向复验未做。owner=独立读者/Phase 4；恢复=逐条对当前十九件复验。 | `…-1504-two-pages-capability.json`；`…-1602-two-pages-identity.json`；C11 清单 |
| C08 变更→使用点同步 | 部分可用 | 覆盖=workbench 12px→16px 实测；缺=board 改前计算值未测（改后 16px 已测）。按 D-015 记部分可用，不记未测。owner=P1 执行者（补 board 改前值）；恢复=同一 board 显示操作补读改前值。 | `…-6501-…`；`…-6505-…`；`…-6506-…` |
数据源状态：`?source=live` 的目标端口 18844 无监听（curl exit 7，http=000），记 unavailable；它是两页五维矩阵的数据源覆盖项，不是能力格，不计入十六格。

### v15（十六格）

| 能力格 | 四值 | 四件套、覆盖与理由 | 原件 |
| --- | --- | --- | --- |
| C02-P1 查询→页面选择 | 可用 | 调用点=`index.html` 载 `query-data.js`→`app.js`→`renderOptions/syncSelection`；输入=8 条样例；输出=候选、详情/YAML、十态文案；消费者=确认区状态机与播报区。真实页面读到 8 个候选，30/30 格状态标记可读。 | `2026-11-14-3504-v15-capability.json`；`…-3506-v15-interaction.json`；`…-3508-v15-checks.json` |
| C02-P2 经验被页面采用 | 未测 | 无具名后续真实任务承接。owner=用户/后续任务 owner；恢复=具名任务读取新版并回读 C10。 | `…-3504-v15-capability.json` |
| C03-P1 四对象页面使用点 | 未测 | v15 不引 PB 组件，本对象无调用点；按无调用点行记未测，不冒可用。owner=用户；恢复=提供 v15 的 PB 组件使用点后重采。 | `…-3504-v15-capability.json` |
| C04-P1 来源→页面使用点 | 部分可用 | 覆盖=两份 CSS（v11/v12）同字节被真实加载；缺=逐项视觉规范达标未证。owner=独立读者；恢复=逐 token 对照。 | `…-3502-v15-identity.json`；`…-3508-v15-checks.json` |
| C04-P2 全状态/全视口对照 | 可用 | 调用点=10 稳定态×3 视口，全部由页内控件进入；输入=状态×视口矩阵；输出=30 格五维原件与状态观察；消费者=报告与复查者。150/150 维可读；match 30、mismatch 0、unknown 0。 | `…-3504-v15-capability.json`；`…-3507-v15-coverage.json` |
| C05-P1 需求→可运行原型 | 可用 | 调用点=`index.html` 三分区 IA 与 `app.js` 十一态状态机；输入=T019 需求 IA 与候选；输出=可运行单页、十态文案、`aria-busy`；消费者=页面本身。30/30 格读到状态标记与控件序列；原型达标不等于用户批准。 | `…-3506-v15-interaction.json`；`…-3502-v15-identity.json` |
| C05-P2 八维独立设计审查 | 部分可用 | 覆盖=当前设计对照与运行观察；缺=八维独立审查未在本段重做，未抽查维度单列。owner=独立设计审查者；恢复=对当前七件逐维复核。 | `…-3505-v15-design-compare.md`；`…-3509-v15-plan-offset-map.json` |
| C05-P3 完整范围后用户答复 | 未测 | 需用户本人答复。owner=用户；恢复=用户本人答复。 | `…-3504-v15-capability.json` |
| C06-P1 状态 owner/错误/重复/身份 | 可用 | 调用点=`app.js:3-17` transition 与 `:123-136` render；输入=页内单选、四个按钮；输出=phase、disabled、身份文案、`aria-busy`、`data-state`；消费者=结果区/播报区。30/30 状态标记实读；pending 3/3 视口实读。 | `…-3506-v15-interaction.json`；`…-3508-v15-checks.json` |
| C06-P2 定向检查读当前字节 | 可用 | 调用点=`delivery.sha256`、两处 `node --check`、七件身份复算、served 字节复核；输入=当前入库副本；输出=五项 exit 0 回执；消费者=验收报告。 | `quality/tests/2026-11-14-104-c12-p2-v15-delivery-check.json`；`quality/tests/2026-11-14-105-c12-p2-v15-syntax-app.json`；`quality/tests/2026-11-14-106-c12-p2-v15-syntax-query-data.json`；`2026-11-14-3508-v15-checks.json` |
| C06-P3 完整 diff + 四维审查 | 部分可用 | 覆盖=当前七件身份复算；缺=C11 四维结论属旧字节，未逐条对当前字节重做。owner=C11/P4；恢复=逐条对当前七件复核。 | `…-3502-v15-identity.json`；`…-3505-v15-design-compare.md` |
| C07-P1 视觉/布局/溢出/视口 | 可用 | 调用点=三视口渲染读根元素滚动宽；输入=渲染页；输出=逐格溢出读数；消费者=报告与复查者。30/30 格取得，根溢出均为 0。 | `…-3507-v15-coverage.json`；`…-3508-v15-checks.json` |
| C07-P2 交互/键盘/焦点/AX | 部分可用 | 覆盖=AX 树 30/30 格与 3 次 Tab；缺=对比度与完整键盘路径（矩阵 C07-P2 含对比度），AX/焦点未全。owner=独立读者；恢复=按计算色补对比度并做完整键盘路径。 | `…-3508-v15-checks.json`；`…-3506-v15-interaction.json` |
| C07-P3 a11y 实际 + 200% 缩放 | 部分可用 | 覆盖=AX 树；缺=物理读屏 not_checked、200% 缩放未测、对比度未测。owner=用户/独立读者/环境 owner；恢复=真人读屏、200% 会话、对比度测量。 | `…-3508-v15-checks.json` |
| C07-P4 性能 | 部分可用 | 覆盖=导航计时的 ttfb/DCL/load、长任务、一次交互时长；缺=LCP/CLS/INP，单次导航采样，median 保持 unknown，无阈值。owner=采集器 owner；恢复=补指标与多次采样。 | `…-3508-v15-checks.json`；`…-3507-v15-coverage.json` |
| C07-P5 定位→回修→独立复验 | 部分可用 | 覆盖=当前七件与 C11 记载的 4 处差异回指；缺=独立复验未做。owner=C11/P4；恢复=逐条独立复验。 | `…-3505-v15-design-compare.md`；`…-3502-v15-identity.json` |

## 页面质量事实

五项按需求 6 的投影表呈现：证据完整度、视觉一致性、交互可用性、可访问性、性能事实。每项只回指来源格，不另立分数；缺来源格记未测并写原因。

| 呈现项 | 本次事实 | 来源格 |
| --- | --- | --- |
| 证据完整度 | 两页 4/4 格、20/20 维；v15 30/30 格、150/150 维；170 件均可解析（402）。两页四格 `state_observation` 只能 unknown（裸路由、状态在内存）；v15 match 30、mismatch 0、unknown 0；pending 三格与 live 数据源仍是缺口。 | 1507、3507、1509、3508、402 |
| 视觉一致性 | 两页五类对照齐全，6 条未批准偏差记不达标（DEV-1/2/3/4/6/7，DEV-5 只算计算层）；v15 无同页稿，五类按不适用/未测，偏差 0 已批准/0 未批准/0 疑似漂移；同页预览 unavailable，C09 的 board 图是「策略列表」不能补同页。 | 1505、3505、939、953、936 |
| 交互可用性 | 两页六演示态 6+6、12/12 与源码期望一致；v15 十稳定态×三视口 30/30 match，pending 三格未测；workbench 390 主操作「刷新」需上滚 97px，滚后可点击未验证。 | 1506、3506、3508、6518 |
| 可访问性 | 两页 AX 2710 节点、v15 10758 节点；各 3 次 Tab；对比度未测、200% 缩放未测、物理读屏：not_checked；reduced-motion 实读 matches=false，减少偏好下动效未复采。 | 1513/1518/1523/1528、3507/3508、1506/3506 |
| 性能事实 | 两页四格导航计时（毫秒，三次取中位）：board 1280 `7.9/15.5/33.8`、board 390 `4.2/12.1/25.4`、workbench 1280 `5.2/13.1/32.4`、workbench 390 `4.9/12.4/24.3`；v15 单次采样 median unknown；交互性能 unknown；LCP/CLS/INP：未测；无阈值、不判红绿。 | 1514/1519/1524/1529、3507/3508 |

### 采集五维的原始事实（支撑，不作结论维）

- 控制台/网络：两页 4/4 格取得同一次导航窗口，console 四格为 1510/1515/1520/1525，network 四格为 1511/1516/1521/1526；请求数 20/16/16/16，failures=0；四格各有 2 个字体 404（inter 与 jetbrains mono 的 woff2），HTTP 4xx 不计入采集器 failures，按真实失败保留。v15 30/30 格取得，三个裸入口导航窗口 15 请求/15 响应，27 个页内切换格 0 事件，无 4xx。
- 溢出：两页 board 1280 为 0、board 390 ready 为 102px（492 vs 390）、board 390 empty 为 0、workbench 1280/390 为 0；v15 30/30 格根溢出为 0。只读 html 根元素，不覆盖后代或内部滚动容器。
- 无障碍：两页 2710 个节点、v15 10758 个节点；键盘只做 3 次 Tab，不是完整键盘路径；对比度、200% 缩放与物理读屏未测。
- 性能：两页四格导航计时见上表；v15 每格单次采样、`median=unknown`，有 `ttfb/DCL/load` 与 `long_tasks.count`；没有 LCP/CLS/INP。
- 状态观察：两页只能 unknown（网址无 state，状态在内存）；v15 match 30、mismatch 0、unknown 0；pending 三格实读后按 150ms 瞬时原因记未测。

采集五维是原料，不是上面五项结论；五项结论只按需求 6 的来源格投影，不把截图或单一读数升级成结论。

## 缺口与恢复

逐项写缺什么、owner 与恢复条件；不把未测写成通过。

| 缺口 | 状态 | 缺什么 | owner | 恢复条件 |
| --- | --- | --- | --- | --- |
| C02-P2 经验被页面采用 | 未测 | 没有具名后续真实任务读取新版 | 用户/后续任务 owner | 具名任务读取新版并回读 C10 |
| C05-P3 完整范围后用户答复 | 未测 | 没有用户本人对完整范围的答复 | 用户 | 用户本人答复 |
| C02-P1 两页 查询→页面选择 | 未测 | 两页没有查询调用点，使用冻结样例 | 用户 | 提供两页查询入口后重采 |
| C03-P1 v15 四对象页面使用点 | 未测 | v15 不引 PB 组件，无调用点 | 用户 | 提供 v15 的 PB 使用点后重采 |
| C04-P1 v15 来源→页面使用点 | 部分可用 | 只证两份 CSS 同字节加载，逐 token 视觉规范未证 | 独立读者 | 逐 token 对照并留读数 |
| C05-P2 v15 八维独立设计审查 | 部分可用 | 八维独立审查未对当前七件重做 | 独立设计审查者 | 逐维复核当前七件 |
| C07-P5 两页 独立复验 | 部分可用 | C11 四维适用但定向复验未做 | 独立读者/Phase 4 | 逐条对当前十九件复验 |
| C07-P5 v15 独立复验 | 部分可用 | 四件差异未独立复验 | C11/P4 | 逐条对当前七件复验 |
| C10 读回：未测 | 未测 | C10 未在自己任务读回 `be3160…` 版本 | C10 | C10 运行时读回新版并留原件 |
| board 改前计算值 | 未测 | P1 没有读 board 非 ready 态 `.inlineactions` 计算值 | P1 执行者 | 受控修改前用同一显示操作读取 |
| workbench 390 主操作可达 | 未测 | 只证需向上滚动 97px，未证滚动后可点击 | 页面 owner/P2 DEV-7 | 滚动后做命中与点击验证 |
| 物理读屏：not_checked | 未测 | 没有真人读屏 | 用户 | 真人读屏环境 |
| 200% 缩放 | 未测 | 没有真实 200% 缩放会话 | 独立读者/环境 owner | 合法隔离会话复采两页与 v15 |
| 对比度 | 未测 | 采集器不读对比度 | 独立读者/设计质量 owner | 按计算色补对比度测量 |
| LCP/CLS/INP：未测 | 未测 | 采集器没有这三项 | 采集器 owner | 补采集器与多次采样 |
| 交互性能 | 未测 | 没有真实任务闭包，`performance.mark/measure` 为空 | 采集器 owner | 提供真实交互任务后复采 |
| reduced-motion 下的动效 | 未测 | 只读到 `matches=false`，未在减少偏好下复采 | 前端质量 owner | 在 reduce 偏好下复采动效 |
| agent-browser 分支 | unavailable | 网关在 ego 已安装时拒绝显式选 agent-browser | 环境 owner | ego 不可用或卸载环境经网关选 agent-browser 复跑 |
| 构建器 webpack 偏差 | 已披露 | Turbopack 拉取 Geist 字体失败，P3 改用 `--webpack` | P3/构建 owner | 字体拉取稳定后复跑 Turbopack |
| 两页字体 404 | 失败事实 | 两个 woff2 请求 404 | 页面/font asset owner | 补齐字体或移除 `@font-face` |
| board 390 横向溢出 102px | 失败事实 | ready 态根 `scrollWidth 492` vs `innerWidth 390` | 页面 owner | 修布局或取得书面批准 |
| C11 旧字节四维 | 未测 | v15 四件字节与 C11 终态不同，四维结论属旧字节 | C11/P4 | 逐条对当前七件复核 |
| T019 原文 | unavailable | 本任务材料没有原文 | 用户/C09 原 owner | 提供原文或可读副本加 sha256 |
| 设计源同页预览 | unavailable | 没有可运行的同页预览 | 设计源 owner/用户 | 提供同页预览并记录入口 |
| live 分支 | unavailable | 18844 无监听 | 环境 owner | 起 live 服务后复采 |
| 删 import 构建负例 | 未测 | 会改副本字节，P1 未跑 | 独立审查者 | 隔离副本执行构建负例 |

### 与已锁矩阵的降级披露

下表列出报告判词与已锁矩阵不同的格；降级都写明理由，不静默改。

| 能力格 | 矩阵判词 | 报告判词 | 降级理由 | 原件 |
| --- | --- | --- | --- | --- |
| C03-P2 两页 | 可用 | 部分可用 | 缺删 import 的构建红负例；会改副本字节、干扰 P3 交接 | 1504 `coverage_limits`、1508 |
| C07-P2 两页 | 可用 | 部分可用 | 缺对比度真实回执 | 1504、1507 |
| C07-P5 两页 | 部分可用 | 部分可用 | 不降级：矩阵即部分可用；C11 四维适用当前字节，独立定向复验未做 | 1504 C06-P3、1602 |
| C08 两页 | 待判 | 部分可用 | workbench 12→16 实测，board 改前未测 | 6501、6505 |
| C07-P2 v15 | 可用 | 部分可用 | 缺对比度与完整键盘路径 | 3504、3508 |
| C07-P5 v15 | 部分可用 | 部分可用 | 不降级：矩阵即部分可用；四件差异未独立复验 | 3504、3505 |

C06-P2 两页不在降级表：矩阵与报告均为可用；副本构建 exit 0、副本与源树十九件身份一致，原树只读边界不允许在原树构建。

### C10 重建入口（可直接执行）

C10 要读回的 `be3160…` 不是已删副本里唯一的对象；按下面步骤可从只读源树重建同版本对象。

1. `cp -R /Users/Hugh/Hugh/Project/c09-carrier-new-20261103 /tmp/c10-c12-carrier`；源树十九件聚合应为 `aa9c53b6…`（1602）。
2. 只改 `app/globals.css` 第 5 行的 `--inline-action-gap:12px` 为 `16px`；改后该文件 sha256 应为 `0a8a411d2406b058ce71d62541f32dc495e33f7b1c69616183adcee4fba3c33e`，十九件聚合应为 `be3160ca09f6a7f983202538d5dc8eb55441a0479b4b2f536a001dc1992a5538`（6502 `after`、6509）。
3. `cd /tmp/c10-c12-carrier && node node_modules/next/dist/bin/next build --webpack`；本机 Turbopack 拉取 Geist 字体失败见 6515，字体正常时可去掉 `--webpack`。
4. `node node_modules/next/dist/bin/next start -p 41924`；不要占用 41921/41922/41923。
5. board 打开 `/simulation-board`，把 `select[data-demo-state]` 切到 `empty`，读 `.inlineactions` 的 `gap`；workbench 打开 `/sim-workbench`（实测入口；需要记录时用实际可达 URL），直接读 `.inlineactions`；两页都应为 `16px`（6505 `pages`）。
6. C10 在自己任务保存对象版本 `be3160…`、两页计算值与时间；C12 不代跑、不重放。

## 验收阶段才做的检查

七项末验按计划逐项执行；其余六项只登记，不新增门。

1. 入口准则：P1/P2/P3 已交付并提交，HEAD 为 `dc4fd813`；三段执行清单与首判原件可读；没有缺失或矛盾到需要停路径的项。
2. 两份就绪件：数据就绪件列对象、矩阵与 170 个五维原件可读性；环境就绪件列服务、引擎、Node 与清理事实。
3. 授权边界：没有使用外部账号、没有触用户浏览器、没有写生产或两页原树；有效矩阵没有重采；C10、物理读屏、业务链与发布均未执行。
4. 逐条结论：九条 AC 的档位、原件与理由见下一节与末验 AC 表；005/006/009 只写待独立读者判定。
5. 五类执行事实：报告 gate、身份复算、`git status`、端口与副本核对、审计形状检查均在本段实际执行；git 与端口命令留 argv/exit/输出，gate 与形状检查留命令与 exit，身份复算留算法与逐件行。
6. 效果评测：正例是未测项都有 owner 与恢复条件；负例是未测冒通过。比较基线是冻结报告骨架与同一内联 oracle，不设性能阈值。
7. 上游复验不是常规项：本段没有重跑 P1～P3 的三条 `node --test`，没有为四张卡重列 F2P/P2P；确需复验时另立独立执行者与范围。

其余六项：变更批准=无；分诊与关闭=缺口逐项留在上表，未关闭项写明真实原因；回写五项=无产品判据变更；六项结论=范围与限制见「测了什么」与「缺口与恢复」；防自证=005/006/009 由独立读者判，作者不自签；失败修复闭环=上游失败原件保留，P4 不修实现。

## 九条验收的最终档位

下表是本段唯一末验读数；005/006/009 只给待判状态与计划原件，作者不给自己写通过。

| 验收 | 档位 | 理由 | 原件 |
| --- | --- | --- | --- |
| AC-C12-001 能力调用 | 通过（读回） | 两页 7 可用/6 部分/3 未测，v15 6 可用/7 部分/3 未测；可用行有四件套与真实回执，无调用点行保持未测。 | `…-1504-…`；`…-3504-…`；`…-1507-…`；`…-3507-…` |
| AC-C12-002 浏览器五维 | 通过（读回） | v15 30 格 150/150 维取得，match 30、mismatch 0、unknown 0；pending 三格实读后按固定原因记未测；两页四格 20/20 维取得，缺采原因可见。 | `…-1507-…`；`…-3507-…`；`…-3506-…` |
| AC-C12-003 设计对照 | 通过（读回） | 两页与 v15 各有五类对照与偏差三态；两页 6 条未批准偏差记不达标，v15 无同页稿按不适用/未测；链深两页全链、v15 单段；独立设计复验判通过。 | `…-1505-…`；`…-3505-…`；`…-939-…`；`…-953-…`；`…-971-…` |
| AC-C12-004 更新同步 | 未测 | 同步子项部分可用（workbench 12→16 实测，board 改前未测）；C10 未读回，整条保持未测，不阻断其它条款。 | `…-6501-…`；`…-6505-…`；`…-6506-…` |
| AC-C12-005 报告四值与质量 | 待独立读者复判 | `053` 对 `5a4b06c5` 判通过（F11–F13 非阻断）；本版按 F11/F12/G3–G5 修辅助项后字节变化，按 `055` 的失效条件需新具名复判。作者不自评。 | `quality/reviews/2026-11-14-053-c12-p4-detail-review-r2.md`；`quality/reviews/2026-11-14-052-build-code-terminal.json` |
| AC-C12-006 报告冷读 | 待独立读者复读 | `056` 对 `5a4b06c5` 判冷读通过，五问可答并附 7 条残余（R1–R7）；本版修 R1–R3/G3–G5 后字节变化，需按受影响问题复读。作者不自评。 | `quality/reviews/2026-11-14-056-c12-p4-cold-read-r2.md` |
| AC-C12-007 身份复算 | 通过（读回） | 三组当前字节独立复算：两页 19 件 `aa9c53b6…`、v15 7 件 `6dc77bf7…`、设计源 66 件 `843d0e88…`，均与基线一致且互异。 | `quality/evidence/2026-11-14-976-404-final-identity.json` |
| AC-C12-008 只读边界 | 通过（读回） | `git diff dc4fd813..HEAD` 为空；`git status -uall` 为报告新增 + 三件驱动修改（052 代码修复，均在任务级写集）；三处原树前后身份一致；构建与更新只在已删除副本。 | `quality/evidence/2026-11-14-986-410-final-boundary-r2.json` |
| AC-C12-009 独立质量来源 | 待独立质量读者复核 | `055` 判 incomplete：053 已绑 `5a4b06c5`，但当时新版冷读 056 未落盘；现 053+056 均绑 `5a4b06c5`，仍待 055 的 owner 按恢复条件复核。作者不自评。 | `quality/reviews/2026-11-14-055-c12-p4-independence-review-r4.md`；“053”；“056” |

## 实测发现

1. board 390 ready 态根横向溢出 102px（`scrollWidth 492` vs `innerWidth 390`）；P3 改令牌后仍为 492，差为 0，不是令牌造成。owner=页面 owner。
2. workbench 390 主操作「刷新」y=-97，需向上滚动；滚动后是否可点击未验证，按未测，不写可达。
3. C10 没有读回 `be3160…` 版本；同任务的 C12 重放不算 C10 读回，AC-C12-004 保持未测。
4. v15 的 `pending` 三格是 150ms 瞬时态，实读后 162–165ms 离开；不作稳定格，三格记未测，行为由交互取证覆盖。
5. 三段的采集全部走 ego-lite；P1/P2 没有 agent-browser 端到端原件，P3 的显式预检记 unavailable（`EGO_INSTALLED_AGENT_BROWSER_FORBIDDEN`）。
6. P3 构建改用 `next build --webpack`：Turbopack 拉取 Geist 字体间歇失败，失败原件保留；最终构建 exit 0，浏览器计算值不受影响，但这个偏差必须披露。
7. 两页四格各有 2 个字体 404（inter 与 jetbrains mono 的 woff2），采集器 failures 不计 HTTP 4xx，报告按真实失败事实保留。
8. P1 没有读 board 非 ready 态的计算 gap，board 改前值只能记未测；不能用 token 值冒充计算值。
9. 两页十九件与 C11 终态 10/10 一致；v15 有 4 处 C11 入库修复，四维审查结论属旧字节，未对当前七件重做。
10. 同页设计预览 unavailable；C09 的 board 图已确认是「策略列表」，只能作全局导航与视觉语汇，不能补同页布局或文案证据。
11. 两页的 `state_observation` 只能记 unknown：网关只收裸路由，两页状态由前端内存持有，网址没有 state 参数；这不影响两页作为辅助事实。
12. P1 截图 1533 不是自然首帧（workbench 挂载 focus 把页头滚出 189px），931 是置顶参照帧；截图不用于证明任何维度通过。
13. 终末 OCR 052 的代码类 findings 已回各 Phase 修复，落成三件驱动修改（`c12-two-pages.mjs`、`c12-v15.mjs`、`c12-update-chain.mjs`）；三件都在任务级写集内，未改测试、spec、Phase 卡或受保护对象。当前边界以 410 为准，405 只作 052 修复前记录。

### 来源事实与材料矛盾

- P1 的 antigravity 在 `024` 原始输出里返回 5 条意见（1 条 blocking：`tests/acceptance/c12-two-pages.test.mjs:158` 把模块不存在包装成假 RED）；`026` 的记录表把它写成 `findings=[]`、`discarded_facts=[]`（packet guard）。内容已被 kimi/codex 的同类发现与 TCR-938 覆盖，但单独读 026 会看成「AG 无发现」；原始见 `quality/reviews/2026-11-14-024-build-code-phase-provider-5.output`。
- `decision-log.md` D-014（:261）与 AC-C12-9 段（:350）仍写「OCR delegate 被挡住，记 unavailable」，与 `026/033/040` 三份已执行 OCR 及 `052` 终末 OCR 矛盾。材料不可改；owner=任务材料作者（make-decision/build-plan）；恢复=由 owner 更新 D-014 或加具名勘误。本报告只点名，不据此改 AC。
- 终末 OCR `052` 已执行：3 路 provider，antigravity 失败（`OCR_PROVIDER_PACKET_GUARD_FAILED`），kimi 4 条、codex 17 条，合计 21 条（17 major/4 minor），conclusion=inconclusive。代码类 findings 已回各 Phase 修复（本报告不重验驱动）；报告类之一正是 v15 C07-P2 被判「可用」，本版已改「部分可用」。
- P4 独立判词：`044`（AC-005）对 01:21 版判不通过（F1–F10）；`046`（AC-006）冷读通过但附 9 条材料缺口；`048`（AC-009）通过但绑定旧 sha。本版按 044 修投影；三份判词对新版均需具名复判/复读，不能沿用。

### 原件短号对照

表中 `…-NNNN-…` 的 NNNN 按本表还原；公共前缀是 `quality/evidence/`，每号唯一。

| 短号 | 文件 |
| --- | --- |
| 145 | `2026-11-14-145-c12-p1-design-review-disposition.md` |
| 930 | `2026-11-14-930-c12-p1-dev6-footer-deviation.md` |
| 932 | `2026-11-14-932-c12-p1-dev7-mount-focus-scroll.md` |
| 934 | `2026-11-14-934-c12-p1-dev5-font-tightening.md` |
| 936 | `2026-11-14-936-c12-p1-design-index-addendum.md` |
| 939 | `2026-11-14-939-c12-p1-design-reverify-verdict.md` |
| 953 | `2026-11-14-953-c12-p2-design-reverify-verdict.md` |
| 971 | `2026-11-14-971-c12-p3-design-reverify-verdict.md` |
| 1504 | `2026-11-14-1504-two-pages-capability.json` |
| 1505 | `2026-11-14-1505-two-pages-design-compare.md` |
| 1506 | `2026-11-14-1506-two-pages-interaction.json` |
| 1507 | `2026-11-14-1507-two-pages-coverage.json` |
| 1508 | `2026-11-14-1508-two-pages-design-facts.json` |
| 1509 | `2026-11-14-1509-two-pages-collect-checks.json` |
| 1510 | `2026-11-14-1510-c12-p1-console-board-1280x800.json` |
| 1511 | `2026-11-14-1511-c12-p1-network-board-1280x800.json` |
| 1512 | `2026-11-14-1512-c12-p1-overflow-board-1280x800.json` |
| 1513 | `2026-11-14-1513-c12-p1-a11y-board-1280x800.json` |
| 1514 | `2026-11-14-1514-c12-p1-perf-board-1280x800.json` |
| 1515 | `2026-11-14-1515-c12-p1-console-board-390x844.json` |
| 1516 | `2026-11-14-1516-c12-p1-network-board-390x844.json` |
| 1517 | `2026-11-14-1517-c12-p1-overflow-board-390x844.json` |
| 1518 | `2026-11-14-1518-c12-p1-a11y-board-390x844.json` |
| 1519 | `2026-11-14-1519-c12-p1-perf-board-390x844.json` |
| 1520 | `2026-11-14-1520-c12-p1-console-workbench-1280x800.json` |
| 1521 | `2026-11-14-1521-c12-p1-network-workbench-1280x800.json` |
| 1522 | `2026-11-14-1522-c12-p1-overflow-workbench-1280x800.json` |
| 1523 | `2026-11-14-1523-c12-p1-a11y-workbench-1280x800.json` |
| 1524 | `2026-11-14-1524-c12-p1-perf-workbench-1280x800.json` |
| 1525 | `2026-11-14-1525-c12-p1-console-workbench-390x844.json` |
| 1526 | `2026-11-14-1526-c12-p1-network-workbench-390x844.json` |
| 1527 | `2026-11-14-1527-c12-p1-overflow-workbench-390x844.json` |
| 1528 | `2026-11-14-1528-c12-p1-a11y-workbench-390x844.json` |
| 1529 | `2026-11-14-1529-c12-p1-perf-workbench-390x844.json` |
| 1602 | `2026-11-14-1602-two-pages-identity.json` |
| 3502 | `2026-11-14-3502-v15-identity.json` |
| 3504 | `2026-11-14-3504-v15-capability.json` |
| 3505 | `2026-11-14-3505-v15-design-compare.md` |
| 3506 | `2026-11-14-3506-v15-interaction.json` |
| 3507 | `2026-11-14-3507-v15-coverage.json` |
| 3508 | `2026-11-14-3508-v15-checks.json` |
| 3509 | `2026-11-14-3509-v15-plan-offset-map.json` |
| 3511 | `2026-11-14-3511-v15-unselected-390x844-network.json` |
| 6501 | `2026-11-14-6501-update-result.json` |
| 6502 | `2026-11-14-6502-update-identity.json` |
| 6505 | `2026-11-14-6505-update-computed.json` |
| 6506 | `2026-11-14-6506-update-readback.json` |
| 6509 | `2026-11-14-6509-update-cleanup-readback.json` |
| 6511 | `2026-11-14-6511-update-responsive.json` |
| 6515 | `2026-11-14-6515-c12-p3-build-bundler-disclosure.json` |
| 6518 | `2026-11-14-6518-c12-p3-responsive-annotations.md` |

## 末验材料

末验五件、AC 勘误与页面审计均写入任务库；文件名由 `openTask(...).appendRecord` 分配，逻辑号写在 slug 里。

| 逻辑件 | 实际路径 | sha256 | 内容 |
| --- | --- | --- | --- |
| 401 最终 AC 表 | `quality/evidence/2026-11-14-981-401-final-ac.json` | `432835d1c67d67ebdd36a37594ab8ad484072a36933dfb4da1c02f0d16e04c97` | 九条 AC 的档位、ref、理由 |
| 402 数据就绪 | `quality/evidence/2026-11-14-974-402-data-readiness.json` | `d6d4ade70909167ecec9c1bd8ee216f30dfe7cf2b0dbc856053846fb5b89ae17` | 对象、矩阵、170 个五维原件可读性 |
| 403 环境就绪 | `quality/evidence/2026-11-14-975-403-environment-readiness.json` | `e205e45782f61c0b03d8dbb5c06b05a6177d8503d1480dbb46f747debc530db5` | 服务、引擎、Node、清理事实 |
| 403 最新清理 | `quality/evidence/2026-11-14-7207-update-cleanup.json` | `e80ac00dce2ca15dd42e38529dd1d96a75f686e3ab4546e44bb11df2b0b1ffcd` | 052 复验后 02:07 再次停服并删副本；当前四端口无监听、副本不存在 |
| 404 最终身份 | `quality/evidence/2026-11-14-976-404-final-identity.json` | `5c5a67075883f6f51177b3b4c21a7e8f7002afa3136f6424a3be5bb99ff58c55` | 三类对象逐件与聚合身份 |
| 405 首次边界（052 修复前） | `quality/evidence/2026-11-14-977-405-final-boundary.json` | `db40e01bcb0d18f8827ac457f97eb23add2a98128943407755813253a93472cd` | 写集、真实 diff、三处前后身份 |
| 406 页面审计 board | `quality/evidence/2026-11-14-978-406-page-audit-board.json` | `87e8792a9c7b5e83dd64f7dabdaf7a8b493aebf843e3f13840aa3059c4d14906` | 八维四态与覆盖限制 |
| 407 页面审计 workbench | `quality/evidence/2026-11-14-979-407-page-audit-workbench.json` | `04bf1219691d9c2a3af5b3299f52a95cbab8b65dab292dfe40d866e7a2625da7` | 八维四态与覆盖限制 |
| 408 页面审计 v15 | `quality/evidence/2026-11-14-980-408-page-audit-v15.json` | `2dbc6f5fe912b5f81d1b634fc80f5cf5c0039833db8fec050a134f786d54e9ba` | 八维四态与覆盖限制 |
| 409 AC 勘误 | `quality/evidence/2026-11-14-984-409-final-ac-erratum.json` | `981e667f20b3010394136017bcc53d3bf07bd736df59b030768b2f86285eaa39` | 401 的计数与 005/006/009 refs 更正；九条档位不变 |
| 410 当前边界 | `quality/evidence/2026-11-14-986-410-final-boundary-r2.json` | `daa0d41c1ea91b6756a0ff3bfe6b07a7e7bf23c72ca22655dc8cce5ff80165f9` | 052 修复后的真实 status；取代 405 作当前边界 |
| 411 回执绑定 | `quality/evidence/2026-11-14-989-411-report-gate-binding.json` | `55c2f6c9605adb9197eea3f91449514b6ff96ba0ec6168e8c05e93b84dde2195` | 把报告 5a4b06c5 与 179 回执固定 |

三个审计形状检查均 exit 0，回执：`quality/tests/2026-11-14-182-c12-p4-audit-board.json`（sha256 `62cd7556…`）、`quality/tests/2026-11-14-183-c12-p4-audit-workbench.json`（`7f66cba4…`）、`quality/tests/2026-11-14-184-c12-p4-audit-v15.json`（`1a31aa67…`）；argv/cwd/exit 见回执。0 只证结构，不代页面裁决。

401 的 AC-001 计数与 005/006/009 refs 按 409 勘误更新；九条档位不变。

## 交接与下一消费者动作

本报告的交接物=本报告加 401–411 原件；P4 之后没有另一个阶段代理，下一消费者是用户、C10 与后续复查者。

用户先读「页面质量事实」与「实测发现」，再决定设计偏差与 C05-P3 的答复；这两项只有用户能定。

独立报告读者按 AC-C12-005 逐格核四值、五项质量与缺口；独立冷读读者按 AC-C12-006 回答五问；独立质量读者按 AC-C12-009 核来源独立性。三人都不继承写作上下文。

C10 在自己的任务读回 `be3160…` 版本并留原件，AC-C12-004 才能重判；C12 不代跑、不重放。

页面 owner 处理 board 390 溢出、workbench 390 首屏滚动与两个字体 404；设计源 owner 提供同页预览与 T019 原文；环境 owner 补 agent-browser 分支与 live 服务。

## 机器字段（校验器用，人可跳过）

- 报告 gate：`node --input-type=module -e "…ORACLE-C12-FINAL…"`。
- 目标 RED：`quality/tests/2026-11-14-181-c12-p4-report-gate-red-c10-r2.json`，exit 1，具名断言 `ORACLE-C12-FINAL C10 读回：未测`；180 是同一次尝试的 exit 0 无效捕获，不作 RED；早期 006 是 ENOENT setup，也不作 RED。
- GREEN：`quality/tests/2026-11-14-179-c12-p4-report-gate-green-5a4b.json`（exit 0，绑定报告字节 `5a4b06c5…`；绑定件 411，sha256 `55c2f6c9…`）。`159` 的 `cede0082…` 是回执文件自身的 sha256，不是报告字节；它判的 01:21 报告工作树字节是 `3d39ecb2…`，也是 `044/046/048` 绑定值，两者是不同对象。
- 本轮最终回执=`quality/tests/2026-11-14-188-c12-p4-report-gate-green-round6.json`（exit 0，2026-11-14T18:27:12Z，sha256 `14c526b30dd54ea2e27fee3fba6da60023f184c032cbee09645f07440835f8d1`；对应加入本行前的版本，含 R1–R3/F11/F12/G3–G5、053/055/056、411 绑定与 401–411 交接）。
- 本轮修订依据：`044`（旧版不通过）、`046`（旧版冷读）、`048`（旧版独立性）、`052`（终末 OCR，21 条）、`053`（AC-005 对 5a4b06c5 通过）、`055`（AC-009 incomplete）、`056`（冷读 r2 通过）；降级披露与 C10 重建入口见「缺口与恢复」。
- 写集：P4 只写 `specs/workflowhub-ui-frontend-c12-acceptance-20261114/c12-acceptance-report.md` 一件；三件驱动修改属各 Phase 的 052 修复，在任务级写集内；任务库 `quality/evidence` 由 appendRecord 发布。
- 不重跑：P4 本身未重跑 P1/P2/P3 的三条 gate；052 终末修复由各 Phase 各自重跑并留回执：`quality/tests/2026-11-14-173-c12-p1-gate-after-ocr5.json`、`quality/tests/2026-11-14-163-c12-p2-v15-green-gate-r3.json`、`quality/tests/2026-11-14-176-c12-p3-update-green.json`，均 exit 0。P4 只读回这些回执，不把它们的读数算成 P4 重跑。
- 身份：两页 `aa9c53b60e979eded854b747a604fa7e5d6c5b94c058c191064a9efca621890f`；v15 `6dc77bf7469aeee3eb14837af318a8622f77a70fe4a1156b2e2ff7f272514f17`；设计源 `843d0e885e49789fa7af7b558004c707f89131445325c54631a128ea45404571`。
- 边界：HEAD `dc4fd8133227347c281bda5a1305382c4c140767`；`git diff --name-only dc4fd813..HEAD` 输出为空；`git status -uall` 为报告新增 + 三件 052 驱动修改。首次边界 405 保留，当前边界 410。
- 覆盖上限：只证本任务矩阵与当前材料可消费；不证业务链、发布、C10 读回、物理读屏、长期效果或未采性能字段。
