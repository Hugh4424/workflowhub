<!-- migrated from agenthub packages/core/agenthub/skills/3rd-review/verifiers/vibecoding/plan-reviewer-contract.md -->
<!-- wh-review-skills: {"required":["speckit-analyze","plan-eng-review","review"]} -->

# Plan Review 审查合同

> 本文件定义 plan-reviewer 的检查维度。合同外发现只能标 `minor`，不能标 `blocking`。

## 三轴审查

每轮必须覆盖三轴，缺一不可：

| 轴 | 含义 | 对照源 |
|----|------|--------|
| **Traceability** | spec FR 是否完整映射到 task 和 verify | spec.md、plan.md、tasks.md、speckit-analyze |
| **Executability** | phase 粒度、顺序、依赖、风险是否可执行 | tasks.md、plan-eng-review |
| **Verification** | 测试、fresh evidence、gate、approval 是否客观 | tasks.md、review skill output、contract.md |

## Required Skill Execution

审查员必须直接调用：

- `speckit-analyze`：跨 artifact 一致性，覆盖 duplication、ambiguity、underspecification、constitution alignment、coverage gaps、inconsistency。
- `plan-eng-review`：工程计划审查，覆盖架构、数据流、边界、失败模式、测试策略、性能、worktree/并行策略。
- `review`：独立复审 diff/scope drift、TODO/文档过期、结构风险、对抗性检查。

required skill 不可用且 SKILL.md 文件不可读、无法以 report-only lens 执行或输出缺关键结论 → `escalate_to_human`。pass/revise 输出必须含顶层 `skillResults`，逐项记录 executed / unavailable / failed。

**Skill 执行回退规则**：审查员必须先尝试 Skill 工具调用 required skill。如果 Skill 工具在 headless/read-only 环境下失败，必须回退——直接 Read 该 skill 的 SKILL.md 文件，从中提取审查维度和检查清单，独立应用到 plan sources。回退成功时记录 `status=executed`，并在 `mode` 或 `evidence` 标明 `skill-file fallback`。

**三要素执行摘要要求（FR-REVIEW-006）**：每个必需技能的 `evidence` 字段必须包含三要素：（1）**在哪执行** — 会话位置/记录路径；（2）**具体输入/检查点** — 实际检查的内容（如具体文件路径、检查维度）；（3）**结论** — 发现了什么。禁止只写 "已执行"、"通过" 或无具体内容的占位符。

**实质内容最低门槛（FR-REVIEW-007）**：识别空洞摘要的判据如下。凡出现以下任意情形视为空洞，reviewer 必须降级为 `failed`：
- evidence 仅含状态词，无检查位置
- evidence 无具体检查点或输入描述
- evidence 缺少结论内容
- 空洞反例：`{"status":"executed","evidence":"ran speckit-analyze, plan looks fine"}` — 缺在哪执行、无具体维度
- 合规示例：`{"status":"executed","evidence":"(1) skill tool in this session; (2) checked task breakdown for T001-T008 against FR mapping in spec.md; (3) all tasks have FR reference, T005 scope boundary clear"}`
不依赖执行位置路径的自动机器校验——判断由 reviewer 人工核查，不要求路径可访问。

## 总原则

审查重心在计划能不能稳定执行，而不是清单看起来完整。先回答 6 个问题：

1. **phase 划分合理吗** — 每个 phase 能被一个 agent 在合理 session 内独立完成？
2. **依赖链正确吗** — 有没有反依赖？contract/schema 是否先于 engine/adapter/UI？
3. **文件清单精确吗** — 有没有通配符、条件描述、引用式写法？
4. **风险识别了吗** — plan 是否低估失败模式、回滚、性能、测试成本？
5. **Verify 客观吗** — 每步能产生明确 pass/fail，而不是"看起来正常"？
6. **FR 全链路覆盖吗** — 每个 spec FR 都有 task，每个 task 的 Verify 能证明 FR 被实现？

