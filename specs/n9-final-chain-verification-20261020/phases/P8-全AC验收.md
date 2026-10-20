# Phase P8 — 全 AC 验收

读者：verify-code 验收者、独立判定者与最终交付读者。读完要能找到 17 条 AC 的承接原件、逐条结论与未闭环项。

- **Global spec**：`spec.md#实现设计全局权威`
- **Write set**：none（只读验收：不生产、不改动任何代码或材料）
- **Dependency**：P3、P4、P6、P7
- **Consumer**：verify-code 验收者与最终交付读者
- **gate_cmd**：`node -e "const fs=require('node:fs');const p='/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n9-final-chain-verification-20261020/quality/evidence/final-chain-acceptance-readback.md';const n=(fs.readFileSync(p,'utf8').match(/^- \*\*AC-/gm)||[]).length;if(n!==17){console.error('AC rows='+n);process.exit(1)}console.log('AC rows=17')"`
- **oracle**：ORACLE-P8-ACCEPTANCE
- **evidence_path**：`quality/tests/2026-10-20-p8-acceptance.output`
- **STOP**：任一 AC 缺原件、缺结论行或把 `incomplete`/`unavailable` 写成 `pass` 时停止收口，回原承接 Phase 的 Task owner 修；不重跑到绿、不改判据求绿。
- **覆盖 AC**：`AC-M1-1`、`AC-M1-2`、`AC-M1-3`、`AC-M2-1`、`AC-M2-2`、`AC-M3-1`、`AC-M3-2`、`AC-M3-3`、`AC-M3-4`、`AC-M4-1`、`AC-M5-1`、`AC-M5-2`、`AC-M6-1`、`AC-M6-2`、`AC-M6-3`、`AC-M7-1`、`AC-M7-2`
- **Done**：T014独立聚合已执行：`quality/evidence/final-chain-acceptance-readback.md`（17项，16有界pass、AC-M6-2 deferred）、675独立审计、676完整交付原件；242计数17/exit0仅证行数，逐项语义由675独立人读，23782断言与241顶部是真实浏览器。每条有界档位及具名证据见本卡自带判据小结；P3/P7正式OCR终态仍由root汇总，不以P8审计签整stage质量或Git交付。

## 工作包声明（人读事实）

- **读集**：`spec.md`、`phases/index.md`、`phases/P1`–`phases/P7` 的实际文件、任务库 `quality/tests` 与 `quality/reviews` 的本次原件、`quality/evidence/final-chain-report.json`（三份）、`docs/architecture/move-map.json`。
- **定序写主**：本 Phase 无写集；不替代任何 Phase 的写权。
- **接口符号清单**：N/A — 只读消费 `runFinalChainCheck`、`run-checks --task-path` 与页面模板的输出。
- **合并责任**：无交付合并；失败交原承接 Phase 的 Task owner。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值。

## 速读卡（人读）

- **本 Phase 结果**：一次逐条读回，把 17 条 AC 的档位、证据与未闭环项写成可复核结论。
- **非目标**：不重新实现任何功能；不新增 AC；不把「文件存在」或「测试名字出现」当通过；不重跑已绿的跨任务回归。
- **改动前**：P1–P7 各自有 Done，但没有一份按 AC 编号逐条收束的结论。
- **改动后**：每条 AC 有一行结论、一个档位与一条证据路径。
- **与相邻 Phase 的边界**：上游七个 Phase 交原件；本 Phase 交逐 AC 结论，交给 verify-code 与最终 close。
- **主要风险**：把「命令退出 0」当「AC 通过」。若因此返工，替代走法是按 `Appendix A` 逐条件重读原件，命令只作辅助。
- **下一步**：verify-code 依本 Phase 结论执行收口与交付。
- **动手前必读**：`spec.md#Appendix A — 验收判据（唯一权威）`；`phases/index.md`；`quality/evidence/2026-10-20-027-build-plan-g1-baseline.txt`。
- **未决事实**：037证明N8已合入；最新010交接仍3材料/合同pass、28incomplete，OPEN-02整卡依赖不因merge关闭、不转入N9写集。矩阵按当前已交付合同核，不能宣真实四路已验；浏览器子条件由本Phase owned loopback与两测试viewport实测，不预先N/A。

