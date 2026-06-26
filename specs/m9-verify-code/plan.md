---
milestone: m9-verify-code
stage: plan
status: draft
upstream: spec.md + decision-log.md (approved 2026-06-26)
---

# Plan — M9 verify-code v1

## Technical Context

**交付仓**：`/Users/Hugh/Hugh/Project/workflowhub`
**执行环境**：multica-agenthub vibecoding harness（自举），Node 22 / ESM，vitest 2.1.9
**上游依赖**：M8 已交付（build-code v1 / facts-schema.mjs / metrics/collector.mjs 可用）；M7 已交付（make-decision skill 可用）
**外部依赖**：
- isolated-browser-qa skill（`~/.claude/skills/isolated-browser-qa`，抄入 workflowhub 并改造去除 agenthub 硬编码路径）
- metrics/collector.mjs — M4 已交付，直接调用 recordSkeleton / updateOwnResult

**现有骨架**：`workflows/verify-code/SKILL.md`（64 行）定义了 stage-result 结构和 metrics 种子字段，是升级起点。

**NEEDS CLARIFICATION**：无。所有七条决策（D-M9-1~D-M9-7）、四条约束（C1~C4）、五条验收标准均由用户在 intake 第 5 步明确批准落盘。

---

## Constitution Check（对照 21 条逐条）

| 条款 | 结论 | 说明 |
|------|------|------|
| F1 薄核心 | YES | verify-code 本体只做调度，重活交给 capture.mjs / freshness.mjs / facts-assembly.mjs 脚本 |
| F2 窄契约 | YES | stage-result 七键契约最小固定，与 build-code 仅通过 facts.tests.command 单字段对接 |
| F3 物理事实靠机器校验但不阻断 | YES | capture.mjs 采集 exit 码/git_sha/hash，写入事实，不因此 blocking；metrics 写失败只 warn |
| F4 质量靠异源审查与人 | YES | v1 不设审查门，终态收尾人工确认（D6/F7） |
| F5 gate 谨慎添加 | YES | D-M9-2 freshness=record-not-block 明确鲜度校验绝不做成 blocking gate，只写 anomaly_flags |
| F6 统一外置执行记录 | YES | metrics/collector.mjs 已有，stage-result 写 durable |
| F7 推进与不可逆操作不自动越过人 | YES | FR-CLOSE-001/002/003：合并/删分支前明文停顿等人点头，不自动越界 |
| F8 简单优先 | YES | 3 个脚本最小实现，不照搬 agenthub 6000 行 gate 体系（C4，D21） |
| F9 可证伪、不假绿 | YES | capture 脚本 exit 码是物理信号，LLM 无法自报；anomaly_flags 测试故意改坏能看红 |
| F10 不为机器可校验堆基建 | YES | D-M9-7 明确端到端靠 M9 自举实跑，不堆重型 E2E 框架；CI 除冒烟外增加轻量三段闭环结构检查（只验产物链路贯通，无 UI/完整链路模拟），满足验收标准 5 同时遵守 F10 |
| Q1 记事实而非阻断 | YES | anomaly_flags 浮现警告不 FAIL；metrics 写失败只 warn 不 throw |
| Q2 gate 三类划分 | YES | 入口校验（command 字段存在）vs 采集（exit 码/sha）vs 人工确认（合并/删分支） |
| Q3 异源审查加人工把关 | YES | v1 不设审查门；终态合并需人确认 |
| S1 能用外部就不造轮子 | YES | isolated-browser-qa 直接抄入；metrics/collector.mjs 已有，直接用 |
| S2 外部技能可改造合宪 | YES | isolated-browser-qa 改掉 agenthub 硬编码路径，使其可在任意 repo 运行 |
| S3 迭代保持最新 | YES | reuse-registry.md 登记来源路径，便于检查更新 |
| S4 自定义技能必须有指标系统 | YES | recordSkeleton + updateOwnResult，对齐 M4 10 字段 |
| S5 方便子代理调用 | YES | SKILL.md 提示词自包含，可由子代理独立调用 |
| S6 参考市面方案不闭门造车 | YES | capture 脚本参考 agenthub capture-phase-evidence.sh 思路，workflowhub 风格改造 |
| S7 一阶段一技能一文件夹 | YES | workflows/verify-code/ 独立文件夹 |
| S8 可独立调用可搬运 | YES | SKILL.md + 脚本均不绑死宿主，相对路径从调用参数传入 |

