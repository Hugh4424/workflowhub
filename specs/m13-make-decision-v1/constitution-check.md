# 宪法符合性检查 — M13 make-decision 深化

**检查对象**: `specs/m13-make-decision-v1/spec.md`
**检查日期**: 2026-06-29

## 框架原则（F）

- [x] **F1 薄核心** — 所有护城河动作（调研、盲审、debate、grill、talk）均下沉至独立 skill/外部路径，核心 SKILL.md 只做 12 步流程的调度与推进判断，不内嵌业务逻辑。
- [x] **F2 窄契约** — 各 skill 间通过固定 artifacts 文件交互（scope-triage-result.md、background-research.md、consultation.md 等），入参出参明确，不共享内部上下文。
- [x] **F3 物理事实靠机器校验但不阻断** — metrics 写失败 warn 不 throw（FR-METRIC-01）；muyu get_sources 失败**立即停下报告用户等待指令**（FR-RESEARCH-01，非自动降级，已在 spec OPEN-1 解决）；两路均空记录 dual_research_empty 不阻断（FR-RESEARCH-03）。注：muyu 失败属"物理来源核实失败需人决策"，停下等人是 let-it-crash 原则，不违反非阻断原则（非阻断指不因质量判断阻断，不指掩盖数据缺失）。
- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 三角度盲审走 3rd-review 异源链（FR-REVIEW-01），各 reviewer 独立，审查结果非阻断；debate 有条件触发非默认阻断；S9 是唯一人确认点。
- [x] **F5 gate 谨慎添加出事再补无用则移除** — 全流程 S9 是唯一强制 gate（FR-ACCEPT-02）；spec §14 明确不做额外 blocking gate；debate 两次门控基于条件触发而非预设堆砌。
- [x] **F6 统一外置执行记录** — FR-METRIC-01 要求 recordSkeleton + updateOwnResult 记录至 task-metrics.jsonl；每步骤在 journal 留 skill_called / stage_enter/exit 事件（FR-FLOW-01 验收标准）。
- [x] **F7 推进与不可逆操作不自动越过人** — S9 方向确认硬门控须用户明确回复"同意"才可落盘（FR-ACCEPT-02，唯一强制 gate）；S4 方向基线为记录模式非阻断检查点（FR-ACCEPT-01，已修正）；任何护城河跳过均有 journal 记录。
- [x] **F8 简单优先** — grill-with-docs-lite 限 40 行薄壳（FR-GRILL-01）；6 个 env var 不进 config 注册表（FR-ENV-02）；debate 原样调用外部 skill 不重新实现；spec §14 明确列出 6 项不做。
- [x] **F9 可证伪不假绿** — 所有 AC 均有明确失败判据（AC1–AC6）；两路均空时禁止合成摘要（FR-RESEARCH-03）；metrics 无可用数据写 unknown 不伪造（FR-METRIC-01 通过 collector.mjs 保证）。
- [x] **F10 自动化按真实收益添加** — 五类护城河动作全部可选/条件触发（6 个 env var 控制，含 SKIP 开关）；debate 仅在 blocking > 2 或方向分歧时触发；无预设 CI 检查或自动校验门。

## 质量原则（Q）

- [x] **Q1 记事实而非阻断** — 台账驳回理由、blocking 留痕（FR-REVIEW-03）、muyu 失败标记均为记录性产物；所有护城河跳过时 journal 记录 skipped 而非报错阻断（隐性必达 1）。
- [x] **Q2 变更可追溯** — decision-log 含 D1–D6 决策来源；所有 FR 均标注决策来源；debate 注册 reuse-registry（FR-DEBATE-03）；framing-challenge 落盘前禁止静默丢弃（FR-LEDGER-02）。
- [x] **Q3 检查须在实际为假时真报失败** — AC1–AC6 均有明确失败判据；blocking 留痕缺失时 decision-log 不得标注"落盘完整"（FR-REVIEW-03）；从 S8 直接跳 S10 视为错误（FR-ACCEPT-02）。

## 技能原则（S）

- [x] **S1 技能有明确边界** — make-decision 边界显式列出（spec §2 边界节）：不改下游阶段、不实现 debate 内部逻辑、不引入 S9 以外的阻断门。
- [x] **S2 技能输入输出契约明确** — 每个 FR 均有验收标准（artifacts 文件名、字段名、journal 事件名），输入来自 decision-log，输出至 artifacts/ 目录，契约可机器核查。
- [x] **S3 技能可独立触发** — 双路调研、盲审、debate、talk、grill 均可通过 env var 独立触发或跳过（FR-ENV-01，AC1 验收）；档位 lite/full 控制 S3 是否跳过（FR-FLOW-02）。
- [x] **S4 外部技能走 reuse-registry** — debate 作为 EXTERNAL skill 必须在 reuse-registry.md 登记 skill 名称、路径、reuse_class（FR-DEBATE-03，AC2 验收）；anysearch 走已注册路径 v2.1.0（FR-RESEARCH-02）。
- [x] **S5 技能失败有降级路径** — debate 路径不可达或 SKIP=1 时记录原因后继续（FR-DEBATE-04）；muyu `get_sources` 核实失败**立即停下报告用户等待指令**（FR-RESEARCH-01；此处"降级路径"为停下等人决策，不是自动降级——无来源继续等于产出幻觉，不符合 F9 可证伪原则）；两路均空记录 dual_research_empty（FR-RESEARCH-03）。
- [x] **S6 技能产物落盘可追溯** — 五类护城河各有固定 artifacts 文件（background-research.md、debate-1/2.md、consultation.md、grill-with-docs.md、original-context.md）；decision-log 落盘 7 节完整（隐性必达 2）。
- [x] **S7 技能不自创流程** — 12 步顺序固定（FR-FLOW-01），每步完成才推进；grill 退出条件固定（3 轮或用户复述四件事）；talk 每轮目的固定（FR-TALK-01）；实现者不得自行发明步骤。OPEN-1（muyu 失败行为）已解决（见 FR-RESEARCH-01）；OPEN-2（S7 orchestrator framing-challenge 是否重跑）留存待 SKILL.md 实现时确认。
- [x] **S8 技能版本可识别** — SKILL.md 须含 skill_version 字段（FR-METRIC-01 recordSkeleton 中 skill_version: 2.0.0）；anysearch 明确引用 v2.1.0（FR-RESEARCH-02）；collector.mjs 记录 skill_version 至 metrics。
