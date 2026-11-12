# Phase P4 — v15 缩放、可访问面与性能预算读数

本文件写给独立测试者与 P6 收口读者；读完要能说出三块读数怎么采、哪些项必须真测、采不到怎么写。

## 这一 Phase 交出什么？

v15 在 P1 定稿字节上留下 200% 缩放复读、可访问面与性能预算三块真实读数；采不到的项目具名记未测，不拿别的指标替代。

- **本 Phase 结果**：`quality/evidence/c11-p4-zoom.md` 记 200% 下的内容与关键操作，`c11-p4-a11y.json` 记可访问树、连续 Tab 的焦点序列与按 WCAG 公式在页内算出的对比度，`c11-p4-perf.json` 记预算对比与页内观察器的原文和输出；三份都绑定 v15 的 workspace/service/route/state 与 `c11-final-v15.sha256` 的哈希。
- **非目标**：不改 v15 字节、不改载体、不新造采集平台、不代答 C05-P3。
- **改动前**：C09 判词记录 200% 缩放未证实、读屏未检查、性能预算未测（台账 G6）。
- **改动后**：三块各有真实读数或具名未测；阈值收紧时门禁必须变红。
- **与相邻 Phase 的边界**：P1 交字节；本 Phase 只采不修；性能只针对入口首载，不按状态分列。
- **主要风险**：用首屏或 TTFB 替代核心指标，或把 200% 复现说成字面缩放。返工时的替代走法是保留原读数、改记未测，不用别的指标补齐。
- **下一步**：P6 读三份证据登记 C07 的二态或未修。
- **动手前必读**：`spec.md` 的验收 6；台账 G6；`skills/frontend-testing/scripts/collect-*.mjs` 的参数段。
- **未决事实**：`unavailable` — 已确认方向里写的是 ego 浏览器；本机 ego 当前不可用（`which ego` 无、无宿主 space），只有 agent-browser 0.36.0。替换原因与影响写入证据：可访问树与缩放读数是 agent-browser 引擎下的结果，不等于 ego 下同一页面的读数，记为覆盖限制；如果开工时 ego 恢复可用，优先用 ego 并在证据里写实际引擎。

## 这一 Phase 怎么验收？

假设三块都采到，仍不能用“有 JSON”证明读过；本 Phase 要求每块有可复算字段与至少一处真实读数。

本 Phase 只承接验收 6，按「一条验收一小段」写。

**验收 6：缩放、可访问面与性能（AC-C11-006）**

目标：200% 缩放下内容与关键操作有复读记录；可访问面有可访问树、连续 Tab 的焦点序列与按 WCAG 公式算出的对比度；性能有实验室读数与核心指标；采不到的项目具名记未测；把 LCP 预算收到实测值以下时同一判据变红。

怎么操作：先用同一会话打开 v15 入口（`/v15/2026-11-11-002-t019-v15-pending-busy-index.html`），在“未选”“就绪”“成功”三态各复读一次；6a 在页面根元素施加 `document.documentElement.style.zoom = '2'`（1440×900 窗口内的 200% 布局缩放，不叠加其它缩放手段），逐项记控件是否可见、可点、结论；6b 用 `collect-a11y.mjs` 取 `getFullAXTree`，用连续 Tab 读 `document.activeElement` 与可见焦点，用页内脚本按 WCAG 相对亮度公式算前景/背景对比度；6c 用 `collect-perf.mjs` 取 TTFB、DOMContentLoaded、load 与长任务，用页内 `PerformanceObserver` 取 LCP 与 CLS，用一次脚本点击的事件时序近似 INP。

什么条件：v15 静态服务（`python3 -m http.server 8080` 从副本根起）、agent-browser 会话（若 ego 恢复则优先 ego）；身份五项以命令行参数传给审计器，不能只靠环境变量；`collect-perf.mjs` 需要从 `/json/version` 端点进；无真人读屏。

怎样算通过：门禁退出 0；`c11-p4-perf.json` 里七项预算（lcp、cls、inp、ttfb、dcl、load、long_task）每项要么是有限数，要么在 `untested` 里有非空原因；至少一项核心指标（lcp/cls/inp）是真测数；`c11-p4-a11y.json` 的对比度每条颜色都是合法 hex、ratio 是有限数且与页内公式复算一致；`c11-p4-zoom.md` 三态各有“控件/可见/可点/结论”四行。

故意弄坏一处（必须变红）：以 `LCP_BUDGET_MS=1` 重跑同一门禁，必须非零并输出 `over:lcp_ms=...`；LCP 未测时该负例记未测，不得改用 TTFB 或首屏读数声称已验。另把 `c11-p4-a11y.json` 里任一条 ratio 改成错值，必须非零并点名该条。

真跑还是替代：真跑。200% 用根元素布局缩放实施，不是只把窗口缩小；核心指标是页内观察器近似，不是现场 p75；没有真人读屏，用可访问树、焦点与对比度三项等价替代并记覆盖限制。

