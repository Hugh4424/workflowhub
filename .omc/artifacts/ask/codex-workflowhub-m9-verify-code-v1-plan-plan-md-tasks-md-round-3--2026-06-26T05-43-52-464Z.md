# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-26T05:43:52.464Z

## Original task

你是独立审查员，对 workflowhub M9 verify-code v1【Plan 阶段】交付物 plan.md+tasks.md 做 ROUND-3 复审。这是第二次返修后复审：round2 你判 revise_required（2个新blocking），作者已修。核实这2个blocking是否真修+扫新问题。客观，不放水。

## round2 你给的 2 个 blocking（逐条核是否真修）
1. CI三段闭环检查修偏:ci-chain-check只覆盖build-code→verify-code两段,漏了make-decision段。作者应补make-decision段产物存在/可读/能接上build-code的检查(仍轻量,不建重型E2E)。
2. C1漏同步build-code SKILL.md:C1要求同步改facts-schema.mjs和SKILL.md两件,作者只改了schema。作者应把build-code SKILL.md纳入文件结构+任务,声明build-code产出facts.tests必须含command字段,并加可证伪验证。
round2非阻断(应已修):total_tasks 19vs18; readCommand(buildResultPath vs buildResult)口径不一; Phase5 Verify的'|| echo'掩盖脚本失败。

