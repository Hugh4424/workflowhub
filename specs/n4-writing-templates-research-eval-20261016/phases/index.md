# Phase 索引 — 写作规则、四类材料、研究来源与评测合同真的生效

> 指向各 Phase 独立权威的纯指针。由 Phase 标题重新生成；本文件没有实现或完成权威。
> 每个 `phases/P<n>-*.md` 恰好一行；从实际 Phase 契约头读取引用与字段。
> 核对的是实际指针可读与职责，不以 hash／认证 readback 判完成。

本件仅导航实际 Phase；不承载实现程序、命令、执行状态或验收正文。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-机器侧静默层修复.md` | `L0 — 结果与变更` | `runtime/stage/stage-content-contracts.mjs`；`tests/contract/chinese-label-detection.test.mjs` | none | OCR 代码审查路径与 `tools/cli/stage-runtime.mjs` 的校验调用方；四类材料作者 |
| `P2` | `phases/P2-只报告检查接入.md` | `L0 — 结果与变更` | `tools/cli/check-skill-consistency.mjs`；`tools/cli/run-checks.mjs`；`tests/n2-skill-catalog-portability.test.mjs` | P1 | run-checks 的既有调用链、四类材料作者与独立验收者 |
| `P3` | `phases/P3-四类模板与材料分层.md` | `L0 — 结果与变更` | `skills/decision-log/templates/decision-log-template.md`；`skills/spec-specify/templates/spec-template.md`；`skills/spec-plan/templates/phase-template.md`；`skills/spec-plan/templates/index-template.md`；`skills/spec-prd/templates/prd-template.md`；`tests/contract/post-build-plan-missing-index.test.mjs`；`tests/contract/card05-author-material-consumer.test.mjs`；`tests/contract/acceptance-object-required-fields.test.mjs`；`tests/acceptance/card-02-current.test.mjs`；`runtime/stage/stage-content-contracts.mjs`；`tests/contract/chinese-label-detection.test.mjs` | P1 | 四类材料作者、独立验收者与三个逐字 oracle 测试的维护者 |
| `P4` | `phases/P4-来源引用与出口到达条件.md` | `L0 — 结果与变更` | `skills/anysearch/SKILL.md`；`skills/architect-code-review/SKILL.md`；`skills/backend-testing/SKILL.md`；`skills/decision-log/SKILL.md`；`skills/decision-log/templates/decision-log-template.md`；`skills/deep-research/SKILL.md`；`skills/diagnosing-bugs/SKILL.md`；`skills/frontend-component-quality/SKILL.md`；`skills/frontend-testing/SKILL.md`；`skills/fullstack-slice-testing/SKILL.md`；`skills/grill-with-docs/SKILL.md`；`skills/isolated-browser-qa/SKILL.md`；`skills/knowledge-graph/SKILL.md`；`skills/plan-ceo-review/SKILL.md`；`skills/plan-design-review/SKILL.md`；`skills/plan-eng-review/SKILL.md`；`skills/review/SKILL.md`；`skills/simplicity-guard/SKILL.md`；`skills/spec-analyze/SKILL.md`；`skills/spec-clarify/SKILL.md`；`skills/spec-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`skills/spec-prd/SKILL.md`；`skills/spec-specify/SKILL.md`；`skills/stage-closeout/SKILL.md`；`skills/stage-handoff/SKILL.md`；`skills/stage-reflection/SKILL.md`；`skills/talk-with-zhipeng/SKILL.md`；`skills/test-routing-advisor/SKILL.md`；`skills/testing-system-blueprint/SKILL.md`；`skills/ui-project-init/SKILL.md`；`skills/wh-review/SKILL.md`；`workflows/build-plan/SKILL.md`；`workflows/build-prd/SKILL.md`；`workflows/make-decision/SKILL.md` | P2；P3 | 四类材料作者、研究方法读者、接收阶段报告/交接的用户与下游新会话、独立验收者 |
| `P5` | `phases/P5-评测合同与15项采用.md` | `L0 — 结果与变更` | `docs/architecture/test-asset-governance-rules.md`；`skills/catalog.yaml`；`skills/deep-research/SKILL.md`；`skills/decision-log/SKILL.md`；`skills/knowledge-graph/SKILL.md`；`skills/reuse-registry.md`；`skills/spec-analyze/SKILL.md`；`skills/spec-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`skills/spec-specify/SKILL.md`；`skills/spec-specify/templates/spec-template.md`；`skills/spec-prd/SKILL.md`；`skills/wh-review/SKILL.md`；`skills/wh-review/contracts/provider-protocol.md`；`THIRD_PARTY_NOTICES.md`；`docs/architecture/move-map.json`；`workflows/build-plan/SKILL.md`；`workflows/verify-code/SKILL.md` | P3；P4 | 四类材料作者、独立判定者、本仓方法维护者与独立核验者 |
| `P6` | `phases/P6-链路完整性与独立审查范围.md` | `L0 — 结果与变更` | none | P1；P2；P3；P4；P5 | verify-code 独立验收者与用户 |
| `P7` | `phases/P7-独立盲评与整卡验收.md` | `L0 — 结果与变更` | none | P1；P2；P3；P4；P5；P6 | verify-code 独立验收者与用户 |
