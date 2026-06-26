---
milestone: m8-build-code
stage: test-acceptance
status: completed
ui_change: false
total_phases: 5
total_tasks: 16
---

# Tasks — M8 build-code v1

> 所有 phase ui_change: false（M8 纯 skill 逻辑，无 UI 改动）
> 验收靶子函数：`core/text-utils.mjs` → `truncateWords(text, maxWords)`
> capture 脚本：`workflows/build-code/capture.mjs`（Node ESM .mjs）

---

## Phase 1：验收靶子函数（FR-ACPT-001）

**ui_change: false**

### Goal

在 workflowhub 新建一个与 build-code 完全无关的独立纯函数，作为 M8 自举验收的 TDD 靶子，消除循环验证风险（D-M8-3）。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/core/text-utils.mjs` — 新建，导出 truncateWords
- `/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-target.test.mjs` — 新建，靶子函数可证伪测试

### Tasks

**Task 1.1 — 写靶子测试（RED）** [FR-ACPT-001]

- 入参：无
- 出参：测试文件 `tests/build-code-target.test.mjs`，此时 `core/text-utils.mjs` 不存在
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-target.test.mjs`
- 测试内容：
  - `truncateWords("hello world foo", 2)` → `"hello world…"`
  - `truncateWords("short", 5)` → `"short"`（未超出不截）
  - `truncateWords("a b c d e", 0)` → `"…"`（maxWords=0 边界）
  - `truncateWords("", 3)` → `""`（空串）
  - 故意构造错误断言（RED 前先确认 import 失败 exit≠0）

**Task 1.2 — 实现靶子函数（GREEN）** [FR-ACPT-001]

- 入参：RED 证据（exit≠0）
- 出参：`core/text-utils.mjs` 导出 `export function truncateWords(text, maxWords)`
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/core/text-utils.mjs`
- 实现约束：纯函数，无 IO，无副作用，ESM export

**Task 1.3 — 维护知识文件** [FR-ACPT-001]

- 入参：Phase 1 完成状态
- 出参：在 plan.md evidence-contract P1 段填写真实 git_sha 和 timestamp
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m8-build-code/plan.md`

### Verify

```bash
# RED（预期 exit≠0）
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run tests/build-code-target.test.mjs --passWithNoTests=false
# 确认 exit code 非 0

# GREEN（预期 exit=0）
node node_modules/.bin/vitest run tests/build-code-target.test.mjs --passWithNoTests=false
# 确认 "Test Files  1 passed (1)"
```

### Knowledge

- truncateWords 是纯函数，测试必须覆盖边界（maxWords=0、空串、未超出）
- 测试文件故意改坏后需真实红（可证伪性校验）

### STOP

Phase 1 完成条件：`tests/build-code-target.test.mjs` exit=0，Test Files 行显示 1 passed。

---

## Phase 2：capture.mjs 物理事实采集脚本（FR-TDD-001~005）

**ui_change: false**

### Goal

新建 `workflows/build-code/capture.mjs`，实现外部进程级物理事实采集：运行测试命令、采集 exit 码、提取 Test Files 行、计算内容 hash，写入 durable evidence JSON。不靠 LLM 自报，不阻断推进。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/capture.mjs` — 新建
- `/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-capture.test.mjs` — 新建

### Tasks

**Task 2.1 — 写 capture 测试（RED）** [FR-TDD-001, FR-TDD-002, FR-TDD-005]

- 入参：无（capture.mjs 不存在）
- 出参：`tests/build-code-capture.test.mjs`，测试以下行为：
  1. `runCapture(command, outputPath)` — 执行命令，写 JSON 到 outputPath，返回 `{exit_code, test_files_line, content_hash, timestamp, command}`
  2. exit_code 字段为真实整数（非字符串）
  3. 失败命令（exit≠0）时 JSON 仍写出，不抛异常（F3 不阻断）
  4. content_hash 为 sha256 hex（可重复，同输出同 hash）
  5. test_files_line 从 stdout 提取 `Test Files` 开头行，无匹配时为 null
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-capture.test.mjs`

**Task 2.2 — 实现 capture.mjs** [FR-TDD-001, FR-TDD-002, FR-TDD-003, FR-TDD-004, FR-TDD-005, FR-PKG-002]

