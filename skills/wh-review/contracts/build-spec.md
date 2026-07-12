<!-- migrated from agenthub packages/core/agenthub/skills/3rd-review/verifiers/vibecoding/design-reviewer-contract.md -->

# Build Spec 审查合同

<!-- wh-review-skills: {"required":["plan-ceo-review","review"],"optional":["plan-design-review"]} -->

> 本文件定义 design-reviewer 的检查维度。合同外发现只能标 `minor`，不能标 `blocking`。

## 三轴审查

每轮必须覆盖三轴，缺一不可：

| 轴 | 含义 | 对照源 |
|----|------|--------|
| **Problem Fit** | spec 是否解决真实、已批准的问题 | SPEC.md、constitution、intake artifacts、plan-ceo-review |
| **Spec Quality** | FR、场景、验收、非目标是否足够进入计划 | spec.md、review skill output |
| **Boundary Safety** | 是否越界、泄漏实现细节、踩 AgentHub/Knowledge/UI 边界 | contract.md、CLAUDE.md、plan-design-review |

## Required Skill Execution

审查员必须直接调用：

- `plan-ceo-review`：premise challenge、scope mode、existing leverage、implementation alternatives、dream state delta、risk review。
- `review`：独立复审设计目标、用户路径、验收边界、diff/scope drift。
- `plan-design-review`：仅在 packet 明确声明 UI scope 时加入依赖闭包并执行，覆盖信息架构、交互状态、用户旅程、设计系统、响应式、无障碍、未决设计问题。非 UI scope 不得伪造该技能结果。

required skill 不可用且 SKILL.md 文件不可读 → `escalate_to_human`。pass/revise 输出必须含顶层 `skillResults`，逐项记录 executed / not_applicable / unavailable / failed。

**Skill 执行回退规则**：审查员必须先尝试 Skill 工具调用 required skill。如果 Skill 工具在 headless/read-only 环境下失败，必须回退——直接 Read 该 skill 的 SKILL.md 文件，从中提取审查维度和检查清单，独立应用到 design sources。回退成功时记录 `status=executed`，并在 `mode` 或 `evidence` 标明 `skill-file fallback`。此回退规则对所有 required skill 通用，无需逐 skill 配置。

**三要素执行摘要要求（FR-REVIEW-006）**：每个必需技能的 `evidence` 字段必须包含三要素：（1）**在哪执行** — 会话位置/记录路径（如 `skill tool in this session` 或 `SKILL.md fallback: path/to/SKILL.md`）；（2）**具体输入/检查点** — 实际检查的内容（如具体文件路径、检查维度）；（3）**结论** — 发现了什么（如 "设计目标与 SPEC 对齐，无漂移" 或 "发现 FR-002 缺失覆盖"）。禁止只写 "已执行"、"通过" 或无具体内容的占位符。

**实质内容最低门槛（FR-REVIEW-007）**：识别空洞摘要的判据如下。凡出现以下任意情形视为空洞，reviewer 必须降级为 `failed`：
- evidence 仅含状态词，无检查位置（如 `"executed: skill ran ok"`）
- evidence 无具体检查点或输入描述（如 `"checked the design"`）
- evidence 缺少结论内容（如 `"result: ok"`）
- 空洞反例：`{"status":"executed","evidence":"ran plan-ceo-review, no issues"}` — 缺在哪执行、无具体检查维度
- 合规示例：`{"status":"executed","evidence":"(1) skill tool in this session; (2) checked FR-001/FR-002 mapping against spec.md lines 12-34; (3) FR-001 covered, FR-002 missing acceptance criteria"}`
不依赖执行位置路径的自动机器校验——判断由 reviewer 人工核查，不要求路径可访问。

## 总原则

审查重心在实质而非格式。先回答 6 个问题：

