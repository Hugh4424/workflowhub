# CARD-01 阶段与材料接口蓝图

本蓝图供 CARD-02 到 CARD-10 读取。它冻结当前产品契约与消费者，不是新的状态机、公共命令或推进许可证；缺失、失效或未登记只能形成验收缺口，当前任务仍可继续安全工作和修复。

## 任务类型受控值

- 契约：仅 `规划任务`、`普通任务`；唯一声明来源是当前 `decision-log.md` 的任务身份段。
- owner：任务创建者/当前主会话；consumer：`runtime/task/task-topology.mjs` 与 `tools/cli/stage-runtime.mjs`。
- 缺失或非法：写入 `quality/evidence/task-type-attempts/` 澄清事实；不猜默认类型，也不冒充已推进。

## 类型到拓扑映射

- `规划任务`：`make-decision → build-prd`。
- `普通任务` 且 cohort=`pre`：`make-decision → build-spec → build-plan → build-code → verify-code`。
- `普通任务` 且 cohort=`post`：`make-decision → build-plan → build-code → verify-code`。
- owner：`runtime/task/task-topology.mjs`；consumer：`stage-runtime` 的入口投影与后续卡的拓扑核对。类型或 cohort 的缺失是澄清/验收事实，不能被伪造成任意拓扑。

## 正式阶段与 build-prd portable 身份

- 正式阶段集合严格保持五项：`make-decision`、`build-spec`、`build-plan`、`build-code`、`verify-code`。
- `build-prd` 是规划任务的 portable workflow，有六个既定步骤和独立七值终态记录；它不成为第六正式阶段，也绝不滑入代码阶段。
- owner：`runtime/task/portable-workflow-run.mjs`；consumer：`run/status --stage=build-prd` 的规划任务分支。

## 七值状态

允许值只有 `not-started`、`in-progress`、`succeeded`、`failed`、`unverified`、`blocked`、`abandoned`。机器/质量事实缺失只能保持 `missing`、`unavailable`、`incomplete` 等真实质量结论，不能包装为 `blocked` 或 `succeeded`；失败修复后重入原阶段，后续阶段不自动启动。

## 材料与执行事实归属

- 四份当前材料（`decision-log.md`、`spec.md`、`plan.md`、`tasks.md`）是产品真相，owner=认证 worktree 内当前主会话。
- task store 的 `quality/**` 是执行、测试、审查、诊断与 portable 终态事实，owner=相应 producer，consumer=当前 stage 与验收读取器。
- 机器事实失配必须保留原始字节和诊断；不重写历史 `failed`、`missing`、`unavailable` 或伪造通过。

## 推进事实与完成事实

任务可以继续安全工作不等于质量完成。流程清单、固定轮次、outcome/receipt hash、review/test/evidence、inventory 与本蓝图都是记录/核对事实；它们失败时返回真实 `unavailable`/`incomplete`/`missing`，不成为普通阶段推进许可。依赖当前材料字节的具体动作仍在材料物理不可读时失败并可修复重试。

## 人工边界与审查重派

- 人工阻断只保留两类：既有阶段/portable 合同的确认（A），以及既有 `authorize` 合同中的不可逆动作授权（B）。等待或拒绝不执行具体动作，阶段仍为 `in-progress`；A 不可代替 B。
- review、test、evidence 的缺失或失效不新增人工门。review recorder 只有在 workflow 正处该 review 步且被明确调用时才派发；finding disposition、repair 或材料编辑不自动回跳和重派已完成 review。

## 生命周期

- 删除条件：被后续卡经独立审查的统一阶段/材料契约取代，且 CARD-02..CARD-10 没有消费者继续引用本蓝图。
- 验证消费者：`tests/integration/card-01-dual-journey.test.mjs` 和 `tests/acceptance/card-01-current.mjs`。
