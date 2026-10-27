---
name: design-source-extraction
description: 设计源准备后、实施前提炼可回读的机器JSON；来源、规范或结构变化时重新提炼，按缺项定向限制依赖步骤。
version: 1.0.0
---

# Design Source Extraction

给 build-plan 设计源准备读者、build-code 实施者与 build-code 终末 独立检查者使用。输入是当前 task、已确认范围、设计来源和适用规范；输出为任务证据区单份 `design-source-extraction.json`。不生成人读视图；需要查看时临时只读查询该 JSON，不保存第二份派生文件。

## 执行与边界

1. 设计源准备后、实施开工前执行一次；先消费 `skills/design-source-readiness/SKILL.md` 的实际来源与缺口，不重复生成 Screen Read Map。沿 `skills/project-norm-init/SKILL.md` 规范职责取目标项目八类来源：领域、视觉、组件、布局、交互、工程、内容、质量。每类记录实际路径/章节或已有稳定锚、版本、作用域、owner、consumer；不适用写具体理由，缺源写影响和提供者。现有专业源优先，不把旧 Design.md/Experience.md 设为必需文件。
2. 先探测可达性，再在正式采集前冻结页 × 状态 × 视口 × 元素集 × 规范类别清单、关键项与冲突率阈值。探测不计覆盖。冻结后范围变化须记录原因并重新冻结，不能靠缩分母凑比例。
3. 浏览器采集只从 `skills/isolated-browser-qa/SKILL.md` 的隔离入口执行已登记的固定脚本标识；未登记标识执行前拒绝。页面操作保持只读，页面写入与网络请求尝试必须被拒且有负向原件。外层隔离链失败停该路径，保原错误，不换直连；默认复用已开ego工作区，获取失败明确报错，不启动其它浏览器、不隐式回退。caller显式选择其它引擎时才沿该入口原生命周期合同执行，不能用回退绕过复用限制。
4. 逐项填下述契约，事实与推断、渲染值与源码声明分开。不存在、未渲染、受限 iframe 或工具失败留原错误与影响；不默认填值，不从类名猜像素，不用截图补 DOM。完成条件是冻结清单每项有观察或具名缺口、原命令与证据能回读；不是文件存在或 exit 0。
5. 下游先检查 `freshness`、五类输入与低保真裁决，仅停止被 `blocks` / `blocked_scope` 点名的实施步骤。对照与回填消费 `references/isolated-consumption.md`（实施消费时读取）；规范对账消费 `references/norm-alignment.md`（逐条对齐时读取）。这些后续能力未交付时记 unavailable，不把契约当采集/对账已运行。

## 唯一 JSON 字段契约

`validateExtraction(doc)` 是采集器的契约校验函数（由采集实现提供）；本方法定义字段与语义，不提供第二套 validator。所有下列顶层字段必需，空数组只能表达确实无项；未观察用明确 unknown 与原因，不能用空字符串、0、null 冒实测值。

| 字段 | 内容 |
| --- | --- |
| `source` | 来源 `type`、`ref`（路径/URL）、`version`、`scope`、`owner`、`consumer`；多来源放 `sources[]` 分列，未知版本明写 unknown |
| `scope` | `pages`、`states`、`viewports`、`elements`、`norm_categories`、`checklist[]`、`critical[]`、`frozen_at`、`conflict_threshold`；scope.checklist 为正式分母 |
| `norm_basis` | 规范集 `id`、`version`、逐类 `entries[]`；每项含 category、ref、anchor/section、version、scope、owner、consumer 或具名不适用原因 |
| `inputs` | 五类必要输入，路径与缺项规则见下节 |
| `items` | 元素/属性事实、四态与证据，见下节 |
| `comparison` | 从 items 派生的逐项对照数组，引用 item_ref、design_value、implementation_value、state、evidence_ref；初始未实现保持 missing，不报通过 |
| `gaps` | 逐缺项的 input/item 路径、reason、blocks、provider；为输入缺口的汇总，原输入仍是权威 |
| `norm_defects` | 规范自身缺失/矛盾/过期：norm_ref、reason、affected_items、owner、next_action；无项明确空数组 |
| `coverage` | denominator、collected、missing、critical_missing、ratio、scope_ref；仅按冻结 scope.checklist 复算，探测不得计入 |
| `commands` | 每条 cwd、argv 或原始 shell、exit_code、signal、timeout/cancel、output_ref；保实际失败，ref 必须可回读 |
| `freshness` | generated_at、source_versions、norm_versions、structure_ref、status、reasons；按下节与当前来源比较 |
| `failures` | category、original_error、command_ref、affected_scope；工具失败与低保真分列，不返回伪空成功 |
| `low_fidelity` | triggered、reasons、ruling、blocked_scope；具体行为见下节 |
| `scoring` | status=unavailable，reason=本次不实现数值评分；不因评分缺失阻塞输入齐全的实施 |
| `pending_review` | 待规范 owner 判断的 item/norm 引用、问题与 owner；不自动晋升规范 |

