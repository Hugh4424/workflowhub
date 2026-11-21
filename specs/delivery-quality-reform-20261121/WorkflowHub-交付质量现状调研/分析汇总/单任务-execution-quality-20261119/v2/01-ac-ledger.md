# 01 · 27 条验收判据台账（execution-quality-build-code-hardening-20261119）

只读提取；未改仓库。原件事实与读码推断分列标注。

## 0. 对象与原件

| 项 | 值 |
| --- | --- |
| 归档 spec | `specs/archive/execution-quality-build-code-hardening-20261119/spec.md`，sha256 `a2ee60247adcb6d3be0cea59b4fb047c0951c7958e395564b4fc0626128aab4b` |
| 归档 decision-log | 同目录 `decision-log.md`，sha256 `2f97e11d6df3f5b034f3aa308e5c28a0df784d355d6d1246a3d8420402225936`（= 对账文引用的 `2f97e11d…` 版） |
| 终末对账 | 任务库 `quality/reviews/2026-11-20-final-ac-reconciliation.md`，sha256 `b0e1b21e039875a73cbae5892333d2776047bfe808678f6f1f28489bb50ae3b1` |
| AC 条数 | 27（`grep -c '^- \[.\] \*\*AC-'` = 27；§14.4 最终 19/1/1/5/1） |

下文缩写：**S**=归档 spec.md；**D**=归档 decision-log.md；**R-AC**=终末对账；**R-P1P6**=`quality/reviews/2026-11-20-p1p6-spec-axis.md`；**R-P7A**=`…-004-…p7-independent-acceptance.md`；**R-P7S**=`…-005-…p7-spec-axis.md`；**R-P8S**=`…p8-spec-axis.md`；**R-P9S**=`…p9-spec-axis.md`；**R-P10T**=`…p10-terminal-review.md`。

## 1. 27 条逐条表

列释义：**判据对象** 证=证据对象（回执/哈希/字节/截图）｜答=答复对象｜文=文档条款｜人=人读判断。**首判** 有=承接 Phase 内有逐条独立首判｜补=事后补审｜无=两者皆无。**并存**=同一判据对象上通过/失败条款被同时读出（见 §1 脚注）。**机判** 机=机器可判｜环=需真实环境可自动采集｜人=只能人读（均据 S 的「判定方式」行）。

