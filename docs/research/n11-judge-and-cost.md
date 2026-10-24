# N11 判定与成本

## 判定口径

本报告仅消费 P7 固定四阶段、两侧八格的真实终态材料。P7 八份 summary 都是 `incomplete`；内容质量判定不改变该事实，也不证明流程完成。唯一输入索引为任务原件 `quality/evidence/2026-10-23-250-p7-eight-cell-actual-manifest.json`（SHA256 `fb5f71582529e348902ee6719175ad10648f3b21fff28d10f1290940da740a40`），身份由246和255承接。

答案按实际 `cellroot + side + stage + source/output hash` 归属；跨侧相同 official ID 不合并。provider_output JSON只导航与呈现终态，不代替业务正文。MD读取真实decision-log及必要确认/覆盖来源，BP读取spec、指针index和全部Phase，BC读取具名实际实现/测试和实施说明，VC读取验收报告及必要发现支撑原件。只按明确任务与文件引用取必要字节，不读取整个工作树或目录作证据。MD/BP候选包装缺失和timeout保真；若已有业务正文，可评运行终止时的部分产物，不能改称正式交付成功。

判官沿当前已配置可信 `codex/luna`、`gpt-6-luna`、`max`。完整可信profile保留 enabled、command、source_id/config_id；不以默认CLI代替配置命令，不更改公共provider协议。复用既有 `runPacketBoundCodexReview`，每次独立只读临时packet与native上下文。单provider独立上下文不冒异源审查。

同一pair正反各一次。正序A/B与反序B/A先归一化回实际cell身份，两次都选同一实际侧才为该侧win；有效tie或分歧为tie。缺一次、非法返回、provider unavailable或确缺必要答案为inconclusive，绝不当tie。四pair、八cell保固定分母，不重跑P7或借旧cohort补样本。

匿名输入保留共同公开需求、阶段目标与必要固定上游；只去技术身份、绝对宿主路径、side/model/provider/revision线索，引用用中性别名保持关联，不改业务语义。原文hash、脱敏投影hash与受控映射分开保存；映射不进入判官packet。原始判官返回、session与失败单件保留。replay只重读已有原件重算，不调用模型。隐藏评分未送入被测provider或判官输入；判官只能按公开任务和显式质量口径评价。

## 54/23 逐项复核

唯一权威是父PRD采用/保护主表及其指向的逐skill原表。217为原文定位索引，不能代替当前消费者和行为证据。下表逐条保留54采用、23保护原始分母；“已登记”只证明当前方法/消费者在场，不能当首次迁移、首次行为验收或整体通过。当前未取得行为原件的项明确保留缺口。

复核原件：`quality/evidence/2026-10-23-278-p8-77-playbook-registration-readback.json`，SHA256 `303abd4745a1d7853ad05d441cc826215e4c833e466dff04566a10e7923c3466`。54父PRD行和23保护集合均与当前原文匹配；外置主表77行逐字回读、原hash匹配。47项具名登记、7项未补，不在本Phase补采用或许可。所有首次行为证据均未取得。

### 54 项采用

