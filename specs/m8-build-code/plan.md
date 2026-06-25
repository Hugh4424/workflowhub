---
milestone: m8-build-code
stage: plan
status: draft
upstream: spec.md + decision-log.md (approved 2026-06-25)
---

# Plan — M8 build-code v1

## Technical Context

**交付仓**：`/Users/Hugh/Hugh/Project/workflowhub`
**执行环境**：agenthub vibecoding harness（自举），Node 22 / ESM，vitest 2.1.9
**上游依赖**：M7 已交付（make-decision / build-plan / metrics/collector.mjs 可用）
**外部依赖**：
- Worker-Mode 插件（semver 外部依赖，调起 implementer/qa worker）
- 3rd-review standalone（`~/.claude/commands/3rd-review` 或 standalone.sh，脱平台入口）
- agenthub capture-phase-evidence.sh — 仅作参考，M8 改造重写为 workflowhub 自己的脚本

**现有骨架**：`workflows/build-code/SKILL.md`（73 行）定义了 RED→implement→GREEN 循环和 facts.changed/tests 键，是升级起点。

**验收靶子函数**（FR-ACPT-001，D-M8-3）：
在 workflowhub 新建 `core/text-utils.mjs`，导出一个纯函数 `truncateWords(text, maxWords)`——将字符串截断到最多 maxWords 个单词，超出部分替换为 `…`。该函数与 build-code 无关，是独立靶子，消除循环验证风险。

---

## Constitution Check（对照 21 条逐条）

| 条款 | 结论 | 说明 |
|------|------|------|
| F1 薄核心 | YES | build-code 本体只做调度，重活交给 Worker-Mode/3rd-review |
| F2 窄契约 | YES | stage-result C1 最小字段契约，三键固定 |
| F3 物理事实机器采集不阻断 | YES | capture 脚本采集 exit 码/Test Files 行/hash，写入事实，不 blocking |
| F4 质量靠异源审查与人 | YES | 3rd-review standalone 异源，verdict 三态由人决定 |
| F5 gate 谨慎添加 | YES | CI 只做轻量结构检查，不堆 schema gate |
| F6 统一外置执行记录 | YES | metrics/collector.mjs 已有，stage-result 写入 durable |
| F7 推进与不可逆操作不自动越过人 | YES | C2 越界清单检测到即停等，不自动执行 |
| F8 简单优先 | YES | capture 脚本最小实现，不复制 agenthub 6000 行 gate |
| F9 可证伪、不假绿 | YES | 测试验证 exit≠0 为 RED，构造场景测 not_executed |
| F10 不为机器可校验堆基建 | YES | CI 只检查文件在不在/格式，不为全链路加执行入口 |
| Q1 记事实而非阻断 | YES | 假绿浮现、越界浮现，均不 block 推进 |
| Q2 gate 三类划分 | YES | 入口校验（文件存在）vs 采集（exit 码）vs 人工确认（越界） |
| Q3 异源审查加人工把关 | YES | 3rd-review standalone，禁止同源自审 |
| S1 能用外部就不造轮子 | YES | Worker-Mode/3rd-review 外部依赖，登记 reuse-registry |
| S2 外部技能可改造合宪 | YES | capture 脚本参考 agenthub 但改造重写，符合 workflowhub 质量模型 |
| S3 迭代保持最新 | YES | reuse-registry 记来源路径，便于检查更新 |
| S4 自定义技能有指标系统 | YES | metrics/collector.mjs recordSkeleton/updateOwnResult |
| S5 方便子代理调用 | YES | Worker-Mode 调起 implementer/qa，主会话只收摘要 |
| S6 参考市面方案不闭门造车 | YES | 参考 agenthub capture 采集思路后改造 |
| S7 一阶段一技能一文件夹 | YES | workflows/build-code/ 独立文件夹 |
| S8 可独立调用可搬运 | YES | SKILL.md 不绑死宿主，capture 脚本相对路径 |

---

## 最简方案判断（YAGNI 阶梯）

**需要存在吗？**

- capture 脚本：YES — FR-TDD-001/002 要求外部物理事实采集，纯提示词做不到（exit 码/hash 是物理信号，LLM 无法自报）
- SKILL.md 升级：YES — 骨架无 TDD 外部强制/diff-only/3rd-review/facts.review 四大能力
- vitest 测试：YES — spec §5 五条验收标准需可证伪测试覆盖
- 验收靶子函数：YES — FR-ACPT-001，消除循环验证
- reuse-registry 更新：YES — FR-REG-001/002，三个外部依赖必须登记

