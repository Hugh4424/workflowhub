# decision-log.md — workflowhub-cost-baseline-and-blocker-close-20260917

## 任务身份

- task_id: `workflowhub-cost-baseline-and-blocker-close-20260917`
- project: `workflowhub`
- **任务类型**: 普通任务
- target_repo_root: `/Users/Hugh/Hugh/Project/workflowhub`
- worktree_root: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-cost-baseline-and-blocker-close-20260917`
- branch: `task/workflowhub/workflowhub-cost-baseline-and-blocker-close-20260917`
- baseline_commit: `160778878912124c292f1beb0e5008299c396743`
- task_store: `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-cost-baseline-and-blocker-close-20260917`
- 当前阶段: `make-decision`

### 类型声明来源

用户在 2026-09-17 的结构化问答中原话选定「普通任务：真改代码，一路做到 verify-code 收口」。
本字段为纯声明，不由路径、请求措辞或历史记录推断。

## 原始需求

用户在 2026-09-17 的原话（本会话消息，逐字保留，作为唯一需求权威）：

> 我在做"/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-mechanism-simplification-20260910"任务的时候，发现这些任务全做完了之后，workflowhub还是有很多阻塞和问题，包括耗时很长、token浪费很多等等，后来我又做了一个"/Users/Hugh/Hugh/Project/workflowhub/specs/archive/workflowhub-mechanism-waste-reduction-20260915"任务，但是我觉得时间和token消耗还是挺大的。另外还有一些遗漏的任务需要继续做"/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md"，请你检查一下接下来该做什么？我希望把遗漏的任务都做完，同时再看看token和时间消耗还有没有优化的地方。
>
> 请你先仔细阅读和调研这些文件内容，然后我希望现在按标准 WorkflowHub 开始这个改进任务，先创建worktree，然后从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项，Talk 和grill请用大白话说明选项、后果和风险。注意主会话只进行子代理任务派发，不要进行大量阅读和执行任务，保证主会话上下文控制和执行质量。

**需求覆盖矩阵（逐条对应决定）**

| source_id | 需求/约束摘要 | 来源引用/原文摘录 | 消息类别 | 关联决定 | 处理状态 |
|---|---|---|---|---|---|
| R-001 | 找出耗时很长、token 浪费很多的根本原因并做针对性修复 | 用户原文：「我只是希望你找到阻塞和浪费的根本原因，进行针对性的修复！」 | goal | D-003、D-004、D-005、D-006、D-011、D-012 | covered |
| R-002 | 把遗漏的任务都做完（DEF-01~DEF-07 逐条处置） | 用户原文：「我希望把遗漏的任务都做完」 | goal | D-013、D-016 | covered |
| R-003 | 不跳阶段、不依赖 build-spec 补需求 | 用户原文：「不要跳阶段，也不要依赖 build-spec 补需求」 | flow_or_surface | D-001、D-007 | covered |
| R-004 | 主会话只做子代理派发，控制主上下文；Talk 与 grill 用大白话讲选项、后果与风险 | 用户原文：「注意主会话只进行子代理任务派发，不要进行大量阅读和执行任务」「Talk 和grill请用大白话说明选项、后果和风险」 | flow_or_surface | D-001、D-009 | covered |
| R-005 | 不新增统计、收集类功能（M15 已确认只会更臃肿） | 用户原文：「我不希望你加一大堆统计、收集类的功能在workflowhub里面」 | constraint_non_goal_defer | D-008、D-009、D-018 | covered |
| R-006 | 正常问题确认、stage 收尾确认、talk/grill 交互确认都是正常工作方式，不得改动 | 用户原文：「正常有问题就需要找我确认，stage结尾需要我确认，talk、grill等交互类的问题也要我确认」 | constraint_non_goal_defer | D-001、D-008 | covered |
| R-007 | 彻底解决 antigravity 根因，不得改配置、不得收敛为 1+1 | 用户原文：「不要改配置啊，我需要你彻底解决antigravity有问题的根本原因」 | success_failure_acceptance | D-019、D-011 | covered |
| R-008 | 维持零页面，相关信息只走既有 CLI 文本输出 | 用户原文与选项：「维持零页面，成本数据只走文本输出」 | flow_or_surface | D-017 | covered |
| R-009 | 范围确定后把所有延期项更新到 Downloads 延期文件 | 用户原文：「确定当前任务的范围后，把所有延期项更新到"/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md"中」 | constraint_non_goal_defer | D-013、D-016 | covered |
| R-010 | 每条修复合乎净减或持平，材料写明行数变化 | 用户原文：「这些额外的东西只会让整个workflowhub变的更臃肿更难维护」；选项卡 OI-18 选择净减或持平 | data_or_state | D-018、D-020、D-022、D-023、D-024、D-025 | covered |
| R-011 | 只用读代码与既有落盘事实定位根因，不新增采集面 | 用户纠正原话与 OI-09 处置 | data_or_state | D-009、D-014 | covered |
| R-012 | 两个红灯（check-skill-closure、smoke-local-skill-dispatch）顺带修掉 | 选项卡 OI-15 选择「顺带修掉这两个红灯」 | success_failure_acceptance | D-015、D-020 | covered |
| R-013 | 剩余 OI 本轮全部定案，每条修复写出逐项通过/失败判据 | 选项卡 OI-07 答复：「剩 3 条 OI 本轮全部定案，且每条修复写出逐项通过/失败判据」 | success_failure_acceptance | D-007 | covered |
| R-014 | 质量事实不得谎报（只发布方向审查时不得记 detail_review 已完成） | 选项卡 OI-21 选择「纳入本轮修掉」 | data_or_state | D-021 | covered |
| R-015 | 派发前预检要做好，有问题的 provider 在开工前就被拦下 | 用户原文：「1.开始之前的预检要做好，有问题的provider就别开始」 | success_failure_acceptance | D-022 | covered |
| R-016 | 审查中健康检测要做好，有问题立刻停止或重发；超时口径确认为 20 分钟 | 用户原文：「改成20分钟」「2.审查中的健康检测要做好，有问题立刻停止或重发」「我不希望每一次审查都要久直到才知道失败了」 | success_failure_acceptance | D-023、D-025 | covered |
| R-017 | 输入/输出格式宽容化，目标是拿到异源审查建议；宽容格式但不降 7 条红线 | 用户原文：「3.不要再因为输入或输出格式问题导致审查失败了，太浪费时间和token了，需要对整体输入和输出宽容一些，目标是获取异源审查建议，不是一份内容详细格式正确的审查报告！」 | success_failure_acceptance | D-024 | covered |
| R-018 | 收口命令耗时一个多小时属重大浪费；要查根因并治理「材料写入使已发布确认与交互聚合失效、迫使重复确认与重发聚合」的重绑级联 | 用户本轮原话：「当前一个收口的命令都做了1个多小时，这就是整个workflowhub特别浪费时间和token的重要表现，请检查根本原因，看看到底为什么会这么浪费时间？当前任务有没有治理这个类似的问题？」 | data_or_state | D-026 | covered |


### 处置口径（逐条对应需求）

| 维度 | 用户原话要点 | 本任务处置 |
|---|---|---|
| 问题 | 「全做完了之后，workflowhub 还是有很多阻塞和问题，包括耗时很长、token 浪费很多」 | 立可实测的成本基线并打掉四条最大阻塞（OI-03~OI-06） |
| 期望 | 「把遗漏的任务都做完」+「再看看 token 和时间消耗还有没有优化的地方」 | DEF-01~07 逐条当场判做/取消（OI-13、OI-16）；成本优化走 OI-09~OI-12 |
| 期望 | 「检查一下接下来该做什么」 | 已完成：七个子代理只读调研，结论见 `## 调研` |
| 约束 | 「不要跳阶段，也不要依赖 build-spec 补需求」 | 五阶段顺序执行；本阶段把方向与验收全部定死 |
| 约束 | 「主会话只进行子代理任务派发，不要进行大量阅读和执行任务」 | 重活派子代理；主会话只执行本阶段 CLI 步骤与 Talk/Grill |
| 约束 | 「Talk 和 grill 请用大白话说明选项、后果和风险」 | 每张选项卡写含义/后果/风险（见 `## 三轮 talk`） |

## 需求权威更新（用户纠正，2026-09-17 talk-round-1）

用户在 talk-round-1 中对 agent 的错误提问做了明确纠正，逐字保留：

> 我没有要求更改整个流程被叫醒次数的需求！你完全改错了原始需求！正常有问题就需要找我确认，stage结尾需要我确认，talk、grill等交互类的问题也要我确认，你这个问题，会导致整个workflowhub被改的面目全非！完全不是我的原始需求！

> 我不希望你加一大堆统计、收集类的功能在workflowhub里面，之前做M15任务的时候，已经确认了，这些额外的东西只会让整个workflowhub变的更臃肿更难维护！我只是希望你找到阻塞和浪费的根本原因，进行针对性的修复！另外，确定当前任务的范围后，把所有延期项更新到"/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md"中，方便我后续基于这个文件继续做后续延期项的任务。

### 本次纠正推翻的三条 agent 假设

| 被推翻的假设 | 用户权威结论 |
|---|---|
| 「人工确认点太多，应减少」 | **流程与人工确认点数量不在本任务范围**。正常问题确认、stage 收尾确认、talk/grill 交互确认是正常工作方式，不是要治的病。任何减少人工点的改动都属于超范围。 |
| 「先立尺子＝新建一条成本度量/采集通道」 | **不新增统计、收集类功能**。M15 已确认这类额外物只会让 workflowhub 更臃肿难维护。本任务禁止新增采集面。 |
| 「扩建度量能力以便证明收益」 | **只做根因定位 + 针对性修复**。 |

## 需求权威更新（用户纠正，2026-09-17 talk-round-3）

用户在 talk-round-3 中对 agent 第二次读错需求做了明确纠正，逐字保留：

> 不要改配置啊，我需要你彻底解决antigravity有问题的根本原因，应该去研究3rd-review这个技能里面的antigravity相关实现吧，看看如何使用wh-review调用3rd-review时，能正确调用和使用antigravity。我没说过要你改config配置文件，也没让你收敛为1主力+1备选，这都是伪造的需求！

### 本次纠正推翻的两条 agent 伪造需求

| 被推翻的 agent 提案 | 用户权威结论 |
|---|---|
| 「改 `~/.config/workflowhub/config.json`，从 5 条 route 的 initial 删掉 antigravity/flash」 | **禁止**。不得把「改 operator 配置」当作解决方案；不得绕开问题。 |
| 「每条 route 收敛为 1 主力 + 1 可靠备选」 | **伪造需求，作废**。用户从未提出此项。 |
| （隐含）「把 antigravity 移出派发 = 问题已解决」 | 用户要求**彻底解决根本原因**：研究 `3rd-review` 里 antigravity 的相关实现，确认 wh-review 调用 3rd-review 时应如何正确调用与使用 antigravity。 |

### 本次纠正带来的范围变化

- OI-19 由「如何处置 antigravity」改为「**antigravity 失败的根因是什么、如何修根因**」；配置方案作废，且「覆盖广度下降」不再是可接受代价。
- 研究 `3rd-review` 仓是**只读**行为，与既存非目标「不写入 3rd-review」不冲突。**若根因只能在 3rd-review 内修复**，该非目标与此要求直接冲突，必须由用户重新裁定后再动手，agent 不得自行越界。

## 需求权威更新（用户裁定，2026-09-17 talk-round-4）

antigravity 根因定位完成后，确认**正确根修只能在 `3rd-review` 内完成**（WorkflowHub 侧的 request schema 根本不消费 `--print-timeout`，CLI 参数在 `review-provider-client.mjs:901` 固定，agy 亦无对应环境变量，**无法透传**）。该结论与既存非目标「不写入 `3rd-review`」直接冲突，已按约定提交用户重新裁定。

用户在 talk-round-4 裁定：**授权本次对 `3rd-review` 做两处最小修复**。

### 该裁定的边界（不得扩张）

- 允许写入的范围**仅限**：`lib/adapters/antigravity.mjs` 的 A（argv 增加 `--print-timeout 20m`，+1 数组元素、0 行净增）与 B（`parse(stdout, stderr)` 并把 print timeout 归为诚实错误码，+3~4 行）。
- 不得顺手改 `3rd-review` 的其他任何文件、任何 provider 适配器、任何 broker 策略、任何配置。
- 不得改 `~/.config/workflowhub/config.json` 或 `~/.config/3rd-review/config.json`。
- 不得通过减少 antigravity 派发、收敛 provider 数量、或在 WorkflowHub 侧加缓解层来「替代」根修。
- `3rd-review` 侧的改动与验收**单独登记**，不计入本仓的通过判据。

## 需求权威更新（用户裁定，2026-09-17 grill-G2）

用户在 grill-G2 中新增三条需求，并逐项做出裁定。本节逐字保留用户原话与选项原文，作为本轮唯一需求权威。

### 三条新需求（用户原话逐字保留）

> 改成20分钟，同时我不希望任何审查provider发生真卡死或停止时，真的要等到时限结束才能直到结果，我需要你调查根本原因，彻底解决这个时间浪费的问题，这些审查确实经常容易出问题，所以我配置了多个provider。但是我不希望每一次审查都要久直到才知道失败了，我需要：1.开始之前的预检要做好，有问题的provider就别开始；2.审查中的健康检测要做好，有问题立刻停止或重发；3.不要再因为输入或输出格式问题导致审查失败了，太浪费时间和token了，需要对整体输入和输出宽容一些，目标是获取异源审查建议，不是一份内容详细格式正确的审查报告！

- **需求1 · 派发前预检**（用户原文）：「1.开始之前的预检要做好，有问题的provider就别开始」
- **需求2 · 审查中健康检测**（用户原文）：「2.审查中的健康检测要做好，有问题立刻停止或重发」；超时口径原文：「改成20分钟」；痛点原文：「我不希望每一次审查都要久直到才知道失败了」
- **需求3 · 输入/输出宽容化**（用户原文）：「3.不要再因为输入或输出格式问题导致审查失败了，太浪费时间和token了，需要对整体输入和输出宽容一些，目标是获取异源审查建议，不是一份内容详细格式正确的审查报告！」

### 用户在 grill-G2 的选择结果（选项原文逐字保留）

| 选项卡 | 用户选项原文 |
|---|---|
| G2-impl（非终态成员级事实） | `再加「非终态成员级事实」（跨仓新增公开面）` |
| G2-format（格式宽容边界） | `确认这个边界：宽容格式，7 条红线不动` |
| G2-scope-cap（范围上限） | `全部塞进本任务` |

### 裁定与边界

1. **授权扩大**：`3rd-review` 的写入授权由 talk-round-4 的「antigravity A+B 两处」扩大为「antigravity A+B 两处 **加上需求1/2/3 所需的改动**」。其余边界（不改配置文件、不减少派发、不降低审查标准、`3rd-review` 侧验收单独登记）不变；`## 非目标` 第 6 条据此同步改写。
2. **关键口径澄清（必须写明）**：用户选择的「非终态成员级事实」**不与 D-030③ 冲突**。D-030③ 禁止的是 WorkflowHub **自造墙钟判死**；而「暴露 broker 中真实的 member status / error / last_progress_at_ms」是**披露既有真实事实**，不是自造判定。真正需要演进的是「非终态不得带 group」这条**协议约束**（`3rd-review/lib/broker.mjs:169 assertManagedPublic`，WH 镜像 `skills/wh-review/scripts/review-provider-client.mjs:600`），且它**有测试守卫**——`3rd-review/test/managed-session-lifecycle.test.mjs:58-71` 断言 starting/running 两个非终态信封 `Object.hasOwn(..., "group") === false`，`:76` 断言 terminal 才带 group；WH 侧还有 `skills/wh-review/scripts/simple-review-runner.mjs:530-542` 的轮询只看 `current.state`。因此这是**协议演进 + 测试同步修改**（`broker.mjs:169`、`review-provider-client.mjs:600` 与上述守卫测试须同批改并写明理由），不是对墙钟判死红线的豁免。
3. **范围上限由用户主动取消**：用户明确要求「全部塞进本任务」，故 `## 决定` D-018 的「每条修复净减或持平」上限在本轮被用户主动取消；OI-18 与 D-018 的表述按「除 `## 净减或持平例外清单` 逐条列明的例外外，每条修复净减或持平」同步改写。由此产生的全部例外**逐条枚举**于 `## 净减或持平例外清单`（本轮 D4 例外加入后为 9 条），每条写明项、为什么是新增面、用户授权依据、删除条件；清单外的改动仍受净减或持平约束。
4. **需求3 的边界**：确认「格式宽容 ≠ 降低审查标准」。宽容只作用于**格式解析与信封键容忍**；审查标准本身**一条不降**。以下 7 条红线**原样保留**，可 diff 验证未被改动：
   - ① 私有/宿主路径 fail-closed：WH `skills/wh-review/scripts/review-provider-client.mjs:39-50`、`skills/wh-review/scripts/simple-review-runner.mjs:43,700 redactHostPaths`；BR `lib/workflowhub-result-v3.mjs:34-38`、`lib/broker.mjs:105-113`。只许**缩小爆炸半径**，不许改告警后采用。
   - ② finding 必须落在真实材料 + 真实行号：`skills/wh-review/scripts/simple-review-runner.mjs:861-873`。
   - ③ `minimum_heterologous` / quorum：`skills/wh-review/scripts/third-review-host-config.mjs:723-739`、`skills/wh-review/scripts/simple-review-runner.mjs:184-201`、`runtime/review/canonical-review-result.mjs:254,:324`。
   - ④ 材料允许清单与固定指令模板：`skills/wh-review/scripts/review-materials.mjs:372,:2001,:2007`；`REVIEW_MATERIAL_MISMATCH`：`runtime/review/review-record-route.mjs:1312-1316`。
   - ⑤ 材料身份与选择绑定：`skills/wh-review/scripts/simple-review-runner.mjs:1270-1300,:1324-1334`。
   - ⑥ 信封/组/成员必需键：`3rd-review/lib/workflowhub-result-v3.mjs:170,:176,:182`——额外键可容忍，**缺必需键必须失败**。
   - ⑦ 非 minor finding 必须有 `evidence_kind` / `evidence` / `root_cause`：`runtime/review/review-output.mjs:18-21`。
5. **授权改动清单（本任务对 `3rd-review` 的全部授权改动，逐条列明文件与目的）**：本节即 OI-08 与 `## 非目标` 第 6 条所指的**唯一授权边界**；凡超出本清单的 `3rd-review` 写入，即判 OI-08 失败。清单只定文件与目的，不含行号与代码（实现细节属 build-code）。本清单同时是 `## 净减或持平例外清单` 中两项测试面/正则面变更的授权依据。
   | # | 文件 | 目的 | 授权依据 |
   |---|---|---|---|
   | 1 | `lib/adapters/antigravity.mjs` | A：为 argv 补 `--print-timeout`（定为 20m），使 agy 内部超时不再早于真实审查耗时；B：改 `parse(stdout, stderr)`，stderr 命中 print timeout 警告时返回诚实的超时错误码 | talk-round-4；grill-G1「本任务直接改并验证」 |
   | 2 | `lib/provider-failure.mjs` | 让 `agy` 的 `print timeout` stderr 串被识别为超时类失败，不再误归 `PROCESS_EXIT_NONZERO` | grill-G2 需求2；G2-impl |
   | 3 | `lib/recovery-policy.mjs` | 把 `PROCESS_TIMEOUT` 纳入可重发表 | grill-G2 需求2；G2-impl |
   | 4 | `lib/broker.mjs` | ①放开 `single_round` / `full_only` 的一次 `fresh_execution` 重发；②`same_session_repair` 在无 resume 可用时降级为 `fresh_execution`；③在非终态公开成员级真实事实（status / error.code / last_progress_at_ms）；④修正 `attempts[0]` 用进程级 ok 导致解析失败被记为 completed | grill-G2 需求2；G2-impl「非终态成员级事实」 |
   | 5 | `lib/workflowhub-result-v3.mjs` | 组级成员路径越界不连坐全组：只 fail 越界成员、组记 partial；路径检查限定在结构化路径字段而不扫成员 `output` 原文 | grill-G2 需求3；G2-format |
6. **需求1/2 的红线修订**：`specs/archive/workflowhub-review-flow-repair-20260906/decision-log.md:45`（F-017②「provider 进程/超时/输出类保持运行时 unavailable」）与 `:161`（延期项⑥ provider 健康探测/限流降级）在本任务内被**显式修订**——修订依据＝用户 G2 裁定「全部塞进本任务」并明确要求「有问题的 provider 就别开始」「审查中的健康检测要做好，有问题立刻停止或重发」；修订范围＝预检的 provider 身份/可执行性/认证/活性校验，与审查中的非终态成员级健康事实披露。需求3 的 7 条红线**不在修订范围**。
7. **方向性转向须如实留档**：需求3 与历史立场相反——`specs/archive/workflowhub-review-flow-repair-20260906/decision-log.md:85,156`（禁放宽校验、禁失败改空 findings）、`/Users/Hugh/Hugh/Downloads/3rd-review审查流程根因调研与改造建议-2026-07-15.md:519`（不承诺容错解析，不确定时仍 fail-closed）、`:610`（输出须为唯一 schema-valid JSON）。当前**非宽容**边界落在 `runtime/review/review-output.mjs:33-34`（顶层键必须恰为 `findings`，围栏/JSONL/更大包裹一律失败），并有反向断言 `skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs:384`（broker error metadata 含私有路径必须 reject `PUBLIC_RESULT_INVALID`）与 `:391-399`（client 层自己不解析围栏输出，原样交给 canonical runner）。用户本轮是**方向性转向**，转向依据见 OI-24；上述反向断言的修改必须写明理由与新边界，且不得触碰 OI-24 丙类 7 条红线。

## 需求权威更新（用户裁定，2026-09-17 增量决策）

本节登记用户在 2026-09-17 收口窗口之后提出的**增量质问**与随后的**两条选项裁定**。用户原话逐字保留；其余内容为已现场核实的事实、实测数字与已被撤回的 agent 提案留档。本节与 `## 需求权威更新（用户裁定，2026-09-17 grill-G2）` 并列为本轮唯一需求权威。

### 用户本轮质疑原话（逐字保留）

> 当前一个收口的命令都做了1个多小时，这就是整个workflowhub特别浪费时间和token的重要表现，请检查根本原因，看看到底为什么会这么浪费时间？当前任务有没有治理这个类似的问题？

### 实测时间线（本地时区，本文件 `## 最终确认` 的四条原件可核对）

- 收口窗口：`11:29:22` → `12:36:48` 本地，合计 **67.4 min**。
- 其中主会话空等 **62.7 min**（13 次 `sleep`）；显式 step 11 → step 14 子代理实际执行 **24.7 min**。
- ⇒ 空等占该窗口的 93%，是本窗口「一个收口命令做了 1 个多小时」的直接构成。

### 重复次数（task store 原件计数）

| 项 | 次数 | 说明 |
|---|---|---|
| `confirm` 发布 | 4 | 同一句用户回复「确认，收口吧，不要急着进入build-spec」，4 个不同 `material_revision` / `snapshot_tree` |
| 交互聚合发布 | 3 | `quality/evidence/interactions/` 三份 93298 B 同形原件 |
| reflection 发布 | 2 | — |
| 材料 `draft` | 3 | 同一阶段内三次改写同一份材料 |
| 子代理全生命周期 `execute` | 8 | 收口窗口内 |
| 子代理全生命周期 `reflect` | 7 | 收口窗口内 |
| 子代理全生命周期 `confirm` | 5 | 收口窗口内 |

### 代价实测（task store 文件计数）

- 该窗口内本任务写 **164 个文件**：`quality/facts` 60、`acceptance/make-decision` 48、`stage-quality/make-decision` 36、`identity/executions` 11、`confirmations` 4、`interactions` 3、`stage-reflection-availability` 2、`stage-reflection` 1。
- 占全 task store **356 个文件的 46%**，且全部落在 **18.4 分钟内**。

### 治理覆盖裁定（现状核查）

- 当前 25 条 OI / 25 条 D、`## 风险与延期交接`、`/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md` **均无一条覆盖该级联**。
- `rebind|重绑|重复确认|重新确认|re-confirm|snapshot 失效` 在本材料全文中**均无命中**。
- 本材料原先只登记了第 1 次确认的时间，后 3 次**均无登记**（本轮据 task store 四份原件补齐）。

### agent 自纠：两条已被撤回的提案（必须留档）

| # | 原提案 | 撤回理由（现场核验） |
|---|---|---|
| 1 | 「`## 最终确认` 的绑定值一律不内嵌」 | 所引依据 `runtime/stage/stage-content-contracts.mjs:371-376` 的 `!== null` 护栏是**死分支**——同文件 `:345-350` 已强制非空；`tests/contract/freeze-classification-budget-usage-protocol.test.mjs:220-223` 正断言「缺绑定必须 reject」；现场对本材料调用 `validateDecisionFreeze` 得 `ok:false` / `paused`，报 `final confirmation is missing material revision`。⇒ 不内嵌会让 freeze 直接 paused，提案撤回 |
| 2 | 「改用 `isStageMaterialOnlySnapshotDelta` 放宽聚合写入判等」 | 该函数比的是 **git tree 而非 `material_revision`**，只能替换 `runtime/task/task-kernel-implementation.mjs:709`，**替换不了 `:708`**；且会削弱确认完整性。提案撤回 |

**真实根因**：不是「内嵌 / 不内嵌」的取舍，而是 `runtime/stage/stage-runner.mjs:3057` 用**材料实时字节**计算 `currentDecisionScopeRevision`。

### 四个 agent 自造章节的来源裁定

- 四节**均不在** `REQUIRED_MAIN_SECTIONS`（`runtime/stage/stage-content-contracts.mjs:50-53` 的 16 项：原始需求、目标、范围、非目标、决定、三轮 talk、调研、grill、审查处置、最终确认、拒绝方案、风险、未决项、Supersedes、文档结果、Exit checks）。
- 全仓**零消费者**（`runtime/`、`core/`、`tools/`、`tests/`、`contracts/`、`config/`、`docs/`、`skills/` 均无命中）。
- 官方模板 `skills/decision-log/templates/decision-log-template.md` 无这四节（其 15 个 `##` 标题逐条列出，均不含）。
- 四个历史归档任务（`workflowhub-mechanism-simplification-t1-20260911`、`-t2-20260911`、`-t3-20260912`、`workflowhub-mechanism-waste-reduction-20260915`）对四节精确节名的计数**全为 0**。
- 引入路径：`## 阶段步骤登记` 由主会话首轮草稿写入，另两节由收口子代理新建，`## 阶段末 spec-analyze（step 12）` 由 step 12 收口子代理新建；用户的原始请求未要求这四节。⇒ **删除四节零断链**（两处指向该 step 12 节的引用同批改为不含悬空节名的表述）。

### 跨阶段实证（全仓 vNext 扫描）

- vNext 确认共 **247 份**：make-decision 103、verify-code 70、build-plan 51、build-spec 13、build-code 10。
- **build-plan 8 组重绑样本**：`workflowhub-execution-acceleration-20260909` 3 份同 reply / 3 个不同 revision / 跨 15.9 min；`workflowhub-m16-evolution-20260831` 3+2 份、30.1 / 253.5 min；`workflowhub-execution-simplification-20260907` 2 份 / 4.4 min；`workflowhub-mechanism-simplification-t2-20260911` 2 份 / 2.5 min；`workflowhub-m17-repo-skills-multicli-20260903` 2 份 / 3.8 min；`workflowhub-execution-acceleration-deferred-20260909` 2 份 / 4.2 min；旧样本 `governance-runtime-execution-chain-20260827` 2 份 / 6.9 min、`m15-retirement` 2 份 / 30.1 min、`workflowhub-simplicity-close-repair-20260829` 5 份 / 5 scope / 201.6 min、`m15-runtime-observability-repair-live` 2 份、`workflowhub-execution-flow-repair-20260818` 2 份。
- **build-spec 1 组**：`workflowhub-simplicity-close-repair-20260829` **7 份 / 7 个 revision / 20.2 min**。
- **代价**：`workflowhub-execution-acceleration-20260909` 的 build-plan 重绑窗口写 **83 个文件**。
- **方法论声明（必须写明）**：build-spec / build-plan 的 `decision_freeze` 结论**从不落盘**——`facts.jsonl`、`quality/facts`、`quality/evidence/stage-quality` 三处均无命中。因此对该事实只能说**「无持久化、历史中不可观测」**，**不得**据此断言「未发生」。

### 四个不同坏点（同族不同点）

1. **共性**：确认**身份**用全局 `material_revision` + `snapshot_tree`（`runtime/task/task-kernel-implementation.mjs:952-953`），而**范围**另有更窄的 `material_scope` / `material_scope_revision`（同文件 `:976-983`）⇒ 身份宽于范围，任何材料写入都会改变身份。
2. **make-decision**：scope 仅含 `decision-log.md`（`runtime/stage/completion-predicates.mjs:27`），失败点落在**写侧去重**（`task-kernel-implementation.mjs:913-921`，仅 `directionOnly` 分支有豁免）；本任务 4 次确认的签名 scope_rev 各不相同 ⇒ 属「先改材料再签」的顺序问题。
3. **build-spec**：失败点落在**读侧实时重算**（`stage-runner.mjs:3057` + `runtime/stage/stage-content-contracts.mjs:359-372` 强判等）。该阶段自己不写 decision-log（`tools/cli/stage-runtime.mjs:49-53`）⇒ **无自触发**，只在上游回改时被牵连。validator 本身正确：`tests/contract/human-confirmation-v3.test.mjs:259-272` 的 T003 明证它接受下游变化。
4. **build-plan**：失败点落在**范围最宽 + 下游写入**——scope 含四份（`completion-predicates.mjs:31`），而 build-code / verify-code **合法改写 `tasks.md` 的执行状态填写区**（`workflows/build-code/SKILL.md:73`、`workflows/verify-code/SKILL.md:57`）；且读侧回退（`stage-runner.mjs:1668`、`:1681`）**未复用**写侧已有的执行段豁免（`runtime/task/git-worktree-snapshot.mjs:503-526`）。

### 用户本轮裁定（选项原文逐字保留，仅两条）

| 选项卡 | 用户选项原文 |
|---|---|
| 增量决策（收口重绑级联） | `再做 D4（读侧对称，需接受完整性语义变更 + 改一个测试断言）` |
| 增量决策（收口重绑级联） | `一并纳入 OI-26（推荐）` |

用户裁定结论：**两条同时采纳**——既做 D4（读侧对称），也把 build-spec / build-plan 的重绑一并纳入本轮治理（OI-26）。


## 范围

**范围内**（由用户在 2026-09-17 结构化问答与原话纠正后确定）：

1. **根因定位**：找出「耗时很长、token 浪费很多」与阻塞的**根本原因**，定位到具体代码位置与触发条件。定位手段不得新增统计/采集功能（见 OI-09）。
2. **针对性修复**：对定位出的根因做最小、针对性修复，不做机制加法、不做「再加一层」的替代物（见 OI-18）。
3. **DEF-01~DEF-07 逐条处置**：每条当场判「做」或「取消」，判「做」的必须在本任务内闭合，判「取消」的写入延期文件并写明理由与触发条件。
4. **延期项归档**：本任务范围确定后，把所有延期项更新到 `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`（见 OI-16）。

