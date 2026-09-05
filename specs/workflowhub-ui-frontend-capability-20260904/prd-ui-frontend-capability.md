# PRD：workflowhub UI/前端能力升级（任务群需求文档）

> **文档性质**：这不是单功能 spec，而是一组任务的完整需求文档。本任务（workflowhub-ui-frontend-capability-20260904）的 make-decision 已收尾（23 项决策锁定、58 条审查 findings 全部处置），本文档把已收敛的决策拆成 **10 个可独立执行的任务**，供后续逐任务走 workflowhub 完整五阶段流程（每个任务的 make-decision 做轻量确认即可——决策已在此锁定，不要重新开方向讨论）。
> **生成方式**：遵循 build-spec 流程（调研 → 一批澄清 → 撰写 → 审查 → 处置 → 一致性检查），结构参考 mattpocock/skills 的 `wayfinder`（任务地图/波次/依赖）与 `to-spec`（问题/方案/用户故事/验收/出界）两个技能。
> **唯一事实来源**：方向与决策以 `decision-log.md` 为准；方案细节以 `evidence/frontend-capability-upgrade-plan-v2.md`（v3）为准；本文档只做任务级拆解与承接，不发明新方向。

---

## 1. 背景与问题

PB-T08 任务（PaperBuilder 三页 UI 对齐设计稿）暴露：5 轮返工、约 30 个缺陷、20+ 小时人肉 QA。根因不是模型能力，而是流程缺失三个东西——**缺提取**（设计稿没有数字化成精确规格）、**缺对照**（没有逐行核对清单）、**缺证据**（视觉验收靠人眼，agent 无机器 oracle）。缺陷分布：约 60% 可在编码前消灭（提取+对照）、约 25% 可在交付前消灭（系统验证+边界测试）、约 10% CSS 历史债务、约 5% 沟通消歧。

同时，目标不止"复现得像"：用户要求 workflowhub 具备**工程化能力非常强的 UI 设计与前端工程能力**——组件化、统一性、可维护性、性能四个维度都是一等能力。

详见 `decision-log.md`（需求矩阵/核心需求卡）与 `evidence/workflowhub-gap-analysis.md`（9 个能力缺口）。

## 2. 目标与成功标准

**总目标**：workflowhub 的 UI/前端链路升级为"设计源冻结 → 精确提取 → 对照清单 → 规格驱动派发 → 逐块视觉验证 → 矩阵验收 → 规范沉淀回写"，有稿任务"100% 复现设计稿"以可证伪口径落地（对照矩阵全绿 ∨ 仅剩经确认的 accepted-minor），无稿任务有完整的自建设计稿子流程；工程质量四维度（组件化/统一性/可维护性/性能）嵌入全流程。

**总成功标准（P2 试点可证伪判定）**：返工轮次 ≤2、缺陷数 ≤10（基线 30 的 1/3）、用户人工介入 ≤2 小时（基线 20+）、验收确认次数 =1、视觉判定 CRITICAL/MODERATE=0 且 MINOR 全部列容忍清单经确认。与 B0 基线同设计稿同范围直接可比。

## 3. 范围与非目标

**范围内**：workflowhub 仓的技能/工具/工作流改造；对照实验（B0/P1/P2/P3）；外部技能移植与概念并入；Design.md/Experience.md 模板升级。

**非目标**（决策已锁定，不得在执行中复活）：
- 不追求逐像素完美（不可达且无限打磨）；
- 不新增工作流阶段、硬 gate、第五材料（唯一阻断边界：规格缺五要素禁止派发，按宪法 F5/F11 登记为 proven boundary）；
- 不整族 vendor Website-skills（只按 ①7/②24/③24/④69 分类处置）；
- 不做独立设计阶段、不做 MCP 化、不做回放式大实验平台（对照实验按本 PRD 的简单协议执行）；
- 试点 n=1 不宣称统计显著。

## 4. 任务地图

10 个任务，6 个波次；同波次任务可并行。**T01（B0 基线）必须在任何改造落地前完成**——它用"现状流程"跑，改造一旦开始，"改版前环境"就不复存在。

```
W1 ├─ T01  B0 改版前基线实现（现状流程，六指标采集）
   └─ T02  M0 地基（验收对象卡 + 两文件最小基线 + stylelint 规则包 + 失败三层归档）
W2 └─ T03  M1 薄闭环（design-extractor + ui-parity-checklist + readiness 接线
                    + 最小派发接线 + iterate-until-verified 移植）
W3 └─ T04  P1 薄闭环试点（真实任务，可证伪判定）
W4 ├─ T05  M2 视觉验收能力（ui-visual-fidelity + ui-capture + 边界电池 + 视口矩阵）
   ├─ T07  M4a 外部技能移植（①7 external 登记 + LICENSE 审计 + ADR 0016 补债 + ③24 references 登记）
   └─ T08  M4b 概念并入与四维度扩展（②24 并入 + component-quality 扩展 + 模板升级 + CONTEXT.md/ADR 0024）
W5 └─ T06  M3 全链路接线（builder 规格密度模板 + 派发边界登记 + build-code/verify-code 接线 + 验收矩阵编排）
W6 ├─ T09  P2 全链路试点（同稿同范围，对照 B0/T08）
   └─ T10  P3 original-design 试点（无稿任务）
```