## 权威需求
### decision-log.md
```
---
sources:
  - artifacts/intake-original-context.md
created: 2026-06-26T00:00:00+08:00
updated: 2026-06-26T00:00:00+08:00
task_id: m9-verify-code
workflow: vibecoding
stage: intake
approved_by: user
approved_at: "2026-06-26"
---

# Decision Log — m9-verify-code

## 1. 原始需求（原文）

> 任务：把 workflowhub `workflows/verify-code/` 从空骨架做成 v1，打通 make-decision → build-code → verify-code 三段闭环。
>
> 交付仓：/Users/Hugh/Hugh/Project/workflowhub（执行环境=multica-agenthub vibecoding harness，自举，Node22/ESM/vitest）
>
> 上游真相源：roadmap M9 段 + program decision-log（D5/D6/D7/D16/D16a/D17/D21/§8），路径见关键文件节。
>
> M9 是 workflowhub extraction program 五段薄骨架的最后一段。M8 已交付 build-code v1 + 验收事实包（落 specs/{task-id}/stage-result-build-code.json，三键 changed/tests/review）。verify-code 的 SKILL.md 骨架已存在（workflows/verify-code/SKILL.md，64行，无 .mjs 脚本）。M9 主要工作=补 .mjs 脚本 + 接 metrics collector + 抄外部件 + CI。
>
> 目标：fresh verification + 浏览器验收 + 终态收尾 + 按 M10 口径产新基线数据。

用户在 intake 第 5 步对全部七条决策（D-M9-1 ~ D-M9-7）、四条约束（C1~C4）、五条验收标准、范围边界、假设逐条确认，明确批准落盘。

## 2. 问题与目标

**核心问题**：verify-code workflow 只有 64 行空骨架，无可执行 .mjs 脚本，无法完成 fresh 验证、浏览器验收、终态收尾三段动作，导致三段闭环（make-decision → build-code → verify-code）断链。

**用户**：workflowhub extraction program 维护者（M9 是五段薄骨架最后一段）。

**现状**：M8 已交付 build-code v1，事实包落盘；verify-code 骨架存在但空。

**最小切口**：补三个 .mjs 脚本（capture/freshness/facts组装）+ 接 collector + 抄 isolated-browser-qa + CI 冒烟。

**上游真相源**：
- roadmap：`/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md`（M9 段，263-275 行）
- program decision-log：同目录 `decision-log.md`（D5/D6/D7/D16/D16a/D17/D21/§8）
- 本 task 原始上下文：`artifacts/intake-original-context.md`

## 3. 决策记录

### 决策 1（D-M9-1）：fresh 验证 = 重跑测试 + 鲜度校验

- 决策内容：verify-code 自己现跑测试，不读 M8 旧结果；用 capture 采证 + 校验 git_sha==HEAD + freshness
- 理由：历史护栏 C 禁止复用历史 evidence；只有现跑才能保证 verification 的可信度
- 备选项：直接复用 M8 已有测试结果（被否决，违反 fresh verification 原则）
- 来源类型：原文要求
- 来源证据：roadmap M9 段"fresh verification"要求 + 历史护栏 C（不复用历史 evidence）
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 2（D-M9-2）：鲜度校验做成"记 anomaly_flags 不 BLOCK"

- 决策内容：git_sha 不匹配时写 `anomaly_flags:["stale_sha"]` 进 stage-result facts，浮现警告但不 FAIL/不 exit2
- 理由：D5/D7 明确"记事实非 blocking"，agenthub 历史失败根因之一就是鲜度校验做成了 blocking gate 导致死锁
- 备选项：鲜度不匹配直接 FAIL exit2（被否决，违反 D5/D7）
- 来源类型：原文要求
- 来源证据：program decision-log D5（记事实非 blocking）、D7（agenthub 失败根因分析）
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 3（D-M9-3）：测试命令从 build-code 事实包读取

- 决策内容：verify-code 从 `facts.tests.command` 字段读取要执行的测试命令，不硬编码
- 理由：消费事实包是 verify-code 存在的本意，最可溯源；硬编码会导致跨项目不可复用
- 备选项：在 verify-code SKILL.md 硬编码测试命令（被否决，不可溯源）；让用户运行时传参（被否决，增加摩擦）
- 来源类型：衍生
- 来源证据：推导链：M8 已交付 build-code 事实包（三键 changed/tests/review）→ verify-code 消费事实包是设计意图 → tests 字段应含 command 以实现完整消费 → 用户拍板确认此推导
- 用户批准：是
- 批准证据：用户拍板（"消费事实包本意，最可溯源"）

---

### 决策 4（D-M9-4）：浏览器验收抄 isolated-browser-qa + 设计成可选步骤

- 决策内容：将 isolated-browser-qa skill 抄入 workflowhub + 改掉硬编码 agenthub 路径；设计成"可选步骤"——无 UI 验收项则 SKIP 并记 missing_items；M9 自举任务本身无 UI，真跑走 SKIP 分支
- 理由：D16 要求外部件直接放项目内+记源路径；自举任务无 UI 强制跑浏览器验收无意义；SKIP 分支让 v1 适配无 UI 场景
- 备选项：跳过浏览器验收完全不抄（被否决，未来有 UI 任务需要此能力）；强制跑浏览器验收（被否决，自举无 UI 会失败）
- 来源类型：原文要求
- 来源证据：用户拍板 + program decision-log D16（外部件直接放项目内+记源路径）
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 5（D-M9-5）：终态收尾含便宜确认才执行合并/删分支

- 决策内容：执行合并/删分支前一句便宜确认、人点头才做 + 记录（stage-result `user_decision:true` + SKILL.md 明文停顿，不自动越界）
- 理由：合并/删分支是不可逆操作；D6/F7 明确不可逆操作不自动越人界
- 备选项：全自动合并+删分支（被否决，违反 D6/F7）；完全不合并（被否决，无法完成收尾）
- 来源类型：原文要求
- 来源证据：用户拍板 + program decision-log D6（不可逆操作不自动越人界）、F7
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 6（D-M9-6）：stage-result 落盘路径对齐 build-code 约定

- 决策内容：verify-code 的 stage-result 落 `specs/{task-id}/stage-result-verify-code.json`；final-test-report.md 落 `specs/{task-id}/test/`；evidence_ref 相对 `specs/{task-id}/` 根
- 理由：与 M8 build-code 约定对齐，保持一致性，下游消费无需猜路径
- 备选项：自定义路径（被否决，破坏一致性）
- 来源类型：衍生
- 来源证据：推导链：M8 build-code 约定 specs/{task-id}/stage-result-build-code.json → verify-code 同级对齐 → 用户确认
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 7（D-M9-7）：测试策略 = 单测覆盖 3 脚本 + M9 自举端到端

- 决策内容：单测覆盖 3 个关键脚本（capture/freshness/facts组装）；端到端三段闭环靠 M9 自举实跑验证，不堆机器可执行端到端基建
- 理由：F10 明确不为机器可校验性堆基建；M9 自举实跑本身就是最真实的端到端验证
- 备选项：堆完整 E2E 测试框架（被否决，违反 F10，过度工程）
- 来源类型：原文要求
- 来源证据：program decision-log F10（不为机器可校验性堆基建）+ 用户拍板
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

## 4. 假设

- **[ASSUMPTION]** M8 build-code facts.tests 加 command 字段不破坏 M8 已交付物（M8 已合并 main，新增可选字段向后兼容）。
- **[ASSUMPTION]** isolated-browser-qa 抄入后无 UI 走 SKIP 路径能被 M9 自举实跑验证（真跑到 SKIP 分支）。

## 5. 明确不做

- 不把鲜度校验做成 blocking gate（违 D5/D7）。
- 不自动合并/删分支不问人（违 D6）。
- v1 不做 verify-change full 模式（超出 M9 scope）。
- M9 不做 M10 的基线对照工具（只产数据，对照是 M10 的事）。
- 浏览器验收不真实跑 UI（M9 自举任务无 UI，走 SKIP 分支）。

## 6. 开放问题

无。所有决策已由用户明确批准落盘。

## 7. 验收标准

1. **闭环打通**：跑通一次完整验收+收尾（任一步缺失即失败）。
2. **三段闭环**：make-decision → build-code → verify-code 三段全部打通（断链即失败）。
3. **事实包消费**：verify-code 能读 M8 事实包作输入（读不到即失败）。
4. **指标字段对齐**：流程指标字段与 M4 的 10 字段（`execution_id`/`skill_or_stage`/`stage`/`skill_version`/`executed`/`tokens`/`duration_ms`/`rework_rounds`/`human_intervention`/`friction_ref`）映射对齐（不对齐即失败）。
5. **CI 纳入**：CI 包含 verify-code 冒烟 + 三段闭环端到端。

## 8. 约束

- **C1**：M9 顺手改 build-code 侧：facts.tests 加 command 字段 + 同步 build-code SKILL.md / facts schema（跨件小改动，明文登记）。
- **C2**：鲜度校验绝不做成 BLOCK（违 D5）。
- **C3**：合并/删分支=不可逆操作，`user_decision:true` + 明文停顿等人点头，绝不自动越界（D6）。
- **C4**：交付仓 workflowhub，不照搬 agenthub 实现，按 spec 重写（D21）。

## 9. 范围

**范围内**：
- verify-code .mjs 脚本（capture/freshness/facts组装）
- 接 metrics collector
- 抄 isolated-browser-qa + 改掉硬编码 agenthub 路径
- 收尾归档 + 合并便宜确认
- CI 冒烟 + 三段闭环端到端
- build-code 侧加 command 字段（C1）

**范围外**：
- 浏览器验收真实 UI 跑（自举无 UI 走 SKIP）
- M10 基线对照工具（M9 只产数据不做对照）
- verify-change full 模式（v1 只做 light）

## 10. 关键文件

| 文件 | 路径 |
|---|---|
| roadmap 真相源（M9 段 263-275 行） | `/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md` |
| program decision-log（D5/D6/D7/D16/D16a/D17/D21/§8） | `/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/decision-log.md` |
| 本 task 原始上下文 | `artifacts/intake-original-context.md` |
```
### spec.md(已定稿,plan须忠实落实)
```markdown
# 功能规格：verify-code v1

基于 decision-log.md（m9-verify-code）。本文件不可覆盖项目级规则。

**功能名**: `m9-verify-code`
**来源**: decision-log.md M9 verify-code v1（fresh 验证/浏览器验收可选/终态收尾/metrics 接入）
**状态**: 草稿

---

## 速读卡（30 秒看懂这个需求）

**一句话需求**：让 verify-code skill 能独立执行"验收"段——fresh 重跑测试、鲜度校验仅记 anomaly 不 BLOCK、浏览器验收可选跳过、终态合并需人确认、metrics 接 M4 collector。

**核心改动点**：
- 从空骨架（64 行 SKILL.md）补三个 .mjs 脚本（capture / freshness / facts 组装）
- 测试命令从 build-code 事实包 facts.tests.command 读取，不硬编码
- 鲜度校验：git_sha 不匹配仅写 anomaly_flags 警告，绝不 FAIL / exit2
- isolated-browser-qa 抄入 workflowhub 并去除硬编码 agenthub 路径；无 UI 验收项时 SKIP 并记 missing_items
- 终态合并/删分支需 user_decision:true + 明文停顿等人点头，不自动越界
- stage-result 落 specs/{task-id}/stage-result-verify-code.json；M4 metrics 双写 task + global

**最大影响面**：workflowhub workflows/verify-code/ — 由空骨架升为 v1 可用 skill；build-code facts.tests 加 command 字段（C1 同步）

**验收信号**：完整跑通一次验收+收尾闭环（含三段连接：make-decision → build-code → verify-code）；事实包可读；metrics 字段对齐 M4。

---

## 1. 目标与背景

verify-code 是 workflowhub extraction program 五段薄骨架的最后一段（M9）。M8 已交付 build-code v1，产出验收事实包（`specs/{task-id}/stage-result-build-code.json`，含三键 changed/tests/review）。verify-code 的 SKILL.md 骨架已存在但无可执行 .mjs 脚本，导致三段闭环断链。

M9 最小切口：补三个 .mjs 脚本 + 接 collector + 抄 isolated-browser-qa + CI 冒烟，打通 make-decision → build-code → verify-code 完整闭环。

v1 = light 模式，不含 verify-change full 模式。

---

## 2. 词汇表

- **事实包**：build-code 产出的 `stage-result-build-code.json`，verify-code 以此为输入。
- **stage-result**：verify-code 执行完毕后写入 `specs/{task-id}/stage-result-verify-code.json` 的结构化记录，含 status / error_code / retryable / facts / missing_items / user_decision / reason 七个顶层键。
- **anomaly_flags**：stage-result facts 内的警告列表，仅记录 / 浮现，不触发 FAIL。
- **fresh 验证**：verify-code 自己现跑测试，不复用 M8 旧结果。
- **鲜度校验**：比对 verify-code 采集的 git_sha 与 HEAD，不匹配时写 `stale_sha` 至 anomaly_flags。
- **SKIP 分支**：无 UI 验收项时浏览器验收不执行，missing_items 记录该项。
- **user_decision**：stage-result 中布尔键，`true` 表示该步骤在执行前已获得人工确认（用于合并/删分支收尾）。
- **collector**：`metrics/collector.mjs`，M4 metrics 底座，提供 recordSkeleton / updateOwnResult / collectFacts / updateStageImpact 四个接口。

---

## 3. 用户场景

> 正常路径、失败路径、边界路径均覆盖，≥8 条。

**场景 3.1（正常）fresh 测试通过**

给定：build-code 已产出事实包，facts.tests.command 有效，当前 HEAD git_sha 与 M8 执行时一致。
当：verify-code 从事实包读取 command 并执行测试。
那么：测试全部通过，stage-result facts.verdict=pass，facts.evidence_ref 指向 final-test-report.md，anomaly_flags 为空。

**场景 3.2（正常）鲜度警告不阻断**

给定：build-code 事实包中记录的 git_sha 与当前 HEAD 不同（有新提交）。
当：verify-code 完成 fresh 测试并做鲜度校验。
那么：stage-result facts.anomaly_flags 含 "stale_sha"，测试依然跑完，verdict 由测试结果决定，不因 stale_sha 置 FAIL / status="failure"。

**场景 3.3（正常）浏览器验收 SKIP**

给定：当前 task 无 UI 验收项（M9 自举任务）。
当：verify-code 进入浏览器验收步骤。
那么：SKIP 分支触发，stage-result missing_items 记录"browser-acceptance: no UI acceptance items"，不调用 isolated-browser-qa，不阻断后续收尾。

**场景 3.4（正常）终态收尾人工确认**

给定：测试通过，用户在 SKILL.md 明文停顿处点头确认合并/删分支。
当：收尾执行合并和删分支。
那么：stage-result user_decision=true，合并与删分支均已完成，reason 记录操作结果。

**场景 3.5（失败）测试命令缺失**

给定：build-code 事实包 facts.tests 缺少 command 字段（M8 旧版本或 C1 未同步）。
当：verify-code 尝试读取测试命令。
那么：stage-result status="failure"，error_code 描述 command 字段缺失，retryable=true，浮现明确错误，不静默跳过。

**场景 3.6（失败）测试跑失败**

给定：facts.tests.command 有效，但当前代码测试有失败用例。
当：verify-code 执行测试。
那么：stage-result facts.verdict=fail，final-test-report.md 中逐条列出失败的测试用例，status="failure"。注：此场景 missing_items 为空（missing_items 记录的是"跳过未执行的验收项"，如浏览器验收 SKIP；测试本身跑了但失败，不属于 missing_items 范畴，二者语义不同）。

**场景 3.7（边界）用户拒绝合并**

给定：测试通过，verify-code 在 SKILL.md 明文停顿处等待确认。
当：用户拒绝合并（不点头）。
那么：合并/删分支不执行，stage-result user_decision=false，skill 终止并记录用户拒绝原因，不自动越界。

**场景 3.8（边界）build-code 事实包完整消费**

给定：M8 事实包含三键 changed/tests/review，tests.command 已有效（C1 同步后）。
当：verify-code 读取事实包。
那么：三键均可读取，verify-code 无需额外转换即可消费 facts.tests.command 和 facts.review.verdict。

**场景 3.9（边界）metrics 双写**

给定：collector 配置指向 task-level 和 global metrics 路径。
当：verify-code 完成一次完整执行（recordSkeleton → updateOwnResult）。
那么：task-metrics.jsonl 和全局 .jsonl 均写入含全部 10 个核心字段的记录，缺任一字段即判失败。

**场景 3.10（边界）浏览器验收有 UI 项**

给定：task 有 UI 验收项（非 M9 自举，未来有 UI 的 task）。
当：verify-code 进入浏览器验收步骤。
那么：调用 isolated-browser-qa（workflowhub 本地副本，已去除 agenthub 硬编码路径），结果写入 stage-result，SKIP 分支不触发。

---

## 4. 功能需求

> 每条标来源（D-M9-x / Cx / Dx），可追溯回 decision-log。

### FR-FRESH（fresh 验证 + 鲜度校验）

**FR-FRESH-001** 现跑测试不复用历史结果（来源：D-M9-1）
verify-code 必须自己执行测试命令，不读取 M8 stage-result-build-code.json 中已有的测试结果作为本次验收证据。每次 verify-code 执行均产出新的 capture 证据。

**FR-FRESH-002** 采集 git_sha 并与 HEAD 比对（来源：D-M9-1；实现建议沿用既有约定）
verify-code 执行时通过 capture 脚本采集当前 HEAD git_sha，与 build-code 事实包（stage-result-build-code.json）中记录的 git_sha 比对，结果写入 stage-result facts。注：比对对象为"capture 时的 HEAD"与"M8 事实包记录的 git_sha"，是 freshness 的操作定义，属实现约定而非 decision-log 明文要求。

**FR-FRESH-003** 鲜度不匹配仅记 anomaly_flags 不 FAIL（来源：D-M9-2，C2，D5/D7）
git_sha 不匹配时，stage-result facts.anomaly_flags 写入 "stale_sha"，同时在 skill 执行边界输出可见警告。绝不因 stale_sha 置 status="failure"、绝不 exit2、绝不把鲜度校验做成 blocking gate。

**FR-FRESH-004** anomaly_flags 浮现可观测（来源：D-M9-2，D5）
当 anomaly_flags 非空时，skill 执行边界必须有可见输出（非静默）。anomaly_flags 存在但无任何输出即视为验收失败。

### FR-CMD（测试命令读取）

**FR-CMD-001** 从事实包读取 command 字段（来源：D-M9-3，C1）
verify-code 从 `specs/{task-id}/stage-result-build-code.json` 的 facts.tests.command 字段读取测试命令，不在 verify-code 侧硬编码任何命令。

**FR-CMD-002** command 字段缺失时浮现明确错误（来源：D-M9-3）
若 facts.tests.command 字段不存在或为空，stage-result status="failure"，error_code 描述缺失原因，retryable=true，不静默跳过也不使用任何回退默认命令。

**FR-CMD-003** build-code facts.tests 加 command 字段（来源：C1）
作为 M9 同步改动，build-code 侧 `workflows/build-code/facts-schema.mjs` 及对应 SKILL.md 需在 facts.tests 中新增 command 字段。新增字段向后兼容，不破坏已有 changed/tests/review 三键的消费方。

### FR-BROWSER（浏览器验收可选）

**FR-BROWSER-001** isolated-browser-qa 抄入 workflowhub 并去除 agenthub 硬编码路径（来源：D-M9-4，D16）
将 isolated-browser-qa skill 的提示词文件（SKILL.md）复制至 workflowhub 本地（`workflows/verify-code/isolated-browser-qa.md`），改掉所有硬编码 agenthub 路径，使其可在任意项目 repo 下调用。v1 只复制 SKILL.md 一个文件；若原 skill 含脚本或其他运行时依赖，须在实现时确认无额外依赖（按 F8 简单优先）。来源路径在 reuse-registry.md 中登记（D16）。

**FR-BROWSER-002** 无 UI 验收项时走 SKIP 分支（来源：D-M9-4）
当 task 无 UI 验收项时，verify-code 不调用 isolated-browser-qa，stage-result missing_items 中记录"browser-acceptance: no UI acceptance items"，不以缺少浏览器验收为由置 status="failure"。

**FR-BROWSER-003** SKIP 分支不阻断后续收尾（来源：D-M9-4）
浏览器验收走 SKIP 分支后，verify-code 正常进入收尾步骤，M9 自举真跑时 SKIP 分支可被观察到。

### FR-CLOSE（终态收尾）

**FR-CLOSE-001** 合并/删分支前必须获得人工确认（来源：D-M9-5，C3，D6）
收尾步骤在合并和删分支之前，SKILL.md 中必须有明文停顿（文字描述说明等待原因），skill 等待用户确认后才执行。不自动执行合并/删分支。

**FR-CLOSE-002** user_decision:true 标记（来源：D-M9-5，C3）
用户确认后执行合并/删分支，stage-result user_decision=true。用户拒绝时 user_decision=false，合并/删分支不执行，skill 正常终止并记录原因。

**FR-CLOSE-003** 收尾动作不可逆性浮现（来源：D-M9-5，D6）
SKILL.md 明文停顿处需列出将要执行的不可逆动作清单（合并目标分支/删除 feature 分支），使用户在确认前可见操作内容。

### FR-PATH（落盘路径）

**FR-PATH-001** stage-result 落 specs/{task-id}/（来源：D-M9-6）
verify-code 的 stage-result 写入 `specs/{task-id}/stage-result-verify-code.json`，与 build-code 的 `specs/{task-id}/stage-result-build-code.json` 同级。

**FR-PATH-002** final-test-report.md 落 specs/{task-id}/test/（来源：D-M9-6）
测试报告写入 `specs/{task-id}/test/final-test-report.md`。

**FR-PATH-003** evidence_ref 相对 specs/{task-id}/ 根（来源：D-M9-6）
stage-result facts.evidence_ref 为相对 `specs/{task-id}/` 根的相对路径（如 `test/final-test-report.md`），不使用绝对路径，不使用相对 repo 根的路径。

### FR-METRICS（M4 metrics 接入）

**FR-METRICS-001** recordSkeleton 在 stage 开始时调用（来源：D-M9-7，M4 collector 契约）
verify-code 启动时调用 `metrics/collector.mjs` 的 recordSkeleton，传入含全部 10 个核心字段的 seed（execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）。

**FR-METRICS-002** updateOwnResult 在 stage 结束时调用（来源：D-M9-7，M4 collector 契约）
verify-code 执行完毕（success 或 failure）后调用 updateOwnResult，更新 executed / tokens / duration_ms 等字段。不手写原始 jsonl 行。

**FR-METRICS-003** 双写 task-level + global（来源：M4 FR-COLLECT-006/007）
metrics 记录同时写入 task-level `task-metrics.jsonl` 和全局 metrics 路径，记录含 task_id / project 四标识符。

**FR-METRICS-004** 10 个核心字段全部结构性存在（来源：验收标准 4，record-schema.mjs）
每条 metrics 记录必须包含 record-schema.mjs 定义的全部 10 个核心字段（execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）作为键，缺任一键即判失败。

### FR-TEST（测试策略）

**FR-TEST-001** 三个关键脚本有单元测试覆盖（来源：D-M9-7）
capture 脚本、freshness 脚本、facts 组装脚本各有对应单元测试，覆盖正常路径和关键边界（command 缺失、sha 不匹配、anomaly_flags 非空）。

**FR-TEST-002** M9 自举端到端实跑（来源：D-M9-7）
M9 的三段闭环（make-decision → build-code → verify-code）通过 M9 自举任务实跑验证，不堆额外 E2E 框架。自举实跑走完整验收+收尾一次为验收依据。

**FR-TEST-003** CI 纳入 verify-code 冒烟 + 轻量三段闭环检查（来源：验收标准 5）
CI 配置包含两部分：
1. **verify-code 冒烟**：覆盖 capture / freshness / facts 组装三个脚本的单元测试（vitest）；
2. **轻量三段闭环检查**：CI 跑一个最小验证脚本，串起 make-decision → build-code → verify-code 三段产物链，检查 stage-result-build-code.json 可被读取（facts.tests.command 字段存在）、verify-code stage-result 落盘路径贯通。该检查不引入重型 E2E 基建，不模拟完整 UI 流程（按 D-M9-7/F10），只做产物链路贯通的结构性验证。CI 全部绿才视为交付完整。

### FR-REG（reuse-registry 登记）

**FR-REG-001** isolated-browser-qa 引入必须登记（来源：D-M9-4，D16）
将 isolated-browser-qa 抄入 workflowhub 后，在 reuse-registry.md 中登记：复用类别（改造适配）+ 来源路径（原 agenthub 路径）。引入未登记视为验收缺口。

---

## 5. 验收清单

> 承接 decision-log §7 五条可执行验收，每条可手动或命令验证。

- [ ] **验收 1 — 完整闭环跑通**：M9 自举任务跑完一次完整验收+收尾（fresh 测试跑通 → anomaly_flags 检查 → 浏览器验收 SKIP → 人工确认 → 合并/删分支）。任一环节缺失或静默跳过即失败。（来源：验收标准 1，D-M9-1/2/4/5）

- [ ] **验收 2 — 三段闭环连接**：make-decision → build-code → verify-code 三段全部打通，verify-code 成功读取 build-code 产出的 stage-result-build-code.json。三段任一断链即失败。（来源：验收标准 2）

- [ ] **验收 3 — 事实包消费**：verify-code 从 facts.tests.command 读取测试命令并执行（C1 同步后）。command 字段缺失时浮现明确错误而非静默跳过。stage-result facts.verdict 和 evidence_ref 均有效。（来源：验收标准 3，D-M9-3，C1，FR-CMD-001/002）

- [ ] **验收 4 — metrics 字段对齐**：task-metrics.jsonl 中含 verify-code 执行记录，全部 10 个核心字段（execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）均作为键存在，缺任一键即失败。（来源：验收标准 4，FR-METRICS-004）

- [ ] **验收 5 — CI 纳入**：CI 包含 verify-code 冒烟（capture / freshness / facts 组装单元测试）+ 轻量三段闭环检查（结构性验证 make-decision → build-code → verify-code 产物链路贯通，不引入重型 E2E 框架，见 FR-TEST-003 和 D-M9-7/F10 说明），CI 全部通过后视为交付完整。（来源：验收标准 5，FR-TEST-003）

---

## 6. 关键实体

**stage-result（verify-code 产出）**（来源：D-M9-6 落盘路径约定；七键结构沿用 build-code 既有 stage-result 约定，属实现契约而非 decision-log 明文 schema）：

- `status`：success | failure
- `error_code`：失败原因描述（success 时为空字符串）
- `retryable`：布尔，command 缺失等可重试类错误为 true
- `facts`：验收事实对象
  - `verdict`：pass | fail（由测试结果决定，非鲜度）
  - `evidence_ref`：相对 `specs/{task-id}/` 根的 final-test-report.md 路径
  - `anomaly_flags`：警告列表，目前定义值为 "stale_sha"；空列表表示无异常
- `missing_items`：未执行验收项清单（如浏览器验收 SKIP 时记录；测试跑了但失败不属于此字段范畴）
- `user_decision`：布尔，合并/删分支前人工确认结果
- `reason`：人可读的结论描述

**build-code 事实包中 verify-code 消费的字段**：

- `facts.tests.command`：verify-code 执行的测试命令（C1 新增字段，原有 red_exit_code / green_baseline_hash 等字段不变）
- `facts.review.verdict`：M8 审查结论（verify-code 可用于报告，非执行依据）

**M4 metrics 核心字段（10 个）**：execution_id、skill_or_stage、stage、skill_version、executed、tokens、duration_ms、rework_rounds、human_intervention、friction_ref（定义见 `metrics/record-schema.mjs`）。

---

## 7. 数据和生命周期

- **数据粒度**：以一次 verify-code skill 执行（单任务验收）为单位，产出一份 stage-result + 一份 final-test-report.md。
- **数据时效**：stage-result 在 skill 执行结束时落 durable，之后不变更（只读）。
- **补传策略**：若中途失败，已采集的部分事实写入 stage-result，失败原因浮现，不覆盖已有报告。
- **当前 vs 历史**：stage-result 落固定路径 `specs/{task-id}/stage-result-verify-code.json`，同一 task 重跑（rerun）会覆盖前次结果；不同 task 靠 task-id 目录自然隔离。如需保留历史快照，调用方在 rerun 前自行备份，verify-code 本身不做多版本管理。
- **metrics 生命周期**：recordSkeleton 在 stage 开始即写入（metrics 写失败只 warn 不 throw，继承 M4 metrics collector 的写失败保护语义，对齐 CONSTITUTION F3/Q1 记事实非 blocking）；updateOwnResult 在 stage 结束补全；任何一次写失败不阻断 skill 主流程。

---

## 8. 兼容性预留

- **facts.tests.command 向后兼容**：C1 在 build-code 侧新增 command 字段属于追加，已有 red_exit_code / green_baseline_hash 等字段语义不变，现有消费方不受影响。
- **anomaly_flags 扩展预留**：当前定义值仅 "stale_sha"，未来可追加新值，已有消费方按已知值处理即可，不识别的值视为告知性警告。
- **stage-result 契约预留**：verify-code stage-result 的 facts 结构 design 只加不删，M10 可在 facts 下追加新键，不破坏现有字段语义。
- **浏览器验收路径预留**：isolated-browser-qa 以 SKIP 分支兼容无 UI 场景，未来有 UI task 可直接走执行分支，不需修改 verify-code 主流程。

---

## 9. 不做和隐性必达

### 明确不做（来源：decision-log §5）

- 不复用 M8 已有测试结果作为本次验收证据（D-M9-1，fresh verification 原则）
- 不把鲜度校验做成 BLOCK / exit2（违 D5/D7，agenthub 历史失败根因）
- 不自动合并/删分支不问人（违 D6）
- v1 不做 verify-change full 模式（超出 M9 scope）
- 不做 M10 基线对照工具（M9 只产数据，对照是 M10 的事）
- 浏览器验收不真实跑 UI（M9 自举任务无 UI，走 SKIP 分支）
- 不照搬 agenthub 实现（C4，D21：按 spec 重写）

### 隐性必达

- anomaly_flags 非空时 skill 执行边界必须有可见输出，不得静默
- stage-result 落 durable 路径，skill 进程结束后仍可读
- command 字段缺失时浮现明确 error_code，不静默回退默认命令
- user_decision:false 时合并/删分支绝不执行
- isolated-browser-qa 抄入后所有 agenthub 硬编码路径必须替换，在 reuse-registry.md 登记来源
- metrics 写失败只 warn 不 throw，不阻断 skill 主流程（继承 M4 metrics collector 写失败保护语义，对齐 CONSTITUTION F3/Q1）

---

## 10. 验收清单及未决问题

### 验收检查

- [ ] 本 spec 共 24 条 FR（FR-FRESH 4 + FR-CMD 3 + FR-BROWSER 3 + FR-CLOSE 3 + FR-PATH 3 + FR-METRICS 4 + FR-TEST 3 + FR-REG 1 = 24），每条 FR 可追溯回 decision-log.md 来源字段
- [ ] 与 decision-log.md（m9-verify-code）一致，每条 FR 可追溯回来源字段
- [ ] 用户场景覆盖正常（3.1/3.2/3.3/3.4）、失败（3.5/3.6）、边界（3.7/3.8/3.9/3.10）路径，≥8 条
- [ ] 含至少两条失败场景（3.5 command 缺失、3.6 测试失败）
- [ ] 含至少三条边界场景（3.7 用户拒绝、3.8 事实包消费、3.9 metrics 双写、3.10 有 UI 项）
- [ ] A 档五章齐全（场景 / FR / 不做 / 验收 / 影响范围）
- [ ] 验收条目可手动或命令验证
- [ ] 不含绝对文件路径、TypeScript/JS interface 定义、shell 命令块作为需求
- [ ] 业务影响范围已写第 11 章

### 未决问题和风险

无。所有七条决策（D-M9-1 ~ D-M9-7）、四条约束（C1~C4）、五条验收标准均由用户在 intake 第 5 步明确批准落盘，无开放问题。

---

## 11. 影响范围（业务性质）

- **受影响功能：verify-code skill**
  - 既有行为：64 行空骨架（SKILL.md），无 .mjs 脚本，不可运行
  - 本需求影响：升为 v1 可运行 skill，覆盖 fresh 验证/鲜度警告/浏览器验收可选/终态收尾/metrics 接入五大能力
  - 回归要点：原有骨架定义的接口（stage-result 结构、M4 metrics 字段契约）不被破坏

- **受影响功能：build-code facts.tests（C1 同步）**
  - 既有行为：facts.tests 含 red_exit_code / green_baseline_hash 等字段，无 command 字段
  - 本需求影响：新增 command 字段（向后兼容追加），同步更新 build-code 侧 facts-schema.mjs 和 SKILL.md
  - 回归要点：已有 changed/tests/review 三键消费方不受影响；M8 已合并 main，新增字段属可选扩展

- **受影响功能：三段闭环（make-decision → build-code → verify-code）**
  - 既有行为：make-decision（M7）和 build-code（M8）已交付，verify-code 断链
  - 本需求影响：verify-code 接入后三段全部打通，闭环首次可运行
  - 回归要点：make-decision 和 build-code 内部逻辑不被 M9 修改；三段之间仅通过 stage-result JSON 文件传递数据

- **受影响功能：isolated-browser-qa（抄入改造）**
  - 既有行为：isolated-browser-qa 存在于 agenthub 路径，含硬编码 agenthub 路径
  - 本需求影响：复制至 workflowhub 本地，去除 agenthub 硬编码路径；reuse-registry.md 新增条目
  - 回归要点：agenthub 原件不被修改；workflowhub 本地副本仅供 verify-code 消费；SKIP 分支确保无 UI task 不受影响

- **受影响功能：M4 metrics 底座（collector.mjs）**
  - 既有行为：collector.mjs 已交付，现有消费方（make-decision/build-code）正常使用
  - 本需求影响：verify-code 首次在 stage 5 接入 collector，不修改 collector.mjs 本身
  - 回归要点：collector.mjs 不被修改；现有消费方不受影响；metrics 写失败只 warn 不 throw 保护 skill 主流程（对齐 CONSTITUTION F3/Q1）

- **可能受冲击的业务规则**：D5（记事实非 blocking）和 D6（不可逆操作不越人界）是本需求核心约束，任何实现不得把 anomaly_flags 升级为 FAIL，不得跳过 user_decision 确认步骤

- **明确无影响**：design/plan 上游 workflow 内部逻辑；Multica web/mobile/desktop 前端；agenthub harness / gate 执行框架内部（verify-code 走 agenthub vibecoding harness 自举执行，不修改 harness）

---

> 本 spec 基于 decision-log.md（m9-verify-code）所有已批准决策撰写。七条决策、四条约束、五条验收标准均有 FR 对应追溯。
```
## 被审对象1: 修订后 plan.md
```markdown
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
```
## 被审对象2: 修订后 tasks.md
```markdown
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
```

