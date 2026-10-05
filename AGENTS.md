# AGENTS.md

本文件给通用 AI 助手（任意命令行 agent）提供 workflowhub 仓库的身份与规则信息。

## 项目身份

- 名称：workflowhub
- 定位：面向 AI 开发工作流的编排工具，可被多种命令行 AI 助手复用。
- 构建基准：本仓库的设计宪法 [CONSTITUTION.md](CONSTITUTION.md)。

## 给 agent 的规则

- 任何改动须符合宪法，并用 [constitution-checklist.md](constitution-checklist.md) 逐条对照。
- build-code、verify-code 在已授权任务范围内自动实施、验证、审查、修复及执行交付必要的 commit/push/merge；阶段切换和接续不重新申请本地提交或日常确认。Git 动作前按真实授权来源、范围、分支与当前 HEAD 自动 record/consume，不能把 authorize 当提问门。仅最终 close（含归档、删除任务分支/工作区及交付清理）前展示实际结果与范围，取得一次确认；无法修复或验证的部分如实保留，不自动接受严重风险。
- 重活放进子代理上下文执行，主上下文只收摘要（减少主上下文占用）。
- 重读量动作点默认派子代理：grep 全仓扫描、跑测试/采集 RED/GREEN 证据、读多文件对标、反向引用扫描——这些由子代理在其上下文执行，主上下文（工头）只收结论摘要（路径+exit_code+清单），不自己跑。真正一两行能讲清的微动作除外。
- 技能应可独立调用、可搬运，不绑死单一宿主环境。
- 质量裁决由独立来源独立上下文产出，禁止自审自判。
- 不整份继承父代理上下文：派发记录写明继承模式，只附原文摘要 ref、sha256 与不超过 500 字摘要。
- 不空转轮询：不以远小于任务耗时的固定超时重复空转调用；派发按工作类型，回传结论与清单，修复回原实施子代理同一会话。五阶段共用并发区间为 2–5，具体每个任务开几个并发在 build-plan 的当前并行方案里逐任务确定。
- 跨 Phase 不做全量快照绑定：只核对本 Phase 声明写集；声明不实由独立审查用 `git diff --name-only` 与声明写集逐条比对发现，记为事实，不作门。

### 测试硬规则

- 只跑受影响针对性测试；禁止全量回归：禁止无范围地跑全量 `vitest`、`npm test` 或 `test:safe`。
- 例外只有用户或 CI 守卫明确要求；例外命令必须在执行证据中写清原因和范围。
- 依据：[docs/standard-workflow.md](docs/standard-workflow.md) 的 build-code 测试与质量段；本条是执行纪律，不是新的 stage、gate 或质量结论。

### 证据硬规则

- 每类事实只留一份原始件：原始测试输出、正式 review 回执、review 原件各存一份，禁止复制镜像到 `quality/evidence/`。
- 禁止把整棵工作树或整个目录作为证据保存（禁止目录快照、整树 tar、`git archive` 产物、文件树清单）。
- 需要证明改动范围时，只存本 Phase 实际改动文件的原始字节 + 路径 + hash。
- 依据：[docs/standard-workflow.md](docs/standard-workflow.md) 的 `### 证据只留原始件` 段；本条是执行纪律，不是新的 stage、gate 或质量结论。

### 卡住与升级

- 卡住时必须先把话说明白再停：用日常语言写清「现在卡在哪、为什么不能继续、有几条路、每条路的代价与风险」，并给出可以直接回复的选项。
- 禁止把阶段缩写、AC 编号、内部取值或其它只有读过材料的人才懂的词，作为唯一的说明。
- 同一件事连续若干次没有产生任何新事实时，停止自动续跑，把上面这条报告写出来，不重复同一次无进展的尝试。
- 依据：[docs/standard-workflow.md](docs/standard-workflow.md) 的 `### stage 结束` 段（R13 人类边界）之后；本条是沟通与停机纪律，不是新的 stage、gate 或质量结论。

## 入口文件

- 项目说明：[README.md](README.md)
- 设计宪法：[CONSTITUTION.md](CONSTITUTION.md)
- 检查清单：[constitution-checklist.md](constitution-checklist.md)
- 术语表：[CONTEXT.md](CONTEXT.md)
- 唯一进度来源：认证 worktree 的 `specs/<task-id>/` 当前材料与外置任务 task facts；`docs/archive/retired-root-progress/` 只读保留旧任务过程文件，不作为当前进度。

## 当前目录职责