## 本 Phase 材料导航（人读）

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#Appendix A — 验收判据（唯一权威）` | 逐条取通过/失败条件 | 开工前 |
| `phases/P1-十环声明与逐环判据.md`–`phases/P6-两次刷新与-N6-旧账收口.md` | 取每条的 RED/GREEN 与证据指针 | 开工前 |
| `quality/evidence/final-chain-report.json`（本任务、N2、N6 各一份） | AC-M1-1/2、M2-1、M3-3/4 的实际结果 | 逐条判定时 |
| `quality/evidence/2026-10-20-026-build-plan-n8-inflight-state.md` | AC-M1-1 的矩阵依据与重核清单 | 判定 AC-M1-1 前 |
| `quality/evidence/final-chain-adoption-audit.json` | AC-M1-3 的清单底稿 | 判定 AC-M1-3 前 |

## L0 — 结果与变更

一次按 AC 编号逐条收束的只读验收：每条 AC 有档位、证据路径与未闭环说明，读者能据此判断本任务实际交付到什么程度。它不生产新能力，也不改变任何前序产物；与 P1–P7 的区别是只判不修，修复回原 Task。

- **结果**：17 条 AC 的逐条结论可复核，未达成项有具名原因与 owner。
- **非目标**：不新增判据、不改 `spec.md`、不重跑全量回归。独立读回核R-010逐step设计的AC-M7-1/2真实原件；P7可回源接缝与P2执行报告分开判，不以17行或局部GREEN冒原需完成。
- **与其它 Phase 的区别**：P1–P7 各自生产与自证；本 Phase 汇总并按原判据重读。

## L1 — 可执行契约

### 文件边界

- **新增**：`N/A — 只读验收，不新增文件`
- **修改**：`N/A — 只读验收`
- **禁止改动**：`runtime/**`、`skills/**`、`workflows/**`、`tests/**`、`specs/**`、其他任务的 `facts.jsonl` 与 `task.json`；理由是本 Phase 只判不修，任何改动都会破坏「结论来自被验对象」这一前提。

### 任务顺序

`T014` 是全任务最后一个 Task；它在 P1–P7 全部 Done 之后一次执行，不分批。

### Task graph 与纵向切片

`T014` 是末验收：消费 P1–P7 的原件，逐条重读 17 条 AC，只补必要未闭环 case（例如浏览器读回、三任务对照的复核）。它不产生新代码或材料，因此不适用 tracer bullet 的「schema/API/UI 切片」；不存在的层在这里写明不适用：无新增 schema、无新增 API、无新增 UI 结构。

### 测试策略

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 17 条 AC 逐条有档位与证据 | T014 | GREEN | `node -e "const fs=require('node:fs');const p='/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n9-final-chain-verification-20261020/quality/evidence/final-chain-acceptance-readback.md';const n=(fs.readFileSync(p,'utf8').match(/^- \*\*AC-/gm)||[]).length;if(n!==17){console.error('AC rows='+n);process.exit(1)}console.log('AC rows=17')"` / `0` | ORACLE-P8-ACCEPTANCE / `quality/tests/2026-10-20-p8-acceptance.output` |
| AC前缀行数不是17时计数命令非零；档位/ref另由人读 | T014 | RED | 同一命令 / `1`（命名断言：AC前缀行数不是17） | ORACLE-P8-ACCEPTANCE / `quality/tests/2026-10-20-p8-acceptance-red.output` |

测试面按 spec「测试标准」：本 Phase 跑真实任务对照面、CLI行为面与两个计划尺寸的浏览器必要未闭面；单元面与页面结构面由前序 Phase 的证据读回，不重复执行。

### 验收输入与执行责任

- P1–P7 作者提供各自 RED/GREEN 原件与 `Done`；`T014` 只消费，不替它们重跑。
- 三任务对照（AC-M3-3）的人工读回由未参与实现的独立读者完成；`T014` 核对其记录与核对器输出是否一致。
- 浏览器可见面：本Phase执行agent建立owned loopback预览并按两个测试尺寸实测；真实工具失败才保unavailable/原因，不预先N/A。

### 覆盖边界

- **覆盖上限**：只证明本次逐条读回范围内 AC 有档位与证据；不证明N8 28项欠账或完整四路真实效果已验，不证明真实模型行为；浏览器仅证明实际两个尺寸的观察，不证明其它浏览器或未测范围。
- **显式不覆盖**：跨任务历史复核（N1–N8）、G1 的必读字节全口径（OPEN-01）、审查 provider 的其它 adapter。

### 停止