### 五类输入与定向阻断

五个固定键是 `design_source`（设计来源）、`target_elements`（目标元素）、`properties`（属性数值）、`states`（状态）、`acceptance_points`（验收点）。每项都有 `status`、`value` 或 `reason`、`source_ref` 与 `blocks`。

具体路径为 `inputs.design_source.status`、`inputs.design_source.blocks`；其它四键同样位于 `inputs.<key>.status` / `inputs.<key>.blocks`。旧需求短写的 `missing.blocks` 就是缺项输入对象的 blocks，不是另一个顶层 missing 对象。

- 有源输入：status=present，value 与 source_ref 有实际内容，blocks 可为空。
- 缺输入：status=missing，reason 与 blocks 必须非空，value 不填伪默认值；blocks 用稳定元素/状态/实施步骤 ID 点名，例如 `implement:hero:mobile`。只停这些步骤，其余继续。
- 相互矛盾：status=conflict，保双方 source_ref 与值、原因及受影响 blocks，交原 owner。
- 待人判断：status=pending_review，列问题、owner 与 blocks，不能当批准。

具名完整样例见下方「文档契约样例」；它是契约示例，不是实测证据。

反例：删去缺项的 blocks、写空 blocks、缺 status 均无效；缺 states 只影响依赖该状态的步骤；缺 acceptance_points 点名对应验收与实施步骤。不能因一个缺口停止无关步骤。

### items 与四态

每项含 `id`、`page`、`state`、`viewport`、`locator`（tree_ref＋business_attributes 身份）、`property`、`norm_anchor`、`structure`、`rendered`、`declared`、`inference`、`norm_state`、`evidence_kind`、`evidence_ref`、`reason`。items.state 仅为页面状态，四态只用 items.norm_state；comparison.state 是批准的对照状态字段。同元素同属性的结构事实、声明值与渲染值分别回读，差异要写原因；未知事实保 unknown 与影响，不推断为缺失。

`norm_state` 唯一集合为 `present | missing | conflict | pending_review`，分别表示已有、缺、冲突、待议；不是质量分数或规范批准。`norm_defects` 独立记录规范待修，不能拿规范错误覆盖页面事实。规范引用有稳定锚用稳定锚，没有则保真实章节及缺锚事实，不编锚。

`evidence_kind` 为 `rendered | declared | screenshot`；截图只提供视觉辅助，`evidence_kind=screenshot` 的项不得填 rendered 实测值，写 {"status":"unknown","reason":"仅截图，无渲染测量"}。源码声明只能进 declared，不能冒 rendered。Figma 无合法源时同时写 `source.figma.status="unavailable"`、`source.figma.unavailable=true` 和非空 reason；缺一或矛盾即契约无效。两字段是同一不可用事实，没有各自生命周期、优先级或独立裁决。合法本地Figma导出用source.type=figma_export、source.figma.status=present及unavailable=false，并提供下述授权主张和资产绑定；不新增available枚举。无合法源的原分支仍是unavailable，不因裁决approved变为可用。不可用时列未覆盖项及影响，不能由截图反推 API/语义。

### 合法导出与图片辅助输入

原页面路径用source.type=runnable_page（旧未写type的页面plan沿此兼容）。合法Figma导出用figma_export，截图辅助用screenshot；未知类型明确拒绝。source.ref是已允许读取的本地根；source.asset给根内相对ref与sha256。source.authorization给status=present、根内ref/sha256、owner/scope；该原件必须声明access=read、同asset_sha256与相同owner/scope。它是调用者可回读的权限主张，不证明远端账号权限、Figma真实授权或复制分发权；授权缺失、错scope/hash/路径越界拒绝，不默认合法。

