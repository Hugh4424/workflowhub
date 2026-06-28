---
milestone: m11-build-spec-v1
stage: plan
status: draft
total_phases: 4
total_tasks: 10
---

# Tasks -- M11 build-spec v1

> 所有 phase ui_change: false（M11 纯 skill 提示词，无 UI 改动）
> 两新技能（spec-specify / spec-clarify）+ build-spec v1 升级 + 注册/登记
> 关键文件：`workflows/spec-specify/SKILL.md`、`workflows/spec-clarify/SKILL.md`、`workflows/build-spec/SKILL.md`

---

## Phase 1：spec-specify 技能（SKILL.md + 内置模板）

**ui_change: false**

### Goal

新建 `workflows/spec-specify/` 目录，含 SKILL.md（改造自 speckit-specify）和内置模板 `templates/spec-template.md`（workflowhub archive 风格）。spec-specify 接受 task-id 参数生成 `specs/{task-id}/spec.md` + `specs/{task-id}/checklists/requirements.md`，不做 git 分支操作、不读目标项目 `.specify/`。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md` -- 新建
- `/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md` -- 新建

### Tasks

**Task 1.1 -- 写 spec-specify SKILL.md** [FR-SPECIFY-001, FR-SPECIFY-002, FR-SPECIFY-004, FR-SPECIFY-005, FR-DECOUPLE-001, FR-DECOUPLE-002, FR-TEMPLATE-001]

- 入参：speckit-specify SKILL.md（`~/.claude/skills/speckit-specify/SKILL.md`）原文、inventory 确认的去耦点
- 出参：`workflows/spec-specify/SKILL.md`，纯提示词（无 .mjs / 无脚本调用 / 无 git 命令），包含以下内容：
  1. **合法 frontmatter**：`name: spec-specify`，`description` 非空
  2. **输入声明**：task-id（必填，缺失时报 "task-id required" 并 stop）+ 功能描述文本（来自 decision-log）
  3. **模板加载**：从 `./templates/spec-template.md` 读取（与 SKILL.md 同目录的相对路径），不存在时 fail-loud "template not found at <path>"
  4. **spec 生成步骤**（保留 speckit-specify 核心流程，改造去 git 部分）：
     - 从描述提取关键概念（角色/动作/数据/约束）
     - 对不明确点合理推断并记录假设
     - 最多 3 个 [NEEDS CLARIFICATION] 标记（仅用于影响范围/安全/UX 的关键决策）
     - 按模板章节填充 spec
     - 每个 FR 可测试、可验证
  5. **产物路径**：`specs/{task-id}/spec.md`（由 task-id 推导，不依赖 git branch）
  6. **质量检查清单**：生成 `specs/{task-id}/checklists/requirements.md`，检查项含无实现细节泄漏/FR 可测试/成功标准可度量/验收场景已定义/边界已标识/范围已明确
  7. **[NEEDS CLARIFICATION] 交互格式**：每题 3-5 个互斥选项+推荐项+理由（保留 speckit-specify Q1/Q2/Q3 格式），一次性呈现全部题目后等待回答
  8. **三档裁剪指令**：A 档硬门五章必填（用户场景/FR/不做/验收/影响范围），B 档条件触发，C 档可精简。不触发的内容标"本期不涉及（理由）"
  9. **metrics 接入**：指令调用 `metrics/collector.mjs` 的 recordSkeleton + updateOwnResult，stage 字段填 `spec-specify`
  10. **去耦约束**：不执行 git checkout / git branch / create-new-feature.sh；不读 `.specify/` 目录；不调用任何 speckit 脚本
  11. **改造来源声明**：文件头注明改造自 `~/.claude/skills/speckit-specify/SKILL.md`，适配为 workflowhub 契约
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md`

**Task 1.2 -- 写 spec-template.md（内置模板）** [FR-SPECIFY-003, FR-TEMPLATE-001, FR-TEMPLATE-002]