**关键合宪确认**：
- D-M9-2 freshness=record-not-block → F5 YES：鲜度校验仅写 anomaly_flags，绝不 blocking
- FR-METRICS-001~004 → F3 YES：metrics 双写记事实，写失败 warn 不 throw
- F10 YES：D-M9-7 明确不堆 E2E 基建，M9 自举实跑本身就是端到端验证

---

## 最简方案判断（YAGNI 阶梯）

**需要存在吗？**

- `capture.mjs`：YES — FR-FRESH-001/002/003/004 要求外部物理事实采集（exit 码/git_sha/hash），LLM 无法自报，必须是外部进程
- `freshness.mjs`：YES — FR-FRESH-002/003/004 鲜度校验逻辑需可测试（anomaly_flags 构造）；从 capture.mjs 中独立出来使单测更聚焦
- `facts-assembly.mjs`：YES — FR-CMD-001/002/003 command 字段读取 + stage-result 组装；独立纯函数使 M9 自举测试中可直接 import
- `SKILL.md` 升级：YES — 骨架无 fresh 验证/鲜度/浏览器可选/收尾人工确认/metrics 接入五大能力
- isolated-browser-qa 抄入：YES — FR-BROWSER-001，D-M9-4，未来有 UI task 需此能力；M9 自举走 SKIP 分支可验证接线完整性
- build-code 侧 command 字段（C1）：YES — FR-CMD-003，verify-code 消费 facts.tests.command；M8 已交付但此字段缺失
- vitest 测试：YES — FR-TEST-001/003，三脚本各有可证伪单测 + CI 冒烟
- reuse-registry 更新：YES — FR-REG-001，isolated-browser-qa 引入必须登记来源

**已有吗？**

- metrics/collector.mjs：已有（M4 交付），直接调用 recordSkeleton / updateOwnResult
- vitest 框架：已有（2.1.9，ESM .mjs）
- build-code facts-schema.mjs：已有（M8），C1 在此基础上加 command 字段（追加，不删）
- stage-result 契约：SKILL.md 骨架已定义七键结构，直接落实

**已有模块可复用吗？**

- `capture.mjs` 和 M8 的 `workflows/build-code/capture.mjs` 功能相近，但 M8 采集 RED/GREEN 两态（TDD 阶段），M9 采集 fresh 单次跑。YAGNI 判断：不提取公共模块，两个目录各自独立的最小脚本（C4 明确不照搬 agenthub 实现，按 spec 重写；两脚本功能重合有限，抽公共层引入耦合得不偿失）。
- `freshness.mjs` 无现成复用，新建纯函数（≤30 行）。
- `facts-assembly.mjs` 消费 M8 的 `facts-schema.mjs` 导出的 `validateFacts`（入参校验），不重复实现。

**更简单吗？**

- 三个 .mjs 脚本保持 ESM 纯函数，无 IO 副作用（capture.mjs 除外——它必须写 durable evidence）
- isolated-browser-qa 直接 copy 一份文件，不引入 npm 包依赖
- SKILL.md 升级：覆写骨架，不新建平行文件

**阶梯结论**：最小切口 = 3 个 .mjs 脚本（capture/freshness/facts-assembly）+ SKILL.md 升级 + isolated-browser-qa 一份文件 copy + C1 build-code 侧 command 字段 + CI 冒烟配置 + reuse-registry 更新。STOP。

**不可简化红线**：
- capture.mjs 必须是外部进程，不能用 LLM 自报 exit 码（F9 可证伪性红线）
- freshness 校验绝不 BLOCK，只写 anomaly_flags（C2，D-M9-2，D5/D7）
- 合并/删分支前必须有明文停顿（C3，FR-CLOSE-001）
- isolated-browser-qa 抄入后必须去除所有 agenthub 硬编码路径（FR-BROWSER-001，C4）

**非显然取舍**：
- `freshness.mjs` 单独拆出 vs 合入 capture.mjs：拆出使鲜度逻辑（anomaly_flags 构造）可独立单测，代价是多一个文件。选拆出（FR-TEST-001 要求三脚本各有单测）。
- isolated-browser-qa 复制单文件 vs 引入子目录：skill 原本是目录形式，但 workflowhub 只需 SKILL.md 描述行为，无需完整目录结构。按 F8 简单优先，v1 只复制 SKILL.md 一个文件，命名为 `workflows/verify-code/isolated-browser-qa.md`，去除 agenthub 路径。实现时须确认原 skill 无脚本/资源类运行依赖（如有，一并处理或显式记录豁免）；agenthub 硬编码路径替换是 Task 4.2 的显式工作项。

