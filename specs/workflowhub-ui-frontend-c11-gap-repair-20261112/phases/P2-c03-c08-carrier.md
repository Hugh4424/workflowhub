# Phase P2 — 载体两页真实使用设计系统与变更同步

本文件写给 P5 的差异审查者与整任务收口的读者；读完要能说出四类对象各自的源与使用点、两层检查怎么跑、两类变更怎么对照、坏了回哪修。

## 这一 Phase 交出什么？

交付载体 `app/ui/` 的 PB 最小件、两页真实 import 与使用点、四类对象的资产层与页面层检查，以及两类变更（设计侧 token、接口侧类型）的前后哈希与使用点读新值观察。

- **本 Phase 结果**：`/Users/Hugh/Hugh/Project/c09-carrier-new-20261103/app/ui/` 新增从 PB 源复制的最小件（`primitives.tsx`、`ui-contract.ts` 的最小类型、`primitives.css`、`tokens-base.css`）；`app/components/simulation-board-panels.tsx` 与 `app/components/sim-workbench-panels.tsx` 真实 import 并渲染 `pb-ui-*` 组件；`app/globals.css` 的 `--inline-action-gap` 由 8px 改为 12px 且被 `.inlineactions` 读到；`app/data/view-model.ts` 的 `SourceProps` 新增 `sourceLabel`，两 route 传入、两 panel 渲染成 `[data-source-label]`；026 三命令复跑并留原件。
- **非目标**：不改 PB 原仓 `PaperBuilder/frontend/src/ui/`；不动 v15 副本；不重做 C03/C08 全量验收；不写业务流程或后端；不打包发布；不新增服务端接口。
- **改动前**：两页只有原生 class（`badge`、`metrics`、`card` 等），载体无 `app/ui/` 目录，没有任何 PB 组件或布局的使用点与两层检查；`--inline-action-gap` 为 8px；`SourceProps` 只有 `source` 一个字段。
- **改动后**：两页服务器返回的 HTML 里读到 `pb-ui-status-badge`、`pb-ui-metric`、`pb-ui-action`（board）与 `pb-ui-lineage`（workbench），页面容器带 `data-layout`；`.inlineactions` 的计算 gap 为 12px，`[data-source-label]` 文本为 `冻结示例`；移除一处 `import` 后构建必须失败。
- **与相邻 Phase 的边界**：P1 只动 v15；本 Phase 只动载体；P5 读本 Phase 的开工前基线副本与最终字节判完整前后；P6 逐条核对原件。本 Phase 内两张卡串行、同一写主，因为它们改同一组文件。
- **主要风险**：把「复制了目录」或「有一份映射文件」当使用点；把构建退出 0 当页面真的渲染。本 Phase 用页面 HTML 的 DOM 标记与「移除 import 后必须失败」两层判。
- **下一步**：P5 用 `quality/evidence/c11-baseline/carrier/` 与最终字节出完整差异；P6 按本 Phase 原件登记关闭或未修。
- **动手前必读**：`quality/evidence/2026-11-12-011-c11-gap-ledger-v4.md` 的 G2 与 G7；`spec.md` 的验收 2、验收 7、方案 2、未决 1 与「判定对象怎么与需求对齐」；载体两页与两面板；PB `specs/design/components.md:32`、`specs/design/layouts.md:41`、`frontend/src/ui/primitives.tsx:1-140`、`primitives.css:1`、`tokens-base.css:1`、`ui-contract.ts:4`；`quality/evidence/2026-11-12-026-c09-p07-fu-adoption.md`。
- **给 P5/P6 的供件**：T001 收口发布 `quality/evidence/c11-final-carrier.sha256`（改动与新增文件的相对路径与哈希），与开工清单 `c11-baseline/carrier.sha256` 成对；P5 用两份清单比三类差异，P3/P4 无关。
- **未决事实（覆盖限制）**：`unavailable` — 载体 `next.config.ts` 把 `/api/pb/*` 重写到 `127.0.0.1:18844`，该端口当前无监听，页面层检查只能证 frozen 离线源（`app/data/shared-data.ts`）；本限制只影响「真实数据」范围，不影响组件使用点与构建判据，不写成通过条件。

## 这一 Phase 怎么验收？

假设本 Phase 全部实现、构建与页面也全部通过，live 数据仍不可用，那部分只记覆盖限制，不进判据。
本 Phase 承接验收 2 与验收 7，按「一条验收一小段」写。

**验收 2：四类对象的页面使用点与两层检查（AC-C11-002）**

目标：让独立测试者指着两页的真实渲染说出每类 PB 对象用在哪、凭什么算用了，并亲手拿掉一处后看到构建失败；判据见 Appendix A 的 AC-C11-002。

怎么操作：在载体跑构建并记退出码；起开发服务，用 curl 取两页服务器返回的 HTML，读 `pb-ui-*` 与 `data-layout` 标记；再用 agent-browser 打开两页各截图一次留作页面观察；随后临时删掉 `app/components/simulation-board-panels.tsx` 的 primitives import，重跑构建，必须失败；再删掉 one 页面容器的 `data-layout` 属性重跑页面层检查，必须以「布局使用点缺失」非零（组件与布局各演示一处）；验后从临时副本还原；四类对象逐行填源、使用点、资产层检查、页面层检查。

什么条件：载体自带 `node_modules`（Next 16.4.3 / React 19.3.1），不需要联网装依赖；数据用 frozen 离线源；不需要 live API；开发服务用 3100 端口，避免与 3000 上的其它会话相撞；构建产物 `.next/` 不在基线内，P5 只比源文件。

