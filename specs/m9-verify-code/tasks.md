---
milestone: m9-verify-code
stage: plan
status: draft
ui_change: false
total_phases: 5
total_tasks: 19
---

# Tasks — M9 verify-code v1

> 所有 phase ui_change: false（M9 纯 skill 逻辑，无 UI 改动）
> 三段闭环：make-decision → build-code → verify-code
> 关键脚本：capture.mjs / freshness.mjs / facts-assembly.mjs（均在 workflows/verify-code/）

---

## Phase 1：capture.mjs 物理事实采集脚本（FR-FRESH-001/002）

**ui_change: false**

### Goal

新建 `workflows/verify-code/capture.mjs`，实现外部进程级物理事实采集：执行测试命令、采集 exit 码、提取 Test Files 行、记录 git_sha，写入 durable evidence JSON。不靠 LLM 自报，不阻断推进（F3/Q1）。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs` — 新建
- `/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-capture.test.mjs` — 新建

### Tasks

**Task 1.1 — 写 capture 测试（RED）** [FR-FRESH-001, FR-FRESH-002, FR-TEST-001]

- 入参：无（capture.mjs 不存在）
- 出参：`tests/verify-code-capture.test.mjs`，测试以下行为：
  1. `runCapture(command, outputPath, opts)` — 执行命令，写 JSON 到 outputPath，返回 `{ exit_code, git_sha, test_files_line, content_hash, timestamp, command }`
  2. exit_code 字段为真实整数
  3. 失败命令（exit≠0）时 JSON 仍写出，不抛异常（F3 不阻断）
  4. content_hash 为 sha256 hex，同输出同 hash（幂等）
  5. test_files_line 从 stdout 提取 `Test Files` 开头行，无匹配时为 null
  6. git_sha 字段为当前 HEAD sha（40 位 hex 字符串），opts.gitSha 可覆盖（供测试 stub）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-capture.test.mjs`

**Task 1.2 — 实现 capture.mjs（GREEN）** [FR-FRESH-001, FR-FRESH-002, FR-TEST-001]

- 入参：RED 证据（exit≠0）
- 出参：`workflows/verify-code/capture.mjs`
- 实现约束：
  - ESM `.mjs`，Node 22，`import { execSync } from 'node:child_process'`，`import { createHash } from 'node:crypto'`
  - 导出 `export async function runCapture(command, outputPath, { cwd, gitSha } = {})`
  - outputPath 目录不存在时自动 `mkdirSync` 创建
  - JSON 格式：`{ command, cwd, git_sha, exit_code, timestamp, test_files_line, content_hash }`
  - git_sha 未传时用 `git rev-parse HEAD` 获取当前 HEAD
  - 失败命令 exit≠0 时仍写 JSON，不 throw（F3）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs`

**Task 1.3 — 维护知识文件** [FR-FRESH-001]

- 入参：Phase 1 完成状态
- 出参：在 plan.md phase 1 evidence-contract 段填写真实 git_sha 和 timestamp
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md`

### Verify

```bash
# RED（预期 exit≠0）
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false

# GREEN（预期 exit=0）
node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false
# 确认 "Test Files  1 passed (1)"

# 直接调用验证
node workflows/verify-code/capture.mjs 2>&1 | head -5
```

### Knowledge

- capture.mjs 必须是外部进程，不能用 vi.mock 替代真实 exec（否则 exit 码可证伪性消失）
- test_files_line 提取用 `stdout.split('\n').find(l => l.includes('Test Files'))`
- outputPath 要用绝对路径，capture.mjs 内部不假设 cwd
- opts.gitSha stub 用于测试中替换 git 命令（让测试可在任何 HEAD 下稳定运行）

### STOP

Phase 1 完成条件：`tests/verify-code-capture.test.mjs` exit=0，`workflows/verify-code/capture.mjs` 可直接 import。

---

## Phase 2：freshness.mjs 鲜度校验纯函数（FR-FRESH-002/003/004）

