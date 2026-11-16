# 外部工具兼容矩阵（C10 / 1.0.0）

唯一机器清单为[external-skills.manifest.json](../external-skills.manifest.json)；本文件记录每个工具或路线的固定输入、正反断言、未知与来源，不新增版本服务或第二来源权威。用人读结论时先读本文件，再回任务库原件核对。

边界：以下均为 2026-11-16 本机或隔离夹具的观测。只对具名版本、commit 或调用合同成立，不推广成 `>=` 区间，也不保证其它机器、Windows 或真实服务效果。缺 key、HTTP 401、超时或端点不可达属于配置/权限/环境不可用，不是版本或协议负例。权利状态一律 unknown；catalog 中的许可声明不是本次版本的 grant。

## open-code-review (ocr)

| 项 | 事实与来源 |
| --- | --- |
| 身份/版本 | `ocr --version` → `open-code-review v1.13.10 (7e5ce06c) darwin/arm64`；检测入口为源码仓 `detectOcr`（不随发布包分发） |
| 下限 | 1.12.9；低于或同版本带 prerelease 记为 `not_installed`，不换执行者 |
| 正例固定输入 | PATH 假 `ocr` 输出 `open-code-review v1.12.9` → `detectOcr` 返回 `installed`、版本 1.12.9（本段发布契约测试，源码仓，不随包） |
| 反例固定输入 | 同一探针输出 v1.12.8 → `not_installed` 且 reason 含 `below 1.12.9`；输出非法文本或探针 exit 3 → `unavailable` |
| 未知 | 未验证其它版本的具体审查行为；下限只证明版本门，不证明每次审查效果 |

## Ego browser

| 项 | 事实与来源 |
| --- | --- |
| 身份/版本（分列，不合并） | 本机 helper 只读元数据 `ego-browser 0.6.2.9`、chromium 156.0.8078.74、guide v2.2.0；catalog 的 design-source-extraction 条目记 ego lite 0.6.0.16（旧值，owner=catalog 维护者，本段只读不改）；官方文档样例 macOS app 0.6.3.6 + guide 2.2.1 只作来源 |
| 正例固定输入 | 合法 TaskSpace handle（name 相同、正整数 spaceId、label p1）+ 能证明 `closed_page_label_p1=true`、`closed_page_count=1`、`retained_page_count=0` 的 finish 回执 → 现 consumer 接受（本段发布契约测试，源码仓，不随包） |
| 反例固定输入 | `spaceId='7'` 字符串 → `EGO_WORKSPACE_HANDLE_INVALID`，且 scenario/finish 均未运行；finish 已 resolve 但回执不能证明页关闭 → `EGO_WORKSPACE_CLEANUP_INCOMPLETE`，整体不成功 |
| 未知 | 真实支持区间、真实具名版本完整生命周期、真实 finish 原回执、有源的不兼容 release 均未取得。0.6.2.9、catalog 的 0.6.0.16 与官方样例 0.6.3.6 三个值只按各自来源分列，不连接成 `>=` 区间，也不互相覆盖；本机 metadata 不证明页面/TaskSpace/finish 效果。版本子面保持 unknown，owner 为原独立浏览器执行者/工具 owner |

现 consumer 源为 `skill-bundle/skills/isolated-browser-qa/scripts/browser-qa-session.mjs`（`runOwnedEgoTaskSpace`、handle 与 finish 校验），不另造兼容判断器。

## anysearch cli

| 项 | 事实与来源 |
| --- | --- |
| 身份 | 官方固定 commit `db3d76e5597aec7261257be5322dd211c9d9bb87`；随包 vendored 原字节为 `skill-bundle/skills/anysearch/scripts/anysearch_cli.js`，SHA256 `2f94ff9aa2091234ac225bfe8f16e02a148eba141b49921a8740c2d36ff4e980`；上游无 semver |
| 正例固定输入 | 同一原 JS 执行 `search AAPL --domain finance --sub_domain finance.us_stock --sdp ticker=AAPL -m 2`，隔离传输 stub 记录 payload：`params.arguments.sub_domain_params={ticker:'AAPL'}`、`max_results=2`；裸 JSON 响应 `ok`，exit 0 |
| 反例固定输入 | 真实父 commit `9b0d9e4b81f2ffa3ffe8d8439e015c9df3b4b4b8` 的原 JS 执行完全相同的 argv → `Unknown flag: --sdp`、exit 1，且零传输；当前 JS 收到 HTTP 200 但 body 为 SSE 文本 → `Invalid JSON response`、exit 1 |
| 未知 | 真实服务搜索结果、后端垂直目录存在性、在线配额与 key 效力未验证；只证明该 commit 对本次 `--sdp`/KV 命令的 CLI 合同，不证明某 semver 以下全部不兼容，也不把缺 key 当协议负例 |

