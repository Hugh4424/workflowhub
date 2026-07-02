# 宪法符合性检查 — m13e-verify-code-deepening

> 对照 `constitution-checklist.md` 21 条逐条评估。
> 检查时间：2026-07-02
> task_id：m13e-verify-code-deepening
> 档位：C（跨模块 + 破坏性 schema 变更）

---

## 框架原则（F1–F10）

- [x] **F1 薄核心**
  判据：核心是否只做调度编排、重活下沉技能层（改动牵连面小）。
  理由：7 个补丁均落在技能层（freshness.mjs 扩展、test-strategy 新建 skill、verify-code SKILL.md 插入步骤）；核心调度逻辑不变。改动牵连面限于 verify-code 阶段。**符合。**

- [x] **F2 窄契约**
  判据：模块间是否走窄而明确的接口、不暴露内部实现。
  理由：trace-check → `trace-check-report.json`、freshness → `mtime_violations[]`、test-strategy → `test-strategy.md` route 字段、L3 → `l3-e2e-report.json`——均为窄而明确的文件接口，不暴露内部实现逻辑。**符合。**

- [x] **F3 物理事实靠机器校验但不阻断**
  判据：物理事实是否机器客观采集且不阻断推进。
  理由：freshness 四段、trace-check、L3 铁律均为机器客观采集（git_sha+content_hash）；yellow 不阻断，red 仅 escalate 不自动停止。**符合。**

- [x] **F4 质量靠异源审查与人而非阻断式质量门**
  判据：质量是否靠独立审查+人，而非阻断门。
  理由：3rd-review 由 codex 独立上下文产出（异源）；stage-result 三色门均有人工确认路径（yellow/red 均 escalate 等人），不自动阻断。**符合。**

- [x] **F5 gate 谨慎添加出事再补无用则移除**
  判据：关卡是否按需添加、无用即移除，未预先堆砌。
  理由：7 个补丁均有明确的真实失效场景（decision-log 第 2 节"核心问题"），非预防性堆砌。F10 四问逐一分析，均有真实威胁支撑。**符合。**

- [x] **F6 记录而不阻断**
  判据：违反时是否记录事实而非停止推进。
  理由：mtime_violations[]、missing_ac_coverage[] 均为记录字段；yellow 不阻断；red 仅 escalate 不硬停。**符合。**

- [x] **F7 不可逆操作经人确认**
  判据：不可逆操作（放行、合并等）是否须人确认。
  理由：red 条件下 escalate 后等人，不自动放行；human review checkpoint 要求显式确认后才产 stage-result。**符合。**

- [x] **F8 简单优先（simplicity-guard 四阶梯）**
  判据：是否优先复用现有能力，只写最小新增。
  理由（按 simplicity-guard 四阶梯）：
  - P0（需要存在？）：7 个补丁均有真实失效场景，需要存在。
  - P1（已有覆盖？）：L3 直接复用 isolated-browser-qa（D4），freshness.mjs 是改造扩展（D3）。
  - P2（复用改造？）：freshness.mjs 扩展（改造复用），stage-summary 双调用（插入现有调用点）。
  - P3（最小新增）：trace-check 步骤、test-strategy skill、三色门 schema 变更为真正新增，且范围最小。
  **minimal-path 字段**：D4 = P1（直接复用），D3/D5 = P2（改造复用），D1/D2/D6/D7 = P3（最小新增）。**符合。**

- [x] **F9 记录事实不编造**
  判据：报告字段是否如实记录，禁止伪造 unknown 为已知。
  理由：baseline-report.md 中 M11 actual 均标注 unknown + 原因，未编造数值。3rd-review verdict 如实记录（含超时信息）。**符合。**

- [x] **F10 反过度工程**
  判据：新增机制是否有真实威胁支撑，维护成本是否可接受。
  理由：附录 E F10 四问对 5 个新机制逐一分析，均有真实失效场景，无"仅为机器可查而加"的机制。**符合。**