| 原条 | 原文锚／主表行 | 当前消费者正文 | 处置 | 未覆盖 |
| --- | --- | --- | --- | --- |
| 1. browser-testing-with-devtools（主表74行）；N3 → isolated-browser-qa/verify-code | 主表:74；父PRD:680 | workflows/verify-code/SKILL.md:37 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 2. code-simplification（主表77行）；N3 → simplicity-guard | 主表:77；父PRD:681 | skills/simplicity-guard/SKILL.md:32；skills/simplicity-guard/SKILL.md:51 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 3. constraint-driven-development（主表78行）；N3 → verify-code | 主表:78；父PRD:682 | workflows/verify-code/SKILL.md:57；workflows/verify-code/SKILL.md:59 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 4. context-engineering（主表79行）；N5 → AGENTS派发段/既有stage-handoff上下文 | 主表:79；父PRD:683 | AGENTS.md:33；AGENTS.md:37 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 5. debugging-and-error-recovery（主表80行）；N3 → diagnosing-bugs | 主表:80；父PRD:684 | skills/diagnosing-bugs/SKILL.md:12 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 6. documentation-and-adrs（主表82行）；N4 → decision-log | 主表:82；父PRD:685 | skills/decision-log/SKILL.md:22；skills/decision-log/SKILL.md:67 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 7. doubt-driven-development（主表83行）；N3 → review协议/AGENTS审查派发/verify-code | 主表:83；父PRD:686 | skills/wh-review/SKILL.md:32 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 8. git-workflow-and-versioning（主表85行）；N7 → stage-handoff/AGENTS写集说明 | 主表:85；父PRD:687 | skills/stage-handoff/SKILL.md:26 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 9. idea-refine（主表86行）；N6 → talk-with-zhipeng | 主表:86；父PRD:688 | skills/talk-with-zhipeng/SKILL.md:115；skills/talk-with-zhipeng/SKILL.md:125 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 10. incremental-implementation（主表87行）；N4 → spec-plan/Phase模板 | 主表:87；父PRD:689 | skills/spec-plan/SKILL.md:25 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 11. interview-me（主表88行）；N6 → grill-with-docs | 主表:88；父PRD:690 | skills/grill-with-docs/SKILL.md:120；skills/grill-with-docs/SKILL.md:132 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 12. observability-and-instrumentation（主表89行）；N1 → 成本读回 | 主表:89；父PRD:691 | tools/cli/measure-main-agent-cost.mjs:87；tools/cli/measure-main-agent-cost.mjs:88；tools/cli/measure-main-agent-cost.mjs:108 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 13. performance-optimization（主表90行）；N1 → 对照方案 | 主表:90；父PRD:692 | skills/catalog.yaml:1156 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 14. planning-and-task-breakdown（主表91行）；N4 → spec-plan/Phase模板 | 主表:91；父PRD:693 | skills/spec-plan/SKILL.md:43 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 15. security-and-hardening（主表92行）；N2 → 既有安全写/删除边界 | 主表:92；父PRD:694 | runtime/interface/safe-write.mjs:91；runtime/interface/safe-write.mjs:92 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 16. shipping-and-launch（主表93行）；N4 → Phase回滚字段 | 主表:93；父PRD:695 | skills/spec-plan/templates/phase-template.md:166；skills/spec-plan/templates/phase-template.md:167 | 已登记 | 仅当前具体规则可定位；原条完整分落点/首次行为未核，回滚耗时与计数实测等缺项未取得。；首次行为未取得 |
| 17. source-driven-development（主表94行）；N4 → deep-research/spec-plan | 主表:94；主表:333；父PRD:696 | skills/deep-research/SKILL.md:14；skills/deep-research/SKILL.md:15；skills/deep-research/SKILL.md:37 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 18. spec-driven-development（主表95行）；N4 → spec模板模块划分 | 主表:95；父PRD:697 | skills/spec-specify/SKILL.md:41 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 19. test-driven-development（主表96行）；N3 → 三个测试技能/既有Phase测试合同 | 主表:96；父PRD:698 | skills/backend-testing/SKILL.md:12；skills/backend-testing/SKILL.md:28；skills/frontend-testing/SKILL.md:24；skills/fullstack-slice-testing/SKILL.md:12 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 20. using-agent-skills（主表97行）；N2 → reuse-registry | 主表:97；父PRD:699 | skills/reuse-registry.md:3；skills/reuse-registry.md:74 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 21. create-verification-skill（主表99行）；N3 → reuse-registry/isolated-browser-qa | 主表:99；父PRD:700 | skills/isolated-browser-qa/SKILL.md:50；skills/isolated-browser-qa/SKILL.md:62；skills/isolated-browser-qa/SKILL.md:65 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 22. maintain-verification-skill（主表100行）；N3 → isolated-browser-qa/既有索引维护 | 主表:100；父PRD:701 | skills/isolated-browser-qa/SKILL.md:80；skills/isolated-browser-qa/SKILL.md:88；skills/isolated-browser-qa/SKILL.md:114 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 23. interrogate（主表101行）；N3 → review协议/decision-log/simplicity-guard | 主表:101；父PRD:702 | skills/simplicity-guard/SKILL.md:35；skills/simplicity-guard/SKILL.md:36；skills/simplicity-guard/SKILL.md:41 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 24. no-comments（主表103行）；N7 → stage-reflection | 主表:103；父PRD:703 | skills/stage-reflection/SKILL.md:30 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 25. technical-writing（主表106行）；N4 → WR001/四类写作出口 | 主表:106；父PRD:704 | skills/spec-specify/SKILL.md:157；skills/spec-specify/SKILL.md:163 | 已登记 | 仅当前具体规则可定位；原条完整分落点/首次行为未核，回滚耗时与计数实测等缺项未取得。；首次行为未取得 |
| 26. unslop（主表108行）；N4 → WR001/decision-log写法 | 主表:108；父PRD:705 | skills/decision-log/SKILL.md:63；skills/decision-log/SKILL.md:67；skills/decision-log/SKILL.md:70 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 27. setup-pstack（主表111行）；N2 → catalog登记维护 | 主表:111；父PRD:706 | AGENTS.md:88 | 未补 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 28. poteto-help（主表112行）；N2 → reuse-registry | 主表:112；父PRD:707 | skills/reuse-registry.md:3；skills/reuse-registry.md:28；skills/reuse-registry.md:36 | 未补 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 29. figure-it-out（主表115行）；N10 → 标准流程/收口 | 主表:115；父PRD:708 | workflows/verify-code/SKILL.md:53 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 30. ketchup（主表117行）；N7 → handoff | 主表:117；父PRD:709 | skills/stage-handoff/SKILL.md:28 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 31. explain-the-number（主表120行）；N1 → 成本报告 | 主表:120；父PRD:710 | tools/cli/measure-main-agent-cost.mjs:8 | 未补 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 32. test-behavior-not-implementation（主表122行）；N3 → AGENTS/三个测试技能 | 主表:122；父PRD:711 | skills/backend-testing/SKILL.md:12；skills/backend-testing/SKILL.md:19；skills/backend-testing/SKILL.md:22；skills/frontend-testing/SKILL.md:24；skills/fullstack-slice-testing/SKILL.md:12 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 33. laziness-protocol（主表125行）；N3 → simplicity-guard/既有AGENTS | 主表:125；父PRD:712 | skills/simplicity-guard/SKILL.md:23；skills/simplicity-guard/SKILL.md:30 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 34. build-the-lever（主表126行）；N4 → build-plan/Phase模板 | 主表:126；父PRD:713 | skills/spec-plan/templates/phase-template.md:233 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 35. attack-the-premise（主表127行）；N3 → review/repair方法 | 主表:127；父PRD:714 | skills/review/SKILL.md:42 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 36. minimize-reader-load（主表129行）；N4 → 材料模板 | 主表:129；父PRD:715 | skills/spec-plan/SKILL.md:79 | 已登记 | 仅当前具体规则可定位；原条完整分落点/首次行为未核，回滚耗时与计数实测等缺项未取得。；首次行为未取得 |
| 37. make-operations-idempotent（主表130行）；N2 → 既有写入口设计 | 主表:130；父PRD:716 | runtime/interface/safe-write.mjs:157；runtime/interface/safe-write.mjs:159；runtime/interface/safe-write.mjs:170 | 未补 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 38. type-system-discipline（主表132行）；N2 → 现有schema/检查 | 主表:132；父PRD:717 | runtime/schemas/skill-bundle.schema.json:30；runtime/schemas/skill-bundle.schema.json:69 | 未补 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 39. boundary-discipline（主表134行）；N2 → interface职责/AGENTS | 主表:134；父PRD:718 | AGENTS.md:89 | 未补 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 40. experience-first（主表137行）；N2 → consumer登记 | 主表:137；父PRD:719 | AGENTS.md:88 | 未补 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 41. blast-radius（主表143行）；N3 → review/verify-code | 主表:143；父PRD:720 | skills/review/SKILL.md:50 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 42. reflect（主表144行）；N7 → stage-reflection | 主表:144；父PRD:721 | skills/stage-reflection/SKILL.md:28；skills/stage-reflection/SKILL.md:30 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 43. recall（主表145行）；N7 → stage-reflection | 主表:145；父PRD:722 | skills/stage-reflection/SKILL.md:38 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 44. architect（主表146行）；N3 → verify-code/review | 主表:146；父PRD:723 | skills/review/SKILL.md:44 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 45. arena（主表148行）；N3 → wh-review协议 | 主表:148；父PRD:724 | skills/wh-review/contracts/provider-protocol.md:22 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 46. why（主表150行）；N4 → decision-log/spec-analyze/verify-code | 主表:150；父PRD:725 | skills/spec-analyze/SKILL.md:28 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 47. multi-phase-plan.md（主表165行）；N4 → spec-plan现校验调用 | 主表:165；父PRD:726 | skills/spec-plan/SKILL.md:71 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 48. orchestrate.md（主表166行）；N5 → AGENTS/实际派发方法 | 主表:166；父PRD:727 | AGENTS.md:20；AGENTS.md:33；AGENTS.md:35 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 49. refactoring.md（主表171行）；N4 → spec-plan测试设计 | 主表:171；父PRD:728 | skills/spec-plan/SKILL.md:57 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 50. perf-issue.md（主表172行）；N3 → diagnosing-bugs性能段 | 主表:172；父PRD:729 | skills/diagnosing-bugs/SKILL.md:44 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 51. hillclimb.md（主表173行）；N4 → 既有Phase效果合同/受控正反负载 | 主表:173；父PRD:730 | skills/spec-plan/templates/phase-template.md:242 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 52. prototype.md（主表174行）；N6 → make-decision方法/既有AGENTS | 主表:174；父PRD:731 | AGENTS.md:59 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 53. eval.md（主表176行）；N4 → 既有Phase评测合同/受控匿名同尺正反负载 | 主表:176；父PRD:732 | docs/architecture/test-asset-governance-rules.md:11 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |
| 54. opening-a-pr.md（主表183行）；N7 → 交付说明 | 主表:183；父PRD:733 | skills/stage-handoff/SKILL.md:26；skills/stage-handoff/SKILL.md:37 | 已登记 | 只定位现正文/实现及部分来源方法；未核原条所有分落点与首次行为，不冒采用完整/保护pass；首次行为未取得 |

