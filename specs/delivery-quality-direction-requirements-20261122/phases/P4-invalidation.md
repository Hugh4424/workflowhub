# Phase P4 — 变更失效有接手人

给实施者、独立验收者和首卡作者：从同一失效行定位要重做的工作和接手人。

> 写作只沿 `skills/material-writing/SKILL.md`「材料写作标准（唯一）」。
> 精确命令、路径、引文与机器读取的标题和标签保留原字面。
> 下文「任务根」指本任务的认证任务库；`quality/` 引用相对该根。

## 哪些节必须写，哪些可以省？

独立执行所需内容都在下表；本阶段不做末次整体验收。

| 节 | 声明与位置 |
| --- | --- |
| 选节 | `written`：本表列本地职责与末验归属 |
| 交付、开工就绪 | `written`：旧行、接手与共享检查器 |
| 验收、依据、前读 | `written`：两条验收、历史反例及真实事件限制 |
| 文件与写序、验证 | `written`：逐路径交回、反例和回退 |
| 下一消费者、任务卡及机器块 | `written`：证据交回与唯一任务 |
| 末验、脚手架、示例 | `not-applicable`：整体验收归阶段 7，本卡不留脚手架 |

## 这一 Phase 交出什么？

变更接手者能读到谁标注、凭什么改、哪里失效、谁去改；旧记录仍待重做。

共享检查器已随主线纳入当前工作区，不再等任务一另交副本。
现役解析只取步骤、范围数字和阶段标记；不读标注人、受影响位置或接手人。
先交兼容的失效行与报告，再在首次真实替换决定时证明接手者确实改卡。
「首判」是独立执行者在本包实施和审查回修后第一次判定。

阶段 1 经独立审测后交第 9 步技术版本、原件与具名读取缺口。
阶段 4 据实接手共享文件，不等阶段 1 的验收通过。
阶段 2 交原话和承诺的技术版本，阶段 3 交未答与覆盖的技术版本。
阶段 5 接共享检查器，阶段 6 接失效位置，阶段 7 只读原结论。
保留人工失效标记，并复用既有日志；当前没有可靠的自动影响判断。
阶段 4 的独立交付是兼容读取；真实事件及下游改文是另一证据面。

最高风险是新字段被读成阶段或扩大影响范围。
若发生，先回退新增读取，保留原待重做机制和人工接手记录。
本任务尚无首次真实改向。主会话先核原决定和当前事实是否真的需改方向。
只在实际变化发生时取原改变依据和真实答复；不制造改向，也不借外任务事件。
先读下节列出的规格、决定及实际解析入口，再接手共享文件。

### 开工就绪表

只补本阶段探针；全局身份与环境沿规格的开工就绪表。

| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |
| --- | --- | --- | --- | --- |
| `test -f specs/archive/workflowhub-ui-frontend-c06-spec-driven-implementation-20261031/decision-log.md` | 0 | `quality/tests/readiness-p04-old-invalidation.output` | 机器 | 阶段 4 写主 |
| 核已纳入的共享检查器版本，收阶段 1–3 技术交回原件 | 与实际接手版本一致；不等任务一另交版本 | 阶段技术交回及工作树版本引用 | 人 | 主会话、各原写主 |

## 这一 Phase 怎么验收？

先用同版检查器判兼容，再在真实替换决定发生后独立判接手改文。
界面不适用：工作对象是命令行报告、日志和首卡，不读或驱动页面。
受控样本用合成数据（S）；真实改向用本次实际事件及其材料。
独立测试者与独立读者分别判这两个面，不能互替。

**验收 5。**
从归档旧行和就地构造的新行开始，跑「怎么验证？」的定向命令。
使用当前已纳入的共享版本；测试作者只在现有测试中造同根受控输入。
按规格附录 A 判旧行、新字段、报告级缺口和邻项；缺标注人必须显名。
真跑同一断言，改前目标失败预期非零，改后预期退出 0。
独立测试者在本阶段首判保存输入与报告；原件位置见任务卡。
上游技术版本冲突回原写主；解析或退出回归由本段原写主修同分支后复验。

