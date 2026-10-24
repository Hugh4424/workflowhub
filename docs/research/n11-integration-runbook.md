# N11 真实小任务四段连通

消费者：用户、终末复核者和维护者。唯一入口是当前
`workflows/make-decision/flows/small/SKILL.md`；本次讨论、方案、实施、验收
四段都在 make-decision 内完成，不声称跑过三个独立实施阶段。

## 输入与边界

父任务为 `n11-same-condition-eval-20261022`。P1–P8 已交付事实由各 Phase
当前 Done、原件及最终 P8 交接件
`quality/evidence/2026-10-23-327-p8-final-local-delivery-handoff.json` 回读；
其中历史缺口继续保留，交付不等于全部 AC 通过。
小任务基线固定为 P8 提交 `a7d6035eb0aa67596eca1503254f790c39b80fe5`，
独立工作树为 `/Users/Hugh/Hugh/Project/workflowhub-n11-p9-task-close-cli-fixture-20261023`，
任务库为 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n11-p9-task-close-cli-fixture-20261023`。

用户确认由主会话 owner 逐字转录并标 `conversation_owner_transcript`；
来源线程 `01a165db-68fc-7bd1-874b-f0f393522c4f`，没有平台 export/message id。
普通确认记录保存实际原话、材料 ref 和记录当时 HEAD，不能伪装为平台导出。
不重复询问已确认方案。小任务代码写集仅
`tests/contract/task-close-cli-resolution.test.mjs`，生产 CLI、参数、环境、配置路径不改。

## 四段入口与产出

| 段 | 实际动作与 owner | 可回读产出 |
| --- | --- | --- |
| discussion | P9 原实施上下文回读真实失败、当前 createTask 契约和用户既有决定 | 小任务 quality/evidence/small-materials/decision-log.md |
| solution | 同一上下文用 spec-specify/spec-plan/spec-clarify 原方法核唯一修复、风险与十维边界 | 同目录 spec.md、独立 Phase、纯指针 index；后续必要修订另留原件 |
| implementation | 原实施者修当前夹具，固定同 runner 真实 RED/修复/复测 | 小任务真实 diff、失败/恢复命令及执行记录 |
| acceptance | 逐 AC 读目标测试、真实 diff 和限界 | 小任务验收原件；独立上下文复验另列，不把自述作独立结论 |

## 测试与失败归因

小任务固定 argv 为 `/usr/local/bin/node`、
`/Users/Hugh/Hugh/Project/workflowhub/node_modules/.pnpm/vitest@2.1.9/node_modules/vitest/vitest.mjs`、
`run`、`tests/contract/task-close-cli-resolution.test.mjs`；cwd 为独立工作树。
通过要求 1/1、exit 0、零 Unhandled rejection。初始失败归夹具/setup，
不能冒充生产路径解析故障。每个后续失败保原件，并指到实施或验收段，
注明真实错误、原因与处置；不删断言求绿、不按次数重跑求绿。

父任务测试为 `npx vitest run tests/acceptance/n11-integration-acceptance.test.mjs`，
消费任务库 `quality/evidence/n11-same-condition-eval-20261022/P9-integration.json`。
默认沿现有 `resolveCanonicalTaskPath` 与当前用户配置解析任务库，不把宿主绝对路径
写死进测试，也不把外置 evidence 误读为业务仓 `quality/`。
独立复核可显式传 `N11_P9_EVIDENCE_FILE=/绝对路径/P9-integration.json`
后运行同一 gate；该变量只选择待核报告，不绕过 task 绑定、原件哈希与结果校验。
原件引用须在复核环境可读；缺原件会明确失败，不能把 ENOENT 当目标 RED。
可回读的任务库不会随仓库 clone 自动复制，跨机器需先取得实际 evidence，不能宣称仅 clone 即可复跑。
RED 首次无报告属于缺证据失败；有效目标 RED 另用已有真实报告删 acceptance 段、
将归因改 unknown 的隔离负载，断言必须失败，不能把 ENOENT 当目标行为反例。
同一断言还拒绝模拟任务及 P7/P8 评测原件替代。
GREEN 只证明四段真实原件、命令与归因齐备；不从无错误反推成功。
四段产物必须属于已核 manifest 同一 task 根；目标执行原件必须在实际小任务 cwd，
至少一条明确 exit 0、1/1、无 Unhandled、无 signal/timeout/cancel/truncation。
失败分母从该 task 的真实目标命令回执枚举，逐项与归因精确匹配；
混入别 task 的合法原件、只保失败执行或删一条归因均须被拒绝。

复验只跑本 P9 测试及 P7/P8 两个既有针对性 gate，不重跑模型；
保留 F2P/P2P 分母与真实计数，provider/未读覆盖和复杂路线验收独立披露。
25 条 AC 沿各原 owner 的真实档位逐条引用，P9 不重判上游。

## 交付与保留

本次只允许必要本地提交；不 push、merge、archive 或物理关闭。
临时测试仓没有 remote、真实数据或凭证，用后由测试 finally/afterEach 清理。
必要失败、诊断、TCR 及四段原件保任务库，不做目录快照。
独立任务工作树保留供复核。总阶段 facts、成本和最终 stage-handoff 由主会话写，
本 runbook 不创建第二进度权威。一次小任务不能证明长期效果、其它路线或全部 AC 通过。

## 本次实际修正与限制

唯一正式 OCR 原件为任务库 `quality/reviews/2026-10-23-096-build-code-phase-p9.json`，
两路 completed/parse ok，codex 覆盖仍 undetermined、kimi 部分 read/undetermined，
`read_confirmed=null`；四条测具 finding 按真实根因修复，255 目标 RED、256 GREEN，
不重派追空 findings。原报告保持 immutable；当前25 AC有限判法沿
`quality/evidence/2026-10-23-338-p9-current-25ac-independent-correction.json`，
18 pass、6 incomplete、1 deferred；AC13/15/16/17由336独立意见纠正，
不把用户观看 unknown 推成缺席或新增点击/回复门，也不声称已看过。

实际顺序有偏差：开工前实读 P8 327 与身份/授权，但两份 readiness 实体晚于小任务
执行保存，不能证明“事前就绪件齐备”；337 原件保此时序债。初次241为无报告 ENOENT，
不是目标 RED；247/248 才是具名缺段/unknown 归因负控。小任务本地提交
`b2c04bf89b3c54b1edb16fe63ca31e70403eaaab`，单阶段事实与独立复验均可回读。