## 增量审查规则

第 1 轮：全量审查，按本合同所有维度出 findings。

第 2+ 轮：

1. 逐条核验前轮 blocking；未修复 → blocking。
2. 只审本轮修改文件和受影响源。
3. 如果触碰 RuntimeAdapter / checkpoint / workflow 边界、forbidden files、跨 package 接口 → 对该模块全量复审。
4. 新 blocking 只能来自本轮新改动、前轮不可能发现的问题、架构/边界触碰；其余 late finding 标 `minor`。
5. 每轮独立会话，只看本轮 `task_id` 对应的 `tasks/{task-id}/` review 材料范围（`task_id` 须匹配 `^[A-Za-z0-9._-]+$`，与 `core/task-dir-parser.mjs` 的校验规则一致）。
6. 第 2+ 轮 `verdict=pass` 时，必须在 `resolutionSummary` 中逐条关闭前轮 blocking：写明原 finding、修复后文件/行号、为什么现在不再阻断。缺 closure summary → 审查不充分，应 `revise_required` 或重新审查。

## 阻断/非阻断分类

**阻断（必须出 revise_required）**：

- `speckit-analyze` 报 CRITICAL/HIGH 且影响执行：constitution MUST 冲突、核心 FR 无 task、artifact 互相矛盾、验收不可测试。
- `plan-eng-review` 报架构/依赖/测试/失败模式不可执行且未处理。
- 宪法门禁未逐条勾选或漏项。
- task 未引用 FR 编号，或 FR → task → verify 链路断裂。
- phase 粒度过大（例如"实现全部功能"）、同一 phase 横跨过多层、超过合理 session。
- Depends On 倒置、循环依赖、[P] 并行标记与依赖矛盾。
- Verify 是主观判断，缺 typecheck/test/build/明确替代检查。
- Verify 命令是"假命令"：退出码被管道吞掉（如 `pnpm test | tail` 当判据）、用臆造 flag（如 `--kind`/`--cmd`）、grep 计数只测 `:0$`、md5/sha256 只录 after 不录 before、`require('xxx.ts')`。
- 修改已有脚本/CLI/journal event/schema 的 task，plan 未在"已有接口签名锚点"登记其当前签名（SIG-xxx），或签名标"待 apply 时确认"。
- 上游合并安全评估未完成，或 forbidden files 未说明。
- Governance change 未给同步矩阵（7 个固定分类逐类判断，标"改"无对应 Task → blocking）。
- UI change 缺 design package/UI contract/affected_contract_element_ids，或写"还原设计稿"而非合同 element——完全无可验收 UI 目标时阻断。
- 计划把 `vibecoding` 硬编码到平台，或新增未批准 fallback、legacy adapter、兼容层、模板市场。
- 验收只验代码不验行为：验收标准只检查代码结构/存在性/编译通过，没有覆盖运行时行为验证 — reviewer 必须标 blocking。纯文档/配置 phase 豁免。
- plan pass 被当成人工 approval，或 phase 间 STOP 机制缺失。
- **概念漂移 [codex ③]**：plan/tasks 引入了新的模式、状态机、实体、fallback、adapter，而 spec/decision-log 找不到来源。不需要重做完整需求审查，只做概念漂移扫描。
- **文件代码影响范围覆盖不全（FR-IMPACT-002/004）**：plan 的文件/代码影响范围未覆盖 spec「业务影响范围」章的每一项受影响功能，或"删除/合并/重命名"类改动缺反向引用扫描（grep 全仓引用未列进改动面），任一漏项 → blocking。审查员须独立核：spec 业务影响列 N 项，plan 文件清单逐项有归宿（改/删/测）。这是防 plan 低估改动面（T018 漏 ~13 文件）的强制杠杆，不接受 pass 直到覆盖全。
- **yagni 级过度设计**：plan 新增了无法映射回任何 FR/验证/治理要求的概念/字段/类型/抽象/依赖，或为单次使用建抽象层、为未覆盖需求做脚手架，且简化不影响交付 → revise_required，并给出可删项与替代方案。
- **KISS 误删红线**：审查建议删除不可简化红线（信任边界输入验证、鉴权/权限/多租户隔离、防数据丢失错误处理、安全/隐私、UI 可访问性、现有 gate/evidence/test 约束）——建议删除这些防护本身即为 blocking。

