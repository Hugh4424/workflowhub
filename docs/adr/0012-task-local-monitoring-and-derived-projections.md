# ADR 0012 — 任务本地监控事实与派生静态投影

- Status: Accepted (2026-08-11)

## Context

M15 要让一个永久静态 HTML 查看所有 project 的 WorkflowHub task 执行事实，同时不维护本地服务。
普通 `file://` 页面不能自动遍历目录，也不能可靠 `fetch` 本地 JSON；多个 task 直接增量改同一全局文件还会并发覆盖。

ADR 0005 已规定：`task_dir` 是外部全局配置名，内部称 `storageRoot`；单任务叶目录称 `taskPath`。
只有 launcher 能解析 `storageRoot` 和派生 `taskPath`，stage/sidecar 只能使用已认证的 `TaskHandle`。

## Decision

监控数据采用三层单向关系：

1. canonical 运行事实只追加到已认证 `taskPath` 的 `facts.jsonl`；`quality/evidence/monitoring/` 只保存支撑这些
   facts 的 source evidence，不建立第二套事实权威。写入沿用 `TaskHandle` 的锁和原子写；每条事实保留
   schema、source/session 标识、coverage、errors 和来源引用。
2. launcher 侧 projector 在 canonical 写成功后，使用 launcher 已解析的 `storageRoot` 和已认证任务身份，
   原子替换 `Projects/<project>/monitoring/tasks/<task-id>.json`。每个 task 只拥有自己的投影文件。
3. launcher 侧全局 projector 持独立全局锁，全量扫描已认证的 project 投影，先从同一批已校验记录原子替换
   `Projects/workflowhub-monitor-facts.jsonl`，再生成并原子替换 `Projects/workflowhub-monitor-data.js`。
   JSONL 保留旧 D11 的跨 task/version 扁平指标输出，并由同一 projector 的 data.js bundler 消费；
   `Projects/workflowhub-monitor.html` 是永久静态消费者，通过 classic script 读取已知 data.js，不遍历目录、不启动服务。

project 和 global 文件都是 derived projection：可陈旧、可删除、可重建，不供 runtime 查找 task、判断身份或推进阶段。
投影失败不得回滚已经写成的 canonical 任务事实；页面必须显示 `generated_at`、coverage、errors 和 stale/partial 状态。
全局文件禁止多个 task 做增量 read-modify-write，只能在锁内全量重建后 rename。

root projector 只扫描 derived monitoring projection namespace，并校验 projection payload 的 project/task 绑定；
这个窄例外不允许它扫描 canonical task 目录、推断 current/latest task 或放宽 ADR 0005 的 task discovery 禁令。

当前 Codex 宿主 transcript 只有在 launcher 显式登记精确路径、`session_id`、格式版本和任务绑定后才能读取；
adapter 必须校验 realpath 与绑定关系。未登记或版本不支持时写 `unknown`/`partial`，禁止按 cwd、时间或
`~/.codex/sessions` 扫描猜测。公开监控事实只保留受控 source/session 引用，不复制 raw transcript。
ADR 0007 对 3rd-review provider 私有 session、broker state 和 raw output 的禁令保持不变；这些来源不进入 M15。

## Considered options

- 固定 HTML 直接扫描所有 task：浏览器没有无授权的本地目录枚举能力。
- 每次手动选择 Projects 目录：需要用户授权，且浏览器支持不一致。
- 启动 localhost 服务：读取可靠，但引入进程、端口和生命周期维护。
- 多 task 增量改一个共享 JSON/JS：并发时会丢更新或暴露半写文件。

## Consequences

project projection 的唯一 consumer 是 root projector；global JSONL 的唯一当前 consumer 是同一 projector 的 data.js bundler；
data.js 的唯一 consumer 是静态 HTML。projection owner
是 launcher-side monitoring projector；若未来改用本地服务或数据库，project/root projection 整层删除，
task-local facts 和 supporting evidence 保留。JS bundle 必须使用固定赋值和安全 JSON 序列化；页面不得把来源文本
直接注入 `innerHTML`。

好处是 task 事实保持单一权威，页面无需服务，project/global 任何损坏都能重建。代价是 launcher 负责一个
投影触发点和全局锁；投影失败时页面可能陈旧，因此陈旧与覆盖状态是产品合同的一部分。

本决定难以随意逆转：它固定了 canonical owner、跨 project 发布边界和静态页面的数据接口。若以后改成本地服务
或数据库，可删除 project/root 投影层，但 task-local canonical 事实继续保留。
