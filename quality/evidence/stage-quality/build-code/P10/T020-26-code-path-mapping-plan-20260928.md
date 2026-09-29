# P10：26 个未映射可执行文件的最小闭合方案（只读）

## 边界与结论

依据 `T020-current-selection-readonly-20260928/{summary.json,raw.json}`，当时同一认证快照有 217 个改动路径，9 个命中三例目录，208 个未映射。其中 26 个是 CARD-04 自有、尚未映射的非测试 `.mjs` 可执行文件。该快照树是 `4381e90d43a7072ba12d1a4359ba757c3ddd5786`；后续源码与目录已变化，**217/208/26 是该次诊断的分母，执行前必须重新取当前快照**。本文只分析这 26 个，不处置 CARD-05 归档 51 路径及其他 182 个未映射路径。

当前三例业务目录仅登记决策来源普查、验收结果取值与旧语义回归；独立测试登记只含这三例的三个目标。`case-selection.mjs` 对未映射路径会原样保留并使整体为 `unavailable/unmapped_changed_path`。按现有来源，**26 个里没有任何一个能凭现有独立定向回执直接判定可从选择范围排除**。测试通过、源码有测试消费者、或文件属于框架，均不能单独证明“此次变更不影响用户行为”。同一 Task 的 P10 全范围也不能靠这 26 个闭合：其余 182 个仍要另行归属。

## 按行为和消费者合并，避免逐文件造用例

以下四组覆盖 26 个文件且互不重叠。每组是调查与定向执行单元，**不是现成 business case**。只有核实同一规则、真实调用者、正反观察、来源版本、独立 runner 完整身份和 owner 后，才能由 P8/P9/P10 owner 将它登记为一个或数个真实 case；否则保留 `unknown`。

| 组 | 文件（个数） | 实际消费者/可失败业务观察 | 现有证据能证明什么；缺什么 |
| --- | --- | --- | --- |
| A. build-code 自动选、跑、对账 | `workflows/build-code/{capture,case-reconciliation,case-selection,change-scope,targeted-capture,targeted-runner,test-asset-inventory}.mjs`（7） | `capture` 与 `targeted-capture` 调 P9 来源、P8 目录和 P10 执行，对账读 Task 原件。改变任一处，必须能在真实 Task 上看到当前变化被选中、目标按安全参数执行、错身份/漏叶/跳过/进程超时使结论失败。 | P9 旧目标局部 12/12、11/11；P10 选择状态修复有 RED→GREEN 和独立复核，进程树修复也有局部证据。但三目标登记共 49 叶只限三例，未给 A 组七个路径的业务映射；无本轮同一 Task 完整选例/执行/效果回执。需 P8 真实 case、P9 独立目标登记及 P10 同次绑定。 |
| B. Task 身份、资料与交接 | `core/artifact-dir.mjs`, `runtime/stage/{stage-context,stage-handoff}.mjs`, `runtime/task/{task-kernel-implementation,task-store}.mjs`, `tools/cli/task-bootstrap.mjs`（6） | 当前 Task 的创建、资料定位、事实保存及交接。负例是换 Task/树、缺失资料或旧资料仍被读成当前并获通过。 | P3 两目标官方定向 8/8 和当次双 provider 审查零新增发现，能支持其列明的窄路径；不覆盖本组六个文件的所有变更及真实 Task 生命周期。需逐变更调用边、受影响旧回归/跨 Task 旅程和同版本来源。 |
| C. 阶段结果、错误与报告 | `runtime/stage/{completion-predicates,protocol-error-whitelist,stage-agent-outcome-adapter,stage-end-report}.mjs`, `tools/cli/stage-runtime.mjs`, `tools/host/workflowhub-stage-agent-protocol.mjs`（6） | 公共 `stage-runtime` 及阶段行消费这些状态/报告。负例是缺来源、协议错、零例或未完成却写成通过；报告要保留同次证据和例外来源。 | P5 定向 12 通过、6 跳过只是局部检查，旧报告的零例外写入/读取仍有真缺口；其他模块有各自测试文件但无 6 文件同版同次业务闭环。需材料 owner 明确中途报告语义、真实报告正负控和来源绑定。 |
| D. 独立审查 | `runtime/review/{canonical-review-result,ocr-delegation-adapter,review-packet-identity,review-record-route}.mjs`, `skills/wh-review/scripts/{review-materials,simple-review-runner,wh-review-cli}.mjs`（7） | 官方 review 命令及 provider 原件读取这些路径。负例是来源/锚点错绑、provider 失败或报告缺字节仍被写成质量通过。 | P3/P4 有当次官方独立 review 原件；P4 六项发现中包含真实缺口，故不能把“review 已运行”当作这七个路径的回归通过。需审查 owner 确认这七处变化的受影响入口、源材料和目标负控；P4 发现逐项处置后再读回。 |