**非阻断（应出 pass，可标 important/minor）**：

- phase 粒度可合并但仍可执行。
- 风险描述可更具体。
- 复用优先矩阵部分条目偏笼统。
- UI 细节可以更精确但不影响可执行验收。
- phase 六节不完整（缺个别小节）但仍可独立执行。
- 代码改动 phase 第一项不是 test-first，但整体测试策略清楚。
- 文件路径不够精确但执行者能定位。
- 前端 change 视觉合同 6 维度细节缺失，但已有可验收 UI 目标声明。

## 检查维度

| 维度 | 验证方法 |
|------|---------|
| Required Skills 已执行 | 检查 speckit-analyze/plan-eng-review/review 输出；无法执行 required skill → escalate |
| 跨 artifact 一致性 | 对照 speckit-analyze 的 duplication/ambiguity/underspecification/coverage/inconsistency |
| 宪法门禁 | grep Constitution Check 表，无未勾选项；constitution MUST 冲突自动 blocking |
| FR 引用完整 | tasks.md 每个 task 引用 FR；每个 FR 至少一个 task |
| FR→task→verify | 每个 task 的 Verify 能证明对应 FR 被实现 |
| phase 六节格式 | 每个 phase 含 Goal/Files/Tasks/Verify/Knowledge/STOP |
| test-first 排序 | 代码 phase 第一项为 failing test；docs-only 显式豁免 |
| 依赖图 | 提取 Depends On 表，检查顺序、循环、[P] 冲突 |
| phase 粒度 | 检查是否一个 agent 可在合理 session 独立完成 |
| 执行顺序 | contract/schema → engine → adapter → UI/集成，高风险逻辑先测 |
| 精确文件路径 | 禁止通配、模糊路径、引用式写法 |
| 假命令检查 | Verify/gate_cmd 无管道吞退出码、无臆造 flag、grep 计数双向、md5 录 before/after、不 require .ts |
| 接口签名锚点 | 改已有脚本/CLI/event/schema 的 task，plan 已登记 SIG-xxx 当前签名，无"待 apply 确认" |
| 上游合并安全 | plan.md 必须说明是否触碰 forbidden files 和跨 package 接口 |
| Governance 同步 | 检查治理文件矩阵逐项说明改/不改+原因 |
| Knowledge/Checkpoint | 每 phase 更新 `tasks/{task-id}/progress.md`、`tasks/{task-id}/apply/phase-N.md`、`tasks/{task-id}/reviews/` 下 verifier reports（均经 `core/task-dir-parser.mjs` 解析的 task_tracking_root）；最终 test/close artifact 有计划 |
| 验证计划 | 包含项目对应 test/typecheck/build；prompt/docs-only 有替代检查 |
| UI 设计合同 | affected_contract_element_ids、ui-contract.json 回链、合同 element 而非软描述 |
| 视觉合同 6 维 | 字体、间距、颜色、交互态、响应式、暗黑模式逐项存在 |
| 复用优先矩阵 | 可复用已有/需适配已有/必须新增；优先 `@multica/ui` / `@multica/views` |
| Approval 边界 | plan pass 不等于 approval；apply 前必须等待人工 approval |
| 原始需求逐条完整解决（FR-ACCEPT-003） | 对照 intake 原始需求台账/decision-log，**逐条**核验每条原始需求是否在 plan 中被**完整解决**（有对应 phase/task 落地，非仅提及）；任一条无归宿或未核到 → blocking |
| 四类标准可逐条勾（D7/D10，FR-REVIEW-005） | 交付/异常/测试/代码四类标准必须以审查员**可逐条勾的硬条目**形式存在，不各开独立重章节。逐项见下表 |
| 文件代码影响范围覆盖率（D12，FR-IMPACT-002/004） | 对照 spec「业务影响范围」章的每一项受影响功能，**逐项**核 plan 文件/代码影响范围是否覆盖（改/删/测有归宿）；删除/合并/重命名类改动须有反向引用扫描结果。漏一项 → blocking |
| 过度设计审查（KISS） | 用五标签挑可简化处：`delete`(死代码/没被需求要的东西)/`stdlib`(重造标准库轮子)/`native`(该用平台原生特性却引第三方)/`yagni`(单次使用的抽象、为"以后"的脚手架、没被 FR 覆盖的字段/参数/配置)/`shrink`(能更短的冗余写法)。逐条核 plan 每个新增**概念/字段/API/公共类型/跨模块函数/依赖**能否映射回某条 FR 或验证/治理要求；映射不上即标记。局部实现 helper 只需归属 task，不逐函数追 FR。已经精简则明确放行（"够精简，可执行"），不强行挑刺。能合理估算时可给 net 行数变化，估不准就不写 |
| 按需段审查规则 | 审查核心是 **invariant 是否被满足，不是段标题是否存在**。N/A 判定必须对照 spec 业务影响范围、decision-log、代码反向引用扫描、FR→task→verify 链路。实际触发该 invariant 却标 N/A 才 blocking；段落缺失但该 invariant 已在其他段覆盖，不 blocking。落仓库改动却把证据契约/验证策略标 N/A → blocking |