**已有吗？**

- stage-result 契约：已有 facts.changed/tests 键，只需扩展 facts.review 键（加不删）
- metrics/collector.mjs：已有，直接用
- vitest 框架：已有（2.1.9，ESM .mjs）
- 3rd-review：外部已有 standalone 入口，不内嵌

**更简单吗？**

- capture 脚本选 `.mjs`（Node ESM，与 workflowhub 统一栈）而非 `.sh`（减少 bash 依赖、便于测试）
- SKILL.md 升级方式：直接覆写骨架，不新建平行文件（骨架已标 v1.0.0，语义是"升为 v1"）
- diff-only 扫描：SKILL.md 提示词描述 + capture 脚本记录浮现，不造独立扫描引擎

**不可简化红线**：

- capture 脚本必须是外部进程，不能在 SKILL.md 提示词里让 LLM 自报 exit 码（可证伪性红线）
- facts.review 必须独立键，不混入 facts.tests（C1 契约，M9 消费边界）
- 3rd-review 必须喂真实 diff（非自然语言），否则分类器降级为同源审查（D-M8-4）

**非显然取舍**：

- capture 脚本选 `.mjs` 而非 `.sh`：workflowhub 已全栈 ESM/Node，`.mjs` 可直接 import 被测，`.sh` 需要 bash 环境。代价是 Node 22 必须可用（已在 CI 环境中）。
- 验收靶子选 `truncateWords`：纯函数，无 IO，测试简单可证伪，与 build-code 零耦合。代价几乎没有。

---

## 项目文件结构

```
workflowhub/
├── workflows/
│   └── build-code/
│       ├── SKILL.md                  # 【修改】从骨架升 v1：TDD红绿外部强制+capture调用+diff-only+3rd-review+facts.review
│       ├── capture.mjs               # 【新建】物理事实采集脚本（exit码/Test Files行/内容hash，写 durable）
│       ├── diff-scanner.mjs          # 【新建】C2 越界清单扫描纯函数
│       └── facts-schema.mjs          # 【新建】C1 facts 三键契约校验 + buildReviewFact
├── core/
│   └── text-utils.mjs                # 【新建】验收靶子函数 truncateWords(text, maxWords)
├── tests/
│   ├── build-code-capture.test.mjs   # 【新建】capture 脚本单元测试
│   ├── build-code-diff-only.test.mjs # 【新建】C2越界清单扫描逻辑测试
│   ├── build-code-facts.test.mjs     # 【新建】facts结构三键契约测试（FR-ACPT-001验收链）
│   ├── build-code-review.test.mjs    # 【新建】review两态/降级场景测试
│   └── build-code-target.test.mjs    # 【新建】靶子函数 truncateWords 可证伪测试
└── reuse-registry.md                  # 【修改】新增 Worker-Mode/3rd-review/TDD件三条目
```

**spec 第11章业务影响8项受影响功能覆盖**：

| 受影响功能 | 文件 | 变更类型 |
|-----------|------|---------|
| TDD 红绿外部强制 | SKILL.md + capture.mjs | 新增 |
| diff-only 越界检测 | SKILL.md + diff-scanner.mjs + build-code-diff-only.test.mjs | 新增 |
| 审查记录持久化 | SKILL.md + build-code-review.test.mjs | 新增 |
| 验收事实包（C1 facts.review） | SKILL.md + facts-schema.mjs + build-code-facts.test.mjs | 新增/扩展 |
| Worker-Mode 子代理派发 | SKILL.md + reuse-registry.md | 新增 |
| 3rd-review standalone 集成 | SKILL.md + reuse-registry.md | 新增 |
| reuse-registry 登记 | reuse-registry.md | 修改 |
| stage-result 契约（M9 边界） | SKILL.md（facts 结构向后兼容扩展） | 扩展 |

---

## 证据契约预声明

