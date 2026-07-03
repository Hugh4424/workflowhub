---
user_decision: true
---

# Decision Log — step-gated-audit

来源：`make-decision-decision-log-draft.md`（S7）+ `make-decision-ledger-final.md`（S8，19条全部接受）+ 用户 S9 批准（comment 5a368026，2026-07-02T17:42:25Z）。

## 1. 原始需求（原文）
- （父issue ZHI-64）设计 stage-step-audit：把审计从S9末端报告升级为逐step的入口(before-step)+出口(after-step)核验门+receipt链，5个stage同等适用。
- （志鹏）"我需要你这个阶段就考虑如何解决 journal/stage-result/其它落盘方式不统一的问题，以及receipt并入现有统一记录底座，不能是第三套独立格式。before-step遇到BLOCKED不允许开始，可以改成直接回退上一个step，就不违宪了。总是升级人工也违宪的。"
- （志鹏）"第一版就要实现所有stage的优化，另外审查不是让你用critic，而是用3rd-review技能进行异源审查。"
- （志鹏）"审查不强行要求异源审查，只要用了3rd-review技能就行，由这个技能判断应该如何进行审查。"
- （另一agent补充b64dbe10）review-gate需求全文（4条诉求+6条问题+8条设计要求，详见 `make-decision-original-context.md` 第6节）。

## 2. 问题与目标
核心问题：workflowhub 当前步骤/审查都靠自报完成，缺入口/出口硬核验，导致 review 不是稳定一等门禁、receipt容易变成第三套割裂格式、BLOCKED处理容易违宪。
目标：5个stage统一加 before-step/after-step receipt链，receipt并入现有journal记录底座，review作为一等step纳入同一链条，BLOCKED默认自动回退、连续两次才升人工。

## 3. 决策记录（D1–D9，来源证据见括注）
- **D1 local-pointer设计**：每个step只记直接prev/next指针，不建全局位置表。（来源：志鹏原始约束；debate_1裁决确认）
- **D2 全5 stage同等优化，第一版全量实现**：不接受折中路。（来源：台账条目14，覆盖debate_1"存疑交用户"提案）
- **D3 review作为一等step**：receipt字段skill/executed/source/provider/true_cross_engine/round/verdict/report_path/raw_result_path/fix_status。（来源：台账第6节b64dbe10全文，条目17）
- **D4 不强制异源审查**：只要求真调用3rd-review技能，审查方式由技能自行判断。（来源：台账条目18）
- **D5 step_id编号格式**：`{stage_slug}.{step_type}.{step_seq}`，5 stage各自独立编号。（来源：台账条目16/17，step-numbering-scheme.md第一节）
- **D6 build-code动态phase处理**：`bc.work.ph{N}` + phase-manifest.json运行时生成指针。（来源：debate_2裁决scope-1）
- **D7 写权限隔离**：执行某step的agent不能给自己写exit_receipt，命名空间前缀限定写权限。（来源：debate_2裁决direction-1）
- **D8 audit不做rollback只出judgement**：产出`{status:blocked,reason,retry_eligible}`，rollback动作归runner/workflow层执行。（来源：debate_2裁决framing-1）
- **D9 BLOCKED默认自动回退**：连续两次rollback仍无效才升级人工。（来源：志鹏原始纠正，呼应"连续两次卡住即结构性问题"通用原则）

## 4. 假设
- `/Users/Hugh/Hugh/Project/3rd-review` 技能路径可达且可被各stage调用。
- `MAKE_DECISION_DEBATE_PATH` 默认路径在实现阶段依然可达。
- 5个stage现有SKILL.md允许被本次设计增量扩展，不需要推翻重写。
- journal.jsonl作为统一记录底座的写入并发量级可控（未做高并发压测假设）。

## 5. 明确不做
- 不建全局step位置表——理由：changes只应影响相邻prev/next，全局表会牵动全局。
- 不做"BLOCKED总升级人工"——理由：滥用人工确认门，违Q2谨慎用人工门精神。
- 不强制异源审查——理由：交给3rd-review技能自己判断，不重复造轮子。
- audit组件不做自动rollback动作——理由：越权执行会导致自身不可独立测试、责任归属不清。

## 6. 开放问题
无。grill核查（`make-decision-grill-with-docs.md`）逐条核对台账19条，全部"确认"，术语无冲突、代码层无矛盾。

## 7. 验收标准
- 5个stage均有receipt链（entry_check + exit_receipt）覆盖，可在journal.jsonl中查证。
- review gate的receipt字段齐全（9个字段）且可机器核验。
- build-code动态phase能正确生成phase-manifest并被before-step追踪。
- stage-result.json新增audit_summary聚合字段。
- 写权限隔离生效：执行者无法为自己的step写exit_receipt。
- BLOCKED触发自动回退，journal记录`step_auto_rollback`事件，连续两次才触发人工升级。

## 执行环境
| env var | 状态 | 值 |
|---|---|---|
| `TASK_TRACKING_ROOT` | 未设置 | 触发 `tracking_root_fallback`；默认路径`~/Knowledge/workflowhub/`不存在且与本次会话实际工作根不一致，为与S0-S8产物保持一致，继续使用仓库本地 `tasks/step-gated-audit/` |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | 已设置 | `1`（五方法庭模式生效，用于S5/S7两次debate） |
| `MAKE_DECISION_DEBATE_PATH` | 未设置 | 使用默认值 `/Users/Hugh/Hugh/Project/debate`（本次会话确认可达） |
| `MAKE_DECISION_SKIP_DEBATE` | 未设置 | 使用默认（不跳过），本次两次debate均正常触发 |
| `MAKE_DECISION_SKIP_BLIND_REVIEW` | 未设置 | 使用默认（不跳过），S5盲审正常执行（含critic误用重跑为codex的过程） |
| `THIRD_REVIEW_RUNNER` | 未设置 | 使用默认 `run-heterologous-review.mjs`（仓库内未找到该文件，本次S5改用codex CLI直接调用替代，属已知歧义降级，未触发`fallback_used:true`） |
| `REVIEW_DISPATCH_CONFIG` | 未设置 | 使用默认，未触发 `dispatch_config_invalid` |
