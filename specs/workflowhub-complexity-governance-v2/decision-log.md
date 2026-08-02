# Decision Log

## 原始需求

在当前 `main` 上按 WorkflowHub 标准流程治理自身复杂度。保留五阶段和交付质量，删除只制造
运行阻塞、维护成本和状态排列组合的机制。每项删除都必须证明不会损害质量。最终要有完善、
但不过量的测试，证明正常开发、材料修订、失败处理、正式产物和 Multica 使用都可靠。

来源：`requirements/ledger.json` 的 R-01 至 R-12，以及三轮 talk 与 grill 的正式记录。

## 目标

把 WorkflowHub 从“历史状态驱动”收敛为“当前材料 + 当前代码 + 追加质量事实 -> 派生正式
发布”，减少公开命令、持久对象、schema、目录和测试矩阵，同时保持交付质量。

## 范围

- 五个 stage、stage/skill、Runner、TaskHandle、正式写入、审查、验收、Multica bundle。
- `core/`、`scripts/`、`schemas/`、`workflows/`、`skills/`、`templates/`、`tests/`、迁移与文档。
- `node_modules` 的仓库与发布边界。
- 全部 tracked 文件的 `KEEP / MOVE / MERGE / DELETE / GENERATE / ARCHIVE` 盘点。

## 非目标

- 不降低真实测试、逐 AC、独立审查、人工确认和不可逆操作授权。
- 不重放 KnowledgeDigest、PaperBuilder 事故。
- 不以连续完成十个真实业务任务作为验收。
- 不建设第二套编排平台，不扩展 Multica 宿主功能。

## 决定

### 保留五阶段，删除阶段外的许可状态机

- Schema: `decision-entry.v1`
- 问题与最终选择：WorkflowHub 是否通过删 stage 来简化？最终选择：保留
  `make-decision -> build-spec -> build-plan -> build-code -> verify-code`。
- 推荐状态：推荐。五阶段分别回答方向、规格、计划、实现和独立验证，职责稳定且直接影响质量。
- 大白话说明：主流程不砍；砍的是让主流程反复证明“能不能继续”的旁路状态机。
- 来源类型与原文：原始需求，`requirements/ledger.json#R-02`；“既要保证 workflowhub 的
  交付质量，还需要极大的减少整个 workflowhub 的复杂程度。”
- 批准状态与绑定：方向已在 talk 中固化；最终批准待 make-decision 人工确认。
  绑定 `interaction-completion.talk-0001.json`。
- 事实与约束：五阶段是产品边界；事故来自 checkpoint、reopen、rebind、recovery、reset、
  generation、invalidation、revalidation 和 trace 的组合，不是 stage 数量。
- 推理：质量职责需要保留 -> 五阶段边界稳定 -> 删除旁路许可状态 -> 降复杂度但不降质量。
- 选择理由：直接针对根因，避免为减少目录而破坏交付。
- 影响：所有 workflow、Runner 命令、状态模型、测试与文档。
- 后果：stage 名称和人类确认点保持稳定；内部实现可以大幅收敛。
- 风险：旧任务依赖专用恢复记录；必须提供只读兼容或一次性导入。
- 拒绝方案：合并成一个万能 stage，职责和验收不可读；保留所有现状，只会延续阻塞。
- 未决项：具体删除批次由 build-plan 依赖图决定。
- Supersedes: none。

### 四份材料是当前真相，只有一种 material revision

- Schema: `decision-entry.v1`
- 问题与最终选择：当前工作由谁决定？最终选择：
  `decision-log.md / spec.md / plan.md / tasks.md` 加当前 Git tree。
- 推荐状态：推荐。人和工具都能直接读取，不需要重放历史状态来获得编辑许可。
- 大白话说明：要继续工作，看现在的四份文档和代码；旧收据只用来审计，不拦住修订。
- 来源类型与原文：既定方案与代码调研，`requirements/ledger.json#R-03`；
  “四材料是工作真相；事实追加，ready/stale 计算。”
- 批准状态与绑定：方向已固化；最终批准待人工确认。绑定
  `interaction-completion.talk-0002.json`。
- 事实与约束：仓库已有 `task-material-revision.v1`，却又并存 requirements pointer、
  accepted checkpoint、reopen/rebind/recovery/reset 等 current selector。
- 推理：多套 current selector 会冲突 -> 复用唯一 revision -> 其余历史只读 -> 当前状态唯一。
- 选择理由：复用现有最通用机制，比新增统一平台更简单。
- 影响：TaskKernel、stage runtime、requirements、receipt、review 和恢复路径。
- 后果：材料可在同任务内正常修订；旧字节和 hash 仍保留。
- 风险：迁移时如果把历史事实误当成可删除数据会损伤审计；必须先做 consumer 盘点。
- 拒绝方案：继续给每类材料维护 pointer；新建另一个 workflow engine。
- 未决项：legacy import 的最小格式由 build-spec 冻结。
- Supersedes: ADR 0005 的 accepted/checkpoint 材料锁定、ADR 0002 的独立 requirements current pointer。