## 输出
逐条核round2的2个blocking+3个非阻断是否真修(修了/没修/修偏)+有无新引入问题。给 verdict: pass/revise_required/escalate_to_human。仍有blocking指明file:section+违反需求。如全修无新blocking请明确给pass。

## Final prompt

你是独立审查员，对 workflowhub M9 verify-code v1【Plan 阶段】交付物 plan.md+tasks.md 做 ROUND-3 复审。这是第二次返修后复审：round2 你判 revise_required（2个新blocking），作者已修。核实这2个blocking是否真修+扫新问题。客观，不放水。

## round2 你给的 2 个 blocking（逐条核是否真修）
1. CI三段闭环检查修偏:ci-chain-check只覆盖build-code→verify-code两段,漏了make-decision段。作者应补make-decision段产物存在/可读/能接上build-code的检查(仍轻量,不建重型E2E)。
2. C1漏同步build-code SKILL.md:C1要求同步改facts-schema.mjs和SKILL.md两件,作者只改了schema。作者应把build-code SKILL.md纳入文件结构+任务,声明build-code产出facts.tests必须含command字段,并加可证伪验证。
round2非阻断(应已修):total_tasks 19vs18; readCommand(buildResultPath vs buildResult)口径不一; Phase5 Verify的'|| echo'掩盖脚本失败。

