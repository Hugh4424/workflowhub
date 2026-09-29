# Phase P12 — verify-code 独立业务语义抽样与既有授权验收交接

## L0

相位目标：在 build-code 的逐例机器对账、实际执行及独立代码审查之后，由 verify-code 对高风险的原始业务语义作**独立按风险选样**，并将仍须授权业务者观察的真实外部效果放入**现有最后验收确认**；机器负责日常选测、跑测和逐例对账，人不接管回归。只增强既有技能说明与针对性合同，不新增 stage、gate、确认槽、持久事实权威或公共命令。本相位是实施计划，不声称已经执行或业务通过。

- **Global spec**: `specs/workflowhub-thin-core-card-04-20260919/spec.md` §5.3 FR-34/AC-34
- **Write set**: `workflows/verify-code/SKILL.md`（MODIFY）、`tests/contract/verify-code-business-handoff.test.mjs`（NEW）；候选 business-handoff.mjs 仅在实际证明技能层说明无法被既有消费者使用、且登记唯一 consumer/owner/删除条件后另行裁定，当前不纳入写集、不预建模块
- **Dependency**: `P10`（build-code 自动选测/逐例对账和真实执行输入）；P11 的 UI 真实入口若受阻继续 `unknown`/`unavailable`，不成为伪造 UI pass 或本相位取消风险披露的理由
- **Consumer**: verify-code 执行者、既有独立审查和最后授权业务验收者
- **gate_cmd**: `npx vitest run tests/contract/verify-code-business-handoff.test.mjs`
- **oracle**: ORACLE-VERIFY-BUSINESS-HANDOFF — runner 识别三个真实技能契约断言并 exit 0，抽样与未抽样 ID、真实依赖/模拟及未知、风险、授权交接的正反和恢复判据同时可核；此绿色只证明技能文本契约，不证明真人验收或外部效果
- **STOP**: 若需要修改受保护 `runtime/stage/**`、`runtime/review/**` 或 CARD-05 写面才能传递某个事实，停止越界写入并标明 `unknown`/`not_done` 与 owner，提交另行裁定；若 RED 是 import/setup/零测试而非目标断言失败，不以空 RED 充数（G2）
- **Done**: 本任务定向合同 GREEN 与 RED 原件可核，技能说明覆盖 FR-34/AC-34 且既有审查/确认时序不变；未取得的真实业务证据仍未完成而非通过。**2026-09-26 合并后注记**：CARD-05 已重写 `workflows/verify-code/SKILL.md`（+94 行：新增「审查依赖」「AC-REVIEW-011 终末 OCR 工具不可用时的独立替代」，「固定流程」移至 `:141`、「阶段末交接」移至 `:177`），「既有审查/确认时序不变」的比对基线以合并后 SKILL.md 为准，T023 执行期须按新 OCR 序列重解该断言；预置 RED 所指缺口（风险选样+已/未抽查 ID、真实/mock 规则、可执行授权交接）是否仍在须执行期按当前技能文本复核，不预断
- **evidence_path**: `quality/evidence/stage-quality/build-code/P12/`（计划中的 GREEN 与实际执行原件；预置 RED 单独存于 `quality/evidence/prewritten-red/P12-T023-business-handoff-red.txt`）

## L1

### T023 — verify-code 风险选样与现有授权业务交接

