# {{prd_title}}

> Status: `{{prd_status}}` | Decision revision: {{decision_revision}} | Source revision: {{source_revision}}
> Writer: `spec-prd` | Write target: `specs/{{task_id}}/prd.md`

## 导航

| Section | Purpose | Read when |
| --- | --- | --- |
| 产品总览 | Confirmed direction, scope, non-goals, and current status | Always |
| 共享定义 | Definitions and shared constraints referenced by cards | Before any card |
| 任务地图 | Result-oriented card map and dependencies | Before map confirmation |
| 任务卡 | Complete independently handoff-ready card detail | Before starting a card |
| 风险与交付说明 | Open gaps, quality facts, attachments, and physical-delivery limits | Before handoff |
| 变更说明 | Archived maintenance evidence and commitment impact | When maintaining |

## 产品总览

- **母决定与确认**：{{decision_binding}}
- **目标与范围**：{{product_overview}}
- **非目标**：{{non_goals}}
- **规划对象设计适用性**：{{ui_applicability}}
- **当前状态**：{{prd_status}}

## 共享定义

{{shared_definitions}}

## 任务地图

{{task_map}}

Map confirmation: {{map_confirmation}}
Map confirmation revision: {{map_confirmation_revision}}

## 最终展示稿确认（第二次调用后）

- **展示稿状态**：{{displayed_draft_status}}
- **展示稿 hash**：{{displayed_draft_hash}}
- **Decision revision**：{{decision_revision}}
- **Source revision**：{{source_revision}}
- **Map revision**：{{map_confirmation_revision}}
- **PRD revision**：{{prd_revision}}
- **最终确认 revision**：{{final_confirmation_revision}}
- **display_before_reply**：{{display_before_reply}}
- **human_approved**：{{human_approved}}
- **确认结果与缺口**：{{final_confirmation_result_and_gaps}}

拒绝、未答或错版最终确认必须保持 `draft`，列出具体缺口和受影响范围；
该确认发生在第二次内容调用之后，不是第三次内容调用。

## 任务卡

{{task_cards}}

### 任务卡字段（每张卡必须完整填写）

以下是固定保留的 **16 个既有字段**；不得因卡片数量或实现层次删改字段名。

- **结果与 consumer**：{{result_and_consumer}}
- **范围**：{{card_scope}}
- **流程/状态**：{{flow_and_states}}
- **FR**：{{fr_ids}}
- **AC**：{{ac_ids_and_failure_criteria}}
- **oracle**：{{oracle}}
- **准备依赖**：{{preparation_dependencies}}
- **实现依赖**：{{implementation_dependencies}}
- **验收依赖**：{{acceptance_dependencies}}
- **合并依赖**：{{merge_dependencies}}
- **共享资源冲突与集成责任**：{{shared_resource_conflicts}}
- **来源/设计**：{{source_and_design_refs}}
- **局部风险**：{{local_risks}}
- **可后置技术项**：{{deferred_technical_items}}
- **最小读取集**：{{minimal_reading_set}}
- **五阶段开工说明**：{{five_stage_start}}

## 风险与交付说明

### 缺口与受影响范围

{{gaps_and_affected_scope}}

### 质量事实

{{quality_facts}}

### 交付说明

- **规划完成**：{{planning_completion}}
- **材料可用**：{{material_availability}}
- **开发状态**：{{development_status}}
- **质量事实**：{{quality_status}}
- **必要附件与版本**：{{required_attachments}}
- **物理动作及授权**：{{physical_actions_and_authorization}}

## 变更说明

{{change_notes}}

For archived maintenance, retain the reason/evidence (`依据`), affected scope (`影响`),
before/after commitments, source revision, confirmation reference, and in-flight
impact. Small修 changes remain narrow; substantive changes require real confirmation
before this section is updated. Historical decision, confirmation, review, test, and
physical facts remain immutable.
