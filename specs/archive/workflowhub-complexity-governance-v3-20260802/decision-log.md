# Decision Log

## 原始需求

用户要求：查看 `/Users/Hugh/Downloads/workflowhub-complexity-governance-plan-v3-2026-08-02.md`，基于该文件，使用标准 WorkflowHub 流程和用户一起推进方案。用户随后明确回答：**完整落地**。

本决策记录依据的方案文件 sha256：`de3938ce359d281a46da5075ccc1097dcb4b4ef86960aa5544037498d3e7ad59`。该文件记录的基线是 `main@c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`，方案编写时 WorkflowHub 工作区干净且尚未修改。

## 目标

完整实现 V3.2 复杂度治理方案，依次完成 `build-spec`、`build-plan`、`build-code`、`verify-code`。目标是减少 operational lineage、重复状态控制、无价值流程对象和测试排列组合，同时保留五个 stage、四份当前材料、独立审查、质量事实、人工确认、结构 fail-loud 和不可逆操作独立授权。

完成标准不是“改动很多”或“测试变绿”，而是：旧控制机制的消费者已盘点、替代行为可验证、删除有逐项证据、七类公开行为有基线对比、三条最小 E2E 和必要回归通过、逐 AC 可追踪、历史数据不被改写、`verify-code` 给出真实结论。

## 范围

- 完整落地方案 Phase 0–7：冻结与盘点、最小 task 目录、前三阶段切换、实现与验收切换、垂直删除、历史只读盘点、目录与测试收敛、治理固化与最终验收。
- 受影响的 `runtime/`、`tools/cli/`、`core/`/`scripts/` 历史兼容区、`skills/`、`workflows/`、`tests/`、架构文档和治理文档。
- 在当前同一 WorkflowHub task 内修订四份当前材料和实现；不创建 successor、replacement、recovery 或额外任务。

## 非目标

- 不删除五个 stage、Skill Bundle、Local Runner、独立审查、质量事实、三处业务确认或不可逆操作授权。
- 不改变七类公开行为的可观察语义：`doctor`、`status`、`run`、`review`、`verify`、`confirm`、`authorize`；行为保持由 baseline golden evidence、契约测试和 E2E 共同证明。
- 不把 `review unavailable`、旧事实、复杂度超预算或审计缺口写成 `pass`，也不把它们变成继续工作的 gate。
- 不迁移、重写或补兼容层改造历史 task 数据；历史资料只读。
- 不在本次阶段确认中授权 `commit`、`push`、`merge`、`archive`、`cleanup` 或删除分支/工作树。

## 决定

### D1：完整落地，但按 Phase 0–7 分段执行

- **问题与最终选择**：本次做多大？选择完整实现到 `verify-code`，但按方案的 Phase 0–7 分段，每段有自己的检查和事实，不做一个不可审查的 mega-diff。
- **推荐状态与理由**：推荐。完整范围满足用户目标，分段执行降低迁移遗漏和回滚风险。
- **大白话说明**：全部做完，但一段一段做，每段都先证明再进入下一段；仍然是一个 task。
- **来源与原文**：用户真实回答“完整落地”；方案第 448–522 行给出 Phase 0–7 顺序。
- **批准状态与绑定**：待 make-decision 最终确认；用户回答绑定 `host-message://reply/make-decision-round-1-question-1`，Round 3 的独立验收选择绑定 `host-message://reply/make-decision-round-3-question-1`。
- **事实与约束**：方案覆盖仓库多层目录和多套 operational lineage；宪法要求薄核心、fail-loud、独立审查和不可逆操作独立授权。
- **推理**：范围完整 -> 不能只做 Phase 0 -> 分段执行可控制风险 -> 同一 task 保持材料和事实连续。
- **影响**：`spec.md`、`plan.md`、`tasks.md` 必须包含阶段依赖、退出条件、测试和回滚边界。
- **后果与风险**：总工作量大；若没有明确阶段退出条件，仍可能形成半迁移。
- **拒绝方案**：只做设计；只做 Phase 0；一口气改完所有旧链；另建 successor task。
- **未决项**：具体文件级任务和命令由 `build-spec/build-plan` 冻结。
- **Supersedes**：none。

