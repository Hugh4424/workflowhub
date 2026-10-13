# P0 深读笔记：vercel-react-best-practices

- 来源镜像：`/Users/Hugh/Hugh/Project/Website-skills/vercel-react-best-practices/`（SKILL.md 149 行 + rules/ 下 70 个规则文件 + `_sections.md`/`_template.md`，全部精读；编译全文档 AGENTS.md 3810 行）
- 上游：Vercel 官方 `vercel-labs/agent-skills`，skill 路径 `skills/react-best-practices`，metadata version `1.0.0`，license MIT
- 定位：Vercel Engineering 维护的 React/Next.js 性能优化规则集，70 条规则 8 大类，按影响力排序（CRITICAL→LOW），供代码生成、评审、重构时逐条引用；每条规则文件含：为何重要 + 错误示例 + 正确示例 + 参考链接

## ① 核心机制（一句话）

70 条按影响力分级的可执行性能规则（每条带 frontmatter 的 impact/impactDescription/tags 和正误代码对照），按 8 大类组织——消除瀑布流与 bundle 优化为 CRITICAL，服务端 HIGH，客户端取数/重渲染/渲染 MEDIUM，JS 微优化 LOW-MEDIUM，进阶模式 LOW——让 agent 写、审、重构 React/Next 代码时按优先级逐条套用。

## ② 完整可执行规则表（8 大类 70 条，全部精读自 rules/ 原文）

### 类别 1：Eliminating Waterfalls 消除瀑布流（async-，CRITICAL，6 条）

> 类要义：瀑布流是性能第一杀手，每个串行 await 都付出整次网络延迟，消灭它收益最大。

| # | 规则 | impact | 要义 |
|---|------|--------|------|
| 1 | `async-parallel` | CRITICAL（2-10×） | 无依赖的异步操作用 `Promise.all()` 并发执行，3 次串行往返变 1 次 |
| 2 | `async-dependencies` | CRITICAL（2-10×） | 部分依赖的操作用 `better-all`（shuding/better-all）让每个任务在最早可启动时刻自动启动；无依赖方案是先建全部 promise 末尾再 Promise.all |
| 3 | `async-api-routes` | CRITICAL（2-10×） | API 路由/Server Action 中独立操作立即启动（先调不 await），await 推迟到真正需要处；复杂依赖链用 better-all |
| 4 | `async-defer-await` | HIGH | 把 await 挪进真正使用结果的分支，不阻塞用不到它的代码路径；跳过分支频繁或操作昂贵时收益最大 |
| 5 | `async-cheap-condition-before-await` | HIGH | 复合条件里有廉价同步条件（props、请求元数据）时先判它再 await 远程 flag，避免短路场景白付异步成本；若同步条件本身昂贵或依赖 flag 则保持原序 |
| 6 | `async-suspense-boundaries` | HIGH | async 组件不在返回 JSX 前 await 数据，改用 Suspense 边界让外壳（Sidebar/Header/Footer）先渲染、数据区流式进入；可用共享 promise 让多组件共享一次 fetch |

### 类别 2：Bundle Size Optimization 包体积（bundle-，CRITICAL，6 条）

> 类要义：减小首包改善 TTI 与 LCP。