---

## 项目文件结构

```
workflowhub/
├── workflows/
│   ├── verify-code/
│   │   ├── SKILL.md                        # 【修改】从 64 行骨架升 v1：fresh 验证+鲜度警告+浏览器可选+收尾人工确认+metrics 接入
│   │   ├── capture.mjs                     # 【新建】物理事实采集：执行测试命令、采集 exit 码/git_sha/content_hash、写 durable evidence JSON
│   │   ├── freshness.mjs                   # 【新建】鲜度校验纯函数：比对 build-code git_sha vs HEAD，返回 anomaly_flags 数组（不 BLOCK）
│   │   ├── facts-assembly.mjs              # 【新建】stage-result 组装：读事实包 command 字段（缺失报错）、组装七键 stage-result、路径对齐 D-M9-6
│   │   └── isolated-browser-qa.md          # 【新建】isolated-browser-qa 改造版：来自 ~/.claude/skills/isolated-browser-qa，去除 agenthub 硬编码路径
│   └── build-code/
│       ├── facts-schema.mjs                # 【修改】C1：facts.tests 新增 command 字段（追加，不破坏已有三键）
│       └── SKILL.md                        # 【修改】C1：声明 build-code 产出的 facts.tests 必须包含 command 字段
├── tests/
│   ├── verify-code-capture.test.mjs        # 【新建】capture.mjs 单元测试：exit 码采集/hash 幂等/失败命令不抛/anomaly_flags
│   ├── verify-code-freshness.test.mjs      # 【新建】freshness.mjs 单元测试：sha 匹配返空/sha 不匹配返 stale_sha/anomaly 浮现
│   └── verify-code-facts.test.mjs          # 【新建】facts-assembly.mjs 单元测试：command 读取/缺失报错/stage-result 结构七键/evidence_ref 路径
├── reuse-registry.md                        # 【修改】新增 isolated-browser-qa 一条目（改造适配 + 来源路径）
└── .github/workflows/ci.yml                # 【修改】CI 新增两步：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查（检查 make-decision 产物 → build-code stage-result + command 字段 → verify-code stage-result 路径，覆盖完整三段产物链）
```

**每个文件的职责**：

| 文件 | 变更 | 职责 |
|------|------|------|
| `workflows/verify-code/SKILL.md` | 修改 | 完整提示词：读事实包 → fresh 运行 capture.mjs → freshness 鲜度警告 → 浏览器验收（SKIP or isolated-browser-qa）→ 明文停顿 → 收尾 → metrics 双写 |
| `workflows/verify-code/capture.mjs` | 新建 | 外部进程采集：`runCapture(command, outputPath, opts)` 执行测试命令，写 `{command, git_sha, exit_code, timestamp, test_files_line, content_hash}` JSON |
| `workflows/verify-code/freshness.mjs` | 新建 | 纯函数：`checkFreshness(buildSha, headSha)` → `{ anomaly_flags: [], warnings: [] }`；sha 不匹配时 flags 含 "stale_sha" |
| `workflows/verify-code/facts-assembly.mjs` | 新建 | 纯函数：`readCommand(buildResult)` 读 command 字段（接收已解析 JSON 对象，缺失抛明确错误）；`assembleStageResult(opts)` 组装七键 stage-result；`writeStageResult(path, result)` 写 durable |
| `workflows/verify-code/isolated-browser-qa.md` | 新建 | isolated-browser-qa 改造版提示词，去除 agenthub 硬编码路径；SKIP 分支：无 UI 项时记 missing_items 不阻断 |
| `workflows/build-code/facts-schema.mjs` | 修改 | C1：`validateFacts` 对 `facts.tests.command` 字段做**可选校验**——字段存在时校验类型为 string，字段缺失时仍合法（向后兼容 M8 旧产物，不把旧 facts 判非法）；`buildTestsFact` 新增可选 command 参数 |
| `workflows/build-code/SKILL.md` | 修改 | C1：声明 build-code 产出的 `facts.tests` 必须包含 `command` 字段；使 build-code skill 与 facts-schema.mjs 的可选校验契约对齐，确保新产物实际写出 command（FR-CMD-003，C1） |
| `tests/verify-code-capture.test.mjs` | 新建 | capture.mjs 单测：正常路径/失败命令不抛/hash 幂等/test_files_line 提取 |
| `tests/verify-code-freshness.test.mjs` | 新建 | freshness.mjs 单测：sha 匹配/sha 不匹配/anomaly_flags 可证伪 |
| `tests/verify-code-facts.test.mjs` | 新建 | facts-assembly.mjs 单测：command 缺失报错/七键结构/evidence_ref 相对路径 |
| `reuse-registry.md` | 修改 | 新增 isolated-browser-qa 条目：改造适配 / `~/.claude/skills/isolated-browser-qa` |
| `.github/workflows/ci.yml` | 修改 | 新增两步：① verify-code 冒烟（`vitest run tests/verify-code-*.test.mjs --passWithNoTests=false`）；② 轻量三段闭环检查（检查 make-decision 产物存在可读 → 验证 build-code stage-result-build-code.json 可读且 facts.tests.command 存在 → 验证 verify-code stage-result 落盘路径结构，覆盖完整三段 make-decision → build-code → verify-code，不引入重型 E2E 框架） |