### 23 项保护

“不适用”指不新增外部采用，原23项保护分母仍完整；不能由原主表“本仓更强”推出当前行为已保护。

| 原条 | 原文锚／主表行 | 当前消费者正文 | 处置 | 未覆盖 |
| --- | --- | --- | --- | --- |
| 1. prototype | 父PRD:754；主表:45 | skills/frontend-prototype-render/SKILL.md:23 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 2. research | 父PRD:754；主表:46 | skills/deep-research/SKILL.md:12；skills/deep-research/SKILL.md:14；skills/deep-research/SKILL.md:15 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 3. handoff | 父PRD:754；主表:57 | skills/stage-handoff/SKILL.md:16；skills/stage-handoff/SKILL.md:20；skills/stage-handoff/SKILL.md:22 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 4. wait-what | 父PRD:754；主表:60 | docs/adr/0037-adopt-cross-language-writing-rules.md:18；docs/adr/0037-adopt-cross-language-writing-rules.md:19；docs/adr/0037-adopt-cross-language-writing-rules.md:20 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 5. chief-of-staff | 父PRD:754；主表:62 | AGENTS.md:19；AGENTS.md:33 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 6. deprecation-and-migration | 父PRD:754；主表:81 | AGENTS.md:96；AGENTS.md:105 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 7. frontend-ui-engineering | 父PRD:754；主表:84 | docs/adr/0016-external-first-frontend-component-quality.md:7 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 8. how | 父PRD:754；主表:116 | skills/stage-handoff/SKILL.md:17；skills/stage-handoff/SKILL.md:22；skills/stage-handoff/SKILL.md:24 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 9. guard-the-context-window | 父PRD:754；主表:124 | AGENTS.md:37 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 10. separate-before-serializing-shared-state | 父PRD:754；主表:128 | AGENTS.md:21 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 11. migrate-callers-then-delete-legacy-apis | 父PRD:754；主表:131 | AGENTS.md:96；AGENTS.md:105 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 12. outcome-oriented-execution | 父PRD:754；主表:136 | workflows/build-code/SKILL.md:15 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 13. feature.md | 父PRD:754；主表:169 | skills/spec-plan/SKILL.md:43 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 14. bug-fix.md | 父PRD:754；主表:170 | skills/diagnosing-bugs/SKILL.md:16；skills/diagnosing-bugs/SKILL.md:32 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 15. visual-parity.md | 父PRD:754；主表:175 | skills/spec-plan/templates/phase-template.md:248 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 16. investigation.md | 父PRD:754；主表:178 | skills/deep-research/SKILL.md:42；skills/deep-research/SKILL.md:87；skills/deep-research/SKILL.md:94 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 17. trace-forensics.md | 父PRD:754；主表:180 | 未取得 | 不适用 | 未取得当前精确规则正文；不由主表历史更强/登记/标题推保护或采用通过。；保护行为未取得 |
| 18. babysit.md | 父PRD:754；主表:181 | skills/spec-plan/templates/phase-template.md:241 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 19. shipping.md | 父PRD:754；主表:182 | AGENTS.md:101 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 20. session-pickup.md | 父PRD:754；主表:184 | skills/stage-handoff/SKILL.md:16；skills/stage-handoff/SKILL.md:20；skills/stage-handoff/SKILL.md:32 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 21. pause-safely.md | 父PRD:754；主表:185 | docs/standard-workflow.md:19 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 22. authoring-a-skill.md | 父PRD:754；主表:186 | skills/spec-specify/SKILL.md:157；skills/spec-specify/SKILL.md:163；skills/spec-specify/SKILL.md:165 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |
| 23. worktree-cleanup.md | 父PRD:754；主表:187 | docs/standard-workflow.md:19；docs/standard-workflow.md:55 | 不适用 | 定位既有相关规则；保护行为未执行，原更强结论未重验；保护行为未取得 |

