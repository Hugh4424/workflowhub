# 标准工作方法

## 当前路线

领域术语读根 [GLOSSARY.md](../GLOSSARY.md)；新增或调整领域词前读 [领域格式附件的 Rules](../skills/grill-with-docs/GLOSSARY-FORMAT.md#rules)。旧术语来源、历史 ADR 引用只读保留。

WorkflowHub 主会话按认证工作区当前材料执行。post 材料为 decision-log.md、spec.md、独立 phases/P<n>.md 与纯指针 index；旧四材料与旧执行记录只读保留。七类公共工具是 doctor/status/run/review/verify/confirm/authorize；run:execute 只更新导航游标，不恢复旧官方 stage pipeline。质量缺失如实 unknown/unavailable/incomplete，不锁修复，也不证明完成。

方向与计划按用户真实答复执行，已有授权有效。主会话组织交互、按工作类型派重活到独立上下文，修复回原实施者，不整份继承父上下文；实现者不自判独立审查或人把关，普通小修不重复全范围审查。

已授权任务进入 build-code 后，自动实施、验证、审查、修复及交付必要的 commit/push/merge；切阶段/会话/handoff 不重置授权，不重问本地提交、日常技术验收或风险承担确认。Phase 实施、针对性测试、独立审查及 finding 修复全完成后，本 Phase 审后提交一次；build-code 终末结束时完成全部提交与合并。authorize 复用真实授权来源，操作前核范围/分支/当前 HEAD 并 record/consume；build-code commit 显式同传 phase=build-code，绑当前 task、分支和阶段，同阶段共用授权；实际 HEAD/每次消费保在既有 consumed 原件，授权原件不改。其它阶段、旧无 phase 记录及 push/merge/pr 仍严格匹配原 HEAD。真正执行关闭时，先按下节核工作区与任务范围，再读 [关闭方法](../skills/stage-close/SKILL.md)第6节「最终归档和清理前一次真实范围确认」与第7节「安全移除、分支删除与逐项读回」；只有取得其要求的最终范围确认才执行归档/删除/交付清理。无法修复/验证的事项如实保留，继续可执行部分，不自行 accepted_risk 或伪造通过。

## 工作区与任务

建任务用 `tools/cli/task-bootstrap.mjs` 的 `--project`、`--task`、`--target-repo`。task id 默认决定同级 `<repo>-<task-id>` 工作区与 `task/<project>/<task-id>` 分支；路径和分支须同时不存在才从目标仓当前 HEAD 创建，同时存在则核绑定，单边存在报冲突。显式 `--workspace-root` 或目标本身已是注册 linked worktree 时沿 existing 工作区及真实分支，不另建或改分支。按返回的 `task_path`、`workspace` 核实际路径/分支/基线；接续用 `--task-path` 打开原任务，核 manifest 身份、cohort 与真实绑定。pre/history 只读，不按 cwd 猜身份或改元数据求通过。

动手前在当前 Phase/Task 申报具体路径/必要符号、写主和允许范围，核认证工作区、真实分支与当前字节；共享文件交唯一写主串行。范围与受保护类别按 [build-code「方法」第1步](../workflows/build-code/SKILL.md#方法)核，审查逐项比对声明与真实 `git diff --name-only`，越界或声明不实照实处置。

收尾按「当前路线」的持续授权及关闭方法第6/7节执行。默认收口已交付任务材料与 task-owned 工作区/任务分支；main 与 existing workspace 保留。未知、私有、未交付字节及旧备忘逐件按该方法保管或确认可弃，保护具名例外，不惯例保留整个已安全交付 worktree；本次执行备忘从创建即用已认证 task.appendRecord({dir,slug,ext,bytes}) 外置任务库（底层复用现有 appendRecord）。默认策略不代当前删除确认，也不解除另有来源的 packet TTL 延期。安全移除、普通分支删除、`--force`／`-D`／强推禁项与失败读回均以该方法第7节为正文，不另设删除器或许可。

真正执行关闭并生成交付说明时，读 [关闭方法第4节「提交、推送任务分支与PR」](../skills/stage-close/SKILL.md#4-提交推送任务分支与pr)的交付说明内容合同；本处只给调用条件。

## build-code 测试与质量

### Phase 三角色与提交点

复杂任务每 Phase 的开发是唯一 writer，审查与测试只读代码、测试与材料；测试经既有 capture 保存回执。完整顺序只以 [build-code「Phase 三角色与七步顺序」](../workflows/build-code/SKILL.md#phase-三角色与七步顺序) 为准：开发完成通知后才派审查与测试，两方明确回报在开发最后确认前汇合，普通 finding 回原开发，修复后受影响方重报。主会话只核无 open finding、无未解释测试失败、Phase Done、AC 齐四项；每轮审后由开发提交一次，迟到 finding 重开同一 Phase、回同一开发，只复验受影响面。最终 Phase 提交在终末审查修复之后，push/merge/PR/归档/清理归 stage-close；本小节不改变审查分级、小改动与普通任务合同。


只运行受影响针对性测试，禁止无范围全量 vitest/npm test/test:safe；例外须用户或 CI 明确要求。源与测试应验证真实效果、失败和取消，假 transport 不能证明实际模型或硬隔离。成功范围只因新变化、失败或未解疑点重跑，不按文件机械增审。

文档面用 wh-review；复杂任务代码面按下节选择一次独立审查执行者，终末整卡固定外部 OCR 全审；小改动与普通任务的审查方式不变。外部 OCR OCR 不可用（命令不存在（ENOENT）或版本低于1.12.9）如实记 unavailable/unknown，不换执行者，保留检测输出与原始失败；版本检测其它错误不推断未安装。architect-code-review 是同源补充轴，独立执行，与 OCR 可用性无关；已装 OCR 失败、超时、取消、无效输出、零成功路或空 findings 均保留原始事实。三审查点保留，真实未执行或不足独立数量保持 unavailable/incomplete，有效单源发现原来源照留。原始失败、晚 raw、取消与来源不被摘要覆盖。

### 三审查点与结论真实性

审查投入按真实范围/大小/影响说明：认证工作区同一具名基准用 `git diff --name-only` 列路径、`git diff --numstat` 分列增删，逐项纳入未提交/未跟踪交付物；二进制等不可量化项记不可核，+100/-100不以净0抵消。按目录职责实读直接 caller/显式 reader，列路径/符号/依据；move-map仅导航，目录名/传递猜测不证影响。

挑审前主会话给三维原读数、直接 consumer 依据及投入理由。依据用户 U-020（`specs/archive/workflowhub-build-code-efficiency-verify-merge-20261026/decision-log.md#f2--wp1-规则例外`）现在启用：这是用户选择、不是代理自行降审；复杂任务每个 Phase 仍审一次，低风险用独立子代理，高风险或影响说不清用外部 OCR。低风险须逐面实读并记录：权限/安全面为无、数据迁移/不可逆面为无、共享状态/并发面为无、公开合同/关键路径面为无、真实外部依赖面为无；同时改动局限单一模块且直接消费者已知有限。三维证据由同一具名基准的 `git diff --name-only` 取路径、直接调用方与关键路径的定向读源取影响、`git diff --numstat` 取分列增删；未跟踪交付物逐项纳入，二进制记不可核，+100/-100不以净0抵消。任一面或范围条件不满足、任一维缺失/不可读/不可核即外部 OCR。其余输入相同时任一维扩增不得更轻，内容类型不免审，同输入同结论；不设数字阈值，不增选择表、动态评分器或 selector。终末整卡固定外部 OCR 全审当前交付，并列声明写集/实际 diff，沿途挑审不替代。选择与记录复用 `runtime/review/review-policy.mjs` 的 `reviewTierFor`、`assertReviewTierRecord`，执行者字样复用 `REVIEW_EXECUTORS`；既有阶段身份校验仍是唯一入口。每次审查正文记录执行者、来源与三维读数：独立子代理给派发身份与隔离上下文，外部 OCR 给 route/provider 原ref和真实终态；子代理不写 `ocr` 身份、不伪造 `provider_results`，OCR 不可用仍保检测输出、原始失败及原执行者。

保三审查点。审查有结论须从原件同时读出：至少一路真实 `completed && parse_outcome === "ok"`、该路发现或空 findings 的原始件引用、未确认项 `material_coverage.undetermined` 与真实 `discarded_facts`（若有；无真实丢弃事实不制造占位）。缺一则报告无结论与原因，三条件齐不表示质量通过。OCR 不可用须同时引用检测输出、原始失败、实际执行者、覆盖限制四项唯一原件及保留位置。`material_coverage.read` 只记可靠已读，`unread` 记明确未送达/未打开；未报覆盖或不可证一律 `undetermined`，不记 `read`。`read_confirmed` 未证保持 `null`／不适用，不新增 `material_coverage` 键。不得以 OCR 身份记 wh-review 结果；schema 版本不是执行者声明。architect-code-review 是同源补充轴，独立执行，与 OCR 可用性无关。字段依据、原件与覆盖事实读 `skills/wh-review/SKILL.md` 输出/失败边界，不增字段/门禁/校验器。

### 专业质量

每个行为风险须有可执行任务与真实 oracle；数量、文件列表、命令字符串不代设计质量。**完成声明的上限 = 独立来源的结论**；adverse/unavailable 时不把未验证部分说成完成；此限制只约束声明，不阻断同任务修复及后续安全工作。

承接 AC 未达成可「带欠账完成」：在 Phase 契约头及 `Done` 显著列每项缺口、所需条件、具名 owner，按 spec 判法与实际缺口记 unavailable/incomplete，不写 pass。这是现有 `Done` 的人读正文，不增状态/字段，不阻断收口、同任务修复及后续安全工作。

每个 Phase 自带开发、针对性测试、独立审查，按本 Phase 承接 AC 与声明测试面核对，收口时审后提交。判断不了影响面时用最小可证伪集合并记录未知影响面。全局重跑仅在改动对象是流程本身且局部无法证明时执行一次，事先说明范围与理由。末 Phase 完整端到端串演只复核沿途逐条结论、补必要未闭环 case，不新增全量重跑；业务、实现与效果 AC 首判归 spec 指定承接 Phase；仅 AC-BOUND-001/002 因依赖完整最终字节在最终边界独立首判，其余不得拖延。沿用既有授权与三审查点，不增 stage/审查点。

### 证据只留原始件（同字节即同一事实）

正常任务先以当前绝对task根及真实project/task identity调用 `openTask`，通过该handle的 `createRecord`、`writeRecordAtomic`、`appendRecord({dir,slug,ext,bytes})` 保存quality原件；命令经 `task.captureCommand`（底层唯一 `runtime/interface/run-command.mjs`）采集，确认/Git经 `task.recordConfirmation`、`recordGitAuthorization`、`consumeGitAuthorization`，都显式传实际cwd。三quality组的每次真实写在现record-lock叶子锁内核实际usage/峰值并发布；不持锁等child，不另建计数账本。通用safe-write/CLI仍可独立搬运，但当前task的方法不以裸工具绕过预算；先证实同字节才复用原ref。超hard保旧件与真实执行/prefix，receipt写不成明确未保存，不造ref、不删旧件凑绿。

raw 测试输出、正式回执和审查原件各一份；同一事实＝字节相同，必要证据区只保存不同字节的事实原件/引用。先做内容比较、确立相等后复用已有唯一原 ref；重跑得到相同字节时不再新写物理副本，裁剪、脱敏或 exit 等使字节不同才新写并说明变化。无法确立内容相等时保留新件并如实记 `deduplication: unknown`，不能用命令相同与字节数一致代替内容比较。禁止复制镜像、整棵目录/工作树快照、tar、git archive 或全树清单；目录保存判据按 `AGENTS.md`「证据硬规则」，各文件各为真实事实原件不算快照。证明范围只写 `路径 + hash` 一行，原始字节留在工作树；例外仅三类：该文件随后会被改动或删除、外部服务返回体、一次性环境读数，逐条说明保存字节的原因。历史原件不重写。需要前后历史字节检查时内存比较，只落实际摘要，不保存目录清单。

复用输出还须命令、退出事实一致；两者不一致、内容改变或候选原件不可读，保本次新件、真实原因及 `deduplication: unknown`。仅用户明确授权该次窄例外，才可处理本次新产、尚未对外引用的临时重复 `.output`：同任务、同目录的 canonical 原件真实可读，命令、退出事实及字节相同，返回仍引用既有原 ref；保留既有原件、历史/已引用输出及每次真实 immutable 原始回执，不删不覆写、不留悬空引用。其它对象按当前任务已确认删件规则处理，扩写受保护实现须另有真实范围授权。正常 reused／unknown 诊断留在现有 CLI 回复与既有 source/evidence；磁盘 native 原始回执保留完整真实执行字段和正确 output_ref，不新增持久字段或 schema。仅真实结算失败进入既有 native error；正常复用/未知不冒失败，不改已发布回执、历史原件、create-only 算法。

C05 事件来源与统计方法：复用当前 task 的 `facts.jsonl` stage 行、审查正式原件、`task.captureCommand` native 回执及宿主已有原生日志；原日志只有合法可读时才消费，不为审计另建事件账本或复制 transcript。facts 是当前事实而非历史事件流，不能用它复算被覆盖的旧状态。命令回执读 `argv`、`cwd`、`exit_code`、`started_at`、`ended_at`、`output_ref`，按实际首末时间给命令区间；宿主事件按实际 session/角色、消息身份、发起/结束及原调用 id 去重，区分正式审查、同源补充与修复复验。共享路径依同一物理文件识别并查先后 writer，字段不同不能当独立文件。

统计时先声明来源 ref、可见窗口与计数单位，再按原事件算派发、消息、轮次和等待区间；重叠区间先求并集，不能相加冒墙钟。墙钟只取窗口首末；命令区间、宿主等待、模型调用各自报告可观测部分，不能用墙钟或调用次数推人工活跃时长、模型延迟、因果或节省比例。缺开始/结束、压缩、模型、provider 或原生 usage 就写 unknown/未取得、影响与提供者，不填零。来源准备由 P2 实施作者提供，实际 C05 分账由 P4 独立审计者读原件复算；原主会话身份/完整日志/真实起点缺失由主会话提供。成本仍只在整个 stage 末沿 stage-reflection 的现入口记录一次窗口，本说明不触发计量、不预填实际数字或审计结论。

#### 每 Phase 一份执行清单

每个 Phase 只多一份人读执行清单，保存于当前任务 `quality/evidence`，Phase 收口原子写、审后冻结；后续用原 ref，不改历史清单。清单投影现有 facts、native 回执与原件，不能成为续跑读取的第二进度或第二账本。

清单字段固定为 `phase_id`、`task_ids`、`cursor_ref`、`commands`、`failures`、`diffs`、`evidence_refs`、`materials`、`reviews`、`acceptance`、`cost`、`final_chain_ref`。`commands` 列实际 argv、cwd、exit_code、started_at、ended_at、duration_ms；`failures` 列 failure_signature 与 original_output_ref；`diffs` 列真实 git diff --name-only 路径、--numstat 分列增删及原件 ref；`evidence_refs` 列原 ref、bytes、sha256 与保留原因。`materials` 只列实际打开的路径/锚点及用途，缺件写用途与提供者；`reviews` 指向真实独立原件；`acceptance` 逐条回原 AC 档位及缺口。独立审查按实际 diff 和材料读取记录逐项核写集，未取得不猜。

原始字节沿上文三类例外和证据规则保存。相同调用再次运行且退出事实一致时，用既有 `resolveOutputRef` 实际比较字节，相等才指回首次原件；native immutable receipt 保留正确 output_ref，不能删已引用原件。字节不同或候选不可读则保新件，记 `deduplication: unknown` 与原因。成功且无保留必要的输出不额外放进清单证据指针；不为每个命令再写一份人读清单或复制 native 输出。

`cursor_ref` 只指向 facts.jsonl 现 build-code 行的 phase_progress；五字段及合法原位覆盖沿原 task-store，CLI 同 Phase base_head 继续沿原 caller 规则，不新建历史序列。`cost` 只引用真实 stage 末那笔账本行与窗口，Phase 中尚未发生写 incomplete、原 owner 和恢复条件，不提前 --record。`final_chain_ref` 由最后 Phase 引用一份真实十环报告；尚未产生保未取得，不预填通过。

### stage 结束

主会话复用已有记录接口、安全写入普通 stage facts，不恢复 run:execute 完整官方门。分别读回实施、质量、Git交付、物理清理；局部 GREEN 不冒全任务完成。逐 AC 据实际交付与证据判断、保缺项；唯一新的人读 handoff MD 给绝对 ref 与实际下一阶段，旧原件 immutable。最终 close 依「工作区与任务」及关闭方法第6/7节回读各项实际结果；质量 incomplete 的声明与清理范围授权分别保真。

同一失败反复或一轮没有新事实时，按 `AGENTS.md`「卡住与升级」的四类分诊与三检查先停重复动作，再自动换路径继续；无新事实不是完成，不设次数或时长上限。该节是三类停与外部不可重试零重试的唯一处置来源；只有其中用户独占阻塞才问一次，其余缺资源记 `incomplete` 并继续安全工作。需用户决定时说清阻塞、原因、路线及代价，避免用内部编号作为唯一说明。新事实须改变继续条件，包括新答复/输入、新可取结果、不同失败信号或写集/依赖变化；同失败信号多写一份不算。未取得的答复、provider失败或许可不能靠时间流逝当同意。用户给新答复即复位，按当前材料续跑；时长本身永远不构成停止条件，时间不构成复位条件。审查 provider 各轴仍按该节排除行继续既有审查工作。