| # | 规则 | impact | 要义 |
|---|------|--------|------|
| 7 | `bundle-barrel-imports` | CRITICAL（200-800ms 导入成本） | 直接从源文件导入，避开 barrel 文件（re-export 入口，流行图标/组件库可达 1 万个 re-export，仅导入就 200-800ms）；库标 external 时 tree-shaking 无效、打包则构建变慢；Next.js 13.5+ 用 `optimizePackageImports`（保类型安全与补全），非 Next 直接深路径导入 |
| 8 | `bundle-dynamic-imports` | CRITICAL（直接影响 TTI/LCP） | 首屏不需要的大组件（如 Monaco ~300KB）用 `next/dynamic` 按需懒加载 |
| 9 | `bundle-analyzable-paths` | HIGH | import 与文件系统路径保持构建期可静态分析（显式 map/字面量路径），藏在变量里的动态路径会迫使打包器宽泛包含、扩大 trace，导致更大的服务端 bundle、更慢构建、更差冷启动、更多内存 |
| 10 | `bundle-conditional` | HIGH | 大数据/模块只在功能激活时加载；`typeof window !== 'undefined'` 检查可让该模块不进 SSR bundle |
| 11 | `bundle-defer-third-party` | MEDIUM | 分析/日志/错误上报不阻塞交互，hydration 之后再加载 |
| 12 | `bundle-preload` | MEDIUM | 按用户意图预载重 bundle（hover/focus 时 preload、feature flag 开启时 preload），降低感知延迟；SSR 侧同样用 window 检查排除 |

### 类别 3：Server-Side Performance 服务端（server-，HIGH，10 条）

| # | 规则 | impact | 要义 |
|---|------|--------|------|
| 13 | `server-auth-actions` | CRITICAL（安全） | Server Action 是公开端点，必须在每个 action **内部**校验认证授权——不能依赖 middleware/layout/page 守卫（可被直接调用）；附输入校验；Next.js 官方文档明示 |
| 14 | `server-parallel-fetching` | CRITICAL | RSC 树内默认串行取数，用组件组合（children/props 传递已取数组件）重构为并行，消除服务端瀑布 |
| 15 | `server-parallel-nested-fetching` | CRITICAL | 并行取嵌套数据时在每个 item 的 promise 内链式串依赖（getChat→getUser），单个慢 item 不阻塞其余 99 个的嵌套取数 |
| 16 | `server-hoist-static-io` | HIGH | 路由处理器/服务端函数里的静态资源 I/O（字体、logo、配置）提升到模块级——模块代码只在首次 import 跑一次，消除每请求重复读盘/网络 |
| 17 | `server-cache-lru` | HIGH | `React.cache()` 只管单请求内；跨连续请求共享数据用 LRU cache（node-lru-cache）；Vercel Fluid Compute 下同实例多请求共享缓存无需 Redis，传统 serverless 考虑 Redis |
| 18 | `server-serialization` | HIGH | RSC→client 边界把对象属性全部序列化进 HTML/RSC 响应，只传客户端实际使用的字段（50 字段只传 1 个），直接减页面重量 |
| 19 | `server-no-shared-module-state` | HIGH | RSC/SSR 禁用可变模块级变量传请求数据——并发渲染同进程共享模块作用域，会竞态、跨请求污染、A 用户数据泄漏进 B 用户响应；例外：只加载一次的不可变静态资源/配置 |
| 20 | `server-cache-react` | MEDIUM | 用 `React.cache()` 做请求内去重（认证、DB 查询收益最大）；注意参数用浅比较（Object.is），内联对象字面量永远 miss，须提取稳定引用 |
| 21 | `server-after-nonblocking` | MEDIUM | 用 Next.js `after()` 把日志/分析/审计等副作用调度到响应发送之后执行，不阻塞响应 |
| 22 | `server-dedup-props` | LOW | RSC→client 序列化按对象引用去重而非按值——同一引用只序列化一次；`.toSorted()/.filter()/.map()` 等变换放到 client 做，避免服务端产生新引用导致数组及全部原始值重复序列化（string[]/number[] 影响 HIGH） |

### 类别 4：Client-Side Data Fetching 客户端取数（client-，MEDIUM-HIGH，4 条）