任一 AC 缺原件、缺结论行，或把 `incomplete`/`unavailable` 写成 `pass`，停止收口，回该 AC 的承接 Task owner；不重跑到绿、不改判据。

### 完成

17 条 AC 各有档位与具名证据路径，结论行数与 AC 条数相等；未达成项写明原因、所需条件与 owner；命令与原始输出保存在 `quality/tests/`。

### 风险与回滚

- **风险**：把命令退出 0 当成 AC 通过。
- **影响**：质缺口被掩盖，下游按错误结论收口。
- **缓解**：逐条对照 `Appendix A` 的通过/失败条件，命令只作辅助；每条结论引原件。
- **回滚**：本 Phase 无写集，失败只回退结论文件，不动任何交付物。
- **触发条件**：出现「无证据但判 pass」或「结论行数少于 17」即回退本次结论并重做。

### 交接知识（给下游 Phase 与审查的已核实事实）

- `run-checks.mjs:166-170` 的既有参数拒绝语义是 AC-M3-2 的对照基线，验收时用同一命令确认它只剩 `--task-path` 一个放行口。
- `workflows/verify-code/steps.json` 的步数与 step_id 被 `tests/contract/stage-closeout-step-contract.test.mjs:19-35` 冻结，验收 AC-M6-2 时不改该测试。
- G1原预算027/029不变；035合入后方法71703（相对70548增1155）、模板额外+1213=1155+58（Phase+58）、必读84928不变。逐项同时读开工→最终与合入后→最终双差额，归因不豁免，P2/T003登记缺口并在计划确认展示；P7不能自行提高预算。

### T014 — 逐条收束十七项 AC

