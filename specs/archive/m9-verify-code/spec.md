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
