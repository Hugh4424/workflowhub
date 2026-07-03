# 宪法符合性检查 — step-gated-audit

> 对照 `constitution-checklist.md` 21 条逐条评估。
> 检查时间：2026-07-03
> task_id：step-gated-audit
> 档位：C（跨系统边界、5 个 stage 全部涉及、破坏性行为变更）

---

## 框架原则（F1–F10）

- [x] **F1 薄核心**
  判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。
  理由：before-step / after-step 钩子落在各 stage 主技能文件（5 个 SKILL.md）；receipt 写入逻辑集中在 `core/receipt-writer.mjs`（新建单一接口）；核心调度层不变。改动牵连面限于 5 个技能层文件 + 1 个 journal-schema 适配。**符合。**

- [x] **F2 窄契约**
  判据：模块间是否走窄而明确的接口、不暴露内部实现。
  理由：entry_receipt / exit_receipt 均通过 `journal.jsonl`（event_type: step_entry/step_exit）传递；audit 组件只输出 `judgement` 对象（status/reason/retry_eligible），不暴露内部检查逻辑；stage-result 新增 `audit_summary` 聚合字段，接口窄而明确。**符合。**

- [x] **F3 物理事实靠机器校验但不阻断**
  判据：物理事实是否机器客观采集且不阻断推进。
  理由：exit_receipt 写入失败采用 warn-only（FR-SGA-002/013），不阻断 step 推进；3rd-review 失败降级为 unknown，不阻断（FR-SGA-007）；audit_summary 字段记录事实计数（passed/blocked/skipped/rollback），不作阻断判据。唯一 fail-closed 是 entry_receipt 写失败，属"门禁语义"——入口保护不是质量阻断，符合 F3 精神。**符合。**

- [x] **F4 质量靠异源审查与人而非阻断式质量门**
  判据：质量是否靠独立审查+人，而非阻断门。
  理由：after-step 调用 3rd-review 技能（独立上下文，FR-SGA-007）；writer_namespace vs executor_namespace 比对发现潜在自审自判时只记录 warn、不阻断（FR-SGA-008）；连续 rollback 达阈值升级人工干预（FR-SGA-006）；before-step BLOCKED 产出 judgement 由 runner 层执行，audit 组件本身不做自动 rollback（FR-SGA-003/D8）。**符合。**

- [x] **F5 gate 谨慎添加出事再补无用则移除**
  判据：关卡是否按需添加、无用即移除，未预先堆砌。
  理由：附录 D F10 四问对 9 个机制逐一分析，均有真实失效场景支撑（step 跳过无记录、无出口记录、无自动回退、第三套落盘格式维护成本等）。无预防性堆砌机制。**符合。**

- [x] **F6 记录而不阻断**
  判据：违反时是否记录事实而非停止推进。
  理由：exit_receipt 写失败 → warn + 记录到 journal，不阻断（FR-SGA-013）；3rd-review 失败 → verdict=unknown + 记录原因，不阻断（FR-SGA-007）；writer_namespace 相同 → warn + 记录，不阻断（FR-SGA-008）；blocked_step_count / rollback_count 均为记录字段（FR-SGA-005）。**符合。**

- [x] **F7 不可逆操作经人确认**
  判据：不可逆操作（放行、合并等）是否须人确认。
  理由：连续 rollback 达 2 次仍无效时升级人工，不再自动回退（FR-SGA-006/D9）；stage 级 blocked 升级到 stage 层处理，不自动继续（FR-SGA-003）；spec 未引入任何自动放行/合并动作。**符合。**

- [x] **F8 简单优先（simplicity-guard 四阶梯）**
  判据：是否优先复用现有能力，只写最小新增。
  理由：
  - P0（需要存在？）：9 个机制均有真实失效场景（附录 D）。
  - P1（已有覆盖？）：3rd-review 技能直接复用（FR-SGA-007，D4）；journal 落盘底座直接复用（FR-SGA-004）。
  - P2（改造复用？）：journal schema 扩展 event_type 枚举（改造现有，不新建格式）；stage-result 新增 audit_summary 聚合字段（插入现有结构）。
  - P3（最小新增）：receipt-writer.mjs 新建单一接口供 5 个 stage 共用；before-step / after-step 钩子插入各 SKILL.md。
  **符合。**

- [x] **F9 记录事实不编造**
  判据：报告字段是否如实记录，禁止伪造 unknown 为已知。
  理由：3rd-review 失败时 verdict=unknown、executed=false，原因记录到 journal（FR-SGA-007）；spec 自检汇总如实标注 warn（FR 域名非预设列表）而非虚报 pass（附录 A 质量事实契约第 2 项）；F10 findings 如实记录 executor_namespace 可绕过风险（附录 D 机制 8）。**符合。**

- [x] **F10 反过度工程**
  判据：新增机制是否有真实威胁支撑，维护成本是否可接受。
  理由：附录 D F10 四问对 9 个机制逐一分析，全部通过（维护成本低、复用现有底座、真实威胁支撑）；唯一 WARN 是机制 8（executor_namespace 可绕过），已明确留 build-plan 补强，不因此增加当前复杂度。**符合。**

