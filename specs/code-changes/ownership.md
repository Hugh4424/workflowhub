# 代码改动域 · 归属

定位：本组只回答「谁写、按什么顺序写、越界怎么办」。读者：派发者、唯一开发写手、独立审查者。
边界：三角色的完整职责归 workflows/build-code/SKILL.md；本文件只写归属动作，不复制方法正文。

## 规则

1. 一份文件同一时刻只有一个写主；出现第二个 writer 就停，回派发者定序，不许各写一份（强制：审查问句；锚：[Phase 三角色与七步顺序](../../workflows/build-code/SKILL.md#phase-三角色与七步顺序)）
2. 同文件不同字段仍算共享；动笔前写下前写者、后写者与依据（强制：审查问句；锚：[信息来源](../../skills/stage-handoff/SKILL.md#信息来源)）
3. 写集是申报结果不是锁；同一并行批次的路径必须互斥，可能冲突的 Phase 不并行（强制：审查问句；锚：[step-spec-plan](../../workflows/build-plan/SKILL.md#step-spec-plan)）
4. 越界改动只停该处并指出缺哪份确认，其余安全工作继续；越界事实登记一次即可（强制：审查问句；锚：[step-read-current-task-documents](../../workflows/build-code/SKILL.md#step-read-current-task-documents)）
5. 同一文件被多段改，前段交回已核实的当前状态，后段在自己的边界点名先写者与依据（强制：仅文档；锚：[信息来源](../../skills/stage-handoff/SKILL.md#信息来源)）

## 边界与不承接

三角色的派发与回传形状归 build-code 与 stage-handoff；本文件不定义角色、不定义交接字段。
