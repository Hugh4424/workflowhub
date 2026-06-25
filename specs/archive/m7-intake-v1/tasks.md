# 任务分解：M7 intake v1（升级 make-decision）

> 基于 plan.md（5 phase）+ spec.md（14 FR 域）。交付仓：workflowhub（/Users/Hugh/Hugh/Project/workflowhub）。
> 每 task 引至少一个 FR。每 phase 六节（Goal/Files/Tasks/Verify/Knowledge/STOP）。
> 路径相对 workflowhub 仓根（/Users/Hugh/Hugh/Project/workflowhub）。

## Phase 1: scope-triage 组件 skill

- ui_change: false

### Goal

新建 `workflows/scope-triage/SKILL.md`，定性为 make-decision 的组件 skill，合法 frontmatter（name=scope-triage/description 非空），纯提示词（无执行代码、不产 stage-result），接 collector 指标（stage=`scope-triage`），在 registry 注册一条。完成定义：运行 `npx vitest run tests/five-skills-present.test.mjs` 中 scope-triage 相关新断言绿。

### Files

- 新增 `workflows/scope-triage/SKILL.md`
- 修改 `config/workflowhub.yaml`（registry 加 scope-triage 一条）

### Tasks

- [x] T001 写 tests/five-skills-present.test.mjs 中 scope-triage 相关新断言（存在性 + frontmatter name/description 字面量断言），跑 `npx vitest run tests/five-skills-present.test.mjs` 应 RED（scope-triage 目录未建），保存输出到 apply/evidence/phase-1-RED.json。[FR-SCOPE-001]
- [x] T002 新建 `workflows/scope-triage/SKILL.md`：合法 frontmatter（name: scope-triage），纯提示词正文含——①定性为组件 skill 的说明（物理独立、可被工头/子代理独立调起）；②改造适配类引入声明（来源路径写文件头，接 workflowhub stage-result 契约 + 指标，非纯抄）；③输入为需求文本/上游内容，输出为范围判定结果（in-scope/out-of-scope 分流）；④明确说明不单独产 stage-result；⑤要求调 collector.mjs 写一条独立指标记录，stage 字段填 `scope-triage`（不填 make-decision），含 recordSkeleton / updateOwnResult M4 核心字段。[FR-SCOPE-001][FR-SCOPE-002][FR-SCOPE-003][FR-METRIC-001][FR-METRIC-002]
- [x] T003 改 `config/workflowhub.yaml`，registry 加 scope-triage 一条（component_id: scope-triage, workflow: scope-triage, path: workflows/scope-triage/SKILL.md）。跑 GREEN：`npx vitest run tests/five-skills-present.test.mjs` 中 scope-triage 相关断言 0，存 apply/evidence/phase-1-GREEN.json。[FR-SCOPE-001][FR-CI-001]
- [x] T004 维护知识文件：写 apply/phase-1.md（scope-triage SKILL.md 内容要点 + registry 改动 + evidence 路径），evidence 落 apply/evidence/，同步 workflow-issues.jsonl + state.json。

### Verify

- **验证目标**：scope-triage 目录 + SKILL.md 可发现 + frontmatter 合法 + registry 注册（FR-SCOPE-001/AC2）
- **gate_cmd**：`cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/five-skills-present.test.mjs --reporter=verbose`
- **expected_exit**：`0`（GREEN）/ `非0`（RED）
- **evidence_path**：`$TASK_DIR/apply/evidence/phase-1-{RED,GREEN}.json`
- **display_cmd**：`ls /Users/Hugh/Hugh/Project/workflowhub/workflows/scope-triage/SKILL.md`

### Knowledge

apply/phase-1.md 记 scope-triage SKILL.md 内容设计（组件 skill 定性、改造适配声明、collector 接入方式）+ registry 改动。

### STOP