```evidence-contract
{
  "red": {
    "command": "node_modules/.bin/vitest run tests/build-code-target.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "dfa35c3ecfcfe6a3be1a01afd290be5cc8ba1ed0",
    "exit_code": 1,
    "timestamp": "2026-06-25T12:12:03Z",
    "phase": 1,
    "mode": "RED"
  },
  "green": {
    "command": "node_modules/.bin/vitest run tests/build-code-target.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "dfa35c3ecfcfe6a3be1a01afd290be5cc8ba1ed0",
    "exit_code": 0,
    "timestamp": "2026-06-25T12:12:41Z",
    "phase": 1,
    "mode": "GREEN"
  },
  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m8-build-code/evidence/",
  "affectedTests": ["tests/build-code-target.test.mjs"]
}
```

```evidence-contract
{
  "red": {
    "command": "node_modules/.bin/vitest run tests/build-code-capture.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "2d5ab2da4cbd762df8c37070eb94940061610331",
    "exit_code": 1,
    "timestamp": "2026-06-25T12:45:27Z",
    "phase": 2,
    "mode": "RED"
  },
  "green": {
    "command": "node_modules/.bin/vitest run tests/build-code-capture.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "2d5ab2da4cbd762df8c37070eb94940061610331",
    "exit_code": 0,
    "timestamp": "2026-06-25T12:46:48Z",
    "phase": 2,
    "mode": "GREEN"
  },
  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m8-build-code/evidence/",
  "affectedTests": ["tests/build-code-capture.test.mjs"]
}
```

```evidence-contract
{
  "red": {
    "command": "node_modules/.bin/vitest run tests/build-code-diff-only.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "8d219b9b32c5147bf1dda710fa78db297347f7c0",
    "exit_code": 1,
    "timestamp": "2026-06-25T15:19:05Z",
    "phase": 3,
    "mode": "RED"
  },
  "green": {
    "command": "node_modules/.bin/vitest run tests/build-code-diff-only.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "8d219b9b32c5147bf1dda710fa78db297347f7c0",
    "exit_code": 0,
    "timestamp": "2026-06-25T15:19:50Z",
    "phase": 3,
    "mode": "GREEN"
  },
  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m8-build-code/evidence/",
  "affectedTests": ["tests/build-code-diff-only.test.mjs"]
}
```

```evidence-contract
{
  "red": {
    "command": "node_modules/.bin/vitest run tests/build-code-facts.test.mjs tests/build-code-review.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "679146c031d9bc66c9c68360cedf6fa4958b1e41",
    "exit_code": 1,
    "timestamp": "2026-06-25T16:52:24Z",
    "phase": 4,
    "mode": "RED"
  },
  "green": {
    "command": "node_modules/.bin/vitest run tests/build-code-facts.test.mjs tests/build-code-review.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "679146c031d9bc66c9c68360cedf6fa4958b1e41",
    "exit_code": 0,
    "timestamp": "2026-06-25T16:53:29Z",
    "phase": 4,
    "mode": "GREEN"
  },
  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m8-build-code/evidence/",
  "affectedTests": ["tests/build-code-facts.test.mjs", "tests/build-code-review.test.mjs"]
}
```

```evidence-contract
{
  "red": {
    "command": "node_modules/.bin/vitest run tests/reuse-registry.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "12a981079d9114bd3a29d2077e27a82ebe48d531",
    "exit_code": 1,
    "timestamp": "2026-06-25T17:50:00Z",
    "phase": 5,
    "mode": "RED"
  },
  "green": {
    "command": "node_modules/.bin/vitest run tests/reuse-registry.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "12a981079d9114bd3a29d2077e27a82ebe48d531",
    "exit_code": 0,
    "timestamp": "2026-06-25T17:50:30Z",
    "phase": 5,
    "mode": "GREEN"
  },
  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m8-build-code/evidence/",
  "affectedTests": ["tests/reuse-registry.test.mjs"]
}
```

---

## 验证策略

### 交付验证

| 类别 | 命令 | 通过判据 |
|------|------|---------|
| 全量测试 | `node_modules/.bin/vitest run --passWithNoTests=false` | exit 0，Test Files 行显示所有文件跑到 |
| build-code 专项 | `node_modules/.bin/vitest run tests/build-code-*.test.mjs --passWithNoTests=false` | exit 0 |
| capture 脚本直跑 | `node workflows/build-code/capture.mjs --help` | exit 0，输出用法 |
| reuse-registry 覆盖 | `node_modules/.bin/vitest run tests/reuse-registry.test.mjs` | Worker-Mode/3rd-review/TDD件三行均存在 |