- 入参：RED 证据（exit≠0）
- 出参：`workflows/build-code/capture.mjs`
- 实现约束：
  - ESM `.mjs`，Node 22，`import { execSync } from 'node:child_process'`，`import { createHash } from 'node:crypto'`
  - 导出 `export async function runCapture(command, outputPath, { cwd, gitSha } = {})`
  - outputPath 目录不存在时自动 `mkdirSync` 创建
  - 写 JSON 格式对齐 C1 事实包：`{ command, cwd, git_sha, exit_code, timestamp, test_files_line, content_hash, stdout_path, stderr_path }`
  - stdout/stderr 同路径落 `.stdout`/`.stderr` 文件
  - 参考采集思路来自 agenthub capture-phase-evidence.sh，但不引用其路径，不依赖 bash lib
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/capture.mjs`

**Task 2.3 — 补假红假绿浮现测试 + anomaly_flags 枚举覆盖** [FR-TDD-003, FR-TDD-004]

- 入参：capture.mjs GREEN 后
- 出参：在 `tests/build-code-capture.test.mjs` 增加：
  - 同命令两次运行，content_hash 相同（幂等）
  - 输出内容变化时 hash 不同（可证伪）
  - **anomaly_flags 三枚举可证伪测试**（FR-TDD-003/004）：
    - 构造命令 exit≠0 但测试输出 hash 与 RED 基线相同 → `anomaly_flags` 数组含 `suspicious_red_exit`；删掉该字段时断言必须红
    - 构造命令 exit=0 但 content_hash 与 RED 基线相同（hash 未变） → `anomaly_flags` 含 `suspicious_green_exit`；删掉该字段时断言必须红
    - 构造命令输出不含 "Test Files" 行（test_files_line=null）且 exit=0 → `anomaly_flags` 含 `green_test_files_empty`；删掉该字段时断言必须红
  - stage 边界 warning 输出：当 anomaly_flags 非空时，capture 输出的 warning 字段（或 stdout）中必须含对应 flag 名称字样，断言 warning 存在（可证伪：清空 warning 输出时测试红）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-capture.test.mjs`

**Task 2.4 — 维护知识文件** [FR-TDD-005]

- 入参：Phase 2 完成状态
- 出参：在 plan.md evidence-contract P2 段填写真实 git_sha 和 timestamp
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m8-build-code/plan.md`

### Verify

```bash
# RED
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run tests/build-code-capture.test.mjs --passWithNoTests=false
# 预期 exit≠0

# GREEN
node node_modules/.bin/vitest run tests/build-code-capture.test.mjs --passWithNoTests=false
# 预期 "Test Files  1 passed (1)"，exit=0

# 直接调用验证
node workflows/build-code/capture.mjs 2>&1 | head -5
```

### Knowledge

- capture.mjs 必须是外部进程，不能用 vi.mock 替代真实 exec（否则 exit 码可证伪性消失）
- test_files_line 提取用 stdout.split('\n').find(l => l.includes('Test Files'))
- outputPath 要用绝对路径，capture.mjs 内部不假设 cwd

### STOP

Phase 2 完成条件：`tests/build-code-capture.test.mjs` exit=0，`workflows/build-code/capture.mjs` 可直接 import。

---

## Phase 3：diff-only 越界清单扫描（FR-DIFF-001~003）

**ui_change: false**

### Goal

实现 C2 越界清单的可测试扫描逻辑（纯函数，SKILL.md 消费），覆盖三类越界：不可逆 git 操作、外部依赖变更、生产配置。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/diff-scanner.mjs` — 新建，C2 扫描纯函数
- `/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-diff-only.test.mjs` — 新建

### Tasks

**Task 3.1 — 写越界扫描测试（RED）** [FR-DIFF-001, FR-DIFF-002, FR-DIFF-003]

