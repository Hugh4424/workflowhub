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
