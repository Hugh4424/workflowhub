# 实现计划：M7 intake v1（升级 make-decision）

基于 spec.md（specs/m7-intake-v1/spec.md，已过 design-review pass）。
需求权威源：tasks/m7-intake-v1/artifacts/decision-log.md（D-M7-1 至 D-M7-13）。
交付仓：workflowhub（/Users/Hugh/Hugh/Project/workflowhub）。本期零改动 agenthub。
风格：ponytail YAGNI（CONSTITUTION F8 简单优先 / F10 防过度工程）——同类改动合并，不为填模板凑章。

## 1. 用户场景

**场景一（主路）**：工头跑 `/make-decision`，make-decision 内部按提示词步骤执行 scope-triage（分流范围）→ decision-log（收敛产出决策记录）→ 产出 stage-result（facts 含 decision/scope/decision_log_path 三个 key）。M8 build-code 后续读 `facts.decision_log_path` 获取完整决策记录。

**场景二（组件独立调起）**：子代理或维护者直接调 `/scope-triage` 或 `/decision-log`，各自独立产出（范围判定结果 / 决策内容），各写一条 collector 指标记录（stage 字段分别为 `scope-triage` / `decision-log`）。

**场景三（验收失败）**：删 scope-triage 目录 → seven-skills-present 测试红。缺 registry 类别 → reuse-registry 断言红。漏接 collector → 扫描器退出非 0。

## 2. 方案概述

M6 已建五段薄骨架（make-decision 是其中一段，纯提示词，facts 含 decision/scope）。M7 在此基础上三步扩展：

1. 新建两个组件 skill 目录（scope-triage / decision-log），各一份 SKILL.md。
2. 升级 make-decision SKILL.md：内联两组件逻辑摘要 + 显式路径引用 + facts 扩展 decision_log_path。
3. 扩测试 + 扩扫描器 + 建 reuse-registry.md + 更新 roadmap.md + 写 CONTEXT.md 组件 skill 概念。

所有改动均在 workflowhub 仓，agenthub 零改动。

## 3. 最简方案判断（YAGNI 阶梯）

| 需求 | 阶梯判断 | 结论 |
|---|---|---|
| scope-triage / decision-log 是否需要现在存在 | ①需要存在：M7 核心交付物 | 做 |
| 组件 skill 形态 | ②已有 SKILL.md 模式可复用 | 纯提示词，不加 index.mjs |
| facts 扩展 decision_log_path | ③现有 stage-result 契约 additive 扩展即可 | 不新建 schema，改 facts-subschema.json |
| reuse-registry 验收 | ④折中：在已有 five-skills 测试加断言 | 不建独立 CI job（D-M7-11）|
| check-stage-quality 扩展 | ③现有扫描器扩展即可 | 不新建扫描器 |
| roadmap.md 改名 | ①需要对齐（D-M7-9）| 只改 roadmap.md 文档，代码级 intake 不动（D-M7-9-clarify）|
| CONTEXT.md 补概念 | ①防后续歧义（已决 2） | 追加段落，不新建文件 |

## 4. 模块划分

本期涉及 7 个交付模块，对应 spec 第 5 章：

- **scope-triage SKILL.md**（新增）：组件 skill，纯提示词，in-scope/out-of-scope 分流，接 collector 指标。
- **decision-log SKILL.md**（新增）：组件 skill，纯提示词，收敛产出 decision-log 文件，接 collector 指标。
- **make-decision SKILL.md**（升级）：内联两组件逻辑摘要，显式路径引用，facts 扩展 decision_log_path，升级 collector 记录。
- **reuse-registry.md**（新增）：仓根 markdown 表，7 个 skill，各一行（名/类别/来源路径）。
- **CI 冒烟扩展**（修改 tests/five-skills-present.test.mjs）：five→seven-skills 字面量断言 + registry 行格式断言 + stage-result 契约形状断言 + metric-scan 三 skill 扩展。
- **check-stage-quality.mjs 扩展**（修改）：脚本已动态遍历 workflows/ 全部子目录（219-242 行，无 hardcode 白名单），新增 skill 自动纳入扫描；本期重点是补 tests/metric-scan.test.mjs 针对组件 skill 的测试用例，验证漏接 collector 时退出码非 0。
- **roadmap.md + CONTEXT.md**（修改）：roadmap 命名对齐 + CONTEXT.md 补组件 skill 概念定义段。