- 入参：无（diff-scanner.mjs 不存在）
- 出参：`tests/build-code-diff-only.test.mjs`，测试以下：
  1. `scanDiff(diffText)` 返回 `{ violations: [], safe: true }` 当 diff 无越界
  2. diff 含 `git push` → `violations` 包含 `{ type: 'irreversible_git', pattern: 'git push' }`
  3. diff 含 `package.json` 路径变更 → `violations` 包含 `{ type: 'external_dep', pattern: 'package.json' }`
  4. diff 含 `.env.production` → `violations` 包含 `{ type: 'prod_config', pattern: '.env.production' }`
  5. diff 含 `pnpm-lock.yaml` → violations 包含 external_dep
  6. diff 含 `go.mod` → violations 包含 external_dep
  7. 普通 `.mjs` 文件变更 → violations 为空，safe=true（C2 清单外自由改，FR-DIFF-003）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-diff-only.test.mjs`

**Task 3.2 — 实现 diff-scanner.mjs** [FR-DIFF-001, FR-DIFF-002, FR-DIFF-003]

- 入参：RED 证据
- 出参：`workflows/build-code/diff-scanner.mjs`
- 实现约束：
  - ESM `.mjs`，纯函数，无 IO，无副作用
  - 导出 `export function scanDiff(diffText)`
  - C2 清单内置（不可逆 git / 外部依赖 / 生产配置），按 spec §6 C2 枚举
  - 返回 `{ violations: Array<{type, pattern, line}>, safe: boolean }`
  - YAGNI：只扫描，不执行停等（停等由 SKILL.md 提示词描述）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/diff-scanner.mjs`

**Task 3.3 — 维护知识文件** [FR-DIFF-001]

- 入参：Phase 3 完成状态
- 出参：在 plan.md evidence-contract P3 段填写真实 git_sha 和 timestamp
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m8-build-code/plan.md`

### Verify

```bash
# RED
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run tests/build-code-diff-only.test.mjs --passWithNoTests=false
# 预期 exit≠0

# GREEN
node node_modules/.bin/vitest run tests/build-code-diff-only.test.mjs --passWithNoTests=false
# 预期 exit=0

# 可证伪性：故意改坏一条断言，确认 exit≠0
```

### Knowledge

- scanDiff 只是纯函数，停等确认逻辑在 SKILL.md 提示词里描述（F8 简单优先）
- C2 清单来自 spec §6 和 decision-log C2，精确对应，不扩展

### STOP

Phase 3 完成条件：`tests/build-code-diff-only.test.mjs` exit=0，所有 C2 类别均有测试覆盖。

---

## Phase 4：facts 结构三键 + review 两态（FR-PKG-001~003, FR-REVIEW-001~005）

**ui_change: false**

### Goal

实现 C1 最小字段契约校验函数（验证 stage-result facts 结构完整性）和 review 两态/降级场景的可测试逻辑，覆盖 FR-REVIEW-001~005 全部需求。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/facts-schema.mjs` — 新建，C1 契约校验
- `/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-facts.test.mjs` — 新建
- `/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-review.test.mjs` — 新建

### Tasks

**Task 4.1 — 写 facts 契约测试（RED）** [FR-PKG-001, FR-PKG-003]

- 入参：无（facts-schema.mjs 不存在）
- 出参：`tests/build-code-facts.test.mjs`，测试：
  1. `validateFacts(facts)` 对合法 C1 结构返回 `{ valid: true, missing: [] }`
  2. 缺 `facts.changed` → `{ valid: false, missing: ['changed'] }`
  3. 缺 `facts.tests` → `{ valid: false, missing: ['tests'] }`
  4. 缺 `facts.review` → `{ valid: false, missing: ['review'] }`
  5. `facts.review` 存在但缺 `status` 字段 → `{ valid: false, missing: ['review.status'] }`
  6. 完整三键结构 → valid: true（M9 可直接读）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-facts.test.mjs`

**Task 4.2 — 写 review 两态测试（RED）** [FR-REVIEW-001, FR-REVIEW-002, FR-REVIEW-003, FR-REVIEW-004, FR-REVIEW-005]

- 入参：无
- 出参：`tests/build-code-review.test.mjs`，测试：
  1. `buildReviewFact({ status: 'executed', source: 'third_party', verdict: 'pass', artifactPath: 'x.md' })` → 返回合法 facts.review 对象
  2. `buildReviewFact({ status: 'not_executed' })` → status=not_executed，source/verdict 可省略
  3. `buildReviewFact({ status: 'executed', source: 'same_source', verdict: 'revise_required', artifactPath: 'y.md' })` → source=same_source（降级标记，D8 合法）
  4. status=not_executed 时 artifact_path 字段可空（FR-REVIEW-004）
  5. 非法 status 值 → 抛错（可证伪）
  6. verdict 非三态之一 → 抛错（可证伪）
  7. **not_executed warning 浮现测试**（FR-REVIEW-004）：构造 `buildReviewFact({ status: 'not_executed' })` 后调用 stage 边界浮现函数（或 `getWarnings(reviewFact)`），断言返回的 warning 列表含类型为 warning、内容包含"审查未执行"字样的条目；字段 status=not_executed 存在但 warning 输出为空时断言必须红（可证伪：注释掉 warning 生成代码后测试变红）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/build-code-review.test.mjs`