1. **目标健康** — spec 解决的是 SPEC/用户要求的问题，还是 agent 自己发明的问题？
2. **边界健康** — 模块职责是否清晰到能判断"一段代码放哪里"？
3. **决策透明** — 重要选择是否说明为什么选它而不是替代方案？
4. **可验收性** — Success Criteria 是否产生明确 pass/fail？
5. **SPEC 偏离处理** — 与 SPEC 的差异是否分类为降规格、兼容演进或待人工决策？
6. **原始需求覆盖** — intake 中每个用户问题/决策是否有 FR 或明确"不做"声明？

## SPEC 偏离决策树

发现 spec.md 与 SPEC 不一致时：

- SPEC 未明确规定 → 可作为实现细节差异，不阻断。
- SPEC 有明确规定，spec 降低规格或偏离意图 → `revise_required` 或 `escalate_to_human`。
- SPEC 有明确规定，spec 是更好且向后兼容的演进 → 可 pass，但 finding 标 `spec_evolution: true`，要求 close 时更新 SPEC。

## 增量审查规则

第 1 轮：全量审查，按本合同所有维度出 findings。

第 2+ 轮：

1. 逐条核验前轮 blocking；未修复 → blocking。
2. 只审本轮修改文件和受影响源。
3. 如果触碰 RuntimeAdapter / checkpoint / workflow 边界、forbidden files、跨 package 接口 → 对该模块全量复审。
4. 新 blocking 只能来自本轮新改动、前轮不可能发现的问题、架构/边界触碰；其余 late finding 标 `minor`。
5. 第 2 轮起续跑本 review flow 的首轮 runtime，只看本轮 packet 指定的增量材料。

## 阻断/非阻断分类

**阻断（必须出 revise_required）**：

- 原始需求覆盖不完整：decision-log.md 中的用户问题/决策没有 FR 或明确"不做"。
- spec 引入 decision-log 不存在的核心概念（模式/分支/新状态机/新实体）且未在 spec 中标注来源和理由。
- 设计违反 Coding Discipline 铁律 1（引入需求外概念）：新增类型/函数/模式/状态机/依赖无法映射回 decision-log.md 或 spec.md 的某条决策。
- **声称来源真实存在逐条核验（FR-SRC-TRACE-001，硬指令，双向反查）**：被审 spec 的每个 FR/场景若声称一个决策来源（如"承接 D8"），审查员必须逐条到需求真相源 decision-log 中找到真实存在的对应条目；声称的来源在 decision-log 中搜不到 = 需求外概念 = `blocking`（违反 Coding Discipline 铁律 1）。**反向**：decision-log 里每条要改动已有功能的决策，必须在 spec 的「业务影响范围」章被列出；缺列即 `blocking`。此核验不依赖审查 prompt 是否点了重点——任何一轮都必须逐条做，不得用"粗粒度有对应 FR"代替逐条来源核对。
- scope 漂移：spec 加入未批准目标，或删掉用户已批准目标。
- 用户已批准 scope 被 reviewer 推翻：应降为风险，不得阻断。
- Success Criteria 不能用命令、操作、截图、日志或人工步骤判断真伪。
- spec 把多个独立结果塞进一个 change，或把纯技术切片伪装成 user story。
- SPEC 偏离降低规格或改变 MVP，需要用户/人工决策。
- AgentHub 边界错误：把 `vibecoding` 写成平台主流程、把 Runtime 私有能力写进平台合同、混淆 RuntimeAdapter/workflow/checkpoint/Knowledge、Capability 未按 workflow/stage 判断、deepseek 不作为 server-side verifier runtime、引入模板市场/PPT/research/Gemini 全量接入等延期项。
- 文件放置错误：产品 prompt/workflow ts/schema/types 不在 repo，Spec 不在 `specs/{feature}/`，Knowledge 被当模板真相源，task 路径不是 `tasks/{task-id}/`（task_tracking_root 经 `core/task-dir-parser.mjs` 的 `parseTaskDir()` 解析，禁止硬编码）。
- Spec-Purity 黑名单命中：绝对路径、hook 事件字符串、TypeScript 类型字段、shell 命令行。
- UI scope 没有设计资料、现有页面、截图、Figma 或设计授权，却直接进入实现。
- UI spec 未列关键状态/交互/不可新增元素，或把可交互控件降级为只读展示。
- 验收只验代码不验行为：验收标准只检查代码结构/存在性/编译通过，没有覆盖运行时行为验证 — reviewer 必须标 blocking。纯文档/配置 phase 豁免。
- checkpoint package 缺 stage、artifact、acceptance criteria，或流程推进依赖文件监听而非显式 checkpoint。
- 业务影响范围漏估（FR-IMPACT-001/003）：spec 的「业务影响范围」章漏列会被本需求破坏的已有功能/用户场景/受冲击的业务规则，或整章缺失。审查员须独立核影响是否穷尽（对照 decision-log 改动意图 + 全 spec 受影响功能），漏估即 blocking，不接受 pass。该章只写业务性质，混入文件路径/代码符号按 Spec-Purity 另判。**Grandfather 例外（与 FR-SPEC-003 旧 spec 兼容一致）**：本规则只对新模板（含第 11 章骨架）创建的 spec 生效；新模板生效前创建的旧 spec 合法缺第 11 章，"整章缺失"不对旧 spec 判 blocking——判据=spec frontmatter/创建时间早于新模板，或 spec 章节本就不含第 11 章骨架痕迹。新 spec 漏第 11 章才 blocking。