## 5. 影响范围

### 新增文件
- `workflows/scope-triage/SKILL.md`
- `workflows/decision-log/SKILL.md`
- `reuse-registry.md`

### 修改文件
- `workflows/make-decision/SKILL.md` — 升级提示词内容 + facts 扩展
- `contracts/facts-subschema.json` — make-decision 段 required_keys 加 `decision_log_path`
- `tests/five-skills-present.test.mjs` — seven-skills 字面量断言 + registry 断言 + 契约形状断言
- `tests/metric-scan.test.mjs` — 扩到三 skill 正例覆盖
- `scripts/check-stage-quality.mjs` — 扫描范围扩三 skill
- `roadmap.md`（路径：`/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md`，在 program artifacts 树（Knowledge），不在 workflowhub 仓）— 命名全局对齐（intake→make-decision 等，仅文档，约 26 处）
- `CONTEXT.md` — 补「组件 skill」概念定义段

### 不涉及
- agenthub 全部现有实现（零改动）
- workflowhub 宪法 21 条（不追加条目）
- 代码级 intake 字面量（FIVE_STAGES / 契约值 / 测试 / spike，出 M7 范围）

### 业务影响范围
- make-decision facts 新增 `decision_log_path` key：additive 扩展，不破坏现有消费方（下游 build-code 读不到该 key 则静默跳过，兼容性见 spec 第 8 章）。
- CI 测试从 five→seven：新增两个字面量测试，旧五个独立断言不变，无回归风险。

## 6. decision-log 链路 / FR 链路

| FR | 对应 phase/task（以 tasks.md 标注为准） |
|---|---|
| FR-INTK-001 | Phase 3 T011（make-decision SKILL.md 路径引用） |
| FR-INTK-002 | Phase 3 T009（tests）+ T010（facts-subschema 扩展）+ T011（SKILL.md facts 示例） |
| FR-INTK-003 | Phase 3 T011（纯提示词，无执行入口） |
| FR-SCOPE-001 | Phase 1 T001（断言）+ T002（SKILL.md）+ T003（registry） |
| FR-SCOPE-002 | Phase 1 T002（纯提示词约束） |
| FR-SCOPE-003 | Phase 1 T002（collector stage 字段） |
| FR-DLOG-001 | Phase 2 T005（断言）+ T006（SKILL.md）+ T007（registry） |
| FR-DLOG-002 | Phase 2 T006（产物路径 + 7 节约束） |
| FR-DLOG-003 | Phase 2 T006（collector stage 字段） |
| FR-DLOG-004 | Phase 2 T006（agenthub 清洁声明） |
| FR-REG-001 | Phase 4 T015（reuse-registry.md 7 行） |
| FR-REG-002 | Phase 4 T015（类别枚举 + 来源非空）+ Phase 5 T017（断言校验） |
| FR-METRIC-001 | Phase 1 T002 + Phase 2 T006 + Phase 3 T011（三 skill 各接 collector） |
| FR-METRIC-002 | Phase 1 T002（scope-triage stage 字段）+ Phase 2 T006（decision-log stage 字段） |
| FR-METRIC-003 | Phase 5 T018（metric-scan 测试）+ T019（扫描器增强） |
| FR-CI-001 | Phase 5 T017（七 skill 字面量断言） |
| FR-CI-002 | Phase 5 T017（registry 行格式断言） |
| FR-CI-003 | Phase 5 T017（验证无执行入口）+ T020（npm run check） |

### Governance 同步矩阵

M7 改了 workflow prompts（SKILL.md）、schema（facts-subschema.json）、automation（check-stage-quality.mjs）、knowledge/doc，以下采用 plan-reviewer-contract 规定的固定 7 分类逐类判断：

