# ADR 0027：测试反馈环运行画像

- 状态：accepted
- 日期：2026-09-11
- 范围：S3 测试反馈环

## 决策

测试反馈使用三属性运行画像：时长上限、能力许可和运行位置。画像的运行时
契约由 `runtime/stage/stage-content-contracts.mjs` 的
`TEST_RUNTIME_PROFILE_NAMES`、`TEST_RUNTIME_PROFILE_LIMITS_MS` 与
`validateTestRuntimeProfile` 提供；`tools/cli/run-checks.mjs` 和
`tools/cli/measure-test-runtime-profile.mjs` 只读取该来源，不再各自复制
`inner`、`medium` 的时长阈值。

`skills/test-routing-advisor` 仍是测试集合的业务路由 advisor，只输出
`simple|feature|fullstack` 和理由。它不声明第二套 runtime profile、能力许可、
worker 上限或时长阈值。这个分工保持 test tier 与 runtime profile 正交；变更边界
不明确时使用更高测试层级。

现行阈值跟随已落地的 runtime contract：

- `inner`：每个文件五次独立运行的最大值，以及集合五次独立进程样本的
  nearest-rank p95，均不超过 60 秒；真实 network、DB、filesystem、subprocess
  调用必须为 0，运行位置为本地 hermetic 环境。
- `medium`：薄真实集合五次样本的最大值和 p95 均不超过 300 秒；允许受控的
  localhost、临时工作区和显式子进程，用来覆盖真实 Git/workspace、argv/cwd、
  raw stdout/stderr、非零/坏输出、进程组取消和端口释放。
- `large`：仅 CI 环境；其时长上限仍由 runtime contract 的无界声明解释，不由
  本 ADR 新增数值。

## 测量与证据

`tools/cli/measure-test-runtime-profile.mjs` 接受固定的 profile JSON、inner/medium
member manifests、`--runs=5` 和输出路径。每个 member 使用显式 argv；每一轮都创建
新的子进程，不依据旧 receipt、内容摘要或 hash 跳过执行。inner 集合按 profile JSON
中解析出的 worker ceiling 做文件级并行，receipt 记录 PID、worker ceiling、实际
worker 数、开始/结束时间、每文件耗时、overlap、exit/signal、raw stdout/stderr
引用与 hash。runner 只清理显式配置的 Vitest transform cache，不清理 OS page
cache；每组第一轮标为 cold observation 并计入统计。

性能 receipt 同时保存机器、Node/Vitest 版本、画像来源及 hash、manifest 及 hash、
五次原始 wall-clock 值、max、nearest-rank p95、阈值、能力观测与限制。能力计数只有
在带 source/ref/hash 且通过 runtime capability proof 时才算 authenticated；缺少认证的
能力计数、工具版本、成员或 raw evidence 时保持 `incomplete`。超时、非零退出、
越过阈值、worker 越界或 inner overlap 缺失保持 `failed`，不漂白为通过。

## 后果与边界

同一画像来源减少 consumer 漂移，但 runtime contract 的变更会影响所有 consumer，
因此必须保留来源 hash 和画像变化的旧值、新值、理由。五次测量只证明固定基准机和
固定 member manifest；不证明 hermetic 替身与真实 medium 边界等价，也不清理操作系统
页缓存。性能事实是质量证据，不是推进许可证；`incomplete`、`unavailable` 和
`failed` 必须原样保留。

## 登记

- owner：S3 test-feedback owner。
- consumer：`run-checks`、S3 performance capture、build-code 的 test facts/readback。
- 验证：S3 inner/medium contract tests、runtime-profile consumer readback 和五轮
  measurement receipt。
- 删除/替代条件：只有经过审查、能提供相同单一来源、真实边界、并行观测和 raw
  evidence 语义的替代画像契约落地后，才可替代本 ADR；不新增兼容双写。