figma_export读取标准导出document树，冻结entry.figma_node_id必须唯一；明确支持节点结构id/type/name/characters、style.fontSize/fontWeight/lineHeightPx或absoluteBoundingBox.width/height。缺节点/属性或坏JSON明确失败，不按节点名猜值。事实进items.structure/declared，rendered保持unknown与影响；comparison.design_basis=declared且design_value来自原声明，不把设计声明当浏览器实测。授权真实Figma源/API仍未取得，当前只验证受控合法导出合同。

screenshot当前明确支持合法非交错PNG：核容器chunk/CRC/压缩scanline完整性，尺寸仅取IHDR；不识别图像内容，不把图片宽高当元素box或浏览器viewport。资产ref/hash/权限主张回读，结构、声明、rendered未观察均unknown；comparison.design_basis=unknown、design_value=unknown、state=missing。截图可另外提供source.auxiliary_observations（根内ref/sha256），观察原件绑定asset_sha256、observer、method=visual_inference、limits与observations；entry.screenshot_observation_id唯一匹配。视觉观察可给组件形状或相对布局提示，进items.inference=present并保原观察ref/hash/限制；它不证明DOM、API、computed或精确元素尺寸。缺观察不自造；显式提供但错asset/ID/内容立即拒绝，不静默退为metadata。

两种非浏览器事实都不计真实rendered coverage，原冻结分母不删；缺关键观察仍走具名低保真/裁决，不用合法资产存在冒可实施。

原runnable comparison.design_basis=rendered，声明与渲染逐项分列；同单位数值及明确hex/rgb等价归一，未知CSS token/单位转换不硬判冲突。已证不等数/固定scope.checklist分母严格大于冻结conflict_threshold才触发低保真；等于不触发。item.reason保双方值和未取得的实际cascade原因，comparison仍消费rendered。规范待议/工具失败不算已证声明冲突，不用低冲突比例冒全部已比较。

### 新鲜度与重新提炼

`freshness.source_versions` 按来源 ref 逐一记版本；`norm_versions` 按规范 ref 分列；`structure_ref` 指向本次结构事实。当前来源版本、规范版本或页面结构与生成时任一变化，`freshness.status=stale`，reasons 点名变化来源及受影响项；停止依赖这些旧值的步骤，从本方法第1步重新提炼。缺当前比较材料写 unknown，缺应有来源写 missing，不声称 current。来源可核且未变才记 current。

可重放过期案例：保持 JSON 不动，把同一来源当前 version 从 v1 改为 v2，比较应为 stale 且触发重提炼；规范版本变化、结构变化同理。无关来源未变的步骤继续。新任务复用本方法和字段，重新获取自身输入，不直接复用旧任务明细。

### 低保真裁决

`low_fidelity.triggered` 为 boolean；任一必要输入缺失且不能有源补证、关键项缺失、或冲突率超过采集前冻结阈值时为 true，reasons 点名真实条件。工具失败只进 failures，不以失败计算低保真。

`low_fidelity.ruling` 只取 `approved | pending | rejected | no_response`。触发后取得本次设计 owner 真实答复：approved 沿答复批准范围实施；pending 等待裁决；rejected 停被拒范围；no_response 保未答。这后三种值的 blocked_scope 必须非空，所列实施不得启动；未答、拒绝都不是同意。未触发时可记 approved 并注明不适用原因，不能伪称收到人类批准。评分子项始终 unavailable，与本非数值裁决分开。

## 原件、引用与规范边界

产物进入当前任务证据区，由宿主现有安全写入/任务接口保存；宿主路径由认证 task 决定，不把示例 specs 路径当第二事实库。spec 验收对象 sources 引用产物，Phase 材料导航指向原件，机读依赖登记归现有 owner。可复用事实仅在规范 owner 确认后由其进入项目规范；C04 不晋升规范、不修改项目规范正文。

oracle/证据/完成解释读取目标项目验收源；本项目为 `specs/acceptance/acceptance.md`、`evidence.md`、`done.md`，保 fixture/静态检查/真实执行的覆盖区别。脚本参数与错误沿目标项目接口源；本项目为 `specs/api/contract.md` 和实际 task/runtime API。当前正文不新增 CLI 参数，接口实现留采集器，原始错误不吞成默认成功。