## 四类标准检查维度（D7/D10：可逐条勾硬条目）

> 交付/异常/测试/代码四类标准不各开重章节。合法内核 = 让 done / 边界 / 测试 / 代码引用成为审查员**可逐条勾的硬条目**。下列每条都给出 pass/fail 判据，审查员逐条勾，任一硬条目未满足 → blocking。

| 类 | 可逐条勾硬条目 | pass/fail 判据 |
|----|---------------|----------------|
| **交付标准（done）** | 每个 phase 的 Goal 写出可勾的完成定义（产出哪些文件/行为，非"实现功能"泛述） | Goal 含具体可核产出，能逐条对照 phase 结束态判 done；只写"完成 X 功能"无可勾产出 → blocking |
| **异常标准（边界）** | plan 显式列出本 change 的失败/边界/越权路径处理（不做什么、错误如何暴露、回滚边界） | 关键 failure path 有对应处理且可验证；缺失边界声明或只写 happy path → blocking |
| **测试标准（双栏可跑命令）** | 测试标准落为 plan 的**双栏可跑命令**（gate_cmd 机器判 pass/fail + display_cmd 人眼摘要），治假绿（D8） | 见下方"假命令检查规则"；gate_cmd 退出码被吞 / 臆造 flag / 单向 grep → blocking |
| **代码标准（引用现有规范）** | 仅**引用现有 CLAUDE.md / lint 规则**，不另立代码标准；明确标注 **lint error 是硬门、非 warn** | plan 引用了项目 CLAUDE.md 工程硬规则且声明 lint error 硬门；新立一套代码风格标准或把 lint error 当 warn 放过 → blocking |

## 依赖图校验规则

必须检查 tasks.md 的 Depends On 表：

- 被依赖任务排在依赖任务之后 → blocking。
- 后端契约/API phase 必须在 UI 消费 phase 之前。
- 循环依赖 → blocking。
- 标记 [P] 的任务不可有依赖链。

## UI 与视觉合同规则

前端 change 必查：

