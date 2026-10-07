---
name: stage-reflection
description: 会话内、非阻断的阶段末过程复盘；可选写普通 md 与有依据的过程判断，不生成质量裁决。
version: 1.0.0
---

# stage-reflection

可选：阶段末写一份普通 md 复盘，帮助当前主会话观察实际工作过程。复盘是 judgment，不是事实认证、质量分数、verdict、release/acceptance 或继续工作/close 的门。

## 方法

1. 只读本次可见会话事实、当前材料位置、实际测试/审查/失败和用户纠正。历史教训作背景；不可见、压缩、截断或缺来源写 unknown，不推断发生过什么。
2. 按实际需要记下帮助工作的做法、可改进处、阻塞/等待、人工介入原因、可简化内容和现在可安全简化事项。无观察与未知分开，给具体依据和限制；不以未找到消费边当成零 consumer 或删除授权。
3. 保存普通 `quality/evidence/reflection/<stage>.md`，返回实际路径；没执行就说明未执行，写失败保留原始原因。引用已有原件，不复制 transcript/原始输出、秘密或另建 lessons writer。
4. 将有用的建议交给主会话；真正改源码、退役需求或不可逆动作仍按既有范围和授权执行。建议不能反推出质量通过或物理完成。

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