**spec 第 11 章业务影响覆盖**：

| 受影响功能 | 文件 | 变更类型 |
|-----------|------|---------|
| fresh 验证（现跑测试） | SKILL.md + capture.mjs | 新增 |
| 鲜度校验 anomaly_flags | SKILL.md + freshness.mjs | 新增 |
| 浏览器验收可选（SKIP 分支） | SKILL.md + isolated-browser-qa.md | 新增 |
| 终态收尾人工确认 | SKILL.md | 新增 |
| stage-result 落盘路径 | SKILL.md + facts-assembly.mjs | 新增 |
| M4 metrics 接入 | SKILL.md | 新增 |
| build-code facts.tests.command（C1） | workflows/build-code/facts-schema.mjs + workflows/build-code/SKILL.md | 扩展 |
| reuse-registry 登记 | reuse-registry.md | 修改 |
| CI 冒烟 | .github/workflows/ci.yml | 扩展 |

---

## 证据契约预声明

```evidence-contract
{
  "red": {
    "command": "node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
    "exit_code": 1,
    "timestamp": "PLACEHOLDER_FILL_AT_APPLY",
    "phase": 1,
    "mode": "RED"
  },
  "green": {
    "command": "node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
    "exit_code": 0,
    "timestamp": "PLACEHOLDER_FILL_AT_APPLY",
    "phase": 1,
    "mode": "GREEN"
  },
  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/evidence/",
  "affectedTests": ["tests/verify-code-capture.test.mjs"]
}
```

```evidence-contract
{
  "red": {
    "command": "node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
    "exit_code": 1,
    "timestamp": "PLACEHOLDER_FILL_AT_APPLY",
    "phase": 2,
    "mode": "RED"
  },
  "green": {
    "command": "node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
    "exit_code": 0,
    "timestamp": "PLACEHOLDER_FILL_AT_APPLY",
    "phase": 2,
    "mode": "GREEN"
  },
  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/evidence/",
  "affectedTests": ["tests/verify-code-freshness.test.mjs"]
}
```

```evidence-contract
{
  "red": {
    "command": "node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
    "exit_code": 1,
    "timestamp": "PLACEHOLDER_FILL_AT_APPLY",
    "phase": 3,
    "mode": "RED"
  },
  "green": {
    "command": "node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
    "exit_code": 0,
    "timestamp": "PLACEHOLDER_FILL_AT_APPLY",
    "phase": 3,
    "mode": "GREEN"
  },
  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/evidence/",
  "affectedTests": ["tests/verify-code-facts.test.mjs"]
}
```

```evidence-contract
{
  "red": {
    "command": "node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
    "exit_code": 1,
    "timestamp": "PLACEHOLDER_FILL_AT_APPLY",
    "phase": 4,
    "mode": "RED"
  },
  "green": {
    "command": "node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
    "exit_code": 0,
    "timestamp": "PLACEHOLDER_FILL_AT_APPLY",
    "phase": 4,
    "mode": "GREEN"
  },
  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/evidence/",
  "affectedTests": [
    "tests/verify-code-capture.test.mjs",
    "tests/verify-code-freshness.test.mjs",
    "tests/verify-code-facts.test.mjs"
  ]
}
```

