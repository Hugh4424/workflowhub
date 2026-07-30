# 核心质量流程真实执行与轻量记录：决策日志

## 恢复状态

- 当前任务采用“同任务透明恢复”。
- `make-decision` run-0001 至 run-0004 均保留为历史并已正式标记 invalidated/incomplete；它们不能称为 accepted 或 pass。
- 原因：正式 runtime 没有调用 `skill-deps.yaml` 声明的组件，caller 可以直接发布 payload、receipt 或 journal 来完成步骤。
- 不删除、不覆盖、不倒填旧记录；不把手写 payload 改称真实 Skill invocation。
- 先在当前 task/worktree 维护四材料并修复通用编排；修复后从正式入口重跑 `make-decision`。

## 已接受方向

1. **全局调用真实性**
   五阶段声明的 direct Skill 只有经过
   `stage-skill-runtime -> hostInvoke` 调用后，才产生 runtime-owned
   invocation fact。content evidence、receipt、journal 和宿主文字不能替代调用事实。

2. **阶段完成统一核对**
   完成声明统一对照 `steps.json`、`skill-deps.yaml`、invocation facts 和业务完成事实。
   `always` 缺调用，或 `conditional` 缺 `executed` / `trigger=false + reason` 时，
   只能报告 incomplete/unknown；仍允许在同一任务继续修复。

3. **三个谓词分离**
   - 可继续工作：build-code/verify-code 只看当前四材料是否存在且可读。
   - 正式写入真实：task/worktree/runtime、ref/hash、顺序和核心 publication 结构错绑时 fail-loud。
   - 可宣称完成：核心交付、风险相关测试、逐 AC、真实独立审查事实和人类交接齐全。
   “业务完成”只描述代码、测试和 AC 的结果；“阶段记录完整”描述 invocation、
   review、handoff 和结构绑定是否齐全。后者缺失必须如实显示 incomplete，
   但不能反过来把 review/audit 变成开发进入 Gate。

4. **审计不是 Gate**
   audit/support fact 缺失或 unavailable 只披露，不阻止工作，也不改变代码、测试或 AC 结论。
   错绑的 audit 仍属于正式写入真实性错误，必须 fail-loud。

5. **一次审查，修复后聚焦验证**
   首次 verdict 永久保留。`revise_required` 修复后追加 finding resolution、
   受影响测试和逐 AC 验证；不覆盖旧结果、不强制二审、不追求新的 pass。
   每个阶段/候选的首次声明审查仍须真实执行或如实 unavailable。
   已有 canonical verdict 后，只有用户明确要求时才新增额外语义 review action。

