---
name: run-phase
description: build-code 第 2–9 步的窄执行契约：每步的输入、首动作、交付与拒认条件；完整方法仍在 workflows/build-code/SKILL.md，本技能不转移写权。
---

# Run Phase

读者：build-code 的 Phase 执行者、独立审查者与只读测试者。
读完要能按当前 Phase 的步骤直接开工，并知道每一步交出什么、什么不能算完成。

## 边界

- 完整方法、步骤编号、阶段正文与失败分诊仍在 `workflows/build-code/SKILL.md`；本技能只把第 2–9 步压成可执行的操作契约，不复制全文。
- 本技能不转移写权：开发仍是唯一写者，审查与测试只读，主会话只派发；修复回原实施会话。
- 第 7 步的实际 diff 扫描仍由原 diff 所有人执行；本技能只给交接动作，不把扫描或写权转到审查者。
- 每一步都只按当前 Phase 的写集、冻结命令、真实原件和已确认 AC 工作；缺输入时停该路径，不用默认值或占位件补齐。

<a id="process-not-applicable"></a>

## 流程：调研与设计不适用

本技能是执行契约，本步骤的输入已在 Phase 卡与阶段正文里定过；七步里的「上下文、调研、设计」三步不在本技能重做。

- **不适用**：「上下文」由第 1 步读材料与 Phase 卡承担；「调研」由阶段第 1–2 步与 `skills/phase-maker/SKILL.md#八步` 的输入承担；「设计」由 Phase 卡 `skills/spec-plan/templates/phase-template.md` 的「这一 Phase 交出什么？」与「这一 Phase 怎么验收？」两节承担（节名定位，行号随模板漂移，不按旧行号硬读）。本技能从「产出」起算，冷读／对抗／异源对应第 8 步，收敛对应第 9 步。
- **方案歧义回上游**：首改路径、成立条件或失败信号没写清，回 `skills/phase-maker/SKILL.md#八步`；方向、验收或取舍本身有歧义，回 `skills/decision-maker/SKILL.md#package-convergence`。回上游时停受影响步骤，写缺口、owner 与恢复条件，其余步骤继续。
- **拒认**：在本技能里现场补设计；把实现中的选择当已定方案；用「按计划实现」代替首改路径。

### 流程六项落点

- 上下文来源：第 1 步读材料与 Phase 卡；本技能不重做上下文。
- 谁派：主会话每 Phase 派开发者（唯一写者）、独立审查者与独立测试者；审查只判差异与发现，测试只跑声明测试面并在开发者每轮改完后重测；异源另起一次独立派发。见「角色：开发者、独立审查者、独立测试者」节。
- 歧义先 talk：方案歧义回 `skills/phase-maker/SKILL.md#八步`，方向或验收歧义回 `skills/decision-maker/SKILL.md#package-convergence`（见上一节）。
- 产出形状：第 2–9 步各自的「交付」行与原件。
- 谁审：第 8 步的独立审查与同源补充轴；开发不兼审。
- 怎么收敛：第 9 步 findings 逐条处置、受影响复验、缺口清单带 owner。

## 角色：开发者、独立审查者、独立测试者

主会话每 Phase 派三个人：开发者是唯一写者，独立审查者只判差异与发现，独立测试者只跑声明的测试面。
上下文包由派发者在派发前按模板填三件与六列；填不出就不派发。
主会话只派发与收件，不写代码、不判审测；角色答不出，按退回列找人补，不代答。