缺口：7项登记未补（setup-pstack、poteto-help、explain-the-number、make-operations-idempotent、type-system、boundary、experience-first），保留本地源指针，具名commit未取得；trace-forensics当前精确规则定位不足，另做定点只读核；shipping耗时、technical计数及各原条其它分落点未全核。以上不增加采用、不补机制、不宣称54/23全验；来源许可本轮未另核，保持未核，不据此补采用或增门。历史direction005 unavailable与已取消复杂验收原状保留，静态表不替代其行为证据。

trace-forensics定点补核：原主表180行指向的phase-template原254行已漂移；实际读当前246–259行及template/spec-plan/verify-code限定语义，未定位“帧归属”的精确同义规则，故保“未取得”。这不是能力缺失或保护失败结论，也不据此新建机制。原件`quality/evidence/2026-10-23-295-p8-trace-protection-narrow-readback.json`，SHA256 `ec83c7e2e945cd545656a2ca3b5bbaa40cb2ba6b440575bde76596bdfec717d4`。

历史定点回源补充：baseline `3068cfd0` 和父PRD日期附近 `6b09d7d` 的同模板254附近均为AC判定/防自证，不含帧归属。后者只是日期线索，不能冒主表认证revision；未核结论不变。原件`quality/evidence/2026-10-23-296-p8-trace-history-narrow-readback.json`，SHA256 `e6a30066aa6cc9d609b92429c791ec503bfdc2083334cee8da3c0a1535adaa50`。

