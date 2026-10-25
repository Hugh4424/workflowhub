# AGENTS.md

通用 AI 助手的 workflowhub 身份与规则。

## 项目身份

- 名称：workflowhub
- 定位：供命令行 AI 助手复用的开发工作流编排工具。
- 构建基准：本仓库的设计宪法 [CONSTITUTION.md](CONSTITUTION.md)。

## 给 agent 的规则

- 改动须符合宪法，逐条对照 [constitution-checklist.md](constitution-checklist.md)。
- 已授权 build-code/verify-code 自动实施、验证、审查、修复及必要 Git 交付，不重复日常确认；动作前读 [标准工作方法“当前路线”](docs/standard-workflow.md#当前路线) 的持续授权、record/consume 与 HEAD 条件，最终 close 依其唯一范围确认和安全收口边界；无法修复/验证的部分保真，不自动接受严重风险。
- 重活交子代理，主上下文只收摘要。
- 全仓 grep、测试/RED/GREEN、多文件对标、反向引用扫描默认由子代理执行，主上下文只收路径、exit_code、结论清单；一两行可讲清的微动作除外。
- 技能可独立调用、搬运，不绑定单一宿主。
- 质量裁决由独立来源、独立上下文产出，禁止自判。
- 不整份继承父代理上下文：派发记录写明继承模式，只附原文摘要 ref、sha256 与不超过 500 字摘要。
- 不空转轮询：不以远小于任务耗时的固定超时重复空转调用；派发按工作类型，回传结论与清单，修复回原实施子代理同一会话。
- 写共享文件前，读 `skills/simplicity-guard/SKILL.md` Packet lens并发/简化问题，核真实状态、前后writer及现有锁/独占；同文件不同字段仍共享，提示中的“别撞”不代结构性串行。按最小有效路径复用唯一权威，不新建协调状态。
- 跨 Phase 只核本 Phase 声明写集，不绑全量快照；写集说明须交代改了什么、故意没改什么及理由、风险与影响面，独立审查按真实 `git diff --name-only` 逐条比对，不实记事实、不作门；内容细节读 [stage-handoff 信息来源](skills/stage-handoff/SKILL.md#信息来源)。
- 交接动作项只列用户独占决定、授权、不可逆动作或只有用户能提供的信息/凭证；逐项给推荐、理由和不答后果，代理可做的授权内工作继续执行，细节读 [stage-handoff 信息来源](skills/stage-handoff/SKILL.md#信息来源)。

审查派发及结果回读实际执行 `skills/wh-review/SKILL.md`「输入与方法」「输出和失败边界」；独立执行者据ARTIFACT + CONTRACT及真实原件判断。

### 用户可见输出

先给结论、短句、主动语态、一次一个动作、不用术语与内部编号、非用不可当场解释；默认读者是没读过本项目且注意力有限的人。提问、复述与交接沿 [Talk用户可见的说话方式](skills/talk-with-zhipeng/SKILL.md#用户可见的说话方式)，内部材料与机器字段保持原合同。

### 派发与回传

派发说明（brief）写四要素：目标、边界、输入引用、可检查结果；其中目标、边界、输入引用指向 `workflows/build-code/SKILL.md` 的「Task graph 与 context pointers」，一句引用不复述全文。另写三处：可检查结果（本次要核对的产物、命令或事实）；任务重点靠后（本次目标、当前失败或文件、允许写集放在末尾贴近生成点）；上游结论中继（下游依赖上游时给上游原件路径与最小必要结论，不整份粘贴）。篇幅随活缩放：只涉及一个文件且不新增对外行为的改动可压成一段，但仍须含目标、边界、可检查结果与回传形状；超出则完整写。摘要保目标、最新决定、未解风险、当前路径与原件引用；授权、失败边界与证据规则不得省掉。

子代理回传把六项固定写在开头，正文随后且不重述状态：任务；结论与状态；已做与未做；产物或原件引用；失败与限制；下一消费者动作。研究类另写来源与覆盖（来源到「路径:行号」，覆盖分列查了／没查／为什么）；实施类另写改动路径、命令与退出码。任何未取得字段在该位置写「未取得」及真实原因，不留空、不删字段、不用占位。状态词沿用既有语义（可用／部分／不可用、未取得、不适用），不新增枚举或运行时状态。取消时在「已做与未做」写真实界线；有效问题回原实施子代理同一会话修复，原会话不可用如实披露；说明缺可选事实时，已能安全执行的部分继续并记明所缺。

进入面纪律：派发与回传只给指针与结论，不复述材料原文，不重复读已读过的内容；事实外置成可回读原件，回传给原件指针；主会话不自行压缩自身上下文，也不以容量百分比触发。

### 测试硬规则

- 只跑受影响针对性测试；禁止全量回归：禁止无范围地跑全量 `vitest`、`npm test` 或 `test:safe`。
- 例外只有用户或 CI 守卫明确要求；例外命令必须在执行证据中写清原因和范围。
- 依据：[docs/standard-workflow.md](docs/standard-workflow.md) 的 build-code 测试与质量段；本条是执行纪律，不是新的 stage、gate 或质量结论。

核测试/检查读数时读 `workflows/verify-code/SKILL.md`「测试充分性与检查可信度」；设计oracle/替身或分类候选时读 `skills/backend-testing/SKILL.md`「行为测试与证伪」「执行事实」。

### 证据硬规则

- 保存或复用证据前读 [标准工作方法“证据只留原始件”](docs/standard-workflow.md#证据只留原始件同字节即同一事实)：执行同字节唯一原件、内容比较与未知保新件规则。
- 禁止把整棵工作树或整个目录作为证据保存（禁止目录快照、整树 tar、`git archive` 产物、文件树清单）。 整目录保存＝新写出的证据件的直接子目录里存在完整包含某个既有目录全部文件名与字节的集合；每个文件各自都是某条真实事实的原始件不算快照。
- 范围证据、留字节三类例外、历史及已引用原件保全沿同节，不删不覆写。
- 本节只约束证据执行纪律，不新增 stage、gate 或质量结论。

### 卡住与升级

- 卡住时必须先把话说明白再停：用日常语言写清「现在卡在哪、为什么不能继续、有几条路、每条路的代价与风险」，并给出可以直接回复的选项。
- 阶段缩写、AC 编号、内部值等需材料背景的术语不能作为唯一说明。
- 连续无新事实即停重复续跑，按上条报告。
- 一次性草图只在三项同时成立时取事实：两种做法都能实现同一目标、差别只能靠真实运行观察、且不需要真实数据／权限／他人。四类禁用：无分歧、产品偏好、需真实数据或权限凭证、会影响他人或产生不可逆动作；缺任一适用条件就回讨论，不造草图。草图不是可交付代码；「不用计划」「代码质量无所谓」「不用测试」只限隔离、一次性、非生产的草图，不放宽本任务测试或新增授权。
- 草图放在工作树之外的任务库任务目录下、已允许放证据的区域，目录按「日期＋主题」命名；用完不删，不存目录快照。草图目录不含真实凭据、密钥、敏感数据或真实用户数据；必须用真实数据才能观察差别时，归入禁用类不做。交接给草图路径＋sha256，材料留一行「做过一次草图、观察结论是什么」；只带回变体、观察事实、反例与推荐，结论回讨论、由用户决定。
- 依据：[docs/standard-workflow.md](docs/standard-workflow.md) 的 `### stage 结束` 段（R13 人类边界）之后；本条是沟通与停机纪律，不是新的 stage、gate 或质量结论。
- 适用范围：本条只适用于外部依赖的不可重试失败与非受控反馈路径；不可重试类为许可或授权被拒绝、权限不足、密钥或登录失效、输入非法、真实资源或真环境不存在。不可重试失败第一次出现即零重试，立即按上面既有格式报告并给可直接回复的选项，停该外部失败路径，其余安全工作继续；用户给新答复即复位，时间不构成复位条件。
- 排除与前置：审查 provider 不可用、失败、超时、取消、无效输出、零成功路或空 findings 不属于上述停机范围，继续按 wh-review 与 `docs/standard-workflow.md` 既有口径处理：如实记 unavailable／incomplete、不换执行者、保留检测输出与原始失败、其余安全工作继续；不因此限制审查并发或轮次，也不按任何时长停止审查；同一不可用事实记录一次即可。

## 入口文件

- 项目说明：[README.md](README.md)
- 设计宪法：[CONSTITUTION.md](CONSTITUTION.md)
- 检查清单：[constitution-checklist.md](constitution-checklist.md)
- 术语表：[GLOSSARY.md](GLOSSARY.md)
- 五件正文入口与读取时机：[交付与收口总纲](docs/delivery-closeout-charter.md)。
- 唯一进度来源：认证 worktree 的 `specs/<task-id>/` 当前材料与外置任务 task facts；`docs/archive/retired-root-progress/` 只读保留旧任务过程文件，不作为当前进度。

## 项目专业规范索引

最后更新：2026-10-25。各原专业owner维护，consumer为规划/实现/独立验收agent。索引只导航；逐类核实际版本/范围/缺口，不复制规则。

| 类别 | 实质来源与用途 | 时机／owner与consumer |
| --- | --- | --- |
| 设计 | [原八类职责](skills/project-norm-init/SKILL.md#规范职责)、[来源准备](skills/design-source-readiness/SKILL.md)、[页面组件词汇](skills/answer-as-page/SKILL.md#组件词汇与取舍)及[驾驶舱合同](skills/answer-as-page/SKILL.md#当前任务驾驶舱)；结构样式归[原模板](skills/answer-as-page/templates/overview-template.html) | 出页/设计准备；原设计内容owner；make-decision/verify-code页面caller及render-answer-page模板reader |
| 前端 | [组件质量](skills/frontend-component-quality/SKILL.md)、[前端测试](skills/frontend-testing/SKILL.md)、[页面DATA与输出合同](skills/answer-as-page/SKILL.md#依赖与边界)、[回灌安全](skills/answer-as-page/SKILL.md#回灌安全) | 交互准备/验收；原方法/renderer owner；阶段caller与render-answer-page.mjs；导航不改HTML/renderer |
| 后端 | [入口](specs/backend/README.md) → [架构](specs/backend/architecture.md) | 模块/依赖/存储选择前；运行时架构owner；实现与审查者 |
| 接口 | [入口](specs/api/README.md) → [合同](specs/api/contract.md) | public调用/校验/错误选择前；原public owner；CLI/task调用者 |
| 验收 | [入口](specs/acceptance/README.md) → [规范](specs/acceptance/acceptance.md) | oracle/用例准备前；task及质量owner；独立测试/OCR/verify-code |

## 当前目录职责

- `runtime/`：生产运行时；按 `interface/`、`stage/`、`task/`、`evidence/`、`review/`、`adapters/`、`distribution/`、`schemas/` 分区。
- `tools/cli/`：人工或 CI 调用的命令行工具，不承载运行时状态。
- `skills/`：可搬运技能；`workflows/`：五阶段入口；`config/`：配置；`tests/`：跨模块和集成测试。
- `core/`、`scripts/`、顶层 `schemas/`：历史兼容区。未列入 move-map 的文件保持原位，未经证明不得新增能力。
- `docs/architecture/move-map.json` 是本次目录迁移的唯一事实；新增文件必须先登记职责和消费者。
- `node_modules/` 仅为本地/CI 安装产物，不提交、不作为运行时来源。

## 当前治理边界

- 读取认证 worktree 当前材料时，按下文 [vNext 永久实施边界](#vnext-永久实施边界) 区分 post 与 pre/history；旧 task、receipt、review、历史 snapshot 只读保留，不新增 gate。
- 测试、审查、历史、inventory/complexity 只记事实，不作许可证；质量缺失保持 `unknown`/`unavailable`/`incomplete`，不伪造通过。
- 保留 provenance、review 原件及失败；摘要不覆盖来源，provider 失败不冒质量通过。
- 新机制或新控制面必须先登记职责、真实 consumer、owner、测试和删除/保留条件；没有当前消费者的重复控制面不新增。登记作者先真读目标与调用处，写出使用者正在做的具体动作、输入、输出及为何需要；读不到目标停止本次登记并交原 owner，不写 active 猜测。维护者亦用户。
- 改接口前按真实 caller 判断输入是否跨模块边界、能否作一次纯函数判断；通用机制留内部、专用策略留边缘，公共面不暴露 storage/transport/framework 内部表示。判据邻接现有 runtime/interface/runtime-facade.mjs，不另建规范层。
- 当前 WorkflowHub 会话直接执行并发布阶段事实；外部 Stage Agent、bridge、session 或 stage outcome 不是任务推进前置条件。旧 bridge/adapter 只读保留历史 provenance，不得重新成为 active run、reflection、handoff 或 close 的门。

### 当前窄工具与事实职责登记

- 工作区/命令/普通记录/Git授权/锁/回复复用 runtime/interface/ 已有 owner；真实 consumer 见 docs/architecture/move-map.json。工具输出是事实，非阶段许可证；被经独立审查的替代实现承接实际消费者后才退役。
- 审查事实由 review-record-route 单一 producer 保存；调用与回读时读 [标准工作方法“build-code 测试与质量”](docs/standard-workflow.md#build-code-测试与质量) 的 wh-review/OCR、不可用检测、同源补充、原始失败与有效单源发现边界；不换执行者，不以 provider 失败冒质量通过。
- 退役登记保决定、未决项及理由/决定人/来源，供人读交接；不增机器 reader/字段。

## vNext 永久实施边界

- post 的 `make-decision` 允许写读 `decision-log.md`、`spec.md`、纯指针 `phases/index.md` 与索引内独立 Phase；这是对 N6「只许 decision-log」材料边界的显式覆盖，用于轻档在同一阶段完成规格与实施，理由与影响见 [ADR-0051](docs/adr/0051-light-tasks-complete-inside-make-decision.md)。允许集合不改变复杂流程的必需材料或阶段身份。`build-plan` 写承载全局实现设计的 `spec.md`、独立 `phases/P<n>.md` 和纯指针 `phases/index.md`，不双写 `plan.md/tasks.md`；`build-code`、`verify-code` 消费当前材料和 task facts。pre/history 仍按 `decision-log.md/spec.md/plan.md/tasks.md` 旧四材料读取。材料形态变化不新增 stage、gate 或第二套进度权威。
- vNext task 目录只保留 `task.json`、`facts.jsonl`、`quality/reviews/`、`quality/tests/`、`index.json` 及必要的 `quality/evidence/`；C6 规定移除 active `quality/verify.v1` object graph、`product_release` 与 `status_groups`，不创建旧 accepted、run、receipt、review-flow 或独立进度对象。`facts.jsonl` 现有 build-code stage row 可原位保存一个当前 `phase_progress` 游标；现有 `run` 写入、`status` 读取。游标只定位续跑位置，不证明完成、不阻止继续，也不保存历史序列；材料版本变化时读为 stale，代码快照变化本身不使它 stale。`specs/archive/**`、`docs/research/**` 只读保留。
- 禁止 successor/predecessor、selector、snapshot lineage、phase 历史 trace、historical correction、replacement review、reopen、rebind、continuation、recovery、checkpoint permit；旧记录只读，不作为新 task writer。唯一进度例外是上述单行当前游标，不另建 projection 或账本。
- review、test、evidence、history、inventory、complexity 都是事实，不是继续工作的许可证；`unknown`、`unavailable`、`incomplete` 不能阻止同 task 修复，但缺失质量事实不能被宣称为完成。
- public runtime 只有 `doctor`、`status`、`run`、`review`、`verify`、`confirm`、`authorize` 七类；`prepare`、`start-run`、`publish-*`、`record-*`、`recover-*`、`rebind-*`、`phase-*` 只能是私有实现，不能成为公共流程节点。
- reports immutable；M14–M17 只读保留/归档。新增生产文件、命令、schema 或持久对象必须同时写明唯一 consumer、owner、替代关系和删除条件；不得新增双写、永久 compatibility bridge 或 history runtime branch。

规范同步：build-code每Phase收口及verify终末、reflection写经验前、closeout任务收口前实际执行[同一方法](skills/norm-sync/SKILL.md)，已独立验证变化进原专业源/索引；未解判断保原待办，partial/权利/隔离缺口不冒完成。

引用版本、归档绑定、权利或失败/覆盖证据前，先读[KR-EVID-001](specs/acceptance/evidence.md#kr-evid-001--分开版本事实归档绑定与权利)，由验收专业owner维护，catalog/经验判重/独立reader消费；更新2026-10-25。

经验规则退役或完成声明前，读取[KR-DONE-001](specs/acceptance/done.md#kr-done-001--只退出已承接的对应规则)，由验收专业owner维护，经验维护与独立reader消费；只退对应已承接规则，不清未解事实，更新2026-10-25。