**ui_change: false**

### Goal

新建 `workflows/verify-code/freshness.mjs`，实现鲜度校验逻辑：比对 build-code 事实包的 git_sha 与当前 HEAD，不匹配时写 `anomaly_flags:["stale_sha"]`，有 anomaly_flags 时产出可见 warnings，绝不 BLOCK / exit2（D-M9-2，C2，D5/D7）。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/freshness.mjs` — 新建
- `/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-freshness.test.mjs` — 新建

### Tasks

**Task 2.1 — 写 freshness 测试（RED）** [FR-FRESH-002, FR-FRESH-003, FR-FRESH-004, FR-TEST-001]

- 入参：无（freshness.mjs 不存在）
- 出参：`tests/verify-code-freshness.test.mjs`，测试以下行为：
  1. `checkFreshness(buildSha, headSha)` — sha 一致时返回 `{ anomaly_flags: [], warnings: [] }`
  2. sha 不一致时返回 `{ anomaly_flags: ["stale_sha"], warnings: [{ type: "warning", message: "..." }] }`
  3. anomaly_flags 非空时 warnings 数组非空（FR-FRESH-004 可见输出）
  4. **可证伪测试（FR-FRESH-004）**：构造 buildSha≠headSha 后断言 warnings 非空；注释掉 warning 生成代码时测试必须变红
  5. anomaly_flags 含 "stale_sha" 时，checkFreshness 不 throw，不 FAIL（FR-FRESH-003）
  6. `getAnomalyFlagsText(anomaly_flags)` — 将 anomaly_flags 数组格式化为人可读字符串（供 SKILL.md 边界输出）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-freshness.test.mjs`

**Task 2.2 — 实现 freshness.mjs（GREEN）** [FR-FRESH-002, FR-FRESH-003, FR-FRESH-004]

- 入参：RED 证据（exit≠0）
- 出参：`workflows/verify-code/freshness.mjs`
- 实现约束：
  - ESM `.mjs`，纯函数，无 IO，无副作用
  - 导出 `export function checkFreshness(buildSha, headSha)` — 比对两个 sha，返回 `{ anomaly_flags, warnings }`
  - 导出 `export function getAnomalyFlagsText(anomaly_flags)` — 格式化警告文本
  - 绝不 throw，绝不因 stale_sha 置 status="failure"（C2，D5/D7）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/freshness.mjs`

**Task 2.3 — 维护知识文件** [FR-FRESH-003]

- 入参：Phase 2 完成状态
- 出参：在 plan.md phase 2 evidence-contract 段填写真实 git_sha 和 timestamp
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md`

### Verify

```bash
# RED（预期 exit≠0）
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs --passWithNoTests=false

# GREEN（预期 exit=0）
node node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs --passWithNoTests=false

# 可证伪性：故意注释掉 warning 生成代码，确认 exit≠0
```

### Knowledge

- checkFreshness 是纯函数，不读 git（git_sha 由调用方传入），测试无环境依赖
- anomaly_flags 非空时 warnings 必须有对应条目（FR-FRESH-004 可见性红线）
- "stale_sha" 只是告知性警告，不影响 verdict（spec §8 anomaly_flags 扩展预留）

### STOP

Phase 2 完成条件：`tests/verify-code-freshness.test.mjs` exit=0，anomaly_flags 可证伪测试通过（故意破坏后变红）。

---

## Phase 3：facts-assembly.mjs stage-result 组装（FR-CMD-001/002, FR-PATH-001/002/003, FR-METRICS-004）

**ui_change: false**

### Goal

