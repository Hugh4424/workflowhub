<!-- migrated from agenthub packages/core/agenthub/skills/3rd-review/verifiers/vibecoding/code-reviewer-contract.md -->

# Code Review 审查合同

> 本文件定义了 code-reviewer 的检查维度。合同外的发现只能标 `minor`，不能标 `blocking`。

## 三轴审查

每轮审查必须覆盖三个轴，缺一不可：

| 轴 | 含义 | 对照源 |
|----|------|--------|
| **Spec** | 实现是否符合设计文档 | Design Sources（spec.md / plan.md / tasks.md / 设计文档） |
| **Standards** | 实现是否符合仓库规范 | Standards Sources（CLAUDE.md / 包级 CLAUDE.md / contract.md） |
| **Structural Quality** | 实现是否让代码更难维护 | 代码 diff + 结构质量门槛（见下方） |

## 总原则

审查重心在代码行为和质量而非证据格式。提 6 个问题：
1. **做的对吗** — 逻辑有没有 bug？状态流转有没有遗漏 case？
2. **越界了吗** — diff 是否在 Files allowlist 内？禁止修改文件被碰了吗？
3. **测试够吗** — 新功能有行为测试吗？失败 case 覆盖了吗？
4. **证据真吗** — `tasks/{task-id}/evidence/phase-{N}-RED.json` / `phase-{N}-GREEN.json` 的 exit_code/timestamp/provenance 是当前 session 现跑的吗？
5. **有副作用吗** — 改动路径上有无没想到的影响？
6. **设计对吗** — 实现是否与 Design Sources 一致？对照 spec.md/plan.md/tasks.md/设计文档逐条检查本 phase 负责的关键设计决策。agent type、工具调用方式、数据流路径必须与设计文档一致。

**已自动化**：evidence 存在性（gate 检查 RED/GREEN 文件存在及内容质量）。
**未自动化**：Files allowlist 由 guard hook 阻断危险文件编辑，但不检查 diff 范围与 tasks.md 一致——reviewer 仍需验证 diff 范围。

## 增量审查规则

第 1 轮：全量审查，按本合同所有维度出 findings。

第 2 轮起：
1. **先验前轮**：逐条检查前轮 Required Revisions。任何一条未修复 → blocking。
2. **增量扫描**：只审查本轮修改的文件（git diff --name-only）。未修改文件不重审。
3. **回归检查**：执行 git diff --stat。如果本轮修改触及以下模块 → 对该模块做全量审查：
   - RuntimeAdapter / checkpoint / workflow 边界
   - forbidden files 清单中文件
   - 跨 package 接口变更
4. **新 finding 限制**：第 2+ 轮新 blocking finding 只能来自：
   a) 本轮修改引入的新问题
   b) 前轮不可能发现的问题
   c) 架构边界触碰
   其余新发现标 minor，不阻断 pass。
5. **每轮独立会话**：每轮审查在独立会话/子代理中执行，只接收 delta package。

## 阻断/非阻断分类

**阻断（必须出 revise_required）**：
- 功能错误（逻辑 bug、状态流转错误、遗漏 case、吞错、半写入、竞态）
- 测试失败（合约测试不通过、GREEN 证据不真实）
- 越界改动（改动禁止修改文件、package boundary 违规、diff 超出 Files allowlist 且未标 precondition-fix）
- 缺关键证据（无 RED 原始输出、无 GREEN 原始输出、无法判断功能是否成立）
- 必调用 review discipline 未执行（被修改文件读取 <80%、finding 无 file/line）
- 当前 phase 负责的 FR 未真实实现（task 勾选了但只有文件存在，缺少行为证据或测试覆盖）

**非阻断（应出 pass）**：
- 报告格式/可读性（review summary 措辞偏长、markdown 格式瑕疵）
- 证据完整度（RED/GREEN 贴完整组 vs 仅贴单测、文件路径用相对而非绝对）
- workflow-issues.jsonl 条目缺失
- close/summary.md 统计口径/数字不一致
- 无关的 minor 建议（代码风格偏好、非约束性架构建议）

## 检查维度

| 维度 | 验证方法 |
|------|---------|
| Spec — 设计文档对齐 | 对照 Design Sources 逐条验证本 phase 负责的关键设计决策。agent type / 工具调用方式 / 数据流路径必须一致。发现偏离 → blocking |
| Standards — 仓库规范 | 对照 Standards Sources（根 CLAUDE.md、包级 CLAUDE.md、contract.md）检查：① 是否触碰 forbidden files？② 通用模块是否混入业务逻辑？③ 命名/路径/包边界是否符合 CLAUDE.md 约定？ |
| 当前 phase 交付完整性 | 检查 tasks.md 当前 phase 所有 task 已勾选，Files 清单覆盖实际 diff |
| 测试通过 | 执行本 phase 对应的合约测试命令（见 tasks.md / phase 定义），验证通过 |
| RED/GREEN 真实性 | 检查 `tasks/{task-id}/evidence/phase-{N}-RED.json` / `.stdout` / `.stderr` 和对应 GREEN 的 capture 证据文件（gate 已验证 provenance） |
| 无 shell diagnostics | 检查脚本运行输出不含 `integer expression expected` 等 bash 错误 |
| diff 范围一致 | 检查 `git diff --name-only` 与 tasks.md Files 清单基本一致 |
| 代码质量 | 检查不相关改动 (unrelated refactor)、硬编码路径、安全风险 |
| 架构边界合规 | 检查是否触碰禁止修改文件、package boundary 规则 |
| precondition-fix 标注 | 如果一个改动修正了其他 phase 的遗留问题才能让本 phase 测试通过，标注为 `precondition-fix` 而非 scope creep |

