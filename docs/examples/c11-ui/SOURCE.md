# 来源说明：C11 修好的页面与组件源码

这份说明写给维护者与后续演练者：`docs/examples/c11-ui/` 目录里共 13 件文件，
其中 11 件是从仓外搬来的材料、另两件是本段新写的说明与清单。
下文说清它们从哪来、字节改没改过、许可事实是什么、要改时按什么规则更新。

## 这些材料从哪来？

11 件材料从四个仓外只读目录原样复制（分属两处源树），四处都不是 git 仓，
没有 remote、作者或提交历史。

| 入库位置 | 来源目录（只作出处记录） | 件数 |
| --- | --- | --- |
| `v15/` | `/Users/Hugh/Hugh/Project/c11-v15-work-20261112/t019-wf-native-next/v15/` | 5 |
| `v11/` | `/Users/Hugh/Hugh/Project/c11-v15-work-20261112/t019-wf-native-next/v11/` | 1 |
| `v12/` | `/Users/Hugh/Hugh/Project/c11-v15-work-20261112/t019-wf-native-next/v12/` | 1 |
| `carrier/app/ui/` | `/Users/Hugh/Hugh/Project/c09-carrier-new-20261103/app/ui/` | 4 |

来源任务是 C11 修页，任务库路径：

```text
/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/
```

两份来源清单在它的 `quality/evidence/` 下，自身指纹如下：

| 清单文件 | 自身 sha256 |
| --- | --- |
| `c11-final-v15.sha256` | `f65315154d7fcbed9674cb8a7887a99295e6cf80f7647f72a4a6f3f3b1bdccd8` |
| `c11-final-carrier.sha256` | `63b5136d92719f2f90972b2efec8bc789b996f25c6bb02aa0f08e8ab7ed51ff1` |

两个值等于该任务收口索引第 61、62 行的记载。清单覆盖 v15 五件与载体十件；
本段只入载体十件中的 `app/ui/` 四件，其余六件见下文「为什么不搬载体另外六件」。

## 入库的是哪 11 件？

下表每行是一件材料：入库相对路径、来源文件名、字节数、sha256。
四个值一起构成「搬来没变」的判据，可与 `delivery.sha256` 逐行比对。

| 入库相对路径 | 来源文件名 | 字节 | sha256 |
| --- | --- | --- | --- |
| `v15/2026-11-11-001-t019-v15-pending-busy-app.js` | 同名 | 12461 | `403dfd45691b8e60b26980d79126c6cd8efc8d9c22f0b18e0854c9e25341e709` |
| `v15/2026-11-11-002-t019-v15-pending-busy-index.html` | 同名 | 7438 | `6583295522608cb405c65e01c8f08263533ba2a81a6c9b978800e0ff5f5829f9` |
| `v15/2026-11-11-003-t019-v15-pending-busy-readme.md` | 同名 | 6756 | `69f64eb19f1a420afc0821fca3f639b0c84bdb643cbe3913ecfb0922dac75075` |
| `v15/2026-11-12-001-c11-query-writer.mjs` | 同名 | 7501 | `7c7cdc170a8fa6d2b8abd2f6c56a46381eec131748a729acb2f3919e7562da68` |
| `v15/2026-11-12-002-c11-query-data.js` | 同名 | 9162 | `edddffefb5c4de65ef5f3a0045336f56107f7bfeb8b26bde9d0e5c6b5d71734f` |
| `carrier/app/ui/primitives.tsx` | 同名 | 4300 | `aa3ae156067db32f0a1f834293de4481e16bd87fcd1e9618d9d543a6fc5cfe14` |
| `carrier/app/ui/primitives.css` | 同名 | 17581 | `2f3bfc6c314170d246b519e28c3cadd07e8df3f2df1e2b3091e92d970cc6f0ea` |
| `carrier/app/ui/tokens-base.css` | 同名 | 3668 | `eb92cb74b6070bc6f6eff72ef29f25fd225a54b9d553d241224673c1806775ad` |
| `carrier/app/ui/ui-contract.ts` | 同名 | 1830 | `549ba96851a45572d8a7adc27afda6dc378dc7e7d5a79432e321cd68d7241a63` |
| `v11/2026-11-10-001-t019-wf-native-next-v11-styles.css` | 同名 | 13443 | `80e5a56a60539cb0af7f74a742410b1231c2464f55f4f72357426d0fe9bcd4de` |
| `v12/2026-11-11-009-t019-v12-local-demo-styles.css` | 同名 | 459 | `0d27ac5dd5fd63dc0e94579cac361fcedc516d569ff1a4a3f02bd9b2f20a97ed` |

