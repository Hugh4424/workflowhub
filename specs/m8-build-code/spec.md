# 功能规格：build-code v1

基于 decision-log.md（m8-build-code）。本文件不可覆盖项目级规则。

**功能名**: `m8-build-code`
**来源**: decision-log.md — M8 build-code v1（TDD/diff-only/审查记录/验收事实包）
**状态**: 草稿

---

## 速读卡（30 秒看懂这个需求）

**一句话需求**：让 build-code skill 能独立执行"写代码"段——TDD 红绿外部强制、子代理驱动、diff-only 越界拦截、审查记录持久化、验收事实包交付给 M9。

- **核心改动点**：
  - TDD 红绿物理事实机械采集（exit 码/Test Files 行/baseline 对比/内容 hash）并浮现，不 blocking
  - diff-only 越界检测：C2 清单内操作自动拦截并停等确认
  - 3rd-review standalone 异源调用，消费 verdict 三态，审查记录两态持久化
  - 验收事实包按 C1 最小字段契约落 durable，M9 可直接读
  - Worker-Mode/3rd-review/TDD 件引入并登记 reuse-registry

**最大影响面**：workflowhub workflows/build-code/ — 由空骨架升为 v1 可用 skill

**验收信号**：跑通一个真 phase RED → GREEN → 审查闭环（任一环缺失/隐藏即失败），且产出符合 C1 契约的事实包

---

## 1. 问题陈述

五段式开发流程（design → plan → build-code → verify-code → deploy）的"写代码"段目前是空骨架，无法独立调用。历史上的 agenthub apply 阶段深度耦合平台 harness + 重型 superpowers skill，积累了大量假绿/孤儿交付/审查自判缺口（RED/GREEN 造假、证据落临时目录蒸发、子代理写错位置/擅自 commit、审查同源自判无意义）。M8 要在 workflowhub 从头重建一个薄核心的 build-code v1，质量形态按"记事实+浮现而非 blocking"（D5/D7），通过外部成熟件（Worker-Mode/3rd-review）保持核心轻量，并产出结构化验收事实包弥补 M8→M9 缝隙。

---

## 2. 背景、目标和边界

### 背景

workflowhub 轻结构 repo，M7 已交付（make-decision workflow + reuse-registry.md）。build-code 空骨架已存在（M6 留存）。contracts/ 五契约齐（含 stage-result）。3rd-review 已独立成外部 repo，提供脱平台独立入口。Worker-Mode 插件提供 implementer/qa/reviewer 等 worker，零项目绑定。

上游决策承接：D5（记事实）、D6（不越人界）、D8（异源审查默认、同源降级合法）、D15（复用分层）、D16（外部 skill 源路径登记）、D16a（不自研派发）、D21（断宿主路径硬编码）。

### 目标

将 build-code skill 从空骨架升为 v1 可运行版本，覆盖四个一级方向要素，满足 roadmap M8 五条可执行验收。

### 边界

- 仅覆盖"写代码"段；design/plan 是上游（不含），verify-code 是下游 M9（不含）
- build-code 本体只做 Worker-Mode/3rd-review 不覆盖的核心
- 交付物写进 workflowhub repo（自举，D-M8-1）
- worktree 在被开发的目标项目 repo 内开，路径可配置（D-M8-2）
- 验收靶子用与 build-code 无关的独立小目标任务（消除循环验证风险，D-M8-3）

---

## 3. 用户场景与使用场景

> 复杂需求，≥8 条场景，含正常/边界/失败路径。每条用大白话，给/当/那么格式。

### 场景 3.1（正常）完整 TDD 闭环
给定：build-code skill 被调起，目标 phase 有明确测试文件，当前工作树干净。
当：skill 按 RED → implementer 写代码 → GREEN 顺序推进。
那么：采集到 RED exit 码非零、GREEN exit 码为零，baseline 对比失败数下降，内容 hash 有别，三项物理事实同时浮现并落 durable。

### 场景 3.2（正常）异源审查消费 pass
给定：GREEN 已通过，skill 调起 3rd-review standalone 入口喂真实 diff。
当：审查员返回 verdict=pass。
那么：facts.review.status=executed，source=third_party，verdict=pass，artifact_path 指向审查报告 durable 路径，事实包落盘完整。

### 场景 3.3（正常）审查返回 revise_required
给定：3rd-review 返回 verdict=revise_required。
当：skill 消费 verdict。
那么：facts.review.verdict=revise_required 如实记录，skill 浮现返修提示，不自动推进至下游。

