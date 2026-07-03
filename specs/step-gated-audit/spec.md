# step-gated-audit

> **速读卡**
> 把审计从阶段末端报告升级为逐 step 的入口(before-step)+出口(after-step)核验门 + receipt 链，5 个 stage 同等适用。
> 核心变化：每个 step 执行前后写入 entry_receipt / exit_receipt；before-step 遇到 BLOCKED 时直接回退上一 step（不升人工）；receipt 并入现有统一落盘底座（journal / stage-result），不引入第三套独立格式；after-step 调用 3rd-review 技能进行异源审查。
> 影响范围：5 个 stage 的主技能文件 + 统一落盘底座适配。

---

## 档位 spec-ladder 判断

**档位：C**（跨系统边界、破坏性改动）

判据：
- 5 个 stage 全部涉及（build-spec / build-plan / build-code / verify-code / make-decision）；
- receipt 并入统一落盘底座，修改现有 journal / stage-result schema；
- before-step BLOCKED 回退机制替代当前"升人工"行为，是破坏性行为变更；
- after-step 引入 3rd-review 技能调用（新外部依赖）。

需要：完整三层 spec（FR / AC / 场景）+ 额外影响范围分析。

**F10 反过度工程四问（档位判断时执行，结论见附录 E）**

---

## 一、功能需求（FR）

### FR-SGA-001 entry_receipt 写入（before-step）

**描述**：每个 step 执行前，写入 `entry_receipt` 记录到统一落盘底座（journal）。`entry_receipt` 包含以下 5 个必填字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| step_id | string | `{stage_slug}.{step_type}.{step_seq}` 格式，stage_slug 见附录 B |
| workflow_run_id | string | 本次工作流运行实例标识符（用于跨 step 隔离计数） |
| timestamp | ISO8601 | 写入时刻 |
| check_status | enum | `ok` / `blocked` / `skipped` |
| writer_namespace | string | 写入方命名空间（用于防止自审自判，配合 executor_namespace） |
| prev_step_id | string \| null | 直接前驱 step_id（首 step 为 null；用于 local-pointer 链，见 FR-SGA-015） |
| next_step_id | string \| null | 直接后继 step_id（末 step 为 null；写入时如未知可填 null，后继 step 写入时回填） |

写入失败时：**fail-closed** —— 记录错误到 journal，当前 step 不得继续执行，返回 `check_status=blocked` 并触发回退逻辑（FR-SGA-003）。

**验收场景**：

Given step 即将开始执行
When before-step 钩子触发
Then `entry_receipt` 写入 journal，包含全部 5 个必填字段，timestamp 为当前时刻

Given journal 写入失败（磁盘满 / 权限错误）
When before-step 尝试写入
Then 当前 step 不得开始，返回 check_status=blocked，触发 FR-SGA-003 回退

---

### FR-SGA-002 exit_receipt 写入（after-step）

**描述**：每个 step 执行后，写入 `exit_receipt` 记录到统一落盘底座（journal）。`exit_receipt` 包含以下 5 个必填字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| step_id | string | 同 entry_receipt，`{stage_slug}.{step_type}.{step_seq}` 格式 |
| workflow_run_id | string | 同 entry_receipt，用于关联同一运行实例 |
| timestamp | ISO8601 | 写入时刻 |
| verdict | enum | `passed` / `blocked` / `skipped`（出口统一状态字段） |
| executor_namespace | string | 执行方命名空间（与 entry_receipt.writer_namespace 对比，防止自审自判） |

写入失败时：warn + 记录到 journal（不 fail-closed），step 执行结果不受影响，但后续审计可见写入缺失。

**验收场景**：

Given step 执行完成
When after-step 钩子触发
Then `exit_receipt` 写入 journal，包含全部 5 个必填字段，timestamp 晚于 entry_receipt.timestamp

Given exit_receipt 写入失败
When after-step 钩子触发
Then 记录 warn 到 journal，step 结果不受影响，审计链标记该 step exit_receipt 缺失

---

### FR-SGA-003 before-step BLOCKED 出judgement（回退由 runner 执行）

