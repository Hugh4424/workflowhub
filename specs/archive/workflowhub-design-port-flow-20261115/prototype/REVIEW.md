# 独立设计审查只读 brief

## 审查者要判断什么？

请判断这张无稿原型是否支持“读取样例并辨认状态”的完整任务。
请按八维分别写输入、观察、证据和未覆盖项，不给作者自查加独立结论。
你只读审查，不改源码、说明、测试、规格或任务状态。
发现回原型作者修复，受影响项由独立审查者复验。

## 怎样打开真实页面？

Preview 指实际打开的页面，地址为 `http://127.0.0.1:8766/index.html`。
HTTP 是本地页面地址使用的传输方式。
本次普通静态服务已运行，审查前可用浏览器直接打开该地址。
若服务已停止，从仓库根目录运行：

```bash
python3 -m http.server 8766 --bind 127.0.0.1 --directory specs/workflowhub-design-port-flow-20261115/prototype
```

原型目录：
`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-design-port-flow-20261115/specs/workflowhub-design-port-flow-20261115/prototype/`

- `index.html`：一页、一个按钮和初始成功态。
- `styles.css`：唯一局部样式与 Swiss 任务局部样式变量。
- `app.js`：唯一状态 owner 和 JSDoc 注释描述的数据视图形状。
- `README.md`：方向、来源、就绪、Component Quality Map 与限制。

无需 npm、构建、外部字体、凭证或真实业务服务。
直接双击 `file://` 未验证，不要把 HTTP 证据移作双击证据。

## 已声明的范围是什么？

初始成功，唯一按钮依次进入空、错误，再回到成功。
每次切换有读取中反馈，重复输入在读取期间不会新增任务。
成功、空、错误、读取中和恢复均属于本次声明范围。

数据全部为内置合成样例，只验证版式和交互。
页面、区块和值三层均标注样例身份。
无网络业务请求、存储、写入、权限、登录或真实外部失败。
超时、真实取消、迟到响应和部分成功不适用，原因是没有真实异步源。
其它视口与真实产品接线均为 `unknown`，不是默认通过。

## 已实际观察到什么？

实际引擎为 ego-lite 0.6.2.9，`engine_switch: no`。
使用一个隔离浏览器工作区（owned TaskSpace）和初始页面 p1。
认证模式为 none，即没有主动读取或复用登录票据。
ego 使用共享浏览器 profile，存储隔离不属于本次证据范围。
视口为 1440×1000，设备像素比（DPR）为 1。
实际字体为 Helvetica Neue。
其它视口未测，性能未测，原因是没有已确认预算或测量范围。

实际页面地址（URL）与标题已读回。
浏览器页面结构（DOM）中的按钮、结果和三层样例标识就绪。
鼠标点击进入空态，Space 进入错误态，Enter 恢复成功态。
读取中快照显示“正在读取…”与状态消息。
程序聚焦时 active-element 为按钮；键盘后截图可见焦点框。
没有把程序聚焦时的 `outline-style: none` 写成焦点可见证据。

成功、空、错误和恢复图均已由作者实际查看。
大号序号、当前序列和结果内容同步，空态不补零，错误身份清楚。
body 的横向 `scrollWidth` 与 `clientWidth` 均为 1425。
页面高度约 1029 像素，存在垂直滚动；截图不冒完整高度捕获。

控制台在页面就绪后插桩，观察期内未见警告或未捕获错误。
控制台来源位置未知，无跨导航污染；插桩前资源加载未覆盖。
网络也在就绪后插桩，观察期内无后续请求，不证明首屏请求全集。
可访问性证据为语义快照、键盘和焦点，不含自动检查器或真人读屏。
首次真人可用性测试未做，代理观察不冒真人测试。

## 证据原件在哪里？

任务库根：
`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-design-port-flow-20261115`

