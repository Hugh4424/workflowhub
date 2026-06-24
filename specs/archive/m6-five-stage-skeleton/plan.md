# 实现计划：M6 五段薄骨架（workflowhub 五个标准 skill）

> 基于 spec.md（specs/m6-five-stage-skeleton/spec.md，已过 design-review round2 pass）。
> 需求权威源：tasks/m6-five-stage-skeleton/artifacts/decision-log.md（D1-D14）。
> 交付仓：workflowhub（/Users/Hugh/Hugh/Project/workflowhub）。本期零改动 agenthub。
> 风格：ponytail YAGNI（CONSTITUTION F8 简单优先 / F10 防过度工程）——同类改动合并，不为填模板凑章。

## 1. 技术上下文

- 交付仓：workflowhub（Node.js 项目，ESM .mjs，AJV 校验，node --test 测试）。
- 已有基建：CONSTITUTION.md（21 条，含 F4/F10）、contracts/stage-result.contract.json（facts 开放 object）、config/workflowhub.yaml（registry + metrics_path）、scripts/check-stage-quality.mjs（指标质量扫描器，344 行）、core/protected-paths.mjs（运行时非阻断提醒）。
- 五段 skill 落 workflows/{make-decision,build-spec,build-plan,build-code,verify-code}/SKILL.md。
- NEEDS CLARIFICATION：无（design 阶段已消歧，facts 子 schema 在 spec 第 6 章锚定）。

## 2. 宪法门禁（YES/NO 逐项）

- F1 薄核心：YES — skill 是纯提示词，不塞业务逻辑进核心。
- F2 窄契约：YES — 五段靠 stage-result 单向传递，facts 子 schema 是窄接口。
- F3 物理事实机器校验不阻断：YES — 指标采集退出码/产物，不卡流程。
- F4 质量靠异源审查+人非阻断门：YES — 不引运行时质量 gate，质量靠 plan/design-review + 人。
- F8 简单优先：YES — 五份纯提示词 + 复用现有契约/扫描器，无新机器入口。
- F9 可证伪不假绿：YES — facts 子 schema 防空 object 假绿，扫描器检漏接指标，AC 带正反样例。
- **F10 自动化按真实收益不堆基建**：YES — 不加 index.mjs / 不为 CI 给 skill 加机器入口；复用 check-stage-quality.mjs 而非新建扫描器。F10 约束以提示词文字注入 build-spec/build-plan（FR-ANTIBLOAT-001）。
- S4 自定义技能必须有指标系统：YES — 每段写一条指标（FR-METRIC-001）。
- S5 方便子代理调用省主上下文：YES — 回报复用 stage-result 摘要（FR-WIRING-003）。
- S7 一阶段一技能一工作流一文件夹：YES — 五段各一目录一 SKILL.md。
- CLAUDE.md 工程硬规则：YES — 不引需求外概念，每行变更追溯 D1-D14。

## 2.5 治理同步矩阵（7 类固定分类逐类判断）

> 本计划新增 5 个 workflow skill 提示词 + 改 registry，属 workflow/agent prompt 改动，按 plan-reviewer-contract 7 类固定分类逐类判断（改/不改 + 原因，标"改"须引对应 Task）。

| 治理分类 | 改/不改 | 原因 | 对应 Task |
|---|---|---|---|
| 项目规则（CLAUDE.md / AGENTS.md / 子包 CLAUDE.md） | 不改 | 五段 skill 是 workflowhub 新增内容，不改 agenthub 项目规则；workflowhub 无独立 CLAUDE.md 需更新 | — |
| workflow 定义（stage prompts / *.workflow.ts） | 改 | 新增五段 SKILL.md 即 workflow 阶段定义本体 | T002-T006 |
| reviewer contract（base-verifier / reviewer prompt / 审查合同） | 不改 | 本期不动审查机制（F4 质量靠异源审查，不改合同本身） | — |
| schema（journal event / checkpoint / *.schema.json） | 改 | 新增 contracts/facts-subschema.json（五段 facts 子 schema） | T010 |
| runtime config（.claude/settings.json / 引擎配置） | 改 | config/workflowhub.yaml registry 加五条 | T007 |
| knowledge/doc（docs / constitution.md / Knowledge 规则） | 不改 | F10 已在册（commit 7453d4b），本期不改宪法；无新增 doc 需求 | — |
| automation gates / CI / hooks（.github/workflows / pre-commit / gate scripts） | 改 | 扩展 scripts/check-stage-quality.mjs（检漏接指标的质量扫描器） | T015 |