## 权威需求
### decision-log.md
```
---
sources:
  - artifacts/intake-original-context.md
created: 2026-06-26T00:00:00+08:00
updated: 2026-06-26T00:00:00+08:00
task_id: m9-verify-code
workflow: vibecoding
stage: intake
approved_by: user
approved_at: "2026-06-26"
---

# Decision Log — m9-verify-code

## 1. 原始需求（原文）

> 任务：把 workflowhub `workflows/verify-code/` 从空骨架做成 v1，打通 make-decision → build-code → verify-code 三段闭环。
>
> 交付仓：/Users/Hugh/Hugh/Project/workflowhub（执行环境=multica-agenthub vibecoding harness，自举，Node22/ESM/vitest）
>
> 上游真相源：roadmap M9 段 + program decision-log（D5/D6/D7/D16/D16a/D17/D21/§8），路径见关键文件节。
>
> M9 是 workflowhub extraction program 五段薄骨架的最后一段。M8 已交付 build-code v1 + 验收事实包（落 specs/{task-id}/stage-result-build-code.json，三键 changed/tests/review）。verify-code 的 SKILL.md 骨架已存在（workflows/verify-code/SKILL.md，64行，无 .mjs 脚本）。M9 主要工作=补 .mjs 脚本 + 接 metrics collector + 抄外部件 + CI。
>
> 目标：fresh verification + 浏览器验收 + 终态收尾 + 按 M10 口径产新基线数据。

用户在 intake 第 5 步对全部七条决策（D-M9-1 ~ D-M9-7）、四条约束（C1~C4）、五条验收标准、范围边界、假设逐条确认，明确批准落盘。

## 2. 问题与目标

**核心问题**：verify-code workflow 只有 64 行空骨架，无可执行 .mjs 脚本，无法完成 fresh 验证、浏览器验收、终态收尾三段动作，导致三段闭环（make-decision → build-code → verify-code）断链。

**用户**：workflowhub extraction program 维护者（M9 是五段薄骨架最后一段）。

**现状**：M8 已交付 build-code v1，事实包落盘；verify-code 骨架存在但空。

**最小切口**：补三个 .mjs 脚本（capture/freshness/facts组装）+ 接 collector + 抄 isolated-browser-qa + CI 冒烟。

**上游真相源**：
- roadmap：`/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md`（M9 段，263-275 行）
- program decision-log：同目录 `decision-log.md`（D5/D6/D7/D16/D16a/D17/D21/§8）
- 本 task 原始上下文：`artifacts/intake-original-context.md`

## 3. 决策记录

### 决策 1（D-M9-1）：fresh 验证 = 重跑测试 + 鲜度校验

- 决策内容：verify-code 自己现跑测试，不读 M8 旧结果；用 capture 采证 + 校验 git_sha==HEAD + freshness
- 理由：历史护栏 C 禁止复用历史 evidence；只有现跑才能保证 verification 的可信度
- 备选项：直接复用 M8 已有测试结果（被否决，违反 fresh verification 原则）
- 来源类型：原文要求
- 来源证据：roadmap M9 段"fresh verification"要求 + 历史护栏 C（不复用历史 evidence）
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 2（D-M9-2）：鲜度校验做成"记 anomaly_flags 不 BLOCK"

- 决策内容：git_sha 不匹配时写 `anomaly_flags:["stale_sha"]` 进 stage-result facts，浮现警告但不 FAIL/不 exit2
- 理由：D5/D7 明确"记事实非 blocking"，agenthub 历史失败根因之一就是鲜度校验做成了 blocking gate 导致死锁
- 备选项：鲜度不匹配直接 FAIL exit2（被否决，违反 D5/D7）
- 来源类型：原文要求
- 来源证据：program decision-log D5（记事实非 blocking）、D7（agenthub 失败根因分析）
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 3（D-M9-3）：测试命令从 build-code 事实包读取

- 决策内容：verify-code 从 `facts.tests.command` 字段读取要执行的测试命令，不硬编码
- 理由：消费事实包是 verify-code 存在的本意，最可溯源；硬编码会导致跨项目不可复用
- 备选项：在 verify-code SKILL.md 硬编码测试命令（被否决，不可溯源）；让用户运行时传参（被否决，增加摩擦）
- 来源类型：衍生
- 来源证据：推导链：M8 已交付 build-code 事实包（三键 changed/tests/review）→ verify-code 消费事实包是设计意图 → tests 字段应含 command 以实现完整消费 → 用户拍板确认此推导
- 用户批准：是
- 批准证据：用户拍板（"消费事实包本意，最可溯源"）

---

### 决策 4（D-M9-4）：浏览器验收抄 isolated-browser-qa + 设计成可选步骤

- 决策内容：将 isolated-browser-qa skill 抄入 workflowhub + 改掉硬编码 agenthub 路径；设计成"可选步骤"——无 UI 验收项则 SKIP 并记 missing_items；M9 自举任务本身无 UI，真跑走 SKIP 分支
- 理由：D16 要求外部件直接放项目内+记源路径；自举任务无 UI 强制跑浏览器验收无意义；SKIP 分支让 v1 适配无 UI 场景
- 备选项：跳过浏览器验收完全不抄（被否决，未来有 UI 任务需要此能力）；强制跑浏览器验收（被否决，自举无 UI 会失败）
- 来源类型：原文要求
- 来源证据：用户拍板 + program decision-log D16（外部件直接放项目内+记源路径）
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 5（D-M9-5）：终态收尾含便宜确认才执行合并/删分支

- 决策内容：执行合并/删分支前一句便宜确认、人点头才做 + 记录（stage-result `user_decision:true` + SKILL.md 明文停顿，不自动越界）
- 理由：合并/删分支是不可逆操作；D6/F7 明确不可逆操作不自动越人界
- 备选项：全自动合并+删分支（被否决，违反 D6/F7）；完全不合并（被否决，无法完成收尾）
- 来源类型：原文要求
- 来源证据：用户拍板 + program decision-log D6（不可逆操作不自动越人界）、F7
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 6（D-M9-6）：stage-result 落盘路径对齐 build-code 约定

- 决策内容：verify-code 的 stage-result 落 `specs/{task-id}/stage-result-verify-code.json`；final-test-report.md 落 `specs/{task-id}/test/`；evidence_ref 相对 `specs/{task-id}/` 根
- 理由：与 M8 build-code 约定对齐，保持一致性，下游消费无需猜路径
- 备选项：自定义路径（被否决，破坏一致性）
- 来源类型：衍生
- 来源证据：推导链：M8 build-code 约定 specs/{task-id}/stage-result-build-code.json → verify-code 同级对齐 → 用户确认
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 7（D-M9-7）：测试策略 = 单测覆盖 3 脚本 + M9 自举端到端

- 决策内容：单测覆盖 3 个关键脚本（capture/freshness/facts组装）；端到端三段闭环靠 M9 自举实跑验证，不堆机器可执行端到端基建
- 理由：F10 明确不为机器可校验性堆基建；M9 自举实跑本身就是最真实的端到端验证
- 备选项：堆完整 E2E 测试框架（被否决，违反 F10，过度工程）
- 来源类型：原文要求
- 来源证据：program decision-log F10（不为机器可校验性堆基建）+ 用户拍板
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

## 4. 假设

- **[ASSUMPTION]** M8 build-code facts.tests 加 command 字段不破坏 M8 已交付物（M8 已合并 main，新增可选字段向后兼容）。
- **[ASSUMPTION]** isolated-browser-qa 抄入后无 UI 走 SKIP 路径能被 M9 自举实跑验证（真跑到 SKIP 分支）。

## 5. 明确不做

- 不把鲜度校验做成 blocking gate（违 D5/D7）。
- 不自动合并/删分支不问人（违 D6）。
- v1 不做 verify-change full 模式（超出 M9 scope）。
- M9 不做 M10 的基线对照工具（只产数据，对照是 M10 的事）。
- 浏览器验收不真实跑 UI（M9 自举任务无 UI，走 SKIP 分支）。

## 6. 开放问题

无。所有决策已由用户明确批准落盘。

## 7. 验收标准

1. **闭环打通**：跑通一次完整验收+收尾（任一步缺失即失败）。
2. **三段闭环**：make-decision → build-code → verify-code 三段全部打通（断链即失败）。
3. **事实包消费**：verify-code 能读 M8 事实包作输入（读不到即失败）。
4. **指标字段对齐**：流程指标字段与 M4 的 10 字段（`execution_id`/`skill_or_stage`/`stage`/`skill_version`/`executed`/`tokens`/`duration_ms`/`rework_rounds`/`human_intervention`/`friction_ref`）映射对齐（不对齐即失败）。
5. **CI 纳入**：CI 包含 verify-code 冒烟 + 三段闭环端到端。

## 8. 约束

- **C1**：M9 顺手改 build-code 侧：facts.tests 加 command 字段 + 同步 build-code SKILL.md / facts schema（跨件小改动，明文登记）。
- **C2**：鲜度校验绝不做成 BLOCK（违 D5）。
- **C3**：合并/删分支=不可逆操作，`user_decision:true` + 明文停顿等人点头，绝不自动越界（D6）。
- **C4**：交付仓 workflowhub，不照搬 agenthub 实现，按 spec 重写（D21）。

## 9. 范围

**范围内**：
- verify-code .mjs 脚本（capture/freshness/facts组装）
- 接 metrics collector
- 抄 isolated-browser-qa + 改掉硬编码 agenthub 路径
- 收尾归档 + 合并便宜确认
- CI 冒烟 + 三段闭环端到端
- build-code 侧加 command 字段（C1）

**范围外**：
- 浏览器验收真实 UI 跑（自举无 UI 走 SKIP）
- M10 基线对照工具（M9 只产数据不做对照）
- verify-change full 模式（v1 只做 light）

## 10. 关键文件

| 文件 | 路径 |
|---|---|
| roadmap 真相源（M9 段 263-275 行） | `/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md` |
| program decision-log（D5/D6/D7/D16/D16a/D17/D21/§8） | `/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/decision-log.md` |
| 本 task 原始上下文 | `artifacts/intake-original-context.md` |
```
### spec.md(已定稿,plan须忠实落实)
```markdown
# 功能规格：verify-code v1

基于 decision-log.md（m9-verify-code）。本文件不可覆盖项目级规则。

**功能名**: `m9-verify-code`
**来源**: decision-log.md M9 verify-code v1（fresh 验证/浏览器验收可选/终态收尾/metrics 接入）
**状态**: 草稿

---

## 速读卡（30 秒看懂这个需求）

**一句话需求**：让 verify-code skill 能独立执行"验收"段——fresh 重跑测试、鲜度校验仅记 anomaly 不 BLOCK、浏览器验收可选跳过、终态合并需人确认、metrics 接 M4 collector。

**核心改动点**：
- 从空骨架（64 行 SKILL.md）补三个 .mjs 脚本（capture / freshness / facts 组装）
- 测试命令从 build-code 事实包 facts.tests.command 读取，不硬编码
- 鲜度校验：git_sha 不匹配仅写 anomaly_flags 警告，绝不 FAIL / exit2
- isolated-browser-qa 抄入 workflowhub 并去除硬编码 agenthub 路径；无 UI 验收项时 SKIP 并记 missing_items
- 终态合并/删分支需 user_decision:true + 明文停顿等人点头，不自动越界
- stage-result 落 specs/{task-id}/stage-result-verify-code.json；M4 metrics 双写 task + global

**最大影响面**：workflowhub workflows/verify-code/ — 由空骨架升为 v1 可用 skill；build-code facts.tests 加 command 字段（C1 同步）

**验收信号**：完整跑通一次验收+收尾闭环（含三段连接：make-decision → build-code → verify-code）；事实包可读；metrics 字段对齐 M4。

---

## 1. 目标与背景

verify-code 是 workflowhub extraction program 五段薄骨架的最后一段（M9）。M8 已交付 build-code v1，产出验收事实包（`specs/{task-id}/stage-result-build-code.json`，含三键 changed/tests/review）。verify-code 的 SKILL.md 骨架已存在但无可执行 .mjs 脚本，导致三段闭环断链。

M9 最小切口：补三个 .mjs 脚本 + 接 collector + 抄 isolated-browser-qa + CI 冒烟，打通 make-decision → build-code → verify-code 完整闭环。

v1 = light 模式，不含 verify-change full 模式。

---

## 2. 词汇表

- **事实包**：build-code 产出的 `stage-result-build-code.json`，verify-code 以此为输入。
- **stage-result**：verify-code 执行完毕后写入 `specs/{task-id}/stage-result-verify-code.json` 的结构化记录，含 status / error_code / retryable / facts / missing_items / user_decision / reason 七个顶层键。
- **anomaly_flags**：stage-result facts 内的警告列表，仅记录 / 浮现，不触发 FAIL。
- **fresh 验证**：verify-code 自己现跑测试，不复用 M8 旧结果。
- **鲜度校验**：比对 verify-code 采集的 git_sha 与 HEAD，不匹配时写 `stale_sha` 至 anomaly_flags。
- **SKIP 分支**：无 UI 验收项时浏览器验收不执行，missing_items 记录该项。
- **user_decision**：stage-result 中布尔键，`true` 表示该步骤在执行前已获得人工确认（用于合并/删分支收尾）。
- **collector**：`metrics/collector.mjs`，M4 metrics 底座，提供 recordSkeleton / updateOwnResult / collectFacts / updateStageImpact 四个接口。

---

## 3. 用户场景

> 正常路径、失败路径、边界路径均覆盖，≥8 条。

**场景 3.1（正常）fresh 测试通过**

给定：build-code 已产出事实包，facts.tests.command 有效，当前 HEAD git_sha 与 M8 执行时一致。
当：verify-code 从事实包读取 command 并执行测试。
那么：测试全部通过，stage-result facts.verdict=pass，facts.evidence_ref 指向 final-test-report.md，anomaly_flags 为空。

**场景 3.2（正常）鲜度警告不阻断**

给定：build-code 事实包中记录的 git_sha 与当前 HEAD 不同（有新提交）。
当：verify-code 完成 fresh 测试并做鲜度校验。
那么：stage-result facts.anomaly_flags 含 "stale_sha"，测试依然跑完，verdict 由测试结果决定，不因 stale_sha 置 FAIL / status="failure"。

**场景 3.3（正常）浏览器验收 SKIP**

给定：当前 task 无 UI 验收项（M9 自举任务）。
当：verify-code 进入浏览器验收步骤。
那么：SKIP 分支触发，stage-result missing_items 记录"browser-acceptance: no UI acceptance items"，不调用 isolated-browser-qa，不阻断后续收尾。

**场景 3.4（正常）终态收尾人工确认**

给定：测试通过，用户在 SKILL.md 明文停顿处点头确认合并/删分支。
当：收尾执行合并和删分支。
那么：stage-result user_decision=true，合并与删分支均已完成，reason 记录操作结果。

**场景 3.5（失败）测试命令缺失**

给定：build-code 事实包 facts.tests 缺少 command 字段（M8 旧版本或 C1 未同步）。
当：verify-code 尝试读取测试命令。
那么：stage-result status="failure"，error_code 描述 command 字段缺失，retryable=true，浮现明确错误，不静默跳过。

**场景 3.6（失败）测试跑失败**

给定：facts.tests.command 有效，但当前代码测试有失败用例。
当：verify-code 执行测试。
那么：stage-result facts.verdict=fail，final-test-report.md 中逐条列出失败的测试用例，status="failure"。注：此场景 missing_items 为空（missing_items 记录的是"跳过未执行的验收项"，如浏览器验收 SKIP；测试本身跑了但失败，不属于 missing_items 范畴，二者语义不同）。

**场景 3.7（边界）用户拒绝合并**

给定：测试通过，verify-code 在 SKILL.md 明文停顿处等待确认。
当：用户拒绝合并（不点头）。
那么：合并/删分支不执行，stage-result user_decision=false，skill 终止并记录用户拒绝原因，不自动越界。

**场景 3.8（边界）build-code 事实包完整消费**

给定：M8 事实包含三键 changed/tests/review，tests.command 已有效（C1 同步后）。
当：verify-code 读取事实包。
那么：三键均可读取，verify-code 无需额外转换即可消费 facts.tests.command 和 facts.review.verdict。

**场景 3.9（边界）metrics 双写**

给定：collector 配置指向 task-level 和 global metrics 路径。
当：verify-code 完成一次完整执行（recordSkeleton → updateOwnResult）。
那么：task-metrics.jsonl 和全局 .jsonl 均写入含全部 10 个核心字段的记录，缺任一字段即判失败。

**场景 3.10（边界）浏览器验收有 UI 项**

给定：task 有 UI 验收项（非 M9 自举，未来有 UI 的 task）。
当：verify-code 进入浏览器验收步骤。
那么：调用 isolated-browser-qa（workflowhub 本地副本，已去除 agenthub 硬编码路径），结果写入 stage-result，SKIP 分支不触发。

---

## 4. 功能需求

> 每条标来源（D-M9-x / Cx / Dx），可追溯回 decision-log。

### FR-FRESH（fresh 验证 + 鲜度校验）

**FR-FRESH-001** 现跑测试不复用历史结果（来源：D-M9-1）
verify-code 必须自己执行测试命令，不读取 M8 stage-result-build-code.json 中已有的测试结果作为本次验收证据。每次 verify-code 执行均产出新的 capture 证据。

**FR-FRESH-002** 采集 git_sha 并与 HEAD 比对（来源：D-M9-1；实现建议沿用既有约定）
verify-code 执行时通过 capture 脚本采集当前 HEAD git_sha，与 build-code 事实包（stage-result-build-code.json）中记录的 git_sha 比对，结果写入 stage-result facts。注：比对对象为"capture 时的 HEAD"与"M8 事实包记录的 git_sha"，是 freshness 的操作定义，属实现约定而非 decision-log 明文要求。

**FR-FRESH-003** 鲜度不匹配仅记 anomaly_flags 不 FAIL（来源：D-M9-2，C2，D5/D7）
git_sha 不匹配时，stage-result facts.anomaly_flags 写入 "stale_sha"，同时在 skill 执行边界输出可见警告。绝不因 stale_sha 置 status="failure"、绝不 exit2、绝不把鲜度校验做成 blocking gate。

**FR-FRESH-004** anomaly_flags 浮现可观测（来源：D-M9-2，D5）
当 anomaly_flags 非空时，skill 执行边界必须有可见输出（非静默）。anomaly_flags 存在但无任何输出即视为验收失败。

### FR-CMD（测试命令读取）

**FR-CMD-001** 从事实包读取 command 字段（来源：D-M9-3，C1）
verify-code 从 `specs/{task-id}/stage-result-build-code.json` 的 facts.tests.command 字段读取测试命令，不在 verify-code 侧硬编码任何命令。

**FR-CMD-002** command 字段缺失时浮现明确错误（来源：D-M9-3）
若 facts.tests.command 字段不存在或为空，stage-result status="failure"，error_code 描述缺失原因，retryable=true，不静默跳过也不使用任何回退默认命令。

**FR-CMD-003** build-code facts.tests 加 command 字段（来源：C1）
作为 M9 同步改动，build-code 侧 `workflows/build-code/facts-schema.mjs` 及对应 SKILL.md 需在 facts.tests 中新增 command 字段。新增字段向后兼容，不破坏已有 changed/tests/review 三键的消费方。

### FR-BROWSER（浏览器验收可选）

**FR-BROWSER-001** isolated-browser-qa 抄入 workflowhub 并去除 agenthub 硬编码路径（来源：D-M9-4，D16）
将 isolated-browser-qa skill 的提示词文件（SKILL.md）复制至 workflowhub 本地（`workflows/verify-code/isolated-browser-qa.md`），改掉所有硬编码 agenthub 路径，使其可在任意项目 repo 下调用。v1 只复制 SKILL.md 一个文件；若原 skill 含脚本或其他运行时依赖，须在实现时确认无额外依赖（按 F8 简单优先）。来源路径在 reuse-registry.md 中登记（D16）。

**FR-BROWSER-002** 无 UI 验收项时走 SKIP 分支（来源：D-M9-4）
当 task 无 UI 验收项时，verify-code 不调用 isolated-browser-qa，stage-result missing_items 中记录"browser-acceptance: no UI acceptance items"，不以缺少浏览器验收为由置 status="failure"。

**FR-BROWSER-003** SKIP 分支不阻断后续收尾（来源：D-M9-4）
浏览器验收走 SKIP 分支后，verify-code 正常进入收尾步骤，M9 自举真跑时 SKIP 分支可被观察到。

### FR-CLOSE（终态收尾）

**FR-CLOSE-001** 合并/删分支前必须获得人工确认（来源：D-M9-5，C3，D6）
收尾步骤在合并和删分支之前，SKILL.md 中必须有明文停顿（文字描述说明等待原因），skill 等待用户确认后才执行。不自动执行合并/删分支。

**FR-CLOSE-002** user_decision:true 标记（来源：D-M9-5，C3）
用户确认后执行合并/删分支，stage-result user_decision=true。用户拒绝时 user_decision=false，合并/删分支不执行，skill 正常终止并记录原因。

**FR-CLOSE-003** 收尾动作不可逆性浮现（来源：D-M9-5，D6）
SKILL.md 明文停顿处需列出将要执行的不可逆动作清单（合并目标分支/删除 feature 分支），使用户在确认前可见操作内容。

### FR-PATH（落盘路径）

**FR-PATH-001** stage-result 落 specs/{task-id}/（来源：D-M9-6）
verify-code 的 stage-result 写入 `specs/{task-id}/stage-result-verify-code.json`，与 build-code 的 `specs/{task-id}/stage-result-build-code.json` 同级。

**FR-PATH-002** final-test-report.md 落 specs/{task-id}/test/（来源：D-M9-6）
测试报告写入 `specs/{task-id}/test/final-test-report.md`。

**FR-PATH-003** evidence_ref 相对 specs/{task-id}/ 根（来源：D-M9-6）
stage-result facts.evidence_ref 为相对 `specs/{task-id}/` 根的相对路径（如 `test/final-test-report.md`），不使用绝对路径，不使用相对 repo 根的路径。

### FR-METRICS（M4 metrics 接入）

**FR-METRICS-001** recordSkeleton 在 stage 开始时调用（来源：D-M9-7，M4 collector 契约）
verify-code 启动时调用 `metrics/collector.mjs` 的 recordSkeleton，传入含全部 10 个核心字段的 seed（execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）。

**FR-METRICS-002** updateOwnResult 在 stage 结束时调用（来源：D-M9-7，M4 collector 契约）
verify-code 执行完毕（success 或 failure）后调用 updateOwnResult，更新 executed / tokens / duration_ms 等字段。不手写原始 jsonl 行。

**FR-METRICS-003** 双写 task-level + global（来源：M4 FR-COLLECT-006/007）
metrics 记录同时写入 task-level `task-metrics.jsonl` 和全局 metrics 路径，记录含 task_id / project 四标识符。

**FR-METRICS-004** 10 个核心字段全部结构性存在（来源：验收标准 4，record-schema.mjs）
每条 metrics 记录必须包含 record-schema.mjs 定义的全部 10 个核心字段（execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）作为键，缺任一键即判失败。

### FR-TEST（测试策略）

**FR-TEST-001** 三个关键脚本有单元测试覆盖（来源：D-M9-7）
capture 脚本、freshness 脚本、facts 组装脚本各有对应单元测试，覆盖正常路径和关键边界（command 缺失、sha 不匹配、anomaly_flags 非空）。

**FR-TEST-002** M9 自举端到端实跑（来源：D-M9-7）
M9 的三段闭环（make-decision → build-code → verify-code）通过 M9 自举任务实跑验证，不堆额外 E2E 框架。自举实跑走完整验收+收尾一次为验收依据。

**FR-TEST-003** CI 纳入 verify-code 冒烟 + 轻量三段闭环检查（来源：验收标准 5）
CI 配置包含两部分：
1. **verify-code 冒烟**：覆盖 capture / freshness / facts 组装三个脚本的单元测试（vitest）；
2. **轻量三段闭环检查**：CI 跑一个最小验证脚本，串起 make-decision → build-code → verify-code 三段产物链，检查 stage-result-build-code.json 可被读取（facts.tests.command 字段存在）、verify-code stage-result 落盘路径贯通。该检查不引入重型 E2E 基建，不模拟完整 UI 流程（按 D-M9-7/F10），只做产物链路贯通的结构性验证。CI 全部绿才视为交付完整。

### FR-REG（reuse-registry 登记）

**FR-REG-001** isolated-browser-qa 引入必须登记（来源：D-M9-4，D16）
将 isolated-browser-qa 抄入 workflowhub 后，在 reuse-registry.md 中登记：复用类别（改造适配）+ 来源路径（原 agenthub 路径）。引入未登记视为验收缺口。

---

## 5. 验收清单

> 承接 decision-log §7 五条可执行验收，每条可手动或命令验证。

- [ ] **验收 1 — 完整闭环跑通**：M9 自举任务跑完一次完整验收+收尾（fresh 测试跑通 → anomaly_flags 检查 → 浏览器验收 SKIP → 人工确认 → 合并/删分支）。任一环节缺失或静默跳过即失败。（来源：验收标准 1，D-M9-1/2/4/5）

- [ ] **验收 2 — 三段闭环连接**：make-decision → build-code → verify-code 三段全部打通，verify-code 成功读取 build-code 产出的 stage-result-build-code.json。三段任一断链即失败。（来源：验收标准 2）

- [ ] **验收 3 — 事实包消费**：verify-code 从 facts.tests.command 读取测试命令并执行（C1 同步后）。command 字段缺失时浮现明确错误而非静默跳过。stage-result facts.verdict 和 evidence_ref 均有效。（来源：验收标准 3，D-M9-3，C1，FR-CMD-001/002）

- [ ] **验收 4 — metrics 字段对齐**：task-metrics.jsonl 中含 verify-code 执行记录，全部 10 个核心字段（execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）均作为键存在，缺任一键即失败。（来源：验收标准 4，FR-METRICS-004）

- [ ] **验收 5 — CI 纳入**：CI 包含 verify-code 冒烟（capture / freshness / facts 组装单元测试）+ 轻量三段闭环检查（结构性验证 make-decision → build-code → verify-code 产物链路贯通，不引入重型 E2E 框架，见 FR-TEST-003 和 D-M9-7/F10 说明），CI 全部通过后视为交付完整。（来源：验收标准 5，FR-TEST-003）

---

## 6. 关键实体

**stage-result（verify-code 产出）**（来源：D-M9-6 落盘路径约定；七键结构沿用 build-code 既有 stage-result 约定，属实现契约而非 decision-log 明文 schema）：

- `status`：success | failure
- `error_code`：失败原因描述（success 时为空字符串）
- `retryable`：布尔，command 缺失等可重试类错误为 true
- `facts`：验收事实对象
  - `verdict`：pass | fail（由测试结果决定，非鲜度）
  - `evidence_ref`：相对 `specs/{task-id}/` 根的 final-test-report.md 路径
  - `anomaly_flags`：警告列表，目前定义值为 "stale_sha"；空列表表示无异常
- `missing_items`：未执行验收项清单（如浏览器验收 SKIP 时记录；测试跑了但失败不属于此字段范畴）
- `user_decision`：布尔，合并/删分支前人工确认结果
- `reason`：人可读的结论描述

**build-code 事实包中 verify-code 消费的字段**：

- `facts.tests.command`：verify-code 执行的测试命令（C1 新增字段，原有 red_exit_code / green_baseline_hash 等字段不变）
- `facts.review.verdict`：M8 审查结论（verify-code 可用于报告，非执行依据）

**M4 metrics 核心字段（10 个）**：execution_id、skill_or_stage、stage、skill_version、executed、tokens、duration_ms、rework_rounds、human_intervention、friction_ref（定义见 `metrics/record-schema.mjs`）。

---

## 7. 数据和生命周期

- **数据粒度**：以一次 verify-code skill 执行（单任务验收）为单位，产出一份 stage-result + 一份 final-test-report.md。
- **数据时效**：stage-result 在 skill 执行结束时落 durable，之后不变更（只读）。
- **补传策略**：若中途失败，已采集的部分事实写入 stage-result，失败原因浮现，不覆盖已有报告。
- **当前 vs 历史**：stage-result 落固定路径 `specs/{task-id}/stage-result-verify-code.json`，同一 task 重跑（rerun）会覆盖前次结果；不同 task 靠 task-id 目录自然隔离。如需保留历史快照，调用方在 rerun 前自行备份，verify-code 本身不做多版本管理。
- **metrics 生命周期**：recordSkeleton 在 stage 开始即写入（metrics 写失败只 warn 不 throw，继承 M4 metrics collector 的写失败保护语义，对齐 CONSTITUTION F3/Q1 记事实非 blocking）；updateOwnResult 在 stage 结束补全；任何一次写失败不阻断 skill 主流程。

---

## 8. 兼容性预留

- **facts.tests.command 向后兼容**：C1 在 build-code 侧新增 command 字段属于追加，已有 red_exit_code / green_baseline_hash 等字段语义不变，现有消费方不受影响。
- **anomaly_flags 扩展预留**：当前定义值仅 "stale_sha"，未来可追加新值，已有消费方按已知值处理即可，不识别的值视为告知性警告。
- **stage-result 契约预留**：verify-code stage-result 的 facts 结构 design 只加不删，M10 可在 facts 下追加新键，不破坏现有字段语义。
- **浏览器验收路径预留**：isolated-browser-qa 以 SKIP 分支兼容无 UI 场景，未来有 UI task 可直接走执行分支，不需修改 verify-code 主流程。

---

## 9. 不做和隐性必达

### 明确不做（来源：decision-log §5）

- 不复用 M8 已有测试结果作为本次验收证据（D-M9-1，fresh verification 原则）
- 不把鲜度校验做成 BLOCK / exit2（违 D5/D7，agenthub 历史失败根因）
- 不自动合并/删分支不问人（违 D6）
- v1 不做 verify-change full 模式（超出 M9 scope）
- 不做 M10 基线对照工具（M9 只产数据，对照是 M10 的事）
- 浏览器验收不真实跑 UI（M9 自举任务无 UI，走 SKIP 分支）
- 不照搬 agenthub 实现（C4，D21：按 spec 重写）

### 隐性必达

- anomaly_flags 非空时 skill 执行边界必须有可见输出，不得静默
- stage-result 落 durable 路径，skill 进程结束后仍可读
- command 字段缺失时浮现明确 error_code，不静默回退默认命令
- user_decision:false 时合并/删分支绝不执行
- isolated-browser-qa 抄入后所有 agenthub 硬编码路径必须替换，在 reuse-registry.md 登记来源
- metrics 写失败只 warn 不 throw，不阻断 skill 主流程（继承 M4 metrics collector 写失败保护语义，对齐 CONSTITUTION F3/Q1）

---

## 10. 验收清单及未决问题

### 验收检查

- [ ] 本 spec 共 24 条 FR（FR-FRESH 4 + FR-CMD 3 + FR-BROWSER 3 + FR-CLOSE 3 + FR-PATH 3 + FR-METRICS 4 + FR-TEST 3 + FR-REG 1 = 24），每条 FR 可追溯回 decision-log.md 来源字段
- [ ] 与 decision-log.md（m9-verify-code）一致，每条 FR 可追溯回来源字段
- [ ] 用户场景覆盖正常（3.1/3.2/3.3/3.4）、失败（3.5/3.6）、边界（3.7/3.8/3.9/3.10）路径，≥8 条
- [ ] 含至少两条失败场景（3.5 command 缺失、3.6 测试失败）
- [ ] 含至少三条边界场景（3.7 用户拒绝、3.8 事实包消费、3.9 metrics 双写、3.10 有 UI 项）
- [ ] A 档五章齐全（场景 / FR / 不做 / 验收 / 影响范围）
- [ ] 验收条目可手动或命令验证
- [ ] 不含绝对文件路径、TypeScript/JS interface 定义、shell 命令块作为需求
- [ ] 业务影响范围已写第 11 章

### 未决问题和风险

无。所有七条决策（D-M9-1 ~ D-M9-7）、四条约束（C1~C4）、五条验收标准均由用户在 intake 第 5 步明确批准落盘，无开放问题。

---

## 11. 影响范围（业务性质）

- **受影响功能：verify-code skill**
  - 既有行为：64 行空骨架（SKILL.md），无 .mjs 脚本，不可运行
  - 本需求影响：升为 v1 可运行 skill，覆盖 fresh 验证/鲜度警告/浏览器验收可选/终态收尾/metrics 接入五大能力
  - 回归要点：原有骨架定义的接口（stage-result 结构、M4 metrics 字段契约）不被破坏

- **受影响功能：build-code facts.tests（C1 同步）**
  - 既有行为：facts.tests 含 red_exit_code / green_baseline_hash 等字段，无 command 字段
  - 本需求影响：新增 command 字段（向后兼容追加），同步更新 build-code 侧 facts-schema.mjs 和 SKILL.md
  - 回归要点：已有 changed/tests/review 三键消费方不受影响；M8 已合并 main，新增字段属可选扩展

- **受影响功能：三段闭环（make-decision → build-code → verify-code）**
  - 既有行为：make-decision（M7）和 build-code（M8）已交付，verify-code 断链
  - 本需求影响：verify-code 接入后三段全部打通，闭环首次可运行
  - 回归要点：make-decision 和 build-code 内部逻辑不被 M9 修改；三段之间仅通过 stage-result JSON 文件传递数据

- **受影响功能：isolated-browser-qa（抄入改造）**
  - 既有行为：isolated-browser-qa 存在于 agenthub 路径，含硬编码 agenthub 路径
  - 本需求影响：复制至 workflowhub 本地，去除 agenthub 硬编码路径；reuse-registry.md 新增条目
  - 回归要点：agenthub 原件不被修改；workflowhub 本地副本仅供 verify-code 消费；SKIP 分支确保无 UI task 不受影响

- **受影响功能：M4 metrics 底座（collector.mjs）**
  - 既有行为：collector.mjs 已交付，现有消费方（make-decision/build-code）正常使用
  - 本需求影响：verify-code 首次在 stage 5 接入 collector，不修改 collector.mjs 本身
  - 回归要点：collector.mjs 不被修改；现有消费方不受影响；metrics 写失败只 warn 不 throw 保护 skill 主流程（对齐 CONSTITUTION F3/Q1）

- **可能受冲击的业务规则**：D5（记事实非 blocking）和 D6（不可逆操作不越人界）是本需求核心约束，任何实现不得把 anomaly_flags 升级为 FAIL，不得跳过 user_decision 确认步骤

- **明确无影响**：design/plan 上游 workflow 内部逻辑；Multica web/mobile/desktop 前端；agenthub harness / gate 执行框架内部（verify-code 走 agenthub vibecoding harness 自举执行，不修改 harness）

---

> 本 spec 基于 decision-log.md（m9-verify-code）所有已批准决策撰写。七条决策、四条约束、五条验收标准均有 FR 对应追溯。
```
## 被审对象1: 修订后 plan.md
```markdown
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
```
## 被审对象2: 修订后 tasks.md
```markdown
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
```