- `runtime/`：生产运行时；按 `interface/`、`stage/`、`task/`、`evidence/`、`review/`、`adapters/`、`distribution/`、`schemas/` 分区。
- `tools/cli/`：人工或 CI 调用的命令行工具，不承载运行时状态。
- `skills/`：可搬运技能；`workflows/`：五阶段入口；`config/`：配置；`tests/`：跨模块和集成测试。
- `core/`、`scripts/`、顶层 `schemas/`：历史兼容区。未列入 move-map 的文件保持原位，未经证明不得新增能力。
- `docs/architecture/move-map.json` 是本次目录迁移的唯一事实；新增文件必须先登记职责和消费者。
- `tools/architecture/`：只读架构诊断与最终证据校验，不进入 Runner/Skill Bundle，也不作为普通推进许可证。
- `node_modules/` 仅为本地/CI 安装产物，不提交、不作为运行时来源。

## 当前治理边界

- 当前工作真相按 cohort 读取认证 worktree `specs/<task-id>/`：pre/history 保留 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 四材料；post 使用 `decision-log.md`、承载全局实现设计的 `spec.md`、独立 `phases/P<n>.md` 和纯指针 `phases/index.md`。post 不生成 `plan.md/tasks.md` 双写。外置任务追踪目录只放 `task.json`、`facts.jsonl`、`quality/`、`index.json` 等执行文件，不新增 gate。旧 task、receipt、review、历史 snapshot 只读保留。
- 测试、审查、历史和 inventory/complexity 只产生事实证据，不是推进许可证；质量缺失保持 `unknown`/`unavailable`/`incomplete`，不能伪造通过。
- provenance、原始 review 事实和失败事实必须保留，不能用摘要覆盖来源，也不能把 provider 失败改写为质量通过。
- 新机制或新控制面必须先登记职责、真实 consumer、owner、测试和删除/保留条件；没有当前消费者的重复控制面不新增。
- 当前 WorkflowHub 会话直接执行并发布阶段事实；外部 Stage Agent、bridge、session 或 stage outcome 不是任务推进前置条件。旧 bridge/adapter 只读保留历史 provenance，不得重新成为 active run、reflection、handoff 或 close 的门。

### 当前窄工具与事实职责登记

- 工作区/命令/普通记录/Git授权/锁/回复复用 runtime/interface/ 已有 owner；真实 consumer 见 docs/architecture/move-map.json。工具输出是事实，不是阶段许可证；被经独立审查的替代实现承接实际消费者后才退役。
- 审查事实由 review-record-route 单一 producer保存；文档wh-review，代码OCR，未装OCR才fallback并保原原因。provider缺失/失败不制造质量通过，有效单源发现不丢弃。
- 退役登记保既有决定与未决项的理由/决定人/来源，人读交接消费，不新增机器reader或字段。

## vNext 永久实施边界

- post 的 `make-decision` 写 `decision-log.md`，`build-plan` 写 `spec.md`、各 `phases/P<n>.md` 和 `phases/index.md`；`build-code`、`verify-code` 消费这些当前材料和 task facts。pre/history 仍按旧四材料读取。材料形态变化不新增 stage、gate 或第二套进度权威。
- vNext task 目录只保留 `task.json`、`facts.jsonl`、`quality/reviews/`、`quality/tests/`、`index.json` 及必要的 `quality/evidence/`；C6 规定移除 active `quality/verify.v1` object graph、`product_release` 与 `status_groups`，不创建旧 accepted、run、receipt、review-flow 或独立进度对象。`facts.jsonl` 现有 build-code stage row 可原位保存一个当前 `phase_progress` 游标；现有 `run` 写入、`status` 读取。游标只定位续跑位置，不证明完成、不阻止继续，也不保存历史序列；材料版本变化时读为 stale，代码快照变化本身不使它 stale。`specs/archive/**`、`docs/research/**` 只读保留。
- 禁止 successor/predecessor、selector、snapshot lineage、phase 历史 trace、historical correction、replacement review、reopen、rebind、continuation、recovery、checkpoint permit；旧记录只读，不作为新 task writer。唯一进度例外是上述单行当前游标，不另建 projection 或账本。
- review、test、evidence、history、inventory、complexity 都是事实，不是继续工作的许可证；`unknown`、`unavailable`、`incomplete` 不能阻止同 task 修复，但缺失质量事实不能被宣称为完成。
- public runtime 只有 `doctor`、`status`、`run`、`review`、`verify`、`confirm`、`authorize` 七类；`prepare`、`start-run`、`publish-*`、`record-*`、`recover-*`、`rebind-*`、`phase-*` 只能是私有实现，不能成为公共流程节点。
- reports immutable；M14–M17 只读保留/归档。新增生产文件、命令、schema 或持久对象必须同时写明唯一 consumer、owner、替代关系和删除条件；不得新增双写、永久 compatibility bridge 或 history runtime branch。