- 入参 A：speckit 原模板 `multica-agenthub/.specify/templates/spec-template.md`（章节结构参考）
- 入参 B：workflowhub archive 已有 spec（`specs/archive/m7-intake-v1/spec.md`、`specs/archive/m9-verify-code/spec.md`）（风格参考）
- 出参：`workflows/spec-specify/templates/spec-template.md`，含以下章节（workflowhub archive 风格，中文锚点）：
  1. 速读卡（30 秒看懂这个需求）—— 一句话需求 + 核心改动点 + 最大影响面 + 验收信号
  2. 1. 问题陈述 —— 1-2 段
  3. 2. 背景、目标和边界 —— 背景/目标/非目标（明确不做）
  4. 3. 用户场景与用例 —— 角色+操作步骤+预期结果，覆盖正常/失败/边界场景
  5. 4. 功能需求 —— 按功能域分组，FR-{域缩写}-NNN 编号
  6. 5. 模块划分（条件触发）—— 各模块负责什么/对外接口/依赖谁/测试边界
  7. 6. 关键实体（条件触发）
  8. 7. 数据和生命周期（条件触发）
  9. 8. 兼容性预留（条件触发）
  10. 9. 不做和隐性必达
  11. 10. 验收清单及未决问题
  12. 11. 影响范围（业务性质）
- 约束：
  - 不含 speckit 专有元素：无 `.specify/` 路径引用、无 `create-new-feature.sh`、无 `check-prerequisites.sh`
  - 不含 git 分支相关指令
  - 章节为中文锚点，非罗马数字 1-11
  - 每章含占位说明（`<!-- ... -->` 注释提示填写内容），非空壳
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md`

**Task 1.3 -- 验证 spec-specify 交付物** [FR-SPECIFY-001, FR-DECOUPLE-001, FR-DECOUPLE-002, FR-TEMPLATE-001]

- 入参：Task 1.1 + 1.2 完成
- 出参：Phase 1 所有验证通过
- 验证命令：
  ```bash
  set -euo pipefail
  cd /Users/Hugh/Hugh/Project/workflowhub
  fail() { echo "FAIL: $*" >&2; exit 1; }

  test -f workflows/spec-specify/SKILL.md || fail "SKILL.md missing"
  grep -q "name: spec-specify" workflows/spec-specify/SKILL.md || fail "frontmatter name"
  grep -q "task-id" workflows/spec-specify/SKILL.md || fail "task-id not found"

  test -f workflows/spec-specify/templates/spec-template.md || fail "template missing"
  CHAPTER_COUNT=$(grep -c "用户场景\|功能需求\|验收\|不做\|影响范围" workflows/spec-specify/templates/spec-template.md)
  test "$CHAPTER_COUNT" -ge 4 || fail "template chapters ($CHAPTER_COUNT < 4)"

  # 去耦约束声明逐一断言（三类缺一即 fail；不 OR 模糊通过，防止"去耦约束"四字就过关）
  grep -q "不执行.*git" workflows/spec-specify/SKILL.md || fail "缺 git 类去耦声明"
  grep -q "不读.*\.specify/" workflows/spec-specify/SKILL.md || fail "缺 .specify 类去耦声明"
  grep -q "不调用.*speckit" workflows/spec-specify/SKILL.md || fail "缺 speckit 类去耦声明"

  grep -q "recordSkeleton" workflows/spec-specify/SKILL.md || fail "metrics wiring missing"
  grep -q "checklists/requirements" workflows/spec-specify/SKILL.md || fail "checklist generation not found"

  echo "PASS: all Phase 1 checks passed"
  ```

### Verify

- **验证目标**：spec-specify SKILL.md 存在+task-id 参数化+模板内置+去耦约束声明到位（不出现实际执行 git/.specify/ 的指令；禁止性声明和来源说明不算）（FR-SPECIFY-001/FR-DECOUPLE-001/002/FR-TEMPLATE-001）

> **AC7 "零 per-project clone 实跑验证" 移交 verify-code 阶段**：Phase 1 的 grep 检查（去耦约束声明存在 + 模板内部路径 + task-id 参数）证明 SKILL.md 设计满足 AC7 契约，但不等于真实零-clone 可运行。真实验收需在不存在 `.specify/` 的干净目录中实跑 spec-specify，断言：(a) 不需要也不创建 `.specify/`，(b) 在 task-id 派生路径下真产出 spec.md。该实跑验证移交 verify-code 阶段执行，证据写入 handoff。
- **gate_cmd**：执行 Task 1.3 全部验证命令
- **expected_exit**：所有 grep 行均 PASS
- **evidence_path**：Phase 1 验证输出

### Knowledge

- spec-specify 是纯提示词 skill，不包含可执行 .mjs——所有逻辑由 SKILL.md 中的指令驱动
- task-id 参数是 spec-specify 的唯一身份锚定，缺失时 fail-loud（不静默回退，Let-it-crash）
- 模板路径 `./templates/spec-template.md` 是相对 SKILL.md 所在目录的路径，读取时由调用方（build-spec）根据 SKILL.md 位置解析
- NEEDS CLARIFICATION 上限 3 个，交互格式保留 speckit 原版的 Q1/Q2/Q3 编号 + 选项表 + 推荐项

### STOP

spec-specify SKILL.md 出现实际执行 git checkout / git branch / create-new-feature.sh 的指令（禁止性声明如"不执行 git checkout"和来源说明不算）→ 停（违 FR-DECOUPLE-001）。task-id 缺失时未声明 fail-loud → 停（违 FR-DECOUPLE-001）。模板路径含 `.specify/` 目录读取指令（禁止性声明不算）→ 停（违 FR-DECOUPLE-002）。无 recordSkeleton 引用 → 停（违 S4 指标系统）。

---

## Phase 2：spec-clarify 技能

**ui_change: false**

### Goal

新建 `workflows/spec-clarify/SKILL.md`（改造自 speckit-clarify），接受 task-id/spec-path 定位 spec，执行 10 维歧义扫描 + 最多 5 题交互澄清（一次一题 + 推荐），每题接受后增量更新 spec，完成后输出覆盖率摘要。不做 git 分支推断、不调 check-prerequisites.sh。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md` -- 新建

