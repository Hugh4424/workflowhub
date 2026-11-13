# T019 v15：处理中状态与方法来源

本候选只修复 v14 本地示例在处理中未向确认区域暴露忙状态的缺口。不是正式产品实现、独立验收、用户批准或 AC-P10 通过。作者 `c09_graph_options`（原 v11 作者的代理树名）为原 v11 作者当前代理树不可续后的具名继任者；旧稿与所有原件不覆写。路径相对任务库中的 `workflowhub-ui-frontend-c09-dual-path-verification-20261103/`（外部任务记录，不在本仓）。

## 当前入口和变化

- 入口 `v15/2026-11-11-002-t019-v15-pending-busy-index.html` SHA256 `bb4fe6f4221fb3dfaf5bb33f2db955ada441c1d1244c271d177ebbdb6026129a`。
- 状态脚本 `v15/2026-11-11-001-t019-v15-pending-busy-app.js` SHA256 `41f38356daf183953da2495a986be733f24c484b650c4e7ccb50027770a513da`。入口还通过相对路径使用同目录数据文件与 `../v11`、`../v12` 两份样式；三个依赖的指纹是：
  - 数据文件 `v15/2026-11-12-002-c11-query-data.js` SHA256 `d05a12fd1d65fe74be4b79dc71afeaaaf09f770198ad95e1764f382fe0db0ab1`。
  - v11 样式 `v11/2026-11-10-001-t019-wf-native-next-v11-styles.css` SHA256 `80e5a56a60539cb0af7f74a742410b1231c2464f55f4f72357426d0fe9bcd4de`。
  - v12 样式 `v12/2026-11-11-009-t019-v12-local-demo-styles.css` SHA256 `0d27ac5dd5fd63dc0e94579cac361fcedc516d569ff1a4a3f02bd9b2f20a97ed`。
- 历史里程碑 v14 入口 SHA256 `f3abaef9b6a5b8bd1eed925249537945e98e3021709511371e9ffa36756ee724` 与 v13 状态脚本 SHA256 `41aff858071d7cdd9d0f62bae0f7a78c5e2a9245f8b78ec33a9d79219d30b8f0` 只作旧输入记录，不是当前依赖。
- 入库副本上的修复（改的是本仓 `docs/examples/c11-ui/` 里的拷贝）：页头说明改成真实候选的说法、窄屏代码块改为自动换行、`?state=pending` 入口挂定时器、数据文件里的来源图路径改成仓内相对路径。原 v15 字节与 C11 收口指纹保留在来源记录中，不复写。
- C11 当时的改动：新入口仅为确认区域加入 `id=demo-confirm-panel`、初始 `aria-busy=false`；脚本仅在 render 将该区域 busy 属性同步为 `phase==='pending'`。结果的独立 `role=status` 区域不加 busy，避免其与忙碌区域绑定。原有状态、锁定、身份、文案、样例和样式不变。本轮未访问 PB/API/数据库，不发业务请求或伪造成功。

## 本次能回源的 C01–C08 事实