| # | 规则 | impact | 要义 |
|---|------|--------|------|
| 23 | `client-swr-dedup` | MEDIUM-HIGH | 用 SWR 获得跨组件实例的请求去重、缓存、revalidation；不可变数据与 mutation 各有对应用法 |
| 24 | `client-passive-event-listeners` | MEDIUM | touch/wheel 监听加 `{ passive: true }` 让滚动立即发生（浏览器不再等监听器判断是否 preventDefault）；不需要 preventDefault 的监听（跟踪/日志）都该 passive；自定义手势/缩放除外 |
| 25 | `client-localstorage-schema` | MEDIUM | localStorage 键加版本前缀、只存必要字段，防 schema 冲突与敏感数据误存；getItem/setItem 必须 try-catch（隐私模式/超配额/禁用时抛错） |
| 26 | `client-event-listeners` | LOW | 用 `useSWRSubscription()` 让 N 个组件实例共享 1 个全局事件监听（如 useKeyboardShortcut 多处使用时） |

### 类别 5：Re-render Optimization 重渲染（rerender-，MEDIUM，15 条）

| # | 规则 | impact | 要义 |
|---|------|--------|------|
| 27 | `rerender-no-inline-components` | HIGH | 禁止在组件内定义组件——每次渲染产生新组件类型导致 React 整体 remount，状态/DOM 全毁；要访问父变量就传 props |
| 28 | `rerender-derived-state` | MEDIUM | 订阅派生布尔值而非连续原始值（如媒体查询"是否小于断点"而非"当前像素宽度"），重渲染频率从每像素一次降到布尔翻转一次 |
| 29 | `rerender-derived-state-no-effect` | MEDIUM | 能从 props/state 算出的值不进 state、不用 effect 更新——渲染期直接派生，避免多余渲染与状态漂移；prop 变化需要重置时用 key 重置 |
| 30 | `rerender-transitions` | MEDIUM | 频繁非紧急的状态更新包 `startTransition`，保持 UI 响应（如滚动驱动的更新不阻塞交互） |
| 31 | `rerender-use-deferred-value` | MEDIUM | 输入触发昂贵计算/渲染时用 `useDeferredValue`，输入保持跟手、昂贵结果空闲时再渲染（大列表过滤/搜索场景） |
| 32 | `rerender-use-ref-transient-values` | MEDIUM | 高频变化且不需要触发渲染的值（鼠标追踪、interval、瞬时标志）存 `useRef` 而非 `useState`；state 给 UI，ref 给 DOM 邻接的临时值 |
| 33 | `rerender-functional-setstate` | MEDIUM | 基于当前 state 更新时用函数式 setState——防 stale closure、消除不必要依赖、产出稳定 callback 引用避免子组件多余重渲染 |
| 34 | `rerender-lazy-state-init` | MEDIUM | 昂贵初始值给 `useState` 传函数（惰性初始化只跑一次）；适用于 localStorage 读取、建索引/Map、DOM 读取、重变换；简单原始值/廉价字面量不必 |
| 35 | `rerender-memo` | MEDIUM | 把昂贵工作抽进 memo 化组件以获得提前 return（loading 时跳过计算）；已启用 React Compiler 的项目不需要手动 memo/useMemo |
| 36 | `rerender-memo-with-default-value` | MEDIUM | memo 组件的非原始类型可选参数默认值（数组/函数/对象）提取为模块级常量——否则不传该参时每次渲染新建默认值实例，strict equality 失败、memo 失效 |
| 37 | `rerender-move-effect-to-event` | MEDIUM | 由特定用户动作（提交/点击/拖拽）触发的副作用放事件处理器，不要建模成 state+effect——否则 effect 因无关变化重跑且可能重复执行 |
| 38 | `rerender-defer-reads` | MEDIUM | 只在回调里读的动态状态（searchParams、localStorage）不要订阅，用点再读，避免不必要订阅引发的重渲染 |
| 39 | `rerender-split-combined-hooks` | MEDIUM | 一个 hook 含多个依赖不同的独立任务时拆成多个 hook——合并的 hook 任一依赖变化就重算全部任务；useEffect 同理拆分 |
| 40 | `rerender-simple-expression-in-memo` | LOW-MEDIUM | 简单表达式（少量逻辑/算术运算）且结果为原始类型时不要包 useMemo——hook 调用与依赖比较的开销可能超过表达式本身 |
| 41 | `rerender-dependencies` | LOW | effect 依赖用原始值（user.id）而非对象（user），只在真正用的字段变化时重跑；派生值在 effect 外计算 |