## 输出
逐条核round2的2个blocking+3个非阻断是否真修(修了/没修/修偏)+有无新引入问题。给 verdict: pass/revise_required/escalate_to_human。仍有blocking指明file:section+违反需求。如全修无新blocking请明确给pass。

## Raw output

```text
verdict: **pass**

round2 的 2 个 blocking 已修到 Plan 阶段可接受程度；未发现新的 blocking。仍有 1 个非阻断项修偏，但不足以要求第三次返修。

| 项 | 结论 | 核验 |
|---|---|---|
| blocking 1 | 修了 | CI 检查已补 make-decision 段 |
| blocking 2 | 修了 | C1 已纳入 build-code SKILL.md |
| 非阻断 total_tasks | 修了 | 19 与实际任务数一致 |
| 非阻断 readCommand 口径 | 修了 | 统一为 `readCommand(buildResult)` |
| 非阻断 `|| echo` 掩盖失败 | 修偏 | `|| echo` 去掉，但仍有 `; echo` |

**blocking 1：CI 三段闭环检查修偏**

结论：**修了**

证据：

- [plan.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md:141) 已写 CI 轻量三段检查：
  - make-decision 产物存在可读
  - build-code stage-result 可读且 `facts.tests.command` 存在
  - verify-code stage-result 路径结构检查
- [plan.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md:368) FR-TEST-003 明确映射到 `scripts/ci-chain-check.mjs`，覆盖 `make-decision → build-code → verify-code`。
- [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:370) Task 5.1 明确新增 `scripts/ci-chain-check.mjs`，并列出三段：
  - make-decision：产物存在且可读，合法 JSON
  - build-code：读取 `stage-result-build-code.json`，校验 `facts.tests.command`
  - verify-code：校验 `stage-result-verify-code.json` 路径结构

评价：这次不再只覆盖 build-code→verify-code。虽然“能接上 build-code”的检查仍偏结构性，不验证 make-decision 内容与 build-code 输入的强关联，但 spec 要求的是轻量链路检查，不建重型 E2E；当前写法满足 Plan 阶段要求。

**blocking 2：C1 漏同步 build-code SKILL.md**

结论：**修了**

证据：

- [plan.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md:135) 文件结构纳入 `workflows/build-code/facts-schema.mjs`。
- [plan.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md:136) 文件结构纳入 `workflows/build-code/SKILL.md`，声明 `facts.tests` 必须包含 `command`。
- [plan.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md:319) 集成章节明确 C1 同步两件：schema + SKILL.md。
- [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:220) Task 3.5 单列 build-code SKILL.md 修改任务。
- [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:225) 给了可证伪验证：`grep -n "command" workflows/build-code/SKILL.md`。

评价：已把 C1 从“只改 schema”修正为“schema + SKILL.md 同步”，并明确新产物必须写出 `facts.tests.command`。

**round2 非阻断复核**

1. `total_tasks 19 vs 18`

结论：**修了**

`tasks.md` front matter 写 `total_tasks: 19`，实际任务数为：

- Phase 1：3
- Phase 2：3
- Phase 3：5
- Phase 4：4
- Phase 5：4

合计 19。

2. `readCommand(buildResultPath vs buildResult)` 口径不一

结论：**修了**

现在主口径是 `readCommand(buildResult)`：

- [plan.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md:133)
- [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:181)
- [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:196)

没有再看到 `buildResultPath` 口径混用。

3. Phase 5 Verify 的 `|| echo` 掩盖脚本失败

结论：**修偏，非阻断**

原来的 `|| echo` 形态已基本移除，但 [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:426) 仍写：

```bash
node --input-type=module --eval "import '/Users/Hugh/Hugh/Project/workflowhub/scripts/ci-chain-check.mjs'" 2>&1; echo "ci-chain-check import exit: $?"
```

这行如果整体作为验证命令执行，最终 shell exit code 会是 `echo` 的 0，仍会弱化失败信号。建议实现阶段改成：

```bash
node --input-type=module --eval "import '/Users/Hugh/Hugh/Project/workflowhub/scripts/ci-chain-check.mjs'"
```

或：

```bash
node --input-type=module --eval "import '/Users/Hugh/Hugh/Project/workflowhub/scripts/ci-chain-check.mjs'"
status=$?
echo "ci-chain-check import exit: $status"
exit $status
```

但它位于手动 Verify 描述，不影响 Task 5.1 中 CI step 本身的要求，因此不升 blocking。

**新问题扫描**

未发现新的 blocking。

有一个实现阶段需注意的非阻断风险：Task 5.1 的 make-decision 路径写了“`stage-result-make-decision.json` 或同等 make-decision 输出产物路径”。实现时不要把“同等路径”做成宽松跳过；脚本必须有确定规则，否则 CI 检查会退化成文档声明。

最终结论：**pass**。


2026-06-26T05:42:22.302624Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T05:42:22.302639Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T05:42:22.302641Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-26T05:42:22.302642Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T05:42:22.302644Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T05:42:22.302645Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T05:42:22.302647Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T05:42:22.302648Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T05:42:22.302649Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T05:42:22.302650Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T05:42:22.302656Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-26T05:42:22.302657Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
OpenAI Codex v0.135.0
--------
workdir: /Users/Hugh/Hugh/Project/workflowhub
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: medium
reasoning summaries: none
session id: 019f0273-57a5-7b93-aa70-be4c9b2b399d
--------
user
你是独立审查员，对 workflowhub M9 verify-code v1【Plan 阶段】交付物 plan.md+tasks.md 做 ROUND-3 复审。这是第二次返修后复审：round2 你判 revise_required（2个新blocking），作者已修。核实这2个blocking是否真修+扫新问题。客观，不放水。

## round2 你给的 2 个 blocking（逐条核是否真修）
1. CI三段闭环检查修偏:ci-chain-check只覆盖build-code→verify-code两段,漏了make-decision段。作者应补make-decision段产物存在/可读/能接上build-code的检查(仍轻量,不建重型E2E)。
2. C1漏同步build-code SKILL.md:C1要求同步改facts-schema.mjs和SKILL.md两件,作者只改了schema。作者应把build-code SKILL.md纳入文件结构+任务,声明build-code产出facts.tests必须含command字段,并加可证伪验证。
round2非阻断(应已修):total_tasks 19vs18; readCommand(buildResultPath vs buildResult)口径不一; Phase5 Verify的'|| echo'掩盖脚本失败。

## 权威需求
### decision-log.md
```
---
sources:
  - artifacts/intake-original-context.md
created: 2026-06-26T00:00:00+08:00
updated: 2026-06-26T00:00:00+08:00
task_id: m9-verify-code
workflow: vibecoding
stage: intake
approved_by: user
approved_at: "2026-06-26"
---

# Decision Log — m9-verify-code

## 1. 原始需求（原文）

> 任务：把 workflowhub `workflows/verify-code/` 从空骨架做成 v1，打通 make-decision → build-code → verify-code 三段闭环。
>
> 交付仓：/Users/Hugh/Hugh/Project/workflowhub（执行环境=multica-agenthub vibecoding harness，自举，Node22/ESM/vitest）
>
> 上游真相源：roadmap M9 段 + program decision-log（D5/D6/D7/D16/D16a/D17/D21/§8），路径见关键文件节。
>
> M9 是 workflowhub extraction program 五段薄骨架的最后一段。M8 已交付 build-code v1 + 验收事实包（落 specs/{task-id}/stage-result-build-code.json，三键 changed/tests/review）。verify-code 的 SKILL.md 骨架已存在（workflows/verify-code/SKILL.md，64行，无 .mjs 脚本）。M9 主要工作=补 .mjs 脚本 + 接 metrics collector + 抄外部件 + CI。
>
> 目标：fresh verification + 浏览器验收 + 终态收尾 + 按 M10 口径产新基线数据。

用户在 intake 第 5 步对全部七条决策（D-M9-1 ~ D-M9-7）、四条约束（C1~C4）、五条验收标准、范围边界、假设逐条确认，明确批准落盘。

## 2. 问题与目标

**核心问题**：verify-code workflow 只有 64 行空骨架，无可执行 .mjs 脚本，无法完成 fresh 验证、浏览器验收、终态收尾三段动作，导致三段闭环（make-decision → build-code → verify-code）断链。

**用户**：workflowhub extraction program 维护者（M9 是五段薄骨架最后一段）。

**现状**：M8 已交付 build-code v1，事实包落盘；verify-code 骨架存在但空。

**最小切口**：补三个 .mjs 脚本（capture/freshness/facts组装）+ 接 collector + 抄 isolated-browser-qa + CI 冒烟。

**上游真相源**：
- roadmap：`/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md`（M9 段，263-275 行）
- program decision-log：同目录 `decision-log.md`（D5/D6/D7/D16/D16a/D17/D21/§8）
- 本 task 原始上下文：`artifacts/intake-original-context.md`

## 3. 决策记录

### 决策 1（D-M9-1）：fresh 验证 = 重跑测试 + 鲜度校验

- 决策内容：verify-code 自己现跑测试，不读 M8 旧结果；用 capture 采证 + 校验 git_sha==HEAD + freshness
- 理由：历史护栏 C 禁止复用历史 evidence；只有现跑才能保证 verification 的可信度
- 备选项：直接复用 M8 已有测试结果（被否决，违反 fresh verification 原则）
- 来源类型：原文要求
- 来源证据：roadmap M9 段"fresh verification"要求 + 历史护栏 C（不复用历史 evidence）
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 2（D-M9-2）：鲜度校验做成"记 anomaly_flags 不 BLOCK"

- 决策内容：git_sha 不匹配时写 `anomaly_flags:["stale_sha"]` 进 stage-result facts，浮现警告但不 FAIL/不 exit2
- 理由：D5/D7 明确"记事实非 blocking"，agenthub 历史失败根因之一就是鲜度校验做成了 blocking gate 导致死锁
- 备选项：鲜度不匹配直接 FAIL exit2（被否决，违反 D5/D7）
- 来源类型：原文要求
- 来源证据：program decision-log D5（记事实非 blocking）、D7（agenthub 失败根因分析）
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 3（D-M9-3）：测试命令从 build-code 事实包读取

- 决策内容：verify-code 从 `facts.tests.command` 字段读取要执行的测试命令，不硬编码
- 理由：消费事实包是 verify-code 存在的本意，最可溯源；硬编码会导致跨项目不可复用
- 备选项：在 verify-code SKILL.md 硬编码测试命令（被否决，不可溯源）；让用户运行时传参（被否决，增加摩擦）
- 来源类型：衍生
- 来源证据：推导链：M8 已交付 build-code 事实包（三键 changed/tests/review）→ verify-code 消费事实包是设计意图 → tests 字段应含 command 以实现完整消费 → 用户拍板确认此推导
- 用户批准：是
- 批准证据：用户拍板（"消费事实包本意，最可溯源"）

---

### 决策 4（D-M9-4）：浏览器验收抄 isolated-browser-qa + 设计成可选步骤

- 决策内容：将 isolated-browser-qa skill 抄入 workflowhub + 改掉硬编码 agenthub 路径；设计成"可选步骤"——无 UI 验收项则 SKIP 并记 missing_items；M9 自举任务本身无 UI，真跑走 SKIP 分支
- 理由：D16 要求外部件直接放项目内+记源路径；自举任务无 UI 强制跑浏览器验收无意义；SKIP 分支让 v1 适配无 UI 场景
- 备选项：跳过浏览器验收完全不抄（被否决，未来有 UI 任务需要此能力）；强制跑浏览器验收（被否决，自举无 UI 会失败）
- 来源类型：原文要求
- 来源证据：用户拍板 + program decision-log D16（外部件直接放项目内+记源路径）
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 5（D-M9-5）：终态收尾含便宜确认才执行合并/删分支

- 决策内容：执行合并/删分支前一句便宜确认、人点头才做 + 记录（stage-result `user_decision:true` + SKILL.md 明文停顿，不自动越界）
- 理由：合并/删分支是不可逆操作；D6/F7 明确不可逆操作不自动越人界
- 备选项：全自动合并+删分支（被否决，违反 D6/F7）；完全不合并（被否决，无法完成收尾）
- 来源类型：原文要求
- 来源证据：用户拍板 + program decision-log D6（不可逆操作不自动越人界）、F7
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 6（D-M9-6）：stage-result 落盘路径对齐 build-code 约定

- 决策内容：verify-code 的 stage-result 落 `specs/{task-id}/stage-result-verify-code.json`；final-test-report.md 落 `specs/{task-id}/test/`；evidence_ref 相对 `specs/{task-id}/` 根
- 理由：与 M8 build-code 约定对齐，保持一致性，下游消费无需猜路径
- 备选项：自定义路径（被否决，破坏一致性）
- 来源类型：衍生
- 来源证据：推导链：M8 build-code 约定 specs/{task-id}/stage-result-build-code.json → verify-code 同级对齐 → 用户确认
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

---

### 决策 7（D-M9-7）：测试策略 = 单测覆盖 3 脚本 + M9 自举端到端

- 决策内容：单测覆盖 3 个关键脚本（capture/freshness/facts组装）；端到端三段闭环靠 M9 自举实跑验证，不堆机器可执行端到端基建
- 理由：F10 明确不为机器可校验性堆基建；M9 自举实跑本身就是最真实的端到端验证
- 备选项：堆完整 E2E 测试框架（被否决，违反 F10，过度工程）
- 来源类型：原文要求
- 来源证据：program decision-log F10（不为机器可校验性堆基建）+ 用户拍板
- 用户批准：是
- 批准证据：用户在 intake 第 5 步逐条确认，明确批准

## 4. 假设

- **[ASSUMPTION]** M8 build-code facts.tests 加 command 字段不破坏 M8 已交付物（M8 已合并 main，新增可选字段向后兼容）。
- **[ASSUMPTION]** isolated-browser-qa 抄入后无 UI 走 SKIP 路径能被 M9 自举实跑验证（真跑到 SKIP 分支）。

## 5. 明确不做

- 不把鲜度校验做成 blocking gate（违 D5/D7）。
- 不自动合并/删分支不问人（违 D6）。
- v1 不做 verify-change full 模式（超出 M9 scope）。
- M9 不做 M10 的基线对照工具（只产数据，对照是 M10 的事）。
- 浏览器验收不真实跑 UI（M9 自举任务无 UI，走 SKIP 分支）。

## 6. 开放问题

无。所有决策已由用户明确批准落盘。

## 7. 验收标准

1. **闭环打通**：跑通一次完整验收+收尾（任一步缺失即失败）。
2. **三段闭环**：make-decision → build-code → verify-code 三段全部打通（断链即失败）。
3. **事实包消费**：verify-code 能读 M8 事实包作输入（读不到即失败）。
4. **指标字段对齐**：流程指标字段与 M4 的 10 字段（`execution_id`/`skill_or_stage`/`stage`/`skill_version`/`executed`/`tokens`/`duration_ms`/`rework_rounds`/`human_intervention`/`friction_ref`）映射对齐（不对齐即失败）。
5. **CI 纳入**：CI 包含 verify-code 冒烟 + 三段闭环端到端。

## 8. 约束

- **C1**：M9 顺手改 build-code 侧：facts.tests 加 command 字段 + 同步 build-code SKILL.md / facts schema（跨件小改动，明文登记）。
- **C2**：鲜度校验绝不做成 BLOCK（违 D5）。
- **C3**：合并/删分支=不可逆操作，`user_decision:true` + 明文停顿等人点头，绝不自动越界（D6）。
- **C4**：交付仓 workflowhub，不照搬 agenthub 实现，按 spec 重写（D21）。

## 9. 范围

**范围内**：
- verify-code .mjs 脚本（capture/freshness/facts组装）
- 接 metrics collector
- 抄 isolated-browser-qa + 改掉硬编码 agenthub 路径
- 收尾归档 + 合并便宜确认
- CI 冒烟 + 三段闭环端到端
- build-code 侧加 command 字段（C1）

**范围外**：
- 浏览器验收真实 UI 跑（自举无 UI 走 SKIP）
- M10 基线对照工具（M9 只产数据不做对照）
- verify-change full 模式（v1 只做 light）

## 10. 关键文件

| 文件 | 路径 |
|---|---|
| roadmap 真相源（M9 段 263-275 行） | `/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md` |
| program decision-log（D5/D6/D7/D16/D16a/D17/D21/§8） | `/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/decision-log.md` |
| 本 task 原始上下文 | `artifacts/intake-original-context.md` |
```
### spec.md(已定稿,plan须忠实落实)
```markdown
# 功能规格：verify-code v1