### 场景 3.4（失败）审查未被调用
给定：某次执行审查步骤被跳过（模拟网络断开或参数缺失）。
当：skill 完成 GREEN 后未成功调用审查。
那么：facts.review.status=not_executed 记录在事实包，stage 边界浮现提示"审查未执行"，不被静默隐藏。

### 场景 3.5（失败）RED 阶段 exit 码为零（假红）
给定：implementer 写测试后直接跑出 exit 0（测试未真正设计为失败）。
当：TDD 采集器读到 exit 码为零。
那么：采集器记录 red_exit_code=0 并浮现警告"RED 阶段未真红"，不 blocking 推进，但事实包中异常状态可见。

### 场景 3.6（失败/边界）diff-only 越界拦截
给定：implementer 在工作过程中触碰 C2 清单内操作（如修改 package.json 或触发 git push）。
当：build-code diff-only 扫描器检测到越界操作。
那么：skill 停等确认，不自动执行该操作，越界操作类型浮现，等待人工决策。

### 场景 3.7（边界）同源降级审查
给定：3rd-review standalone 不可用，skill 降级为同源审查。
当：事实包落盘。
那么：facts.review.status=executed（审查被调用，非未执行）、facts.review.source=same_source（标记降级，区别于 third_party），verdict 照常记录，M9 读到时可区分真异源 vs 同源降级（来源：C4，D8）。

### 场景 3.8（边界）验收事实包下游读取
给定：M8 执行完毕，事实包落 durable 路径。
当：M9 verify-code 读取事实包。
那么：facts.changed、facts.tests、facts.review 三键均存在，M9 无需额外转换即可消费。

### 场景 3.9（边界）worktree 路径可配置
给定：build-code skill 被用于两个不同目标项目 repo（分别在不同本地路径）。
当：调用者传入不同 worktree 根路径配置。
那么：skill 在各自目标 repo 内开平级 worktree，不硬编码路径，不上溯至宿主 agenthub repo。

### 场景 3.10（边界）reuse-registry 引入未登记拦截
给定：新引入一个 skill（如新 TDD 件）但未在 reuse-registry.md 登记类别和来源路径。
当：build-code v1 完成交付后核查 reuse-registry。
那么：该 skill 的引入可被检测为"引入未登记"缺口，视为验收失败。

---

## 4. 功能需求

> 每条标来源（D-M8-x / Cx / Dx），可追溯回 decision-log。

### FR-TDD（TDD 红绿外部强制 + 证据采集）

**FR-TDD-001** 机械采集 RED 物理事实（来源：D5/D7，D-M8-1）
build-code 在 RED 阶段完成后，必须从外部读取三项物理信号：测试进程 exit 码、Test Files 行内容、当前测试输出内容 hash。三项信号均采集后写入 facts.tests。不依赖 implementer 自报。

**FR-TDD-002** 机械采集 GREEN 物理事实（来源：D5/D7，D-M8-1）
GREEN 阶段后，同样采集 exit 码、Test Files 行、内容 hash，与 RED 基线对比（失败数变化、hash 是否变更）。对比结果写入 facts.tests，含 green_baseline_hash 字段。不得依赖 implementer 自报测试结果，必须由 build-code 外部独立采集物理信号。

**FR-TDD-003** RED 假红检测与浮现（来源：D5，C1）
若 RED 阶段采集到 exit 码为零，判定为可疑假红，浮现警告，记录 red_exit_code=0 至 facts.tests。不 blocking 推进（符合 D5/D7 记事实非 blocking）。可观测合同：facts.tests 含 anomaly_flags 字段，其中枚举值 suspicious_red_exit 表示假红可疑；stage 边界输出含 warning 类型条目，内容包含"RED 阶段未真红"字样。验收人可通过读取 facts.tests.anomaly_flags 和 stage 边界输出客观判定浮现是否发生，不依赖主观判断。

**FR-TDD-004** GREEN 假绿检测与浮现（来源：D5，D7）
若 GREEN exit 码为零但内容 hash 与 RED 阶段相同（或 Test Files 行为空），判定为可疑假绿，浮现警告，记录异常状态至 facts.tests。不 blocking 推进。可观测合同：facts.tests 含 anomaly_flags 字段，其中枚举值 suspicious_green_exit（hash 未变）或 green_test_files_empty（Test Files 行为空）表示假绿可疑；stage 边界输出含 warning 类型条目，内容包含"GREEN 阶段疑似假绿"字样。验收人可通过读取 facts.tests.anomaly_flags 和 stage 边界输出客观判定浮现是否发生。