6. **四材料可直接更新**
   `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 都是当前材料。
   更新只追加 revision/source/change summary；旧 hash/checkpoint/accepted 是历史，
   不得成为编辑、开发或验证许可证。

7. **浏览器 QA 证据统一**
   UI 验收记录测试页面或流程、工具/引擎、登录态是否复用、性能状态与结果、
   截图、测试文件/命令/exit、cleanup 和限制。它只决定对应 UI AC，
   不是所有任务的通用 Gate。

8. **verify-code 完整但不闸门化**
   verify-code 显式展示当前四材料、交付范围、风险测试、逐 AC、tasks、
   条件性浏览器证据、独立审查、审计缺口、风险和交接。
   代码、测试和 AC 决定业务完成；audit 完整性单独披露。

9. **处理组 3：问题 9**
   replay/aggregation 保留 `evidence_anchor_valid` 和 `requested_profiles`。
   新记录按稳定 finding identity 精确匹配；缺失或错配 fail-loud。
   legacy 模糊匹配只作诊断，不能影响 verdict。

10. **处理组 3：问题 15**
    provider 前材料不完整记录 `MATERIAL_INCOMPLETE` 且调用数为 0。
    同一 review subject 不重复 initial/full；普通补充和修复只走 resolution/聚焦验证。

## 决策卡

### D-01：全局调用真实性

- **来源**：用户要求调查五阶段声明步骤为何能跳过，并保证交付质量。
- **事实/约束**：声明、内容证据、receipt、journal 或宿主文字都不能证明 Skill 真实调用。
- **选择及理由**：仅承认 `stage-skill-runtime -> hostInvoke` 产生的 runtime-owned invocation fact，避免自报完成。
- **影响/风险**：五阶段必须补齐真实调用事实；缺失时只能如实 incomplete。
- **拒绝方案**：用手写 payload、receipt、journal 或文字代替调用事实。
- **开放项**：无。
- **supersedes**：无。

### D-02：阶段完成统一核对

- **来源**：用户要求堵住步骤遗漏，但不能增加认证、Gate 或重复审查。
- **事实/约束**：声明步骤、依赖技能、调用事实和业务事实可能互相不一致。
- **选择及理由**：完成声明统一核对 `steps.json`、`skill-deps.yaml`、invocation facts 和业务完成事实。
- **影响/风险**：always 或 conditional 事实缺失时显示 incomplete/unknown，但同一任务仍可继续修复。
- **拒绝方案**：只看 journal、receipt 或单一状态字段判断阶段完成。
- **开放项**：无。
- **supersedes**：无。

### D-03：三个谓词分离

- **来源**：用户要求保证质量，同时不违反 WorkflowHub 宪法。
- **事实/约束**：继续工作、正式写入真实、可宣称完成是三件不同的事。
- **选择及理由**：分别判断材料可读、身份与 ref/hash/顺序绑定、核心交付与测试/AC/审查/交接。
- **影响/风险**：记录缺失必须披露，但不能反向成为开发进入 Gate。
- **拒绝方案**：用一个总状态同时控制开发许可、事实真实性和完成宣称。
- **开放项**：无。
- **supersedes**：无。

### D-04：审计不是 Gate

- **来源**：用户明确要求审计缺失只如实说明，不能违反宪法。
- **事实/约束**：audit/support fact 可能 missing 或 unavailable；错绑则属于真实性错误。
- **选择及理由**：缺失只披露，错绑 fail-loud，代码、测试和 AC 结论不由审计完整性替代。
- **影响/风险**：审计不足不会卡住开发，但不能隐藏或伪报。
- **拒绝方案**：把审计齐全设为通用 Gate，或忽略错绑记录。
- **开放项**：无。
- **supersedes**：无。

### D-05：一次审查，修复后聚焦验证

- **来源**：用户要求保留原审查结果，修复后不覆盖历史、不强制二审。
- **事实/约束**：重复 full review 会增加成本，也会形成追求 pass 的循环。
- **选择及理由**：永久保留首次 verdict；修复后追加 resolution、受影响测试和逐 AC 验证。
- **影响/风险**：`revise_required` 不会被新 pass 覆盖；额外语义 review 仅由用户明确要求触发。
- **拒绝方案**：审查、修复、再审查循环，或自动重做完整审查。
- **开放项**：无。
- **supersedes**：无。

### D-06：四材料可直接更新

- **来源**：用户要求同一任务可更新 plan、tasks 等材料，不被旧 hash 阻断。
- **事实/约束**：当前材料需要正常演进，同时旧版本和 lineage 仍需保留。
- **选择及理由**：四材料直接追加 revision/source/change summary，旧 hash/checkpoint 仅作历史。
- **影响/风险**：材料可继续维护；版本同步必须真实，但不产生开发许可证。
- **拒绝方案**：每次修改都强制 reopen、授权、checkpoint 或 full review。
- **开放项**：无。
- **supersedes**：无。

### D-07：浏览器 QA 证据统一

- **来源**：用户要求统一证明浏览器测试真实执行过。
- **事实/约束**：只写“页面测试通过”不能说明页面、登录态、性能、截图、测试文件和清理。
- **选择及理由**：统一记录页面/流程、工具/引擎、登录态、性能、截图、命令/exit、cleanup 和限制。
- **影响/风险**：证据只裁决对应 UI AC，不扩展为所有任务的 Gate。
- **拒绝方案**：只写结论，或把浏览器证据设为通用认证要求。
- **开放项**：无。
- **supersedes**：无。

### D-08：verify-code 完整但不闸门化

- **来源**：用户要求 verify-code 更完整，但审计记录不能变成 Gate。
- **事实/约束**：代码、测试、AC 与审计材料承担不同职责。
- **选择及理由**：verify-code 展示九类验证信息；业务完成仍由代码、测试和 AC 决定。
- **影响/风险**：审计缺口、风险和限制会显式披露，不会伪装成业务失败或通过。
- **拒绝方案**：快速简陋核对，或用审计完整性阻断验收。
- **开放项**：无。
- **supersedes**：无。

### D-09：处理组 3 问题 9

- **来源**：用户要求“处理组 3”及 WorkflowHub 核心质量问题全部纳入本任务。
- **事实/约束**：replay/aggregation 必须稳定绑定 evidence anchor、profiles 和 finding identity。
- **选择及理由**：保留 `evidence_anchor_valid`、`requested_profiles`，新记录精确匹配，错配 fail-loud。
- **影响/风险**：legacy 模糊匹配仅诊断，不能改变 verdict。
- **拒绝方案**：依赖模糊 finding 文本或 caller 自报互证。
- **开放项**：无。
- **supersedes**：无。

### D-10：处理组 3 问题 15

- **来源**：用户要求材料补齐后不要自动触发重复 full review。
- **事实/约束**：provider 前材料可能不完整；同一 subject 重复 initial/full 会浪费成本。
- **选择及理由**：材料不完整记 `MATERIAL_INCOMPLETE`、调用数为 0；普通补充只走 resolution/聚焦验证。
- **影响/风险**：保留首次审查历史，不因材料变化自动重审。
- **拒绝方案**：材料一变化就自动 full review，或在材料不完整时仍调用 provider。
- **开放项**：无。
- **supersedes**：无。

### D-11：post-Grill 材料修订的聚焦复核

- **来源**：detail review 整改后，current material tree 已不同于原 Grill tree。
- **事实/约束**：直接把旧 Grill 重绑到新树会伪造事实；重跑 Talk 或 full review 又违反一次审查原则。
- **选择及理由**：新版 decision receipt 不改写 Step 9；追加一次真实 `grill-revalidation`，由 runtime 注入原 Grill 和当前 material revision，再让 aggregate 复用三轮 Talk。
- **影响/风险**：只复核变更后的材料；缺少新的 authenticated invocation 时不能引用该 revalidation。
- **拒绝方案**：重写旧 Grill/hash、整 run 重跑 Talk/full review，或把 revision 变成 Step 9 retry 手续。
- **开放项**：无。
- **supersedes**：D-06 的 post-Grill material 更新细化，不覆盖 D-06。

## Grill 结论

- `CONTEXT.md` 已更新，补齐本任务使用的恢复、当前材料和 requirements 指针术语。
- ADR 结论为 `not-needed`：本次只修订既有 ADR 0002、0007、0008，不新建 ADR。
- 三项 ADR 判据均不是新决策：调用/需求追踪沿用 ADR 0002，审查材料与一次审查沿用 ADR 0007，同任务追加恢复沿用 ADR 0008。
- 已解决“堵遗漏”与“不能增加认证、Gate、重复审查”之间的冲突：真实性错绑 fail-loud，审计缺失仅披露，修复后只做聚焦验证。
- Grill 核对的 7 个文件引用为：`CONTEXT.md`、`docs/adr/0002-requirement-lineage-and-step-audit.md`、`docs/adr/0007-phase-and-integration-review-material-architecture.md`、`docs/adr/0008-same-task-recovery-is-append-only.md`、`specs/workflow-quality-recording-simplification/decision-log.md`、`specs/workflow-quality-recording-simplification/spec.md`、`specs/workflow-quality-recording-simplification/plan.md`。
- 四项退出检查均通过：外部接口按真实 runtime/TaskKernel/review 路由核实；字段与路径以 core/schema/四材料为唯一来源；调用缺失和错绑的失败语义明确；做什么/不做什么的边界已写死。
- 零问题理由：没有剩余会改变范围、质量边界或下游实现方向的重大歧义；现存 provider priority 仅是开放交付风险。

## 非目标

- 不修改 `talk-with-zhipeng` 等具体 Skill 的业务方法。
- 不增加签名平台、宿主认证、真人阅读证明或新的确认点。
- 不造第二套阶段状态机或审计数据库。
- 不把 invocation/audit 历史变成 build-code/verify-code 的进入 Gate。
- 不因普通材料编辑自动 full review。
- 不用新 pass 覆盖旧 `revise_required`。
- 不重复 dispatch `wh-review` 内部拥有的 review lenses。

## 术语

- **invocation fact**：runtime-owned，绑定 task/stage/run/skill/trigger/outcome 的真实调用事实。
- **content evidence**：组件输出内容；不能单独证明组件已调用。
- **completion reconcile**：阶段完成前对声明组件、调用事实和业务事实的统一核对。
- **audit/support fact**：用于回溯的辅助事实；missing/unavailable 不阻止工作。
- **business completion fact**：核心交付、测试、逐 AC、审查事实和交接。
- **focused verification**：针对 finding 或材料增量的测试/合同核对，不重新做完整语义审查。
- **material revision**：四材料当前版的轻量 append-only 版本元数据，不产生推进许可证。

## 来源

- 用户要求：处理组 3 与五项 WorkflowHub 质量流程问题全部纳入同一任务。
- 用户纠正：问题不是修改 talk Skill，而是五阶段声明的质量流程可被跳过。
- 用户决定：采用同任务透明恢复。
- `CONSTITUTION.md` v1.5.0：F1、F3、F4、F5、F8、F9、F10、Q1、Q2、Q3、S7、S8。

## 开放事项

- 当前 run-0005 正在以真实 invocation 完成正式 make-decision；最终人类确认尚未发生，不能称 accepted。
- 方向审查已提示本机 build-code provider priority 排序配置警告。它不改变本任务方向；若它在后续 T013 实际阻断独立审查，必须如实报告并取得用户对全局配置变更的单独授权，不能静默修改。
