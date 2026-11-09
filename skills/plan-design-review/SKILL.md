---
name: plan-design-review
description: Report-only UI design lens for information architecture, states, accessibility, and responsive behavior.
---

# plan-design-review

Source: adapted from the project design review baseline. Mode: `advisory`；证据级按本次真实输入声明。
Use this lens for build-plan's actual UI scope and build-prd's conditional design material. Review the supplied journey, design sources and real previews within the existing merged document review; findings join that review instead of creating another review point.

UI 适用时，先读 `skills/project-norm-init/SKILL.md` 的「规范职责」，再按本次审查范围读取下列具体来源。路径相对目标项目根；八类不是强制八文件，同职责已有等价实质源时复用：

- ①领域语义：WorkflowHub 的 `GLOSSARY.md`；宿主使用自己的词义源，PaperBuilder 为 `GLOSSARY.md`。
- ②视觉设计系统：`specs/design/design.md`；精确值仍引用现 token、主题或 Figma 变量。
- ③组件及设计代码对应：`specs/design/components.md`；独立工程正文确需时读 `specs/frontend/components.md`，否则读 `specs/frontend/frontend.md`。
- ④布局与场景：`specs/design/layouts.md`；独立工程正文确需时读 `specs/frontend/layouts.md`，否则读 `specs/frontend/frontend.md`。
- ⑤通用交互：`specs/design/interaction.md`；控件内合同引用组件源。
- ⑥前端工程：`specs/frontend/frontend.md`，配置、架构和 API 保原来源。
- ⑦内容与设计工艺：`specs/design/craft.md`，词义和值引用原源。
- ⑧质量判据：确需独立正文时读 `specs/design/quality.md`；工程/运行共用 `specs/frontend/ui-quality.md`。

以 `skills/project-norm-init/SKILL.md` 的「规范职责」表为准，本处路径随表更新。逐类核实际路径/稳定节、version/作用域、原 owner、真实 consumer 与适用性；缺源、过期或未核分别沿该入口的 missing/stale/unknown 写法给影响与承接者。只读到路径不等于已调用来源方法或观察到页面；审查只据实际提供的源与预览。

## Check

1. Identify primary user journey, information hierarchy, and interaction states.
2. Check empty, loading, error, and recovery states.
3. Check accessible names, focus order, contrast intent, and keyboard paths.
4. Check responsive constraints and component consistency.
5. **Evidence gap**: mark missing UI evidence as a packet gap rather than guessing visuals.

先声明证据级：静态图只支持设计意图；静态代码/file-only 只能核源码与缺证据，交互和视觉运行项保持未验证；实际打开的 HTML/CSS/原生 JS 静态页面属于可交互原型；file-only 指只看源码，不指无需框架。可交互原型按真实浏览器操作范围判断；生产页还须真实权限/数据条件。未参与实现的独立审查者逐面读源、运行、记录；适用缺证据不当通过，禁止总分吞未知。浏览器沿 `skills/isolated-browser-qa/SKILL.md`，不另起引擎/登录链。

页面模式沿[页面审计判据](../frontend-testing/references/page-audit.md)逐项记录，必要时用[形状校验器](../frontend-testing/scripts/check-page-audit.mjs)核结构；设计模式按本节原维度和实际证据执行。

### 怎样核当前控件的语义？

独立 reviewer 在普通八维审查中，从任务路径和适用原规则选出具名对象。
先判断它实际表达导航、选择、展开、操作还是静态说明，再列出需要核的
role、名称、label 关联及 current/selected/expanded/disabled 等状态。
这里只决定采什么；属性何时适用、值应是什么仍回原专业源与任务，
静态说明不因文字有先后就必须变成导航。无适用属性时说明依据。

在同一隔离会话实际到达相关状态，取对象的 AX 名称/role 与 DOM 属性，
执行任务中的状态变化后再次取同一对象，逐项对照预期与原始结果。
下面复用 Ego 的已有只读 CDP API；page 必须是网关本次 owned page，
targets 由当前对象的实际源码/DOM确定，不接用户浏览器或另开会话。
每项只含本次审查用的公开 key 和内存 selector。采集前按任务许可选定
publicNames/publicRoles/publicIds；这些 Set 仅含本次必要、可公开的值，
不得由采回的内容自动扩充。以下白名单再按实际语义缩到适用属性：

