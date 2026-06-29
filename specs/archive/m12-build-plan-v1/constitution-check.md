# 宪法符合性检查 — m12-build-plan-v1

> 对照 `constitution-checklist.md` 21 条，对 `spec.md`（m12-build-plan-v1）逐条勾选。
> 每条附一条具体判据，引用 spec 中的 FR 编号或章节。
> 非合规不阻断，如实记录。

**汇总**：21 条全合规（21/21 [x]，0 条 [ ]）。

---

## 框架原则（F1–F10）

- [x] **F1 薄核心** — build-plan v1 核心只做编排调度（FR-BP-001 串行调用 plan-generate → tasks-generate → cross-artifact-analyze），重活全部下沉到三个独立子技能，核心不改业务逻辑（§5 模块划分）。
- [x] **F2 窄契约** — 模块间走窄文件接口：task-id 参数入，spec.md/plan.md/tasks.md 文件出（FR-MIG-002 要求每个子技能有输入参数契约），不暴露彼此内部实现（§5 各模块"对外提供什么业务能力"均以文件产物为边界）。
- [x] **F3 物理事实靠机器校验但不阻断** — 宪法符合性检查、跨产物一致性检查、基线对照均由机器执行采集，但均声明"仅记录不阻断"（FR-CONSTITUTION-002 / FR-XARTIFACT-002 / FR-BASELINE-002），非目标 #1 明确"不做 blocking 质量门"。
- [x] **F4 质量靠异源审查与人而非阻断式质量门** — cross-artifact-analyze 作为独立第三方技能扫描三产物（FR-XARTIFACT-001），加一次人审检查点（FR-REVIEW-001），决策 D-M12-5 明确引用"承接 F4 异源审查不卡死"，未设阻断式质量门。
- [x] **F5 gate 谨慎添加出事再补无用则移除** — v1 仅保留 M6 既有 F10 gate（FR-SKELETON-001 4 问），未新增任何阻断式关卡；宪法检查和 analyze 报告均为记录型步骤非 gate；非目标 §2 节明确不堆砌 gate。
- [x] **F6 统一外置执行记录** — 保留 M6 metrics collector 契约（FR-SKELETON-002 recordSkeleton + updateOwnResult），stage-result JSON 为统一执行记录（§6 关键实体定义），基线对照表按统一口径产出（FR-BASELINE-001）。
- [x] **F7 推进与不可逆操作不自动越过人** — 设一且仅一次人审检查点（FR-REVIEW-001），在 stage-result 产出前明文停顿等人确认（场景 3.7），"不会在无人确认的情况下自动推进"。
- [x] **F8 简单优先** — task-id 显式传参替代 git 分支推断（FR-DECOUPLE-001），模板从本地 templates/ 目录读（FR-DECOUPLE-002），analyze 只做文本扫描不引入自动修复（FR-XARTIFACT-002），缺失参数 fail-loud 不做隐藏兜底（FR-DECOUPLE-001 场景）。
- [x] **F9 可证伪不假绿** — 宪法勾选缺条/缺判据即失败（FR-CONSTITUTION-003），基线对照任一行缺值即失败（FR-BASELINE-001），task-id 缺失报明确错误（FR-DECOUPLE-001），假设段声明"Let-it-crash 策略"。
- [x] **F10 自动化按真实收益添加不为"机器可校验"本身堆基建** — 保留 F10 4 问 gate 审查所有新增机制（FR-SKELETON-001），未新增 CI/自动校验/机器执行通道，analyze 为只读记录而非自动化修复，非目标明确拒绝 blocking 质量门和 per-project clone 基建。

## 质量原则（Q1–Q3）

- [x] **Q1 记事实而非阻断** — 宪法检查结果"仅记录浮现供人审查，不因不达标阻断"（FR-CONSTITUTION-002），analyze 报告"仅记录不阻断"（FR-XARTIFACT-002），基线对照"不达标不阻断推进"（FR-BASELINE-002），与 F3/F4 一致。
- [x] **Q2 gate 三类划分** — 入口校验：task-id 缺失报错、spec 不存在报错（FR-DECOUPLE-001/FR-BP-001 场景）；记录采集：宪法勾选（FR-CONSTITUTION-001）、analyze 报告（FR-XARTIFACT-001）、基线对照（FR-BASELINE-001）；人工确认：人审检查点（FR-REVIEW-001）。三类清晰分离，未把记录型做成阻断门。
- [x] **Q3 异源审查加人工把关** — cross-artifact-analyze 为独立于 plan-generate/tasks-generate 的异源审查者（§5 analyze 为独立模块，FR-XARTIFACT-001 四类问题标注），审查结果由人审检查点最终确认（FR-REVIEW-001），无自审自判。

## 技能原则（S1–S8）

- [x] **S1 能用外部就不造轮子** — plan-generate/tasks-generate/cross-artifact-analyze 均迁移自成熟外部方案 speckit-plan/tasks/analyze（FR-REGISTRY-001 登记类别为"外部改造适配"），不自行从零研发。
- [x] **S2 外部技能可针对项目改造合宪** — 三件技能经过去 git 分支推断（FR-DECOUPLE-001）、去 per-project `.specify/` 依赖（FR-DECOUPLE-002）、去分支身份推断（FR-DECOUPLE-003）改造，使其合 workflowhub 宪法。
- [x] **S3 迭代时保持最新并就地检查** — 三技能在 reuse-registry.md 中登记来源路径指向原始 speckit SKILL.md（FR-REGISTRY-001），假设 1 记录命名链条，来源可追溯供未来迭代时就地检查。
- [x] **S4 自定义技能必须有指标系统** — build-plan v1 保留 M6 metrics collector 调用（FR-SKELETON-002 recordSkeleton + updateOwnResult），三子技能执行纳入 build-plan stage 的统一执行记录底座。
- [x] **S5 自定义技能方便子代理调用省主上下文** — 三子技能各自为独立可调起的 SKILL.md（FR-MIG-002），场景 3.1-3.4 描述编排者派子技能执行、只收产物的模式，子代理独立上下文执行重活。
- [x] **S6 自定义技能参考市面方案不闭门造车** — 三技能源自 speckit-plan/tasks/analyze 成熟方案（FR-REGISTRY-001），决策 D-M12-4 明确参照"speckit-plan等成熟方案改造"，非闭门凭空设计。
- [x] **S7 一阶段一技能一工作流一文件夹** — 三新技能各占独立 workflows/ 目录（FR-MIG-001/002），build-plan 仍在 workflows/build-plan/ 不合并，新增按目录约定接入核心零改动（§11 影响范围）。
- [x] **S8 自定义技能可独立调用可搬运** — 各技能独立可调起（FR-MIG-002"可独立调起测试"），用 task-id 显式参数不绑 git 上下文（FR-DECOUPLE-001），模板内置不依赖外部项目脚手架（FR-DECOUPLE-002），可跨宿主搬运。