- **Source / FR / AC**: `R-009`/`R-017`、D-014（`decision-log.md:2386-2396,2404-2408` 已确认方向）/ FR-34 / AC-34（`spec.md` §5 / Appendix A）；卡内只实现已有 verify-code seam 的使用说明，不把方案确认冒充 build-plan/生产批准
- **Files / symbols**: `workflows/verify-code/SKILL.md`（MODIFY：原始需求到实际结果抽查、阶段末交接与既有最后确认说明）、`tests/contract/verify-code-business-handoff.test.mjs`（NEW：ORACLE-VERIFY-BUSINESS-HANDOFF 的现有技能消费边界断言）；symbol：现有技能执行说明和现有 reviewed_execution/receipts.confirmation，不引入生产函数；候选 business-handoff.mjs 不必要时不创建
- **Action**: 先从受影响 AC 逐项保留 build-code 的机器应测/实测身份、原始 stdout/receipt/hash、快照和未执行原因，不把全部 AC 再作人工语义审查；依据金钱/隐私/权限/不可逆/外部副作用、跨 Phase 旅程、反例及恢复风险挑选独立 case/AC 样本，分别列**已抽查和未抽查 case/AC ID**与理由。对样本从原需求/业务规则版本→case/AC→Phase/Task→真实入口、消费者、测试断言、实际效果/反证追溯，辨认代码 exit 0 而业务错的情形；分栏表达 `business_effect=observed_pass|observed_fail|unknown|unavailable|N/A(reason)`、`semantic_test_adequacy=adequate|inadequate|unknown`、`code_review=clean|resolved|incomplete|failed`，不从代码 review `passed` 推业务通过。逐 AC 记录服务/供应商/API/版本、权限与数据、real vs mock、超时/故障/回滚日志；模拟不冒充真实效果，低置信须列假设、来源冲突/旧案例未盘点和能反驳的独立证据，不造统一数字阈值。高风险记录后果/影响面、拒绝与恢复 oracle、finding/缓解/残余 owner；严重问题真实修复复测、附证误报、授权明确接受具体风险或留待裁定。机器测试及独立审查**之后**向非实施者的授权业务验收者提交现有 verify-code 最后确认所需的环境/安全权限/数据准备/精确真实入口与操作、正向成功及负向拒绝/故障/回滚的可观察判据、应回传的日志/截图/交易号/时间与引用、风险及责任人和失败后修复/明确接受路径。其真实答复/证据与接受、拒绝或延期绑定既有确认；无回复、未测、依赖不可用或证据冲突绝不报业务通过；授权者不替系统每天选测、跑测和逐例对账
- **Inputs**: `decision-log.md:2386-2408`、`spec.md` §5 / Appendix A、`workflows/verify-code/SKILL.md:68-79`（原始需求到实际结果抽查）与 `:177-`（阶段末交接）——CARD-05 已重写该文件，旧锚点 `:69-79,107-156` 过期、执行期须按当时真实章节重锚，P10 当前快照逐例机器事实、项目版本化 case/业务关系、当前材料、审查 provider 原件与既有 confirmation；没有可核的真实输入即标 `unknown`/`unavailable` 而非猜测
- **Outputs / failure**: 风险选样 ID/原因、未复核 ID/机器事实及覆盖限制、样本语义/依赖/置信/高风险独立结论、可操作的既有授权确认交接与实际回复证据；失败＝mock 冒充真、命令绿推出业务绿、未抽样被声明审过、把人当日常 runner、无人回复却认通过或新增确认门
- **Boundary / DO NOT TOUCH**: 不改 `runtime/stage/**`、`runtime/review/**`、`spec.md`、`phases/index.md`、产品代码、CARD-05；不得增加 stage/gate/第四确认、创建新的 `quality/verify.v1` 权威、自动授权、审查 provider 失败洗为 pass、关闭后伪造 reopen；P11 阻塞 UI 保持 unknown/unavailable
- **Dependency**: `P10`；本 Task 的事实输入依赖 P10 机器对账，P11 的 UI 失败不等于 N/A 或合格
- **Test tier / skill**: 规划采用 `testing-system-blueprint`；实际变更按技能文本合同采用针对性 backend contract 检查及独立 verify-code 审查；单元/自动代码检查/接口三层逐层见下，技能名称为**拟用**非调用事实
- **逐层计划（预期而非实测）**：单元＝N/A（仅改技能文本及合同测试，无新可隔离运行函数；须核实最终 diff 仍无 `business-handoff.mjs` 与新增函数，否则重评），业务文档内容由下述合同直接抽样检验而非将文本称为单元运行结果；自动代码检查＝适用，`npx vitest run tests/contract/verify-code-business-handoff.test.mjs` 加 `node --check tests/contract/verify-code-business-handoff.test.mjs`，真实技能文件与测试文件、Node/Vitest，预期完整 runner 身份/exit 0、文本合同命中风险/ID/依赖/交接且语法无诊断，命令非零、零测试、无身份为失败或 unknown；接口＝适用，仍用同一 scoped 命令测试 verify-code 技能真实在仓库的既有消费边界（既有抽样与现有授权确认说明），再由真实本 task 的 P10 逐例 evidence→verify 独立审查→同一次 `receipts.confirmation` 路线定向审查，预期可从原需求到当前原件追溯且提供可观察正负/恢复 oracle，缺 P10/P11 服务或授权回复仅 unknown/unavailable，不借文本 GREEN 冒充真实业务效果
- **Scenario / fixture or service**: 测试读取真实 `workflows/verify-code/SKILL.md` 现有章节（不是 import 尚未创建的模块）；正例为明确分开样本/未抽样和现有授权交接，负控为已有技能只泛泛要求抽查/确认时断言失败；服务、真实用户、供应商与授权环境不在预写测试夹具中，未来必须用真实入口及当前证据验证，不由 fixture 模拟成外部通过
- **RED/GREEN gate_cmd**: `npx vitest run tests/contract/verify-code-business-handoff.test.mjs`
- **expected_exit**: RED `1`（目标断言失败）；GREEN `0`（计划，待 build-code 实测）
- **RED target failure**: ORACLE-VERIFY-BUSINESS-HANDOFF 断言失败：预写测试的现有技能段落成功加载并 collect 3 tests，但缺风险选样+已/未抽查 ID、真实与 mock/低置信/高风险规则、可执行授权交接；本轮实际命令 `Tests 3 failed (3)`、`EXIT=1`，不是 import/setup/零测试失败
- **GREEN oracle**: ORACLE-VERIFY-BUSINESS-HANDOFF — 目标三个断言在当前技能消费者边界变绿、命令 exit 0 且审查时序/确认槽不变；只作合同绿，真实 sample、provider、外部依赖和授权人的答复仍须独立取证
- **Evidence**: 预写原始 RED=`quality/evidence/prewritten-red/P12-T023-business-handoff-red.txt`（命令、cwd、HEAD、UTC 时间、runner stdout/stderr、EXIT=1）；GREEN 计划=`quality/evidence/stage-quality/build-code/P12/T023-green.txt`，当前**不存在，也不声称已绿**；运行时须保留真实 case/AC、快照、receipt/hash、服务与授权答复引用
- **STOP / recovery**: 若技能文字以外必须新模块/新生产消费者才可达成，先验证真正消费者/owner/删除条件与 CARD-05 保护写面，再请示更新写集；不能暗中新增 `business-handoff.mjs` 或 runtime 门。若目标 RED 未失败或仅 collection/setup 失败，按 G2 诚实记无有效 RED 并纠正测试，不造 evidence；业务缺失同一 task 修复/新快照定向复测，关闭后另走授权后续工作
- **Coverage limit**: 预写 RED 只证明旧技能行为合同有缺口，不证明真实服务、原始源版本、授权身份、正反业务效果；未抽样 ID 继续有机器事实但没有独立语义复核；P11 blocked UI 仍 unknown，不推 N/A；假设/冲突及未盘点旧关系均保持 unknown，不从 review clean 推 business pass
- **Done**: GREEN 需 build-code 留当前执行原件、真实 diff 与独立审查，计划中的授权业务验收还须真实回复及绑定证据；未获得则仅完成技能合同实现，不宣布 AC-34 的业务效果通过