| 角色 | 谁 | 何时派 | 读什么 | 交什么 | 独立性 | 答不出退回给谁 |
| --- | --- | --- | --- | --- | --- | --- |
| 开发者（唯一写者） | 本 Phase 执行者 | 每 Phase 第 2 步起，到第 9 步 findings 处置完 | Phase 卡、写集、冻结命令与 AC、真实接口 | 第 2–9 步的交付（真 RED 原件、最小 diff、测试面、逐面结果、AC 结果、diff 扫描）＋按 findings 自判自改＋每轮改完通知重测 | 唯一写；不得自审、不得自己签测试通过 | 退回原派发者（Phase 卡作者与主会话）补输入；方向或验收要改，退回原决定人 |
| 独立审查者 | 不同上下文的执行者；Standards 与 Spec 两栏各不同上下文；另起一次异源 | 实现就绪并明确通知后（第 8 步）；异源另一次 | 已就绪差异、承接 AC、声明测试面、实际执行原件、审查重点、原文三件与六列 | 一次审查（两栏并排、四态 findings）＋翻译对照一节（冷读三问与对抗三问）＋异源原件一份。**只判差异与发现，不跑测试面** | 开发不兼审；两栏并排不合并排名；异源不继承同源上下文；不改代码 | findings 回开发者；开发者自判自改；改完由本角色复看同一批原件 |
| 独立测试者 | 只读测试执行者，与审查者不同上下文 | 开发就绪后（第 5 步）与开发者每轮改完后（重测） | 受影响 file／case 集合、声明的测试命令、真实环境与输入 | 命令、退出码、失败归因、覆盖限制；与审查回报在开发最后确认前汇合。**只跑声明测试面与重测，不判 findings** | 只读、不改代码、不写共享文件；与审查并行 | 退回开发者（原实施会话）修，再由本角色复测；改完未复测该 AC 不得记通过 |

1. **要答哪三问**：六个短名——冷读：对应原文哪句／哪项被降级／删掉哪条验收会红；对抗：谁做被写成读者／有角色没原件／绕过有无负控。本节只写这六个短语，不写整句问句；问句全文、六列列名与样张只在一处：`skills/decision-maker/templates/package-context.md` 的「原始需求翻译契约」节；两处不一致以那节为准。
2. **上下文包谁填、缺了退谁**：派发者在派发前按模板那一节填三件与六列；填不出（缺原文、缺行位、缺 sha、六列有空行）不得派发；执行者（代码阶段是开发者）或审查者（代码阶段是独立审查者）因缺三件／六列答不出，退回派发者补，不拿会话摘要或转义补。
3. **原件放哪**：调研与自判报告 `quality/evidence/<阶段>/<日期>-<单元>-research.md`、上下文包 `…-context.md`、审查原件 `quality/reviews/<日期>-<单元>-review.md`（phase-maker 的回读另 `-readback.md`、异源另 `-heterologous.md`；task-maker 同源与异源各一份）；设计产物就是卡本身或代码 diff，不另存；run-phase 的测试走既有 capture 与 `quality/tests/`。
4. **完成证据怎么写**：上面这些路径写进该步 claim 的 `inputs`（一条一个纯路径，不加前缀）；角色→路径对照写进同一 claim 的 `observation` 首行；原件头写 `agent:`／`dispatched_at:`。都是人读标注，不改字段、不进 `steps.json`；step claim 的机器只核 `inputs` 非空。**两处例外要说准**：①decision-maker 自己的 `--bind` 会比「卡末声明的设计者／审查者」与原件自填 `designer`／`reviewer` 是否同名——只是字符串比较，同名可以自填两人绕过，独立上下文仍由人读署名与派发记录判；②`--bind` 只在显式运行时生效，本阶段不把它当完成依据，谁跑、何时跑写进交接。

<a id="step-write-red-tests"></a>
## 第 2 步：先证目标失败

- **输入**：计划冻结的目标测试、oracle、`DO NOT TOUCH`、当前 Phase 的真实行为契约。
- **首动作**：读冻结断言与 oracle 来源，实跑冻结目标测试，保存命令、cwd、退出码和原始输出；确认失败发生在目标断言，而不是导入、环境或配置。
- **交付**：真 RED 原件；导入、环境、配置这类装置失败另记，不算目标 RED；无真 RED 不进实现（不进第 3 步）；补写的行为测试先定明确 oracle；纯材料任务按 G-2 写检查或真实不适用理由。位置：摘要 `quality/evidence/step-evidence/build-code-2-write-red-tests.json`；实体：`quality/tests/` 的既有 RED 捕获（按本条既有规定保存）；读者：`check-stage-steps` 的动态槽与 build-code 终末承接按 `source`+`step_slug` 读它。
- **拒认**：没有目标断言失败、把导入失败当目标 RED（装置失败另记，不算目标 RED）、先实现再补测、为换绿弱化断言。
- **失败**：真实失败先读 `skills/diagnosing-bugs/SKILL.md` 保留反馈回路与根因修复，再回本步；改冻结断言先走 TCR 与独立审查。