### 异常验证

| 场景 | 验证方式 |
|------|---------|
| capture 脚本遇 exit≠0 | 构造失败命令，验证输出 exit_code≠0 且不假绿 |
| review.status=not_executed | 构造 3rd-review 不可用场景，测试 facts.review.status 字段值 |
| C2 越界触发 | 构造含 `push`/`package.json` 操作的 diff，测试拦截信号 |

### 测试验证

| 测试文件 | 运行命令 |
|---------|---------|
| build-code-target.test.mjs | `vitest run tests/build-code-target.test.mjs` |
| build-code-capture.test.mjs | `vitest run tests/build-code-capture.test.mjs` |
| build-code-diff-only.test.mjs | `vitest run tests/build-code-diff-only.test.mjs` |
| build-code-facts.test.mjs | `vitest run tests/build-code-facts.test.mjs` |
| build-code-review.test.mjs | `vitest run tests/build-code-review.test.mjs` |

### 代码验证

- `workflows/build-code/SKILL.md`：人工检查四大能力段（TDD/diff-only/3rd-review/facts.review）均存在
- `workflows/build-code/capture.mjs`：`node --input-type=module --eval "import './workflows/build-code/capture.mjs'"` 无报错
- `core/text-utils.mjs`：导出 truncateWords，可 import

---

## Data Model（facts 结构变更）

**现有**（骨架 v0）：
```json
{
  "changed": "<comma-separated files>",
  "tests": "<N/N passing>"
}
```

**M8 v1 扩展**（C1 最小字段契约，加不删）：
```json
{
  "changed": ["path/to/file.mjs"],
  "tests": {
    "red_exit_code": 1,
    "green_exit_code": 0,
    "green_baseline_hash": "<sha256>",
    "test_files_line": "Test Files  3 passed (3)"
  },
  "review": {
    "status": "executed | not_executed",
    "source": "third_party | same_source",
    "verdict": "pass | revise_required | escalate_to_human",
    "artifact_path": "specs/m8-build-code/review-report.md"
  }
}
```

**向后兼容**：已有消费方读 `facts.changed`/`facts.tests` 不受 `facts.review` 新增影响。`tests` 结构体是 M8→M9 的 C1 新契约，M9 按 C1 契约直接实现读取，无需 schema 转换或字段重映射（符合 FR-PKG-003：M9 侧不做格式适配）。骨架 v0 的旧字符串 `facts.tests` 在 workflowhub 无其他消费方，不保留旧字符串格式。

---

## 与现有功能集成

**build-code 从骨架升 v1**（spec 第11章逐项对照）：

1. **TDD 红绿外部强制**（FR-TDD-001/002）：SKILL.md 调用 `capture.mjs` 外部脚本，不靠 LLM 自报。`capture.mjs` 写入 `specs/{task}/evidence/phase-N-RED.json` / `phase-N-GREEN.json`。
2. **假红假绿浮现**（FR-TDD-003/004）：capture.mjs 采集 exit 码 + Test Files 行 + 内容 hash，SKILL.md 对比基线，差异浮现，不阻断推进（Q1/F3）。
3. **证据 durable**（FR-TDD-005）：evidence JSON 写入 task durable 路径，不随会话丢失。
4. **diff-only 越界检测**（FR-DIFF-001/002）：SKILL.md 提示词描述 C2 清单，capture.mjs 辅助记录 diff 内容，越界停等确认（F7）。
5. **事实包三键**（FR-PKG-001/002/003）：stage-result 写 `facts.changed`/`facts.tests`/`facts.review` 三键，落 durable。
6. **3rd-review standalone**（FR-REVIEW-001/002/003/004/005）：SKILL.md 描述 standalone 调用流程，消费 verdict 三态，facts.review 记两态 + source 标记。
7. **Worker-Mode 调起**（FR-SUB-001/002）：SKILL.md 描述用 Worker-Mode 调起 implementer，绝对路径禁 commit。
8. **reuse-registry 登记**（FR-REG-001/002）：三条目新增，格式与 M7 一致。

---

## 治理文件同步矩阵

> 按 plan-reviewer-contract 7 类逐类标 改/不改 + 原因。标"改"项必须有对应 Task ID。