**验收 6。**
首次真实变更后，按旧新决定、失效行、实读、首卡改文的顺序复读。
主会话在本任务组织材料写主、阶段 6 独立作者和独立读者。
回读实际修改权、理由、原答与本任务首卡改前后字节，不等外任务供件。
独立读者先只看旧、新决定和原需求，自行列出全部受影响位置。
再逐处对照失效行、接手人、实读与改前改后字节，不能照抄失效行。
受控正例改两处并保有效邻项；负例只漏第二处，须点名该处。
遮掉改文或接手人、误作废邻项也须检出；受控对照不冒真实事件。
只用真实事件；定向夹具不代本验收，公开检查命令只作旁证。
未参与改文的独立读者在这次改文后写 `quality/tests/p04-real-change.readback.md`。
未发生则 `unavailable`，不造事件，也不把本轮分工回复当真实改向或实施批准。
材料和改文失败由本任务主会话安排原角色恢复，技术交回继续。

| 条款 | executor | estimate_min | hard_cap_min | resources（来源） | observation | retry_cap | evidence_tier | 范围及不可再简的原因 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 验收 5 | 独立测试执行者 | 20 | 40 | 当前已纳入的共享检查器、原写主提供的旧新行测试 | 旧行待重做、缺字段提示及邻项 | 0 | 命令级 | 仅证解析和报告；新行不能代旧行对照 |
| 验收 6 | 独立计划作者与读者 | 25 | 50 | 主会话和变更发起人交真事件，阶段 6 交改前后卡 | 目标改文且邻项保留 | 0 | 真实原件级 | 仅证本次接手；标签不能证明用户效果 |

按规格附录 A，先后活动估算 `20 + 25 + 0 + 0 = 45 active_min`。
最后两项是没有单列的共享准备与原样重试，不是实测。
形状：局部解析、两条验收、受控小样本与单次真实事件；可直接做可用面。
阶段预算：软上限和偏差率未确认，硬包络分条见表，不是质量门。
`execution_budget={window_minutes:unknown,command_cap:unknown,wait_cap:unknown,retry_reserve:unknown}`。
执行预算未在已读决定取得，由主会话回原决定人；单位为分钟或命令数。
用户变更与独立审查的纯等待分别记，不计入活动估算。

## 为什么现在做，依据是什么？

先让失效行能直接被接手，阶段 5 才能扩展同一份步骤报告。

决定 4 采用可回读的同一行，拒绝自动推导与新账本。
真实变更原义见归档总需求第 394 行；新旧关系不能被状态标记替代。
七阶段写作范围看当前真实大纲答复；范围不等于各条验收已通过。
旧包卡的骨架确认仅作设计来源，不能冒充逐包答复。

## 开始前读什么？

先锁定现有语义和写序，再从公开入口设计同一组断言。

| 实读材料或锚点 | 用途 | 读取时机 |
| --- | --- | --- |
| `spec.md`「接口与失败语义」、附录 A 验收 5、6 | 判定器、写序与本地首判边界 | 开工前 |
| `decision-log.md`「包4具体改什么、怎么改、怎么验」；任务根 `quality/evidence/decision-maker/p04/card.md` 第 7 格和卡末 | 核同一失效行及旧卡来源强度 | 开工前 |
| `workflows/make-decision/SKILL.md:224`；`tools/cli/check-stage-steps.mjs:315–347,1535,2254,2347` | 看旧行解析、调用和 `supersede.invalidated` 的现有步骤列表投影 | 首改前 |
| `specs/archive/workflowhub-ui-frontend-c06-spec-driven-implementation-20261031/decision-log.md:21` | 逐字取旧失效行：步骤 4 至 15，保留 1 至 3 | 预写测试前 |
| `quality/evidence/build-plan/testing-blueprint.md:199-227` | 锁定受控与真实事件取证差异 | 验收前 |

