# decision-log — workflowhub-thin-core-card-04-20260919

## 任务身份

| 项 | 值 |
| --- | --- |
| 任务 ID | workflowhub-thin-core-card-04-20260919 |
| 项目 | workflowhub |
| 阶段 | make-decision |
| Worktree | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919` |
| 分支 | `task/workflowhub/workflowhub-thin-core-card-04-20260919` |
| 基线 | `35a881ac3c3288249677597a9079d445949de778` |
| **任务类型** | **普通任务** |

任务类型的判据：本卡要落地的是「验收标准如何写成机器可执行形式 + 测试资产如何系统化落点 + 验收事实如何判定」这一类**实现面**交付，必须讨论文件路径、命令形态、schema 形状、测试记录与实测记录。母任务已按规划任务完成收敛（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`），本卡是它拆出的下游实施卡，因此按普通任务执行，不受规划任务的提问面禁令约束。

## 状态

> 以下早期 step 记录是 D-001…D-008 的历史快照，不代表 2026-09-23 增量方向已经批准。本轮 R-009…R-018 均已记录，其中 R-018 仅许提出并另审最小写面方案，非改代码批准；用户已在 `card04-six-item-detailed-direction` 真实选择「确认方向，继续修订 build-plan」，确认 D-009…D-014 的六项方案和限制可作为新 build-plan 输入（见文件末尾「本轮增量最终确认」）。旧 `## 最终确认` 只覆盖当时八项；当前允许按新决策修订 spec/phases，但这**不是**新 build-plan `human_confirmation`，亦非生产写面许可。

- **当前 step**：step 1（load-context）至 step 8（write-decision-draft）已完成并全部落盘；step 9（detail-advice）的 direction 审查已真实执行并逐条处置（见 `## 审查处置`），detail 审查已真实执行（39 条 findings：blocking 4 / major 28 / minor 7），因审查记录链缺陷只能记为 **advisory 而非 canonical**（缺陷已逐条记录并移交 CARD-05，见 `## 审查处置`）；本卡自身验收标准已按母 PRD 的 AC-16…AC-21 写成可执行形式（见 `## 本卡自身的验收标准（AC-16…AC-21）`）；step 10（approve-decision）已取得真实用户确认，逐字「确认收口，但是不要推进下一阶段」——**用户明确要求停在 make-decision，本卡不进入 build-plan**（见 `## 最终确认`）。
- **step 3 已交付**：6 份研究报告已按 `research-report.v1` 合规化并以内容寻址发布（见 `## 调研`）；合规化前的原件逐字节备份在 `/tmp/wh-an/research/conform/original/`。
- **用户已提前就方向表态（比 step 5 早；逐字见 `## 调研` 的「用户方向表态」）**：不接受为这件事引入新框架或新依赖，要求用零依赖的 vitest 原语 + 规则把纪律立起来。这是真实用户答复而非代答。
- **用户在 step 5 推翻了主会话的问题框架（重要纠偏）**：主会话把「什么算通过」当成方向轴来问，用户明确拒绝——「甲乙丙都不是我要的方案，你的问题就让我感到害怕：什么算通过？然后基于这个问题进行方案选择。最终只会产生一大堆 gate、阻塞」。用户重申本卡目标：**「card-04 的目标不是阻碍任务推进，而是提高交付质量。通过更高质量的验收标准、验收方式、单元测试、端到端测试，来保证当前任务开发的效果符合原始需求，并且最开始设计的用户痛点，能通过真实测试在任务完成后进行处理。而不是现在通过一大堆脚本来确认代码绿了。绿了没有意义，问题真的解决了才有意义！」** 并指出主会话「还是在优化 TDD」。
  ⇒ 主会话据此把方向从「让不诚实/空的验收失败（执法层）」改为「提高验收标准与验收方式本身的质量（质量层）」，并放弃 fail-closed / 新增 gate 作为本卡主线。
- **用户确认新方向（step 5 答复，逐字）**：「没错，这个方向才更合理一些。我要的不是流程正确，而是质量合格」⇒ 本卡准绳定为**质量合格**，不是流程正确；三层方向（验收标准的写法 / 验收方式走真实入口 / 单测与 E2E 的体系化）成立，落地阶段为 make-decision 与 build-plan。
- **step 5–7 已收敛**：三轮 talk 七问 grill 全部闭环，无 high/medium 待答项；模块台账（8 个模块，逐条 `path:line`）已产出并推翻若干早先假定；M1/M2 已由用户裁定（见 `## module-convergence`）。
- **step 7 第 3 问被用户改向（本卡最大范围变化）**：用户裁定「别再浪费精力在 pre 卡上面了，请直接把当前任务类型改成 post」⇒ 本卡 `activation_cohort` 由 `pre` 改为 `post`，post 拓扑跳过 `build-spec`。切换当场暴露一个真缺陷（post 卡在 make-decision 阶段结构性无法启动），已按用户裁定修复 `tools/cli/stage-runtime.mjs`（`+6 −1`），并按 R-002 补记 G-2 豁免——**这是本卡工作面目前唯一的产品代码改动**（详见 `## cohort 切到 post…` 与 `## 审查处置` 的 `### G-2 豁免记录`）。
- **step 8 已交付**：8 条 D 条目与九个主节已拼接进本文件（`## 目标`、`## 范围`、`## 决定`、`## 调研候选交付`、`## 拒绝方案`、`## Supersedes`、`## 文档结果`、`## Exit checks`），`REQUIRED_MAIN_SECTIONS` 只差 `## 最终确认`（step 10）。
- **已就位的模板节**：任务身份、状态、本卡输入与只读边界、原始需求、原始声明层、三级追溯链、发散候选与可证伪大纲、调研、三轮 talk、grill、module-convergence、cohort 切到 post…、目标、范围、决定、调研候选交付、拒绝方案、Supersedes、文档结果、Exit checks、审查处置、非目标、风险、未决项。
- **仍缺的模板节**：`## 最终确认`（step 10，须真实用户确认）、`### D<n>` 高风险事实节（仅在用户声明或三输入判定为高风险时写）。
- `## UI applicability` 与 `## 收敛检查` **已按真实用户答复补写**（`non_ui` + 四维收敛表）：机器 reader 要求 `## 收敛检查` 的四个维度行各自携带真实用户答复（`runtime/stage/stage-content-contracts.mjs:3485` 的 `recordedUserAnswer`），代答正是本卡要修的「自产自判」。两者由 reader 绑定（存在 `## UI applicability` 而无 `## 收敛检查` 会直接报错），故先前一并推迟到 step 10 是必要的：代答正是本卡要修的「自产自判」。`ui_applicability` 作为 completion subject 只在 stage 完成时被要求，推迟不阻塞。
- **本卡交付面的诚实边界**：8 条 D 的 `status` 现为 `proposed（待 step 10 最终确认）`——审查 #7 采纳，最终确认产生前不得自称 confirmed。detail 审查为 advisory 的原因之一是 `importCanonicalReviewResult` 只导不建（`runtime/review/review-record-route.mjs:1951`，详见 `## 审查处置`）。
- **工作面状态**：`git status --short` = ` M tools/cli/stage-runtime.mjs`（`+6 −1`）、`?? docs/adr/0032-acceptance-truth-presentation-and-cohort-parity.md`（已生成、未入库）、`?? specs/workflowhub-thin-core-card-04-20260919/`；HEAD 仍在基线 `35a881ac3c3288249677597a9079d445949de778`，独有提交数 0。

## 本卡输入与只读边界

### 主输入（只读引用）

| 输入 | 路径 | 用途 |
| --- | --- | --- |
| 母任务 PRD（CARD-04 卡面与共享定义） | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`（只读） | 卡面 FR-16 至 FR-21、AC-16 至 AC-21、SD-05/SD-06/SD-13/SD-15/SD-17 |
| 母任务 decision-log（原始需求） | `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md`（只读） | OI-004（验收标准可执行）、OI-013（零机器门禁）、D-001 |
| 本卡 decision-log | `specs/workflowhub-thin-core-card-04-20260919/decision-log.md`（本文件，读写） | make-decision 唯一权威 |
| 兄弟卡归档材料 | `specs/archive/workflowhub-thin-core-card-01-20260919/`、`-02-`、`-07-`（只读） | 返工取证与 AC 质量对照 |
| 返工取证报告集 | `/tmp/wh-an/report-*.md`、`/tmp/wh-an/synthesis.md`、`/tmp/wh-an/session-inventory.md`（只读） | OI-001 的事实底座 |
| 外部基准文章 | <https://www.i-kh.net/p/if-ai-coding-is-lowering-your-code>（要点摘录 `/tmp/wh-an/ref/ikh-7-layers.md`） | OI-003、OI-009、OI-013 的外部参照 |

### 只读边界

- 母任务目录 `specs/workflowhub-thin-core-rebuild-planning-20260919/` **只读**；本卡不改母 PRD、不改母 decision-log、不触发母任务 close。
- 兄弟卡 worktree（`workflowhub-workflowhub-thin-core-card-05-20260919` 等）与其分支 **只读**。
- 归档目录 `specs/archive/**` **只读**。
- `/tmp/wh-an/**` 取证材料**只读**。

### 本卡与兄弟卡的接口面

- 与 **CARD-07** 共享 `make-decision` 的「验收写入步」写面。母 PRD `prd.md:345-346` 规定：**先冻结接口的一方为集成责任方**，另一方在冻结接口上对齐，协调必须发生在 build-plan 之前或不晚于 build-code。
- 与 **CARD-05**（审查工具）边界：CARD-05 拥有 review provider 与审查工具本身；本卡只拥有「验收事实与测试资产的契约」，不得改审查工具实现。
- 与 **CARD-10**（总体集成验收执行）边界：CARD-10 执行整体集成验收；本卡只定义「验收标准如何被写成可执行形式」与「测试资产如何落点」，不执行总体集成验收。

## 原始需求

| ID | 原始需求（逐字要点） | 来源 | 关联 OI | 处置 |
| --- | --- | --- | --- | --- |
| R-001 | 「CARD-04 真实验收与有条件 TDD」：验收标准在 make-decision 即写成可执行形式（条件→系统必须做什么 + 可度量成功标准 + 至少一条失败或边界场景；写不出标 incomplete）；验收 oracle 与实现者分离（测试目录对实现者只读或隐藏）；通过必要条件含「改动前是红的」；机器产物按测试路线适用（硬要求=真实命令 + exit + output + 对应 oracle 证据，trace/JUnit/跳过计数仅在该路线适用时必需，不适用记 N/A + reason）；真实测试失败必修并复验；测试与验收类技能必须真实执行并留执行事实 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:322-352` | OI-002、OI-004、OI-005、OI-006、OI-007、OI-011、OI-016、OI-017 | covered（D-003 逐 AC 执行事实；D-007 测试资产体系化；承载 AC-16、AC-18、AC-20、AC-21） |
| R-002 | 共享定义：SD-05 真实入口联通实跑才算整体完成（代码审查不等于功能验收）；SD-06 有效 RED（环境故障、配置不当、无意义断言不算 RED）、G-2 豁免须补可失败检查或写明理由与风险；SD-13 验收标准五段式；SD-15 质量事实不等于推进许可证；SD-17 零机器门禁（不依赖回执、哈希、快照、材料身份校验） | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:25-96` | OI-006、OI-011、OI-015、OI-016 | covered（D-001 把已算出的真实事实接回给人看；G-2 豁免记录；承载 AC-20、AC-21） |
| R-003 | 母任务 decision-log 的 OI-004（confirmed）：验收标准在 make-decision 就写成可执行形式；只有真实入口联通实跑才能宣称整体完成；**代码审查不等于功能验收**；验收 oracle 与实现者分离（测试目录对实现者只读或隐藏）；通过条件必须含「改动前是红的」；保留 trace、JUnit、跳过计数等机器产物；真实测试失败必须修复复验；测试与验收类技能必须被实际执行且执行事实被记录 | `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md` OI-004 | OI-004、OI-005、OI-007、OI-011 | covered（D-001、D-003；承载 AC-16、AC-21） |
| R-004 | 用户逐字（m00006 第 5 条）：以 i-kh.net 文章为参考，仔细设计整个 workflowhub 的验收标准、测试流程、真实验收，让每个通过 workflowhub 开发的项目有完整的单元测试和端到端测试，**而不是做一个功能补一点测试**，避免功能多了之后测试文件大量堆积、完全没有系统化考虑和优化 | 本会话用户消息 | OI-003、OI-008、OI-009、OI-010、OI-013 | covered（D-006 真实入口库存；D-007 测试资产体系化；承载 AC-16、AC-20） |
| R-005 | 用户逐字（m00314）：希望 card-04 以 i-kh.net 文章为参考，仔细设计整个 workflowhub 的验收标准、测试流程、真实验收；让每个通过 workflowhub 开发的项目能有完整的单元测试和端到端测试；而不是做一个功能补一点，导致功能多了之后大量测试文件，完全没有系统化的考虑和优化 | 本会话用户消息 | OI-002、OI-003、OI-008、OI-009、OI-010 | covered（D-005 阶段末报告；D-007 测试资产体系化；承载 AC-16、AC-20） |
| R-006 | 外部基准文章七层防御：L1 需求写对（让 AI 审需求与技术设计找缺口与意外交互）、L2 单测覆盖 >95% 且**不能让 agent 为自己刚写进去的 bug 顺手写一批能通过的测试**（5 步模式：先想用例、写用例、写实现、跑用例修问题、按需求回填缺口）、L3 人工测试不可替代、L4 大量自动化 E2E（最重要，理想在 PR、stage 环境、生产三处跑，**不是人工测试的替代品**）、L5 AI 代码质量专项 pass（单开一个 pass 专找一类问题）、L6 人 + AI PR review（AI review 会过度吹毛求疵，需再有一个 pass 剪掉无意义评论）、L7 监控告警 | <https://www.i-kh.net/p/if-ai-coding-is-lowering-your-code>（本地 `/tmp/wh-an/ref/ikh-7-layers.md`） | OI-003、OI-009、OI-013 | covered（D-003、D-007；覆盖率为诊断非门，见 `## 拒绝方案`） |
| R-007 | 用户纪律：按标准 WorkFlowHub 开始本改进任务，先创建 worktree，从 make-decision 开始，**不要跳阶段**；主会话只进行任务规划、子代理派发和交互类技能（Talk、Grill）执行，不做大量阅读与执行 | 本会话用户消息 | OI-001 | covered（流程纪律类：以本卡阶段材料与阶段记录兑现，无产品载体；见 `## 状态`） |
| R-008 | 用户对返工根因的追问：验收标准是不是设计得很差？每个 phase 和 task 的单元测试与端到端测试是不是质量非常差？为什么每个任务一直有各种遗漏和返工？如何通过 make-decision 和 build-plan 仔细设计验收标准与测试流程，保证每个 phase 与 task 高质量交付、减少返工？ | 本会话用户消息 | OI-001、OI-004 | covered（D-007 测试资产体系化；残余盲区登记为覆盖限制，见 `## 调研候选交付`） |
| R-009 | 用户 m02822 六项原话逐条列在「本轮原始补充与现状」的 U-6；本行仅为索引，不能用摘要替代原话。 | 用户质量核查请求 m02822 | OI-019…OI-024 | 六项均待按原话验收 D-009…D-014；尚未获本轮最终确认，不能标已覆盖。 |
| R-010 | 返回 make-decision、六项由 CARD-04 负责且不要求 CARD-05 新增改动。 | 用户请求 m02902、结构化答复 m02962 | OI-021、OI-024 | 待批准草案 D-009、D-014；实施禁止写面仍有效。 |
| R-011 | 每个项目维护一份可复用的统一测试用例库。 | 结构化答复 m02966 | OI-019、OI-022 | 待批准草案 D-010、D-011。 |
| R-012 | 依据风险/交付面选实测，显式 N/A；同任务修复复测并保留旧证据。 | 结构化答复 m02966 | OI-020、OI-023 | 待批准草案 D-012、D-013、D-014。 |
| R-013 | 项目级业务用例索引关联原位可执行测试，任务事实保存实跑结果。 | 结构化答复 m02976 | OI-019、OI-022 | 待批准草案 D-010、D-011。 |
| R-014 | 各项目仓库版本化统一库，首批 CARD-04 与受影响回归，其余存量未盘点。 | 结构化答复 m02982 | OI-019、OI-024 | 待批准草案 D-010；不宣称全量完成。 |
| R-015 | 用户解释「代码测试」为按改动执行可失败的自动代码检查（类型/构建/静态规则/合同等），人工审查另列。 | 本轮 `meaning-code-test` 结构化答复，见本文件「本轮原始补充与现状」R-015 | OI-023 | 待批准草案 D-011、D-012；术语解释不是方案批准。 |
| R-016 | 用户解释「UI 实机」为真实浏览器连接实际服务操作真实页面并留截图/网络/控制台；设备特性另需物理设备。 | 本轮 `meaning-real-device-ui` 结构化答复，见本文件「本轮原始补充与现状」R-016 | OI-023 | 待批准草案 D-011、D-012；浏览器接线尚未实现。 |
| R-017 | 用户选择在现有 verify-code 最后确认位置完成机器测试、独立审查后的授权业务验收，不另增阶段。 | 本轮 `post-verify-acceptance-time` 结构化答复，见本文件「本轮原始补充与现状」R-017 | OI-024 | 待批准草案 D-014；时点解释不是最终确认。 |
| R-018 | 若 CARD-05 落地后证明后台影响真实页面的官方逐 AC 浏览器证据必须触及原保护的 `runtime/stage/**`，允许 CARD-04 **提出**有负控的最小改动方案并另行审查，非立即批准改代码。 | 本轮 `card04-post-browser-protected-write` 真实结构化答复（选择「允许 CARD-04 提出最小改动并另行审查」） | OI-023、OI-024 | 条件研究授权；具体文件、写面及实现仍待单独批准，整轮方案未获最终确认。 |

## 核心需求

本卡的核心需求是让 WorkFlowHub 交付的每一张卡都真正「质量合格」，而不是「流程走完」：验收标准必须在 make-decision 阶段就写成用户不读代码也能判真假的可执行形式（条件到系统行为、可度量成功值、至少一条失败或边界场景、一条真跑命令与期望输出）；验收必须走真实入口联通实跑，代码审查不等于功能验收，单元测试不得冒充验收；单元测试与端到端测试必须有系统化设计（模块与层级矩阵、落点与命名与规模规则、反膨胀预算），而不是做一个功能补一点测试，覆盖率只作诊断不作门。当前证据显示，四条已交付卡各自带着结构性不可通过或无真实消费者的验收装置与无人消费的校验器进入交付，因此本卡的目标是：把已经算出来的真实事实接回给人看、把缺口如实登记为「没做到」与覆盖限制，而不是靠一大堆脚本确认代码绿了。

## 原始声明层

逐字保留用户在本次任务中的原话，后续任何转述都必须能追溯回这里。

- U-1（m00006 第 5 条）：「以 <https://www.i-kh.net/p/if-ai-coding-is-lowering-your-code> 为参考，仔细设计整个 workflowhub 的验收标准、测试流程、真实验收，让每个通过 workflowhub 开发的项目有完整的单元测试和端到端测试，而不是做一个功能补一点测试，避免功能多了之后测试文件大量堆积、完全没有系统化考虑和优化。」
- U-2（m00314）：「我希望当前的 card-04 任务能以"<https://www.i-kh.net/p/if-ai-coding-is-lowering-your-code>"为参考，仔细设计整个 workflowhub 的验收标准、测试流程、真实验收。让每个通过 workflowhub 开发的项目能有完整的单元测试和端到端测试。而不是做一个功能补一点，导致功能多了之后大量测试文件，完全没有系统化的考虑和优化！」
- U-3（m00006）：「先派出多个子代理仔细研究如下 build-code 和 verify-code 的会话，看看这些任务的验收标准是不是设计的很差？每个 phase 和 task 的单元测试和端到端测试是不是质量非常差？为什么每个任务一直有各种遗漏和返工？如何通过 make-decision 和 build-plan 仔细设计任务的验收标准、测试流程，保证每个 phase 与 task 高质量交付、减少返工？」
- U-4（m00006）：「主会话只进行任务规划、子代理任务派发和交互类技能（Talk、Grill）的执行，不要进行大量阅读和执行任务」。
- U-5（母任务语料中的用户原话，逐字，来自 card-07 build-plan 会话）：「有严重问题…现在这些 phase 文件极其简陋，丢失了大量实现细节！请检查 phase 技能在哪里？phase 文件模板在哪里？为什么会质量这么差？」，以及「build-plan 还没结束啊，spec 和 phase 改动也没提交到 main 啊，怎么就开始 build-code 了？我没同意！」

## 三级追溯链

### 需求框架

framework: functional

选择理由：本卡是「把验收与测试从口头契约变成机器可判定契约」的实施型改进任务，天然按「背景、问题、目标、方案、验收、扩展」的链序推进；每个节点都对应一组 OI 记录与可证伪假设，故取 functional 框架而非时序框架。

回填规则：每一步新产生的事实只允许回填到已存在的框架节点；若某个事实无法挂到任何现有节点，必须新增节点并在下一步的 OI 记录里显式引用，禁止静默丢弃。

| 节点 | 承重内容 | 状态 | 证据状态 | 证据归属 | 下一次复核触发 |
| --- | --- | --- | --- | --- | --- |
| 背景 | 5 个 build-code 与 verify-code 会话的返工轨迹、四张已归档卡的验收材料审计、178 个会话的全量清点 | 已完成 | 充足 | 独立子代理（11 份报告）+ 主会话一手复核 | 进入 step 8 写决定前 |
| 问题 | 卡面窄范围与用户体系级诉求之间的交付边界；返工根因排序 | 开放 | 部分 | 主会话 + step 5 Talk | step 5 outline-talk 用户答复 |
| 目标 | 「完整单测 + 端到端测试」的可度量目标与判据 | 开放 | 待补 | step 5 Talk | step 5 outline-talk 用户答复 |
| 方案 | AC 机器契约、验收权威分离、有效 RED、机器产物适用矩阵、测试资产架构、完整性度量、防膨胀 | 开放 | 部分 | step 3 发散 + step 4 direction-advice + step 6 grill | step 6 结束后 |
| 验收 | 验收事实的真假判定、本卡自身的 AC 如何不自证 | 开放 | 待补 | step 3 与 step 4 + 独立来源 | step 8 |
| 扩展 | 与 CARD-05 和 CARD-10 的边界、E2E 入口登记与 CI 接线、可后置技术项 | 开放 | 部分 | step 6 grill + step 9 detail-advice | step 11 |

### 唯一 OI 大纲（current authority，outline_version: v2）

本文件**只有这一份** OI 清单，是当前唯一权威。后续任何 OI 的新增、改写或关闭都必须在本节内就地更新，禁止另建第二份清单（不生成 `oi.md`、不生成 `open-items.md`、不生成 plan.md 与 tasks.md 双写）。

#### Framework nodes

| framework_node | 节点 | oi_ids |
| --- | --- | --- |
| background | 背景：返工轨迹与材料审计的事实底座、项目回归历史 | OI-001, OI-019 |
| problem | 问题：交付边界、返工根因与业务效果证据 | OI-002, OI-020 |
| goal | 目标：可度量的「完整单测 + 端到端测试」、本卡六项责任 | OI-003, OI-021 |
| solution | 方案：AC 契约、权威分离、有效 RED、机器产物适用矩阵、测试资产架构 | OI-004, OI-005, OI-006, OI-007, OI-008, OI-009, OI-010, OI-022 |
| acceptance | 验收：验收事实真伪判定、适用测试与本卡自证问题 | OI-011, OI-012, OI-014, OI-015, OI-016, OI-023 |
| extension | 扩展：边界划分、E2E 入口与接线、可后置项 | OI-013, OI-017, OI-018, OI-024 |

#### Fixed categories

| category | oi_ids | empty | reason |
| --- | --- | --- | --- |
| complete_user_flow | OI-003, OI-013, OI-014, OI-019 | false | 用户完整流程落在「make-decision 写验收 → build-plan 翻译 → build-code 有条件 TDD → verify-code 真实入口验收」这条链上 |
| page_scope | OI-023 | false | 旧范围 canonical ui_applicability 曾为 non_ui；本轮写面与三输入尚未冻结，当前 CARD-04 是否仍 non_ui 须重核；系统交付仍须支持未来 UI 及后台影响的真实页面消费者，不声称当前本卡已经 UI 实跑 |
| data_state | OI-001, OI-007, OI-008, OI-009, OI-010, OI-015, OI-022 | false | 证据底座、机器产物适用矩阵、测试资产落点与覆盖率度量都属数据状态面 |
| success_failure_boundary | OI-002, OI-004, OI-005, OI-006, OI-011, OI-012, OI-016, OI-020, OI-021 | false | 验收契约的可判定性与失败面是本卡的核心边界 |
| non_goals | OI-017 | false | 防膨胀约束与排除项共同划定不做的事 |
| deferred | OI-018, OI-024 | false | 可后置技术项集中在本条 |

#### OI records and consumers

历史条目的 `selected_disposition` 保留当时「已关闭/被取代」的原叙述；`status: open` 是当前机器词表中未满足新一轮终态字段及最终确认的诚实投影，不撤销 D-001…D-008 的历史确认。新增 OI-019…OI-024 同样等待本轮真实确认；旧条目与新增条目统一为 v2，避免让旧版本掩盖新问题。

```yaml
- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-001
  category: data_state
  framework_node: background
  source: R-007, R-008
  question: 现有返工取证（5 个会话加 4 张归档卡加 178 个会话清点）是否足以定位「遗漏与返工」的主因，还是仍有需要补证的关键盲区？
  status: open
  selected_disposition: 已关闭。取证充分性成立：五份 Codex 会话取证与四张归档卡审计足以支撑本卡使用的三类根因。残余盲区如实登记为覆盖限制（R6 §5 的计数与 card-05/card-07 的 A/B/C 分级为单一来源、未经独立复算），不做补证。承载 D-007。
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  consumers: [step3-research, step8-decision]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-002
  category: success_failure_boundary
  framework_node: problem
  source: R-001, R-005
  question: CARD-04 的交付边界该按卡面窄范围（只做 make-decision 的 AC 写入契约与 oracle 分离）收口，还是按用户两次强调的体系级诉求（整个 workflowhub 的验收标准、测试流程、真实验收）扩边？
  status: open
  selected_disposition: 已收敛为有界体系级：交付面覆盖整个 workflowhub 的验收与测试纪律，但实现只落在本卡切片与既有载体上；与 CARD-05/CARD-06/CARD-07/CARD-10 的硬边界见 `## 非目标`。用户已在 step 5 明确否决「以新增阻断门为主线」。承载 D-001..D-008 全体。
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: G-card04-01
  consumers: [step5-talk, step8-decision, card05-interface, card10-interface]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-003
  category: complete_user_flow
  framework_node: goal
  source: R-004, R-005, R-006
  question: 「每个通过 workflowhub 开发的项目有完整的单元测试和端到端测试」要落成什么可度量目标，才能既机器可判又不沦为「补一点测试」？
  status: open
  selected_disposition: 已收敛为可度量目标：按模块与测试层级的矩阵登记（登记率可数）+ 覆盖率为诊断而非门；度量口径与落点在 D-007，规则文本落点押后到 build-plan（D-008）。
  impact_dimensions: [goal, acceptance]
  requires_user_decision: true
  visible_group_id: G-card04-01
  consumers: [step5-talk, step8-decision]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-004
  category: success_failure_boundary
  framework_node: solution
  source: R-001, R-003, R-008
  question: 验收标准的「可执行形式」具体是什么机器契约（条件与行为、可度量成功标准、至少一条失败或边界场景、真实命令加 exit 加 output、对应 oracle 证据），以及写不出来时如何 fail-loud 标 incomplete 而不是留空？
  status: open
  selected_disposition: 已收敛：本卡定义「验收标准写法契约」（条件与行为、可度量成功标准、至少一条失败或边界场景、一条真实可跑命令与期望输出），写入点沿用既有 spec 与 phase 材料，不在 make-decision 新增机器校验器；写成不出的项如实标 MISSING。承载 D-003、D-008。
  impact_dimensions: [acceptance]
  requires_user_decision: true
  visible_group_id: G-card04-02
  consumers: [step3-research, step8-decision, card07-interface]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-005
  category: success_failure_boundary
  framework_node: solution
  source: R-001, R-003
  question: 「验收 oracle 与实现者分离（测试目录对实现者只读或隐藏）」在单 worktree 的宿主环境里用哪种形态落地才真的可执行、可验证，而不是又一条自律条款？
  status: open
  selected_disposition: 已收敛为能力降级并显式披露：本卡不做物理隔离（单 worktree 宿主做不到硬隔离），改为异源上下文产出 + provenance 记录；无法建立独立判定者时如实标 incomplete 而非声称通过。承载 D-003、D-007。
  impact_dimensions: [acceptance]
  requires_user_decision: true
  visible_group_id: G-card04-02
  consumers: [step3-research, step5-talk, step8-decision]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-006
  category: success_failure_boundary
  framework_node: solution
  source: R-001, R-002
  question: 「有效 RED」的判据是什么（环境故障、配置不当、无意义断言不算 RED），G-2 豁免在什么条件下允许、必须披露什么？
  status: open
  selected_disposition: 已关闭。本卡不新建 RED 判定器（零新增门）。RED 不可得时如实记 `unavailable` 并计入报告「没做到」部分；G-2 类豁免走既有人写声明面（`exceptions` 必填理由、空数组不合法）。承载 D-004、D-005。
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  consumers: [step3-research, step8-decision]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-007
  category: data_state
  framework_node: solution
  source: R-001, R-003
  question: 机器产物的「按测试路线适用」矩阵怎么定义，才能让缺适用产物必然失败、缺不适用产物（已记 N/A 加 reason）不失败，且不重新引入 SD-17 禁止的哈希与回执门禁？
  status: open
  selected_disposition: 被取代。「缺适用产物必然失败」与用户裁定的「缺事实只记录、印在报告最前、不阻断推进」直接冲突；矩阵降为事实记录，N/A 必附理由，不设失败判定。承载 D-004、D-007。
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  consumers: [step3-research, step8-decision]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-008
  category: data_state
  framework_node: solution
  source: R-004, R-005
  question: 测试资产的落点规则怎么定（模块与测试层级矩阵），才能止住「所有测试溢进 tests/contract」的结构性淤积？
  status: open
  selected_disposition: 已收敛：落点规则 = 模块×层级矩阵 + 就近放置 + 反膨胀预算（文件大小、孤儿文件、契约测试占比），全部以事实与预算形式落在既有 `tools/architecture/complexity-report.mjs` 与 `tests/contract/repository-inventory.test.mjs` 载体上，不新增门。承载 D-007。
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: G-card04-03
  consumers: [step3-research, step5-talk, step8-decision]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-009
  category: data_state
  framework_node: solution
  source: R-004, R-005, R-006
  question: 覆盖率要不要、以及如何变成可度量门槛（目标值、测量手段、按模块分摊、与现有 build-plan 与 build-code 步骤的接线点）？
  status: open
  selected_disposition: 已收敛为拒绝：不设覆盖率门（`## 拒绝方案` A 组「全局行覆盖率百分比门」已列否决理由——覆盖率抓不到本卡已审计缺陷中的任何一类）；覆盖率只作诊断事实。承载 D-007。
  impact_dimensions: [acceptance]
  requires_user_decision: true
  visible_group_id: G-card04-03
  consumers: [step3-research, step5-talk, step8-decision]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-010
  category: data_state
  framework_node: solution
  source: R-004, R-005
  question: 测试资产的防膨胀硬约束怎么定（命名去任务化、每模块文件数与行数上限、合并与退役规则），才能让测试随功能增长而不堆积？
  status: open
  selected_disposition: 已收敛：防膨胀以既有 budget 机制表达（`budget()` + baseline + waiver map），不新增 schema、不新增阻断门；已知该预算基线今天已被超限 6/8，本卡以事实呈现。注：审查 finding F-46675f3a53b3 指出本条曾误挂在 `non_goals` 类别下，实际是核心交付而非非目标。承载 D-007。
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: G-card04-03
  consumers: [step3-research, step5-talk, step8-decision]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-011
  category: success_failure_boundary
  framework_node: acceptance
  source: R-001, R-002, R-003
  question: 验收事实由谁产出、由谁判定、什么条件下必须阻断推进，才能让「诚实标注 incomplete 与未证实」真的变成失败面而不是继续绿？
  status: open
  selected_disposition: 已关闭：不新增阻断门。诚实标注（incomplete／未证实）印在阶段末报告最前，作为事实暴露，不作为推进许可或阻塞条件。审查 finding F-7850fbcdb42b（blocking）指出的问法冲突即由此裁决消解。承载 D-005。
  impact_dimensions: [acceptance]
  requires_user_decision: true
  visible_group_id: G-card04-04
  consumers: [step3-research, step5-talk, step8-decision, card05-interface]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-012
  category: success_failure_boundary
  framework_node: acceptance
  source: R-001, R-003
  question: 本卡自己的 AC 怎么写、由谁写、由谁执行，才能不重复四张卡「实施者自己写验收矩阵、自己判自己通过」的老路？
  status: open
  selected_disposition: 已收敛：本卡 AC 由异源子代理上下文产出、由真实入口库存与逐 AC 执行事实回读；实施者不得自产自判验收矩阵。审查 finding F-cdc5f1c9e5e5 指出的本卡首次破例（make-decision 期间改了生产代码却未走 G-2 豁免）已按 R-002 补记豁免理由与风险。承载 D-003、D-006。
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  consumers: [step8-decision, build-plan, verify-code]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-013
  category: complete_user_flow
  framework_node: extension
  source: R-004, R-005, R-006
  question: 端到端测试的入口登记与真实运行（PR 与 stage 环境接线，现状找不到 CI 配置）在本卡做到哪一步，与 CARD-10 的总集成验收执行怎么分界？
  status: open
  selected_disposition: 已关闭。本卡只定义入口登记与测试资产落点规则（D-006）；真实运行的规模与 CI 接线不在本卡，CARD-10 拥有整体集成验收。与兄弟卡的接口冻结顺序留在 OPEN-006（build-plan）。
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: G-card04-05
  consumers: [step5-talk, step8-decision, card10-interface]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-014
  category: complete_user_flow
  framework_node: acceptance
  source: R-001, R-002
  question: 用户走完整流程时，在哪个具体步骤、看到什么可回读的东西，才算「验收标准真的被写成可执行形式并被执行过」？
  status: open
  selected_disposition: 已收敛：用户走完整流程时，在 build-code／verify-code 阶段末看到阶段末报告（机器渲染、印在聊天里的「做到了什么／没做到什么／没做到的原因／需要你做什么」）与逐条 AC 的可读验收视图；不做 UI。承载 D-005。
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  consumers: [step5-talk, step8-decision, verify-code]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-015
  category: data_state
  framework_node: acceptance
  source: R-002, R-003
  question: 验收条目与测试资产账本的状态口径怎么统一（SD-03 窄状态集），才能保证 unverified 永不被写成 succeeded、incomplete 不被当作可交付？
  status: open
  selected_disposition: 已关闭。沿用既有词表、不新增状态机；机器判定类（missing／inconsistent／incomplete／failed／unavailable）与人写声明类（coverage_limits／exceptions）两分且不得互相顶替。承载 D-004。
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  consumers: [step8-decision, build-plan]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-016
  category: success_failure_boundary
  framework_node: acceptance
  source: R-001, R-002, R-003
  question: 失败面到底包含哪些（缺适用产物、伪造产物、只有 GREEN 无 RED 且无豁免披露、AC 判不了真假、审查通道不可用、验收矩阵由实施者自产自判），每一条对应什么可机判的失败信号？
  status: open
  selected_disposition: 已收敛：失败面按逐条枚举记录——缺适用产物、伪造产物、只有 GREEN 无 RED 且无豁免披露、AC 判不了真假、审查通道不可用、验收矩阵由实施者自产自判；每条如实呈现为事实，不增设机判失败信号（与 OI-007 的被取代一致）。承载 D-004、D-005。
  impact_dimensions: [acceptance]
  requires_user_decision: true
  visible_group_id: G-card04-04
  consumers: [step3-research, step5-talk, step8-decision]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-017
  category: non_goals
  framework_node: extension
  source: R-001
  question: 哪些内容必须明确排除在本卡之外（CARD-05 的审查工具与 review provider、CARD-10 的总体集成验收执行、CARD-06 的 wh-review 移除、真实生产监控告警），以免本卡扩边成第二个母任务？
  status: open
  selected_disposition: 仍开放。与 CARD-05／CARD-07／CARD-10 的接口冻结顺序属跨卡问题，移交 build-plan（OPEN-006）；本卡内的排除项已由 `## 非目标` 七条固定。
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: G-card04-05
  consumers: [step5-talk, step8-decision]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-018
  category: deferred
  framework_node: extension
  source: R-001, R-004
  question: 哪些技术项可以后置到本卡 build-plan 或后续卡（oracle 分离的具体实现形态、覆盖率阈值是否挂 ADR 0027、CI 接线、存量测试资产的迁移与合并）？
  status: open
  selected_disposition: 部分收敛。CI 接线、覆盖率阈值是否挂 ADR-0027、存量测试资产的迁移与合并仍后置；**「oracle 分离的具体实现形态」采纳审查 finding F-d519f2a80c62，从可后置清单移出**，由其在本卡确立方向（OI-005 的答案）并在 build-plan 落地。承载 D-003、D-008。
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  consumers: [step8-decision, build-plan]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-019
  category: complete_user_flow
  framework_node: background
  source: R-011, R-013, R-014
  question: 项目跨 feature 如何查找、维护并执行稳定的业务回归用例？
  status: open
  selected_disposition: 仓库版本化的一份项目级业务用例索引，关联原位测试；先收本卡及受影响回归，其他存量标未盘点。
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  consumers: [step8-decision, build-plan]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-020
  category: success_failure_boundary
  framework_node: problem
  source: R-009, R-012
  question: 如何避免形式上的测试绿掩盖业务效果失败、修复后仍沿用旧证据？
  status: open
  selected_disposition: 需求到业务 oracle 与真实入口；保留失败原件、同任务修复及受影响重测的新证据。
  impact_dimensions: [acceptance]
  requires_user_decision: true
  consumers: [step8-decision, build-plan]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-021
  category: success_failure_boundary
  framework_node: goal
  source: R-010
  question: 六项质量结果由谁完成，是否要求 CARD-05 新增改动？
  status: open
  selected_disposition: 六项结果由 CARD-04 负责；不要求 CARD-05 新增改动；仍须核对其实际落地差量及旧禁止写面的边界。
  impact_dimensions: [scope]
  requires_user_decision: true
  consumers: [step8-decision, build-plan]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-022
  category: data_state
  framework_node: solution
  source: R-011, R-013
  question: 用例索引、原位测试代码、spec/Phase 和任务执行事实分别承载什么？
  status: open
  selected_disposition: 项目级索引仅存场景与测试引用；计划关联稳定 ID；代码保持原位；真实结果留在任务事实。
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  consumers: [step8-decision, build-plan]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-023
  category: page_scope
  framework_node: acceptance
  source: R-009, R-012
  question: UI、API、外部依赖及业务效果的实际测试何时适用，不可用时如何判定？
  status: open
  selected_disposition: 依交付面与风险实测；非适用写理由，缺真实环境记 unknown/unavailable，不能算通过。
  impact_dimensions: [acceptance]
  requires_user_decision: true
  consumers: [step8-decision, build-plan]

- task_id: workflowhub-thin-core-card-04-20260919
  outline_version: v2
  oi_id: OI-024
  category: deferred
  framework_node: extension
  source: R-010, R-014
  question: 尚未盘点的存量功能以及 CARD-05 实际交付差量如何处置？
  status: open
  selected_disposition: 本卡只种下本卡及受影响回归；其他存量渐进纳入；CARD-05 落地前不推定重叠实现已完成。
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  consumers: [step8-decision, build-plan]
```

consumers 说明：`step3-research` 表示 step 3 发散引擎必须为该 OI 产出带来源的候选；`step5-talk` 表示该 OI 必须在 outline-talk 里向用户提出真实问题；`step8-decision` 表示该 OI 必须在 step 8 写入三档结论；`card05-interface`、`card07-interface`、`card10-interface` 表示该 OI 的结果会被兄弟卡或母任务消费。

## 发散候选与可证伪大纲

本节是本卡在模糊需求下的发散留痕。用户对 CARD-04 的诉求存在两个方向（R-004 与 R-005 的体系级设计方向，与 R-001 的卡面窄契约方向），故发散是必需的。

### 角度（angles）

| 角度 ID | 角度 | 来源 | 强度 |
| --- | --- | --- | --- |
| A-001 | 从真实会话的返工轨迹倒推，看验收契约究竟在哪一步失效 | 5 份 build-code 与 verify-code 会话取证报告，加 178 个会话全量清点 | high |
| A-002 | 直接审计四张归档卡的验收材料，量化有多少条 AC 根本判不了真假 | 4 卡规格与测试质量审计（81 条 AC 的 A、B、C 定级） | high |
| A-003 | 拿外部七层防御当尺子量本仓，并清点仓内已有却没人接线的机制 | i-kh.net 文章，加测试体系设计报告 | medium |
| A-004 | 对比现流程与旧流程的净变化，确认优化不是走回头路 | 流程对比报告（现 build-plan 对比旧 build-spec 加 build-plan） | medium |

### 候选（candidates）

| 候选 ID | 候选 | origin | angle/source |
| --- | --- | --- | --- |
| U-001 | 让每个通过 workflowhub 开发的项目拥有完整、系统化的单元测试与端到端测试，避免「做一个功能补一点测试」造成测试文件堆积 | user | R-004, R-005 |
| U-002 | 设计整个 workflowhub 的验收标准与测试流程，使每个 phase 与 task 的定义与测试质量可被判定，从而减少遗漏与返工 | user | R-004, R-008 |
| N-001 | 把「可执行验收形式」做成 make-decision 的唯一写入面，写不出可执行形式的验收条目即 fail-loud 标 incomplete，禁止留空或占位 | internal | A-001, R-001, R-003 |
| N-002 | 把验收权威分离从自律条款变成物理隔离：验收 oracle 与测试由独立上下文的子代理产出，实现者只读，并把来源 provenance 记入事实 | internal | A-002, R-001, R-003 |
| N-003 | 测试资产的淤积是结构问题而非态度问题：用模块与测试层级的落点矩阵、覆盖率度量与每模块预算上限解决，并复用仓内已有账本 | internal | A-003, R-004, R-005, R-006 |
| N-004 | 严格按卡面窄范围收口：本卡只做验收标准的可执行写入契约与 oracle 分离，用户强调的体系级测试资产设计交给新卡承载 | internal | A-004, R-001 |

### 可证伪大纲（outlines）

| 假设 ID | 大纲版本 | 假设 | 状态 |
| --- | --- | --- | --- |
| H-001 | r0 | 返工主因是「验收标准判不了真假加没有独立判定者」，而不是流程缺少步骤 | supported |
| H-002 | r0 | 测试文件淤积的结构性原因是落点规则不完整：runtime 与 tools 目录不在测试收集范围内，测试只能溢进 tests/contract | supported |
| H-003 | r0 | 仓内已存在可复用的测试资产账本与证据重跑机制，只缺上限、按模块分摊与接线 | unresolved |
| H-004 | r0 | 只做卡面窄范围不足以回应用户两次强调的体系级诉求，体系级测试资产设计必须落进本卡 | unresolved |
| H-005 | r0 | oracle 与实现者分离在单 worktree 宿主环境内物理可行 | unresolved |

### 发散事实（机器记录）

```json
{
  "schema_version": "workflowhub-decision-divergence.v1",
  "oi_outline_version": "v1",
  "intake": {
    "raw_requirement": {
      "attribution": "user_verbatim",
      "text": "以 https://www.i-kh.net/p/if-ai-coding-is-lowering-your-code 为参考，仔细设计整个 workflowhub 的验收标准、测试流程、真实验收，让每个通过 workflowhub 开发的项目有完整的单元测试和端到端测试，而不是做一个功能补一点测试，避免功能多了之后测试文件大量堆积、完全没有系统化考虑和优化。",
      "source_id": "R-004"
    },
    "pain_point": {
      "attribution": "user_verbatim",
      "text": "每个任务一直有各种遗漏和返工；这些 phase 文件极其简陋，丢失了大量实现细节；build-plan 还没结束怎么就开始 build-code 了？我没同意！",
      "source_id": "R-008"
    }
  },
  "angles": [
    {
      "angle_id": "A-001",
      "plain_language_angle": "从真实会话的返工轨迹倒推，看验收契约究竟在哪一步失效",
      "source": "5 份 build-code 与 verify-code 会话取证报告，加 178 个会话全量清点",
      "strength": "high"
    },
    {
      "angle_id": "A-002",
      "plain_language_angle": "直接审计四张归档卡的验收材料，量化有多少条 AC 根本判不了真假",
      "source": "4 卡规格与测试质量审计（81 条 AC 的 A、B、C 定级）",
      "strength": "high"
    },
    {
      "angle_id": "A-003",
      "plain_language_angle": "拿外部七层防御当尺子量本仓，并清点仓内已有却没人接线的机制",
      "source": "i-kh.net 文章，加测试体系设计报告",
      "strength": "medium"
    },
    {
      "angle_id": "A-004",
      "plain_language_angle": "对比现流程与旧流程的净变化，确认优化不是走回头路",
      "source": "流程对比报告（现 build-plan 对比旧 build-spec 加 build-plan）",
      "strength": "medium"
    }
  ],
  "original_candidates": [
    {
      "candidate_id": "U-001",
      "text": "让每个通过 workflowhub 开发的项目拥有完整、系统化的单元测试与端到端测试，避免「做一个功能补一点测试」造成测试文件堆积",
      "source_id": "R-004",
      "semantic_basis": {
        "problem_axis": "测试资产随功能零散追加而不成体系",
        "mechanism": "在项目层面持续成套建设单元测试与端到端测试",
        "target": "每个经 workflowhub 交付的项目",
        "outcome": "测试资产完整、系统化、不堆积"
      }
    },
    {
      "candidate_id": "U-002",
      "text": "设计整个 workflowhub 的验收标准与测试流程，使每个 phase 与 task 的定义与测试质量可被判定，从而减少遗漏与返工",
      "source_id": "R-008",
      "semantic_basis": {
        "problem_axis": "每个 phase 与 task 反复出现遗漏与返工",
        "mechanism": "系统化设计验收标准与测试流程并使其可判定",
        "target": "workflowhub 全流程的每个 phase 与 task",
        "outcome": "遗漏与返工显著减少"
      }
    }
  ],
  "candidates": [
    {
      "candidate_id": "U-001",
      "origin": "user",
      "text": "让每个通过 workflowhub 开发的项目拥有完整、系统化的单元测试与端到端测试，避免「做一个功能补一点测试」造成测试文件堆积",
      "source_ids": ["R-004", "R-005"],
      "strength": "direct",
      "semantic_basis": {
        "problem_axis": "测试资产随功能零散追加而不成体系",
        "mechanism": "在项目层面持续成套建设单元测试与端到端测试",
        "target": "每个经 workflowhub 交付的项目",
        "outcome": "测试资产完整、系统化、不堆积"
      }
    },
    {
      "candidate_id": "U-002",
      "origin": "user",
      "text": "设计整个 workflowhub 的验收标准与测试流程，使每个 phase 与 task 的定义与测试质量可被判定，从而减少遗漏与返工",
      "source_ids": ["R-004", "R-008"],
      "strength": "direct",
      "semantic_basis": {
        "problem_axis": "每个 phase 与 task 反复出现遗漏与返工",
        "mechanism": "系统化设计验收标准与测试流程并使其可判定",
        "target": "workflowhub 全流程的每个 phase 与 task",
        "outcome": "遗漏与返工显著减少"
      }
    },
    {
      "candidate_id": "N-001",
      "origin": "internal",
      "angle_id": "A-001",
      "text": "把「可执行验收形式」做成 make-decision 的唯一写入面，写不出可执行形式的验收条目即 fail-loud 标 incomplete，禁止留空或占位",
      "source_ids": ["A-001", "R-001", "R-003"],
      "strength": "strong",
      "novelty_against": ["U-002"],
      "changed_dimensions": ["mechanism"],
      "semantic_basis": {
        "problem_axis": "每个 phase 与 task 反复出现遗漏与返工",
        "mechanism": "在 make-decision 的验收写入步强制可执行形式，并对写不出的条目 fail-loud",
        "target": "workflowhub 全流程的每个 phase 与 task",
        "outcome": "遗漏与返工显著减少"
      }
    },
    {
      "candidate_id": "N-002",
      "origin": "internal",
      "angle_id": "A-002",
      "text": "把验收权威分离从自律条款变成物理隔离：验收 oracle 与测试由独立上下文的子代理产出，实现者只读，并把来源 provenance 记入事实",
      "source_ids": ["A-002", "R-001", "R-003"],
      "strength": "strong",
      "novelty_against": ["U-002"],
      "changed_dimensions": ["mechanism", "target"],
      "semantic_basis": {
        "problem_axis": "每个 phase 与 task 反复出现遗漏与返工",
        "mechanism": "由独立上下文的子代理产出 oracle 与测试、实现者只读并记录来源",
        "target": "实施者与验收判定者之间的权限边界",
        "outcome": "遗漏与返工显著减少"
      }
    },
    {
      "candidate_id": "N-003",
      "origin": "internal",
      "angle_id": "A-003",
      "text": "测试资产的淤积是结构问题而非态度问题：用模块与测试层级的落点矩阵、覆盖率度量与每模块预算上限解决，并复用仓内已有账本",
      "source_ids": ["A-003", "R-004", "R-005", "R-006"],
      "strength": "strong",
      "novelty_against": ["U-001"],
      "changed_dimensions": ["mechanism", "target"],
      "semantic_basis": {
        "problem_axis": "测试资产随功能零散追加而不成体系",
        "mechanism": "用模块与层级的落点矩阵、覆盖率度量与每模块预算上限约束测试资产",
        "target": "测试资产的落点与规模预算",
        "outcome": "测试资产完整、系统化、不堆积"
      }
    },
    {
      "candidate_id": "N-004",
      "origin": "internal",
      "angle_id": "A-004",
      "text": "严格按卡面窄范围收口：本卡只做验收标准的可执行写入契约与 oracle 分离，用户强调的体系级测试资产设计交给新卡承载",
      "source_ids": ["A-004", "R-001"],
      "strength": "candidate",
      "novelty_against": ["U-002"],
      "changed_dimensions": ["outcome"],
      "semantic_basis": {
        "problem_axis": "每个 phase 与 task 反复出现遗漏与返工",
        "mechanism": "系统化设计验收标准与测试流程并使其可判定",
        "target": "workflowhub 全流程的每个 phase 与 task",
        "outcome": "只交付可执行验收写入契约这一层，其余体系级设计另立卡片"
      }
    }
  ],
  "outlines": [
    {
      "outline_version": "r0",
      "status": "active",
      "redraw_of": null,
      "redraw_reason_ids": [],
      "hypotheses": [
        {
          "hypothesis_id": "H-001",
          "statement": "返工主因是「验收标准判不了真假加没有独立判定者」，而不是流程缺少步骤",
          "status": "supported",
          "falsifier": "若能找到某张卡的 AC 完全可机器判定却仍然大面积返工，则该假设被推翻",
          "evidence_refs": ["/tmp/wh-an/report-sess03.md", "/tmp/wh-an/report-sess04.md", "/tmp/wh-an/report-spec-audit.md"]
        },
        {
          "hypothesis_id": "H-002",
          "statement": "测试文件淤积的结构性原因是落点规则不完整：runtime 与 tools 目录不在测试收集范围内，测试只能溢进 tests/contract",
          "status": "supported",
          "falsifier": "若把 runtime 与 tools 目录纳入收集范围后 tests/contract 的文件数并不下降，则该假设被推翻",
          "evidence_refs": ["/tmp/wh-an/report-testing-design.md", "vitest.config.mjs"]
        },
        {
          "hypothesis_id": "H-003",
          "statement": "仓内已存在可复用的测试资产账本与证据重跑机制，只缺上限、按模块分摊与接线",
          "status": "unresolved",
          "falsifier": "若 docs/architecture/repository-inventory.tsv 的 formal_test_lines 预算族无法承载按模块上限，则该假设被推翻",
          "evidence_refs": ["/tmp/wh-an/report-testing-design-appendix.md", "docs/architecture/repository-inventory.tsv"]
        },
        {
          "hypothesis_id": "H-004",
          "statement": "只做卡面窄范围不足以回应用户两次强调的体系级诉求，体系级测试资产设计必须落进本卡",
          "status": "unresolved",
          "falsifier": "若仅改 make-decision 的 AC 写入契约就能让四张卡那类缺陷整体消失，则该假设被推翻",
          "evidence_refs": ["R-004", "R-005", "/tmp/wh-an/report-spec-audit.md"]
        },
        {
          "hypothesis_id": "H-005",
          "statement": "oracle 与实现者分离在单 worktree 宿主环境内物理可行",
          "status": "unresolved",
          "falsifier": "若宿主环境必然让实现者拥有测试目录的写权限，且不存在只读或隐藏形态，则该假设被推翻",
          "evidence_refs": ["R-001", "runtime/task/workspace.mjs"]
        }
      ]
    }
  ]
}
```

## 调研

### 已发布的研究报告（step 3 交付；内容寻址于 `quality/evidence/research/<sha256>.json`）

| 报告 | sha256（前 8 位） | 回答的问题（逐字取自报告 `question`） |
| --- | --- | --- |
| RS-B · AC 强制点全图 | `3160ef98…` | Where exactly in the current product code can an 'executable acceptance criterion' contract be enforced - which… |
| RS-E · 阻断点裁决全图 | `a18aae70…` | runtime 里究竟在哪一处，让 'incomplete' / 'unverified' 的验收事实失去了阻断交付与 close 的能力？以及：什么是最小的、符合 SD-17 的改动，能让不诚实或空的验收事实真的阻断 |
| RS-D · 测试资产结构 | `e72dd900…` | What is the current test-asset structure exactly, what already-existing mechanisms could carry a placement mat… |
| RS-A · 交付边界 | `270a1563…` | CARD-04 的交付边界该严格按卡面窄范围收口，还是按用户两次强调的体系级诉求扩边，以及与 CARD-05/CARD-07/CARD-10 的硬边界落在哪？ |
| RS-F · E2E 入口 | `d89b6f90…` | What real end-to-end entry points exist in workflowhub at baseline `35a881ac…` to… |
| RS-C · oracle 分离可行性 | `07af47fa…` | 实现者/oracle 分离的哪些形式在物理上可能且可验证，哪些不可能？具体地：测试目录能否对实施 agent 变为只读或隐藏 |

绑定口径：`snapshot_tree` 绑整个 worktree 字节；`material_scope_revision` 的 scope 只有 `decision-log.md`。合规化前的原件逐字节备份在 `/tmp/wh-an/research/conform/original/`（含 `SHA256SUMS.txt`）。

### 用户方向表态（真实答复，早于 step 5，逐字）

> 你找的都不太合适，比审查用的ocr差太远了，如果找不到完整、简洁、合适、热门的框架，那还不如先用零依赖的 vitest 原语 + 规则把纪律立起来。我不想为了这件事装那么多复杂的框架

### 采纳方向：零依赖 vitest 原语 + 规则

判据：**不引入任何新依赖**；只使用钉住的 vitest 2.1.9 已经具备、且本卡要接手维护的原语与规则。

- 原语（M1 已实测按正确原因失败）：`expect.hasAssertions()`、`expect.assertions(n)`、`test.fails()`；加上已有的 `passWithNoTests: false` 与**尚未启用**的 `allowOnly: false`。
- 规则（本卡交付内容，step 5 后定稿）：AC 的可执行形式 + 命名/落点/规模纪律 + 负控要求。

### 拒绝清单（附代价与已核实证据）

| 方案 | 版本 / 许可 | 拒绝理由 |
| --- | --- | --- |
| `@cucumber/cucumber` | 13.2.1 · MIT | 引入第二个 runner：实测 `npm i` 加 **87 个包 / 28 MB**（本仓现有 devDep 只有 2 个）。且**只给结构不给语义**——"步骤已实现但断言为空"的场景实测仍 `2 scenarios (2 passed)` / exit 0 |
| `Gauge` | npm 1.6.38 · 2026-09-16 | 同上；本次安装因下载 `gauge-1.6.38-darwin.arm64.zip` 超时未能验证成 |
| `overlock` | 0.10.2 · MIT · **零运行依赖** | 唯一真正零依赖的候选（13 条规则已在发布包内逐个核验、已确认认得 `*.test.mjs` / `vitest.config.mjs`），但**只作用于 patch**，找不到已提交的 247 个测试文件；且属于新增工具面 |
| `falsegreen-js` | 0.7.0 · MIT · 1 依赖 | 实测在本仓产生 148 条发现**全部 `low`**（当门用等于永远非零）；抽查量最大的 `C11a` **13/13 假阳性**；拿三个已知最烂的验收脚本跑**只报 1 条**，且不是恒真那条 |
| `@stryker-mutator/*` | 10.0.0 · Apache-2.0 | 实测安装 **208 个包**；**分数会奖励「把 bug 编码进 oracle」的测试**（硬编码 outcome 的变异体被 KILLED，因为被削弱的测试断言的正是那个 bug 值）；且拒绝在红套件上运行，故发现不了坏测试 |
| `@adlc/hollow-test` | 1.11.1 · MIT | 唯一在 2.1.9 上端到端验证过的变异器（实测 exit 2 / `Killed: 3 Survived: 5`），但单维护者、20 star，属新增工具面 |
| `eslint` + `@vitest/eslint-plugin` | 10.11.0 / 1.6.27 | 本仓今天**没有 ESLint**（新开工具面）；实测 6 种目标形状**只抓到 2 种**，漏掉最重要的一种 `expect(x).toBe(x)`（方法调用，不是二元运算符） |
| `testtruth` | 0.1.0 · MIT | 单日项目（5 次提交全在 2026-08-26，之后零提交，166 下载/月）；**纯改测试的提交它直接报 "nothing to mutate" 并 exit 无发现**——正是本仓头号形态；每次运行约 62 次套件调用，与「禁止无范围全量测试」冲突 |
| 阿里 `open-code-review` | 1.12.9 · Apache-2.0 | 形状不对：它是 Go 写的 LLM **diff 代码审查器**（建议性、不是门），规则针对 NPE/线程安全/XSS/SQLi，**不管测试质量**；且需外部 LLM provider。它已在 CARD-05 的审查面使用，与本卡无关 |
| Lighthouse / `@lhci/cli` | 0.15.1 | 源码级判死：`lighthouse/core/lib/url-utils.js:14-16` 的允许协议白名单不含 `file:`；`@lhci/cli` 根本不允许直接给 URL，每次都起 express 回写 `http://localhost:PORT`；且它评的是**网页**，不认识验收判据 |
| 全局行覆盖率百分比门 | — | 覆盖率**抓不到本卡已审计缺陷中的任何一类**：那些缺陷里代码都执行到了，行/分支覆盖率照绿。Fowler：*"high coverage numbers are too easy to reach with low quality testing… I would be suspicious of anything like 100%"* |

### 负结果：这个类别在开源里几乎是空的（有源码级证据）

- **中国大厂零命中**：扫了 14 个 GitHub org、12 个 npm scope（@tencent @bytedance @alibaba @antgroup @alipay @baidu @jd @didi @xiaomi @meituan @bilibili @pingcap）、npm 关键词与 gh search code/repos。中国大厂测试工具全是 JVM/Go/平台形状。可归档的死刑：TCA 最后发版 2024-07-30；ArchGuard 已转向 OTLP trace 服务器且其测试坏味道代码是 Java 的；CodeFuse-Query 2024-08-22；`pingcap/tipocket` 已归档；TscanCode / testable-mock / macaca / f2etest / sofa-acts 死于 2022–2023。
- **美国大厂也没有 Node 版**：但谷歌 `Error Prone`（Java 编译器插件）的分类学**精确命中本卡的病**——`SelfAssertion`（逐字 `This assertion will always fail or succeed.`）、`TruthConstantAsserts`、`TruthAssertExpected`、`MissingFail`、`MissingTestCall`、`JUnit4TestNotRun`、`RuleNotRun`、`AlwaysThrows`。**大厂把这件事想清楚了并做成了工具，但它是 Java 的。**
- **恒真/空断言检测器在 JS 生态不存在**：学术界的 Redundant Assertion / Unknown Test / Rotten Green Tests 检测器（ICSE 2019 / EMSE 2021）**每一个产物都是 Java/Python/Scala**（tsDetect、TestSmellDetector.jar、RTj、PyNose、RAIDE、SoCRITES）。**JS/Node 没有任何发行物。**
- 不存在 E2E 专用的测试弱化检测工具；也没有任何 Descartes / 极限变异的 JS 移植（Descartes 是 Java，PseudoSweep 是 Java，PyPseudo 是 Python）。

### 一手实测记录

#### M1 · 零依赖原语在钉住的 vitest 2.1.9 上确实会按正确原因失败

```
$ npx vitest run tests/probe-m2-error-messages.test.mjs
 FAIL  > vacuous test
Error: expected any number of assertion, but got none
 ❯ tests/probe-m2-error-messages.test.mjs:4:12
 FAIL  > undercount
Error: expected number of assertions to be 3, but got 1
 Test Files  1 failed (1)
      Tests  2 failed (2)
```

同批的 `test.fails(...)` 包装版（`tests/probe-m1-zero-dep-primitives.test.mjs`）**4/4 通过**，其中两条正是「把空壳测试和断言数量不足判为失败」。
**同时实测到 vitest 自身的盲区**：`const expected = compute(); expect(compute()).toBe(expected);` 正常通过 —— 没有任何内建规则阻止自比对。这正是必须用**负控（坏输入必须得出非 passed）**而不是靠原语本身堵住的原因。
两个探针文件跑完即删，worktree 已回到基线字节。

#### M2 · 研究证据的时效绑定会让**任何** worktree 编辑使其失效（且静默）

```
# 写探针之前
"research":{"status":"completed","report_ref":"quality/evidence/research/a18aae70….json", …}
# 写了两个探针文件之后（exit code 仍然是 0）
"research":{"status":"unavailable","reason":"research_record_missing","report_ref":null, …}
# 删掉探针、字节恢复原状之后
"research":{"status":"completed","report_ref":"quality/evidence/research/a18aae70….json", …}
```

机制（`runtime/evidence/research-report.mjs`）：
- `:22-23` `readResearchReport` 比对 `report.snapshot_tree !== expected.snapshotTree` → 抛 `research report snapshot identity mismatch`；`material_scope_revision` 同理。
- `:306-315` `listCurrentResearchReports` 注释逐字 *"Read only current, authenticated reports; stale/foreign/corrupt records are not projected."*；catch 里对 `task|stage|snapshot|material identity mismatch` **`return []`（静默丢弃）**，只有其他错误才冒泡成 `research_record_integrity_failure`。
- `:262-266` `deriveResearchStatus([])` → `reason: "research_record_missing"`。
- receipts 路径（`runtime/stage/stage-handlers.mjs:784`）传 `snapshotTree: captureWorkerSnapshot(worker).tree` ⇒ **会抛**，所以 stage 末会硬失败。

**后果**：`snapshot_tree` 绑整个 worktree 字节 ⇒ make-decision 的 step 8 / step 12 一旦写 `decision-log.md`，或本卡写出任何产物文件，6 份研究报告**全部立即失效**；status 路径把它**静默降级成「你没做过研究」这一误导性字样**并 exit 0。绑定是**可逆**的（树字节恢复即回到 `completed`），所以正确的修法是按当时的 `snapshot_tree` **重新绑定**，而不是重做研究。
**与本卡的关系**：E2E 验收回执走同一套 `runtime/evidence/freshness.mjs` 绑定 ⇒ 同一陷阱会在「跑完端到端验收之后又改了代码」时原样重演。这是本卡设计必须处理的约束（登记表类产物必须在最后一次改动之后产生或重绑），也是 SD-17「不重新引入哈希/回执门」边界内需要说明的一点。

#### M3 · 顺手发现的字节约定不一致

`publishResearchReport`（`runtime/evidence/research-report.mjs:319-329`）在 `raw === null` 时用 `${JSON.stringify(report, null, 2)}\n` —— **带尾换行**；而本次合规化是直接投喂 raw 字节、**无尾换行**。两种都能用（ref 是内容寻址的），但后续任何重绑脚本必须沿用同一约定，否则同一内容会得到两个不同 sha256。

### step 4 direction-advice（异源方向审查）

**机器记录（由现有 review writer 写入；unavailable 就是 unavailable，未通过即未通过）**

- 写入器：`node tools/cli/stage-runtime.mjs review --action=record --stage=make-decision --project=workflowhub --task=workflowhub-thin-core-card-04-20260919 --task-path=<task store> --input=/tmp/wh-an/step4-review-request.json`。依据：`tools/cli/stage-runtime.mjs:1646` 把公开路由 `review:record` 映射为 `review-record`；记录实现在 `runtime/review/review-record-route.mjs:1690-1712`（attempt.json / result / provider output 三个 ref）。
- transport / provider：broker 走 `third_review`（`node /Users/Hugh/Hugh/Project/3rd-review/scripts/3rd-review.mjs`），`host_provider` 取与既往记录一致的 `dsh`；候选路由为 `wh_review.stages["make-decision"].direction.initial = ["kimi/coding","antigravity/flash","codex/luna"]`（`~/.config/workflowhub/config.json`）。**实际未取得任何 provider 结果**：`provider_attempts: []`、`runtime_id: null`、`result_ref: null`。
- 结果：**unavailable**（不是 pass；findings 为空表示「没取到」，不表示「没问题」，依 SD-15 不得改写成通过）。`attempt_ref = quality/reviews/attempts/a4a6488e-033d-5d89-aee2-9390612aac0d/attempt.json`；`report_ref = quality/reviews/reports/make-decision-simple-a4a6488e-033d-5d89-aee2-9390612aac0d.md`。
- `terminal_status: "unavailable"`；`error` 逐字：`{"code":"REVIEW_SOURCE_DRIFT","message":"review source changed while dispatching; completed provider facts were retained without publishing a result"}`。
- 成因（强证据，未确证）：派发窗口内本文件被并发写入。命令执行区间约 21:58:15–22:01:15，而本文件 mtime 为 2026-09-22T21:59:45、大小由 52,931 B 变为 54,465 B；`closureMatches`（`runtime/review/review-record-route.mjs:765-773`）要求 `closure.material_revision === identity.materialRevision`，材料 revision 一变即判漂移。worktree 侧 `git status --short` 全程干净、HEAD 仍为 `35a881ac…`，故非本步骤改动所致。
- 按约束**未重试**（一次有界尝试；有界手段用 writer 自身的 `WH_REVIEW_BROKER_TIMEOUT_MS=120000` 加外层 `timeout 180`。进程已打印记录但未自行退出，exit 124；记录在 SIGKILL 之前已持久写入）。
- 未验证：本轮是否真正到达过 broker、是否真有 provider 被调度。

**实质发现（异源独立审查，只挑战不替用户选方向；全文 `/tmp/wh-an/research/step4-direction-advice.md`，803 行 / 54,978 B）**

结论：「零依赖」这一约束本身成立且可辩护；但「零依赖 vitest 原语 + 写成规则就能立起纪律」**不成立** —— 它约束的那一层，验收取证路径根本不读。

1. 覆盖率 **0/11**：11 类缺陷中 0 类被完整修复、1 类属偶然的部分修复、9 类未被触及。
2. 根因（结构性）：验收路径不读 vitest 断言，只读子进程 stdout 上的 JSON。`runtime/evidence/canonical-evidence-validators.mjs:106-137` 是唯一的验收断言推导点，`:106` 逐字注释 `Derive assertions from actual child JSON; its claimed verdict is never consumed.`，要求形状 `{entries:[{acceptance_criterion_id, outcome, assertions:[{id, expected, actual}]}]}`。⇒ 提议的 `expect.hasAssertions()` / `expect.assertions(n)` / `test.fails()` 对验收路径**完全不可见**；这两个原语在仓库中的实际出现次数均为 **0**。
3. 自我认证正是运行时契约本身：`:131-137` 以 `acceptanceAssertionMatches(assertion.expected, assertion.actual)`（`:37-53`）比对 expected/actual，而两者都来自被测进程自己写出的同一个 JSON blob。
4. 唯一决定验收标准「形式」的强制执行点是 `runtime/stage/stage-content-contracts.mjs:7416-7451`，它不接受任何 vitest 形式；另有 `runtime/evidence/canonical-evidence-validators.mjs:136-137` 与 `runtime/stage/stage-runner.mjs:2590-2591`（畸形证据被降级成 `missing` 而非 `failed`）。
5. 规则没有执行点：`npm run check` 只覆盖 9 个文件、无一在 `runtime/`；`SD-` 在任何代码文件中出现 0 次；`tools/cli/check-stage-quality.mjs` 只扫 `metrics/` 与 `scripts/`，`runtime/`（107 文件 / 43,310 行）完全不扫。
6. fail-closed 的爆炸半径：会重新分类 **562/707（79.5%）** 条已记录的 stage 结果，并与 SD-17、CLAUDE.md、AGENTS.md 冲突。
7. 审查者自我更正：类 5 的机制被**证伪**；类 6 的字面串 `7 failed | 14 passed` 在仓库中不存在；类 9 的「任务仍在 in_progress 时」未获确认（`task.json` 无 status 字段）；类 4 确认为另一处独立实例（card-07：20 条 AC 对一条 6 文件 vitest 命令）。
8. 与本文件既有记录的交叉印证：card-04 自身 6 份研究报告绑定了**不存在的** `snapshot_tree` `37f4a565…`，证据漂移已被独立确认，与「一手实测记录」的 M2 同源。
9. 审查者遇到的指令形状内容（按数据处理并上报，未遵从）：`tests/acceptance/card-07-current.mjs:29-34`、`tests/acceptance/card-02-current.mjs:203-208`。无文件试图改变指令或外传数据。

## 三轮 talk

### step 5 outline-talk · 第 1 批（1 组 / 4 问）

- **技能**：`talk-with-zhipeng`；**OI 版本**：v1（见 `### 唯一 OI 大纲（current authority，outline_version: v1）`）
- **本批用途**：定「验收怎么落到现实」的方向——交付形态、改动层级、真实入口强度、空槽后果口径
- **宿主工具**：结构化问答工具（4 问成一组，互相独立；每题 2～3 个互斥选项，各带后果与风险，各带推荐项）
- **答复来源**：宿主工具返回 `answers`；用户对 4 问全部选择**推荐项**，无 free_text、无歧义

| 问题 | 轴 | 选项 | 用户真实答复 | 推荐被采纳 |
|---|---|---|---|---|
| Q1 | 验收「给人看的东西」的形态 | 甲 只写规则／乙 只加人读报告／**丙 规则 + 报告（报告 = 已有事实的只读视图）** | **丙** | 是 |
| Q2 | card-04 改到哪一层 | 甲 只写规则不碰产品代码／**乙 连产品代码一起改**／丙 分两批 | **乙** | 是 |
| Q3 | 「真实入口」要求强度 | 甲 每张卡至少一条／**乙 每个 phase 至少一条 + 登记入口清单**／丙 只写入口不设数量 | **乙** | 是 |
| Q4 | 空槽／不合格的后果 | 甲 只记录不拦（现状）／**乙 如实记录 + 报告最前面印出「没做到的部分」**／丙 记 incomplete 并阻断 | **乙** | 是 |

**发给用户的后果与风险（原话要旨）**：
1. Q1：甲改动最小但内容散落、易成没人读的散文；乙人打开即见全部真相，但易与真实记录漂移；丙规则管怎么填、报告管给人看，二者不会各说各话，代价是多一个渲染动作，且底层空着时报告会诚实地印出「空」。
2. Q2：甲风险最小、与 CARD-05 不撞车，但规则说要填而机器填不进去＝「流程正确但没解决」；乙让真话真的流进产品，代价是要动 `runtime/stage/stage-runner.mjs` 这类大文件、与 CARD-05 改动面可能撞车、验收更重；丙先钉规则再动代码、撞车可控，但第二批易被拖。
3. Q3：甲门槛低、立刻可执行但覆盖薄；乙覆盖跟 phase 走、未被跑过的入口被显式点名，代价是要维护一份清单；丙最轻但回到「写了没人保证跑」。
4. Q4：甲即现状（真话没人看）；乙不新增机器阻塞却掩盖不了，靠人自觉；丙正是用户明确反对的 gate，且实测**562/707（79.5%）**条已记录阶段结果会新增失败。

**由本批答复直接推导的事实（不再作为问题提问）**：
- Q1丙 + Q2乙 ⇒ **验收报告由产品代码从已有事实渲染，不由人手写**；「谁来写报告」已被事实回答。
- Q4乙 ⇒ 报告必须在**同一份东西的最前面**承载「没做到的部分」，素材槽位是 `coverage_limits`（+ `exceptions`）；不新增阻断门。
- Q3乙 ⇒「我们到底有哪些入口」必须成为**显式库存**，未被任何测试跑过的入口要被点名。
- 三样交付物的落点据此冻结（全部复用已有载体，零新增文件／schema／counter／gate）：
  ① 逐条对账 → `acceptanceChain` 行的 `source_ids`／`decision_ids`／`fr_ids`（`runtime/stage/stage-runner.mjs:3936-3938`，现为写死的 `[]`）；
  ② 真实入口运行记录 → `stage-quality-evidence.v1` 的 `subject_fact.execution`（运行时已产出：literal command + `stdout_ref` 内容寻址 + 运行时判定的 `assertions[].result`）；
  ③ 没做到明说 → `coverage_limits`（`runtime/stage/stage-runner.mjs:3946` 从行透传，`:3930` 的 `...row`）。

**重排后仍会改变方向的开放问题（本轮未收敛）**：
- Q5（high）这份报告要不要能对**已归档的历史卡**（CARD-01/02/05/07）回放——决定工作量，以及能否用已知坏事实当回归。
- Q6（medium）人要不要在报告上留下「我看过了」的真实确认——决定 Q4乙 的「人一定会看到」是否成立。

**当前总数**：4（已提出）+ 2（重排后仍会改变方向的开放问题）= **6**。第 2 批（1 组）提 Q5、Q6。

### step 5 outline-talk · 第 2 批（1 组 / 2 问）

- **技能**：`talk-with-zhipeng`；**OI 版本**：v1
- **本批用途**：定回溯范围（要不要能回放历史卡）与「人的确认」的形态
- **宿主工具**：结构化问答工具（2 问成一组，互相独立；每题 3 个互斥选项，各带后果与风险，各带推荐项）
- **答复来源**：宿主工具返回 `answers`；Q5 选择推荐项，Q6 为 free_text 自定义答复

| 问题 | 轴 | 选项 | 用户真实答复 | 推荐被采纳 |
|---|---|---|---|---|
| Q5 | 回溯范围 | 甲 只管新卡／**乙 能对已归档历史卡回放**／丙 只在本卡自己的产物上验证 | **乙** | 是 |
| Q6 | 人的确认 | 甲 不留痕／乙 留真实确认且缺失即印为事实／丙 缺确认不许 close | **丙、甲、乙均未选**；自定义：不新增「看过」记录，改为 **build-code stage 结束时把所有测试过程和结果用简短的大白话说明一次**；用户**自己基于这些步骤去做真实验收** | 否（用户给出了更好的形态） |

**Q5 各选项的后果与风险（发给用户的原话要旨）**：乙能拿 CARD-02（22 条 AC 曾自我声明 `achieved 18`、后被逐条改判 incomplete）与 CARD-07（20 条 AC 硬编码 `outcome: "incomplete"`）当**已知答案**回归，交付前就能看出报告是照出真话还是又印绿；代价是要兼容归档材料形态（CARD-02 为旧四材料形态，含 `plan.md`/`tasks.md`）。甲最省最快但交付时拿不出任何证据。丙照不出「已知坏事实仍被显示为绿」这个最关键场景。

**Q6 各选项的后果与风险（发给用户的原话要旨）**：甲零打扰但会让报告退化成一份没人打开的文档（即现状这个病）；乙不设门、把「没人看过」变成可见事实；丙是门，且越界（close 归 CARD-10）。

**用户自定义答复逐字**：「不用新增看过的记录，只要在build-code的stage结束时，把所有测试过程和结果用简短的大白话说明一次就好了，我会自己基于这些步骤自己去做真实验收」

**由本批答复直接推导的事实（不再作为问题提问）**：
- **人不留「看过」痕迹**；取而代之的交付动作是 **build-code stage 结束时输出一次简短的大白话说明**，覆盖「所有测试过程和结果」。
- 因此 Q4乙 的「人在最后会看到」落实为**人被赋予自己复现的能力**，而不是被要求签字 ⇒ 说明里的步骤必须**字面可执行**，结果必须**如实**。
- **最终 oracle 是用户本人**（「我会自己基于这些步骤自己去做真实验收」）。仓库机制造不出这个事实，只能保证三件事：(a) 步骤字面可跑；(b) 每一步的真实结果被如实印出；(c) 没做到的部分印在最前面（Q4乙）。
- Q5乙 + Q1丙 + Q2乙 ⇒ 该说明由**产品代码从已有事实渲染**，且渲染器要能读**已归档卡**的材料形态。
- 「**简短的大白话**」是本卡对输出形态的硬要求：不得用字段名／退出码／文件路径堆砌代替说明。

**收敛判定（§4 收敛阈值）**：重排后**无 high／medium 待回答项** ⇒ step 5 达收敛阈值。
**处理数量**：2 批 / 2 组 / 共 **6** 问（Q1–Q6）。
**仍保留的风险**：① 渲染器要同时吃当前形态与归档形态，兼容面变大；② 「简短的大白话」能否真的由机器渲染（而非人手写）需在 step 7 按模块定清；③ 未被任何测试跑过的入口被点名后会长期挂在说明里。
**不再提问的事实理由**：剩下的是「怎么实现」的设计细节（渲染点、输出形态细则、入口清单载体），按 `workflows/make-decision/steps.json` order 7 应由 `module-convergence` 按模块处理，不属于 step 5 的方向轴。

## grill

### step 6 grill-with-docs · 第 1 批（1 组 / 4 问）

- **技能**：`grill-with-docs`；**问题批次**：第 1 批（1 组）；**宿主工具**：结构化问答工具
- **先核实再提问**：本批发出前先用只读核查刷掉可从代码得到的答案（报告 `/tmp/wh-an/research/grill-verify-stage-end-and-archives.md`，563 行）。四条关键事实：
  1. **人读的 stage 末说明已经存在**：`runtime/stage/stage-handoff.mjs:11-16` 的 `STAGE_HANDOFF_STAGES` 含 `build-code`；`:315` `renderStageHandoff`、`:477` `publishStageHandoff`、`:203-206` 落到 `quality/evidence/handoff/<stage>.md`、`:379` `assertReadback` 强制 13 个有序标题。真实产物：`…card-07-20260919/quality/evidence/handoff/build-code.md`（6090 B；`authority: non_authoritative`、`retention: current_only`）。**但它没有 CLI 出口**（`rg -n "handoff" tools/cli/stage-runtime.mjs` → 0 命中；`tools/cli/stage-runtime.mjs:1685` 只吐 JSON）。
  2. **`acceptanceChain` 的槽位被写死为空**：`runtime/stage/stage-runner.mjs:3930-3949`（`source_ids: []`、`decision_ids: []`、`fr_ids: []`、`task_ids: []`、`file_symbol: ""`、`implementation_anchor: null`、`verification_anchor: null`、`gate.oracle: ""`、`evidence_refs: []`；`scenario`/`actual_outcome`/`coverage_limits` 走 `row ?? ""`）。真实证据：CARD-07 `…/stage-quality/build-code/stage_end_spec_analyze-a7b9111e….json` → `status:"missing"`、`analysis_result.status:"inconsistent"`、**858 errors + 858 findings**（逐字 `build-code acceptance chain[0].source_ids must be non-empty` … `.coverage_limits is required`；17 类 × 约 50 行），并记「0/38 条原始来源记录（尚未语义去重）有独立语义核验（状态：inconsistent；自报 covered 不计入已核验）；非 covered 终态：incomplete 38」。
  3. **归档材料结构上不可达**：材料根是 `<worktree>/specs/<task_id>/`（`core/artifact-dir.mjs:157-178`），无任何 runtime 模块读 `specs/archive/**`；`runtime/task/material-workspace.mjs:8-10`（pre = `decision-log.md`/`spec.md`/`plan.md`/`tasks.md`；post = `decision-log.md`/`spec.md`/`phases/index.md`）、`:43` `materialFilesForCohort`。归档实况：CARD-01/CARD-02 = **pre 形态**；CARD-07 = **post 形态**；**CARD-05 无归档**。
  4. **该链分析器只对 post cohort 跑**：`runtime/stage/stage-runner.mjs:4289-4291`（`!stageOutcome.value && stage === "build-code" && ctx.manifest?.activation_cohort === "post"`）；而 **card-04 自身 `activation_cohort = "pre"`**（task store `task.json`）。

| 问题 | 轴 | 选项 | 用户真实答复 | 推荐被采纳 |
|---|---|---|---|---|
| G1 | 这份说明接在哪里 | 甲 升级已有 handoff／乙 另起独立说明／丙 只修数据不新做说明 | **三项均未选**（见下方逐字自定义答复） | 否（用户给出更直接的形态） |
| G2 | card-04 自身如何被验收 | **甲 把 card-04 切成 post（新形态）**／乙 保持 pre 靠回放 CARD-07／丙 保持 pre 只做单测 | **甲** | 是 |
| G3 | 回放时「输出对不对」的基准 | **甲 以归档原件里已记录的事实为准**／乙 由本卡编写期望答案清单／丙 不设对错只要不崩 | **甲** | 是 |
| G4 | 无入口 phase 怎么办 | **甲 允许间接跑到，但必须写明哪个入口、确实走到了**／乙 必须造最小入口／丙 允许直标无独立入口 | **甲** | 是 |

**G1 用户自定义答复（逐字）**：「我不是要升级handoff，handoff文件内容我又不看的，我希望stage结束的时候直接在聊天内容里把这个验收报告发给我看」

**由本批答复直接推导的事实（不再作为问题提问）**：
- **交付现场是聊天，不是文件。** 用户明确不看 `quality/evidence/handoff/<stage>.md`。⇒ 这份说明的存在形式是 **stage 结束时主会话在对话里发出来的一段内容**；「有没有 CLI 出口」这个问题因此不适用（用户不经过 CLI 看），但「报告内容从哪来」升为新的核心风险。
- **G2甲** ⇒ card-04 材料形态改为 post（`decision-log.md` + `spec.md` + `phases/index.md` + `phases/P<n>.md`），**不产出 `plan.md`/`tasks.md` 双写**；`activation_cohort` 由 `pre` 改为 `post` 属冻结项变更，理由＝让本卡自己的 build-code 成为该链的第一个真实样本（现状为 858 条 error）。
- **G3甲** ⇒ 回放的期望答案取自**归档原件**（首推 CARD-07 的 `stage_end_spec_analyze-*.json`、`spec.md`、`phases/`），**不由本卡编写**；CARD-01/CARD-02 因当时无此链，只能验资格（读得动、不崩）。
- **G4甲** ⇒「真实入口」的满足可以是**间接的**，但说明必须点名是哪个入口、以及它确实走到了这段代码；只有"走过"的断言而无事实支撑视为不满足。

**重排后仍会改变方向的开放问题**：转入第 2 批（G5、G6）。主题均源自 G1 自定义答复暴露出的风险——**一段由实施者在聊天里写出来的报告，怎么保证它不是自我美化**。

### step 6 grill-with-docs · 第 2 批（1 组 / 2 问）

- **技能**：`grill-with-docs`；**OI 版本**：v1；**宿主工具**：结构化问答工具
- **本批用途**：G1 的自定义答复打开了新风险——「一段由实施者在聊天里写出来的报告，怎么保证不是自我美化」，本批定报告的长短取舍与执笔人

| 问题 | 轴 | 选项 | 用户真实答复 | 推荐被采纳 |
|---|---|---|---|---|
| G5 | 「所有测试过程和结果」与「简短」矛盾时的取舍 | **甲 不对称压缩（坏消息由机器事实逐条枚举、原样列出、不许总结；通过的一行汇总 + 可展开清单；每条结论挂来源）**／乙 对称压缩、长度固定很短／丙 机器原样贴一字不改 | **甲** | 是 |
| G6 | 这份聊天报告的执笔人 | **甲 独立子代理（独立上下文、未参与实现）依据机器事实写，主会话原样贴进聊天**／乙 主会话自己写／丙 机器直接生成 | **甲** | 是 |

**发给用户的后果与风险（原话要旨）**：
- G5：甲的坏消息没有美化空间（要列哪些由机器数出来，不由人挑），代价是坏消息多时报告很长（如 858 条错会全列）；乙最好读但「总结」就是美化的入口；丙零美化空间但不是大白话、读起来累。
- G6：甲写的人不是做的人，是唯一不靠自觉的异源办法；乙最快但执笔人就是实施者，正是 CARD-02 报「148/148 全绿」、CARD-07 把子代理否决漂白成绿这两次的病灶；丙零人为空间，但机器生成的「大白话」易退化成字段名堆砌。

**由本批答复直接推导的事实**：
- G5甲 ⇒ 「没做到的部分」的**判定权归机器事实**（不是归执笔人）；报告结构不对称——坏消息逐条原样、好消息汇总。
- G6甲 ⇒ 聊天报告由**独立子代理**执笔、主会话原样贴；主会话不得润色、不得删减。
- 两者合起来 ⇒ 报告的抗美化只靠两件事：**机器枚举坏消息** + **异源执笔**；不新增任何机器阻断门（与 Q4乙 一致）。

### step 6 grill · 四项退出检查（前置核实，逐条带证据）

1. **外部依赖接口是否已核实真实定义** —— **一处重大发现，已改变方向**：
   - `activation_cohort` **不是可选项，而是 bootstrap 时被「观测」出来的**：`tools/cli/task-bootstrap.mjs:45-60` `resolveCard01Activation()` 读 `<storageRoot>/activation/card-01.json`；`:48` 文件不存在 ⇒ 返回 `cohort:"pre"`；`:59` 合法 ⇒ `cohort:"post"`。`:155-156` 唯一调用点；**全仓无任何 CLI 参数可指定 cohort**。
   - storageRoot 实测 = `/Users/Hugh/Hugh/Knowledge`（`~/.config/workflowhub/config*` 的 `task_dir`）；`/Users/Hugh/Hugh/Knowledge/activation/` **不存在**（`ls` → No such file or directory）⇒ **今天凡新卡必为 pre**。
   - 旁证：card-05 冻结于 `2026-09-22T06:12:27Z`、`entry_release_commit=642d4fb2…`（=card-02 归档提交）；card-07 冻结于 `2026-09-21T16:20:05Z`、`entry_release_commit=b39f34ba…`（=card-01 归档提交）；card-04 冻结于 `2026-09-22T11:41:14Z`、`entry_release_commit=35a881ac…`（=当时 HEAD，即 fallback）⇒ 标记曾在、现已不在。
   - **post 对 build-code 唯一真正多出来的东西**：`runtime/stage/stage-runner.mjs:4289-4293` `const currentSpecAnalyze = !stageOutcome.value && stage === "build-code" && ctx.manifest?.activation_cohort === "post" ? await currentPostBuildCodeSpecAnalyze(...) : null;`（build-plan 同形于 `:4297-4298`）⇒ **pre 卡的逐条验收链永不做机器核查**，而这正是 card-07 那 858 errors/858 findings 唯一被发现的通道。
2. **字段/路径命名是否已有唯一权威定义** —— 成立。`source_ids`/`decision_ids`/`fr_ids`/`task_ids`/`coverage_limits`/`scenario`/`actual_outcome` 的结构权威是 `runtime/stage/stage-runner.mjs:3930-3949`，语义权威是 `runtime/stage/stage-content-contracts.mjs:6257` `validateBuildCodeAcceptanceChain`；`coverage_limits` 的允许键与「必须非空文本数组」由 `runtime/evidence/acceptance-evidence-validator.mjs:63,73` 与 `runtime/review/schemas/ac-evidence-summary.schema.json:29,42` 定义；领域名已存在（`CONTEXT.md:301`「逐条 AC 的可读验收视图」）。
3. **失败路径/异常语义是否明确** —— **未定，留给 step 7**：运行时非通过终态至少含 `missing` / `inconsistent` / `incomplete` / `unavailable` / `failed` / `deferred`；「哪些算『没做到』并进报告最前面」必须收敛为一处定义（不新增状态机）。
4. **范围边界是否写死** —— 成立：只做验收标准与测试的体系化 + 让已有事实可见；**不做** CARD-05（审查工具/provider）、CARD-10（整体集成验收与 close）、CARD-06（删除）；零新增依赖；不新增阻断门/计数器/schema（`CONSTITUTION.md:85`）；不设统一预算门（`docs/standard-workflow.md:90`）。

**CONTEXT.md 判定**：**不改**。理由：本卡新增的都是实现级名字（stage 末报告、入口库存、三样落点），而 `CONTEXT.md` 是仓级领域词典；且「逐条 AC 的可读验收视图」这一领域名**已经存在**（`CONTEXT.md:301`），cohort 语义也已存在（`CONTEXT.md:305`）——本卡要做的是让已有领域名的实现不再留空槽，不是造新词。
**ADR 判定**：**暂不新建**。三项判据中「难以反转」与「无背景会意外」在**报告交付形态**上不成立（它是可逆的流程实践，且落地即在代码与阶段说明里，写 ADR 会与实现重复）；待 G7 答复后重判一次——若最终选择改变产品级 cohort 行为，则三项判据全为真，届时补 ADR。

**五类消息覆盖矩阵（每条至少一个需求轴 + 已认证答复或记录理由）**：
| 类别 | 覆盖的需求轴 | 已认证答复 |
|---|---|---|
| 目标 | R-004/R-005/R-008/R-001（让每个通过 workflowhub 开发的项目有完整单测+E2E） | 三层方向（quality合格非流程正确）；Q1丙/Q2乙/Q3乙/Q4乙 |
| 流程·表面 | stage 末报告在哪里发、每个 phase 的真实入口 | G1 自定义（聊天，不看文件）；Q3乙；G4甲 |
| 数据·状态 | 三样落点 + 验收链空槽 + card-04 自身 cohort | 本批退出检查 1；Q2乙；G2甲 |
| 成功·失败·验收 | 判定权归机器、坏消息原样、异源执笔、用户自己验收 | G5甲；G6甲；Q4乙；G3甲 |
| 约束·非目标·延期 | 零新增依赖、不加门、CARD-05/10/06 边界 | 用户 m00759（零新增依赖）；`CONSTITUTION.md:85`；`docs/standard-workflow.md:90` |

### step 6 grill-with-docs · 第 3 批（1 组 / 1 问，含一次重提）

**问题来历**：退出检查 1 挖出「cohort 冻结在任务档案里、今天新建的卡必为 pre」，推翻了第 1 批 G2 的答复（用户当时选「card-04 切成 post」）。故重开一问。

| 轮次 | 问题 | 选项 | 用户真实答复 |
|---|---|---|---|
| G7（首次） | card-04 自身怎么被机器核查 | 甲 放开 pre 的条件／乙 新建激活标记把今后所有卡变 post／丙 保持 pre 只写明 | **乙**（新建激活标记） |
| —— | 我按该答复去核实「标记怎么建」，得到两条新事实，遂重提 | —— | —— |
| G7b（重提） | 同上（修正版） | 甲 放开 pre 的条件／乙 照原计划建标记／丙 建标记 + 把 card-04 作为新任务重建／丁 什么都不动 | **甲**（放开 pre 的条件） |

**触发重提的两条新事实（均一手核实）**：
1. **建标记救不了 card-04**：cohort 在建卡时冻结进任务档案（`runtime/task/task-topology.mjs:97-99` `readActivationCohort(manifest)`；`tools/cli/stage-runtime.mjs:145`；`runtime/stage/stage-runner.mjs:538` `activation_cohort: ctx.task?.manifest?.activation_cohort ?? "pre"`），card-04 的 `task.json` 已是 `activation_cohort:"pre"` / `activation_cohort_frozen_at:"2026-09-22T11:41:14.576Z"`。今天建标记**只影响之后再建的新卡**。
2. **标记要求引用两份不存在的记录**：合法标记必须带 `capability_acceptance.ref` + 64 位 `sha256`、以及 `entry_consumption.evidence_ref` + `observed_at`（`tools/cli/task-bootstrap.mjs:52-57`）。在整个仓库与整个 Knowledge 库内**找不到任何这样的产物**（`find` `*capabilit*` 零命中；card-01 自己的 `task.json` 连 cohort 字段都没有）；且**全仓没有任何代码会写该文件**——唯一的引用是 `tools/cli/task-bootstrap.mjs:47` 那行**读**它的代码。⇒ 手工创建即伪造发布闸门。

**用户最终答复的后果（方向已定）**：card-04 **保持 pre**，把 `runtime/stage/stage-runner.mjs:4289-4291` 的 `activation_cohort === "post"` 限制放开，使 pre 卡（含 card-04 自身）也执行 build-code 的逐条验收链机器核查（`:4297-4298` 的 build-plan 同形分支在 build-plan 阶段再判）。不需要新建任何标记，不需要改动任何已冻结的任务状态。

### step 6 grill · 退出检查收尾与失败语义钉死

- **检查 3 失败路径语义（本阶段钉死，不再下放）**：进入报告「没做到」部分的，是**全部非通过终态**，且分两类来源，不得互相顶替：
  - **机器判定类**（由运行时从原始 stdout 自行推出，生产者不能自报）：`missing`、`inconsistent`、`incomplete`、`failed`、`unavailable`；逐条枚举，不许总结（G5甲）。
  - **人写声明类**：`coverage_limits`（+ `exceptions`）——生产者必须写明覆盖边界，空数组不合法（`runtime/evidence/acceptance-evidence-validator.mjs:63,73`；`runtime/review/schemas/ac-evidence-summary.schema.json:29,42` `required` + `minItems:1`）。
  - **不新增状态机**：沿用上述既有词表，只在报告层做「进入/不进入最前面」的映射。
- **归档回放的可达性结论**：运行时模块**不读** `specs/archive/**`（材料根由 `core/artifact-dir.mjs:157-178` 定在 `<worktree>/specs/<task_id>/`），因此回放**不走运行时**，而是由**材料层**直接读归档原件、以其中已记录的事实为基准（G3甲）。card-01/card-02 归档为 PRE 形态、card-07 为 POST 形态（其 `phases/index.md` 满足 `phaseFilesFromIndex`）、**card-05 没有归档目录**。
- **CONTEXT.md 判定（最终）**：**不改**。新增名词都是实现级（stage 末报告、入口库存、三样落点）；`CONTEXT.md:301` 的「逐条 AC 的可读验收视图」与 `:305` 的 cohort 材料语义**已经存在**，本卡做的是让已有领域名的实现不再留空槽。
- **ADR 判定（最终）**：**需要一项**，三项判据全为真——① 难以反转：它改变 pre 与 post 在阶段末的核查边界，后续所有卡都受影响；② 无背景会意外：未来的读者会问「为什么 pre 卡忽然也跑这条链、为什么这个报告在聊天里交付」；③ 存在真实取舍：曾认真比较过对称压缩、机器原样贴、主会话执笔、建激活标记、重建任务等方案。**落点**：`docs/adr/`（现 37 项，最新编号 0031；注意 `0027` 与 `0031` 各有两份重号文件，新建时取 `0032`，并在文件内注明重号事实）。
- **收敛判定**：grill 已无 high/medium 待答项（共提出 7 问，1 问经核实后重提一次）。

## module-convergence

### step 7 module-convergence · 第 1 批（1 组 / 2 问）

**宿主工具**：`ask_user_question`（单选卡片）。**驱动**：`workflows/make-decision/steps.json` step 7 直接驱动，无独立技能。
**问题来源**：只读子代理 `eb35db3c-840c-4503-9787-2a6299851aee` 交回的受影响模块台账（8 模块 + 10 个方向级开放问题），全文 `/tmp/wh-an/research/module-ledger.md`（529 行）；该子代理全程只读，工作树零改动。

#### 先核实的事实（推翻本会话先前假定，逐条带证据）

1. **「填三个已有空槽」低估了改造面**：逐条验收链的每一行要求 4 个非空 id 数组（`runtime/stage/stage-content-contracts.mjs:6293-6295`，其中含先前未点名的 `task_ids`）+ 2 个 anchor + gate 三件套 + test_result + `review_ref` + `stage_end_ref` + 3 段文本 + `status === "covered"` + AC 双向完整性（`:6276-6323`）。只填 `source_ids`/`decision_ids`/`fr_ids`，行仍全红。
2. **`task_ids` 结构性不可满足**：校验器去 `packet.materials.tasks` 找（`stage-content-contracts.mjs:6301`），而 build-code packet 的 materials 没有 `tasks` 键（`runtime/stage/stage-runner.mjs:3954-3961`），post 卡按 AGENTS.md 亦不生成 `tasks.md`。
3. **`review_ref` 无载体且必然撞 CARD-05**：`packet.evidence`（`stage-runner.mjs:3900-3918`）只有 decision-log / spec / phase-index / phases* / implementation / tests / ac-trace，无 review 项；唯一生产者在 `runtime/review/stage-review-disposition.mjs:230,263-268`，而 CARD-05 正在改 `runtime/review/**`。
4. **「已经算出来却被丢掉」最硬的一处不是 id 数组**：`runtime/stage/stage-runner.mjs:3947` 写死 `evidence_refs: []`，而 `runtime/stage/stage-handlers.mjs:1696` 已经把真实证据引用算好了。
5. **附带事实**：`coverage_limits` 在同一个仓里有两种形状——链行要字符串（`stage-content-contracts.mjs:6312`；`:6302` 是 `file_symbol`），`runtime/evidence/acceptance-evidence-validator.mjs:73-77` 与 `runtime/evidence/quality-store.mjs:169-172` 要非空文本数组。预算数字出处是 `docs/architecture/complexity-baseline.json:58-64`（step 10 现场复核更正；`formal_test_lines` target 10000 / limit 12000；`public_runner_behaviors` actual 7 / limit 8），`docs/standard-workflow.md` 与 `CONSTITUTION.md` grep 零命中。`vitest.config.mjs:24` 的 `workflows/build-code/__tests__/**` 是死 include 根（目录不存在）。`docs/architecture/complexity-baseline.json` 公布 `formal_test_lines.actual = 20292`，实测 76,075 行。本卡材料目录目前只有本文件（912 行），故一切写入 `spec.md`、`phases/` 的内容必须等 build-spec、build-plan。
6. **报告输入链路今天是通的**：`run:execute` 的 stdout 即完整 stage 结果 JSON（step 10 现场复核更正：`tools/cli/stage-runtime.mjs:1508-1527` 实为**拒绝退役输入的校验块**——`:1509` 拒绝 `receipts.stage_outcomes`、`:1511-1520` 处理 `research_report`——**不是 stdout 产出点**；warning 的真实载体是 `runtime/stage/stage-runner.mjs:3010-3029`；`:1676-1696` 的静默守卫只对 preflight 生效），主会话今天就能拿到 `spec_analyze.result.errors` 的逐条原文，不需要新造出口。

#### 问题与答复

| # | 轴 | 选项 | 用户真实答复 |
| --- | --- | --- | --- |
| M1 | 逐条验收链改到哪一步 | 甲 只把真实事实接回给人看／乙 让 pre 卡也有完整信息量（补材料 + pre 版必填表）／丙 先甲后乙分两张卡 | **甲** |
| M2 | 仓库公布的数字不实，本卡管不管 | 甲 修正数字并写明口径／乙 只写明口径差不动数字／丙 本卡不碰 | **甲** |

#### 由答复直接推导的事实

- **M1 甲**：本卡**不碰校验器、不碰 CARD-05、不碰 `task_ids`**。要做的是把「已经算出来却被丢掉」的真实事实接回报告：`stage-runner.mjs:3947` 的 `evidence_refs`、逐 AC 的真实执行命令与结果、`coverage_limits`。链该报的缺照报；报告里**重复的缺归并成一条说明**，每条 AC 已知的事实逐条列出。**这条链本身在本卡之后仍会判「不完整」，这是被明确接受的**——判绿不是本卡的目标。
- **M2 甲**：修正 `docs/architecture/complexity-baseline.json:61-68` 的数字并写明计数口径；由此会暴露「实测超上限约 6.3 倍」这一事实，须如实写出。该文件被 `tests/contract/repository-inventory.test.mjs:175` 按内容钉住，改动须连同该断言一起处理。（step 10 现场复核更正：该引文里的 `docs/architecture/complexity-baseline.json:61-68` 现场读为 `:58-64`；逐字原文保留不改。）

#### 本批自答的 8 个开放问题（用户未反对即成立）

| 开放问题 | 决定 | 理由 |
| --- | --- | --- |
| Q2 `review_ref` 怎么办 | 本卡不填，如实标注载体在审查侧 | `runtime/review/**` 正被 CARD-05 修改，撞车是确定事实而非推测 |
| Q5 `coverage_limits` 两种形状 | 各写各的合法值，不改校验器 | 同值照搬必红；改形状＝改两处校验器，超出 M1 甲的范围 |
| Q6 报告输入用 stdout 还是文件 | `run:execute` 的 stdout JSON | 链路今天已通；用户已明确不看文件 |
| Q7 `spec_analyze` 缺料时 | 如实写「缺」，不补跑 | 与 M1 甲一致：如实呈现优先于补齐 |
| Q8 入口清单落点 | 新建独立文档放 `docs/architecture/` | `control-plane-inventory.json` 是治理清单，语义不同 |
| Q10 ADR-0032 何时入库 | build 阶段随实现一起入库 | make-decision 不提交；本卡只有 decision-log |
| Q4 pre 版 required 表 | 不做（等同重新分叉 cohort） | 与「不分 cohort」冲突，且属 M1 乙范围 |
| Q1 post 无 `tasks.md` 的 `task_ids` | 如实标不可满足，不改校验器 | M1 甲范围；改校验器等于动合同 |

#### step 7 落地顺序（子代理建议，采纳）

先裁 M1/M2（已完成）→ 做阶段末报告与真实入口库存（零运行时风险、链路已通）→ 逐 AC 执行事实接线 → `coverage_limits` → 测试体系化只写文档 → 规则落点押后到 build-plan（本卡切为 post 后不再有 build-spec 阶段）。

## cohort 切到 post 与「post 卡跑不起来」缺陷（step 7 第 3 问）

### 用户结论（逐字）

> 别再浪费精力在pre卡上面了，请直接把当前任务类型改成post，以后都只会有post任务，我不想浪费时间精力在pre上面

此答复**取代** G7b 的「甲」（放开 `runtime/stage/stage-runner.mjs:4289-4291` 的 `activation_cohort === "post"` 限制并让 card-04 保持 pre）。此后不再为 pre 形态做任何设计。

### 已执行的档案改动

`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/task.json`：

| 字段 | 改前 | 改后 |
| --- | --- | --- |
| `activation_cohort` | `pre` | `post` |
| `activation_cohort_frozen_at` | `2026-09-22T11:41:14.576Z` | `2026-09-22T15:00:25.000Z` |

文件 sha256：`025527f5e826fb038228ae34a5f54ae486f459ce243e7e09d44bb55b16ddbc57` → `fb0a4fd764318e988be1f111507c9104934fba44175589252f22c30e78d3c91d`。未新增任何键（`runtime/task/task-store.mjs` 的 `assertRoot` 只校验 `task.json` 是常规文件、`task_id` 匹配且非空，没有严格键模式）。

**诚实说明**：这一步是**产品之外的途径**改的档案。全仓没有任何代码路径能改写既有 `task.json`：`runtime/task/task-handle.mjs:617-635` 的 `publishTaskDirectory` 是唯一写者，且以 `if (existsSync(taskPath)) throw new Error(\`task already exists: ...\`)` 拒绝覆盖；`runtime/task/task-handle.mjs:486-500` 的 `assertPublicRecordWritable` 明确把 `task.json` 列为 kernel-owned。历史先例（card-05 `created_at 09-21T16:19:54.275Z` vs `frozen_at 09-22T06:12:27.630Z`；card-07 `created_at 09-20T23:30:31.430Z` vs `frozen_at 09-21T16:20:05.000Z`）说明这两张卡的 cohort 同样是建卡之后写进去的。**「换 cohort」今天不是一个产品能力。**

### 切换后的拓扑

`resolveTopology({task_type:"普通任务", activation_cohort:"post"})` → `["make-decision","build-plan","build-code","verify-code"]`（**跳过 build-spec**）；pre 为五阶段全量。post 材料集合为 `decision-log.md` + `spec.md` + `phases/index.md` + `phases/P<n>.md`。

### 发现的真缺陷：post 卡在 make-decision 阶段结构性跑不起来

切换后 `node tools/cli/stage-runtime.mjs status --action=begin --stage=make-decision` 逐字报错：

```
Error: current task material missing or unreadable: spec.md, phases/index.md
    at stageRuntimeMain (…/tools/cli/stage-runtime.mjs:1189:15)
```

根因（逐字证据）：

- `spec.md` 与 `phases/` 在 post 路线里由 **build-plan** 生产：`workflows/build-plan/SKILL.md:40-41`「For post-cohort tasks, this stage owns current `spec.md`, independent `phases/P<n>.md` files, and `phases/index.md`」；`:195-196`「for a post-cohort task, draft `spec.md` from the decision at `spec-specify` before using it」。
- 但 `tools/cli/stage-runtime.mjs:1186` 把 post 材料检查写成**无条件**：只要 cohort 是 post，`decision-log.md`/`spec.md`/`phases/index.md` 三件缺一即抛错。⇒ 任何全新 post 卡在 make-decision 阶段永远缺两个尚未被生产的文件。
- 真正的材料消费者不是这么写的：`runtime/stage/stage-context.mjs:262-264` 只对 build-code / verify-code 断言全套材料（`if (!readOnly && (normalizedStage === "build-code" || normalizedStage === "verify-code")) assertCurrentTaskMaterials(...)`）。`status` 的这道检查比消费者更严。

### 已应用的修复（用户裁定「甲：现在就修」）

`tools/cli/stage-runtime.mjs`：把 post 材料检查收窄到真正消费全套材料的阶段。

```js
const postMaterialConsumer = values.stage === "build-code" || values.stage === "verify-code";
if (activationCohort === "post" && postMaterialConsumer) {
```

diff 规模：1 文件 +6 −1。修复后 `status --action=begin --stage=make-decision` exit 0、无 stderr，`work_status="ready"`、`continuation_allowed=true`。

**遗留义务**：这次改动是在 make-decision 阶段落的生产代码（提前落代码，不属于本阶段的产品面）。build-code 阶段必须为它补测试，且必须覆盖两侧：「post + make-decision/build-plan 缺 `spec.md` 不抛错」与「post + build-code/verify-code 缺材料仍抛错」。

### 顺带发现的第二个缺陷：make-decision 的研究回执无法存活到阶段末

`quality/evidence/research/` 下六份回执（`07af47fa…`、`270a1563…`、`3160ef98…`、`a18aae70…`、`d89b6f90…`、`e72dd900…`）都绑定 `snapshot_tree=37f4a565fa42fbbc1773a8d2f436d5930d622784`、`material_scope_revision=revision-58841b1b463de4d9929a8b83b100949da41555b9f440cd7a1ce6dc0c091fd844`，六份 `status:"completed"`。当前认证值是 `snapshot_tree=3a4f854b6835b147aa62b2bf90e85c635c665ef2`、`material_revision=revision-7884d848a916211f41997c5b34d686053b9af54f096720d0601e1b9fa227ddd1`。⇒ `status` 现在报 `research.status="unavailable"`、`reason="research_record_missing"`、**exit 0**。

结构性原因：(a) `snapshot_tree` 覆盖整个 worktree，任何代码或文档改动都会使其失效；(b) `material_scope_revision` 在 make-decision 阶段只覆盖 `decision-log.md`——而它正是本阶段自己的产物，每写一步就变一次。两者叠加的结果是：**只要 make-decision 在调研之后再写一次 decision-log，调研证据必然失效，且失效是静默降级（不阻断、不报错）。** 本卡如实记录，不在本阶段补绑（补绑后下一次写入立刻再失效）。


---

## 目标

以下目标只从 `## 原始需求`、`### 需求框架` 的「目标」节点与已收敛的 talk/grill 答复推出，不新增目标。

- **准绳**：本卡的目标是**质量合格**，不是流程正确。用户逐字：「没错，这个方向才更合理一些。我要的不是流程正确，而是质量合格」（`decision-log.md:25`）。
- **目标陈述（用户逐字）**：「card-04 的目标不是阻碍任务推进，而是提高交付质量。通过更高质量的验收标准、验收方式、单元测试、端到端测试，来保证当前任务开发的效果符合原始需求，并且最开始设计的用户痛点，能通过真实测试在任务完成后进行处理。而不是现在通过一大堆脚本来确认代码绿了。绿了没有意义，问题真的解决了才有意义！」（`decision-log.md:23`）
- **体系级要求（用户两次逐字强调，R-004 / R-005）**：让每个通过 workflowhub 开发的项目有**完整的单元测试和端到端测试**，而不是「做一个功能补一点测试」，避免功能多了之后测试文件大量堆积、完全没有系统化考虑和优化（`decision-log.md:64-65`、`:74-75`）。
- **三层方向**：验收标准的写法 / 验收方式走真实入口 / 单测与 E2E 的体系化；落地阶段为 make-decision 与 build-plan（`decision-log.md:25`）。
- **返工根因侧的目标（R-008）**：通过 make-decision 和 build-plan 仔细设计验收标准与测试流程，保证每个 phase 与 task 高质量交付、减少返工（`decision-log.md:68`、`:76`）。
- **可度量的收敛口径（OPEN-002 已收敛）**：不设统一预算门；覆盖率只作诊断；预算只报不拦（`decision-log.md:2057`）。ADR-0032 已替代「覆盖率是否挂 ADR 0027」这一挂载点（OPEN-004，`decision-log.md:2059`）。
- **可回读的目标判据**：最终 oracle 是**用户本人**；仓库机制只能保证三件事：(a) 步骤字面可跑；(b) 每一步的真实结果被如实印出；(c) 没做到的部分印在最前面（`decision-log.md:801`）。
- **证据状态诚实标注**：需求框架「目标」节点在 step 3 时的原始记录为 `状态=开放`、`证据状态=待补`、`证据归属=step 5 Talk`、`下一次复核触发=step 5 outline-talk 用户答复`（`decision-log.md:94`）；该节点在 step 5 后由 Q1–Q4 答复与 OPEN-002 收敛，但**本稿没有回写该节点行的状态值**（回写属主会话动作）。
- **MISSING — not established**：本卡没有把目标写成带数值阈值的成功判据（OPEN-002 明确不设统一预算门）。既有 `## 状态` 记 `## 成功/失败边界` 为刻意暂缺（`decision-log.md:27`）；该节不在本次要求的节列表内，本稿不补。

## 范围

- **已收敛的交付范围（OPEN-001 逐字）**：「**已收敛**：卡面四项 + 测试资产落点/命名/规模规则 + 覆盖率口径 + 入口登记规则 + AC→阶段末报告翻译契约（step 5 outline-talk 第 1 批 Q1–Q2）」（`decision-log.md:2056`）。
- **卡面来源**：母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`（只读）的 **FR-16 至 FR-21、AC-16 至 AC-21、SD-05/SD-06/SD-13/SD-15/SD-17**（`decision-log.md:37`）。
- **本卡工作面**：`ui_applicability` 为 `non_ui`；工作面是 `workflows` 目录、`runtime` 目录、`tools` 目录、`tests` 目录与 `skills` 目录，**没有前端目录、没有路由、没有页面清单**，故 `page_scope` 类别在本卡没有适用单元（`decision-log.md:126`）。
- **材料形态（post）**：`decision-log.md` + `spec.md` + `phases/index.md` + `phases/P<n>.md`；不产出 `plan.md`/`tasks.md` 双写（`decision-log.md:975`）。
- **写面与兄弟卡硬边界**（`decision-log.md:53-55`）：
  - 与 **CARD-07** 共享 `make-decision` 的「验收写入步」写面；母 PRD `prd.md:345-346` 规定：**先冻结接口的一方为集成责任方**，另一方在冻结接口上对齐，协调必须发生在 build-plan 之前或不晚于 build-code。
  - 与 **CARD-05**：CARD-05 拥有 review provider 与审查工具本身；本卡只拥有「验收事实与测试资产的契约」，**不得改审查工具实现**。
  - 与 **CARD-10**：CARD-10 执行整体集成验收；本卡只定义「验收标准如何被写成可执行形式」与「测试资产如何落点」，**不执行总体集成验收**。
- **约束**：零新增依赖；不新增阻断门/计数器/schema（`CONSTITUTION.md:85`）；不设统一预算门（`docs/standard-workflow.md:90`）（`decision-log.md:866`）；不重新引入哈希绑定、回执、快照、材料身份校验类机器门禁（SD-17 与母 decision-log OI-013，`decision-log.md:1779`）。
- **只读边界**：母任务目录 `specs/workflowhub-thin-core-rebuild-planning-20260919/` 只读；兄弟卡 worktree 与其分支只读；`specs/archive/**` 只读；`/tmp/wh-an/**` 取证材料只读（`decision-log.md:44-49`）。
- **不做的事**：见已存在的 `## 非目标`（`decision-log.md:1773-1781`），本节不重复。

## 决定

本节按 `## module-convergence` 交回的模块台账（8 模块）组织，每个承重决定一条，链序为 `来源事实 → 约束 → 选中选项 → 预期结果`。D-id 只在本稿内定义，`derived_from` 只引用本稿内的 D-id。
注：step 7 第 1 批问答表里出现的 `M1`／`M2` 是**当批问题的编号**（`:900-903`），与模块台账的 `M1..M8` 模块编号**不是同一套编号**；下文的 `M1..M8` 一律指模块。

### D-001 — M1 逐条验收链

- question/final_option：逐条验收链（`acceptanceChain`）在本卡改到哪一步？→ 实际选中：**甲 只把真实事实接回给人看**（补材料、改校验器一律不做）。
- recommendation/plain_language：**被推荐且被采纳**（该问的推荐项即甲，`decision-log.md:927`）。大白话：不去修那份"检查清单为什么判红"的机器，只把**已经算出来、却被代码丢掉**的事实重新捡回来印给人看；清单本身继续判"不完整"是可以接受的。
- decision：本卡**不碰校验器、不碰 CARD-05、不碰 `task_ids`**；要做的是把「已经算出来却被丢掉」的真实事实接回报告：`runtime/stage/stage-runner.mjs:3947` 写死的 `evidence_refs`、逐 AC 的真实执行命令与结果、`coverage_limits`。链该报的缺照报；报告里**重复的缺归并成一条说明**，每条 AC 已知的事实逐条列出。**这条链在本卡之后仍会判「不完整」，这是被明确接受的**——判绿不是本卡的目标。
- status：confirmed
- source_type/reference/exact_excerpt：来源类型 = **真实用户答复**（`ask_user_question` 单选卡片，step 7 module-convergence 第 1 批，宿主工具见 `decision-log.md:911`）＋一手代码事实。用户答复逐字为选项「甲 只把真实事实接回给人看」（`decision-log.md:927`）；该答复的权威记录逐字为：「**M1 甲**：本卡**不碰校验器、不碰 CARD-05、不碰 `task_ids`**。要做的是把「已经算出来却被丢掉」的真实事实接回报告：`stage-runner.mjs:3947` 的 `evidence_refs`、逐 AC 的真实执行命令与结果、`coverage_limits`。链该报的缺照报；报告里**重复的缺归并成一条说明**，每条 AC 已知的事实逐条列出。**这条链本身在本卡之后仍会判「不完整」，这是被明确接受的**——判绿不是本卡的目标。」（`decision-log.md:932`）代码事实引用：`runtime/stage/stage-runner.mjs:3947`、`runtime/stage/stage-handlers.mjs:1696`、`runtime/stage/stage-content-contracts.mjs:6276-6323`。
- approval_binding：批准状态 = **用户已在结构化问答中作出真实选择**（宿主可见引用：`decision-log.md:925-928` 的问答表与答复列）。**尚无最终批准凭证与哈希**：本卡 `## 最终确认` 尚未产生，故 `approval_hash` 一栏 MISSING — not established；不得以本稿冒充最终确认。
- facts_and_constraints：
  - 链的每一行要求 4 个非空 id 数组（`runtime/stage/stage-content-contracts.mjs:6293-6295`，其中含先前未点名的 `task_ids`）+ 2 个 anchor + gate 三件套 + `test_result` + `review_ref` + `stage_end_ref` + 3 段文本 + `status === "covered"` + AC 双向完整性（`:6276-6323`）⇒ 只填 `source_ids`/`decision_ids`/`fr_ids`，行仍全红（`decision-log.md:916`）。
  - `task_ids` 结构性不可满足：校验器去 `packet.materials.tasks` 找（`stage-content-contracts.mjs:6301`），而 build-code packet 的 materials 没有 `tasks` 键（`runtime/stage/stage-runner.mjs:3954-3961`），post 卡按 `AGENTS.md` 亦不生成 `tasks.md`（`:892`）。
  - `review_ref` 无载体且必然撞 CARD-05：`packet.evidence`（`stage-runner.mjs:3900-3918`）无 review 项；唯一生产者在 `runtime/review/stage-review-disposition.mjs:230,263-268`，而 CARD-05 正在改 `runtime/review/**`（`:893`）。
  - `runtime/stage/stage-runner.mjs:3947` 写死 `evidence_refs: []`，而 `runtime/stage/stage-handlers.mjs:1696` 已经把真实证据引用算好了（`:894`）。
  - 报告输入链路今天是通的：`run:execute` 的 stdout 即完整 stage 结果 JSON（step 10 现场复核更正：`tools/cli/stage-runtime.mjs:1508-1527` 实为拒绝退役输入的校验块，**不是 stdout 产出点**；warning 的真实载体是 `runtime/stage/stage-runner.mjs:3010-3029`；`:1676-1696` 的静默守卫只对 preflight 生效）（`:896`）。
  - `coverage_limits` 在同一个仓里有两种形状（链行要字符串 `stage-content-contracts.mjs:6312`（`:6302` 是 `file_symbol`）；`runtime/evidence/acceptance-evidence-validator.mjs:73-77` 与 `runtime/evidence/quality-store.mjs:169-172` 要非空文本数组）（`:895`）。
  - 不得重新引入 SD-17 禁止的哈希/回执/快照/材料身份校验类机器门禁（`decision-log.md:1779`）。
- Logic：来源事实（链的空槽 + 已算好却被丢弃的事实）→ 约束（不改校验器合同、不撞 CARD-05、不新增门、SD-17；本卡准绳是质量合格不是流程正确）→ 选中选项（只把真实事实接回给人看）→ 预期结果（用户能看到每条 AC 的真实命令与结果；链仍如实判「不完整」，本卡不以判绿为目标）。
- choice_reason/impact：**胜出理由**：改校验器＝改合同，超出本卡范围且必然与 CARD-05 的 `runtime/review/**` 写面撞车；用户已明确要的是质量而不是流程正确（`decision-log.md:25`）。**影响面**：范围＝只动报告与事实呈现；接口＝不新增接口、不动 packet 形状；验收＝不改判定资格、不新增失败面；数据＝新增只读呈现，不改既有状态词表；运维＝零新增进程与依赖。
- consequences_and_risks：**立刻的取舍**：这条链在本卡之后仍会判「不完整」，本卡不能靠它变绿。**将来的代价**：`task_ids` 与 `review_ref` 两处结构性缺口会长期留在报告里，若无人接手会退化成噪音；必须靠"归并成一条说明"控制长度。
- rejected_alternatives：
  - 乙 让 pre 卡也有完整信息量（补材料 + pre 版必填表）——否决理由：与「不分 cohort」冲突，且用户已裁定今后不再为 pre 做设计（`decision-log.md:945`、`:931`）。
  - 丙 先甲后乙分两张卡——否决理由：用户未选，且其中的乙已被排除（同上）。
  - 改校验器让 `task_ids` 可满足——否决理由：等于动合同，超出 M1 甲范围（`decision-log.md:946`）。
  - 本卡填 `review_ref`——否决理由：`runtime/review/**` 正被 CARD-05 修改，撞车是确定事实而非推测（`decision-log.md:939`）。
- unresolved_items/owner：① `task_ids` 在 post 无 `tasks.md` 条件下的最终满足方式——为什么：本卡不改校验器；owner = build-plan。② `review_ref` 的载体——owner = CARD-05。③ 链长期判「不完整」是否可持续——owner = build-plan 与卡主。④ 本决定的最终用户确认——owner = make-decision 主会话（step 12/13）。
- Supersedes：none
- module：M1 逐条验收链
- requirement_ids：[R-001, R-003]
- derived_from：[]
- artifacts：[specs/workflowhub-thin-core-card-04-20260919/decision-log.md, runtime/stage/stage-runner.mjs, runtime/stage/stage-handlers.mjs, runtime/stage/stage-content-contracts.mjs, build-plan 产出的 spec.md 与 phases/P<n>.md（尚未生成）]

### D-002 — M2 cohort 分叉

- question/final_option：card-04 自己、以及今后的卡，用哪个 cohort 形态跑？→ 实际选中：**全部 post**，不再为 pre 形态做任何设计。
- recommendation/plain_language：非"推荐项"驱动，而是**用户直接裁定**（同一问题上主会话先后两次给出的推荐都被新事实推翻）。大白话：以后只有一种任务形态，旧的那一种不再花精力；本卡自己就换成新形态跑，好让新形态的检查第一次真的跑起来。
- decision：card-04 的 `activation_cohort` 由 `pre` 改为 `post`（`task.json`，`decision-log.md:966-969`）；`resolveTopology({task_type:"普通任务", activation_cohort:"post"})` → `["make-decision","build-plan","build-code","verify-code"]`（**跳过 build-spec**，`decision-log.md:975`）；post 材料集合 = `decision-log.md` + `spec.md` + `phases/index.md` + `phases/P<n>.md`，不产出 `plan.md`/`tasks.md` 双写。并已修 `tools/cli/stage-runtime.mjs`，把 post 材料检查收窄到真正消费全套材料的阶段。
- status：confirmed
- source_type/reference/exact_excerpt：来源类型 = **用户逐字答复**（step 7 第 3 问）。逐字原文：「别再浪费精力在pre卡上面了，请直接把当前任务类型改成post，以后都只会有post任务，我不想浪费时间精力在pre上面」（`decision-log.md:956`）。该答复的权威结论逐字：「此答复**取代** G7b 的「甲」（放开 `runtime/stage/stage-runner.mjs:4289-4291` 的 `activation_cohort === "post"` 限制并让 card-04 保持 pre）。此后不再为 pre 形态做任何设计。」（`decision-log.md:958`）
- approval_binding：批准状态 = **用户逐字直接裁定**（宿主可见引用：`decision-log.md:952-958` 的「用户结论（逐字）」小节）。**无宿主凭证与哈希**（该答复以对话文本而非结构化问答卡片给出）；`approval_hash` MISSING — not established。最终确认仍待 step 12/13。
- facts_and_constraints：
  - `activation_cohort` 不是可选项，而是 bootstrap 时被"观测"出来的：`tools/cli/task-bootstrap.mjs:45-60` `resolveCard01Activation()` 读 `<storageRoot>/activation/card-01.json`；文件不存在 ⇒ `cohort:"pre"`，合法 ⇒ `cohort:"post"`；全仓无任何 CLI 参数可指定 cohort（`decision-log.md:860`）。
  - storageRoot 实测 = `/Users/Hugh/Hugh/Knowledge`；`/Users/Hugh/Hugh/Knowledge/activation/` **不存在** ⇒ 今天凡新卡必为 pre（`decision-log.md:861`）。
  - 改档案是**产品之外的途径**：全仓没有任何代码路径能改写既有 `task.json`——`runtime/task/task-handle.mjs:617-635` 的 `publishTaskDirectory` 是唯一写者且以 `task already exists` 拒绝覆盖；`runtime/task/task-handle.mjs:486-500` `assertPublicRecordWritable` 把 `task.json` 列为 kernel-owned ⇒ 「换 cohort」今天不是一个产品能力（`decision-log.md:971`）。
  - 档案改动逐字：`activation_cohort` `pre` → `post`；`activation_cohort_frozen_at` `2026-09-22T11:41:14.576Z` → `2026-09-22T15:00:25.000Z`；文件 sha256 `025527f5e826fb038228ae34a5f54ae486f459ce243e7e09d44bb55b16ddbc57` → `fb0a4fd764318e988be1f111507c9104934fba44175589252f22c30e78d3c91d`；未新增任何键（`decision-log.md:969`）。
  - 切换后暴露真缺陷：`status --action=begin --stage=make-decision` 逐字报错 `Error: current task material missing or unreadable: spec.md, phases/index.md`（`tools/cli/stage-runtime.mjs:1189`）；根因是 `:1186` 把 post 材料检查写成无条件（`decision-log.md:982-990`）。
  - 真正的材料消费者不是这么写的：`runtime/stage/stage-context.mjs:262-264` 只对 build-code / verify-code 断言全套材料（`decision-log.md:990`）。
  - 已应用的修复逐字代码：`const postMaterialConsumer = values.stage === "build-code" || values.stage === "verify-code";` / `if (activationCohort === "post" && postMaterialConsumer) {`；diff 规模 1 文件 +6 −1；修复后 exit 0、无 stderr、`work_status="ready"`、`continuation_allowed=true`（`decision-log.md:996-1001`）。
  - **遗留义务**：这次改动是在 make-decision 阶段落的生产代码；build-code 阶段必须为它补测试，且必须覆盖两侧：「post + make-decision/build-plan 缺 `spec.md` 不抛错」与「post + build-code/verify-code 缺材料仍抛错」（`decision-log.md:1003`）。
- Logic：来源事实（cohort 由 bootstrap 观测、今天新卡必为 pre、card-04 档案已冻结为 pre）→ 约束（用户不愿再在 pre 上花成本；pre 卡的逐条验收链永不做机器核查 `stage-runner.mjs:4289-4293`）→ 选中选项（改档案切 post + 修 post 材料检查）→ 预期结果（本卡自己的 build-code 成为该链的第一个真实样本；只有一种任务形态需要维护）。
- choice_reason/impact：**胜出理由**：user 直接裁定；且只有 post 才会执行 build-code 的逐条验收链机器核查（`runtime/stage/stage-runner.mjs:4289-4293`），而这正是 card-07 那 858 errors / 858 findings 唯一被发现的通道（`decision-log.md:863`）。**影响面**：范围＝材料形态改为 post（`decision-log.md:975`）；接口＝`tools/cli/stage-runtime.mjs` 提前落了一处生产改动；验收＝本卡自己的验收路径被改变；数据＝`task.json` 两个字段值被改写；运维＝换 cohort 仍无产品能力，属人工档案操作。
- consequences_and_risks：**立刻的取舍**：档案被产品之外的途径改写，不可由产品复现；make-decision 阶段提前落了生产代码（不属于本阶段产品面）。**将来的代价**：pre 形态的既有能力（含 `activation_cohort === "post"` 限制所跳过的一切）退出设计面；`tools/cli/stage-runtime.mjs` 的这处改动必须由 build-code 补两侧测试，否则会成为无测试覆盖的生产代码。
- rejected_alternatives：
  - G7b 甲：放开 `runtime/stage/stage-runner.mjs:4289-4291` 的 `activation_cohort === "post"` 限制、card-04 保持 pre——被本条取代（理由即用户逐字原话）。
  - G7 首次乙：新建激活标记把今后所有卡变 post——否决理由：今天建标记**只影响之后再建的新卡**（`decision-log.md:891`）；且合法标记必须带 `capability_acceptance.ref` + 64 位 `sha256`、以及 `entry_consumption.evidence_ref` + `observed_at`（`tools/cli/task-bootstrap.mjs:52-57`），而在整个仓库与整个 Knowledge 库内找不到任何这样的产物，且全仓没有任何代码会写该文件 ⇒ 手工创建即伪造发布闸门（`decision-log.md:892`）。
  - G7b 丙（建标记 + 把 card-04 作为新任务重建）与丁（什么都不动）——用户未选；log 未记录逐条否决理由 ⇒ MISSING — not established。
- unresolved_items/owner：① 换 cohort 不是产品能力这件事要不要变成能力——为什么：本卡只改档案不建能力；owner = 后续卡（本卡未指派）。② `tools/cli/stage-runtime.mjs` 提前落地的生产改动的两侧测试——owner = build-code。③ 本决定的最终用户确认——owner = make-decision 主会话。
- Supersedes：`## grill` 第 3 批 G7b 的答复「甲」（放开 pre 条件、card-04 保持 pre）；`## grill` 第 3 批 G7 首次答复「乙」（新建激活标记）；`## module-convergence` 自答开放问题 Q4「pre 版 required 表 = 不做」所依赖的 pre 前提（`decision-log.md:945`、`:1562`）。
- module：M2 cohort 分叉
- requirement_ids：[R-001, R-003, R-007]
- derived_from：[]
- artifacts：[/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/task.json, tools/cli/stage-runtime.mjs, runtime/stage/stage-context.mjs, specs/workflowhub-thin-core-card-04-20260919/decision-log.md]

### D-003 — M3 逐 AC 执行事实

- question/final_option：「已经算出来却被丢掉」的事实怎么接回给报告？→ 实际选中：接线 `evidence_refs` 空槽，并把逐 AC 的真实执行命令与结果接进报告，不改校验器。
- recommendation/plain_language：作为 M1 甲的直接产物被采纳（子代理建议的落地顺序里，逐 AC 执行事实接线排在阶段末报告与入口库存之后，`decision-log.md:950`）。大白话：每条验收标准的"到底跑了什么命令、结果是什么"，本来就算好了，只是被扔掉了，现在把它捡回来印出来。
- decision：把 `runtime/stage/stage-runner.mjs:3947` 写死的 `evidence_refs: []` 接回 `runtime/stage/stage-handlers.mjs:1696` 已经算好的真实证据引用；逐 AC 的真实执行命令与结果进报告。不改校验器、不改 packet 形状。
- status：confirmed
- source_type/reference/exact_excerpt：来源类型 = **一手代码事实**（step 7 只读子代理台账，`decision-log.md:912` 记录全文 `/tmp/wh-an/research/module-ledger.md` 529 行）＋ M1 甲的推导事实。逐字原文：「**「已经算出来却被丢掉」最硬的一处不是 id 数组**：`runtime/stage/stage-runner.mjs:3947` 写死 `evidence_refs: []`，而 `runtime/stage/stage-handlers.mjs:1696` 已经把真实证据引用算好了。」（`decision-log.md:919`）
- approval_binding：批准状态 = 由用户对 M1 问的真实答复「甲」覆盖（宿主可见引用：`decision-log.md:927`、`:907`）；本条目本身**没有独立的结构化问答答复**，是 M1 甲范围内的实现面推导。`approval_hash` MISSING — not established。最终确认待 step 12/13。
- facts_and_constraints：
  - `runtime/stage/stage-runner.mjs:3947` 写死 `evidence_refs: []`；`runtime/stage/stage-handlers.mjs:1696` 已算好真实证据引用（`decision-log.md:919`）。
  - 三样交付物落点已冻结（全部复用已有载体，零新增文件／schema／counter／gate）：① 逐条对账 → `acceptanceChain` 行的 `source_ids`／`decision_ids`／`fr_ids`（`runtime/stage/stage-runner.mjs:3936-3938`，现为写死的 `[]`）；② 真实入口运行记录 → `stage-quality-evidence.v1` 的 `subject_fact.execution`（运行时已产出：literal command + `stdout_ref` 内容寻址 + 运行时判定的 `assertions[].result`）；③ 没做到明说 → `coverage_limits`（`runtime/stage/stage-runner.mjs:3946` 从行透传，`:3930` 的 `...row`）（`decision-log.md:770-772`）。
  - 报告输入链路已通：`run:execute` 的 stdout 即完整 stage 结果 JSON（step 10 现场复核更正：`tools/cli/stage-runtime.mjs:1508-1527` 实为拒绝退役输入的校验块，**不是 stdout 产出点**；warning 的真实载体是 `runtime/stage/stage-runner.mjs:3010-3029`）（`decision-log.md:921`）。
  - 链行结构权威：`runtime/stage/stage-content-contracts.mjs:6293-6295`、`:6301`；语义权威 `:6257` `validateBuildCodeAcceptanceChain`（`decision-log.md:916`、`:839`）。
- Logic：来源事实（真实证据引用已算出、却被写死成空数组）→ 约束（不改校验器、不新增门、不撞 CARD-05）→ 选中选项（只接线，不重建）→ 预期结果（报告里每条 AC 有真实命令与结果可读，缺的照报）。
- choice_reason/impact：**胜出理由**：这是"零成本捡回真话"的一处——数据已经在内存里，只是被丢弃；改动落在本卡自己的写面内，不与 CARD-05 撞车。**影响面**：范围＝阶段末报告的数据来源；接口＝`acceptanceChain` 行的 `evidence_refs` 由空变实；验收＝不改判定资格（链仍判不完整）；数据＝新增真实证据引用；运维＝零。
- consequences_and_risks：**立刻的取舍**：`evidence_refs` 一旦有值，报告长度会随 AC 数量增长（由 D-005 的不对称压缩与 D-001 的"重复缺归并"控制）。**将来的代价**：`source_ids`／`decision_ids`／`fr_ids`／`task_ids` 等 id 数组仍是空槽，报告会同时呈现"有证据"与"对不上来源"两种事实，需要读者能分辨。
- rejected_alternatives：
  - 补材料 + pre 版必填表（step 7 M1 乙）——否决理由：与「不分 cohort」冲突，属 M1 乙范围（`decision-log.md:945`）。
  - 改校验器让 id 数组可满足——否决理由：等于动合同（`decision-log.md:946`）。
- unresolved_items/owner：① 三样落点中 ①（id 数组）与 ③（`coverage_limits`）的具体写入由谁在哪个阶段完成——owner = build-plan（本卡 make-decision 不产 `spec.md`/`phases/`，`decision-log.md:920`）。② 归档卡回放时 `subject_fact.execution` 的可读性——owner = build-code。
- Supersedes：none
- module：M3 逐 AC 执行事实
- requirement_ids：[R-001, R-003]
- derived_from：[D-001]
- artifacts：[runtime/stage/stage-runner.mjs, runtime/stage/stage-handlers.mjs, quality/evidence/handoff/build-code.md（既有形态）, specs/workflowhub-thin-core-card-04-20260919/decision-log.md]

### D-004 — M4 coverage_limits/exceptions

- question/final_option：`coverage_limits` 在同一个仓里有两种形状，本卡怎么处理？以及"没做到的部分"由谁定义？→ 实际选中：各写各的合法值、不改校验器；"没做到"由既有非通过终态词表定义，不新增状态机。
- recommendation/plain_language：被采纳（step 7 自答清单 Q5，用户未反对即成立，`decision-log.md:935`、`:915`）。大白话：同一件事在两个地方要求的格式不一样，就各按各的格式写，不去改那两个格式的看门人；"哪些算没做到"沿用仓库里已有的说法，不新造词。
- decision：① `coverage_limits` 两种形状各写各的合法值，不改校验器（`decision-log.md:940`）。② 进入报告"没做到"部分的，是**全部非通过终态**，且分两类来源、不得互相顶替：**机器判定类**（由运行时从原始 stdout 自行推出，生产者不能自报）＝ `missing`、`inconsistent`、`incomplete`、`failed`、`unavailable`，逐条枚举、不许总结；**人写声明类**＝ `coverage_limits`（+ `exceptions`），生产者必须写明覆盖边界，空数组不合法。③ **不新增状态机**：沿用上述既有词表，只在报告层做"进入/不进入最前面"的映射（`decision-log.md:898-901`）。
- status：confirmed
- source_type/reference/exact_excerpt：来源类型 = **grill 结论（step 6 退出检查收尾，本阶段钉死）**＋ user 答复「Q4 乙」。逐字原文：「**检查 3 失败路径语义（本阶段钉死，不再下放）**：进入报告「没做到」部分的，是**全部非通过终态**，且分两类来源，不得互相顶替：**机器判定类**（由运行时从原始 stdout 自行推出，生产者不能自报）：`missing`、`inconsistent`、`incomplete`、`failed`、`unavailable`；逐条枚举，不许总结（G5甲）。**人写声明类**：`coverage_limits`（+ `exceptions`）——生产者必须写明覆盖边界，空数组不合法……**不新增状态机**：沿用上述既有词表，只在报告层做「进入/不进入最前面」的映射。」（`decision-log.md:898-901`）
- approval_binding：批准状态 = 结论已在本阶段钉死（`decision-log.md:896-901`）；其用户侧依据是 Q4 乙 的真实答复（`decision-log.md:757`：用户对 4 问全部选择推荐项）。`approval_hash` MISSING — not established；最终确认待 step 12/13。
- facts_and_constraints：
  - Q4 乙 ⇒ 报告必须在**同一份东西的最前面**承载「没做到的部分」，素材槽位是 `coverage_limits`（+ `exceptions`）；不新增阻断门（`decision-log.md:767`）。
  - `coverage_limits` 形状冲突逐字：链行要字符串（`runtime/stage/stage-content-contracts.mjs:6312`；`:6302` 是 `file_symbol`）；`runtime/evidence/acceptance-evidence-validator.mjs:73-77` 与 `runtime/evidence/quality-store.mjs:169-172` 要非空文本数组（`decision-log.md:920`）。
  - 人写声明类的合法性来源：`runtime/evidence/acceptance-evidence-validator.mjs:63,73`；`runtime/review/schemas/ac-evidence-summary.schema.json:29,42` 的 `required` + `minItems:1`（`decision-log.md:900`）。
  - 领域名已存在：`CONTEXT.md:301`「逐条 AC 的可读验收视图」（`decision-log.md:864`）。
  - SD-17 / `CONSTITUTION.md:85`：不新增阻断门、不重新引入哈希与回执门禁（`decision-log.md:866`）。
- Logic：来源事实（同一字段两种合法形状 + 非通过终态词表已存在）→ 约束（不改校验器、不新增状态机与门）→ 选中选项（各写合法值 + 沿用既有词表分两类来源）→ 预期结果（"没做到"能被如实枚举在最前面，且不产生新的失败面或状态机）。
- choice_reason/impact：**胜出理由**：改形状＝同时改两处校验器，超出 M1 甲范围；新增状态机会造出第二套权威。**影响面**：范围＝报告最前面的内容与两类来源；接口＝不动 `coverage_limits` 的任何校验器；验收＝"没做到"的判定权归机器事实（G5甲）；数据＝沿用既有词表；运维＝零。
- consequences_and_risks：**立刻的取舍**：坏消息多时报告会很长（例如 858 条错会全列，`decision-log.md:849`）。**将来的代价**：两种形状并存本身是技术债，本卡明确不改，留给后续卡；`exceptions` 的语义边界在 log 中只出现在 `coverage_limits`（+ `exceptions`）这一处，未展开 ⇒ 记录为未决。
- rejected_alternatives：
  - Q5 同值照搬 —— 否决理由：必红（`decision-log.md:940`）。
  - Q5 改形状（统一成一种）—— 否决理由：＝改两处校验器，超出 M1 甲范围（`decision-log.md:940`）。
  - Q4 甲 只记录不拦（现状）—— 否决理由：即现状，「真话没人看」（`decision-log.md:763`）。
  - Q4 丙 记 incomplete 并阻断 —— 否决理由：正是用户明确反对的 gate，且实测 562/707（79.5%）条已记录阶段结果会新增失败（`decision-log.md:763`）。
- unresolved_items/owner：① `exceptions` 的字段语义与允许值——为什么：log 只在 `coverage_limits`（+ `exceptions`）处点名，未展开；owner = build-plan。② 两种 `coverage_limits` 形状是否在后续卡统一——owner = 后续卡（本卡未指派）。③ 852/858 类长报告的呈现长度控制——owner = build-code（与 D-005 的不对称压缩共同决定）。
- Supersedes：none
- module：M4 coverage_limits/exceptions
- requirement_ids：[R-001, R-002, R-003]
- derived_from：[D-001]
- artifacts：[runtime/evidence/acceptance-evidence-validator.mjs, runtime/review/schemas/ac-evidence-summary.schema.json, runtime/stage/stage-content-contracts.mjs, runtime/evidence/quality-store.mjs]

### D-005 — M5 stage 末报告

- question/final_option：这份验收说明接在哪里、给谁看、谁执笔、长短怎么取舍？→ 实际选中：**在 build-code stage 结束时由主会话在聊天里发出**，由**独立子代理**依据机器事实执笔，采**不对称压缩**。
- recommendation/plain_language：Q6 三个选项（含推荐项）**均未被选**，用户给出了更好的形态；G1 三个选项**均未被选**；G5、G6 用户均选择推荐项「甲」。大白话：这份说明不要在文件里，要直接在聊天里发给我；写它的人不能是做这件事的人；坏消息一条都别总结，好消息可以汇总。
- decision：① 交付现场是**聊天**，不是文件：在 build-code stage 结束时把所有测试过程和结果用**简短的大白话**说明一次（Q6 自定义答复）。② 执笔人是**独立子代理**（独立上下文、未参与实现），依据机器事实写，**主会话原样贴进聊天**，不得润色、不得删减（G6 甲）。③ 结构采**不对称压缩**：坏消息由机器事实逐条枚举、原样列出、不许总结；通过的一行汇总 + 可展开清单；每条结论挂来源（G5 甲）。④「没做到的部分」印在**同一份东西的最前面**（Q4 乙 + D-004）。
- status：confirmed
- source_type/reference/exact_excerpt：来源类型 = **用户逐字答复**（Q6 为 free_text 自定义答复；G1 为自定义答复；G5/G6 为选择推荐项）。逐字原文两段：「不用新增看过的记录，只要在build-code的stage结束时，把所有测试过程和结果用简短的大白话说明一次就好了，我会自己基于这些步骤自己去做真实验收」（`decision-log.md:796`）；「我不是要升级handoff，handoff文件内容我又不看的，我希望stage结束的时候直接在聊天内容里把这个验收报告发给我看」（`decision-log.md:828`）。
- approval_binding：批准状态 = 用户逐字答复属实（宿主可见引用：`decision-log.md:780-808` 的第 2 批问答表与逐字小节，`:796-811` 的第 1 批问答表与 G1 逐字小节）。`approval_hash` MISSING — not established；最终确认待 step 12/13。
- facts_and_constraints：
  - 人读的 stage 末说明**已经存在**：`runtime/stage/stage-handoff.mjs:11-16` 的 `STAGE_HANDOFF_STAGES` 含 `build-code`；`:315` `renderStageHandoff`、`:477` `publishStageHandoff`、`:203-206` 落到 `quality/evidence/handoff/<stage>.md`、`:379` `assertReadback` 强制 13 个有序标题；真实产物 `…card-07-20260919/quality/evidence/handoff/build-code.md`（6090 B；`authority: non_authoritative`、`retention: current_only`）。**但它没有 CLI 出口**（`rg -n "handoff" tools/cli/stage-runtime.mjs` → 0 命中；`tools/cli/stage-runtime.mjs:1685` 只吐 JSON）（`decision-log.md:816`）。
  - 用户明确**不看**该文件 ⇒ 这份说明的存在形式是 stage 结束时主会话在对话里发出来的一段内容；「有没有 CLI 出口」这个问题因此不适用（用户不经过 CLI 看），但「报告内容从哪来」升为新的核心风险（`decision-log.md:831`）。
  - Q1 丙 + Q2 乙 ⇒ **验收报告由产品代码从已有事实渲染，不由人手写**（`decision-log.md:766`）；Q5 乙 + Q1 丙 + Q2 乙 ⇒ 该说明的渲染器要能读**已归档卡**的材料形态（`decision-log.md:802`）。
  - 「**简短的大白话**」是对输出形态的硬要求：不得用字段名／退出码／文件路径堆砌代替说明（`decision-log.md:803`）。
  - 最终 oracle 是**用户本人**；仓库机制造不出这个事实，只能保证三件事：(a) 步骤字面可跑；(b) 每一步的真实结果被如实印出；(c) 没做到的部分印在最前面（`decision-log.md:801`）。
  - 报告输入链路今天已通（`run:execute` stdout JSON，`decision-log.md:921`；Q6 自答取 stdout，`:916`）。
  - 抗美化只靠两件事：**机器枚举坏消息** + **异源执笔**；不新增任何机器阻断门（`decision-log.md:855`）。
- Logic：来源事实（已有 handoff 文件但用户不看、无 CLI 出口；执笔人＝实施者会自我美化）→ 约束（不新增阻断门、不新增"看过"记录、必须大白话）→ 选中选项（聊天交付 + 机器枚举坏消息 + 独立子代理执笔 + 不对称压缩）→ 预期结果（用户拿到一段可据以自己复现真实验收的说明）。
- choice_reason/impact：**胜出理由**：聊天交付直接命中"人一定会看到"；异源执笔是"唯一不靠自觉的异源办法"；机器枚举坏消息让美化没有空间。**影响面**：范围＝新增一个交付现场（聊天）与一份由独立子代理产出的说明；接口＝渲染器需同时吃当前形态与归档形态；验收＝不新增机器门，验收判定权归用户本人；数据＝坏消息逐条、好消息汇总；运维＝报告在聊天里发，不进 CLI。
- consequences_and_risks：**立刻的取舍**：坏消息多时报告很长；主会话失去对文字的编辑权（不得润色删减）。**将来的代价**：① 渲染器要同时吃当前形态与归档形态，兼容面变大；② 「简短的大白话」能否真的由机器渲染（而非人手写）需在 step 7 按模块定清（本稿在 `## Report` 记为仍未定）；③ 未被任何测试跑过的入口被点名后会长期挂在说明里（`decision-log.md:807`）。
- rejected_alternatives：
  - G1 甲 升级已有 handoff／乙 另起独立说明／丙 只修数据不新做说明 —— 三项均未被选（`decision-log.md:823`）。
  - Q6 甲 不留痕／乙 留真实确认且缺失即印为事实／丙 缺确认不许 close —— 均未被选；丙 额外理由：是门，且越界（close 归 CARD-10）（`decision-log.md:790`、`:769`）。
  - G5 乙 对称压缩、长度固定很短 —— 否决理由：「总结」就是美化的入口（`decision-log.md:849`）。
  - G5 丙 机器原样贴一字不改 —— 否决理由：零美化空间但不是大白话、读起来累（`decision-log.md:849`）。
  - G6 乙 主会话自己写 —— 否决理由：执笔人就是实施者，正是 CARD-02 报「148/148 全绿」、CARD-07 把子代理否决漂白成绿这两次的病灶（`decision-log.md:850`）。
  - G6 丙 机器直接生成 —— 否决理由：零人为空间，但机器生成的「大白话」易退化成字段名堆砌（`decision-log.md:850`）。
- unresolved_items/owner：① 报告全部内容（尤其"简短的大白话"）能否真由机器渲染——为什么：step 5 已列为保留风险②；owner = build-plan（按模块定清）。② 归档形态兼容面的实现——owner = build-plan / build-code。③ 「渲染器由产品代码渲染」（`decision-log.md:766`）与「独立子代理执笔」（`decision-log.md:854`）是**同一份产物的两个环节还是两份产物**——log 未逐条钉死 ⇒ MISSING — not established；owner = build-plan。
- Supersedes：`## grill` 第 1 批 G1 的三个选项（用户自定义答复取代）；`## 三轮 talk` 第 2 批 Q6 的三个选项（用户自定义答复取代）。
- module：M5 stage 末报告
- requirement_ids：[R-004, R-005, R-008]
- derived_from：[D-001]
- artifacts：[runtime/stage/stage-handoff.mjs, tools/cli/stage-runtime.mjs, quality/evidence/handoff/build-code.md, specs/workflowhub-thin-core-card-04-20260919/decision-log.md]

### D-006 — M6 真实入口库存

- question/final_option：「真实入口」要求怎么满足、清单落在哪、未被跑过的入口怎么办？→ 实际选中：**每个 phase 至少一条 + 登记入口清单**，允许间接满足但必须点名，未被任何测试跑过的入口要被点名；清单新建独立文档放 `docs/architecture/`。
- recommendation/plain_language：Q3 用户选择推荐项「乙」；G4 用户选择推荐项「甲」；Q8 由本批自答（用户未反对即成立）。大白话：每个阶段至少要有一段代码是真的被从头跑通的，而且要把"我们到底有哪些入口"列成一张清单；清单上没被跑过的要写出来，不许装作跑过。
- decision：① 「真实入口」的满足可以是**间接的**，但说明必须点名是哪个入口、以及它确实走到了这段代码；只有"走过"的断言而无事实支撑视为不满足（G4 甲）。② 「我们到底有哪些入口」必须成为**显式库存**，未被任何测试跑过的入口要被点名（Q3 乙）。③ 入口清单落点：**新建独立文档放 `docs/architecture/`**；理由：`control-plane-inventory.json` 是治理清单，语义不同（Q8）。
- status：confirmed
- source_type/reference/exact_excerpt：来源类型 = **真实用户答复**（step 5 Q3 选择推荐项；step 6 G4 选择推荐项）＋ step 7 自答结论。逐字原文：Q3 轴「「真实入口」要求强度」，用户答复 **乙**「每个 phase 至少一条 + 登记入口清单」（`decision-log.md:756`）；G4 轴「无入口 phase 怎么办」，用户答复 **甲**「允许间接跑到，但必须写明哪个入口、确实走到了」（`decision-log.md:826`）；推导事实逐字：「**G4甲** ⇒「真实入口」的满足可以是**间接的**，但说明必须点名是哪个入口、以及它确实走到了这段代码；只有"走过"的断言而无事实支撑视为不满足。」（`decision-log.md:834`）
- approval_binding：批准状态 = Q3/G4 均为用户真实选择（宿主可见引用：`decision-log.md:752-757`、`:796-809`）；Q8 属「本批自答的 8 个开放问题（用户未反对即成立）」（`decision-log.md:935`、`:918`）。`approval_hash` MISSING — not established；最终确认待 step 12/13。
- facts_and_constraints：
  - Q3 乙 ⇒「我们到底有哪些入口」必须成为显式库存，未被任何测试跑过的入口要被点名（`decision-log.md:768`）。
  - Q8 决定逐字：`Q8 入口清单落点` → `新建独立文档放 docs/architecture/`，理由「`control-plane-inventory.json` 是治理清单，语义不同」（`decision-log.md:943`）。
  - step 7 落地顺序：做阶段末报告与真实入口库存排在**最前**（零运行时风险、链路已通）（`decision-log.md:950`）。
  - 已有可复用登记形状（来自 RS-F 候选 c01 的理由，**尚未被本卡采纳为决定**）：`runtime/distribution/runner-release.mjs` 的 `RUNNER_ENTRYPOINTS` 与 `docs/architecture/control-plane-inventory.json` 的登记形状；`docs/architecture/control-plane-inventory.json` 语义不同的理由见 Q8。
  - 本卡不执行总体集成验收（CARD-10 的范围）；本卡只定义验收标准的写法与测试资产的落点（`decision-log.md:1777`）。
  - 与 CARD-10 的接口冻结顺序**仍开放** → 移交 build-plan（`decision-log.md:2061`）。
- Logic：来源事实（Q3乙 要求显式库存；G4甲 允许间接入口但必须点名；现状找不到 CI 配置）→ 约束（不新增阻断门、不越 CARD-10 的边界、清单不放在治理清单里）→ 选中选项（新建 `docs/architecture/` 下的独立清单 + 间接入口必须点名）→ 预期结果（未被任何测试跑过的入口会以事实形式长期可见）。
- choice_reason/impact：**胜出理由**：显式清单把"写了没人保证跑"变成可点名的事实；独立文档避免与治理清单语义混用。**影响面**：范围＝新增一份 `docs/architecture/` 文档（文件尚未生成）；接口＝与 CARD-10 的边界待 build-plan 冻结；验收＝间接入口的"走过"必须有事实支撑；数据＝入口清单是长期存在的可见事实；运维＝零。
- consequences_and_risks：**立刻的取舍**：要维护一份清单。**将来的代价**：未被任何测试跑过的入口被点名后会长期挂在说明里（`decision-log.md:807` 风险③）；清单文件本身在本卡 make-decision 阶段**尚未生成** ⇒ MISSING — not established（文件名与结构未定）。
- rejected_alternatives：
  - Q3 甲 每张卡至少一条 —— 否决理由：门槛低、立刻可执行但覆盖薄（`decision-log.md:762`）。
  - Q3 丙 只写入口不设数量 —— 否决理由：最轻但回到「写了没人保证跑」（`decision-log.md:762`、`:743`）。
  - G4 乙 必须造最小入口 —— 用户未选（`decision-log.md:826`）。
  - G4 丙 允许直标无独立入口 —— 用户未选（`decision-log.md:826`）。
  - 沿用 `docs/architecture/control-plane-inventory.json` 作载体 —— 否决理由：它是治理清单，语义不同（`decision-log.md:943`）。
- unresolved_items/owner：① 入口清单的文件名、结构与消费者——为什么：Q8 只定了目录与理由；owner = build-plan。② 与 CARD-10 的接口冻结顺序——owner = build-plan（OPEN-006，`decision-log.md:2061`）。③ CI 接线（PR / stage 环境 / 生产三处）在本卡做到哪一步——为什么：现状找不到 CI 配置文件；owner = build-plan / 后续卡。
- Supersedes：none
- module：M6 真实入口库存
- requirement_ids：[R-004, R-005, R-006]
- derived_from：[D-005]
- artifacts：[docs/architecture/（入口清单文档尚未生成）, runtime/distribution/runner-release.mjs, docs/architecture/control-plane-inventory.json, specs/workflowhub-thin-core-card-04-20260919/decision-log.md]

### D-007 — M7 测试体系化

- question/final_option：怎么让测试资产成体系、不堆积，同时不引入框架、不设门？→ 实际选中：**零依赖 vitest 原语 + 规则**，覆盖率只作诊断、预算只报不拦，并修正仓库公布的不实数字。
- recommendation/plain_language：该方向来自**用户主动表态**（早于 step 5，是对候选框架的否决），并被采纳为正式方向；step 7 M2 用户选择推荐项「甲」。大白话：不装新工具，只用现有测试运行器自带的三两条规矩把纪律立起来；覆盖率只当体温计不当门；仓库里公布的那个数字是错的，改成真的并写清怎么数的。
- decision：① 采纳方向逐字：**不引入任何新依赖**；只使用钉住的 vitest 2.1.9 已经具备、且本卡要接手维护的原语与规则（`decision-log.md:644-649`）。② 原语：`expect.hasAssertions()`、`expect.assertions(n)`、`test.fails()`，加上已有的 `passWithNoTests: false` 与**尚未启用**的 `allowOnly: false`。③ 覆盖率只作诊断、不作为门；不设统一预算门；预算只报不拦（OPEN-002 / OPEN-004，`decision-log.md:2057`、`:1558`）。④ 修正 `docs/architecture/complexity-baseline.json:58-64` 的数字并写明计数口径，如实写出「实测超上限约 6.3 倍」，改动须连同 `tests/contract/repository-inventory.test.mjs:175` 的内容钉住断言一起处理（`decision-log.md:933`）。
- status：confirmed
- source_type/reference/exact_excerpt：来源类型 = **用户方向表态逐字**＋**真实用户答复**（step 7 M2 甲）＋**一手实测 M1**。逐字原文：「你找的都不太合适，比审查用的ocr差太远了，如果找不到完整、简洁、合适、热门的框架，那还不如先用零依赖的 vitest 原语 + 规则把纪律立起来。我不想为了这件事装那么多复杂的框架」（`decision-log.md:642`）；M2 答复逐字：「**M2 甲**：修正 `docs/architecture/complexity-baseline.json:61-68` 的数字并写明计数口径；由此会暴露「实测超上限约 6.3 倍」这一事实，须如实写出。该文件被 `tests/contract/repository-inventory.test.mjs:175` 按内容钉住，改动须连同该断言一起处理。」（`decision-log.md:933`）（step 10 现场复核更正：以上逐字引文中的 `docs/architecture/complexity-baseline.json:61-68` 现场读为 `:58-64`；逐字原文保留不改。）
- approval_binding：批准状态 = 用户方向表态为真实答复（`decision-log.md:640-642`，标注「真实答复」）；M2 为结构化问答真实答复（`decision-log.md:925-928`）。`approval_hash` MISSING — not established；最终确认待 step 12/13。
- facts_and_constraints：
  - M1 实测（`:651-666`）：`npx vitest run tests/probe-m2-error-messages.test.mjs` → `FAIL > vacuous test` / `Error: expected any number of assertion, but got none`；`FAIL > undercount` / `Error: expected number of assertions to be 3, but got 1`；`test.fails(...)` 包装版 4/4 通过。**同时实测到 vitest 自身的盲区**：`const expected = compute(); expect(compute()).toBe(expected);` 正常通过 ⇒ 必须用**负控（坏输入必须得出非 passed）**而不是靠原语本身堵住。两个探针文件跑完即删，worktree 已回到基线字节。
  - step 4 direction-advice 结论逐字：「「零依赖」这一约束本身成立且可辩护；但「零依赖 vitest 原语 + 写成规则就能立起纪律」**不成立** —— 它约束的那一层，验收取证路径根本不读。」（`decision-log.md:731`）根因：验收路径不读 vitest 断言，只读子进程 stdout 上的 JSON；`runtime/evidence/canonical-evidence-validators.mjs:106-137` 是唯一的验收断言推导点，`:106` 逐字注释 `Derive assertions from actual child JSON; its claimed verdict is never consumed.`；两个原语在仓库中的实际出现次数均为 **0**（`decision-log.md:734`）。
  - 唯一决定验收标准「形式」的强制执行点是 `runtime/stage/stage-content-contracts.mjs:7416-7451`，它不接受任何 vitest 形式（`decision-log.md:736`）。
  - 规则没有执行点：`npm run check` 只覆盖 9 个文件、无一在 `runtime/`；`SD-` 在任何代码文件中出现 0 次；`tools/cli/check-stage-quality.mjs` 只扫 `metrics/` 与 `scripts/`，`runtime/`（107 文件 / 43,310 行）完全不扫（`decision-log.md:737`）。
  - 用户纠偏（本卡准绳）逐字：「card-04 的目标不是阻碍任务推进，而是提高交付质量……绿了没有意义，问题真的解决了才有意义！」（`decision-log.md:23`）与「没错，这个方向才更合理一些。我要的不是流程正确，而是质量合格」（`decision-log.md:25`）。
  - 预算数字出处：`docs/architecture/complexity-baseline.json:58-64`（`formal_test_lines` target 10000 / limit 12000；`public_runner_behaviors` actual 7 / limit 8）；`docs/architecture/complexity-baseline.json` 公布 `formal_test_lines.actual = 20292`，实测 76,075 行（`decision-log.md:920`）。
  - 测试资产结构事实（RS-D）：全仓 `*.test.mjs` 共 303 个文件 / 76,248 行；按文件数 151/248 = 60.9% 落在 `tests/contract`，按行数 37,122/64,981 = 57.1%；`tools/architecture/complexity-report.mjs:37-39` 的 `budget()` 与 `tests/contract/test-entry-grouping.test.mjs:34-39` 的 waiver map 是已有 owner/consumer/测试的既有机制。
  - 零新增依赖、不新增阻断门/计数器/schema（`CONSTITUTION.md:85`）；不设统一预算门（`docs/standard-workflow.md:90`）（`decision-log.md:866`）。
- Logic：来源事实（三原语实测有效；但验收路径不读断言、规则无执行点；覆盖率抓不到已审计缺陷）→ 约束（零新增依赖、不加门、不新增 schema）→ 选中选项（只用零依赖原语 + 规则；覆盖率只作诊断；修正公布数字）→ 预期结果（纪律落在本卡交付的规则与测试资产落点上，而不是落在新的工具面或新的门上）。
- choice_reason/impact：**胜出理由**：用户已明确不愿装复杂框架，且实测证明框架类候选要么引入大量包、要么只给结构不给语义；覆盖率门对本卡已审计缺陷全部无效（Fowler 引文见 `decision-log.md:665`）。**影响面**：范围＝规则层 + 测试资产落点 + 数字修正；接口＝不改 vitest 配置以外的任何运行时接口；验收＝覆盖率不作门、预算只报不拦；数据＝`docs/architecture/complexity-baseline.json` 数字被改写；运维＝零新增依赖与进程。
- consequences_and_risks：**立刻的取舍**：放弃"引入工具就能立纪律"的捷径，接受纪律只能靠规则 + 负控。**将来的代价**：① step 4 已证明规则层与验收取证路径脱节，本卡的规则对验收路径**不可见**；② 公布的预算数字一旦修正为真实值，"超上限约 6.3 倍"会变成长期可见的公开事实；③ 两个原语在仓库中出现次数为 0，说明规则需要有人真的开始用。
- rejected_alternatives：
  - `@cucumber/cucumber` 13.2.1 · MIT —— 引入第二个 runner：实测 `npm i` 加 **87 个包 / 28 MB**（本仓现有 devDep 只有 2 个）；且**只给结构不给语义**——"步骤已实现但断言为空"实测仍 `2 scenarios (2 passed)` / exit 0（`decision-log.md:655`）。
  - `Gauge` npm 1.6.38 · 2026-09-16 —— 同上；本次安装因下载 `gauge-1.6.38-darwin.arm64.zip` 超时未能验证成（`decision-log.md:656`）。
  - `overlock` 0.10.2 · MIT · 零运行依赖 —— 唯一真正零依赖的候选，但**只作用于 patch**，找不到已提交的 247 个测试文件；且属新增工具面（`decision-log.md:657`）。
  - `falsegreen-js` 0.7.0 · MIT · 1 依赖 —— 实测 148 条发现**全部 `low`**（当门用等于永远非零）；抽查量最大的 `C11a` **13/13 假阳性**；三个已知最烂的验收脚本**只报 1 条**（`decision-log.md:658`）。
  - `@stryker-mutator/*` 10.0.0 · Apache-2.0 —— 实测安装 **208 个包**；分数会奖励「把 bug 编码进 oracle」的测试；且拒绝在红套件上运行（`decision-log.md:659`）。
  - `@adlc/hollow-test` 1.11.1 · MIT —— 唯一在 2.1.9 上端到端验证过的变异器，但单维护者、20 star，属新增工具面（`decision-log.md:660`）。
  - `eslint` + `@vitest/eslint-plugin` 10.11.0 / 1.6.27 —— 本仓今天没有 ESLint；实测 6 种目标形状**只抓到 2 种**，漏掉 `expect(x).toBe(x)`（`decision-log.md:661`）。
  - `testtruth` 0.1.0 · MIT —— 单日项目；纯改测试的提交直接报 "nothing to mutate"；每次运行约 62 次套件调用，与「禁止无范围全量测试」冲突（`decision-log.md:662`）。
  - 阿里 `open-code-review` 1.12.9 · Apache-2.0 —— 形状不对：Go 写的 LLM diff 代码审查器（建议性、不是门），不管测试质量；已在 CARD-05 的审查面使用（`decision-log.md:663`）。
  - Lighthouse / `@lhci/cli` 0.15.1 —— 源码级判死：`lighthouse/core/lib/url-utils.js:14-16` 的允许协议白名单不含 `file:`；且它评的是网页（`decision-log.md:664`）。
  - 全局行覆盖率百分比门 —— 覆盖率**抓不到本卡已审计缺陷中的任何一类**（`decision-log.md:665`）。
  - RS-D `C1-full-matrix-with-coverage-gate`（not_recommended）—— 一次全做 + `@vitest/coverage-v8` 阈值门，违反 `AGENTS.md:45`「facts 不是许可证」，且 complexity-baseline.json 的预算已全超而未阻断任何事。
  - RS-D `C3-naming-cleanup-status-quo`（not_recommended）—— 只重命名 12 个任务/里程碑名文件，被证据证伪。
  - RS-D `C4-coverage-tool-first`（not_recommended）—— 先买测量：runtime/ 67 模块与 tools/ 38 模块零就近测试，但 105 个模块里只有 8 个没被任何测试命名 ⇒ 行覆盖率会看着健康而落点/命名/规模问题原封不动。
- unresolved_items/owner：① **规则本身的逐条文本**——为什么：`decision-log.md:649` 记「规则（本卡交付内容，step 5 后定稿）」，但 log 中未见定稿后的逐条规则文本 ⇒ MISSING — not established；owner = build-plan（落地顺序记「测试体系化只写文档」，`:925`）。② 单文件数字上限未商定（RS-D OI-007：500 target / 800 limit 只是按 `tools/architecture/complexity-report.mjs:311-315` 的 `largest_core_file_lines(800/1000)` 类推）——owner = 卡主 + build-plan。③ `runtime/` 是否该有就近测试（RS-D OI-005：须用户拍板的设计选择）——owner = 卡主。④ `runtime/` 与 `tools/` 的真实行/分支覆盖率未知（RS-D OI-003：未安装未跑覆盖工具）——owner = build-plan。⑤ 修正数字的改动与 `tests/contract/repository-inventory.test.mjs:175` 断言的联动——owner = build-code。
- Supersedes：none
- module：M7 测试体系化
- requirement_ids：[R-004, R-005, R-006]
- derived_from：[]
- artifacts：[docs/architecture/complexity-baseline.json, tests/contract/repository-inventory.test.mjs, vitest.config.mjs, specs/workflowhub-thin-core-card-04-20260919/decision-log.md]

### D-008 — M8 规则落点

- question/final_option：规则与 ADR 什么时候入库、落在哪个阶段？→ 实际选中：规则落点**押后到 build-plan**；ADR-0032 在 **build 阶段随实现一起入库**，make-decision 不提交。
- recommendation/plain_language：押后是子代理建议并被采纳的落地顺序（`decision-log.md:948-950`）；ADR 入库时机是 step 7 自答 Q10（用户未反对即成立）。大白话：这一阶段只写决定，不改代码、不提交；真正动手写规则的活儿放到下一个阶段。
- decision：① 落地顺序（子代理建议，采纳）逐字：「先裁 M1/M2（已完成）→ 做阶段末报告与真实入口库存（零运行时风险、链路已通）→ 逐 AC 执行事实接线 → `coverage_limits` → 测试体系化只写文档 → 规则落点押后到 build-plan（本卡切为 post 后不再有 build-spec 阶段）。」（`decision-log.md:950`）② `Q10 ADR-0032 何时入库` → `build 阶段随实现一起入库`，理由「make-decision 不提交；本卡只有 decision-log」（`decision-log.md:944`）。
- status：confirmed
- source_type/reference/exact_excerpt：来源类型 = **step 7 采纳的落地顺序建议**（`decision-log.md:948-950`）＋ step 7 自答 Q10（`decision-log.md:943-944`，用户未反对即成立）。逐字原文即上引 `decision-log.md:950` 与 `:919`。
- approval_binding：批准状态 = 属「本批自答的 8 个开放问题（用户未反对即成立）」（`decision-log.md:935`）与"子代理建议，采纳"（`:923`）；无独立用户答复凭证。`approval_hash` MISSING — not established；最终确认待 step 12/13。
- facts_and_constraints：
  - 本卡工作面**尚未产生任何产品代码改动**；worktree 停在基线 `35a881ac`，独有提交数 0（`decision-log.md:29`）；唯一例外是 D-002 记录的 `tools/cli/stage-runtime.mjs` +6 −1（提前落的生产代码，`:978`）。
  - 本卡材料目录目前只有 `decision-log.md`，故一切写入 `spec.md`、`phases/` 的内容必须等 build-plan（`decision-log.md:920`）。
  - 本卡 slice 到 post 后不再有 build-spec 阶段（`decision-log.md:950`、`:950`）。
  - make-decision 不提交（`decision-log.md:944`）。
- Logic：来源事实（本阶段只产材料、无实现提交；规则需与实现一起落）→ 约束（不越过阶段的写面；不为形式制造提交）→ 选中选项（规则押后 build-plan、ADR 随 build 入库）→ 预期结果（本卡 make-decision 交付决定与材料，实现与规则由后续阶段承接）。
- choice_reason/impact：**胜出理由**：make-decision 的写面只有 `decision-log.md`；提前落代码（如 D-002 那处）会留下必须在 build-code 补测试的遗留义务。**影响面**：范围＝本阶段不产规则文本、不产 ADR 文件；接口＝无；验收＝规则的可验收形态留到 build-plan；数据＝无；运维＝无。
- consequences_and_risks：**立刻的取舍**：本卡 make-decision 结束时，规则的实际条款仍未成文。**将来的代价**：如果 build-plan 没有真正承接规则落点，D-007 的"规则"就只剩方向而没有条款。
- rejected_alternatives：
  - 在 make-decision 阶段写规则文本 —— 否决理由：本卡材料目录目前只有 `decision-log.md`（`decision-log.md:920`），且落地顺序明确把规则落点押后（`:925`）。
  - 在 make-decision 提交 ADR —— 否决理由：make-decision 不提交（`decision-log.md:944`）。
  - 回头恢复旧 `build-spec` 加 `build-plan` 的治理审计项清单 —— 否决理由：流程对比已证明现流程在验收与测试上更强（`decision-log.md:1781`）。
- unresolved_items/owner：① 规则落点的真正承接——owner = build-plan。② ADR-0032 的实际入库提交——owner = build 阶段（本卡未指派具体阶段名，log 记「build 阶段」）。③ 本决定的最终用户确认——owner = make-decision 主会话。
- Supersedes：none
- module：M8 规则落点
- requirement_ids：[R-001, R-004]
- derived_from：[D-007]
- artifacts：[docs/adr/0032-acceptance-truth-presentation-and-cohort-parity.md（已生成、未入库）, specs/workflowhub-thin-core-card-04-20260919/decision-log.md, build-plan 产出的 spec.md 与 phases/P<n>.md（尚未生成）]

### OI 收口（step 8）

本卡唯一 OI 大纲共 18 条；其中 13 条由上方 D-001..D-008 与已收敛的 `## 未决项` 直接承载。下列 5 条在 step 8 一并收口，逐条给出终态与依据。**没有新增状态机**；每条依据都指向本文件内已存在的答复或决定。

| OI | 类别 | 问题要点 | 终态 | 依据 |
| --- | --- | --- | --- | --- |
| OI-001 | data_state | 现有返工取证是否足以定位主因、是否仍有盲区 | 已关闭 | 五份会话取证与四张归档卡审计足以支撑本卡使用的三类根因（AC 不可判真假、审查通道自绿、测试资产无落点规则）。**残余盲区如实登记为覆盖限制**：R6 §5 的计数与 card-05/card-07 的 A/B/C 分级为单一来源、未经独立复算。承载于 D-007。 |
| OI-006 | success_failure_boundary | 有效 RED 判据与 G-2 豁免条件 | 已关闭 | 本卡不新建 RED 判定器（零新增门）。RED 不可得时按既有形态如实记为 `unavailable` 并计入报告「没做到」部分；G-2 类豁免走既有人写声明面（`exceptions`，必填理由，空数组不合法，`runtime/evidence/acceptance-evidence-validator.mjs:63,73`）。承载于 D-004/D-005。 |
| OI-007 | data_state | 机器产物「按测试路线适用」矩阵，缺适用产物必然失败 | **被取代** | 「缺适用产物必然失败」与用户裁定的「缺事实只记录、印在报告最前，不阻断推进」（`decision-log.md` 的 OPEN-005 行）直接冲突。矩阵保留为**事实记录**（哪条测试路线适用哪些产物；N/A 必附理由），不设失败判定。承载于 D-004/D-007。 |
| OI-013 | complete_user_flow | E2E 入口登记与真实运行做到哪一步、与 CARD-10 如何分界 | 已关闭 | 本卡只定义入口登记与测试资产落点规则（D-006）；真实运行的规模与 CI 接线不在本卡，CARD-10 拥有整体集成验收。与 CARD-05/CARD-07/CARD-10 的接口冻结顺序仍留在 OPEN-006（build-plan）。 |
| OI-015 | data_state | 状态口径统一，unverified 永不写成 succeeded | 已关闭 | 沿用既有词表、不新增状态机；机器判定类（`missing`/`inconsistent`/`incomplete`/`failed`/`unavailable`）与人写声明类（`coverage_limits`/`exceptions`）两分且不得互相顶替。承载于 D-004。 |
| OI-017 | scope | 明确排除项 | 仍开放 | 与 CARD-05/CARD-07/CARD-10 的接口冻结顺序属跨卡问题，移交 build-plan（OPEN-006）。 |

- **未被任何 D 条目覆盖、且仍未收口的项**：无。R-001..R-008 全部至少有一处映射（逐条映射见 D-001..D-008 的 `requirement_ids` 字段与 `## 范围`）。
- **未生成 `decision-omission-acceptance.v1` 附录**：上表中 OI-007 走「被取代」而非「接受省略」，其余四条走「已关闭」，故本卡没有需要豁免的省略项。`runtime/stage/stage-content-contracts.mjs:2970` 的 `validateDecisionLogContract` 今天**没有生产调用点**（同类事实见 D-007），本节的收口是事实记录，不是机器门禁。

## 本卡自身的验收标准（AC-16…AC-21）

母 PRD 已为本卡指定六条验收标准（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:335-340`，对应 FR-16..FR-21）。本卡在 make-decision 阶段即把它们写成可执行形式（R-001「验收标准在 make-decision 写为可执行」）。

**分界（回答 detail 审查 #26）**：`validatePostPhaseContract` 的 17 个必填字段（`runtime/stage/stage-content-contracts.mjs:6918-6923`）是**机器必填**，必须在 build-plan 真实填出，填不出就是 build-plan 走不下去，没有 MISSING 余地；本节其余标 `MISSING — not established` 的项是**机器不校验**的，如实缺着，不补造、不阻断。

**命令列给出的是本卡交付后应当能真跑并给出该输出的命令**。标 `MISSING` 的是当前尚不可得（例如样例 task 尚未构造、入口清单尚未生成）。所有命令均为真实入口，不得以 mock 或单元测试代偿。

| AC | 条件 | 行为 | 可度量成功值 | ≥1 失败场景 | 真实入口与命令 | 当前可得性 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-16 | 取一个真实 task 的验收标准集 | 逐条核对可执行形式 | 100% 条目含「条件→行为 + 可度量标准 + ≥1 失败场景」，或显式标 incomplete | 任一 missing 且未标 incomplete ⇒ 失败 | `node tools/cli/check-decision-log-chain.mjs specs/<task>/decision-log.md`，再加本表逐条人工核对 | 本卡自身可立即核对；全仓统计口径待 build-plan 定 |
| AC-17 | 观察一个实施 task | 核对实现者可访问范围 | 实现者对测试目录无写权限；只读模式可读不可写；隐藏模式读不到测试内容 | 实现者写/改验收测试，或隐藏模式下读到测试内容 ⇒ 失败（只读模式读取不算失败） | MISSING — 需样例 task 与权限模式开关 | MISSING — not established |
| AC-18 | 一个行为变化样例 task | 核对 RED→GREEN 证据 | 存在同一测试改动前失败、改动后通过的记录 | 只有 GREEN 无 RED 且无 G-2 豁免披露 ⇒ 失败 | MISSING — 需样例 task | MISSING — not established |
| AC-19 | 一个纯文档样例 task | 核对豁免处置 | 存在豁免记录，含理由 + 风险 + 验收中披露，或补了一条可失败检查 | 直接跳过且无披露 ⇒ 失败 | MISSING — 需样例 task | MISSING — not established |
| AC-20 | 构造两类验收场景：某路线适用 trace/JUnit/跳过计数，另一路线不适用 | 分别运行验收 | 硬要求（真实命令、exit、output、对应 oracle 证据）缺失即判失败；适用路线缺任一适用产物即判失败；不适用路线记 N/A + reason 且不判失败 | 缺适用产物仍判通过、伪造产物、缺不适用产物却判失败，或 N/A 无理由 ⇒ 失败 | `node tools/cli/stage-runtime.mjs run --action=execute --stage=build-code` 与 `verify --action=execute --stage=verify-code` 的真实 stdout | 机制已存在（`e2e_scope` / `e2e_acceptance`）；本卡不新增门 |
| AC-21 | 取一个完成 task 的执行事实 | 检查测试/验收技能的真实执行记录 | 执行事实（命令、exit、output 位置）存在且可回读；整体完成宣称发生在真实入口联通实跑之后 | 只有脚本自证，或审查被当作功能验收 ⇒ 失败 | 同 AC-20 的真实 stdout，再从 `quality/evidence/` 回读 | 部分可得；本卡自身的执行事实见 `## 状态` |

**与 OPEN-005 的分界（审查 #9 / #26 连带澄清，追加更正）**：本表此前把 OI-007 记为「被取代」，理由是「缺适用产物必然失败」与 OPEN-005「缺事实只记录、不阻断推进」冲突。该理由**只在两个平面被混为一谈时才成立**：AC-20 说的是**该条验收的判定为 failed**（如实判定，不是门），OPEN-005 说的是**阶段不因缺事实被阻断**（放行语义）。两者可以同时成立，故 OI-007 的正确处置是**已收敛**而非被取代：适用产物缺失 ⇒ 该 AC 判 failed 并如实进报告「没做到」清单；阶段不被它阻断。此处按追加更正记录，不回改既有文字。


## 调研候选交付

本节只绑定**一份**已发布研究报告：`quality/evidence/research/e72dd900ca95259d3035ba3d934cd46d1299d5420621c13ab920720fb99c78c0.json`。绑定口径 = 该报告自己的 `candidates` 数组，逐字段原样搬运，未改写、未合并、未增删。

| 候选 ID | 大白话摘要 | 推荐 | 理由 | 出处 |
| --- | --- | --- | --- | --- |
| `C1-full-matrix-with-coverage-gate` | Do all of it at once: repair the vitest include list so every test file is collectable, publish a module-by-layer placement matrix that every test file must be registered in, cap each test file's size and each module's test count, and add @vitest/coverage-v8 with thresholds so uncovered modules fail the run. | not_recommended | [original recommendation=false] It is the only option that literally proves behaviour coverage, but it is the most expensive and it contradicts a standing repository rule: AGENTS.md:45 says testing/inventory/complexity produce facts, not a licence, and every published budget in complexity-baseline.json is already exceeded without breaking anything, so a coverage gate would be a new control plane needing its own ADR and an explicit amendment of that rule. It also adds a dependency pinned to vitest 2.1.9 into a `check` chain that is sensitive to clean-install and tracked-tree hashes, and it starts from a whole-repo test estate of 76,248 lines in 303 `*.test.mjs` files, of which 151/248 files (60.9%) and 37,122/64,981 lines (57.1%) sit in tests/contract, so the migration is large before it pays off. | `S1`, `S2`, `S5`, `S6`, `S24` |
| `C2-include-fix-plus-ledger-caps-no-gate` | Repair the three collection gaps, make the existing accounting test cover the whole repository instead of a six-prefix allowlist, and add placement, per-file size, orphan and concentration numbers to the budget ledger that already exists - recorded as facts with their limits, exactly like the current budgets, without adding any new dependency or any new blocking gate. | recommended | [original recommendation=true] It fixes verified defects rather than adding theory: a live orphan test file that no glob collects (workflows/verify-code/phase-1-contract.test.mjs), an accounting guard blind to runtime/, tools/ and workflows/verify-code/, and a guard that is already stale for tests/acceptance/card-02-current.test.mjs. It reuses two mechanisms that already have owners, consumers and tests - budget() at tools/architecture/complexity-report.mjs:37-39 with the per-file cap precedent at 311-315, and the waiver map at tests/contract/test-entry-grouping.test.mjs:34-39 - so it needs no new dependency, no new stage and no new control plane, and it does not require amending AGENTS.md:45 because the numbers stay facts. Its honest limit is stated in the decision: it makes the test estate bounded, placed and visible; it does not prove behaviour coverage. | `S1`, `S2`, `S3`, `S4`, `S5`, `S7`, `S20`, `S21`, `S22`, `S24`, `S25` |
| `C3-naming-cleanup-status-quo` | Change as little as possible: rename the twelve task- and milestone-named test files to module-based names, merge the obvious duplicates, and leave the include list, the ledger and the accounting guard as they are. | not_recommended | [original recommendation=false] It is the cheapest option and it does reduce the most visible symptom, but it is falsified by the evidence: the one test file that no include glob collects would stay dead (E30), the accounting guard would stay blind to runtime/, tools/ and workflows/verify-code/ (E29), and the guard is already stale for a file added after it was written (E31, E32). Nothing would stop the next asset from piling up the same way, which is precisely the outcome the user asked to eliminate. | `S4`, `S24`, `S25`, `S28` |
| `C4-coverage-tool-first` | Buy measurement first: install @vitest/coverage-v8 at the same version as vitest, add a coverage block with thresholds, and let the resulting numbers decide which modules need co-located tests. | not_recommended | [original recommendation=false] It directly answers the measurability axis and gives per-module numbers no naming or path analysis can produce, but measurement is not placement: runtime/ (67 modules) and tools/ (38 modules) have zero co-located tests while only 8 of 105 of those modules are named by no test at all (E16, E18), so line coverage would likely look healthy while the placement, naming and sizing problem stayed untouched. It also front-loads a new pinned dependency and a thresholds block before the free accounting defects are repaired, and a threshold gate runs into the same AGENTS.md:45 constraint as C1. | `S1`, `S2`, `S24`, `S26`, `S28` |

```json
{
  "schema_version": "workflowhub-research-candidate-delivery.v1",
  "report_ref": "quality/evidence/research/e72dd900ca95259d3035ba3d934cd46d1299d5420621c13ab920720fb99c78c0.json",
  "report_sha256": "e72dd900ca95259d3035ba3d934cd46d1299d5420621c13ab920720fb99c78c0",
  "candidates": [
    {
      "candidate_id": "C1-full-matrix-with-coverage-gate",
      "plain_language_summary": "Do all of it at once: repair the vitest include list so every test file is collectable, publish a module-by-layer placement matrix that every test file must be registered in, cap each test file's size and each module's test count, and add @vitest/coverage-v8 with thresholds so uncovered modules fail the run.",
      "source_refs": [
        "S1",
        "S2",
        "S5",
        "S6",
        "S24"
      ],
      "evidence_refs": [
        "E2",
        "E7",
        "E13",
        "E20",
        "E25"
      ],
      "recommendation": "not_recommended",
      "recommendation_reason": "[original recommendation=false] It is the only option that literally proves behaviour coverage, but it is the most expensive and it contradicts a standing repository rule: AGENTS.md:45 says testing/inventory/complexity produce facts, not a licence, and every published budget in complexity-baseline.json is already exceeded without breaking anything, so a coverage gate would be a new control plane needing its own ADR and an explicit amendment of that rule. It also adds a dependency pinned to vitest 2.1.9 into a `check` chain that is sensitive to clean-install and tracked-tree hashes, and it starts from a whole-repo test estate of 76,248 lines in 303 `*.test.mjs` files, of which 151/248 files (60.9%) and 37,122/64,981 lines (57.1%) sit in tests/contract, so the migration is large before it pays off."
    },
    {
      "candidate_id": "C2-include-fix-plus-ledger-caps-no-gate",
      "plain_language_summary": "Repair the three collection gaps, make the existing accounting test cover the whole repository instead of a six-prefix allowlist, and add placement, per-file size, orphan and concentration numbers to the budget ledger that already exists - recorded as facts with their limits, exactly like the current budgets, without adding any new dependency or any new blocking gate.",
      "source_refs": [
        "S1",
        "S2",
        "S3",
        "S4",
        "S5",
        "S7",
        "S20",
        "S21",
        "S22",
        "S24",
        "S25"
      ],
      "evidence_refs": [
        "E1",
        "E6",
        "E9",
        "E20",
        "E24",
        "E25",
        "E27",
        "E28",
        "E29",
        "E30",
        "E31",
        "E35",
        "E46"
      ],
      "recommendation": "recommended",
      "recommendation_reason": "[original recommendation=true] It fixes verified defects rather than adding theory: a live orphan test file that no glob collects (workflows/verify-code/phase-1-contract.test.mjs), an accounting guard blind to runtime/, tools/ and workflows/verify-code/, and a guard that is already stale for tests/acceptance/card-02-current.test.mjs. It reuses two mechanisms that already have owners, consumers and tests - budget() at tools/architecture/complexity-report.mjs:37-39 with the per-file cap precedent at 311-315, and the waiver map at tests/contract/test-entry-grouping.test.mjs:34-39 - so it needs no new dependency, no new stage and no new control plane, and it does not require amending AGENTS.md:45 because the numbers stay facts. Its honest limit is stated in the decision: it makes the test estate bounded, placed and visible; it does not prove behaviour coverage."
    },
    {
      "candidate_id": "C3-naming-cleanup-status-quo",
      "plain_language_summary": "Change as little as possible: rename the twelve task- and milestone-named test files to module-based names, merge the obvious duplicates, and leave the include list, the ledger and the accounting guard as they are.",
      "source_refs": [
        "S4",
        "S24",
        "S25",
        "S28"
      ],
      "evidence_refs": [
        "E14",
        "E29",
        "E30",
        "E31",
        "E32",
        "E33"
      ],
      "recommendation": "not_recommended",
      "recommendation_reason": "[original recommendation=false] It is the cheapest option and it does reduce the most visible symptom, but it is falsified by the evidence: the one test file that no include glob collects would stay dead (E30), the accounting guard would stay blind to runtime/, tools/ and workflows/verify-code/ (E29), and the guard is already stale for a file added after it was written (E31, E32). Nothing would stop the next asset from piling up the same way, which is precisely the outcome the user asked to eliminate."
    },
    {
      "candidate_id": "C4-coverage-tool-first",
      "plain_language_summary": "Buy measurement first: install @vitest/coverage-v8 at the same version as vitest, add a coverage block with thresholds, and let the resulting numbers decide which modules need co-located tests.",
      "source_refs": [
        "S1",
        "S2",
        "S24",
        "S26",
        "S28"
      ],
      "evidence_refs": [
        "E2",
        "E7",
        "E16",
        "E18",
        "E25"
      ],
      "recommendation": "not_recommended",
      "recommendation_reason": "[original recommendation=false] It directly answers the measurability axis and gives per-module numbers no naming or path analysis can produce, but measurement is not placement: runtime/ (67 modules) and tools/ (38 modules) have zero co-located tests while only 8 of 105 of those modules are named by no test at all (E16, E18), so line coverage would likely look healthy while the placement, naming and sizing problem stayed untouched. It also front-loads a new pinned dependency and a thresholds block before the free accounting defects are repaired, and a threshold gate runs into the same AGENTS.md:45 constraint as C1."
    }
  ]
}
```

## 拒绝方案

以下每条都是 card-04 已记录在案的被否方案与被否选项，附否决理由；理由逐字取自 `decision-log.md`。

**A. 框架与工具面（整类否决：用户不接受为这件事引入新框架或新依赖，`decision-log.md:21`）**

| 被否方案 | 版本 / 许可 | 否决理由（逐字要点，`decision-log.md:651-665`） |
| --- | --- | --- |
| `@cucumber/cucumber` | 13.2.1 · MIT | 引入第二个 runner：实测 `npm i` 加 **87 个包 / 28 MB**（本仓现有 devDep 只有 2 个）。且**只给结构不给语义**——"步骤已实现但断言为空"实测仍 `2 scenarios (2 passed)` / exit 0 |
| `Gauge` | npm 1.6.38 · 2026-09-16 | 同上；本次安装因下载 `gauge-1.6.38-darwin.arm64.zip` 超时未能验证成 |
| `overlock` | 0.10.2 · MIT · 零运行依赖 | 唯一真正零依赖的候选，但**只作用于 patch**，找不到已提交的 247 个测试文件；且属新增工具面 |
| `falsegreen-js` | 0.7.0 · MIT · 1 依赖 | 实测 148 条发现**全部 `low`**（当门用等于永远非零）；抽查量最大的 `C11a` **13/13 假阳性**；拿三个已知最烂的验收脚本跑**只报 1 条** |
| `@stryker-mutator/*` | 10.0.0 · Apache-2.0 | 实测安装 **208 个包**；**分数会奖励「把 bug 编码进 oracle」的测试**；且拒绝在红套件上运行 |
| `@adlc/hollow-test` | 1.11.1 · MIT | 唯一在 2.1.9 上端到端验证过的变异器，但单维护者、20 star，属新增工具面 |
| `eslint` + `@vitest/eslint-plugin` | 10.11.0 / 1.6.27 | 本仓今天**没有 ESLint**（新开工具面）；实测 6 种目标形状**只抓到 2 种**，漏掉最重要的一种 `expect(x).toBe(x)` |
| `testtruth` | 0.1.0 · MIT | 单日项目；**纯改测试的提交它直接报 "nothing to mutate"**；每次运行约 62 次套件调用，与「禁止无范围全量测试」冲突 |
| 阿里 `open-code-review` | 1.12.9 · Apache-2.0 | 形状不对：Go 写的 LLM **diff 代码审查器**（建议性、不是门），**不管测试质量**；已在 CARD-05 的审查面使用，与本卡无关 |
| Lighthouse / `@lhci/cli` | 0.15.1 | 源码级判死：`lighthouse/core/lib/url-utils.js:14-16` 的允许协议白名单不含 `file:`；且它评的是**网页**，不认识验收判据 |
| 全局行覆盖率百分比门 | — | 覆盖率**抓不到本卡已审计缺陷中的任何一类**：那些缺陷里代码都执行到了，行/分支覆盖率照绿 |

**B. 研究与候选层被否项**

- 严格按卡面窄范围收口（候选 N-004；RS-A `CAND-A`，not_recommended）——否决理由：把用户诉求推给一张不存在的新卡（RS-A `CAND-A` 的 recommendation_reason）。
- 完全体系级扩边（RS-A `CAND-C`，not_recommended）——否决理由：违反卡面排除项与 CARD-10 独占定位。
- RS-D `C1-full-matrix-with-coverage-gate`（not_recommended）——否决理由：一次全做 + `@vitest/coverage-v8` 阈值门，违反 `AGENTS.md:45`「facts 不是许可证」，且 `complexity-baseline.json` 的预算已全超而未阻断任何事。
- RS-D `C3-naming-cleanup-status-quo`（not_recommended）——否决理由：只重命名 12 个任务/里程碑名文件，被证据证伪。
- RS-D `C4-coverage-tool-first`（not_recommended）——否决理由：先行测量只会让行覆盖率看着健康，而落点/命名/规模问题原封不动。

**C. 问答中被否的选项**

- **Q1 甲**（只写规则）／**乙**（只加人读报告）：改动最小但内容散落、易成没人读的散文／易与真实记录漂移（`decision-log.md:754`、`:735`）。
- **Q2 甲**（只写规则不碰产品代码）／**丙**（分两批）：甲＝规则说要填而机器填不进去＝「流程正确但没解决」；丙＝第二批易被拖（`decision-log.md:755`、`:736`）。
- **Q3 甲**（每张卡至少一条）／**丙**（只写入口不设数量）：甲覆盖薄；丙回到「写了没人保证跑」（`decision-log.md:756`、`:737`）。
- **Q4 甲**（只记录不拦，现状）／**丙**（记 incomplete 并阻断）：甲＝真话没人看；丙＝用户明确反对的 gate，且实测 **562/707（79.5%）** 条已记录阶段结果会新增失败（`decision-log.md:757`、`:738`）。
- **Q6 甲**（不留痕）／**乙**（留真实确认且缺失即印为事实）／**丙**（缺确认不许 close）：均未被选；丙额外越界（close 归 CARD-10）（`decision-log.md:790`、`:769`）。
- **G1 甲**（升级已有 handoff）／**乙**（另起独立说明）／**丙**（只修数据不新做说明）：三项均未被选（`decision-log.md:823`）。
- **G3 乙**（由本卡编写期望答案清单）／**丙**（不设对错只要不崩）（`decision-log.md:825`）。
- **G4 乙**（必须造最小入口）／**丙**（允许直标无独立入口）（`decision-log.md:826`）。
- **G5 乙**（对称压缩、长度固定很短）——「总结」就是美化的入口；**G5 丙**（机器原样贴一字不改）——不是大白话、读起来累（`decision-log.md:845`、`:824`）。
- **G6 乙**（主会话自己写）——执笔人就是实施者，正是 CARD-02 报「148/148 全绿」、CARD-07 把子代理否决漂白成绿这两次的病灶；**G6 丙**（机器直接生成）——「大白话」易退化成字段名堆砌（`decision-log.md:846`、`:825`）。
- **G7（首次）乙**（新建激活标记把今后所有卡变 post）／**G7b 丙**（建标记 + 把 card-04 作为新任务重建）／**丁**（什么都不动）：乙＝手工创建即伪造发布闸门（`decision-log.md:892`）；丙与丁用户未选，log 未记逐条理由 ⇒ MISSING — not established。
- **step 7 M1 乙**（补材料 + pre 版必填表）／**丙**（分两张卡）：与「不分 cohort」冲突，且用户已裁定不再为 pre 设计（`decision-log.md:927`、`:920`）。
- **step 7 M2 乙**（只写明口径差不动数字）／**丙**（本卡不碰）（`decision-log.md:928`）。
- **step 7 自答 Q2**（本卡填 `review_ref`）／**Q4**（做 pre 版 required 表）／**Q5**（统一 `coverage_limits` 形状）／**Q1**（改校验器让 `task_ids` 可满足）：逐条理由见 `decision-log.md:939-946`。

**D. 流程与治理层**

- 继续维护统一执行平台、只把旧 kernel/协议搬进 Skill、PRD/spec 重复产品需求、每包复制全部架构、强制每 task 新代理、机械 RED 或把环境错误当 RED、用 review 通过替代真实入口验收（`decision-log.md:637`）——理由：`## 决定草案` 的 rejected_alternatives。
- 回头恢复旧 `build-spec` 加 `build-plan` 的治理审计项清单 —— 否决理由：流程对比已证明现流程在验收与测试上更强（`decision-log.md:1781`）。
- 用 review 通过替代真实功能验收 —— 理由：**代码审查不等于功能验收**（`decision-log.md:681`、`:660`）。
- 用 fail-closed／新增 gate 作为本卡主线 —— 用户明确反对；且「reject-a-gate」的爆炸半径实测会重新分类 **562/707（79.5%）** 条已记录的 stage 结果（`decision-log.md:24`、`:713`）。
- 以覆盖率门代替质量判断 —— 见 A 类末条。
- **未裁决，故不列入拒绝方案**：RS-A `CAND-D`（一卡两批，recommendation = recommended）在 card-04 decision-log 中**未见明确裁决** ⇒ MISSING — not established，不得写成已拒绝。

## Supersedes

本节只记录 card-04 **自己**的决定链上被取代的更早决定；每条都保留被取代项的原样记录，不重写历史。

1. **step 6 grill 第 3 批 G7b「甲」→ 被用户逐字 directive 取代**。G7b「甲」＝「放开 pre 的条件」（即放开 `runtime/stage/stage-runner.mjs:4289-4291` 的 `activation_cohort === "post"` 限制、card-04 保持 pre，`decision-log.md:888`、`:869`）。取代它的逐字原话：「别再浪费精力在pre卡上面了，请直接把当前任务类型改成post，以后都只会有post任务，我不想浪费时间精力在pre上面」（`decision-log.md:956`）。取代声明逐字：「此答复**取代** G7b 的「甲」（放开 `runtime/stage/stage-runner.mjs:4289-4291` 的 `activation_cohort === "post"` 限制并让 card-04 保持 pre）。此后不再为 pre 形态做任何设计。」（`decision-log.md:958`）
2. **step 6 grill 第 3 批 G7（首次）「乙」→ 被 G7b 取代，进而被上述 directive 取代**。G7 首次「乙」＝「新建激活标记把今后所有卡变 post」（`decision-log.md:886`）；问题来历逐字：「退出检查 1 挖出「cohort 冻结在任务档案里、今天新建的卡必为 pre」，推翻了第 1 批 G2 的答复（用户当时选「card-04 切成 post」）。故重开一问。」（`decision-log.md:882`）
3. **step 6 grill 第 1 批 G2「甲」→ 先被 G7b 推翻，再在最终 directive 下重新成立**。G2「甲」＝「把 card-04 切成 post（新形态）」（`decision-log.md:824`），被 `decision-log.md:882` 明确记为「推翻了第 1 批 G2 的答复」；最终 directive（第 1 条）把方向重新定回 post。**两次翻转都保留在案，不合并成一条。**
4. **step 5 第 2 批 Q6 的三个选项 → 被用户自定义形态取代**。Q6 轴「人的确认」的甲/乙/丙均未被选（`decision-log.md:790`），取而代之的逐字形态：「不用新增看过的记录，只要在build-code的stage结束时，把所有测试过程和结果用简短的大白话说明一次就好了，我会自己基于这些步骤自己去做真实验收」（`decision-log.md:796`）。
5. **step 6 grill 第 1 批 G1 的三个选项 → 被用户自定义形态取代**。G1 甲/乙/丙三项均未被选（`decision-log.md:823`），取而代之的逐字形态：「我不是要升级handoff，handoff文件内容我又不看的，我希望stage结束的时候直接在聊天内容里把这个验收报告发给我看」（`decision-log.md:828`）。
6. **step 7 自答 Q4「pre 版 required 表 = 不做」的前提被取代**。该自答的理由逐字是「与「不分 cohort」冲突，且属 M1 乙范围」（`decision-log.md:945`）；card-04 切 post 后 pre 形态整体退出设计面，该条前提不再适用。其结论（不做 pre 版必填表）仍然成立。
7. **OPEN-008 已被取代（闭环）**：`OPEN-008` 逐字「cohort 分叉放开后 pre 卡的材料形态缺口」，状态逐字「**已被取代**：用户裁定今后不再做 pre 设计、card-04 本身切为 post（见上节逐字原话）；pre 形态退出设计面，本项关闭」（`decision-log.md:2063`）。
8. **尚未发生、故不写**：本卡 `## 最终确认` 与 `## 审查处置` 都还没产生（`decision-log.md:27` 记这些节按 step 8 至 step 13 顺序回填），因此任何"被最终确认取代"的关系都不成立，本稿不写。

## 文档结果

本节逐条复制 `## grill` 已记录在案的 grill-with-docs 结果，不重新推导。

- **`CONTEXT.md`：不改**。
  - 理由（逐字要点）：本卡新增的都是实现级名字（stage 末报告、入口库存、三样落点），而 `CONTEXT.md` 是仓级领域词典；且「逐条 AC 的可读验收视图」这一领域名**已经存在**（`CONTEXT.md:301`），cohort 语义也已存在（`CONTEXT.md:305`）——本卡要做的是让已有领域名的实现不再留空槽，不是造新词（`decision-log.md:868`、`:878`）。
  - 文件引用：`CONTEXT.md:301`（「逐条 AC 的可读验收视图」）、`CONTEXT.md:305`（cohort 语义）。
- **ADR：created**。
  - 落点逐字：「**落点**：`docs/adr/`（现 37 项，最新编号 0031；注意 `0027` 与 `0031` 各有两份重号文件，新建时取 `0032`，并在文件内注明重号事实）」（`decision-log.md:904`）。
  - 文件引用：`docs/adr/0032-acceptance-truth-presentation-and-cohort-parity.md`。**来源说明**：该 slug 由本次 step 8 任务书给出；card-04 decision-log 只记录了**编号 0032** 与落点目录 `docs/adr/`（`decision-log.md:904`），**未记录 slug 逐字** ⇒ 主会话在落库时应以本行文件引用为准并复核拼接一致性。
  - 入库时机：`Q10 ADR-0032 何时入库` → `build 阶段随实现一起入库`，理由「make-decision 不提交；本卡只有 decision-log」（`decision-log.md:944`）。
- **ADR 三判据（最终，三项全为真，逐字要点）**：① 难以反转：它改变 pre 与 post 在阶段末的核查边界，后续所有卡都受影响；② 无背景会意外：未来的读者会问「为什么 pre 卡忽然也跑这条链、为什么这个报告在聊天里交付」；③ 存在真实取舍：曾认真比较过对称压缩、机器原样贴、主会话执笔、建激活标记、重建任务等方案（`decision-log.md:904`）。**三判据取值：hard to reverse = true；surprising without context = true；a genuine trade-off = true。**（前一轮的判定逐字为「**暂不新建**。三项判据中「难以反转」与「无背景会意外」在**报告交付形态**上不成立……待 G7 答复后重判一次——若最终选择改变产品级 cohort 行为，则三项判据全为真，届时补 ADR」（`decision-log.md:869`）；G7 之后的最终决定改变产品级 cohort 行为，故三项转为全真。）
- **术语 / ADR 冲突**：
  - 术语冲突：**无**。理由：新增名词都是实现级；`CONTEXT.md:301` 与 `CONTEXT.md:305` 的领域名已经存在（`decision-log.md:903`）。
  - ADR 冲突（重号事实）：`docs/adr/` 现 37 项，最新编号 **0031**；**`0027` 与 `0031` 各有两份重号文件**；新建时取 `0032`，并在文件内注明重号事实（`decision-log.md:904`）。
  - 结论：**本稿不擅自处置重号文件**（重号是既有事实，处置属主会话/后续阶段）。
- **MISSING — not established**：ADR 文件的正文内容、`CONTEXT.md` 改动与否之外的其它文档结果均未在 card-04 decision-log 中记录（ADR 已生成、未入库）。

## Exit checks

复制 step 6 grill 的四项客观退出检查及其真实结论（`decision-log.md:857-878`、`:871-880`），不重新推导。

1. **外部依赖接口是否已核实真实定义 —— 一处重大发现，已改变方向。**
   - `activation_cohort` **不是可选项，而是 bootstrap 时被「观测」出来的**：`tools/cli/task-bootstrap.mjs:45-60` `resolveCard01Activation()` 读 `<storageRoot>/activation/card-01.json`；`:48` 文件不存在 ⇒ 返回 `cohort:"pre"`；`:59` 合法 ⇒ `cohort:"post"`。`:155-156` 唯一调用点；**全仓无任何 CLI 参数可指定 cohort**。
   - storageRoot 实测 = `/Users/Hugh/Hugh/Knowledge`；`/Users/Hugh/Hugh/Knowledge/activation/` **不存在** ⇒ **今天凡新卡必为 pre**。
   - **post 对 build-code 唯一真正多出来的东西**：`runtime/stage/stage-runner.mjs:4289-4293` `const currentSpecAnalyze = !stageOutcome.value && stage === "build-code" && ctx.manifest?.activation_cohort === "post" ? await currentPostBuildCodeSpecAnalyze(...) : null;`（build-plan 同形于 `:4297-4298`）⇒ **pre 卡的逐条验收链永不做机器核查**，而这正是 card-07 那 858 errors/858 findings 唯一被发现的通道。
   - **后续状态**：该检查得出的方向（card-04 保持 pre、放开 `activation_cohort === "post"` 限制）**已被 step 7 第 3 问的用户逐字 directive 取代**（见 `## Supersedes` 第 1 条）：card-04 本身改为 post，且今后不再为 pre 设计。检查本身的**事实结论仍然成立**。
2. **字段/路径命名是否已有唯一权威定义 —— 成立。**
   - `source_ids`/`decision_ids`/`fr_ids`/`task_ids`/`coverage_limits`/`scenario`/`actual_outcome` 的结构权威是 `runtime/stage/stage-runner.mjs:3930-3949`；语义权威是 `runtime/stage/stage-content-contracts.mjs:6257` `validateBuildCodeAcceptanceChain`。
   - `coverage_limits` 的允许键与「必须非空文本数组」由 `runtime/evidence/acceptance-evidence-validator.mjs:63,73` 与 `runtime/review/schemas/ac-evidence-summary.schema.json:29,42` 定义。
   - 领域名已存在（`CONTEXT.md:301`「逐条 AC 的可读验收视图」）。
3. **失败路径/异常语义是否明确 —— 未定，留给 step 7 → 已在 step 6 退出检查收尾钉死。**
   - 运行时非通过终态至少含 `missing` / `inconsistent` / `incomplete` / `unavailable` / `failed` / `deferred`；「哪些算『没做到』并进报告最前面」必须收敛为一处定义（不新增状态机）。
   - 钉死结论见 `## 决定` D-004（机器判定类 vs 人写声明类，逐条枚举不许总结，不新增状态机）。
   - **MISSING — not established**：`deferred` 是否进入报告的「没做到」部分，log 的两处列举**不一致**——退出检查 3 的前置版本列了 `deferred`（`decision-log.md:865`），收尾钉死版本列的是 `missing`/`inconsistent`/`incomplete`/`failed`/`unavailable`（`:874`，无 `deferred`）。本稿按收尾版本写，并把差异留作未决项。
4. **范围边界是否写死 —— 成立。**
   - 逐字：「只做验收标准与测试的体系化 + 让已有事实可见；**不做** CARD-05（审查工具/provider）、CARD-10（整体集成验收与 close）、CARD-06（删除）；零新增依赖；不新增阻断门/计数器/schema（`CONSTITUTION.md:85`）；不设统一预算门（`docs/standard-workflow.md:90`）。」
   - 并附五类消息覆盖矩阵（目标 / 流程·表面 / 数据·状态 / 成功·失败·验收 / 约束·非目标·延期），每条至少一个需求轴 + 已认证答复或记录理由（`decision-log.md:871-878`）。
- **收敛判定（逐字）**：「grill 已无 high/medium 待答项（共提出 7 问，1 问经核实后重提一次）。」（`decision-log.md:905`）

---

## 审查处置

本节逐条处置 make-decision **direction** 审查的 13 条 findings。该审查真实执行：3 个异源 provider（`antigravity/flash`、`codex/luna`、`kimi/coding`）全部返回结果；`pair_id=d1fd1157-3519-4258-88be-a772415f39ca`；red 角色结果已发布（`quality/reviews/results/make-decision-simple-5f798a09-caee-5912-ae05-a1cf5ea88968.json`），blue 角色语义可用但未发布结果（`quality/reviews/attempts/04df852d-39a7-5ae0-a133-06e0b1964d10/attempt.json`）。严重度分配：**1 blocking / 10 major / 2 minor**。

| # | finding id | 严重度 | 处置 | 依据与落地动作 |
| --- | --- | --- | --- | --- |
| 1 | F-7850fbcdb42b | **blocking** | 采纳 | OI-011 的问法（「什么条件下必须阻断推进」）与 `CONSTITUTION.md` 及用户 step 5 硬约束冲突，**问法作废**；OI-011 终态为「不新增阻断门」，诚实标注只作事实呈现、不作推进许可或阻塞条件（见 OI-011 `selected_disposition`）。 |
| 2 | F-cdc5f1c9e5e5 | major | 采纳 | 本卡在 make-decision 期间改了生产代码却未走 G-2 豁免。按 R-002 补记豁免理由与风险 → 见下 `### G-2 豁免记录`；解除条件进 build-code。 |
| 3 | F-46675f3a53b3 | major | 采纳 | OI-010（测试防膨胀）曾被归入 `non_goals` 类别，与 R-004/R-005 相背；其终态明确为核心交付（D-007），误挂事实已记入 OI-010 `selected_disposition`。 |
| 4 | F-d519f2a80c62 | major | 采纳 | 「oracle 分离的具体实现形态」从 OI-018 的可后置清单**移出**：本卡确立方向（OI-005 的答案），build-plan 落地。 |
| 5 | F-71c1cf8deeb7 | major | 采纳 | OI-002 的「窄 vs 全局」是虚假二选一；终态即被漏掉的第三选项——**有界体系级 + 复用既有载体**（见 OI-002 `selected_disposition` 与 `## 非目标`）。 |
| 6 | F-36af524f246a | major | 采纳 | 设计轴定死为**不新增阻断门**。保留的只有「机器判定类事实逐条枚举」，它是呈现不是门；OI-007 的被取代即此裁决。 |
| 7 | F-2f864d8bb1e3 | major | 采纳 | 契约不得只要求「写出来」而不管生产是否调用。D-008 增加硬要求：规则落点必须给出**有生产调用点**的证据，或如实登记为死件。已核实三处零调用点缺口：`runtime/evidence/stage-content-evidence.mjs:367` `verifyStageContentEvidence` 零调用者；`runtime/stage/stage-content-contracts.mjs:2970` `validateDecisionLogContract`、`:2907` `validateDecisionEntry`、`:2849` `validateDecisionLogStepUpdateContract` 只有测试调用者。作为 build-plan 输入。 |
| 8 | F-ca4993f5e947 | major | 部分采纳 | 不改「落在既有载体上」的方向，但补一条**载体存活前提**：复用前必须核实载体有生产调用点并被真实消费，存活证据写进落点文档；核实不通过则登记为死件，不得假装复用。 |
| 9 | F-cf9343598e04 | major | 部分采纳 | `source` 是 step 3 冻结的框架字段，**不回改历史材料**；改由每条 OI 终态的 `selected_disposition` 显式引用用户 step 5 / step 7 的裁定（18 条已落地）。 |
| 10 | F-82ec8c709271 | major | 采纳 | D-002 已含 post cohort 拓扑切片；回归验收义务写进 `### G-2 豁免记录` 的解除条件。 |
| 11 | F-fcff63414de9 | major | 采纳 | 矩阵登记必须能回答「该模块的已知失败类是否被检出」→ 见下 `### 对 D-007 的两条补充` 第 (2) 条。 |
| 12 | F-b70eeaec3240 | minor | 采纳 | OI-001 的 question 属 step 3 冻结材料，不回改。**在此如实登记**：`178 个会话清点` 在本卡提交的取证材料（六份 research 回执与 `/tmp/wh-an/report-*.md`）中**没有对应产物**；本卡结论不依赖该数字（取证以五份 Codex 会话 + 四张归档卡审计为准）。 |
| 13 | F-fd9040a93d98 | minor | 采纳 | 分母口径已补齐（全仓 `*.test.mjs` 303 文件 / 76,248 行；按文件数 151/248 = 60.9%，按行数 37,122/64,981 = 57.1%）。审查命令数与 AC 分级的分母本就不同（前者按审查命令条数、后者按 AC 条数），本卡不作合并。 |

### G-2 豁免记录（make-decision 期间的生产代码改动）

依据 R-002「G-2 豁免须补可失败检查或写明理由与风险」。

- **改动**：`tools/cli/stage-runtime.mjs`，`+6 −1`（`git diff --stat` 现场值），无其他生产文件改动。
- **为什么在本阶段改**：用户裁定「甲：现在就修这个检查」。该缺陷使 post 卡在 make-decision 阶段结构性无法启动（逐字报错 `Error: current task material missing or unreadable: spec.md, phases/index.md`），不修则本卡自身无法继续推进。
- **缺失的可失败检查（如实登记）**：改动前**没有**「先红后绿」的证据——不存在一条在本改动前会失败的测试。因此本条属**豁免**，而非有效 RED。
- **豁免理由**：缺陷在 make-decision 阶段被用户当场裁定修复；该阶段没有测试运行面（`preflight` 只接受 `build-code`/`verify-code`，见 `tools/cli/stage-runtime.mjs:1037`），无法在阶段内产出可失败检查。
- **风险**：该改动会进入最终 diff；若 build-code 不补测试，它将成为无测试覆盖的生产改动。已核实无既有测试断言旧行为（`grep -rn "current task material missing or unreadable" tests/ runtime/ tools/` 只命中 `runtime/stage/stage-context.mjs:90`、`:105` 与本次改动处）。
- **解除条件（build-code 必须完成）**：补两条回归测试——① post + `make-decision`/`build-plan` 缺 `spec.md` 不抛错；② post + `build-code`/`verify-code` 缺材料仍抛 `current task material missing or unreadable`。

### 对 D-007 的补充（审查采纳，三条）

1. **载体存活前提**（来源 F-ca4993f5e947）：任何「复用既有载体」的落点必须附该载体的生产调用点证据（`path:line`，且该路径被真实执行链调用）；无证据者登记为死件，不得计作已复用。
2. **已知失败类可检出性**（来源 F-fcff63414de9）：矩阵登记项除「有测试」外，须附至少一次可证伪的抽查记录——即人为植入一个缺陷、验证该模块的测试会红。**不引入变异测试框架**（零新增依赖约束）；抽查由异源上下文执行，未能抽查的模块如实记录。
3. **载体旁路事实（起草期一手核实）**：post cohort 下三个「看起来在管 AC 形状」的校验器**全部被旁路**——
   - `validateExecutablePlanTaskMinimum`（`runtime/stage/stage-content-contracts.mjs:7618`）：两个调用点 `runtime/stage/stage-handlers.mjs:3853` 与 `runtime/stage/stage-content-contracts.mjs:6360` 都是 `post ? … : validateExecutablePlanTaskMinimum(…)` 形式，post 走 then 分支 ⇒ `e2e_scope` 四值校验、`high_risk_user_visible` 的 decision refs、`not_required` 的 ui_applicability 门、`acceptance_role`/`ui_scope`、`acceptance_data` 的 `source`/`sample`/`scenario`/`tier`、`execution` 形状**在本卡上都不执行**。
   - `validateMaterialOracleContract`（`:4350`）：调用点 `runtime/stage/stage-handlers.mjs:3871` 同形 ⇒ 连带 `validateAcFourSegmentCards`（`:4263`）与 `validateTaskOracleContract`（`:4307`）在 post 上无有效调用点 ⇒ **四段式 AC 卡不是本卡强制形状**。
   - `validateAcceptanceDesignMinimum`（`:4215`）与 `validateSpecFailureConditions`（`:6034`）：路径是 `validateStructuredSpecContracts`（定义 `:6053`，`:6060` 在定义体内直接调用）→ `if (stage === "build-spec")` 分支内的调用位置 `:6345-6346`（step 10 现场复核更正：原记「唯一路径 `:6053` → 唯一调用点 `:6346`」；**另有第二个调用点 `runtime/stage/stage-handlers.mjs:3767`**）；post 拓扑跳过 build-spec（D-002）⇒ **不可达**。
   - **post 下真正生效的只有两个**：`validatePostPhaseContract`（`:6839`，由 `runtime/stage/stage-handlers.mjs:3859-3861` 抛错；17 个 task 卡必填字段在 `:6918-6923`）与 `validateBuildCodeAcceptanceChain`（`:6257`，唯一调用点 `:6385`，不受 cohort 影响）。
   - 内建诚实降级可直接引用：`runtime/stage/stage-handlers.mjs:3877` 逐字 `if (post) missingItems.push("prewritten target RED evidence is not authenticated by the post build-plan handler; Phase command/oracle text is only a declaration");`
   - **后果**：本卡（post）的 AC 写法契约必须锚定在 `validatePostPhaseContract` 的 17 个字段上，而不是四段式上；否则规则会落在一条对本卡不执行的路径上——与 F-2f864d8bb1e3、F-ca4993f5e947 属同一类失效。

---

### detail 审查（39 条 findings，通道降级如实记录）

#### CARD-04 detail 审查 39 条 findings 逐条处置表

**通道与状态**：本审查**不是 canonical 通道产出**——它由技能自带骨架通道 `skills/wh-review/scripts/wh-review-cli.mjs run` 直连异源 provider 跑出，`status="available-with-failures"`、2 角色 × 3 provider 共 6 次执行、5 次完成（`kimi/coding` 在 red 角色被限流），`authoritative=false`。
**结果落点（非 canonical sink）**：`/Users/Hugh/.workflowhub/review-sink/b7c67b07015764ac326885c7724fa217c198103f65dad22c5ade00933dac8ead.json`，105,177 B，sha256 `2baed5c4933aef0d5a94dcf422edcaac056965c0eb277559eb5ee4eb79d4d7ab`（字节数与哈希由本次起草重新实测复核）。
**为什么是 advisory**：`quality/reviews/` 树在派发前后均为 attempts 7 / results 1 / reports 8，**未新增任何记录**；`importCanonicalReviewResult` 只导不建，故本审查不得被当作 canonical 通过。
**findings 规模**：39 条，无 `id` 字段，按 1-based 序号引用；severity = blocking 4 / major 28 / minor 7；provider = `codex/luna` 21、`antigravity/flash` 11、`kimi/coding` 7。全文另存 `/tmp/wh-an/review/FINDINGS.md`（47,260 B）。

##### 逐条处置

| # | 严重度 | provider | 位置 | 问题（一句） | 处置 | 依据与落地动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | blocking | antigravity/flash | `materials/03-draft_spec_or_acceptance.md:445` | 送审的 AC 契约只给「将来任务」的通用模板，完全没有本卡自己的 D-001…D-008 与 AC-16…AC-21，并把可执行 AC 推给 build-plan ⇒ 违反 R-001/R-003 | 采纳 | 已新增 `## 本卡自身的验收标准（AC-16…AC-21）`：把母 PRD `prd.md:335-340` 的六条原样引入，逐条写出真实入口、可度量成功值、失败场景与真跑命令；不可得部分逐条记 `MISSING — not established`，不补造 |
| 2 | major | antigravity/flash | `materials/03-draft_spec_or_acceptance.md:1` | 送审契约对 make-decision 期间 `tools/cli/stage-runtime.mjs` 的 `+6 −1` 改动、G-2 豁免与 build-code 回归义务只字未提，缺陷修复的验收脱节 | 部分采纳 | 豁免理由、风险与解除条件已按 R-002 回记入 `### G-2 豁免记录（make-decision 期间的生产代码改动）`（两条回归测试：post + make-decision/build-plan 缺 `spec.md` 不抛错；post + build-code/verify-code 缺材料仍抛错），承载 D-002 的遗留义务；送审材料是当时的快照，本体不回改 |
| 3 | major | antigravity/flash | `materials/03-draft_spec_or_acceptance.md:114` | 契约要求在 task 卡自由文本里写 `source`/`sample`/`scenario`/`tier` 四元组以满足执行证据校验器，却又自认 post 形态下无解析者、写了没人消费 | 部分采纳 | 采纳「契约不得只要求写出来而不管生产是否调用」这一结论，落为 `### 对 D-007 的补充（审查采纳，三条）` 第 1 条「载体存活前提」与第 2 条：复用载体必须附生产调用点证据，否则登记为死条款；字段本身的取舍承载 D-008（规则落点押后 build-plan） |
| 4 | major | antigravity/flash | `materials/03-draft_spec_or_acceptance.md:119` | 契约 §2.4 模板同时给出 `### AC-<ID>` 与 `- [ ] **AC-<ID>**` 两种定义并声称靠 `validateSpecFailureConditions` 识别，而该校验器在 post 拓扑下不可达 | 部分采纳 | 该不可达事实已被一手核实并记入 `### 对 D-007 的补充（审查采纳，三条）` 第 3 条「载体旁路事实」（`:6345` 的 build-spec 分支在 post 下不可达；post 下真正生效的只有 `validatePostPhaseContract` 与 `validateBuildCodeAcceptanceChain`）；送审模板本体不回改，`## 本卡自身的验收标准（AC-16…AC-21）` 不采用四段式 |
| 5 | major | antigravity/flash | `materials/03-draft_spec_or_acceptance.md:352` | 契约 §6.3 把空槽说成 card-07 的 858 errors / 858 findings 的来源与 D-003 的接线位置，夸大了 D-003 的修复范围 | 采纳 | 表述按已记录决定修正：D-003 只接线 `evidence_refs` 一个槽位（`runtime/stage/stage-runner.mjs:3947` ← `runtime/stage/stage-handlers.mjs:1696`）；D-001 明确本卡不碰 `task_ids`/`review_ref`/anchor，并明确接受该链在本卡之后仍判「不完整」 |
| 6 | minor | antigravity/flash | `materials/03-draft_spec_or_acceptance.md:203` | §3.5 强制 AC 卡写 `e2e_scope=not_required`，但该字段不在 post task 卡的 17 个必填字段中；且称 `ui_applicability` 已 recorded，而当时 OPEN-007 仍开放 | 部分采纳 | 两条事实分列且各自为真：17 必填字段是 `validatePostPhaseContract` 的机器必填（`### 对 D-007 的补充（审查采纳，三条）` 第 3 条）；`ui_applicability` 由真实用户答复补写为 `## UI applicability`（`result: non_ui`、`gate: false`）。`e2e_scope` 的书写要求不作为全仓规则，其语义承载 AC-20 |
| 7 | blocking | codex/luna | `materials/02-approved_direction.md` | D-006/D-008 把未经用户裁决的设计选择记为 confirmed，而 OI 仍待用户决策、最终确认尚未产生 | 采纳 | 本条针对 D-006、D-008（连同全部 8 条 D）：`status` 先改为 `proposed（待 step 10 最终确认）`，step 10 取得真实用户答复「确认收口，但是不要推进下一阶段」后改回 `confirmed`（`## 最终确认` 第 3 条）；`approval_hash` 如实记 MISSING |
| 8 | major | codex/luna | `materials/02-approved_direction.md` | post cohort 前提依赖对 kernel-owned `task.json` 的带外改写，没有可复现的产品路径，新建 task 仍默认解析为 pre | 部分采纳 | 带外编辑的前后 sha256、`activation_cohort` 取值与「没有代码路径能改写既有 task.json」已如实登记于 `## cohort 切到 post 与「post 卡跑不起来」缺陷（step 7 第 3 问）` 与 D-002，并作为 `### 交付风险（step 8 补齐）` 第 11 条移交；「cohort 切换成为产品能力」D-002 记为未决、无 owner |
| 9 | blocking | codex/luna | `materials/03-draft_spec_or_acceptance.md` | 契约把可执行验收推给 build-plan，又自认 post 旁路了可观察场景与失败条件的校验器，条件→行为→可度量→失败 的契约不被强制 | 采纳 | 可执行验收已在 `## 本卡自身的验收标准（AC-16…AC-21）` 于 make-decision 写出并逐条绑定失败场景；「post 下这些校验器不执行」如实声明于 `### 对 D-007 的补充（审查采纳，三条）` 第 3 条；AC 的强制力来自「人可判真假」与真实入口实跑，不新增门 |
| 10 | major | codex/luna | `materials/03-draft_spec_or_acceptance.md` | 把 non-UI 等同于 `e2e_scope=not_required`，可能连带压掉命令/服务类的端到端覆盖，与「完整单测加端到端」及 D-006 的每 phase 真实入口相冲 | 部分采纳 | `## UI applicability` 只声明本卡为 `non_ui` 且 `gate: false`，不推广为「非 UI 即免 E2E」；AC-20 反向钉住：适用路线缺任一适用产物即判失败，不适用路线记 N/A + reason 且不判失败 |
| 11 | major | codex/luna | `materials/03-draft_spec_or_acceptance.md` | 反自证的防线不是可验证契约：改动前 RED 明确未认证，负控规则没有字段、执行记录、来源或独立结果 | 部分采纳 | RED 不可得时按既有形态如实记 `unavailable` 并计入报告「没做到」（OI-006）；负控要求落为 `### 对 D-007 的补充（审查采纳，三条）` 第 2 条（植入缺陷→该模块测试必须变红，零新增变异框架）；AC-18 已写出「只有 GREEN 无 RED 且无 G-2 披露 ⇒ 失败」，但其样例 task 不存在，如实记 `MISSING — not established` |
| 12 | major | codex/luna | `materials/02-approved_direction.md` | 聊天报告管线存在互斥的执笔决定且未收敛：产品代码渲染 vs 独立子代理执笔，且未定义产物与交接 | 部分采纳 | D-005 已钉死交付现场（build-code 阶段末、在聊天里发出）、执笔人（独立子代理，主会话原样贴出、不得润色删减）与不对称压缩；「渲染器渲染」与「独立子代理执笔」是同一产物的两个环节还是两份产物，D-005 的 `unresolved_items` ③ 如实记 `MISSING — not established`，owner = build-plan |
| 13 | major | codex/luna | `materials/03-draft_spec_or_acceptance.md` | 「不新增看过记录」的决定与 verify-code 完成契约要求的 `quality/confirmations/*` 证据源之间没有路径 | 部分采纳 | 实测给出了既有载体的路径：`human-confirmation.v3` 记录 `material_revision` 与 `snapshot_tree`，定稿材料后发布确认即令 `human_confirmation` 判 `satisfied`（`### step 10 阶段收口的一手发现（新增）` 第 1 条）；`review_ref` 的载体仍无着落且必与 CARD-05 冲突（D-001），跨卡冻结顺序见 `## 未决项` 的 OPEN-006 |
| 14 | major | codex/luna | `materials/03-draft_spec_or_acceptance.md` | 状态词表不一致：L-a 缺 `inconsistent`/`incomplete` 这两个机器非通过态，却含报告处置未定的 `deferred` | 部分采纳 | D-004 已把「没做到」定义为全部非通过终态并分两来源类：机器判定类 `missing`/`inconsistent`/`incomplete`/`failed`/`unavailable` 逐条枚举不许总结，人写声明类 `coverage_limits`（+ `exceptions`）空数组不合法；口径统一承载 OI-015 |
| 15 | major | codex/luna | `materials/02-approved_direction.md` | 真实入口／E2E 接口在无可消费契约的情况下被后置：清单文件名、结构、消费者与跨卡冻结顺序都还开放 | 部分采纳 | D-006 已定入口清单的落点（`docs/architecture/` 新建独立文档、允许间接入口但必须点名、未被跑过的入口要点名），文件名与结构仍未定 ⇒ 如实记 `MISSING — not established`；跨卡冻结顺序即 `## 未决项` 的 OPEN-006（仍开放，移交 build-plan） |
| 16 | major | codex/luna | `materials/02-approved_direction.md` | 测试体系化的目标结果无法区分「行为覆盖完整」与「测试文件再次淤积」：覆盖只作诊断、预算只报不拦、落点与规则文本 MISSING | 部分采纳 | D-007 定下按模块与测试层级的矩阵登记（登记率可数）＋覆盖率为诊断而非门；`### 对 D-007 的补充（审查采纳，三条）` 第 2 条要求每次矩阵登记附至少一条可证伪抽查记录（植入缺陷→变红），未抽查模块如实记录；规则逐条文本记 `MISSING — not established`（D-007 `unresolved_items` ①，owner = build-plan） |
| 17 | minor | codex/luna | `materials/03-draft_spec_or_acceptance.md` | 证据契约未定义 trace/JUnit/跳过计数的路线适用性，无法区分「必需产物缺失」与「不适用、应记 N/A + 理由」 | 采纳 | OI-007 收口为事实记录：矩阵保留「哪条测试路线适用哪些产物，N/A 必附理由」，不设失败判定；适用产物的判定落为 AC-20（适用路线缺任一适用产物即判失败，不适用路线记 N/A + reason 且不判失败） |
| 18 | major | codex/luna | `materials/02-approved_direction.md` | 方向记录含互斥的审查 provenance：一处记 direction 审查 unavailable 且 `provider_attempts: []`，另一处记三 provider 全部返回并发布 red 结果，第二次尝试与连接未登记 | 部分采纳 | 两处记录都真实存在并如实保留（`:722-727` 的 `unavailable` + `REVIEW_SOURCE_DRIFT`；`:1559` 的 `pair_id=d1fd1157…` 与已发布 red 结果），本卡不把它们改写成一致；审查记录链缺陷已逐条登记并移交 CARD-05（`### 审查记录链缺陷（本卡发现，移交 CARD-05）`），但两次尝试之间的 attempt id 连接仍是缺口 |
| 19 | major | kimi/coding | `materials/03-draft_spec_or_acceptance.md:203` | §3.5 把 `ui_applicability` 说成「已经冻结」并据此下硬性命令，而该值当时仍未取得用户答复、OPEN-007 仍开放 | 采纳 | step 10 已取得真实用户答复「non_ui — 本卡不涉及页面、交互或前端组件」，并据此写出 `## UI applicability`（三份来源结论一致、`gate: false`），见 `## 最终确认` 第 1 条；该答复取代了「已经冻结」的推定 |
| 20 | major | kimi/coding | `materials/03-draft_spec_or_acceptance.md:150` | §2.5 说填不出的字段在 Coverage limit 记 MISSING 且不阻断，但 17 个 task 卡字段是硬必填、`validatePostPhaseContract` 会抛错，按 §2.5 字面写就会撞门 | 采纳 | `## 本卡自身的验收标准（AC-16…AC-21）` 顶部「分界（回答 detail 审查 #26）」已把两个平面分开：17 必填字段是机器必填、必须在 build-plan 真实填出、没有 MISSING 余地；MISSING 规则只适用于机器不校验的字段 |
| 21 | major | kimi/coding | `materials/03-draft_spec_or_acceptance.md:104` | R-002 把共享定义 SD-13「验收标准五段式」列为在范围（`## 范围` 的卡面来源与约束都点了 SD-13），但契约从未追踪其五段，PRD 合规性不可验证 | 记为覆盖限制 | SD-13 确实被 `## 范围` 与 R-002 列为共享定义（`:65`、`:1031`），但其五段在本卡材料中**没有对应物**，如实记 `MISSING — not established`；不补造追踪表，作为交付时的覆盖限制；规则文本落点承载 D-008 |
| 22 | major | kimi/coding | `materials/03-draft_spec_or_acceptance.md:221` | 契约 §4 没有带进 D-007 的两条绑定补充：载体存活证据、以及每次矩阵登记须附可证伪抽查记录 | 采纳 | 两条补充已逐字记入 `### 对 D-007 的补充（审查采纳，三条）` 第 1、2 条，并明确不引入变异测试框架（零新增依赖）、未抽查模块如实记录 |
| 23 | minor | kimi/coding | `materials/03-draft_spec_or_acceptance.md:269` | L-a 引用的枚举含 `deferred`，§5.1 又把「没做到」定义为全部非通过终态（按字面含 `deferred`），但枚举的机器判定类里没有它，报告如何渲染 `deferred` 未定义 | 部分采纳 | 「没做到」＝全部非通过终态、分机器判定类与人写声明类两分且不得互相顶替（D-004），口径统一承载 OI-015；`deferred` 归哪一类本卡未钉死，与 `exceptions` 的语义与允许值同属 D-004 的 `unresolved_items`，owner = build-plan |
| 24 | minor | kimi/coding | `materials/03-draft_spec_or_acceptance.md:243` | 材料自身有两个未对账的实测总行数：D-007 记 76,075 行，RS-D 结构事实记 303 文件 / 76,248 行，口径差异未说明 | 记为覆盖限制 | 两个数字确实并存（`76,075` 见 D-007 与 `:920`；`76,248`/303 文件见 D-007 的 RS-D 事实、`## 调研候选交付` 与 direction 审查第 13 条处置），本卡未复算口径差异，如实登记为覆盖限制；数字修正与计数口径承载 D-007（`unresolved_items` ⑤ 与 `tests/contract/repository-inventory.test.mjs:175` 断言联动） |
| 25 | minor | kimi/coding | `materials/03-draft_spec_or_acceptance.md:104` | R-001 要求机器产物「按测试路线适用、不适用记 N/A + reason」，但契约的字段与载体里没有这个矩阵的位置，build-plan 无处落笔 | 部分采纳 | 矩阵保留为事实记录（OI-007：N/A 必附理由、不设失败判定），方向由 D-007 的模块×层级矩阵承载；per-AC 的承载字段本卡未指定，随规则文本一并押后到 build-plan（D-008） |
| 26 | blocking | antigravity/flash | `materials/03-draft_spec_or_acceptance.md:150` | §2.5 说填不出的字段记 MISSING 且不阻断，但 post 下 `validatePostPhaseContract` 会无条件抛错阻断 build-plan，必填字段（如 `gate_cmd`、GREEN oracle）没有可行的填写规则 | 采纳 | 两个平面已分开写进 `## 本卡自身的验收标准（AC-16…AC-21）` 顶部「分界（回答 detail 审查 #26）」：`validatePostPhaseContract` 的 17 个必填字段（`runtime/stage/stage-content-contracts.mjs:6918-6923`）是机器必填、必须在 build-plan 真实填出，MISSING 规则只适用于机器不校验的字段；不为 MISSING 标注字段加校验器豁免（不新增门） |
| 27 | major | antigravity/flash | `materials/03-draft_spec_or_acceptance.md:203` | §3.5 把本卡 `ui_applicability=non_ui` 提升为全仓 AC 通用规则（禁 browser tier、强令 `e2e_scope=not_required`），且该字段在 post 模板中未定义 | 部分采纳 | 本卡只把 `non_ui` 记为自身事实（`## UI applicability`，三来源一致、`gate: false`），不写成全仓规则；`e2e_scope` 不在 17 必填字段内，其「不适用路线」语义改由 AC-20 的 N/A + reason 表达 |
| 28 | major | antigravity/flash | `materials/03-draft_spec_or_acceptance.md:52` | §2.1/§2.4 把 spec.md 的 AC 与 `phases/P<n>.md` 的 task 卡 1:1 强绑，叠加 §3.4 禁止单测作为 AC 判据，phase 内无法承载单测任务或多 task 支撑一个 AC | 部分采纳 | 1:1 不是 post 下的强制形状：`### 对 D-007 的补充（审查采纳，三条）` 第 3 条已证明四段式 AC 卡与 `validateMaterialOracleContract`/`validateAcFourSegmentCards` 在 post 下无可达调用点；但「AC 关联多个 task」要走 `task_ids`，D-001 明确本卡不碰 `task_ids`（结构上无法满足，已记未决），该半条不采纳、不接线 |
| 29 | minor | antigravity/flash | `materials/03-draft_spec_or_acceptance.md:218` | §4.1 矩阵承诺「具体文件名规则见 4.1.1」，而 §4.1.1 没有任何命名规则条款 | 部分采纳 | 前向引用缺陷属送审材料本体（不回改）；单元测试命名规则属规则文本，本卡尚未成文，D-007 的 `unresolved_items` ① 已如实记 `MISSING — not established`、owner = build-plan |
| 30 | minor | antigravity/flash | `materials/02-approved_direction.md:274` | OI-011 在大纲块里的 `status` 仍为 `open`，与其 `selected_disposition` 记的「已关闭」并存，构成状态冲突 | 不采纳 | 推荐动作是「把 `status` 改为 closed」，本卡按既定口径不做：终态一律写在 `selected_disposition`（OI-011 已在 `:280` 记「已关闭」，依据即 direction 审查第 1 条 F-7850fbcdb42b 的采纳结论），不回改 step 3 大纲字段。实测 18 条 OI 中 `status: open` 而 `selected_disposition` 已收敛／已关闭／被取代者共 13 条，单改 OI-011 只会制造新的不一致 |
| 31 | major | codex/luna | `materials/02-approved_direction.md` | post-only 契约不可复现：本卡靠带外编辑 kernel-owned `task.json` 变成 post，而新建 task 仍默认 pre，也没有受支持的切换器 | 部分采纳 | 与 #8 同源：带外编辑与前后 sha256 已如实登记于 D-002 与 `## cohort 切到 post 与「post 卡跑不起来」缺陷（step 7 第 3 问）`；「换 cohort 不是产品能力」列在 `### 交付风险（step 8 补齐）` 第 11 条；本卡既不补迁移路径也不声称契约与默认 cohort 兼容，缺口如实留在记录里 |
| 32 | major | codex/luna | `materials/03-draft_spec_or_acceptance.md` | 契约把 non-UI 适用性转换成 `e2e_scope=not_required`，删掉了非浏览器类的必需 E2E 通路，与「完整单测与端到端」及每 phase 真实入口相冲 | 部分采纳 | 同 #10：`## UI applicability` 只声明本卡 `non_ui` 且 `gate: false`，不把 UI 适用性与 E2E 必要性绑定；AC-20 要求适用路线缺任一适用产物即判失败，`not_required` 必须逐条给出理由 |
| 33 | major | codex/luna | `materials/03-draft_spec_or_acceptance.md` | 送审 detail 既不是完整的可执行验收，也没有明确标为非权威：可执行验收被推给 build-plan、没有卡面具体的 AC 实例，同时又为未决决定引入规范条款 | 采纳 | 卡面自身的 AC 实例已在 `## 本卡自身的验收标准（AC-16…AC-21）` 于 make-decision 写出（条件、行为、可度量成功值、失败场景、真跑命令、当前可得性）；未决规则按真实用户答复定稿（`## 最终确认`），不再由送审稿的规范条款冒充；build-plan 只可扩展、不可首次创造可执行验收 |
| 34 | major | codex/luna | `materials/03-draft_spec_or_acceptance.md` | RED/GREEN 字段只是声明，不能证明改动前真的红过、也不能证明修好后重跑，TDD 顺序不可验证 | 采纳 | 已写成可验收条件：AC-18 要求「同一测试改动前失败、改动后通过」的记录，只有 GREEN 无 RED 且无 G-2 豁免披露即判失败；RED 不可得时按既有形态如实记 `unavailable` 并计入报告「没做到」（OI-006） |
| 35 | major | codex/luna | `materials/03-draft_spec_or_acceptance.md` | 机器产物契约缺测试路线适用矩阵（trace/JUnit/跳过计数的必需或 N/A + reason），也没有表示测试/验收技能的执行事实 | 部分采纳 | 适用矩阵按 OI-007 收为事实记录（N/A 必附理由），判定落 AC-20；真实入口的执行事实接线点已定：D-003 把空 `evidence_refs` 接回真实引用，并以 `stage-quality-evidence.v1` 的 `subject_fact.execution`（命令 + 内容寻址 stdout + 运行时判定的 `assertions[].result`）承载运行记录；路线级产物的承载字段仍待 build-plan |
| 36 | major | codex/luna | `materials/02-approved_direction.md` | 承诺的聊天报告没有定下生产路径：产品代码渲染事实、独立子代理执笔、主会话粘贴，一份还是两份未定，也没有阶段末触发、传输与回读契约 | 部分采纳 | 同 #12：D-005 已定交付现场（build-code 阶段末、聊天）、执笔人（独立子代理，主会话原样贴出、不得润色删减）、结构与坏消息逐条枚举；「一份还是两份产物」D-005 记 `MISSING — not established`，`### 交付风险（step 8 补齐）` 第 8、9 条已登记「报告内容从哪来」与渲染器兼容面风险 |
| 37 | major | codex/luna | `materials/03-draft_spec_or_acceptance.md` | oracle 分离只有散文：没有 provenance 字段标识实现者、oracle 产出者、独立上下文与只读/隐藏边界，自判失败仍可能发生 | 部分采纳 | 方向已定并记于 OI-005：本卡不做物理隔离，改为异源上下文产出 + provenance 记录，无法建立独立判定者时如实标 incomplete 而不声称通过；`## 非目标` 与 `### 质量边界` 第 2 条同向；具体 provenance 字段押后 build-plan，读写面验收（AC-17）因样例 task 不存在如实记覆盖限制 |
| 38 | major | codex/luna | `materials/03-draft_spec_or_acceptance.md` | verify-code 完成链要求执行、审查与确认三份证据，但 `review_ref` 明确留给 CARD-05、用户又否决了「看过」记录，生产者与跨卡接口都没冻结，闭环无法判定 | 部分采纳 | D-001 已把 `review_ref` 定为**无载体且必与 CARD-05 冲突**的确定事实：`packet.evidence` 无 review 项，唯一生产者 `runtime/review/stage-review-disposition.mjs:230,263-268`，而 CARD-05 正在改 `runtime/review/**`；本卡不填该槽，跨卡冻结顺序留在 `## 未决项` 的 OPEN-006；确认面由既有 `human-confirmation.v3` 路径承担（`### step 10 阶段收口的一手发现（新增）` 第 1 条） |
| 39 | major | codex/luna | `materials/03-draft_spec_or_acceptance.md` | 状态语义跨层有损：每条 AC 的证据枚举是 passed/failed/missing/deferred/unavailable，报告的机器失败集却含 inconsistent/incomplete 而不含 deferred，没有映射，失败可能被丢弃或误分类 | 部分采纳 | D-004 已给出不新增状态机的损失控制：报告「没做到」＝全部非通过终态，机器判定类（`missing`/`inconsistent`/`incomplete`/`failed`/`unavailable`）逐条枚举不许总结，人写声明类（`coverage_limits`/`exceptions`）不得与之互相顶替；口径统一承载 OI-015；`deferred` 的归属仍未钉死，与 #23 同源，随 D-004 的 `unresolved_items` 交 build-plan |

##### 仍有分歧 / 未采纳的理由

- **#21（记为覆盖限制）**：SD-13 的「验收标准五段式」确实被 `## 范围` 与 R-002 列为在范围（`:65`、`:1031`），但它的五段在本卡材料里没有任何对应物，本卡只能如实记 `MISSING — not established` 而不补造一张追踪表——补造就等于把没有的东西写成像有的一样。
- **#24（记为覆盖限制）**：`76,075`（D-007、`:920`）与 `76,248`/303 文件（D-007 的 RS-D 事实、`## 调研候选交付`、direction 审查第 13 条处置）两个实测总行数在记录里并存，本卡没有复算口径差异就把它写成了分母，因此这里只登记缺口、不声称已对账。
- **#30（不采纳）**：推荐动作是回改 OI-011 大纲里的 `status` 字段，本卡明确不做——18 条 OI 里 `status: open` 而 `selected_disposition` 已收敛／已关闭／被取代的有 13 条，终态写在 `selected_disposition` 是本卡既定口径（该口径由 direction 审查第 9 条 F-cf9343598e04 的采纳结论确立），只改 OI-011 一条反而制造新的不一致。

##### 按主题的汇总

| 主题 | 条数 | 序号 | 承载决定／具名节 |
| --- | --- | --- | --- |
| 卡面自身可执行 AC 缺失或被后置 | 3 | #1, #9, #33 | `## 本卡自身的验收标准（AC-16…AC-21）`；D-003 |
| 未决决定被提前记为 confirmed | 1 | #7 | `## 最终确认`；D-006、D-008 |
| 送审材料表述夸大或 provenance 自相矛盾 | 2 | #5, #18 | D-001、D-003；`### 审查记录链缺陷（本卡发现，移交 CARD-05）` |
| G-2 豁免未带进送审材料 | 1 | #2 | `### G-2 豁免记录（make-decision 期间的生产代码改动）`；D-002 |
| 契约要求无人消费的字段／死条款 | 4 | #3, #4, #22, #29 | `### 对 D-007 的补充（审查采纳，三条）` 第 1/2/3 条；D-008 |
| 状态词表有损（`deferred` 与 `inconsistent`/`incomplete` 混淆） | 3 | #14, #23, #39 | D-004；OI-015 |
| UI 适用性越界与 `e2e_scope=not_required` | 5 | #6, #10, #19, #27, #32 | `## UI applicability`；AC-20 |
| 必填字段与 MISSING 规则相撞 | 2 | #20, #26 | `## 本卡自身的验收标准（AC-16…AC-21）` 顶部「分界」段 |
| 反自证与 RED/GREEN 只是声明 | 3 | #11, #34, #37 | OI-005、OI-006；AC-18；`### 对 D-007 的补充（审查采纳，三条）` 第 2 条 |
| 测试路线适用矩阵缺失 | 3 | #17, #25, #35 | OI-007；AC-20；D-003、D-007 |
| `post` cohort 不可复现 | 2 | #8, #31 | D-002；`### 交付风险（step 8 补齐）` 第 11 条 |
| 聊天报告管线无确定生产者 | 2 | #12, #36 | D-005 |
| verify-code 完成链的 `review_ref` 与确认面 | 2 | #13, #38 | D-001；`### step 10 阶段收口的一手发现（新增）` 第 1 条；`## 未决项` 的 OPEN-006 |
| 真实入口／E2E 接口与测试体系化的形状 | 3 | #15, #16, #28 | D-006、D-007、D-001；`## 未决项` 的 OPEN-006；`### 对 D-007 的补充（审查采纳，三条）` 第 3 条 |
| 如实登记为覆盖限制的缺口 | 2 | #21, #24 | `## 范围` 与 D-008；D-007 |
| OI 大纲 `status` 与终态并存 | 1 | #30 | OI-011；`## 审查处置` 的 direction 行 1（F-7850fbcdb42b） |

**处置取值计数（共 39 条）**：采纳 11、部分采纳 25、记为覆盖限制 2、不采纳 1。

#### 旧分组文本中未被 39 条表覆盖的事实

以下为被替换掉的旧分组处置文本（原 `### detail 审查（39 条 findings，通道降级如实记录）` 正文）中**仅存在于旧文本、39 条表未覆盖**的事实，逐条原样登记，不改写措辞：

1. **通道状态字段（旧文本逐字）**：`pair_status="partial"`、`red_incomplete=true`、`outcome="partial"`、`pair_id="3d4de759-35b2-4a69-9cb2-ca6c9bb158db"`、`material_id="9d43bc4ea859285a003532ec538a9165f3a6f9308c8c1ca6650dde4454dfb4e4"`。（39 条表与抬头只保留了 `status="available-with-failures"` 与 `authoritative=false`。）
2. **red 角色被限流的逐字报文**：`{"code":"RATE_LIMITED","message":"provider process exited with 1"}`（抬头只写「`kimi/coding` 在 red 角色被限流」，未带逐字报文）。
3. **通道定性句与指向**：旧文本逐字「⇒ 这是一次**能力降级**：审查真实发生、findings 被如实采纳，但它不是 canonical 记录，也不得被当作 canonical 通过。原因见下一节。」其中「原因见下一节」即 `### 审查记录链缺陷（本卡发现，移交 CARD-05）`。
4. **blocking #9 处置的逐字 `path:line`**：旧文本写「本卡如实声明 post 下这些校验器**不执行**（`runtime/stage/stage-handlers.mjs:3853`、`:3871`、`:6345`）」；39 条表第 9 条只保留了对 `### 对 D-007 的补充（审查采纳，三条）` 第 3 条的指向——`runtime/stage/stage-handlers.mjs:3853` 与 `:3871` 在这 39 行里不再出现（`:6345` 另见第 4 条行文）。
5. **blocking #1 处置的措辞项**：旧文本把新增节的内容列举为「真实入口、可观察结果、可度量成功值、失败场景与真跑命令」；39 条表第 1 条的同处列举未含「可观察结果」一项（该词在草稿全文 0 次）。
6. **major 分组名与其条数**：旧文本的分组行为 `| — | major 28 条（10 个主题） | …`，其 10 个主题逐字为：①G-2 豁免未带进 detail；②契约要求无人消费的事实（零生产调用点）；③状态词表有损（deferred 与 inconsistent/incomplete 混淆）；④`e2e_scope=not_required` 越界而 `ui_applicability` 仍开放（OPEN-007）；⑤`post` cohort 不可复现（task.json 为带外编辑）；⑥聊天报告管线无确定生产者；⑦oracle 分离只有散文；⑧RED/GREEN 是声明不是证据；⑨缺测试路线适用矩阵；⑩SD-13 五段式从未被追踪。（39 条表按逐条处置重组，未保留该 10 主题分组名与条数。）
7. **该分组行内只出现在旧文本的编号与归属**：③的处置旧文本写作「已按「机器判定类 / 人写声明类不得互相顶替」处置（**OI-016**、D-004）」——39 条表第 14、39 条在同一口径处写作 **OI-015**（两号在文件中都真实存在。**裁决（step 10，主会话）：以 39 条表的 `OI-015` 为准**——本文件 `decision-log.md:332` 的 OI-015 问句逐字为「验收条目与测试资产账本的状态口径怎么统一（SD-03 窄状态集），才能保证 unverified 永不被写成 succeeded、incomplete 不被当作可交付？」，正是 ③ 所指的状态词表主题；`decision-log.md:345` 的 OI-016 问句是「失败面到底包含哪些……每一条对应什么可机判的失败信号？」，属另一条轴。旧文本的 `OI-016` 系笔误。）；⑥的处置旧文本写作「已记入 **step 11/12** 的交付形态」（39 条表未出现 step 11/12）；⑦⑧⑨⑩旧文本统一记为「**已知缺口**」。
8. **minor 分组名与其条数**：旧文本的分组行为 `| — | minor 7 条 | 表述、分母、行号类 | **采纳/部分采纳** |`，处置写作「分母与自引行号已在**修复轮与重锚轮**处理；其余逐条存于 `FINDINGS.md`，不改结论」。（39 条表逐条给出了 severity=minor 的 7 条，未保留「表述、分母、行号类」这一分组名与「修复轮与重锚轮」的处置口径。）

### 审查记录链缺陷（本卡发现，移交 CARD-05）

本卡派发 detail 审查时撞上一条**会永久停用同一 task+stage 全部审查派发**的记录链缺陷。本卡**不改产品代码**（review 面属 CARD-05 领地，见 `## 非目标`），只如实记录并移交。

**触发条件**：一对审查中某角色的 `public_result.outcome === "partial"` 且 `status !== "unavailable"`，记录于快照 S；此后对同一 task+stage 在快照 S′ ≠ S 发起的任何 `review-record` 请求都会失败。

**三处叠加缺陷**（均在 `runtime/review/review-record-route.mjs`）：

1. **读者侧宽容标志被接进记录身份**：`:1728-1732` 的 `covered` 公式含 `(result.outcome === "completed" || (allowHistoricalPartialCoverage && result.outcome === "partial"))`，而该标志只由读者传入（`:1177`：`scope !== null && attempt.snapshot_tree !== scope.snapshotTree`，写时恒为 false）。`covered` 决定 `refs.result_ref`（`:1787`）、`coverage`（`:1791`）与 canonical result（`:1776`）⇒ 重读一条冻结记录会算出**不同的记录**（`result_ref` 由 `null` 翻成路径、`coverage` 由 `incomplete` 翻成 `satisfied`），触发 `:1180` 抛 `canonical review report binding is invalid`。
2. **失败被静默转成删除**：catch `:1198-1206` 对损坏记录重新分类，而 `:1151` 把任何 `snapshot_tree` 不同都判 `"foreign"`；worktree 一变即为真 ⇒ `return null`，记录从历史里消失而不是报错。任何读取期重算缺陷都会变成看不见的证据丢失。
3. **一个成员缺失毒化整条派发**：`:1210-1246` 只用幸存 entries 构建 `byRef`；blue 缺失 ⇒ `:1229` 抛 `canonical review pair member binding is invalid` ⇒ `:1415-1418` 转成 `REVIEW_HISTORY_UNAVAILABLE`，**该 stage 之后所有 review-record 请求全部失败**。

**实证**：仪器化后重跑得到 `classification=foreign msg=canonical review report binding is invalid`（针对 blue attempt `04df852d-39a7-5ae0-a133-06e0b1964d10`）与 `why=no-member-in-byRef`（针对 pair `d1fd1157…` 的 blue 成员）；仪器化已精确回退，`grep` 计数 0，`git diff --stat` 回到 `1 file changed, +6 −1`。

**最小修法方向**：① 不把读者侧宽容标志接进 `covered`（记录身份必须冻结），宽容只用于比较；② `:1180` 比较前按同一标志归一化；③ pair 成员不在当前命名空间时按历史 pair 跳过并记录跳过，而不是抛错毒化派发；④ 区分「可证 foreign」（stage/track/kind/scope/phase 不同）与「同命名空间但损坏」——后者必须 fail-closed 或上报，不能消失。

**第二条缺陷：result-only 导入通道只导不建。** `importCanonicalReviewResult`（`:1951`）**不创建任何东西**：`:1964-1966` 要求 refs 已存在于 `listCanonicalReviewAttemptRefs()` / `listCanonicalReviewResultRefs()`；骨架通道只产出 `sink_ref`，因此没有可导入的三元组。唯一创建者 `recordSimpleReviewResult:2011` 只能从已中毒的 `recordSimpleReviewRequest` 到达。实测两次探针均被拒（错误是 return 而非 throw，故 exit 0）：`provenance={}` 时逐字 `result-only provenance is missing attempt_ref`；即便手工构造出完整合法 provenance，仍逐字 `result-only review source or current identity mismatch`（`:1987-1989` 三个子条件中哪一个命中**未测定**，属 MISSING）。旁证：`provenance.provider_outputs` 全仓无生产者（`grep -rn "provider_outputs" skills tools runtime` 只命中消费者 `:1996`）；唯一 canonical result 是 direction track（`material_id 971113f6…`），即便 identity 相符也会被 `importResultProjection`（`:1999-2003`）以「不等于既有 canonical result」拒绝。

⇒ 本卡据此把 detail 审查记为 **advisory（`authoritative=false`）而非 canonical 通过**；这是能力降级，如实记录，不伪装成通过。

### step 10 阶段收口的一手发现（新增）

1. **确认绑定当前材料版本**：`runtime/task/task-kernel-implementation.mjs:846` 起，`human-confirmation.v3` 记录 `material_revision` 与 `snapshot_tree`；completion subject `human_confirmation` 只在确认与**当前**版本一致时判 `satisfied`。实测：先发布确认、再改 decision-log ⇒ `human_confirmation: missing`；先定稿日志、再发布确认 ⇒ `satisfied`。⇒ 正确顺序是**先定稿材料，再发布确认，最后跑阶段收口**。
2. **阶段收口实测结果**（本卡）：`status: "completed"`、`quality_status: "incomplete"`、exit code 1、唯一 `quality_warnings` = `current review result is unavailable for finding disposition`。该 warning 的直接原因就是上面登记的审查记录链缺陷：本 stage 的 canonical 审查通道被毒化后，detail 审查只能以 advisory 形态存在，因此不存在「当前」审查结果可供 finding disposition。⇒ 这正是本卡要证明的形态：**如实标注缺口，不阻断阶段收口**。
3. **节名口径缺陷**（声明层要 `## 风险`、活的口子要 `## 风险与延期交接`）见 `## 风险与延期交接` 下的 `### 节名口径（step 10 更正：step 8 的改名已回退）`。
4. **警告不进 status 投影（实测）**：`run` 输出里的 `quality_warnings`（本卡为 `["current review result is unavailable for finding disposition"]`）与 `quality_advisory_fact_refs`，在 `status --action=begin` 投影里**没有任何对应字段**（`status` 的键集合：`stage`、`work_status`、`continuation_allowed`、`work_authority`、`readiness_source`、`required_materials`、`missing_materials`、`quality_status`、`quality_missing`、`quality_fact_refs`、`quality_predicates`、`root_causes`、`named_refs`、`stage_reflection`、`status_matrix`、`identity`、`source_completeness`、`research`、`divergence_outline`、`execution_outcome`）（step 10 现场复核更正：该键集合是拓扑未解析时的形状，共 20 键；拓扑解析成功时另有 `task_type`、`activation_cohort`、`topology` 三键，共 23 键，见 `tools/cli/stage-runtime.mjs:1263-1267`；两种情形都没有 warning/advisory 类键）。⇒ 阶段收口的警告只能靠读 `run` 输出或翻 `quality/facts/` 才看得到，而 `status` 只报 `quality_status: completed`、`quality_missing: []`。这是本卡「如实标注、不阻断推进」的另一面：**标注了，但没有回读面**。

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": {
      "fact": "R-001..R-008 全部是验收标准写法、验收方式、单元测试与端到端测试体系化要求，不含任何页面、交互或前端组件要求",
      "conclusion": "non_ui"
    },
    "project_inventory": {
      "fact": "本卡工作面 = tools/cli/stage-runtime.mjs 的一处守卫（+6 −1）、docs/adr/0032-acceptance-truth-presentation-and-cohort-parity.md、docs/architecture/ 新增入口清单、specs/workflowhub-thin-core-card-04-20260919/ 材料；不含任何前端项目或前端组件",
      "conclusion": "non_ui"
    },
    "planned_or_changed_frontend_fact": {
      "fact": "计划改动为 CLI 守卫、ADR、真实入口清单与规则文本；无前端组件新增、修改或删除",
      "conclusion": "non_ui"
    }
  },
  "gate": false
}
```

三份来源结论全部为 `non_ui`，与 `result` 一致，故本事实为**已记录**而非 unknown；真实用户答复为「non_ui — 本卡不涉及页面、交互或前端组件」。本事实**不是门**（`gate: false`）。

## 收敛检查

| 维度 | 用户答案 | 事实或材料引用 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户确认：本卡准绳是质量合格而非流程正确，要让交付效果符合原始需求，而不是靠一堆脚本确认代码绿了 | decision-log.md 的 `## 三轮 talk` 与 `## 状态`（用户逐字答复）；R-001、R-002 | 场景：本卡交付后在真实 task 上核对用户痛点是否真的被解决；数据来源：decision-log.md 的三轮 talk 节与 quality/evidence 的真实 stdout；通过：AC-16 与 AC-21 取得真实命令与可回读输出；失败：只有脚本自证或审查被当作功能验收 |
| 范围 | 用户确认：范围＝验收标准的写法、验收方式走真实入口、单元测试与端到端测试体系化三条，有界不外溢到审查面 | decision-log.md 的 `## 非目标` 与 `## 目标`；R-004、R-006 | 场景：逐一核对本卡改动是否越出这三条面；数据来源：git diff 与 `## 非目标` 清单；通过：改动只落在 tools/cli、docs/adr、docs/architecture 与 specs；失败：触碰 wh-review 审查面、provider、CARD-10 集成验收或删除存量 |
| 方案 | 用户确认：方案照 D-001…D-008 执行；取舍：只把已算出的真实事实接回给人看，不改造校验器，代价是逐条验收链在本卡之后仍判不完整；被拒方案：新增阻断门、引入新依赖、物理隔离 oracle、覆盖率门全部被否；未决项：OPEN-006 跨卡接口冻结顺序与 OPEN-007 两节补写一并移交 build-plan | decision-log.md 的 `## 决定`（D-001…D-008）与 `## 拒绝方案` | 场景：核对 D-001…D-008 是否逐条落地且未新增门；数据来源：`## 决定` 与 `## 审查处置`；通过：8 条决定各有载体与落地动作，且无新增阻断门；失败：出现新增 gate、覆盖被当作门，或自产自判 |
| 验收 | 用户确认：验收按 AC-16…AC-21 执行，其中 AC-17/18/19 因样例 task 不存在，如实记为覆盖限制 | decision-log.md 的 `## 本卡自身的验收标准（AC-16…AC-21）`；AC-16、AC-20、AC-21 | 场景：本卡交付后逐条跑 AC-16…AC-21 的真实入口；数据来源：`## 本卡自身的验收标准（AC-16…AC-21）` 命令列与 quality/evidence 的真实 stdout；通过：AC-16、AC-20、AC-21 取得真实命令、exit 与输出；失败：缺适用产物仍判通过、伪造产物，或只有 GREEN 而无 RED 且无 G-2 豁免披露 |

## 最终确认

**本确认为真实用户答复，非代答**（DSH Web 结构化问答，一次性答复三个问题）：

1. **UI applicability**：用户选择「non_ui — 本卡不涉及页面、交互或前端组件」。据此写出 `## UI applicability`，结果由三份来源推导一致。
2. **AC-17 / AC-18 / AC-19 的样例 task 处置**：用户选择「乙 — 如实记 MISSING + 覆盖限制」。⇒ 这三条**不以伪造样例补齐**，在本卡交付时进「没做到」清单并登记为覆盖限制（承载 D-007）。
3. **make-decision 收口**：用户逐字答复「**确认收口，但是不要推进下一阶段**」。⇒ 8 条 D 的 `status` 由 `proposed` 改为 `confirmed`；**本卡停在 make-decision 阶段末，不进入 build-plan**，直至用户另行指示。

**本确认覆盖的四维**（逐条答复与材料引用见 `## 收敛检查`）：目标＝质量合格而非流程正确；范围＝验收写法 + 真实入口 + 测试体系化，有界不外溢；方案＝D-001…D-008；验收＝AC-16…AC-21，其中 AC-17/18/19 记覆盖限制。

**本确认明确不覆盖**：① 不是对 detail 审查 canonical 性的确认（该审查只能记为 advisory，原因见 `## 审查处置`）；② 不是对 OPEN-006 / OPEN-007 的裁决；③ 不是对 build-plan 阶段产物的确认；④ 不是对逐条验收链现状（仍判不完整）的确认。

**step 10 追加交付后的口径（如实登记）**：本节第 1–3 条的答复发生于材料为 1749 行 / 229,105 B 的版本（sha256 `66cadec22794d126e849222f5a6292c55baabca092256b43b18aa87704af1d8b`）。此后按用户同轮指示（逐字「你自己选吧，这两个都应该做吧」）追加了两项交付与一次更正：`### detail 审查（39 条 findings，通道降级如实记录）` 的 39 条逐条处置表、`## 给 build-plan 的规则草案（step 10 交付）`、以及对本记录内 8 处错引的就地更正（含把 `risks` 完成谓词更正为 `runtime/stage/stage-handlers.mjs:3689`、把 `docs/architecture/complexity-baseline.json` 的预算行更正为 `:58-64`、并证伪了一处「`assertReadback` 只校验 front matter」的错误更正提议）。**这三项均不改变 D-001…D-008 与 AC-16…AC-21 的实质内容，也未新增任何用户未表达的同意**；重新发布确认时 `reply_text` 仍为用户逐字原话，只是把既有答复重新绑定到定稿后的材料版本。截至本次收口 `human_confirmation` 判 `satisfied`——即 make-decision 的确认绑定对追加交付是宽容的；这与 `runtime/task/task-kernel-implementation.mjs:874-875` 存在 `directionOnly` 宽容分支的事实一致（该分支是否为本次判定的确切原因**未逐行验证**），而 build-plan 等其它阶段走 `:883` 的严格相等，见 `## 给 build-plan 的规则草案（step 10 交付）` 的 BP-R03。


## 非目标

- 不移除或改造 wh-review 本身（CARD-06 的范围）。
- 不改 review provider 与审查工具实现（CARD-05 的范围）；本卡只在验收事实层定义「审查不可用不得充当通过」。
- 不执行总体集成验收（CARD-10 的范围）；本卡只定义验收标准的写法与测试资产的落点。
- 不引入生产环境监控告警（文章 L7；本仓没有生产环境）。
- 不重新引入哈希绑定、回执、快照、材料身份校验类机器门禁（SD-17 与母 decision-log OI-013）。
- 不重新引入 `plan.md` 与 `tasks.md` 双写材料形态。
- 不回头恢复旧 `build-spec` 加 `build-plan` 的治理审计项清单（流程对比已证明现流程在验收与测试上更强）。

## 风险与延期交接

### 质量边界

- 本卡的主要风险是把「减阻塞」误做成「掩盖失败」：incomplete 与 G-2 豁免一旦被滥用，就会变成新的绿灯通道。任何 incomplete 与豁免都必须带可机判的失败信号与披露义务。
- 第二风险是 oracle 分离在宿主环境内不可执行；若实测证明做不到物理分离，必须退回「独立上下文加 provenance 记录」并显式披露能力降级，不得默认它是安全的。
- 第三风险是本卡扩边成第二个母任务。若 OI-002 判定扩边，必须同时给出与 CARD-05 和 CARD-10 的硬边界，并在 build-plan 阶段把交付拆成可独立验收的批次。
- 第四风险是跨卡接口冲突：CARD-04 与 CARD-07 共享 make-decision 的验收写入步，且母任务语料里已出现「CARD-07 声明自己是唯一 owner、CARD-04 只消费，而 phase 材料仍写着 OI-016 为 deferred」这类未收敛的权威冲突。接口必须先冻结再并行。
- 本卡自身的验收不得由本卡的实施者自产自判（OI-012）；若无法建立独立判定者，必须在验收材料里显式标 incomplete 而不是声称通过。

### 交付风险（step 8 补齐）

6. **研究回执无法存活到阶段末（结构性、静默）**：六份回执绑定 `snapshot_tree=37f4a565fa42fbbc1773a8d2f436d5930d622784`、`material_scope_revision=revision-58841b1b…`，当前认证值是 `snapshot_tree=3a4f854b6835b147aa62b2bf90e85c635c665ef2`、`material_revision=revision-7884d848…` ⇒ `status` 现在报 `research.status="unavailable"`、`reason="research_record_missing"`、**exit 0**。结构性原因：(a) `snapshot_tree` 覆盖整个 worktree；(b) `material_scope_revision` 在 make-decision 阶段只覆盖 `decision-log.md`——而它正是本阶段自己的产物。**只要 make-decision 在调研之后再写一次 decision-log，调研证据必然失效，且失效是静默降级**（`decision-log.md:1007-1009`）。同一陷阱会在「跑完端到端验收之后又改了代码」时原样重演（`:686`）。

7. **make-decision 阶段提前落了生产代码**：`tools/cli/stage-runtime.mjs` 1 文件 +6 −1（D-002）；build-code 阶段必须为它补测试，且必须覆盖两侧（`decision-log.md:1003`）。

8. **报告内容从哪来**：用户不看 `quality/evidence/handoff/<stage>.md`，说明的交付现场改为聊天，因此「报告内容从哪来」升为新的核心风险（`decision-log.md:831`）。

9. **渲染器的兼容面与形态风险**：① 渲染器要同时吃当前形态与归档形态，兼容面变大；② 「简短的大白话」能否真的由机器渲染（而非人手写）需在 step 7 按模块定清；③ 未被任何测试跑过的入口被点名后会长期挂在说明里（`decision-log.md:807`）。

10. **「测试由独立子代理上下文产出」只能靠 prompt 约束**：`workflows/build-code/skill-deps.yaml:19` 把 host-subagent 定为 diagnostic，不能机械验证（RS-C 回执 `open_items` OI-004）。

11. **换 cohort 不是产品能力**：档案改动是产品之外的途径，全仓没有代码路径能改写既有 `task.json`（`decision-log.md:971`）。

### 节名口径（step 10 更正：step 8 的改名已回退）

step 8 曾把 `## 风险与延期交接` 改名为 `## 风险`，理由是 `runtime/stage/stage-content-contracts.mjs:311-314` 的 `REQUIRED_MAIN_SECTIONS` 要求存在形如 `^##\s+风险\s*$` 的节。step 10 跑官方阶段收口时发现**该改名会让 make-decision 永远无法完成**：

- **活的口子要另一个名字**：`runtime/stage/stage-handlers.mjs:3689`（step 10 现场复核更正；同处 `:3687` 是 `scope`、`:3688` 是 `non_goals`）的 completion subject `risks` 是 `sectionHasContent(currentDecisionLog, "风险与延期交接") || sectionHasContent(currentDecisionLog, "风险、延期与交接")`，而 `sectionHasContent`（`runtime/stage/stage-handlers.mjs:649-657`）要求逐字匹配 `^##[ \t]+<heading>[ \t]*$`。⇒ `## 风险` 被判 `missing`，实测 `completion.predicates.risks.status === "missing"`、`quality_status: "incomplete"`。
- **要求改名的那个是死的**：`REQUIRED_MAIN_SECTIONS` 只在 `runtime/stage/stage-content-contracts.mjs:311`（定义）与 `:2919`（`validateDecisionLogContract` 内）出现，而 `validateDecisionLogContract` 全仓**零生产调用点**（测试调用者只有 `tests/stage-decision-contract.test.mjs`（`:9`、`:20`、`:37`、`:203`、`:213`、`:225`、`:237`、`:256`）；step 10 现场复核更正：原记的第二个调用者 `tests/contract/requirement-convergence-regression.test.mjs` 并不调用 `validateDecisionLogContract`，它只调用 `validateDecisionLogStepUpdateContract`（`:17`、`:726`、`:727`））。

⇒ 本节标题**回退为 `## 风险与延期交接`**，内容一字未删。原 `### 质量边界` 与其五条风险，连同其下 `### 交付风险（step 8 补齐）` 六条，全部保留：前五条是 step 1-7 已记录的质量边界风险，后六条是 step 8 汇总的交付风险，两批内容不重复。

**登记为缺陷（移交 build-plan 规则，承载 D-007 / D-008）**：声明层节名契约与活的完成谓词指名**不同的节名**，而被声明的那一份无人调用。一张严格按声明契约写成的 decision-log，永远无法让 make-decision 达到 `quality_status: complete`。


## 给 build-plan 的规则草案（step 10 交付）

> **本节是什么**：本卡（`workflowhub-thin-core-card-04`）step 10 的交付物之一，供 build-plan 阶段直接使用——build-plan 起草 `spec.md`、`phases/P<n>.md`、`phases/index.md` 时按本节执行，不另造载体、不改 stage 与 gate。
> **来源**：只读起草子代理 `08e3dd42-0d9e-4c92-9254-91df1af903f8`，产出文件 `/tmp/wh-an/step9/build-plan-rules.md`（200 行 / 33948 B）。
> **起草约束（逐字继承）**：零新增依赖、零新增阻断门、必须落在已存在载体上、未提 `plan.md`/`tasks.md` 双写。
> **正文口径**：以下为草案 A/B/C/D 四节的正文原样，只把草案标题层级整体下调两级使其从属于本节（`#`→`###`、`##`→`####`、`###`→`#####`），未改写、未删减、未总结。
> **节尾**：草案自报的 7 项 `MISSING` 与 9 处行号纠正原样保留在草案「附」节内（不重复第二遍）；其后追加本次现场复核产出的 `### 引文更正（step 10 现场复核）` 与 `### step 10 现场新发现（三条）`。

### CARD-04 → build-plan 规则草案（只读起草）

来源：`specs/workflowhub-thin-core-card-04-20260919/decision-log.md`（1749 行）。本草案把 CARD-04 在 make-decision 期间一手抓到的运行时缺陷，转成 build-plan 阶段必须遵守的落点规则。所有 `path:line` 均为本次在 worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919` 现场读取所得；核不实的写 `MISSING` 并在文末列出。本草案不新增任何阻断门、schema、CLI 动词或控制面。

---

#### A. 必须做的规则

##### BP-R01
- **规则编号**：BP-R01
- **规则文本**：build-plan 为材料写入的任何节名类约束，必须能在生产路径上的活谓词里找到读取点；只被零生产调用点常量要求的节名，不得写进材料、更不得要求下游实现。
- **载体**：`runtime/stage/completion-predicates.mjs:87-92`（build-plan 的 6 个 completion subject 表）；活谓词的真实构造 `runtime/stage/stage-handlers.mjs:3959`（`return addCompletion("build-plan", {`）与 `:3971-3977`（`completion_subjects` 块）；节名匹配函数 `runtime/stage/stage-handlers.mjs:649-657`。**为什么不需要新建载体**：这三个位置都是 build-plan 已在跑的生产路径——`:3971-3977` 就在 `runtime/stage/stage-handlers.mjs` 的 build-plan handler 返回体里，`completion-predicates.mjs:87-92` 已是该 stage 的谓词权威表；规则只是要求"引用它们"，不引入新机制。
- **对应缺陷**：主题 1
- **可失败检查**：对 build-plan 材料里每个节名约束反查其读取点。若该约束只存在于 `REQUIRED_MAIN_SECTIONS`（`runtime/stage/stage-content-contracts.mjs:311`）→ 私有 `validateMain`（`:2911`，唯一使用点 `:2919`）→ 私有 `appendixEntries`（`:2931`）→ `validateDecisionLogContract`（`:2970`）这条链上，即未做到。读法：直接读 `runtime/stage/stage-handlers.mjs:3689` 这类活谓词行做对照。
- **失败后果**：只记录。该节名恒判 `missing`，`quality_status` 停在 `incomplete`，不阻断推进。

##### BP-R02
- **规则编号**：BP-R02
- **规则文本**：build-plan 产出的每个 `phases/P<n>.md`，其每个 `## L1` 下的 `### Tnnn — <outcome>` 任务卡必须逐项填写 `validatePostPhaseContract` 的 17 个必填字段，且不得用 `TBD`/`TODO`/`待补充`/`[`/`N/A` 占位。
- **载体**：17 字段清单逐字在 `runtime/stage/stage-content-contracts.mjs:6918-6923`（`:6919-6922` 为 17 项字面量）；占位拒绝在 `:6927`；任务卡存在性在 `:6909`。**为什么不需要新建载体**：`validatePostPhaseContract`（定义 `:6839`）在 post 有生产调用点——`runtime/stage/stage-content-contracts.mjs:6351`（build-plan packet 的 post 分支）、`runtime/stage/stage-handlers.mjs:3843`、`:1941`、`runtime/stage/stage-content-contracts.mjs:6376`、`tools/cli/stage-runtime.mjs:664`（只读 advisory）；且 build-plan 的 post packet 以 `strict_material_contracts: true` 进入校验（`runtime/stage/stage-runner.mjs:3741`）。这 17 字段是既有机器必填，不是本草案新增的门。
- **对应缺陷**：主题 1、主题 5
- **可失败检查**：`phases/P<n>.md` 里任一必填字段为空或为占位串，或 `## L1` 下没有 `### Tnnn` 卡（`:6909` 报 `requires independent ### Tnnn task cards; one-line Tasks is insufficient`）。抛出点在 `runtime/stage/stage-handlers.mjs:3859-3861`。
- **失败后果**：这是本卡唯一的"填不出即不能推进"的既有机器必填（decision-log:1317 的边界声明）。它不是本草案新增的阻断门——门早已存在于既有校验器；其余情形一律只记录。

##### BP-R03
- **规则编号**：BP-R03
- **规则文本**：build-plan 必须按"材料全部定稿 → 发布 `human_confirmation` → 跑阶段收口"的顺序执行；发布确认后不得再写 `spec.md`、`phases/index.md`、`phases/P<n>.md` 的任何一个字节。
- **载体**：`runtime/task/task-kernel-implementation.mjs:840`（`publishHumanConfirmation(stage, input = {}) {`）、`:855`（`schema_version: "human-confirmation.v3"`）、`:861`（`material_revision: revision.revision_id,`）、`:862`（`snapshot_tree: snapshot.tree,`）、`:874-883`（`sameScope`，`:883` 是严格相等分支）；判定侧 `runtime/stage/completion-predicates.mjs:87-92`（`human_confirmation: "confirmation"`）与 `runtime/stage/stage-handlers.mjs:3983`（`...(confirmation ? { human_confirmation: confirmation.facts } : {}),`）。**为什么不需要新建载体**：绑定字段与同一性判定都已在 kernel 内实现，build-plan 的 completion subject 也已接好；规则只约束写入顺序。
- **对应缺陷**：主题 2
- **可失败检查**：`status --action=begin` 投影里 `human_confirmation` 事实变 `missing`。**关键不对称（现场核实）**：宽容分支 `directionOnly`（`:874-875`）只对 `name === "make-decision"` 成立，其退让逻辑 `isStageMaterialOnlySnapshotDelta`（`runtime/task/git-worktree-snapshot.mjs:505`）也只在那里生效；build-plan 一律走 `:883` 的严格相等 ⇒ 定稿后再改任何一个材料字节都会作废确认。
- **失败后果**：只记录，并重跑顺序（重发确认）。不引入新门。

##### BP-R04
- **规则编号**：BP-R04
- **规则文本**：阶段末呈现"未做到"清单时，必须从 `run` 的结果读取 `quality_warnings`、`quality_advisories`、`quality_advisory_fact_refs` 并逐条呈现；不得从 `status` 投影读这三个键（该投影里不存在）。
- **载体**：`runtime/stage/stage-runner.mjs:3020`（`quality_warnings`）、`:3027`（`quality_advisory_fact_refs`）、`:3029`（`quality_advisories`），同 `:3018` 的 `quality_status` 判定；反面证据面 `tools/cli/stage-runtime.mjs:1258-1287`（status 投影组装）。**为什么不需要新建载体**：三个键已经存在于 run 的返回对象里（`:3010` 起的 `Object.freeze({ schema_version: "stage-runtime-result.vnext", … })`），缺的只是读法；而 `status` 投影的键是显式列举的（`tools/cli/stage-runtime.mjs:1268-1286` 共 13 个显式键 + `:1259` 展开的 `progression`），本草案不新增字段。
- **对应缺陷**：主题 3
- **可失败检查**：阶段末报告未逐条列出 run 输出的 warning 文本与条数；或报告引用了 `status.quality_warnings` / `status.quality_advisories`（该键在投影里不存在）。实测口径：本卡 `run` 报 `quality_status: "incomplete"` + 一条 warning `current review result is unavailable for finding disposition`，而 `status` 报 `quality_status: "completed"`、`quality_missing: []`。
- **失败后果**：只记录。warning 不因此被修，也不阻断收口。

##### BP-R05
- **规则编号**：BP-R05
- **规则文本**：任何"复用既有载体"的落点，在 build-plan 材料里必须同时写出该载体的生产调用点 `path:line`；查不到生产调用点的导出须登记为死件，不得作为落地依据，也不得据此要求下游实现。
- **载体**：记录面是 build-plan 的既有材料（`spec.md` 的交接/风险节，或 `docs/adr/0032-acceptance-truth-presentation-and-cohort-parity.md`）。**为什么不需要新建载体**：这是纯记录义务，已由 F-ca4993f5e947（decision-log:1590）确立并要求落在既有记录面；本草案只把它写成可判真假的规则，不引入新文件或新机制。
- **对应缺陷**：主题 4（并覆盖主题 10 的记录面）
- **可失败检查**：在 build-plan 材料里搜以下四个名字，出现且未附生产调用点 `path:line` 即未做到——`verifyStageContentEvidence`（`runtime/evidence/stage-content-evidence.mjs:367`）、`validateDecisionLogContract`（`runtime/stage/stage-content-contracts.mjs:2970`）、`validateDecisionEntry`（`:2907`）、`validateDecisionLogStepUpdateContract`（`:2849`）。本次现场核实：这四者的生产调用点数**均为 0**。
- **失败后果**：只记录。

##### BP-R06
- **规则编号**：BP-R06
- **规则文本**：build-plan 写 AC 形状的强制依据只能是 `validatePostPhaseContract` 与 `validateBuildCodeAcceptanceChain` 两个活校验器；不得把被 post 旁路的三个校验器的字段要求写成对下游的硬要求。
- **载体**：`runtime/stage/stage-content-contracts.mjs:6839`（`validatePostPhaseContract` 定义，post 生产调用点见 BP-R02）与 `:6257`（`validateBuildCodeAcceptanceChain` 定义，唯一调用点 `:6385`，位于 `if (stage === "build-code")`（`:6373`）内，cohort 无关）。**为什么不需要新建载体**：这两个是 post 下真正生效的校验器，已在生产路径上；本规则是"只按它们写"，不需要新机制。
- **对应缺陷**：主题 5
- **可失败检查**：build-plan 材料里出现只在被旁路校验器内部存在的字段要求作为硬要求，即未做到。旁路证据（现场逐点核实）：`validateExecutablePlanTaskMinimum`（定义 `:7618`，入参为 `{ spec, plan, tasks }` 三份 pre 材料）两个调用点 `runtime/stage/stage-handlers.mjs:3853` 与 `runtime/stage/stage-content-contracts.mjs:6360` 都是 `post ? … : <call>`；`validateMaterialOracleContract`（定义 `:4350`）唯一调用点 `runtime/stage/stage-handlers.mjs:3871` 同形；`validateAcceptanceDesignMinimum`（定义 `:4215`）调用点 `:6060`（在 `validateStructuredSpecContracts` 定义 `:6053` 内，其唯一调用处 `:6346` 在 `if (stage === "build-spec")`（`:6345`）内）与 `runtime/stage/stage-handlers.mjs:3767`（build-spec handler）；`validateSpecFailureConditions`（定义 `:6034`，调用点 `:6064`）同属 build-spec。post 拓扑无 build-spec ⇒ 全部不可达。
- **失败后果**：只记录。写了也不生效，但会误导 build-code。

##### BP-R07
- **规则编号**：BP-R07
- **规则文本**：每条逐 AC 结果行必须携带真实 `evidence_refs`（取自 acceptance coverage 里已算好的引用），不得保留空数组。
- **载体**：写死空数组处 `runtime/stage/stage-runner.mjs:3947`（`evidence_refs: [],`，在 `acceptanceChain` 行字面内，map 体 `:3930-3950`）；已算好处 `runtime/stage/stage-handlers.mjs:1696`（`const evidence_refs = current.map(({ reference }) => reference);`）与其既有条件表达式 `:1707`。**为什么不需要新建载体**：两端都在生产路径上，D-003 的决定就是"只把已算好的真实事实接回去"；packet 形状不变，无新字段。
- **对应缺陷**：主题 6
- **可失败检查**：读 build-code 的 packet 或 run 输出，若某 AC 行 `evidence_refs` 为空数组、而同一 AC 在 acceptance coverage 里已有非空引用，即未做到。对照项：同一行字面里 `runtime/stage/stage-runner.mjs:3936-3939`（`source_ids`/`decision_ids`/`fr_ids`/`task_ids` 全为 `[]`）、`:3948`（`review_ref: null`）、`:3949`（`stage_end_ref: null`）也是同类"算好又丢掉"的候选面。
- **失败后果**：只记录。链仍为 `incomplete`，不阻断。

##### BP-R08
- **规则编号**：BP-R08
- **规则文本**：post 下 `task_ids` 结构性不可满足，必须如实登记为覆盖限制；不得为了实现它而新写 `tasks.md`，也不得在材料里声称它已满足。
- **载体**：校验读点 `runtime/stage/stage-content-contracts.mjs:6301`（`for (const id of row.task_ids ?? []) if (!containsMaterialIdentifier(materials.tasks, id)) …`）、其判定函数 `:6214-6218`（`containsMaterialIdentifier`，对空值恒返回 false）、build-code packet materials `runtime/stage/stage-runner.mjs:3954-3961`（只有 `original_requirement`/`decision_log`/`spec`/`phase_index`/`phases`/`implementation` 六个键）、build-plan packet materials `:3728-3733`（只有 `decision_log`/`spec`/`phase_index`/`phases` 四个键）。**为什么不需要新建载体**：事实与拒绝理由都已在既有代码与 D-001（decision-log:1047-1076，明确"不动 `task_ids`"）里；规则只是要求如实登记。
- **对应缺陷**：主题 7
- **可失败检查**：`specs/<task-id>/tasks.md` 在 post 卡片目录下出现，或 build-plan 材料声称 `task_ids` 已满足。
- **失败后果**：只记录。

##### BP-R09
- **规则编号**：BP-R09
- **规则文本**：同一份 `coverage_limits` 在各消费者处按其既定形状写——逐 AC 链行写非空字符串，acceptance 记录写非空文本数组；不得改任一既有校验器，也不得互换两形状。
- **载体**：字符串形 `runtime/stage/stage-content-contracts.mjs:6312`（`for (const field of ["scenario", "actual_outcome", "coverage_limits"]) if (!nonEmptyString(row[field])) …`）；数组形 `runtime/evidence/acceptance-evidence-validator.mjs:73-77`（报 `${label}.summary.${key} must be a non-empty text array`）。**为什么不需要新建载体**：D-004 ① 的决定就是"各写各的合法值，不改任一校验器"；两个形状各有既有的强制点，规则只是要求匹配。
- **对应缺陷**：主题 8
- **可失败检查**：在链行写数组，或在 acceptance 记录里写字符串，即被既有校验器拒绝（`must be a non-empty text array` / `${label}.coverage_limits is required`）。
- **失败后果**：只记录 + 修正为合法形状。不新增门。

##### BP-R10
- **规则编号**：BP-R10
- **规则文本**：必须把 `docs/architecture/complexity-baseline.json` 的 `formal_test_lines` 数字改成与实测口径一致、并写明计数依据，同时同步该文件的内容钉住断言。
- **载体**：`docs/architecture/complexity-baseline.json:59-65`（`"formal_test_lines": {` 在 `:59`；`"actual": 20292` 在 `:60`；`"target": 10000` 在 `:61`；`"limit": 12000` 在 `:62`；`delta_from_target` `:63`；`within_limit` `:64`）；钉住断言 `tests/contract/repository-inventory.test.mjs:173`（读取该文件）与 `:175`（`expect(\`${JSON.stringify(actual, null, 2)}\n\`).toBe(historicalBytes(...))`）。**为什么不需要新建载体**：钉住机制就是那个既有断言——改数字必须同步改它，这正是"既有机制"在起作用；不需要新工具或新门。
- **对应缺陷**：主题 9
- **可失败检查**：baseline 仍写 `"actual": 20292`（`:60`）而决策记录已记实测 76,075 行、超 `limit`（`:62` = 12000）约 6.3 倍；或改了 baseline 但 `repository-inventory.test.mjs` 未同步（该测试会红）。**数字一律取自决策记录已记录的口径（decision-log:920、:933、:1242），不另算一套。**
- **失败后果**：只记录。按 D-007 ③，预算只报告不阻断。

##### BP-R11
- **规则编号**：BP-R11
- **规则文本**：审查记录链三处叠加缺陷与 `importCanonicalReviewResult` 只导不建，只能在 build-plan 材料里登记为 CARD-05 的移交事实（含定位），不得改动 `runtime/review/**` 或 `skills/wh-review/**` 的任何字节。
- **载体**：build-plan 的既有记录面（`spec.md` 的交接/风险节）。**为什么不需要新建载体**："只登记不改代码"本身就以既有材料文件为载体；缺陷的定位点在代码里也已存在，无需新文档。
- **对应缺陷**：主题 10
- **可失败检查**：`git diff --stat` 出现 `runtime/review/**` 或 `skills/wh-review/**` 的改动。可引用的既有定位（现场核实）：`runtime/review/review-record-route.mjs:1177`（`allowHistoricalPartialCoverage: scope !== null && attempt.snapshot_tree !== scope.snapshotTree,`）、`:1180`（throw `"canonical review report binding is invalid"`）、`:1229`（throw `"canonical review pair member binding is invalid"`）、`:1417`（`code: "REVIEW_HISTORY_UNAVAILABLE"`）、`:1637`（参数默认 `allowHistoricalPartialCoverage = false,`）、`:1729`（`&& (result.outcome === "completed" || (allowHistoricalPartialCoverage && result.outcome === "partial"))`）、`:1951`（`importCanonicalReviewResult`）、`:1996`（唯一消费 `provenance.provider_outputs`）、`:2011`（`recordSimpleReviewResult`）。
- **失败后果**：该改动越界，应回退；缺陷本身只记录，不在本卡修。

##### BP-R12
- **规则编号**：BP-R12
- **规则文本**：build-plan 阶段末必须把机器判定的非 pass 事实（`missing`/`inconsistent`/`incomplete`/`failed`/`unavailable`）逐条列在报告顶部，每条带来源（`path:line` 或 fact ref），不得汇总成一句、不得用"通过"覆盖。
- **载体**：事实源 `runtime/stage/stage-runner.mjs:3018`（`quality_status` 判定）与 `:3020-3029`（`quality_warnings` / advisories）；既有渲染器 `runtime/stage/stage-handoff.mjs:315`（`renderStageHandoff`）、`:477`（`publishStageHandoff`）、`:203-205`（`stageHandoffRef` 返回 `quality/evidence/handoff/${stage}.md`）、`:379`（`assertReadback`）、`:11-16`（`STAGE_HANDOFF_STAGES`，含 `build-code`；**注：现场读该常量含 `make-decision`/`build-spec`/`build-plan`/`build-code` 四项**）。**为什么不需要新建载体**：机器事实与渲染器都已存在；本规则只约束呈现方式，不新增字段、文件或门。
- **对应缺陷**：主题 3、6、7（承载 D-004 ② 与 D-005 甲 的结论）
- **可失败检查**：报告里非 pass 事实被合并成一条，或缺来源定位；或报告只写 `quality_status: completed` 而未带 `incomplete` 的 warning。
- **失败后果**：只记录、如实呈现，不阻断推进。

---

#### B. 不得做的事

| # | 边界 | 依据（现场核实） |
|---|---|---|
| B-01 | 不得新增任何依赖 | D-007 ①（decision-log:1228-1268）；只用已钉住的 vitest 2.1.9 现有原语 |
| B-02 | 不得新增阻断门 | `CONSTITUTION.md:83-87`（"辅助事实缺失、review provider 不可用、历史记录缺失…不得单独阻止正常工作"；"不得另造计数器、schema、运行时 gate 或测试框架"）；decision-log:1698；D-007 ③"覆盖只诊断、不过门" |
| B-03 | 不得触碰 `runtime/review/**` 与 `skills/wh-review/**`、不得改 review provider | 非目标第 2 条（decision-log:1692-1700）；CARD-05 领地 |
| B-04 | 不得做 CARD-10 的总集成验收与收口 | 非目标第 3 条；decision-log:1696 |
| B-05 | 不得删除存量（含 `specs/archive/**`、`docs/research/**`、旧 task/receipt/review/snapshot） | 非目标第 1 条；CARD-06 领地 |
| B-06 | 不得重新引入哈希绑定、回执、快照、材料同一性校验门 | 非目标第 5 条（SD-17 与父 decision-log OI-013） |
| B-07 | 不得恢复 `plan.md` + `tasks.md` 双写材料形态 | 非目标第 6 条；D-002（decision-log:1078-1107）；`runtime/stage/stage-runner.mjs:3728-3733` 已是 post 四材料 |
| B-08 | 不得新建 schema / CLI 动词 / 控制面 | AGENTS.md「新机制或新控制面必须先登记…没有当前消费者的重复控制面不新增」；decision-log:1698 |
| B-09 | 不得恢复旧 `build-spec` + `build-plan` 治理审计清单 | 非目标第 7 条（decision-log:1700） |
| B-10 | 不得引入生产监控/告警 | 非目标第 4 条 |
| B-11 | 不得把 review 不可用改写成质量通过（`unavailable` ≠ pass） | 非目标第 2 条；decision-log:1641 的 `quality_status: incomplete` 口径 |
| B-12 | 本卡验收不得自产自判 | OI-012（decision-log:1712-1714）：无独立裁决来源时标 `incomplete`，不得声称通过 |

---

#### C. 与既有校验器的关系

覆盖 A 节涉及的缺陷主题 1、4、5、7、8、9 的每个校验器/常量。

| # | 校验器 / 常量 | 是否强制（有生产调用点） | 调用点 `path:line` | post 下是否可达 | 本卡如何对待 |
|---|---|---|---|---|---|
| C-01 | `REQUIRED_MAIN_SECTIONS`（常量，16 节名，含 `"风险"`） | **否** | 定义 `runtime/stage/stage-content-contracts.mjs:311`（字面量 `:312-313`）；唯一使用 `:2919`（私有 `validateMain` `:2911` 内） | **不可达**（唯一入口 C-02 无生产调用点） | 不作为落地依据；登记为死件 |
| C-02 | `validateDecisionLogContract` | **否** | 定义 `runtime/stage/stage-content-contracts.mjs:2970`；生产调用点：无（仅 `tests/stage-decision-contract.test.mjs:9,20,37,203,213,225,237,256`） | **不可达** | 登记为死件；不得据此要求下游实现 |
| C-03 | `sectionHasContent` + `risks` 完成谓词 | **是** | 函数 `runtime/stage/stage-handlers.mjs:649-657`（匹配字面量 `:652`：`^##[ \t]+${escaped}[ \t]*$`，`"i"`）；活谓词 `:3689` | **可达**（make-decision 阶段） | 作为唯一的节名依据；材料节名以它为准 |
| C-04 | `verifyStageContentEvidence` | **否** | 定义 `runtime/evidence/stage-content-evidence.mjs:367`；生产调用点：无（仅 `tests/contract/four-material-non-gate-contract.test.mjs:9,131,174,179,213,224,236,243,248,253,258,264,271,308,315,320`） | **不可达** | 登记为死件 |
| C-05 | `validateDecisionEntry` | **否** | 定义 `runtime/stage/stage-content-contracts.mjs:2907`；内部 `:2926`（`validateMain` 内）、`:2946`（`appendixEntries` 内），两者均属死子树；生产调用点：无 | **不可达** | 登记为死件 |
| C-06 | `validateDecisionLogStepUpdateContract` | **否** | 定义 `runtime/stage/stage-content-contracts.mjs:2849`；生产调用点：无（仅 `tests/contract/requirement-convergence-regression.test.mjs:17,726,727`、`tests/stage-decision-contract.test.mjs:13,24,41,387,394,404,409`） | **不可达** | 登记为死件 |
| C-07 | `validateExecutablePlanTaskMinimum` | 仅 pre 强制 | 定义 `runtime/stage/stage-content-contracts.mjs:7618`（入参 `{ spec, plan, tasks }`）；调用点 `runtime/stage/stage-handlers.mjs:3853` 与 `runtime/stage/stage-content-contracts.mjs:6360`，两处均 `post ? … : <call>` | **不可达**（post 走 then 分支） | 不作为 AC 形状依据 |
| C-08 | `validateMaterialOracleContract` | 仅 pre 强制 | 定义 `runtime/stage/stage-content-contracts.mjs:4350`；调用点 `runtime/stage/stage-handlers.mjs:3871`（`post ? structural : …`） | **不可达** | 不作为 AC 形状依据 |
| C-09 | `validateAcceptanceDesignMinimum` | 仅 build-spec | 定义 `runtime/stage/stage-content-contracts.mjs:4215`；调用点 `:6060`（在 `validateStructuredSpecContracts` 定义 `:6053` 内；其唯一调用处 `:6346` 位于 `if (stage === "build-spec")`（`:6345`）内）与 `runtime/stage/stage-handlers.mjs:3767`（build-spec handler） | **不可达**（post 拓扑无 build-spec） | 不作为 AC 形状依据 |
| C-10 | `validateSpecFailureConditions` | 仅 build-spec | 定义 `runtime/stage/stage-content-contracts.mjs:6034`；调用点 `:6064` | **不可达** | 不作为 AC 形状依据 |
| C-11 | **`validatePostPhaseContract`** | **是** | 定义 `runtime/stage/stage-content-contracts.mjs:6839`；生产调用点 `runtime/stage/stage-handlers.mjs:1941`、`:3843`、`runtime/stage/stage-content-contracts.mjs:6351`、`:6376`、`tools/cli/stage-runtime.mjs:664`（只读 advisory） | **可达（唯一活依据）** | **本草案核心依据**：17 个必填字段 `:6918-6923`；不得改 |
| C-12 | **`validateBuildCodeAcceptanceChain`** | **是**（仅 build-code） | 定义 `runtime/stage/stage-content-contracts.mjs:6257`；唯一调用点 `:6385`（在 `if (stage === "build-code")` `:6373` 内） | **可达**（build-code；cohort 无关） | 作为逐 AC 链的既有事实来源；不得改 |
| C-13 | `validateStageMaterialContracts`（链的入口） | 有条件强制 | 定义 `runtime/stage/stage-content-contracts.mjs:6328`；唯一调用点 `:6476`，被 `if (strict_material_contracts) {`（`:6475`）包住 | **可达**；开关在 post 生产路径置 true：`runtime/stage/stage-runner.mjs:3741`（build-plan）、`:3971`（build-code）、`:532` | 说明"链是强制的但有开关"；不得改 |
| C-14 | `containsMaterialIdentifier` | **是** | 定义 `runtime/stage/stage-content-contracts.mjs:6214-6218`；被 `:6298-6301` 调用 | **可达** | 用于判定 `task_ids` 结构性不可满足 |
| C-15 | build-code packet `materials`（无 `tasks` 键） | 事实面 | `runtime/stage/stage-runner.mjs:3954-3961` | 可达 | 登记结构性不可满足（BP-R08） |
| C-16 | build-plan packet `materials`（4 键） | 事实面 | `runtime/stage/stage-runner.mjs:3728-3733` | 可达 | build-plan 材料不得承诺 `task_ids` |
| C-17 | 逐 AC 链行的 `coverage_limits`（字符串形） | **是** | `runtime/stage/stage-content-contracts.mjs:6312` | **可达** | 链行写非空字符串 |
| C-18 | `validateAcceptanceEvidence`（数组形） | **是** | 定义 `runtime/evidence/acceptance-evidence-validator.mjs:26`；数组形状 `:73-77`；生产调用点 `runtime/evidence/freshness.mjs:56`、`:710`、`runtime/evidence/canonical-receipt-writer.mjs:687`、`runtime/review/review-record-route.mjs:151`、`tools/cli/stage-runtime.mjs:408`、`core/task-close.mjs:334`、`:649`、`skills/wh-review/scripts/ac-evidence-summary.mjs:153` | **可达** | acceptance 记录写非空文本数组 |
| C-19 | `validateVerifyLeaves`（数组形） | **否** | 定义 `runtime/evidence/quality-store.mjs:152`；数组形状 `:169-172`；生产调用点：无（仅 `tests/deferred-acceptance-semantics.test.mjs:42`、`tests/verify-code-facts.test.mjs:78,79,80,96,110,114,125,139`）；`tools/cli/produce-final-current-snapshot.mjs:491-494` 将该模块标为 `audit_only` | **不可达** | 登记为死件；不得据此要求下游 |
| C-20 | `complexity-baseline.json` 的 `formal_test_lines` 数字 | **是**（被内容钉住） | 值 `docs/architecture/complexity-baseline.json:59-65`（`actual` `:60`、`target` `:61`、`limit` `:62`） | N/A（非 stage 路径） | 按决策记录口径修正（BP-R10） |
| C-21 | `repository-inventory.test.mjs` 内容钉住断言 | **是** | 读取 `tests/contract/repository-inventory.test.mjs:173`；钉住 `:175` | N/A（测试面） | 改数字须同步更新此断言 |
| C-22 | `validateStageSpecAnalyzeProfile`（C-11/C-12/C-13 的调用入口） | **是** | 定义 `runtime/stage/stage-content-contracts.mjs:6395`；生产调用点 `runtime/stage/stage-runner.mjs:3738`（build-plan）、`:3968`（build-code） | **可达** | 说明 C-11…C-13 的实际入口；不得改 |

---

#### D. 已知无法在 build-plan 解决、只能记录的事项

| # | 事项 | 为什么只能在 build-plan 之外解决 / 依据 |
|---|---|---|
| D-01 | 逐 AC 链的 `task_ids` 结构性不可满足：校验读 `packet.materials.tasks`（`runtime/stage/stage-content-contracts.mjs:6301`），而 build-code packet materials（`runtime/stage/stage-runner.mjs:3954-3961`）与 build-plan packet materials（`:3728-3733`）都没有该键；post 不产 `tasks.md`（D-002）。 | 满足它需要恢复 `plan.md`+`tasks.md` 双写，已被非目标第 6 条禁止；D-001 明确"不动 `task_ids`"。⇒ 链在本卡之后仍为 `incomplete`，如实登记。 |
| D-02 | 链行的 `review_ref` 没有载体：`packet.evidence` 里没有 review 条目，唯一生产者在 `runtime/review/stage-review-disposition.mjs`。 | 属 CARD-05 领地（B-03）。所有者与接线方式由 build-plan 与 CARD-05 的接口冻结决定（OPEN-006）。 |
| D-03 | 审查记录链三处叠加缺陷（`runtime/review/review-record-route.mjs:1177`/`:1180`/`:1229`/`:1417`）与 `importCanonicalReviewResult`（`:1951`/`:1996`/`:2011`）只导不建。 | CARD-05 领地。另：决策记录自记"三个子条件里哪一条触发未确定"⇒ 根因判定本身也是 MISSING。 |
| D-04 | `quality_warnings` / `quality_advisories` / `quality_advisory_fact_refs` 没有 `status` 回读面（缺陷 3）。 | 补投影字段等于新增控制面字段（B-08）；只能靠读 run 输出与 `quality/facts/`。 |
| D-05 | make-decision 的节名缺陷本身（`REQUIRED_MAIN_SECTIONS` 要 `## 风险`，活谓词要 `## 风险与延期交接`）不在本卡修。 | 修它要动 `runtime/stage/stage-content-contracts.mjs` 的声明层，且改名已被 step 10 回退；本卡只登记（decision-log:1726-1735）。 |
| D-06 | AC-17 / AC-18 / AC-19 缺样本任务（权限模式切换、RED→GREEN 样本、纯文档豁免样本）。 | 用户已裁决"乙 — 如实记 MISSING + 覆盖限制"（decision-log:1679-1689）⇒ 进"未做到"清单，不得补造样本。 |
| D-07 | OPEN-006：与 CARD-05 / CARD-07 / CARD-10 的接口冻结顺序未定（`review_ref` 明确留给 CARD-05）。 | 跨卡仲裁，非 build-plan 单方可决（decision-log:1747）。 |
| D-08 | OPEN-007：`## UI applicability` 与 `## 收敛检查` 节仍需真实用户回复后才能写。 | 需人回复，不能用代理作答（decision-log:1748）。本卡已记 `result: "non_ui"`、`gate: false`。 |
| D-09 | `deferred` 是否进入"未做到"清单：决策记录 `:865` 列了它，冻结版 `:874` 没列。 | 记录内部口径不一致；本草案按冻结版（不含 `deferred`）。 |
| D-10 | cohort 不可复现：card-04 的 `activation_cohort` 是 `task.json` 带外编辑的结果；`tools/cli/task-bootstrap.mjs:45-60` 只**观测** `<storageRoot>/activation/card-01.json`（`:48` 缺失 ⇒ `pre`，`:59` 有效 ⇒ `post`），无任何 CLI 开关。 | 改 cohort 不是产品能力（decision-log:1712-1724 交付风险 11）⇒ 只记录。 |
| D-11 | G-2 豁免：`tools/cli/stage-runtime.mjs` +6 −1 无 RED 证据（make-decision 无测试面，`tools/cli/stage-runtime.mjs:1037` 的 `preflight` 只接受 `build-code`/`verify-code`）。 | 释放条件是 build-code 补两条回归测试，不是 build-plan 的动作；build-plan 只登记该豁免与风险。 |
| D-12 | 决策记录自身的部分行号/断言与现场读不一致（见文末清单），build-plan 引用时须以现场读为准。 | 记录已冻结，不在本卡回改。 |
| D-13 | `runtime/stage/stage-handlers.mjs:3877` 内置的诚实降级声明逐字为 `if (post) missingItems.push("prewritten target RED evidence is not authenticated by the post build-plan handler; Phase command/oracle text is only a declaration");` | post build-plan 无法认证预写 RED 证据；只能如实呈现，不新增门。 |

---

#### 附：未能核实（MISSING）与现场读数不一致清单

**未能核实、标 MISSING：**
1. `runtime/review/review-record-route.mjs` 的 `:1151`、`:1198-1206`、`:1210-1246`、`:1776`、`:1787`、`:1791`、`:1964-1966` —— 决策记录引用过，本次未逐行读，本草案不引用。
2. `runtime/review/schemas/ac-evidence-summary.schema.json:29,42` 的 `required` + `minItems:1` —— 未读。
3. 决策记录称"链每行要求 15 样东西（`:6276-6323`）"—— 现场枚举出 ≥20 项必填 + 2 项跳行约束，**"15 样"无法复现**；本草案按现场枚举写入。
4. 决策记录称被旁路校验器内部含 `e2e_scope` 四值、四段式 AC 卡等具体字段要求 —— 本次只核实了这三个函数的签名、入参与调用点（`post ? … : …`），其内部字段清单未逐字核实。
5. 决策记录称 `runtime/stage/stage-handoff.mjs:379` 的 `assertReadback` "强制 13 个有序标题" —— 现场读为只校验 front matter 以 `---` 开头且含 `schema:`；"13 个有序标题"未核实。
6. `D-006` 的真实入口库存文件（D-006 决定要新建在 `docs/architecture/` 下的独立文档）尚未生成，文件名/结构未定 ⇒ MISSING。
7. D-007 的**规则正文**本身（decision-log:649 说规则是本卡交付物、"step 5 后定稿"）在决策记录里找不到定稿文本 ⇒ MISSING，owner = build-plan。

**与任务简报所给数字/行号不一致（均为现场读为准）：**

| 简报给的 | 现场读为 |
|---|---|
| `runtime/stage/stage-handlers.mjs:3688` 的 `risks` subject | **`:3689`**；`:3688` 是 `non_goals`，`:3687` 是 `scope` |
| 第 6 条："记录为 `:3948` 与 `:1693`" | `evidence_refs: []` 在 **`runtime/stage/stage-runner.mjs:3947`**（`:3948` 是 `review_ref: null`）；已算好的引用在 **`runtime/stage/stage-handlers.mjs:1696`**（记录里的 `:3947`/`:1696` 才对） |
| `docs/architecture/complexity-baseline.json:61-68` | `"budgets"` `:58`、`"formal_test_lines"` `:59`、`actual` **`:60`**、`target` `:61`、`limit` `:62`、`delta_from_target` `:63`、`within_limit` `:64`（`:66-70` 才是 production_lines） |
| `validateAcceptanceDesignMinimum` "唯一路径 `:6053` → `:6346`" | 定义 `:4215`；直接调用点 **`:6060`**（在 `validateStructuredSpecContracts` 定义 `:6053` 内；`:6345-6346` 是后者被 `if (stage === "build-spec")` 调用的位置），**另有** `runtime/stage/stage-handlers.mjs:3767`（build-spec handler）——简报未列 |
| 链行 `coverage_limits` "`:6302-6312`" | 字符串要求逐字在 **`:6312`**（`:6302` 是 `file_symbol`） |
| `status` "只有 20 个键" | topology 未解析时 **20 键**（`progression` 7 键 + 显式 13 键）；解析成功时 **23 键**（多 `task_type`/`activation_cohort`/`topology`，`tools/cli/stage-runtime.mjs:1263-1267`）。两情形都无 warning/advisory 键 |
| `REQUIRED_MAIN_SECTIONS` 在 `:311` 与 `:2919` | ✅ 一致。补充：`:2919` 在**私有** `validateMain`（`:2911`）内，其唯一调用者是 `validateDecisionLogContract`（`:2973`） |
| 决策记录称 `validateDecisionLogContract` 的唯二调用者含 `tests/contract/requirement-convergence-regression.test.mjs` | **不准确**：该文件只调用 `validateDecisionLogStepUpdateContract`，从不出现 `validateDecisionLogContract` |
| 决策记录称 `run` 的 stdout 即完整 stage-result JSON，引 `tools/cli/stage-runtime.mjs:1508-1527` | **该行段现场读为"拒绝退役输入"的校验块**（`:1509` 拒绝 `receipts.stage_outcomes`、`:1511-1520` 处理 `research_report`、`:1523-1527` 注释），不是 stdout 产出点 ⇒ 该引用不予采用；本草案改以 `runtime/stage/stage-runner.mjs:3010-3029` 为 warning 字段载体 |

### 引文更正（step 10 现场复核）

更正原则：逐处先限定到本文件 grep 定位，再打开被引用的源文件逐行核实；**只改错的数字/路径，保留原记录的行文与出处标注**；逐字引文不作原地改写，改为在该处追加 `（step 10 现场复核更正：…）` 括注；核不实者标 `MISSING`，不照抄简报。

| # | 原记录 | 现场读为 | 位置 | 核实方式 |
|---|---|---|---|---|
| 1 | `runtime/stage/stage-handlers.mjs:3688` 的 completion subject `risks` | `:3689`；同处 `:3687` 是 `scope`、`:3688` 是 `non_goals` | 就地更正 1 处（唯一出现处）：`decision-log.md:1811` | 现场读 `runtime/stage/stage-handlers.mjs:3685-3692`；限定本文件 grep `3688` → 仅 1 命中 |
| 2 | `evidence_refs: []` 记为 `runtime/stage/stage-runner.mjs:3948`；已算好该值的记为 `runtime/stage/stage-handlers.mjs:1693` | `:3947`（`:3948` 是 `review_ref: null`）；已算好的在 `runtime/stage/stage-handlers.mjs:1696` | **未在文件中定位到该表述**（本文件各处已经是 `:3947`/`:1696`，见 `decision-log.md:919`、`decision-log.md:932`、`decision-log.md:1051`、`decision-log.md:1053`、`decision-log.md:1113`）；未改任何正文 | 现场读 `runtime/stage/stage-runner.mjs:3944-3952`（`:3946` `coverage_limits`、`:3947` `evidence_refs: []`、`:3948` `review_ref: null`）与 `runtime/stage/stage-handlers.mjs:1693-1700`（`:1695` `statuses`、`:1696` `evidence_refs`）；限定本文件 grep `stage-runner.mjs:3948`、`stage-handlers.mjs:1693` → 各 0 命中 |
| 3 | `docs/architecture/complexity-baseline.json:61-68` | `:58-64`：`"budgets"` `:58`、`"formal_test_lines"` `:59`、`actual` `:60`（=20292）、`target` `:61`（=10000）、`limit` `:62`（=12000）、delta `:63`、`within_limit` `:64` | 就地更正 3 处：`decision-log.md:920`、`decision-log.md:1232`、`decision-log.md:1242`；追加括注 2 处（逐字引文，原文保留）：`decision-log.md:933`、`decision-log.md:1234`（共 5 处，即全部出现处） | 现场读 `docs/architecture/complexity-baseline.json:55-70`；限定本文件 grep `complexity-baseline.json:61-68` → 5 命中，逐处处理 |
| 4 | `validateAcceptanceDesignMinimum` 唯一路径 `:6053` → 唯一调用点 `:6346` | 定义 `runtime/stage/stage-content-contracts.mjs:4215`；直接调用点 `:6060`（在 `validateStructuredSpecContracts` 定义 `:6053` 内）；`if (stage === "build-spec")` 的调用位置 `:6345-6346`；**另有第二个调用点 `runtime/stage/stage-handlers.mjs:3767`** | 就地更正：`decision-log.md:1595`（唯一出现处） | 现场读 `runtime/stage/stage-content-contracts.mjs:4215`、`:6053-6064`、`:6345-6346` 与 `runtime/stage/stage-handlers.mjs:3767` |
| 5 | 链行 `coverage_limits` 的字符串要求在 `runtime/stage/stage-content-contracts.mjs:6302-6312` | 逐字在 `:6312`（`:6302` 是 `file_symbol`） | 就地更正 3 处（全部出现处）：`decision-log.md:920`、`decision-log.md:1061`、`decision-log.md:1145` | 现场读 `runtime/stage/stage-content-contracts.mjs:6296-6316`（`:6302` `file_symbol is required`、`:6312` `["scenario", "actual_outcome", "coverage_limits"]`）；限定本文件 grep `6302-6312` → 3 命中 |
| 6 | `status` 投影「只有 20 个键」 | 拓扑未解析时 20 键；**解析成功时 23 键**（多 `task_type`/`activation_cohort`/`topology`，见 `tools/cli/stage-runtime.mjs:1263-1267`）；两种情形**都**没有 warning/advisory 类键 | 就地更正（追加括注）：`decision-log.md:1722`（该处是 20 键枚举的唯一载体；限定本文件 grep `20 个键`/`20 键` → 0 命中） | 现场读 `tools/cli/stage-runtime.mjs:1255-1290` |
| 7 | 「`validateDecisionLogContract` 的唯二调用者是 `tests/stage-decision-contract.test.mjs` 与 `tests/contract/requirement-convergence-regression.test.mjs`」 | **后一句不准**：`tests/contract/requirement-convergence-regression.test.mjs` 只调用 `validateDecisionLogStepUpdateContract`（`:17`、`:726`、`:727`），不调用 `validateDecisionLogContract`；后者在测试里只由 `tests/stage-decision-contract.test.mjs` 调用（`:9`、`:20`、`:37`、`:203`、`:213`、`:225`、`:237`、`:256`） | 就地更正：`decision-log.md:1812`（限本文件 grep `requirement-convergence-regression` → 仅此 1 命中） | 限定文件 grep 两个测试文件 + 现场读两边 import/调用点 |
| 8 | 把 `tools/cli/stage-runtime.mjs:1508-1527` 当作「run 的 stdout 即完整 stage-result JSON」的出处 | 该行段是**拒绝退役输入的校验块**（`:1509` 拒绝 `receipts.stage_outcomes`、`:1511-1520` 处理 `research_report`），**不是 stdout 产出点**；stage 结果里 warning/advisory 的真实载体是 `runtime/stage/stage-runner.mjs:3010-3029`（`:3019-3025` `quality_warnings`、`:3027` `quality_advisory_fact_refs`、`:3029` `quality_advisories`） | 就地更正 3 处（全部出现处）：`decision-log.md:921`、`decision-log.md:1060`、`decision-log.md:1120` | 现场读 `tools/cli/stage-runtime.mjs:1505-1530` 与 `runtime/stage/stage-runner.mjs:3009-3035`；限定本文件 grep `1508-1527` → 3 命中 |
| 9 | 「`runtime/stage/stage-handoff.mjs:379` 的 `assertReadback` 强制 13 个有序标题」 | **MISSING（未获现场支持，正文未改）**：`assertReadback`（定义 `:379`）在 `:380` 校验 front matter 的 `---` 与 `schema:`，**并且在 `:387-390` 强制 13 个有序编号标题**——`headings.length !== SECTION_TITLES.length \|\| headings.some(([number, title], index) => number !== index + 1 \|\| title !== SECTION_TITLES[index])`，标题表 `:25-38` 恰为 13 条。原记录与现场一致（执行点在 `:387-390` 而非 `:379`），简报所称「只校验 front matter、不校验标题数量与顺序」在现场核不实 ⇒ 不改 | 未更正（正文保留）：`decision-log.md:816`、`decision-log.md:1173` | 现场读 `runtime/stage/stage-handoff.mjs:25-38`、`:379-390`；限定本文件 grep `assertReadback`、`13 个有序标题` → 各 2 命中 |

小结：9 处线索中 **7 处已就地更正**（线索 1、3、4、5、6、7、8，共触及 14 行），**1 处未在文件中定位到**（线索 2，本文件早已是更正后的 `:3947`/`:1696`），**1 处现场核不实、标 `MISSING` 且正文未改**（线索 9）。

### step 10 现场新发现（三条）

1. **AC 链是「强制但有开关」**：`validateStageMaterialContracts`（定义 `runtime/stage/stage-content-contracts.mjs:6328`）的唯一调用点是 `:6476`，被 `if (strict_material_contracts)`（`:6475`）包住；post 在 `runtime/stage/stage-runner.mjs:3741`（build-plan）与 `:3971`（build-code）传 `strict_material_contracts: true`，默认 false 在 `runtime/stage/stage-content-contracts.mjs:6395`（`validateStageSpecAnalyzeProfile` 的形参默认值）。
2. **`validateAcceptanceEvidence` 是活的，`validateVerifyLeaves` 是死件**：`validateAcceptanceEvidence`（定义 `runtime/evidence/acceptance-evidence-validator.mjs:26`，数组形在 `:73-77`）有 8 处生产调用点——`runtime/evidence/freshness.mjs:56`、`runtime/evidence/freshness.mjs:710`、`runtime/evidence/canonical-receipt-writer.mjs:687`、`runtime/review/review-record-route.mjs:151`、`tools/cli/stage-runtime.mjs:408`、`core/task-close.mjs:334`、`core/task-close.mjs:649`、`skills/wh-review/scripts/ac-evidence-summary.mjs:153`；`validateVerifyLeaves`（定义 `runtime/evidence/quality-store.mjs:152`，数组形在 `:169-172`）只有测试调用（`tests/deferred-acceptance-semantics.test.mjs`、`tests/verify-code-facts.test.mjs`、`tests/requirements-completeness-audit-acceptance.test.mjs`），且 `tools/cli/produce-final-current-snapshot.mjs:491-494` 把 `runtime/evidence/quality-store.mjs` 标为 `audit_only`。
3. **`publishHumanConfirmation` 的宽容分支只对 make-decision 成立**：`runtime/task/task-kernel-implementation.mjs:840` 的 `publishHumanConfirmation` 中，`directionOnly`（`:874-875`，条件 `name === "make-decision" && (subjectRef === null || subjectRef === `specs/${task.identity.taskId}/decision-log.md`)`）是唯一的宽容分支；build-plan 等其它 stage 一律走 `:883` 的严格相等 `value.material_revision === revision.revision_id && value.snapshot_tree === snapshot.tree` ⇒ 材料定稿后任何字节变化都作废确认。

## 未决项

| ID | 未决项 | 阻塞谁 | 状态与结论 |
| --- | --- | --- | --- |
| OPEN-001 | 本卡交付边界（窄卡面还是体系级） | OI-002、build-plan 的全部 phase 划分 | **已收敛**：卡面四项 + 测试资产落点/命名/规模规则 + 覆盖率口径 + 入口登记规则 + AC→阶段末报告翻译契约（step 5 outline-talk 第 1 批 Q1–Q2） |
| OPEN-002 | 「完整单测加端到端测试」的可度量目标值与分摊方式 | OI-003、OI-009、OI-010 | **已收敛**：不设统一预算门；覆盖率只作诊断；预算只报不拦（step 5 Q2–Q3、step 7 M2 甲） |
| OPEN-003 | oracle 分离的可行形态 | OI-005 | **已收敛**：不新增校验器；由机器事实直接呈现（step 5 Q4 乙、step 7 M1 甲） |
| OPEN-004 | 覆盖率是否纳入以及是否挂 ADR 0027 | OI-009 | **已收敛**：覆盖率作诊断，不作为门；ADR-0032 已替代该挂载点 |
| OPEN-005 | 失败面清单与阻断点 | OI-016、OI-011 | **已收敛**：缺事实只记录、印在报告最前，不阻断推进（step 5 Q4、`CONSTITUTION.md:85`） |
| OPEN-006 | 与 CARD-05、CARD-07、CARD-10 的接口冻结顺序 | OI-017、跨卡接口 | **仍开放** → 移交 build-plan（`review_ref` 已明确留给 CARD-05） |
| OPEN-007 | `## UI applicability` 与 `## 收敛检查` 的补写 | 本文件的 stage 完整性 | **仍开放** → step 5 之后补写（须有真实用户答复，不得代答） |
| OPEN-008 | cohort 分叉放开后 pre 卡的材料形态缺口 | step 7 M1 甲 的边界 | **已被取代**：用户裁定今后不再做 pre 设计、card-04 本身切为 post（见上节逐字原话）；pre 形态退出设计面，本项关闭 |

## make-decision 增量再进入：项目级质量闭环（草案，待最终确认）

> 本节为 2026-09-23 后续用户要求返回 make-decision 的**新方向草案**；上文 D-001…D-008 与历史 `## 最终确认` 原样保留为当时事实，**不构成本节批准**。本节决定只有经新的真实确认及相应发布后才供 build-plan 改写使用。CARD-05 现有进行中的工作不得因本节被要求新增改动；本卡补齐六项结果，重叠部分待 CARD-05 落地后以其真实交付为输入再界定最小差量。不承诺已经实现。

### 本轮原始补充与现状

U-6（m02822，用户逐字六项，保留原有编号、阶段与范围，以下不以决策摘要代替）：

> 1：在build-plan阶段，spec和phase中，需要结合原始需求，生成测试用例和验收标准。要很好的结合需求、变更和业务知识。保证测试用例未来能通用，能进行功能测试和回归测试；
>
> 2：在build-code阶段，需要基于实现好的代码，执行测试与效果评测。包括单元测试、代码测试、接口测试、UI实机测试；
>
> 3：在build-code阶段，需要基于测试过程，保留可复核的证据，对照验收标准，判定结构和风险；
>
> 4：测试有任何问题，需要有完善的修复、重新验证、测试用例和证据更新机制。
>
> 5：在build-plan阶段就需要判断每个task需要有哪些单元测试、代码测试、接口测试？每个phase需要有哪些单元测试、代码测试、接口测试、UI实机测试？以及分别需要用什么技能进行测试？要保留什么样的结果？测试通过的标准是怎样？
>
> 6：verify-code阶段结束后，需要进行需求和测试的语义判断、外部依赖判断、低置信度判断和高风险判断。并且给出人工验收的标准和流程。

这里“结构和风险”沿用用户原词，不擅自把“结构”改写成“结果”；后续规划必须同时说明实际测试结果如何对照 AC 判断，以及结构/风险如何判断。UI 实机的适用性仍依交付面判定，不能把非 UI 项目伪造成已通过 UI 测试。

| provisional_source_id | 来源与本轮答复/诉求（逐字或概述分别注明） | 方向后果 |
| --- | --- | --- |
| R-009 | m02822 的 U-6 六项逐字原文在上方，本格仅列检索索引：build-plan 用例与验收、build-code 测试与效果、证据对照 AC 判断结构和风险、任何问题的修复/复验/用例及证据更新、逐 Task 与逐 Phase 的测试/技能/结果/通过标准、verify-code 后的语义/依赖/置信度/风险/人工验收。 | 必须逐项给出适用性、真实执行证据、未覆盖披露及责任，不把技能文字视为执行事实。 |
| R-010 | 用户本轮要求（逐字，宿主当前消息）：「好的，基于这些判断回到make-decision把，看看需要新增哪些决策和调研。make-decision后，再基于更新后的decision-log来更新spec和phase」；随后 `quality-scope` 结构化答复（宿主结构化答复 m02962，逐字）：「全部由card-04实现，card-05已经快开发完了，我不想新增任何改动」 | 改写旧跨卡让渡的**本卡完成责任**；不反向修改 CARD-05，等实际落地后只补 CARD-04 差量。 |
| R-011 | 本轮 `case-basis` 结构化答复（宿主结构化答复 m02966，摘录而非完整逐字）：「每个项目应该有独立的测试用例库吧」；「最好还是整个项目维护一份统一的用例库，更方便整体的质量验证」 | 用例须脱离单张 spec、可跨 feature 检索及回归，项目内持续维护一份库。 |
| R-012 | 本轮 `test-applicability` 与 `evidence-disposition` 结构化答复（宿主结构化答复 m02966）分别选择「风险与交付面决定，并显式说明不适用（推荐）」和「同任务闭环、旧证据保留（推荐）」 | 不强制无关任务跑 UI/API；失败、修复和受影响复测必须保留历史与新鲜事实。 |
| R-013 | 本轮 `catalog-form` 结构化答复（宿主结构化答复 m02976）选择「项目级用例索引＋可执行测试引用（推荐）」 | 用例库管理稳定业务场景、oracle、风险、环境、自动化/人工引用，不迁移所有测试实现；任务事实保存实跑证据。 |
| R-014 | 本轮 `catalog-location` 与 `catalog-seed` 结构化答复（宿主结构化答复 m02982）分别选择「随项目仓库版本化（推荐）」和「本卡及受影响回归先入库，留下扩展规则（推荐）」 | 每个项目在自己的仓库维护版本化统一库；本卡先种下相关及受影响回归用例，其他存量仍为未盘点，不能声称全库完整。 |
| R-015 | 本轮针对原词 `代码测试` 的真实结构化答复（本轮 `meaning-code-test`）选择「自动代码检查（推荐）」：类型、构建、静态规则及合同检查按改动选用；人工代码审查另列。 | Task/Phase 的代码测试是可失败的定向自动检查，不能以人工 review 或单元测试重命名代替；不适用/不可用如实标记。 |
| R-016 | 本轮针对 `UI 实机` 的真实结构化答复（本轮 `meaning-real-device-ui`）选择「真实浏览器即可（推荐）」：连接实际运行的服务并操作真实页面留截图/网络/控制台证据；有移动端或设备特性再要求相应物理设备。 | 普通 fixture/假页面不是 UI 实测；物理设备不是所有 UI 案例的固定前提。 |
| R-017 | 本轮针对 `verify-code 结束后` 的真实结构化答复（本轮 `post-verify-acceptance-time`）选择「现有最后确认符合（推荐）」：机器测试与独立审查后交付业务验收说明、授权者最终确认。 | 在现有 verify-code 最后确认位置记录真实回复，不加新阶段、门或日常人工跑测。 |
| R-018 | 本轮 `card04-post-browser-protected-write` 真实结构化答复选择「允许 CARD-04 提出最小改动并另行审查（推荐）」；条件是 CARD-05 落地后的负控证明官方浏览器逐 AC 接线离不开既有保护写面。 | 仅允许提出并审查 `runtime/stage/**` 的最小方案，未批准修改文件、未确认 D-009…D-014。 |

一手现状：`skills/testing-system-blueprint/SKILL.md:9-28` 与 `skills/spec-plan/templates/phase-template.md:8-48` 已要求阶段/任务 oracle、命令、证据；`workflows/build-code/SKILL.md:169-230,251-279` 已要求 RED/GREEN、修复及受影响复测；`runtime/stage/stage-runner.mjs:2555-2642,2933-2974` 能执行声明的 acceptance 并存逐 AC 原始事实，但无法证明业务语义；`runtime/evidence/freshness.mjs:207-269` 对同任务修复和受影响测试作事实校验；`workflows/verify-code/SKILL.md:69-79,107-156` 有语义抽查和独立审查，尚无统一的外部依赖/低置信度/高风险处置清单。`skills/frontend-testing/SKILL.md:9-39` 已有真实 UI 路由，应复用而非宣称缺少 UI 技能。此处只是调研输入，不把约定冒充已执行或 CARD-05 已完成。

### 本轮问题映射（唯一 OI v2 的解释，不是第二份权威）

上文唯一 OI 大纲已就地更新为 v2，保留 OI-001…OI-018 历史条目；本轮新增 OI-019…OI-024 分别承接下列 QN-01…QN-06。所有本轮回答仍待最终确认，不得把本表或旧范围让渡误作新批准。

| 框架节点/类别 | OI 与当前答复/待决 | 处理 |
| --- | --- | --- |
| background / complete_user_flow | QN-01 项目如何跨 feature 回归？R-011、R-013、R-014 | 项目仓库唯一用例索引，先收本卡及受影响回归；存量未覆盖披露。 |
| problem / success_failure_boundary | QN-02 形式绿不等于业务效果，失败证据如何保真？R-009、R-012 | 业务 oracle + 原始真实入口 + 失败原件与新复测事实。 |
| goal / success_failure_boundary | QN-03 六项由谁交付，CARD-05 是否再改？R-010 | 本卡承担最终结果，不要求 CARD-05 新增改动，禁止误报已落地。 |
| solution / data_state | QN-04 用例、测试代码、阶段材料和执行事实如何不双写？R-011、R-013 | 库存业务用例/执行引用；spec/phase 关联 ID；代码原位；事实只在任务记录。 |
| acceptance / page_scope | QN-05 UI/API/外部依赖何时实测，缺环境怎么办？R-009、R-012 | 风险与交付面适用，未实跑记未验证，非 UI 不伪造 UI 通过。 |
| extension / deferred | QN-06 旧项目全量测试资产与 CARD-05 落地差异？R-010、R-014 | 其余存量渐进纳入；CARD-05 尚未落地的能力保持依赖与未知，不代答。 |

### 方案研究 R2：用例库怎样真的驱动测试（候选方向，尚未裁定）

问题不再是「要不要收录 U-6」：R-011/R-013/R-014 已确定每项目仓库内**一份**版本化业务用例索引、现有测试代码原位、先种本卡及受影响回归。未定的是**消费闭环**：库中的 case 在 build-code 是否只供人选测，还是必须由现有测试路由读出并解析为可执行目标？这影响投入、漂移和质量声称。以下以一条业务规则变化导致旧回归受影响为共同对照：build-plan 写原始来源/业务规则→正常、失败、回归 case→AC/Task，build-code 对已实现代码实际执行且保留命令、原始结果及旧失败，verify-code 检查漏测/误判并提出人工验收。仅写下这些字段仍不能证明效果。

| 候选 | 怎样消费和维护同一库 | 能得到什么；会失去什么 | 本轮建议 |
| --- | --- | --- | --- |
| A 手工语义索引＋现有执行路径 | 稳定 case ID 写业务意图、三种来源、数据、正反例、可观察效果、测试引用及失效状态；spec/Phase/Task 正文链接，实施者用现有 test-routing-advisor 依实际变更与风险选择具体测试，任务事实存真实命令/输出，verify-code 人工抽查 case→AC→结果并发现过期引用。 | 无新解析器/运行时写面，能给业务语义足够空间；测试路径改名、漏选回归只能靠作者和独立审查发现，不能声称自动防漂移。 | 暂推荐先用 A 交付受限种子；如果用户要求索引直接驱动选择，则 A 不满足。 |
| B 可执行绑定的项目索引＋受控解析 | 仍只有一份库和原位测试，但 case 到测试目标/命令的绑定由现有测试选择环节解析并检查目标存在，将实际解析出的 case/目标/命令/结果引用写入现有任务事实；业务语义和效果仍由人核，不能因路径存在自动给 AC pass。 | 更易复测与察觉引用漂移，但需新增解析、ID 演化和失败路径的测试/维护；若真实接线必须改 CARD-05 已接管的写面或校验器，现有边界不授权，应先确定可行的 CARD-04 自有接线，否则请求单独裁定或缩小本次能力声明。 | 不在尚未核实接线与 CARD-05 落地时承诺 B 已可实现。 |
| C 测试旁注释/sidecar 作源，再生成项目索引 | 随测试改动同步案例，工具生成唯一供查找的项目索引。 | 容易随着代码维护，但业务知识散落在测试旁，生成文件可能成为第二份持久权威，迁移与重复 ID 成本高；缺少规模/漂移证据，且有悖已选统一库作为维护源。 | 拒绝作为本卡默认；除非用户明确改变已选的一份库的权威含义。 |

核验边界：`skills/testing-system-blueprint/SKILL.md:9-28` 与 `skills/spec-plan/templates/phase-template.md:8-48` 定义计划级 oracle/技能/证据，并非执行认证；`runtime/stage/stage-handlers.mjs:3877,3956-3958` 的 post build-plan RED 声明不认证且 test routing 仍 unknown；`workflows/build-code/SKILL.md:169-220,251-279` 已规定实际改动重选路由、真实 GREEN、AC 结果、同任务修复及终局回归；`runtime/stage/stage-runner.mjs:3919-3950` 的当前 coverage `semantic_status: "unverified"`，acceptanceChain 中 source/decision/FR/task/evidence refs 起始为空，不能把绿灯投影成完整语义链；`workflows/verify-code/SKILL.md:69-79,107-156` 已有抽查与人工确认，但需将低置信、外部依赖和高风险变为明确检查内容。A/B 都必须逐层分辨 planned/N/A/unavailable/actual，并给 Task 与 Phase 各自真实入口/业务效果 oracle；都不得靠测试目录或 catalog 元数据单独认定通过。此为一手仓库文本调研，B 的具体可写接线及 CARD-05 实际落地仍待核验，不把建议冒充批准或能力。

### 可行性复核：真实执行与可承诺的保障

对「取消后不得收费」这一示意业务规则（**仅用于比较方案，不是本卡实际业务用例**），完整链为：原始规则+这次改动+现有收费业务约束→取消前/取消后/重复取消及旧回归 case→可观察的收费记录和用户账单 oracle→本次实现上的目标测试与完整业务入口→保留失败输出→修复后重测旧规则及邻近回归→按 AC 检查原始结果、依赖和风险→人工按真实入口复核。只看到命令退出 0 或用例标题，无法断言未收费。

已核一手接线：`skills/test-routing-advisor/SKILL.md:8-16,18-37` 只按改动边界判 `simple|feature|fullstack`，不读取 case ID，也不执行测试；`workflows/build-code/capture.mjs:5-12` 接收**已选的命令**，不从用例库选命令；`runtime/evidence/canonical-receipt-writer.mjs:727-809` 实际执行命令并绑定工作树、命令、输出、退出码和时间，改代码后应以新快照重新采集；`runtime/evidence/freshness.mjs:207-269` 验证代码审查修复所附新源码和受影响通过检查，并不判断业务 oracle 正确。`runtime/stage/stage-runner.mjs:3930-3950` 当前语义链若需完整自动填充，task_ids/review_ref 等还为空，这与“用例如何选测”是两个不同缺口，不得以做了用例索引掩盖。手工消费方案能够沿现有 build-code 命令选择→真实 capture→逐 AC 执行事实→同任务修复→verify-code 抽查走通，但必须坦承不能自动保证所有旧回归被发现；工具核对至少需要在命令选择**之前**增加读 case→目标并验证缺失/失效/未运行的消费者和自身测试，当前没有这项能力。该消费者是否能留在本卡可写面、CARD-05 实际交付后是否还有必要仍待冻结，不能将其预写成已实现。

### 本轮方案 Talk 的沟通失败与重排

此前提出「用例库如何驱动执行」的方案 A/B 问题，用户明确反馈：「这个问题我看不懂，你说的完全不是人话」。**该问题未产生选择或批准**。原因：以索引/解析/绑定/漂移等内部术语让用户裁定实现接线，而没有先展示一个需求变化→旧回归→实际运行→修复/复测→人工验收的完整业务示例、现有能力和代价。已向用户承认并以「取消操作不能收费」规则变更为例解释人工核对与工具协助核对的差别；在验证工具接线和禁写边界之前不得据此推定 B 已可行或反复要求用户回答相同问题。下一次 Talk 应只聚焦用户可感知的保证水平/遗漏后果，而把路径和解析器交工程调研。

### 第二次方案 Talk：人工主方案被明确否定

在改用「取消订单不得扣费」示意后提出「计划列旧用例、执行人运行、验收人核对（推荐）」与「另开发自动漏跑提醒」等选项，用户明确答复：「如果需要人来运行，人来核对，那么整个验收系统就可以说是彻底失败了！」这不是选择 A 或 B 的同意，而是**否定以人工运行和人工查漏为主的质量系统**。撤回上节候选 A 的推荐；候选 B 仅检查计划内测试是否漏跑，也不能发现计划一开始漏列的旧业务用例，同样不足以满足本轮期待。必须研究更完整的自动化方案：从被确认的业务规则/变更与用例的关系推导受影响测试、自动运行可自动化的测试、比对应测/实测/证据并如实报告缺失；人工保留业务语义判断与确实不能自动化的具体验收，不代替系统跑测试和查漏。未证明这些关系如何建立/维护、旧用例未盘点的不可知边界以及现有运行器能否接线之前，不可承诺「系统保证无漏测」；若完整交付要求禁写面或 CARD-05 改动须单独请示，而不能无声降为人工方案。本段只记录新的质量约束，不是架构批准。

### Talk / 调研 / Grill（本轮增量）

Talk 真实答复对应 R-010…R-014；在「本卡全责」后重新排序为「项目用例库形态→测试适用性→失败处置→库位置和起始覆盖」。被拒方案：每任务强制全类型测试（会产生无意义 UI）、只按改动文件选测试（遗漏效果）、只存最终绿色结果（无法核查复测）、每次新功能重建用例库（不利回归）、全部脚本迁入新库（与现有测试布局冲突）、本次盘点所有旧功能（扩大工期）。研究只依赖已读的一手仓库契约；外部 ISTQB 与 Playwright 页面抓取因 `URL hostname … resolves to a non-public IP address` 不可用，**不引用外部页面内容作为结论**。本轮独立方向建议已查出 OI 编号冲突及旧决定越权风险并修正；Grill 未发现新的无条件方向问题，但指出禁止写面和不可用真实环境两个条件触发的再次请示；独立细节建议指出 OI 版本/状态、类别、来源绑定及范围冲突，已按草案状态修正，仍不能以审查代替用户最终确认。

### D-009 — 本卡六项完成责任与跨卡边界（revised proposal，待最终确认）

- question/final_option：由谁交付六项？→ 本卡全责、CARD-05 不新增改动（R-010）。recommendation：尊重用户的实际交付责任与正在收尾的其他卡；不重复改它。
- decision/logic：R-009 + R-010 → CARD-04 补全六项最终可验证结果；先读 CARD-05 已落地事实，重叠功能只做集成验证及缺口补足；未落地保持 unknown，不将其算作完成。原 D-001 的本卡狭义范围已与本轮用户明确的完整交付责任冲突；CARD-04 研究及重规划应纳入 B2：项目业务关联驱动的自动选测、实跑及逐例结果/证据对账，不得以原 P1–P7 文档和手工查漏冒充交付。本决定**只调整结果责任及重新规划目标，不直接授权修改生产文件、校验器或 CARD-05 的任何写面**。CARD-05 尚未证实落地；先调研必要写面、独立复核与最小跨卡冲突，后续 build-plan 明确，必要的额外权限须另获用户裁定。Supersedes：D-001 的「本卡只负窄范围交付责任」；其不碰校验器、不碰 CARD-05、不修改 `task_ids`、不恢复 `plan.md`/`tasks.md` 双写的实施约束暂予保留，直到单独裁定。
- impact/risks：范围增加，不能不经 CARD-05 落地核对就冻结重叠代码；不新增普通确认、控制面或 CI。rejected：只做旧卡面、请求 CARD-05 改动。unresolved：CARD-05 实际落地差量；owner=CARD-04 build-plan。approval_binding=本轮选项已答，最终方向确认待取得。
- module: 交付责任
- requirement_ids: [R-009, R-010]
- derived_from: []
- artifacts: [specs/workflowhub-thin-core-card-04-20260919/decision-log.md, specs/workflowhub-thin-core-card-04-20260919/spec.md, specs/workflowhub-thin-core-card-04-20260919/phases/index.md]

### D-010 — 项目版本化业务影响关系与用例索引（revised proposal，待最终确认）

- question/final_option：回归用例是否埋在每张 spec？→ 每个项目仓库维护**一份持续演进的用例索引**（R-011、R-013、R-014）。recommendation：选业务用例索引而非复制测试代码，因为引用原有测试与真实证据可降低漂移。
- decision/logic：从**原始需求、后续变更及业务知识**分别推导可复用的功能测试和回归测试用例（正常、失败、边界及受影响旧行为），项目级稳定 case ID 记录需求/业务效果、变更来源、业务规则、成功与失败场景、数据/前提、可观察 oracle、风险层级、环境、改动触发与实现/接口/消费者关联、依赖用例、真实自动化测试目标、仅在无法自动观察效果时的人工步骤、适用/版本状态；需求变更时核对并更新受影响回归用例；spec/Phase/Task 的正文引用 case ID（不修改已有 `task_ids`，不恢复 `plan.md`/`tasks.md` 双写）并在需求或功能变化时维护同一库；测试实现仍在既有测试目录，执行历史仍在任务质量事实。初始收 CARD-04 与受影响回归，其他旧功能明确未盘点；库内容不得自证真实执行。初始 owner 是 CARD-04 build-plan，后续 owner 为每个项目的需求/测试维护者：feature 变更时更新同一库，build-plan 的 AC/Task、build-code 的自动受影响测试选择/对账、verify-code 的业务语义及残余风险审查是消费者；因测试路径、消费者或业务预期改变造成失效时标 stale/unknown 并修订或明确退役，不复制旧执行结果。选择器还必须从真实 diff 与**独立于本次 Task 自报清单**的测试资产发现结果及真实入口清单反向核对已登记关系；测试资产的候选来源是仓库版本化测试文件/测试运行器可采集目标与当前入口，须由 build-plan 先验证其实际可枚举性、版本/快照、维护 owner、build-code 消费者及退役规则；旧 D-006 所说入口清单仍只是规划产物，不能假定已存在，更不能从入口文件自动推导业务依赖。两侧对照能查已发现测试未登记、已登记目标错名/删除、已登记触发关系丢失等已知缺口；库存缺失、来源不可认证、双方关系同步遗漏或旧业务尚未盘点仍是 unknown，不能变成空集通过或宣称无漏测。用例库是业务用例索引，不替代 D-006 的真实入口库存，也不成为任务事实或新运行时门禁。Supersedes：none；D-008 的规则 authoring owner 仍为 build-plan，本轮仅增加项目级库的交付目标，不授权修改其他卡的工具/校验器写面。
- impact/risks：新增可维护的项目资料及消费者，不新造 stage/gate/第二份执行账本；映射易过期，须以变更和反向库存核对并标 unknown，**不能自动证明未登记业务依赖或 oracle 正确**。rejected：每个 feature 独立库、迁移所有测试脚本、只存编号/路径、此次盘全仓，以及手工选择和核对作为验收主链。unresolved：具体路径、标识及维护入口由 build-plan 实测现有布局后冻结。approval_binding=本轮选择已答，最终确认待取得。
- module: 测试资产
- requirement_ids: [R-009, R-011, R-013, R-014]
- derived_from: [D-009]
- artifacts: [项目仓库统一用例库, specs/workflowhub-thin-core-card-04-20260919/spec.md, specs/workflowhub-thin-core-card-04-20260919/phases/P<n>.md]

### D-011 — 需求→业务影响用例→任务→应测/实测（revised proposal，待最终确认）

- decision/logic：R-009 + D-010 → 在 build-plan 的 spec 与 Phase 从原始需求、变更和业务知识推导可复用的功能/回归 case 与可判真假的 AC，并连接每个需求/业务效果、FR/AC、稳定 case ID、阶段任务、正反例、真实入口、可观察 oracle、条件和预期失败信号。**每个 Task** 分别规划单元测试、自动代码检查、接口测试；**每个 Phase** 分别规划单元测试、自动代码检查、接口测试和连接实际服务的真实浏览器 UI 测试（有移动端或设备特性时还需相应物理设备），并写明各层适用或 N/A 理由、拟使用的现有技能、可复现环境/数据/命令或人工步骤、预期保留的输出/观察/证据、每层可观察的业务通过标准；Phase 还须覆盖跨 Task 接口和完整用户旅程，不以 Task 绿灯求和冒充 E2E。计划中的技能与结果只是拟定项，实际调用和实际结果留在 build-code/verify-code 的本次执行事实中，不在计划里填“已通过”。Phase 汇总测试策略、风险和各 case 可观察的通过/失败标准；完成声明必须逐条对照真实业务 oracle 与残余风险，**不是阶段进入/继续修复的 gate**，不以覆盖率或统一数值预算做门。已存在 Task 卡与 testing-system-blueprint 优先复用。规划还要列明每个 case 的变更触发/下游消费者和机器可复验的测试目标、预期测试身份、业务效果与对账判据，以供 build-code 根据真实 diff **独立于实现者自报测试清单**自动求应测集；针对规划遗漏以独立于任务作者自报的仓库测试发现与真实入口库存作反向核对；先验证测试身份可枚举及其版本、owner 和消费/退役路径，缺库存、不可信来源、关系两侧同步漏登记或未盘点老业务均标 unknown，不可把发现测试文件误认为知道业务依赖。Supersedes：none（细化 D-007/D-008）；risks：表填满也不等于需求语义正确，异源审查核业务规则/oracle 与未登记关联，不替代系统日常运行和对账；unresolved：逐 case 的业务 oracle、适用性和具体消费者由 build-plan 实测后冻结。approval_binding=最终确认待取得。
- module: 验收链
- requirement_ids: [R-009, R-013, R-015, R-016]
- derived_from: [D-010]
- artifacts: [specs/workflowhub-thin-core-card-04-20260919/spec.md, specs/workflowhub-thin-core-card-04-20260919/phases/P<n>.md, 项目用例库]

### D-012 — 自动影响选择、真实执行与不可用判定（revised proposal，待最终确认）

- decision/logic：R-009 + R-012 → build-code **基于已经实现的代码实际执行测试与效果评测**：逐 Task 按交付面和风险选择单元测试、自动代码检查、接口测试，逐 Phase 再检验这些层及适用的真实服务浏览器 UI 测试（设备特性另需物理设备）、真实服务/外部依赖与完整业务效果；有入口必须按可复现环境、数据、真实正反例、用户可观察效果实跑，不以单测或模拟断言冒充功能/真实 UI 验收。非适用层写具体理由；缺环境/服务或无法验证记 unknown/unavailable 与业务影响，不得当 pass。以可认证的任务起点及后续每次修复版本为基线、当前代码快照为终点，合并已提交和未提交的实际改动，再结合项目用例库已登记的触发/依赖/消费者关系和独立测试/入口库存自动求应测 case、测试身份与安全的定向执行目标；任务起点不可认证、跨提交改动不可见或修复后来源快照无法绑定时须报告 unknown_change_scope，不得把空 diff 当成零应测或绿色；具体可信来源、差分算法及多次修复快照链由 build-plan 实测并冻结，不能凭当前工作树无改动推定无需回归。复用 build-code 既有测试步骤及 canonical receipt 实跑，在测试运行器实际输出中核对应测身份/结果、原件和快照，不只看命令退出码。已登记变化无关系、目标失效、选了未跑、结果缺失、证据缺失或快照陈旧都给对应 case/AC 的未证明事实，不能出现空集全绿；已有关系的多文件、跨 Task 旅程合并选择且不无范围跑全量。动态文件路径不得直接拼进 shell 命令。post 当前原生验收契约只允许明确 command/service 场景，**不是**上述分层回归和 UI 的完整执行器；`skills/frontend-testing/SKILL.md:30-39` 所述官方 handler/受控 isolated-browser-qa 才定义服务实例、隔离浏览器、截图、逐例身份及 cleanup 要求，普通 shell receipt 或声明了技能均不能证明真实页面通过。重新规划必须以独立负控验证 UI 适用时的浏览器消费者、结果身份与原始证据接线；若必要接线触及禁写面或无可用服务，保留 case/AC 的 unknown/unavailable 并请示边界，不假设已有 browser 覆盖。复用 frontend-testing 等已有技能但不让人替系统日常选测/运行/核对。Supersedes：none（细化 D-007）；risks：真实环境不可控、未登记关联不能自动猜出，必须列未知范围和必要的真实环境/业务语义责任；approval_binding=最终确认待取得。
- module: 适用性
- requirement_ids: [R-009, R-012, R-015, R-016]
- derived_from: [D-011]
- artifacts: [项目用例库, specs/workflowhub-thin-core-card-04-20260919/phases/P<n>.md, 任务质量事实]

### D-013 — 自动对账失败→同任务修复→受影响复测→新证据（revised proposal，待最终确认）

- decision/logic：R-009 + R-012 → build-code 对每次实测保留可复核**过程**：实现版本、环境/准备、测试数据、case/技能、真实命令或人工步骤、预期与实际输出/观察、退出状态、原始证据与适用限制；按 case→本次运行→每条 AC 的判断→结构问题和残余风险说明连成链，既不让命令绿冒充业务合格，也不把规划中的技能当成已执行。系统须逐 case 自动对账已登记应测集与测试运行器的实际身份/结果、原始证据和同一代码快照，区分未选/未跑/失败/缺结果/缺证据/不可用/不适用，保留对未登记业务依赖的未知范围；不得以执行者的自报清单作唯一基准。**测试出现任何问题**（产品行为缺陷、测试失败或不稳定、用例/oracle 无效、夹具/环境问题、应测未测或结果不可用），先诊断和标注归因，再在同任务修复对应的代码、测试用例、oracle 或环境；保留旧失败及限制事实、发现编号、owner 与变更，由系统对新快照重新推导应测行为并运行受影响行为和邻近回归，更新用例及新证据与逐 AC 判断；未解决或不可用仍标 failed/unknown，不得以最后一次绿色摘要冲掉。实际测试结果按任务、阶段汇总通过/失败/未测、适用性与风险限制，不新造证明通过的状态机。适用现有受影响测试/审查批次限制，严重发现遵循修复或具体风险接受；这是完成/交接结论的处置，不阻止同任务继续修复或进入阶段。Supersedes：none；risks：影响范围判断错误可漏回归，独立复核需检查；approval_binding=最终确认待取得。
- module: 修复证据
- requirement_ids: [R-009, R-012]
- derived_from: [D-011, D-012]
- artifacts: [任务质量事实, 项目用例库引用, 阶段结果]

### D-014 — verify-code 语义、依赖和人工结论（revised proposal，待最终确认）

- decision/logic：R-009 + D-011…D-013 → verify-code 对原始需求/用户痛点→业务效果→case→AC→实际代码/消费者→**系统应测/实测对账与原件**进行语义判断，明确测试用例和 oracle 是否**足以证明需求与效果**，逐项给出已核、抽查及未核的边界；检查外部依赖/服务/运行环境是否实际确证、低置信度推断的根据与需复核项、高风险或不可逆路径的真实验证及残余风险。verify-code 内独立审查完成后，按用户本轮认可的既有最后确认时点提供**可执行的人工验收标准和流程**：执行者、可用环境与前提/数据、从真实入口操作的步骤、预期可观察业务现象及拒绝条件、应回传的证据、每个依赖/低置信/高风险问题的责任人和接受或修复处置；未实测者不得写已通过。任务关闭前发现的问题按既有同任务修复及受影响复测处置；关闭后发现的问题按现有制度单独登记后续工作与责任，不暗示重开已关闭任务，未验证的剩余风险由人工明确承担或拒绝。独立审查与人工 verify-code 验收分别留事实，未验证/审查 unavailable 不改写为 pass；人审是针对业务关系、oracle 与不可自动观测的剩余效果，不承担日常测试选择、运行和逐例对账；不得用 reviewer green 代替业务效果判断；不新增后续阶段或机器推进门。Supersedes：none（细化 D-003/D-007）；risks：语义不能由 hash 自动证明，需人看真实场景和限制；approval_binding=最终确认待取得。
- module: 验证结论
- requirement_ids: [R-009, R-012, R-017]
- derived_from: [D-011, D-012, D-013]
- artifacts: [项目用例库, verify-code 质量事实, 阶段结论]

### D-015 — 补做三项此前跳过的真实验收（2026-09-27 增量方向）

- 用户选择：本轮先用大白话说明「之前决定先跳过三项实际验证；现在要求原始需求全部做完；补做会增加工作量，其中一项需要让开发程序在受限环境里运行」，给出「补做三项，目标是全部完成（推荐）」和「维持先跳过，最后如实列出未完成」两项。用户实际选择第一项。此前用户还要求「所有phase都完成后，确认所有功能已经完全实现原始需求和设计」，并在解释阻塞后回复原文「j徐吧」（按当时上下文理解为继续）。选项是界面文字，不冒充用户亲自写出的技术方案。
- decision/logic：本任务恢复 AC-17 的真实实现者测试访问限制、AC-18 的真实行为变化样例 task 同一测试 RED→GREEN、AC-19 的真实纯文档样例 task 可失败检查或有理由、风险和验收披露的豁免。样例须可由独立来源核对。`## 最终确认` 第 2 项旧「乙」保留为历史答复；本条**仅就 AC-17 样例**取代 OI-005 与旧拒绝方案中“本卡不做物理隔离”的处置，并取代 AC-18/19 旧跳过处置，其它 D-001…D-014 方向不改。AC-19 的“纯文档 task”按完整工作流 Task 核验，不把同一混合代码任务内的文档工作项直接算作样例。找不到真实宿主限制、任务样例、原始测试字节或结果时仍记 `incomplete`/`unavailable`，不得造样例、放宽断言或声称通过。
- 措施边界：AC-17 要在真正受限的实施者进程内观察只读模式「可读、不可写/改」及隐藏模式「读不到直接路径、复制内容或 Git 对象」；普通同用户文件权限、事后声明或只限制测试子进程不算。AC-18/19 须绑定真实样例 task、当前材料/代码身份、测试或豁免原件、命令/exit/输出和独立审查。受限进程启动方式、样例身份、跨卡写面与测试修订由后续 build-plan 明确，用户此次没有选择具体工具或文件。
- approval_binding：上述补做方向有本轮真实用户选项答复；本段落及后续 `spec.md`/Phase 新版本的正式材料确认、审查和阶段事实仍须分别取得，不能沿用旧版本确认。旧 `MISSING` 只有在真实验收通过后才可改为完成。
- module: 真实验收样例
- requirement_ids: [R-001, R-003]
- derived_from: [D-006, D-007, D-008]
- artifacts: [当前 spec/Phase 修订, 受限实现者运行原件, 两个独立任务样例原件]

### U-6 原始六项逐项交付/验收对照（草案，非已实现事实）

本表直接消费上方 m02822 的逐字 U-6，不替代唯一 OI 或项目用例库；“应见到”是后续 build-plan 应冻结的可查交付标准，不能把未来文件或预计运行当作本轮已交付。

| U-6 原项 | 决定 | 后续应见到什么，缺失如何判定 |
| --- | --- | --- |
| 1 build-plan：原始需求＋变更＋业务知识，功能/回归可复用用例与 AC | D-010、D-011 | spec/Phase 有来源→业务规则/变化→正常、边界、失败、回归 case→可观察 AC 的逐项映射；版本化项目索引能跨 feature 找回测试引用与维护者；未涵盖的原需求或旧行为标未盘点/缺口，不以 case ID 存在即断言语义覆盖。 |
| 2 build-code：基于实现代码实际测试和效果评测，单元/代码/接口/UI 实机 | D-011、D-012 | Task 与 Phase 中先写各层适用性；build-code 有针对本次代码版本的真实执行/观察和业务效果比较；适用 UI 时要真实设备或浏览器流程的结果，不适用附理由，环境缺失则 unknown，不以模拟/单测代替。 |
| 3 build-code：可复核过程与证据，对照 AC 判断结构和风险 | D-011、D-013 | 能由实现版本、环境/数据、步骤/命令、预期/实际、原始输出重现结果；逐 AC 写判断并指出结构问题与残余风险、适用限制；缺步骤/原件或只给绿色摘要记未证明。 |
| 4 任何测试问题：修复、重新验证、测试用例及证据更新 | D-013 | 每一发现有类型、原因、owner、原失败记录、相应代码/用例/oracle/环境处置、受影响范围及新复测证据；失效用例须更新或标 stale；不可修/不可测如实留风险与人工处置，不抹旧失败。 |
| 5 build-plan：每 Task 与每 Phase 分层测试、技能、结果、通过标准 | D-011、D-012 | **逐 Task**列单元/代码/接口，**逐 Phase**列单元/代码/接口/UI 实机；各层含适用/N/A 理由、拟用技能、环境/入口/数据、拟保存的具体结果和可判的通过/失败 oracle；跨 Task 的功能旅程另判，计划的技能不充当已调用事实。 |
| 6 verify-code 后：需求与测试语义、外部依赖、低置信/高风险、人工验收 | D-014 | 既有 verify-code 结论逐项判需求效果和测试充分性、依赖真实状态、置信度与高风险；人工交接给执行者/环境/数据/步骤/预期现象/拒绝条件/回传证据/风险 owner 与接受或修复选择，留真实人工结论；未核验不能算通过。 |

### 本轮方向提案被退回：需先完成方案论证

用户在本次 `approve-decision` 提问中明确否定「把原始六项重新录入后即请确认」的做法，原话：「你是不是搞错了make-decision的意义？单纯吧原始需求录入到decision-log，最终交付质量是很差的！方案都没讨论清楚，我无法确认这个方向！」这是**拒绝本轮批准请求**，不是 D-009…D-014 的授权。U-6 表只能证明没有漏抄需求，不能证明索引模型、实际测试路由、事实链、维护责任与跨卡实现路径足以交付质量。下一步须用现有仓库契约和实际边界比较不同实现方案、验证关键可行性与代价，提出有后果/风险的方向级选项给用户讨论；待真实答复后重写草案并再走独立建议与最终确认。此前 R-010…R-014 已作出的单轴选择是约束而非全面方案批准。旧 `human_confirmation` 不能覆盖此新方向。

### 自动化闭环可行性研究（待方案讨论，非决定）

用户在 `card04-auto-closure-scope` 明确选择「纳入重新规划（推荐）」：授权把自动选择受影响业务测试、运行并逐例核对结果/证据的**新能力纳入 CARD-04 研究与重新规划**；这不是生产代码写面、跨 CARD-05 改动或最终方向的批准。须先审明与旧禁止写面、既有 build-code 路由及 CARD-05 实际落地差量，再独立建议/讨论；此句记录当时研究启动状态，D-009…D-014 现已在上文按 B2 目标重写，仍未最终确认。上方 R2 表格中「暂推荐 A」及此前 D-010 里以人维护、人工消费为主的说法属于**已被后来真实用户答复否定的历史草案**，不得作为现行候选结论。

用户进一步拒绝以人工运行和人工核对作为主验收系统：「如果需要人来运行，人来核对，那么整个验收系统就可以说是彻底失败了！」因此先前提出的「索引供人选择测试、人手动核对是否漏项」方案作废；人工仅负责业务语义及无法自动观测的真实世界效果判断，不负责日常测试选择、运行与结果对账。本段研究具体机制和边界，不视为用户对实现方案或扩写面的批准。

- **现状与反例**：`workflows/build-code/capture.mjs` 和 `workflows/verify-code/capture.mjs` 接受调用者提供的命令；`runtime/evidence/canonical-receipt-writer.mjs` 确认该命令在某个代码快照中确实运行，保存退出码和原始输出。此事实只能证明「给定命令跑了」，不能证明「本次改动影响的业务用例均被选择」。`tests/contract/acceptance-execution-producer.mjs` 的 AC→测试选择器仍由调用方声明，不能独立证明遗漏检测。故仅增加项目用例清单、人工选命令或把运行输出附入报告，均不满足自动闭环。
- **候选 A（被否决）**：一份可读的项目用例索引 + 现有手选命令/手工对账。改动小，但实现者漏选或删掉用例时系统仍可能全绿；因上面用户答复不可作为最终方案。
- **候选 B（推荐讨论，不是现成能力）**：保持一份项目级版本化业务用例库；每条含业务行为、关联实现/接口/消费者路径、依赖的其他用例、真实测试选择器、可判的 oracle、适用环境和维护 owner。由**独立于本次实现者所报清单**的选择器从受信任 Git 基线与当前快照求实际改动、沿依赖关系选出受影响用例；变化路径无映射或关系含糊时报告 unknown_mapping（不能当作空集通过）。系统自动运行所选的定向单元/代码/API/适用真实 UI 测试，利用现有 canonical receipt 记录真实输出、代码快照与哈希；以测试运行器**实际报告**的测试身份/结果逐例对账，缺运行、缺结果、失败、缺证据、环境不可用、快照陈旧分别留事实，修复后重新选择/运行并保留旧失败。build-plan 同时冻结用例→业务 AC→Task/Phase 层级/技能/环境/结果判据，build-code 产实际运行链，verify-code 抽检业务 oracle 与高风险/外部依赖并生成必要的可执行人工验收步骤；不得用后者替代前者。
- **最小独立试验**：以可核实的任务起点/修复快照覆盖已提交与未提交改动；只有空工作树 diff、起点缺失或历史改动不可见时应报 unknown_change_scope，不得全绿。改动 `tools/cli/stage-runtime.mjs` 的材料可用性，应自动选择 `tests/contract/stage-runtime-material-check.test.mjs`；改动 `runtime/stage/stage-runner.mjs` 的验收呈现，应同时选择 `runtime/stage/stage-runner.test.mjs` 和 `tests/e2e/card-04-real-entry-chain-e2e.test.mjs`。删除映射、双方同步漏登记、独立发现测试无业务关联、错写测试名、库存来源不可认证、丢运行结果或证据、修改运行后源文件、定向测试失败或环境不可用时均不得输出「全部通过」；适用 UI 时须另测服务实例/浏览器逐例身份/截图/cleanup 失败负控。这些是架构验证样例，尚未实施，不证明业务语义覆盖完备。
- **接线方式分歧**：现有 `workflows/build-code/steps.json:8-18` 已规定实际 diff 路由→测试技能→真实执行→diff 审查→最终汇总；`tools/cli/stage-runtime.mjs:1322-1337` 和 canonical receipt 可执行选定命令，故方案 B 可作为该既有链上的选择/对账消费者，未必需要新增 stage、校验器或 CARD-05 的 `runtime/stage/**` 修改。可先在 build-code 使用暂态依赖关系和独立已知测试资产清单，并写入现有任务事实；这比把索引升级为全新运行时验收契约代价低。但若不做**机器可复验的已登记关联映射、未映射识别及应测/实测对账**，仅靠执行人按技能自行选择、审查人阅读报告，仍违背用户的自动运行/核对要求，不能以此冒称完整方案。`runtime/stage/stage-content-contracts.mjs:7941-8023` 当前 post 原生验收仅单个 acceptance Task 的明确 command/service 场景，不从 Phase gate 命令推断，更不直接接 browser 场景；不能把已有 UI runner 当作本卡 post UI 自动覆盖。真实 UI 场景另需可行的消费者/授权，环境不可用保持 unknown。
- **研究后收窄的两级实施选择（均非现有能力）**：B1 依赖 build-plan Task 卡内的受影响测试路线，由 build-code 的既有步骤 4–6 自动选、运行和对账，辅以现有测试资产/入口清单、实际改动和独立审查，明确所有无映射或未盘点路径为 unknown；无需另起永久依赖图，但计划漏列的旧业务回归**可能无法机器发现**，只能报告已知的缺口与未证明范围。B2 在每项目同一份业务用例库内维护可执行的改动触发/消费者关系，并从实际改动和独立测试资产库存两个方向核对：缺映射、已退役/错名测试、被选未运行或无证据都按用例和受影响 AC 报未证明；使用既有 build-code 步骤和认证运行事实，不新建 stage/第二份事实账本。B2 比 B1 更能自动防止**已登记规则**漏跑，但维护成本更高，仍不能从未登记的业务知识推断新关系；初次未盘点存量必须公开标 unknown。若需要捕获跨文件业务消费者关系，只靠文件名/静态 import 不足，须在库中显式维护依赖并以负例/变更试验证明。两者都不可仅凭命令退出 0 宣称 AC 通过。
- **实现/安全审查要点**：最低可接入点是 `workflows/build-code/SKILL.md:169-220` 的现有步骤与 `workflows/build-code/steps.json:8-16`，必要时在 `workflows/build-code/` 增加私有纯选择器，不改公开 CLI 或 `runtime/stage/**` 即可执行已映射测试；但若选择器仅采纳实施者写在本次 Task 卡中的清单，就不能证明没有漏测，B2 还需要项目用例库与独立库存/真实 diff 的反向核对。`runtime/evidence/canonical-receipt-writer.mjs:747` 使用 shell 执行命令，动态发现的路径、标签不得直接拼接到 shell 字符串；可选择经过校验的固定命令或安全 argv 通路，并专测恶意文件名、空匹配、重复选择、失败/超时、快照变化。新增生产文件须登记 owner/consumer/替代及退役条件。当前 `git log -1` 为 `35a881ac`，未证明 CARD-05 落地；不在这次研究授权下修改任何生产代码。
- **边界/代价**：B 是新增的选择、执行结果对账和漂移维护能力，非现有 CARD-04 P1–P7 或 CARD-05 已交付。旧 D-001 的不改 `task_ids`、不改校验器和不触 CARD-05 重叠写面仍有效；因此在得到**针对新增实现写面及跨卡冲突的单独授权之前**，不能声称六项质量结果可按旧计划完成。项目用例库不应成为新阶段推进门或第二份执行事实，运行结果仍进任务事实；新增持久材料要明示 owner、消费入口与退役/迁移。B 能保证「已登记依赖可追踪、被选用例确实运行并与证据匹配」，不能机械证明未登记的业务依赖、oracle 本身正确、外部不可用时真实业务效果；这些必须显式标 unknown 与责任人，经语义审查或真实环境验证后才能下结论。不得把风险判断伪装为全自动完成。

### 方案 Talk 的真实选择：B2 保证层级（尚非最终确认）

用户对 `card04-automatic-guarantee-level` 的真实答复为选择「按项目业务关联自动选测（推荐）」；未选择「只按任务计划自动运行」或继续开放别的机制。该答复解决**保证层级**：目标是以项目用例库中维护的业务影响关系为依据，系统从实际代码变化自动找测试、执行并逐例核对；已登记用例漏跑、引用失效或缺证据必须报未证明；未盘点旧业务和未登记关系必须报未知，不许宣称绝无漏测。因而 B1 不得作为六项结果的最终达标方案；它可作 B2 的早期实现阶段，但必须保留尚未满足的缺口，不能用人工查漏替代。人工仅裁定业务关联与 oracle 是否准确、不可自动观察的业务效果及具体风险，不做常规选择/运行/对账。

**未获批准事项**：这次答复不是生产文件修改授权、跨 CARD-05 写面例外，也不是 D-009…D-014 或后续 build-plan 的最终确认。其后已按 B2 重写 D-009…D-014、补充任务基线/库存真实性/浏览器负控及本轮 UI 适用性与收敛检查，并经独立只读审查提出风险及修正；这些均仍是待确认方案，不能抢先改 spec/phases。

### 本轮 UI applicability 重算（方向草案，旧历史结论不复用）

旧 `## UI applicability` 的 `non_ui` 由当时 R-001…008、纯 CLI/文档计划及真实用户答复支撑，作为**旧范围历史事实保留**；旧 `## 收敛检查` 和 `## 最终确认` 也只覆盖 D-001…008 / AC-16…21。本轮 U-6 的第 2、5 项已明确要求在适用的 UI 项目中自动执行真实 UI/实机测试，因此按 `workflows/make-decision/SKILL.md:88-104` 重新核三输入，不能沿用旧结论：

| 输入 | 本轮已知事实 | 对测试适用性的意义 |
| --- | --- | --- |
| `raw_requirement` | U-6 第 2、5 项要求 build-code/Phase 对适用项目覆盖真实 UI；用户选择 B2 自动选测/实跑，不接受人日常运行/对账。 | 对**交付的测试系统能力**是可信 UI 信号；非每张卡必须跑 UI。 |
| `project_inventory` | 本卡当前已知改动是 CLI/运行流程/资料，已有 `skills/frontend-testing/SKILL.md` 真实 UI 路由；post 原生验收只接受明确 command/service 场景，不等于浏览器执行器。 | 本卡自身产品界面无已证实改动；真实 UI 自动选测与执行接线**尚未核定**。 |
| `planned_or_changed_frontend_fact` | 此轮仅研究和重规划 B2，未批准前端组件写面，未有本卡 UI 组件变更。 | 本卡代码差分可为非 UI，不能因此删掉系统对未来适用 UI 的能力目标。 |

**这里是“被交付系统要支持适用 UI 项目”的能力要求，而非当前 CARD-04 代码差分的机器 UI 事实**：本卡现有已知界面改动为无；上文唯一 canonical `## UI applicability` JSON 仍为旧任务变更的 `non_ui` 历史记录，`readUiApplicabilityFromDecisionLog` 只读取这个一级节，不能让下面的草案表或一句 `ui` 冒充更新后的机器事实。待 CARD-05 落地并冻结新的实际写面后，必须用三份真实输入复核本卡当前 UI 事实；若实际仍无 UI 改动可保持 `non_ui` 并注明系统能力目标另列，若确有前端改动则须修改唯一 canonical JSON、收真实用户判定并重走绑定。对未来 UI 项目，必须证明自动选择、真实浏览器（有设备特性时物理设备）测试执行与原始证据对账的可用路径；环境或接线不可用报 unknown/unavailable 和责任，不报 UI pass。这里的业务关系驱动测试可能在**仅改后台但存在真实页面消费者**时触发 UI 回归，旧 changed-frontend-only handler 返回不适用，不能拿其 `non_ui` 当业务 case 的 UI N/A。

### 本轮当前收敛检查（草案；四维均待最终确认）

| 维度 | 本轮已知用户取舍 | 拟核验的成功与失败边界 |
| --- | --- | --- |
| 目标 | U-6 六项原话；用户否决需求复述式方案、人工日常运行/对账，选择 B2 自动保障层级。 | 六项逐项落到真实业务测试/证据/修复/交接，已登记业务规则可自动选测实跑并逐例对账；仅材料或命令绿不算完成，未登记关联与旧业务不得隐为通过。 |
| 范围 | CARD-04 承担六项结果，CARD-05 不新增改动；单独实施写面尚未获授权。 | B2 项目版用例库 + build-code 既有路径的选择/执行/对账 + Task/Phase 规划与 verify-code 语义；先核 CARD-05 落地差量，无权触碰禁写面，不新建 stage/gate/事实账本。 |
| 方案 | 一库记录业务影响/测试引用，实际改动和独立库存作双向输入；B1 和手选均非最终方案。 | 起点与多次修复快照可认证、已提交/未提交变更可见，映射缺失/空 diff/错名/漏结果/陈旧证据的负控不能绿；风险、安全执行、条件 UI/外部环境均能逐项披露；业务语义和 oracle 仍需独立判断。 |
| 验收 | U-6 逐项草案见本文件「U-6 原始六项逐项交付/验收对照」，不是旧 AC-16…21 的确认。 | build-plan 冻结逐 Task/Phase 的层级、技能、业务 oracle 与通过标准；build-code 在实际代码上自动选/跑/逐例对账、修复后复测留旧证据；verify-code 提供语义/依赖/置信度/风险判断及可执行人工验收。缺失或不可用标未证明，不制造通过；未来需按新 spec/phase 定逐 AC 验收。 |

此表不是当前材料已交付或用户已确认的声明；旧历史四维表不能充当本轮成功口径。待独立建议和最终真实用户确认后，才可把方向转为 build-plan 输入。

### 第二次方向确认被拒：六项缺具体规则（本轮待调研）

在 `card04-b2-direction-final` 的真实回复中，用户明确指出：「需求还是太粗糙了，六个需求都没确定的方案和细节，我看到的就有适用测试层、技能、可观察标准和证据的标准还没确定。其他的肯定更多，你的make-decision太粗糙了」。这是**拒绝最终确认**，不是同意 B2 方案已经充分设计；上方四维表仍只是待补草案，旧历史确认也不能替代它。已向用户承认过早提请批准，停留 make-decision；不得据草案更新 spec/phases。

本轮研究必须对 U-6 每项形成可复验的**输入→判定规则→输出及存放→失败/N/A/unknown→反例**，尤其查清：①业务知识从何而来、跨 feature 用例如何保持可用与变更失效；②Task 三层与 Phase 四层如何逐层判适用、由什么技能真实运行、什么情形需要服务/浏览器/设备及环境不可用如何处理；③业务可观察 oracle、测试运行身份和原始证据各应满足什么标准，如何将实际结果与 AC、结构和风险相比较；④任何失败、无效用例、环境中断的归因、修复、重算应测集、复测和保留旧证据规则；⑤可信基线、独立测试库存、未登记关联与同步漏登记的可见/不可见界线及安全执行；⑥verify-code 语义/外部依赖/低置信/高风险的具体处置和人工验收步骤。现有 `workflows/build-code/SKILL.md:85-97,169-220` 要求路由、选技能、实际测试与审查，但不能直接证明 B2 自动选择和逐例结果对账已存在；`skills/frontend-testing/SKILL.md:30-39` 仅规定真实浏览器证据要求，不等于本卡接线已经可用。研究中的替代方案、负例和授权障碍须逐项写明，只有答案可能改变用户可感知保障时再提出平实问题。

### U-6 #1/#5 详细方案候选：规划时怎样判每层测试（待讨论、非批准）

**输入和业务用例来源**：build-plan 分开读取原始需求锚点、此轮新增/改变/删除的行为、已有业务规则与真实消费者（现有产品文档、接口/数据合同及历史已证实行为）；记录来源版本、owner、冲突及未知。一个用例至少有稳定 ID、功能/回归意图、规则版本、正常/失败/边界与恢复场景、输入/状态前提、用户可观察的成功现象和反证、风险、外部依赖、影响触发/消费者与相邻用例、实际测试目标及预期运行身份、环境和维护人。形成**原始来源→业务规则及变化→功能/旧回归 case→FR/AC→Task/Phase→真实目标与 oracle** 两向表；只存在 case ID、测试文件名或 import 不证明规则正确/覆盖完整。来源相互冲突或未盘点的旧业务标 unknown，不能由模型猜业务结论。项目库版本化存这些业务关系，测试代码原位、执行事实只存任务事实；本卡初始仅收本卡与受影响回归，长期由项目需求/测试维护者随变化更新，退役须保留缘由。

**逐 Task 判定（每个 Tnnn 都填三层，不能只写一个合并 tier）**：下表是待证实的规则候选；`N/A` 需要真实代码/消费者证据证明无该 seam，缺工具/服务/环境则是 `unavailable`，不是 N/A。风险或关系不明为 unknown，不能跳测。各层必须有 case/AC、拟用技能、可重现环境/数据、准确目标/命令或真实步骤、预期原始产物、可观察成功/失败断言与覆盖限制；对**新增行为 Task 的目标行为**沿同一命令预置 RED→修复 GREEN，RED 若只是导入/环境报错不算有效，原有回归/非行为层不强求造 RED。

| 层 | 触发与可主张 N/A 的依据 | 拟用技能及可观察通过/反例 | 应保留的实际证据（规划时只声明期待） |
| --- | --- | --- | --- |
| 单元测试 | 有可隔离的决策、转换、状态或错误行为就适用；纯资料且无可执行行为可附差分/消费者证明 N/A。 | build-plan `testing-system-blueprint`；build-code 依实际路由选 `backend-testing` / `frontend-testing` / `fullstack-slice-testing` 其中一个具体技能，单技能不限制多测试层。命名目标的正常与关键负例/边界断言，新行为 Task 的同一目标命令 RED 应呈现目标行为失败、GREEN 呈现断言成立；原有回归或其他层不强求各自制造 RED；只测 mock 的关键接口或 0 tests 非通过。 | 精确测试身份与 runner 实报结果、命令/退出码/原始输出哈希、快照、夹具、失败到修复历史与适用限制。 |
| 代码测试 | 用户已选「自动代码检查」：对受影响代码/配置/接口按实际检查器适用性执行可失败的静态类型、构建、lint、schema/合同、diff 规则检查及其针对性反例；人工代码审查另列，不冒充此层。纯文档或经代码/消费者清查确无适用可执行规则才可 N/A；有规则但工具/环境不可用记 unavailable。 | 同一实际路由的具体 testing skill；限定改动范围的工具规则可检测目标缺陷，正常检查成功且负控确证检查不会静默放过错误。只运行无关工具、掩盖 warning 或未收集目标是未证明。 | 工具及版本、准确目标/命令、规则/诊断、退出码/原始输出/快照、负控及不覆盖规则；工具不可用记 unavailable。 |
| 接口测试 | 暴露或消费 HTTP/CLI/服务导出/协议/序列化/持久化边界时适用（包括跨 Task 旧消费者）；无公开或跨模块边界须给出消费者清查才可 N/A。 | 真实入口和下游消费者，对有效与无效请求核精确响应/退出、错误、权限、状态/数据副作用及恢复；纯 mock 或服务身份不明不能证明接口效果。 | 请求/响应及状态原件（敏感值脱敏）、服务/版本/fixture/cleanup 身份、测试身份/退出/输出哈希与当前快照、覆盖限制。 |

**逐 Phase 判定**：汇总 Task 的三层**并另设计跨 Task/真实消费者/完整用户旅程的独立 case 和 oracle**；Phase 的单元、代码、接口三层各写适用/理由、技能、执行目标、产物和通过/失败标准，不靠各 Task 都绿就算 Phase E2E。第四层 UI 实机：若存在真实页面/交互消费者、前端改动，或业务效果必须经浏览器/设备观察，即适用；无页面/交互消费者且入口库存证明仅 CLI/非 UI 才可 N/A；浏览器/服务不存在时标 unavailable。适用时须建立 B2 业务关系触发的受控浏览器消费者，复用 `isolated-browser-qa` 的隔离与证据要求，并核实如何与 `frontend-testing` 的官方 handler 配合：后者现仅在实际前端 changed files 触发，后台改动影响真实页面消费者的路径尚缺接线、不可谎称已跑；必须以当前服务/API/DTO 身份、隔离 profile、viewport、真实动作、正常及 loading/empty/error/cancel/权限/恢复负例、DOM/视觉/无障碍/console/network/focus/overflow 观察、截图及 cleanup 证据判定；只有组件 fixture、普通 shell exit 0、身份错绑或 cleanup 失败不能称真实 UI 通过（`skills/frontend-testing/SKILL.md:9-39`）。本卡自身没有已知 UI 改动，不等于交付的系统可省掉未来适用 UI 的测试路由设计；真实浏览器结果接线必须由后续实验证明，当前仅为目标。

**技能与角色时序**：build-plan 用 `skills/testing-system-blueprint/SKILL.md:9-28` 设计，再用 `test-routing-advisor` 预判 simple/feature/fullstack；build-code 基于实际 changed files 再路由，调用 `backend-testing`（`skills/backend-testing/SKILL.md:9-18`）、`frontend-testing` 或 `fullstack-slice-testing`（`skills/fullstack-slice-testing/SKILL.md:9-19`）的一个适用具体技能，实际执行哪几层与调用事实进任务证据，不能把技能名写在 Phase 就当已测（`workflows/build-code/SKILL.md:85-97,169-220`）。具体 Phase/Task 作者字段优先沿用 `skills/spec-plan/templates/phase-template.md`，在现有唯一 Task card 的 Test tier / skill 与 Phase gate 附逐层子表，不建并行台账；`runtime/stage/stage-content-contracts.mjs:6839-7033` 当前只验 17 项 Task 标签和 Phase 拓扑/命令，**不**语义核验每层适用与结论，不能把新子表称为已被机器把关。实际任务 stage row 在 `runtime/task/task-store.mjs:219-227,264-280,318-364` 固定 16 字段，evidence 条目仅 command/exit_code/failure_signature；逐层/逐例结果须通过既有任务证据与 canonical receipt 的引用映射来落实，且验证可消费性，不得私加 row 字段或凭 Phase 文本冒充运行事实；`runtime/task/task-store.mjs:391-416` 同阶段 row 可被替换，故“保留旧失败”必须核对不可变旧 receipt/原始输出的可达引用和后续新 receipt 处置链，不能依赖 row 自身追加。现有结构校验不验证新矩阵语义、技能是否真的调用、逐层实际结论与材料→receipt 绑定；无专门消费者及失败负控前明确未证明。规划时逐层预期结果/通过标准，执行后逐 case 核**runner 实报测试身份、断言效果、快照和原件**；结果相反是 failed，漏测/零测试/缺证据是未证明，真实不适用须有消费者证据。代码覆盖百分比只能诊断。

**本轮真实 Talk 对术语的答复（只解决解释，不是最终方案批准）**：用户选择「自动代码检查」：按受影响代码运行类型/构建/静态规则/合同等可失败的自动检查，人工 review 是另一质量事实。用户选择「真实浏览器即可」：连接实际运行服务、操作真实页面，保存截图/网络/控制台等证据；存在移动端或设备特性时另加相应物理设备，普通 fixture 或浏览器仿真不能冒充真实物理设备。纯 Task 计划 B1 无法发现旧回归漏列，已选 B2 业务影响关系+独立库存；代价是关系维护、可信来源与实际身份接线，未登记业务知识仍不能机器推断。既有 Phase Task 只有一个主 test tier/技能和 gate_cmd，新增逐层适用/目标/oracle/结果宜作为其内部逐层记录复用唯一 Task authority；行为 Task 的 RED/GREEN 共享目标门，不强制每个旧回归/每层另造 RED。UI 可能由后台改动的真实页面消费者触发，此时旧 `frontend-testing` 的前端变更限定不能独自证明自动浏览器运行；必须设计并负测业务关系触发→受控浏览器实际执行→服务/页面/场景身份及截图网络原件→当前快照对账的接线，否则该层 unknown/unavailable，绝不宣称 UI pass。

### U-6 #2/#3/#4 详细方案候选：从真实改动到逐例结论与修复（待讨论、非批准）

**关键现状反证**：`runtime/task/workspace.mjs:419-440` 对已存在 worktree 取**当前 HEAD** 当 `baselineCommit`；`runtime/evidence/canonical-receipt-writer.mjs:397-414` 从该基线做 diff，因此已提交的本任务变化可能因当前 HEAD 等于基线而不可见。当前 capture 可证明调用者给出的命令及原始输出绑定某快照，却不能证明受影响业务选全、runner 实际逐例结果、业务 oracle 正确。不能把这两条旧机制拼起来就写 B2 已可用。

**从输入到执行的候选算法**（真实接线及写面待 build-plan 试验）：①在任务启动时取得不可随工作区 HEAD 漂移的可信起点 commit/tree 和任务身份；每次修复取当前 Git 源码快照/tree（追踪已提交、暂存、未暂存和应纳入的未追踪文件），记录序列与证据绑定；起点缺失、历史差分不可见、快照来源错绑或差分覆盖有歧义报 `unknown_change_scope`。②同一快照的项目业务 case 库与独立测试发现/入口库存双向核对：由实际差分匹配登记的路径/接口/消费者触发，再沿依赖边扩展旧回归及 Phase 跨 Task 旅程；已发现测试未登记、登记目标删改/错名、产品改动无业务映射、库存缺失或无法认证分别给 unknown，不许空集绿；双方同步遗漏的业务知识仍是不可自动推断的未证明界线。③仅把受控、存在且唯一的测试目标解析为安全定向执行（固定且校验的命令或不经 shell 的 argv，不用发现的路径直接拼入 `sh -c`）；对可自动化的适用单元/代码/API/真实 UI 分别实际运行。`skills/test-routing-advisor` 只会分 simple/feature/fullstack，`workflows/build-code/capture.mjs` 只接现成命令，故需要明确的新消费者而不是声称旧路径已自动选测。④receipt 仍负责原始运行/快照；另从真实 runner 报告解析文件+完整测试名+实际状态（含 skipped/todo/重复/缺失）并与期望 case→测试身份一一核对，再检查目标行为的可观察断言、AC 与结构问题/风险。即使退出 0，若 runner 报 0 tests/缺目标身份/缺结果/只有模拟关键外部 seam/原件错绑，也不能为业务 case 标通过。

**一条 case 的可复核结果合同候选**：`{case_id, rule/source_revision, task/phase_id, ac_id, expected_runner_target, observed_runner_identity_and_status, business_precondition_and_input, expected_observable_effect_and_failure_signal, actual_observation_and_assertion, applicability_and_skill, environment/service_identity, snapshot_start/current, exact_execution_ref_and_hash, raw_result_ref_and_hash, coverage_limit, structural_issue, residual_risk, verdict_and_reason}`；这是任务质量事实的逻辑字段，不是新持久状态机或另建证据账本。通过仅限适用目标在当前快照真实执行、预期正反例和业务可观察结果与 AC 一致、逐例结果/原件身份可信；结果相反是失败，未选/未跑/skip/零测试/缺原件/源陈旧/环境不可用/身份不符各保持未证明或真实失败；仅有真实无消费者及差分依据才允许 N/A。Phase 须另核跨 Task 与真实旅程，不能把 Task 绿色数求和。外部服务与 UI 需要当前服务/DTO/browser/截图/cleanup 等事实，普通 shell receipt 不够（`skills/frontend-testing/SKILL.md:30-39`）。「结构」逐例记录模块/接口/数据流/消费者/权限/恢复等结构性偏差，**不**默换成“结果”；风险记录影响范围、失败后果、未覆盖依赖及 owner。覆盖率仅诊断。

**任何测试问题的同任务闭环**：系统保留原失败/不稳定/漏选/失效 oracle/测试目标/夹具或环境不可用的原件、类型、归因、owner 和影响的 case/AC；在任务关闭前修复产品代码、用例/业务 oracle、测试或环境，生成新源码快照并重新算应测集合（连同修改的测试/目录/依赖关系和邻近回归），重新运行并产生新 receipt 与逐例结论，旧失败仅追加处置链接不覆写。未解决/不可用继续为失败或 unknown，严重风险按现有接受/修复制度真实处置；任务已关闭则按现有后续工作另记，不伪称重开。单纯重跑旧快照、只保留最后绿、用人日常核对、用覆盖率替代行为证明均为不合格反例。

**最低负控**：已提交但 worktree 干净、暂存+未暂存+未追踪、无可信起点、改代码后旧 receipt、重命名/删除、恶意路径、改动产品文件无映射、登记 target 不存在/重复/skipped/0 tests、命令 0 但断言身份缺失、缓存证据删改、mock API 冒真、浏览器服务/证据/cleanup 失败。独立库存可见范围内同步删 Task/用例关系应暴露 unknown；**业务规则与库存两侧都从未登记**无法自动防漏，需如实呈现存量未盘点范围。最小路径可研究 `workflows/build-code/` 私有选择/对账消费者、现有任务事实和 canonical receipt；独立 UI 路径若仅保存受控浏览器原件，尚须验明能否在**官方 build-code 事实/逐 AC 口径**中消费，不可另起一套“已通过”权威。实查 `runtime/stage/stage-handlers.mjs:1041-1095` 对 authenticated backend/non_ui 不运行受控 QA，`runtime/stage/stage-content-contracts.mjs:7992-7995` 在 post acceptance 拒 `browser`，且 `tools/cli/stage-runtime.mjs:872-886,1527-1533` 仅透传可选 `runControlledUiQa`、并无已证实生产浏览器 adapter；真实浏览器对后台消费者的自动实跑不能声称既有支持。本轮 R-018 只允许在 CARD-05 落地后以失败负控证明必要性，**提出**涉及 `runtime/stage/**` 的最小写集并另行审查；尚未获具体文件修改许可，CARD-05 落地前不改它。若后续不获实施授权，该项仍未实现/unknown，不能将 B2 偷降成 B1。UI 负控至少包括后台差分关联真页面却被 N/A、post browser 被拒、没有真实 adapter、错服务/DTO/场景或截图 hash、仅 fixture、取消或 cleanup 失败。

### U-6 #6 详细方案候选：verify-code 后如何给出可执行的验收判断（待讨论、非批准）

**复用既有时序而非新阶段**：`workflows/verify-code/SKILL.md:69-79,107-156` 已有原始来源到 AC/Task/真实证据的独立语义抽查、代码审查、handoff 与真实用户确认槽位。针对“verify-code 结束后”，本轮真实 Talk 用户选择「现有最后确认符合」：先完成机器测试和独立审查，再交付业务验收说明并由授权者沿现有 verify-code 最后确认槽位作答；不新增阶段或第四确认。这只是时点解释，不是 D-009…014 最终批准。build-code 逐例机器对账与 verify-code 独立语义**抽查**必须分开报告：后者说明为何选这些高风险/跨 Phase/失败恢复 case，准确列出抽查与未抽查 ID、不能用 code review `passed` 推出业务通过。

**每个受影响 AC 的机器事实输入→抽样语义判定→输出**：机器对账在 build-code 覆盖每条受影响 AC；verify-code 依据风险选样独立复核，未抽样的 AC 保留机器事实并明确未受独立语义复核，不承诺 verify-code 再做全量语义审查。锁定任务/原始需求与业务规则版本、受影响功能及反例、实际消费者、实现/环境快照，将来源→已确认决策→FR/AC→case→Phase/Task→真实入口及运行实报身份→不可变证据串起来；缺原始依据/关系/当前证据记 unknown 并指定补证 owner。对抽样的正、负、边界、回归及跨 Task 旅程，重新用原需求描述业务成功与失败可观察结果，核测试断言能否识别“代码返回绿但业务效果错”的反例；实际效果不符判 failed、仅命令 exit 0 或名字相符不算语义合格。输出把 `business_effect=observed_pass|observed_fail|unknown|unavailable|N/A(reason)`、`semantic_test_adequacy=adequate|inadequate|unknown` 与 `code_review=clean|resolved|incomplete|failed` 分开，并列快照、原件 ref/hash、未复核范围、每项 AC 的限制，不新设事实权威。

**依赖、低置信与高风险的处置规则**：逐 AC 列外部服务/供应商/版本/API、真实或模拟、必要权限与数据、健康/超时/故障/回滚及实际日志；模拟结果不能冒充真实外部效果，N/A 要有不存在真实消费者的证据，unavailable 要留时间、尝试入口、错误、影响、责任人与下一步。低置信列假设、来源缺口、旧案例未盘点、库关系陈旧/冲突、不稳定测试和可反驳它的独立证据；不未经用户授权创数值置信阈值。金钱、隐私、权限、不可逆操作、外部副作用、并发恢复及跨 Phase 旅程列业务后果、影响面、正例与拒绝/恢复效果、审查 finding、缓解及残余风险。严重 finding 只能真实修复并复测、附证明判误报、由有权限者显式接受具体风险，或保留待人裁定；不因评审“干净”自动接受未证实业务效果。

**人的验收仅承担机器无法判定的剩余业务语义/真实外部效果**：handoff 必须给授权的业务验收者（非实施者自证）可用环境与安全权限、数据准备、精确入口和操作、可观察的成功**及**失败/拒绝/回滚判据、需要返回的日志/截图/交易号及时间/引用、失败后的责任人与修复或明示风险接受路径。验收者回复的具体证据与接受/拒绝/延期在现有 verify-code 确认记录中绑定；无答复、环境不可用或证据不符不写业务通过。任务关闭前发现问题走同任务修复与新快照定向复测；关闭后建立另一个授权后续工作，不伪造原任务重开。

**仅作为解释而非本卡业务用例的反例**：“取消订单不应扣款”，运行结果 HTTP 200、状态 cancelled 却使账本扣 10 元，属于业务 failed，即使命令绿；修复后新快照实际账本余额不变也只证明本次环境。若支付商沙箱不可用，真实清算效果仍 unavailable，授权财务验收者在有许可环境中核交易账本、重复取消和延迟清算，任何扣款/重复变动即拒绝；不得让他代替系统每天选测/跑测/逐例对账。仍须验证实际 CARD-04 的消费者、最小写面与现有事实接线；若碰 CARD-05 或禁止范围，另行裁定而不是暗中缩成文档方案。

### 增量风险与待批准项

- 旧范围的 canonical `non_ui` 不意味着未来 UI 项目免测，也不能无证据套到本轮新增写面：本卡实际交付面须冻结后重核三输入；真实 UI 测试按实际交付面适用，外部服务或真实部署不可用只能披露未验证，不能创建伪造成功场景。
- CARD-05 落地、库路径与维护入口、现有存量的未盘点量、逐功能可执行阈值均未确定；build-plan 只能在用户确认本轮方向后给出有界可核查方案。
- 本轮独立方向建议、Grill、细节建议已取得；下节已记录针对六项方案的真实最终方向确认。既有 build-plan `human_confirmation` 不覆盖此轮新方向或之后修改的材料；正式 build-plan 仍须重新校验和取得单独人工确认。受保护 `runtime/stage/**` 的具体修改仍须另批。

### 本轮增量最终确认（D-009…D-014 的方向，不含 build-plan 或生产写面批准）

在先展示六项**逐项实施机制、失败判据与限制**后，向用户真实提出 `card04-six-item-detailed-direction`：「在上方逐项机制、失败判据及未实现边界的前提下，是否确认 D-009…D-014 为 CARD-04 新的 make-decision 方向，并允许随后按这份已确认决策修订 spec/phases？这不批准现在修改受保护的 runtime/stage/**。」用户选择「确认方向，继续修订 build-plan」。本次确认范围：一份项目版本化业务用例库（CARD-04/受影响回归先收，其他历史未盘点）、可信变更范围与已登记业务关系驱动自动选测/实际执行/逐例证据对账、逐 Task 三层与逐 Phase 四层适用/技能/observable oracle、问题同任务留旧证据并按新快照复测、verify-code 独立抽样语义/依赖/置信/风险与现有最终授权业务验收。未知业务关系不宣称自动发现；真实 UI adapter、逐 AC 官方事实及受保护接线尚未实现。R-018 仅允许 CARD-05 落地后提出有负控的最小写面方案并另行审查，**没有授权改 `runtime/stage/**`、没有批准当前或未来 build-plan**。

历史「方向确认被拒」段保留拒绝当时浅方案的事实，不得把后来真实批准倒填为当时已获批准。D-009…D-014 现为方向已确认、实施/路径/条件结论仍待 build-plan 核实；若发现必要写面与权限冲突或外部环境不可用，必须单独裁定并如实列未知，而不能静默缩减用户已确认的六项结果。

### 本轮预置测试断言目标修订授权（仅测试，不扩权）

在独立审查发现 P9/T018 和 P10/T020–021 的已冻结 RED 断言指向本卡禁改的旧 `runtime/task/workspace.mjs` 与测试专用 `accept()`，P9/T019 又只有全绿路径清单 G-2，因而原 gate 无法从可写模块转 GREEN 后，用户对 `card04-frozen-test-seam-correction` 真实选择「允许按上述约束修订测试（推荐）」。授权范围仅为 P9/T018、T019、P10/T020、T021 预置测试的断言目标修订：保留修订前测试原字节和原始 RED/G-2 原件，写明变更理由并取得独立审查，在**任何生产实现前**运行修订后限定命令并取得真正目标断言 RED（不得以 import/setup 错误冒红）。新断言须瞄准可合法修改且真实被消费的接口，不放宽业务效果、实际执行、逐例身份、坏路径/快照负控；未找到合法 seam 就继续 G-2/not_done。这次答复没有许可生产代码、`runtime/task/**`、`runtime/stage/**`、`runtime/evidence/**` 或 P11 浏览器接线，也不是新版 build-plan 的最终确认。

## 需求变更记录

以下是供 `deriveDecisionLogOriginalSourceCensus` 读取的原始来源形态；历史 `## 原始声明层` 的 U-1…U-5 与上文 :2163-2175 的 U-6 原样保留。下方 U-001…U-005 仅转录已有引号**内部**的用户原词，U-005 的两句仍是两段引文而非「以及」拼成的一句；U-006 仅转录六个已有引用行（保留「结构和风险」）。这不是新增用户答复或扩大批准。R-004/R-005 旧表格虽然标了「用户逐字」，其需求摘要并非逐字引文，以本节对应 U 引文为准；R-001…R-003 是母材料派生，R-006 是外部文章，R-010…R-018 的摘要/选择也不是在本节伪造的逐字 U/V。原 R 编号、历史处置及旧待确认表述保持其当时语境；D-009…D-014 只获 :2404-2408 的方向确认，不是 build-plan 确认或生产写面许可。

### U-001 — 原 U-1（:93，m00006 第 5 条）

> 以 <https://www.i-kh.net/p/if-ai-coding-is-lowering-your-code> 为参考，仔细设计整个 workflowhub 的验收标准、测试流程、真实验收，让每个通过 workflowhub 开发的项目有完整的单元测试和端到端测试，而不是做一个功能补一点测试，避免功能多了之后测试文件大量堆积、完全没有系统化考虑和优化。

### U-002 — 原 U-2（:94，m00314）

> 我希望当前的 card-04 任务能以"<https://www.i-kh.net/p/if-ai-coding-is-lowering-your-code>"为参考，仔细设计整个 workflowhub 的验收标准、测试流程、真实验收。让每个通过 workflowhub 开发的项目能有完整的单元测试和端到端测试。而不是做一个功能补一点，导致功能多了之后大量测试文件，完全没有系统化的考虑和优化！

### U-003 — 原 U-3（:95，m00006）

> 先派出多个子代理仔细研究如下 build-code 和 verify-code 的会话，看看这些任务的验收标准是不是设计的很差？每个 phase 和 task 的单元测试和端到端测试是不是质量非常差？为什么每个任务一直有各种遗漏和返工？如何通过 make-decision 和 build-plan 仔细设计任务的验收标准、测试流程，保证每个 phase 与 task 高质量交付、减少返工？

### U-004 — 原 U-4（:96，m00006）

> 主会话只进行任务规划、子代理任务派发和交互类技能（Talk、Grill）的执行，不要进行大量阅读和执行任务

### U-005 — 原 U-5（:97，母任务语料中来自 card-07 build-plan 会话的两段引文）

> 有严重问题…现在这些 phase 文件极其简陋，丢失了大量实现细节！请检查 phase 技能在哪里？phase 文件模板在哪里？为什么会质量这么差？
> build-plan 还没结束啊，spec 和 phase 改动也没提交到 main 啊，怎么就开始 build-code 了？我没同意！

### U-006 — 原 U-6（:2163-2175，m02822；六项逐字）

> 1：在build-plan阶段，spec和phase中，需要结合原始需求，生成测试用例和验收标准。要很好的结合需求、变更和业务知识。保证测试用例未来能通用，能进行功能测试和回归测试；
> 2：在build-code阶段，需要基于实现好的代码，执行测试与效果评测。包括单元测试、代码测试、接口测试、UI实机测试；
> 3：在build-code阶段，需要基于测试过程，保留可复核的证据，对照验收标准，判定结构和风险；
> 4：测试有任何问题，需要有完善的修复、重新验证、测试用例和证据更新机制。
> 5：在build-plan阶段就需要判断每个task需要有哪些单元测试、代码测试、接口测试？每个phase需要有哪些单元测试、代码测试、接口测试、UI实机测试？以及分别需要用什么技能进行测试？要保留什么样的结果？测试通过的标准是怎样？
> 6：verify-code阶段结束后，需要进行需求和测试的语义判断、外部依赖判断、低置信度判断和高风险判断。并且给出人工验收的标准和流程。

拆分项仅重复原 U-6 六个行内完整原句，编号用于逐项检查，不构成六条新答复：

| atom_id | 原 U-6 对应逐字句 | 定位 |
| --- | --- | --- |
| U-006-01 | 1：在build-plan阶段，spec和phase中，需要结合原始需求，生成测试用例和验收标准。要很好的结合需求、变更和业务知识。保证测试用例未来能通用，能进行功能测试和回归测试； | :2165；D-010、D-011 |
| U-006-02 | 2：在build-code阶段，需要基于实现好的代码，执行测试与效果评测。包括单元测试、代码测试、接口测试、UI实机测试； | :2167；D-012 |
| U-006-03 | 3：在build-code阶段，需要基于测试过程，保留可复核的证据，对照验收标准，判定结构和风险； | :2169；D-013 |
| U-006-04 | 4：测试有任何问题，需要有完善的修复、重新验证、测试用例和证据更新机制。 | :2171；D-013 |
| U-006-05 | 5：在build-plan阶段就需要判断每个task需要有哪些单元测试、代码测试、接口测试？每个phase需要有哪些单元测试、代码测试、接口测试、UI实机测试？以及分别需要用什么技能进行测试？要保留什么样的结果？测试通过的标准是怎样？ | :2173；D-011 |
| U-006-06 | 6：verify-code阶段结束后，需要进行需求和测试的语义判断、外部依赖判断、低置信度判断和高风险判断。并且给出人工验收的标准和流程。 | :2175；D-014 |

## 原始需求索引

这里的 R 是原 `## 原始需求` :66-83 已有编号的追溯边，不是新的原始引文；索引第三列单列一个已有决定作可解析锚点，其他相关决定仍以原 R 表和上方 U-006 原子定位为准。外部文章、母 PRD/决定及结构化选择不冒充用户逐字。R-007 对 U-005 仅标记历史「未获同意不得提前推进」的流程约束，非将 card-07 两句改写为本卡的新功能诉求。

| R | 来源（原始 U/V 或既有派生材料） | D |
| --- | --- | --- |
| R-001 | 母 PRD CARD-04 :322-352（派生，非 U/V） | D-003 |
| R-002 | 母 PRD 共享定义 :25-96（派生，非 U/V） | D-001 |
| R-003 | 母 decision-log OI-004（派生，非 U/V） | D-001 |
| R-004 | U-001（原 U-1；历史 R 摘要不作逐字） | D-006 |
| R-005 | U-002（原 U-2；历史 R 摘要不作逐字） | D-007 |
| R-006 | 外部基准文章（研究，不是用户引文） | D-007 |
| R-007 | U-004、U-005（流程纪律；U-005 是 card-07 历史教训，非本卡新批准） | D-002 |
| R-008 | U-003、V-001（返工与质量准绳，V 来自本文件 :26） | D-007 |
| R-009 | U-006、U-006-01~06（六项原话；分项对应 D-010…D-014 见上方 atom 定位） | D-009 |
| R-010 | m02902/m02962 用户请求与结构化范围答复（已有 R 记录，非本节逐字 U/V） | D-009 |
| R-011 | m02966 结构化用例库答复（已有 R 记录，非本节逐字 U/V） | D-010 |
| R-012 | m02966 结构化测试适用性/证据答复（已有 R 记录，非本节逐字 U/V） | D-012 |
| R-013 | m02976 结构化索引答复（已有 R 记录，非本节逐字 U/V） | D-010 |
| R-014 | m02982 结构化库位置/起始覆盖答复（已有 R 记录，非本节逐字 U/V） | D-010 |
| R-015 | meaning-code-test 结构化术语答复（已有 R 记录，非本节逐字 U/V） | D-011 |
| R-016 | meaning-real-device-ui 结构化术语答复（已有 R 记录，非本节逐字 U/V） | D-012 |
| R-017 | post-verify-acceptance-time 结构化时点答复（已有 R 记录，非本节逐字 U/V） | D-014 |
| R-018 | card04-post-browser-protected-write 条件研究授权（已有 R 记录；未批准写代码） | D-009 |

## 逐字声明层（verbatim）

V-001 是现有 :26 明示「用户确认新方向（step 5 答复，逐字）」引号内部的真实短句摘录；它与该处整句仍保留原样，不将历史摘要、外部文章或结构化答复捏造成用户原话。此句并未包含在上列六段 U 全文内，所以单独编号并索引到原 R-008；不是凭空添加一次用户批准。

| V | 说话人 | 来源定位 | 原文摘录 |
| --- | --- | --- | --- |
| V-001 | 用户 | 本文件 :26，step 5 答复逐字片段 | 我要的不是流程正确，而是质量合格 |

## 来源归属勘误：SD-13 与可执行验收

- **保留历史原文，不追认误引**：本文件原始需求 R-002（:67）把 SD-13 写成「验收标准五段式」；历史审查处置（:1727、:1749、:1785）沿用了这一前提。这些行保留作原始记录，读作当时的误归属，不再用来证明 SD-13 定义了五段式，也不因此抹去审查当时指出的追踪缺口。`spec.md` 上游覆盖账本原 SD-13 行亦按下述母来源更正。
- **SD-13 的实际定义与分工**：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:77-79` 明定 build-prd 两个**命名可检查交付项**：①具体重构验收标准，含可观察成功/失败用例、所需证据、承接负责人，**由 CARD-10 执行**；②可测量的「无重复契约」标准，即同一事实只有一个权威文件，不得两个文件各自声明权威，**由 CARD-02 执行**。本卡不能把两项改写成本卡五段式验收，也不冒称已执行。
- **本卡可执行验收的正确来源**：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:322-340` 的 CARD-04/FR-16/AC-16，以及 `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md:258-272` 的 OI-004，要求逐条写明**条件→系统行为、可度量的成功标准、至少一条失败或边界场景**；写不出须标 `incomplete`，不得伪造。按展示拆成更多栏（例如五栏）仅是本地排版，不是 SD-13 的权威五段定义，也不替代真实任务、真实入口与证据的验收。

## 2026-09-27 ADR 编号迁移（当前执行索引）

D-008 的原始答复选择 ADR-0032，以上历史原话、旧检查输出和旧审查记录不改。CARD-05 的 ADR-0032 已被 Git 跟踪；本卡新 ADR 改用当前空闲的 ADR-0033，当前路径为 `docs/adr/0033-acceptance-truth-presentation-and-cohort-parity.md`。本卡 P1、spec 和相位索引的现行命令与引用以 0033 为准；迁号只解决编号冲突，不追认旧证据为同版通过，也不改变 D-008 的方向或入库时机。

## UI applicability

2026-09-27 当前范围复核：前一节同名记录及用户当时的 `non_ui` 答复对应早期 R-001..R-008 和当时较窄的改动范围，原文仍保留。现在的 R-011..R-018 要求检查后台改动是否影响真实页面；当前入口清单没有可启动的业务页面或已认证的后台到页面调用链。旧答复不能证明当前范围的页面检查“不适用”，也尚无针对当前范围的用户裁定。

```json
{
  "result": "unknown",
  "sources": {
    "raw_requirement": {
      "result": "unknown",
      "fact": "R-011..R-018 包含后台改动可能影响真实页面时的浏览器检查要求；本卡当前受影响业务用例到页面的关系未核实"
    },
    "project_inventory": {
      "result": "unknown",
      "fact": "当前入口清单只找到命令和测试入口，没有可启动的业务页面或已认证的页面到服务调用链；这不能证明外部页面不存在"
    },
    "planned_or_changed_frontend_fact": {
      "result": "unknown",
      "fact": "当前改动含后台运行与验收路径；尚未核实这些改动是否有页面消费者，不能仅凭没有直接修改前端文件判定不适用"
    }
  },
  "reason": "当前范围的真实页面消费者、页面地址和服务来源尚未核实；旧范围的 non_ui 答复不能沿用为当前结果",
  "handoff": "make-decision：取得当前范围的真实页面消费者和服务事实及用户裁定后，更新这三项来源并重新计算适用性",
  "gate": false
}
```