## L2

删除证明：不删除现有 verify-code 抽查、四动作审查、既有确认或 handoff 段落；只定点增补技能文本并新增针对已有技能读取入口的测试。优先复用 `SKILL.md`；`business-handoff.mjs` 无独立 consumer 证据时不创建，避免平行状态和第二份执行账本。

**Phase P12 四层及跨 Task 旅程（全为计划，不是执行结果）**：单元 N/A 的条件同 T023（实际 diff 如有新函数则重评）；自动代码检查适用，定向 Vitest + `node --check tests/contract/verify-code-business-handoff.test.mjs`，真实技能及测试文件，保留命令/exit/测试身份/快照/输出原件，目标合同三断言和语法检查均绿，零测试/未执行 unknown；API/接口适用，既有 P10 逐 case 执行 receipt→verify-code review `reviewed_execution`→同一现有 confirmation 接线及定向合同，取证当前材料/hash、provider 实报、授权回复，目标追溯一条高风险正例及负例/恢复且样本与未审 ID 分离；无服务或 provider 为 unavailable，不能改报成功。真实浏览器 UI 有条件适用：P11 UI 消费者若真实存在，拟用 `frontend-testing` + `isolated-browser-qa` 针对隔离 profile、真实运行服务/API/DTO/权限/加载/错误/恢复、截图/网络/控制台/清理记录与外部依赖身份；P11 blocked UI 时标 unknown/unavailable 并写影响、owner、下一步，不因本 phase 只有技能文档就判 UI N/A；仅消费者清查证明交付面确无 UI 时才能 N/A+理由。跨 Task 旅程 P12-J1：P10 对受影响 AC/旧 case 真跑并逐例对账→本 phase 从版本化规则和真实 consumer 按风险抽样，含代码绿但业务错的反例、真实与 mock 对比→P11 若有关联 UI 则用真实浏览器正/拒绝/恢复效果或保留 unknown→独立 review→既有最终授权确认返回交易号/日志/截图/时间与接受/拒绝/延期；每环节原始身份/快照可核，任一虚假业务效果/漏 ID 为 fail、服务或用户未提供为 unknown/unavailable。人只处理剩余业务语义与无法自动观察的真实效果；不替系统每天回归。

相位验证：仅运行 `npx vitest run tests/contract/verify-code-business-handoff.test.mjs` 与测试文件 `node --check` 等受影响检查；原始 RED 已留 `quality/evidence/prewritten-red/P12-T023-business-handoff-red.txt`，所有 GREEN、业务回执和独立审查均待后续实施和执行。

相位 STOP：新入口/消费者需要保护写面、P10 逐例原件不可认证或 P11 UI 环境不可用时如实记录受影响范围与 owner，任何结果不因技能合同绿、审查 clean 或无人确认而升级为业务通过。
