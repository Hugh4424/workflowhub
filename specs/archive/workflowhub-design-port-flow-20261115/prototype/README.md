# 设计移植样例原型

## 这是什么？

这是无设计稿的一页可编辑原型，不是产品页面或实施夹具。
它只验证一页、一个按钮、合成数据和已声明的读取状态。
合成数据只用于版式与交互验证，不代表真实项目记录。

## 下一位读者怎样使用它？

独立八维设计审查者打开页面，逐维核对并记录真实发现。
规格作者把真实入口、状态、数据边界和未覆盖项写入后续规格。
用户查看完整页面与状态范围后，再决定是否认可展示内容。

开工五问的答案如下。

1. 下一位读者是独立设计审查者、规格作者和用户。
2. 审查者核页面，规格作者取真实输入，用户看实际范围后答复。
3. 最易卡在打开方式、样例与真实数据的区别、状态操作和截图路径。
4. 原型问题回原作者；环境缺失保留原错误和恢复条件。
5. “无稿”指没有合法设计稿；“合成样例”指专为验证而写的数据。

HTML 是页面结构，CSS 是外观样式，DOM 是浏览器读到的页面结构。
HTTP 是本地预览地址使用的传输方式，Preview 指实际打开的页面。
精确路径、命令和机器字段保原样，按作者契约作为行宽例外。

## 设计方向是什么？

这是供技术审查者阅读的样例页，信息密度低，主操作必须一眼可见。
选择 Swiss，而不选开发工具常见的 Industrial 黑底终端风格。
白色网格、左对齐和大号数字让“样例”与“生产页面”一眼分开。

可见识别点是随成功、空、错误变化的蓝色大号序号 01、02、03。
序号、读取序列和结果内容同步变化，不增加第二个操作。

系统严格使用 Swiss：白色与中性灰、Helvetica 系无衬线字体。
唯一强调色为 Yves Klein Blue `#002FA7`，结构只用细线与网格。
不使用圆角、阴影、渐变、纸张纹理、外部字体或图标替代字。

## 设计建议怎样被消费？

设计建议原件在任务库 `quality/tests/2026-11-15-004-prototype-design-system.output`。
轻量栈建议原件在同目录 `2026-11-15-005-prototype-stack-guidance.output`。
两次命令退出码均为 0；建议只作输入，没有持久化第二套设计权威。

| 建议 | 四判 | 处置与实际消费位置 |
| --- | --- | --- |
| 一个主操作、明显层级、大字号 | 支持 | 采用；唯一按钮和大号序号在 `index.html` |
| 焦点可见、语义颜色、减少动态效果 | 支持 | 采用；原生按钮、焦点样式和减少动态效果在 `styles.css` |
| 推荐色板、双字体和外部字体地址 | 冲突 | 不用；与单一 Swiss 方向及零外部服务约束冲突 |
| 营销首屏、粘性导航按钮、更多视口 | 证据不足 | 不用；本任务不是营销页，且其它视口未确认 |
| Tailwind 类名与 `@apply` 建议 | 需上下文 | 不用框架；只吸收原生 CSS 可实现的焦点与语义原则 |

没有执行设计稿提炼，因为本任务没有合法可读的同页设计稿。
没有伪造设计来源、属性提炼、版本、许可或视觉还原结论。

## 页面能做什么？

初始状态为成功，唯一按钮按成功、空、错误顺序读取下一份样例。
每次读取先进入短暂的“读取中”，随后更新序号、序列和结果。
读取期间重复点击不会增加读取任务，结束后按钮恢复。

| 状态 | 页面实际表现 | 下一步与恢复 |
| --- | --- | --- |
| 成功 | 显示三条明确标注的合成值 | 点击读取空样例 |
| 空 | 不显示记录，不补零或伪造内容 | 点击读取错误样例 |
| 错误 | 明确这是有意合成的读取失败 | 点击回到成功样例 |
| 读取中 | 保留旧结果并标记忙碌，按钮显示读取反馈 | 自动进入下一份样例 |

超时、真实请求取消、迟到响应和部分成功不适用。
原因是本原型只切换内置数据，不发起网络或存储操作。
真实写入、权限、登录和业务交易均不在范围内。

## 样例身份怎样标注？