<a id="step-implement-change"></a>
## 第 3 步：最小实现

- **输入**：目标失败、首卡、允许写集与真实接口。
- **首动作**：在允许文件／符号内做最小纵切，先接公开入口与真实消费者，用真实输入跑到真实输出；只做让目标断言转绿的最小改动。
- **交付**：可观察的真实改动、实际 diff、目标行为原件；内部函数返回不算演示；错误明确暴露，不吞异常。位置：摘要 `quality/evidence/step-evidence/build-code-3-implement-change.json`；实体：git 实体（实际 diff，按本条既有规定保存）；读者：同上；终末 `diff` 另读实际 diff。
- **拒认**：只铺内部层、把内部函数返回当演示（不能算公开演示）、越出写集、用兜底掩盖错误、把计划缺口自行改成产品选择。
- **失败**：计划或方向缺口一次列清影响、风险与需 owner 回答的问题，交 build-plan 或 make-decision；不受影响的安全部分继续。

<a id="step-inspect-and-route-actual-tests"></a>
## 第 4 步：按实际差异选测试面

- **输入**：真实 changed files、当前 Phase 的测试声明、既有实现与消费者。
- **首动作**：按 `skills/knowledge-graph/SKILL.md` 查实际波及面并首次读源码；用 `skills/test-routing-advisor/SKILL.md` 选 simple/feature/fullstack，再选一条具体测试路线。路线含自动触发或对外发送时，同读 `skills/backend-testing/SKILL.md` 的「自动作业与对外传输」，按其判法与证据要求执行；本步只指路，不复述判法。
- **交付**：实际差异到测试面的对应关系、选择理由、风险场景与排除原因。位置：摘要 `quality/evidence/step-evidence/build-code-4-inspect-and-route-actual-tests.json`；实体：`quality/tests/` 的测试路线与实际输出（按本条既有规定保存）；读者：同上（无专属机器 reader）。
- **拒认**：按目录名猜测试面、拿计划路线代替实际 changed files、图或选择器代替真实 oracle。
- **失败**：图缺失、歧义或目标不存在时如实记 exit 与 unknown，安全回原文与真实测试；图不作质量许可。

<a id="step-run-tests"></a>
## 第 5 步：跑声明的测试

- **输入**：Phase 声明的逐面命令、`gate_cmd`、真实测试环境与输入。
- **首动作**：逐面跑字面命令，用既有 `task.captureCommand` 或 `verify --action=execute` 保存 cwd、argv、exit、signal、超时/取消、原输出与清理事实。
- **交付**：每面的实际结果、失败归因、原件引用与未跑面的「哪一面／卡在哪／什么条件下能跑」。位置：摘要 `quality/evidence/step-evidence/build-code-5-run-tests.json`；实体：`quality/tests/<ts>-*.json`／`*.output` 的 verify 捕获（按本条既有规定保存）；读者：同上；终末 `actualCommands` 读命令捕获原件。
- **拒认**：无范围全量回归、环境或收集失败冒充目标 RED、exit 0 自动当业务通过、重复保存同字节输出。
- **失败**：外部不可重试失败第一次即零重试，停该外部路径并记恢复条件；其余安全面继续，证据沿既有 capture。

<a id="step-inspect-acceptance-and-ui"></a>
## 第 6 步：核验收与 UI