依赖说明（blocking 关系）：

| 任务 | 被谁阻塞 | 说明 |
|---|---|---|
| T02 | T01（合并红线） | 可与 T01 并行开发；红线=**T01 完成前任何改造分支不得合并 main，且 T01 会话固定使用 main 当前 commit 的 workflowhub 环境**（各任务改动留在各自 worktree，互不影响 B0 环境） |
| T03 | T02 | 依赖两文件最小基线与验收对象卡定义 |
| T04 | T03 | 薄闭环试点必须在 M1 落地后 |
| T05 | T03；T04（条件） | 视觉验收消费 parity 矩阵与提取产物；**T04 判定失败则本任务暂停铺开，先回 build-spec 重估设计** |
| T06 | T05 | verify-code 接线消费 visual-diff-report.v1（M2 产物） |
| T07 | T01（合并红线）；T04（条件） | 移植登记可与 T05/T08 并行开发；同 T02 合并红线；T04 失败则暂停 |
| T08 | T01（合并红线）；T07（软）；T04（条件） | 概念并入引用 external 登记的技能名；可先写内容后对齐登记名；T04 失败则暂停 |
| T09 | T04+T05+T06+T07+T08 | 全链路试点依赖全部建设完成 |
| T10 | T04+T05+T06+T08 | original-design 依赖复现链路（提取/对照/视觉/接线全部就绪）+两文件模板 |

**机制承接补记**（防覆盖缺口）：消歧协议→T06 FR-6；环境守护（服务/分支/端口绑定）→T02 验收对象卡+T05 health check；isolated-browser-qa/fullstack-slice-testing 扩展→T05/T08；frontend-prototype-render 接线→T06 FR-5。

**战雾（Not yet specified，后续任务执行中可能浮现，届时在那个任务内消化，不在本 PRD 预切）**：9 维比对的具体维度清单与 visual-diff-report.v1 结构（T05 的 build-spec 必产出）；P1/P2/P3 测量契约细节（T04 的 build-spec 必产出）；验收对象卡字段 schema+校验器（T02 的 build-spec 必产出）；ADR 0024 文本（T08 撰写）。

## 5. 任务卡

> 每卡字段：ID/标题/来源决策/波次/目标与产出/用户故事/功能需求 FR/验收标准 AC（判定方法+通过 oracle+失败条件+证据）/风险与失败边界/复用素材索引/预估规模。
> 每个任务独立走 workflowhub 五阶段；其 make-decision 只需轻量确认本卡内容（决策已锁定，标"承接自母任务决策 #N"）。

---

### T01　B0 改版前基线实现

- **来源决策**：#19/#20/#21（R4）；对照实验协议（方案 §8）
- **波次**：W1（与 T02 并行；**必须先于一切改造完成**）
- **目标与产出**：用**现状流程**（无新技能）基于 `/Users/Hugh/Downloads/UI设计稿` 在独立 **Next.js** 目标仓实现 SimulationBoard + SimWorkbench 两页 demo，全程采集六指标基线数据。产出：可运行 demo + `baseline-metrics.json` + 过程记录。
- **用户故事**：
  1. 作为流程改进负责人，我要一份"改版前真实水平"的基线数据，以便改版后同口径对比、向团队证明改造有效；
  2. 作为评审者，我要基线任务的条件复刻 PB-T08 的实际做法（可渲染设计稿、可读源码、无规格强制），以便数据可比。
- **FR**：
  - FR-1 目标仓为 Next.js（非 Vite——防同栈抄源码污染实验）；
  - FR-2 实现过程按现状做法：agent 可渲染设计稿、可读设计稿源码（这正是被测量的"现状"）；
  - FR-3 全程记录六指标，口径按本 PRD §8 最小度量契约（缺陷去重单位/轮次边界/B0 临时分级标尺/B0 侧"验收确认"与"视觉比对"的适配口径）；
  - FR-4 视觉基准以**设计稿产物渲染**为准（不以 prompt 文本为准——已实证 Figma Make 产物未遵守自家 12 色系统）。
- **AC**：
  - AC-1（方法：过程记录核查）六指标每一项都有真实记录，缺失项标 N/A+原因；oracle：六指标字段齐全；失败条件：任何指标靠事后回忆补填；
  - AC-2（方法：demo 运行）两页 demo 在 Next.js 仓可运行、可截图；oracle：`pnpm build` 或 `pnpm dev` 成功 + 两页截图存在；证据：截图 + 命令输出；
  - AC-3（方法：对照检查）实现过程未使用任何本 PRD 的新技能/工具；oracle：过程记录中无新链路痕迹。
- **风险与失败边界**：现状流程可能 3+ 轮才过——这不是失败，这正是基线价值；**不许为了好看而省略返工记录**。失败条件：设计稿项目无法渲染（风险低，node_modules/dist 已侦察齐全）→ 记录原因并用 dist/ 构建产物作渲染源。
- **素材索引**：`evidence/pilot-baseline-design.md`（组件清单/数据层/风险）；手册第六部分（验证篇）。
- **预估规模**：0.5–1 天。

---

### T02　M0 地基