搬入时逐件用 `shasum -a 256` 与来源比过，11 件全等，没有一件被改过字节。
`SOURCE.md` 与 `delivery.sha256` 是本段新写的两件，故目录里共 13 件文件。
镜像之后本段又按旧账清单改过其中 7 件（页面、状态脚本、说明、数据文件、组件、
契约、令牌注释），改后的字节见下面「修复后的交付字节是什么？」一节；镜像时的来源比对
原件仍留在任务库 `quality/tests/2026-11-13-p8-fingerprint-check.output`。

## 哪些字节是派生的？

载体四件不是原创，是 PaperBuilder 前端的裁剪副本；关系实测如下，不靠注释推断。

- `primitives.css` 与上游同名文件逐字节相同（`diff` 输出 0 行），上游路径：

  ```text
  /Users/Hugh/Hugh/Project/PaperBuilder/frontend/src/ui/primitives.css
  ```

- `tokens-base.css` 相对同一上游差两处：多了两行 C11 期间的注释，
  `#root` 去掉 `overflow: hidden`；色值与字体变量没变。
- `primitives.tsx` 与上游差 150 行、`ui-contract.ts` 差 342 行，都是裁剪副本；
  两件文件头自述 “Minimal copy of PaperBuilder frontend/src/ui/…”，与实测一致。
  这两件在入库后又被旧账修复删掉了异步态组件与其 contract 符号，所以现在的字节
  比镜像时更短；`primitives.css` 没动，仍与上游逐字节相同。
- v15 五件出自本项目自有的 C09／C11 任务链，它的 readme 记了 TaskRoot 与作者代理，
  不是第三方代码。
- 两份样式是同一任务树的兄弟目录产物：v11 定义页面级变量与 `.site-header`、`.hero`
  等整页样式；v12 只有四条 `.local-demo` 控件规则。
- 没有第三方内容：搬来的 11 件里没有外链、也没有版权行。
  `tokens-base.css` 声明了两个 `@font-face`（Inter、JetBrains Mono），`src` 指向
  `/fonts/*.woff2`；字体二进制不在入库集，所以本段不产生字体再分发。

## 为什么多搬了两份样式？

因为 v15 页面靠它们显示。`v15/2026-11-11-002-…-index.html` 第 8、9 行分别引用
`../v11/<名称>.css` 与 `../v12/<名称>.css`；只搬 v15 五件时这两条相对路径指向空目录，
页面会退化成裸 HTML。所以两份样式放在 `v11/`、`v12/` 两个子目录，
与页面里的 `../v11/`、`../v12/` 相对关系保持一致。

打开方式也因此固定：静态服务的根是 `docs/examples/c11-ui/`，不是 `v15/`，命令见本文末。

## 为什么不搬载体另外六件？

只沉淀组件与样式变量源码，搬页面会把一个需要构建的 Next.js 应用带进仓。
不搬的是 `app/globals.css`、`app/data/view-model.ts`、`app/simulation-board/page.tsx`、
`app/sim-workbench/page.tsx`、`app/components/simulation-board-panels.tsx`、
`app/components/sim-workbench-panels.tsx` 六件。所以载体清单只能按子集校验：
取 `app/ui/` 开头的四行，其余六行明示不搬，不算缺件。

## 许可事实是什么？

**源目录无任何许可文件**：四处来源目录都没有 LICENSE、COPYING、NOTICE 或 README，
载体 `package.json` 没有 `license`、`author` 字段，11 件文件头也没有版权行；
源目录不是 git 仓，因此没有 remote 与作者可查。按「不猜测许可证、没有就写没有」，
**这 11 件的许可事实仍记为 unknown，不写成已获许可**。

上游 PaperBuilder 仓同样没有 LICENSE，它的第三方声明只覆盖 vendor 快照与依赖清单，
不覆盖这四件载体源码。

入库依据是用户 2026-11-13 的书面答复，原文要点：「可以，是我自己的材料，按 MIT 公开入库」。
答复原件在任务库：

```text
/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-stage-integration-20261113/quality/evidence/human-confirmations/2026-11-13-005-build-code-authorized.json
```

该原件的 `stage` 是 `build-code`，`decision` 是 `authorized`，同一份答复的第二问是
「补搬 v11 与 v12 两份 CSS」，也就是上一节所说的两件样式。

按该答复处理：材料视为项目所有者自有，按本仓 MIT 对外公开；许可事实本身仍写 unknown，
风险由项目所有者承担，不推论职务作品、不新增第三方署名。