### 事实追加保存，正式结果从当前事实派生

- Schema: `decision-entry.v1`
- 问题与最终选择：review、test、confirmation、authorization 是否继续当工作许可证？
  最终选择：否；它们是质量事实，publication 每次从当前材料和事实计算。
- 推荐状态：推荐。能保留审计，又不会让旧 head 锁死业务任务。
- 大白话说明：测试和审查证明做得好不好，不决定文档能不能改；真正发布时再一次性核验。
- 来源类型与原文：宪法、事故调研和 grill；`CONSTITUTION.md` F3/F4/Q1/Q2，
  `interaction-completion.grill.json`。
- 批准状态与绑定：grill 已核实；最终批准待人工确认。
- 事实与约束：正式写入仍必须认证 TaskHandle、tree、材料、测试、AC、审查与确认，任何错绑
  fail-loud 且不得部分写入。
- 推理：质量事实有价值 -> 保留原字节 -> 不把事实变许可证 -> 发布时统一派生 -> 既可审计又可恢复。
- 选择理由：同时满足 append-only 和正常修订。
- 影响：publication、audit、review flow、stage completion。
- 后果：删除专用 reopen/rebind/recovery/reset/generation/invalidation/revalidation/trace supersession。
- 风险：派生逻辑若含糊会静默放行；必须把完成谓词写成少量、直接、可失败的检查。
- 拒绝方案：覆盖旧记录；让 provider verdict 自动决定 stage pass；保留旧状态机。
- 未决项：每个 stage 的最小完成谓词由 build-spec 固定。
- Supersedes: ADR 0008、ADR 0011 及 ADR 0007/0009 的专用 lineage/pointer 部分。

### 每次删除都需要删除证明卡，并按垂直切片执行

- Schema: `decision-entry.v1`
- 问题与最终选择：怎样证明大规模删除不降低质量？最终选择：每个候选单独证明，无法证明就 KEEP。
- 推荐状态：推荐。审查 finding 已指出原方案没有定义可判定标准。
- 大白话说明：不是看到“复杂”就删；先找真实使用者，再用同一失败测试证明删前删后都安全。
- 来源类型与原文：用户要求与方向审查 finding `F-6bf98330c313`；
  “每个要删的东西，都要确认不会影响 workflowhub 的交付质量。”
- 批准状态与绑定：用户选择“先修复再继续”；绑定
  `interaction-completion.talk-0003.json` 与 direction review result。
- 事实与约束：证明至少含 consumer/反向引用、保留质量语义、替代路径、删除前后同一负面
  oracle、故障注入、Multica 兼容和 rollback commit。
- 推理：删除风险不可由文件名判断 -> 建立逐项证据 -> 命令/实现/schema/test/docs 一起删除
  -> 避免孤儿和假简化。
- 选择理由：让“质量不下降”成为机器和人都能判定的门。
- 影响：所有删除任务、计划卡、测试、提交和回滚。
- 后果：删除速度变慢，但每批可审查、可回滚；禁止只删测试或只藏入口。
- 风险：证明卡本身可能变成新流程平台；它只作为 build-plan/build-code 的普通任务字段，不建状态机。
- 拒绝方案：按目录批量删除；仅凭覆盖率；只保留 happy path。
- 未决项：无。
- Supersedes: 方向草案中未定义的“逐项证明”。

### 保留不可替代的质量原语

- Schema: `decision-entry.v1`
- 问题与最终选择：哪些东西不能为简化而删除？最终选择：保留 TaskHandle 安全、原子正式写、
  当前材料 revision、调用真实性、新鲜测试、逐 AC、独立审查、严重 finding 处置和人工授权。
- 推荐状态：推荐。这些直接保护身份、数据、质量或不可逆操作。
- 大白话说明：删掉重复流程，不删最后一道真正能挡住错写、假测试和未经授权操作的保护。
- 来源类型与原文：接口调研、宪法和 `requirements/ledger.json#R-04..R-06`。
- 批准状态与绑定：方向已固化；最终批准待人工确认。
- 事实与约束：consumer 调研确认这些能力仍被 final build/verify、TaskHandle 和 Multica closure 使用。
- 推理：真实 consumer 存在 -> 质量语义不可替代 -> 保留原语 -> 在其上简化包装层。
- 选择理由：质量风险与维护成本分离。
- 影响：core、stage handlers、canonical writer、review/AC/test contracts。
- 后果：不会追求“零 schema/零 runtime”；简化目标是少而稳定。
- 风险：保留项内部仍可能重复；后续只能在删除证明成立时继续合并。
- 拒绝方案：只靠 Markdown 和人工自觉；完全移除 TaskKernel。
- 未决项：无。
- Supersedes: none。

