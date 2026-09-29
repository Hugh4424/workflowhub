# T007 source binding 披露加固

来源：P3 审查包中的 P5/T007 跨相位 finding `F-b06de78e4d06`（`needs_corroboration/single_inference`）指出：collector 可读入调用者伪造的 task/snapshot/exit 0 JSON，且只要 output 文件在 `evidenceDir` 内，报告就会列出执行候选。当前 T008 没有认证生产者，也没有 canonical receipt 读者；本次只补诚实披露，不引入认证通过判定。

仅修改 `runtime/stage/stage-end-report.mjs`：`buildStageEndReportFacts` 对所有调用者提供的 `stageResult`/`commands` 固定增加 `not_done` 的 `source_binding: unavailable` 和「来源绑定不可用」覆盖限制，说明 Task/stage/snapshot 与 canonical receipt/output hash 未核。`collectStageEndReportFacts` 通过同一 builder 获得披露；仍保留命令与现存输出为候选，不因 exit 0 认定执行已认证。渲染器此前的 Markdown 单行转义与栏目顺序未改。没有改冻结测试、CLI、stage-runner 或 T008 产物。

- RED：`node quality/evidence/stage-quality/build-code/P5/T007-source-binding-probe.mjs`，exit 1。伪造 `task_id=forged-task`、`snapshot_tree=ffffffff…`、`quality_status=passed`、`execution_outcome=completed`、exit 0，且 `evidenceDir` 内真实存在输出文件。原实现 direct/collect 都缺 `source_binding` 缺口与限制；失败为目标 `AssertionError: direct caller stageResult must disclose unavailable source_binding`，不是 import/setup 错。源码 SHA256 `f67d8792606a076fe29e8f4cbbacf042557fbe50bf4c9e2fa7e1641da84ae2a1`。完整命令、HEAD/tree、测试/探针 SHA、stdout/stderr/hash 在 `T007-source-binding-red.meta.json` 及并列原始文件。
- GREEN：同一 probe exit 0；direct/collect 均有 gap 与 limit，同时 collector 保留 exit 0 和现存输出的**候选**记录。冻结门 `npx vitest run runtime/stage/stage-end-report.test.mjs` exit 0，1 file / 8 tests passed；`node --check runtime/stage/stage-end-report.mjs` exit 0。源码 SHA256 `184e33569d5a5ded8e32d7b1ded228469fce0b547a5139cf6c0d9659be045288`；冻结测试 SHA256 `c6273eb0272b6f12914da2b2dcf15282ae4e471f84f27701325d39b06a376165`，未修改。完整参数、输出、hash 在 `T007-source-binding-green.meta.json` 及并列原始文件。临时伪造夹具均已由 probe 清理。

限制：这是模块输出中的**不可认证声明**，没有验证真实 task 身份、来源 JSON、源码快照或 output 文件字节与官方 receipt 的绑定；T008 仍 `blocked/not_done/G2`。8-it GREEN 只验证冻结模块合同，不证明 P5 阶段已完成、AC-20/21 通过或真实阶段结束报告已投产。