## 哪些现有回执可以用来缩小工作，哪些不能排除

- P3 当前官方两目标 8/8 与独立双 provider 零新增发现：可作为 B 组中 `stage-context` 等具体检查的**窄证据**，不能认证 B 组六处全部行为，也不能删掉它们的 change trigger。
- P9 三目标独立测试登记、局部回执及 P10 选择状态修复的 RED/GREEN：可作为 A 组安全输入与负例的**起点**，不能把只登记三例推成项目库存完整，不能证明其七条源码变化已被自动选择。
- P5 12 通过/6 跳过及 P4 官方审查：指出 C、D 组待修故障与检查入口，**不是排除回执**。P4 六条发现原件仍在，不能用一份局部绿色覆盖。
- 即使某组后来证明“只改内部格式”，排除也需要同一快照的 owner、实际调用边、可观察行为不变的定向反例、独立审查与书面的适用性裁决。当前目录和 selector 没有受认证的“排除”语义；若要让机器跳过路径，须由材料 owner 先明确规则与测试，不能直接过滤 `changed_paths`。

## 可执行顺序与失败判据

1. 冻结当前 Task 起点、HEAD/工作树树值、材料版本和完整差分；保留这次 217/208 原件，得到新的当次分母。对 A/B/C/D 每个文件记真实调用者、owner、受影响规则；不靠扩展名决定排除。
2. 先做 A：由 P8 目录 owner 按真实规则建立自动选择/执行/对账 case（可能少于七例）；P9 独立测试 owner 登记受影响的完整 runner 叶身份，保留三例之外 `unknown`；P10 用固定入口实跑、逐例读取 raw/receipt/业务效果。**反例**：留下一个确有调用者但未登记的 A 组路径，整体必须仍 `unavailable`，且原路径列出；错 Task/旧树、0 叶、漏叶、跳过、子进程残留均不能 pass。
3. 对 B/C 用当前 Task 的创建→阶段执行→交接/报告旅程，并定向覆盖错身份、旧材料、缺报告和错误状态。已有 P3 回执只复用其确切检查；P5 报告语义待材料 owner 定稿。**反例**：故意错绑 Task 或删同次报告来源，阶段不能宣称完成。
4. 对 D 用官方 review 入口和原件，分别注入坏锚点、provider 失败/超时、缺审查原件；与 P4 六项发现的真实/误报/未决处置逐项对照。**反例**：任一失败不能被转写为“审查通过”。
5. 四组的真实 case/目标/负控通过后，同一快照重选、定向运行、核原始输出与 Task 事实；再处置其余 182 条。最终不能仅靠 26 条局部结论宣布 P10 或整卡完成。

## 本卡独立无法完成的部分

本备忘录不能替 P5 材料 owner 决定中途报告的“无例外”表示法，不能替其他卡的归档 owner 裁决 CARD-05 的 51 条，也不能从当前三例目录推断两边都没登记的旧业务已覆盖。真实页面/服务是否存在及其浏览器结果要由 P11 当前消费者调查；没有消费者证据前既不能填 N/A，也不能填通过。P12 的业务方验收答复必须来自授权人，测试回执无法代答。

来源：`T020-current-scope-disposition-readonly-20260928.md`、`T020-current-selection-readonly-20260928/raw.json`、当前 `docs/quality/{business-case-catalog,test-asset-registry}.json`、`workflows/build-code/{case-selection,change-scope}.mjs`、`docs/architecture/test-asset-inventory.md`、P8/P9/P10 材料。本文没有运行测试、没有修改目录/材料/代码/Task facts，也不产生质量通过结论。
