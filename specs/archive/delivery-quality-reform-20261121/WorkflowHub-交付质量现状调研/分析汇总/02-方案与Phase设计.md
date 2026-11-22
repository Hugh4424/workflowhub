# build-plan 怎样先证明一条路径，再决定 Phase 怎么拆？

先找猜错就会改路线的问题，选一个有用的办法解决。
可以单独用的结果放在一起，确实需要等的东西才写成前后依赖。
已有 spec 拥有全局边界和验收；独立 Phase 拥有写主、入口、供件及试测。
这样一个计划能让陌生实施者动手，而不是需要提前理解整个系统。
[原则与分工](00-设计原则与三阶段合同.md)

## 当前的任务划分为什么会让验证太晚才发生？

现行先让用户答大纲，再在第 6–8 步选设计、蓝图、路线和目标测试。
第 6 步已有手工小样方法，位置晚于大纲。T04 内部读口绿，公开 HTTP 一度没有接。
T08 合同文件在 P1 写集中，但 P2、P4 调用的部分符号没交。
真实步骤卡还让第 2 步读取未来的 Phase 索引，第 3 步无条件等用户答复。
文件存在、目录分类或退出为绿无法证明包装器、凭据及实际输入能到达业务结果。
[现行大纲与试测](</Users/Hugh/Hugh/Project/workflowhub/workflows/build-plan/SKILL.md:32>)
· [实际步骤投影](</Users/Hugh/Hugh/Project/workflowhub/tools/cli/check-stage-steps.mjs:1680>)
· [T04 公开入口缺口](</Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/strategy-iteration-t04-init-research-20261115/quality/evidence/build-code/final-aggregate.md:94>)

## 应该增、减、合并哪些动作？