### Tasks

**Task 2.1 -- 写 spec-clarify SKILL.md** [FR-CLARIFY-001, FR-CLARIFY-002, FR-CLARIFY-003, FR-CLARIFY-004, FR-CLARIFY-005, FR-DECOUPLE-001, FR-DECOUPLE-003]

- 入参：speckit-clarify SKILL.md（`~/.claude/skills/speckit-clarify/SKILL.md`）原文、inventory 确认的去耦点
- 出参：`workflows/spec-clarify/SKILL.md`，纯提示词（无 .mjs / 无脚本调用 / 无 git 命令），包含以下内容：
  1. **合法 frontmatter**：`name: spec-clarify`，`description` 非空
  2. **输入声明**：task-id（必填，用于推导 `specs/{task-id}/spec.md`）或 spec-path（显式文件路径）；缺失时 fail-loud
  3. **spec 定位**：通过 task-id 推导路径或直接使用 spec-path；不执行 `check-prerequisites.sh`、不读 `.specify/feature.json`、不调 git 命令
  4. **10 维歧义扫描**（保留 speckit-clarify 全部分类，每维标 Clear/Partial/Missing）：
     - Functional Scope & Behavior（核心用户目标/成功标准/显式不做范围/角色区分）
     - Domain & Data Model（实体/属性/关系/唯一性/生命周期/数据量级）
     - Interaction & UX Flow（关键用户旅程/错误-空-加载态/可访问性）
     - Non-Functional Quality Attributes（性能/可扩展性/可靠性可用性/可观测性/安全隐私/合规，6 子项属 1 维）
     - Integration & External Dependencies（外部服务API及失败模式/数据导入导出格式/协议版本假设）
     - Edge Cases & Failure Handling（负向场景/限流节流/冲突解决）
     - Constraints & Tradeoffs（技术约束/显式取舍或拒绝的替代方案）
     - Terminology & Consistency（规范术语表/已弃用同义词）
     - Completion Signals（验收标准可测试性/可度量的 DoD 指标）
     - Misc / Placeholders（TODO 标记/未解决决策/模糊形容词缺乏量化）
  5. **交互澄清纪律**（保留 speckit-clarify 规则）：
     - 最多 5 题
     - 一次只呈现一题（不提前透露后续题目）
     - 每题含推荐答案 + 简短理由
     - 每题可选多选（2-5 互斥选项）或短回答（<=5 词）
     - 用户答 "yes"/"recommended" 即采纳推荐
  6. **增量更新**：每答一题立即写入 spec--`## Clarifications → ### Session YYYY-MM-DD` 节追加 Q&A，同时整合到对应章节（功能歧义→FR/数据模型歧义→数据模型节/非功能约束→质量属性节等）
  7. **覆盖率摘要**：完成时输出表格--每维状态 Resolved/Deferred/Clear/Outstanding，Deferred 或 Outstanding 标注是否建议继续推进
  8. **metrics 接入**：指令调用 `metrics/collector.mjs` 的 recordSkeleton + updateOwnResult，stage 字段填 `spec-clarify`
  9. **去耦约束**：不调 `check-prerequisites.sh`、不读 `.specify/feature.json`、不执行 git 命令
  10. **改造来源声明**：文件头注明改造自 `~/.claude/skills/speckit-clarify/SKILL.md`，适配为 workflowhub 契约
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md`

**Task 2.2 -- 验证 spec-clarify 交付物** [FR-CLARIFY-001, FR-CLARIFY-002, FR-DECOUPLE-001, FR-DECOUPLE-003]

- 入参：Task 2.1 完成
- 出参：Phase 2 所有验证通过
- 验证命令：
  ```bash
  set -euo pipefail
  cd /Users/Hugh/Hugh/Project/workflowhub
  fail() { echo "FAIL: $*" >&2; exit 1; }

  test -f workflows/spec-clarify/SKILL.md || fail "SKILL.md missing"
  grep -q "name: spec-clarify" workflows/spec-clarify/SKILL.md || fail "frontmatter name"
  grep -q "task-id" workflows/spec-clarify/SKILL.md || fail "task-id not found"

  # 10 维分类逐一断言（任一缺失即 fail，不用计数阈值）
  grep -q "Functional Scope" workflows/spec-clarify/SKILL.md || fail "dim1 Functional Scope missing"
  grep -q "Domain.*Data Model\|Data Model\|Domain & Data" workflows/spec-clarify/SKILL.md || fail "dim2 Domain & Data Model missing"
  grep -q "Interaction.*UX\|UX Flow\|Interaction & UX" workflows/spec-clarify/SKILL.md || fail "dim3 Interaction & UX missing"
  grep -q "Non-Functional Quality\|Non-Functional" workflows/spec-clarify/SKILL.md || fail "dim4 Non-Functional Quality missing"
  grep -q "Integration.*External\|Integration.*Dependencies" workflows/spec-clarify/SKILL.md || fail "dim5 Integration & Dependencies missing"
  grep -q "Edge Cases\|Edge Cases.*Failure" workflows/spec-clarify/SKILL.md || fail "dim6 Edge Cases missing"
  grep -q "Constraints.*Tradeoff\|Constraints & Trade" workflows/spec-clarify/SKILL.md || fail "dim7 Constraints & Tradeoffs missing"
  grep -q "Terminology.*Consistency\|Terminology" workflows/spec-clarify/SKILL.md || fail "dim8 Terminology & Consistency missing"
  grep -q "Completion Signal\|Completion Signals" workflows/spec-clarify/SKILL.md || fail "dim9 Completion Signals missing"
  grep -q "Misc.*Placeholder\|Misc / Place" workflows/spec-clarify/SKILL.md || fail "dim10 Misc / Placeholders missing"

  # 交互纪律
  grep -q "one question at a time\|一次.*一题\|ONE question" workflows/spec-clarify/SKILL.md || fail "no one-at-a-time discipline"
  grep -q "maximum.*5\|最多.*5\|不超过.*5" workflows/spec-clarify/SKILL.md || fail "no q-limit <=5"

  # 去耦约束声明逐一断言（三类缺一即 fail；与 Phase 1 对齐，不 OR 模糊通过）
  grep -q "不调.*check-prerequisites" workflows/spec-clarify/SKILL.md || fail "缺 check-prerequisites 去耦声明"
  grep -q "不读.*\.specify" workflows/spec-clarify/SKILL.md || fail "缺 .specify 去耦声明"
  grep -q "不执行.*git" workflows/spec-clarify/SKILL.md || fail "缺 git 去耦声明"
  grep -q "coverage\|覆盖率" workflows/spec-clarify/SKILL.md || fail "no coverage summary"
  grep -q "recordSkeleton" workflows/spec-clarify/SKILL.md || fail "metrics wiring missing"

  echo "PASS: all Phase 2 checks passed"
  ```

### Verify

- **验证目标**：spec-clarify SKILL.md 存在+task-id 参数化+10 维分类+交互纪律+去耦约束声明到位（不出现实际执行 git/check-prerequisites.sh 的指令；禁止性声明和来源说明不算）（FR-CLARIFY-001/002/003/FR-DECOUPLE-001/003）
- **gate_cmd**：执行 Task 2.2 全部验证命令
- **expected_exit**：所有 grep 行均 PASS
- **evidence_path**：Phase 2 验证输出

### Knowledge

- 10 维分类的 "Non-Functional Quality Attributes" 是 1 个顶级维度含 6 个子项（非 6 个独立维度），以 speckit-clarify SKILL.md 步骤 2 原文为准
- 一次一题的纪律来自 speckit-clarify 原版步骤 4（Sequential questioning loop），保留不改
- spec 定位不能依赖任何 git/shell 命令——全部通过 task-id 推导或显式路径参数
- 覆盖率摘要的 Resolved/Deferred/Clear/Outstanding 四态来自 speckit-clarify 步骤 8，保留不改

### STOP

spec-clarify SKILL.md 出现实际调用 check-prerequisites.sh 的指令（禁止性声明如"不调 check-prerequisites.sh"和来源说明不算）→ 停（违 FR-DECOUPLE-003）。10 维分类缺维 → 停（违 FR-CLARIFY-002）。无 task-id 声明 → 停（违 FR-DECOUPLE-001）。

---

## Phase 3：build-spec SKILL.md v1 升级

**ui_change: false**

### Goal

将 `workflows/build-spec/SKILL.md` 从 M6 薄骨架升级为 v1 完整提示词：集成 spec-specify → spec-clarify → 宪法符合性检查 → baseline 对照 → 人审检查点 → 产 stage-result + metrics。保留 M6 F10 gate、stage-result 七键契约、metrics 调用指令。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md` -- 修改，覆写骨架为 v1