| 类别 | 改/不改 | 原因 | Task |
|------|---------|------|------|
| 项目规则（CLAUDE.md / AGENTS.md / 子包 CLAUDE.md） | 不改 | M8 仅在 workflowhub repo 新增 skill 文件，不触碰项目级规则文件 | — |
| workflow 定义（stage prompts / *.workflow.ts） | 改 | `workflows/build-code/SKILL.md` 从骨架升 v1（即 workflow 本体升级） | Task 5.1 |
| reviewer contract（base-verifier / reviewer prompt / 审查合同） | 不改 | M8 消费已有 3rd-review standalone 入口，不修改其内部审查合同 | — |
| schema（journal event / checkpoint / *.schema.json） | 不改 | facts 结构扩展通过 facts-schema.mjs 运行时校验，不触碰 stage-result schema 文件本身（仅 additive 字段扩展） | — |
| runtime config（.claude/settings.json / 引擎配置） | 不改 | M8 不修改 agenthub harness 配置，worktree 路径通过调用参数传入而非配置文件 | — |
| knowledge/doc（docs/WORKFLOW.md / constitution.md / Knowledge 规则） | 不改 | M8 不引入新宪法条款，现有 D5/D7/D8/D15/D16/D21 已覆盖 build-code 决策 | — |
| automation gates / CI / hooks（.github/workflows / pre-commit / gate scripts） | 改 | `reuse-registry.md` 新增三行，现有 reuse-registry 测试（tests/reuse-registry.test.mjs）需通过新增行验证 | Task 5.2 / Task 5.3 |

---

## 文件影响范围覆盖

| 文件 | 变更 | FR 映射 |
|------|------|---------|
| `workflows/build-code/SKILL.md` | 从骨架升 v1（覆写） | FR-TDD-001~005, FR-DIFF-001~003, FR-REVIEW-001~005, FR-SUB-001~002, FR-PKG-001~003 |
| `workflows/build-code/capture.mjs` | 新建 | FR-TDD-001~005, FR-PKG-002 |
| `core/text-utils.mjs` | 新建 | FR-ACPT-001 |
| `tests/build-code-target.test.mjs` | 新建 | FR-ACPT-001 |
| `tests/build-code-capture.test.mjs` | 新建 | FR-TDD-001~005 |
| `tests/build-code-diff-only.test.mjs` | 新建 | FR-DIFF-001~003 |
| `tests/build-code-facts.test.mjs` | 新建 | FR-PKG-001~003, FR-WT-001 |
| `tests/build-code-review.test.mjs` | 新建 | FR-REVIEW-001~005 |
| `reuse-registry.md` | 新增三行 | FR-REG-001~002 |

---

## FR 覆盖矩阵（22 FR 全映射）

| FR | 映射到 |
|----|--------|
| FR-TDD-001 | SKILL.md § TDD + capture.mjs |
| FR-TDD-002 | capture.mjs exit_code 采集 |
| FR-TDD-003 | capture.mjs Test Files 行 + hash 对比 + 浮现逻辑 |
| FR-TDD-004 | capture.mjs baseline 对比，差异浮现不阻断 |
| FR-TDD-005 | evidence 写 durable task 路径 |
| FR-DIFF-001 | SKILL.md C2 清单描述 + capture.mjs diff 记录 |
| FR-DIFF-002 | SKILL.md 越界停等确认流程 |
| FR-DIFF-003 | SKILL.md C2 清单外自由操作说明 |
| FR-PKG-001 | stage-result facts 三键 |
| FR-PKG-002 | capture.mjs 写 durable |
| FR-PKG-003 | facts 结构 M9 可直接读 |
| FR-REVIEW-001 | SKILL.md 3rd-review standalone 调用流程 |
| FR-REVIEW-002 | facts.review.status 两态 |
| FR-REVIEW-003 | facts.review.source 标记 |
| FR-REVIEW-004 | not_executed 浮现提示 |
| FR-REVIEW-005 | 审查报告 artifact_path durable |
| FR-SUB-001 | SKILL.md Worker-Mode 调起描述 |
| FR-SUB-002 | SKILL.md 绝对路径/禁 commit 约束 |
| FR-REG-001 | reuse-registry.md 三条目登记 |
| FR-REG-002 | reuse-registry.md TDD 件来源路径 |
| FR-WT-001 | SKILL.md worktree 路径可配置说明 |
| FR-ACPT-001 | core/text-utils.mjs truncateWords + build-code-target.test.mjs |
