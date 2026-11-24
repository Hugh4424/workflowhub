# 交付质量计划任务收口报告

- 任务：delivery-quality-plan-20261123（workflowhub）。
- 判定对象：当前认证工作树交付版本。
- 判定提交：`ec09bb854cf8852e873b5cfbe353f3c58b64b284`（第 1 轮读数；该轮 `git status --porcelain` 5 个路径、未提交。第 2 轮材料更新时 HEAD 已是 `5f233c9c`「feat(closeout): P12 末验、技能去向与收口报告」，本轮只改材料、不提交）。
- 判定日：2026-11-25（Asia/Shanghai）。
- 判定者：P12 实施者（唯一写者）。
- 独立验收：AC-014 已由独立执行者判 pass（附两条登记指针已修）；AC-024 已由同一独立执行者终判 pass（`quality/tests/p12-independent-readback.md:162-169`）；AC-001 由本报告按当前字节独立重判改 pass（依据见逐条表与文末「收口时的缺口处置决定」）。
- 任务库根：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-plan-20261123`。
- 下表 `quality/...` 均相对任务库根；`phases/...`、`skills/...` 均相对认证工作树根。
- 本文件只写收口事实；未提交 Git，未改产品代码、测试、决策日志或既有原始捕获。第 1 轮（P12 收口）只改本报告与 P12 阶段卡；第 2 轮（2026-11-25 收口材料更新）只改本报告、`phases/P1-共用规则.md:221` 的 Done 行与任务库 `quality/tests/p09-independent-readback.md` 的追加节，未改 CI 配置。

## 这份报告回答什么问题？

本次交付整体尚未达成。
二十五项验收里十三项通过、九项未完成、一项不得判、两项推迟、零项待判，零项失败。
下面逐项给原件、缺口、提供者和恢复条件。
AC-014、AC-024 已判 pass；AC-001 本轮按当前字节独立重判改 pass；其余未完成项的处置见文末「收口时的缺口处置决定」。

## 最终结论是什么？

结论是尚未整体达成；已通过项都有当前原件，未通过项都写明了下一步，没有一项被写成无条件通过。

| 结论 | 数量 | 验收项 |
| --- | --- | --- |
| pass | 13 | 001（重判，附冻结测试锁名单残余）、002（附三条限制）、003、004（试点 deferred）、005、006、010、012（有限差分）、014（附两条登记指针已修）、017、018、024、025 |
| incomplete | 9 | 007、008、009、016、019、020、021、022、023 |
| inconclusive | 1 | 015 |
| deferred | 2 | 011、013 |
| 待判 | 0 | 无 |
| fail | 0 | 无 |

交接清单未列 AC-016；P3 首判原文记 `incomplete`，本表按原文补入，未改档位。
AC-014、AC-024 已判 pass；AC-001 由本报告按当前字节重判（`quality/tests/p01-independent-readback.md:38` 判 pass，本轮补齐副本现状与门禁残余）；AC-017 已由原读者出最终判词并计入 pass。

## 这次实际交付了什么？

本段只交登记、投影和收口，不交新业务、页面或运行时控制面。

- `skills/catalog.yaml`：七项本任务实质改动过的技能升 `local_version` 并补 `local_changes`；另把七项既有 `used_by_stages` 漂移按真实调用清零。
- `skills/reuse-registry.md`：补 `decision-maker` 唯一正文链接；四个新技能链接原本已由 P3 接入，本段复核未改。
- `repo-skills.manifest.json`：只跑 `node tools/cli/build-skill-manifests.mjs` 重生成，未手改。
- 四份 `workflows/*/skill-deps.yaml`：只读复核 `unit-kernel`、`phase-maker`、`task-maker`、`run-phase` 的登记与真实时点；四份已齐，**未改文件**，本段未加伪阶段依赖。
- `specs/delivery-quality-plan-20261123/closeout-report.md`：本文件，承接处置矩阵、迁移、弱引用、逐条 AC 与缺口。
- 任务库证据：`quality/tests/p12-gate-readback.json`、`p12-gate-manifest.output`、`p12-gate-consistency.output`、`p12-adjacent-eleven-frozen.output`、`p12-scoped-original.json`。

没有交付：九项未完成项的真实下游材料；`wh-review` 的 detail 轨与 dispatch 同步；任何物理删除或技能切换。（AC-024 的复验 pass 判词已由独立执行者写出，见 `quality/tests/p12-independent-readback.md:162-169`，2026-11-25 由本报告第 2 轮按该判词改判并改计数。）

## 逐条验收结果是什么？

| 验收项 | 结论 | 原件与依据 | 缺口、限制与下一步 |
| --- | --- | --- | --- |
| AC-001 共用规则真正接通 | pass（重判；残余为冻结测试锁名单） | `phases/P1-共用规则.md:221`；`quality/tests/p01-independent-readback.md:38`；`quality/tests/2026-11-24-058-p01-target-green-r4.json`（本日按当前字节人工复跑 14/14、exit 0，未另存捕获，仍引 058 原件） | 本轮按当前字节独立重判：三处副本中两处已改指针（`skills/decision-log/templates/decision-log-template-v2.md:236-237`、`skills/decision-maker/templates/card.md:17,21`）；`workflows/make-decision/SKILL.md:277` 只剩裸格名清单（无逐格定义、验收四件、三档规模），内核 `skills/unit-kernel/SKILL.md:188` 已登记「定义已迁 R6」并带 owner 与移除条件，不构成「重复权威被接受」。残余：两条冻结测试仍逐字锁该名单（`tests/contract/convergence-card-contract.test.mjs:50,108`、`tests/contract/module-convergence-card.test.mjs:25,89`），彻底删除需测试变更请求；重复正文门禁不捕获（`quality/tests/2026-11-24-055-p01-neg2-case2-duplicate-body.output`：放入重复正文后仍 14 pass / 0 fail），回归只靠人读。 |
| AC-002 接手人按字段完成下一步 | pass（三条限制） | `phases/P2-卡片字段.md:219-220`；`quality/tests/2026-11-24-075-p02-target-green-r2.json`；`quality/tests/2026-11-24-091-p02-retest-readback.md` | 限制：① 本任务真实 `prd.md` 真稿未产出，PRD 首件用合法首件代替；② 回执本体不载 `changed_paths` 与「下一步」；③ 阶段空话只在 `check-stage-quality --report` 点名、退出 0，不是阻断门。 |
| AC-003 必带声明命中真实技能与读标记 | pass | `phases/P3-独立审查与强制读取.md:261`；`quality/tests/2026-11-24-100-p03-target-green-r2.json`；读回执 `094-099`、`101-104` | 门禁 exit 0、25/25；六步读回执 `skill_binding.ok=true`；三种单变量破坏具名失败。 |
| AC-004 当天从公开入口看到首卡结果 | pass（试点 deferred） | `phases/P4-计划首卡与供件.md:284`；`quality/tests/2026-11-24-131-p04-target-green-r3.json`；`quality/tests/p04-scoped-original.json`；`quality/tests/p04-independent-readback.md` | `run --action=draft` 持久卡试点 deferred；恢复条件＝有真实方向与授权输入。不把试点 deferred 写成已执行。 |
| AC-005 供件和装配点实际可用 | pass | `phases/P4-计划首卡与供件.md:284`；`quality/tests/2026-11-24-130-p04-first-card-skill-read.json` | 公开首卡三步 `--card` → `verify` → `--current-read-receipt` 复读，7773 B、`5348ba5b…`，`skill_binding.ok=true`。 |
| AC-006 高代价判据冻结前能抓到目标错 | pass | `phases/P5-判据期限与索引.md:297`；`quality/tests/2026-11-24-135-p05-target-green-r2.json`；`p05-target-red-baseline-run{1,2,3}.out`；`p05-ac006-badinput-run{1,2,3}.out` | 基线 RED 三次同集同因；同一坏输入三跑逐字节同因（sha `2017732f…`）。 |
| AC-007 开工人读到写卡现场和未知影响 | incomplete（三缺口：①已补、②③仍未补） | `phases/P4-计划首卡与供件.md:300`；`quality/tests/2026-11-24-126-readiness-p4.json`；`quality/tests/p04-independent-readback.md:127-129` | 精确缺口：① 开工入口已按五列读出（命令、期望、原件、判定方、负责人；`2026-11-24-126-readiness-p4.json` 的 `human_rows` 五键与 `probes` 机读行）✓；② `phases/P4-计划首卡与供件.md:28` 的未知影响（「最大风险和替代」行）未点名具体卡号与验收编号 ✗；③ 开工表缺「首卡行」，写卡现场是开工后取的 ✗。收口时不补写：`spec.md:617` 的失败条明写「拿事后补件当现场」不算通过，收口补写只能记「收口后补记」，补了也不满足当场要求，故维持 incomplete。owner＝P4 阶段卡作者（build-plan 侧）；恢复条件＝该卡作者在下次真实开工时带具名卡号/验收号与首卡行现场取件。 |
| AC-008 只在必要时试跑，索引一次来自实卡 | incomplete | `phases/P5-判据期限与索引.md:297`；`quality/tests/p05-ac008-generate-once.json` | 隔离样本「第六步一次生成、第七步只核」PASS；本轮无真实下游新同仓卡，仍按旧契约头。恢复＝未来新同仓任务在第六步生成唯一索引、第七步只核时取真卡回执。 |
| AC-009 该写才写规划稿，模板首用是真的 | incomplete | `phases/P6-任务分节.md:221` | 缺认证规划试用任务的真实首用与独立读回；门禁 7/7 与「规划稿门槛」文字本身不作通过依据。 |
| AC-010 写集差异可定位且只报告 | pass | `phases/P5-判据期限与索引.md:297`；`quality/tests/p05-behavior-current.log` | 索引声明 3 条、实改 4 条时 `ok=true`，`out_of_scope` 点名漏项，不改错误码。 |
| AC-011 业务期限穿过真实入口 | deferred | `phases/P5-判据期限与索引.md:297`；`p05-target-red-baseline-run{1,2,3}.out` | 缺真实短期限、受控争用、约定超时三组读数；不得用索引检查代判；恢复条件见 P5:174、177。 |
| AC-012 实现五项决定在首卡开工前到达 | pass（有限差分） | `phases/P4-计划首卡与供件.md:284`；`skills/phase-maker/SKILL.md:73-74` | 五项齐；未单独删默认出处与退路做两次差分，记限制。 |
| AC-013 同一入口识别两种合法装配 | deferred | `phases/P5-判据期限与索引.md:297` | 缺固定读口＋仅改装配的两份合法输入及各自原契约预期；恢复条件见 P5:175、177。 |
| AC-014 技能明确去向，现有入口和进度不分叉 | pass（附两条登记指针已修） | `skills/catalog.yaml`；`skills/reuse-registry.md`；`repo-skills.manifest.json`；四份 `workflows/*/skill-deps.yaml`；`quality/tests/p12-gate-readback.json` | 本段读数：两命令 exit 0；`used_by_stages source=` 0 行；catalog 失效指针与 U-012 措辞两条登记指针已修；47 项处置矩阵、三项迁移、五项弱引用、六处登记见下文。独立执行者已判 pass。 |
| AC-015 用户看到具体人话卡和逐卡可验证结果 | inconclusive | `phases/P1-共用规则.md:222`；`decision-log.md:112`；`quality/tests/2026-11-24-057-p01-retest-evidence.md` | 用户本人同次看过同版卡的原件未取得；P1 只判自己采用的互动方法，P4 公开试点归后续。 |
| AC-016 两路读同一对象，一次处置同一问题 | incomplete | `phases/P3-独立审查与强制读取.md:262` | 缺四项：审查者会话 id、同一卡节摘要 sha256、逐字 findings、一路不可用回放。现有 `quality/evidence/p3-review-paths.md` 是宿主转录，不冒原件。恢复＝原决定人决定是否以转录取代原件（改判据）。 |
| AC-017 并发只补就绪包，提问串行 | pass | `phases/P3-独立审查与强制读取.md:263`；`quality/evidence/p3-dispatch-timeline.md`；`quality/tests/p03-retest-readback.md` | 最终判定来自 P3 定向复验在校正时间线后的复判：`p3-dispatch-timeline.md` 的硬时刻对上回执，`p03-retest-readback.md:104-110` 末次判词据此收敛并明写覆盖 `:96` 的 partial；早期首轮读回已被同一读者覆盖。该校验属「软时刻 + 硬回执」混合证据：并发/补位是软时刻，回执是硬时刻。内核 R2 与 decision-maker 并行规则四条子句可读。 |
| AC-018 任务地图、卡与计划消费者一同成立 | pass | `phases/P6-任务分节.md:222-223`；`quality/tests/p06-independent-readback.md:79,84` | 独立回读判 pass：真实归档 PRD 地图→分节→需求反查成立，两坏例点名。反向回读无冻结机器判据，靠人读。 |
| AC-019 分节两路和全文一次各司其职 | incomplete | `phases/P7-任务分节审查.md:192` | 已成立：门禁 6/6；隔离副本两路同卡节 sha 一致；一次处置；全文审只加跨卡。缺真实 PRD 同次调用内的两路原件与一次处置 + 全文跨卡原件。 |
| AC-020 目标断言先失败，公开演示有真实结果 | incomplete | `phases/P8-代码红测与演示.md:189` | 已成立：门禁 GREEN 7/7；基线 `f3900688` 重跑 5 fail/2 pass；公开入口真实输出与回执 8289 B、sha `6e8307e3…`。缺首卡端到端持久与消费者读回。 |
| AC-021 独立复验后才由开发提交 | incomplete（①③仍缺，②已补） | `phases/P9-代码独立收敛.md:192`；任务库 `quality/tests/p09-independent-readback.md`「审后提交身份补充」 | 已成立：门禁 9/9；九份冻结 97/97；两方汇合 8/8 早于提交；晚发现回原 Phase。② 审后提交身份已补＝`cb89011a`（`feat(convergence): P9 两方独立回报与晚发现不另开阶段`）。仍缺：① 审查侧 finding 原文入库（原会话不可取，需原决定人决定是否以转录取代）、③ 外审不可用对照（可补但被①挡住）。 |
| AC-022 下游取得同包真实答复 | incomplete | `phases/P10-方向交付承接.md:185` | 已成立：门禁 7/7；十份冻结 104/104；v2 十一格已引内核 R6；三类坏答具名拒绝。缺：原答时点、包 4/5 直接指针、U-012 双指针消歧、真实首读回执。 |
| AC-023 方向包审与跨包审分开 | incomplete | `phases/P11-方向两路与全文.md:195-199` | 已成立：门禁 7/7；十份冻结 104/104；同源两路与独立异源审写入方法。缺：真实包两路与异源人工读原件、真实首读回执、`wh-review` detail 轨与 `dispatch` 同步。 |
| AC-024 末验核实变化、前置和实际闭环 | pass（独立终判） | `quality/tests/p12-independent-readback.md:162-169`；`quality/tests/p12-gate-readback.json`；`quality/tests/p12-adjacent-eleven-frozen.output`；上文逐条首判原件 | 独立执行者 2026-11-25 终判 pass：25 项皆有可回读结论；AC-017 有原读者带日期的最终判词（`p03-retest-readback.md:104-110`）并覆盖旧 partial；`catalog` 消费者已修（`skills/catalog.yaml:836-838` 只指 `skills/stage-close/SKILL.md`）；门禁复跑 exit 0；`run-checks` 的 `unverified` 与 39 条 unavailable 已进限制。该判词同时要求实施者按判词把本行改 pass 并更新计数——本轮已照改。 |
| AC-025 试点开始前，缺技能和声明分别失败 | pass | `phases/P4-计划首卡与供件.md:284`；`quality/tests/p04-r3-m1-remove-sample-card.json`、`p04-r3-m2-broken-completed.json`、`p04-r3-m3-conflict-contract-gate.log`、`p04-r3-m4-delete-unknown-gate.log` | 缺技能、缺声明各 exit 1 并点名；恢复后同入口 0。M1 机检未抓、人读 fail，记覆盖缺口。 |

## 技能版本与依据是什么？

只升本任务实质改过的技能；未改的 `wh-review` 保持 4.2.0。

| 技能 | 旧 → 新 | 依据 |
| --- | --- | --- |
| `unit-kernel` | 1.0.0 → 1.1.0（已含 P3） | P3 增 R8 审查角色与终审分界及 `references/review-protocol.md`；四入口同批核条号。catalog 已是 1.1.0，本段不改。 |
| `spec-plan` | 1.3.0 → 1.4.0（minor） | P4/P5 增首卡开工就绪、判据成本/期限/资源/范围三账、纯指针索引写入集与同源摘要口径；模板同步。 |
| `phase-maker` | 0.1.0 → 0.2.0（minor） | P4/P5 增首卡纵切六件与三账、真实供件字段与开工五列、未知半径/回读坏返回、索引指针写集不反推。 |
| `task-maker` | 0.1.0 → 0.2.0（minor） | P6/P7 增规划稿门槛、同作者展开与地图即唯一索引、供件拒认、同节两路+同一卡节摘要+一次处置。 |
| `spec-prd` | 1.2.0 → 1.3.0（minor） | P6/P7 增任务卡/子任务六字段、四行验收、地图唯一索引及分节审查指针；方法仍留 task-maker。 |
| `run-phase` | 0.1.0 → 0.2.0（minor） | P8/P9 增第 2–6 步公开入口与可观察结果、第 7–9 步两方回报、审后一次提交、晚发现回原 Phase 和终末边界。 |
| `decision-maker` | 0.2.0 → 0.3.0（minor） | P10/P11 增真实原答与跨包供件读法、一包同源冷读+对抗两路、独立异源审与卡节摘要绑定。 |
| `decision-log` | 1.0.0 → 1.1.0（minor） | P10 把 v2 十一格模板改为引内核 R6、删逐格判据正文，补通用「答复索引只有这一份」读法，U-012 消歧待闭；`SKILL.md` 未动，模板在 bundle 内。 |
| `wh-review` | 4.2.0（不变） | P11 记 detail 轨与 `dispatch` 未同步，但不在 P12 写集；本段未改正文，故不升版，缺口留 AC-023。 |

七项漂移按真实调用清零，未升技能版本，因为只改登记、不改技能正文：
`plan-eng-review` → `[build-plan, make-decision]`；`resolving-merge-conflicts` → `[]`；`project-norm-init` → `[build-plan]`；`design-source-readiness` → `[build-plan, make-decision]`；`frontend-prototype-render` → `[build-plan, make-decision]`；`ui-copy-discipline` → `[build-plan]`；`figma-make-prompt` → `[]`。

## 47 项处置矩阵是什么？

原大纲 42 项（核心 11＋支撑 31）；catalog 原 47 行另含 adopted 2、retired 3。
原大纲只按「核心 11／支撑 31」分组，没有逐项名单（见 `quality/evidence/decision-log-refs/direction/convergence-outline.md:58-70`），故本报告不伪造 42 行；以 47 行逐项表为准，保留 42 与 47 的口径差异。
四个新技能（`unit-kernel`、`phase-maker`、`task-maker`、`run-phase`）不在原 47 行，另列于六处登记。
下表逐项一类；`保留原样` 的去向写「无」。

| 技能 | 状态 | 类别 | 去向 |
| --- | --- | --- | --- |
| `stage-reflection` | native | 保留原样 | 无 |
| `stage-handoff` | native | 保留原样 | 无 |
| `stage-close` | native | 保留原样 | 无 |
| `knowledge-graph` | native | 保留原样 | 无 |
| `anysearch` | adopted | 保留原样 | adopted：真实读者见 used_by_stages/skill-deps；无 |
| `decision-log` | native | 内容改写 | v2 十一格模板改引内核 R6、删逐格判据正文，补通用「答复索引只有这一份」读法，U-012 消歧待闭；owner=本任务 P10 作者 |
| `decision-maker` | native | 内容改写 | 正文增真实原答/跨包供件读法、同源冷读+对抗两路与独立异源审；owner=本任务 P10/P11 作者 |
| `deep-research` | native | 保留原样 | 无 |
| `grill-with-docs` | adapted | 保留原样 | 无 |
| `intake-decision-review` | native | 保留原样 | 无 |
| `simplicity-guard` | native | 保留原样 | 无 |
| `talk-with-zhipeng` | native | 保留原样 | 无 |
| `spec-prd` | native | 内容改写 | 正文增任务卡/子任务六字段、四行验收与地图唯一索引，分节审只留指针；owner=本任务 P6/P7 作者 |
| `spec-research` | retired | 已物理删除（历史提交，非本轮） | 历史提交 `c30fa590`（2026-10-09）已删除；目录不在当前工作树，非本轮删除 |
| `material-writing` | native | 保留原样 | 无 |
| `spec-specify` | adapted | 保留原样 | 无 |
| `spec-clarify` | adapted | 保留原样 | 无 |
| `spec-plan` | adapted | 内容改写 | 正文增首卡就绪、判据成本/期限/资源/范围三账与纯指针索引写入集/摘要口径；owner=本任务 P5 作者 |
| `spec-tasks` | retired | 已物理删除（历史提交，非本轮） | 历史提交 `c30fa590`（2026-10-09）已删除；目录不在当前工作树，非本轮删除 |
| `spec-analyze` | native | 保留原样 | 无 |
| `architect-code-review` | adapted | 保留原样 | 无 |
| `workflowhub-host-protocol` | native | 保留原样 | 无 |
| `workflowhub-multica-sync` | native | 保留原样 | 无 |
| `wh-review` | native | 保留原样 | 无 |
| `plan-ceo-review` | adapted | 保留原样 | 无 |
| `plan-design-review` | adapted | 保留原样 | 无 |
| `plan-eng-review` | adapted | 只改接线 | 只迁接线，让内核 R8 审查角色承接；真实调用点 build-plan skill-deps 与 wh-review 两轨必读；独立身份待原 owner 确认 |
| `review` | adapted | 保留原样 | 无 |
| `resolving-merge-conflicts` | native | 待退役（暂不删） | 真实消费者是 stage-close；替代为 stage-close 内联冲突恢复；恢复=承接实证后由清理任务删 |
| `debate` | retired | 已物理删除（历史提交，非本轮） | 历史提交 `c30fa590`（2026-10-09）已删除；目录不在当前工作树，非本轮删除 |
| `diagnosing-bugs` | adapted | 保留原样 | 无 |
| `test-routing-advisor` | adapted | 保留原样 | 无 |
| `testing-system-blueprint` | adapted | 保留原样 | 无 |
| `backend-testing` | adapted | 保留原样 | 无 |
| `frontend-testing` | adapted | 保留原样 | 无 |
| `fullstack-slice-testing` | adapted | 合并（暂不删） | 并入 backend-testing；真实调用点 build-code skill-deps 的 `actual_fullstack_test`；本轮只登记不切换 |
| `isolated-browser-qa` | adopted | 保留原样 | adopted：真实读者见 used_by_stages/skill-deps；无 |
| `project-norm-init` | native | 保留原样 | 无 |
| `design-source-extraction` | native | 保留原样 | 无 |
| `design-source-readiness` | native | 合并（暂不删） | 并入 project-norm-init；真实调用点 build-plan/make-decision skill-deps；本轮只登记不切换 |
| `frontend-prototype-render` | native | 保留原样 | 无 |
| `frontend-component-quality` | adapted | 保留原样 | 无 |
| `third-review` | native | 保留原样 | 无 |
| `answer-as-page` | adapted | 保留原样 | 无 |
| `norm-sync` | native | 保留原样 | 无 |
| `ui-copy-discipline` | native | 保留原样 | 无 |
| `figma-make-prompt` | native | 待退役（暂不删） | 真实消费者是 frontend-prototype-render 的无稿提示词路径与 ui-source-consumption 包解析；替代为现 UI 文案/提示方法；恢复=替代承接全部读者后由清理任务删 |

计数：保留原样 35、内容改写 4、合并（暂不删）2、只改接线 1、待退役（暂不删）2、已物理删除（历史提交，非本轮）3。

三项迁移只登记，不切调用者、不删目录：

| 迁移项 | 去向 | 真实调用点 | 恢复条件 |
| --- | --- | --- | --- |
| `fullstack-slice-testing` | 并入 `backend-testing` | `workflows/build-code/skill-deps.yaml` 的 `actual_fullstack_test` | backend-testing 承接跨端方法且全部调用者改读后，由后续清理任务删；之前保原调用。 |
| `design-source-readiness` | 并入 `project-norm-init` | `workflows/build-plan/skill-deps.yaml`、`workflows/make-decision/skill-deps.yaml` | project-norm-init 承接设计源就绪且全部调用者改读后，由清理任务删；之前保原调用。 |
| `plan-eng-review` | 只迁接线，让内核 R8 承接 | `workflows/build-plan/skill-deps.yaml`、`skills/wh-review/manifest.json` 两轨必读 | 内核承接工程审查角度且独立身份由原 owner 确认后，才可改身份；之前保原调用。 |

五项弱引用按「目录中无阶段依赖、且不属于核心写作标准」的可复算口径逐项给归宿；`material-writing` 作为核心写作标准另列保留原样。原卡未单独落逐项名单，这是覆盖限制。

| 弱引用 | 真实消费者 | 处置 | owner 与恢复条件 |
| --- | --- | --- | --- |
| `workflowhub-host-protocol` | `runtime/distribution/runner-release.mjs:112` 发布构建收包；`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs:412` 读正文核宿主方法；`skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs:243` 同步名单 | 保留原样 | host protocol 维护者；无删除条件。 |
| `workflowhub-multica-sync` | 用户明确要求同步时的显式入口 | 保留原样 | sync 维护者；无删除条件。 |
| `third-review` | 明确调用通用异源 CLI 审查器的入口 | 保留原样 | review 维护者；wh-review/OCR 承接全部调用后再评估退役。 |
| `figma-make-prompt` | `skills/frontend-prototype-render/SKILL.md:14,45` 无稿必要提示词/用户同意提示词包；`tests/contract/ui-source-consumption.test.mjs:18` 包解析读取 | 待退役（暂不删） | 替代方法承接全部读者后，由后续清理任务删；之前保留原调用。 |
| `resolving-merge-conflicts` | `stage-close`、`skills/stage-close/SKILL.md` | 待退役（暂不删） | stage-close 内联承接实证后，由后续清理任务删；之前保留原调用。 |

六处登记都可核：

| 登记处 | 本段读数 |
| --- | --- |
| 目录 | `skills/unit-kernel/`、`skills/phase-maker/`、`skills/task-maker/`、`skills/run-phase/` 均存在。 |
| catalog 行 | 四个新技能与七项升版均可在 `skills/catalog.yaml` 找到。 |
| 技能包清单 | 四个 `skill-bundle.json` 存在且被一致性检查消费。 |
| 复用登记 | 四个新技能与 `decision-maker` 都有唯一正文链接。 |
| 阶段依赖表 | 四份 `skill-deps.yaml` 分别登记 `unit-kernel`、`phase-maker`、`task-maker`、`run-phase`，trigger 对应真实步骤。 |
| 重生成投影 | `repo-skills.manifest.json` 只由生成器写出，`--check` exit 0。 |

## 未闭环缺口与恢复条件是什么？

| 验收 | 现状 | 已试原件 | 阻塞条件 | 提供者 | 恢复条件 |
| --- | --- | --- | --- | --- | --- |
| 001 | 已改判 pass；残余＝冻结测试仍锁裸格名单、门禁不捕获重复正文 | P1:221、`p01-independent-readback.md:38`、`2026-11-24-055-…duplicate-body.output` | 名单句被两条冻结测试逐字锁定，删除须提测试变更请求 | 内核作者 | 用户/内核作者决定是否提测试变更请求；之前保留裸名单原字节，不删测试。 |
| 007 | ①五列已补；②P4:28 未知影响未点名卡号与验收号；③开工表缺首卡行 | P4:300、`2026-11-24-126-readiness-p4.json`、`p04-independent-readback.md:127-129` | ②③是当场取证，收口补写只能记「收口后补记」，`spec.md:617` 明定不算通过 | P4 阶段卡作者（build-plan 侧） | 下次真实开工时在卡上点名具体卡号/验收号并加首卡行，同场取原件后再独立复验。 |
| 008 | 无真实下游新同仓卡 | `p05-ac008-generate-once.json` | 真实新卡未产生 | 未来同仓任务计划作者 | 第六步生成唯一索引、第七步只核时取真卡回执。 |
| 009 | 无认证规划试用任务首用 | P6:221 | 真实 PRD 试用未发生 | 未参与实现的独立执行者 | 真实规划任务首用并独立读回。 |
| 016 | 审查者会话 id、卡节 sha256、逐字 findings、单路不可用回放未取得 | P3:262、`p3-review-paths.md` | 原会话不可取；转录取代需改判据 | 用户/原决定人 | 用户决定是否以转录取代原件；否则保持 incomplete。 |
| 019 | 真实 PRD 同次调用两路与全文跨卡原件未取得 | P7:192 | 真实规划第二次内容调用未发生 | 真实规划 PRD 作者与两路读者 | 同一卡节两路原件 + 一次处置 + 全文跨卡原件。 |
| 020 | 首卡端到端持久与消费者读回未取得 | P8:189、`2026-11-24-143-p08-public-demo.json` | 无真实首卡端到端 | 下一个真实使用 build-code 第 2–3 步的阶段 | 公开入口持久卡并由真实消费者读回。 |
| 021 | ②审后提交身份已补（`cb89011a`）；①审查 finding 原文未入库、③外审不可用对照未捕获 | P9:192、`p09-independent-readback.md`「审后提交身份补充」、`git log -1 cb89011a` | ①的原审查执行者会话与逐字 findings 已不可取；③可补但被①挡住，单独补也不闭环 | 本阶段审查执行者（①）、开发（③） | 原决定人决定①是否以转录取代或重开一次审查；②已兑现，③在①有结论后补一次不可用对照。 |
| 022 | 原答时点、包 4/5 指针、U-012 消歧、真实首读回执未取得 | P10:185 | 真实周期未补 | 原答提供者、独立接手人 | 补时点与指针、消歧 U-012、首读留回执。 |
| 023 | 真实包两路/异源原件、首读回执、wh-review detail 轨与 dispatch 同步未取得 | P11:195-199 | 真实周期未发生；wh-review 不在 P12 写集 | 方向作者、wh-review 合同 owner | 真实周期补三件原件；wh-review 由原 owner 同批对齐。 |
| 011 | 三组期限读数未取得 | P5:297 | 无真实同库接口与固定期限 | 本段实施者（后续） | 补短期限、受控争用、约定超时三组真实读数。 |
| 013 | 两份合法装配输入未取得 | P5:297 | 无固定读口与批准配置 | 本段实施者（后续） | 补两份合法输入及各自原契约预期。 |
| 015 | 用户实看原件未取得 | P1:222 | 用户当次记录未保存 | 用户/原会话 | 取得同次聊天原始记录或用户对同版卡原答；P4 试点归后续。 |
| 014 | 已闭环：独立判词 pass | `p12-independent-readback.md`、`p12-gate-readback.json` | 无（两条登记指针已在独立判词前修完） | 独立验收者（已判） | 已兑现；后续不再重开，登记指针若再动须同批核 catalog 与 stage-close。 |
| 024 | 已闭环：独立终判 pass（2026-11-25） | `p12-independent-readback.md:162-169`、`p12-adjacent-eleven-frozen.output` | 无；余下两条 low 登记文字（`closeout-report.md:169,172` 的 host-protocol 与 figma 消费者）不阻本项 | 独立验收者（已判） | 已兑现；两条 low 文字若要求零 open finding 再改，不影响 024 档位。 |

## 实际测试与限制有哪些？

本段只跑受影响命令，不跑全量回归，不跑浏览器，不执行 Git。

| 命令 | 退出 | 原件 | 说明 |
| --- | --- | --- | --- |
| `node tools/cli/build-skill-manifests.mjs --check` | 0 | `quality/tests/p12-gate-manifest.output` | 51 repository skills、5 external entries。 |
| `node tools/cli/check-skill-consistency.mjs --root "$PWD"` | 0 | `quality/tests/p12-gate-consistency.output` | 无 `used_by_stages source=` 源行；仍有 material-authoring 等 report-only 行，未当门。 |
| 四份 `skill-deps.yaml` 解析 | 0 | `quality/tests/p12-scoped-original.json` | 16/25/9/21 项，无重复、无缺 `trigger`，四份均含 `unit-kernel` 与对应新技能。 |
| 十一份既有冻结契约测试 | 0 | `quality/tests/p12-adjacent-eleven-frozen.output` | 111/111 pass；覆盖 P1–P11 冻结断言。 |
| `node tools/cli/build-skill-manifests.mjs`（重生成） | 0 | `repo-skills.manifest.json` | 只由生成器写；随后 `--check` 0。 |

限制：

- 未跑全量 `vitest`、`npm test` 或 `test:safe`；只跑十一份受影响冻结契约。
- 只读运行 `git rev-parse HEAD` 与 `git status --porcelain`；未提交，5 个路径见文首。
- 未跑 `markdownlint`；本段只改 catalog、索引、投影和收口报告。
- 未做真实下游材料、真实首读、真实两路审查或 `wh-review` 外审；这些缺口没有以形状或合成件冒通过。
- `check-skill-consistency` 仍输出 report-only 的 material-authoring 与 source-registry 诊断；它们不是本段新增，也不阻断，未用汇总数代替 `used_by_stages source=` 行数。
- `run-checks` 退出 0 但 `chain_state=unverified`，`completion=3/10`：环 1/2/3/5/9 unavailable、7 incomplete、4/6/8 completed、环 10 unavailable（按需项，交付声明未取得；`skipped_stages=[]`），39 条 `missing_steps` 全 unavailable；原件 `quality/tests/p12-run-checks.output`，sha256 `b98cbfa8…`。

## 风险与关闭方法是什么？

主要风险是把本段登记和两条绿灯当成整体完成。

- AC-024 的复验 pass 判词已出（`p12-independent-readback.md:162-169`）；本报告按该判词改判与改计数，不以自述替代独立判词。
- 九项未完成、一项不得判、两项推迟；真实下游材料和真实周期未发生。AC-001 虽重判 pass，其残余（冻结测试锁名单、门禁不捕获重复正文）仍未清。
- `wh-review` detail 轨与 `dispatch` 未同步；AC-023 仍 incomplete。
- 三项迁移只登记，调用者未切换；提前删除会留下失效路径。
- 七项 `used_by_stages` 已按当前 skill-deps/wh-review 必读改正；未来调用点变化时要同批改回，不能靠手改投影消漂移。
- 本段升版按真实正文变化记录；独立验收若不认可版本依据，回本段修正后重跑两命令。

关闭分三步（第 1 步已兑现）：

1. 独立验收者已读本报告与 `phases/P12-末验与技能去向.md`，复验 AC-014、AC-024 并写 `quality/tests/p12-independent-readback.md`；两项均判 pass。
2. 材料侧待办：`check-delivery-claims` 的 implemented/verified 仍以旧门禁原件绑定（当前工作树有 3 个未提交路径，字节与门禁捕获不同），accepted 缺 `quality/evidence/verdict.json`；须由主会话按标准方法重跑 `verify --action=execute` 取新门禁原件、补 verdict、再提交本报告收口。
3. 物理清理、`wh-review` 同步和九项未完成材料的真实补件，另按各自 owner 与恢复条件处理；本轮不删任何技能。

## 收口时的缺口处置决定

本节只记 2026-11-25 收口时对每个未通过项的处置决定：改判的写依据，维持的写理由、owner 与恢复条件。不补写当场材料，不把事后补件当现场（`spec.md:617`）。

- **001 改判 pass。** 依据：按当前字节独立重判——三处副本中两处已改为指针（`skills/decision-log/templates/decision-log-template-v2.md:236-237`、`skills/decision-maker/templates/card.md:17,21`）；`workflows/make-decision/SKILL.md:277` 只剩裸格名清单（无逐格定义、验收四件、三档规模），内核 `skills/unit-kernel/SKILL.md:188` 已登记「定义已迁 R6」并带 owner 与移除条件，不构成「重复权威被接受」；门禁 `unit-kernel-wiring` 当前 14/14、exit 0（本日人工复跑，未另存捕获，引 058 原件）；独立读回 `quality/tests/p01-independent-readback.md:38` 判 pass。残余不改档位：两条冻结测试仍逐字锁该名单（`tests/contract/convergence-card-contract.test.mjs:50,108`、`tests/contract/module-convergence-card.test.mjs:25,89`），彻底删除需测试变更请求；重复正文门禁不捕获（`quality/tests/2026-11-24-055-p01-neg2-case2-duplicate-body.output` 为证）。
- **007 维持 incomplete。** 精确缺口：① 五列已由开工入口读出（`quality/tests/2026-11-24-126-readiness-p4.json` 的 `human_rows` 五键与 `probes` 机读行）✓；② `phases/P4-计划首卡与供件.md:28` 的未知影响（「最大风险和替代」行）未点名具体卡号与验收编号 ✗；③ 开工表缺「首卡行」，写卡现场是开工后取的 ✗。不在收口时补写的理由：`spec.md:617` 的失败条明写「拿事后补件当现场」不算通过，收口补写只能记「收口后补记」，补了仍不满足当场要求，故维持 incomplete。owner＝P4 阶段卡作者（build-plan 侧）；恢复条件＝下次真实开工时在卡上点名具体卡号/验收号并加首卡行，同场取原件后再独立复验。
- **008 维持 incomplete。** 缺真实下游新同仓卡：隔离样本只证「第六步一次生成、第七步只核」的形状。恢复条件＝未来同仓任务在第六步生成唯一索引、第七步只核时取真卡回执。
- **009 维持 incomplete。** 缺认证规划试用任务的真实首用与独立读回；门禁 7/7 与「规划稿门槛」文字本身不作通过依据。恢复条件＝真实规划任务首用并独立读回。
- **011 维持 deferred。** 缺真实短期限、受控争用、约定超时三组读数；不得用索引检查代判。恢复条件见 `phases/P5-判据期限与索引.md:174,177`（有真实同库接口与固定期限后补三组读数）。
- **013 维持 deferred。** 缺固定读口＋仅改装配的两份合法输入及各自原契约预期。恢复条件见 `phases/P5-判据期限与索引.md:175,177`。
- **015 维持 inconclusive。** 用户本人同次看过同版卡的原件未取得；P1 只判自己采用的互动方法。恢复条件＝取得同次聊天原始记录或用户对同版卡的原答，P4 试点实跑另行取证。
- **016 维持 incomplete（清单外补记，与逐条表一致）。** 缺审查者会话 id、同一卡节摘要 sha256、逐字 findings、一路不可用回放；现有 `quality/evidence/p3-review-paths.md` 是宿主转录，不冒原件。恢复条件＝原决定人决定是否以转录取代原件（属改判据，须由原 owner 定）。
- **019 维持 incomplete。** 缺真实 PRD 同次调用内的两路原件、一次处置与全文跨卡原件。恢复条件＝真实规划 PRD 作者与两路读者同次调用后取三件原件。
- **020 维持 incomplete。** 缺首卡端到端持久与消费者读回。恢复条件＝下一个真实使用 build-code 第 2–3 步的阶段公开入口持久卡并由真实消费者读回。
- **021 维持 incomplete。** ① 审查 finding 原文未入库，且原审查执行者会话已不可取——需原决定人决定是否以转录取代原件（改判据，非本报告可自决）；② 审后提交身份已补：`cb89011a`（`feat(convergence): P9 两方独立回报与晚发现不另开阶段`），见任务库 `quality/tests/p09-independent-readback.md`「审后提交身份补充」；③ 外审不可用对照可补，但单独补也不闭环。②已兑现、③待①有结论后补一次不可用对照；AC 仍被①挡住，档位不变。
- **022 维持 incomplete。** 缺真实原话（原答时点、包 4/5 直接指针、U-012 双指针消歧、真实首读回执），需等真实业务周期产生原话。恢复条件＝原答提供者与独立接手人在真实周期后补时点、指针、消歧与首读回执。
- **023 维持 incomplete。** 缺真实包的两路原件与独立异源人工读原件、真实首读回执；`wh-review` detail 轨与 `dispatch` 同步不在本轮写集。恢复条件＝真实周期补三件原件，`wh-review` 由原合同 owner 同批对齐。
- **024 已由独立终判改 pass**（`quality/tests/p12-independent-readback.md:162-169`），不在本节维持之列；其判词要求的改判与改计数已在本轮兑现。

## 机器字段（校验器用，人可跳过）

- 任务：`delivery-quality-plan-20261123`。
- 阶段：build-code；Phase：P12。
- 判定提交：`ec09bb854cf8852e873b5cfbe353f3c58b64b284`；该轮未提交、5 个路径（第 2 轮时 HEAD=`5f233c9c`，材料改动未提交）。
- 写入集：`skills/catalog.yaml`；`skills/reuse-registry.md`；`repo-skills.manifest.json`；`workflows/make-decision/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-prd/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`（四份只读复核、未改）；`specs/delivery-quality-plan-20261123/closeout-report.md`。
- 结论：`acceptance_status=not_fully_achieved`。
- 计数：pass=13；incomplete=9；inconclusive=1；deferred=2；pending_independent=0；fail=0。
- 逐项：001=pass（收口重判，残余见末节）；002=pass_with_three_limits；003=pass；004=pass_with_pilot_deferred；005=pass；006=pass；007=incomplete；008=incomplete；009=incomplete；010=pass；011=deferred；012=pass_with_limited_diff；013=deferred；014=pass；015=inconclusive；016=incomplete；017=pass；018=pass；019=incomplete；020=incomplete；021=incomplete（②已补 cb89011a；①③仍缺）；022=incomplete；023=incomplete；024=pass（独立终判）；025=pass。
- 门禁：manifest exit=0；consistency exit=0；`used_by_stages source=` 行数=0。
- 冻结：11 份契约 111/111 pass；exit=0。
- 版本：unit-kernel=1.1.0；spec-plan=1.4.0；phase-maker=0.2.0；task-maker=0.2.0；spec-prd=1.3.0；run-phase=0.2.0；decision-maker=0.3.0；decision-log=1.1.0；wh-review=4.2.0。
- 处置：保留原样 35；内容改写 4；合并（暂不删）2；只改接线 1；待退役（暂不删）2；已物理删除（历史提交，非本轮）3。
- 原件：`quality/tests/p12-gate-readback.json`；`p12-gate-manifest.output`；`p12-gate-consistency.output`；`p12-adjacent-eleven-frozen.output`；`p12-scoped-original.json`。
- 待独立：无。AC-014、AC-024 判词已出（`quality/tests/p12-independent-readback.md`）。材料侧待办：`check-delivery-claims` 仍 fail——implemented/verified 以旧门禁原件绑定（未提交字节与门禁捕获不同），accepted 缺 `quality/evidence/verdict.json`；由主会话重跑门禁取新原件、补 verdict 后收口。
- 限制：未跑全量回归；未提交 Git；未跑浏览器；未取真实下游材料。
