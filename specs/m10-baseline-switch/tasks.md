# M10 Tasks — 基线映射 + 自举切换

## Phase 1: agenthub-baseline.mjs

- ui_change: false

### Tasks
- [x] T001 [FR-BASE-001] 创建独立基线脚本骨架
  - 入参：metrics/baseline.mjs (读DERIVED_METRICS/DERIVATION_SOURCE常量), metrics/record-schema.mjs
  - 出参：scripts/agenthub-baseline.mjs (可执行骨架,import常量通过)
  - 文件：scripts/agenthub-baseline.mjs
  - 验证：`node -e 'require("./scripts/agenthub-baseline.mjs")'` exit=0

- [x] T002 [FR-BASE-001] 实现journal读取+5项指标推导
  - 入参：4个历史task的journal.jsonl路径
  - 出参：5项指标计算公式实现(6条推导规则)
  - 文件：scripts/agenthub-baseline.mjs
  - 验证：`node --test tests/agenthub-baseline.test.mjs` 全部通过

- [x] T003 [FR-BASE-002,FR-BASE-003] 实现基线计算+source_type标注
  - 入参：4个task的指标值
  - 出参：4 task均值 + 每行source_type(direct/proxy/weak_proxy) + source_ref
  - 文件：scripts/agenthub-baseline.mjs
  - 验证：输出含5行×7列数据,source_type列非空

- [x] T004 [FR-BASE-004] 验证baseline.mjs未被修改(只import常量)
  - 入参：baseline.mjs 当前hash
  - 出参：hash对比结果,import语句仅含DERIVED_METRICS/DERIVATION_SOURCE
  - 文件：无新增
  - 验证：`git diff --name-only` 不含 metrics/baseline.mjs

- [x] T005 [FR-BASE-001,FR-BASE-002,FR-BASE-003,FR-BASE-004] 维护知识文件
  - 入参：apply/evidence/phase-1-GREEN.json
  - 出参：apply/phase-1.md (Files Touched / 审查摘要 / FR覆盖确认)
  - 文件：apply/phase-1.md
  - 验证：apply/phase-1.md 存在且含Files Touched清单

### Goal
产出agenthub-baseline.mjs:从4个agenthub历史task的journal.jsonl读取事件流,按6条推导规则算5项指标,输出带source_type标注的基线报告。

### Files
- scripts/agenthub-baseline.mjs (新增,~200行)
- tests/agenthub-baseline.test.mjs (新增,~100行)

### Verify
`node --test tests/agenthub-baseline.test.mjs`

### Knowledge
apply/phase-1.md

### STOP
5项指标值可复算、source_type非空、baseline.mjs hash不变 → 进Phase 2

---

## Phase 2: metrics-writer.mjs

- ui_change: false

### Tasks
- [x] T006 [FR-COLL-001] 创建metrics-writer.mjs
  - 入参：metrics/collector.mjs (recordSkeleton, updateOwnResult, collectFacts)
  - 出参：workflows/verify-code/metrics-writer.mjs (~30行)
  - 文件：workflows/verify-code/metrics-writer.mjs
  - 验证：`node -e 'require("./metrics-writer.mjs")'` exit=0,不报import错误

- [x] T007 [FR-COLL-001,FR-COLL-002] 集成smoke测试
  - 入参：metrics-writer.mjs + verify-code SKILL.md (确认调用点)
  - 出参：task-metrics.jsonl 含一条合法记录
  - 文件：workflows/verify-code/metrics-writer.mjs
  - 验证：`node --test tests/metrics-smoke.test.mjs` 全部通过

- [x] T008 [FR-COLL-001,FR-COLL-002] 维护知识文件
  - 入参：apply/evidence/phase-2-GREEN.json
  - 出参：apply/phase-2.md
  - 文件：apply/phase-2.md
  - 验证：apply/phase-2.md 存在且含host-adapter.mjs hash确认(未被修改)

### Goal
verify-code目录下新增metrics-writer.mjs,导入collector.mjs。在verify-code SKILL.md的步骤2(recordSkeleton)和步骤9(updateOwnResult)处插入metrics-writer.mjs调用,产task-metrics.jsonl。不碰host-adapter.mjs。

### Files
- workflows/verify-code/metrics-writer.mjs (新增,~30行)

### Verify
`node --test tests/metrics-smoke.test.mjs`
 task-metrics.jsonl存在且至少1条记录,host-adapter.mjs hash不变

### Knowledge
apply/phase-2.md

### STOP
task-metrics.jsonl可产出 → 进Phase 3

---

## Phase 3: 字段映射 + 对照报告

- ui_change: false

### Tasks
- [x] T009 [FR-MAP-001,FR-MAP-002] 生成字段映射样例
  - 入参：5项指标推导规则(Phase 1) + decision-log 固定映射表
  - 出参：specs/m10-baseline-switch/field-mapping.md (5行×7列)
  - 文件：specs/m10-baseline-switch/field-mapping.md
  - 验证：7列齐全(metric_name/journal_event/workflowhub_field/formula/polarity/source_type/missing_behavior),rework_proxy_count标注weak_proxy