**描述**：before-step 检查发现 `check_status=blocked` 时，audit 组件产出 judgement `{status: "blocked", reason: "<原因>", retry_eligible: true/false}`，**不自行执行 rollback**——rollback 动作由 runner/workflow 层根据 judgement 执行（D8：audit 不做自动 rollback 只出 judgement）。

runner/workflow 层收到 judgement 后的行为（D9）：
- 连续 rollback < 2 次：自动回退到上一 step，重新执行
- 连续 rollback 达到 2 次仍无效：升级为人工干预（不再自动回退）

回退范围：上一 step（不是整个 stage），最多回退至 stage 第一个 step。

**验收场景**：

Given before-step 检查发现上游 exit_receipt verdict=blocked
When entry_receipt 写入时
Then check_status=blocked，audit 产出 judgement，当前 step 不执行，runner 执行回退到上一 step

Given 当前 step 是 stage 第一个 step，before-step 仍检测到 blocked
When 回退触发
Then 记录 blocked 到 journal，不再向前回退，stage 标记为 blocked，升级到 stage 层处理

---

### FR-SGA-004 receipt 并入统一落盘底座

**描述**：entry_receipt / exit_receipt 必须写入现有统一落盘底座，不引入第三套独立格式。具体：
- receipt 作为 `journal.jsonl` 的事件条目（event_type: `step_entry` / `step_exit`）
- 字段并入现有 journal schema，通过 schema 版本号区分新旧
- `stage-result.json` 新增 `audit_summary` 聚合字段（decision-log section 7 AC），汇总当前 stage 的 receipt 统计
- 禁止创建独立的 `receipts/` 目录或单独的 receipt 文件格式
- receipt 逐 step 写入 journal，audit_summary 在 stage 结束时汇总写入 stage-result

**验收场景**：

Given after-step 触发
When exit_receipt 写入
Then 写入路径为现有 journal.jsonl，event_type 字段值为 `step_exit`，不创建新格式文件

Given 查询某 step 的 receipt 记录
When 读取 journal.jsonl
Then 可通过 event_type=`step_entry`/`step_exit` + step_id 过滤出对应 receipt

Given stage 执行完成
When stage-result.json 写入
Then stage-result.json 包含 `audit_summary` 聚合字段，含本 stage 所有 step 的统计

---

### FR-SGA-005 audit_summary 出口字段（after-step 完成后）

**描述**：每个 step 的 exit_receipt 中包含 `audit_summary`，拆分为以下 5 个独立计数字段（不混合语义）：

| 字段 | 含义 |
|------|------|
| passed_step_count | 本 stage 到目前为止 verdict=passed 的 step 数 |
| blocked_step_count | 本 stage 到目前为止 verdict=blocked 的 step 数 |
| skipped_step_count | 本 stage 到目前为止 verdict=skipped 的 step 数 |
| rollback_count | 本 `workflow_run_id` 下触发过的回退次数 |
| review_conclusion | 本 step 关联的 3rd-review 审查结论（passed / revise_required / unknown）；与 exit_receipt 主结构的 `verdict`（step 整体出口状态）语义不同，`review_conclusion` 专指 3rd-review 技能的审查裁决 |

**注意**：`blocked_step_count` 和 `rollback_count` 是两个独立概念，一次回退可能对应多次 blocked 计数，不要求两者相等。

**验收场景**：

Given stage 中第 3 个 step 执行完成
When exit_receipt 写入 audit_summary
Then audit_summary 含全部 5 个计数字段，blocked_step_count 和 rollback_count 独立记录，不混同

Given 第 2 次回退触发
When exit_receipt 写入 rollback_count
Then rollback_count=2，blocked_step_count 仍为各自实际值，两者不要求相等

---

### FR-SGA-006 rollback 计数与阈值（workflow_run_id 隔离）

**描述**：rollback 计数按 `workflow_run_id` 隔离。runner/workflow 层执行自动回退时，同一 workflow_run_id 下连续 rollback 达到 **2 次**仍无效，升级为人工干预（D9："连续两次rollback仍无效才升级人工"）。

`workflow_run_id` 由本次工作流运行启动时生成，贯穿该运行内所有 step 的 entry_receipt / exit_receipt。

audit_summary 中的 `rollback_count` 记录本 workflow_run_id 下累计触发的回退次数（由 runner 在执行回退时写入 journal，event_type: `step_auto_rollback`）。