T001 RED 未见红 → 停（测试断言没写对）。scope-triage SKILL.md 含执行代码或产 stage-result 要求 → 停（违 FR-SCOPE-002）。collector stage 字段非 `scope-triage` → 停（违 FR-METRIC-002）。

---

## Phase 2: decision-log 组件 skill

- ui_change: false

### Goal

新建 `workflows/decision-log/SKILL.md`，定性为 make-decision 的组件 skill，合法 frontmatter（name=decision-log），纯提示词（无执行代码、不单独产 stage-result），产物落 `tasks/<任务>/decision-log.md`（7 节结构、至少一条含来源证据的决策），接 collector 指标（stage=`decision-log`），registry 注册一条。完成定义：运行 `npx vitest run tests/five-skills-present.test.mjs` 中 decision-log 相关新断言绿。

### Files

- 新增 `workflows/decision-log/SKILL.md`
- 修改 `config/workflowhub.yaml`（registry 加 decision-log 一条）
- 修改 `tests/five-skills-present.test.mjs`（加 decision-log 存在性 + frontmatter 字面量断言）

### Tasks

- [x] T005 写 tests/five-skills-present.test.mjs 中 decision-log 相关新断言（存在性 + frontmatter 字面量断言），跑 `npx vitest run tests/five-skills-present.test.mjs` 应 RED（decision-log 目录未建），保存输出到 apply/evidence/phase-2-RED.json。[FR-DLOG-001]
- [x] T006 新建 `workflows/decision-log/SKILL.md`：合法 frontmatter（name: decision-log），纯提示词正文含——①定性为组件 skill 的说明（物理独立、可独立调起）；②改造适配类引入声明（来源路径文件头，接契约 + 指标，非纯抄）；③输入为需求文本/已有输入，输出为收敛后的决策内容；④明确说明产物落 `tasks/<任务>/decision-log.md`，含必要 7 节结构（原始需求/问题与目标/决策记录/假设/明确不做/开放问题/验收标准），至少一条决策记录含非空来源证据；⑤明确说明不单独产 stage-result；⑥引入清洁声明：产物不含 agenthub 专属元素（intake 阶段第 N 步等）；⑦要求调 collector.mjs 写一条独立指标记录，stage 字段填 `decision-log`（不填 make-decision），含 recordSkeleton / updateOwnResult M4 核心字段。[FR-DLOG-001][FR-DLOG-002][FR-DLOG-003][FR-DLOG-004][FR-METRIC-001][FR-METRIC-002]
- [x] T007 改 `config/workflowhub.yaml`，registry 加 decision-log 一条（component_id: decision-log, workflow: decision-log, path: workflows/decision-log/SKILL.md）。跑 GREEN：`npx vitest run tests/five-skills-present.test.mjs` 中 decision-log 相关断言 0，存 apply/evidence/phase-2-GREEN.json。[FR-DLOG-001][FR-CI-001]
- [x] T008 维护知识文件：写 apply/phase-2.md（decision-log SKILL.md 内容要点 + 7 节结构 + agenthub 清洁声明 + registry 改动 + evidence 路径），同步 workflow-issues.jsonl + state.json。

### Verify

- **验证目标**：decision-log 目录 + SKILL.md 可发现 + frontmatter 合法 + registry 注册（FR-DLOG-001/AC2）
- **gate_cmd**：`cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/five-skills-present.test.mjs --reporter=verbose`
- **expected_exit**：`0`（GREEN）/ `非0`（RED）
- **evidence_path**：`$TASK_DIR/apply/evidence/phase-2-{RED,GREEN}.json`
- **display_cmd**：`ls /Users/Hugh/Hugh/Project/workflowhub/workflows/decision-log/SKILL.md`

### Knowledge

apply/phase-2.md 记 decision-log SKILL.md 内容设计（7 节结构约束、agenthub 清洁要求、collector 接入）+ registry 改动。

### STOP