新建 `workflows/verify-code/facts-assembly.mjs`，实现：从事实包读取 command 字段（缺失时浮现明确错误，不静默）、组装七键 stage-result 结构、evidence_ref 路径对齐 D-M9-6、写 durable JSON。同时补 C1 build-code 侧 command 字段。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs` — 新建
- `/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-facts.test.mjs` — 新建
- `/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/facts-schema.mjs` — 修改（C1：追加 command 字段）

### Tasks

**Task 3.1 — 写 facts-assembly 测试（RED）** [FR-CMD-001, FR-CMD-002, FR-PATH-001, FR-PATH-002, FR-PATH-003, FR-METRICS-004, FR-TEST-001]

- 入参：无（facts-assembly.mjs 不存在）
- 出参：`tests/verify-code-facts.test.mjs`，测试以下行为：
  1. `readCommand(buildResult)` — 读 `facts.tests.command`（接收已解析的 JSON 对象），合法时返回 string
  2. `facts.tests.command` 缺失时抛错，error message 包含 "command" 字样（FR-CMD-002，可证伪：删掉抛错逻辑后测试变红）
  3. `facts.tests` 字段整体不存在时抛错，retryable=true 语义在 error.retryable 字段
  4. `assembleStageResult({ verdict, evidenceRef, anomalyFlags, missingItems, userDecision, reason, errorCode, retryable })` — 返回七键 stage-result 对象，所有键均存在
  5. 七键存在性可证伪：删掉 `user_decision` 字段后断言必须红
  6. `evidence_ref` 必须是相对 `specs/{task-id}/` 的相对路径（不含 `specs/{task-id}/` 前缀）（FR-PATH-003）
  7. **metrics 10 字段结构性检查**（FR-METRICS-004）：构造含 `execution_id/skill_or_stage/stage/skill_version/executed/tokens/duration_ms/rework_rounds/human_intervention/friction_ref` 十键的对象，`validateMetricRecord(record)` 返回 `{ valid: true, missing: [] }`；删掉任一键时返回 `{ valid: false, missing: [<key>] }`
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-facts.test.mjs`

**Task 3.2 — 实现 facts-assembly.mjs（GREEN）** [FR-CMD-001, FR-CMD-002, FR-PATH-001, FR-PATH-002, FR-PATH-003]

- 入参：RED 证据（exit≠0）
- 出参：`workflows/verify-code/facts-assembly.mjs`
- 实现约束：
  - ESM `.mjs`，纯函数（除 writeStageResult 外无 IO）
  - 导出 `export function readCommand(buildResult)` — 接收已解析的 JSON 对象，不读文件
  - 导出 `export function assembleStageResult(opts)` — 返回七键对象
  - 导出 `export function writeStageResult(taskSpecDir, result)` — 写 `${taskSpecDir}/stage-result-verify-code.json`
  - 导出 `export function validateMetricRecord(record)` — 校验 M4 10 字段是否全部存在
  - readCommand 对 command 缺失抛 `{ message, retryable: true }` 结构的 Error
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs`

**Task 3.3 — C1 build-code facts-schema.mjs 追加 command 可选字段** [FR-CMD-003]

- 入参：facts-assembly.mjs GREEN 后
- 出参：`workflows/build-code/facts-schema.mjs` 的 `validateFacts` 对 `facts.tests.command` 新增**可选字段校验**——字段 present 时校验类型为 string，字段 absent 时仍合法（不把历史 M8 旧 facts 判为 invalid，满足 C1 向后兼容要求）；如有 `buildTestsFact` 工厂函数，新增可选 command 参数
- 约束：追加语义，不删除/重命名已有字段；旧 M8 facts（无 command 字段）经 validateFacts 必须仍为 valid（回归不红）；verify-code 消费侧读到缺 command 时 status="failure" 是 verify-code 的行为，与 schema 校验无关
- 验证：`node node_modules/.bin/vitest run tests/build-code-facts.test.mjs --passWithNoTests=false` 仍 exit=0（回归不红）；须加一条测试用例：构造无 command 字段的旧 facts，验证 validateFacts 返回 valid（可证伪：改成必填后该测试变红）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/facts-schema.mjs`

**Task 3.4 — 维护知识文件** [FR-CMD-001]