## 每个文件由谁改，先做什么？

先核已纳入的共享检查器及前三段技术交回，再窄扩同一失效行和报告。
暂无新增生产文件或数据存储；未来实施写集如下。

| 精确修改路径 | 动作和唯一写主 | 消费者与交回顺序 |
| --- | --- | --- |
| `workflows/make-decision/SKILL.md` | 阶段 4 写主扩第 9 步的失效行写法 | 阶段 1 交第 9 步，阶段 5 接讨论；不动已交分诊 |
| `skills/decision-log/templates/decision-log-template-v2.md` | 阶段 4 写主给既有变更新增字段示例 | 阶段 2、3 依次交四态和验收槽，阶段 4 保留两者 |
| `tools/cli/check-stage-steps.mjs` | 阶段 4 写主在 `invalidatedSteps` 与报告投影读新字段 | 已纳入的共享版本为底座，阶段 5 后写报告 |
| `tests/contract/check-stage-steps.test.mjs` | 本 Task 预写测试作者先持目标断言；冻结后实施者只读 | 现役合约→本阶段冻结测试→阶段 5；后手不得改本阶段冻结断言 |
| `specs/delivery-quality-direction-requirements-20261122/decision-log.md` | 仅材料主会话在真实改向时追加关系与同一失效行 | 阶段 2、3 先交决定与覆盖落点；阶段 6、7 只读 |

每个前写主交实际路径、当前基准和受影响字节；冲突返回该写主。
前件读不到就记 unknown；不得把它作为另一作者的已交写权。
禁止修改 `workflows/build-plan/SKILL.md` 与 `workflows/build-plan/steps.json`。
2026-11-23 实读其 `version: 4.2.0` 与 `schema_version=2.0.0`、`stage_slug=build-plan`。
其正常接包归任务一，长期施工改卡归任务三；归档旧失效行也只读。
后续生产实施不写自身冻结断言；无实际权限隔离则如实披露。
进度只读任务事实库 `facts.jsonl` 的现有游标，不落在本文件。

## 怎么验证？

用同一命令检查旧行、新行、缺字段和未触及项；真实接手另读原件。
`oracle` 是事先固定的判定依据；RED 与 GREEN 是同断言改前失败、改后通过。

```sh
npx --no-install vitest run tests/contract/check-stage-steps.test.mjs -t "invalidated line fields" --no-cache --reporter=verbose
node tools/cli/check-stage-steps.mjs --stage=make-decision --task-path=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-direction-requirements-20261122 --material-root=/Users/Hugh/Hugh/Project/workflowhub-delivery-quality-direction-requirements-20261122/specs/delivery-quality-direction-requirements-20261122 --json
```

预写具名断言：去掉新行「标注人」且无对应报告缺口必须失败。
正例用独立预期核六个标签；缺接手人、无失效行、邻项不变各有对照。
旧行仍待重做；未知阶段或缺阶段的数字不得跨推，旧退出语义保持。
从当前已纳入的共享基准运行改前测试；仅目标断言失败才记 RED。
夹具、环境、导入、配置或未收集目标例另记；真已通过保基线，不造红。
冻结目标断言和局部输入；同命令取 GREEN 后核冻结字节。
变更冻结断言走同卡既有测试变更请求、独立审查和真实用户答复。

受控临时目录沿 `skills/spec-plan/SKILL.md` 的同进程创建、消费和回收合同。
以认证任务名和用途注册；仅清可再生夹具，业务失败与清理失败分别采集。
原始输出在任务根质量区，由既有捕获保存；不删除、覆盖或复制历史原件。
公开命令的退出码仍依既有路径；真实事件不能靠报告退出代判。
`--task-path` 取认证任务库，`--material-root` 取同任务工作树规格目录。
`--stage=make-decision` 选步骤，`--json` 读取 `supersede.invalidated`。
现役 `invalidatedSteps` 保留阶段、步骤与范围。
`supersede.invalidated` 当前只列步骤与范围。
标注人、受影响位置、接手人等只补到原报告，不新增退出判据。