T005 RED 未见红 → 停（断言没写对）。decision-log SKILL.md 含执行代码 → 停（违 FR-DLOG-001）。产物路径约束缺失 → 停（违 FR-DLOG-002）。stage 字段非 `decision-log` → 停（违 FR-METRIC-002）。

---

## Phase 3: make-decision 升级 + facts-subschema 扩展

- ui_change: false

### Goal

升级 `workflows/make-decision/SKILL.md`：内联 scope-triage/decision-log 逻辑摘要，文本中可 grep 到两个路径字符串（`workflows/scope-triage/SKILL.md` 和 `workflows/decision-log/SKILL.md`），stage-result facts 扩展 `decision_log_path` key；同步更新 `contracts/facts-subschema.json` 的 make-decision required_keys 加 decision_log_path。完成定义：`npx vitest run tests/facts-subschema.test.mjs` 中 make-decision facts 含 decision_log_path 的反例红 / 正例绿。

### Files

- 修改 `workflows/make-decision/SKILL.md`（升级提示词内容）
- 修改 `contracts/facts-subschema.json`（make-decision required_keys 加 decision_log_path）
- 修改 `tests/facts-subschema.test.mjs`（加 decision_log_path 反例 + 正例断言）

### Tasks

- [x] T009 写 tests/facts-subschema.test.mjs 中 decision_log_path 相关新断言：反例（facts 缺 decision_log_path → 应失败）+ 正例（facts 含 decision/scope/decision_log_path 三 key 非空 → 应过）。跑 `npx vitest run tests/facts-subschema.test.mjs` 应 RED（schema 未更新），存 apply/evidence/phase-3-RED.json。[FR-INTK-002][FR-CI-001]
- [x] T010 更新 `contracts/facts-subschema.json`：make-decision 段的 required_keys 从 `[decision, scope]` 扩为 `[decision, scope, decision_log_path]`，semantics 补 decision_log_path 说明（值形如 tasks/<任务>/decision-log.md，供下游 M8 消费）。[FR-INTK-002]
- [x] T011 升级 `workflows/make-decision/SKILL.md`：在提示词正文中——①内联 scope-triage 逻辑摘要（执行步骤：分流范围，判定 in-scope/out-of-scope）；②内联 decision-log 逻辑摘要（执行步骤：收敛产出 decision-log 文件，7 节结构）；③显式写出路径引用字符串 `workflows/scope-triage/SKILL.md` 和 `workflows/decision-log/SKILL.md`（可 grep）；④stage-result facts 示例扩展加 decision_log_path key（值示例 tasks/<任务>/decision-log.md）；⑤保留原有 collector 指标记录要求（recordSkeleton/updateOwnResult）；⑥无执行代码、无 runtime 入口。跑 GREEN：`npx vitest run tests/facts-subschema.test.mjs` 应 0，存 apply/evidence/phase-3-GREEN.json。[FR-INTK-001][FR-INTK-002][FR-INTK-003][FR-METRIC-001]
- [x] T012 维护知识文件：写 apply/phase-3.md（make-decision 升级要点 + 路径引用位置 + facts-subschema 改动 + evidence 路径），同步 workflow-issues.jsonl + state.json。

### Verify

- **验证目标**：make-decision facts 含 decision_log_path 防空 object 假绿（FR-INTK-002）+ 路径引用可 grep（FR-INTK-001）
- **gate_cmd**：`cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/facts-subschema.test.mjs --reporter=verbose`
- **expected_exit**：`0`（GREEN）/ `非0`（RED）
- **evidence_path**：`$TASK_DIR/apply/evidence/phase-3-{RED,GREEN}.json`
- **display_cmd**：`grep -c "workflows/scope-triage/SKILL.md" /Users/Hugh/Hugh/Project/workflowhub/workflows/make-decision/SKILL.md && grep -c "workflows/decision-log/SKILL.md" /Users/Hugh/Hugh/Project/workflowhub/workflows/make-decision/SKILL.md`

