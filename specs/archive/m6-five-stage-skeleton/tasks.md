# 任务分解：M6 五段薄骨架

> 基于 plan.md（3 phase）+ spec.md（14 FR）。交付仓：workflowhub。
> 每 task 引至少一个 FR。每 phase 六节（Goal/Files/Tasks/Verify/Knowledge/STOP）。
> 路径相对 workflowhub 仓根（/Users/Hugh/Hugh/Project/workflowhub）。

## Phase 1: 五段 skill 本体 + registry 注册

- ui_change: false

### Goal

workflows/ 下五个目录各有一份纯提示词 SKILL.md（从 agenthub 对应五段提示词提取"该阶段干什么"，剥掉 gate 机制），五段命令可被 Skill 工具发现，registry 各注册一条。完成定义：tests/five-skills-present.test.mjs 绿（五目录齐 + 各 SKILL.md 有合法 frontmatter + registry 五条）。

### Files

- 新增 workflows/make-decision/SKILL.md
- 新增 workflows/build-spec/SKILL.md
- 新增 workflows/build-plan/SKILL.md
- 新增 workflows/build-code/SKILL.md
- 新增 workflows/verify-code/SKILL.md
- 修改 config/workflowhub.yaml（registry 加五条）
- 新增 tests/five-skills-present.test.mjs

### Tasks

- [x] T001 采集当前失败输出：先写 tests/five-skills-present.test.mjs（断言五目录各有 SKILL.md + 合法 frontmatter name/description + registry 五条），跑 `node --test tests/five-skills-present.test.mjs` 应 RED（文件未建），保存输出到 apply/evidence/phase-1-RED.json。[FR-SKILL-004][FR-WIRING-001]
- [x] T002 写 workflows/make-decision/SKILL.md：纯提示词，intake 段"该阶段干什么"（澄清需求→产 stage-result 产物 facts 含 decision/scope→写一条指标），无 gate/checkpoint/Post-Review 段。[FR-SKILL-001][FR-SKILL-002][FR-SKILL-003]
- [x] T003 写 workflows/build-spec/SKILL.md：design 段纯提示词（产 spec→facts 含 spec_ref/requirements→写指标），内置 F10 防过度工程硬约束文字段。[FR-SKILL-001][FR-SKILL-002][FR-ANTIBLOAT-001]
- [x] T004 写 workflows/build-plan/SKILL.md：plan 段纯提示词（产 plan→facts 含 plan_ref/tasks→写指标），内置 F10 防过度工程约束文字段。[FR-SKILL-001][FR-SKILL-002][FR-ANTIBLOAT-001]
- [x] T005 写 workflows/build-code/SKILL.md：apply 段纯提示词（只认上游 stage-result 产物按 facts key 取输入→facts 含 changed/tests→写指标），slim 路直读 make-decision 产物不假定 spec/plan。[FR-SKILL-001][FR-SKILL-002][FR-CONTRACT-003]
- [x] T006 写 workflows/verify-code/SKILL.md：test-acceptance 段纯提示词（验证交付→facts 含 verdict/evidence_ref→写指标），写清与 verify-change 的语义区别。[FR-SKILL-001][FR-SKILL-002]
- [x] T007 改 config/workflowhub.yaml：registry 加五条（component_id/workflow/path 指向各 SKILL.md）。跑 GREEN：`node --test tests/five-skills-present.test.mjs` 应 0，存 apply/evidence/phase-1-GREEN.json。[FR-WIRING-001][FR-SKILL-004]
- [x] T008 维护知识文件：审查摘要 + Files Touched 写 apply/phase-1.md，evidence 落 apply/evidence/，同步 workflow-issues.jsonl + state.json。

### Verify

- **验证目标**：五段齐全可发现 + registry 注册（AC1/AC4）。
- **gate_cmd**：`node --test tests/five-skills-present.test.mjs`
- **expected_exit**：`0`（GREEN）/ `非0`（RED）
- **evidence_path**：`$TASK_DIR/apply/evidence/phase-1-{RED,GREEN}.json`
- **display_cmd**：`ls workflows/*/SKILL.md && grep -c name config/workflowhub.yaml`