**Task 4.3 — 实现 facts-schema.mjs** [FR-PKG-001, FR-PKG-002, FR-PKG-003, FR-REVIEW-002, FR-REVIEW-003]

- 入参：两个 RED 证据
- 出参：`workflows/build-code/facts-schema.mjs`
- 实现约束：
  - ESM `.mjs`，纯函数，无 IO
  - 导出 `export function validateFacts(facts)` — C1 最小字段校验
  - 导出 `export function buildReviewFact({ status, source, verdict, artifactPath })` — 构造合法 facts.review 对象，含枚举校验
  - status 枚举：`executed | not_executed`
  - source 枚举：`third_party | same_source`（status=not_executed 时可省略）
  - verdict 枚举：`pass | revise_required | escalate_to_human`（status=not_executed 时可省略）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/facts-schema.mjs`

**Task 4.4 — 维护知识文件** [FR-PKG-001, FR-REVIEW-001]

- 入参：Phase 4 完成状态
- 出参：在 plan.md evidence-contract P4 段填写真实 git_sha 和 timestamp
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m8-build-code/plan.md`

### Verify

```bash
# RED（两个测试文件）
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run tests/build-code-facts.test.mjs tests/build-code-review.test.mjs --passWithNoTests=false
# 预期 exit≠0

# GREEN
node node_modules/.bin/vitest run tests/build-code-facts.test.mjs tests/build-code-review.test.mjs --passWithNoTests=false
# 预期 exit=0，Test Files 2 passed
```

### Knowledge

- `buildReviewFact` 对非法枚举值必须抛错（F9 可证伪），不静默忽略
- same_source 降级（D8）：status 仍为 executed，source=same_source，不记 not_executed
- facts.review 独立键，不混入 facts.tests（C1 契约边界）

### STOP

Phase 4 完成条件：两测试文件均 exit=0，覆盖 review 两态 + 降级 + 非法枚举可证伪。

---

## Phase 5：SKILL.md v1 升级 + reuse-registry 登记（FR-SUB-001~002, FR-REG-001~002, FR-REVIEW-001~005）

**ui_change: false**

### Goal

将 `workflows/build-code/SKILL.md` 从骨架升为 v1 完整提示词，写清 TDD 外部强制流程、diff-only 越界处理、3rd-review standalone 调用、facts.review 产出格式、Worker-Mode 子代理派发约束。同步更新 reuse-registry.md 登记三个外部依赖。

### Files

- `/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/SKILL.md` — 修改，覆写骨架为 v1
- `/Users/Hugh/Hugh/Project/workflowhub/reuse-registry.md` — 修改，新增三行
- `/Users/Hugh/Hugh/Project/workflowhub/tests/reuse-registry.test.mjs` — 已有，确认新增行通过

### Tasks

**Task 5.1 — 升级 SKILL.md v1** [FR-TDD-001~005, FR-DIFF-001~003, FR-REVIEW-001~005, FR-SUB-001~002, FR-PKG-001~003, FR-WT-001]