### Knowledge

apply/phase-3.md 记 make-decision 升级后的路径引用位置 + facts-subschema make-decision 段前后对比。

### STOP

反例 facts 缺 decision_log_path 不判失败 → 停（假绿，违 FR-INTK-002）。make-decision SKILL.md 内找不到两个路径字符串 → 停（违 FR-INTK-001）。文件含执行代码 → 停（违 FR-INTK-003）。

---

## Phase 4: roadmap.md + CONTEXT.md + reuse-registry.md

- ui_change: false

### Goal

改 `roadmap.md` 命名全局对齐（intake→make-decision 等约 26 处，仅文档，代码级不动）；在 `CONTEXT.md` 补「组件 skill」概念定义段；新建 `reuse-registry.md`（7 个 skill，各一行，含类别枚举 + 来源路径）。完成定义：三文件改动可人工核对，Phase 5 冒烟测试将机器验证 reuse-registry 格式。

### Files

- 修改 `roadmap.md`（命名全局对齐，仅文档）
- 修改 `CONTEXT.md`（追加「组件 skill」概念定义段）
- 新增 `reuse-registry.md`（仓根 markdown 表）

### Tasks

- [x] T013 改 `/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md`（roadmap.md 在 program artifacts 树（Knowledge），不在 workflowhub 仓）：全局搜索 intake/design/plan/apply/test-acceptance 等原名，逐处替换为 make-decision/build-spec/build-plan/build-code/verify-code（M7 roadmap 段 + M8-M13 段引用 + X4 等），约 26 处；不改 workflowhub 代码侧任何 intake 字面量（D-M7-9-clarify）。[FR-CI-003]（隐性必达 6）
- [x] T014 改 `CONTEXT.md`：追加「组件 skill（Component Skill）」概念定义段（不改已有内容，追加末尾）。内容含——①定义：组件 skill 是从属于某一顶层 skill 的可独立调起子流程；②约束：不单独产 stage-result（stage-result 一段一张由顶层 stage 产），只产 collector 指标记录；③引用关系：由顶层 skill 提示词正文显式写路径字符串声明；④合宪依据：S7 约束 stage 级 skill，stage 内可复用组件不与 S7 冲突（D-M7-2）。[FR-SCOPE-001][FR-DLOG-001]（已决 2）
- [x] T015 新建 `reuse-registry.md`（仓根）：markdown 表，表头 `skill 名 | 复用类别 | 来源路径`，7 行——make-decision（自研/none）、build-spec（自研/none）、build-plan（自研/none）、build-code（自研/none）、verify-code（自研/none）、scope-triage（外部改造适配/来源路径）、decision-log（外部改造适配/来源路径）；每行复用类别属枚举三值之一（外部改造适配 / 自研 / 其他平台原生），外部 skill 来源路径非空，自研写 none。[FR-REG-001][FR-REG-002]
- [x] T016 维护知识文件：写 apply/phase-4.md（roadmap 改名点计数 + CONTEXT.md 新增段位置 + reuse-registry 7 行内容摘要），同步 workflow-issues.jsonl + state.json。

### Verify

- **验证目标**：roadmap 命名对齐（人工核）+ CONTEXT.md 概念定义段存在（人工核）+ reuse-registry 格式合法（Phase 5 机器验）
- **gate_cmd**：`set -euo pipefail; test -f /Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md || (echo "ERROR: roadmap.md not found" && exit 1); grep -q "make-decision" /Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md || (echo "ERROR: roadmap.md has no make-decision occurrences" && exit 1); test -f /Users/Hugh/Hugh/Project/workflowhub/reuse-registry.md || (echo "ERROR: reuse-registry.md not found" && exit 1); INTAKE_HITS=$(grep -r "intake" /Users/Hugh/Hugh/Project/workflowhub/workflows/ /Users/Hugh/Hugh/Project/workflowhub/contracts/ /Users/Hugh/Hugh/Project/workflowhub/config/ 2>/dev/null | grep -v "_spike" | grep -v "binary" | grep -v ".json:" || true); test -z "$INTAKE_HITS" || (echo "ERROR: forbidden code-level intake literals found: $INTAKE_HITS" && exit 1); echo "Phase 4 gate: all checks passed"`
- **expected_exit**：`0`
- **evidence_path**：`$TASK_DIR/apply/evidence/phase-4-done.json`（人工核通过后落盘）
- **display_cmd**：`grep "组件 skill" /Users/Hugh/Hugh/Project/workflowhub/CONTEXT.md | head -3`

