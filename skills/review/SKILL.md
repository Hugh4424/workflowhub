---
name: review
description: Report-only independent review lens for correctness, scope, evidence, and unresolved risk.
---

# review

Source: adapted from the project review baseline. Mode: `lens-only`. Standards/Spec 与 Fowler baseline 吸收 mattpocock/skills 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的 `skills/engineering/code-review/SKILL.md`。本地以调用者提供的当前材料替代 tracker/setup 和自主 Git/网络取材，host 分派不进入 provider packet。迭代时核固定子文件的更新/更优候选与本地偏离，不自动追 HEAD。

## 双轴消费与宿主分派

代码面先定位调用者提供的同一当前 diff、基线、完整 AC、执行原件、阶段合同、provider 协议、审查重点及所需 lens 正文；材料不完整时披露缺口，不从摘要猜源码。文档面仍按当前文档合同应用下节检查，不凭代码 smell 强造文档缺陷。

- **Standards**：读取本次提供的仓库编码规范（适用的 CODING_STANDARDS/CONTRIBUTING 也在范围内）及下节 Fowler baseline；发现引用规范和实际 hunk，区分规范违背与 heuristic。
- **Spec**：读取本次具名原始需求/spec，逐项检查缺失或部分实现、未要求的行为和看似实现却错误的行为；每条发现引用相应需求。没有 spec 时明确 no spec available，跳过该镜头，不补造需求。

宿主执行同源补充时，向两个互不继承对方上下文的独立执行者同时提供上述共同材料，并分别给 Standards 规范/baseline 或 Spec 来源。执行者只返回原文，不写文件；宿主按当前 workflow 保存单份原件，在 Standards / Spec 两栏分别展示发现、范围和不可用原因，只汇总各栏数量及各栏最严重问题，不合并、不重排名、不选跨轴赢家。同源补充标为 same_source_degraded，不替代 OCR、不计异源 quorum；OCR 与补充也并排保留，各路失败、取消与迟到有效发现不被成功路覆盖。

正式 provider 在其只读 packet 内应用两镜头，按下节和既有 provider 协议返回一个 findings JSON；这是镜头阅读，不是 host 分派许可。provider 不调用 Agent/subagent，不增 axis 或第二结果协议。正式 provider 内的重复 finding 仍按既有协议处理，不把该聚合跨到宿主分开的两轴。

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

## Evidence handling

- Missing evidence is unavailable, never pass. Use the supplied packet only.
- A finding may explain the affected review angle in its prose, but must not add
  `axis`, `visibility`, `anchor`, `consequence`, or `correction` output fields.
- Every finding must use only the provider protocol fields:
  `severity`, `path`, optional `line`, `issue`, `root_cause`, `recommendation`,
  `evidence_kind`, and `evidence`.

## Result

Return exactly one JSON object: `{ "findings": [...] }`. Put the packet path
and any line reference in the allowed finding fields. Do not return `verdict`,
`summary`, checklist fields, or a second object.

## 写作

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；保原步骤、条件、权限、失败强度和受保护字面，缺源如实 unavailable，不复制规范。