---

## 质量机制（Q1–Q3）

- [x] **Q1 记事实不阻断**
  判据：物理事实发现时是否记录而非停止。
  理由：F3/F6 已覆盖，violations 字段记录，不硬停。**符合。**

- [x] **Q2 独立审查异源产出**
  判据：质量裁决是否由独立来源独立上下文产出、无自审自判。
  理由：3rd-review 由 codex 独立会话产出（`evidence/3rd-review-verdict.md`），本 agent 未参与裁决，仅执行 P2 发现项的落地修复。**符合。**

- [x] **Q3 异源审查加人工把关**
  判据：质量裁决是否由独立来源独立上下文产出、无自审自判。
  理由：3rd-review codex 产出 + human review checkpoint 双把关。**符合。**

---

## 技能原则（S1–S8）

- [x] **S1 能用外部就不造轮子**
  判据：通用能力是否优先复用外部、文件直放项目内。
  理由：L3 直接复用 isolated-browser-qa（现有外部技能），不重新设计 L3 执行器（D4）。**符合。**

- [ ] **S2 外部技能可针对项目改造合宪**
  判据：采用的外部技能是否按需改造至合宪。
  理由：isolated-browser-qa 是直接复用（D4 明确"不重新设计"），未做改造适配分析。若 isolated-browser-qa 输出格式与 l3-e2e-report.json 契约不完全匹配，可能需要改造。**待验证，暂标 [ ]。**

- [ ] **S3 迭代时保持最新并就地检查**
  判据：迭代时是否查更新/更优、来源路径写进技能文件。
  理由：新建 test-strategy skill 未在 spec 中要求记录来源路径和更新检查机制。**待 build-plan 补充。**

- [x] **S4 自定义技能必须有指标系统**
  判据：自研技能是否配套指标、纳入统一执行记录。
  理由：test-strategy skill 新建时须接入 M4 metrics（build-spec SKILL.md 第 1 节要求），spec 中未单独列出但沿用全局约定。**符合（沿用全局约定）。**

- [x] **S5 自定义技能方便子代理调用省主上下文**
  判据：自研技能是否便于子代理调用、减少主上下文占用。
  理由：test-strategy skill 定义为独立子代理调用（D2），不在主进程内执行。**符合。**

- [ ] **S6 自定义技能参考市面方案不闭门造车**
  判据：自研技能是否参考成熟方案优化。
  理由：test-strategy skill 参考了 decision-log 中 test-routing-advisor + testing-system-blueprint 历史逻辑，但 spec 未要求明确记录参考来源。**待 build-plan 补充参考来源记录。**

- [x] **S7 一阶段一技能一工作流一文件夹**
  判据：阶段/工作流是否一一对应独立、按目录约定、核心零改可加。
  理由：test-strategy 新建为独立 skill 文件夹（`workflows/test-strategy/SKILL.md`），verify-code 修改限于自身 SKILL.md，核心零改动。**符合。**

- [x] **S8 自定义技能可独立调用可搬运**
  判据：自研技能是否可独立调用、与主流程解耦。
  理由：test-strategy skill 以独立子代理方式调用，输入/输出均为文件接口，可独立运行。**符合。**

---

## 不合规项汇总

| 条目 | 状态 | 原因 | 处理建议 |
|---|---|---|---|
| S2 | [ ] 待验证 | isolated-browser-qa 直接复用，未做改造合宪分析 | build-plan 阶段验证输出格式兼容性 |
| S3 | [ ] 待补充 | test-strategy skill 未记录来源路径和更新检查 | build-plan 阶段在 skill 文件中补充 |
| S6 | [ ] 待补充 | test-strategy skill 参考来源未在 spec 中明确记录 | build-plan 阶段补充参考来源 |

**合规 18 条 / 不合规（待补充）3 条（S2/S3/S6）**，均为 build-plan 阶段可补充项，不阻断 spec 产出。