| # | AC | 阶段 | 最终档位 | 判据对象 | 证据指针（路径:行 / sha） | 首判 | 并存 | 机判 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | AC-P1-001 | P1 | incomplete | 证 | R-P1P6:27；`quality/tests/2026-11-19-057-p1-current-skill-load-green.json`；R-AC:637 | 补 | — | 机 |
| 2 | AC-P1-002 | P1 | unavailable | 证 | `quality/evidence/build-code/execution-checklist-p1.md:202`；R-P1P6:28 | 补 | — | 环 |
| 3 | AC-P2-001 | P2 | pass | 证 | R-P1P6:29（fail）→R-AC:639；`quality/tests/2026-11-19-084-p2-ac1-human-read.output:3–23` | 补 | 是③ | 人 |
| 4 | AC-P2-002 | P2 | pass | 证 | R-P1P6:30（fail）→R-AC:640；`quality/tests/2026-11-21-029-check-decision-log-chain.output` | 补 | 是④ | 人 |
| 5 | AC-P3-001 | P3 | pass | 证 | R-P1P6:31；`quality/evidence/build-code/p3-package6-simplicity-readback.md`（`2c6135bb…`） | 补 | 是⑤ | 人 |
| 6 | AC-P3-002 | P3 | incomplete | 答 | R-P1P6:32；S:719；D:718 | 补 | — | 人 |
| 7 | AC-P3-003 | P3 | fail | 人 | `quality/evidence/build-code/2026-11-19-003-p3-main-session-report-and-reads.md:23`；R-P1P6:33 | 补 | — | 人 |
| 8 | AC-P8-001 | P4 | pass | 证 | `quality/tests/2026-11-20-122-p4-temp-dir-full.output`（`a8c6ac57…`）；R-AC:644 | 补 | — | 人 |
| 9 | AC-P8-002 | P4 | pass | 证 | `quality/tests/2026-11-20-123-p4-temp-dir-full-verbose.output:9-10`；R-AC:645 | 补 | — | 机 |
| 10 | AC-P4-001 | P5 | pass | 证 | `quality/tests/2026-11-20-120-readiness-p5.json`（`681f21a5…`）；R-AC:646 | 补 | — | 机 |
| 11 | AC-P4-002 | P5 | incomplete | 人 | `quality/evidence/p5-readiness-observation.md:20–64`；R-P1P6:37 | 补 | — | 人 |
| 12 | AC-P5-001 | P6 | incomplete | 人 | `quality/evidence/p6-repair-observation.md:92–95`；R-P1P6:38 | 补 | — | 人 |
| 13 | AC-P5-002 | P6 | incomplete | 证 | `quality/tests/p6-write-set-report.output`；R-P1P6:39 | 补 | — | 人 |
| 14 | AC-P6-001 | P7 | pass | 证 | R-P7A:51（pass）/ R-P7S:13（fail）；R-AC:650 | 有 | 是① | 机 |
| 15 | AC-P6-002 | P7 | pass | 证 | R-P7A:52；`quality/evidence/p7-browser-observation.md`；R-AC:651 | 有 | — | 环 |
| 16 | AC-P9-001 | P8 | pass | 证 | R-P8S:13（能力级）；`quality/evidence/close/2026-11-20-006-close-action.json`；`quality/tests/2026-11-20-181-close-push-task.json` | 有 | — | 人 |
| 17 | AC-P9-002 | P8 | pass | 证 | R-P8S:14（fail）→`quality/evidence/close/2026-11-20-005-close-graph.json`（`af11d223…`） | 有 | — | 人 |
| 18 | AC-P7-001 | P9 | pass | 证 | R-P9S:13；`quality/evidence/close/2026-11-20-013-close-claims-readback.json`（`0481fffa…`） | 有 | — | 人 |
| 19 | AC-P7-002 | P9 | pass | 证 | R-P9S:14；`quality/tests/2026-11-21-004-fix-p9p10-replay-real-target-red.output` | 有 | — | 机 |
| 20 | AC-P10-001 | P10 | pass | 文 | R-P10T:153；`quality/tests/2026-11-21-029-check-decision-log-chain.output`（`4de777c5…`） | 有 | — | 人 |
| 21 | AC-P10-002 | P10 | pass | 文 | R-P10T:154；`quality/evidence/decision-log-refs/requirement-index.md:44,47–50` | 有 | — | 人 |
| 22 | AC-P10-003 | P10 | pass | 文 | R-P10T:155；`quality/evidence/decision-log-refs/findings-evidence-map.md` | 有 | — | 人 |
| 23 | AC-P10-004 | P10 | pass | 文 | R-P10T:156；`quality/tests/2026-11-21-041-p10-four-files-full-r2.output`（`27e5f95d…`） | 有 | — | 机 |
| 24 | AC-P10-005 | P10 | pass（具名缺口） | 人 | R-P10T:157；`quality/evidence/build-plan/2026-11-19-028/029/030` | 有 | 是② | 人 |
| 25 | AC-P10-006 | P10 | pass | 文 | R-P10T:158；`skills/material-writing/SKILL.md` | 有 | — | 人 |
| 26 | AC-P10-007 | P10 | pass | 文 | R-P10T:159；D §4.10 + P5/P8 | 有 | — | 人 |
| 27 | AC-P10-008 | P10 | partial | 文 | R-P10T:160；`quality/tests/log-terminal-effects-r2.output:82` | 有 | — | 人 |

**并存脚注（5 条）**：① P6-001 同一天两份独立原件判 pass（R-P7A:51，13:20）与 fail（R-P7S:13）（R-AC:48）。② P10-005 记 pass 同时自注「若用户不接受，应降 partial」（R-AC:70）。③ P2-001 记 pass，同时明记「commit 字段仍是 `7bdb3ffe`…与本报告判绑定成立不一致」（R-AC:547）。④ P2-002 记 pass，同时自注「若审查要求 10/10 同包原件，则应降回 partial」（R-AC:699）。⑤ P3-001 记 pass，而同包 README 首行明标「超预算，判 fail」（`quality/evidence/p3-package-roles/package-06-page/README.md:1`；R-P1P6:31），且 S:695 本身禁止「同一段并存通过/失败判词」。

## 2. 分布统计（n=27）

| 维度 | 计数 | 占比 |
| --- | --- | --- |
| 档位 pass | 19 | 70.4% |
| 档位 partial | 1 | 3.7% |
| 档位 fail | 1 | 3.7% |
| 档位 incomplete | 5 | 18.5% |
| 档位 unavailable | 1 | 3.7% |
| 判据对象 证据 | 15 | 55.6% |
| 判据对象 答复 | 1 | 3.7% |
| 判据对象 文档 | 7 | 25.9% |
| 判据对象 人读 | 4 | 14.8% |
| 首判 有（Phase 内） | 14 | 51.9% |
| 首判 事后补审 | 13 | 48.1% |
| 首判 无（且无补审） | 0 | 0% |
| 机器可判 机 | 6 | 22.2% |
| 机器可判 环 | 2 | 7.4% |
| 机器可判 人 | 19 | 70.4% |
| 并存 是 | 5 | 18.5% |