怎样算通过：构建退出 0；两页 HTML 都读到三类以上对象的 DOM 标记（board：`pb-ui-status-badge`、`pb-ui-metric`、`pb-ui-action`；workbench：`pb-ui-status-badge`、`pb-ui-metric`、`pb-ui-lineage`），且两页容器带 `data-layout`；四类对象四行齐全，每行都有源路径与两层检查记录；移除一次 import 后构建必须非零；删掉 `data-layout` 后页面层检查必须非零。

故意弄坏一处（必须变红）：把 `app/components/simulation-board-panels.tsx` 里 `from '../ui/primitives'` 的 import 行删掉后跑构建，必须非零并在输出里指向未定义标识符；还原后构建必须重新退出 0。

真跑还是替代：真跑。构建与开发服务都跑载体真实字节与真实依赖；页面层读的是服务器渲染出的真实 HTML 与真实浏览器截图，不用目录清单、映射文件或截图替代 DOM；本卡尚未执行，不宣称 RED 或 GREEN。

谁判与证据：未参与实现的独立测试者在 P2/T001 实现完成后判定；读构建原输出、两页 DOM 读回与截图、四类对象四行、移除 import 的失败原输出与还原后的构建输出；结论记本卡「完成」与 `quality/evidence/c11-p2-*`。

失败回修与停止：信号是构建非零、页面 HTML 缺某类标记、四行缺行或缺两层检查、移除 import 后仍构建通过。构建因联网取字体等环境原因失败时先排除环境（把环境失败与目标失败分开记录，不得当通过）；组件未进页面的问题回 P2/T001 实施者改面板与 `app/ui/`；PB 源只读，不改原仓。修后重跑构建与两页 DOM 读回，并重做移除 import 的负例；结论按新原件更新，由原判定者重报。同一原因两次失败停手报主会话，保留原失败原件；`.next/` 是构建产物，不进证据。

**验收 7：变更同步的前后对照（AC-C11-007）**

目标：让独立测试者拿前后哈希与页面读数说出两类变更是真的到了使用点还是只改了文件，并亲手让页面读旧值看到判失败；判据见 Appendix A 的 AC-C11-007。

怎么操作：改前把六个将改文件复制到 `quality/evidence/c11-baseline/carrier/`（P2 起点，供 P5）并在 T002 开工前另存 `t002-before/`（T001 末态，供本卡前后对照），各出 `SHA256SUMS.txt`；改后重算六文件哈希写 `c11-p2-sync-hashes.txt`；跑 `/tmp/c09-p07-consumption-probe.mjs` 与 `./node_modules/.bin/tsc --noEmit`；起开发服务用 agent-browser 读 `.inlineactions` 的计算 gap 与 `[data-source-label]` 的文本；再把 token 改回 8px、把 `sourceLabel` 字段删掉，各判一次失败，验后还原。

什么条件：载体与 `node_modules` 就位；`/tmp/c09-p07-consumption-probe.mjs` 存在（4347 B）；frozen 数据源；开发服务 3100 端口；任何一条 026 命令的输入已不在原处时记 `unavailable` 与原因，不用别名替代。

怎样算通过：两类变更的改前副本与哈希、改后哈希都在场；`.inlineactions` 的计算 gap 为 12px 且 `[data-source-label]` 为 `冻结示例`（使用点真的读到新值）；token 回 8px 时观察为 8px、删掉 `sourceLabel` 后 `tsc --noEmit` 非零且页面标记缺失，两个负例都判失败；026 三命令都退出 0 并留原输出。

故意弄坏一处（必须变红）：把 `app/globals.css` 的 `--inline-action-gap` 改回 8px，同一观察必须读到 8px 并判失败；把 `app/data/view-model.ts` 的 `sourceLabel` 字段删掉而面板仍读它，`tsc --noEmit` 必须非零、页面 `[data-source-label]` 必须取不到。

真跑还是替代：真跑。哈希对真实字节取，观察来自真实浏览器会话对真实开发服务的计算样式与 DOM，不用源码文本朗读替代；本卡尚未执行，不宣称 RED 或 GREEN。

谁判与证据：未参与实现的独立测试者在 P2/T002 完成且两次负例跑完后判定；读前后哈希、026 三命令原输出、页面观察与两个负例的原输出；结论记本卡「完成」与 `quality/evidence/c11-p2-sync-*`。

失败回修与停止：信号是前后哈希缺失、观察值仍是旧值、负例反而通过、026 任一命令失败或输入缺失。哈希与副本缺失回 P2/T002 实施者补基线后重做；页面读到旧值回同一实施者查样式与类型的真实消费点（含构建缓存）；026 输入不在原处记 `unavailable` 与恢复条件，不换成别的文件。修后重跑两类观察与两个负例，结论按新原件更新，由原判定者重报。同一原因两次失败停手报主会话，保留原失败原件。

## 为什么现在做，依据是什么？

原来只在文档层说「保留原生实现」，页面里没有 PB 组件与布局的真实使用点，也没有前后对照；载体是唯一能真正渲染 React 组件的地方，所以在这里补。

- **结果**：两页有真实使用点与两层检查，两类变更有前后哈希与读新值观察。
- **非目标**：不改 PB 原仓，不重做 C03/C08 全量验收，不新增业务逻辑。
- **与其它 Phase 的区别**：本 Phase 判载体使用点与同步；v15 的数据链归 P1，v15 的整页观察归 P3、P4。
- **依据**：缺口台账 G2（028:76-77）与 G7（028:93-94、026:72）；`spec.md` 的「方案 2」「需求 7」；decision-log 的包 2 与包 7，以及「载体只有两页、C03 与 C08 落在同一组文件，按共享文件唯一写主串行执行」。