**FR-TDD-005** TDD 证据落 durable（来源：D5，D-M8-5）
facts.tests 下所有字段在阶段结束前落 task durable 路径，不落临时路径。证据必须在 skill 进程结束后仍可读。不得写入系统易失路径（如临时目录或内存缓冲区），否则进程退出后证据不可达。

### FR-DIFF（diff-only 越界检测）

**FR-DIFF-001** 越界清单扫描（来源：D6，C2）
build-code 在执行期间持续监测是否有 C2 清单内的越界操作被触发：不可逆 git 操作（推送/删分支/强制覆盖/破坏性重置远程）、外部依赖变更（package.json/pnpm-lock.yaml/go.mod/go.sum/插件 semver）、生产配置修改（.env/.env.production/deploy*/infra*/ci* 路径）。

**FR-DIFF-002** 越界操作停等（来源：D6）
检测到 C2 清单内操作时，build-code 停止执行该操作，浮现越界类型，等待明确的人工确认后才继续，不自动执行。

**FR-DIFF-003** 清单外操作自由通过（来源：C2）
C2 清单之外的代码文件、测试文件修改不受拦截，build-code 不阻断这类操作。

### FR-PKG（验收事实包）

**FR-PKG-001** 事实包最小字段契约（来源：C1，D-M8-5）
build-code 产出的事实包必须包含三个顶层键：`facts.changed`（变更清单）、`facts.tests`（含 red_exit_code/green_baseline_hash 等测试事实，审查记录不混入此键）、`facts.review`（审查记录独立键，含 status/source/verdict/artifact_path）。design 可在此基础上加字段，不可删减。

**FR-PKG-002** 事实包 durable 落盘（来源：D-M8-5，D5）
事实包在 skill 执行结束前落 task durable 路径，路径格式与 stage-result 契约对齐，M9 可通过约定路径直接读取，无需额外传参。

**FR-PKG-003** M9 可直接消费（来源：D-M8-5，C1）
事实包格式必须与 stage-result 契约中的 facts 结构不冲突，M9 verify-code 读取时无需转换或适配。不得要求 M9 做 schema 转换、字段重映射或格式适配；M9 侧按 C1 契约直接读取，无需感知 M8 内部实现。

### FR-REVIEW（审查记录）

**FR-REVIEW-001** 3rd-review standalone 调用（来源：D-M8-4，D8）
build-code 默认调用 3rd-review 外部审查入口，输入真实 diff（非自然语言描述），消费三态 verdict（pass/revise_required/escalate_to_human）。禁止喂自然语言描述（防分类器降级至同源审查）。入口参数契约在 plan 阶段对照 3rd-review repo 落实，spec 不预设具体参数名。

**FR-REVIEW-002** 审查记录两态（来源：C3）
facts.review.status 必须记录两态之一：executed（审查被成功调用并有 verdict）或 not_executed（审查未被调用或调用失败）。缺字段即视为审查状态不可知。

**FR-REVIEW-003** 审查来源标记（来源：C1，C4，D8）
facts.review.source 记录：third_party（真异源）、same_source（同源降级，D8 合法）两值。M9 据此区分审查质量。用户主动跳过审查的情形用 facts.review.status=not_executed 表达（C3），不在 source 引入未批准的枚举值。同源降级（same_source）属于"真调了审查"，facts.review.status 仍记 executed，不记 not_executed；M9 靠 source 字段区分审查质量，而非靠 status 区分是否降级（来源：C4）。

**FR-REVIEW-004** not_executed 浮现（来源：C3）
当 facts.review.status=not_executed 时，skill 在 stage 边界结构化浮现提示"审查未执行"，不静默隐藏。可证伪性由构造场景测试承载（用户主动构造"审查没调"场景验记录如实）。可观测合同：facts.review.status=not_executed 时，stage 边界输出必须含 warning 类型条目，内容包含"审查未执行"字样；验收人可通过读取 facts.review.status 字段和 stage 边界输出客观判定浮现是否发生，被静默隐藏（字段存在但无 warning 输出）即判 fail。

