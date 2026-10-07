---
name: build-code
description: 按当前 Phase 合同实施限定改动，保留真实验证结果并处置独立审查发现。
version: 2.2.0
---

# Build Code

## 目标与材料

按当前任务的 spec、独立 `phases/P<n>.md` 和纯指针索引实施最小正确改动；decision-log 给出已确认方向。读取 Phase 正文和当前任务事实选择下一项，游标只是续跑定位，缺失或过期时按实际材料与交付判断。历史材料、旧审查和旧记录只作背景，不重启 pre 工作流或整阶段重跑。

## 方法

1. 先核真实工作区、分支、状态、当前 Phase 和允许写集。接续时读取 `skills/stage-handoff/SKILL.md`，按其路径选择与回读方法消费实际交接、当前材料和 task facts，定位有来源的阶段工作陈述、四类信息、证据与具体未完事项。新会话据此核对当前范围并直接续跑，沿用已有任务授权；缺失或错 task 如实披露，旧对象只读，能够定位的同 task 工作按共享方法继续。记录所依业务规则、接口、FR/AC、消费者、范围、测试路线和停止条件。不能把跨 Phase 整树当本 Phase 完成依据，也不把计划命令当执行事实。
   Phase Card 里再写两行版本锚（给人看的绑定，不是 machine gate）：
   - 规则锚：本 Phase 依赖的业务规则，逐条写「文件 + 章节标题逐字」或「FR/AC 编号 + 该段首句逐字」。不要写整份文件的哈希——材料里与本 Phase 无关的段落变化，不构成本 Phase 事实作废的理由。
   - 材料变更影响：本次实施预计会改动 spec 与本 Phase 材料的哪些段落；不会改动的段落不在本 Phase 的审查与实现范围内。
   材料变化时按两行判断「变的是不是我盯的那一段」：不是，继续并在 handoff 记一句；是，才把受影响实施/测试/审查事实读为 stale，重新核对实际影响，不作机器门。
2. 消费计划已冻结的目标测试与 RED，保留原始失败；需要补行为测试时先写明确 oracle、实跑目标断言失败再实施。纯材料按 G-2 说明检查办法或真实不适用理由。冻结断言改变先走 test change request 和独立审查，不能弱化断言换绿。
3. 在允许文件/符号内做最小实现，错误明确暴露。计划缺口一次列清影响、风险与需 owner 回答的问题，规格/Phase 交 build-plan，方向交 make-decision；不自行改材料。先继续不受缺口影响的安全部分，不能借未知状态猜着越界。
4. 对真实 changed files 用 test-routing-advisor 选择 simple/feature/fullstack，记录与计划相同或改变的理由。选择 backend-testing、frontend-testing 或 fullstack-slice-testing 中适用的一条具体路线，研究真实入口、权限、数据、并发、超时、取消和恢复边界。
5. 跑声明的针对性命令和必要相邻检查，用 `runtime/interface/run-command.mjs` 保存实际 cwd、argv、exit、signal、timeout/cancel、输出和清理事实，原始输出只存单份。只跑受影响测试，不用无范围全量回归代替；环境、收集和配置失败不当成目标 RED，exit0 不自动证明业务通过。
6. 对声明的 command/service 验收执行真实场景，逐项对照 oracle、可观察效果与失败反例。记录每条 AC 的实际结果、原始输出、输入/环境和覆盖限制；真实服务缺失、未执行、部分或不可用保持原样，模拟效果不冒充外部效果。 验收证据人读词表为 pass/fail/inconclusive/deferred/missing/inconsistent/incomplete/unavailable，来源 `runtime/evidence/acceptance-evidence-validator.mjs:6`；本词表只约束人读措辞，不改变现有 writer。未达成如实记为未达成并进失败事实清单，这一条不新增任何推进前置。
7. 检查实际 diff 与声明写集、真实消费者、接口两端、状态、错误传播、并发原子性和资源释放。UI 按组件质量地图与真实页面验证状态和 DTO→ViewModel，浏览器 QA 先用 isolated-browser-qa，保留隔离、取消和自建资源清理事实。来源、样本、场景、浏览器或截图缺失不宣称 UI 完成。
8. 每个 Phase 对当前 diff、完整 AC、实际执行原件和审查重点发起一次独立代码审查。正常使用 OCR；未安装条件和回退见下节。没有额外全 Phase 集成审查点，不为追空 findings 重派未变范围。
9. 主会话保留每条 finding 原文和真实处置。有效问题回原实施会话自动修复，先列受影响 file/case，再只跑该集合并写实际结果；严重问题优先修复，不以请求用户承担风险代替修复。确实无法在当前任务范围内解决时，写清影响、证据、原因和剩余选项，继续不受影响的工作；未处理保持 incomplete。只有已有绑定该 finding 的用户真实决定才可记 accepted_risk，不能自行接受风险或伪造通过。 重试前自述一行并写进本 Phase 的 task facts：「自上次以来我改了什么：<一句话>；失败信号：与上次相同／已变」。
10. 所有实施任务结束后，按计划执行一次最终聚合，逐 AC 对账实现、真实效果、测试和未覆盖项；没有新改动、失败或疑点时不重复运行。最终聚合不证明 review pass，也不替代独立审查。 对账时在独立上下文跑一次 `node tests/acceptance/card-09-session-ledger.mjs`，当场展示时间窗、分账与计数，不落派生文件；修 finding 后只复验受影响 file/case 并写明理由。
11. 用 spec-analyze 对照原始需求、当前材料、实现、测试、发现处置与用户可见结果。实施/事实问题在本阶段修，方向和作者材料仍交对应 owner。缺项明确写未启动、未执行、失败、不适用、unknown 或 unavailable，不用产物存在代替完成条件。
12. 阶段末执行 stage-handoff，写清交付行为、测试和 AC 限制、原始发现与处置、风险及 verify-code 下一步。Phase 的局部交付摘要不触发每 Phase 一次 stage-end/复盘；只在整个 stage 收口时写阶段人读交接。 人读结论用三词：**达成／未达成（写明下一步）／退役**——退役＝这一条不再做、已由决定退出，不用「以后再说」这类模糊说法。