## 开始前读什么？

| 材料或锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `quality/evidence/2026-11-12-011-c11-gap-ledger-v4.md` 的 G2、G7 | 取四类对象映射、关闭判据与反例 | 开工前 |
| `spec.md` 的验收 2、验收 7、方案 2、未决 1 | 取判据引用、失败分支与 live 不可用的记录方式 | 开工前 |
| 载体 `app/simulation-board/page.tsx`、`app/sim-workbench/page.tsx` | 读两 route 的容器与传参，确定布局对象的使用点 | 改前 |
| 载体 `app/components/*-panels.tsx` | 读面板容器与现有 `badge`/`metrics`/`card` 结构 | 改前 |
| 载体 `app/globals.css:5`、`app/data/view-model.ts:4` | 读 `--inline-action-gap` 与 `SourceProps` 的当前字节 | 改前 |
| PB `specs/design/components.md:32`、`specs/design/layouts.md:41` | 取设计组件与设计布局的资产层依据 | 写卡前 |
| PB `frontend/src/ui/primitives.tsx`、`primitives.css`、`tokens-base.css`、`ui-contract.ts:4`、`style-token-baseline.json` | 取复制来源、类名、token 与类型；只读 | 复制前 |
| `quality/evidence/2026-11-12-026-c09-p07-fu-adoption.md` | 取 026 三命令的原始读数与已知偏差（探针字段误判） | 复跑前 |
| 载体 `next.config.ts` 与 `app/data/shared-data.ts` | 记录 live 重写目标 `127.0.0.1:18844` 无监听、页面只走 frozen | 开工前 |

`127.0.0.1:18844` 当前无监听是本 Phase 的现场事实：页面层检查只证 frozen 源，`source=live` 分支不在本 Phase 判据内，也不作为通过条件。

## 每个文件由谁改，先做什么？

- **开工前基线（P2 起点，供 P5）**：把本次要改的六个文件 `app/globals.css`、`app/data/view-model.ts`、`app/simulation-board/page.tsx`、`app/sim-workbench/page.tsx`、`app/components/simulation-board-panels.tsx`、`app/components/sim-workbench-panels.tsx` 复制到 `quality/evidence/c11-baseline/carrier/` 并出 `SHA256SUMS.txt`（每个复制件一行）。只复制这六个文件，禁止整目录快照；缺基线则 P5 无法判「完整前后」。
- **新增**：`app/ui/primitives.tsx`、`app/ui/ui-contract.ts`、`app/ui/primitives.css`、`app/ui/tokens-base.css`（从 PB 源复制的最小件；`primitives.tsx` 只保留需要的五个 export 与 `classes` 辅助，去掉 dialog/drawer 与 `modal-focus` 依赖；`ui-contract.ts` 只保留 `LineageIdentity`、`UiAsyncState`、`UiNonReadyState`、`uiStateMessage`，去掉 `backtest-workbench` 与 `strategy-api` 的 type-only 依赖；复制差异逐条记入 `c11-p2-assets.patch`）。
- **修改（T001）**：`app/components/simulation-board-panels.tsx`、`app/components/sim-workbench-panels.tsx`（import 与 `pb-ui-*` 渲染、`data-layout`）。
- **修改（T002）**：`app/globals.css`、`app/data/view-model.ts`、`app/simulation-board/page.tsx`、`app/sim-workbench/page.tsx`，并在两个面板里增加 `[data-source-label]`。
- **禁止改动**：PB 原仓 `PaperBuilder/frontend/src/ui/` 与 `specs/design/`；v15 副本；只读基线 `/Users/Hugh/Hugh/Project/c11-carrier-baseline-20261112`；任务库既有证据与 026 报告；`next.config.ts`、`package.json`、`tsconfig.json`。

本 Phase 唯一写主；T001 与 T002 串行且有真实先后依赖（同一组面板文件，T002 的改前状态就是 T001 的末态），不设并行组。T002 改前只读副本另存 `quality/evidence/c11-baseline/carrier/t002-before/`，与 P2 起点副本分开，两处事实不同，不得互相顶替。

## 怎么验证？

构建退出 0 只证明能编译；对象是否真进页面由 DOM 标记判，同步是否到使用点由计算样式与 DOM 文本判，两层都不接受「文件已复制」。

开工前先跑一次 `agent-browser --session c11-p2 eval "JSON.stringify({probe:1})"` 的格式探针，确认 stdout 能被上面的规范化脚本取出 JSON，探针原文存 `c11-p2-eval-probe.out`；探针失败不进入正式同步观察。

开工前四要素：验证层是构建级加浏览器级（T001）、命令级加浏览器级（T002）；命令是下方两条门禁命令；预期是 T001 构建退出 0 且两页标记齐全、T002 三命令退出 0 且观察值等于新值；失败条件是构建非零、缺标记、四行缺行、观察仍是旧值或负例反而通过。

成本：T001 executor=独立测试者；estimate_min=90；hard_cap_min=180；retry_cap=1；evidence_tier=命令级。T002 executor=独立测试者；estimate_min=60；hard_cap_min=120；retry_cap=1；evidence_tier=命令级。