- **输入**：适用 AC、真实命令或服务、实际入口、UI 任务的两尺寸截图与真实消费者。
- **首动作**：对每条 AC 跑真实场景，逐项对照 oracle、可观察效果与失败反例；UI 任务按 1440×900 与 390×844 实际截图并排看。
- **交付**：每条 AC 的实际结果、原始输出、输入/环境、覆盖限制；UI 另留通过、差异、用户接受偏差与不可用项。位置：摘要 `quality/evidence/step-evidence/build-code-6-inspect-acceptance-and-ui.json`；实体：`quality/evidence/p<N>/` 的截图与差异（按本条既有规定保存）；读者：同上；第 8 步独立审查者按 `skills/wh-review/SKILL.md` 的输入逐条读，build-code 终末承接写进 final-report 的逐条承接。
- **拒认**：只拿内部函数或模拟效果冒真实结果、缺截图或差异说通过、把功能测试通过当视觉通过、实现者自签偏差。
- **失败**：真实服务缺失、未执行、部分或不可用保持原样并记负责人与恢复条件，不补默认通过。

<a id="step-scan-diff"></a>
## 第 7 步：扫实际 diff

- **输入**：当前真实 diff、声明写集、真实消费者、接口两端、状态与资源生命周期。
- **首动作**：由原 diff 所有人继续运行原扫描，逐项核对写集、消费者、错误传播、并发原子性与资源释放；UI 适用时读页面审计来源并留组件复用与沉淀结论。
- **交付**：实际收敛用的具名差异、疑点、真实消费者与边界观察；UI 另交七项界面判定字段。位置：摘要 `quality/evidence/step-evidence/build-code-7-scan-diff.json`；实体：`quality/evidence/` 的 diff 扫描记录（按本条既有规定保存）；读者：同上（无专属机器 reader）。
- **拒认**：只有空自述、只给目录或文件清单、把扫描写权转给审查者、缺证据说 UI 完成。
- **失败**：工具、浏览器或截图不可用记 unavailable 与真实原因；来源、样本或场景缺失不宣称 UI 完成。

<a id="step-review-change"></a>
## 第 8 步：独立审查当前差异

- **输入**：已就绪的实际差异、当前 Phase 承接 AC、声明测试面、实际执行原件与审查重点。
- **首动作**：按 `skills/wh-review/SKILL.md` 与标准工作方法的审查点发起一次独立审查；同时派独立上下文的同源补充轴，Standards 与 Spec 两栏各由不同上下文的执行者完成并各留原件，各轴并排保留，不合并排名。
- **交付**：审查执行者、来源、三维读数、真实终态、原件与覆盖限制；不可用保留检测输出与原始失败。位置：摘要 `quality/evidence/step-evidence/build-code-8-review-change.json`；实体：`quality/reviews/` 的审查原件（按本条既有规定保存）；读者：同上；`stage-runtime` 终末评估读 `quality/reviews/` 原件。
- **两方回报**：审查回报列 finding 与未解决项，测试回报列命令、退出码、失败归因与覆盖限制；两方回报须在开发最后确认之前汇合，开发确认只表示写主无待改项，不替代两方回报。
- **拒认**：拿同源意见冒异源、缺覆盖或空 findings 当通过、用成功轴覆盖失败轴、审查者与实现者同人。
- **失败**：provider 不可用、失败、超时、取消或无效输出按既有 wh-review 口径保原失败，不换执行者、不写通过；其余安全修复继续。

<a id="step-analyze-review-findings"></a>
## 第 9 步：处置 findings