若旧行报错、邻项误伤或报告缺字段误改退出，停该分支。
原写主只撤本阶段解析、投影和失效行写法的实际受影响改动区块。
回退基准为本阶段接手时的上游交回字节；保同文件其它增量及原失败。
恢复后只复跑该定向组和相关合法例；需改方向或验收才回原决定人。

## 下一消费者拿什么继续？

独立审测回报后，按 build-code 方法第 9 步写逐条结论并做技术收口。
验收 5 技术版本经独立判定和正常审后提交，即可携原件、基准交阶段 5。
真实变更未发生，验收 6 同时记 `unavailable`、提供者及恢复条件。
阶段 5、6 等技术交回，不等验收 6；收口不冒「阶段全部验收通过」。
阶段 6 仅在真实变更发生后按实际卡版本交实读、改文，原读者再判验收 6。
共享文件交回后，不为补事件并写；材料仍由原主会话独写。
阶段 7 只引用本地首判、真实变更读回或未发生缺口，不在末段代验。
写序如上；真实改向尚未发生，不预填新旧决定、改文或读回。

## 每张任务卡怎么写？

本阶段以一张纵向卡交付失效行、现有报告和接手证据。

### 任务 4：让失效行说明谁接手

为什么做：旧记录能让步骤待重做，但不能告诉首卡作者该改哪段。
交付什么：旧行照常、新行提示缺口、接手人能沿来源定位实际改文。
不做什么：保人工标记、历史行及既有检查器退出语义。
前置：取前三阶段技术交回，不等其未齐的真实首判通过。
检查器用当前已纳入版本，不另等任务一。
怎么做：先固定公开报告断言，再窄改 `invalidatedSteps` 和现有投影。
怎么验收：同命令红绿；真实事件用附录 A 的实读加改文对照。
证据：旧新行和报告分别留原件；字段测试不证明发生过真实改向。
下游（含何时停）：技术交回不一致回原写主；无真实变更不造改文。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T004
- **来源 / FR / AC**: R-002、R-003、R-005、R-009；决定 4；FR-CHANGE-001、FR-RETIRE-001；AC-P4-001、AC-P4-002。保旧决定和人工标记，真实改向只重做受影响条目并留下实际改文。
- **输入**: P1/T001 已独立审测的第 9 步技术版本、问答落点与具名未齐读数；P2/T002 原话与承诺技术版本、P3/T003 覆盖技术版本；当前已纳入的共享检查器；归档 c06 第 21 行；真实事件由主会话及发起人提供，P6 独立作者后供改文。
- **文件 / 符号**: `workflows/make-decision/SKILL.md` 第 9 步；`skills/decision-log/templates/decision-log-template-v2.md` 变更槽；`tools/cli/check-stage-steps.mjs` 符号 `invalidatedSteps`、报告投影；`tests/contract/check-stage-steps.test.mjs` 目标组；`specs/delivery-quality-direction-requirements-20261122/decision-log.md` 既有决定与失效行。
- **动作**: 在目标组先钉报告和退出语义；先解析阶段及重做范围，再读取中文分号分隔的新标签，值不含分号。保原范围匹配。真实 supersede 时材料主会话保旧正文及双向指针，再追加同一失效行。
- **输出 / 失败**: 现有报告给字段和缺口，缺字段不新增非零；真实事件可复读，缺真实事件或改文不称完成；同进程 finally 只清可再生夹具。
- **边界 / 禁止改动**: 冻结目标测试与评分、规格判据、归档旧行、任务一入口及任务三施工规则；不自动推导、不迁移、不建账本。
- **依赖**: blocked_by P1、P2、P3；只等实际技术交回，不等未齐真实首判。共享检查器已纳入，不另等任务一来源。真实事件的首卡改文是验收供件，不是开工前置。
- **测试层级 / 技能**: `feature`；backend-testing；CLI 合约真实接缝与独立人读；无 UI、数据库、在线服务或新增 schema；命令见本阶段验证。
- **场景 / 夹具或服务**: 原 c06 行、完整新行、漏标注人与接手人、未知阶段、无失效行及未失效邻项；两落点对照只漏第二处；真实路径抽掉改文；受控临时输入按同进程约定回收。
- **RED/GREEN 门禁命令**: `npx --no-install vitest run tests/contract/check-stage-steps.test.mjs -t "invalidated line fields" --no-cache --reporter=verbose`
- **预期退出码**: RED nonzero; GREEN 0。仅报告级缺口不改变公共命令原有退出语义。
- **RED 目标失败**: ORACLE-INVALIDATED-LINE-FIELDS；新行缺标注人未报告这一具名断言才是目标失败，非环境、配置或未收集。
- **GREEN 判定器**: ORACLE-INVALIDATED-LINE-FIELDS；同输入按阶段读全、旧行仍待重做、缺项只提示且邻项保持；真实变更由 ORACLE-REAL-CHANGE-HANDOFF 逐处复读，拒绝只改第一处。
- **证据**: RED unavailable — 共享检查器底座已纳入；新字段目标断言尚未预写及执行，本轮只改计划；计划 `quality/tests/p04-invalidated.red.output`、`quality/tests/p04-invalidated.green.output` 与 `quality/tests/p04-real-change.readback.md`，以实际 capture 为准。
- **覆盖上限**: 报告不能证明一次真实改向，也不证明自动失效或长期接卡能力。
- **停止 / 恢复**: 实际技术交回冲突退原写主；旧行或退出语义回归只撤本卡解析增量并复验；真实事件未到由主会话等真实新决定；改文失败回阶段 6，改 AC 或方向回原决定人。
- **完成**: 前置（不作完成条件）：定向命令及退出有真实读回。完成条件（只写效果）：独立核旧行、责任与不误伤邻项；真实事件由独立读者核实读和改文，缺事件只保本条未完成，不阻技术交回。

