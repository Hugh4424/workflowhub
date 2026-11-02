# PaperBuilder 业务日志高级时间筛选原型

这份原生 HTML/CSS/JS 原型供 build-plan 计划与设计审查使用。
它不冒充 PaperBuilder 生产实现、C07 运行验收或最终业务验收。

## 作者五问：下一位读者怎样使用这份原型？

1. 为谁做：主会话的计划作者和未参与实现的独立设计审查者。
2. 用来做什么：打开真实筛选片段，核对时间输入、转换、错误与非就绪反馈。
3. 会在哪里卡住：指定提交没有本地时间校验专项条款，畸形值也不能由原生控件直接输入。
4. 失败怎样恢复：保留原命令与浏览器输出，由本原型作者只修允许目录后复验受影响项。
5. 哪些词需解释：UTC 是协调世界时；`role=alert` 是错误播报角色；fixture 是明确标记的本地样例。

## 如何运行？

直接入口是本目录的 `index.html`，脚本不依赖模块加载、npm、外部字体或 CDN。
本次实际打开的是临时静态服务中的 `http://127.0.0.1:63309/index.html`。
该服务已停止；`file://` 双击路径未用浏览器验证。

也可在本目录运行以下标准库静态服务：

```sh
python3 -m http.server 0 --bind 127.0.0.1
```

打开命令输出的回环地址即可。
服务只读取本目录，不提供业务 API。

## 页面包含哪些输入和状态？

主页面复用业务日志标题、筛选工具栏、高级字段、状态面板与单行日志结构。
时间输入采用原生 `datetime-local`，标签和提示明确“本地时间”。
筛选采用显式“查询”按钮：对象、结果、关键词、事件类型、动作与时间输入先形成草稿，点“查询”后一起更新列表、计数和空态；不发出网络请求。
空时间会从应用查询中省略对应字段；非法值和开始晚于结束只阻止本次应用，列表保留上次有效查询；改正草稿后错误和 `aria-invalid` 立即清除。
错误区域使用 `role=alert` 且位于高级筛选区外，折叠后仍可见；非法输入使用 `aria-invalid=true`，焦点移到首个非法输入。
列表列头标“时间（本地）”，行内 `datetime` 保留 UTC；DST 歧义/不存在的精确策略仍为 unknown，不在原型里冒充已定。

检查器不是生产 UI，只用于选择本地 fixture 和观察最后有效查询。
fixture 覆盖 ready、loading、empty、filter_no_result、history_unavailable、error。
ready 行数据来自指定提交的 `business-log-page.test.tsx`，不是当前业务事实。
错误 fixture 的“重新加载”只切回 ready，不模拟真实服务端恢复。

## 真实代码和 fixture 从哪里来？

所有代码事实只读 PaperBuilder main Git 对象
`5bdf6f0baadfe15a03935869483b630b749f9d54`，未采用其脏工作树。

| 输入 | 指定提交内路径与定位 | 本原型消费点 |
| --- | --- | --- |
| 路由与页面 | `frontend/src/App.tsx` 的 `BusinessLogRoute`；`frontend/src/business-log-page.tsx` 的 `BusinessLogView`、`BusinessLogFilters`、状态映射 | `/business-logs` 局部结构、字段顺序、查询字段与恢复文案 |
| 测试与 fixture | `frontend/src/business-log-page.test.tsx` 的 `event`、`page` 及高级筛选用例 | ready 行、状态分母、时间转换与展开行为 |
| 行结构 | `frontend/src/business-log-components.tsx` 的 `BusinessLogRow` | ready 表格的六列与样例值 |
| 页面 CSS | `frontend/src/ui/business-log-page.css` | 页面宽度、筛选布局、表格与状态区域 |
| 共享 CSS | `frontend/src/ui/tokens-base.css`、`primitives.css` | 颜色角色、系统字体回退、按钮与非就绪面板 |
| 状态合同 | `frontend/src/ui/ui-contract.ts`、`primitives.tsx` | 非 ready 文案、tone 与 alert/status 角色 |
| 视口 | `frontend/playwright.config.ts` 的 Chromium project | 仅 1440×900；其它尺寸保持 unknown |

外部字体文件没有复制，使用原 token 中已有的系统字体回退。
CSS 只摘取本片段需要的原声明，并为提示、错误和检查器作最小局部补充。

## Screen Read Map：八类来源能否支撑本次审查？

下表的 anchor 是源文件中实际存在的 `anchor_id` 或稳定节名。
`bindable` 只表示可以引用，不表示视觉或质量通过。

