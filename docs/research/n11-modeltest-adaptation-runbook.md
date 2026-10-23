# N11 ModelTest 适配与一次启动

本次实施尚未验收完成。T015/T016 已有目标 RED/GREEN；真实启动在 provider 调用前遇到固定上游身份冲突，没有 summary/attempt，账号与额度仍 unknown。

## 工作区与职责

ModelTest 独占树 `/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022`，分支 `codex/n11-same-condition-eval-20261022`，基线 `50af869f6a38dba6939784b4a34cb3c23b229e95`；main 未改。WorkflowHub 实施树 `/Users/Hugh/Hugh/Project/workflowhub-n11-same-condition-eval-20261022`。

`build-us07-workflowhub-task.mjs` 创建当前 post async task/workspace；`run-us07-workflowhub-cohort.mjs` 读取 provider invocation、execution packet 与 output，不恢复已删桥或退役 run execute；`run-us07-full-fixed-cohort.mjs` 消费 task-input-v2 与显式 `MODELTEST_PROVIDER_SMOKE_FILE`。新增 task input 由 full-fixed 消费；v0.4.0 runner config 由 verify-runner-snapshot 与 P7 维护者消费。它们替代本次运行中的旧 v1/v0.3.0 引用，旧资产只读保留；本任务不再使用时可删除未发布新版本，已发布后按既有不可变规则保留。不改 transport/contracts/schema。

## 配置与路由

任务库 `quality/evidence/2026-10-23-024-p6-modeltest-provider-config.json` 是无凭据的专用 ModelTest 配置。只通过 `MODELTEST_WORKFLOWHUB_CONFIG` 传入；共享 `~/.config/workflowhub/config.json` 不写、不拷贝凭据。真实路由来源与共享配置 hash 在 `025-p6-route-source.json`：`codex/luna → gpt-6-luna / max`。历史计划记 `gpt-5.6-luna / xhigh`，decision-log 只固定通道；同条件基线/候选必须冻结同份当前配置，不能按结果更换模型。

## 重放

环境：`MODELTEST_WORKFLOWHUB_ROOT` 指向被测树，`MODELTEST_WORKFLOWHUB_CONFIG` 指向上述专用文件；`WH_REVIEW_CLI=/Users/Hugh/Hugh/Project/3rd-review/scripts/3rd-review.mjs`、`WH_REVIEW_THIRD_REVIEW_CONFIG=/Users/Hugh/.config/3rd-review/config.json`；不向日志输出凭据。

在 ModelTest 隔离树运行：

```sh
node evaluation-assets/scripts/smoke-us07-provider-route.mjs --providers codex/luna
node evaluation-assets/scripts/verify-runner-snapshot.mjs --config evaluation-assets/runner/workboard-review-queue/v0.4.0/runner-config.json
node evaluation-assets/scripts/run-us07-fixed-stage-cohort.mjs --stage build-plan --providers codex/luna --max-attempts 1 --output-root <全新空输出根>
```

推荐统一使用空格分隔参数。`run-us07-fixed-stage-cohort.mjs` 的 `option` 同时支持 `--stage=build-plan`、`--providers=codex/luna` 等号形式和空格形式；`run-us07-full-fixed-cohort.mjs` 也同时支持两种。`smoke-us07-provider-route.mjs` 则按独立 flag 查找参数，需使用 `--providers codex/luna`、`--out <路径>`。启动还必须显式 `MODELTEST_PROVIDER_SMOKE_FILE` 指向本次 smoke JSON 原件；当前 `quality/tests/2026-10-23-038-p6-current-provider-smoke.output` 是合法 JSON，可直接作为输入，无需拷贝。

smoke 的 `recorded` 只证明 executable/protocol，不证明真实登录/额度。仅一次真实启动可核账号；认证、额度、权限或资源不存在首次即停对应外部路径，不换 provider、不重试到绿；本地 fixture/接口错误按真实根因修复，不冒认证失败。

## 历史执行原件（当时状态，当前输入以末节为准）

任务库 `quality/tests/034/035/036-p6-*.json/.output` 分别记录旧桥、新快照缺失、真实启动缺失三个目标 RED；`039-p6-t015-green`、`040-p6-t016-green` exit 0。`038-p6-current-provider-smoke` exit 0、recorded、semantic_validation=false。`041-p6-real-start` exit 1：`fixed upstream fixture snapshot drift for build-plan`，发生在 provider 调用前；没有真实模型 token/cost，不能记模型成本 0 或账号可用。`044-p6-neighbor-contract` 7/7；`045-p6-neighbor-run-controls` 2/2。