### Multica 只发布 Skill Bundle，本地 Runner 独立发布

- Schema: `decision-entry.v1`
- 问题与最终选择：Multica 为什么要携带整个仓库？最终选择：不携带。
- 推荐状态：推荐。Multica 只消费 stage 和 skill；测试、历史迁移和依赖安装属于 Runner/仓库。
- 大白话说明：Multica 拿能运行技能的最小包；开发机保留完整 Runner 和测试。
- 来源类型与原文：用户需求、bundle 反向引用调研，`requirements/ledger.json#R-08`。
- 批准状态与绑定：方向已固化；最终批准待人工确认。
- 事实与约束：Skill Bundle 包含 stage、skill、reference 和必要 schema；`node_modules` 不提交、
  不进 bundle，只由 lockfile 在本地/CI 安装。
- 推理：消费者边界明确 -> 两个发布单元 -> 删除 bundle 中无运行价值的内容 -> 更小且更稳定。
- 选择理由：减少 Multica 安装面，不牺牲本地正式验证。
- 影响：目录、bundle manifest、安装脚本、closure check、README/AGENTS。
- 后果：Runner 与 Skill Bundle 需要明确兼容版本；正式 verify/close 不能只靠 bundle。
- 风险：版本错配；发布时必须做 clean-install 和兼容检查。
- 拒绝方案：把整个 repo 复制进 Multica；在 Git 中保留 `node_modules`；让 Multica 直接运行测试仓库。
- 未决项：兼容版本字段由 build-spec 定义。
- Supersedes: none。

### 测试从状态排列组合收敛为质量谓词与故障注入

- Schema: `decision-entry.v1`
- 问题与最终选择：怎样减少庞大测试而仍能证明交付？最终选择：保留五阶段 E2E、material
  revision、严重 finding、正式写失败、legacy read-only/import、Skill Bundle clean-install，
  删除专用状态机后连同其排列组合测试一起删除。
- 推荐状态：推荐。测试应该证明交付能力，不应为内部状态数量服务。
- 大白话说明：测试少量真实主路径和重要失败，不测试几十种已经删除的“恢复代次组合”。
- 来源类型与原文：测试审计和用户要求，`requirements/ledger.json#R-09..R-11`。
- 批准状态与绑定：方向已固化；最终批准待人工确认。
- 事实与约束：不重放两次事故、不用十个真实业务任务；需要临时目录 E2E、负面测试、故障注入、
  schema/契约检查、Multica clean-install。
- 推理：状态机删除 -> 组合空间消失 -> 按外部质量谓词设计测试 -> 更小且更可信。
- 选择理由：直接对应用户可见交付和失败恢复。
- 影响：测试目录、fixtures、CI、覆盖策略、验收。
- 后果：测试总量下降，但关键失败路径更明确；不以行数单独作为成功。
- 风险：误删唯一 oracle；每个测试删除必须绑定被删能力和替代 oracle。
- 拒绝方案：保留所有旧测试；只测 happy path；用十个真实任务做慢速验收。
- 未决项：最终数量预算由 build-spec 作为复杂度目标，不覆盖质量门。
- Supersedes: none。

### 全文件盘点并把稳定目录约束写入 AGENTS.md

- Schema: `decision-entry.v1`
- 问题与最终选择：怎样避免简化后再次长乱？最终选择：盘点全部 tracked 文件，重构后只把稳定
  目录职责和依赖方向写入 AGENTS.md。
- 推荐状态：推荐。文件级盘点能发现孤儿；稳定规则比易漂移清单更耐用。
- 大白话说明：每个文件都要说清为什么存在；AGENTS 只记“哪类东西放哪”，不记每天会变化的文件表。
- 来源类型与原文：用户需求，`requirements/ledger.json#R-12`。
- 批准状态与绑定：方向已固化；最终批准待人工确认。
- 事实与约束：盘点分类为 KEEP/MOVE/MERGE/DELETE/GENERATE/ARCHIVE；删除仍受删除证明卡约束。
- 推理：无全量盘点会漏孤儿 -> 先建 inventory -> 再重构 -> 用稳定依赖规则防复发。
- 选择理由：兼顾一次治理与长期维护。
- 影响：全仓目录、AGENTS、README、architecture check。
- 后果：build-plan 工作量增加；之后新增目录能被结构检查及时发现。
- 风险：AGENTS 过度详细会再次漂移；禁止写逐文件清单。
- 拒绝方案：只整理当前热点目录；把所有规则塞进 README。
- 未决项：最终目录树在 build-plan 根据 consumer map 决定。
- Supersedes: none。

## 三轮 talk

### Round 1