**关键交叉（均为原件事实）**

- **tier=pass 但无 Phase 内独立首判：6 条**（AC-P2-001、P2-002、P3-001、P8-001、P8-002、P4-001），占 pass 31.6%、占全表 22.2%。6 条全部由 2026-11-20 之后的补审/终末对账定档（R-P1P6:29–36；R-AC:639-646）。
- 阶段分布：P1–P6 共 13 条（pass 6、incomplete 5、fail 1、unavailable 1）；P7–P10 共 14 条（pass 13、partial 1）。**8 条非 pass 全在 P1–P6。**
- 按判据对象的通过率：证据 12/15（80.0%）、文档 6/7（85.7%）、人读 1/4（25.0%）、答复 0/1（0%）。8 条非 pass 中 4 条（50%）判据对象是人读或答复。
- 按可机判的通过率：机 5/6（83.3%）、环 1/2（50%）、人 13/19（68.4%）。**19 条 pass 里 13 条（68.4%）的判据「只能人读」**，无机器门可复核。
- 档位改判轨迹（原件事实）：4（§0）→6（§9.3）→8（§10.3）→10（§11.3）→14（§12.4）→16（§13.4）→19（§14.4）。**15/19 条（78.9%）的 pass 在终末对账开始后才成立。**

## 3. 判据对象错配清单（通过条件落在答复/文档/人读，而非证据字节）

| AC | 错配类型 | spec 行 | 原文片段（≤40 字） |
| --- | --- | --- | --- |
| AC-P3-002 | 答复 | S:719 | 「U-022 接受该转写」 |
| AC-P10-001 | 文档 | S:1010 | 「当前每包可读完整设计，来源、哈希和答复位置可回读」 |
| AC-P10-002 | 文档 | S:1036 | 「每条源需求均有可追踪去向，缺原件注明责任和恢复」 |
| AC-P10-003 | 文档 | S:1055 | 「B 的包和需求找到独立阶段、依赖和 owner」 |
| AC-P10-004 | 文档 | S:1076 | 「方向包有最初方案及否决缘由，细节逐包有设计」 |
| AC-P10-006 | 文档 | S:1117 | 「记录节例外明确写出；每包十项仍只有 v2 模板一个来源」 |
| AC-P10-007 | 文档 | S:1136 | 「十包各有四项；每项写实际文件、迁移对象、移除项或影响范围」 |
| AC-P10-008 | 文档 | S:1155 | 「B 的包与需求找到独立阶段、依赖和 owner；C 能复查设计覆盖与真实发现处置」 |
| AC-P3-003 | 人读 | S:743 | 「主会话只收对当前决定必要的短摘要与一手来源指针」 |
| AC-P4-002 | 人读 | S:822 | 「预置红结果后相关开发未派发、写集仍与开工前相同」 |
| AC-P5-001 | 人读 | S:841 | 「同一失败连续两轮无新增事实就转查因」 |
| AC-P10-005 | 人读 | S:1098 | 「根因排序有具名证据，每项外部做法给出处、适用性与处置」 |

合计 12/27（44.4%）；其中 8 条（29.6%）真正引用了答复或文档条款，4 条（14.8%）落在人读判断。

## 4. 验收文本漂移（对照 D:712–727 §5.0.1 与 S 现行）

D §5.0.1 记「扩展」6 条、「新增」5 条；新增使 AC 总数 22→27。

| AC | 改前（D 旧行） | 改后（S 现行） | 一句差异 |
| --- | --- | --- | --- |
| AC-P2-002 | D:687「读回执存在且 blob 一致；回执在但下游未读→incomplete」 | S:665-669 | 通过条件从「有回执」升级为「清单引用能读到同包同字节原件」，并加 5 类清单缺陷判失败 |
| AC-P3-001 | D:688「validate-card exit 0；3 份回传 + 冷读/对抗原件」 | S:695 | 新增「卡验收格缺通过/失败/至少一个反例，或同段并存通过/失败判词，判失败」 |
| AC-P3-002 | D:689「U-021 明确全部确认；历史答复按旧包映射」 | S:719-720 | **澄清未落地**：D:718 说 U-022 接受的是「需求 11–14 转写」，S:719 仍写「U-022 接受该转写」（逐包答复语境内） |
| AC-P5-002 | D:693「测试/AC 无改动或每处有具名裁决」 | S:861 | 新增 gate_cmd 裸变量、写集漏派生件、AC 不在写集、需求无 AC 四类具名失败 |
| AC-P8-002 | D:699「无产品库副本/连接」 | S:783-786 | 通过条件收窄到「夹具只使用授权隔离根」，并写明「本条不声称真实入口已证」 |
| AC-P10-001 | D:702「10 包十项齐；索引 14 条 ref+sha+答复位置」 | S:1015 | 新增「baseline 未对 14 条需求全命中，或只认 3 条，判失败」 |