谁判与证据：未参与采集的独立执行者（来源用 `ocr delegate` 或 wh-review 独立记录），在 T001 交回三份证据后判定；读 `c11-p4-zoom.md`、`c11-p4-a11y.json`、`c11-p4-perf.json`、`c11-p4-focus.ndjson` 与门禁原始输出；结论写 T001「完成」与 `quality/evidence/c11-p4-perf.json`。

失败回修与停止：信号是采集器报错、指标缺失却未记未测、对比度不可复算、预算超限或负例不变红。采集器问题保原错误并记该块未测；页面问题回 P1；同一块两次失败停手报主会话，整项按未修登记。

## 为什么现在做，依据是什么？

页面字节定稿后才能量速度和可访问面；早于 P1 会量到旧字节。

- **结果**：三块读数可回读、可复算，未测项具名。
- **非目标**：不改页面、不建指标平台、不做前后对比。
- **与其它 Phase 的区别**：P3 判逐格状态与设计，本 Phase 判缩放、可访问与性能。
- **依据**：缺口台账 G6；`spec.md#实现设计（全局权威）` 的「需求到任务追踪」把 R-006 绑到 P4/T001 与 ORACLE-C11-QUALITY。

## 开始前读什么？

| 材料或锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `quality/evidence/c11-final-v15.sha256` | 记录所测字节 | 开工前 |
| `skills/frontend-testing/scripts/collect-a11y.mjs`、`collect-perf.mjs` | 读参数与输出字段 | 写卡前 |
| `v15/2026-11-11-002-t019-v15-pending-busy-index.html` | 入口与首载内容 | 开工前 |
| `spec.md` 的验收 6 与预算来源 | 预算阈值与采不到怎么写 | 写卡前 |

## 每个文件由谁改，先做什么？

- **新增**：`quality/evidence/c11-p4-zoom.md`、`c11-p4-a11y.json`、`c11-p4-focus.ndjson`、`c11-p4-perf.json`（T001 写）。
- **修改**：无；不改 v15 与载体。
- **禁止改动**：v15 字节、载体、P1 证据、P3 的 33 格原件、`spec.md`。

本 Phase 只有一个写主；页面与采集器都只读。

## 怎么验证？

三块各有可复算字段；门禁拒绝“字段存在但值无效”，也拒绝全部核心指标未测。

开工前四要素：验证层是真实环境采集；命令是本文件机器字段的 `gate_cmd`；预期是 GREEN 退出 0、`LCP_BUDGET_MS=1` 非零；失败条件是采集器未启动、指标缺失却未记未测、对比度不可复算或预算超限。

成本：executor=独立测试者；estimate_min=75；hard_cap_min=150；retry_cap=1；evidence_tier=命令级。

| 目标 | Task | 角色 | gate_cmd 与预期退出码 | 判据与证据路径 |
| --- | --- | --- | --- | --- |
| 三块读数可判、阈值收紧必红 | T001 | RED | `LCP_BUDGET_MS=1 node quality/evidence/c11-p4-gate.mjs` 非零并输出 `over:lcp_ms=` | ORACLE-C11-QUALITY 与 `planned: quality/evidence/c11-p4-perf.json` |
| 三块读数可判、阈值收紧必红 | T001 | GREEN | 同一命令（`LCP_BUDGET_MS` 默认 2500）退出 0 | ORACLE-C11-QUALITY 与 `planned: quality/evidence/c11-p4-perf.json` |

覆盖上限：只证 v15 定稿字节一次采集的三块读数与未测记录。页面无 URL 业务状态入口，性能只针对入口首载；核心指标 LCP、CLS、INP 是页内观察器近似，不是现场 p75；实验室值也不是现场 p75；200% 是根元素 200% 布局缩放；引擎是 agent-browser（ego 不可用时的替换，已记影响）；没有真人读屏。
显式不覆盖：不证真实用户任务、不证 ego 下的等价读数、不证 C12 能力验收与发布。

失败了怎么办：采集器报错保原错误并记该块未测；观察器装不上时记未测，不拿首屏或 TTFB 替代；对比度算不出时该行记未测并写明前景/背景取值；同一块两次失败停手报主会话。

## 下一消费者拿什么继续？

P6 读三份证据与门禁输出，登记 C07 的二态或未修。

- 交回：三份证据、焦点原始记录、门禁 GREEN/RED 原输出、所用引擎与 `c11-final-v15.sha256` 的哈希。
- 未完成项：采不到的项目在 `untested` 里具名并写原因，P6 据此登记。

## 每张任务卡怎么写？

### 任务 1：在 v15 定稿字节上采三块读数