## 3. 技术选型决策

| 决策项 | 候选 | 选择 | 理由 |
|---|---|---|---|
| skill 形态 | 纯提示词 / 带执行入口 | 纯提示词 | D3：不塞执行代码/index.mjs，F10 |
| facts 校验落点 | 新建 schema / 复用 stage-result + 子 schema 约定 | 复用 + 子 schema | D6/D11：不新建 skill-summary schema |
| 指标扫描器 | 新建 / 扩展 check-stage-quality.mjs | 扩展现有 | D13：复用，F10 防堆基建 |
| 端到端验证 | CI 跑 pipeline / 人·AI 实跑 | 人·AI 实跑 | F4：不靠 CI 执行 skill |

## 4. 数据模型

本期不涉及数据库/迁移。涉及的数据结构（stage-result 产物 facts 子 schema、指标记录）已在 spec 第 6 章锚定，不重复。

## 5. API 接口

本期不涉及 API。

## 6. 项目文件结构

> 覆盖 spec 第 11 章业务影响范围每一项。所有路径相对 workflowhub 仓根。

```text
workflowhub/
├── workflows/
│   ├── make-decision/SKILL.md      # 新增 — intake 段纯提示词（facts: decision/scope）
│   ├── build-spec/SKILL.md         # 新增 — design 段（facts: spec_ref/requirements，含 F10 注入）
│   ├── build-plan/SKILL.md         # 新增 — plan 段（facts: plan_ref/tasks，含 F10 注入）
│   ├── build-code/SKILL.md         # 新增 — apply 段（facts: changed/tests，slim 路认 make-decision 产物）
│   └── verify-code/SKILL.md        # 新增 — test-acceptance 段（facts: verdict/evidence_ref）
├── config/workflowhub.yaml         # 修改 — registry 加五条
├── contracts/
│   └── facts-subschema.json        # 新增 — 五段 facts 子 schema（FR-CONTRACT-002，每段必含 key 非空）
├── scripts/
│   ├── validate-stage-result.mjs   # 新增 — 校验产物过 stage-result + 本段 facts 子 schema
│   └── check-stage-quality.mjs     # 修改 — 扩展为能检漏接指标的 skill（FR-METRIC-002）
└── tests/
    ├── facts-subschema.test.mjs    # 新增 — 五段 facts 子 schema 正反样例
    ├── five-skills-present.test.mjs # 新增 — 五段齐全 + frontmatter 可发现（AC1/AC4）
    └── metric-scan.test.mjs        # 新增 — 扫描器检漏接指标（AC6）
```

总文件：5 新增 SKILL + 1 改 config + 1 新 contract + 2 scripts（1新1改）+ 3 tests = 12 个。

## 7. 数据流向

make-decision 产 stage-result（facts.decision/scope）→ [big 路] build-spec→build-plan→build-code→verify-code 逐段读上游 facts 约定 key；[small 路] make-decision → build-code 直读 facts.decision。每段写一条指标到 metrics_path。

## 8. 依赖情况

无新增第三方依赖。复用 workflowhub 现有 AJV + node:test。

## 9. 与现有功能集成

- registry：增量加五条，不改现有 noop 条目语义。
- check-stage-quality.mjs：扩展扫描范围（加 skill 指标接入检查），保留现有三类反模式检测。
- stage-result 契约：不改契约文件本身，新增 facts 子 schema 作旁路校验。

## 10. 上游合并安全评估

workflowhub 是独立仓，不跟 multica upstream。本期全新增 + 一处扩展现有脚本，无深改高风险文件。protected-paths（CONSTITUTION/AGENTS/CONTEXT）不动。

## 11. Code Anchor 表 + 复用优先矩阵

| 锚点 | 对象 | 当前接口签名 |
|---|---|---|
| SIG-001 | contracts/stage-result.contract.json | 顶层 required: status/error_code/retryable/facts/missing_items/user_decision/reason；facts 开放 object |
| SIG-002 | config/workflowhub.yaml registry | 数组，每条 {component_id, workflow, path} |
| SIG-003 | scripts/check-stage-quality.mjs | CLI 扫 metrics/+scripts/，退出码 0/1/2，支持 --self-test |
| SIG-004 | metrics_path | config 项 = ~/.workflowhub/metrics/global-metrics.jsonl（追加 jsonl） |

复用优先：facts 校验复用 stage-result + AJV；指标检查扩展 check-stage-quality.mjs；不新造扫描器。

## 12. 实现风险点和 phase 级回滚

