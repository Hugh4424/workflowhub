# Codex 支持核实记录

- 核实时间：2026-09-05
- 仓库基线：`main` 与任务分支已对齐到 `248a7de36ab82fe0fb103f34a7e5a355da14006c`
- 核实范围：当前显式 identity、Stage Agent outcome bridge、仓内 skill manifest 和 host review 边界

## 字段核实

| 字段/能力 | Codex 结论 | 依据 |
|---|---|---|
| `--project` + `--task` | 支持 | `stage-runtime.mjs` 成对解析 |
| 认证 task worktree | 支持 | identity resolver 读取认证 worktree |
| `agent_run_id` | 支持 | bridge 顶层必填并绑定 outcome |
| `session`/`unavailable` | 支持 | bridge 二选一且 fail-closed |
| `snapshot`/material revision | 支持 | 当前 outcome adapter 绑定校验 |
| 旧 session/env/transcript 猜测 | 不支持 | 当前代码无旧绑定和 transcript fallback |
| 3rd-review semver | 暂不可核实 | broker 未暴露 `engine_version`，探针返回 `unknown` |

## 运行事实

- `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs` 与 M17 相关窄测试已重新运行；旧 receipt 中的依赖缺失失败仍保留为历史事实。
- 2026-09-05：实际 Codex CLI `0.151.0` 以 ephemeral/read-only 模式启动，执行 `node tools/cli/repo-skills-manifest.mjs --check`，Codex session `01a07028-887b-7c90-9767-224b25cb6208` 返回 exit `0`，输出 `repo skills manifest: ok`。
- 2026-09-05：实际 Codex CLI `0.151.0` 以 ephemeral 模式启动官方五阶段 E2E 单用例，Codex session `01a07031-734c-79f2-ae7d-9e6faaa53f02` 返回 exit `0`；目标用例 `1 passed`、`23 skipped`，耗时 `80.24s`，隔离 fixture 负责创建 release、task 和五阶段运行环境。
- 当前证明边界：仓内契约/fixture 可验证显式身份、outcome bridge 和 fail-closed 语义；Codex 已有真实 CLI→官方五阶段 E2E 的运行事实，但该 CLI 只执行测试命令，不等于 Codex 前端自身完成业务任务，也不证明宿主读取 `repo-skills.manifest.json`；没有可用真实 Claude CLI 阶段会话，DSH 前端仍不可用。
- 本记录不使用旧 receipt 推导当前全量通过；`npm test` 全量回归按用户要求不再执行。

因此，本记录证明的是 Codex 接线字段和 fail-closed 代码边界；它不把依赖缺失或 review unavailable 推导成全量验收通过。
