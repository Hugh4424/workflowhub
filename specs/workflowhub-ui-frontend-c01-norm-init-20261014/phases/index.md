# Phase 索引 — workflowhub-ui-frontend-c01-norm-init-20261014

> 指向各 Phase 独立权威的纯指针。由实际 Phase 契约头重新生成；本文件没有实现或完成权威。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-审查材料接线可消费.md` | `phases/P1-审查材料接线可消费.md#l0--结果与变更` | `runtime/stage/stage-content-contracts.mjs`；`tools/cli/stage-runtime.mjs`；`skills/wh-review/scripts/review-source.mjs`；`skills/wh-review/scripts/review-materials.mjs`；`runtime/review/ocr-delegation-adapter.mjs`；`tests/contract/card05-phase-path-and-contract-facts.test.mjs`；`tests/contract/ocr-review-contract-bundle.test.mjs` | none | P2基线整理、后续真实Phase/status/cursor/public代码审查、P13全项验收 |
| `P2` | `phases/P2-基线口径.md` | `phases/P2-基线口径.md#l0--结果与变更` | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/c01-baseline-pin.md`；`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/c01-sample-environment.md` | P1 | C09输入owner与P13/T013 |
| `P3` | `phases/P3-薄入口.md` | `phases/P3-薄入口.md#l0--结果与变更` | `skills/ui-project-init/SKILL.md`；`docs/architecture/move-map.json` | P2 | 现build-plan与build-prd作者、专业规范owner |
| `P4` | `phases/P4-读取新源.md` | `phases/P4-读取新源.md#l0--结果与变更` | `skills/design-source-readiness/SKILL.md`；`skills/frontend-prototype-render/SKILL.md`；`skills/frontend-testing/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/verify-code/SKILL.md`；`skills/frontend-component-quality/SKILL.md`；`skills/isolated-browser-qa/SKILL.md`；`skills/spec-prd/SKILL.md`；`docs/adr/0015-ui-design-source-and-initialization.md`；`docs/adr/0016-external-first-frontend-component-quality.md`；`tests/contract/ui-skill-contract.test.mjs` | P3 | 规划、Read Map、原型、实施测试与独立验证作者 |
| `P5` | `phases/P5-验收对象.md` | `phases/P5-验收对象.md#l0--结果与变更` | `skills/spec-specify/templates/spec-template.md`；`skills/spec-specify/SKILL.md` | P4 | P4两workflow、冻结acceptance test、P13验收执行者 |
| `P6` | `phases/P6-外部方法采用.md` | `phases/P6-外部方法采用.md#l0--结果与变更` | `skills/reuse-registry.md`；`skills/catalog.yaml` | P5 | ui-project-init与专业规范owner、材料GUIDE/AUDIT执行者 |
| `P7` | `phases/P7-目标规范可消费.md` | `phases/P7-目标规范可消费.md#l0--结果与变更` | `/Users/Hugh/Hugh/Project/PaperBuilder/specs/design/design.md`；`/Users/Hugh/Hugh/Project/PaperBuilder/specs/design/components.md`；`/Users/Hugh/Hugh/Project/PaperBuilder/specs/design/layouts.md`；`/Users/Hugh/Hugh/Project/PaperBuilder/specs/design/interaction.md`；`/Users/Hugh/Hugh/Project/PaperBuilder/specs/design/craft.md`；`/Users/Hugh/Hugh/Project/PaperBuilder/specs/design/quality.md`；`/Users/Hugh/Hugh/Project/PaperBuilder/specs/design/README.md`；`/Users/Hugh/Hugh/Project/PaperBuilder/specs/frontend/frontend.md`；`/Users/Hugh/Hugh/Project/PaperBuilder/specs/frontend/ui-quality.md` | P6 | PaperBuilder专业owner与WorkflowHub当前规范reader |
| `P8` | `phases/P8-目标守卫改源.md` | `phases/P8-目标守卫改源.md#l0--结果与变更` | `/Users/Hugh/Hugh/Project/PaperBuilder/frontend/src/ui/tokens-anchor.json`；`/Users/Hugh/Hugh/Project/PaperBuilder/frontend/src/ui/style-token-guard.test.ts`；`/Users/Hugh/Hugh/Project/PaperBuilder/frontend/src/live-pages.test.tsx` | P7 | PaperBuilder既有style-token-guard与live-pages的T022 CSS守卫 |
| `P9` | `phases/P9-目标旧源退役.md` | `phases/P9-目标旧源退役.md#l0--结果与变更` | `/Users/Hugh/Hugh/Project/PaperBuilder/Design.md`；`/Users/Hugh/Hugh/Project/PaperBuilder/Experience.md`；`/Users/Hugh/Hugh/Project/PaperBuilder/docs/adr/0035-project-norm-authority-and-value-source-migration.md` | P8 | PaperBuilder维护者与当前项目规范caller |
| `P10` | `phases/P10-审查入口说明.md` | `phases/P10-审查入口说明.md#l0--结果与变更` | `skills/wh-review/SKILL.md` | P2 | make-decision与build-plan文档审查组包执行者 |
| `P11` | `phases/P11-步骤产物可见.md` | `phases/P11-步骤产物可见.md#l0--结果与变更` | `workflows/make-decision/SKILL.md` | P10 | 真实make-decision主会话 |
| `P12` | `phases/P12-用户说话方式.md` | `phases/P12-用户说话方式.md#l0--结果与变更` | `skills/talk-with-zhipeng/SKILL.md` | P2 | 真实Talk主会话与用户 |
| `P13` | `phases/P13-全项验收.md` | `phases/P13-全项验收.md#l0--结果与变更` | none（本Phase只执行验收，生产写集为空，原件与本节事实沿既有owner回写） | P9；P10；P11；P12 | verify-code验收者、主会话与C09交接负责人 |