## OCR 能力与回退

检查 `ocr` 命令及 `ocr --version`。只有命令不存在（ENOENT）或版本低于1.12.9，才由 wh-review 执行同一 Phase 代码审查，记录检测输出、fallback 原因、真实执行者、发现和覆盖限制。版本检测的其它错误不能猜成未安装。OCR 已安装但审查失败、超时或被取消时，不回退 wh-review，保留原失败/unavailable；不造空 findings 或自动用其它 reviewer 覆盖它。依赖真实 OCR 的测试在未安装时明确 skip 并报告。

代码审查输入保留 build-code 合同、provider 协议、stageReviewFocus 与所需 lens 正文、当前 diff、完整 AC 及实际执行原件；只搬方法合同，不能重建旧执行流程。材料外发前核范围、路径边界并脱敏私有路径/secret；没有真实只读边界的执行者记不可用。取消、单路失败、迟到 findings 与其它成功路的 provenance 分别保留，不能由首个结果取消其它路或把失败写成通过。

## 人为门与审查点

用户已授权任务进入实施，或已选择方向与实施计划后，该授权持续覆盖本 task 范围内的实施、验证、独立审查、修复及完成交付必要的 commit、push、merge；阶段切换、新会话和 handoff 不重置授权。本阶段直接执行，不要求日常确认、本地提交授权、技术验收确认或用户承担严重风险；新增方向或任务范围不能据此擅自扩大。真实平台权限限制、无法解决的方向问题或外部条件缺失如实报告，继续可执行部分，不另造人工 gate。

authorize 是已有授权的记录与消费工具，不是提问按钮。每次实际 Git 操作前调用 `runtime/interface/git-authorize.mjs`，以真实授权原话及来源绑定动作、范围、当前分支和 HEAD，执行前 record/consume；HEAD 变化时重新核对并记录，不能消费旧 HEAD 记录。仅最终 close（含物理归档、分支/工作区删除及交付清理）前，先展示具体可审查结果、质量限制和操作范围，再取得一次用户确认并按该范围执行。整树丢弃、强推或任务外改动不包含在本阶段持续授权内，不作为常规交付路径。

三审查点是 build-plan 的 wh-review 合并、每 Phase 的 OCR 代码审查、verify-code 终末 OCR 审查；文档建议仍按 wh-review 分工。review/test/history 是质量事实，缺失不能冒充完成，也不禁止同任务安全修复。实施者不自审自判质量。

## 使用技能与收口

按 `skill-deps.yaml` 读取所需方法，重实施、定向验证和独立审查按项目分工委派，修 finding 回原实施会话；主会话裁定范围、记录真实用户选择并汇总。新文件/机制必须有实际消费者、owner、替代关系与删除条件。写入用安全原子写，共享冲突用记录锁，工作区核对和 Git 授权分别负责各自边界；失败原样披露。

阶段主会话执行 `skills/stage-handoff/SKILL.md` 保存交接，报告该方法返回的实际不可变绝对路径。handoff 是人读进度载体，缺失只报告；可总结经验，但不要求固定机器复盘、逐步认证、锁定交接或第二套进度账。正式执行事实由既有公共流程发布，本方法不新增 writer 或推进许可。