页面顶部标注“整页：合成样例”。
结果区标注“区块：合成样例”。
每条成功值旁边标注“样例值”。
空态与错误态也直接说明其合成身份，不冒充外部失败。

## 哪些来源可以供审查者回读？

<a id="screen-read-map-v1"></a>
这份 Screen Read Map 只记录实际来源和缺口，不建立新规范。
下表的人读版本为 2026-11-15 当前工作树，正式版本号未取得的保持未知。
所有来源均在本日实际读取；用户展示答复仍为 `unknown`。

| 类别 | 实际路径与稳定位置 | 可引用性 | 原 owner 与真实消费者 | 缺口与影响 |
| --- | --- | --- | --- | --- |
| 领域语义 | `GLOSSARY.md` 的“设计源”“设计审查” | bindable | 领域 owner；审查者与规格作者 | 可支持术语，不提供视觉值 |
| 视觉设计系统 | 已加载 `frontend-design` 的 Swiss anchor | bindable（任务局部方向） | 视觉 owner；原型作者与审查者 | 项目视觉正文 missing；不得当全局规范 |
| 组件及代码对应 | `skills/frontend-component-quality/SKILL.md` 与原生 HTML | bindable | 组件 owner；原型与审查者 | 项目组件正文 missing；无既有组件可复用 |
| 布局与场景 | 本 README 的 Swiss 任务局部网格选择 | bindable（任务局部方向） | 布局 owner；原型与审查者 | 项目布局正文 missing；其它视口 unknown |
| 通用交互 | `decision-log.md` 的数据状态决定与原生按钮语义 | bindable | 交互 owner；原型与审查者 | 项目通用交互正文 missing；真实异步未覆盖 |
| 前端工程 | `skills/frontend-prototype-render/SKILL.md` 的静态交付方法 | bindable | 工程 owner；原型与规格作者 | 无构建；生产接线未做 |
| 内容与工艺 | `skills/ui-copy-discipline/SKILL.md` 与 `frontend-design` 内容纪律 | bindable | 内容 owner；原型与审查者 | 首次真人可读性未测 |
| 质量判据 | `skills/isolated-browser-qa/SKILL.md` 与 `skills/plan-design-review/SKILL.md` | bindable | 质量 owner；独立审查者 | 作者实测不代独立审查或用户答复 |

四类资产的结论分别是：原生组件可组合，页面布局为任务局部新增。
现有驾驶舱不是本任务设计稿或布局来源，因此不消费其视觉语汇。
没有同页设计组件或设计布局资产；该项是真实缺口，不是复用许可。

## 实现前就绪怎样判断？

整体处置为 `proceed-with-gap`，因为缺项目规范不妨碍已授权的无稿原型。
缺口只限制“符合既有产品规范”和其它视口判断，不限制本页制作。

| 项 | 来源与状态 | 补法、知会者与消费者 | 处置 |
| --- | --- | --- | --- |
| 八类规范 | 见 Read Map；部分项目正文 missing | 原专业 owner 后续补；审查者与规格作者消费 | proceed-with-gap |
| 四类资产 | 原生组件与原创新布局；同页设计资产 missing | 设计 owner 若补合法稿再核；当前不等待 | proceed-with-gap |
| 设计输入 | 已确认一页、一按钮、样例状态与 1440；无稿 | 原作者按范围实现；用户后续看展示答复 | proceed |
| 检查命令 | 原生语法检查、普通静态服务和隔离浏览器 | 原作者执行并保存真实退出与输出 | proceed |
| 测试数据与执行 | 内置 S 级合成数据；作者走查，独立者后续审查 | 不冒真实数据或独立质量结论 | proceed |

## Component Quality Map 怎样落到真实源码？

组件质量地图记录本地新增，不抽取共享组件或修改既有产品组件。
所有组件的真实消费者都是本页、独立审查者、规格作者和用户预览。
产品代码消费者为 N/A，因为本阶段明确不接生产代码。