任务 1。第 2 步已有研究。把第 6 步的试跑提前，只在它能改变实际计划时做。
代码已经能回答的问题直接用代码，无需另起服务。
第 1、2 步共享已读的项目源、适用规范和真实消费者，研究追尚未解决的设计问题。
先找实际装配、最窄合法入口与可见结果。有安全可用环境时跑一次。
入口尚待建就用现有最窄接缝或已知样本，说明实际效果仍待哪位提供者。
第 3 步只向用户澄清因此新出现的产品取舍。随后按可演示结果拆 Phase。
依赖边指出生产者、供件、消费时点。共享写点按现有唯一写主定序。
[现有澄清的条件](</Users/Hugh/Hugh/Project/workflowhub/skills/spec-clarify/SKILL.md:69>)
· [Matt 的纵向切片](https://www.aihero.dev/skills-to-tickets)

任务 2。让第 5 步的设计路径真正消费上一阶段选择。
用户已批准沿用现页，直接读现组件、数据映射、状态、错误及重试。
删除该分支默认的新原型和设计答复请求。出现新布局、交互取舍或设计源冲突才用设计流程。
保适用的独立 UI 审和原计划确认。让实际步骤卡和方法同义。
索引从第 2 步产物改为独立卡齐后生成。无歧义时使用现有无需新答复分支。
在 steps.json 与 check-stage-steps 的实际消费中定向验证，保原步骤身份。
[现行 UI 条款](</Users/Hugh/Hugh/Project/workflowhub/workflows/build-plan/SKILL.md:45>)
· [步骤材料](</Users/Hugh/Hugh/Project/workflowhub/workflows/build-plan/steps.json:19>)
· [T08 现页答复](</Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/strategy-iteration-t08-market-update-20261115/quality/evidence/build-plan/2026-11-17-user-existing-ui-wiring-scope.md:8>)

任务 3。把第 7、8 步合成一张 Task 的测试设计与试测，沿已有原件记录。
已知正常输入到达目标、只缺目标条件触发指定失败、装置不可用另报。
风险足够小的纯材料改动直接跑既有结构或独立读回。
现 test-routing-advisor 脚本仅从名称及目录取特征，退回提示职责。
由项目蓝图和实际入口决定测试面。静态分类调用被接手并验证后退出重复执行。
生产者 Phase 的通过条件用实际下游调用证明供件；消费者直接读回同版原件。
就绪表仍证明其会检查的物理事实。持证资源、真实用户答复、合法副作用各用原出处。
[计划试测与独立审](</Users/Hugh/Hugh/Project/workflowhub/workflows/build-plan/SKILL.md:61>)
· [实际分类](</Users/Hugh/Hugh/Project/workflowhub/skills/test-routing-advisor/scripts/route.mjs:4>)
· [窄就绪能力](</Users/Hugh/Hugh/Project/workflowhub/runtime/stage/stage-content-contracts.mjs:777>)
· [下游接口缺件](</Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/strategy-iteration-t08-market-update-20261115/quality/evidence/build-code/P2-README.md:93>)

任务 4。让第 9、10 步的有效发现改变原 Phase 与实施 brief 本身。
已有两路独立审用同一版接缝、反例和供件区分验收与可施工性。
原处置定位修后的任务、命令和供件，实际派发消费已修合同。
第 11 步只读真正变化和剩余缺口。重复研究、试测原件与审查输入按原范围复用。
原流程的真实计划确认依旧消费最终版本，纯工程调整交当前原 owner。
[现行处置与独立读者](</Users/Hugh/Hugh/Project/workflowhub/workflows/build-plan/SKILL.md:73>)
· [T04 处置的真实边界](</Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/strategy-iteration-t04-init-research-20261115/quality/evidence/build-plan/review/dispositions.md:20>)

## 如果任务本身会改模板或检查器，怎样避免先用后造？

先让一张真实下游卡走通当前入口，再定新模板何时生效。
加固任务的计划基线缺开工就绪表。新能力在后段实现，才补回前后段用的卡。
主线已能实际跑开工探针。本案的改进点在计划如何安排新旧切换。

任务 5。改流程的计划明确第一张用新规则的卡，以及卡和读取入口何时都可用。
能先交完整的一小段时，一次完成模板、实际读取和首张卡。
不能先交时，早期卡使用当前有效做法；承接新规则的原阶段负责迁移实际读者。
用原开工入口验证首张依赖卡，确认错填会给具名失败，合法卡能继续。
这次验证替代末段集中补卡和重收证据。历史事实保留原时点。
[现有开工探针入口](</Users/Hugh/Hugh/Project/workflowhub/runtime/stage/stage-content-contracts.mjs:777>)
· [补表后的真实卡](</Users/Hugh/Hugh/Project/workflowhub/specs/archive/execution-quality-build-code-hardening-20261119/phases/P1-skill-loading.md:27>)
· [基线与补表的原件对照](单任务-execution-quality-20261119/v2/04-req-plan.md:84)
· [小段可独立交付的外部依据](../外部调研/16-从作者原则到三阶段工程约束.md)

## 怎样避免把内部默认值当成用户得到的时限？

让同一个公开调用验证它自己的期限是否传到了实际等待。
T13 规格已分前台、短调用者与后台。内部默认两秒不能直接与后台上限十秒相比。
真正有原件的反例是调用者给了 100ms，期限没传下去，下游读等了 517.5ms。
原测试还定位了事务争用。只调大内部默认值，无法解决短调用者的约束。

任务 6。仅在时限会改变工程选法时，把适用调用者和等待场景写进原 Phase 判据。
选同一个现有入口观察三种情形：正常后台、带短期限的调用、有受控争用的等待。
短期限沿真实调用链保留；超时返回原约定的错误。已知不可硬抢占的系统等待单列。
先查是预算没传、实际工作慢还是等待锁，再选择修法。
无需给普通任务增加预算字段。把晚期反复调参换成现有目标测试中的一组对照。
[T13 的原预算约定](</Users/Hugh/Hugh/Project/PaperBuilder/specs/archive/paperbuilder-architecture-t13-order-sync/spec.md:625>)
· [未传播期限及实际等待](</Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/paperbuilder-architecture-t13-order-sync/quality/evidence/build-code/P4/tester-flake-measure.md:88>)
· [先验证真实调用的做法](../外部调研/16-从作者原则到三阶段工程约束.md)

## T04 应怎样设计一个能演示的首片？

| 历史计划的弱处 | 候选 Phase 的表述 | 会区分什么 |
| --- | --- | --- |
| 先写固定响应与内部读口，同一规则迟接公开路由 | 隔离 C2 放入正常来源与已保存快照。停用同一关键来源，在公开 HTTP 读当前理解降级并具名，已保存的原件保持。重启后仍可见 | 旧内部用例虽绿，真正 HTTP 漏接时同用例应红；修后用真实应用口通过 |
| 下游说明写有文件，接口还不可调用 | 由原生产者的目标测试从实际下游使用其契约，用已交原件作为消费条件 | 文件存在但导出缺失时在生产者自己就暴露 |

验收 1。用 T04 历史冻结卡对读旧职责和候选首片。
同一独立读者应在实际计划阶段就定位装配、负责人、写集和失败信号。
已有修后公开入口测试作为正常对照。先分清当前状态和过去保存记录的实际约定。
部署或页面是否需要验，按这次真正要交付的范围决定。
验收 2。用 T01 提前领取竞态与 T05 真预算、队列和 worker 装配对照。
同次任务身份上的正常、错状态、装置失败分别可辨。受控参照保原覆盖上限。
验收 3。下一真实跨层项目从确认稿直接到目标行为，无需补问已答范围或临时扩写集。
如改法只多产文档、重复执行或误触发原型，撤回相应动作。
[修后定向测试](</Users/Hugh/Hugh/Project/PaperBuilder/tests/application/test_strategy_understanding_saved_api.py:642>)
· [T01 独立终末限制](</Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/strategy-iteration-t01-trusted-backtest-20261115/quality/evidence/build-code/2026-11-18-050-p5-final-report.json:84>)
· [T05 真装配正控](</Users/Hugh/Hugh/Project/PaperBuilder/tests/t05_metrics/test_ac006_product_chain.py:5>)

验收 4。下一次改模板或检查器时，实际开启第一张受影响卡。
旧卡无法由新入口正确消费时明确报告原因；可兼容或已迁移的卡走通。
验收 5。下一涉及期限的任务用相同入口区分调用者期限未传和真实等待过长。
合法后台仍可完成，短调用者保持原上限与错误约定。

## 怎样回查改造？

| 编号 | 稳定标识 | 首个消费点 |
| --- | --- | --- |
| 任务 1、验收 1 | choose-plan-from-falsifiable-slice | build-plan 研究、大纲和第一张 Phase |
| 任务 2 | route-ui-from-actual-choice | UI 路径与真实步骤卡 |
| 任务 3、验收 2 | one-test-design-and-rehearsal | 原 Task、testing-system-blueprint、现有路由 |
| 任务 4、验收 3 | dispositions-become-execution | 原处置、修后 Phase 与实施 brief |
| 任务 5、验收 4 | change-template-with-its-first-consumer | build-plan 依赖、Phase 和现开工入口 |
| 任务 6、验收 5 | carry-the-callers-deadline | 原 Phase 判据、公开入口和实际等待 |