### 类别 6：Rendering Performance 渲染（rendering-，MEDIUM，11 条）

| # | 规则 | impact | 要义 |
|---|------|--------|------|
| 42 | `rendering-content-visibility` | HIGH | 长列表项加 `content-visibility: auto` 推迟屏外渲染——1000 条消息跳过约 990 条的 layout/paint，首渲染快 10× |
| 43 | `rendering-resource-hints` | HIGH | 用 React DOM 资源提示 API（`prefetchDNS`/`preconnect`/`preload` 等）提前加载关键资源；在 server component 里发出可让客户端收到 HTML 前就开始加载 |
| 44 | `rendering-script-defer-async` | HIGH | script 标签必须带 `defer` 或 `async`，否则阻塞 HTML 解析延迟 FCP/TTI；defer 保执行顺序、async 下载完立即执行不保序 |
| 45 | `rendering-hydration-no-flicker` | MEDIUM | 依赖客户端存储（localStorage/cookie）的内容：注入同步内联脚本在 React hydration 前改 DOM，既避免 SSR 崩溃（服务端无 localStorage）又避免 hydration 后闪烁 |
| 46 | `rendering-activity` | MEDIUM | 频繁显隐的昂贵组件用 React `<Activity>` 保留 state/DOM，避免状态丢失与昂贵重渲染 |
| 47 | `rendering-hydration-suppress-warning` | LOW-MEDIUM | 服务端与客户端**有意不同**的值（随机 ID、日期、时区格式）用 `suppressHydrationWarning` 包住消音；只用于预期 mismatch，不得掩盖真 bug、不过度使用 |
| 48 | `rendering-animate-svg-wrapper` | LOW | 许多浏览器对 SVG 元素的 CSS3 动画无硬件加速——包一层 `<div>` 动画容器，transform/opacity 等全部走 GPU |
| 49 | `rendering-hoist-jsx` | LOW | 静态 JSX（尤其大型静态 SVG 节点）提取到组件外，避免每次渲染重建 |
| 50 | `rendering-conditional-render` | LOW | 条件可能为 0/NaN 等可渲染假值时用三元 `? :` 而非 `&&`，防止把 "0" 渲染上屏 |
| 51 | `rendering-usetransition-loading` | LOW | loading 态用 `useTransition` 的内建 `isPending` 而非手动 useState，自动管理过渡、代码更清晰 |
| 52 | `rendering-svg-precision` | LOW | 降低 SVG 坐标精度（如 1 位小数）减小文件体积，最优精度取决于 viewBox；用 SVGO 自动化 |

### 类别 7：JavaScript Performance JS 微优化（js-，LOW-MEDIUM，14 条）

> 类要义：热路径上的微优化累积成可观收益。