### Tasks

**Task 3.1 -- 升级 build-spec SKILL.md v1** [FR-SPECIFY-001, FR-CLARIFY-001, FR-CONSTITUTION-001, FR-CONSTITUTION-002, FR-CONSTITUTION-003, FR-BASELINE-001, FR-BASELINE-002, FR-BASELINE-003, FR-REVIEW-001, FR-SKELETON-001, FR-SKELETON-002]

- 入参：Phase 1+2 交付物（spec-specify/clarify SKILL.md 已存在）+ M6 build-spec 骨架原文
- 出参：`workflows/build-spec/SKILL.md` v1，必须包含以下段落（可按提示词自然编排顺序）：
  1. **前置读取**：读 `tasks/{task-id}/decision-log.md`（上游 make-decision 产物），提取功能描述、决策记录、约束
  2. **metrics 开始**：stage 启动时指令调用 `metrics/collector.mjs` recordSkeleton，传入 M4 10 核心字段 seed
  3. **spec-specify 调用**：指令调 `workflows/spec-specify/SKILL.md`，传入 task-id + 功能描述文本，产出 `specs/{task-id}/spec.md` 初稿
  4. **spec-clarify 调用**：指令调 `workflows/spec-clarify/SKILL.md`，传入 task-id（或 spec 路径），执行歧义扫描 + 交互澄清，更新 spec
  5. **宪法符合性检查**：指令读取 `constitution-checklist.md`，对 21 条（F1-F10/Q1-Q3/S1-S8）逐条勾选：
     - 每条写 `[x]` 符合或 `[ ]` 不符合并附判据文字
     - 21 条全部在场，任一条缺状态或缺判据即验收失败（FR-CONSTITUTION-003）
     - 明确声明：不达标不阻断 build-spec 推进，仅记录浮现（FR-CONSTITUTION-002）
     - 勾选结果写入 spec 产物附录或独立文件
  6. **baseline 对照**：指令产出 M11 自举 task vs M10 baseline 5 项指标对照表：
     - 指标名：missed_step_rate / test_execution_rate / review_execution_rate / rework_rounds / rework_proxy_count
     - M10 baseline 值：0.05 / 0.8295 / 1 / 6.075 / 25.25（来自 `specs/archive/m10-baseline-switch/baseline-report.md`）
     - 对照表含 4 列：指标名 / M11 实值 / M10 baseline 值 / 方向 delta
     - 阈值由人设定，不达标不阻断（FR-BASELINE-002）
     - 第 5 项命名使用 `rework_proxy_count`，不用旧称（FR-BASELINE-003）
  7. **人审检查点**：在 spec 生成/澄清/宪法检查/baseline 对照全部完成后、产出 stage-result 之前，明文停顿等人确认：
     - 停顿段含唯一 marker 字符串 `HUMAN_REVIEW_CHECKPOINT`（供 verify 阶段 grep 并断言 `-eq 1`）
     - 停顿文字含明确的"请确认后继续"或等效表述
     - 一且仅一次（不多于一处、不少于一处）（FR-REVIEW-001）
     - 人确认 → 继续；人拒绝或未确认 → 不自动推进到 stage-result 产出
  8. **stage-result 产出**：沿用 M6 七键结构（status/error_code/retryable/facts/missing_items/user_decision/reason），facts 含 spec_ref + requirements（FR-SKELETON-002）
  9. **metrics 结束**：指令调用 updateOwnResult，metrics 写失败只 warn 不 throw
  10. **F10 gate 保留**：完整的 F10 4 问在场（"What real threat does this defend against" 等，可 grep）（FR-SKELETON-001）
  11. **spec-specify/clarify 路径引用**：正文中包含 `workflows/spec-specify/SKILL.md` 和 `workflows/spec-clarify/SKILL.md` 两个字符串（可 grep）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/build-spec/SKILL.md`

**Task 3.2 -- 验证 build-spec SKILL.md v1** [FR-SPECIFY-001, FR-CLARIFY-001, FR-CONSTITUTION-001, FR-BASELINE-001, FR-REVIEW-001, FR-SKELETON-001, FR-SKELETON-002]

- 入参：Task 3.1 完成
- 出参：Phase 3 所有验证通过
- 验证命令：
  ```bash
  set -euo pipefail
  cd /Users/Hugh/Hugh/Project/workflowhub
  fail() { echo "FAIL: $*" >&2; exit 1; }

  grep -q "spec-specify" workflows/build-spec/SKILL.md || fail "spec-specify not integrated"
  grep -q "spec-clarify" workflows/build-spec/SKILL.md || fail "spec-clarify not integrated"
  grep -q "constitution-checklist\|F1\|F2\|F3" workflows/build-spec/SKILL.md || fail "constitution check missing"
  # baseline 5 指标名逐一断言（任一缺失即 fail；值完整性归 verify-code 阶段）
  grep -q "missed_step_rate" workflows/build-spec/SKILL.md || fail "missed_step_rate missing"
  grep -q "test_execution_rate" workflows/build-spec/SKILL.md || fail "test_execution_rate missing"
  grep -q "review_execution_rate" workflows/build-spec/SKILL.md || fail "review_execution_rate missing"
  grep -q "rework_rounds" workflows/build-spec/SKILL.md || fail "rework_rounds missing"
  grep -q "rework_proxy_count" workflows/build-spec/SKILL.md || fail "rework_proxy_count missing"

  # 人审检查点：HUMAN_REVIEW_CHECKPOINT marker 必须恰好出现 1 次（多于或少于 1 都 fail）
  REVIEW_COUNT=$(grep -c "HUMAN_REVIEW_CHECKPOINT" workflows/build-spec/SKILL.md)
  test "$REVIEW_COUNT" -eq 1 || fail "HUMAN_REVIEW_CHECKPOINT count expected 1, got $REVIEW_COUNT"

  grep -q "What real threat does this defend against" workflows/build-spec/SKILL.md || fail "F10 gate missing"

  STAGE_COUNT=$(grep -c "spec_ref\|requirements" workflows/build-spec/SKILL.md)
  test "$STAGE_COUNT" -ge 2 || fail "stage-result contract ($STAGE_COUNT < 2)"

  METRICS_COUNT=$(grep -c "recordSkeleton\|updateOwnResult" workflows/build-spec/SKILL.md)
  test "$METRICS_COUNT" -ge 2 || fail "metrics wiring ($METRICS_COUNT < 2)"

  echo "PASS: all Phase 3 checks passed"
  ```

### Verify

- **验证目标**：build-spec v1 SKILL.md 集成两技能+宪法检查+baseline 对照+人审检查点+F10 gate/stage-result/metrics 保留（FR-*）
- **gate_cmd**：执行 Task 3.2 全部验证命令
- **expected_exit**：所有 grep 行均 PASS
- **evidence_path**：Phase 3 验证输出

### Knowledge

- build-spec v1 是纯提示词——它编排其他 SKILL.md 的调用，不包含 .mjs 脚本逻辑
- spec-specify/clarify 的路径引用为显式字符串，可直接 grep——这是 build-spec 与组件 skill 之间唯一的显式耦合点
- F10 gate 4 问、stage-result 七键、metrics recordSkeleton/updateOwnResult 是从 M6 继承的不变体——v1 只能追加内容，不可删除或重命名这些元素
- 人审检查点是 SKILL.md 中的一段明文停顿文字，不是可执行 gate 脚本——执行者（人或 LLM）看到这段文字后应停止并等待确认

### STOP

build-spec SKILL.md 不含 spec-specify 或 spec-clarify 路径引用 → 停（违 FR-SPECIFY-001/FR-CLARIFY-001）。F10 4 问不可 grep → 停（违 FR-SKELETON-001）。人审检查点缺失或多于一处 → 停（违 FR-REVIEW-001）。

---

## Phase 4：注册、登记与最终验证

**ui_change: false**

### Goal

在 `config/workflowhub.yaml` 注册 spec-specify 和 spec-clarify 两条目；在 `reuse-registry.md` 登记两行（外部改造适配+来源路径）。执行全量交付物验证：所有 SKILL.md 文件可发现、路径引用正确、AC6 无 speckit-* 命名冲突、宪法检查产物完整性。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/reuse-registry.md` -- 修改，追加两行
- `/Users/Hugh/Hugh/Project/workflowhub/config/workflowhub.yaml` -- 修改，新增两条 registry 条目