### D2：目标是解决“历史事实被当成继续工作的许可证”

- **问题与最终选择**：这次治理真正解决什么问题？选择解决当前多套 operational lineage、current pointer、review/phase trace 和 replacement 控制混在一起，导致材料小改也触发复杂状态链的问题。
- **推荐状态与理由**：推荐。它直接对应方案审计的根因，不把“实现方案文件”本身当业务目标。
- **大白话说明**：现在的问题不是少一个开关，而是同一件事被存了太多份，旧记录反过来卡住正常工作。
- **来源与原文**：方案第 1 节：“任何历史记录都不能变成继续工作的许可证。”
- **批准状态与绑定**：待 make-decision 最终确认；方向审查实际结果 `pass`，绑定 `reviews/results/make-decision-direction-3a8bd1a6bf0739b9177d7de32e0506b07eef674a-2aa9aaff-8995-410e-be42-30c548cccf50.json`。
- **事实与约束**：当前仓库仍有 material revision、requirements pointer、review-flow event、phase trace、stage content pointer/CAS、receipt replacement 和 predecessor 拓扑等机制。
- **推理**：多套控制链重复建模 -> 维护和迁移成本上升 -> 当前材料与质量事实分离 -> 状态即时派生。
- **影响**：运行时对象、publication、review、测试、目录和治理文档都会受影响。
- **后果与风险**：删除控制链可能误删质量记录；必须保留审查报告、测试摘要、provenance 和 M14–M17 学习数据。
- **拒绝方案**：继续在旧链上增加 selector、snapshot、repair 或 replacement。
- **未决项**：具体机制是否删除必须在 plan 中逐项绑定 consumer、替代、负测和删除证明。
- **Supersedes**：none。

### D3：当前材料决定推进，质量事实决定完成质量

- **问题与最终选择**：什么能决定继续工作？选择以 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 为当前真相；测试、AC、review、confirmation、authorization 只作为质量事实和完成依据。
- **推荐状态与理由**：推荐。符合当前宪法 F3/F4/Q1/Q2，避免把记录变成许可证。
- **大白话说明**：文档齐了就能继续改；测试和审查告诉我们做得好不好，不能拿旧记录锁住修复。
- **来源与原文**：方案第 4.0 节：“推进回答现在能不能继续编辑/执行修复；质量回答现在能不能声称完成。”
- **批准状态与绑定**：待 make-decision 最终确认；grill 记录 `no-change`，绑定 `interaction-completion.grill.json`。
- **事实与约束**：结构错绑、错误 write set、错误 hash 和伪造执行身份必须 fail-loud；质量缺口不能伪装成 pass。
- **推理**：推进、正式写入、完成宣称是三个不同命题 -> 分开判断 -> 简化状态机而不降低质量。
- **影响**：TaskKernel、stage runtime、publication、review 和 verify-code 的完成判据。
- **后果与风险**：系统允许带着质量缺口修复；报告必须明确 `unknown`、`incomplete`、`fail`，不能假绿。
- **拒绝方案**：用 accepted、receipt、checkpoint、review verdict 或历史 snapshot 阻塞正常工作。
- **未决项**：每个 stage 的最小完成谓词由 `build-spec` 明确。
- **Supersedes**：none。

### D4：增加基线行为证据，独立证明公开行为未变