| 类别 | 真实源、版本、owner、consumer 与 anchor | 本次状态与缺口 |
| --- | --- | --- |
| ①领域语义 | `GLOSSARY.md`；版本人读字段未提供，绑定上述提交；PaperBuilder 领域 owner；设计、组件、文案消费者；`Language` 第八节、第十二节及 `Relationships` | bindable；Business Event 与 Business Log Center 语义可用于页面和 fixture，不新增业务含义 |
| ②视觉设计系统 | `specs/design/design.md` 2026.10.14.1；C11 设计系统/token owner；primitives、页面 CSS 与规划 reader；`PB-DES-PRINCIPLES`、`PB-DES-TOKENS` | bindable；精确值回 CSS，当前整页视觉批准 unknown |
| ③组件及代码对应 | `specs/design/components.md` 1.0（2026-10-14）；C11 组件设计/前端 owner；实现者与 wrapper 页面；`PB-COMP-OWNERS`、`PB-DES-PRIMITIVE-API` | bindable；复用 AsyncStatePanel 与原生 button 语义，不创建新组件库 |
| ④布局与场景 | `specs/design/layouts.md` 2026.10.14-layouts.1；C11 布局 owner；App 与页面 DOM/CSS owner；`PB-LAYOUT-NAV`、`PB-LAYOUT-GROWTH`、`PB-LAYOUT-RESPONSIVE` | bindable；只取日志局部布局，其它视口与完整页面响应式未验证 |
| ⑤通用交互 | `specs/design/interaction.md` 2026.10.14.1；C11 交互/组件行为 owner；规划、测试、verify reader；`PB-INT-STATE`、`PB-INT-FOCUS`、`PB-INT-FEEDBACK` | update_required；通用状态与焦点可引用，但本地时间格式、非法值和区间顺序没有专项条款，本任务输入只限原型 |
| ⑥前端工程 | `specs/frontend/frontend.md` 2026.10.14.draft1；C11 前端工程 owner；实现与工程验证者；`PB-FE-DATA`、`PB-FE-LIFECYCLE`、`PB-FE-STYLES` | bindable；只演示 ViewModel 投影与查询预览，未验证真实请求生命周期 |
| ⑦内容与工艺 | `specs/design/craft.md` 2026.10.14.1；PaperBuilder 内容设计 owner；组件、文案与专业 reader；`PB-CRAFT-VOICE`、`PB-CRAFT-FACT-COPY`、`PB-CRAFT-TIME` | bindable；沿用平静、可核对及失败恢复文案，不把本地转换改写原事件 |
| ⑧质量判据 | `specs/design/quality.md` 与 `specs/frontend/ui-quality.md` 2026.10.14.1；设计质量及工程验证 owner；独立设计与运行验证者；`PB-QUALITY-ORACLES`、`PB-QUALITY-FIXTURES`、`PB-UI-QUALITY-LAYERS`、`PB-UI-QUALITY-BROWSER` | bindable；浏览器只证本原型实际操作，不证辅助技术、视觉批准、性能或生产链 |

## 状态与视口分母是什么？

页面分母为 1 个局部页面、6 个 fixture 状态、1 个已确认视口，共 6 格。
时间行为另测有效值、空值、畸形值、开始晚于结束及修正恢复。
只使用 1440×900；1280×900、390×844、缩放、其它高度与设备像素比未确认、未测。
本原型没有动画；reduced-motion 专项观察不适用，但没有据此宣称整页无障碍通过。

## mock 边界和未覆盖范围是什么？

所有状态都是本地 fixture，没有 HTTP、存储、鉴权、真实服务或交易副作用。
查询预览是最后一次有效本地输入，不证明生产请求已经发出或成功。
原生 `datetime-local` 会拒绝畸形字符串；畸形值 QA 需用脚本临时改为 text 注入，再恢复原类型。
该路径只证校验分支，不声称用户能在原生控件里输入同样畸形字符串。
没有覆盖生产 React、API DTO、路由深链、详情抽屉、加载更多、迟到响应或真实业务数据。
没有覆盖夏令时详细矩阵；歧义本地时间的产品策略仍 unknown，转换沿浏览器 `Date`。
没有独立设计审查、真人可用性测试、展示确认、视觉/无障碍/性能通过结论。

## 实测到哪里？

本次使用唯一 agent-browser 引擎和同一派生会话，未复用登录态，也未切换引擎。
派生会话为 `codex-qa-workflowhub-workflowhub-ui-frontend-c06-spec-driven-implementation-20261031`。
allowed-domains 只有 `localhost,127.0.0.1`，浏览器为 headless。
实际视口为 1440×900，浏览器时区为 Asia/Shanghai，设备像素比读数为 1。

临时服务命令从 WorkflowHub 工作树根执行：

```sh
python3 -u -m http.server 0 --bind 127.0.0.1 --directory specs/workflowhub-ui-frontend-c06-spec-driven-implementation-20261031/prototype
```

服务输出、URL 与停止事实见任务证据目录的 `35-service.txt`。
完整证据目录是：

`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c06-spec-driven-implementation-20261031/quality/evidence/build-plan/2026-11-01-business-logs-time-prototype/`

实测覆盖有效本地值到 UTC、空值、反序、畸形值、非法属性、首个非法焦点及修正恢复。
也覆盖 ready、loading、empty、filter_no_result、history_unavailable、error 和本地恢复按钮。
有效 UTC 截图是 `16-valid-utc-1440x900.png`，反序截图是 `18-reversed-range-1440x900.png`。
loading、empty、error 截图分别为 `23-loading-1440x900.png`、`24-empty-1440x900.png`、`27-error-1440x900.png`。
实际 DOM、交互输出、console、网络、退出码与清理原件均在同目录。

agent-browser 的 fill 和 type 对原生时间控件未写入值，原输出保留在 `12` 至 `15` 号文件。
后续用原生 value setter 加 input/change 事件完成 DOM 实测，原生键入能力保持 unavailable。
最终 console 没有输出；网络只有本地文档、CSS、JS 和一次 favicon 404，没有业务 API 请求。
启动前和结束后清理均执行，最终清理退出 0，派生会话残留进程为 0。
自己的临时服务已以 SIGTERM 停止，未停止或修改任何用户服务。

真实设计审查、展示与用户确认留主会话，当前不记任何视觉、无障碍或性能通过。
