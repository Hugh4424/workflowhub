# 标准工作方法

## 当前路线

领域术语读根 [GLOSSARY.md](../GLOSSARY.md)；新增或调整领域词前读 [领域格式附件的 Rules](../skills/grill-with-docs/GLOSSARY-FORMAT.md#rules)。旧术语来源、历史 ADR 引用只读保留。

WorkflowHub 主会话按认证工作区当前材料执行。post 材料为 decision-log.md、spec.md、独立 phases/P<n>.md 与纯指针 index；旧四材料与旧执行记录只读保留。七类公共工具是 doctor/status/run/review/verify/confirm/authorize；run:execute 只更新导航游标，不恢复旧官方 stage pipeline。质量缺失如实 unknown/unavailable/incomplete，不锁修复，也不证明完成。

方向与计划按用户真实答复执行，已有授权有效。主会话组织交互、按工作类型派重活到独立上下文，修复回原实施者，不整份继承父上下文；实现者不自判独立审查或人把关，普通小修不重复全范围审查。

已授权任务进入 build-code/verify-code 后，自动实施、验证、审查、修复及交付必要的 commit/push/merge；切阶段/会话/handoff 不重置授权，不重问本地提交、日常技术验收或风险承担确认。Phase 实施、针对性测试、独立审查及 finding 修复全完成后，本 Phase 审后提交一次；verify-code 结束时完成全部提交与合并。authorize 复用真实授权来源，操作前核范围/分支/当前 HEAD 并 record/consume；build-code commit 显式同传 phase=build-code，绑当前 task、分支和阶段，同阶段共用授权；实际 HEAD/每次消费保在既有 consumed 原件，授权原件不改。其它阶段、旧无 phase 记录及 push/merge/pr 仍严格匹配原 HEAD。真正执行关闭时，先按下节核工作区与任务范围，再读 [关闭方法](../skills/stage-closeout/SKILL.md)第6节「最终归档和清理前一次真实范围确认」与第7节「安全移除、分支删除与逐项读回」；只有取得其要求的最终范围确认才执行归档/删除/交付清理。无法修复/验证的事项如实保留，继续可执行部分，不自行 accepted_risk 或伪造通过。

## 工作区与任务

建任务用 `tools/cli/task-bootstrap.mjs` 的 `--project`、`--task`、`--target-repo`。task id 默认决定同级 `<repo>-<task-id>` 工作区与 `task/<project>/<task-id>` 分支；路径和分支须同时不存在才从目标仓当前 HEAD 创建，同时存在则核绑定，单边存在报冲突。显式 `--workspace-root` 或目标本身已是注册 linked worktree 时沿 existing 工作区及真实分支，不另建或改分支。按返回的 `task_path`、`workspace` 核实际路径/分支/基线；接续用 `--task-path` 打开原任务，核 manifest 身份、cohort 与真实绑定。pre/history 只读，不按 cwd 猜身份或改元数据求通过。

动手前在当前 Phase/Task 申报具体路径/必要符号、写主和允许范围，核认证工作区、真实分支与当前字节；共享文件交唯一写主串行。范围与受保护类别按 [build-code「方法」第1步](../workflows/build-code/SKILL.md#方法)核，审查逐项比对声明与真实 `git diff --name-only`，越界或声明不实照实处置。

收尾按「当前路线」的持续授权及关闭方法第6/7节执行。默认收口已交付任务材料与 task-owned 工作区/任务分支；main 与 existing workspace 保留。未知、私有、未交付字节及旧备忘逐件按该方法保管或确认可弃，保护具名例外，不惯例保留整个已安全交付 worktree；本次执行备忘从创建即用已认证 task.appendRecord({dir,slug,ext,bytes}) 外置任务库（底层复用现有 appendRecord）。默认策略不代当前删除确认，也不解除另有来源的 packet TTL 延期。安全移除、普通分支删除、`--force`／`-D`／强推禁项与失败读回均以该方法第7节为正文，不另设删除器或许可。

真正执行关闭并生成交付说明时，读 [关闭方法第4节「提交、推送任务分支与PR」](../skills/stage-closeout/SKILL.md#4-提交推送任务分支与pr)的交付说明内容合同；本处只给调用条件。

## build-code 测试与质量

只运行受影响针对性测试，禁止无范围全量 vitest/npm test/test:safe；例外须用户或 CI 明确要求。源与测试应验证真实效果、失败和取消，假 transport 不能证明实际模型或硬隔离。成功范围只因新变化、失败或未解疑点重跑，不按文件机械增审。

文档面用 wh-review；代码面默认 OCR，OCR 不可用（命令不存在（ENOENT）或版本低于1.12.9）如实记 unavailable/unknown，不换执行者，保留检测输出与原始失败；版本检测其它错误不推断未安装。architect-code-review 是同源补充轴，独立执行，与 OCR 可用性无关；已装 OCR 失败、超时、取消、无效输出、零成功路或空 findings 均保留原始事实。三审查点保留，真实未执行或不足独立数量保持 unavailable/incomplete，有效单源发现原来源照留。原始失败、晚 raw、取消与来源不被摘要覆盖。

### 三审查点与结论真实性

审查投入按真实范围/大小/影响说明：认证工作区同一具名基准用 `git diff --name-only` 列路径、`git diff --numstat` 分列增删，逐项纳入未提交/未跟踪交付物；二进制等不可量化项记不可核，+100/-100不以净0抵消。按目录职责实读直接 caller/显式 reader，列路径/符号/依据；move-map仅导航，目录名/传递猜测不证影响。

挑审前主会话给三维原读数、直接 consumer 依据及投入理由；任一维缺失/不可读/不可核则每 Phase 审。其余输入相同时任一维扩增不得更轻，内容类型不免审。本轮缺同 cohort 真实质量，仍每 Phase 审、不降对照或投入、不增选择表/动态评分器/selector；同输入机械同结论仍未达。终末完整审当前交付，并列声明写集/实际 diff，沿途挑审不替代。

保三审查点。审查有结论须从原件同时读出：至少一路真实 `completed && parse_outcome === "ok"`、该路发现或空 findings 的原始件引用、未确认项 `material_coverage.undetermined` 与真实 `discarded_facts`（若有；无真实丢弃事实不制造占位）。缺一则报告无结论与原因，三条件齐不表示质量通过。OCR 不可用须同时引用检测输出、原始失败、实际执行者、覆盖限制四项唯一原件及保留位置。`material_coverage.read` 只记可靠已读，`unread` 记明确未送达/未打开；未报覆盖或不可证一律 `undetermined`，不记 `read`。`read_confirmed` 未证保持 `null`／不适用，不新增 `material_coverage` 键。不得以 OCR 身份记 wh-review 结果；schema 版本不是执行者声明。architect-code-review 是同源补充轴，独立执行，与 OCR 可用性无关。字段依据、原件与覆盖事实读 `skills/wh-review/SKILL.md` 输出/失败边界，不增字段/门禁/校验器。

### 专业质量

每个行为风险须有可执行任务与真实 oracle；数量、文件列表、命令字符串不代设计质量。**完成声明的上限 = 独立来源的结论**；adverse/unavailable 时不把未验证部分说成完成；此限制只约束声明，不阻断同任务修复及后续安全工作。

承接 AC 未达成可「带欠账完成」：在 Phase 契约头及 `Done` 显著列每项缺口、所需条件、具名 owner，按 spec 判法与实际缺口记 unavailable/incomplete，不写 pass。这是现有 `Done` 的人读正文，不增状态/字段，不阻断收口、同任务修复及后续安全工作。

每个 Phase 自带开发、针对性测试、独立审查，收口时审后提交。末 Phase 完整端到端串演只复核沿途逐条结论、补未闭环 case；各 AC 首判归 spec 指定承接 Phase，不能拖到末 Phase。沿用既有授权与三审查点，不增 stage/审查点。

### 证据只留原始件（同字节即同一事实）

正常任务先以当前绝对task根及真实project/task identity调用 `openTask`，通过该handle的 `createRecord`、`writeRecordAtomic`、`appendRecord({dir,slug,ext,bytes})` 保存quality原件；命令经 `task.captureCommand`（底层唯一 `runtime/interface/run-command.mjs`）采集，确认/Git经 `task.recordConfirmation`、`recordGitAuthorization`、`consumeGitAuthorization`，都显式传实际cwd。三quality组的每次真实写在现record-lock叶子锁内核实际usage/峰值并发布；不持锁等child，不另建计数账本。通用safe-write/CLI仍可独立搬运，但当前task的方法不以裸工具绕过预算；先证实同字节才复用原ref。超hard保旧件与真实执行/prefix，receipt写不成明确未保存，不造ref、不删旧件凑绿。

raw 测试输出、正式回执和审查原件各一份；同一事实＝字节相同，必要证据区只保存不同字节的事实原件/引用。先做内容比较、确立相等后复用已有唯一原 ref；重跑得到相同字节时不再新写物理副本，裁剪、脱敏或 exit 等使字节不同才新写并说明变化。无法确立内容相等时保留新件并如实记 `deduplication: unknown`，不能用命令相同与字节数一致代替内容比较。禁止复制镜像、整棵目录/工作树快照、tar、git archive 或全树清单；目录保存判据按 `AGENTS.md`「证据硬规则」，各文件各为真实事实原件不算快照。证明范围只写 `路径 + hash` 一行，原始字节留在工作树；例外仅三类：该文件随后会被改动或删除、外部服务返回体、一次性环境读数，逐条说明保存字节的原因。历史原件不重写。需要前后历史字节检查时内存比较，只落实际摘要，不保存目录清单。

复用输出还须命令、退出事实一致；两者不一致、内容改变或候选原件不可读，保本次新件、真实原因及 `deduplication: unknown`。仅用户明确授权该次窄例外，才可处理本次新产、尚未对外引用的临时重复 `.output`：同任务、同目录的 canonical 原件真实可读，命令、退出事实及字节相同，返回仍引用既有原 ref；保留既有原件、历史/已引用输出及每次真实 immutable 原始回执，不删不覆写、不留悬空引用。其它对象按当前任务已确认删件规则处理，扩写受保护实现须另有真实范围授权。正常 reused／unknown 诊断留在现有 CLI 回复与既有 source/evidence；磁盘 native 原始回执保留完整真实执行字段和正确 output_ref，不新增持久字段或 schema。仅真实结算失败进入既有 native error；正常复用/未知不冒失败，不改已发布回执、历史原件、create-only 算法。

### stage 结束

主会话复用已有记录接口、安全写入普通 stage facts，不恢复 run:execute 完整官方门。分别读回实施、质量、Git交付、物理清理；局部 GREEN 不冒全任务完成。逐 AC 据实际交付与证据判断、保缺项；唯一新的人读 handoff MD 给绝对 ref 与实际下一阶段，旧原件 immutable。最终 close 依「工作区与任务」及关闭方法第6/7节回读各项实际结果；质量 incomplete 的声明与清理范围授权分别保真。

卡住先说明现在卡在哪、原因、可行路线和代价；只有真实方向改变需用户选择，避免用内部编号作为唯一说明。尝试无新事实则停止重复，不自动续跑空转。未取得的答复、provider失败或许可不能靠时间流逝当同意。 路径必须有界：新事实须改变继续条件，包括新答复/输入、新可取结果、不同失败信号或写集/依赖变化；同失败信号多写一份不算。适用范围与排除按 `AGENTS.md`「卡住与升级」两行：外部不可重试失败零重试、立即按该节格式报告并给可直接回复的选项；其它适用的反馈路径中，同一失败信号在继续条件未改变时再次出现即判该路径无界，换独立上下文重开一次，仍出现则升级问人，owner 是执行者。用户给新答复即复位，按当前材料续跑；时长本身永远不构成停止条件，时间不构成复位条件。审查 provider 各轴仍按该节排除行继续既有审查工作。