**FR-REVIEW-005** 审查报告 durable 落盘（来源：D-M8-4，D-M8-5）
审查执行后，审查报告落 durable 路径，facts.review.artifact_path 指向该路径。

### FR-SUB（子代理驱动）

**FR-SUB-001** Worker-Mode 外部依赖调起（来源：D-M8-6，D16a）
build-code 通过 Worker-Mode 插件调起 implementer worker（写代码）和 qa worker（跑测试），不自研子代理派发机制。Worker-Mode 为外部依赖（semver），build-code 仅消费其标准接口。

**FR-SUB-002** implementer 绝对路径约束（来源：D21）
调起 implementer 时，任务路径必须使用绝对路径，禁止 implementer 擅自 commit，收到回报后核验实际 git 状态。

### FR-REG（reuse-registry 登记）

**FR-REG-001** 引入 skill 必须登记（来源：D15/D16）
M8 引入的每个外部依赖 skill（Worker-Mode/3rd-review/TDD 相关件）在 reuse-registry.md 登记：复用类别（外部依赖 semver / 外部依赖 standalone / 自研件）+ 来源路径。引入 skill 未登记视为缺口，验收第 5 条不过。

**FR-REG-002** TDD 件来源明确（来源：D15，D16）
TDD 证据采集复用项目内 tdd-red-green skill 的 capture 模式（外部 TDD 物理事实采集件现跑现采 RED/GREEN 物理事实），类别=改造适配（按 workflowhub 宪法重建接线，不照搬 agenthub 接线），来源路径登记 tdd-red-green skill。不引 superpowers TDD（纯纪律提示词，与 Worker-Mode implementer 内置纪律重复，不产可校验证据）。

### FR-WT（worktree 隔离）

**FR-WT-001** 目标 repo 内平级 worktree（来源：D-M8-2，D21）
build-code 在被开发的目标项目 repo 内开平级 worktree，worktree 根路径可通过配置传入，不硬编码，不上溯至宿主 agenthub repo 路径。

### FR-ACPT（验收靶子）

**FR-ACPT-001** 独立小目标任务当靶子（来源：D-M8-3）
M8 自举验收靶子=给 workflowhub 新建一个工具函数（纯函数级小功能，与 build-code 本身无关），消除"用 M8 验 M8 自身"的循环验证风险。验收时用该独立任务跑完整 RED → GREEN → 审查闭环。具体函数 plan 阶段可锁定。

---

## 5. 验收清单

> 承接 decision-log §7 五条可执行验收，每条可手动或命令验证。

- [ ] **验收 1 — TDD 完整闭环**：选独立小目标任务，用 build-code skill 跑完整 RED → GREEN → 审查。验证：facts.tests 中 red_exit_code 非零、GREEN 后 exit 码为零、green_baseline_hash 与 RED 阶段 hash 不同；facts.review.status=executed；事实包 durable 路径可读。任一环缺失即失败。（来源：D-M8-3）

- [ ] **验收 2 — diff-only 不越界**：在 build-code 执行期间，人工尝试或模拟触发 C2 清单内操作（如修改 package.json）。验证：该操作被拦截停等，build-code 未自动执行，越界类型浮现。扫描出自动越界即失败。（来源：C2，FR-DIFF-001/002）

- [ ] **验收 3 — 审查遗漏可见**：构造"审查没调"场景（主动跳过 3rd-review 调用）。验证：facts.review.status=not_executed，stage 边界浮现"审查未执行"提示，不被静默隐藏。被隐藏即失败。（来源：C3，FR-REVIEW-002/004）

- [ ] **验收 4 — 验收事实包完整**：build-code 完成后读取 durable 路径下事实包。验证：facts.changed、facts.tests（含 red_exit_code/green_baseline_hash）、facts.review（含 status/source/verdict/artifact_path）三键均存在，缺任一键即失败。（来源：C1，FR-PKG-001/002/003）

- [ ] **验收 5 — reuse-registry 登记完整**：检查 reuse-registry.md。验证：Worker-Mode（外部依赖 semver，来源路径）、3rd-review（外部依赖 standalone，来源路径）、TDD 相关件（类别+来源路径）各有独立条目，引入 skill 未登记即失败。（来源：D15/D16，FR-REG-001）

---

## 6. 关键实体

