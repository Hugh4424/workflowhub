# Phase 索引 — 现有两页与 v15 的 C12 验收

> 本文件只导航四份实际 Phase 权威，不承载命令、判据、证据或完成状态。
> 每行字段来自对应 Phase 契约头；正文、Task 与执行事实留在原 owner。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-两页验收.md` | `这一 Phase 交出什么？` | `tests/acceptance/c12-two-pages.mjs`、`tests/acceptance/c12-two-pages.test.mjs` | none | Phase 3 更新执行者、Phase 4 报告作者与独立验收者 |
| `P2` | `phases/P2-v15验收.md` | `这一 Phase 交出什么？` | `tests/acceptance/c12-v15.mjs`、`tests/acceptance/c12-v15.test.mjs` | none | Phase 4 报告作者与独立验收者 |
| `P3` | `phases/P3-更新与后续消费.md` | `这一 Phase 交出什么？` | `tests/acceptance/c12-update-chain.mjs`、`tests/acceptance/c12-update-chain.test.mjs` | P1 | Phase 4 报告作者与独立验收者 |
| `P4` | `phases/P4-结论与报告.md` | `这一 Phase 交出什么？` | `specs/workflowhub-ui-frontend-c12-acceptance-20261114/c12-acceptance-report.md` | P1、P2、P3 | 用户、C10 与后续项目复查者 |

## 并行与合并导航（人读指针）

| 组与 Phase | 前置与可并行条件 | 共享路径与先后写主 | 合并点 | 首判与终末 AC 指针 |
| --- | --- | --- | --- | --- |
| 组一：P1、P2 | 输入独立且仓内写集互斥，可并行；共享浏览器仍走各自合法隔离会话 | 无仓内重叠；P1 持有副本并自用服务，停服后才交回；P3 后写同一副本 | 各段交回首判后进入对应下游 | spec Appendix A；P1/P2「这一 Phase 怎么验收？」 |
| 组二：P3 | 必须取得 P1 已核副本、改前身份、使用点与实际引擎；不复用 P1 的服务进程 | Phase 1 先写未改副本，Phase 3 后写唯一令牌行并自建独立服务，最后删除副本 | P3 交回更新与读回状态原件 | spec Appendix A AC-C12-004；P3「Done」 |
| 组三：P4 | 必须取得 P1/P2/P3 实际原件；不重复有效采集，不重跑上游测试 | P4 独占报告，上游证据只读 | P4「验收 Phase 才能做的检查」 | spec Appendix A 全部 AC；P4「Done」 |

冲突回原 writer；本索引不新增协调状态、执行门或第二份验收权威。
