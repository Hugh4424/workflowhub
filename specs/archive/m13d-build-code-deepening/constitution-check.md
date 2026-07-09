# 宪法符合性检查 — m13d-build-code-deepening

> 对照 CONSTITUTION.md（v1.1.0）逐条检查本次 spec 产出（spec.md v1.0.0）。
> 共 21 条，结论：pass / warn / fail。
> 检查时间：2026-07-01

---

## 框架原则（F）

### F1 薄核心
- **结论**: pass
- **依据**: spec 改动集中在 `workflows/build-code/SKILL.md`（技能层）和 `metrics/capture.mjs`（字段扩展），不改动核心调度逻辑。新增的审查子代理、mtime 校验、L2 冒烟均作为技能层能力，核心只做"触发+收结果"。

### F2 窄契约
- **结论**: pass
- **依据**: worktree.json 接口仅三字段（worktree_root / created_at_stage / ts），evidence 五件套接口字段明确定义。FR-METRICS-001 明确要求向后兼容不破坏现有字段。

### F3 物理事实靠机器校验但不阻断
- **结论**: pass
- **依据**: spec 明确规定 mtime 防伪违反、L2 冒烟失败、risk_level P0 提示均"记录事实、不阻断"，只有 escalate_to_human 情况才停等人工。AC-SMOKE-002 明确"冒烟失败不阻断 build-code 整体流程"。

### F4 质量靠异源审查与人而非阻断式质量门
- **结论**: pass
- **依据**: FR-REVIEW-001 拆分为两个独立子代理（spec 合规性 + 代码质量），维度正交，产物独立。FR-REVIEW-002 verdict-handler 在 C 类时 escalate_to_human，不自动继续。任一子代理失败不终止另一（AC-REVIEW-003）。

### F5 变更须可追溯
- **结论**: pass
- **依据**: spec 前言明确来源"decision-log.md M13d，user_decision:true，S9 已批准 2026-07-01"，全部 FR 均可追溯到 decision-log §D1-D7。

### F6 记录事实不自动裁决
- **结论**: pass
- **依据**: §隐性必达明确"所有质量检查均为记录事实、不阻断"；escalate_to_human 是唯一停等机制且需人工操作继续。

### F7 人工确认不可逆操作
- **结论**: pass
- **依据**: AC-REUSE-003 明确"不可逆操作，在 build-code 实施阶段执行"；FR-REVIEW-002 C 类升级 escalate_to_human，不自动继续。

### F8 简单优先
- **结论**: pass（2026-07-01 复检后由 warn 转 pass）
- **依据**: 原 warn 依据的两个新增机制中，mtime 防伪校验（FR-ANTIFORGERY-001）已按用户决策整条移除（安全剧场，touch 可绕过）；剩余的 3rd-review 双子代理拆分（FR-REVIEW-001）经 f10-findings.md 四问评估为"低风险，用户已于 S9 批准"，不构成不必要的复杂度。两项触发点均已消解，转 pass。

### F9 可证伪性
- **结论**: pass
- **依据**: 所有 AC 均有明确失败判据（"任一字段缺失"、"值为其他字符串"、"两个文件内容维度重叠"等），检查在"实际为假"时会真报失败。

### F10 自动化按真实收益添加
- **结论**: pass（2026-07-01 复检后由 warn 转 pass）
- **依据**: f10-findings.md 对每个新增机制逐条走四问。mtime 防伪已被判定为高安全剧场风险并按用户决策移除；3rd-review 双子代理拆分四问结论为"低风险，保留，用户已批准"；P0-P3 风险定级、L2 冒烟四问结论均为低/中风险且有真实防御对象。test-routing-advisor 来源已在 agenthub 仓库定位（Known Gap #5 已关闭），无遗留待人工项，故本条转 pass。

---

## 质量原则（Q）

### Q1 推进不阻断
- **结论**: pass
- **依据**: 同 F3，所有质量检查结果均记录不阻断；spec 无任何"必须通过方可继续"的自动门。

### Q2 独立审查优先
- **结论**: pass（2026-07-01 复检：3rd-review 本轮已异源跑成，非降级）
- **依据**: spec 设计上要求两个独立子代理执行审查，架构符合独立审查原则。本轮 3rd-review 用正确子命令 `codex exec review --uncommitted` 独立执行完成，verdict=patch is incorrect（2 条 P2 发现，均已修复），详见 evidence/3rd-review-verdict.md。