**验收指标三软门（FR-ORACLE-001/002/003）**：

- **FR-ORACLE-001 分母检查**：spec 中的每个验收指标（Success Criteria）是否写明分母（即 "X/Y 中的 Y 是多少"）？任一指标缺分母（如只写"覆盖率达标"而不写共 N 条中 M 条通过）→ revise_required。
- **FR-ORACLE-002 反向断言成对**：每条行为断言是否同时声明正向（X 必须发生）和反向（Y 必须不发生）？任一断言只有正向、缺反向一侧 → revise_required。
- **FR-ORACLE-003 baseline 来源核验**：spec 引用的任何 baseline 数值或参考值，是否标明来源？实现者自填的来源须有独立确认（非同一人自证）；来源缺失或未独立确认 → revise_required。

**非阻断（应出 pass，可标 important/minor）**：

- scope 扩张类想法：来自 plan-ceo-review 的"还可以做 X"，放入 `scope_expansion: true` 的 minor finding，不影响 verdict。
- 用户已批准 scope 的风险提醒。
- 场景措辞可更明确、兼容性预留偏泛。
- FR 编号不规范（非 `FR-{域缩写}-NNN`）、FR 无场景、用户场景数量不足（复杂需求 <8 条、简单需求 <3 条关键场景）且无合理说明。注：场景数量本身是 minor；缺失败场景或缺边界场景（二者都必须有）才升 blocking（见异常标准）。
- 模块测试边界略粗，但不影响方向判断和 plan 阶段拆 phase。
- design-fidelity-component-contract 缺补充项时按下方规则标 important，不直接 blocking。

## 检查维度