- 入参：Phase 3 完成状态
- 出参：在 plan.md phase 3 evidence-contract 段填写真实 git_sha 和 timestamp
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md`

**Task 3.5 — C1 同步 build-code SKILL.md 声明 command 字段** [FR-CMD-003, C1]

- 入参：Task 3.3 完成（facts-schema.mjs 已追加 command 可选字段）
- 出参：`workflows/build-code/SKILL.md` 补充说明——在 build-code 产出的 `facts.tests` 中必须包含 `command` 字段，使 skill 行为与 schema 契约对齐，确保 verify-code 消费侧能读到该字段
- 改动范围：在 SKILL.md 的 facts.tests 产物描述段落（或类似"输出产物/stage-result 结构"段落）中，明确写出 `command` 字段及其含义（所执行的测试命令字符串）
- 约束：仅在 facts.tests 产物描述段新增说明，不删/改已有字段语义；不改其他 skill 逻辑
- 可证伪验证：
  ```bash
  grep -n "command" /Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/SKILL.md
  # 预期：至少有一行命中，内容包含 command 字段说明（若无匹配则本 task 未完成）
  ```
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/SKILL.md`

### Verify

```bash
# RED（facts-assembly 测试，预期 exit≠0）
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false

# GREEN（预期 exit=0）
node node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false

# C1 回归（build-code-facts 仍绿）
node node_modules/.bin/vitest run tests/build-code-facts.test.mjs --passWithNoTests=false
```

### Knowledge

- readCommand 接受已解析 JSON 对象（不读文件），使测试无文件系统依赖
- writeStageResult 写 `specs/{task-id}/stage-result-verify-code.json`，task-id 由调用方传入（不硬编码）
- C1 追加 command 字段必须不破坏 M8 已有测试（回归红 = 实现有问题，不改测试）
- validateMetricRecord 的 10 字段与 metrics/record-schema.mjs 定义一致，直接从 record-schema.mjs import 枚举值即可

### STOP

Phase 3 完成条件：`tests/verify-code-facts.test.mjs` exit=0；`tests/build-code-facts.test.mjs` exit=0（C1 回归不红）；command 缺失测试可证伪（删掉抛错逻辑后变红）。

---

## Phase 4：SKILL.md v1 升级 + isolated-browser-qa 抄入 + reuse-registry 登记（FR-BROWSER-001/002/003, FR-CLOSE-001/002/003, FR-METRICS-001/002/003, FR-REG-001）

**ui_change: false**

### Goal

将 `workflows/verify-code/SKILL.md` 从 64 行骨架升为 v1 完整提示词，写清五大能力段；抄入 isolated-browser-qa 并去除 agenthub 硬编码路径；更新 reuse-registry.md 登记来源。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/SKILL.md` — 修改，覆写骨架为 v1
- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/isolated-browser-qa.md` — 新建，改造版
- `/Users/Hugh/Hugh/Project/workflowhub/reuse-registry.md` — 修改，新增一条目

### Tasks

**Task 4.1 — 升级 SKILL.md v1** [FR-FRESH-001, FR-FRESH-003, FR-FRESH-004, FR-CMD-001, FR-CMD-002, FR-BROWSER-002, FR-BROWSER-003, FR-CLOSE-001, FR-CLOSE-002, FR-CLOSE-003, FR-METRICS-001, FR-METRICS-002, FR-METRICS-003]