基于 decision-log.md（m9-verify-code）。本文件不可覆盖项目级规则。

**功能名**: `m9-verify-code`
**来源**: decision-log.md M9 verify-code v1（fresh 验证/浏览器验收可选/终态收尾/metrics 接入）
**状态**: 草稿

---

## 速读卡（30 秒看懂这个需求）

**一句话需求**：让 verify-code skill 能独立执行"验收"段——fresh 重跑测试、鲜度校验仅记 anomaly 不 BLOCK、浏览器验收可选跳过、终态合并需人确认、metrics 接 M4 collector。

**核心改动点**：
- 从空骨架（64 行 SKILL.md）补三个 .mjs 脚本（capture / freshness / facts 组装）
- 测试命令从 build-code 事实包 facts.tests.command 读取，不硬编码
- 鲜度校验：git_sha 不匹配仅写 anomaly_flags 警告，绝不 FAIL / exit2
- isolated-browser-qa 抄入 workflowhub 并去除硬编码 agenthub 路径；无 UI 验收项时 SKIP 并记 missing_items
- 终态合并/删分支需 user_decision:true + 明文停顿等人点头，不自动越界
- stage-result 落 specs/{task-id}/stage-result-verify-code.json；M4 metrics 双写 task + global

**最大影响面**：workflowhub workflows/verify-code/ — 由空骨架升为 v1 可用 skill；build-code facts.tests 加 command 字段（C1 同步）

**验收信号**：完整跑通一次验收+收尾闭环（含三段连接：make-decision → build-code → verify-code）；事实包可读；metrics 字段对齐 M4。

---

## 1. 目标与背景

verify-code 是 workflowhub extraction program 五段薄骨架的最后一段（M9）。M8 已交付 build-code v1，产出验收事实包（`specs/{task-id}/stage-result-build-code.json`，含三键 changed/tests/review）。verify-code 的 SKILL.md 骨架已存在但无可执行 .mjs 脚本，导致三段闭环断链。

M9 最小切口：补三个 .mjs 脚本 + 接 collector + 抄 isolated-browser-qa + CI 冒烟，打通 make-decision → build-code → verify-code 完整闭环。

v1 = light 模式，不含 verify-change full 模式。

---

## 2. 词汇表

- **事实包**：build-code 产出的 `stage-result-build-code.json`，verify-code 以此为输入。
- **stage-result**：verify-code 执行完毕后写入 `specs/{task-id}/stage-result-verify-code.json` 的结构化记录，含 status / error_code / retryable / facts / missing_items / user_decision / reason 七个顶层键。
- **anomaly_flags**：stage-result facts 内的警告列表，仅记录 / 浮现，不触发 FAIL。
- **fresh 验证**：verify-code 自己现跑测试，不复用 M8 旧结果。
- **鲜度校验**：比对 verify-code 采集的 git_sha 与 HEAD，不匹配时写 `stale_sha` 至 anomaly_flags。
- **SKIP 分支**：无 UI 验收项时浏览器验收不执行，missing_items 记录该项。
- **user_decision**：stage-result 中布尔键，`true` 表示该步骤在执行前已获得人工确认（用于合并/删分支收尾）。
- **collector**：`metrics/collector.mjs`，M4 metrics 底座，提供 recordSkeleton / updateOwnResult / collectFacts / updateStageImpact 四个接口。

---

## 3. 用户场景

> 正常路径、失败路径、边界路径均覆盖，≥8 条。

**场景 3.1（正常）fresh 测试通过**

给定：build-code 已产出事实包，facts.tests.command 有效，当前 HEAD git_sha 与 M8 执行时一致。
当：verify-code 从事实包读取 command 并执行测试。
那么：测试全部通过，stage-result facts.verdict=pass，facts.evidence_ref 指向 final-test-report.md，anomaly_flags 为空。

**场景 3.2（正常）鲜度警告不阻断**

给定：build-code 事实包中记录的 git_sha 与当前 HEAD 不同（有新提交）。
当：verify-code 完成 fresh 测试并做鲜度校验。
那么：stage-result facts.anomaly_flags 含 "stale_sha"，测试依然跑完，verdict 由测试结果决定，不因 stale_sha 置 FAIL / status="failure"。

**场景 3.3（正常）浏览器验收 SKIP**

给定：当前 task 无 UI 验收项（M9 自举任务）。
当：verify-code 进入浏览器验收步骤。
那么：SKIP 分支触发，stage-result missing_items 记录"browser-acceptance: no UI acceptance items"，不调用 isolated-browser-qa，不阻断后续收尾。

**场景 3.4（正常）终态收尾人工确认**

给定：测试通过，用户在 SKILL.md 明文停顿处点头确认合并/删分支。
当：收尾执行合并和删分支。
那么：stage-result user_decision=true，合并与删分支均已完成，reason 记录操作结果。

**场景 3.5（失败）测试命令缺失**

给定：build-code 事实包 facts.tests 缺少 command 字段（M8 旧版本或 C1 未同步）。
当：verify-code 尝试读取测试命令。
那么：stage-result status="failure"，error_code 描述 command 字段缺失，retryable=true，浮现明确错误，不静默跳过。

**场景 3.6（失败）测试跑失败**

给定：facts.tests.command 有效，但当前代码测试有失败用例。
当：verify-code 执行测试。
那么：stage-result facts.verdict=fail，final-test-report.md 中逐条列出失败的测试用例，status="failure"。注：此场景 missing_items 为空（missing_items 记录的是"跳过未执行的验收项"，如浏览器验收 SKIP；测试本身跑了但失败，不属于 missing_items 范畴，二者语义不同）。

**场景 3.7（边界）用户拒绝合并**

给定：测试通过，verify-code 在 SKILL.md 明文停顿处等待确认。
当：用户拒绝合并（不点头）。
那么：合并/删分支不执行，stage-result user_decision=false，skill 终止并记录用户拒绝原因，不自动越界。

**场景 3.8（边界）build-code 事实包完整消费**

给定：M8 事实包含三键 changed/tests/review，tests.command 已有效（C1 同步后）。
当：verify-code 读取事实包。
那么：三键均可读取，verify-code 无需额外转换即可消费 facts.tests.command 和 facts.review.verdict。

**场景 3.9（边界）metrics 双写**

给定：collector 配置指向 task-level 和 global metrics 路径。
当：verify-code 完成一次完整执行（recordSkeleton → updateOwnResult）。
那么：task-metrics.jsonl 和全局 .jsonl 均写入含全部 10 个核心字段的记录，缺任一字段即判失败。

**场景 3.10（边界）浏览器验收有 UI 项**

给定：task 有 UI 验收项（非 M9 自举，未来有 UI 的 task）。
当：verify-code 进入浏览器验收步骤。
那么：调用 isolated-browser-qa（workflowhub 本地副本，已去除 agenthub 硬编码路径），结果写入 stage-result，SKIP 分支不触发。

---

## 4. 功能需求

> 每条标来源（D-M9-x / Cx / Dx），可追溯回 decision-log。

### FR-FRESH（fresh 验证 + 鲜度校验）

**FR-FRESH-001** 现跑测试不复用历史结果（来源：D-M9-1）
verify-code 必须自己执行测试命令，不读取 M8 stage-result-build-code.json 中已有的测试结果作为本次验收证据。每次 verify-code 执行均产出新的 capture 证据。

**FR-FRESH-002** 采集 git_sha 并与 HEAD 比对（来源：D-M9-1；实现建议沿用既有约定）
verify-code 执行时通过 capture 脚本采集当前 HEAD git_sha，与 build-code 事实包（stage-result-build-code.json）中记录的 git_sha 比对，结果写入 stage-result facts。注：比对对象为"capture 时的 HEAD"与"M8 事实包记录的 git_sha"，是 freshness 的操作定义，属实现约定而非 decision-log 明文要求。

**FR-FRESH-003** 鲜度不匹配仅记 anomaly_flags 不 FAIL（来源：D-M9-2，C2，D5/D7）
git_sha 不匹配时，stage-result facts.anomaly_flags 写入 "stale_sha"，同时在 skill 执行边界输出可见警告。绝不因 stale_sha 置 status="failure"、绝不 exit2、绝不把鲜度校验做成 blocking gate。

**FR-FRESH-004** anomaly_flags 浮现可观测（来源：D-M9-2，D5）
当 anomaly_flags 非空时，skill 执行边界必须有可见输出（非静默）。anomaly_flags 存在但无任何输出即视为验收失败。

### FR-CMD（测试命令读取）

**FR-CMD-001** 从事实包读取 command 字段（来源：D-M9-3，C1）
verify-code 从 `specs/{task-id}/stage-result-build-code.json` 的 facts.tests.command 字段读取测试命令，不在 verify-code 侧硬编码任何命令。

**FR-CMD-002** command 字段缺失时浮现明确错误（来源：D-M9-3）
若 facts.tests.command 字段不存在或为空，stage-result status="failure"，error_code 描述缺失原因，retryable=true，不静默跳过也不使用任何回退默认命令。

**FR-CMD-003** build-code facts.tests 加 command 字段（来源：C1）
作为 M9 同步改动，build-code 侧 `workflows/build-code/facts-schema.mjs` 及对应 SKILL.md 需在 facts.tests 中新增 command 字段。新增字段向后兼容，不破坏已有 changed/tests/review 三键的消费方。

### FR-BROWSER（浏览器验收可选）

**FR-BROWSER-001** isolated-browser-qa 抄入 workflowhub 并去除 agenthub 硬编码路径（来源：D-M9-4，D16）
将 isolated-browser-qa skill 的提示词文件（SKILL.md）复制至 workflowhub 本地（`workflows/verify-code/isolated-browser-qa.md`），改掉所有硬编码 agenthub 路径，使其可在任意项目 repo 下调用。v1 只复制 SKILL.md 一个文件；若原 skill 含脚本或其他运行时依赖，须在实现时确认无额外依赖（按 F8 简单优先）。来源路径在 reuse-registry.md 中登记（D16）。

**FR-BROWSER-002** 无 UI 验收项时走 SKIP 分支（来源：D-M9-4）
当 task 无 UI 验收项时，verify-code 不调用 isolated-browser-qa，stage-result missing_items 中记录"browser-acceptance: no UI acceptance items"，不以缺少浏览器验收为由置 status="failure"。

**FR-BROWSER-003** SKIP 分支不阻断后续收尾（来源：D-M9-4）
浏览器验收走 SKIP 分支后，verify-code 正常进入收尾步骤，M9 自举真跑时 SKIP 分支可被观察到。

### FR-CLOSE（终态收尾）

**FR-CLOSE-001** 合并/删分支前必须获得人工确认（来源：D-M9-5，C3，D6）
收尾步骤在合并和删分支之前，SKILL.md 中必须有明文停顿（文字描述说明等待原因），skill 等待用户确认后才执行。不自动执行合并/删分支。

**FR-CLOSE-002** user_decision:true 标记（来源：D-M9-5，C3）
用户确认后执行合并/删分支，stage-result user_decision=true。用户拒绝时 user_decision=false，合并/删分支不执行，skill 正常终止并记录原因。

**FR-CLOSE-003** 收尾动作不可逆性浮现（来源：D-M9-5，D6）
SKILL.md 明文停顿处需列出将要执行的不可逆动作清单（合并目标分支/删除 feature 分支），使用户在确认前可见操作内容。

### FR-PATH（落盘路径）

**FR-PATH-001** stage-result 落 specs/{task-id}/（来源：D-M9-6）
verify-code 的 stage-result 写入 `specs/{task-id}/stage-result-verify-code.json`，与 build-code 的 `specs/{task-id}/stage-result-build-code.json` 同级。

**FR-PATH-002** final-test-report.md 落 specs/{task-id}/test/（来源：D-M9-6）
测试报告写入 `specs/{task-id}/test/final-test-report.md`。

**FR-PATH-003** evidence_ref 相对 specs/{task-id}/ 根（来源：D-M9-6）
stage-result facts.evidence_ref 为相对 `specs/{task-id}/` 根的相对路径（如 `test/final-test-report.md`），不使用绝对路径，不使用相对 repo 根的路径。

### FR-METRICS（M4 metrics 接入）

**FR-METRICS-001** recordSkeleton 在 stage 开始时调用（来源：D-M9-7，M4 collector 契约）
verify-code 启动时调用 `metrics/collector.mjs` 的 recordSkeleton，传入含全部 10 个核心字段的 seed（execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）。

**FR-METRICS-002** updateOwnResult 在 stage 结束时调用（来源：D-M9-7，M4 collector 契约）
verify-code 执行完毕（success 或 failure）后调用 updateOwnResult，更新 executed / tokens / duration_ms 等字段。不手写原始 jsonl 行。

**FR-METRICS-003** 双写 task-level + global（来源：M4 FR-COLLECT-006/007）
metrics 记录同时写入 task-level `task-metrics.jsonl` 和全局 metrics 路径，记录含 task_id / project 四标识符。

**FR-METRICS-004** 10 个核心字段全部结构性存在（来源：验收标准 4，record-schema.mjs）
每条 metrics 记录必须包含 record-schema.mjs 定义的全部 10 个核心字段（execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）作为键，缺任一键即判失败。

### FR-TEST（测试策略）

**FR-TEST-001** 三个关键脚本有单元测试覆盖（来源：D-M9-7）
capture 脚本、freshness 脚本、facts 组装脚本各有对应单元测试，覆盖正常路径和关键边界（command 缺失、sha 不匹配、anomaly_flags 非空）。

**FR-TEST-002** M9 自举端到端实跑（来源：D-M9-7）
M9 的三段闭环（make-decision → build-code → verify-code）通过 M9 自举任务实跑验证，不堆额外 E2E 框架。自举实跑走完整验收+收尾一次为验收依据。

**FR-TEST-003** CI 纳入 verify-code 冒烟 + 轻量三段闭环检查（来源：验收标准 5）
CI 配置包含两部分：
1. **verify-code 冒烟**：覆盖 capture / freshness / facts 组装三个脚本的单元测试（vitest）；
2. **轻量三段闭环检查**：CI 跑一个最小验证脚本，串起 make-decision → build-code → verify-code 三段产物链，检查 stage-result-build-code.json 可被读取（facts.tests.command 字段存在）、verify-code stage-result 落盘路径贯通。该检查不引入重型 E2E 基建，不模拟完整 UI 流程（按 D-M9-7/F10），只做产物链路贯通的结构性验证。CI 全部绿才视为交付完整。

### FR-REG（reuse-registry 登记）

**FR-REG-001** isolated-browser-qa 引入必须登记（来源：D-M9-4，D16）
将 isolated-browser-qa 抄入 workflowhub 后，在 reuse-registry.md 中登记：复用类别（改造适配）+ 来源路径（原 agenthub 路径）。引入未登记视为验收缺口。

---

## 5. 验收清单

> 承接 decision-log §7 五条可执行验收，每条可手动或命令验证。

- [ ] **验收 1 — 完整闭环跑通**：M9 自举任务跑完一次完整验收+收尾（fresh 测试跑通 → anomaly_flags 检查 → 浏览器验收 SKIP → 人工确认 → 合并/删分支）。任一环节缺失或静默跳过即失败。（来源：验收标准 1，D-M9-1/2/4/5）

- [ ] **验收 2 — 三段闭环连接**：make-decision → build-code → verify-code 三段全部打通，verify-code 成功读取 build-code 产出的 stage-result-build-code.json。三段任一断链即失败。（来源：验收标准 2）

- [ ] **验收 3 — 事实包消费**：verify-code 从 facts.tests.command 读取测试命令并执行（C1 同步后）。command 字段缺失时浮现明确错误而非静默跳过。stage-result facts.verdict 和 evidence_ref 均有效。（来源：验收标准 3，D-M9-3，C1，FR-CMD-001/002）

- [ ] **验收 4 — metrics 字段对齐**：task-metrics.jsonl 中含 verify-code 执行记录，全部 10 个核心字段（execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）均作为键存在，缺任一键即失败。（来源：验收标准 4，FR-METRICS-004）

- [ ] **验收 5 — CI 纳入**：CI 包含 verify-code 冒烟（capture / freshness / facts 组装单元测试）+ 轻量三段闭环检查（结构性验证 make-decision → build-code → verify-code 产物链路贯通，不引入重型 E2E 框架，见 FR-TEST-003 和 D-M9-7/F10 说明），CI 全部通过后视为交付完整。（来源：验收标准 5，FR-TEST-003）

---

## 6. 关键实体

**stage-result（verify-code 产出）**（来源：D-M9-6 落盘路径约定；七键结构沿用 build-code 既有 stage-result 约定，属实现契约而非 decision-log 明文 schema）：

- `status`：success | failure
- `error_code`：失败原因描述（success 时为空字符串）
- `retryable`：布尔，command 缺失等可重试类错误为 true
- `facts`：验收事实对象
  - `verdict`：pass | fail（由测试结果决定，非鲜度）
  - `evidence_ref`：相对 `specs/{task-id}/` 根的 final-test-report.md 路径
  - `anomaly_flags`：警告列表，目前定义值为 "stale_sha"；空列表表示无异常
- `missing_items`：未执行验收项清单（如浏览器验收 SKIP 时记录；测试跑了但失败不属于此字段范畴）
- `user_decision`：布尔，合并/删分支前人工确认结果
- `reason`：人可读的结论描述

**build-code 事实包中 verify-code 消费的字段**：

- `facts.tests.command`：verify-code 执行的测试命令（C1 新增字段，原有 red_exit_code / green_baseline_hash 等字段不变）
- `facts.review.verdict`：M8 审查结论（verify-code 可用于报告，非执行依据）

**M4 metrics 核心字段（10 个）**：execution_id、skill_or_stage、stage、skill_version、executed、tokens、duration_ms、rework_rounds、human_intervention、friction_ref（定义见 `metrics/record-schema.mjs`）。

---

## 7. 数据和生命周期

