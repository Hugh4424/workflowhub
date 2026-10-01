# PaperBuilder 方案臃肿取证 + simplicity-guard 使用判定

> 来源·产出：card-03 落地流程派发的只读取证子代理（事故取证 / 根因分析；未改仓库任何文件）
> 来源·时间：2026-09-29 18:40（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §18 E14/E15/E16（simplicity-guard 进写作流程）与「加与删同价」的取证前提

取证输入：`/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-live-simulation-durability-post-20260925/specs/paperbuilder-live-simulation-durability-post-20260925/`（spec.md 111,453 B/860 行；decision-log.md 399,067 B/2,217 行；phases/P1–P6 + index 共 1,012 行）＋ 转录 `/Users/Hugh/.codex/sessions/2026/09/25/rollout-2026-09-25T12-36-51-01a0d6da-1328-7873-9acf-cbf439afd194.jsonl`（903 MB / 159,811 行，流式扫描，未整读）。
下文所有 `L####` = 转录行号；`文件:行号` = 材料行号。

## 一、结论（带数字）

1. **原始需求 5 项**（`decision-log.md:88-93`），落地成 **11 模块 M1–M11、20 张卡 T001–T020、6 个 Phase、154 条决策台账条目、748 KB 授权材料**——卡/需求 = 4.0，模块/需求 = 2.2，台账条目/需求 = 30.8，材料 = 149.6 KB/需求。
2. **膨胀的主机制是"每发现一件事就新增一个承载物"**：F-010 候选池 34 条 → 新增 7 个 OI（`decision-log.md:584`）＋ 新增遗漏 7 条（`:644`）＋ 新增模块 M9/M10（`:1058`/`:1066`）。
3. **膨胀的自我否证**：最终 **11/20 张卡被自己标记退役**（T003、T004、T005、T007、T008、T011、T012、T014、T018、T019、T020；`phases/index.md:15-17`、`phases/P4.md:5`），整个 P4 退役，旧 **17 AC 全部退役**只剩 **LC-001–LC-006**（6 条，`phases/index.md:21`）。即 55% 的卡从未需要存在。
4. **缩减是用户逼出来的，不是技能产出的**：用户原话「你加这么判断会搞得很麻烦的」直接废掉一整套创建时判重方案（`decision-log.md:1424`，DEV-04）；Talk R8「任何阈值都不合理」废掉全部阈值判据（Talk Round 8）。**没有任何一条减法来自 simplicity-guard。**
5. **simplicity-guard 判定：名义提及（nominal）**。90 处命中里只有 **3 行 / 1 个真实读取事件**（`L44036`，2026-09-26T07:07:45，一条 `cat skills/simplicity-guard/SKILL.md` 与另 4 个技能文件批量同读）；15 行只是 bundle/哈希清单里的路径出现；其余 **72 行是注册表声明、workflow 散文、审查清单和全局 memory 样板**。
6. **判定的决定性反证**：`simplicity-guard` 的判据词汇 **"P0 不成立" 全转录只出现 3 次，且全部落在同一行 SKILL.md 自身文本的回显里**（`L44036`/`L44039`/`L44118`）——从未作为裁决出现在任何方案评审里。
7. **PaperBuilder 材料里 `simplicity-guard` / `YAGNI` / `四阶梯` 出现次数 = 0**（对 spec.md、decision-log.md、phases/*.md 全量 grep）。技能对本次方案**零痕迹**。
8. **它被声明为 inline，且"声明与执行位置不一致"是被记录在案的待修项**（`L44695`：`simplicity-guard 实际走 provider packet lens 路径需在实施期对齐，记 DEFERRED-008`）。即：既是名义提及，也是被绕过。
9. **同一交付物多处重复**：M11「盘中对照七项核查」在 `spec.md:607` 与 `phases/P2.md:163` 逐行重复；`删除清单` 在 decision-log 出现 12 次，且有**两份"最终"清单**（F-018 `decision-log.md:1598`、F-021 `:1867`）。
10. **需求本身被改动 13 次**（U-001…U-013，`decision-log.md:2128-2196`），且台账里 **"已作废" 20 处、"推翻" 39 处、"历史" 101 处**——材料大部分体量用于承载自己的废弃史。

## 二、臃肿量化表

| 维度 | 数字 | 证据 |
| --- | --- | --- |
| 原始用户需求 | 5 项 | `decision-log.md:88-93` |
| 收敛后声明需求 | 「六项 R-001–R-010」→ 11 模块 | `decision-log.md:120` |
| 模块 | 11（M1–M11，M9/M10 为中途新增） | `decision-log.md:1058`,`:1066` |
| Task 卡 | 20（T001–T020） | `phases/P1–P6.md` |
| Phase | 6（P1–P6）+ index 23 行 | `phases/index.md` |
| 功能需求 FR | 17（RUN3/RESUME2/UNIQUE2/ROLL1/STATE1/CLEAN3/OPS2/QUALITY1/CONTRAST2）；当前分母改写为 FR-LC-001…007 | `spec.md:12-22` |
| 场景 SCN | 11（SCN-001–011） | `spec.md:137-213` |
| 产品事实 PFACT | 17 | `spec.md:225-297` |
| 验收判据 | 旧 17 AC → 现行 **LC-001–LC-006（6）** | `phases/index.md:21` |
| 决策台账条目 | DECL 41 / CUR 26 / DEF 5 / NG 14 / OPEN 14 / OI 29 / RISK 18 / DEV 7 = **154** | `decision-log.md:1268-1507` |
| 证据报告 | F-001…F-027（28 个唯一编号） | `decision-log.md` 全文 |
| 用户驱动需求变更 | 13（U-001–U-013） | `decision-log.md:2128-2196` |
| 未决项 | OPEN-01…OPEN-14 = 14 | `decision-log.md:1375-1394` |
| 非目标条目 | NG 14 | `decision-log.md:1356-1374` |
| 材料体量 | 747,983 B / 4,099 行（spec 111,453 + dlog 399,067 + phases） | 实测 wc |
| 最终退役 | **11/20 卡（55%）**、整个 P4、旧 17 AC | `phases/index.md:15-21` |

**规模 vs 需求判断（可核验）**：以"卡/需求"=20/5=**4.0 倍**、"模块/需求"=11/5=**2.2 倍**、"台账条目/需求"=154/5=**30.8 倍**、"材料字节/需求"=747,983/5=**149.6 KB/需求** 计。保守取卡与模块口径：**方案相对原始需求膨胀 4–30 倍，且其中 55% 的卡最终被判定为不需要**。

## 三、simplicity-guard 分类表（90 行命中，互斥分桶）

| 类别 | 行数 | 含义与代表证据 |
| --- | --- | --- |
| A 真正加载/读取技能文件 | **3**（=1 个事件） | `L44036` exec `cat skills/testing-system-blueprint/SKILL.md; cat skills/simplicity-guard/SKILL.md; cat skills/plan-eng-review/SKILL.md; cat skills/spec-tasks/SKILL.md; cat skills/spec-analyze/SKILL.md`（2026-09-26T07:07:45）；`L44033` 调用记录；`L44118` 压缩摘要回显 |
| B 仅路径出现（bundle/哈希清单，未读内容） | **15** | `L37070` `skills/simplicity-guard/review-bundle.json` 列表；`L45329` find 清单；`L117503` manifest `{"path":"skills/simplicity-guard/SKILL.md","git_blob_oid":"5ab09a72…"}` |
| C 只是提到名字 | **72** | 注册表声明 `L42744` `- { name: simplicity-guard, path: skills/simplicity-guard/SKILL.md, execution: inline, trigger: simplicity_check, bundle: …}`；workflow 散文 `L8303`/`L47383`（`workflows/build-plan/SKILL.md:83`）；审查清单 `L25131`「是否遵守 \`simplicity-guard\` P0–P3、DRY、KISS、YAGNI、SoC」；全局 memory 样板（"永不开源，是 YAGNI"）33 行 |
| D 被否决/被绕过 | **90 中无一处产出的 finding** | 见下 |
| （D 证据）声明与执行不一致被自认 | 1 条 | `L44695`：`③执行模型移植与既有 inline/independent 声明不冲突（F-043 已核对；simplicity-guard 实际走 provider packet lens 路径需在实施期对齐，记 DEFERRED-008）` |
| （D 证据）判据词汇从未作为裁决出现 | 3 行，且全在文件自身回显 | `L44036`/`L44039`/`L44118` 含 "P0 不成立"/"P1 成立"/"P2 成立"，均来自 SKILL.md 正文 |
| （D 证据）PaperBuilder 材料零引用 | 0 次 | 对 spec.md/decision-log.md/phases 全量 grep `simplicity-guard|YAGNI|四阶梯` = 0 |

**明确判定：名义提及（nominal）,且实质被绕过。**
依据三条：① 技能文件在整个 4 天会话中只被"批量 cat"读取 1 次，无一次针对 PaperBuilder 方案的定向加载；② 90 处命中中 72 处是注册表/散文/清单样板、15 处是路径清单，**0 处是该 lens 输出的 finding、P0–P3 裁决或删除建议**；③ PaperBuilder 的 spec/decision-log/phases 里 0 次引用，而同一时期的膨胀（+7 OI、+7 遗漏、+2 模块、20 张卡）全部照常发生。
不是"完全没用上"，因为文件确实被读过一次、且 P0–P3 条款被抄进了 build-code 审查说明；但**教科书式的"挂了名却没执行"**。

## 四、违反清单（SKILL.md 硬要求 → 实际证据）

1. 要求「审查目标不是把缺口变成更多要求，而是找出能删除、复用或缩小的内容」（`skills/simplicity-guard/SKILL.md:18`）→ 违反：F-010 候选池 34 条直接转成**新增 7 个 OI**（`decision-log.md:584`）。
2. 要求「发现额外内容时必须明确建议删除；不得用'以后可能需要'替它保留位置」（`:19`）→ 违反：未核实项被要求「**build-plan 必须逐条转成验证任务**」（`decision-log.md:2113`），而非删除或标 unknown。
3. 要求 P0「必须能对应原始需求、已批准方向、已发生故障或明确硬约束 → 不需要（YAGNI）：跳过」（`:26-29`）→ 违反：M9 API CPU 治理 **Talk R1 已被否**，仅因用户一句 m00607 就重新纳入并排到 M1/M2 之前（`decision-log.md:1430`、`:1060`「§4.1 CUR-04 把 M9/M10 排在 M1/M2 之前」）。
4. 要求禁止「仅因'长期理想架构''以后可能需要'加入、但没有故障证据或硬约束的能力」（`:64`）→ 违反：T003/T004/T005/T007/T008/T011/T012/T014/T018/T019/T020 共 **11 张卡后被标记退役**（`phases/index.md:15-17`、`phases/P4.md:5`）。
5. 要求「只增不删」的反面：修订后旧抽象、兼容层、任务或文字仍被无理由保留（`:66`）→ 违反：材料用 747,983 B 同时保留全文历史（`spec.md:65` "HISTORICAL ORIGINAL SPECIFICATION"、`decision-log.md:68`），"历史" 出现 101 次、"已作废" 20 次、"推翻" 39 次。
6. 要求以 wh-review 冻结 packet lens 形式给出 findings（`:10-12`,`:49-53`）→ 违反：**0 条 simplicity-guard finding 进入 PaperBuilder 任何材料**；其声明与执行位置不一致本身被登记为 DEFERRED-008（`L44695`）。

## 五、可复用的 5 处减法

1. **砍掉 F-010 候选池的 34 条**，OI 只保留直接对应用户 5 项需求的条目（`decision-log.md:579`/`:584`）——这一条就能去掉 7 个 OI。
2. **M9（CPU 治理）与 M10（25 提交质量把关）另开任务**，不并入本任务范围（`decision-log.md:1058`/`:1066`；DEV-05 `:1430`）——直接去掉 2 个模块与 2 个 Phase 的任务密度。
3. **未核实项按技能要求删除或标 `unknown`**，而不是「必须逐条转成验证任务」（`decision-log.md:2113`）——避免把未知变成新增工作。
4. **卡以用户需求为单位、不以风险为单位**：取消从未兑现的 T003/T004/T005/T007/T008/T011/T012/T014/T018/T019/T020（`phases/index.md:15-17`）——20 张卡可缩到 9 张以内。
5. **一个交付物只写一处**：M11 七项核查在 `spec.md:607` 与 `phases/P2.md:163` 二选一；两份"最终删除清单"（F-018 `decision-log.md:1598` / F-021 `:1867`）合一；399 KB 历史 decision-log 下沉 `legacy/`。