新的 task-input-v2 当前写的是已提交 HEAD tree，不能当成整个 dirty 工作树的源码快照。后续独立审核须区分固定任务输入身份、固定上游 fixture 身份与被测 WorkflowHub runtime 身份；不能把旧 fixture 的 bbbb 占位 tree 改名冒历史真实运行。新增版本化 fixture 提案在任务库独立原件中；独立确认前不改固定输入、不再次启动。

成功时读 `cohort-summary.json` 的 schema、`stages[].providers[]` 的 attempt_id/result_ref/status，以及对应 official result。失败仍保真实原件，不合成 summary/attempt。P6 只做一次 build-plan 启动，不提前 P7 四阶段对照；P7 基线 `3068cfd0`，P8 使用当前 provider。

## 独立技术审后修复：等待原审回读

按任务库 `quality/reviews/2026-10-23-014-p6-fixed-upstream-review-raw.md` 的四项条件新增 `fixed-upstream-n11-v2.json` 与 `n11-modeltest-adaptation.test.mjs`。fixture 保留旧材料字节与 `fixture/fixed-upstream`；`source_identity` 指向原 ModelTest commit/hash，以及用户确认的固定 subject `3068cfd09b421bcfedc0a4e861b05871081c101b` / tree `172c25561e3ddbdf0f03ccfe5bc379abb3838cf8`。用户原件为 `quality/evidence/2026-10-23-058-p7-baseline-user-reply-original.json`。

现在的 task-input-v2 和新 fixture 使用该固定 subject tree，双方不因被测 runtime HEAD 改变输入。未来启动除上述 env 外，必须设置：

```sh
MODELTEST_FIXED_UPSTREAM_FILE=/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/evaluation-assets/test-fixtures/us07-workflowhub/fixed-upstream-n11-v2.json
```

被测 runtime 的 commit/tree/dirty/worktree_sha 仍须在实际调用时另取；这里的固定 tree 不证明 dirty runtime 内容。

observer 不恢复 bridge/旧 manifest 归一化；读取真实 packet 文件并检查 schema、provenance、step/skill 字段、cost 与真实本地 evidence，坏 packet、未完成 packet、host review unavailable 不升级 completed。trace reader 必须看到有效 packet 与真实终态。测试的 provider transport 是受控替身；host-review 负例通过缺本地认证材料在 provider 派发前失败，不构成真实模型审查通过。

公共回执 `073-p6-fixture-observer-red` exit 1；`074-p6-fixture-observer-green-attempt` 9/11，其中合法 evidence 被 macOS `/var`→`/private/var` alias 错判、缺安全启动前打印，两处保留真实失败；canonicalRoot 修复与最窄路由打印后 `076`、最终 `080-p6-fixture-observer-green` 11/11，exit 0。新 snapshot 纳入新 fixture/test；`081-p6-fixture-snapshot-readback` exit 0。计数只代表上述受控行为，不代全 stage、真实账号或模型质量。

原 `full-fixed` 将整个 workspace 复制到 artifacts/workspaces 的副本已取消。执行 producer 在本次 `providerRoot/official-host` 下创建真实 task 与 workspace；当前路径不在临时清理函数中，codex 单次路径没有 resumable cleanup。现有 `output_ref` 改为相对 ModelTest repo 的真实 `stage_output_path`，result/attempt/receipt 使用同一个原始输出；不新增 summary 字段，不依赖已删除的副本。仍只保存具名真实 artifacts，不存整树 evidence snapshot。

冻结源码与原审窄回读完成前不再次启动。041 原失败继续保留，不能把它改写成真实 smoke 成功。

## 用户确认后三处最终 prompt 已应用：待原审回读

用户原话在任务库 `quality/evidence/2026-10-23-126-p6-three-text-and-p9-user-reply-original.json`；同时包含 P9 仅前序完成后实施的条件，本次未提前做 P9。

仅应用 106 patch 三处英文文字；protected source 的唯一变化是一行最终 prompt，逐字 delta 核定在 `133-p6-approved-106-byte-readback.json`。旧 helper、其它 transport 实现、contracts/schema、身份/认证/CLI/取消/重试/隔离与 legacy 义务未修改。

必要新增两例通过真实 `buildOfficialStagePrompt` 核最后 final 段，并用受控本地可执行进程走真实 `invokeOfficialStageAgent → invokeWritableStage` 捕获 stdin/hash；它们不调用模型。128 目标 RED 两例失败，应用同一 106 后 129 同命令两例 GREEN，exit 0；未机械重跑已保存的其它 14 例。v0.4.0 已纳入本次确改的 provider-transport，130 快照校验 exit 0。