- **来源决策**：#9（schema+两文件中心制）/#15（owner 缺省）/#16（即时回写）；方案 §1.1/§1.4/M0 行
- **波次**：W1（与 T01 并行）
- **目标与产出**：①验收对象卡规范（载体=spec.md UI Contract 结构化区块；字段 schema+校验器：page/route/state/viewport/版本/owner/失败状态——字段细节在本任务 build-spec 产出）；②Design.md/Experience.md **最小基线字段契约**前移（完整模板升级在 T08）；③stylelint 规则包（原 css-hygiene 决策落地为 stylelint 配置+规则集：同选择器多定义/!important/旧代标记等）；④失败三层归档机制（失败事实/原因/处置分层记录）。
- **用户故事**：
  1. 作为任务发起者，我要每个 UI 任务一开始就写死验收对象（分支/服务/页面/viewport），以免"修好了"没有可验证对象；
  2. 作为前端工程师，我要 stylelint 在写码时就拦住旧代样式打架，而不是验收时才发现。
- **FR**：
  - FR-1 验收对象卡是 spec.md 内部结构化区块，**不新增材料**（宪法兼容）；make-decision 阶段意图记 decision-log、build-spec 落成区块（时序已定）；
  - FR-2 两文件最小基线只含本链路必需字段（design_revision 冻结/页面清单/组件清单/token 表骨架），完整模板归 T08；
  - FR-3 stylelint 规则包随 ui-project-init 提供，可独立运行；
  - FR-4 失败归档三层：事实层（原始证据）/归因层/处置层，不许用摘要覆盖来源；
  - FR-5 验收对象卡含设计 owner 字段，**未显式指定时校验器回退缺省值=用户本人**（决策 #15），流程不因 owner 空缺而悬空。
- **AC**：
  - AC-1 验收对象卡 schema+校验器存在且能拒绝缺字段的卡（方法：校验器对一张缺 viewport 的卡报具体缺失；oracle：非零退出+字段名）；
  - AC-2 stylelint 规则包对一份含"同选择器双定义+!important"的样例 CSS 报出对应违规（oracle：两条以上违规输出）；
  - AC-3 最小基线字段结构与校验器通过 T02 内部契约测试（方法：构造合法/缺字段两组样例卡；oracle：合法通过、缺字段报具体缺失；不依赖后续任务回验）；
  - AC-4 owner 字段缺省时校验器输出"缺省=用户本人"而非报错或留空（方法：构造无 owner 的卡；oracle：回退记录可见）。
- **风险与失败边界**：验收对象卡字段过度设计——只允许登记有真实 consumer 的字段（宪法：无 consumer 不新增控制面）；stylelint 规则过严误伤存量项目——规则包分"新增代码严/存量代码警告"两档。
- **素材索引**：方案 §1.1/§1.4/M0；`evidence/engineering-quality-integration.md` §1-2；手册第三部分。
- **预估规模**：1–2 天。

---

### T03　M1 薄闭环（提取+对照+派发）

- **来源决策**：#2（设计源形态双源交叉）/#9（三 schema）/#10（提取器形态）/#13（M1 先行）/#14（LOW_FIDELITY 确认点）；方案 §2.1/§2.2/§5.9/§8 M1 行
- **波次**：W2
- **目标与产出**：①`design-extractor` 技能 + `design-extract.mjs` 工具 + `design-extract.v1` schema（三模式：可渲染+源码双源交叉主模式/Figma MCP/截图标 LOW_FIDELITY）；②`ui-parity-checklist` 技能 + 两阶段契约（build-spec 全红初始化/build-code 后填充）；③design-source-readiness 接线；④最小 parity→build-code 派发接线（规格缺五要素禁止派发，模式适配：code=路径+行号、figma=node id+属性表、image=区域坐标+测量值）；⑤`iterate-until-verified` 移植登记到 skills/external/（M3 编排依赖它，detail 审查倒挂修正）。
- **用户故事**：
  1. 作为流程使用者，我要设计稿自动变成精确到像素的规格表，不再靠 agent 看类名脑补；
  2. 作为 builder，我要每张任务卡写清"做哪个组件、规格表哪几行、验收看什么"，缺这些就不许开工。
- **FR**：
  - FR-1 提取双源交叉：源码类名/结构（意图）+ 浏览器 dump 全元素 computed style（真实值），冲突以 computed 为准并记录差异；
  - FR-2 提取器属设计源读取侧，不受"实现侧禁读源码"约束（对照实验边界已澄清）；
  - FR-3 parity 矩阵两阶段：初始化以实现侧全 missing；每行含设计值/实现值/状态/证据引用；
  - FR-4 派发接线最小化：只接"规格→任务卡"通道，完整接线归 T06；
  - FR-5 iterate-until-verified 按 ADR 0016 模式完整复制+固定 commit+LICENSE 登记；
  - FR-6 设计源质量分：质量分扣分模型在本任务 build-spec 固化（移交清单项），质量分 <0.8 与 LOW_FIDELITY 同级处理（决策 #14）。
- **AC**：
  - AC-1（方法：对 UI设计稿 项目实跑提取）提取覆盖率可计算且有分母定义（本任务 build-spec 固化测量契约）；oracle：design-extract.v1 含全部页面组件行；
  - AC-2（方法：构造缺要素规格尝试派发）缺五要素的规格被拒绝派发；oracle：派发失败+缺项清单；证据：命令输出；
  - AC-3 LOW_FIDELITY 路径与质量分 <0.8 路径均触发人工确认点（决策 #14）；oracle：截图模式产物带 LOW_FIDELITY 标记+确认点记录，低分样例输入触发同一确认点。