### Tasks

**Task 4.1 -- 更新 reuse-registry.md** [FR-REGISTRY-001, FR-REGISTRY-002]

- 入参：Phase 1+2 完成（spec-specify/clarify SKILL.md 已存在）
- 出参：`reuse-registry.md` 新增两行，格式与既有行一致：
  - `spec-specify` | 外部改造适配 | `~/.claude/skills/speckit-specify/SKILL.md`
  - `spec-clarify` | 外部改造适配 | `~/.claude/skills/speckit-clarify/SKILL.md`
- 约束：
  - 类别为合法枚举值（"外部改造适配"）
  - 来源路径为非空字符串（跨环境可搬运的规范路径；不强制当前机器存在——`~/.claude/skills/` 路径因机器而异）
  - 已有行不变，只追加不删除
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/reuse-registry.md`

**Task 4.2 -- 更新 config/workflowhub.yaml**

> M2 微内核 registry 工程必需项（非 FR 派生）：spec-specify / spec-clarify 作为 workflowhub 内部 workflow 必须登记 `config/workflowhub.yaml` 才能被 kernel dispatch。spec 无对应 FR——这是 M2 架构约束而非 M11 需求项。

- 入参：Phase 1+2 完成
- 出参：`config/workflowhub.yaml` 的 registry 新增两条目：
  ```yaml
  - component_id: spec-specify
    workflow: spec-specify
    path: workflows/spec-specify/SKILL.md
  - component_id: spec-clarify
    workflow: spec-clarify
    path: workflows/spec-clarify/SKILL.md
  ```
- 约束：条目追加在现有 registry 末尾，已有条目不变
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/config/workflowhub.yaml`