- **改过文本 6 条**：占改前 22 条的 27.3%，占终版 27 条的 22.2%。
- **新增 5 条**：AC-P3-003、P10-005、P10-006、P10-007、P10-008（D:722-726），占终版 18.5%。文本变更合计 11/27（40.7%）。
- 另：编号从 `AC-P1-1` 改为补零 `AC-P1-001`（纯格式，不计入改判）。
- 唯一实质性未对齐 = AC-P3-002：D:718 的澄清没有写进 S:719，导致该条按原文永远无法 pass（R-AC:535、680）。

## 5. 不可证伪项（通过条件无法被任何现有门/测试观察到）

| AC | 不可观察的通过条件 | 证据（无对应门/断言） | 性质 |
| --- | --- | --- | --- |
| AC-P3-003 | 「主会话少读」「先给用户更新再发出依赖该变化的任务」 | `tools/cli` 无读取量/时序检查；`measure-main-agent-cost.mjs:10` 自述「raw quantities only… no score… no benefit claim」，只测不判 | 读码推断 |
| AC-P4-002 | 「相关开发未派发、写集仍与开工前相同」（负向事实） | 无「未发生」类断言；`facts.jsonl` 只记已发生事件，缺记录≠未发生 | 读码推断 |
| AC-P5-001 | 「每两轮分诊」「同锚无新事实转查因」 | `decision-log:730` 明定「不建 `check-repair-log`」；`check-stage-quality.mjs:6` 自述仅扫 metrics/scripts 的 V6 反模式，不判分诊 | 原件+读码 |
| AC-P10-005 | 「根因排序有具名证据」 | 现有门（链检查/四合同）只校文档结构与编号在场，无排序质量断言 | 读码推断 |
| AC-P3-001 | 「每包代理在已确认上限内」 | 事实上超限 7 个代理并明标 fail（`package-06-page/README.md:1–4`；R-P1P6:31），该条仍判 pass → 子句无门约束 | 原件事实 |
| AC-P2-002 | 「下游确实消费同一个交接版本」 | 以 `convergence.complete=true` 回执代判；9/10 包方案卡/冷读/对抗原件始终未取得（R-AC:699） | 原件事实 |

补充：**「下游少返工」不是任何一条 AC 的通过条件**，只出现在需求问题陈述（S:32-33、D:142）；27 条无一条把它写成可判条款。

## 6. 一页结论（可直接进报告）

1. **19 条 pass 里有 6 条（31.6%）没有承接 Phase 的独立首判**，靠 2026-11-20 后的补审与终末对账改档；pass 数从 4 涨到 19 全部发生在对账 6 轮复评内（R-AC §0/§9.3/§10.3/§11.3/§12.4/§13.4/§14.4）。
2. **8 条非 pass 全部集中在 P1–P6**（P1–P6 13 条里 7 条未通过；P7–P10 14 条里 13 条 pass），缺口与「实施期」强相关，与终末文档期无关（R-AC:635-663）。
3. **未通过的 8 条里 4 条（50%）的判据对象是人读或用户答复**，没有任何字节可复核；按判据对象算，人读类通过率 1/4（25%），字节类 18/22（82%）（本表 §2、§3）。
4. **验收文本在 build-plan 审查后改过 6/22（27.3%）、新增 5 条（22→27）**；其中 AC-P3-002 的澄清（U-022 = 需求 11–14 转写）没有同步进 spec，S:719 仍写旧口径 —— 这一处漂移直接造成该条最终只能 incomplete（D:718 vs S:719；R-AC:535）。
5. **附录 A 全文 0 次出现 partial/incomplete**，只定义通过/失败（1 条另给 unknown），而终末对账用 5 档；6 条（22.2%）的最终档位在管辖它的 AC 文本里没有落点，另有 5 条（18.5%）的通过/失败条款在同一对象上被同时读出（S:581-1158；R-AC:26；本表脚注①–⑤）。