- **Source / FR / AC**：R-001–R-010、U-001–U-010 与 D-006–D-012；FR-CHAIN-001、FR-CHAIN-002、FR-CHAIN-003、FR-CHAIN-004、FR-CHAIN-005、FR-CHAIN-006、FR-CHAIN-007、FR-CHAIN-008、FR-CHAIN-009、FR-CHAIN-010、FR-CHAIN-011、FR-CHAIN-012、FR-CHAIN-013 / AC-M1-1、AC-M1-2、AC-M1-3、AC-M2-1、AC-M2-2、AC-M3-1、AC-M3-2、AC-M3-3、AC-M3-4、AC-M4-1、AC-M5-1、AC-M5-2、AC-M6-1、AC-M6-2、AC-M6-3、AC-M7-1、AC-M7-2。逐条按 `Appendix A` 的原判据，不另立判据。
- **Inputs**：P1–P7 的 Done、RED/GREEN 原件与 `evidence_path`；N9任务库三份不可变具名报告ref（本任务、N2、N6各保真实report.task_id，不写N2/N6库）；`final-chain-adoption-audit.json`；`2026-10-20-026`、`2026-10-20-027` 原件；独立读者的人工读回记录。以上由 `T014` 执行者从任务库读取，不由实现者转述。
- **Files / symbols**：`N/A — 只读验收，不写任何生产文件`；只读 `spec.md`、`phases/index.md` 与任务库 `quality/`。
- **Action**：只读执行（对工作树零写入；只把逐条结论写到任务库 `quality/evidence/final-chain-acceptance-readback.md`），按 AC 编号顺序逐条进行：① 读 `Appendix A` 该条四行；② 定位承接 Phase 的 RED/GREEN 与原件；③ 用同一命令在有真实环境时重放；④ 写一条结论到任务库读回件（AC 编号、一个档位、一条证据路径、未闭环说明）；⑤ 17 条写完后核对行数与 AC 数相等；⑥ AC-M1-3只消费P2/T004独立读者首次清单核回，不在P8首次补清单；AC-M6-3读P6原件。17ID唯一对应、合法档位、每条原件可读及结论真实性由逐条独立人读核，gate_cmd只计17个AC前缀行，不声称验证这些语义。⑦ 从已回填八steps当前选择路线，经真实 --task-path 取得同一报告，逐step集合与父指标复算、缺human/坏checker不可completed；有源正常消费 P5/T010 已交真实报告派生 HTML 与同名侧车；缺报告/缺环/合法N/A仅用受控临时副本派生QA页，不首次补 P5/P6/P7，执行本卡Scenario所述浏览器两个尺寸必要未闭case。⑧ 分别消费normal与complex时点原件，不以PLAN-REFRESH文字绿代两次真实刷新；尚未发生的closeout留真实待办owner，不伪造交付/PR。不做任何工作树代码或材料改动。
- **Outputs / failure**：17 行结论与一份汇总；缺证据时输出 `incomplete`/`unavailable` 与缺口说明，不输出 `pass`；发现回归时输出具体失败并交原 Task owner。
- **Boundary / DO NOT TOUCH**：`runtime/**`、`skills/**`、`workflows/**`、`tests/**`、`specs/**`、其他任务 facts；理由是本 Phase 只判不修，改动会破坏「结论来自被验对象」。
- **Dependency**：`P3`、`P4`、`P6`、`P7`；消费P3负例、独立P4、P6刷新/旧账与P7方法完成判据回填原件，P6传递P1/P2/P5；P7不代实际逐step运行，末验须用当前方法重核唯一报告。
- **Test tier / skill**：`real-task-readback`＋浏览器可见面；真实任务/CLI与必要未闭环step case适用backend-testing，浏览器按本仓isolated-browser-qa单agent-browser隔离运行；前序单元/结构面只读原件，不全量重跑。
- **Scenario / fixture or service**：正例为本任务实际报告派生HTML/侧车，N2/N6对照；缺报告、缺环、合法N/A用自建临时派生页而不改真实原件。仅为QA以该产物目录启动owned 127.0.0.1静态HTTP服务（端口0由系统分配，保存实际URL），不用生产服务/用户数据，不让用户起服务。执行owner=verify-code agent；按本仓 `skills/isolated-browser-qa/SKILL.md` `browser-qa-context.sh --run --url <实际URL> --evidence-dir <任务证据目录> -- bash <本次场景脚本>`，先doctor/cleanup，独占新profile。两个viewport按1440×900与390×844设置后实际eval读取innerWidth/innerHeight对照；先get url/title与DOM ready marker，再检查十环/15节点/缺口/N/A理由/双指纹、展开交互/横向溢出、console/errors与a11y，保存各尺寸实际截图与差异。finally由--run清浏览器并核owned残留，再停仅本次server、核原件size/hash；保localhost白名单，禁止为file://移除保护。当前仅设计未执行，无法启动/工具失败保真实原因与owner，不预先N/A。
- **预写测试**：`N/A — 聚合不另写实现测试；冻结PLAN四组与P1–P7首次原件是输入；本卡必须执行必要未闭step/CLI/真实HTML case，不能只计行当E2E`。
- **可观察接缝**：`node tools/cli/run-checks.mjs --task-path …` 的真实 stdout 与退出码；`tools/cli/run-checks.mjs:166-170` 证明既有参数拒绝语义；`quality/evidence/2026-10-20-027-build-plan-g1-baseline.txt` 的 70548 B 基线与 `wc -c` 实测对照。
- **RED/GREEN gate_cmd**：`node -e "const fs=require('node:fs');const p='/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n9-final-chain-verification-20261020/quality/evidence/final-chain-acceptance-readback.md';const n=(fs.readFileSync(p,'utf8').match(/^- \*\*AC-/gm)||[]).length;if(n!==17){console.error('AC rows='+n);process.exit(1)}console.log('AC rows=17')"`
- **expected_exit**：RED nonzero; GREEN 0；只有「证据行缺失」这一命名断言算目标 RED，参数或环境错误另记。
- **RED target failure**：目标断言 `AC rows === 17` 失败时（实际AC前缀行数不是17）命令exit1。ORACLE-P8-ACCEPTANCE命令仅统计读回件 `- **AC-…` 前缀行数，非17时exit1；重复ID、缺档位或坏ref不保证命令非0，由逐条人读判未达成并保原件，不能把计数命令冒语义判定器。
- **RED 证据**：`N/A — 读回行数本身不是行为RED；报告原件尚未产生属输入setup，不能凑失败，目标业务RED沿016和各前序首次原件`
- **GREEN oracle**：ORACLE-P8-ACCEPTANCE同命令exit0仅证17个AC前缀行；少/多一行非0。独立人读另核17个精确ID一一对应、每条合法档位与可回读原件、缺口不冒pass；计数GREEN不替代该语义工作。
- **Evidence**：`quality/tests/2026-10-20-p8-acceptance.output`（计划路径；实际引用由执行者保存）。
- **STOP / recovery**：缺原件或证据不足时停在该条，回原承接 Phase 的 Task owner 补；不重跑到绿、不删失败、不改判据。
- **测试变更请求**：`none`。
- **Coverage limit**：只证明逐条实际读回、所选路线必要step case及两个测试尺寸真实浏览器观察；截图不证明全部需求或用户偏好，不证明N8原28欠账、真实模型行为、其它尺寸/浏览器。未执行QA不宣浏览器通过；真失败保unavailable而非预先N/A。
- **Done**：17 条 AC 各有一行结论、档位与证据路径；未达成项有原因、所需条件与 owner；命令与输出保存在 `quality/tests/`。没参与实现的人能用本节 gate_cmd 重放。