仓内配置/安全政策仍要求 key（D015）；上游允许匿名只影响额度，两者分列。

## review provider routes

当前生效配置（用户 3rd-review 路由事实，2026-11-16；不是产品默认，也不是官方样例）：

| 路由 | 出现位置 |
| --- | --- |
| `kimi/pro` | make-decision、build-plan、build-code、verify-code |
| `antigravity/hydrogen` | make-decision、build-plan、build-code、verify-code、build_prd |
| `codex/sol` | make-decision、build-plan、build_prd |
| `codex/terra` | build-code、verify-code |
| `pi/v4flash` | build_prd |

provider/model 定义、账号与额度归 3rd-review 配置；WorkflowHub 只持 `wh_review` 路由。

| 项 | 事实与来源 |
| --- | --- |
| 正例固定输入 | 对每条当前路由：隔离配置在 `providers` 定义该 ID 且 `command=process.execPath`（存在可执行）→ `precheckForActions(['review-full'])` 的 `provider` 检查为 `ok`（本段发布契约测试，源码仓，不随包） |
| 反例固定输入 | 对同一路由：从 providers 删除该 ID → `PROVIDER_NOT_DEFINED`；该 ID 的可执行缺失 → `PROVIDER_EXECUTABLE_NOT_FOUND`；均不换默认 provider |
| 测试入口 | 契约测试从 `workflowHubConfigPath` 读取当前真实路由逐条断言；配置不可读时明确 skip，不用推断或官方样例代替 |
| 未知 | 未执行真实 provider 审查；provider/models 定义与账号权限归 3rd-review owner，真实 401/额度不足属权限/环境，不是版本负例 |

## Claude Code (host)

| 项 | 事实与来源 |
| --- | --- |
| 身份/版本 | `claude --version` → `2.1.322 (Claude Code)`，2026-11-16 本机 |
| 正例合同 | 宿主技能目录 `.claude/skills` 指向 `runner/skills`；接入 dry-run/apply 的合同已由 P2 测试覆盖（本段只读复用） |
| 反例合同 | 目标非空、非符号链接冲突、越界/断链均按 P2 合同拒绝，不覆盖用户值 |
| 未知 | 本段未运行真实 Claude Code 发现/调用；真实宿主调用由 P6 观察。2.1.322 只作版本读数，不声明支持区间 |

## Codex CLI (host)

| 项 | 事实与来源 |
| --- | --- |
| 身份/版本 | `codex --version` → `codex-cli 0.166.0`，2026-11-16 本机 |
| 正例合同 | 宿主技能目录 `.agents/skills` 指向 `runner/skills`；与 Claude Code 共用同一接入计划 |
| 反例合同 | 同上：冲突/断链/越界拒绝，不覆盖用户值 |
| 未知 | 本段未运行真实 Codex 发现/调用；0.166.0 只作版本读数，不声明支持区间 |

## 来源与证据

- 研究来源：任务库文件 `2026-11-16-007-ego-anysearch-compat-research-final.md`（不随发布包分发；按文件名与 SHA256 `d3c21a3a0b8d57a3ef386602842bc747a46330f9706f4faa6f957c0464f68398` 回原任务根读取）。
- 固定输入原件：本段发布契约测试（源码仓，不随包）的 OCR/provider/Ego/anysearch 用例；本次执行原件在任务库（不随包，按文件名 `2026-11-16-35x-c10-p4-*.output` 回任务根读取）。
- 权利：全部 unknown；个人研究范围沿 KR-EVID-001（验收证据规范，源码仓，不随包）。