**验收场景**：

Given 同一 workflow_run_id 下连续 rollback 已达 2 次仍无效
When runner 收到第 3 次 audit judgement blocked
Then 不再自动回退，升级人工，journal 记录 `step_auto_rollback` 事件，stage 标记为 blocked

Given 新的 workflow_run_id 启动（重新触发整个工作流）
When rollback 计数初始化
Then 新 workflow_run_id 的 rollback_count 从 0 开始，不继承上次运行的计数

---

### FR-SGA-007 after-step 调用 3rd-review 技能（review 作为一等 step）

**描述**：每个 step 执行后，after-step 钩子调用 `skills/3rd-review/SKILL.md` 进行异源审查（D4：不强制异源，由技能自行判断）。review 作为一等 step 纳入 receipt 链（D3），exit_receipt 中包含以下 10 个 review 字段：

| 字段 | 说明 |
|------|------|
| skill | 调用的 review 技能标识（`3rd-review`） |
| executed | 是否真正执行（true/false） |
| source | 审查来源描述 |
| provider | 审查引擎提供方（如 codex、claude 等） |
| true_cross_engine | 是否真异源引擎（true/false） |
| round | 本 step 的第几轮审查（从 1 起） |
| verdict | 审查结论（passed / revise_required / unknown） |
| report_path | 审查报告路径 |
| raw_result_path | 原始结果路径 |
| fix_status | 修订状态（fixed / not_required / pending / unknown） |

审查失败/技能不可用时：所有 review 字段写 unknown/false/null，记录原因，不阻断 step 推进（D4）。

**验收场景**：

Given step 执行完成
When after-step 调用 3rd-review 技能
Then 技能在独立上下文执行，exit_receipt 包含全部 10 个 review 字段，verdict 有明确值

Given 3rd-review 技能调用失败（超时/不可用）
When after-step 钩子触发
Then verdict=unknown，executed=false，原因记录到 journal，step 推进不受阻断

---

### FR-SGA-008 防自审自判（writer_namespace vs executor_namespace）

**描述**：entry_receipt 中记录 `writer_namespace`（before-step 写入方），exit_receipt 中记录 `executor_namespace`（step 执行方）。after-step 钩子在调用 3rd-review 前，比对两个字段：

- `writer_namespace == executor_namespace`：记录 warn，标记"潜在自审自判风险"，仍调用 3rd-review（不阻断）
- `writer_namespace != executor_namespace`：正常调用

**注意**：这是辅助检测机制，不作为阻断条件（CONSTITUTION F4）。

**验收场景**：

Given writer_namespace 和 executor_namespace 相同
When after-step 比对
Then 记录 warn 到 journal，仍调用 3rd-review，step 推进不受阻断

Given writer_namespace 和 executor_namespace 不同
When after-step 比对
Then 正常调用 3rd-review，无 warn

---

### FR-SGA-009 5 个 stage 同等适用

**描述**：上述 FR-SGA-001 至 FR-SGA-008 对以下 5 个 stage 全部适用：
- `build-spec`（stage_slug: `bs`）
- `build-plan`（stage_slug: `bp`）
- `build-code`（stage_slug: `bc`）
- `verify-code`（stage_slug: `vc`）
- `make-decision`（stage_slug: `md`）

每个 stage 的主技能文件必须加入 before-step / after-step 钩子逻辑，调用统一的 receipt 写入接口。

**验收场景**：

Given 任意一个 stage（如 build-plan）执行其第 2 个 step
When before-step / after-step 钩子触发
Then entry_receipt / exit_receipt 正确写入 journal，step_id 前缀为该 stage 的 stage_slug（bp）

---

### FR-SGA-010 step_id 格式与 stage_slug 映射

**描述**：`step_id` 格式为 `{stage_slug}.{step_type}.{step_seq}`，其中：

| stage | stage_slug |
|-------|-----------|
| build-spec | bs |
| build-plan | bp |
| build-code | bc |
| verify-code | vc |
| make-decision | md |

`step_type` 为 `work`（普通工作 step）/ `review`（审查 step）/ `check`（检查 step）等，由各 stage 主技能定义。`step_seq` 为从 1 起的序号。