为什么做：C09 判词记录 200% 缩放、可访问面与性能预算都缺证；本卡在 P1 定稿字节上补三块真实读数，对应 R-006 与 AC-C11-006。
交付什么：缩放复读、可访问面与性能三块证据及未测记录；失败信号是采集器报错、指标缺失却未记未测、对比度不可复算或预算超限。
不做什么：不改 v15 与载体，不建指标平台，不拿首屏或 TTFB 替代核心指标。
前置：P1 定稿字节与 `c11-final-v15.sha256`；依赖 P1。
怎么做：起服务开会话；6a 根元素 200% 布局缩放后复读三态控件与结果；6b 取可访问树、连续 Tab 焦点与页内对比度；6c 取实验室指标并用页内观察器取 LCP、CLS、INP；合成三份证据后跑门禁并做阈值负例。
怎么验收：跑本卡门禁，GREEN 退出 0；`LCP_BUDGET_MS=1` 时非零并输出 `over:lcp_ms=`；改错对比度值必须非零。
证据：`quality/evidence/c11-p4-zoom.md`、`c11-p4-a11y.json`、`c11-p4-focus.ndjson`、`c11-p4-perf.json`、`c11-p4-gate.mjs`、门禁原输出；未执行时记 `unavailable`。
下游（含何时停）：P6 读三份证据登记；采集器同一错误两次或页面不可达时停手报主会话。

**校验器用，人可跳过**

- **任务编号**：T001
- **Source / FR / AC**：R-006 / FR-C11-006 / AC-C11-006；三块须有真实读数或具名未测。
- **Inputs**：P1 定稿字节与 `c11-final-v15.sha256`；v15 静态服务；浏览器会话。
- **Files / symbols**：`quality/evidence/c11-p4-zoom.md`、`c11-p4-a11y.json`、`c11-p4-focus.ndjson`、`c11-p4-perf.json`、`c11-p4-gate.mjs`；symbol: N/A — 证据与门禁脚本。
- **Action**：起服务开会话；根元素 200% 缩放复读三态；取可访问树、Tab 焦点与页内对比度；取实验室指标与页内 LCP/CLS/INP 观察器；合成三份证据并跑门禁与阈值负例。
- **Outputs / failure**：三份证据结构齐、七项预算有数或有未测原因、至少一项核心指标真测；采集器报错、缺字段、对比度不可复算、预算超限一律非零。
- **Boundary / DO NOT TOUCH**：v15 字节、载体、P1 证据、P3 原件、`spec.md`；不新增采集平台。
- **Dependency**：P1。
- **Test tier / skill**：feature / frontend-testing 的采集与 `isolated-browser-qa` 会话；无真人读屏。
- **Scenario / fixture or service**：v15 静态服务、agent-browser（ego 可用则优先 ego）、三态入口；无账号、无后端。
- **RED/GREEN gate_cmd**：`LCP_BUDGET_MS=1 node /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/c11-p4-gate.mjs`（负例）与去掉环境变量的同一命令（正例）
- **expected_exit**：GREEN 0；`LCP_BUDGET_MS=1` 非零并输出 `over:lcp_ms=`；字段缺失或对比度错值为非零；采集器未启动另记未执行。
- **RED target failure**：ORACLE-C11-QUALITY 断言“LCP 在收紧预算下必须判超”；当前无证据时门禁以 `unreadable:` 退出，属未执行而非通过。
- **RED evidence**：改前无三块读数；风险是把“有 JSON”当“读过”；客观替代是可复算字段加至少一项核心指标真测。
- **GREEN oracle**：ORACLE-C11-QUALITY 七项预算有数或具名未测、至少一项核心指标真测、对比度可复算、缩放三态四行齐；同一断言拒绝全部核心指标未测、拒绝缺字段静默通过。
- **Evidence**：三份证据、焦点记录、门禁原输出、所用引擎与字节哈希。
- **STOP / recovery**：采集器报错或页面不可达时保原错误并记该块未测；页面行为回 P1；同一块两次失败停手报主会话；不改门禁求绿。
- **Coverage limit**：只证 v15 定稿字节一次采集；不证 ego 等价读数、真实用户任务、C12 能力验收。
- **Done**：前置（不作完成条件）：P1 定稿字节与清单可读，采集器可启动。完成条件（只写效果）：AC-C11-006 的三块有真实读数或具名未测，阈值收紧能变红，对比度可复算。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计（全局权威）`
- **写入集**：`quality/evidence/c11-p4-zoom.md`、`quality/evidence/c11-p4-a11y.json`、`quality/evidence/c11-p4-focus.ndjson`、`quality/evidence/c11-p4-perf.json`、`quality/evidence/c11-p4-gate.mjs`
- **依赖**：P1
- **消费者**：P6
- **gate_cmd**：`LCP_BUDGET_MS=2500 node /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/c11-p4-gate.mjs`
- **oracle**：ORACLE-C11-QUALITY
- **evidence_path**：`quality/evidence/c11-p4-perf.json`
- **STOP**：采集器同一错误两次或页面不可达时停手报主会话；不改门禁求绿，不用其它指标替代未测项。
- **覆盖 AC**：AC-C11-006
- **Done**：前置（不作完成条件）：P1 定稿字节与清单可读。完成条件（只写效果）：三块读数齐或有据名未测、阈值收紧变红、对比度可复算。
