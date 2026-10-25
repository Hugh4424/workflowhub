# 用规范逐条对齐页面事实

读者：采集后的对账作者、P5实施者与独立检查者。输入是可回读的提炼产物和本次明确选择的规范 basis；输出是同一事实的规范关系，不改测量值，不修改目标规范。本文是文档方法，没有运行函数、生产 validator 或评分器。

## 先固定两个输入

先读产物的 source、scope、freshness、failures、inputs、low_fidelity。来源未知与失败保持原语义，只停被 blocks/blocked_scope 或失败影响点名的步骤；未知不补默认值。记录原件引用与hash，保 items.id、原 rendered/declared/inference、原 evidence_ref/command_ref。后续对齐产物另存原任务证据，原采集件 immutable。

再逐类读原专业正文及其真实值源。basis记录 id、每件ref/hash/版本/owner/consumer、适用页面/状态/主题与规则节。版本/hash、设计批准、页面运行结果分开；不能把“本件存在”当已适用。规则优先使用稳定锚；无锚写真实章节和行号。读取范围写清已读、未读及原因，不宣八类全文都已验证。

## 八类职责与两套来源

类别是职责，不要求八个文件。以下是当前任务的具体导航；其它项目沿其原owner取同职责实质源。

| 类别 | PaperBuilder原源 | 第二套：project-norm-init/templates | 对齐边界 |
| --- | --- | --- | --- |
| 领域 | GLOSSARY.md，Language/Relationships | domain-semantics.md，领域词/关系 | 不从视觉或词名猜API、权限、业务执行 |
| 视觉 | specs/design/design.md，PB-DES-TOKENS | visual-design-system.md，角色与原值源 | 精确值从具名CSS/token取，不把Downloads/UI值升为PB应然值 |
| 组件 | specs/design/components.md，PB-COMP-OWNERS | components.md，组件清单与组合 | 同名/导入不证明同实例或真实复用；API回源码 |
| 布局 | specs/design/layouts.md，PB-LAYOUT-HIERARCHY/GROWTH | layouts.md，场景/增长与响应式 | 区域关系与精确几何分责；单视口不外推极值 |
| 交互 | specs/design/interaction.md，PB-INT-STATE/FOCUS | interaction.md，导航/反馈与取消 | 文字存在不证明键盘、焦点、取消或后台结果 |
| 工程 | specs/frontend/frontend.md，PB-FE-SOURCES | frontend-engineering.md，模块/生命周期 | 原型Tailwind不是目标项目工程事实，不推全局框架 |
| 内容 | specs/design/craft.md，PB-CRAFT-FACT-COPY | craft.md，状态/错误与出口 | 保留未知、失败、原身份及真实可用动作 |
| 质量 | specs/design/quality.md，PB-QUALITY-ORACLES；specs/frontend/ui-quality.md，PB-UI-QUALITY-LAYERS | quality.md，可观察判据/检查层次 | 设计判据与工程执行分权；fixture不冒真实页面 |

PaperBuilder九源对应八类，质量双源分权；模板八UI件之外的acceptance/api-contract/backend-architecture不并入此分母。模板是未实例化样张：占位的产品owner、颜色、字号、布局值都不是产品规则。可对账其已写出的来源/分责/未知处理等方法条款；缺实际值源时写 pending_review 与提供者，不能凭 `<font>` 编产品值。粒度仍不足时按P4/T008的OI-013交原规范owner，不默缩为只跑一套。

## 对每项找规则，先核适用再判值

1. 从原 item 定位页面、状态、视口、元素、属性、证据强度。声明、实测、推断分字段；例如 `#06080d` 的真实CSS声明与 `rgb(6,8,13)` 的渲染是两份证据，不能用前者填后者。
2. 从本basis选具名规则，记录 rule_ref/section、原规则分句、scope、原值源和适用依据。产品规范只在已确认范围内作应然尺子；下载设计稿尚未获PB产品批准时，不把产品角色差异硬判冲突。
3. 对应实际 fact 写 item_ref、原 value/status、evidence_ref 与读取范围。没有观察到不等于已确认没有；已确认缺失必须给实际负向证据和影响。规则和值属于不同状态、版本、主题或对象时先保差异，不能混算冲突。
4. 按下表写 norm_state、norm_anchor、reason、affected_scope、owner、next_action。每项可关联多条规则，保逐规则结论；最终item状态注明覆盖哪些规则，未定的适用规则仍 pending_review。不得用一条质量/来源规则符合，声称全部视觉、布局或业务规则符合。
5. 两basis分别跑同一过程，保两份独立对账原件与差异说明；不因第二套没有精确值而重用第一套预期。真实对账由独立reader回原规则和原事实核语义，本文样例和测试不代替该动作。

## 四态判定与反例