**明确不在范围内**：五阶段流程本身、人工确认点的数量与位置、任何新增统计/采集/度量功能。**范围外**其余部分见 `## 非目标`。

## 核心需求

- 大白话（用户已确认）：workflowhub 现在干活又慢又费钱——任务卡在审查上白等、provider 频繁失败、同一份证据被反复重采、两个检查一直红着；而且 DEF-01~DEF-07 这批延期项一直悬着没人收口。
- 用户要的是：**找出根本原因、只做针对性修复、把延期项逐条处置干净**，不是再加一层统计或采集。

## 目标

- 核心目标：消除让 workflowhub 任务「耗时很长、token 浪费很多」与反复阻塞的**根本原因**，只做针对性修复，不加机制、不加采集面，并把 DEF-01~DEF-07 逐条处置干净（OI-03~OI-06、OI-09~OI-13、OI-18、OI-19、OI-20、OI-21）。
- 成功意图（用户已确认）：**阻塞不再发生**这一可观察事实——①空等到期前先做终态复检，已完成的不再白等；②`REVIEW_WAIT_EXCEEDED` 且零 provider 的不可用审查不再被复用；③provider 失败按签名归类并可复现；④发布不再强制全量重采；⑤无消费者的私有记录锁按净减删除；⑥两个红灯（`check-skill-closure`、`smoke-local-skill-dispatch`）转绿（OI-14、OI-15、OI-20）。
- 用户已确认的边界：本任务不得顺手改造五阶段流程或人工确认点，不得新增任何统计/收集/度量面（OI-01、OI-08、OI-18）。

## 收敛检查

| 维度 | 用户答案 | 事实或材料引用 | 可执行验收 |
|---|---|---|---|
| 目标 | 用户已确认：只要根因定位 + 针对性修复，使阻塞不再发生；不产出收益数字，不以 fixture/simulation 充当 after | OI-03、OI-14；`decision-log.md:293`（OI-14 `selected_disposition`）；`decision-log.md:144`（OI-03 `source`） | 场景：逐条比对两类根因的现场证据；数据来源：`decision-log.md:456` 的一手 attempt 计数；通过：每条阻断点给出文件:行号与可复现只读命令，且材料内不出现收益数字；失败：出现无原件的历史数字被当作事实，或出现凭空 before/after |
| 范围 | 用户已确认：范围内＝根因定位 + 针对性修复 + DEF-01~07 逐条处置 + 延期文件归档；不动五阶段流程与人工确认点，不新增统计/收集面 | OI-01、OI-08、OI-09、OI-16；`decision-log.md:76`（`## 范围` 范围内清单）；`decision-log.md:83`（`## 范围` 明确不在范围内） | 场景：核对本任务 diff 与范围清单；数据来源：`## 范围` 与 `## 非目标` 两节；通过：diff 只落在范围内文件，非目标三条堵口可通过 diff 核验；失败：出现新增采集文件、减少人工确认点的改动、或 3rd-review 仓写入 |
| 方案 | 用户已确认：按真实根因重排——空等组合拳不含改阈值、记录锁改净减删除、重采只修真实残留；取舍：不改 20 分钟阈值、不做接缝映射表、不改测试断言；被拒方案：改配置删 provider、收敛 1+1、接缝映射表、回退 SKILL 内容、改测试断言；无未决项 | OI-04、OI-10、OI-12、OI-19、OI-20；`decision-log.md:162`（OI-04 最终定案）；`decision-log.md:265`（OI-12 明确不做清单）；`decision-log.md:370`（OI-20 四条修法裁断） | 场景：逐条核对五项被拒方案是否真的未落地；数据来源：`## 决定` 的 `rejected_alternatives` 与 `## 拒绝方案` 两节；通过：五项均有否决理由且 diff 中无对应改动；失败：任何一项以改名/搬家形式复活，或 `1_200_000` 阈值被改动 |
| 验收 | 用户已确认：剩 3 条 OI 本轮全部定案，且每条修复写出逐项通过/失败判据；验收只认可观察行为、行数事实与命令退出码，账本为 acceptance_criterion facts | OI-07、OI-15、OI-20；`decision-log.md:307`（OI-15 基线）；`decision-log.md:372`（OI-20 acceptance）；`decision-log.md:499`（审查处置第 8 项） | 场景：逐条执行各 OI acceptance 的判定命令；数据来源：`tools/cli` 检查命令输出与逐文件行数表；通过：`check-skill-closure` 与 `smoke-local-skill-dispatch` exit 0，`verify-structure` 与 `run-checks` 不劣化，逐文件净行数为负或持平；失败：以「更新声明哈希」掩盖字节漂移、出现新增 lint 错误、或净增控制面行数 |

## 决定

本节逐条登记 make-decision 的已定决定，每条对应一条已定 OI 处置（D-NNN ↔ OI-NNN，一一对应），字段取自 `runtime/schemas/decision-entry.v1.json`。所有 `source_exact_excerpt` 均取自四轮 talk 与 grill-G2 的用户真实答复，或 `## 需求权威更新` 中逐字保留的用户原话；`approval_hash` 为该摘录的 sha256。

### D-001

question: 现有五阶段流程与人工确认点是否保持不变、不列入本任务改造范围？
selected_option: 保持不变，不列入本任务范围
recommendation_status: recommended
recommendation_reason: 用户已明确判定「减少人工确认点」的提问是改错原始需求，维持现状是唯一与需求权威一致的方向
plain_language_meaning: 大白话：流程怎么叫醒人、哪里要人拍板，一律不动。要治的是耗时与浪费，不是确认次数。
source_type: user_reply
source_exact_excerpt: 我没有要求更改整个流程被叫醒次数的需求！你完全改错了原始需求！
approval_status: approved
approval_ref: talk-round-1 / ask_user_question 结果「完整用户流程与人工点」自由文本纠正
approval_hash: 3af0a9f2717cc56153adf105a16c82a57549ce250ea32d0a6e514ca831a79f72
facts_and_constraints: 用户原话明确正常问题确认、stage 收尾确认、talk/grill 交互确认都是正常工作方式；`## 需求权威更新（用户纠正，2026-09-17 talk-round-1）` 已单列该纠正
logic: 用户纠正 -> 人工确认点不在范围 -> 本任务 diff 不触碰 talk/grill/confirm 环节
choice_reason: 直接采用用户裁定，不自行调和
impact: 范围边界；后续所有修复都不得以「减少确认」为手段
consequences: 本任务成本优化只能来自根因修复，不能来自削减人工交互
risks: 若有修复顺手动了确认点，即违反本决定
rejected_alternatives: 减少/搬移人工确认点（用户明确判为改错原始需求）
unresolved: 无
module: make-decision
requirement_ids: [R-003, R-006]
derived_from: []
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-002

