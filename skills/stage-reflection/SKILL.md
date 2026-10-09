---
name: stage-reflection
description: 阶段末有过程问题时可选复盘，提出有源候选供用户选择；后继任务可读项目根未解待办，不生成质量裁决。
version: 1.0.0
---

# stage-reflection

可选：阶段末写一份普通 md 复盘，帮助当前主会话观察实际工作过程。复盘是 judgment，不是事实认证、质量分数、verdict、release/acceptance 或继续工作/close 的门。

## 方法

1. 只读本次可见会话事实、当前材料位置、实际测试/审查/失败和用户纠正。历史教训作背景；不可见、压缩、截断或缺来源写 unknown，不推断发生过什么。
2. 按实际需要记下帮助工作的做法、可改进处、阻塞/等待、人工介入原因、可简化内容和现在可安全简化事项。无观察与未知分开，给具体依据和限制；不以未找到消费边当成零 consumer 或删除授权。
3. 保存普通 `quality/evidence/reflection/<stage>.md`，返回实际路径；没执行就说明未执行，写失败保留原始原因。引用已有原件，不复制 transcript/原始输出、秘密或另建 lessons writer。
4. 将有用的建议作为候选交给主会话，逐项给出原问题、实际来源路径、建议与依据；证据不足保 unknown。主会话在真实复盘阶段末展示候选，询问用户选择检查、判断待办或无操作；用户未答就保未选，不把任务实施授权或代理转述当成候选采纳。真正改源码、退役需求或不可逆动作仍按既有范围和授权执行。建议不能反推出质量通过或物理完成。

## 用户选择后的归口

候选的机械性或判断性由用户根据依据决定，主会话说明判据：能靠结构或确定性断言消除的错误走检查，需要结合真实情境作取舍的未解问题走判断待办。同一错误类实际发生过两次才称重复；单次事件或次数不可见如实说明，不靠历史摘要补出事件。

检查：用户已选机械候选后，优先 architecture → types → test，再考虑已有 CI 或窄脚本检查；文档或 agent 规则最后。每条新检查必须能在有源的真实历史错误上失败，再验证当前修复；没有历史字节、目标场景或实际执行就说明未验证，不能拿文本、旧报告回放或自造反例冒 RED/GREEN。未选候选可保有源方案，不自动写生产检查，也不新增通用规则账本或评分平台。

判断待办：只有用户已选、确需人判断且仍未解决的项写入目标项目根 `Improvements.md`；先读已有文件，保留其它任务的真实未解项。每项用简短文字给出问题、来源路径及真实选择/未解状态，缺答复或来源保持未知；候选仍留原候选出处，不混入已选待办。清单是未解待办，不是规范或知识库；原候选、失败与判断依据仍引用已有原件。

后继任务：发起者在有相关未解问题时读取该项目根清单和项内原来源，按真实情况向用户询问选择、补充证据路径或确认解决。只有用户明确确认该项已解决后才 prune；未答、来源不足或未找到项不当已解决，不自动清理或覆盖其它任务条目。此人读文件不作为技能 bundle 附件，目标项目路径由调用方给出，不绑定宿主或任务绝对路径。

无操作：用户明确不采纳时保留原选择来源，不创建检查或待办。未参与选择、等待时长或问答质量未观测就写 not_observed/unknown，不填 0；取消保留原原因与已发生事实，不推断为选择或质量通过。

本方法不触发新的复盘运行、认证、checkpoint 或持久对象；局部 Phase 摘要不自动当 stage 结束。可选复盘在真实 stage 末进行一次，缺来源或不可用不冻结同任务安全工作。

## 判断词表与完成检查

普通 md 可用 `classification∈{keep|optimize|simplify|merge|remove_candidate|add|needs_evidence}` 说明保留、优化、简化、合并、候选移除、增加或需证据的建议。`severity` 说明问题影响，`confidence` 说明判断把握而非质量等级，`evidence_refs` 用真实文件/节路径引用已有原件；缺来源时说明限制并降低把握，不能补猜。LLM 不能把 unknown 当 zero，未找到消费边不等于零 consumer。词表只供描述，不形成固定结构或必填字段。

实际执行复盘时，交接前按以下六项检查说明内容；缺项如实披露，检查不成为继续工作或 close 的门：

1. 帮助工作的做法、可改进处、阻塞/等待、人工介入原因、可简化内容和现在可安全简化事项这六类过程观察，都说明已观察、未观察或未知。
2. observed 判断有实际 `evidence_refs` 与 `confidence`，引用能定位已有原件。
3. unknown 说明缺失来源和原因，not_applicable 说明不适用原因，不静默留空。
4. 可见状态与来源完整性只记录事实，不从它们推导质量结论。
5. 实际执行、未执行和写入失败如实交接，给出真实路径或失败原因。
6. 原失败、未知与覆盖限制保持可见，不改写为通过。

复盘没有固定 JSON schema、identity 三件套、13步清单、run/reflect认证或机器消费边发布。主会话可跳过并如实说明，缺少复盘不翻转阶段事实、不阻止继续修复。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。

## 固定来源、本地偏离与更新入口

Matt `retro`：参考 [mattpocock/skills 的 skills/engineering/retro/SKILL.md](https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/skills/engineering/retro/SKILL.md)，固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404`，吸收候选提案与机械检查优先。旧固定 commit `66898f60e8c744e269f8ce06c2b2b99ce7660d5f` 缺该技能的历史观察，与新 pin 子文件可读分别保留。

pstack：参考 [backnotprop/pstack 的 skills/correct/SKILL.md](https://github.com/backnotprop/pstack/blob/c0c3f13cc58005cce7f28c1e6d7ccc439867f171/skills/correct/SKILL.md)，固定 commit `c0c3f13cc58005cce7f28c1e6d7ccc439867f171`；以及 [skills/principle-encode-lessons-in-structure/SKILL.md](https://github.com/backnotprop/pstack/blob/55bfdc262dd7f99254d19b53a96cf1dfb24c213b/skills/principle-encode-lessons-in-structure/SKILL.md)，固定 commit `55bfdc262dd7f99254d19b53a96cf1dfb24c213b`。吸收层级修复、重复错误与历史负例方法。各 pin 绑定已核内容的可重放版本，不声明共同或全仓基线；原采集 commit/时间仍未知。

本地偏离：判断项归目标项目未解 `Improvements.md`，保本文件的用户选择、检查与人确认 prune 规则；不搬上游 `CODING_STANDARDS.md`、规则执行表、自动修复/提交或 pstack 编排器。写作工具调用改为上节 WR001 唯一规范指针，保持现有单一路径与可搬运性。

更新入口：迭代本方法时对照上述三个固定子文件、其更新与更优候选，说明源差和本地偏离后决定采用，不自动追 HEAD。子文件或版本不可核时保具体缺口并交来源 owner；来源核定不证明方法效果或质量通过。