```js
const stateAttrs = ['aria-current', 'aria-selected', 'aria-expanded',
  'aria-disabled', 'disabled'];
const relationAttrs = ['aria-labelledby', 'aria-describedby', 'for'];
const stateValues = new Set(['', 'true', 'false', 'mixed', 'page', 'step',
  'location', 'date', 'time', 'undefined']);
const observations = [];
for (const { key, selector } of targets) {
  const { root } = await page.cdp('DOM.getDocument', { depth: 0 });
  const { nodeId } = await page.cdp('DOM.querySelector', {
    nodeId: root.nodeId, selector,
  });
  if (!nodeId) throw new Error('ELEMENT_NOT_FOUND');
  const { attributes } = await page.cdp('DOM.getAttributes', { nodeId });
  const attrs = new Map();
  for (let i = 0; i < attributes.length; i += 2)
    attrs.set(attributes[i], attributes[i + 1]);
  const states = Object.fromEntries(stateAttrs.map(a => [a,
    !attrs.has(a) ? { present: false } : { present: true,
      value: stateValues.has(attrs.get(a)) ? attrs.get(a) : '[redacted]' }]));
  const relations = Object.fromEntries(relationAttrs.map(a => [a,
    !attrs.has(a) ? { present: false } : { present: true,
      ids: attrs.get(a).split(/\s+/).filter(Boolean)
        .map(id => publicIds.has(id) ? id : '[redacted]') }]));
  const { nodes } = await page.cdp('Accessibility.getPartialAXTree', {
    nodeId, fetchRelatives: false,
  });
  const has = (o, k) => o != null && Object.hasOwn(o, k);
  const pick = (o, k, allowed) => {
    if (!has(o, k)) return { present: false };
    const v = o[k];
    const visible = v === null || v === '' || allowed.has(v);
    return { present: true, redacted: !visible,
      ...(visible ? { value: v } : {}) };
  };
  const sourceTypes = new Set(['attribute', 'implicit', 'style', 'contents',
    'placeholder', 'relatedElement']);
  const nativeSources = new Set(['description', 'figcaption', 'label',
    'labelfor', 'labelwrapped', 'legend', 'rubyannotation', 'tablecaption',
    'title', 'other']);
  const ax = nodes.filter(n => n.backendDOMNodeId !== undefined).map(n => ({
    ignored: { present: has(n, 'ignored'), known: typeof n.ignored === 'boolean',
      ...(typeof n.ignored === 'boolean' ? { value: n.ignored } : {}) },
    role: { present: has(n, 'role'), field: pick(n.role, 'value', publicRoles) },
    name: { present: has(n, 'name'), field: pick(n.name, 'value', publicNames) },
    nameSources: !has(n.name, 'sources') ? { present: false } : {
      present: true, array: Array.isArray(n.name.sources),
      ...(n.name.sources === null ? { value: null } : {}),
      ...(Array.isArray(n.name.sources) ? { items: n.name.sources.map(s => ({
        type: pick(s, 'type', sourceTypes),
        nativeSource: pick(s, 'nativeSource', nativeSources),
      })) } : {}),
    },
  }));
  observations.push({ key, states, relations, ax });
}
```

完整 attributes/nodes 只在内存读取，不打印、不落盘。只保存上述已选、
脱敏 observations；不保 style/data/value/token、SDK/Space/target 元数据。
字段存在、空值/空数组与脱敏分别保留；ignored 仅布尔值为已知，
缺失或非布尔值保未知，不保存 ignoredReasons。name 来源的 type 与
nativeSource 分开投影，枚举回协议；不将缺值/未知强转 false。需更细 AX 状态或
名称关系时，按适用规则追加该字段的白名单投影，不保存整节点。关系
有脱敏/未解析时只保该面未证，回源码或获准 label 节点核关联，不能
因此判关联不存在。显式 role 未提供时仍核原生元素/AX 的实际语义。

raw CDP 会使旧交互 refs 失效。每次采集后先重新 snapshot，取得当前
refs/selector 再执行状态操作；操作后等待可观察状态，重新取 document
并定位，不复用旧 nodeId。原始接口失败保原失败，不补成空属性集合。
将状态、动作、适用条款、最小实际字段及脱敏/未测面交回原审查记录。
其它已选引擎用其现有只读接口，不切引擎或猜可访问名。现 page-audit
的 a11y normalizer 只保 role/name/focusable，不含状态属性不证明属性
不存在或正确；以上补该观察面，不改注册脚本、采集器或报告 schema。

AX 字段与命名来源类型按[CDP Accessibility 协议](https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/pdl/domains/Accessibility.pdl)读取；协议可读不代已安装浏览器实测。

源码可确定的标记/关联与实际 DOM 的状态同步分别下结论，真人读屏、
完整键盘路径另保覆盖；缺真人条件不免除前两项。只对语义适用且证据
支持的偏差给 finding，允许零 finding 或有据异议；缺节点、读取失败、
尚未到达状态保原失败及影响，不能算属性缺失或通过。采集只是事实，
仍由独立 reviewer 解释用户影响，不以自动输出代八维判断。