### 验收 Phase 固定小节（只在验收 Phase 填写）

1. **入口准则**：逐条核对 P1–P7 的 Done、写入集落地与两份就绪件的 status；每条写核对结果与证据路径。缺 Done 或写入集未落地的 Phase 不做后续判定。
2. **两份就绪件**：数据就绪件＝N9任务库三份不可变具名报告ref（各真实task_id） 与 `final-chain-adoption-audit.json`；环境就绪件＝`node_modules` 可用、`npx vitest` 可跑、任务库可读。各写 status；缺数据写 `incomplete` 或 `unavailable`，不伪造。
3. **授权边界**：本次验收对工作树只读；允许副作用仅本任务证据原件写入、自建临时派生产物、owned loopback静态HTTP服务与owned隔离浏览器会话的启动/观测/finally清理；只作用本次归属资源。禁止改仓库文件、他task facts/quality、用户浏览器或用户服务，禁止全量回归；失败保原件并只清理自建资源。
4. **逐条结论**：每条 AC 一行：AC 编号、一个档位、一条具名证据路径。档位只引用 `runtime/evidence/acceptance-evidence-validator.mjs:6` 的词表；非 `pass` 不计通过，不按计数替代逐条。
5. **五类执行事实**：逐条记命令与参数、cwd 与执行者、exit code 与 signal 与 timeout、原始输出落点、机器可读测试报告（runner 与版本）；`refs` 各标 `execution_record`/`machine_report`/`red_original`/`negative_control` 之一。
6. **效果评测**：比较基线＝`2026-10-20-027` 的 70548 B 与三任务改造前人工可核环数；指标＝方法字节、可核环数、`skip_rate`、`attestation_coverage`；正例＝三个真实任务，负例＝七个受控副本；结论只写实际读数，不宣称稳定或改善。
7. **复验四项**：复验者与修复者的上下文差异写具体 subagent 身份；F2P＝本次新增断言，P2P＝既有 portable-workflow、`run-checks`、页面与 third-review 断言；回归范围限定为受影响文件；三档判分按 `FULL`/`PARTIAL`/`NO`。
8. **变更批准**：AC 或用例集合本次无增删改，写「无加理由」；D6/D7 的写权冲突按 D-012 记录，批准者是用户（U-005）。
9. **分诊与关闭**：失败先复现，分诊者不是实现者；字段 `Defect ID`/描述/可复现/`Version detected`/`Severity`/`Priority`/`Disposition`（初值 `Pending`）；终值只取 `Fixed`/`Won'tFix`/`Deferred`/`AcceptedRisk`/`Duplicate`/`NotABug`/`Referred`。
10. **回写五项**：`spec.md` 场景卡、`spec.md` AC 表、phase 契约「覆盖 AC」、`facts.jsonl` 既有字段、本次修复记录；每项写哪条 case 改了、为什么、改后判定。
11. **六项结论**：逐项写评估（含局限）、与计划的偏差及原因、未充分测试的特性及原因、未解决事件、残留风险、签核对象；无则写「无加理由」。
12. **防自证五禁令**：不用授权文本验证授权文本；不删到测试变绿；不改断言消音；黄金清单改动由另一主体批准；不用计数代替逐条；不把 `incomplete`/`unavailable`/`unverified` 写成 `pass`。
13. **失败修复复验闭环**：失败 → 分诊 → 根因调研 → 修复回原 owner Phase 的 Task → 换上下文复验（第 7 项）→ 回写五项；降级项同段写风险承接人署名。

## L2 — 可删除参考

删掉本节不改变 L0/L1。参考：`quality/evidence/2026-10-20-022-build-plan-upstream-requirements.md` 的父 AC 承接表，用来核对「父条款 → 本规格 AC」不是简单换名。

## 补充材料