### Knowledge

apply/phase-1.md 记五段提取来源（agenthub 哪段提示词）+ 剥掉了哪些 gate 段 + registry 改动。

### STOP

T001 RED 未见红 → 停（测试没写对）。五段任一残留 gate/checkpoint 段 → 停（违反 FR-SKILL-002）。

---

## Phase 2: facts 子 schema 校验 + 指标接入

- ui_change: false

### Goal

五段 facts 子 schema 落地校验（每段必含 spec 第 6 章约定 key 非空，防空 object 假绿），每段提示词要求写一条指标到 metrics_path。完成定义：tests/facts-subschema.test.mjs 绿（正样例过 + 反样例 facts={}/缺 key 判失败）。

### Files

- 新增 contracts/facts-subschema.json（五段 facts 子 schema）
- 新增 scripts/validate-stage-result.mjs（校验产物过 stage-result + 本段 facts 子 schema）
- 新增 tests/facts-subschema.test.mjs
- 修改五段 SKILL.md（补"写一条指标"提示词段，若 Phase1 未含）

### Tasks

- [x] T009 采集失败输出：写 tests/facts-subschema.test.mjs（正样例：build-code facts 含 changed+tests 非空→过；反样例：facts={} 或缺 key→失败，逐段覆盖五段 key）。跑应 RED（校验脚本/schema 未建），存 apply/evidence/phase-2-RED.json。[FR-CONTRACT-002]
- [x] T010 写 contracts/facts-subschema.json：按 spec 第 6 章表定五段 facts 子 schema（make-decision: decision/scope; build-spec: spec_ref/requirements; build-plan: plan_ref/tasks; build-code: changed/tests; verify-code: verdict/evidence_ref），每段 required 含约定 key、key 值非空约束。[FR-CONTRACT-002]
- [x] T011 写 scripts/validate-stage-result.mjs：先过 stage-result.contract.json，再按段名取 facts-subschema 校验 facts 含约定 key 非空（SIG-001）。[FR-CONTRACT-001][FR-CONTRACT-002]
- [x] T012 确认五段 SKILL.md 提示词要求写一条指标记录到 metrics_path（含"哪段/哪个 skill"标识，复用现有 metrics 格式不另立 schema）。跑 GREEN：`node --test tests/facts-subschema.test.mjs` 应 0，存 apply/evidence/phase-2-GREEN.json。[FR-METRIC-001][FR-CONTRACT-002]
- [x] T013 维护知识文件：写 apply/phase-2.md（facts 子 schema 与 spec 第 6 章对齐确认 + 指标接入方式），evidence 落盘，同步 ledger + state。

### Verify

- **验证目标**：facts 子 schema 防空 object 假绿（AC7）+ 每段约定 key（FR-CONTRACT-002）。
- **gate_cmd**：`node --test tests/facts-subschema.test.mjs`
- **expected_exit**：`0`（GREEN）/ `非0`（RED）
- **evidence_path**：`$TASK_DIR/apply/evidence/phase-2-{RED,GREEN}.json`
- **display_cmd**：`node scripts/validate-stage-result.mjs --self-test 2>&1 | tail`

### Knowledge

apply/phase-2.md 记五段 facts key 与 spec 第 6 章逐段对照 + 校验脚本接入点。

### STOP

facts 子 schema key 与 spec 第 6 章不一致 → 停（范围漂移，回 spec 核）。反样例 facts={} 不判失败 → 停（假绿未防住）。

---

## Phase 3: 扫描器扩展 + writing-great-skills 优化 + 端到端串通验证

- ui_change: false

### Goal