- **数据粒度**：以一次 verify-code skill 执行（单任务验收）为单位，产出一份 stage-result + 一份 final-test-report.md。
- **数据时效**：stage-result 在 skill 执行结束时落 durable，之后不变更（只读）。
- **补传策略**：若中途失败，已采集的部分事实写入 stage-result，失败原因浮现，不覆盖已有报告。
- **当前 vs 历史**：stage-result 落固定路径 `specs/{task-id}/stage-result-verify-code.json`，同一 task 重跑（rerun）会覆盖前次结果；不同 task 靠 task-id 目录自然隔离。如需保留历史快照，调用方在 rerun 前自行备份，verify-code 本身不做多版本管理。
- **metrics 生命周期**：recordSkeleton 在 stage 开始即写入（metrics 写失败只 warn 不 throw，继承 M4 metrics collector 的写失败保护语义，对齐 CONSTITUTION F3/Q1 记事实非 blocking）；updateOwnResult 在 stage 结束补全；任何一次写失败不阻断 skill 主流程。

---

## 8. 兼容性预留

- **facts.tests.command 向后兼容**：C1 在 build-code 侧新增 command 字段属于追加，已有 red_exit_code / green_baseline_hash 等字段语义不变，现有消费方不受影响。
- **anomaly_flags 扩展预留**：当前定义值仅 "stale_sha"，未来可追加新值，已有消费方按已知值处理即可，不识别的值视为告知性警告。
- **stage-result 契约预留**：verify-code stage-result 的 facts 结构 design 只加不删，M10 可在 facts 下追加新键，不破坏现有字段语义。
- **浏览器验收路径预留**：isolated-browser-qa 以 SKIP 分支兼容无 UI 场景，未来有 UI task 可直接走执行分支，不需修改 verify-code 主流程。

---

## 9. 不做和隐性必达

### 明确不做（来源：decision-log §5）

- 不复用 M8 已有测试结果作为本次验收证据（D-M9-1，fresh verification 原则）
- 不把鲜度校验做成 BLOCK / exit2（违 D5/D7，agenthub 历史失败根因）
- 不自动合并/删分支不问人（违 D6）
- v1 不做 verify-change full 模式（超出 M9 scope）
- 不做 M10 基线对照工具（M9 只产数据，对照是 M10 的事）
- 浏览器验收不真实跑 UI（M9 自举任务无 UI，走 SKIP 分支）
- 不照搬 agenthub 实现（C4，D21：按 spec 重写）

### 隐性必达

- anomaly_flags 非空时 skill 执行边界必须有可见输出，不得静默
- stage-result 落 durable 路径，skill 进程结束后仍可读
- command 字段缺失时浮现明确 error_code，不静默回退默认命令
- user_decision:false 时合并/删分支绝不执行
- isolated-browser-qa 抄入后所有 agenthub 硬编码路径必须替换，在 reuse-registry.md 登记来源
- metrics 写失败只 warn 不 throw，不阻断 skill 主流程（继承 M4 metrics collector 写失败保护语义，对齐 CONSTITUTION F3/Q1）

---

## 10. 验收清单及未决问题

### 验收检查

- [ ] 本 spec 共 24 条 FR（FR-FRESH 4 + FR-CMD 3 + FR-BROWSER 3 + FR-CLOSE 3 + FR-PATH 3 + FR-METRICS 4 + FR-TEST 3 + FR-REG 1 = 24），每条 FR 可追溯回 decision-log.md 来源字段
- [ ] 与 decision-log.md（m9-verify-code）一致，每条 FR 可追溯回来源字段
- [ ] 用户场景覆盖正常（3.1/3.2/3.3/3.4）、失败（3.5/3.6）、边界（3.7/3.8/3.9/3.10）路径，≥8 条
- [ ] 含至少两条失败场景（3.5 command 缺失、3.6 测试失败）
- [ ] 含至少三条边界场景（3.7 用户拒绝、3.8 事实包消费、3.9 metrics 双写、3.10 有 UI 项）
- [ ] A 档五章齐全（场景 / FR / 不做 / 验收 / 影响范围）
- [ ] 验收条目可手动或命令验证
- [ ] 不含绝对文件路径、TypeScript/JS interface 定义、shell 命令块作为需求
- [ ] 业务影响范围已写第 11 章

### 未决问题和风险

无。所有七条决策（D-M9-1 ~ D-M9-7）、四条约束（C1~C4）、五条验收标准均由用户在 intake 第 5 步明确批准落盘，无开放问题。

---

## 11. 影响范围（业务性质）

- **受影响功能：verify-code skill**
  - 既有行为：64 行空骨架（SKILL.md），无 .mjs 脚本，不可运行
  - 本需求影响：升为 v1 可运行 skill，覆盖 fresh 验证/鲜度警告/浏览器验收可选/终态收尾/metrics 接入五大能力
  - 回归要点：原有骨架定义的接口（stage-result 结构、M4 metrics 字段契约）不被破坏

- **受影响功能：build-code facts.tests（C1 同步）**
  - 既有行为：facts.tests 含 red_exit_code / green_baseline_hash 等字段，无 command 字段
  - 本需求影响：新增 command 字段（向后兼容追加），同步更新 build-code 侧 facts-schema.mjs 和 SKILL.md
  - 回归要点：已有 changed/tests/review 三键消费方不受影响；M8 已合并 main，新增字段属可选扩展

- **受影响功能：三段闭环（make-decision → build-code → verify-code）**
  - 既有行为：make-decision（M7）和 build-code（M8）已交付，verify-code 断链
  - 本需求影响：verify-code 接入后三段全部打通，闭环首次可运行
  - 回归要点：make-decision 和 build-code 内部逻辑不被 M9 修改；三段之间仅通过 stage-result JSON 文件传递数据

- **受影响功能：isolated-browser-qa（抄入改造）**
  - 既有行为：isolated-browser-qa 存在于 agenthub 路径，含硬编码 agenthub 路径
  - 本需求影响：复制至 workflowhub 本地，去除 agenthub 硬编码路径；reuse-registry.md 新增条目
  - 回归要点：agenthub 原件不被修改；workflowhub 本地副本仅供 verify-code 消费；SKIP 分支确保无 UI task 不受影响

- **受影响功能：M4 metrics 底座（collector.mjs）**
  - 既有行为：collector.mjs 已交付，现有消费方（make-decision/build-code）正常使用
  - 本需求影响：verify-code 首次在 stage 5 接入 collector，不修改 collector.mjs 本身
  - 回归要点：collector.mjs 不被修改；现有消费方不受影响；metrics 写失败只 warn 不 throw 保护 skill 主流程（对齐 CONSTITUTION F3/Q1）

- **可能受冲击的业务规则**：D5（记事实非 blocking）和 D6（不可逆操作不越人界）是本需求核心约束，任何实现不得把 anomaly_flags 升级为 FAIL，不得跳过 user_decision 确认步骤

- **明确无影响**：design/plan 上游 workflow 内部逻辑；Multica web/mobile/desktop 前端；agenthub harness / gate 执行框架内部（verify-code 走 agenthub vibecoding harness 自举执行，不修改 harness）

---

> 本 spec 基于 decision-log.md（m9-verify-code）所有已批准决策撰写。七条决策、四条约束、五条验收标准均有 FR 对应追溯。
```
## 被审对象1: 修订后 plan.md
```markdown
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
```
## 被审对象2: 修订后 tasks.md
```markdown
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
```

## 输出
逐条核round2的2个blocking+3个非阻断是否真修(修了/没修/修偏)+有无新引入问题。给 verdict: pass/revise_required/escalate_to_human。仍有blocking指明file:section+违反需求。如全修无新blocking请明确给pass。
2026-06-26T05:42:23.140881Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
我会按复审口径只核对这版 `plan.md`/`tasks.md` 文本，不扩大到实现代码。重点先验 round2 两个 blocking 是否被计划和任务同时覆盖，再扫有没有新 blocking。
exec
/bin/bash -lc "sed -n '1,220p' /Users/Hugh/.claude/skills/gstack/review/SKILL.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
---
name: review
preamble-tier: 4
version: 1.0.0
description: Pre-landing PR review. (gstack)
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - Agent
  - AskUserQuestion
  - WebSearch
triggers:
  - review this pr
  - code review
  - check my diff
  - pre-landing review
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->


## When to invoke this skill

Analyzes diff against the base branch for SQL safety, LLM trust
boundary violations, conditional side effects, and other structural issues. Use when
asked to "review this PR", "code review", "pre-landing review", or "check my diff".
Proactively suggest when the user is about to merge or land code changes.

## Preamble (run first)

```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || .claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.gstack/sessions
touch ~/.gstack/sessions/"$PPID"
_SESSIONS=$(find ~/.gstack/sessions -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find ~/.gstack/sessions -mmin +120 -type f -exec rm {} + 2>/dev/null || true
_PROACTIVE=$(~/.claude/skills/gstack/bin/gstack-config get proactive 2>/dev/null || echo "true")
_PROACTIVE_PROMPTED=$([ -f ~/.gstack/.proactive-prompted ] && echo "yes" || echo "no")
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
_SKILL_PREFIX=$(~/.claude/skills/gstack/bin/gstack-config get skill_prefix 2>/dev/null || echo "false")
echo "PROACTIVE: $_PROACTIVE"
echo "PROACTIVE_PROMPTED: $_PROACTIVE_PROMPTED"
echo "SKILL_PREFIX: $_SKILL_PREFIX"
source <(~/.claude/skills/gstack/bin/gstack-repo-mode 2>/dev/null) || true
REPO_MODE=${REPO_MODE:-unknown}
echo "REPO_MODE: $REPO_MODE"
_SESSION_KIND=$(~/.claude/skills/gstack/bin/gstack-session-kind 2>/dev/null || echo "interactive")
case "$_SESSION_KIND" in spawned|headless|interactive) ;; *) _SESSION_KIND="interactive" ;; esac
echo "SESSION_KIND: $_SESSION_KIND"
_LAKE_SEEN=$([ -f ~/.gstack/.completeness-intro-seen ] && echo "yes" || echo "no")
echo "LAKE_INTRO: $_LAKE_SEEN"
_TEL=$(~/.claude/skills/gstack/bin/gstack-config get telemetry 2>/dev/null || true)
_TEL_PROMPTED=$([ -f ~/.gstack/.telemetry-prompted ] && echo "yes" || echo "no")
_TEL_START=$(date +%s)
_SESSION_ID="$$-$(date +%s)"
echo "TELEMETRY: ${_TEL:-off}"
echo "TEL_PROMPTED: $_TEL_PROMPTED"
_EXPLAIN_LEVEL=$(~/.claude/skills/gstack/bin/gstack-config get explain_level 2>/dev/null || echo "default")
if [ "$_EXPLAIN_LEVEL" != "default" ] && [ "$_EXPLAIN_LEVEL" != "terse" ]; then _EXPLAIN_LEVEL="default"; fi
echo "EXPLAIN_LEVEL: $_EXPLAIN_LEVEL"
_QUESTION_TUNING=$(~/.claude/skills/gstack/bin/gstack-config get question_tuning 2>/dev/null || echo "false")
echo "QUESTION_TUNING: $_QUESTION_TUNING"
mkdir -p ~/.gstack/analytics
if [ "$_TEL" != "off" ]; then
echo '{"skill":"review","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(_repo=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null | tr -cd 'a-zA-Z0-9._-'); echo "${_repo:-unknown}")'"}'  >> ~/.gstack/analytics/skill-usage.jsonl 2>/dev/null || true
fi
for _PF in $(find ~/.gstack/analytics -maxdepth 1 -name '.pending-*' 2>/dev/null); do
  if [ -f "$_PF" ]; then
    if [ "$_TEL" != "off" ] && [ -x "~/.claude/skills/gstack/bin/gstack-telemetry-log" ]; then
      ~/.claude/skills/gstack/bin/gstack-telemetry-log --event-type skill_run --skill _pending_finalize --outcome unknown --session-id "$_SESSION_ID" 2>/dev/null || true
    fi
    rm -f "$_PF" 2>/dev/null || true
  fi
  break
done
eval "$(~/.claude/skills/gstack/bin/gstack-slug 2>/dev/null)" 2>/dev/null || true
_LEARN_FILE="${GSTACK_HOME:-$HOME/.gstack}/projects/${SLUG:-unknown}/learnings.jsonl"
if [ -f "$_LEARN_FILE" ]; then
  _LEARN_COUNT=$(wc -l < "$_LEARN_FILE" 2>/dev/null | tr -d ' ')
  echo "LEARNINGS: $_LEARN_COUNT entries loaded"
  if [ "$_LEARN_COUNT" -gt 5 ] 2>/dev/null; then
    ~/.claude/skills/gstack/bin/gstack-learnings-search --limit 3 2>/dev/null || true
  fi
else
  echo "LEARNINGS: 0"
fi
~/.claude/skills/gstack/bin/gstack-timeline-log '{"skill":"review","event":"started","branch":"'"$_BRANCH"'","session":"'"$_SESSION_ID"'"}' 2>/dev/null &
_HAS_ROUTING="no"
if [ -f CLAUDE.md ] && grep -q "## Skill routing" CLAUDE.md 2>/dev/null; then
  _HAS_ROUTING="yes"
fi
_ROUTING_DECLINED=$(~/.claude/skills/gstack/bin/gstack-config get routing_declined 2>/dev/null || echo "false")
echo "HAS_ROUTING: $_HAS_ROUTING"
echo "ROUTING_DECLINED: $_ROUTING_DECLINED"
_VENDORED="no"
if [ -d ".claude/skills/gstack" ] && [ ! -L ".claude/skills/gstack" ]; then
  if [ -f ".claude/skills/gstack/VERSION" ] || [ -d ".claude/skills/gstack/.git" ]; then
    _VENDORED="yes"
  fi
fi
echo "VENDORED_GSTACK: $_VENDORED"
echo "MODEL_OVERLAY: claude"
_CHECKPOINT_MODE=$(~/.claude/skills/gstack/bin/gstack-config get checkpoint_mode 2>/dev/null || echo "explicit")
_CHECKPOINT_PUSH=$(~/.claude/skills/gstack/bin/gstack-config get checkpoint_push 2>/dev/null || echo "false")
echo "CHECKPOINT_MODE: $_CHECKPOINT_MODE"
echo "CHECKPOINT_PUSH: $_CHECKPOINT_PUSH"
# Plan-mode hint for skills like /spec that branch behavior on plan-mode state.
# Claude Code exposes plan mode via system reminders; we detect best-effort
# from CLAUDE_PLAN_FILE (set by the harness when plan mode is active) and
# fall back to "inactive". Codex hosts and Claude execution mode both end up
# inactive, which is the safe default (defaults to file+execute pipeline).
if [ -n "${CLAUDE_PLAN_FILE:-}${GSTACK_PLAN_MODE_FORCE:-}" ]; then
  export GSTACK_PLAN_MODE="active"
elif [ "${GSTACK_PLAN_MODE:-}" = "active" ]; then
  export GSTACK_PLAN_MODE="active"
else
  export GSTACK_PLAN_MODE="inactive"
fi
echo "GSTACK_PLAN_MODE: $GSTACK_PLAN_MODE"
[ -n "$OPENCLAW_SESSION" ] && echo "SPAWNED_SESSION: true" || true
```

## Plan Mode Safe Operations

In plan mode, allowed because they inform the plan: `$B`, `$D`, `codex exec`/`codex review`, writes to `~/.gstack/`, writes to the plan file, and `open` for generated artifacts.

## Skill Invocation During Plan Mode

If the user invokes a skill in plan mode, the skill takes precedence over generic plan mode behavior. **Treat the skill file as executable instructions, not reference.** Follow it step by step starting from Step 0; the first AskUserQuestion is the workflow entering plan mode, not a violation of it. AskUserQuestion (any variant — `mcp__*__AskUserQuestion` or native; see "AskUserQuestion Format → Tool resolution") satisfies plan mode's end-of-turn requirement. If AskUserQuestion is unavailable or a call fails, follow the AskUserQuestion Format failure fallback: `headless` → BLOCKED; `interactive` → the prose fallback (also satisfies end-of-turn). At a STOP point, stop immediately. Do not continue the workflow or call ExitPlanMode there. Commands marked "PLAN MODE EXCEPTION — ALWAYS RUN" execute. Call ExitPlanMode only after the skill workflow completes, or if the user tells you to cancel the skill or leave plan mode.

If `PROACTIVE` is `"false"`, do not auto-invoke or proactively suggest skills. If a skill seems useful, ask: "I think /skillname might help here — want me to run it?"

If `SKILL_PREFIX` is `"true"`, suggest/invoke `/gstack-*` names. Disk paths stay `~/.claude/skills/gstack/[skill-name]/SKILL.md`.

If output shows `UPGRADE_AVAILABLE <old> <new>`: read `~/.claude/skills/gstack/gstack-upgrade/SKILL.md` and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise AskUserQuestion with 4 options, write snooze state if declined).

If output shows `JUST_UPGRADED <from> <to>`: print "Running gstack v{to} (just updated!)". If `SPAWNED_SESSION` is true, skip feature discovery.

Feature discovery, max one prompt per session:
- Missing `~/.claude/skills/gstack/.feature-prompted-continuous-checkpoint`: AskUserQuestion for Continuous checkpoint auto-commits. If accepted, run `~/.claude/skills/gstack/bin/gstack-config set checkpoint_mode continuous`. Always touch marker.
- Missing `~/.claude/skills/gstack/.feature-prompted-model-overlay`: inform "Model overlays are active. MODEL_OVERLAY shows the patch." Always touch marker.

After upgrade prompts, continue workflow.

If `WRITING_STYLE_PENDING` is `yes`: ask once about writing style:

> v1 prompts are simpler: first-use jargon glosses, outcome-framed questions, shorter prose. Keep default or restore terse?

Options:
- A) Keep the new default (recommended — good writing helps everyone)
- B) Restore V0 prose — set `explain_level: terse`

If A: leave `explain_level` unset (defaults to `default`).
If B: run `~/.claude/skills/gstack/bin/gstack-config set explain_level terse`.

Always run (regardless of choice):
```bash
rm -f ~/.gstack/.writing-style-prompt-pending
touch ~/.gstack/.writing-style-prompted
```

Skip if `WRITING_STYLE_PENDING` is `no`.

If `LAKE_INTRO` is `no`: say "gstack follows the **Boil the Ocean** principle — do the complete thing when AI makes marginal cost near-zero. Read more: https://garryslist.org/posts/boil-the-ocean" Offer to open:

```bash
open https://garryslist.org/posts/boil-the-ocean
touch ~/.gstack/.completeness-intro-seen
```

Only run `open` if yes. Always run `touch`.

If `TEL_PROMPTED` is `no` AND `LAKE_INTRO` is `yes`: ask telemetry once via AskUserQuestion:

> Help gstack get better. Share usage data only: skill, duration, crashes, stable device ID. No code or file paths. Your repo name is recorded locally only and stripped before any upload.

Options:
- A) Help gstack get better! (recommended)
- B) No thanks

If A: run `~/.claude/skills/gstack/bin/gstack-config set telemetry community`

If B: ask follow-up:

> Anonymous mode sends only aggregate usage, no unique ID.

Options:
- A) Sure, anonymous is fine
- B) No thanks, fully off

If B→A: run `~/.claude/skills/gstack/bin/gstack-config set telemetry anonymous`
If B→B: run `~/.claude/skills/gstack/bin/gstack-config set telemetry off`

Always run:
```bash
touch ~/.gstack/.telemetry-prompted
```

Skip if `TEL_PROMPTED` is `yes`.

If `PROACTIVE_PROMPTED` is `no` AND `TEL_PROMPTED` is `yes`: ask once:

> Let gstack proactively suggest skills, like /qa for "does this work?" or /investigate for bugs?

Options:
- A) Keep it on (recommended)
- B) Turn it off — I'll type /commands myself

If A: run `~/.claude/skills/gstack/bin/gstack-config set proactive true`
If B: run `~/.claude/skills/gstack/bin/gstack-config set proactive false`

Always run:
```bash
touch ~/.gstack/.proactive-prompted