- **风险与失败边界**：Figma Make 产物的样式真实性坑（产物≠prompt 文本）——基准以渲染为准；提取器对自定义 Tailwind 配置的解析（PB-T08 R1 根因）——必须以 computed style 为准。失败条件：提取覆盖率结构性达不到 90%（截图模式）→ 不谎称通过，记录事实。
- **素材索引**：方案 §2.1/§2.2；`evidence/p0-deep/impeccable.md`（DESIGN.md 规范入提取器）；手册第三/五部分。
- **预估规模**：4–6 天。

---

### T04　P1 薄闭环试点

- **来源决策**：#11（P1/P2 两段试点）/#13（M1+P1 先行）；方案 §8 P1 行
- **波次**：W3
- **目标与产出**：用一个真实 UI 任务跑薄闭环（提取+对照+人工视觉确认），按可证伪标准判定 M1 价值。产出：试点记录+判定结论（达到/未达到，n=1 不称统计显著）。
- **用户故事**：作为负责人，我要在铺开 M2-M4 之前用真任务验证薄闭环有效，避免大面积返工。
- **FR**：
  - FR-1 试点模式**锁定 reference-reproduction（有稿）**（B0/P1/P2 全有稿，无稿另设 T10/P3）；模式在验收对象卡标注；
  - FR-2 **实现侧禁读设计稿源码，提取器输出是唯一设计规格来源**（对照实验协议）——否则"提取器中介"的增量不可归因；
  - FR-3 通过标准三项：提取覆盖率 ≥90%；parity 矩阵实际驱动派发（派发规格引用矩阵行）；试点任务返工 ≤2 轮；
  - FR-4 任一未达=失败→**回 build-spec 重估 M2-M4 设计**（不是"只返工 M1"）。
- **AC**：AC-1 三项标准各有可核查记录（覆盖率数字/派发规格引用/返工轮次日志）；oracle：三项全达→通过，否则失败结论+缺口清单；失败条件：为凑通过而降低测量标准。
- **风险与失败边界**：试点失败是合法结果（这正是先试点的意义）；失败时 T05/T06/T07/T08 暂停铺开，先修设计。
- **素材索引**：方案 §8；手册第六部分（测量口径）。
- **预估规模**：随真实任务（+0.5 天记录）。

---

### T05　M2 视觉验收能力

- **来源决策**：#3（视觉模型双轨）/#6（矩阵全绿+MINOR 容忍）/#7（缺视觉证据=incomplete）/#17（缺陷稿裁决）/#18（标尺固化）；方案 §2.3/§3/M2 行
- **波次**：W4（与 T07/T08 并行）
- **目标与产出**：①`ui-visual-fidelity` 技能：9 维比对（维度清单+visual-diff-report.v1 结构在本任务 build-spec 产出）+ PASS/MINOR/MODERATE/CRITICAL 分级标尺固化技能内（全项目统一）+ 有界收敛策略（批量截图一轮→一批修完→至多再一轮→停）；②`ui-capture.mjs` 工具：`--url` 服务地址+连通性健康检查（失败标 unavailable 不伪造）+ 截图 provenance（git commit/worktree path/路由/viewport/designRefHash 绑定验收对象卡）；③边界电池清单进 frontend-testing（超长文字/窄屏/空数据/64 位哈希等）+ 视口矩阵（前端缺失矩阵）；④isolated-browser-qa 扩展：性能取证（预算核对）+ browser-qa-evidence.v1 字段扩展（截图 provenance/性能指标/视觉比对引用）。
- **用户故事**：
  1. 作为验收者，我要每块 UI 写完就自动截图+AI 看图+跟设计稿比对，不合格当场改，而不是交付后由我肉眼发现；
  2. 作为用户，我要 PB-T08 里"超长词撑爆浮窗/hover 死区/空数据破版"这类边界问题被系统性测掉。
- **FR**：
  - FR-1 9 维比对与 diff 报告结构为可执行定义（缺则技能不算完成）；
  - FR-2 分级标尺固化：MINOR 不算绿；判定=全绿 ∨ 仅剩 accepted-minor（经用户确认的容忍清单）；
  - FR-3 服务挂了=验收对象卡 health check 失败=标 unavailable，不许嘴硬"已完成"；
  - FR-3b 有界收敛硬规则：单区域 3 轮上限；一轮无新增 PASS=停滞停机（诚实停止），不许弱化 gate 换成功；
  - FR-4 没跑视觉验证的 UI 交付只能报"未完成"+原因（缺视觉证据=incomplete）；
  - FR-5 视觉比对发现**设计稿自身缺陷**（对比度违规/a11y 问题等）时：实现照抄设计稿+产出缺陷清单交设计 owner 裁决（决策 #17），不许 builder 擅自"修复"设计；owner 批准的修正走 approved-deviation 记录。
- **AC**：
  - AC-1 ui-capture 对挂掉的服务标 unavailable 而非伪造截图（方法：指向未启动端口；oracle：unavailable+原因）；
  - AC-2 边界电池对一个含 64 位哈希的浮窗场景产出破版检测记录（方法：样例页面；oracle：溢出/截断被报出）；
  - AC-3 分级标尺对样例 diff 输出一致的级别（方法：同一输入两次跑；oracle：级别相同）；
  - AC-4 对一份含对比度违规的样例设计稿，产出缺陷清单且实现侧无擅自偏离（方法：样例任务；oracle：清单含违规项+parity 无未授权偏差）。