八维分别判，逐维写输入、观察、证据与未覆盖项：

- **业务任务**：任务/对象/许可/危险后果与完成信号是否真实一致，发出、等待、生效、失败、未知分开。
- **IA 导航**：实际页面的入口、区域关系、阅读顺序、返回与完整任务路径；按源关系核整页组合的任务作用，有稿列入口映射与新增点击成本，无稿备选对应同一完整任务及待确认清单。
- **交互状态**：逐状态与异步序列观察，含取消、重复、迟到与部分成功；未知只查询，不自动重发。
- **内容数据**：fixture边界、实际数据/缺值、长文/大数完整值可达；不得补零伪造已知。
- **视觉规范**：精确值回原 token/字体/布局源。同页原稿忠实度、
  现有产品视觉语汇的一致性、本次原创方案合理性分别判断。
  无同页稿只使同页像素还原不适用；已有产品仍须实际查看适用
  产品参考、对应结构与当前渲染，按来源用途比较区域组合、层级
  和密度语境，说明差异对任务的影响。缺实际观察只保该面未覆盖；
  token/组件复用不能替代此判断。源缺陷与批准偏差分别保留，
  修改需原owner决定。
- **响应式布局**：任务指定三宽与具名高度，缩放、局部滚动、浮层、压力内容；重排后的区域关系仍须服务同一完整任务，几何可容纳不等于组合合理；组件/布局实质检查调用 `skills/frontend-component-quality/SKILL.md`，不复制第二规范。
- **无障碍**：可访问名、标签、关闭路径、键盘、焦点顺序与返回、对比和reduced motion实际证据；截图和自动分数不代辅助技术/真人测试。
- **真实代码交接**：可编辑静态源码与产物、真实打开或普通静态服务、入口/依赖/状态/样式owner、mock限制及正式工程接线步骤。无构建的原生 HTML 不要求 npm/build；存在作者预编译时另核转换工具成本和产物，不能要求消费者装原工程或把作者构建代浏览器验收。

每次审查实际读取 `skills/ui-copy-discipline/SKILL.md`；有稿保原风格，无稿先用布局/主操作表达，保字段标签、可访问名、危险后果。ui-gate只引用七面并逐面附实际落点：依据回来源/实测；内容回任务/数据；风格回适用原稿或现有产品参考；视觉回渲染几何；可编辑性回源码；交互回动作序列；用户测试回真实当前展示与真实答复。没有真人可用性测试明确未做，不整体复制ui-gate或以review.json作新权威。

非法组合必须交真实反例输入给审查者并记录能否识别，不用列词冒执行：常驻工作台进Dialog/Drawer；header slot丢可见关闭或可访问标题；无onClose加载壳假可关；同区域两个主操作；缺值填0；长值只有摘要且完整值不可达；局部横向滚动撑破document；多浮层焦点未验却报通过；同名 token假同源；外部色值/字体/断点替原源；底层资产复用与页面组合的实际用途不符。反例依据回任务和组件/布局源，缺条件逐项未验证。

实际反例识别时，主会话保留预期 oracle，审查者只收到真实任务、
适用来源、待审产物及通用方法。方法正文与实际 brief/附件均不泄露
样本的预期答案、失败身份或分类；按证据接受不同结论及有据反驳。
保留审查者本人实际打开与观察的范围，不把输入已提供当已经看过。

## Result

Return UI-specific evidence and findings only when UI scope is present.

每条finding保编号、位置、依据、后果、建议、严重度、置信度；严重度按用户影响、置信度按实际证据分别判断。回原作者修复后只复验受影响项，保原finding/失败和独立复验原件；未修或未验保持未完成。当前展示、用户真实答复、批准偏差各指实际原件，审查者不代批准；provider失败保持unavailable，不填空findings冒通过。

正向审查只对有据缺陷提出 finding；无有据缺陷允许零 finding，
同时保实际覆盖、缺失输入与限制，零 finding 不补齐未测面。
方法变更的验证分别记录实际调用/源观察、增量方法的消费位置、
当次判断与产物结果；多项同时变化时保因果限制，不把单次结果
外推为方法普遍有效或单独归因于方法文字。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。

来源权威：[catalog](../catalog.yaml#skills.plan-design-review)；本便携小卡非权威；单技能副本缺catalog时向来源维护者取登记。来源：garrytan/gstack plan-design-review/SKILL.md。

## 同仓方法依赖

`skills/spec-specify/SKILL.md`；按上文实际条件读取，搬运时需同时提供或由调用者提供可读原件。