**Task 4.3 -- 全量交付物验证** [FR-REGISTRY-002, FR-SKELETON-001, FR-SKELETON-002]

> FR-CONSTITUTION-001 已由 Phase 3 Task 3.1 覆盖（build-spec SKILL.md 宪法检查步骤存在性）；FR-CONSTITUTION-003（21 条完整性验收）移交 verify-code 阶段——build-plan 不做产出内容完整性检查。

- 入参：Phase 1-4 全部交付物
- 出参：全部验证通过
- 验证命令：
  ```bash
  set -euo pipefail
  cd /Users/Hugh/Hugh/Project/workflowhub
  fail() { echo "FAIL: $*" >&2; exit 1; }

  echo "=== 文件存在性 ==="
  test -f workflows/spec-specify/SKILL.md || fail "spec-specify SKILL.md missing"
  test -f workflows/spec-specify/templates/spec-template.md || fail "spec-template.md missing"
  test -f workflows/spec-clarify/SKILL.md || fail "spec-clarify SKILL.md missing"

  echo "=== config registry ==="
  grep -q "spec-specify" config/workflowhub.yaml || fail "spec-specify not in registry"
  grep -q "spec-clarify" config/workflowhub.yaml || fail "spec-clarify not in registry"

  echo "=== reuse-registry 格式校验（skill 名锚定 + 类别列 $3 + 来源列 $4） ==="
  # spec-specify 行
  SPEC_LINE=$(grep "^| spec-specify " reuse-registry.md) || fail "spec-specify row not found in reuse-registry"
  SPEC_CAT=$(echo "$SPEC_LINE" | awk -F'|' '{print $3}' | xargs)
  SPEC_SRC=$(echo "$SPEC_LINE" | awk -F'|' '{print $4}' | xargs)
  test "$SPEC_CAT" = "外部改造适配" || fail "spec-specify category expected '外部改造适配', got '$SPEC_CAT'"
  test -n "$SPEC_SRC" || fail "spec-specify source path empty"

  # spec-clarify 行
  CLAR_LINE=$(grep "^| spec-clarify " reuse-registry.md) || fail "spec-clarify row not found in reuse-registry"
  CLAR_CAT=$(echo "$CLAR_LINE" | awk -F'|' '{print $3}' | xargs)
  CLAR_SRC=$(echo "$CLAR_LINE" | awk -F'|' '{print $4}' | xargs)
  test "$CLAR_CAT" = "外部改造适配" || fail "spec-clarify category expected '外部改造适配', got '$CLAR_CAT'"
  test -n "$CLAR_SRC" || fail "spec-clarify source path empty"

  echo "=== AC6: frontmatter name 不得用 speckit-* 前缀（允许注释中来源注明） ==="
  grep -q "^name: speckit-" workflows/spec-specify/SKILL.md && fail "AC6 违: spec-specify frontmatter name 含 speckit-* 前缀" || true
  grep -q "^name: speckit-" workflows/spec-clarify/SKILL.md && fail "AC6 违: spec-clarify frontmatter name 含 speckit-* 前缀" || true

  echo "=== 路径引用完整 ==="
  grep -q "workflows/spec-specify/SKILL.md" workflows/build-spec/SKILL.md || fail "spec-specify path ref missing"
  grep -q "workflows/spec-clarify/SKILL.md" workflows/build-spec/SKILL.md || fail "spec-clarify path ref missing"

  echo "=== 三 SKILL.md 均含 collector 指令 ==="
  for f in workflows/spec-specify/SKILL.md workflows/spec-clarify/SKILL.md workflows/build-spec/SKILL.md; do
    grep -q "recordSkeleton" "$f" || fail "$f missing recordSkeleton"
  done

  echo "=== M6 骨架不回归 ==="
  grep -q "What real threat does this defend against" workflows/build-spec/SKILL.md || fail "F10 gate missing"
  grep -q "spec_ref" workflows/build-spec/SKILL.md || fail "spec_ref missing"
  grep -q "requirements" workflows/build-spec/SKILL.md || fail "requirements missing"

  echo "=== 宪法/baseline 步骤存在性检查（不验完整性，完整性归 verify-code） ==="
  grep -q "constitution-checklist" workflows/build-spec/SKILL.md || fail "constitution-checklist ref missing"
  grep -q "rework_proxy_count" workflows/build-spec/SKILL.md || fail "rework_proxy_count naming missing"

  echo "PASS: all Phase 4 checks passed"
  ```