- **风险与失败边界**：AI 看图误判（假阳性/假阴性，PB-T08 缺陷类 8）——判定必须对照表驱动+数值优先，视觉模型只作辅助信号；收敛策略被绕过（无限打磨）——两轮上限硬编码。
- **素材索引**：`evidence/p0-deep/impeccable.md`（craft-floor/有界验证）；方案 §2.3/§3；手册第五部分 5.1-5.3。
- **预估规模**：4–6 天（与方案 M2 口径一致）。

---

### T06　M3 全链路接线

- **来源决策**：#12（派发边界正名 F5/F11）/#16（即时回写+overlay）/#17（缺陷稿裁决执行侧）/#23（违规记事实交 owner）；方案 §1.2/§5.9/§8 M3 行
- **波次**：W5（依赖 T05）
- **目标与产出**：①builder 规格密度模板（任务卡=组件+矩阵行引用+验收点）；②"规格缺五要素禁止派发"按宪法 F5/F11 **正式登记为 proven boundary**（证明=PB-T08、consumer=build-code 派发、owner=build-code UI handler）；③build-code/verify-code 接线：build-code 只许用登记 token/组件（冲突记例外交 owner 裁决、新 token 走 task-local overlay、approved-deviation 记录）、verify-code 消费 parity/diff 报告（经 verify-change 证据检查）；④验收矩阵编排（基于 T03 移植的 iterate-until-verified：主观词→二值 gate、制造/评判分离、诚实停止）。
- **用户故事**：
  1. 作为 builder，我要写码时就知道每条规格的来源和验收方式；
  2. 作为流程治理者，我要"独立裁决"在验收矩阵层面落地：实现者不能给自己的产物打分。
- **FR**：
  - FR-1 派发边界登记条目含证明/consumer/owner/删除条件；
  - FR-2 工程质量违规（性能/组件规范）记事实交 owner 裁决，不阻断（R4-5）；唯一阻断=五要素边界；
  - FR-3 验收矩阵每行：Gate｜验证方法｜二值通过条件｜证据；失败按证据路由到责任 workstream；
  - FR-4 三个架构机制落地：approved-deviation 记录结构（owner/理由/修正值/验收处置）、新 token task-local overlay（任务内可用、结束合并回写）、设计稿值不在 token 表时记例外交 owner 裁决（不许静默近似）；
  - FR-5 build-spec UI 路径接线（ui-project-init/design-source-readiness/frontend-prototype-render 原型确认环节）含在无稿链路内；
  - FR-6 **消歧协议**（承接方案 §0）：用户验收反馈先定位确认（目标元素/页面/状态）再修，10 秒确认省一轮返工（PB-T08 缺陷类 9）。
- **AC**：
  - AC-1 接线后用一个样例 UI 任务走通"提取→对照→派发→写码→截图验证→矩阵验收"全程（方法：样例任务端到端；oracle：各环节产物链路完整可追溯）；
  - AC-2 proven boundary 登记条目存在且通过登记校验（方法：查登记；oracle：四要素齐全）；
  - AC-3 approved-deviation 与 overlay 机制可执行验证（方法：样例场景——owner 批准一个设计修正+一个新 token；oracle：偏差记录四要素齐全、overlay 任务内生效且结束合并回写、冻结 revision 未被污染）。
- **风险与失败边界**：接线范围蔓延成编排子系统大工程——以"能跑通验收矩阵"为完成线，不做通用编排平台；与既有 build-code 流程冲突——改动能关则关（兼容非 UI 任务）。
- **素材索引**：方案 §1.2/§5.9；`evidence/p0-deep/interface-review.md`（verify-change 侧）；手册第四部分。
- **预估规模**：4–5 天。

---

### T07　M4a 外部技能移植与登记

- **来源决策**：#1（技术栈+ADR 0016）/#5（按类混合移植）；方案 §6/§6.1/M4 行
- **波次**：W4（与 T05/T08 并行）
- **目标与产出**：①①类 7 技能完整复制到 `skills/external/`（web-design-guidelines **含远端 command.md 全文快照**/better-ui 含评审输出格式与 10% 慢放评审法/animate **连同 RECIPES.md 14 配方**/review-animations/landing-page/vercel-react-view-transitions；iterate-until-verified 由 T03 移植，本任务验收其登记完整性），逐个固定 commit+LICENSE/UPSTREAM 文件+改造点登记（姊妹引用改写/自带 review-output 剪掉）；②**ADR 0016 补债**：vercel-react-best-practices 70 规则 8 大类从官方仓 `vercel-labs/agent-skills@dd089a8c` 完整放入（现状仅 21 行手写摘要）；③③类 24 个 references 登记（含 3 个暗色工作台皮肤作 original-design 起步模板）；④catalog `update_policy` 落地为定期上游漂移检查动作；⑤逐技能 LICENSE 审计表（来源/署名义务/改造再分发边界）。
- **用户故事**：作为维护者，我要每个外来技能都知道从哪来、什么版本、什么许可、改了什么、何时该复查上游。
- **FR**：
  - FR-1 全部取件从官方上游仓固定 commit，不从 Website-skills 镜像取（镜像是非官方快照）；
  - FR-2 web-design-guidelines 固化快照含远端规则全文（本体仅 40 行 wrapper）；
  - FR-3 LICENSE 审计表是 M4 完成的必要条件；
  - FR-4 ④类 69 个不引入清单登记在案（防日后反复重议）。