| 目标 | Task | 角色 | gate_cmd 与预期退出码 | 判据与证据路径 |
| --- | --- | --- | --- | --- |
| 四类对象进页面、移除 import 必失败 | T001 | RED | 删掉 board 面板的 `../ui/primitives` import 后 `./node_modules/.bin/next build` 必须非零，输出指向未定义标识符 | ORACLE-C11-CARRIER 与 `quality/evidence/c11-p2-remove-check.output` |
| 四类对象进页面、移除 import 必失败 | T001 | GREEN | 门禁命令退出 0，两页 HTML 各读到三类以上 `pb-ui-*` 与 `data-layout` | ORACLE-C11-CARRIER 与 `quality/evidence/c11-p2-build.output`、`c11-p2-dom-board.json`、`c11-p2-dom-workbench.json` |
| 两类变更到使用点、旧值必失败 | T002 | RED | token 回 8px 时观察为 8px；删 `sourceLabel` 后 `tsc --noEmit` 非零 | ORACLE-C11-SYNC 与 `quality/evidence/c11-baseline/carrier/t002-before/SHA256SUMS.txt`、`c11-p2-sync-old-value.output` |
| 两类变更到使用点、旧值必失败 | T002 | GREEN | 门禁命令退出 0，gap 为 12px、`[data-source-label]` 为 `冻结示例`，026 三命令均 0 | ORACLE-C11-SYNC 与 `quality/evidence/c11-p2-sync-hashes.txt`、`c11-p2-sync-probe.json`、`c11-p2-sync-observed.json` |

覆盖上限：只证 frozen 离线源下两页的真实渲染与使用点，以及两类变更到使用点的同步。
显式不覆盖：不证 live 数据分支（`127.0.0.1:18844` 无监听）；不证 PB 原仓的组件质量；不证四类对象在其它页面或其它 variant 下的表现；不证 v15 与打包发布；`tokens-base.css` 的 `/fonts/*.woff2` 在载体没有对应目录会 404，字体替换只记覆盖限制，不伪造字体。

失败了怎么办：构建失败先分环境失败（联网取字体、磁盘、端口）与目标失败（未定义标识符、类型错），两类分开记录，环境失败不得当通过；组件未进页面回 P2/T001 实施者；同步问题回 P2/T002 实施者；026 输入缺失记 `unavailable` 与恢复条件。修后重跑构建、两页 DOM 读回与两个负例，结论按新原件更新，由原判定者重报。

## 下一消费者拿什么继续？

P5 用 `quality/evidence/c11-baseline/carrier/` 与最终字节出完整差异（含新增 `app/ui/` 与 `t002-before/` 之外的所有改动），P6 按原件登记关闭或未修。

- 交回：`app/ui/` 四个复制件与 `c11-p2-assets.patch`；两页 DOM 读回 JSON 与截图；构建原输出与移除 import 的失败原输出；两类变更的前后哈希、基线副本、026 三命令原输出与页面观察。
- 未完成项：本 Phase 尚未执行，RED 与 GREEN 原件都记 `incomplete`；live 数据分支记 `unavailable`，恢复条件是该端口有真实服务监听。

## 每张任务卡怎么写？

### 任务 1：四类对象进载体两页并留两层检查（C03）

为什么做：两页只有原生 class，没有 PB 组件与布局的使用点，对应 R-002、FR-C11-002 与 AC-C11-002；台账 G2 判它缺证。
交付什么：`app/ui/` 的四个最小复制件、两面板的真实 import 与 `pb-ui-*` 渲染、两页容器 `data-layout`，以及四类对象四行（源、使用点、资产层检查、页面层检查）。
不做什么：不改 PB 原仓；不改 `next.config.ts`、`package.json`、`tsconfig.json`；不动 v15；不写业务逻辑；不用目录清单、映射文件或截图冒使用点。
前置：先留 P2 起点六个文件的只读副本与 `SHA256SUMS.txt`；读 PB 两个设计文档与四个前端件；无更早 Phase 依赖，可与 P1 并行。
怎么做：先复制最小件并记 diff，再在两面板 import 并替换对应渲染点，再给两页容器加 `data-layout`，最后跑构建与两页 DOM 读回、再做一次移除 import 的负例并还原。
怎么验收：跑本卡 GREEN 门禁命令（构建退出 0 且两页标记齐全），再做 RED 负例（移除 import 后构建必须非零）；四行逐行核对；判定器见 `ORACLE-C11-CARRIER`。
证据：`quality/evidence/c11-p2-build.output`、`c11-p2-dom-board.json`、`c11-p2-dom-workbench.json`、`c11-p2-remove-check.output`、`c11-p2-assets.patch`、两张页面截图；本条尚未执行，原件记 `incomplete`。
下游（含何时停）：T002 在 T001 末态上做两类变更；P5 读最终字节与起点基线。构建因环境原因失败先停手分诊，标记缺失或四行缺行同样停手回本卡实施者，不得用截图或目录清单补位。

