# {{prd_title}}

读者：PRD 作者、用户与独立子任务消费者。
读完要能：定位用户目标、场景、来源与唯一验收判据。

这是写作指引，不是质量门；机器读取的标题与标签、被锁定文字、真实逐字声明是允许的例外，照原样保留。

> 状态：`{{prd_status}}` | 决定来源：{{decision_reference}} | 资料来源：{{source_reference}}
> 写入者：`spec-prd` | 写入目标：`specs/{{task_id}}/prd.md`

## 导航

本节回答：读者在什么时机打开哪一节。

| 章节 | 用途 | 何时读 |
| --- | --- | --- |
| 产品总览 | 已确认的方向、范围、非目标与当前状态 | 始终 |
| 共享定义 | 各任务卡引用的定义与共享约束 | 开始任何任务卡之前 |
| 任务地图 | 面向结果的任务卡地图与依赖 | 任务地图确认之前 |
| 任务卡 | 可独立交接的完整任务卡细节 | 开始某张任务卡之前 |
| 风险与交付说明 | 未决缺口、质量事实、附件与物理交付限制 | 交接之前 |
| 变更说明 | 归档的维护证据与承诺影响 | 维护时 |

## 产品总览

本节回答：本期目标、已确认范围和非目标是什么。

- **母决定与确认**：{{decision_binding}}
- **目标与范围**：{{product_overview}}
- **非目标**：{{non_goals}}
- **规划对象设计适用性**：{{ui_applicability}}
- **当前状态**：{{prd_status}}

## 共享定义

本节回答：哪些定义由所有任务卡共同引用。

{{shared_definitions}}

## 任务地图

本节回答：各结果卡如何依赖与并行。

{{task_map}}

任务地图确认：{{map_confirmation}}
任务地图实际展示稿与答复来源：{{map_confirmation_reference}}

## 最终展示稿确认

本节回答：用户实际看到了哪份稿并作出什么答复。

- **实际展示稿与范围**：{{displayed_draft_reference_and_scope}}
- **展示事实**：{{actual_display}}
- **用户真实答复与来源**：{{actual_user_reply_and_source}}
- **确认结果与缺口**：{{final_confirmation_result_and_gaps}}

先准备完整可审稿再展示；拒绝、未答、取消或确认另一稿保持 draft，并说明具体缺口与影响。地图答复不能代替详情稿最终确认。普通补字不重复询问已覆盖授权；改变决定的内容先准备再取得真实选择。

## 任务卡

本节回答：哪个可独立交付的结果由谁承接。

{{task_cards}}

### 任务卡字段（每张卡必须完整填写）

本节回答：每张卡怎样完整填写现有16字段。

以下是固定保留的 **16 个既有字段**；不得因卡片数量或实现层次删改字段名。

- **结果与消费方**：{{result_and_consumer}}
- **范围**：{{card_scope}}
- **流程/状态**：{{flow_and_states}}
- **FR**：{{fr_ids}}
- **AC**：{{ac_ids_and_failure_criteria}}
- **判定器**：{{oracle}}
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

每字段只写该卡增量；实测与取证引用原始件路径，不粘贴全文。

## 实测记录

本节回答：本次实测实际做了什么、看到什么。

| 命令与参数 | 关键输出行 | 原始件路径 | 未覆盖与失败 |
| --- | --- | --- | --- |
| {{actual_command}} | {{key_output_line}} | {{original_evidence_path}} | {{coverage_limits}} |

## 风险与交付说明

本节回答：哪些缺口、质量事实和物理动作仍需说明。

### 缺口与受影响范围

本节回答：缺了什么、影响谁、由谁处理。

{{gaps_and_affected_scope}}

### 质量事实

本节回答：哪些验证与审查实际发生，哪些仍缺失。

{{quality_facts}}

### 交付说明

本节回答：规划、开发、质量、附件与物理交付各到哪一步。

- **规划完成**：{{planning_completion}}
- **材料可用**：{{material_availability}}
- **开发状态**：{{development_status}}
- **质量事实**：{{quality_status}}
- **必要附件与版本**：{{required_attachments}}
- **物理动作及授权**：{{physical_actions_and_authorization}}

## 变更说明

本节回答：承诺为什么变化，依据与在途影响是什么。

{{change_notes}}

归档维护时保留原因/证据（`依据`）、受影响范围（`影响`）、承诺的前后对比、实际来源、
真实确认引用，以及在途影响。小改保持范围狭窄；实质性变更必须先取得真实确认，才能更新本节。
历史决定、确认、审查、测试与物理事实一律不可改写。

## 补充材料

本节回答：推导、原始输出与被否方案到哪里查。引用具名原件路径与 anchor；正文只保留当前规则和依据，不复制长段原文。