## 实际判定与复算

原八次判定预检292、原始capture索引297均保留。MD/BP各有一次证据quote与匿名答案不匹配，保原始输出并判inconclusive，不删坏引用、不因结果重试。VC正序B／反序A归一化到同一candidate、不同session且packet hash核对，限定已送报告正文的内容比较为candidate win，不代表stage成功。219/220/221的CLI replay均exit0，复算不调用模型。

| pair | 正反实际结论 | 原件／限制 |
| --- | --- | --- |
| make-decision | inconclusive | 219 replay；正序引用invalid，反序有效；timeout部分材料仍真实参与 |
| build-plan | inconclusive | 220 replay；正序引用invalid，反序有效 |
| build-code | candidate win | 修复后305固定完整输入：正序B／反序A归同侧、两独立session，228 replay exit0；原BC两包漏candidate真实.output日志，075 finding与旧capture保留，不用于最终公平比较。076/077独核仅BC集合变化 |
| verify-code | candidate win | 221 replay；正反归同侧，只覆盖实际送入的验收报告/必要证据，不外推完整实现或浏览器效果 |

修复后BC两次为引入缺包bug的必要验证，只新增候选两份已引用的原测试日志，不因旧判官意见择优：其余三pair源ref/hash、缺项与packet sha完全未变，原Spec077独证。十次实际调用（原八次＋修复后BC两次）全部保留；最终固定四pair只取各自正确载荷的正反两次。原两BC不计最终输赢，也未删原件。