| 对象类 | 源 | 载体使用点 | 资产层检查 | 页面层检查 |
| --- | --- | --- | --- | --- |
| 设计组件 | `PaperBuilder/specs/design/components.md:32` 的共享 primitives（AsyncStatePanel、Metric、UiStatusBadge、UiAction、UiLineage） | `app/ui/primitives.tsx` 的 Metric、UiStatusBadge、UiAction、UiLineage 在 `app/components/simulation-board-panels.tsx` 与 `app/components/sim-workbench-panels.tsx` 真实 import 并渲染 | `shasum -a 256 app/ui/primitives.tsx` 与 PB 源同名文件对照，差异仅为去掉 dialog/drawer 与 `modal-focus`、`backtest-workbench`、`strategy-api` 依赖，逐条记入 `c11-p2-assets.patch` | 两页 HTML 出现 `pb-ui-status-badge`、`pb-ui-metric`、`pb-ui-action`、`pb-ui-lineage` |
| 设计布局 | `PaperBuilder/specs/design/layouts.md:41` 的区域与信息层级（页头、列表、详情、工作台主区/右栏/dock） | board 的 `.c09-page` 根、`.topbar` 页头、`.board` 列表与 `.card` 卡片；workbench 的 `.wbheader` 页头、`.wbleft` 主区、`.sidebar` 右栏 | 把两面板的容器类与 layouts.md 的区域清单逐条对照成表，缺 dock 这类未实现区域如实记缺口，不补造 | 两页 HTML 出现 `data-layout="board"` / `data-layout="workbench"`，workbench 的 `wbleft` 与 `sidebar` 同时在 DOM；board 的分组列表与归档区在 DOM |
| 前端组件 | `PaperBuilder/frontend/src/ui/primitives.tsx` 的同名 export 与 `primitives.css`、`tokens-base.css` | 同上两面板的 import 与 JSX 使用；样式由 `app/ui/primitives.css` 与 `app/ui/tokens-base.css` 提供 | 复制件与源文件各取 `shasum -a 256` 并记差异；`primitives.css` 与 `tokens-base.css` 整份复制，`@font-face` 的 `/fonts/*.woff2` 在载体不存在记 404 覆盖限制 | 同「设计组件」的四个 `pb-ui-*` 标记，且这些标记来自 `app/ui/` 的类而不是载体原生 class |
| 前端布局 | 载体自身的 `app/simulation-board/page.tsx`、`app/sim-workbench/page.tsx` 与 `app/components/*-panels.tsx` 的页面容器与面板组合 | 两 route 的容器结构与面板组合：board 的页头、工具条、分组列表、归档；workbench 的页头、图表区、订单面板、右栏 | 读两 route 与两面板的容器层级，与 layouts.md 的区域清单逐条对齐并记录缺口 | 页面 HTML 的容器层级可读：board 根 → 页头 → 工具条 → 分组列表 → 归档；workbench 根 → 页头 → 主区 + 右栏 |

**校验器用，人可跳过**

- **任务编号**：T001
- **Source / FR / AC**：R-002 / FR-C11-002 / AC-C11-002；两页真实使用 PB 组件与布局，四类对象各有源、使用点与两层检查，移除使用点必须失败。
- **Inputs**：无更早 Phase；载体当前字节、自带 `node_modules`、PB 源只读复制件；live 数据不可用不影响本卡，`source=live` 分支不在判据内。
- **Files / symbols**：新增 `app/ui/primitives.tsx`、`app/ui/ui-contract.ts`、`app/ui/primitives.css`、`app/ui/tokens-base.css`；修改 `app/components/simulation-board-panels.tsx`、`app/components/sim-workbench-panels.tsx`；symbols：`Metric`、`UiStatusBadge`、`UiAction`、`UiLineage`、`data-layout`、`pb-ui-*`。
- **Action**：先留 P2 起点六文件副本与哈希清单，再从 PB 源复制最小件到 `app/ui/`（去掉 dialog/drawer 与外部 type-only 依赖，差异记 patch），在两面板真实 import 并替换对应渲染点，给两页容器加 `data-layout`，跑构建与两页 DOM 读回；移除改动仅退回本 hunk。
- **Outputs / failure**：GREEN 时构建退出 0、两页各读到三类以上对象标记、四行齐全；构建非零、标记缺失、只有目录或映射文件、移除 import 仍构建通过均明确失败，不造成功。
- **Boundary / DO NOT TOUCH**：PB 原仓 `PaperBuilder/frontend/src/ui/` 与 `specs/design/`；v15 副本；只读基线 `c11-carrier-baseline-20261112`；`next.config.ts`、`package.json`、`tsconfig.json`；任务库既有证据与 026 报告；不新增服务端接口或业务逻辑。
- **Dependency**：none（与 P1 可并行）；T002 依赖本卡末态，见任务 2。
- **Test tier / skill**：feature / frontend-testing；构建级加浏览器级，真实 Next 构建与真实页面 HTML，不涉及网络数据与数据库。
- **Scenario / fixture or service**：`./node_modules/.bin/next build` 与 `./node_modules/.bin/next dev --hostname 127.0.0.1 --port 3100`；两页 `/simulation-board`、`/sim-workbench`；数据用 `app/data/shared-data.ts` 的 frozen 源；负例在临时副本上删 import 后还原，不动其它文件。
- **RED/GREEN gate_cmd**：`cd /Users/Hugh/Hugh/Project/c09-carrier-new-20261103 && ./node_modules/.bin/next build > "$TR/quality/evidence/c11-p2-build.output" 2>&1; st=$?; if [ "$st" -eq 0 ]; then { ./node_modules/.bin/next dev --hostname 127.0.0.1 --port 3100 > /tmp/c11-p2-dev.log 2>&1 & echo $! > /tmp/c11-p2-dev.pid; }; for n in $(seq 1 15); do curl -sf http://127.0.0.1:3100/simulation-board -o /tmp/c11-p2-board.html && break; sleep 2; done; curl -sf http://127.0.0.1:3100/sim-workbench -o /tmp/c11-p2-workbench.html || st=4; grep -q 'pb-ui-status-badge' /tmp/c11-p2-board.html && grep -q 'pb-ui-metric' /tmp/c11-p2-board.html && grep -q 'pb-ui-action' /tmp/c11-p2-board.html && grep -q 'data-layout="board"' /tmp/c11-p2-board.html && grep -q 'pb-ui-status-badge' /tmp/c11-p2-workbench.html && grep -q 'pb-ui-metric' /tmp/c11-p2-workbench.html && grep -q 'pb-ui-lineage' /tmp/c11-p2-workbench.html && grep -q 'data-layout="workbench"' /tmp/c11-p2-workbench.html && grep -q 'wbleft' /tmp/c11-p2-workbench.html && grep -q 'sidebar' /tmp/c11-p2-workbench.html || st=5; fi; kill "$(cat /tmp/c11-p2-dev.pid)" 2>/dev/null; echo "GATE_EXIT=$st"; exit $st`
- **expected_exit**：GREEN 0；构建失败为非零（`st` 保留构建码），页面取回失败为 4，标记缺失为 5；RED 负例的 `next build` 必须非零并在输出里指向未定义标识符；环境原因失败另记，不算目标失败也不当通过。
- **RED target failure**：`ORACLE-C11-CARRIER` 断言两页存在 PB 对象使用点；改动前 `app/ui/` 不存在、两页只有原生 class，门禁在页面标记断言处失败；负例是删掉 `app/components/simulation-board-panels.tsx` 的 `from '../ui/primitives'` import 后 `./node_modules/.bin/next build` 必须非零；若原字节已含等价使用点，如实记本来通过，不制造生产回退。
- **GREEN oracle**：`ORACLE-C11-CARRIER` 判构建退出 0、两页 HTML 各读到三类以上 `pb-ui-*` 标记与 `data-layout`、workbench 的 `wbleft` 与 `sidebar` 同时在 DOM、四行各有源与两层检查；同一断言拒绝只有复制目录、拒绝只有映射文件、拒绝移除 import 后仍通过；数据文件或构建输出缺失时非零结束，不算通过。
- **Evidence**：构建原输出、两页 DOM 读回 JSON、两张截图、移除 import 的失败原输出、`c11-p2-assets.patch`、P2 起点基线哈希清单，各留单份原件；本条尚未执行，原件记 `incomplete`。
- **STOP / recovery**：构建环境失败先分诊并把两类失败分开记；标记缺失或四行缺行回 P2/T001 实施者；PB 源只读；保原失败，禁止用截图或目录清单补位，禁止改判定器求绿。
- **Coverage limit**：只证 frozen 源下两页的真实渲染与四类对象使用点；不证 live 分支、不证 PB 原仓组件质量、不证其它页面与 variant、不证 v15 与打包发布；`tokens-base.css` 的字体 404 只见覆盖限制。
- **Done**：前置（不作完成条件）：P2 起点六文件副本与哈希清单在场，构建与开发服务能跑，`next build` 原输出留档。完成条件（只写效果）：AC-C11-002 的两页真实渲染出 PB 组件与布局的使用点、四类对象四行齐全、移除一处 import 后构建非零；证据为 `c11-p2-build.output`、`c11-p2-dom-*.json`、`c11-p2-remove-check.output`；live 分支与未执行项具名保留，不预填通过。