| 分类 | 改/不改 | 原因 | 对应 Task |
|---|---|---|---|
| 项目规则（CLAUDE.md / AGENTS.md / 子包 CLAUDE.md） | 不改 | M7 不动任何 CLAUDE.md / AGENTS.md；workflowhub 宪法 CONSTITUTION.md 不追加条目 | — |
| workflow 定义（stage prompts / *.workflow.ts / SKILL.md） | **改** | 新增 scope-triage/decision-log SKILL.md；升级 make-decision SKILL.md（内联组件引用 + facts 扩展） | T002、T006、T011 |
| reviewer contract（base-verifier / reviewer prompt / 审查合同） | 不改 | M7 不动审查合同（plan-reviewer-contract / base-verifier.md 均不涉及）；新 skill 不新增审查合同条目 | — |
| schema（journal event / checkpoint / *.schema.json / facts-subschema.json） | **改** | facts-subschema.json 的 make-decision required_keys 加 decision_log_path | T010 |
| runtime config（.claude/settings.json / 引擎配置） | 不改 | M7 无新 runtime 配置需求；check-stage-quality.mjs 动态遍历 workflows/ 全子目录，新增 skill 自动纳入，无需手改 config | — |
| knowledge/doc（constitution / CONTEXT / roadmap / Knowledge 规则） | **改** | CONTEXT.md 追加「组件 skill」概念定义段；roadmap.md 命名全局对齐（intake→make-decision 等约 26 处） | T013、T014 |
| automation gates / CI / hooks（.github/workflows / pre-commit / gate scripts / 测试文件） | **改** | tests/five-skills-present.test.mjs 扩七 skill 字面量断言 + registry 格式断言；tests/metric-scan.test.mjs 扩三 skill 正例覆盖；scripts/check-stage-quality.mjs 增 collector 路径 + stage 字面量检查 | T017、T018、T019 |

### 触发的 invariant（CONSTITUTION）

- **F4（不靠 CI 执行 skill）**：CI 冒烟不含 skill 执行入口 ← 对应 FR-CI-003。
- **F8（简单优先）**：不建独立 CI job、不建新扫描器 ← 对应 D-M7-11。
- **F10（防过度工程）**：registry 轻量断言塞进已有测试 ← 对应 D-M7-11。
- **F9（可证伪）**：字面量独立断言（删一个 skill 则精确一个断言红）← 对应 FR-CI-001。
- **S4（自研 skill 必配指标）**：三 skill 各接 collector.mjs ← 对应 FR-METRIC-001。
- **S7（一阶段一技能）**：组件 skill 不构成独立 stage，不违反 S7 ← 对应 D-M7-2。

未触发 invariant：F1/F2/F3/F5/F6/F7/S1-S3/S5/S6/S8 — 本期改动全在 workflowhub，不改核心架构、不新增 runtime 机制、不涉及数据库/API/安全边界，上述 invariant 不适用（本期纯提示词 + 测试 + 静态文档改动）。

## 7. UI 变更

N/A — 本项目纯 skill/文档/测试，无 UI。所有 phase 的 `ui_change: false`。

## 8. 验证策略

每个 phase 独立可测（RED→GREEN），不依赖其他 phase 的中间产物：

- **Phase 1**（scope-triage SKILL.md）：`npx vitest run tests/five-skills-present.test.mjs` — 新增 scope-triage 目录和 frontmatter 断言。
- **Phase 2**（decision-log SKILL.md）：`npx vitest run tests/five-skills-present.test.mjs` — 新增 decision-log 目录和 frontmatter 断言。
- **Phase 3**（make-decision 升级 + facts 扩展）：`npx vitest run tests/facts-subschema.test.mjs` — make-decision facts 含 decision_log_path 反例红/正例绿。
- **Phase 4**（roadmap + CONTEXT.md + reuse-registry）：人工核 + Phase 5 测试覆盖 registry 格式。
- **Phase 5**（CI 扩展 + 扫描器扩展）：`npx vitest run tests/five-skills-present.test.mjs && npx vitest run tests/metric-scan.test.mjs` — 七 skill 断言 + registry 断言 + 扫描器三 skill 覆盖。
- **全量零回归**：`cd /Users/Hugh/Hugh/Project/workflowhub && npm run check`（跑全量 CI 检查）+ `npx vitest run`（全量测试）。

### 证据契约预声明

#### Phase 3 证据契约

```evidence-contract
{
  "red": {
    "command": "npx vitest run tests/facts-subschema.test.mjs --reporter=verbose",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_HEAD_SHA",
    "exit_code": 1,
    "timestamp": "PLACEHOLDER_ISO_TS",
    "phase": 3,
    "mode": "RED"
  },
  "green": {
    "command": "npx vitest run tests/facts-subschema.test.mjs --reporter=verbose",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_HEAD_SHA",
    "exit_code": 0,
    "timestamp": "PLACEHOLDER_ISO_TS",
    "phase": 3,
    "mode": "GREEN"
  },
  "evidenceSink": "apply/evidence/phase-3-RED.json",
  "affectedTests": [
    "tests/facts-subschema.test.mjs"
  ]
}
```