---

## 验证策略

### 交付验证

| 类别 | 命令 | 通过判据 |
|------|------|---------|
| verify-code 专项测试 | `node_modules/.bin/vitest run tests/verify-code-*.test.mjs --passWithNoTests=false` | exit 0，Test Files 行显示 3 个文件跑到 |
| 全量回归 | `node_modules/.bin/vitest run --passWithNoTests=false` | exit 0，无新增失败 |
| capture 直接调用 | `node workflows/verify-code/capture.mjs 2>&1 \| head -5` | exit 0，无语法错误 |
| C1 facts-schema 单测 | `node_modules/.bin/vitest run tests/build-code-facts.test.mjs --passWithNoTests=false` | exit 0（command 字段新增后仍绿）|

### 异常验证

| 场景 | 验证方式 |
|------|---------|
| command 字段缺失（FR-CMD-002） | 构造缺 command 的 build-result，验证 `readCommand` 抛明确错误 |
| sha 不匹配（FR-FRESH-003） | 构造 buildSha≠headSha，验证 anomaly_flags 含 "stale_sha"，无 FAIL |
| anomaly_flags 浮现（FR-FRESH-004） | 构造非空 anomaly_flags，验证 warnings 字段非空（可证伪：注释 warning 逻辑后测试变红） |

### 代码验证

- `workflows/verify-code/SKILL.md`：人工检查五能力段（fresh/freshness/browser-skip/close-confirm/metrics）均存在
- `workflows/verify-code/isolated-browser-qa.md`：grep 确认无 `agenthub` / `/Users/Hugh/Hugh/Project/multica-agenthub` 硬编码路径

---

## Data Model（stage-result 结构）

**verify-code stage-result 七键契约**（FR-PATH-001，spec §6）：

```json
{
  "status": "success | failure",
  "error_code": "",
  "retryable": false,
  "facts": {
    "verdict": "pass | fail",
    "evidence_ref": "test/final-test-report.md",
    "anomaly_flags": []
  },
  "missing_items": [],
  "user_decision": false,
  "reason": "All acceptance criteria verified and documented."
}
```

**向后兼容**：M10 可在 facts 下追加新键，不破坏现有字段语义（spec §8）。

---

## 与现有功能集成

1. **build-code facts.tests.command（C1）**（FR-CMD-003）：`workflows/build-code/facts-schema.mjs` 的 `validateFacts` 对 `facts.tests.command` 做**可选字段校验**——present 时校验类型为 string，absent 时仍合法（不把历史 M8 旧 facts 判为 invalid，满足 C1 向后兼容要求）。`buildTestsFact` 新增可选 command 参数，新产物写入该字段。verify-code 侧读到旧包缺 command 时 status="failure" 并给明确错误（这是 verify-code 的消费行为，不是 schema 非法）。已有消费方读 `red_exit_code`/`green_baseline_hash` 等字段不受影响（追加语义）。**同步改动**：`workflows/build-code/SKILL.md` 需声明 build-code 产出的 `facts.tests` 必须包含 `command` 字段，确保 skill 行为与 schema 契约一致，让 verify-code 输入可靠（C1 + FR-CMD-003 要求同步两件）。
2. **metrics collector**（FR-METRICS-001~004）：直接调用 M4 的 `metrics/collector.mjs`，recordSkeleton 在 stage 开始，updateOwnResult 在结束，双写 task-level + global（FR-COLLECT-006/007）。写失败 warn 不 throw（FR-GUARD-001）。
3. **isolated-browser-qa**（FR-BROWSER-001）：复制 `~/.claude/skills/isolated-browser-qa/SKILL.md`，改造去除 agenthub 硬编码路径，落 `workflows/verify-code/isolated-browser-qa.md`。

---

## 治理文件同步矩阵