同一命令复算范式：`node tools/cli/n11-pairwise-judge.mjs --action=replay --binding=<受控binding绝对ref> --forward=<正序capture.output_ref> --reverse=<反序capture.output_ref>`。219/220/221回执保存真实argv；BC完整输入305、终态309与复算228均已落盘；唯一汇总原件为`quality/evidence/n11-same-condition-eval-20261022/P8-judge-cost.json`。受控binding含源映射，仅本地replay读取，judge只收到中性pair.json。

## 成本四组

以下仅使用P7原八格transport，不含P8判官、修包验证或本会话耗时。raw来源由272逐格绑定完整cell/source/hash，真实数值字段为`/telemetry/duration_ms`，与`/process/duration_ms`逐一交叉一致；wall_s=duration_ms/1000。270曾写错根级pointer，保留原件，消费精确272。timeout仍进分母；这是attempt transport时长，不能冒成功任务延迟。

| 组 | stage | 前 baseline | 后 candidate | 来源／判定 |
| --- | --- | --- | --- | --- |
| ①等待时间 | make-decision | 1658.728 s | 1800.074 s | 下表make-decision两侧raw，/telemetry/duration_ms；wall_s劣化 |
| ①等待时间 | build-plan | 1753.428 s | 1800.045 s | 下表build-plan两侧raw，/telemetry/duration_ms；wall_s劣化 |
| ①等待时间 | build-code | 1378.956 s | 1484.761 s | 下表build-code两侧raw，/telemetry/duration_ms；wall_s劣化 |
| ①等待时间 | verify-code | 1371.366 s | 1204.516 s | 下表verify-code两侧raw，/telemetry/duration_ms；wall_s下降 |
| ②输入/输出/缓存读取 | 四stage各侧均保8格 | input/output/cacheRead均unavailable | input/output/cacheRead均unavailable | P7 transport /usage input_tokens/output_tokens为null；cacheRead来源要求N1 主 Agent台账，但本八格没有同对象前后观测，不能以N1总量充数 |
| ③步骤数 | 四stage各侧均保8格 | unavailable | unavailable | 原八格trace没有统一认可step计数；item.completed不等于steps，不补0 |
| ④调用次数 | 四stage各侧均保8格 | unavailable | unavailable | codex族没有可比工具/子代理/命令调用计数来源；P7与P8模型调用次数不是该指标替代值 |

### 逐格原始来源

固定root为`/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022`。每行JSON原件的绝对ref与原始hash如下；JSON pointer与单位沿上文，不按stage名与其它cohort硬join。

| side／stage | 原始source_ref | SHA256 |
| --- | --- | --- |
| baseline／make-decision | `/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/quality/evidence/n11-p7-same-condition-20261023-r1/baseline/make-decision/stages/make-decision/codex-luna/artifacts/transport/attempt-targeted-make-decision-codex-luna.json` | `03679f1f6f476c298333e9622feb19f7156995709cc8a000efb57993f4c25ad7` |
| candidate／make-decision | `/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/quality/evidence/n11-p7-same-condition-20261023-r1/candidate/make-decision/stages/make-decision/codex-luna/artifacts/transport/attempt-targeted-make-decision-codex-luna.json` | `d880e30a653c407ad4a8d65041263dcdf17f604122e4e1ad1ae07988ce7201ed` |
| baseline／build-plan | `/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/quality/evidence/n11-p7-same-condition-20261023-r1/baseline/build-plan/stages/build-plan/codex-luna/artifacts/transport/attempt-targeted-build-plan-codex-luna.json` | `0b5706637c2a51f457287b0e5a6e791c6a320e349ac6596082b624851f58456d` |
| candidate／build-plan | `/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/quality/evidence/n11-p7-same-condition-20261023-r1/candidate/build-plan/stages/build-plan/codex-luna/artifacts/transport/attempt-targeted-build-plan-codex-luna.json` | `7971885916eff57c3b333f116fcb6d903b39b282b6f982a9e276046d518bec3d` |
| baseline／build-code | `/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/quality/evidence/n11-p7-same-condition-20261023-r1/baseline/build-code/stages/build-code/codex-luna/artifacts/transport/attempt-targeted-build-code-codex-luna.json` | `1abb37166d76d797da845f187e1283f92d3fcb4165a2a436694b657dca7ce128` |
| candidate／build-code | `/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/quality/evidence/n11-p7-same-condition-20261023-r1/candidate/build-code/stages/build-code/codex-luna/artifacts/transport/attempt-targeted-build-code-codex-luna.json` | `4d1dde9e7df740e7431a152fb313ff73d1aaf20cc527858aa5b011e174f99830` |
| baseline／verify-code | `/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/quality/evidence/n11-p7-same-condition-20261023-r1/baseline/verify-code/stages/verify-code/codex-luna/artifacts/transport/attempt-targeted-verify-code-codex-luna.json` | `7ea5f9176a21df6f99f4f9282eec37b93ff32e64ff7a383c18f2871cc53d8e44` |
| candidate／verify-code | `/Users/Hugh/Hugh/Project/ModelTest-n11-same-condition-eval-20261022/quality/evidence/n11-p7-same-condition-20261023-r1/candidate/verify-code/stages/verify-code/codex-luna/artifacts/transport/attempt-targeted-verify-code-codex-luna.json` | `ccaf4f40099dab67e1463a817c8426bfdefbc83c646c7d9b1e5bd0f1c553afc9` |

