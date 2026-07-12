# 3rd-review 异常与恢复维护手册

本文件是运行时保护逻辑的维护基线。任何重构、删分支或更换 provider adapter 前，必须检查本表对应测试；不能因为“正常路径更简单”而删除异常分支。

## 1. 统一状态层

执行、输出、身份、可采纳性必须分开：

- `execution.status`：`succeeded`、`failed`、`timeout`、`cancelled`、`blocked`。
- `output.status`：`valid`、`invalid`、`truncated`、`missing`。
- `identity.host`：`verified`、`declared`、`unknown`；`identity.backend`：`verified`、`inferred`、`unknown`；`identity.same_source`：布尔值。
- `eligibility.selection_eligible`：只有正式异源、输出有效、contract/receipt完整时才为 true；wh-review 再映射为业务采纳状态。

`execution.succeeded` 不能替代 `selection_eligible=true`。

## 2. 错误代码与策略

| 错误 | 含义 | 默认处理 |
|---|---|---|
| `CONFIG_INVALID` | 配置结构或值非法 | spawn 前失败，不重试 |
| `CONFIG_SNAPSHOT_CHANGED` | 当前 request 运行期间配置/profile 改变 | 失败，等待新 request |
| `REQUEST_HASH_MISMATCH` | Broker 重算的 input/contract hash 与 request 不符 | spawn 前拒绝 |
| `PROVIDER_NOT_FOUND` | binary 不存在 | 记录并 fallback |
| `VERSION_UNSUPPORTED` | CLI 版本不支持 | 记录并 fallback |
| `BINARY_CHANGED` | probe 后 binary 被替换 | 不执行 |
| `AUTH_REQUIRED` | 未登录或 key 缺失 | 不重试，fallback |
| `AUTH_INTERACTIVE_BLOCKED` | provider 等待交互认证 | 禁止无限等待，fallback |
| `NETWORK_DNS` | DNS/网络不可用 | 共享 deadline 内有限重试 |
| `RATE_LIMITED` | 429/配额限制 | 尊重 Retry-After，有限重试 |
| `PROVIDER_5XX` | provider 服务端错误 | 有限重试 |
| `TIMEOUT` | 超过 provider/request deadline | kill process group，fallback |
| `CANCELLED` | 用户或 Host 取消 | kill process group，不重试 |
| `INPUT_TOO_LARGE` | prompt/material 超预算 | 不分块、不重投，交给 wh-review 裁剪 |
| `OUTPUT_INVALID` | JSON/schema 无效 | 有 session 时 JSON repair 一次 |
| `OUTPUT_TRUNCATED` | stdout/stderr 或 provider 输出截断 | 有 session 时 repair 一次 |
| `MISSING` | `CONTINUATION_FAILED` 的 detail code；session ref 不存在 | 禁止 silent fresh |
| `EXPIRED` | `CONTINUATION_FAILED` 的 detail code；session 已过期 | 禁止 silent fresh |
| `REJECTED` | `CONTINUATION_FAILED` 的 detail code；provider 拒绝复用 session | 禁止 silent fresh |
| `CONTINUATION_FAILED` | continuation 聚合错误 | 必须带 `detail_code`，不自动 fresh |
| `BINDING_MISMATCH` | `CONTINUATION_FAILED` 的 detail code；provider/model/profile/manifest/receipt 不匹配 | spawn 前失败 |
| `CONFIG_CHANGED` | `CONTINUATION_FAILED` 的 detail code；continuation 绑定的配置/profile 不一致 | spawn 前失败 |
| `BUSY` | `CONTINUATION_FAILED` 的 detail code；同一 session 并发 | 有界等待，不能抢活锁 |
| `RUNTIME_PERMISSION` | EACCES/权限不足 | 失败，保留诊断 |
| `RUNTIME_UNAVAILABLE` | ENOSPC/EROFS/磁盘不可写 | 失败，不能覆盖旧成功 |
| `RUNTIME_CORRUPT` | manifest/state/hash 损坏 | fail closed |
| `REPLAY_DETECTED` | receipt/request nonce 重放 | 拒绝 |
| `HOST_UNKNOWN` | Host provenance 无法验证 | 仍执行，但不可 eligible |
| `SAME_SOURCE` | provider 与 Host 同源 | 排除，不启动 |
| `BLOCKED_BY_HOST` | managed policy 阻止外发 | 不重试，不伪装 provider 错误 |
| `SECRET_REDACTION_FAILED` | 输出疑似含 secret | 禁止发布，保留隔离诊断 |
| `REPORT_PROJECTION_FAILED` | wh-review 边界投影失败，不是 provider execution 错误 | 保留私有 Broker receipt，由 wh-review 单独处理 |
| `UNSUPPORTED` | `CONTINUATION_FAILED` 的 detail code；provider 尚无真实 continuation contract | 明确失败，不 fresh |

Continuation 对外只使用顶层 `CONTINUATION_FAILED`；`UNSUPPORTED`、`BINDING_MISMATCH`、`CONFIG_CHANGED`、`MISSING`、`EXPIRED`、`REJECTED`、`BUSY` 是稳定 `detail_code`。普通 provider failure 不得伪装成 continuation failure。

## 3. 恢复规则

只允许以下恢复：

1. 网络、429、5xx：在共享 request deadline 内有限重试。
2. 已有 session 的暂态失败：同 session resume 一次。
3. 已完成分析但 JSON 非法：同 session 只请求 canonical JSON 一次。
4. 任何 retry/resume 不得重新发送完整旧材料。
5. 没有 session、session 过期或 provider 不支持：不能自动 fresh。
6. fresh 必须由 wh-review 以明确 `start_fresh` reason 发起。
7. provider 已成功但 persistence 失败：保留成功结果，只附 continuation warning。
8. timeout、cancel、SIGTERM：终止整个 process group，等待子进程回收。

## 4. 资源和并发

- stdout/stderr 各 10 MiB 上限；超限写 truncated marker。
- 所有运行文件 `0600`，目录 `0700`。
- runtime lock 必须带 owner、pid、process-start fingerprint、lease、token。
- 活进程即使 lease 到期也不能被抢；死进程或 PID reuse 才能安全回收。
- GC 不能删除 active runtime；GC 与 atomic manifest switch 必须有竞态测试。
- ENOSPC、EROFS、EACCES 不能覆盖上一轮成功 receipt。

## 5. 输入和安全

- Broker 有 request/material 上限；wh-review 负责分块、delta 和 stage 预算。
- 不允许 silent truncation。
- request 使用 canonical hash 和 nonce 去重/防重放；nonce 必须出现在 request envelope，并绑定 receipt。
- provider binary 在 probe/spawn 间做 realpath/hash 检查。
- API key 只能通过 CLI 登录态、OAuth、环境变量或 provider config 注入。
- secret 不进入 prompt、argv、stdout、stderr、receipt、报告或 stage-result。
- raw session id/handle 只进入私有 machine receipt。

## 6. 测试要求

每个错误至少有：

- unit/fake test；
- provider contract test（适用时）；
- 不误伤 sibling 成功结果的测试；
- no silent fresh 测试；
- 诊断和最终状态可读性测试。

真实验收报告必须区分：

- 未启动 provider；
- provider 启动但认证失败；
- provider 执行失败；
- 输出非法；
- Host unknown；
- same-source 排除；
- continuation unsupported；
- wh-review 投影失败。

`REPORT_PROJECTION_FAILED` 属于 wh-review 边界诊断，不是 3rd-review provider execution 错误；wh-review 必须保留私有 Broker receipt，并单独报告投影失败。