## 修复后的交付字节是什么？

下表是与 `delivery.sha256` 同值的交付字节，不是镜像时的来源字节。
七件被旧账修复改过，另四件与来源仍逐字节相同。

| 入库相对路径 | 字节 | 修复后 sha256 |
| --- | --- | --- |
| `v15/2026-11-11-001-t019-v15-pending-busy-app.js` | 12650 | `41f38356daf183953da2495a986be733f24c484b650c4e7ccb50027770a513da` |
| `v15/2026-11-11-002-t019-v15-pending-busy-index.html` | 7741 | `bb4fe6f4221fb3dfaf5bb33f2db955ada441c1d1244c271d177ebbdb6026129a` |
| `v15/2026-11-11-003-t019-v15-pending-busy-readme.md` | 7400 | `2499d0a32eaf2ee4f7ba64a6ad6562713b783502752bc9e9603d83f7d178661a` |
| `v15/2026-11-12-001-c11-query-writer.mjs` | 7501 | `7c7cdc170a8fa6d2b8abd2f6c56a46381eec131748a729acb2f3919e7562da68` |
| `v15/2026-11-12-002-c11-query-data.js` | 9231 | `d05a12fd1d65fe74be4b79dc71afeaaaf09f770198ad95e1764f382fe0db0ab1` |
| `carrier/app/ui/primitives.tsx` | 4048 | `9086b8c803506bf3697d6a305fde0b64e20351a6d31d573f5a0f19120a7971d9` |
| `carrier/app/ui/primitives.css` | 17581 | `2f3bfc6c314170d246b519e28c3cadd07e8df3f2df1e2b3091e92d970cc6f0ea` |
| `carrier/app/ui/tokens-base.css` | 3696 | `b84e6173eeb154cabb692e72bbc7e2a6f8cb889d37b84c17ae49e1a2b3710fda` |
| `carrier/app/ui/ui-contract.ts` | 621 | `b46f8f2444ad646220edbf6c2bcdf1dd0ddb664506324da80d93bfa6affcf1bc` |
| `v11/2026-11-10-001-t019-wf-native-next-v11-styles.css` | 13443 | `80e5a56a60539cb0af7f74a742410b1231c2464f55f4f72357426d0fe9bcd4de` |
| `v12/2026-11-11-009-t019-v12-local-demo-styles.css` | 459 | `0d27ac5dd5fd63dc0e94579cac361fcedc516d569ff1a4a3f02bd9b2f20a97ed` |

## 九条旧账怎么处置？

四条按决定整条修掉，N3 只修了一半（异步态组件删除，值着色属性因仍有真实调用点
而保留），一条由用户接受，三条记未修并写明负责人与恢复条件。
下表每行的「改后原文」是入库文件里的真实内容，不是计划措辞。

| 编号 | 处置 | 改了什么（改后为准） | 判据或证据 |
| --- | --- | --- | --- |
| N1 页头文案残留 | 已修 | `v15/…-index.html` 修复前第 53 行（入库后在第 58 行）的 lede 原文是「选择合成样例，核对规则并练习确认；不会保存快照。」，改为「选择一条经验候选，核对来源与规则后确认；不会发送请求，也不会保存快照。」 | 浏览器实测读到改后文本（`quality/evidence/build-code/2026-11-13-159-p8-page-qa-record.md`） |
| N2 说明与字节不一致 | 已修 | `v15/…-readme.md` 的入口与脚本指纹改成修复后实测值，补上 v11 样式、v12 样式与数据文件的指纹，删去「入口通过相对路径使用 v14 合成样例 JS」的说法，改说入口实际加载同目录 `2026-11-12-002-c11-query-data.js` | 本节两张表的哈希与 `delivery.sha256` 三处同值 |
| N3 未用组件与两套着色 | 部分修：异步态组件删除，值着色属性保留 | `carrier/app/ui/primitives.tsx` 删掉全树无使用点的异步态组件；`carrier/app/ui/ui-contract.ts` 删掉随之没有消费者的异步态类型与提示函数；两件文件头注释同步改写。值着色属性 `valueTone` **保留**，因为未入库的 `app/components/simulation-board-panels.tsx:21` 仍在使用它，删掉会让入库副本与真实调用方不一致，而本轮不能跑载体的 tsc/build 证明删除安全 | 用 `grep -nE` 检索：`AsyncStatePanel` 无命中，`valueTone` 命中即上述调用点与保留理由；两件文件字节见上表 |
| R1 代码块横向滚动 | 已修 | `v15/…-index.html` 内联样式加窄屏规则：`@media (max-width: 480px)` 下 `.code-surface` 用 `white-space: pre-wrap`、`.code-surface code` 用 `overflow-wrap: anywhere` 与 `word-break: break-word` | 390×844 实测两块代码 `scrollWidth=clientWidth=364`；去掉该规则的反例 `417/453` 对 `364` |
| R3 等待态入口停住 | 已修 | `v15/…-app.js` 的 URL 状态入口在 `pending` 分支补上 `setTimeout(…, 150)`，与点击路径同一个 150ms 计时 | `?state=pending` 早读 `pending`、1.2 秒后 `success`；去掉定时器的反例 1.3 秒后仍是 `pending` |
| R2 窄屏页面太长 | 用户已接受，不改 | 窄屏首屏到确认区仍隔着整列候选；说明写在这里，不动排版 | 答复出处：`specs/workflowhub-ui-frontend-stage-integration-20261113/decision-log.md` 第 612 行「R2 窄屏页面太长，接受并写进说明」，同文件第 919 行把 R2 接受列为已确认 |
| G8 六段下游回执缺 | 未修 | 负责人是 C09 的 P4 原写者；恢复条件是下游消费者真实读取六段并留下回执 | 本段无代码改动 |
| N4 审查派发被挡 | 未修 | 负责人是审查基础设施维护者；恢复条件是派发通道可用并留下原回执 | 本段无代码改动 |
| N5 物理读屏没做 | 未修 | 负责人是项目所有者或其指定的可访问性测试者；恢复条件是完成一次真人读屏并留记录 | 本段只做到浏览器可见面，不含读屏 |

