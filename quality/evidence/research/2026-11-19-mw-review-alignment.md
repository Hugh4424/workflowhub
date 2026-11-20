# material-writing 与三轨审查输入的九项对齐（只读审计）

- 类型：只读审计，未改源文件；本报告为交付件。
- 对象：4.10 新模板设计、旧模板、material-writing、wh-review 方向/细节/build-plan 合同与组包代码。
- 结论：material-writing 不必改正文；三轨各补一句，方向只补"最初方案"语义；build-plan 的 decision_baseline 现在就取不到新日志，须先修。

## 1 material-writing 要求什么

十一条＋十条自检，声明"校验器只报告"（`:19-20`）。压掉设计历程的是：第 4 条"标题是读者问题、首句即答案"（`:27`）会把最初方案/被否/调研改成问句并压成结论；第 3 条与自检"正文无 AC-xxx"（`:26,49`）与九项"验收给 AC 号"冲突（AC 表属追踪表，可解释）；第 8 条"表格只对照"（`:31`）挡写集表；第 11 条"验收不写计数"（`:34`）与 4.10"10 包九项齐"（日志 `:491`）冲突。保留 1、2、5、6、7、9、10 条。
最小改法：不动十一条。模板已有例外块（`:9-19`，已声明"决定是记录，不是读者问答节"），把每包九项加为记录节：标题用事实名、首句写事实；AC 随验收表；写集/验收面按对照表；九项缺口只作校验器读数，不作验收判据。若必须动本文件，只在 `:36` 例外句加"决策日志的记录节例外由其模板声明"。

## 2 方向审查输入

读 8 键：raw_requirement、research_context、objective_facts、convergence_outline、current_selection、alternatives、selection_rationale、key_assumptions（`review-materials.mjs:574`）。七项中原始需求、被否方案、验收草案、风险已在；缺"最初方案（谁否、为什么）"；接口/写集按设计不给方向轨（proposed_solution 禁区、盲重建）。
最有效只补 1 个语义、不新增键：`contracts/make-decision.md:14` 的 alternatives 改为"被否候选必含最初方案、否决者与理由"，`review-materials.mjs:575` 同步一句。若坚持加键，`initial_approach` 要动 stage-materials、必填循环、合同、测试四处，收益低于复用，不推荐。

## 3 细节与 build-plan

detail 读 raw_requirement＋approved_direction（完整日志，九项在包内）＋可选投影；缺"逐包核九项"指令，且 `per_package_projection` 只有 scope/plan/acceptance/risk/source_ref（`contracts/make-decision.md:38`），无接口/写集/依赖/未决。最小：`:42` 与 `review-materials.mjs:597` 各加"缺接口/写集/依赖且影响①②③判断记 finding，纯字段缺失记覆盖限制"；不扩投影行，避免双写。
build-plan 要核"消费"不核"齐备"：decision_baseline 由 `build-decision-baseline.mjs` 生成，只收任务身份/原始需求/答复三段＋决定正文（`:83-124,142`），每包设计不进包；且新标题"原始需求（翻译后）"不匹配 `:20` 正则。实跑本日志 exit 1：`BASELINE_SOURCE_INVALID: no recognized 需求 source records`。先修组包，再在 `contracts/build-plan.md` 加"核每 Phase 接口/写集/验收/风险在 spec/phases 有落点；日志缺项交校验器，不重复计"。

## 4 共用一张检查吗

共用一份"九项定义＋缺口写法"（放 `skills/decision-log/SKILL.md`），三轨引用；不共用一次检查或 gate。方向看不到接口/写集（盲重建），细节看全量日志，build-plan 看下游消费；共用检查要么把方案漏进方向包，要么与 validate-decision-log 重复成第二道门。代价是各轨缺项口径可能漂移，靠单一清单收口。

## 5 写进哪个包

写包 10，不新开包。包 10 已拥有模板、六段、消费映射与完整性检查，验收本就是"build-plan 不重读聊天能写 spec/phases"（`:490-493`）；两条改动属同一消费者链，新包要再加三角色、依赖与验收面却无独立交付物。做法：包 10 完整方案加两行（记录节例外；三轨输入与提示），验收加两条反例；包 3 输出加一句"九项定义引包 10"，避免双 owner。另把 `:487`"build-plan 不得开工"改为"缺项记具名缺口＋owner，build-plan 在 spec 记缺口"：硬门与"事实不是许可证、unknown 不阻止修复、校验器只报告"冲突。

## 6 最小改动清单

| 文件:位置 | 改什么 | 验收/反例 |
| --- | --- | --- |
| template:9-19 | 九项列为记录节；AC 随验收表；缺口计数只作读数 | 4.3 段读回不被判问答违规；反例：把最初方案改成问句只留结论 |
| template:370；decision-log SKILL:38,54 | 被否/调研从"只留一句/外置"改为"主文留九项结论＋原件 ref" | 4.3 主文可定位九项；反例：只写"见 rejected-candidates.md" |
| template:383-433 | 每包补最初方案、被否≥2、调研+ref、接口/写集/依赖/顺序、验收命令/owner/时点、风险回退、未决/消费者/证据 ref+sha；11 列表与十格卡留作摘要 | 每包九项可按标题定位；反例：只有包清单+决定 |
| make-decision.md:14,42 | alternatives 必含最初方案/否决者/理由；加逐包核九项 | `npx vitest run skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`；反例：只给一个备选仍记完成 |
| review-materials.mjs:575,597,607 | 三处提示各加一句（方向最初方案；细节九项；build-plan 消费） | `npx vitest run tests/contract/review-materials-contract.test.mjs`；反例：删九项仍无 finding |
| build-plan.md:11-18 | 加"核每 Phase 接口/写集/验收/风险在 spec/phases 有落点；日志缺项交校验器" | 反例：Phase 缺接口仍记通过 |
| build-decision-baseline.mjs:20-31,83-142 | 接受"原始需求（翻译后）"与"用户确认了什么"；输出加"每包设计"段带 ref | `node skills/spec-plan/scripts/build-decision-baseline.mjs --decision-log <本日志> --spec <spec>` exit 0 且含"每包设计"；现状 exit 1 |
| tests/contract/review-decision-baseline.test.mjs:102-111 | 加新模板 fixture，保留"历史材料"负例 | `npx vitest run tests/contract/review-decision-baseline.test.mjs`；反例：接受"历史材料"标题 |

证据：实跑 `build-decision-baseline.mjs` 对本日志 exit 1，stderr 为 `BASELINE_SOURCE_INVALID: no recognized 需求 source records`；基线两套 `npx vitest run tests/contract/review-decision-baseline.test.mjs tests/contract/review-materials-contract.test.mjs` 现 89 测试全过（改动须保持）。其余为合同/提示与代码位置读回，未改字节。