| 维度 | 验证方法 |
|------|---------|
| Required Skills 已执行 | 检查 plan-ceo-review/review 输出；UI scope 时检查 plan-design-review 输出。无法执行 required skill → escalate |
| 问题陈述清晰 | 读 spec.md 概述：一句话讲用户视角问题，不夹实现方案 |
| 原始需求覆盖 | 对照 decision-log.md，逐条映射到 FR 或"不做"声明 |
| 场景覆盖完整 | 复杂需求检查 ≥8 个、简单需求 ≥3 个关键用户/边界/失败/权限场景（**必须含至少一条失败场景与一条边界场景**，缺任一即 blocking；纯数量不足是 minor）；每个 FR 至少一个 Given/When/Then |
| FR 编号规范 | grep `FR-[A-Z]+-[0-9]{3}`，禁止 `FR-001` 平铺编号 |
| 验收可判定 | Success Criteria 必须可命令/操作/截图/日志验证 |
| 非目标明确 | out-of-scope 不得进入 FR；scope 扩张只记 minor |
| 模块测试边界 | 会进 apply / 落仓库（代码·UI·流程·配置）的需求，每个涉及的模块有独立测试边界，能支撑 plan phase 划分；纯讨论/纯说明型任务（第5章标"本期不涉及"）不强制，不因缺测试边界扣分 |
| SPEC 偏离 | 按 SPEC 偏离决策树判断降规格/演进/需人工 |
| AgentHub 边界 | 对照 contract.md/CLAUDE.md 检查 RuntimeAdapter/workflow/checkpoint/Knowledge 职责 |
| 文件放置 | 检查 repo artifacts 与 Knowledge artifacts 的职责分离 |
| UI 设计 | UI scope 时检查设计授权、关键状态、交互、响应式、可操作控件 |
| 设计合同 | 若启用 design-fidelity-component-contract，检查 design-contract.md/ui-contract.json/component_candidates |
| Checkpoint | 检查显式 checkpoint、artifact、acceptance criteria，不依赖文件监听 |
| 四类标准可逐条勾（D7/D10，FR-REVIEW-005） | design 侧的交付/异常标准必须以审查员**可逐条勾的硬条目**形式存在（测试/代码标准在 plan 阶段落地）。逐项见下表 |
| 业务影响范围穷尽性（D12，FR-IMPACT-003） | 读 spec「影响范围」章，独立核本需求影响到的已有功能/用户场景/受冲击业务规则是否列全（对照 decision-log 改动意图）。漏列受影响功能 → blocking。该章只写业务，不写文件路径 |
| 过度规格化审查（KISS spec） | 核 spec 的详细程度是否匹配需求复杂度而非模板长度。用三个 spec 适配标签挑可精简处（ponytail 五标签里 stdlib/native 是代码层、对 spec 不适用，已剔除）：`delete`（死内容：没被本需求要的章节/字段/场景，纯为填满模板而写）/ `yagni`（过度规格化：为"以后可能用到"提前写的实体、数据生命周期、兼容性预留，本需求根本不涉及）/ `shrink`（冗长叙述：问题陈述/背景能一句话讲清却撑成一段，场景注水凑数）。逐章对照 spec 阶梯（这一笔需要存在吗→已有 decision-log/spec 是否已覆盖→更简表达够不够）。发现可精简处标 minor（不阻断）；但**简化不得砍五根支柱**（FR / 验收 / 影响范围 / 用户场景核心含失败与边界场景 / 不做范围）——为压简而删支柱内容 → blocking。spec 已经够薄够准则明确放行（"规格适配复杂度，可往下开发"） |
| 按需章审查规则 | 审查核心是 invariant 是否满足，不是章节是否写满。B 档条件章（背景/模块划分/关键实体/数据生命周期/兼容性预留）未触发对应 invariant 时标"本期不涉及"是合规的，不因"章短/标本期不涉及"扣分；只有**实际触发 invariant 却漏写或敷衍**才判问题。A 档硬门五章缺失或敷衍照常 blocking |

## 四类标准检查维度（design 侧可逐条勾硬条目）

> 交付/异常/测试/代码四类标准不各开重章节。design 阶段只承载**交付（验收）**与**异常（边界场景）**两类可逐条勾硬条目；测试双栏命令与代码标准在 plan 阶段落地（见 plan-reviewer-contract）。每条给 pass/fail 判据，逐条勾，任一硬条目未满足 → blocking。

| 类 | 可逐条勾硬条目 | pass/fail 判据 |
|----|---------------|----------------|
| **交付标准（done）** | 每个 FR 的 Success Criteria 可逐条勾（能用命令/操作/截图/日志/人工步骤判 pass/fail），非"看起来正常"泛述 | 每条 Success Criteria 可客观判定 → 勾；存在主观/无法判真伪的验收 → blocking |
| **异常标准（边界）** | spec 显式列出失败/边界/权限场景（复杂需求 ≥8 场景、简单需求 ≥3 关键场景，**无论简繁都必须含至少一条失败与一条边界场景**），每条有 Given/When/Then | 关键失败/边界场景齐全且可验收 → 勾；只覆盖 happy path、缺失败/边界场景 → blocking（数量放宽不豁免"必须有失败/边界"这条硬底线） |

