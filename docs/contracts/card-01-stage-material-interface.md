# 当前材料接口

当前 WorkflowHub 主会话按认证工作区的当前材料执行。post 材料为 decision-log.md、spec.md、独立 phases/P<n>.md 与纯指针 index；旧四材料与旧执行记录只读保留。七类公共工具是 doctor/status/run/review/verify/confirm/authorize。普通 build-code 的 run:execute 只更新 phase_progress 导航游标；规划 build-prd 的 run:execute 验证主会话显式提供的步骤结果及其原件，保存 portable 终态记录。两者都不执行旧官方 stage pipeline，也不证明业务或质量成功。质量缺失如实 unknown/unavailable/incomplete，不锁修复，也不证明完成。

材料有缺项或坏路径时明确可见，不用完整性 hash、accepted 或旧认证对象放行工作。跨 Phase 只核本 Phase 真实写集；读写保护原路径包含、单链文件与真实 identity。当前材料版本提交变化时游标 stale；普通代码变化不使游标 stale。

## 两种 run:execute 的生产者与消费者

- 公共入口为 tools/cli/stage-runtime.mjs#stageRuntimeCliMain，委托 stageRuntimeMain。build-code 分支只接收 phase_progress，复用 writeBuildCodePhaseProgressCursor 保存现有单行游标；status:begin/repair 的 derivePhaseProgressStatus 读取它，游标不产生完成或独立质量事实。
- build-prd 分支以当前 decision-log.md 中明确的规划任务类型作为写入条件；producer 为 runtime/task/portable-workflow-run.mjs#runPortableWorkflow，消费 workflows/build-prd/steps.json 与显式 step_results 的逐步原件，保存 quality/evidence/portable-workflow-outcomes/build-prd/terminal 下的普通记录。doctor/status 的 projectPortableWorkflowStatus 读取同一记录。无 input 返回 not-started/ref=null 且不写终态；failed 的 run exit1，成功诊断读取的 exit0 不漂白 failed。

上述调用点见当前 CLI:899、913–944、977–988、1092、1145–1159；portable:42、156–196、227–231。它们是当前调用事实，不是复活旧 task-topology、stage handler 或第二 writer 的理由。

## 七项义务与当前真实消费者

来源分母保留旧蓝图 d1097711:docs/contracts/card-01-stage-material-interface.md 的七个标题；下表给当前等价对象和可证伪边界。旧对象退役不靠恢复实现证明历史已发生。

| 旧义务/来源行 | 当前契约 | producer/owner → 消费者 | 失败边界 |
| --- | --- | --- | --- |
| 任务类型受控值，5–9 | 原始声明来自当前 decision-log 任务身份；规划/普通不靠目录猜测 | 任务创建者/主会话 → readTaskTypeFromDecisionLog → CLI build-prd 写入分支 | 缺失、非法、重复或冲突不默认为规划，也不伪造完成 |
| 类型到旅程，11–16 | 规划 make-decision→build-prd；普通 post make-decision→build-plan→build-code→verify-code，由宿主按当前方法执行 | 主会话/当前 workflows 方法 → 下游材料作者/执行者；CLI消费实际选择的 stage/task | 无机器自动推进；pre/build-spec 旧链与旧 task-topology 只读历史，不恢复 |
| portable 身份，18–22 | build-prd 是规划方法/终态事实，不进入代码阶段或 task-store 正式 stage row | runPortableWorkflow → terminal 原件 → CLI doctor/status、独立规划验收读者 | 缺实际步骤原件不能靠自填 completed；记录 succeeded 也不证明 PRD 语义已获真实确认 |
| 七值状态，24–26 | portable 保 not-started、in-progress、succeeded、failed、unverified、blocked、abandoned | portable stateForStepResults/readLatestPortableTerminal → projectPortableWorkflowStatus | unavailable/incomplete 步骤保失败含义，不变 succeeded；质量缺失与工作状态分开 |
| 材料/执行事实归属，28–32 | post 当前材料由主会话写；facts、review、test/raw由各现有单一producer保存；历史只读 | material-workspace/ArtifactDir → CLI实际材料读取；writeStageRow/recordSimpleReviewRequest/captureCommand → status、发现处置与独立验收 | 缺Phase/坏路径/原件不可读明确暴露；不以旧 plan/tasks、空证据或副本代偿 |
| 安全继续/完成分开，34–36 | 质量缺失允许同task安全修复；实际交付/独立质量/完成另读回 | 当前 spec/Phase/实际执行者 → 主会话、spec-analyze及verify-code消费者 | 文件、游标、review或命令exit0均不单独裁定整个目标完成 |
| 人工边界/不自动重派，38–41 | 方向/计划/PRD按真实答复；Git不可逆动作按既有 authorize；普通发现处置不自动重复已完成审查 | 主会话真实展示/答复 → recordConfirmation；显式review请求 → recordSimpleReviewRequest/原件消费 | confirm只记reply/HEAD/material refs，不解释批准或拒绝、不代不可逆授权；等待/拒绝由宿主方法处理，不推断同意 |

当前角色沿真实调用复用：CARD03的工作包/写集边界由主会话与工作区/范围工具消费；CARD04的验收/失败原件由执行者、captureCommand及独立验收读者消费；CARD05的审查原件由 review-record-route 单一producer和发现处置读者消费；CARD07的同一 decision-log 由单一主会话作者、独立只读 spec-analyze 和后续 build-plan 作者消费。旧 CARD07 D-035 已明确 CARD04 后续只消费，不恢复 aggregate/outline gate 或双writer。这个职责图不等于四卡已通过行为验证；CARD10 P4及独立 verify-code 必须逐义务核实际输入→动作→输出/反例，不给同一 status 文件贴四卡标签。

## PRD 批准来源读回边界

当前 PRD:214–228 区分“确认时展示的原始字节”与“确认回填后落盘字节”。展示139a与回填f055不同是该记录的设计语义，不能仅凭 hash 差异否定旧确认。后续 d271793c→e78c0e41→9ba93e11/当前正文的变化须逐项分类 metadata、具名已批准来源、未证语义；CARD09 R-021/FR58–61增补、旧FR44撤销及资源口径同步的授权来源分别可从当前 PRD:689–698/变更说明与归档CARD09决定读回，不把“57增32删”或提交存在当批准。

每个改变批准范围的语义 delta 要有实际来源与明确适用范围；缺当前全文批准时，主会话先准备当前全文与差异可审展示，再取得该内容的实际答复并用现有 confirm 保原话/HEAD/material refs。当前计划确认不自动代替 PRD 全文确认；拒绝、未答、错版或缺来源保未批准/unknown，不回写旧 outcome 或母PRD。本蓝图只给人读来源与边界，不新增批准判定器、机器 reader 或继续工作许可证。