N1来源能力定点回读275：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n1-main-agent-cost-20261015/main-agent-cost.md`，SHA256 `3b670fb0525fb46cde09cf221932e94e5ab4fb28767b976357da8b459103f341`。第4行有cacheRead 30,919,936，但观测窗口是2026-10-16 N1 build-code全task窗口，不是2026-10-23本次八cell；无同cell/attempt/双侧条件归属。第3/5行incomplete。因此本表cacheRead仍unavailable/unknown，不取该数填前后值；未扫描全会话、未拷贝rollout、未修改台账。

## 结论强度

四个attempt的wall_s和为baseline 6162.478 s、candidate 6289.396 s，增加126.918 s；三stage墙钟劣化、VC下降。该和不是新的任务墙钟测量，不含capture与判官开销，也不证明成功任务性能。全局cacheRead未知、steps未知，不能证明cacheRead与wall_s不劣化，更不能证明steps或cacheRead至少一项改善；成本结论为`inconclusive`，不宣收益。input/output tokens只展示来源能力，不能替代cacheRead。第④组明确unavailable，没有静默省略。

覆盖上限：本固定四pair与四组来源事实；不证明其它provider/cohort、长期趋势、判官与人类金标一致、54/23首次采用或保护行为。P8无浏览器可见实现，UI QA为不适用；判官只读材料，不执行Workboard代码或新浏览器验收。本会话主Agent阶段成本尚未测量，保持整个stage末唯一统计。

## 正式审查处置

唯一OCR原件为任务库`quality/reviews/2026-10-23-085-build-code-phase-p8.json`，两路均`completed`且`parse_outcome=ok`；送达与实际读取分开，原件中的`undetermined`保持，不声称全部材料已读。三项有效问题已修：复算完成状态和会话身份绑定原始transport；补具体本机路径与file URI匿名化，保留业务API路由及HTTPS URL；具名无扩展名文件引用显式列缺失，不把目录前缀当文件。针对性RED231保四个真实失败，GREEN235为31/31；只读复算236确认最终四pair的源集合和正反packet hash完全不变，两个`inconclusive`与两个仅内容层面的candidate win均不变，没有追加判官调用。中间234因目录前缀误分类而失败，保原件，不冒最终验证。

另外三项由原Spec独立回源086判为`rejected_invalid`：用户原问已说明双序规则、答复为“就是用当前provider”（058与主会话真实转录320；后者未送OCR包，不冒平台导出）；实际三源码加两处必要附属修改已有267范围事实，T020窄对齐spec原判据；文档命令块A已有226执行回执，合同未要求另建永久gate。不可变`P8-judge-cost.json`保留审前源码与执行事实，审后修复、独立回读及Git交付另沿具名原件回读，不覆写历史结果，也不把OCR的usage填入P7成本四组。