- **输入**：审查与测试两方实际回件、原 finding 原文、当前 Phase 的受影响 file/case。
- **首动作**：逐条保留原文并按内核 R5 四态处置；有效问题回原实施会话，先列受影响 file/case，再只跑该集合并写实际结果。
- **交付**：每条 finding 的处置与理由、受影响复验原件、Phase Done 的缺口清单；残余：即该缺口清单（剩余失败、owner、下一 Phase），不另写；`failures` 按现有执行清单五要素追加。位置：摘要 `quality/evidence/step-evidence/build-code-9-analyze-review-findings.json`；实体：`quality/evidence/build-code/execution-checklist-<phase>.md`（按本条既有规定保存）；读者：同上；`runFailureRecordChecks`（`tools/cli/run-checks.mjs:534-570`）只对带 P6 那两条清单检查项的 Phase 读清单 failures 段，其余 Phase 只由动态槽与终末承接读 facts 条目与摘要。
- **晚发现与同因**：晚发现即迟到有效发现，回原 Phase、由原开发修复，不另开 Phase、不丢弃、不得只带到期终审；同因时先停重复动作：同一失败重复或一轮没有新事实，按既有阈值分诊；改断言走原请求，oracle 身份不换。
- **终末边界**：终末外部单审不在本段；push、merge、归档与删除归 stage-close，本段不执行。
- **提交身份**：审后只做一次正常提交，记 commit sha 与 author 并绑定两方回报 ref，末段据此核同一开发；迟到发现按补提交单列。
- **拒认**：只改处置状态、只改行号或夹具当新事实、拿未绑定的答复记接受风险、两方未回报就宣布完成。
- **失败**：确实无法在当前范围解决时写影响、证据、原因与剩余选项，继续不受影响的工作；严重风险交真实用户，不自行接受。

三条共用规约：① 同一步一份，文件名与 `workflows/build-code/steps.json` 的 `step_slug` 同源，不改名、不加日期前缀、不按执行者分叉；② 登记走既有写入口 `runtime/interface/record-step-evidence.mjs`（`--ref`／`--command`／`--exit-code`／`--receipt`），它写进 facts 的 `quality_evidence` 条目，这就是「本次运行」的事实来源；③ `step-evidence` JSON 的 `reader` 字段是本步**读回执行者身份**（任务四里今天全是收口补录者），不是消费者；消费者只写「读者：」一段，不得借读者栏把它洗成执行者。

## 效率条款

效率：审查一次定稿，findings 按内核 R5 四态（已修／无效／接受风险／需人）逐条处置；修复回原实施会话，不重复开第二轮审查。什么情况下不做：同一失败重复出现或一轮没有新事实时，先停重复动作做根因检查，不靠再开一轮审查换结论。违反时的表现：同一问题审两三轮、findings 只改状态不写处置，或把需人项自行记成接受风险。

## 收尾：单元复盘记录

第 9 步 findings 处置完、Phase Done 的缺口列清，这个 Phase 的设计与执行合成一个单元完成，当场记一条。
这一节只记一件事：这批 findings 里哪条是真问题、处置后留下了哪条会改变下次做法的实现教训；没有就写具名依据。
设计侧的切 Phase 信号与切片从 `skills/phase-maker/SKILL.md` 的「收尾：单元复盘记录」读，写进同一条记录；设计侧不另记。
五问、摘要上限、记录形状、状态词与证据指针，读 `skills/stage-reflection/SKILL.md` 的「单元模式：单元复盘记录」；此处不复述方法。
下一位读者是下一同类单元的作者：开工先读这条记录，答一句「这条改变我这次哪一步」，答不出写「未改变」＋理由；单元总结不超过五条、每条一句、结论先行，写法与上限只读 `skills/stage-reflection/SKILL.md` 的「单元模式：单元复盘记录」，此处不复述。
少记一条只让本 Phase 这一条判未完成，不拦本 Phase 之后再开工。

## 与完整方法的关系

- 需要细节、例外或失败分诊时，回 `workflows/build-code/SKILL.md` 对应锚：`#step-write-red-tests`、`#step-implement-change`、`#step-inspect-and-route-actual-tests`、`#step-run-tests`、`#step-inspect-acceptance-and-ui`、`#step-scan-diff`、`#step-review-change`、`#step-analyze-review-findings`。
- 本技能与完整方法冲突时，步骤编号、写权与阶段门仍以完整方法和 `steps.json` 为准；本技能不新增步骤、状态或第二进度。
- 单目录复制时，完整方法需由调用者同时提供 `workflows/build-code/SKILL.md`；缺原件时明确报缺失，不把本小卡当完整替代。
