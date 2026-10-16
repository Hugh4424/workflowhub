# Phase 索引 — 知识图谱融入五阶段与共享收口

由当前实际Phase契约头生成，仅导航，不承载实现或完成权威。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-图谱质量归因.md` | `L0 — 结果与变更` | `quality/evidence/build-code/P1-graph-quality.md` | none | P2 知识图谱技能作者与终末验收执行者 |
| `P2` | `phases/P2-知识图谱能力.md` | `L0 — 结果与变更` | `skills/knowledge-graph/SKILL.md`；`skills/knowledge-graph/skill-bundle.json`；`skills/catalog.yaml`；`graphify-out/.gitignore`；`.gitattributes`；`docs/architecture/move-map.json` | `P1` | 五阶段主会话与 P3 的 stage-closeout 技能作者 |
| `P3` | `phases/P3-共享收口技能.md` | `L0 — 结果与变更` | `skills/stage-closeout/SKILL.md`；`skills/stage-closeout/skill-bundle.json`；`skills/catalog.yaml` | P2 | P5 verify-code 接线作者、P6 build-prd 接线作者与独立调用 stage-closeout 的宿主主会话 |
| `P4` | `phases/P4-决策阶段接入.md` | `L0 — 结果与变更` | `workflows/make-decision/SKILL.md`；`workflows/make-decision/skill-deps.yaml` | P3 | make-decision 主会话与终末验收执行者 |
| `P5` | `phases/P5-验证阶段接入.md` | `L0 — 结果与变更` | `workflows/verify-code/SKILL.md`；`workflows/verify-code/skill-deps.yaml` | P4 | verify-code 主会话与 P8 全 AC 复核者 |
| `P6` | `phases/P6-规划阶段接入.md` | `L0 — 结果与变更` | `workflows/build-prd/SKILL.md`；`workflows/build-prd/skill-deps.yaml`；`workflows/build-plan/SKILL.md`；`workflows/build-plan/skill-deps.yaml` | P5 | build-prd 与 build-plan 主会话、P7 实施阶段接线作者与 P8 全 AC 复核者 |
| `P7` | `phases/P7-实施阶段接入.md` | `L0 — 结果与变更` | `workflows/build-code/SKILL.md`；`workflows/build-code/skill-deps.yaml`；`quality/evidence/P8-data-readiness.json`；`quality/evidence/P8-environment-readiness.json` | P6 | build-code 主会话与终末验收执行者 |
| `P8` | `phases/P8-全项验收.md` | `L0 — 结果与变更` | `quality/tests/P8-acceptance.md` | `P7` | verify-code 主会话与用户 |