### Verify

- **验证目标**：registry 两条目存在 + reuse-registry 两行格式合法（FR-REGISTRY-001/002）+ AC6 无 speckit-* 命名 + 三 skill 均接 collector + M6 骨架能力不回归
- **gate_cmd**：执行 Task 4.3 全部验证命令
- **expected_exit**：所有 grep 行均 PASS，无 FAIL
- **evidence_path**：Phase 4 验证输出

### Knowledge

- config/workflowhub.yaml 的 registry 条目格式为 YAML 数组，每条含 component_id/workflow/path 三键——与现有 scope-triage/decision-log 条目完全一致
- reuse-registry.md 的两行遵循既有格式（三列 markdown 表：skill 名 / 复用类别 / 来源路径）
- AC6 验证允许 source attribution（文件头注明改造自 speckit-*）出现在 grep 中——验收黑名单仅针对"作为自身技能名"使用 speckit-* 前缀
- 本 Phase 不涉及 CI/自动化测试——M11 交付物全为 SKILL.md 提示词文件，无可执行 .mjs，CI 无需变更

### STOP

registry 缺 spec-specify 或 spec-clarify 条目 → 停（违 FR-REGISTRY-001）。reuse-registry 缺任一行 → 停（违 FR-REGISTRY-001）。reuse-registry 任一行来源路径为空 → 停（违 FR-REGISTRY-002）。build-spec SKILL.md 缺 F10 4 问 → 停（违 FR-SKELETON-001）。

---

## 依赖关系

- Phase 1 + Phase 2（两技能独立，无依赖，可并行；均为新建文件，冲突风险零）→ Phase 3（build-spec SKILL.md 升级需两技能已建，路径引用才完整可 grep）
- Phase 1 + Phase 2 + Phase 3 → Phase 4（config registry + reuse-registry 条目指向已存在的 SKILL.md 路径；全量验证依赖所有文件已建）

## 实现策略

MVP = Phase 1 + Phase 2（两新技能可独立调起）。Phase 3 补 build-spec v1 编排。Phase 4 补注册和验证。每 phase 独立可测（各有 grep 验证命令）。

由于 Phase 1 和 Phase 2 为纯新建文件（零冲突），建议一次 commit 完成 Phase 1+2；Phase 3 单独 commit（build-spec 覆写）；Phase 4 单独 commit（config + registry 追加）。总计 3-4 个 commit。