- 入参：Phase 1~3 交付物（capture.mjs / freshness.mjs / facts-assembly.mjs 已存在）
- 出参：`workflows/verify-code/SKILL.md` v1，必须包含以下段落：
  1. **前置读取**：读 `specs/{task-id}/stage-result-build-code.json`，提取 facts.tests.command（command 缺失时浮现错误并终止）
  2. **metrics 开始**：stage 启动时调用 `metrics/collector.mjs` recordSkeleton，传入含全部 10 个核心字段的 seed
  3. **fresh 测试执行**：调用 `node workflows/verify-code/capture.mjs`，写 evidence 到 `specs/{task-id}/evidence/fresh-capture.json`
  4. **鲜度校验**：调用 freshness.mjs checkFreshness 比对 build-code git_sha vs HEAD；anomaly_flags 非空时在 skill 边界输出可见警告（FR-FRESH-004）
  5. **浏览器验收（SKIP 分支）**：判断 task 是否有 UI 验收项；无 UI 项则 SKIP，missing_items 记录"browser-acceptance: no UI acceptance items"，继续执行（FR-BROWSER-002/003）；有 UI 项则调用 isolated-browser-qa.md
  6. **明文停顿（收尾确认）**：列出不可逆动作清单（合并目标分支/删除 feature 分支），等待用户确认（FR-CLOSE-001/003）
  7. **收尾执行**：用户确认 → 执行合并/删分支，user_decision=true；用户拒绝 → user_decision=false，skill 终止记录原因（FR-CLOSE-002）
  8. **stage-result 落盘**：调用 facts-assembly.mjs assembleStageResult + writeStageResult，落 `specs/{task-id}/stage-result-verify-code.json`（FR-PATH-001）；final-test-report.md 落 `specs/{task-id}/test/`（FR-PATH-002）
  9. **metrics 结束**：调用 updateOwnResult，metrics 写失败只 warn 不 throw（FR-METRICS-002，F3）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/SKILL.md`

**Task 4.2 — 抄入 isolated-browser-qa 并改造** [FR-BROWSER-001, FR-REG-001]

- 入参：`~/.claude/skills/isolated-browser-qa/SKILL.md`（或同等来源文件）
- 出参：`workflows/verify-code/isolated-browser-qa.md`
- 改造约束：
  - 移除所有 agenthub 硬编码路径（如 `/Users/Hugh/Hugh/Project/multica-agenthub`，`packages/core/agenthub`，任何形式的 agenthub 绑定路径）
  - 保留 SKIP 分支逻辑（无 UI 验收项时 missing_items 记录，不阻断）
  - 所有路径引用改为相对调用仓根或由调用方传入
- 验证：`grep -i "agenthub\|multica-agenthub" workflows/verify-code/isolated-browser-qa.md` 输出为空
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/isolated-browser-qa.md`

**Task 4.3 — 更新 reuse-registry.md** [FR-REG-001]

- 入参：isolated-browser-qa 抄入完成
- 出参：`reuse-registry.md` 新增一行（格式与既有行一致）：
  - `isolated-browser-qa` | 改造适配 | `~/.claude/skills/isolated-browser-qa`
- 既有行不覆盖不删除
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/reuse-registry.md`

**Task 4.4 — 全量三脚本测试 + SKILL.md 检查** [FR-FRESH-001, FR-FRESH-003, FR-FRESH-004, FR-CMD-001, FR-CMD-002, FR-BROWSER-001, FR-BROWSER-002, FR-CLOSE-001, FR-METRICS-001, FR-METRICS-003, FR-REG-001]

- 入参：Phase 1~4 所有交付物
- 出参：三个 verify-code-*.test.mjs 全量 exit=0
- 验证命令：
  ```bash
  cd /Users/Hugh/Hugh/Project/workflowhub
  node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false
  ```
- SKILL.md 人工检查（9 段落关键词均存在）：
  ```bash
  grep -c "capture.mjs\|freshness\|anomaly_flags\|isolated-browser-qa\|missing_items\|明文停顿\|user_decision\|stage-result\|recordSkeleton" workflows/verify-code/SKILL.md
  # 预期 ≥9
  ```

### Verify

```bash
# 三脚本全量
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false

# isolated-browser-qa 无 agenthub 硬编码路径
grep -i "agenthub\|multica-agenthub" workflows/verify-code/isolated-browser-qa.md && echo "FAIL: hardcoded paths found" || echo "PASS: clean"