| norm_state | 可以这样判的条件 | 必留理由与来源 | 不允许的替代 |
| --- | --- | --- | --- |
| present | 已确认适用的同scope规则可定位，有源事实满足该规则 | 规则原文/值源与事实原件，说明仅覆盖该条 | 仅同词、同数值、文件齐全或未知补真值 |
| missing | 适用规则要求该事实/条目，且已确认确实缺失 | 具体应有什么、如何证实缺失、影响与提供者 | 未观察、未批准、未知一概叫missing |
| conflict | 同scope双方已知且可定位，要求与事实相矛盾 | 双方原文/版本/值与差异原因，交原owner | 跨项目/状态/模式值不同，或无锚仍硬判冲突 |
| pending_review | 适用性、批准、事实、版本关系或取舍未定 | 待决问题、原owner、受影响项和补证动作 | 把待议当已同意，或无限泛化到无关步骤 |

四态属于规范关系，不能覆盖原页面事实。unknown是事实强度，不是第五个norm_state；missing是明确缺失，不是unknown的别名。无需为真实对账凑齐四态，未发生的冲突不制造。

## 规范待修与页面缺陷分开

norm_defects仅写规范自身可定位的缺失、矛盾或过期：norm_ref、双方原文（若有）、reason、affected_items、owner、next_action。页面不符不能自动说明规范错；规范待修也不授权改页面值或规范正文。不确定决定关系时保pending_review，不替owner裁决。当前选中规则未证有规范缺陷时可明确空数组，并限定读取范围与“未证明全库无缺陷”。模板有意保留占位不自动等于规范缺陷。

## 给下游的对账产物

每份记录basis身份、类别适用表、规则表、逐item规则关系、原产物ref/hash、norm_defects、未覆盖与差异。规则可被多item引用，但每item仍给具体关系/理由与原证据。P5读取这些关系及原 rendered，不把pending_review当实现批准；P6沿原读取点接方法与产物，不在此新增持久状态或运行控制面。

对账保输入产物原有的来源、状态与事实强度，不把同元素一个属性的声明推广到其它属性。Figma不可用或freshness未知时保具体原因与影响。实际对象、数目、命令与验收状态由任务原件承接，不写成跨任务永久通过。

## 文档消费样例

以下fixture-only四例是本文判法的字面输入，用来发现文档漂移；不是PB或模板已确认的产品规则、不是浏览器观察、不是自动生产判定器。expected_state由例子作者独立给定。测试读取此唯一JSON块并对真实消费对象做受控反例；测试绿只能证明这些文档例子的契约一致，不证明两套真实规范语义正确。

<!-- C04-NORM-SEMANTIC-ORACLE -->
```json
{
  "scope": "fixture-only document contract; no real-product judgment",
  "cases": [
    {
      "applicability": "confirmed",
      "rule": {
        "ref": "fixture-only:width-rule",
        "section": "literal width contract",
        "scope": "fixture-hero/default/desktop",
        "expected": "100px",
        "placeholder": false
      },
      "fact": {
        "status": "observed",
        "scope": "fixture-hero/default/desktop",
        "value": "100px",
        "evidence_ref": "fixture-only:original-observation"
      },
      "owner": "fixture-only author",
      "affected_scope": [
        "fixture-hero-width"
      ],
      "name": "known-equal",
      "expected_state": "present",
      "reason": "Same confirmed fixture scope and original value equals requirement"
    },
    {
      "applicability": "confirmed",
      "rule": {
        "ref": "fixture-only:width-rule",
        "section": "literal width contract",
        "scope": "fixture-hero/default/desktop",
        "expected": "100px",
        "placeholder": false
      },
      "fact": {
        "status": "confirmed_absent",
        "evidence_ref": "fixture-only:negative-observation",
        "scope": "fixture-hero/default/desktop",
        "reason": "Controlled fixture explicitly contains no required width fact"
      },
      "owner": "fixture-only author",
      "affected_scope": [
        "fixture-hero-width"
      ],
      "name": "confirmed-absent",
      "expected_state": "missing",
      "reason": "Required fact is explicitly absent, not merely unobserved"
    },
    {
      "applicability": "confirmed",
      "rule": {
        "ref": "fixture-only:width-rule",
        "section": "literal width contract",
        "scope": "fixture-hero/default/desktop",
        "expected": "100px",
        "placeholder": false
      },
      "fact": {
        "status": "observed",
        "scope": "fixture-hero/default/desktop",
        "value": "80px",
        "evidence_ref": "fixture-only:original-observation"
      },
      "owner": "fixture-only author",
      "affected_scope": [
        "fixture-hero-width"
      ],
      "name": "known-different",
      "expected_state": "conflict",
      "reason": "Both known in same confirmed scope; 80px contradicts 100px"
    },
    {
      "applicability": "confirmed",
      "rule": {
        "ref": "fixture-only:width-rule",
        "section": "literal width contract",
        "scope": "fixture-hero/default/desktop",
        "expected": "100px",
        "placeholder": false
      },
      "fact": {
        "status": "unknown",
        "scope": "fixture-hero/default/desktop",
        "reason": "No observation supplied"
      },
      "owner": "fixture-only author",
      "affected_scope": [
        "fixture-hero-width"
      ],
      "name": "unobserved",
      "expected_state": "pending_review",
      "reason": "Unknown observation requires owner evidence, not a missing/present claim"
    }
  ]
}
```