| component | action | props/events、状态 owner 与 ViewModel | CSS/token owner | story_or_test_update 与覆盖 |
| --- | --- | --- | --- | --- |
| SamplePage | add-local | 页面组合；`app.js` 持有当前序号与 pending | `styles.css` 的 `:root` 与页面类 | 1440 整页截图；真实产品兼容 N/A |
| SampleNotice | add-local | 页面、区块、值三层静态标注；无事件 | `.sample-tag`、`.value-tag` | DOM 与截图核对；不证数据真实性 |
| StateSequence | add-local | 接收当前状态；`aria-current` 由 `render` 同步 | `.state-rail`、`.state-number` | 三态 DOM 与截图；非交互导航 |
| ResultPanel | add-local | JSDoc `SampleViewModel`；结果、忙碌与错误语义 | `.result-panel` 与结果类 | 成功、空、错误及读取中；真实异步未覆盖 |
| ReadNextButton | add-local | 原生 click、Enter、Space；pending 防重复 | `button` 与焦点样式 | 点击、键盘、焦点和重复输入；无写入 |

DOM 顺序与视觉顺序一致：页首、目的、序列与结果、按钮、页脚。
没有 wrapper、provider、框架运行时、全局第三方 CSS 或外部主题。
`app.js` 是唯一状态 owner，`styles.css` 是唯一局部 CSS/token owner。
后续工程若接真实数据，应替换数据投影，不保留样例值冒充真实值。
生成后已回读真实源码、DOM、四张截图与键盘路径，落点同本 Map。
1440 实测中 body 的 scrollWidth 与 clientWidth 均为 1425，无横向溢出。
页面高度约 1029 像素，1000 像素高视口存在预期垂直滚动。

### 校验器用，人可跳过：consumer-census.v1

```json
{
  "schema": "consumer-census.v1",
  "scanner_version": "targeted-static-read/v1",
  "source_snapshot": "current prototype HTML, JS and CSS working tree",
  "scan_config": {
    "root": "specs/workflowhub-design-port-flow-20261115/prototype",
    "entries": ["index.html"]
  },
  "support_matrix": {
    "route": "not_applicable_static_single_page",
    "import": "supported_script_and_stylesheet_links",
    "lazy": "not_present",
    "CSS": "supported_relative_link",
    "data": "supported_local_literal_only"
  },
  "consumers": [
    {"consumer_id": "independent-design-reviewer", "source": "human", "entry": "REVIEW.md"},
    {"consumer_id": "spec-author", "source": "human", "entry": "README.md"},
    {"consumer_id": "user-preview", "source": "human", "entry": "index.html"}
  ],
  "unknown_reason": "dynamic_loading_and_generated_code_not_present; production_consumers_out_of_scope"
}
```

## 怎样打开实际 Preview？

无需 npm、构建、外部服务或凭证，入口为 `index.html`。
从仓库根目录运行以下普通静态服务：

```bash
python3 -m http.server 8766 --bind 127.0.0.1 --directory specs/workflowhub-design-port-flow-20261115/prototype
```

实际 Preview 为 `http://127.0.0.1:8766/index.html`。
本次服务已在该地址打开，HTTP 检查退出码为 0。
默认端口 8765 被占用，原错误保存在 `quality/tests/2026-11-15-012-prototype-preview-server.output`。
`render_command` 为 N/A，因为交付源码就是静态运行产物。
预览服务保留运行，供独立审查者使用；浏览器工作区已清理。
直接双击 `file://` 尚未验证，不能由 HTTP 结果推导。

## 哪些证据和未完成项必须保留？

实际引擎为 ego-lite，未切换引擎，认证模式为 none。
真实打开命令回执为 `quality/tests/2026-11-15-019-prototype-isolated-browser-1440-realpath.json`。
成功、空、错误和恢复截图分别在以下任务库原件：

- `quality/evidence/build-plan/2026-11-15-013-prototype-browser-02-success-1440.png`
- `quality/evidence/build-plan/2026-11-15-017-prototype-browser-07-empty-1440.png`
- `quality/evidence/build-plan/2026-11-15-020-prototype-browser-10-error-1440.png`
- `quality/evidence/build-plan/2026-11-15-022-prototype-browser-12-recovered-1440.png`

独立审查只读入口为 `REVIEW.md`，含全部状态与证据指针。
其它视口、真人读屏、真人首次使用测试、性能测量均未做。
截图为 1440×1000 视口；页面有少量垂直滚动，未冒完整高度截图。
控制台只在页面就绪后插桩，无警告或错误观察；此前资源加载未覆盖。
独立八维设计审查尚未执行，本作者不作独立设计通过判断。
用户展示答复尚未取得，状态为 `unknown`。