- **问题与最终选择**：如何证明测试与旧 lineage 结构耦合时，重构没有改变七类公开行为？选择在 baseline `main@c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf` 上记录七类行为的 golden 结果，重构后逐项对比，再叠加新测试和 E2E。
- **推荐状态与理由**：推荐。用户在 Round 3 真实选择了该方案，独立性最强。
- **大白话说明**：先把旧版本真实表现拍下来，改完后拿同样的问题再测一次；不能只相信改完后一起改过的测试。
- **来源与原文**：用户真实回答：“增加基线行为证据：在当前 main 基线上记录七类公开行为的 golden 结果，重构后逐项对比，再叠加新测试。”
- **批准状态与绑定**：待 make-decision 最终确认；绑定 `host-message://reply/make-decision-round-3-question-1`。
- **事实与约束**：独立方向审查指出现有测试可能直接消费被治理的 lineage 结构，单独绿测不足以证明行为保持。
- **推理**：测试可能随实现一起迁移 -> 原测试独立性下降 -> 固定 baseline golden -> 新旧逐项比较 -> 再用契约/E2E 验证新边界。
- **影响**：Phase 0、build-spec 的 AC、build-plan 的任务、build-code 的测试与 verify-code 的证据包。
- **后果与风险**：增加前置采集工作和证据维护；golden 只记录公开行为，不冻结内部实现细节。
- **拒绝方案**：只依赖重构后测试；只做三条 E2E；用历史 provider review 替代行为证据。
- **未决项**：七类行为的最小输入、输出规范和不稳定字段过滤由 build-spec 冻结。
- **Supersedes**：none。

### D5：保留质量平面，删除控制平面

- **问题与最终选择**：哪些历史资料可以删除？选择删除 operational successor/predecessor/selector/snapshot lineage/phase trace/historical correction/replacement review 等控制机制；保留审查报告、测试结果、verify 摘要、人工确认摘要、必要原始输出引用、provenance 和 M14–M17 数据。
- **推荐状态与理由**：推荐。既降低运行复杂度，也不丢失“发生了什么”的事实。
- **大白话说明**：删掉会卡流程的链，不删掉能回看质量和学习结果的记录。
- **来源与原文**：方案第 2.4–2.5 节和三方盲审共同结论。
- **批准状态与绑定**：待 make-decision 最终确认；方向审查报告实际保留，未把无效锚点 finding 改写为 pass。
- **事实与约束**：task_dir 保留质量热路径和最小索引；provider 原始输出可进只读 archive；历史 task 不搬、不改。
- **推理**：质量记录回答“发生了什么” -> 控制链回答“是否允许继续” -> 两者分离 -> 只删控制链。
- **影响**：task storage、review、metrics、archive、测试、inventory 和目录治理。
- **后果与风险**：热路径与冷归档边界必须明确，否则会误删报告或重新形成 task gate。
- **拒绝方案**：整目录删除；把所有质量资料移出且不留引用；保留双轨兼容窗口。
- **未决项**：归档索引和新 task_dir 最小结构由 build-spec/build-plan 冻结。
- **Supersedes**：none。

### D6：提交和清理不属于阶段确认

本轮用户已确认按 `build-code` 标准继续；本次材料同步只闭合两个缺口：补齐 T006/T013 的 skill 精确写集，并接受 `PHASE0_BRIDGE_PRODUCTION_FIX` 的已登记 T028→T029 RED/GREEN 范围。该确认不授权 commit、push、merge、archive、cleanup 或 close；其它 accepted risk 仍保持显式 `incomplete`。

- **问题与最终选择**：完整落地是否顺带提交、推送、合并和清理？选择不顺带授权；本次只做到 `verify-code` 结论。
- **推荐状态与理由**：推荐。符合宪法 F7/Q2，避免阶段确认被误当作不可逆授权。
- **大白话说明**：验收通过不等于可以删分支、合并和清理；这些操作另问、另批。
- **来源与原文**：用户对范围的真实回答及方案第 604–611 行授权边界。
- **批准状态与绑定**：待 make-decision 最终确认。
- **事实与约束**：`commit`、`push`、`merge`、`archive`、`cleanup` 需要独立授权；当前工作树和 task 记录可保留。
- **推理**：阶段结论是质量事实 -> 不可逆操作改变外部状态 -> 必须独立授权。
- **影响**：最终交付和 close 流程。
- **后果与风险**：verify 完成后仍会暂停等待 close 授权；这是预期边界，不是失败。
- **拒绝方案**：自动 close；用 `verify-code` confirmation 代替 merge/cleanup 授权。
- **未决项**：最终 close 操作由用户单独决定。
- **Supersedes**：none。

## 三轮 talk

- **Round 1**：用户确认“完整落地”；队列从一个高影响范围问题收敛为无中高影响开放项。
- **Round 2**：方案材料和代码事实已解决方向基线，无额外问题。
- **Round 3**：用户确认增加 baseline golden evidence，解决旧测试可能与 lineage 耦合的独立性风险。

