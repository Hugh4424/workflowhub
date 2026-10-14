# Verify Code 最终代码审查合同

审查最终 worktree 的当前代码差异、真实入口、消费者、相关测试与代码风险。
实现方提供 implementation_assessment、test_context、open_risks 和适用验收标准全文；
这些是判断代码主张的上下文，不要求完整历史证据树，也不把材料审计替代代码审查。

## 审查顺序和重点

终末审查核最终实际差异与完整适用 AC；终末面再宽也不改变每 Phase 的对象是本 Phase 的 diff ＋ 本 Phase 承接的 AC。逐 Phase 消费其原件及覆盖限制，旧审查或上游结论不能替本次对象；有结论／无结论加原因分别报告，不因未找到问题追加同 scope 轮次。

固定顺序：代码入口 → 真实消费者 → 接口与状态 → 测试断言 → 实际结果 → 弱 oracle/假绿。
检查跨 Phase 接口、生命周期、并发与取消、资源释放、权限、数据泄漏和真实失败路径。
核对代码是否被实际调用，异常是否可见；重点寻找“测试通过但用户仍会失败”的具体原因。
不要只复述实现，也不要把模拟、绿色命令、缺失质量或旧审查当作当前结果。

读取包内阶段合同、provider 协议、当前审查重点和声明的 lens 技能全文。
实现、diff、适用验收标准和必要上下文应完整；缺少判断依据时报告真实限制，不能假定通过。
只访问列出的包内文件，不访问仓库、Git、网络、宿主路径，不写文件或派其他 agent。

## 执行方式与失败

优先由已安装且符合 ADR-021 最低版本 1.12.9 的 OCR 执行同一代码审查面。
OCR 不可用（命令不存在（ENOENT）或版本低于1.12.9）如实记 unavailable/unknown，不换执行者，保留检测输出与原始失败；版本检测其它错误不推断未安装。architect-code-review 是同源补充轴，独立执行，与 OCR 可用性无关；已装 OCR 失败、超时、取消、无效输出、零成功路或空 findings 均保留原始事实。
不能把失败改写为空 findings。

有结论三条件核对：终末审查原件须同时保留至少一路真实 `completed && parse_outcome === "ok"`、该路发现或空 findings 的原始件引用、未确认项 `material_coverage.undetermined` 与真实 `discarded_facts`（若有；无真实丢弃事实不制造占位）。缺一则报告无结论与原因；三条件齐不表示质量通过，终末审查回执不能替任一承接 Phase 的结论。

OCR 不可用四件齐：检测输出、原始失败、实际执行者、覆盖限制各有具名原件或保留位置，缺项如实说明。`material_coverage` 的 `read` 仅放有可靠读取证据的材料，`unread` 为明确未送达或未打开，`undetermined` 为未报覆盖或读取不可证；不可证一律进 `undetermined` 不进 `read`。`read_confirmed` 未证保持 `null`／不适用，它是现有 provider 结果上的覆盖事实，不是新增 `material_coverage` 键。字段依据与记录身份按 `skills/wh-review/SKILL.md` 的冻结字段清单读取；不得以 OCR 身份记 wh-review 结果，schema 版本不能代替执行者声明。

## 输出与处置

按根因合并重复 finding，保留具体消费者、路径、真实行号和源码证据。
严重 finding 必须包含 root_cause、evidence_kind、evidence；无可靠锚点时说明限制，不猜行号。
只返回 provider-protocol 规定的一个 findings JSON，不输出 pass、阶段判决或完成结论。
不可用≠空≠pass。每个实际代码 finding 由主会话处置；接受具体风险必须有真实用户回复、
明确影响和后果，不能用标签或空结果代替决定。修复不自动触发同主题的再次审查。