- plan.md 为每页面定义 6 维度：字体仅允许指定 token、4px 网格和 gap token、OKLCh 语义令牌、hover/focus/active/disabled + 150ms ease-out、断点、`.dark` 支持。
- Shell/Sidebar/PageHeader 等布局框架检查布局保真：Sidebar 宽度、内容区 rounded/margin、折叠行为、导航高亮。
- 每个 UI task 标注 `affected_contract_element_ids`，回链到 `ui-contract.json`。
- 修改现有 UI 时说明是否影响已有 contract element、是否需要重新提取并 diff。

## Governance 同步规则

修改 workflow、agent prompt 或治理规则时，plan 必须按 7 个固定分类逐类判断（每类"改/不改 + 原因"，标"改"须有对应 Task ID）：

- 项目规则（CLAUDE.md / AGENTS.md / 子包 CLAUDE.md）
- workflow 定义（stage prompts / *.workflow.ts）
- reviewer contract（base-verifier / reviewer prompt / 审查合同）
- schema（journal event / checkpoint / *.schema.json）
- runtime config（.claude/settings.json / 引擎配置）
- knowledge/doc（docs/WORKFLOW.md / constitution.md / Knowledge 规则）
- automation gates / CI / hooks（.github/workflows / pre-commit / reserved-slugs 生成器 / gate scripts）

漏整类、或标"改"却无对应 Task → blocking。

## 假命令检查规则

> 当前引擎只校验 RED/GREEN evidence 的 command/exit_code，不识别 plan 的 gate_cmd/display_cmd 分离。因此"验证命令是否可信"由本审查环节人工强制。

逐条核验 plan.md 和 tasks.md 的 Verify / gate_cmd：

1. **退出码完整**：禁止 `... | tail`、`| head` 等把被测命令退出码吞掉后当 pass/fail 判据；需要管道时必须 `set -o pipefail`。
2. **接口真实**：命令的 flag/子命令必须真实存在，禁止臆造（如 `--kind`、`--cmd`）。存疑时要求 plan 给出该 CLI 的 help/签名出处。
3. **断言双向**：grep 计数断言不能只匹配 `:0$`（单文件返回裸数字不带冒号）；md5/sha256 对比必须先录 before 再录 after。
4. **测试方式正确**：测 TS 用 vitest，禁止 `require('xxx.ts')`。
5. **gate 与 display 分离**：`tail`/`grep`/`jq` 类只能出现在 display_cmd（人眼摘要），不得作为 gate_cmd 的 pass/fail 判据。

快速定位（人工 grep 辅助，命中需逐条确认是否被当成判据）：
`grep -nE 'tail -[0-9]|--kind|--cmd|require\(.*\.ts' plan.md tasks.md`

命中且被当作 pass/fail 判据 → blocking。

## 验证方法

1. **Skill 对照**：逐条核验 speckit-analyze/plan-eng-review/review 的 findings 是否进入 verdict；未真实调用 required skill → escalate。
2. **grep 验证**：FR 引用、phase 六节、test-first、Governance 矩阵、视觉合同 6 维。
3. **读文件**：完整 Read spec.md、plan.md、tasks.md、`tasks/{task-id}/progress.md`，判断执行顺序和 scope。
4. **路径检查**：逐路径 `ls` 或按 repo root 验证，禁止模糊路径。
5. **依赖检查**：解析 Depends On 表，验证顺序、循环、[P]。

## 同 Finding 连续 2 轮升级规则（FR-REV-001）

同一 blocking 连续 2 轮未闭合时，finding 必须包含：

1. 根因。
2. 扫描范围。
3. 反例矩阵。
4. Closure checklist。

第 3 轮仍未闭合 → `escalate_to_human`。

## 修订记录

主 agent 在收到 `revise_required` 后、发起下一轮审查前，必须 append-only 记录失败根因、修改文件、修改摘要、验证命令和结果。reviewer 只读不写；缺修订记录时按证据缺失处理。

<!-- CONTRACT-DEPTH: placeholder, pending 4-item deepening (Blocking/Non-blocking classification list, Structural Quality Gate red lines, FR Consumption Point Scan, Revision Record append-only write protection) -->