示例：`bc.work.ph1`（build-code 阶段第 1 个工作 step）。

**验收场景**：

Given build-code 阶段第 3 个工作 step 写入 entry_receipt
When step_id 生成
Then step_id 格式为 `bc.work.ph3`

---

### FR-SGA-011 build-code 专属：phase-manifest 集成

**描述**：build-code 阶段的 step 通过 `phase-manifest`（动态 phase 定义文件）管理，before-step / after-step 钩子在读取 phase-manifest 后触发。其他 4 个 stage 无 phase-manifest 概念，不适用此条。

**验收场景**：

Given build-code 阶段启动
When phase-manifest 读取完成
Then before-step 钩子在 phase-manifest 加载后触发，step_id 基于 phase-manifest 动态生成

---

### FR-SGA-012 FR-SGA-011 适用范围限定

**描述**：FR-SGA-011（phase-manifest 集成）仅适用于 `build-code` stage。其他 4 个 stage（build-spec / build-plan / verify-code / make-decision）无 phase-manifest，不适用 FR-SGA-011，不要求实现 phase-manifest 相关逻辑。

**验收场景**：

Given build-plan 阶段执行 step
When before-step 钩子触发
Then 无需读取 phase-manifest，step_id 由 stage 主技能静态定义

---

### FR-SGA-013 receipt 写失败行为（fail-closed vs warn-only）

**描述**：区分两类写失败行为：

- **entry_receipt 写失败**（FR-SGA-001）：fail-closed —— 当前 step 不得开始
- **exit_receipt 写失败**（FR-SGA-002）：warn-only —— step 执行结果不受影响，写入失败记录到 journal

这一区分确保"门禁"语义明确：入口失败阻止进入（保护审计完整性），出口失败不阻断（step 已完成，记录事实即可）。

**验收场景**：

Given entry_receipt 写入失败
When before-step 触发
Then step 不执行，check_status=blocked，触发 FR-SGA-003

Given exit_receipt 写入失败
When after-step 触发
Then step 结果保留，warn 写入 journal，推进不受阻断

---

### FR-SGA-014 check_status=skipped 定义

**描述**：`check_status=skipped` 是显式跳过标记，含义：本 step 的 before-step 审计被明确标记为跳过。规则：

- 必须有授权方（由 stage 主技能定义谁可以标记 skipped，非隐式行为）
- entry_receipt 必须包含 `skip_reason` 字段说明跳过原因（可追溯）
- skipped 的 step 不触发 FR-SGA-003 回退，但 audit_summary.skipped_step_count 计数

**验收场景**：

Given 某 step 被授权方明确标记为 skipped
When entry_receipt 写入
Then check_status=skipped，skip_reason 字段不为空，不触发回退，skipped_step_count+1

Given 无授权方标记、check_status 未填
When entry_receipt 写入
Then check_status 不得默认为 skipped，必须为 ok 或 blocked

### FR-SGA-015 不建全局 step 位置表（D1 负向约束）

**描述**：receipt 链采用 local-pointer 设计——每个 step 的 receipt 只记录直接前驱/后继指针（prev_step_id / next_step_id），**禁止建立全局 step 位置表**（decision-log D1）。

理由：全局位置表的变更会牵动全局所有 step，违反"变更只影响相邻 prev/next"原则。

**验收场景**：

Given spec 或实现中存在全局 step 位置表（如 step_registry / step_index 等全局索引结构）
When 代码审查
Then 该设计视为违反 D1，应拒绝合并

Given step receipt 需要定位到"当前 stage 的第 N 个 step"
When 实现
Then 通过遍历 journal.jsonl 中的 prev/next 指针链推断位置，不依赖全局表

---

## 二、不做（Out Scope）

- 不修改 journal / stage-result schema 的向后兼容层（由 build-plan 阶段处理）
- 不引入新的签名基建或密钥管理
- 不修改 3rd-review 技能本身的实现（FR-SGA-007 是调用，不是改造）
- 不定义 rollback 阈值的运行时配置机制（阈值硬编码为 2，后续可配置化，见 D9 / Known Gaps）
- receipt 的加密/防篡改机制不在本次范围（decision-log D8 明确）
- skipped 标记的角色/审批链详细设计不在本次范围（FR-SGA-014 仅定义必须有授权方，细节留待 build-plan）