## Spec-Purity 黑名单

| 类别 | 禁止内容 | 示例 | 验证方法 |
|------|---------|------|---------|
| 绝对文件路径 | 以 `/` 开头的用户/临时路径 | `/Users/...`、`/tmp/...` | grep 路径 |
| Hook 事件字符串 | PreToolUse、PostToolUse、SessionStart | `SessionStart hook` | grep 事件名 |
| TS 类型字段定义 | `interface` / `type` / 字段定义 | `interface X {` | grep TS 语法 |
| Shell 命令行 | capture-phase-evidence.sh 采集 | `apply/evidence/phase-{N}-{MODE}.json` | 读 command 字段 |

## UI 与设计合同规则

如果涉及 UI：

- design-review 只检查 spec 是否提出 UI 验收标准；视觉合同 6 维度由 plan-review 逐项检查。
- 没有设计资料/授权却进入实现 → blocking。
- `design-contract.md` 必须在 `docs/contracts/`；`ui-contract.json` 必须列出本 change 涉及页面 state/element。
- `truth_source: "manual_added"` 的 element/state 合法，但必须建立在提取器生成的基线合同之上。
- `component_candidates` 与 change 范围重叠时，review 必须标注采纳/不采纳。
- 合同来源应为正式提取器 `generateMarkdown()`；手补章节需有 `手工补充` 或 `来源：plan.md` 标记。
- 上述设计合同缺失或错误 → `important`，并给 `requiredFix`；除非会导致无法验收 UI，才升级 blocking。

## 任务目录路径规则

> 迁移自源合同的「Knowledge 路径规则」；路径解析方式已改为 workflowhub 的 `core/task-dir-parser.mjs`，判断标准（禁止硬编码路径、task 目录归属）保持不变。

- 正确 project root 为 `task_tracking_root`，由 `core/task-dir-parser.mjs` 的 `parseTaskDir()` 解析：优先取 `WORKFLOWHUB_TASK_DIR` 环境变量作为直接根，否则回退 `~/.workflowhub/config.json` 的 `task_dir` 字段；若 config 值是全局 Knowledge 根且存在 `Projects/<project-key>/tasks`，解析器返回项目级 task_tracking_root；二者皆缺则 fail-loud（非零退出）。
- task 文件位于 `{task_tracking_root}/{task-id}/`（不得再自行拼接第二套路径方案）；`task-id` 必须匹配 `^[A-Za-z0-9._-]+$`（无路径分隔符、无 `..`），不满足即视为调用方 bug，fail-loud，不得静默纠正。
- 出现绕过 `parseTaskDir()` 解析结果、直接硬编码绝对路径当作 task_tracking_root → `escalate_to_human`。
- 禁止把 repo 内 `specs/{feature}/spec.md` 当 task 目录。

## 验证方法

1. **读文件**：Read decision-log.md、SPEC.md、constitution、spec.md、contract.md、CLAUDE.md。
2. **Skill 对照**：逐条核验 plan-ceo-review/review/plan-design-review 的 finding 是否已纳入 verdict；未真实调用 required skill → escalate。
3. **grep 验证**：FR 编号、黑名单、任务目录路径、验收标准关键字段。
4. **交叉比对**：SPEC/constitution/contract 与 spec.md 不一致时，按决策树定级。
5. **人工判断**：问题陈述、scope、模块边界必须给具体理由和 evidence。

## 同 Finding 连续 2 轮升级规则（FR-REV-001）

同一 blocking 连续 2 轮未闭合时，finding 必须包含：

1. 根因。
2. 扫描范围。
3. 反例矩阵。
4. Closure checklist。

第 3 轮仍未闭合 → `escalate_to_human`。

## 修订记录

主 agent 在收到 `revise_required` 后、发起下一轮审查前，必须 append-only 记录失败根因、修改文件、修改摘要、验证命令和结果。reviewer 只读不写；缺修订记录时按证据缺失处理。
