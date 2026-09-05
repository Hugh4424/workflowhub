# Claude outcome-packet 样例

## 样例边界

Claude 不把 transcript 交给 WorkflowHub 反查。宿主将当前任务的结构化执行结果提交给现有 `workflowhub-stage-agent-bridge.mjs`，bridge 校验身份和绑定后生成 `workflowhub-stage-outcomes.v1`；公共 `stage-runtime run --action=execute` 只消费 `outcome_ref`。

样例输入的最小结构如下：

```json
{
  "project_name": "workflowhub",
  "task_id": "<task-id>",
  "task_path": "<authenticated-task-path>",
  "stage": "build-code",
  "attempt_id": "<attempt-id>",
  "agent_run_id": "<agent-run-id>",
  "session": {
    "task_id": "<task-id>",
    "host": "claude-code",
    "source_id": "claude-code",
    "source_family": "claude-code",
    "source_ref": "<claude-run-ref>",
    "status": "incomplete",
    "events": [],
    "spec_analyze": {}
  }
}
```

## 本任务回放事实

- 固定输入 fixture：`tests/fixtures/claude-outcome/valid-session.json`。
- 契约测试：`tests/contract/claude-outcome-packet.test.mjs`，覆盖成功字段、缺结果、task 绑定冲突和禁止旧 `execution`。
- 正式 T11 receipt：`quality/tests/t11-claude-outcome-packet.json`，exit `1`、0 项测试执行；原因是任务 worktree 缺 `ajv`。
- 2026-09-05 尝试启动真实 Claude CLI 探针：`claude --bare --no-session-persistence --permission-mode dontAsk --output-format json ...`；Claude CLI 返回 exit `1`，API `503`（`Pricing configuration is temporarily unavailable`），没有执行仓内命令，因此未产生真实阶段结果。
- 2026-09-05 重试同一只读探针（Claude CLI `2.1.251`，session `eeb1e5b6-85d9-4383-95ae-7f6b2e02ffcb`，Haiku fallback，预算 `$0.25`）仍返回 exit `1`、API `503`（`Pricing configuration is temporarily unavailable`），`num_turns=1`、`duration_api_ms=1394`；仓内命令仍未执行。该重试只确认外部服务阻塞，不改变样例的 `incomplete` 结论。
- 随后用已登录 OAuth 的 `--safe-mode` 复试同一只读探针；约 `155s` 无终端结果、仓内命令未执行，已终止该外部请求。该次记为 `unavailable`/无终态输出，不作为通过或新的 API 错误码。
- 2026-09-05 再次执行 90 秒上限的真实只读 Claude CLI 探针；进程全程无 stdout，最终由本地超时终止，exit `124`，仍没有确认仓内命令执行。该次记为 `unavailable`，不改变真实 Claude 阶段样例缺失的结论。
- 因此该文件仍是可重放的结构化样例，不是 Claude 真实运行通过证明，Claude E2E 验收状态保持 `incomplete`。

当宿主拿不到执行结果时，提交同一身份下的 `unavailable` 对象和明确 reason；不能省略结果，也不能用历史 JSONL 补齐当前事实。
