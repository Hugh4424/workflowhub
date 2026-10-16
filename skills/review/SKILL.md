---
name: review
description: Report-only independent review lens for correctness, scope, evidence, and unresolved risk.
---

# review

Source: adapted from the project review baseline. Mode: `lens-only`. Standards/Spec 与 Fowler baseline 吸收 mattpocock/skills 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/engineering/code-review/SKILL.md`。本地以调用者提供的当前材料替代 tracker/setup 和自主 Git/网络取材，host 分派指令不作为 provider 的执行控制要求。迭代时核固定子文件的更新/更优候选与本地偏离，不自动追 HEAD。

## 双轴消费与宿主分派

代码面先定位调用者提供的同一当前 diff、基线、完整 AC、执行原件、阶段合同、provider 协议、审查重点及所需 lens 正文；材料不完整时披露缺口，不从摘要猜源码。文档面仍按当前文档合同应用下节检查，不凭代码 smell 强造文档缺陷。

- **Standards**：读取本次提供的仓库编码规范（适用的 CODING_STANDARDS/CONTRIBUTING 也在范围内）及下节 Fowler baseline；发现引用规范和实际 hunk，区分规范违背与 heuristic。provider 只需两镜头与 finding 协议；宿主读仓库规范、Agent 分派、等待/轮询与同源补充的执行控制指令不适用于 provider，源方法文件作为被审材料仍可能完整入包。
- **Spec**：读取本次具名原始需求/spec，逐项检查缺失或部分实现、未要求的行为和看似实现却错误的行为；每条发现引用相应需求。没有 spec 时明确 no spec available，跳过该镜头，不补造需求。

宿主执行同源补充时，向两个互不继承对方上下文的独立执行者同时提供上述共同材料，并分别给 Standards 规范/baseline 或 Spec 来源。执行者只返回原文，不写文件；宿主按当前 workflow 保存单份原件，在 Standards / Spec 两栏分别展示发现、范围和不可用原因，只汇总各栏数量及各栏最严重问题，不合并、不重排名、不选跨轴赢家。同源补充标为 same_source_degraded，不替代 OCR、不计异源 quorum；OCR 与补充也并排保留，各路失败、取消与迟到有效发现不被成功路覆盖。

正式 provider 在其只读 packet 内应用两镜头，按下节和既有 provider 协议返回一个 findings JSON；这是镜头阅读，不是 host 分派许可。provider不执行宿主分派/等待，不调用Agent/subagent，不增axis或第二结果；源文件入包不代表其宿主控制字节已剔除。正式 provider 内的重复 finding 仍按既有协议处理，不把该聚合跨到宿主分开的两轴。

## Fowler smell baseline — what → fix

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name**: a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code**: the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy**: a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession**: a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches**: the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change**: one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality**: abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man**: a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest**: a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

## Check

1. Separate stated facts from inferences.
2. Compare every material claim with packet evidence.
3. Flag scope drift, missing acceptance evidence, and contradictory artifacts.
4. Prefer a precise finding over a broad quality opinion.
5. Keep contract-external observations minor.

沿本次真实失败追问共同前提：写出失败修法共同假定、可推翻它的包内事实，并比较“继续补偿”与“消除前提”的修法。三个必填键同 hash 不能靠重命名修好角色；角色已独立而文件不可读则检查传输，不能套用同字节诊断。缺历史原件保 incomplete，不编次数或引入固定配额/census。

有架构相关 diff 时，用包内代码逐类调查 Shallow module、Information leakage、Temporal decomposition、Pass-through method、Split ownership、Two ways to do one task、Importable internals、Hand-synced list；每类给代码证据、未见证据或不适用原因。标签是调查线索，不自动变 finding，不以 temporal 标签否定已确认 Phase。比较有不同结构后果的备选：现 canonical owner 与 adapter/reader 各写同义映射在多写者、wire 泄漏、修改面及失败保全上有何区别；同逻辑换名/同形 wrapper 不算备选。实际无机会给依据，缺源保 unknown；只消费本 task 已有一次架构机会，不新增 interface 或评审轮。


涉及测试/检查/升级时，宿主将[verify-code「测试充分性与检查可信度」](../../workflows/verify-code/SKILL.md#测试充分性与检查可信度)全文送同包；reader依其正反输入判断，缺正文报缺源，不越packet取材。

## Evidence handling

- Missing evidence is unavailable, never pass. Use the supplied packet only.
- A finding may explain the affected review angle in its prose, but must not add
  `axis`, `visibility`, `anchor`, `consequence`, or `correction` output fields.
- Every finding must use only the provider protocol fields:
  `severity`, `path`, optional `line`, `issue`, `root_cause`, `recommendation`,
  `evidence_kind`, and `evidence`.

方法追源与条件消费：审查的材料位、真实路线/身份、覆盖及三条件结论读 `skills/wh-review/SKILL.md`；盲揭示与条件 arena 读本次全文 provider 协议。归并共同简洁问题时读 `skills/simplicity-guard/SKILL.md`，不造第二套规则。

影响范围须核实际非符号边：JSON 键、wire 表示、当前配置与下游 reader；无 DB/跨语言 consumer 说明不适用原因。找一两个安全关键事实，用现 owner 的真实调用和坏输入证明；例如 failed/invalid 来源自称 read 应被转到 undetermined，completed/ok 且可靠读证可保 read，明确未送达保 unread。仅 grep/行锚或合理推理记 unproven；区分已证风险、已排除风险、未证前提，不增加 evidence_level 或 finding 字段。

## Result

Return exactly one JSON object: `{ "findings": [...] }`. Put the packet path
and any line reference in the allowed finding fields. Do not return `verdict`,
`summary`, checklist fields, or a second object.

## 写作

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；保原步骤、条件、权限、失败强度和受保护字面，缺源如实 unavailable，不复制规范。

完整来源权威：[catalog条目](../catalog.yaml#skills.review)；正文/小卡是非权威线索，单技能副本缺catalog时向来源维护者取登记。来源：garrytan/gstack review/SKILL.md。

## 同仓方法依赖

`workflows/verify-code/SKILL.md`、`skills/spec-specify/SKILL.md`；按上文实际条件读取，搬运时需同时提供或由调用者提供可读原件。