- **AC**：
  - AC-1 每个 external 技能目录含 LICENSE+UPSTREAM（来源/commit/改造点）（方法：逐目录核查；oracle：8 条登记全齐）；
  - AC-2 vercel-react-best-practices 含 rules/ 完整 70 条（方法：数规则文件；oracle：8 大类 70 条）；
  - AC-3 LICENSE 审计表覆盖全部 ①+③登记项。
- **风险与失败边界**：上游 license 不允许改造再分发→该技能降级为 references 引用或不引入；镜像与官方仓内容漂移→以官方仓为准。
- **素材索引**：`evidence/research-website-skills.md` §3-①③④；`evidence/p0-deep/` 全部（每个技能的移植风险节）；ADR 0016 原文。
- **预估规模**：3–4 天（PRD 拆分重估：T07+T08 合计 6–8 天，较方案 M4 的 5–6 天上浮——依据：ADR 0016 补债与四维度扩展为 detail 审查后补入 M4 的内容）。

---

### T08　M4b 概念并入、四维度扩展与规范模板

- **来源决策**：#5（概念并入现有技能）/#22（四维度扩 component-quality）/#23（违规语义）；方案 §1.4/§6.1/M4 行
- **波次**：W4（与 T05/T07 并行；软依赖 T07 的登记名）
- **目标与产出**：①②类 24 技能概念按 p0-deep 笔记并入宿主技能（impeccable→ui-visual-fidelity/frontend-component-quality/verify-change/design-extractor 分流；interface-review 整体→verify-change；vercel-composition-patterns→component-quality+prototype-render 生成侧+testing provider 替换策略；animation-vocabulary 12 类 91 词条→animate；better-accessibility 112 条→component-quality/testing；web-component-design/emil-design-eng 等各行）；②**frontend-component-quality 四维度扩展**（组件化/统一性/可维护性/性能：SKILL.md 修改+check 脚本扩项+references 引入——不新增技能）；③三份同构 review-output.md 合并为单一 review 输出契约（归 component-quality）+各领域 Severity 补丁；④Design.md/Experience.md **完整模板升级**（ui-project-init）；⑤CONTEXT.md 术语写入 + **ADR 0024 撰写**（"UI 规范层与证据层分层"）。
- **用户故事**：作为团队，我要 Vercel/Emil/Jakub 的最佳实践变成我们流程里默认执行的东西，而不是躺在参考库里。
- **FR**：
  - FR-1 并入规则进 references/ 按需加载，不进默认加载链（上下文纪律）；
  - FR-2 四维度落点矩阵照 `evidence/engineering-quality-integration.md` 执行（规范→执行→验收→证据四环）；
  - FR-3 性能维度：optimize-web-animations 先测后改原则+性能预算写入 Experience.md 章节；超预算记事实交 owner；
  - FR-4 ADR 0024 按 ADR 三要素（不可逆/跨任务/影响后续所有 UI 任务）撰写登记。
- **AC**：
  - AC-1 24 个②类技能每一行有落地位置回执（宿主技能+章节）（方法：对照 research §3-②表逐行核查；oracle：24/24 有回执或明确"不并入+原因"）；
  - AC-2 component-quality 的 check 脚本覆盖四维度新检查项（方法：对样例组件跑；oracle：四维度违规样例各被报出）；
  - AC-3 CONTEXT.md/ADR 0024 落盘且通过仓内登记校验。
- **风险与失败边界**：并入后技能膨胀失控——每技能 references 增量设行数上限（超出拆文件）；与 ①类 external 技能内容重叠→以 external 为规则源、并入处只放指针。
- **素材索引**：`evidence/p0-deep/` 全部 12 份（每个技能的④集成点节是直接施工单）；`evidence/engineering-quality-integration.md` §5 落点表；`evidence/research-website-skills.md` §3-②。
- **预估规模**：3–4 天。

---

### T09　P2 全链路试点（对照实验主场）

- **来源决策**：#6（验收标准）/#11（试点）/#19（两页范围）/#20（Next.js 禁读源码）；方案 §8 对照实验协议+P2 行
- **波次**：W6（依赖 T04/T05/T06/T07/T08 全部）
- **目标与产出**：**同一设计稿同一范围**（SimulationBoard+SimWorkbench 两页、Next.js 目标仓）用新链路完整跑一遍，对照 B0 与 T08 历史。产出：试点记录+六指标+判定结论。
- **用户故事**：作为负责人，我要看到同一份设计稿在改版前后的六指标对比表，用数据而不是感觉判断改造是否有效。
- **FR**：
  - FR-1 实现侧禁读设计稿源码，提取器输出是唯一设计规格来源（提取器豁免）；
  - FR-2 通过标准（全部可证伪）：返工 ≤2 轮；缺陷 ≤10（CRITICAL/MODERATE/MINOR 分级计数）；人工介入 ≤2 小时；验收确认 =1（最终 MINOR 容忍清单确认；设计方向确认另计）；视觉判定 CRITICAL/MODERATE=0 且 MINOR 全列容忍清单经确认；
  - FR-3 "较 B0 收敛程度"只作数据呈现，不作判定条件；
  - FR-4 任一未达=未通过，缺口回流对应任务的 build-spec 修正。