# SKILL.md 九段关键词
grep -c "capture.mjs\|freshness\|anomaly_flags\|isolated-browser-qa\|missing_items\|明文停顿\|user_decision\|stage-result\|recordSkeleton" workflows/verify-code/SKILL.md
```

### Knowledge

- SKILL.md 是提示词，不需要 vitest——可证伪性通过 SKILL.md 关键词 grep 和 isolated-browser-qa 路径 grep 验证
- isolated-browser-qa.md 是 SKILL.md 形式的提示词，不是可执行 .mjs——无需 import 测试
- reuse-registry 格式与 M8 既有行保持一致（三列：skill 名 / 复用类别 / 来源路径）

### STOP

Phase 4 完成条件：三个 verify-code-*.test.mjs exit=0；isolated-browser-qa.md 无 agenthub 硬编码路径；reuse-registry.md 新增行可见；SKILL.md 九段关键词 grep ≥9 命中。

---

## Phase 5：CI 冒烟配置 + 轻量三段闭环检查 + 全量回归（FR-TEST-003, FR-TEST-002, FR-REG-001）

**ui_change: false**

### Goal

在 CI 配置中新增两步：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查（结构性验证 make-decision → build-code → verify-code 产物链路贯通，不引入重型 E2E 框架，满足验收标准 5 同时遵守 D-M9-7/F10）。执行全量回归确认无新增失败；维护 plan.md 证据契约；明确 FR-TEST-002 验收出口。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/.github/workflows/ci.yml` — 修改，新增冒烟步骤 + 轻量三段闭环检查步骤
- `/Users/Hugh/Hugh/Project/workflowhub/scripts/ci-chain-check.mjs` — 新建，轻量三段闭环检查脚本

### Tasks

**Task 5.1 — CI 新增 verify-code 冒烟步骤 + 轻量三段闭环检查** [FR-TEST-003]

- 入参：Phase 1~4 交付物
- 出参 A：`.github/workflows/ci.yml` 新增冒烟 step，执行：
  ```
  node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false
  ```
- 出参 B：新建 `scripts/ci-chain-check.mjs`，实现轻量三段闭环结构检查，覆盖完整三段产物链：
  1. **make-decision 段**：检查 make-decision 产物存在且可读（`specs/{task-id}/stage-result-make-decision.json` 或同等 make-decision 输出产物路径），验证其为合法 JSON 对象；
  2. **build-code 段**：读取 `specs/{task-id}/stage-result-build-code.json`，验证 `facts.tests.command` 字段存在且类型为 string；验证该文件能正常解析（即 build-code 接上了 make-decision 的产物）；
  3. **verify-code 段**：验证 `specs/{task-id}/stage-result-verify-code.json` 路径结构符合 D-M9-6。
  不执行实际测试命令，不模拟完整 UI 流程。`.github/workflows/ci.yml` 新增 step 调用该脚本（传入 task-id 参数）。
- 约束：追加步骤，不删除/修改已有步骤；轻量检查不引入重型 E2E 框架（F10），只做产物路径/结构性验证；脚本不依赖网络或外部服务
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/.github/workflows/ci.yml`、`/Users/Hugh/Hugh/Project/workflowhub/scripts/ci-chain-check.mjs`

**Task 5.2 — 全量回归验证** [FR-FRESH-001, FR-FRESH-002, FR-FRESH-003, FR-FRESH-004, FR-CMD-001, FR-CMD-002, FR-CMD-003, FR-BROWSER-001, FR-BROWSER-002, FR-BROWSER-003, FR-CLOSE-001, FR-CLOSE-002, FR-CLOSE-003, FR-PATH-001, FR-PATH-002, FR-PATH-003, FR-METRICS-001, FR-METRICS-002, FR-METRICS-003, FR-METRICS-004, FR-TEST-001, FR-TEST-003, FR-REG-001]

- 入参：所有 Phase 1~5 交付物
- 出参：全量测试 exit=0，Test Files 行显示所有 verify-code-*.test.mjs 跑到，无新增失败
- 验证命令：
  ```bash
  cd /Users/Hugh/Hugh/Project/workflowhub
  node node_modules/.bin/vitest run --passWithNoTests=false
  ```
- 额外核实：`node --input-type=module --eval "import { readCommand } from './workflows/verify-code/facts-assembly.mjs'; console.log(typeof readCommand)"` 输出 `function`

**Task 5.3 — 维护知识文件** [FR-TEST-003]

- 入参：Phase 5 全量回归通过
- 出参：
  1. plan.md phase 4 evidence-contract 段填写真实 git_sha 和 timestamp（phase 4 = 全量三脚本）
  2. 检查 plan.md FR 覆盖矩阵 24 FR 全部有对应交付物
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md`

