# T020 非通过 runner 诊断观察

P8 OCR finding `F-9e7c4ea5b6ed` 指出：原 Node TAP skip/todo 被折叠为失败或身份不匹配，且拒绝结果没有可核的逐测试状态。本次仅改 `workflows/build-code/targeted-runner.mjs` 与此目录的新证据；冻结测试、P8 catalog、selector、reconciliation 未改。

## 修复口径

- Node TAP 先核 header、唯一 `# Subtest` 名、`ok/not ok` 结果、`1..1`、tests/pass/fail/cancelled/skipped/todo 计数及子进程 exit 的一致性，再得出真实 `passed`、`failed`、`skipped` 或 `todo`。Vitest JSON 沿用文件、full ID、注册列表、状态、suite/test 计数与 exit 校验。
- 有效 reporter 中只要存在 `failed/skipped/todo/pending`，返回 `status=unavailable`、`observations=[]`。其可核的逐 runnable ID、真实 status、exit、单份原始报告 SHA256 保留在 `diagnostic_observations`，每条均标 `diagnostic_only:true`、`canonical_receipt:false`。一个 Vitest 文件混合 pass+skip 时，两个真实状态都留在诊断区，**没有任何被接受的 passed observation**。
- header/JSON 不可解析、零测试、错目标/错身份、计数或 exit 自相矛盾时，不生成伪造诊断身份；可回读的原始输出及 hash 仍在 `execution`。此接口没有 canonical receipt 权威。

## 实跑原件

- RED：旧源码 SHA256 `40a152d1f5c7be2d448e45e89ebeac18788bbbf93f7057f9704ab9a380789e3c`；`node quality/evidence/stage-quality/build-code/P10/T020-nonpassing-diagnostics-probe.mjs red` exit 1。真实 Node SKIP/TODO 当时错误地给 `reporter_identity_mismatch`，Node failed 与 Vitest skip/todo/failed 虽拒绝但 `diagnostic_observations` 均空。错 ID/零测试仍拒绝。原始 stdout/stderr、命令、HEAD/tree、测试/探针 SHA 在 `T020-nonpassing-red.meta.json`；各 `T020-nonpassing-red-*.report.txt` 为真实子进程报告。RED 版 probe 只含负控，随后增补正控/混合状态，不改旧原件。
- 最终 GREEN：源码 SHA256 `e30e55474aae28445d0ef2ccf5d589a2710a999581d2b92d38e3d2fec78ae32c`；同 probe `green` exit 0。Node/Vitest 正控各 1 accepted pass；Node skip/todo/failed 与 Vitest skip/todo/failed 各 `unavailable`、0 accepted、1 真实诊断状态；Vitest 混合 pass+skip 为 0 accepted、2 条诊断状态；Node/Vitest 错 ID 与零测试各 0 诊断身份。逐条 ID/status/exit/report SHA 见 `T020-nonpassing-final-probe.stdout.txt`，各原始报告在 `T020-nonpassing-green-*.report.txt`。冻结门 `npx vitest run tests/contract/build-code-targeted-runner.test.mjs` exit 0、9/9；`node --check workflows/build-code/targeted-runner.mjs` exit 0。完整命令、CWD、HEAD/tree、Node/Vitest、原始 stdout/stderr SHA、源/冻结测试/探针 SHA 在 `T020-nonpassing-final.meta.json`；临时 fixture 已清理。

## 限制

这些 `diagnostic_observations` 是 importable runner 对直接子进程报告的读取，不是官方 test receipt，也未接 P10/T021 的 AC-33 业务 oracle 对账或固定可信 launcher。对 malformed reporter 的拒绝来自严格解析分支；本轮真实负控覆盖零测试、错身份以及有效非通过报告，未构造伪造 JSON 替换本地 Vitest CLI。旧 OCR review 绑定旧 snapshot，本次 focused GREEN 不追认其历史结论。
