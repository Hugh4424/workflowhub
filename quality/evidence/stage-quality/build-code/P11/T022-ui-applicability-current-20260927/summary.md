# 当前 UI 适用性只读核查（2026-09-27）

- 身份：CARD-04 工作树 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。官方只读 `status --action=begin` 运行前后 exit 0，材料版本均为 `revision-7aceef6e91f8479ef1ad72d1e5bf628127f8cac99daf191c7789e6e4099cb507`，来源树均为 `4de23e7cfded6f6bc3482714583c7ecbddf8b693`。16 份当前材料及相关两份生产/四份测试文件运行前后 SHA 一致；见 `before.json`、`final-after.json`、两份 `status-*.stdout.raw.json`。
- 旧段保全：当前 `decision-log.md` 第一节 `## UI applicability` 至 `## 收敛检查` 的原始字节，与外置 Task 先前源码副本同一段逐字相同，SHA-256 均为 `8c84791dbbc10f9fcbd50a3cd2abb699b344305516632f39c6ed5a330a56a0eb`。新段为第二节同名标题，且仅一份 JSON；其 `validateUiApplicability` 实报 `ok=true/derived_result=unknown`，`readUiApplicabilityFromDecisionLog` 实报 `status=missing/applicability=unknown`。缺真实当前问题及用户裁定的错误说明保留，不改称不适用或通过。
- `npx vitest run tests/contract/ui-applicability-must-ask.test.mjs tests/contract/ui-applicability-contract.test.mjs tests/contract/ui-stage-integration.test.mjs tests/decision-log-content-contract.test.mjs`：进程 exit 0，但 **只收集 3 文件/11 测试，11 通过**；`ui-stage-integration.test.mjs` 被 `vitest.config.mjs` 明确排除，不能把此退出码当四文件全绿。原始 stdout/stderr、命令/时间/退出码见 `target.*`。
- 该排除文件的实际入口 `node --test tests/contract/ui-stage-integration.test.mjs`：**exit 1，22 项中 20 通过、2 失败**。失败一是测试要求 `workflows/build-code/SKILL.md` 出现精确英文 `no new stage`；失败二是 `activeAcceptanceCriterionIds` 在状态正文例子里返回空数组，测试期待 `AC-STATE-001`。原始输出和退出码见 `node-test.*`，未修改源、测试或材料追绿。
- `artifact.sha256` 记录两次测试、只读 status 与前后身份文件的原始 SHA。此结果只证明新 UI 段会被 reader 读成当前缺口；整个四文件相邻测试**未通过**。无正式 build-code 阶段行、真实页面或浏览器验收结论由此产生。

## 两个失败的只读归属

- `ui-stage-integration.test.mjs:196-256` 对五份技能均要求精确英文 `no new stage`、`no gate`；当前 `workflows/build-code/SKILL.md` 有中文“不新增 stage”和其它英文“new stage or public command”，但缺精确英文 `no new stage`。`git show HEAD:workflows/build-code/SKILL.md` 同样缺这一短语，测试在 HEAD 中也已有该要求；这是原有文字合同不一致，本次决策日志新增段未引入。最小修复由 build-code 技能 owner 在现有段落写清真实规则，不应删断言或借此新增流程门。
- `ui-stage-integration.test.mjs:301-306` 的普通正文 `status: deferred` 被 `stage-content-contracts.mjs:8193-8203` 未锚定开头的 `explicitMetadata` 正则误判为延期元数据，故 `activeAcceptanceCriterionIds` 漏掉 `AC-STATE-001`。该测试与解析器相应字节在 HEAD 已存在；本轮 `stage-content-contracts.mjs` 的改动只在其它函数段，未改解析器。最小修复应由 stage 内容合同 owner 将元数据识别限定为 AC 标题后紧邻的标记，同时保留测试中 `[status: deferred]`、`（状态：延期）` 和紧邻无括号元数据七个正例；不能通过改当前 decision-log 或放宽 AC 分母求绿。本次未运行 HEAD 基线测试，既存判断仅据 HEAD/current 字节对照。
