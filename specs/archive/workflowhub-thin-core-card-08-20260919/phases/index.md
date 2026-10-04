# CARD-08 Phase pointers

## Execution Index

CARD-06 合入外部前提已满足；来源与当前锚点见 `phases/P1.md`、`phases/P2.md` 契约头“外部前提”。本表 Dependency 仅列本卡内部 Phase 依赖，不新增等待 gate。

| Phase | Authority ref | Semantic anchor | Write set | Dependency | Consumer |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1.md` | `#l0--结果与变更` | `skills/stage-handoff/SKILL.md` | none | 当前新流程各 stage 主会话与跨会话读者 |
| `P2` | `phases/P2.md` | `#l0--结果与变更` | `workflows/make-decision/SKILL.md`；`workflows/build-prd/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md` | P1 | build-code 与 verify-code 主会话、用户和无旧上下文的新会话 |