| 能力 | 实际采用、产物及首消费者 | 可读的独立事实与缺口 |
| --- | --- | --- |
| C01 规范/交互 | `quality/evidence/P5/2026-11-07-005-c01-interaction-expert-adoption.md` 的八态表要求在途局部区域标 `aria-busy`。本轮只把这一条用于 v15 确认区域；`quality/tests/2026-11-11-092-c09-t019-pending-busy-test.cjs` 为代码级首个测试消费者。历史专家原件当时未验证页面应用。 | 本轮作者测试红绿仅证代码映射，当前 v15 实际浏览器及辅助技术独立观察未取得；其它七类规范及完整应用不以此条代替。 |
| C02 知识/经验 | `specs/acceptance/evidence.md` 的 KR-EVID-001 和 `specs/acceptance/done.md` 的 KR-DONE-001，用于本说明中区分来源版本、历史原件与当前局部观察，不把旧结论外推。二者来源沿 `quality/evidence/P4/2026-11-07-004-c09-current-adoption-c02-c08-source-trace.md` 回读；本说明是本轮判读消费者，不宣其改变了页面设计。 | 本轮未新做图查询或找到具名旧经验驱动 v15 页面选择的完整链；历史 v3 查询、C02 后续消费和本次真实 UI 采用不能互相冒充。保持 incomplete。 |
| C03 四对象 | v15 沿 v14 真实引用原 CSS 与本地 DOM，v12 `quality/evidence/P5/void-prototype-v3/t019-wf-native-next/v12/2026-11-11-011-t019-v12-local-quality-map.json` 和 `quality/tests/2026-11-11-060-c09-t019-v12-local-quality.json` 只覆盖当时局部控件 CSS。v15 唯一新增是本地确认容器的属性，状态 owner 是本地脚本，结果区域为同页消费者。 | 没有读取 PB 当前 source/props/variant/consumer；四对象 reuse/compose/gap 的全范围及真实后续消费者仍 unknown。旧 CSS 静态检查不可冒 v15 整页通过。 |
| C04 来源准备 | v14 README 保存其来源和依赖；原 v14 首屏独立复验 `quality/reviews/2026-11-11-005-c09-t019-v14-f-v13-des-01-recheck-original.md` 在具名视口/截图范围固定原 finding。 | v15 当前字节的整页内容、状态和 viewport 独立判断未取得；无稿设计提取及禁读实验按合同 N/A。 |
| C05 原型与设计 | v15 由当前真实文字需求、v14 输入及一个 C01 交互要求衍生，真实候选入口为 HTML。 | 原 v14 的设计结论只绑定 v14；v15 需要独立设计/可访问观察和当前用户对可展示版本的真实答复。旧答复不代本版本。 |
| C06 工程 | 本地状态脚本为唯一状态 owner，确认容器属性是唯一受影响使用点；代码级测试为本轮首消费者。 | 未经当前设计答复，不作依赖该稿的正式 UI 实现；独立代码审查未取得。 |
| C07 页面检查 | 历史 v14 `quality/tests/2026-11-11-086-c09-v14-independent-taskfirst-browser.json` 与 `quality/tests/2026-11-11-090-c09-v14-keyboard-focus-a11y-corrected.json` 只证明各自 v14 具名场景，不能推 v15。 | v15 pending 属性、广播和其余受影响行为需独立真实浏览器测试；完整读屏、键盘、200% 缩放和页面 a11y 均未完成。 |
| C08 受控更新 | 本轮从 v14 定位属性缺口，追加 v15 HTML/JS，保旧原件；本轮目标测试首次消费了新属性。 | 原设计/测试独立 reader 尚未复验新字节，真实后续任务采用未取得；同任务重放不能当后续需求。 |

## 目标失败与作者定向验证

测试 `quality/tests/2026-11-11-092-c09-t019-pending-busy-test.cjs`：`quality/tests/2026-11-11-092-c09-t019-v14-pending-busy-red.json` 对 v14 状态脚本 exit 1，首次断言期望初始 `false` 但未取得该属性；这是一条具体代码级 RED，不是读屏器观察。v15 同测试 `quality/tests/2026-11-11-094-c09-t019-v15-busy-green.json` exit 0，验证 ready/pending/unknown/recovered 的属性切换、结果区域不设 busy、pending 禁重复。其 fake DOM 不能证明辅助技术实际广播。

`quality/tests/2026-11-11-093-c09-t019-v15-syntax.json`、`quality/tests/2026-11-11-095-c09-t019-v15-identity.json`、`quality/tests/2026-11-11-096-c09-t019-v15-regression.json`、`quality/tests/2026-11-11-097-c09-t019-v15-taskfirst.json`、`quality/tests/2026-11-11-098-c09-t019-v15-structure.json` 均 exit 0。身份与旧状态 fake DOM 测试仅为支持新容器的测试替身作调整，原测试原件不变；执行证据和测试源均保存在 `quality/tests/`。它们分别只证明命令范围，不能说明视觉、屏幕阅读或完整方法链通过。

## 下一消费者与限制

主会话应通知原设计/独立测试执行者对当前 v15 精确 HTML/JS 作受影响复验，特别检查 pending 到结果时属性、可访问树及状态播报是否相互干扰；无法实际观察的标 unknown。原 v14 首屏 finding 的定向 fixed、历史用户拒绝与 v14 独立截图均保原时点，不能冒 v15 最新验收。完成独立事实并对当前可展示版本取得真实用户答复之前，不进入依赖该设计的正式 UI 实现；完整 C01–C08 与 AC-P10 仍 incomplete。