### Knowledge

apply/phase-4.md 记 roadmap 改名前后对照（原名 vs 新名，处数）+ CONTEXT.md 新增段摘要 + reuse-registry 7 行内容。

### STOP

roadmap.md 改名遗漏代码侧 intake 字面量 → 停（违 D-M7-9-clarify，代码级不在 M7 范围）。CONTEXT.md 改了已有内容（非追加）→ 停（protected-paths 风险）。reuse-registry 7 行不全 → 停（违 FR-REG-001）。类别值非枚举三值 → 停（违 FR-REG-002）。

---

## Phase 5: CI 冒烟扩展 + 扫描器扩展 + 全量零回归

- ui_change: false

### Goal

seven-skills-present 字面量断言（7 个 skill 名各自独立断言，删任一目录则精确一个断言红）+ registry 行格式轻量断言（类别枚举 + 来源非空）+ 扫描器 check-stage-quality.mjs 扩到三 skill 正例覆盖（make-decision/scope-triage/decision-log 各一）。完成定义：`npx vitest run tests/five-skills-present.test.mjs tests/metric-scan.test.mjs` 全绿 + `npm run check` 全绿。

### Files

- 修改 `tests/five-skills-present.test.mjs`（加 scope-triage/decision-log 字面量断言 + registry 行格式断言 + stage-result 契约形状 decision_log_path 断言）
- 修改 `tests/metric-scan.test.mjs`（加 scope-triage/decision-log 正例覆盖断言）
- 修改 `scripts/check-stage-quality.mjs`（扫描范围扩到 scope-triage/decision-log）

### Tasks