| # | 规则 | impact | 要义 |
|---|------|--------|------|
| 53 | `js-length-check-first` | MEDIUM-HIGH | 数组比较涉及昂贵操作（排序/深比较/序列化）时先比 length——长度不等必不相等，省掉两次 O(n log n) 排序；热路径（事件处理/渲染循环）收益最大 |
| 54 | `js-tosorted-immutable` | MEDIUM-HIGH | `.sort()` 原地变异数组会导致 React state/props bug，用 `.toSorted()` 返回新数组保持不可变 |
| 55 | `js-batch-dom-css` | MEDIUM | 避免 layout thrashing：样式写与 layout 读（offsetWidth/getBoundingClientRect/getComputedStyle）交错会强制同步 reflow——先批量写完再一次性读 |
| 56 | `js-cache-function-results` | MEDIUM | 渲染期同输入反复调用同一函数时，用模块级 Map 缓存结果；单值函数有更简模式 |
| 57 | `js-request-idle-callback` | MEDIUM | 非关键工作（分析等后台任务）用 `requestIdleCallback()` 调度到浏览器空闲期，主线程留给交互与动画，减少 jank |
| 58 | `js-index-maps` | LOW-MEDIUM | 同键多次 `.find()` 改为先建一次 Map（O(n)），之后每次查询 O(1)（示例 1M ops → 2K ops） |
| 59 | `js-set-map-lookups` | LOW-MEDIUM | 重复成员判断把数组转 Set/Map，O(n)/次 → O(1)/次 |
| 60 | `js-combine-iterations` | LOW-MEDIUM | 多个 `.filter()/.map()` 链合并为单次循环，多次遍历变一次 |
| 61 | `js-flatmap-filter` | LOW-MEDIUM | `.map().filter(Boolean)` 产生中间数组且遍历两次，用 `.flatMap()` 单遍完成变换+过滤 |
| 62 | `js-cache-property-access` | LOW-MEDIUM | 热循环内缓存对象属性查找（3 次查找×N 次迭代 → 总共 1 次） |
| 63 | `js-cache-storage` | LOW-MEDIUM | localStorage/sessionStorage/document.cookie 同步且昂贵，读结果缓存进内存 Map（用 Map 不用 hook，工具函数/事件处理器里都能用） |
| 64 | `js-early-exit` | LOW-MEDIUM | 结果已确定就提前 return，跳过剩余处理（找到首个错误即返回而非处理全部） |
| 65 | `js-hoist-regexp` | LOW-MEDIUM | RegExp 不要在渲染内创建——提升模块级或 useMemo；警告：global regex 有可变 lastIndex 状态 |
| 66 | `js-min-max-loop` | LOW | 求最小/最大只需单遍循环 O(n)，为此排序是 O(n log n) 浪费 |

### 类别 8：Advanced Patterns 进阶模式（advanced-，LOW，4 条）

| # | 规则 | impact | 要义 |
|---|------|--------|------|
| 67 | `advanced-init-once` | LOW-MEDIUM | 每次 App 加载只跑一次的全局初始化不放组件 `useEffect([])`（dev 双跑、remount 重跑）——用模块级 guard 或入口模块顶层 init |
| 68 | `advanced-effect-event-deps` | LOW | `useEffectEvent` 返回的函数无稳定身份（每渲染变化），不得放入 effect 依赖数组——依赖写真正的响应式值，Effect Event 在 effect 体内调用 |
| 69 | `advanced-event-handler-refs` | LOW | effect 里用到但不希望因其变化而重订阅的回调存 ref（稳定订阅）；新版 React 可改用 `useEffectEvent` |
| 70 | `advanced-use-latest` | LOW | 用 `useEffectEvent` 在回调中访问最新值而不加进依赖数组——既不重跑 effect 又避免 stale closure（useLatest 模式的官方形态） |

**统计核对：6+6+10+4+15+11+14+4 = 70 条 ✓（与 SKILL.md 自述 "70 rules across 8 categories" 一致）**

### 规则文件标准结构（`_template.md` 定义）