### Q3 禁止自审自判
- **结论**: pass
- **依据**: spec 设计中 3rd-review 为外部独立上下文审查子代理，不使用产出方视角。本轮已实际跑通异源审查（codex 独立 session），verdict 由 codex 产出而非本 agent 自评；本 agent 仅对其发现项做了核实与落地修复，未干预或伪造裁决内容。

### Q4 质量裁决独立来源
- **结论**: pass
- **依据**: FR-REVIEW-001 明确两个子代理"独立上下文"，产物路径独立，维度正交。本轮执行层已用 codex 独立会话产出真实 verdict，架构设计与执行均符合原则。

---

## 技能原则（S）

### S1 能用外部就不造轮子
- **结论**: pass
- **依据**: spec §复用策略明确 review-trigger / verdict-handler / checkpoint-protocol 三个本项目自研技能"按需改造后复用"，不新建基础设施文件（anti-forgery-evidence 随 FR-ANTIFORGERY-001 一并移除，不再纳入复用范围）。

### S2 外部技能可针对项目改造合宪
- **结论**: pass
- **依据**: reuse-registry.md 设计为登记改造记录的汇总文件，自研技能按需改造后以"引用并改造"方式记录来源。

### S3 迭代时保持最新并就地检查
- **结论**: pass
- **依据**: FR-REUSE-001 要求 reuse-registry.md 含来源字段（三个技能均标注"本项目自研"，无需外部 URL），AC-REUSE-002 要求每条目含来源字段，可追溯来源。

### S4 自定义技能必须有指标系统
- **结论**: pass
- **依据**: FR-METRICS-001 要求 metrics/capture.mjs 新增四字段（commit_sha / base_sha / head_sha / risk_level），evidence 五件套均有结构化 JSON 格式定义，纳入统一执行记录。

### S5 自定义技能方便子代理调用省主上下文
- **结论**: pass
- **依据**: FR-REVIEW-001 拆分为两个独立子代理，符合子代理调用省主上下文设计；worktree.json 作为跨阶段共享状态，由 make-decision 阶段写入，各 phase 子代理读取，减少主上下文占用。

### S6 自定义技能参考市面方案不闭门造车
- **结论**: pass
- **依据**: spec §复用策略明确复用本项目已有自研技能（review-trigger/verdict-handler/checkpoint-protocol）而非另起炉灶，reuse-registry.md 统一登记不封闭设计。

### S7 一阶段一技能一工作流一文件夹
- **结论**: pass
- **依据**: 本次改动主体为 `workflows/build-code/SKILL.md`（一工作流一文件夹），新增技能登记到 `skills/reuse-registry.md`，目录约定符合 CLAUDE.md 规定。

### S8 自定义技能可独立调用可搬运
- **结论**: pass
- **依据**: reuse-registry.md 登记的三个自研技能来源字段要求填写，确保可追溯可搬运。FR-REUSE-001 AC-REUSE-002 要求来源字段不可缺失。

---

## 汇总

| 原则 | 结论 | 备注 |
|------|------|------|
| F1 薄核心 | pass | |
| F2 窄契约 | pass | |
| F3 物理事实不阻断 | pass | |
| F4 质量靠独立审查 | pass | |
| F5 变更可追溯 | pass | |
| F6 记录事实不裁决 | pass | |
| F7 人工确认不可逆 | pass | |
| F8 简单优先 | pass | mtime防伪已移除，双子代理低风险已批准（原warn转pass） |
| F9 可证伪性 | pass | |
| F10 自动化按真实收益 | pass | mtime防伪已移除，其余机制四问评估通过（原warn转pass） |
| Q1 推进不阻断 | pass | |
| Q2 独立审查优先 | pass | 本轮3rd-review已异源跑成（codex），非降级 |
| Q3 禁止自审自判 | pass | |
| Q4 质量裁决独立来源 | pass | |
| S1 不造轮子 | pass | |
| S2 外部技能可改造 | pass | |
| S3 迭代保持最新 | pass | |
| S4 指标系统 | pass | |
| S5 省主上下文 | pass | |
| S6 参考市面方案 | pass | |
| S7 一阶段一技能 | pass | |
| S8 可独立调用搬运 | pass | |

**fail 项: 0 | warn 项: 0（原 F8/F10 两项已随 mtime 防伪移除复检转 pass）| pass 项: 21**

> 复检时间：2026-07-01（用户反馈后）。复检前状态：0 fail / 2 warn(F8,F10) / 19 pass。