**验收事实包（Facts Bundle）**：
- `facts.changed`：本次执行变更的模块/文件清单（不含审查记录）
- `facts.tests`：TDD 物理事实汇总
  - `red_exit_code`：RED 阶段测试进程退出码
  - `green_baseline_hash`：GREEN 阶段测试输出内容 hash
  - （design 可扩展字段，如 red_test_files_line、green_exit_code 等）
- `facts.review`：审查记录独立键
  - `status`：executed | not_executed
  - `source`：third_party | same_source（status=not_executed 时此字段可空或省略）
  - `verdict`：pass | revise_required | escalate_to_human（三态，与 3rd-review 外部审查入口 verdict 契约一致；status=not_executed 时此字段为空或省略）
  - `artifact_path`：审查报告 durable 路径

**越界操作清单（C2 Boundary List）**：
- 不可逆 git 操作类别：推送 / 删分支 / 强制覆盖 / 破坏性重置远程
- 外部依赖变更类别：锁文件 / 依赖清单 / 插件 semver 字段
- 生产配置类别：环境变量文件 / 部署配置 / 基础设施配置 / CI 配置

---

## 7. 数据和生命周期

- **数据粒度**：以一次 build-code skill 执行（单 phase）为单位，产出一份事实包。
- **数据时效**：事实包在 skill 执行结束时落 durable，之后不变更（只读）。
- **补传策略**：若中途失败，已采集的部分事实保留在 durable，失败原因浮现，不覆盖。
- **当前 vs 历史**：每次执行各自落盘，不覆盖前次结果（由 durable 路径命名区分）。

---

## 8. 兼容性预留

- **命名预留**：facts.tests 和 facts.review 键名在 C1 契约中固定，design 只加不删，M9 侧可安全读任意扩展键。
- **容器预留**：stage-result 契约的 facts 结构已按 C1 设计，M9/M10 等后续里程碑可在 facts 下加新键，不破坏现有消费方。
- **状态预留**：facts.review.source 的两值（third_party/same_source）已覆盖当前已批准场景，未来审查模式扩展可追加枚举值，已有值语义不变。

---

## 9. 不做和隐性必达

### 明确不做（来源：decision-log §5）

- 不自研子代理派发机制（Worker-Mode 外部依赖，D16a）
- 不内嵌改造 3rd-review（X3 独立 repo standalone 入口，D15）
- 不做 blocking 质量门（TDD 红绿记事实+浮现，不堵推进，D5/D7）
- 不含 design/plan 阶段（上游，M8 范围外）
- 不含 verify-code（M9 下游，M8 范围外）
- 不用 M8 本身当验收靶子（避循环验证，D-M8-3）

### 隐性必达

- facts.review.status 两态必须都可产生并可被测试（构造"审查没调"场景可证伪）
- 事实包落 durable 路径，skill 进程结束后仍可读（不落临时目录或内存）
- implementer 不得擅自 commit，build-code 收回报后必须核验 git 状态
- 所有引入的外部 skill 在 reuse-registry 登记后方可视为交付完整
- worktree 路径不硬编码任何本地宿主路径（D21 断宿主）

---

## 10. 验收清单及未决问题

### 验收检查

- [ ] 与 decision-log.md（m8-build-code）一致，每条 FR 可追溯回来源字段
- [ ] 用户场景覆盖正常（3.1/3.2/3.3/3.9/3.10）、边界（3.7/3.8/3.9）、失败（3.4/3.5/3.6）路径，≥8 条
- [ ] 含至少一条失败场景（3.4 审查未调用、3.5 假红、3.6 越界拦截）
- [ ] 含至少一条边界场景（3.7 同源降级、3.8 M9 消费、3.9 路径可配置）
- [ ] A 档五章齐全（场景/FR/不做/验收/影响范围）
- [ ] 验收条目可手动或命令验证（含构造场景测试条）
- [ ] 不含文件路径、代码片段（原型字段形状除外）
- [ ] 业务影响范围已写第 11 章

### 未决问题和风险

- **TDD 件来源**：【已解，design 阶段侦察 + 用户裁定】Worker-Mode implementer 是黑盒自觉（自报"绿了"不产可校验证据），不够。复用项目内 tdd-red-green skill 的 capture 模式做外部证据采集，不引 superpowers TDD（纯纪律提示词冗余）。见 FR-REG-002。
- **外部审查入口参数契约**：【已解，design 阶段对照 3rd-review repo 核实】参数契约已在 design 阶段对照 3rd-review repo 独立核实，plan 阶段按核实结果实现，spec 不预设具体参数名。
- **验收靶子选哪个**：【已解，用户裁定】给 workflowhub 新建一个工具函数（纯函数级），与 build-code 无交集。具体函数 plan 阶段锁定。见 FR-ACPT-001。

