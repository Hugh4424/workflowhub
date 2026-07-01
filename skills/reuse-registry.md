本表登记 workflowhub 各 skill 的复用来源，方便溯源与外部依赖更新检查（承接 D15/D16）。

| skill 名 | 复用类别 | 来源路径 | upstream_delta |
|---|---|---|---|
| make-decision | 自研 | none | - |
| build-spec | 自研 | none | - |
| build-plan | 自研 | none | - |
| build-code | 自研 | none | - |
| verify-code | 自研 | none | - |
| scope-triage | 外部改造适配 | packages/core/agenthub/skills/scope-triage/SKILL.md | - |
| decision-log | 外部改造适配 | packages/core/agenthub/skills/decision-log/SKILL.md | - |
| Worker-Mode | 外部依赖 | worker-mode plugin | - |
| 3rd-review | 外部依赖 | packages/core/agenthub/skills/3rd-review | - |
| TDD 件（capture.mjs） | 外部改造适配 | tdd-red-green skill | - |
| `isolated-browser-qa` | 外部改造适配 | `workflows/verify-code/isolated-browser-qa.md` | - |
| spec-specify | 外部改造适配 | speckit-specify/SKILL.md | - |
| spec-clarify | 外部改造适配 | speckit-clarify/SKILL.md | - |
| spec-plan | 外部改造适配 | speckit-plan/SKILL.md | - |
| spec-tasks | 外部改造适配 | speckit-tasks/SKILL.md | - |
| `debate`（make-decision 护城河） | 外部依赖 | 可移植契约：路径由 `MAKE_DECISION_DEBATE_PATH` 决定（始终可选，缺省或不可达均可降级）；默认值 `/Users/Hugh/Hugh/Project/debate` 仅为**本地示例/宿主机迁移默认（host-local，不保证在其他机器上存在）**，不应硬编码为依赖。路径不可达时自动降级（skipped），必须写 `debate_path_invalid: true`，不阻断主流程。canonical skip 事件：S5 第一次 debate 跳过记 `event: "debate_1_skipped", reason: "debate_path_invalid"`（对应 S5 ### 4 节）；S7 第二次 debate 跳过记 `event: "debate_2_skipped", reason: "debate_path_invalid"`（对应 S7 orchestrator 节）；两轮共用 `debate_path_invalid: true`。 | - |
| `grill-with-docs-lite`（make-decision S7） | 外部依赖 | 路径由 S7 `grill-with-docs-lite` 调用决定（in-repo 引用 `workflows/make-decision/SKILL.md` S7 节）；路径不可达或调用失败时记录 `s7_grill_done: false`，写入失败原因到 `make-decision-grill-with-docs.md`，不阻断后续 draft 步骤。 | - |
| spec-analyze | 外部改造适配 | speckit-analyze/SKILL.md | - |
| spec-research | 自研 | none | Phase 0 research skill 新建（FR-RESEARCH-001） |
| talk-with-zhipeng | 外部改造适配 | skills/talk-with-zhipeng/ | merged from config/reuse-registry.md |
| grill-with-docs | 外部改造适配 | skills/grill-with-docs/ | merged from config/reuse-registry.md |
| intake-decision-review | 外部改造适配 | skills/intake-decision-review/ | merged from config/reuse-registry.md |
| checkpoint-protocol | 自研 | 本项目自研 | M13d build-code deepening |
| review-trigger | 自研 | 本项目自研 | M13d build-code deepening |
| verdict-handler | 自研 | 本项目自研 | M13d build-code deepening |
| test-routing-advisor | 外部改造适配 | packages/core/agenthub/skills/test-routing-advisor/SKILL.md（AgentHub: https://github.com/Hugh4424/AgentHub.git） | M13d build-code deepening |
