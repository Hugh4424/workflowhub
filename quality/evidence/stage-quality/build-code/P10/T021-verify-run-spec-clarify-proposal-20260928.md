# P10/T021：`verify` → `run` 来源口径澄清建议（只读）

## 裁决

建议由 post build-plan 的 `spec-clarify` 将本项限定为：**先由 P10 固定受控入口新实跑，再由本次官方 `run` 消费并绑定该份回执及逐 AC 事实**。不得表述为“测试在同一个 `run` 命令内部执行”。这不降低 FR-32/FR-33、AC-32/AC-33 的真实选测、执行、逐例业务观察、失败后修复和新快照重跑要求。

理由：`decision-log.md` D-013（2273–2279）、`spec.md` FR-33（307）和 AC-33（563）均要求“每次当前快照执行”“本次运行”的真实 reporter、回执/快照和旧新证据；没有规定这两个动作必须属于一个 CLI 进程。FR-32（306）明确由 build-code agent 启动固定受控测试入口。`P10.md:83` 明写 agent 单独发起受控 capture；现有公开映射恰是 `verify:execute` → `capture-tests` 与 `run:execute` → `run` 两个命令（`tools/cli/stage-runtime.mjs:2062-2066`）。因此“两命令、同一当前快照、有可认证消费关系”符合原始结果要求。`P10.md:125-127` 所称“同一次官方执行”“P10 固定命令确实产出本次 receipt”、以及“交换同树另一回执必拒”比原始要求更强，且与两命令流程冲突；应澄清而非假装现有链已做到严格同调用执行。

## 可失败的新鲜度与消费证明

完成结论至少同时满足以下条件；任一缺失均保持 `current_execution_unverified`／业务 `unknown`，并保留真实原因。

1. **新实跑**：P10 固定命令从当前 Task 的可信变化、业务库和独立测试库存自动选例；capture 真返回 `dispatch_state=executed`，绝非 `reused`。回执有本轮新 UUID ref 与 `behavior_fingerprint.run_id`，二者与当次 capture 返回一致。`capture.mjs:195-218,314-328` 中 `dispatch_state=executed` 仅是调用内存值，**存档回执里没有该字段**；只读旧回执不得倒推出 executed。跨 `verify`／`run` 进程若缺可信的当次 capture 结果及其回执 ref/hash，须报 unknown，不能靠时间补证。记录的执行证据不是第二份测试结果账本。
2. **固定来源与版本**：回执的精确固定命令及命令 hash、Task/attempt、材料 revision、当前代码树及可信变化范围、目录/库存版本、输出 ref/hash、行为指纹和实际 runner 全身份均与选例输入一致；独立重读原始字节。`run` 对回执内容的现有认证（`stage-runner.mjs:3913-3962`）是必要条件，但单独不证明新鲜度或业务效果。
3. **时间窗口仅作辅证**：capture `started_at` 与 `completed_at` 均须晚于 `run` 启动时读到的**上一条当前 build-code 阶段行**的 `created_at`，且完成早于本次新阶段行 `created_at`。须保存上一行完整 hash；若上一行不存在，改用可信 Task/attempt 起点，否则 unknown。时间戳本身绝不证明消费或同次，不能凭“同树同材料且在窗口内”通过。
4. **本次消费**：可信 `runOfficialStage` 在本次调用内认证输入的 `receipts.tests`，取得 `runStage` 返回的测试与逐 AC quality fact 精确 ref/hash，并读回这次最终阶段行的**完整字节 hash**。在现有 Task `quality/evidence/` 中写一次不可变、内容寻址的来源原件，明确表示“这次 `run` 消费了此 capture 回执”，同时绑定上一行 hash、当前行完整 hash、Task/attempt/树/材料、回执及输出 ref/hash、测试与相关逐 AC fact ref/hash。读者重新读取所有原件，并要求该阶段行仍为当前行；不能只靠 `created_at` 或相同树/材料。来源原件是测试证据，不是进度状态、历史账本或继续工作的许可证。若冻结阶段行又禁止增加任何这类可回读证据，现有事实无法证明本次消费，应保持 unknown。
5. **逐例效果另判**：每个应测 case 与 AC 仍须对 runner 实报身份、业务正反效果、结构和风险逐项判定；未映射变化、缺真实消费者或服务、错目标、跳过/待定/零例、缺业务观察、旧失败未处置，均不得因来源绑定而变 pass。修复后必须从新快照重新选测，保留旧失败和新的邻近回归原件。