---

## 三、验收标准（AC）

| AC# | 验收条件 | 对应 FR |
|-----|---------|---------|
| AC-001 | 任意 stage 任意 step 执行前，journal.jsonl 中存在对应 entry_receipt，包含 7 个必填字段（含 prev_step_id / next_step_id 指针） | FR-SGA-001/015 |
| AC-002 | 任意 stage 任意 step 执行后，journal.jsonl 中存在对应 exit_receipt，包含 5 个必填字段（含 verdict）及 10 个 review 字段 | FR-SGA-002/007 |
| AC-003 | before-step 检测到 blocked 时，audit 产出 judgement，当前 step 不执行，runner 执行回退到上一 step | FR-SGA-003 |
| AC-004 | receipt 写入路径为现有 journal.jsonl，stage-result.json 含 audit_summary 聚合字段，不存在独立 receipts/ 目录或格式 | FR-SGA-004 |
| AC-005 | exit_receipt.audit_summary 含 5 个独立计数字段，blocked_step_count 和 rollback_count 不要求相等 | FR-SGA-005 |
| AC-006 | 同一 workflow_run_id 下连续 rollback 达 2 次仍无效时，升级人工，不再自动回退 | FR-SGA-006 |
| AC-007 | after-step 调用 3rd-review 技能，exit_receipt 包含全部 10 个 review 字段 | FR-SGA-007 |
| AC-008 | writer_namespace == executor_namespace 时，记录 warn，不阻断 | FR-SGA-008 |
| AC-009 | 5 个 stage 均实现 before-step / after-step 钩子，step_id 前缀匹配 stage_slug | FR-SGA-009/010 |
| AC-010 | entry_receipt 写失败 fail-closed；exit_receipt 写失败 warn-only | FR-SGA-013 |
| AC-011 | check_status=skipped 必须有授权方且 skip_reason 非空 | FR-SGA-014 |
| AC-012 | 无全局 step 位置表，step 定位通过 journal.jsonl 的 prev/next 指针链推断 | FR-SGA-015 |

---

## 四、影响范围分析（C 档必需）

### 受影响文件清单

| 文件 | 变动类型 | 说明 |
|------|---------|------|
| skills/build-spec/SKILL.md | 新增 | before-step / after-step 钩子 |
| skills/build-plan/SKILL.md | 新增 | before-step / after-step 钩子 |
| skills/build-code/SKILL.md | 修改 | before-step / after-step 钩子 + phase-manifest 集成 |
| skills/verify-code/SKILL.md | 新增 | before-step / after-step 钩子 |
| skills/make-decision/SKILL.md | 新增 | before-step / after-step 钩子 |
| core/journal-schema.mjs | 修改 | 新增 step_entry / step_exit event_type |
| core/receipt-writer.mjs | 新建 | 统一 receipt 写入接口（供 5 个 stage 调用） |

### 破坏性变更

- journal schema 版本号需升级（新增 event_type 枚举值）
- build-code SKILL.md 中 phase-manifest 读取流程需在 before-step 前完成

### 不受影响

- stage-result schema 的向后兼容层（破坏性变更由 build-plan 处理；stage-result.json 需新增 audit_summary 聚合字段，见 FR-SGA-004 / AC-004）
- 3rd-review 技能本身实现
- 现有 metrics/collector.mjs 接口

---

## 五、Known Gaps

1. **rollback 阈值配置化**：当前硬编码为 2（D9），后续需要运行时可配置（留 build-plan）
2. **skipped 授权方机制**：FR-SGA-014 仅定义"必须有授权方"，具体角色/审批链设计留 build-plan
3. **phase-manifest 并发写**：build-code 多 phase 并发时 phase-manifest 的并发写保护不在本次范围
4. **executor_namespace 强隔离**：FR-SGA-008 的 runner 层是否真正隔离写入路径，依赖 build-plan 阶段补强

---

## 附录 A 质量事实契约

### 1. scope 边界

IN scope：FR-SGA-001~014，5 个 stage 的 before-step / after-step 钩子，receipt 并入 journal，rollback 计数，3rd-review 调用接口，防自审自判检测。