- [x] T010 [FR-BASE-001] 端到端运行+产出对照报告
  - 入参：agenthub-baseline.mjs + verify-code产出的task-metrics.jsonl
  - 出参：specs/m10-baseline-switch/baseline-report.md (固定表格+三行结论)
  - 文件：specs/m10-baseline-switch/baseline-report.md
  - 验证：报告含5行数据+source_type列+source_ref+"5项中N项不差于基线"

- [x] T011 [FR-MAP-002] 验证报告诚实标注
  - 入参：baseline-report.md
  - 出参：确认"仅verify-code段有真采集数据,其余4段为代理推导"的文字
  - 文件：无新增
  - 验证：grep baseline-report.md 含"代理推导"或"proxy"

- [x] T012 [FR-MAP-001,FR-MAP-002] 维护知识文件
  - 入参：apply/evidence/phase-3-GREEN.json
  - 出参：apply/phase-3.md
  - 文件：apply/phase-3.md
  - 验证：apply/phase-3.md 存在且含字段映射FR覆盖确认

### Goal
产出字段映射样例(5行×7列)和首个端到端对照报告(固定表格+三行结论,诚实标注数据来源)。

### Files
- specs/m10-baseline-switch/field-mapping.md (新增)
- specs/m10-baseline-switch/baseline-report.md (新增)

### Verify
`node scripts/agenthub-baseline.mjs --report`
5行完备,source_type/source_ref非空,结论诚实标注"仅verify-code有真数据"

### Knowledge
apply/phase-3.md

### STOP
对照报告完整且诚实 → 进Phase 4

---

## Phase 4: 冻结/退役 + 迁移/回滚文档

- ui_change: false

### Tasks
- [x] T013 [FR-FREEZE-001,FR-FREEZE-002] 写freeze-and-retire.md
  - 入参：decision-log D2/D5/D12
  - 出参：docs/freeze-and-retire.md
  - 文件：docs/freeze-and-retire.md
  - 验证：含N₁=3(降级只读fallback)/N₂=5(全量退役);退役条件可复算;不设自动gate

- [x] T014 [FR-MIG-001,FR-MIG-002,FR-MIG-003] 写migration-and-fallback.md
  - 入参：decision-log D8/D11/D12
  - 出参：docs/migration-and-fallback.md
  - 文件：docs/migration-and-fallback.md
  - 验证：含switch/hold/rollback/manual_review四分支+判定条件+"现跑task=state=active且currentStatus≠completed";回滚步骤可执行;fallback触发=人看报告≥2bad+根因workflowhub

- [x] T015 [FR-FREEZE-001,FR-FREEZE-002,FR-MIG-001,FR-MIG-002,FR-MIG-003] 维护知识文件
  - 入参：apply/evidence/phase-4-GREEN.json
  - 出参：apply/phase-4.md
  - 文件：apply/phase-4.md
  - 验证：apply/phase-4.md 存在且含markdownlint通过确认

### Goal
产出freeze-and-retire.md(两段式退役规则)和migration-and-fallback.md(四分支迁移回滚流程),全部基于decision-log对应决策。

### Files
- docs/freeze-and-retire.md (新增)
- docs/migration-and-fallback.md (新增)

### Verify
`npx markdownlint docs/freeze-and-retire.md docs/migration-and-fallback.md`
两个文件通过;grep确认N=3/5和四分支判定条件完整

### Knowledge
apply/phase-4.md

### STOP
两份文档可用 → 进Phase 5

---

## Phase 5: CI + 终验

- ui_change: false

### Tasks
- [x] T016 [FR-CI-001] 追加CI smoke job
  - 入参：.github/workflows/ci.yml
  - 出参：ci.yml 追加M10 job (node scripts/agenthub-baseline.mjs --smoke)
  - 文件：.github/workflows/ci.yml
  - 验证：CI配置语法正确,smoke job独立可运行

- [x] T017 [FR-CI-002] 字段映射schema校验
  - 入参：field-mapping.md (5行×7列)
  - 出参：contracts/field-mapping.schema.json + CI校验步骤
  - 文件：contracts/field-mapping.schema.json
  - 验证：schema可校验5行×7列,source_type值白名单[direct/proxy/weak_proxy]

- [x] T018 [FR-BASE-004,FR-COLL-002] 终验:baseline.mjs+host-adapter.mjs hash不变
  - 入参：baseline.mjs, host-adapter.mjs
  - 出参：hash对比确认
  - 文件：无新增
  - 验证：`git diff --name-only` 不含 metrics/baseline.mjs 和 metrics/adapters/host-adapter.mjs

- [x] T019 [FR-CI-001,FR-CI-002,FR-BASE-004,FR-COLL-002] 维护知识文件+终验报告
  - 入参：apply/evidence/phase-5-GREEN.json + 全phase审查摘要
  - 出参：apply/phase-5.md + 终验报告(AC1-AC8逐条对账)
  - 文件：apply/phase-5.md
  - 验证：apply/phase-5.md 含AC逐条对账+全FR覆盖确认

### Goal
CI冒烟通过,字段映射schema校验就位,终验确认全部8条AC达标,baseline.mjs和host-adapter.mjs未被修改。

### Files
- .github/workflows/ci.yml (修改,追加1个job)
- contracts/field-mapping.schema.json (新增)

### Verify
`npm run check`
 exit=0; CI smoke job独立可运行

### Knowledge
apply/phase-5.md

### STOP
全绿,8条AC逐条对账通过 → M10完成