| 事实 | 相对任务库根的原件 | SHA256 |
| --- | --- | --- |
| 运行场景、引擎与退出 | `quality/evidence/build-plan/2026-11-15-011-prototype-browser-00-scenario-ledger.json` | `46c1faf784d92b004f3ab4a7f563f091ec7a9d8141a58010e02555428ef8998f` |
| URL、标题、DOM 与几何 | `quality/evidence/build-plan/2026-11-15-012-prototype-browser-01-ready-success.json` | `66d6d8b273a29d6787e5de104994a33e2e6764e90b034ab14141d3b0f3fc7d15` |
| 成功截图 | `quality/evidence/build-plan/2026-11-15-013-prototype-browser-02-success-1440.png` | `076a8eaed251cb60860085d481ecd9c131e67ccfc87eee2e9d6f75ebddb595fc` |
| 读取中快照 | `quality/evidence/build-plan/2026-11-15-015-prototype-browser-05-loading.json` | `bb0dda81eddb8e209c6e0253445c2bf951867884e9e1f182a8671bf9748cad21` |
| 空态快照 | `quality/evidence/build-plan/2026-11-15-016-prototype-browser-06-empty-snapshot.txt` | `b58288c5320a0b056d5e83beb49f471bcf356bf7fb906c50bbb3cbfb33ad138d` |
| 空态截图 | `quality/evidence/build-plan/2026-11-15-017-prototype-browser-07-empty-1440.png` | `98be6ce9fd17c27189a8963eed415a4ea5ac17857b59eaeb6c00d20f816bebb6` |
| 聚焦与激活元素 | `quality/evidence/build-plan/2026-11-15-018-prototype-browser-08-keyboard-focus-styles.txt` | `e322c651ae1d7f12a2ed87c45699ebfa3c59f822b5a083781d3fab7335d02af6` |
| 错误快照 | `quality/evidence/build-plan/2026-11-15-019-prototype-browser-09-error-snapshot.txt` | `582f162b966aa774ddc5d60b916dc1b97507cae3490f3cd9f905788ad0849584` |
| 错误截图 | `quality/evidence/build-plan/2026-11-15-020-prototype-browser-10-error-1440.png` | `37163192194ad0c0bdab35e191e6a5cbec9e2bc6c57c655879dc3e25b14effee` |
| 恢复快照 | `quality/evidence/build-plan/2026-11-15-021-prototype-browser-11-recovered-snapshot.txt` | `45abd63f2aaa830a1a70e62e9868fa10a90b4ada429ead40758d74070ecaf93d` |
| 恢复截图 | `quality/evidence/build-plan/2026-11-15-022-prototype-browser-12-recovered-1440.png` | `5d0d62f1a426be8c4d6dd3c7ed1358b13cc28f28c2ea2e15863fa9bad48ba1ca` |
| 控制台与页面事件 | `quality/evidence/build-plan/2026-11-15-023-prototype-browser-13-console.json` | `3c63fa514fb019f80d4783959ff3a109044ffaa637ea716cb7083b17ab4a952c` |
| 网络观察边界 | `quality/evidence/build-plan/2026-11-15-025-prototype-browser-15-network.txt` | `701dc044932b9fcd3b70270e96c1e3e80047661e5a80efa957ab0dca38340541` |
| 浏览器命令回执 | `quality/tests/2026-11-15-019-prototype-isolated-browser-1440-realpath.json` | 见原回执 |

所有截图与记录写入后已逐件回读，字节与 SHA256 一致。
`2026-11-15-024-prototype-browser-14-errors.json` 与控制台原件同字节。
它不是第二份独立事实；后续只引用上述控制台原件，历史件不删不改。

## 清理和失败边界是什么？

ego 返回 `closedSpace: true`，p1 已关闭，未保留受管页面。
未关闭用户浏览器、停止用户服务或清除整个 profile。
Preview 服务保留运行，供你复核；它不是浏览器 owned residue。
证据保存在任务库，不在已清理的浏览器临时根内。

8765 端口占用和两次空入口结果均保留在 `quality/tests/`。
空入口根因是 `.agents` 符号链接使脚本主入口比较失败。
改用同一脚本的 `.claude` 真实路径后成功，没有编辑技能或切换引擎。
ego 提示可升级；本任务未升级，升级需用户另行明确同意。

## 八维审查还需要做什么？

业务任务：核对样例读取是否形成完整、可恢复的最小任务。
信息架构（IA）导航：核对阅读顺序、区域关系和唯一下一步。
交互状态：核对三态、读取中、重复输入与恢复，并声明真实异步未覆盖。
内容数据：核对三层样例标识、缺值语义和无伪造真实数据。
视觉规范：核对单一 Swiss 方向、可见序号识别点和实际渲染。
响应式布局：只判 1440；其它宽度、缩放与压力内容保持未覆盖。
无障碍：核对可访问名、键盘、焦点与对比，保留真人测试缺口。
真实代码交接：核对静态入口、状态与样式 owner、零构建和模拟数据边界。

独立八维审查尚未执行，本 brief 不代表审查通过。
用户展示答复尚未取得，状态为 `unknown`。
请把真实审查原件路径、发现和未覆盖项回传主会话。
