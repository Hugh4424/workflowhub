本表登记 workflowhub 7 个 skill 的复用来源，方便溯源与外部依赖更新检查（承接 D15/D16）。

| skill 名 | 复用类别 | 来源路径 |
|---|---|---|
| make-decision | 自研 | none |
| build-spec | 自研 | none |
| build-plan | 自研 | none |
| build-code | 自研 | none |
| verify-code | 自研 | none |
| scope-triage | 外部改造适配 | packages/core/agenthub/skills/scope-triage/SKILL.md |
| decision-log | 外部改造适配 | packages/core/agenthub/skills/decision-log/SKILL.md |
| Worker-Mode | 外部依赖 | ~/.claude/plugins/worker-mode/ |
| 3rd-review | 外部依赖 | packages/core/agenthub/skills/3rd-review |
| TDD 件（capture.mjs） | 外部改造适配 | tdd-red-green skill |
| `isolated-browser-qa` | 改造适配 | `~/.claude/skills/isolated-browser-qa` |