当前 v2 不再承诺本路径会执行 host review/publication；host-owned 真实未执行状态仍 unavailable/incomplete，不能靠改状态或隐藏 row 求完成。旧 041/085 模型前失败原件保留；本地测试不能证明账号/额度。本轮原独审窄回读前不再启动真实模型，下一次使用全新空输出根并重新记录实际 runtime dirty 内容身份。

用户额外四段文字真实授权见 `quality/evidence/2026-10-23-145-p6-four-text-user-reply-original.json`；完整142 patch SHA256 `c290f65a00ca9d84770a611fb7c5f3bc1aba28dcb7a3a45e96cf079ec607b74e`。仅四字符串文字，106 final不变；不扩执行协议/身份/隔离/认证/CLI/重试/取消或其它transport。当前输出按复制procedure的spec+独立Phase+纯指针index消费；固定历史输入与当前输出分开，不以旧plan/tasks通过冒当前符合。真实v3失败保留131，usage unavailable不补0，未重试。

## 当前统一输入与输出（全链修复，待独审）

同一`fixed-upstream-n11-v2.json`现含原历史stages（逐字保留）与明确author current_materials；新作者材料来自公开原需求/固定回复/API/UI源，非历史模型生成。实际current调用显式选同一author源物化accepted upstream及canonical材料；不把旧泛评测plan/tasks改名冒Workboard计划。make-decision消费原始需求/回复，build-plan消费产品spec，build-code消费同一spec/index/P1三任务；所有执行结果仍待真实生成。

current build-plan输出`spec_ref`、`phase_index_ref`、非空`phase_refs`，精确对应task canonical spec与index全部Phase（顺序/集合一致）；真实WH validatePostPhaseContract检查FR/AC/依赖/oracle。物理读回和保存展开每个数组成员，trace消费同一来源的实际正文事实，不以ref非空证明验收。新字段不标作旧stage-output-contract.v1通过；旧契约/旧schema原字节不变。

verify-code双方固定输入公开Workboard v0.2的server/package/public三文件/test/data共7文件，直接物化真实执行workspace；README只引用。其余stage仍v0.1。`workflowhub-fixed-source.json`仅为本次输入来源/公开case映射，原producer保存，不是新增进度权威。source/seed逐文件hash与WH固定tree/真实runtime dirty身份分别记；不保存另一个整目录副本。v0.2旧API/错误语义差异交真实verify发现，输入来源合法不等全部AC通过。

Workboard capability观察真实server/public/test变更；greeting wrapper不能满足。具名测试执行观察必须有真实成功命令及每个公开AC独立case标签的成功行；它只证明命令报告具名case，不证明断言质量或业务AC。current私有scope为provider-owned-build-code-command-evidence，tests.declared_cases_observed仅报告该事实，移除target_behavior_observed与acceptance误称；业务验收归现有Workboard/oracle consumer，当前该observer未执行它们。缺命令证据保持incomplete，不从源字符串或provider自写receipt推业务通过。hidden oracle身份和覆盖职责见153，正文不进provider输入。

本轮新增public目标RED132（旧refs）、133（四提示词）、135（bundle/Workboard）保留；134第一项TypeError只作setup/诊断，不冒目标RED。后续GREEN/snapshot由真实回执补，当前不预填结果。


052唯一OCR四项有效发现处置（053/054独立技术/TCR批准）：smoke须全局recorded且每个selected provider恰一条recorded，负例受控计数零外部调用；provider packet的host-owned completed无独立host来源即拒；input_refs保空数组语义、逐文件realpath限定workspace并核存在/普通文件，不能冒读取证明；TAP SKIP/TODO不算具名已执行。原“全host自报completed可成功”的旧测试oracle按192/054收紧，原16字节因该批准变更不再声称不变；原helper、AUTH_REQUIRED、HTTP真实断言与fixture正文保持，195保修改前源。最新定向156为8/8 exit0，不冒当前全量通过；唯一OCR原052及失败/覆盖限制保留，不重派追绿。