- 父 AC 原文与承接：`spec.md` 的「父 AC 承接」表与 `quality/evidence/2026-10-20-022-build-plan-upstream-requirements.md`。
- 十环定义：`quality/evidence/decision-log-refs/s3/T4-compliance-supplement.md:17-27`（相对父任务库）。
- G1 基线：`quality/evidence/2026-10-20-027-build-plan-g1-baseline.txt`。


## 本 Phase 自带判据小结（最终独立聚合）

本节逐项消费既有首次承接原件，不产生任何上游首次验收或生产改动。逐条完整限定、源→consumer→oracle→原件链由 `quality/evidence/final-chain-acceptance-readback.md` 对应AC段及675提供，676保完整原始回传；三原件均已读回，675非全stage质量判断。

- **AC-M1-1** `pass` — 原052＋180/523四级40格受控断言；不冒N8四路真实业务。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M1-1`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M1-2** `pass` — 239/240真实旧N2/N6无级别fallback，十环保留缺源basis。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M1-2`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M1-3** `pass` — 250首次九项采用清单；两方法缺源+owner，0新增。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M1-3`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M2-1** `pass` — 655来源修复与232/239/240真实分母/两率重算，unknown按源保真。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M2-1`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M2-2** `pass` — 052/148声明与事实缺失/冲突精确状态；不虚构union。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M2-2`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M3-1** `pass` — 148内核/default＋238原G1分母，632同文件减法；余29/199/794不代成本。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M3-1`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M3-2** `pass` — 148/073旧CLI/default与当前三任务JSON；不重跑无范围aggregate。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M3-2`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M3-3** `pass` — 232/239/240三报告30环与原427source-derived比较一致，原假绿保。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M3-3`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M3-4** `pass` — 真实最终DATA.rings/report同值、双指纹/引用与sidecar，237及675。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M3-4`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M4-1** `pass` — 22829受控case、四级40格和真实baseline/status恢复，523/655；不冒外部PR效果。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M4-1`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M5-1** `pass` — 024/027/043受控健康、允许慢流与终态恢复；不冒真实慢模型校准。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M5-1`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M5-2** `pass` — 196127＋16312及589/590/593真实12行1312B逻辑行诊断；非raw/原配置全量。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M5-2`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M6-1** `pass` — 237两实际viewport各12节点82assert、241顶部/675，缺件与seen211按原JS复用；contrast未完全。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M6-1`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M6-2** `deferred` — 563/原spec实际两route事件未发生；owner下一实际make-decision/verify-code caller，不伪刷新/PR。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M6-2`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M6-3** `pass` — 563/560十三项三态与D12补记；6已收/3incomplete/4用户决定，不清旧债。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M6-3`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M7-1** `pass` — 当前47source+slug/owner可定位但真实步骤0/47、stage skip null；655/675与P3反例。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M7-1`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。
- **AC-M7-2** `pass` — 原84方法读回＋8row/四句定点补读，原八source/35条件方法保全；不等实际步骤执行。 具名原件：`quality/evidence/final-chain-acceptance-readback.md#AC-M7-2`、`quality/evidence/2026-10-20-675-p8-final-independent-ac-browser-audit.json`。

- 规则锚/已验：spec Appendix A17AC原条件，P8/T014只聚合与必要未闭case；242原gate17前缀exit0不证明ID/档位语义。237单agent-browser隔离--run两viewport/12节点/实际click，241顶部、232/239/240三任务source/hash与指标复算，675独立审计来源完整；未发空writeSet OCR，P8无生产diff。
- 未验/owner：真实双刷新AC-M6-2 deferred归下一实际routecaller；N8原28/N1同条件成本、用户审美、完整contrast/其它浏览器尺寸未清。P3/P7 formal review在途由root按真实终态/原raw/coverage汇总，business_effect16 bounded pass不冒code_review全绿。0/47真实step未执行与报告协议边界通过分义。
- 原失败与清理：630/617/628/626/668/205/209/211/235等历史保原；235脚本漏scroll/filefold、genuinehero溢出修复与复验分别记。freshownedprofile、无login/cookie复用、无引擎切换；672/674/675证明ownedprocess/profile0、两server端口关闭，foreign全局agent/MCP仅诊断未附着/停止。
- 范围/材料影响：原P8 read-only/no-production WriteSet不变，未首次补P5/P6/P7；本轮仅写本卡Done与本节及已授权P2/P5最终补充，不改FR/AC/测试oracle/source/facts/Git。当前聚合完成不代表stage succeeded、accepted、最终handoff已发布或Git已交付。