## 调研

已完成：读取 supplied V3.2 方案，核对其 12 路审计、三方盲审、Phase 0–7、删除/保留边界；核对当前 `AGENTS.md`、`CONSTITUTION.md`、`CONTEXT.md`、stage skills、runtime public behavior 和 review material contract。外部网络调研未额外发起，因为本次方向由 supplied plan、当前代码和用户约束决定；该跳过不影响方向判断。

## grill

- `CONTEXT.md`：`no-change`。新增“基线行为证据”属于验收证据，不改变领域术语。
- ADR：`not-needed`。该选择写入当前 decision/spec/plan 即可，不新增长期领域模型。
- ADR 判据：难以反转=false；无背景会意外=false；存在真实取舍=true。
- 冲突：未发现。当前文档的“历史事实只读、质量事实不作推进许可证”与本方向一致。
- 四项退出检查：外部接口定义已核实；字段和路径命名已有唯一来源；失败语义明确；做什么/不做什么已写死。

## 审查处置

方向盲审实际调用 `kimi/k3`、`cursor/grok`、`antigravity/flash`；2 个 provider 返回有效语义结果，`antigravity/flash` 因输出包含私有绝对路径而 `PUBLIC_RESULT_INVALID`，保留为事实。aggregate verdict 为 `pass`，没有把无效输出当成通过。

审查建议中与方向有关的内容已处理：外部方案文件 hash 写入本记录；明确分段执行；把七类公开行为的 baseline golden evidence 纳入成功标准；把保留项和行为不变写成非目标；保留测试与实现可能耦合的风险，不用“测试全绿”替代独立基线对比。

## 最终确认

状态：待用户确认。确认只接受或拒绝本决策方向，不授权 commit、push、merge、archive 或 cleanup。

## 拒绝方案

- 只完成设计，不进入实现：不符合用户“完整落地”。
- 只做 Phase 0：只能给出基线，不能解决治理问题。
- 一次性无阶段删除：无法逐项证明消费者和回滚边界。
- 继续在旧 lineage 上打补丁：延续复杂度根因。
- 只依赖重构后测试：无法独立证明公开行为保持。
- 保留双轨兼容窗口：会留下容易忘记删除的兼容垃圾。

## 风险

- 未识别消费者导致半迁移或生产引用残留。
- 误删审查报告、质量摘要、M14–M17 学习数据。
- baseline golden 记录不稳定字段，导致错误差异或伪稳定。
- 复杂度预算变成新 gate。
- provider unavailable 或 invalid 被错误改写成 PASS。
- 当前 runtime 正式执行入口仍有 legacy writer/vNext 边界，必须在 build-spec/build-code 中先以真实测试暴露并修复，不能绕过。

## 未决项

- 七类公开行为 baseline 的最小输入、输出规范、去噪字段和存储位置。
- 每个 Phase 的精确文件清单、consumer map、删除 proof、回滚点和 focused test 命令。
- 新 task_dir 和 quality archive 的具体 schema/目录契约。
- 当前 runtime legacy writer/vNext 边界的最小修复范围。

## Supersedes

本记录不覆盖历史 accepted records、旧 task 或既有 ADR；它只为本次 V3.2 新 task 建立当前方向。历史记录保持只读。

## 文档结果

`CONTEXT.md`：no change。ADR：not needed。后续 `build-spec` 只在发现领域术语或长期架构决策真正变化时再最小更新。

## Exit checks

- 外部依赖接口真实定义：pass；已核对 `scripts/stage-runtime.mjs` public behavior、stage material contract、wh-review CLI 输入和当前 trusted route。
- 字段/路径唯一来源：pass；四份当前材料、七类 public behavior、plan 文件 hash 和 task artifact 路径均已固定。
- 失败路径/异常语义：pass；review unavailable/invalid、结构错绑、材料缺失、dirty snapshot、测试失败和未授权 close 均保持显式事实或 fail-loud。
- 范围边界：pass；完整落地到 `verify-code`；不自动 commit/push/merge/archive/cleanup；历史 task 只读；质量资料不删除。