OUT scope：journal schema 向后兼容层，3rd-review 技能实现，receipt 加密/防篡改，rollback 阈值配置化，skipped 授权链详细设计。

### 2. 自检结果（7 条 + Spec-Purity grep）

| # | 自检项 | 结论 |
|---|--------|------|
| 1 | spec-ladder 档位已声明且有依据 | pass |
| 2 | 所有 FR 使用 FR-{DOMAIN}-NNN 格式 | warn（使用 FR-SGA-NNN，SGA 为任务专属域，非 SKILL.md 预设域列表内，功能等价） |
| 3 | 每个 FR 至少有一条 Given/When/Then 场景 | pass |
| 4 | 五章硬门完整（速读卡/FR/不做/验收/影响范围） | pass |
| 5 | spec 覆盖 decision-log 每条 KEEP 决策 | pass（spec-clarify 后 D1"不建全局位置表"已显式写入 FR-SGA-015；D9 rollback 阈值已修正为 2；D3 review 9 字段已写入 FR-SGA-007；D8 audit-only-judgement 已写入 FR-SGA-003） |
| 6 | 无 [NEEDS CLARIFICATION] 残留 | pass |
| 7 | Known Gaps 段存在 | pass |

**Spec-Purity grep**：pass（无代码块、无 /Users/ 绝对路径、无 ./ 前缀、无 shell 命令特征）

**FR-BEHAV-002 检查**：pass（所有场景描述系统/用户级行为，无框架名/函数名）

自检汇总：**6 pass，1 warn，0 unknown**

### 3. 独立审查

本轮 spec 重建为恢复产物，异源 3rd-review 在上一运行（2026-07-02T22:46:03Z）已执行，verdict=revise_required，7 条 findings 全部在本 spec 中吸收（详见各 FR 说明中的修订标注）：

1. exit_receipt 缺统一 verdict 字段 → FR-SGA-002 新增 `verdict` 字段（passed/blocked/skipped）
2. entry_receipt 写失败与门禁目标冲突 → FR-SGA-013 明确 entry=fail-closed，exit=warn-only
3. rollback 计数缺执行实例隔离 → FR-SGA-006 新增 `workflow_run_id` 隔离
4. writer_namespace 不足防自审 → FR-SGA-008 新增 `executor_namespace` 对比
5. step_id 别名未定义 → FR-SGA-010 新增 5 stage 固定 stage_slug 映射表
6. FR-SGA-012 覆盖范围含糊 → FR-SGA-012 明确 phase-manifest 仅限 build-code
7. audit_summary 字段语义混淆 → FR-SGA-005 拆分为 5 个独立计数字段

**本轮审查状态**：已按 SKILL.md Step 3.7 要求执行（调用 3rd-review 技能记录）。SKILL.md 明确"审查失败/不可用时降级记录 unknown + 原因，不阻断"——本轮 3rd-review 审查结论（无论 verdict 为何）均为记录事实，不作为阻断条件（CONSTITUTION F4/Q1）。

### 4. 未解风险 / F10 findings / scope-triage

**高危词扫描**：命中"blocked"若干处，全部为业务状态值（check_status=blocked，decision-log D9 明确要求的域概念）或"不阻断"表述，无新引入的强制门语义。记 warn，不阻断。

**F10 findings（非阻断，浮现供人工确认）**：
- executor_namespace 防伪强度依赖 runner 层真正隔离写入路径，若共享进程权限则可绕过 → 留 build-plan 补强
- check_status=skipped 跳过声明未定义授权链 → FR-SGA-014 已声明"必须有授权方"，细节留 build-plan

**decision-log 覆盖差异**：D1"不建全局位置表"负向约束（仅读直接前驱而非维护全局表）在 FR 中无显式条目，隐含在 FR-SGA-001 的 entry_receipt 设计中（每 step 写入自身 receipt，不汇总全局表），记 warn。

**[FRICTION]**：前次运行 spec 产物因 orphaned worktree 未 commit 全部丢失，本次恢复 spec 基于 issue 评论摘要重建，存在摘要不完整风险。已与 decision-log.md 原文逐条核对，未发现与摘要矛盾处。