- 入参：Phase 1~4 交付物（capture.mjs / diff-scanner.mjs / facts-schema.mjs 已存在）
- 出参：`workflows/build-code/SKILL.md` v1，必须包含以下段落：
  1. **前置读取**：读上游 stage-result，提取 facts.plan_ref / facts.tasks（full path）或 facts.decision / facts.scope（slim path）
  2. **TDD 外部强制**：每 phase 写测试→运行 `node workflows/build-code/capture.mjs` 采集 RED→实现→再采集 GREEN，evidence 写 `specs/{task-id}/evidence/phase-N-{RED|GREEN}.json`
  3. **假绿检测**：比对 RED vs GREEN 的 content_hash，如 hash 相同则浮现警告（不 blocking）
  4. **diff-only 越界检测**：每次 git diff 后检查 C2 清单（调 diff-scanner.mjs），有 violations 时停等确认，显示越界类型，不自动执行
  5. **worktree 路径可配置**：接受调用者传入的 worktree_root 配置，不硬编码路径
  6. **Worker-Mode 子代理**：用 Worker-Mode 调起 implementer worker，传入绝对路径，明令禁止 commit（FR-SUB-002）
  7. **3rd-review standalone**：完成 GREEN 后调用 3rd-review standalone 入口，喂真实 git diff（非自然语言），消费 verdict 三态（pass / revise_required / escalate_to_human）；不可用时降级 same_source 并记入 facts.review.source
  8. **facts.review 产出**：调用 facts-schema.mjs buildReviewFact 构造，写入 stage-result facts.review 键
  9. **事实包产出**：stage-result 写 facts.changed（数组）/ facts.tests（结构体）/ facts.review（结构体），落 durable task 路径
  10. **metrics 记录**：recordSkeleton 在 stage 开始，updateOwnResult 在结束，字段对齐 M4 record-schema
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/SKILL.md`

**Task 5.2 — 更新 reuse-registry.md** [FR-REG-001, FR-REG-002]

- 入参：SKILL.md v1 完成
- 出参：`reuse-registry.md` 新增三行（格式与 M7 既有行一致，三列：skill 名 / 复用类别 / 来源路径）：
  - `Worker-Mode` | 外部依赖 semver | `~/.claude/plugins/worker-mode/`（或实际路径）
  - `3rd-review` | 外部依赖 standalone | `~/.claude/commands/3rd-review`（或实际路径）
  - `TDD 件（capture.mjs）` | 改造适配 | `tdd-red-green skill`（来源：FR-REG-002，workflowhub 宪法重建接线）
- 既有行不覆盖不删除（spec 11章回归要点）
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/reuse-registry.md`

**Task 5.3 — 验证 reuse-registry 测试通过** [FR-REG-001, FR-REG-002]

- 入参：reuse-registry.md 更新后
- 出参：`tests/reuse-registry.test.mjs` exit=0，新增三行可被测试识别
- 验证命令：`node node_modules/.bin/vitest run tests/reuse-registry.test.mjs --passWithNoTests=false`
- 若测试不覆盖新增行，在此 task 补测试断言（不另起文件）

**Task 5.4 — 全量回归验证** [所有 FR]

- 入参：所有 Phase 1~5 交付物
- 出参：全量测试 exit=0，Test Files 行显示全部 build-code-*.test.mjs 跑到
- 验证命令：
  ```bash
  cd /Users/Hugh/Hugh/Project/workflowhub
  node node_modules/.bin/vitest run tests/build-code-target.test.mjs tests/build-code-capture.test.mjs tests/build-code-diff-only.test.mjs tests/build-code-facts.test.mjs tests/build-code-review.test.mjs --passWithNoTests=false
  ```
- 额外核实：`node --input-type=module --eval "import { truncateWords } from './core/text-utils.mjs'; console.log(truncateWords('a b c', 2))"` 输出 `a b…`

**Task 5.5 — 维护知识文件** [FR-REG-001]

- 入参：Phase 5 全量验证通过
- 出参：
  1. plan.md evidence-contract P5 段填写真实 git_sha 和 timestamp
  2. 检查 plan.md FR 覆盖矩阵 22 FR 全部有对应交付物
- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m8-build-code/plan.md`

### Verify

```bash
# reuse-registry 专项
cd /Users/Hugh/Hugh/Project/workflowhub
node node_modules/.bin/vitest run tests/reuse-registry.test.mjs --passWithNoTests=false

# SKILL.md 人工检查（10 段落均存在）
grep -c "TDD\|diff-only\|3rd-review\|facts.review\|Worker-Mode\|worktree_root\|capture.mjs\|buildReviewFact\|recordSkeleton\|updateOwnResult" workflows/build-code/SKILL.md
# 预期 ≥10

# 全量 build-code 测试
node node_modules/.bin/vitest run tests/build-code-target.test.mjs tests/build-code-capture.test.mjs tests/build-code-diff-only.test.mjs tests/build-code-facts.test.mjs tests/build-code-review.test.mjs --passWithNoTests=false
```

### Knowledge

- SKILL.md 是提示词，不是代码——可证伪测试通过 reuse-registry.test.mjs 和 SKILL.md 内容检查，不需要为 SKILL.md 单独建 vitest
- 3rd-review standalone 参数契约在 apply 阶段核实（spec F3 开放问题），plan 只描述调用流程
- Worker-Mode 具体调用参数在 apply 阶段按实际 semver 接口落实

### STOP

Phase 5 完成条件：全量 build-code-*.test.mjs exit=0，reuse-registry.md 三行新增通过测试，SKILL.md 10 段关键词 grep ≥10 命中。