---

## 质量机制（Q1–Q3）

- [x] **Q1 记事实不阻断**
  判据：物理事实发现时是否记录而非停止。
  理由：F3/F6 已覆盖。audit_summary 5 个计数字段（passed/blocked/skipped/rollback/review_conclusion）均为记录字段，不作阻断判据（FR-SGA-005）。**符合。**

- [x] **Q2 独立审查异源产出**
  判据：质量裁决是否由独立来源独立上下文产出、无自审自判。
  理由：after-step 强制调用 3rd-review 技能在独立上下文执行（FR-SGA-007）；FR-SGA-008 防自审自判检测（writer_namespace vs executor_namespace）作为辅助机制。上轮异源审查（codex 引擎，trueCrossEngine=true）产出 7 条 findings，本 spec 已全部吸收（附录 A 第 3 项）。**符合。**

- [x] **Q3 异源审查加人工把关**
  判据：质量裁决是否由独立来源独立上下文产出、无自审自判。
  理由：3rd-review 异源产出 + 连续 rollback 阈值触发人工升级（FR-SGA-006）+ stage blocked 升级 stage 层处理（FR-SGA-003）。两层把关：机器异源审查 + 人工干预路径均已在 spec 中明确。**符合。**

---

## 技能原则（S1–S8）

- [x] **S1 能用外部就不造轮子**
  判据：通用能力是否优先复用外部、文件直放项目内。
  理由：3rd-review 技能直接复用现有基础设施（FR-SGA-007 明确"复用现有 3rd-review 基础设施"，Out Scope 明确"不修改 3rd-review 技能本身的实现"）；journal 落盘底座直接复用（FR-SGA-004）；不重新设计独立 receipts/ 格式。**符合。**

- [x] **S2 外部技能可针对项目改造合宪**
  判据：采用的外部技能是否按需改造至合宪。
  理由：3rd-review 技能以调用接口方式复用，spec 明确不修改技能本身（Out Scope）；调用结果写入 exit_receipt 的 10 个 review 字段（FR-SGA-007），适配层在 after-step 钩子中，不改动技能本体。接口兼容性问题留 build-plan 阶段验证（Known Gap 4）。**符合。**

- [ ] **S3 迭代时保持最新并就地检查**
  判据：迭代时是否查更新/更优、来源路径写进技能文件。
  理由：spec 中新建 `core/receipt-writer.mjs` 未要求记录参考来源路径；各 stage SKILL.md 的钩子插入未要求检查更新机制。**待 build-plan 补充来源路径记录。**

- [x] **S4 自定义技能必须有指标系统**
  判据：自研技能是否配套指标、纳入统一执行记录。
  理由：receipt 写入并入现有 journal.jsonl 统一落盘底座（FR-SGA-004）；stage-result 新增 audit_summary 聚合字段（FR-SGA-004/005），纳入统一执行记录。build-spec SKILL.md 第 1 节 M4 metrics 全局约定已覆盖本阶段。**符合（沿用全局约定）。**

- [x] **S5 自定义技能方便子代理调用省主上下文**
  判据：自研技能是否便于子代理调用、减少主上下文占用。
  理由：receipt-writer.mjs 作为单一接口供 5 个 stage 调用，不在主上下文内内联逻辑（FR-SGA-004）；3rd-review 技能在独立上下文执行（FR-SGA-007）。**符合。**

- [ ] **S6 自定义技能参考市面方案不闭门造车**
  判据：自研技能是否参考成熟方案优化。
  理由：receipt-writer.mjs 和 before-step / after-step 钩子设计未在 spec 中明确参考成熟方案（如 saga pattern、event sourcing 等审计链设计）。**待 build-plan 补充参考来源记录。**

- [x] **S7 一阶段一技能一工作流一文件夹**
  判据：阶段/工作流是否一一对应独立、按目录约定、核心零改可加。
  理由：5 个 stage 各自独立 SKILL.md 文件（FR-SGA-009）；receipt-writer.mjs 新建于 `core/` 目录；不修改核心调度层；新增文件按目录约定放置（影响范围分析第三节）。**符合。**

- [x] **S8 自定义技能可独立调用可搬运**
  判据：自研技能是否可独立调用、与主流程解耦。
  理由：receipt-writer.mjs 作为独立接口模块，输入为 step 元数据、输出为 journal 写入结果，与 stage 主流程解耦；3rd-review 技能在独立上下文调用，失败时降级而非硬依赖（FR-SGA-007）。**符合。**

---

## 不合规项汇总

| 条目 | 状态 | 原因 | 处理建议 |
|---|---|---|---|
| S3 | [ ] 待补充 | receipt-writer.mjs 及钩子插入未记录来源路径和更新检查机制 | build-plan 阶段在技能/模块文件中补充来源路径 |
| S6 | [ ] 待补充 | receipt 链设计（audit/receipt-writer）未明确参考成熟方案 | build-plan 阶段补充参考来源记录（如 saga pattern / event sourcing） |

**合规 19 条 / 不合规（待补充）2 条（S3/S6）**，均为 build-plan 阶段可补充项，不阻断 spec 产出。