---

## 11. 影响范围（业务性质）

- **受影响功能：build-code skill**
  - 既有行为：空骨架（M6 留存），不可运行
  - 本需求影响：升为 v1 可运行 skill，覆盖 TDD 红绿/diff-only/审查/事实包四大能力
  - 回归要点：原有骨架定义的接口（RED→implement→GREEN 循环、消费上游 stage-result facts、产 stage-result）不被破坏

- **受影响功能：stage-result 契约（M9 边界）**
  - 既有行为：facts 结构已有 changed/tests 键，M9 侧按既有 schema 读取
  - 本需求影响：在 facts 下新增 review 键（C1），可能扩展 tests 键字段
  - 回归要点：已有 changed/tests 键的现有消费方不受新增 review 键影响；新增字段向后兼容

- **受影响功能：reuse-registry.md**
  - 既有行为：M7 已有 make-decision 相关条目
  - 本需求影响：新增 Worker-Mode/3rd-review/TDD 件条目
  - 回归要点：已有条目不被覆盖或删除；格式与 M7 一致

- **受影响功能：worktree 隔离机制**
  - 既有行为：M7 无 worktree 管理；agenthub harness 有 worktree 初始化能力
  - 本需求影响：build-code 在目标项目 repo 内开平级 worktree，路径可配置
  - 回归要点：不影响主 checkout 的工作树状态；worktree 路径不上溯至宿主

- **可能受冲击的业务规则**：D6（不越人界）和 D5（记事实不 blocking）是本需求的核心约束，任何实现不得把"拦截"升级为"自动拒绝推进"（D5 明确允许浮现不 blocking）

- **需回归的业务路径**：M7 make-decision workflow 正常调用路径（不受 build-code 新增影响，验证 reuse-registry 新增不破坏 M7 相关条目）

- **明确无影响**：design/plan 上游 workflow、verify-code M9 下游 workflow 的内部逻辑（M8 只产出事实包，不修改下游消费行为）；Multica web/mobile/desktop 前端（完全无关）

- **受影响功能：agenthub harness / gate 执行框架**（决策依据：D-M8-1）
  - 既有行为：agenthub harness + gate 系统是当前 vibecoding workflow 的执行框架，M7 及之前里程碑均在此框架下运行
  - 本需求影响：M8 build-code 仍走完整 agenthub vibecoding workflow 自举执行，交付物写入 workflowhub repo；harness/gate 作为宿主不被修改，但本次自举验证其对 build-code skill 的兼容性
  - 回归要点：harness gate 流程（stage_enter/stage_exit/stage_advance 等）在 build-code skill 执行期间行为不变；M7 workflow 路径不受影响

- **受影响功能：3rd-review standalone 外部依赖边界**（决策依据：D-M8-4）
  - 既有行为：3rd-review 作为独立外部 repo（X3），通过 standalone 入口对外提供审查能力，现有消费方按 standalone 入口协议调用
  - 本需求影响：build-code 首次以外部依赖方式消费 3rd-review standalone 入口，喂真实 diff，消费 verdict 三态；不修改 3rd-review 内部实现
  - 回归要点：3rd-review standalone 入口对外协议不被 M8 改动；已有其他消费方不受影响；降级（same_source）场景不依赖 standalone 可用

- **受影响功能：Worker-Mode 外部依赖引入**（决策依据：D-M8-6）
  - 既有行为：Worker-Mode 插件在 workflowhub 中尚未被 build-code 消费；作为外部 semver 依赖独立演进
  - 本需求影响：build-code 首次通过 Worker-Mode 标准接口调起 implementer worker 和 qa worker，不自研派发机制；Worker-Mode 版本锁定在 reuse-registry 登记
  - 回归要点：Worker-Mode 插件本身不被修改；其他已有消费方（如存在）不受影响；Worker-Mode semver 变更属越界操作（C2 清单），build-code 不自动执行

---

> design-review 历次修订已采纳：FR 来源标签修正、same_source 降级语义补充（C4）、第 11 章业务影响补全、Spec-Purity 清理、反向约束补充、基线去自填、浮现可观测合同（anomaly_flags 枚举 + stage 边界 warning）。详细审查记录见 task reviews。