- **AC**：AC-1 六指标对照表（B0/P2/T08 三列）落盘（方法：表格核查；oracle：三列同口径）；AC-2 判定结论明确写"达到/未达到阈值"，不写"统计显著"。
- **风险与失败边界**：未通过是合法结果；**禁止为通过而放宽阈值**（诚实停止原则）；若设计稿项目届时不可渲染→用 dist/ 构建产物作渲染源并记录偏差。
- **素材索引**：方案 §8 协议；`evidence/pilot-baseline-design.md`；手册第六部分。
- **预估规模**：随任务（+0.5 天记录）。

---

### T10　P3 original-design 试点

- **来源决策**：#8（无稿自建设计稿统一链路）/#11（试点）；方案 §8 P3 行
- **波次**：W6（与 T09 并行；依赖 T04/T05/T06/T08——复现协议提取/对照/视觉环节全走到是 P3 通过条件）
- **目标与产出**：无稿真实任务验证 original-design 子流程：设计方向六段式 → 原型渲染 → 用户确认 → 冻结为自建设计稿 → 并入有稿复现协议。产出：试点记录+判定结论。
- **用户故事**：作为用户，我要没有设计稿时 AI 先做设计给我看，我点头后才冻结成"自建设计稿"进入同样的复现流程——而不是直接开写。
- **FR**：
  - FR-1 设计方向确认 =1 次（原型确认属设计方向确认，与最终验收确认分开计数）；
  - FR-2 冻结后走与有稿完全相同的提取/对照/视觉环节；
  - FR-3 可用 ③类暗色工作台皮肤作起步模板（references 按需，不覆盖项目 Design.md）。
- **AC**：AC-1 确认记录两次（方向确认+验收确认）各自落盘；oracle：复现协议各环节产物齐全；失败条件：绕过原型确认直接冻结。
- **风险与失败边界**：自建设计稿质量依赖皮肤/模板质量——起步模板只定调，token 仍以项目 Design.md 为准。
- **素材索引**：方案 §1.3/§8；手册第三部分（无稿模式）。
- **预估规模**：随任务（+0.5 天记录）。

---

## 6. 全局约束与共享契约（所有任务共同遵守）

1. **宪法边界**：不新增 stage/gate/第五材料；质量裁决独立来源独立上下文；唯一阻断边界=规格缺五要素禁止派发（T06 登记）；质量缺失保持 unknown/unavailable/incomplete，不伪造通过。
2. **证据纪律**：provenance/原始 review/失败事实保留，不用摘要覆盖来源；provider 失败不改写为质量通过。
3. **语义口径**：MINOR 不算绿（判定=全绿∨仅剩 accepted-minor）；复现完成=矩阵全绿+MINOR 容忍清单经用户确认；缺视觉证据=incomplete；设计 owner 缺省=用户本人。
4. **冲突裁决**：测量层以 computed style 为准；规范层例外记录交 owner 裁决；approved-deviation（owner/理由/修正值/验收处置）；新 token 任务本地 overlay，结束合并回写。
5. **沉淀纪律**：G1 即时回写（任务内新 token/pattern 立即写回）；写回产生新 revision，当前任务继续用冻结 revision。
6. **移植纪律**：官方仓固定 commit 取件、LICENSE 审计、自带 review-output 剪掉、references 按需加载不进默认链。
7. **试点诚实**：n=1 只称达到/未达到阈值；不为通过放宽标准；失败是合法结果。

## 7. 全局风险登记册

| # | 风险 | 影响任务 | 应对 | 关闭条件 |
|---|---|---|---|---|
| R-1 | Figma Make 产物样式真实性（产物≠文本描述） | T01/T09 | 视觉基准以产物渲染为准 | 试点报告中显式声明基准来源 |
| R-2 | AI 看图误判（假阳/假阴） | T05 | 数值优先+对照表驱动，视觉模型只作辅助 | T05 AC-3 通过 |
| R-3 | ADR 0016 补债范围蔓延 | T07 | 只做"完整放入+登记"，不做规则二次创作 | 70 条落地即关 |
| R-4 | 技能并入后上下文膨胀 | T08 | references 按需加载+行数上限 | T08 AC-1 完成 |
| R-5 | P1 失败导致 M2-M4 重估 | T04→全部 | 失败回 build-spec 重估，T05-T08 暂停铺开 | P1 判定出具 |
| R-6 | wh-review broker 超时硬编码 120s | 全部审查环节 | 长期修复建议已记录（超时配置化）；当前用注入式 20min | workflowhub 信任配置支持超时项 |
| R-7 | 后台子代理宿主不稳定（本环境 6/6 失败，前台 5/5 成功） | 各任务调研环节 | 重活默认前台子代理执行 | 宿主修复后解除 |

## 8. 验收与度量（六指标统一口径）