#### Phase 5 证据契约

```evidence-contract
{
  "red": {
    "command": "npx vitest run tests/five-skills-present.test.mjs tests/metric-scan.test.mjs --reporter=verbose",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_HEAD_SHA",
    "exit_code": 1,
    "timestamp": "PLACEHOLDER_ISO_TS",
    "phase": 5,
    "mode": "RED"
  },
  "green": {
    "command": "npx vitest run tests/five-skills-present.test.mjs tests/metric-scan.test.mjs --reporter=verbose",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_HEAD_SHA",
    "exit_code": 0,
    "timestamp": "PLACEHOLDER_ISO_TS",
    "phase": 5,
    "mode": "GREEN"
  },
  "evidenceSink": "apply/evidence/phase-5-RED.json",
  "affectedTests": [
    "tests/five-skills-present.test.mjs",
    "tests/metric-scan.test.mjs"
  ]
}
```

## 9. 上游合并安全评估

workflowhub 是独立仓，不跟 multica upstream merge。本期：
- 新增三文件（scope-triage/SKILL.md、decision-log/SKILL.md、reuse-registry.md）：纯新增，零冲突风险。
- 修改 workflows/make-decision/SKILL.md：升级提示词内容，不改接口签名，低风险。
- 修改 contracts/facts-subschema.json：additive 扩展（make-decision required_keys 加一项），不改已有项，低风险。
- 修改测试文件：扩断言，不删旧断言，零回归风险。
- protected-paths（CONSTITUTION/AGENTS/CONTEXT）中 CONTEXT.md 只追加段落，不改已有内容，低风险。

## 10. 宪法门禁

| 条款 | 判断 | 依据 |
|---|---|---|
| F9（可证伪不假绿） | YES | 每条验收（AC1-AC6）均有明确反向判据；FR-CI-001 字面量断言删一 skill 精确一断言红，不跟着缩 |
| F4（无运行时阻断 gate） | YES | CI 冒烟只压契约管道（静态断言），不执行 skill 本身，无 runtime blocking 入口；collector 与 stage-result 双独立机制（D-M7-4a），互不阻断 |
| F8（简单优先） | YES | registry 轻量断言塞进已有测试而非新建 CI job；check-stage-quality.mjs 动态遍历无需改枚举逻辑；reuse-registry 纯 markdown 表；对应 D-M7-11 |
| F9（可证伪） | YES | 七 skill 字面量独立断言（删任一目录精确一红）；facts-subschema 反例（缺 decision_log_path 即红）；metric-scan 负例（漏 collector.mjs 路径退出非 0） |
| F10（不为机器可校验性本身做过度自动化基建） | YES | 不新建 CI job、不引入新 runtime 机制；scanner 扩展只补必要检出能力（collector 路径 + stage 字面量）；参照 MEMORY M0-reference-not-gate 教训 |
| S4（自研 skill 必配指标） | YES | 三 skill（make-decision/scope-triage/decision-log）各接 collector.mjs，FR-METRIC-001 保证，T002/T006/T011 实现，T018/T019 测试覆盖 |
| S7（一阶段一技能） | YES | scope-triage/decision-log 是组件 skill（从属 make-decision stage，不构成独立 stage），不违反 S7；对应 D-M7-2 决策 |
| S8（可独立调用可搬运） | YES | 两组件 skill 物理独立（各有 SKILL.md 可单独调起）；make-decision 路径引用显式（可 grep），无隐式耦合 |

## 11. Code Anchor 表

| 锚点 | 对象 | 当前接口签名 |
|---|---|---|
| SIG-001 | contracts/stage-result.contract.json | 顶层 required: status/error_code/retryable/facts/missing_items/user_decision/reason；facts 开放 object |
| SIG-002 | contracts/facts-subschema.json | make-decision required_keys: [decision, scope]；本期扩展加 decision_log_path |
| SIG-003 | config/workflowhub.yaml registry | 数组，每条 {component_id, workflow, path}；本期加两条 |
| SIG-004 | scripts/check-stage-quality.mjs | CLI 动态遍历 workflows/ 全部子目录（219-242 行），导出 scanSkillMetrics；本期重点补组件 skill 测试用例，不改枚举逻辑 |
| SIG-005 | metrics/collector.mjs | recordSkeleton / updateOwnResult API，stage 字段用自身 skill 名 |