| Phase | 风险 | 预防措施 | 回滚方式 |
|---|---|---|---|
| 1 | 五份 SKILL.md 内容残留 agenthub gate 机制段 | 提取时只取"该阶段干什么"，grep 检查无 gate/checkpoint 段 | 删五目录回退 |
| 2 | facts 子 schema 与 spec 第 6 章 key 不一致 | task 直接引 spec 第 6 章表 | revert contract + 校验脚本 |
| 3 | 扫描器扩展破坏现有三类反模式检测 | 改前跑现有 tests 基线，改后 diff 失败数 | git checkout check-stage-quality.mjs |

## 13. 验证策略

### 四类标准

- [x] **交付标准（done）**：每 phase Goal 写可勾完成定义（五目录各有 SKILL.md / facts 子 schema 校验过正反样例 / 扫描器检出漏接）。
- [x] **异常标准（边界）**：facts={} 或缺 key → 契约判失败；漏接指标 → 扫描器退出码非 0；small 跳步路缺 spec/plan 不报错。
- [x] **测试标准（双栏可跑命令）**：每 phase Verify 段给 gate_cmd（node --test，机器判）+ display_cmd（人眼摘要）。
- [x] **代码标准**：引用 workflowhub 既有 npm run check + lint，lint error 为硬门。

### 验证四字段结构

每 phase Verify 段按 RED→GREEN 两侧 + evidenceSink + affectedTests 预声明（见下方 evidence-contract 块）。gate_cmd 用 `node --test tests/<file>`，evidence_path 用 `$TASK_DIR/apply/evidence/...`。

### Phase 1 证据契约

```evidence-contract
{
  "red": {
    "command": "node --test tests/five-skills-present.test.mjs",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_HEAD_SHA",
    "exit_code": 1,
    "timestamp": "2026-06-24T04:00:00Z",
    "phase": 1,
    "mode": "RED"
  },
  "green": {
    "command": "node --test tests/five-skills-present.test.mjs",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_HEAD_SHA",
    "exit_code": 0,
    "timestamp": "2026-06-24T04:10:00Z",
    "phase": 1,
    "mode": "GREEN"
  },
  "evidenceSink": "apply/evidence/phase-1-RED.json",
  "affectedTests": [
    "tests/five-skills-present.test.mjs"
  ]
}
```

### Phase 2 证据契约

```evidence-contract
{
  "red": {
    "command": "node --test tests/facts-subschema.test.mjs",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_HEAD_SHA",
    "exit_code": 1,
    "timestamp": "2026-06-24T04:20:00Z",
    "phase": 2,
    "mode": "RED"
  },
  "green": {
    "command": "node --test tests/facts-subschema.test.mjs",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_HEAD_SHA",
    "exit_code": 0,
    "timestamp": "2026-06-24T04:30:00Z",
    "phase": 2,
    "mode": "GREEN"
  },
  "evidenceSink": "apply/evidence/phase-2-RED.json",
  "affectedTests": [
    "tests/facts-subschema.test.mjs"
  ]
}
```

### Phase 3 证据契约

```evidence-contract
{
  "red": {
    "command": "node --test tests/metric-scan.test.mjs",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_HEAD_SHA",
    "exit_code": 1,
    "timestamp": "2026-06-24T04:40:00Z",
    "phase": 3,
    "mode": "RED"
  },
  "green": {
    "command": "node --test tests/metric-scan.test.mjs",
    "cwd": "/Users/Hugh/Hugh/Project/workflowhub",
    "git_sha": "PLACEHOLDER_HEAD_SHA",
    "exit_code": 0,
    "timestamp": "2026-06-24T04:50:00Z",
    "phase": 3,
    "mode": "GREEN"
  },
  "evidenceSink": "apply/evidence/phase-3-RED.json",
  "affectedTests": [
    "tests/metric-scan.test.mjs"
  ]
}
```

### 接口签名锚点

见第 11 章 SIG-001~004。

### UI 实现合同

本期不涉及 UI（skill 是提示词，无界面）。

## plan.md 自检（5 条，写完勾选）

- [x] 宪法门禁逐条勾选（含 CLAUDE.md 工程硬规则）—— 见第 2 章。
- [x] 每个 task 引用了至少一个 FR 编号 —— tasks.md 逐 task 标注。
- [x] tasks.md 每个 phase Goal/Files/Tasks/Verify/Knowledge/STOP 六节 —— 见 tasks.md。
- [x] 上游合并安全评估完成 —— 见第 10 章。
- [x] 不适用段已标注 N/A 并写理由 —— 第 4/5 章本期不涉及，UI 合同本期不涉及。