扩展 check-stage-quality.mjs 能检漏接指标的 skill；五份 SKILL.md 逐份用 writing-great-skills 优化；人/AI 实跑 big + small 两路端到端验证串通。完成定义：tests/metric-scan.test.mjs 绿（漏接 skill 被扫出退出码非 0），五份经优化，两路实跑无断链。

### Files

- 修改 scripts/check-stage-quality.mjs（加"检漏接指标 skill"检测）
- 新增 tests/metric-scan.test.mjs
- 修改五段 SKILL.md（writing-great-skills 优化）

### Tasks

- [x] T014 采集失败输出：写 tests/metric-scan.test.mjs（构造一份漏接指标的 skill fixture → 扫描器应退出码非 0 并指出该 skill；五段正确接 → 退出码 0）。跑应 RED（扫描器未扩展），存 apply/evidence/phase-3-RED.json。[FR-METRIC-002]
- [x] T015 扩展 scripts/check-stage-quality.mjs：加"skill 是否接指标"检测（保留现有三类反模式检测，改前跑现有 tests 录基线，SIG-003）。跑 GREEN：`node --test tests/metric-scan.test.mjs` 应 0，存 apply/evidence/phase-3-GREEN.json。[FR-METRIC-002]
- [x] T016 五份 SKILL.md 逐份用 writing-great-skills 优化（不改语义只提质量），优化后复跑 Phase1/2 测试确认无回归。**优化证据（写入 apply/phase-3.md）**：逐份列出五个 SKILL.md 文件名 + 各自 writing-great-skills 执行记录/输出摘要 + 优化前后差异要点（如精简了哪段、补了哪个结构），五份缺任一份证据即 AC3 不达。[FR-OPT-001]
- [x] T017 人/AI 实跑端到端：big 路（五段全走）+ small 路（make-decision→build-code 跳步）。**端到端证据（写入 apply/phase-3.md）**：①big 路五段各产物的 stage-result 文件路径 + 各自 facts 约定 key 值快照；②small 路 build-code 实际从 make-decision facts.decision 取输入的证据；③metrics 文件里五段各一条记录的快照（AC5）；④大输出 skill 子代理回报样例证明只含摘要+路径无大段原文（AC9）；⑤任一段 error/无产物/传不到下段则记为失败。[FR-WIRING-002][FR-WIRING-003][FR-CONTRACT-003][FR-METRIC-001]
- [x] T018 维护知识文件：写 apply/phase-3.md（扫描器扩展点 + 优化记录 + 两路实跑证据），跑 workflowhub 既有 npm run check + 测试全绿确认零回归，evidence 落盘，同步 ledger + state。[隐性必达 3]

### Verify

- **验证目标**：扫描器检漏接（AC6）+ 优化（AC3）+ 两路串通（AC8/AC10）+ 零回归（AC11）。
- **gate_cmd**：`node --test tests/metric-scan.test.mjs && cd /Users/Hugh/Hugh/Project/workflowhub && npm run check`
- **expected_exit**：`0`（GREEN）/ `非0`（RED）
- **evidence_path**：`$TASK_DIR/apply/evidence/phase-3-{RED,GREEN}.json`
- **display_cmd**：`node scripts/check-stage-quality.mjs --self-test 2>&1 | tail`

### Knowledge

apply/phase-3.md 记扫描器扩展逻辑 + 五份优化 diff 要点 + big/small 两路实跑命令与结果。

### STOP

漏接 fixture 不被扫出 → 停（FR-METRIC-002 未达）。两路任一断链 → 停（AC10）。npm run check 红 → 停（回归）。

---

## 依赖关系

- Phase 1 → Phase 2（facts 校验依赖五段已建）→ Phase 3（扫描器/优化/串通依赖前两 phase）。
- 三 phase 严格串行（同改五段 SKILL.md，不可并行）。

## 实现策略

MVP = Phase 1（五段可调起）。Phase 2/3 增量补契约校验、指标扫描、优化与端到端验证。每 phase 独立可测（各有 RED→GREEN 测试）。