question: 当前任务从开始到关闭会写哪些数据、写到哪里、由谁写，哪些是唯一写入者？
selected_option: 记录写入面事实并守住既有写入者数量
recommendation_status: recommended
recommendation_reason: 现场实测已给出唯一写入者清单，守住它才能避免修复把写入面扩大
plain_language_meaning: 大白话：先数清楚现在有几支笔在写任务数据，修复不许再多出笔。
source_type: user_reply
source_exact_excerpt: 我只是希望你找到阻塞和浪费的根本原因，进行针对性的修复！
approval_status: approved
approval_ref: talk-round-1 / ask_user_question 结果「最大四条阻塞口径」自由文本纠正
approval_hash: de909e904de3d136f714c5921bba1334364a3ee3a843f6caa731b1ff2ca7307d
facts_and_constraints: 材料走 `core/artifact-dir.mjs:156` ArtifactDir（2 个入口）；`facts.jsonl` 唯一写函数 `task-store.mjs:383`（3 调用点）；identity/executions 单写者注册 `task-handle.mjs:871`；quality/** 经 `task-handle.mjs:831/839` 通用入口，仅靠 denylist 保护（已实测 ≥5 调用者）
logic: 现场实测写入面 -> 记录事实 -> 修复后复核入口数与唯一写入者
choice_reason: 用可核对的写入面事实约束修复，避免新增第二写入者
impact: 数据状态边界；材料写入入口数与唯一写入者数量
consequences: 若修复引入第三套材料写入实现，必须显式登记
risks: quality/** 多写者面可能在修复中被无意扩大
rejected_alternatives: 启用 `material-workspace.mjs:91` 的第三套材料写入实现（净增控制面）
unresolved: 无
module: runtime/task
requirement_ids: [R-011]
derived_from: []
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-003

question: 「耗时很长、token 浪费很多」的根本原因分别是什么，每条的触发条件与代码位置在哪？
selected_option: 按四个阻断点分别给出根因、触发条件与代码位置，并对无原件的历史数字作降级标注
recommendation_status: recommended
recommendation_reason: 只有定位到文件:行号与可复现条件，后续修复才不是猜的
plain_language_meaning: 大白话：先查清为什么慢、为什么浪费，查到具体代码行，不靠感觉。
source_type: user_reply
source_exact_excerpt: 我只是希望你找到阻塞和浪费的根本原因，进行针对性的修复！
approval_status: approved
approval_ref: talk-round-1 / ask_user_question 结果「最大四条阻塞口径」自由文本纠正
approval_hash: de909e904de3d136f714c5921bba1334364a3ee3a843f6caa731b1ff2ca7307d
facts_and_constraints: ①20 分钟空等根因在外部仓（`3rd-review/lib/broker.mjs:160-163`、`:801`），本仓只能改等待侧；②33% 失败率中 12 次为 antigravity/flash provider 侧 no-final-text、5 次 broker 文案、4 次限流，其中 `EVIDENCE_ANCHOR_INVALID` 3 次属本仓路径口径自相矛盾导致的误判；③「重采级联」头条数字无原件、多个子结论已过期，真实残留仅 3 条；④15 分钟记录锁无生产触发路径
logic: 五个根因定位子代理 HEAD 现场核验 -> 每条给文件:行号与可复现命令 -> 无原件数字降级标注
choice_reason: 现场一手证据优先于历史断言
impact: 范围与验收；决定后续四条修复的靶点
consequences: 无原件的历史数字不再作为收益基线
risks: 把跨仓或环境问题误算作本仓可修复收益
rejected_alternatives: 直接引用上一轮头条数字作为基线（无可复核原件）
unresolved: 无
module: runtime/stage
requirement_ids: [R-001]
derived_from: []
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-004

question: 单轮审查最长空等 20 分钟发生在哪个环节，代价多大，改成什么样才算解决？
selected_option: 不改 20 分钟阈值数字，只做到期前终态复检与不可用审查复用守卫
recommendation_status: recommended
recommendation_reason: 现场没有任何合法审查时长分布可支撑改阈值，改动阈值等于引入无依据的新数字
plain_language_meaning: 大白话：20 分钟这个上限先不动（没人量过它该是多少），只把「已经做完了还在傻等」和「失败一次就被永久钉住」两件事修掉。
source_type: user_reply
source_exact_excerpt: 不改 20 分钟这个数字
approval_status: approved
approval_ref: talk-round-3 / ask_user_question 选项卡 OI-04-r3
approval_hash: 018cfba766797fec4fbc14875236444118fa3fe82d7cc057d053e43d652fe74f
facts_and_constraints: `skills/wh-review/scripts/simple-review-runner.mjs:40` `DEFAULT_MANAGED_TERMINAL_WAIT_MS=1_200_000`；`:533-539` 超时只抛 `REVIEW_WAIT_EXCEEDED` 不 cancel；副作用证据 `runtime/review/review-record-route.mjs:511-556`；本阶段现场一手复现：首次 attempt 因 host_provider 非法落 blocked_before_dispatch，下一次请求即 reused:true 复用该失败 attempt
logic: 现场无时长分布 -> 不动阈值 -> 只做终态复检与复用守卫 -> 用可构造场景验收
choice_reason: 消除白等与被钉死都不依赖新数字，成本最低且不引入无依据常量
impact: 范围与验收；审查等待侧行为
consequences: 20 分钟上限数值可被 diff 证明未变
risks: 只做复检可能仍保留外部仓停顿造成的等待
rejected_alternatives: 把阈值对齐为 600000（无现场依据，方向审查已指出）；接通 cancelManaged（既有测试断言该路径绝不调用）
unresolved: 无
module: skills/wh-review
requirement_ids: [R-001]
derived_from: []
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-005

question: provider 失败率 33% 的成因里，哪些可在本仓消除、哪些属于跨仓或环境问题？
selected_option: 给出按签名的失败分类与可控性判定，三类修复全做
recommendation_status: recommended
recommendation_reason: 用户自由文本答复要求三类修复一起做，且分类表是归因前提
plain_language_meaning: 大白话：把失败按错误码分堆，分清楚哪些是咱能修的，哪些是别人家的事，然后能修的三类一起修。
source_type: user_reply
source_exact_excerpt: 1、2、3都要做
approval_status: approved
approval_ref: talk-round-2 / ask_user_question 选项卡 OI-05 自由文本答复
approval_hash: 1fb692d1dab045639750a5b7cd23511afd96d2dda8027a60c3d275e874b4f944
facts_and_constraints: 跨仓/环境＝`PROVIDER_OUTPUT_INVALID`(12，全 antigravity/flash)、`PUBLIC_RESULT_INVALID`(5，broker 文案)、`RATE_LIMITED`(4)；本仓可控＝`EVIDENCE_ANCHOR_INVALID`(3)、`REVIEW_SOURCE_DRIFT`(3)、`MATERIAL_FORBIDDEN`(2)+`MATERIAL_INCOMPLETE`(1)、`REVIEW_WAIT_EXCEEDED`(1)
logic: 一手 attempt 分布 -> 按签名归类 -> 分可控性 -> 三类修复全做
choice_reason: 用户明确选择三类全做，不缩减
impact: 范围；失败率下降的实际可达面
consequences: 报告侧不再出现大批未归类失败码
risks: 把跨仓失败算作本仓收益
rejected_alternatives: 只修一类；把限流与 broker 文案算作本仓可修复收益
unresolved: 无
module: runtime/review
requirement_ids: [R-001, R-007]
derived_from: []
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-006

question: 证据重采级联一次改动会触发几次重采、各耗时多少，按什么规则分级才不误判？
selected_option: 头条断言降级为不可复核，只保留三条真实残留
recommendation_status: recommended
recommendation_reason: HEAD 现场复核显示头条数字全仓无可复核原件，两条子结论已过期
plain_language_meaning: 大白话：上一轮说的「重跑 8 次、37.9 分钟」找不到原件，先按不可复核处理；真正剩下的问题只有三条。
source_type: user_reply
source_exact_excerpt: 按真实根因重排
approval_status: approved
approval_ref: talk-round-2 / ask_user_question 选项卡「两个堵点被推翻后范围怎么重排」
approval_hash: a044a6dc72d6191fb4efab8e1baa0bde641b27f5a52486e2624e1b35bab47cb3
facts_and_constraints: `canonical-receipt-writer.mjs:344-347`；`stage-runner.mjs:1791-1801`；`review-record-route.mjs:548-552`；`tests/contract/test-capture-reuse.test.mjs` 与 `review-budget-deletion.test.mjs` 实测；真实残留三条：全源 source_digest 复用粒度、`assertVNextSourceStable` 强制全量重采 ×2、`freshness.mjs:269-288` 死代码
logic: HEAD 复核 -> 无原件则降级 -> 只保留可复核残留
choice_reason: 不用不可复核的历史数字论证收益
impact: 范围；后续重采修复的靶点收敛为三条
consequences: 材料中凡引用历史重采数字处均标注无原件不可复核
risks: 把已过期的子结论当作现存问题
rejected_alternatives: 以 37.9 分钟/8 次作为收益基线；以接缝映射表重新分级
unresolved: 无
module: runtime/stage
requirement_ids: [R-001]
derived_from: []
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-007

question: 本任务的可验收成功标准是什么，每条怎么算通过、怎么算失败？
selected_option: 验收对象限定为可观察行为、行数事实与命令退出码三类，每条修复逐项写出通过与失败判据
recommendation_status: recommended
recommendation_reason: 方向审查指出「只靠阻塞不再发生」不可证伪，必须给出逐项判据
plain_language_meaning: 大白话：每条修复都要写清怎么算修好了、怎么算没修好，拿命令输出和行数说话，不写漂亮话。
source_type: user_reply
source_exact_excerpt: 剩 3 条 OI 本轮全部定案，且每条修复写出逐项通过/失败判据
approval_status: approved
approval_ref: talk-round-3 / ask_user_question 选项卡「验收标准（回应 major）」
approval_hash: bdeed18da62e28f487f9e1e60b430131ee4dde8b710a29ebf7b7fd90cebb87f3
facts_and_constraints: 唯一验收账本＝`acceptance_criterion` facts；OI-04/05/10/11/12/13/15/20/21 的 acceptance 与 counterexample 均已成对；方向审查第 8 条指出原口径不可证伪
logic: 方向审查质疑 -> 用户裁定逐项判据 -> 每条修复 acceptance/counterexample 成对登记
choice_reason: 可证伪才能被 verify-code 独立裁决
impact: 验收；全部修复的判定方式
consequences: 材料中不再出现只有「不再发生」措辞而无判据的条目
risks: 判据若不可复现则等于没判据
rejected_alternatives: 只用「阻塞不再发生」作验收；用收益数字作验收
unresolved: 无
module: make-decision
requirement_ids: [R-003, R-013]
derived_from: []
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-008

question: 本任务明确不做什么？
selected_option: 历史非目标 + 三条新堵口
recommendation_status: recommended
recommendation_reason: 用既有非目标清单加三条新堵口，可防止修复演化成机制加法
plain_language_meaning: 大白话：明确哪些事不干：不恢复被删的遥测、不向 `3rd-review` 写入超出本任务显式授权清单的内容、不动历史归档字节。
source_type: user_reply
source_exact_excerpt: 我不希望你加一大堆统计、收集类的功能在workflowhub里面，之前做M15任务的时候，已经确认了，这些额外的东西只会让整个workflowhub变的更臃肿更难维护！
approval_status: approved
approval_ref: talk-round-1 / ask_user_question 选项卡 OI-08
approval_hash: c14cddb749f7b496892fa2632e48063308dd043ea3e4d59ffc1f9c59238935c2
facts_and_constraints: 三条堵口＝①不恢复被删的 M15 遥测五件套 ②对外部审查仓 `3rd-review` 的写入仅限 `## 需求权威更新（用户裁定，2026-09-17 grill-G2）` 第 5 条逐条列明的授权改动清单 ③不动历史 provenance 字节；既存非目标见 `## 非目标` 十二条。本条与 OI-08 的 `acceptance`/`counterexample` 措辞在本次 step 12 同批同步（step 12 为阶段事实，按 F1 只落 task store；本材料不设 step 12 章节）
logic: 历史非目标 + 用户纠正 -> 三条新堵口 -> diff 可核验
choice_reason: 非目标是防止「再加一层」的第一道约束
impact: 范围；所有修复的可行边界
consequences: 任何新增采集面都会被判失败
risks: 以改名/搬家形式复活被删对象
rejected_alternatives: 恢复 `runtime/evidence/monitoring-facts.mjs`；向 `3rd-review` 写入超出 G2 第 5 条授权改动清单的内容；改动 `specs/archive/**` 字节
unresolved: 无
module: make-decision
requirement_ids: [R-005, R-006]
derived_from: []
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-009

question: 在明令禁止新增统计/采集功能的前提下，根因定位用什么手段完成？是否允许使用既有工具的一次性输出作为证据？
selected_option: 只用读代码与读既有落盘事实定位根因
recommendation_status: recommended
recommendation_reason: 既有 attempt/receipt/测试文件与 git 历史足以定位四条根因，无需新建采集面
plain_language_meaning: 大白话：查问题的办法就是读代码、读已经落盘的老账，不许新装仪表。
source_type: user_reply
source_exact_excerpt: 我不希望你加一大堆统计、收集类的功能在workflowhub里面，之前做M15任务的时候，已经确认了，这些额外的东西只会让整个workflowhub变的更臃肿更难维护！
approval_status: approved
approval_ref: talk-round-2 对 OI-10 的纠正原话（不加统计收集功能）
approval_hash: c14cddb749f7b496892fa2632e48063308dd043ea3e4d59ffc1f9c59238935c2
facts_and_constraints: 允许读取既有 attempt/receipt/测试文件与 git 历史；禁止新跑真实任务、禁止新建采集面、禁止改造既有工具并接入流程；用户已在 OI-14 明确不产出收益数字
logic: 用户禁令 -> 定位手段限定为只读 -> 结论全部附文件:行号与可复现只读命令
choice_reason: 五个根因定位子代理全程只用 read/grep/git 与既有 attempt 目录，已被验证可行
impact: 范围；定位活动的全部手段
consequences: 本任务 diff 中不出现任何新增采集文件、字段或命令
risks: 为了让既有测量脚本进流程而给它接消费者
rejected_alternatives: 新建成本度量通道；给 `measure-test-runtime-profile.mjs` 接消费者
unresolved: 无
module: make-decision
requirement_ids: [R-005, R-011]
derived_from: [D-008]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-010

question: 空等与记录锁的针对性修复分别是什么：缩短阈值、暴露停滞事实、接通取消，还是组合？如何避免修复变成「再加一层」？
selected_option: 按真实根因重排：空等按 OI-04 组合拳，记录锁改净减删除，不接通取消
recommendation_status: recommended
recommendation_reason: 记录锁经实测无生产调用者，取消路径被既有测试断言禁止，删除是唯一净减的修法
plain_language_meaning: 大白话：空等按新方案修；15 分钟记录锁没人用，直接删掉；接取消这条路走不通，因为测试明确要求它不被调用。
source_type: user_reply
source_exact_excerpt: 按真实根因重排
approval_status: approved
approval_ref: talk-round-2 / ask_user_question 选项卡「两个堵点被推翻后范围怎么重排」
approval_hash: a044a6dc72d6191fb4efab8e1baa0bde641b27f5a52486e2624e1b35bab47cb3
facts_and_constraints: `wh-review-cli.mjs:877` 自述 Not reachable from the public CLI；`specs/archive/workflowhub-execution-simplification-20260907/decision-log.md:330`（D12）明文禁止；`tests/review/review-managed-lifecycle.test.mjs:441-466` 正断言该路径绝不调用 `cancelManaged`，且与 D-030③ 冲突
logic: 实测无消费者 -> 记录锁删除 -> 取消路径不可行 -> 空等按 OI-04 判据验收
choice_reason: 净减符合硬规则，且删除前必须先证明无消费者与安全不变式
impact: 范围与验收；记录锁与空等两侧修法
consequences: 记录锁相关改动必须使行数净减
risks: 存在未被发现的测试或工具 consumer
rejected_alternatives: 为不可达的记录锁改 `waitMs`；为接通取消而修改既有断言或绕过 D-030③
unresolved: 无
module: skills/wh-review
requirement_ids: [R-001]
derived_from: []
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-011

question: provider 失败率怎么降：切片、重试策略、还是先归因再定？
selected_option: 三条实现 bug 修正 + 源漂移止损 + 处置 antigravity/flash
recommendation_status: recommended
recommendation_reason: 用户自由文本答复三类全做，且三条实现 bug 各有现场位置
plain_language_meaning: 大白话：先修三处明显的实现 bug，再加一个「源变了就止损」的检查，最后专门处理 antigravity 那一堆失败。
source_type: user_reply
source_exact_excerpt: 1、2、3都要做
approval_status: approved
approval_ref: talk-round-2 / ask_user_question 选项卡 OI-05 自由文本答复
approval_hash: 1fb692d1dab045639750a5b7cd23511afd96d2dda8027a60c3d275e874b4f944
facts_and_constraints: ①统一 provider 路径口径（`simple-review-runner.mjs:861-873` 剥离可选 bundle/ 前缀并改正 `:70-72` 的 prompt 样例）、补齐失败分类表（`review-result.mjs:144-170`）、身份降级不覆盖真因 message（`:1289-1299`）；②轮询内回检源漂移并调用已存在的 `cancelManaged`（依据源漂移事实而非墙钟计时）；③处置 antigravity/flash（ok2/fail12），修法由 OI-19 另定
logic: 现场 bug 定位 -> 三处修正 -> 源漂移止损 -> antigravity 根因另立 OI
choice_reason: 三类都是可定位可测试的修复，且不触碰审查标准红线
impact: 范围与验收；失败率与失败分类质量
consequences: 失败码不再大批落为未归类
risks: 止损若以计时判死会误杀正常长审查
rejected_alternatives: 把锚点校验降级为仅记录；把私有路径检查改为告警；调低 `minimum_heterologous` 以省成本
unresolved: 无
module: skills/wh-review
requirement_ids: [R-001, R-007]
derived_from: [D-005]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-012

question: 证据重采级联怎么分级，才能只在受影响接缝变化时重采？
selected_option: 只修三条真实残留，不做接缝映射表
recommendation_status: recommended
recommendation_reason: 接缝粒度方案净增行数并新增映射表，属新控制面，违反硬规则
plain_language_meaning: 大白话：先去掉每次发布都强制全量重采的那一下，再删掉一段死代码；不做「哪些接缝影响哪些证据」的大表。
source_type: user_reply
source_exact_excerpt: 按真实根因重排
approval_status: approved
approval_ref: talk-round-2 / ask_user_question 选项卡「两个堵点被推翻后范围怎么重排」
approval_hash: a044a6dc72d6191fb4efab8e1baa0bde641b27f5a52486e2624e1b35bab47cb3
facts_and_constraints: ①`stage-runner.mjs:1792` 去掉 `{fresh:true}`，消除每次发布强制全量重采 ×2；②删除 `freshness.mjs:269-288` 的 `bindFreshness`/`assertFresh` 死代码及 3 处测试引用（净减约 20 生产行 + 15 测试行）；明确不做测试复用改接缝粒度（净增 10-25 行并新增映射表）与 verify-code 整树守卫收窄
logic: 现场残留三条 -> 只修净减项 -> 发布前后源稳定性防护仍由既有材料 revision/hashes 检查承担
choice_reason: 净减且不新增控制面
impact: 范围与验收；发布路径与测试面
consequences: 净行数为负
risks: 去掉强制重采后出现事实绑到已漂移源的路径
rejected_alternatives: 接缝映射表；verify-code 整树守卫收窄；任何新增映射或字段式分级
unresolved: 无
module: runtime/stage
requirement_ids: [R-001]
derived_from: [D-006]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-013

question: DEF-01~DEF-07 逐条判做还是取消，判据是什么？
selected_option: DEF-01~07 全部判取消，并追加 DEF-08 与 DEF-09
recommendation_status: recommended
recommendation_reason: 七条逐条 HEAD 实测均不成立或与硬规则冲突，取消是唯一与净减约束一致的处置
plain_language_meaning: 大白话：七条旧延期项一条都不做，逐条写清为什么不做、什么情况下再考虑；另外补两条新的。
source_type: user_reply
source_exact_excerpt: 七条全取消 + 追加 DEF-08/DEF-09 两个净减项
approval_status: approved
approval_ref: talk-round-2 / ask_user_question 选项卡 OI-13；talk-round-3 / 选项卡 OI-13-r3
approval_hash: f73fc4169eb5e018c13a1c2cd40e6c1d53ea686c420848cfc738e4c56cfaad84
facts_and_constraints: DEF-01 零 consumer 导出仅 180 行(2.5%)主体级收窄必靠搬家；DEF-02 改阶段协议本体触碰非目标；DEF-03 定性错误（hex 行仅 4，真因是段落 ×4 重复）且目标在 `specs/archive` 属非目标禁改；DEF-04 两份副本字节相同零漂移且加固净增行；DEF-05 已被 t2/C6 闭合，再动即复活被删持久对象；DEF-06 收益不可验证且落在 wh-review 面；DEF-07 与「不加披露面」+「净减或持平」双冲突
logic: 逐条 HEAD 实测 -> 七条取消 -> 补齐取消理由/触发条件/owner -> 追加两条净减项
choice_reason: 与净减硬规则一致，且用户两次确认维持取消
impact: 范围；延期清单的终态
consequences: 延期文件被更新为本任务正式交付物
risks: 把取消项写成无理由的转交
rejected_alternatives: 重做已闭合的 DEF-05；把取消项以转交下一轮形式记录而无理由与触发条件
unresolved: 无
module: make-decision
requirement_ids: [R-002, R-009]
derived_from: [D-008]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-014

question: 在既不加采集功能、又不许用 fixture/simulation 充数的情况下，本次改进靠什么判定「真的修好了」？
selected_option: 只靠阻塞不再发生的可观察行为验收，不产出任何收益数字
recommendation_status: recommended
recommendation_reason: 用户明确不要收益数字，且上一轮用确定性 fixture 充当 after 被证明无效
plain_language_meaning: 大白话：不搞前后对比数字，就看那个卡人的现象还会不会发生。
source_type: user_reply
source_exact_excerpt: 只靠「阻塞不再发生」的可观察行为验收，不产出任何收益数字
approval_status: approved
approval_ref: talk-round-1 / ask_user_question 选项卡 OI-14
approval_hash: 81b630d8773fb0b8c4a5fed84e3de4557565f91d1ab34655fc1a2634b24e64e1
facts_and_constraints: 不新建、不接入任何采集设施；不得用 fixture/simulation 充当 after 证据；上一轮 `waste-reduction spec.md:457,852` 用确定性 fixture/simulation 充当 after，FND-028 自认未度量原始痛点
logic: 用户禁令 -> 验收限定为可观察行为 -> 每条修复给可复现命令与可观察判据
choice_reason: 与 OI-09 的只读定位手段一致
impact: 验收；全部修复的判定方式
consequences: 材料中不出现凭空的 before/after 收益数字
risks: 可观察判据若不可复现则退化为措辞
rejected_alternatives: 产出收益数字；以确定性 fixture/simulation 充当 after 证据
unresolved: 无
module: make-decision
requirement_ids: [R-001, R-011]
derived_from: [D-009]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-015

question: 「不劣化于 HEAD 基线」的基线值是什么，HEAD 已存在的失败怎么算？
selected_option: 写明四项基线，并把两个红灯在本任务内修掉
recommendation_status: recommended
recommendation_reason: 两个红灯在同一 HEAD 的主仓可独立复现，是真实漂移而非缺依赖误报
plain_language_meaning: 大白话：先把现在的好与坏都记下来当标尺，顺手把两个一直红的检查修绿。
source_type: user_reply
source_exact_excerpt: 顺带修掉这两个红灯
approval_status: approved
approval_ref: talk-round-2 / ask_user_question 选项卡 OI-15
approval_hash: c8fd3539171747de9534097f8b80b4231e9707e4eed9e7a27e7e96eff654b195
facts_and_constraints: 基线＝`verify-structure` exit 0、`run-checks` exit 0（含 2 条非阻断 WARNING）、`check-skill-closure` exit 1、`smoke-local-skill-dispatch` exit 1；两个失败在同一 HEAD 的主仓独立复现相同 SKILL.md 哈希漂移，四份输出无 Cannot find module
logic: 现场复算基线 -> 两个红灯纳入本任务 -> 修法与范围由 OI-20 定案
choice_reason: 用户选定顺带修掉，且失败已在主仓独立复现
impact: 验收；基线值与红灯归属
consequences: 本任务结束时两个红灯转绿，另两项不劣化
risks: 以掩盖方式让检查变绿
rejected_alternatives: 把两个红灯留在基线里；以更新声明哈希掩盖字节漂移
unresolved: 无
module: tools/cli
requirement_ids: [R-012]
derived_from: []
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-016

question: 延期文件怎么更新：判取消的项与新增延期项分别写什么字段，才不算「把延期移出材料」？
selected_option: 判取消项逐条改写状态、取消理由、触发条件与 owner，新增项自 DEF-08 起追加，保持单一清单
recommendation_status: recommended
recommendation_reason: 用户明确要求确定范围后更新该文件，且禁止出现「零延期」式声明
plain_language_meaning: 大白话：取消的每一条都要写清为什么取消、什么情况下再捡起来、谁负责；新发现的自 DEF-08 往后加。
source_type: user_reply
source_exact_excerpt: 确定当前任务的范围后，把所有延期项更新到"/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md"中，方便我后续基于这个文件继续做后续延期项的任务。
approval_status: approved
approval_ref: talk-round-1 原话；talk-round-1 / ask_user_question 选项卡 OI-16
approval_hash: 5c1dbe78631ef6fdbdc38320c53212672018e7db0caaddb3ca23ca2149d1882a
facts_and_constraints: 该文件更新为正式交付物之一；跨仓三项（终止/判死原语、达标即产出、迟到结果处置）不进入本任务通过判据，owner 为 3rd-review 独立任务
logic: 用户要求 -> 单一清单文件 -> 每条含终态/理由/触发条件/owner -> 与 decision-log 逐条一致
choice_reason: 单一清单便于后续任务直接消费
impact: 范围；延期交接载体
consequences: 禁止出现「零延期」式声明
risks: 文件未同步导致材料与清单不一致
rejected_alternatives: 把延期项移出材料只留「零延期」；为延期项在本仓新开清单
unresolved: 无
module: make-decision
requirement_ids: [R-002, R-009]
derived_from: [D-013]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-017

question: 本任务的页面范围是什么，是否维持 non_ui，若引入人看界面如何重算？
selected_option: 维持零页面（non_ui）
recommendation_status: recommended
recommendation_reason: 仓库无任何前端面，且成本相关信息只需既有 CLI 文本输出
plain_language_meaning: 大白话：不做界面，所有信息还是命令行文字。
source_type: user_reply
source_exact_excerpt: 维持零页面，成本数据只走文本输出
approval_status: approved
approval_ref: talk-round-1 / ask_user_question 选项卡 OI-17
approval_hash: 892d84bd1549825d47a2087e8e950a407acf5a007fab86aea99bdcb0633f49cf
facts_and_constraints: 实测仓库无 `apps/`、`web/`、`ui/`、`packages/`；`package.json` 无 bin 与前端依赖；仅有 3 个 CLI 入口
logic: 现场实测无前端面 -> 用户选定维持零页面 -> diff 中不出现页面/路由/前端依赖
choice_reason: 与用户决定一致，且 `## UI applicability` 据此记为 non_ui
impact: 范围；页面范围判定
consequences: 孤儿 HTML 反射页生成器仍无生产调用者
risks: 给孤儿 HTML 生成器接上调用者
rejected_alternatives: 新增页面或前端依赖；复活孤儿 HTML 反射页生成器
unresolved: 无
module: make-decision
requirement_ids: [R-008]
derived_from: []
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-018

question: 本任务如何自我约束，确保修复不是「再加一层」、不重演 M15 遥测被删的老路？
selected_option: 除 `## 净减或持平例外清单` 逐条列明的例外外，每条修复必须做到控制面净减或持平
recommendation_status: recommended
recommendation_reason: 用户明确反对新增臃肿面，M15 遥测五件套被整文件删除就是先例
plain_language_meaning: 大白话：每修一处，代码行数只能减或持平，不许越修越胖。
source_type: user_reply
source_exact_excerpt: 这些额外的东西只会让整个workflowhub变的更臃肿更难维护！
approval_status: approved
approval_ref: talk-round-1 / ask_user_question 选项卡 OI-18
approval_hash: 49f15f5d1e62c428c1aa2daa6f287ea22b1a25649372eb9716080d75b0316e4b
facts_and_constraints: 除 `## 净减或持平例外清单` 逐条列明的例外外，不新增常驻文件、字段或公共命令；改动后在材料中写明逐文件新增与删除行数；例外由用户在 grill-G2「全部塞进本任务」主动取消范围上限而产生，逐条登记于 `## 净减或持平例外清单`（每条例外写明项、为什么是新增面、用户授权依据、删除条件），该清单即本条的例外边界
logic: 用户纠正 -> 净减或持平硬规则 -> 材料给出逐文件行数表
choice_reason: 可核对的行数事实比承诺更可靠
impact: 范围；全部修复的规模边界
consequences: 出现净增即需显式登记并由用户认可
risks: 以搬家或改名规避净减
rejected_alternatives: 把删除换成搬家、改名或加统一层
unresolved: 无
module: make-decision
requirement_ids: [R-005, R-010]
derived_from: [D-008]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-019

question: antigravity/flash 失败的根因是什么？研究 3rd-review 里 antigravity 的实现后，wh-review 调用 3rd-review 时应如何正确调用与使用 antigravity？
selected_option: 只读研究 3rd-review 中 antigravity 的实现并修根因，不改配置、不减少派发；根因确认在 3rd-review 后，经 talk-round-4 授权做 A+B 两处最小修复
recommendation_status: recommended
recommendation_reason: 用户明确裁定不得把改配置当作解决方案，且要求彻底解决根本原因
plain_language_meaning: 大白话：去把 antigravity 的代码实现读明白，找到真正坏在哪，然后按正确方式调用它；不许靠改配置把它关掉。查清后发现坏在外部审查仓的适配器里，用户随后授权在那里改动两处最小代码。
source_type: user_reply
source_exact_excerpt: 不要改配置啊，我需要你彻底解决antigravity有问题的根本原因，应该去研究3rd-review这个技能里面的antigravity相关实现吧，看看如何使用wh-review调用3rd-review时，能正确调用和使用antigravity。
approval_status: approved
approval_ref: talk-round-3 自由文本纠正（OI-19）；talk-round-4 裁定授权两处最小修复
approval_hash: f573a511e760c5319fd8aa0d69d14d06e30c97f90eeced6c4dfa4c40b5a5740b
facts_and_constraints: antigravity/flash 一手分布 ok2/fail12（成功率 14%），12 次失败全为 `PROVIDER_OUTPUT_INVALID`「emitted no final text」。根因：`agy` 1.2.4 在内部 `--print-timeout`（默认 5m0s）到期时改为退出码 0 + stdout 全空 + stderr 警告（1.1.5 为非零退出）；`3rd-review` 适配器三项缺陷——`lib/adapters/antigravity.mjs:19` 未设 `--print-timeout`、`antigravity.mjs:6-9` 只看 stdout 忽略 stderr、空 stdout 被归为「模型无输出」。硬证据：12 次失败 stderr 恰好 79 字节且逐字相同、stdout 为 `e3b0c442...b855`（空串 sha256）、失败耗时 306.7–311.0s 与成功 68.5–237.1s 零重叠、同组 codex/luna 401,904ms 仍 completed、失败最小材料 4KB vs 成功最大 1.9MB。WorkflowHub 侧无法透传 `--print-timeout`（request schema 消费键全集不含它）
logic: 用户裁定 -> 只读研究 antigravity 实现 -> 定位根因（agy 版本行为变更触发 + 适配器三项缺陷）-> 确认本仓无等价正确修法 -> 与非目标冲突故提交用户重新裁定 -> talk-round-4 授权 3rd-review 侧 A+B 两处最小修复
choice_reason: 改配置只是绕过问题，根因修复才符合用户要求；根因确证在外部仓后按既定约定取用户裁定，不自行越界
impact: 范围与验收；antigravity 派发的可用性；非目标第 6 条出现一次显式例外
consequences: 配置方案作废，覆盖广度下降不再是可接受代价；本任务新增对 3rd-review 的两处最小改动，其验收单独登记、不计入本仓通过判据
risks: 该仓改动需在该仓单独跑测试与验收；agy 版本行为可能再次变更；`--print-timeout 20m` 无 antigravity 长尾样本可证其覆盖极端 P99
rejected_alternatives: 改 `~/.config/workflowhub/config.json` 从 initial 删除 antigravity/flash；每条 route 收敛为 1 主力 + 1 可靠备选；把 antigravity 移出派发；在 WorkflowHub 侧加第二轮仅含 antigravity 的 broker run 作缓解；回退 agy 到 1.1.5；切换 `--output-format json` 作为首选修法
unresolved: 无
module: skills/wh-review
requirement_ids: [R-007]
derived_from: [D-011]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-020

question: 两个红灯的正确修法是什么：重新对齐声明哈希、回退内容、还是修正比较口径？修复后跑哪些针对性测试？
selected_option: 重新对齐声明并补回被删的披露措辞，回退内容与修正比较口径均否决
recommendation_status: recommended
recommendation_reason: 真实漂移已定位到引入提交，且回退内容会打破现绿测试并重新引入已退役依赖
plain_language_meaning: 大白话：把声明里的哈希改成跟真实文件一致，再把同一提交顺手删掉的几句披露说明补回来；不许回退文件内容，也不许改比较规则。
source_type: user_reply
source_exact_excerpt: 对齐声明 + 补回被删的披露措辞（接受净 +10 行例外）
approval_status: approved
approval_ref: talk-round-3 / ask_user_question 选项卡 OI-20-r3
approval_hash: 116498d2261f373897cec11f494daf630561193423c5d3b3628ae95d21c82b88
facts_and_constraints: ①C1 重新对齐声明：`skills/spec-analyze/skill-bundle.json` 2 行、`skills/stage-handoff/skill-bundle.json` 1 行、`skills/stage-reflection/skill-bundle.json` 1 行、`skills/catalog.yaml` 5 行＝8 文件 9 行值替换，净 0；并明写「接受 25b44430 已合入字节为基线」；②补回同一提交从 5 个 `workflows/<stage>/SKILL.md` 删除的 outcome 披露措辞（约 +10 行），登记为「净减或持平」的显式例外；③C2 回退内容被否决（`tests/contract/no-external-stage-agent-gate.test.mjs:41-42` 正断言 25b44430 新写措辞存在）；④C3 修正比较口径不成立（7 种规范化口径无一能复现声明值）
logic: git blob 三态实测定位引入提交 -> C1 对齐声明 -> 补回披露措辞 -> C2/C3 给出硬反例否决
choice_reason: 声明哈希是闭包完整性控制（`local-skill-resolver.mjs:109-111` fail_loud、`skill-bundle-release.mjs:245,291`），只能对齐不能绕过
impact: 范围与验收；两个红灯与技能闭包完整性
consequences: 两个检查转绿，第三条回归 `stage-reflection-wiring.test.mjs:143` 一并闭合
risks: 对齐等于把未经审查的字节正式接受为基线
rejected_alternatives: C2 回退 SKILL 内容（打破 `no-external-stage-agent-gate` 断言并重新引入已退役外部 Stage Agent 依赖）；C3 修正比较口径（七种口径均不能复现声明值）
unresolved: 无
module: skills
requirement_ids: [R-010, R-012]
derived_from: [D-015]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-021

question: 只发布方向审查时，runtime 为何写出 subject=detail_review、status=recorded 的质量事实？该谎报如何修正？
selected_option: 纳入本轮作为实现 bug 修正
recommendation_status: recommended
recommendation_reason: 质量事实谎报属宪法明禁，且写入点与触发条件可定位
plain_language_meaning: 大白话：方向审查跑完时，系统顺手写了一条「细审已完成」的假记录，这条要修掉。
source_type: user_reply
source_exact_excerpt: 纳入本轮修掉
approval_status: approved
approval_ref: talk-round-3 / ask_user_question 选项卡 OI-21
approval_hash: cdfb216230917a012b70b7b0dac80400bb71b7506a006e09ad709b4183326603
facts_and_constraints: 现场落点 `quality/facts/c53bc2019....json`（kind=review、subject=detail_review、status=recorded），而 detail review 实际未运行；同批 direction_review 落点为 `quality/facts/deb32b6cd8cee3a9c01e878e65962a88b01c1eb78697b62d3ea0989e4ce394d0.json`。**step 10 实测已把真实触发条件查清**：不是「只传 direction」，而是「哪个轨没有 `receipts.<track>_review`，该轨的 review 事实就回落到 `evidence_refs` 中第一条 `quality/reviews/results/` 引用，且不校验 `review_track`」——`runtime/stage/stage-runner.mjs:1595` 的 `evidenceCandidate` 在 `facts.reviews.direction|detail` 没有 `result_ref`/`attempt_ref`/`hash` 时回退到 `result.evidence_refs` 的首条 `quality/reviews/results/`（`:1638-1643`）；`reviewEvidenceStatus`（`:1693-1753`）只对 verify-code/build-code 校验快照与 subject，对 make-decision **不校验 `review_track`**。step 6 与 step 10 的现象（只传一轨 ⇒ 另一轨事实指向该轨 result）是同一机制的镜像。**副作用**：`quality/facts/` 现存每个 review subject 两条指向不同 result 的冲突事实
logic: 现场观测到谎报事实 -> 定位写入点与触发条件（`stage-runner.mjs:1595` 回退 + `:1638-1643` 取首条引用 + `reviewEvidenceStatus:1693-1753` 不校验轨）-> 使两轨事实各自绑定本轨 result、无本轨 result 时不得回落 -> 最小修正 -> 两种场景各有测试
choice_reason: 只删记录会掩盖问题，必须修写入逻辑的触发条件
impact: 范围与验收；质量事实的可信度
consequences: 只发布方向审查时不再产生 detail_review 的 recorded 事实
risks: 修正若影响 detail review 真实运行时的记录路径
rejected_alternatives: 只删除已落盘的谎报记录而不修写入逻辑
unresolved: 无
module: runtime/review
requirement_ids: [R-014]
derived_from: []
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-022

question: 派发前的预检要做到哪一步，才能让有问题的 provider 在开工前就被拦下、而不是派发后才死？
selected_option: 预检按用户「全部塞进本任务」纳入本任务：补 host_provider 白名单校验，并把 model id / CLI 可执行性 / 认证 / 活性探测一并纳入；同时按用户裁定显式修订 F-017② 红线
recommendation_status: recommended
recommendation_reason: 用户已主动取消范围上限，且本任务 step 6 现场两次因 host_provider 取值落 REQUEST_INVALID（blocked_before_dispatch，0 provider），证明 WH 预检确实放行了 BR 不认的 host_provider
plain_language_meaning: 大白话：开工前先把明显不能用的 provider 挡掉——名字不对、模型没配、命令不在、认证没配的，别派出去才发现。
source_type: user_reply
source_exact_excerpt: 全部塞进本任务
approval_status: approved
approval_ref: grill-G2（2026-09-17）
approval_hash: db7c079ac5e0ef0eb053c1f3207233c5ef473c3353d690d5d552e50e55530b6e
facts_and_constraints: 需求1 用户原文「1.开始之前的预检要做好，有问题的provider就别开始」。预检**已存在**：`skills/wh-review/scripts/simple-review-runner.mjs:784-846 runStaticPreflight`（`blockedPreflight` 在 `:699`）。**甲类可闭合缺口**：`skills/wh-review/scripts/third-review-host-config.mjs:206 adapterOf` 只做正则，不校验 3rd-review 的 `SUPPORTED_PROVIDER_IDS`（`3rd-review/lib/provider-ids.mjs:1-9` 含 claude-code/codex/cursor/dsh/grok/kimi/opencode/antigravity，**不含 claude**）→ host_provider 取 claude 能过 WH 预检、到 `3rd-review/lib/broker.mjs:556` 才死（本任务 step 6 现场两次 REQUEST_INVALID）。model id **无任何校验**（`3rd-review/lib/config.mjs:72` 只要求非空串；WH `third-review-host-config.mjs:652-655` 当不透明串）。CLI 存在性只有 claude-code 有 `beforeSpawn` X_OK（`3rd-review/lib/adapters/claude-code.mjs:35-38`），其余靠 spawn 失败。认证只验形状/环境变量（`3rd-review/lib/config.mjs:59-63`、`lib/broker.mjs:651-652,:917-918`）。doctor 全适配器只跑 `--version`（`3rd-review/lib/broker.mjs:634-660`，`:655` 自标 `executable_only`，`:659` 自述不验认证与真实审查），且 **dispatch 路径从不调用它**（全仓唯一调用点在 `:655` 自身的 doctor 体内）。结论：静态预检原理上发现不了 antigravity 这类运行时失败（agy 内部 5 分钟到期 → exit 0 + 空 stdout）。红线：`specs/archive/workflowhub-review-flow-repair-20260906/decision-log.md:45`（F-017②「provider 进程/超时/输出类保持运行时 unavailable」）与 `:161`（延期项⑥ provider 健康探测/限流降级）
logic: 用户裁定「全部塞进本任务」→ 预检边界由「仅静态可判定必败项」显式修订为含 provider 身份/可执行性/认证/活性校验 → 在 `buildBundle`/`runGroup`/锁之前拦截 → 用可复现命令验收
choice_reason: 用户主动取消范围上限并明确要求「有问题的 provider 就别开始」；且现场有两次真实前置失败可复现，修复靶点明确
impact: 范围与验收；wh-review 预检边界；`3rd-review` 写入授权扩大
consequences: `3rd-review` 的写入授权由 talk-round-4 的 antigravity A+B 两处扩大为「加上需求1/2/3 所需的改动」；F-017② 与延期项⑥在本任务内被显式修订，修订依据与范围写入 `## 需求权威更新（用户裁定，2026-09-17 grill-G2）`
risks: 预检若引入墙钟计时判死会触 D-030③；活性探测若做成第二个 elapsed-time timer 会与 BR config 已退役的 `deadline_ms` 冲突
rejected_alternatives: 不改预检、只在 BR 失败后做事后归因；把「把 antigravity 移出派发」当作解决；以改 `~/.config/workflowhub/config.json` 替代校验
unresolved: 无
module: skills/wh-review
requirement_ids: [R-015, R-010]
derived_from: [D-019]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-023

question: 审查中的健康检测怎么做到一有问题就立刻停止或重发，而不是每次都要等到时限结束才知道失败？
selected_option: 20 分钟维持当前值不改；把 broker 中真实的非终态成员级失败事实暴露出来，并修正三条使重发失效的实现 bug
recommendation_status: recommended
recommendation_reason: 用户既要求 20 分钟、又明确要求不再等满时限才知道失败；三条实现 bug 均已定位到具体行，且用户已授权新增非终态成员级公开面
plain_language_meaning: 大白话：20 分钟这个上限本来就是现在的值，不动它；但别让一个已经坏掉的 provider 拖满它——把真实的成员级状态摊出来，同时把「重发」这条路修通，让它真的能重发。
source_type: user_reply
source_exact_excerpt: 改成20分钟，同时我不希望任何审查provider发生真卡死或停止时，真的要等到时限结束才能直到结果，我需要你调查根本原因，彻底解决这个时间浪费的问题
approval_status: approved
approval_ref: grill-G2（2026-09-17）
approval_hash: 9219b803fe795e8b3ab38fd7003a5fcf472a9d75a2ae9be75f8c0e81998ece75
facts_and_constraints: 需求2 用户原文「2.审查中的健康检测要做好，有问题立刻停止或重发」；用户 G2-impl 选项原文「再加「非终态成员级事实」（跨仓新增公开面）」。**20 分钟本来就是当前值**（`skills/wh-review/scripts/simple-review-runner.mjs:40 DEFAULT_MANAGED_TERMINAL_WAIT_MS = 1_200_000`）→ 该项是确认动作，不因它改码。**为何必须等满**：`3rd-review/lib/broker.mjs:156-164 managedPublic` 只在 terminal 时附 `group`，`assertManagedPublic:169` 显式拒绝非终态带 group；WH 镜像 `skills/wh-review/scripts/review-provider-client.mjs:593-600`；WH 轮询 `simple-review-runner.mjs:530-542` 只看 `current.state`。`projectStatus`（`3rd-review/lib/broker.mjs:617-624`）**本身含** `providers[id].status / error.code / last_progress_at_ms`，是现成但对 managed 不可达的载体。`PROCESS_STALLED` 只诊断不终止（`lib/health-runner.mjs:54`），且只对有 `probeSession` 的 provider 生效（`health-runner.mjs:29-32`）；antigravity 无 probeSession（`lib/adapters/antigravity.mjs:26 continuation:false`、`:30 resume` 抛错）＝设计决定。**三个甲级 bug**：①`lib/provider-failure.mjs:67` 的正则匹配不到 agy 的 `[agy] print timeout after 5m0s with turn in progress; returning partial output` → 落 `PROCESS_EXIT_NONZERO`（`:79`），最终被 `antigravity.mjs:8` 说成 emitted no final text；②`lib/broker.mjs:1124-1125` **只实现 `fresh_execution`**，`same_session_repair` 静默 no-op；③`lib/broker.mjs:1118-1120` 要求 `review_mode` 不属 `{single_round, full_only}`，而配置里 make-decision/build-spec/build-plan 全是 `single_round`、build-code 是 `full_only` ⇒ **所有阶段的重发都被关着**。用户已授权「非终态成员级事实」：`3rd-review/lib/broker.mjs:156-164,:757-767` + WH `review-provider-client.mjs:593-601`
logic: 用户裁定 20 分钟 + 要求立刻可知失败 → 不动阈值 → 披露既有真实成员级事实（非自造判定，故不触 D-030③）→ 修正三条重发 bug → 逐项可复现验收
choice_reason: 「立刻知道失败」可不依赖新阈值达成；三条 bug 是可定位可测试的实现缺陷，且修后 `minimum_heterologous` 与审查标准一条不动
impact: 范围与验收；managed 轮询等待侧行为；`3rd-review` 公开信封演进
consequences: WH 不再必须等满 20 分钟才知道某个成员已失败；`single_round`/`full_only` 阶段也获得重发能力；协议约束「非终态不得带 group」须连同其测试守卫一并演进
risks: 非终态成员级事实的公开面若设计成第二个判死信号，等于绕过 D-030③；跨两仓同步期间旧 WH 遇新 BR 字段须容忍
rejected_alternatives: 改小 20 分钟阈值；接通 `cancelManaged` 让 WH 主动杀进程（既有测试正断言该路径绝不调用 `cancelManaged`，且与 D-030③ 冲突）；把 antigravity 移出派发；只加日志不改重发实现
unresolved: 无
module: skills/wh-review
requirement_ids: [R-016, R-010]
derived_from: [D-004, D-019]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-024

question: 输入/输出格式怎么宽容化，才能在稳定拿到异源审查建议的同时不碰审查标准红线？
selected_option: 按甲/乙/丙三类落地：甲类修实现 bug、乙类做格式宽容、丙类 7 条红线原样保留
recommendation_status: recommended
recommendation_reason: 用户明确要求「对整体输入和输出宽容一些」，又明确「确认这个边界：宽容格式，7 条红线不动」；甲类已有现场 8 次误杀与一次 outcome=partial 却实得 14 条 findings 的硬实证
plain_language_meaning: 大白话：让系统对格式别那么挑——围栏、JSONL、多包一层、多几个键都尽量读出来；但审查的门槛（材料要真、行号要真、异源下限、私有路径、必需键、非 minor 要证据）一条都不降。
source_type: user_reply
source_exact_excerpt: 3.不要再因为输入或输出格式问题导致审查失败了，太浪费时间和token了，需要对整体输入和输出宽容一些，目标是获取异源审查建议，不是一份内容详细格式正确的审查报告！
approval_status: approved
approval_ref: grill-G2（2026-09-17）
approval_hash: 8d8f172ad8d97d9b3c17fae15b6f997c92f7f2ff8684589613f458325c07e632
facts_and_constraints: 用户划分要求（甲/乙/丙三分是硬要求）。
  **甲类（实现 bug）**：`skills/wh-review/scripts/review-materials.mjs:426` 的 `LOCAL_HOST_PATH` 正则字符集不含 CJK 标点，路径后紧跟的中文被一路吞入 `<host-path-redacted>` 直到下一个空格，**破坏审查包内容**（现场复现：对当前材料脱敏后 `host-path-redacted` 24 次、总字节 −1196、`取消理由：` 消失、`DEF-01` 计数 20→19；detail 审查据此所报的 2 条 minor 属该伪影而非材料损坏）——修法只收紧字符集与边界，不改 fail-closed 红线。
  `3rd-review/lib/workflowhub-result-v3.mjs:169` 的成员级 `hasPrivatePath(result)` 覆盖成员 `output` 原文，一条 finding 的 issue/recommendation 里出现一个 `/xxx` 就让该成员的**完整审查输出**被整体替换为 `PUBLIC_RESULT_INVALID`（`output: null`，经 `lib/broker.mjs:454-475` → `:474 publicInvalidV3Result`），现场 8 次（kimi/coding ×5、codex/luna ×3），duration 150377~578813ms；**组级** `:185` 再对整组扫一遍（经 `lib/broker.mjs:184-185 assertWorkflowHubV3Group`，用于 managed terminal status 读取），使一个成员 prose 里的路径还能让整次读取失败——应改为**只 fail 越界成员、组记 partial**，并把路径检查限定在结构化路径字段而不扫 `output` 原文（BR 既有测试 `3rd-review/test/managed-session-lifecycle.test.mjs:146-155` 已断言「被污染成员隔离、另一成员 completed」，本项即让成员级投射路径与该既有意图一致）。WH `skills/wh-review/scripts/review-provider-client.mjs:79-80 safeBrokerError` 把 message 含路径的普通 broker 失败改判 `PUBLIC_RESULT_INVALID`，真实 code 丢失；应脱敏保原 code + `cause_code`。`skills/wh-review/scripts/simple-review-runner.mjs:1315 catch{}` 吞掉真实 parse 错、`:1316` 只回 `OUTPUT_INVALID`。`skills/wh-review/scripts/review-materials.mjs:57 PHASE_DIFF_MAX_DELIVERY_BYTES = 330*1024` **零消费者**（全仓唯一出现即声明处）；`skills/wh-review/scripts/review-input-bounds.mjs:87 WH_REVIEW_TRUNCATED_SECTION` 标记不覆盖所有丢段路径（`:83-93` 只对 implementation/test 两类补标记，其余种类静默丢弃）。**乙类（格式宽容，用户明确要求，不碰红线）**：在 `skills/wh-review/scripts/simple-review-runner.mjs:861-873` 与 `:1304-1311` 剥可选 `bundle/` 前缀、逐条 anchor verdict 只丢越界条而不整员失败；在 `runtime/review/review-output.mjs` 补 JSONL / 多围栏取唯一含 findings 者 / 被包在更大对象时的提取；顶层多余键容忍（`:33-34` 现要求顶层键恰为 `findings`）；severity 同义别名；`skills/wh-review/scripts/review-provider-client.mjs:593-596` 非终态信封忽略额外键但保留必需 5 键。**丙类红线（原样保留）**：①私有/宿主路径 fail-closed（WH `review-provider-client.mjs:39-50`、`simple-review-runner.mjs:43,700 redactHostPaths`；BR `workflowhub-result-v3.mjs:34-38`、`lib/broker.mjs:105-113`）——只许缩小爆炸半径，不许改告警后采用；②finding 必须落在真实材料 + 真实行号（`simple-review-runner.mjs:861-873`）；③`minimum_heterologous`/quorum（`third-review-host-config.mjs:723-739`、`simple-review-runner.mjs:184-201`、`runtime/review/canonical-review-result.mjs:254,:324`）；④材料允许清单与固定指令模板（`review-materials.mjs:372,:2001,:2007`）+ `REVIEW_MATERIAL_MISMATCH`（`runtime/review/review-record-route.mjs:1312-1316`）；⑤材料身份与选择绑定（`simple-review-runner.mjs:1270-1300,:1324-1334`）；⑥信封/组/成员必需键（`3rd-review/lib/workflowhub-result-v3.mjs:170,:176,:182`）——额外键可容忍、缺必需键必须失败；⑦非 minor finding 必须有 `evidence_kind`/`evidence`/`root_cause`（`runtime/review/review-output.mjs:18-21`）。**支持需求3的最强实证**：`/Users/Hugh/Downloads/paperbuilder-t08-workflowhub-root-cause.md:37,45`——一次真实 build-plan 审查 `outcome=partial`（kimi/coding 因 `PUBLIC_RESULT_INVALID` 失败），**实际产出 14 条 findings**，系统却按「review 未闭合」处理；原文「heterologous review not closed **不是因为 provider 没有给建议**」。**历史立场相反**：`specs/archive/workflowhub-review-flow-repair-20260906/decision-log.md:85,156`（禁放宽校验、禁失败改空 findings）；`/Users/Hugh/Hugh/Downloads/3rd-review审查流程根因调研与改造建议-2026-07-15.md:519`（不承诺容错解析）、`:610`（输出须为唯一 schema-valid JSON）；`runtime/review/review-output.mjs:33-34`（顶层键必须恰为 findings）与反向断言 `skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs:384,391-399`
logic: 用户裁定宽容格式但 7 条红线不动 → 逐项归入甲/乙/丙 → 甲类修实现 bug 并缩小爆炸半径 → 乙类做格式宽容 → 丙类逐条保留并可用 diff 验证 → 反向断言同批改并写明理由与新边界
choice_reason: 甲类已有现场 8 次误杀与 outcome=partial 实得 14 findings 的硬实证，说明失败源于格式而非没有建议；乙类直接对应用户「目标是获取异源审查建议」；丙类保证宽容不等于降标准
impact: 范围与验收；审查材料/输出的解析边界；若干既有反向断言的预期
consequences: 这是相对 `review-flow-repair:85,156` 与既有反向断言的**方向性转向**，测试须同步修改并写明理由与新边界；宽容仅作用于格式层，审查标准一条不降
risks: 宽容若越界成「锚点不真实也放行」「私有路径改告警后采用」「调低 minimum_heterologous」即触红线；历史 guard 测试的修改若只改断言不写理由即为掩盖
rejected_alternatives: 把容错做成放宽校验；把 provider 失败改判为空 findings 后照常通过；继续要求唯一 schema-valid JSON 而放走已到手的建议；为达成宽容而调低 `minimum_heterologous` 或把私有路径检查改为告警
unresolved: 无
module: runtime/review
requirement_ids: [R-017, R-010]
derived_from: [D-011]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-025

question: attempt 的公开事实为何与实际失败不一致，事后怎么区分「进程失败」与「解析失败」？
selected_option: 纳入本任务修掉：attempt 公开事实以 parse 结果为准，并让归因可区分进程失败与解析失败
recommendation_status: recommended
recommendation_reason: 用户选择「再加「非终态成员级事实」（跨仓新增公开面）」；9 条 antigravity 失败记录的 `attempts[0]` 记 `status: completed`/`error: null`，与真实失败直接矛盾
plain_language_meaning: 大白话：失败的那次尝试现在被记成「成功完成」，事后根本分不清是进程坏了还是输出没解析出来；这条要修，否则归因永远是错的。
source_type: user_reply
source_exact_excerpt: 再加「非终态成员级事实」（跨仓新增公开面）
approval_status: approved
approval_ref: grill-G2（2026-09-17）
approval_hash: 4a85a35464e07d182f9e851d33f2c781b2541a3ddb68d4bee4fdba9d2e638dc4
facts_and_constraints: 用户 G2-impl 选项原文「再加「非终态成员级事实」（跨仓新增公开面）」。9 条 antigravity 失败记录里，同一 member 内 `attempts[0]` 记 `status: completed` / `error: null`——`3rd-review/lib/broker.mjs:1063` 用**进程级** ok 判定（`status: attempt.ok ? "completed" : ...`），在 parse 之前写入 → 公开 attempt 事实与实际失败不一致，事后无法区分「进程失败」与「解析失败」。另有 `runtime/review/schemas/attempt.schema.json:331 additionalProperties: false` 且属性表 `:203-324` 无 `evidence_anchor_valid`、无原始 stdout（只有 `raw_output_ref`/`raw_stderr_sha256` 摘要），`skills/wh-review/scripts/review-result.mjs:84-87` 在写 `execution.raw_output_ref` / `session_file_path` 时直接抛 TypeError
logic: 现场 attempt 事实矛盾 → 定位到进程级 ok 先于 parse 写入（`3rd-review/lib/broker.mjs:1063`）→ 改为以 parse 结果为准 → 归因区分进程失败与解析失败 → 可复现验收
choice_reason: 归因正确是所有重发与失败分类的前置；用户已选择新增成员级事实公开面，本项是其落盘一致性前提
impact: 数据状态与验收；attempt 公开事实的可信度；`attempt.schema.json` 出现新增持久字段
consequences: 失败 attempt 不再被记为 completed；`attempt.schema.json` 新增字段构成一个显式「净减或持平」例外，登记于 `## 净减或持平例外清单`
risks: 改动 attempt 写入语义会影响既有 attempt 消费者与历史记录的可比性；新增持久字段若无 consumer 即为净增控制面
rejected_alternatives: 只改展示层不改写入判定；把 attempt 事实改成不落盘；在 schema 里保留 `additionalProperties: false` 却把新事实塞进非持久内存
unresolved: 无
module: runtime/review
requirement_ids: [R-016, R-010]
derived_from: [D-019]
artifacts: [decision-log.md, spec.md]
supersedes: 无

### D-026

question: 材料写入使已发布的人工确认与交互聚合失效、迫使重复确认与重发聚合的重绑级联，其根因是什么、如何在三个阶段一并消除？
selected_option: 做 D4（读侧对称，接受完整性语义变更并同批改一个测试断言）＋ 一并纳入 OI-26（make-decision / build-spec / build-plan 三阶段同批治理）
recommendation_status: recommended
recommendation_reason: 用户给出两条选项并全部选择；D4 是同一根因的唯一读侧对称修法（约 4 行、一处改动覆盖 make-decision 与 build-plan），D1/D2/D3 与 F1~F3 是同一族问题在 build-spec / build-plan 侧的边界收口
plain_language_meaning: 大白话：现在系统给「你已经确认过的版本」打的记号太宽——只要材料再多写一个字，记号就对不上，于是它逼你重新确认、重新发一遍聚合。修法是让「读」的一侧和「写」的一侧用同一把尺子：只有 decision-log.md 真的被改了才算失效，别的地方动一动不算。
source_type: user_reply
source_exact_excerpt: 当前一个收口的命令都做了1个多小时，这就是整个workflowhub特别浪费时间和token的重要表现，请检查根本原因，看看到底为什么会这么浪费时间？当前任务有没有治理这个类似的问题？
approval_status: approved
approval_ref: 增量决策（2026-09-17，收口重绑级联）
approval_hash: a9be67892f059fa5bdc607b635d740a0ee3f32443295849d7c72949e4c6e033d
facts_and_constraints: 用户本轮两条选项原文逐字保留——「再做 D4（读侧对称，需接受完整性语义变更 + 改一个测试断言）」与「一并纳入 OI-26（推荐）」，两条同时采纳；除此两条之外，本轮用户未给出其他答复，材料不得新增别的用户原话。实测：收口窗口 11:29:22→12:36:48 本地共 67.4 min（主会话空等 62.7 min / 13 次 sleep），该窗口写 164 个文件（占全 task store 356 文件的 46%），confirm 4 次同句 / 聚合 3 次 / reflection 2 次 / 材料 draft 3 次；全仓 vNext 确认 247 份（make-decision 103、verify-code 70、build-plan 51、build-spec 13、build-code 10），build-plan 8 组重绑样本 + build-spec 1 组（7 份 / 7 个 revision / 20.2 min），build-plan 重绑窗口代价 83 个文件。根因三层：①共性＝确认身份用全局 `material_revision`+`snapshot_tree`（`runtime/task/task-kernel-implementation.mjs:952-953`），范围另有更窄的 `material_scope`/`material_scope_revision`（`:976-983`），身份宽于范围；②make-decision 失败在写侧去重（`task-kernel-implementation.mjs:913-921`，仅 `directionOnly` 分支有豁免）；③build-spec 失败在读侧实时重算（`runtime/stage/stage-runner.mjs:3057` 用材料实时字节算 `currentDecisionScopeRevision` + `runtime/stage/stage-content-contracts.mjs:359-372` 强判等），该阶段自身不写 decision-log（`tools/cli/stage-runtime.mjs:49-53`）故无自触发；④build-plan 范围最宽 + 下游写入（`runtime/stage/completion-predicates.mjs:31` 四份；`workflows/build-code/SKILL.md:73`、`workflows/verify-code/SKILL.md:57` 合法改写 `tasks.md` 执行状态填写区；读侧回退 `stage-runner.mjs:1668/1681` 未复用写侧 `runtime/task/git-worktree-snapshot.mjs:503-526` 的执行段豁免）。方法论声明：build-spec / build-plan 的 `decision_freeze` 结论从不落盘，故只能说「无持久化、历史中不可观测」，不得据此断言「未发生」。两条 agent 自纠提案已撤回并留档（见 `## 需求权威更新（用户裁定，2026-09-17 增量决策）`）。
logic: 用户实测质疑（收口超 1 小时）→ 定位到「材料写入即令确认失效」的重绑级联 → 核查治理覆盖（25 条 OI / 25 条 D / 风险节 / 仓外延期文件均无一条覆盖）→ 定位四个坏点与真实根因（`stage-runner.mjs:3057` 用材料实时字节）→ 提交根因给用户 → 用户裁定「做 D4 + 一并纳入」→ 落 F1~F3 / D1~D4 与明确不做的 D5/D6
choice_reason: D4 是读侧对称的最小改动（约 4 行、一处覆盖两个阶段），且与写侧既有豁免对齐；D1/D2/D3 只补文档边界与一处漏记，不动流程与人工确认点；D5/D6 会削弱确认完整性或把上游漂移藏进 plan，故明确不做
impact: 数据状态与验收；make-decision / build-spec / build-plan 三阶段的确认语义；确认完整性的语义边界；`runtime/stage` 出现约 4 行新增改动与一个测试断言变更
consequences: 收口窗口的重复确认与重发聚合不再由普通材料写入触发；确认完整性语义发生一次经用户授权的变更（`decision-log.md` 实质改动仍使确认失效，该边界不放宽）；四个 agent 自造章节从材料消失且 per-step 状态不再单独成表（用户已接受该信息损失）；`## 净减或持平例外清单` 新增一条对应例外
risks: ①D4 改变确认完整性语义，已获用户明确授权，反例＝用户确认后又实质改主意而旧确认仍被复用；②本轮增量决策本身会再触发一次重绑级联——这正是根因的现场演示，须以一次性写入 + 一次性重绑收口，并作为 F1 的对照基线
rejected_alternatives: ①D6＝把 `runtime/stage/stage-runner.mjs:3057` 改为冻结指针（会把 decision-log 真被改写一并豁免，削弱确认完整性）；②D5＝把 `STAGE_FACT_MATERIALS["build-plan"]` 收窄为两份（等于宣布 build-plan 不为 decision/spec 当前性负责，会把上游漂移藏进 plan）；③原提案「`## 最终确认` 的绑定值一律不内嵌」（所引护栏是死分支，会让 freeze 直接 paused，已撤回）；④原提案「改用 `isStageMaterialOnlySnapshotDelta` 放宽聚合写入判等」（该函数比 git tree 而非 `material_revision`，替换不了 `task-kernel-implementation.mjs:708`，且削弱完整性，已撤回）
unresolved: 无
module: runtime/stage
requirement_ids: [R-018]
derived_from: [D-006, D-012, D-021]
artifacts: [decision-log.md]
supersedes: 无

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": { "result": "non_ui", "fact": "用户原话与选项卡答复「维持零页面，成本数据只走文本输出」，原始需求中不含任何页面、交互或前端组件诉求" },
    "project_inventory": { "result": "non_ui", "fact": "现场实测：仓库无 apps/、web/、ui/、packages/ 目录；package.json 无 bin 字段与前端依赖；仅有 3 个 CLI 入口（doctor/status/run）；build-reflection-page.mjs 无生产调用者" },
    "planned_or_changed_frontend_fact": { "result": "non_ui", "fact": "本任务计划改动全部落在 runtime/、skills/、tools/cli/ 与 specs/ 材料，无新增页面、路由、组件或前端依赖（OI-17）" }
  }
}
```

## 拒绝方案

| # | 被拒方案 | 否决理由 | 依据 |
|---|---|---|---|
| 1 | 改 `~/.config/workflowhub/config.json`，从 5 条 route 的 initial 删除 antigravity/flash | 用户明确裁定禁止把改配置当作解决方案，属绕开问题 | OI-19、D-019 |
| 2 | 每条 route 收敛为「1 主力 + 1 可靠备选」 | 用户裁定该提案是伪造需求，从未提出 | OI-19、D-019 |
| 3 | 把「受影响接缝映射表」当作重采分级方案 | 净增 10-25 行并新增映射表，属新控制面，违反净减硬规则 | OI-12、D-012 |
| 4 | C2 回退 SKILL.md 内容以消除哈希漂移 | `tests/contract/no-external-stage-agent-gate.test.mjs:41-42` 正断言 `25b44430` 新写措辞存在，回退会打破现绿测试并重新引入已退役的外部 Stage Agent 依赖 | OI-20、D-020 |
| 5 | C3 修正比较口径 | 七种规范化口径无一能复现声明值，修正口径等于放行真实漂移 | OI-20、D-020 |
| 6 | 为不可达的 15 分钟记录锁改 `waitMs`，或为接通取消而修改既有断言、绕过 D-030③ | 记录锁无生产消费者；既有测试正断言该路径绝不调用 `cancelManaged`，且与 D-030③ 冲突 | OI-10、D-010 |
| 7 | 把阈值对齐为 600000 以缩短空等 | 现场无任何合法审查时长分布，600000 无依据；方向审查已指出 | OI-04、D-004 |
| 8 | 把锚点校验降级为仅记录、把私有路径检查改为告警、调低 `minimum_heterologous` | 触碰降低审查标准红线 | OI-11、D-011 |
| 9 | 减少、搬移或新增人工确认点 | 用户明确判为改错原始需求；正常问题确认、stage 收尾确认、talk/grill 交互确认都是正常工作方式 | OI-01、D-001 |
| 10 | 新建成本度量/采集通道，或给 `measure-test-runtime-profile.mjs` 接消费者 | 用户禁令 + M15 已确认这类额外物只会让 workflowhub 更臃肿；本任务禁止新增采集面 | OI-09、D-009 |
| 11 | 恢复被删的 M15 遥测五件套（含 `runtime/evidence/monitoring-facts.mjs`） | 三条新堵口之一；该五件套已被 m15-retirement 整文件删除 | OI-08、D-008 |
| 12 | 只删除已落盘的 `subject=detail_review` 谎报记录，而不修写入逻辑 | 掩盖问题而非修触发条件 | OI-21、D-021 |
| 13 | 重做已由 t2/C6 闭合的 DEF-05（复活 `quality-verify.v1` 持久对象） | 再动即复活已删除的持久对象 | OI-13、D-013 |
| 14 | 启用 `material-workspace.mjs:91` 的第三套材料写入实现 | 材料写入入口将增至 3 个，净增控制面 | OI-02、D-002 |

## 未决项

- 未决项：无。
- 说明：26 条 OI 全部为终态 `confirmed`（本轮新增 OI-26）。`## 风险与延期交接` 的 RK-1（antigravity 根因位于外部仓）**已由 talk-round-4 的用户裁定解除**：授权本任务对 `3rd-review` 做两处最小修复，其改动与验收单独登记、不计入本仓通过判据；RK-2~RK-12 是风险登记，不是未决决定。仅 step 12 语义检查发现的 9 条待处置项（该批条目在材料版本中登记为 F4~F12；其所属的 step 12 章节已按 F1 从本材料删除）属**实现细节层**，处置权归 build-spec/build-code，按 OI-07 的验收口径不在本阶段改写方向。

## Supersedes

- 本文件不 Supersedes 任何既有决定记录。历史任务材料只读保留，不改写字节。
- 本任务内部被自身纠正作废的 agent 提案（不构成决定，故无需 Supersedes 登记）：talk-round-1 被推翻的三条 agent 假设、talk-round-3 被推翻的两条 agent 伪造需求，均已在 `## 需求权威更新` 逐字留档。
- `## 决定` 中各条 `supersedes: 无`。

## 最终确认

- 状态: accepted（**本轮增量决策后的重新确认**：增量决策轮改写了本材料，按契约在此**重新确认一次**并同批重发一次交互聚合；本次确认绑定的是**本轮写入后的字节**）
- 用户逐字答复（本次，未改写）: `确认（accepted），做一次 confirm + 一次聚合发布（推荐）`
- 答复来源: 本轮**增量决策重新确认卡**（宿主结构化问答工具卡 `ask_user_question`，1 题）；上述文本即用户在卡片上所选选项的 label 原文，未改写、未预填。
- 绑定口径: 本次确认的 `material_revision` / `snapshot_tree` 由**不可变原件**承载（`quality/confirmations/<sha256>.json`，`human-confirmation.v3`、`decision=accepted`、`step_slug=approve-decision`、`reply_text` 逐字保留）。**本节不内嵌**任何绑定值（材料自身 sha256 / confirmation ref / aggregate ref / snapshot_tree），理由见下方「canonical 绑定落点」。
- **自此不再有材料写入**: 本次重新确认后本阶段材料冻结（F1：step 11 起冻结材料）；step 12/13/14 的阶段事实只落 task store（`quality/evidence/handoff/`、`quality/stage-reflection/<stage>/`、`facts.jsonl`），本材料不再为它们新增章节。
- 说明: 增量决策（2026-09-17，收口重绑级联）改写了本材料，原确认所绑定的字节已被本轮写入取代 —— 原确认 `quality/confirmations/3207674906483bbb8bb48089cc9f0c2514b13d026b623db4ac26fcdc91f16880.json` 绑定 `material_revision=revision-0e3f39562fe2cdd72dcd6c6de19033bd6d0665ca64929e3debdf42cea31e235b` / `snapshot_tree=44066603a9ce0581fd6783b9ddca6b12d2dbc5c6`（写入本材料时的 sha256 `1a88ab7b…`），该字节集已被本轮写入取代。原确认与交互聚合作为 **provenance 保留，不删除**；本轮已按契约重新确认，当前确认状态见本节首行。
- 重绑级联的实证（收口窗口 2026-09-17，四条 canonical confirmation 原件逐条回读；材料先前的登记只有第 1 次）：

| 序 | canonical confirmation ref | `confirmed_at`（UTC） | `material_revision` | `snapshot_tree` |
|---|---|---|---|---|
| 1 | `quality/confirmations/b1c2d5cc4dddfba27146aa226f0ca159ebf03489bd9d203606c2d945933525a9.json` | `2026-09-17T04:16:55.623Z` | `revision-5f6569929925ad6f4debf993f57f5298168d0346cf48242a8bcf43744745d936` | `ce9923b9474d3890b82a38547f9f712f8684f8d4` |
| 2 | `quality/confirmations/c102b6741a2b75ff8e02a1e2121324c5d2896ce2ffb0d508e35a8aceb72d6723.json` | `2026-09-17T04:32:19.983Z` | `revision-ae1f4e2a328931b8180c472ca7f2d864817d7261d5970f680d5cbc9aa3c96fd7` | `e60037427a75eed262f1a312e20ff03467f75fee` |
| 3 | `quality/confirmations/08381cad9f6c23dd15aac7bb61cc92065d82af873d3c0c8ee37e50a2cb767bc0.json` | `2026-09-17T04:26:48.597Z` | `revision-ca0d75b038bbbf4945347663f6e848d81e045fd49e118ed634aff609781f2d22` | `a182bc3fcd305c442d72ad2637c9a9c4d893b169` |
| 4 | `quality/confirmations/3207674906483bbb8bb48089cc9f0c2514b13d026b623db4ac26fcdc91f16880.json` | `2026-09-17T04:35:17.552Z` | `revision-0e3f39562fe2cdd72dcd6c6de19033bd6d0665ca64929e3debdf42cea31e235b` | `44066603a9ce0581fd6783b9ddca6b12d2dbc5c6` |

- 四次确认的**逐字答复完全相同**：「确认，收口吧，不要急着进入build-spec」。用户逐字答复与来源（第 1 次）：user（本会话真实答复）。宿主结构化问答工具卡 `ask_user_question` 调用 `call_00_YLJO07Dl5uyGlg5CxIux1641`（step 11 最终确认卡，1 题 3 选项），用户**未选任何列出的选项**，以自由文本作答；回答消息 id `5b6be183-3d61-49a6-96ae-a80a5a4e95ef`。该自由文本未改写、未预填。
- **第 2/3/4 次为同一逐字答复的重绑签发**：用户在此期间**没有**给出新的表态或新的答复，这三次只是同一句话因材料字节变化而被重新签发（各自绑定不同的 `material_revision` / `snapshot_tree`）。材料原先只登记了第 1 次确认，后 3 次**均无登记**；本轮据 task store 四份原件逐条回读补齐。
- 交互聚合（前三份作为 provenance 保留，均已被取代）：`quality/evidence/interactions/` 此前三份 93298 B 同形原件（`464e80c2…`、`8f9bcae5…`、`e7d7f45f…`），其 `oi_dispositions` 各覆盖 **22 条 core OI**，均**不包含**本轮新增的 OI-26；OI-26 的 core 绑定已与本次重新确认**同批发布**为第 4 份聚合，覆盖 **23 条 core OI**（22 + OI-26），其 `decision.hash` 绑定本轮写入后的决策日志字节。
- 增量决策轮的用户裁定答复原文（**仅两条**，逐字保留，不得扩张）：`再做 D4（读侧对称，需接受完整性语义变更 + 改一个测试断言）`、`一并纳入 OI-26（推荐）`。
- canonical 绑定落点（为什么本节不内嵌其值）: canonical confirmation 的 bytes 内含本材料的 `material_revision`（由本文件 bytes 派生）；interaction aggregate 的 bytes 内含 `decision.hash`（＝本文件写入后的 bytes sha256）并含该 confirmation；`snapshot_tree` 亦包含本文件。把上述任一 ref/hash 写进本文件都是**内容自引用、无不动点**。因此三者一律由不可变原件承载、本节只记录事实来源与绑定口径：
  - 人确认（本次；此前四次已被取代并作为 provenance 保留）→ `quality/confirmations/<sha256>.json`（`human-confirmation.v3`，`decision=accepted`、`step_slug=approve-decision`、`reply_text` 逐字保留）；
  - 交互聚合（本次；此前三份已被取代并作为 provenance 保留）→ `quality/evidence/interactions/<sha256>.json`（`workflowhub-interaction-aggregate.v1`，**5 个真实 talk 生命周期轮次** + **2 个真实 grill 轮次**；本次聚合的 `oi_dispositions` 覆盖 **23 条 core OI**，含 OI-26）；
  - 阶段事实 → `quality/facts/` 的 confirmation / `outline_closed` / `human_confirmation` 质量事实。
- 该确认不是什么: 不是 build-code/verify-code 的进入许可证；不是不可逆操作授权（commit/push/merge/archive/cleanup 仍需独立 `authorize`）；不是质量结论。
- 本轮用户同时保留此前「不要急着进入 build-spec」的约束：重新确认完成后**仍不得**据此开始 build-spec。
## 文档结果

| 文档 | 结果 | 说明 |
|---|---|---|
| `decision-log.md` | 已补齐至机器契约通过（本轮增量决策后已重新确认，状态 `accepted`） | 本文件；含 UI applicability、收敛检查、26 条决定、需求矩阵、拒绝方案、未决项、Supersedes、最终确认、Exit checks |
| OI 大纲 | 26 条全部终态 | 六框架节点 + 六固定类别全覆盖，无 open 条目 |
| 延期清单 | 本任务交付物（更新动作在 build-code） | `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`，DEF-01~07 终态 + DEF-08/DEF-09 定义，由 build-code 落地 |
| agent 自造章节 | 本轮按用户裁定删除**四个**（`## 阶段步骤登记` 等三节 + `## 阶段末 spec-analyze（step 12）`） | 依据见 `## 需求权威更新（用户裁定，2026-09-17 增量决策）` 的来源裁定；per-step 状态不再单独成表，step 事实转由 `facts.jsonl`、`quality/evidence/handoff/` 与 `quality/stage-reflection/` 承载 |

## Exit checks

- 退出检查 1（决策非空）：`## 决定` 含 D-001~D-026，每条 19 个必填字段齐备，且与 OI-01~OI-26 一一对应（OI-26 ↔ D-026 为本轮增量决策新增）。
- 退出检查 2（可追溯）：每条决定的 `source_exact_excerpt` 均取自四轮 talk 与 grill-G2 的用户真实答复，或 `## 需求权威更新` 逐字原话，`approval_ref` 指向该次答复，`approval_hash` 为该摘录的 sha256。
- 退出检查 3（可验收）：26 条 OI 全部为终态 `confirmed`，每条 `acceptance` 与 `counterexample` 成对；`## 收敛检查` 四维表格行齐备。
- 退出检查 4（非 UI）：`## UI applicability` 为单个 JSON 事实，三来源结论一致为 `non_ui`，`result` 与推导值一致，且未出现 `gate: true`。
- 退出检查 5（无伪造）：`## 最终确认` 状态为 `accepted` —— 本轮增量决策改写材料后已按契约**重新确认一次**（用户逐字答复与来源见该节），绑定本轮写入后的字节；四次历史确认的逐字答复与时间以表格如实留档（第 2/3/4 次为同一逐字答复的重绑签发），增量决策轮的两条选项与本轮重新确认答复逐字保留、未新增任何其他用户答复；canonical confirmation、interaction aggregate 与 `decision_hash`/`snapshot_tree` 因内容自引用不内嵌于本文件，一律由不可变原件承载；step 12/13/14 的阶段事实按 F1 只落 task store，本材料不再设对应章节。
- 退出检查 6（非目标一致）：`## 非目标` 十二条与 `## 拒绝方案` 十四条逐条对应，无悬空条目。
- 退出检查 7（延期交接）：延期项唯一载体为仓外延期文件，本文件不出现「零延期」式声明。

## 唯一 OI 大纲

`outline_version: v1`；`task_id: workflowhub-cost-baseline-and-blocker-close-20260917`。

### 框架节点（六节点）

| framework_node | oi_ids | empty | reason |
|---|---|---|---|
| background | OI-01, OI-02 | false | |
| problem | OI-03, OI-04, OI-05, OI-06 | false | |
| goal | OI-07, OI-08 | false | |
| solution | OI-09, OI-10, OI-11, OI-12, OI-13, OI-18, OI-19, OI-22, OI-23, OI-24, OI-25, OI-26 | false | |
| acceptance | OI-14, OI-15, OI-20, OI-21 | false | |
| extension | OI-16, OI-17 | false | |

### 固定类别（六类）

| category | oi_ids | empty | reason |
|---|---|---|---|
| complete_user_flow | OI-01 | false | |
| page_scope | OI-17 | false | |
| data_state | OI-02, OI-06, OI-09, OI-10, OI-11, OI-12, OI-25, OI-26 | false | |
| success_failure_boundary | OI-03, OI-04, OI-05, OI-07, OI-14, OI-15, OI-19, OI-20, OI-21, OI-22, OI-23, OI-24 | false | |
| non_goals | OI-08, OI-13, OI-18 | false | |
| deferred | OI-16 | false | |

### OI 记录

```yaml
- oi_id: OI-01
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: complete_user_flow
  source: "用户原话纠正：我没有要求更改整个流程被叫醒次数的需求！你完全改错了原始需求！"
  question: "现有五阶段流程与人工确认点（正常问题确认、stage 收尾确认、talk/grill 交互）是否保持不变、不列入本任务改造范围？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "保持不变，不列入本任务范围：agent 原先关于「减少人工确认点」的提问被用户明确判为改错原始需求"
  evidence: "用户 talk-round-1 原话「我没有要求更改整个流程被叫醒次数的需求！你完全改错了原始需求！…会导致整个workflowhub被改的面目全非！完全不是我的原始需求！」"
  acceptance: "本任务全部改动中不含任何减少/增加/搬移人工确认点的改动；`## 决定` 中无相关条目；diff 中不出现 talk/grill/confirm 环节的增删"
  counterexample: "若本任务 diff 中出现删除或新增 `approve-decision`、`spec-clarify`、`close` 授权等人工点的改动，即判本 OI 失败"
- oi_id: OI-02
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: data_state
  source: "用户原话：…仔细梳理…数据状态…；AGENTS.md 当前治理边界"
  question: "当前任务从开始到关闭会写哪些数据、写到哪里、由谁写，哪些是唯一写入者？"
  status: confirmed
  impact_dimensions: [ordinary_detail]
  selected_disposition: "记录写入面事实：材料走 core/artifact-dir.mjs:156 ArtifactDir（2 个入口）；facts.jsonl 唯一写函数 task-store.mjs:383（3 调用点）；identity/executions 单写者注册 task-handle.mjs:871；quality/** 经 task-handle.mjs:831/839 通用入口，仅靠 denylist 保护（已实测 ≥5 调用者）；quality/facts 为内容寻址不可变"
  evidence: "子代理现场实测：task store 现况 task.json + 空 facts.jsonl + identity/ + quality/{reviews,tests}/；多写者清单见调研"
  acceptance: "本任务改动后，材料写入入口仍为 2 个、identity 仍单写者；若引入第三个材料写入者或第二写者，须在材料中显式登记"
  counterexample: "若本任务使 quality/** 多写者面扩大或启用 material-workspace.mjs:91 的第三套材料写入实现，即判失败"
- oi_id: OI-03
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: success_failure_boundary
  source: "用户原话纠正：我只是希望你找到阻塞和浪费的根本原因，进行针对性的修复"
  question: "「耗时很长、token 浪费很多」的根本原因分别是什么，每条的触发条件与代码位置在哪？"
  status: confirmed
  impact_dimensions: [ordinary_detail]
  selected_disposition: "根因定位完成，结论：①20 分钟空等的根因在外部仓（broker 只在全员终态才发布 group，3rd-review/lib/broker.mjs:160-163、:801），本仓只能改等待侧；②33% 失败率中 12 次为 antigravity/flash provider 侧 no-final-text、5 次 broker 文案、4 次限流，其中 EVIDENCE_ANCHOR_INVALID 3 次属本仓路径口径自相矛盾导致的误判；③「重采级联」头条数字无原件、多个子结论已过期，真实残留仅 3 条；④15 分钟记录锁无生产触发路径"
  evidence: "五个根因定位子代理的 HEAD 现场核验；一手 attempt 数据：33 attempt/72 provider attempt/24 failed/493 provider-分钟"
  acceptance: "每条根因给出 文件:行号 与可复现命令；凡无原件的历史数字明确标注「无原件不可复核」"
  counterexample: "若材料中出现未经现场复核的历史数字被当作事实引用，即判失败"
- oi_id: OI-04
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: success_failure_boundary
  source: "skills/wh-review/scripts/simple-review-runner.mjs:40 DEFAULT_MANAGED_TERMINAL_WAIT_MS=1_200_000；:533-539 超时只抛 REVIEW_WAIT_EXCEEDED 不 cancel"
  question: "单轮审查最长空等 20 分钟发生在哪个环节，代价多大，改成什么样才算解决？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "最终定案（talk-round-3 修正）：**不改动 20 分钟这个阈值数字**（现场无任何合法审查时长分布，审查已指出 600000 无依据）；只做两件不依赖新数字的事——①到期前先做一次终态复检，已 terminal 就直接消费，消除「已完成却白等」；②不让「REVIEW_WAIT_EXCEEDED 且零 provider_attempts」的不可用结果被 findReusableReview 当作可复用审查，消除「被钉死」"
  evidence: "用户 talk-round-3 选项卡 OI-04-r3 选择「不改 20 分钟这个数字」；根因证据 3rd-review/lib/broker.mjs:160-163、:801 与 skills/wh-review/scripts/simple-review-runner.mjs:40,529,533-539；副作用证据 runtime/review/review-record-route.mjs:511-556；**本阶段现场一手复现**：step 6 首次 attempt 因 host_provider 非法落 blocked_before_dispatch，下一次请求即 reused:true 复用该失败 attempt，source_recovered 重试被 REVIEW_RETRY_NOT_ADMITTED 拒绝，须补 current_selection + material_changed 才放行（attempt 6ea6b55a/243840df）"
  acceptance: "①20 分钟上限数值不变（可 diff 验证）；②构造「operation 已 terminal 但轮询尚未察觉」场景时不再空等；③构造「零 provider 且超时」attempt 后，同 key 审查不得复用它，且显式 judged retry 仍可用。本阶段 direction review 实测 5 分 50 秒、未触发 20 分钟上限，可作对照基线"
  counterexample: "若改动了 1_200_000 这个数值却无现场依据，或产生一条永久不可重试的不可用审查，即判失败"
- oi_id: OI-05
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: success_failure_boundary
  source: "上一轮 waste-reduction 实测：72 次 provider attempt 中 24 次 failed；33 次 review attempt"
  question: "provider 失败率 33% 的成因里，哪些可在本仓消除、哪些属于跨仓或环境问题？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "归类结论：跨仓/环境 = PROVIDER_OUTPUT_INVALID(12，全 antigravity/flash)、PUBLIC_RESULT_INVALID(5，broker 文案)、RATE_LIMITED(4)；本仓可控 = EVIDENCE_ANCHOR_INVALID(3，路径口径自相矛盾导致的误判)、REVIEW_SOURCE_DRIFT(3，止损缺口)、MATERIAL_FORBIDDEN(2)+MATERIAL_INCOMPLETE(1)（键名邻近误用）、REVIEW_WAIT_EXCEEDED(1)；用户选定三类修复全做（bug 修正 + 止损 + 处置 antigravity）"
  evidence: "用户 talk-round-2 选项卡 OI-05 自由文本答复「1、2、3都要做」；失败分布来自上一轮一手 attempt 目录实测"
  acceptance: "给出按签名的失败分类表与可控性判定，每条附 文件:行号；报告侧不再出现大批失败码落为未归类"
  counterexample: "若把跨仓归因的失败（如 broker 文案、限流）算作本仓可修复收益，即判失败"
- oi_id: OI-06
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: data_state
  source: "上一轮任务引用的断言「worktree 任一字节变化触发实现采集+最终聚合+集成审查全部重采、聚合实测重跑 8 次」；HEAD 现场复核：canonical-receipt-writer.mjs:344-347、stage-runner.mjs:1791-1801、review-record-route.mjs:548-552"
  question: "证据重采级联一次改动会触发几次重采、各耗时多少，按什么规则分级才不误判？"
  status: confirmed
  impact_dimensions: [ordinary_detail]
  selected_disposition: "现场复核结论：头条断言「重跑 8 次／249–323s／37.9 分钟」全仓无可复核原件，降级为不可复核；「材料一改审查即过期」「聚合每次重跑」两条已过期（material_id 已移出去重键、reuse 测试为证）；真实残留仅三条：全源 source_digest 复用粒度、assertVNextSourceStable 强制全量重采 ×2、freshness.mjs:269-288 死代码"
  evidence: "canonical-receipt-writer.mjs:344-347；stage-runner.mjs:1791-1801；review-record-route.mjs:548-552；tests/contract/test-capture-reuse.test.mjs 与 review-budget-deletion.test.mjs 实测"
  acceptance: "材料中凡引用历史重采数字处必须标注「无原件不可复核」；不得以此作为收益基线"
  counterexample: "若材料中把 37.9 分钟/8 次当作已证事实用于论证收益，即判失败"
- oi_id: OI-07
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: success_failure_boundary
  source: "工作流准出要求：卡级 AC 每条必带失败判据"
  question: "本任务的可验收成功标准是什么，每条怎么算通过、怎么算失败？"
  status: confirmed
  impact_dimensions: [goal, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r3
  selected_disposition: "本任务验收标准定案（talk-round-3）：验收对象限定为可观察行为 + 行数事实 + 命令退出码三类；每条修复逐项写出「通过判据 / 失败判据」；质量账本只认 `acceptance_criterion` facts 一种；不新增采集面、不使用收益数字、不以 fixture/simulation 充当 after。"
  evidence: "用户 talk-round-3 选项卡答复「剩 3 条 OI 本轮全部定案，且每条修复写出逐项通过/失败判据」；OI-04/05/10/11/12/13/15/20/21 的 acceptance 与 counterexample；`## 审查处置` 第 8 项（验收口径不可证伪）采纳记录"
  acceptance: "①每条修复在 OI 大纲与 `## 决定` 中同时给出通过判据与失败判据；②三类验收对象各有可复现命令或可核对行数表；③材料中不出现凭空的 before/after 收益数字"
  counterexample: "若某条修复只有「阻塞不再发生」这类无法证伪的措辞而无逐项判据，或验收依赖新增采集面/收益数字，即判本 OI 失败"
- oi_id: OI-08
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: non_goals
  source: "用户原话：不要跳阶段，也不要依赖 build-spec 补需求；历史非目标清单"
  question: "本任务明确不做什么？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "采用历史非目标 + 三条新堵口：①不恢复被删的 M15 遥测五件套 ②不改外部审查仓 ③不动历史 provenance 字节"
  evidence: "用户 talk-round-1 选项卡 OI-08 选择该推荐项；用户原话「我不希望你加一大堆统计、收集类的功能…M15任务的时候，已经确认了」"
  acceptance: "`## 非目标` 章节逐条列出并被 `## 决定` 引用；三项堵口在 diff 中可核验：无新增采集文件、archive 字节不变、且对 `3rd-review` 的写入逐条落在 `## 需求权威更新（用户裁定，2026-09-17 grill-G2）` 第 5 条的**授权改动清单**之内（除本任务显式授权对该仓的改动外不写入该仓；越界判据＝超出该清单逐条列明的文件与目的，见 G2 章节）"
  counterexample: "若出现 `runtime/evidence/monitoring-facts.mjs` 复活、或 `3rd-review` 仓出现**超出 `## 需求权威更新（用户裁定，2026-09-17 grill-G2）` 第 5 条授权改动清单的写入**（该清单逐条列明授权文件与目的，含 `lib/adapters/antigravity.mjs` 的 A+B、`lib/provider-failure.mjs`、`lib/recovery-policy.mjs`、`lib/broker.mjs`、`lib/workflowhub-result-v3.mjs`）、或 `specs/archive/**` 字节被改，即判本 OI 失败"
- oi_id: OI-09
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: data_state
  source: "用户原话纠正：我不希望你加一大堆统计、收集类的功能…之前做M15任务的时候，已经确认了，这些额外的东西只会让整个workflowhub变的更臃肿更难维护"
  question: "在明令禁止新增统计/采集功能的前提下，根因定位用什么手段完成？是否允许使用既有工具的一次性输出作为证据？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "只用「读代码 + 读既有落盘事实」定位根因：允许读取既有 attempt/receipt/测试文件与 git 历史，禁止新跑真实任务、禁止新建采集面、禁止改造既有工具并接入流程。用户已在 OI-14 明确不产出收益数字"
  evidence: "用户 talk-round-2 对 OI-10 的纠正原话（不加统计收集功能）；OI-14 的选择；本次五个根因定位子代理全程只用 read/grep/git 与既有 attempt 目录"
  acceptance: "本任务 diff 中不出现任何新增采集文件/字段/命令；根因结论全部附 文件:行号 与可复现只读命令"
  counterexample: "若本任务新增任何采集面，或为了让 measure-test-runtime-profile.mjs 进入流程而给它接消费者，即判失败"
- oi_id: OI-10
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: data_state
  source: "simple-review-runner.mjs:40,533-539；wh-review-cli.mjs:446 waitMs=900000；用户原话纠正：进行针对性的修复"
  question: "空等与记录锁的针对性修复分别是什么：缩短阈值、暴露停滞事实、接通取消，还是组合？如何避免修复变成「再加一层」？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "按真实根因重排（用户选定）：①20 分钟空等按 OI-04 组合拳修；②「15 分钟记录锁」经实测无生产调用者（wh-review-cli.mjs:877 自述 Not reachable from the public CLI，D12 明文禁止），改判为「删除该无消费者私有面及其专属锁」，属净减而非改参数；③「接通 cancelManaged」经实测不可行——tests/review/review-managed-lifecycle.test.mjs:441-466 正断言该路径绝不调用 cancelManaged，且与 D-030③ 冲突"
  evidence: "用户 talk-round-2 选项「按真实根因重排」；git grep runTaskBoundE2eReview 仅定义与测试引用；specs/archive/workflowhub-execution-simplification-20260907/decision-log.md:330（D12）"
  acceptance: "记录锁相关改动必须使行数净减；若最终保留 runTaskBoundE2eReview，则必须在材料中给出其真实生产消费者；空等侧按 OI-04 判据验收"
  counterexample: "若为不可达的记录锁改动 waitMs 却无消费者、或为接通取消而修改既有断言/绕过 D-030③，即判失败"
- oi_id: OI-11
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: data_state
  source: "review-input-bounds.mjs:3,6,7,8 PROVIDER_INPUT_MAX=300KiB 等；waste-reduction 跨仓项"
  question: "provider 失败率怎么降：切片、重试策略、还是先归因再定？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "三类修复全做（用户自由文本答复「1、2、3都要做」）：①实现 bug 修正三条——统一 provider 路径口径（simple-review-runner.mjs:861-873 剥离可选 bundle/ 前缀并改正 :70-72 的 prompt 样例）、补齐失败分类表（review-result.mjs:144-170）、身份降级不覆盖真因 message（:1289-1299）；②止损——轮询内回检源漂移并调用已存在的 cancelManaged（依据是源漂移事实，不是墙钟计时）；③处置 antigravity/flash（ok2/fail12），修法由 OI-19 另定并须论证不降低审查标准"
  evidence: "用户 talk-round-2 OI-05 答复；根因依据 simple-review-runner.mjs:70-72,861-873,1120,1289-1299；review-materials.mjs:893-897,1560；review-result.mjs:144-170"
  acceptance: "①锚点校验仍要求 existsSync + 行号（不放行编造路径）；②失败码不再大批落为未归类；③止损只在源漂移事实成立时触发，不引入计时判死；④每条附针对性测试"
  counterexample: "若把锚点校验降级为仅记录不失败、把私有路径检查改为告警、或调低 minimum_heterologous 以省成本，即判失败（触碰降低审查标准红线）"
- oi_id: OI-12
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: data_state
  source: "docs/standard-workflow.md 关于不重复读取/测试的纪律；HEAD 现场复核：canonical-receipt-writer.mjs:344-347 全源 source_digest 粒度、stage-runner.mjs:1791-1801 强制全量重采 ×2、freshness.mjs:269-288 死代码"
  question: "证据重采级联怎么分级，才能只在受影响接缝变化时重采？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "只修真实残留，不做「受影响接缝映射表」（用户选定按真实根因重排）：①stage-runner.mjs:1792 去掉 {fresh:true}，消除每次发布强制全量重采 ×2；②删除 freshness.mjs:269-288 的 bindFreshness/assertFresh 死代码及 3 处测试引用（净减约 20 生产行 + 15 测试行）。明确不做：把测试复用改「接缝粒度」（净增 10-25 行且新增映射表 = 新控制面，违反硬规则）；不做 verify-code 整树守卫收窄（风险最高，反例为假通过）"
  evidence: "canonical-receipt-writer.mjs:344-347；stage-runner.mjs:1791-1801,2905-2906；task-kernel-implementation.mjs:796-803；freshness.mjs:269-288 生产 0 调用者"
  acceptance: "净行数为负；去掉 {fresh:true} 后，发布前后的源稳定性防护仍由既有材料 revision/hashes 检查（stage-runner.mjs:2508-2511）承担，并有针对性测试覆盖"
  counterexample: "若采用「接缝映射表」或任何新增映射/字段的方案，或去掉 {fresh:true} 后出现「事实绑到已漂移源」的可复现路径，即判失败"
- oi_id: OI-13
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: non_goals
  source: "/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md DEF-01~DEF-07"
  question: "DEF-01~DEF-07 逐条判做还是取消，判据是什么？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "DEF-01~DEF-07 全部判「取消」（逐条 HEAD 实测依据），并追加 DEF-08（登记「唯一验收账本 = acceptance_criterion facts」，纯文字零成本）与 DEF-09（删除 tests/e2e/ui-e2e-contract-dogfood.test.mjs:223 残留的 quality-verify.v1 字面量，净减）。**talk-round-3 补强**：响应方向审查的 blocking 要求，逐条补齐「取消理由 + 重新考虑的触发条件 + owner」，给出 DEF-08/DEF-09 的完整定义，并把「更新 /Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md」列为正式交付物。取消理由：DEF-01 零 consumer 导出仅 180 行(2.5%)主体级收窄必靠搬家违反硬规则；DEF-02 改阶段协议本体触碰非目标；DEF-03 定性错误（hex 行仅 4，真因是段落 ×4 重复）且目标在 specs/archive 属非目标禁改；DEF-04 两份副本字节相同零漂移且加固净增行；DEF-05 已被 t2/C6 闭合，再动即复活被删持久对象；DEF-06 收益不可验证且落在 wh-review 面；DEF-07 与「不加披露面」+「净减或持平」双冲突"
  evidence: "用户 talk-round-2 选项卡 OI-13 选择「七条全取消 + 追加 DEF-08/DEF-09」；talk-round-3 选项卡 OI-13-r3 选择「维持取消，但补齐逐项处置表 + 定义 DEF-08/09 + 把延期文件列为交付物」；七条逐条 HEAD 复核证据见 `## 调研`（含 stage-content-contracts.mjs 7158 行中 82 个导出的 consumer 矩阵、t3 plan.md 13195 行中 hex 仅 4 行、两份 bounds 均 11417B 且 diff 为空、quality-verify.v1.json 已不存在且零 writer/reader）"
  acceptance: "①延期文件被更新（作为本任务交付物之一），DEF-01~07 每条有终态、取消理由、触发条件、owner；②DEF-08/DEF-09 在延期文件中有完整定义；③DEF-09 在本任务内闭合（活动命中数降为 0 且受影响测试 GREEN）；④decision-log 与延期文件逐条一致"
  counterexample: "若把已闭合的 DEF-05 重新实现（复活 quality-verify 对象），或把取消项以「转交下一轮」形式记录而无理由／无触发条件／无 owner，或未更新延期文件，即判失败"
- oi_id: OI-14
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: success_failure_boundary
  source: "用户原话纠正：不新增统计收集功能；上一轮 waste-reduction spec.md:457,852 用确定性 fixture/simulation 充当 after，FND-028 自认未度量原始痛点"
  question: "在既不加采集功能、又不许用 fixture/simulation 充数的情况下，本次改进靠什么判定「真的修好了」？"
  status: confirmed
  impact_dimensions: [acceptance]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "只靠「该阻塞不再发生」的可观察行为验收；不产出任何收益数字；不新建/不接入任何采集设施；不得用 fixture/simulation 充当 after"
  evidence: "用户 talk-round-1 选项卡 OI-14 选择该推荐项；用户原话「不希望你加一大堆统计、收集类的功能」"
  acceptance: "每条修复给出可复现的命令步骤与可观察判据（例如审查超时不再干等到 20 分钟、同一改动不再触发重复重采）；材料中不出现凭空的 before/after 收益数字"
  counterexample: "若材料中出现未实测的收益数字、或以确定性 fixture/simulation 充当 after 证据，即判本 OI 失败"
- oi_id: OI-15
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: success_failure_boundary
  source: "本任务现场实测：markdownlint 28 error；check-skill-closure.mjs exit 1；smoke-local-skill-dispatch.mjs exit 1"
  question: "「不劣化于 HEAD 基线」的基线值是什么，HEAD 已存在的失败怎么算？"
  status: confirmed
  impact_dimensions: [acceptance]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "基线写明：verify-structure exit 0、run-checks exit 0（含 2 条非阻断 WARNING）、check-skill-closure exit 1、smoke-local-skill-dispatch exit 1；用户选定「顺带修掉这两个红灯」——即不把它们留在基线里，而在本任务内修复（修法与范围见 OI-20）"
  evidence: "用户 talk-round-2 OI-15 选择「顺带修掉这两个红灯」；现场实测：两个失败在同一 HEAD 的主仓独立复现相同 SKILL.md 哈希漂移，非缺依赖误报（四份输出无 Cannot find module）"
  acceptance: "本任务结束时 check-skill-closure 与 smoke-local-skill-dispatch 均 exit 0；verify-structure 与 run-checks 不劣化；无新增 lint 错误（对照本任务现场复算的 28 error 基线）"
  counterexample: "若以「更新声明哈希」的方式让检查变绿但实际 bundle 内容与声明仍不一致（即掩盖而非修复），或修复后 verify-structure/run-checks 出现新失败，即判失败"
- oi_id: OI-16
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: deferred
  source: "用户原话：确定当前任务的范围后，把所有延期项更新到 /Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md 中"
  question: "延期文件怎么更新：判取消的项与新增延期项分别写什么字段（状态、取消理由、触发条件、owner），才不算「把延期移出材料」？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "判「取消」的项逐条改写状态+取消理由+触发条件；本轮新发现的堵点作为 DEF-08 起追加；保持单一清单文件"
  evidence: "用户 talk-round-1 原话「确定当前任务的范围后，把所有延期项更新到 /Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md 中，方便我后续基于这个文件继续做后续延期项的任务」；选项卡选择该推荐项"
  acceptance: "该文件更新后：DEF-01~07 每条有明确终态（做/取消）与理由；本轮判取消及新发现项以 DEF-08 起追加；文件内条目与 decision-log 的处置表逐条一致"
  counterexample: "若 decision-log 声明「零延期」而该文件未同步，或该文件出现无理由的悬空条目，即判本 OI 失败"
- oi_id: OI-17
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: page_scope
  source: "实测：仓库无 apps/web/ui/packages，package.json 无 bin 与前端依赖，仅有 3 个 CLI 入口"
  question: "本任务的页面范围是什么，是否维持 non_ui，若引入人看界面如何重算？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "维持零页面（non_ui）：不新增任何界面，不复活孤儿 HTML 反射页生成器，成本相关信息只走既有 CLI 文本输出"
  evidence: "用户 talk-round-1 选项卡 OI-17 选择「维持零页面」；实测仓库无 apps/web/ui/packages，package.json 无 bin 与前端依赖"
  acceptance: "diff 中无新增页面/路由/前端依赖；`tools/cli/build-reflection-page.mjs` 仍无生产调用者；`## UI applicability` 记为 non_ui"
  counterexample: "若新增任何页面、路由、前端依赖，或给孤儿 HTML 生成器接上调用者，即判本 OI 失败"
- oi_id: OI-18
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: non_goals
  source: "用户原话纠正：这些额外的东西只会让整个workflowhub变的更臃肿更难维护；M15 遥测五件套被 m15-retirement 整文件删除"
  question: "本任务如何自我约束，确保修复不是「再加一层」、不重演 M15 遥测被删的老路？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "硬规则：每条修复必须做到控制面净减或持平；不新增常驻文件/字段/公共命令；改动后在材料中写明新增/删除行数"
  evidence: "用户 talk-round-1 选项卡 OI-18 选择该推荐项；用户原话「这些额外的东西只会让整个workflowhub变的更臃肿更难维护」"
  acceptance: "**除 `## 净减或持平例外清单` 逐条列明的例外外**，每条修复净减或持平；材料中给出逐文件新增/删除行数表并把每条例外逐条登记（项／为什么是新增面／用户授权依据／删除条件）；无新增公共命令、无新增持久对象、无未登记的新增 schema"
  counterexample: "若出现 `## 净减或持平例外清单` **之外**的净增，或出现「把删除换成搬家/改名/加统一层」，即判本 OI 失败（对应 20260910 D-002）"
- oi_id: OI-19
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: success_failure_boundary
  source: "上一轮一手 attempt 数据：antigravity/flash ok2/fail12（成功率 14%），12 次失败全为 PROVIDER_OUTPUT_INVALID「emitted no final text」，占 24 次失败的 12 次；用户 talk-round-3 要求彻底解决根因（禁止改配置、禁止减少派发）"
  question: "antigravity/flash 失败的根因是什么？研究 3rd-review 里 antigravity 的实现后，wh-review 调用 3rd-review 时应如何正确调用与使用 antigravity？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r4
  selected_disposition: "根因已定位并有硬证据：`agy` 1.2.4 在内部 `--print-timeout`（默认 5m0s）到期而该轮未完成时，改为**退出码 0 + stdout 全空 + stderr 一句 partial-output 警告**（1.1.5 时代为非零退出）；而 `3rd-review` 的 antigravity 适配器有三项缺陷——(a) `lib/adapters/antigravity.mjs:19` 的 argv 未设置 `--print-timeout`，未覆盖真实审查耗时；(b) `antigravity.mjs:6-9` 只取 stdout、完全忽略 stderr；(c) 把空 stdout 归为 `PROVIDER_OUTPUT_INVALID`「emitted no final text」，于是**把一次超时截断伪装成「模型无输出」**。归属：3rd-review 适配器为主因，agy 版本行为变更是触发条件；配置层、model id、输入规模、wh-review 调用侧均已排除。用户 talk-round-4 授权本次对 `3rd-review` 做两处最小修复：**A** `antigravity.mjs:19` 的 argv 增加 `--print-timeout 20m`（+1 数组元素、0 行净增）；**B** `antigravity.mjs:6-9` 改为 `parse(stdout, stderr)`，stderr 命中 print timeout 时返回诚实的 `PROVIDER_PRINT_TIMEOUT`（+3~4 行）。3rd-review 侧改动与验收单独登记，不计入本仓通过判据。配套约束不变：不改 `~/.config/workflowhub/config.json`，不减少 antigravity 派发，不以「移出派发」冒充修复，不降低任何审查标准。"
  evidence: "用户 talk-round-3 自由文本纠正原话「不要改配置啊，我需要你彻底解决antigravity有问题的根本原因，应该去研究3rd-review这个技能里面的antigravity相关实现吧…这都是伪造的需求！」；用户 talk-round-4 裁定「授权本次对 3rd-review 做两处最小修复」；硬证据链：12 次失败 stderr 恰好 79 字节且逐字相同（`[agy] print timeout after 5m0s with turn in progress; returning partial output`，例 `/tmp/3rd-review/4ad7b95b-d6e5-4894-a38d-8ff2a79a2242/raw/antigravity%2Fflash/round-1789579029694-56838-635521067170208.stderr`）、stdout 哈希 `e3b0c442...b855`（空串 sha256）、失败耗时 306.7–311.0s 与成功耗时 68.5–237.1s **零重叠**、同组 codex/luna 跑 401,904ms 仍 completed、失败最小材料 4KB vs 成功最大 1.9MB（规模无关）、`agy models` 含 `gemini-3.8-flash-high`（model 合法）、`--print-timeout 2s` 最小复现产出与生产失败逐字节一致的形状、agy changelog 明文记载该行为变更"
  acceptance: "①`3rd-review` 侧 A+B 落地后，用「构造 agy 超时」的复现场景验证：不再出现 stdout 全空被归为「emitted no final text」，而应产出可区分的超时事实；②antigravity 在真实审查中的成功率从 2/14 恢复；③`minimum_heterologous` 与锚点校验逐项不变（可 diff 验证）；④本仓内不出现任何绕过该根因的缓解层（无第二轮 broker run、无新控制面）"
  counterexample: "若以改 config 配置文件、把 antigravity 移出派发、减少派发数量、或在 WorkflowHub 侧加第二轮 broker run 缓解作为「解决」，即判本 OI 失败"
- oi_id: OI-20
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: success_failure_boundary
  source: "现场实测：check-skill-closure.mjs exit 1（多条 bundle sha256 mismatch）；smoke-local-skill-dispatch.mjs exit 1（spec-analyze SKILL_RESOLUTION_FAILED）；用户 talk-round-2 决定顺带修掉"
  question: "两个红灯的正确修法是什么：重新对齐声明哈希、回退内容、还是修正比较口径？修复后跑哪些针对性测试？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r3
  selected_disposition: "用户定案「对齐声明 + 补回被删的披露措辞」：①C1 重新对齐声明——skills/spec-analyze/skill-bundle.json 2 行、skills/stage-handoff/skill-bundle.json 1 行、skills/stage-reflection/skill-bundle.json 1 行、skills/catalog.yaml 5 行 = 8 文件 9 行值替换，净 0；并在材料中明写「接受 25b44430 已合入字节为基线」；②补回同一提交从 5 个 workflows/<stage>/SKILL.md 删除的 outcome 披露措辞（约 +10 行），使用户认可的「净减或持平」出现一个显式例外；③C2 回退内容被否决（硬反例：tests/contract/no-external-stage-agent-gate.test.mjs:41-42 正断言 25b44430 新写措辞存在，回退会打破现绿测试并重新引入已退役的外部 Stage Agent 依赖）；④C3 修正比较口径不成立（7 种规范化口径无一能复现声明值）"
  evidence: "用户 talk-round-3 选项卡 OI-20-r3 选择该推荐项；现场实测 check-skill-closure.mjs exit 1 与 smoke-local-skill-dispatch.mjs exit 1，真实漂移为 3 skill / 4 文件（skill-bundle.json 逐文件声明）与 5 条 catalog local_bundle_hash；引入提交 25b44430（git blob 三态实测 25b44430^ 全 OK、25b44430 起全 MISMATCH）；声明哈希为闭包完整性控制（local-skill-resolver.mjs:109-111 fail_loud、skill-bundle-release.mjs:245,291）"
  acceptance: "①check-skill-closure.mjs exit 0；②smoke-local-skill-dispatch.mjs exit 0；③tests/contract/stage-reflection-wiring.test.mjs:143 变绿（第三条回归闭合）；④针对性测试全绿：core/__tests__/{local-skill-resolver,stage-skill-runtime,check-skill-closure}.test.mjs、scripts/__tests__/smoke-local-skill-dispatch.test.mjs、tests/skill-provenance-strict.test.mjs、tests/contract/spec-stage-artifact-closure.test.mjs、tests/contract/stage-skill-invocation-contract.test.mjs、tests/integration/{distribution-closure,runner-clean-install,mutation-guards}.test.mjs、tests/contract/no-external-stage-agent-gate.test.mjs（须保持 5/5）；⑤材料写明「接受 25b44430 字节为基线」"
  counterexample: "若以更新声明为由掩盖内容漂移而不写明基线接受，或回退 SKILL 内容（打破 no-external-stage-agent-gate 断言），或改动任何审查标准/prompt，即判失败"
- oi_id: OI-21
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: success_failure_boundary
  source: "本阶段 step 6 现场观测：只传 receipts.direction_review，runtime 同时写出 quality/facts/c53bc2019....json（kind=review、subject=detail_review、status=recorded），而 detail review 实际未运行"
  question: "只发布方向审查时，runtime 为何写出 subject=detail_review、status=recorded 的质量事实？该谎报如何修正？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r3
  selected_disposition: "纳入本轮作为实现 bug 修正（用户选定）：只发布 direction_review 时，runtime 不得写出 subject=detail_review、status=recorded 的质量事实；质量事实谎报属宪法明禁。需先定位该写入点与触发条件，再给最小修正"
  evidence: "用户 talk-round-3 选项卡 OI-21 选择「纳入本轮修掉」；现场落点 quality/facts/c53bc2019...json（本阶段 step 6 子代理实测），同批 direction_review 落点为 quality/facts/deb32b6cd8cee3a9c01e878e65962a88b01c1eb78697b62d3ea0989e4ce394d0.json。**step 10 实测已把真实触发条件查清**：不是「只传 direction」，而是「哪个轨没有 `receipts.<track>_review`，该轨的 review 事实就回落到 `evidence_refs` 中第一条 `quality/reviews/results/` 引用，且不校验 `review_track`」——机制在 `runtime/stage/stage-runner.mjs:1595` 的 `evidenceCandidate`（`facts.reviews.direction|detail` 无 `result_ref`/`attempt_ref`/`hash` 时回退到 `result.evidence_refs` 的首条 `quality/reviews/results/`，`:1638-1643`）与 `reviewEvidenceStatus`（`:1693-1753`，只对 verify-code/build-code 校验快照与 subject，对 make-decision 不校验 `review_track`）。step 6 现象（只传 direction ⇒ detail_review 事实指向 direction result）与 step 10 现象（只传 detail ⇒ direction_review 事实指向 detail result）是同一机制的镜像，故原假设已被证伪。**副作用（step 10 实测落盘）**：`quality/facts/` 现存每个 review subject 两条指向不同 result 的冲突事实（旧 `direction_review` 事实 `deb32b6c…` 与旧 `detail_review` 事实 `c53bc2019…` 均指向 direction result，新 `31dac84c…` 指向 detail result、新 `098dab2c…` 指向同一 detail result）"
  acceptance: "①定位到写入点并给出 文件:行号（已查清：`runtime/stage/stage-runner.mjs:1595` 的 `evidenceCandidate` 回退、`:1638-1643` 取 `evidence_refs` 中第一条 `quality/reviews/results/` 引用、`reviewEvidenceStatus:1693-1753` 对 make-decision 不校验 `review_track`）
    ②两轨 review 事实各自绑定本轨 result（direction_review→direction result、detail_review→detail result）
    ③某一轨没有本轨 result 时不得回落到另一轨 result；④同一 subject 不得并存两条指向不同 result 的冲突事实
    ⑤只发布 direction_review 的场景下不再产生 subject=detail_review 的 recorded 事实；⑥detail review 真实运行时仍能正常记录；⑦针对性测试覆盖上述场景"
  counterexample: "若以「只删记录」的方式掩盖而不修写入逻辑的触发条件，即判失败"
- oi_id: OI-22
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: success_failure_boundary
  source: "用户 grill-G2 自由文本原话：1.开始之前的预检要做好，有问题的provider就别开始；用户 grill-G2 选项卡 G2-scope-cap 选项原文：全部塞进本任务"
  question: "派发前的预检要做到哪一步，才能让有问题的 provider 在开工前就被拦下、而不是派发后才死？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: grill-g2
  selected_disposition: "预检已存在（skills/wh-review/scripts/simple-review-runner.mjs:784-846 runStaticPreflight，blockedPreflight 在 :699），本轮按用户裁定把边界扩大为含 provider 身份与活性校验：①甲类可闭合缺口——skills/wh-review/scripts/third-review-host-config.mjs:206 adapterOf 只做正则，不校验 3rd-review 的 SUPPORTED_PROVIDER_IDS（3rd-review/lib/provider-ids.mjs:1-9，不含 claude）→ host_provider 取 claude 能过 WH 预检、到 3rd-review/lib/broker.mjs:556 才死（本任务 step 6 现场两次 REQUEST_INVALID）；②model id 无任何校验（3rd-review/lib/config.mjs:72 只要求非空串；WH third-review-host-config.mjs:652-655 当不透明串）；③CLI 存在性只有 claude-code 有 beforeSpawn X_OK（3rd-review/lib/adapters/claude-code.mjs:35-38），其余靠 spawn 失败；④认证只验形状与环境变量（3rd-review/lib/config.mjs:59-63、lib/broker.mjs:651-652,:917-918）；⑤doctor 全适配器只跑 --version（3rd-review/lib/broker.mjs:634-660，:655 自标 executable_only，:659 自述不验认证与真实审查），且 dispatch 路径从不调用它（全仓唯一调用点在 :655 自身的 doctor 体内）。结论：静态预检原理上发现不了 antigravity 这类运行时失败（agy 内部 5 分钟到期 → exit 0 + 空 stdout）。红线 specs/archive/workflowhub-review-flow-repair-20260906/decision-log.md:45（F-017② provider 进程/超时/输出类保持运行时 unavailable）与 :161（延期项⑥ provider 健康探测/限流降级）在本任务内被显式修订——用户已授权扩大，修订依据与范围见 ## 需求权威更新（用户裁定，2026-09-17 grill-G2）"
  evidence: "用户 grill-G2 选项卡 G2-scope-cap 选择「全部塞进本任务」；用户自由文本原话「1.开始之前的预检要做好，有问题的provider就别开始」；本任务 step 6 现场两次前置失败 attempt（REQUEST_INVALID、blocked_before_dispatch、0 provider）；文件:行号证据见 selected_disposition"
  acceptance: "①host_provider 非法值在派发前被拦下，可复现命令：以 host_provider 取 claude 调用 wh-review run，必须在 buildBundle/锁/dispatch 之前落 blocked_before_dispatch 且 provider_attempts 为 0；②model id、CLI 可执行性、认证、活性探测四项按用户裁定纳入本任务并各附针对性测试；③红线 F-017② 与延期项⑥ 的处置在材料中写明修订依据与范围；④预检仍位于 buildBundle/runGroup 之前，且不引入第二个 elapsed-time timer"
  counterexample: "若 host_provider 非法值仍能通过 WH 预检到达 3rd-review 并在 lib/broker.mjs:556 才失败，即判失败"
- oi_id: OI-23
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: success_failure_boundary
  source: "用户 grill-G2 自由文本原话：改成20分钟，同时我不希望任何审查provider发生真卡死或停止时，真的要等到时限结束才能直到结果，我需要你调查根本原因，彻底解决这个时间浪费的问题…2.审查中的健康检测要做好，有问题立刻停止或重发；用户 grill-G2 选项卡 G2-impl 选项原文：再加「非终态成员级事实」（跨仓新增公开面）"
  question: "审查中的健康检测怎么做到一有问题就立刻停止或重发，而不是每次都要等到时限结束才知道失败？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: grill-g2
  selected_disposition: "①「20 分钟」本来就是当前值（skills/wh-review/scripts/simple-review-runner.mjs:40 DEFAULT_MANAGED_TERMINAL_WAIT_MS = 1_200_000）→ 该项是确认动作，不因它改码；②为何必须等满——3rd-review/lib/broker.mjs:156-164 managedPublic 只在 terminal 时附 group，assertManagedPublic:169 显式拒绝非终态带 group，WH 镜像 skills/wh-review/scripts/review-provider-client.mjs:593-600，WH 轮询 simple-review-runner.mjs:530-542 只看 current.state；③projectStatus（3rd-review/lib/broker.mjs:617-624）本身含 providers[id].status / error.code / last_progress_at_ms，是现成但对 managed 不可达的载体；④PROCESS_STALLED 只诊断不终止（lib/health-runner.mjs:54），且只对有 probeSession 的 provider 生效（health-runner.mjs:29-32），antigravity 无 probeSession（lib/adapters/antigravity.mjs:26 continuation:false、:30 resume 抛错）＝设计决定；⑤三个甲级 bug——(a) lib/provider-failure.mjs:67 的正则匹配不到 agy 的 print timeout 警告 → 落 PROCESS_EXIT_NONZERO（:79），最终被 antigravity.mjs:8 说成 emitted no final text；(b) lib/broker.mjs:1124-1125 只实现 fresh_execution，same_session_repair 静默 no-op；(c) lib/broker.mjs:1118-1120 要求 review_mode 不属 {single_round, full_only}，而 make-decision/build-spec/build-plan 全是 single_round、build-code 是 full_only ⇒ 所有阶段的重发都被关着；⑥用户已授权「非终态成员级事实」：3rd-review/lib/broker.mjs:156-164,:757-767 与 WH review-provider-client.mjs:593-601，属披露既有真实事实而非自造墙钟判死，故不与 D-030③ 冲突；须一并演进的协议约束是「非终态不得带 group」，其测试守卫为 3rd-review/test/managed-session-lifecycle.test.mjs:58-71（:76 断言 terminal 才带 group）"
  evidence: "用户 grill-G2 选项卡 G2-impl 选择「再加「非终态成员级事实」（跨仓新增公开面）」；用户自由文本原话「改成20分钟」「2.审查中的健康检测要做好，有问题立刻停止或重发」；agy print timeout 的 12 次失败 stderr 逐字相同（79 字节）；attempt 公开事实矛盾见 OI-25；文件:行号证据见 selected_disposition"
  acceptance: "①agy 的 print timeout 被正确分类为 PROCESS_TIMEOUT 并纳入重发表；②single_round 与 full_only 至少获得一次 fresh_execution 重发；③无 resume 时 same_session_repair 降级为 fresh_execution；④非终态可读到成员级真实失败事实，WH 不再必须等满 20 分钟；⑤minimum_heterologous 逐项不变（可 diff 验证）。**方向级定义（必须暴露什么事实、谁消费、何时触发、守卫怎么处置）**：
    1. 必须暴露的成员级真实事实：成员 `status`、`error.code`、`last_progress_at_ms`。依据：`3rd-review/lib/broker.mjs:617-624` 的 `projectStatus` 已含这三个字段，只是对 managed 运行不可达；`3rd-review/lib/broker.mjs:156-164` 只在 terminal 附 `group`；`assertManagedPublic:169` 拒绝非终态带 `group`（WH 镜像 `skills/wh-review/scripts/review-provider-client.mjs:593-600`）。
    2. 消费者：WorkflowHub 侧 `skills/wh-review/scripts/simple-review-runner.mjs:530-542` 的轮询循环（现在只读 `current.state`），须改为消费上述成员级事实。
    3. 触发语义：成员进入明确失败态时，WorkflowHub **立即**得到可判定事实，不必等满 `DEFAULT_MANAGED_TERMINAL_WAIT_MS`（`simple-review-runner.mjs:40` ＝ 1_200_000）；「真卡死」与「健康但慢」必须可区分，抓手＝`agy` 的 stderr `print timeout` 串（现被 `3rd-review/lib/provider-failure.mjs` 误归 `PROCESS_EXIT_NONZERO`）。
    4. 协议演进的守卫处置：`3rd-review/test/managed-session-lifecycle.test.mjs:58-71` 现断言「starting/running 两个非终态信封不得带 group」（`:76` 断言 terminal 才带 group）。本任务要演进「非终态不得带 group」这条协议约束，**必须同批把该守卫测试改到新边界并写明理由**——只放宽非终态携带成员级真实事实的条件，不放宽成员级必需键与 fail-closed 行为；理由＝用户 G2-impl 已授权新增「非终态成员级事实」这一跨仓公开面。
    5. 本方向级定义不写 schema 形状：字段名、类型、信封结构与迁移规则由 build-spec/build-code 按既有 schema 惯例落地；本阶段只锁「必须暴露什么事实、谁消费、何时触发、守卫如何演进」。"
  counterexample: "若 provider 已失败而 WH 仍必须等到时限才知道，或重发仍被 single_round/full_only 一律关闭，即判失败"
- oi_id: OI-24
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: success_failure_boundary
  source: "用户 grill-G2 自由文本原话：3.不要再因为输入或输出格式问题导致审查失败了，太浪费时间和token了，需要对整体输入和输出宽容一些，目标是获取异源审查建议，不是一份内容详细格式正确的审查报告！；用户 grill-G2 选项卡 G2-format 选项原文：确认这个边界：宽容格式，7 条红线不动"
  question: "输入/输出格式怎么宽容化，才能在稳定拿到异源审查建议的同时不碰审查标准红线？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: grill-g2
  selected_disposition: "按甲/乙/丙三类落地（用户明确要求宽容格式但 7 条红线不动）。甲类＝实现 bug：3rd-review/lib/workflowhub-result-v3.mjs:169 的成员级 hasPrivatePath(result) 覆盖成员 output 原文，一条 finding 的 issue/recommendation 里出现一个 /xxx 就让该成员的完整审查输出被整体替换为 PUBLIC_RESULT_INVALID（output: null，经 lib/broker.mjs:454-475 → :474 publicInvalidV3Result），现场 8 次（kimi/coding ×5、codex/luna ×3），duration 150377~578813ms；组级 :185 再对整组扫一遍（经 lib/broker.mjs:184-185 assertWorkflowHubV3Group，用于 managed terminal status 读取），使一个成员 prose 里的路径还能让整次读取失败——应改为只 fail 越界成员、组记 partial，并把路径检查限定在结构化路径字段而不扫 output 原文（BR 既有测试 3rd-review/test/managed-session-lifecycle.test.mjs:146-155 已断言被污染成员隔离且另一成员 completed，本项即让成员级投射路径与该既有意图一致）。同为甲类：WH skills/wh-review/scripts/review-provider-client.mjs:79-80 safeBrokerError 把 message 含路径的普通 broker 失败改判 PUBLIC_RESULT_INVALID，真实 code 丢失，应脱敏保原 code 并附 cause_code；skills/wh-review/scripts/simple-review-runner.mjs:1315 的空 catch 吞掉真实 parse 错、:1316 只回 OUTPUT_INVALID；skills/wh-review/scripts/review-materials.mjs:57 PHASE_DIFF_MAX_DELIVERY_BYTES = 330*1024 零消费者（全仓唯一出现即声明处）；skills/wh-review/scripts/review-input-bounds.mjs:87 WH_REVIEW_TRUNCATED_SECTION 标记不覆盖所有丢段路径（:83-93 只对 implementation/test 两类补标记，其余种类静默丢弃）。skills/wh-review/scripts/review-materials.mjs 的 `LOCAL_HOST_PATH` 正则字符集不含 CJK 标点（路径后紧跟的中文会被一路吞进 host-path-redacted 直到下一个空格），故路径后的非路径文本被吞掉；现场复现：对本材料调用 redactProviderHostPaths 后 host-path-redacted 出现 24 次、总字节 −1196、取消理由：消失、DEF-01 计数 20→19 ⇒ 审查包内容被破坏（detail 审查据此所报的 2 条 minor 属该伪影，非材料损坏）。修法只收紧字符集与边界，不改任何 fail-closed 红线。乙类＝格式宽容（用户明确要求，不碰红线）：在 skills/wh-review/scripts/simple-review-runner.mjs:861-873 与 :1304-1311 剥可选 bundle/ 前缀、逐条 anchor verdict 只丢越界条而不整员失败；在 runtime/review/review-output.mjs 补 JSONL、多围栏取唯一含 findings 者、被包在更大对象时的提取；顶层多余键容忍（:33-34 现要求顶层键恰为 findings）；severity 同义别名；skills/wh-review/scripts/review-provider-client.mjs:593-596 非终态信封忽略额外键但保留必需 5 键。丙类＝红线，原样保留：①私有/宿主路径 fail-closed（WH review-provider-client.mjs:39-50、simple-review-runner.mjs:43,700 redactHostPaths；BR workflowhub-result-v3.mjs:34-38、lib/broker.mjs:105-113），只许缩小爆炸半径，不许改告警后采用；②finding 必须落在真实材料与真实行号（simple-review-runner.mjs:861-873）；③minimum_heterologous 与 quorum（third-review-host-config.mjs:723-739、simple-review-runner.mjs:184-201、runtime/review/canonical-review-result.mjs:254,:324）；④材料允许清单与固定指令模板（review-materials.mjs:372,:2001,:2007）与 REVIEW_MATERIAL_MISMATCH（runtime/review/review-record-route.mjs:1312-1316）；⑤材料身份与选择绑定（simple-review-runner.mjs:1270-1300,:1324-1334）；⑥信封/组/成员必需键（3rd-review/lib/workflowhub-result-v3.mjs:170,:176,:182）——额外键可容忍、缺必需键必须失败；⑦非 minor finding 必须有 evidence_kind/evidence/root_cause（runtime/review/review-output.mjs:18-21）。最强实证：/Users/Hugh/Downloads/paperbuilder-t08-workflowhub-root-cause.md:37,45——一次真实 build-plan 审查 outcome=partial（kimi/coding 因 PUBLIC_RESULT_INVALID 失败），实际产出 14 条 findings，系统却按 review 未闭合处理；原文写明 heterologous review not closed 不是因为 provider 没有给建议。历史立场相反须如实留档：specs/archive/workflowhub-review-flow-repair-20260906/decision-log.md:85,156；/Users/Hugh/Hugh/Downloads/3rd-review审查流程根因调研与改造建议-2026-07-15.md:519 与 :610；runtime/review/review-output.mjs:33-34 与反向断言 skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs:384,391-399。用户本轮是方向性转向，须写明转向与依据"
  evidence: "用户 grill-G2 选项卡 G2-format 选项原文「确认这个边界：宽容格式，7 条红线不动」；用户自由文本原话「对整体输入和输出宽容一些，目标是获取异源审查建议，不是一份内容详细格式正确的审查报告！」；甲类现场 8 次误杀与 paperbuilder-t08 的 outcome=partial 实得 14 findings；文件:行号证据见 selected_disposition"
  acceptance: "①甲类与乙类逐项有针对性测试；②丙类 7 条红线可 diff 验证未被改动；③反向断言（runtime/review/review-output.mjs:33-34 与 skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs:384,391-399）的修改写明理由与新边界；④**脱敏边界可复现判据**：对含 CJK 标点的材料调用 redactProviderHostPaths 后，路径后紧跟的非路径文本不得被吞掉（脱敏后不得把路径之后的正文一并替换），且对同一材料脱敏前后 `DEF-01`、`取消理由：` 等 token 的计数逐项不变（当前反例：host-path-redacted 24 次、总字节 −1196、DEF-01 20→19）"
  counterexample: "若为达成宽容而把任一丙类红线放宽（例如锚点不在真实材料上仍不失败、私有路径改告警后照常采用、或调低 minimum_heterologous），即判失败"
- oi_id: OI-25
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: data_state
  source: "用户 grill-G2 选项卡 G2-impl 选项原文：再加「非终态成员级事实」（跨仓新增公开面）；现场 9 条 antigravity 失败记录里 attempts[0] 记 completed 而实际失败"
  question: "attempt 的公开事实为何与实际失败不一致，事后怎么区分进程失败与解析失败？"
  status: confirmed
  impact_dimensions: [acceptance]
  requires_user_decision: true
  visible_group_id: grill-g2
  selected_disposition: "纳入本任务修掉。9 条 antigravity 失败记录里，同一 member 内 attempts[0] 记 status: completed 与 error: null——3rd-review/lib/broker.mjs:1063 用进程级 ok 判定（status: attempt.ok ? completed : failed），在 parse 之前写入 → 公开 attempt 事实与实际失败不一致，事后无法区分「进程失败」与「解析失败」。另有 runtime/review/schemas/attempt.schema.json:331 additionalProperties: false 且属性表 :203-324 无 evidence_anchor_valid、无原始 stdout（只有 raw_output_ref 与 raw_stderr_sha256 摘要），skills/wh-review/scripts/review-result.mjs:84-87 在写 execution.raw_output_ref 或 session_file_path 时直接抛 TypeError。修法：attempt 公开事实以 parse 结果为准，并让归因可区分进程失败与解析失败"
  evidence: "用户 grill-G2 选项卡 G2-impl 选择「再加「非终态成员级事实」（跨仓新增公开面）」；9 条 antigravity 失败记录的 attempts[0] 与真实失败矛盾；文件:行号证据见 selected_disposition"
  acceptance: "①公开 attempt 事实与实际 parse 结果一致（可复现）；②归因可区分进程失败与解析失败；③新增持久字段在 attempt.schema.json 中登记并有唯一 consumer 与删除条件"
  counterexample: "若失败 attempt 仍被记为 completed，即判失败"
- oi_id: OI-26
  task_id: workflowhub-cost-baseline-and-blocker-close-20260917
  outline_version: v1
  category: data_state
  source: "用户本轮原话（逐字）：当前一个收口的命令都做了1个多小时，这就是整个workflowhub特别浪费时间和token的重要表现，请检查根本原因，看看到底为什么会这么浪费时间？当前任务有没有治理这个类似的问题？；现场实测：收口窗口 11:29:22→12:36:48 本地共 67.4 min（主会话空等 62.7 min / 13 次 sleep），该窗口写 164 个文件（占全 task store 356 文件的 46%）；全仓 vNext 确认 247 份（make-decision 103、verify-code 70、build-plan 51、build-spec 13、build-code 10）"
  question: "材料写入导致已发布的人工确认与交互聚合失效、迫使重复确认与重发聚合的重绑级联，其根因是什么、如何在三个阶段一并消除？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: incremental-rebind
  selected_disposition: "用户裁定「做 D4 + 一并纳入」，逐条落地：F1＝step 11 起冻结材料，step 12/13/14 的阶段事实只落 task store（quality/evidence/handoff/、quality/stage-reflection/<stage>/、facts.jsonl），材料不再新增这类 agent 自造章节；F2（F1 不回退的关键）＝同批修订 workflows/make-decision/SKILL.md:219-225「每个 step 完成都 append 到 decision-log.md」为「step 1–10 写材料；step 11–14 只落 task store」；F3＝已删四个 agent 自造章节（三节 + `## 阶段末 spec-analyze（step 12）`；用户接受 per-step 状态不再单独成表）。D1＝workflows/build-spec/SKILL.md 与 docs/standard-workflow.md:191-195 明写「freeze-spec / review-frozen-spec 之后不得改写 decision-log.md；规格歧义按 fallback_protocol 路由回 make-decision」；D2＝workflows/build-plan/SKILL.md:101-108 明写「确认后唯一可写区是 tasks.md 的执行状态填写区，plan.md 语义段不得再改」；D3＝docs/standard-workflow.md:239（及 :195）补记 build-plan step12 的人工确认要求（现漏记，与 SKILL :101-108/:247-253 及 steps.json 的 confirmation evidence 相互矛盾）；D4（核心，用户已授权）＝runtime/stage/stage-runner.mjs:1681（currentConfirmationCandidate 的 scope 比较处）读侧对称，复用写侧已有的 isExecutionRecordOnlyMaterialDelta / isStageMaterialOnlySnapshotDelta（runtime/task/git-worktree-snapshot.mjs:503-526），与写侧 task-kernel-implementation.mjs:913-921、runtime/stage/stage-handlers.mjs:3534 对齐，约 4 行，一处改动同时覆盖 make-decision 与 build-plan。已登记代价：tests/contract/human-confirmation-v3.test.mjs:296-308 直接断言 build-plan 的 full snapshot sensitivity，该断言必须同步改到新边界并写明理由——这是经用户明确授权的完整性语义变更，不是悄悄放宽。明确不做：D6＝把 stage-runner.mjs:3057 改为冻结指针（会把 decision-log 真被改写一并豁免，削弱完整性）；D5＝把 STAGE_FACT_MATERIALS[\"build-plan\"] 收窄为两份（等于宣布 build-plan 不为 decision/spec 当前性负责，会把上游漂移藏进 plan）。四个坏点：①共性＝确认身份用全局 material_revision + snapshot_tree（task-kernel-implementation.mjs:952-953），范围另有更窄的 material_scope / material_scope_revision（:976-983），身份宽于范围；②make-decision＝scope 仅 decision-log.md（completion-predicates.mjs:27），失败在写侧去重（task-kernel-implementation.mjs:913-921 仅 directionOnly 分支有豁免），本任务 4 次签名 scope_rev 各异 ⇒ 先改材料再签的顺序问题；③build-spec＝失败在读侧实时重算（stage-runner.mjs:3057 + stage-content-contracts.mjs:359-372 强判等），其自身不写 decision-log（tools/cli/stage-runtime.mjs:49-53）⇒ 无自触发，只在上游回改时被牵连，validator 本身正确（tests/contract/human-confirmation-v3.test.mjs:259-272 T003 明证接受下游变化）；④build-plan＝范围最宽 + 下游写入，scope 含四份（completion-predicates.mjs:31），而 build-code / verify-code 合法改写 tasks.md 执行状态填写区（workflows/build-code/SKILL.md:73、workflows/verify-code/SKILL.md:57），且读侧回退（stage-runner.mjs:1668/1681）未复用写侧已有的执行段豁免（git-worktree-snapshot.mjs:503-526）"
  evidence: "实测时间线与代价：收口窗口 11:29:22→12:36:48 本地共 67.4 min（主会话空等 62.7 min / 13 次 sleep，显式 step11→14 子代理 24.7 min）；该窗口写 164 个文件（quality/facts 60、acceptance/make-decision 48、stage-quality/make-decision 36、identity/executions 11、confirmations 4、interactions 3、stage-reflection-availability 2、stage-reflection 1），占全 task store 356 文件的 46%，18.4 分钟内完成；重复次数＝confirm 4 次（同一句回复 确认，收口吧，不要急着进入build-spec，4 个不同 material_revision/snapshot_tree）、交互聚合 3 个、reflection 2 个、材料 draft 3 次，子代理全生命周期 execute 8 次 / reflect 7 次 / confirm 5 次。跨阶段扫描：vNext 确认 247 份（make-decision 103、verify-code 70、build-plan 51、build-spec 13、build-code 10）；build-plan 8 组重绑样本（workflowhub-execution-acceleration-20260909 3 份同 reply / 3 个不同 revision / 跨 15.9 min；workflowhub-m16-evolution-20260831 3+2 份 / 30.1 与 253.5 min；workflowhub-execution-simplification-20260907 2 份 / 4.4 min；workflowhub-mechanism-simplification-t2-20260911 2 份 / 2.5 min；workflowhub-m17-repo-skills-multicli-20260903 2 份 / 3.8 min；workflowhub-execution-acceleration-deferred-20260909 2 份 / 4.2 min；旧样本 governance-runtime-execution-chain-20260827 2 份 / 6.9 min、m15-retirement 2 份 / 30.1 min、workflowhub-simplicity-close-repair-20260829 5 份 / 5 scope / 201.6 min、m15-runtime-observability-repair-live 2 份、workflowhub-execution-flow-repair-20260818 2 份）；build-spec 1 组（workflowhub-simplicity-close-repair-20260829 7 份 / 7 个 revision / 20.2 min）；代价实证 workflowhub-execution-acceleration-20260909 的 build-plan 重绑窗口写 83 个文件。方法论声明（必须写明）：build-spec / build-plan 的 decision_freeze 结论从不落盘——facts.jsonl、quality/facts、quality/evidence/stage-quality 三处均无命中，故对该事实只能说「无持久化、历史中不可观测」，不得据此断言「未发生」。四节 provenance：四节均不在 REQUIRED_MAIN_SECTIONS（runtime/stage/stage-content-contracts.mjs:50-53 的 16 项）、全仓零消费者（runtime/、core/、tools/、tests/、contracts/、config/、docs/、skills/ 无命中）、官方模板 skills/decision-log/templates/decision-log-template.md 无这四节、四个历史归档任务（t1/t2/t3/waste-reduction）对四节精确节名计数全 0、引入路径＝阶段步骤登记由主会话首轮草稿写入，另两节与阶段末 spec-analyze（step 12）由收口子代理新建。两条撤回记录：①原「最终确认的绑定值一律不内嵌」撤回（所引 stage-content-contracts.mjs:371-376 的 !== null 护栏是死分支，:345-350 已强制非空；freeze-classification-budget-usage-protocol.test.mjs:220-223 正断言缺绑定必须 reject；现场对 validateDecisionFreeze 实测返回 ok:false/paused 并报 final confirmation is missing material revision）；②原「改用 isStageMaterialOnlySnapshotDelta 放宽聚合写入判等」撤回（该函数比 git tree 而非 material_revision，只能替换 task-kernel-implementation.mjs:709 而替换不了 :708，且会削弱确认完整性）。file:line 清单见 selected_disposition 与 ## 需求权威更新（用户裁定，2026-09-17 增量决策）"
  acceptance: "①同一次收口内 confirm 发布恰 1 次、交互聚合发布恰 1 次（对照本任务收口窗口的 4 次 / 3 次），可在 task store 的 quality/confirmations/ 与 quality/evidence/interactions/ 逐份计数复核；②读侧对称后，仅在 tasks.md 执行状态填写区被改写、或仅发生非材料快照变化时，currentConfirmationCandidate 仍命中既有确认（可复现：构造上述两类变化后调用该判定，须返回同一份 confirmation ref）；③decision-log.md 的实质改动仍使确认失效，不得被 D4 豁免（反例见 counterexample）；④材料不再出现那四节（精确节名计数 0）；⑤workflows/make-decision/SKILL.md:219-225 已改为「step 1–10 写材料；step 11–14 只落 task store」；⑥D1/D2/D3 三处文档已补（build-spec SKILL、docs/standard-workflow.md:191-195 与 :239、build-plan SKILL:101-108）；⑦tests/contract/human-confirmation-v3.test.mjs:296-308 的断言已按新边界更新，并在测试注释与材料中写明授权来源＝用户本轮裁定「再做 D4」，不得只改断言不写理由"
  counterexample: "若把 decision-log.md 的实质改动也一并豁免（确认可跨实质改版复用），即判失败；若把 build-plan 的 STAGE_FACT_MATERIALS 收窄以回避重绑，即判失败；若只改 tests/contract/human-confirmation-v3.test.mjs 的断言而不写明授权来源与新边界，即判失败"
```

## 三轮 talk

### talk-round-1（2026-09-17，主会话独占，已完成）

- 交互方式：结构化问答工具卡（宿主 `ask_user_question`），每题 3 选项，每选项写明含义／后果／风险。
- 覆盖 OI：OI-01、OI-08、OI-10（范围部分）、OI-14、OI-16、OI-17。
- 用户真实答复（`reply_ref` = 本会话两条 `ask_user_question` 结果，非 agent 自报）：

| 问题 | 用户选择 | 对应 OI |
|---|---|---|
| 完整用户流程与人工点 | **自由文本纠正**：不要求更改被叫醒次数；正常问题/stage 收尾/talk/grill 都需确认；agent 原提问完全改错原始需求 | OI-01 |
| 页面范围 | 维持零页面，成本数据只走文本输出 | OI-17 |
| 「最大四条阻塞」口径 | **自由文本纠正**：不要加统计/收集类功能（M15 已确认只会更臃肿）；只要根因 + 针对性修复；范围确定后把所有延期项更新到 Downloads 延期文件 | OI-10、OI-16 |
| 非目标 | 历史非目标 + 三条新堵口（不恢复 M15 遥测／不改外部审查仓／不动历史字节） | OI-08 |
| 修哪几处（R1 复问） | 四处全修（20 分钟空等／失败率 33%／重采级联／15 分钟记录锁） | OI-10 |
| 怎么算修好了 | 只靠「阻塞不再发生」的可观察行为验收，不产出任何收益数字 | OI-14 |
| 延期文件怎么写 | 判取消项改写状态/理由/触发条件；新发现项追加为 DEF-08 起 | OI-16 |
| 自我约束 | 硬规则：每条修复净减或持平，材料写明行数变化 | OI-18 |

- 本轮的**关键纠正**已单列于 `## 需求权威更新（用户纠正，2026-09-17 talk-round-1）`。

### talk-round-2（2026-09-17，主会话独占，已完成）

- 交互方式：结构化问答工具卡；本轮基于五个根因定位子代理的 HEAD 现场核验结果提问。
- 覆盖 OI：OI-03、OI-04、OI-05、OI-06、OI-09、OI-10、OI-11、OI-12、OI-13、OI-15。
- 用户真实答复：

| 问题 | 用户选择 | 对应 OI |
|---|---|---|
| 两个堵点被推翻后范围怎么重排 | 按真实根因重排：保留空等+失败率；记录锁改为净减删除；重采只修真实残留 | OI-10 |
| 20 分钟空等怎么修 | 组合拳：对齐 600000 + 到期前终态复检 + 堵住被钉死的副作用 | OI-04、OI-11 |
| provider 失败率修到哪一步 | **自由文本「1、2、3都要做」**：三条实现 bug 修正 + 止损 + 处置 antigravity/flash | OI-05、OI-11、OI-19 |
| DEF-01~07 怎么处置 | 七条全取消 + 追加 DEF-08/DEF-09 两个净减项 | OI-13 |
| HEAD 两个红灯怎么算 | 顺带修掉这两个红灯 | OI-15、OI-20 |

### talk-round-3（2026-09-17，主会话独占，已完成）

- 交互方式：结构化问答工具卡；本轮输入为 **step 6 方向审查的争议清单**（契约要求 R3 必须含红蓝争议清单）。
- 覆盖 OI：OI-04、OI-07、OI-13、OI-16、OI-19、OI-20、OI-21。
- 用户真实答复：

| 问题 | 用户选择 | 对应 OI |
|---|---|---|
| DEF 处置（回应 blocking） | 维持取消，但补齐逐项处置表 + 定义 DEF-08/09 + 把延期文件列为交付物 | OI-13、OI-16 |
| 验收标准（回应 major） | 剩 3 条 OI 本轮全部定案，且每条修复写出逐项通过/失败判据 | OI-07 |
| 阈值依据（回应 major） | **不改 20 分钟这个数字**，只消除「白等」与「被钉死」 | OI-04 |
| antigravity 处置 | **自由文本纠正**：不要改配置；要彻底解决根本原因；去研究 3rd-review 里 antigravity 的实现 | OI-19 |
| 哈希漂移修法 | 对齐声明 + 补回被删的披露措辞（接受净 +10 行例外） | OI-20、OI-15 |
| 新发现的质量事实谎报 | 纳入本轮修掉 | OI-21 |

- 本轮**关键纠正**已单列于 `## 需求权威更新（用户纠正，2026-09-17 talk-round-3）`。

### talk-round-4（2026-09-17，主会话独占，条件触发，已完成）

- 触发条件（契约允许）：本轮是**方向/验收级**的范围变更——antigravity 根因确认只能在外部仓修复，与非目标直接冲突，影响本任务的交付边界与验收，故必须重新取用户裁定。
- 覆盖 OI：OI-19。
- 用户真实答复：**授权本次对 `3rd-review` 做两处最小修复**（A+B），边界见 `## 需求权威更新（用户裁定，2026-09-17 talk-round-4）`。

## grill

grill-with-docs（step 8，2026-09-17，主会话独占，已完成）。形态：单批 frontier 问答；非 review。触发源：根因定位与 Downloads triage 完成后，发现三条新需求与既有决定/红线存在冲突，属 frontier 级问题，必须由用户裁定。

### grill 五类覆盖表（契约要求每类须有用户选择或写明「不提问」的事实理由）

| 类别 | 处置 | 依据 |
|---|---|---|
| goal | **不提问** | 目标已在 talk-round-1~4 与 `## 目标` 定案（根因定位 + 针对性修复）；本轮无新的目标级歧义 |
| flow_or_surface | 提问并已答 | G1「外仓改动方式」→ 用户选定「本任务直接改并验证」；G4「延期文件更新由谁执行」→ 用户答复「先确认是否还有后续任务；有就直接更新，让后续任务看这个文件就知道该做什么」 |
| data_or_state | 提问并已答 | G3「runTaskBoundE2eReview 删除范围」→ 用户选定「删函数本体 + 专属锁 + 仅服务它的私有导出与测试」 |
| success_failure_acceptance | 提问并已答 | G2-format「需求3 边界」→ 用户选定「宽容格式，7 条红线不动」 |
| constraint_non_goal_defer | 提问并已答 | G2 自由文本（审查超时/预检/健康检测/格式宽容）；G2-impl「健康检测路径」→ 用户选定「再加非终态成员级事实」；G2-scope-cap「范围上限」→ 用户选定「全部塞进本任务」 |

### grill 提出的 frontier 问题与用户真实答复

| # | 问题 | 用户答复 | 影响 |
|---|---|---|---|
| G1 | 3rd-review 的两处最小修复，本任务直接改并验证，还是只交改动方案？ | 本任务直接改并验证 | OI-19 授权扩大为「本任务执行并验证」 |
| G2 | agy 内部超时提到多少；以及如何不再「等到时限才知道失败」 | **自由文本**：改成 20 分钟；同时要求 ①派发前预检、②审查中健康检测并立刻停止/重发、③对输入输出格式宽容（目标是拿异源审查建议，不是格式正确的报告） | 新增 OI-22、OI-23、OI-24；`--print-timeout` 定为 20m |
| G3 | runTaskBoundE2eReview 删除到什么程度 | 删函数本体 + 专属锁 + 仅服务它的私有导出与测试 | OI-10 的删除范围明确 |
| G4 | 延期文件（仓外 ~/Downloads）由谁更新 | **自由文本**：先确认是否还有后续任务；有就直接更新，把当前内容与新增需求都更新好，让后续任务看这个文件就知道该做什么 | OI-13/OI-16 的交付物要求具体化 |
| G2-impl | 健康检测做到哪一步 | 再加「非终态成员级事实」（跨仓新增公开面） | OI-23 范围含协议演进 |
| G2-format | 格式宽容的边界 | 确认「宽容格式，7 条红线不动」 | OI-24 的丙类红线逐条保留 |
| G2-scope-cap | 本任务范围是否封顶 | 全部塞进本任务 | 范围上限由用户主动取消；`## 净减或持平例外清单` 逐条登记 |

### grill 用户答复逐字原话（宿主 `ask_user_question` 原话，补 detail-10 的 D16）

> 本节的每一行都是**宿主回答 payload 的逐字原文**（`selected` 为选项标签原文、`custom` 为自由文本原文），用于补上此前只以转述形式留档的 G1/G3/G4。宿主工具调用与回答消息 id 见 `## 最终确认` 的「交互聚合的真实来源」表。

| # | 宿主工具调用 | 用户答复（逐字） |
|---|---|---|
| G1 | `call_00_kTNVQDH6dwk7PdFUHCO36951` | `selected: ["本任务直接改并验证（推荐）"]` |
| G2 | `call_00_kTNVQDH6dwk7PdFUHCO36951` | `custom: "改成20分钟，同时我不希望任何审查provider发生真卡死或停止时，真的要等到时限结束才能直到结果，我需要你调查根本原因，彻底解决这个时间浪费的问题，这些审查确实经常容易出问题，所以我配置了多个provider。但是我不希望每一次审查都要在很久直到才知道失败了，我需要：1.开始之前的预检要做好，有问题的provider就别开始；2.审查中的健康检测要做好，有问题立刻停止或重发；3.不要再因为输入或输出格式问题导致审查失败了，太浪费时间和token了，需要对整体输入和输出宽容一些，目标是获取异源审查建议，不是一份内容详细格式正确的审查报告！"` |
| G3 | `call_00_kTNVQDH6dwk7PdFUHCO36951` | `selected: ["删函数本体 + 专属锁 + 仅服务它的私有导出与测试（推荐）"]` |
| G4 | `call_00_kTNVQDH6dwk7PdFUHCO36951` | `custom: "先确认一下现在还有后续任务吗？如果有后续任务你就直接更新吧，把里面当前内容更新好，新增的需求也更新好，让后续任务看这个文件就知道应该做什么"` |
| G2-impl | `call_00_vNDXOYAOqmuYdxNNM5UI1211` | `selected: ["再加「非终态成员级事实」（跨仓新增公开面）"]` |
| G2-format | `call_00_vNDXOYAOmuYdxNNM5UI1211` | `selected: ["确认这个边界：宽容格式，7 条红线不动（推荐）"]` |
| G2-scope-cap | `call_00_vNDXOYAOqmuYdxNNM5UI1211` | `selected: ["全部塞进本任务"]` |

- 用途与边界：G1/G3/G4 从此有逐字权威可查（对应 OI-19、OI-10、OI-13/OI-16）。既有 D 条的 `approval_hash` 未重算（仍指其原摘录），本节只补逐字来源，不改任何 OI 的 `selected_disposition`。

### frontier 阶段发现的事实（写入后即成为后续决定的依据）

- 三条新需求**历史上都提出过**：预检已部分落地（`skills/wh-review/scripts/simple-review-runner.mjs:784-846`），健康检测未实施且被判归跨仓，格式宽容的历史立场**相反**（fail-closed）。
- 支持需求3 的最强实证：`/Users/Hugh/Downloads/paperbuilder-t08-workflowhub-root-cause.md:37,45` —— 一次真实 build-plan 审查 `outcome=partial`（kimi/coding 因 `PUBLIC_RESULT_INVALID` 失败），**实际产出 14 条 findings**，系统却按「review 未闭合」处理；原文「heterologous review not closed **不是因为 provider 没有给建议**」。
- 「20 分钟」本就是当前值（`skills/wh-review/scripts/simple-review-runner.mjs:40 DEFAULT_MANAGED_TERMINAL_WAIT_MS = 1_200_000`），故 G2 的该部分是确认动作，不因它改码。

## 调研

本阶段共派 7 个只读调研子代理（全部在子代理上下文执行，主会话只收摘要），每个结论均附 `文件:行号` 或命令原文：

| # | 调研范围 | 关键结论 |
|---|---|---|
| 1 | 原始需求与历史材料 | 需求权威在用户原话；`20260910` 缺 spec/plan/tasks 属设计而非失败；历史材料用「零延期」把延期移出材料 |
| 2 | 标准工作流与 make-decision 规程 | 14 step、四份材料、OI 大纲六节点+六类别、准出条件 |
| 3 | 历史同类任务复盘 | 同族任务约 10 次；根因＝度量尺子在 `m15-retirement` 被整删、`m17` 拒绝恢复；任务规模反而从 44 文件涨到 155 文件 |
| 4 | 执行事实与质量事实 | t2 有 delivery commit 但未合入 main、双门 failed、Phase 5 review `not_accepted`；t3 状态自相矛盾；waste-reduction 未 close |
| 5 | 页面与用户可见流程 | 纯 CLI + 技能包，零页面；3 个入口工具；人工点仅方向确认/规格冻结/close 授权 |
| 6 | HEAD 现场基线复算 | `stage-content-contracts.mjs` 7158 行；markdownlint 28 error；`move-map` entries 379；`control-plane-inventory` controls 12；`git worktree list` 9 |
| 7 | 根因定位（5 个子代理） | 见 OI-03 的处置：空等根因在外部仓；失败率一手分布；重采头条数字无原件；记录锁无生产路径；DEF-01~07 全部建议取消 |

### 根因定位的一手数据

- 上一轮 attempt 目录实测：**33 attempt / 72 provider attempt / 24 failed / 合计 493 provider-分钟**。
- 按 provider 成功率：antigravity/flash ok2/fail12；kimi ok19/fail7；codex/luna ok23/fail5；pi ok4/fail0。
- 历史断言「最终聚合重跑 8 次／合计 37.9 分钟」**全仓无可复核原件**，仅能证明至少重跑 2 次。

### antigravity 根因（专项深挖，硬证据）

| 证据 | 内容 |
|---|---|
| 判定点 | `3rd-review/lib/adapters/antigravity.mjs:8`，前置条件 `stdout.trim()===""`；由 `lib/broker.mjs:1235-1239` 落到 member `status:"failed"` |
| 12 次失败的 stderr | **恰好 79 字节、逐字相同**：`[agy] print timeout after 5m0s with turn in progress; returning partial output` |
| stdout | 0 字节；`public.json` 的 `raw_output_sha256 = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`（空串 sha256） |
| 失败耗时 | 306,688–311,020 ms（全部钉在 300s + agy 启动约 7.5s） |
| 成功耗时 | 68,529–237,076 ms |
| 两组重叠 | **零重叠** |
| 反证：非输入规模 | 失败最小材料 4,021 B；成功最大 **1,890,328 B** |
| 反证：非模型 id | `agy models` 含 `gemini-3.8-flash-high`；`agy --version` = 1.2.4 |
| 反证：非本机整体慢 | 同一次运行 codex/luna 跑 401,904 ms（6m42s）仍 `completed` |
| 反证：prompt 无差异 | antigravity 的 `review-instructions.md` 与其它 provider 完全相同（772 B，file_only） |
| 复现 | `agy --new-project --mode plan --sandbox --dangerously-skip-permissions --print-timeout 2s --model gemini-3.8-flash-high -p "Reply with exactly: ok"` → EXIT=0、wall 9.6 s、stdout 0 字节、stderr 形状与生产失败逐字节一致 |
| agy changelog 原文 | *"Changed what happens when `--print-timeout` expires mid-turn: the CLI now returns the partial output it has and exits successfully with a warning on stderr, instead of failing with a timeout error"* |
| 适配器缺陷 | (a) `antigravity.mjs:19` argv 未设 `--print-timeout`；(b) `antigravity.mjs:6-9` 只看 stdout、忽略 stderr；(c) 空 stdout 被归为「模型无输出」 |
| 附带缺陷 | `lib/recovery-policy.mjs:8-12,20-22` 把 `PROVIDER_OUTPUT_INVALID` 映射为 `same_session_repair`，但 `lib/broker.mjs:1124-1125` 只实现了 `fresh_execution`；antigravity 的 `resume`（`antigravity.mjs:30`）直接抛错 ⇒ 12 次失败 `fresh_execution_retry_count:0, same_session_repair_count:0`，**一次重试都没有** |

**归属**：`3rd-review` 适配器为主因；`agy` 版本行为变更为触发条件。配置层、model id、输入规模、wh-review 调用侧均已排除。
**WorkflowHub 侧无等价正确修法**：request schema 不消费 `--print-timeout`（消费键全集为 `host_provider/prompt/provider_allowlist/review_mode/review_flow/required_result_protocol/attachments/continuation`），CLI 参数在 `review-provider-client.mjs:901` 固定，agy 无对应环境变量 ⇒ **无法透传**。

## 非目标

1. 不改五阶段流程本身，不改任何人工确认点的数量与位置（OI-01）。
2. 不新增任何统计、收集、度量、遥测类功能或常驻采集面（OI-08、OI-09、OI-18）。
3. 不恢复 `m15-retirement` 删除的遥测五件套（含 `runtime/evidence/monitoring-facts.mjs`）（OI-08）。
4. 不新增第五份材料、不新增公共命令、不新增持久对象、不新增第二状态机（历史非目标 + OI-18）。
5. 不改 `wh-review` 每阶段审查标准与 prompt（历史非目标）。
6. **除本任务显式授权的改动外，不写入外部审查仓** `/Users/Hugh/Hugh/Project/3rd-review`（OI-08；授权范围＝`lib/adapters/antigravity.mjs` 的 A+B 两处，**加上需求1/2/3 所需的改动**；唯一授权边界见 `## 需求权威更新（用户裁定，2026-09-17 grill-G2）`，超出该边界即判本 OI 失败）。
7. 不改动 `specs/archive/**` 的历史 provenance 字节；不迁移历史任务；不做兼容桥；不做双写（OI-08）。
8. 不减少人工确认、不引入自动越过人的推进（OI-01）。
9. 不产出无法实测的收益数字，不以 fixture/simulation 充当 after 证据（OI-14）。
10. 不把锚点校验降级为仅记录、不把私有路径检查改为告警、不调低 `minimum_heterologous`（OI-11 红线）。
11. 不复活已由 C6 删除的持久对象（`quality-verify.v1` 等）；不启用 `material-workspace.mjs:91` 的第三套材料写入实现（OI-13、OI-02）。
12. 不做「受影响接缝映射表」或其他新增映射/字段式的重采分级（OI-12）。

## 净减或持平例外清单

用户在本轮明确要求「全部塞进本任务」，**主动取消**了 D-018「每条修复净减或持平」的范围上限。因此下列各项是**经用户授权的新增面**，逐条登记。凡不在此清单内的改动，仍受 D-018 净减或持平约束。

| 项 | 为什么是新增面 | 用户授权依据 | 删除条件 |
|---|---|---|---|
| OI-20 补回被删披露措辞（约 +10 行） | 恢复 `workflows/<stage>/SKILL.md` 中同一提交删掉的 outcome 披露文字，行数为净增 | talk-round-3 选项卡 OI-20-r3「对齐声明 + 补回被删的披露措辞（接受净 +10 行例外）」 | 若该披露措辞由净减的等价实现承担同一事实，则删除本例外 |
| OI-04 终态复检与复用守卫（约 +3~8 行） | 在既有轮询内加终态复检与不可用审查复用守卫，属新增判定分支 | talk-round-3 选项卡 OI-04-r3「不改 20 分钟这个数字」，只消除白等与被钉死 | 若复检与守卫能用净减的等价改写实现，则删除本例外 |
| OI-22 派发前预检校验（host_provider 白名单 + model id + CLI 可执行性 + 认证 + 活性探测） | 预检由「仅静态可判定必败项」扩到 provider 身份与活性校验，新增校验分支与针对性测试 | grill-G2 选项卡 G2-scope-cap「全部塞进本任务」+ 自由文本「1.开始之前的预检要做好，有问题的provider就别开始」 | 若某项校验被 3rd-review 侧自身校验完全覆盖且本仓无需重复，则删除该项例外 |
| OI-23 非终态成员级事实（新增公开面） | 让非终态信封可携带真实的 member status / error / last_progress_at_ms，是公开协议面的新增字段 | grill-G2 选项卡 G2-impl「再加「非终态成员级事实」（跨仓新增公开面）」+ 自由文本「2.审查中的健康检测要做好，有问题立刻停止或重发」 | 若 3rd-review 后续把成员级状态并回既有 `projectStatus` 公开面且 managed 可直接读，则删除本例外 |
| OI-24 信封键容错（协议面） | 非终态信封由拒绝额外键改为忽略额外键、保留必需 5 键；输出解析容忍围栏/JSONL/更大包裹/多余顶层键，属协议与解析面变化 | grill-G2 选项卡 G2-format「确认这个边界：宽容格式，7 条红线不动」+ 自由文本「需要对整体输入和输出宽容一些」 | 若 provider 侧统一输出唯一 schema-valid JSON，使容错分支无触发路径，则删除本例外 |
| OI-25 `attempt.schema.json` 新增字段（新增持久字段） | 让 attempt 公开事实以 parse 结果为准并区分进程失败与解析失败，需在 `runtime/review/schemas/attempt.schema.json` 增加持久字段 | grill-G2 选项卡 G2-impl「再加「非终态成员级事实」（跨仓新增公开面）」 | 若新增事实能由既有字段无损推导（无需新增持久字段），则删除本例外；每个新增字段必须登记唯一 consumer、owner 与删除条件 |
| OI-23 协议演进的测试面变更（`3rd-review/test/managed-session-lifecycle.test.mjs:58-71` 断言需改） | 该测试现断言「starting/running 两个非终态信封不得带 `group`」，与 OI-23「非终态公开成员级真实事实」的新边界直接冲突；要演进协议就必须把该断言改到新边界（只对 run 组 `group` 的携带条件放宽，对成员级必需键与 fail-closed 行为不放宽），故测试面出现净增或等价改写 | grill-G2 选项卡 G2-impl「再加「非终态成员级事实」（跨仓新增公开面）」；授权文件见 `## 需求权威更新（用户裁定，2026-09-17 grill-G2）` 第 5 条清单第 4 项 | 若 `3rd-review` 后续把成员级状态并回既有 `projectStatus` 公开面、使非终态信封无需演进，则删除本例外 |
| OI-24 `redactProviderHostPaths` 正则字符集修正（`skills/wh-review/scripts/review-materials.mjs:426`） | 现字符集 `[^\s"'\`<>()[\]{}]+` 不含 CJK 标点，路径后紧跟的中文被吞入脱敏片段，破坏审查包内容（本步骤实测：`host-path-redacted` 24 次、总字节 −1196、`取消理由：` 消失、`DEF-01` 计数 20→19）；修字符集/边界会改变该正则的匹配行为，属新增边界分支 | grill-G2 选项卡 G2-format「确认这个边界：宽容格式，7 条红线不动」+ 自由文本「对整体输入和输出宽容一些」；丙类红线①的「只许缩小爆炸半径、不许改告警后采用」边界不变 | 若 `LOCAL_HOST_PATH` 由更窄的等价实现承担同一脱敏事实（含同样的 CJK 标点边界），则删除本例外 |
| OI-26 / D-026 的 D4 读侧对称（`runtime/stage/stage-runner.mjs:1681` 约 4 行）＋ `tests/contract/human-confirmation-v3.test.mjs:296-308` 断言同步改到新边界 | 读侧 `currentConfirmationCandidate` 现按 `snapshot_tree` + `material_revision` 强判等，须复用写侧已有的 `isExecutionRecordOnlyMaterialDelta` / `isStageMaterialOnlySnapshotDelta` 才与 `task-kernel-implementation.mjs:913-921`、`stage-handlers.mjs:3534` 对齐；属确认完整性语义的一次显式变更，且需同批改动一个既有测试断言 | 用户本轮裁定「再做 D4（读侧对称，需接受完整性语义变更 + 改一个测试断言）」（选项原文逐字） | 若 freeze / 确认身份改为按 scope 绑定（`material_scope` / `material_scope_revision`）且经审查通过，使读侧无需任何豁免分支，则删除本例外 |

## 审查处置

### direction-advice（step 6，2026-09-17）

- 命令：`review --action=record --stage=make-decision --project=workflowhub --task=workflowhub-cost-baseline-and-blocker-close-20260917`
- 覆盖：red/blue 双角色 × 3 provider（kimi/coding、antigravity/flash、codex/luna），6 次派发全部 `completed`；`coverage: satisfied`；`partial: false`
- 墙钟：**5 分 50 秒**（**未触发** 20 分钟上限，可作 OI-04 的对照基线）
- 落点：red `quality/reviews/results/make-decision-simple-a775120c-222e-5c14-ac20-43125e5d785b.json`；blue `...-8de66c13-5cd1-5cc9-a48b-713f7d5b5fd7.json`；聚合 report `quality/reviews/reports/make-decision-simple-64971d4b-7f66-5168-a1f4-cc51e4ea3c73.md`；质量事实 `quality/facts/deb32b6cd8cee3a9c01e878e65962a88b01c1eb78697b62d3ea0989e4ce394d0.json`
- 结论：**未给 pass**；36 条原始 finding → 20 条去重聚类 = **2 blocking / 13 major / 5 minor**
- 前置失败尝试如实留档：`.../attempts/6ea6b55a-...`（`REQUEST_INVALID`，`blocked_before_dispatch`，0 provider）、`.../attempts/243840df-...`（同上）

### 争议处置

| # | 严重度 | 争议要点 | 处置 | 依据 |
|---|---|---|---|---|
| 1 | blocking | 「DEF-01~07 七条全取消 + 追加 DEF-08/09」属未确认的范围篡改 | **部分采纳**：取消决定由用户在 talk-round-2 明确选定，不撤销；但补齐逐项「取消理由 + 触发条件 + owner」、给出 DEF-08/09 完整定义、把延期文件列为交付物 | OI-13、OI-16；用户 OI-13-r3 答复 |
| 2 | blocking | 20 条 OI 在审查所见的 questions-only 投影中全为 open，收敛只给 6 条压缩要点 | **部分采纳**：投影恒显 open 属契约设计；实质问题是当时仍有 3 条 OI 未定案。R3 已将 OI-07/OI-19/OI-20 定案，并新增 OI-21 | OI-07、OI-19、OI-20、OI-21；本文件的 OI 大纲与三轮 talk |
| 3 | major | 「对齐 600000」无现场依据 | **采纳**：撤销阈值改动，改为只做终态复检与复用守卫 | OI-04 最终定案 |
| 4 | major | 三条实现 bug 未列名与代码位置；其余 12 次失败归属未写；antigravity 无具体方案 | **采纳并已闭合**：OI-11 已列明位置；失败归属见 `## 调研` 的一手分布；antigravity 已由专项深挖定位到根因（`agy` 1.2.4 行为变更 + 适配器三项缺陷），配置方案作废，修法与授权见 OI-19 与 `## 需求权威更新（用户裁定，2026-09-17 talk-round-4）` | OI-11、OI-19 |
| 5 | major | HEAD 两红灯「顺带修掉」违背最小有用范围；未在三种修法间选择 | **采纳**：OI-20 已定案 C1（对齐声明），C2/C3 给出否决理由与硬反例 | OI-20 |
| 6 | major | 「15 分钟记录锁净减删除」未证明无测试/工具 consumer 与安全不变式 | **采纳**：删除前必须先证明无 consumer（含测试与工具引用）与安全不变式，证明结果写入 `## 决定` | OI-10 |
| 7 | major | 「重采级联只修真实残留」不可执行；OI-06/OI-12 的 source 仍写旧数字 | **采纳**：OI-06/OI-12 的 source 已改为 HEAD 复核口径；旧数字标注「无原件不可复核」 | OI-06、OI-12 |
| 8 | major | 验收口径「只靠阻塞不再发生」不可证伪，无逐项 pass/fail | **采纳**：每条修复逐项写出通过/失败判据 | OI-07 及全部 OI 的 acceptance/counterexample |
| 9 | major | DEF 处置无逐项理由/触发/owner；六条方向未把「更新 Downloads 延期文件」列为交付物 | **采纳** | OI-13、OI-16 |
| 10 | major | 「用户已要求修红灯」属脱离唯一需求权威的虚假归因 | **不采纳**：用户确实在 talk-round-2 选项卡 OI-15 中选定「顺带修掉这两个红灯」，有结构化答复为证 | OI-15 evidence |
| 11 | minor | 未被采纳的「接通取消」缺否决理由 | **采纳**：否决理由已写入 OI-10（既有测试断言该路径绝不调用 cancelManaged，且与 D-030③ 冲突） | OI-10 |
| 12 | minor | 「每条净减或持平」与「终态复检 + 堵副作用」冲突未调和 | **采纳**：OI-20 已登记一个显式例外（补回披露措辞 +10 行）；OI-04 的轻微净增需在 `## 决定` 中登记 | OI-20、OI-04 |
| 13 | minor | 15 分钟记录锁的唯一实体是 `wh-review-cli.mjs:446` 的 `900000` | **采纳为事实** | OI-10 |

## 方向审查流与 reveal 边界（D3 处置）

> 本节处置 detail 轨 **D3**（blocking，blue `F-42ec762fcc21`；red 同类 major `F-c68879f6e48a`）。**不改变任何 OI 的 `selected_disposition`，不改任何仓内代码、config 或 schema。**

### 契约对该流的确切要求（逐条）

| # | 要求 | 依据（文件:行） |
|---|---|---|
| R1 | `direction` 与 `detail` 是两个独立 track，各自产生一个 paired review fact；同一 track 内 red/blue 各一次 request、共享本次 `snapshot_tree` 与 `material_id`、使用同一 `pair_id` | `skills/wh-review/contracts/make-decision.md:3` |
| R2 | 每个 role 只调用一次，不把 paired request 变成重试循环；不为追求空 findings 再发复审 | `make-decision.md:15-17`、`:118-119` |
| R3 | 审查顺序固定为一个逻辑 paired review fact：red 与 blue 各一次 broker group request，合计两次 public request | `make-decision.md:54` |
| R4 | 每个 request 携带 broker-owned `direction-review.v1` flow：reconstruct（只读原始需求与客观事实）→ 到 reveal 边界后才呈现当前选择 → challenge（挑战选择与更小替代路径）；**reconstruct 不得读取当前选择** | `make-decision.md:55-57`；`skills/wh-review/scripts/review-runner.mjs:60-77` |
| R5 | WorkflowHub **不得**用第二次 public request 拼出这个顺序 | `make-decision.md:57` |
| R6 | direction 的每个 role request **内部**仍必须提供可观察的 reconstruct/reveal/challenge 顺序和 reveal boundary | `make-decision.md:119` |
| R7 | 请求必须携带 `review_flow.version=direction-review.v1`、`public_request_count=1`、`steps=[reconstruct,reveal,challenge]`；broker 在**同一请求内部**保存 reconstruct 结果，reveal 边界之后才呈现 `current_selection`；最终返回一个 provider result 与一个逻辑 fact | `skills/wh-review/contracts/provider-protocol.md:78-81` |
| R8 | broker 给不出该顺序或 reveal 事实时记 `PROTOCOL_INCOMPATIBLE`/`unavailable`，不得退回第二次请求 | `provider-protocol.md:82-84` |
| R9 | 公开结果的 flow 形状被逐字段校验：`reconstruct`（visible=`[raw_requirement, objective_facts]`、`hidden_until=reveal`）／`reveal`（after=`[reconstruct]`、visible 含 `current_selection`）／`challenge`（after=`[reveal]`、output=`findings`） | `skills/wh-review/scripts/review-provider-client.mjs:402-412` |
| R10 | direction 是不含候选方案的盲审，不含 `simplicity-guard` 等依赖候选方案的 lens | `make-decision.md:89-90` |
| R11 | 该顺序是**审查请求构造与执行**的要求，不是 decision-log 的必需章节名 | 证据：必需主章节清单 `runtime/stage/stage-content-contracts.mjs:50-53` 不含任何该流章节名；契约把该要求写成「每个 role request 内部」（`make-decision.md:119`） |

**R11 的回答**：`reconstruct → reveal → challenge` **不是** decision-log 的某个指定章节，而是**审查请求构造与审查执行**的要求；材料侧本次以本节登记处置，契约没有指定章节名可补。

### `current_selection` 在 direction 轨的合法形态与时机

| # | 规则 | 依据（文件:行） |
|---|---|---|
| C1 | direction 的 `required` 材料是 `raw_requirement`、`objective_facts`、`convergence_outline`、`review_instructions`；`current_selection` 与 `alternatives`/`selection_rationale`/`key_assumptions`/`independent_reconstruction`/`direction_flow` 同列 **`optional`** ⇒ 它是登记在案的合法可选材料 | `runtime/review/stage-materials.json:71-72` |
| C2 | 合法**时机**＝reveal 边界之后：reconstruct 的可见集只有 `raw_requirement`/`objective_facts`，带 `hidden_until: "reveal"`；reveal 的可见集才含 `current_selection` | `skills/wh-review/scripts/review-runner.mjs:64-65`（同一形状在 `review-provider-client.mjs:404-406` 被校验） |
| C3 | 合法**形态**＝「当前选择」本身；答案类内容被明列为禁止交付：拟定方案／推荐方案／方案比较结论、OI 的答案、`selected_disposition`、依据、结论、终态字段、确认分组、`interaction_ref`/`interaction_hash`、decision log、detail 审查结果、已批准方向、spec/plan/diff/代码/测试结果；runner 必须在调用 provider 前把它们排除，命中即 `MATERIAL_FORBIDDEN` | `make-decision.md:42-50` |
| C4 | 反锚定是**双层**设计：①`convergence_outline` 以 questions-only 投影交付、展示状态**统一为 `open`**（`make-decision.md:39-40`；执行侧 `runtime/stage/stage-handlers.mjs:1020` 对 `entry.status !== "open"` 记错）；②reveal 边界把 `current_selection` 挡在 reconstruct 之外（`make-decision.md:56`；`skills/wh-review/scripts/review-materials.mjs:1113-1114` 的审读指令逐字写明 "the reconstruct step must not read current_selection before reveal"）⇒ **被隐藏的对象是 reconstruct 步骤，不是请求本身** | 同左 |
| C5 | 按单请求 combined 形态执行时它**必须有**可 reveal 的当前选择：为空即抛 `TypeError("current_selection is required for direction review")`，且被放进 `reveal.visible` | `review-runner.mjs:43-49`、`:65` |
| C6 | 材料白名单有**模式闸门**：只有 `directionMode ∈ {challenge, combined}` 时才允许它进入可见集；reconstruct-only 形态下它被移出 allowed，提交即 `MATERIAL_FORBIDDEN` | `review-materials.mjs:1985-1998` |
| C7 | 实际派发路径按登记表本身判合法：`review-record` 的预检用 `materialAllowlistForRule(rule)`，`rule` 来自 `stage-materials.json`，**不**经过 C6 的模式闸门 | `skills/wh-review/scripts/simple-review-runner.mjs:709-711`、`:753-760`；`review-materials.mjs:340-356` |

**契约内张力（只登记事实，不改任何代码/config/schema）**：登记表把 `current_selection` 写成 `optional`（`stage-materials.json:72`），而 combined-flow planner 在它为空时抛「required」（`review-runner.mjs:46`）。二者是不同层的判定——前者是**材料授权面**，后者是 **`direction-review.v1` flow 的执行前置**（reveal 需要有可 reveal 的对象）。本节只登记该事实与措辞差异。

### step 6 四轮尝试的逐轮事实

| 轮 | 输入变化 | 结果 | 原件／依据 |
|---|---|---|---|
| 1 | `host_provider=deepseek-flash`（非法） | `REQUEST_INVALID`（`request needs version:4, a non-empty prompt, and a supported host_provider`）、`dispatch_state=blocked_before_dispatch`、**0 provider**；attempt `6ea6b55a-c5e1-518f-aa1b-580c02551f36`，`material_id=e4b6edd46f7e794be2d58b5318ef3af9f6bd4519c80f6b4d7a1a8949ba13c2f0` | `quality/reviews/attempts/6ea6b55a-c5e1-518f-aa1b-580c02551f36/attempt.json`（本步现场读原件） |
| 2 | 改 `host_provider=dsh` | **`reused: true`**：复用第 1 轮的失败 attempt，**未**产生新的 provider 派发 | 复用快路径 `runtime/review/review-record-route.mjs:1194`、`:1213`、`:1240`（`dispatch_state: "reused"`）；本步现场观测 |
| 3 | `retry basis=source_recovered` | `REVIEW_RETRY_NOT_ADMITTED`（`blocked_before_dispatch`）；attempt `243840df-3d19-56bd-afcd-a581e0915e4f`，与第 1 轮**同一** `material_id=e4b6edd4…`、同样 `REQUEST_INVALID`／0 provider | 判据 `review-record-route.mjs:419`、`:467`、`:488-490`、`:1207`；`quality/reviews/attempts/243840df-3d19-56bd-afcd-a581e0915e4f/attempt.json` |
| 4 | 补 `current_selection` 材料 ＋ `retry basis=material_changed` | **放行并成功**：`dispatch_state=dispatched`；red `a775120c-222e-5c14-ac20-43125e5d785b`／blue `8de66c13-5cd1-5cc9-a48b-713f7d5b5fd7`，`material_id=dc7d7f9c1a5cb5bb985e3137c97d6a144a8ca8ef0a53f286d386c47ea8621605`（与 `e4b6edd4…` **不同** ⇒ `material_changed` 得到认证）；6 次派发全 `completed`、`coverage: satisfied`、`partial: false`；墙钟 **5 分 50 秒** | `review-record-route.mjs:483`（`material_changed` 判据＝`attempt.material_id !== materialId`）；`quality/reviews/attempts/a775120c-…/attempt.json`、`8de66c13-…/attempt.json` |

**第 4 轮包内确有该材料的直接证据**：该轮 provider 输出的 finding `path` 逐条指向包内四份材料——`materials/01-raw_requirement.md`、`materials/02-objective_facts.md`、`materials/03-current_selection.md`、`materials/04-convergence_outline.json`（例：kimi/coding 在 `materials/03-current_selection.md:5` 报「对齐 600000 上限」无材料支撑、`:6` 报三条实现 bug 未列名）。⇒ 补进去的 `current_selection` 是作为**独立第 3 份材料**进入 direction 包的，形状与 `stage-materials.json:71-72` 一致（3 份事实材料 ＋ 1 份 OI questions-only 投影）。

**留档限制（如实登记）**：本次落盘的 quality facts **未保留请求侧 `direction-review.v1` 字面**——对 task store 的 `quality/` 全树检索该字面 0 命中，成功 attempt 的 `closure_manifest.prompt_sha256` 为空串哈希 `e3b0c442…`。因此「第 4 轮请求是否携带 R7 要求的 flow 字段」不能由现有原件直接证实；该留档限制不改变下面的 (b) 判定（判定依据是 `current_selection` 的合法形态与时机），本步也**不据此改任何代码**。

### 越界判定：结论 (b) 不越界

**判定对象**：第 4 轮「补 `current_selection` ＋ `retry basis=material_changed`」是否违反 reveal 边界。
**结论：(b) 不越界。** 依据逐条：

1. `current_selection` 在 direction 材料矩阵中就是登记在案的合法材料（C1，`stage-materials.json:72`），并在实际派发路径的闸门下合法（C7，`simple-review-runner.mjs:709-711` → `review-materials.mjs:340-356`）。
2. reveal 边界的确切定义是「`reconstruct` 步骤不得读取 `current_selection`」（R4／C4，`make-decision.md:56`；`review-materials.mjs:1114`），即**单次请求内部的步骤顺序约束**，不是「不得把该材料放进请求」；契约反而要求它在 reveal 之后被呈现（R4／R7，`make-decision.md:56`；`review-runner.mjs:65`；`provider-protocol.md:80-81`）。
3. 第 4 轮提交的是「当前选择」本身（C3 的合法形态），不是 OI 终态记录：包内 OI 侧只有 `materials/04-convergence_outline.json` 的 questions-only 投影，且执行侧强制其状态为 `open`（C4，`stage-handlers.mjs:1020`）；现有 provider finding 也把 `materials/03-current_selection.md` 当作**被审查的方向文本**（在其 `:5-6` 上质疑阈值依据与 bug 未列名），没有 OI 编号处置被一并提交的痕迹。
4. 放行机制与材料可见性无关：第 4 轮被 admit 是因为 `material_changed` 的判据为 `attempt.material_id !== materialId`（`review-record-route.mjs:483`），而第 3 轮被拒是因为 `source_recovered` 的判据要求 `previousRoute === null`（`:488-490`）在本例不成立。⇒ 这是**重试准入判定**，不是 reveal 边界判定；把「补材料才得以重试」读成「靠泄露结论换结果」不成立。

**对 step 6 结论可信度的影响**：**不按带锚定风险处理**。第 6 步的方向审查结论（36 条原始 finding → 20 条去重聚类 ＝ 2 blocking／13 major／5 minor）与 `## 审查处置` 的逐条处置**沿用**，不需标注锚定风险、不需重跑，也不影响下游 consumer 对该结论的引用。

**契约是否要求该流出现在某指定章节**：不要求。必需主章节清单见 `runtime/stage/stage-content-contracts.mjs:50-53`，其中没有该流章节名；契约把它约束在「每个 role request 内部」（R6）。因此**本节的登记即为 D3 的处置**，不另造契约外章节名、不改任何 OI。

### detail-advice（step 10，2026-09-17）

- 命令：`review --action=record --stage=make-decision --project=workflowhub --task=workflowhub-cost-baseline-and-blocker-close-20260917 --input=/tmp/wh-detail-review-request.json`（`timeout 1500`，exit 0）
- 请求契约：`{request:{stage:"make-decision", review_track:"detail", host_provider:"dsh", materials:{raw_requirement, approved_direction, draft_spec_or_acceptance}}}`；**未**提交 `version`/`prompt`（由 runner 生成）、**未**提交 `retry`（detail 轨为首次派发，非重试）
- 提交材料（三项，按 `skills/wh-review/contracts/make-decision.md` 的 detail 口径）：`raw_requirement` 18644 B（`## 原始需求` + 四段 `## 需求权威更新` 逐字）；`approved_direction` 166792 B ＝ 当时 `decision-log.md` 的逐字字节；`draft_spec_or_acceptance` 50172 B（从同一材料机械抽取的 25 条 OI 终态对账表 + 25 条决定链表 + `## Exit checks` + `## 收敛检查`）
> 口径说明（本轮增量决策补记）：上述 18644 B / 166792 B / 50172 B 与「25 条 OI + 25 条决定」是 **step 10 当时提交材料的如实记录**，不随本轮增量决策变动，故保留原值；本材料**当前**的治理计数为 26 条 OI / 26 条决定（见 `## 文档结果`、`## Exit checks`）。
- 角色/provider：red/blue 双角色 × 3 provider（kimi/coding、antigravity/flash、codex/luna），共 6 次 provider 派发
- 墙钟：**6 分 59 秒**（419 s；2026-09-17T03:39:13Z → 03:46:12Z）；**未触发** 20 分钟上限（与 direction 的 5 分 50 秒同为对照基线）
- 结果状态：`status=recorded`、`dispatch_state=dispatched`、`semantic_status=available`、两角色 `coverage=satisfied`，但 **`partial=true`**（`pair_status=partial`、`outcome=partial`）。原因如实留档：**red 轨 `antigravity/flash` 返回 `OUTPUT_INVALID`（"provider output is not valid findings JSON"）**，red 仅 2/3 provider `completed`；blue 轨 3/3 `completed`。按 runner 的 `pairResultIncomplete`（任一 provider 非 completed 即 incomplete）判 `red_incomplete=true` ⇒ 聚合为 **available-with-failures**；**不是 pass，也不是无条件可用**（本步骤同时是 OI-24「格式失败浪费」的现场实例）
- 落点（task store 根 ＝ `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-cost-baseline-and-blocker-close-20260917`，下表路径相对该根）：
  | 项 | red | blue |
  |---|---|---|
  | attempt | `quality/reviews/attempts/d932a693-c14d-53f4-a771-6c29c40e1b19/attempt.json` | `quality/reviews/attempts/a59c58e4-c429-5a97-abf9-59c3adaf9161/attempt.json` |
  | result | `quality/reviews/results/make-decision-simple-d932a693-c14d-53f4-a771-6c29c40e1b19.json` | `quality/reviews/results/make-decision-simple-a59c58e4-c429-5a97-abf9-59c3adaf9161.json` |
  | report | `quality/reviews/reports/make-decision-simple-d932a693-c14d-53f4-a771-6c29c40e1b19.md` | `quality/reviews/reports/make-decision-simple-a59c58e4-c429-5a97-abf9-59c3adaf9161.md` |
  | provider | kimi completed / antigravity **failed(OUTPUT_INVALID)** / codex completed | kimi、antigravity、codex 全 completed |

  - pair：`pair_id=94f8aa15-de6a-48f7-8ce2-aa52f52aea9a`；聚合 report `quality/reviews/reports/make-decision-simple-dcda1afe-e444-5703-ab39-11b474225448.md`（该 report **只含 pair 摘要，不含 findings 数组**，findings 只落在两个 role result 里）
  - 两 attempt 的 `material_id` 一致＝`28d53918608dfa6c59aa814a1b41574ad32f1ea8327f4f23fc894e314ab8f35b`；`snapshot_tree=0295b1a9f9746ba435a873f21def1085f201becd`、`material_revision=revision-7409cfa2dcc257164e2f9fedd6bcd8b043ce2e18dc68aa82e538fc35ff36f71e`
  - facts：`review --action=record` 本身**不写** quality fact；写入前 `quality/facts/c53bc2019db84d9e3afb8af7235e6aed42102421b34c2559aecd1d22602f2aa4.json`（`subject=detail_review`、`status=recorded`）指向的是 **direction 的 red result**（step 6 的 bug）；本步骤 `run --action=execute` 后的核对结果见 `### detail_review 事实指向核对（step 10 实测）`
- 结论摘要：**未给 pass**；41 条原始 finding（red 20 + blue 21），按 runner 自身去重键（`path`+`line`+`issue`）**无任何跨角色重复** ⇒ pair 唯一 41 条；severity 分布 **8 blocking / 26 major / 7 minor**（red 2/14/4；blue 6/12/3）；`evidence_status`＝direct 34 / minor 7；`disposition`＝actionable 34 / nonblocking_minor 7
- **是否方向级**：41 条中**没有任何一条要求改写任一 OI 的 `selected_disposition`**；因此本步骤**不触发方向级重议**，也不启用 conditional talk-round 4 的方向重议路径。其中 3 条 blocking（OI-08 授权表述、OI-18 净减/新 schema 硬约束、OI-19 acceptance ②）与用户在 grill-G2 的裁定直接相互作用，属**验收口径与旧约束同步**，需主会话裁定，但**不改变方向与 OI 处置**。

### 争议处置（detail 轨，step 10）

> 本表**只登记**detail 审查提出的争议。本阶段子代理的处置边界：**只修材料内部自相矛盾、遗漏的定死、登记同步三类**，且**不改变任何 OI 的 `selected_disposition` 方向**；凡属 build-spec/build-code 的实现细节、或已登记的例外，一律保持未修并写明理由。下表「处置」列为空的条目即未修，其理由写在该行「依据／说明」列。

| # | 严重度 | 争议要点（含原始 finding id） | 处置 | 依据／说明 |
|---|---|---|---|---|
| D1 | blocking | OI-08 的 acceptance/counterexample 与 `## 收敛检查` 仍写「3rd-review 仓无写入」「授权仅限 `lib/adapters/antigravity.mjs` 的 A+B 两处」，与 grill-G2 第 1 条扩大授权矛盾（red `F-0116318aaac8`、blue `F-28416e4afdb7`） | **已修（D1）**：OI-08 的 `acceptance` 与 `counterexample` 改为「除本任务显式授权对 `3rd-review` 的改动外不写入该仓」，越界判据改为「超出材料中逐条列明的授权改动清单」并指向 G2 第 5 条；同时在 `## 需求权威更新（用户裁定，2026-09-17 grill-G2）` 新增第 5 条**授权改动清单**（逐条列明 5 个文件与目的，不含行号与代码），使 counterexample 可判定。见 `## 唯一 OI 大纲` OI-08 与 G2 第 5 条 | 已现场复核：原 OI-08 记录确为旧表述；本次按「同步 G2 授权措辞」处置，不改 OI-08 的处置方向 |
| D2 | blocking | 阶段状态自相矛盾：决定标 `approval_status: approved`、25 条 OI 全 `confirmed`，但 `## 最终确认` 为 `pending`、step 8/10/11~14 未闭合（red `F-89184add05eb`、blue `F-d945bbbb0a89`） | **已修（D2）**：`## 阶段步骤登记（make-decision）` 的 step 8 `grill-with-docs` 由 `pending` 改为 `completed`（证据＝`## grill` 五类覆盖表 + G1–G4 与 G2-impl/G2-format/G2-scope-cap 的用户答复）、step 10 `detail-advice` 由 `in_progress` 改为 `completed`（证据＝墙钟 419s、red `d932a693`/blue `a59c58e4` 均 `semantic_status=available`、`partial=true`、41 findings＝8 blocking/26 major/7 minor、聚合 report `quality/reviews/reports/make-decision-simple-dcda1afe-e444-5703-ab39-11b474225448.md`）。`## 最终确认` **保持 `pending`**（step 11 未执行，不得伪造）；step 11~14 保持 `pending` 属事实 | 「approved/confirmed 是材料内逐条处置状态、与 step 11 的用户最终确认是两个不同事实」这一口径现已由 step 11~14 与 `## 最终确认` 的 `pending` 如实留档；不动方向 |
| D3 | blocking | 方向材料未定义受治理的 reconstruct → reveal → challenge 流，也未定义 reveal 前 `current_selection` 必须隐藏的边界（blue `F-42ec762fcc21`；red 同类 major `F-c68879f6e48a`） | **已处置（D3，判定 (b) 不越界）**：契约对该流的确切要求（R1–R11）、`current_selection` 在 direction 轨的合法形态与时机（C1–C7）、step 6 四轮尝试的逐轮事实、越界判定 **(b) 不越界** 及逐条依据，全部写入新章节 `## 方向审查流与 reveal 边界（D3 处置）`；该流是**审查请求构造与执行**的要求（`skills/wh-review/contracts/make-decision.md:55-57,119`；`skills/wh-review/contracts/provider-protocol.md:78-84`），不是 decision-log 的指定章节，故以该节登记即为处置；第 6 步方向审查结论**不按带锚定风险处理**，沿用不变 | 「补 `current_selection` ＋ `material_changed`」＝合法材料（`runtime/review/stage-materials.json:72` 登记为 `optional`；派发预检 `skills/wh-review/scripts/simple-review-runner.mjs:709-711` 按该登记表判合法）＋合法重试判据（`runtime/review/review-record-route.mjs:483` 的 `attempt.material_id !== materialId`）；reveal 边界只约束 `reconstruct` 步骤（`make-decision.md:56`；`skills/wh-review/scripts/review-materials.mjs:1114`），不禁止提交该材料；不改任何 OI 的 `selected_disposition` |
| D4 | blocking | 健康检测方案未闭合用户「有问题立刻停止或重发」：无非终态字段 schema、轮询状态转换、停滞/失败触发条件与「停止/重发」的消费者与责任边界（blue `F-4eb72ddeb660`；red major `F-2f1017802494`） | **已修（D4，方向级）**：在 OI-23 的 `acceptance` 中新增「方向级定义」五项——①必须暴露的成员级真实事实＝成员 `status`/`error.code`/`last_progress_at_ms`（依据 `3rd-review/lib/broker.mjs:617-624` 的 `projectStatus`；`lib/broker.mjs:156-164` 只在 terminal 附 `group`；`assertManagedPublic:169` 拒绝非终态带 group）；②消费者＝`skills/wh-review/scripts/simple-review-runner.mjs:530-542` 的轮询循环（现只读 `current.state`）；③触发语义＝成员进入明确失败态即**立即**可判定，不必等满 `DEFAULT_MANAGED_TERMINAL_WAIT_MS`，且「真卡死」与「健康但慢」可区分（抓手＝`agy` stderr `print timeout` 串，现被 `lib/provider-failure.mjs` 误归 `PROCESS_EXIT_NONZERO`）；④守卫处置＝`3rd-review/test/managed-session-lifecycle.test.mjs:58-71` 的断言须同批改到新边界并写明理由；⑤本阶段不写 schema 形状，字段名/类型/迁移规则归 build-spec/build-code。见 `## 唯一 OI 大纲` OI-23 | 只把**方向级**要求定死（暴露什么事实、谁消费、何时触发、守卫如何演进），不写 schema 形状；响应 direction 与 detail 两轨对 `consumer/触发/责任边界` 的 blocking |
| D5 | blocking | OI-18/D-018 旧硬约束（行数不增、禁新增 schema、只承认 OI-20 一处例外）与 G2「全部塞进本任务」+ `## 净减或持平例外清单` 6 项不可同时满足（blue `F-866c9e2ba31f`、`F-b5fc892389bb`；red major `F-f8209836d756`、`F-015a2e939675`；blue minor `F-16489202c772`、`F-99fb3868a3cd`） | **已修（D5）**：①OI-18 的 `acceptance` 改为「除 `## 净减或持平例外清单` 逐条列明的例外外，每条修复净减或持平」，`counterexample` 改为「清单**之外**的净增，或把删除换成搬家/改名/加统一层即判失败」，并删去「无新增 schema」绝对表述；②D-018 的 `selected_option`/`facts_and_constraints` 同步指向该清单为唯一例外边界（原「仅一处例外」已更正）；③例外清单由 6 条补到 **8 条**（新增 OI-23 协议演进的测试面变更、OI-24 `redactProviderHostPaths` 正则修正）；④G2 第 3 条同步注明清单须逐条枚举。见 `## 唯一 OI 大纲` OI-18、`## 决定` D-018、`## 净减或持平例外清单` | 用户已在 G2 主动取消净减上限；本次为同步而非改方向，OI 处置方向与 D-018 的方向均未变 |
| D6 | major | 超时错误码两名并存：D-019/OI-19 要求 `PROVIDER_PRINT_TIMEOUT`，OI-23 acceptance 要求归类 `PROCESS_TIMEOUT`（red `F-6b7bb058468e`、blue `F-47c320c76670`） | **登记待处置（未修复）** | 需二选一并写出映射 |
| D7 | major | 源漂移处置互斥：OI-11 要求调用 `cancelManaged`，OI-10/OI-23 又否决接通该路径（red `F-7cfac7db5087`、blue `F-0f4649c2769f`） | **登记待处置（未修复）** | 与既有测试断言（断言该路径绝不调用）相关，须与 OI-10 的否决理由合并陈述 |
| D8 | major | OI-19 acceptance ②「antigravity 真实审查成功率从 2/14 恢复」无阈值、不可证伪，违反 D-007/OI-07 的可观察验收口径（red `F-24195a74cf9e`、`F-f3f6555a8960`；blue `F-afab5c308786`、`F-dbf61a785d44`） | **登记待处置（未修复）** | 需替换为有确定性命令/退出码的判据；不改 OI-19 的 `selected_disposition` |
| D9 | major | OI-05 按签名的失败分类合计 31 次，与 OI-03 evidence 声明的一手总量「72 attempt / 24 failed」矛盾（red `F-c226741c7d33`、blue `F-8a799653dfa2`） | **登记待处置（未修复）** | 两个口径需调和或标注口径差异 |
| D10 | major | OI-21 未给出 quality fact 的真实写入点/触发条件，把关键设计推到实现阶段，却在 `## 未决项` 称无未决（red `F-6ca7822e1b97`、blue `F-95c5688e9d40`） | **已修（D10，与 G/G. 同批）**：OI-21 的 `evidence` 与 D-021 的 `facts_and_constraints`/`logic` 已写入 step 10 实测查清的真实触发条件与文件:行号（`runtime/stage/stage-runner.mjs:1595` 回退、`:1638-1643` 取 `evidence_refs` 首条引用、`reviewEvidenceStatus:1693-1753` 对 make-decision 不校验 `review_track`），并记录 `quality/facts/` 每个 review subject 现存两条冲突事实的副作用；OI-21 的 `acceptance` 增加「两轨事实各自绑定本轨 result」「无本轨 result 时不得回落」「同一 subject 不得并存两条冲突事实」三项 | 设计已从「推到实现阶段」变为已定位到具体行与具体触发条件；`## 未决项` 的「无未决」据此成立（剩余为实现细节） |
| D11 | major | 派发前预检范围（model id、CLI 可执行性、认证、活性）只有非法 `host_provider` 有可判据，其余四项无数据源/命令/超时/错误码（red `F-81f87c75d8ff`、blue `F-a2443d598a00`） | **登记待处置（未修复）** | OI-22 acceptance 需补齐逐项判据 |
| D12 | major | 格式宽容缺确定性规则（歧义抽取、多候选 findings、JSONL 混合有效/无效记录）（red `F-d7a389ecfa27`） | **登记待处置（未修复）** | 与 OI-24 丙类 7 条红线边界直接相关；本步骤 red/antigravity 的 `OUTPUT_INVALID` 即现场样本 |
| D13 | major | OI-25 要求新增持久 attempt 字段，却未指定字段名/类型/枚举/生产者/唯一 consumer/历史兼容与迁移规则（red `F-e98d8633a90a`、blue `F-c085e273aebd`） | **登记待处置（未修复）** | 与 OI-18「禁新增 schema」形成额外实现风险（同 D5 源） |
| D14 | major | 延期文件交付物三处表述不一致、且不在提交材料中（red `F-e4e4d922f1fe`、blue `F-7e169eec80f2`） | **登记待处置（未修复）** | 仓外交付物按契约不入审查 bundle；但材料内三处表述需统一 |
| D15 | major | D-008/OI-08 仍声明「不改外部审查仓」，与后续已批准 G2 授权冲突（blue `F-019e0267204e`） | **登记待处置（未修复）** | 同 D1 源 |
| D16 | major | G1/G3/G4 被当作用户裁定使用，但提交的 raw authority 无这些答复，也无对应 `source_exact_excerpt`/`approval_hash`（blue `F-e4546823acf5`） | **登记待处置（未修复）** | 需把 G1/G3/G4 原话补入 `## 需求权威更新` 并回填 approval 字段，或降为未决项 |
| D17 | minor | OI-20 行数账目内部不一致（已写「8 文件 9 行值替换」，其自身枚举只有 4 个文件）（red `F-645d7bc4ecf4`、`F-9df331856d3e`） | **登记待处置（未修复）** | 净减/持平账目需重算 |
| D18 | minor | 声称 OI-13 `selected_disposition` 首项文本被损坏/吞字（red `F-b6c6b91fcb38`、blue `F-199645b598b2`） | **不采纳为材料缺陷**；核为审查 bundle 的**脱敏伪影**；该伪影已并入 OI-24 甲类修掉（见「附带发现」） | 现场复核：`skills/wh-review/scripts/review-materials.mjs:426` 的 `LOCAL_HOST_PATH` 正则字符集 `[^\s"'`<>()[\]{}]+` 不含 CJK 标点，会把路径后的中文一路吞到下一个空格，使「并把「更新 `/Users/…/workflowhub-deferred-items-20260915.md`」列为正式交付物。取消理由：DEF-01 …」变成「…更新 `<host-path-redacted>` 零 consumer 导出…」；原始材料该处完整。原始材料问题记为 wh-review 脱敏越界，已并入 OI-24 甲类并在其 `acceptance` 给出可复现判据 |
| D19 | minor | 阶段步骤登记自相矛盾：step 8 标 `pending` 而 grill 一节自称已完成；step 10 行引用了尚不存在的 `### detail-advice` 子节（red `F-dc9e03f8ee2d`） | **已修（D19）**：`### detail-advice（step 10，2026-09-17）` 子节已在上一轮写入，悬空引用不再存在；step 8 由 `pending` 改为 `completed`（证据＝`## grill` 五类覆盖表与 G1–G4、G2-impl/G2-format/G2-scope-cap 的用户答复），step 10 由 `in_progress` 改为 `completed`（证据见该行） | 本步骤的直接产物；step 8 的完成事实由 `## grill` 章节与 G2 章节逐字留档支撑，非 agent 代写 |
| D20 | minor | `## 未决项` 说明仍把 RK-1 写成条件式（「若根因只能在 3rd-review 内修复…」），而该条件已由 talk-round-4 裁定解除（blue `F-13bbe9116082`） | **登记待处置（未修复）** | 属文本同步 |

### `detail_review` 事实指向核对（step 10 实测）

- `review --action=record` 本身**不写** quality fact（11:46 的 detail review 记录后 `quality/facts/` 无新增文件）；review 事实由 `run --action=execute` 派生。
- 复测命令：`run --action=execute --stage=make-decision --project=workflowhub --task=workflowhub-cost-baseline-and-blocker-close-20260917 --input=/tmp/wh-step10-run-input.json`，输入**只带** `receipts.detail_review = quality/reviews/results/make-decision-simple-d932a693-c14d-53f4-a771-6c29c40e1b19.json`。exit 0、墙钟 **10 秒**（2026-09-17T03:48:43Z → 03:48:53Z）；`completion.status=in_progress`、`quality_status=incomplete`、仍缺 `outline_closed` 与 `human_confirmation` ⇒ **未提前收口，也未发布阶段完成**。
- 写入前状态（step 6 的 bug，实测确认）：`quality/facts/c53bc2019…json`（`subject=detail_review`、`status=recorded`）→ `quality/reviews/results/make-decision-simple-a775120c-…json`（**direction 轨的 red result**），而 detail review 当时并未运行。
- 写入后状态（本次实测）：
  - `quality/facts/31dac84c23b64a7ab32e5c252b17f1e0eb6010a3095c722150e98b37df2f6b9b.json`（`subject=detail_review`、`status=recorded`）→ `quality/reviews/results/make-decision-simple-d932a693-c14d-53f4-a771-6c29c40e1b19.json` = **本次 detail 的 red result（正确）**
  - `quality/facts/098dab2c84e1b42aa8d3177981b6a0bf58b7227914f7949130a7d268739ab40a.json`（`subject=direction_review`、`status=recorded`）→ **同一个 detail result（错误）**，而本次**未提交任何 direction receipt**
- **结论：bug 复现，且触发条件被修正**。它**不是**「只传 direction 才触发」，而是**「哪个轨缺 `receipts.<track>_review`，哪个轨的 review 事实就会落到 `evidence_refs` 中第一条 `quality/reviews/results/` 引用上，且不校验 `review_track`」**。机制：`runtime/stage/stage-runner.mjs:1595` 的 `evidenceCandidate` 在 `facts.reviews.direction|detail` 无 `result_ref/attempt_ref/hash` 时回退到 `result.evidence_refs` 的首条 `quality/reviews/results/`（`stage-runner.mjs:1638-1643`）；`reviewEvidenceStatus`（`stage-runner.mjs:1693-1753`）只对 verify-code/build-code 校验快照与 subject，对 make-decision **不校验 `review_track`**。
- step 6 的现象（只传 direction ⇒ `detail_review` 事实指向 direction result）与本步骤现象（只传 detail ⇒ `direction_review` 事实指向 detail result）是**同一机制的镜像**；因此「只传 direction 才触发」的假设被**证伪**。
- 副作用如实留档（本步骤 `run --action=execute` 的落盘）：覆写了 `facts.jsonl` 的唯一 stage 行（`created_at 2026-09-17T03:48:50.643Z`、`material_digest 5d7abd58…`、`layer_states.stage_quality=incomplete`）；新增 15 个 `quality/facts/*.json`、11 个 `quality/evidence/acceptance|stage-quality/make-decision/*.json` + 1 个 `quality/evidence/stage-quality-missing/…/human_confirmation-….json`、`identity/executions/8c938ed3-61ce-4e3a-ae8f-298e6112689d.json`、`quality/evidence/stage-reflection-availability/334bfdc9….json`（`state=unavailable`、`reason_code=executor_absent`）。**未被改写**：旧的 `direction_review` 事实 `deb32b6c…`（→ direction result）与旧的 `detail_review` 事实 `c53bc2019…`（→ direction result）仍原样保留，于是 `quality/facts/` 现存**两套互相冲突的 review 事实**（每个 subject 两条、指向不同 result）——此为本次实测新增的质量事实歧义，如实登记。

### 附带发现（本步骤现场实测，非本任务范围）

- **wh-review 宿主路径脱敏越界**：`skills/wh-review/scripts/review-materials.mjs` 的 `LOCAL_HOST_PATH` 正则用 `[^\s"'`<>()[\]{}]+` 作为路径字符集，**不含 CJK 标点**，因此路径后紧跟的中文会被一路吞进 `<host-path-redacted>` 直到下一个空格/引号。现场复现：对当前 `decision-log.md` 调用 `redactProviderHostPaths`，`host-path-redacted` 出现 24 次、总字节 −1196，且脱敏后文本中 `取消理由：` 与 20 处 `DEF-01` 中的 1 处**消失**（被并入脱敏片段）。
- 该伪影被 detail 审查如实报为材料缺陷（D18），故本步骤**不据此改材料**；如实登记为 wh-review 侧缺陷证据。
- **已并入 OI-24（本阶段处置）**：该条作为 OI-24 的**甲类**条目写入其 `selected_disposition` 与 `facts_and_constraints`（只收紧字符集/边界，不改任何 fail-closed 红线），并在其 `acceptance` 中给出可复现判据；相应新增面登记于 `## 净减或持平例外清单`。D18 的「不采纳为材料缺陷」结论不变——材料本身无损坏。


## 风险与延期交接

### 风险

| # | 风险 | 影响 | 处置 |
|---|---|---|---|
| RK-1 | ~~antigravity 根因可能位于外部仓 `3rd-review`，与既存非目标冲突~~ **已由用户 talk-round-4 裁定解除**：授权两处最小修复 | 用户已裁定；剩余风险＝该仓改动需单独验收 | 边界见 `## 需求权威更新（用户裁定，2026-09-17 talk-round-4）`；`3rd-review` 侧验收单独登记 |
| RK-2 | `runTaskBoundE2eReview` 的删除若存在未被发现的测试/工具 consumer，会打断既有能力 | 回归 | 删除前必须先做 consumer 扫描与安全不变式证明（审查 #6 的要求） |
| RK-3 | 对齐 skill 声明哈希 = 把 `25b44430` 那批未经审查的字节正式接受为基线 | 若该批字节本身有误，等于把错误固化 | 材料明写「基线接受」；C2 回退被硬反例否决 |
| RK-4 | 补回 outcome 披露措辞使净行数 +10，突破「净减或持平」 | 与硬规则冲突 | 已在 OI-20 与 `## 决定` 中登记为显式例外，由用户认可 |
| RK-5 | 修 `simple-review-runner.mjs` 会改动 `skills/wh-review/`，必须同步重算 bundle 与 catalog 哈希 | 否则改完检查仍红 | 与 OI-20 的 C1 同批执行，不可拆开 |
| RK-6 | 本阶段实测 direction review 仅 5m50s、未触发 20 分钟上限 | 20 分钟空等的成本可能被高估 | 已如实记录为对照基线；OI-04 只消除「白等」与「被钉死」，不动阈值 |
| RK-7 | 历史断言「重采重跑 8 次 / 37.9 分钟」无可复核原件 | 不得作为收益基线 | 材料中标注「无原件不可复核」 |
| RK-8 | 范围上限由用户在本轮主动取消（「全部塞进本任务」），改动面显著扩大 | 这是本仓历史上同类任务失控的已知形态：范围一旦不设上限，修复易演化成机制加法 | 以 `## 净减或持平例外清单` 逐条锁边界；清单外的改动仍受 D-018 净减或持平约束；每条例外写明删除条件 |
| RK-9 | `3rd-review` 公开信封演进需跨两仓同步：新字段先落 BR、旧 WH 尚未容忍 | 旧 WH 遇到新 BR 字段可能直接判 `PUBLIC_RESULT_INVALID`，造成新的误杀 | 同一批改动内先让 WH 容忍额外键（OI-24 乙类）、再让 BR 发布新字段；两仓测试同批跑通后才算闭合 |
| RK-10 | 需求3 是方向性转向，与历史立场相反 | 与 `specs/archive/workflowhub-review-flow-repair-20260906/decision-log.md:85,156` 及既有反向断言（`runtime/review/review-output.mjs:33-34`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs:384,391-399`）冲突；若只改断言不写理由即为掩盖 | 反向断言的修改必须写明理由与新边界；丙类 7 条红线可用 diff 验证未被改动 |
| RK-11 | 本增量决策**本身会再触发一次重绑**（材料被改写 ⇒ 既有确认与交互聚合失效）——这正是根因的现场演示 | 若不一次性写入，会重复本任务已实测的 4 次确认 / 3 次聚合 / 164 文件形态，把「治重绑」变成「再制造一次重绑」 | 处置：一次性写入 + 一次性重绑；本轮窗口的 67.4 min / 164 文件 / 4 次确认作为 F1 的对照基线，供 build-code 验收「此后同类收口只发生一次确认与一次聚合」 |
| RK-12 | D4 改变确认完整性语义（读侧对称后，仅在 `decision-log.md` 实质改动时确认才失效） | 语义变更面；反例＝用户确认后又实质改主意而旧确认仍被复用 | 已获用户明确授权（选项原文「再做 D4（读侧对称，需接受完整性语义变更 + 改一个测试断言）」）；`decision-log.md` 实质改动仍使确认失效的边界不放宽，并有 `tests/contract/human-confirmation-v3.test.mjs` 的针对性断言与材料登记共同守卫 |

### 延期交接

本任务的延期项交接**唯一载体**为仓外文件 `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`，且该文件更新为**本任务的正式交付物之一**（OI-13、OI-16）。

- DEF-01~DEF-07：全部判「取消」，逐条写入「取消理由 + 重新考虑的触发条件 + owner」。
- DEF-08（新增）：登记「唯一验收账本 = `acceptance_criterion` facts」这一边界，纯文字、零成本。
- DEF-09（新增）：删除 `tests/e2e/ui-e2e-contract-dogfood.test.mjs:223` 残留的 `quality-verify.v1` 字面量；在本任务内闭合。
- 跨仓三项（终止/判死原语、达标即产出、迟到结果处置）：**不进入本任务通过判据**；其 owner 为 3rd-review 独立任务。
- **禁止**出现「零延期」式声明；`## 非目标` 与延期文件必须逐条一致。