## 外部工具与维护

| 工具 | 固定参考版本 | 采用边界 | 权利与维护 |
| --- | --- | --- | --- |
| ego lite | 0.6.0.16 | 默认复用已开ego；缺装/获取失败明确error且不隐式回退 | 原工具维护者持权；许可/操作能力沿入口及任务已核原件，未核部分 unknown |
| agent-browser | 0.36.0 | caller显式选择的已有隔离入口引擎；不是默认reuse失败的自动备用 | 原工具维护者持权；沿入口来源/许可原件，不从相邻许可类推 |
| style-ref-gen | 未采用 | 许可未声明，不复制、安装或分发 | 需真实权利 owner 提供许可后重新决策；不是当前依赖 |

维护检查由采用登记owner（当前维护者用户）在采用前、迭代需求/故障涉及上游或维护到期时沿原reuse-registry/catalog入口执行：取本机version与官方release/changelog，分别比较app、CLI、SDK各自同轴候选和具体适用差异，留原命令/URL/日期/原始失败与不升级理由。查询失败保持候选unknown，不能写无更新或自动切工具；受控不可达负例明确不冒实时上游宕机。不新建维护程序/后台账本。

本表记录计划固定参考，不证明当前安装版本、归档commit绑定或许可已核。实际版本、命令、失败与覆盖留任务原件。升级先报告差异并取得用户决定，不静默升级；本方法由采用登记 owner 维护，替代者经独立审查承接真实 consumer 后退出。

## 写作与同仓方法依赖

修改本方法先读取 `skills/spec-specify/SKILL.md`「技能写作规范（WR001）」。本技能依赖 `skills/project-norm-init`、`skills/design-source-readiness`、`skills/isolated-browser-qa`、`skills/spec-specify`；搬运时一起提供或由宿主提供可读等价源。来源权威回 `skills/catalog.yaml` 同名条目，不复制外部工具原文或引入新状态平台。

## 文档契约样例

以下唯一标识JSON块为文档oracle输入，不是采集证据或生产validator。base为契约局部实例，仅列本P1受测字段；完整产物仍须上表全部顶层字段。missing_cases分别给缺设计来源、缺状态、缺验收点的输入与点名阻断/继续步骤；freshness_cases给生成值、当前值与预期结果，unknown不得冒current；ruling_cases分别给四种本次裁决。测试变异只证明oracle识别坏样例，不证明生产拒绝、实际重新提炼或实施入口已执行。