## 机器字段（校验器用，人可跳过）

- **全局规格**: `spec.md#实现设计全局权威`
- **写入集**: `workflows/make-decision/SKILL.md`；`skills/decision-log/templates/decision-log-template-v2.md`；`tools/cli/check-stage-steps.mjs`；`tests/contract/check-stage-steps.test.mjs`；`specs/delivery-quality-direction-requirements-20261122/decision-log.md`
- **依赖**: P1、P2、P3
- **消费者**: P5 同包讨论；P6 独立计划作者；P7 整链验证者
- **gate_cmd**: `npx --no-install vitest run tests/contract/check-stage-steps.test.mjs -t "invalidated line fields" --no-cache --reporter=verbose`
- **oracle**: ORACLE-INVALIDATED-LINE-FIELDS；真实事件另按 ORACLE-REAL-CHANGE-HANDOFF
- **evidence_path**: planned: `quality/tests/p04-invalidated.green.output`；`quality/tests/p04-real-change.readback.md`
- **STOP**: 技术交回版本冲突停受影响文件并退原写主；真实事件缺失停改文首判；退出语义回归回 P4，材料回主会话，卡回 P6；改方向或验收回原决定人。
- **覆盖 AC**: AC-P4-001、AC-P4-002
- **Done**: 前置（不作完成条件）：具名命令、原始输出与退出读回。完成条件（只写效果）：AC-P4-001 以兼容及反例原件判并按方法第 9 步交技术版；AC-P4-002 逐处实读并核实际改文，真实变更未发生时 unavailable，不挡技术交回。路径见本块，均非实际通过声明。
