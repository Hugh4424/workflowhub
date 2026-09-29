# P10/T021 同次来源绑定：独立设计审查（只读）

## 裁决

`T021-same-run-binding-readonly-20260928.md` 正确指出当前阶段行没有测试回执引用，P5 证书也不能用于 P10。但它提出的“官方 `run` 后写内容寻址侧车”，**只能证明这次 `run` 消费了指定旧回执，不能证明测试在这次 `run` 内执行**。即使侧车、阶段行、回执和逐 AC 质量事实的 Task/树/材料/时间/hash 全对，同树同材料的较早回执仍可被传入。内容寻址防止字节被悄悄改写，不证明事件先后或生成者同次。

现行公共 `verify:execute` 和 `run:execute` 是两个独立命令（`tools/cli/stage-runtime.mjs:2062-2066`）；前者在 `workflows/build-code/capture.mjs:356-380` 运行并发布测试回执，后者把调用者给的 `receipts.tests` 交给阶段 handler。`verifyOfficialEvidence` 在 `runtime/stage/stage-runner.mjs:3930-3962` 认证回执和输出的内容与快照；`runOfficialStage` 在 `:4750` 之后通过 `runStage` 发布质量事实并写阶段行，`runStage` 不执行该测试。固定入口 capture 自有随机 `run_id`，还检查 `dispatch_state !== reused`（`capture.mjs:196-218`）；该随机值没有由随后 `runOfficialStage` 在测试前生成并传给 capture，不能反向证明两个命令是同一次调用。质量事实也可能按内容复用旧字节。阶段行的 `created_at` 是时间戳，不是测试调用标识；该行可被下一次同阶段运行替换。

## 最小真实方案，按要证明的事实区分

1. **如果目标是“这次官方 `run` 使用了哪份已运行的测试”**：保留分开的 `verify` → `run`。在可信的 `runOfficialStage` 当前调用中，认证它实际收到的 `receipts.tests`，取得本次 `runStage` 返回的测试和逐 AC 质量事实，再读本次最终阶段行；写一份不可变来源证明，包含完整阶段行 hash（不只 `created_at`）、Task/attempt/树/材料、输入回执 ref/hash、测试输出 ref/hash、当次返回的质量事实 ref/hash。读者重新认证整条链，并要求侧车由这个可信调用点产生、当前阶段行 hash 与侧车相同。将结论命名为“本次 `run` 已消费该回执”，**不得命名为“本次 `run` 新执行了测试”**。同树旧回执的替换负控，若它确实是这次 `run` 的输入，按此较窄合同应通过“被消费”判定；若测试新鲜度另有要求，须单独检查并明确阈值，不能用 `created_at` 冒充调用关联。
2. **如果目标严格要求“测试就在这次官方执行里发生”**：需要同一个受信任私有调用先生成一次性随机执行 ID，再通过固定安全入口执行 capture，将这个 ID 写入 canonical receipt 的行为指纹；只把 capture 在内存中返回且 `dispatch_state=executed` 的结果交给同一调用内的 `runStage`，随后绑定最终阶段行、receipt、输出和质量事实。可在现有 `run:execute` 下加私有编排，不新增公共命令；但必须先协调 capture owner、阶段 producer、receipt 验证器和 P10 材料的写面。不能由外部 JSON 自报 ID 或把两条现有 CLI 命令的时间戳拼起来。若坚持两个独立 CLI 进程，又禁止可信跨进程交接/单次消费记录或阶段行绑定字段，就无法证明严格同次执行，应保持 `current_execution_unverified`。

两种方案都需要可失败验证：同树旧回执在严格方案必须拒绝；正确回执配错当次执行 ID、被复用的 capture、不同阶段行 hash、缺任一逐 AC fact、错 Task/attempt/树/材料、错固定命令、坏输出 hash、半写侧车、阶段行被替换时均保持 `unknown`。真实业务效果仍须独立 oracle，不能因来源绑定就判通过。

## 材料需要澄清

`P10.md:83` 规定 agent 单独发起受控 `capture-tests`；`:125-127` 又要求“当次 `runOfficialStage` 的 P10 测试回执”和同树另一回执不得互借。这两段分别指向“先 verify，后 run”与“同一调用执行”。由 build-plan owner 明确选其一：若接受分开的命令，把 T021 表述为“官方 `run` 对指定测试回执的消费绑定”，并独立写明新鲜度要求；若坚持测试与 run 严格同次，授权上述私有复合调用及必要的 capture/receipt 写面，再做 RED/GREEN。当前不能凭侧车宣称严格同次已完成。

本审查只读产品代码和材料；未改代码、材料、Task facts，未运行测试。