每个 rules/*.md 含：frontmatter（title / impact / impactDescription / tags）→ 为何重要的简述 → Incorrect 代码示例 + 讲解 → Correct 代码示例 + 讲解 → 补充上下文与参考链接（react.dev、nextjs.org、github 库）。`_sections.md` 定义 8 个类别的排序、impact 等级与描述，类别 ID 即文件名前缀。AGENTS.md（3810 行）是 70 条规则的编译全量版。

## ③ 对"工程质量四维度"的支撑点

- **组件化**：中-强。`rerender-no-inline-components`（禁内联组件防 remount）、`server-dedup-props`/`server-serialization`（RSC 边界 props 纪律）、`rendering-hoist-jsx`（静态 JSX 外提）、`rerender-memo*`（组件级 memo 边界）直接约束组件划分与 props 设计——这些是"组件边界"的工程规范，不只是性能技巧。
- **统一性**：强。70 条规则全部是"判据 + 正误对照"形态，天然是全队/agent 统一的代码评审语言；frontmatter 的 impact 等级提供统一的优先级词汇（CRITICAL→LOW）；类别前缀（async-/bundle-/…）即分类法。
- **可维护性**：强。每条规则独立成文件、带参考链接与版本（v1.0.0 固定 commit），可单条更新/引用；`_sections.md`+`_template.md` 把"如何加新规则"也规范化了；React Compiler 兼容性等注释（rerender-memo）表明规则随框架演进有维护策略。
- **性能**：**这是该技能的本体，四维度中贡献最大**。系统性覆盖性能全栈：网络瀑布（async/server 并行化）、包体积（bundle 6 条）、服务端响应（cache/序列化/after）、客户端取数去重（SWR/passive listener）、渲染主线程（重渲染 15 条 + 渲染 11 条）、JS 微优化（14 条算法/DOM 层）。其中 CRITICAL 级 10 条集中在瀑布与 bundle——正是数据密集前端的最大收益区；`rendering-content-visibility`（长列表 10×）、`js-index-maps`（1M→2K ops）等对 workflowhub 类列表/看板 UI 直接命中。对 animate 技能形成互补：animate 管"动得对"，本技能管"动得快"（如 `rendering-animate-svg-wrapper` 与 animate 的 transform/opacity 纪律互证）。

## ④ 与 workflowhub 的精确集成点

按 ADR 0016：唯一调用者是 Build-plan、Build-code、Verify-code；真实消费者是 Component Quality Map、前端测试、verify-code 设计对齐检查。落到具体技能：

1. **frontend-component-quality（主集成点）**：70 条规则作为性能维度的规则源进入 Component Quality Map；review 时按类别前缀定位规则、按 impact 分级报告。**必须保持"规则源非证据源"**——规则是评审依据，质量裁决仍由独立审查产出（宪法）。
2. **frontend-prototype-render（代码生成环节）**：生成 React/Next 代码时逐条套用——尤其 async-parallel/suspense（数据获取骨架）、bundle-barrel-imports/dynamic-imports（导入写法）、rerender 系列（hooks 写法）。生成即合规比事后重构便宜。
3. **verify-change（变更验证）**：diff 触及 React/Next 文件时触发相关类别规则的核对清单（如 diff 新增 `useEffect` → 检查 rerender-derived-state-no-effect / move-effect-to-event / advanced-init-once）。
4. **frontend-testing / fullstack-slice-testing**：性能相关测试用例的判定依据（瀑布流是否消除、序列化体积）；`server-auth-actions` 是安全判据可进 slice 测试的安全检查项。
5. **ui-project-init（项目初始化）**：bundle 类规则落到脚手架配置（Next `optimizePackageImports`、script defer/async、资源 hint 基线）。
6. **isolated-browser-qa**：`rendering-content-visibility`、`js-request-idle-callback` 等的实际效果（长列表滚动帧率、hydration 闪烁）只能通过浏览器 QA 观测，作为 QA 用例的性能检查点。
7. **design-extractor / ui-parity-checklist / ui-visual-fidelity**：不直接集成（这些是设计对齐链路，本技能是代码质量链路）；唯 `rendering-hydration-no-flicker`（主题闪烁）与视觉保真有关。

## ⑤ 移植风险

- **许可证**：MIT（SKILL.md frontmatter + 上游仓 LICENSE），可完整复制；ADR 0016 要求保留 LICENSE/UPSTREAM。
- **依赖**：技能本体零代码依赖（纯 markdown）；规则提及的库均为可选运行时建议（better-all、node-lru-cache、SWR、next/dynamic、React 19 的 useEffectEvent/Activity）——非 Next.js 栈约 15-20 条规则（next/dynamic、Server Actions、after()、RSC 系列）不适用，需按栈标注适用范围（既有研究已指出"风险=React 栈绑定"）。
- **上游漂移**：上游是活体仓（vercel-labs/agent-skills），规则随 React/Next 演进（React Compiler 出现已使 memo 类规则附加豁免条件）。既有 UPSTREAM.md 的更新纪律正确：**固定 commit dd089a8c，人工评审时对版，禁止从 main 自动更新**。漂移风险被 pin 住，但代价是规则可能滞后于框架（如 React Compiler 普及后 rerender 类 15 条中多条降级）。
- **镜像仓风险**：Website-skills 镜像（vaferkhanom/Website-skills，非官方）不能作为来源——ADR 已明确"不来自 Website-skills 镜像"，本笔记仅用镜像做深读，移植须从官方仓按 pin commit 取。
- **体积/上下文风险**：全量 AGENTS.md 3810 行——整体塞进上下文不现实；正确用法是 SKILL.md 索引（149 行）+ 按需读单条规则文件，这正是技能的索引设计意图。

## ⑥ 验证或推翻之前结论

**之前结论：vercel-react-best-practices = 按 workflowhub ADR 0016 从官方仓 `vercel-labs/agent-skills@dd089a8c` 完整放入 `skills/external/`（不来自 Website-skills 镜像）。**

**深读后判定：ADR 结论验证成立；但当前仓库实施状态与 ADR 有实质偏差，需推翻"已按 ADR 落地"的隐含假设。**

1. **ADR 0016 文本核实**（`docs/adr/0016-external-first-frontend-component-quality.md`，Accepted 2026-08-22）：明确"完整放入 `skills/external/vercel-react-best-practices/` 并保留 LICENSE/UPSTREAM"、"不复制外部规则进薄适配"、"唯一维护 owner 是 skill bundle maintainer，唯一调用者是 Build-plan/Build-code/Verify-code"。**结论的 ADR 依据真实存在且措辞一致。**
2. **规则规模核实**：70 条 8 大类，各类数量 6/6/10/4/15/11/14/4——与既有研究记录一致 ✓（此前研究中"JS 14"正确；SKILL.md 自述"70 rules"正确）。
3. **推翻点——当前实施不符合 ADR**：现仓库实际状态是 `skills/frontend-component-quality/upstream/react-best-practices/` 下仅有一份 **21 行的手写摘要版 AGENTS.md**（8 类各一段散文，无 70 条规则、无正误对照、无 impact 分级），外加 LICENSE 和 UPSTREAM.md（pin commit 正确）；`skills/external/` 目录**不存在**。即 ADR 要求的"完整放入 skills/external/vercel-react-best-practices/"**尚未执行**，现有 upstream/ 摘要版只是占位。后续任务必须真正落地全量 70 条（rules/ 目录 + SKILL.md 索引），否则 frontend-component-quality 的性能维度没有可调用的规则颗粒度。
4. **对"弃全量版、按 HIGH+ 子集"旧提议的裁决**：既有研究早期表格曾提议"弃 108KB 全量版按 HIGH+ 子集"，但汇总结论已改为按 ADR 完整放入。深读后支持汇总结论——规则的 frontmatter impact 分级本身就是筛选机制，使用时按 CRITICAL/HIGH 优先引用即可，物理上删规则反而制造"第二份被裁剪的真相"，违反 ADR"不复制外部规则"的精神。**保留全量、按需索引**。
5. 版本核实：镜像 SKILL.md metadata version `1.0.0`、license MIT、author vercel，与 UPSTREAM.md pin 的 version 1.0.0 一致；镜像 AGENTS.md 编译版 3810 行存在，可作为官方仓取件时的体积预期参照（仍以官方仓 pin commit 为准）。