### 任务 2：两类变更的前后对照与 026 三命令复跑（C08）

为什么做：既有材料只有保留/不引入的取舍，没有采用前后对照，对应 R-007、FR-C11-007 与 AC-C11-007；台账 G7 与 026:72 判它缺证。
交付什么：设计侧 token 与接口侧类型两类变更，各有改前只读副本与哈希、改后哈希；`.inlineactions` 读到 12px、`[data-source-label]` 读到 `冻结示例`；旧值与缓存值负例判失败；026 三命令复跑原输出。
不做什么：不改 PB 原仓；不动 v15；不改 `next.config.ts`、`package.json`、`tsconfig.json`；不为通过而放宽观察值；不把同任务重放当后续采用。
前置：T001 已完成并交回末态；T002 改前副本与哈希另存 `quality/evidence/c11-baseline/carrier/t002-before/`；`/tmp/c09-p07-consumption-probe.mjs` 存在。
怎么做：先抄 T001 末态六个文件与哈希，再改 `app/globals.css` 的 `--inline-action-gap` 为 12px、`app/data/view-model.ts` 的 `SourceProps` 加 `sourceLabel`，两 route 传值、两面板渲染 `[data-source-label]`；然后重算哈希、跑 026 三命令、用浏览器读计算 gap 与标记文本；最后做两个负例并还原。
怎么验收：跑本卡 GREEN 门禁命令（哈希、探针、`tsc`、页面观察），再做两个 RED 负例（token 回 8px、删 `sourceLabel`），判定器见 `ORACLE-C11-SYNC`。
证据：`quality/evidence/c11-p2-sync-hashes.txt`、`c11-p2-sync-probe.json`、`c11-p2-sync-observed.json`、`c11-baseline/carrier/t002-before/SHA256SUMS.txt`、`c11-p2-sync-old-value.output`、`c11-p2-sync-type-removed.output`；本条尚未执行，原件记 `incomplete`。
下游（含何时停）：P5 用 P2 起点基线与最终哈希判完整前后；P6 登记关闭或未修。哈希缺失、观察仍是旧值或负例反而通过就停手回本卡实施者，026 输入不在原处记 `unavailable` 与恢复条件，不换别名。

**校验器用，人可跳过**