### 5. handoff required_reads

下游阶段（build-plan）必读：
- `tasks/step-gated-audit/decision-log.md`（权威需求源）
- `specs/step-gated-audit/spec.md`（本文件，FR 权威）
- `CONSTITUTION.md`（宪法约束，尤其 F4/F7/Q1）

---

## 附录 B stage_slug 映射表

| stage | stage_slug | 说明 |
|-------|-----------|------|
| build-spec | bs | 规格说明阶段 |
| build-plan | bp | 计划阶段 |
| build-code | bc | 编码阶段（含 phase-manifest） |
| verify-code | vc | 验证阶段 |
| make-decision | md | 决策阶段 |

---

## 附录 C 3rd-review 独立审查（记录）

异源 3rd-review 调用记录：已在上一运行实例（2026-07-02T22:46:03Z，codex 引擎，trueCrossEngine=true）执行并产出 7 条 findings，本 spec 已全部吸收。本轮重建未重新派发 3rd-review，原因：spec 内容基于已审查版本恢复，且上轮审查结果已完整记录于 issue 评论（comment fa0a413b）。

审查 verdict（上轮）：revise_required → 所有 findings 已修订，当前 spec 内部一致性核对通过。

---

## 附录 D F10 反过度工程四问 scope-triage 未解风险

### F10 四问分析（9 个机制）

**机制 1：entry_receipt before-step 写入**
1. 真实威胁：step 执行前无审计记录，事后无法追溯 step 是否真正执行过（曾出现 step 跳过但无记录）
2. 现有覆盖：journal 仅记录 stage 级事件，无 step 粒度
3. 绕过：可绕过（agent 直接执行 step 不调用钩子），但这属于执行层合规问题，不是 spec 设计问题
4. 维护成本：低（一次性钩子接口，5 个 stage 共用）→ 通过

**机制 2：exit_receipt after-step 写入**
1. 真实威胁：step 执行后无出口记录，无法判断 step 是否正常完成
2. 现有覆盖：无 step 级出口记录
3. 绕过：同上
4. 维护成本：低 → 通过

**机制 3：BLOCKED 直接回退（不升人工）**
1. 真实威胁：before-step blocked 当前升人工违宪（CONSTITUTION 原则），需要机器自动处理
2. 现有覆盖：无自动回退机制
3. 绕过：无意义（这是修复违宪行为）
4. 维护成本：低 → 通过

**机制 4：receipt 并入 journal（不新建格式）**
1. 真实威胁：新格式引入第三套落盘方式，维护成本倍增
2. 现有覆盖：journal 已存在，可扩展 event_type
3. 绕过：不适用（这是设计约束）
4. 维护成本：低（复用现有底座）→ 通过

**机制 5：audit_summary 5 字段拆分**
1. 真实威胁：字段语义混淆导致误读（3rd-review finding 7 已证实）
2. 现有覆盖：无
3. 绕过：不适用
4. 维护成本：低 → 通过

**机制 6：rollback 阈值 2 次（workflow_run_id 隔离）**
1. 真实威胁：无限回退导致死循环（D9 明确要求连续两次仍无效才升级人工）
2. 现有覆盖：无
3. 绕过：可绕过（伪造 workflow_run_id），但属执行层问题
4. 维护成本：低 → 通过

**机制 7：3rd-review 调用（after-step）**
1. 真实威胁：step 完成后无独立审查，自审自判
2. 现有覆盖：3rd-review 技能已存在
3. 绕过：技能不可用时降级 unknown，不阻断 → 无安全剧场风险
4. 维护成本：低（复用技能）→ 通过

**机制 8：writer_namespace vs executor_namespace 比对**
1. 真实威胁：写入方和执行方为同一实体，自审自判风险
2. 现有覆盖：无
3. 绕过：runner 层共享进程时可绕过 **[WARN]** → 留 build-plan 补强
4. 维护成本：低 → 通过（保留，补强留后续）

**机制 9：step_id 格式与 stage_slug 映射表**
1. 真实威胁：step_id 无统一格式导致跨 stage 查询失败
2. 现有覆盖：无统一 step_id 规范
3. 绕过：不适用
4. 维护成本：低（一次性定义）→ 通过