- [x] T017 改 tests/five-skills-present.test.mjs 两处：①存在性检查段（当前第 33-39 行为 for-of SKILL_DIRS 遍历，弱可证伪，删一目录循环跟着缩不红）——展开成 7 个独立字面量 test()，skill 名逐个硬编码（make-decision/build-spec/build-plan/build-code/verify-code/scope-triage/decision-log），禁 for-of，删任一目录则精确一个 test 红；②registry 检查段（当前第 79-112 行已是逐字面量独立 test()，仅含原 5 个 skill）——扩到 7 个字面量，覆盖 scope-triage/decision-log；另加 registry 行格式断言（逐行校验：含类别枚举值三选一 + 来源路径非空）+ stage-result 契约形状断言（make-decision facts 含 decision/scope/decision_log_path 三 key 非空，用 facts-subschema.json 校验）；③新增 AC5 机器覆盖断言——读取 `workflows/make-decision/SKILL.md` 内容，独立 test() 断言含字符串 `workflows/scope-triage/SKILL.md`，再一个独立 test() 断言含字符串 `workflows/decision-log/SKILL.md`，缺任一则该 test 红（两断言禁合并成一个 test，须各自独立，保证删任一引用路径精确一红）。跑 `npx vitest run tests/five-skills-present.test.mjs` 应 RED（改动前缺 scope-triage/decision-log/registry），存 apply/evidence/phase-5-RED.json。[FR-CI-001][FR-CI-002][FR-CI-003][FR-REG-002][AC5]
- [x] T018 改 `tests/metric-scan.test.mjs`：在正例测试套件中加 scope-triage 和 decision-log 两个 SKILL.md 的正例覆盖断言（两文件含 recordSkeleton + updateOwnResult + metrics/collector.mjs → scanSkillMetrics 返回 found:false），以及扫描器处理三 skill 后全量退出 0 的集成测试。[FR-METRIC-003][FR-METRIC-001]
- [x] T019 增强 `scripts/check-stage-quality.mjs` 的 `scanSkillMetrics` 函数：在已有 token 名检查（recordSkeleton/updateOwnResult）基础上，新增两项检查——①用字符串匹配扫描 SKILL.md 文件内容是否含 `collector.mjs`（组件 skill 必须显式引用路径，不能只写 token 名，缺该字符串则 scanSkillMetrics 返回 found:false）；②stage 字段是正确的字面量（scope-triage 文件里 stage 字段值为 `scope-triage`，decision-log 文件里为 `decision-log`，不能是 `make-decision`）。对应测试 `tests/metric-scan.test.mjs`（T018）须加以下两项可证伪负例断言，每个负例提交前须手工改坏确认真红才算过：a) 构造含 recordSkeleton/updateOwnResult 但无 `collector.mjs` 字符串的 SKILL 内容（即删掉 collector.mjs 引用行） → scanSkillMetrics 应返回 found:false，且扫描器对该 SKILL 退出非 0（负例可证伪：不删该行测试无法红）；b) 构造含正确 `collector.mjs` 路径引用但 stage 字面量错误（如 `stage: 'make-decision'`）的 scope-triage SKILL → scanSkillMetrics 应返回 found:false（负例可证伪：stage 字面量改正确后测试变绿）。跑 GREEN：`npx vitest run tests/five-skills-present.test.mjs tests/metric-scan.test.mjs` 应 0，存 apply/evidence/phase-5-GREEN.json。[FR-METRIC-003][FR-METRIC-002]
- [x] T020 全量零回归验证：跑 `cd /Users/Hugh/Hugh/Project/workflowhub && npm run check`（全量 CI 检查）+ `npx vitest run`（全量测试），确认无回归（M6 已有测试全部继续绿）。[隐性必达 3]
- [x] T021 **AC1/AC3/AC5 验收（M7 契约/记录层，与 spec reword + D-M7-12 对齐）** [FR-INTK-002]：M7 无机器执行入口（FR-INTK-003 / D-M7-8），故以下三项在 M7 以契约/记录层机器可验证替代证据验收（通过标准 = 文件/契约/记录状态，非命令执行结果）；每条 M7 pass/fail + M8+ 运行时 oracle（deferred）记录到 apply/evidence/runtime-acceptance.md：
  - **AC1（decision-log 产出契约）** [FR-INTK-002 spec AC1]：**M7 验收**：make-decision SKILL.md 正确指令产出 `tasks/<任务>/decision-log.md`——产物契约由 decision-log 组件 skill 定义（7 节：原始需求/问题与目标/决策记录/假设/明确不做/开放问题/验收标准 + 至少一条含非空来源证据的决策），且 stage-result facts 含非空 `decision_log_path`（facts-subschema required_keys 守护，可 grep 核实 FR-INTK-001）。pass(M7): SKILL.md 契约含 7 节指令 + facts 含 decision_log_path 非空 + decision-log 组件契约对齐。fail(M7): 契约缺节 / facts 漏 decision_log_path / 为空占位。**M8+ oracle（deferred）**：实跑 /make-decision 产真实 decision-log.md 文件按 7 节核对，依赖 M8+ 集成入口。
  - **AC3（collector 记录数契约 ≥ 涉及 skill 数）** [spec AC3]：**M7 验收**：make-decision / scope-triage / decision-log 三 SKILL.md 各被指令写一条独立 collector 记录（metric wiring 完整：recordSkeleton + updateOwnResult + collector.mjs 引用 + stage 字面量正确），故记录数契约 ≥ 实际调起数（≤3）。pass(M7): 三 skill metric wiring 均完整（scanSkillMetrics + metric-scan 测试绿）。fail(M7): 任一 wiring 不全。**M8+ oracle（deferred）**：实跑一次产真实 collector 记录、按记录数核对，依赖 M8+ 入口。
  - **AC5（组件 stage 字面量 + execution_id 契约）** [FR-INTK-002 spec AC5]：**M7 验收**：scope-triage / decision-log 两组件 SKILL.md 各被指令写 stage 字面量分别为 `scope-triage` / `decision-log` 的独立 collector 记录（独立 execution_id 由各 skill 指令保证，stage 字面量由 scanner 可证伪守护——破坏即 RED），且 make-decision facts 的 decision_log_path 与 AC1 产物契约路径一致。pass(M7): 两组件 stage 字面量正确 + wiring 完整 + decision_log_path 路径形态对齐。fail(M7): stage 字面量错 / wiring 不全 / 路径不对齐。**M8+ oracle（deferred）**：实跑后两条 collector 记录各有独立 execution_id，依赖 M8+ 入口。
  - 注：M7 验收对静态契约 + 机器可验证替代证据核对，结果记 apply/evidence/runtime-acceptance.md（每条 AC 编号 + M7 pass/fail + 一句证据 + M8+ oracle deferred 说明）。运行时端到端实测归 M8+，与 spec AC reword + D-M7-12 一致。[AC1][AC3][AC5]