2026-10-23 portable范围例外（用户答复224；精确patch220/独审059）：本任务允许现distribution owner与MD files声明修复、现move-map consumer登记和runner-clean-install具名测试；ModelTest现四生产脚本消费同一显式MODELTEST_WORKFLOWHUB_DISTRIBUTION_ROOT冻结host算法，各侧MODELTEST_WORKFLOWHUB_ROOT只给真实source。canonical manifest.ref→binding.procedure_ref→实际prompt，portable附件source根与Workboard业务根分开；root==workspace真实返回`.`。这是106/142之外已获准的metadata路由代码例外，不改两件原文字或身份/认证/工具/重试/取消/超时协议。旧“不改WorkflowHub仓”原句保历史，仅上述四WH路径加现P6/spec/index/runbook为本次精确例外；default public release枚举/政策不扩，MD YAML字节确实改变。原有8个MT文件仍是8个，不扩作者fixturecb01/hidden/contracts/共享auth。新增provider可见附件仅本任务用途获准，许可/附加条款适用unknown继续保留，非取得上游grant/接受新条款。

复制验证只做copied根纯helper/模板结构与相对模块加载，不执行baseline mini-task close/Git/host发布，不把导入闭包冒全部动态宿主操作。基线真实3068 mini-task、候选entry-evaluation分别核suitable/paused；相同host collector、各侧真实source，禁止往baseline注新YAML/export。原v4失败/hostincomplete/usageunknown原207保留，不重写成通过；P7八格未跑。


220落地后必要caller纠正（060 STD-220-1，主owner同路径授权）：cohort的runOfficialWorkflowhubE2E从真实fixture manifest取各stage canonical ref，绑定和invoke及nonfixed prompt共同消费；这是220之外同文件最小delta，不能声称七生产源全字节等220。transport仍仅106+142+220。167的build-spec失败是原HEAD/3068均无旧procedure导致的历史默认5stage不可用，不是本次引入；未改变冻结STAGE_IDS/default行为、不恢复build-spec。当前P6四stage验证始终显式stage；受控E2E只核真实首stage接线，不冒完整历史5stage可运行。

真实执行：160旧物化入口8cell缺模板RED exit1；161/162的/private alias与新test正则setup错保；163八cellGREEN。164本地vitest路径不存在是setup，165既有npx --no-install具名public release/clean-install GREEN exit0。166旧symlink负例可能先撞无关build-prd缺失，不能独自证明目标；已改同validateSkillBundle调用合法pass→只替spec模板为symlink点名失败→恢复原hash再pass。最终170十项exit0含8cell全部纯helper/模板正反、删依赖恢复、包外loader拒绝和symlink目标，以及真实fullfixed/E2E canonical metadata受控接线、原smoke负例0外部调用。受控E2E沿原3attempt，所以总4个本地seam调用/2个真实入口首次metadata检查，不是4个模型请求，不改重试协议。

新snapshot仍37个既有声明分发文件，hash40703ca08de6a2e1ef5801111e06e689bd71d8c57747bdca3976af4f3556c1af；不保存整树证据。P7显式同MODELTEST_WORKFLOWHUB_DISTRIBUTION_ROOT冻结host源码/hash，两侧MODELTEST_WORKFLOWHUB_ROOT各指真实source，同专用config024/authorfixturecb01/smoke artifact及hash；来源方法包各侧字节不同是待测方法差异，不替换共同任务输入。后续真实模型需主会话据窄审GO，当前未重跑。


P6 v5真实终态（239；命令173）：已实际单build-plan/codex-luna/gpt6-luna/max/1attempt执行。CLI childexit2，外层capture未timeout/cancel；transport按原1800000ms hard_deadline发SIGTERM、underlyingexit0/timed_outtrue、PROVIDER_TIMEOUT，零重试。当前JSON shapevalid、四份spec/index/Phase文件存在，但WH内容检查32项失败；734byteindex有ExecutionIndex标题，写集行语法不被现parser接受，不能误称物理缺标题。executionpacket未生成，hostnot_run_by_design/incomplete；usage与成本/余额unknown。复制154源hash全匹配；原stdout截断导致具体模板actualreadunknown，已留procedure/manifest/SKILL真实read事件，存在不冒阅读。真实启动这一项与模型accepted分开，按P6卡T017与spec原文验收，不为模型必胜循环改prompt。

239独立回读另见summary历史fixed-build-spec-v1标签与真实author-current-build-plan不同；此为metadata consumer残留，与timeout/32内容错无已证因果。原v5summary/40703快照及235源身份全部保留不覆写。获准原fullfixed写集内复用selectedSource同时生成bindingpreview与summary，新增真实fixture正例/污染历史label反例的受控zero-model测试：174目标RED→175公共GREEN；旧冻结assert与fixturecb01不改。post-summary新snapshot37 hashfca584fd5fd8b4ce12fd76000597b10b740c189daf5632ce57f07c8aaa554255，供后续P7绑定实际提交及字节；不把新source冒v5运行source，不为此再跑provider。