## Structural Quality Gate

以下默认 blocking（不只是建议，是准入条件）：
- 在繁忙流程里新增特例分支，而不是抽 helper/adapter（例：在 stageExit 通用逻辑里硬编码 close-stage 专用检查）
- feature-specific 逻辑泄漏到 shared/general path
- 复制已有 canonical helper 或重新实现已有能力
- 引入绝对路径、硬编码用户路径、环境绑定
- 用 `any` / `unknown` / `as` cast 掩盖真实类型边界
- 多步状态更新非原子，失败时可能半写入
- 文件超过 1000 行后继续堆逻辑，且没有拆分理由
- 新增 abstraction / wrapper 但没有降低复杂度（thin wrapper、pass-through helper）

## 验证方法

1. **执行命令**：对测试通过和 shell diagnostics 等维度，直接运行命令并检查输出。
2. **读文件**：对 phase 交付完整性、diff 范围、代码质量等维度，Read 后逐项判断。
3. **结构化验证**：对 RED/GREEN 真实性、precondition-fix 标注等维度，直接输出 `jq` 或其他命令结果。

## 证据真实性维度（FR-REV-002）

- 证据文件位于 `tasks/{task-id}/evidence/phase-{N}-{MODE}.json` + `.stdout` + `.stderr`，gate 已验证 provenance（evidence_captured hash）
- 审查时 Read evidence JSON 确认 command、exit_code、timestamp 合理性
- **禁止占位符**：evidence stdout/stderr 内容不可含 `...`、`（省略）`、`（同上）` 等截断标记
- **Host-Verified Facts 优先**：当审查包包含 Host-Verified Facts 段时，reviewer 不重跑 evidence command（host 已验证 provenance 和 exit_code）。reviewer 继续读取 evidence JSON 确认 command/exit_code/timestamp 合理性，读取 stdout/stderr 检查占位符。Host-Verified Facts 与 reviewer 发现矛盾 → escalate_to_human（fail-closed）

## FR 消费点扫描审查维度（返修颗粒度纪律强制）

当上一轮某 blocking finding 属于【必需输入缺失 / 兜底掩盖 / 校验漏字段 / FR 实现消费点漂移】类时，reviewer 必须读取本轮 `tasks/{task-id}/phase-{N}-revise-plan.md`（或对应 `revise-plan-checklist`），核对其 `FR Consumption Scan` 段：

1. **搜索词矩阵是否真覆盖**：搜索词集合至少覆盖该 FR 的 ID + 核心字段名 + 入口函数名 + 模板标题/锚点 + 测试名；每个词附 grep 命令 + 命中输出。只 grep FR 编号一条 = 不合格（消费点常以别名/字段名/schema key 出现，单条 grep 漏调用点 = 复现漂移）。
2. **命中点是否分类**：每个命中点标注「消费点 / 非消费点 + 理由」；缺分类或理由废话 → revise_required。
3. **测试映射是否成立**：每个消费点对应一条回归测试（表格）；未覆盖的消费点必须对应新增测试，或写明成立的阻断/豁免理由（不能只 prose 一句）。
4. **豁免不可空勾绕过**：若 revise-plan 未填 FR Consumption Scan 却声称「本轮不涉及 FR 实现」，必须给出豁免理由 + 对应 finding ID + reviewer 可核对的文件:行号。reviewer 看到该 blocking 实际涉及 FR 实现、但 Scan 缺失或豁免理由不成立 → revise_required。

判据：Scan 段缺失 / 半填 / 废话填充 / 豁免不成立 → revise_required。reviewer 点名一个消费点、下一轮又点名同入口同类的另一个 = 本纪律未执行，按未闭合升级处理。

## 同 Finding 连续 2 轮升级规则（FR-REV-001）

同一 blocking finding 连续 2 轮审查都未闭合时，reviewer 必须输出：
1. **根因**：为什么这个问题反复出现
2. **扫描范围**：所有可能受影响的文件/模块清单
3. **反例矩阵**：每个受影响位置的正反例
4. **Closure checklist**：agent 需逐项确认的修复清单

第 3 轮同一 finding 仍未闭合 → escalate_to_human。

## 实质审查维度

形式检查中，evidence 存在性与内容质量已由 gate 自动化（FR-REV-003）。其余形式检查（chat 归档、截图、文件格式）gate 尚未覆盖，reviewer 按需检查。reviewer 重心在 4 个实质维度：
1. 应不应该做 — 需求合理性
2. 做得对不对 — 方案正确性
3. 有没有风险 — 隐含风险
4. 有没有遗漏 — 覆盖完整性

## 修订记录

审查报告正文（`<!-- revision-record -->` 以上）不可修改。
主 agent 在收到 revise_required 后、发起下一轮审查前，在上一轮报告底部以 append-only 方式追加修订记录。reviewer 只读不写。

追加格式（**gate 强制检查 sourceRequestId/sourceRound/resubmitRound 三元组，缺任何一项 BLOCK**）：
```
<!-- revision-record -->

## Revision Record
### Round N → N+1 (YYYY-MM-DDThh:mm:ss)
- **失败根因**：[为什么该轮没通过]
- **修改文件**：[文件列表]
- **修改摘要**：[做了什么修改]
- **验证命令和结果**：[命令 + 输出]
- **sourceRequestId={上轮 reviewRequestId}**
- **sourceRound={N}**
- **resubmitRound={N+1}**
```

<!-- CONTRACT-DEPTH: placeholder, pending 4-item deepening (Blocking/Non-blocking classification list, Structural Quality Gate red lines, FR Consumption Point Scan, Revision Record append-only write protection) -->
