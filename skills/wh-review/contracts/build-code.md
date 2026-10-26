# Build Code 代码审查合同

审查当前 Phase 的完整实现差异、适用验收标准全文、直接消费者与相关测试。
本次对象锚定本 Phase 的 diff ＋ 本 Phase 承接的 AC，按完整当前差异与承接判据追包内直接消费者和必要上下文；整个仓库状态、旧审查或上游 Phase 结论不能代替本次对象。一次审查返回有结论／无结论加原因的真实事实，不因未找到问题追加同 scope 轮次。
只根据本次实际提供的代码和材料判断交付问题；旧审查结果只作历史线索。
审查重点按顺序展开：实现与需求一致性 → 真实入口与消费者 → 接口、状态和生命周期 →
测试断言与失败边界 → 实际结果 → 弱 oracle 与假绿。不得用只看局部文件的结论代表完整实现。

## 必需正文

读取 contracts/build-code.md、contracts/verify-code.md、contracts/provider-protocol.md、
review-instructions.md 中的当前审查重点，以及包内声明的 lens 技能全文。
读取完整当前 Phase diff 和适用验收标准；根据具体问题追到包内消费者、测试和相关上下文。
材料不足时说明未覆盖范围；不得到包外读取仓库、Git、网络或宿主文件，也不得自行派其他 agent。

## 找什么

- 需求是否在真实入口生效，生产者、消费者和接口两端是否一致。
- 并发、取消、资源释放、权限、秘密保护、外部副作用和错误传播是否完整。
- 当前改动是否引入无消费者的机制、重复控制、过度复杂度或隐藏兼容路径。
- 测试是否走到真实分支和失败路径；模拟是否绕过待验证行为。
- 命令成功是否被错误地当成用户结果成功，未执行或不可用是否被误报为通过。

## 审查执行者与来源

复杂任务每 Phase 仍审一次，按 `docs/standard-workflow.md`「三审查点与结论真实性」的 U-020 授权、五个风险面、范围条件与三维取数，消费 `reviewTierFor` 选择执行者；低风险独立子代理，高风险或影响说不清外部 OCR；终末整卡固定外部 OCR 全审。执行者与来源、三维读数写普通审查记录正文，用 `assertReviewTierRecord` 核对。独立子代理留派发身份与上下文隔离，不写 `ocr` 身份或伪造 `provider_results`；外部 OCR 留 route/provider 原ref与真实终态。OCR 不可用仍保检测输出、原始失败、实际执行者与覆盖限制，不换执行者。小改动与普通任务不变；不新增 schema 字段、数字阈值、选择表、动态评分器或第二套审查点。

## 怎样报告

按根因合并重复问题，保留不同消费者或后果所需的具体证据。
每条 finding 给出包内相对路径、真实行号、问题、后果和可执行建议；严重问题还必须给出
root_cause、evidence_kind 和可核对的源码证据。不要猜锚点，也不要以缺少流程记录代替代码问题。
只输出 provider-protocol 规定的一个 findings JSON，不输出 pass、stage 结论或完成许可。
不可用≠空≠pass；空 findings 只表示本轮未提出具体问题，不能证明全部验收或交付完成。

当前代码审查只含 Phase 审查和最终 worktree 审查，不新建 integration 审查步骤。
发现由主会话逐条处理；后续修复只复验受影响行为，不为得到空 findings 重复同一审查。

有结论三条件核对：本次审查原件须同时保留至少一路真实 `completed && parse_outcome === "ok"`、该路发现或空 findings 的原始件引用、未确认项 `material_coverage.undetermined` 与真实 `discarded_facts`（若有；无真实丢弃事实不制造占位）。缺一则报告无结论与原因；三条件齐不表示质量通过。

OCR 不可用四件齐：检测输出、原始失败、实际执行者、覆盖限制各有具名原件或保留位置，缺项如实说明。`material_coverage` 的 `read` 仅放有可靠读取证据的材料，`unread` 为明确未送达或未打开，`undetermined` 为未报覆盖或读取不可证；不可证一律进 `undetermined` 不进 `read`。`read_confirmed` 未证保持 `null`／不适用，它是现有 provider 结果上的覆盖事实，不是新增 `material_coverage` 键。字段依据与记录身份按 `skills/wh-review/SKILL.md` 的冻结字段清单读取；不得以 OCR 身份记 wh-review 结果，schema 版本不能代替执行者声明。