<!-- c04-contract-examples -->
```json
{"base":{"source":{"figma":{"status":"unavailable","unavailable":true,"reason":"未取得合法Figma来源，未覆盖Figma语义"}},"scope":{"checklist":["hero:default:desktop:width:layout"],"frozen_at":"2026-10-25T00:00:00Z"},"inputs":{"design_source":{"status":"present","value":["design_source"],"source_ref":"task/spec#design_source","blocks":[]},"target_elements":{"status":"present","value":["target_elements"],"source_ref":"task/spec#target_elements","blocks":[]},"properties":{"status":"present","value":["properties"],"source_ref":"task/spec#properties","blocks":[]},"states":{"status":"present","value":["states"],"source_ref":"task/spec#states","blocks":[]},"acceptance_points":{"status":"present","value":["acceptance_points"],"source_ref":"task/spec#acceptance_points","blocks":[]}},"items":[{"id":"hero-width","locator":{"tree_ref":"main/hero","business_attributes":{"role":"hero"}},"structure":{"tag":"section"},"rendered":{"value":100,"unit":"px"},"declared":{"value":"100px"},"norm_state":"present","norm_anchor":"norm/layout#hero","evidence_kind":"rendered","evidence_ref":"example-only"}],"comparison":[{"item_ref":"hero-width","design_value":"100px","implementation_value":"unknown","state":"missing","evidence_ref":"example-only"}],"low_fidelity":{"triggered":false,"reasons":[],"ruling":"approved","blocked_scope":[]},"scoring":{"status":"unavailable","reason":"本次不实现数值评分"}},"missing_cases":[{"name":"missing-design_source","doc":{"source":{"figma":{"status":"unavailable","unavailable":true,"reason":"未取得合法Figma来源，未覆盖Figma语义"}},"scope":{"checklist":["hero:default:desktop:width:layout"],"frozen_at":"2026-10-25T00:00:00Z"},"inputs":{"design_source":{"status":"missing","reason":"未取得design_source","source_ref":"unknown","blocks":["implement:hero"]},"target_elements":{"status":"present","value":["target_elements"],"source_ref":"task/spec#target_elements","blocks":[]},"properties":{"status":"present","value":["properties"],"source_ref":"task/spec#properties","blocks":[]},"states":{"status":"present","value":["states"],"source_ref":"task/spec#states","blocks":[]},"acceptance_points":{"status":"present","value":["acceptance_points"],"source_ref":"task/spec#acceptance_points","blocks":[]}},"items":[{"id":"hero-width","locator":{"tree_ref":"main/hero","business_attributes":{"role":"hero"}},"structure":{"tag":"section"},"rendered":{"value":100,"unit":"px"},"declared":{"value":"100px"},"norm_state":"present","norm_anchor":"norm/layout#hero","evidence_kind":"rendered","evidence_ref":"example-only"}],"comparison":[{"item_ref":"hero-width","design_value":"100px","implementation_value":"unknown","state":"missing","evidence_ref":"example-only"}],"low_fidelity":{"triggered":false,"reasons":[],"ruling":"approved","blocked_scope":[]},"scoring":{"status":"unavailable","reason":"本次不实现数值评分"}},"expected":{"blocked":["implement:hero"],"continue":["implement:footer"]}},{"name":"missing-states","doc":{"source":{"figma":{"status":"unavailable","unavailable":true,"reason":"未取得合法Figma来源，未覆盖Figma语义"}},"scope":{"checklist":["hero:default:desktop:width:layout"],"frozen_at":"2026-10-25T00:00:00Z"},"inputs":{"design_source":{"status":"present","value":["design_source"],"source_ref":"task/spec#design_source","blocks":[]},"target_elements":{"status":"present","value":["target_elements"],"source_ref":"task/spec#target_elements","blocks":[]},"properties":{"status":"present","value":["properties"],"source_ref":"task/spec#properties","blocks":[]},"states":{"status":"missing","reason":"未取得states","source_ref":"unknown","blocks":["implement:hero"]},"acceptance_points":{"status":"present","value":["acceptance_points"],"source_ref":"task/spec#acceptance_points","blocks":[]}},"items":[{"id":"hero-width","locator":{"tree_ref":"main/hero","business_attributes":{"role":"hero"}},"structure":{"tag":"section"},"rendered":{"value":100,"unit":"px"},"declared":{"value":"100px"},"norm_state":"present","norm_anchor":"norm/layout#hero","evidence_kind":"rendered","evidence_ref":"example-only"}],"comparison":[{"item_ref":"hero-width","design_value":"100px","implementation_value":"unknown","state":"missing","evidence_ref":"example-only"}],"low_fidelity":{"triggered":false,"reasons":[],"ruling":"approved","blocked_scope":[]},"scoring":{"status":"unavailable","reason":"本次不实现数值评分"}},"expected":{"blocked":["implement:hero"],"continue":["implement:footer"]}},{"name":"missing-acceptance_points","doc":{"source":{"figma":{"status":"unavailable","unavailable":true,"reason":"未取得合法Figma来源，未覆盖Figma语义"}},"scope":{"checklist":["hero:default:desktop:width:layout"],"frozen_at":"2026-10-25T00:00:00Z"},"inputs":{"design_source":{"status":"present","value":["design_source"],"source_ref":"task/spec#design_source","blocks":[]},"target_elements":{"status":"present","value":["target_elements"],"source_ref":"task/spec#target_elements","blocks":[]},"properties":{"status":"present","value":["properties"],"source_ref":"task/spec#properties","blocks":[]},"states":{"status":"present","value":["states"],"source_ref":"task/spec#states","blocks":[]},"acceptance_points":{"status":"missing","reason":"未取得acceptance_points","source_ref":"unknown","blocks":["implement:hero"]}},"items":[{"id":"hero-width","locator":{"tree_ref":"main/hero","business_attributes":{"role":"hero"}},"structure":{"tag":"section"},"rendered":{"value":100,"unit":"px"},"declared":{"value":"100px"},"norm_state":"present","norm_anchor":"norm/layout#hero","evidence_kind":"rendered","evidence_ref":"example-only"}],"comparison":[{"item_ref":"hero-width","design_value":"100px","implementation_value":"unknown","state":"missing","evidence_ref":"example-only"}],"low_fidelity":{"triggered":false,"reasons":[],"ruling":"approved","blocked_scope":[]},"scoring":{"status":"unavailable","reason":"本次不实现数值评分"}},"expected":{"blocked":["implement:hero"],"continue":["implement:footer"]}}],"freshness_cases":[{"name":"source-version","generated":{"source_version":"v1","norm_version":"n1","structure_ref":"tree1"},"current":{"source_version":"v1-changed","norm_version":"n1","structure_ref":"tree1"},"expected":{"freshness":"stale","blocked":["implement:hero"],"continue":["implement:footer"],"reextract":true}},{"name":"norm-version","generated":{"source_version":"v1","norm_version":"n1","structure_ref":"tree1"},"current":{"source_version":"v1","norm_version":"n1-changed","structure_ref":"tree1"},"expected":{"freshness":"stale","blocked":["implement:hero"],"continue":["implement:footer"],"reextract":true}},{"name":"page-structure","generated":{"source_version":"v1","norm_version":"n1","structure_ref":"tree1"},"current":{"source_version":"v1","norm_version":"n1","structure_ref":"tree1-changed"},"expected":{"freshness":"stale","blocked":["implement:hero"],"continue":["implement:footer"],"reextract":true}},{"name":"unchanged","generated":{"source_version":"v1","norm_version":"n1","structure_ref":"tree1"},"current":{"source_version":"v1","norm_version":"n1","structure_ref":"tree1"},"expected":{"freshness":"current","blocked":[],"continue":["implement:footer"],"reextract":false}},{"name":"unknown-current","generated":{"source_version":"v1","norm_version":"n1","structure_ref":"tree1"},"current":{"norm_version":"n1","structure_ref":"tree1"},"expected":{"freshness":"unknown","blocked":["implement:hero"],"continue":["implement:footer"],"reextract":false}}],"ruling_cases":[{"name":"approved","doc":{"source":{"figma":{"status":"unavailable","unavailable":true,"reason":"未取得合法Figma来源，未覆盖Figma语义"}},"scope":{"checklist":["hero:default:desktop:width:layout"],"frozen_at":"2026-10-25T00:00:00Z"},"inputs":{"design_source":{"status":"present","value":["design_source"],"source_ref":"task/spec#design_source","blocks":[]},"target_elements":{"status":"present","value":["target_elements"],"source_ref":"task/spec#target_elements","blocks":[]},"properties":{"status":"present","value":["properties"],"source_ref":"task/spec#properties","blocks":[]},"states":{"status":"present","value":["states"],"source_ref":"task/spec#states","blocks":[]},"acceptance_points":{"status":"present","value":["acceptance_points"],"source_ref":"task/spec#acceptance_points","blocks":[]}},"items":[{"id":"hero-width","locator":{"tree_ref":"main/hero","business_attributes":{"role":"hero"}},"structure":{"tag":"section"},"rendered":{"value":100,"unit":"px"},"declared":{"value":"100px"},"norm_state":"present","norm_anchor":"norm/layout#hero","evidence_kind":"rendered","evidence_ref":"example-only"}],"comparison":[{"item_ref":"hero-width","design_value":"100px","implementation_value":"unknown","state":"missing","evidence_ref":"example-only"}],"low_fidelity":{"triggered":true,"reasons":["关键项缺失"],"ruling":"approved","blocked_scope":[]},"scoring":{"status":"unavailable","reason":"本次不实现数值评分"}},"expected":{"blocked":[],"continue":["implement:footer"]}},{"name":"pending","doc":{"source":{"figma":{"status":"unavailable","unavailable":true,"reason":"未取得合法Figma来源，未覆盖Figma语义"}},"scope":{"checklist":["hero:default:desktop:width:layout"],"frozen_at":"2026-10-25T00:00:00Z"},"inputs":{"design_source":{"status":"present","value":["design_source"],"source_ref":"task/spec#design_source","blocks":[]},"target_elements":{"status":"present","value":["target_elements"],"source_ref":"task/spec#target_elements","blocks":[]},"properties":{"status":"present","value":["properties"],"source_ref":"task/spec#properties","blocks":[]},"states":{"status":"present","value":["states"],"source_ref":"task/spec#states","blocks":[]},"acceptance_points":{"status":"present","value":["acceptance_points"],"source_ref":"task/spec#acceptance_points","blocks":[]}},"items":[{"id":"hero-width","locator":{"tree_ref":"main/hero","business_attributes":{"role":"hero"}},"structure":{"tag":"section"},"rendered":{"value":100,"unit":"px"},"declared":{"value":"100px"},"norm_state":"present","norm_anchor":"norm/layout#hero","evidence_kind":"rendered","evidence_ref":"example-only"}],"comparison":[{"item_ref":"hero-width","design_value":"100px","implementation_value":"unknown","state":"missing","evidence_ref":"example-only"}],"low_fidelity":{"triggered":true,"reasons":["关键项缺失"],"ruling":"pending","blocked_scope":["implement:hero"]},"scoring":{"status":"unavailable","reason":"本次不实现数值评分"}},"expected":{"blocked":["implement:hero"],"continue":["implement:footer"]}},{"name":"rejected","doc":{"source":{"figma":{"status":"unavailable","unavailable":true,"reason":"未取得合法Figma来源，未覆盖Figma语义"}},"scope":{"checklist":["hero:default:desktop:width:layout"],"frozen_at":"2026-10-25T00:00:00Z"},"inputs":{"design_source":{"status":"present","value":["design_source"],"source_ref":"task/spec#design_source","blocks":[]},"target_elements":{"status":"present","value":["target_elements"],"source_ref":"task/spec#target_elements","blocks":[]},"properties":{"status":"present","value":["properties"],"source_ref":"task/spec#properties","blocks":[]},"states":{"status":"present","value":["states"],"source_ref":"task/spec#states","blocks":[]},"acceptance_points":{"status":"present","value":["acceptance_points"],"source_ref":"task/spec#acceptance_points","blocks":[]}},"items":[{"id":"hero-width","locator":{"tree_ref":"main/hero","business_attributes":{"role":"hero"}},"structure":{"tag":"section"},"rendered":{"value":100,"unit":"px"},"declared":{"value":"100px"},"norm_state":"present","norm_anchor":"norm/layout#hero","evidence_kind":"rendered","evidence_ref":"example-only"}],"comparison":[{"item_ref":"hero-width","design_value":"100px","implementation_value":"unknown","state":"missing","evidence_ref":"example-only"}],"low_fidelity":{"triggered":true,"reasons":["关键项缺失"],"ruling":"rejected","blocked_scope":["implement:hero"]},"scoring":{"status":"unavailable","reason":"本次不实现数值评分"}},"expected":{"blocked":["implement:hero"],"continue":["implement:footer"]}},{"name":"no_response","doc":{"source":{"figma":{"status":"unavailable","unavailable":true,"reason":"未取得合法Figma来源，未覆盖Figma语义"}},"scope":{"checklist":["hero:default:desktop:width:layout"],"frozen_at":"2026-10-25T00:00:00Z"},"inputs":{"design_source":{"status":"present","value":["design_source"],"source_ref":"task/spec#design_source","blocks":[]},"target_elements":{"status":"present","value":["target_elements"],"source_ref":"task/spec#target_elements","blocks":[]},"properties":{"status":"present","value":["properties"],"source_ref":"task/spec#properties","blocks":[]},"states":{"status":"present","value":["states"],"source_ref":"task/spec#states","blocks":[]},"acceptance_points":{"status":"present","value":["acceptance_points"],"source_ref":"task/spec#acceptance_points","blocks":[]}},"items":[{"id":"hero-width","locator":{"tree_ref":"main/hero","business_attributes":{"role":"hero"}},"structure":{"tag":"section"},"rendered":{"value":100,"unit":"px"},"declared":{"value":"100px"},"norm_state":"present","norm_anchor":"norm/layout#hero","evidence_kind":"rendered","evidence_ref":"example-only"}],"comparison":[{"item_ref":"hero-width","design_value":"100px","implementation_value":"unknown","state":"missing","evidence_ref":"example-only"}],"low_fidelity":{"triggered":true,"reasons":["关键项缺失"],"ruling":"no_response","blocked_scope":["implement:hero"]},"scoring":{"status":"unavailable","reason":"本次不实现数值评分"}},"expected":{"blocked":["implement:hero"],"continue":["implement:footer"]}}]}
```