| 指标 | 定义 | 测量方式 |
|---|---|---|
| 返工轮次 | 交付→验收驳回→再交付 的完整往返次数 | 过程日志 |
| 缺陷数 | 按 CRITICAL/MODERATE/MINOR 分级计数 | 缺陷清单 |
| 人工介入小时 | 用户在任务上的累计人工时间 | 计时记录 |
| 验收确认次数 | 用户最终放行确认次数（新链路=最终 MINOR 容忍清单确认；**B0 现状流程的等价物=用户每轮验收结论次数**，两侧都记原始事件流，对照时按"验收往返次数"对齐） | 确认记录 |
| 提取覆盖率 | 设计稿组件被提取比例（B0 无提取器，记 N/A+原因） | design-extract.v1 |
| 视觉比对差异 | 9 维比对结果（B0 侧用截图+人工评估记录替代，标注口径差异） | visual-diff-report.v1 |

**最小度量契约（本 PRD 直接固化，B0 即用，不等后续任务）**：①缺陷去重单位=一个独立可见问题（同根因多处表现算一个，不同表现算多个）；②轮次边界=一次"交付声明"到一次"验收结论"为一轮；③B0 临时分级标尺：CRITICAL=功能不可用/布局崩坏，MODERATE=明显视觉偏差但可用，MINOR=细微偏差；T05 固化正式标尺后在试点报告中标注 B0→正式标尺的映射。

对照实验协议（唯一权威版）见方案 §8：B0 现状流程可读源码 / P1-P2 实现侧禁读源码（提取器豁免）/ T08 历史第三参照 / 视觉基准以产物渲染为准。

## 9. 移交与使用说明

1. **逐任务执行**：按波次取任务卡 → 在 workflowhub 为该任务建 task → make-decision 轻量确认本卡（引用母任务 decision-log，不重开方向）→ build-spec 产出该任务 spec（本卡 FR/AC 为骨架，战雾项在该任务固化）→ build-plan → build-code → verify-code。
2. **顺序红线**：T01 必须先于一切改造完成；T04 失败则 T05-T08 暂停；T09 依赖全部建设完成。
3. **素材直达**：任务卡"复用素材索引"列可直接打开对应文件，不必重新调研。
4. **本 PRD 的维护**：任务执行中发现 PRD 与现实冲突，在那个任务内记录并修复，不回改母任务 decision-log（方向变更才回母任务）。

## 附录 A：23 项决策 → 任务映射

| 决策 | 内容 | 承接任务 |
|---|---|---|
| #1 | 前端技术栈 React/Next.js；react-best-practices 按 ADR 0016 完整放入 | T07 |
| #2 | 设计源形态：可渲染设计源为主（双源交叉主模式） | T03 |
| #3 | 视觉模型：perceive 多模态+diff 双轨 | T05 |
| #4 | 改造深度：全链路（节奏由 #13 修订） | 全部 |
| #5 | 技能形态：3 新技能+扩展 8 个+按类混合移植 | T03/T05/T07/T08 |
| #6 | 验收标准：对照矩阵全绿+MINOR 容忍清单 | T05/T06/T09 |
| #7 | 完成声明边界：缺视觉证据=incomplete+原因 | T05/T06 |
| #8 | 无稿任务：build-spec 产出自建设计稿，统一链路 | T10 |
| #9 | schema：3 个都要+Design.md/Experience.md 中心制 | T02/T03/T05 |
| #10 | 提取器形态：tools/cli+agent-browser | T03 |
| #11 | 试点：P1 薄闭环（M1 后）+P2 全链路（M4 后），均可证伪 | T04/T09 |
| #12 | 派发约束正名：按 F5/F11 登记为已证明边界 | T06 |
| #13 | 实施节奏：M1+P1 薄闭环先行试点再铺开 | T03/T04 |
| #14 | 低质量输入：LOW_FIDELITY/质量分<0.8 → 人工确认点 | T03 |
| #15 | 设计 owner 缺省=用户本人 | T02（契约）/全部 |
| #16 | 两文件回写：任务内即时回写（owner 确认后） | T06/T08 |
| #17 | 缺陷稿处理：照抄+缺陷清单交用户裁决 | T05/T06 |
| #18 | 分级标准归属：固化在 ui-visual-fidelity 技能 | T05 |
| #19 | 基线范围：SimulationBoard + SimWorkbench 两页 | T01/T09 |
| #20 | 基线载体：Next.js 目标仓；实现侧禁读设计稿源码 | T01/T09 |
| #21 | B0 基线真跑 | T01 |
| #22 | 工程质量落点：扩展 frontend-component-quality | T08 |
| #23 | 违规语义：性能/组件规范违反=记事实交 owner 裁决 | T06/T08 |

## 附录 B：素材文件索引

- `decision-log.md`——方向与决策唯一事实来源
- `evidence/frontend-capability-upgrade-plan-v2.md`——方案 v3（§8 含对照实验唯一权威协议）
- `evidence/p0-deep/`——12 个 P0 技能规则级笔记（T07/T08 的直接施工单）
- `evidence/research-website-skills.md`——124 技能分类全表
- `evidence/pilot-baseline-design.md`——设计稿项目摸底（T01/T09 用）
- `evidence/engineering-quality-integration.md`——四维度落点矩阵（T08 用）
- `evidence/workflowhub-gap-analysis.md`——9 个能力缺口
- `ui-frontend-workflow-handbook.md`——方法论手册（通用版）
- 审查证据：`~/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-capability-20260904/quality/reviews/`