对应负控：用同树同材料旧回执代替本轮新 capture 时，新鲜度应拒绝；把另一份**同样在时间窗口内**的回执塞给 `run`，若它确实是本次输入，应通过“被本次消费”的狭义来源判断，但不得伪称它是先前预定的那份——必须再比对本轮可信 capture 返回 ref/hash、选例和预期 runner 身份才可判业务链完整。另测 `reused`、错固定命令、错 Task/attempt/树/材料、坏输出 hash、缺一项 AC fact、逐 AC 原件指向别的回执、旧/替换阶段行 hash、半写来源原件、P5 专属证书冒用；均不能给来源通过。若严格要求“测试在 `run` 内执行”，这套两命令方案不能满足，需先由 owner 规划受信任的私有复合调用，不能改名掩盖差异。

## build-plan owner 最小材料修订片段（建议，未实施）

- `phases/P10.md:121-128` 的标题改为“`verify` 新实跑回执被本次 `run` 消费的来源绑定”。在 123 后加一句：“本项的同次指本次官方 `run` 对**本轮新实跑**回执的消费，并非测试在该 `run` CLI 内执行。”125 的“本次 P10 测试 receipt”改成“本次 `run` 输入且通过上述新鲜度核验的 P10 固定入口回执”；来源字段补上一行完整 hash、当前行完整 hash及可信 capture ref/hash。126 的“P10 固定命令确实产出本次 receipt”改为“本轮独立 `verify` 固定入口真执行，`run` 实际消费精确回执”；127 的“交换同树另一次回执”分拆为“旧回执拒绝新鲜度；窗口内另一回执按是否确为本次输入及本轮预期 capture 分别判断”。保留固定阶段行 schema、P5 证书不可复用、旧原件、逐 AC 业务 oracle 等原边界。
- `phases/P10.md:83` 保留单独 capture 流程，补记 `dispatch_state=executed` 是一次性返回事实，存档重读不得自称 executed。`P10.md` 当前 107 的 `runtime/**` 禁写是旧轮次边界，应指向 121–128 的窄例外，避免互相矛盾。L2 Done 与风险限制要区分“新实跑”“本次消费”“业务效果通过”。
- `phases/index.md:18` 的 P10 权威条目将“本次官方阶段来源绑定”表述为“本轮新实跑回执→本次 `run` 消费绑定”；consumer 列明本次 `run` 和独立只读对账，写集仅承接 P10.md 确认的窄私有发布/读取点。索引只写职责和路径，不写执行进度或历史记录。
- `spec.md` FR-32/33、AC-32/33 的**产品要求正文无需改弱**；在其实施设计/来源边界处加一句两命令定义和上述限制，并更新 P10 的追踪/测试口径。`decision-log.md` D-013 不需新增方向决策。材料修订后，针对性重跑结构与一致性检查，并由独立来源审查语义和写面；这份 memo 不代替审查或用户确认。

## 写面与事实边界

当前 `P10.md:125-127` 的实施描述未解决跨进程如何认证 capture 的瞬时 `dispatch_state=executed`。build-plan owner 必须先实测并定下最小生产路径：复用 P10 固定 capture 的可信返回事实及既有 Task 证据，或为它补一个当次不可变证据，再让官方 run 绑定其精确 ref/hash；不得从任意调用者 JSON 自报 executed。若要改 `capture.mjs`、CLI、阶段生产者、`freshness.mjs` 或 receipt 合同，逐项写明 owner、唯一 consumer、替代关系、删除条件和负控。`P11` 正并行修改 `stage-runner.mjs`/`freshness.mjs`，本建议没有碰它们，也没有改 spec/Phase/index、代码、Task facts 或运行测试。

可证明的上限：新实跑真实发生；本次官方 `run` 使用指定回执和逐 AC 事实；这些证据可被独立读回。它**不能单凭来源证明业务效果正确、所有需求已覆盖、UI 真跑或整张 CARD-04 完成**。
