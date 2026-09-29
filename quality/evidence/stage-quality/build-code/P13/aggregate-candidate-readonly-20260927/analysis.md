# CARD-04 P13 最终汇总：只读填报草案（2026-09-27）

**性质**：这是给 T024 执笔者的核对清单，不是 `final-aggregate.json`、正式判决或已交付的独立叙述。本次没有运行测试、改生产源码、改任务材料或写 Task 事实。下列状态表示“目前证据能证明到哪一步”，不能用局部测试通过推断业务通过。

## 核对范围与当前身份

- 认证工作树：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`；分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`；HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。
- 外置 Task：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919`。`facts.jsonl` 的最新 `build-code` 行明确为 implementation `partial`、quality `incomplete`、review `not_run`，无 phase cursor；原件见外置 Task `quality/evidence/stage-quality/build-code/first-official-stage-row-20260927-2eb140c3/summary.md`。
- 旧 source ledger `quality/evidence/stage-quality/build-code/P13/source-ledger-readonly-20260927/index.json` 原为材料版本 `revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`、源码树 `a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`，且写于正式 build-code 行之前。必须联读同目录 `p1-current-correction.md`、`current-status-addendum.md`；旧 ledger 的“无 build-code 行”“review pending”“P1 旧树”均已过时。
- 核对时 `tests/contract/card04-final-aggregate.test.mjs` SHA-256 为 `76d5a58f502cb1482a0b052a6af861a0c6184b376095e682a40a4e42722a896e`，已含 P8/P9/P11 多命令解析。该源码变动可能令旧树绑定收据过期；必须用正式快照读取器重新取当前树、材料版本，并按新身份重采或明确把旧收据列作历史，不能直接复制上述旧树值为“当前”。本次只读核查没有做这一步。

## 每相位及任务的填报建议

表中“局部检查过”只表示指定命令的有限结果；建议的 `status` 是保守的最终汇总值，正式执笔前还须按当前树复核哈希、原始输出和独立审查。所有证据路径相对前述工作树或外置 Task 根。`gate_status` 与任务 `status` 是两件事；一道命令过了，任务仍可未完成。

| 相位／任务 | 已有实证 | 当前缺口与建议状态 |
| --- | --- | --- |
| P1 / T001, T002, T003 | 当前文档复合检查及三条专属检查均 exit 0；`P1/ADR0033-current-gate-refresh-20260927/`、`P1/T001-T003-current-task-checks-20260927-e341aa18/`；三份原始 transcript 已按外置 Task `P1/T001-T003-command-transfer-1b05b2e91e54d69bad47f1b8ea88374e6bdac0c3783e39cae81ee2a00cf0a778.json` 转存。 | 文档文字和 Git 跟踪已证；真实入口逐项使用、独立审查及当前新树绑定尚待核。相位 gate 可在严格核对原件后填 `passed`；三个任务先 `unknown`，不能据文档检查宣称完整业务质量。ADR 已暂存，未进 HEAD。 |
| P2 / T004 | 外置 Task `quality/tests/card04-P2-L0-current-7340305f-7e78-42ea-b0fe-bb159cd81b27.json`：1 通过、8 未选。 | 只证复杂度基线定向断言；当前树、数字消费者和独立审查未核。任务 `unknown`。 |
| P3 / T005 | `quality/tests/card04-P3-L0-current-7e11566a-5a0b-4dce-8a03-58661a1f4334.json`：4/4。 | 材料入口合同过，所有 post 实跑及当前独立审查未证。任务 `unknown`。 |
| P4 / T006 | `quality/tests/card04-P4-L0-current-fbcf6094-96e6-46f5-ab1f-ca622057b10a.json`：7/7。 | acceptanceChain 单测过；当前 CARD-04 真实验收事实链及独立审查未证。任务 `unknown`。 |
| P5 / T007 | `quality/tests/card04-P5-T007-current-38c18b52-b225-4db0-8913-b1d54363b888.json`：纯转换器 20/20。 | 输入真实性、同次调用和当前树独立审查未证。T007 `unknown`；此测试不能给 T008 记通过。 |
| P5 / T008 | 外置 Task 未有经 `authenticateP5StageEndReport` 认证的同次 `report-facts.json`、report/delivery/source/certificate 链。 | 真实来源与人工例外声明缺，T008 `not_done`，P5 相位 `incomplete`；不得把用户“若确实无例外可写没有例外”的条件答复改造成“确认无例外”。历史 G-2 例外必须核查并披露。 |
| P6 / T009–T014 | 八文件综合收据 `quality/tests/card04-P6-L0-current-5b6ad226-3edb-410d-b428-374d0cb94ba7.json`：79/79；原始门与各局部限制在 ledger 的六行。 | T009 普查事实、T010 分母与语义落点、T011 独立 oracle、T012 当前 Task 真四阶段报告、T013 真实分析结果可见性、T014 历史读取语义与独立审查，不能由夹具综合绿一键判完。六项均先 `unknown`；尤其 T012 当前 Task P5 报告缺。 |
| P6 / T025 | 工作树 `P6/T025-T026-narrow-sample-20260927.md` 与外置 Task 独立窄样复核：两种受限 Codex 容器运行及所测读写/网络负控。 | 已证明特定路径，不证明所有测试/宿主绕路均隔离；完整 `auth.json` 只读挂载风险未消。T025 `incomplete`。 |
| P6 / T026 | 同一冻结测试在两种模式各有目标失败→通过→恢复旧实现再失败（2→2→2）的窄样及独立复核。 | 样例本身成立，但不证明当前 live 源码、P11 全行为或整卡业务；T026 `incomplete`，若只汇总样例可单列“窄样通过”。 |
| P6 / T027 | 外部 README Task 的 `quality/evidence/card04-ac19-readme-evidence-index.json` 是候选来源。 | 其 make-decision/build-plan 质量及交付未收口；未形成经完整独立审查的本卡 AC-19 样例。T027 `incomplete`。P6 总体 `incomplete`。 |
| P7 / T015, T016 | `quality/tests/card04-P7-L0-current-6814433c-cadc-4bce-8c26-8cbe61974e58.json`：四文件 62/62。 | 枚举/模板合同已测；当前真实上游生产者、事实行和独立质量未核。两项 `unknown`。 |
| P8 / T017 | 两条正式范围命令各 2/2、10/10；`quality/tests/card04-P8-catalog-current-181f3d39-4810-4e78-829a-422d40fcc791.json`、`quality/tests/card04-P8-source-binding-current-3da300fc-7ce9-4540-aec8-de1b5548134e.json`。 | 三个真实 case 的效果仍 `not_yet_observed`。既有默认 Vitest 输出无完整逐条叶身份；当前 P13 多命令 `passed` gate 要每条完整 JSON reporter。门暂 `unknown`，T017 `incomplete`。 |
| P9 / T018, T019 | 两组 12/12、11/11，外置 `quality/tests/card04-P9-scope-current-493b195d-edf9-4cb9-b881-6678192ca734.json` 与 `quality/tests/card04-P9-inventory-current-18c2b580-6d2b-4053-8186-a00855cfbb73.json`。 | 215 条变化中的 206 条未映射到业务用例；两条多命令门仍缺完整逐叶 JSON reporter。门 `unknown`，两任务 `incomplete`。不能靠缩小变更分母求绿。 |
| P10 / T020, T021 | 三文件合同 78/78；定向捕获 23/23；真实三例 49 个测试叶通过，固定重跑收据 `quality/tests/targeted/52466118-7b21-4a12-9043-f966732a04cb.json`。外置 `P10/T020-real-card04-targeted-rerun-20260927/`。 | 整体选择结果 `unavailable/unmapped_changed_path`，业务效果 `unknown`，206 路径未映射；P10 正式审查首轮 20 分钟超时、无判决，见 `P10/T020-phase-review-official-20260927-b6498394/`。两任务 `incomplete`，49/49 仅列局部执行事实。 |
| P11 / T022 | 协议 5/5、相邻 24 通过/56 未选、Node 22/22；外置 `P11/T022-current-official-98f36a31-20260927/`、`P11/T022-current-official-cf0d2776-20260927/`、`P11/T022-current-official-deafc963-20260927/`。 | 真页面/服务/隔离浏览器未运行，页面适用性 `unknown`。第二命令只选受影响用例，非卡面完整命令；多命令门缺完整逐叶原件。门 `unknown`，T022 `unknown` 或 `unavailable`（真实服务确实无法启动并有原件时）。不能写 N/A。 |
| P12 / T023 | `quality/tests/card04-P12-handoff-current-d00c2491-3e88-4dec-8727-d3095da1c7c0.json`：技能文本 3/3。 | 真实风险抽样、独立 verify-code 消费、业务授权者答复缺；T023 `not_done`，P12 `incomplete`。 |

上述为 26 个 P1–P12 Task；第 27 个为 P13/T024。不能把测试条数当成已完成任务数。除 P1 可核对真实命令输出外，其他现有默认 Vitest 收据的 `Tests N passed` 主要是文件/数量级输出；要写 `test_ids` 须读取完整逐条 runner 原件，不能编名字。每一相位的正式 gate 命令和 Task 顺序只取当前 `specs/workflowhub-thin-core-card-04-20260919/phases/P1.md` 至 `P12.md`，尤其 P8 有两条、P9 当前有两条、P11 有两条。

## 最小机器形状（示意，不能直接当最终文件）

```json
{
  "schema_version": "card04-final-aggregate.v1",
  "card_id": "workflowhub-thin-core-card-04-20260919",
  "phase_order": ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10", "P11", "P12"],
  "phases": [
    {
      "phase_id": "P5",
      "gate_cmd": "从当前 P5.md 精确提取",
      "gate_status": "unknown",
      "gate_status_reason": "当前树的完整原件与独立审查待核",
      "gate_status_owner": "P5",
      "tasks": [
        {"task_id": "T007", "status": "unknown", "evidence_refs": [], "reason": "转换器局部通过，完整质量未核", "impact": "无法宣称本任务完成", "owner": "P5/T007"},
        {"task_id": "T008", "status": "not_done", "evidence_refs": [], "reason": "真实同次报告来源缺失", "impact": "最终报告不能宣称阶段报告已交付", "owner": "P5/T008"}
      ],
      "status": "incomplete",
      "reason": "T008 缺真实报告",
      "impact": "阶段报告不可验收",
      "owner": "P5"
    }
  ],
  "overall_status": "incomplete",
  "overall_reason": "多项真实来源、审查和授权仍缺",
  "overall_owner": "CARD-04 build-code"
}
```

示意故意只列 P5；正式文件必须补齐全部 12 相位和 26 任务，`gate_cmd` 必须逐字等于卡面解析值，`evidence_refs` 对已有证据应填真实 `{path, sha256}`，不能把示意中的空数组照抄成“没有原件”。凡 `gate_status=passed`，单命令门还需真实 `gate_evidence` 的 `path,sha256,command,exit_code,test_ids,task_id,snapshot`（P1 为 `kind=command_checks,check_ids=[]` 且无假 test IDs）；多命令门需逐项 `commands[].receipt_ref/output_ref/test_ids`，每个 JSON reporter 中的所有目标文件都必须有真实通过的测试叶。凡 `task.status=passed`，还需外置 Task quality 原件和 `receipt.task_id/phase_id/task_id_in_phase/snapshot`，由独立人读原件后才能下结论。

## 最终交付还缺什么

1. 重新取**当前**材料/源码树，逐份回算外置收据、输出和来源 hash；源文件变动后不得把旧树收据称“当前通过”。
2. P5/T008 的真实同次报告与例外声明；P8/P9/P10 的完整变化→case→真实业务效果；P11 的真实页面适用性/运行原件；P12 风险抽样与授权回复。P10 正式独立审查仍无结果。
3. P8/P9/P11 多命令门的完整 JSON reporter 测试叶原件；其他声称 `passed` 的门/任务也要逐条核命令、退出码、测试/检查身份和真实消费者，不从统计行推断。
4. 三个最终文件尚不存在：`P13/final-aggregate.json`、`P13/final-aggregate.md`、`P13/T024-delivery.json`。最终 MD 必须从“没做到”开始，每个非通过 Phase 与 Task 一行写身份、状态、原因、影响、负责人；再写“路线适用”“执行事实”。独立执笔者必须真实写出并由主会话**原样贴出**，才能记录真实 `author_agent_id/posted_at_utc/unedited`；不能预填或伪造聊天事实。
5. P13 合同 `tests/contract/card04-final-aggregate.test.mjs` 只能核结构、哈希与部分来源形状；绿色结果不等于业务验收。当前正式阶段事实仍是 `partial/incomplete`。

## 核对来源

- 工作树：`specs/workflowhub-thin-core-card-04-20260919/phases/P1.md` 至 `P13.md`；`tests/contract/card04-final-aggregate.test.mjs`；`quality/evidence/stage-quality/build-code/P13/source-ledger-readonly-20260927/{index.json,summary.md,p1-current-correction.md,current-status-addendum.md}`。
- 外置 Task：`task.json`、`facts.jsonl`、`quality/evidence/stage-quality/build-code/first-official-stage-row-20260927-2eb140c3/`、上述逐相位 `quality/tests/` 与 `quality/evidence/stage-quality/build-code/P1|P10|P11/` 原件。
- 本草案读取文件与目录现状，没有执行任何 gate、官方 writer 或浏览器检查。若上述来源随后改变，以新原件为准并保留本草案为时点记录。