## 四处仓外绝对路径怎么改的？

随原字节进来的四处绝对路径都改成了不带仓外绝对路径的写法，
否则交付件里会出现本机目录。四处改动都不影响页面行为。
审查补查出的第四处是 v15 说明里的作者树名，写作时漏了。

| 位置 | 改前 | 改后 |
| --- | --- | --- |
| `v15/…-readme.md` 第 3 行（任务根） | 任务根写成 `/Users/Hugh/…/tasks/workflowhub-ui-frontend-c09-dual-path-verification-20261103/` | 改写成「任务库中的 `workflowhub-ui-frontend-c09-dual-path-verification-20261103/`（外部任务记录，不在本仓）」 |
| `v15/2026-11-12-002-c11-query-data.js` 第 4 行 | `"graph_path":"/Users/Hugh/Hugh/Project/workflowhub/graphify-out/graph.json"` | `"graph_path":"graphify-out/graph.json"`，文件头加一行说明；JSON 仍可解析，8 条候选不变 |
| `v15/…-readme.md` 第 3 行（作者名） | 作者写成绝对路径形式 `/root/c09_graph_options` | 改成 `c09_graph_options`（原 v11 作者的代理树名） |
| `carrier/app/ui/tokens-base.css` 第 2 行 | 「色板/字体以 /Users/Hugh/Downloads/UI设计稿 为基准」 | 「色板/字体以外部设计稿（未入库，只作色值与字体族参照）为基准」 |

另有一处按原样保留：`carrier/app/ui/primitives.css` 里的 `.pb-ui-async-state` 规则没有删。
理由是删组件已让 `grep` 无命中，而这件样式与上游逐字节相同是它的派生证据；
删规则会破坏这层关系，收益只是少几行未引用样式。

## 谁维护、什么时候更新？

维护者是本仓维护者；读者是后续演练者与对账者，只读使用。
入库分两步：先原样镜像（字节与来源逐件相同），再在入库副本上修旧账，
所以镜像时的来源指纹与现在的交付指纹是两条账，各自可核、互不混用。
这两步做完后字节视为 C11 收口快照：再要改页面或组件，另起版本目录并重发交付清单，
因为就地改会让交付指纹与已经发出的记录对不上。
仓外四处源目录不是 git 仓、也不再更新，它们是历史出处，不是可写工作区。

演练者复制 `v15/` 到自己的演练副本，演练结束后用 `delivery.sha256` 核入库字节没变。

## 怎么自己核一遍？

在工作区根跑下面两条；第一条退出 0 且每行 OK 才算「搬来没变」与「修后可核」。

```bash
cd docs/examples/c11-ui && shasum -a 256 -c delivery.sha256
python3 -m http.server --directory docs/examples/c11-ui 8768
```

再打开 `http://127.0.0.1:8768/v15/2026-11-11-002-t019-v15-pending-busy-index.html`，
视口 1440×900；页头、候选列表与确认区都要有样式，控制台不应有脚本或样式加载错误。