- [x] T022 维护知识文件：写 apply/phase-5.md（seven-skills 字面量断言位置 + registry 断言逻辑 + 扫描器扩展点 + 全量测试结论 + 运行时验收结论），evidence 落盘，同步 workflow-issues.jsonl + state.json。

### Verify

- **验证目标**：七 skill 字面量断言（AC6/FR-CI-001）+ registry 行格式（AC4/FR-CI-002）+ 扫描器三 skill 覆盖（AC6/FR-METRIC-003）+ 零回归（隐性必达 3）
- **gate_cmd**：`cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run tests/five-skills-present.test.mjs tests/metric-scan.test.mjs --reporter=verbose && npm run check`
- **expected_exit**：`0`（GREEN）/ `非0`（RED）
- **evidence_path**：`$TASK_DIR/apply/evidence/phase-5-{RED,GREEN}.json`
- **display_cmd**：`cd /Users/Hugh/Hugh/Project/workflowhub && npx vitest run --reporter=verbose 2>&1 | tail -20`

### Knowledge

apply/phase-5.md 记七 skill 字面量断言完整列表 + registry 断言逻辑 + 扫描器三 skill 正例文件路径 + 全量测试通过数。

### STOP

`scope-triage` / `decision-log` 字面量断言用 for-of 变量遍历 → 停（违 FR-CI-001 可证伪原则，改为逐条字面量 test）。registry 任一行缺类别 / 来源 → 停（违 FR-REG-002）。npm run check 红 → 停（M6 回归）。

---

## 依赖关系

- Phase 1 → Phase 2（两组件 skill 可并行建，但五-skills 测试共享，建议串行避免合并冲突）
- Phase 1 + Phase 2 → Phase 3（make-decision 升级需两组件已建，路径引用才完整）
- Phase 3 → Phase 5（facts-subschema 扩展后 Phase 5 的契约形状断言才能绿）
- Phase 4（roadmap/CONTEXT/registry）可在 Phase 1-3 之后任意时间并行，Phase 5 的 registry 断言依赖 Phase 4 reuse-registry.md 已建
- Phase 5 最后跑，依赖 Phase 1-4 全部完成

## 实现策略

MVP = Phase 1 + Phase 2（两组件 skill 可发现）。Phase 3 补 make-decision 升级和 facts 扩展。Phase 4 补文档。Phase 5 补 CI 扩展和全量验证。每 phase 独立可测（各有 RED→GREEN）。