**Task 5.4 — FR-TEST-002 验收出口记录（非代码任务）** [FR-TEST-002]

- 入参：Phase 1~4 交付物 + Task 5.1~5.3 完成
- 说明：FR-TEST-002（M9 自举端到端实跑）按 D-M9-7/F10 不单列实现 task，不堆额外 E2E 框架；端到端三段闭环靠 M9 自举实跑验证。
- 出参：在 `specs/m9-verify-code/` 目录（或 plan.md 验收清单）明确记录 FR-TEST-002 的验收证据：
  1. M9 自举走完一次完整 verify-code 验收+收尾（make-decision → build-code → verify-code 三段全部真跑）即为 FR-TEST-002 证据；
  2. 证据落盘路径：`specs/m9-verify-code/stage-result-verify-code.json`（verify-code 自举产出的 stage-result 即为端到端实跑证据）；
  3. 本 task 不生成额外代码，只确认上述证据存在且可引用。
- 区分说明：本 task 是"按 F10 故意不建 E2E 框架"而非"漏验"——FR-TEST-002 由自举实跑满足，证据就是自举完成后落盘的 stage-result-verify-code.json。（来源：D-M9-7、F10、验收标准 1/2）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/stage-result-verify-code.json`（自举完成后存在）

### Verify

```bash
# CI 冒烟 step 存在性（冒烟 + 轻量三段闭环检查）
grep -c "verify-code\|ci-chain-check" /Users/Hugh/Hugh/Project/workflowhub/.github/workflows/ci.yml
# 预期 ≥2

# 全量回归
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run --passWithNoTests=false

# verify-code 脚本可 import
node --input-type=module --eval "import { readCommand } from './workflows/verify-code/facts-assembly.mjs'; console.log(typeof readCommand)"
node --input-type=module --eval "import { checkFreshness } from './workflows/verify-code/freshness.mjs'; console.log(typeof checkFreshness)"
node --input-type=module --eval "import { runCapture } from './workflows/verify-code/capture.mjs'; console.log(typeof runCapture)"

# 轻量三段闭环检查脚本可运行（结构检查，非完整链路）
# 用 node --input-type=module 验证脚本可解析，exit code 真实反映结果（不掩盖失败）
node --input-type=module --eval "import '/Users/Hugh/Hugh/Project/workflowhub/scripts/ci-chain-check.mjs'" 2>&1; echo "ci-chain-check import exit: $?"
```

### Knowledge

- CI 冒烟跑三个 verify-code-*.test.mjs；轻量三段闭环检查只做产物结构性验证（不跑完整链路，F10 不为机器可校验堆基建）
- FR-TEST-002 端到端验证靠 M9 自举实跑（D-M9-7），证据 = 自举产出的 stage-result-verify-code.json，不在 CI 里模拟三段闭环
- 全量回归必须实跑核 Test Files 行，不能仅凭 exit=0 判断（参 vitest-run-path-false-green-exit0 教训）
- Task 5.4 是非代码任务，完成条件 = 确认自举证据路径存在并记录，不生成额外代码

### STOP

Phase 5 完成条件：`.github/workflows/ci.yml` 含 verify-code 冒烟步骤 + 轻量三段闭环检查步骤；`scripts/ci-chain-check.mjs` 可运行；全量 vitest run exit=0，所有 verify-code-*.test.mjs 跑到；三脚本均可 import；FR-TEST-002 验收出口已记录（Task 5.4）。
