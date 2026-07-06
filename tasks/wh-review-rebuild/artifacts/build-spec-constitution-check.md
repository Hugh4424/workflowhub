# 宪法符合性检查 — wh-review-rebuild

**检查对象**: `specs/wh-review-rebuild/spec.md`
**检查日期**: 2026-07-06

---

## 框架原则（F）

- [x] **F1 薄核心** — wh-review 只做 stage→合同路由、轮次状态调度、裁决聚合，不内嵌审查逻辑；3rd-review 只做纯引擎（环境探测+agent调度+返回结果）；实际审查重活下沉 reviewer agent。改动牵连面限于 wh-review 模块和各 stage 收尾段，核心编排路径不变。

- [x] **F2 窄契约** — wh-review↔3rd-review 接口固定为 `{mode, contract, materials}` → `{verdict, findings, actual_mode}`；stage agent↔wh-review 接口为 `stage` 标识 + materials；报告通过固定路径落盘。无内部状态共享，各层不暴露实现细节。

- [x] **F3 物理事实靠机器校验但不阻断** — 轮次状态、报告路径、合同路由日志均为机器客观采集产物；metrics 写失败只 warn 不 throw；unknown 值记录不阻断推进（F3/Q1，见质量契约 item 3 和 baseline-report.md）。

- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 审查由独立 reviewer agent 执行（异源保证客观性）；裁决非阻断门，revise_required 循环、escalate_to_human 升级均交由人裁决；D2 人工确认门（make-decision/build-plan/verify-code）为唯一强制人工点，不是自动质量门。

- [x] **F5 gate 谨慎添加出事再补无用则移除** — 本期新增的唯一"门"是 D2 人工确认门（3个 stage 的 pass 路径），有明确用户需求（decision-log D2）；3rd-review 精简时删除原有隐式 stage 匹配门（从未生效）；无预设新增门控。

- [x] **F6 统一外置执行记录** — 轮次状态文件、审查报告均落盘任务目录（路径可预测）；metrics 通过 collector.mjs 统一记录；journal 留 skill_called/stage 事件（与现有 workflowhub 惯例一致）。

- [x] **F7 推进与不可逆操作不自动越过人** — make-decision/build-plan/verify-code 的 pass 路径触发人工确认（FR-D2-001），不自动推进；escalate_to_human 裁决停止自动化并通知 human orchestrator；无操作会在未经人确认时自动越过不可逆步骤。

- [x] **F8 简单优先** — wh-review 复用现有 3rd-review 引擎，不重新实现审查机制；render-review-report.mjs 移植自 agenthub，不重写；合同从 agenthub verifiers/vibecoding 搬迁，不从零编写；§7 改写是删减而非新增。已在 Known Gaps 标注3个GAP待 build-plan 核实，避免过早假设。

- [x] **F9 可证伪不假绿** — 所有 AC 均有明确失败判据（AC-D1~AC-D10 + 各FR的AC条目）；§7 合规验证可机器 grep；unknown 指标在 baseline-report 中诚实标注，不伪造数值；GAP 不以"pass"掩盖。

- [x] **F10 自动化按真实收益添加** — wh-review 引入的自动化（轮次管理、Delta Package 构造）均有明确收益（解决审查状态不可追踪、成本过高问题）；F10 门控详见 f10-gate.md；无预防性自动化堆砌。

---

## 质量原则（Q）

- [x] **Q1 记事实而非阻断** — 轮次状态、blocking_count、fingerprint_repeated 均为记录字段，不直接阻断；GAP-4/GAP-5 记录于质量契约而非设为阻断条件；unknown 指标记录原因，不阻断推进。

- [x] **Q2 变更可追溯** — spec 每条 FR 标注来源决策（D1-D7）；Known Gaps 标注发现阶段（spec-specify/spec-clarify）；checklists/requirements.md 包含 KEEP 决策覆盖验证表（10/10 全覆盖）；worktree 分支为 workflowhub/wh-review-rebuild，commit 含 workflowhub(build-spec) 前缀。

- [x] **Q3 检查须在实际为假时真报失败** — AC-D1/AC-D2 为机器 grep 可检验（§7 合规性、FR覆盖）；合同路由日志可验证（AC-D4）；D2 人工确认门缺失时 AC-D5 明确失败；不含"无法证伪"的软性验收条件。

---

## 技能原则（S）

- [x] **S1 技能有明确边界** — wh-review 边界：只负责 workflowhub 5 stage 的审查调度，不支持外部 stage；3rd-review 边界：只做纯引擎，不感知 stage/轮次；改动边界已在 spec §2 和影响范围表中明确列出，不改 agenthub 侧文件。

- [x] **S2 技能输入输出契约明确** — wh-review 入参：`stage` + materials；出参：`{verdict, findings}` + 报告路径；3rd-review 入参：`{mode, contract, materials}`；出参：`{verdict, findings, actual_mode}`。所有字段在 FR 中明确定义，AC 可机器核查。

- [x] **S3 技能可独立触发** — 精简后的 3rd-review 可在无 wh-review 的场景下独立调用（NFR-3、隐性必达1）；wh-review 各 stage 路由可独立测试（UC-5 场景）；端到端冒烟用例可本地独立运行（FR-TEST-001）。

- [x] **S4 外部技能走 reuse-registry** — render-review-report.mjs 从 agenthub 移植，build-plan 阶段需在 reuse-registry.md 登记（已在 Known Gaps GAP-2 中标注，待确认）；wh-review 不重新实现已有功能。

- [x] **S5 技能失败有降级路径** — wh-review 合同缺失：fail-loud 报错（FR-WHREVIEW-002 AC2-3）；3rd-review 调用失败：由 wh-review 处理（不静默忽略）；连续 blocking 触发 escalate_to_human 而非无限循环（FR-WHREVIEW-003 AC3-3）；stage 标识缺失：fail-loud（FR-WHREVIEW-001 AC1-2）。

- [x] **S6 技能产物落盘可追溯** — 每次审查产生轮次状态文件（round_number/mode/verdict/report_path）和报告文件（固定路径，AC-D10/AC4-2）；5 套专属合同文件落盘 `skills/wh-review/contracts/`（AC2-1）。

- [x] **S7 技能不自创流程** — wh-review 流程步骤（合同查找→构造materials→调用3rd-review→更新轮次状态→渲染报告→裁决）在 spec FR 和 UC 中明确定义；实现者不得自行添加额外步骤或跳过步骤；降级规则在 FR-WHREVIEW-003 中固定。

- [x] **S8 技能版本可识别** — wh-review SKILL.md 须含 skill_version 字段（与现有 workflowhub 惯例一致，见 spec-specify SKILL.md 的 recordSkeleton 要求）；3rd-review 精简后须更新版本号标识重大改动。

---

## 综合结论

**21/21 条全部通过（[x]）**

无阻断项。未解风险已记录于质量契约 item 4（7条，全部非阻断）。