- 开始队列：真实问题；成功标准；是否需要补充研究。
- 本轮单一决策轴：是否重问已经在用户方案和 V2 调研中确认的方向。
- 处理：三项均已有直接用户要求与现行代码事实，问题数为 0；没有用新问题重复消耗确认。
- 回答后重排：无用户新回答；队列关闭。
- 结论与依据：真实问题是保留质量并删除许可型状态机；成功标准和研究范围已由
  `requirements/ledger.json` 与现行 main 调研覆盖。

### Round 2

- 开始队列：五阶段边界；四材料真相；Multica 发布边界；测试与删除取舍。
- 本轮单一决策轴：是否存在尚未冻结、会改变治理方向的取舍。
- 处理：四项均已有用户明确要求；问题数为 0。
- 回答后重排：无用户新回答；队列关闭。
- 结论与依据：五阶段保留；统一 material revision；Skill Bundle/Runner 分离；删除逐项证明。

### Round 3

- 开始队列：方向审查的 actionable finding `F-6bf98330c313`。
- 本轮单一决策轴：如何把“删除不降质量”变成可判定合同。
- 处理顺序：展示 finding -> 用户选择“先修复再继续” -> 补 deletion proof card。
- 回答后重排：没有其他 actionable finding；无效锚点和 minor 只作为旁证，不增加问题。
- 结论与依据：每项删除必须有 consumer、质量语义、替代路径、同一前后负面 oracle、故障注入、
  Multica 兼容和 rollback；缺一项即 KEEP。

## 调研

- 当前基线约 140 个测试文件、34,813 行测试；39 个状态机相关文件约 12,680 行。
- stage runtime 暴露约 33 个公开命令，复杂度集中在专用恢复、重绑、失效和 lineage 分支。
- `task-material-revision.v1` 已能承担通用材料修订。
- TaskHandle 安全、原子写、final build/verify、调用真实性、独立审查和 Skill Bundle closure 有真实 consumer。
- Multica bundle 不需要 tests、历史迁移、仓库脚本或 `node_modules`。

## grill

- `CONTEXT.md`：changed。删除专用 recovery/reset/trace 术语，新增当前材料、删除证明、垂直
  删除切片和两个发布单元。
- ADR：created。`docs/adr/0012-current-materials-derived-publication.md`。
- ADR 条件：该决定难以逆转；若无上下文，未来读者会疑惑为何历史机制不再参与当前运行；
  它在可审计历史与低复杂度之间有真实取舍，三项均满足。
- 冲突：resolved。新 ADR 明确取代 ADR 0005/0008/0009/0011 和 ADR 0007/0002 的相关部分，
  同时保留确定性身份、历史字节、独立审查与严重 finding 处置。

## 审查处置

- Direction review 原 verdict：`revise_required`，保留不改写。
- 有效 finding `F-6bf98330c313`：accepted。
- 根因：原方案要求逐项证明，但没有定义统一、可重算的删除证明。
- 修复：新增删除证明卡、垂直删除切片、负面 oracle、故障注入、Multica 兼容和回滚要求。
- Provider calls after repair: 0。

## 最终确认

Pending。最终确认只决定是否进入 build-spec，不授权任何删除、提交、合并或推送。

## 拒绝方案

- 删除 stage 或合并成万能流程。
- 保留全部现有状态机，只做目录搬家。
- 新建 replacement 编排平台。
- 用事故重放或十个真实业务任务作为验收。
- 只删测试、只删入口、只看覆盖率或文件行数。

## 风险

- legacy consumer 漏盘点会导致旧任务不可读。
- 派生 publication 若不 fail-loud 会静默放行。
- Skill Bundle 与 Runner 版本错配会造成 Multica 可见但正式验证不可用。
- 删除证明若被实现成新状态机会复发复杂度；它必须保持为普通计划/证据字段。

## 未决项

- 具体目录树、迁移批次、兼容字段和数量预算在 build-spec/build-plan 冻结。
- 每个候选删除项必须在 build-plan 单独给出删除证明；当前阶段不预先宣称可删。

## Supersedes

总括关系见 ADR 0012。历史记录保留只读，不改写原 verdict、receipt、review、confirmation 或 authorization。

## 文档结果

- Changed: `CONTEXT.md`
- Created: `docs/adr/0012-current-materials-derived-publication.md`
- No change needed: `CONSTITUTION.md`, `constitution-checklist.md`

## Exit checks

- 外部接口：Skill Bundle 与 Runner Release 边界已定义。
- 唯一术语：当前材料只由 `task-material-revision.v1` 推进。
- 失败语义：删除证明不足即 KEEP；身份/hash/tree/材料错绑 fail-loud，不得部分正式写。
- 范围与非目标：只治理 WorkflowHub；不降低测试、AC、独立审查、人工确认与不可逆授权质量。