| 类别 | 改/不改 | 原因 | Task |
|------|---------|------|------|
| 项目规则（CLAUDE.md / AGENTS.md） | 不改 | M9 仅新增 skill 文件，不触碰项目级规则 | — |
| workflow 定义（SKILL.md） | 改 | `workflows/verify-code/SKILL.md` 从骨架升 v1 | Task 4.1 |
| reviewer contract | 不改 | M9 v1 不设审查门 | — |
| schema | 运行时 facts schema 改，项目级/平台级 schema 不改 | `workflows/build-code/facts-schema.mjs` 新增 command 可选字段校验（C1）；`workflows/build-code/SKILL.md` 声明产出必须包含 command 字段（C1）；项目级 CLAUDE.md / 平台 schema 文件不改 | Task 3.3 + Task 3.5 |
| runtime config | 不改 | M9 不修改 harness 配置 | — |
| knowledge/doc | 不改 | M9 不引入新宪法条款 | — |
| automation gates / CI | 改 | `.github/workflows/ci.yml` 新增两部分：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查脚本（结构性验证产物链路贯通，不引入重型 E2E 框架，按 D-M9-7/F10） | Task 5.1 |
| reuse-registry | 改 | 新增 isolated-browser-qa 条目 | Task 4.3 |

---

## FR 覆盖矩阵（24 FR 全映射）

> spec 实际列出 24 条 FR（FR-FRESH 4 + FR-CMD 3 + FR-BROWSER 3 + FR-CLOSE 3 + FR-PATH 3 + FR-METRICS 4 + FR-TEST 3 + FR-REG 1 = 24），本文按 24 条逐一映射，无遗漏。

| FR | 映射到 |
|----|--------|
| FR-FRESH-001 | SKILL.md § fresh 验证 + capture.mjs |
| FR-FRESH-002 | capture.mjs git_sha 采集 + freshness.mjs 比对 |
| FR-FRESH-003 | freshness.mjs anomaly_flags 构造，不 BLOCK；verify-code-freshness.test.mjs 可证伪 |
| FR-FRESH-004 | freshness.mjs warnings 字段；SKILL.md 边界输出；verify-code-freshness.test.mjs |
| FR-CMD-001 | facts-assembly.mjs readCommand；SKILL.md 读 facts.tests.command |
| FR-CMD-002 | facts-assembly.mjs readCommand 缺失抛错；verify-code-facts.test.mjs |
| FR-CMD-003 | workflows/build-code/facts-schema.mjs C1 追加 command 可选字段；workflows/build-code/SKILL.md 声明产出必须包含 command（C1 同步两件） |
| FR-BROWSER-001 | workflows/verify-code/isolated-browser-qa.md（改造版）；reuse-registry.md |
| FR-BROWSER-002 | SKILL.md SKIP 分支；facts-assembly.mjs missing_items 写入 |
| FR-BROWSER-003 | SKILL.md SKIP 后继续收尾流程 |
| FR-CLOSE-001 | SKILL.md 明文停顿段 |
| FR-CLOSE-002 | SKILL.md user_decision 记录；facts-assembly.mjs assembleStageResult |
| FR-CLOSE-003 | SKILL.md 明文停顿处不可逆动作清单 |
| FR-PATH-001 | facts-assembly.mjs writeStageResult 落 specs/{task-id}/stage-result-verify-code.json |
| FR-PATH-002 | SKILL.md final-test-report.md 落 specs/{task-id}/test/ |
| FR-PATH-003 | facts-assembly.mjs evidence_ref 相对 specs/{task-id}/ 根 |
| FR-METRICS-001 | SKILL.md recordSkeleton 在 stage 开始 |
| FR-METRICS-002 | SKILL.md updateOwnResult 在 stage 结束 |
| FR-METRICS-003 | SKILL.md metrics 双写；metrics/collector.mjs FR-COLLECT-006/007 |
| FR-METRICS-004 | verify-code-facts.test.mjs 10 字段结构性检查 |
| FR-TEST-001 | verify-code-capture/freshness/facts 三个 .test.mjs 文件 |
| FR-TEST-002 | M9 自举端到端（无需额外 E2E 框架，F10） |
| FR-TEST-003 | .github/workflows/ci.yml 新增两步：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查脚本（scripts/ci-chain-check.mjs：检查 make-decision 产物存在可读 → build-code stage-result-build-code.json 可读且 facts.tests.command 存在 → verify-code stage-result 落盘路径结构，覆盖完整三段 make-decision → build-code → verify-code 产物链，不引入重型 E2E 框架，满足验收标准 5 + D-M9-7/F10） |
| FR-REG-001 | reuse-registry.md isolated-browser-qa 条目 |