- **任务编号**：T002
- **Source / FR / AC**：R-007 / FR-C11-007 / AC-C11-007；两类变更各有前后哈希、使用点读到新值、旧值与缓存值判失败，026 三命令复跑。
- **Inputs**：T001 末态六文件；`/tmp/c09-p07-consumption-probe.mjs`（4347 B）；026 报告的前后对照表与已知偏差；live 数据不可用不影响本卡，观察只用 frozen 源。
- **Files / symbols**：`app/globals.css`（`--inline-action-gap` 8px→12px）、`app/data/view-model.ts`（`SourceProps` 加 `sourceLabel`）、`app/simulation-board/page.tsx`、`app/sim-workbench/page.tsx`、`app/components/simulation-board-panels.tsx`、`app/components/sim-workbench-panels.tsx`；symbols：`--inline-action-gap`、`.inlineactions`、`SourceProps`、`sourceLabel`、`[data-source-label]`。
- **Action**：先抄六文件到 `c11-baseline/carrier/t002-before/` 并出哈希，再改两类对象（token 值、`SourceProps` 字段与两 route 传值、两面板渲染标记），重算哈希、跑 026 三命令、用浏览器读计算样式与 DOM 文本；负例两次后还原；移除改动仅退回本 hunk。
- **Outputs / failure**：GREEN 时前后哈希齐、探针与 `tsc` 退出 0、gap 为 12px 且标记文本为 `冻结示例`、两个负例都失败；哈希缺失、观察为旧值、负例反而通过、026 输入缺失均明确记录，不造成功。
- **Boundary / DO NOT TOUCH**：PB 原仓；v15 副本；只读基线 `c11-carrier-baseline-20261112`；`next.config.ts`、`package.json`、`tsconfig.json`；任务库既有证据与 026 报告原文（只读复跑，不改报告）；不新增依赖或接口。
- **Dependency**：T001（同一组面板文件，T002 的改前状态是 T001 末态，串行避免并发覆盖）。
- **Test tier / skill**：feature / frontend-testing；命令级加浏览器级，真实 `shasum`、真实探针、真实 `tsc` 与真实浏览器计算样式。
- **Scenario / fixture or service**：`./node_modules/.bin/next dev --hostname 127.0.0.1 --port 3100`；`/sim-workbench?simulation_id=sim-001` 的 frozen 渲染；负例在临时副本上把 token 回 8px、把 `sourceLabel` 删掉后判失败，验后还原；026 三命令按报告原样复跑。
- **RED/GREEN gate_cmd**：`cd /Users/Hugh/Hugh/Project/c09-carrier-new-20261103 && TR=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112; shasum -a 256 app/globals.css app/data/view-model.ts app/simulation-board/page.tsx app/sim-workbench/page.tsx app/components/simulation-board-panels.tsx app/components/sim-workbench-panels.tsx > "$TR/quality/evidence/c11-p2-sync-hashes.txt"; st=$?; node /tmp/c09-p07-consumption-probe.mjs > "$TR/quality/evidence/c11-p2-sync-probe.json" || st=6; ./node_modules/.bin/tsc --noEmit || st=7; { ./node_modules/.bin/next dev --hostname 127.0.0.1 --port 3100 > /tmp/c11-p2-dev2.log 2>&1 & echo $! > /tmp/c11-p2-dev2.pid; }; for n in $(seq 1 15); do curl -sf http://127.0.0.1:3100/simulation-board -o /dev/null && break; sleep 2; done; agent-browser --session c11-p2 open "http://127.0.0.1:3100/sim-workbench?simulation_id=sim-001" > /dev/null; agent-browser --session c11-p2 eval "JSON.stringify({gap:getComputedStyle(document.querySelector('.inlineactions')).gap,label:document.querySelector('[data-source-label]').textContent})" > /tmp/c11-p2-eval.raw || st=8; node -e "const fs=require('node:fs');const m=String(fs.readFileSync('/tmp/c11-p2-eval.raw','utf8')).match(/\{[\s\S]*\}/);if(!m)process.exit(8);fs.writeFileSync(process.argv[1],m[0])" "$TR/quality/evidence/c11-p2-sync-observed.json" || st=8; node -e "const o=JSON.parse(require('node:fs').readFileSync(process.argv[1],'utf8'));if(o.gap!=='12px'||o.label!=='冻结示例'){console.error('RED: 使用点没有读到新值',o);process.exit(8);}console.log('GREEN: gap',o.gap,'label',o.label);" "$TR/quality/evidence/c11-p2-sync-observed.json" || st=9; kill "$(cat /tmp/c11-p2-dev2.pid)" 2>/dev/null; echo "SYNC_EXIT=$st"; exit $st`
- **expected_exit**：GREEN 0；哈希失败为非零，探针失败为 6，`tsc` 失败为 7，页面观察取回失败为 8，观察值仍是旧值为 9；两个负例各自必须非零（token 回 8px 时观察为 8px、删 `sourceLabel` 后 `tsc` 非零）；026 输入缺失记 `unavailable` 与原因。
- **RED target failure**：`ORACLE-C11-SYNC` 断言使用点读到新值；改动前 gap 为 8px、没有 `sourceLabel`，观察与 `tsc` 都在旧状态；负例一为 token 回 8px 后同一观察读到 8px，负例二为删掉 `sourceLabel` 后 `tsc --noEmit` 非零且页面标记取不到；若原字节已是新值，如实记本来通过，不制造生产回退。
- **GREEN oracle**：`ORACLE-C11-SYNC` 判两类变更前后哈希齐、026 三命令退出 0、`.inlineactions` 计算 gap 为 12px、`[data-source-label]` 为 `冻结示例`、两个负例都失败；同一断言拒绝「只给哈希不给观察」、拒绝旧值与缓存值、拒绝同任务重放冒后续采用；哈希或观察缺失时非零结束，不算通过。
- **Evidence**：前后哈希清单、`c11-baseline/carrier/t002-before/SHA256SUMS.txt`、探针 JSON、`tsc` 与 026 原输出、页面观察 JSON、两个负例原输出，各留单份原件；本条尚未执行，原件记 `incomplete`。
- **STOP / recovery**：哈希或副本缺失回本卡实施者补基线后重做；观察仍为旧值查样式与类型的真实消费点（含构建缓存）后重做；026 输入不在原处记 `unavailable` 与恢复条件，不用别名替代；保原失败，禁止改观察值求绿。
- **Coverage limit**：只证 frozen 源下两类变更到使用点的同步与前后哈希；不证 live 分支、不证后续任务采用（后继采用仍列未修）、不证设计侧全部 token、不证 v15 与打包发布。
- **Done**：前置（不作完成条件）：T001 末态可读，前后哈希清单与 026 三命令能跑并留原输出。完成条件（只写效果）：AC-C11-007 的两类变更有前后哈希、页面使用点观察到新值、旧值与缓存值负例判失败、026 三命令退出 0；证据为 `c11-p2-sync-hashes.txt`、`c11-p2-sync-observed.json`、`c11-baseline/carrier/t002-before/SHA256SUMS.txt`；live 分支与后继采用具名保留，不预填通过。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计（全局权威）`
- **写入集**：`/Users/Hugh/Hugh/Project/c09-carrier-new-20261103/app/ui/tokens-base.css`；`/Users/Hugh/Hugh/Project/c09-carrier-new-20261103/app/ui/primitives.css`；`/Users/Hugh/Hugh/Project/c09-carrier-new-20261103/app/ui/primitives.tsx`；`/Users/Hugh/Hugh/Project/c09-carrier-new-20261103/app/ui/ui-contract.ts`；`/Users/Hugh/Hugh/Project/c09-carrier-new-20261103/app/globals.css`；`/Users/Hugh/Hugh/Project/c09-carrier-new-20261103/app/data/view-model.ts`；`/Users/Hugh/Hugh/Project/c09-carrier-new-20261103/app/simulation-board/page.tsx`；`/Users/Hugh/Hugh/Project/c09-carrier-new-20261103/app/sim-workbench/page.tsx`；`/Users/Hugh/Hugh/Project/c09-carrier-new-20261103/app/components/simulation-board-panels.tsx`；`/Users/Hugh/Hugh/Project/c09-carrier-new-20261103/app/components/sim-workbench-panels.tsx`
- **依赖**：none（与 P1 可并行；本 Phase 内 T002 依赖 T001 末态，串行因同一组面板文件）
- **消费者**：P5
- **gate_cmd**：`cd /Users/Hugh/Hugh/Project/c09-carrier-new-20261103 && ./node_modules/.bin/next build > "$TR/quality/evidence/c11-p2-build.output" 2>&1; st=$?; if [ "$st" -eq 0 ]; then { ./node_modules/.bin/next dev --hostname 127.0.0.1 --port 3100 > /tmp/c11-p2-dev.log 2>&1 & echo $! > /tmp/c11-p2-dev.pid; }; for n in $(seq 1 15); do curl -sf http://127.0.0.1:3100/simulation-board -o /tmp/c11-p2-board.html && break; sleep 2; done; curl -sf http://127.0.0.1:3100/sim-workbench -o /tmp/c11-p2-workbench.html || st=4; grep -q 'pb-ui-status-badge' /tmp/c11-p2-board.html && grep -q 'pb-ui-metric' /tmp/c11-p2-board.html && grep -q 'pb-ui-action' /tmp/c11-p2-board.html && grep -q 'data-layout="board"' /tmp/c11-p2-board.html && grep -q 'pb-ui-status-badge' /tmp/c11-p2-workbench.html && grep -q 'pb-ui-metric' /tmp/c11-p2-workbench.html && grep -q 'pb-ui-lineage' /tmp/c11-p2-workbench.html && grep -q 'data-layout="workbench"' /tmp/c11-p2-workbench.html && grep -q 'wbleft' /tmp/c11-p2-workbench.html && grep -q 'sidebar' /tmp/c11-p2-workbench.html || st=5; fi; kill "$(cat /tmp/c11-p2-dev.pid)" 2>/dev/null; echo "GATE_EXIT=$st"; exit $st`
- **oracle**：ORACLE-C11-CARRIER
- **evidence_path**：`quality/evidence/c11-p2-build.output`（预期证据类型；同步面证据落 `quality/evidence/c11-p2-sync-*`，基线落 `quality/evidence/c11-baseline/carrier/`）
- **STOP**：P2 起点基线缺失时先补基线再开工；构建非零先分环境失败与目标失败，标记缺失或四行缺行回本 Phase 实施者；026 输入不在原处记 `unavailable` 与恢复条件；live 数据不可用只记覆盖限制，不改写成通过条件。
- **覆盖 AC**：AC-C11-002、AC-C11-007
- **Done**：前置（不作完成条件）：P2 起点六文件副本与哈希清单、T002 改前副本与哈希在场，构建与 026 三命令实际跑过并留原输出。完成条件（只写效果）：AC-C11-002 的两页真实渲染出 PB 组件与布局使用点、四类对象四行齐全、移除一处 import 后构建非零；AC-C11-007 的两类变更有前后哈希、使用点读到新值、旧值与缓存值负例失败、026 三命令退出 0；live 分支、后继采用与未执行项逐项记 `incomplete` 或 `unavailable` 并写恢复条件，不预填完成。