exec
/bin/bash -lc 'pwd && rg --files specs/m9-verify-code 2>/dev/null || true' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
/Users/Hugh/Hugh/Project/workflowhub
specs/m9-verify-code/tasks.md
specs/m9-verify-code/plan.md
specs/m9-verify-code/spec.md

codex
已确认本轮要审的是仓库里的 `specs/m9-verify-code/plan.md` 和 `tasks.md`。我现在按 round2 清单逐项定位原文，避免只凭贴文印象判断。
exec
/bin/bash -lc "sed -n '110,260p' specs/m9-verify-code/plan.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
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

exec
/bin/bash -lc "rg -n \"ci-chain-check|make-decision|build-code/SKILL|facts.tests.command|total_tasks|buildResultPath|buildResult|\\|\\| echo|readCommand\" specs/m9-verify-code/plan.md specs/m9-verify-code/tasks.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
specs/m9-verify-code/plan.md:14:**上游依赖**：M8 已交付（build-code v1 / facts-schema.mjs / metrics/collector.mjs 可用）；M7 已交付（make-decision skill 可用）
specs/m9-verify-code/plan.md:30:| F2 窄契约 | YES | stage-result 七键契约最小固定，与 build-code 仅通过 facts.tests.command 单字段对接 |
specs/m9-verify-code/plan.md:67:- build-code 侧 command 字段（C1）：YES — FR-CMD-003，verify-code 消费 facts.tests.command；M8 已交付但此字段缺失
specs/m9-verify-code/plan.md:123:└── .github/workflows/ci.yml                # 【修改】CI 新增两步：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查（检查 make-decision 产物 → build-code stage-result + command 字段 → verify-code stage-result 路径，覆盖完整三段产物链）
specs/m9-verify-code/plan.md:133:| `workflows/verify-code/facts-assembly.mjs` | 新建 | 纯函数：`readCommand(buildResult)` 读 command 字段（接收已解析 JSON 对象，缺失抛明确错误）；`assembleStageResult(opts)` 组装七键 stage-result；`writeStageResult(path, result)` 写 durable |
specs/m9-verify-code/plan.md:135:| `workflows/build-code/facts-schema.mjs` | 修改 | C1：`validateFacts` 对 `facts.tests.command` 字段做**可选校验**——字段存在时校验类型为 string，字段缺失时仍合法（向后兼容 M8 旧产物，不把旧 facts 判非法）；`buildTestsFact` 新增可选 command 参数 |
specs/m9-verify-code/plan.md:136:| `workflows/build-code/SKILL.md` | 修改 | C1：声明 build-code 产出的 `facts.tests` 必须包含 `command` 字段；使 build-code skill 与 facts-schema.mjs 的可选校验契约对齐，确保新产物实际写出 command（FR-CMD-003，C1） |
specs/m9-verify-code/plan.md:141:| `.github/workflows/ci.yml` | 修改 | 新增两步：① verify-code 冒烟（`vitest run tests/verify-code-*.test.mjs --passWithNoTests=false`）；② 轻量三段闭环检查（检查 make-decision 产物存在可读 → 验证 build-code stage-result-build-code.json 可读且 facts.tests.command 存在 → 验证 verify-code stage-result 落盘路径结构，覆盖完整三段 make-decision → build-code → verify-code，不引入重型 E2E 框架） |
specs/m9-verify-code/plan.md:153:| build-code facts.tests.command（C1） | workflows/build-code/facts-schema.mjs + workflows/build-code/SKILL.md | 扩展 |
specs/m9-verify-code/plan.md:282:| command 字段缺失（FR-CMD-002） | 构造缺 command 的 build-result，验证 `readCommand` 抛明确错误 |
specs/m9-verify-code/plan.md:319:1. **build-code facts.tests.command（C1）**（FR-CMD-003）：`workflows/build-code/facts-schema.mjs` 的 `validateFacts` 对 `facts.tests.command` 做**可选字段校验**——present 时校验类型为 string，absent 时仍合法（不把历史 M8 旧 facts 判为 invalid，满足 C1 向后兼容要求）。`buildTestsFact` 新增可选 command 参数，新产物写入该字段。verify-code 侧读到旧包缺 command 时 status="failure" 并给明确错误（这是 verify-code 的消费行为，不是 schema 非法）。已有消费方读 `red_exit_code`/`green_baseline_hash` 等字段不受影响（追加语义）。**同步改动**：`workflows/build-code/SKILL.md` 需声明 build-code 产出的 `facts.tests` 必须包含 `command` 字段，确保 skill 行为与 schema 契约一致，让 verify-code 输入可靠（C1 + FR-CMD-003 要求同步两件）。
specs/m9-verify-code/plan.md:332:| schema | 运行时 facts schema 改，项目级/平台级 schema 不改 | `workflows/build-code/facts-schema.mjs` 新增 command 可选字段校验（C1）；`workflows/build-code/SKILL.md` 声明产出必须包含 command 字段（C1）；项目级 CLAUDE.md / 平台 schema 文件不改 | Task 3.3 + Task 3.5 |
specs/m9-verify-code/plan.md:350:| FR-CMD-001 | facts-assembly.mjs readCommand；SKILL.md 读 facts.tests.command |
specs/m9-verify-code/plan.md:351:| FR-CMD-002 | facts-assembly.mjs readCommand 缺失抛错；verify-code-facts.test.mjs |
specs/m9-verify-code/plan.md:352:| FR-CMD-003 | workflows/build-code/facts-schema.mjs C1 追加 command 可选字段；workflows/build-code/SKILL.md 声明产出必须包含 command（C1 同步两件） |
specs/m9-verify-code/plan.md:368:| FR-TEST-003 | .github/workflows/ci.yml 新增两步：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查脚本（scripts/ci-chain-check.mjs：检查 make-decision 产物存在可读 → build-code stage-result-build-code.json 可读且 facts.tests.command 存在 → verify-code stage-result 落盘路径结构，覆盖完整三段 make-decision → build-code → verify-code 产物链，不引入重型 E2E 框架，满足验收标准 5 + D-M9-7/F10） |
specs/m9-verify-code/tasks.md:7:total_tasks: 19
specs/m9-verify-code/tasks.md:13:> 三段闭环：make-decision → build-code → verify-code
specs/m9-verify-code/tasks.md:181:  1. `readCommand(buildResult)` — 读 `facts.tests.command`（接收已解析的 JSON 对象），合法时返回 string
specs/m9-verify-code/tasks.md:182:  2. `facts.tests.command` 缺失时抛错，error message 包含 "command" 字样（FR-CMD-002，可证伪：删掉抛错逻辑后测试变红）
specs/m9-verify-code/tasks.md:196:  - 导出 `export function readCommand(buildResult)` — 接收已解析的 JSON 对象，不读文件
specs/m9-verify-code/tasks.md:200:  - readCommand 对 command 缺失抛 `{ message, retryable: true }` 结构的 Error
specs/m9-verify-code/tasks.md:206:- 出参：`workflows/build-code/facts-schema.mjs` 的 `validateFacts` 对 `facts.tests.command` 新增**可选字段校验**——字段 present 时校验类型为 string，字段 absent 时仍合法（不把历史 M8 旧 facts 判为 invalid，满足 C1 向后兼容要求）；如有 `buildTestsFact` 工厂函数，新增可选 command 参数
specs/m9-verify-code/tasks.md:220:- 出参：`workflows/build-code/SKILL.md` 补充说明——在 build-code 产出的 `facts.tests` 中必须包含 `command` 字段，使 skill 行为与 schema 契约对齐，确保 verify-code 消费侧能读到该字段
specs/m9-verify-code/tasks.md:225:  grep -n "command" /Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/SKILL.md
specs/m9-verify-code/tasks.md:228:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/build-code/SKILL.md`
specs/m9-verify-code/tasks.md:246:- readCommand 接受已解析 JSON 对象（不读文件），使测试无文件系统依赖
specs/m9-verify-code/tasks.md:277:  1. **前置读取**：读 `specs/{task-id}/stage-result-build-code.json`，提取 facts.tests.command（command 缺失时浮现错误并终止）
specs/m9-verify-code/tasks.md:330:grep -i "agenthub\|multica-agenthub" workflows/verify-code/isolated-browser-qa.md && echo "FAIL: hardcoded paths found" || echo "PASS: clean"
specs/m9-verify-code/tasks.md:354:在 CI 配置中新增两步：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查（结构性验证 make-decision → build-code → verify-code 产物链路贯通，不引入重型 E2E 框架，满足验收标准 5 同时遵守 D-M9-7/F10）。执行全量回归确认无新增失败；维护 plan.md 证据契约；明确 FR-TEST-002 验收出口。
specs/m9-verify-code/tasks.md:359:- `/Users/Hugh/Hugh/Project/workflowhub/scripts/ci-chain-check.mjs` — 新建，轻量三段闭环检查脚本
specs/m9-verify-code/tasks.md:370:- 出参 B：新建 `scripts/ci-chain-check.mjs`，实现轻量三段闭环结构检查，覆盖完整三段产物链：
specs/m9-verify-code/tasks.md:371:  1. **make-decision 段**：检查 make-decision 产物存在且可读（`specs/{task-id}/stage-result-make-decision.json` 或同等 make-decision 输出产物路径），验证其为合法 JSON 对象；
specs/m9-verify-code/tasks.md:372:  2. **build-code 段**：读取 `specs/{task-id}/stage-result-build-code.json`，验证 `facts.tests.command` 字段存在且类型为 string；验证该文件能正常解析（即 build-code 接上了 make-decision 的产物）；
specs/m9-verify-code/tasks.md:376:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/.github/workflows/ci.yml`、`/Users/Hugh/Hugh/Project/workflowhub/scripts/ci-chain-check.mjs`
specs/m9-verify-code/tasks.md:387:- 额外核实：`node --input-type=module --eval "import { readCommand } from './workflows/verify-code/facts-assembly.mjs'; console.log(typeof readCommand)"` 输出 `function`
specs/m9-verify-code/tasks.md:402:  1. M9 自举走完一次完整 verify-code 验收+收尾（make-decision → build-code → verify-code 三段全部真跑）即为 FR-TEST-002 证据；
specs/m9-verify-code/tasks.md:412:grep -c "verify-code\|ci-chain-check" /Users/Hugh/Hugh/Project/workflowhub/.github/workflows/ci.yml
specs/m9-verify-code/tasks.md:420:node --input-type=module --eval "import { readCommand } from './workflows/verify-code/facts-assembly.mjs'; console.log(typeof readCommand)"
specs/m9-verify-code/tasks.md:426:node --input-type=module --eval "import '/Users/Hugh/Hugh/Project/workflowhub/scripts/ci-chain-check.mjs'" 2>&1; echo "ci-chain-check import exit: $?"
specs/m9-verify-code/tasks.md:438:Phase 5 完成条件：`.github/workflows/ci.yml` 含 verify-code 冒烟步骤 + 轻量三段闭环检查步骤；`scripts/ci-chain-check.mjs` 可运行；全量 vitest run exit=0，所有 verify-code-*.test.mjs 跑到；三脚本均可 import；FR-TEST-002 验收出口已记录（Task 5.4）。

exec
/bin/bash -lc "sed -n '260,520p' specs/m9-verify-code/tasks.md" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:

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

codex
verdict: **pass**

round2 的 2 个 blocking 已修到 Plan 阶段可接受程度；未发现新的 blocking。仍有 1 个非阻断项修偏，但不足以要求第三次返修。

| 项 | 结论 | 核验 |
|---|---|---|
| blocking 1 | 修了 | CI 检查已补 make-decision 段 |
| blocking 2 | 修了 | C1 已纳入 build-code SKILL.md |
| 非阻断 total_tasks | 修了 | 19 与实际任务数一致 |
| 非阻断 readCommand 口径 | 修了 | 统一为 `readCommand(buildResult)` |
| 非阻断 `|| echo` 掩盖失败 | 修偏 | `|| echo` 去掉，但仍有 `; echo` |

**blocking 1：CI 三段闭环检查修偏**

结论：**修了**

证据：

- [plan.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md:141) 已写 CI 轻量三段检查：
  - make-decision 产物存在可读
  - build-code stage-result 可读且 `facts.tests.command` 存在
  - verify-code stage-result 路径结构检查
- [plan.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md:368) FR-TEST-003 明确映射到 `scripts/ci-chain-check.mjs`，覆盖 `make-decision → build-code → verify-code`。
- [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:370) Task 5.1 明确新增 `scripts/ci-chain-check.mjs`，并列出三段：
  - make-decision：产物存在且可读，合法 JSON
  - build-code：读取 `stage-result-build-code.json`，校验 `facts.tests.command`
  - verify-code：校验 `stage-result-verify-code.json` 路径结构

评价：这次不再只覆盖 build-code→verify-code。虽然“能接上 build-code”的检查仍偏结构性，不验证 make-decision 内容与 build-code 输入的强关联，但 spec 要求的是轻量链路检查，不建重型 E2E；当前写法满足 Plan 阶段要求。

**blocking 2：C1 漏同步 build-code SKILL.md**

结论：**修了**

证据：

- [plan.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md:135) 文件结构纳入 `workflows/build-code/facts-schema.mjs`。
- [plan.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md:136) 文件结构纳入 `workflows/build-code/SKILL.md`，声明 `facts.tests` 必须包含 `command`。
- [plan.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md:319) 集成章节明确 C1 同步两件：schema + SKILL.md。
- [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:220) Task 3.5 单列 build-code SKILL.md 修改任务。
- [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:225) 给了可证伪验证：`grep -n "command" workflows/build-code/SKILL.md`。

评价：已把 C1 从“只改 schema”修正为“schema + SKILL.md 同步”，并明确新产物必须写出 `facts.tests.command`。

**round2 非阻断复核**

1. `total_tasks 19 vs 18`

结论：**修了**

`tasks.md` front matter 写 `total_tasks: 19`，实际任务数为：

- Phase 1：3
- Phase 2：3
- Phase 3：5
- Phase 4：4
- Phase 5：4

合计 19。

2. `readCommand(buildResultPath vs buildResult)` 口径不一

结论：**修了**

现在主口径是 `readCommand(buildResult)`：

- [plan.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md:133)
- [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:181)
- [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:196)

没有再看到 `buildResultPath` 口径混用。

3. Phase 5 Verify 的 `|| echo` 掩盖脚本失败

结论：**修偏，非阻断**

原来的 `|| echo` 形态已基本移除，但 [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:426) 仍写：

```bash
node --input-type=module --eval "import '/Users/Hugh/Hugh/Project/workflowhub/scripts/ci-chain-check.mjs'" 2>&1; echo "ci-chain-check import exit: $?"
```

这行如果整体作为验证命令执行，最终 shell exit code 会是 `echo` 的 0，仍会弱化失败信号。建议实现阶段改成：

```bash
node --input-type=module --eval "import '/Users/Hugh/Hugh/Project/workflowhub/scripts/ci-chain-check.mjs'"
```

或：

```bash
node --input-type=module --eval "import '/Users/Hugh/Hugh/Project/workflowhub/scripts/ci-chain-check.mjs'"
status=$?
echo "ci-chain-check import exit: $status"
exit $status
```

但它位于手动 Verify 描述，不影响 Task 5.1 中 CI step 本身的要求，因此不升 blocking。

**新问题扫描**

未发现新的 blocking。

有一个实现阶段需注意的非阻断风险：Task 5.1 的 make-decision 路径写了“`stage-result-make-decision.json` 或同等 make-decision 输出产物路径”。实现时不要把“同等路径”做成宽松跳过；脚本必须有确定规则，否则 CI 检查会退化成文档声明。

最终结论：**pass**。
hook: Stop
hook: Stop Completed
tokens used
59,579

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
